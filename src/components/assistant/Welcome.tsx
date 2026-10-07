// First visit, per face: short cards, Niri talking, one idea each. The kurum cards are
// plain; the genç cards type their lines and Niri changes pose from card to card.
// A panel on desktop, the whole screen on phones.

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import Niri, { type Dir, type Mood } from '../ui/Niri';
import NiriSays from '../ui/NiriSays';
import { ArtGain, ArtGencHafta, ArtGencHos, ArtGencIs, ArtGencLig, ArtMatch, ArtNeed, ArtPilot, Pip } from './art';
import { useTrap, type Face, type WelcomeChoice } from './util';

interface Card {
  title: string;
  text: string;
  mood: Mood;
  point?: Dir;
  Art: () => React.JSX.Element;
}

const KURUM_CARDS: Card[] = [
  {
    title: 'Nirengi sana ne sağlar?',
    text: 'Merhaba, ben Niri. Sen sorununu yazarsın; ben bu işi daha önce gerçekten yapmış gençleri, neden uyduklarını açıklayarak gösteririm.',
    mood: 'wave',
    Art: ArtGain,
  },
  {
    title: 'İhtiyacını yaz',
    text: 'Birkaç kısa soruya cevap verirsin. Yazarken yanındayım ve ipucu veririm. İhtiyaç yeterince net olunca yayımlanır.',
    mood: 'talk',
    Art: ArtNeed,
  },
  {
    title: 'Uyan gençleri gör',
    text: 'Her adayın neden uyduğu açıkça yazar. İlk teması kurana kadar isimler gizlidir; böylece karar işe bakılarak verilir, önyargı azalır.',
    mood: 'point',
    point: 'up',
    Art: ArtMatch,
  },
  {
    title: 'Küçük bir deneme projesiyle başla',
    text: 'İş aşamalara bölünür ve her aşamayı sen onaylarsın. Olan her şey değiştirilemez bir kayıt defterine yazılır.',
    mood: 'cheer',
    Art: ArtPilot,
  },
];

const GENC_CARDS: Card[] = [
  {
    title: 'Nirengi’ye hoş geldin',
    text: 'Merhaba, ben Niri. Burada yaptığın işi biriktirirsin; kurumlar seni söylediğine değil, gösterdiğin işe bakarak bulur.',
    mood: 'wave',
    Art: ArtGencHos,
  },
  {
    title: 'Haftanı burada görürsün',
    text: 'Haftada kaç gün üreteceğini sen seçersin: 1, 3 ya da 5. Hedefi tutturdukça serin uzar; hedefi düşürmek ceza değil.',
    mood: 'point',
    point: 'up',
    Art: ArtGencHafta,
  },
  {
    title: 'İşin böyle güçlenir',
    text: 'Commit sayısı değil, üretim yaptığın gün sayılır. Eklediğin iş Beyan → Doğrulandı → Kurum onaylı diye güçlenir.',
    mood: 'think',
    Art: ArtGencIs,
  },
  {
    title: 'Seri, XP ve lig',
    text: 'Benzer tempodaki gençlerle haftalık bir tırmanışa çıkarsın. XP yalnız doğrulanabilir işten gelir; sohbet sıralamayı belirlemez.',
    mood: 'cheer',
    Art: ArtGencLig,
  },
  {
    title: 'Kurumlar seni işinle bulur',
    text: 'Kurumlar yazdıkları ihtiyaçla seni işine bakarak eşleştirir. İsmin ilk temasa kadar gizli kalır.',
    mood: 'happy',
    Art: ArtMatch,
  },
];

export default function Welcome({ face, onClose }: { face: Face; onClose: (choice: WelcomeChoice) => void }) {
  const CARDS = face === 'genc' ? GENC_CARDS : KURUM_CARDS;
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const box = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLButtonElement>(null);
  const last = i === CARDS.length - 1;
  const card = CARDS[i];
  const Art = card.Art;

  const go = (to: number) => {
    const t = Math.max(0, Math.min(CARDS.length - 1, to));
    setDir(t >= i ? 1 : -1);
    setI(t);
  };

  useTrap(box, () => onClose('self'), true);
  useEffect(() => {
    main.current?.focus({ preventScroll: true });
  }, [i]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(i + 1);
      if (e.key === 'ArrowLeft') go(i - 1);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  return (
    <motion.div
      data-assistant
      className="fixed inset-0 z-[74] flex bg-bg sm:items-center sm:justify-center sm:bg-ink/45 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.16 } }}
    >
      <motion.div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby="asistan-hos"
        data-assistant
        className="flex max-h-dvh w-full flex-col overflow-y-auto bg-bg sm:max-w-[520px] sm:rounded-[28px] sm:border-2 sm:border-line"
        initial={{ y: 24, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-7 sm:pt-6">
          <ol className="flex items-center gap-1.5" aria-label="Kartlar">
            {CARDS.map((c, n) => (
              <li key={c.title}>
                <button
                  type="button"
                  onClick={() => go(n)}
                  className="grid h-9 w-9 place-items-center rounded-[10px] transition-colors hover:bg-bg-2"
                  aria-label={`${n + 1}. kart: ${c.title}`}
                  aria-current={n === i ? 'step' : undefined}
                >
                  <Pip size={n === i ? 22 : 18} state={n < i ? 'done' : n === i ? 'now' : 'next'} />
                </button>
              </li>
            ))}
          </ol>
          <button type="button" className="btn-quiet btn-sm !min-h-10 !px-2.5 !text-ink-3" onClick={() => onClose('self')} aria-label="Kapat, kendim bakarım">
            <X className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-start px-5 pb-4 pt-8 sm:justify-center sm:px-7 sm:py-4">
          <motion.div
            key={i}
            initial={{ opacity: 0, x: dir * 26 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex min-h-[184px] items-center justify-center rounded-[22px] border-2 border-line bg-bg-2 py-4 sm:min-h-[212px] [@media(max-height:700px)]:hidden">
              <div className="origin-center sm:scale-[1.18]">
                <Art />
              </div>
            </div>
            {face === 'genc' ? (
              <>
                <h2 id="asistan-hos" className="mt-5 text-[22px] font-black leading-tight text-ink sm:text-[24px] [@media(max-height:700px)]:mt-0">
                  {card.title}
                </h2>
                <div className="mt-2 flex min-h-[150px] items-end [@media(max-height:700px)]:min-h-0">
                  <NiriSays mood={card.mood} point={card.point} size={84} typing className="w-full">
                    <p className="text-[15.5px] font-semibold leading-relaxed text-ink-2">{card.text}</p>
                  </NiriSays>
                </div>
              </>
            ) : (
              <div className="mt-5 flex items-end gap-3 [@media(max-height:700px)]:mt-0">
                <Niri mood={card.mood} point={card.point} size={84} />
                <div className="relative mb-2 min-h-[176px] min-w-0 [@media(max-height:700px)]:min-h-0 flex-1 rounded-[20px] border-2 border-line bg-bg px-4 py-3.5">
                  <span className="absolute -left-[9px] bottom-5 h-4 w-4 rotate-45 border-b-2 border-l-2 border-line bg-bg" aria-hidden="true" />
                  <h2 id="asistan-hos" className="text-[21px] font-black leading-tight text-ink sm:text-[23px]">
                    {card.title}
                  </h2>
                  <p className="mt-1.5 text-[15.5px] font-semibold leading-relaxed text-ink-2">{card.text}</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        <div className="sticky bottom-0 bg-bg px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-2 sm:px-7 sm:pb-7">
          <button
            ref={main}
            type="button"
            className="btn-primary btn-lg btn-block"
            onClick={() => (last ? onClose('tour') : go(i + 1))}
          >
            {last ? 'Turu başlat' : 'İleri'}
          </button>
          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              className={`btn-quiet btn-sm !min-h-11 ${i === 0 ? 'invisible' : ''}`}
              onClick={() => go(i - 1)}
              tabIndex={i === 0 ? -1 : undefined}
              aria-hidden={i === 0 ? true : undefined}
            >
              Geri
            </button>
            <button type="button" className="btn-quiet btn-sm !min-h-11" onClick={() => onClose('self')}>
              Kendim bakarım
            </button>
          </div>
          <p className="mt-1 text-center text-[13px] font-bold text-ink-3 [@media(max-height:700px)]:hidden">Sonradan sağ alttaki “Niri’ye sor” düğmesiyle beni çağırabilirsin.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
