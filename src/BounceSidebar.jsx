import { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(useGSAP, MotionPathPlugin);

function dotPosition(item) {
  const dpr = window.devicePixelRatio || 1;
  const size = Math.round(6 * dpr) / dpr;
  const height = parseFloat(getComputedStyle(item).height);
  const y = Math.round((item.offsetTop + height / 2 - size / 2) * dpr) / dpr;
  return { size, y };
}

export function BounceSidebar({ items }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const root = useRef(null);
  const dot = useRef(null);
  const itemRefs = useRef([]);
  const positioned = useRef(false);

  useGSAP(() => {
    const { size, y } = dotPosition(itemRefs.current[activeIndex]);
    const xFrom = Number(gsap.getProperty(dot.current, 'x'));
    const yFrom = Number(gsap.getProperty(dot.current, 'y'));
    gsap.killTweensOf(dot.current);
    gsap.set(dot.current, { width: size, height: size, opacity: 1 });

    if (!positioned.current || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(dot.current, { x: 0, y });
      positioned.current = true;
      return;
    }

    const distance = Math.abs(y - yFrom);
    const bend = Math.min(distance * 0.8, 14);
    gsap.to(dot.current, {
      duration: 0.25,
      ease: 'power1.out',
      motionPath: {
        path: `M ${xFrom},${yFrom} Q ${-2 * bend},${(yFrom + y) / 2} 0,${y}`,
      },
    });
  }, { scope: root, dependencies: [activeIndex] });

  useGSAP((context, contextSafe) => {
    let mounted = true;
    const snap = contextSafe(() => {
      if (!mounted) return;
      const item = root.current.querySelector('[data-active="true"]');
      const { size, y } = dotPosition(item);
      gsap.killTweensOf(dot.current);
      gsap.set(dot.current, { x: 0, y, width: size, height: size, opacity: 1 });
    });
    const observer = new ResizeObserver(snap);
    observer.observe(root.current);
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.addEventListener('change', snap);
    document.fonts.ready.then(snap);
    return () => {
      mounted = false;
      observer.disconnect();
      reducedMotion.removeEventListener('change', snap);
    };
  }, { scope: root });

  return (
    <div ref={root} className="bounce-sidebar" data-slot="bounce-sidebar">
      <span ref={dot} className="bounce-sidebar__dot" aria-hidden="true"/>
      <ul>
        {items.map((item, index) => (
          <li key={item.href}>
            <a
              ref={element => { itemRefs.current[index] = element; }}
              href={item.href}
              data-slot="bounce-sidebar-item"
              data-active={index === activeIndex}
              onPointerEnter={event => {
                if (event.pointerType === 'mouse') setActiveIndex(index);
              }}
              onFocus={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
