// Open-source quests: real "good first issue" listings and merged-PR checks
// from GitHub's public search API. Nothing is invented; when GitHub cannot be
// reached the UI falls back to plain search links.

import type { Person } from './types.ts';
import { cleanHandle } from './verify.ts';

export interface OssIssue {
  id: number;
  title: string;
  url: string;
  /** owner/name */
  repo: string;
  labels: string[];
  comments: number;
  createdAt: string;
  updatedAt: string;
  language: string;
}

export interface MergedPr {
  url: string;
  title: string;
  mergedAt: string;
}

export type OssErrorKind = 'rate' | 'offline' | 'invalid' | 'unexpected';

export class OssError extends Error {
  kind: OssErrorKind;
  /** Minutes until the rate limit resets, when GitHub says so. */
  retryMin?: number;
  constructor(kind: OssErrorKind, retryMin?: number) {
    super(kind);
    this.kind = kind;
    this.retryMin = retryMin;
  }
}

// ---------------------------------------------------------------- languages

const LANGS = new Set(['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'C++', 'C#', 'Kotlin', 'Java', 'Dart', 'Swift', 'Vue', 'Svelte']);

/** Canonical skill → the GitHub language its work usually lives in. */
const SKILL_LANG: Record<string, string> = {
  go: 'Go',
  rust: 'Rust',
  python: 'Python',
  typescript: 'TypeScript',
  react: 'TypeScript',
  node: 'JavaScript',
  flutter: 'Dart',
  kotlin: 'Kotlin',
  cpp: 'C++',
  unity: 'C#',
  ml: 'Python',
  nlp: 'Python',
  data: 'Python',
};

const WEIGHT = { S1: 1, S2: 2, S3: 3 } as const;

/** The (at most two) languages a person's own evidence points at; verified work weighs more. */
export function ossLanguages(person: Person): string[] {
  const score = new Map<string, number>();
  for (const e of person.evidence) {
    if (e.dispute) continue;
    const dil = e.metrics?.find((m) => m.label === 'dil')?.value;
    const langs = dil && LANGS.has(dil) ? [dil] : e.skills.map((s) => SKILL_LANG[s]).filter(Boolean);
    for (const l of new Set(langs)) score.set(l, (score.get(l) ?? 0) + WEIGHT[e.level]);
  }
  const top = [...score].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([l]) => l);
  return top.length ? top : ['TypeScript', 'Python'];
}

/** The GitHub login behind `links.github`, whether it was stored as a login or a URL. */
export function githubLogin(person: Person): string | null {
  const h = person.links.github ? cleanHandle(person.links.github) : '';
  return /^[a-z\d][a-z\d-]{0,38}$/i.test(h) ? h : null;
}

const issueQuery = (lang: string) => `label:"good first issue" is:issue is:open no:assignee language:${lang}`;

/** A plain GitHub search page: the honest fallback when the API is out of reach. */
export const searchLink = (lang: string) => `https://github.com/search?${new URLSearchParams({ q: issueQuery(lang), type: 'issues' })}`;

// ---------------------------------------------------------------- api

interface RawItem {
  id: number;
  title: string;
  html_url: string;
  repository_url: string;
  labels: { name: string }[];
  comments: number;
  created_at: string;
  updated_at: string;
  pull_request?: { merged_at: string | null };
}

async function search(q: string, extra: Record<string, string>, fresh = false): Promise<RawItem[]> {
  let res: Response;
  try {
    res = await fetch(`https://api.github.com/search/issues?${new URLSearchParams({ q, ...extra })}`, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: fresh ? 'no-store' : 'default',
    });
  } catch {
    throw new OssError('offline');
  }
  if (res.status === 403 || res.status === 429) {
    const reset = Number(res.headers.get('x-ratelimit-reset'));
    throw new OssError('rate', reset ? Math.max(1, Math.ceil((reset * 1000 - Date.now()) / 60_000)) : 1);
  }
  if (res.status === 422) throw new OssError('invalid');
  if (!res.ok) throw new OssError('unexpected');
  return ((await res.json()) as { items: RawItem[] }).items;
}

// ---------------------------------------------------------------- good first issues

const TTL = 30 * 60_000;

const cached = (key: string): OssIssue[] | null => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { at, issues } = JSON.parse(raw) as { at: number; issues: OssIssue[] };
    return Date.now() - at < TTL ? issues : null;
  } catch {
    return null;
  }
};

const remember = (key: string, issues: OssIssue[]) => {
  try {
    sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), issues }));
  } catch {
    /* storage unavailable: just refetch next time */
  }
};

/**
 * Open good-first-issues for up to two languages (the search API allows 10
 * requests a minute without a token), newest activity first, interleaved so
 * both languages show up. Results are kept in sessionStorage for 30 minutes.
 */
export async function goodFirstIssues(languages: string[]): Promise<OssIssue[]> {
  const langs = languages.slice(0, 2);
  if (!langs.length) return [];
  const key = `nirengi:oss:${langs.join(',')}`;
  const hit = cached(key);
  if (hit) return hit;

  const settled = await Promise.allSettled(
    langs.map(async (language) =>
      (await search(issueQuery(language), { sort: 'updated', order: 'desc', per_page: '15' })).map(
        (x): OssIssue => ({
          id: x.id,
          title: x.title,
          url: x.html_url,
          repo: x.repository_url.replace('https://api.github.com/repos/', ''),
          labels: x.labels.map((l) => l.name),
          comments: x.comments,
          createdAt: x.created_at,
          updatedAt: x.updated_at,
          language,
        }),
      ),
    ),
  );
  const lists = settled.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
  if (!lists.length) throw (settled[0] as PromiseRejectedResult).reason;

  // A wide page, but at most two issues per repository, so one busy org cannot fill the list.
  const picked = lists.map((l) => {
    const perRepo = new Map<string, number>();
    return l.filter((x) => {
      const n = perRepo.get(x.repo) ?? 0;
      perRepo.set(x.repo, n + 1);
      return n < 2;
    });
  });
  const out: OssIssue[] = [];
  const seen = new Set<number>();
  for (let i = 0; out.length < 6 && picked.some((l) => i < l.length); i++)
    for (const l of picked) {
      const x = l[i];
      if (x && !seen.has(x.id) && out.length < 6) {
        seen.add(x.id);
        out.push(x);
      }
    }
  if (lists.length === langs.length) remember(key, out);
  return out;
}

// ---------------------------------------------------------------- merged PR

/**
 * The newest merged PR `login` has in `repo`, or null. `since` ties the PR to
 * the issue (it cannot have been merged before the issue existed) and `skip`
 * keeps one PR from paying out two quests.
 */
export async function checkMergedPr(login: string, repo: string, opts: { since?: string; skip?: string[] } = {}): Promise<MergedPr | null> {
  const items = await search(`is:pr is:merged author:${login} repo:${repo}`, { sort: 'updated', order: 'desc', per_page: '10' }, true);
  const prs = items
    .flatMap((x) => (x.pull_request?.merged_at ? [{ url: x.html_url, title: x.title, mergedAt: x.pull_request.merged_at }] : []))
    .filter((x) => !opts.skip?.includes(x.url) && (!opts.since || x.mergedAt >= opts.since))
    .sort((a, b) => b.mergedAt.localeCompare(a.mergedAt));
  return prs[0] ?? null;
}
