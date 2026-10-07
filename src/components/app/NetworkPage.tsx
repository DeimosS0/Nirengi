import { useMemo, useState } from 'react';
import type { EventKind, NetEvent, Org, Person, State } from '../../lib/types.ts';
import { actions, byId, useAppState } from '../../lib/store.ts';
import { findConflicts, momentum, scoreMatch } from '../../lib/engine/match.ts';
import { daysSince, relTime } from '../../lib/format.ts';
import { ROUND } from '../../lib/seed.ts';
import { Avatar, OrgMark, PageHead, Stat } from '../ui/primitives.tsx';

const KINDS: { key: EventKind | 'all'; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'evidence_verified', label: 'Doğrulanan kanıt' },
  { key: 'milestone_approved', label: 'Kilometre taşı' },
  { key: 'need_published', label: 'Yeni ihtiyaç' },
  { key: 'pilot_opened', label: 'Pilot' },
  { key: 'micro', label: 'Mikro-etkileşim' },
];

const DOT: Record<EventKind, string> = {
  evidence_verified: 'bg-s2',
  milestone_approved: 'bg-s3',
  need_published: 'bg-ink',
  pilot_opened: 'bg-signal',
  pilot_closed: 'bg-ink-3',
  micro: 'bg-warn',
  person_joined: 'bg-s1',
};

const UNITS = [
  { key: 'gorus', label: '30 dk uzman görüşü' },
  { key: 'inceleme', label: 'Kod / tasarım incelemesi' },
  { key: 'soru', label: 'Kısa uzmanlık sorusu' },
] as const;

interface Relation {
  org: Org;
  person: Person;
  last: string;
  source: string;
}

/** Relationships are derived from shared history: pilots, micro-interactions and endorsements. */
function relations(s: State): Relation[] {
  const map = new Map<string, Relation>();
  const touch = (orgId: string | undefined, personId: string | undefined, at: string, source: string) => {
    const org = byId.org(s, orgId);
    const person = byId.person(s, personId);
    if (!org || !person) return;
    const key = `${org.id}|${person.id}`;
    const cur = map.get(key);
    if (!cur || Date.parse(at) > Date.parse(cur.last)) map.set(key, { org, person, last: at, source });
  };
  for (const p of s.pilots) touch(p.orgId, p.personId, p.log[p.log.length - 1]?.at ?? p.startedAt, 'pilot');
  for (const e of s.events) if (e.kind === 'micro') touch(e.orgId, e.personId, e.at, 'mikro-etkileşim');
  for (const person of s.people)
    for (const e of person.evidence) {
      if (e.level !== 'S3' || !e.verifier || e.source === 'pilot') continue;
      const org = s.orgs.find((o) => e.verifier!.startsWith(o.name));
      if (org) touch(org.id, person.id, e.verifiedAt ?? e.producedAt, 'kurum tasdiki');
    }
  return [...map.values()].sort((a, b) => Date.parse(b.last) - Date.parse(a.last));
}

const health = (days: number) => (days <= 30 ? { label: 'Sıcak', tone: 'text-s3 bg-s3/10' } : days <= 90 ? { label: 'Ilık', tone: 'text-warn bg-warn/10' } : { label: 'Soğuyor', tone: 'text-danger bg-danger/10' });

export default function NetworkPage() {
  const s = useAppState();
  const [kind, setKind] = useState<(typeof KINDS)[number]['key']>('all');
  const rels = useMemo(() => relations(s), [s]);
  const conflicts = useMemo(() => findConflicts(s.people), [s.people]);
  const alive = rels.filter((r) => daysSince(r.last) <= 90).length;
  const last30 = s.events.filter((e) => daysSince(e.at) <= 30).length;
  const micro = s.events.filter((e) => e.kind === 'micro').length;
  const feed = s.events.filter((e) => kind === 'all' || e.kind === kind || (kind === 'pilot_opened' && e.kind === 'pilot_closed'));

  // A concrete reason to reconnect: an open need from this org that fits the person's evidence.
  const reason = (r: Relation) => {
    const fits = s.needs
      .filter((n) => n.status === 'published')
      .map((n) => ({ n, m: scoreMatch(r.person, n, byId.org(s, n.orgId)!, s.pilots, conflicts) }))
      .sort((a, b) => Number(b.n.orgId === r.org.id) - Number(a.n.orgId === r.org.id) || b.m.score - a.m.score)[0];
    if (fits && fits.m.score >= 45) return `“${fits.n.title}” ihtiyacı ${r.person.name.split(' ')[0]} ile %${fits.m.score} eşleşiyor.`;
    if (momentum(r.person).recent > 0) return `${r.person.name.split(' ')[0]} son 90 günde yeni kanıt üretti.`;
    return null;
  };

  const recipients = (e: NetEvent) => {
    if (e.kind === 'need_published' && e.needId) {
      const n = byId.need(s, e.needId);
      if (!n) return null;
      const org = byId.org(s, n.orgId)!;
      const k = s.people.filter((p) => scoreMatch(p, n, org, s.pilots, conflicts).score >= 50).length;
      return `${k} uygun profile bildirildi`;
    }
    if (e.kind === 'milestone_approved' || e.kind === 'pilot_opened' || e.kind === 'pilot_closed') return 'yalnız taraflara bildirildi';
    if (e.kind === 'evidence_verified') return 'kişinin bağlantılı kurumlarına';
    return null;
  };

  return (
    <>
      <PageHead
        eyebrow="04 · Yaşayan bir ağ"
        title={
          <>
            Bağlantı değil, <em>olay.</em>
          </>
        }
        lead="Ağı canlı tutan şey “bağlantı kur” düğmesi değil, olay akışıdır. Her doğrulanmış kanıt, her onaylanan kilometre taşı bir olaydır ve yalnız gerçek bağlamı olan kişiye bildirim üretir."
      />
      <div className="wrap py-8">
        <div className="grid grid-cols-2 gap-6 rounded-xl border border-line bg-raised p-5 md:grid-cols-4">
          <Stat label="90 günlük canlılık" value={`%${rels.length ? Math.round((alive / rels.length) * 100) : 0}`} hint={`${alive}/${rels.length} ilişki etkileşimde`} />
          <Stat label="Son 30 gün" value={last30} hint="olay" />
          <Stat label="Mikro-etkileşim" value={micro} />
          <Stat label="İhtiyaç turu" value={ROUND} hint="çeyreklik ritim" />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
          <section>
            <h2 className="text-lg font-semibold">Olay akışı</h2>
            <div className="scrollbar-none mt-3 flex gap-1 overflow-x-auto">
              {KINDS.map((k) => (
                <button key={k.key} onClick={() => setKind(k.key)} className={`chip shrink-0 !py-1 ${kind === k.key ? '!border-ink !bg-ink !text-paper' : 'hover:text-ink'}`}>
                  {k.label}
                </button>
              ))}
            </div>
            <ol className="relative mt-5 border-l border-line pl-6">
              {feed.slice(0, 30).map((e) => {
                const rcp = recipients(e);
                return (
                  <li key={e.id} className="rise relative pb-5">
                    <span className={`absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-paper ${DOT[e.kind]}`} />
                    <p className="text-[15px] leading-snug">{e.text}</p>
                    <p className="mt-1 font-mono text-[11px] text-ink-3">
                      {relTime(e.at)}
                      {rcp && <> · {rcp}</>}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>

          <aside className="space-y-4">
            <div className="card p-5">
              <p className="eyebrow">Bağlantı sağlığı</p>
              <p className="mt-2 text-sm text-ink-2">Soğuyan ilişkide sistem “selam ver” demez; somut bir sebep üretir.</p>
              <ul className="mt-4 space-y-3">
                {rels.map((r) => {
                  const d = daysSince(r.last);
                  const h = health(d);
                  const why = d > 21 ? reason(r) : null;
                  return (
                    <li key={`${r.org.id}${r.person.id}`} className="rounded-lg border border-line bg-paper p-3">
                      <div className="flex items-center gap-2">
                        <OrgMark name={r.org.name} size={24} />
                        <Avatar person={r.person} size={24} reveal />
                        <p className="min-w-0 flex-1 truncate text-sm">
                          <span className="font-semibold">{r.org.name}</span> × {r.person.name}
                        </p>
                        <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${h.tone}`}>{h.label}</span>
                      </div>
                      <p className="mt-1.5 font-mono text-[11px] text-ink-3">
                        son temas {d} gün önce · {r.source}
                      </p>
                      {why && (
                        <div className="mt-2 flex items-start gap-2">
                          <p className="flex-1 text-xs leading-relaxed text-ink-2">↳ {why}</p>
                          <button
                            className="btn-line btn-sm !px-2 !py-1 !text-[11px]"
                            onClick={() => actions.micro(r.person.id, r.org.id, `${r.org.name}, ${r.person.name} ile somut bir sebeple yeniden temas kurdu: ${why}`)}
                          >
                            Temas kur
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
            <MicroForm />
          </aside>
        </div>
      </div>
    </>
  );
}

function MicroForm() {
  const s = useAppState();
  const [orgId, setOrgId] = useState(s.orgs[0].id);
  const [personId, setPersonId] = useState(s.people.find((p) => p.availability !== 'closed')!.id);
  const [unit, setUnit] = useState<(typeof UNITS)[number]['key']>('gorus');
  const [done, setDone] = useState(false);
  return (
    <div className="card p-5">
      <p className="eyebrow">Mikro-etkileşim birimleri</p>
      <p className="mt-2 text-sm text-ink-2">Ağ yalnız büyük iş birlikleriyle yaşamaz. Küçük birimler hem düşük eşikli temas hem de kendisi bir kanıt olayıdır.</p>
      <div className="mt-3 grid gap-2">
        <select className="field !py-2 text-sm" value={orgId} onChange={(e) => setOrgId(e.target.value)} aria-label="Kurum">
          {s.orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <select className="field !py-2 text-sm" value={personId} onChange={(e) => setPersonId(e.target.value)} aria-label="Kişi">
          {s.people
            .filter((p) => p.availability !== 'closed')
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.headline}
              </option>
            ))}
        </select>
        <div className="grid grid-cols-3 gap-1">
          {UNITS.map((u) => (
            <button key={u.key} onClick={() => setUnit(u.key)} className={`rounded-md border px-2 py-2 text-xs leading-tight ${unit === u.key ? 'border-ink bg-sunken font-semibold' : 'border-line text-ink-2'}`}>
              {u.label}
            </button>
          ))}
        </div>
        <button
          className="btn-ink btn-sm"
          onClick={() => {
            const o = byId.org(s, orgId)!;
            const p = byId.person(s, personId)!;
            const u = UNITS.find((x) => x.key === unit)!;
            actions.micro(p.id, o.id, `${o.name} → ${p.name}: ${u.label.toLocaleLowerCase('tr-TR')} talebi.`);
            setDone(true);
            setTimeout(() => setDone(false), 1800);
          }}
        >
          {done ? 'Akışa düştü' : 'Talep gönder'}
        </button>
      </div>
    </div>
  );
}
