import { useState } from 'react';
import type { Evidence, Person } from '../../lib/types.ts';
import { SOURCE } from '../../lib/labels.ts';
import { fmtDate } from '../../lib/format.ts';
import { skillLabel } from '../../lib/skills.ts';
import type { Conflict } from '../../lib/engine/match.ts';
import { actions, useView } from '../../lib/store.ts';
import { LevelBadge, LevelGlyph, Modal } from '../ui/primitives.tsx';

export function EvidenceItem({
  ev,
  person,
  conflict,
  ownerHandle,
  fresh = false,
}: {
  ev: Evidence;
  person: Person;
  conflict?: Conflict;
  ownerHandle?: string;
  fresh?: boolean;
}) {
  const { persona } = useView();
  const [disputing, setDisputing] = useState(false);
  const [reason, setReason] = useState('');
  const border = ev.level === 'S3' ? 'border-l-s3' : ev.level === 'S2' ? 'border-l-s2' : 'border-l-s1';

  return (
    <article className={`card border-l-[3px] ${border} p-5 ${fresh ? 'rise ring-2 ring-s3/40' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <LevelBadge level={ev.level} long />
        <span className="chip">{SOURCE[ev.source]}</span>
        {fresh && <span className="rounded-md bg-s3 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white">yeni</span>}
        <span className="ml-auto font-mono text-[11px] text-ink-3">{fmtDate(ev.producedAt)}</span>
      </div>
      <h3 className="mt-3 text-[16px] font-semibold leading-snug">
        {ev.url ? (
          <a href={ev.url} target="_blank" rel="noreferrer" className="hover:underline">
            {ev.title}
          </a>
        ) : (
          ev.title
        )}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{ev.summary}</p>

      {(ev.metrics?.length || ev.skills.length) > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          {ev.metrics?.map((m) => (
            <span key={m.label} className="num text-[12px] text-ink-2">
              <span className="font-semibold text-ink">{m.value}</span> {m.label}
            </span>
          ))}
          <span className="flex flex-wrap gap-1">
            {ev.skills.map((s) => (
              <span key={s} className="chip !text-[11px]">
                {skillLabel(s)}
              </span>
            ))}
          </span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-3 text-[12px] text-ink-3">
        {ev.level === 'S1' ? (
          <span>Kişisel beyan · doğrulama bekliyor</span>
        ) : (
          <span className="flex items-center gap-1.5">
            <LevelGlyph level={ev.level} size={11} />
            {ev.verifier}
            {ev.verifiedAt && <> · {fmtDate(ev.verifiedAt)}</>}
          </span>
        )}
        {!ev.dispute && !conflict && persona === 'org' && (
          <button onClick={() => setDisputing(true)} className="ml-auto text-ink-3 underline decoration-line-2 underline-offset-2 hover:text-danger">
            İtiraz et
          </button>
        )}
      </div>

      {conflict && (
        <p className="mt-3 rounded-md border border-danger/30 bg-danger/8 px-3 py-2 text-[13px] text-danger">
          <strong className="font-semibold">Kopya eser işareti:</strong> aynı eser{' '}
          {ownerHandle ? (
            <a href={`/profil/${ownerHandle}`} className="underline">
              @{ownerHandle}
            </a>
          ) : (
            'başka bir profil'
          )}{' '}
          tarafından daha güçlü doğrulamayla sahiplenilmiş. Bu iddia eşleşmede sayılmıyor.
        </p>
      )}
      {ev.dispute && (
        <div className="mt-3 rounded-md border border-warn/40 bg-warn/8 px-3 py-2 text-[13px]">
          <p className="text-warn">
            <strong className="font-semibold">İtiraz kaydı</strong> · {ev.dispute.by} · {fmtDate(ev.dispute.at)}
          </p>
          <p className="mt-0.5 text-ink-2">“{ev.dispute.reason}” — inceleme sürerken eşleşme ağırlığı yarıya indirildi.</p>
          {persona === 'org' && (
            <button className="mt-1 text-xs text-ink-3 underline" onClick={() => actions.withdrawDispute(person.id, ev.id)}>
              İtirazı geri çek
            </button>
          )}
        </div>
      )}

      <Modal open={disputing} onClose={() => setDisputing(false)} title="Bu iddiaya itiraz et">
        <p className="text-sm text-ink-2">
          İtirazlar herkese açık kaydedilir ve gerekçesiz itiraz kabul edilmez. İnceleme sürerken iddianın eşleşme ağırlığı yarıya iner; kişi kanıt ekleyerek yanıt verebilir.
        </p>
        <label className="label mt-4" htmlFor="reason">
          Gerekçe
        </label>
        <textarea id="reason" className="field min-h-24" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ör. Bu depo bir kursun hazır şablonundan çatallanmış görünüyor." />
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-quiet" onClick={() => setDisputing(false)}>
            Vazgeç
          </button>
          <button
            className="btn-ink"
            disabled={reason.trim().length < 10}
            onClick={() => {
              actions.dispute(person.id, ev.id, reason.trim(), 'Kurum incelemesi');
              setDisputing(false);
              setReason('');
            }}
          >
            İtirazı kaydet
          </button>
        </div>
      </Modal>
    </article>
  );
}
