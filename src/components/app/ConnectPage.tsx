import { useMemo, useState, type ReactNode } from 'react';
import type { Availability, Evidence, Person } from '../../lib/types.ts';
import { actions, setView, useAppState } from '../../lib/store.ts';
import {
  checkDnsTxt,
  checkGitHubChallenge,
  cleanDomain,
  domainEvidence,
  fetchGitHub,
  newChallenge,
  reposToEvidence,
  txtName,
  txtValue,
  VerifyError,
  type GhRepo,
  type GhUser,
} from '../../lib/verify.ts';
import { AVAILABILITY } from '../../lib/labels.ts';
import { daysAgo, uid } from '../../lib/format.ts';
import { skillLabel } from '../../lib/skills.ts';
import { LevelBadge, LevelGlyph, StatusIcon } from '../ui/primitives.tsx';

type Gh = { user: GhUser; repos: GhRepo[]; via: 'bio' | 'gist' | null; offline?: boolean };

const OFFLINE: Gh = {
  offline: true,
  via: null,
  user: {
    login: 'ornek-gelistirici',
    name: 'Örnek Geliştirici',
    bio: 'Çevrim dışı örnek profil',
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

export default function ConnectPage() {
  const s = useAppState();
  const me = s.people.find((p) => p.isDemoUser);

  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<{ key: string; msg: string } | null>(null);
  const [gh, setGh] = useState<Gh | null>(null);
  const [code] = useState(newChallenge);
  const [domain, setDomain] = useState('');
  const [domainOk, setDomainOk] = useState<string | null>(null);
  const [dnsMsg, setDnsMsg] = useState<string | null>(null);
  const [claim, setClaim] = useState('');
  const [claims, setClaims] = useState<string[]>([]);
  const [form, setForm] = useState({ name: '', headline: '', city: '', age: '', school: '', availability: 'open' as Availability, hours: '15' });

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr({ key, msg: e instanceof VerifyError ? e.message : 'Beklenmeyen bir hata oldu.' });
    } finally {
      setBusy(null);
    }
  };

  const fetchRepos = () =>
    run('fetch', async () => {
      const { user, repos } = await fetchGitHub(handle);
      setGh({ user, repos, via: null });
      setForm((f) => ({ ...f, name: f.name || user.name || user.login, city: f.city || user.location || '' }));
    });

  const verifyGh = () =>
    run('verify', async () => {
      const via = await checkGitHubChallenge(gh!.user.login, code);
      if (!via) throw new VerifyError('Kod henüz görünmüyor. Bio’ya ya da gist’e eklediğinden emin ol; GitHub önbelleği yaklaşık 1 dakika gecikebilir.');
      setGh({ ...gh!, via });
    });

  const verifyDns = () =>
    run('dns', async () => {
      const r = await checkDnsTxt(domain, code);
      if (r.ok) {
        setDomainOk(cleanDomain(domain));
        setDnsMsg(null);
      } else setDnsMsg(r.records.length ? `Kayıt bulundu ama değer eşleşmiyor: ${r.records.join(', ')}` : 'TXT kaydı henüz yayılmamış. DNS değişiklikleri birkaç dakika sürebilir.');
    });

  const repoEvidence = useMemo(() => (gh ? reposToEvidence(gh.repos, !!gh.via, gh.via) : []), [gh]);
  const evidence: Evidence[] = [
    ...repoEvidence,
    ...(domainOk ? [domainEvidence(domainOk)] : []),
    ...claims.map<Evidence>((t, i) => ({ id: `e-claim-${i}`, title: t, summary: 'Kişisel beyan.', source: 'claim', level: 'S1', skills: [], producedAt: new Date().toISOString() })),
  ];
  const verified = evidence.filter((e) => e.level !== 'S1').length;

  const create = () => {
    const login = gh?.user.login.toLowerCase();
    const taken = s.people.some((p) => !p.isDemoUser && p.handle === login);
    const person: Person = {
      id: me?.id ?? uid('p'),
      handle: login ? (taken ? `${login}-gh` : login) : `kisi-${code.slice(-4)}`,
      name: form.name.trim() || gh?.user.name || 'Adsız',
      headline: form.headline.trim() || (gh ? `${[...new Set(evidence.flatMap((e) => e.skills))].slice(0, 2).map(skillLabel).join(' · ') || 'Geliştirici'}` : 'Üretici'),
      city: form.city.trim() || '—',
      age: Number(form.age) || 0,
      school: form.school.trim() || '—',
      bio: gh?.user.bio && !gh.user.bio.includes('nirengi-') ? gh.user.bio : 'Kanıtlarını NİRENGİ’ye bağladı.',
      availability: form.availability,
      weeklyHours: Number(form.hours) || 0,
      joinedAt: me?.joinedAt ?? new Date().toISOString(),
      evidence,
      links: { github: gh && !gh.offline ? gh.user.login : undefined, domain: domainOk ?? undefined },
      isDemoUser: true,
    };
    actions.upsertDemoUser(person);
    setView({ persona: 'person' });
    location.href = `/profil/${person.handle}`;
  };

  return (
    <>
      <header className="band">
        <div className="wrap py-10 md:py-12">
          <p className="eyebrow">02 · Profil & portfolyo doğruluğu</p>
          <h1 className="display mt-3 text-[40px] md:text-[56px]">
            Özgeçmiş yazma. <em>Eserini bağla.</em>
          </h1>
          <p className="mt-3 max-w-2xl text-ink-2">
            Kimseden CV istemiyoruz. GitHub hesabını ve alan adını bağla; sistem üretim geçmişini çıkarıp Kanıt Kartını otomatik oluştursun. Doğrulamalar gerçek servislere gider; sahipliği
            kanıtlanamayan her şey beyan (S1) olarak kalır.
          </p>
          {me && (
            <p className="mt-4 text-sm text-ink-3">
              Zaten bir Kanıt Kartın var:{' '}
              <a href={`/profil/${me.handle}`} className="font-semibold text-ink underline">
                {me.name}
              </a>
              . Yeniden bağlarsan üzerine yazılır.
            </p>
          )}
        </div>
      </header>

      <div className="wrap grid gap-6 py-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Step n={1} title="GitHub hesabı · S2 makine doğrulaması" done={!!gh?.via}>
            {!gh ? (
              <>
                <form
                  className="flex flex-wrap gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    fetchRepos();
                  }}
                >
                  <div className="flex min-w-60 flex-1 items-center rounded-lg border border-line-2 bg-raised focus-within:border-signal">
                    <span className="pl-3 font-mono text-sm text-ink-3">github.com/</span>
                    <input value={handle} onChange={(e) => setHandle(e.target.value)} className="min-w-0 flex-1 bg-transparent px-1 py-2.5 outline-none" placeholder="kullanici-adi" aria-label="GitHub kullanıcı adı" />
                  </div>
                  <button className="btn-ink" disabled={!handle.trim() || busy === 'fetch'}>
                    {busy === 'fetch' ? 'Getiriliyor…' : 'Depoları getir'}
                  </button>
                </form>
                <p className="hint">
                  Herkese açık GitHub API’sinden okunur; parola ya da token istenmez.{' '}
                  <button className="underline" onClick={() => setGh(OFFLINE)}>
                    Bağlantı yok mu? Çevrim dışı örnekle dene
                  </button>
                </p>
              </>
            ) : (
              <div>
                <div className="flex items-center gap-3">
                  {gh.user.avatar_url ? <img src={gh.user.avatar_url} alt="" className="h-10 w-10 rounded-full border border-line" /> : <span className="h-10 w-10 rounded-full bg-sunken" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{gh.user.name || gh.user.login}</p>
                    <p className="font-mono text-xs text-ink-3">
                      @{gh.user.login} · {gh.user.public_repos} depo · {new Date(gh.user.created_at).getFullYear()}’den beri
                    </p>
                  </div>
                  <button className="btn-quiet btn-sm" onClick={() => setGh(null)}>
                    Değiştir
                  </button>
                </div>
                {gh.offline && <p className="mt-3 rounded-md bg-warn/10 px-3 py-2 text-xs text-warn">Çevrim dışı örnek veri: gerçek doğrulama yapılmaz, kanıtlar S1 olarak kalır.</p>}

                {!gh.via && !gh.offline && (
                  <div className="mt-4 rounded-lg border border-line bg-paper p-4">
                    <p className="text-sm font-semibold">Hesap sahipliğini kanıtla</p>
                    <p className="mt-1 text-sm text-ink-2">
                      Bu tek kullanımlık kodu{' '}
                      <a className="underline" href="https://github.com/settings/profile" target="_blank" rel="noreferrer">
                        GitHub bio’na
                      </a>{' '}
                      ya da açıklamasında geçen herkese açık bir{' '}
                      <a className="underline" href="https://gist.github.com" target="_blank" rel="noreferrer">
                        gist’e
                      </a>{' '}
                      ekle. Doğrulamadan sonra silebilirsin.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <code className="flex-1 rounded-md border border-line-2 bg-raised px-3 py-2 font-mono text-[15px]">{code}</code>
                      <button className="btn-line btn-sm" onClick={() => navigator.clipboard?.writeText(code)}>
                        Kopyala
                      </button>
                    </div>
                    <button className="btn-primary mt-3" onClick={verifyGh} disabled={busy === 'verify'}>
                      {busy === 'verify' ? 'Kontrol ediliyor…' : 'Sahipliği doğrula'}
                    </button>
                  </div>
                )}
                {gh.via && (
                  <p className="mt-4 flex items-center gap-2 text-sm text-s3">
                    <LevelGlyph level="S2" /> Hesap sahipliği doğrulandı ({gh.via === 'bio' ? 'bio' : 'gist'} sınaması). Depolar S2 kanıt olarak işlenecek.
                  </p>
                )}
              </div>
            )}
            {err && err.key !== 'dns' && <ErrorNote msg={err.msg} />}
          </Step>

          <Step n={2} title="Alan adı · DNS TXT (isteğe bağlı)" done={!!domainOk}>
            {domainOk ? (
              <p className="flex items-center gap-2 text-sm text-s3">
                <LevelGlyph level="S2" /> {domainOk} sahipliği doğrulandı.
              </p>
            ) : (
              <>
                <input className="field" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="ornek.dev" aria-label="Alan adı" />
                {domain.includes('.') && (
                  <div className="mt-3 rounded-lg border border-line bg-paper p-4 font-mono text-[13px]">
                    <p className="font-sans text-sm text-ink-2">DNS paneline şu TXT kaydını ekle:</p>
                    <p className="mt-2">
                      <span className="text-ink-3">ad </span>
                      {txtName(domain)}
                    </p>
                    <p>
                      <span className="text-ink-3">değer </span>
                      {txtValue(code)}
                    </p>
                  </div>
                )}
                <button className="btn-line mt-3" disabled={!domain.includes('.') || busy === 'dns'} onClick={verifyDns}>
                  {busy === 'dns' ? 'Sorgulanıyor…' : 'DNS’i kontrol et'}
                </button>
                {dnsMsg && <p className="mt-2 text-sm text-warn">{dnsMsg}</p>}
                {err?.key === 'dns' && <ErrorNote msg={err.msg} />}
                <p className="hint">Google ve Cloudflare DNS-over-HTTPS üzerinden sorgulanır.</p>
              </>
            )}
          </Step>

          <Step n={3} title="Beyanlar · S1 (isteğe bağlı)" done={claims.length > 0}>
            <p className="text-sm text-ink-2">Henüz doğrulanamayan işlerini de ekleyebilirsin. Görünürler ama eşleşmede düşük ağırlık alırlar.</p>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (claim.trim()) setClaims([...claims, claim.trim()]);
                setClaim('');
              }}
            >
              <input className="field" value={claim} onChange={(e) => setClaim(e.target.value)} placeholder="ör. Üniversite kulübünün web sitesini yaptım" />
              <button className="btn-line">Ekle</button>
            </form>
          </Step>

          <Step n={4} title="Kısa bilgi">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Ad soyad" v={form.name} on={(v) => setForm({ ...form, name: v })} />
              <Input label="Başlık" v={form.headline} on={(v) => setForm({ ...form, headline: v })} ph="ör. Arayüz geliştirici · React" />
              <Input label="Şehir" v={form.city} on={(v) => setForm({ ...form, city: v })} />
              <label className="block">
                <span className="label">Müsaitlik</span>
                <select className="field" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value as Availability })}>
                  {Object.entries(AVAILABILITY).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <Input label="Yaş" v={form.age} on={(v) => setForm({ ...form, age: v.replace(/\D/g, '') })} />
              <Input label="Okul" v={form.school} on={(v) => setForm({ ...form, school: v })} />
            </div>
            <p className="hint">Yaş, okul, şehir ve isim kör keşifte kurumlardan gizlenir; ilk temasta açılır.</p>
          </Step>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <p className="eyebrow">Kanıt Kartı önizlemesi</p>
            <p className="mt-2 text-lg font-semibold">{form.name || gh?.user.name || 'Adın'}</p>
            <p className="num mt-1 text-sm text-ink-3">
              {evidence.length} kanıt · {verified} doğrulanmış
            </p>
            <ul className="mt-4 max-h-[340px] space-y-2 overflow-auto">
              {evidence.length === 0 && <li className="text-sm text-ink-3">Henüz kanıt yok. GitHub hesabını bağlayarak başla.</li>}
              {evidence.map((e) => (
                <li key={e.id} className="rounded-lg border border-line bg-paper p-3">
                  <div className="flex items-center gap-2">
                    <LevelBadge level={e.level} />
                    <span className="truncate text-sm font-medium">{e.title.split(' — ')[0]}</span>
                  </div>
                  {e.skills.length > 0 && <p className="mt-1 truncate text-xs text-ink-3">{e.skills.map(skillLabel).join(' · ')}</p>}
                </li>
              ))}
            </ul>
            <button className="btn-primary mt-5 w-full" disabled={evidence.length === 0} onClick={create}>
              Kanıt Kartımı oluştur
            </button>
            <p className="hint text-center">Veri bu tarayıcıda tutulur; demo sıfırlanınca silinir.</p>
          </div>
        </aside>
      </div>
    </>
  );
}

function Step({ n, title, done, children }: { n: number; title: string; done?: boolean; children: ReactNode }) {
  return (
    <section className="card p-6">
      <div className="flex items-center gap-3">
        <span className={`num grid h-7 w-7 place-items-center rounded-full text-sm ${done ? 'bg-s3 text-white' : 'border border-line-2 text-ink-2'}`}>{done ? <StatusIcon kind="ok" /> : n}</span>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="mt-4 pl-10">{children}</div>
    </section>
  );
}

function ErrorNote({ msg }: { msg: string }) {
  return (
    <p role="alert" className="mt-3 rounded-lg border border-danger/40 bg-danger/8 px-3 py-2 text-sm text-danger">
      {msg}
    </p>
  );
}

function Input({ label, v, on, ph }: { label: string; v: string; on: (v: string) => void; ph?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="field" value={v} onChange={(e) => on(e.target.value)} placeholder={ph} />
    </label>
  );
}
