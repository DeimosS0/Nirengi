import { useState } from 'react';
import { byId, lastActivity, SILENCE_DAYS, useAppState } from '../../lib/store.ts';
import { PILOT_STATUS } from '../../lib/labels.ts';
import { daysSince, relTime } from '../../lib/format.ts';
import { Avatar, Empty, Meter, OrgMark, PageHead, Stat } from '../ui/primitives.tsx';

export default function PilotsPage() {
  const s = useAppState();
  const [tab, setTab] = useState<'active' | 'closed'>('active');
  const list = s.pilots.filter((p) => (tab === 'active' ? p.status === 'active' : p.status !== 'active'));
  const closed = s.pilots.filter((p) => p.status !== 'active');
  const silentCount = s.pilots.filter((p) => p.status === 'active' && daysSince(lastActivity(p)) >= SILENCE_DAYS).length;
  const allMs = s.pilots.flatMap((p) => p.milestones);
  const approved = allMs.filter((m) => m.state === 'approved').length;

  return (
    <>
      <PageHead
        eyebrow="06 · Şeffaf iş birliği takibi"
        title={
          <>
            Pilot <em>Defteri</em>
          </>
        }
        lead="İki taraf da aynı sayılara bakar. Kilometre taşı iki taraf onaylamadan tamamlanmaz; her kayıt zaman damgalı ve zincirlidir. Sessizlik görünür, başarısızlık da gerekçesiyle kapanır."
      />
      <div className="wrap py-8">
        <div className="grid grid-cols-2 gap-6 rounded-xl border border-line bg-raised p-5 md:grid-cols-4">
          <Stat label="Aktif pilot" value={s.pilots.length - closed.length} />
          <Stat label="Gerekçesiyle kapanan" value={`${closed.length}/${closed.length}`} hint="sessizce terk edilen yok" />
          <Stat label="Çift onaylı taş" value={`${approved}/${allMs.length}`} />
          <Stat label="Sessiz pilot" value={silentCount} hint={`${SILENCE_DAYS}+ gün güncellemesiz`} />
        </div>

        <div className="mt-6 flex gap-1 border-b border-line">
          {(
            [
              ['active', 'Süren'],
              ['closed', 'Kapanan'],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium ${tab === k ? 'border-ink text-ink' : 'border-transparent text-ink-3 hover:text-ink'}`}
            >
              {l}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <div className="mt-6">
            <Empty title="Burada pilot yok">Bir ihtiyacın aday listesinden pilot açabilirsin.</Empty>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 lg:grid-cols-2">
            {list.map((p) => {
              const org = byId.org(s, p.orgId)!;
              const person = byId.person(s, p.personId)!;
              const ok = p.milestones.filter((m) => m.state === 'approved').length;
              const waiting = p.milestones.filter((m) => m.state === 'submitted').length;
              const silent = p.status === 'active' ? daysSince(lastActivity(p)) : 0;
              return (
                <li key={p.id}>
                  <a href={`/pilotlar/${p.id}`} className="card card-hover flex h-full flex-col p-5">
                    <div className="flex items-center gap-2 text-sm">
                      <OrgMark name={org.name} size={28} />
                      <span className="font-semibold">{org.name}</span>
                      <span className="text-ink-3">×</span>
                      <Avatar person={person} size={28} reveal />
                      <span className="font-semibold">{person.name}</span>
                    </div>
                    <h2 className="mt-4 text-[18px] font-semibold leading-snug">{p.title}</h2>
                    <div className="mt-4 flex items-center gap-3">
                      <Meter value={ok / Math.max(1, p.milestones.length)} tone={p.status === 'failed' ? 'warn' : 's3'} />
                      <span className="num shrink-0 text-sm">
                        {ok}/{p.milestones.length}
                      </span>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-xs">
                      <span
                        className={`rounded-md border px-2 py-0.5 font-mono ${
                          p.status === 'active' ? 'border-signal/40 text-signal' : p.status === 'succeeded' ? 'border-s3/40 text-s3' : 'border-line-2 text-ink-2'
                        }`}
                      >
                        {PILOT_STATUS[p.status]}
                      </span>
                      {waiting > 0 && <span className="rounded-md border border-warn/50 bg-warn/8 px-2 py-0.5 font-mono text-warn">{waiting} onay bekliyor</span>}
                      {silent >= SILENCE_DAYS && <span className="rounded-md bg-warn px-2 py-0.5 font-mono text-paper">{silent} gündür sessiz</span>}
                      <span className="ml-auto font-mono text-ink-3">{relTime(lastActivity(p))}</span>
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
