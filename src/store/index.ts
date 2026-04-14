import { create } from 'zustand';
import type { Loop, Song, Section, AppState, PanelType, SynthParams, ChatMessage } from '../types';

const DEFAULT_SYNTH_PARAMS: SynthParams = {
  oscillatorType: 'sawtooth',
  attack: 0.01,
  decay: 0.1,
  sustain: 0.5,
  release: 0.3,
  frequency: 440,
  filterFrequency: 2000,
  filterType: 'lowpass',
  reverb: 0.2,
  delay: 0.1,
  volume: 0.8,
};

const createLoop = (id: string, name: string): Loop => ({
  id,
  name,
  code: `// Loop: ${name}\n// Use note(), chord(), rest() to compose\nnote('C4', '8n');\nnote('E4', '8n');\nnote('G4', '4n');`,
  steps: Array(8).fill(null).map(() => Array(16).fill(false)),
  instrument: 'synth',
  bpm: 120,
  active: true,
  color: '#c8ff00',
});

const DEFAULT_SONG: Song = {
  id: 'default-song',
  name: 'Untitled Track',
  bpm: 120,
  sections: [
    { id: 'intro', name: 'Intro', startBeat: 0, lengthBeats: 32, loopIds: [], color: '#c8ff00' },
    { id: 'drop', name: 'Drop', startBeat: 32, lengthBeats: 64, loopIds: [], color: '#ff006e' },
  ],
  loops: [createLoop('loop-1', 'Lead'), createLoop('loop-2', 'Bass')],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

interface Store extends AppState {
  synthParams: SynthParams;
  chatMessages: ChatMessage[];
  // Actions
  setSong: (song: Song) => void;
  setActiveLoop: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentBeat: (beat: number) => void;
  setActivePanel: (panel: PanelType) => void;
  setSynthParams: (params: Partial<SynthParams>) => void;
  addLoop: () => void;
  removeLoop: (id: string) => void;
  updateLoop: (id: string, updates: Partial<Loop>) => void;
  updateLoopCode: (id: string, code: string) => void;
  toggleStep: (loopId: string, row: number, col: number) => void;
  addSection: () => void;
  removeSection: (id: string) => void;
  updateSection: (id: string, updates: Partial<Section>) => void;
  setBpm: (bpm: number) => void;
  addChatMessage: (msg: ChatMessage) => void;
  loadSong: (song: Song) => void;
}

export const useStore = create<Store>((set) => ({
  song: DEFAULT_SONG,
  activeLoopId: 'loop-1',
  isPlaying: false,
  currentBeat: 0,
  activePanel: 'editor',
  synthParams: DEFAULT_SYNTH_PARAMS,
  chatMessages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Welcome to CodeStep AI! I can help you write loop code, design synth patches, and build your track. Try asking: "Make a trap hi-hat pattern" or "Explain how to use the sequencer."',
      timestamp: Date.now(),
    },
  ],

  setSong: (song) => set({ song }),
  setActiveLoop: (id) => set({ activeLoopId: id }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentBeat: (beat) => set({ currentBeat: beat }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setSynthParams: (params) => set((s) => ({ synthParams: { ...s.synthParams, ...params } })),

  addLoop: () =>
    set((s) => {
      const id = `loop-${Date.now()}`;
      const colors = ['#c8ff00', '#00c8ff', '#ff006e', '#ffae00', '#a855f7'];
      const color = colors[s.song.loops.length % colors.length];
      const loop = { ...createLoop(id, `Loop ${s.song.loops.length + 1}`), color };
      return { song: { ...s.song, loops: [...s.song.loops, loop], updatedAt: Date.now() }, activeLoopId: id };
    }),

  removeLoop: (id) =>
    set((s) => ({
      song: { ...s.song, loops: s.song.loops.filter((l) => l.id !== id), updatedAt: Date.now() },
      activeLoopId: s.activeLoopId === id ? (s.song.loops[0]?.id ?? null) : s.activeLoopId,
    })),

  updateLoop: (id, updates) =>
    set((s) => ({
      song: {
        ...s.song,
        loops: s.song.loops.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        updatedAt: Date.now(),
      },
    })),

  updateLoopCode: (id, code) =>
    set((s) => ({
      song: {
        ...s.song,
        loops: s.song.loops.map((l) => (l.id === id ? { ...l, code } : l)),
        updatedAt: Date.now(),
      },
    })),

  toggleStep: (loopId, row, col) =>
    set((s) => ({
      song: {
        ...s.song,
        loops: s.song.loops.map((l) => {
          if (l.id !== loopId) return l;
          const steps = l.steps.map((r, ri) =>
            ri === row ? r.map((c, ci) => (ci === col ? !c : c)) : r
          );
          return { ...l, steps };
        }),
        updatedAt: Date.now(),
      },
    })),

  addSection: () =>
    set((s) => {
      const colors = ['#c8ff00', '#00c8ff', '#ff006e', '#ffae00', '#a855f7'];
      const lastSection = s.song.sections[s.song.sections.length - 1];
      const startBeat = lastSection ? lastSection.startBeat + lastSection.lengthBeats : 0;
      const section: Section = {
        id: `section-${Date.now()}`,
        name: `Section ${s.song.sections.length + 1}`,
        startBeat,
        lengthBeats: 32,
        loopIds: [],
        color: colors[s.song.sections.length % colors.length],
      };
      return { song: { ...s.song, sections: [...s.song.sections, section], updatedAt: Date.now() } };
    }),

  removeSection: (id) =>
    set((s) => ({
      song: { ...s.song, sections: s.song.sections.filter((sec) => sec.id !== id), updatedAt: Date.now() },
    })),

  updateSection: (id, updates) =>
    set((s) => ({
      song: {
        ...s.song,
        sections: s.song.sections.map((sec) => (sec.id === id ? { ...sec, ...updates } : sec)),
        updatedAt: Date.now(),
      },
    })),

  setBpm: (bpm) => set((s) => ({ song: { ...s.song, bpm, updatedAt: Date.now() } })),

  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),

  loadSong: (song) => set({ song, activeLoopId: song.loops[0]?.id ?? null }),
}));
