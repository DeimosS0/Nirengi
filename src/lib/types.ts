// Core domain model: three objects — Evidence (Kanıt), Need (İhtiyaç), Pilot.
// Everything else (matches, scores, network health) is derived from these.

export type Level = 'S1' | 'S2' | 'S3';
export type Scale = 'girisim' | 'kobi' | 'kurumsal' | 'kamu';
export type Sector =
  | 'lojistik'
  | 'fintek'
  | 'oyun'
  | 'saglik'
  | 'kamu'
  | 'uretim'
  | 'egitim'
  | 'eticaret';

export type EvidenceSource =
  | 'github'
  | 'domain'
  | 'npm'
  | 'store'
  | 'doi'
  | 'behance'
  | 'figma'
  | 'pilot'
  | 'endorsement'
  | 'claim';

export interface Metric {
  label: string;
  value: string;
}

export interface Evidence {
  id: string;
  title: string;
  summary: string;
  source: EvidenceSource;
  level: Level;
  skills: string[]; // canonical skill keys, see skills.ts
  url?: string;
  metrics?: Metric[];
  producedAt: string; // when the work happened (drives momentum)
  verifiedAt?: string;
  verifier?: string; // "GitHub API · bio sınaması", "DNS TXT", "Kuzey Lojistik · CTO"
  context?: { sector?: Sector; scale?: Scale };
  pilotId?: string;
  dispute?: { at: string; by: string; reason: string };
}

export type Availability = 'open' | 'partial' | 'closed';

export interface Person {
  id: string;
  handle: string;
  name: string;
  headline: string;
  city: string;
  age: number;
  school: string;
  bio: string;
  availability: Availability;
  weeklyHours: number;
  joinedAt: string;
  evidence: Evidence[];
  links: { github?: string; domain?: string; web?: string };
  isDemoUser?: boolean;
  /** Local days (YYYY-MM-DD) with public output read from GitHub events. */
  activity?: string[];
  weeklyGoal?: WeeklyGoal;
  /** Monday keys (YYYY-MM-DD) of weeks announced as rest: the streak pauses, never breaks. */
  restWeeks?: string[];
  /** League tier index, see TIERS in engine/progress.ts. */
  tier?: number;
}

export type WeeklyGoal = 1 | 3 | 5;

/** League member who exists only to fill a demo league; never matched or shown elsewhere. */
export interface Peer {
  id: string;
  name: string;
  area: string;
  tier: number;
  /** Weekly XP, index 0 = the seeding week, 1 = the week before… */
  weekly: number[];
}

export type QuestKind = 'oss' | 'gelisim' | 'haftalik';

export interface QuestDone {
  id: string;
  questId: string;
  personId: string;
  kind: QuestKind;
  title: string;
  xp: number;
  at: string;
  proof?: string;
}

export type PostKind = 'calisiyorum' | 'soru' | 'gosteri' | 'tesekkur';

export interface Reply {
  id: string;
  personId: string;
  text: string;
  at: string;
  helpful?: boolean;
}

export interface Post {
  id: string;
  personId: string;
  kind: PostKind;
  text: string;
  at: string;
  evidenceId?: string;
  supports: string[];
  replies: Reply[];
}

export interface Org {
  id: string;
  name: string;
  sector: Sector;
  scale: Scale;
  city: string;
  about: string;
}

export interface Criterion {
  id: string;
  text: string;
}

export type ConstraintKind = 'butce' | 'veri' | 'mevzuat' | 'sure' | 'teknoloji';

export interface Constraint {
  kind: ConstraintKind;
  text: string;
}

export interface Canvas {
  current: string;
  pain: string;
  painMetric: string;
  outcome: string;
  criteria: Criterion[];
  constraints: Constraint[];
  decisionMaker: string;
  scope: string;
}

export type NeedStatus = 'draft' | 'published' | 'piloting' | 'closed';

export interface Need {
  id: string;
  orgId: string;
  title: string;
  status: NeedStatus;
  createdAt: string;
  publishedAt?: string;
  canvas: Canvas;
  skills: string[];
  round: string; // quarterly "ihtiyaç turu", e.g. "2026·Ç4"
  createdInDemo?: boolean;
}

export type Side = 'person' | 'org';

export interface Milestone {
  id: string;
  criterionId: string;
  title: string;
  due: string;
  state: 'open' | 'submitted' | 'approved';
  submittedNote?: string;
  approvals: { person?: string; org?: string };
}

export type LogKind = 'open' | 'update' | 'decision' | 'blocker' | 'submit' | 'approve' | 'revise' | 'close' | 'nudge';

export interface LogEntry {
  id: string;
  at: string;
  actor: Side | 'system';
  kind: LogKind;
  text: string;
  prev: string;
  hash: string;
}

export type PilotStatus = 'active' | 'succeeded' | 'failed';

export interface Pilot {
  id: string;
  needId: string;
  orgId: string;
  personId: string;
  title: string;
  status: PilotStatus;
  startedAt: string;
  closedAt?: string;
  closure?: { reason: string; summary: string; publicConsent: { person: boolean; org: boolean } };
  milestones: Milestone[];
  log: LogEntry[];
}

export type EventKind =
  | 'evidence_verified'
  | 'milestone_approved'
  | 'need_published'
  | 'pilot_opened'
  | 'pilot_closed'
  | 'micro'
  | 'person_joined'
  | 'quest_done';

export interface NetEvent {
  id: string;
  at: string;
  kind: EventKind;
  text: string;
  personId?: string;
  orgId?: string;
  needId?: string;
  pilotId?: string;
}

export type Persona = 'org' | 'person';

export interface DemoFlags {
  viewedMatchesFor?: string;
  viewedProfileAfterApproval?: boolean;
}

export interface State {
  version: number;
  seededAt: string;
  people: Person[];
  orgs: Org[];
  needs: Need[];
  pilots: Pilot[];
  events: NetEvent[];
  quests: QuestDone[];
  posts: Post[];
  peers: Peer[];
  demo: DemoFlags;
}
