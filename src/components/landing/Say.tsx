// Niri speaking one line of the landing. `*word*` marks the words that matter.
// The same line feeds the inline bubble (phones, no JS) and the sticky narrator.

import type { ReactNode } from 'react';
import NiriSays from '../ui/NiriSays';
import type { Dir, Mood } from '../ui/Niri';

export interface Line {
  key: string;
  mood: Mood;
  text: string;
}

export const emphasise = (text: string): ReactNode[] => text.split('*').map((t, i) => (i % 2 ? <b key={i}>{t}</b> : t));

export default function Say({
  mood,
  text,
  size = 84,
  point = 'down',
  side = 'right',
  typing = false,
  className,
}: {
  mood: Mood;
  text: string;
  size?: number;
  point?: Dir;
  side?: 'right' | 'left';
  typing?: boolean;
  className?: string;
}) {
  return (
    <NiriSays mood={mood} size={size} point={point} side={side} typing={typing} className={className}>
      <p className="text-[16px] font-semibold leading-snug text-ink-2">{emphasise(text)}</p>
    </NiriSays>
  );
}
