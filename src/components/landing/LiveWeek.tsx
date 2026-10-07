// A real week card: the same WeekDots, Bar and engine the app uses, fed by the demo seed.

import { currentMe, useAppState } from '../../lib/store.ts';
import { progress } from '../../lib/engine/progress.ts';
import { Bar, Why, WeekDots } from '../ui/kit';
import { Flame } from '../ui/icons';

export default function LiveWeek() {
  const s = useAppState();
  const p = progress(s, currentMe(s));
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="h-sec">Bu hafta</p>
        <span className="chip">Hedef: haftada {p.goal} gün</span>
      </div>
      <div className="mt-5">
        <WeekDots days={p.days} />
      </div>
      <div className="mt-5 flex items-center gap-4">
        <div className="flex-1">
          <Bar value={p.active / p.goal} tone={p.met ? 'green' : 'orange'} />
        </div>
        <span className="num text-[16px] font-black text-ink-2">
          {Math.min(p.active, p.goal)}/{p.goal} gün
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-t-2 border-line pt-4 text-[15px] font-bold text-ink-3">
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
