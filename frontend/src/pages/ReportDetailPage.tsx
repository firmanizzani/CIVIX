import { useState } from 'react';
import { isAxiosError } from 'axios';
import QueryError from '@/components/QueryError';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import apiClient from '@/lib/api';
import { Report, STATUS_LABEL, KATEGORI_LABEL } from '@/types';
import { formatDateTime, getStatusColor } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import Reveal from '@/components/Reveal';
import { ThumbsUp, MessageSquare, ArrowLeft, CheckCircle2, Clock, MapPin, AlertCircle } from 'lucide-react';

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const { data: report, isLoading, error, refetch, isFetching } = useQuery<Report>({
    queryKey: ['report-detail', id],
    queryFn: async () => (await apiClient.get(`/reports/${id}`)).data,
  });

  const upvoteMutation = useMutation({
    mutationFn: async () => (await apiClient.post(`/reports/${id}/upvote`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['report-detail', id] }),
  });

  const commentMutation = useMutation({
    mutationFn: async (isi: string) => (await apiClient.post(`/reports/${id}/comments`, { isi })).data,
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['report-detail', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar />
        <div className="container-civix flex-1 py-12">
          <div className="skeleton h-96 w-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar />
        <div className="container-civix flex-1 py-20 text-center">
          {error && !(isAxiosError(error) && error.response?.status === 404) ? (
            <QueryError subject="Detail laporan" retry={refetch} pending={isFetching} />
          ) : <><AlertCircle className="mx-auto mb-4 text-red-500" size={48} /><h2 className="text-2xl font-bold text-slate-800">Laporan Tidak Ditemukan</h2></>}
          <Link to="/reports" className="btn-primary mt-6">Kembali ke Daftar Laporan</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isUpvoted = report.upvotes?.some((u) => u.userId === user?.id);
  const awalPhotos = report.photos?.filter((p) => p.jenis === 'awal') || [];
  const buktiPhotos = report.photos?.filter((p) => p.jenis === 'bukti_perbaikan') || [];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <div className="container-civix flex-1 py-12">
        <Reveal>
          <Link to="/reports" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-civix-navy">
            <ArrowLeft size={16} /> Kembali ke daftar
          </Link>
        </Reveal>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2">
            <Reveal>
              <div className="card p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <span className="mono rounded bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                  {report.kodeTiket}
                </span>
                <span className="rounded-full bg-civix-blue/10 px-3 py-1 text-xs font-bold text-civix-blue">
                  {KATEGORI_LABEL[report.kategori]}
                </span>
              </div>

              <h1 className="text-2xl font-extrabold text-civix-navy sm:text-3xl">{report.judul}</h1>
              {report.namaJalan && (
                <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <MapPin size={16} className="text-civix-primary shrink-0" />
                  <span>{report.namaJalan}</span>
                </div>
              )}
              <p className="mt-4 whitespace-pre-line text-slate-700 leading-relaxed">{report.deskripsi}</p>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span>Dilaporkan: {formatDateTime(report.dibuatPada)}</span>
                <span>•</span>
                <span>Pelapor: {report.anonim ? 'Anonim (Warga)' : report.user?.nama || 'Warga'}</span>
                {report.region && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {report.region.nama}</span>
                  </>
                )}
              </div>

              {/* Upvote & Action */}
              <div className="mt-6 flex items-center gap-4 border-t border-slate-100 pt-4">
                <button
                  onClick={() => {
                    if (!user) alert('Silakan login untuk memberikan dukungan');
                    else upvoteMutation.mutate();
                  }}
                  className={`btn ${isUpvoted ? 'bg-orange-50 text-civix-orange border border-civix-orange' : 'btn-outline'}`}
                >
                  <ThumbsUp size={16} /> Dukung ({report.upvotes?.length || 0})
                </button>
              </div>
              </div>
            </Reveal>

            {/* Photos */}
            <Reveal delay="delay-1">
              <div className="card mt-6 p-6">
              <h2 className="mb-4 text-lg font-bold text-civix-navy">Foto Laporan Awal</h2>
              {awalPhotos.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {awalPhotos.map((photo) => (
                    <img key={photo.id} src={photo.url} alt="Foto laporan" className="h-48 w-full rounded-lg object-cover" />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Tidak ada foto terlampir.</p>
              )}
              </div>
            </Reveal>

            {/* Bukti Perbaikan (F7) */}
            {buktiPhotos.length > 0 && (
              <Reveal delay="delay-2">
                <div className="card mt-6 border-lime-200 bg-lime-50/50 p-6">
                <h2 className="mb-2 text-lg font-bold text-lime-900 flex items-center gap-2">
                  <CheckCircle2 className="text-lime-600" size={20} /> Bukti Penyelesaian Instansi
                </h2>
                <p className="mb-4 text-xs text-lime-700">Foto bukti hasil pekerjaan di lapangan</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {buktiPhotos.map((photo) => (
                    <img key={photo.id} src={photo.url} alt="Bukti selesai" className="h-48 w-full rounded-lg object-cover border border-lime-200" />
                  ))}
                </div>
                </div>
              </Reveal>
            )}

            {/* Comments (F8) */}
            <Reveal delay="delay-2">
              <div className="card mt-6 p-6">
              <h2 className="mb-4 text-lg font-bold text-civix-navy flex items-center gap-2">
                <MessageSquare size={18} /> Komentar ({report.comments?.length || 0})
              </h2>

              {user ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (commentText.trim()) commentMutation.mutate(commentText);
                  }}
                  className="mb-6 space-y-3"
                >
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Tulis tanggapan atau informasi tambahan..."
                    className="input min-h-[80px]"
                    required
                  />
                  <button type="submit" disabled={commentMutation.isPending} className="btn-primary">
                    {commentMutation.isPending ? 'Mengirim...' : 'Kirim Komentar'}
                  </button>
                </form>
              ) : (
                <div className="mb-6 rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-600">
                  <Link to="/login" className="font-semibold text-civix-blue underline">Masuk</Link> untuk memberi komentar.
                </div>
              )}

              <div className="space-y-4">
                {report.comments?.length === 0 ? (
                  <p className="text-sm text-slate-500">Belum ada komentar.</p>
                ) : (
                  report.comments?.map((comment) => (
                    <div key={comment.id} className="border-b border-slate-100 pb-3 last:border-none">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-bold text-slate-700">{comment.user?.nama || 'Warga'}</span>
                        <span>{formatDateTime(comment.waktu)}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-700">{comment.isi}</p>
                    </div>
                  ))
                )}
              </div>
              </div>
            </Reveal>
          </div>

          {/* Timeline Status Sidebar */}
          <div>
            <div className="card sticky top-24 p-6">
              <h2 className="mb-4 text-lg font-bold text-civix-navy flex items-center gap-2">
                <Clock size={18} /> Timeline Status
              </h2>

              <div className="relative border-l-2 border-slate-200 pl-4 space-y-6">
                {report.statusLogs?.map((log, index) => (
                  <div key={log.id} className="relative">
                    <span style={{ backgroundColor: getStatusColor(log.status) }} className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white ${index === 0 ? 'ring-4 ring-slate-100' : ''}`} />
                    <p className="text-xs text-slate-400">{formatDateTime(log.waktu)}</p>
                    <p className="font-bold text-sm text-civix-navy">{STATUS_LABEL[log.status]}</p>
                    {log.catatan && <p className="mt-1 text-xs text-slate-600 bg-slate-50 p-2 rounded">{log.catatan}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
