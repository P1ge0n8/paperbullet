import { ContentBlocks, contentAsset } from './ContentBlocks';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowLeft, Check, LinkSimple } from '@phosphor-icons/react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(useGSAP, ScrollTrigger);
import { articles, readRoute } from './articles';
import { ProjectionIndex, StudioLanding } from './ProjectionHome';
import { contacts } from './contacts';
import { episodes } from './episodes';
import { IndexCoin } from './IndexCoin';
import { collectionForRoute } from './collections';
import { Directory, CollectionList } from './CollectionPages';
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
function Header({ route, navigate }) {
 return <header className="editorial-header"><a href="#/screen" aria-label="锵稿栏目索引" className="wordmark" onClick={e=>navigate(e,'/screen')}><img src={asset('logo.jpg')} width="43" height="43" alt="锵稿"/><span className="wordmark-copy"><span className="wordmark-english">PAPERBULLET</span><small>锵稿 · 缴械不投降</small></span></a><nav aria-label="内容导航">{sections.map((s,i)=><a key={s.title} href={'#'+routes[i]} aria-current={(route===routes[i]||route.startsWith(routes[i]+'/')||(i===0&&route.startsWith('/read/')))?'page':undefined} onClick={e=>navigate(e,routes[i])}><span className="header-nav-label">{s.title}</span><span className="header-nav-icon"><IndexCoin index={i}/></span></a>)}</nav><a href="#/" className="index-return" onClick={e=>navigate(e,'/')}><ArrowLeft size={16}/> 返回摄影棚</a></header>;
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
 return <main className="content-page about-page" id="content" tabIndex={-1}><span className="micro red">05 / ABOUT PAPERBULLET</span><h1>隐姓不埋名，<br/>缴械不投降。</h1><div className="about-intro"><span className="micro">电影与声音<br/>FILM & VOICE</span><div><p>锵稿是一个关于电影的独立内容空间。<br/>我们写影评、走进影展，也通过播客与访谈，听见镜头背后的人。</p><p>电影散场以后，问题仍然值得被追问。我们希望把观看变成对话，把一个人的感受，带到更多人的日常里。</p></div></div><Footer navigate={navigate}/></main>;
}
function Podcast({ navigate }) {
 const [program,setProgram]=useState('overthink');
 const selectedEpisodes=episodes.filter(e=>(e.program||'reserved')===program);
 return <main className="content-page directory-page episode-page" id="content" tabIndex={-1}>
  <header className="directory-heading"><span className="micro red">03 / PODCAST</span><h1>播客</h1></header>
  <nav className="podcast-programs" aria-label="选择播客栏目">
   <button type="button" aria-pressed={program==='overthink'} onClick={()=>setProgram('overthink')}><span className="program-art overthink-art"><img src={asset('overthink-reference.jpg')} alt="过度解读封面"/></span><span className="program-title">过度解读</span></button>
   <button type="button" aria-pressed={program==='reserved'} onClick={()=>setProgram('reserved')}><span className="program-art"><img src={asset('podcast-cover.png')} alt="保留意见封面"/></span><span className="program-title">保留意见</span></button>
  </nav>
  {program&&<>
  <div className="directory-bar"><span>{program==='overthink'?'过度解读':'保留意见'}</span><span className="micro">{selectedEpisodes.length} EPISODES</span></div>
  <section className={'episode-grid '+(program==='overthink'?'episode-grid-wide':'')} aria-label="播客单集">{selectedEpisodes.map((episode,i)=><a className="episode-card" href={episode.url} target="_blank" rel="noopener noreferrer" key={episode.url} aria-label={episode.title+' — 在小宇宙收听（新标签页）'}>
   <img className="episode-cover" src={contentAsset(episode.cover||'/assets/podcast-cover.png')} alt="" loading={i<4?'eager':'lazy'}/>
   <h2>{episode.title}</h2>
   <div className="episode-meta">{episode.access?<small>{episode.access}</small>:episode.duration?<small>{episode.duration}</small>:null}{episode.publishedAt&&<time className="episode-date" dateTime={episode.publishedAt}>{episode.publishedAt.replace('T',' ')}</time>}</div>
   <span className="episode-listen">在小宇宙收听 <ArrowUpRight size={16}/></span>
  </a>)}</section>
  <a className="podcast-all" href={'https://www.xiaoyuzhoufm.com/podcast/'+(program==='overthink'?'6980695b5e2695907935a7b6':'68c436b4de7cd32c37b1c4a8')} target="_blank" rel="noopener noreferrer">在小宇宙查看完整节目与最新更新 <ArrowUpRight size={18}/></a>
  </>}
  <Footer navigate={navigate}/>
 </main>;
}
function Section({ index, navigate }) {
 const s=sections[index];return <main className="content-page pending-page" id="content" tabIndex={-1}><span className="micro red">0{index+1} / {s.english}</span><h1>{s.title}</h1><p className="pending-description">{s.description}</p><div className="stay-tuned">stay tuned</div><Footer navigate={navigate}/></main>;
}
export function App(){
 const [route,setRoute]=useState(()=>readRoute(location.hash));
 useEffect(()=>{const change=()=>setRoute(readRoute(location.hash));window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);},[]);
 useEffect(()=>{if(route!=='/'){window.scrollTo(0,0);document.getElementById('content')?.focus({preventScroll:true});}const a=articles.find(x=>route.endsWith('/read/'+x.id));const collection=collectionForRoute(route);document.title=(a?a.shortTitle:collection?collection.name:route==='/screen'?'栏目索引':route==='/columns'?'专栏':route==='/about'?'关于锵稿':sections[routes.indexOf(route)]?.title||'隐姓不埋名，缴械不投降。')+' — PAPERBULLET 锵稿';},[route]);
 function enter(path){location.hash=path;}
 function navigate(e,path){if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();enter(path);}
 if(route==='/')return <StudioLanding sections={sections} routes={routes}/>;
 if(route==='/screen')return <ProjectionIndex sections={sections} routes={routes}/>;
 const article=articles.find(a=>route.endsWith('/read/'+a.id));
 return <div className="editorial-shell"><a className="skip-link" href="#content" onClick={e=>{e.preventDefault();document.getElementById('content')?.focus();}}>跳至主要内容</a><Header route={route} navigate={navigate}/><div className="page-arrival" key={route}>{article?<Reader key={route} article={article} route={route} navigate={navigate}/>:route.startsWith('/columns')||route.startsWith('/festivals')?<CollectionPage route={route} navigate={navigate}/>:route==='/about'?<About navigate={navigate}/>:route==='/podcast'?<Podcast navigate={navigate}/>:<Section index={routes.indexOf(route)} navigate={navigate}/>}</div></div>;
}
