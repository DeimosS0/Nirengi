import { setView, useView } from '../../lib/store.ts';
import { HOME, type Mode } from './nav';

/** Genç ↔ Kurum. Per tab, so two windows can play both sides of a pilot live. */
export default function ModeSwitch({ className = '' }: { className?: string }) {
  const { persona } = useView();
  const mode: Mode = persona === 'org' ? 'kurum' : 'genc';
  const go = (m: Mode) => {
    if (m === mode) return;
    setView({ persona: m === 'kurum' ? 'org' : 'person' });
    document.documentElement.dataset.mode = m;
    window.location.href = HOME[m];
  };
  return (
    <div className={`seg w-full ${className}`} role="group" aria-label="Görünüm">
      {(
        [
          ['genc', 'Genç'],
          ['kurum', 'Kurum'],
        ] as const
      ).map(([m, label]) => (
        <button key={m} type="button" aria-pressed={mode === m} onClick={() => go(m)} className="flex-1">
          {label}
        </button>
      ))}
    </div>
  );
}
