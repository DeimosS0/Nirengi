// Shared building blocks of the new world: bars, the week strip, stat pills,
// the "Neden?" sheet, and the two global moments (celebration, feedback bar)
// that any screen can trigger without owning the overlay.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, MotionGlobalConfig } from 'framer-motion';
import { X } from 'lucide-react';
import Niri from './Niri';
import { Bolt, CheckCircle, Flame } from './icons';

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

/** Thick rounded bar with a highlight stripe, the Duolingo lesson bar. */
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
        <li key={d.key} className="flex flex-col items-center gap-1.5">
          <span className={`text-[12px] font-extrabold uppercase ${d.today ? 'text-orange-ink' : 'text-ink-3'}`}>{d.name}</span>
          <span
            className={`grid h-10 w-10 place-items-center rounded-full border-2 transition-colors ${
              d.active ? 'border-orange bg-orange-tint' : d.today ? 'border-orange/60 border-dashed bg-bg' : 'border-line bg-bg-2'
            }`}
            aria-label={`${d.name}: ${d.active ? 'üretim var' : d.future ? 'henüz gelmedi' : 'üretim yok'}`}
          >
            {d.active ? <Flame size={22} /> : <span className={`h-2 w-2 rounded-full ${d.future ? 'bg-line' : 'bg-line-2'}`} />}
          </span>
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
}

/** Full-screen moment for things that matter: verification, a quest, a milestone. */
export const celebrate = (c: Celebration) => window.dispatchEvent(new CustomEvent('nirengi:celebrate', { detail: c }));
/** Bottom bar acknowledging an action, the way a lesson confirms an answer. */
export const feedback = (f: FeedbackMsg) => window.dispatchEvent(new CustomEvent('nirengi:feedback', { detail: f }));

const BURST = ['orange', 'cyan', 'purple', 'gold', 'green', 'indigo'];

function Confetti() {
  const bits = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2 + (i % 3) * 0.2;
    const d = 140 + (i % 5) * 34;
    return { i, x: Math.cos(a) * d, y: Math.sin(a) * d - 60, r: (i * 47) % 360, tone: BURST[i % BURST.length], w: 8 + (i % 3) * 4, round: i % 4 === 0 };
  });
  return (
    <div className="pointer-events-none absolute left-1/2 top-[38%]" aria-hidden="true">
      {bits.map((b) => (
        <motion.span
          key={b.i}
          className={`absolute block ${b.round ? 'rounded-full' : 'rounded-[3px]'}`}
          style={{ width: b.w, height: b.round ? b.w : b.w * 0.5, background: `rgb(var(--${b.tone}))` }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.4 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 160], opacity: [1, 1, 0], rotate: b.r * 2, scale: 1 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], times: [0, 0.45, 1] }}
        />
      ))}
    </div>
  );
}

function CelebrationView({ c, onClose }: { c: Celebration; onClose: () => void }) {
  const xp = useCountUp(c.xp ?? 0, 1100);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => btn.current?.focus(), []);
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
      {!reduced() && <Confetti />}
      <motion.div initial={{ scale: 0.6, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 16 }}>
        <Niri mood="cheer" size={150} />
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
        <motion.div className="mt-7 flex gap-3" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.4 }}>
          {!!c.xp && (
            <div className="w-36 overflow-hidden rounded-[16px] border-2 border-gold">
              <div className="bg-gold py-1 text-[12px] font-black uppercase tracking-wider text-white">Kazanılan XP</div>
              <div className="flex items-center justify-center gap-1.5 py-3">
                <Bolt size={26} />
                <span className="num text-[24px] font-black text-gold-ink">{xp}</span>
              </div>
            </div>
          )}
          {!!c.streak && (
            <div className="w-36 overflow-hidden rounded-[16px] border-2 border-orange">
              <div className="bg-orange py-1 text-[12px] font-black uppercase tracking-wider text-white">Seri</div>
              <div className="flex items-center justify-center gap-1.5 py-3">
                <Flame size={26} className="flame-live" />
                <span className="num text-[24px] font-black text-orange-ink">{c.streak} hafta</span>
              </div>
            </div>
          )}
        </motion.div>
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

/** Mount once per page (the layout does it); listens for celebrate() and feedback(). */
export function Overlays() {
  const [cel, setCel] = useState<Celebration | null>(null);
  const [fb, setFb] = useState<FeedbackMsg | null>(null);
  const timer = useRef<number>(0);
  useEffect(() => {
    const onCel = (e: Event) => setCel((e as CustomEvent<Celebration>).detail);
    const onFb = (e: Event) => {
      setFb((e as CustomEvent<FeedbackMsg>).detail);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setFb(null), 3400);
    };
    window.addEventListener('nirengi:celebrate', onCel);
    window.addEventListener('nirengi:feedback', onFb);
    return () => {
      window.removeEventListener('nirengi:celebrate', onCel);
      window.removeEventListener('nirengi:feedback', onFb);
    };
  }, []);
  const tone = fb?.tone === 'bad' ? 'red' : fb?.tone === 'info' ? 'indigo' : 'green';
  return (
    <>
      <AnimatePresence>{cel && <CelebrationView c={cel} onClose={() => setCel(null)} />}</AnimatePresence>
      <AnimatePresence>
        {fb && (
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[75] border-t-2 px-4 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-5 feedback-dock"
            style={{ background: `rgb(var(--${tone}-tint))`, borderColor: `rgb(var(--${tone}) / 0.4)` }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%', transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 460, damping: 38 }}
            role="status"
          >
            <div className="mx-auto flex max-w-[960px] items-center gap-4">
              {fb.tone === 'good' ? (
                <CheckCircle size={44} className="pop" />
              ) : (
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white pop" style={{ background: `rgb(var(--${tone}))` }}>
                  {fb.tone === 'bad' ? <X className="h-6 w-6" strokeWidth={3.5} /> : <span className="text-[22px] font-black">i</span>}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-[20px] font-black" style={{ color: `rgb(var(--${tone}-lip))` }}>
                  {fb.title}
                </p>
                {fb.text && (
                  <p className="text-[15px] font-bold" style={{ color: `rgb(var(--${tone}-lip))` }}>
                    {fb.text}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
export function EmptyState({ title, children, action, mood = 'think' }: { title: string; children?: ReactNode; action?: ReactNode; mood?: 'think' | 'wave' | 'idle' }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <Niri mood={mood} size={96} />
      <p className="mt-4 text-[18px] font-black text-ink">{title}</p>
      {children && <div className="mt-1 max-w-sm text-[15px] text-ink-3">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
