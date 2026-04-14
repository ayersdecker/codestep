export interface Loop {
  id: string;
  name: string;
  code: string;
  steps: boolean[][];
  instrument: string;
  bpm: number;
  active: boolean;
  color: string;
}

export interface Song {
  id: string;
  name: string;
  bpm: number;
  sections: Section[];
  loops: Loop[];
  createdAt: number;
  updatedAt: number;
}

export interface Section {
  id: string;
  name: string;
  startBeat: number;
  lengthBeats: number;
  loopIds: string[];
  color: string;
}

export interface SynthParams {
  oscillatorType: OscillatorType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  frequency: number;
  filterFrequency: number;
  filterType: BiquadFilterType;
  reverb: number;
  delay: number;
  volume: number;
}

export type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AppState {
  song: Song;
  activeLoopId: string | null;
  isPlaying: boolean;
  currentBeat: number;
  activePanel: PanelType;
}

export type PanelType = 'editor' | 'sequencer' | 'arranger' | 'synth' | 'ai' | 'files';
