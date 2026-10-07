// The landing instrument: the real engine measuring the current demo state.
// Channels are the four match components; muting one re-weights and re-ranks live.

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppState } from '../../lib/store.ts';
import { rankCandidates, momentum, WEIGHTS, type Match } from '../../lib/engine/match.ts';
import { verifyChain, shortHash } from '../../lib/engine/ledger.ts';
import { blindCode, fmtDate } from '../../lib/format.ts';
import { LEVELS } from '../../lib/labels.ts';
import type { LogEntry } from '../../lib/types.ts';

type Ch = keyof typeof WEIGHTS;
type Mode = 'match' | 'evidence' | 'ledger';

const CHANNELS: { key: Ch; n: number; label: string }[] = [
  { key: 'evidence', n: 1, label: 'Kanıt' },
  { key: 'context', n: 2, label: 'Bağlam' },
  { key: 'capacity', n: 3, label: 'Kapasite' },
  { key: 'history', n: 4, label: 'Geçmiş' },
];
const MODES: { key: Mode; label: string }[] = [
  { key: 'match', label: 'Eşleşme' },
  { key: 'evidence', label: 'Kanıt' },
  { key: 'ledger', label: 'Defter' },
];
const LEVEL_STYLE = {
  S1: { c: 'var(--s1)', w: 1.2, dash: '3 3' },
  S2: { c: 'var(--s2)', w: 2.4, dash: undefined },
  S3: { c: 'var(--s3)', w: 4, dash: undefined },
} as const;

const f2 = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const DAY = 86_400_000;

function rescore(m: Match, on: Record<Ch, boolean>) {
  const total = CHANNELS.reduce((s, c) => s + (on[c.key] ? WEIGHTS[c.key] : 0), 0) || 1;
  const segs = CHANNELS.map((c) => ({ ...c, v: on[c.key] ? (WEIGHTS[c.key] * m.parts[c.key]) / total : 0 }));
  return { m, segs, score: segs.reduce((s, x) => s + x.v, 0) };
}

export default function Bench() {
  const state = useAppState();
  const needs = useMemo(() => state.needs.filter((n) => n.status !== 'draft'), [state.needs]);
  const [needIdx, setNeedIdx] = useState(0);
  const [on, setOn] = useState<Record<Ch, boolean>>({ evidence: true, context: true, capacity: true, history: true });
  const [mode, setMode] = useState<Mode>('match');
  const [cursor, setCursor] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const need = needs[Math.min(needIdx, needs.length - 1)];
  const org = need && state.orgs.find((o) => o.id === need.orgId);
  const ranked = useMemo(() => (need ? rankCandidates(state, need) : []), [state, need]);
  const rows = useMemo(
    () => ranked.map((m) => rescore(m, on)).sort((a, b) => b.score - a.score).slice(0, 6),
    [ranked, on],
  );
  const sel = rows.find((r) => r.m.person.id === cursor) ?? rows[0];

  if (!need || !sel) {
    return (
      <div className="screen grid h-full min-h-[420px] place-items-center rounded-[4px] p-6 text-center">
        <p className="text-sm text-ink-2">
          Yayında ihtiyaç yok. <a className="text-[rgb(var(--ch1))] underline" href="/ihtiyaclar/yeni">Kanvası aç</a>
        </p>
      </div>
    );
  }

  const step = (d: number) => {
    setNeedIdx((i) => (i + d + needs.length) % needs.length);
    setCursor(null);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      {/* ---------------------------------------------------------------- screen */}
      <div className="screen relative flex min-h-[440px] flex-1 flex-col overflow-hidden rounded-[4px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.6),inset_0_2px_8px_rgb(0_0_0/0.5)]">
        <div className="flex items-center gap-3 border-b border-line px-4 py-2">
          <span className="plabel !text-[rgb(var(--ch1))]">{MODES.find((m) => m.key === mode)!.label}</span>
          <span className="min-w-0 flex-1 truncate text-[13px] text-ink-2">
            {org?.name} · <span className="text-ink">{need.title}</span>
          </span>
          <span className="plabel flex shrink-0 items-center gap-1.5">
            <span className="led on" style={{ ['--c' as string]: 'var(--s2)' }} />
            motor canlı
          </span>
        </div>

        {mode === 'match' && <MatchPlot rows={rows} sel={sel} armed={armed} onPick={setCursor} href={`/ihtiyaclar/${need.id}#adaylar`} />}
        {mode === 'evidence' && <EvidencePlot match={sel.m} />}
        {mode === 'ledger' && <LedgerView key={need.id} needId={need.id} />}

        {mode === 'match' && (
          <div className="grid grid-cols-5 border-t border-line text-center">
            {sel.segs.map((s) => (
              <div key={s.key} className={`border-r border-line px-1 py-2 ${on[s.key] ? '' : 'opacity-35'}`}>
                <p className="plabel" style={{ color: `rgb(var(--ch${s.n}))` }}>
                  CH{s.n}
                </p>
                <p className="num text-[13px] text-ink">{f2(sel.m.parts[s.key])}</p>
              </div>
            ))}
            <div className="px-1 py-2">
              <p className="plabel">Σ skor</p>
              <p className="num text-[13px] font-semibold text-ink">{f2(sel.score)}</p>
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------- front panel */}
      <div role="group" aria-label="Eşleşme bileşenleri" className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
        {CHANNELS.map((c) => {
          const lastOn = on[c.key] && CHANNELS.filter((x) => on[x.key]).length === 1;
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={on[c.key]}
              disabled={lastOn || mode !== 'match'}
              onClick={() => setOn((o) => ({ ...o, [c.key]: !o[c.key] }))}
              className="btn-line btn-sm !justify-start !gap-2 !px-2.5"
              title={lastOn ? 'En az bir kanal açık kalmalı' : `${c.label} bileşenini aç/kapat`}
            >
              <span className="led" style={{ ['--c' as string]: `var(--ch${c.n})` }} />
              <span className="num text-[11px] text-ink-3">CH{c.n}</span>
              <span>{c.label}</span>
              <span className="num ml-auto text-[11px] text-ink-3">{f2(WEIGHTS[c.key])}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => step(-1)} className="btn-line btn-sm h-8 w-8 !px-0" aria-label="Önceki ihtiyaç">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="plabel num">
          İhtiyaç {needs.indexOf(need) + 1}/{needs.length}
        </span>
        <button type="button" onClick={() => step(1)} className="btn-line btn-sm h-8 w-8 !px-0" aria-label="Sonraki ihtiyaç">
          <ChevronRight className="h-4 w-4" />
        </button>
        <div role="group" aria-label="Ekran modu" className="ml-auto flex gap-1.5">
          {MODES.map((m) => (
            <button key={m.key} type="button" aria-pressed={mode === m.key} onClick={() => setMode(m.key)} className={`btn-sm ${mode === m.key ? 'btn-ink' : 'btn-line'}`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- match mode

function MatchPlot({ rows, sel, armed, onPick, href }: { rows: ReturnType<typeof rescore>[]; sel: ReturnType<typeof rescore>; armed: boolean; onPick: (id: string) => void; href: string }) {
  return (
    <div className="flex flex-1 flex-col px-4 pb-3 pt-4">
      <div className="relative flex-1">
        <div className="graticule-screen pointer-events-none absolute inset-0" />
        <div className="absolute -left-1 top-0 bottom-0 flex flex-col justify-between text-right">
          {['1,0', '0,5', '0'].map((t) => (
            <span key={t} className="num -translate-y-1/2 text-[10px] leading-none text-ink-3 last:translate-y-0">
              {t}
            </span>
          ))}
        </div>
        <ol className="absolute inset-y-0 left-6 right-0 flex items-stretch gap-[3%]">
          {rows.map((r, i) => {
            let offset = 0;
            const picked = r === sel;
            return (
              <motion.li key={r.m.person.id} layout transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} className="relative flex-1">
                <button
                  type="button"
                  onClick={() => onPick(r.m.person.id)}
                  aria-label={`Aday ${blindCode(r.m.person.id)}, skor ${f2(r.score)}`}
                  aria-pressed={picked}
                  className={`absolute inset-0 block rounded-[2px] ${picked ? 'outline-1 outline-dashed outline-offset-2 outline-[rgb(var(--ink-3))]' : ''}`}
                >
                  {r.segs.map((s) => {
                    const style = {
                      transform: `translateY(${-offset * 100}%) scaleY(${armed ? s.v : 0})`,
                      background: `rgb(var(--ch${s.n}))`,
                      transitionDelay: armed ? `${i * 60}ms` : '0ms',
                    };
                    offset += armed ? s.v : 0;
                    return <span key={s.key} className="bench-seg absolute inset-x-0 bottom-0 h-full origin-bottom" style={style} />;
                  })}
                </button>
                <span className="num absolute left-1/2 -translate-x-1/2 text-[11px] text-ink" style={{ bottom: `calc(${r.score * 100}% + 6px)` }}>
                  {f2(r.score)}
                </span>
              </motion.li>
            );
          })}
        </ol>
      </div>
      <ol className="ml-6 mt-2 flex gap-[3%]">
        {rows.map((r, i) => (
          <motion.li key={r.m.person.id} layout transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} className={`num flex-1 truncate text-center text-[11px] ${r === sel ? 'text-ink' : 'text-ink-3'}`}>
            <span className="hidden sm:inline">{i + 1}·</span>
            {blindCode(r.m.person.id)}
          </motion.li>
        ))}
      </ol>
      <p className="mt-3 border-t border-dashed border-line pt-2.5 text-[12.5px] leading-snug text-ink-2">
        <span className="num text-ink">{blindCode(sel.m.person.id)}</span> · {sel.m.reasons[0] ?? 'Gerekçe için kanıt yok.'}{' '}
        <a href={href} className="whitespace-nowrap font-semibold text-[rgb(var(--ch2))] underline underline-offset-2">
          Tüm adaylar ve gerekçeler
        </a>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- evidence mode

function EvidencePlot({ match }: { match: Match }) {
  const now = Date.now();
  const span = 365 * DAY;
  const ev = match.person.evidence
    .map((e) => ({ e, x: 1 - (now - Date.parse(e.producedAt)) / span }))
    .filter((p) => p.x >= 0)
    .sort((a, b) => a.x - b.x);
  const mo = momentum(match.person);
  let cum = 0;
  const total = ev.reduce((s, p) => s + LEVELS[p.e.level].weight, 0) || 1;
  const pts = ev.map((p) => {
    cum += LEVELS[p.e.level].weight;
    return { ...p, y: cum / total };
  });
  const trace = `M0,100 ${pts.map((p, i) => `H${p.x * 100} V${100 - p.y * 100 * 0.92}${i === pts.length - 1 ? ' H100' : ''}`).join(' ')}`;

  return (
    <div className="flex flex-1 flex-col px-4 pb-3 pt-4">
      <div className="relative flex-1">
        <div className="graticule-screen pointer-events-none absolute inset-0" />
        {/* the 90-day window that drives momentum */}
        <div className="absolute inset-y-0 right-0 w-[24.6%] bg-[rgb(var(--ch1)/0.07)] shadow-[inset_1px_0_0_rgb(var(--ch1)/0.5)]">
          <span className="plabel absolute left-1.5 top-1 !text-[rgb(var(--ch1))]">son 90 gün</span>
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          <path d={trace} fill="none" stroke="rgb(var(--ch1))" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          {pts.map((p) => {
            const st = LEVEL_STYLE[p.e.level];
            const h = LEVELS[p.e.level].weight * 46;
            return (
              <line key={p.e.id} x1={p.x * 100} x2={p.x * 100} y1={100} y2={100 - h} stroke={`rgb(${st.c})`} strokeWidth={st.w} strokeDasharray={st.dash} vectorEffect="non-scaling-stroke" />
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-ink-3">
        <span className="num">−12 ay</span>
        <span className="num">bugün</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-dashed border-line pt-2.5 text-[12px] text-ink-2">
        <span className="num text-ink">{blindCode(match.person.id)}</span>
        {(['S1', 'S2', 'S3'] as const).map((l) => (
          <span key={l} className="flex items-center gap-1.5">
            <svg width="18" height="8" aria-hidden="true">
              <line x1="0" x2="18" y1="4" y2="4" stroke={`rgb(${LEVEL_STYLE[l].c})`} strokeWidth={LEVEL_STYLE[l].w} strokeDasharray={LEVEL_STYLE[l].dash} />
            </svg>
            {l} {LEVELS[l].name.toLocaleLowerCase('tr-TR')}
          </span>
        ))}
        <span className="num ml-auto">
          ivme ×{mo.ratio.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}
          {mo.rising && <span className="text-[rgb(var(--ch1))]"> · yükselen</span>}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- ledger mode

function LedgerView({ needId }: { needId: string }) {
  const state = useAppState();
  const pilot = state.pilots.find((p) => p.needId === needId) ?? [...state.pilots].sort((a, b) => b.log.length - a.log.length)[0];
  const [log, setLog] = useState<LogEntry[] | null>(null);
  const [result, setResult] = useState<number | null>(null);
  if (!pilot) return <p className="p-6 text-sm text-ink-2">Henüz pilot defteri yok.</p>;
  const rows = log ?? pilot.log;
  const tamper = () => {
    const k = Math.floor(rows.length / 2);
    setLog(rows.map((e, i) => (i === k ? { ...e, text: `${e.text} (sonradan değiştirildi)` } : e)));
    setResult(null);
  };
  const shown = rows.slice(-11);
  const base = rows.length - shown.length;

  return (
    <div className="flex flex-1 flex-col px-4 pb-3 pt-3">
      <p className="text-[12px] text-ink-3">
        {pilot.needId === needId ? '' : 'Bu ihtiyacın pilotu yok; en uzun defter gösteriliyor · '}
        {pilot.title} · {rows.length} kayıt · SHA-256 zinciri
      </p>
      <ol className="mt-2 flex-1 space-y-1 overflow-hidden">
        {shown.map((e, j) => {
          const i = base + j;
          const broken = result !== null && result !== -1 && i >= result;
          return (
            <li key={e.id + i} className={`grid grid-cols-[2.2rem_5.5rem_1fr_auto] items-baseline gap-2 text-[12px] ${broken ? 'text-[rgb(var(--danger))]' : ''}`}>
              <span className="num text-ink-3">#{i + 1}</span>
              <span className="num truncate text-ink-3">{fmtDate(e.at)}</span>
              <span className="truncate text-ink-2">{e.text}</span>
              <span className={`num ${broken ? '' : 'text-ink-3'}`}>{shortHash(e.hash)}</span>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-line pt-2.5">
        <button type="button" className="btn-sm btn-ink" onClick={() => setResult(verifyChain(rows))}>
          Zinciri doğrula
        </button>
        <button type="button" className="btn-sm btn-line" onClick={tamper} disabled={!!log}>
          Bir kaydı kurcala
        </button>
        {log && (
          <button type="button" className="btn-sm btn-quiet" onClick={() => { setLog(null); setResult(null); }}>
            Geri al
          </button>
        )}
        <output className="num ml-auto text-[12px]" aria-live="polite">
          {result === null ? '' : result === -1 ? <span className="text-[rgb(var(--s2))]">zincir bütün · {rows.length}/{rows.length}</span> : <span className="text-[rgb(var(--danger))]">#{result + 1} kayıtta kırık</span>}
        </output>
      </div>
    </div>
  );
}
