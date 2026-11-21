import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './projection-home.css';
import { useI18n } from './i18n';

const base = import.meta.env.BASE_URL;

export function IndexBrand({ href = '#/', label = '返回摄影棚', onClick, heading = true }) {
  const chinese = useRef(null);
  const english = useRef(null);
  const Title = heading ? 'h1' : 'span';

  useLayoutEffect(() => {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return;
    const ink = (element) => {
      const style = getComputedStyle(element);
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      ctx.letterSpacing = style.letterSpacing;
      const bounds = ctx.measureText(element.textContent);
      return { left: -bounds.actualBoundingBoxLeft, width: bounds.actualBoundingBoxLeft + bounds.actualBoundingBoxRight };
    };
    const fit = () => {
      if (!chinese.current || !english.current) return;
      const title = ink(chinese.current), subtitle = ink(english.current);
      if (!subtitle.width) return;
      const scale = title.width / subtitle.width;
      const offset = title.left - subtitle.left * scale;
      english.current.style.transform = `translateX(${offset}px) scale(${scale})`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(chinese.current);
    document.fonts.ready.then(fit);
    return () => observer.disconnect();
  }, []);

  return (
    <a href={href} className="projection-index__brand" aria-label={label} onClick={onClick}>
      <img src={base + 'assets/logo.jpg'} width="112" height="112" alt=""/>
      <div className="projection-index__wordmark">
        <Title className="projection-index__title" ref={chinese}>锵稿</Title>
        <span className="projection-index__subtitle" lang="en" ref={english}>PAPERBULLET</span>
      </div>
    </a>
  );
}

export function StudioLanding({ view, onEnter, children }) {
  const { t } = useI18n();
  const mount = useRef(null);
  const screen = useRef(null);
  const scene = useRef(null);
  const initialView = useRef(view);
  const enterCallback = useRef(onEnter);
  const phaseRef = useRef(view);
  const [phase, setPhase] = useState(view);
  const [state, setState] = useState('loading');
  enterCallback.current = onEnter;

  const updatePhase = next => {
    phaseRef.current = next;
    setPhase(next);
  };

  useEffect(() => {
    let active = true;
    const sheet = document.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = base + 'studio/studio.css';
    document.head.append(sheet);
    import(/* @vite-ignore */ new URL(base + 'studio/studio.js', window.location.origin).href)
      .then(({ mountStudio }) => {
        if (!active) return;
        scene.current = mountStudio(mount.current, {
          screenElement: screen.current,
          initialView: initialView.current,
          onTransitionStart: direction => {
            if (active) updatePhase(direction === 'enter' ? 'entering' : 'exiting');
          },
          onEnter: () => {
            if (!active) return;
            updatePhase('screen');
            scene.current?.setActive(false);
            enterCallback.current();
            requestAnimationFrame(() => document.getElementById('content')?.focus({ preventScroll: true }));
          },
          onExit: () => {
            if (!active) return;
            updatePhase('studio');
            requestAnimationFrame(() => mount.current?.querySelector('.pb-play')?.focus({ preventScroll: true }));
          },
          onReady: () => { if (active) setState('ready'); },
          onError: () => { if (active) setState('failed'); },
        });
      })
      .catch(() => { if (active) setState('failed'); });
    return () => {
      active = false;
      scene.current?.destroy();
      scene.current = null;
      sheet.remove();
    };
  }, []);

  useEffect(() => {
    if (state === 'failed') {
      updatePhase(view);
      return;
    }
    if (state !== 'ready' || !scene.current) return;
    if (view === 'screen') {
      if (phaseRef.current === 'studio' || phaseRef.current === 'exiting') scene.current.enter();
      else if (phaseRef.current === 'screen') scene.current.setActive(false);
    } else {
      if (phaseRef.current === 'screen' || phaseRef.current === 'entering') scene.current.exit();
      else if (phaseRef.current === 'studio') scene.current.setActive(true);
    }
  }, [view, state]);

  const interactive = phase === 'screen';
  return (
    <div className="studio-landing" data-studio-state={state} data-view={phase}>
      <div className="studio-landing__mount" ref={mount} aria-hidden={interactive} inert={interactive}/>
      <picture className="studio-landing__cover" aria-hidden="true">
        <source media="(orientation: portrait)" srcSet={base + 'studio/cover-phone.jpg'}/>
        <img src={base + 'studio/cover-wide.jpg'} alt=""/>
      </picture>
      <div className="studio-landing__screen" ref={screen} aria-hidden={!interactive} inert={!interactive}>
        {children}
      </div>
      {state !== 'ready' && phase === 'studio' && (
        <div className={'studio-landing__fallback' + (state === 'failed' ? ' is-unavailable' : '')}>
          <span role="status">{state === 'failed' ? t('studioFailed') : t('studioLoading')}</span>
          <a href="#/screen">{t('enterSections')}</a>
        </div>
      )}
    </div>
  );
}
