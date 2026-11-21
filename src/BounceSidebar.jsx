import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(useGSAP, MotionPathPlugin);

function dotPosition(root, item) {
  const orientation = getComputedStyle(root).getPropertyValue('--bounce-axis').trim() === 'horizontal' ? 'horizontal' : 'vertical';
  if (!item) return { orientation };
  const dpr = window.devicePixelRatio || 1;
  const round = value => Math.round(value * dpr) / dpr;
  const size = round(6);
  const box = root.getBoundingClientRect(), link = item.getBoundingClientRect();
  const scaleX = box.width / root.offsetWidth || 1, scaleY = box.height / root.offsetHeight || 1;
  const left = (link.left - box.left) / scaleX + root.scrollLeft;
  const top = (link.top - box.top) / scaleY + root.scrollTop;
  const width = link.width / scaleX, height = link.height / scaleY;
  return {
    orientation,
    size,
    x: round((orientation === 'horizontal' ? left + width / 2 : left - 16) - size / 2),
    y: round((orientation === 'horizontal' ? top + height + 7 : top + height / 2) - size / 2),
  };
}

export function BounceSidebar({ items, activeIndex, onNavigate }) {
  const [selection, setSelection] = useState(0);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [focusIndex, setFocusIndex] = useState(null);
  const [orientation, setOrientation] = useState('vertical');
  const selectedIndex = activeIndex ?? selection;
  const itemLabels = items.map(item => item.label).join('\0');
  const displayIndex = hoverIndex ?? focusIndex ?? selectedIndex;
  const root = useRef(null);
  const dot = useRef(null);
  const itemRefs = useRef([]);
  const currentIndex = useRef(displayIndex);
  const positioned = useRef(false);
  const previousOrientation = useRef(null);
  const move = useRef(null);
  currentIndex.current = displayIndex;

  useGSAP((context, contextSafe) => {
    let mounted = true;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const update = contextSafe((animate = false) => {
      if (!mounted || !root.current || !dot.current) return;
      const target = dotPosition(root.current, itemRefs.current[currentIndex.current]);
      setOrientation(value => value === target.orientation ? value : target.orientation);
      gsap.killTweensOf(dot.current);
      if (target.size === undefined) {
        gsap.set(dot.current, { opacity: 0 });
        positioned.current = false;
        return;
      }
      const { size, x, y } = target;
      const xFrom = Number(gsap.getProperty(dot.current, 'x')) || 0;
      const yFrom = Number(gsap.getProperty(dot.current, 'y')) || 0;
      gsap.set(dot.current, { width: size, height: size, opacity: 1 });
      if (!animate || !positioned.current || previousOrientation.current !== target.orientation || reducedMotion.matches) {
        gsap.set(dot.current, { x, y });
      } else {
        const bend = Math.min(Math.hypot(x - xFrom, y - yFrom) * .8, 14);
        const midX = (xFrom + x) / 2 - (target.orientation === 'vertical' ? 2 * bend : 0);
        const midY = (yFrom + y) / 2 + (target.orientation === 'horizontal' ? 2 * bend : 0);
        gsap.to(dot.current, {
          duration: .25,
          ease: 'power1.out',
          motionPath: { path: `M ${xFrom},${yFrom} Q ${midX},${midY} ${x},${y}` },
        });
      }
      positioned.current = true;
      previousOrientation.current = target.orientation;
    });
    move.current = update;
    const snap = () => update(false);
    const observer = new ResizeObserver(snap);
    observer.observe(root.current);
    itemRefs.current.filter(Boolean).forEach(item => observer.observe(item));
    window.addEventListener('resize', snap);
    reducedMotion.addEventListener('change', snap);
    document.fonts.ready.then(snap);
    return () => {
      mounted = false;
      move.current = null;
      observer.disconnect();
      window.removeEventListener('resize', snap);
      reducedMotion.removeEventListener('change', snap);
      positioned.current = false;
    };
  }, { scope: root, dependencies: [items.length], revertOnUpdate: true });

  useGSAP(() => {
    move.current?.(true);
  }, { scope: root, dependencies: [displayIndex, items.length] });

  useEffect(() => {
    if (orientation !== 'horizontal') return;
    const item = itemRefs.current[selectedIndex];
    const viewport = root.current?.closest('nav');
    if (!item || !viewport) return;
    const link = item.getBoundingClientRect(), box = viewport.getBoundingClientRect();
    const left = box.left + viewport.clientLeft + 6;
    const right = box.left + viewport.clientLeft + viewport.clientWidth - 6;
    const distance = link.left < left ? link.left - left : link.right > right ? link.right - right : 0;
    viewport.scrollTo({
      left: viewport.scrollLeft + distance,
      behavior: distance && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant',
    });
  }, [selectedIndex, orientation, itemLabels]);

  return (
    <div ref={root} className="bounce-sidebar" data-slot="bounce-sidebar" data-orientation={orientation}
      onPointerLeave={() => setHoverIndex(null)}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocusIndex(null); }}>
      <span ref={dot} className="bounce-sidebar__dot" aria-hidden="true"/>
      <ul>
        {items.map((item, index) => (
          <li key={item.href}>
            <a
              ref={element => { itemRefs.current[index] = element; }}
              href={item.href}
              data-slot="bounce-sidebar-item"
              data-active={index === displayIndex}
              aria-current={index === selectedIndex ? 'page' : undefined}
              onPointerEnter={event => { if (event.pointerType === 'mouse') setHoverIndex(index); }}
              onFocus={() => setFocusIndex(index)}
              onClick={event => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                if (activeIndex === undefined) setSelection(index);
                setHoverIndex(null);
                setFocusIndex(null);
                onNavigate?.(event, item.href);
              }}
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
