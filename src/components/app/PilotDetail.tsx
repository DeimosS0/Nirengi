// Proje yolu: the milestones are the hero. Each node opens its own sheet; the ledger lives one tap below.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { actions, byId, lastActivity, SILENCE_DAYS, useAppState, useView } from '../../lib/store.ts';
import type { LogEntry, Milestone, Org, Persona, Person, Pilot } from '../../lib/types.ts';
import { GENESIS, shortHash, verifyChain } from '../../lib/engine/ledger.ts';
import { PILOT_STATUS } from '../../lib/labels.ts';
import { daysSince, fmtDate, fmtDateTime, relTime } from '../../lib/format.ts';
import Niri from '../ui/Niri';
import { Bar, EmptyState, feedback, Head, Sheet, Why, celebrate } from '../ui/kit';
import { Avatar, LevelBadge, OrgMark } from '../ui/primitives';
import { Face, firstName, isSilent, lookOf, nodeKinds, type NodeKind } from './PilotsPage';
import { SealMoment } from './SealMoment';

const KIND: Record<LogEntry['kind'], string> = {
  open: 'açılış',
  update: 'güncelleme',
  decision: 'karar',
  blocker: 'engel',
  submit: 'teslim',
  approve: 'onay',
  revise: 'düzeltme',
  close: 'kapanış',
  nudge: 'hatırlatma',
};
const ACTOR = { person: 'Yetenek', org: 'Kurum', system: 'Sistem' } as const;
const ACTOR_TONE = { person: 'bg-cyan-tint text-cyan-lip', org: 'bg-indigo-tint text-indigo', system: 'bg-bg-3 text-ink-3' } as const;
const OFFSETS = [0, -44, -64, -44, 0, 44, 64, 44];
const STATUS_TONE = { active: 'bg-indigo-tint text-indigo', succeeded: 'bg-green-tint text-green-lip', failed: 'bg-bg-3 text-ink-2' } as const;

export default function PilotDetail({ id }: { id: string }) {
  const s = useAppState();
  const pilot = byId.pilot(s, id);
  if (!pilot)
    return (
      <div className="mx-auto max-w-[640px] pt-6">
        <EmptyState
          title="Bu proje bulunamadı"
          action={
            <a href="/pilotlar" className="btn-primary">
              Projelere dön
            </a>
          }
        >
          Bağlantı eski olabilir ya da proje bu cihazda yok.
        </EmptyState>
      </div>
    );
  return <Detail pilot={pilot} />;
}

// ---------------------------------------------------------------- helpers

/** The reason a milestone went back to its owner, if the last word on it was a revision request. */
function revisionOf(pilot: Pilot, m: Milestone): string | null {
  if (m.state !== 'open') return null;
  const last = [...pilot.log].reverse().find((e) => ['submit', 'approve', 'revise'].includes(e.kind) && e.text.includes(m.title));
  if (!last || last.kind !== 'revise') return null;
  const rest = last.text.slice(last.text.indexOf(m.title) + m.title.length).replace(/^\s*—\s*/, '');
  return rest || 'Ayrıntı yazılmadı.';
}

function Linkified({ text }: { text: string }) {
  return (
    <>
      {text.split(/(https?:\/\/[^\s]+)/g).map((t, i) =>
        /^https?:\/\//.test(t) ? (
          <a key={i} href={t} target="_blank" rel="noopener noreferrer" className="break-all font-extrabold text-indigo underline">
            {t}
          </a>
        ) : (
          t
        ),
      )}
    </>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${on ? 'bg-green' : 'bg-line-2'}`}
    >
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[left] duration-200 ${on ? 'left-7' : 'left-1'}`} />
    </button>
  );
}

// ---------------------------------------------------------------- page

function Detail({ pilot }: { pilot: Pilot }) {
  const s = useAppState();
  const { persona } = useView();
  const org = byId.org(s, pilot.orgId)!;
  const person = byId.person(s, pilot.personId)!;
  const need = byId.need(s, pilot.needId);
  const active = pilot.status === 'active';
  const kinds = nodeKinds(pilot);
  const approved = kinds.filter((k) => k === 'done').length;
  const total = pilot.milestones.length;
  const waiting = pilot.milestones.filter((m) => m.state === 'submitted');
  const allDone = active && approved === total && total > 0;
  const silent = isSilent(pilot) ? daysSince(lastActivity(pilot)) : 0;

  const [sheet, setSheet] = useState<number | null>(null);
  const [ledger, setLedger] = useState(false);
  const [closing, setClosing] = useState(false);
  const [seal, setSeal] = useState<{ last: boolean } | null>(null);

  // The star (young side) and the approval bubble (kurum side) mark the one node that needs a hand.
  const focus = persona === 'person' ? kinds.indexOf('current') : kinds.indexOf('waiting');

  // ?adim=<milestoneId> opens that milestone; ?onay=1 opens the first one waiting for the org's approval.
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const id = q.get('adim');
    const i = id ? pilot.milestones.findIndex((m) => m.id === id) : q.has('onay') ? pilot.milestones.findIndex((m) => m.state === 'submitted') : -1;
    if (i >= 0) setSheet(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const say =
    pilot.status === 'succeeded'
      ? { mood: 'happy' as const, text: 'Bu proje başarıyla kapandı. Onaylanan her aşama kanıt olarak kalır.' }
      : pilot.status === 'failed'
        ? { mood: 'think' as const, text: 'Bu proje gerekçesiyle kapandı. Onaylanan aşamalar yine de kanıt olarak kalır.' }
        : allDone
          ? { mood: 'happy' as const, text: 'Tüm aşamalar onaylandı! Şimdi projeyi kapatıp kartı yayımlayabilirsiniz.' }
          : persona === 'org'
            ? waiting.length
              ? { mood: 'wave' as const, text: `${firstName(person)} bir adımı teslim etti. Bakıp onaylayabilirsin.` }
              : { mood: 'think' as const, text: `${firstName(person)} sıradaki adımı hazırlıyor. Teslim edince burada görürsün.` }
            : kinds.includes('current')
              ? { mood: 'wave' as const, text: 'Sıradaki adım seni bekliyor. Teslim edince kurum onaylar.' }
              : { mood: 'think' as const, text: `${org.name} onayını bekliyoruz. Gelince burada haber veririz.` };

  return (
    <div className="mx-auto max-w-[640px]">
      <a href="/pilotlar" className="inline-flex items-center gap-1 rounded-full py-1 pr-3 text-[14px] font-extrabold text-ink-3 transition-colors hover:text-ink">
        <ChevronLeft className="h-5 w-5" strokeWidth={3} />
        {persona === 'org' ? 'Projeler' : 'Projelerim'}
      </a>

      {/* Who and where */}
      <section className="card mt-3 p-5" aria-labelledby="proje">
        <div className="flex max-w-[460px] items-center gap-3">
          <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
            <OrgMark name={org.name} size={52} />
            <span className="max-w-[120px] text-[13px] font-extrabold leading-tight text-ink-2">{org.name}</span>
          </div>
          <span className="relative mb-6 h-[3px] flex-1 rounded-full bg-line-2" aria-hidden="true">
            <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-line-2 bg-bg" />
          </span>
          <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
            <Avatar person={person} size={52} reveal />
            <a href={`/profil/${person.handle}`} className="max-w-[120px] text-[13px] font-extrabold leading-tight text-ink-2 hover:text-indigo hover:underline">
              {person.name}
            </a>
          </div>
        </div>

        <h1 id="proje" className="mt-5 text-[26px] font-black leading-tight text-ink">
          {pilot.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`pill ${STATUS_TONE[pilot.status]}`}>{PILOT_STATUS[pilot.status]}</span>
          {need && (
            <a href={`/ihtiyaclar/${need.id}`} className="chip transition-colors hover:border-indigo/40 hover:text-indigo">
              İhtiyacı gör
              <ChevronRight className="h-4 w-4" strokeWidth={3} />
            </a>
          )}
        </div>

        <div className="mt-5 flex items-center gap-4">
          <div className="flex-1">
            <Bar value={approved / Math.max(1, total)} tone="green" />
          </div>
          <span className="num text-[16px] font-black text-ink-2">
            {approved}/{total} adım
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[13px] font-bold text-ink-3">
          <span>
            Başlangıç {fmtDate(pilot.startedAt)} · son hareket {relTime(lastActivity(pilot))}
          </span>
          <Why title="İlerleme nasıl sayılıyor?">
            <p className="text-[15px] font-bold text-ink-2">Bir aşama yalnız iki taraf da onaylayınca sayılır: genç teslim ederek, kurum onaylayarak. Teslim edilip onay bekleyen aşama henüz ilerlemeye yazılmaz.</p>
            <p className="mt-3 text-[15px] font-bold text-ink-2">Aşamalar, pilot açıldığı anda ihtiyaç kanvasındaki başarı kriterlerinden doğdu. Hedef sonradan değiştirilemez.</p>
          </Why>
        </div>
      </section>

      {silent > 0 && (
        <div className="mt-4 rounded-[18px] border-2 border-red/40 bg-red-tint p-4">
          <div className="flex items-start gap-3">
            <span className="relative mt-1.5 grid h-4 w-4 shrink-0 place-items-center" aria-hidden="true">
              <span className="ping-soft absolute inset-0 rounded-full bg-red" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-red" />
            </span>
            <div className="min-w-0">
              <p className="text-[17px] font-black text-red-lip">{silent} gündür hareket yok</p>
              <p className="text-[14px] font-bold text-ink-2">
                {waiting.length ? 'Sıra kurumda: teslim edilen adım onay bekliyor.' : 'Sıra gençte: sıradaki adım henüz teslim edilmedi.'} {SILENCE_DAYS} günü geçen proje sessiz sayılır.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-line btn-sm mt-3 w-full sm:w-auto"
            onClick={() => {
              actions.addLog(pilot.id, persona, 'nudge', `Hatırlatma gönderildi: ${silent} gündür sessiz.`);
              feedback({ tone: 'info', title: 'Hatırlatma gitti', text: 'İki tarafa da bildirildi ve deftere yazıldı.' });
            }}
          >
            İki tarafa hatırlat
          </button>
        </div>
      )}

      {/* Niri says the one thing */}
      <div className="mt-5 flex items-end gap-3">
        <Niri mood={say.mood} size={80} />
        <div className="relative mb-3 flex-1 rounded-[18px] border-2 border-line bg-bg px-4 py-3">
          <span className="absolute -left-[9px] bottom-4 h-4 w-4 rotate-45 border-b-2 border-l-2 border-line bg-bg" aria-hidden="true" />
          <p className="text-[16px] font-extrabold leading-snug text-ink">{say.text}</p>
        </div>
      </div>

      {active && focus >= 0 && !allDone && (
        <button type="button" className="btn-primary btn-block mt-2" onClick={() => setSheet(focus)}>
          {persona === 'org' ? 'İncele ve onayla' : 'Teslim et'}
          <ChevronRight className="h-5 w-5" strokeWidth={3} />
        </button>
      )}

      {allDone && (
        <section className="mt-4 rounded-[20px] bg-green p-5 text-white" style={{ boxShadow: '0 5px 0 rgb(var(--green-lip))' }}>
          <p className="text-[22px] font-black leading-tight">Tüm aşamalar iki taraflı onaylandı</p>
          <p className="mt-1 text-[15px] font-bold text-white/85">Projeyi kapat, isterseniz herkese açık özet kartını yayımla.</p>
          <button
            type="button"
            onClick={() => setClosing(true)}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-white px-5 text-[15px] font-black uppercase tracking-[0.06em] text-green-lip"
            style={{ boxShadow: '0 4px 0 rgb(255 255 255 / 0.45)' }}
          >
            Kapat ve kartı yayımla
            <ChevronRight className="h-5 w-5" strokeWidth={3} />
          </button>
        </section>
      )}

      {/* The road */}
      <section className="mt-9" aria-label="Aşamalar">
        <Head title="Aşamalar" action={<span className="text-[13px] font-bold text-ink-3">Bir adıma dokun</span>} />
        <ol className={`mt-4 flex flex-col items-center gap-6 pb-2 ${focus === 0 ? 'pt-12' : 'pt-4'}`}>
          {pilot.milestones.map((m, i) => (
            <RoadNode key={m.id} m={m} i={i} kind={kinds[i]} persona={persona} pilot={pilot} x={OFFSETS[i % OFFSETS.length]} focus={i === focus} onOpen={() => setSheet(i)} />
          ))}
        </ol>
      </section>

      {/* After the road: closing, closure, ledger */}
      {pilot.closure && <Closure pilot={pilot} />}
      {active && !allDone && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border-2 border-dashed border-line-2 p-4">
          <p className="min-w-0 flex-1 text-[14px] font-bold text-ink-3">Proje bitti mi, durdu mu? Sessizce bırakmak yerine gerekçesiyle kapat.</p>
          <button type="button" className="btn-line btn-sm" onClick={() => setClosing(true)}>
            Projeyi kapat
          </button>
        </div>
      )}

      <button type="button" onClick={() => setLedger(true)} className="card-press mt-8 flex w-full items-center gap-4 p-4 text-left">
        <ChainGlyph />
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-black text-ink">Defter</span>
          <span className="block text-[14px] font-bold text-ink-3">{pilot.log.length} kayıt · her kayıt öncekine zincirle bağlı</span>
        </span>
        <ChevronRight className="h-6 w-6 shrink-0 text-ink-3" strokeWidth={3} />
      </button>
      <p className="mt-8 text-[13px] font-bold text-ink-3">Kurumlar ve kişiler kurgusal demo verisidir.</p>

      <Sheet open={sheet !== null} onClose={() => setSheet(null)} title={sheet !== null ? `${sheet + 1}. aşama` : ''}>
        {sheet !== null && (
          <MilestoneBody
            key={pilot.milestones[sheet].id}
            pilot={pilot}
            m={pilot.milestones[sheet]}
            kind={kinds[sheet]}
            persona={persona}
            person={person}
            org={org}
            onClose={() => setSheet(null)}
            onApproved={() => {
              setSheet(null);
              setSeal({ last: pilot.milestones.filter((x) => x.state !== 'approved').length === 1 });
            }}
          />
        )}
      </Sheet>
      <Sheet open={ledger} onClose={() => setLedger(false)} title="Defter">
        {ledger && <LedgerBody pilot={pilot} persona={persona} />}
      </Sheet>
      <Sheet open={closing} onClose={() => setClosing(false)} title="Projeyi kapat">
        {closing && <CloseBody pilot={pilot} onDone={() => setClosing(false)} />}
      </Sheet>
      <SealMoment open={!!seal} name={person.name} last={seal?.last ?? false} onDone={() => setSeal(null)} />
    </div>
  );
}

function ChainGlyph() {
  return (
    <svg viewBox="0 0 44 44" width={44} height={44} className="shrink-0" aria-hidden="true">
      <path d="M13 22h18" stroke="rgb(var(--line-2))" strokeWidth="3" strokeLinecap="round" />
      <rect x="2" y="13" width="14" height="18" rx="4" fill="rgb(var(--indigo))" />
      <rect x="15" y="13" width="14" height="18" rx="4" fill="rgb(var(--cyan))" />
      <rect x="28" y="13" width="14" height="18" rx="4" fill="rgb(var(--green))" />
      <path d="M2 27h14M15 27h14M28 27h14" stroke="rgb(0 0 0 / 0.14)" strokeWidth="4" />
    </svg>
  );
}

// ---------------------------------------------------------------- the road

function RoadNode({
  m,
  i,
  kind,
  persona,
  pilot,
  x,
  focus,
  onOpen,
}: {
  m: Milestone;
  i: number;
  kind: NodeKind;
  persona: Persona;
  pilot: Pilot;
  x: number;
  focus: boolean;
  onOpen: () => void;
}) {
  const reduce = useReducedMotion();
  const revised = revisionOf(pilot, m) !== null;
  const overdue = kind !== 'done' && pilot.status === 'active' && Date.parse(m.due) < Date.now();
  const caption: { text: string; cls: string } | null =
    kind === 'done'
      ? { text: 'Onaylandı', cls: 'text-green-lip' }
      : kind === 'waiting'
        ? persona === 'org'
          ? { text: 'Onayın bekleniyor', cls: 'text-indigo' }
          : { text: 'Kurum bakıyor', cls: 'text-ink-3' }
        : kind === 'missed'
          ? { text: 'Karşılanmadı', cls: 'text-ink-3' }
          : revised
            ? { text: 'Düzeltme istendi', cls: 'text-red-lip' }
            : overdue
              ? { text: 'Gecikmede', cls: 'text-red-lip' }
              : persona === 'org'
                ? { text: 'Teslim bekleniyor', cls: 'text-ink-3' }
                : null;
  const bubble = focus ? (persona === 'person' ? 'Sıradaki' : 'Sıra sende') : null;
  const dim = kind === 'later' || kind === 'missed';
  return (
    <li className={`relative flex flex-col items-center ${bubble && i > 0 ? 'mt-8' : ''}`} style={{ transform: `translateX(${x}px)` }}>
      {bubble && (
        <motion.span
          className="absolute -top-11 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-[12px] border-2 border-line bg-bg px-3 py-1.5 text-[14px] font-black uppercase tracking-wide"
          style={{ color: 'rgb(var(--indigo))' }}
          animate={reduce ? undefined : { y: [0, -5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          {bubble}
          <span className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-line bg-bg" />
        </motion.span>
      )}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${i + 1}. aşama: ${m.title}${caption ? ` — ${caption.text}` : ''}`}
        className="rounded-full transition-transform duration-100 active:translate-y-[6px]"
      >
        <Face look={lookOf(kind, persona)} size={76} n={i + 1} ring={focus} />
      </button>
      <p className={`mt-4 line-clamp-3 w-[200px] text-center text-[14px] font-extrabold leading-tight ${dim ? 'text-ink-3' : 'text-ink-2'}`}>{m.title}</p>
      {caption && <p className={`mt-1 text-[12px] font-extrabold ${caption.cls}`}>{caption.text}</p>}
    </li>
  );
}

// ---------------------------------------------------------------- milestone sheet

function MilestoneBody({
  pilot,
  m,
  kind,
  persona,
  person,
  org,
  onClose,
  onApproved,
}: {
  pilot: Pilot;
  m: Milestone;
  kind: NodeKind;
  persona: Persona;
  person: Person;
  org: Org;
  onClose: () => void;
  onApproved: () => void;
}) {
  const who = firstName(person);
  const overdue = kind !== 'done' && pilot.status === 'active' && Date.parse(m.due) < Date.now();
  const revision = revisionOf(pilot, m);
  const status =
    kind === 'done'
      ? { text: 'Onaylandı', cls: 'bg-green-tint text-green-lip' }
      : kind === 'waiting'
        ? persona === 'org'
          ? { text: 'Senin onayını bekliyor', cls: 'bg-indigo-tint text-indigo' }
          : { text: 'Kurum bakıyor', cls: 'bg-bg-3 text-ink-3' }
        : kind === 'missed'
          ? { text: 'Karşılanmadı', cls: 'bg-bg-3 text-ink-3' }
          : kind === 'current' && persona === 'person'
            ? { text: 'Sıradaki adım', cls: 'bg-indigo-tint text-indigo' }
            : persona === 'person'
              ? { text: 'Sırası gelmedi', cls: 'bg-bg-3 text-ink-3' }
              : { text: 'Teslim bekleniyor', cls: 'bg-bg-3 text-ink-3' };

  const summary =
    m.state === 'approved'
      ? 'İki taraf da onayladı'
      : m.state === 'submitted'
        ? persona === 'person'
          ? 'Sen onayladın · Kurum bekleniyor'
          : `${who} onayladı · Sıra sende`
        : persona === 'person'
          ? 'Henüz teslim etmedin'
          : `${who} henüz teslim etmedi`;

  // Entries that name this milestone, plus the org approval when only its timestamp is known.
  const history = pilot.log.filter((e) => ['submit', 'approve', 'revise'].includes(e.kind) && e.text.includes(m.title));
  const items = history.map((e) => ({ at: e.at, actor: e.actor, text: e.text }));
  if (m.approvals.org && !history.some((e) => e.kind === 'approve')) items.push({ at: m.approvals.org, actor: 'org', text: 'Kurum onayladı.' });
  items.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  return (
    <div>
      <p className="text-[18px] font-black leading-snug text-ink">{m.title}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`pill ${status.cls}`}>{status.text}</span>
        <span className={`chip ${overdue ? '!border-red/40 !text-red-lip' : ''}`}>
          <Clock className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
          Hedef {fmtDate(m.due)}
          {overdue && ' · gecikmede'}
        </span>
      </div>

      {revision && (
        <div className="mt-4 rounded-[16px] bg-red-tint p-4">
          <p className="text-[15px] font-black text-red-lip">Kurum düzeltme istedi</p>
          <p className="mt-0.5 text-[15px] font-bold text-ink-2">{revision}</p>
        </div>
      )}

      {m.submittedNote && (
        <div className="mt-4">
          <p className="text-[15px] font-black text-ink">Teslim edilen kanıt</p>
          <p className="mt-1.5 rounded-[14px] bg-bg-2 p-3.5 text-[15px] font-bold leading-snug text-ink-2">
            <Linkified text={m.submittedNote} />
          </p>
        </div>
      )}

      {pilot.status === 'active' && m.state !== 'approved' && (
        <Actions key={m.id} pilot={pilot} m={m} kind={kind} persona={persona} who={who} onClose={onClose} onApproved={onApproved} />
      )}

      <div className="mt-6 border-t-2 border-line pt-5">
        <p className="text-[16px] font-black text-ink">{summary}</p>
        <ul className="mt-3 space-y-2.5">
          <Approval done={!!m.approvals.person} who={`${person.name} · Yetenek`} at={m.approvals.person} did="Teslim ederek onayladı" pending="Henüz teslim etmedi" />
          <Approval done={!!m.approvals.org} who={`${org.name} · Kurum`} at={m.approvals.org} did="Onayladı" pending={m.state === 'submitted' ? 'Onay bekliyor' : 'Teslimden sonra'} />
        </ul>
      </div>

      {m.state === 'approved' && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[16px] bg-indigo-tint p-4">
          <LevelBadge level="S3" />
          <p className="min-w-0 flex-1 text-[14px] font-bold text-ink-2">Bu aşama, {person.name} adlı kişinin profiline Kurum onaylı kanıt olarak işlendi.</p>
          <a href={`/profil/${person.handle}`} className="btn-primary btn-sm">
            Profilde gör
          </a>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-5">
          <p className="text-[15px] font-black text-ink">Geçmiş</p>
          <ul className="mt-2 space-y-2">
            {items.map((e, n) => (
              <li key={n} className="flex gap-2.5 text-[14px] font-bold leading-snug text-ink-3">
                <span className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${e.actor === 'org' ? 'bg-indigo' : 'bg-cyan'}`} aria-hidden="true" />
                <span className="min-w-0">
                  <span className="num text-ink-3">{fmtDateTime(e.at)}</span> · <Linkified text={e.text} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}

function Approval({ done, who, at, did, pending }: { done: boolean; who: string; at?: string; did: string; pending: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${done ? 'bg-green text-white' : 'border-2 border-dashed border-line-2 text-ink-3'}`}>
        {done ? <Check className="h-4.5 w-4.5" strokeWidth={4} /> : <Clock className="h-4 w-4" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-extrabold text-ink">{who}</span>
        <span className="num block text-[13px] font-bold text-ink-3">{done && at ? `${did} · ${fmtDateTime(at)}` : pending}</span>
      </span>
    </li>
  );
}

function Actions({
  pilot,
  m,
  kind,
  persona,
  who,
  onClose,
  onApproved,
}: {
  pilot: Pilot;
  m: Milestone;
  kind: NodeKind;
  persona: Persona;
  who: string;
  onClose: () => void;
  onApproved: () => void;
}) {
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');
  const [revise, setRevise] = useState(false);
  const wrap = (children: ReactNode) => <div className="mt-5">{children}</div>;

  if (persona === 'person') {
    if (kind === 'current') {
      const linkOk = !link.trim() || /^https?:\/\/\S+\.\S+/.test(link.trim());
      const ready = linkOk && (note.trim().length > 0 || link.trim().length > 0);
      return wrap(
        <>
          <label className="label" htmlFor="kanit-link">
            Kanıt bağlantısı <span className="font-bold text-ink-3">(isteğe bağlı)</span>
          </label>
          <input id="kanit-link" className="field" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />
          {!linkOk && <p className="mt-2 text-[14px] font-bold text-red-lip">Bağlantı https:// ile başlamalı.</p>}
          <label className="label mt-4" htmlFor="kanit-not">
            Ne yaptın, nasıl ölçtün?
          </label>
          <textarea id="kanit-not" className="field min-h-24" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ölçümü ve sonucu yaz; kurum bunu görerek onaylayacak." />
          <button
            type="button"
            className="btn-primary btn-block mt-5"
            disabled={!ready}
            onClick={() => {
              const text = [note.trim(), link.trim() && `Bağlantı: ${link.trim()}`].filter(Boolean).join(' · ');
              actions.submitMilestone(pilot.id, m.id, text);
              onClose();
              feedback({ tone: 'good', title: 'Kuruma iletildi', text: 'Kurum onaylayınca bu aşama Kurum onaylı kanıt olarak profiline işlenir.' });
            }}
          >
            Teslim et
          </button>
        </>,
      );
    }
    if (kind === 'waiting')
      return wrap(<p className="text-[14px] font-bold text-ink-3">Teslimin kuruma gitti. Demoda sol menüden Kurum yüzüne geçip bu adımı onaylayabilirsin.</p>);
    return wrap(<p className="text-[14px] font-bold text-ink-3">Adımlar sırayla teslim edilir. Önce sıradaki adımı teslim et, bu adım ondan sonra açılır.</p>);
  }

  if (kind === 'waiting')
    return wrap(
      revise ? (
        <>
          <label className="label" htmlFor="duzeltme">
            Neyin eksik olduğunu yaz
          </label>
          <textarea id="duzeltme" className="field min-h-24" autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="Açık ve ölçülebilir yaz: ne eksik, ne gelirse onaylarsın?" />
          <div className="mt-5 flex gap-3">
            <button type="button" className="btn-quiet" onClick={() => setRevise(false)}>
              Vazgeç
            </button>
            <button
              type="button"
              className="btn-red flex-1"
              disabled={note.trim().length < 5}
              onClick={() => {
                actions.requestRevision(pilot.id, m.id, note.trim());
                onClose();
                feedback({ tone: 'info', title: 'Düzeltme istendi', text: `${who} teslimi güncelleyecek. İstek deftere yazıldı.` });
              }}
            >
              Düzeltme iste
            </button>
          </div>
        </>
      ) : (
        <>
          <label className="label" htmlFor="onay-not">
            Nasıl doğruladın? <span className="font-bold text-ink-3">(isteğe bağlı)</span>
          </label>
          <textarea id="onay-not" className="field min-h-20" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Örn. ölçüm sunucuda tekrarlandı." />
          <p className="hint">Onayınla bu aşama iki taraflı tamamlanır, deftere yazılır ve kişinin profiline Kurum onaylı kanıt olarak işlenir.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button type="button" className="btn-line" onClick={() => setRevise(true)}>
              Düzeltme iste
            </button>
            <button
              type="button"
              className="btn-green"
              onClick={() => {
                actions.approveMilestone(pilot.id, m.id, note.trim());
                onApproved();
              }}
            >
              Onayla
            </button>
          </div>
        </>
      ),
    );
  return wrap(<p className="text-[14px] font-bold text-ink-3">{who} bu adımı teslim edince burada onayına düşer.</p>);
}

// ---------------------------------------------------------------- closure

function Closure({ pilot }: { pilot: Pilot }) {
  const c = pilot.closure!;
  const published = c.publicConsent.person && c.publicConsent.org;
  const ok = pilot.status === 'succeeded';
  return (
    <section className={`mt-6 rounded-[20px] border-2 p-5 ${ok ? 'border-green/40 bg-green-tint' : 'border-line bg-bg'}`} aria-label="Kapanış">
      <p className="text-[18px] font-black leading-snug text-ink">{c.reason}</p>
      <p className="mt-1.5 text-[15px] font-bold text-ink-2">{c.summary}</p>
      {!ok && (
        <p className="mt-3 text-[14px] font-bold text-ink-3">
          Başarısız proje de gerekçesiyle kapanır. Onaylanan aşamalar kişinin profilinde kanıt olarak kalır; şeffaf bir kapanış, cevapsız kalmış bir süreçten daha değerlidir.
        </p>
      )}
      {published ? (
        <a href={`/kart/${pilot.id}`} className="btn-primary btn-block mt-5">
          Herkese açık kartı gör
        </a>
      ) : (
        <p className="mt-4 text-[14px] font-bold text-ink-3">Herkese açık kart yayımlanmadı: kart, iki taraf da onay verirse yayımlanır.</p>
      )}
    </section>
  );
}

function CloseBody({ pilot, onDone }: { pilot: Pilot; onDone: () => void }) {
  const total = pilot.milestones.length;
  const met = pilot.milestones.filter((m) => m.state === 'approved').length;
  const allMet = met === total;
  const [outcome, setOutcome] = useState<'succeeded' | 'failed'>(allMet ? 'succeeded' : 'failed');
  const [reason, setReason] = useState(allMet ? `${met}/${total} başarı kriteri karşılandı.` : '');
  const [summary, setSummary] = useState('');
  const [consent, setConsent] = useState({ person: true, org: true });
  const both = consent.person && consent.org;
  return (
    <div>
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Kapanış türü">
        {(
          [
            ['succeeded', 'Başarıyla', 'Tüm adımlar onaylı'],
            ['failed', 'Gerekçesiyle', 'Bir kısmı karşılanmadı'],
          ] as const
        ).map(([k, l, d]) => {
          const on = outcome === k;
          return (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={k === 'succeeded' && !allMet}
              onClick={() => setOutcome(k)}
              className={`card-press p-3.5 text-left disabled:cursor-not-allowed disabled:opacity-45 ${on ? '!border-indigo !bg-indigo-tint' : ''}`}
            >
              <span className={`block text-[16px] font-black ${on ? 'text-indigo' : 'text-ink'}`}>{l}</span>
              <span className="block text-[13px] font-bold text-ink-3">{d}</span>
            </button>
          );
        })}
      </div>
      {!allMet && (
        <p className="hint">
          “Başarıyla” için tüm adımların iki taraflı onaylı olması gerekir ({met}/{total}).
        </p>
      )}

      <label className="label mt-5" htmlFor="kapanis-gerekce">
        Gerekçe
      </label>
      <input id="kapanis-gerekce" className="field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Örn. Veri erişimi sağlanamadı; 1/3 kriter karşılandı." />
      <label className="label mt-4" htmlFor="kapanis-ozet">
        Herkese açık özet
      </label>
      <textarea id="kapanis-ozet" className="field min-h-20" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Sonuç, ölçülen değerler ve öğrenilenler." />

      <div className="mt-5 rounded-[16px] bg-bg-2 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[16px] font-black text-ink">Herkese açık kart</p>
          <Why title="Kartta neler görünür?">
            <p className="text-[15px] font-bold text-ink-2">Kart yalnız iki taraf da onay verirse yayımlanır. İçinde proje adı, kurum, kişi, süre, karşılanan kriterler ve defter özeti olur.</p>
            <p className="mt-3 text-[15px] font-bold text-ink-2">Kartı bağlantıyı bilen herkes görür. Bu demoda iki tarafın onayı bu formdan verilir.</p>
          </Why>
        </div>
        <ul className="mt-3 space-y-3">
          {(
            [
              ['person', 'Yetenek yayımlanmasını onaylıyor'],
              ['org', 'Kurum yayımlanmasını onaylıyor'],
            ] as const
          ).map(([k, l]) => (
            <li key={k} className="flex items-center justify-between gap-3">
              <span className="text-[15px] font-bold text-ink-2">{l}</span>
              <Switch on={consent[k]} onChange={(v) => setConsent({ ...consent, [k]: v })} label={l} />
            </li>
          ))}
        </ul>
        <p className={`mt-3 text-[13px] font-extrabold ${both ? 'text-green-lip' : 'text-ink-3'}`}>{both ? 'İki taraf da onayladı: kart yayımlanacak.' : 'Kart yayımlanmayacak.'}</p>
      </div>

      <div className="mt-6 flex gap-3">
        <button type="button" className="btn-quiet" onClick={onDone}>
          Vazgeç
        </button>
        <button
          type="button"
          className="btn-primary flex-1"
          disabled={reason.trim().length < 8}
          onClick={() => {
            actions.closePilot(pilot.id, outcome, reason.trim(), summary.trim() || reason.trim(), consent);
            onDone();
            if (outcome === 'succeeded')
              celebrate({ title: 'Proje tamamlandı', sub: `${met}/${total} kriter iki tarafça onaylandı.${both ? ' Herkese açık kart yayında.' : ''}`, ...(both ? { cta: 'Kartı gör', href: `/kart/${pilot.id}` } : { cta: 'Devam et' }) });
            else feedback({ tone: 'info', title: 'Proje kapandı', text: 'Gerekçe deftere yazıldı; onaylanan aşamalar kanıt olarak kalır.' });
          }}
        >
          Projeyi kapat
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- ledger

type Block = 'idle' | 'ok' | 'bad' | 'untrusted';

function LedgerBody({ pilot, persona }: { pilot: Pilot; persona: Persona }) {
  const reduce = useReducedMotion();
  const [tamper, setTamper] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [checked, setChecked] = useState(0);
  const [kind, setKind] = useState<'update' | 'decision' | 'blocker'>('update');
  const [text, setText] = useState('');
  const wrote = useRef(false);
  const endRef = useRef<HTMLLIElement>(null);
  const rows = useRef<(HTMLLIElement | null)[]>([]);

  // The tamper demo edits a copy on this screen only; nothing is saved.
  const forgedAt = Math.max(0, pilot.log.length - 3);
  const entries = useMemo(() => {
    if (!tamper) return pilot.log;
    const forged = structuredClone(pilot.log);
    forged[forgedAt].text = `${forged[forgedAt].text} (sonradan değiştirildi)`;
    return forged;
  }, [pilot.log, tamper, forgedAt]);
  const broken = useMemo(() => verifyChain(entries), [entries]);
  const end = broken === -1 ? entries.length : broken + 1;

  const run = (withTamper: boolean) => {
    setTamper(withTamper);
    setChecked(0);
    setPhase('running');
  };

  useEffect(() => {
    if (phase !== 'running') return;
    if (checked >= end) {
      setPhase('done');
      if (broken === -1) feedback({ tone: 'good', title: 'Zincir bütün', text: `${entries.length} kayıt tek tek kontrol edildi, hiçbiri değişmemiş.` });
      else feedback({ tone: 'bad', title: `${broken + 1}. kayıtta zincir kırık`, text: 'Bu kaydın içeriği değişmiş; özeti artık tutmuyor.' });
      return;
    }
    rows.current[Math.min(checked, end - 1)]?.scrollIntoView({ block: 'nearest' });
    const t = window.setTimeout(() => setChecked((c) => c + 1), reduce ? 0 : Math.max(60, Math.min(160, 1500 / entries.length)));
    return () => window.clearTimeout(t);
  }, [phase, checked, end, broken, entries.length, reduce]);

  // A new entry changes the tail of the chain, so an earlier result no longer applies.
  useEffect(() => {
    setPhase('idle');
    setChecked(0);
    if (wrote.current) {
      wrote.current = false;
      endRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    }
  }, [pilot.log.length, reduce]);

  const stateOf = (i: number): Block => {
    if (phase === 'idle') return 'idle';
    if (broken === -1) return i < checked ? 'ok' : 'idle';
    if (i < broken) return i < checked ? 'ok' : 'idle';
    if (i === broken) return checked > broken ? 'bad' : 'idle';
    return phase === 'done' ? 'untrusted' : 'idle';
  };
  const reason = (i: number) => {
    const prev = i === 0 ? GENESIS : entries[i - 1].hash;
    return entries[i].prev !== prev ? 'Önceki kaydın özetiyle bağı kopmuş.' : 'Metin değişmiş: yeniden hesaplanan özet, kayıtlı özetle uyuşmuyor.';
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[15px] font-bold text-ink-3">{entries.length} kayıt · SHA-256 zinciri</p>
        <Why title="Zincir nasıl çalışır?">
          <p className="text-[15px] font-bold text-ink-2">Her kayıt, kendi içeriğinin ve bir önceki kaydın özetini (SHA-256) taşır; böylece kayıtlar tek bir zincir olur.</p>
          <p className="mt-3 text-[15px] font-bold text-ink-2">Geçmişte tek bir harf değişse bile o kaydın özeti tutmaz ve ondan sonraki her bağ bozulur; bu yüzden defter sessizce yeniden yazılamaz.</p>
        </Why>
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" className="btn-primary btn-sm" onClick={() => run(false)} disabled={phase === 'running'}>
          Zinciri doğrula
        </button>
        <button type="button" className="btn-line btn-sm" onClick={() => run(true)} disabled={phase === 'running' || tamper}>
          Kurcalamayı dene
        </button>
        {tamper && (
          <button
            type="button"
            className="btn-quiet btn-sm"
            disabled={phase === 'running'}
            onClick={() => {
              setTamper(false);
              setPhase('idle');
              setChecked(0);
            }}
          >
            Geri al
          </button>
        )}
      </div>
      {tamper && (
        <p className="mt-3 rounded-[14px] bg-red-tint p-3 text-[14px] font-bold text-ink-2">
          Bir geçmiş kaydın metni yalnız bu ekranda değiştirildi, kaydedilmedi. Değişiklik anında görünür: o kaydın özeti tutmaz ve ondan sonrası güvenilmez olur.
        </p>
      )}

      <ol className="mt-5">
        {entries.map((e, i) => {
          const st = stateOf(i);
          const nextSt = i < entries.length - 1 ? stateOf(i + 1) : 'idle';
          const dot = st === 'ok' ? 'bg-green text-white' : st === 'bad' ? 'bg-red text-white' : st === 'untrusted' ? 'bg-red-tint text-red-lip' : 'bg-bg-3 text-ink-3';
          const line = nextSt === 'ok' ? 'bg-green' : nextSt === 'bad' || nextSt === 'untrusted' ? 'bg-red/60' : 'bg-line-2';
          const box =
            st === 'ok' ? 'border-green/50 bg-green-tint/50' : st === 'bad' ? 'border-red bg-red-tint' : st === 'untrusted' ? 'border-red/40 bg-red-tint/50' : 'border-line bg-bg';
          return (
            <li key={`${e.id}-${i}`} ref={(el) => {
                rows.current[i] = el;
                if (i === entries.length - 1) endRef.current = el;
              }}
              className="relative flex gap-3">
              <div className="flex flex-col items-center">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-black transition-colors duration-150 ${dot}`}>
                  {st === 'ok' ? <Check className="h-4.5 w-4.5" strokeWidth={4} /> : st === 'bad' || st === 'untrusted' ? <X className="h-4.5 w-4.5" strokeWidth={4} /> : <span className="num">{i + 1}</span>}
                </span>
                {i < entries.length - 1 && <span className={`my-1 w-[3px] flex-1 rounded-full transition-colors duration-150 ${line}`} />}
              </div>
              <div className={`mb-3 min-w-0 flex-1 rounded-[14px] border-2 p-3 transition-colors duration-150 ${box}`}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={`pill !px-2 !py-0.5 !text-[12px] ${ACTOR_TONE[e.actor]}`}>{ACTOR[e.actor]}</span>
                  <span className="text-[13px] font-extrabold text-ink-3">{KIND[e.kind]}</span>
                  <span className="num ml-auto text-[12px] font-bold text-ink-3">{fmtDateTime(e.at)}</span>
                </div>
                <p className="mt-1.5 text-[14px] font-bold leading-snug text-ink">{e.text}</p>
                <p className={`mono mt-2 text-[11.5px] font-medium ${st === 'bad' || st === 'untrusted' ? 'text-red-lip' : 'text-ink-3'}`}>
                  özet {shortHash(e.hash)} · önceki {i === 0 ? 'başlangıç' : shortHash(e.prev)}
                </p>
                {st === 'bad' && <p className="mt-2 text-[13px] font-extrabold text-red-lip">{reason(i)}</p>}
                {st === 'untrusted' && <p className="mt-2 text-[13px] font-extrabold text-red-lip">Kırık kayıttan sonra geldiği için güvenilmez.</p>}
              </div>
            </li>
          );
        })}
      </ol>

      {pilot.status === 'active' && (
        <form
          className="mt-2 border-t-2 border-line pt-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            wrote.current = true;
            actions.addLog(pilot.id, persona, kind, text.trim());
            setText('');
            feedback({ tone: 'good', title: 'Deftere yazıldı', text: 'Yeni kayıt zincirin sonuna eklendi.' });
          }}
        >
          <p className="label !mb-2">Deftere yaz · {persona === 'org' ? 'Kurum' : 'Yetenek'} olarak</p>
          <div className="seg" role="group" aria-label="Kayıt türü">
            {(
              [
                ['update', 'Güncelleme'],
                ['decision', 'Karar'],
                ['blocker', 'Engel'],
              ] as const
            ).map(([k, l]) => (
              <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}>
                {l}
              </button>
            ))}
          </div>
          <input className="field mt-3" value={text} onChange={(e) => setText(e.target.value)} placeholder="Kısa ve ölçülebilir yaz" aria-label="Kayıt metni" />
          <p className="hint">Kayıtlar düzenlenemez ve silinemez; yalnız yeni kayıt eklenebilir.</p>
          <button type="submit" className="btn-primary btn-block mt-4" disabled={!text.trim()}>
            Deftere yaz
          </button>
        </form>
      )}
    </div>
  );
}
