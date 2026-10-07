// One piece of evidence: what it is, how it was verified, and what is disputed.

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { Evidence, Person } from '../../lib/types.ts';
import { SOURCE } from '../../lib/labels.ts';
import { fmtDate } from '../../lib/format.ts';
import { skillLabel } from '../../lib/skills.ts';
import type { Conflict } from '../../lib/engine/match.ts';
import { actions, useView } from '../../lib/store.ts';
import { feedback } from '../ui/kit';
import { LevelBadge, LevelGlyph, Modal } from '../ui/primitives.tsx';

export function EvidenceItem({
  ev,
  person,
  conflict,
  ownerHandle,
  fresh = false,
  owner = false,
}: {
  ev: Evidence;
  person: Person;
  conflict?: Conflict;
  ownerHandle?: string;
  fresh?: boolean;
  /** The viewer is the person this evidence belongs to. */
  owner?: boolean;
}) {
  const { persona } = useView();
  const [disputing, setDisputing] = useState(false);
  const [reason, setReason] = useState('');
  const org = persona === 'org';

  return (
    <article className={`card p-4 sm:p-5 ${fresh ? 'rise !border-indigo/50' : ''} ${ev.dispute ? '!border-red/50' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <LevelBadge level={ev.level} />
        {ev.source !== 'claim' && <span className="chip">{SOURCE[ev.source]}</span>}
        {fresh && <span className="pill bg-indigo !py-0.5 text-white">Yeni</span>}
        {ev.dispute && <span className="pill bg-red-tint !py-0.5 text-red-lip">İtiraz var</span>}
        <span className="ml-auto text-[13px] font-bold text-ink-3">{fmtDate(ev.producedAt)}</span>
      </div>

      <h3 className="mt-3 text-[17px] font-black leading-snug text-ink">
        {ev.url ? (
          <a href={ev.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1.5 hover:underline">
            {ev.title}
            <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-ink-3" strokeWidth={3} aria-label="Yeni sekmede açılır" />
          </a>
        ) : (
          ev.title
        )}
      </h3>
      <p className="mt-1 text-[15px] font-semibold leading-relaxed text-ink-3">{ev.summary}</p>

      {(ev.metrics?.length || ev.skills.length) > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          {ev.metrics?.map((m) => (
            <span key={m.label} className="num text-[14px] font-bold text-ink-3">
              <b className="font-black text-ink">{m.value}</b> {m.label}
            </span>
          ))}
          {ev.skills.length > 0 && (
            <span className="flex flex-wrap gap-1.5">
              {ev.skills.map((s) => (
                <span key={s} className="chip !text-[13px]">
                  {skillLabel(s)}
                </span>
              ))}
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-x-3 border-t-2 border-line pt-3 text-[13px] font-bold text-ink-3">
        <LevelGlyph level={ev.level} size={14} />
        {ev.level === 'S1' ? (
          <span className="min-w-0 flex-1">Kişisel beyan · doğrulama bekliyor</span>
        ) : (
          <span className="min-w-0 flex-1">
            Doğrulayan: {ev.verifier}
            {ev.verifiedAt && <> · {fmtDate(ev.verifiedAt)}</>}
          </span>
        )}
        {!ev.dispute && !conflict && org && (
          <button type="button" onClick={() => setDisputing(true)} className="btn-quiet btn-sm shrink-0 !min-h-8 !px-2 !text-ink-3 hover:!text-red-lip">
            İtiraz et
          </button>
        )}
      </div>

      {conflict && (
        <p className="mt-3 rounded-[14px] bg-red-tint p-3 text-[14px] font-bold text-red-lip">
          <b className="font-black">Kopya eser işareti.</b> Aynı eser{' '}
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
        <div className="mt-3 rounded-[14px] bg-red-tint p-3 text-[14px] font-bold text-red-lip">
          <p>
            <b className="font-black">İtiraz kaydı</b> · {ev.dispute.by} · {fmtDate(ev.dispute.at)}
          </p>
          <p className="mt-0.5">“{ev.dispute.reason}” İnceleme sürerken eşleşme ağırlığı yarıya indi.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {org && (
              <button
                type="button"
                className="btn-line btn-sm"
                onClick={() => {
                  actions.withdrawDispute(person.id, ev.id);
                  feedback({ tone: 'info', title: 'İtirazı geri çektin', text: 'Kanıt eski ağırlığına döndü.' });
                }}
              >
                İtirazı geri çek
              </button>
            )}
            {owner && (
              <a href="/kanit-bagla" className="btn-line btn-sm">
                Kanıt ekleyerek yanıt ver
              </a>
            )}
          </div>
        </div>
      )}

      <Modal open={disputing} onClose={() => setDisputing(false)} title="Bu iddiaya itiraz et">
        <p className="text-[15px] font-bold text-ink-3">
          İtirazlar herkese açık kaydedilir ve gerekçesiz itiraz kabul edilmez. İnceleme sürerken iddianın eşleşme ağırlığı yarıya iner; kişi kanıt ekleyerek yanıt verebilir.
        </p>
        <label className="label mt-4" htmlFor={`gerekce-${ev.id}`}>
          Gerekçe
        </label>
        <textarea
          id={`gerekce-${ev.id}`}
          className="field min-h-24"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="ör. Bu depo bir kursun hazır şablonundan çatallanmış görünüyor."
        />
        <p className="hint">En az 10 karakter. Somut bir gerekçe yaz.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-quiet" onClick={() => setDisputing(false)}>
            Vazgeç
          </button>
          <button
            type="button"
            className="btn-red"
            disabled={reason.trim().length < 10}
            onClick={() => {
              actions.dispute(person.id, ev.id, reason.trim(), 'Kurum incelemesi');
              setDisputing(false);
              setReason('');
              feedback({ tone: 'info', title: 'İtirazın kaydedildi', text: 'İnceleme sürerken eşleşme ağırlığı yarıya indi.' });
            }}
          >
            İtirazı kaydet
          </button>
        </div>
      </Modal>
    </article>
  );
}
