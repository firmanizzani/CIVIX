import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Report } from '@/types';
import apiClient from '@/lib/api';
import { fieldsFromCost, validCostFields } from '@/lib/costs';
import { getActionError, invalidateReportQueries } from '@/hooks/useReportWorkspace';
import AdminModal from './AdminModal';
import { CostFields } from './ReportCost';

export default function EditReportCost({ report }: { report: Report }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(() => fieldsFromCost(report.cost));
  const [reason, setReason] = useState('');
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => apiClient.patch(`/agency/assignments/${report.id}/cost`, { ...value, reason }),
    onSuccess: async () => { await invalidateReportQueries(client); setOpen(false); },
  });
  return <><button type="button" className="btn-outline" onClick={() => { setValue(fieldsFromCost(report.cost)); setReason(''); mutation.reset(); setOpen(true); }}>{report.cost ? 'Koreksi Rincian Biaya' : 'Lengkapi Rincian Biaya'}</button>
    {open && <AdminModal title="Perbarui rincian biaya" pending={mutation.isPending} onClose={() => setOpen(false)} className="cost-dialog"><form onSubmit={event => { event.preventDefault(); if (validCostFields(value) && reason.trim().length >= 5) mutation.mutate(); }}><h2>{report.cost ? 'Koreksi Rincian Biaya' : 'Lengkapi Rincian Biaya'}</h2><p>{report.kodeTiket} — {report.judul}</p><CostFields value={value} onChange={setValue} disabled={mutation.isPending} prefix="edit-cost" /><label htmlFor="cost-reason">Alasan pencatatan atau koreksi</label><textarea id="cost-reason" className="input" rows={3} required minLength={5} maxLength={1000} value={reason} disabled={mutation.isPending} onChange={event => setReason(event.target.value)} /><p className="cost-hint">Rincian dan alasan koreksi akan terlihat pada halaman publik. Status laporan tetap selesai.</p>{mutation.isError && <p className="workspace-error" role="alert">{getActionError(mutation.error)}</p>}<div className="cost-dialog-actions"><button type="button" className="btn-outline" disabled={mutation.isPending} onClick={() => setOpen(false)}>Batal</button><button className="btn-primary" disabled={mutation.isPending || !validCostFields(value) || reason.trim().length < 5}>{mutation.isPending ? 'Menyimpan…' : 'Simpan & Publikasikan'}</button></div></form></AdminModal>}
  </>;
}
