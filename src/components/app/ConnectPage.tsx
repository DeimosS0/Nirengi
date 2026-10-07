// Kanıt bağla: onboarding as a lesson. One thing per screen, a thick progress
// bar on top and one big key at the bottom. Every check still goes to the real
// services (GitHub API, DNS over HTTPS); whatever cannot be proven stays Beyan.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Copy, ExternalLink, Loader2, X } from 'lucide-react';
import type { Evidence, Level, Person, State, WeeklyGoal } from '../../lib/types.ts';
import { actions, getState, useAppState } from '../../lib/store.ts';
import { progress, totalXp, XP } from '../../lib/engine/progress.ts';
import {
  checkDnsTxt,
  checkGitHubChallenge,
  cleanDomain,
  cleanHandle,
  domainEvidence,
  fetchActivityDays,
  fetchGitHub,
  isGitHubLogin,
  MAX_REPOS,
  pickRepos,
  reposToEvidence,
  sessionChallenge,
  txtName,
  txtValue,
  verifyGitHubEvidence,
  VerifyError,
  type GhRepo,
  type GhUser,
  type VerifyKind,
} from '../../lib/verify.ts';
import { LEVELS } from '../../lib/labels.ts';
import { daysAgo, relTime, uid } from '../../lib/format.ts';
import { skillLabel } from '../../lib/skills.ts';
import Niri, { type Mood } from '../ui/Niri';
import { Bar, celebrate, CountUp, feedback, Head, WeekDots, Why } from '../ui/kit';
import { CheckCircle, Flame, Star } from '../ui/icons';
import { Avatar, LevelBadge } from '../ui/primitives';

type StepId = 'home' | 'add' | 'user' | 'found' | 'goal' | 'prove' | 'domain' | 'done';
const FLOW: StepId[] = ['user', 'found', 'goal', 'prove', 'domain'];

interface Scan {
  user: GhUser;
  /** The strongest original repositories, best first. */
  repos: GhRepo[];
  /** Local days with public output in the last 90 days; null when GitHub would not say. */
  days: string[] | null;
  offline: boolean;
}

interface Foot {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  busy?: boolean;
  /** Called when Enter is pressed while the key is disabled. */
  blocked?: () => void;
  side?: { label: string; onClick?: () => void; href?: string };
}

const OFFLINE: Scan = {
  offline: true,
  days: null,
  user: {
    login: 'ornek-gelistirici',
    name: 'Örnek Geliştirici',
    bio: 'Örnek profil',
    avatar_url: '',
    html_url: 'https://github.com',
    public_repos: 3,
    followers: 4,
    created_at: daysAgo(500),
    location: 'İstanbul',
    blog: null,
  },
  repos: [
    { name: 'kargo-izle', description: 'Kurye konumlarını WebSocket ile canlı haritada gösteren React paneli', html_url: 'https://github.com', stargazers_count: 38, forks_count: 6, language: 'TypeScript', fork: false, archived: false, pushed_at: daysAgo(9), created_at: daysAgo(80) },
    { name: 'tr-adres', description: 'Türkçe adres normalizasyonu için Python kütüphanesi', html_url: 'https://github.com', stargazers_count: 21, forks_count: 2, language: 'Python', fork: false, archived: false, pushed_at: daysAgo(40), created_at: daysAgo(300) },
    { name: 'mqtt-koprusu', description: 'Sensör verisini MQTT’den REST API’ye aktaran Go servisi', html_url: 'https://github.com', stargazers_count: 12, forks_count: 1, language: 'Go', fork: false, archived: false, pushed_at: daysAgo(20), created_at: daysAgo(120) },
  ],
};

const ERR_TITLE: Record<VerifyKind, string> = {
  notfound: 'Bu hesabı bulamadık',
  ratelimit: 'GitHub bir süre durdurdu',
  network: 'GitHub’a ulaşamadık',
  other: 'Bir şey ters gitti',
};

const GOALS: { g: WeeklyGoal; name: string; text: string }[] = [
  { g: 1, name: 'Rahat', text: 'Okul ya da iş yoğunken.' },
  { g: 3, name: 'Düzenli', text: 'Çoğu kişi için en sürdürülebilir tempo.' },
  { g: 5, name: 'Yoğun', text: 'Bir şeyi hızla büyütürken.' },
];

const demoUser = () => getState().people.find((p) => p.isDemoUser);
const isGhVerified = (p?: Person) => !!p?.evidence.some((e) => e.source === 'github' && e.level === 'S2');
const hasGhBeyan = (p?: Person) => !!p?.links.github && !!p.evidence.some((e) => e.source === 'github' && e.level === 'S1');
const countBy = (p: Person, l: Level) => p.evidence.filter((e) => e.level === l).length;

/** The demo user after this scan: GitHub evidence follows the scan, everything else is kept. */
function buildPerson(s: State, cur: Person | undefined, sc: Scan, picked: GhRepo[]): Person {
  const login = sc.user.login.toLowerCase();
  const same = !!cur && !sc.offline && cur.links.github?.toLowerCase() === login;
  const proven = same ? cur!.evidence.find((e) => e.source === 'github' && e.level === 'S2') : undefined;
  const kept = same ? cur!.evidence.filter((e) => e.source === 'github' && picked.some((r) => r.html_url === e.url)) : [];
  const fresh = reposToEvidence(
    picked.filter((r) => !kept.some((e) => e.url === r.html_url)),
    !!proven,
    proven?.verifier?.includes('gist') ? 'gist' : 'bio',
  );
  const evidence = [...fresh, ...kept, ...(cur?.evidence.filter((e) => e.source !== 'github') ?? [])];
  const taken = s.people.some((p) => !p.isDemoUser && p.handle === login);
  const profile = {
    name: sc.user.name || sc.user.login,
    headline: [...new Set(evidence.flatMap((e) => e.skills))].slice(0, 2).map(skillLabel).join(' · ') || 'Geliştirici',
    city: sc.user.location || '—',
    bio: sc.user.bio && !sc.user.bio.includes('nirengi-') ? sc.user.bio : 'Kanıtlarını NİRENGİ’ye bağladı.',
  };
  const base: Person = cur ?? {
    ...profile,
    id: uid('p'),
    handle: '',
    age: 0,
    school: '—',
    availability: 'open',
    weeklyHours: 15,
    joinedAt: new Date().toISOString(),
    evidence: [],
    links: {},
  };
  return {
    ...base,
    // An example profile is replaced by the real account's details; a connected one keeps its own.
    ...(cur && !cur.links.github ? profile : {}),
    handle: same ? base.handle : taken ? `${login}-gh` : login,
    evidence,
    links: { ...base.links, github: sc.offline ? undefined : sc.user.login },
    isDemoUser: true,
  };
}

const slide = {
  enter: (d: { dir: number; reduce: boolean }) => ({ x: d.reduce ? 0 : d.dir * 48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: { dir: number; reduce: boolean }) => ({ x: d.reduce ? 0 : d.dir * -48, opacity: 0 }),
};

export default function ConnectPage() {
  const s = useAppState();
  const me = s.people.find((p) => p.isDemoUser);
  const reduce = !!useReducedMotion();

  const [step, setStep] = useState<StepId>(me ? 'home' : 'user');
  const [dir, setDir] = useState(1);
  /** Started from the "Bağlı hesap" screen: finishing returns there instead of walking the whole flow. */
  const [from, setFrom] = useState<'flow' | 'home'>('flow');
  const [handle, setHandle] = useState('');
  const [touched, setTouched] = useState(false);
  const [loginErr, setLoginErr] = useState<VerifyError | null>(null);
  const [scan, setScan] = useState<Scan | null>(null);
  const [stage, setStage] = useState('');
  const [included, setIncluded] = useState<Set<string>>(new Set());
  const [goal, setGoal] = useState<WeeklyGoal>(me?.weeklyGoal ?? 3);
  const [code] = useState(sessionChallenge);
  const [tab, setTab] = useState<'bio' | 'gist'>('bio');
  const [domain, setDomain] = useState('');
  const [claim, setClaim] = useState('');
  const [busy, setBusy] = useState<'verify' | 'dns' | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const run = useRef(0);

  /** Steps slide one at a time: a change that lands mid-slide waits for the slide to finish. */
  const lastGo = useRef(0);
  const go = (to: StepId, d = 1) => {
    const at = Math.max(Date.now(), lastGo.current + (reduce ? 40 : 420));
    lastGo.current = at;
    const apply = () => {
      setDir(d);
      setStep(to);
    };
    if (at <= Date.now()) apply();
    else window.setTimeout(apply, at - Date.now());
  };
  const login = cleanHandle(handle);
  const valid = isGitHubLogin(login);
  const proven = isGhVerified(me);
  const domainDone = !!me?.links.domain;
  const afterFlow = (next: StepId) => (from === 'home' ? 'home' : next);

  // ------------------------------------------------------------ actions

  const scanFor = async (raw: string, back: StepId) => {
    const id = ++run.current;
    setLoginErr(null);
    setScan(null);
    setStage('Depolarını okuyorum…');
    go('found');
    try {
      const { user, repos } = await fetchGitHub(raw);
      if (id !== run.current) return;
      setStage('Etkinliğini sayıyorum…');
      const days = await fetchActivityDays(user.login);
      if (id !== run.current) return;
      const picked = pickRepos(repos);
      setIncluded(new Set(picked.map((r) => r.name)));
      setScan({ user, repos: picked, days, offline: false });
    } catch (e) {
      if (id !== run.current) return;
      const err = e instanceof VerifyError ? e : new VerifyError('Beklenmeyen bir hata oldu.');
      setLoginErr(err);
      feedback({ tone: 'bad', title: ERR_TITLE[err.kind], text: err.kind === 'notfound' ? `GitHub’da “${cleanHandle(raw)}” diye bir hesap yok. Yazımı kontrol et.` : err.message });
      go(back, -1);
    }
  };

  const startScan = () => {
    if (scan && !scan.offline && scan.user.login.toLowerCase() === login.toLowerCase()) return go('found');
    void scanFor(login, 'user');
  };

  const continueWithExample = () => {
    run.current++;
    setLoginErr(null);
    setIncluded(new Set(OFFLINE.repos.map((r) => r.name)));
    setScan(OFFLINE);
    feedback({ tone: 'info', title: 'Örnek profille devam', text: 'Bu veri kurgusal: gerçek hesabına bağlanmaz, her şey Beyan düzeyinde kalır.' });
    go('found');
  };

  const saveScan = () => {
    const sc = scan!;
    const picked = sc.repos.filter((r) => included.has(r.name));
    const person = buildPerson(getState(), demoUser(), sc, picked);
    actions.upsertDemoUser(person);
    if (sc.days?.length) actions.recordActivity(person.id, sc.days);
    const ok = isGhVerified(demoUser());
    feedback({
      tone: 'good',
      title: from === 'home' ? 'Profilin güncellendi' : `${picked.length} eser eklendi`,
      text: from === 'home' ? `${picked.length} eser profilinde.` : sc.offline ? 'Örnek veri Beyan düzeyinde kalır.' : ok ? 'Hesabın daha önce doğrulandığı için Doğrulandı düzeyinde.' : 'Şimdilik Beyan düzeyinde; sahipliğini kanıtlayınca Doğrulandı olur.',
    });
    go(afterFlow('goal'));
  };

  const saveGoal = () => {
    const cur = demoUser();
    if (!cur) return;
    actions.setWeeklyGoal(cur.id, goal);
    feedback({ tone: 'good', title: 'Hedefin kaydedildi', text: `Haftada ${goal} gün üretim. İstediğin zaman değiştirebilirsin.` });
    go(scan?.offline ? 'domain' : 'prove');
  };

  const copy = async (text: string, key: string, note: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
      feedback({ tone: 'good', title: 'Kopyalandı', text: note });
    } catch {
      feedback({ tone: 'bad', title: 'Kopyalanamadı', text: 'Metni elle seçip kopyala.' });
    }
  };

  const verifyOwnership = async () => {
    const cur = demoUser();
    const gh = cur?.links.github;
    if (!cur || !gh) return;
    setBusy('verify');
    try {
      const via = await checkGitHubChallenge(gh, code);
      if (!via) {
        feedback({
          tone: 'bad',
          title: 'Kodu bulamadık',
          text:
            tab === 'bio'
              ? `Bio’nda “${code}” görünmüyor. Profil ayarlarında kaydettiğinden emin ol; GitHub bir dakikaya kadar geç gösterebilir.`
              : `Herkese açık bir gist’in açıklamasında ya da dosya adında “${code}” görünmüyor. Gizli gist sayılmaz.`,
        });
        return;
      }
      const n = cur.evidence.filter((e) => e.source === 'github' && e.level === 'S1').length;
      const before = totalXp(getState(), cur);
      actions.upsertDemoUser({ ...cur, evidence: cur.evidence.map((e) => (e.source === 'github' && e.level === 'S1' ? verifyGitHubEvidence(e, via) : e)) });
      celebrate({ title: 'Doğrulandın!', sub: `${n} işin artık Doğrulandı düzeyinde. Eşleşmede beyandan daha ağır sayılır.`, xp: totalXp(getState(), demoUser()!) - before });
      go(afterFlow('domain'));
    } catch (e) {
      feedback({ tone: 'bad', title: 'Kontrol edemedik', text: e instanceof VerifyError ? e.message : 'Beklenmeyen bir hata oldu.' });
    } finally {
      setBusy(null);
    }
  };

  const skipProve = () => {
    feedback({ tone: 'info', title: 'Şimdilik Beyan olarak kalıyor', text: 'Doğrulanmayan işler profilinde görünür ama eşleşmede düşük ağırlık taşır. Sonra tekrar deneyebilirsin.' });
    go(afterFlow('domain'));
  };

  const verifyDomain = async () => {
    const cur = demoUser();
    if (!cur) return;
    setBusy('dns');
    try {
      const r = await checkDnsTxt(domain, code);
      if (!r.ok) {
        feedback({
          tone: 'bad',
          title: 'Kaydı bulamadık',
          text: r.records.length ? `Kayıt var ama değeri eşleşmiyor: ${r.records.join(', ')}` : 'TXT kaydı henüz yayılmamış. DNS değişikliği birkaç dakika sürebilir.',
        });
        return;
      }
      const d = cleanDomain(domain);
      const before = totalXp(getState(), cur);
      actions.upsertDemoUser({ ...cur, links: { ...cur.links, domain: d }, evidence: [domainEvidence(d), ...cur.evidence.filter((e) => e.source !== 'domain')] });
      celebrate({ title: 'Alan adın doğrulandı!', sub: `${d} artık senin kanıtın.`, xp: totalXp(getState(), demoUser()!) - before });
      go(afterFlow('done'));
    } catch (e) {
      feedback({ tone: 'bad', title: 'Kontrol edemedik', text: e instanceof VerifyError ? e.message : 'Beklenmeyen bir hata oldu.' });
    } finally {
      setBusy(null);
    }
  };

  const skipDomain = () => {
    feedback({ tone: 'info', title: 'Alan adı atlandı', text: 'İstediğin zaman “Yeni kanıt ekle” ile ekleyebilirsin.' });
    go(afterFlow('done'));
  };

  const addClaim = () => {
    const cur = demoUser();
    const t = claim.trim();
    if (!cur || !t) return;
    const ev: Evidence = { id: uid('e-claim'), title: t, summary: 'Kişisel beyan.', source: 'claim', level: 'S1', skills: [], producedAt: new Date().toISOString() };
    actions.addEvidence(cur.id, ev);
    setClaim('');
    feedback({ tone: 'good', title: 'Beyan eklendi', text: 'Profilinde görünür; doğrulanana kadar eşleşmede düşük ağırlık taşır.' });
  };

  // ------------------------------------------------------------ chrome

  const loading = step === 'found' && !scan;
  const foot: Foot = (() => {
    switch (step) {
      case 'user':
        return { label: 'Devam', disabled: !valid, onClick: startScan, blocked: () => setTouched(true) };
      case 'found':
        return { label: 'Devam', disabled: loading || included.size === 0, onClick: saveScan };
      case 'goal':
        return { label: 'Devam', onClick: saveGoal };
      case 'prove':
        return proven
          ? { label: 'Devam', onClick: () => go(afterFlow('domain')) }
          : { label: 'Kontrol et', busy: busy === 'verify', onClick: verifyOwnership, side: { label: 'Şimdilik atla', onClick: skipProve } };
      case 'domain':
        return domainDone
          ? { label: 'Devam', onClick: () => go(afterFlow('done')) }
          : { label: 'Kontrol et', busy: busy === 'dns', disabled: !cleanDomain(domain).includes('.'), onClick: verifyDomain, side: { label: 'Atla', onClick: skipDomain } };
      case 'done':
        return { label: 'Bugün’e git', href: '/bugun', side: me ? { label: 'Profilim', href: `/profil/${me.handle}` } : undefined };
      case 'add':
        return { label: 'Bitti', onClick: () => go('home', -1) };
      default:
        return { label: 'Bugün’e git', href: '/bugun' };
    }
  })();

  const back: StepId | null =
    from === 'home' && step !== 'home'
      ? 'home'
      : step === 'found'
        ? 'user'
        : step === 'goal'
          ? 'found'
          : step === 'prove'
            ? 'goal'
            : step === 'domain'
              ? scan?.offline
                ? 'goal'
                : 'prove'
              : null;
  const goBack = () => {
    run.current++;
    go(back!, -1);
  };

  // A long step must not leave the next one scrolled halfway.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const idx = FLOW.indexOf(step);
  const bar = step === 'done' ? 1 : idx >= 0 ? Math.max(0.05, idx / FLOW.length) : null;

  // Enter acts like the big key unless it already means something where the focus is.
  const footRef = useRef(foot);
  footRef.current = foot;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.defaultPrevented || e.isComposing) return;
      if ((e.target as HTMLElement | null)?.closest('button, a, textarea, select, [role="dialog"]')) return;
      const f = footRef.current;
      if (f.disabled) return f.blocked?.();
      if (f.busy) return;
      if (f.href) location.href = f.href;
      else f.onClick?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const body = (() => {
    switch (step) {
      case 'user':
        return (
          <UserBody
            handle={handle}
            onHandle={(v) => {
              setHandle(v);
              setLoginErr(null);
            }}
            onBlur={() => setTouched(true)}
            showFormat={touched && !!handle.trim() && !valid}
            err={loginErr}
            login={login}
            canExample={!me}
            onExample={continueWithExample}
          />
        );
      case 'found':
        return (
          <FoundBody
            scan={scan}
            stage={stage}
            included={included}
            reduce={reduce}
            onToggle={(name) =>
              setIncluded((prev) => {
                const next = new Set(prev);
                if (!next.delete(name)) next.add(name);
                return next;
              })
            }
            onChange={() => {
              run.current++;
              go('user', -1);
            }}
          />
        );
      case 'goal':
        return <GoalBody goal={goal} onGoal={setGoal} days={scan?.days ?? null} offline={!!scan?.offline} />;
      case 'prove':
        return <ProveBody me={me} code={code} tab={tab} onTab={setTab} proven={proven} copied={copied === 'code'} onCopy={() => copy(code, 'code', 'Şimdi bio’na ya da bir gist’e yapıştır.')} />;
      case 'domain':
        return (
          <DomainBody
            me={me}
            domain={domain}
            onDomain={setDomain}
            code={code}
            copied={copied}
            onCopy={(text, key) => copy(text, key, 'DNS panelindeki ilgili alana yapıştır.')}
          />
        );
      case 'add':
        return (
          <AddBody
            me={me}
            claim={claim}
            onClaim={setClaim}
            onAdd={addClaim}
            onDomain={() => {
              setFrom('home');
              go('domain');
            }}
          />
        );
      case 'done':
        return <DoneBody s={s} me={me} />;
      default:
        return (
          <HomeBody
            s={s}
            me={me}
            onRescan={() => {
              const gh = me?.links.github;
              if (!gh) return;
              setFrom('home');
              setHandle(gh);
              void scanFor(gh, 'home');
            }}
            onProve={() => {
              setFrom('home');
              go('prove');
            }}
            onAdd={() => {
              setFrom('home');
              go('add');
            }}
            onConnect={() => {
              setFrom('flow');
              go('user');
            }}
          />
        );
    }
  })();

  return (
    <div className="mx-auto mb-[calc(66px_+_env(safe-area-inset-bottom)_-_128px)] flex min-h-[calc(100dvh_-_154px_-_env(safe-area-inset-bottom))] w-full max-w-[560px] flex-col lg:mb-[-64px] lg:min-h-[calc(100dvh_-_40px)]">
      <div className="sticky top-16 z-10 flex items-center gap-2 bg-bg py-2 lg:top-0">
        <a href="/bugun" aria-label="Kapat ve Bugün’e dön" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-bg-2 hover:text-ink">
          <X className="h-6 w-6" strokeWidth={3} />
        </a>
        {back && (
          <button type="button" onClick={goBack} aria-label="Geri" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-bg-2 hover:text-ink">
            <ChevronLeft className="h-6 w-6" strokeWidth={3} />
          </button>
        )}
        {bar !== null && (
          <div className="min-w-0 flex-1" role="progressbar" aria-label="Adımlar" aria-valuemin={0} aria-valuemax={FLOW.length} aria-valuenow={Math.round(bar * FLOW.length)}>
            <Bar value={bar} tone="green" h={16} />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-x-clip pb-6 pt-4">
        <AnimatePresence mode="wait" initial={false} custom={{ dir, reduce }}>
          <motion.div
            key={step}
            custom={{ dir, reduce }}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduce ? 0.01 : 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {body}
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="sticky bottom-[calc(env(safe-area-inset-bottom)+66px)] z-10 border-t-2 border-line bg-bg pb-3 pt-3 lg:bottom-0">
        <div className="flex gap-3">
          {foot.side && <Key {...foot.side} className="btn-line btn-lg !px-4 !text-[14px]" />}
          <Key {...foot} className="btn-primary btn-lg min-w-0 flex-1 !px-4" />
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------- pieces

function Key({ label, href, onClick, disabled, busy, className }: { label: string; href?: string; onClick?: () => void; disabled?: boolean; busy?: boolean; className: string }) {
  const inner = (
    <>
      {busy && <Loader2 className="h-5 w-5 animate-spin" strokeWidth={3} aria-hidden="true" />}
      {busy ? 'Kontrol ediliyor…' : label}
    </>
  );
  if (href)
    return (
      <a href={href} className={className}>
        {inner}
      </a>
    );
  return (
    <button type="button" disabled={disabled} aria-busy={busy} onClick={() => !busy && onClick?.()} className={`${className} ${busy ? 'pointer-events-none' : ''}`}>
      {inner}
    </button>
  );
}

/** Niri says what this step is for, in one sentence. */
function Guide({ mood, children }: { mood: Mood; children: ReactNode }) {
  return (
    <div className="flex items-end gap-3">
      <Niri mood={mood} size={92} />
      <div className="relative mb-4 flex-1 rounded-[18px] border-2 border-line bg-bg px-4 py-3">
        <span className="absolute -left-[9px] bottom-4 h-4 w-4 rotate-45 border-b-2 border-l-2 border-line bg-bg" aria-hidden="true" />
        <p className="text-[16px] font-extrabold leading-snug text-ink">{children}</p>
      </div>
    </div>
  );
}

function LevelCounts({ me }: { me: Person }) {
  return (
    <ul className="card divide-y-2 divide-line">
      {(['S1', 'S2', 'S3'] as Level[]).map((l) => {
        const n = countBy(me, l);
        return (
          <li key={l} className={`flex items-center justify-between gap-3 px-4 py-3 ${n ? '' : 'opacity-50'}`}>
            <LevelBadge level={l} />
            <span className="num text-[22px] font-black text-ink">
              {n}
              <span className="text-[14px] font-bold text-ink-3"> iş</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

const weight = (l: Level) => LEVELS[l].weight.toLocaleString('tr-TR');

const LEVEL_WHY = (
  <div className="space-y-3 text-[16px] font-bold text-ink-2">
    <p>
      <b>Beyan:</b> kendi sözün. Profilinde görünür ama eşleşmede en düşük ağırlığı taşır ({weight("S1")}).
    </p>
    <p>
      <b>Doğrulandı:</b> GitHub hesabının ya da alan adının senin olduğunu makine kontrol etti. Ağırlığı {weight("S2")}.
    </p>
    <p>
      <b>Kurum onaylı:</b> birlikte çalıştığın kurum bir aşamayı imzaladı. En güçlü kanıt ({weight("S3")}); pilot sonrası oluşur.
    </p>
  </div>
);

// ---------------------------------------------------------------- 1 · user

function UserBody({
  handle,
  onHandle,
  onBlur,
  showFormat,
  err,
  login,
  canExample,
  onExample,
}: {
  handle: string;
  onHandle: (v: string) => void;
  onBlur: () => void;
  showFormat: boolean;
  err: VerifyError | null;
  login: string;
  canExample: boolean;
  onExample: () => void;
}) {
  const bad = showFormat || !!err;
  return (
    <>
      <Guide mood="wave">Merhaba! Önce GitHub kullanıcı adını yaz, işlerini birlikte bulalım.</Guide>
      <h1 className="h-page mt-6">GitHub kullanıcı adın</h1>
      <label htmlFor="gh" className="sr-only">
        GitHub kullanıcı adı
      </label>
      <div
        className={`mt-5 flex items-center rounded-[14px] border-2 transition-[border-color,background-color,box-shadow] duration-150 focus-within:shadow-[0_0_0_4px_rgb(var(--indigo)/0.14)] ${
          bad ? 'border-red bg-red-tint' : 'border-line bg-bg-2 focus-within:border-indigo focus-within:bg-bg'
        }`}
      >
        <span className="pl-4 text-[16px] font-bold text-ink-3">github.com/</span>
        <input
          id="gh"
          value={handle}
          onChange={(e) => onHandle(e.target.value)}
          onBlur={onBlur}
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="username"
          enterKeyHint="go"
          placeholder="kullanici-adi"
          aria-invalid={bad}
          aria-describedby="gh-note"
          className="min-w-0 flex-1 bg-transparent py-3.5 pl-1 pr-4 text-[18px] font-black text-ink outline-none placeholder:font-bold placeholder:text-ink-4"
        />
      </div>
      <div id="gh-note" aria-live="polite">
        {showFormat ? (
          <p className="mt-2 text-[14px] font-bold text-red-lip">Kullanıcı adı harf, rakam ve tireden oluşur; tireyle başlayıp bitemez, en çok 39 karakter.</p>
        ) : err ? (
          <div className="mt-3 rounded-[16px] bg-red-tint p-4" role="alert">
            <p className="text-[15px] font-black text-red-lip">{ERR_TITLE[err.kind]}</p>
            <p className="mt-1 text-[14px] font-bold text-red-lip">{err.kind === 'notfound' ? `GitHub’da “${login}” diye bir hesap yok. Yazımı kontrol et.` : err.message}</p>
            {canExample && (err.kind === 'ratelimit' || err.kind === 'network') && (
              <>
                <button type="button" onClick={onExample} className="btn-line btn-block mt-3">
                  Örnek profille devam et
                </button>
                <p className="mt-2 text-[13px] font-bold text-ink-3">Örnek veri kurgusaldır: gerçek hesabına bağlanmaz, her şey Beyan düzeyinde kalır.</p>
              </>
            )}
          </div>
        ) : (
          <p className="hint">Herkese açık GitHub verisi okunur. Parola ya da token istemiyoruz.</p>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------- 2 · found

function FoundBody({
  scan,
  stage,
  included,
  reduce,
  onToggle,
  onChange,
}: {
  scan: Scan | null;
  stage: string;
  included: Set<string>;
  reduce: boolean;
  onToggle: (name: string) => void;
  onChange: () => void;
}) {
  if (!scan)
    return (
      <>
        <Guide mood="think">Hesabına bakıyorum, bu birkaç saniye sürer.</Guide>
        <h1 className="h-page mt-6">Bulduklarımız</h1>
        <p role="status" className="mt-2 text-[15px] font-bold text-ink-3">
          {stage}
        </p>
        <ul className="mt-5 space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-[68px] animate-pulse rounded-[18px] bg-bg-3" style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </ul>
      </>
    );

  const n = scan.repos.length;
  return (
    <>
      <Guide mood={n ? 'happy' : 'think'}>{n ? 'Bunları buldum! Profiline eklemek istediklerini seç.' : 'Hesabında özgün bir depo göremedim.'}</Guide>
      <h1 className="mt-6 flex items-end gap-3" aria-label={`${n} eserin bulundu`}>
        <span className="num text-[64px] font-black leading-[0.9] text-indigo" aria-hidden="true">
          <CountUp value={n} />
        </span>
        <span className="h-page pb-1" aria-hidden="true">
          eserin bulundu
        </span>
      </h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] font-bold text-ink-3">
        <span>@{scan.user.login}</span>
        {scan.offline && <span className="pill bg-bg-3 text-ink-2">Örnek veri</span>}
        <button type="button" onClick={onChange} className="rounded-full px-2 py-0.5 text-[13px] font-extrabold text-indigo transition-colors hover:bg-indigo-tint">
          Değiştir
        </button>
      </div>
      {scan.offline && <p className="mt-3 rounded-[14px] bg-bg-2 px-4 py-3 text-[14px] font-bold text-ink-2">Bu bir örnek profil: gerçek hesap değil, doğrulama yapılmaz ve her şey Beyan düzeyinde kalır.</p>}

      {scan.days && (
        <div className="card mt-4 flex items-center gap-3 p-4">
          <Flame size={34} />
          <p className="min-w-0 flex-1 text-[16px] font-extrabold text-ink">
            Son 90 günde{' '}
            <b className="num text-[22px] text-orange-ink">
              <CountUp value={scan.days.length} />
            </b>{' '}
            aktif gün
          </p>
          <Why title="Aktif gün nasıl sayılıyor?">
            <div className="space-y-3 text-[16px] font-bold text-ink-2">
              <p>Son 90 günün herkese açık GitHub etkinliğine baktık. Push, pull request ya da sürüm (release) olan her gün bir aktif gündür.</p>
              <p>Commit sayısını, satır sayısını ya da yıldızı saymıyoruz: bir gün ya üretim vardır ya yoktur.</p>
              <p>Her aktif gün haftalık ilerlemene yazılır ve {XP.activeDay} XP kazandırır. Özel depolardaki işin görünmez; GitHub herkese açık olayları en fazla 90 gün geriye ve yaklaşık 300 olayla verir.</p>
            </div>
          </Why>
        </div>
      )}
      {!scan.days && !scan.offline && <p className="mt-4 text-[14px] font-bold text-ink-3">Etkinlik geçmişini okuyamadık; depoların yine de eklenebilir.</p>}

      {n > 0 && (
        <ul className="mt-5 space-y-3">
          {scan.repos.map((r, i) => {
            const on = included.has(r.name);
            return (
              <motion.li
                key={r.name}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : i * 0.05, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => onToggle(r.name)}
                  className={`card-press flex w-full items-center gap-3 p-3.5 text-left ${on ? '!border-indigo !bg-indigo-tint' : ''}`}
                  style={on ? { boxShadow: '0 4px 0 rgb(var(--indigo) / 0.5)' } : undefined}
                >
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-colors ${on ? 'border-indigo bg-indigo text-white' : 'border-line-2 bg-bg text-transparent'}`}>
                    <Check className="h-4 w-4" strokeWidth={4} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-black text-ink">{r.name}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] font-bold text-ink-3">
                      {r.language && <span>{r.language}</span>}
                      <span className="inline-flex items-center gap-1">
                        <Star size={14} />
                        <span className="num">{r.stargazers_count.toLocaleString('tr-TR')}</span>
                      </span>
                      <span>{relTime(r.pushed_at)} güncellendi</span>
                    </span>
                  </span>
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}
      <p className="hint">
        {n > 0 ? `${included.size}/${n} seçili. ` : 'Fork ve arşivlenmiş depolar sayılmaz. '}
        <Why title="Eserler nasıl seçiliyor?">
          <div className="space-y-3 text-[16px] font-bold text-ink-2">
            <p>Herkese açık {scan.user.public_repos} deponun içinden fork ve arşivlenmiş olanları çıkarıyoruz.</p>
            <p>Kalanları yıldız sayısı, fork sayısı ve son güncellemenin yeniliğine göre sıralayıp en güçlü {MAX_REPOS} tanesini gösteriyoruz.</p>
            <p>Seçmediğin eser profiline eklenmez. Hesabını kanıtlayana kadar eklenenler Beyan düzeyinde durur.</p>
          </div>
        </Why>
      </p>
    </>
  );
}

// ---------------------------------------------------------------- 3 · goal

function GoalBody({ goal, onGoal, days, offline }: { goal: WeeklyGoal; onGoal: (g: WeeklyGoal) => void; days: string[] | null; offline: boolean }) {
  const avg = days && !offline ? (days.length / (90 / 7)).toLocaleString('tr-TR', { maximumFractionDigits: 1 }) : null;
  return (
    <>
      <Guide mood="idle">Haftada kaç gün üretmek istersin? İstediğin zaman değiştirebilirsin.</Guide>
      <h1 className="h-page mt-6">Haftalık hedefin</h1>
      <div className="mt-5 space-y-3" role="radiogroup" aria-label="Haftalık hedef">
        {GOALS.map((o) => {
          const on = o.g === goal;
          return (
            <button
              key={o.g}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onGoal(o.g)}
              className={`card-press flex w-full items-center gap-4 p-4 text-left ${on ? '!border-indigo !bg-indigo-tint' : ''}`}
              style={on ? { boxShadow: '0 4px 0 rgb(var(--indigo) / 0.5)' } : undefined}
            >
              <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-[16px] ${on ? 'bg-indigo text-white' : 'bg-bg-3 text-ink-3'}`}>
                <span className="num text-[26px] font-black leading-none">{o.g}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[18px] font-black ${on ? 'text-indigo' : 'text-ink'}`}>
                  {o.name} <span className="text-[14px] font-extrabold text-ink-3">· haftada {o.g} gün</span>
                </span>
                <span className="block text-[14px] font-bold text-ink-3">{o.text}</span>
                <span className="mt-2 flex gap-1.5" aria-hidden="true">
                  {Array.from({ length: 7 }, (_, i) => (
                    <span key={i} className={`h-2.5 w-2.5 rounded-full ${i < o.g ? 'bg-orange' : 'bg-line-2'}`} />
                  ))}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="hint">
        Düşürmek ceza değildir; seri yalnız hedefini tutturduğun haftaları sayar.
        {avg && (
          <>
            {' '}
            Son 90 günde haftada ortalama {avg} aktif gün üretmişsin.{' '}
            <Why title="Ortalama nasıl çıktı?">
              <p className="text-[16px] font-bold text-ink-2">
                Son 90 gün yaklaşık 12,9 hafta. {days!.length} aktif günü bu haftalara böldük. Bu yalnızca herkese açık GitHub etkinliğinden gelir; hedef seçimini bağlamaz.
              </p>
            </Why>
          </>
        )}
      </p>
    </>
  );
}

// ---------------------------------------------------------------- 4 · prove

function Mini({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-full bg-indigo-tint text-[14px] font-black text-indigo">{n}</span>
      <div className="min-w-0 flex-1 pt-0.5 text-[15px] font-bold text-ink-2">{children}</div>
    </li>
  );
}

function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="btn-line btn-sm mt-2">
      {children}
      <ExternalLink className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
    </a>
  );
}

function ProveBody({ me, code, tab, onTab, proven, copied, onCopy }: { me?: Person; code: string; tab: 'bio' | 'gist'; onTab: (t: 'bio' | 'gist') => void; proven: boolean; copied: boolean; onCopy: () => void }) {
  if (proven)
    return (
      <>
        <Guide mood="happy">Hesabın doğrulanmış, burada yapacak bir şey kalmadı.</Guide>
        <h1 className="h-page mt-6">Sahipliğini kanıtla</h1>
        <div className="card mt-5 flex items-center gap-4 p-5">
          <CheckCircle size={48} />
          <div className="min-w-0">
            <p className="text-[18px] font-black text-ink">Hesabın doğrulandı</p>
            <p className="text-[14px] font-bold text-ink-3">@{me?.links.github} işleri Doğrulandı düzeyinde.</p>
          </div>
        </div>
      </>
    );
  return (
    <>
      <Guide mood="think">Bu hesabın senin olduğunu göster; doğrulanmış iş beyandan daha ağır sayılır.</Guide>
      <h1 className="h-page mt-6">Sahipliğini kanıtla</h1>
      <div className="mt-5 rounded-[18px] border-2 border-dashed border-line-2 bg-bg-2 p-5 text-center">
        <code className="block break-all font-mono text-[26px] font-black tracking-wide text-ink">{code}</code>
        <button type="button" onClick={onCopy} className="btn-line btn-sm mt-3">
          {copied ? <Check className="h-4 w-4" strokeWidth={3.5} /> : <Copy className="h-4 w-4" strokeWidth={3} />}
          {copied ? 'Kopyalandı' : 'Kopyala'}
        </button>
      </div>

      <div className="seg mt-6" role="group" aria-label="Kodu nereye koyacaksın?">
        {(['bio', 'gist'] as const).map((t) => (
          <button key={t} type="button" aria-pressed={tab === t} onClick={() => onTab(t)}>
            {t === 'bio' ? 'Bio’ya koy' : 'Gist’e koy'}
          </button>
        ))}
      </div>
      <ol className="mt-5 space-y-4">
        {tab === 'bio' ? (
          <>
            <Mini n={1}>
              GitHub profil ayarlarını aç.
              <br />
              <ExtLink href="https://github.com/settings/profile">Profil ayarları</ExtLink>
            </Mini>
            <Mini n={2}>Bio alanına kodu yapıştır. Metnin neresinde olduğu fark etmez.</Mini>
            <Mini n={3}>“Update profile”a bas, buraya dön ve “Kontrol et”e dokun.</Mini>
          </>
        ) : (
          <>
            <Mini n={1}>
              Yeni bir gist aç.
              <br />
              <ExtLink href="https://gist.github.com">Gist sayfası</ExtLink>
            </Mini>
            <Mini n={2}>Açıklama alanına kodu yapıştır. Dosya adına yazman da yeter.</Mini>
            <Mini n={3}>“Create public gist” ile kaydet. Gizli gist görünmez, sayılmaz.</Mini>
          </>
        )}
      </ol>
      <p className="hint">
        Parola ya da token istemiyoruz; doğruladıktan sonra kodu silebilirsin.{' '}
        <Why title="Bu nasıl çalışıyor?">
          <div className="space-y-3 text-[16px] font-bold text-ink-2">
            <p>Kodu yalnızca hesabın sahibi bio’ya ya da herkese açık bir gist’e yazabilir. Biz de GitHub’ın herkese açık API’siyle bakıp kodu bulursak hesabın senin olduğunu kabul ederiz.</p>
            <p>Doğrulanınca eklediğin depolar Beyan’dan Doğrulandı düzeyine çıkar; her biri {XP.evidence} XP kazandırır (günlük sınır {XP.dailyCap} XP).</p>
          </div>
        </Why>
      </p>
    </>
  );
}

// ---------------------------------------------------------------- 5 · domain

function CopyRow({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-extrabold text-ink-3">{label}</p>
        <p className="break-all font-mono text-[14px] font-bold text-ink">{value}</p>
      </div>
      <button type="button" onClick={onCopy} aria-label={`${label} kopyala`} className="btn-line btn-sm shrink-0 !px-3">
        {copied ? <Check className="h-4 w-4" strokeWidth={3.5} /> : <Copy className="h-4 w-4" strokeWidth={3} />}
      </button>
    </div>
  );
}

function DomainBody({ me, domain, onDomain, code, copied, onCopy }: { me?: Person; domain: string; onDomain: (v: string) => void; code: string; copied: string | null; onCopy: (text: string, key: string) => void }) {
  if (me?.links.domain)
    return (
      <>
        <Guide mood="happy">Alan adın da doğrulanmış. Güzel!</Guide>
        <h1 className="h-page mt-6">Alan adın var mı?</h1>
        <div className="card mt-5 flex items-center gap-4 p-5">
          <CheckCircle size={48} />
          <div className="min-w-0">
            <p className="truncate text-[18px] font-black text-ink">{me.links.domain}</p>
            <p className="text-[14px] font-bold text-ink-3">DNS kaydıyla doğrulandı.</p>
          </div>
        </div>
      </>
    );
  const ready = cleanDomain(domain).includes('.');
  return (
    <>
      <Guide mood="idle">Bir alan adın varsa onu da kanıtlayabilirsin. Yoksa geç, sorun değil.</Guide>
      <h1 className="h-page mt-6">Alan adın var mı?</h1>
      <label htmlFor="dom" className="sr-only">
        Alan adı
      </label>
      <input
        id="dom"
        className="field mt-5 !text-[18px] !font-black"
        value={domain}
        onChange={(e) => onDomain(e.target.value)}
        placeholder="ornek.dev"
        inputMode="url"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="go"
      />
      {ready ? (
        <div className="mt-4 space-y-4 rounded-[18px] border-2 border-dashed border-line-2 bg-bg-2 p-4">
          <p className="text-[15px] font-bold text-ink-2">DNS panelinde şu TXT kaydını ekle, sonra “Kontrol et”e dokun.</p>
          <CopyRow label="Ad" value={txtName(domain)} copied={copied === 'dns-name'} onCopy={() => onCopy(txtName(domain), 'dns-name')} />
          <CopyRow label="Değer" value={txtValue(code)} copied={copied === 'dns-value'} onCopy={() => onCopy(txtValue(code), 'dns-value')} />
        </div>
      ) : (
        <p className="hint">Alan adını yaz, eklemen gereken kaydı gösterelim.</p>
      )}
      <p className="hint">
        Google ve Cloudflare’in DNS-over-HTTPS hizmetlerinden sorgulanır; DNS değişikliği birkaç dakika sürebilir.{' '}
        <Why title="Neden TXT kaydı?">
          <p className="text-[16px] font-bold text-ink-2">Bir alan adının DNS kayıtlarını yalnızca sahibi değiştirebilir. Kaydı görürsek alan adının senin olduğunu kabul ederiz; doğrulanınca {XP.evidence} XP kazanırsın.</p>
        </Why>
      </p>
    </>
  );
}

// ---------------------------------------------------------------- 6 · done

function DoneBody({ s, me }: { s: State; me?: Person }) {
  if (!me) return null;
  const p = progress(s, me);
  return (
    <>
      <Guide mood="cheer">Hazırsın! İşlerin profiline eklendi.</Guide>
      <h1 className="h-page mt-6">Hepsi tamam</h1>
      <section className="mt-6">
        <Head title="Profiline eklenenler" action={<Why title="Düzeyler ne anlama geliyor?">{LEVEL_WHY}</Why>} />
        <div className="mt-3">
          <LevelCounts me={me} />
        </div>
        {!me.links.github && <p className="hint">Örnek profil: gerçek bir GitHub hesabına bağlı değil, her şey Beyan düzeyinde. Gerçek hesabını istediğin zaman bağlayabilirsin.</p>}
      </section>
      <section className="card mt-6 p-5" aria-labelledby="hafta">
        <h2 id="hafta" className="h-sec">
          Bu hafta
        </h2>
        <div className="mt-4">
          <WeekDots days={p.days} />
        </div>
        <p className="mt-4 text-[15px] font-bold text-ink-3">
          {p.met ? `Haftanın hedefi tamam: ${p.active}/${p.goal} gün.` : `Hedefin haftada ${p.goal} gün; şu ana kadar ${p.active} gün üretim var.`} Commit sayısı değil, üretim yaptığın gün sayılır.
        </p>
      </section>
    </>
  );
}

// ---------------------------------------------------------------- home · add

function Row({ title, sub, onClick, accent }: { title: string; sub: string; onClick: () => void; accent?: boolean }) {
  return (
    <li>
      <button type="button" onClick={onClick} className={`card-press flex w-full items-center gap-4 p-4 text-left ${accent ? '!border-indigo !bg-indigo-tint' : ''}`}>
        <span className="min-w-0 flex-1">
          <span className={`block text-[17px] font-black ${accent ? 'text-indigo' : 'text-ink'}`}>{title}</span>
          <span className="block text-[14px] font-bold text-ink-3">{sub}</span>
        </span>
        <ChevronRight className="h-6 w-6 shrink-0 text-ink-3" strokeWidth={3} aria-hidden="true" />
      </button>
    </li>
  );
}

function HomeBody({ s, me, onRescan, onProve, onAdd, onConnect }: { s: State; me?: Person; onRescan: () => void; onProve: () => void; onAdd: () => void; onConnect: () => void }) {
  if (!me) return null;
  const p = progress(s, me);
  return (
    <>
      <Guide mood="idle">Hesabın bağlı. İstersen yeniden tarayabilir ya da yeni kanıt ekleyebilirsin.</Guide>
      <h1 className="h-page mt-6">Bağlı hesap</h1>
      <section className="card mt-5 flex items-center gap-4 p-4">
        <Avatar person={me} size={52} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[18px] font-black text-ink">{me.name}</p>
          <p className="truncate text-[14px] font-bold text-ink-3">
            {me.links.github ? `@${me.links.github}` : 'Örnek profil'}
            {me.links.domain ? ` · ${me.links.domain}` : ''}
          </p>
        </div>
        <span className="chip shrink-0">
          <Flame size={16} dim={!p.streak} />
          <span className="num">{p.streak}</span> hafta
        </span>
      </section>
      <div className="mt-4">
        <LevelCounts me={me} />
      </div>
      {!me.links.github && <p className="hint">Örnek profil: gerçek bir GitHub hesabına bağlı değil, her şey Beyan düzeyinde.</p>}
      <ul className="mt-6 space-y-3">
        {hasGhBeyan(me) && <Row accent title="Sahipliğini kanıtla" sub="İşlerin Beyan düzeyinde; kanıtlayınca Doğrulandı olur." onClick={onProve} />}
        {me.links.github ? <Row title="Yeniden tara" sub="Yeni depoları ve son 90 günün etkinliğini oku." onClick={onRescan} /> : <Row accent title="Gerçek hesabını bağla" sub="Örnek yerine kendi GitHub hesabını kullan." onClick={onConnect} />}
        <Row title="Yeni kanıt ekle" sub="Alan adı ya da kendi sözünle bir iş." onClick={onAdd} />
      </ul>
    </>
  );
}

function AddBody({ me, claim, onClaim, onAdd, onDomain }: { me?: Person; claim: string; onClaim: (v: string) => void; onAdd: () => void; onDomain: () => void }) {
  const claims = me?.evidence.filter((e) => e.source === 'claim') ?? [];
  return (
    <>
      <Guide mood="idle">Alan adını kanıtlayabilir ya da henüz kanıtlayamadığın bir işi kendi sözünle ekleyebilirsin.</Guide>
      <h1 className="h-page mt-6">Yeni kanıt ekle</h1>
      <ul className="mt-5">
        <Row title="Alan adı" sub={me?.links.domain ? `${me.links.domain} doğrulandı. Değiştirmek için dokun.` : 'DNS kaydıyla sahipliğini kanıtla. Doğrulandı düzeyinde eklenir.'} onClick={onDomain} />
      </ul>
      <section className="mt-8">
        <h2 className="h-sec">Kendi sözünle</h2>
        <p className="hint !mt-1">Doğrulanamayan bir işini yaz. Beyan olarak görünür; eşleşmede düşük ağırlık taşır.</p>
        <div className="mt-3 flex gap-2">
          <label htmlFor="claim" className="sr-only">
            Yaptığın iş
          </label>
          <input
            id="claim"
            className="field min-w-0 flex-1"
            value={claim}
            onChange={(e) => onClaim(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              onAdd();
            }}
            placeholder="ör. Kulübün web sitesini yaptım"
            enterKeyHint="done"
          />
          <button type="button" className="btn-line shrink-0" disabled={!claim.trim()} onClick={onAdd}>
            Ekle
          </button>
        </div>
        {claims.length > 0 && (
          <ul className="mt-4 space-y-2">
            {claims.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-[14px] bg-bg-2 px-3 py-2.5">
                <LevelBadge level="S1" />
                <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink">{c.title}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
