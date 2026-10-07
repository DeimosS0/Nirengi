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

/** Seri — the weekly streak. */
export const Flame = ({ size = 28, className = '', dim = false }: P & { dim?: boolean }) =>
  svg(
    size,
    className,
    <>
      <path
        d="M16 2.5c1.6 4.6 8 7.6 8 15.2a8 8 0 0 1-16 0c0-4 2-6.4 4-8.1.3 2.2 1.3 3.5 2.6 4C14 9.6 14.3 5.6 16 2.5Z"
        fill={dim ? c('line-2') : c('orange')}
      />
      <path
        d="M16 14.5c1.3 2.3 4 3.6 4 7a4 4 0 0 1-8 0c0-2.1 1.3-3.4 2.4-4.3.2 1.1.7 1.7 1.3 2-.4-1.7-.2-3.2.3-4.7Z"
        fill={dim ? c('bg-3') : c('gold')}
      />
    </>,
  );

/** XP. */
export const Bolt = ({ size = 28, className = '' }: P) =>
  svg(
    size,
    className,
    <>
      <path d="M19 2.5 6.5 18.2h8.2L12 29.5 26 12.8h-8.6L19 2.5Z" fill={c('gold')} />
      <path d="M14.7 18.2 12 29.5 26 12.8h-3.4L14.7 22Z" fill={c('gold-lip')} />
    </>,
  );

/** League shield with a ridge line: the tiers climb from ground to summit. */
export const Shield = ({ size = 28, className = '', tier = 2 }: P & { tier?: number }) =>
  svg(
    size,
    className,
    <>
      <path d="M16 2.5 4.5 6.8v8C4.5 22 9.5 27.4 16 29.6 22.5 27.4 27.5 22 27.5 14.8v-8L16 2.5Z" fill={c(`t${tier}`)} />
      <path d="M16 2.5v27.1c6.5-2.2 11.5-7.6 11.5-14.8v-8L16 2.5Z" fill="rgb(0 0 0 / 0.12)" />
      <path d="M8.5 20.5 13 14.5l3 3.4 2.6-3.6 4.9 6.2Z" fill="#fff" />
      <circle cx="18.6" cy="11" r="1.6" fill="#fff" />
    </>,
  );

/** Bugün — home. */
export const Home = ({ size = 28, className = '' }: P) =>
  svg(
    size,
    className,
    <>
      <path d="M4 14.5 16 4l12 10.5V27a2 2 0 0 1-2 2h-6.5v-8h-7v8H6a2 2 0 0 1-2-2V14.5Z" fill={c('orange')} />
      <path d="M2.8 15.2 16 3.6l13.2 11.6" fill="none" stroke={c('red')} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 21h7v8h-7Z" fill={c('orange-lip')} />
    </>,
  );

/** Görevler — a chest that opens when a quest is done. */
export const Chest = ({ size = 28, className = '', open = false }: P & { open?: boolean }) =>
  svg(
    size,
    className,
    <>
      <path d="M4.5 14h23v12a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 26V14Z" fill={c('gold-lip')} />
      {open ? (
        <path d="M5.5 12.5 8 5.5a3 3 0 0 1 2.8-2h10.4a3 3 0 0 1 2.8 2l2.5 7Z" fill={c('gold')} transform="rotate(-8 16 13)" />
      ) : (
        <path d="M4.5 14v-3.5A5 5 0 0 1 9.5 5.5h13a5 5 0 0 1 5 5V14Z" fill={c('gold')} />
      )}
      <path d="M4.5 14h23v3h-23Z" fill="rgb(0 0 0 / 0.14)" />
      <rect x="13.5" y="12.5" width="5" height="7" rx="1.5" fill={c('ink')} />
      <circle cx="16" cy="16" r="1.1" fill={c('gold')} />
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
