
export interface UserFigure {
  id: string;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  speed: number;
  direction?: 'left' | 'right';
  activity: 'stand' | 'sit' | 'walk' | 'run';
  bodyWidth: number;
  torsoHeight: number;
  legHeight: number;
  headSize: number;
  assetIndex?: number;
}

export interface RoomState {
  onlineCount: number;
  mood: string;
  intensity: 'calm' | 'lively' | 'bustling';
}

export interface VibeAnalysis {
  message: string;
  suggestedAction: string;
  energyLevel: number;
}

export type WeatherCondition = 'sunny' | 'rainy' | 'snowy' | 'cloudy';
export type WeatherIntensity = 'light' | 'moderate' | 'heavy';

export interface WeatherData {
  condition: WeatherCondition;
  intensity: WeatherIntensity;
}
