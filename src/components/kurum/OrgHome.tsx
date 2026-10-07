// Kurum ana sayfası: "bugün beni ne bekliyor". One queue first, the quiet rest below.

import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Need, Pilot, State } from '../../lib/types.ts';
import { byId, currentOrg, lastActivity, setView, SILENCE_DAYS, useAppState, useView } from '../../lib/store.ts';
import { findConflicts } from '../../lib/engine/match.ts';
import { PUBLISH_THRESHOLD } from '../../lib/engine/canvas.ts';
import { SCALE, SECTOR } from '../../lib/labels.ts';
import { daysSince, relTime } from '../../lib/format.ts';
import { skillLabel } from '../../lib/skills.ts';
import Niri from '../ui/Niri';
import { Bar, feedback, Ring, Sheet, Why } from '../ui/kit';
import { Clipboard, Compass, Flag } from '../ui/icons';
import { Avatar, OrgMark } from '../ui/primitives';
import { FIT_MIN, gateNote, NeedPill, needStats, STATUS_RANK } from './NeedBits';

type Row = { n: Need } & ReturnType<typeof needStats>;

interface Todo {
  id: string;
  icon: ReactNode;
  tint: string;
  line: string;
  sub: string;
  /** Own line outside the clamp: the part that carries the urgency. */
  meta?: string;
  warn?: boolean;
  href: string;
  cta: string;
  onGo?: () => void;
}

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'İyi geceler' : h < 12 ? 'Günaydın' : h < 18 ? 'İyi günler' : 'İyi akşamlar';
}

// Which published needs the viewer already looked at, keyed by seed so a demo reset starts clean.
const SEEN_KEY = 'nirengi:kurum-seen';
const readSeen = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '{}');
  } catch {
    return {};
  }
};
const markSeen = (key: string, fits: number) => {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify({ ...readSeen(), [key]: fits }));
  } catch {
    /* private mode: the item simply stays in the queue */
  }
};

/** The action queue, most urgent first: approvals, new candidates, unfinished drafts, quiet pilots. */
function buildQueue(s: State, rows: Row[], pilots: Pilot[]): Todo[] {
  const out: Todo[] = [];
  const waiting = new Set<string>();

  pilots
    .flatMap((p) => p.milestones.filter((m) => m.state === 'submitted' && !m.approvals.org).map((m) => ({ p, m, at: m.approvals.person ?? p.startedAt })))
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
    .forEach(({ p, m, at }) => {
      waiting.add(p.id);
      const d = daysSince(at);
      out.push({
        id: `ms-${m.id}`,
        icon: <Flag size={30} />,
        tint: 'bg-indigo-tint',
        line: 'Teslim edilen bir aşama onayını bekliyor',
        sub: m.title,
        meta: d < 1 ? 'Bugün teslim edildi' : `${d} gündür bekliyor`,
        warn: d >= SILENCE_DAYS,
        href: `/pilotlar/${p.id}?adim=${m.id}`,
        cta: 'İncele',
      });
    });

  const seen = readSeen();
  rows
    .filter((r) => r.n.status === 'published' && r.fits > 0)
    .filter((r) => s.demo.viewedMatchesFor !== r.n.id && (seen[`${s.seededAt}|${r.n.id}`] ?? 0) < r.fits)
    .sort((a, b) => b.best - a.best)
    .forEach((r) =>
      out.push({
        id: `fit-${r.n.id}`,
        icon: <Compass size={30} />,
        tint: 'bg-cyan-tint',
        line: r.fits === 1 ? '1 uygun aday ihtiyacını bekliyor' : `${r.fits} uygun aday ihtiyacını bekliyor`,
        sub: r.n.title,
        meta: `En iyi uyum %${r.best}`,
        href: `/ihtiyaclar/${r.n.id}#adaylar`,
        cta: 'Adayları gör',
        onGo: () => markSeen(`${s.seededAt}|${r.n.id}`, r.fits),
      }),
    );

  rows
    .filter((r) => r.n.status === 'draft' && !r.a.canPublish)
    .sort((a, b) => b.a.score - a.a.score)
    .forEach((r) =>
      out.push({
        id: `draft-${r.n.id}`,
        icon: <Clipboard size={30} />,
        tint: 'bg-bg-3',
        line: 'Yarım kalan bir taslağın var',
        sub: r.n.title,
        meta: gateNote(r.a) ?? undefined,
        href: `/ihtiyaclar/yeni?id=${r.n.id}`,
        cta: 'Devam et',
      }),
    );

  // A pilot that already waits for approval is quiet because of this org; one line is enough.
  pilots
    .filter((p) => !waiting.has(p.id) && daysSince(lastActivity(p)) >= SILENCE_DAYS)
    .sort((a, b) => Date.parse(lastActivity(a)) - Date.parse(lastActivity(b)))
    .forEach((p) =>
      out.push({
        id: `quiet-${p.id}`,
        icon: <Flag size={30} />,
        tint: 'bg-bg-3',
        line: `Proje ${daysSince(lastActivity(p))} gündür sessiz`,
        sub: p.title,
        href: `/pilotlar/${p.id}`,
        cta: 'Projeye bak',
      }),
    );

  return out;
}

/** New verified evidence in the skills this org's open needs ask for; own pilots are left out. */
function radar(s: State, orgId: string, days: number) {
  const open = s.needs.filter((n) => n.orgId === orgId && (n.status === 'published' || n.status === 'piloting'));
  const wanted = new Set(open.flatMap((n) => n.skills));
  const own = new Set(s.pilots.filter((p) => p.orgId === orgId).map((p) => p.id));
  const hits = s.people
    .flatMap((p) => p.evidence)
    .filter((e) => e.level !== 'S1' && e.verifiedAt && daysSince(e.verifiedAt) < days && !(e.pilotId && own.has(e.pilotId)) && e.skills.some((k) => wanted.has(k)));
  const bySkill = [...wanted]
    .map((k) => ({ k, n: hits.filter((e) => e.skills.includes(k)).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);
  return { open: open.length, total: hits.length, bySkill };
}

export default function OrgHome() {
  const s = useAppState();
  const view = useView();
  const org = currentOrg(s, view);
  const conflicts = useMemo(() => findConflicts(s.people), [s.people]);
  const rows = useMemo(
    () =>
      s.needs
        .filter((n) => n.orgId === org.id)
        .map((n) => ({ n, ...needStats(s, n, conflicts) }))
        .sort((a, b) => STATUS_RANK[a.n.status] - STATUS_RANK[b.n.status] || Date.parse(b.n.createdAt) - Date.parse(a.n.createdAt)),
    [s, org.id, conflicts],
  );
  const pilots = s.pilots.filter((p) => p.orgId === org.id && p.status === 'active');
  // Needs already in a pilot live under "Süren projeler"; the full list is on /ihtiyaclar.
  const open = rows.filter((r) => r.n.status === 'draft' || r.n.status === 'published');
  const queue = buildQueue(s, rows, pilots);
  const week = radar(s, org.id, 7);
  const month = week.total ? week : radar(s, org.id, 30);
  const [all, setAll] = useState(false);
  const [pick, setPick] = useState(false);
  const shown = all ? queue : queue.slice(0, 4);

  return (
    <div className="mx-auto max-w-[1040px]">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-[1_1_260px] items-center gap-4">
          <OrgMark name={org.name} size={56} />
          <div className="min-w-0">
            <h1 className="h-page">
              {greeting()}, {org.name}
            </h1>
            <p className="mt-1 text-[15px] font-bold text-ink-3">
              {queue.length ? `Seni bekleyen ${queue.length} iş var.` : 'Şu an seni bekleyen bir iş yok.'} Bekleyen işler, ihtiyaçlar ve süren projeler burada tek yerde.
            </p>
          </div>
        </div>
        <button type="button" onClick={() => setPick(true)} className="chip transition-colors hover:border-indigo/40 hover:text-indigo">
          Kurumu değiştir
          <ChevronDown className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
        </button>
      </header>

      <section data-coach="sira" className="card mt-6 p-4 sm:p-5 !border-indigo/35" aria-labelledby="sirada">
        <div className="flex items-center justify-between gap-3">
          <h2 id="sirada" className="h-sec">
            Sırada ne var
          </h2>
          <Why title="Sıra nasıl belirleniyor?">
            <p className="text-[16px] font-bold text-ink-2">Liste her açılışta kurumunun durumundan yeniden kurulur. Sıra şöyledir:</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px] font-semibold text-ink-3">
              <li>Teslim edilmiş ama onayını beklediğin aşamalar. Karşı taraf seni bekliyor.</li>
              <li>Yayındaki ihtiyaçlarına yeni gelen, uyumu %{FIT_MIN} ve üstü adaylar. Baktığın ihtiyaç listeden düşer.</li>
              <li>Netlik puanı {PUBLISH_THRESHOLD}’in altında kaldığı için yayımlanamayan taslaklar.</li>
              <li>{SILENCE_DAYS} gün ve daha uzun süredir güncelleme gelmeyen projeler.</li>
            </ol>
          </Why>
        </div>

        {queue.length === 0 ? (
          <div className="flex flex-col items-center px-2 py-8 text-center">
            <Niri mood="happy" size={96} />
            <p className="mt-4 text-[20px] font-black text-ink">Her şey yolunda</p>
            <p className="mt-1 max-w-sm text-[15px] font-bold text-ink-3">Onay bekleyen, yanıt bekleyen ya da yarım kalmış bir iş yok. Çözmek istediğin yeni bir problemi yazarak başlayabilirsin.</p>
            <a href="/ihtiyaclar/yeni" className="btn-primary mt-5">
              Yeni ihtiyaç yaz
            </a>
          </div>
        ) : (
          <>
            <ul className="mt-2 divide-y-2 divide-line">
              {shown.map((t, i) => (
                <li key={t.id} className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-x-3 gap-y-3 py-4 sm:grid-cols-[48px_minmax(0,1fr)_auto]">
                  <span className={`grid h-11 w-11 place-items-center rounded-[14px] sm:h-12 sm:w-12 ${t.tint}`}>{t.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[16px] font-extrabold leading-snug text-ink">{t.line}</p>
                    <p className="mt-0.5 line-clamp-2 text-[14px] font-bold leading-snug text-ink-3">{t.sub}</p>
                    {t.meta && <p className={`mt-0.5 text-[14px] font-extrabold leading-snug ${t.warn ? 'text-red-lip' : 'text-ink-2'}`}>{t.meta}</p>}
                  </div>
                  <a href={t.href} onClick={t.onGo} className={`${i === 0 ? 'btn-primary' : 'btn-line'} btn-sm col-start-2 justify-self-start sm:col-start-3 sm:justify-self-end`}>
                    {t.cta}
                  </a>
                </li>
              ))}
            </ul>
            {queue.length > shown.length && (
              <button type="button" onClick={() => setAll(true)} className="btn-quiet btn-sm mt-1">
                {queue.length - shown.length} iş daha
              </button>
            )}
          </>
        )}
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <section aria-labelledby="ihtiyac">
          <div className="flex items-end justify-between gap-3">
            <h2 id="ihtiyac" className="h-sec">
              İhtiyaçların
            </h2>
            <span className="flex items-center gap-1">
              <Why title="Bu sayılar ne anlatıyor?">
                <p className="text-[16px] font-bold text-ink-2">Halkadaki sayı netlik puanıdır: ihtiyacın ne kadar net ve çözülebilir yazıldığını 100 üzerinden gösterir. {PUBLISH_THRESHOLD} ve üstü olunca ihtiyacı yayımlayabilirsin.</p>
                <p className="mt-3 text-[15px] font-semibold text-ink-3">
                  Uygun aday, uyum puanı %{FIT_MIN} ve üstü olan gençtir. Puan, gencin doğrulanmış işlerinin ihtiyacın istediği yetkinliklerle örtüşmesinden hesaplanır. Adaylar isimsiz görünür; isimleri ilk temasa kadar gizli kalır.
                </p>
              </Why>
              <a href="/ihtiyaclar" className="btn-quiet btn-sm">
                Hepsi
              </a>
            </span>
          </div>
          {open.length === 0 ? (
            <div className="card mt-3 flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="text-[15px] font-extrabold text-ink-2">Açık ihtiyacın yok</p>
              <a href="/ihtiyaclar/yeni" data-coach="ihtiyaclar-bos" className="btn-line btn-sm">
                Yeni ihtiyaç yaz
              </a>
            </div>
          ) : (
            <ul data-coach="ihtiyaclar-satir" className="mt-3 space-y-3">
              {open.slice(0, 4).map((r) => {
                const note = r.n.status === 'draft' ? gateNote(r.a) : null;
                return (
                  <li key={r.n.id}>
                    <a href={`/ihtiyaclar/${r.n.id}`} className="card-press flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                      <div className="flex w-[84px] shrink-0 flex-col items-center gap-1.5">
                        <Ring value={r.a.score} size={48} label="netlik puanı" tone={r.a.canPublish ? 'green' : 'indigo'} />
                        <span className="whitespace-nowrap text-[12px] font-extrabold leading-none text-ink-3">netlik puanı</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[16px] font-extrabold leading-snug text-ink">{r.n.title}</p>
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] font-bold text-ink-3">
                          <NeedPill status={r.n.status} />
                          {note ? (
                            <span className="text-ink-2">{note}</span>
                          ) : r.n.status === 'published' ? (
                            r.fits ? (
                              <span>
                                {r.fits} uygun aday · en iyi %{r.best}
                              </span>
                            ) : (
                              <span>Henüz uygun aday yok</span>
                            )
                          ) : null}
                        </p>
                      </div>
                      <ChevronRight className="h-6 w-6 shrink-0 text-ink-3" strokeWidth={3} aria-hidden="true" />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <div className="space-y-8">
          <section data-coach="projeler" aria-labelledby="projeler">
            <div className="flex items-end justify-between gap-3">
              <h2 id="projeler" className="h-sec">
                Süren projeler
              </h2>
              <a href="/pilotlar" className="btn-quiet btn-sm">
                Hepsi
              </a>
            </div>
            {pilots.length === 0 ? (
              <p className="card mt-3 p-4 text-[15px] font-bold text-ink-3">Henüz süren bir deneme projen yok. Bir ihtiyacın adaylarından birini projeye davet edince burada görünür.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {pilots.map((p) => {
                  const person = byId.person(s, p.personId);
                  const ok = p.milestones.filter((m) => m.state === 'approved').length;
                  const next = p.milestones.find((m) => m.state !== 'approved');
                  const waits = p.milestones.some((m) => m.state === 'submitted' && !m.approvals.org);
                  const quiet = daysSince(lastActivity(p));
                  return (
                    <li key={p.id}>
                      <a href={`/pilotlar/${p.id}`} className="card-press block p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[16px] font-extrabold leading-snug text-ink">{p.title}</p>
                          {waits && <span className="pill shrink-0 !py-0.5 bg-indigo-tint text-indigo">Onayını bekliyor</span>}
                        </div>
                        {person && (
                          <p className="mt-2 flex items-center gap-2 text-[14px] font-bold text-ink-3">
                            <Avatar person={person} size={24} reveal />
                            {person.name} ile
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-3">
                          <Bar value={ok / Math.max(1, p.milestones.length)} tone="green" h={12} />
                          <span className="num shrink-0 text-[14px] font-black text-ink-2">
                            {ok}/{p.milestones.length}
                          </span>
                        </div>
                        {next && <p className="mt-2 line-clamp-2 text-[14px] font-bold leading-snug text-ink-2">Sıradaki: {next.title}</p>}
                        <p className={`mt-1 text-[13px] font-extrabold ${quiet >= SILENCE_DAYS ? 'text-red-lip' : 'text-ink-3'}`}>
                          {quiet >= SILENCE_DAYS ? `${quiet} gündür sessiz` : `Son hareket ${relTime(lastActivity(p))}`}
                        </p>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="card p-5" aria-labelledby="ag">
            <div className="flex items-center justify-between gap-3">
              <h2 id="ag" className="h-sec">
                Bu hafta yeni gelenler
              </h2>
              <Why title="Bu sayı nasıl hesaplandı?">
                <p className="text-[16px] font-bold text-ink-2">
                  Son 7 günde “Doğrulandı” ya da “Kurum onaylı” düzeyine çıkan işler sayılır. Yalnız yayındaki ya da deneme projesindeki ihtiyaçlarının istediği yetkinliklerdeki işler dahildir.
                </p>
                <p className="mt-3 text-[15px] font-semibold text-ink-3">
                  Gencin yalnız kendi sözüyle yazdığı (Beyan) işler sayılmaz. Kendi deneme projelerinden doğan işler de sayılmaz, çünkü onları zaten sen onayladın. İsimler ilk temasa kadar gizli kalır; burada yalnız sayı görürsün.
                </p>
              </Why>
            </div>
            {week.open === 0 ? (
              <p className="mt-2 text-[15px] font-bold text-ink-3">Yayında ihtiyacın olunca ihtiyacına uyan yeni doğrulanmış işler burada özetlenir.</p>
            ) : week.total === 0 ? (
              <p className="mt-2 text-[15px] font-bold text-ink-3">
                Son 7 günde ihtiyaçlarının alanında yeni doğrulanmış iş yok.
                {month.total > 0 && <> Son 30 günde {month.total} tane geldi.</>}
              </p>
            ) : (
              <>
                <p className="mt-2 text-[15px] font-bold text-ink-2">
                  Son 7 günde ihtiyaçlarının alanında <b className="num text-green-lip">{week.total}</b> yeni doğrulanmış iş geldi.
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {week.bySkill.slice(0, 5).map((x) => (
                    <li key={x.k} className="chip">
                      {skillLabel(x.k)}
                      <span className="num font-black text-green-lip">{x.n}</span>
                    </li>
                  ))}
                </ul>
                <a href="/kesfet" className="btn-quiet btn-sm mt-3 !px-0">
                  Keşfet’e bak
                </a>
              </>
            )}
          </section>
        </div>
      </div>

      <Sheet open={pick} onClose={() => setPick(false)} title="Hangi kurum olarak bakıyorsun?">
        <p className="text-[15px] font-bold text-ink-3">Bunlar kurgusal demo kurumlardır; hangisini seçersen onun ihtiyaçlarını ve projelerini görürsün.</p>
        <div className="mt-5 space-y-3" role="radiogroup" aria-label="Kurum">
          {s.orgs.map((o) => {
            const on = o.id === org.id;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setView({ orgId: o.id });
                  setAll(false);
                  setPick(false);
                  feedback({ tone: 'info', title: `${o.name} olarak bakıyorsun`, text: 'Bu yalnız demo içindir.' });
                }}
                className={`card-press flex w-full items-center gap-4 p-3 text-left ${on ? '!border-indigo !bg-indigo-tint' : ''}`}
                style={on ? { boxShadow: '0 4px 0 rgb(var(--indigo) / 0.5)' } : undefined}
              >
                <OrgMark name={o.name} size={44} />
                <span className="min-w-0">
                  <span className={`block text-[16px] font-black ${on ? 'text-indigo' : 'text-ink'}`}>{o.name}</span>
                  <span className="block truncate text-[14px] font-bold text-ink-3">
                    {SECTOR[o.sector]} · {SCALE[o.scale]} · {o.city}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}
