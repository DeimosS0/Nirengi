import { currentMe, useAppState } from '../../lib/store.ts';
import { league, progress, questsFor, TIERS, XP } from '../../lib/engine/progress.ts';
import { Bar } from '../ui/kit';
import { Bolt, Chest, Flame, Shield } from '../ui/icons';
import MeStats from './MeStats';

/** Right rail on wide screens: where you stand, at a glance, on every young-side page. */
export default function GencRail() {
  const s = useAppState();
  const me = currentMe(s);
  const p = progress(s, me);
  const l = league(s, me);
  const mine = l.rows.find((r) => r.personId === me.id);
  const weekly = questsFor(s, me).filter((q) => q.kind === 'haftalik');
  const left = Math.max(0, Math.ceil((l.endsAt - Date.now()) / 86_400_000));

  return (
    <div className="sticky top-6 space-y-5">
      <div className="flex justify-end py-1">
        <MeStats />
      </div>

      <a href="/lig" className="card card-hover block p-5">
        <div className="flex items-center gap-4">
          <Shield size={56} tier={l.tier} />
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
          </div>
        </div>
        {mine && mine.zone !== 'up' && l.tier < TIERS.length - 1 && (
          <p className="mt-3 rounded-[12px] bg-bg-2 px-3 py-2 text-[14px] font-bold text-ink-3">
            {TIERS[l.tier + 1]} Ligi’ne çıkmak için ilk 5’e gir: <span className="text-gold-ink">{Math.max(1, l.rows[4].xp - mine.xp + 1)} XP</span> daha.
          </p>
        )}
      </a>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <p className="h-sec">Haftalık seri</p>
          <span className="flex items-center gap-1">
            <Flame size={24} className={p.met ? 'flame-live' : ''} dim={!p.met && !p.streak} />
            <span className="num text-[18px] font-black text-orange-ink">{p.streak}</span>
          </span>
        </div>
        <p className="mt-1 text-[15px] font-bold text-ink-3">
          {p.rest ? 'Bu hafta moladasın; serin bekliyor.' : p.met ? 'Bu haftanın hedefi tamam.' : `Hedefe ${p.goal - p.active} gün kaldı.`}
        </p>
        <div className="mt-3 flex gap-1.5" aria-hidden="true">
          {p.days.map((d) => (
            <span key={d.key} className={`h-2.5 flex-1 rounded-full ${d.active ? 'bg-orange' : d.future ? 'bg-bg-3' : 'bg-line-2'}`} />
          ))}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <p className="h-sec">Bu haftanın görevleri</p>
          <a href="/gorevler" className="text-[14px] font-extrabold uppercase tracking-wide text-indigo hover:underline">
            Tümü
          </a>
        </div>
        <ul className="mt-4 space-y-4">
          {weekly.map((q) => (
            <li key={q.id} className="flex items-center gap-3">
              {q.complete ? <Chest size={34} open /> : <Bolt size={34} />}
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-extrabold text-ink">{q.title}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Bar value={q.done / q.of} tone={q.complete ? 'green' : 'gold'} h={14} />
                  <span className="num w-9 shrink-0 text-right text-[13px] font-extrabold text-ink-3">
                    {q.done}/{q.of}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="px-2 text-[13px] font-bold leading-relaxed text-ink-3">
        XP yalnız doğrulanabilir olaylardan gelir; günde en fazla {XP.dailyCap}.{' '}
        <a className="font-extrabold text-indigo hover:underline" href="/yontem#ilerleme">
          Nasıl hesaplanıyor?
        </a>
      </p>
    </div>
  );
}
