import * as Tone from 'tone';
import type { Loop, SynthParams } from '../types';

type ScheduledEvent = {
  type: 'note' | 'noise';
  time: number;
  duration: string;
  notes: string[];
  noiseType?: Tone.NoiseType;
  velocity?: number;
};

type ParseResult = {
  events: ScheduledEvent[];
  totalDuration: number;
  bpm?: number;
};

export class AudioEngine {
  private synths: Map<string, Tone.PolySynth> = new Map();
  private noiseSynths: Map<string, Tone.NoiseSynth> = new Map();
  private sequences: Map<string, Tone.Sequence> = new Map();
  private reverb: Tone.Reverb;
  private delay: Tone.FeedbackDelay;
  private limiter: Tone.Limiter;
  private filter: Tone.Filter;
  private masterGain: Tone.Gain;
  private analyser: Tone.Analyser;
  private recordingDestination: MediaStreamAudioDestinationNode | null = null;

  constructor() {
    this.reverb = new Tone.Reverb({ decay: 2.5, wet: 0.2 });
    this.delay = new Tone.FeedbackDelay('8n', 0.3);
    this.delay.wet.value = 0.1;
    this.filter = new Tone.Filter(2000, 'lowpass');
    this.limiter = new Tone.Limiter(-3);
    this.masterGain = new Tone.Gain(0.5);
    this.analyser = new Tone.Analyser('fft', 32);

    this.reverb.connect(this.limiter);
    this.delay.connect(this.reverb);
    this.filter.connect(this.delay);
    this.limiter.connect(this.masterGain);
    this.limiter.connect(this.analyser);
    this.masterGain.toDestination();
  }

  async start() {
    await Tone.start();
    Tone.getTransport().start();
  }

  stop() {
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;
    // Clear all scheduled sequences so they don't double-play on next start
    this.sequences.forEach((seq) => { try { seq.stop(); seq.dispose(); } catch { /* ignore */ } });
    this.sequences.clear();
  }

  isTransportRunning(): boolean {
    return Tone.getTransport().state === 'started';
  }

  setBpm(bpm: number) {
    Tone.getTransport().bpm.value = bpm;
  }

  setMasterVolume(volume: number) {
    const nextVolume = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.rampTo(nextVolume, 0.05);
  }

  getMasterVolume() {
    return this.masterGain.gain.value;
  }

  getAnalyserData(): Float32Array {
    return this.analyser.getValue() as Float32Array;
  }

  getRecordingStream(): MediaStream {
    if (!this.recordingDestination) {
      const rawContext = Tone.getContext().rawContext as AudioContext;
      if (typeof rawContext.createMediaStreamDestination !== 'function') {
        throw new Error('Media stream export requires a realtime audio context.');
      }
      const destination = rawContext.createMediaStreamDestination();
      this.limiter.connect(destination);
      this.recordingDestination = destination;
    }
    return this.recordingDestination.stream;
  }

  private getOrCreateSynth(id: string): Tone.PolySynth {
    if (!this.synths.has(id)) {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3 },
      });
      synth.connect(this.filter);
      synth.volume.value = -6;
      this.synths.set(id, synth);
    }
    return this.synths.get(id)!;
  }

  private getOrCreateNoiseSynth(id: string): Tone.NoiseSynth {
    if (!this.noiseSynths.has(id)) {
      const noiseSynth = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 },
      });
      noiseSynth.connect(this.filter);
      noiseSynth.volume.value = -12;
      this.noiseSynths.set(id, noiseSynth);
    }
    return this.noiseSynths.get(id)!;
  }

  updateSynthParams(id: string, params: SynthParams) {
    const synth = this.getOrCreateSynth(id);
    synth.set({
      oscillator: { type: params.oscillatorType },
      envelope: {
        attack: params.attack,
        decay: params.decay,
        sustain: params.sustain,
        release: params.release,
      },
    });
    synth.volume.value = Tone.gainToDb(params.volume);
    this.filter.frequency.value = params.filterFrequency;
    this.filter.type = params.filterType;
    this.reverb.wet.value = params.reverb;
    this.delay.wet.value = params.delay;
  }

  scheduleLoop(loop: Loop) {
    this.clearLoop(loop.id);
    const synth = this.getOrCreateSynth(loop.id);
    const noiseSynth = this.getOrCreateNoiseSynth(loop.id);

    // Execute the loop script and capture scheduled events from note/rest/chord APIs.
    const parsed = this.parseCodeToNotes(loop.code, synth);
    if (parsed.bpm) {
      this.setBpm(parsed.bpm);
    }

    if (parsed.events.length > 0) {
      const part = new Tone.Part((time, event: ScheduledEvent) => {
        if (event.type === 'noise') {
          noiseSynth.noise.type = event.noiseType ?? 'white';
          noiseSynth.triggerAttackRelease(event.duration, time, event.velocity ?? 1);
          return;
        }
        synth.triggerAttackRelease(event.notes, event.duration, time, event.velocity ?? 1);
      }, parsed.events);
      part.loop = true;
      part.loopEnd = parsed.totalDuration;
      part.start(0);
      this.sequences.set(loop.id, part as unknown as Tone.Sequence);
      return;
    }

    // Step sequencer fallback
    const noteNames = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
    const seq = new Tone.Sequence(
      (time, step) => {
        const stepIndex = step as number;
        loop.steps.forEach((row, rowIndex) => {
          if (row[stepIndex]) {
            synth.triggerAttackRelease(noteNames[rowIndex] || 'C4', '16n', time);
          }
        });
      },
      Array.from({ length: 16 }, (_, i) => i),
      '16n'
    );
    seq.loop = true;
    seq.start(0);
    this.sequences.set(loop.id, seq);
  }

  clearLoop(id: string) {
    const seq = this.sequences.get(id);
    if (seq) {
      seq.stop();
      seq.dispose();
      this.sequences.delete(id);
    }
  }

  parseCodeToNotes(code: string, synth: Tone.PolySynth): ParseResult {
    const events: ScheduledEvent[] = [];
    const defaultStep = Tone.Time('16n').toSeconds();
    let bpmOverride: number | undefined;
    let transposeSemitones = 0;
    let noteVelocity = 1;
    let cursor = 0;

    const getDurationSeconds = (duration: string) => {
      try {
        const value = Tone.Time(duration).toSeconds();
        return Number.isFinite(value) && value > 0 ? value : defaultStep;
      } catch {
        return defaultStep;
      }
    };

    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

    const transposePitch = (pitch: string) => {
      if (!Number.isFinite(transposeSemitones) || transposeSemitones === 0) {
        return pitch;
      }
      try {
        return Tone.Frequency(pitch).transpose(transposeSemitones).toNote();
      } catch {
        return pitch;
      }
    };

    const note = (pitch: string, duration: string) => {
      const noteDuration = getDurationSeconds(duration);
      events.push({ type: 'note', time: cursor, duration, notes: [transposePitch(pitch)], velocity: noteVelocity });
      cursor += noteDuration;
    };

    const rest = (duration: string) => {
      cursor += getDurationSeconds(duration);
    };

    const chord = (pitches: string[], duration: string) => {
      const noteDuration = getDurationSeconds(duration);
      const notes = pitches.filter(Boolean).map(transposePitch);
      if (notes.length > 0) {
        events.push({ type: 'note', time: cursor, duration, notes, velocity: noteVelocity });
      }
      cursor += noteDuration;
    };

    const tempo = (value: number) => {
      if (Number.isFinite(value) && value > 20 && value < 400) {
        bpmOverride = value;
      }
    };

    const velocity = (value: number) => {
      noteVelocity = clamp(value, 0, 1);
    };

    const transpose = (semitones: number) => {
      if (Number.isFinite(semitones)) {
        transposeSemitones = semitones;
      }
    };

    const detune = (cents: number) => {
      if (Number.isFinite(cents)) {
        synth.set({ detune: cents });
      }
    };

    const osc = (type: 'sine' | 'square' | 'sawtooth' | 'triangle') => {
      synth.set({ oscillator: { type } } as unknown as Parameters<typeof synth.set>[0]);
    };

    const env = (attack: number, decay: number, sustain: number, release: number) => {
      synth.set({
        envelope: {
          attack: clamp(attack, 0, 4),
          decay: clamp(decay, 0, 4),
          sustain: clamp(sustain, 0, 1),
          release: clamp(release, 0, 8),
        },
      });
    };

    const filter = (type: BiquadFilterType, frequency: number) => {
      this.filter.type = type;
      this.filter.frequency.value = clamp(frequency, 20, 20000);
    };

    const fx = (reverbWet: number, delayWet: number) => {
      this.reverb.wet.value = clamp(reverbWet, 0, 1);
      this.delay.wet.value = clamp(delayWet, 0, 1);
    };

    const gain = (value: number) => {
      synth.volume.value = Tone.gainToDb(clamp(value, 0.0001, 1));
    };

    const noise = (duration: string, type: Tone.NoiseType = 'white', amount = 0.8) => {
      const noteDuration = getDurationSeconds(duration);
      events.push({
        type: 'noise',
        time: cursor,
        duration,
        notes: [],
        noiseType: type,
        velocity: clamp(amount, 0, 1),
      });
      cursor += noteDuration;
    };

    try {
      const run = new Function(
        'note',
        'rest',
        'chord',
        'tempo',
        'velocity',
        'transpose',
        'detune',
        'osc',
        'env',
        'filter',
        'fx',
        'gain',
        'noise',
        code
      );
      run(note, rest, chord, tempo, velocity, transpose, detune, osc, env, filter, fx, gain, noise);
    } catch (error) {
      console.error('Code parser error:', error);
      return { events: [], totalDuration: 0 };
    }

    const minimumLoopLength = Tone.Time('1m').toSeconds();
    return {
      events,
      totalDuration: Math.max(cursor, minimumLoopLength),
      bpm: bpmOverride,
    };
  }

  playNote(note: string, duration = '8n') {
    const tempSynth = this.getOrCreateSynth('preview');
    tempSynth.triggerAttackRelease(note, duration);
  }

  dispose() {
    this.sequences.forEach((seq) => { seq.stop(); seq.dispose(); });
    this.sequences.clear();
    this.synths.forEach((s) => s.dispose());
    this.synths.clear();
    this.noiseSynths.forEach((n) => n.dispose());
    this.noiseSynths.clear();
    this.reverb.dispose();
    this.delay.dispose();
    this.filter.dispose();
    this.limiter.dispose();
    this.masterGain.dispose();
  }
}

export const audioEngine = new AudioEngine();
