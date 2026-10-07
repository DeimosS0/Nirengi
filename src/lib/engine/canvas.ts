// İhtiyaç Kanvası: self-scoring problem definition with a publish threshold,
// plus a rule-based draft extractor that turns a free-text complaint into
// canvas fields and asks only for what is missing.

import type { Canvas, Constraint } from '../types.ts';
import { norm, skillsInText } from '../skills.ts';

export const PUBLISH_THRESHOLD = 70;

export interface Check {
  id: string;
  field: keyof Canvas | 'skills';
  label: string;
  ok: boolean;
  points: number;
  blocking: boolean;
  fix: string;
}

// A criterion is checkable if it carries a threshold or names a binary deliverable.
const MEASURABLE = /\d|%|yüzde/;
const DELIVERABLE = /teslim edil|yayımlan|yayımlan|belgelen|hazırlan|entegre edil|bağlanır|doğrulayıcıdan geçer/;
export const isMeasurable = (s: string) => MEASURABLE.test(s);
export const isCheckable = (s: string) => MEASURABLE.test(s) || DELIVERABLE.test(s.toLocaleLowerCase('tr-TR'));

export function assessCanvas(c: Canvas, skills: string[]) {
  const vague = c.criteria.find((k) => k.text.trim() && !isCheckable(k.text));
  const filled = c.criteria.filter((k) => k.text.trim());
  const checks: Check[] = [
    {
      id: 'current',
      field: 'current',
      label: 'Mevcut durum somut',
      ok: c.current.trim().length >= 40,
      points: 10,
      blocking: false,
      fix: 'Mevcut durumu somutlaştırın: hangi süreç, hangi araçla, ne ölçekte işliyor?',
    },
    {
      id: 'pain',
      field: 'pain',
      label: 'Acı noktası tanımlı',
      ok: c.pain.trim().length >= 25,
      points: 10,
      blocking: false,
      fix: 'Sorunun kimi, nasıl etkilediğini bir cümleyle yazın.',
    },
    {
      id: 'painMetric',
      field: 'painMetric',
      label: 'Acı sayıyla ölçülmüş',
      ok: isMeasurable(c.painMetric),
      points: 15,
      blocking: true,
      fix: 'Acı ölçülmemiş. Bugünkü değeri bir sayıyla verin: süre, oran, maliyet, adet.',
    },
    {
      id: 'outcome',
      field: 'outcome',
      label: 'Hedef çıktı belli',
      ok: c.outcome.trim().length >= 25,
      points: 10,
      blocking: false,
      fix: 'Deneme projesi sonunda elinizde ne olacak? Bir ürün, servis, rapor…',
    },
    {
      id: 'criteriaCount',
      field: 'criteria',
      label: 'En az 2 başarı kriteri',
      ok: filled.length >= 2,
      points: 10,
      blocking: false,
      fix: 'En az iki başarı kriteri ekleyin; her biri deneme projesinde bir aşama olacak.',
    },
    {
      id: 'criteriaMeasurable',
      field: 'criteria',
      label: 'Kriterler ölçülebilir',
      ok: filled.length > 0 && !vague,
      points: 15,
      blocking: true,
      fix: vague
        ? `Başarı kriteri ölçülebilir değil: “${vague.text.trim()}”. Bir eşik değeri ya da somut bir teslim ekleyin.`
        : 'Ölçülebilir bir başarı kriteri ekleyin (ör. “… süresi 5 dakikanın altına iner”).',
    },
    {
      id: 'constraints',
      field: 'constraints',
      label: 'Kısıtlar yazılmış',
      ok: c.constraints.some((k) => k.text.trim()),
      points: 10,
      blocking: false,
      fix: 'Bütçe, veri, mevzuat veya süre kısıtlarından en az birini yazın.',
    },
    {
      id: 'decisionMaker',
      field: 'decisionMaker',
      label: 'Karar verici atanmış',
      ok: c.decisionMaker.trim().length >= 3,
      points: 10,
      blocking: true,
      fix: 'Karar verici atanmamış. Kilometre taşlarını kurum adına kim onaylayacak?',
    },
    {
      id: 'scope',
      field: 'scope',
      label: 'Deneme projesinin kapsamı sınırlı',
      ok: c.scope.trim().length >= 20,
      points: 5,
      blocking: false,
      fix: 'Deneme projesini küçültün: tek depo, tek bölge, tek ürün grubu gibi.',
    },
    {
      id: 'skills',
      field: 'skills',
      label: 'Yetkinlik yüzeyi çıkarıldı',
      ok: skills.length > 0,
      points: 5,
      blocking: false,
      fix: 'Metinden yetkinlik çıkarılamadı; teknoloji ya da alan adı geçirin.',
    },
  ];
  const score = checks.reduce((s, k) => s + (k.ok ? k.points : 0), 0);
  const blockers = checks.filter((k) => k.blocking && !k.ok);
  return { score, checks, blockers, canPublish: score >= PUBLISH_THRESHOLD && blockers.length === 0 };
}

// ---------------------------------------------------------------- draft

const PAIN_CUES = ['yavaş', 'gecik', 'sorun', 'zorlan', 'şikâyet', 'şikayet', 'kaybed', 'kaçır', 'hata', 'bekl', 'terk', 'göremiyor', 'bilmiyor', 'yetişmiyor', 'uzun sür'];
const CURRENT_CUES = [' var', 'kullan', 'yapılıyor', 'ediliyor', 'dönüşüyor', 'şu an', 'mevcut', 'elle', 'hesaplanıyor', 'tutuluyor'];
const GOAL_CUES = ['istiyoruz', 'hedef', 'olsun', 'olmalı', 'amacımız', 'ihtiyacımız', 'arıyoruz', 'gerekiyor'];
const UNIT = /\d[\d.,]*\s*(%|dk|dakika|saat|gün|hafta|ay|tl|adet|kişi|sn|saniye|arama|sipariş)|%\s*\d+/;

const sentences = (t: string) =>
  t
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);

const has = (s: string, cues: string[]) => cues.some((c) => norm(s).includes(c));

export interface Draft {
  title: string;
  canvas: Canvas;
  skills: string[];
  questions: { field: keyof Canvas; q: string }[];
  extracted: (keyof Canvas)[];
}

export function draftFromText(text: string): Draft {
  const ss = sentences(text);
  const used = new Set<string>();
  const take = (pred: (s: string) => boolean) => {
    const s = ss.find((x) => !used.has(x) && pred(x));
    if (s) used.add(s);
    return s ?? '';
  };

  const painMetric = take((s) => UNIT.test(norm(s)) && !/\btl\b/.test(norm(s)));
  const pain = take((s) => has(s, PAIN_CUES));
  const outcome = take((s) => has(s, GOAL_CUES));
  const current = take((s) => has(` ${s}`, CURRENT_CUES)) || take((s) => !/\btl\b/.test(norm(s)));

  const constraints: Constraint[] = [];
  const low = norm(text);
  const money = text.match(/\d[\d.,]*\s*(bin\s*)?TL/i);
  if (money) constraints.push({ kind: 'butce', text: `Bütçe: ${money[0]}` });
  const time = low.match(/(\d+)\s*(hafta|ay|gün)/);
  if (time) constraints.push({ kind: 'sure', text: `Süre: ${time[0]}` });
  if (/kvkk|kişisel veri|mevzuat|regülasyon|gizlilik/.test(low))
    constraints.push({ kind: 'mevzuat', text: ss.find((s) => /kvkk|kişisel veri|mevzuat|gizlilik/.test(norm(s))) ?? 'KVKK kapsamında veri' });

  const skills = skillsInText(text);
  const title = makeTitle(outcome || pain || ss[0] || 'Yeni ihtiyaç');

  const canvas: Canvas = {
    current,
    pain,
    painMetric,
    outcome,
    criteria: [],
    constraints,
    decisionMaker: '',
    scope: '',
  };

  const questions: Draft['questions'] = [];
  if (!painMetric) questions.push({ field: 'painMetric', q: 'Bu sorun bugün hangi sayıyla ölçülüyor? (süre, oran, maliyet)' });
  questions.push({ field: 'criteria', q: 'Deneme projesi başarılı sayılırsa hangi sayı nereye gelmiş olacak?' });
  questions.push({ field: 'decisionMaker', q: 'Kilometre taşlarını kurum adına kim onaylayacak?' });
  questions.push({ field: 'scope', q: 'Deneme projesini en küçük hâliyle nerede yapabiliriz? (tek bölge, tek müşteri…)' });
  if (!constraints.length) questions.push({ field: 'constraints', q: 'Bütçe, süre, veri ya da mevzuat kısıtınız var mı?' });

  const extracted = (Object.keys(canvas) as (keyof Canvas)[]).filter((k) => {
    const v = canvas[k];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  });

  return { title, canvas, skills, questions: questions.slice(0, 5), extracted };
}

function makeTitle(s: string) {
  let t = s
    .replace(/\s*(istiyoruz|arıyoruz|gerekiyor|olsun|olmalı)[.!]*$/i, '')
    .replace(/^(biz|bizim|amacımız|hedefimiz)\s+/i, '')
    .replace(/[.!?]+$/, '')
    .trim();
  if (t.length > 96) t = `${t.slice(0, 93).replace(/\s+\S*$/, '')}…`;
  return t.charAt(0).toLocaleUpperCase('tr-TR') + t.slice(1);
}

export const SAMPLE_COMPLAINT =
  'Kurumsal müşterilerimiz kargolarının nerede olduğunu göremiyor ve sürekli çağrı merkezimizi arıyor. ' +
  'Çağrı merkezine gelen aramaların %40’ı “kargom nerede” sorusu, ayda yaklaşık 6.000 arama. ' +
  'Araçlarımızda GPS cihazı var ama konum verisi günde bir kez Excel raporuna dönüşüyor. ' +
  'Müşterilerimize araç konumlarını canlı haritada gösteren bir web paneli istiyoruz. ' +
  'Bütçemiz 40.000 TL ve 6 hafta içinde sonuç görmek istiyoruz. ' +
  'Konum verisi KVKK kapsamında; müşteri adresleri paylaşılmayacak.';
