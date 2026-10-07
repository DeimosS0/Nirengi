import { useEffect, useRef, type ReactNode } from 'react';
import type { Level, Person } from '../../lib/types.ts';
import { LEVELS } from '../../lib/labels.ts';
import { blindCode, initials } from '../../lib/format.ts';
import { useView } from '../../lib/store.ts';
import { AlertTriangle, Check, Circle, X } from 'lucide-react';
import { Bar, EmptyState, Ring } from './kit';
import { Mark as BrandMark } from './icons';

// ---------------------------------------------------------------- glyphs

const STATUS = { ok: Check, fail: X, warn: AlertTriangle, pending: Circle } as const;
const STATUS_TONE = { ok: 'text-green-lip', fail: 'text-red-lip', warn: 'text-orange-ink', pending: 'text-ink-3' } as const;

/** Drawn status mark (never a Unicode glyph): passed, blocking, warning, pending. */
export function StatusIcon({ kind, className = '' }: { kind: keyof typeof STATUS; className?: string }) {
  const I = STATUS[kind];
  return <I aria-hidden="true" strokeWidth={3} className={`inline-block h-4 w-4 shrink-0 align-[-3px] ${STATUS_TONE[kind]} ${className}`} />;
}

/** Plain names people understand; the S-codes stay on /yontem. */
export const LEVEL_NAME: Record<Level, string> = { S1: 'Beyan', S2: 'Doğrulandı', S3: 'Kurum onaylı' };
const LEVEL_TONE: Record<Level, string> = { S1: 'ink-3', S2: 'cyan-lip', S3: 'indigo' };

/** Verification glyph: dashed triangle (beyan), outlined with a dot (doğrulandı), filled (kurum onaylı). */
export function LevelGlyph({ level, size = 16 }: { level: Level; size?: number }) {
  const color = `rgb(var(--${LEVEL_TONE[level]}))`;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <path
        d="M8 2.2 14.2 13.3H1.8Z"
        fill={level === 'S3' ? color : 'none'}
        stroke={color}
        strokeWidth={level === 'S1' ? 1.6 : 2}
        strokeLinejoin="round"
        strokeDasharray={level === 'S1' ? '2.2 1.8' : undefined}
      />
      {level !== 'S1' && <circle cx="8" cy="9.6" r="1.6" fill={level === 'S3' ? '#fff' : color} />}
    </svg>
  );
}

export function LevelBadge({ level, long = false }: { level: Level; long?: boolean }) {
  const tone = level === 'S1' ? 'bg-bg-3 text-ink-3' : level === 'S2' ? 'bg-cyan-tint text-cyan-lip' : 'bg-indigo-tint text-indigo';
  return (
    <span className={`pill ${tone}`} title={`${LEVEL_NAME[level]} — ${LEVELS[level].short}`}>
      <LevelGlyph level={level} size={14} />
      {LEVEL_NAME[level]}
      {long && <span className="font-bold opacity-70">· {LEVELS[level].name}</span>}
    </span>
  );
}

export function Mark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <span className={`inline-grid ${className}`}>
      <BrandMark size={32} className="h-full w-full" />
    </span>
  );
}

// ---------------------------------------------------------------- identity

const TONES = ['indigo', 'orange', 'cyan', 'purple', 'green', 'red', 'gold-lip', 'cyan-lip'];
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
export function Avatar({ person, size = 44, reveal = false }: { person: Person; size?: number; reveal?: boolean }) {
  const id = useIdentity(person);
  if (id.hidden && !reveal)
    return (
      <span
        className="grid shrink-0 place-items-center rounded-full border-2 border-dashed border-line-2 bg-bg-2 text-ink-3"
        style={{ width: size, height: size }}
        title="Kör keşif: kimlik ilk temasa kadar gizli"
      >
        <svg viewBox="0 0 16 16" width={size * 0.44} height={size * 0.44} aria-hidden="true">
          <path d="M8 2.2 14.2 13.3H1.8Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      </span>
    );
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-black text-white"
      style={{ width: size, height: size, background: `rgb(var(--${tone(person.id)}))`, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials(person.name)}
    </span>
  );
}

export function OrgMark({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[12px] border-2 border-line bg-bg-2 font-black text-ink-2"
      style={{ width: size, height: size, fontSize: size * 0.46 }}
      aria-hidden="true"
    >
      {name.charAt(0)}
    </span>
  );
}

// ---------------------------------------------------------------- measures

export function ScoreDial({ value, size = 64, label = 'uyum' }: { value: number; size?: number; label?: string }) {
  return <Ring value={value} size={size} label={label} />;
}

export function Meter({ value, tone = 'ink', className = '' }: { value: number; tone?: 'ink' | 's2' | 's3' | 'signal' | 'warn'; className?: string }) {
  const t = ({ ink: 'indigo', s2: 'cyan', s3: 'indigo', signal: 'orange', warn: 'orange' } as const)[tone];
  return <Bar value={value} tone={t} h={10} className={className} />;
}

// ---------------------------------------------------------------- layout bits

export function PageHead({ eyebrow: _eyebrow, title, lead, children }: { eyebrow?: string; title: ReactNode; lead?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <h1 className="h-page">{title}</h1>
        {lead && <p className="lead mt-2">{lead}</p>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap gap-3">{children}</div>}
    </header>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <EmptyState title={title}>{children}</EmptyState>;
}

export function Loading() {
  return (
    <div className="mx-auto max-w-[600px] space-y-4 py-4" aria-label="Yükleniyor">
      <div className="h-24 animate-pulse rounded-[18px] bg-bg-3" />
      <div className="h-40 animate-pulse rounded-[18px] bg-bg-3" />
      <div className="h-28 animate-pulse rounded-[18px] bg-bg-3" />
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
      className={`m-auto w-[calc(100%-2rem)] ${wide ? 'max-w-2xl' : 'max-w-lg'} rounded-[24px] border-2 border-line bg-bg p-0 text-ink-2 backdrop:bg-ink/40`}
    >
      {open && (
        <div className="rise p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 className="text-[20px] font-black text-ink">{title}</h2>
            <button onClick={onClose} className="btn-quiet btn-sm !min-h-9 !px-2" aria-label="Kapat">
              <X className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div>
      <div className="cap">{label}</div>
      <div className="num mt-1 text-[26px] font-black text-ink">{value}</div>
      {hint && <div className="mt-0.5 text-[13px] font-bold text-ink-3">{hint}</div>}
    </div>
  );
}
