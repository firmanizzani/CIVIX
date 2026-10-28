import { ReactNode } from 'react';

export default function PageHeading({ title, description, label, action }: { title: string; description: string; label?: string; action?: ReactNode }) {
  return <header className="page-heading">
    <div>{label && <span className="brand-label">{label}</span>}<h1>{title}</h1><p>{description}</p></div>
    {action && <div className="page-heading-action">{action}</div>}
  </header>;
}
