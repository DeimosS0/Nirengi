// Drawings for the assistant: the small triangle pips, the mini Niri face of the
// help button, and one illustration per welcome card, composed from our icons.

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Bolt, CheckCircle, Clipboard, Compass, Flag, Flame, Lock } from '../ui/icons';
import { Tri } from '../ui/pafta';
import { TriMark } from '../ui/TriMark';

// ---------------------------------------------------------------- triangle pips

const D = 'M12 3.6 21.2 19.4H2.8Z';

/** Progress marker: done and current are filled, the current one sends out a survey ping. */
export function Pip({ size = 16, state }: { size?: number; state: 'done' | 'now' | 'next' }) {
  const solid = state !== 'next';
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="shrink-0 overflow-visible" aria-hidden="true">
      {state === 'now' && <path d={D} className="ping-soft" fill="rgb(var(--indigo) / 0.4)" stroke="rgb(var(--indigo) / 0.4)" strokeWidth="3" strokeLinejoin="round" />}
      <path
        d={D}
        fill={solid ? 'rgb(var(--indigo))' : 'rgb(var(--bg-2))'}
        stroke={solid ? 'rgb(var(--indigo))' : 'rgb(var(--line-2))'}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A small face for the help button: Niri's triangle, eyes and cheeks only. */
export function NiriFace({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className="shrink-0" aria-hidden="true">
      <path d="M16 4.5 28 26H4Z" fill="rgb(var(--indigo))" stroke="rgb(var(--indigo))" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="12.6" cy="17.4" r="3.1" fill="#fff" />
      <circle cx="19.4" cy="17.4" r="3.1" fill="#fff" />
      <circle cx="13.1" cy="17.8" r="1.5" fill="#252338" />
      <circle cx="19.9" cy="17.8" r="1.5" fill="#252338" />
      <circle cx="9.3" cy="22" r="1.7" fill="rgb(var(--orange))" opacity=".6" />
      <circle cx="22.7" cy="22" r="1.7" fill="rgb(var(--orange))" opacity=".6" />
    </svg>
  );
}

// ---------------------------------------------------------------- scenes

const Scene = ({ children }: { children: ReactNode }) => (
  <div className="relative mx-auto h-[150px] w-[240px] shrink-0" aria-hidden="true">
    {children}
  </div>
);

/** Small scene caption, set in the app font like everything else. */
const Tag = ({ x, y, children }: { x: number; y: number; children: ReactNode }) => (
  <span className="absolute whitespace-nowrap text-[12px] font-bold text-ink-3" style={{ left: x, top: y }}>
    {children}
  </span>
);

const Surveyor = ({ x, y, tone, delay }: { x: number; y: number; tone: string; delay: number }) => (
  <motion.span
    className="absolute"
    style={{ left: x, top: y }}
    initial={{ opacity: 0, scale: 0.6 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: 'spring', stiffness: 380, damping: 18, delay }}
  >
    <svg viewBox="0 0 24 24" width="38" height="38" className="overflow-visible">
      <path d={D} fill={`rgb(var(--${tone}))`} stroke={`rgb(var(--${tone}))`} strokeWidth="3" strokeLinejoin="round" />
      <path d="M12 9.4 16 16.4H8Z" fill="rgb(255 255 255 / 0.25)" />
    </svg>
    <span className="absolute -right-1.5 -top-1">
      <CheckCircle size={17} />
    </span>
  </motion.span>
);

/** 1. A need goes in, young people with real work come out. */
export function ArtGain() {
  return (
    <Scene>
      <span className="absolute left-2 top-[34px]">
        <Clipboard size={64} />
      </span>
      <Tag x={2} y={106}>
        Sorunun
      </Tag>
      <svg className="absolute inset-0" viewBox="0 0 240 150">
        <path d="M80 66h62" stroke="rgb(var(--line-2))" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" fill="none" />
        <motion.circle
          cy="66"
          r="5"
          fill="rgb(var(--orange))"
          initial={{ cx: 84, opacity: 0 }}
          animate={{ cx: [84, 138], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
      <Surveyor x={160} y={14} tone="indigo" delay={0.1} />
      <Surveyor x={192} y={52} tone="cyan" delay={0.2} />
      <Surveyor x={156} y={88} tone="purple" delay={0.3} />
      <Tag x={126} y={132}>
        Gerçek işi olanlar
      </Tag>
    </Scene>
  );
}

/** 2. A few questions; the clarity bar climbs past the gate and the check pops. */
export function ArtNeed() {
  return (
    <Scene>
      <div className="absolute left-3 top-2 w-[214px] rounded-[16px] border-2 border-line bg-bg px-3.5 pb-6 pt-3" style={{ boxShadow: '0 3px 0 rgb(var(--line))' }}>
        <motion.div
          className="h-2.5 rounded-full bg-ink-4/60"
          initial={{ width: '30%' }}
          animate={{ width: ['30%', '88%'] }}
          transition={{ duration: 1.6, repeat: Infinity, repeatType: 'reverse', repeatDelay: 1.4, ease: 'easeInOut' }}
        />
        <div className="mt-2 h-2.5 w-[72%] rounded-full bg-bg-3" />
        <div className="mt-2 h-2.5 w-[58%] rounded-full bg-bg-3" />
        <div className="relative mt-4">
          <div className="h-3 overflow-hidden rounded-full bg-bg-3">
            <motion.div
              className="h-full rounded-full bg-green"
              initial={{ width: '24%' }}
              animate={{ width: ['24%', '82%'] }}
              transition={{ duration: 1.6, repeat: Infinity, repeatType: 'reverse', repeatDelay: 1.4, ease: 'easeInOut' }}
            />
          </div>
          <span className="absolute -top-1 h-5 w-[3px] rounded-full bg-ink" style={{ left: '70%' }} />
          <span className="num absolute -bottom-[20px] -translate-x-1/2 text-[12px] font-bold text-ink-3" style={{ left: '70%' }}>
            70
          </span>
          <span className="absolute -bottom-[20px] left-0 text-[12px] font-bold text-ink-3">Netlik</span>
        </div>
      </div>
      <motion.span
        className="absolute right-0 top-0"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 0, 1.18, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, repeatType: 'reverse', repeatDelay: 1.4, times: [0, 0.6, 0.85, 1] }}
      >
        <CheckCircle size={30} />
      </motion.span>
    </Scene>
  );
}

/** 3. A candidate whose name is hidden but whose work speaks. */
export function ArtMatch() {
  return (
    <Scene>
      <div className="absolute left-4 top-[62px] h-[64px] w-[208px] rounded-[16px] border-2 border-line bg-bg-2 opacity-70" />
      <div className="absolute left-1 top-2 w-[224px] rounded-[16px] border-2 border-line bg-bg px-2.5 py-2.5" style={{ boxShadow: '0 3px 0 rgb(var(--line))' }}>
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-dashed border-line-2 bg-bg-2 text-ink-3">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path d="M8 2.2 14.2 13.3H1.8Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1 whitespace-nowrap text-[13px] font-extrabold leading-tight text-ink">
              Aday · K7F2
              <Lock size={13} />
            </span>
            <span className="block whitespace-nowrap text-[11.5px] font-bold leading-tight text-ink-3">isim gizli</span>
          </span>
          <span className="num rounded-full bg-green-tint px-2 py-0.5 text-[13px] font-black text-green-lip">%86</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 whitespace-nowrap rounded-[10px] bg-cyan-tint px-2 py-1.5 text-[11.5px] font-extrabold text-cyan-lip">
          <svg viewBox="0 0 16 16" width="13" height="13" className="shrink-0">
            <path d="M8 2.2 14.2 13.3H1.8Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="8" cy="9.6" r="1.6" fill="currentColor" />
          </svg>
          Doğrulandı: dosya dağıtımı
        </div>
      </div>
      <motion.span className="absolute -right-1 bottom-0" initial={{ rotate: -40 }} animate={{ rotate: [-40, 12, 0] }} transition={{ duration: 1.2, ease: 'easeOut' }}>
        <Compass size={46} />
      </motion.span>
    </Scene>
  );
}

/** 4. A small project in stages; each stage is approved and written to a chain. */
export function ArtPilot() {
  const nodes = [
    { x: 22, done: true },
    { x: 88, done: true },
    { x: 154, done: false },
  ];
  return (
    <Scene>
      <svg className="absolute inset-0" viewBox="0 0 240 150">
        <path d="M40 56H106" stroke="rgb(var(--green))" strokeWidth="4" strokeLinecap="round" />
        <path d="M106 56H172" stroke="rgb(var(--line-2))" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 8" />
      </svg>
      {nodes.map((n, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{ left: n.x, top: 28 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 20, delay: i * 0.12 }}
        >
          <svg viewBox="0 0 24 24" width="40" height="40" className="overflow-visible">
            {!n.done && <path d={D} className="ping-soft" fill="rgb(var(--indigo) / 0.4)" stroke="rgb(var(--indigo) / 0.4)" strokeWidth="3" strokeLinejoin="round" />}
            <path
              d={D}
              fill={n.done ? 'rgb(var(--green))' : 'rgb(var(--indigo))'}
              stroke={n.done ? 'rgb(var(--green))' : 'rgb(var(--indigo))'}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {n.done ? (
              <path d="m8.4 14.2 2.5 2.4 4.7-5.3" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <circle cx="12" cy="14" r="2.2" fill="#fff" />
            )}
          </svg>
        </motion.span>
      ))}
      <span className="absolute right-1 top-[18px]">
        <Flag size={44} />
      </span>
      <Tag x={8} y={80}>
        Aşama 1
      </Tag>
      <Tag x={76} y={80}>
        Aşama 2
      </Tag>
      <Tag x={142} y={80}>
        Aşama 3
      </Tag>
      <svg className="absolute inset-0" viewBox="0 0 240 150">
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${46 + i * 46} 116h12`} stroke="rgb(var(--line-2))" strokeWidth="3" strokeLinecap="round" />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={12 + i * 46} y={104} width="34" height="24" rx="7" fill={['rgb(var(--indigo))', 'rgb(var(--cyan))', 'rgb(var(--green))', 'rgb(var(--ink-4))'][i]} />
        ))}
      </svg>
      <span className="absolute right-3 top-[104px]">
        <Lock size={24} />
      </span>
      <Tag x={12} y={132}>
        Kayıt defteri: değiştirilemez
      </Tag>
    </Scene>
  );
}

// ---------------------------------------------------------------- genç scenes

/** Centred caption under a mark. */
const Cap = ({ cx, y, children }: { cx: number; y: number; children: ReactNode }) => (
  <span className="absolute -translate-x-1/2 whitespace-nowrap text-center text-[12px] font-bold text-ink-3" style={{ left: cx, top: y }}>
    {children}
  </span>
);

const spring = (delay: number) => ({ type: 'spring' as const, stiffness: 380, damping: 20, delay });

/** G1. Your own map: every verified piece of work is a point climbing to the summit flag. */
export function ArtGencHos() {
  const nodes = [
    { x: 12, y: 86, done: true },
    { x: 68, y: 60, done: true },
    { x: 124, y: 34, done: false },
  ];
  return (
    <Scene>
      <svg className="absolute inset-0" viewBox="0 0 240 150">
        <path d="M0 132 56 108 98 116 152 82 192 90 240 56V150H0Z" fill="rgb(var(--bg-3))" />
        <path d="M31 104 87 78" stroke="rgb(var(--green))" strokeWidth="4" strokeLinecap="round" />
        <path d="M87 78 143 52 190 36" stroke="rgb(var(--line-2))" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 8" fill="none" />
      </svg>
      {nodes.map((n, i) => (
        <motion.span key={i} className="absolute" style={{ left: n.x, top: n.y }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring(i * 0.12)}>
          <svg viewBox="0 0 24 24" width="38" height="38" className="overflow-visible">
            {!n.done && <path d={D} className="ping-soft" fill="rgb(var(--indigo) / 0.4)" stroke="rgb(var(--indigo) / 0.4)" strokeWidth="3" strokeLinejoin="round" />}
            <path
              d={D}
              fill={n.done ? 'rgb(var(--green))' : 'rgb(var(--indigo))'}
              stroke={n.done ? 'rgb(var(--green))' : 'rgb(var(--indigo))'}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {n.done ? (
              <path d="m8.4 14.2 2.5 2.4 4.7-5.3" fill="none" stroke="rgb(255 255 255)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <circle cx="12" cy="14" r="2.2" fill="rgb(255 255 255)" />
            )}
          </svg>
        </motion.span>
      ))}
      <span className="absolute right-3 top-[6px]">
        <Flag size={46} />
      </span>
      <Tag x={8} y={128}>
        Paftan: her iş bir nokta
      </Tag>
    </Scene>
  );
}

/** G2. The week: one triangle per day, the bar fills toward the goal you chose. */
export function ArtGencHafta() {
  const days = ['on', 'on', 'on', 'today', 'off', 'off', 'off'] as const;
  return (
    <Scene>
      <div className="absolute left-3 top-3 flex w-[216px] justify-between">
        {days.map((d, i) => (
          <motion.span key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring(i * 0.05)}>
            <TriMark size={27} color={d === 'on' ? 'orange' : 'line-2'} variant={d === 'on' ? 'filled' : d === 'today' ? 'dashed' : 'outline'} lip={false} />
          </motion.span>
        ))}
      </div>
      <div className="absolute left-3 top-[58px] h-3 w-[216px] overflow-hidden rounded-full bg-bg-3">
        <motion.div
          className="h-full rounded-full bg-green"
          initial={{ width: '20%' }}
          animate={{ width: ['20%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse', repeatDelay: 1.4, ease: 'easeInOut' }}
        />
      </div>
      <Tag x={12} y={78}>
        Hedef: haftada 3 gün
      </Tag>
      <span className="absolute left-3 top-[104px]">
        <Flame size={34} />
      </span>
      <Tag x={50} y={113}>
        Seri uzar
      </Tag>
      <span className="absolute left-[142px] top-[104px]">
        <Bolt size={34} />
      </span>
      <Tag x={180} y={113}>
        XP
      </Tag>
    </Scene>
  );
}

/** G3. The same work gets stronger: claim, check, institution sign-off. */
export function ArtGencIs() {
  const steps = [
    { cx: 36, label: 'Beyan', state: 'waiting' as const, tone: 'indigo' as const },
    { cx: 120, label: 'Doğrulandı', state: 'done' as const, tone: 'cyan' as const },
    { cx: 204, label: 'Kurum onaylı', state: 'done' as const, tone: 'indigo' as const },
  ];
  return (
    <Scene>
      <svg className="absolute inset-0" viewBox="0 0 240 150">
        <path d="M66 36h24" stroke="rgb(var(--line-2))" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7" />
        <path d="M150 36h24" stroke="rgb(var(--line-2))" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={6 + i * 84} y={108} width={60} height={11} rx="5.5" fill={['rgb(var(--ink-4))', 'rgb(var(--cyan))', 'rgb(var(--indigo))'][i]} opacity={[0.5, 1, 1][i]} />
        ))}
      </svg>
      {steps.map((s, i) => (
        <motion.span key={s.label} className="absolute" style={{ left: s.cx - 25, top: 8 }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring(i * 0.14)}>
          <Tri size={50} tone={s.tone} state={s.state}>
            {i === 1 && (
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path d="m6.5 12.6 3.6 3.6 7.4-8.2" fill="none" stroke="rgb(255 255 255)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {i === 2 && (
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="m12 3.6 2.5 5.1 5.6.8-4 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4-4 5.6-.8Z" fill="rgb(255 255 255)" />
              </svg>
            )}
          </Tri>
        </motion.span>
      ))}
      {steps.map((s) => (
        <Cap key={s.label} cx={s.cx} y={72}>
          {s.label}
        </Cap>
      ))}
      <Tag x={8} y={126}>
        Her düzeyde iş biraz daha güçlü
      </Tag>
    </Scene>
  );
}

/** G4. The league: five rungs from Zemin to Zirve; you climb one with the week's XP. */
export function ArtGencLig() {
  const tiers = [
    { cx: 22, cy: 120, size: 28, state: 'done' as const },
    { cx: 66, cy: 104, size: 28, state: 'done' as const },
    { cx: 111, cy: 86, size: 44, state: 'done' as const, now: true },
    { cx: 158, cy: 66, size: 28, state: 'locked' as const },
    { cx: 211, cy: 43, size: 28, state: 'locked' as const },
  ];
  return (
    <Scene>
      <svg className="absolute inset-0" viewBox="0 0 240 150">
        <path d="M0 128 44 112 88 96 134 76 182 56 240 30V150H0Z" fill="rgb(var(--bg-3))" />
        <path d="M0 128 44 112 88 96 134 76 182 56 240 30" fill="none" stroke="rgb(var(--line-2))" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M0 128 44 112 88 96 111 86" fill="none" stroke="rgb(var(--purple))" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      {tiers.map((t, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{ left: t.cx - t.size / 2, top: t.cy - t.size * 0.92 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring(i * 0.08)}
        >
          {t.now && <span className="ping-soft absolute left-1/2 top-[58%] h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'rgb(var(--purple) / 0.35)' }} />}
          <Tri size={t.size} tone="purple" state={t.state} />
        </motion.span>
      ))}
      <span className="absolute left-2 top-1">
        <Flame size={30} />
      </span>
      <Tag x={40} y={10}>
        Seri
      </Tag>
      <span className="absolute left-2 top-[40px]">
        <Bolt size={30} />
      </span>
      <Tag x={40} y={46}>
        XP
      </Tag>
      <Tag x={6} y={132}>
        Zemin
      </Tag>
      <Tag x={190} y={62}>
        Zirve
      </Tag>
    </Scene>
  );
}
