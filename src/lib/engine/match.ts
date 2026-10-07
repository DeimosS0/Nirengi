// Explainable matching. Every number shown in the UI is produced here from the
// evidence graph; no score is stored or hand-written.

import type { Evidence, Need, Org, Person, Pilot, State } from '../types.ts';
import { LEVELS, SECTOR, SCALE } from '../labels.ts';
import { norm, skillLabel, skillsInText } from '../skills.ts';

export const WEIGHTS = { evidence: 0.45, context: 0.2, capacity: 0.15, history: 0.2 } as const;
export const VERIFIED_FLOOR = LEVELS.S2.weight;

// ---------------------------------------------------------------- integrity

export interface Conflict {
  evidenceId: string;
  personId: string;
  ownerId: string;
}

const fingerprint = (e: Evidence) => (e.url ? norm(e.url).replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '') : '');

/**
 * Copy-portfolio detection: when two people claim the same artefact, the one
 * holding the stronger verification keeps it and the other claim is flagged.
 */
export function findConflicts(people: Person[]): Map<string, Conflict> {
  const byPrint = new Map<string, { person: Person; ev: Evidence }[]>();
  for (const person of people)
    for (const ev of person.evidence) {
      const fp = fingerprint(ev);
      if (!fp) continue;
      byPrint.set(fp, [...(byPrint.get(fp) ?? []), { person, ev }]);
    }
  const out = new Map<string, Conflict>();
  for (const claims of byPrint.values()) {
    const owners = new Set(claims.map((c) => c.person.id));
    if (owners.size < 2) continue;
    const owner = claims.reduce((a, b) => (LEVELS[b.ev.level].weight > LEVELS[a.ev.level].weight ? b : a));
    for (const c of claims)
      if (c.person.id !== owner.person.id)
        out.set(c.ev.id, { evidenceId: c.ev.id, personId: c.person.id, ownerId: owner.person.id });
  }
  return out;
}

/** Effective weight: level weight, zeroed for copied work, halved while disputed. */
export function evidenceWeight(e: Evidence, conflicts?: Map<string, Conflict>): number {
  if (conflicts?.has(e.id)) return 0;
  const w = LEVELS[e.level].weight;
  return e.dispute ? w / 2 : w;
}

// ---------------------------------------------------------------- matching

export interface SkillCoverage {
  skill: string;
  score: number;
  count: number;
  verified: number;
  best?: Evidence;
}

export interface Gap {
  skill: string;
  kind: 'none' | 'claim';
  gain: number; // score points gained if one S2 artefact is added
}

export interface Match {
  person: Person;
  need: Need;
  score: number;
  parts: { evidence: number; context: number; capacity: number; history: number };
  coverage: SkillCoverage[];
  reasons: string[];
  gaps: Gap[];
  pilots: { succeeded: number; approvedMilestones: number };
}

const CAPACITY = { open: 1, partial: 0.6, closed: 0.15 } as const;
export const NEUTRAL = 0.4;

export function coverageFor(person: Person, skill: string, conflicts?: Map<string, Conflict>): SkillCoverage {
  const rel = person.evidence
    .filter((e) => e.skills.includes(skill))
    .map((e) => ({ e, w: evidenceWeight(e, conflicts) }))
    .filter((x) => x.w > 0)
    .sort((a, b) => b.w - a.w);
  const verified = rel.filter((x) => x.w >= VERIFIED_FLOOR).length;
  const best = rel[0];
  const score = best ? Math.min(1, best.w + 0.1 * Math.max(0, verified - 1)) : 0;
  return { skill, score, count: rel.length, verified, best: best?.e };
}

function pilotHistory(person: Person, pilots: Pilot[]) {
  const mine = pilots.filter((p) => p.personId === person.id);
  return {
    succeeded: mine.filter((p) => p.status === 'succeeded').length,
    approvedMilestones: mine.reduce((n, p) => n + p.milestones.filter((m) => m.state === 'approved').length, 0),
  };
}

const combine = (p: Match['parts']) =>
  Math.round(
    100 *
      (WEIGHTS.evidence * p.evidence + WEIGHTS.context * p.context + WEIGHTS.capacity * p.capacity + WEIGHTS.history * p.history),
  );

export function scoreMatch(person: Person, need: Need, org: Org, pilots: Pilot[], conflicts?: Map<string, Conflict>): Match {
  const coverage = need.skills.map((s) => coverageFor(person, s, conflicts));
  const evidence = coverage.length ? coverage.reduce((a, c) => a + c.score, 0) / coverage.length : 0;

  const ctxEv = person.evidence.filter((e) => e.context && evidenceWeight(e, conflicts) >= VERIFIED_FLOOR);
  const sectorHit = ctxEv.find((e) => e.context?.sector === org.sector);
  const scaleHit = ctxEv.find((e) => e.context?.scale === org.scale);
  // Context and history start from a neutral baseline: having no track record
  // yet must not punish a newcomer — only verified evidence raises them.
  const context = NEUTRAL + (sectorHit ? 0.35 : 0) + (scaleHit ? 0.25 : 0);

  const capacity = CAPACITY[person.availability];
  const hist = pilotHistory(person, pilots);
  const history = NEUTRAL + (1 - NEUTRAL) * Math.min(1, 0.35 * hist.succeeded + 0.15 * hist.approvedMilestones);

  const parts = { evidence, context, capacity, history };
  const score = combine(parts);

  const reasons: string[] = [];
  const strong = coverage.filter((c) => c.verified > 0).sort((a, b) => b.score - a.score);
  for (const c of strong.slice(0, 3)) {
    const lvl = c.best!.level;
    reasons.push(
      `${skillLabel(c.skill)} alanında ${c.verified} doğrulanmış üretim — en güçlüsü “${c.best!.title.split(' — ')[0]}” (${lvl})`,
    );
  }
  if (hist.succeeded || hist.approvedMilestones)
    reasons.push(
      `${hist.succeeded ? `${hist.succeeded} başarıyla kapanmış pilot, ` : ''}${hist.approvedMilestones} çift onaylı kilometre taşı`,
    );
  if (sectorHit) reasons.push(`${SECTOR[org.sector]} sektöründe doğrulanmış iş (“${sectorHit.title.split(' — ')[0]}”)`);
  else if (scaleHit) reasons.push(`Benzer ölçekte (${SCALE[org.scale]}) doğrulanmış iş`);
  if (person.availability !== 'closed') reasons.push(`Haftada ${person.weeklyHours} saat ayırabiliyor`);

  const gaps: Gap[] = coverage
    .filter((c) => c.score < VERIFIED_FLOOR)
    .map((c) => {
      const filled = { ...parts, evidence: evidence + (VERIFIED_FLOOR - c.score) / coverage.length };
      return { skill: c.skill, kind: c.count ? 'claim' : 'none', gain: combine(filled) - score };
    });

  return { person, need, score, parts, coverage, reasons, gaps, pilots: hist };
}

export function rankCandidates(state: State, need: Need, conflicts = findConflicts(state.people)): Match[] {
  const org = state.orgs.find((o) => o.id === need.orgId)!;
  return state.people
    .map((p) => scoreMatch(p, need, org, state.pilots, conflicts))
    .sort((a, b) => b.score - a.score);
}

export function needsForPerson(state: State, person: Person): Match[] {
  const conflicts = findConflicts(state.people);
  return state.needs
    .filter((n) => n.status === 'published')
    .map((n) => scoreMatch(person, n, state.orgs.find((o) => o.id === n.orgId)!, state.pilots, conflicts))
    .sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------- teams

export interface Team {
  members: Person[];
  coverage: { skill: string; score: number; by?: Person }[];
  total: number;
}

/** Greedy set cover: add whoever closes the most remaining skill surface. */
export function composeTeam(state: State, need: Need, maxSize = 3): Team {
  const conflicts = findConflicts(state.people);
  const pool = state.people.filter((p) => p.availability !== 'closed');
  const cov = (p: Person) => need.skills.map((s) => coverageFor(p, s, conflicts).score);
  const members: Person[] = [];
  let best = need.skills.map(() => 0);
  let byIdx: (Person | undefined)[] = need.skills.map(() => undefined);

  while (members.length < maxSize) {
    let pick: Person | undefined;
    let pickGain = 0;
    for (const p of pool) {
      if (members.includes(p)) continue;
      const c = cov(p);
      const gain = c.reduce((g, v, i) => g + Math.max(0, v - best[i]), 0);
      if (gain > pickGain + 1e-9) {
        pick = p;
        pickGain = gain;
      }
    }
    if (!pick || pickGain < 0.05) break;
    const c = cov(pick);
    byIdx = byIdx.map((b, i) => (c[i] > best[i] ? pick : b));
    best = best.map((v, i) => Math.max(v, c[i]));
    members.push(pick);
    if (best.every((v) => v >= VERIFIED_FLOOR)) break;
  }
  const coverage = need.skills.map((skill, i) => ({ skill, score: best[i], by: byIdx[i] }));
  return { members, coverage, total: coverage.reduce((a, c) => a + c.score, 0) / Math.max(1, coverage.length) };
}

// ---------------------------------------------------------------- momentum

const DAY = 86_400_000;

/** Rising signal: verified output in the last 90 days vs. the 9 months before. */
export function momentum(person: Person) {
  const t = Date.now();
  let recent = 0;
  let prior = 0;
  for (const e of person.evidence) {
    const age = (t - Date.parse(e.producedAt)) / DAY;
    const w = LEVELS[e.level].weight;
    if (age <= 90) recent += w;
    else if (age <= 365) prior += w;
  }
  const ratio = recent / (prior / 3 + 0.5);
  return { recent, prior, ratio, rising: recent >= 1.5 && ratio >= 1.5 };
}

// ---------------------------------------------------------------- problem search

export interface SearchHit {
  person: Person;
  score: number;
  skills: string[];
  evidence: Evidence[];
}

const stem = (w: string) => w.slice(0, Math.min(w.length, 6));
const STOP = new Set(['biri', 'birini', 'olan', 'için', 'daha', 'önce', 'çözmüş', 'yapmış', 'arıyoruz', 'üretimde', 'eden', 'gibi', 'kişi']);

/** "Problemle arama": free text → skills + stemmed terms, ranked by evidence weight. */
export function searchByProblem(state: State, query: string): SearchHit[] {
  const q = norm(query);
  if (!q) return [];
  const skills = skillsInText(q);
  const terms = q
    .split(/[^a-zçğıöşü0-9]+/)
    .filter((w) => w.length >= 4 && !STOP.has(w))
    .map(stem);
  const conflicts = findConflicts(state.people);

  return state.people
    .map((person) => {
      const hits: Evidence[] = [];
      let score = 0;
      for (const e of person.evidence) {
        const w = evidenceWeight(e, conflicts);
        if (!w) continue;
        const text = norm(`${e.title} ${e.summary}`);
        const sk = e.skills.filter((s) => skills.includes(s)).length;
        const tm = terms.filter((t) => text.includes(t)).length;
        if (!sk && !tm) continue;
        hits.push(e);
        score += w * (sk + 0.6 * tm);
      }
      const matched = skills.filter((s) => person.evidence.some((e) => e.skills.includes(s)));
      return { person, score, skills: matched, evidence: hits };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------- memory

/** Ecosystem memory: earlier needs with overlapping skills and how they ended. */
export function similarNeeds(state: State, skills: string[], excludeId?: string) {
  return state.needs
    .filter((n) => n.id !== excludeId && (n.status === 'closed' || n.status === 'piloting'))
    .map((n) => {
      const overlap = n.skills.filter((s) => skills.includes(s));
      const pilot = state.pilots.find((p) => p.needId === n.id);
      return { need: n, overlap, pilot, org: state.orgs.find((o) => o.id === n.orgId)! };
    })
    .filter((x) => x.overlap.length > 0)
    .sort((a, b) => b.overlap.length - a.overlap.length)
    .slice(0, 3);
}
