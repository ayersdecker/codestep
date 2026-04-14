import React, { useRef } from 'react';
import { useStore } from '../store';
import { Save, Upload, Download, FileJson, Music } from 'lucide-react';
import type { Song } from '../types';

export const FileManager: React.FC = () => {
  const { song, setSong, loadSong } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(song, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${song.name.replace(/\s+/g, '_')}.codestep`;
    a.click();
    URL.revokeObjectURL(url);
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
    localStorage.setItem('codestep-autosave', JSON.stringify(song));
    alert('Song saved locally!');
  };

  const handleLoadFromLocal = () => {
    const saved = localStorage.getItem('codestep-autosave');
    if (saved) {
      loadSong(JSON.parse(saved));
      alert('Song loaded from local save!');
    } else {
      alert('No local save found.');
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
          <h3 className="file-section-title">LOCAL STORAGE</h3>
          <div className="file-actions-grid">
            <button className="btn-file btn-file--primary" onClick={handleSaveToLocal}>
              <Save size={16} /> Save Locally
            </button>
            <button className="btn-file" onClick={handleLoadFromLocal}>
              <Upload size={16} /> Load Local Save
            </button>
          </div>
        </div>

        <div className="file-section">
          <h3 className="file-section-title">IMPORT / EXPORT</h3>
          <div className="file-actions-grid">
            <button className="btn-file btn-file--accent" onClick={handleExportJSON}>
              <Download size={16} /> Export .codestep
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
