# CodeStep — Music × Code

> A DJ booth meets an IDE. Program beats, synthesize sounds, and build complex songs with JavaScript.

CodeStep is a full-featured browser-based music coding environment built with React, TypeScript, Vite, and Firebase. It blends a step sequencer, code editor, synthesizer, and AI assistant into a single dark-themed studio suite inspired by motorsports and streetwear aesthetics.

## Features

### 🎵 Code Editor
- Monaco-based IDE (same engine as VS Code)
- Write loops using a simple JavaScript API:
  ```js
  note('C4', '8n');      // play a note
  rest('4n');             // silence
  chord(['C4','E4','G4'], '2n'); // play a chord
  ```
- Full TypeScript autocompletion for the CodeStep API
- Multiple named loops with color-coded tabs

### 🎛 Step Sequencer
- 8×16 grid sequencer
- Each row maps to a musical note (C4–C5)
- Visual playhead shows current beat
- Combine with code-based loops

### 🎚 DJ Booth
- Play / Stop transport controls
- Live BPM control (60–240)
- Track name display with live status indicator

### 🎹 Synthesizer
- Oscillator types: Sine, Square, Sawtooth, Triangle
- Full ADSR envelope controls
- Low-pass / High-pass / Band-pass / Notch filter
- Reverb and Delay effects
- Real-time frequency visualizer

### 📐 Song Arranger
- Create named sections (Intro, Drop, Breakdown, Outro…)
- Visual timeline with section blocks
- Resize sections with sliders
- Infinite arrangement length

### 🤖 AI Assistant
- Built-in CodeStep AI for music coding help
- Quick prompts for common patterns
- Generates loop code, explains synth params, suggests chord progressions
- Context-aware (knows your current BPM, loops, and active track)

### 💾 File Manager
- Save / Load via browser local storage
- Export full song as `.codestep` JSON file
- Import `.codestep` files to continue editing
- Firebase cloud save (configure with environment variables)

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run
```bash
git clone https://github.com/ayersdecker/codestep.git
cd codestep
npm install
npm run dev
```

Open [http://localhost:5173/codestep/](http://localhost:5173/codestep/)

### Firebase Setup (Optional)
1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Copy `.env.example` to `.env.local`
3. Fill in your Firebase config values

```bash
cp .env.example .env.local
# Edit .env.local with your Firebase config
```

### Build for Production
```bash
npm run build
```

### Deploy to GitHub Pages
```bash
npm run deploy
```

Or push to `main` to trigger the automatic GitHub Actions deployment.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Bundler | Vite |
| Audio Engine | Tone.js |
| Code Editor | Monaco Editor |
| State Management | Zustand |
| Backend / Cloud | Firebase (Firestore + Auth + Storage) |
| Icons | Lucide React |
| Deployment | GitHub Pages + GitHub Actions |

## CodeStep Loop API Reference

```typescript
// Play a single note
note(pitch: string, duration: Duration): void

// Silent rest
rest(duration: Duration): void

// Play multiple notes simultaneously
chord(pitches: string[], duration: Duration): void

// Duration values:
// '1n' = whole note
// '2n' = half note
// '4n' = quarter note
// '8n' = eighth note
// '16n' = sixteenth note

// Pitch format: note name + octave
// Examples: 'C4', 'D#3', 'Bb5', 'F#2'
```

## AI Assistant

The built-in AI assistant understands the CodeStep API and can:
- Generate loop patterns on request
- Explain music theory concepts
- Suggest chord progressions
- Help with synth sound design
- Debug your loop code

Example prompts:
- *"Make a trap hi-hat pattern"*
- *"Create a chord progression in D minor"*
- *"Explain what the filter frequency does"*
- *"Write a bass line that matches my lead"*

## Theme

CodeStep uses a **"Graphic Realism"** design language — high-fidelity dark studio aesthetics fused with motorsports racing stripes, streetwear typography, and vibrant neon color blocking:

- **Lime** `#c8ff00` — primary accent, code editor
- **Electric Blue** `#00c8ff` — sequencer, filter
- **Hot Pink** `#ff006e` — song sections, danger actions
- **Amber** `#ffae00` — synthesizer, files
- **Purple** `#a855f7` — AI assistant

## License

MIT © 2026 Decker Ayers
