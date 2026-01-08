
import React, { useState, useEffect, useMemo } from 'react';
import CommonSpace from './components/CommonSpace';
import { UserFigure } from './types';
import { getPoeticLocation } from './services/geminiService';
import { fetchCountryFromCoords } from './services/locationService';

const INITIAL_USERS = 12;

// Mock user pool now only contains coordinates, mimicking real server data
const MOCK_USER_POOL = [
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Cairo', lat: 30.0444, lng: 31.2357 },
  { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Moscow', lat: 55.7558, lng: 37.6173 },
  { name: 'Cape Town', lat: -33.9249, lng: 18.4241 },
  { name: 'Seoul', lat: 37.5665, lng: 126.9780 },
  { name: 'Mexico City', lat: 19.4326, lng: -99.1332 },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018 },
  { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
  { name: 'Istanbul', lat: 41.0082, lng: 28.9784 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Lagos', lat: 6.5244, lng: 3.3792 },
];

export type PoseType = 'walking_left' | 'walking_right' | 'standing_casual' | 'standing_tall' | 'profile';

export interface RealisticUserFigure extends UserFigure {
  pose: PoseType;
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
  const [blurAmount, setBlurAmount] = useState(50); 
  const [glassOpacity, setGlassOpacity] = useState(20);
  const [baseSpeed, setBaseSpeed] = useState(2.2); // Increased default flow pace
  const [figures, setFigures] = useState<RealisticUserFigure[]>([]);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(INITIAL_USERS.toString());
  const [locationName, setLocationName] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  const [countryCache, setCountryCache] = useState<Record<string, string>>({});

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        const name = await getPoeticLocation(latitude, longitude);
        setLocationName(name);
      }, (error) => {
        console.warn("Geolocation access denied or failed. Using fallback coordinates.", error);
        setCoords({ lat: 37.7749, lng: -122.4194 });
      });
    }
  }, []);

  // Effect to resolve country names deterministically
  useEffect(() => {
    const resolveNewCountries = async () => {
      const uniqueMocksToResolve = MOCK_USER_POOL
        .slice(0, Math.min(onlineCount, MOCK_USER_POOL.length))
        .filter(mock => !countryCache[mock.name]);

      for (const mock of uniqueMocksToResolve) {
        // Deterministic fetch from OpenStreetMap Nominatim
        const country = await fetchCountryFromCoords(mock.lat, mock.lng);
        setCountryCache(prev => ({ ...prev, [mock.name]: country }));
        
        // Respecting OSM rate limit of 1 req/sec for mock pool resolution
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
    };
    resolveNewCountries();
  }, [onlineCount]);

  useEffect(() => {
    if (!coords) return;

    const visualCount = Math.min(onlineCount, 120); 
    
    const userDistances = Array.from({ length: visualCount }).map((_, i) => {
      const mock = MOCK_USER_POOL[i % MOCK_USER_POOL.length];
      const jitterLat = (Math.random() - 0.5) * 0.1;
      const jitterLng = (Math.random() - 0.5) * 0.1;
      const dist = calculateHaversineDistance(coords.lat, coords.lng, mock.lat + jitterLat, mock.lng + jitterLng);
      return { dist, index: i, mockName: mock.name };
    });

    const distances = userDistances.map(ud => ud.dist);
    const minDist = Math.min(...distances);
    const maxDist = Math.max(...distances);
    const range = maxDist - minDist || 1;

    const newFigures: RealisticUserFigure[] = userDistances.map((ud) => {
      const normalizedFactor = (ud.dist - minDist) / range;
      const D = 0.5 + (normalizedFactor * 9.5);
      
      const baseScale = 2 / D;
      const alpha = 0.38;
      const opacity = Math.exp(-alpha * D);
      const invD2 = 1 / (D * D);
      const speed = baseSpeed * invD2;

      const r = Math.random();
      let activity: 'walking' | 'standing' = 'walking';
      let direction: 'left' | 'right' = 'right';
      let pose: PoseType;

      if (r < 0.45) {
        activity = 'walking';
        direction = 'left';
        pose = 'walking_left';
      } else if (r < 0.85) {
        activity = 'walking';
        direction = 'right';
        pose = 'walking_right';
      } else {
        activity = 'standing';
        direction = Math.random() > 0.5 ? 'left' : 'right';
        const stationaryPoses: PoseType[] = ['standing_casual', 'standing_tall', 'profile'];
        pose = stationaryPoses[Math.floor(Math.random() * stationaryPoses.length)];
      }

      return {
        id: `user-${ud.index}-${Math.random()}`,
        x: Math.random() * 100,
        y: 100, 
        scale: baseScale,
        opacity: opacity, 
        speed: speed,
        direction,
        activity,
        pose,
        country: countryCache[ud.mockName] || 'Locating...',
        bodyWidth: 0.85 + Math.random() * 0.2, 
        torsoHeight: 1.1 + (Math.random() * 0.3), 
        legHeight: 1.0, 
        headSize: 1.0,
      };
    });

    setFigures(newFigures);
  }, [onlineCount, baseSpeed, coords, countryCache]);

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
      <div className="absolute inset-0 bg-[#fdfdfd] pointer-events-none"></div>

      <CommonSpace 
        figures={figures} 
        blurAmount={blurAmount}
        glassOpacity={glassOpacity}
      />

      <div className="absolute top-10 left-10 z-50 pointer-events-none flex flex-col gap-1 max-h-[60vh] overflow-hidden">
        <h2 className="text-[9px] font-bold uppercase tracking-[0.4em] text-neutral-400 opacity-60 mb-2">Origins</h2>
        <div className="flex flex-col gap-0.5">
          {countryCounts.map(([country, count], i) => (
            <div key={country} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-700" style={{ animationDelay: `${i * 50}ms` }}>
              <span className={`text-[8px] font-light uppercase tracking-[0.2em] transition-opacity duration-1000 ${country === 'Locating...' ? 'text-neutral-300 italic opacity-20' : 'text-neutral-500 opacity-40'}`}>
                {country}
              </span>
              {count > 1 && country !== 'Locating...' && (
                <span className="text-[7px] font-mono text-neutral-300 opacity-30">
                  ×{count}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30 gap-2">
        {locationName && (
          <h1 className="text-[11px] font-light uppercase tracking-[0.6em] text-neutral-800 opacity-[0.2] select-none text-center animate-in fade-in duration-[4000ms] leading-[2.5] max-w-[40%] break-words">
            {locationName}
          </h1>
        )}
        {coords && (
          <p className="text-[9px] font-light tracking-[0.4em] text-neutral-600 opacity-[0.15] select-none text-center animate-in fade-in duration-[5000ms]">
            {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E
          </p>
        )}
      </div>

      <div className="absolute top-10 right-10 z-50 pointer-events-none">
        <span className="text-[11px] font-light uppercase tracking-[0.3em] text-neutral-500 opacity-40">
          {onlineCount} souls nearby
        </span>
      </div>

      <div className="absolute bottom-10 left-10 z-50 flex flex-col items-start gap-4">
        <button 
          onClick={() => setIsControlsOpen(!isControlsOpen)}
          className="px-4 py-2 rounded-full border border-black/5 bg-white/10 backdrop-blur-xl flex items-center gap-2 hover:bg-white/30 transition-all text-[9px] uppercase tracking-[0.2em] text-neutral-400 shadow-sm"
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
              <label className="text-[8px] uppercase tracking-[0.3em] text-neutral-500 font-bold">Diffusion</label>
              <input 
                type="range" min="0" max="150" value={blurAmount}
                onChange={(e) => setBlurAmount(parseInt(e.target.value))}
                className="w-full accent-neutral-400"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[8px] uppercase tracking-[0.3em] text-neutral-500 font-bold">Frosting</label>
              <input 
                type="range" min="0" max="80" value={glassOpacity}
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
