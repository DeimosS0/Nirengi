// İhtiyaçlar: the org's own needs as pressable rows; the publish gate is shown, not hidden.

import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { NeedStatus } from '../../lib/types.ts';
import { currentOrg, useAppState, useView } from '../../lib/store.ts';
import { PUBLISH_THRESHOLD } from '../../lib/engine/canvas.ts';
import { findConflicts } from '../../lib/engine/match.ts';
import { PILOT_STATUS } from '../../lib/labels.ts';
import { Bar, EmptyState, Ring, Why } from '../ui/kit';
import { PageHead } from '../ui/primitives';
import { FIT_MIN, gateNote, NeedPill, needStats, STATUS_RANK } from '../kurum/NeedBits';

type Tab = NeedStatus | 'all';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Hepsi' },
  { key: 'draft', label: 'Taslak' },
  { key: 'published', label: 'Yayında' },
  { key: 'piloting', label: 'Pilotta' },
];

/** Kept for the need detail screen, which still tints its status pill with it. */
export const statusTone = (st: NeedStatus) =>
  ({
    published: 'border-green/40 text-green-lip bg-green-tint',
    piloting: 'border-indigo/40 text-indigo bg-indigo-tint',
    closed: 'border-line-2 text-ink-3',
    draft: 'border-dashed border-line-2 text-ink-3',
  })[st];

export default function NeedsPage() {
  const s = useAppState();
  const view = useView();
  const org = currentOrg(s, view);
  const [tab, setTab] = useState<Tab>('all');
  const conflicts = useMemo(() => findConflicts(s.people), [s.people]);
  const rows = useMemo(
    () =>
      s.needs
        .filter((n) => n.orgId === org.id)
        .map((n) => ({ n, ...needStats(s, n, conflicts), pilot: s.pilots.find((p) => p.needId === n.id) }))
        .sort((a, b) => STATUS_RANK[a.n.status] - STATUS_RANK[b.n.status] || Date.parse(b.n.createdAt) - Date.parse(a.n.createdAt)),
    [s, org.id, conflicts],
  );
  const list = rows.filter((r) => tab === 'all' || r.n.status === tab);
  const count = (k: Tab) => (k === 'all' ? rows.length : rows.filter((r) => r.n.status === k).length);

  return (
    <div className="mx-auto max-w-[760px]">
      <PageHead title="İhtiyaçlar" lead={`${org.name} için yazılmış problemler. Net yazılan ihtiyaç, doğru adayı hızla bulur.`}>
        <a href="/ihtiyaclar/yeni" className="btn-primary">
          Yeni ihtiyaç
        </a>
      </PageHead>

      {rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="seg w-full sm:w-auto" role="group" aria-label="Duruma göre süz">
            {TABS.map((t) => (
              <button key={t.key} type="button" aria-pressed={tab === t.key} onClick={() => setTab(t.key)} className="flex-1 !px-2.5 sm:flex-none sm:!px-3.5">
                {t.label} <span className="num font-black opacity-70">{count(t.key)}</span>
              </button>
            ))}
          </div>
          <span className="text-[14px] font-bold text-ink-3">
            Halkadaki sayı çözülebilirlik.{' '}
            <Why title="Çözülebilirlik nedir?">
              <p className="text-[16px] font-bold text-ink-2">İhtiyacın ne kadar net yazıldığının 100 üzerinden puanıdır. Sorun, sayı, başarı kriteri ve karar verici gibi on maddeden toplanır.</p>
              <p className="mt-3 text-[15px] font-semibold text-ink-3">
                Yayın kapısı {PUBLISH_THRESHOLD} puandır ve ölçüsü, kriteri ya da karar vericisi olmayan ihtiyaç puanı yetse bile yayına çıkmaz. Uygun aday, uyum puanı %{FIT_MIN} ve üstü olan kişidir; kimlikler ilk temasa kadar gizli kalır.
              </p>
            </Why>
          </span>
        </div>
      )}

      {list.length === 0 ? (
        <div className="mt-6">
          {rows.length === 0 ? (
            <EmptyState
              title="Henüz bir ihtiyacın yok"
              action={
                <a href="/ihtiyaclar/yeni" className="btn-primary">
                  Yeni ihtiyaç yaz
                </a>
              }
            >
              İhtiyaç, kurumunun çözmek istediği tek bir problemdir: sayıyla ölçülür ve küçük bir pilotla denenir.
            </EmptyState>
          ) : (
            <EmptyState title="Bu durumda ihtiyaç yok" mood="idle">
              Başka bir sekmeye bak ya da yeni bir ihtiyaç yaz.
            </EmptyState>
          )}
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {list.map((r, i) => {
            const note = r.n.status === 'draft' ? gateNote(r.a) : null;
            const ok = r.pilot?.milestones.filter((m) => m.state === 'approved').length ?? 0;
            return (
              <li key={r.n.id} className="rise" style={{ animationDelay: `${Math.min(i, 5) * 50}ms` }}>
                <a href={`/ihtiyaclar/${r.n.id}`} className="card-press flex items-center gap-4 p-4">
                  {(r.n.status === 'draft' || r.n.status === 'published') && (
                    <div className="flex w-[84px] shrink-0 flex-col items-center gap-1.5">
                      <Ring value={r.a.score} size={60} label="çözülebilirlik" tone={r.a.canPublish ? 'green' : 'indigo'} />
                      <span className="whitespace-nowrap text-[12px] font-extrabold leading-none text-ink-3">çözülebilirlik</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <NeedPill status={r.n.status} />
                      {note && <span className="text-[14px] font-extrabold text-ink-2">{note}</span>}
                    </div>
                    <h2 className="mt-1.5 line-clamp-2 text-[17px] font-extrabold leading-snug text-ink">{r.n.title}</h2>
                    <p className="mt-1 line-clamp-2 text-[14px] font-bold leading-snug text-ink-3">{r.n.canvas.pain || 'Sorun henüz yazılmadı.'}</p>
                    <p className="mt-2 text-[14px] font-bold text-ink-2">
                      {r.n.status === 'published' &&
                        (r.fits ? (
                          <>
                            <b className="num text-green-lip">{r.fits}</b> uygun aday · en iyi uyum %{r.best}
                          </>
                        ) : (
                          'Henüz uygun aday yok'
                        ))}
                      {(r.n.status === 'piloting' || r.n.status === 'closed') && r.pilot && PILOT_STATUS[r.pilot.status]}
                      {r.n.status === 'draft' && !note && 'Yayına hazır'}
                    </p>
                    {r.pilot && (r.n.status === 'piloting' || r.n.status === 'closed') && (
                      <div className="mt-2 flex items-center gap-3">
                        <Bar value={ok / Math.max(1, r.pilot.milestones.length)} tone="green" h={10} />
                        <span className="num shrink-0 text-[13px] font-black text-ink-2">
                          {ok}/{r.pilot.milestones.length} aşama
                        </span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-6 w-6 shrink-0 text-ink-3" strokeWidth={3} aria-hidden="true" />
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
