// The sticky narrator for wide screens: one Niri that stays beside the story and
// changes mood and words as each section reaches the reading line. It appears once
// the hero's Niri has scrolled away and leaves before the closing band's Niri comes in,
// so there is never more than one on screen. Phones and no-JS get inline bubbles instead.

import { useEffect, useState } from 'react';
import Say, { type Line } from './Say';

const WIDE = '(min-width: 1280px)';
const WIDER = '(min-width: 1440px)';

export default function Narrator({ lines }: { lines: Line[] }) {
  const [key, setKey] = useState(lines[0].key);
  const [on, setOn] = useState(false);
  const [size, setSize] = useState(96);

  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>('[data-narrate]')];
    const hero = document.querySelector<HTMLElement>('[data-narrate-hero]');
    const end = document.querySelector<HTMLElement>('[data-narrate-end]');
    if (!sections.length) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      if (!matchMedia(WIDE).matches) {
        setOn(false);
        return;
      }
      setSize(matchMedia(WIDER).matches ? 112 : 96);
      const vh = window.innerHeight;
      let cur = sections[0];
      for (const s of sections) if (s.getBoundingClientRect().top <= vh * 0.6) cur = s;
      setKey(cur.dataset.narrate ?? lines[0].key);
      // Niri's feet on the summit sit about halfway down the hero sheet.
      const h = hero?.getBoundingClientRect();
      const heroGone = !h || h.top + h.height * 0.5 < 64;
      const endFar = !end || end.getBoundingClientRect().top > vh * 0.7;
      setOn(heroGone && endFar);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(raf);
    };
  }, [lines]);

  const line = lines.find((l) => l.key === key) ?? lines[0];
  return (
    <div
      aria-hidden="true"
      className="sticky flex h-[300px] items-end"
      style={{
        top: 'clamp(88px, calc(50vh - 150px), 280px)',
        opacity: on ? 1 : 0,
        visibility: on ? 'visible' : 'hidden',
        transition: `opacity 300ms ease, visibility 0s linear ${on ? 0 : 300}ms`,
      }}
    >
      <Say mood={line.mood} text={line.text} size={size} point="right" side="left" typing className="w-full" />
    </div>
  );
}
