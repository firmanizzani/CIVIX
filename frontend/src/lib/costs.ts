import type { FundingSource, ReportCost } from '@/types';

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
export const formatRupiah = (amount: string) => rupiah.format(BigInt(amount));
export const fundingLabel = (source: FundingSource, note?: string | null) =>
  source === 'apbd' ? 'APBD DKI Jakarta' : note || 'Sumber lainnya';
export const costDate = (value: string) => new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta',
}).format(new Date(value));

export interface CostFieldsValue {
  amount: string;
  fundingSource: FundingSource | '';
  fundingNote: string;
  breakdown: string;
}

export const emptyCostFields = (): CostFieldsValue => ({
  amount: '', fundingSource: '', fundingNote: '', breakdown: '',
});
export const fieldsFromCost = (cost?: ReportCost | null): CostFieldsValue => cost ? {
  amount: cost.amount, fundingSource: cost.fundingSource, fundingNote: cost.fundingNote || '', breakdown: cost.breakdown,
} : emptyCostFields();
export const validCostFields = (value: CostFieldsValue) => /^\d{1,15}$/.test(value.amount) &&
  !!value.fundingSource && (value.fundingSource !== 'other' || !!value.fundingNote.trim()) &&
  value.breakdown.trim().length >= 5;
