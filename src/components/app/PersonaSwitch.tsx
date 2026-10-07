import { setView, useView } from '../../lib/store.ts';

/** Demo role switch. Per tab, so two windows can play kurum and yetenek side by side. */
export default function PersonaSwitch() {
  const { persona, blind } = useView();
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex rounded-lg border border-line bg-sunken p-0.5" role="radiogroup" aria-label="Görünüm rolü">
        {(
          [
            ['org', 'Kurum'],
            ['person', 'Yetenek'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="radio"
            aria-checked={persona === key}
            onClick={() => setView({ persona: key })}
            className={`tab !py-1 ${persona === key ? 'tab-on' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        onClick={() => setView({ blind: !blind })}
        disabled={persona !== 'org'}
        aria-pressed={blind && persona === 'org'}
        title={blind ? 'Kör keşif açık: kurum ilk temasta yalnız kanıtı görür' : 'Kör keşif kapalı'}
        className={`grid h-8 w-8 place-items-center rounded-lg border text-ink-2 transition-colors disabled:opacity-30 ${
          blind && persona === 'org' ? 'border-ink bg-ink text-paper' : 'border-line hover:text-ink'
        }`}
      >
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10Z" />
          <circle cx="10" cy="10" r="2.4" />
          {blind && persona === 'org' && <path d="M3.5 16.5 16.5 3.5" />}
        </svg>
        <span className="sr-only">Kör keşif</span>
      </button>
    </div>
  );
}
