// Authored two-tone icons. Each concept owns one colour of the palette, so a
// glance at the colour already says what the number next to it means.

import type { ReactNode } from 'react';

interface P {
  size?: number;
  className?: string;
}

const c = (v: string) => `rgb(var(--${v}))`;
const svg = (size: number, className: string, children: ReactNode, label?: string) => (
  <svg
    viewBox="0 0 32 32"
    width={size}
    height={size}
    className={`shrink-0 ${className}`}
    aria-hidden={label ? undefined : true}
    role={label ? 'img' : undefined}
    aria-label={label}
  >
    {children}
  </svg>
);

/** Seri — the weekly streak: a lit survey beacon that keeps signalling. */
export const Flame = ({ size = 28, className = '', dim = false }: P & { dim?: boolean }) =>
  svg(
    size,
    className,
    <>
      <path d="M16 11.5 25 28H7Z" fill={dim ? c('line-2') : c('orange')} stroke={dim ? c('line-2') : c('orange')} strokeWidth="3.4" strokeLinejoin="round" />
      <path d="M16 18.5 21.6 28H10.4Z" fill={dim ? c('bg-3') : c('orange-lip')} stroke={dim ? c('bg-3') : c('orange-lip')} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="16" cy="11.4" r="3.4" fill={dim ? c('bg-3') : c('gold')} />
      <path d="M16 2.6v2.6M9.4 5.4l1.8 1.9M22.6 5.4l-1.8 1.9" stroke={dim ? c('line-2') : c('gold')} strokeWidth="2.4" strokeLinecap="round" />
    </>,
  );

/** XP — a faceted gem: each verified piece of work cuts another facet. */
export const Bolt = ({ size = 28, className = '' }: P) =>
  svg(
    size,
    className,
    <>
      <path d="M10.6 5.5h10.8l5.6 7.2L16 27.5 5 12.7Z" fill={c('gold')} stroke={c('gold')} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M16 27.5 21 12.7h6ZM21.4 5.5 27 12.7h-6Z" fill={c('gold-lip')} />
      <path d="M10.6 5.5 13 12.7h-8Z" fill="#fff" opacity="0.45" />
      <path d="M13 12.7h8L16 27.5Z" fill="#fff" opacity="0.18" />
    </>,
  );

/** Lig — an elevation: a ridge in the tier's colour with a flag on its summit. */
export const Shield = ({ size = 28, className = '', tier = 2 }: P & { tier?: number }) =>
  svg(
    size,
    className,
    <>
      <path d="M2.5 27 11 14.5l3.6 4.6L20.5 8 29.5 27Z" fill={c(`t${tier}`)} stroke={c(`t${tier}`)} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M20.5 8 29.5 27h-6.2L18.6 15.6Z" fill="rgb(0 0 0 / 0.14)" />
      <path d="M20.5 8 17.9 12.9l2.6-1 2.4 1.2Z" fill="#fff" opacity="0.9" />
      <path d="M20.5 8.4V2.6" stroke={c('ink-3')} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M21 2.6h5.4l-1.6 1.9 1.6 1.9H21Z" fill={c(`t${tier}`)} />
    </>,
  );

/** Bugün — where you stand: a survey marker with its ping rings. */
export const Home = ({ size = 28, className = '' }: P) =>
  svg(
    size,
    className,
    <>
      <ellipse cx="16" cy="25.2" rx="13" ry="4.2" fill="none" stroke={c('cyan')} strokeWidth="2" opacity="0.55" />
      <ellipse cx="16" cy="25.2" rx="7.6" ry="2.4" fill={c('cyan')} opacity="0.45" />
      <path d="M16 4.5 25 21H7Z" transform="translate(0 2.2)" fill={c('indigo-lip')} stroke={c('indigo-lip')} strokeWidth="3.4" strokeLinejoin="round" />
      <path d="M16 4.5 25 21H7Z" fill={c('indigo')} stroke={c('indigo')} strokeWidth="3.4" strokeLinejoin="round" />
      <circle cx="16" cy="15" r="2.6" fill="#fff" />
    </>,
  );

/** Görevler — this week's route: a folded map with a dashed route and a flag on its waypoint. */
export const Route = ({ size = 28, className = '' }: P) =>
  svg(
    size,
    className,
    <>
      <path d="M4.5 9 11.5 6.5v19L4.5 28Z" fill={c('gold')} stroke={c('gold')} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M11.5 6.5 20.5 9v19l-9-2.5Z" fill={c('gold-lip')} stroke={c('gold-lip')} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M20.5 9 27.5 6.5v19L20.5 28Z" fill={c('gold')} stroke={c('gold')} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M7.6 23.4c2.4-.9 3.5-4 6-4.6s4.2.9 6.3-1.4 1.7-4 3.4-5" fill="none" stroke="#fff" strokeWidth="1.8" strokeDasharray="2.2 2.4" strokeLinecap="round" />
      <circle cx="7.6" cy="23.4" r="1.7" fill="#fff" />
      <path d="M23.4 12.6V3.4" stroke={c('indigo-lip')} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M23.9 3.4h5l-1.5 1.9 1.5 1.9h-5Z" fill={c('indigo')} stroke={c('indigo')} strokeWidth="0.8" strokeLinejoin="round" />
    </>,
  );

/** Topluluk — two people talking. */
export const Bubbles = ({ size = 28, className = '' }: P) =>
  svg(
    size,
    className,
    <>
      <path d="M12 21.5h7.2l5.3 4.2v-4.2h.8a3 3 0 0 0 3-3V11a3 3 0 0 0-3-3h-1.6v7.4a6 6 0 0 1-6 6H12Z" fill={c('purple-lip')} />
      <path d="M3.5 7a3 3 0 0 1 3-3h13a3 3 0 0 1 3 3v8.4a3 3 0 0 1-3 3h-8.7L5.5 22.6v-4.2h0a2 2 0 0 1-2-2V7Z" fill={c('purple')} />
      <circle cx="9" cy="11.3" r="1.6" fill="#fff" />
      <circle cx="13.2" cy="11.3" r="1.6" fill="#fff" />
      <circle cx="17.4" cy="11.3" r="1.6" fill="#fff" />
    </>,
  );

/** Profil. */
export const Face = ({ size = 28, className = '' }: P) =>
  svg(
    size,
    className,
    <>
      <path d="M5 29c0-6.2 4.9-10 11-10s11 3.8 11 10Z" fill={c('indigo')} />
      <circle cx="16" cy="10.5" r="6.5" fill={c('indigo')} />
      <circle cx="16" cy="10.5" r="6.5" fill="rgb(255 255 255 / 0.18)" />
    </>,
  );

/** Keşfet — compass. */
export const Compass = ({ size = 28, className = '' }: P) =>
  svg(
    size,
    className,
    <>
      <circle cx="16" cy="16" r="13" fill={c('cyan')} />
      <circle cx="16" cy="16" r="9.5" fill="rgb(255 255 255 / 0.22)" />
      <path d="M21.6 10.4 18.4 18.4 10.4 21.6 13.6 13.6Z" fill="#fff" />
      <path d="M21.6 10.4 13.6 13.6 18.4 18.4Z" fill={c('red')} />
      <circle cx="16" cy="16" r="1.7" fill={c('ink')} />
    </>,
  );

/** İhtiyaç — clipboard with a checked line. */
export const Clipboard = ({ size = 28, className = '' }: P) =>
  svg(
    size,
    className,
    <>
      <rect x="5.5" y="5" width="21" height="24.5" rx="3" fill={c('orange')} />
      <rect x="8.5" y="8.5" width="15" height="18" rx="1.5" fill="#fff" />
      <rect x="11" y="2.5" width="10" height="5.5" rx="2" fill={c('orange-lip')} />
      <path d="m11 15 2 2 4-4" fill="none" stroke={c('green')} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 21.5h10" stroke={c('line-2')} strokeWidth="2.4" strokeLinecap="round" />
    </>,
  );

/** Projeler (pilotlar) — a flag on the path. */
export const Flag = ({ size = 28, className = '' }: P) =>
  svg(
    size,
    className,
    <>
      <path d="M8.5 3.5v25" stroke={c('ink-3')} strokeWidth="3" strokeLinecap="round" />
      <path d="M10 4.5h15l-3.6 5.5 3.6 5.5H10Z" fill={c('green')} />
      <path d="M10 10h11.4l3.6 5.5H10Z" fill={c('green-lip')} />
    </>,
  );

/** Kurum. */
export const Building = ({ size = 28, className = '' }: P) =>
  svg(
    size,
    className,
    <>
      <path d="M4.5 29V8.5L17 3.5V29Z" fill={c('indigo')} />
      <path d="M17 11.5h10.5V29H17Z" fill={c('indigo-lip')} />
      {[9.5, 14.5, 19.5].map((y) => (
        <g key={y} fill="#fff">
          <rect x="8" y={y} width="2.6" height="2.6" rx=".6" />
          <rect x="12" y={y} width="2.6" height="2.6" rx=".6" />
        </g>
      ))}
      <rect x="20.2" y="15" width="2.6" height="2.6" rx=".6" fill="rgb(255 255 255 / 0.7)" />
      <rect x="20.2" y="20" width="2.6" height="2.6" rx=".6" fill="rgb(255 255 255 / 0.7)" />
      <path d="M9 29v-4h4.5v4Z" fill={c('gold')} />
    </>,
  );

/** Yöntem — an open book. */
export const Book = ({ size = 28, className = '' }: P) =>
  svg(
    size,
    className,
    <>
      <path d="M3.5 7.5c4.5-1.6 8.6-1.2 12.5 1.4v19c-3.9-2.6-8-3-12.5-1.4Z" fill={c('cyan')} />
      <path d="M28.5 7.5c-4.5-1.6-8.6-1.2-12.5 1.4v19c3.9-2.6 8-3 12.5-1.4Z" fill={c('cyan-lip')} />
    </>,
  );

export const CheckCircle = ({ size = 28, className = '' }: P) =>
  svg(
    size,
    className,
    <>
      <circle cx="16" cy="16" r="13" fill={c('green')} />
      <path d="m10 16.5 4 4 8-9" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </>,
  );

export const Lock = ({ size = 28, className = '' }: P) =>
  svg(
    size,
    className,
    <>
      <path d="M10.5 14v-3.5a5.5 5.5 0 0 1 11 0V14" fill="none" stroke={c('ink-4')} strokeWidth="3" />
      <rect x="7" y="13.5" width="18" height="14" rx="3.5" fill={c('line-2')} />
      <circle cx="16" cy="20.5" r="2" fill={c('ink-4')} />
    </>,
  );

export const Star = ({ size = 28, className = '' }: P) =>
  svg(
    size,
    className,
    <path
      d="m16 3.5 3.7 7.6 8.3 1.2-6 5.9 1.4 8.3L16 22.6l-7.4 3.9L10 18.2l-6-5.9 8.3-1.2Z"
      fill={c('gold')}
      stroke={c('gold-lip')}
      strokeWidth="1.6"
      strokeLinejoin="round"
    />,
  );

/** Destek — a raised hand of support. */
export const Hand = ({ size = 22, className = '', on = false }: P & { on?: boolean }) =>
  svg(
    size,
    className,
    <path
      d="M11 15V6.5a1.9 1.9 0 0 1 3.8 0V13M14.8 12V4.6a1.9 1.9 0 0 1 3.8 0V12M18.6 12.5V6.8a1.9 1.9 0 0 1 3.8 0V18c0 5.8-3.6 10-9 10-3.4 0-5.4-1.6-7.2-4.2L4.4 19a1.9 1.9 0 0 1 3.1-2.2L11 20"
      fill={on ? c('purple-tint') : 'none'}
      stroke={on ? c('purple') : c('ink-3')}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />,
  );

/** GitHub mark, monochrome. */
export const GitHub = ({ size = 20, className = '' }: P) => (
  <svg viewBox="0 0 16 16" width={size} height={size} className={`shrink-0 ${className}`} aria-hidden="true" fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
);

/** Brand mark: the nirengi triangle with its survey point. */
export const Mark = ({ size = 32, className = '' }: P) =>
  svg(
    size,
    className,
    <>
      <path d="M16 4.5 28 26H4Z" fill={c('indigo')} stroke={c('indigo')} strokeWidth="4" strokeLinejoin="round" />
      <path d="M16 12.5 22.4 23.5H9.6Z" fill="rgb(255 255 255 / 0.22)" />
      <circle cx="16" cy="19" r="3" fill={c('orange')} />
    </>,
  );
