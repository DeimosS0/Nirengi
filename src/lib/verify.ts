// S2 machine verification that runs entirely in the browser:
//  • GitHub — account control proven by a one-time code placed in the profile
//    bio or a public gist (Keybase-style), then repositories become evidence.
//  • Domain — ownership proven by a DNS TXT record, resolved over DoH.

import type { Evidence, Level } from './types.ts';
import { LANGUAGE_SKILLS, skillsInText } from './skills.ts';
import { uid } from './format.ts';

export interface GhUser {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  created_at: string;
  location: string | null;
  blog: string | null;
}

export interface GhRepo {
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  fork: boolean;
  archived: boolean;
  pushed_at: string;
  created_at: string;
  topics?: string[];
}

export class VerifyError extends Error {}

async function gh<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`https://api.github.com${path}`, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store',
    });
  } catch {
    throw new VerifyError('GitHub’a ulaşılamadı. Bağlantıyı kontrol edin ya da çevrimdışı örneği kullanın.');
  }
  if (res.status === 404) throw new VerifyError('Bu kullanıcı adıyla bir GitHub hesabı bulunamadı.');
  if (res.status === 403 || res.status === 429) {
    const reset = Number(res.headers.get('x-ratelimit-reset'));
    const mins = reset ? Math.max(1, Math.ceil((reset * 1000 - Date.now()) / 60000)) : 60;
    throw new VerifyError(`GitHub’ın kimliksiz sorgu sınırı (saatte 60) doldu. Yaklaşık ${mins} dk sonra yeniden deneyin.`);
  }
  if (!res.ok) throw new VerifyError(`GitHub beklenmeyen bir yanıt verdi (${res.status}).`);
  return res.json() as Promise<T>;
}

export const cleanHandle = (s: string) =>
  s.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?github\.com\//i, '').split(/[/?#]/)[0];

export async function fetchGitHub(handle: string) {
  const login = cleanHandle(handle);
  if (!/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(login)) throw new VerifyError('Geçerli bir GitHub kullanıcı adı girin.');
  const user = await gh<GhUser>(`/users/${login}`);
  const repos = await gh<GhRepo[]>(`/users/${login}/repos?per_page=100&sort=pushed&type=owner`);
  return { user, repos };
}

export const newChallenge = () => `nirengi-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36).padStart(7, '0').slice(0, 7)}`;

/** True if the code is in the account's bio or in one of its recent public gists. */
export async function checkGitHubChallenge(handle: string, code: string): Promise<'bio' | 'gist' | null> {
  const login = cleanHandle(handle);
  const user = await gh<GhUser>(`/users/${login}`);
  if (user.bio?.includes(code)) return 'bio';
  const gists = await gh<{ description: string | null; files: Record<string, unknown> }[]>(`/users/${login}/gists?per_page=10`);
  if (gists.some((g) => g.description?.includes(code) || Object.keys(g.files).some((f) => f.includes(code)))) return 'gist';
  return null;
}

const DAY = 86_400_000;

/** Pick the strongest original repositories and turn them into evidence. */
export function reposToEvidence(repos: GhRepo[], verified: boolean, via: 'bio' | 'gist' | null): Evidence[] {
  const level: Level = verified ? 'S2' : 'S1';
  const rank = (r: GhRepo) => r.stargazers_count * 2 + r.forks_count + Math.max(0, 30 - (Date.now() - Date.parse(r.pushed_at)) / (12 * DAY));
  return repos
    .filter((r) => !r.fork && !r.archived)
    .sort((a, b) => rank(b) - rank(a))
    .slice(0, 6)
    .map((r) => {
      const skills = new Set<string>([
        ...(r.language ? LANGUAGE_SKILLS[r.language] ?? [] : []),
        ...skillsInText(`${r.name.replace(/[-_]/g, ' ')} ${r.description ?? ''} ${(r.topics ?? []).join(' ')}`),
      ]);
      const metrics = [
        { label: 'yıldız', value: r.stargazers_count.toLocaleString('tr-TR') },
        ...(r.forks_count ? [{ label: 'fork', value: r.forks_count.toLocaleString('tr-TR') }] : []),
        ...(r.language ? [{ label: 'dil', value: r.language }] : []),
      ];
      return {
        id: uid('e-gh'),
        title: r.description ? `${r.name} — ${r.description}` : r.name,
        summary: r.description ?? 'Açıklama girilmemiş depo.',
        source: 'github' as const,
        level,
        skills: [...skills],
        url: r.html_url,
        metrics,
        producedAt: r.pushed_at,
        verifiedAt: verified ? new Date().toISOString() : undefined,
        verifier: verified ? `GitHub API · ${via === 'gist' ? 'gist' : 'bio'} sınaması` : undefined,
      };
    });
}

// ---------------------------------------------------------------- DNS

export const cleanDomain = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split(/[/?#]/)[0];

export const txtName = (domain: string) => `_nirengi.${cleanDomain(domain)}`;
export const txtValue = (code: string) => `nirengi-verify=${code}`;

async function resolveTxt(name: string): Promise<string[]> {
  const endpoints = [
    `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=TXT`,
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=TXT`,
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/dns-json' }, cache: 'no-store' });
      if (!res.ok) continue;
      const json = (await res.json()) as { Answer?: { type: number; data: string }[] };
      return (json.Answer ?? []).filter((a) => a.type === 16).map((a) => a.data.replace(/^"|"$/g, '').replace(/"\s*"/g, ''));
    } catch {
      /* try the next resolver */
    }
  }
  throw new VerifyError('DNS çözümleyicilerine ulaşılamadı.');
}

export async function checkDnsTxt(domain: string, code: string) {
  const d = cleanDomain(domain);
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) throw new VerifyError('Geçerli bir alan adı girin (ör. ornek.dev).');
  const records = await resolveTxt(txtName(d));
  return { ok: records.some((r) => r.includes(txtValue(code))), records };
}

export function domainEvidence(domain: string): Evidence {
  const d = cleanDomain(domain);
  return {
    id: uid('e-dns'),
    title: d,
    summary: 'Alan adı sahipliği DNS TXT kaydıyla doğrulandı.',
    source: 'domain',
    level: 'S2',
    skills: [],
    url: `https://${d}`,
    producedAt: new Date().toISOString(),
    verifiedAt: new Date().toISOString(),
    verifier: 'DNS TXT kaydı',
  };
}
