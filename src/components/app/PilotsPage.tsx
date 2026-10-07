// Projeler: every pilot of this persona, each with its road and the one thing to do next.

import { motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronRight, Clock, Minus, Star } from 'lucide-react';
import { byId, currentMe, currentOrg, lastActivity, SILENCE_DAYS, useAppState, useView } from '../../lib/store.ts';
import { PILOT_STATUS } from '../../lib/labels.ts';
import { daysSince, fmtDate } from '../../lib/format.ts';
import type { Persona, Person, Pilot } from '../../lib/types.ts';
import { EmptyState, Head, Why } from '../ui/kit';
import { Lock } from '../ui/icons';
import { Avatar, OrgMark } from '../ui/primitives';

// ---------------------------------------------------------------- shared road logic

export type NodeKind = 'done' | 'waiting' | 'current' | 'later' | 'missed';

/** Where each milestone stands. Delivery goes in order; approvals may lag behind it. */
export function nodeKinds(p: Pilot): NodeKind[] {
  const first = p.milestones.findIndex((m) => m.state === 'open');
  return p.milestones.map((m, i) =>
    m.state === 'approved' ? 'done' : p.status !== 'active' ? 'missed' : m.state === 'submitted' ? 'waiting' : i === first ? 'current' : 'later',
  );
}

export const firstName = (p: Person) => p.name.split(' ')[0];
export const isSilent = (p: Pilot) => p.status === 'active' && daysSince(lastActivity(p)) >= SILENCE_DAYS;

type Tone = 'indigo' | 'green' | 'ink';

/** The one line that says what this persona should do next on a pilot. */
export function nextAction(p: Pilot, persona: Persona, person: Person): { text: string; tone: Tone } {
  const done = p.milestones.filter((m) => m.state === 'approved').length;
  if (p.status !== 'active') return { text: `${PILOT_STATUS[p.status]} · ${done}/${p.milestones.length} kriter`, tone: p.status === 'succeeded' ? 'green' : 'ink' };
  const waiting = p.milestones.filter((m) => m.state === 'submitted');
  const open = p.milestones.find((m) => m.state === 'open');
  if (!open && !waiting.length) return { text: 'Tüm adımlar onaylandı. Sıra pilotu kapatmakta.', tone: 'green' };
  if (persona === 'org') {
    if (waiting.length) return { text: `Onayını bekleyen ${waiting.length} adım`, tone: 'indigo' };
    return { text: `${firstName(person)} sıradaki adımı hazırlıyor: ${open!.title}`, tone: 'ink' };
  }
  if (open) return { text: `Sıradaki adım: ${open.title}`, tone: 'indigo' };
  return { text: `Kurumun onayını bekliyor: ${waiting[0].title}`, tone: 'ink' };
}

export type Look = 'done' | 'wait' | 'star' | 'lock' | 'open' | 'missed';

/** Star = your turn (either side), clock = the other side's turn, lock = not yet, dashed = waiting for the youth. */
export const lookOf = (k: NodeKind, persona: Persona): Look =>
  k === 'done' ? 'done' : k === 'waiting' ? (persona === 'org' ? 'star' : 'wait') : k === 'missed' ? 'missed' : persona === 'person' ? (k === 'current' ? 'star' : 'lock') : 'open';

const FACE: Record<Look, { bg: string; lip: string }> = {
  done: { bg: 'green', lip: 'green-lip' },
  wait: { bg: 'bg-2', lip: 'line-2' },
  star: { bg: 'indigo', lip: 'indigo-lip' },
  lock: { bg: 'bg-3', lip: 'line-2' },
  open: { bg: 'bg', lip: 'line-2' },
  missed: { bg: 'bg-3', lip: 'line-2' },
};

/** A round milestone face with the key lip; the same grammar at 30px (list) and 76px (road). */
export function Face({ look, size, n, ring = false }: { look: Look; size: number; n?: number; ring?: boolean }) {
  const f = FACE[look];
  const lip = size >= 60 ? 6 : 3;
  const g = Math.round(size * 0.5);
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `rgb(var(--${f.bg}))`,
        border: look === 'open' ? '2px dashed rgb(var(--line-2))' : look === 'wait' ? '3px solid rgb(var(--line-2))' : undefined,
        boxShadow: `0 ${lip}px 0 rgb(var(--${f.lip}))${ring ? `, 0 0 0 ${size >= 60 ? 8 : 4}px rgb(var(--${f.bg}) / 0.18)` : ''}`,
      }}
      aria-hidden="true"
    >
      {look === 'done' && <Check style={{ width: g, height: g }} className="text-white" strokeWidth={4} />}
      {look === 'wait' && <Clock style={{ width: g, height: g }} className="text-ink-3" strokeWidth={3.2} />}
      {look === 'star' && <Star style={{ width: g, height: g }} className="fill-white text-white" strokeWidth={2} />}
      {look === 'lock' && <Lock size={Math.round(size * 0.46)} />}
      {look === 'missed' && <Minus style={{ width: g, height: g }} className="text-ink-3" strokeWidth={3.5} />}
      {look === 'open' && (
        <span className="num font-black text-ink-3" style={{ fontSize: size * 0.34 }}>
          {n}
        </span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------- page

const TONE_TEXT: Record<Tone, string> = { indigo: 'text-indigo', green: 'text-green-lip', ink: 'text-ink-2' };

function PilotCard({ pilot, persona, i }: { pilot: Pilot; persona: Persona; i: number }) {
  const s = useAppState();
  const reduce = useReducedMotion();
  const org = byId.org(s, pilot.orgId)!;
  const person = byId.person(s, pilot.personId)!;
  const kinds = nodeKinds(pilot);
  const done = kinds.filter((k) => k === 'done').length;
  const next = nextAction(pilot, persona, person);
  const silent = isSilent(pilot) ? daysSince(lastActivity(pilot)) : 0;
  return (
    <motion.li initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: Math.min(i, 4) * 0.05, ease: [0.16, 1, 0.3, 1] }}>
      <a href={`/pilotlar/${pilot.id}`} className="card-press block p-5">
        <div className="flex items-start gap-3">
          <p className="min-w-0 flex-1 text-[18px] font-black leading-snug text-ink">{pilot.title}</p>
          <ChevronRight className="mt-0.5 h-6 w-6 shrink-0 text-ink-3" strokeWidth={3} />
        </div>
        <div className="mt-3 flex items-center gap-2.5 text-[15px] font-extrabold text-ink-2">
          {persona === 'org' ? <Avatar person={person} size={30} reveal /> : <OrgMark name={org.name} size={30} />}
          <span className="min-w-0 truncate">{persona === 'org' ? person.name : org.name}</span>
        </div>

        <ol className="mt-5 flex items-center" aria-label={`${done}/${pilot.milestones.length} adım onaylı`}>
          {kinds.map((k, n) => (
            <li key={pilot.milestones[n].id} className="flex items-center" style={{ flex: n < kinds.length - 1 ? '1 1 0' : '0 0 auto' }}>
              <Face look={lookOf(k, persona)} size={30} n={n + 1} />
              {n < kinds.length - 1 && <span className={`mx-1.5 h-[3px] flex-1 rounded-full ${k === 'done' ? 'bg-green' : 'bg-line'}`} />}
            </li>
          ))}
        </ol>

        <p className={`mt-4 text-[15px] font-extrabold leading-snug ${TONE_TEXT[next.tone]}`}>{next.text}</p>
        {pilot.status !== 'active' && pilot.closedAt && <p className="mt-1 text-[13px] font-bold text-ink-3">{fmtDate(pilot.closedAt)} tarihinde kapandı</p>}
        {silent > 0 && (
          <span className="pill mt-3 bg-red-tint text-red-lip">
            <Clock className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
            {silent} gündür sessiz
          </span>
        )}
      </a>
    </motion.li>
  );
}

export default function PilotsPage() {
  const s = useAppState();
  const view = useView();
  const persona = view.persona;
  const me = currentMe(s);
  const org = currentOrg(s, view);
  const mine = s.pilots.filter((p) => (persona === 'org' ? p.orgId === org.id : p.personId === me.id));

  const urgency = (p: Pilot) => {
    const waiting = p.milestones.filter((m) => m.state === 'submitted').length;
    const open = p.milestones.some((m) => m.state === 'open');
    return (persona === 'org' ? waiting * 3 : open ? 2 : 0) + (isSilent(p) ? 2 : 0);
  };
  const active = mine.filter((p) => p.status === 'active').sort((a, b) => urgency(b) - urgency(a));
  const closed = mine.filter((p) => p.status !== 'active');

  return (
    <div className="mx-auto max-w-[640px]">
      <header>
        <div className="flex items-start justify-between gap-3">
          <h1 className="h-page">{persona === 'org' ? 'Projeler' : 'Projelerim'}</h1>
          <Why title="Projeler nasıl ilerler?">
            <p className="text-[15px] font-bold text-ink-2">Bir aşama ancak iki taraf da onaylayınca tamamlanır: genç teslim ederek, kurum onaylayarak.</p>
            <p className="mt-3 text-[15px] font-bold text-ink-2">
              {SILENCE_DAYS} gün boyunca hiçbir hareket olmazsa proje “sessiz” sayılır. Pilotların çoğu başarısız olduğu için değil, sessizce terk edildiği için biter; bu yüzden sessizliği görünür kılıyoruz.
            </p>
            <p className="mt-3 text-[15px] font-bold text-ink-2">Her hareket, değiştirilemeyen zincirli bir deftere yazılır. Proje içinde iki taraf birbirini tanır; kör keşif yalnız ilk temasa kadar geçerlidir.</p>
          </Why>
        </div>
        <p className="lead mt-2">
          {persona === 'org' ? `${org.name} için yürüyen işler. Her adım iki taraf da onaylayınca tamamlanır.` : 'Kurumlarla yürüttüğün işler. Her adımı sen teslim edersin, kurum onaylayınca tamamlanır.'}
        </p>
      </header>

      <section className="mt-8" aria-label="Süren projeler">
        {active.length ? (
          <ul className="space-y-4">
            {active.map((p, i) => (
              <PilotCard key={p.id} pilot={p} persona={persona} i={i} />
            ))}
          </ul>
        ) : persona === 'org' ? (
          <EmptyState
            title={closed.length ? 'Şu an süren pilot yok' : 'Henüz pilotun yok'}
            action={
              <a href="/ihtiyaclar" className="btn-primary">
                İhtiyaçlara git
                <ChevronRight className="h-5 w-5" strokeWidth={3} />
              </a>
            }
          >
            Bir ihtiyaçtan aday seçince pilot burada başlar.
          </EmptyState>
        ) : (
          <EmptyState
            title={closed.length ? 'Şu an süren projen yok' : 'Henüz bir projen yok'}
            action={
              <a href="/bugun#ihtiyaclar" className="btn-primary">
                Sana uyan ihtiyaçlar
                <ChevronRight className="h-5 w-5" strokeWidth={3} />
              </a>
            }
          >
            Bir kurum seni aday seçtiğinde proje burada başlar. Önce sana uyan ihtiyaçlara göz at.
          </EmptyState>
        )}
      </section>

      {closed.length > 0 && (
        <section className="mt-10" aria-label="Kapanan projeler">
          <Head title="Kapananlar" action={<span className="text-[13px] font-bold text-ink-3">Başarısız olan da gerekçesiyle kapanır</span>} />
          <ul className="mt-4 space-y-4">
            {closed.map((p, i) => (
              <PilotCard key={p.id} pilot={p} persona={persona} i={i} />
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 text-[13px] font-bold text-ink-3">Kurumlar ve kişiler kurgusal demo verisidir.</p>
    </div>
  );
}
