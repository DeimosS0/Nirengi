// Landing motion: one authored moment. The signal-path bus fills with scroll and
// each block's LED lights as the pulse reaches it. Content is visible without JS.

import { scroll } from 'framer-motion';

export function initMotion() {
  const path = document.querySelector<HTMLElement>('[data-path]');
  if (!path) return;
  const fill = path.querySelector<HTMLElement>('[data-path-fill]');
  const leds = [...path.querySelectorAll<HTMLElement>('[data-path-node] .led')];
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    leds.forEach((led) => led.classList.add('on'));
    return;
  }
  scroll(
    (p: number) => {
      if (fill) fill.style.transform = `scaleX(${p})`;
      leds.forEach((led, i) => led.classList.toggle('on', p >= i / (leds.length - 1) - 0.001));
    },
    { target: path, offset: ['start 75%', 'end 55%'] },
  );
}
