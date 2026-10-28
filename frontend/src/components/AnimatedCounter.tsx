import { useEffect, useRef, useState } from 'react';
import useReducedMotion from '@/hooks/useReducedMotion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export default function AnimatedCounter({ value, duration = 650, className = '' }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(0);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!ref.current || !('IntersectionObserver' in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible && !reducedMotion) return;
    const finish = () => { previous.current = value; setCurrent(value); };
    if (reducedMotion || duration <= 0 || document.hidden) { finish(); return; }
    const startValue = previous.current;
    const startTime = performance.now();
    let frameId = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const next = Math.round(startValue + (value - startValue) * (1 - Math.pow(1 - progress, 3)));
      previous.current = next;
      setCurrent(next);
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };
    const onVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(frameId); finish(); }
    };
    document.addEventListener('visibilitychange', onVisibility);
    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [value, duration, visible, reducedMotion]);

  return <span ref={ref} className={`tabular-nums ${className}`} aria-label={value.toLocaleString('id-ID')}>
    <span aria-hidden="true">{current.toLocaleString('id-ID')}</span>
  </span>;
}
