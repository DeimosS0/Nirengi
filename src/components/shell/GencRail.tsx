import { currentMe, useAppState } from '../../lib/store.ts';
import { league, progress, questsFor, TIERS, XP } from '../../lib/engine/progress.ts';
import { Bolt, Flame, Shield } from '../ui/icons';
import { TriMark } from '../ui/TriMark';

/** Right rail on wide screens: one sheet that says where you stand this week; `omit` drops what the page already shows. */
export default function GencRail({ omit }: { omit?: 'week' | 'route' }) {
  const s = useAppState();
  const me = currentMe(s);
  const p = progress(s, me);
  const l = league(s, me);
  const mine = l.rows.find((r) => r.personId === me.id);
  const weekly = questsFor(s, me).filter((q) => q.kind === 'haftalik');
  const left = Math.max(0, Math.ceil((l.endsAt - Date.now()) / 86_400_000));

  return (
    <div className="sticky top-6 space-y-4">
      <section className="card divide-y-2 divide-line" aria-label="Bu haftan">
        <a href="/lig" className="flex items-center gap-4 rounded-t-[18px] p-5 transition-colors hover:bg-bg-2">
          <Shield size={48} tier={l.tier} />
          <div className="min-w-0">
            <p className="h-sec">{l.name} Ligi</p>
            <p className="text-[15px] font-bold text-ink-3">
              {mine ? (
                <>
                  <span className={mine.zone === 'up' ? 'text-green-lip' : mine.zone === 'down' ? 'text-red-lip' : 'text-ink-2'}>{mine.rank}. sıradasın</span>
                  {' · '}
                  {left} gün kaldı
                </>
              ) : (
                'Bu hafta yarışa katıl'
              )}
            </p>
            {mine && mine.zone !== 'up' && l.tier < TIERS.length - 1 && (
              <p className="mt-1 text-[14px] font-bold text-ink-3">
                {TIERS[l.tier + 1]} için <span className="text-gold-ink">{Math.max(1, l.rows[4].xp - mine.xp + 1)} XP</span> daha
              </p>
            )}
          </div>
        </a>

        {omit !== 'week' && (
          <div className="space-y-3 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[15px] font-bold text-ink-2">
                <Flame size={24} className={p.met ? 'flame-live' : ''} dim={!p.met && !p.streak} />
                <b className="num text-orange-ink">{p.streak}</b> haftalık seri
              </span>
              <span className="flex items-center gap-1.5 text-[15px] font-bold text-ink-2">
                <Bolt size={22} />
                <b className="num text-gold-ink">{p.xpWeek}</b> XP
              </span>
            </div>
            <ol className="flex justify-between" aria-label={p.rest ? 'Bu hafta moladasın' : `${p.active}/${p.goal} gün üretim`}>
              {p.days.map((d) => (
                <li key={d.key}>
                  <TriMark size={24} color={d.active ? 'orange' : d.future ? 'line' : 'line-2'} variant={d.active ? 'filled' : d.today ? 'dashed' : 'outline'} lip={false} />
                </li>
              ))}
            </ol>
            <p className="text-[14px] font-bold text-ink-3">
              {p.rest ? 'Bu hafta moladasın; serin bekliyor.' : p.met ? 'Bu haftanın hedefi tamam.' : `Hedefe ${p.goal - p.active} gün kaldı.`}
            </p>
          </div>
        )}

        {omit !== 'route' && (
          <div className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[16px] font-bold text-ink">Bu haftanın rotası</p>
              <a href="/gorevler" className="text-[14px] font-bold text-indigo hover:underline">
                Tümü
              </a>
            </div>
            <ul className="mt-3 space-y-2.5">
              {weekly.map((q) => (
                <li key={q.id} className="flex items-center gap-3">
                  <TriMark size={20} color={q.complete ? 'green' : 'line-2'} variant={q.complete ? 'filled' : 'outline'} lip={false} />
                  <span className={`min-w-0 flex-1 text-[14px] font-bold leading-snug ${q.complete ? 'text-ink-3' : 'text-ink-2'}`}>{q.title}</span>
                  <span className="num shrink-0 text-[13px] font-bold text-ink-3">
                    {q.done}/{q.of}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <p className="px-2 text-[13px] font-bold leading-relaxed text-ink-3">
        XP yalnız doğrulanabilir olaylardan gelir; günde en fazla {XP.dailyCap}.{' '}
        <a className="font-extrabold text-indigo hover:underline" href="/yontem#ilerleme">
          Nasıl hesaplanıyor?
        </a>
      </p>
    </div>
  );
}
