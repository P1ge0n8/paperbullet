import { ContentBlocks, contentAsset } from './ContentBlocks';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowLeft, Check, LinkSimple } from '@phosphor-icons/react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(useGSAP, ScrollTrigger);
import { articles, readRoute } from './articles';
import { contacts } from './contacts';
import { episodes } from './episodes';
import { IndexCoin } from './IndexCoin';
import { collectionForRoute } from './collections';
import { Directory, CollectionList } from './CollectionPages';
const idleVisorLabels = ['PAPERBULLET','隐姓不埋名，','缴械不投降。'];
const visorLabels = ['01 COLUMNS','02 FILM FEST','03 PODCAST','04 VOICES','05 ABOUT US'];
const asset = name => import.meta.env.BASE_URL + 'assets/' + name;
const routes = ['/columns','/festivals','/podcast','/interviews','/about'];
const sections = [
  { title: '专栏', english: 'COLUMNS', description: '在日常里，继续看电影。影评、随笔，与银幕内外的观察。' },
  { title: '影展专题', english: 'FILM FESTIVALS', description: '从第一场到最后一场，记录影展中的电影、相遇与回声。' },
  { title: '播客', english: 'PODCAST', description: '散场以后，继续聊电影。让关于电影的对话留在耳边。' },
  { title: '深度访谈', english: 'CONVERSATIONS', description: '走近镜头背后的人，听他们讲述创作的来路。' },
  { title: '关于锵稿', english: 'PAPERBULLET', description: '锵稿，一个关于电影的独立内容空间。通过文章、播客与访谈，继续银幕之外的对话。' },
];
// A small bitmap alphabet renders actual display pixels, rather than a smooth text overlay.
const glyphs = {
 G:['01110','10001','10000','10111','10001','10001','01110'],
 '!':['00100','00100','00100','00100','00100','00000','00100'],
 ' ':['00000','00000','00000','00000','00000','00000','00000'],
 '0':['01110','10001','10011','10101','11001','10001','01110'],
 '1':['00100','01100','00100','00100','00100','00100','01110'],
 '2':['01110','10001','00001','00010','00100','01000','11111'],
 '3':['11110','00001','00001','01110','00001','00001','11110'],
 '4':['00010','00110','01010','10010','11111','00010','00010'],
 '5':['11111','10000','10000','11110','00001','00001','11110'],
 C:['01111','10000','10000','10000','10000','10000','01111'],
 D:['11110','10001','10001','10001','10001','10001','11110'],
 F:['11111','10000','10000','11110','10000','10000','10000'],
 I:['11111','00100','00100','00100','00100','00100','11111'],
 M:['10001','11011','10101','10101','10001','10001','10001'],
 N:['10001','11001','10101','10011','10001','10001','10001'],
 O:['01110','10001','10001','10001','10001','10001','01110'],
 S:['01111','10000','10000','01110','00001','00001','11110'],
 V:['10001','10001','10001','10001','10001','01010','00100'],
 P:['11110','10001','10001','11110','10000','10000','10000'],
 A:['01110','10001','10001','11111','10001','10001','10001'],
 E:['11111','10000','10000','11110','10000','10000','11111'],
 R:['11110','10001','10001','11110','10100','10010','10001'],
 B:['11110','10001','10001','11110','10001','10001','11110'],
 U:['10001','10001','10001','10001','10001','10001','01110'],
 L:['10000','10000','10000','10000','10000','10000','11111'],
 T:['11111','00100','00100','00100','00100','00100','00100'],
};
function PixelCode({ text, className = '' }) {
 return <svg className={'pixel-code '+className} viewBox={`0 0 ${text.length*6} 7`} role="img" aria-label={text}><g fill="currentColor">{[...text].flatMap((char,i)=>(glyphs[char]||glyphs[' ']).flatMap((row,y)=>[...row].map((pixel,x)=>pixel==='1'?<rect key={`${i}-${y}-${x}`} x={i*6+x} y={y} width=".78" height=".78"/>:null)))}</g></svg>;
}
function ArticleMeta({ article }) {
 return <span className="publication-meta">作者：{article.author || '待署名（样稿）'}<span>·</span>{article.publishedAt?<time dateTime={article.publishedAt}>{article.publishedAt.replace('T',' ')}</time>:'未正式刊发'}<span>·</span>约 {article.minutes} 分钟</span>;
}
const chineseVisorCache=new Map();
function Visor({ boosted, label = 'PAPERBULLET' }) {
 const canvas = useRef(null);
 const boost = useRef(boosted);
 useEffect(() => { boost.current = boosted; }, [boosted]);
 useGSAP(() => {
  const ctx = canvas.current.getContext('2d');
  let last = -1;
  const started=performance.now();
  // Bake dense Chinese dots and their glow once, not thousands of blurred draws per frame.
  let chinese=chineseVisorCache.get(label);
  if(!chinese&&/[^\x00-\x7F]/.test(label)){
   const raster=document.createElement('canvas');
   const ink=raster.getContext('2d');
   const font='600 24px "PingFang SC", "Microsoft YaHei", sans-serif';
   ink.font=font;raster.width=Math.ceil(ink.measureText(label).width)+4;raster.height=32;
   ink.font=font;ink.textBaseline='top';ink.fillText(label,2,2);
   const pixels=ink.getImageData(0,0,raster.width,raster.height).data;
   const dots=new Path2D();
   for(let y=0;y<raster.height;y++)for(let x=0;x<raster.width;x++)if(pixels[(y*raster.width+x)*4+3]>70)dots.rect(x*2.5,y*2.5,1.9,1.9);
   const layer=document.createElement('canvas');
   layer.width=Math.ceil(raster.width*2.5)+48;layer.height=128;
   const glow=layer.getContext('2d');
   glow.translate(24,24);glow.fillStyle='#ff3545';glow.shadowColor='#ff092b';glow.shadowBlur=10;glow.fill(dots);
   chinese={width:raster.width,height:raster.height,layer};
   chineseVisorCache.set(label,chinese);
  }
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
    const fade=reduced?1:Math.min(1,(performance.now()-started)/220);
    const pitch=10 * Math.min(1,10/label.length), gap=pitch*6;
    const textWidth=chinese?chinese.width*2.5:(label.length-1)*gap+4.7*pitch;
    // Center the complete pixel run in visor space, following the lens slope.
    ctx.transform(1,.135,0,1,675-textWidth/2,645-(chinese?chinese.height*1.25:33.5)-.135*textWidth/2);
    ctx.fillStyle='#ff3545';
    ctx.shadowColor='#ff092b';ctx.shadowBlur=boost.current?19:10;
    if(chinese){
     ctx.shadowBlur=0;
     ctx.globalAlpha=fade*(reduced?.95:.92);
     ctx.drawImage(chinese.layer,-24+(glitch?(frame%2?3:-3):0),-24);
    }else [...label].forEach((char,i) => glyphs[char].forEach((row,y) => [...row].forEach((pixel,x) => {
     if(pixel !== '1') return;
     const shift=glitch && y%3===frame%3 ? gsap.utils.random(-18,18,6) : 0;
     ctx.globalAlpha=fade*(reduced? .95 : (glitch && (i+y+frame)%7===0 ? .2 : .88 + .1*Math.sin(time*2)));
     ctx.fillRect(i*gap+x*pitch+shift,y*10,pitch*.7,7);
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
 }, {scope:canvas, dependencies:[label], revertOnUpdate:true});
 return <canvas className="visor" data-label={label} ref={canvas} width="1536" height="1024" aria-hidden="true"/>;
}
function Home({ enter }) {
 const root=useRef(null), moving=useRef(false), transition=useRef(null);
 const [hovered,setHovered]=useState(false),[indexOpen,setIndexOpen]=useState(false),[signal,setSignal]=useState(null),[idleIndex,setIdleIndex]=useState(0);
 useEffect(()=>{
  if(hovered||signal||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const timer=setInterval(()=>{if(!document.hidden&&!moving.current)setIdleIndex(i=>(i+1)%idleVisorLabels.length);},4200);
  return ()=>clearInterval(timer);
 },[hovered,signal]);
 const {contextSafe}=useGSAP(()=>{
  window.scrollTo(0,0);
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)
   transition.current=gsap.from('.hero-shift',{autoAlpha:0,y:18,duration:1,ease:'power3.out'});
 },{scope:root});
 const proceed=contextSafe(()=>{
  if(indexOpen)return;
  setIndexOpen(true);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop=matchMedia('(min-width: 801px)').matches;
  transition.current?.kill();
  transition.current=gsap.timeline({defaults:{ease:'power3.out',duration:reduced?0:.7}})
   .to('.continue-button',{autoAlpha:0,duration:reduced?0:.2})
   .to('.hero-shift',{x:desktop?'10vw':0,y:desktop?0:'-22vh',scale:desktop?.84:.72,autoAlpha:1},0)
   .fromTo('.entry-index',{autoAlpha:0,y:16},{autoAlpha:1,y:0},reduced?0:.2);
 });
 const reset=contextSafe(event=>{
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  transition.current?.kill();
  moving.current=false;
  setIndexOpen(false);setHovered(false);setSignal(null);setIdleIndex(0);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  transition.current=gsap.timeline({defaults:{ease:'power3.out',duration:reduced?0:.55}})
   .set('.visor-scan rect',{x:0})
   .to('.entry-index',{autoAlpha:0,y:16,duration:reduced?0:.18},0)
   .to('.hero-shift',{x:0,y:0,scale:1,autoAlpha:1},0)
   .to('.continue-button',{autoAlpha:1,duration:reduced?0:.25},reduced?0:.2);
 });
 const open=contextSafe((event,index)=>{
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();if(moving.current)return;moving.current=true;
  setSignal(visorLabels[index]);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  transition.current?.kill();
  transition.current=gsap.timeline({onComplete:()=>enter(routes[index])})
   .fromTo('.visor-scan rect',{x:180},{x:1160,duration:reduced?0:.48,ease:'power2.inOut'})
   .to('.hero-shift, .entry-index',{autoAlpha:0,duration:reduced?0:.22});
 });
 return <main ref={root} className="entry-page">
  <a className="home-logo" href="#/" onClick={reset} aria-label="PAPERBULLET 锵稿首页"><img src={asset('logo.jpg')} width="80" height="80" alt="锵稿"/></a>
  <section className="hero" aria-label="PAPERBULLET 机械眼镜"><h1 className="sr-only">锵稿 PAPERBULLET</h1><div className="hero-shift">
   <button className={`goggles-stage ${hovered?'ignited':''}`} onPointerEnter={()=>setHovered(true)} onPointerLeave={()=>setHovered(false)} onFocus={()=>setHovered(true)} onBlur={()=>setHovered(false)} onClick={proceed} aria-label="点击眼镜，展开栏目索引" aria-expanded={indexOpen} aria-controls="entry-index">
    <span className="goggles-assembly"><img className="goggles" src={asset('goggles.png')} width="1536" height="1024" alt="紫灰色机械眼镜，带有红色像素显示屏"/><svg className="damage-sparks" viewBox="0 0 1536 1024" aria-hidden="true"><g className="spark-cluster spark-one" transform="translate(290 430)"><path d="M-5 2L-17 -8M3 -3L10 -20M6 4L22 10"/><circle r="2.4"/></g><g className="spark-cluster spark-two" transform="translate(1150 460)"><path d="M-4 -2L-13 -12M3 -4L9 -16M5 3L17 8"/><circle r="2"/></g><g className="spark-cluster spark-three" transform="translate(1015 800)"><path d="M-3 0L-14 5M3 -2L13 -11M3 4L8 17"/><circle r="2"/></g></svg><Visor boosted={hovered} label={hovered && !moving.current ? 'BANG!' : signal||idleVisorLabels[idleIndex]}/><svg className="visor-scan" viewBox="0 0 1536 1024" aria-hidden="true"><defs><clipPath id="screen-clip"><path d="M250 518L430 562L610 594L1095 642L1095 741L1001 753L954 789L771 778L690 700L534 674L469 725L321 684L289 634L243 611Z"/></clipPath></defs><g clipPath="url(#screen-clip)"><rect x="0" y="500" width="24" height="310" fill="#ff8f95"/></g></svg></span>
   </button>
  </div></section>
  <aside id="entry-index" className="entry-index" inert={!indexOpen}><span className="micro red">PAPERBULLET / INDEX</span><nav aria-label="栏目索引">{sections.map((section,i)=><a href={"#"+routes[i]} key={section.title} onMouseEnter={()=>setSignal(visorLabels[i])} onFocus={()=>setSignal(visorLabels[i])} onMouseLeave={()=>setSignal(null)} onBlur={()=>setSignal(null)} onClick={e=>open(e,i)}><IndexCoin index={i}/><span>{section.title}</span></a>)}</nav><p>隐姓不埋名，<br/>缴械不投降。</p></aside>
  <button className="continue-button" tabIndex={indexOpen?-1:0} onClick={proceed}>BANG ! <ArrowUpRight size={16}/></button>
 </main>;
}
function Header({ route, navigate }) {
 return <header className="editorial-header"><a href="#/" className="wordmark" onClick={e=>navigate(e,'/')}><img src={asset('logo.jpg')} width="43" height="43" alt="锵稿"/><span className="wordmark-copy"><span className="wordmark-english">PAPERBULLET</span><small>锵稿 · 缴械不投降</small></span></a><nav aria-label="内容导航">{sections.map((s,i)=><a key={s.title} href={'#'+routes[i]} aria-current={(route===routes[i]||route.startsWith(routes[i]+'/')||(i===0&&route.startsWith('/read/')))?'page':undefined} onClick={e=>navigate(e,routes[i])}><span className="header-nav-label">{s.title}</span><span className="header-nav-icon"><IndexCoin index={i}/></span></a>)}</nav><a href="#/" className="index-return" onClick={e=>navigate(e,'/')}><ArrowLeft size={16}/> 首页</a></header>;
}
function Footer() {
 return <footer className="editorial-footer"><span>PAPERBULLET@2026</span></footer>;
}
function CollectionPage({ route, navigate }) {
 const kind=route.split('/')[1];
 const collection=collectionForRoute(route);
 return <main className="content-page directory-page" id="content" tabIndex={-1}>{collection?<CollectionList collection={collection} kind={kind} navigate={navigate}/>:<Directory kind={kind} navigate={navigate}/>}<Footer navigate={navigate}/></main>;
}
function Reader({ article:a, route, navigate }) {
 const collection=collectionForRoute(route);
 const parentPath=collection?route.split('/').slice(0,3).join('/'):'/columns';
 const articlePath=id=>collection?parentPath+'/read/'+id:'/read/'+id;
 const [copied,setCopied]=useState(false),[copyError,setCopyError]=useState(false);
 const root=useRef(null), timer=useRef(null);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 useGSAP(()=>{gsap.fromTo('.reading-progress',{scaleX:0},{scaleX:1,ease:'none',scrollTrigger:{trigger:'.article-body',start:'top 35%',end:'bottom bottom',scrub:true}});},{scope:root});
 async function copy(){try{await navigator.clipboard.writeText(location.href);setCopied(true);clearTimeout(timer.current);timer.current=setTimeout(()=>setCopied(false),2200);}catch{setCopyError(true);}}
 const readingPool=collection?articles.filter(item=>a.sample?item.sample:collection.articleIds.includes(item.id)):articles.filter(item=>item.sample===a.sample);
 const next=readingPool.length>1?readingPool[(readingPool.indexOf(a)+1)%readingPool.length]:null;
 return <main ref={root} className="reader-page" id="content" tabIndex={-1}>
  <div className="reading-progress" aria-hidden="true"/>
  <div className="reader-topline"><a href={"#"+parentPath} onClick={e=>navigate(e,parentPath)}><ArrowLeft size={16}/> {collection?"返回"+collection.name+" · 文章列表":"返回专栏"}</a><span className="micro">PB—{a.number} / {a.category}</span></div>
  <header className="article-heading">{collection&&a.sample&&<p className="reader-demo-note">阅读排版示例 · {route.startsWith("/columns/")?"非"+collection.name+"作品":"非"+collection.name+"报道"}</p>}<div className="story-meta"><span>{a.category}</span>{a.sample&&<span>示例文章</span>}</div><h1>{a.title.split('\n').map((x,i)=><span key={i}>{x}</span>)}</h1><p>{a.subtitle}</p><div className="article-byline"><ArticleMeta article={a}/><button onClick={copy}>{copied?<Check size={16}/>:<LinkSimple size={16}/>} {copied?'链接已复制':'复制链接'}</button></div><span role="status" className="copy-status">{copyError?'请从浏览器地址栏复制本文链接。':''}</span></header>
  <div className="article-layout"><aside className="reader-aside"><span className="micro">IN THIS ARTICLE</span><nav aria-label="文章目录">{(a.blocks?a.blocks.map((b,i)=>({...b,title:b.text,blockIndex:i})).filter(b=>['h2','h3'].includes(b.type)):a.sections).map((s,i)=><button key={s.title} onClick={()=>root.current.querySelector(a.blocks?'#block-'+s.blockIndex:'#part-'+i)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})}><span>0{i+1}</span>{s.title}</button>)}</nav></aside>
   <article className="article-body">{a.cover&&<img className="article-cover" src={contentAsset(a.cover)} alt=""/>}{a.blocks?<ContentBlocks blocks={a.blocks}/>:<><p className="article-lede">{a.intro}</p>{a.sections.map((s,i)=><section key={s.title} id={'part-'+i}><h2>{s.title}</h2>{s.paragraphs.map(p=><p key={p}>{p}</p>)}{i===0&&<blockquote>{a.quote}</blockquote>}</section>)}</>}<p className="end-mark">PAPERBULLET</p>{a.sample&&<div className="sample-note">本文为阅读体验示例，非正式刊发内容。</div>}</article>
  </div>
  {next&&<a className="next-story" href={'#'+articlePath(next.id)} onClick={e=>navigate(e,articlePath(next.id))}><span className="micro">继续阅读 / NEXT</span><h2>{next.shortTitle}</h2><ArrowUpRight size={30} weight="light"/></a>}
  <Footer navigate={navigate}/>
 </main>;
}
function ContactSection() {
 return <section className="contact-section" aria-labelledby="contact-title"><div><span className="micro red">KEEP IN TOUCH</span><h2 id="contact-title">让对话继续。</h2><p>阅读、收听，或把你的想法写给我们。</p></div><div className="contact-list">{contacts.map((contact,i)=>{const content=<>{contact.name==='小宇宙'?<img className="platform-logo" src={asset('xiaoyuzhou.png')} alt=""/>:<PixelCode text={'0'+(i+1)}/>}<div><h3>{contact.name}</h3><p>{contact.detail}</p></div>{contact.url?<ArrowUpRight size={21}/>:<span className="contact-pending">入口待补充</span>}</>;return contact.url?<a key={contact.name} href={contact.url} target={contact.url.startsWith('mailto:')?undefined:'_blank'} rel="noopener noreferrer">{content}</a>:<div key={contact.name}>{content}</div>;})}</div></section>;
}
function About({ navigate }) {
 return <main className="content-page about-page" id="content" tabIndex={-1}><span className="micro red">05 / ABOUT PAPERBULLET</span><h1>隐姓不埋名，<br/>缴械不投降。</h1><div className="about-intro"><span className="micro">电影与声音<br/>FILM & VOICE</span><div><p>锵稿是一个关于电影的独立内容空间。<br/>我们写影评、走进影展，也通过播客与访谈，听见镜头背后的人。</p><p>电影散场以后，问题仍然值得被追问。我们希望把观看变成对话，把一个人的感受，带到更多人的日常里。</p></div></div><div className="about-values">{[['01','认真观看','从一个镜头、一段声音和一次真实的感受出发。'],['02','保留分歧','让不同的理解相遇，给尚未形成的判断留一点时间。'],['03','继续对话','在文章、影展和声音之间，继续银幕之外的交流。']].map(([n,t,p])=><section key={n}><span className="micro red">{n}</span><h2>{t}</h2><p>{p}</p></section>)}</div><a className="about-cta" href="#/columns" onClick={e=>navigate(e,'/columns')}>从一篇文字开始 <ArrowUpRight size={28}/></a><ContactSection/><Footer navigate={navigate}/></main>;
}
function Podcast({ navigate }) {
 return <main className="content-page directory-page episode-page" id="content" tabIndex={-1}>
  <header className="directory-heading"><span className="micro red">03 / PODCAST</span><h1>播客</h1><p>保留意见：<span className="podcast-divider"> / </span>散场以后，继续聊电影。</p></header>
  <div className="directory-bar"><span>单集节目</span><span className="micro">{episodes.length} EPISODES</span></div>
  <section className="episode-grid" aria-label="播客单集">{episodes.map((episode,i)=><a className="episode-card" href={episode.url} target="_blank" rel="noopener noreferrer" key={episode.url} aria-label={episode.title+' — 在小宇宙收听（新标签页）'}>
   <img className="episode-cover" src={contentAsset(episode.cover||'/assets/podcast-cover.png')} width="1000" height="1000" alt="" loading={i<4?'eager':'lazy'}/>
   <div className="episode-meta"><span>保留意见：</span>{episode.access?<small>{episode.access}</small>:episode.duration?<small>{episode.duration}</small>:null}</div>
   <h2>{episode.title}</h2>{episode.publishedAt&&<time className="episode-date" dateTime={episode.publishedAt}>{episode.publishedAt.replace('T',' ')}</time>}<span className="episode-listen">在小宇宙收听 <ArrowUpRight size={16}/></span>
  </a>)}</section>
  <a className="podcast-all" href="https://www.xiaoyuzhoufm.com/podcast/68c436b4de7cd32c37b1c4a8" target="_blank" rel="noopener noreferrer">在小宇宙查看完整节目与最新更新 <ArrowUpRight size={18}/></a>
  <Footer navigate={navigate}/>
 </main>;
}
function Section({ index, navigate }) {
 const s=sections[index];return <main className="content-page pending-page" id="content" tabIndex={-1}><span className="micro red">0{index+1} / {s.english}</span><h1>{s.title}</h1><p className="pending-description">{s.description}</p><div className="pending-note"><span className="micro">COMING SOON</span><h2>还在准备中。</h2><p>新的内容，会在这里与你见面。</p><a href="#/columns" onClick={e=>navigate(e,'/columns')}>先去专栏看看 <ArrowUpRight size={19}/></a></div><Footer navigate={navigate}/></main>;
}
export function App(){
 const [route,setRoute]=useState(()=>readRoute(location.hash));
 useEffect(()=>{const change=()=>setRoute(readRoute(location.hash));window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);},[]);
 useEffect(()=>{if(route!=='/'){window.scrollTo(0,0);document.getElementById('content')?.focus({preventScroll:true});}const a=articles.find(x=>route.endsWith('/read/'+x.id));const collection=collectionForRoute(route);document.title=(a?a.shortTitle:collection?collection.name:route==='/columns'?'专栏':route==='/about'?'关于锵稿':sections[routes.indexOf(route)]?.title||'隐姓不埋名，缴械不投降。')+' — PAPERBULLET 锵稿';},[route]);
 function enter(path){location.hash=path;}
 function navigate(e,path){if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();enter(path);}
 if(route==='/')return <div className="page-arrival" key={route}><Home enter={enter}/></div>;
 const article=articles.find(a=>route.endsWith('/read/'+a.id));
 return <div className="editorial-shell"><a className="skip-link" href="#content" onClick={e=>{e.preventDefault();document.getElementById('content')?.focus();}}>跳至主要内容</a><Header route={route} navigate={navigate}/><div className="page-arrival" key={route}>{article?<Reader key={route} article={article} route={route} navigate={navigate}/>:route.startsWith('/columns')||route.startsWith('/festivals')?<CollectionPage route={route} navigate={navigate}/>:route==='/about'?<About navigate={navigate}/>:route==='/podcast'?<Podcast navigate={navigate}/>:<Section index={routes.indexOf(route)} navigate={navigate}/>}</div></div>;
}
