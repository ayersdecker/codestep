import { useStore } from './store';
import { DJBooth } from './components/DJBooth';
import { CodeEditor } from './components/CodeEditor';
import { LoopSequencer } from './components/LoopSequencer';
import { SongArranger } from './components/SongArranger';
import { SynthPanel } from './components/SynthPanel';
import { AIAssistant } from './components/AIAssistant';
import { FileManager } from './components/FileManager';
import { NavBar } from './components/NavBar';
import './App.css';

function App() {
  const { activePanel } = useStore();

  const renderPanel = () => {
    switch (activePanel) {
      case 'editor': return <CodeEditor />;
      case 'sequencer': return <LoopSequencer />;
      case 'arranger': return <SongArranger />;
      case 'synth': return <SynthPanel />;
      case 'ai': return <AIAssistant />;
      case 'files': return <FileManager />;
      default: return <CodeEditor />;
    }
  };

  return (
    <div className="app">
      <NavBar />
      <DJBooth />
      <main className="main-content">
        {renderPanel()}
      </main>
    </div>
  );
}

export default App;
