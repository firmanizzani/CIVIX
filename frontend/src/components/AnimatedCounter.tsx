import { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export default function AnimatedCounter({ value, duration = 750, className = '' }: AnimatedCounterProps) {
  const [current, setCurrent] = useState(() => (value < 20 ? 0 : Math.floor(value * 0.6)));

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || duration <= 0) {
      setCurrent(value);
      return;
    }

    const startValue = value < 20 ? 0 : Math.floor(value * 0.6);
    const range = value - startValue;
    if (range <= 0) {
      setCurrent(value);
      return;
    }

    const startTime = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuad = 1 - (1 - progress) * (1 - progress);
      const nextValue = Math.round(startValue + range * easeOutQuad);

      setCurrent(nextValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        setCurrent(value);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <span className={className}>{current.toLocaleString('id-ID')}</span>;
}
