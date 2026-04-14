import React, { useRef, useState } from 'react';
import { useStore } from '../store';
import { Save, Upload, Download, FileJson, Music } from 'lucide-react';
import type { Song } from '../types';
import { audioEngine } from '../engine/audioEngine';
import lamejs from 'lamejs';

const SNAPSHOT_STORAGE_KEY = 'codestep-snapshot-v1';

export const FileManager: React.FC = () => {
  const { song, setSong, loadSong } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeExport, setActiveExport] = useState<'none' | 'video' | 'audio'>('none');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('Idle');
  const [fastRender, setFastRender] = useState(true);
  const [silentRender, setSilentRender] = useState(true);

  const isExporting = activeExport !== 'none';

  const downloadFile = (filename: string, content: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const safeName = song.name.replace(/\s+/g, '_').toLowerCase() || 'codestep_track';

  const getPreferredVideoMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return null;
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
  };

  const getRenderDurationSeconds = () => {
    const totalBeats = song.sections.reduce(
      (max, section) => Math.max(max, section.startBeat + section.lengthBeats),
      0
    );
    const beats = totalBeats > 0 ? totalBeats : 32;
    const duration = (beats * 60) / Math.max(song.bpm, 1);
    return Math.max(4, Math.min(duration, 600));
  };

  const drawExportFrame = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    elapsed: number,
    durationSeconds: number,
    loopCount: number
  ) => {
    const W = canvas.width;
    const H = canvas.height;
    const progress = Math.min(elapsed / durationSeconds, 1);

    // ── Background ────────────────────────────────────────────────────────
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(200,255,0,0.04)';
    ctx.lineWidth = 1;
    const gridSpacing = 48;
    for (let x = 0; x < W; x += gridSpacing) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += gridSpacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Lime accent stripe — top
    ctx.fillStyle = '#c8ff00';
    ctx.fillRect(0, 0, W, 4);

    // ── Branding block (top-left) ─────────────────────────────────────────
    const PAD = 52;
    ctx.fillStyle = '#c8ff00';
    ctx.fillRect(PAD, 28, 6, 44);
    ctx.fillStyle = '#c8ff00';
    ctx.font = `900 ${Math.round(H * 0.065)}px 'Barlow Condensed', 'Arial Narrow', Arial, sans-serif`;
    ctx.fillText('CODESTEP', PAD + 18, 64);
    ctx.font = `600 ${Math.round(H * 0.022)}px 'Barlow Condensed', 'Arial Narrow', Arial, sans-serif`;
    ctx.fillStyle = 'rgba(200,255,0,0.55)';
    ctx.fillText('MUSIC  x  CODE', PAD + 20, 84);

    // ── Song name ─────────────────────────────────────────────────────────
    const songNameY = Math.round(H * 0.27);
    ctx.font = `800 ${Math.round(H * 0.105)}px 'Barlow Condensed', 'Arial Narrow', Arial, sans-serif`;
    ctx.fillStyle = '#f5f5f5';
    const nameStr = song.name || 'Untitled Track';
    // Truncate if too wide
    const maxNameWidth = W - PAD * 2;
    let fontSize = Math.round(H * 0.105);
    ctx.font = `800 ${fontSize}px 'Barlow Condensed', 'Arial Narrow', Arial, sans-serif`;
    while (ctx.measureText(nameStr).width > maxNameWidth && fontSize > 28) {
      fontSize -= 4;
      ctx.font = `800 ${fontSize}px 'Barlow Condensed', 'Arial Narrow', Arial, sans-serif`;
    }
    ctx.fillStyle = '#f5f5f5';
    ctx.fillText(nameStr, PAD, songNameY);

    // Lime underline
    const nameWidth = Math.min(ctx.measureText(nameStr).width, maxNameWidth);
    ctx.fillStyle = '#c8ff00';
    ctx.fillRect(PAD, songNameY + 8, nameWidth, 3);

    // ── Track metadata row ────────────────────────────────────────────────
    const metaY = songNameY + 42;
    const metaItems = [
      { label: 'BPM', value: String(song.bpm) },
      { label: 'LOOPS', value: String(loopCount) },
      { label: 'SECTIONS', value: String(song.sections.length) },
      { label: 'DURATION', value: `${durationSeconds.toFixed(0)}s` },
    ];
    let mx = PAD;
    const metaGap = 32;
    ctx.font = `700 ${Math.round(H * 0.024)}px 'Barlow Condensed', 'Arial Narrow', Arial, sans-serif`;
    for (const item of metaItems) {
      ctx.fillStyle = 'rgba(200,255,0,0.6)';
      ctx.fillText(item.label, mx, metaY);
      const labelW = ctx.measureText(item.label).width;
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${Math.round(H * 0.032)}px 'Barlow Condensed', 'Arial Narrow', Arial, sans-serif`;
      ctx.fillText(item.value, mx, metaY + Math.round(H * 0.033));
      const valW = ctx.measureText(item.value).width;
      mx += Math.max(labelW, valW) + metaGap;
      ctx.font = `700 ${Math.round(H * 0.024)}px 'Barlow Condensed', 'Arial Narrow', Arial, sans-serif`;
    }

    // ── Loop name pills ───────────────────────────────────────────────────
    const pillY = metaY + Math.round(H * 0.068);
    const pillColors = ['#c8ff00', '#00c8ff', '#ff006e', '#ffae00', '#a855f7'];
    const activeLoops = song.loops.filter((l) => l.active).slice(0, 6);
    let px = PAD;
    ctx.font = `700 ${Math.round(H * 0.022)}px 'Barlow Condensed', 'Arial Narrow', Arial, sans-serif`;
    for (let i = 0; i < activeLoops.length; i++) {
      const col = pillColors[i % pillColors.length];
      const label = activeLoops[i].name.toUpperCase();
      const tw = ctx.measureText(label).width;
      const pillW = tw + 20;
      const pillH = Math.round(H * 0.033);
      // Pill background
      ctx.fillStyle = col + '22';
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(px, pillY - pillH + 4, pillW, pillH);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.fillText(label, px + 10, pillY);
      px += pillW + 10;
      if (px > W - PAD * 2) break;
    }

    // ── FFT Spectrum ──────────────────────────────────────────────────────
    const spectrumTop = Math.round(H * 0.585);
    const spectrumH = Math.round(H * 0.24);
    const spectrumBottom = spectrumTop + spectrumH;
    const spectrumLeft = PAD;
    const spectrumRight = W - PAD;
    const spectrumWidth = spectrumRight - spectrumLeft;

    // Spectrum BG
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(spectrumLeft, spectrumTop, spectrumWidth, spectrumH);

    // Live FFT bars
    const fftData = audioEngine.getAnalyserData();
    const barCount = fftData.length;
    const barW = spectrumWidth / barCount;

    for (let i = 0; i < barCount; i++) {
      const norm = Math.max(0, Math.min(1, (fftData[i] + 100) / 100));
      const barH = Math.max(2, norm * spectrumH);
      // Color: gradient from lime → cyan → pink toward high freqs
      const t = i / barCount;
      let r: number, g: number, b: number;
      if (t < 0.4) {
        // lime to cyan
        const s = t / 0.4;
        r = Math.round(200 * (1 - s));
        g = 255;
        b = Math.round(255 * s);
      } else {
        // cyan to pink
        const s = (t - 0.4) / 0.6;
        r = Math.round(s * 255);
        g = Math.round(255 * (1 - s));
        b = 255;
      }
      // Glow on tall bars
      if (norm > 0.65) {
        ctx.shadowColor = `rgb(${r},${g},${b})`;
        ctx.shadowBlur = 8;
      }
      ctx.fillStyle = `rgba(${r},${g},${b},${0.3 + norm * 0.7})`;
      ctx.fillRect(
        spectrumLeft + i * barW + 1,
        spectrumBottom - barH,
        Math.max(1, barW - 2),
        barH
      );
      ctx.shadowBlur = 0;
    }

    // Spectrum top border line
    ctx.strokeStyle = 'rgba(200,255,0,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(spectrumLeft, spectrumTop);
    ctx.lineTo(spectrumRight, spectrumTop);
    ctx.stroke();

    // ── Progress bar ─────────────────────────────────────────────────────
    const progBarTop = H - Math.round(H * 0.085);
    const progBarH = Math.round(H * 0.022);
    const progBarLeft = PAD;
    const progBarWidth = W - PAD * 2;

    // Track
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(progBarLeft, progBarTop, progBarWidth, progBarH);

    // Fill with gradient
    const progGrad = ctx.createLinearGradient(progBarLeft, 0, progBarLeft + progBarWidth, 0);
    progGrad.addColorStop(0, '#c8ff00');
    progGrad.addColorStop(0.5, '#00c8ff');
    progGrad.addColorStop(1, '#ff006e');
    ctx.fillStyle = progGrad;
    ctx.fillRect(progBarLeft, progBarTop, progBarWidth * progress, progBarH);

    // Playhead dot
    const playheadX = progBarLeft + progBarWidth * progress;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(playheadX, progBarTop + progBarH / 2, progBarH * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Time labels
    ctx.font = `600 ${Math.round(H * 0.022)}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    const elapsed0 = `${Math.floor(elapsed / 60).toString().padStart(2, '0')}:${Math.floor(elapsed % 60).toString().padStart(2, '0')}`;
    const totalStr = `${Math.floor(durationSeconds / 60).toString().padStart(2, '0')}:${Math.floor(durationSeconds % 60).toString().padStart(2, '0')}`;
    ctx.fillText(elapsed0, progBarLeft, progBarTop + progBarH + Math.round(H * 0.028));
    const totalW = ctx.measureText(totalStr).width;
    ctx.fillText(totalStr, progBarLeft + progBarWidth - totalW, progBarTop + progBarH + Math.round(H * 0.028));

    // Bottom accent stripe
    ctx.fillStyle = '#c8ff00';
    ctx.fillRect(0, H - 4, W, 4);
  };


  const floatTo16BitPCM = (input: Float32Array) => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, input[i]));
      output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return output;
  };

  const encodeMp3FromChannels = (left: Float32Array, right: Float32Array | null, sampleRate: number) => {
    const channels = right ? 2 : 1;
    const encoder = new lamejs.Mp3Encoder(channels, sampleRate, 192);
    const frameSize = 1152;
    const mp3Chunks: BlobPart[] = [];

    for (let i = 0; i < left.length; i += frameSize) {
      const leftChunk = floatTo16BitPCM(left.subarray(i, i + frameSize));
      const mp3buf = channels > 1 && right
        ? encoder.encodeBuffer(leftChunk, floatTo16BitPCM(right.subarray(i, i + frameSize)))
        : encoder.encodeBuffer(leftChunk);
      if (mp3buf.length > 0) {
        mp3Chunks.push(new Uint8Array(mp3buf) as unknown as BlobPart);
      }

      if (i % (frameSize * 16) === 0) {
        const progress = Math.min(i / left.length, 1);
        setExportProgress(0.58 + progress * 0.36);
        setExportStatus(`Encoding MP3 ${(58 + progress * 36).toFixed(0)}%`);
      }
    }

    const end = encoder.flush();
    if (end.length > 0) {
      mp3Chunks.push(new Uint8Array(end) as unknown as BlobPart);
    }

    return new Blob(mp3Chunks, { type: 'audio/mpeg' });
  };

  const handleExportMP4 = async () => {
    if (isExporting) return;

    const mimeType = getPreferredVideoMimeType();
    if (!mimeType) {
      alert('Video export is not supported in this browser.');
      return;
    }

    const canvas = document.createElement('canvas');
    const renderProfile = fastRender
      ? { width: 960, height: 540, fps: 24, videoBitrate: 2_500_000, audioBitrate: 128_000 }
      : { width: 1280, height: 720, fps: 30, videoBitrate: 5_000_000, audioBitrate: 192_000 };
    canvas.width = renderProfile.width;
    canvas.height = renderProfile.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      alert('Could not initialize video renderer.');
      return;
    }

    const durationSeconds = getRenderDurationSeconds();
    const loopsForRender = song.loops.filter((loop) => loop.active);
    const loopsToPlay = loopsForRender.length > 0 ? loopsForRender : song.loops;
    const videoStream = canvas.captureStream(renderProfile.fps);
    let mixedStream: MediaStream | null = null;

    const chunks: BlobPart[] = [];
    let frameId = 0;
    const startedAt = performance.now();
    let lastUiUpdate = startedAt;

      const drawFrame = () => {
      const elapsed = (performance.now() - startedAt) / 1000;
      const progress = Math.min(elapsed / durationSeconds, 1);
      const now = performance.now();
      if (now - lastUiUpdate >= 120 || progress >= 1) {
        setExportProgress(progress);
        setExportStatus(`Rendering ${(progress * 100).toFixed(0)}%`);
        lastUiUpdate = now;
      }
        drawExportFrame(ctx, canvas, elapsed, durationSeconds, loopsToPlay.length);

      if (progress < 1) {
        frameId = requestAnimationFrame(drawFrame);
      }
    };

    setActiveExport('video');
    setExportProgress(0);
    setExportStatus('Preparing audio + video streams...');

    const previousMasterVolume = audioEngine.getMasterVolume();
    try {
      audioEngine.stop();
      loopsToPlay.forEach((loop) => audioEngine.scheduleLoop(loop));
      audioEngine.setBpm(song.bpm);

      if (silentRender) {
        audioEngine.setMasterVolume(0);
      }

      await audioEngine.start();

      const audioStream = audioEngine.getRecordingStream();
      const audioTracks = audioStream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio track available for export.');
      }

      mixedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioTracks,
      ]);

      setExportStatus('Recording timeline...');
      drawFrame();

      await new Promise<void>((resolve, reject) => {
        const recorder = new MediaRecorder(mixedStream!, {
          mimeType,
          videoBitsPerSecond: renderProfile.videoBitrate,
          audioBitsPerSecond: renderProfile.audioBitrate,
        });

        const stopTimer = window.setTimeout(() => {
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
        }, durationSeconds * 1000 + 200);

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };

        recorder.onerror = (event) => {
          window.clearTimeout(stopTimer);
          reject(event.error);
        };

        recorder.onstop = () => {
          window.clearTimeout(stopTimer);
          resolve();
        };

        recorder.start(1000);
      });

      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
      setExportStatus('Finalizing file...');
      const blob = new Blob(chunks, { type: mimeType });

      if (blob.size === 0) {
        throw new Error('Recorder produced an empty file.');
      }

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${safeName}.${extension}`;
      anchor.click();
      URL.revokeObjectURL(url);
      setExportProgress(1);
      setExportStatus('Done');

      if (extension !== 'mp4') {
        alert('Your browser exported WebM. MP4 encoding is not supported in this browser.');
      }
    } catch (error) {
      console.error('Video export failed:', error);
      setExportStatus('Export failed');
      alert('Export failed. The console error is often a cancellable browser task. Try Export again, or disable extensions and retry in a Chromium tab.');
    } finally {
      cancelAnimationFrame(frameId);
      mixedStream?.getTracks().forEach((track) => track.stop());
      audioEngine.stop();
      audioEngine.setMasterVolume(previousMasterVolume);
      setActiveExport('none');
    }
  };

  const handleExportMP3 = async () => {
    if (isExporting) return;

    const durationSeconds = getRenderDurationSeconds();
    const loopsForRender = song.loops.filter((loop) => loop.active);
    const loopsToPlay = loopsForRender.length > 0 ? loopsForRender : song.loops;

    setActiveExport('audio');
    setExportProgress(0);
    setExportStatus('Preparing direct PCM capture...');

    const previousMasterVolume = audioEngine.getMasterVolume();
    let rafId = 0;
    let captureContext: AudioContext | null = null;
    let processorNode: ScriptProcessorNode | null = null;
    let sourceNode: MediaStreamAudioSourceNode | null = null;
    let sinkGain: GainNode | null = null;

    try {
      audioEngine.stop();
      loopsToPlay.forEach((loop) => audioEngine.scheduleLoop(loop));
      audioEngine.setBpm(song.bpm);

      if (silentRender) {
        audioEngine.setMasterVolume(0);
      }

      await audioEngine.start();

      const audioStream = audioEngine.getRecordingStream();
      const audioTracks = audioStream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio track available for export.');
      }

      captureContext = new AudioContext();
      await captureContext.resume();
      sourceNode = captureContext.createMediaStreamSource(new MediaStream(audioTracks));
      processorNode = captureContext.createScriptProcessor(4096, 2, 2);
      sinkGain = captureContext.createGain();
      sinkGain.gain.value = 0;

      const leftChunks: Float32Array[] = [];
      const rightChunks: Float32Array[] = [];
      let capturedSamples = 0;
      const targetSamples = Math.max(1, Math.floor(durationSeconds * captureContext.sampleRate));

      processorNode.onaudioprocess = (event) => {
        if (capturedSamples >= targetSamples) return;

        const left = event.inputBuffer.getChannelData(0);
        const right = event.inputBuffer.numberOfChannels > 1
          ? event.inputBuffer.getChannelData(1)
          : left;

        const remaining = targetSamples - capturedSamples;
        const framesToCopy = Math.min(left.length, remaining);
        if (framesToCopy <= 0) return;

        leftChunks.push(new Float32Array(left.subarray(0, framesToCopy)));
        rightChunks.push(new Float32Array(right.subarray(0, framesToCopy)));
        capturedSamples += framesToCopy;
      };

      sourceNode.connect(processorNode);
      processorNode.connect(sinkGain);
      sinkGain.connect(captureContext.destination);

      const startedAt = performance.now();

      const updateProgressFromTime = () => {
        const elapsed = (performance.now() - startedAt) / 1000;
        const progress = Math.min(elapsed / durationSeconds, 1);
        setExportProgress(progress * 0.7);
        setExportStatus(`Recording audio ${(progress * 70).toFixed(0)}%`);
        if (progress < 1) {
          rafId = requestAnimationFrame(updateProgressFromTime);
        }
      };

      updateProgressFromTime();

      await new Promise<void>((resolve) => {
        const stopTimer = window.setTimeout(() => resolve(), durationSeconds * 1000 + 220);
        const pollDone = () => {
          if (capturedSamples >= targetSamples) {
            window.clearTimeout(stopTimer);
            resolve();
            return;
          }
          rafId = requestAnimationFrame(pollDone);
        };
        rafId = requestAnimationFrame(pollDone);
      });

      cancelAnimationFrame(rafId);

      const mergeChunks = (chunks: Float32Array[]) => {
        const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const merged = new Float32Array(total);
        let offset = 0;
        for (const chunk of chunks) {
          merged.set(chunk, offset);
          offset += chunk.length;
        }
        return merged;
      };

      const mergedLeft = mergeChunks(leftChunks);
      const mergedRight = rightChunks.length > 0 ? mergeChunks(rightChunks) : null;

      if (mergedLeft.length === 0) {
        throw new Error('No audio samples captured.');
      }

      setExportProgress(0.72);
      setExportStatus('Encoding MP3...');

      const mp3Blob = encodeMp3FromChannels(mergedLeft, mergedRight, captureContext.sampleRate);
      if (mp3Blob.size === 0) {
        throw new Error('MP3 encoder returned an empty file.');
      }

      setExportProgress(1);
      setExportStatus('Done');
      const url = URL.createObjectURL(mp3Blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${safeName}.mp3`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('MP3 export failed:', error);
      setExportStatus('Export failed');
      alert('MP3 export failed. Audio capture could not complete in this browser session; refresh and try again.');
    } finally {
      cancelAnimationFrame(rafId);
      try {
        processorNode?.disconnect();
        sourceNode?.disconnect();
        sinkGain?.disconnect();
      } catch {
        // no-op
      }
      if (captureContext && captureContext.state !== 'closed') {
        await captureContext.close();
      }
      audioEngine.stop();
      audioEngine.setMasterVolume(previousMasterVolume);
      setActiveExport('none');
    }
  };

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
          <p className="file-section-desc">
            Export Video includes audio using an audio-safe codec path. Fast Render lowers resolution/bitrate for quicker processing. Silent Render mutes speakers during export.
          </p>
          <div className="file-export-options">
            <label className="file-option-toggle">
              <input
                type="checkbox"
                checked={fastRender}
                onChange={(e) => setFastRender(e.target.checked)}
                disabled={isExporting}
              />
              Fast Render
            </label>
            <label className="file-option-toggle">
              <input
                type="checkbox"
                checked={silentRender}
                onChange={(e) => setSilentRender(e.target.checked)}
                disabled={isExporting}
              />
              Silent Render
            </label>

          </div>
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
            <button className="btn-file" onClick={handleExportMP4} disabled={isExporting}>
              <Download size={16} /> {activeExport === 'video' ? `Rendering ${Math.round(exportProgress * 100)}%...` : 'Export Video (Audio)'}
            </button>
            <button className="btn-file" onClick={handleExportMP3} disabled={isExporting}>
              <Download size={16} /> {activeExport === 'audio' ? `Encoding ${Math.round(exportProgress * 100)}%...` : 'Export MP3'}
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
          <div className="export-progress-wrap" aria-live="polite">
            <div className="export-progress-label">
              <span>{activeExport === 'audio' ? 'MP3 Export' : 'Video Export'}</span>
              <span>{Math.round(exportProgress * 100)}%</span>
            </div>
            <div className="export-progress-track">
              <div className="export-progress-fill" style={{ width: `${Math.round(exportProgress * 100)}%` }} />
            </div>
            <div className="export-progress-status">{isExporting ? exportStatus : 'Idle'}</div>
          </div>
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
