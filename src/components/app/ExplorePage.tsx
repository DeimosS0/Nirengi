// Keşfet: the kurum finds talent by evidence. Calm rows, identity blind until
// first contact; picking one of your open needs scores everyone against it.
// The surface holds search + need; every other filter lives in one sheet.

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Evidence, Level, Person } from '../../lib/types.ts';
import { currentOrg, setView, useAppState, useView } from '../../lib/store.ts';
import { evidenceWeight, findConflicts, scoreMatch, searchByProblem, VERIFIED_FLOOR, type Conflict, type Match, type SearchHit } from '../../lib/engine/match.ts';
import { progress, type WeekState } from '../../lib/engine/progress.ts';
import { skillLabel } from '../../lib/skills.ts';
import { AVAILABILITY } from '../../lib/labels.ts';
import { EmptyState, feedback, Ring, Sheet, Why } from '../ui/kit';
import { Avatar, LevelBadge, LevelGlyph, useIdentity } from '../ui/primitives.tsx';
import { activeWeeks, calmTone, Consistency } from './matchbits.tsx';

const EXAMPLES = [
  'yüksek trafikli dosya dağıtımını üretimde çözmüş biri',
  'Türkçe şikâyet metinlerini sınıflandırabilecek biri',
  'sensör verisini canlı haritaya taşıyabilecek biri',
];

// "Pilota açık" reads as "Projeye açık" for someone who has never met the word.
type Conflicts = Map<string, Conflict>;
type Sort = 'fit' | 'recent' | 'steady';
type Floor = 'all' | 'verified' | 'org';

const FLOORS: [Floor, string][] = [
  ['all', 'Hepsi'],
  ['verified', 'Doğrulandı'],
  ['org', 'Kurum onaylı'],
];

export default function ExplorePage() {
  const s = useAppState();
  const view = useView();
  const { blind } = view;
  const org = currentOrg(s, view);
  const conflicts = useMemo(() => findConflicts(s.people), [s.people]);
  // Own org's open needs first; the demo lets the kurum score against any published need.
  const needs = useMemo(() => s.needs.filter((n) => n.status === 'published').sort((a, b) => Number(b.orgId === org.id) - Number(a.orgId === org.id)), [s.needs, org.id]);

  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [sheet, setSheet] = useState(false);
  const [floor, setFloor] = useState<Floor>('all');
  const [city, setCity] = useState<string | null>(null);
  const [needId, setNeedId] = useState(() => needs.find((n) => n.orgId === org.id)?.id ?? '');
  const [sort, setSort] = useState<Sort>('fit');

  const need = needs.find((n) => n.id === needId);
  const sortBy: Sort = sort === 'fit' && !need ? 'steady' : sort;

  const weeks = useMemo(() => new Map(s.people.map((p) => [p.id, progress(s, p).history])), [s]);
  const fit = useMemo(() => {
    const o = need && s.orgs.find((x) => x.id === need.orgId);
    return new Map(need && o ? s.people.map((p) => [p.id, scoreMatch(p, need, o, s.pilots, conflicts)] as const) : []);
  }, [s, need, conflicts]);

  // Skills that exist in the pool, most common first.
  const pool = useMemo(() => {
    const n = new Map<string, number>();
    for (const p of s.people)
      for (const k of new Set(p.evidence.filter((e) => evidenceWeight(e, conflicts) > 0).flatMap((e) => e.skills))) n.set(k, (n.get(k) ?? 0) + 1);
    return [...n.entries()].sort((a, b) => b[1] - a[1] || skillLabel(a[0]).localeCompare(skillLabel(b[0]), 'tr')).map(([k]) => k);
  }, [s.people, conflicts]);
  const cities = useMemo(() => [...new Set(s.people.map((p) => p.city))].sort((a, b) => a.localeCompare(b, 'tr')), [s.people]);

  const results = useMemo(() => {
    const hits: SearchHit[] = q.trim() ? searchByProblem(s, q) : s.people.map((person) => ({ person, score: 0, skills: [], evidence: [] }));
    const strong = (p: Person, min: number) => p.evidence.some((e) => evidenceWeight(e, conflicts) >= min);
    const newest = (p: Person) => Math.max(0, ...p.evidence.filter((e) => evidenceWeight(e, conflicts) > 0).map((e) => Date.parse(e.producedAt)));
    const out = hits.filter(
      (h) =>
        picked.every((k) => h.person.evidence.some((e) => e.skills.includes(k) && evidenceWeight(e, conflicts) > 0)) &&
        (floor === 'all' || strong(h.person, floor === 'org' ? 1 : VERIFIED_FLOOR)) &&
        (blind || !city || h.person.city === city),
    );
    // A typed problem keeps the search's own relevance order.
    if (q.trim()) return out;
    return out.sort((a, b) =>
      sortBy === 'fit'
        ? fit.get(b.person.id)!.score - fit.get(a.person.id)!.score
        : sortBy === 'recent'
          ? newest(b.person) - newest(a.person)
          : activeWeeks(weeks.get(b.person.id)!) - activeWeeks(weeks.get(a.person.id)!),
    );
  }, [s, q, picked, floor, city, blind, sortBy, fit, weeks, conflicts]);

  const activeCount = picked.length + (floor !== 'all' ? 1 : 0) + (!blind && city ? 1 : 0);
  const clearFilters = () => {
    setPicked([]);
    setFloor('all');
    setCity(null);
  };
  const toggle = (k: string) => setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  const sortNote = q.trim() ? 'ilgiye göre' : sortBy === 'fit' ? 'seçili ihtiyaca uyuma göre' : sortBy === 'recent' ? 'en yeni işe göre' : 'düzenliliğe göre';

  const removable = (label: string, onClick: () => void) => (
    <button key={label} type="button" onClick={onClick} aria-label={`${label} filtresini kaldır`} className="chip !border-indigo/40 !bg-indigo-tint !text-indigo transition-colors hover:!border-indigo">
      {label}
      <X className="h-3.5 w-3.5" strokeWidth={3} />
    </button>
  );
  const toggleChip = (on: boolean, label: string, onClick: () => void) => (
    <button
      key={label}
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`chip transition-colors ${on ? '!border-indigo !bg-indigo-tint !text-indigo' : 'hover:border-indigo/40 hover:text-indigo'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-[1000px]">
      <h1 className="h-page">Yetenek keşfet</h1>
      <p className="lead mt-1">Çözmek istediğin işi yaz; bu işi daha önce gerçekten yapmış gençleri, yaptıkları işle birlikte gör.</p>

      <form
        data-coach="kesfet-ara"
        className="mt-6 flex items-center gap-3 rounded-[16px] border-2 border-line bg-bg-2 px-4 transition-colors focus-within:border-indigo focus-within:bg-bg"
        role="search"
        onSubmit={(e) => e.preventDefault()}
      >
        <Search className="h-5 w-5 shrink-0 text-ink-3" strokeWidth={3} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Problemi yaz: ör. dosya dağıtımını üretimde çözmüş biri"
          aria-label="Problemle ara"
          className="min-w-0 flex-1 bg-transparent py-3.5 text-[16px] font-bold text-ink outline-none placeholder:text-ink-4"
        />
        {q && (
          <button type="button" className="btn-quiet btn-sm !min-h-9 !px-2" onClick={() => setQ('')} aria-label="Aramayı temizle">
            <X className="h-5 w-5" strokeWidth={3} />
          </button>
        )}
      </form>
      {!q && (
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => setQ(ex)} className="chip transition-colors hover:border-indigo/40 hover:text-indigo">
              {ex}
            </button>
          ))}
        </div>
      )}
      {activeCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Etkin filtreler">
          {picked.map((k) => removable(skillLabel(k), () => toggle(k)))}
          {floor !== 'all' && removable(floor === 'org' ? 'Kurum onaylı' : 'Doğrulandı ve üstü', () => setFloor('all'))}
          {!blind && city && removable(city, () => setCity(null))}
        </div>
      )}
      <p className="mt-3 flex flex-wrap items-center gap-x-1 text-[13px] font-bold text-ink-3">
        Kişiler kurgusal demo verisi. {blind ? 'İsimsiz inceleme açık: adlar ilk temasa kadar gizli.' : 'İsimsiz inceleme kapalı: adlar görünüyor.'}
        <Why title="İsimsiz inceleme nedir?">
          <p className="text-[15px] font-bold text-ink-2">
            İsimsiz incelemede ad, yaş, okul ve şehir gizlenir; yalnız yapılan işler, yetkinlikler ve düzenlilik görünür. Böylece ilk bakışta okul adı ya da isim değil, yapılan iş konuşur ve önyargı azalır.
          </p>
          <p className="mt-3 text-[15px] font-bold text-ink-2">İsim, bir adayla deneme projesi başlattığında (ilk temas) görünür olur. Şehir filtresi de bu yüzden yalnız isimsiz inceleme kapalıyken çalışır.</p>
          <button
            type="button"
            className="btn-line btn-block mt-5"
            onClick={() => {
              setView({ blind: !blind });
              feedback({ tone: 'info', title: blind ? 'İsimsiz inceleme kapandı' : 'İsimsiz inceleme açıldı', text: blind ? 'Adaylar adlarıyla görünüyor.' : 'Adlar ilk temasa kadar gizli.' });
            }}
          >
            {blind ? 'Adları göster' : 'İsimsiz incelemeyi aç'}
          </button>
        </Why>
      </p>

      {needs.length > 0 && (
        <div data-coach="kesfet-ihtiyac" className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="ihtiyac" className="label !mb-0">
              Hangi ihtiyaç için?
            </label>
            <Why title="Uyum nasıl hesaplanıyor?" label="Uyum nasıl?">
              <p className="text-[15px] font-bold text-ink-2">
                Bir ihtiyaç seçince herkes o ihtiyaca karşı puanlanır: yaptığı işin uyumu, sektör ve ölçek uyumu, ayırabileceği zaman ve birlikte çalışma geçmişi. Puan her seferinde doğrulanmış işlerden hesaplanır, elle yazılmaz.
              </p>
              <p className="mt-3 text-[15px] font-bold text-ink-2">Bir adayın puanını parçalarına ayrılmış hâliyle görmek için ihtiyacın sayfasındaki “Uyan adaylar” listesini aç.</p>
              {need && (
                <a href={`/ihtiyaclar/${need.id}#adaylar`} className="btn-line btn-block mt-5">
                  Uyan adayları gör
                </a>
              )}
            </Why>
          </div>
          <select id="ihtiyac" value={needId} onChange={(e) => setNeedId(e.target.value)} className="field mt-2 truncate">
            <option value="">Genel keşif (ihtiyaç seçmeden)</option>
            {needs.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="num min-w-0 text-[14px] font-extrabold text-ink-3" aria-live="polite">
          {results.length} profil
          {results.length > 0 && <span className="font-bold"> · {sortNote}</span>}
        </p>
        <button type="button" data-coach="kesfet-filtre" className="btn-line btn-sm shrink-0" onClick={() => setSheet(true)}>
          Filtrele{activeCount > 0 && ` · ${activeCount}`}
        </button>
      </div>

      {results.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            title="Bu filtrelerle kimse çıkmadı"
            action={
              q.trim() || activeCount > 0 ? (
                <button
                  type="button"
                  className="btn-line"
                  onClick={() => {
                    setQ('');
                    clearFilters();
                  }}
                >
                  Filtreleri temizle
                </button>
              ) : undefined
            }
          >
            Kelimeleri değiştir, bir yetkinliği kaldır ya da problemi teknoloji yerine sonuç üzerinden anlat.
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {results.map((h, i) => (
            <li key={h.person.id} data-coach={i === 0 ? 'kesfet-liste' : undefined} className="rise" style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}>
              <PersonRow hit={h} hist={weeks.get(h.person.id)!} match={fit.get(h.person.id)} conflicts={conflicts} marked={[...picked, ...(need?.skills ?? [])]} />
            </li>
          ))}
        </ul>
      )}

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Filtrele">
        <div className="space-y-6">
          <div>
            <p className="cap">Yetkinlik</p>
            <div className="mt-2 flex flex-wrap gap-2">{pool.map((k) => toggleChip(picked.includes(k), skillLabel(k), () => toggle(k)))}</div>
            <p className="mt-2 text-[13px] font-bold text-ink-3">Birden fazla seçersen hepsi birlikte aranır.</p>
          </div>
          <div>
            <p className="cap">Doğrulama düzeyi</p>
            <div className="seg mt-2" role="group" aria-label="Doğrulama düzeyi">
              {FLOORS.map(([k, l]) => (
                <button key={k} type="button" aria-pressed={floor === k} onClick={() => setFloor(k)}>
                  {l}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[13px] font-bold text-ink-3">Doğrulandı: en az bir iş sistem tarafından kontrol edilmiş. Kurum onaylı: bir kurumun imzaladığı iş.</p>
          </div>
          <div>
            <p className="cap">Sırala</p>
            {q.trim() ? (
              <p className="mt-2 text-[14px] font-bold text-ink-3">Arama yazılıyken sonuçlar ilgiye göre sıralanır.</p>
            ) : (
              <div className="seg mt-2" role="group" aria-label="Sıralama">
                {(
                  [
                    ['fit', 'Uyum'],
                    ['recent', 'En yeni iş'],
                    ['steady', 'Düzenlilik'],
                  ] as const
                )
                  .filter(([k]) => k !== 'fit' || need)
                  .map(([k, l]) => (
                    <button key={k} type="button" aria-pressed={sortBy === k} onClick={() => setSort(k)}>
                      {l}
                    </button>
                  ))}
              </div>
            )}
          </div>
          <div>
            <p className="cap">Şehir</p>
            {blind ? (
              <p className="mt-2 text-[14px] font-bold text-ink-3">Şehir, kişinin kimliğinin bir parçası olduğu için isimsiz incelemede gizli. İsimsiz inceleme kapalıyken burada seçebilirsin.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">{cities.map((c) => toggleChip(city === c, c, () => setCity(city === c ? null : c)))}</div>
            )}
          </div>
        </div>
        <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 flex gap-3 border-t-2 border-line bg-bg px-6 pb-5 pt-4">
          {activeCount > 0 && (
            <button type="button" className="btn-quiet" onClick={clearFilters}>
              Temizle
            </button>
          )}
          <button type="button" className="btn-primary flex-1" onClick={() => setSheet(false)}>
            {results.length} profili göster
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function PersonRow({ hit, hist, match, conflicts, marked }: { hit: SearchHit; hist: WeekState[]; match?: Match; conflicts: Conflicts; marked: string[] }) {
  const p = hit.person;
  const id = useIdentity(p);

  const live = p.evidence.filter((e) => evidenceWeight(e, conflicts) > 0);
  const counts: Record<Level, number> = { S1: 0, S2: 0, S3: 0 };
  live.forEach((e) => counts[e.level]++);
  const weight = new Map<string, number>();
  for (const e of live) for (const k of e.skills) weight.set(k, (weight.get(k) ?? 0) + evidenceWeight(e, conflicts));
  // Skills the kurum is looking for come first, then the strongest.
  const top = [...weight.entries()].sort((a, b) => Number(marked.includes(b[0])) - Number(marked.includes(a[0])) || b[1] - a[1]).map(([k]) => k);
  const answer: Evidence | undefined = hit.evidence[0];

  return (
    <a href={`/profil/${p.handle}`} className="card-press block h-full p-4 sm:p-5">
      <span className="flex items-center gap-3 sm:gap-4">
        <Avatar person={p} size={52} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-black text-ink">{id.name}</span>
          <span className="block truncate text-[14px] font-bold text-ink-3">{id.sub}</span>
        </span>
        {match && <Ring value={match.score} size={58} tone={calmTone(match.score)} />}
      </span>

      {answer && (
        <span className="mt-3 flex items-start gap-2 rounded-[12px] bg-indigo-tint px-3 py-2 text-[14px] font-bold text-ink-2">
          <span className="mt-1">
            <LevelGlyph level={answer.level} size={14} />
          </span>
          <span className="line-clamp-2">Bu probleme cevap veren iş: {answer.title}</span>
        </span>
      )}

      <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        {(['S3', 'S2', 'S1'] as const)
          .filter((l) => counts[l] > 0)
          .map((l) => (
            <span key={l} className="inline-flex items-center gap-1.5">
              <b className="num text-[15px] font-black text-ink">{counts[l]}</b>
              <LevelBadge level={l} />
            </span>
          ))}
      </span>

      <span className="mt-3 flex flex-wrap gap-1.5">
        {top.slice(0, 2).map((k) => (
          <span key={k} className={`chip ${marked.includes(k) ? '!border-indigo/40 !bg-indigo-tint !text-indigo' : ''}`}>
            {skillLabel(k)}
          </span>
        ))}
        {top.length > 2 && <span className="chip">+{top.length - 2}</span>}
      </span>

      <span className="mt-4 block text-[14px] font-bold text-ink-3">
        <Consistency hist={hist} /> · {AVAILABILITY[p.availability]}
      </span>
    </a>
  );
}
