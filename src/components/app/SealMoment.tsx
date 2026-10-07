import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const SHARDS = Array.from({ length: 26 }, (_, i) => {
  const a = (i / 26) * Math.PI * 2 + (i % 3) * 0.2;
  const d = 180 + (i % 5) * 46;
  return { x: Math.cos(a) * d, y: Math.sin(a) * d, r: (i * 47) % 360, c: ['#F99400', '#00B4D8', '#B9A8FF', '#ffffff'][i % 4], s: 8 + (i % 4) * 4 };
});

/** The loop-closing moment: a double approval becomes an S3 seal on the profile. */
export function SealMoment({ open, name, href, onClose }: { open: boolean; name: string; href: string; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 4200);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', esc);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] grid place-items-center bg-[#0b091c]/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="status"
          aria-live="polite"
        >
          <div className="relative grid place-items-center text-center text-white" onClick={(e) => e.stopPropagation()}>
            {SHARDS.map((p, i) => (
              <motion.svg
                key={i}
                viewBox="0 0 10 10"
                width={p.s}
                height={p.s}
                className="absolute"
                initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.4 }}
                animate={{ x: p.x, y: p.y, opacity: [0, 1, 0], rotate: p.r, scale: 1 }}
                transition={{ duration: 1.5, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
                aria-hidden="true"
              >
                <path d="M5 0 10 9H0Z" fill={p.c} />
              </motion.svg>
            ))}
            <motion.div
              className="absolute h-72 w-72 rounded-full border-2 border-[#B9A8FF]"
              initial={{ scale: 0.3, opacity: 0.9 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ duration: 1.3, delay: 0.42, ease: 'easeOut' }}
            />
            <motion.div
              initial={{ scale: 2.6, rotate: -28, opacity: 0 }}
              animate={{ scale: 1, rotate: -8, opacity: 1 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="relative grid h-56 w-56 place-items-center rounded-full border-[5px] border-white/90 bg-[#6451E7] shadow-[0_24px_60px_-24px_rgb(0_0_0/0.6)]"
            >
              <div className="absolute inset-3 rounded-full border-2 border-dashed border-white/40" />
              <svg viewBox="0 0 40 40" className="h-20 w-20" aria-hidden="true">
                <path d="M20 5 35 32H5Z" fill="#fff" />
                <circle cx="20" cy="23" r="4.6" fill="#F99400" />
              </svg>
              <span className="absolute bottom-10 font-mono text-[11px] font-bold uppercase tracking-[0.3em]">S3 · tasdik</span>
            </motion.div>
            <motion.p
              className="mt-10 font-display text-[clamp(26px,4vw,44px)] font-semibold tracking-[-0.03em]"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.6 }}
            >
              Çift onay. <span className="text-[#F99400]">Kanıt mühürlendi.</span>
            </motion.p>
            <motion.p className="mt-3 max-w-md text-white/75" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
              Bu kilometre taşı {name} adlı kişinin profiline S3 kurum tasdiki olarak işlendi ve defterde zincire eklendi.
            </motion.p>
            <motion.div className="mt-7 flex gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
              <a href={href} className="btn-primary">
                Profilde gör →
              </a>
              <button className="btn border border-white/30 text-white hover:bg-white/10" onClick={onClose}>
                Deftere dön
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
