// Guided demo for the jury: one track per side, ticked from real state where a
// flag exists and from the route otherwise. Opened by the layouts' tour button
// (`nirengi:tour` event) or the edge tab.

import { useEffect, useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { actions, useAppState, useView } from '../../lib/store.ts';
import Niri from '../ui/Niri';
import { Bar } from '../ui/kit';

const OPEN_KEY = 'nirengi:tour-open';
const SEEN_KEY = 'nirengi:tour-seen';

type Track = 'genc' | 'kurum';
interface TourStep {
  title: string;
  hint: string;
  href: string;
  done: boolean;
}

const readSeen = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]');
  } catch {
    return [];
  }
};

export default function DemoTour() {
  const s = useAppState();
  const { persona } = useView();
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<Track | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    try {
      setOpen(sessionStorage.getItem(OPEN_KEY) === '1');
    } catch {
      /* ignore */
    }
    // Remember which routes this browser has opened; a route without a state flag completes by being visited.
    const path = location.pathname.replace(/\/+$/, '') || '/';
    const all = readSeen();
    if (!all.includes(path)) {
      all.push(path);
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify(all));
      } catch {
        /* ignore */
      }
    }
    setSeen(all);
    const onStorage = (e: StorageEvent) => e.key === SEEN_KEY && setSeen(readSeen());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggle = (v: boolean) => {
    setOpen(v);
    try {
      sessionStorage.setItem(OPEN_KEY, v ? '1' : '0');
    } catch {
      /* ignore */
    }
  };
  // The menus open the tour on small screens, where no edge tab is shown.
  useEffect(() => {
    const onOpen = () => toggle(true);
    window.addEventListener('nirengi:tour', onOpen);
    return () => window.removeEventListener('nirengi:tour', onOpen);
  }, []);

  const tracks = useMemo<Record<Track, TourStep[]>>(() => {
    const visited = (prefix: string) => seen.some((p) => p === prefix || p.startsWith(`${prefix}/`));
    const seeded = Date.parse(s.seededAt);
    const demoNeed = s.needs.find((n) => n.createdInDemo && n.status !== 'draft');
    const newPilot = s.pilots.find((p) => Date.parse(p.startedAt) > seeded);
    const approvedAfter = s.pilots.find((p) => p.milestones.some((m) => m.approvals.org && Date.parse(m.approvals.org) > seeded));
    const target = approvedAfter ?? newPilot ?? s.pilots.find((p) => p.id === 'pl-rota');
    const targetPerson = s.people.find((p) => p.id === target?.personId);
    const needHref = demoNeed ? `/ihtiyaclar/${demoNeed.id}` : '/ihtiyaclar/n-otopark';
    return {
      genc: [
        { title: 'Haftana bak', hint: 'Hafta şeridi, seri ve sıradaki adım.', href: '/bugun', done: visited('/bugun') },
        { title: 'Görevlere göz at', hint: 'Haftalık, gelişim ve açık kaynak görevleri.', href: '/gorevler', done: visited('/gorevler') },
        { title: 'Ligde yerini gör', hint: 'Benzer seviyedekilerle haftalık XP sıralaması.', href: '/lig', done: visited('/lig') },
        { title: 'Topluluğa uğra', hint: 'Bir soru sor, bir paylaşıma destek ver.', href: '/topluluk', done: visited('/topluluk') },
        { title: 'Kanıtını bağla', hint: 'GitHub hesabını ya da alan adını gerçekten doğrula.', href: '/kanit-bagla', done: s.people.some((p) => p.isDemoUser) },
      ],
      kurum: [
        { title: 'Kurum ana sayfası', hint: 'Onay bekleyenler ve açık ihtiyaçlar.', href: '/kurum', done: visited('/kurum') },
        { title: 'İhtiyacı yaz, yayına al', hint: 'Şikâyetten taslak, çözülebilirlik puanı, yayın eşiği.', href: '/ihtiyaclar/yeni', done: Boolean(demoNeed) },
        { title: 'Adayın nedenine bak', hint: 'Puanın dört parçası ve eksik kanıt.', href: needHref, done: Boolean(s.demo.viewedMatchesFor) },
        { title: 'Pilot teklif et', hint: 'Başarı kriterleri aşamalara dönüşür.', href: `${needHref}#adaylar`, done: Boolean(newPilot) },
        { title: 'Aşamayı onayla', hint: 'Genç teslim eder, kurum onaylar; defter yazar.', href: target ? `/pilotlar/${target.id}` : '/pilotlar', done: Boolean(approvedAfter) },
        {
          title: 'Onay profile düştü',
          hint: 'Onaylı aşama gencin profilinde yeni bir kanıt.',
          href: targetPerson ? `/profil/${targetPerson.handle}` : '/kesfet',
          done: Boolean(approvedAfter && s.demo.viewedProfileAfterApproval),
        },
        { title: 'Herkese açık kartı gör', hint: 'Pilotun özeti, tek bir bağlantıyla paylaşılır.', href: target ? `/kart/${target.id}` : '/pilotlar', done: visited('/kart') },
      ],
    };
  }, [s, seen]);

  const track: Track = pick ?? (persona === 'org' ? 'kurum' : 'genc');
  const steps = tracks[track];
  const done = steps.filter((x) => x.done).length;
  const next = steps.findIndex((x) => !x.done);
  const finished = next < 0;
  const other: Track = track === 'genc' ? 'kurum' : 'genc';
  const total = tracks.genc.length + tracks.kurum.length;
  const doneAll = tracks.genc.filter((x) => x.done).length + tracks.kurum.filter((x) => x.done).length;

  const reset = () => {
    actions.reset();
    try {
      localStorage.removeItem(SEEN_KEY);
      sessionStorage.removeItem(OPEN_KEY);
    } catch {
      /* ignore */
    }
    location.href = '/';
  };

  if (!open)
    return (
      <button
        onClick={() => toggle(true)}
        aria-label="Demo turunu aç"
        className="no-print fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 items-center gap-2 rounded-l-[14px] border-2 border-r-0 border-line bg-bg px-2 py-3.5 text-[13px] font-black text-ink-2 shadow-[0_4px_0_rgb(var(--line))] transition-colors [writing-mode:vertical-rl] hover:bg-bg-2 sm:flex"
      >
        <span className="relative grid h-5 w-5 place-items-center">
          {doneAll < total && <span className="ping-soft absolute inset-0 rounded-full bg-indigo/40" />}
          <span className="relative h-3 w-3 rounded-full bg-indigo" />
        </span>
        <span>Demo turu</span>
        <span className="num text-ink-3">
          {doneAll}/{total}
        </span>
      </button>
    );

  return (
    <aside
      className="no-print rise fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+76px)] z-40 rounded-[22px] border-2 border-line bg-bg shadow-[0_14px_36px_-14px_rgb(0_0_0/0.35)] sm:inset-x-auto sm:right-4 sm:w-[380px] lg:bottom-4"
      aria-label="Demo turu"
    >
      <div className="flex items-center gap-3 px-4 pb-3 pt-3">
        <Niri mood={finished ? 'cheer' : 'think'} size={52} />
        <div className="min-w-0 flex-1">
          <p className="text-[18px] font-black leading-tight text-ink">Demo turu</p>
          <p className="num text-[14px] font-bold text-ink-3">
            {done}/{steps.length} adım
          </p>
        </div>
        <button onClick={() => toggle(false)} className="btn-quiet btn-sm !min-h-9 !px-2" aria-label="Turu küçült">
          <X className="h-5 w-5" strokeWidth={3} />
        </button>
      </div>
      <div className="px-4">
        <Bar value={done / steps.length} tone="green" h={14} />
        <div className="seg mt-3 flex w-full" role="group" aria-label="Tur">
          {(
            [
              ['genc', 'Genç'],
              ['kurum', 'Kurum'],
            ] as const
          ).map(([t, label]) => (
            <button key={t} type="button" aria-pressed={track === t} onClick={() => setPick(t)} className="flex-1">
              {label}
            </button>
          ))}
        </div>
      </div>
      <ol className="mt-2 max-h-[min(40dvh,380px)] overflow-y-auto px-2 pb-1">
        {steps.map((st, i) => (
          <li key={st.title}>
            <a
              href={st.href}
              className={`flex items-start gap-3 rounded-[14px] border-2 px-2.5 py-2 transition-colors ${
                i === next ? 'border-indigo/35 bg-indigo-tint' : 'border-transparent hover:bg-bg-2'
              }`}
            >
              <span
                className={`num mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px] font-black ${
                  st.done ? 'bg-green text-white' : i === next ? 'bg-indigo text-white' : 'border-2 border-line-2 text-ink-3'
                }`}
              >
                {st.done ? <Check className="h-4 w-4" strokeWidth={4} /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className={`block text-[15px] font-extrabold leading-snug ${st.done ? 'text-ink-3' : 'text-ink'}`}>{st.title}</span>
                <span className="block text-[13px] font-bold leading-snug text-ink-3">{st.hint}</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
      <div className="space-y-2 border-t-2 border-line p-3">
        {finished ? (
          <button type="button" className="btn-green btn-block" onClick={() => setPick(other)}>
            {other === 'kurum' ? 'Kurum turuna geç' : 'Genç turuna geç'}
          </button>
        ) : (
          <a href={steps[next].href} className="btn-primary btn-block">
            Sıradaki
          </a>
        )}
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-[12px] font-bold text-ink-3">Veri bu tarayıcıda tutulur.</span>
          {confirmReset ? (
            <span className="flex items-center gap-1">
              <button type="button" className="btn-quiet btn-sm !min-h-8 !text-red-lip" onClick={reset}>
                Evet, sıfırla
              </button>
              <button type="button" className="btn-quiet btn-sm !min-h-8 !text-ink-3" onClick={() => setConfirmReset(false)}>
                Vazgeç
              </button>
            </span>
          ) : (
            <button type="button" className="btn-quiet btn-sm !min-h-8 !text-ink-3" onClick={() => setConfirmReset(true)}>
              Sıfırla
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
