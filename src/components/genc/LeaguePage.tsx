// Lig: where you stand among people at a similar pace, and what it takes to move.

import { Fragment, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { currentMe, useAppState } from '../../lib/store.ts';
import { DEMOTE, league, PROMOTE, TIERS, XP, type LeagueRow } from '../../lib/engine/progress.ts';
import { initials } from '../../lib/format.ts';
import { Head, Why } from '../ui/kit';
import { Bolt, Lock, Shield } from '../ui/icons';

const DISC = ['indigo', 'cyan', 'purple', 'orange', 'green'] as const;
const disc = (id: string) => DISC[[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % DISC.length];

/** "3 gün 4 saat", counting down to the end of the league week. */
function left(ms: number) {
  const m = Math.max(0, Math.floor(ms / 60_000));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  if (d) return `${d} gün${h ? ` ${h} saat` : ''}`;
  if (h) return `${h} saat ${m % 60} dk`;
  return `${m} dk`;
}

const MEDAL = [
  { face: 'rgb(var(--gold))', lip: 'rgb(var(--gold-lip))' },
  { face: 'rgb(var(--ink-4))', lip: 'rgb(var(--ink-3))' },
  { face: 'rgb(var(--t0))', lip: 'rgb(0 0 0 / 0.22)' },
];

function Rank({ row }: { row: LeagueRow }) {
  const m = MEDAL[row.rank - 1];
  if (m)
    return (
      <span
        className="num grid h-8 w-8 shrink-0 place-items-center rounded-full text-[15px] font-black text-white"
        style={{ background: m.face, boxShadow: `0 2px 0 ${m.lip}, inset 0 0 0 3px rgb(255 255 255 / 0.32)` }}
        aria-label={`${row.rank}. sıra`}
      >
        {row.rank}
      </span>
    );
  return (
    <span className={`num w-8 shrink-0 text-center text-[16px] font-black ${row.zone === 'up' ? 'text-green-lip' : row.zone === 'down' ? 'text-red-lip' : 'text-ink-3'}`}>
      {row.rank}
    </span>
  );
}

function Zone({ kind, tier }: { kind: 'up' | 'down'; tier: number }) {
  const up = kind === 'up';
  const Arrow = up ? ChevronUp : ChevronDown;
  return (
    <li role="separator" aria-label={up ? 'Yükselme bölgesi' : 'Düşme bölgesi'} className={`flex items-center gap-3 px-2 py-2.5 ${up ? 'text-green-lip' : 'text-red-lip'}`}>
      <span className={`h-[2px] flex-1 rounded-full ${up ? 'bg-green/40' : 'bg-red/40'}`} />
      <span className="inline-flex items-center gap-1 text-[12px] font-black uppercase tracking-[0.08em]">
        <Arrow className="h-4 w-4" strokeWidth={3.5} />
        {up ? `Yükselme bölgesi · ${TIERS[tier + 1]}` : `Düşme bölgesi · ${TIERS[tier - 1]}`}
      </span>
      <span className={`h-[2px] flex-1 rounded-full ${up ? 'bg-green/40' : 'bg-red/40'}`} />
    </li>
  );
}

/** One plain sentence about the next move, read from the rows. */
function status(rows: LeagueRow[], mine: LeagueRow | undefined, tier: number) {
  if (!mine) return null;
  if (mine.zone === 'up')
    return { tone: 'green', title: 'Yükselme bölgesindesin', text: `Hafta bitince ${TIERS[tier + 1]} Ligi’ne çıkarsın. Yerini korumak için üretmeye devam et.` } as const;
  if (mine.zone === 'down') {
    const safe = rows[Math.max(0, rows.length - DEMOTE - 1)];
    return {
      tone: 'red',
      title: `Düşme bölgesindesin — ${Math.max(1, safe.xp - mine.xp + 1)} XP ile çıkarsın`,
      text: `Son ${DEMOTE} sıra hafta bitince ${TIERS[tier - 1]} Ligi’ne düşer.`,
    } as const;
  }
  if (tier < TIERS.length - 1)
    return {
      tone: 'ink',
      title: `İlk ${PROMOTE}’e girmek için ${Math.max(1, rows[PROMOTE - 1].xp - mine.xp + 1)} XP daha`,
      text: `İlk ${PROMOTE} kişi ${TIERS[tier + 1]} Ligi’ne çıkar.`,
    } as const;
  return { tone: 'ink', title: 'En üst ligdesin', text: 'Burası Zirve. Yerini korumak için üretmeye devam et.' } as const;
}

const TONE = {
  green: 'bg-green-tint text-green-lip',
  red: 'bg-red-tint text-red-lip',
  ink: 'bg-bg-2 text-ink-2',
} as const;

const HOW: { key: Exclude<keyof typeof XP, 'dailyCap'>; label: string }[] = [
  { key: 'activeDay', label: 'GitHub’da üretim yaptığın gün' },
  { key: 'evidence', label: 'Yeni doğrulanmış iş' },
  { key: 'milestone', label: 'Kurumun onayladığı aşama' },
  { key: 'helpful', label: 'İşe yarayan cevap' },
  { key: 'post', label: 'Toplulukla paylaşım, günde bir kez' },
  { key: 'support', label: 'Paylaşımının aldığı her destek' },
];

export default function LeaguePage() {
  const s = useAppState();
  const me = currentMe(s);
  const reduce = useReducedMotion();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const l = league(s, me, now);
  const mine = l.rows.find((r) => r.personId === me.id);
  const st = status(l.rows, mine, l.tier);

  // Bring my row into view once the list has settled.
  const myRow = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const t = window.setTimeout(() => {
      const el = myRow.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.top < 90 || r.bottom > innerHeight - 90) el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    }, 500);
    return () => window.clearTimeout(t);
  }, [reduce]);

  return (
    <div className="mx-auto max-w-[600px]">
      <section className="card p-5" aria-labelledby="lig">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 id="lig" className="h-page">
              {l.name} Ligi
            </h1>
            <p className="mt-1 text-[15px] font-bold text-ink-3">Benzer tempodaki {l.rows.length} kişiyle yarışıyorsun.</p>
          </div>
          <span className="chip num shrink-0 !text-purple" title="Hafta Pazar gecesi biter">
            <Clock className="h-4 w-4" strokeWidth={3} />
            {left(l.endsAt - now)}
          </span>
        </div>

        <ol className="mt-6 flex items-end justify-between px-1" aria-label="Lig basamakları">
          {TIERS.map((name, i) => {
            const cur = i === l.tier;
            const locked = i > l.tier;
            return (
              <li key={name} className={`flex flex-col items-center gap-1.5 rounded-[18px] px-2 py-2 ${cur ? 'bg-purple-tint' : ''}`} aria-current={cur ? 'step' : undefined}>
                <span className="relative grid place-items-center">
                  <Shield size={cur ? 72 : 42} tier={i} className={locked ? 'opacity-30 grayscale' : ''} />
                  {locked && <Lock size={18} className="absolute" />}
                </span>
                <span className={`text-[13px] font-extrabold ${cur ? 'text-purple' : locked ? 'text-ink-3' : 'text-ink-3'}`}>{name}</span>
              </li>
            );
          })}
        </ol>

        {st && (
          <div className={`mt-5 rounded-[16px] px-4 py-3 ${TONE[st.tone]}`} role="status">
            <p className="text-[16px] font-black leading-snug">{st.title}</p>
            <p className="mt-0.5 text-[14px] font-bold opacity-80">{st.text}</p>
          </div>
        )}
        <div className="mt-2 flex justify-end">
          <Why title="Bu lig nasıl adil?" label="Bu lig nasıl adil?">
            <ul className="space-y-4 text-[15px] font-bold text-ink-3">
              <li>
                <b className="block text-[16px]">Benzer tempodakilerle yarışırsın</b>
                Ligler Zemin’den Zirve’ye basamaklıdır. Yeni biri aynı tempodaki kişilerle başlar; yıllardır üretenlerle değil.
              </li>
              <li>
                <b className="block text-[16px]">XP yalnız doğrulanabilir olaylardan gelir</b>
                Üretim yaptığın günler, doğrulanmış işler, kurum onayları ve işe yarayan cevaplar. Günde en fazla {XP.dailyCap} XP sayılır; bir gecede kimse haftayı geçemez.
              </li>
              <li>
                <b className="block text-[16px]">Sohbet ve beğeni sıralamayı belirlemez</b>
                Paylaşım {XP.post}, aldığın her destek {XP.support} XP eder ve haftalık hedefine sayılmaz. Sıralamayı üretim belirler.
              </li>
              <li>
                <b className="block text-[16px]">Mola haftası ligi durdurmaz</b>
                Mola, serini bozmadan bekletir. Lig sıralaması yine o haftanın XP’sine göre hesaplanır.
              </li>
              <li>
                <b className="block text-[16px]">Hafta bitince</b>
                İlk {PROMOTE} kişi bir üst lige çıkar, son {DEMOTE} kişi bir alta düşer. Sıralamalar her hafta yeniden başlar.
              </li>
              <li className="text-ink-3">Lig arkadaşların kurgusal demo verisidir.</li>
            </ul>
          </Why>
        </div>
      </section>

      <ol className="card mt-5 p-2" aria-label={`${l.name} Ligi sıralaması`}>
        {l.rows.map((r, i) => {
          const isMe = r.personId === me.id;
          const prev = l.rows[i - 1];
          const next = l.rows[i + 1];
          return (
            <Fragment key={r.id}>
              {r.zone === 'down' && prev?.zone !== 'down' && <Zone kind="down" tier={l.tier} />}
              <motion.li
                ref={isMe ? myRow : undefined}
                className={`flex items-center gap-3 rounded-[14px] border-2 px-3 py-2.5 ${isMe ? 'border-indigo bg-indigo-tint' : 'border-transparent'}`}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.015, 0.3), duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                aria-current={isMe ? 'true' : undefined}
              >
                <Rank row={r} />
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[16px] font-black text-white"
                  style={{ background: `rgb(var(--${disc(r.id)}))` }}
                  aria-hidden="true"
                >
                  {initials(r.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[16px] font-extrabold text-ink">
                    <span className="truncate">{r.name}</span>
                    {isMe && <span className="pill shrink-0 bg-indigo !px-2 !py-0 text-[12px] text-white">Sen</span>}
                  </p>
                  <p className="truncate text-[13px] font-bold text-ink-3">{r.area}</p>
                </div>
                <span className="num shrink-0 text-[16px] font-black text-ink-2">{r.xp.toLocaleString('tr-TR')} XP</span>
              </motion.li>
              {r.zone === 'up' && next && next.zone !== 'up' && <Zone kind="up" tier={l.tier} />}
            </Fragment>
          );
        })}
      </ol>
      <p className="mt-3 text-center text-[13px] font-bold text-ink-3">Lig arkadaşların kurgusal demo verisi.</p>

      <section className="mt-10" aria-labelledby="xp-nasil">
        <Head title={<span id="xp-nasil">XP nasıl kazanılır</span>} action={<span className="text-[13px] font-bold text-ink-3">Günde en fazla {XP.dailyCap} XP</span>} />
        <ul className="card mt-4 px-4">
          {HOW.map((h, i) => (
            <li key={h.key} className={`flex items-center justify-between gap-3 py-3 ${i ? 'border-t-2 border-line' : ''}`}>
              <span className="text-[15px] font-bold text-ink-2">{h.label}</span>
              <span className="inline-flex shrink-0 items-center gap-1 text-[15px] font-black text-gold-ink">
                <Bolt size={20} />
                <span className="num">+{XP[h.key]}</span>
              </span>
            </li>
          ))}
          <li className="flex items-center justify-between gap-3 border-t-2 border-line py-3">
            <span className="text-[15px] font-bold text-ink-2">Bir görevi bitirmek</span>
            <a href="/gorevler" className="shrink-0 text-[14px] font-extrabold text-indigo hover:underline">
              Görevlere bak
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
