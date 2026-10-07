import { byId, useAppState } from '../../lib/store.ts';
import { shortHash, verifyChain } from '../../lib/engine/ledger.ts';
import { PILOT_STATUS, SCALE, SECTOR } from '../../lib/labels.ts';
import { fmtDate } from '../../lib/format.ts';
import { Empty, Mark, StatusIcon } from '../ui/primitives.tsx';

/** Public summary card of a closed pilot: the ecosystem's memory. */
export default function PublicCard({ id }: { id: string }) {
  const s = useAppState();
  const p = byId.pilot(s, id);
  if (!p || p.status === 'active')
    return (
      <div className="wrap py-24">
        <Empty title="Bu pilotun özet kartı yok">Kart yalnız kapanmış pilotlar için üretilir.</Empty>
      </div>
    );
  if (!p.closure?.publicConsent.person || !p.closure.publicConsent.org)
    return (
      <div className="wrap py-24">
        <Empty title="Taraflar yayın onayı vermedi">Özet kartı iki tarafın da onayıyla yayımlanır.</Empty>
      </div>
    );

  const org = byId.org(s, p.orgId)!;
  const person = byId.person(s, p.personId)!;
  const need = byId.need(s, p.needId)!;
  const met = p.milestones.filter((m) => m.state === 'approved').length;
  const days = Math.max(1, Math.round((Date.parse(p.closedAt!) - Date.parse(p.startedAt)) / 86_400_000));
  const intact = verifyChain(p.log) === -1;
  const root = p.log[p.log.length - 1]?.hash ?? '';
  const ok = p.status === 'succeeded';

  return (
    <div className="wrap max-w-3xl py-12">
      <article className="card overflow-hidden shadow-[0_24px_60px_-30px_rgb(var(--ink)/0.35)]">
        <div className="graticule relative border-b border-line px-8 py-8">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-bold tracking-[0.14em]">
              <Mark className="h-6 w-6" /> NİRENGİ
            </span>
            <span className="eyebrow">Pilot özet kartı</span>
          </div>
          <p className={`mt-8 font-mono text-xs uppercase tracking-wider ${ok ? 'text-s3' : 'text-ink-2'}`}>{PILOT_STATUS[p.status]}</p>
          <h1 className="display mt-2 text-[36px] md:text-[44px]">{p.title}</h1>
          <p className="mt-3 text-ink-2">
            <strong className="text-ink">{org.name}</strong> ({SECTOR[org.sector]} · {SCALE[org.scale]}) × <strong className="text-ink">{person.name}</strong>
          </p>
          <span
            className={`absolute right-8 top-24 hidden rotate-[-10deg] rounded-lg border-[3px] px-3 py-1.5 font-mono text-sm font-bold uppercase tracking-wider sm:block ${
              ok ? 'border-s3 text-s3' : 'border-ink-3 text-ink-3'
            }`}
          >
            {met}/{p.milestones.length} kriter
          </span>
        </div>

        <dl className="grid grid-cols-3 divide-x divide-line border-b border-line">
          {[
            ['Süre', `${days} gün`],
            ['Başlangıç', fmtDate(p.startedAt)],
            ['Kapanış', fmtDate(p.closedAt!)],
          ].map(([k, v]) => (
            <div key={k} className="px-6 py-4">
              <dt className="eyebrow">{k}</dt>
              <dd className="num mt-1">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="px-8 py-6">
          <p className="eyebrow">Problem</p>
          <p className="mt-1 text-sm text-ink-2">{need.canvas.painMetric}</p>
          <p className="eyebrow mt-6">Başarı kriterleri</p>
          <ul className="mt-2 space-y-2">
            {p.milestones.map((m) => (
              <li key={m.id} className="flex gap-3 text-[15px]">
                <span className={m.state === 'approved' ? 'text-s3' : 'text-ink-3'}><StatusIcon kind={m.state === 'approved' ? 'ok' : 'pending'} /></span>
                <span className={m.state === 'approved' ? '' : 'text-ink-3'}>{m.title}</span>
              </li>
            ))}
          </ul>
          <p className="eyebrow mt-6">Sonuç</p>
          <p className="mt-1 text-[15px] leading-relaxed">{p.closure.summary}</p>
          {!ok && <p className="mt-2 text-sm text-ink-2">Gerekçe: {p.closure.reason}</p>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-sunken/60 px-8 py-4 font-mono text-[11px] text-ink-3">
          <span>
            Defter kökü {shortHash(root)} · {p.log.length} kayıt
          </span>
          <span className={intact ? 'text-s3' : 'text-danger'}><StatusIcon kind={intact ? 'ok' : 'fail'} /> {intact ? 'zincir bütün' : 'zincir kırık'}</span>
        </div>
      </article>

      <div className="no-print mt-6 flex flex-wrap justify-center gap-2">
        <button className="btn-line btn-sm" onClick={() => window.print()}>
          Yazdır / PDF
        </button>
        <button className="btn-line btn-sm" onClick={() => navigator.clipboard?.writeText(location.href)}>
          Bağlantıyı kopyala
        </button>
        <a className="btn-quiet btn-sm" href={`/pilotlar/${p.id}`}>
          Defteri incele
        </a>
      </div>
      <p className="no-print mt-4 text-center text-xs text-ink-3">Bu kart ekosistemin hafızasıdır: benzer ihtiyaç yazan kurumlara yayın öncesinde gösterilir.</p>
    </div>
  );
}
