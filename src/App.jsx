import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, X } from '@phosphor-icons/react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin);
const sections = [
  { title: '专栏', english: 'COLUMNS', description: '在日常里，继续看电影。影评、随笔，与银幕内外的观察。' },
  { title: '影展专题', english: 'FILM FESTIVALS', description: '从第一场到最后一场，记录影展中的电影、相遇与回声。' },
  { title: '播客', english: 'PODCAST', description: '散场以后，继续聊电影。让关于电影的对话留在耳边。' },
  { title: '深度访谈', english: 'CONVERSATIONS', description: '走近镜头背后的人，听他们讲述创作的来路。' },
  { title: '关于锵稿', english: 'PAPERBULLET', description: '锵稿，一个关于电影的独立内容空间。通过文章、播客与访谈，继续银幕之外的对话。' },
];
// A small bitmap alphabet renders actual display pixels, rather than a smooth text overlay.
const glyphs = {
 P:['11110','10001','10001','11110','10000','10000','10000'],
 A:['01110','10001','10001','11111','10001','10001','10001'],
 E:['11111','10000','10000','11110','10000','10000','11111'],
 R:['11110','10001','10001','11110','10100','10010','10001'],
 B:['11110','10001','10001','11110','10001','10001','11110'],
 U:['10001','10001','10001','10001','10001','10001','01110'],
 L:['10000','10000','10000','10000','10000','10000','11111'],
 T:['11111','00100','00100','00100','00100','00100','00100'],
};
function Visor({ boosted }) {
 const canvas = useRef(null);
 const boost = useRef(boosted);
 useEffect(() => { boost.current = boosted; }, [boosted]);
 useGSAP(() => {
  const ctx = canvas.current.getContext('2d');
  let last = -1;
  const mm = gsap.matchMedia();
  mm.add({ motion:'(prefers-reduced-motion: no-preference)', reduced:'(prefers-reduced-motion: reduce)' }, media => {
   const reduced = media.conditions.reduced;
   const draw = time => {
    if (document.hidden) return;
    const frame = Math.floor(time * 16);
    if (!reduced && frame === last) return;
    last = frame;
    const phase = time % 6;
    const glitch = !reduced && (phase > 4.8 && phase < 5.15);
    ctx.clearRect(0,0,1536,1024);
    ctx.save();
    ctx.beginPath();
    [[250,518],[430,562],[610,594],[1095,642],[1095,741],[1001,753],[954,789],[771,778],[690,700],[534,674],[469,725],[321,684],[289,634],[243,611]].forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    ctx.closePath();ctx.clip();
    ctx.transform(1,.135,0,1,305,557);
    ctx.fillStyle='#ff3545';
    ctx.shadowColor='#ff092b';ctx.shadowBlur=boost.current?19:10;
    const pitch=10, gap=60;
    [...'PAPERBULLET'].forEach((char,i) => glyphs[char].forEach((row,y) => [...row].forEach((pixel,x) => {
     if(pixel !== '1') return;
     const shift=glitch && y%3===frame%3 ? gsap.utils.random(-18,18,6) : 0;
     ctx.globalAlpha=reduced? .95 : (glitch && (i+y+frame)%7===0 ? .2 : .88 + .1*Math.sin(time*2));
     ctx.fillRect(i*gap+x*pitch+shift,y*pitch,7,7);
    })));
    ctx.shadowBlur=0;
    if(!reduced){
     ctx.globalAlpha=.23;ctx.fillRect(0,(time*25)%90,615,2);
     if(glitch){ctx.globalAlpha=.5;ctx.fillRect(gsap.utils.random(0,480,12),gsap.utils.random(0,65,5),100,3);}
    }
    ctx.restore();
   };
   draw(0);
   if(!reduced) gsap.ticker.add(draw);
   return () => gsap.ticker.remove(draw);
  });
  return () => mm.revert();
 }, {scope:canvas});
 return <canvas className="visor" ref={canvas} width="1536" height="1024" aria-hidden="true"/>;
}
export function App() {
 const root=useRef(null), dialog=useRef(null);
 const [active,setActive]=useState(null), [ignited,setIgnited]=useState(false), [hovered,setHovered]=useState(false);
 useEffect(() => { if(active!==null) dialog.current?.showModal(); },[active]);
 const { contextSafe } = useGSAP(() => {
  const mm=gsap.matchMedia();
  mm.add({ desktop:'(min-width: 701px)', mobile:'(max-width: 700px)', reduced:'(prefers-reduced-motion: reduce)' }, media => {
   const {desktop,reduced}=media.conditions;
   gsap.set('.reveal',{autoAlpha:0,y:reduced?0:22});
   const tl=gsap.timeline({scrollTrigger:{trigger:'.scroll-scene',start:'top top',end:'+=450',scrub:reduced?true:.65},defaults:{ease:'power2.out'}});
   tl.to('.hero-shift',{x:desktop?'9vw':0,scale:desktop?.91:.78,y:desktop?0:'-15vh',duration:1},0)
     .to('.reveal',{autoAlpha:1,y:0,stagger:.095,duration:.6},.12);
   if(!reduced) gsap.from('.goggles-stage',{autoAlpha:0,y:20,duration:1.4,ease:'power3.out'});
  });
  return () => mm.revert();
 },{scope:root});
 const home=contextSafe(event => {event.preventDefault();gsap.to(window,{scrollTo:0,duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:1,ease:'power3.inOut'});});
 function close(){dialog.current?.close();setActive(null);}
 return <div ref={root}>
  <a className="skip-link" href="#index">跳至栏目索引</a>
  <main className="scroll-scene" id="main">
   <div className="viewport">
    <a className="home-logo" href="#main" aria-label="PAPERBULLET 锵稿，返回首页" onClick={home}><img src={import.meta.env.BASE_URL + "assets/logo.jpg"} width="80" height="80" alt="锵稿"/></a>
    <section className="hero" aria-label="PAPERBULLET 机械眼镜"><h1 className="sr-only">锵稿 PAPERBULLET</h1><div className="hero-shift">
     <button className={`goggles-stage ${ignited || hovered?'ignited':''}`} onPointerEnter={()=>setHovered(true)} onPointerLeave={()=>setHovered(false)} onFocus={()=>setHovered(true)} onBlur={()=>setHovered(false)} onClick={()=>setIgnited(!ignited)} aria-label="PAPERBULLET 像素显示屏，切换眼镜火焰" aria-pressed={ignited}>
      <img className="flames" src={import.meta.env.BASE_URL + "assets/flames.png"} alt=""/>
      <span className="goggles-assembly"><img className="goggles" src={import.meta.env.BASE_URL + "assets/goggles.png"} width="1536" height="1024" alt="紫灰色机械眼镜，暗红镜片内显示 PAPERBULLET 红色像素文字"/><Visor boosted={ignited || hovered}/></span>
     </button>
    </div></section>
    <aside className="sidebar" id="index">
     <nav aria-label="栏目索引">{sections.map((s,i)=><button key={s.title} className="nav-link reveal" onClick={()=>setActive(i)}><span className="nav-number">{String(i+1).padStart(2,'0')}.</span><span>{s.title}</span></button>)}</nav>
     <div className="sidebar-note reveal"><p>隐姓不埋名，<br/>缴械不投降。</p><small>PAPERBULLET · FILM & VOICE</small></div>
    </aside>
   </div>
  </main>
  <dialog ref={dialog} onCancel={()=>setActive(null)} onClose={()=>setActive(null)} onClick={e=>{if(e.target===dialog.current)close();}}>{active!==null && <div className="section-panel"><button className="close-button" aria-label="关闭栏目" onClick={close}><X size={25}/></button><span className="eyebrow">{String(active+1).padStart(2,'0')}. / {sections[active].english}</span><h2>{sections[active].title}</h2><p>{sections[active].description}</p>{active===4 ? <p className="motto">隐姓不埋名，缴械不投降。</p>:<p className="empty-note">内容正在整理，敬请期待。</p>}<button className="back-button" onClick={close}>返回首页 <ArrowUpRight size={18}/></button></div>}</dialog>
 </div>;
}
