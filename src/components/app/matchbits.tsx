// Small pieces shared by the need detail and the discovery screens: the blind-aware
// avatar that flips on first contact, the weekly consistency strip, and the
// plain-language reading of a match's four parts.

import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Org, Person } from '../../lib/types.ts';
import type { WeekState } from '../../lib/engine/progress.ts';
import { NEUTRAL, WEIGHTS, type Match } from '../../lib/engine/match.ts';
import { SCALE, SECTOR } from '../../lib/labels.ts';
import { skillLabel } from '../../lib/skills.ts';
import { Bar, type Tone } from '../ui/kit';
import { Avatar, LevelBadge, useIdentity } from '../ui/primitives.tsx';

export const nf = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 1 });

/** Blind disc until first contact; springs into the avatar the moment identity opens. */
export function Who({ person, size = 48 }: { person: Person; size?: number }) {
  const { hidden } = useIdentity(person);
  const was = useRef(hidden);
  const reduce = useReducedMotion();
  const flipped = was.current && !hidden;
  useEffect(() => {
    was.current = hidden;
  }, [hidden]);
  return (
    <motion.span
      key={String(hidden)}
      className="inline-flex shrink-0"
      initial={flipped && !reduce ? { scale: 0.4, rotate: -24 } : false}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 15 }}
    >
      <Avatar person={person} size={size} />
    </motion.span>
  );
}

export function IdName({ person }: { person: Person }) {
  return <>{useIdentity(person).name}</>;
}

// ---------------------------------------------------------------- consistency

// "Son 10 haftanın 8'inde": possessive + locative of the count, 0..10.
const IN = ["0'ında", "1'inde", "2'sinde", "3'ünde", "4'ünde", "5'inde", "6'sında", "7'sinde", "8'inde", "9'unda", "10'unda"];

export const activeWeeks = (hist: WeekState[]) => hist.filter((w) => w.active > 0).length;

/** One quiet sentence: output weeks, never commit counts. Neutral on purpose, orange belongs to the youth side. */
export function Consistency({ hist }: { hist: WeekState[] }) {
  const n = activeWeeks(hist);
  return <span className="text-[14px] font-bold text-ink-3">{n ? `${hist.length} haftanın ${IN[n]} aktif` : `${hist.length} haftada açık üretim kaydı yok`}</span>;
}

/** The same ten weeks as small neutral bars; lives in the reasoning sheet, not on the card. */
export function WeekStrip({ hist }: { hist: WeekState[] }) {
  return (
    <span className="flex items-center gap-3">
      <span className="flex shrink-0 gap-[3px]" aria-hidden="true">
        {hist.map((w) => (
          <span key={w.week} className={`h-3.5 w-1.5 rounded-full ${w.active > 0 ? 'bg-ink-3' : 'bg-line'}`} />
        ))}
      </span>
      <Consistency hist={hist} />
    </span>
  );
}

// ---------------------------------------------------------------- evidence

/** The strongest matching evidences: best artefact per required skill, strongest first. */
export const strongest = (m: Match, n = 3) =>
  m.coverage
    .filter((c) => c.best)
    .sort((a, b) => b.score - a.score)
    .slice(0, n);

export function EvidenceChips({ m, max = 2 }: { m: Match; max?: number }) {
  const all = strongest(m, m.coverage.length);
  if (!all.length) return <span className="text-[14px] font-bold text-ink-3">Aranan yetkinliklerde henüz kanıt yok</span>;
  return (
    <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {all.slice(0, max).map((c) => (
        <span key={c.skill} className="inline-flex items-center gap-1.5">
          <span className="text-[14px] font-extrabold text-ink">{skillLabel(c.skill)}</span>
          <LevelBadge level={c.best!.level} />
        </span>
      ))}
      {all.length > max && <span className="chip">+{all.length - max}</span>}
    </span>
  );
}

// ---------------------------------------------------------------- the four parts

const toneOf = (v: number, calm: boolean): Tone => (v >= 0.75 ? 'green' : v >= 0.5 ? 'cyan' : calm ? 'indigo' : 'orange');

/** Ring tone for the kurum side: a low fit is not a streak warning, so no orange. */
export const calmTone = (score: number): Tone => (score >= 75 ? 'green' : score >= 55 ? 'cyan' : 'indigo');

/** What each part measured, in plain words, read from the match itself. `you` flips the voice. */
export function partRows(m: Match, org: Org, you: boolean) {
  const p = m.person;
  const n = m.coverage.length;
  const verified = m.coverage.filter((c) => c.verified > 0).length;
  const claim = m.coverage.filter((c) => c.verified === 0 && c.count > 0).length;
  const none = n - verified - claim;
  const list = [verified && `${verified} doğrulanmış`, claim && `${claim} yalnız beyan`, none && `${none} kanıtsız`].filter(Boolean).join(', ');

  const ctx = Math.round((m.parts.context - NEUTRAL) * 100);
  const have = you ? 'işin' : 'işi';
  const context =
    ctx >= 55
      ? `${SECTOR[org.sector]} sektöründe ve benzer ölçekte (${SCALE[org.scale]}) doğrulanmış ${have} var.`
      : ctx >= 30
        ? `${SECTOR[org.sector]} sektöründe doğrulanmış ${have} var.`
        : ctx > 0
          ? `Benzer ölçekte (${SCALE[org.scale]}) doğrulanmış ${have} var.`
          : `Bu sektörde ya da ölçekte doğrulanmış ${have} henüz yok. Yeni biri cezalandırılmasın diye başlangıç puanı verildi.`;

  const capacity =
    p.availability === 'open'
      ? you ? `Deneme projesine açıksın, haftada ${p.weeklyHours} saat ayırabiliyorsun.` : `Deneme projesine açık, haftada ${p.weeklyHours} saat ayırabiliyor.`
      : p.availability === 'partial'
        ? you ? `Kısmi müsaitsin: haftada ${p.weeklyHours} saat.` : `Kısmi müsait: haftada ${p.weeklyHours} saat.`
        : you ? 'Şu an kapalısın; müsaitliğini açarsan bu puan artar.' : 'Şu an deneme projesine kapalı; bu puanı düşürüyor.';

  const { succeeded, approvedMilestones } = m.pilots;
  const history =
    succeeded || approvedMilestones
      ? `${succeeded ? `${succeeded} başarıyla kapanan deneme projesi, ` : ''}${approvedMilestones} iki tarafça onaylı aşama.`
      : 'Henüz deneme projesi geçmişi yok; başlangıç puanı verildi, kimse bu yüzden geride kalmaz.';

  const row = (key: keyof Match['parts'], label: string, text: string) => ({
    key,
    label,
    value: m.parts[key],
    points: m.parts[key] * WEIGHTS[key] * 100,
    max: WEIGHTS[key] * 100,
    text,
  });
  return [
    row(
      'evidence',
      you ? 'Yaptığın işin uyumu' : 'Yaptığı işin uyumu',
      verified + claim === 0
        ? `Aranan ${n} yetkinliğin hiçbirinde henüz ${you ? 'kanıtın' : 'kanıtı'} yok.`
        : you
          ? `Kanıtların aranan ${n} yetkinliği şöyle karşılıyor: ${list}.`
          : `Aranan ${n} yetkinlik: ${list}.`,
    ),
    row('context', 'Sektör ve ölçek uyumu', context),
    row('capacity', you ? 'Ayırabileceğin zaman' : 'Ayırabileceği zaman', capacity),
    row('history', 'Birlikte çalışma geçmişi', history),
  ];
}

export function PartBars({ m, org, you = false, calm = false }: { m: Match; org: Org; you?: boolean; calm?: boolean }) {
  return (
    <ul className="space-y-5">
      {partRows(m, org, you).map((r) => (
        <li key={r.key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[16px] font-black text-ink">{r.label}</span>
            <span className="num shrink-0 text-[14px] font-extrabold text-ink-3">
              {nf(r.points)} / {r.max} puan
            </span>
          </div>
          <Bar value={r.value} tone={toneOf(r.value, calm)} h={12} className="mt-2" />
          <p className="mt-2 text-[15px] font-bold text-ink-3">{r.text}</p>
        </li>
      ))}
    </ul>
  );
}
