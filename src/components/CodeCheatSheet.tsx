import React from 'react';

const QUICK_REFERENCE = [
  {
    title: 'Start Notes',
    lines: [
      "note('C4', '8n');",
      "note('E4', '8n');",
      "note('G4', '4n');",
    ],
  },
  {
    title: 'Rests',
    lines: ["rest('8n');", "rest('4n');"],
  },
  {
    title: 'Chords',
    lines: ["chord(['C4', 'E4', 'G4'], '2n');", "chord(['A3', 'C4', 'E4'], '4n');"],
  },
  {
    title: 'Functions + Loops',
    lines: [
      'function riff() {',
      "  note('C4', '8n');",
      "  note('G4', '8n');",
      '}',
      'for (let i = 0; i < 4; i++) riff();',
    ],
  },
  {
    title: 'Durations',
    lines: ["'1n' whole", "'2n' half", "'4n' quarter", "'8n' eighth", "'16n' sixteenth"],
  },
  {
    title: 'Transport + Dynamics',
    lines: ['tempo(70);', 'velocity(0.85);', 'gain(0.7);'],
  },
  {
    title: 'Pitch Control',
    lines: ['transpose(-12);', 'detune(8);', "note('C4', '8n');"],
  },
  {
    title: 'Synth Shaping',
    lines: [
      "osc('sawtooth');",
      'env(0.02, 0.18, 0.45, 0.6);',
      "filter('lowpass', 1800);",
      'fx(0.3, 0.18);',
    ],
  },
  {
    title: 'Noise Layer',
    lines: ["noise('16n', 'white', 0.8);", "noise('8n', 'pink', 0.6);"] ,
  },
  {
    title: 'Full Sandbox Example',
    lines: [
      'tempo(70);',
      "osc('triangle');",
      'env(0.01, 0.2, 0.5, 0.4);',
      "filter('lowpass', 2200);",
      'fx(0.25, 0.12);',
      'transpose(-12);',
      'function pulse() {',
      "  note('C3', '8n');",
      "  noise('16n', 'white', 0.5);",
      "  rest('16n');",
      '}',
      'for (let i = 0; i < 8; i++) pulse();',
    ],
  },
];

const COMPOSITION_TIPS = [
  'Use rest() between phrases so the groove breathes.',
  'Repeat a 2-4 line motif, then change the final note.',
  'Layer one loop for bass rhythm and one loop for melody.',
  'Keep note order simple first, then tighten durations.',
  'Set sound design first with osc/env/filter/fx, then write notes.',
  'Use transpose() and noise() to build weight without rewriting melodies.',
];

export const CodeCheatSheet: React.FC = () => {
  return (
    <aside className="code-cheat-sheet" aria-label="Coding cheat sheet">
      <header className="code-cheat-sheet__header">
        <h3 className="code-cheat-sheet__title">CODE CHEAT SHEET</h3>
        <p className="code-cheat-sheet__subtitle">Quick syntax for writing loops fast</p>
      </header>

      <div className="code-cheat-sheet__body">
        {QUICK_REFERENCE.map((section) => (
          <section key={section.title} className="code-cheat-sheet__section">
            <h4 className="code-cheat-sheet__section-title">{section.title}</h4>
            <pre className="code-cheat-sheet__block">{section.lines.join('\n')}</pre>
          </section>
        ))}

        <section className="code-cheat-sheet__section">
          <h4 className="code-cheat-sheet__section-title">Workflow Tips</h4>
          <ul className="code-cheat-sheet__tips">
            {COMPOSITION_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  );
};
