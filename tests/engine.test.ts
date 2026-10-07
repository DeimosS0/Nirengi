import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { buildSeed } from '../src/lib/seed.ts';
import { sha256, appendEntry, verifyChain } from '../src/lib/engine/ledger.ts';
import { rankCandidates, findConflicts, searchByProblem, composeTeam, momentum, scoreMatch } from '../src/lib/engine/match.ts';
import { assessCanvas, draftFromText, SAMPLE_COMPLAINT, PUBLISH_THRESHOLD } from '../src/lib/engine/canvas.ts';
import { skillsInText } from '../src/lib/skills.ts';

test('sha256 matches node:crypto', () => {
  for (const s of ['', 'abc', 'Nirengi İğüşöç', 'x'.repeat(119)])
    assert.equal(sha256(s), createHash('sha256').update(s).digest('hex'));
});

test('ledger detects tampering', () => {
  let log = appendEntry([], { at: '2026-10-01T00:00:00Z', actor: 'system', kind: 'open', text: 'açıldı' });
  log = appendEntry(log, { at: '2026-10-02T00:00:00Z', actor: 'org', kind: 'decision', text: 'karar' });
  log = appendEntry(log, { at: '2026-10-03T00:00:00Z', actor: 'person', kind: 'update', text: 'güncelleme' });
  assert.equal(verifyChain(log), -1);
  const forged = structuredClone(log);
  forged[1].text = 'değiştirilmiş karar';
  assert.equal(verifyChain(forged), 1);
});

test('seed ledgers are intact', () => {
  for (const p of buildSeed().pilots) assert.equal(verifyChain(p.log), -1, p.id);
});

test('ranking puts the evidence-backed candidate first and explains why', () => {
  const s = buildSeed();
  const need = s.needs.find((n) => n.id === 'n-sikayet')!;
  const [top] = rankCandidates(s, need);
  assert.equal(top.person.id, 'p-zeynep');
  assert.ok(top.score >= 50 && top.score <= 100);
  assert.ok(top.reasons.some((r) => r.includes('Türkçe NLP')));
});

test('unverified claims can never reach verified weight', () => {
  const s = buildSeed();
  const org = s.orgs[0];
  const need = { ...s.needs[0], skills: ['rust'] };
  const can = s.people.find((p) => p.id === 'p-can')!; // Rust only as S1 claim
  const m = scoreMatch(can, need, org, s.pilots);
  assert.equal(m.coverage[0].score, 0.3);
  assert.equal(m.gaps[0].kind, 'claim');
  assert.ok(m.gaps[0].gain > 0);
});

test('copy-portfolio detection flags the weaker claimant', () => {
  const conflicts = findConflicts(buildSeed().people);
  const c = conflicts.get('e-kaan-3');
  assert.ok(c);
  assert.equal(c!.ownerId, 'p-defne');
});

test('problem search finds work, not titles', () => {
  const hits = searchByProblem(buildSeed(), 'yüksek trafikli dosya dağıtımını üretimde çözmüş biri');
  assert.equal(hits[0].person.id, 'p-can');
});

test('team composition covers more surface than any single person', () => {
  const s = buildSeed();
  const need = s.needs.find((n) => n.id === 'n-otopark')!;
  const team = composeTeam(s, need);
  const best = rankCandidates(s, need)[0];
  assert.ok(team.members.length >= 2);
  assert.ok(team.total > best.parts.evidence);
});

test('momentum marks recent producers as rising', () => {
  const s = buildSeed();
  assert.equal(momentum(s.people.find((p) => p.id === 'p-baran')!).rising, true);
  assert.equal(momentum(s.people.find((p) => p.id === 'p-emir')!).rising, false);
});

test('vague canvas cannot be published; seeded ones can', () => {
  const s = buildSeed();
  const vague = s.needs.find((n) => n.id === 'n-erisim')!;
  const a = assessCanvas(vague.canvas, vague.skills);
  assert.equal(a.canPublish, false);
  assert.ok(a.blockers.some((b) => b.id === 'decisionMaker'));
  assert.ok(a.blockers.some((b) => b.id === 'criteriaMeasurable'));
  for (const n of s.needs.filter((x) => x.status !== 'draft')) {
    const r = assessCanvas(n.canvas, n.skills);
    assert.ok(r.canPublish && r.score >= PUBLISH_THRESHOLD, n.id);
  }
});

test('draft extractor fills fields and asks only for the rest', () => {
  const d = draftFromText(SAMPLE_COMPLAINT);
  assert.ok(d.canvas.painMetric.includes('%40'));
  assert.ok(d.canvas.pain.length > 0 && d.canvas.outcome.includes('canlı haritada'));
  assert.ok(d.canvas.current.includes('GPS'));
  assert.ok(d.canvas.constraints.some((c) => c.kind === 'butce'));
  assert.ok(d.canvas.constraints.some((c) => c.kind === 'mevzuat'));
  assert.ok(d.skills.includes('maps') && d.skills.includes('realtime'));
  assert.ok(d.questions.length >= 3 && d.questions.length <= 5);
});

test('short skill aliases need word boundaries', () => {
  assert.deepEqual(skillsInText('Go ile yazılmış servis').includes('go'), true);
  assert.equal(skillsInText('Google ile görüştük').includes('go'), false);
});

// ---------------------------------------------------------------- progress

import { progress, xpEvents, weekKey, dayKey, league, questsFor, XP, TIERS } from '../src/lib/engine/progress.ts';

const at = (iso: string) => new Date(iso).getTime();

test('weeks run Monday to Sunday', () => {
  assert.equal(weekKey('2026-10-07T10:00:00'), '2026-10-05'); // Wednesday
  assert.equal(weekKey('2026-10-11T23:00:00'), '2026-10-05'); // Sunday
  assert.equal(weekKey('2026-10-12T01:00:00'), '2026-10-12'); // next Monday
});

test('weekly goal counts days with output, not volume', () => {
  const s = buildSeed();
  const p = structuredClone(s.people.find((x) => x.id === 'p-can')!);
  p.evidence = [];
  p.weeklyGoal = 3;
  // Ten pushes on one day are still one day.
  p.activity = ['2026-10-05', '2026-10-05', '2026-10-05'];
  const one = progress({ ...s, quests: [], posts: [] }, p, at('2026-10-07T12:00:00'));
  assert.equal(one.active, 1);
  assert.equal(one.met, false);
  p.activity = ['2026-10-05', '2026-10-06', '2026-10-07'];
  const three = progress({ ...s, quests: [], posts: [] }, p, at('2026-10-07T12:00:00'));
  assert.equal(three.active, 3);
  assert.equal(three.met, true);
  assert.deepEqual(three.days.map((d) => d.active), [true, true, true, false, false, false, false]);
});

test('a rest week pauses the streak instead of breaking it', () => {
  const s = { ...buildSeed(), quests: [], posts: [] };
  const p = structuredClone(s.people.find((x) => x.id === 'p-can')!);
  p.evidence = [];
  p.weeklyGoal = 1;
  // Weeks of 14 Sep and 28 Sep met, week of 21 Sep empty.
  p.activity = ['2026-09-15', '2026-09-29'];
  const now = at('2026-10-07T12:00:00');
  assert.equal(progress(s, p, now).streak, 1, 'an unfinished current week does not break the streak yet');
  p.activity.push('2026-10-06');
  assert.equal(progress(s, p, now).streak, 2, 'current + 28 Sep, broken at 21 Sep');
  p.restWeeks = ['2026-09-21'];
  assert.equal(progress(s, p, now).streak, 3, 'rest week skipped: current + 28 Sep + 14 Sep');
});

test('daily XP is capped so one night cannot buy a week', () => {
  const s = buildSeed();
  const p = structuredClone(s.people.find((x) => x.id === 'p-can')!);
  p.activity = [];
  p.evidence = Array.from({ length: 10 }, (_, i) => ({
    id: `e${i}`, title: `repo ${i}`, summary: '', source: 'github' as const, level: 'S2' as const, skills: [],
    producedAt: '2026-10-06T10:00:00', verifiedAt: '2026-10-06T10:00:00',
  }));
  const st = { ...s, quests: [], posts: [] };
  assert.equal(xpEvents(st, p).reduce((n, e) => n + e.xp, 0), 10 * XP.evidence);
  assert.equal(progress(st, p, at('2026-10-07T12:00:00')).xpWeek, XP.dailyCap);
});

test('chatter earns a little XP but never counts as a productive day', () => {
  const s = buildSeed();
  const p = structuredClone(s.people.find((x) => x.id === 'p-can')!);
  p.activity = [];
  p.evidence = [];
  const st = { ...s, quests: [], posts: [{ id: 'x', personId: p.id, kind: 'calisiyorum' as const, text: 't', at: '2026-10-06T10:00:00', supports: ['a', 'b'], replies: [] }] };
  const pr = progress(st, p, at('2026-10-07T12:00:00'));
  assert.equal(pr.active, 0);
  assert.equal(pr.xpWeek, XP.post + 2 * XP.support);
});

test('league groups by tier, ranks by weekly XP and marks the zones', () => {
  const s = buildSeed();
  const me = s.people.find((x) => x.id === 'p-can')!;
  const l = league(s, me);
  assert.equal(l.name, TIERS[me.tier!]);
  assert.ok(l.rows.length >= 15);
  assert.ok(l.rows.every((r, i, a) => i === 0 || a[i - 1].xp >= r.xp));
  assert.ok(l.rows.slice(0, 5).every((r) => r.zone === 'up'));
  assert.ok(l.rows.some((r) => r.personId === me.id));
});

test('growth quests name the need they move you toward', () => {
  const s = buildSeed();
  const q = questsFor(s, s.people.find((x) => x.id === 'p-can')!);
  assert.equal(q.filter((x) => x.kind === 'haftalik').length, 3);
  const growth = q.filter((x) => x.kind === 'gelisim');
  assert.ok(growth.length > 0);
  assert.ok(growth.every((g) => /ihtiyacına uyumun \d+ → \d+/.test(g.why)));
});

test('dayKey is local and zero padded', () => {
  assert.equal(dayKey(new Date(2026, 0, 5, 9)), '2026-01-05');
});
