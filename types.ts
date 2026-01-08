
export interface UserFigure {
  id: string;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  speed: number;
  direction: 'left' | 'right';
  activity: 'standing' | 'walking' | 'gesturing';
  bodyWidth: number;
  torsoHeight: number;
  legHeight: number;
  headSize: number;
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
