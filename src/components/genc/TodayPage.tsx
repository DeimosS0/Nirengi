// Bugün: one next step on the surface, the whole road one scroll below.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronRight, Star } from 'lucide-react';
import { actions, currentMe, useAppState } from '../../lib/store.ts';
import { journey, progress, weekKey, type Step, type Unit } from '../../lib/engine/progress.ts';
import { needsForPerson } from '../../lib/engine/match.ts';
import { skillLabel } from '../../lib/skills.ts';
import type { Person, State, WeeklyGoal } from '../../lib/types.ts';
import Niri from '../ui/Niri';
import { Bar, feedback, Head, Ring, Sheet, WeekDots } from '../ui/kit';
import { Flame, Lock } from '../ui/icons';

const firstName = (p: Person) => p.name.split(' ')[0];

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'İyi geceler' : h < 12 ? 'Günaydın' : h < 18 ? 'İyi günler' : 'İyi akşamlar';
}

/** The single most useful thing to do next, read from state in priority order. */
function nextStep(s: State, me: Person, met: boolean, left: number) {
  const pilot = s.pilots.find((p) => p.personId === me.id && p.status === 'active');
  const open = pilot?.milestones.findIndex((m) => m.state === 'open') ?? -1;
  if (pilot && open >= 0) {
    const org = s.orgs.find((o) => o.id === pilot.orgId)!;
    return {
      title: `${org.name} projende ${open + 1}. aşamayı teslim et`,
      sub: pilot.milestones[open].title,
      href: `/pilotlar/${pilot.id}`,
      cta: 'Projeye git',
    };
  }
  if (!met)
    return {
      title: left === 1 ? 'Haftalık hedefine 1 gün kaldı' : `Haftalık hedefine ${left} gün kaldı`,
      sub: 'Bugün bir açık kaynak görevine katkı ver ya da kendi projende bir adım at.',
      href: '/gorevler',
      cta: 'Görev seç',
    };
  return {
    title: 'Hedefin tamam, şimdi bir kapı arala',
    sub: 'Sana en yakın ihtiyaca bir doğrulanmış iş daha eklersen ilk sıraya yaklaşırsın.',
    href: '/gorevler',
    cta: 'Gelişim görevleri',
  };
}

const OFFSETS = [0, -64, -92, -64, 0, 64, 92, 64];

export default function TodayPage() {
  const s = useAppState();
  const me = currentMe(s);
  const p = progress(s, me);
  const units = journey(s, me);
  const next = nextStep(s, me, p.met, Math.max(0, p.goal - p.active));
  const matches = needsForPerson(s, me).slice(0, 3);
  const [goalOpen, setGoalOpen] = useState(false);
  const [stepOpen, setStepOpen] = useState<{ step: Step; unit: Unit } | null>(null);

  const flat = units.flatMap((u) => u.steps.map((st) => ({ st, u })));
  const currentId = flat.find((x) => !x.st.done)?.st.id;

  const say = p.rest
    ? 'Bu hafta moladasın. Serin seni bekliyor, acele yok.'
    : p.met
      ? `Bu haftanın hedefi tamam! ${p.streak} haftadır düzenli üretiyorsun.`
      : p.goal - p.active === 1
        ? 'Bu hafta bir gün daha üretirsen hedefin tamam.'
        : `Bu hafta ${p.goal - p.active} gün daha üretmen gerekiyor. Küçük bir adım yeter.`;

  return (
    <div className="mx-auto max-w-[600px]">
      {/* Greeting */}
      <div className="flex items-end gap-3">
        <Niri mood={p.met ? 'happy' : 'wave'} size={92} />
        <div className="relative mb-4 flex-1 rounded-[18px] border-2 border-line bg-bg px-4 py-3">
          <span className="absolute -left-[9px] bottom-4 h-4 w-4 rotate-45 border-b-2 border-l-2 border-line bg-bg" aria-hidden="true" />
          <p className="text-[17px] font-extrabold text-ink">
            {greeting()}, {firstName(me)}!
          </p>
          <p className="text-[15px] font-bold text-ink-3">{say}</p>
        </div>
      </div>

      {/* This week */}
      <section className="card mt-4 p-5" aria-labelledby="hafta">
        <div className="flex items-center justify-between gap-3">
          <h1 id="hafta" className="h-sec">
            Bu hafta
          </h1>
          <button type="button" onClick={() => setGoalOpen(true)} className="chip transition-colors hover:border-indigo/40 hover:text-indigo">
            Hedef: haftada {p.goal} gün
            <ChevronRight className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>
        <div className="mt-5">
          <WeekDots days={p.days} />
        </div>
        <div className="mt-5 flex items-center gap-4">
          <div className="flex-1">
            <Bar value={p.active / p.goal} tone={p.met ? 'green' : 'orange'} />
          </div>
          <span className="num text-[16px] font-black text-ink-2">
            {Math.min(p.active, p.goal)}/{p.goal} gün
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t-2 border-line pt-4 text-[15px] font-bold text-ink-3">
          <span className="flex items-center gap-1.5">
            <Flame size={22} className={p.met ? 'flame-live' : ''} dim={!p.streak} />
            <b className="num text-orange-ink">{p.streak}</b> haftalık seri
          </span>
          <span>
            Bu hafta <b className="num text-gold-ink">{p.xpWeek} XP</b>
          </span>
          <span className="text-ink-3">Commit sayısı değil, üretim yaptığın gün sayılır.</span>
        </div>
      </section>

      {/* Next step */}
      <motion.a
        href={next.href}
        className="mt-5 block rounded-[20px] bg-indigo p-5 text-white"
        style={{ boxShadow: '0 5px 0 rgb(var(--indigo-lip))' }}
        whileTap={{ y: 5, boxShadow: '0 0 0 rgb(var(--indigo-lip))' }}
        transition={{ duration: 0.08 }}
      >
        <p className="text-[22px] font-black leading-tight">{next.title}</p>
        <p className="mt-1 text-[15px] font-bold text-white/80">{next.sub}</p>
        <span
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-white px-5 text-[15px] font-black uppercase tracking-[0.06em] text-indigo"
          style={{ boxShadow: '0 4px 0 rgb(255 255 255 / 0.45)' }}
        >
          {next.cta}
          <ChevronRight className="h-5 w-5" strokeWidth={3} />
        </span>
      </motion.a>

      {/* The road */}
      <section className="mt-10" aria-label="Yolun">
        {units.map((u, ui) => {
          const done = u.steps.filter((x) => x.done).length;
          return (
            <div key={u.id} className={ui ? 'mt-10' : ''}>
              <div className="flex items-center justify-between gap-4 rounded-[18px] px-5 py-4 text-white" style={{ background: `rgb(var(--${u.tone}))`, boxShadow: `0 4px 0 rgb(var(--${u.tone}-lip))` }}>
                <div>
                  <p className="text-[21px] font-black leading-tight">{u.title}</p>
                  <p className="text-[14px] font-bold text-white/80">{u.sub}</p>
                </div>
                <span className="num shrink-0 rounded-full bg-white/20 px-3 py-1 text-[14px] font-black">
                  {ui + 1}. bölüm · {done}/{u.steps.length}
                </span>
              </div>
              <ol className={`relative flex flex-col items-center gap-5 ${u.steps[0].id === currentId ? 'mt-16' : 'mt-6'}`}>
                {u.steps.map((st) => {
                  const gi = flat.findIndex((x) => x.st.id === st.id);
                  const current = st.id === currentId;
                  const locked = !st.done && !current;
                  const x = OFFSETS[gi % OFFSETS.length];
                  return (
                    <li key={st.id} className="relative" style={{ transform: `translateX(${x}px)` }}>
                      {current && (
                        <motion.span
                          className="absolute -top-11 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-[12px] border-2 border-line bg-bg px-3 py-1.5 text-[14px] font-black uppercase tracking-wide"
                          style={{ color: `rgb(var(--${u.tone}))` }}
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          Sıradaki
                          <span className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-line bg-bg" />
                        </motion.span>
                      )}
                      <button
                        type="button"
                        onClick={() => setStepOpen({ step: st, unit: u })}
                        aria-label={`${st.title}${st.done ? ' — tamamlandı' : current ? ' — sıradaki' : ' — kilitli'}`}
                        className="group relative grid h-[72px] w-[72px] place-items-center rounded-full transition-transform duration-100 active:translate-y-[6px]"
                        style={{
                          background: locked ? 'rgb(var(--bg-3))' : `rgb(var(--${u.tone}))`,
                          boxShadow: `0 6px 0 ${locked ? 'rgb(var(--line-2))' : `rgb(var(--${u.tone}-lip))`}${current ? `, 0 0 0 8px rgb(var(--${u.tone}) / 0.18)` : ''}`,
                        }}
                      >
                        {st.done ? (
                          <Check className="h-9 w-9 text-white" strokeWidth={4} />
                        ) : current ? (
                          <Star className="h-9 w-9 fill-white text-white" strokeWidth={2} />
                        ) : (
                          <Lock size={34} />
                        )}
                      </button>
                      <p className={`mt-3 w-28 text-center text-[13px] font-extrabold leading-tight ${locked ? 'text-ink-3' : 'text-ink-2'}`} style={{ marginLeft: -20 }}>
                        {st.title}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </section>

      {/* Doors */}
      <section id="ihtiyaclar" className="mt-12 scroll-mt-6">
        <Head title="Sana uyan ihtiyaçlar" action={<span className="text-[13px] font-bold text-ink-3">Kurumlar kurgusal demo</span>} />
        <ul className="mt-4 space-y-3">
          {matches.map((m) => {
            const org = s.orgs.find((o) => o.id === m.need.orgId)!;
            const gap = [...m.gaps].sort((a, b) => b.gain - a.gain)[0];
            return (
              <li key={m.need.id}>
                <a href={`/ihtiyaclar/${m.need.id}`} className="card-press flex items-center gap-4 p-4">
                  <Ring value={m.score} size={58} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-extrabold leading-snug text-ink">{m.need.title}</p>
                    <p className="text-[13px] font-bold text-ink-3">{org.name}</p>
                    {gap && gap.gain > 0 && (
                      <p className="mt-1 text-[14px] font-bold text-ink-3">
                        {skillLabel(gap.skill)} alanında bir iş eklersen <b className="text-green-lip">+{gap.gain}</b>
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-6 w-6 shrink-0 text-ink-3" strokeWidth={3} />
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <GoalSheet open={goalOpen} onClose={() => setGoalOpen(false)} me={me} goal={p.goal} rest={p.rest} />
      <Sheet open={!!stepOpen} onClose={() => setStepOpen(null)} title={stepOpen?.step.title ?? ''}>
        {stepOpen && (
          <div>
            <p className="text-[16px] font-bold text-ink-2">{stepOpen.step.why}</p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[14px] font-black" style={{ background: `rgb(var(--${stepOpen.unit.tone}-tint))`, color: `rgb(var(--${stepOpen.unit.tone}))` }}>
              {stepOpen.step.done ? 'Tamamlandı' : stepOpen.step.id === currentId ? 'Sıradaki adımın' : 'Önceki adımlardan sonra açılır'}
            </p>
            {!stepOpen.step.done && (
              <a href={stepOpen.step.href} className="btn-primary btn-block mt-6">
                {stepOpen.step.cta}
              </a>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}

const GOALS: { g: WeeklyGoal; name: string; text: string }[] = [
  { g: 1, name: 'Rahat', text: 'Haftada 1 gün. Okul ya da iş yoğunken.' },
  { g: 3, name: 'Düzenli', text: 'Haftada 3 gün. Çoğu kişi için en sürdürülebilir tempo.' },
  { g: 5, name: 'Yoğun', text: 'Haftada 5 gün. Bir şeyi hızla büyütürken.' },
];

function GoalSheet({ open, onClose, me, goal, rest }: { open: boolean; onClose: () => void; me: Person; goal: WeeklyGoal; rest: boolean }) {
  return (
    <Sheet open={open} onClose={onClose} title="Haftalık hedefin">
      <p className="text-[15px] font-bold text-ink-3">Hedefi sen seçersin. Düşürmek ceza değildir; seri yalnız hedefini tutturduğun haftaları sayar.</p>
      <div className="mt-5 space-y-3" role="radiogroup" aria-label="Haftalık hedef">
        {GOALS.map((o) => {
          const on = o.g === goal;
          return (
            <button
              key={o.g}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                actions.setWeeklyGoal(me.id, o.g);
                feedback({ tone: 'good', title: 'Hedefin güncellendi', text: `Haftada ${o.g} gün üretim.` });
              }}
              className={`card-press flex w-full items-center gap-4 p-4 text-left ${on ? '!border-indigo !bg-indigo-tint' : ''}`}
              style={on ? { boxShadow: '0 4px 0 rgb(var(--indigo) / 0.5)' } : undefined}
            >
              <span className={`num grid h-11 w-11 place-items-center rounded-full text-[18px] font-black ${on ? 'bg-indigo text-white' : 'bg-bg-3 text-ink-3'}`}>{o.g}</span>
              <span>
                <span className={`block text-[17px] font-black ${on ? 'text-indigo' : 'text-ink'}`}>{o.name}</span>
                <span className="block text-[14px] font-bold text-ink-3">{o.text}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-6 rounded-[16px] bg-bg-2 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[16px] font-black text-ink">Bu hafta mola ver</p>
            <p className="text-[14px] font-bold text-ink-3">Vize, final ya da yoğun bir iş haftası mı? Serin bozulmaz, sadece bekler.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={rest}
            aria-label="Bu hafta mola ver"
            onClick={() => {
              actions.toggleRestWeek(me.id, weekKey(Date.now()));
              feedback({ tone: 'info', title: rest ? 'Mola kaldırıldı' : 'Mola haftası', text: rest ? 'Bu hafta yeniden sayılıyor.' : 'Serin bu hafta bekliyor.' });
            }}
            className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${rest ? 'bg-green' : 'bg-line-2'}`}
          >
            <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[left] duration-200 ${rest ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>
      <button type="button" onClick={onClose} className="btn-primary btn-block mt-6">
        Tamam
      </button>
    </Sheet>
  );
}
