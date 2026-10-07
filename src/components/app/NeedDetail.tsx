// İhtiyaç detayı: one header for both faces, then what each side came for.
// Kurum sees "Uyan adaylar" (score on the card, reasoning one tap below);
// genç sees "Senin uyumun" and the gaps that would close it.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Need, NeedStatus, Org, Pilot } from '../../lib/types.ts';
import { actions, byId, currentMe, setView, useAppState, useView } from '../../lib/store.ts';
import { assessCanvas, isCheckable, PUBLISH_THRESHOLD } from '../../lib/engine/canvas.ts';
import { composeTeam, findConflicts, rankCandidates, scoreMatch, similarNeeds, WEIGHTS, type Match } from '../../lib/engine/match.ts';
import { progress, type WeekState } from '../../lib/engine/progress.ts';
import { CONSTRAINT, PILOT_STATUS, SCALE, SECTOR } from '../../lib/labels.ts';
import { fmtDate } from '../../lib/format.ts';
import { skillLabel } from '../../lib/skills.ts';
import NiriSays from '../ui/NiriSays';
import { Bar, celebrate, EmptyState, feedback, Head, Ring, Sheet, Why } from '../ui/kit';
import { CheckCircle, Clipboard } from '../ui/icons';
import { LevelBadge, OrgMark, StatusIcon, useIdentity } from '../ui/primitives.tsx';
import { NEED_LABEL } from '../kurum/NeedBits';
import { calmTone, Consistency, EvidenceChips, IdName, PartBars, Who, WeekStrip } from './matchbits.tsx';

const STATUS_PILL: Record<NeedStatus, string> = {
  published: 'bg-green-tint text-green-lip',
  piloting: 'bg-indigo-tint text-indigo',
  closed: 'bg-bg-3 text-ink-3',
  draft: 'border-2 border-dashed border-line-2 bg-bg text-ink-2',
};

export default function NeedDetail({ id }: { id: string }) {
  const s = useAppState();
  const need = byId.need(s, id);
  if (!need)
    return (
      <div className="mx-auto max-w-[720px]">
        <EmptyState title="Bu ihtiyaç bulunamadı" action={<a className="btn-line" href="/ihtiyaclar">İhtiyaçlara dön</a>}>
          Bağlantı eski olabilir ya da demo verisi sıfırlanmış olabilir.
        </EmptyState>
      </div>
    );
  return <Detail need={need} />;
}

type Step = 'why' | 'confirm' | 'done';

function Detail({ need }: { need: Need }) {
  const s = useAppState();
  const { persona, revealed } = useView();
  const reduce = useReducedMotion();
  const isOrg = persona === 'org';
  const org = byId.org(s, need.orgId)!;
  const me = currentMe(s);
  const a = useMemo(() => assessCanvas(need.canvas, need.skills), [need]);
  const live = need.status === 'published' || need.status === 'piloting';
  const pilot = s.pilots.find((p) => p.needId === need.id);

  const [cardOpen, setCardOpen] = useState(false);
  const [memOpen, setMemOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('why');
  const [wasHidden, setWasHidden] = useState(false);

  const ranked = useMemo(
    () => (isOrg && live ? rankCandidates(s, need).filter((m) => m.coverage.some((c) => c.score > 0)).slice(0, 6) : []),
    [s, need, isOrg, live],
  );
  const weeks = useMemo(() => new Map(ranked.map((m) => [m.person.id, progress(s, m.person).history])), [ranked, s]);
  const team = useMemo(() => (isOrg && live ? composeTeam(s, need) : null), [s, need, isOrg, live]);
  const mine = useMemo(
    () => (!isOrg && live ? scoreMatch(me, need, org, s.pilots, findConflicts(s.people)) : null),
    [s, need, isOrg, live, me, org],
  );
  const memory = similarNeeds(s, need.skills, need.id);

  useEffect(() => {
    if (live && s.demo.viewedMatchesFor !== need.id) actions.flag({ viewedMatchesFor: need.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [need.id, live]);

  // Keep the last match around so the sheet can finish its exit animation.
  const current = ranked.find((m) => m.person.id === openId);
  const last = useRef<Match | undefined>(undefined);
  if (current) last.current = current;
  const shown = current ?? last.current;

  const openCandidate = (m: Match) => {
    setStep('why');
    setOpenId(m.person.id);
  };

  // First contact: the pilot opens at once, identity flips a beat later so the reveal is seen.
  const startPilot = (m: Match, hidden: boolean) => {
    setWasHidden(hidden);
    setStep('done');
    const pilotId = actions.openPilot(need.id, m.person.id);
    window.setTimeout(() => {
      setView({ revealed: [...new Set([...revealed, m.person.id])] });
      feedback({
        tone: 'good',
        title: hidden ? 'İsim açıldı' : 'Deneme projesi başladı',
        text: hidden ? `${m.person.name} ile ilk temas kuruldu.` : `${m.person.name} ile kayıt defteri açıldı.`,
      });
    }, reduce ? 100 : 600);
    window.setTimeout(() => {
      setOpenId(null);
      celebrate({
        title: 'Deneme projesi başladı',
        sub: `${m.person.name} ile ${need.canvas.criteria.filter((c) => c.text.trim()).length} aşama açıldı. Her aşama iki tarafın onayıyla tamamlanır.`,
        cta: 'Projeye git',
        href: `/pilotlar/${pilotId}`,
      });
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    }, reduce ? 700 : 2100);
  };

  const canPilot = isOrg && need.status === 'published';
  const myPilot = pilot && pilot.personId === me.id;

  return (
    <div className="mx-auto max-w-[720px]">
      <a href={isOrg ? '/ihtiyaclar' : '/bugun#ihtiyaclar'} className="inline-flex items-center gap-1 text-[14px] font-extrabold text-ink-3 transition-colors hover:text-indigo">
        <ChevronLeft className="h-4 w-4" strokeWidth={3} />
        {isOrg ? 'İhtiyaçlar' : 'Sana uyan ihtiyaçlar'}
      </a>

      <Header need={need} org={org} a={a} calm={isOrg} />

      {need.status === 'draft' && isOrg && (
        <div data-coach="need-taslak" className="mt-4 rounded-[18px] bg-bg-2 p-4 md:p-5">
          <p className="text-[17px] font-black text-ink">Bu ihtiyaç taslakta</p>
          <p className="mt-1 text-[15px] font-bold text-ink-2">
            {a.canPublish
              ? 'İhtiyaç kartı yayına hazır. Yayımlayınca uyan adaylar gerekçesiyle sıralanır.'
              : `Yayımlanmadan önce ${a.blockers.length + a.checks.filter((c) => !c.ok && !c.blocking).length} eksik kapanmalı. Eksiklerin listesi, netlik puanının yanındaki Neden? düğmesinde.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={`/ihtiyaclar/yeni?id=${need.id}`} className="btn-line btn-sm">
              Düzenle
            </a>
            <button
              className="btn-primary btn-sm"
              disabled={!a.canPublish}
              onClick={() => {
                actions.publishNeed(need.id);
                celebrate({ title: 'İhtiyaç yayında', sub: 'İhtiyaç kartı yayın eşiğini geçti. Uyan adaylar artık gerekçesiyle sıralanıyor.' });
              }}
            >
              Yayımla
            </button>
          </div>
        </div>
      )}

      {pilot && (isOrg || myPilot) && <PilotBanner pilot={pilot} mine={!!myPilot} />}

      <button type="button" data-coach="need-kart" onClick={() => setCardOpen(true)} className="card-press mt-4 flex w-full items-center gap-4 p-4 text-left">
        <Clipboard size={36} />
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-black text-ink">İhtiyaç kartı</span>
          <span className="block text-[14px] font-bold text-ink-3">Mevcut durum, hedef, başarı kriterleri, kısıtlar</span>
        </span>
        <ChevronRight className="h-6 w-6 shrink-0 text-ink-3" strokeWidth={3} />
      </button>

      {/* Genç: my fit */}
      {!isOrg && mine && <MyFit m={mine} org={org} />}
      {!isOrg && !live && (
        <div className="mt-6">
          <EmptyState title={need.status === 'draft' ? 'Bu ihtiyaç henüz yayında değil' : 'Bu ihtiyaç kapandı'}>
            {need.status === 'draft' ? 'Yayımlandığında uyum puanını burada göreceksin.' : 'Benzer yeni ihtiyaçlar için Bugün sayfasına dönebilirsin.'}
          </EmptyState>
        </div>
      )}

      {/* Kurum: ranked candidates */}
      {isOrg && live && (
        <section id="adaylar" className="mt-10 scroll-mt-6" aria-labelledby="adaylar-b">
          <h2 id="adaylar-b" className="sr-only">
            Uyan adaylar
          </h2>
          <Head
            title="Uyan adaylar"
            action={
              <Why title="Uyum nasıl hesaplanıyor?" label="Puan nasıl?">
                <p className="text-[15px] font-bold text-ink-2">Puan hiçbir yerde elle yazılmaz; her adayın doğrulanmış işlerinden bu sayfa açılırken hesaplanır. Dört parçası var:</p>
                <ul className="mt-4 space-y-3 text-[15px] font-bold text-ink-2">
                  <li>
                    <b className="num text-indigo">{WEIGHTS.evidence * 100} puan</b> Yaptığı işin uyumu: aranan yetkinliklerde doğrulanmış iş. Beyan düşük, doğrulanmış yüksek ağırlık taşır.
                  </li>
                  <li>
                    <b className="num text-indigo">{WEIGHTS.context * 100} puan</b> Sektör ve ölçek uyumu: aynı sektörde ya da benzer ölçekte doğrulanmış iş.
                  </li>
                  <li>
                    <b className="num text-indigo">{WEIGHTS.capacity * 100} puan</b> Ayırabileceği zaman: deneme projesine ne kadar vakit ayırabildiği.
                  </li>
                  <li>
                    <b className="num text-indigo">{WEIGHTS.history * 100} puan</b> Birlikte çalışma geçmişi: başarıyla kapanan deneme projeleri ve iki tarafça onaylanmış aşamalar.
                  </li>
                </ul>
                <p className="mt-4 text-[14px] font-bold text-ink-3">Sektör uyumunda ve çalışma geçmişinde kimse sıfırdan başlamaz; yeni biri bu yüzden cezalandırılmaz.</p>
                <a href="/yontem" className="btn-line btn-block mt-5">
                  Yöntemi oku
                </a>
              </Why>
            }
          />
          <p className="mt-2 text-[15px] font-bold text-ink-2">Bu ihtiyaca doğrulanmış işiyle uyan gençler; en uyumlu olan en üstte.</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] font-bold text-ink-3">
            Aranan yetkinlikler:
            {need.skills.map((k) => (
              <span key={k} className="chip">
                {skillLabel(k)}
              </span>
            ))}
          </p>

          {ranked.length > 0 ? (
            <>
              <NiriSays mood="point" point="down" size={72} className="mt-5">
                <p className="text-[15px] font-bold text-ink-2">Bir adaya dokun: puanın nereden geldiğini, yaptığı işi ve eksiklerini gör.</p>
              </NiriSays>
              <ol data-coach="need-adaylar" className="mt-4 space-y-3">
                {ranked.map((m, i) => (
                  <li key={m.person.id} data-coach={i === 0 ? 'need-aday' : undefined} className="rise" style={{ animationDelay: `${i * 40}ms` }}>
                    <CandidateCard m={m} rank={i + 1} hist={weeks.get(m.person.id)!} inPilot={pilot?.personId === m.person.id} onOpen={() => openCandidate(m)} />
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <div data-coach="need-adaylar" className="mt-5">
              <EmptyState
                title="Henüz uyan aday yok"
                action={
                  <a href={`/ihtiyaclar/yeni?id=${need.id}`} className="btn-line">
                    İhtiyaç kartını düzenle
                  </a>
                }
              >
                Aranan {need.skills.length} yetkinliğin hiçbirinde doğrulanmış işi olan kimse çıkmadı. İhtiyaç kartında yetkinlikleri azaltmak ya da deneme projesinin kapsamını küçültmek aday sayısını artırır.
              </EmptyState>
            </div>
          )}
        </section>
      )}

      {team && team.members.length > 1 && (
        <section className="card mt-6 p-5">
          <Head
            title="Birlikte daha güçlü"
            action={
              <Why title="Ekip nasıl kuruldu?">
                <p className="text-[15px] font-bold text-ink-2">Her adımda aranan yetkinliklerden en çok yeni alan kapatan kişi eklenir. Böylece bir kişinin boş bıraktığı yeri diğeri doldurur.</p>
                <ul className="mt-5 space-y-4">
                  {team.coverage.map((c) => (
                    <li key={c.skill}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[16px] font-black text-ink">{skillLabel(c.skill)}</span>
                        <span className="truncate text-[14px] font-bold text-ink-3">{c.by ? <IdName person={c.by} /> : 'kapsanmıyor'}</span>
                      </div>
                      <Bar value={c.score} tone={c.score >= 0.8 ? 'green' : 'indigo'} h={10} className="mt-1.5" />
                    </li>
                  ))}
                </ul>
              </Why>
            }
          />
          <div className="mt-4 flex items-center gap-4">
            <span className="flex shrink-0 -space-x-3">
              {team.members.map((p) => (
                <span key={p.id} className="rounded-full border-2 border-bg bg-bg">
                  <Who person={p} size={44} />
                </span>
              ))}
            </span>
            <p className="text-[15px] font-bold text-ink-2">
              {team.members.map((p, i) => (
                <span key={p.id}>
                  {i > 0 && ', '}
                  <b>
                    <IdName person={p} />
                  </b>
                </span>
              ))}{' '}
              birlikte aranan yetkinliklerin <b className="num text-green-lip">%{Math.round(team.total * 100)}</b> kadarını kapatıyor.
            </p>
          </div>
        </section>
      )}

      {isOrg && memory.length > 0 && (
        <button type="button" onClick={() => setMemOpen(true)} className="card-press mt-6 flex w-full items-center gap-4 p-4 text-left">
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-black text-ink">Benzer ihtiyaçlar nasıl sonuçlandı?</span>
            <span className="block text-[14px] font-bold text-ink-3">{memory.length} benzer ihtiyaç var</span>
          </span>
          <ChevronRight className="h-6 w-6 shrink-0 text-ink-3" strokeWidth={3} />
        </button>
      )}

      <p className="mt-6 text-[13px] font-bold text-ink-3">Kurumlar ve kişiler kurgusal demo verisidir.</p>

      <NeedCard open={cardOpen} onClose={() => setCardOpen(false)} need={need} />

      <Sheet open={memOpen} onClose={() => setMemOpen(false)} title="Benzer ihtiyaçlar">
        <ul className="space-y-3">
          {memory.map((x) => (
            <li key={x.need.id}>
              <a href={x.pilot ? `/pilotlar/${x.pilot.id}` : `/ihtiyaclar/${x.need.id}`} className="card-press block p-4">
                <span className="block text-[16px] font-black leading-snug text-ink">{x.need.title}</span>
                <span className="mt-1 block text-[14px] font-bold text-ink-3">
                  {x.org.name} · {x.pilot ? PILOT_STATUS[x.pilot.status] : NEED_LABEL[x.need.status]} · ortak: {x.overlap.map(skillLabel).join(', ')}
                </span>
                {x.pilot?.closure && <span className="mt-2 block text-[14px] font-bold text-ink-2">{x.pilot.closure.summary}</span>}
              </a>
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet open={!!current} onClose={() => setOpenId(null)} title={step === 'done' ? 'Deneme projesi başladı' : step === 'confirm' ? 'Deneme projesini başlat' : 'Neden bu uyum?'}>
        {shown && (
          <CandidateSheet
            m={shown}
            need={need}
            org={org}
            step={step}
            wasHidden={wasHidden}
            canPilot={canPilot}
            pilot={pilot?.personId === shown.person.id ? pilot : undefined}
            hist={weeks.get(shown.person.id)}
            onStep={setStep}
            onStart={startPilot}
          />
        )}
      </Sheet>
    </div>
  );
}

// ---------------------------------------------------------------- header

function Header({ need, org, a, calm }: { need: Need; org: Org; a: ReturnType<typeof assessCanvas>; calm: boolean }) {
  return (
    <section data-coach="need-baslik" className="card mt-3 p-5 md:p-6">
      <div className="flex items-center gap-3">
        <OrgMark name={org.name} size={44} />
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-extrabold leading-tight text-ink">{org.name}</p>
          <p className="text-[13px] font-bold leading-tight text-ink-3">
            {SECTOR[org.sector]} · {SCALE[org.scale]} · {org.city}
          </p>
        </div>
        <span className={`pill shrink-0 ${STATUS_PILL[need.status]}`}>{NEED_LABEL[need.status]}</span>
      </div>
      <h1 className="h-page mt-5">{need.title}</h1>
      <p className="lead mt-2">{need.canvas.pain}</p>
      <div className="mt-5 flex items-center gap-4 rounded-[16px] bg-bg-2 p-4">
        <Ring value={a.score} size={64} label="netlik puanı" tone={calm ? calmTone(a.score) : undefined} />
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-black text-ink">Netlik puanı</p>
          <p className="text-[14px] font-bold text-ink-3">
            {a.canPublish ? 'Yayımlanabilir' : 'Yayımlamak için daha net yazılmalı'}
            <span className="ml-1">
              <Why title="Netlik puanı nasıl hesaplandı?">
                <p className="text-[15px] font-bold text-ink-2">
                  Netlik puanı, ihtiyacın ne kadar net ve çözülebilir yazıldığını gösterir. İhtiyaç kartı on denetimden geçer, her birinin puanı var. {PUBLISH_THRESHOLD} ve üstü, engeli olmayan ihtiyaç yayımlanabilir. Şu an <b className="num">{a.score}</b>.
                </p>
                <ul className="mt-4 space-y-3">
                  {a.checks.map((c) => (
                    <li key={c.id} className="flex gap-2.5">
                      <StatusIcon kind={c.ok ? 'ok' : c.blocking ? 'fail' : 'warn'} className="mt-1" />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[15px] ${c.ok ? 'font-bold text-ink-2' : 'font-black text-ink'}`}>{c.label}</span>
                        {!c.ok && <span className="block text-[14px] font-bold text-ink-3">{c.fix}</span>}
                        {!c.ok && c.blocking && <span className="block text-[13px] font-extrabold text-red-lip">Yayını engelliyor</span>}
                      </span>
                      <span className="num shrink-0 text-[14px] font-extrabold text-ink-3">
                        {c.ok ? c.points : 0}/{c.points}
                      </span>
                    </li>
                  ))}
                </ul>
              </Why>
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

function PilotBanner({ pilot, mine }: { pilot: Pilot; mine: boolean }) {
  return (
    <a href={`/pilotlar/${pilot.id}`} className="card-press mt-4 flex items-center gap-4 p-4">
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-black text-ink">{mine ? 'Bu projede çalışıyorsun' : 'Deneme projesi açık'}</span>
        <span className="block truncate text-[14px] font-bold text-ink-3">
          {pilot.title} · {PILOT_STATUS[pilot.status]}
        </span>
      </span>
      <span className="btn-primary btn-sm shrink-0">Projeye git</span>
    </a>
  );
}

// ---------------------------------------------------------------- need card

function NeedCard({ open, onClose, need }: { open: boolean; onClose: () => void; need: Need }) {
  const c = need.canvas;
  const field = (label: string, body: ReactNode) => (
    <div className="border-t-2 border-line pt-4 first:border-0 first:pt-0">
      <p className="cap">{label}</p>
      <div className="mt-1 text-[15px] font-bold leading-relaxed text-ink-2">{body || <span className="text-red-lip">Boş</span>}</div>
    </div>
  );
  return (
    <Sheet open={open} onClose={onClose} title="İhtiyaç kartı">
      <div className="space-y-4">
        {field('Mevcut durum', c.current)}
        {field(
          'Sorun',
          <>
            {c.pain}
            {c.painMetric && <span className="mono mt-2 block text-[13px] text-ink">{c.painMetric}</span>}
          </>,
        )}
        {field('Beklenen sonuç', c.outcome)}
        {field(
          'Başarı kriterleri',
          <ol className="space-y-2">
            {c.criteria.map((k, i) => (
              <li key={k.id} className="flex gap-2.5">
                <span className="num pt-px text-[13px] font-black text-ink-3">K{i + 1}</span>
                <span className="min-w-0 flex-1">
                  {k.text}
                  <span className={`ml-2 text-[13px] font-extrabold ${isCheckable(k.text) ? 'text-green-lip' : 'text-red-lip'}`}>{isCheckable(k.text) ? 'ölçülebilir' : 'ölçülemez'}</span>
                </span>
              </li>
            ))}
          </ol>,
        )}
        {field(
          'Kısıtlar',
          c.constraints.length ? (
            <span className="flex flex-wrap gap-2">
              {c.constraints.map((k, i) => (
                <span key={i} className="chip">
                  <b>{CONSTRAINT[k.kind]}:</b> {k.text}
                </span>
              ))}
            </span>
          ) : null,
        )}
        {field('Karar verici', c.decisionMaker)}
        {field('Deneme projesinin kapsamı', c.scope)}
      </div>
      <p className="mt-6 text-[13px] font-bold text-ink-3">
        {need.status !== 'draft' && 'Deneme projesi başlayınca her kriter bir aşamaya dönüşür ve sonradan değiştirilemez. '}
        Yayın: {need.publishedAt ? fmtDate(need.publishedAt) : '—'} · Oluşturma: {fmtDate(need.createdAt)}
      </p>
    </Sheet>
  );
}

// ---------------------------------------------------------------- kurum: candidates

function CandidateCard({ m, rank, hist, inPilot, onOpen }: { m: Match; rank: number; hist: WeekState[]; inPilot: boolean; onOpen: () => void }) {
  const id = useIdentity(m.person);
  return (
    <button type="button" onClick={onOpen} className="card-press block w-full p-4 text-left sm:p-5" aria-label={`${id.name}, uyum ${m.score}. Neden bu uyum, gerekçeyi aç`}>
      <span className="flex items-center gap-3 sm:gap-4">
        <span className="num hidden w-5 text-[15px] font-black text-ink-3 sm:block">{rank}</span>
        <Who person={m.person} size={48} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-black text-ink">{id.name}</span>
          <span className="block truncate text-[14px] font-bold text-ink-3">{m.person.headline}</span>
          {(rank === 1 || inPilot) && (
            <span className={`pill mt-1.5 !py-0.5 ${inPilot ? 'bg-indigo-tint text-indigo' : 'bg-green-tint text-green-lip'}`}>{inPilot ? 'Denemede' : 'En uyumlu'}</span>
          )}
        </span>
        <Ring value={m.score} size={60} tone={calmTone(m.score)} />
      </span>
      <span className="mt-4 block">
        <EvidenceChips m={m} />
      </span>
      <span className="mt-3 flex items-center justify-between gap-3">
        <Consistency hist={hist} />
        <span className="flex shrink-0 items-center text-[14px] font-extrabold text-indigo">
          Neden?
          <ChevronRight className="h-4 w-4" strokeWidth={3} />
        </span>
      </span>
    </button>
  );
}

function CandidateSheet({
  m,
  need,
  org,
  step,
  wasHidden,
  canPilot,
  pilot,
  hist,
  onStep,
  onStart,
}: {
  m: Match;
  need: Need;
  org: Org;
  step: Step;
  wasHidden: boolean;
  canPilot: boolean;
  pilot?: Pilot;
  hist?: WeekState[];
  onStep: (s: Step) => void;
  onStart: (m: Match, hidden: boolean) => void;
}) {
  const id = useIdentity(m.person);
  const criteria = need.canvas.criteria.filter((c) => c.text.trim());

  if (step === 'done')
    return (
      <div className="flex flex-col items-center py-4 text-center">
        <Who person={m.person} size={96} />
        <p className="mt-4 text-[22px] font-black text-ink">{id.name}</p>
        <p className="mt-1 text-[15px] font-bold text-ink-3">
          {wasHidden && id.hidden ? 'Kayıt defteri açıldı. İsim birazdan görünecek…' : wasHidden ? 'İsim açıldı. Kayıt defteri başladı.' : 'Kayıt defteri başladı.'}
        </p>
      </div>
    );

  if (step === 'confirm')
    return (
      <div>
        <p className="text-[15px] font-bold text-ink-2">
          <b>{id.name}</b> ile deneme projesi açılacak. İhtiyaç kartındaki {criteria.length} başarı kriteri olduğu gibi aşamaya dönüşür. Hedef sonradan değiştirilemez; her aşama iki tarafın onayıyla tamamlanır.
        </p>
        <ol className="mt-4 space-y-2">
          {criteria.map((c, i) => (
            <li key={c.id} className="flex gap-3 rounded-[14px] bg-bg-2 px-3.5 py-2.5 text-[15px] font-bold text-ink-2">
              <span className="num text-[13px] font-black text-ink-3">K{i + 1}</span>
              {c.text}
            </li>
          ))}
        </ol>
        {id.hidden && <p className="mt-4 rounded-[14px] bg-indigo-tint px-4 py-3 text-[14px] font-bold text-ink-2">İsim şimdiye kadar gizliydi. Proje açılınca ilk temas kurulur ve ad görünür olur.</p>}
        <div className="mt-6 flex gap-3">
          <button type="button" className="btn-quiet" onClick={() => onStep('why')}>
            Geri
          </button>
          <button type="button" className="btn-primary flex-1" onClick={() => onStart(m, id.hidden)}>
            Deneme projesini başlat
          </button>
        </div>
      </div>
    );

  const gaps = [...m.gaps].sort((x, y) => y.gain - x.gain);
  return (
    <div>
      <div className="flex items-center gap-4">
        <Who person={m.person} size={56} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[18px] font-black text-ink">{id.name}</p>
          <p className="text-[14px] font-bold text-ink-3">{m.person.headline}</p>
        </div>
        <Ring value={m.score} size={72} tone={calmTone(m.score)} />
      </div>

      <p className="mt-5 text-[15px] font-bold text-ink-2">Uyum dört parçadan çıkar. Her parçanın ne ölçtüğü ve ne kadar puan getirdiği aşağıda.</p>
      <div className="mt-5">
        <PartBars m={m} org={org} calm />
      </div>

      {hist && (
        <>
          <h3 className="mt-7 text-[17px] font-black text-ink">Düzenlilik</h3>
          <div className="mt-2">
            <WeekStrip hist={hist} />
          </div>
          <p className="mt-2 text-[13px] font-bold text-ink-3">Puana girmez; üretimin ne kadar düzenli sürdüğünü gösterir. Sayılan şey commit değil, üretim yapılan haftadır.</p>
        </>
      )}

      <h3 className="mt-7 text-[17px] font-black text-ink">Arkasındaki işler</h3>
      <ul className="mt-3 space-y-3">
        {m.coverage.map((c) => (
          <li key={c.skill} className="flex items-start gap-3">
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-black text-ink">{skillLabel(c.skill)}</span>
              <span className="block text-[14px] font-bold text-ink-3">
                {c.best ? `${c.best.title.split(' — ')[0]} · ${c.verified ? `${c.verified} doğrulanmış` : 'yalnız beyan'}` : 'Kanıt yok'}
              </span>
            </span>
            {c.best ? <LevelBadge level={c.best.level} /> : <span className="pill bg-red-tint text-red-lip">Eksik</span>}
          </li>
        ))}
      </ul>

      {gaps.length > 0 && (
        <>
          <h3 className="mt-7 text-[17px] font-black text-ink">Eksikler</h3>
          <ul className="mt-3 space-y-2">
            {gaps.map((g) => (
              <li key={g.skill} className="flex items-center gap-3 rounded-[14px] bg-bg-2 px-3.5 py-2.5">
                <span className="min-w-0 flex-1 text-[15px] font-bold text-ink-2">
                  <b>Eksik: {skillLabel(g.skill)}</b> · {g.kind === 'claim' ? 'yalnız beyan var' : 'kanıt yok'}
                </span>
                {g.gain > 0 && <span className="num shrink-0 text-[14px] font-black text-green-lip">+{g.gain}</span>}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[13px] font-bold text-ink-3">Rakam, doğrulanmış bir iş eklenirse uyuma gelecek puan. Aday bu eksikleri kendi ekranında yol haritası olarak görür; ret değildir.</p>
        </>
      )}

      <h3 className="mt-7 text-[17px] font-black text-ink">Nasıl kontrol edersin?</h3>
      <p className="mt-1 text-[15px] font-bold text-ink-3">Kanıt kartında her işin kaynağı, doğrulayıcısı ve tarihi açıkça yazılı.</p>

      <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 space-y-2.5 border-t-2 border-line bg-bg px-6 pb-5 pt-4">
        {canPilot && (
          <button type="button" className="btn-primary btn-block" onClick={() => onStep('confirm')}>
            Projeye davet et
          </button>
        )}
        {pilot && (
          <a href={`/pilotlar/${pilot.id}`} className="btn-primary btn-block">
            Projeye git
          </a>
        )}
        <a href={`/profil/${m.person.handle}`} className="btn-line btn-block">
          Kanıt kartını aç
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- genç: my fit

function MyFit({ m, org }: { m: Match; org: Org }) {
  const gaps = [...m.gaps].sort((x, y) => y.gain - x.gain);
  const [head, sub] =
    m.score >= 75
      ? ['Çok yakınsın', 'Doğrulanmış işin bu ihtiyacın büyük kısmını karşılıyor.']
      : m.score >= 55
        ? ['Yakınsın', 'Birkaç doğrulanmış iş daha seni ilk sıralara taşır.']
        : ['Yolun var, ama kısa', 'Eksik alanlara doğrulanmış iş ekleyerek hızla yaklaşabilirsin.'];
  return (
    <>
      <section className="card mt-6 p-5 md:p-6" aria-labelledby="uyum">
        <h2 id="uyum" className="h-sec">
          Senin uyumun
        </h2>
        <div className="mt-5 flex items-center gap-5">
          <Ring value={m.score} size={112} />
          <div className="min-w-0 flex-1">
            <p className="text-[22px] font-black leading-tight text-ink">{head}</p>
            <p className="mt-1 text-[15px] font-bold text-ink-3">{sub}</p>
            <p className="mt-1">
              <Why title="Puanın nasıl hesaplandı?">
                <p className="text-[15px] font-bold text-ink-2">
                  Puan senin kanıtından bu sayfa açılırken hesaplanır; kimse elle yazmaz. Dört parçası var: kanıt {WEIGHTS.evidence * 100}, bağlam {WEIGHTS.context * 100}, kapasite {WEIGHTS.capacity * 100}, iş birliği geçmişi{' '}
                  {WEIGHTS.history * 100} puan. Bağlam ve geçmişte kimse sıfırdan başlamaz.
                </p>
                <a href="/yontem" className="btn-line btn-block mt-5">
                  Yöntemi oku
                </a>
              </Why>
            </p>
          </div>
        </div>
        <div className="mt-6 border-t-2 border-line pt-6">
          <PartBars m={m} org={org} you />
        </div>
      </section>

      <section className="mt-8" aria-labelledby="eksik">
        <h2 id="eksik" className="h-sec">
          Seni yaklaştıracak adımlar
        </h2>
        {gaps.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {gaps.map((g) => (
              <li key={g.skill}>
                <a href="/kanit-bagla" className="card-press flex items-center gap-4 p-4">
                  <span className="num grid h-12 w-12 shrink-0 place-items-center rounded-full bg-green-tint text-[16px] font-black text-green-lip">+{g.gain}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-black text-ink">{skillLabel(g.skill)} alanında doğrulanmış bir iş ekle</span>
                    <span className="block text-[14px] font-bold text-ink-3">{g.kind === 'claim' ? 'Şu an yalnız beyanın var' : 'Henüz kanıtın yok'}</span>
                  </span>
                  <ChevronRight className="h-6 w-6 shrink-0 text-ink-3" strokeWidth={3} />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 flex items-center gap-3 rounded-[16px] bg-green-tint p-4 text-[15px] font-bold text-ink-2">
            <CheckCircle size={32} />
            Aranan her yetkinlikte doğrulanmış işin var. Kapasiteni ve düzenli üretimini koruman yeter.
          </p>
        )}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <a href="/kanit-bagla" className="btn-primary btn-lg">
            Kanıt ekle
          </a>
          <a href="/gorevler" className="btn-line btn-lg">
            Gelişim görevleri
          </a>
        </div>
        <p className="mt-3 text-[13px] font-bold text-ink-3">Başvuru yok: kurum seni kanıtından bulur. Puanlar her kanıt eklediğinde yeniden hesaplanır.</p>
      </section>
    </>
  );
}
