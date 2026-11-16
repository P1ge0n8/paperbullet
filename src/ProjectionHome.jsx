import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft } from '@phosphor-icons/react';
import { IndexCoin } from './IndexCoin';
import './projection-home.css';

const base = import.meta.env.BASE_URL;

function IndexBrand() {
  const chinese = useRef(null);
  const english = useRef(null);

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
    <div className="projection-index__brand">
      <img src={base + 'assets/logo.jpg'} width="112" height="112" alt=""/>
      <h1 ref={chinese}>锵稿</h1>
      <span lang="en" ref={english}>PAPERBULLET</span>
    </div>
  );
}

export function ProjectionIndex({ sections, routes, preview = false }) {
  return (
    <div className="projection-index">
      <header className="projection-index__top">
        <span>栏目索引 <i aria-hidden="true">/</i> <span lang="en">INDEX</span></span>
        <a href="#/" className="projection-return"><ArrowLeft size={16}/> 返回摄影棚</a>
      </header>
      <main id={preview ? undefined : 'content'} tabIndex={preview ? undefined : -1} className="projection-index__body">
        <IndexBrand/>
        <nav className="projection-index__links" aria-label="栏目索引">
          {sections.map((section, index) => (
            <a key={routes[index]} href={'#' + routes[index]}>
              <IndexCoin index={index}/>
              <span className="projection-index__name">{section.title}</span>
              <span className="projection-index__english" lang="en">{section.english}</span>
            </a>
          ))}
        </nav>
      </main>
      <footer className="projection-index__foot">PAPERBULLET@2026</footer>
    </div>
  );
}

export function StudioLanding({ sections, routes }) {
  const mount = useRef(null);
  const screen = useRef(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    let active = true;
    let instance;
    const sheet = document.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = base + 'studio/studio.css';
    document.head.append(sheet);

    const moduleUrl = base + 'studio/studio.js';
    import(/* @vite-ignore */ moduleUrl)
      .then(async ({ mountStudio }) => {
        if (!active) return;
        const studio = await mountStudio(mount.current, {
          screenElement: screen.current,
          onEnter: () => { if (active) location.hash = '/screen'; },
          onReady: () => { if (active) setState('ready'); },
          onError: () => { if (active) setState('failed'); }
        });
        if (active) instance = studio;
        else studio?.destroy();
      })
      .catch(() => { if (active) setState('failed'); });
    return () => {
      active = false;
      instance?.destroy();
      sheet.remove();
    };
  }, []);

  return (
    <div className="studio-landing" data-studio-state={state}>
      <div className="studio-landing__mount" ref={mount}/>
      <picture className="studio-landing__cover" aria-hidden="true">
        <source media="(orientation: portrait)" srcSet={base + 'studio/cover-phone.jpg'}/>
        <img src={base + 'studio/cover-wide.jpg'} alt=""/>
      </picture>
      <div className="studio-landing__screen" ref={screen} aria-hidden="true" inert>
        <ProjectionIndex sections={sections} routes={routes} preview/>
      </div>
      {state !== 'ready' && (
        <div className={'studio-landing__fallback' + (state === 'failed' ? ' is-unavailable' : '')}>
          <span role="status">{state === 'failed' ? '摄影棚未能载入' : '正在装片…'}</span>
          <a href="#/screen">直接进入栏目</a>
        </div>
      )}
    </div>
  );
}
