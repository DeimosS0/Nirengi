import { useEffect, useMemo, useState } from 'react';
import type { Level } from '../../lib/types.ts';
import { actions, byId, setView, useAppState, useView } from '../../lib/store.ts';
import { coverageFor, findConflicts, momentum, needsForPerson } from '../../lib/engine/match.ts';
import { AVAILABILITY, LEVELS, PILOT_STATUS } from '../../lib/labels.ts';
import { fmtDate } from '../../lib/format.ts';
import { skillLabel } from '../../lib/skills.ts';
import { Avatar, Empty, LevelGlyph, OrgMark, ScoreDial, useIdentity } from '../ui/primitives.tsx';
import { EvidenceItem } from './EvidenceItem.tsx';

const ORDER: Record<Level, number> = { S3: 0, S2: 1, S1: 2 };

export default function ProfilePage({ handle }: { handle: string }) {
  const s = useAppState();
  const person = byId.handle(s, handle);
  if (!person)
    return (
      <div className="wrap py-24">
        <Empty title="Bu profil bulunamadı">
          Demo verisi sıfırlanmış olabilir. <a className="underline" href="/kesfet">Keşfet’e dön</a>
        </Empty>
      </div>
    );
  return <Profile personId={person.id} />;
}

function Profile({ personId }: { personId: string }) {
  const s = useAppState();
  const view = useView();
  const person = byId.person(s, personId)!;
  const id = useIdentity(person);
  const conflicts = useMemo(() => findConflicts(s.people), [s.people]);
  const [filter, setFilter] = useState<Level | 'all'>('all');

  const seeded = Date.parse(s.seededAt);
  const fresh = (e: { source: string; verifiedAt?: string }) => e.source === 'pilot' && !!e.verifiedAt && Date.parse(e.verifiedAt) > seeded;
  const hasFresh = person.evidence.some(fresh);
  useEffect(() => {
    if (hasFresh && !s.demo.viewedProfileAfterApproval) actions.flag({ viewedProfileAfterApproval: true });
  }, [hasFresh, s.demo.viewedProfileAfterApproval]);

  const counts = { S1: 0, S2: 0, S3: 0 } as Record<Level, number>;
  person.evidence.forEach((e) => counts[e.level]++);
  const m = momentum(person);
  const skills = [...new Set(person.evidence.flatMap((e) => e.skills))]
    .map((k) => coverageFor(person, k, conflicts))
    .sort((a, b) => b.score - a.score || b.count - a.count);
  const evidence = [...person.evidence]
    .filter((e) => filter === 'all' || e.level === filter)
    .sort((a, b) => Number(fresh(b)) - Number(fresh(a)) || ORDER[a.level] - ORDER[b.level] || Date.parse(b.producedAt) - Date.parse(a.producedAt));
  const pilots = s.pilots.filter((p) => p.personId === person.id);
  const fits = needsForPerson(s, person).slice(0, 3);
  const isSelf = view.persona === 'person' && person.isDemoUser;

  return (
    <>
      <header className="band">
        <div className="wrap grid gap-8 py-10 md:grid-cols-[1fr_auto] md:items-end md:py-12">
          <div className="flex gap-5">
            <Avatar person={person} size={72} />
            <div className="min-w-0">
              <p className="eyebrow">Kanıt Kartı</p>
              <h1 className="display mt-1 text-[40px] md:text-[52px]">{id.name}</h1>
              <p className="mt-1 text-ink-2">{id.sub}</p>
              {!id.hidden && (
                <p className="mt-1 font-mono text-xs text-ink-3">
                  {person.age} yaş · {person.school} · {fmtDate(person.joinedAt)} tarihinden beri
                </p>
              )}
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-2">{person.bio}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <span className={`chip ${person.availability === 'open' ? '!border-s3/40 !text-s3' : ''}`}>
                  {AVAILABILITY[person.availability]}
                  {person.weeklyHours > 0 && ` · haftada ${person.weeklyHours} saat`}
                </span>
                {!id.hidden && person.links.github && (
                  <a className="chip hover:text-ink" href={`https://github.com/${person.links.github}`} target="_blank" rel="noreferrer">
                    github.com/{person.links.github}
                  </a>
                )}
                {!id.hidden && person.links.domain && (
                  <a className="chip hover:text-ink" href={`https://${person.links.domain}`} target="_blank" rel="noreferrer">
                    {person.links.domain}
                  </a>
                )}
                {m.rising && <span className="chip !border-signal/40 !text-signal">↗ yükselen sinyal</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            {id.hidden ? (
              <>
                <button
                  className="btn-ink"
                  onClick={() => {
                    setView({ revealed: [...view.revealed, person.id] });
                    actions.micro(person.id, 'o-marmara', `Bir kurum, Aday · ${id.code} ile ilk teması kurdu; kimlik açıldı.`);
                  }}
                >
                  İlk teması kur, kimliği aç
                </button>
                <p className="max-w-[260px] text-xs text-ink-3 md:text-right">Kör keşif: kurum ilk temasa kadar yalnız kanıtı görür.</p>
              </>
            ) : (
              <button
                className="btn-line"
                onClick={() => {
                  navigator.clipboard?.writeText(location.href);
                }}
              >
                Kanıt Kartı bağlantısını kopyala
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="wrap grid gap-8 py-10 lg:grid-cols-[1fr_340px]">
        <section aria-labelledby="kanitlar">
          {hasFresh && (
            <div className="rise mb-5 flex items-start gap-3 rounded-xl border border-s3/40 bg-s3/8 p-4">
              <LevelGlyph level="S3" size={20} />
              <div className="text-sm">
                <p className="font-semibold text-ink">Döngü kapandı.</p>
                <p className="text-ink-2">Pilotta çift onaylanan kilometre taşı bu profile S3 kanıt olarak işlendi. Bundan sonraki her eşleşmede en yüksek ağırlıkla sayılır.</p>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="kanitlar" className="text-lg font-semibold">
              Kanıtlar <span className="num text-ink-3">{person.evidence.length}</span>
            </h2>
            <div className="flex rounded-lg border border-line bg-sunken p-0.5">
              {(['all', 'S3', 'S2', 'S1'] as const).map((k) => (
                <button key={k} onClick={() => setFilter(k)} className={`tab !py-1 ${filter === k ? 'tab-on' : ''}`}>
                  {k === 'all' ? 'Tümü' : `${k} · ${counts[k]}`}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {evidence.map((e) => {
              const c = conflicts.get(e.id);
              return <EvidenceItem key={e.id} ev={e} person={person} conflict={c} ownerHandle={c ? byId.person(s, c.ownerId)?.handle : undefined} fresh={fresh(e)} />;
            })}
            {evidence.length === 0 && <Empty title="Bu seviyede kanıt yok" />}
          </div>

          {pilots.length > 0 && (
            <>
              <h2 className="mt-10 text-lg font-semibold">Pilotlar</h2>
              <ul className="mt-4 space-y-2">
                {pilots.map((p) => {
                  const org = byId.org(s, p.orgId)!;
                  const ok = p.milestones.filter((x) => x.state === 'approved').length;
                  return (
                    <li key={p.id}>
                      <a href={`/pilotlar/${p.id}`} className="card card-hover flex items-center gap-4 p-4">
                        <OrgMark name={org.name} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{p.title}</p>
                          <p className="text-sm text-ink-3">
                            {org.name} · {PILOT_STATUS[p.status]}
                          </p>
                        </div>
                        <span className="num text-sm text-ink-2">
                          {ok}/{p.milestones.length} çift onay
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <p className="eyebrow">Doğrulama dağılımı</p>
            <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-sunken">
              {(['S3', 'S2', 'S1'] as const).map((l) => (
                <span key={l} className={l === 'S3' ? 'bg-s3' : l === 'S2' ? 'bg-s2' : 'bg-s1/50'} style={{ width: `${(counts[l] / Math.max(1, person.evidence.length)) * 100}%` }} />
              ))}
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {(['S3', 'S2', 'S1'] as const).map((l) => (
                <li key={l} className="flex items-center gap-2">
                  <LevelGlyph level={l} size={13} />
                  <span className="flex-1 text-ink-2">{LEVELS[l].name}</span>
                  <span className="num">{counts[l]}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-ink-3">
              NİRENGİ kimseye tek bir “güven puanı” vermez. Her iddianın nasıl doğrulandığını ayrı ayrı gösterir.
            </p>
          </div>

          <div className="card p-5">
            <p className="eyebrow">Yetkinlik yüzeyi</p>
            <ul className="mt-3 space-y-2.5">
              {skills.map((c) => (
                <li key={c.skill}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {c.best && <LevelGlyph level={c.best.level} size={12} />}
                      {skillLabel(c.skill)}
                    </span>
                    <span className="num text-xs text-ink-3">{c.verified} doğrulanmış</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-sunken">
                    <div className={`h-full ${c.score >= 1 ? 'bg-s3' : c.score >= 0.8 ? 'bg-s2' : 'bg-s1'}`} style={{ width: `${c.score * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <p className="eyebrow">Yükselen sinyal</p>
            <p className="mt-2 text-sm text-ink-2">
              Son 90 günde <span className="num font-semibold text-ink">{m.recent.toFixed(1)}</span> ağırlıklı kanıt; önceki 9 ayın çeyreklik ortalaması{' '}
              <span className="num font-semibold text-ink">{(m.prior / 3).toFixed(1)}</span>.
            </p>
            <p className="mt-2 text-xs text-ink-3">Takipçi ya da beğeni sayılmaz; yalnız doğrulanmış üretimin ivmesi.</p>
          </div>

          {fits.length > 0 && (
            <div className="card p-5">
              <p className="eyebrow">{isSelf ? 'Sana uyan açık ihtiyaçlar' : 'Bu profile uyan açık ihtiyaçlar'}</p>
              <ul className="mt-3 space-y-4">
                {fits.map((f) => {
                  const gap = [...f.gaps].sort((a, b) => b.gain - a.gain)[0];
                  return (
                    <li key={f.need.id}>
                      <a href={`/ihtiyaclar/${f.need.id}`} className="flex gap-3">
                        <ScoreDial value={f.score} size={42} />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold leading-snug hover:underline">{f.need.title}</span>
                          <span className="block text-xs text-ink-3">{byId.org(s, f.need.orgId)?.name}</span>
                        </span>
                      </a>
                      {gap && (
                        <p className="mt-2 rounded-md bg-sunken px-3 py-2 text-xs leading-relaxed text-ink-2">
                          Eksik olan: <strong className="font-semibold text-ink">{skillLabel(gap.skill)}</strong> alanında{' '}
                          {gap.kind === 'claim' ? 'beyanın var ama doğrulanmış üretim yok' : 'henüz kanıt yok'}. Kapanırsa{' '}
                          <span className="num font-semibold text-s3">+{gap.gain}</span>.
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
