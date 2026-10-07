import { currentMe, useAppState } from '../../lib/store.ts';
import { progress } from '../../lib/engine/progress.ts';
import { Bolt, Flame, Shield } from '../ui/icons';

/** Streak · XP · league at a glance; the phone top bar. */
export default function MeStats() {
  const s = useAppState();
  const me = currentMe(s);
  const p = progress(s, me);
  return (
    <div className="flex items-center gap-4">
      <a href="/lig" className="flex items-center" aria-label="Lig">
        <Shield size={26} tier={me.tier ?? 0} />
      </a>
      <a href="/bugun" className="flex items-center gap-1" aria-label={`${p.streak} haftalık seri`}>
        <Flame size={26} dim={!p.met && p.streak === 0} />
        <span className={`num text-[17px] font-black ${p.streak ? 'text-orange-ink' : 'text-ink-3'}`}>{p.streak}</span>
      </a>
      <a href="/bugun" className="flex items-center gap-1" aria-label={`Bu hafta ${p.xpWeek} XP`}>
        <Bolt size={26} />
        <span className="num text-[17px] font-black text-gold-ink">{p.xpWeek}</span>
      </a>
    </div>
  );
}
