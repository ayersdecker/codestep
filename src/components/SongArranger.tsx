import React from 'react';
import { useStore } from '../store';
import { Plus, Trash2, Edit3 } from 'lucide-react';

export const SongArranger: React.FC = () => {
  const { song, addSection, removeSection, updateSection } = useStore();
  const totalBeats = song.sections.reduce((max, s) => Math.max(max, s.startBeat + s.lengthBeats), 128);

  return (
    <div className="panel arranger-panel">
      <div className="panel-header">
        <span className="panel-title">SONG ARRANGER</span>
        <button className="btn-accent" onClick={addSection}>
          <Plus size={14} /> SECTION
        </button>
      </div>

      <div className="arranger-body">
        <div className="arranger-timeline">
          {Array.from({ length: Math.ceil(totalBeats / 16) }, (_, i) => (
            <div key={i} className="timeline-marker">
              <span>{i * 16}</span>
            </div>
          ))}
        </div>

        <div className="arranger-sections">
          {song.sections.map((section) => {
            const leftPct = (section.startBeat / totalBeats) * 100;
            const widthPct = (section.lengthBeats / totalBeats) * 100;
            return (
              <div
                key={section.id}
                className="arranger-section"
                style={{
                  left: `${leftPct}%`,
                  width: `${Math.max(widthPct, 5)}%`,
                  backgroundColor: section.color + '33',
                  borderColor: section.color,
                }}
              >
                <div className="section-header" style={{ backgroundColor: section.color }}>
                  <span className="section-name">{section.name}</span>
                  <div className="section-actions">
                    <button
                      className="section-btn"
                      onClick={() => {
                        const name = prompt('Section name:', section.name);
                        if (name) updateSection(section.id, { name });
                      }}
                    >
                      <Edit3 size={10} />
                    </button>
                    <button className="section-btn" onClick={() => removeSection(section.id)}>
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
                <div className="section-body">
                  <span className="section-beat-info">
                    Beat {section.startBeat} → {section.startBeat + section.lengthBeats}
                  </span>
                  <input
                    type="range"
                    className="section-length-slider"
                    value={section.lengthBeats}
                    min={8}
                    max={128}
                    step={8}
                    onChange={(e) => updateSection(section.id, { lengthBeats: Number(e.target.value) })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
