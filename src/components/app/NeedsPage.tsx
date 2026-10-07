import { useMemo, useState } from 'react';
import type { NeedStatus } from '../../lib/types.ts';
import { byId, useAppState, useView } from '../../lib/store.ts';
import { assessCanvas } from '../../lib/engine/canvas.ts';
import { findConflicts, scoreMatch } from '../../lib/engine/match.ts';
import { NEED_STATUS, SCALE, SECTOR } from '../../lib/labels.ts';
import { relTime } from '../../lib/format.ts';
import { ROUND } from '../../lib/seed.ts';
import { skillLabel } from '../../lib/skills.ts';
import { Empty, Meter, OrgMark, PageHead, ScoreDial } from '../ui/primitives.tsx';

const TABS: { key: NeedStatus | 'all'; label: string }[] = [
  { key: 'published', label: 'Yayında' },
  { key: 'piloting', label: 'Pilotta' },
  { key: 'closed', label: 'Kapandı' },
  { key: 'draft', label: 'Taslak' },
  { key: 'all', label: 'Tümü' },
];

export const statusTone = (st: NeedStatus) =>
  ({
    published: 'border-s2/40 text-s2 bg-s2/8',
    piloting: 'border-signal/40 text-signal bg-signal/8',
    closed: 'border-line-2 text-ink-3',
    draft: 'border-dashed border-line-2 text-ink-3',
  })[st];

export default function NeedsPage() {
  const s = useAppState();
  const { persona } = useView();
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('published');
  const me = s.people.find((p) => p.isDemoUser);
  const conflicts = useMemo(() => findConflicts(s.people), [s.people]);

  const list = s.needs.filter((n) => tab === 'all' || n.status === tab);
  const roundNeeds = s.needs.filter((n) => n.round === ROUND && n.status !== 'draft');
  const roundOrgs = new Set(roundNeeds.map((n) => n.orgId)).size;

  return (
    <>
      <PageHead
        eyebrow="05 · İhtiyaçların net tanımı"
        title={
          <>
            Ölçülemeyen ihtiyaç <em>yayımlanmaz.</em>
          </>
        }
        lead="Her ihtiyaç yedi alanlı kanvastan geçer ve kendini puanlar. Eşiğin altında kalan, acısı ölçülmemiş ya da karar vericisi olmayan ihtiyaç yayına çıkamaz."
      >
        <a href="/ihtiyaclar/yeni" className="btn-primary">
          İhtiyaç yaz
        </a>
      </PageHead>

      <div className="wrap py-8">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-line bg-raised px-5 py-4">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-s3" />
            <span className="font-semibold">İhtiyaç turu {ROUND}</span>
            <span className="text-sm text-ink-3">açık</span>
          </span>
          <span className="num text-sm text-ink-2">
            {roundOrgs} kurum · {roundNeeds.length} ihtiyaç
          </span>
          <span className="text-sm text-ink-3">Kurumlar ihtiyaçlarını çeyreklik turlarla yayımlar; ağın öngörülebilir bir nabzı olur.</span>
        </div>

        <div className="mt-6 flex flex-wrap gap-1 border-b border-line">
          {TABS.map((t) => {
            const n = t.key === 'all' ? s.needs.length : s.needs.filter((x) => x.status === t.key).length;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${tab === t.key ? 'border-ink text-ink' : 'border-transparent text-ink-3 hover:text-ink'}`}
              >
                {t.label} <span className="num text-ink-3">{n}</span>
              </button>
            );
          })}
        </div>

        {list.length === 0 ? (
          <div className="mt-6">
            <Empty title="Bu sekmede ihtiyaç yok" />
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 lg:grid-cols-2">
            {list.map((n, i) => {
              const org = byId.org(s, n.orgId)!;
              const a = assessCanvas(n.canvas, n.skills);
              const fit = me && persona === 'person' && n.status === 'published' ? scoreMatch(me, n, org, s.pilots, conflicts).score : null;
              return (
                <li key={n.id} className="rise" style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}>
                  <a href={`/ihtiyaclar/${n.id}`} className="card card-hover flex h-full flex-col p-5">
                    <div className="flex items-center gap-3">
                      <OrgMark name={org.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{org.name}</p>
                        <p className="truncate text-xs text-ink-3">
                          {SECTOR[org.sector]} · {SCALE[org.scale]} · {org.city}
                        </p>
                      </div>
                      <span className={`rounded-md border px-2 py-0.5 font-mono text-[11px] ${statusTone(n.status)}`}>{NEED_STATUS[n.status]}</span>
                    </div>
                    <h2 className="mt-4 text-[18px] font-semibold leading-snug">{n.title}</h2>
                    <p className="mt-2 text-sm text-ink-2">{n.canvas.painMetric || <span className="italic text-ink-3">Acı ölçülmemiş</span>}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {n.skills.map((k) => (
                        <span key={k} className="chip !text-[11px]">
                          {skillLabel(k)}
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto flex items-end gap-4 pt-5">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-ink-3">Çözülebilirlik</span>
                          <span className={`num ${a.canPublish ? 'text-ink' : 'text-danger'}`}>{a.score}/100</span>
                        </div>
                        <Meter value={a.score / 100} tone={a.canPublish ? 's3' : 'warn'} className="mt-1" />
                      </div>
                      {fit !== null && <ScoreDial value={fit} size={44} label="sana" />}
                      <span className="shrink-0 font-mono text-[11px] text-ink-3">{relTime(n.publishedAt ?? n.createdAt)}</span>
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
