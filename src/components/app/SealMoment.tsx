// The stamp moment: a double approval becomes a Kurum onaylı seal, then the celebration takes over.

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { celebrate } from '../ui/kit';
import { LevelGlyph } from '../ui/primitives';

const STAMP_MS = 1250;

export function SealMoment({ open, name, last, onDone }: { open: boolean; name: string; last: boolean; onDone: () => void }) {
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (!open) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let fired = false;
    const finish = () => {
      if (fired) return;
      fired = true;
      celebrate(
        last
          ? { title: 'Son adım onaylandı', sub: `${name} için tüm aşamalar Kurum onaylı. Şimdi projeyi kapatıp herkese açık kartı yayımlayabilirsiniz.`, cta: 'Devam et' }
          : { title: 'Adım onaylandı', sub: `${name} için bu aşama artık Kurum onaylı kanıt olarak profilinde.`, cta: 'Devam et' },
      );
      done.current();
    };
    const t = window.setTimeout(finish, reduced ? 0 : STAMP_MS);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && finish();
    window.addEventListener('keydown', esc);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', esc);
    };
  }, [open, name, last]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[78] grid place-items-center bg-bg/95 px-6 text-center backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          role="status"
          aria-live="polite"
        >
          <div className="grid place-items-center">
            <div className="relative grid h-[200px] w-[200px] place-items-center">
              <span className="ping-soft absolute inset-6 rounded-full border-[3px] border-indigo" aria-hidden="true" />
              <span
                className="stamp-in relative grid h-[176px] w-[176px] place-items-center rounded-full border-[6px] border-indigo bg-indigo-tint"
                style={{ boxShadow: '0 6px 0 rgb(var(--indigo-lip))' }}
              >
                <span className="absolute inset-2.5 rounded-full border-2 border-dashed border-indigo/40" aria-hidden="true" />
                <LevelGlyph level="S3" size={92} />
              </span>
            </div>
            <motion.p className="mt-9 text-[28px] font-black text-indigo" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35, duration: 0.3 }}>
              Kurum onaylı
            </motion.p>
            <motion.p className="mt-1 text-[16px] font-bold text-ink-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              Çift onay tamam, kayıt defterinde mühürlendi.
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
