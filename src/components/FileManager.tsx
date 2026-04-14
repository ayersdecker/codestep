import React, { useRef } from 'react';
import { useStore } from '../store';
import { Save, Upload, Download, FileJson, Music } from 'lucide-react';
import type { Song } from '../types';

const SNAPSHOT_STORAGE_KEY = 'codestep-snapshot-v1';

export const FileManager: React.FC = () => {
  const { song, setSong, loadSong } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadFile = (filename: string, content: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const safeName = song.name.replace(/\s+/g, '_').toLowerCase();

  const handleExportJSON = () => {
    downloadFile(`${safeName}.codestep`, JSON.stringify(song, null, 2), 'application/json');
  };

  const handleExportRawJSON = () => {
    downloadFile(`${safeName}.json`, JSON.stringify(song, null, 2), 'application/json');
  };

  const handleExportBeatSheet = () => {
    const text = song.loops
      .map((loop) => {
        const rows = loop.steps
          .map((row, rowIndex) => `R${rowIndex + 1}: ${row.map((step) => (step ? 'x' : '.')).join(' ')}`)
          .join('\n');
        return `# ${loop.name} (${loop.id})\n${rows}`;
      })
      .join('\n\n');

    downloadFile(`${safeName}_beats.txt`, text, 'text/plain');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const loaded = JSON.parse(ev.target?.result as string) as Song;
        loadSong(loaded);
        alert(`Loaded: ${loaded.name}`);
      } catch {
        alert('Invalid .codestep file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveToLocal = () => {
    localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(song));
    alert('Snapshot saved locally!');
  };

  const handleLoadFromLocal = () => {
    const saved = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if (saved) {
      loadSong(JSON.parse(saved));
      alert('Snapshot restored!');
    } else {
      alert('No snapshot found.');
    }
  };

  const handleRename = () => {
    const name = prompt('Song name:', song.name);
    if (name) setSong({ ...song, name, updatedAt: Date.now() });
  };

  return (
    <div className="panel files-panel">
      <div className="panel-header">
        <span className="panel-title">FILE MANAGER</span>
      </div>

      <div className="files-body">
        <div className="file-section">
          <h3 className="file-section-title">CURRENT TRACK</h3>
          <div className="track-info">
            <Music size={24} style={{ color: '#c8ff00' }} />
            <div>
              <div className="track-info-name">{song.name}</div>
              <div className="track-info-meta">
                {song.loops.length} loops · {song.sections.length} sections · {song.bpm} BPM
              </div>
              <div className="track-info-meta">
                Last modified: {new Date(song.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
          <button className="btn-file" onClick={handleRename}>
            Rename Track
          </button>
        </div>

        <div className="file-section">
          <h3 className="file-section-title">PERSISTENT STORAGE</h3>
          <p className="file-section-desc">
            Beats now auto-save in your browser and come back after refresh, similar to cookie-style persistence.
          </p>
          <div className="file-actions-grid">
            <button className="btn-file btn-file--primary" onClick={handleSaveToLocal}>
              <Save size={16} /> Save Snapshot
            </button>
            <button className="btn-file" onClick={handleLoadFromLocal}>
              <Upload size={16} /> Restore Snapshot
            </button>
          </div>
        </div>

        <div className="file-section">
          <h3 className="file-section-title">IMPORT / EXPORT</h3>
          <div className="file-actions-grid">
            <button className="btn-file btn-file--accent" onClick={handleExportJSON}>
              <Download size={16} /> Export .codestep
            </button>
            <button className="btn-file" onClick={handleExportRawJSON}>
              <FileJson size={16} /> Export .json
            </button>
            <button className="btn-file" onClick={handleExportBeatSheet}>
              <Download size={16} /> Export Beat Sheet
            </button>
            <button className="btn-file" onClick={() => fileInputRef.current?.click()}>
              <FileJson size={16} /> Import .codestep
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".codestep,.json"
            style={{ display: 'none' }}
            onChange={handleImportJSON}
          />
        </div>

        <div className="file-section">
          <h3 className="file-section-title">FIREBASE CLOUD</h3>
          <p className="file-section-desc">
            Connect Firebase to save and sync your songs across devices. Configure VITE_FIREBASE_* environment variables to enable cloud features.
          </p>
          <button className="btn-file btn-file--disabled" disabled>
            <Save size={16} /> Save to Cloud (Configure Firebase)
          </button>
        </div>
      </div>
    </div>
  );
};
