// Client-side store shared by every island on a page and synced across tabs.
// Shared state lives in localStorage; the viewer's role (kurum / yetenek) and
// blind-mode preference are per-tab so two windows can play both sides live.

import { useSyncExternalStore } from 'react';
import type { Canvas, Evidence, LogEntry, NetEvent, Persona, Person, Pilot, Post, QuestDone, State, WeeklyGoal } from './types.ts';
import { buildSeed, ROUND, STATE_VERSION } from './seed.ts';
import { appendEntry } from './engine/ledger.ts';
import { daysFromNow, now, uid } from './format.ts';

const KEY = 'nirengi:state';
const VIEW_KEY = 'nirengi:view';

// ---------------------------------------------------------------- state

let state: State | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed.version === STATE_VERSION) return parsed;
    }
  } catch {
    /* corrupted or unavailable storage → fresh seed */
  }
  const seed = buildSeed();
  persist(seed);
  return seed;
}

function persist(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode: keep in memory only */
  }
}

export function getState(): State {
  if (!state) state = typeof window === 'undefined' ? buildSeed() : load();
  return state;
}

function commit(recipe: (draft: State) => void) {
  const draft = structuredClone(getState());
  recipe(draft);
  state = draft;
  persist(draft);
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = null;
      emit();
    }
  });
}

export const useAppState = () => useSyncExternalStore(subscribe, getState, getState);

// ---------------------------------------------------------------- view (per tab)

export interface View {
  persona: Persona;
  blind: boolean;
  revealed: string[]; // people the kurum has made first contact with
  /** Which demo institution this tab acts as on the kurum side. */
  orgId: string;
}

let view: View | null = null;
const viewListeners = new Set<() => void>();

function getView(): View {
  if (view) return view;
  view = { persona: 'person', blind: true, revealed: [], orgId: 'o-kuzey' };
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(VIEW_KEY) ?? localStorage.getItem(VIEW_KEY);
      if (raw) view = { ...view, ...(JSON.parse(raw) as Partial<View>) };
    } catch {
      /* defaults */
    }
  }
  return view;
}

export function setView(patch: Partial<View>) {
  view = { ...getView(), ...patch };
  try {
    sessionStorage.setItem(VIEW_KEY, JSON.stringify(view));
    localStorage.setItem(VIEW_KEY, JSON.stringify(view));
  } catch {
    /* ignore */
  }
  viewListeners.forEach((l) => l());
}

const subscribeView = (l: () => void) => {
  viewListeners.add(l);
  return () => viewListeners.delete(l);
};

export const useView = () => useSyncExternalStore(subscribeView, getView, getView);

// ---------------------------------------------------------------- helpers

const event = (s: State, e: Omit<NetEvent, 'id' | 'at'>) => s.events.unshift({ id: uid('ev'), at: now(), ...e });

const log = (p: Pilot, actor: LogEntry['actor'], kind: LogEntry['kind'], text: string) => {
  p.log = appendEntry(p.log, { at: now(), actor, kind, text });
};

const pilotOf = (s: State, id: string) => s.pilots.find((p) => p.id === id)!;

// ---------------------------------------------------------------- actions

export const actions = {
  reset() {
    state = buildSeed();
    persist(state);
    emit();
  },

  upsertDemoUser(person: Person) {
    commit((s) => {
      const existing = s.people.findIndex((p) => p.isDemoUser);
      if (existing >= 0) s.people[existing] = { ...person, id: s.people[existing].id };
      else {
        s.people.unshift(person);
        event(s, { kind: 'person_joined', text: `${person.name} NİRENGİ’ye katıldı ve kanıtlarını bağladı.`, personId: person.id });
      }
      const verified = person.evidence.filter((e) => e.level !== 'S1').length;
      if (verified)
        event(s, {
          kind: 'evidence_verified',
          text: `${person.name}: ${verified} kanıt makine doğrulamasıyla işlendi (Doğrulandı).`,
          personId: person.id,
        });
    });
  },

  addEvidence(personId: string, ev: Evidence) {
    commit((s) => {
      const p = s.people.find((x) => x.id === personId)!;
      p.evidence.unshift(ev);
      if (ev.level !== 'S1')
        event(s, { kind: 'evidence_verified', text: `Kanıt doğrulandı (${ev.level}): “${ev.title}” — ${p.name}.`, personId });
    });
  },

  dispute(personId: string, evidenceId: string, reason: string, by: string) {
    commit((s) => {
      const ev = s.people.find((p) => p.id === personId)!.evidence.find((e) => e.id === evidenceId)!;
      ev.dispute = { at: now(), by, reason };
    });
  },

  withdrawDispute(personId: string, evidenceId: string) {
    commit((s) => {
      const ev = s.people.find((p) => p.id === personId)!.evidence.find((e) => e.id === evidenceId)!;
      delete ev.dispute;
    });
  },

  saveNeed(input: { id?: string; orgId: string; title: string; canvas: Canvas; skills: string[] }): string {
    const id = input.id ?? uid('n');
    commit((s) => {
      const existing = s.needs.find((n) => n.id === id);
      if (existing) Object.assign(existing, { orgId: input.orgId, title: input.title, canvas: input.canvas, skills: input.skills });
      else
        s.needs.unshift({
          id,
          orgId: input.orgId,
          title: input.title,
          canvas: input.canvas,
          skills: input.skills,
          status: 'draft',
          createdAt: now(),
          round: ROUND,
          createdInDemo: true,
        });
    });
    return id;
  },

  publishNeed(id: string) {
    commit((s) => {
      const n = s.needs.find((x) => x.id === id)!;
      n.status = 'published';
      n.publishedAt = now();
      const org = s.orgs.find((o) => o.id === n.orgId)!;
      event(s, { kind: 'need_published', text: `${org.name} yeni ihtiyaç yayımladı: “${n.title}”.`, orgId: org.id, needId: n.id });
    });
  },

  openPilot(needId: string, personId: string): string {
    const id = uid('pl');
    commit((s) => {
      const need = s.needs.find((n) => n.id === needId)!;
      const person = s.people.find((p) => p.id === personId)!;
      const org = s.orgs.find((o) => o.id === need.orgId)!;
      const criteria = need.canvas.criteria.filter((c) => c.text.trim());
      const pilot: Pilot = {
        id,
        needId,
        orgId: org.id,
        personId,
        title: need.title,
        status: 'active',
        startedAt: now(),
        milestones: criteria.map((c, i) => ({
          id: uid('m'),
          criterionId: c.id,
          title: c.text,
          due: daysFromNow(14 * (i + 1)),
          state: 'open',
          approvals: {},
        })),
        log: [],
      };
      log(pilot, 'system', 'open', `Deneme projesi açıldı. İhtiyaç kartındaki ${criteria.length} başarı kriteri aşamaya dönüştü.`);
      s.pilots.unshift(pilot);
      need.status = 'piloting';
      event(s, { kind: 'pilot_opened', text: `${org.name} × ${person.name} deneme projesi açıldı.`, orgId: org.id, personId, pilotId: id, needId });
    });
    return id;
  },

  submitMilestone(pilotId: string, milestoneId: string, note: string) {
    commit((s) => {
      const p = pilotOf(s, pilotId);
      const m = p.milestones.find((x) => x.id === milestoneId)!;
      m.state = 'submitted';
      m.submittedNote = note || undefined;
      m.approvals.person = now();
      log(p, 'person', 'submit', `Kilometre taşı teslim edildi: ${m.title}${note ? ` — ${note}` : ''}`);
    });
  },

  approveMilestone(pilotId: string, milestoneId: string, note: string) {
    commit((s) => {
      const p = pilotOf(s, pilotId);
      const m = p.milestones.find((x) => x.id === milestoneId)!;
      const need = s.needs.find((n) => n.id === p.needId)!;
      const org = s.orgs.find((o) => o.id === p.orgId)!;
      const person = s.people.find((x) => x.id === p.personId)!;
      m.approvals.org = now();
      m.state = 'approved';
      log(p, 'org', 'approve', `Kurum onayı: ${m.title}${note ? ` — ${note}` : ''}`);
      log(p, 'system', 'approve', 'Çift onay tamamlandı → kişinin profiline Kurum onaylı kanıt olarak işlendi.');
      person.evidence.unshift({
        id: uid('e-pl'),
        title: `Kilometre taşı: ${m.title}`,
        summary: `${org.name} pilotunda iki tarafın onayıyla tamamlandı.${m.submittedNote ? ` Teslim notu: ${m.submittedNote}` : ''}`,
        source: 'pilot',
        level: 'S3',
        skills: need.skills,
        producedAt: now(),
        verifiedAt: now(),
        verifier: `${org.name} · ${need.canvas.decisionMaker || 'Karar verici'}`,
        context: { sector: org.sector, scale: org.scale },
        pilotId,
      });
      event(s, {
        kind: 'milestone_approved',
        text: `${org.name} × ${person.name}: “${m.title}” çift onaylandı.`,
        orgId: org.id,
        personId: person.id,
        pilotId,
      });
    });
  },

  requestRevision(pilotId: string, milestoneId: string, note: string) {
    commit((s) => {
      const p = pilotOf(s, pilotId);
      const m = p.milestones.find((x) => x.id === milestoneId)!;
      m.state = 'open';
      m.approvals = {};
      log(p, 'org', 'revise', `Revizyon istendi: ${m.title}${note ? ` — ${note}` : ''}`);
    });
  },

  addLog(pilotId: string, actor: 'person' | 'org', kind: LogEntry['kind'], text: string) {
    commit((s) => log(pilotOf(s, pilotId), actor, kind, text));
  },

  closePilot(pilotId: string, outcome: 'succeeded' | 'failed', reason: string, summary: string, consent: { person: boolean; org: boolean }) {
    commit((s) => {
      const p = pilotOf(s, pilotId);
      const org = s.orgs.find((o) => o.id === p.orgId)!;
      const person = s.people.find((x) => x.id === p.personId)!;
      const met = p.milestones.filter((m) => m.state === 'approved').length;
      p.status = outcome;
      p.closedAt = now();
      p.closure = { reason, summary, publicConsent: consent };
      log(p, 'system', 'close', `${outcome === 'succeeded' ? 'Pilot başarıyla kapandı' : 'Pilot gerekçesiyle kapandı'} (${met}/${p.milestones.length} kriter). ${reason}`);
      s.needs.find((n) => n.id === p.needId)!.status = 'closed';
      event(s, {
        kind: 'pilot_closed',
        text: `${org.name} × ${person.name} deneme projesi ${outcome === 'succeeded' ? 'başarıyla' : 'gerekçesiyle'} kapandı (${met}/${p.milestones.length} kriter).`,
        orgId: org.id,
        personId: person.id,
        pilotId,
      });
    });
  },

  micro(personId: string, orgId: string, text: string) {
    commit((s) => event(s, { kind: 'micro', text, personId, orgId }));
  },

  // ------------------------------------------------------------ progress

  setWeeklyGoal(personId: string, goal: WeeklyGoal) {
    commit((s) => {
      s.people.find((p) => p.id === personId)!.weeklyGoal = goal;
    });
  },

  /** Announce (or cancel) a rest week: the streak pauses instead of breaking. */
  toggleRestWeek(personId: string, week: string) {
    commit((s) => {
      const p = s.people.find((x) => x.id === personId)!;
      const set = new Set(p.restWeeks ?? []);
      if (set.has(week)) set.delete(week);
      else set.add(week);
      p.restWeeks = [...set];
    });
  },

  recordActivity(personId: string, days: string[]) {
    commit((s) => {
      const p = s.people.find((x) => x.id === personId)!;
      p.activity = [...new Set([...(p.activity ?? []), ...days])];
    });
  },

  completeQuest(done: Omit<QuestDone, 'id' | 'at'>, evidence?: Evidence) {
    commit((s) => {
      if (s.quests.some((q) => q.questId === done.questId && q.personId === done.personId)) return;
      s.quests.unshift({ ...done, id: uid('q'), at: now() });
      const p = s.people.find((x) => x.id === done.personId)!;
      if (evidence) p.evidence.unshift(evidence);
      event(s, { kind: 'quest_done', text: `${p.name} bir görev tamamladı: “${done.title}”.`, personId: p.id });
    });
  },

  // ------------------------------------------------------------ community

  addPost(personId: string, kind: Post['kind'], text: string, evidenceId?: string): string {
    const id = uid('post');
    commit((s) => {
      s.posts.unshift({ id, personId, kind, text, at: now(), evidenceId, supports: [], replies: [] });
    });
    return id;
  },

  toggleSupport(postId: string, personId: string) {
    commit((s) => {
      const p = s.posts.find((x) => x.id === postId)!;
      p.supports = p.supports.includes(personId) ? p.supports.filter((x) => x !== personId) : [...p.supports, personId];
    });
  },

  reply(postId: string, personId: string, text: string) {
    commit((s) => {
      s.posts.find((x) => x.id === postId)!.replies.push({ id: uid('r'), personId, text, at: now() });
    });
  },

  /** Only the asker can mark a reply as the one that helped. */
  markHelpful(postId: string, replyId: string) {
    commit((s) => {
      const r = s.posts.find((x) => x.id === postId)!.replies.find((x) => x.id === replyId)!;
      r.helpful = !r.helpful;
    });
  },

  flag(patch: State['demo']) {
    commit((s) => {
      s.demo = { ...s.demo, ...patch };
    });
  },
};

// ---------------------------------------------------------------- selectors

export const byId = {
  person: (s: State, id?: string) => s.people.find((p) => p.id === id),
  handle: (s: State, h?: string) => s.people.find((p) => p.handle === h),
  org: (s: State, id?: string) => s.orgs.find((o) => o.id === id),
  need: (s: State, id?: string) => s.needs.find((n) => n.id === id),
  pilot: (s: State, id?: string) => s.pilots.find((p) => p.id === id),
};

/** The young person this tab acts as: the connected demo user, else the seeded Can Aksoy. */
export const currentMe = (s: State) => s.people.find((p) => p.isDemoUser) ?? s.people.find((p) => p.id === 'p-can')!;

/** The institution this tab acts as on the kurum side. */
export const currentOrg = (s: State, v: View) => s.orgs.find((o) => o.id === v.orgId) ?? s.orgs[0];

export const lastActivity = (p: Pilot) => p.log[p.log.length - 1]?.at ?? p.startedAt;
export const SILENCE_DAYS = 7;
