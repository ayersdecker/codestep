import * as Tone from 'tone';
import type { Loop, SynthParams } from '../types';

type NoteEvent = { time: string | number; note: string; duration: string };

export class AudioEngine {
  private synths: Map<string, Tone.PolySynth> = new Map();
  private sequences: Map<string, Tone.Sequence> = new Map();
  private reverb: Tone.Reverb;
  private delay: Tone.FeedbackDelay;
  private limiter: Tone.Limiter;
  private filter: Tone.Filter;
  private masterGain: Tone.Gain;

  constructor() {
    this.reverb = new Tone.Reverb({ decay: 2.5, wet: 0.2 });
    this.delay = new Tone.FeedbackDelay('8n', 0.3);
    this.delay.wet.value = 0.1;
    this.filter = new Tone.Filter(2000, 'lowpass');
    this.limiter = new Tone.Limiter(-3);
    this.masterGain = new Tone.Gain(0.8);

    this.reverb.connect(this.limiter);
    this.delay.connect(this.reverb);
    this.filter.connect(this.delay);
    this.limiter.connect(this.masterGain);
    this.masterGain.toDestination();
  }

  async start() {
    await Tone.start();
    Tone.getTransport().start();
  }

  stop() {
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;
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

    // Parse code to extract notes, or use step sequencer
    const notes = this.parseCodeToNotes(loop.code);
    if (notes.length > 0) {
      const part = new Tone.Part((time, event: NoteEvent) => {
        synth.triggerAttackRelease(event.note, event.duration, time);
      }, notes);
      part.loop = true;
      part.loopEnd = '1m';
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

  parseCodeToNotes(code: string): NoteEvent[] {
    const notes: NoteEvent[] = [];
    let time = 0;
    const lines = code.split('\n');
    for (const line of lines) {
      const noteMatch = line.match(/note\(['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\)/);
      if (noteMatch) {
        const [, note, duration] = noteMatch;
        notes.push({ time, note, duration });
        const durationMap: Record<string, number> = { '1n': 2, '2n': 1, '4n': 0.5, '8n': 0.25, '16n': 0.125 };
        time += durationMap[duration] ?? 0.25;
      }
      const restMatch = line.match(/rest\(['"]([^'"]+)['"]\)/);
      if (restMatch) {
        const durationMap: Record<string, number> = { '1n': 2, '2n': 1, '4n': 0.5, '8n': 0.25, '16n': 0.125 };
        time += durationMap[restMatch[1]] ?? 0.25;
      }
    }
    return notes;
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
    this.reverb.dispose();
    this.delay.dispose();
    this.filter.dispose();
    this.limiter.dispose();
    this.masterGain.dispose();
  }
}

export const audioEngine = new AudioEngine();
