// Spotlight tour: dims the page with an SVG mask, cuts a rounded hole around the
// target and parks Niri with a bubble card next to it. One animation-frame loop
// follows the target through scroll, resize and layout shifts, so nothing has to
// be re-triggered by hand. On phones the card docks above the tab bar.

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Niri, { type Dir } from '../ui/Niri';
import { Pip } from './art';
import type { CoachStep } from './tours';
import { findTarget, reduced, useTrap } from './util';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}
type Side = 'right' | 'left' | 'top' | 'bottom' | 'dock';

const PAD = 8; // the hole is the target plus this much air
const GAP = 18; // hole to card
const M = 12; // card to viewport edge
const CARD_W = 440; // Niri + bubble on desktop
const TAB_BAR = 72; // phone tab bar plus a breath

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const isPhone = () => innerWidth < 640;
const headerH = () => (innerWidth < 1024 ? 64 : 0);

/** Scroll the target into the part of the screen the card does not cover. */
function reveal(el: HTMLElement, reserve: number, smooth: boolean) {
  const r = el.getBoundingClientRect();
  const top = headerH() + 16;
  const bottom = innerHeight - reserve - 16;
  const free = bottom - top;
  let dy = 0;
  if (r.height > free) dy = r.top - top;
  else if (r.top < top || r.bottom > bottom) dy = r.top + r.height / 2 - (top + free / 2);
  if (Math.abs(dy) > 2) window.scrollBy({ top: dy, behavior: smooth ? 'smooth' : 'auto' });
}

export default function Coach({ steps, onClose }: { steps: CoachStep[]; onClose: (finished: boolean) => void }) {
  // Steps whose target is not on this screen are dropped up front, so the dots tell the truth.
  const live = useMemo(() => steps.filter((s) => findTarget(s.target)), [steps]);
  const [i, setI] = useState(0);
  const [side, setSide] = useState<Side>('dock');
  const [phone, setPhone] = useState(isPhone);
  const maskId = `coach-${useId().replace(/:/g, '')}`;

  const card = useRef<HTMLDivElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const hole = useRef<SVGRectElement>(null);
  const ring = useRef<SVGRectElement>(null);
  const ping = useRef<SVGRectElement>(null);
  const shown = useRef<Rect | null>(null);
  const sideRef = useRef<Side | null>(null);
  const dockTop = useRef(false);
  const advance = useRef<() => void>(() => {});

  const n = live.length;
  const last = i >= n - 1;
  const step = live[i];
  const next = () => (last ? onClose(true) : setI(i + 1));
  const back = () => setI(Math.max(0, i - 1));
  advance.current = next;

  useTrap(card, () => onClose(false));

  useEffect(() => {
    if (!n) onClose(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  useEffect(() => {
    const onResize = () => setPhone(isPhone());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    primary.current?.focus({ preventScroll: true });
  }, [i]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  // The loop: measure the target, ease the hole toward it, keep the card beside it.
  useEffect(() => {
    if (!step) return;
    const snap = reduced();
    const sel = step.target;
    let el = findTarget(sel);
    let radius = 14;
    let lost = 0;
    let raf = 0;
    sideRef.current = null;

    const measure = (e: HTMLElement) => {
      const px = parseFloat(getComputedStyle(e).borderTopLeftRadius);
      radius = Number.isFinite(px) ? px : 14;
    };
    if (el) {
      measure(el);
      reveal(el, isPhone() ? TAB_BAR + (card.current?.offsetHeight ?? 240) + 12 : 0, !snap);
    }

    const place = (s: Rect) => {
      const c = card.current;
      if (!c) return;
      c.style.opacity = '1';
      if (isPhone()) {
        // Docked above the tab bar; flips to the top when the target sits under it.
        const ch = c.offsetHeight;
        const under = s.y + s.h > innerHeight - TAB_BAR - ch - 6;
        const top = under && s.y > headerH() + ch + 12;
        if (top !== dockTop.current) {
          dockTop.current = top;
          c.style.top = top ? `${headerH() + 12}px` : '';
          c.style.bottom = top ? 'auto' : '';
        }
        if (sideRef.current !== 'dock') {
          sideRef.current = 'dock';
          setSide('dock');
        }
        return;
      }
      const uw = c.offsetWidth;
      const uh = c.offsetHeight;
      const vw = innerWidth;
      const vh = innerHeight;
      const top0 = headerH() + M;
      const fits = {
        right: vw - (s.x + s.w) - M >= uw + GAP,
        left: s.x - M >= uw + GAP,
        bottom: vh - (s.y + s.h) - M >= uh + GAP,
        top: s.y - top0 >= uh + GAP,
      };
      let pick = sideRef.current;
      if (!pick || (pick !== 'dock' && !fits[pick])) {
        const want = step.placement;
        pick = want && fits[want] ? want : (['right', 'left', 'bottom', 'top'] as const).find((k) => fits[k]) ?? 'dock';
        sideRef.current = pick;
        setSide(pick);
      }
      let x = (vw - uw) / 2;
      let y = vh - uh - 24;
      if (pick === 'right') [x, y] = [s.x + s.w + GAP, s.y + s.h / 2 - uh / 2];
      else if (pick === 'left') [x, y] = [s.x - GAP - uw, s.y + s.h / 2 - uh / 2];
      else if (pick === 'bottom') [x, y] = [s.x + s.w / 2 - uw / 2, s.y + s.h + GAP];
      else if (pick === 'top') [x, y] = [s.x + s.w / 2 - uw / 2, s.y - GAP - uh];
      c.style.transform = `translate3d(${clamp(x, M, vw - uw - M)}px, ${clamp(y, top0, vh - uh - M)}px, 0)`;
    };

    const tick = () => {
      if (!el || !el.isConnected) {
        el = findTarget(sel);
        if (el) measure(el);
      }
      if (!el) {
        // The target went away (a list re-rendered, a tab closed): wait briefly, then move on.
        if (++lost > 40) return advance.current();
        raf = requestAnimationFrame(tick);
        return;
      }
      lost = 0;
      const b = el.getBoundingClientRect();
      const t: Rect = { x: b.left - PAD, y: b.top - PAD, w: b.width + PAD * 2, h: b.height + PAD * 2, r: radius + PAD };
      const from = shown.current ?? (snap ? t : { x: 0, y: 0, w: innerWidth, h: innerHeight, r: 0 });
      const k = snap ? 1 : 0.22;
      const ease = (a: number, z: number) => (Math.abs(z - a) < 0.3 ? z : a + (z - a) * k);
      const s: Rect = { x: ease(from.x, t.x), y: ease(from.y, t.y), w: ease(from.w, t.w), h: ease(from.h, t.h), r: ease(from.r, t.r) };
      shown.current = s;
      const rx = Math.max(0, Math.min(s.r, s.w / 2, s.h / 2));
      for (const node of [hole.current, ring.current, ping.current]) {
        if (!node) continue;
        node.setAttribute('x', String(s.x));
        node.setAttribute('y', String(s.y));
        node.setAttribute('width', String(Math.max(0, s.w)));
        node.setAttribute('height', String(Math.max(0, s.h)));
        node.setAttribute('rx', String(rx));
      }
      place(s);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, live]);

  if (!step) return null;

  // Niri sits on the side of the card that faces the target and points at it.
  const niriFirst = side !== 'left';
  const mood = step.mood ?? 'point';
  const aim: Dir = side === 'right' ? 'left' : side === 'left' ? 'right' : side === 'bottom' ? 'up' : side === 'top' ? 'down' : 'up';

  const body = (
    <>
      <div key={i} className="rise">
        <h2 id="coach-title" className="text-[18px] font-black leading-snug text-ink">
          {step.title}
        </h2>
        <p id="coach-text" className="mt-1 text-[15px] font-semibold leading-relaxed text-ink-2" aria-live="polite">
          {step.text}
        </p>
      </div>
      <div className="mt-3 flex items-center gap-1" role="img" aria-label={`${n} adımın ${i + 1}. adımı`}>
        {live.map((s, k) => (
          <Pip key={s.title} size={14} state={k < i ? 'done' : k === i ? 'now' : 'next'} />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        {!last && (
          <button type="button" className="btn-quiet btn-sm !px-2 !text-ink-3" onClick={() => onClose(false)}>
            Turu geç
          </button>
        )}
        <span className="flex-1" />
        {i > 0 && (
          <button type="button" className="btn-line btn-sm" onClick={back}>
            Geri
          </button>
        )}
        <button ref={primary} type="button" className="btn-primary btn-sm" onClick={next}>
          {last ? 'Bitti' : 'İleri'}
        </button>
      </div>
    </>
  );

  return (
    <div data-assistant className="fixed inset-0 z-[74]" onClick={(e) => e.stopPropagation()}>
      <motion.svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            <rect ref={hole} fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgb(20 18 36 / 0.62)" mask={`url(#${maskId})`} />
        <rect ref={ring} fill="none" stroke="rgb(var(--indigo))" strokeWidth="3" />
        <rect ref={ping} fill="none" stroke="rgb(var(--indigo))" className="coach-ping" />
      </motion.svg>
      <style>{'@keyframes coach-ping{from{stroke-width:3;opacity:.55}to{stroke-width:20;opacity:0}}.coach-ping{animation:coach-ping 1.9s cubic-bezier(0,0,.2,1) infinite}'}</style>

      {phone ? (
        <div
          ref={card}
          role="dialog"
          aria-modal="true"
          aria-labelledby="coach-title"
          aria-describedby="coach-text"
          data-assistant
          className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+72px)] rounded-[22px] border-2 border-line bg-bg p-4 opacity-0 shadow-[0_14px_36px_-14px_rgb(0_0_0/0.4)]"
        >
          <div className="flex items-start gap-3">
            <Niri mood={mood} point="up" look={mood === 'point' ? undefined : 'up'} size={56} className="-mt-1" cue={step.title} />
            <div className="min-w-0 flex-1">{body}</div>
          </div>
        </div>
      ) : (
        <div ref={card} role="dialog" aria-modal="true" aria-labelledby="coach-title" aria-describedby="coach-text" data-assistant className="fixed left-0 top-0 opacity-0" style={{ width: CARD_W }}>
          <div className={`flex items-end gap-1.5 ${niriFirst ? '' : 'flex-row-reverse'}`}>
            <div className="shrink-0">
              <Niri mood={side === 'dock' ? 'talk' : mood} point={aim} look={mood === 'point' ? undefined : aim} size={88} cue={step.title} />
            </div>
            <div className="relative mb-3 min-w-0 flex-1 rounded-[20px] border-2 border-line bg-bg p-4 shadow-[0_14px_36px_-14px_rgb(0_0_0/0.4)]">
              <span
                className={`absolute bottom-5 h-4 w-4 rotate-45 bg-bg ${niriFirst ? '-left-[9px] border-b-2 border-l-2 border-line' : '-right-[9px] border-r-2 border-t-2 border-line'}`}
                aria-hidden="true"
              />
              {body}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
