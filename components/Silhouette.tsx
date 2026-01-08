
import React, { useEffect, useState, useRef } from 'react';
import { RealisticUserFigure } from '../App';

interface SilhouetteProps {
  figure: RealisticUserFigure;
  blurAmount: number;
}

const PATHS = {
  walking_left: "M50,15c5.5,0,10-4.5,10-10S55.5-5,50-5s-10,4.5-10,10S44.5,15,50,15z M65,25c-5-2-15-5-15-5s-10,3-15,5c-4,1.6-6,6.2-4.4,10.2 c1,2.5,3.4,4,5.9,4c0.8,0,1.5-0.2,2.3-0.5l11.2-4.5v30.8c0,5.5,4.5,10,10,10s10-4.5,10-10V34.5l11.2,4.5c4,1.6,8.6-0.4,10.2-4.4 C77.6,30.6,75.6,26,71.6,24.4L65,25z M45,70l-8,55c-0.6,4,2.2,7.7,6.2,8.2c4,0.6,7.7-2.2,8.2-6.2l7.5-51.5h2.1l7.5,51.5 c0.6,4,4.3,6.7,8.2,6.2c4-0.6,6.7-4.3,6.2-8.2l-8-55L65,70H45z",
  walking_right: "M50,15c5.5,0,10-4.5,10-10S55.5-5,50-5s-10,4.5-10,10S44.5,15,50,15z M35,25c5-2,15-5,15-5s10,3,15,5c4,1.6,6,6.2,4.4,10.2 c-1,2.5-3.4,4-5.9,4c-0.8,0-1.5-0.2-2.3-0.5l-11.2-4.5v30.8c0,5.5-4.5,10-10,10s-10-4.5-10-10V34.5L13.8,39c-4,1.6-8.6-0.4-10.2-4.4 c-1.6-4,0.4-8.6,4.4-10.2L35,25z M55,70l8,55c0.6,4-2.2,7.7-6.2,8.2c-4,0.6-7.7-2.2-8.2-6.2l-7.5-51.5h-2.1l-7.5,51.5 c-0.6,4-4.3,6.7-8.2,6.2c-4-0.6-6.7-4.3-6.2-8.2l8-55L35,70H55z",
  standing_casual: "M50,15c5.5,0,10-4.5,10-10S55.5-5,50-5s-10,4.5-10,10S44.5,15,50,15z M68,20c-8-2-18-2-18-2s-10,0-18,2 c-4,1-7,4.6-7,8.8v41.2c0,4.4,3.6,8,8,8s8-3.6,8-8v-30h14v30c0,4.4,3.6,8,8,8s8-3.6,8-8V28.8C75,24.6,72,21,68,20z M42,78h16l2,72 c0.1,4.4-3.4,8.1-7.8,8.2c-4.4,0.1-8.1-3.4-8.2-7.8L42,78z",
  standing_tall: "M50,15c5.5,0,10-4.5,10-10S55.5-5,50-5s-10,4.5-10,10S44.5,15,50,15z M65,22c-5-2-15-4-15-4s-10,2-15,4 c-4.4,1.8-7,6.3-7,11v35c0,5.5,4.5,10,10,10s10-4.5,10-10V38h4v30c0,5.5,4.5,10,10,10s10-4.5,10-10V33C72,28.3,69.4,23.8,65,22z M44,78h12l3,75 c0.2,4.4-3.3,8.2-7.7,8.3s-8.2-3.3-8.3-7.7L44,78z",
  profile: "M55,15c5.5,0,10-4.5,10-10S60.5-5,55-5s-10,4.5-10,10S49.5,15,55,15z M60,25c-5-2-10-3-15-3s-10,1-15,3 c-4.4,1.8-7,6.3-7,11v35c0,5.5,4.5,10,10,10s10-4.5,10-10V38h2v30c0,5.5,4.5,10,10,10s10-4.5,10-10V36C67,31.3,64.4,26.8,60,25z M48,78h8l1,78 c0.1,4.4-3.5,8-7.9,8.1c-4.4,0.1-8.0-3.5-8.1-7.9L48,78z"
};

const Silhouette: React.FC<SilhouetteProps> = ({ figure, blurAmount }) => {
  const [currentX, setCurrentX] = useState(figure.x);
  const [sway, setSway] = useState(0);
  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  const distance = 2 / figure.scale;
  
  // Adjusted diffusion logic: Nearer is sharper, further is significantly more dispersed
  const individualBlur = 0.5 * distance * distance * blurAmount;

  const animate = (time: number) => {
    const elapsed = Date.now() - startTimeRef.current;
    
    if (figure.activity === 'walking') {
      setCurrentX(prev => {
        const step = (figure.direction === 'left' ? -0.015 : 0.015) * figure.speed;
        let next = prev + step;
        if (next > 120) next = -20;
        if (next < -20) next = 120;
        return next;
      });
    }

    const swayFreq = 0.001;
    setSway(Math.sin(elapsed * swayFreq) * 0.4);

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [figure.activity, figure.speed, figure.direction]);

  return (
    <div 
      className="absolute"
      style={{
        left: `${currentX}%`,
        top: `100%`,
        transform: `translate(-50%, -100%) scale(${figure.scale * figure.bodyWidth + (sway * 0.01)}, ${figure.scale * figure.torsoHeight})`,
        opacity: figure.opacity,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        filter: `blur(${individualBlur}px)`,
        transition: 'opacity 1.5s ease-in-out',
        willChange: 'transform, left',
      }}
    >
      <svg 
        width="100" 
        height="180" 
        viewBox="0 0 100 180" 
        // Dark grey with a hint of warm ambient interaction
        fill="#3a3a3a"
        className="mix-blend-multiply"
      >
        <path d={PATHS[figure.pose]} transform="translate(0, 10)" />
      </svg>
    </div>
  );
};

export default Silhouette;
