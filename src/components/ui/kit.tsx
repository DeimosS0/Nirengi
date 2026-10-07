// Shared building blocks of the new world: bars, the week strip, stat pills,
// the "Neden?" sheet, and the two global moments (celebration, feedback bar)
// that any screen can trigger without owning the overlay.

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, MotionGlobalConfig } from 'framer-motion';
import { Check, X } from 'lucide-react';
import Niri, { type Mood } from './Niri';
import './niri.css';
import { Bolt, Flame } from './icons';
import { Tri } from './pafta';

const TRI = 'M50 9 91 82H9Z';

export type Tone = 'indigo' | 'orange' | 'cyan' | 'purple' | 'gold' | 'green' | 'red';

const reduced = () => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// CSS only stops CSS animations; this stops framer-motion in every island that loads the kit.
if (reduced()) MotionGlobalConfig.skipAnimations = true;

// ---------------------------------------------------------------- numbers

/** Counts up to `target` so a number feels computed, not printed. */
export function useCountUp(target: number, ms = 800, from = 0) {
  const [v, setV] = useState(from);
  const prev = useRef(from);
  useEffect(() => {
    if (reduced()) {
      prev.current = target;
      return setV(target);
    }
    let raf = 0;
    const start = performance.now();
    const a = prev.current;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      const e = 1 - Math.pow(1 - k, 4);
      setV(Math.round(a + (target - a) * e));
      if (k < 1) raf = requestAnimationFrame(tick);
      else prev.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export function CountUp({ value, ms }: { value: number; ms?: number }) {
  return <span className="num">{useCountUp(value, ms).toLocaleString('tr-TR')}</span>;
}

// ---------------------------------------------------------------- bars

/** Thick rounded bar with a highlight stripe: progress you can feel. */
export function Bar({ value, tone = 'green', h = 16, className = '' }: { value: number; tone?: Tone; h?: number; className?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={`relative w-full overflow-hidden rounded-full bg-bg-3 ${className}`} style={{ height: h }}>
      <div
        className="relative h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(.16,1,.3,1)]"
        style={{ width: `${pct}%`, minWidth: pct > 0 ? h : 0, background: `rgb(var(--${tone}))` }}
      >
        {pct > 0 && <span className="absolute left-2 right-2 rounded-full bg-white/30" style={{ top: h * 0.2, height: Math.max(3, h * 0.22) }} />}
      </div>
    </div>
  );
}

/** Round score: thick track, rounded cap, value counting up in the middle. */
export function Ring({ value, size = 64, tone, label }: { value: number; size?: number; tone?: Tone; label?: string }) {
  const shown = useCountUp(value);
  const t: Tone = tone ?? (value >= 75 ? 'green' : value >= 55 ? 'cyan' : 'indigo');
  const sw = Math.max(5, size * 0.11);
  const r = (size - sw) / 2;
  const len = 2 * Math.PI * r;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${label ?? 'uyum'} ${value}/100`}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--bg-3))" strokeWidth={sw} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`rgb(var(--${t}))`}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={`${(shown / 100) * len} ${len}`}
        />
      </svg>
      <span className="num font-black text-ink" style={{ fontSize: size * 0.3 }}>
        {shown}
      </span>
    </div>
  );
}

/** Seven days of the week; lit days carry a flame, today wears a ring. */
export function WeekDots({ days }: { days: { key: string; name: string; active: boolean; today: boolean; future: boolean }[] }) {
  return (
    <ol className="grid grid-cols-7 gap-1.5" aria-label="Bu haftanın günleri">
      {days.map((d) => (
        <li key={d.key} className="flex flex-col items-center gap-1.5" aria-label={`${d.name}: ${d.active ? 'üretim var' : d.future ? 'henüz gelmedi' : 'üretim yok'}`}>
          <span className={`text-[13px] font-bold ${d.today ? 'text-orange-ink' : 'text-ink-3'}`}>{d.name}</span>
          {/* A survey marker per day: lit when something was produced, dashed while today is still open */}
          {d.active ? (
            <Tri size={40} tone="orange">
              <Check className="h-4 w-4 text-white" strokeWidth={4} />
            </Tri>
          ) : (
            <svg viewBox="0 0 100 98" width={40} height={39} className="overflow-visible" aria-hidden="true">
              <path
                d={TRI}
                fill={d.future ? 'rgb(var(--bg-2))' : 'rgb(var(--bg))'}
                stroke={d.today ? 'rgb(var(--orange) / 0.7)' : d.future ? 'rgb(var(--line))' : 'rgb(var(--line-2))'}
                strokeWidth="7"
                strokeLinejoin="round"
                strokeDasharray={d.today ? '12 9' : undefined}
              />
            </svg>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Inline stat: icon + number in the concept's own colour. */
export function Stat({ icon, value, tone, label, title }: { icon: ReactNode; value: ReactNode; tone: Tone; label?: string; title?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5" title={title}>
      {icon}
      <span className="text-[17px] font-black num" style={{ color: `rgb(var(--${tone}))` }}>
        {value}
      </span>
      {label && <span className="text-[14px] font-bold text-ink-3">{label}</span>}
    </span>
  );
}

// ---------------------------------------------------------------- sheet

/** "Neden?" — depth one tap below: bottom sheet on phones, panel on desktop. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button className="absolute inset-0 bg-ink/40" aria-label="Kapat" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative max-h-[85dvh] w-full overflow-auto rounded-t-[24px] border-2 border-line bg-bg p-6 sm:max-w-lg sm:rounded-[24px]"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0, transition: { duration: 0.14 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="text-[20px] font-black text-ink">{title}</h2>
              <button className="btn-quiet btn-sm !min-h-9 !px-2" onClick={onClose} aria-label="Kapat">
                <X className="h-5 w-5" strokeWidth={3} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** A small "Neden?" trigger that opens a sheet with the reasoning. */
export function Why({ title, children, label = 'Neden?' }: { title: string; children: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="rounded-full px-2 py-0.5 text-[13px] font-extrabold text-indigo transition-colors hover:bg-indigo-tint"
      >
        {label}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={title}>
        {children}
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------- global moments

export interface Celebration {
  title: string;
  sub?: string;
  xp?: number;
  streak?: number;
  cta?: string;
  /** Where the button goes after closing; without it the moment just closes. */
  href?: string;
}

export interface FeedbackMsg {
  tone: 'good' | 'bad' | 'info';
  title: string;
  text?: string;
  /** Shows a gold gem chip "+N XP" that counts up. */
  xp?: number;
  /** Shows a beacon chip with the streak in weeks. */
  streak?: number;
  /** One small follow-up button, e.g. "Geri al" or "Gör". */
  action?: { label: string; href?: string; onClick?: () => void };
}

/** Full-screen moment for things that matter: verification, a quest, a milestone. */
export const celebrate = (c: Celebration) => window.dispatchEvent(new CustomEvent('nirengi:celebrate', { detail: c }));
/** Bottom bar acknowledging an action, the way a lesson confirms an answer. */
export const feedback = (f: FeedbackMsg) => window.dispatchEvent(new CustomEvent('nirengi:feedback', { detail: f }));

const BURST = ['orange', 'cyan', 'purple', 'gold', 'green', 'indigo'];

// Niri's own triangle with rounded corners, so the rings echo the survey marker.
const RING = (() => {
  const P = [
    [60, 12],
    [108, 94],
    [12, 94],
  ];
  const k = 13;
  const toward = (a: number[], b: number[]) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy);
    return [(dx / l) * k, (dy / l) * k];
  };
  return (
    P.map((p, i) => {
      const u = toward(p, P[(i + 2) % 3]);
      const v = toward(p, P[(i + 1) % 3]);
      return `${i ? 'L' : 'M'}${(p[0] + u[0]).toFixed(1)} ${(p[1] + u[1]).toFixed(1)}Q${p[0]} ${p[1]} ${(p[0] + v[0]).toFixed(1)} ${(p[1] + v[1]).toFixed(1)}`;
    }).join('') + 'Z'
  );
})();

const RING_TONES = ['indigo', 'cyan', 'purple', 'orange'];

/** Contour-like rings that spread once from the survey point behind Niri. */
function Rings() {
  return (
    <svg viewBox="0 0 120 120" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
      {RING_TONES.map((t, i) => (
        <path key={t} className="c-ring" d={RING} fill="none" stroke={`rgb(var(--${t}) / 0.75)`} strokeWidth="2" strokeLinejoin="round" style={{ '--i': i } as CSSProperties} />
      ))}
    </svg>
  );
}

/** Small rounded triangles in palette tokens, thrown out from Niri. */
function Confetti() {
  const bits = Array.from({ length: 32 }, (_, i) => {
    const a = (i / 32) * Math.PI * 2 + (i % 3) * 0.2;
    const d = 130 + (i % 5) * 36;
    return { i, x: Math.cos(a) * d, y: Math.sin(a) * d - 70, r: (i * 53) % 360, tone: BURST[i % BURST.length], w: 9 + (i % 3) * 4 };
  });
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden="true">
      {bits.map((b) => (
        <motion.span
          key={b.i}
          className="absolute block"
          style={{ width: b.w, height: b.w, marginLeft: -b.w / 2, marginTop: -b.w / 2 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.4 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 160], opacity: [1, 1, 0], rotate: b.r * 2, scale: 1 }}
          transition={{ duration: 1.7, delay: 0.12, ease: [0.16, 1, 0.3, 1], times: [0, 0.45, 1] }}
        >
          <svg viewBox="0 0 10 10" width={b.w} height={b.w}>
            <path d="M5 1.4 8.7 8.2H1.3Z" fill={`rgb(var(--${b.tone}))`} stroke={`rgb(var(--${b.tone}))`} strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        </motion.span>
      ))}
    </div>
  );
}

/** A survey flag: drops in, bounces once and settles; the cloth keeps rippling. Static when motion is reduced. */
export function SurveyFlag({ size = 76, delay = 0, className = '' }: { size?: number; delay?: number; className?: string }) {
  return (
    <svg viewBox="0 0 60 80" width={(size * 60) / 80} height={size} className={`c-flag overflow-visible ${className}`} style={{ '--d': `${delay}s` } as CSSProperties} aria-hidden="true">
      <path d="M6 77q16-15 32 0Z" fill="rgb(var(--line-2))" />
      <ellipse className="c-dust" cx="22" cy="77" rx="16" ry="3" fill="none" stroke="rgb(var(--line-2))" strokeWidth="2" style={{ '--d': `${delay}s` } as CSSProperties} />
      <rect x="20" y="9" width="4" height="66" rx="2" fill="rgb(var(--indigo-lip))" />
      <circle cx="22" cy="8" r="3.4" fill="rgb(var(--indigo))" />
      <g className="c-cloth" style={{ '--d': `${delay}s` } as CSSProperties}>
        <path d="M25 13 53 23 25 35Z" fill="rgb(var(--orange))" stroke="rgb(var(--orange))" strokeWidth="4" strokeLinejoin="round" />
        <path d="M28 19 38 23 28 28Z" fill="rgb(var(--indigo))" stroke="rgb(var(--indigo))" strokeWidth="2" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

function CelebrationView({ c, onClose }: { c: Celebration; onClose: () => void }) {
  const xp = useCountUp(c.xp ?? 0, 1100);
  const btn = useRef<HTMLButtonElement>(null);
  const calm = reduced();
  useEffect(() => btn.current?.focus(), []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <motion.div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-bg/95 px-6 text-center backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      role="dialog"
      aria-modal="true"
      aria-label={c.title}
    >
      <motion.div className="relative h-[150px] w-[150px]" initial={{ scale: 0.6, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 16 }}>
        {!calm && <Rings />}
        {!calm && <Confetti />}
        <SurveyFlag className="absolute -right-[52px] bottom-[6px]" delay={0.85} />
        <Niri mood="cheer" size={150} className="relative" />
      </motion.div>
      <motion.h2
        className="mt-6 text-[30px] font-black text-ink md:text-[36px]"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {c.title}
      </motion.h2>
      {c.sub && <p className="lead mt-2 max-w-md">{c.sub}</p>}
      {(c.xp || c.streak) && (
        <div className="mt-7 flex gap-3">
          {!!c.xp && (
            <motion.div className="w-36 overflow-hidden rounded-[16px] border-2 border-gold" initial={{ y: 14, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 340, damping: 22 }}>
              <div className="bg-gold py-1 text-[13px] font-black text-white">Kazanılan XP</div>
              <div className="flex items-center justify-center gap-1.5 py-3">
                <Bolt size={26} />
                <span className="num text-[24px] font-black text-gold-ink">{xp}</span>
              </div>
            </motion.div>
          )}
          {!!c.streak && (
            <motion.div className="w-36 overflow-hidden rounded-[16px] border-2 border-orange" initial={{ y: 14, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ delay: 0.42, type: 'spring', stiffness: 340, damping: 22 }}>
              <div className="bg-orange py-1 text-[13px] font-black text-white">Seri</div>
              <div className="flex items-center justify-center gap-1.5 py-3">
                <span className="relative grid place-items-center">
                  {!calm && <span className="ping-soft absolute h-6 w-6 rounded-full border-2 border-orange" aria-hidden="true" />}
                  <Flame size={26} />
                </span>
                <span className="num text-[24px] font-black text-orange-ink">{c.streak} hafta</span>
              </div>
            </motion.div>
          )}
        </div>
      )}
      <button ref={btn} className="btn-primary btn-lg mt-10 w-full max-w-xs" onClick={() => {
          onClose();
          if (c.href) window.location.assign(c.href);
        }}>
        {c.cta ?? 'Devam et'}
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------- feedback toast

const TONE_OF = { good: 'green', bad: 'red', info: 'indigo' } as const;
const SHOW_MS = 4200;
const SHOW_MS_RICH = 5600;
const SPARKS = [
  [-16, -15],
  [16, -15],
  [-19, 3],
  [19, 3],
  [0, -20],
];

/** The tone as a survey marker: a rounded triangle with a drawn glyph. */
function ToneMark({ tone }: { tone: FeedbackMsg['tone'] }) {
  const col = `rgb(var(--${TONE_OF[tone]}))`;
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" className="pop shrink-0" aria-hidden="true">
      <path d="M12 4.5 20 19H4Z" fill={col} stroke={col} strokeWidth="3" strokeLinejoin="round" />
      <g fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {tone === 'good' && <path d="M8.9 14.6 11.2 16.9 15.4 12" />}
        {tone === 'bad' && <path d="M9.9 13.1 14.1 17.3M14.1 13.1 9.9 17.3" />}
        {tone === 'info' && (
          <>
            <path d="M12 14.9v2.5" />
            <circle cx="12" cy="12.4" r="0.7" fill="#fff" />
          </>
        )}
      </g>
    </svg>
  );
}

interface ToastItem {
  id: number;
  msg: FeedbackMsg;
}

function Toast({ item, newest, onDone }: { item: ToastItem; newest: boolean; onDone: (id: number) => void }) {
  const { msg, id } = item;
  const calm = reduced();
  const rich = !!(msg.xp || msg.streak || msg.action);
  const ms = rich ? SHOW_MS_RICH : SHOW_MS;
  const xp = useCountUp(msg.xp ?? 0, 800);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const paused = hover || focus;
  const left = useRef(ms);

  // The clock stops while the toast is hovered or focused and resumes with what is left.
  useEffect(() => {
    if (paused) return;
    const t0 = performance.now();
    const t = window.setTimeout(() => onDone(id), Math.max(0, left.current));
    return () => {
      window.clearTimeout(t);
      left.current -= performance.now() - t0;
    };
  }, [paused, id, onDone]);

  const mood = msg.tone === 'bad' ? 'sad' : msg.tone === 'info' ? 'talk' : rich && (msg.xp || msg.streak) ? 'cheer' : 'happy';
  const col = TONE_OF[msg.tone];
  return (
    <motion.div
      layout
      role="status"
      className="feedback-toast pointer-events-auto relative w-full max-w-[440px] rounded-[18px] border-2 border-line bg-bg shadow-[0_14px_36px_-12px_rgb(0_0_0/0.3),0_2px_8px_-2px_rgb(0_0_0/0.12)]"
      initial={{ y: 56, opacity: 0, scale: 0.94 }}
      animate={{ y: 0, opacity: newest ? 1 : 0.88, scale: newest ? 1 : 0.96, ...(msg.tone === 'bad' && newest ? { x: [0, -7, 6, -4, 2, 0] } : {}) }}
      exit={{ y: 28, opacity: 0, scale: 0.96, transition: { duration: 0.16 } }}
      transition={{ type: 'spring', stiffness: 460, damping: 26, x: { duration: 0.42, ease: 'easeOut', delay: 0.12 } }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.5 }}
      dragSnapToOrigin
      onDragEnd={(_, i) => {
        if (i.offset.y > 36 || i.velocity.y > 450) onDone(id);
      }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false);
      }}
    >
      <div className="flex items-center gap-3 py-3 pl-3 pr-3">
        <Niri mood={mood} size={52} react={false} cue={msg.tone === 'bad' ? undefined : id} className="-my-1" />
        <div className="min-w-0 flex-1 pr-5">
          <div className="flex items-center gap-2">
            <ToneMark tone={msg.tone} />
            <p className="text-[17px] font-black leading-tight text-ink">{msg.title}</p>
          </div>
          {msg.text && <p className="mt-0.5 text-[14px] font-bold leading-snug text-ink-3">{msg.text}</p>}
          {rich && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {!!msg.xp && (
                <span className="pop inline-flex items-center gap-1.5 rounded-full border-2 border-gold bg-gold-tint py-0.5 pl-1.5 pr-2.5" style={{ animationDelay: '0.25s' }}>
                  <span className="relative grid place-items-center">
                    <Bolt size={20} className="fb-gem" />
                    {!calm && SPARKS.map(([dx, dy], i) => (
                      <svg key={i} className="fb-spark" viewBox="0 0 10 10" aria-hidden="true" style={{ '--dx': `${dx}px`, '--dy': `${dy}px`, '--d': `${i * 0.03}s` } as CSSProperties}>
                        <path d="M5 1.4 8.7 8.2H1.3Z" fill="rgb(var(--gold))" stroke="rgb(var(--gold))" strokeWidth="1.6" strokeLinejoin="round" />
                      </svg>
                    ))}
                  </span>
                  <span className="num text-[15px] font-black text-gold-ink" aria-hidden="true">+{xp} XP</span>
                  <span className="sr-only">{msg.xp} XP kazandın</span>
                </span>
              )}
              {!!msg.streak && (
                <span className="pop inline-flex items-center gap-1.5 rounded-full border-2 border-orange bg-orange-tint py-0.5 pl-1.5 pr-2.5" style={{ animationDelay: '0.35s' }}>
                  <span className="relative grid place-items-center">
                    {!calm && <span className="ping-soft absolute h-5 w-5 rounded-full border-2 border-orange" aria-hidden="true" />}
                    <Flame size={20} />
                  </span>
                  <span className="num text-[15px] font-black text-orange-ink" aria-hidden="true">{msg.streak} hafta</span>
                  <span className="sr-only">{msg.streak} haftalık seri</span>
                </span>
              )}
              {msg.action &&
                (msg.action.href ? (
                  <a
                    href={msg.action.href}
                    className="btn-quiet btn-sm ml-auto !min-h-8 !px-2.5"
                    onClick={() => {
                      msg.action?.onClick?.();
                      onDone(id);
                    }}
                  >
                    {msg.action.label}
                  </a>
                ) : (
                  <button
                    type="button"
                    className="btn-quiet btn-sm ml-auto !min-h-8 !px-2.5"
                    onClick={() => {
                      msg.action?.onClick?.();
                      onDone(id);
                    }}
                  >
                    {msg.action.label}
                  </button>
                ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDone(id)}
          aria-label="Kapat"
          className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-bg-2 hover:text-ink"
        >
          <X className="h-[18px] w-[18px]" strokeWidth={3} />
        </button>
      </div>
      {/* time left: shrinks over the visible time, stops with the clock */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] overflow-hidden rounded-b-[16px]" aria-hidden="true">
        <div className="fb-bar h-full" style={{ background: `rgb(var(--${col}))`, '--ms': `${ms}ms`, '--play': paused ? 'paused' : 'running' } as CSSProperties} />
      </div>
    </motion.div>
  );
}

/** Mount once per page (the layout does it); listens for celebrate() and feedback(). */
export function Overlays() {
  const [cel, setCel] = useState<Celebration | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [leaving, setLeaving] = useState(false);
  const seq = useRef(0);
  useEffect(() => {
    const onCel = (e: Event) => setCel((e as CustomEvent<Celebration>).detail);
    // Newest at the bottom, at most two on screen; an identical repeat replaces its twin.
    const onFb = (e: Event) => {
      const msg = (e as CustomEvent<FeedbackMsg>).detail;
      const id = ++seq.current;
      setToasts((prev) => {
        const last = prev[prev.length - 1];
        const base = last && last.msg.title === msg.title && last.msg.text === msg.text ? prev.slice(0, -1) : prev;
        return [...base, { id, msg }].slice(-2);
      });
    };
    window.addEventListener('nirengi:celebrate', onCel);
    window.addEventListener('nirengi:feedback', onFb);
    return () => {
      window.removeEventListener('nirengi:celebrate', onCel);
      window.removeEventListener('nirengi:feedback', onFb);
    };
  }, []);
  const done = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    setLeaving(true);
    window.setTimeout(() => setLeaving(false), 500);
  }, []);
  return (
    <>
      <AnimatePresence>{cel && <CelebrationView c={cel} onClose={() => setCel(null)} />}</AnimatePresence>
      {/* .feedback-dock is also how other floating buttons notice a toast and step aside */}
      {(toasts.length > 0 || leaving) && (
        <div className="feedback-dock pointer-events-none fixed inset-x-0 z-[75] flex flex-col items-center gap-2 px-4">
          <AnimatePresence initial={false} onExitComplete={() => setLeaving(false)}>
            {toasts.map((t, i) => (
              <Toast key={t.id} item={t} newest={i === toasts.length - 1} onDone={done} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------- misc

/** Section heading with an optional action on the right. */
export function Head({ title, action, className = '' }: { title: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={`flex items-end justify-between gap-3 ${className}`}>
      <h2 className="h-sec">{title}</h2>
      {action}
    </div>
  );
}

/** Empty state that teaches the next step instead of saying "nothing here". */
export function EmptyState({ title, children, action, mood = 'think' }: { title: string; children?: ReactNode; action?: ReactNode; mood?: Mood }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <Niri mood={mood} size={96} />
      <p className="mt-4 text-[18px] font-black text-ink">{title}</p>
      {children && <div className="mt-1 max-w-sm text-[15px] text-ink-3">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
