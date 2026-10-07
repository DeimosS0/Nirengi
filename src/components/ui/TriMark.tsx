// Small survey markers for dense rows (week history, step bars, rank medals).
// Same geometry as `Tri` in pafta.tsx, but any palette token as colour and
// outline / dashed variants for "missed" and "paused".

import type { ReactNode } from 'react';

const TRI = 'M50 9 91 82H9Z';

export type TriVariant = 'filled' | 'outline' | 'dashed';

/**
 * `size` in px, or omit it to fill the parent's width. `color` is a token name
 * (indigo, orange, ink-4, t0 …). Children are centred on the triangle's centroid.
 */
export function TriMark({
  size,
  color = 'indigo',
  variant = 'filled',
  lip = true,
  className = '',
  children,
}: {
  size?: number;
  color?: string;
  variant?: TriVariant;
  lip?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const c = `rgb(var(--${color}))`;
  return (
    <span className={`relative block shrink-0 ${size ? '' : 'aspect-[100/92] w-full'} ${className}`} style={size ? { width: size, height: size * 0.92 } : undefined}>
      <svg viewBox="0 0 100 98" className="absolute left-0 top-0 w-full overflow-visible" aria-hidden="true">
        {variant === 'filled' ? (
          <>
            {lip && (
              <g transform="translate(0 7)" strokeLinejoin="round" strokeWidth="14">
                <path d={TRI} fill={c} stroke={c} />
                <path d={TRI} fill="rgb(0 0 0 / 0.22)" stroke="rgb(0 0 0 / 0.22)" />
              </g>
            )}
            <path d={TRI} fill={c} stroke={c} strokeWidth="14" strokeLinejoin="round" />
            <path d="M50 20 30 56" stroke="rgb(255 255 255 / 0.28)" strokeWidth="6" strokeLinecap="round" />
          </>
        ) : (
          <path d={TRI} fill="none" stroke={c} strokeWidth={variant === 'dashed' ? 9 : 10} strokeDasharray={variant === 'dashed' ? '15 13' : undefined} strokeLinejoin="round" />
        )}
      </svg>
      {children && (
        <span className="absolute inset-x-0 top-[30%] grid h-[52%] place-items-center">
          {children}
        </span>
      )}
    </span>
  );
}
