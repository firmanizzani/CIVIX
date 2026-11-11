import type { ReactNode } from 'react';
import { ReceiptText, Check, History } from 'lucide-react';
import type { Report } from '@/types';
import { costDate, formatRupiah, fundingLabel, type CostFieldsValue } from '@/lib/costs';
import './report-costs.css';

export function CostFields({ value, onChange, disabled = false, prefix = 'report-cost' }: {
  value: CostFieldsValue; onChange: (value: CostFieldsValue) => void; disabled?: boolean; prefix?: string;
}) {
  const field = (key: keyof CostFieldsValue, next: string) => onChange({ ...value, [key]: next });
  const formattedAmount = value.amount ? value.amount.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
  return <fieldset className="cost-fields" disabled={disabled}>
    <legend>Realisasi Biaya Penanganan</legend>
    <p className="cost-hint">Catat biaya yang digunakan untuk menyelesaikan laporan ini.</p>
    <label htmlFor={prefix + '-amount'}>Biaya penanganan (Rp)</label>
    <div className="cost-money-input"><span aria-hidden="true">Rp</span><input
      id={prefix + '-amount'} inputMode="numeric" autoComplete="off" required
      maxLength={19} value={formattedAmount} placeholder="Contoh 1.000.000"
      onChange={event => field('amount', event.target.value.replace(/\D/g, '').slice(0, 15))}
      aria-describedby={prefix + '-amount-help'} /></div>
    <small id={prefix + '-amount-help'}>Isi 0 jika tidak ada biaya tambahan untuk penanganan ini.</small>
    <label htmlFor={prefix + '-source'}>Sumber pendanaan</label>
    <select id={prefix + '-source'} className="input" required value={value.fundingSource}
      onChange={event => onChange({ ...value, fundingSource: event.target.value as CostFieldsValue['fundingSource'], fundingNote: '' })}>
      <option value="">Pilih sumber pendanaan</option><option value="apbd">APBD DKI Jakarta</option><option value="other">Sumber lainnya</option>
    </select>
    {value.fundingSource === 'other' && <>
      <label htmlFor={prefix + '-funding-note'}>Sebutkan sumber pendanaan</label>
      <input id={prefix + '-funding-note'} className="input" required maxLength={200} value={value.fundingNote}
        onChange={event => field('fundingNote', event.target.value)} placeholder="Nama sumber atau program pendanaan" />
    </>}
    <label htmlFor={prefix + '-breakdown'}>Rincian penggunaan biaya</label>
    <textarea id={prefix + '-breakdown'} className="input" required minLength={5} maxLength={2000} rows={3}
      value={value.breakdown} onChange={event => field('breakdown', event.target.value)}
      placeholder="Jelaskan penggunaan biaya untuk material, tenaga kerja, atau peralatan." />
  </fieldset>;
}

export function CostAvailable({ report }: { report: Pick<Report, 'status' | 'cost'> }) {
  return report.status === 'selesai' && report.cost
    ? <span className="cost-available"><ReceiptText size={13} aria-hidden="true" />Rincian biaya tersedia</span> : null;
}

export default function ReportCost({ report, children }: { report: Report; children?: ReactNode }) {
  if (report.status !== 'selesai') return null;
  const cost = report.cost;
  return <section id="biaya-penanganan" className="report-cost-panel" aria-label="Realisasi biaya penanganan">
    <header><ReceiptText size={20} aria-hidden="true" /><h2>Realisasi Biaya Penanganan</h2></header>
    {cost ? <>
      <p className="report-cost-amount">{formatRupiah(cost.amount)}</p>
      <p className="cost-funding"><Check size={14} aria-hidden="true" />{fundingLabel(cost.fundingSource, cost.fundingNote)}</p>
      <h3>Rincian penggunaan biaya</h3>
      <p className="cost-breakdown">{cost.breakdown}</p>
      <div className="cost-recorded"><span>Dicatat oleh {cost.agency?.nama || report.assignedAgency?.nama || 'instansi penanganan'}</span>
        <time dateTime={cost.updatedAt}>Diperbarui {costDate(cost.updatedAt)} WIB</time></div>
      {(cost.revisions?.length || 0) > 1 && <details className="cost-history">
        <summary><History size={15} aria-hidden="true" />Riwayat pencatatan biaya ({cost.revisions!.length})</summary>
        <ol>{cost.revisions!.map(revision => <li key={revision.id}>
          <time dateTime={revision.recordedAt}>{costDate(revision.recordedAt)} WIB</time>
          <strong>{formatRupiah(revision.amount)}</strong>
          <span>{fundingLabel(revision.fundingSource, revision.fundingNote)}</span>
          <p>{revision.breakdown}</p><p className="cost-reason">{revision.reason}</p>
        </li>)}</ol>
      </details>}
    </> : <p className="cost-unavailable">Data biaya belum tersedia. Instansi belum mencatat rincian biaya untuk laporan ini.</p>}
    {children}
  </section>;
}
