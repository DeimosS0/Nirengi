// The standard "Niri says" pattern: the mascot beside a speech bubble. The bubble
// matches the app's seams (2px line, bg, radius 18) with a rotated-square tail.
// On mount and whenever the message changes Niri hops in and the bubble grows out
// of its tail; with `typing` the text then types in while Niri talks.

import { Children, cloneElement, isValidElement, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import Niri, { type Dir, type Look, type Mood } from './Niri';

export interface NiriSaysProps {
  mood?: Mood;
  size?: number;
  /** The bubble content. */
  children: ReactNode;
  /** Which side of Niri the bubble sits on. */
  side?: 'right' | 'left';
  /** Type the text in (at most 600 ms); Niri talks meanwhile. Skipped under reduced motion. */
  typing?: boolean;
  point?: Dir;
  look?: Look;
  /** Hop in and grow the bubble on mount and on every new message. Default on. */
  entrance?: boolean;
  className?: string;
}

const TYPE_MS = 600;
/** Typing waits for the bubble to finish growing. */
const TYPE_DELAY = 200;

/** Plain text of a node tree, used to restart typing when the message changes. */
function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  let out = '';
  Children.forEach(node, (n) => {
    if (isValidElement<{ children?: ReactNode }>(n)) out += textOf(n.props.children);
    else if (typeof n === 'string' || typeof n === 'number') out += String(n);
  });
  return out;
}

/** Shows the first `n` characters of the tree; the rest keeps its space but stays invisible. */
function reveal(node: ReactNode, n: number): ReactNode {
  let left = n;
  const walk = (x: ReactNode): ReactNode =>
    Children.map(x, (child) => {
      if (typeof child === 'string' || typeof child === 'number') {
        const s = String(child);
        const shown = Math.max(0, Math.min(s.length, left));
        left -= shown;
        return (
          <>
            {s.slice(0, shown)}
            {shown < s.length && <span className="invisible">{s.slice(shown)}</span>}
          </>
        );
      }
      if (isValidElement<{ children?: ReactNode }>(child) && child.props.children != null) return cloneElement(child, undefined, walk(child.props.children));
      return child;
    });
  return walk(node);
}

export default function NiriSays({ mood = 'idle', size = 92, children, side = 'right', typing = false, point, look, entrance = true, className = '' }: NiriSaysProps) {
  const text = textOf(children);
  const bubble = useRef<HTMLDivElement>(null);
  const seen = useRef(text);
  // Start fully shown so server markup and no-JS stay readable; the layout effect rewinds before paint.
  const [shown, setShown] = useState(Infinity);
  const typed = typing && shown < text.length;

  // A new message grows the bubble again (the first paint already animates it).
  useLayoutEffect(() => {
    const el = bubble.current;
    if (!el || !entrance || seen.current === text) return;
    seen.current = text;
    el.removeAttribute('data-in');
    el.getBoundingClientRect();
    el.setAttribute('data-in', '');
  }, [text, entrance]);

  useLayoutEffect(() => {
    if (!typing || !text || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(Infinity);
      return;
    }
    setShown(0);
    const dur = Math.min(TYPE_MS, text.length * 20);
    let raf = 0;
    let t0 = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      setShown(k >= 1 ? Infinity : Math.floor(text.length * k));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    const start = window.setTimeout(() => {
      t0 = performance.now();
      raf = requestAnimationFrame(tick);
    }, entrance ? TYPE_DELAY : 0);
    return () => {
      window.clearTimeout(start);
      cancelAnimationFrame(raf);
    };
  }, [typing, text, entrance]);

  const left = side === 'left';
  return (
    <div className={`flex items-end gap-3 ${left ? 'flex-row-reverse' : ''} ${className}`}>
      <Niri mood={typed ? 'talk' : mood} size={size} point={point} look={look} cue={entrance ? text : undefined} />
      <div
        ref={bubble}
        className="n-bubble relative mb-4 min-w-0 flex-1 rounded-[18px] border-2 border-line bg-bg px-4 py-3"
        data-in={entrance ? '' : undefined}
        style={{ transformOrigin: `${left ? '100%' : '0'} calc(100% - 24px)` }}
      >
        <span
          className={`absolute bottom-4 h-4 w-4 rotate-45 bg-bg ${left ? '-right-[9px] border-r-2 border-t-2 border-line' : '-left-[9px] border-b-2 border-l-2 border-line'}`}
          aria-hidden="true"
        />
        {typed ? (
          <>
            <div aria-hidden="true">{reveal(children, shown)}</div>
            <div className="sr-only">{children}</div>
          </>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
