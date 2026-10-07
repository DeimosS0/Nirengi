// Görevler: this week's quests, growth quests drawn from your own match gaps,
// and real open-source issues that count only once a PR is merged.

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronRight, Clock, ExternalLink, Loader2, MessageSquare } from 'lucide-react';
import { actions, currentMe, getState, useAppState } from '../../lib/store.ts';
import { questsFor, totalXp, weekKey, XP, type Quest } from '../../lib/engine/progress.ts';
import { checkMergedPr, githubLogin, goodFirstIssues, OssError, ossLanguages, searchLink, type OssIssue } from '../../lib/oss.ts';
import { relTime, uid } from '../../lib/format.ts';
import { LANGUAGE_SKILLS } from '../../lib/skills.ts';
import type { Evidence, QuestKind } from '../../lib/types.ts';
import { Bar, celebrate, EmptyState, feedback, Head, Sheet, Why } from '../ui/kit';
import { Bolt, Bubbles, CheckCircle, Chest, Compass, Flag, Flame, GitHub } from '../ui/icons';

const DAY = 86_400_000;

function left(ms: number) {
  const m = Math.max(0, Math.floor(ms / 60_000));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  if (d) return `${d} gün${h ? ` ${h} saat` : ''}`;
  return h ? `${h} saat ${m % 60} dk` : `${m} dk`;
}

const KIND: Record<QuestKind, string> = { oss: 'Açık kaynak', haftalik: 'Haftalık', gelisim: 'Gelişim' };

/** One plain message per failure, shared by the issue list and the PR check. */
function ossMessage(e: unknown, login?: string | null) {
  const err = e instanceof OssError ? e : new OssError('unexpected');
  switch (err.kind) {
    case 'rate':
      return { title: 'GitHub sorgu sınırı doldu', text: `Kimliksiz sorgular dakikada 10 ile sınırlı. Yaklaşık ${err.retryMin ?? 1} dk sonra yeniden dene.` };
    case 'offline':
      return { title: 'GitHub’a ulaşılamadı', text: 'Bağlantını kontrol edip yeniden dene.' };
    case 'invalid':
      return { title: 'GitHub bu sorguyu kabul etmedi', text: login ? `@${login} kullanıcı adı doğru mu? Profilinden kontrol et.` : 'Biraz sonra yeniden dene.' };
    default:
      return { title: 'GitHub beklenmeyen bir yanıt verdi', text: 'Biraz sonra yeniden dene.' };
  }
}

const WEEKLY_ICON = { goal: Flame, help: Bubbles, quest: Flag } as const;

export default function QuestsPage() {
  const s = useAppState();
  const me = currentMe(s);
  const reduce = useReducedMotion();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const week = weekKey(now);
  const quests = questsFor(s, me, now);
  const weekly = quests.filter((q) => q.kind === 'haftalik');
  const growth = quests.filter((q) => q.kind === 'gelisim');
  const mine = s.quests.filter((q) => q.personId === me.id);
  const claimedIds = new Set(mine.map((q) => q.questId));
  const proofs = mine.flatMap((q) => (q.proof ? [q.proof] : []));
  const doneThisWeek = mine.filter((q) => weekKey(q.at) === week);
  const weekEnd = new Date(`${week}T00:00:00`).getTime() + 7 * DAY;
  const ready = weekly.filter((q) => q.complete).length;
  const allClaimed = weekly.every((q) => claimedIds.has(q.id));

  const [whyOpen, setWhyOpen] = useState(false);

  // The shell links to /gorevler#acik-kaynak; the target only exists after hydration.
  useEffect(() => {
    if (!location.hash) return;
    const t = window.setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }), 300);
    return () => window.clearTimeout(t);
  }, [reduce]);

  const claim = (q: Quest) => {
    actions.completeQuest({ questId: q.id, personId: me.id, kind: 'haftalik', title: q.title, xp: q.xp });
    const last = weekly.every((x) => x.id === q.id || claimedIds.has(x.id));
    if (last) celebrate({ title: 'Haftanın görevleri tamam', sub: 'Üç sandığı da açtın. Haftayı düzenli üretimle kapatıyorsun.', xp: totalXp(getState(), me), cta: 'Harika' });
    else feedback({ tone: 'good', title: `+${q.xp} XP kazandın`, text: `${q.title} görevi tamam.` });
  };

  // ------------------------------------------------------------ open source

  const langs = ossLanguages(me);
  const langKey = langs.join(',');
  const [tick, setTick] = useState(0);
  const [oss, setOss] = useState<{ status: 'loading' } | { status: 'ok'; issues: OssIssue[] } | { status: 'error'; error: unknown }>({ status: 'loading' });
  useEffect(() => {
    let live = true;
    setOss({ status: 'loading' });
    goodFirstIssues(langKey.split(','))
      .then((issues) => live && setOss({ status: 'ok', issues }))
      .catch((error) => live && setOss({ status: 'error', error }));
    return () => {
      live = false;
    };
  }, [langKey, tick]);

  const [open, setOpen] = useState(false);
  const [issue, setIssue] = useState<OssIssue | null>(null);
  const [busy, setBusy] = useState(false);
  const login = githubLogin(me);

  const verify = async (it: OssIssue) => {
    if (!login) {
      feedback({ tone: 'bad', title: 'Önce GitHub hesabını bağla', text: 'PR’ın sana ait olduğunu hesabın üzerinden doğruluyoruz.' });
      return;
    }
    setBusy(true);
    try {
      const pr = await checkMergedPr(login, it.repo, { since: it.createdAt, skip: proofs });
      if (!pr) {
        feedback({
          tone: 'bad',
          title: 'Henüz birleşmiş bir PR yok',
          text: `${it.repo} deposunda @${login} adına birleşmiş bir PR göremedim. PR açıksa bakımcının birleştirmesini bekle, sonra yeniden kontrol et.`,
        });
        return;
      }
      const evidence: Evidence = {
        id: uid('e-oss'),
        title: `${pr.title} — ${it.repo}`,
        summary: `${it.repo} deposuna gönderdiğin PR birleştirildi.`,
        source: 'github',
        level: 'S2',
        skills: LANGUAGE_SKILLS[it.language] ?? [],
        url: pr.url,
        metrics: [
          { label: 'depo', value: it.repo },
          { label: 'dil', value: it.language },
        ],
        producedAt: pr.mergedAt,
        verifiedAt: new Date().toISOString(),
        verifier: 'GitHub API · birleşmiş PR',
      };
      const before = totalXp(getState(), me);
      actions.completeQuest({ questId: `oss-${it.id}`, personId: me.id, kind: 'oss', title: `${it.repo}: ${it.title}`, xp: XP.milestone, proof: pr.url }, evidence);
      const after = totalXp(getState(), me);
      setOpen(false);
      celebrate({
        title: 'PR’ın birleşti!',
        sub: `${pr.title} · ${it.repo}. Profiline doğrulanmış iş olarak eklendi${after > before ? `, +${after - before} XP` : ''}.`,
        xp: after,
        cta: 'Harika',
      });
    } catch (e) {
      const m = ossMessage(e, login);
      feedback({ tone: 'bad', title: m.title, text: m.text });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[600px]">
      {/* Banner */}
      <section className="flex items-center gap-4 rounded-[20px] bg-indigo p-5 text-white" style={{ boxShadow: '0 5px 0 rgb(var(--indigo-lip))' }} aria-labelledby="gorevler">
        <div className="min-w-0 flex-1">
          <h1 id="gorevler" className="text-[26px] font-black leading-tight text-white">
            Haftanın görevleri
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[15px] font-extrabold text-white/85">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" strokeWidth={3} />
              <span className="num">{left(weekEnd - now)}</span> kaldı
            </span>
            <span className="num">
              {ready}/{weekly.length} tamam
            </span>
          </p>
          <button type="button" onClick={() => setWhyOpen(true)} className="mt-2 text-[13px] font-extrabold text-white underline-offset-2 hover:underline">
            Görevler nereden geliyor?
          </button>
        </div>
        <span className="grid h-[92px] w-[92px] shrink-0 place-items-center rounded-[22px] bg-white/15">
          <Chest size={72} open={allClaimed} />
        </span>
      </section>

      {/* Weekly */}
      <ul className="mt-5 space-y-3" aria-label="Haftalık görevler">
        {weekly.map((q) => (
          <li key={q.id}>
            <WeeklyRow q={q} claimed={claimedIds.has(q.id)} onClaim={() => claim(q)} />
          </li>
        ))}
      </ul>

      {/* Growth */}
      <section className="mt-12" aria-labelledby="gelisim">
        <Head title={<span id="gelisim">Gelişim görevleri</span>} action={<span className="pill bg-cyan-tint text-cyan-lip">Sana özel</span>} />
        <p className="mt-1 text-[15px] font-bold text-ink-3">
          Profilinle gerçek açık ihtiyaçlar arasındaki boşluklardan üretildi. Başkasında farklı görünür.{' '}
          <Why title="Bu görevler neden bana çıktı?" label="Neden bana?">
            <p className="text-[15px] font-bold text-ink-3">
              Eşleştirici, profilini kurumların yayımladığı açık ihtiyaçlarla karşılaştırır. Bir ihtiyaçta eksik kalan beceriyi bulur ve o alanda doğrulanmış bir iş eklersen uyum puanının kaça çıkacağını hesaplar; görevdeki iki sayı bu hesaptır.
            </p>
            <p className="mt-3 text-[15px] font-bold text-ink-3">
              Puan her açılışta yeniden hesaplanır. Yeni bir doğrulanmış iş eklediğinde görevler de değişir. Bu görevleri bir kurum yazmaz.
            </p>
          </Why>
        </p>
        {growth.length ? (
          <ul className="mt-4 space-y-3">
            {growth.map((q) => (
              <li key={q.id}>
                <a href={q.href} className="card-press flex items-center gap-4 p-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-cyan-tint">
                    <Compass size={30} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-extrabold leading-snug text-ink">{q.title}</p>
                    <p className="mt-1 text-[14px] font-bold text-ink-3">{q.why}</p>
                    <p className="mt-2 text-[13px] font-extrabold text-cyan-lip">Doğrulanan her iş +{XP.evidence} XP</p>
                  </div>
                  <ChevronRight className="h-6 w-6 shrink-0 text-ink-3" strokeWidth={3} />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="card mt-4 p-5 text-[15px] font-bold text-ink-3">Şu an açık ihtiyaçlarla aranda kapanabilecek bir boşluk görünmüyor. Yeni ihtiyaçlar yayımlanınca burada belirir.</p>
        )}
      </section>

      {/* Open source */}
      <section id="acik-kaynak" className="mt-12 scroll-mt-24" aria-labelledby="oss">
        <Head title={<span id="oss">Açık kaynak görevleri</span>} action={<span className="hidden text-[13px] font-bold text-ink-3 sm:inline">GitHub’daki gerçek issue’lar</span>} />
        <p className="mt-1 text-[15px] font-bold text-ink-3">Yalnız PR’ın birleştirilince sayılır. Bunu GitHub’dan biz doğrularız, sen beyan etmezsin.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-bold text-ink-3">Dillerin</span>
          {langs.map((l) => (
            <span key={l} className="chip">
              {l}
            </span>
          ))}
          <Why title="Bu diller neden?" label="Neden bunlar?">
            <p className="text-[15px] font-bold text-ink-3">
              Kanıtlarındaki depo dillerine ve becerilere bakılır; doğrulanmış işler daha çok, beyanlar daha az ağırlık taşır. En çok öne çıkan en fazla iki dil seçilir, çünkü GitHub kimliksiz sorguları dakikada 10 ile sınırlar. Henüz kanıtın yoksa TypeScript ve Python’a bakılır.
            </p>
          </Why>
        </div>

        <div className="mt-4">
          {oss.status === 'loading' && (
            <ul className="space-y-3" aria-busy="true" aria-label="Issue’lar yükleniyor">
              {[0, 1, 2].map((i) => (
                <li key={i} className="card animate-pulse space-y-3 p-4">
                  <div className="h-3.5 w-1/3 rounded-full bg-bg-3" />
                  <div className="h-5 w-4/5 rounded-full bg-bg-3" />
                  <div className="flex gap-2">
                    <div className="h-6 w-16 rounded-full bg-bg-3" />
                    <div className="h-6 w-20 rounded-full bg-bg-3" />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {oss.status === 'ok' && oss.issues.length > 0 && (
            <ul className="space-y-3">
              {oss.issues.map((it) => {
                const done = claimedIds.has(`oss-${it.id}`);
                const labels = it.labels.filter((x) => x.toLowerCase() !== 'good first issue').slice(0, 3);
                const inner = (
                  <>
                    <span className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-1.5 text-[13px] font-extrabold text-ink-3">
                        <GitHub size={16} />
                        <span className="truncate">{it.repo}</span>
                      </span>
                      <span className="chip shrink-0">{it.language}</span>
                    </span>
                    <span className="mt-2 block break-words text-[16px] font-extrabold leading-snug text-ink">{it.title}</span>
                    {labels.length > 0 && (
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        {labels.map((x) => (
                          <span key={x} className="chip max-w-[200px] bg-bg-2">
                            <span className="truncate">{x}</span>
                          </span>
                        ))}
                      </span>
                    )}
                    <span className="mt-3 flex items-center justify-between gap-3">
                      <span className="flex min-w-0 flex-wrap items-center gap-x-3 text-[13px] font-bold text-ink-3">
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" strokeWidth={3} />
                          {it.comments} yorum
                        </span>
                        <span>{relTime(it.updatedAt)} güncellendi</span>
                      </span>
                      {done ? (
                        <span className="pill shrink-0 bg-green-tint text-green-lip">
                          <CheckCircle size={18} />
                          Tamamlandı
                        </span>
                      ) : (
                        <span className="btn-line btn-sm pointer-events-none shrink-0">Üstlen</span>
                      )}
                    </span>
                  </>
                );
                return (
                  <li key={it.id}>
                    {done ? (
                      <div className="card block p-4">{inner}</div>
                    ) : (
                      <button
                        type="button"
                        className="card-press block w-full p-4 text-left"
                        onClick={() => {
                          setIssue(it);
                          setOpen(true);
                        }}
                      >
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {(oss.status === 'error' || (oss.status === 'ok' && oss.issues.length === 0)) && (
            <div>
              <div className="rounded-[16px] bg-orange-tint p-4">
                <p className="text-[16px] font-black text-orange-ink">{oss.status === 'error' ? ossMessage(oss.error).title : 'Şu an açık issue bulamadım'}</p>
                <p className="mt-0.5 text-[14px] font-bold text-orange-ink">
                  {oss.status === 'error' ? ossMessage(oss.error).text : 'Bu diller için sahipsiz, açık bir “good first issue” görünmüyor.'} Bu arada GitHub’da kendin arayabilirsin.
                </p>
              </div>
              <ul className="mt-3 space-y-3">
                {langs.map((l) => (
                  <li key={l}>
                    <a href={searchLink(l)} target="_blank" rel="noreferrer" className="card-press flex items-center justify-between gap-3 p-4">
                      <span>
                        <span className="block text-[16px] font-extrabold text-ink">{l} için iyi ilk issue’lar</span>
                        <span className="block text-[13px] font-bold text-ink-3">GitHub’da ara</span>
                      </span>
                      <ExternalLink className="h-5 w-5 shrink-0 text-ink-3" strokeWidth={3} />
                    </a>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn-line btn-sm mt-3"
                onClick={() => {
                  setTick((n) => n + 1);
                  feedback({ tone: 'info', title: 'Yeniden deniyorum', text: 'GitHub’dan issue’lar isteniyor.' });
                }}
              >
                Tekrar dene
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Done this week */}
      <section className="mt-12" aria-labelledby="biten">
        <Head title={<span id="biten">Tamamlananlar</span>} action={<span className="text-[13px] font-bold text-ink-3">Bu hafta</span>} />
        {doneThisWeek.length ? (
          <ul className="card mt-4 px-4">
            {doneThisWeek.map((q, i) => (
              <li key={q.id} className={`flex items-center gap-3 py-3 ${i ? 'border-t-2 border-line' : ''}`}>
                <CheckCircle size={28} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-extrabold text-ink">{q.title}</p>
                  <p className="text-[13px] font-bold text-ink-3">
                    {KIND[q.kind]} · {relTime(q.at)}
                    {q.proof && (
                      <>
                        {' · '}
                        <a href={q.proof} target="_blank" rel="noreferrer" className="text-indigo hover:underline">
                          PR’a bak
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <span className="num shrink-0 text-[15px] font-black text-gold-ink">+{q.xp} XP</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4">
            <EmptyState
              title="Bu hafta henüz görev bitirmedin"
              action={
                <a href="#acik-kaynak" className="btn-line">
                  Bir görev seç
                </a>
              }
            >
              Haftalık bir görevi tamamlayıp sandığını aç ya da gerçek bir issue’ya katkı ver. Bitenler burada birikir.
            </EmptyState>
          </div>
        )}
      </section>

      {/* Why */}
      <Sheet open={whyOpen} onClose={() => setWhyOpen(false)} title="Görevler nereden geliyor?">
        <ul className="space-y-4 text-[15px] font-bold text-ink-3">
          <li>
            <b className="block text-[16px]">Haftalıklar herkes için aynı</b>
            Haftalık hedefin, topluluğa bir cevap ve bir görev bitirmek. Her hafta Pazartesi yenilenir.
          </li>
          <li>
            <b className="block text-[16px]">Gelişim görevleri sana özel</b>
            Profilinle gerçek açık ihtiyaçlar arasındaki boşluklardan çıkar. Hangi ihtiyaca ne kadar yaklaşacağın görevin altında yazar.
          </li>
          <li>
            <b className="block text-[16px]">Açık kaynak görevleri gerçek</b>
            GitHub’daki açık, sahipsiz “good first issue”lar. Yalnız PR’ın birleştirildiğinde sayılır; bunu GitHub kayıtlarından doğrularız, beyanla olmaz.
          </li>
          <li>
            <b className="block text-[16px]">Kurumlar görev yazmaz</b>
            Kurumlar yalnız ihtiyaç yayımlar ve aşamaları onaylar. Görevleri ne bir kurum ne de başka biri sana atar.
          </li>
        </ul>
        <button type="button" onClick={() => setWhyOpen(false)} className="btn-primary btn-block mt-6">
          Anladım
        </button>
      </Sheet>

      {/* Take an issue */}
      <Sheet open={open} onClose={() => setOpen(false)} title="Bu görevi üstlen">
        {issue && (
          <div>
            <p className="text-[13px] font-extrabold text-ink-3">{issue.repo}</p>
            <p className="break-words text-[17px] font-black leading-snug text-ink">{issue.title}</p>
            <ol className="mt-5 space-y-4">
              {[
                ['Issue’yu aç', 'GitHub’da issue’yu oku. Ne istendiğini ve nasıl çalıştırılacağını anlamadan başlama.'],
                ['Yorum bırakıp üstlen', 'Altına “Üzerinde çalışabilir miyim?” diye yaz ve bakımcının onayını bekle. Böylece iki kişi aynı işi yapmaz.'],
                ['PR gönder', 'Değişikliğini Pull Request olarak gönder. Birleştirildiğinde buraya dönüp kontrol et.'],
              ].map(([title, text], i) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="num grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo text-[15px] font-black text-white">{i + 1}</span>
                  <div>
                    <p className="text-[16px] font-extrabold text-ink">{title}</p>
                    <p className="text-[14px] font-bold text-ink-3">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
            {!login && (
              <div className="mt-5 rounded-[16px] bg-indigo-tint p-4">
                <p className="text-[15px] font-black text-indigo">GitHub hesabın bağlı değil</p>
                <p className="mt-0.5 text-[14px] font-bold text-ink-2">PR’ın sana ait olduğunu hesabın üzerinden doğrularız. Önce hesabını bağla.</p>
                <a href="/kanit-bagla" className="btn-primary btn-sm mt-3">
                  Hesabını bağla
                </a>
              </div>
            )}
            <div className="mt-6 space-y-3">
              <a href={issue.url} target="_blank" rel="noreferrer" className="btn-primary btn-block">
                Issue’yu aç
                <ExternalLink className="h-5 w-5" strokeWidth={3} />
              </a>
              <button type="button" className="btn-line btn-block" disabled={busy} onClick={() => verify(issue)}>
                {busy ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" strokeWidth={3} />
                    GitHub’a bakılıyor
                  </>
                ) : (
                  'PR’ım birleşti, kontrol et'
                )}
              </button>
            </div>
            <p className="mt-4 text-[13px] font-bold text-ink-3">
              Kontrol GitHub’daki herkese açık kayda bakar: {login ? `@${login}` : 'hesabın'} adına bu depoda, issue açıldıktan sonra birleşmiş bir PR arar. Bulursa profiline doğrulanmış iş olarak yazılır.
            </p>
          </div>
        )}
      </Sheet>
    </div>
  );
}

// ---------------------------------------------------------------- weekly row

function WeeklyRow({ q, claimed, onClaim }: { q: Quest; claimed: boolean; onClaim: () => void }) {
  const reduce = useReducedMotion();
  const Icon = WEEKLY_ICON[q.id.split('-')[1] as keyof typeof WEEKLY_ICON] ?? Flag;
  const ready = q.complete && !claimed;
  const done = q.complete;

  const body = (
    <>
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-[14px] ${done ? 'bg-green-tint' : 'bg-bg-2'}`}>
        <Icon size={30} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-extrabold leading-snug text-ink">{q.title}</p>
        <div className="mt-2 flex items-center gap-3">
          <Bar value={q.done / q.of} tone={done ? 'green' : 'gold'} />
          <span className="num shrink-0 text-[14px] font-black text-ink-3">
            {q.done} / {q.of}
          </span>
        </div>
        {!done && <p className="mt-1.5 hidden text-[13px] font-bold text-ink-3 sm:block">{q.why}</p>}
        {ready && (
          <button type="button" onClick={onClaim} className="btn-primary btn-sm mt-3">
            Sandığı aç
          </button>
        )}
      </div>
    </>
  );

  if (ready)
    return (
      <div className="card flex items-center gap-4 !border-gold bg-gold-tint p-4">
        {body}
        <button type="button" onClick={onClaim} tabIndex={-1} aria-hidden="true" className="flex w-[64px] shrink-0 flex-col items-center gap-0.5">
          <motion.span
            animate={reduce ? undefined : { rotate: [0, -10, 10, -6, 6, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 1.4 }}
            className="block"
          >
            <Chest size={46} />
          </motion.span>
          <span className="num inline-flex items-center gap-0.5 text-[13px] font-black text-gold-ink">
            <Bolt size={14} />+{q.xp}
          </span>
        </button>
      </div>
    );

  const chest = (
    <div className="flex w-[64px] shrink-0 flex-col items-center gap-0.5" aria-hidden="true">
      <span className={claimed ? 'pop block' : 'block opacity-45'}>
        <Chest size={46} open={claimed} />
      </span>
      <span className={`num inline-flex items-center gap-0.5 text-[13px] font-black ${claimed ? 'text-green-lip' : 'text-ink-3'}`}>
        {claimed ? 'Alındı' : (
          <>
            <Bolt size={14} />+{q.xp}
          </>
        )}
      </span>
    </div>
  );

  // The weekly quest that points back at this page jumps to the issues below.
  const href = q.href === '/gorevler' ? '#acik-kaynak' : q.href;
  if (href && !done)
    return (
      <a href={href} className="card-press flex items-center gap-4 p-4">
        {body}
        {chest}
      </a>
    );
  return (
    <div className="card flex items-center gap-4 p-4">
      {body}
      {chest}
    </div>
  );
}
