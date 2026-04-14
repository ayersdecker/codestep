import React from 'react';
import { useStore } from '../store';
import type { PanelType } from '../types';
import { Code, Grid3x3, Layers, Sliders, Bot, FolderOpen } from 'lucide-react';

const PANELS: { id: PanelType; label: string; icon: React.ReactNode }[] = [
  { id: 'editor', label: 'CODE', icon: <Code size={16} /> },
  { id: 'sequencer', label: 'SEQ', icon: <Grid3x3 size={16} /> },
  { id: 'arranger', label: 'ARRANGE', icon: <Layers size={16} /> },
  { id: 'synth', label: 'SYNTH', icon: <Sliders size={16} /> },
  { id: 'ai', label: 'AI', icon: <Bot size={16} /> },
  { id: 'files', label: 'FILES', icon: <FolderOpen size={16} /> },
];

export const NavBar: React.FC = () => {
  const { activePanel, setActivePanel, song, isPlaying } = useStore();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-logo">
          <span className="logo-cs">CS</span>
        </div>
        <div className="navbar-title">
          <span className="navbar-name">CODESTEP</span>
          <span className="navbar-tagline">MUSIC × CODE</span>
        </div>
      </div>

      <div className="navbar-panels">
        {PANELS.map((panel) => (
          <button
            key={panel.id}
            className={`nav-panel-btn ${activePanel === panel.id ? 'nav-panel-btn--active' : ''}`}
            onClick={() => setActivePanel(panel.id)}
          >
            {panel.icon}
            <span>{panel.label}</span>
          </button>
        ))}
      </div>

      <div className="navbar-status">
        <div className={`play-indicator ${isPlaying ? 'play-indicator--on' : ''}`}>
          {isPlaying ? '▶ PLAYING' : '■ STOPPED'}
        </div>
        <span className="navbar-song-name">{song.name}</span>
      </div>
    </nav>
  );
};
