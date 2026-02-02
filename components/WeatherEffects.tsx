import React, { useMemo } from 'react';
import { WeatherCondition, WeatherIntensity } from '../types';
import './weather.css';

interface WeatherEffectsProps {
    weather: WeatherCondition;
    intensity: WeatherIntensity;
}

const WeatherEffects: React.FC<WeatherEffectsProps> = ({ weather, intensity }) => {
    if (weather === 'sunny') return null;

    const particles = useMemo(() => {
        const getCount = (base: number) => {
            if (intensity === 'light') return Math.floor(base * 0.5);
            if (intensity === 'heavy') return Math.floor(base * 1.5);
            return base; // moderate
        };

        switch (weather) {
            case 'rainy':
                return Array.from({ length: getCount(100) }).map((_, i) => ({
                    id: i,
                    left: `${Math.random() * 100}%`,
                    // Heavy rain falls faster
                    delay: `${Math.random() * 2}s`,
                    duration: intensity === 'heavy' ? `${0.3 + Math.random() * 0.3}s` : `${0.5 + Math.random() * 0.5}s`,
                    opacity: 0.3 + Math.random() * 0.5
                }));
            case 'snowy':
                // Heavy snow = more flakes, slightly varied sizes
                return Array.from({ length: getCount(50) }).map((_, i) => ({
                    id: i,
                    left: `${Math.random() * 100}%`,
                    delay: `${Math.random() * 5}s`,
                    duration: `${3 + Math.random() * 5}s`,
                    size: `${2 + Math.random() * 4}px`,
                    opacity: 0.4 + Math.random() * 0.6
                }));
            case 'cloudy':
                // Heavy cloudy = more layers/fog
                return Array.from({ length: getCount(3) }).map((_, i) => ({
                    id: i,
                    top: `${Math.random() * 30}%`,
                    delay: `${Math.random() * -20}s`,
                    duration: `${60 + Math.random() * 40}s`,
                    opacity: intensity === 'heavy' ? 0.5 : 0.3
                }));
            default:
                return [];
        }
    }, [weather, intensity]);

    return (
        <div className="absolute inset-0 pointer-events-none z-[15] overflow-hidden">
            {weather === 'rainy' && particles.map((p: any) => (
                <div
                    key={p.id}
                    className="rain-drop"
                    style={{
                        left: p.left,
                        animationDelay: p.delay,
                        animationDuration: p.duration,
                        opacity: p.opacity
                    }}
                />
            ))}

            {weather === 'snowy' && particles.map((p: any) => (
                <div
                    key={p.id}
                    className="snow-flake"
                    style={{
                        left: p.left,
                        width: p.size,
                        height: p.size,
                        animationDelay: p.delay,
                        animationDuration: p.duration,
                        opacity: p.opacity
                    }}
                />
            ))}

            {weather === 'cloudy' && (
                <>
                    <div
                        className="absolute inset-0 bg-white/20 backdrop-blur-[2px]"
                        style={{
                            maskImage: 'linear-gradient(to bottom, black, transparent)',
                            WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
                            opacity: intensity === 'heavy' ? 0.6 : (intensity === 'light' ? 0.2 : 0.4)
                        }}
                    ></div>
                    {particles.map((p: any) => (
                        <div
                            key={p.id}
                            className="cloud-layer"
                            style={{
                                top: p.top,
                                animationDelay: p.delay,
                                animationDuration: p.duration,
                                background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 60%)',
                                backgroundSize: '50% 100%'
                            }}
                        />
                    ))}
                </>
            )}
        </div>
    );
};

export default WeatherEffects;
