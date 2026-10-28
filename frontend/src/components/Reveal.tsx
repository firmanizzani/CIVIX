import { ReactNode, useEffect, useRef } from 'react';
import useReducedMotion from '@/hooks/useReducedMotion';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: 'default' | 'delay-1' | 'delay-2';
}

export default function Reveal({ children, className = '', delay = 'default' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const animations = useRef(new Map<Element, Animation>());
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const root = ref.current;
    if (!root || reducedMotion || !('IntersectionObserver' in window) || !root.animate) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal-item]'));
    const targets = items.length ? items : [root];
    const initiallyVisible = new WeakSet<Element>();
    const active = animations.current;
    let lastScrollY = window.scrollY;
    let scrollingDown = false;
    const onScroll = () => {
      const nextScrollY = window.scrollY;
      if (nextScrollY < lastScrollY) {
        scrollingDown = false;
        // Reversing direction immediately restores any content still entering.
        active.forEach((animation, target) => {
          animation.cancel();
          (target as HTMLElement).dataset.revealState = 'visible';
        });
        active.clear();
      } else if (nextScrollY > lastScrollY) {
        scrollingDown = true;
      }
      lastScrollY = nextScrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    // Leave the initial viewport alone; animate subsequent downward entries only.
    targets.forEach(target => {
      const rect = target.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) initiallyVisible.add(target);
    });
    const observer = new IntersectionObserver(entries => {
      const entering = entries.filter(entry => scrollingDown && entry.isIntersecting && !initiallyVisible.has(entry.target));
      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          initiallyVisible.delete(entry.target);
          active.get(entry.target)?.cancel();
          active.delete(entry.target);
        }
      });
      entering.forEach((entry, index) => {
        const target = entry.target as HTMLElement;
        if (target.contains(document.activeElement)) return;
        active.get(target)?.cancel();
        const animation = target.animate([
          { opacity: 0, transform: 'translateY(24px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], {
          duration: 620,
          delay: Math.min(index * 65, 130) + (delay === 'delay-2' ? 60 : delay === 'delay-1' ? 30 : 0),
          easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
          fill: 'backwards',
        });
        target.dataset.revealState = 'entering';
        active.set(target, animation);
        // Release completed animations instead of retaining them for the page lifetime.
        animation.onfinish = () => {
          if (active.get(target) === animation) {
            target.dataset.revealState = 'visible';
            active.delete(target);
          }
        };
      });
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
    targets.forEach(target => observer.observe(target));
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      active.forEach(animation => animation.cancel());
      active.clear();
    };
  }, [children, delay, reducedMotion]);

  return (
    <div ref={ref} className={className} onFocusCapture={() => {
      animations.current.forEach(animation => animation.cancel());
      animations.current.clear();
    }}>
      {children}
    </div>
  );
}
