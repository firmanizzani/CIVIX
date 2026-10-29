import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Upload, X } from 'lucide-react';
import apiClient from '@/lib/api';
import { getActionError } from '@/hooks/useReportWorkspace';

const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function ReportCompletionForm({ reportId, onSaved }: { reportId: string; onSaved: () => Promise<unknown> }) {
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { const urls = files.map(file => URL.createObjectURL(file)); setPreviews(urls); return () => urls.forEach(url => URL.revokeObjectURL(url)); }, [files]);
  const save = useMutation({ mutationFn: async () => {
    const form = new FormData(); form.append('catatan', note); files.forEach(file => form.append('bukti', file));
    return (await apiClient.post(`/agency/assignments/${reportId}/complete`, form, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
  }, onSuccess: async () => { setNote(''); setFiles([]); await onSaved(); }, onError: async () => { await onSaved(); } });
  const addFiles = (incoming: File[]) => {
    if (save.isPending) return;
    setError('');
    const unique = incoming.filter(file => !files.some(item => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified));
    if (files.length + unique.length > 3) return setError('Maksimal 3 foto bukti per laporan.');
    if (unique.some(file => !imageTypes.includes(file.type))) return setError('Gunakan foto JPG, PNG, WebP, atau GIF.');
    if (unique.some(file => file.size > 5 * 1024 * 1024)) return setError('Ukuran setiap foto maksimal 5 MB.');
    setFiles([...files, ...unique]);
  };
  return <form className="workspace-task-form admin-completion-form" onSubmit={event => { event.preventDefault(); if (files.length) save.mutate(); }}>
    <label className="label" htmlFor="admin-completion-note">Catatan Penanganan (opsional)</label><textarea id="admin-completion-note" className="input" rows={3} maxLength={2000} value={note} disabled={save.isPending} onChange={event => setNote(event.target.value)} placeholder="Tulis hasil penanganan di lokasi…" />
    <div className="workspace-upload-section"><label className="label" htmlFor="admin-completion-files">Foto Bukti Penyelesaian</label><input id="admin-completion-files" ref={input} className="sr-only" type="file" multiple accept={imageTypes.join(',')} disabled={save.isPending || files.length >= 3} onChange={event => { addFiles(Array.from(event.target.files || [])); event.target.value = ''; }} />
      <div className="workspace-proof-grid">{files.map((file, i) => <div className="workspace-proof" key={file.name + file.lastModified}><img src={previews[i]} alt={`Bukti penyelesaian ${i + 1}`} /><button type="button" aria-label={`Hapus foto ${file.name}`} disabled={save.isPending} onClick={() => setFiles(files.filter((_, index) => index !== i))}><X size={14} /></button></div>)}{files.length < 3 && <button type="button" className="workspace-upload-button" disabled={save.isPending} onClick={() => input.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); addFiles(Array.from(event.dataTransfer.files)); }}><Upload size={20} /><span>Tambah Foto</span></button>}</div>
      <p className="workspace-muted">Minimal 1 foto, maksimal 3. JPG, PNG, WebP, atau GIF hingga 5 MB per foto.</p>
    </div>{error && <p role="alert" className="workspace-error">{error}</p>}{save.isError && <p role="alert" className="workspace-error">{getActionError(save.error)}</p>}<button className="btn-primary w-full mt-4" type="submit" disabled={save.isPending || !files.length}><CheckCircle2 size={16} />{save.isPending ? 'Menyimpan…' : 'Tandai Selesai'}</button>
  </form>;
}
