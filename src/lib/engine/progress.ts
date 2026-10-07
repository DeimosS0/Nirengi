// Weekly meaningful progress, XP and leagues. Like the match score, nothing
// here is stored: every number is derived from verified events, so the
// "Neden?" sheet behind any figure can list exactly what produced it.

import type { Peer, Person, Post, State, WeeklyGoal } from '../types.ts';
import { needsForPerson } from './match.ts';
import { skillLabel } from '../skills.ts';

const DAY = 86_400_000;

// ---------------------------------------------------------------- calendar

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day, YYYY-MM-DD. */
export const dayKey = (d: Date | string | number) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};

/** Monday of the week containing `d`, as a day key. Weeks run Monday → Sunday. */
export const weekKey = (d: Date | string | number) => {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return dayKey(x);
};

const addDays = (key: string, n: number) => {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + n, 12));
};

export const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

// ---------------------------------------------------------------- xp

export const XP = {
  activeDay: 10, // a day with public output (GitHub push, PR, release)
  evidence: 40, // a newly machine-verified (S2) artefact
  milestone: 120, // a dual-approved pilot milestone (S3)
  post: 5, // sharing progress with the community, once a day
  support: 2, // each "destek" a post receives
  helpful: 15, // a reply the asker marked as helpful
  dailyCap: 200, // nobody out-grinds a week in one night
} as const;

export type XpKind = 'activity' | 'evidence' | 'milestone' | 'quest' | 'post' | 'support' | 'helpful';

export interface XpEvent {
  at: string;
  day: string;
  xp: number;
  kind: XpKind;
  label: string;
  /** Counts toward the weekly goal: real output or real help, not chatter. */
  meaningful: boolean;
}

/** Every XP-producing event for a person, newest first, before the daily cap. */
export function xpEvents(state: State, person: Person): XpEvent[] {
  const out: XpEvent[] = [];
  const add = (at: string, xp: number, kind: XpKind, label: string, meaningful: boolean) =>
    out.push({ at, day: dayKey(at), xp, kind, label, meaningful });

  for (const d of new Set(person.activity ?? [])) add(`${d}T12:00:00`, XP.activeDay, 'activity', 'GitHub’da üretim yaptığın gün', true);

  for (const e of person.evidence) {
    if (e.level === 'S2' && e.verifiedAt) add(e.verifiedAt, XP.evidence, 'evidence', `Doğrulandı: ${e.title.split(' — ')[0]}`, true);
    if (e.level === 'S3' && e.verifiedAt) add(e.verifiedAt, XP.milestone, 'milestone', `Kurum onayladı: ${e.title.replace(/^Kilometre taşı: /, '')}`, true);
  }

  for (const q of state.quests.filter((x) => x.personId === person.id)) add(q.at, q.xp, 'quest', `Görev: ${q.title}`, true);

  const postDays = new Set<string>();
  for (const p of state.posts) {
    if (p.personId === person.id) {
      if (!postDays.has(dayKey(p.at))) add(p.at, XP.post, 'post', 'Toplulukla paylaştın', false);
      postDays.add(dayKey(p.at));
      if (p.supports.length) add(p.at, XP.support * p.supports.length, 'support', `${p.supports.length} destek aldın`, false);
    }
    for (const r of p.replies)
      if (r.personId === person.id && r.helpful) add(r.at, XP.helpful, 'helpful', 'Cevabın işe yaradı', true);
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

/** XP per day after the daily cap. */
function xpByDay(events: XpEvent[]) {
  const m = new Map<string, number>();
  for (const e of events) m.set(e.day, Math.min(XP.dailyCap, (m.get(e.day) ?? 0) + e.xp));
  return m;
}

export function totalXp(state: State, person: Person) {
  let t = 0;
  for (const v of xpByDay(xpEvents(state, person)).values()) t += v;
  return t;
}

export function weekXp(state: State, person: Person, week = weekKey(Date.now())) {
  let t = 0;
  for (const [day, v] of xpByDay(xpEvents(state, person))) if (weekKey(`${day}T12:00:00`) === week) t += v;
  return t;
}

// ---------------------------------------------------------------- weekly progress

export interface WeekState {
  week: string;
  active: number;
  goal: WeeklyGoal;
  met: boolean;
  rest: boolean;
}

export interface Progress {
  goal: WeeklyGoal;
  /** Mon..Sun of the current week: did that day carry meaningful output? */
  days: { key: string; name: string; active: boolean; today: boolean; future: boolean }[];
  active: number;
  met: boolean;
  rest: boolean;
  /** Consecutive weeks with the goal met; rest weeks pause the count. */
  streak: number;
  /** Oldest first, ending with the current week. */
  history: WeekState[];
  xpWeek: number;
  xpTotal: number;
}

export function progress(state: State, person: Person, at = Date.now(), weeks = 10): Progress {
  const goal: WeeklyGoal = person.weeklyGoal ?? 3;
  const rest = new Set(person.restWeeks ?? []);
  const events = xpEvents(state, person);
  const activeDays = new Set(events.filter((e) => e.meaningful).map((e) => e.day));

  const thisWeek = weekKey(at);
  const today = dayKey(at);
  const weekState = (week: string): WeekState => {
    let active = 0;
    for (let i = 0; i < 7; i++) if (activeDays.has(addDays(week, i))) active++;
    return { week, active, goal, met: active >= goal, rest: rest.has(week) };
  };

  const history: WeekState[] = [];
  for (let i = weeks - 1; i >= 0; i--) history.push(weekState(addDays(thisWeek, -7 * i)));
  const current = history[history.length - 1];

  // Walk back from last week; a rest week neither counts nor breaks the chain.
  let streak = 0;
  for (let w = addDays(thisWeek, -7), guard = 0; guard < 520; w = addDays(w, -7), guard++) {
    const s = weekState(w);
    if (s.rest) continue;
    if (!s.met) break;
    streak++;
  }
  if (current.met) streak++;

  const days = DAY_NAMES.map((name, i) => {
    const key = addDays(thisWeek, i);
    return { key, name, active: activeDays.has(key), today: key === today, future: key > today };
  });

  return {
    goal,
    days,
    active: current.active,
    met: current.met,
    rest: current.rest,
    streak,
    history,
    xpWeek: weekXp(state, person, thisWeek),
    xpTotal: totalXp(state, person),
  };
}

// ---------------------------------------------------------------- leagues

/** Tiers climb from the ground to the summit: a nirengi point sits on the peak. */
export const TIERS = ['Zemin', 'Tepe', 'Sırt', 'Doruk', 'Zirve'] as const;
export const PROMOTE = 5;
export const DEMOTE = 3;

export interface LeagueRow {
  id: string;
  name: string;
  area: string;
  xp: number;
  rank: number;
  personId?: string;
  isPeer: boolean;
  zone: 'up' | 'stay' | 'down';
}

/**
 * Members are grouped by tier, so a newcomer races people at a similar pace,
 * and ranked by this week's XP. Demo peers advance through the week in
 * proportion to elapsed time, so the table moves like a real one.
 */
export function league(state: State, me: Person, at = Date.now()): { tier: number; name: string; rows: LeagueRow[]; endsAt: number } {
  const tier = me.tier ?? 0;
  const week = weekKey(at);
  const weekStart = new Date(`${week}T00:00:00`).getTime();
  const elapsed = Math.min(1, Math.max(0.05, (at - weekStart) / (7 * DAY)));
  const seededWeek = weekKey(state.seededAt);
  const offset = Math.max(0, Math.round((new Date(`${week}T12:00:00`).getTime() - new Date(`${seededWeek}T12:00:00`).getTime()) / (7 * DAY)));

  const people = state.people.filter((p) => (p.tier ?? 0) === tier);
  const peers = state.peers.filter((p) => p.tier === tier);
  const peerXp = (p: Peer) => Math.round((p.weekly[offset % p.weekly.length] ?? 0) * elapsed);

  const rows = [
    ...people.map((p) => ({ id: p.id, name: p.name, area: p.headline.split(' · ').pop() ?? '', xp: weekXp(state, p, week), personId: p.id, isPeer: false })),
    ...peers.map((p) => ({ id: p.id, name: p.name, area: p.area, xp: peerXp(p), isPeer: true })),
  ]
    .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name, 'tr'))
    .map((r, i, all) => ({
      ...r,
      rank: i + 1,
      zone: (tier < TIERS.length - 1 && i < PROMOTE ? 'up' : tier > 0 && i >= all.length - DEMOTE && r.xp > 0 ? 'down' : 'stay') as LeagueRow['zone'],
    }));

  return { tier, name: TIERS[tier], rows, endsAt: weekStart + 7 * DAY };
}

// ---------------------------------------------------------------- quests

export interface Quest {
  id: string;
  kind: 'haftalik' | 'gelisim';
  title: string;
  why: string;
  xp: number;
  done: number;
  of: number;
  complete: boolean;
  href?: string;
}

/**
 * Weekly quests come from the person's own goal and the community; growth
 * quests come from the matcher's gap analysis, so each one names the real
 * need it would move the person closer to.
 */
export function questsFor(state: State, person: Person, at = Date.now()): Quest[] {
  const p = progress(state, person, at);
  const week = weekKey(at);
  const inWeek = (iso: string) => weekKey(iso) === week;
  const helped = state.posts.reduce((n, post) => n + post.replies.filter((r) => r.personId === person.id && inWeek(r.at)).length, 0);
  const questsThisWeek = state.quests.filter((q) => q.personId === person.id && inWeek(q.at) && q.kind !== 'haftalik').length;

  const weekly: Quest[] = [
    {
      id: `w-goal-${week}`,
      kind: 'haftalik',
      title: `Bu hafta ${p.goal} gün üret`,
      why: 'Haftalık hedefin. Commit sayısı değil, üretim yaptığın gün sayılır.',
      xp: 30,
      done: Math.min(p.active, p.goal),
      of: p.goal,
      complete: p.met,
    },
    {
      id: `w-help-${week}`,
      kind: 'haftalik',
      title: 'Toplulukta bir soruya cevap ver',
      why: 'Bildiğini paylaşmak da üretimdir. Cevabın işe yararsa ayrıca XP kazanırsın.',
      xp: 20,
      done: Math.min(helped, 1),
      of: 1,
      complete: helped >= 1,
      href: '/topluluk',
    },
    {
      id: `w-quest-${week}`,
      kind: 'haftalik',
      title: 'Bir açık kaynak ya da gelişim görevi bitir',
      why: 'Gerçek bir projeye katkı, profiline doğrulanmış iş olarak yazılır.',
      xp: 40,
      done: Math.min(questsThisWeek, 1),
      of: 1,
      complete: questsThisWeek >= 1,
      href: '/gorevler',
    },
  ];

  const seen = new Set<string>();
  const growth: Quest[] = [];
  // One quest per need, so three quests point at three different doors.
  for (const m of needsForPerson(state, person)) {
    const g = m.gaps.filter((x) => x.gain > 0 && !seen.has(x.skill)).sort((a, b) => b.gain - a.gain)[0];
    if (g && growth.length < 3) {
      seen.add(g.skill);
      growth.push({
        id: `g-${g.skill}`,
        kind: 'gelisim',
        title: `${skillLabel(g.skill)} alanında doğrulanmış bir iş ekle`,
        why: `“${m.need.title}” ihtiyacına uyumun ${m.score} → ${m.score + g.gain} olur.`,
        xp: 50,
        done: 0,
        of: 1,
        complete: false,
        href: '/kanit-bagla',
      });
    }
  }
  return [...weekly, ...growth];
}

// ---------------------------------------------------------------- community

export const POST_KIND: Record<Post['kind'], string> = {
  calisiyorum: 'Üzerinde çalışıyorum',
  soru: 'Soru',
  gosteri: 'Bitirdim',
  tesekkur: 'Teşekkür',
};

/** Who answered the most questions usefully this week. */
export function helpers(state: State, at = Date.now()) {
  const week = weekKey(at);
  const m = new Map<string, number>();
  for (const p of state.posts)
    for (const r of p.replies) if (r.helpful && weekKey(r.at) === week) m.set(r.personId, (m.get(r.personId) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([personId, n]) => ({ personId, n }));
}


// ---------------------------------------------------------------- journey

export interface Step {
  id: string;
  title: string;
  /** Why this step matters, in one sentence. */
  why: string;
  done: boolean;
  href: string;
  cta: string;
}

export interface Unit {
  id: string;
  title: string;
  sub: string;
  tone: 'indigo' | 'cyan' | 'purple';
  steps: Step[];
}

/**
 * The road from "I say I can" to "an institution signed that I did": the
 * product's whole thesis as a path. Every step is read from state.
 */
export function journey(state: State, person: Person): Unit[] {
  const s2 = person.evidence.filter((e) => e.level === 'S2' && !e.dispute).length;
  const s3 = person.evidence.filter((e) => e.level === 'S3').length;
  const p = progress(state, person);
  const helped = state.posts.some((post) => post.replies.some((r) => r.personId === person.id && r.helpful));
  const oss = state.quests.some((q) => q.personId === person.id && q.kind === 'oss');
  const pilots = state.pilots.filter((x) => x.personId === person.id);
  const step = (id: string, title: string, why: string, done: boolean, href: string, cta: string): Step => ({ id, title, why, done, href, cta });

  return [
    {
      id: 'u1',
      title: 'Beyandan kanıta',
      sub: 'Ne yaptığını göster, sistem doğrulasın.',
      tone: 'indigo',
      steps: [
        step('bagla', 'Hesabını bağla', 'GitHub hesabın ya da alan adın senin olduğunu kanıtladığında işlerin profiline akar.', Boolean(person.links.github || person.links.domain), '/kanit-bagla', 'Bağla'),
        step('dogrula', 'İlk doğrulanmış iş', 'Doğrulanmış iş, eşleşmede beyanın neredeyse üç katı ağırlık taşır.', s2 >= 1, '/kanit-bagla', 'İş ekle'),
        step('seri', 'Haftalık hedefini tuttur', 'Düzenli üretim yükselen sinyale girer; kurumlar ivmeyi görür.', p.streak >= 1, '/gorevler', 'Görevlere bak'),
      ],
    },
    {
      id: 'u2',
      title: 'Ağın içinde',
      sub: 'Yardım et, kurumla ilk projeni aç.',
      tone: 'cyan',
      steps: [
        step('yardim', 'Birine yardım et', 'Toplulukta işe yarayan bir cevap, bildiğin şeyin kanıtıdır.', helped, '/topluluk', 'Topluluğa git'),
        step('pilot', 'İlk projen', 'Bir kurum ihtiyacına seçilip pilot açtığında gerçek iş başlar.', pilots.length > 0, '/bugun#ihtiyaclar', 'İhtiyaçlara bak'),
        step('onay', 'İlk kurum onayı', 'Kurumun onayladığı aşama profiline en güçlü kanıt olarak yazılır.', s3 >= 1, pilots[0] ? `/pilotlar/${pilots[0].id}` : '/bugun', 'Projeye git'),
      ],
    },
    {
      id: 'u3',
      title: 'Zirveye',
      sub: 'Açık kaynağa katkı ver, işini kanıtla.',
      tone: 'purple',
      steps: [
        step('oss', 'Açık kaynağa katkı', 'Birleştirilen bir PR, başkasının senin işini onayladığı anlamına gelir.', oss, '/gorevler#acik-kaynak', 'Görev seç'),
        step('uc-onay', 'Üç kurum onayı', 'Üç ayrı onay, tek bir başarının tesadüf olmadığını gösterir.', s3 >= 3, pilots[0] ? `/pilotlar/${pilots[0].id}` : '/bugun', 'Projeye git'),
        step('zirve', 'Başarıyla kapanan proje', 'Kriterlerin hepsi iki tarafça onaylandı: nirengi noktan artık sabit.', pilots.some((x) => x.status === 'succeeded'), pilots[0] ? `/pilotlar/${pilots[0].id}` : '/bugun', 'Projeye git'),
      ],
    },
  ];
}
