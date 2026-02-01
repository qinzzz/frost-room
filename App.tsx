
import React, { useState, useEffect, useMemo } from 'react';
import CommonSpace from './components/CommonSpace';
import { UserFigure } from './types';
import { getPoeticLocation } from './services/geminiService';
import { fetchCountryFromCoords } from './services/locationService';

import { socketService } from './services/socketService';
import { ASSET_URLS, ASSETS } from './services/figureAssets';

const INITIAL_USERS = 0;

export interface RealisticUserFigure extends UserFigure {
  country: string;
}

const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const App: React.FC = () => {
  const [onlineCount, setOnlineCount] = useState(INITIAL_USERS);
  const [blurAmount, setBlurAmount] = useState(8);
  const [glassOpacity, setGlassOpacity] = useState(20);
  const [baseSpeed, setBaseSpeed] = useState(2.2);
  const [figureScale, setFigureScale] = useState(3);
  const [figures, setFigures] = useState<RealisticUserFigure[]>([]);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(INITIAL_USERS.toString());
  const [locationName, setLocationName] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);

  const [countryCache, setCountryCache] = useState<Record<string, string>>({});

  // Socket connection and listeners
  useEffect(() => {
    socketService.connect();

    socketService.onCountUpdate((count) => {
      setOnlineCount(count);
      setInputValue(count.toString());
    });

    socketService.onUsersUpdate((users) => {
      // Filter out self if needed, but for visual density we can keep all
      setRemoteUsers(users);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        // Update location on server
        socketService.updateLocation(latitude, longitude);

        const name = await getPoeticLocation(latitude, longitude);
        setLocationName(name);
      }, (error) => {
        console.warn("Geolocation access denied or failed. Using fallback coordinates.", error);
        const fallback = { lat: 37.7749, lng: -122.4194 };
        setCoords(fallback);
        socketService.updateLocation(fallback.lat, fallback.lng);
      });
    }
  }, []);

  // Effect to resolve country names deterministically
  useEffect(() => {
    const resolveNewCountries = async () => {
      const usersToResolve = remoteUsers.filter(u => !countryCache[u.id]);

      for (const user of usersToResolve) {
        const country = await fetchCountryFromCoords(user.lat, user.lng);
        setCountryCache(prev => ({ ...prev, [user.id]: country }));
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
    };
    resolveNewCountries();
  }, [remoteUsers]);

  const figureMetadata = React.useRef<Record<string, Partial<RealisticUserFigure>>>({});

  useEffect(() => {
    if (!coords) return;

    // Combine actual users with ghost users to match onlineCount density
    const actualUsers = remoteUsers;
    const totalNeeded = Math.min(120, onlineCount);
    const combinedUsers = [...actualUsers];

    // Add ghost users if needed
    if (combinedUsers.length < totalNeeded) {
      const ghostsCount = totalNeeded - combinedUsers.length;
      for (let i = 0; i < ghostsCount; i++) {
        // Use deterministic offsets to keep ghosts stable
        const angle = i * 137.5; // Golden angle
        const radius = Math.sqrt(i + 1) * 2.0; // Geographic degree offset roughly
        combinedUsers.push({
          id: `ghost-${i}`,
          lat: coords.lat + (radius * Math.cos(angle * Math.PI / 180) * 0.1),
          lng: coords.lng + (radius * Math.sin(angle * Math.PI / 180) * 0.1),
          isGhost: true
        } as any);
      }
    }

    const visualUsers = combinedUsers.slice(0, 120);

    const userDistances = visualUsers.map((user, i) => {
      const dist = calculateHaversineDistance(coords.lat, coords.lng, user.lat, user.lng);
      return { dist, index: i, userId: user.id, isGhost: (user as any).isGhost };
    });

    if (userDistances.length === 0) {
      if (figures.length > 0) setFigures([]);
      return;
    }

    const distances = userDistances.map(ud => ud.dist);
    const minDist = Math.min(...distances);
    const maxDist = Math.max(...distances);
    const range = maxDist - minDist || 1;

    const newFigures: RealisticUserFigure[] = userDistances.map((ud) => {
      const normalizedFactor = (ud.dist - minDist) / range;
      // Narrow the depth range to compress scale differences
      const D = 1.2 + (normalizedFactor * 3.3);

      // Compressed scale range (was 2/D)
      // Compressed scale range (was 2/D) - Adjustable via figureScale state
      const baseScale = figureScale / D;

      const alpha = 0.25; // Gentler opacity falloff
      const opacity = Math.exp(-alpha * D);

      const speedFactor = 1 / Math.sqrt(D); // Flatter speed curve
      const speed = baseSpeed * speedFactor;

      // Get or create persistent metadata for this user
      if (!figureMetadata.current[ud.userId]) {
        const assetIndex = Math.floor(Math.random() * ASSETS.length);
        const asset = ASSETS[assetIndex];

        figureMetadata.current[ud.userId] = {
          x: Math.random() * 100,
          activity: asset.activity,
          direction: asset.direction,
          bodyWidth: 0.85 + Math.random() * 0.2,
          torsoHeight: 1.1 + (Math.random() * 0.3),
          assetIndex: assetIndex
        };
      }

      const meta = figureMetadata.current[ud.userId];

      return {
        id: `user-${ud.userId}`,
        x: meta.x!,
        y: 100,
        scale: baseScale,
        opacity: opacity,
        speed: speed,
        direction: meta.direction!,
        activity: meta.activity!,
        country: ud.isGhost ? 'Atmosphere' : (countryCache[ud.userId] || 'Locating...'),
        bodyWidth: meta.bodyWidth!,
        torsoHeight: meta.torsoHeight!,
        legHeight: 1.0,
        headSize: 1.0,
        assetIndex: meta.assetIndex,
      };
    });

    setFigures(newFigures);
  }, [remoteUsers, onlineCount, baseSpeed, figureScale, coords, countryCache]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setOnlineCount(Math.min(1000, Math.max(0, num)));
    }
  };

  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    figures.forEach(f => {
      counts[f.country] = (counts[f.country] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [figures]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#ffffff]">
      {!coords && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white">
          <div className="text-[10px] uppercase tracking-[0.5em] text-neutral-400 animate-pulse">
            Connecting to atmosphere...
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-[#fdfdfd] pointer-events-none"></div>

      <CommonSpace
        figures={figures}
        blurAmount={blurAmount}
        glassOpacity={glassOpacity}
      />

      <div className="absolute top-10 left-10 z-50 pointer-events-none flex flex-col gap-1 max-h-[60vh] overflow-hidden">
        <h2 className="text-[9px] font-bold uppercase tracking-[0.4em] text-neutral-400 opacity-80 mb-2">Origins</h2>
        <div className="flex flex-col gap-0.5">
          {countryCounts.map(([country, count], i) => (
            <div key={country} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-700" style={{ animationDelay: `${i * 50}ms` }}>
              <span className={`text-[8px] font-light uppercase tracking-[0.2em] transition-opacity duration-1000 ${country === 'Locating...' ? 'text-neutral-300 italic opacity-60' : 'text-neutral-500 opacity-70'}`}>
                {country}
              </span>
              {count > 1 && country !== 'Locating...' && (
                <span className="text-[8px] font-mono text-neutral-300 opacity-70">
                  ×{count}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30 gap-2">
        {locationName && (
          <h1 className="text-[11px] font-light uppercase tracking-[0.6em] text-neutral-800 opacity-[0.5] select-none text-center animate-in fade-in duration-[4000ms] leading-[2.5] max-w-[40%] break-words">
            {locationName}
          </h1>
        )}
        {coords && (
          <p className="text-[9px] font-light tracking-[0.4em] text-neutral-600 opacity-[0.3] select-none text-center animate-in fade-in duration-[5000ms]">
            {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E
          </p>
        )}
      </div>

      <div className="absolute top-10 right-10 z-50 pointer-events-none">
        <span className="text-[11px] font-light uppercase tracking-[0.3em] text-neutral-500 opacity-70">
          {onlineCount} souls nearby
        </span>
      </div>

      <div className="absolute bottom-10 left-10 z-50 flex flex-col items-start gap-4">
        <button
          onClick={() => setIsControlsOpen(!isControlsOpen)}
          className="px-4 py-2 rounded-full border border-black/5 bg-white/10 backdrop-blur-xl flex items-center gap-2 hover:bg-white/30 transition-all text-[9px] uppercase tracking-[0.2em] text-neutral-500 shadow-sm"
        >
          <i className={`fas ${isControlsOpen ? 'fa-minus' : 'fa-gear'}`}></i>
          {isControlsOpen ? 'Close' : 'Adjust Atmosphere'}
        </button>

        {isControlsOpen && (
          <div className="p-6 bg-white/20 backdrop-blur-3xl border border-white/20 rounded-[2rem] flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl min-w-[280px]">
            <div className="flex flex-col gap-1 mb-2">
              <span className="text-[7px] text-neutral-400 tracking-[0.1em] uppercase">Deterministic API: BigDataCloud</span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[8px] uppercase tracking-[0.3em] text-neutral-500 font-bold">Density</label>
              <input
                type="number"
                value={inputValue}
                onChange={handleInputChange}
                className="bg-transparent border-b border-black/10 focus:border-black/30 outline-none py-1 text-xs w-full transition-colors text-neutral-600 font-mono"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[8px] uppercase tracking-[0.3em] text-neutral-500 font-bold">Figure Size</label>
              <input
                type="range" min="0.5" max="6.0" step="0.1" value={figureScale}
                onChange={(e) => setFigureScale(parseFloat(e.target.value))}
                className="w-full accent-neutral-400"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[8px] uppercase tracking-[0.3em] text-neutral-500 font-bold">Diffusion</label>
              <input
                type="range" min="0" max="50" value={blurAmount}
                onChange={(e) => setBlurAmount(parseInt(e.target.value))}
                className="w-full accent-neutral-400"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[8px] uppercase tracking-[0.3em] text-neutral-500 font-bold">Frosting</label>
              <input
                type="range" min="0" max="50" value={glassOpacity}
                onChange={(e) => setGlassOpacity(parseInt(e.target.value))}
                className="w-full accent-neutral-400"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[8px] uppercase tracking-[0.3em] text-neutral-500 font-bold">Flow Pace</label>
              <input
                type="range" min="0.1" max="8.0" step="0.1" value={baseSpeed}
                onChange={(e) => setBaseSpeed(parseFloat(e.target.value))}
                className="w-full accent-neutral-400"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
