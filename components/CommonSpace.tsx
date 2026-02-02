
import React from 'react';
import { RealisticUserFigure, TimeTheme } from '../App';
import Silhouette from './Silhouette';

interface CommonSpaceProps {
  figures: RealisticUserFigure[];
  blurAmount: number;
  glassOpacity: number;
  selectedCity: string | null;
  theme: TimeTheme;
}

const CommonSpace: React.FC<CommonSpaceProps> = ({ figures, blurAmount, glassOpacity, selectedCity, theme }) => {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#fafafa]">
      {/* Background Gradient - Atmospheric base */}
      <div
        className="absolute inset-0 transition-all duration-[3000ms] ease-in-out"
        style={{
          background: `linear-gradient(to bottom, ${theme.background[0]}, ${theme.background[1]}, ${theme.background[2]})`
        }}
      ></div>

      {/* City Skyline Layer */}
      {selectedCity && (
        <div
          className="fixed top-0 pointer-events-none z-0 mix-blend-multiply transition-all duration-[3000ms] ease-in-out"
          style={{
            left: '-10vw',
            right: '-10vw',
            bottom: '-48.27vw',
            backgroundImage: `url(${selectedCity})`,
            backgroundPosition: 'bottom center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '120vw auto',
            opacity: 0.8,
            filter: `blur(4px) grayscale(60%) brightness(0.9) drop-shadow(0 0 10px ${theme.glow}66)`,
          }}
        />
      )}

      {/* Real-life Shadows Layer */}
      <div className="absolute inset-0 overflow-hidden z-[5]">
        {figures.map((fig) => (
          <Silhouette key={fig.id} figure={fig} blurAmount={blurAmount} />
        ))}
      </div>

      {/* Glass Overlay Layer */}
      <div
        className="absolute inset-0 pointer-events-none z-10 transition-all duration-[3000ms] ease-in-out"
        style={{
          backdropFilter: `saturate(1.05) brightness(1.02)`,
          backgroundColor: `rgba(255, 255, 255, ${glassOpacity / 100})`,
        }}
      >
        {/* Central Ceiling Light Source */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[30%] blur-[100px] rounded-full transition-all duration-[3000ms] ease-in-out"
          style={{ backgroundColor: `${theme.accent}33` }}
        ></div>
        <div
          className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[200px] h-[100px] blur-[40px] rounded-full transition-all duration-[3000ms] ease-in-out"
          style={{ backgroundColor: `${theme.accent}44` }}
        ></div>

        {/* Dynamic Ground Glow */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[35%] blur-[20px] transition-all duration-[3000ms] ease-in-out"
          style={{
            background: `linear-gradient(to top, ${theme.glow}44, ${theme.glow}11, transparent)`
          }}
        ></div>


        {/* Subtle noise/texture for the glass */}
        <div className="absolute inset-0 opacity-[0.1] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/dust.png')]"></div>
      </div>

      {/* Corner vignette for depth */}
      <div className="absolute inset-0 pointer-events-none z-20 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.02)_100%)]"></div>
    </div>
  );
};

export default CommonSpace;
