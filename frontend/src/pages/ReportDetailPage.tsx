import { useLayoutEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import QueryError from '@/components/QueryError';
import { useLocation, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import apiClient from '@/lib/api';
import { publicReportDetailQuery } from '@/lib/reportQueries';
import { STATUS_LABEL, KATEGORI_LABEL } from '@/types';
import { formatDateTime, getStatusActorLabel, getStatusColor } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import Reveal from '@/components/Reveal';
import { ThumbsUp, MessageSquare, ArrowLeft, CheckCircle2, Clock, MapPin, AlertCircle, LoaderCircle } from 'lucide-react';

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { key: navigationKey } = useLocation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const { data: report, isLoading, error, refetch, isFetching } = useQuery(publicReportDetailQuery(id));

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [navigationKey, isLoading]);

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
      <div className="app-page report-detail-page flex min-h-screen flex-col bg-civix-neutral">
        <Navbar />
        <div className="container-civix flex-1 py-12">
          <div role="status" aria-label="Memuat detail laporan" className="flex justify-center py-12">
            <LoaderCircle size={22} aria-hidden="true" className="animate-spin text-civix-primary motion-reduce:animate-none" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="app-page report-detail-page flex min-h-screen flex-col bg-civix-neutral">
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
    <div className="app-page report-detail-page flex min-h-screen flex-col bg-civix-neutral">
      <Navbar />

      <div className="container-civix flex-1 py-12">
        <Reveal>
          <Link to="/reports" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-600 hover:text-civix-navy md:mb-6 md:min-h-0">
            <ArrowLeft size={16} /> Kembali ke daftar
          </Link>
        </Reveal>

        <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-3 lg:gap-x-8">
          {/* Main Info */}
          <div className="min-w-0 break-words lg:col-span-2">
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
                <span className="hidden sm:inline" aria-hidden="true">•</span>
                <span>Pelapor: {report.anonim ? 'Anonim (Warga)' : report.user?.nama || 'Warga'}</span>
                {report.region && (
                  <>
                    <span className="hidden sm:inline" aria-hidden="true">•</span>
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
          </div>

          <div className="min-w-0 lg:col-span-2">
            {/* Photos */}
            <Reveal delay="delay-1">
              <div className="card p-6">
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
          </div>

          <aside className="min-w-0 break-words lg:col-start-3 lg:row-span-3 lg:row-start-1">
            <div className="card p-6 lg:sticky lg:top-24">
              <h2 className="mb-4 text-lg font-bold text-civix-navy flex items-center gap-2">
                <Clock size={18} /> Timeline Status
              </h2>

              <div className="relative border-l-2 border-slate-200 pl-4 space-y-6">
                {report.statusLogs?.map((log, index) => {
                  const actor = getStatusActorLabel(log);
                  return <div key={log.id} className="relative">
                    <span style={{ backgroundColor: getStatusColor(log.status) }} className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white ${index === 0 ? 'ring-4 ring-slate-100' : ''}`} />
                    <p className="text-xs text-slate-500">{formatDateTime(log.waktu, true)}</p>
                    <p className="font-bold text-sm text-civix-navy">{STATUS_LABEL[log.status]}</p>
                    {actor && <p className="text-xs text-slate-600">{actor}</p>}
                    {log.catatan && <p className="mt-1 text-xs text-slate-600 bg-slate-50 p-2 rounded">{log.catatan}</p>}
                  </div>
                })}
              </div>
            </div>
          </aside>

            {/* Comments (F8) */}
            <Reveal delay="delay-2" className="min-w-0 break-words lg:col-span-2">
              <div className="card p-6">
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
                    aria-label="Tanggapan atau informasi tambahan"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Tulis tanggapan atau informasi tambahan..."
                    className="input min-h-[80px]"
                    required
                  />
                  <button type="submit" disabled={commentMutation.isPending} className="btn-primary w-full sm:w-auto">
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
                      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs text-slate-500">
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
      </div>

      <Footer />
    </div>
  );
}
