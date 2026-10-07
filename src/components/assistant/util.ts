// Small helpers shared by the assistant pieces: safe storage, target lookup,
// and the "is something else already on screen" check.

import { useEffect, useRef, type RefObject } from 'react';

const P = 'nirengi:asistan:';
export type Face = 'kurum' | 'genc';
export const welcomeKey = (face: Face) => (face === 'genc' ? `${P}genc:welcome` : `${P}welcome`);
export const tourKey = (route: string) => `${P}tour:${route}`;

/** 'tour' = took the guided path (tours run once per page); 'self' = wants to explore alone. */
export type WelcomeChoice = 'tour' | 'self';

// localStorage can throw (private mode, blocked site data); sessionStorage is the fallback.
export const read = (k: string): string | null => {
  try {
    return localStorage.getItem(k);
  } catch {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  }
};

export const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    try {
      sessionStorage.setItem(k, v);
    } catch {
      /* nothing to do: the assistant just asks again next time */
    }
  }
};

export const reduced = () => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const shown = (el: HTMLElement) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
};

/** First visible match: the phone tab bar and the desktop sidebar both carry the same links. */
export function findTarget(selector: string): HTMLElement | null {
  let list: NodeListOf<HTMLElement>;
  try {
    list = document.querySelectorAll<HTMLElement>(selector);
  } catch {
    return null;
  }
  for (const el of list) if (shown(el)) return el;
  return null;
}

/** A sheet, celebration or seal moment is open: the assistant must not talk over it. */
export const BLOCKING = '[role="dialog"]:not([data-assistant]), dialog[open], [role="status"].inset-0';
export const blocked = () => Boolean(document.querySelector(BLOCKING));

const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

/** Keeps Tab inside `ref`, closes on Escape, restores focus afterwards. */
export function useTrap(ref: RefObject<HTMLElement | null>, onEscape: () => void, lockScroll = false) {
  const esc = useRef(onEscape);
  esc.current = onEscape;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    if (lockScroll) root.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        esc.current();
        return;
      }
      const box = ref.current;
      if (e.key !== 'Tab' || !box) return;
      const nodes = [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(shown);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const inside = box.contains(document.activeElement);
      if (e.shiftKey && (!inside || document.activeElement === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      if (lockScroll) root.style.overflow = overflow;
      prev?.focus?.({ preventScroll: true });
    };
  }, [ref, lockScroll]);
}
