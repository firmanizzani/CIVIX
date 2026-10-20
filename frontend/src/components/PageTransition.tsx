import { ReactNode } from 'react';

export default function PageTransition({ children }: { children: ReactNode }) {
  return <div className="animate-in-up">{children}</div>;
}
