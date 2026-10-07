// A real explainable match: the top need for the demo person, scored by the
// same engine the app uses, with the four parts that make the number.

import { currentMe, useAppState } from '../../lib/store.ts';
import { needsForPerson, WEIGHTS } from '../../lib/engine/match.ts';
import { Bar, Ring, Why } from '../ui/kit';

const PARTS = [
  { key: 'evidence', name: 'Kanıt', note: 'Doğrulanmış işin, ihtiyacın istediği alanlara ne kadar yakın.' },
  { key: 'context', name: 'Bağlam', note: 'Aynı sektörde ya da ölçekte doğrulanmış iş.' },
  { key: 'capacity', name: 'Zaman', note: 'Pilota ne kadar vakit ayırabiliyor.' },
  { key: 'history', name: 'Geçmiş', note: 'Daha önce kapanan pilotlar ve çift onaylı aşamalar.' },
] as const;

export default function LiveMatch() {
  const s = useAppState();
  const m = needsForPerson(s, currentMe(s))[0];
  if (!m) return null;
  const org = s.orgs.find((o) => o.id === m.need.orgId)!;
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center gap-4">
        <Ring value={m.score} size={72} />
        <div className="min-w-0">
          <p className="text-[17px] font-black leading-snug text-ink">{m.need.title}</p>
          <p className="mt-0.5 text-[14px] font-bold text-ink-3">{org.name} · kurgusal</p>
        </div>
      </div>
      <ul className="mt-5 space-y-3">
        {PARTS.map((p) => (
          <li key={p.key} className="flex items-center gap-3">
            <span className="w-[68px] shrink-0 text-[14px] font-extrabold text-ink-2">{p.name}</span>
            <Bar value={m.parts[p.key]} tone="indigo" h={14} />
            <span className="num w-10 shrink-0 text-right text-[13px] font-extrabold text-ink-3">%{Math.round(WEIGHTS[p.key] * 100)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between gap-3 border-t-2 border-line pt-3">
        <span className="text-[13px] font-bold text-ink-3">Canlı: motor şu an hesapladı.</span>
        <Why title="Bu puan nasıl çıktı?">
          <p className="text-[15px] font-bold text-ink-2">
            Puan 0–100 arasıdır ve hep aynı dört parçadan toplanır. Sağdaki yüzde, parçanın puandaki payıdır; çubuk ise bu kişinin o parçadaki doluluğudur.
          </p>
          <ul className="mt-4 space-y-3">
            {PARTS.map((p) => (
              <li key={p.key}>
                <p className="text-[15px] font-black text-ink">
                  {p.name} <span className="num text-ink-3">· {Math.round(m.parts[p.key] * 100)}/100</span>
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
