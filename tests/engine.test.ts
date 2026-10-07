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
