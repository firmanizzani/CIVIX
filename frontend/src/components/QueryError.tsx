import { AlertCircle } from 'lucide-react';

export default function QueryError({ subject, retry, pending = false }: {
  subject: string;
  retry: () => unknown;
  pending?: boolean;
}) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p className="flex items-center gap-2 font-semibold"><AlertCircle size={18} aria-hidden="true" />{subject} belum berhasil dimuat</p>
      <p className="mt-1">Periksa koneksi Anda, lalu coba lagi.</p>
      <button type="button" onClick={() => retry()} disabled={pending} className="btn-outline mt-3 min-h-11">
        {pending ? 'Memuat ulang…' : 'Coba lagi'}
      </button>
    </div>
  );
}
