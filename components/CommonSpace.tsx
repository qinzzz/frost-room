
import React from 'react';
import { RealisticUserFigure } from '../App';
import Silhouette from './Silhouette';

interface CommonSpaceProps {
  figures: RealisticUserFigure[];
  blurAmount: number;
  glassOpacity: number;
}

const CommonSpace: React.FC<CommonSpaceProps> = ({ figures, blurAmount, glassOpacity }) => {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#fafafa]">
      {/* Background Gradient - Atmospheric base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#f8f9fa] via-[#ffffff] to-[#f2ece4]"></div>

      {/* Real-life Shadows Layer */}
      <div className="absolute inset-0 overflow-hidden">
        {figures.map((fig) => (
          <Silhouette key={fig.id} figure={fig} blurAmount={blurAmount} />
        ))}
      </div>

      {/* Glass Overlay Layer */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backdropFilter: `saturate(1.05) brightness(1.02)`,
          backgroundColor: `rgba(255, 255, 255, ${glassOpacity / 100})`,
        }}
      >
        {/* Central Ceiling Light Source */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[30%] bg-white/40 blur-[100px] rounded-full"></div>
        <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-white/60 blur-[40px] rounded-full"></div>
        
        {/* Warm Ground Glow */}
        <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-t from-[#f5d9b5]/30 via-[#f5d9b5]/10 to-transparent blur-[20px]"></div>
        
        {/* Vertical Glass Seam (Refraction Line) */}
        <div className="absolute right-[30%] top-0 bottom-0 w-[2px] bg-gradient-to-b from-white/0 via-white/20 to-white/0 shadow-[0_0_1px_rgba(255,255,255,0.8)] opacity-60"></div>
        
        {/* Subtle noise/texture for the glass */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/dust.png')]"></div>
      </div>
      
      {/* Corner vignette for depth */}
      <div className="absolute inset-0 pointer-events-none z-20 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.02)_100%)]"></div>
    </div>
  );
};

export default CommonSpace;
