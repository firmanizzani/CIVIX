import { ReactNode, useEffect, useRef } from 'react';

export default function AdminModal({ title, pending = false, onClose, children }: { title: string; pending?: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog ref={ref} className="admin-dialog" aria-label={title} onCancel={event => { event.preventDefault(); if (!pending) onClose(); }} onClick={event => { if (event.target === event.currentTarget && !pending) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }}>{children}</dialog>;
}
