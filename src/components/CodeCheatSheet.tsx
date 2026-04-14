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
    title: 'Durations',
    lines: ["'1n' whole", "'2n' half", "'4n' quarter", "'8n' eighth", "'16n' sixteenth"],
  },
];

const COMPOSITION_TIPS = [
  'Use rest() between phrases so the groove breathes.',
  'Repeat a 2-4 line motif, then change the final note.',
  'Layer one loop for bass rhythm and one loop for melody.',
  'Keep note order simple first, then tighten durations.',
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
