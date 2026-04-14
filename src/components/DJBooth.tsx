import React from 'react';
import { Play, Square, SkipBack, Volume2 } from 'lucide-react';
import { useStore } from '../store';
import { audioEngine } from '../engine/audioEngine';

export const DJBooth: React.FC = () => {
  const { song, isPlaying, setIsPlaying, setBpm, setCurrentBeat } = useStore();

  const handlePlay = async () => {
    if (isPlaying) {
      audioEngine.stop();
      setIsPlaying(false);
      setCurrentBeat(0);
    } else {
      audioEngine.setBpm(song.bpm);
      song.loops.filter((l) => l.active).forEach((l) => audioEngine.scheduleLoop(l));
      await audioEngine.start();
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    audioEngine.stop();
    setIsPlaying(false);
    setCurrentBeat(0);
  };

  return (
    <div className="dj-booth">
      <div className="booth-stripe" />
      <div className="booth-content">
        <div className="booth-brand">
          <span className="booth-brand-text">CODESTEP</span>
          <span className="booth-brand-sub">AUDIO ENGINE v1.0</span>
        </div>

        <div className="transport-controls">
          <button className="btn-transport" onClick={handleStop} title="Stop & Rewind">
            <SkipBack size={18} />
          </button>
          <button
            className={`btn-play ${isPlaying ? 'btn-play--active' : ''}`}
            onClick={handlePlay}
            title={isPlaying ? 'Stop' : 'Play'}
          >
            {isPlaying ? <Square size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
          </button>
          <button className="btn-transport" onClick={() => audioEngine.playNote('C4')} title="Preview Note">
            <Volume2 size={18} />
          </button>
        </div>

        <div className="bpm-control">
          <span className="bpm-label">BPM</span>
          <input
            type="number"
            className="bpm-input"
            value={song.bpm}
            min={60}
            max={240}
            onChange={(e) => setBpm(Number(e.target.value))}
          />
          <input
            type="range"
            className="bpm-slider"
            value={song.bpm}
            min={60}
            max={240}
            onChange={(e) => setBpm(Number(e.target.value))}
          />
        </div>

        <div className="track-name">
          <span className="track-name-label">TRACK</span>
          <span className="track-name-value">{song.name}</span>
          <div className={`status-dot ${isPlaying ? 'status-dot--playing' : ''}`} />
        </div>
      </div>
    </div>
  );
};
