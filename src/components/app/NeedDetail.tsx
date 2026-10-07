import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Need } from '../../lib/types.ts';
import { actions, byId, setView, useAppState, useView } from '../../lib/store.ts';
import { assessCanvas, isCheckable, PUBLISH_THRESHOLD } from '../../lib/engine/canvas.ts';
import { composeTeam, rankCandidates, similarNeeds, WEIGHTS, type Match } from '../../lib/engine/match.ts';
import { CONSTRAINT, NEED_STATUS, PILOT_STATUS, SCALE, SECTOR } from '../../lib/labels.ts';
import { fmtDate } from '../../lib/format.ts';
import { skillLabel } from '../../lib/skills.ts';
import { Avatar, Empty, LevelGlyph, Meter, Modal, OrgMark, ScoreDial, StatusIcon, useIdentity } from '../ui/primitives.tsx';
import { statusTone } from './NeedsPage.tsx';

const fmtW = (w: number) => w.toLocaleString('tr-TR');

export default function NeedDetail({ id }: { id: string }) {
  const s = useAppState();
  const need = byId.need(s, id);
  if (!need)
    return (
      <div className="wrap py-24">
        <Empty title="Bu ihtiyaç bulunamadı">
          <a className="underline" href="/ihtiyaclar">
            İhtiyaçlara dön
          </a>
        </Empty>
      </div>
    );
  return <Detail need={need} />;
}

function Detail({ need }: { need: Need }) {
  const s = useAppState();
  const { persona } = useView();
  const org = byId.org(s, need.orgId)!;
  const a = assessCanvas(need.canvas, need.skills);
  const live = need.status === 'published' || need.status === 'piloting';
  const ranked = useMemo(() => (live ? rankCandidates(s, need).slice(0, 6) : []), [s, need, live]);
  const team = useMemo(() => (live ? composeTeam(s, need) : null), [s, need, live]);
  const memory = similarNeeds(s, need.skills, need.id);
  const pilot = s.pilots.find((p) => p.needId === need.id);
  const [open, setOpen] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Match | null>(null);

  useEffect(() => {
    if (live && s.demo.viewedMatchesFor !== need.id) actions.flag({ viewedMatchesFor: need.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [need.id, live]);
  useEffect(() => {
    if (ranked[0] && !open) setOpen(ranked[0].person.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ranked.length]);

  const fields: { label: string; value: ReactNode }[] = [
    { label: 'Mevcut durum', value: need.canvas.current },
    {
      label: 'Acı noktası',
      value: (
        <>
          {need.canvas.pain}
          {need.canvas.painMetric && <span className="mt-2 block font-mono text-[13px] text-ink">↳ {need.canvas.painMetric}</span>}
        </>
      ),
    },
    { label: 'Hedef çıktı', value: need.canvas.outcome },
    { label: 'Karar verici', value: need.canvas.decisionMaker },
    { label: 'Pilot kapsamı', value: need.canvas.scope },
  ];

  return (
    <>
      <header className="band">
        <div className="wrap py-10 md:py-12">
          <a href="/ihtiyaclar" className="text-sm text-ink-3 hover:text-ink">
            ← İhtiyaçlar
          </a>
          <div className="mt-5 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <OrgMark name={org.name} />
                <div>
                  <p className="font-semibold">{org.name}</p>
                  <p className="text-xs text-ink-3">
                    {SECTOR[org.sector]} · {SCALE[org.scale]} · {org.city}
                  </p>
                </div>
                <span className={`rounded-md border px-2 py-0.5 font-mono text-[11px] ${statusTone(need.status)}`}>{NEED_STATUS[need.status]}</span>
                <span className="chip">Tur {need.round}</span>
              </div>
              <h1 className="display mt-5 max-w-3xl text-[30px] md:text-[42px]">{need.title}</h1>
            </div>
            <div className="flex items-center gap-4">
              <ScoreDial value={a.score} size={76} label="kanvas" />
              <div className="text-sm">
                <p className="font-semibold">{a.canPublish ? 'Yayın eşiğini geçiyor' : 'Yayın eşiğinin altında'}</p>
                <p className="text-ink-3">Eşik {PUBLISH_THRESHOLD} · engel {a.blockers.length}</p>
              </div>
            </div>
          </div>
          {need.status === 'draft' && (
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-line-2 bg-paper p-4">
              <p className="flex-1 text-sm text-ink-2">
                <strong className="font-semibold text-ink">Bu ihtiyaç taslakta.</strong>{' '}
                {a.canPublish ? 'Kanvas yayına hazır.' : `Yayımlanmadan önce ${a.blockers.length + a.checks.filter((c) => !c.ok && !c.blocking).length} eksik kapanmalı.`}
              </p>
              <a href={`/ihtiyaclar/yeni?id=${need.id}`} className="btn-line btn-sm">
                Kanvası düzenle
              </a>
              <button className="btn-primary btn-sm" disabled={!a.canPublish} onClick={() => actions.publishNeed(need.id)}>
                Yayımla
              </button>
            </div>
          )}
          {pilot && (
            <a href={`/pilotlar/${pilot.id}`} className="mt-6 flex items-center gap-3 rounded-xl border border-signal/40 bg-signal/8 p-4 text-sm hover:border-signal">
              <span className="h-2 w-2 rounded-full bg-signal" />
              <span className="flex-1">
                <strong className="font-semibold">Pilot Defteri açık:</strong> {pilot.title} — {PILOT_STATUS[pilot.status]}
              </span>
              <span className="font-semibold">Deftere git →</span>
            </a>
          )}
        </div>
      </header>

      <div className="wrap grid gap-8 py-10 lg:grid-cols-[1fr_340px]">
        <section>
          <h2 className="eyebrow">İhtiyaç Kanvası</h2>
          <dl className="card mt-3 divide-y divide-line">
            {fields.map((f) => (
              <div key={f.label} className="grid gap-1 p-4 sm:grid-cols-[150px_1fr] sm:gap-4">
                <dt className="text-sm font-semibold text-ink-3">{f.label}</dt>
                <dd className="text-[15px] leading-relaxed">{f.value || <span className="italic text-danger">Boş</span>}</dd>
              </div>
            ))}
            <div className="grid gap-1 p-4 sm:grid-cols-[150px_1fr] sm:gap-4">
              <dt className="text-sm font-semibold text-ink-3">Başarı kriterleri</dt>
              <dd>
                <ol className="space-y-1.5">
                  {need.canvas.criteria.map((c, i) => (
                    <li key={c.id} className="flex gap-2.5 text-[15px]">
                      <span className="num pt-0.5 text-xs text-ink-3">K{i + 1}</span>
                      <span className="flex-1">{c.text}</span>
                      <span className={`font-mono text-[11px] ${isCheckable(c.text) ? 'text-s3' : 'text-danger'}`}>{isCheckable(c.text) ? 'ölçülebilir' : 'ölçülemez'}</span>
                    </li>
                  ))}
                </ol>
                {need.status !== 'draft' && <p className="mt-2 text-xs text-ink-3">Pilot açıldığında her kriter bir kilometre taşına dönüşür ve sonradan değiştirilemez.</p>}
              </dd>
            </div>
            <div className="grid gap-1 p-4 sm:grid-cols-[150px_1fr] sm:gap-4">
              <dt className="text-sm font-semibold text-ink-3">Kısıtlar</dt>
              <dd className="flex flex-wrap gap-2">
                {need.canvas.constraints.length ? (
                  need.canvas.constraints.map((c, i) => (
                    <span key={i} className="chip !py-1 !text-[13px]">
                      <span className="font-semibold text-ink">{CONSTRAINT[c.kind]}:</span> {c.text}
                    </span>
                  ))
                ) : (
                  <span className="italic text-danger">Boş</span>
                )}
              </dd>
            </div>
          </dl>

          {live && (
            <section id="adaylar" className="mt-12 scroll-mt-24">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="eyebrow">03 · Açıklanabilir eşleşme</p>
                  <h2 className="mt-1 text-2xl font-semibold">Adaylar</h2>
                </div>
                <p className="max-w-sm text-sm text-ink-3">
                  Skor = {fmtW(WEIGHTS.evidence)} kanıt + {fmtW(WEIGHTS.context)} bağlam + {fmtW(WEIGHTS.capacity)} kapasite + {fmtW(WEIGHTS.history)} geçmiş.{' '}
                  <a href="/yontem" className="underline">
                    Yöntem
                  </a>
                </p>
              </div>
              <ol className="mt-5 space-y-3">
                {ranked.map((m, i) => (
                  <Candidate
                    key={m.person.id}
                    m={m}
                    rank={i + 1}
                    open={open === m.person.id}
                    onToggle={() => setOpen(open === m.person.id ? null : m.person.id)}
                    canOpenPilot={need.status === 'published' && persona === 'org'}
                    onOpenPilot={() => setConfirm(m)}
                  />
                ))}
              </ol>
              {need.status === 'published' && persona !== 'org' && (
                <p className="mt-3 text-sm text-ink-3">Pilotu kurum açar. Üstteki rol anahtarından “Kurum”a geçebilirsin.</p>
              )}
            </section>
          )}
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <p className="eyebrow">Çözülebilirlik denetimi</p>
            <ul className="mt-3 space-y-2">
              {a.checks.map((c) => (
                <li key={c.id} className="flex gap-2 text-sm">
                  <span className={c.ok ? 'text-s3' : c.blocking ? 'text-danger' : 'text-warn'}><StatusIcon kind={c.ok ? 'ok' : c.blocking ? 'fail' : 'warn'} /></span>
                  <span className="flex-1">
                    <span className={c.ok ? 'text-ink-2' : 'font-medium text-ink'}>{c.label}</span>
                    {!c.ok && <span className="block text-xs text-ink-3">{c.fix}</span>}
                  </span>
                  <span className="num text-xs text-ink-3">{c.ok ? c.points : 0}</span>
                </li>
              ))}
            </ul>
          </div>

          {team && team.members.length > 1 && (
            <div className="card p-5">
              <p className="eyebrow">Takım kompozisyonu</p>
              <p className="mt-2 text-sm text-ink-2">
                İhtiyaç bir kişiden çok bir ekip istiyor olabilir. Bu {team.members.length} kişilik ekip yetkinlik yüzeyini <span className="num font-semibold text-ink">%{Math.round(team.total * 100)}</span>{' '}
                oranında kapatıyor.
              </p>
              <ul className="mt-3 space-y-2">
                {team.coverage.map((c) => (
                  <TeamRow key={c.skill} skill={c.skill} score={c.score} personId={c.by?.id} />
                ))}
              </ul>
            </div>
          )}

          {memory.length > 0 && (
            <div className="card p-5">
              <p className="eyebrow">Ekosistem hafızası</p>
              <p className="mt-2 text-sm text-ink-2">Benzer ihtiyaçlar geçmişte şöyle sonuçlandı:</p>
              <ul className="mt-3 space-y-3">
                {memory.map((x) => (
                  <li key={x.need.id} className="rounded-lg border border-line bg-paper p-3">
                    <a href={x.pilot ? `/pilotlar/${x.pilot.id}` : `/ihtiyaclar/${x.need.id}`} className="block text-sm font-semibold leading-snug hover:underline">
                      {x.need.title}
                    </a>
                    <p className="mt-1 text-xs text-ink-3">
                      {x.org.name} · {x.pilot ? PILOT_STATUS[x.pilot.status] : NEED_STATUS[x.need.status]} · ortak: {x.overlap.map(skillLabel).join(', ')}
                    </p>
                    {x.pilot?.closure && <p className="mt-1.5 text-xs leading-relaxed text-ink-2">{x.pilot.closure.summary}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="px-1 text-xs text-ink-3">
            Yayın: {need.publishedAt ? fmtDate(need.publishedAt) : '—'} · Oluşturma: {fmtDate(need.createdAt)}
          </p>
        </aside>
      </div>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Pilotu aç">
        {confirm && <OpenPilot need={need} m={confirm} onDone={() => setConfirm(null)} />}
      </Modal>
    </>
  );
}

function TeamRow({ skill, score, personId }: { skill: string; score: number; personId?: string }) {
  const s = useAppState();
  const p = byId.person(s, personId);
  const id = useIdentity(p ?? s.people[0]);
  return (
    <li className="text-sm">
      <div className="flex justify-between">
        <span>{skillLabel(skill)}</span>
        <span className="truncate pl-2 text-xs text-ink-3">{p ? id.name : 'kapsanmıyor'}</span>
      </div>
      <Meter value={score} tone={score >= 0.8 ? 's3' : 'warn'} className="mt-1 !h-1" />
    </li>
  );
}

function Candidate({
  m,
  rank,
  open,
  onToggle,
  canOpenPilot,
  onOpenPilot,
}: {
  m: Match;
  rank: number;
  open: boolean;
  onToggle: () => void;
  canOpenPilot: boolean;
  onOpenPilot: () => void;
}) {
  const id = useIdentity(m.person);
  const parts = [
    { label: 'Kanıt yakınlığı', v: m.parts.evidence, w: WEIGHTS.evidence },
    { label: 'Bağlam uyumu', v: m.parts.context, w: WEIGHTS.context },
    { label: 'Kapasite', v: m.parts.capacity, w: WEIGHTS.capacity },
    { label: 'İş birliği geçmişi', v: m.parts.history, w: WEIGHTS.history },
  ];
  return (
    <li className={`card overflow-hidden ${open ? 'border-line-2' : ''}`}>
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-4 p-4 text-left hover:bg-sunken/50">
        <span className="num w-5 text-sm text-ink-3">{rank}</span>
        <Avatar person={m.person} size={40} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{id.name}</span>
          <span className="block truncate text-sm text-ink-3">{m.person.headline}</span>
        </span>
        <span className="hidden gap-1 sm:flex">
          {m.coverage.map((c) => (
            <span key={c.skill} title={`${skillLabel(c.skill)}: ${c.best ? c.best.level : 'kanıt yok'}`} className={c.best ? '' : 'opacity-25'}>
              <LevelGlyph level={c.best?.level ?? 'S1'} size={14} />
            </span>
          ))}
        </span>
        <ScoreDial value={m.score} size={48} />
        <span className={`text-ink-3 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <div className="rise border-t border-line bg-paper/60 p-5">
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {parts.map((p) => (
              <div key={p.label}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{p.label}</span>
                  <span className="num text-xs text-ink-3">
                    {Math.round(p.v * 100)} × {fmtW(p.w)} = {(p.v * p.w * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}
                  </span>
                </div>
                <Meter value={p.v} className="mt-1" />
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <p className="eyebrow">Eşleşti çünkü</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-snug">
                {m.reasons.map((r) => (
                  <li key={r} className="flex gap-2">
                    <StatusIcon kind="ok" className="text-s3" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow">Gereksinim bazında kanıt</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {m.coverage.map((c) => (
                  <li key={c.skill} className="flex items-center gap-2">
                    {c.best ? <LevelGlyph level={c.best.level} size={13} /> : <StatusIcon kind="fail" className="text-danger" />}
                    <span className="flex-1">{skillLabel(c.skill)}</span>
                    <span className="num text-xs text-ink-3">{c.verified ? `${c.verified} doğrulanmış` : c.count ? 'yalnız beyan' : 'kanıt yok'}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {m.gaps.length > 0 && (
            <p className="mt-4 rounded-lg border border-line bg-raised px-4 py-3 text-sm text-ink-2">
              <span className="font-semibold text-ink">Adaya giden geri bildirim:</span> “Bu ihtiyaca %{m.score} uyuyorsun. Eksik olan:{' '}
              {m.gaps.map((g) => skillLabel(g.skill)).join(', ')} alanında doğrulanmış üretim. En büyük kazanç {skillLabel([...m.gaps].sort((a, b) => b.gain - a.gain)[0].skill)} (
              <span className="num text-s3">+{Math.max(...m.gaps.map((g) => g.gain))}</span>).” Ret değil, yol haritası.
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <a href={`/profil/${m.person.handle}`} className="btn-line btn-sm">
              Kanıt Kartını aç
            </a>
            {canOpenPilot && (
              <button className="btn-primary btn-sm" onClick={onOpenPilot}>
                Bu adayla pilot aç
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function OpenPilot({ need, m, onDone }: { need: Need; m: Match; onDone: () => void }) {
  const id = useIdentity(m.person);
  const { revealed } = useView();
  const criteria = need.canvas.criteria.filter((c) => c.text.trim());
  return (
    <div>
      <p className="text-sm text-ink-2">
        <strong className="font-semibold text-ink">{id.name}</strong> ile pilot açılacak. Kanvastaki {criteria.length} başarı kriteri olduğu gibi kilometre taşına dönüşür. Hedef
        sonradan değiştirilemez; her taş iki tarafın onayıyla tamamlanır.
      </p>
      <ol className="mt-4 space-y-2">
        {criteria.map((c, i) => (
          <li key={c.id} className="flex gap-3 rounded-lg border border-line bg-paper px-3 py-2 text-sm">
            <span className="num text-xs text-ink-3">K{i + 1}</span>
            {c.text}
          </li>
        ))}
      </ol>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-quiet" onClick={onDone}>
          Vazgeç
        </button>
        <button
          className="btn-primary"
          onClick={() => {
            const pid = actions.openPilot(need.id, m.person.id);
            setView({ revealed: [...new Set([...revealed, m.person.id])] });
            location.href = `/pilotlar/${pid}`;
          }}
        >
          Pilotu aç ve defteri başlat
        </button>
      </div>
    </div>
  );
}
