// İhtiyaç sihirbazı: the 7-field canvas as a guided, one-question-per-screen flow.
// The score from canvas.ts is shown live; each check turns green as the answer improves.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { Check, Plus, X } from 'lucide-react';
import type { Canvas, ConstraintKind } from '../../lib/types.ts';
import { actions, byId, currentOrg, getState, useAppState, useView } from '../../lib/store.ts';
import { assessCanvas, draftFromText, isCheckable, PUBLISH_THRESHOLD, SAMPLE_COMPLAINT, type Draft } from '../../lib/engine/canvas.ts';
import { rankCandidates, similarNeeds } from '../../lib/engine/match.ts';
import { CONSTRAINT, PILOT_STATUS } from '../../lib/labels.ts';
import { uid } from '../../lib/format.ts';
import { SKILLS, skillLabel, skillsInText } from '../../lib/skills.ts';
import Niri, { type Mood } from '../ui/Niri';
import { Bar, celebrate, CountUp, feedback, Ring, Sheet, Why } from '../ui/kit';
import { CheckCircle } from '../ui/icons';
import { OrgMark, StatusIcon } from '../ui/primitives';
import { FIT_MIN, gateNote } from '../kurum/NeedBits';

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

type StepId = 'dert' | 'current' | 'pain' | 'painMetric' | 'outcome' | 'criteria' | 'constraints' | 'decisionMaker' | 'scope' | 'skills' | 'title' | 'review';
type Q = Exclude<StepId, 'dert' | 'review'>;
type TextField = 'current' | 'pain' | 'painMetric' | 'outcome' | 'decisionMaker' | 'scope';

const TEXT: Q[] = ['current', 'pain', 'painMetric', 'outcome', 'decisionMaker', 'scope'];
const ORDER: StepId[] = ['dert', 'current', 'pain', 'painMetric', 'outcome', 'criteria', 'constraints', 'decisionMaker', 'scope', 'skills', 'title', 'review'];

const LABEL: Record<Q, string> = {
  current: 'Mevcut durum',
  pain: 'Acı noktası',
  painMetric: 'Acının ölçüsü',
  outcome: 'Hedef çıktı',
  criteria: 'Başarı kriterleri',
  constraints: 'Kısıtlar',
  decisionMaker: 'Karar verici',
  scope: 'Pilot kapsamı',
  skills: 'Yetkinlikler',
  title: 'Başlık',
};

const META: Record<Q, { q: string; hint: string; tip: string; ex: string; ph: string }> = {
  current: {
    q: 'Bugün bu iş nasıl yürüyor?',
    hint: 'Hangi süreç, hangi araçla, ne ölçekte? Bir yabancıya anlatır gibi yaz.',
    tip: 'Kısa ama somut ol: araç adı ve ölçek yeter.',
    ex: 'Günlük 3.000 teslimat noktasının rotası her sabah tek iş parçacıklı bir Python betiğiyle hesaplanıyor.',
    ph: 'ör. Randevular telefonla alınıyor ve elle bir tabloya yazılıyor…',
  },
  pain: {
    q: 'Sorun tam olarak ne?',
    hint: 'Sorun kimi, nasıl etkiliyor? Tek cümle yeter.',
    tip: 'Çözümü değil acıyı yaz: kim neyi yapamıyor?',
    ex: 'Hesaplama bitmeden araçlar depodan çıkamıyor; sabahın ilk teslimatları gecikiyor.',
    ph: 'ör. Hastalar sıra beklerken vazgeçiyor…',
  },
  painMetric: {
    q: 'Bu sorun bugün hangi sayıyla ölçülüyor?',
    hint: 'Süre, oran, maliyet ya da adet. Sayı yoksa pilotun başarısı ölçülemez.',
    tip: 'Tahmini bir sayı bile işe yarar. En az bir rakam yaz.',
    ex: 'Hesaplama süresi ortalama 45 dk; sabah ilk teslimat gecikmesi %18',
    ph: 'ör. Ortalama bekleme 45 dk; şikâyet oranı %27',
  },
  outcome: {
    q: 'Pilot bitince elinde ne olacak?',
    hint: 'Bir ürün, servis ya da rapor. Çıktıyı somut tarif et.',
    tip: '“Şu işi yapan bir servis” gibi tarif edersen adaylar seni hızla anlar.',
    ex: 'Aynı kısıtlarla çalışan, ölçülebilir hızda yeni bir rota servisi.',
    ph: 'ör. Randevuları otomatik hatırlatan bir web paneli…',
  },
  criteria: {
    q: 'Başarıyı hangi sayılar gösterir?',
    hint: 'En az iki kriter yaz. Her biri pilotta bir aşama olur.',
    tip: 'Kriterde bir eşik değer ya da “teslim edilir” gibi net bir ifade olsun.',
    ex: '3.000 noktalık rota hesaplaması 5 dakikanın altında tamamlanır',
    ph: 'ör. Konum bilgisi panele 30 saniyeden kısa sürede yansır',
  },
  constraints: {
    q: 'Sınırların neler?',
    hint: 'Bütçe, süre, veri ya da mevzuat. En az birini ekle.',
    tip: 'Kısıtı baştan söylemek adayın hızlı karar vermesini sağlar.',
    ex: 'Süre: pilot 6 hafta sürer',
    ph: '',
  },
  decisionMaker: {
    q: 'Aşamaları kim onaylayacak?',
    hint: 'Kurum adına karar verecek rol ya da kişi.',
    tip: 'Bir unvan yeter, ad vermek zorunda değilsin.',
    ex: 'Operasyon Direktörü',
    ph: 'ör. Bilgi İşlem Müdürü',
  },
  scope: {
    q: 'Pilotu en küçük hâliyle nerede deneyelim?',
    hint: 'Tek bölge, tek müşteri ya da tek ürün grubu.',
    tip: 'Küçük başlamak pilotun bitme şansını artırır.',
    ex: 'Yalnız Tuzla deposu ve 1 haftalık geçmiş sipariş verisi.',
    ph: 'ör. Yalnız tek şube ve son bir ayın verisi',
  },
  skills: {
    q: 'Hangi yetkinlikler gerekli?',
    hint: 'Yazdıklarından çıkardıklarımı seçili getirdim. İstediğini ekle ya da çıkar.',
    tip: 'Eşleşme bu listeye göre yapılır. Gereğinden geniş tutma.',
    ex: 'Go, Optimizasyon, API tasarımı',
    ph: '',
  },
  title: {
    q: 'İhtiyaca bir ad ver',
    hint: 'Sonuç odaklı tek cümle: “X’ten Y’ye indirmek”.',
    tip: 'Başlık adaylara ilk görünen şeydir. Sayıyı başlığa koy.',
    ex: 'Sabah rota hesaplamasını 45 dakikadan 5 dakikanın altına indirmek',
    ph: 'ör. Randevu bekleme süresini 45 dakikadan 10 dakikaya indirmek',
  },
};

const CONSTRAINT_PH: Record<ConstraintKind, string> = {
  butce: 'ör. Pilot bütçesi 60.000 TL',
  sure: 'ör. Pilot süresi 6 hafta',
  veri: 'ör. Gerçek adres yerine anonim koordinat verilir',
  mevzuat: 'ör. KVKK: veri maskelenir',
  teknoloji: 'ör. Sensörler MQTT üzerinden yayın yapıyor',
};

const SLIDE: Variants = {
  enter: (d: number) => ({ x: d * 56, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] } },
  exit: (d: number) => ({ x: d * -56, opacity: 0, transition: { duration: 0.12 } }),
};

type Done = { kind: 'draft' | 'published' | 'saved'; id: string; fits: number };

export default function CanvasEditor() {
  const s = useAppState();
  const view = useView();
  const rm = useReducedMotion();
  const editId = typeof location !== 'undefined' ? (new URLSearchParams(location.search).get('id') ?? undefined) : undefined;
  const existing = byId.need(s, editId);
  const org = byId.org(s, existing?.orgId ?? currentOrg(s, view).id)!;
  const order = existing ? ORDER.slice(1) : ORDER;
  const isLive = Boolean(existing && existing.status !== 'draft');

  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [c, setC] = useState<Canvas>(() => {
    if (!existing) return EMPTY;
    const k = structuredClone(existing.canvas);
    return { ...k, criteria: k.criteria.length ? k.criteria : [{ id: uid('c'), text: '' }] };
  });
  const [raw, setRaw] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [extra, setExtra] = useState<string[]>(existing?.skills ?? []);
  const [removed, setRemoved] = useState<string[]>([]);
  const [savedId, setSavedId] = useState(existing?.id);
  const [done, setDone] = useState<Done | null>(null);
  const [quit, setQuit] = useState(false);
  const [mem, setMem] = useState(false);
  const start = useRef(JSON.stringify(c));

  const text = [title, c.current, c.pain, c.painMetric, c.outcome, c.scope, ...c.criteria.map((k) => k.text), ...c.constraints.map((k) => k.text)].join('. ');
  const auto = useMemo(() => skillsInText(text), [text]);
  const skills = [...new Set([...auto, ...extra])].filter((k) => !removed.includes(k));
  const a = assessCanvas(c, skills);
  const titleOk = title.trim().length >= 8;
  const ready = a.canPublish && titleOk;
  const memory = similarNeeds(s, skills, savedId);
  const id = order[i];
  const dirty = !done && (JSON.stringify(c) !== start.current || title !== (existing?.title ?? '') || raw.trim() !== '');

  // The moment the gate opens deserves a nod, but only when it actually flips.
  const gate = useRef(a.canPublish);
  useEffect(() => {
    if (a.canPublish && !gate.current) feedback({ tone: 'good', title: 'Yayın kapısı açıldı', text: `Çözülebilirlik ${a.score}. İstersen yayımlayabilirsin.` });
    gate.current = a.canPublish;
  }, [a.canPublish, a.score]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [i]);

  const go = (to: number) => {
    const t = Math.max(0, Math.min(order.length - 1, to));
    setDir(t >= i ? 1 : -1);
    setI(t);
  };
  const jump = (step: string) => go(order.indexOf(step as StepId));
  const next = () => go(i + 1);

  const toggleSkill = (k: string) => {
    if (skills.includes(k)) {
      setRemoved([...removed, k]);
      setExtra(extra.filter((x) => x !== k));
    } else {
      setRemoved(removed.filter((x) => x !== k));
      setExtra([...extra, k]);
    }
  };

  const convert = () => {
    const d = draftFromText(raw);
    // The extractor prefixes constraints with their kind ("Bütçe: 40.000 TL"); the kind is shown as a pill here.
    const constraints = d.canvas.constraints.map((k) => ({ ...k, text: k.text.replace(new RegExp(`^${CONSTRAINT[k.kind]}:\\s*`, 'i'), '') }));
    const nc: Canvas = { ...d.canvas, constraints, criteria: d.canvas.criteria.length ? d.canvas.criteria : [{ id: uid('c'), text: '' }] };
    setDraft(d);
    setTitle(d.title);
    setC(nc);
    setExtra([]);
    setRemoved([]);
    const failing = assessCanvas(nc, d.skills).checks.filter((k) => !k.ok);
    const to = order.findIndex((x) => x !== 'dert' && failing.some((k) => k.field === x));
    feedback(
      d.extracted.length
        ? { tone: 'good', title: 'Taslak hazır', text: `${d.extracted.length} alanı doldurdum. Eksik kalanları birlikte tamamlayalım.` }
        : { tone: 'info', title: 'Metinden alan çıkaramadım', text: 'Sorunları tek tek yazalım.' },
    );
    go(to > 0 ? to : order.indexOf('title'));
  };

  const persist = () =>
    actions.saveNeed({
      id: savedId,
      orgId: org.id,
      title: title.trim() || 'Adsız ihtiyaç',
      canvas: { ...c, criteria: c.criteria.filter((k) => k.text.trim()), constraints: c.constraints.filter((k) => k.text.trim()) },
      skills,
    });

  const save = () => {
    const nid = persist();
    setSavedId(nid);
    setQuit(false);
    setDone({ kind: isLive ? 'saved' : 'draft', id: nid, fits: 0 });
    feedback(isLive ? { tone: 'good', title: 'Değişiklikler kaydedildi' } : { tone: 'good', title: 'Taslak kaydedildi', text: 'İstediğin zaman kaldığın yerden devam edebilirsin.' });
  };

  const publish = () => {
    const nid = persist();
    actions.publishNeed(nid);
    setSavedId(nid);
    const st = getState();
    const fits = rankCandidates(st, st.needs.find((n) => n.id === nid)!).filter((m) => m.score >= FIT_MIN).length;
    setDone({ kind: 'published', id: nid, fits });
    celebrate({
      title: 'İhtiyacın yayında!',
      sub: fits ? `${fits} aday uyuyor` : 'Henüz uyan aday yok; yeni kanıtlar geldikçe burada görünür.',
      cta: 'Adayları gör',
      href: `/ihtiyaclar/${nid}#adaylar`,
    });
  };

  if (done) return <Finished done={done} onResume={() => setDone(null)} />;

  const q = id !== 'dert' && id !== 'review' ? id : null;
  const stepChecks = q === 'title' ? [{ id: 'title', label: 'Başlık yazıldı', ok: titleOk, points: 0, blocking: false, fix: 'En az 8 karakterlik, sonucu anlatan bir başlık yaz.' }] : q ? a.checks.filter((k) => k.field === q) : [];
  const stepOk = stepChecks.length > 0 && stepChecks.every((k) => k.ok);

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => (dirty ? setQuit(true) : (location.href = '/ihtiyaclar'))}
          className="btn-quiet btn-sm !min-h-10 !px-2 !text-ink-3"
          aria-label="Sihirbazdan çık"
        >
          <X className="h-6 w-6" strokeWidth={3} />
        </button>
        <div className="flex-1" role="progressbar" aria-label="Adım" aria-valuemin={1} aria-valuemax={order.length} aria-valuenow={i + 1}>
          <Bar value={i / (order.length - 1)} tone="indigo" h={14} />
        </div>
        <span className="num text-[14px] font-black text-ink-3">
          {i + 1}/{order.length}
        </span>
      </div>

      <div className="mt-4 rounded-[16px] bg-bg-2 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1 text-[15px] font-extrabold text-ink">
            Çözülebilirlik
            <Why title="Çözülebilirlik nasıl hesaplanıyor?">
              <p className="text-[16px] font-bold text-ink-2">
                İhtiyaç on maddelik bir listeden puan alır; hepsi 100 eder. Yayın için hem {PUBLISH_THRESHOLD} puan hem de zorunlu üç maddenin tamamı gerekir.
              </p>
              <ul className="mt-4 space-y-2">
                {a.checks.map((k) => (
                  <li key={k.id} className="flex items-start gap-2 text-[15px] font-bold text-ink-2">
                    <StatusIcon kind={k.ok ? 'ok' : 'pending'} className="mt-1" />
                    <span className="flex-1">
                      {k.label}
                      {k.blocking && <span className="ml-2 text-[13px] font-extrabold text-indigo">zorunlu</span>}
                    </span>
                    <span className="num text-ink-3">+{k.points}</span>
                  </li>
                ))}
              </ul>
            </Why>
          </span>
          <span className={`text-[17px] font-black ${a.canPublish ? 'text-green-lip' : 'text-ink'}`}>
            <CountUp value={a.score} />
            <span className="text-ink-3">/100</span>
          </span>
        </div>
        <div className="relative mt-2.5">
          <Bar value={a.score / 100} tone={a.canPublish ? 'green' : 'indigo'} h={14} />
          <span className="absolute -top-1 h-[22px] w-[3px] -translate-x-1/2 rounded-full bg-ink" style={{ left: `${PUBLISH_THRESHOLD}%` }} aria-hidden="true" />
        </div>
        <div className="relative mt-2 h-5 text-[13px] font-extrabold">
          <span className={a.canPublish ? 'text-green-lip' : 'text-ink-2'}>{a.canPublish ? 'Yayın kapısı açık' : gateNote(a)}</span>
          <span className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-ink-3" style={{ left: `${PUBLISH_THRESHOLD}%` }}>
            {PUBLISH_THRESHOLD}
          </span>
        </div>
      </div>

      <div
        className="mt-6 overflow-x-clip"
        onKeyDown={(e) => {
          if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing || id === 'dert' || id === 'review') return;
          if (['BUTTON', 'A', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
          e.preventDefault();
          next();
        }}
      >
        <AnimatePresence mode="wait" initial={false} custom={rm ? 0 : dir}>
          <motion.div key={id} custom={rm ? 0 : dir} variants={SLIDE} initial="enter" animate="center" exit="exit" className="p-1">
            {id === 'dert' ? (
              <DertStep raw={raw} setRaw={setRaw} />
            ) : id === 'review' ? (
              <Review
                org={org.name}
                c={c}
                title={title}
                skills={skills}
                a={a}
                titleOk={titleOk}
                ready={ready}
                draftLeft={isLive ? 'Değişiklikleri kaydet' : 'Taslak kaydet'}
                canMem={memory.length > 0}
                onMem={() => setMem(true)}
                onEdit={jump}
                onBack={() => go(i - 1)}
                onSave={save}
                onPublish={publish}
                live={isLive}
              />
            ) : (
              <StepView
                id={id as Q}
                ok={stepOk}
                checks={stepChecks}
                c={c}
                setC={setC}
                title={title}
                setTitle={setTitle}
                skills={skills}
                toggleSkill={toggleSkill}
                fromDraft={Boolean(draft?.extracted.includes(id as keyof Canvas))}
                onNext={next}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {id === 'dert' && (
        <div className="mt-6 space-y-2 p-1">
          <button type="button" className="btn-primary btn-lg btn-block" disabled={raw.trim().length < 30} onClick={convert}>
            Taslağa dönüştür
          </button>
          <button type="button" className="btn-quiet btn-block" onClick={next}>
            Atla, tek tek yazayım
          </button>
        </div>
      )}
      {q && (
        <div className={`mt-8 grid gap-3 p-1 ${i > 0 ? 'grid-cols-[auto_1fr]' : ''}`}>
          {i > 0 && (
            <button type="button" className="btn-line btn-lg" onClick={() => go(i - 1)}>
              Geri
            </button>
          )}
          <button type="button" className={`${stepOk ? 'btn-green' : 'btn-primary'} btn-lg`} onClick={next}>
            {order[i + 1] === 'review' ? 'Özeti gör' : 'Devam'}
          </button>
        </div>
      )}
      {q && <p className="mt-3 hidden text-center text-[13px] font-bold text-ink-3 md:block">Enter ile devam edebilirsin. Yeni satır için Shift + Enter.</p>}

      <Sheet open={quit} onClose={() => setQuit(false)} title="Çıkmadan önce">
        <p className="text-[16px] font-bold text-ink-2">Yazdıkların henüz kaydedilmedi. Çıkarsan kaybolacak.</p>
        <div className="mt-6 space-y-3">
          <button type="button" className="btn-primary btn-block" onClick={save}>
            {isLive ? 'Değişiklikleri kaydet' : 'Taslak olarak kaydet'}
          </button>
          <button type="button" className="btn-line btn-block" onClick={() => setQuit(false)}>
            Yazmaya devam et
          </button>
          <a href="/ihtiyaclar" className="btn-quiet btn-block !text-red-lip">
            Kaydetmeden çık
          </a>
        </div>
      </Sheet>

      <Sheet open={mem} onClose={() => setMem(false)} title="Benzer ihtiyaçlar nasıl sonuçlandı?">
        <p className="text-[15px] font-bold text-ink-3">Aynı yetkinlikleri isteyen geçmiş ihtiyaçlar. Problemi yeniden çerçevelemek isteyebilirsin.</p>
        <ul className="mt-4 space-y-3">
          {memory.map((x) => (
            <li key={x.need.id} className="rounded-[16px] bg-bg-2 p-4">
              <p className="text-[16px] font-extrabold leading-snug text-ink">{x.need.title}</p>
              <p className="mt-1 text-[14px] font-bold text-ink-3">
                {x.org.name}
                {x.pilot ? ` · ${PILOT_STATUS[x.pilot.status]}` : ''}
              </p>
              {x.pilot?.closure && <p className="mt-2 text-[14px] font-semibold leading-relaxed text-ink-2">{x.pilot.closure.summary}</p>}
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  );
}

// ---------------------------------------------------------------- pieces

/** Niri with one tip in a speech bubble; the mood follows the answer. */
function Coach({ tip, mood }: { tip: string; mood: Mood }) {
  return (
    <div className="mt-5 flex items-end gap-3">
      <Niri mood={mood} size={72} />
      <div className="relative mb-3 flex-1 rounded-[18px] border-2 border-line bg-bg px-4 py-3">
        <span className="absolute -left-[9px] bottom-4 h-4 w-4 rotate-45 border-b-2 border-l-2 border-line bg-bg" aria-hidden="true" />
        <p className="text-[15px] font-extrabold leading-snug text-ink">{tip}</p>
      </div>
    </div>
  );
}

/** One inline check. It pops once when it flips to green, not when it mounts green. */
function CheckRow({ ok, label, fix, points, must }: { ok: boolean; label: string; fix: string; points: number; must: boolean }) {
  const was = useRef(ok);
  const [pops, setPops] = useState(0);
  useEffect(() => {
    if (ok && !was.current) setPops((n) => n + 1);
    was.current = ok;
  }, [ok]);
  return (
    <li className="flex items-start gap-3">
      <span key={pops} className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors ${ok ? `bg-green-tint ${pops ? 'pop' : ''}` : 'bg-bg-3'}`}>
        {ok && <StatusIcon kind="ok" className="!align-baseline" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[15px] font-extrabold ${ok ? 'text-green-lip' : 'text-ink'}`}>
          {label}
          {must && !ok && <span className="ml-2 text-[13px] font-extrabold text-indigo">zorunlu</span>}
        </span>
        {!ok && <span className="block text-[14px] font-semibold leading-snug text-ink-3">{fix}</span>}
      </span>
      {points > 0 && <span className={`num text-[14px] font-black ${ok ? 'text-green-lip' : 'text-ink-3'}`}>+{points}</span>}
    </li>
  );
}

interface StepProps {
  id: Q;
  ok: boolean;
  checks: { id: string; label: string; ok: boolean; points: number; blocking: boolean; fix: string }[];
  c: Canvas;
  setC: (f: (p: Canvas) => Canvas) => void;
  title: string;
  setTitle: (v: string) => void;
  skills: string[];
  toggleSkill: (k: string) => void;
  fromDraft: boolean;
  onNext: () => void;
}

function StepView({ id, ok, checks, c, setC, title, setTitle, skills, toggleSkill, fromDraft, onNext }: StepProps) {
  const m = META[id];
  const val = id === 'title' ? title : TEXT.includes(id) ? c[id as TextField] : '';
  const put = (v: string) => (id === 'title' ? setTitle(v) : setC((p) => ({ ...p, [id]: v })));
  const single = id === 'painMetric' || id === 'decisionMaker' || id === 'title';

  return (
    <div>
      <h1 className="text-[26px] font-black leading-tight text-ink sm:text-[30px]">{m.q}</h1>
      <p className="mt-2 text-[16px] font-bold text-ink-3">{m.hint}</p>
      <Coach tip={m.tip} mood={ok ? 'happy' : 'think'} />

      <div className="mt-2">
        {fromDraft && val && (
          <p className="mb-2">
            <span className="pill !py-0.5 bg-cyan-tint text-cyan-lip">Metninden doldurdum, bir kontrol et</span>
          </p>
        )}
        {id === 'criteria' ? (
          <Criteria c={c} setC={setC} onNext={onNext} />
        ) : id === 'constraints' ? (
          <Constraints c={c} setC={setC} onNext={onNext} />
        ) : id === 'skills' ? (
          <div className="flex flex-wrap gap-2">
            {Object.entries(SKILLS).map(([k, d]) => {
              const on = skills.includes(k);
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleSkill(k)}
                  className={`chip !py-1.5 transition-colors ${on ? '!border-indigo !bg-indigo-tint !text-indigo' : 'hover:border-line-2 hover:bg-bg-2'}`}
                >
                  {on && <Check className="h-4 w-4" strokeWidth={3.5} aria-hidden="true" />}
                  {d.label}
                </button>
              );
            })}
          </div>
        ) : single ? (
          <input className="field" value={val} onChange={(e) => put(e.target.value)} placeholder={m.ph} aria-label={m.q} autoFocus enterKeyHint="next" />
        ) : (
          <textarea className="field min-h-[120px] resize-none" value={val} onChange={(e) => put(e.target.value)} placeholder={m.ph} aria-label={m.q} autoFocus enterKeyHint="next" />
        )}
      </div>

      <ul className="mt-5 space-y-3" aria-label="Bu adımın kontrolleri">
        {checks.map((k) => (
          <CheckRow key={k.id} ok={k.ok} label={k.label} fix={k.fix} points={k.points} must={k.blocking} />
        ))}
      </ul>

      <div className="mt-5 rounded-[16px] bg-bg-2 px-4 py-3">
        <p className="text-[13px] font-extrabold text-ink-3">İyi bir örnek</p>
        <p className="mt-0.5 text-[15px] font-bold leading-snug text-ink-2">“{m.ex}”</p>
      </div>
      {ok && <span className="sr-only" role="status">Bu adım tamam.</span>}
    </div>
  );
}

function Criteria({ c, setC, onNext }: { c: Canvas; setC: StepProps['setC']; onNext: () => void }) {
  const rows = c.criteria;
  const [fresh, setFresh] = useState('');
  const add = () => {
    const nid = uid('c');
    setFresh(nid);
    setC((p) => ({ ...p, criteria: [...p.criteria, { id: nid, text: '' }] }));
  };
  return (
    <div>
      <ol className="space-y-3">
        {rows.map((k, idx) => {
          const last = idx === rows.length - 1;
          return (
            <li key={k.id} className="flex items-center gap-2">
              <span className="num grid h-9 w-9 shrink-0 place-items-center rounded-full bg-bg-3 text-[15px] font-black text-ink-3">{idx + 1}</span>
              <input
                className="field !px-3.5"
                value={k.text}
                onChange={(e) => setC((p) => ({ ...p, criteria: p.criteria.map((x) => (x.id === k.id ? { ...x, text: e.target.value } : x)) }))}
                placeholder={META.criteria.ph}
                aria-label={`${idx + 1}. başarı kriteri`}
                autoFocus={k.id === fresh || (idx === 0 && !fresh)}
                enterKeyHint="next"
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
                  e.preventDefault();
                  e.stopPropagation();
                  if (k.text.trim() && last) add();
                  else if (!k.text.trim() && last) onNext();
                  else (e.currentTarget.closest('li')?.nextElementSibling?.querySelector('input') as HTMLInputElement | null)?.focus();
                }}
              />
              <span className="w-5 shrink-0" title={k.text.trim() ? (isCheckable(k.text) ? 'Ölçülebilir' : 'Ölçülebilir değil') : undefined}>
                {k.text.trim() && <StatusIcon kind={isCheckable(k.text) ? 'ok' : 'warn'} className="!h-5 !w-5" />}
              </span>
              {rows.length > 1 && (
                <button type="button" className="btn-quiet btn-sm !min-h-9 !px-2 !text-ink-3" aria-label={`${idx + 1}. kriteri sil`} onClick={() => setC((p) => ({ ...p, criteria: p.criteria.filter((x) => x.id !== k.id) }))}>
                  <X className="h-5 w-5" strokeWidth={3} />
                </button>
              )}
            </li>
          );
        })}
      </ol>
      <button type="button" className="btn-line btn-sm mt-3" onClick={add}>
        <Plus className="h-4 w-4" strokeWidth={3.5} aria-hidden="true" />
        Kriter ekle
      </button>
    </div>
  );
}

function Constraints({ c, setC, onNext }: { c: Canvas; setC: StepProps['setC']; onNext: () => void }) {
  const [focus, setFocus] = useState(-1);
  const add = (kind: ConstraintKind) => {
    setFocus(c.constraints.length);
    setC((p) => ({ ...p, constraints: [...p.constraints, { kind, text: '' }] }));
  };
  return (
    <div>
      {c.constraints.length > 0 && (
        <ul className="mb-3 space-y-3">
          {c.constraints.map((k, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span className="pill w-[88px] shrink-0 justify-center bg-bg-3 text-ink-2">{CONSTRAINT[k.kind]}</span>
              <input
                className="field !px-3.5"
                value={k.text}
                onChange={(e) => setC((p) => ({ ...p, constraints: p.constraints.map((x, j) => (j === idx ? { ...x, text: e.target.value } : x)) }))}
                placeholder={CONSTRAINT_PH[k.kind]}
                aria-label={`${CONSTRAINT[k.kind]} kısıtı`}
                autoFocus={idx === focus}
                enterKeyHint="next"
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
                  e.preventDefault();
                  e.stopPropagation();
                  if (k.text.trim()) onNext();
                }}
              />
              <button type="button" className="btn-quiet btn-sm !min-h-9 !px-2 !text-ink-3" aria-label={`${CONSTRAINT[k.kind]} kısıtını sil`} onClick={() => setC((p) => ({ ...p, constraints: p.constraints.filter((_, j) => j !== idx) }))}>
                <X className="h-5 w-5" strokeWidth={3} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Kısıt ekle">
        {(Object.keys(CONSTRAINT) as ConstraintKind[]).map((k) => (
          <button key={k} type="button" className="chip !py-1.5 transition-colors hover:border-indigo/40 hover:text-indigo" onClick={() => add(k)}>
            <Plus className="h-4 w-4" strokeWidth={3.5} aria-hidden="true" />
            {CONSTRAINT[k]}
          </button>
        ))}
      </div>
    </div>
  );
}

function DertStep({ raw, setRaw }: { raw: string; setRaw: (v: string) => void }) {
  const n = raw.trim().length;
  return (
    <div>
      <h1 className="text-[26px] font-black leading-tight text-ink sm:text-[30px]">Derdini kendi sözlerinle anlat</h1>
      <p className="mt-2 text-[16px] font-bold text-ink-3">Nasıl anlatıyorsan öyle yaz. Alanları ben doldururum, yalnız eksik kalanları sorarım.</p>
      <Coach tip="Rakam, kısıt ve istediğin sonuç varsa hepsini ekle." mood="wave" />
      <textarea
        className="field mt-2 min-h-[168px] resize-none"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder="ör. Müşterilerimiz kargolarının nerede olduğunu göremiyor, çağrı merkezimiz sürekli arıyor…"
        aria-label="Derdini anlat"
        autoFocus
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className={`num text-[13px] font-bold ${n >= 30 ? 'text-green-lip' : 'text-ink-3'}`}>{n >= 30 ? 'Yeterli' : `En az 30 karakter · ${n}`}</span>
        <button type="button" className="btn-quiet btn-sm" onClick={() => setRaw(SAMPLE_COMPLAINT)}>
          Örnekle doldur
        </button>
      </div>
      <p className="hint">Kural tabanlı çalışır, çevrim dışıdır. Yazdıkların cihazından çıkmaz.</p>
    </div>
  );
}

interface ReviewProps {
  org: string;
  c: Canvas;
  title: string;
  skills: string[];
  a: ReturnType<typeof assessCanvas>;
  titleOk: boolean;
  ready: boolean;
  draftLeft: string;
  canMem: boolean;
  onMem: () => void;
  onEdit: (step: string) => void;
  onBack: () => void;
  onSave: () => void;
  onPublish: () => void;
  live: boolean;
}

function Review({ org, c, title, skills, a, titleOk, ready, draftLeft, canMem, onMem, onEdit, onBack, onSave, onPublish, live }: ReviewProps) {
  const fixes = [
    ...a.checks.filter((k) => !k.ok).map((k) => ({ id: k.id, step: k.field as string, label: k.label, must: k.blocking, points: k.points })),
    ...(titleOk ? [] : [{ id: 'title', step: 'title', label: 'Başlık yazıldı', must: false, points: 0 }]),
  ].sort((x, y) => Number(y.must) - Number(x.must));
  const rowOk = (f: string) => (f === 'title' ? titleOk : a.checks.filter((k) => k.field === f).every((k) => k.ok));
  const empty = <span className="text-ink-3">Henüz yazılmadı</span>;
  const crit = c.criteria.filter((k) => k.text.trim());
  const cons = c.constraints.filter((k) => k.text.trim());
  const rows: { f: Q; v: ReactNode }[] = [
    { f: 'title', v: title.trim() || empty },
    { f: 'current', v: c.current.trim() || empty },
    { f: 'pain', v: c.pain.trim() || empty },
    { f: 'painMetric', v: c.painMetric.trim() || empty },
    { f: 'outcome', v: c.outcome.trim() || empty },
    {
      f: 'criteria',
      v: crit.length ? (
        <ol className="list-decimal space-y-1 pl-5">
          {crit.map((k) => (
            <li key={k.id}>{k.text}</li>
          ))}
        </ol>
      ) : (
        empty
      ),
    },
    {
      f: 'constraints',
      v: cons.length ? (
        <ul className="space-y-1">
          {cons.map((k, j) => (
            <li key={j}>
              <b>{CONSTRAINT[k.kind]}:</b> {k.text}
            </li>
          ))}
        </ul>
      ) : (
        empty
      ),
    },
    { f: 'decisionMaker', v: c.decisionMaker.trim() || empty },
    { f: 'scope', v: c.scope.trim() || empty },
    {
      f: 'skills',
      v: skills.length ? (
        <span className="flex flex-wrap gap-1.5">
          {skills.map((k) => (
            <span key={k} className="chip">
              {skillLabel(k)}
            </span>
          ))}
        </span>
      ) : (
        empty
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-[26px] font-black leading-tight text-ink sm:text-[30px]">Her şey doğru mu?</h1>
      <p className="mt-2 flex items-center gap-2 text-[16px] font-bold text-ink-3">
        <OrgMark name={org} size={24} />
        <span>{live ? `${org} için kaydedilecek.` : `${org} adına yayımlanır.`}</span>
      </p>

      <div className="card mt-5 flex items-center gap-4 p-4">
        <Ring value={a.score} size={72} label="çözülebilirlik" tone={a.canPublish ? 'green' : 'indigo'} />
        <div className="min-w-0">
          <p className="text-[18px] font-black text-ink">{ready ? 'Yayına hazır' : (gateNote(a) ?? 'Neredeyse hazır')}</p>
          <p className="text-[14px] font-bold text-ink-3">Çözülebilirlik puanı. Yayın kapısı {PUBLISH_THRESHOLD}.</p>
        </div>
      </div>

      {!ready && fixes.length > 0 && (
        <div className="mt-4 rounded-[16px] bg-bg-2 p-4">
          <p className="text-[15px] font-extrabold text-ink">Yayımlamadan önce</p>
          <ul className="mt-2 space-y-1">
            {fixes.slice(0, 5).map((k) => (
              <li key={k.id} className="flex items-center gap-3">
                <span className="min-w-0 flex-1 text-[15px] font-bold text-ink-2">
                  {k.label}
                  {k.must && <span className="ml-2 text-[13px] font-extrabold text-indigo">zorunlu</span>}
                </span>
                {k.points > 0 && <span className="num hidden text-[14px] font-black text-ink-3 sm:inline">+{k.points}</span>}
                <button type="button" className="btn-quiet btn-sm" onClick={() => onEdit(k.step)}>
                  Düzelt
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="card mt-4 divide-y-2 divide-line">
        {rows.map((r) => (
          <li key={r.f} className="flex items-start gap-3 px-4 py-3">
            <span className="mt-1">
              <StatusIcon kind={rowOk(r.f) ? 'ok' : 'pending'} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-extrabold text-ink-3">{LABEL[r.f]}</p>
              <div className="mt-0.5 break-words text-[15px] font-bold leading-snug text-ink-2">{r.v}</div>
            </div>
            <button type="button" className="btn-quiet btn-sm shrink-0" onClick={() => onEdit(r.f)} aria-label={`${LABEL[r.f]} alanını düzenle`}>
              Düzenle
            </button>
          </li>
        ))}
      </ul>

      {canMem && (
        <button type="button" className="btn-quiet btn-sm mt-3" onClick={onMem}>
          Benzer ihtiyaçlar nasıl sonuçlandı?
        </button>
      )}

      <div className="mt-6 space-y-3">
        {live ? (
          <button type="button" className="btn-primary btn-lg btn-block" onClick={onSave}>
            {draftLeft}
          </button>
        ) : (
          <button type="button" className="btn-primary btn-lg btn-block" disabled={!ready} onClick={onPublish}>
            Yayımla
          </button>
        )}
        <div className={`grid gap-3 ${live ? '' : 'grid-cols-2'}`}>
          <button type="button" className="btn-line btn-block" onClick={onBack}>
            Geri
          </button>
          {!live && (
            <button type="button" className="btn-line btn-block" onClick={onSave}>
              {draftLeft}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Finished({ done, onResume }: { done: Done; onResume: () => void }) {
  const copy = {
    published: { h: 'İhtiyacın yayında', p: done.fits ? `${done.fits} aday ihtiyacına uyuyor. Kimlikler ilk temasa kadar gizli kalır.` : 'Henüz uyan aday yok; yeni kanıtlar geldikçe burada görünür.' },
    draft: { h: 'Taslak kaydedildi', p: 'Kaldığın yerden istediğin zaman devam edebilirsin.' },
    saved: { h: 'Değişiklikler kaydedildi', p: 'İhtiyacın güncel hâli adaylara yansıdı.' },
  }[done.kind];
  return (
    <div className="mx-auto flex max-w-[480px] flex-col items-center py-10 text-center">
      <CheckCircle size={84} className="pop" />
      <h1 className="mt-5 text-[28px] font-black text-ink">{copy.h}</h1>
      <p className="lead mt-2">{copy.p}</p>
      <div className="mt-8 flex w-full flex-col gap-3">
        {done.kind === 'published' ? (
          <>
            <a href={`/ihtiyaclar/${done.id}#adaylar`} className="btn-primary btn-lg btn-block">
              Adayları gör
            </a>
            <a href="/ihtiyaclar" className="btn-quiet btn-block">
              Tüm ihtiyaçlar
            </a>
          </>
        ) : (
          <>
            <a href={done.kind === 'saved' ? `/ihtiyaclar/${done.id}` : '/ihtiyaclar'} className="btn-primary btn-lg btn-block">
              {done.kind === 'saved' ? 'İhtiyaca dön' : 'İhtiyaçlara dön'}
            </a>
            <button type="button" className="btn-line btn-block" onClick={onResume}>
              Düzenlemeye devam et
            </button>
          </>
        )}
      </div>
    </div>
  );
}
