// A real week: the same engine the app uses, drawn as a row of beacons.
// A lit beacon is a day with output; the line of sight links days that follow each other.

import { currentMe, useAppState } from '../../lib/store.ts';
import { progress } from '../../lib/engine/progress.ts';
import { Why } from '../ui/kit';
import { Flame } from '../ui/icons';
import { Tri } from '../ui/pafta';

export default function LiveWeek() {
  const s = useAppState();
  const p = progress(s, currentMe(s));
  const done = Math.min(p.active, p.goal);
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="h-sec">Bu hafta</p>
        <span className="chip">Hedef: haftada {p.goal} gün</span>
      </div>

      <ol className="mt-5 grid grid-cols-7" aria-label="Bu haftanın günleri">
        {p.days.map((d, i) => {
          const prev = p.days[i - 1];
          const next = p.days[i + 1];
          const lit = (a?: boolean) => !!a && d.active;
          return (
            <li key={d.key} className="relative flex flex-col items-center gap-1.5" aria-label={`${d.name}: ${d.active ? 'üretim var' : d.future ? 'henüz gelmedi' : 'üretim yok'}`}>
              <div className="relative grid h-14 w-full place-items-center">
                {prev && <span className={`absolute left-0 right-1/2 top-1/2 -translate-y-1/2 ${lit(prev.active) ? 'h-[3px] rounded-full bg-orange/60' : 'border-t-[3px] border-dotted border-line-2'}`} />}
                {next && <span className={`absolute left-1/2 right-0 top-1/2 -translate-y-1/2 ${lit(next.active) ? 'h-[3px] rounded-full bg-orange/60' : 'border-t-[3px] border-dotted border-line-2'}`} />}
                <span className="relative">
                  {d.active ? (
                    <Flame size={42} className={d.today ? 'flame-live' : ''} />
                  ) : d.today ? (
                    <span className="block opacity-90">
                      <Tri size={34} tone="orange" state="waiting" />
                    </span>
                  ) : (
                    <Flame size={36} dim className={d.future ? 'opacity-60' : ''} />
                  )}
                </span>
              </div>
              <span className={`text-[13px] ${d.today ? 'font-bold text-orange-ink' : 'font-semibold text-ink-3'}`}>{d.name}</span>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex items-center gap-3 border-t-2 border-line pt-4">
        <span className="flex items-center gap-1" role="img" aria-label={`Hedef: ${done}/${p.goal} gün`}>
          {Array.from({ length: p.goal }, (_, i) => (
            <Tri key={i} size={34} tone={p.met ? 'green' : 'orange'} state={i < done ? 'done' : 'waiting'} />
          ))}
        </span>
        <span className="num text-[16px] font-black text-ink-2">
          {done}/{p.goal} gün
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[15px] font-bold text-ink-3">
        <span className="flex items-center gap-1.5">
          <Flame size={22} className={p.met ? 'flame-live' : ''} dim={!p.streak} />
          <b className="num text-orange-ink">{p.streak}</b> haftalık seri
        </span>
        <Why title="Bu sayılar nereden geliyor?" label="Canlı demo: Neden?">
          <p className="text-[15px] font-bold text-ink-2">
            Bu kart demo kullanıcısının verisinden, şu an tarayıcında hesaplanıyor. Bir gün; GitHub’da üretim yaptığın, işin doğrulandığı, bir görevi bitirdiğin ya da cevabının işe yaradığı gündür.
          </p>
          <p className="mt-3 text-[15px] font-bold text-ink-3">Seri, hedefini tutturduğun ardışık hafta sayısıdır. Mola haftası seriyi ne bozar ne artırır.</p>
          <a href="/yontem#ilerleme" className="btn-primary btn-block mt-5">
            Yöntemi oku
          </a>
        </Why>
      </div>
    </div>
  );
}
