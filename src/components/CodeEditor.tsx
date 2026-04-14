import React, { useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useStore } from '../store';
import { Plus, Trash2, Play, Save } from 'lucide-react';
import { audioEngine } from '../engine/audioEngine';
import { CodeCheatSheet } from './CodeCheatSheet';

const SNAPSHOT_STORAGE_KEY = 'codestep-snapshot-v1';

export const CodeEditor: React.FC = () => {
  const { song, activeLoopId, setActiveLoop, addLoop, removeLoop, updateLoopCode } = useStore();
  const activeLoop = song.loops.find((l) => l.id === activeLoopId);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (activeLoopId && value !== undefined) {
        updateLoopCode(activeLoopId, value);
      }
    },
    [activeLoopId, updateLoopCode]
  );

  const handleRunLoop = () => {
    if (activeLoop) {
      audioEngine.scheduleLoop(activeLoop);
      audioEngine.start();
    }
  };

  const handleSaveSnapshot = () => {
    localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(song));
    alert('Snapshot saved!');
  };

  return (
    <div className="panel editor-panel">
      <div className="panel-header">
        <span className="panel-title">CODE EDITOR</span>
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
        <div className="panel-actions">
          <button className="btn-icon" onClick={handleSaveSnapshot} title="Save Snapshot">
            <Save size={14} />
          </button>
          <button className="btn-accent" onClick={handleRunLoop} title="Run Loop">
            <Play size={14} /> RUN
          </button>
          {activeLoopId && song.loops.length > 1 && (
            <button
              className="btn-danger"
              onClick={() => removeLoop(activeLoopId)}
              title="Delete Loop"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="editor-body">
        {!activeLoop ? (
          <div className="editor-empty">
            <p>No loop selected. Add a loop to get started.</p>
          </div>
        ) : (
          <div className="editor-layout">
            <div className="editor-pane">
              <Editor
                height="100%"
                language="javascript"
                theme="vs-dark"
                value={activeLoop.code}
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  padding: { top: 16 },
                }}
                beforeMount={(monaco) => {
                  monaco.languages.typescript.javascriptDefaults.addExtraLib(
                    `
declare function note(pitch: string, duration: string): void;
declare function rest(duration: string): void;
declare function chord(pitches: string[], duration: string): void;
declare function tempo(bpm: number): void;
declare function velocity(amount: number): void;
declare function transpose(semitones: number): void;
declare function detune(cents: number): void;
declare function osc(type: 'sine' | 'square' | 'sawtooth' | 'triangle'): void;
declare function env(attack: number, decay: number, sustain: number, release: number): void;
declare function filter(type: BiquadFilterType, frequency: number): void;
declare function fx(reverbWet: number, delayWet: number): void;
declare function gain(amount: number): void;
declare function noise(duration: string, type?: 'white' | 'pink' | 'brown', amount?: number): void;
/** Available durations: '1n' | '2n' | '4n' | '8n' | '16n' */
type Duration = '1n' | '2n' | '4n' | '8n' | '16n';
`,
                    'codestep-api.d.ts'
                  );
                }}
              />
            </div>
            <CodeCheatSheet />
          </div>
        )}
      </div>
    </div>
  );
};
