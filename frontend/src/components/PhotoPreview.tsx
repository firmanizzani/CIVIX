import { useState } from 'react';
import { X } from 'lucide-react';
import AdminModal from './AdminModal';
import './photo-preview.css';

export default function PhotoPreview({ src, alt, imageClassName = '' }: { src: string; alt: string; imageClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  return <>
    <button type="button" className="photo-preview-trigger" aria-label={`Perbesar ${alt}`} onClick={() => { setFailed(false); setOpen(true); }}>
      <img className={imageClassName} src={src} alt={alt} />
    </button>
    {open && <AdminModal title={alt} className="photo-preview-dialog" onClose={() => setOpen(false)}>
      <header className="photo-preview-header"><h2>{alt}</h2><button type="button" aria-label="Tutup pratinjau foto" autoFocus onClick={() => setOpen(false)}><X size={22} /></button></header>
      {failed ? <p className="photo-preview-error" role="alert">Foto tidak dapat dimuat. Tutup pratinjau dan coba lagi.</p> : <img className="photo-preview-image" src={src} alt={alt} onError={() => setFailed(true)} />}
    </AdminModal>}
  </>;
}
