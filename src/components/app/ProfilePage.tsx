// Profil: the young side's survey map (streak, XP, badges as markers), and the
// calm record an institution reads. Same data; the kurum viewer never sees the game.

import { useEffect, useMemo, type ReactNode } from 'react';
import { BadgeCheck, CalendarCheck, ChevronRight, Crosshair, Flag as FlagIcon, GitMerge, HandHelping, Layers, Link2, Mountain, Stamp, TrendingUp } from 'lucide-react';
import type { Level, Person } from '../../lib/types.ts';
import { actions, byId, currentMe, setView, useAppState, useView } from '../../lib/store.ts';
import { coverageFor, findConflicts, momentum } from '../../lib/engine/match.ts';
import { journey, progress, TIERS, XP, type Step } from '../../lib/engine/progress.ts';
import { AVAILABILITY, LEVELS, PILOT_STATUS } from '../../lib/labels.ts';
import { fmtDate } from '../../lib/format.ts';
import { skillLabel } from '../../lib/skills.ts';
import { Avatar, LevelBadge, LevelGlyph, LEVEL_NAME, OrgMark, useIdentity } from '../ui/primitives.tsx';
import { CountUp, feedback, Head, EmptyState, Why } from '../ui/kit';
import { Bolt, Building, CheckCircle, Flag, Flame, GitHub, Lock, Star } from '../ui/icons';
import { Tri } from '../ui/pafta';
import { TriMark } from '../ui/TriMark';
import { EvidenceItem } from './EvidenceItem.tsx';

const LEVEL_ORDER: Level[] = ['S3', 'S2', 'S1'];

/** `handle` undefined means "me" (the /profil page). */
export default function ProfilePage({ handle }: { handle?: string }) {
  const s = useAppState();
  const view = useView();
  const person = handle ? byId.handle(s, handle) : currentMe(s);
  if (!person)
    return (
      <div className="mx-auto max-w-[680px] py-6">
        <EmptyState
          title="Bu profil bulunamadı"
          action={
            <a className="btn-primary" href={view.persona === 'org' ? '/kesfet' : '/topluluk'}>
              {view.persona === 'org' ? 'Keşfet’e dön' : 'Topluluğa dön'}
            </a>
          }
        >
          Demo verisi sıfırlanmış olabilir.
        </EmptyState>
      </div>
    );
  return <Profile personId={person.id} />;
}

function Profile({ personId }: { personId: string }) {
  const s = useAppState();
  const view = useView();
  const person = byId.person(s, personId)!;
  const id = useIdentity(person);
  const conflicts = useMemo(() => findConflicts(s.people), [s.people]);

  const kurum = view.persona === 'org';
  const isSelf = !kurum && person.id === currentMe(s).id;

  const seeded = Date.parse(s.seededAt);
  const fresh = (e: { source: string; verifiedAt?: string }) => e.source === 'pilot' && !!e.verifiedAt && Date.parse(e.verifiedAt) > seeded;
  const hasFresh = person.evidence.some(fresh);
  useEffect(() => {
    if (hasFresh && !s.demo.viewedProfileAfterApproval) actions.flag({ viewedProfileAfterApproval: true });
  }, [hasFresh, s.demo.viewedProfileAfterApproval]);

  const p = progress(s, person);
  const m = momentum(person);
  const pilots = s.pilots.filter((x) => x.personId === person.id);
  const counts = { S1: 0, S2: 0, S3: 0 } as Record<Level, number>;
  person.evidence.forEach((e) => counts[e.level]++);
  const verified = person.evidence.filter((e) => e.level !== 'S1' && !e.dispute && !conflicts.has(e.id)).length;
  const skills = [...new Set(person.evidence.flatMap((e) => e.skills))]
    .map((k) => coverageFor(person, k, conflicts))
    .sort((a, b) => b.score - a.score || b.count - a.count)
    .slice(0, 6);

  const copy = () => {
    const url = `${location.origin}/profil/${person.handle}`;
    navigator.clipboard?.writeText(url).then(
      () => feedback({ tone: 'good', title: 'Bağlantı kopyalandı', text: 'Kanıt kartını istediğin yere yapıştırabilirsin.' }),
      () => feedback({ tone: 'bad', title: 'Kopyalanamadı', text: 'Tarayıcı izin vermedi. Adres çubuğundan kopyalayabilirsin.' }),
    );
  };

  const reveal = () => {
    const org = byId.org(s, view.orgId);
    setView({ revealed: [...view.revealed, person.id] });
    actions.micro(person.id, view.orgId, `${org?.name ?? 'Bir kurum'}, Aday · ${id.code} ile ilk teması kurdu; kimlik açıldı.`);
    feedback({ tone: 'good', title: 'Kimlik açıldı', text: 'Artık adı ve bağlantıları görebilirsin.' });
  };

  return (
    <div className="mx-auto max-w-[680px]">
      {/* Header */}
      <section className="card p-5 sm:p-6" aria-label="Profil">
        <div className="flex items-start gap-4 sm:gap-5">
          <Avatar person={person} size={88} />
          <div className="min-w-0 flex-1">
            <h1 className="text-[26px] font-black leading-tight text-ink sm:text-[30px]">{id.name}</h1>
            {id.hidden ? (
              <p className="text-[15px] font-bold text-ink-3">{id.sub}</p>
            ) : (
              <>
                <p className="text-[15px] font-bold text-ink-3">
                  @{person.handle} · {person.city}
                </p>
                <p className="mt-0.5 text-[16px] font-extrabold text-ink-2">{person.headline}</p>
              </>
            )}
            {!id.hidden && (
              <p className="mt-1 text-[13px] font-bold text-ink-3">
                {person.age} yaş · {person.school} · {fmtDate(person.joinedAt)} tarihinden beri
              </p>
            )}
          </div>
        </div>

        <p className="mt-4 text-[16px] font-semibold leading-relaxed text-ink-2">{person.bio}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`chip ${person.availability === 'open' ? '!border-green !text-green-lip' : ''}`}>
            {AVAILABILITY[person.availability]}
            {person.weeklyHours > 0 && ` · haftada ${person.weeklyHours} saat`}
          </span>
          {!id.hidden && person.links.github && (
            <a className="chip hover:bg-bg-2" href={`https://github.com/${person.links.github}`} target="_blank" rel="noreferrer">
              <GitHub size={15} />
              {person.links.github}
            </a>
          )}
          {!id.hidden && person.links.domain && (
            <a className="chip hover:bg-bg-2" href={`https://${person.links.domain}`} target="_blank" rel="noreferrer">
              {person.links.domain}
            </a>
          )}
          {m.rising && (
            <span className="inline-flex items-center">
              <span className="chip !border-green !bg-green-tint !text-green-lip">
                <TrendingUp className="h-4 w-4" strokeWidth={3} />
                Yükselen sinyal
              </span>
              <Why title="Yükselen sinyal ne demek?">
                <p className="text-[15px] font-bold text-ink-2">
                  Son 90 günde <b className="num text-ink">{m.recent.toFixed(1)}</b> ağırlıklı kanıt üretildi; önceki 9 ayın çeyreklik ortalaması <b className="num text-ink">{(m.prior / 3).toFixed(1)}</b>.
                </p>
                <p className="mt-3 text-[14px] font-bold text-ink-3">Takipçi ya da beğeni sayılmaz; yalnız doğrulanmış üretimin ivmesi.</p>
              </Why>
            </span>
          )}
        </div>

        {skills.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Güçlü olduğu alanlar">
            {skills.map((c) => (
              <li key={c.skill} className="chip" title={`${c.verified} doğrulanmış kanıt`}>
                {c.best && <LevelGlyph level={c.best.level} size={13} />}
                {skillLabel(c.skill)}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {id.hidden ? (
            <>
              <button type="button" className="btn-primary" onClick={reveal}>
                İlk teması kur, kimliği aç
              </button>
              <p className="min-w-0 flex-1 basis-[200px] text-[13px] font-bold text-ink-3">İsimsiz inceleme: kurum ilk temasa kadar yalnız işi görür.</p>
            </>
          ) : (
            <>
              {isSelf && (
                <a href="/kanit-bagla" data-coach="g-profil-bagla" className="btn-primary">
                  Kanıt bağla
                </a>
              )}
              <button type="button" className="btn-line" onClick={copy}>
                Bağlantıyı kopyala
              </button>
            </>
          )}
        </div>
      </section>

      {/* One block of numbers */}
      <Stats kurum={kurum} person={person} streak={p.streak} xp={p.xpTotal} verified={verified} s3={counts.S3} pilots={pilots.length} />

      {/* Consistency */}
      <section className="card mt-6 p-5" aria-label="Son 10 hafta">
        <Head
          title="Son 10 hafta"
          action={
            <Why title="Bu satır neyi sayıyor?">
              <div className="space-y-3 text-[15px] font-bold text-ink-2">
                <p>
                  Bir hafta, <b className="text-ink">{p.goal} gün</b> üretim yapılmışsa tutturulmuş sayılır. Hedefi herkes kendi seçer: haftada 1, 3 ya da 5 gün.
                </p>
                <p>
                  Üretim günü, o gün herkese açık bir çıktı (GitHub’da gönderi, PR, sürüm) ya da gerçek bir yardım olması demek. Bir günde 1 ya da 50 commit aynıdır; <b className="text-ink">commit sayısı sayılmaz</b>, günler sayılır.
                </p>
                <p className="text-ink-3">Mola haftası ilan edilen haftalar boşluk sayılmaz, düzenliliği bozmaz.</p>
              </div>
            </Why>
          }
        />
        <p className="mt-1 text-[15px] font-bold text-ink-3">
          {p.history.filter((w) => w.met).length}/{p.history.length} hafta hedef tutturuldu
          {p.history.some((w) => w.rest) && ` · ${p.history.filter((w) => w.rest).length} mola`}
        </p>
        <ol className="mt-4 grid grid-cols-10 items-end gap-1.5 sm:gap-3" aria-label="Haftalık hedef geçmişi, eskiden yeniye">
          {p.history.map((w, i) => {
            const current = i === p.history.length - 1;
            const state = w.rest ? 'mola' : w.met ? 'hedef tutturuldu' : current ? 'sürüyor' : 'hedef tutturulmadı';
            return (
              <li key={w.week} title={`${fmtDate(w.week)} haftası: ${w.active}/${w.goal} gün`} aria-label={`${fmtDate(w.week)} haftası: ${w.active}/${w.goal} gün, ${state}`}>
                {w.met ? (
                  <TriMark color="orange" />
                ) : w.rest ? (
                  <TriMark color="ink-4" variant="dashed" />
                ) : (
                  <TriMark color={current ? 'orange' : 'line-2'} variant="outline" />
                )}
              </li>
            );
          })}
        </ol>
        <div className="mt-2 flex justify-between text-[12px] font-bold text-ink-3">
          <span>{p.history.length} hafta önce</span>
          <span>Bu hafta</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-bold text-ink-3" aria-hidden="true">
          <span className="inline-flex items-center gap-1.5">
            <TriMark size={13} color="orange" lip={false} /> hedef tuttu
          </span>
          <span className="inline-flex items-center gap-1.5">
            <TriMark size={13} color="line-2" variant="outline" /> kaçtı
          </span>
          <span className="inline-flex items-center gap-1.5">
            <TriMark size={13} color="ink-4" variant="dashed" /> mola
          </span>
        </div>
      </section>

      {/* Badges: the road, as earned tiles */}
      {!kurum && <Badges person={person} self={isSelf} />}

      {/* Evidence */}
      <section data-coach="g-profil-kanit" className="mt-10" aria-label="Kanıtlar">
        <Head
          title={
            <>
              Kanıtlar <span className="num text-ink-3">{person.evidence.length}</span>
            </>
          }
          action={
            <Why title="Kanıt seviyeleri ne demek?">
              <ul className="space-y-3">
                {LEVEL_ORDER.map((l) => (
                  <li key={l} className="rounded-[14px] bg-bg-2 p-3">
                    <LevelBadge level={l} />
                    <p className="mt-2 text-[15px] font-bold text-ink-2">{LEVELS[l].blurb}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[14px] font-bold text-ink-3">NİRENGİ kimseye tek bir “güven puanı” vermez. Her iddianın nasıl doğrulandığını ayrı ayrı gösterir.</p>
            </Why>
          }
        />

        {hasFresh && (
          <div className="rise mt-4 flex items-start gap-3 rounded-[18px] bg-indigo-tint p-4">
            <LevelGlyph level="S3" size={22} />
            <div>
              <p className="text-[16px] font-black text-indigo">Döngü kapandı</p>
              <p className="text-[15px] font-bold text-ink-2">Deneme projesinde çift onaylanan aşama bu profile “Kurum onaylı” kanıt olarak işlendi. Bundan sonraki her eşleşmede en yüksek ağırlıkla sayılır.</p>
            </div>
          </div>
        )}

        {person.evidence.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title={isSelf ? 'Henüz kanıtın yok' : 'Henüz kanıt yok'}
              action={
                isSelf ? (
                  <a href="/kanit-bagla" data-coach="g-profil-bagla" className="btn-primary">
                    Kanıt bağla
                  </a>
                ) : undefined
              }
            >
              {isSelf ? 'GitHub hesabını ya da alan adını bağla; ilk işin doğrulanınca burada görünür.' : 'Bu kişi henüz bir iş eklememiş.'}
            </EmptyState>
          </div>
        ) : (
          LEVEL_ORDER.filter((l) => counts[l] > 0).map((l) => (
            <div key={l} className="mt-6">
              <h3 className="flex items-center gap-2 text-[17px] font-black text-ink">
                <LevelGlyph level={l} size={18} />
                {LEVEL_NAME[l]}
                <span className="num text-ink-3">{counts[l]}</span>
              </h3>
              <p className="text-[14px] font-bold text-ink-3">{LEVELS[l].short}</p>
              <div className="mt-3 space-y-3">
                {person.evidence
                  .filter((e) => e.level === l)
                  .sort((a, b) => Number(fresh(b)) - Number(fresh(a)) || Date.parse(b.producedAt) - Date.parse(a.producedAt))
                  .map((e) => {
                    const c = conflicts.get(e.id);
                    return <EvidenceItem key={e.id} ev={e} person={person} conflict={c} ownerHandle={c ? byId.person(s, c.ownerId)?.handle : undefined} fresh={fresh(e)} owner={isSelf} />;
                  })}
              </div>
            </div>
          ))
        )}
      </section>

      {/* Pilots */}
      {pilots.length > 0 && (
        <section className="mt-10" aria-label="Projeler">
          <Head title="Projeler" />
          <ul className="mt-4 space-y-3">
            {pilots.map((pl) => {
              const org = byId.org(s, pl.orgId)!;
              const ok = pl.milestones.filter((x) => x.state === 'approved').length;
              return (
                <li key={pl.id}>
                  <a href={`/pilotlar/${pl.id}`} className="card-press flex items-center gap-4 p-4">
                    <OrgMark name={org.name} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-black text-ink">{pl.title}</p>
                      <p className="truncate text-[14px] font-bold text-ink-3">
                        {org.name} · {PILOT_STATUS[pl.status]}
                      </p>
                    </div>
                    <span className="num shrink-0 text-[14px] font-extrabold text-ink-2">
                      {ok}/{pl.milestones.length} <span className="hidden text-ink-3 sm:inline">çift onay</span>
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-ink-3" strokeWidth={3} />
                  </a>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[13px] font-bold text-ink-3">Kurumlar ve kişiler kurgusal demo verisidir.</p>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- stats

function Stats({ kurum, person, streak, xp, verified, s3, pilots }: { kurum: boolean; person: Person; streak: number; xp: number; verified: number; s3: number; pilots: number }) {
  const tier = person.tier ?? 0;
  const tiles: { key: string; icon: ReactNode; value: ReactNode; label: string; color: string }[] = kurum
    ? [
        { key: 'dogrulanmis', icon: <CheckCircle size={34} />, value: <CountUp value={verified} />, label: 'doğrulanmış kanıt', color: 'rgb(var(--green-lip))' },
        { key: 'onayli', icon: <Building size={34} />, value: <CountUp value={s3} />, label: 'kurum onaylı kanıt', color: 'rgb(var(--indigo))' },
        { key: 'duzenli', icon: <Flame size={34} className={streak ? 'flame-live' : ''} dim={!streak} />, value: <CountUp value={streak} />, label: 'hafta üst üste düzenli', color: 'rgb(var(--orange-ink))' },
        { key: 'proje', icon: <Flag size={34} />, value: <CountUp value={pilots} />, label: 'proje', color: 'rgb(var(--green-lip))' },
      ]
    : [
        { key: 'seri', icon: <Flame size={34} className={streak ? 'flame-live' : ''} dim={!streak} />, value: <CountUp value={streak} />, label: 'haftalık seri', color: 'rgb(var(--orange-ink))' },
        { key: 'xp', icon: <Bolt size={34} />, value: <CountUp value={xp} />, label: 'toplam XP', color: 'rgb(var(--gold-ink))' },
        {
          key: 'lig',
          icon: (
            <TriMark size={32} color="purple">
              <Mountain className="h-3.5 w-3.5 text-white" strokeWidth={3.5} />
            </TriMark>
          ),
          value: TIERS[tier],
          label: 'ligi',
          color: 'rgb(var(--purple))',
        },
        { key: 'dogrulanmis', icon: <CheckCircle size={34} />, value: <CountUp value={verified} />, label: 'doğrulanmış kanıt', color: 'rgb(var(--green-lip))' },
      ];

  return (
    <section data-coach="g-profil-sayilar" className="mt-6" aria-label="Sayılar">
      <ul className="grid grid-cols-2 gap-[2px] overflow-hidden rounded-[18px] border-2 border-line bg-line sm:grid-cols-4">
        {tiles.map((t) => (
          <li key={t.key} className="flex items-center gap-3 bg-bg p-4">
            {t.icon}
            <div className="min-w-0">
              <p className="num truncate text-[22px] font-black leading-none" style={{ color: t.color }}>
                {t.value}
              </p>
              <p className="mt-1 text-[13px] font-bold leading-tight text-ink-3">{t.label}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-1 flex justify-end">
        <Why title="Bu sayılar nereden geliyor?">
          <div className="space-y-3 text-[15px] font-bold text-ink-2">
            {kurum ? (
              <>
                <p>
                  <b className="text-ink">Doğrulanmış kanıt:</b> “Doğrulandı” ve “Kurum onaylı” seviyedeki işler. Beyanlar, itirazı süren ve kopya işaretli kanıtlar sayılmaz.
                </p>
                <p>
                  <b className="text-ink">Düzenli hafta:</b> kişinin kendi hedefini üst üste kaç hafta tutturduğu. Üretim yapılan günler sayılır, commit sayısı değil.
                </p>
              </>
            ) : (
              <>
                <p>
                  <b className="text-ink">Seri:</b> haftalık hedefin üst üste kaç hafta tutturulduğu. Mola haftası seriyi bozmaz, bekletir.
                </p>
                <p>
                  <b className="text-ink">Toplam XP:</b> yalnız doğrulanabilir olaylardan gelir: üretim günü +{XP.activeDay}, doğrulanan iş +{XP.evidence}, kurum onayı +{XP.milestone}. Günde en fazla {XP.dailyCap}.
                </p>
                <p>
                  <b className="text-ink">Lig:</b> benzer tempodaki kişilerle haftalık XP yarışı. Basamaklar: {TIERS.join(' → ')}.
                </p>
                <p>
                  <b className="text-ink">Doğrulanmış kanıt:</b> “Doğrulandı” ve “Kurum onaylı” işler. Beyanlar, itirazı süren ve kopya işaretli kanıtlar sayılmaz.
                </p>
              </>
            )}
          </div>
        </Why>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- badges

const GLYPH = 'h-[26px] w-[26px] text-white';
const BADGE: Record<string, { name: string; cond: string; icon: ReactNode }> = {
  bagla: { name: 'Bağlandı', cond: 'GitHub ya da alan adını bağlamak', icon: <Link2 className={GLYPH} strokeWidth={3} /> },
  dogrula: { name: 'Doğrulandı', cond: 'İlk işini makineyle doğrulatmak', icon: <BadgeCheck className={GLYPH} strokeWidth={3} /> },
  seri: { name: 'Düzenli', cond: 'Haftalık hedefini tutturmak', icon: <CalendarCheck className={GLYPH} strokeWidth={3} /> },
  yardim: { name: 'Yardımsever', cond: 'Cevabı “İşe yaradı” seçilmek', icon: <HandHelping className={GLYPH} strokeWidth={3} /> },
  pilot: { name: 'İlk proje', cond: 'Bir kurum ihtiyacında proje açmak', icon: <FlagIcon className={GLYPH} strokeWidth={3} /> },
  onay: { name: 'Kurum onaylı', cond: 'Bir aşamada kurum onayı almak', icon: <Stamp className={GLYPH} strokeWidth={3} /> },
  oss: { name: 'Açık kaynak', cond: 'Birleşen bir PR ile katkı vermek', icon: <GitMerge className={GLYPH} strokeWidth={3} /> },
  'uc-onay': { name: 'Üç onay', cond: 'Üç ayrı kurum onayı toplamak', icon: <Layers className={GLYPH} strokeWidth={3} /> },
  zirve: { name: 'Zirve', cond: 'Bir projeyi başarıyla kapatmak', icon: <Mountain className={GLYPH} strokeWidth={3} /> },
};

/** The dotted survey line, same dots as the Bugün trail. */
const DOTS = { strokeDasharray: '2 12', strokeLinecap: 'round', strokeWidth: 4 } as const;
const inked = (tone: string) => `rgb(var(--${tone}) / 0.55)`;

function Badges({ person, self }: { person: Person; self: boolean }) {
  const s = useAppState();
  const units = journey(s, person);
  const flat = units.flatMap((u) => u.steps);
  const earned = flat.filter((x) => x.done).length;
  const nextId = flat.find((x) => !x.done)?.id;

  return (
    <section data-coach="g-profil-rozet" className="mt-10" aria-label="Rozetler">
      <Head
        title={
          <>
            Rozetler{' '}
            <span className="num text-ink-3">
              {earned}/{flat.length}
            </span>
          </>
        }
        action={
          <Why title="Rozetler nasıl kazanılır?">
            <p className="text-[15px] font-bold text-ink-2">Her rozet, yolun bir adımı. Sistem bunları profildeki gerçek olaylardan okur: kanıtlar, görevler, projeler ve topluluktaki cevaplar. Elle verilmez, kendiliğinden kaybolmaz.</p>
          </Why>
        }
      />
      <div className="card mt-4 px-3 pb-5 pt-4 sm:px-5">
        {units.map((u, ui) => {
          const prev = units[ui - 1];
          return (
            <div key={u.id}>
              {prev && (
                <svg width="4" height="30" className="mx-auto my-2 block overflow-visible" aria-hidden="true">
                  <line x1="2" y1="2" x2="2" y2="28" stroke={prev.steps.every((x) => x.done) ? inked(prev.tone) : 'rgb(var(--line-2))'} {...DOTS} />
                </svg>
              )}
              <p className="flex items-baseline justify-between gap-3">
                <span className="text-[17px] font-black text-ink">{u.title}</span>
                <span className="num text-[14px] font-extrabold" style={{ color: `rgb(var(--${u.tone}))` }}>
                  {u.steps.filter((x) => x.done).length}/{u.steps.length}
                </span>
              </p>
              <ol className="relative mt-4 grid grid-cols-3">
                <svg className="pointer-events-none absolute left-0 top-0 h-[72px] w-full overflow-visible" aria-hidden="true">
                  {[0, 1].map((i) => (
                    <line key={i} x1={`${16.67 + i * 33.33}%`} x2={`${50 + i * 33.33}%`} y1="37" y2="37" stroke={u.steps[i].done ? inked(u.tone) : 'rgb(var(--line-2))'} {...DOTS} />
                  ))}
                </svg>
                {u.steps.map((st) => (
                  <li key={st.id} className="relative">
                    <Marker step={st} tone={u.tone} next={self && st.id === nextId} />
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Marker({ step, tone, next }: { step: Step; tone: 'indigo' | 'cyan' | 'purple'; next: boolean }) {
  const b = BADGE[step.id] ?? { name: step.title, cond: step.why, icon: <Star size={26} /> };
  const state = step.done ? 'done' : next ? 'current' : 'locked';
  const body = (
    <>
      <span className="relative block">
        {next && (
          <>
            <span className="ping-soft absolute left-1/2 top-[62%] h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: `rgb(var(--${tone}) / 0.35)` }} aria-hidden="true" />
            <span className="ping-soft absolute left-1/2 top-[62%] h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: `rgb(var(--${tone}) / 0.25)`, animationDelay: '1.1s' }} aria-hidden="true" />
          </>
        )}
        <Tri size={64} tone={tone} state={state}>
          {state === 'done' ? b.icon : state === 'current' ? <Crosshair className={GLYPH} strokeWidth={3} /> : <Lock size={26} />}
        </Tri>
      </span>
      <span className={`mt-2 block text-[15px] font-black leading-tight ${step.done ? 'text-ink' : 'text-ink-3'}`}>{b.name}</span>
      <span className="mt-0.5 block px-1 text-[13px] font-semibold leading-snug text-ink-3">{b.cond}</span>
      <span className="sr-only">{step.done ? 'Kazanıldı' : next ? 'Sıradaki' : 'Kilitli'}</span>
      {next && (
        <span className="mt-1.5 inline-flex items-center gap-0.5 text-[13px] font-bold" style={{ color: `rgb(var(--${tone}))` }}>
          {step.cta}
          <ChevronRight className="h-4 w-4" strokeWidth={3} />
        </span>
      )}
    </>
  );
  const cls = 'flex flex-col items-center text-center';
  if (next)
    return (
      <a href={step.href} className={`${cls} transition-transform duration-100 active:translate-y-[3px]`}>
        {body}
      </a>
    );
  return <div className={cls}>{body}</div>;
}
