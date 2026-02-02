
import React, { useState, useEffect, useMemo } from 'react';
import CommonSpace from './components/CommonSpace';
import { UserFigure } from './types';
import { getPoeticLocation } from './services/geminiService';
import { fetchCountryFromCoords } from './services/locationService';
import { fetchWeather } from './services/weatherService';
import { WeatherCondition, WeatherIntensity } from './types';

import { socketService } from './services/socketService';
import { ASSET_URLS, ASSETS, CITY_ASSETS } from './services/figureAssets';
// Audio files are now loaded from /public/sounds/ via URL string


const INITIAL_USERS = 0;

export interface RealisticUserFigure extends UserFigure {
  country: string;
}

export interface TimeTheme {
  name: string;
  background: string[];
  glow: string;
  accent: string;
  text: string;
  subText: string;
}

const THEMES: Record<string, TimeTheme> = {
  dawn: {
    name: 'Dawn',
    background: ['#805690', '#f89e9d', '#fdf1cd'],
    glow: '#f9dc90',
    accent: '#d46f93',
    text: '#2e1832', // Deep purple
    subText: '#5d3b66'
  },
  day: {
    name: 'Day',
    background: ['#c17f3b', '#e1b018', '#e7c845'],
    glow: '#ee692f',
    accent: '#e77e28',
    text: '#4a2c0f', // Deep brown
    subText: '#7e4d1f'
  },
  sunset: {
    name: 'Sunset',
    background: ['#6a0d83', '#ee5d6c', '#eeaf61'],
    glow: '#fb9062',
    accent: '#ce4993',
    text: '#ffffff', // White
    subText: '#fce4ec'
  },
  night: {
    name: 'Night',
    background: ['#131862', '#2e4482', '#546bab'],
    glow: '#bea9de',
    accent: '#87889c',
    text: '#ffffff', // White
    subText: '#b3e5fc'
  }
};

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

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Chicago": { lat: 41.8781, lng: -87.6298 },
  "Houston": { lat: 29.7604, lng: -95.3698 },
  "Las Vegas": { lat: 36.1716, lng: -115.1391 },
  "Los Angeles": { lat: 34.0522, lng: -118.2437 },
  "Miami": { lat: 25.7617, lng: -80.1918 },
  "New York": { lat: 40.7128, lng: -74.0060 },
  "San Francisco": { lat: 37.7749, lng: -122.4194 },
  "Seattle": { lat: 47.6062, lng: -122.3321 },
  "Washington DC": { lat: 38.9072, lng: -77.0369 }
};

const App: React.FC = () => {
  const [onlineCount, setOnlineCount] = useState(INITIAL_USERS);
  const [blurAmount, setBlurAmount] = useState(0);
  const [glassOpacity, setGlassOpacity] = useState(20);
  const [baseSpeed, setBaseSpeed] = useState(2.2);
  const [figureScale, setFigureScale] = useState(3);
  const [figures, setFigures] = useState<RealisticUserFigure[]>([]);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(INITIAL_USERS.toString());
  const [locationName, setLocationName] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<TimeTheme>(THEMES.day);
  const [isAutoTime, setIsAutoTime] = useState(true);
  const [manualThemeKey, setManualThemeKey] = useState<string>('day');
  // Weather State
  const [liveWeather, setLiveWeather] = useState<{ condition: WeatherCondition, intensity: WeatherIntensity }>({ condition: 'sunny', intensity: 'light' });
  const [manualWeather, setManualWeather] = useState<WeatherCondition>('sunny');
  const [manualIntensity, setManualIntensity] = useState<WeatherIntensity>('light');
  const [isAutoWeather, setIsAutoWeather] = useState(true);

  // Derived effective weather
  const weather = isAutoWeather ? liveWeather.condition : manualWeather;
  const intensity = isAutoWeather ? liveWeather.intensity : manualIntensity;



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
      }, (error) => {
        console.warn("Geolocation access denied or failed. Using fallback coordinates.", error);
        const fallback = { lat: 37.7749, lng: -122.4194 };
        setCoords(fallback);
      });
    }
  }, []);

  // React to coordinate changes (Manual or Geolocation)
  useEffect(() => {
    if (!coords) return;

    const updateLocationData = async () => {
      // Update location on server
      socketService.updateLocation(coords.lat, coords.lng);

      // Fetch new weather
      const fetchedWeather = await fetchWeather(coords.lat, coords.lng);
      setLiveWeather(fetchedWeather);

      // Fetch new location name
      const name = await getPoeticLocation(coords.lat, coords.lng);
      setLocationName(name);
    };

    updateLocationData();
  }, [coords]);

  // Set default city based on closest location
  useEffect(() => {
    if (coords && !selectedCity) {
      let closestCityUrl = null;
      let minDistance = Infinity;

      for (const city of CITY_ASSETS) {
        const cityCoord = CITY_COORDINATES[city.name];
        if (cityCoord) {
          const distance = calculateHaversineDistance(
            coords.lat,
            coords.lng,
            cityCoord.lat,
            cityCoord.lng
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestCityUrl = city.url;
          }
        }
      }

      if (closestCityUrl) {
        setSelectedCity(closestCityUrl);
      }
    }
  }, [coords, selectedCity]);

  // Determine current time-of-day theme
  useEffect(() => {
    if (!isAutoTime) {
      setCurrentTheme(THEMES[manualThemeKey]);
      return;
    }

    const updateTheme = () => {
      const hour = new Date().getHours();
      let themeKey = 'day';
      if (hour >= 5 && hour < 8) themeKey = 'dawn';
      else if (hour >= 8 && hour < 17) themeKey = 'day';
      else if (hour >= 17 && hour < 20) themeKey = 'sunset';
      else themeKey = 'night';

      setCurrentTheme(THEMES[themeKey]);
      setManualThemeKey(themeKey);
    };

    updateTheme();
    const interval = setInterval(updateTheme, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isAutoTime, manualThemeKey]);

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

      // Compressed scale range (was 2/D) - Adjustable via figureScale state
      const baseScale = figureScale / D;

      const opacity = 0.8; // User requested constant 80% opacity

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

  // Audio Logic for Weather
  // Audio Logic for Weather
  useEffect(() => {
    const audioElements: HTMLAudioElement[] = [];

    const playWeatherSound = async () => {
      // 1. Rain
      if (weather === 'rainy') {
        const audio = new Audio('/sounds/rainbg.mp3');
        audio.loop = true;
        // Adjust volume based on intensity
        audio.volume = intensity === 'heavy' ? 1.0 : (intensity === 'light' ? 0.3 : 0.6);
        try {
          await audio.play();
          audioElements.push(audio);
        } catch (e) {
          console.warn("Audio play failed (user interaction needed):", e);
        }
      }

      // 2. Snow
      if (weather === 'snowy') {
        // Base wind/snow sound
        const bgAudio = new Audio('/sounds/snowbg.wav');
        bgAudio.loop = true;
        bgAudio.volume = intensity === 'heavy' ? 0.8 : 0.4;
        try {
          await bgAudio.play();
          audioElements.push(bgAudio);
        } catch (e) { console.warn(e); }


      }

      // 3. Sunny / Cloudy - Crowd Ambience
      if (weather === 'sunny' || weather === 'cloudy') {
        const crowdAudio = new Audio('/sounds/crowd.mp3');
        crowdAudio.loop = true;
        // Scale volume: 0 at 0 users, max 0.3 at 20+ users
        const volume = Math.min(0.3, Math.max(0, onlineCount * 0.015));
        crowdAudio.volume = volume;

        if (volume > 0) {
          try {
            await crowdAudio.play();
            audioElements.push(crowdAudio);
          } catch (e) { console.warn(e); }
        }
      }
    };

    playWeatherSound();

    return () => {
      audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, [weather, intensity, onlineCount]);


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
        selectedCity={selectedCity}
        theme={currentTheme}
        weather={weather}
        intensity={intensity}
      />

      <div className="absolute top-10 left-10 z-50 pointer-events-none flex flex-col gap-1 max-h-[60vh] overflow-hidden">
        <h2
          className="text-[9px] font-bold uppercase tracking-[0.4em] mb-2 transition-all duration-[3000ms] ease-in-out"
          style={{ color: currentTheme.text, opacity: 0.8 }}
        >
          Origins
        </h2>
        <div className="flex flex-col gap-0.5">
          {countryCounts.map(([country, count], i) => (
            <div key={country} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-700" style={{ animationDelay: `${i * 50}ms` }}>
              <span
                className="text-[8px] font-bold uppercase tracking-[0.2em] transition-all duration-[3000ms] ease-in-out"
                style={{
                  color: country === 'Locating...' ? currentTheme.subText : currentTheme.text,
                  opacity: country === 'Locating...' ? 0.5 : 0.7
                }}
              >
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
          <h1
            className="text-[11px] font-bold uppercase tracking-[0.6em] select-none text-center animate-in fade-in duration-[4000ms] leading-[2.5] max-w-[40%] break-words transition-all duration-[3000ms] ease-in-out"
            style={{ color: currentTheme.text, opacity: 0.6 }}
          >
            {locationName}
          </h1>
        )}
        {coords && (
          <div className="flex flex-col items-center gap-1 transition-all duration-[3000ms] ease-in-out">
            <p
              className="text-[9px] font-medium tracking-[0.4em] select-none text-center"
              style={{ color: currentTheme.subText, opacity: 0.4 }}
            >
              {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E
            </p>
            <p
              className="text-[9px] font-bold uppercase tracking-[0.3em] select-none text-center animate-in fade-in duration-[6000ms]"
              style={{ color: currentTheme.text, opacity: 0.5 }}
            >
              {[intensity, weather].join(' ')}
            </p>
          </div>
        )}
      </div>

      <div className="absolute top-10 right-10 z-50 pointer-events-none">
        <span
          className="text-[11px] font-bold uppercase tracking-[0.3em] transition-all duration-[3000ms] ease-in-out"
          style={{ color: currentTheme.text, opacity: 0.7 }}
        >
          {onlineCount} souls nearby
        </span>
      </div>

      <div className="absolute bottom-10 left-10 z-50 flex flex-col items-start gap-4">
        <button
          onClick={() => setIsControlsOpen(!isControlsOpen)}
          className="px-4 py-2 rounded-full border bg-white/10 backdrop-blur-xl flex items-center gap-2 hover:bg-white/30 transition-all text-[9px] uppercase tracking-[0.2em] shadow-sm"
          style={{
            color: currentTheme.text,
            borderColor: `${currentTheme.text}22`,
            transitionDuration: '3000ms'
          }}
        >
          <i className={`fas ${isControlsOpen ? 'fa-minus' : 'fa-gear'}`}></i>
          {isControlsOpen ? 'Close' : 'Adjust Atmosphere'}
        </button>

        {isControlsOpen && (
          <div
            className="p-6 backdrop-blur-3xl rounded-[2rem] flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl min-w-[280px] transition-all duration-[3000ms]"
            style={{
              backgroundColor: currentTheme.text === '#ffffff' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.3)',
              borderColor: `${currentTheme.text}11`,
              borderWidth: '1px'
            }}
          >
            <div className="flex flex-col gap-1 mb-2">
              <span
                className="text-[7px] tracking-[0.1em] uppercase transition-all duration-[3000ms]"
                style={{ color: currentTheme.subText, opacity: 0.6 }}
              >
                Deterministic API: BigDataCloud
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-[8px] uppercase tracking-[0.3em] font-bold transition-all duration-[3000ms]"
                style={{ color: currentTheme.text, opacity: 0.8 }}
              >
                Density
              </label>
              <input
                type="number"
                value={inputValue}
                onChange={handleInputChange}
                className="bg-transparent border-b outline-none py-1 text-xs w-full transition-all font-mono duration-[3000ms]"
                style={{
                  color: currentTheme.text,
                  borderColor: `${currentTheme.text}22`
                }}
              />
            </div>



            <div className="flex flex-col gap-2">
              <label
                className="text-[8px] uppercase tracking-[0.3em] font-bold transition-all duration-[3000ms]"
                style={{ color: currentTheme.text, opacity: 0.8 }}
              >
                Location
              </label>
              <select
                value={selectedCity || ""}
                onChange={(e) => {
                  const url = e.target.value || null;
                  setSelectedCity(url);

                  // Auto-Teleport to City Coordinates
                  if (url) {
                    const cityAsset = CITY_ASSETS.find(c => c.url === url);
                    if (cityAsset) {
                      const targetCoords = CITY_COORDINATES[cityAsset.name];
                      if (targetCoords) {
                        setCoords({ lat: targetCoords.lat, lng: targetCoords.lng });
                      }
                    }
                  }
                }}
                className="bg-transparent border-b outline-none py-1 text-xs w-full transition-all font-mono appearance-none duration-[3000ms]"
                style={{
                  color: currentTheme.text,
                  borderColor: `${currentTheme.text}22`
                }}
              >
                <option value="" style={{ color: '#000' }}>No Skyline</option>
                {CITY_ASSETS.map((city) => (
                  <option key={city.name} value={city.url} style={{ color: '#000' }}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-[8px] uppercase tracking-[0.3em] font-bold transition-all duration-[3000ms]"
                style={{ color: currentTheme.text, opacity: 0.8 }}
              >
                Weather
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAutoWeather(true)}
                  className={`flex-1 py-1 rounded-md text-[10px] font-mono transition-all border duration-[3000ms] ${isAutoWeather ? 'text-white' : 'bg-transparent hover:border-neutral-400'}`}
                  style={{
                    backgroundColor: isAutoWeather ? currentTheme.text : 'transparent',
                    borderColor: isAutoWeather ? currentTheme.text : `${currentTheme.text}44`,
                    color: isAutoWeather ? (currentTheme.name === 'Night' || currentTheme.name === 'Sunset' ? '#000' : '#fff') : currentTheme.text
                  }}
                >
                  Auto
                </button>
                <button
                  onClick={() => setIsAutoWeather(false)}
                  className={`flex-1 py-1 rounded-md text-[10px] font-mono transition-all border duration-[3000ms] ${!isAutoWeather ? 'text-white' : 'bg-transparent hover:border-neutral-400'}`}
                  style={{
                    backgroundColor: !isAutoWeather ? currentTheme.text : 'transparent',
                    borderColor: !isAutoWeather ? currentTheme.text : `${currentTheme.text}44`,
                    color: !isAutoWeather ? (currentTheme.name === 'Night' || currentTheme.name === 'Sunset' ? '#000' : '#fff') : currentTheme.text
                  }}
                >
                  Manual
                </button>
              </div>
            </div>

            {!isAutoWeather && (
              <div className="flex flex-col gap-2">
                <select
                  value={manualWeather}
                  onChange={(e) => setManualWeather(e.target.value as WeatherCondition)}
                  className="bg-transparent border-b outline-none py-1 text-xs w-full transition-all font-mono appearance-none duration-[3000ms]"
                  style={{
                    color: currentTheme.text,
                    borderColor: `${currentTheme.text}22`
                  }}
                >
                  <option value="sunny" style={{ color: '#000' }}>Sunny</option>
                  <option value="cloudy" style={{ color: '#000' }}>Cloudy</option>
                  <option value="rainy" style={{ color: '#000' }}>Rainy</option>
                  <option value="snowy" style={{ color: '#000' }}>Snowy</option>
                </select>

                {manualWeather !== 'sunny' && (
                  <select
                    value={manualIntensity}
                    onChange={(e) => setManualIntensity(e.target.value as WeatherIntensity)}
                    className="bg-transparent border-b outline-none py-1 text-xs w-full transition-all font-mono appearance-none duration-[3000ms]"
                    style={{
                      color: currentTheme.text,
                      borderColor: `${currentTheme.text}22`
                    }}
                  >
                    <option value="light" style={{ color: '#000' }}>Light</option>
                    <option value="moderate" style={{ color: '#000' }}>Moderate</option>
                    <option value="heavy" style={{ color: '#000' }}>Heavy</option>
                  </select>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label
                className="text-[8px] uppercase tracking-[0.3em] font-bold transition-all duration-[3000ms]"
                style={{ color: currentTheme.text, opacity: 0.8 }}
              >
                Time Mode
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAutoTime(true)}
                  className={`flex-1 py-1 rounded-md text-[10px] font-mono transition-all border duration-[3000ms] ${isAutoTime ? 'text-white' : 'bg-transparent hover:border-neutral-400'}`}
                  style={{
                    backgroundColor: isAutoTime ? currentTheme.text : 'transparent',
                    borderColor: isAutoTime ? currentTheme.text : `${currentTheme.text}44`,
                    color: isAutoTime ? (currentTheme.name === 'Night' || currentTheme.name === 'Sunset' ? '#000' : '#fff') : currentTheme.text
                  }}
                >
                  Auto
                </button>
                <button
                  onClick={() => setIsAutoTime(false)}
                  className={`flex-1 py-1 rounded-md text-[10px] font-mono transition-all border duration-[3000ms] ${!isAutoTime ? 'text-white' : 'bg-transparent hover:border-neutral-400'}`}
                  style={{
                    backgroundColor: !isAutoTime ? currentTheme.text : 'transparent',
                    borderColor: !isAutoTime ? currentTheme.text : `${currentTheme.text}44`,
                    color: !isAutoTime ? (currentTheme.name === 'Night' || currentTheme.name === 'Sunset' ? '#000' : '#fff') : currentTheme.text
                  }}
                >
                  Manual
                </button>
              </div>
            </div>

            {!isAutoTime && (
              <div className="flex flex-col gap-2">
                <label
                  className="text-[8px] uppercase tracking-[0.3em] font-bold transition-all duration-[3000ms]"
                  style={{ color: currentTheme.text, opacity: 0.8 }}
                >
                  Selected Mood
                </label>
                <select
                  value={manualThemeKey}
                  onChange={(e) => setManualThemeKey(e.target.value)}
                  className="bg-transparent border-b outline-none py-1 text-xs w-full transition-all font-mono appearance-none duration-[3000ms]"
                  style={{
                    color: currentTheme.text,
                    borderColor: `${currentTheme.text}22`
                  }}
                >
                  {Object.keys(THEMES).map((key) => (
                    <option key={key} value={key} style={{ color: '#000' }}>
                      {THEMES[key].name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label
                className="text-[8px] uppercase tracking-[0.3em] font-bold transition-all duration-[3000ms]"
                style={{ color: currentTheme.text, opacity: 0.8 }}
              >
                Figure Size
              </label>
              <input
                type="range" min="0.5" max="6.0" step="0.1" value={figureScale}
                onChange={(e) => setFigureScale(parseFloat(e.target.value))}
                className="w-full transition-all duration-[3000ms]"
                style={{ accentColor: currentTheme.accent }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-[8px] uppercase tracking-[0.3em] font-bold transition-all duration-[3000ms]"
                style={{ color: currentTheme.text, opacity: 0.8 }}
              >
                Diffusion
              </label>
              <input
                type="range" min="0" max="8" value={blurAmount}
                onChange={(e) => setBlurAmount(parseInt(e.target.value))}
                className="w-full transition-all duration-[3000ms]"
                style={{ accentColor: currentTheme.accent }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-[8px] uppercase tracking-[0.3em] font-bold transition-all duration-[3000ms]"
                style={{ color: currentTheme.text, opacity: 0.8 }}
              >
                Frosting
              </label>
              <input
                type="range" min="0" max="50" value={glassOpacity}
                onChange={(e) => setGlassOpacity(parseInt(e.target.value))}
                className="w-full transition-all duration-[3000ms]"
                style={{ accentColor: currentTheme.accent }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-[8px] uppercase tracking-[0.3em] font-bold transition-all duration-[3000ms]"
                style={{ color: currentTheme.text, opacity: 0.8 }}
              >
                Flow Pace
              </label>
              <input
                type="range" min="0.1" max="8.0" step="0.1" value={baseSpeed}
                onChange={(e) => setBaseSpeed(parseFloat(e.target.value))}
                className="w-full transition-all duration-[3000ms]"
                style={{ accentColor: currentTheme.accent }}
              />
            </div>
          </div>
        )}
      </div>
    </div >
  );
};

export default App;
