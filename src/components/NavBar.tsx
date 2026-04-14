import React, { useRef, useEffect } from 'react';
import { useStore } from '../store';
import type { PanelType } from '../types';
import { Code, Grid3x3, Layers, Sliders, Bot, FolderOpen } from 'lucide-react';
import { audioEngine } from '../engine/audioEngine';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animId: number;
    const LIME = '#c8ff00';
    const draw = () => {
      animId = requestAnimationFrame(draw);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const data = audioEngine.getAnalyserData();
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const barW = W / data.length;
      for (let i = 0; i < data.length; i++) {
        const norm = Math.max(0, Math.min(1, (data[i] + 100) / 100));
        const barH = Math.max(1, norm * H);
        const bright = 40 + norm * 30;
        ctx.fillStyle = norm > 0.7 ? `hsl(72,100%,${bright}%)` : LIME;
        ctx.globalAlpha = 0.25 + norm * 0.75;
        ctx.fillRect(i * barW + 1, H - barH, Math.max(1, barW - 2), barH);
      }
      ctx.globalAlpha = 1;
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

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
        <canvas ref={canvasRef} className="navbar-visualizer" width={96} height={24} />
      </div>
    </nav>
  );
};
