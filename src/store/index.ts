import { create } from 'zustand';
import type { Loop, Song, Section, AppState, PanelType, SynthParams, ChatMessage } from '../types';

const PERSISTED_SONG_KEY = 'codestep-song-v1';
const LEGACY_AUTOSAVE_KEY = 'codestep-autosave';

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
  volume: 0.5,
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

const STARTER_BEAT_CODE = `// ✦ NEON ABYSS — Dark Synthwave / A Minor ✦
tempo(128);
osc('sawtooth');
env(0.006, 0.13, 0.58, 0.32);
filter('lowpass', 1500);
fx(0.32, 0.14);
gain(0.7);

// ─── Bass line ────────────────────────────────
function bassline() {
  osc('square');
  filter('lowpass', 420);
  env(0.003, 0.08, 0.38, 0.1);
  gain(0.88);
  velocity(0.92);
  const steps = ['A2','A2','C3','A2','G2','G2','F2','G2'];
  for (const n of steps) note(n, '8n');
  // restore lead voice
  osc('sawtooth');
  filter('lowpass', 1500);
  env(0.006, 0.13, 0.58, 0.32);
  gain(0.7);
}

// ─── Main hook (A minor riff) ─────────────────
function hook() {
  velocity(0.82);
  note('A4', '8n');
  note('C5', '16n'); note('D5', '16n');
  note('E5', '8n');
  rest('16n'); note('G5', '16n');
  note('F5', '8n'); note('E5', '8n');
  note('D5', '16n'); note('C5', '16n');
  note('A4', '4n');
}

// ─── Hook an octave up with extra air ─────────
function hookHigh() {
  filter('lowpass', 2600);
  fx(0.52, 0.2);
  velocity(0.88);
  transpose(12);
  hook();
  transpose(0);
  filter('lowpass', 1500);
  fx(0.32, 0.14);
}

// ─── Chord resolution outro ───────────────────
function resolve() {
  velocity(0.62);
  filter('lowpass', 1000);
  env(0.04, 0.3, 0.7, 0.5);
  chord(['A3','C4','E4'], '4n');
  chord(['G3','B3','D4'], '4n');
  chord(['F3','A3','C4'], '4n');
  chord(['E3','G3','B3'], '2n');
  filter('lowpass', 1500);
  env(0.006, 0.13, 0.58, 0.32);
}

// ─── Arrangement ──────────────────────────────
bassline();
hook();
bassline();
hookHigh();
resolve();
rest('4n');
`;

const DEFAULT_SONG: Song = {
  id: 'default-song',
  name: 'Neon Abyss',
  bpm: 128,
  sections: [
    { id: 'intro', name: 'Intro', startBeat: 0, lengthBeats: 32, loopIds: ['loop-1'], color: '#c8ff00' },
    { id: 'drop', name: 'Drop', startBeat: 32, lengthBeats: 64, loopIds: ['loop-1'], color: '#ff006e' },
  ],
  loops: [
    {
      id: 'loop-1',
      name: 'Neon Abyss',
      code: STARTER_BEAT_CODE,
      steps: Array(8).fill(null).map(() => Array(16).fill(false)),
      instrument: 'synth',
      bpm: 128,
      active: true,
      color: '#c8ff00',
    },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const isBrowser = typeof window !== 'undefined';

const getPersistedSong = (): Song | null => {
  if (!isBrowser) return null;

  const raw = localStorage.getItem(PERSISTED_SONG_KEY) ?? localStorage.getItem(LEGACY_AUTOSAVE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<Song>;
    if (!parsed || !Array.isArray(parsed.loops) || !Array.isArray(parsed.sections)) {
      return null;
    }

    return {
      ...DEFAULT_SONG,
      ...parsed,
      loops: parsed.loops,
      sections: parsed.sections,
      updatedAt: parsed.updatedAt ?? Date.now(),
    };
  } catch {
    return null;
  }
};

const persistSong = (song: Song) => {
  if (!isBrowser) return;

  try {
    localStorage.setItem(PERSISTED_SONG_KEY, JSON.stringify(song));
  } catch {
    // Ignore storage failures (private mode, quota exceeded).
  }
};

const INITIAL_SONG = getPersistedSong() ?? DEFAULT_SONG;

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
  song: INITIAL_SONG,
  activeLoopId: INITIAL_SONG.loops[0]?.id ?? null,
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

  setSong: (song) => {
    persistSong(song);
    set({ song });
  },
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
      const loop = { ...createLoop(id, `Loop ${s.song.loops.length + 1}`), code: STARTER_BEAT_CODE, bpm: 128, color };
      const song = { ...s.song, loops: [...s.song.loops, loop], updatedAt: Date.now() };
      persistSong(song);
      return { song, activeLoopId: id };
    }),

  removeLoop: (id) =>
    set((s) => {
      const loops = s.song.loops.filter((l) => l.id !== id);
      const song = { ...s.song, loops, updatedAt: Date.now() };
      persistSong(song);
      return {
        song,
        activeLoopId: s.activeLoopId === id ? (loops[0]?.id ?? null) : s.activeLoopId,
      };
    }),

  updateLoop: (id, updates) =>
    set((s) => {
      const song = {
        ...s.song,
        loops: s.song.loops.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        updatedAt: Date.now(),
      };
      persistSong(song);
      return { song };
    }),

  updateLoopCode: (id, code) =>
    set((s) => {
      const song = {
        ...s.song,
        loops: s.song.loops.map((l) => (l.id === id ? { ...l, code } : l)),
        updatedAt: Date.now(),
      };
      persistSong(song);
      return { song };
    }),

  toggleStep: (loopId, row, col) =>
    set((s) => {
      const song = {
        ...s.song,
        loops: s.song.loops.map((l) => {
          if (l.id !== loopId) return l;
          const steps = l.steps.map((r, ri) =>
            ri === row ? r.map((c, ci) => (ci === col ? !c : c)) : r
          );
          return { ...l, steps };
        }),
        updatedAt: Date.now(),
      };
      persistSong(song);
      return { song };
    }),

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
      const song = { ...s.song, sections: [...s.song.sections, section], updatedAt: Date.now() };
      persistSong(song);
      return { song };
    }),

  removeSection: (id) =>
    set((s) => {
      const song = { ...s.song, sections: s.song.sections.filter((sec) => sec.id !== id), updatedAt: Date.now() };
      persistSong(song);
      return { song };
    }),

  updateSection: (id, updates) =>
    set((s) => {
      const song = {
        ...s.song,
        sections: s.song.sections.map((sec) => (sec.id === id ? { ...sec, ...updates } : sec)),
        updatedAt: Date.now(),
      };
      persistSong(song);
      return { song };
    }),

  setBpm: (bpm) =>
    set((s) => {
      const song = { ...s.song, bpm, updatedAt: Date.now() };
      persistSong(song);
      return { song };
    }),

  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),

  loadSong: (song) => {
    persistSong(song);
    set({ song, activeLoopId: song.loops[0]?.id ?? null });
  },
}));
