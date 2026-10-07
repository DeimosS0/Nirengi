// A real explainable match drawn as a small map: the candidates the engine ranks
// for the top need are points, each linked to the need point by a line whose weight is
// its score. Candidates are blind (Aday · code), exactly as the kurum side sees them.

import { currentMe, useAppState } from '../../lib/store.ts';
import { needsForPerson, rankCandidates, WEIGHTS } from '../../lib/engine/match.ts';
import { blindCode } from '../../lib/format.ts';
import { Bar, Why } from '../ui/kit';
import { Tri } from '../ui/pafta';

const PARTS = [
  { key: 'evidence', name: 'Kanıt', note: 'Doğrulanmış işin, ihtiyacın istediği alanlara ne kadar yakın.' },
  { key: 'context', name: 'Bağlam', note: 'Aynı sektörde ya da ölçekte doğrulanmış iş.' },
  { key: 'capacity', name: 'Zaman', note: 'Deneme projesine ne kadar vakit ayırabiliyor.' },
  { key: 'history', name: 'Geçmiş', note: 'Daha önce kapanan deneme projeleri ve çift onaylı aşamalar.' },
] as const;

// Candidate slots on the map, in percent of the map box (the need sits at the right).
const SLOTS = [
  { x: 24, y: 52 },
  { x: 13, y: 15 },
  { x: 38, y: 79 },
  { x: 42, y: 19 },
];
const NEED = { x: 82, y: 48 };

export default function LiveMatch() {
  const s = useAppState();
  const top = needsForPerson(s, currentMe(s))[0];
  if (!top) return null;
  const need = top.need;
  const org = s.orgs.find((o) => o.id === need.orgId)!;
  const cands = rankCandidates(s, need).slice(0, SLOTS.length);
  const best = cands[0];
  if (!best) return null;
  return (
    <div>
      <p className="text-[17px] font-black leading-snug text-ink">{need.title}</p>
      <p className="mt-0.5 text-[14px] font-semibold text-ink-3">{org.name} · kurgusal</p>

      <div className="relative mt-4 h-[250px] sm:h-[270px]" role="img" aria-label={`${cands.length} aday noktası ihtiyaç noktasına, puanlarıyla orantılı çizgilerle bağlı`}>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {cands.map((c, i) => {
            const a = SLOTS[i];
            return (
              <line
                key={c.person.id}
                x1={a.x}
                y1={a.y}
                x2={NEED.x}
                y2={NEED.y}
                stroke="rgb(var(--indigo))"
                strokeOpacity={i === 0 ? 0.75 : 0.35}
                strokeWidth={1.5 + (c.score / 100) * 4}
                strokeDasharray={i === 0 ? undefined : '1 7'}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {cands.map((c, i) => {
          const a = SLOTS[i];
          const size = i === 0 ? 54 : 40;
          return (
            <div key={c.person.id} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${a.x}%`, top: `${a.y}%`, opacity: i === 0 ? 1 : 0.5 + 0.4 * (c.score / best.score) }}>
              <Tri size={size} tone="cyan" state="done" />
              <span className="mono mt-1.5 whitespace-nowrap rounded-[6px] bg-bg px-1 text-[12px] font-semibold text-ink-2">
                Aday {blindCode(c.person.id)}
              </span>
              <span className={`num rounded-[6px] bg-bg px-1 text-[13px] ${i === 0 ? 'font-black text-indigo' : 'font-bold text-ink-3'}`}>{c.score}</span>
            </div>
          );
        })}

        <div className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${NEED.x}%`, top: `${NEED.y}%` }}>
          <span className="relative">
            <svg viewBox="0 0 120 40" className="pointer-events-none absolute left-1/2 top-[84%] h-10 w-[120px] -translate-x-1/2 -translate-y-1/2 overflow-visible" aria-hidden="true">
              <ellipse className="ping-soft" cx="60" cy="20" rx="30" ry="10" fill="none" stroke="rgb(var(--indigo) / 0.55)" strokeWidth="2" />
              <ellipse className="ping-soft" style={{ animationDelay: '1.1s' }} cx="60" cy="20" rx="30" ry="10" fill="none" stroke="rgb(var(--indigo) / 0.4)" strokeWidth="2" />
            </svg>
            <Tri size={86} tone="indigo" state="done">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white">
                <span className="block h-3 w-3 rounded-full bg-orange" />
              </span>
            </Tri>
          </span>
          <span className="mt-2 rounded-[6px] bg-bg px-1 text-[14px] font-bold text-ink-2">İhtiyaç</span>
        </div>
      </div>

      <ul className="mt-4 space-y-3 border-t-2 border-line pt-4">
        {PARTS.map((p) => (
          <li key={p.key} className="flex items-center gap-3">
            <span className="w-[68px] shrink-0 text-[14px] font-extrabold text-ink-2">{p.name}</span>
            <Bar value={best.parts[p.key]} tone="indigo" h={14} />
            <span className="num w-10 shrink-0 text-right text-[13px] font-extrabold text-ink-3">%{Math.round(WEIGHTS[p.key] * 100)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-ink-3">Canlı: motor şu an hesapladı. En yakın aday {best.score}/100.</span>
        <Why title="Bu puan nasıl çıktı?">
          <p className="text-[15px] font-bold text-ink-2">
            Puan 0–100 arasıdır ve hep aynı dört parçadan toplanır. Sağdaki yüzde, parçanın puandaki payıdır; çubuk ise en yakın adayın o parçadaki doluluğudur. Haritada çizginin kalınlığı adayın puanıdır; adaylar isimsiz görünür, isim ilk temasa kadar açılmaz.
          </p>
          <ul className="mt-4 space-y-3">
            {PARTS.map((p) => (
              <li key={p.key}>
                <p className="text-[15px] font-black text-ink">
                  {p.name} <span className="num text-ink-3">· {Math.round(best.parts[p.key] * 100)}/100</span>
                </p>
                <p className="text-[14px] font-bold text-ink-3">{p.note}</p>
              </li>
            ))}
          </ul>
          <a href="/yontem#eslesme" className="btn-primary btn-block mt-5">
            Formülü gör
          </a>
        </Why>
      </div>
    </div>
  );
}
