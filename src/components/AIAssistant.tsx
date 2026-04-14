import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { Send, Bot, User } from 'lucide-react';
import type { ChatMessage } from '../types';

function generateAIResponse(userMessage: string, existingCode: string): string {
  const msg = userMessage.toLowerCase();
  void existingCode; // available for future context-aware responses

  if (msg.includes('trap') || msg.includes('hi-hat')) {
    return `Here's a trap hi-hat pattern in 16 steps:\n\n\`\`\`javascript\n// Trap Hi-Hat Pattern\nnote('C4', '16n');\nrest('16n');\nnote('C4', '16n');\nnote('C4', '16n');\nrest('8n');\nnote('C4', '16n');\nnote('C4', '16n');\nrest('16n');\n\`\`\`\n\nFor the step sequencer, activate steps on rows to create the pattern visually. Enable rows C and D for alternating open/closed hats.`;
  }

  if (msg.includes('chord') || msg.includes('progression')) {
    return `Here's a classic chord progression (I-V-vi-IV in C major):\n\n\`\`\`javascript\n// C major chord progression\nchord(['C4','E4','G4'], '2n');   // I - C\nchord(['G3','B3','D4'], '2n');   // V - G\nchord(['A3','C4','E4'], '2n');   // vi - Am\nchord(['F3','A3','C4'], '2n');   // IV - F\n\`\`\``;
  }

  if (msg.includes('bass') || msg.includes('bassline')) {
    return `Here's a punchy bass line:\n\n\`\`\`javascript\n// Deep Bass Line\nnote('C2', '8n');\nnote('C2', '8n');\nnote('G2', '16n');\nrest('16n');\nnote('Bb2', '8n');\nnote('C2', '4n');\n\`\`\`\n\nIn the Synth panel, use a square/sawtooth oscillator with a low filter cutoff (~400Hz) and short attack/decay for punchy bass.`;
  }

  if (msg.includes('arp') || msg.includes('arpegg')) {
    return `Here's a bright arpeggio:\n\n\`\`\`javascript\n// Ascending Arp (C minor)\nnote('C4', '16n');\nnote('Eb4', '16n');\nnote('G4', '16n');\nnote('C5', '16n');\nnote('G4', '16n');\nnote('Eb4', '16n');\nnote('C4', '8n');\nrest('8n');\n\`\`\``;
  }

  if (msg.includes('bpm') || msg.includes('tempo')) {
    return `You can change the BPM in the DJ Booth header at the top. The BPM range is 60–240. Common tempos:\n- Chill/lo-fi: 70–90\n- House/techno: 120–135\n- Drum & Bass: 160–180\n- Trap: 130–145 (with half-time feel)\n\nThe BPM affects all loops simultaneously.`;
  }

  if (msg.includes('synth') || msg.includes('sound')) {
    return `In the Synth panel you can control:\n\n**Oscillator type:**\n- Sine → pure, smooth tone\n- Square → hollow, lo-fi feel\n- Sawtooth → bright, aggressive lead\n- Triangle → soft, flute-like\n\n**ADSR Envelope:**\n- Attack: How fast the sound starts\n- Decay: How fast it drops from peak\n- Sustain: Volume level while held\n- Release: Fade after release\n\n**Filter:** Cut frequencies. Low-pass keeps bass, high-pass keeps highs.`;
  }

  if (msg.includes('section') || msg.includes('arranger') || msg.includes('structure')) {
    return `Use the Song Arranger panel to build your track structure. You can:\n- Add sections (Intro, Drop, Breakdown, Outro)\n- Resize sections by dragging the length slider\n- Assign loops to sections\n\nA typical structure:\n- Intro: 32 beats (8 bars)\n- Build: 32 beats\n- Drop: 64 beats (16 bars)\n- Breakdown: 32 beats\n- Drop 2: 64 beats\n- Outro: 32 beats`;
  }

  if (msg.includes('export') || msg.includes('save')) {
    return `In the Files panel you can:\n- **Save to Firebase** → stores your song in the cloud (requires login)\n- **Export JSON** → download the song as a .codestep file for later\n- **Import** → load a .codestep file back into the editor\n- **Export WAV** (coming soon) → render your song to audio\n\nJSON exports include all loop code, step sequences, synth params, and song structure.`;
  }

  if (msg.includes('help') || msg.includes('how')) {
    return `Welcome to CodeStep! Here's a quick start:\n\n1. **Write code** in the Code Editor using \`note()\`, \`rest()\`, \`chord()\`\n2. **Draw patterns** in the Step Sequencer grid\n3. **Shape your sound** in the Synthesizer panel\n4. **Structure your song** in the Song Arranger\n5. **Hit Play** in the DJ Booth to hear it all\n\nAsk me anything! I can generate loops, explain concepts, or help debug your code.`;
  }

  return `I can help with that! As your CodeStep AI assistant, I can:\n\n- Generate loop code (try "make a bass line" or "create a trap beat")\n- Explain synthesizer parameters\n- Help with music theory and chord progressions\n- Suggest song structure and arrangements\n- Debug your loop code\n\nWhat would you like to create today?`;
}

export const AIAssistant: React.FC = () => {
  const { chatMessages, addChatMessage, song, activeLoopId } = useStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeLoop = song.loops.find((l) => l.id === activeLoopId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };
    addChatMessage(userMsg);
    setInput('');
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));

    const aiMsg: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: generateAIResponse(input.trim(), activeLoop?.code || ''),
      timestamp: Date.now(),
    };
    addChatMessage(aiMsg);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="panel ai-panel">
      <div className="panel-header">
        <Bot size={16} style={{ color: '#c8ff00' }} />
        <span className="panel-title">AI ASSISTANT</span>
        <span className="ai-badge">CODESTEP AI</span>
      </div>

      <div className="ai-context-bar">
        <span className="ai-context-label">CONTEXT:</span>
        <span className="ai-context-value">
          BPM {song.bpm} · {song.loops.length} loops · Active: {activeLoop?.name || 'None'}
        </span>
      </div>

      <div className="ai-messages">
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`ai-message ai-message--${msg.role}`}>
            <div className="ai-message-icon">
              {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
            </div>
            <div className="ai-message-content">
              <pre className="ai-message-text">{msg.content}</pre>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="ai-message ai-message--assistant">
            <div className="ai-message-icon"><Bot size={14} /></div>
            <div className="ai-message-content">
              <div className="ai-typing-dots">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-quick-prompts">
        {['Make a bass line', 'Chord progression', 'Trap hi-hats', 'Explain synth'].map((prompt) => (
          <button key={prompt} className="quick-prompt-btn" onClick={() => setInput(prompt)}>
            {prompt}
          </button>
        ))}
      </div>

      <div className="ai-input-wrap">
        <textarea
          className="ai-input"
          placeholder="Ask CodeStep AI anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
        />
        <button className="btn-send" onClick={handleSend} disabled={!input.trim() || isTyping}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};
