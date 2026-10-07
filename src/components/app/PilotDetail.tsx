import { useMemo, useState } from 'react';
import type { LogEntry, Milestone, Pilot } from '../../lib/types.ts';
import { actions, byId, lastActivity, SILENCE_DAYS, useAppState, useView } from '../../lib/store.ts';
import { shortHash, verifyChain } from '../../lib/engine/ledger.ts';
import { PILOT_STATUS } from '../../lib/labels.ts';
import { daysSince, fmtDate, fmtDateTime, relTime } from '../../lib/format.ts';
import { Avatar, Empty, Meter, Modal, OrgMark, Stat, StatusIcon } from '../ui/primitives.tsx';
import { SealMoment } from './SealMoment.tsx';

const KIND: Record<LogEntry['kind'], string> = {
  open: 'açılış',
  update: 'güncelleme',
  decision: 'karar',
  blocker: 'engel',
  submit: 'teslim',
  approve: 'onay',
  revise: 'revizyon',
  close: 'kapanış',
  nudge: 'hatırlatma',
};
const ACTOR = { person: 'Yetenek', org: 'Kurum', system: 'Sistem' } as const;

export default function PilotDetail({ id }: { id: string }) {
  const s = useAppState();
  const pilot = byId.pilot(s, id);
  if (!pilot)
    return (
      <div className="wrap py-24">
        <Empty title="Bu pilot bulunamadı">
          <a className="underline" href="/pilotlar">
            Pilot Defteri’ne dön
          </a>
        </Empty>
      </div>
    );
  return <Detail pilot={pilot} />;
}

function Detail({ pilot }: { pilot: Pilot }) {
  const s = useAppState();
  const { persona } = useView();
  const org = byId.org(s, pilot.orgId)!;
  const person = byId.person(s, pilot.personId)!;
  const need = byId.need(s, pilot.needId)!;
  const approved = pilot.milestones.filter((m) => m.state === 'approved').length;
  const waiting = pilot.milestones.filter((m) => m.state === 'submitted');
  const blockers = pilot.log.filter((e) => e.kind === 'blocker').length;
  const silent = pilot.status === 'active' ? daysSince(lastActivity(pilot)) : 0;
  const active = pilot.status === 'active';

  const [act, setAct] = useState<{ m: Milestone; mode: 'submit' | 'approve' | 'revise' } | null>(null);
  const [closing, setClosing] = useState(false);
  const [seal, setSeal] = useState(false);

  return (
    <>
      <header className="band">
        <div className="wrap py-10 md:py-12">
          <a href="/pilotlar" className="text-sm text-ink-3 hover:text-ink">
            ← Pilot Defteri
          </a>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
            <OrgMark name={org.name} size={32} />
            <span className="font-semibold">{org.name}</span>
            <span className="text-ink-3">×</span>
            <Avatar person={person} size={32} reveal />
            <a href={`/profil/${person.handle}`} className="font-semibold hover:underline">
              {person.name}
            </a>
            <span
              className={`rounded-md border px-2 py-0.5 font-mono text-[11px] ${
                pilot.status === 'active' ? 'border-signal/40 bg-signal/8 text-signal' : pilot.status === 'succeeded' ? 'border-s3/40 bg-s3/8 text-s3' : 'border-line-2 text-ink-2'
              }`}
            >
              {PILOT_STATUS[pilot.status]}
            </span>
          </div>
          <h1 className="display mt-4 max-w-3xl text-[30px] md:text-[42px]">{pilot.title}</h1>
          <p className="mt-2 text-sm text-ink-3">
            İhtiyaç:{' '}
            <a href={`/ihtiyaclar/${need.id}`} className="underline decoration-line-2 underline-offset-2 hover:text-ink">
              {need.title}
            </a>
          </p>

          <div className="mt-8 grid grid-cols-2 gap-6 border-t border-line pt-6 md:grid-cols-5">
            <Stat label="Kriter" value={`${approved}/${pilot.milestones.length}`} hint="çift onaylı" />
            <Stat label="Bekleyen onay" value={waiting.length} hint={waiting.length ? 'kurum tarafında' : 'yok'} />
            <Stat label="Engel kaydı" value={blockers} />
            <Stat label="Son etkinlik" value={relTime(lastActivity(pilot))} />
            <Stat label="Başlangıç" value={fmtDate(pilot.startedAt)} hint={pilot.closedAt ? `kapanış ${fmtDate(pilot.closedAt)}` : undefined} />
          </div>
          <Meter value={approved / Math.max(1, pilot.milestones.length)} tone={pilot.status === 'failed' ? 'warn' : 's3'} className="mt-6" />
        </div>
      </header>

      <div className="wrap grid gap-8 py-10 lg:grid-cols-[1fr_380px]">
        <section>
          {silent >= SILENCE_DAYS && (
            <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-warn/50 bg-warn/8 p-4">
              <span className="relative grid h-3 w-3 place-items-center">
                <span className="ping-soft absolute inset-0 rounded-full bg-warn" />
                <span className="relative h-2 w-2 rounded-full bg-warn" />
              </span>
              <p className="flex-1 text-sm">
                <strong className="font-semibold">Sessizlik göstergesi:</strong> {silent} gündür güncelleme yok. Pilotların en büyük ölüm sebebi başarısızlık değil, sessizce terk
                edilmedir.
                {waiting.length > 0 && ' Top kurumda: teslim edilen kilometre taşı onay bekliyor.'}
              </p>
              <button className="btn-line btn-sm" onClick={() => actions.addLog(pilot.id, persona, 'nudge', `Hatırlatma gönderildi: ${silent} gündür sessiz.`)}>
                İki tarafa hatırlat
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="eyebrow">06 · Şeffaf iş birliği takibi</p>
              <h2 className="mt-1 text-2xl font-semibold">Kilometre taşları</h2>
            </div>
            <p className="text-sm text-ink-3">
              Rolün: <strong className="text-ink">{persona === 'org' ? `Kurum · ${org.name}` : `Yetenek · ${person.name}`}</strong>
            </p>
          </div>
          <p className="mt-2 text-sm text-ink-3">Kanvastaki başarı kriterleri, pilot açıldığı anda kilometre taşına dönüştü. Hedef sonradan uydurulamaz.</p>

          <ol className="mt-5 space-y-3">
            {pilot.milestones.map((m, i) => (
              <MilestoneRow key={m.id} m={m} i={i} pilot={pilot} persona={persona} onAct={(mode) => setAct({ m, mode })} personHandle={person.handle} />
            ))}
          </ol>

          {pilot.closure && (
            <div className={`mt-6 rounded-xl border p-5 ${pilot.status === 'succeeded' ? 'border-s3/40 bg-s3/5' : 'border-line-2 bg-raised'}`}>
              <p className="eyebrow">Adil kapanış</p>
              <p className="mt-2 font-semibold">{pilot.closure.reason}</p>
              <p className="mt-1 text-sm text-ink-2">{pilot.closure.summary}</p>
              {pilot.status === 'failed' && (
                <p className="mt-3 text-xs text-ink-3">
                  Başarısız pilot da gerekçesiyle kapanır. Onaylanmış kilometre taşları kişinin profilinde kanıt olarak kalır; şeffaf başarısızlık kaydı cevapsız kalmış bir süreçten daha
                  değerlidir.
                </p>
              )}
              {pilot.closure.publicConsent.person && pilot.closure.publicConsent.org && (
                <a href={`/kart/${pilot.id}`} className="btn-ink btn-sm mt-4">
                  Kamuya açık özet kartı →
                </a>
              )}
            </div>
          )}

          {active && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-line-2 p-4">
              <p className="text-sm text-ink-2">Pilot bitti mi, durdu mu? Sessizce bırakmak yerine gerekçesiyle kapatın.</p>
              <button className="btn-line btn-sm" onClick={() => setClosing(true)}>
                Pilotu kapat
              </button>
            </div>
          )}
        </section>

        <Ledger pilot={pilot} persona={persona} />
      </div>

      <Modal
        open={!!act}
        onClose={() => setAct(null)}
        title={act?.mode === 'submit' ? 'Kilometre taşını teslim et' : act?.mode === 'approve' ? 'Kurum onayı' : 'Revizyon iste'}
      >
        {act && (
          <ActForm
            pilot={pilot}
            m={act.m}
            mode={act.mode}
            onDone={(approved) => {
              setAct(null);
              if (approved) setSeal(true);
            }}
          />
        )}
      </Modal>
      <SealMoment open={seal} name={person.name} href={`/profil/${person.handle}`} onClose={() => setSeal(false)} />
      <Modal open={closing} onClose={() => setClosing(false)} title="Pilotu gerekçesiyle kapat" wide>
        {closing && <CloseForm pilot={pilot} onDone={() => setClosing(false)} />}
      </Modal>
    </>
  );
}

function Stamp({ who, at }: { who: string; at?: string }) {
  return (
    <div className={`rounded-lg border px-3 py-2 text-center ${at ? 'border-s3/50 bg-s3/8' : 'border-dashed border-line-2'}`}>
      <p className={`font-mono text-[10px] uppercase tracking-wider ${at ? 'text-s3' : 'text-ink-3'}`}>
        <StatusIcon kind={at ? 'ok' : 'pending'} className="!h-3 !w-3" /> {who}
      </p>
      <p className="num mt-0.5 text-[11px] text-ink-3">{at ? fmtDateTime(at) : 'bekliyor'}</p>
    </div>
  );
}

function MilestoneRow({
  m,
  i,
  pilot,
  persona,
  onAct,
  personHandle,
}: {
  m: Milestone;
  i: number;
  pilot: Pilot;
  persona: 'org' | 'person';
  onAct: (mode: 'submit' | 'approve' | 'revise') => void;
  personHandle: string;
}) {
  const overdue = m.state !== 'approved' && Date.parse(m.due) < Date.now();
  const active = pilot.status === 'active';
  const justApproved = m.approvals.org && Date.now() - Date.parse(m.approvals.org) < 5 * 60_000;
  return (
    <li className={`card relative overflow-hidden p-5 ${m.state === 'approved' ? 'border-s3/40' : m.state === 'submitted' ? 'border-warn/50' : ''}`}>
      <div className="flex flex-wrap items-start gap-4">
        <span className="num pt-0.5 text-sm text-ink-3">K{i + 1}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold leading-snug">{m.title}</p>
          <p className={`mt-1 font-mono text-[11px] ${overdue ? 'text-danger' : 'text-ink-3'}`}>
            hedef {fmtDate(m.due)}
            {overdue && ' · gecikmede'}
          </p>
          {m.submittedNote && (
            <p className="mt-2 rounded-md bg-sunken px-3 py-2 text-sm text-ink-2">
              <span className="font-semibold text-ink">Teslim notu:</span> {m.submittedNote}
            </p>
          )}
        </div>
        {m.state === 'approved' && (
          <span className={`${justApproved ? 'stamp-in' : 'rotate-[-8deg]'} rounded-md border-2 border-s3 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-s3`}>
            çift onay
          </span>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:max-w-sm">
        <Stamp who="Yetenek" at={m.approvals.person} />
        <Stamp who="Kurum" at={m.approvals.org} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {active && m.state === 'open' && persona === 'person' && (
          <button className="btn-primary btn-sm" onClick={() => onAct('submit')}>
            Teslim et
          </button>
        )}
        {active && m.state === 'open' && persona === 'org' && <span className="text-sm text-ink-3">Yetenek tarafının teslimi bekleniyor.</span>}
        {active && m.state === 'submitted' && persona === 'org' && (
          <>
            <button className="btn-primary btn-sm" onClick={() => onAct('approve')}>
              Onayla
            </button>
            <button className="btn-line btn-sm" onClick={() => onAct('revise')}>
              Revizyon iste
            </button>
          </>
        )}
        {active && m.state === 'submitted' && persona === 'person' && <span className="text-sm text-ink-3">Teslim edildi; kurum onayı bekleniyor. Rolü “Kurum”a çevirip onaylayabilirsin.</span>}
        {m.state === 'approved' && (
          <a href={`/profil/${personHandle}`} className="text-sm text-s3 underline decoration-s3/40 underline-offset-2">
            → Profilde S3 kanıt olarak işlendi
          </a>
        )}
      </div>
    </li>
  );
}

function ActForm({ pilot, m, mode, onDone }: { pilot: Pilot; m: Milestone; mode: 'submit' | 'approve' | 'revise'; onDone: (approved?: boolean) => void }) {
  const [note, setNote] = useState('');
  const submit = () => {
    if (mode === 'submit') actions.submitMilestone(pilot.id, m.id, note.trim());
    if (mode === 'approve') actions.approveMilestone(pilot.id, m.id, note.trim());
    if (mode === 'revise') actions.requestRevision(pilot.id, m.id, note.trim());
    onDone(mode === 'approve');
  };
  const placeholder =
    mode === 'submit' ? 'Kanıtı ve ölçümü yazın: ne yapıldı, nasıl ölçüldü, nerede görülebilir?' : mode === 'approve' ? 'Kurum nasıl doğruladı? (isteğe bağlı)' : 'Neyin eksik olduğunu açıkça yazın.';
  return (
    <div>
      <p className="rounded-lg border border-line bg-paper px-3 py-2 text-sm font-medium">{m.title}</p>
      {mode === 'approve' && (
        <p className="mt-3 text-sm text-ink-2">
          Onayınızla kilometre taşı iki taraflı tamamlanır, deftere zaman damgalı ve değiştirilemez olarak yazılır ve kişinin profiline <strong>S3 kurum tasdiki</strong> olarak işlenir.
        </p>
      )}
      <textarea className="field mt-3 min-h-24" value={note} onChange={(e) => setNote(e.target.value)} placeholder={placeholder} />
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-quiet" onClick={() => onDone()}>
          Vazgeç
        </button>
        <button className={mode === 'revise' ? 'btn-ink' : 'btn-primary'} disabled={mode === 'revise' && note.trim().length < 5} onClick={submit}>
          {mode === 'submit' ? 'Teslim et' : mode === 'approve' ? 'Onayla ve deftere yaz' : 'Revizyon iste'}
        </button>
      </div>
    </div>
  );
}

function CloseForm({ pilot, onDone }: { pilot: Pilot; onDone: () => void }) {
  const allMet = pilot.milestones.every((m) => m.state === 'approved');
  const met = pilot.milestones.filter((m) => m.state === 'approved').length;
  const [outcome, setOutcome] = useState<'succeeded' | 'failed'>(allMet ? 'succeeded' : 'failed');
  const [reason, setReason] = useState(allMet ? `${met}/${pilot.milestones.length} başarı kriteri karşılandı.` : '');
  const [summary, setSummary] = useState('');
  const [consent, setConsent] = useState({ person: true, org: true });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ['succeeded', 'Başarıyla', 'Tüm kriterler çift onaylı'],
            ['failed', 'Gerekçesiyle', 'Kriterlerin bir kısmı karşılanmadı'],
          ] as const
        ).map(([k, l, d]) => (
          <button
            key={k}
            disabled={k === 'succeeded' && !allMet}
            onClick={() => setOutcome(k)}
            className={`rounded-lg border p-3 text-left disabled:opacity-40 ${outcome === k ? 'border-ink bg-sunken' : 'border-line'}`}
          >
            <span className="block font-semibold">{l}</span>
            <span className="block text-xs text-ink-3">{d}</span>
          </button>
        ))}
      </div>
      {!allMet && <p className="text-xs text-ink-3">“Başarıyla” kapanış için tüm kilometre taşlarının çift onaylı olması gerekir ({met}/{pilot.milestones.length}).</p>}
      <div>
        <label className="label" htmlFor="reason">
          Gerekçe {outcome === 'failed' && <span className="text-danger">*</span>}
        </label>
        <input id="reason" className="field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ör. Veri erişimi sağlanamadı; 1/3 kriter karşılandı." />
      </div>
      <div>
        <label className="label" htmlFor="summary">
          Kamuya açık özet
        </label>
        <textarea id="summary" className="field min-h-20" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Sonuç, ölçülen değerler ve öğrenilenler." />
      </div>
      <fieldset className="rounded-lg border border-line p-3">
        <legend className="px-1 text-xs text-ink-3">Özet kartının yayımlanması iki tarafın onayını ister</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={consent.person} onChange={(e) => setConsent({ ...consent, person: e.target.checked })} /> Yetenek onaylıyor
        </label>
        <label className="mt-1 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={consent.org} onChange={(e) => setConsent({ ...consent, org: e.target.checked })} /> Kurum onaylıyor
        </label>
      </fieldset>
      <div className="flex justify-end gap-2">
        <button className="btn-quiet" onClick={onDone}>
          Vazgeç
        </button>
        <button
          className="btn-ink"
          disabled={reason.trim().length < 8}
          onClick={() => {
            actions.closePilot(pilot.id, outcome, reason.trim(), summary.trim() || reason.trim(), consent);
            onDone();
          }}
        >
          Kapat ve deftere yaz
        </button>
      </div>
    </div>
  );
}

function Ledger({ pilot, persona }: { pilot: Pilot; persona: 'org' | 'person' }) {
  const [check, setCheck] = useState<null | { at: number; tampered: boolean }>(null);
  const [kind, setKind] = useState<'update' | 'decision' | 'blocker'>('update');
  const [text, setText] = useState('');
  const entries = useMemo(() => {
    if (!check?.tampered) return pilot.log;
    const forged = structuredClone(pilot.log);
    const idx = Math.max(0, forged.length - 3);
    forged[idx].text = `${forged[idx].text} (sonradan değiştirildi)`;
    return forged;
  }, [pilot.log, check]);
  const broken = check ? verifyChain(entries) : -1;

  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <p className="font-semibold">Pilot Defteri</p>
            <p className="font-mono text-[11px] text-ink-3">{pilot.log.length} kayıt · SHA-256 zinciri</p>
          </div>
          {check && (
            <span className={`rounded-md px-2 py-1 font-mono text-[11px] ${broken === -1 ? 'bg-s3/10 text-s3' : 'bg-danger/10 text-danger'}`}>
              <StatusIcon kind={broken === -1 ? 'ok' : 'fail'} /> {broken === -1 ? 'zincir bütün' : `#${broken + 1}’de kırık`}
            </span>
          )}
        </div>
        <ol className="max-h-[480px] divide-y divide-line overflow-auto">
          {[...entries].reverse().map((e, ri) => {
            const idx = entries.length - 1 - ri;
            const bad = broken !== -1 && idx >= broken;
            return (
              <li key={e.id + idx} className={`px-4 py-3 ${bad ? 'bg-danger/6' : ''}`}>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={`rounded px-1.5 py-0.5 font-mono ${e.actor === 'org' ? 'bg-ink text-paper' : e.actor === 'person' ? 'bg-s2/15 text-s2' : 'bg-sunken text-ink-3'}`}>
                    {ACTOR[e.actor]}
                  </span>
                  <span className="font-mono text-ink-3">{KIND[e.kind]}</span>
                  <span className="ml-auto font-mono text-ink-3">{fmtDateTime(e.at)}</span>
                </div>
                <p className="mt-1.5 text-[13.5px] leading-snug">{e.text}</p>
                <p className={`num mt-1 text-[10.5px] ${bad ? 'text-danger' : 'text-ink-3'}`}>
                  #{idx + 1} · {shortHash(e.hash)} ← {shortHash(e.prev)}
                </p>
              </li>
            );
          })}
        </ol>
        <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
          <button className="btn-line btn-sm" onClick={() => setCheck({ at: Date.now(), tampered: false })}>
            Zinciri doğrula
          </button>
          <button className="btn-quiet btn-sm" onClick={() => setCheck({ at: Date.now(), tampered: true })} title="Yalnız bu ekranda, kaydetmeden">
            Kurcalamayı dene
          </button>
          {check?.tampered && (
            <button className="btn-quiet btn-sm" onClick={() => setCheck(null)}>
              Geri al
            </button>
          )}
        </div>
        {check?.tampered && (
          <p className="border-t border-line bg-danger/5 px-4 py-2 text-xs text-ink-2">
            Bir geçmiş kaydın metni yalnız bu ekranda değiştirildi. Sonraki tüm özetler artık tutmuyor: değişiklik herkes tarafından görülebilir.
          </p>
        )}
        {pilot.status === 'active' && (
          <form
            className="border-t border-line p-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              actions.addLog(pilot.id, persona, kind, text.trim());
              setText('');
            }}
          >
            <p className="text-xs font-semibold text-ink-2">Deftere yaz · {persona === 'org' ? 'Kurum' : 'Yetenek'} olarak</p>
            <div className="mt-2 flex gap-2">
              <select className="field !w-32 !py-2 text-sm" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} aria-label="Kayıt türü">
                <option value="update">Güncelleme</option>
                <option value="decision">Karar</option>
                <option value="blocker">Engel</option>
              </select>
              <input className="field !py-2 text-sm" value={text} onChange={(e) => setText(e.target.value)} placeholder="Kısa ve ölçülebilir yaz" />
            </div>
            <p className="hint">Kayıtlar düzenlenemez ve silinemez; yalnız yeni kayıt eklenebilir.</p>
          </form>
        )}
      </div>
    </aside>
  );
}
