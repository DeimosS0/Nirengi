import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Level, Person } from '../../lib/types.ts';
import { LEVELS } from '../../lib/labels.ts';
import { blindCode, initials } from '../../lib/format.ts';
import { useView } from '../../lib/store.ts';
import { AlertTriangle, Check, Circle, X } from 'lucide-react';

// ---------------------------------------------------------------- glyphs

const STATUS = { ok: Check, fail: X, warn: AlertTriangle, pending: Circle } as const;

/** Drawn status mark (never a Unicode glyph): passed, blocking, warning, pending. */
export function StatusIcon({ kind, className = '' }: { kind: keyof typeof STATUS; className?: string }) {
  const I = STATUS[kind];
  return <I aria-hidden="true" strokeWidth={2.4} className={`inline-block h-3.5 w-3.5 shrink-0 align-[-2px] ${className}`} />;
}

/** Verification level glyph: dashed ▵ (beyan), outlined ▵ (makine), filled ▲ (tasdik). */
export function LevelGlyph({ level, size = 14 }: { level: Level; size?: number }) {
  const color = level === 'S1' ? 'var(--color-s1)' : level === 'S2' ? 'var(--color-s2)' : 'var(--color-s3)';
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <path
        d="M8 2.2 14.2 13.3H1.8Z"
        fill={level === 'S3' ? color : 'none'}
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeDasharray={level === 'S1' ? '2.2 1.8' : undefined}
      />
      {level !== 'S1' && <circle cx="8" cy="9.6" r="1.5" fill={level === 'S3' ? 'rgb(var(--raised))' : color} />}
    </svg>
  );
}

export function LevelBadge({ level, long = false }: { level: Level; long?: boolean }) {
  const tone =
    level === 'S1' ? 'text-s1 border-s1/35 bg-s1/8' : level === 'S2' ? 'text-s2 border-s2/35 bg-s2/8' : 'text-s3 border-s3/40 bg-s3/10';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-medium ${tone}`}
      title={`${level} · ${LEVELS[level].name} — ${LEVELS[level].short}`}
    >
      <LevelGlyph level={level} size={12} />
      {level}
      {long && <span className="font-sans font-semibold">· {LEVELS[level].name}</span>}
    </span>
  );
}

export function Mark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M16 4 28 26H4Z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M16 4v22M4 26l12-8 12 8" stroke="currentColor" strokeWidth="1.2" opacity=".45" fill="none" />
      <circle cx="16" cy="18" r="3.2" fill="rgb(var(--signal))" />
    </svg>
  );
}

// ---------------------------------------------------------------- identity

const TONES = ['#3B5B92', '#2F7A5B', '#9A4F2B', '#6B4C8A', '#8A6D1F', '#2D6F7A', '#8C3B4A', '#4E5D3A'];
const tone = (id: string) => TONES[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];

/** What the viewer is allowed to see. Blind mode hides identity for the kurum side. */
export function useIdentity(person: Person) {
  const { persona, blind, revealed } = useView();
  const hidden = blind && persona === 'org' && !person.isDemoUser && !revealed.includes(person.id);
  const code = blindCode(person.id);
  return {
    hidden,
    code,
    name: hidden ? `Aday · ${code}` : person.name,
    sub: hidden ? person.headline : `${person.headline} · ${person.city}`,
  };
}

/** `reveal` is for contexts where identity is already known to both sides (an open pilot). */
export function Avatar({ person, size = 40, reveal = false }: { person: Person; size?: number; reveal?: boolean }) {
  const id = useIdentity(person);
  if (id.hidden && !reveal)
    return (
      <span
        className="grid shrink-0 place-items-center rounded-full border border-dashed border-line-2 bg-sunken text-ink-3"
        style={{ width: size, height: size }}
        title="Kör keşif: kimlik ilk temasa kadar gizli"
      >
        <svg viewBox="0 0 16 16" width={size * 0.42} height={size * 0.42} aria-hidden="true">
          <path d="M8 2.2 14.2 13.3H1.8Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </span>
    );
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: tone(person.id), fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {initials(person.name)}
    </span>
  );
}

export function OrgMark({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-lg border border-line-2 bg-paper font-display text-ink"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      aria-hidden="true"
    >
      {name.charAt(0)}
    </span>
  );
}

// ---------------------------------------------------------------- measures

/** Animated count-up so scores feel computed, not printed. */
function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return setV(target);
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      const e = 1 - Math.pow(1 - k, 4);
      setV(Math.round(from + (target - from) * e));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export function ScoreDial({ value, size = 64, label = 'uyum' }: { value: number; size?: number; label?: string }) {
  const shown = useCountUp(value);
  const r = 15.5;
  const c = 2 * Math.PI * r;
  const tone = value >= 75 ? 'var(--s3)' : value >= 55 ? 'var(--ch2)' : 'var(--ink-3)';
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${label} ${value}/100`}>
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgb(var(--line))" strokeWidth="2.8" />
        <circle cx="18" cy="18" r={r} fill="none" stroke={`rgb(${tone})`} strokeWidth="2.8" strokeLinecap="butt" strokeDasharray={`${(shown / 100) * c} ${c}`} />
      </svg>
      <div className="text-center leading-none">
        <div className="num font-bold text-ink" style={{ fontSize: size * 0.3 }}>
          {shown}
        </div>
        {size >= 56 && <div className="plabel mt-0.5 !text-[9px]">{label}</div>}
      </div>
    </div>
  );
}

export function Meter({ value, tone = 'ink', className = '' }: { value: number; tone?: 'ink' | 's2' | 's3' | 'signal' | 'warn'; className?: string }) {
  const bg = { ink: 'bg-ink', s2: 'bg-s2', s3: 'bg-s3', signal: 'bg-signal', warn: 'bg-warn' }[tone];
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-[1px] bg-sunken ${className}`}>
      <div className={`h-full origin-left ${bg}`} style={{ transform: `scaleX(${Math.max(0, Math.min(1, value))})`, transition: 'transform 600ms cubic-bezier(.16,1,.3,1)' }} />
    </div>
  );
}

// ---------------------------------------------------------------- layout bits

export function PageHead({ eyebrow, title, lead, children }: { eyebrow: string; title: ReactNode; lead?: ReactNode; children?: ReactNode }) {
  return (
    <header className="band">
      <div className="wrap flex flex-col gap-6 py-10 md:flex-row md:items-end md:justify-between md:py-14">
        <div className="max-w-2xl">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="display mt-3 text-[44px] md:text-[56px]">{title}</h1>
          {lead && <p className="mt-4 text-[16px] leading-relaxed text-ink-2">{lead}</p>}
        </div>
        {children && <div className="flex shrink-0 flex-wrap gap-2">{children}</div>}
      </div>
    </header>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card grid place-items-center px-6 py-16 text-center">
      <svg viewBox="0 0 16 16" width="28" height="28" className="text-ink-3" aria-hidden="true">
        <path d="M8 2.2 14.2 13.3H1.8Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 1.6" strokeLinejoin="round" />
      </svg>
      <p className="mt-3 font-semibold text-ink">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-ink-3">{children}</div>}
    </div>
  );
}

export function Loading() {
  return (
    <div className="wrap py-24">
      <div className="h-6 w-40 animate-pulse rounded bg-sunken" />
      <div className="mt-4 h-12 w-2/3 animate-pulse rounded bg-sunken" />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-sunken" />
        ))}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`m-auto w-[calc(100%-2rem)] ${wide ? 'max-w-2xl' : 'max-w-lg'} rounded-[8px] border border-line-2 bg-raised p-0 text-ink shadow-2xl backdrop:bg-ink/40 backdrop:backdrop-blur-[2px]`}
    >
      {open && (
        <div className="rise">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-semibold">{title}</h2>
            <button onClick={onClose} className="btn-quiet btn-sm" aria-label="Kapat">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="px-5 py-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="num mt-1 text-2xl font-semibold text-ink">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-ink-3">{hint}</div>}
    </div>
  );
}
