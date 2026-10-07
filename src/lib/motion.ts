// Public pages: sections rise once as they scroll into view. Nothing loops;
// content is visible without JS and with reduced motion.

export function initReveal() {
  const els = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
  if (!els.length) return;
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (const el of els) el.dataset.in = '';
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        (e.target as HTMLElement).dataset.in = '';
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
  );
  for (const el of els) io.observe(el);
}
