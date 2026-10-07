import { sha256 } from './engine/ledger.ts';

const DAY = 86_400_000;

export const now = () => new Date().toISOString();
export const daysAgo = (d: number, base = Date.now()) => new Date(base - d * DAY).toISOString();
export const daysFromNow = (d: number, base = Date.now()) => new Date(base + d * DAY).toISOString();
export const daysSince = (iso: string) => Math.floor((Date.now() - Date.parse(iso)) / DAY);

const dateFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export const fmtDate = (iso: string) => dateFmt.format(new Date(iso));
export const fmtDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));

export function relTime(iso: string): string {
  const diff = Date.now() - Date.parse(iso);
  const future = diff < 0;
  const abs = Math.abs(diff);
  const min = Math.round(abs / 60_000);
  let s: string;
  if (min < 1) return 'şimdi';
  if (min < 60) s = `${min} dk`;
  else if (min < 60 * 24) s = `${Math.round(min / 60)} saat`;
  else if (abs < 45 * DAY) s = `${Math.round(abs / DAY)} gün`;
  else s = `${Math.round(abs / (30 * DAY))} ay`;
  return future ? `${s} sonra` : `${s} önce`;
}

let counter = 0;
export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toLocaleUpperCase('tr-TR'))
    .join('');

/** Stable pseudonymous code used in blind discovery ("Aday · 7F3A"). */
export const blindCode = (id: string) => sha256(`nirengi:${id}`).slice(0, 4).toUpperCase();

export const pct = (x: number) => `%${Math.round(x * 100)}`;
