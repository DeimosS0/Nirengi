// Niri: the nirengi point as a character. A survey marker that cheers when
// something gets verified. Pure SVG so it ships with the page and works offline.

export type Mood = 'idle' | 'happy' | 'cheer' | 'think' | 'wave';

const c = (v: string) => `rgb(var(--${v}))`;

export default function Niri({ mood = 'idle', size = 120, className = '' }: { mood?: Mood; size?: number; className?: string }) {
  const armsUp = mood === 'cheer';
  const look = mood === 'think' ? { x: -2.2, y: -2.6 } : { x: 1.2, y: 0.8 };
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`shrink-0 overflow-visible ${className}`}
      role="img"
      aria-label="Niri"
    >
      <ellipse cx="60" cy="113" rx="32" ry="5" fill="rgb(var(--ink) / 0.08)" />
      <g className={mood === 'cheer' ? 'niri-cheer' : 'niri-bob'}>
        {/* arms */}
        {armsUp ? (
          <g stroke={c('indigo')} strokeWidth="9" strokeLinecap="round">
            <path d="M30 66 14 46" />
            <path d="M90 66 106 46" />
          </g>
        ) : mood === 'wave' ? (
          <g stroke={c('indigo')} strokeWidth="9" strokeLinecap="round">
            <path d="M30 74 20 88" />
            <path d="M90 66 104 50" style={{ transformOrigin: '90px 66px', animation: 'wiggle 900ms ease-in-out infinite' }} />
          </g>
        ) : (
          <g stroke={c('indigo')} strokeWidth="9" strokeLinecap="round">
            <path d="M30 74 20 88" />
            <path d="M90 74 100 88" />
          </g>
        )}
        {/* feet */}
        <ellipse cx="45" cy="108" rx="10" ry="6.5" fill={c('indigo-lip')} />
        <ellipse cx="75" cy="108" rx="10" ry="6.5" fill={c('indigo-lip')} />
        {/* body: a rounded triangle */}
        <path d="M60 15 105 97H15Z" fill={c('indigo')} stroke={c('indigo')} strokeWidth="18" strokeLinejoin="round" />
        <path d="M15 97h90" stroke={c('indigo-lip')} strokeWidth="18" strokeLinecap="round" opacity=".45" />
        {/* belly with the survey point */}
        <path d="M60 58 82 94H38Z" fill="rgb(255 255 255 / 0.2)" stroke="rgb(255 255 255 / 0.2)" strokeWidth="9" strokeLinejoin="round" />
        <circle cx="60" cy="82" r="7.5" fill="#fff" />
        <circle cx="60" cy="82" r="4.6" fill={c('orange')} />
        {/* cheeks */}
        <ellipse cx="33" cy="70" rx="5.5" ry="3.4" fill={c('orange')} opacity=".55" />
        <ellipse cx="87" cy="70" rx="5.5" ry="3.4" fill={c('orange')} opacity=".55" />
        {/* eyes */}
        {mood === 'happy' || mood === 'cheer' ? (
          <g fill="none" stroke="#252338" strokeWidth="4" strokeLinecap="round">
            <path d="M39 57q8-9 16 0" />
            <path d="M65 57q8-9 16 0" />
          </g>
        ) : (
          <g>
            {[47, 73].map((x) => (
              <g key={x} className="niri-eye">
                <circle cx={x} cy="55" r="11" fill="#fff" />
                <circle cx={x + look.x} cy={55 + look.y} r="5.6" fill="#252338" />
                <circle cx={x + look.x - 2} cy={55 + look.y - 2.2} r="1.9" fill="#fff" />
              </g>
            ))}
          </g>
        )}
        {/* mouth */}
        {mood === 'cheer' ? (
          <g>
            <path d="M51 69h18a9 9 0 0 1-18 0Z" fill="#252338" />
            <path d="M55 74.5a5 3.2 0 0 1 10 0 7 7 0 0 1-10 0Z" fill={c('red')} />
          </g>
        ) : mood === 'think' ? (
          <path d="M55 72h9" stroke="#252338" strokeWidth="3.6" strokeLinecap="round" />
        ) : (
          <path d="M53 69q7 7 14 0" fill="none" stroke="#252338" strokeWidth="3.6" strokeLinecap="round" />
        )}
      </g>
    </svg>
  );
}
