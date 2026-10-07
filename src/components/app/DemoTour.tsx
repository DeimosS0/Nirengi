import { useEffect, useMemo, useState } from 'react';
import { actions, useAppState } from '../../lib/store.ts';
import { StatusIcon } from '../ui/primitives.tsx';

const OPEN_KEY = 'nirengi:tour-open';

/**
 * Stage companion for the 5-minute demo. Each step completes from real state
 * changes, so the checklist doubles as proof that the loop actually closed.
 */
export default function DemoTour() {
  const s = useAppState();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      setOpen(sessionStorage.getItem(OPEN_KEY) === '1');
    } catch {
      /* ignore */
    }
  }, []);
  const toggle = (v: boolean) => {
    setOpen(v);
    try {
      sessionStorage.setItem(OPEN_KEY, v ? '1' : '0');
    } catch {
      /* ignore */
    }
  };
  // The nav menu opens the tour on small screens, where no edge tab is shown.
  useEffect(() => {
    const onOpen = () => toggle(true);
    window.addEventListener('nirengi:tour', onOpen);
    return () => window.removeEventListener('nirengi:tour', onOpen);
  }, []);

  const steps = useMemo(() => {
    const seeded = Date.parse(s.seededAt);
    const demoNeed = s.needs.find((n) => n.createdInDemo && n.status !== 'draft');
    const newPilot = s.pilots.find((p) => Date.parse(p.startedAt) > seeded);
    const approvedAfter = s.pilots.find((p) => p.milestones.some((m) => m.approvals.org && Date.parse(m.approvals.org) > seeded));
    const target = approvedAfter ?? newPilot ?? s.pilots.find((p) => p.id === 'pl-rota');
    const targetPerson = s.people.find((p) => p.id === target?.personId);
    const needHref = demoNeed ? `/ihtiyaclar/${demoNeed.id}` : '/ihtiyaclar/n-otopark';
    return [
      {
        title: 'Kanıtını bağla',
        hint: 'GitHub hesabını bio sınamasıyla, alan adını DNS TXT ile doğrula.',
        href: '/kanit-bagla',
        done: s.people.some((p) => p.isDemoUser),
      },
      {
        title: 'Şikâyeti İhtiyaç Kanvası’na dök',
        hint: 'Serbest metinden taslak, çözülebilirlik skoru ve yayın eşiği.',
        href: '/ihtiyaclar/yeni',
        done: Boolean(demoNeed),
      },
      {
        title: 'Açıklanabilir eşleşmeyi incele',
        hint: 'Skorun dört bileşeni, gerekçesi ve eksik kanıt.',
        href: needHref,
        done: Boolean(s.demo.viewedMatchesFor),
      },
      {
        title: 'Pilotu aç',
        hint: 'Başarı kriterleri kilometre taşına dönüşür; hedef sonradan değişmez.',
        href: `${needHref}#adaylar`,
        done: Boolean(newPilot),
      },
      {
        title: 'Kilometre taşını çift onayla',
        hint: 'Yetenek rolünde teslim et, Kurum rolünde onayla.',
        href: target ? `/pilotlar/${target.id}` : '/pilotlar',
        done: Boolean(approvedAfter),
      },
      {
        title: 'Kanıtın profile düştüğünü gör',
        hint: 'Onay, profilde yeni bir S3 kanıtına dönüşür.',
        href: targetPerson ? `/profil/${targetPerson.handle}` : '/kesfet',
        done: Boolean(approvedAfter && s.demo.viewedProfileAfterApproval),
      },
    ];
  }, [s]);

  const done = steps.filter((x) => x.done).length;
  const next = steps.findIndex((x) => !x.done);

  if (!open)
    return (
      <button
        onClick={() => toggle(true)}
        aria-label="Demo turunu aç"
        className="no-print fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 items-center gap-2 rounded-l-[5px] border border-r-0 border-line-2 bg-raised px-1.5 py-3 text-[12.5px] font-semibold shadow-md [writing-mode:vertical-rl] hover:border-ink-3 sm:flex"
      >
        <span className="relative grid h-5 w-5 place-items-center">
          {done < steps.length && <span className="ping-soft absolute inset-0 rounded-full bg-signal/50" />}
          <span className="relative h-2.5 w-2.5 rounded-full bg-signal" />
        </span>
        <span>Demo turu</span>
        <span className="num text-ink-3">
          {done}/{steps.length}
        </span>
      </button>
    );

  return (
    <aside
      className="no-print rise fixed bottom-4 right-4 z-40 w-[min(360px,calc(100vw-2rem))] rounded-[8px] border border-line-2 bg-raised shadow-2xl"
      aria-label="Demo turu"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Demo turu · tek oturumda tam döngü</p>
          <p className="num text-xs text-ink-3">
            {done}/{steps.length} adım
          </p>
        </div>
        <button onClick={() => toggle(false)} className="btn-quiet btn-sm" aria-label="Turu küçült">
          <StatusIcon kind="fail" />
        </button>
      </div>
      <ol className="max-h-[60vh] overflow-auto px-2 py-2">
        {steps.map((st, i) => (
          <li key={st.title}>
            <a href={st.href} className={`flex gap-3 rounded-lg px-2 py-2.5 hover:bg-sunken ${i === next ? 'bg-sunken' : ''}`}>
              <span
                className={`num mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] ${
                  st.done ? 'bg-s3 text-white' : i === next ? 'bg-signal text-signal-ink' : 'border border-line-2 text-ink-3'
                }`}
              >
                {st.done ? <StatusIcon kind="ok" className="!h-3 !w-3" /> : i + 1}
              </span>
              <span>
                <span className={`block text-sm font-semibold ${st.done ? 'text-ink-3 line-through decoration-ink-3/40' : 'text-ink'}`}>
                  {st.title}
                </span>
                <span className="block text-xs leading-snug text-ink-3">{st.hint}</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
      <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
        <span className="text-xs text-ink-3">Veri bu tarayıcıda tutulur.</span>
        <button
          className="btn-quiet btn-sm text-danger"
          onClick={() => {
            if (confirm('Demo verisi başlangıç hâline dönsün mü? Bağladığın kanıtlar da silinir.')) {
              actions.reset();
              location.href = '/';
            }
          }}
        >
          Sıfırla
        </button>
      </div>
    </aside>
  );
}
