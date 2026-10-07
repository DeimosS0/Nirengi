// Small pieces both kurum screens (home, needs list) use to describe a need.

import type { Need, NeedStatus, State } from '../../lib/types.ts';
import { assessCanvas, PUBLISH_THRESHOLD } from '../../lib/engine/canvas.ts';
import { rankCandidates, type Conflict } from '../../lib/engine/match.ts';
import { NEED_STATUS } from '../../lib/labels.ts';

/** A person counts as a candidate for a published need from this fit score up. */
export const FIT_MIN = 60;

const PILL: Record<NeedStatus, string> = {
  draft: 'bg-bg-3 text-ink-3',
  published: 'bg-green-tint text-green-lip',
  piloting: 'bg-indigo-tint text-indigo',
  closed: 'bg-bg-3 text-ink-3',
};

/** A need's stage in plain words for the kurum side: "Pilotta" reads as "Denemede". */
export const NEED_LABEL = NEED_STATUS;

export const NeedPill = ({ status }: { status: NeedStatus }) => <span className={`pill !py-0.5 ${PILL[status]}`}>{NEED_LABEL[status]}</span>;

/** Order on the kurum screens: what is live first, what is over last. */
export const STATUS_RANK: Record<NeedStatus, number> = { published: 0, draft: 1, piloting: 2, closed: 3 };

export function needStats(s: State, n: Need, conflicts: Map<string, Conflict>) {
  const a = assessCanvas(n.canvas, n.skills);
  const fits = n.status === 'published' ? rankCandidates(s, n, conflicts).filter((m) => m.score >= FIT_MIN) : [];
  return { a, fits: fits.length, best: fits[0]?.score ?? 0 };
}

/** Plain words for how far a draft is from the publish gate; null once it can go out. */
export function gateNote(a: ReturnType<typeof assessCanvas>) {
  if (a.canPublish) return null;
  const gap = Math.max(0, PUBLISH_THRESHOLD - a.score);
  return gap ? `Yayın için ${gap} puan daha` : `${a.blockers.length} zorunlu madde eksik`;
}
