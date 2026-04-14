import React from 'react';
import { useStore } from '../store';
import { audioEngine } from '../engine/audioEngine';
import type { SynthParams } from '../types';

const Knob: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step = 0.01, onChange }) => {
  const pct = ((value - min) / (max - min)) * 100;
  const angle = -135 + (pct / 100) * 270;
  return (
    <div className="knob-wrap">
      <div
        className="knob"
        style={{ '--knob-angle': `${angle}deg` } as React.CSSProperties}
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -step : step;
          const newVal = Math.max(min, Math.min(max, value + delta));
          onChange(newVal);
        }}
      >
        <div className="knob-indicator" />
      </div>
      <input
        type="range"
        className="knob-input-hidden"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="knob-label">{label}</span>
      <span className="knob-value">{value.toFixed(2)}</span>
    </div>
  );
};

export const SynthPanel: React.FC = () => {
  const { synthParams, setSynthParams, activeLoopId } = useStore();

  const update = (params: Partial<SynthParams>) => {
    setSynthParams(params);
    if (activeLoopId) audioEngine.updateSynthParams(activeLoopId, { ...synthParams, ...params });
  };

  return (
    <div className="panel synth-panel">
      <div className="panel-header">
        <span className="panel-title">SYNTHESIZER</span>
        <div className="synth-osc-selector">
          {(['sine', 'square', 'sawtooth', 'triangle'] as const).map((type) => (
            <button
              key={type}
              className={`osc-btn ${synthParams.oscillatorType === type ? 'osc-btn--active' : ''}`}
              onClick={() => update({ oscillatorType: type })}
            >
              {type.toUpperCase().slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      <div className="synth-body">
        <div className="synth-section">
          <h3 className="synth-section-title">ENVELOPE</h3>
          <div className="knobs-row">
            <Knob label="ATK" value={synthParams.attack} min={0} max={2} onChange={(v) => update({ attack: v })} />
            <Knob label="DEC" value={synthParams.decay} min={0} max={2} onChange={(v) => update({ decay: v })} />
            <Knob label="SUS" value={synthParams.sustain} min={0} max={1} onChange={(v) => update({ sustain: v })} />
            <Knob label="REL" value={synthParams.release} min={0} max={4} onChange={(v) => update({ release: v })} />
          </div>
        </div>

        <div className="synth-section">
          <h3 className="synth-section-title">FILTER</h3>
          <div className="knobs-row">
            <Knob
              label="FREQ"
              value={synthParams.filterFrequency}
              min={20}
              max={18000}
              step={10}
              onChange={(v) => update({ filterFrequency: v })}
            />
            <div className="filter-type-selector">
              {(['lowpass', 'highpass', 'bandpass', 'notch'] as BiquadFilterType[]).map((ft) => (
                <button
                  key={ft}
                  className={`filter-btn ${synthParams.filterType === ft ? 'filter-btn--active' : ''}`}
                  onClick={() => update({ filterType: ft })}
                >
                  {ft.slice(0, 2).toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="synth-section">
          <h3 className="synth-section-title">FX</h3>
          <div className="knobs-row">
            <Knob label="VERB" value={synthParams.reverb} min={0} max={1} onChange={(v) => update({ reverb: v })} />
            <Knob label="DLY" value={synthParams.delay} min={0} max={1} onChange={(v) => update({ delay: v })} />
            <Knob label="VOL" value={synthParams.volume} min={0} max={1} onChange={(v) => update({ volume: v })} />
          </div>
        </div>

        <div className="synth-section">
          <h3 className="synth-section-title">VISUALIZER</h3>
          <div className="synth-visualizer">
            {Array.from({ length: 32 }, (_, i) => (
              <div
                key={i}
                className="viz-bar"
                style={{
                  height: `${Math.abs(Math.sin(i * 0.4 + synthParams.filterFrequency / 1000)) * 60 + 10}%`,
                  backgroundColor: i % 3 === 0 ? '#c8ff00' : i % 3 === 1 ? '#00c8ff' : '#ff006e',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
