import { useMemo, useState, type ReactNode } from 'react';
import type { Canvas, ConstraintKind } from '../../lib/types.ts';
import { actions, byId, useAppState, useView } from '../../lib/store.ts';
import { assessCanvas, draftFromText, isCheckable, PUBLISH_THRESHOLD, SAMPLE_COMPLAINT, type Draft } from '../../lib/engine/canvas.ts';
import { similarNeeds } from '../../lib/engine/match.ts';
import { CONSTRAINT, PILOT_STATUS } from '../../lib/labels.ts';
import { uid } from '../../lib/format.ts';
import { SKILLS, skillLabel, skillsInText } from '../../lib/skills.ts';
import { ScoreDial, StatusIcon } from '../ui/primitives.tsx';

const EMPTY: Canvas = {
  current: '',
  pain: '',
  painMetric: '',
  outcome: '',
  criteria: [{ id: 'c-0', text: '' }],
  constraints: [],
  decisionMaker: '',
  scope: '',
};

export default function CanvasEditor() {
  const s = useAppState();
  const { persona } = useView();
  const editId = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('id') ?? undefined : undefined;
  const existing = byId.need(s, editId);

  const [orgId, setOrgId] = useState(existing?.orgId ?? 'o-kuzey');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [c, setC] = useState<Canvas>(existing ? structuredClone(existing.canvas) : EMPTY);
  const [raw, setRaw] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [extraSkills, setExtraSkills] = useState<string[]>(existing?.skills ?? []);
  const [removed, setRemoved] = useState<string[]>([]);

  const text = [title, c.current, c.pain, c.painMetric, c.outcome, c.scope, ...c.criteria.map((k) => k.text), ...c.constraints.map((k) => k.text)].join('. ');
  const autoSkills = useMemo(() => skillsInText(text), [text]);
  const skills = [...new Set([...autoSkills, ...extraSkills])].filter((k) => !removed.includes(k));
  const a = assessCanvas(c, skills);
  const memory = similarNeeds(s, skills);

  const set = <K extends keyof Canvas>(k: K, v: Canvas[K]) => setC((prev) => ({ ...prev, [k]: v }));
  const fromDraft = (k: keyof Canvas) => draft?.extracted.includes(k);
  const failing = (field: string) => a.checks.some((x) => x.field === field && !x.ok);

  const runDraft = (t: string) => {
    const d = draftFromText(t);
    setDraft(d);
    setTitle(d.title);
    setC({ ...d.canvas, criteria: d.canvas.criteria.length ? d.canvas.criteria : [{ id: uid('c'), text: '' }] });
    setRemoved([]);
  };

  const save = (publish: boolean) => {
    const id = actions.saveNeed({
      id: existing?.id,
      orgId,
      title: title.trim() || 'Adsız ihtiyaç',
      canvas: { ...c, criteria: c.criteria.filter((k) => k.text.trim()), constraints: c.constraints.filter((k) => k.text.trim()) },
      skills,
    });
    if (publish) actions.publishNeed(id);
    location.href = `/ihtiyaclar/${id}${publish ? '#adaylar' : ''}`;
  };

  const Tag = ({ k }: { k: keyof Canvas }) =>
    fromDraft(k) ? <span className="ml-2 rounded bg-s2/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-s2">taslaktan</span> : null;

  return (
    <>
      <header className="band">
        <div className="wrap py-10 md:py-12">
          <a href="/ihtiyaclar" className="text-sm text-ink-3 hover:text-ink">
            ← İhtiyaçlar
          </a>
          <p className="eyebrow mt-5">05 · İhtiyaç Kanvası</p>
          <h1 className="display mt-2 text-[40px] md:text-[52px]">{existing ? 'Kanvası düzenle' : 'Şikâyetten çözülebilir probleme.'}</h1>
          <p className="mt-3 max-w-2xl text-ink-2">
            Yedi alanlı rehberli akış. Kanvas kendini canlı puanlar; eşik {PUBLISH_THRESHOLD} puanın altındaki ya da engeli olan ihtiyaç yayımlanamaz. Nihai metin her zaman kurumundur.
          </p>
          {persona === 'person' && (
            <p className="mt-4 inline-block rounded-lg border border-warn/40 bg-warn/8 px-3 py-2 text-sm text-ink-2">
              Şu an <strong>Yetenek</strong> rolündesin. İhtiyaçları kurumlar yazar; üstten “Kurum”a geçebilirsin.
            </p>
          )}
        </div>
      </header>

      <div className="wrap grid gap-8 py-10 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {!existing && (
            <section className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">Serbest metinden başla</h2>
                <button className="btn-quiet btn-sm" onClick={() => setRaw(SAMPLE_COMPLAINT)}>
                  Örnek şikâyeti yükle
                </button>
              </div>
              <p className="mt-1 text-sm text-ink-3">Derdinizi nasıl anlatıyorsanız öyle yazın. Taslak motoru alanları doldurur, yalnız eksik kalan kritik soruları sorar.</p>
              <textarea
                className="field mt-3 min-h-28"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder="ör. Müşterilerimiz kargolarının nerede olduğunu göremiyor, çağrı merkezimiz sürekli arıyor…"
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button className="btn-ink btn-sm" disabled={raw.trim().length < 30} onClick={() => runDraft(raw)}>
                  Kanvas taslağına dönüştür
                </button>
                <span className="text-xs text-ink-3">Kural tabanlı, çevrim dışı çalışır. Metin cihazdan çıkmaz.</span>
              </div>
              {draft && (
                <div className="rise mt-4 rounded-lg border border-s2/30 bg-s2/5 p-4">
                  <p className="text-sm font-semibold">
                    {draft.extracted.length} alan dolduruldu, {draft.skills.length} yetkinlik çıkarıldı. Sistemin soruları:
                  </p>
                  <ol className="mt-2 space-y-1.5 text-sm">
                    {draft.questions.map((q, i) => (
                      <li key={q.field} className="flex gap-2">
                        <span className="num text-ink-3">{i + 1}.</span>
                        <a href={`#f-${q.field}`} className="underline decoration-line-2 underline-offset-2 hover:decoration-signal">
                          {q.q}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </section>
          )}

          <section className="card divide-y divide-line">
            <Field n="—" label="Kurum ve başlık">
              <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
                <select className="field" value={orgId} onChange={(e) => setOrgId(e.target.value)} aria-label="Kurum">
                  {s.orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
                <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sonuç odaklı başlık: “… X’ten Y’ye indirmek”" aria-label="Başlık" />
              </div>
            </Field>
            <Field n="1" label="Mevcut durum" id="current" tag={<Tag k="current" />} warn={failing('current')}>
              <textarea className="field min-h-20" value={c.current} onChange={(e) => set('current', e.target.value)} placeholder="Bugün süreç nasıl işliyor? Hangi araçla, ne ölçekte?" />
            </Field>
            <Field n="2" label="Acı noktası ve ölçüsü" id="painMetric" tag={<Tag k="pain" />} warn={failing('pain') || failing('painMetric')}>
              <textarea className="field min-h-16" value={c.pain} onChange={(e) => set('pain', e.target.value)} placeholder="Sorun kimi, nasıl etkiliyor?" />
              <input
                className={`field mt-2 font-mono text-[14px] ${c.painMetric && !isCheckable(c.painMetric) ? '!border-danger' : ''}`}
                value={c.painMetric}
                onChange={(e) => set('painMetric', e.target.value)}
                placeholder="Sayısal ölçü: ör. ortalama 45 dk; şikâyet oranı %27"
                aria-label="Acının sayısal ölçüsü"
              />
            </Field>
            <Field n="3" label="Hedef çıktı" id="outcome" tag={<Tag k="outcome" />} warn={failing('outcome')}>
              <textarea className="field min-h-16" value={c.outcome} onChange={(e) => set('outcome', e.target.value)} placeholder="Pilot sonunda elinizde ne olacak?" />
            </Field>
            <Field n="4" label="Ölçülebilir başarı kriterleri" id="criteria" warn={failing('criteria')} hint="Her kriter, pilotta bir kilometre taşı olur.">
              <ol className="space-y-2">
                {c.criteria.map((k, i) => (
                  <li key={k.id} className="flex items-center gap-2">
                    <span className="num w-6 text-xs text-ink-3">K{i + 1}</span>
                    <input
                      className="field"
                      value={k.text}
                      onChange={(e) => set('criteria', c.criteria.map((x) => (x.id === k.id ? { ...x, text: e.target.value } : x)))}
                      placeholder="ör. Konum bilgisi panele 30 saniyeden kısa sürede yansır"
                    />
                    <span className={`w-16 shrink-0 text-right font-mono text-[10px] ${!k.text.trim() ? 'text-ink-3' : isCheckable(k.text) ? 'text-s3' : 'text-danger'}`}>
                      {!k.text.trim() ? '—' : isCheckable(k.text) ? 'ölçülebilir' : 'ölçülemez'}
                    </span>
                    <button className="btn-quiet btn-sm !px-2" aria-label="Kriteri sil" onClick={() => set('criteria', c.criteria.filter((x) => x.id !== k.id))}>
                      <StatusIcon kind="fail" />
                    </button>
                  </li>
                ))}
              </ol>
              <button className="btn-line btn-sm mt-2" onClick={() => set('criteria', [...c.criteria, { id: uid('c'), text: '' }])}>
                + Kriter ekle
              </button>
            </Field>
            <Field n="5" label="Kısıtlar" id="constraints" tag={<Tag k="constraints" />} warn={failing('constraints')}>
              <ul className="space-y-2">
                {c.constraints.map((k, i) => (
                  <li key={i} className="flex gap-2">
                    <select
                      className="field !w-36 shrink-0"
                      value={k.kind}
                      onChange={(e) => set('constraints', c.constraints.map((x, j) => (j === i ? { ...x, kind: e.target.value as ConstraintKind } : x)))}
                      aria-label="Kısıt türü"
                    >
                      {Object.entries(CONSTRAINT).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                    <input
                      className="field"
                      value={k.text}
                      onChange={(e) => set('constraints', c.constraints.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
                    />
                    <button className="btn-quiet btn-sm !px-2" aria-label="Kısıtı sil" onClick={() => set('constraints', c.constraints.filter((_, j) => j !== i))}>
                      <StatusIcon kind="fail" />
                    </button>
                  </li>
                ))}
              </ul>
              <button className="btn-line btn-sm mt-2" onClick={() => set('constraints', [...c.constraints, { kind: 'sure', text: '' }])}>
                + Kısıt ekle
              </button>
            </Field>
            <Field n="6" label="Karar verici" id="decisionMaker" warn={failing('decisionMaker')} hint="Kilometre taşlarını kurum adına onaylayacak rol.">
              <input className="field" value={c.decisionMaker} onChange={(e) => set('decisionMaker', e.target.value)} placeholder="ör. Operasyon Direktörü" />
            </Field>
            <Field n="7" label="Pilot kapsamı" id="scope" warn={failing('scope')} hint="En küçük denenebilir hâli: tek bölge, tek müşteri, tek ürün grubu.">
              <textarea className="field min-h-16" value={c.scope} onChange={(e) => set('scope', e.target.value)} placeholder="ör. Yalnız 3 kurumsal müşteri ve 40 araç" />
            </Field>
            <Field n="—" label="Yetkinlik yüzeyi" hint="Metinden otomatik çıkarılır; eşleşme bu yüzey üzerinden yapılır.">
              <div className="flex flex-wrap gap-1.5">
                {skills.map((k) => (
                  <button key={k} className="chip !border-ink-3 !text-ink hover:!border-danger" onClick={() => setRemoved([...removed, k])} title="Çıkar">
                    {skillLabel(k)} <StatusIcon kind="fail" className="!h-3 !w-3" />
                  </button>
                ))}
                <select
                  className="chip cursor-pointer"
                  value=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    setExtraSkills([...extraSkills, e.target.value]);
                    setRemoved(removed.filter((x) => x !== e.target.value));
                  }}
                  aria-label="Yetkinlik ekle"
                >
                  <option value="">+ ekle</option>
                  {Object.entries(SKILLS)
                    .filter(([k]) => !skills.includes(k))
                    .map(([k, d]) => (
                      <option key={k} value={k}>
                        {d.label}
                      </option>
                    ))}
                </select>
              </div>
            </Field>
          </section>

          {memory.length > 0 && (
            <section className="card p-5">
              <h2 className="font-semibold">Ekosistem hafızası</h2>
              <p className="mt-1 text-sm text-ink-3">Yayımlamadan önce: benzer ihtiyaçlar geçmişte şöyle sonuçlandı. Problemi yeniden çerçevelemek isteyebilirsiniz.</p>
              <ul className="mt-3 grid gap-3 md:grid-cols-2">
                {memory.map((x) => (
                  <li key={x.need.id} className="rounded-lg border border-line bg-paper p-3">
                    <p className="text-sm font-semibold leading-snug">{x.need.title}</p>
                    <p className="mt-1 text-xs text-ink-3">
                      {x.org.name} · {x.pilot ? PILOT_STATUS[x.pilot.status] : ''}
                    </p>
                    {x.pilot?.closure && <p className="mt-1.5 text-xs leading-relaxed text-ink-2">{x.pilot.closure.summary}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <ScoreDial value={a.score} size={84} label="kanvas" />
              <div>
                <p className="font-semibold">{a.canPublish ? 'Yayına hazır' : 'Henüz yayımlanamaz'}</p>
                <p className="text-sm text-ink-3">Eşik {PUBLISH_THRESHOLD}</p>
              </div>
            </div>
            <div className="relative mt-4 h-2 rounded-[1px] bg-sunken">
              <div className={`h-full origin-left ${a.canPublish ? 'bg-s3' : 'bg-warn'}`} style={{ transform: `scaleX(${a.score / 100})`, transition: 'transform 400ms cubic-bezier(.16,1,.3,1)' }} />
              <div className="absolute -top-1 h-4 w-px bg-ink" style={{ left: `${PUBLISH_THRESHOLD}%` }} title="Yayın eşiği" />
            </div>
            <ul className="mt-5 space-y-2">
              {a.checks.map((k) => (
                <li key={k.id} className="flex gap-2 text-sm">
                  <span className={k.ok ? 'text-s3' : k.blocking ? 'text-danger' : 'text-warn'}><StatusIcon kind={k.ok ? 'ok' : k.blocking ? 'fail' : 'warn'} /></span>
                  <span className="flex-1">
                    <span className={k.ok ? 'text-ink-3' : 'font-medium'}>{k.label}</span>
                    {!k.ok && <span className="block text-xs leading-snug text-ink-3">{k.fix}</span>}
                  </span>
                  <span className="num text-xs text-ink-3">+{k.points}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex gap-2 border-t border-line pt-4">
              <button className="btn-line flex-1" onClick={() => save(false)}>
                Taslak kaydet
              </button>
              <button className="btn-primary flex-1" disabled={!a.canPublish} onClick={() => save(true)}>
                Yayımla
              </button>
            </div>
            {!a.canPublish && a.blockers.length > 0 && <p className="mt-2 text-xs text-danger">{a.blockers.length} engel kapanmadan yayın kapısı açılmaz.</p>}
          </div>
        </aside>
      </div>
    </>
  );
}

function Field({
  n,
  label,
  id,
  tag,
  hint,
  warn,
  children,
}: {
  n: string;
  label: string;
  id?: string;
  tag?: ReactNode;
  hint?: string;
  warn?: boolean;
  children: ReactNode;
}) {
  return (
    <div id={id ? `f-${id}` : undefined} className="scroll-mt-24 p-5">
      <div className="mb-2 flex items-baseline gap-2">
        <span className="num text-xs text-ink-3">{n}</span>
        <span className="text-[15px] font-semibold">{label}</span>
        {tag}
        {warn && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-warn" title="Eksik" />}
      </div>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}
