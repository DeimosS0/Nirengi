import { useMemo, useState } from 'react';
import type { Person } from '../../lib/types.ts';
import { setView, useAppState, useView } from '../../lib/store.ts';
import { findConflicts, momentum, searchByProblem, evidenceWeight, VERIFIED_FLOOR } from '../../lib/engine/match.ts';
import { AVAILABILITY } from '../../lib/labels.ts';
import { skillLabel } from '../../lib/skills.ts';
import { Avatar, Empty, LevelGlyph, PageHead, useIdentity } from '../ui/primitives.tsx';

const EXAMPLES = [
  'yüksek trafikli dosya dağıtımını üretimde çözmüş biri',
  'Türkçe şikâyet metinlerini sınıflandırabilecek biri',
  'sensör verisini canlı haritaya taşıyabilecek biri',
];

type Sort = 'signal' | 'verified' | 'new';

export default function ExplorePage() {
  const s = useAppState();
  const { persona, blind } = useView();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('signal');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const conflicts = useMemo(() => findConflicts(s.people), [s.people]);

  const results = useMemo(() => {
    const hits = q.trim() ? searchByProblem(s, q) : s.people.map((person) => ({ person, score: 0, skills: [] as string[], evidence: [] as Person['evidence'] }));
    const filtered = hits.filter((h) => !onlyOpen || h.person.availability === 'open');
    if (q.trim()) return filtered;
    const verified = (p: Person) => p.evidence.filter((e) => evidenceWeight(e, conflicts) >= VERIFIED_FLOOR).length;
    return [...filtered].sort((a, b) =>
      sort === 'signal'
        ? momentum(b.person).ratio - momentum(a.person).ratio
        : sort === 'verified'
          ? verified(b.person) - verified(a.person)
          : Date.parse(b.person.joinedAt) - Date.parse(a.person.joinedAt),
    );
  }, [s, q, sort, onlyOpen, conflicts]);

  return (
    <>
      <PageHead
        eyebrow="01 · Genç yeteneklerin keşfi"
        title={
          <>
            CV değil, <em>eser.</em>
          </>
        }
        lead="Unvanla değil problemle ara. Sonuç anahtar kelimeden değil, doğrulanmış üretimden gelir. Takipçi sayısı yok; son dönemde üretimi hızlananlar öne çıkar."
      />

      <div className="wrap py-8">
        <form
          className="card flex items-center gap-3 p-2 pl-4 focus-within:border-signal"
          role="search"
          onSubmit={(e) => e.preventDefault()}
        >
          <svg viewBox="0 0 20 20" width="18" height="18" className="shrink-0 text-ink-3" aria-hidden="true">
            <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.7" />
            <path d="m13.5 13.5 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Problemi yaz: ör. yüksek trafikli dosya dağıtımını üretimde çözmüş biri"
            aria-label="Problemle ara"
            className="min-w-0 flex-1 bg-transparent py-2 text-[16px] outline-none placeholder:text-ink-3"
          />
          {q && (
            <button type="button" className="btn-quiet btn-sm" onClick={() => setQ('')}>
              Temizle
            </button>
          )}
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-3">Örnek:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex} onClick={() => setQ(ex)} className="chip hover:border-ink-3 hover:text-ink">
              {ex}
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 border-b border-line pb-4">
          {!q.trim() && (
            <div className="flex rounded-lg border border-line bg-sunken p-0.5" role="tablist" aria-label="Sıralama">
              {(
                [
                  ['signal', 'Yükselen sinyal'],
                  ['verified', 'Doğrulanmış kanıt'],
                  ['new', 'Yeni katılan'],
                ] as const
              ).map(([k, l]) => (
                <button key={k} role="tab" aria-selected={sort === k} onClick={() => setSort(k)} className={`tab ${sort === k ? 'tab-on' : ''}`}>
                  {l}
                </button>
              ))}
            </div>
          )}
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} className="accent-[rgb(var(--signal))]" />
            Yalnız pilota açık olanlar
          </label>
          <span className="num ml-auto text-sm text-ink-3">{results.length} profil</span>
        </div>

        {persona === 'org' && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-raised px-4 py-3 text-sm">
            <span className={`h-2 w-2 rounded-full ${blind ? 'bg-s3' : 'bg-ink-3'}`} />
            {blind ? (
              <span className="text-ink-2">
                <strong className="font-semibold text-ink">Kör keşif açık.</strong> İsim, yaş, okul ve şehir ilk temasa kadar gizli; yalnız kanıt görünür.
              </span>
            ) : (
              <span className="text-ink-2">
                <strong className="font-semibold text-ink">Kör keşif kapalı.</strong> Önyargının devreye girdiği bilgiler görünüyor.
              </span>
            )}
            <button className="btn-line btn-sm ml-auto" onClick={() => setView({ blind: !blind })}>
              {blind ? 'Kimlikleri göster' : 'Kör keşfi aç'}
            </button>
          </div>
        )}

        {results.length === 0 ? (
          <div className="mt-6">
            <Empty title="Bu probleme kanıtla cevap veren profil yok">
              Kelimeleri değiştir ya da problemi teknoloji yerine sonuç üzerinden anlat.
            </Empty>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.map((h, i) => (
              <li key={h.person.id} className="rise" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                <PersonCard person={h.person} matched={h.evidence} matchedSkills={h.skills} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function PersonCard({ person, matched, matchedSkills }: { person: Person; matched: Person['evidence']; matchedSkills: string[] }) {
  const id = useIdentity(person);
  const m = momentum(person);
  const counts = { S1: 0, S2: 0, S3: 0 };
  person.evidence.forEach((e) => counts[e.level]++);
  const total = person.evidence.length || 1;
  const shown = matched.length ? matched : [...person.evidence].sort((a, b) => b.level.localeCompare(a.level)).slice(0, 3);

  return (
    <a href={`/profil/${person.handle}`} className="card card-hover flex h-full flex-col p-5">
      <div className="flex items-start gap-3">
        <Avatar person={person} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{id.name}</p>
          <p className="truncate text-sm text-ink-3">{id.sub}</p>
          {!id.hidden && (
            <p className="mt-0.5 truncate font-mono text-[11px] text-ink-3">
              {person.age} yaş · {person.school}
            </p>
          )}
        </div>
        {m.rising && (
          <span className="shrink-0 rounded-md border border-signal/40 bg-signal/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-signal" title="Son 90 günde doğrulanmış üretimi hızlandı">
            ↗ yükselen
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="flex h-1.5 overflow-hidden rounded-full bg-sunken" aria-label={`${counts.S1} beyan, ${counts.S2} makine doğrulaması, ${counts.S3} kurum tasdiki`}>
          <span className="bg-s3" style={{ width: `${(counts.S3 / total) * 100}%` }} />
          <span className="bg-s2" style={{ width: `${(counts.S2 / total) * 100}%` }} />
          <span className="bg-s1/50" style={{ width: `${(counts.S1 / total) * 100}%` }} />
        </div>
        <p className="num mt-1.5 flex gap-3 text-[11px] text-ink-3">
          <span>{counts.S3} tasdik</span>
          <span>{counts.S2} makine</span>
          <span>{counts.S1} beyan</span>
        </p>
      </div>

      {matched.length > 0 && <p className="eyebrow mt-4 !text-signal">Bu probleme cevap veren kanıt</p>}
      <ul className={`${matched.length ? 'mt-2' : 'mt-4'} flex-1 space-y-2`}>
        {shown.slice(0, 3).map((e) => (
          <li key={e.id} className="flex gap-2 text-[13.5px] leading-snug">
            <span className="mt-0.5">
              <LevelGlyph level={e.level} size={13} />
            </span>
            <span className="line-clamp-2">{e.title}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
        {(matchedSkills.length ? matchedSkills : [...new Set(person.evidence.flatMap((e) => e.skills))].slice(0, 4)).map((k) => (
          <span key={k} className={`chip !text-[11px] ${matchedSkills.includes(k) ? '!border-signal/40 !text-ink' : ''}`}>
            {skillLabel(k)}
          </span>
        ))}
        <span className={`ml-auto text-[11px] font-medium ${person.availability === 'open' ? 'text-s3' : 'text-ink-3'}`}>{AVAILABILITY[person.availability]}</span>
      </div>
    </a>
  );
}
