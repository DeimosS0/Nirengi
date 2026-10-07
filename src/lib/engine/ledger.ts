// Append-only pilot ledger. Each entry commits to the previous entry's hash,
// so editing any past record breaks every hash after it (tamper-evident).
// Synchronous SHA-256 keeps the store's actions simple and works offline.

import type { LogEntry } from '../types.ts';

const isPrime = (n: number) => {
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
};
const frac32 = (x: number) => ((x - Math.floor(x)) * 2 ** 32) | 0;

const primes: number[] = [];
for (let n = 2; primes.length < 64; n++) if (isPrime(n)) primes.push(n);
const K = primes.map((p) => frac32(Math.cbrt(p)));
const H0 = primes.slice(0, 8).map((p) => frac32(Math.sqrt(p)));

const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

export function sha256(message: string): string {
  const bytes = new TextEncoder().encode(message);
  const len = bytes.length;
  const padded = new Uint8Array(((len + 9 + 63) >> 6) << 6);
  padded.set(bytes);
  padded[len] = 0x80;
  const view = new DataView(padded.buffer);
  const bits = len * 8;
  view.setUint32(padded.length - 8, Math.floor(bits / 2 ** 32));
  view.setUint32(padded.length - 4, bits >>> 0);

  const h = H0.slice();
  const w = new Int32Array(64);
  for (let off = 0; off < padded.length; off += 64) {
    for (let t = 0; t < 16; t++) w[t] = view.getUint32(off + t * 4);
    for (let t = 16; t < 64; t++) {
      const a = w[t - 15];
      const b = w[t - 2];
      const s0 = rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3);
      const s1 = rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, k] = h;
    for (let t = 0; t < 64; t++) {
      const t1 = (k + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[t] + w[t]) | 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      k = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }
    const next = [a, b, c, d, e, f, g, k];
    for (let i = 0; i < 8; i++) h[i] = (h[i] + next[i]) | 0;
  }
  return h.map((v) => (v >>> 0).toString(16).padStart(8, '0')).join('');
}

export const GENESIS = '0'.repeat(64);

const digest = (e: Pick<LogEntry, 'prev' | 'at' | 'actor' | 'kind' | 'text'>) =>
  sha256([e.prev, e.at, e.actor, e.kind, e.text].join('|'));

export function appendEntry(
  log: LogEntry[],
  entry: Omit<LogEntry, 'prev' | 'hash' | 'id'>,
): LogEntry[] {
  const prev = log.length ? log[log.length - 1].hash : GENESIS;
  const hash = digest({ ...entry, prev });
  return [...log, { ...entry, id: hash.slice(0, 10), prev, hash }];
}

/** Returns the index of the first tampered entry, or -1 if the chain holds. */
export function verifyChain(log: LogEntry[]): number {
  let prev = GENESIS;
  for (let i = 0; i < log.length; i++) {
    const e = log[i];
    if (e.prev !== prev || digest(e) !== e.hash) return i;
    prev = e.hash;
  }
  return -1;
}

export const shortHash = (h: string) => `${h.slice(0, 4)}·${h.slice(4, 8)}·${h.slice(-4)}`;
