import { ReactNode, useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: 'default' | 'delay-1' | 'delay-2';
}

export default function Reveal({ children, className = '', delay = 'default' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const animClass = delay === 'delay-1' ? 'animate-in-up-delay-1' : delay === 'delay-2' ? 'animate-in-up-delay-2' : 'animate-in-up';

  let cls = 'opacity-0';
  if (visible && !done) cls = animClass;
  else if (visible && done) cls = '';

  return (
    <div
      ref={ref}
      className={`${cls} ${className}`}
      onAnimationEnd={() => setDone(true)}
    >
      {children}
    </div>
  );
}
