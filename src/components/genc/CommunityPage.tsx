// Topluluk: show your work, ask, thank. A warm place where helping counts.

import { useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, MessageCircle, Plus, X } from 'lucide-react';
import type { Evidence, Person, Post, Reply, State } from '../../lib/types.ts';
import { actions, byId, currentMe, useAppState } from '../../lib/store.ts';
import { dayKey, helpers, POST_KIND, XP } from '../../lib/engine/progress.ts';
import { relTime } from '../../lib/format.ts';
import Niri from '../ui/Niri';
import { feedback, Why, type Tone } from '../ui/kit';
import { Hand } from '../ui/icons';
import { Avatar, LevelBadge } from '../ui/primitives';

type Kind = Post['kind'];
type Filter = 'all' | 'soru' | 'gosteri' | 'tesekkur';

const KINDS: Kind[] = ['calisiyorum', 'soru', 'gosteri', 'tesekkur'];
const KIND_TONE: Record<Kind, Tone> = { calisiyorum: 'indigo', soru: 'orange', gosteri: 'green', tesekkur: 'purple' };
const PLACEHOLDER: Record<Kind, string> = {
  calisiyorum: 'Bu hafta ne üzerinde çalışıyorsun? Neredesin, neyi denedin?',
  soru: 'Neyi denedin, nerede takıldın? Somut sorarsan daha hızlı cevap alırsın.',
  gosteri: 'Neyi bitirdin? Ne yaptığını ve ne öğrendiğini kısaca anlat.',
  tesekkur: 'Kime, neden teşekkür ediyorsun? Birinin emeğini görünür kıl.',
};
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Hepsi' },
  { key: 'soru', label: 'Sorular' },
  { key: 'gosteri', label: 'Gösteriler' },
  { key: 'tesekkur', label: 'Teşekkürler' },
];
const EMPTY: Record<Exclude<Filter, 'all'>, string> = { soru: 'Henüz soru yok', gosteri: 'Henüz gösteri yok', tesekkur: 'Henüz teşekkür yok' };
const MAX = 280;
const ORDER = { S3: 0, S2: 1, S1: 2 } as const;

const firstName = (p: Person) => p.name.split(' ')[0];
const tint = (t: Tone) => ({ background: `rgb(var(--${t}-tint))`, color: `rgb(var(--${t}-lip))` }) satisfies CSSProperties;

export default function CommunityPage() {
  const s = useAppState();
  const me = currentMe(s);
  const [filter, setFilter] = useState<Filter>('all');
  const [kind, setKind] = useState<Kind>('calisiyorum');
  const taRef = useRef<HTMLTextAreaElement>(null);
  // Posts present at first paint stagger in; anything added later drops in at the top.
  const initial = useRef(new Set(s.posts.map((p) => p.id)));
  const list = useMemo(
    () => [...s.posts].filter((p) => filter === 'all' || p.kind === filter).sort((a, b) => b.at.localeCompare(a.at)),
    [s.posts, filter],
  );

  const compose = (k: Kind) => {
    setKind(k);
    taRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    taRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="mx-auto max-w-[600px]">
      <header>
        <h1 className="h-page">Topluluk</h1>
        <p className="lead mt-1">Çalıştığını göster, takıldığını sor, birinin emeğine teşekkür et.</p>
        <div className="-ml-2 mt-1">
          <XpWhy />
        </div>
      </header>

      <Composer s={s} me={me} kind={kind} setKind={setKind} taRef={taRef} />
      <Helpers s={s} />

      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="h-sec">Akış</h2>
      </div>
      <div className="scrollbar-none -mx-4 mt-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="seg" role="group" aria-label="Akışı filtrele">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)} className="whitespace-nowrap">
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="mt-5">
          <EmptyStateFilter filter={filter} onCompose={compose} />
        </div>
      ) : (
        <ul className="mt-5 space-y-4">
          {list.map((p, i) => (
            <PostCard key={p.id} s={s} post={p} me={me} index={i} fresh={!initial.current.has(p.id)} />
          ))}
        </ul>
      )}

      <Rules showNiri={list.length > 0} />
    </div>
  );
}

function XpWhy() {
  return (
    <Why title="Topluluk XP’yi nasıl etkiler?" label="Topluluk XP’yi nasıl etkiler?">
      <div className="space-y-3 text-[15px] font-bold text-ink-2">
        <p>Topluluk sohbet için değil, birbirine yardım için. Bu yüzden paylaşmak ve destek almak çok az XP verir; ilerlemen sayılmaz.</p>
        <ul className="space-y-2">
          <li className="rounded-[14px] bg-bg-2 p-3">
            <b className="text-ink">Paylaşmak:</b> günde bir paylaşım <b className="num text-gold-ink">+{XP.post} XP</b>. Seri ya da haftalık hedef ilerlemez.
          </li>
          <li className="rounded-[14px] bg-bg-2 p-3">
            <b className="text-ink">Destek almak:</b> her destek yazara <b className="num text-gold-ink">+{XP.support} XP</b>. Bu da ilerleme sayılmaz.
          </li>
          <li className="rounded-[14px] bg-green-tint p-3">
            <b className="text-green-lip">İşe yarayan cevap:</b> soran “İşe yaradı” derse yanıtlayan <b className="num text-gold-ink">+{XP.helpful} XP</b> kazanır ve o gün üretim günü sayılır. Hedefine ve serine yazılır.
          </li>
        </ul>
        <p className="text-ink-3">Günlük toplam en fazla {XP.dailyCap} XP. XP için paylaşım yapmanın anlamı yok: yalnız gerçekten işe yarayan yardım öne geçer.</p>
      </div>
    </Why>
  );
}

// ---------------------------------------------------------------- composer

function Composer({
  s,
  me,
  kind,
  setKind,
  taRef,
}: {
  s: State;
  me: Person;
  kind: Kind;
  setKind: (k: Kind) => void;
  taRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const [text, setText] = useState('');
  const [evId, setEvId] = useState<string | null>(null);
  const [pick, setPick] = useState(false);
  const evidence = useMemo(
    () => [...me.evidence].sort((a, b) => ORDER[a.level] - ORDER[b.level] || Date.parse(b.producedAt) - Date.parse(a.producedAt)),
    [me.evidence],
  );
  const chosen = evidence.find((e) => e.id === evId);
  const empty = text.trim().length === 0;

  const send = () => {
    if (empty) return;
    const today = dayKey(Date.now());
    const firstToday = !s.posts.some((p) => p.personId === me.id && dayKey(p.at) === today);
    actions.addPost(me.id, kind, text.trim(), chosen?.id);
    setText('');
    setEvId(null);
    setPick(false);
    feedback({
      tone: 'good',
      title: 'Paylaştın',
      text: firstToday ? `Günün ilk paylaşımı: +${XP.post} XP. Topluluk görecek.` : 'Topluluk görecek.',
    });
  };

  return (
    <section className="card mt-6 p-5" aria-labelledby="yeni">
      <div className="flex items-center gap-3">
        <Avatar person={me} size={40} />
        <h2 id="yeni" className="h-sec">
          Ne paylaşmak istersin?
        </h2>
      </div>
      <div className="seg mt-4 !grid w-full grid-cols-2 sm:grid-cols-4" role="group" aria-label="Paylaşım türü">
        {KINDS.map((k) => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className="!px-2 text-center !text-[13px] leading-tight">
            {POST_KIND[k]}
          </button>
        ))}
      </div>
      <label htmlFor="paylasim" className="sr-only">
        Paylaşımın
      </label>
      <textarea
        id="paylasim"
        ref={taRef}
        value={text}
        maxLength={MAX}
        rows={3}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && send()}
        placeholder={PLACEHOLDER[kind]}
        className="field mt-3 min-h-[96px] resize-none"
      />

      <AnimatePresence initial={false}>
        {pick && (
          <motion.ul
            className="mt-3 max-h-60 space-y-2 overflow-auto pb-1"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-label="Kanıtların"
          >
            {evidence.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => {
                    setEvId(e.id);
                    setPick(false);
                  }}
                  className="card-press flex w-full items-center gap-3 p-3 text-left"
                >
                  <span className="min-w-0 flex-1 truncate text-[15px] font-extrabold text-ink">{e.title}</span>
                  <LevelBadge level={e.level} />
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        {chosen ? (
          <span className="chip min-w-0 max-w-full !py-1 !pl-1 !pr-1.5">
            <LevelBadge level={chosen.level} />
            <span className="truncate font-extrabold">{chosen.title}</span>
            <button type="button" onClick={() => setEvId(null)} aria-label="Kanıtı kaldır" className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-3 hover:bg-bg-3">
              <X className="h-4 w-4" strokeWidth={3} />
            </button>
          </span>
        ) : evidence.length ? (
          <button type="button" className="btn-quiet btn-sm !px-2" onClick={() => setPick((o) => !o)} aria-expanded={pick}>
            <Plus className="h-4 w-4" strokeWidth={3} />
            Kanıt ekle
          </button>
        ) : (
          <a href="/kanit-bagla" className="btn-quiet btn-sm !px-2">
            Önce kanıt bağla
          </a>
        )}
        <span className={`num ml-auto text-[13px] font-extrabold ${text.length > MAX - 20 ? 'text-orange-ink' : 'text-ink-3'}`} aria-live="polite">
          {text.length}/{MAX}
        </span>
        <button type="button" className="btn-primary" disabled={empty} onClick={send}>
          Paylaş
        </button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- helpers

function Helpers({ s }: { s: State }) {
  const top = helpers(s).slice(0, 3);
  return (
    <section className="card mt-4 p-5" aria-labelledby="yardimcilar">
      <div className="flex items-center justify-between gap-3">
        <h2 id="yardimcilar" className="h-sec">
          Bu haftanın yardımcıları
        </h2>
        <Why title="Yardımcılar nasıl seçiliyor?">
          <p className="text-[15px] font-bold text-ink-2">Bu hafta bir soruya cevap verip soranın “İşe yaradı” dediği kişiler. Sıralama işe yarayan cevap sayısıdır; beğeni ya da takipçi sayılmaz.</p>
        </Why>
      </div>
      {top.length === 0 ? (
        <p className="mt-2 text-[15px] font-bold text-ink-3">Bu hafta henüz işe yarayan cevap yok. Akıştaki bir soruya cevap vererek ilki sen ol.</p>
      ) : (
        <ul className="mt-3 space-y-1">
          {top.map(({ personId, n }) => {
            const p = byId.person(s, personId);
            if (!p) return null;
            return (
              <li key={personId}>
                <a href={`/profil/${p.handle}`} className="-mx-2 flex items-center gap-3 rounded-[14px] px-2 py-2 transition-colors hover:bg-bg-2">
                  <Avatar person={p} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-black text-ink">{p.name}</span>
                    <span className="block truncate text-[14px] font-bold text-ink-3">{p.headline.split(' · ').pop()}</span>
                  </span>
                  <span className="pill shrink-0" style={tint('green')}>
                    <Check className="h-4 w-4" strokeWidth={3.5} />
                    {n} işe yaradı
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- feed

function PostCard({ s, post, me, index, fresh }: { s: State; post: Post; me: Person; index: number; fresh: boolean }) {
  const reduce = useReducedMotion();
  const author = byId.person(s, post.personId);
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState('');
  if (!author) return null;

  const mine = author.id === me.id;
  const supported = post.supports.includes(me.id);
  const ev: Evidence | undefined = post.evidenceId ? author.evidence.find((e) => e.id === post.evidenceId) : undefined;
  const replies = [...post.replies].sort((a, b) => a.at.localeCompare(b.at));
  const tone = KIND_TONE[post.kind];

  const support = () => {
    actions.toggleSupport(post.id, me.id);
    feedback(
      supported
        ? { tone: 'info', title: 'Desteğini geri aldın' }
        : { tone: 'good', title: 'Destek verdin', text: `${firstName(author)} emeğinin görüldüğünü bilecek.` },
    );
  };

  const send = () => {
    const t = reply.trim();
    if (!t) return;
    actions.reply(post.id, me.id, t);
    setReply('');
    setReplying(false);
    feedback({
      tone: 'good',
      title: 'Yanıtın gönderildi',
      text: mine ? 'Yanıtın eklendi.' : `${firstName(author)} “İşe yaradı” derse +${XP.helpful} XP kazanırsın.`,
    });
  };

  return (
    <motion.li
      layout="position"
      initial={reduce ? false : fresh ? { opacity: 0, y: -18, scale: 0.97 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={fresh ? { type: 'spring', stiffness: 380, damping: 26 } : { delay: Math.min(index, 5) * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <article className="card p-5" aria-label={`${author.name}: ${POST_KIND[post.kind]}`}>
        <div className="flex items-center gap-3">
          <a href={`/profil/${author.handle}`} aria-label={`${author.name} profili`}>
            <Avatar person={author} size={44} />
          </a>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-black text-ink">
              <a href={`/profil/${author.handle}`} className="hover:underline">
                {author.name}
              </a>
              {mine && <span className="ml-1.5 text-[13px] font-extrabold text-ink-3">sen</span>}
            </p>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-bold text-ink-3">
              <span className="pill !px-2 !py-0.5" style={tint(tone)}>
                {POST_KIND[post.kind]}
              </span>
              <span>{relTime(post.at)}</span>
            </p>
          </div>
        </div>

        <p className="mt-3 whitespace-pre-line break-words text-[16px] font-semibold leading-relaxed text-ink-2">{post.text}</p>

        {ev && (
          <a href={`/profil/${author.handle}`} className="chip mt-3 min-w-0 max-w-full !py-1 !pl-1 !pr-3 hover:bg-bg-2">
            <LevelBadge level={ev.level} />
            <span className="truncate font-extrabold">{ev.title}</span>
          </a>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {mine ? (
            <span className="inline-flex min-h-[38px] items-center gap-1.5 pr-2 text-[14px] font-extrabold" style={{ color: `rgb(var(--${post.supports.length ? 'purple-lip' : 'ink-4'}))` }}>
              <Hand size={22} on={post.supports.length > 0} />
              {post.supports.length ? `${post.supports.length} destek` : 'Henüz destek yok'}
            </span>
          ) : (
            <button
              type="button"
              aria-pressed={supported}
              onClick={support}
              className={`btn-line btn-sm ${supported ? '!border-purple hover:!bg-purple-tint' : ''}`}
              style={supported ? ({ '--key': 'var(--purple-tint)', '--key-lip': 'var(--purple)', '--key-ink': 'var(--purple-lip)' } as CSSProperties) : undefined}
            >
              <motion.span className="grid" initial={false} animate={{ scale: supported ? [1, 1.45, 1] : 1, rotate: supported ? [0, -14, 0] : 0 }} transition={{ duration: 0.35 }}>
                <Hand size={22} on={supported} />
              </motion.span>
              Destek
              <span className="num">{post.supports.length}</span>
            </button>
          )}
          <button type="button" className="btn-quiet btn-sm" aria-expanded={replying} onClick={() => setReplying((o) => !o)}>
            <MessageCircle className="h-[18px] w-[18px]" strokeWidth={3} />
            Yanıtla
            {replies.length > 0 && <span className="num">{replies.length}</span>}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {replying && (
            <motion.div className="overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
              <div className="pt-3">
                <label htmlFor={`yanit-${post.id}`} className="sr-only">
                  Yanıtın
                </label>
                <textarea
                  id={`yanit-${post.id}`}
                  autoFocus
                  value={reply}
                  maxLength={MAX}
                  rows={2}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && send()}
                  placeholder={post.kind === 'soru' ? 'Bildiğini paylaş: ne denedin, ne işe yaradı?' : `${firstName(author)} için bir yanıt yaz`}
                  className="field min-h-[72px] resize-none"
                />
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button type="button" className="btn-quiet btn-sm" onClick={() => setReplying(false)}>
                    Vazgeç
                  </button>
                  <button type="button" className="btn-primary btn-sm" disabled={reply.trim().length === 0} onClick={send}>
                    Gönder
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {replies.length > 0 && (
          <ul className="mt-4 space-y-2 border-t-2 border-line pt-4">
            {replies.map((r) => (
              <ReplyRow key={r.id} s={s} post={post} reply={r} me={me} asker={mine} />
            ))}
          </ul>
        )}
      </article>
    </motion.li>
  );
}

function ReplyRow({ s, post, reply, me, asker }: { s: State; post: Post; reply: Reply; me: Person; asker: boolean }) {
  const p = byId.person(s, reply.personId);
  if (!p) return null;
  const mark = () => {
    actions.markHelpful(post.id, reply.id);
    feedback(
      reply.helpful
        ? { tone: 'info', title: 'İşareti geri aldın' }
        : { tone: 'good', title: 'Teşekkür ettin', text: `${firstName(p)} yanıtı için +${XP.helpful} XP kazandı.` },
    );
  };
  return (
    <li className={`flex gap-3 rounded-[14px] px-3 py-2.5 transition-colors ${reply.helpful ? 'bg-green-tint' : ''}`}>
      <a href={`/profil/${p.handle}`} aria-label={`${p.name} profili`} className="pt-0.5">
        <Avatar person={p} size={32} />
      </a>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-ink-3">
          <a href={`/profil/${p.handle}`} className="font-black text-ink hover:underline">
            {p.name}
          </a>
          {p.id === me.id && <span className="ml-1.5 font-extrabold">sen</span>} · {relTime(reply.at)}
        </p>
        <p className="mt-0.5 whitespace-pre-line break-words text-[15px] font-semibold leading-relaxed text-ink-2">{reply.text}</p>
        {(reply.helpful || (asker && p.id !== me.id)) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {reply.helpful ? (
              <span className="pill bg-green-lip text-white pop">
                <Check className="h-4 w-4" strokeWidth={3.5} />
                İşe yaradı · +{XP.helpful} XP yanıtlayana
              </span>
            ) : (
              <button type="button" className="btn-green btn-sm" onClick={mark}>
                İşe yaradı
              </button>
            )}
            {reply.helpful && asker && (
              <button type="button" className="btn-quiet btn-sm !px-2" onClick={mark}>
                Geri al
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------- empty + rules

function EmptyStateFilter({ filter, onCompose }: { filter: Filter; onCompose: (k: Kind) => void }) {
  const target: Kind = filter === 'all' ? 'calisiyorum' : filter;
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <Niri mood="think" size={96} />
      <p className="mt-4 text-[18px] font-black text-ink">{filter === 'all' ? 'Akış sessiz' : EMPTY[filter]}</p>
      <p className="mt-1 max-w-sm text-[15px] text-ink-3">İlkini sen paylaş: bildiğin ya da takıldığın bir şey yaz, birileri mutlaka cevap verir.</p>
      <button type="button" className="btn-primary mt-5" onClick={() => onCompose(target)}>
        Paylaşım yaz
      </button>
    </div>
  );
}

const RULES: { tone: Tone; title: string; text: string }[] = [
  { tone: 'purple', title: 'Destekle', text: 'İşine yarayan ya da emek gördüğün bir paylaşıma destek ver. Tek dokunuş yeter.' },
  { tone: 'indigo', title: 'Somut sor', text: 'Neyi denedin, nerede takıldın, ne bekliyordun? Somut soru, somut cevap getirir.' },
  { tone: 'green', title: 'Emeğe teşekkür et', text: 'Cevap işine yaradıysa “İşe yaradı” de. Yanıtlayan XP kazanır, bir sonraki soruya da cevap gelir.' },
];

function Rules({ showNiri }: { showNiri: boolean }) {
  return (
    <section className="card mt-10 p-5" aria-labelledby="davranis">
      <div className="flex items-center justify-between gap-3">
        <h2 id="davranis" className="h-sec">
          Burada nasıl davranırız
        </h2>
        {showNiri && <Niri mood="wave" size={72} />}
      </div>
      <ol className="mt-3 space-y-4">
        {RULES.map((r, i) => (
          <li key={r.title} className="flex gap-3">
            <span className="num grid h-8 w-8 shrink-0 place-items-center rounded-full text-[15px] font-black text-white" style={{ background: `rgb(var(--${r.tone}))`, boxShadow: `0 3px 0 rgb(var(--${r.tone}-lip))` }}>
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-[16px] font-black text-ink">{r.title}</p>
              <p className="text-[15px] font-bold text-ink-3">{r.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-5 text-[13px] font-bold text-ink-3">Kişiler ve paylaşımlar kurgusal demo verisidir.</p>
    </section>
  );
}
