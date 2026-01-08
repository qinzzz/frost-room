
import React, { useState, useEffect } from 'react';
import CommonSpace from './components/CommonSpace';
import { UserFigure } from './types';
import { getPoeticLocation } from './services/geminiService';

const INITIAL_USERS = 8;

export type PoseType = 'walking_left' | 'walking_right' | 'standing_casual' | 'standing_tall' | 'profile';

export interface RealisticUserFigure extends UserFigure {
  pose: PoseType;
}

const App: React.FC = () => {
  const [onlineCount, setOnlineCount] = useState(INITIAL_USERS);
  const [blurAmount, setBlurAmount] = useState(35); 
  const [glassOpacity, setGlassOpacity] = useState(15);
  const [baseSpeed, setBaseSpeed] = useState(1.2);
  const [figures, setFigures] = useState<RealisticUserFigure[]>([]);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(INITIAL_USERS.toString());
  const [locationName, setLocationName] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        const name = await getPoeticLocation(latitude, longitude);
        setLocationName(name);
      }, (error) => {
        console.warn("Geolocation access denied or failed.", error);
      });
    }
  }, []);

  useEffect(() => {
    const visualCount = Math.min(onlineCount, 120); 
    
    const newFigures: RealisticUserFigure[] = Array.from({ length: visualCount }).map((_, i) => {
      const D = 0.5 + (Math.random() * 9.5);
      const baseScale = 2 / D;
      const alpha = 0.38; // Slightly more translucent for better light interaction
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
        id: `user-${i}-${Math.random()}`,
        x: Math.random() * 100,
        y: 100, 
        scale: baseScale,
        opacity: opacity, 
        speed: speed,
        direction,
        activity,
        pose,
        bodyWidth: 0.85 + Math.random() * 0.2, 
        torsoHeight: 1.1 + (Math.random() * 0.3), 
        legHeight: 1.0, 
        headSize: 1.0,
      };
    });
    setFigures(newFigures);
  }, [onlineCount, baseSpeed]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setOnlineCount(Math.min(1000, Math.max(0, num)));
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#ffffff]">
      {/* Background base */}
      <div className="absolute inset-0 bg-[#fdfdfd] pointer-events-none"></div>

      <CommonSpace 
        figures={figures} 
        blurAmount={blurAmount}
        glassOpacity={glassOpacity}
      />

      {/* Location Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30 gap-6">
        {locationName && (
          <h1 className="text-[11px] font-light uppercase tracking-[0.6em] text-neutral-800 opacity-[0.2] select-none text-center animate-in fade-in duration-[4000ms] leading-[2.5] max-w-[40%] break-words">
            {locationName}
          </h1>
        )}
      </div>

      {/* Counter */}
      <div className="absolute top-10 right-10 z-50 pointer-events-none">
        <span className="text-[11px] font-light uppercase tracking-[0.3em] text-neutral-500 opacity-40">
          {onlineCount} souls nearby
        </span>
      </div>

      {/* Controls */}
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
