// Pafta: the map-sheet world of Nirengi. A nirengi point is a triangulation
// marker; every verified piece of work is one more point on your map. These
// primitives carry that world: contour lines, ridge silhouettes, triangle
// markers and the survey trail that links them.

import { useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Tone } from './kit';

// ---------------------------------------------------------------- contours

/** One closed contour ring, radius wobbled by a few harmonics, Catmull–Rom smoothed. */
export function contourPath(cx: number, cy: number, r: number, seed: number, points = 28): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const t = (i / points) * Math.PI * 2;
    const k = 1 + 0.09 * Math.sin(3 * t + seed) + 0.05 * Math.sin(5 * t + seed * 1.7) + 0.03 * Math.cos(2 * t - seed);
    pts.push([cx + Math.cos(t) * r * k * 1.18, cy + Math.sin(t) * r * k * 0.82]);
  }
  const p = (i: number) => pts[(i + points) % points];
  let d = `M${p(0)[0].toFixed(1)} ${p(0)[1].toFixed(1)}`;
  for (let i = 0; i < points; i++) {
    const [x0, y0] = p(i - 1);
    const [x1, y1] = p(i);
    const [x2, y2] = p(i + 1);
    const [x3, y3] = p(i + 2);
    d += `C${(x1 + (x2 - x0) / 6).toFixed(1)} ${(y1 + (y2 - y0) / 6).toFixed(1)} ${(x2 - (x3 - x1) / 6).toFixed(1)} ${(y2 - (y3 - y1) / 6).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  return `${d}Z`;
}

/**
 * Faint topographic rings filling the parent (which must be `relative overflow-hidden`).
 * `color` is a token name; on coloured panels use 'white'.
 */
export function Contours({
  seed = 1,
  x = 0.78,
  y = 0.35,
  rings = 9,
  step = 30,
  color = 'line-2',
  opacity = 0.5,
  className = '',
}: {
  seed?: number;
  x?: number;
  y?: number;
  rings?: number;
  step?: number;
  color?: string;
  opacity?: number;
  className?: string;
}) {
  const paths = useMemo(() => Array.from({ length: rings }, (_, i) => contourPath(x * 600, y * 300, step * (i + 1), seed + i * 0.35)), [seed, x, y, rings, step]);
  const stroke = color === 'white' ? `rgb(255 255 255 / ${opacity})` : `rgb(var(--${color}) / ${opacity})`;
  return (
    <svg viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden="true">
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={stroke} strokeWidth={i % 4 === 3 ? 2.2 : 1.3} />
      ))}
    </svg>
  );
}

/** A ridge silhouette; `level` 0–4 lifts the peak (Zemin → Zirve). */
export function Ridge({ level = 1, className = '', color = 'white', opacity = 0.22 }: { level?: number; className?: string; color?: string; opacity?: number }) {
  const h = 18 + level * 9;
  const fill = color === 'white' ? `rgb(255 255 255 / ${opacity})` : `rgb(var(--${color}) / ${opacity})`;
  return (
    <svg viewBox="0 0 120 64" className={`pointer-events-none ${className}`} aria-hidden="true">
      <path d={`M0 64 L22 ${64 - h * 0.55} L38 ${64 - h * 0.42} L62 ${64 - h} L78 ${64 - h * 0.62} L94 ${64 - h * 0.75} L120 ${64 - h * 0.3} V64Z`} fill={fill} />
      <path d={`M62 ${64 - h} l-6 ${h * 0.22} l6 -2 l6 2Z`} fill="rgb(255 255 255 / 0.55)" />
    </svg>
  );
}

// ---------------------------------------------------------------- triangle marker

export type MarkState = 'done' | 'current' | 'locked' | 'waiting';

const TRI = 'M50 9 91 82H9Z';

/**
 * The survey marker: a rounded triangle sitting on a lip of its own hue.
 * Content is centred on the triangle's centroid, not the box.
 */
export function Tri({ size = 76, tone = 'indigo', state = 'done', children }: { size?: number; tone?: Tone; state?: MarkState; children?: ReactNode }) {
  const locked = state === 'locked';
  const waiting = state === 'waiting';
  const face = locked ? 'rgb(var(--bg-3))' : waiting ? 'rgb(var(--bg-2))' : `rgb(var(--${tone}))`;
  const lip = locked || waiting ? 'rgb(var(--line-2))' : `rgb(var(--${tone}-lip))`;
  return (
    <span className="relative block" style={{ width: size, height: size * 0.92 }}>
      <svg viewBox="0 0 100 98" width={size} height={size * 0.98} className="absolute left-0 top-0 overflow-visible" aria-hidden="true">
        <path d={TRI} transform="translate(0 7)" fill={lip} stroke={lip} strokeWidth="14" strokeLinejoin="round" />
        <path d={TRI} fill={face} stroke={face} strokeWidth="14" strokeLinejoin="round" />
        {waiting && <path d={TRI} fill="none" stroke="rgb(var(--line-2))" strokeWidth="3" strokeDasharray="7 6" strokeLinejoin="round" />}
        {!locked && !waiting && <path d="M50 20 30 56" stroke="rgb(255 255 255 / 0.28)" strokeWidth="6" strokeLinecap="round" />}
      </svg>
      <span className="absolute inset-x-0 grid place-items-center" style={{ top: size * 0.3, height: size * 0.52 }}>
        {children}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------- trail

export interface TrailNode {
  id: string;
  title: string;
  state: MarkState;
  tone: Tone;
  label: string; // accessible state, e.g. "tamamlandı"
  onClick: () => void;
  icon: ReactNode;
  /** Optional status line under the title, e.g. "Onayın bekleniyor". */
  caption?: { text: string; cls: string };
}

const W = 340;
const ROW = 132;
const NODE = 78;
/** Horizontal sway of the trail, continued across units by `from`. */
const sway = (i: number) => Math.round(Math.sin(i * 1.05 + 0.4) * 78);

function smooth(pts: [number, number][]) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/**
 * The survey trail: triangle markers on a dashed line that is inked in up to
 * the current marker. `from` keeps the sway continuous across sections.
 */
export function Trail({ nodes, from = 0, pin = 'Sıradaki', row = ROW }: { nodes: TrailNode[]; from?: number; pin?: string; row?: number }) {
  const pts = nodes.map((_, i) => [W / 2 + sway(from + i), i * row + NODE * 0.55] as [number, number]);
  const reached = nodes.reduce((n, x, i) => (x.state === 'done' || x.state === 'current' || x.state === 'waiting' ? i : n), -1);
  const lead = nodes[Math.max(0, reached)]?.tone ?? 'indigo';
  const all = smooth(pts);
  const inked = reached > 0 ? smooth(pts.slice(0, reached + 1)) : '';
  const height = (nodes.length - 1) * row + NODE + 110; // room for a long title and its caption
  return (
    <ol className="relative mx-auto" style={{ width: W, maxWidth: '100%', height }}>
      <svg viewBox={`0 0 ${W} ${height}`} width={W} height={height} className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2" aria-hidden="true">
        <path d={all} fill="none" stroke="rgb(var(--line-2))" strokeWidth="4" strokeDasharray="2 12" strokeLinecap="round" />
        {inked && (
          <motion.path
            d={inked}
            fill="none"
            stroke={`rgb(var(--${lead}) / 0.55)`}
            strokeWidth="5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          />
        )}
      </svg>
      {nodes.map((n, i) => {
        const [x, y] = pts[i];
        const current = n.state === 'current';
        return (
          <li key={n.id} className="absolute flex w-40 flex-col items-center" style={{ left: `calc(50% + ${x - W / 2}px)`, top: y - NODE * 0.55, transform: 'translateX(-50%)' }}>
            <button
              type="button"
              onClick={n.onClick}
              aria-label={`${n.title} — ${n.label}`}
              className="relative transition-transform duration-100 active:translate-y-[5px]"
            >
              {current && (
                <>
                  <span className="ping-soft absolute left-1/2 top-[58%] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: `rgb(var(--${n.tone}) / 0.35)` }} />
                  <span className="ping-soft absolute left-1/2 top-[58%] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: `rgb(var(--${n.tone}) / 0.25)`, animationDelay: '1.1s' }} />
                </>
              )}
              <Tri size={NODE} tone={n.tone} state={n.state}>
                {n.icon}
              </Tri>
            </button>
            <p className={`relative mt-2 rounded-[8px] bg-bg px-1.5 py-0.5 text-center text-[14px] font-semibold leading-tight ${n.state === 'locked' ? 'text-ink-3' : 'text-ink-2'}`}>{n.title}</p>
            {(n.caption || current) && (
              <p className={`relative rounded-[8px] bg-bg px-1.5 text-[13px] font-bold ${n.caption?.cls ?? ''}`} style={n.caption ? undefined : { color: `rgb(var(--${n.tone}))` }}>
                {n.caption?.text ?? pin}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------- climb map

export interface MapPoint {
  id: string;
  title: string;
  state: 'done' | 'current' | 'locked';
  label: string; // accessible state
  onClick: () => void;
  icon: ReactNode;
}

export interface MapZone {
  id: string;
  title: string;
  tone: Tone;
  points: MapPoint[];
}

const PT = 60; // marker size
const STEP = 92; // vertical distance between points
const ZONE = 52; // room for a zone's isoline label
const TOP = 72; // above the last point: the summit rings
const FOOT = 28;

/** Switchback across the slope; the last point sits on the summit line. */
const across = (i: number, n: number) => (i === n - 1 ? 0.5 : (i % 2 ? 0.66 : 0.34) + [0, 0.04, -0.04][i % 3]);

/**
 * The pafta: your steps plotted on a contour map, climbing from the foot (first
 * step, bottom) to the summit (last step, top). Zones are isolines with a label;
 * the trail is dashed and inks itself up to where you stand.
 */
export function ClimbMap({ zones }: { zones: MapZone[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(560);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const mask = `ink${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  // Lay out bottom-up, then flip to top-based coordinates.
  const n = zones.reduce((k, z) => k + z.points.length, 0);
  let cur = FOOT;
  let i = 0;
  const lines: { y: number; z: MapZone; done: number }[] = [];
  const pts: { p: MapPoint; z: MapZone; x: number; y: number }[] = [];
  for (const z of zones) {
    lines.push({ y: cur, z, done: z.points.filter((p) => p.state === 'done').length });
    cur += ZONE;
    for (const p of z.points) {
      pts.push({ p, z, x: across(i++, n) * w, y: cur + PT / 2 });
      cur += STEP;
    }
  }
  const h = cur - STEP + PT + TOP;
  const flip = (y: number) => h - y;
  const xy = pts.map((q) => [q.x, flip(q.y)] as [number, number]);
  const reached = pts.reduce((k, q, j) => (q.p.state !== 'locked' ? j : k), -1);
  const lead = pts[Math.max(0, reached)]?.z.tone ?? 'indigo';
  const rings = useMemo(() => Array.from({ length: 14 }, (_, k) => contourPath(w / 2, TOP * 0.35, 34 + k * (h / 11), 2 + k * 0.4, 36)), [w, h]);

  return (
    <div ref={box} className="relative" style={{ height: h }}>
      <svg width={w} height={h} className="pointer-events-none absolute inset-0" aria-hidden="true">
        {rings.map((d, k) => (
          <path key={k} d={d} fill="none" stroke={`rgb(var(--line-2) / ${k % 4 === 3 ? 0.7 : 0.45})`} strokeWidth={k % 4 === 3 ? 1.8 : 1.1} />
        ))}
        {lines.map((l) => (
          <line key={l.z.id} x1={0} x2={w} y1={flip(l.y)} y2={flip(l.y)} stroke={`rgb(var(--${l.z.tone}) / 0.35)`} strokeWidth={1.5} strokeDasharray="6 6" />
        ))}
        <path d={smooth(xy)} fill="none" stroke="rgb(var(--line-2))" strokeWidth="4" strokeDasharray="2 12" strokeLinecap="round" />
        {reached > 0 && (
          <>
            <mask id={mask} maskUnits="userSpaceOnUse">
              <motion.path
                d={smooth(xy.slice(0, reached + 1))}
                fill="none"
                stroke="#fff"
                strokeWidth="14"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              />
            </mask>
            <path
              d={smooth(xy.slice(0, reached + 1))}
              fill="none"
              stroke={`rgb(var(--${lead}))`}
              strokeWidth="4.5"
              strokeDasharray="10 8"
              strokeLinecap="round"
              mask={`url(#${mask})`}
            />
          </>
        )}
      </svg>

      {lines.map((l) => (
        <p key={l.z.id} className="absolute left-0 flex items-baseline gap-2 rounded-[8px] bg-bg px-1.5 text-[14px] font-bold" style={{ top: flip(l.y) - 30 }}>
          <span style={{ color: `rgb(var(--${l.z.tone}))` }}>{l.z.title}</span>
          <span className="num text-[13px] text-ink-3">
            {l.done}/{l.z.points.length}
          </span>
        </p>
      ))}

      <ol>
        {pts.map((q, j) => {
          const [x, y] = xy[j];
          const right = x <= w / 2; // label on the open side of the slope
          const current = q.p.state === 'current';
          return (
            <li key={q.p.id}>
              <button
                type="button"
                onClick={q.p.onClick}
                aria-label={`${q.p.title} — ${q.p.label}`}
                className="absolute transition-transform duration-100 active:translate-y-[4px]"
                style={{ left: x - PT / 2, top: y - PT * 0.55 }}
              >
                {current && (
                  <>
                    <span className="ping-soft absolute left-1/2 top-[58%] h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: `rgb(var(--${q.z.tone}) / 0.35)` }} />
                    <span
                      className="ping-soft absolute left-1/2 top-[58%] h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{ background: `rgb(var(--${q.z.tone}) / 0.25)`, animationDelay: '1.1s' }}
                    />
                  </>
                )}
                <Tri size={PT} tone={q.z.tone} state={q.p.state}>
                  {q.p.icon}
                </Tri>
              </button>
              <p
                className={`pointer-events-none absolute -translate-y-1/2 rounded-[8px] bg-bg/90 px-1.5 text-[15px] leading-tight ${right ? 'text-left' : 'text-right'} ${q.p.state === 'locked' ? 'font-semibold text-ink-3' : 'font-bold text-ink-2'}`}
                style={{ top: y, maxWidth: right ? w - x - PT / 2 - 14 : x - PT / 2 - 14, ...(right ? { left: x + PT / 2 + 8 } : { right: w - x + PT / 2 + 8 }) }}
              >
                {q.p.title}
                {current && (
                  <span className="block text-[13px] font-bold" style={{ color: `rgb(var(--${q.z.tone}))` }}>
                    Buradasın · sıradaki adım
                  </span>
                )}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
