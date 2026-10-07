// Herkese açık kart: a closed pilot as one shareable card. Shown only when both sides agreed.

import { useMemo, useState } from 'react';
import { Check, ChevronRight, Copy, Printer } from 'lucide-react';
import { byId, useAppState } from '../../lib/store.ts';
import { shortHash, verifyChain } from '../../lib/engine/ledger.ts';
import { PILOT_STATUS, SCALE, SECTOR } from '../../lib/labels.ts';
import { fmtDate } from '../../lib/format.ts';
import type { Pilot } from '../../lib/types.ts';
import { EmptyState, feedback, Why } from '../ui/kit';
import { CheckCircle } from '../ui/icons';
import { Avatar, LevelBadge, Mark, OrgMark } from '../ui/primitives';

const DAY = 86_400_000;

function Gate({ title, children }: { title: string; children: string }) {
  return (
    <div className="mx-auto w-full max-w-[560px] px-4 py-16">
      <EmptyState
        title={title}
        action={
          <a href="/" className="btn-primary">
            Ana sayfaya dön
          </a>
        }
      >
        {children}
      </EmptyState>
    </div>
  );
}

export default function PublicCard({ id }: { id: string }) {
  const s = useAppState();
  const p = byId.pilot(s, id);
  if (!p) return <Gate title="Bu kart bulunamadı">Bağlantı eski olabilir ya da kart bu cihazda yok.</Gate>;
  if (p.status === 'active') return <Gate title="Bu proje henüz kapanmadı">Kart yalnız kapanmış projeler için hazırlanır.</Gate>;
  if (!p.closure?.publicConsent.person || !p.closure.publicConsent.org) return <Gate title="Taraflar yayın onayı vermedi">Kart, iki taraf da onay verirse yayımlanır.</Gate>;
  return <Card pilot={p} />;
}

function Card({ pilot: p }: { pilot: Pilot }) {
  const s = useAppState();
  const [copied, setCopied] = useState(false);
  const org = byId.org(s, p.orgId)!;
  const person = byId.person(s, p.personId)!;
  const need = byId.need(s, p.needId);
  const closure = p.closure!;
  const total = p.milestones.length;
  const met = p.milestones.filter((m) => m.state === 'approved').length;
  const days = Math.max(1, Math.round((Date.parse(p.closedAt ?? p.startedAt) - Date.parse(p.startedAt)) / DAY));
  const intact = useMemo(() => verifyChain(p.log) === -1, [p.log]);
  const root = p.log[p.log.length - 1]?.hash ?? '';
  const ok = p.status === 'succeeded';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
      feedback({ tone: 'good', title: 'Bağlantı kopyalandı', text: 'Kartı artık paylaşabilirsin.' });
    } catch {
      feedback({ tone: 'bad', title: 'Kopyalanamadı', text: 'Adres çubuğundaki bağlantıyı elle kopyalayabilirsin.' });
    }
  };

  return (
    <div className="mx-auto w-full max-w-[600px] px-4 py-10 sm:py-14">
      <article className="card overflow-hidden" style={{ boxShadow: '0 6px 0 rgb(var(--line))' }}>
        <header className="flex items-center justify-between gap-3 px-6 pt-5">
          <span className="flex items-center gap-2">
            <Mark className="h-8 w-8" />
            <span className="text-[22px] font-black tracking-[-0.03em] text-indigo">nirengi</span>
          </span>
          <span className={`pill ${ok ? 'bg-green-tint text-green-lip' : 'bg-bg-3 text-ink-2'}`}>{PILOT_STATUS[p.status]}</span>
        </header>

        <div className="px-6 pb-6 pt-6">
          <h1 className="text-[30px] font-black leading-[1.1] text-ink sm:text-[34px]">{p.title}</h1>
          {met > 0 && (
            <p className="mt-3 flex flex-wrap items-center gap-2">
              <LevelBadge level="S3" />
              <span className="text-[14px] font-bold text-ink-3">
                {met}/{total} kriter kurum ve yetenek tarafından onaylandı
              </span>
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <OrgMark name={org.name} size={48} />
              <div className="min-w-0">
                <p className="truncate text-[16px] font-black text-ink">{org.name}</p>
                <p className="truncate text-[13px] font-bold text-ink-3">
                  {SECTOR[org.sector]} · {SCALE[org.scale]}
                </p>
              </div>
            </div>
            <span className="hidden h-[3px] w-6 shrink-0 rounded-full bg-line-2 sm:block" aria-hidden="true" />
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:flex-row-reverse sm:text-right">
              <Avatar person={person} size={48} reveal />
              <div className="min-w-0">
                <p className="truncate text-[16px] font-black text-ink">{person.name}</p>
                <p className="truncate text-[13px] font-bold text-ink-3">{person.headline}</p>
              </div>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-3 divide-x-2 divide-line border-y-2 border-line">
          {(
            [
              ['Süre', `${days} gün`],
              ['Kriter', `${met}/${total}`],
              ['Kapanış', fmtDate(p.closedAt ?? p.startedAt)],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="px-4 py-4 text-center">
              <dd className="num text-[18px] font-black leading-tight text-ink sm:text-[24px]">{v}</dd>
              <dt className="mt-0.5 text-[13px] font-bold text-ink-3">{k}</dt>
            </div>
          ))}
        </dl>

        <div className="px-6 py-6">
          {need && (
            <>
              <h2 className="h-sec">Çözülen sorun</h2>
              <p className="mt-1.5 text-[15px] font-bold leading-snug text-ink-2">{need.canvas.painMetric}</p>
            </>
          )}
          <h2 className={`h-sec ${need ? 'mt-6' : ''}`}>Başarı kriterleri</h2>
          <ul className="mt-3 space-y-3">
            {p.milestones.map((m) => {
              const done = m.state === 'approved';
              return (
                <li key={m.id} className="flex items-start gap-3">
                  <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${done ? 'bg-green text-white' : 'border-2 border-line-2 text-transparent'}`}>
                    <Check className="h-4 w-4" strokeWidth={4} aria-hidden="true" />
                  </span>
                  <span className={`text-[15px] font-extrabold leading-snug ${done ? 'text-ink' : 'text-ink-3'}`}>
                    {m.title}
                    <span className="sr-only">{done ? ' (karşılandı)' : ' (karşılanmadı)'}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <h2 className="h-sec mt-6">Sonuç</h2>
          <p className="mt-1.5 text-[15px] font-bold leading-relaxed text-ink-2">{closure.summary}</p>
          {!ok && <p className="mt-2 text-[14px] font-bold text-ink-3">Gerekçe: {closure.reason}</p>}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t-2 border-line bg-bg-2 px-6 py-4">
          <div className="min-w-0">
            <p className="text-[15px] font-black text-ink">Defter</p>
            <p className="mono text-[12px] font-medium text-ink-3">
              {p.log.length} kayıt · son özet {shortHash(root)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span className={`pill pop ${intact ? 'bg-green-tint text-green-lip' : 'bg-red-tint text-red-lip'}`}>
              {intact && <CheckCircle size={18} />}
              {intact ? 'Zincir doğrulandı' : 'Zincir kırık'}
            </span>
            <Why title="Bu doğrulama nasıl yapıldı?">
              <p className="text-[15px] font-bold text-ink-2">Defterdeki her kayıt, bir öncekinin SHA-256 özetini taşır. Bu sayfa açıldığında özetlerin hepsi yeniden hesaplandı ve kayıtlı olanlarla karşılaştırıldı.</p>
              <p className="mt-3 text-[15px] font-bold text-ink-2">Tek bir kayıt sonradan değişseydi bu rozet kırmızıya dönerdi. Kurumlar ve kişiler kurgusal demo verisidir.</p>
            </Why>
          </div>
        </footer>
      </article>

      <div className="no-print mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" className={copied ? 'btn-green' : 'btn-primary'} onClick={copy}>
          {copied ? <Check className="h-5 w-5" strokeWidth={3.5} /> : <Copy className="h-5 w-5" strokeWidth={3} />}
          {copied ? 'Kopyalandı' : 'Bağlantıyı kopyala'}
        </button>
        <button type="button" className="btn-line" onClick={() => window.print()}>
          <Printer className="h-5 w-5" strokeWidth={3} />
          Yazdır / PDF
        </button>
      </div>
      <p className="no-print mt-5 text-center">
        <a href={`/pilotlar/${p.id}`} className="inline-flex items-center gap-1 text-[14px] font-extrabold text-indigo hover:underline">
          Defteri incele
          <ChevronRight className="h-4 w-4" strokeWidth={3} />
        </a>
      </p>
      <p className="no-print mt-3 text-center text-[13px] font-bold text-ink-3">Kart iki tarafın onayıyla yayımlanır. Kurumlar ve kişiler kurgusal demo verisidir.</p>
    </div>
  );
}
