import React from 'react';
import { useStore } from '../store';
import { Plus, Trash2 } from 'lucide-react';

const NOTE_LABELS = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C5'];
const BEAT_MARKERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

export const LoopSequencer: React.FC = () => {
  const { song, activeLoopId, setActiveLoop, toggleStep, addLoop, removeLoop, currentBeat } = useStore();
  const activeLoop = song.loops.find((l) => l.id === activeLoopId);

  return (
    <div className="panel sequencer-panel">
      <div className="panel-header">
        <span className="panel-title">STEP SEQUENCER</span>
        <div className="loop-tabs">
          {song.loops.map((loop) => (
            <button
              key={loop.id}
              className={`loop-tab ${loop.id === activeLoopId ? 'loop-tab--active' : ''}`}
              style={{ '--loop-color': loop.color } as React.CSSProperties}
              onClick={() => setActiveLoop(loop.id)}
            >
              {loop.name}
            </button>
          ))}
          <button className="btn-icon" onClick={addLoop} title="Add Loop">
            <Plus size={14} />
          </button>
        </div>
        {activeLoopId && song.loops.length > 1 && (
          <button className="btn-danger" onClick={() => removeLoop(activeLoopId)} title="Delete Loop">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {activeLoop ? (
        <div className="sequencer-body">
          <div className="sequencer-beat-markers">
            <div className="seq-row-label" />
            {BEAT_MARKERS.map((b) => (
              <div
                key={b}
                className={`beat-marker ${b % 4 === 1 ? 'beat-marker--bar' : ''} ${
                  currentBeat % 16 === b - 1 ? 'beat-marker--active' : ''
                }`}
              >
                {b % 4 === 1 ? b : '·'}
              </div>
            ))}
          </div>
          {activeLoop.steps.map((row, rowIndex) => (
            <div key={rowIndex} className="seq-row">
              <div className="seq-row-label">{NOTE_LABELS[rowIndex]}</div>
              {row.map((active, colIndex) => (
                <button
                  key={colIndex}
                  className={`seq-step ${active ? 'seq-step--active' : ''} ${
                    currentBeat % 16 === colIndex ? 'seq-step--current' : ''
                  } ${colIndex % 4 === 0 ? 'seq-step--bar-start' : ''}`}
                  style={active ? { backgroundColor: activeLoop.color } : undefined}
                  onClick={() => toggleStep(activeLoop.id, rowIndex, colIndex)}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="editor-empty">
          <p>Add a loop to start sequencing.</p>
        </div>
      )}
    </div>
  );
};
