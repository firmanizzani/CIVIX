import { ReactNode } from 'react';

interface Props {
  open: boolean;
  children: ReactNode;
  id: string;
  className?: string;
  labelledBy?: string;
}

// Grid transitions reverse from the current position, even during rapid toggles.
export default function AnimatedCollapse({ open, children, id, className = '', labelledBy }: Props) {
  return (
    <div id={id} className={`collapse-shell ${className}`} data-open={open}
      aria-hidden={!open} role={labelledBy ? 'region' : undefined} aria-labelledby={labelledBy}
      {...(!open ? { inert: '' } : {})}>
      <div className="collapse-content">{children}</div>
    </div>
  );
}
