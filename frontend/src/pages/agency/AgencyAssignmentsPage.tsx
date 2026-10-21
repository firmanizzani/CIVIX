import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import apiClient from '@/lib/api';
import { Report, STATUS_LABEL, KATEGORI_LABEL } from '@/types';
import { formatDate, getStatusBadgeClasses } from '@/lib/utils';
import { Play, CheckCircle2, Upload, X, Loader2, Wrench, Image as ImageIcon } from 'lucide-react';

export default function AgencyAssignmentsPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Report | null>(null);
  const [note, setNote] = useState('');
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: assignments = [], isLoading } = useQuery<Report[]>({
    queryKey: ['agency-assignments'],
    queryFn: async () => (await apiClient.get('/agency/assignments')).data,
  });

  const progressMutation = useMutation({
    mutationFn: async ({ id, status, catatan }: { id: string; status: string; catatan: string }) =>
      (await apiClient.post(`/agency/assignments/${id}/progress`, { status, catatan })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['agency-dashboard'] });
      setSelected(null);
      setNote('');
    },
  });

  const completeMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) =>
      (await apiClient.post(`/agency/assignments/${id}/complete`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['agency-dashboard'] });
      setSelected(null);
      setNote('');
      setProofFiles([]);
    },
  });

  const chooseProof = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + proofFiles.length > 3) return alert('Maksimal 3 foto bukti.');
    setProofFiles((prev) => [...prev, ...files]);
  };

  const submitComplete = () => {
    if (!selected || proofFiles.length === 0) return;
    const formData = new FormData();
    formData.append('catatan', note);
    proofFiles.forEach((file) => formData.append('bukti', file));
    completeMutation.mutate({ id: selected.id, formData });
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <div className="container-civix flex-1 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-civix-navy">Daftar Tugas Instansi</h1>
          <p className="mt-1 text-slate-600">Mulai penanganan, tambah progres, dan unggah bukti penyelesaian.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="card overflow-hidden">
            {isLoading ? <div className="space-y-3 p-6"><div className="skeleton h-24" /><div className="skeleton h-24" /></div> : assignments.length === 0 ? (
              <div className="p-12 text-center text-slate-500">Belum ada tugas yang ditugaskan.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {assignments.map((task) => (
                  <button key={task.id} onClick={() => { setSelected(task); setNote(''); setProofFiles([]); }} className={`flex w-full gap-4 p-5 text-left transition hover:bg-slate-50 ${selected?.id === task.id ? 'bg-lime-50/60 border-l-4 border-civix-blue' : ''}`}>
                    {task.photos?.[0] ? <img src={task.photos[0].url} alt="" className="h-20 w-24 rounded-lg object-cover" /> : <div className="flex h-20 w-24 items-center justify-center rounded-lg bg-slate-100 text-slate-400"><ImageIcon size={20} /></div>}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><span className="mono text-xs text-slate-400">{task.kodeTiket}</span><span className="text-xs text-civix-blue">{KATEGORI_LABEL[task.kategori]}</span></div>
                      <h2 className="mt-1 font-bold text-civix-navy">{task.judul}</h2>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{formatDate(task.dibuatPada)}</span>
                        <span className={`rounded-full px-2 py-0.5 font-semibold ${getStatusBadgeClasses(task.status)}`}>{STATUS_LABEL[task.status]}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="card h-fit p-6 lg:sticky lg:top-24">
            {!selected ? (
              <div className="py-10 text-center text-sm text-slate-500"><Wrench className="mx-auto mb-3 text-slate-300" size={30} />Pilih tugas untuk memperbarui progres.</div>
            ) : (
              <div>
                <span className="mono text-xs text-slate-400">{selected.kodeTiket}</span>
                <h2 className="mt-1 font-bold text-civix-navy">{selected.judul}</h2>
                <p className="mt-2 text-xs text-slate-500">Status: <strong>{STATUS_LABEL[selected.status]}</strong></p>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan penanganan untuk timeline publik..." className="input mt-5 min-h-24" />

                {selected.status === 'ditugaskan' && (
                  <button onClick={() => progressMutation.mutate({ id: selected.id, status: 'dikerjakan', catatan: note })} disabled={progressMutation.isPending} className="btn-primary mt-4 w-full">
                    {progressMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} Mulai Pengerjaan
                  </button>
                )}

                {selected.status === 'dikerjakan' && (
                  <div className="mt-4 space-y-3">
                    <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={chooseProof} />
                    <button type="button" onClick={() => fileRef.current?.click()} className="btn-outline w-full"><Upload size={16} /> Tambah Bukti ({proofFiles.length}/3)</button>
                    {proofFiles.map((file, i) => <div key={i} className="flex items-center justify-between rounded bg-slate-50 p-2 text-xs"><span className="truncate">{file.name}</span><button onClick={() => setProofFiles((p) => p.filter((_, n) => n !== i))}><X size={14} /></button></div>)}
                    <p className="text-xs text-slate-500">Minimal 1 foto bukti wajib sebelum menyelesaikan laporan.</p>
                    <button onClick={submitComplete} disabled={completeMutation.isPending || proofFiles.length === 0} className="btn bg-lime-600 text-white hover:bg-lime-700 w-full">
                      {completeMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Tandai Selesai
                    </button>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
