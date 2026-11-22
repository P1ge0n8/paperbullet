import { ReaderImage, contentAsset, textStyle } from './ContentBlocks';
import { ArticleBodyBlocks, articleHeadings } from './ArticlePreface';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowLeft, Check, LinkSimple } from '@phosphor-icons/react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(useGSAP, ScrollTrigger);
import { articles, readRoute } from './articles';
import { IndexBrand, StudioLanding } from './ProjectionHome';
import { BounceSidebar } from './BounceSidebar';
import { contacts } from './contacts';
import { AboutContact } from './AboutContact';
import { episodes } from './episodes';
import { IndexCoin } from './IndexCoin';
import { archiveListPath, collectionForRoute, sectionArticles } from './collections';
import { Directory, CollectionList, SectionList } from './CollectionPages';
import { LanguageSwitcher, localizeRecord, useI18n } from './i18n';
const asset = name => import.meta.env.BASE_URL + 'assets/' + name;
const routes = ['/columns','/festivals','/podcast','/interviews','/about','/partnerships'];
const sectionOrder = [4, 0, 1, 2, 3, 5];
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
 const { t } = useI18n();
 const author=article.author || (article.sample && t('unsigned'));
 const date=article.publishedAt ? <time dateTime={article.publishedAt}>{article.publishedAt.replace('T',' ')}</time> : article.sample && t('unpublished');
 return <span className="publication-meta">{author&&<>{t('author')}{author}<span>·</span></>}{date&&<>{date}<span>·</span></>}{t('readMinutes',{count:article.minutes})}</span>;
}
function EditorialWorkspace({ route, navigate, children }) {
 const { t, sections } = useI18n();
 const sectionIndex = route.startsWith('/read/') ? 0 : routes.findIndex(path => route === path || route.startsWith(path + '/'));
 const selected = sectionOrder.indexOf(sectionIndex);
 return <div className="editorial-shell workspace" >
  <a className="skip-link" href="#content" onClick={e=>{e.preventDefault();document.getElementById('content')?.focus();}}>{t('skipContent')}</a>
  <header className="workspace-header">
   <IndexBrand href="#/" label={t('returnStudio')} heading={false} onClick={e=>navigate(e,'/')}/>
   <LanguageSwitcher/>
  </header>
  <div className="workspace-body">
   <nav className="workspace-nav" aria-label={t('sectionIndex')}>
    <BounceSidebar activeIndex={selected} onNavigate={(event, href)=>navigate(event,href.slice(1))} items={sectionOrder.map(index=>({label:sections[index].title,href:'#'+routes[index],icon:<IndexCoin index={index}/>}))}/>
   </nav>
   <div className="workspace-content"><div className="page-arrival" key={route}>{children}</div></div>
  </div>
  <Footer/>
 </div>;
}
function Footer() {
 return <footer className="editorial-footer"><span>PAPERBULLET@2026</span></footer>;
}
function CollectionPage({ route, navigate }) {
 const kind=route.split('/')[1];
 const collection=collectionForRoute(route);
 return <main className="content-page directory-page" id="content" tabIndex={-1}>{collection?<CollectionList collection={collection} kind={kind} navigate={navigate}/>:<Directory kind={kind} navigate={navigate}/>}</main>;
}
function Reader({ article:sourceArticle, route, navigate }) {
 const { t, locale, sections, collectionText } = useI18n();
 const [body,setBody]=useState(null);
 const [failed,setFailed]=useState(false);
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{
  if (!sourceArticle.archiveBody) return;
  const controller=new AbortController();
  setFailed(false);
  async function loadBody(){
   try {
    const response=await fetch(contentAsset(sourceArticle.archiveBody),{signal:controller.signal});
    if (!response.ok) throw Error('HTTP '+response.status);
    const result=await response.json();
    if (!Array.isArray(result.blocks)) throw Error('Missing article blocks');
    if (!controller.signal.aborted) setBody(result);
   } catch {
    if (!controller.signal.aborted) setFailed(true);
   }
  }
  loadBody();
  return ()=>controller.abort();
 },[sourceArticle.archiveBody,attempt]);
 const a = localizeRecord(body?{...sourceArticle,...body}:sourceArticle,locale);
 const loading=sourceArticle.archiveBody&&!body&&!failed;
 const collection=collectionForRoute(route);
 const section=route.split('/')[1];
 const sectionIds=sectionArticles[section];
 const collectionName=collection?collectionText(collection).name:sectionIds?sections[routes.indexOf('/'+section)].title:'';
 const parentPath=collection?route.split('/').slice(0,3).join('/'):sectionIds?'/'+section:'/columns';
 const articlePath=id=>(collection||sectionIds?parentPath:'')+'/read/'+id;
 const [copied,setCopied]=useState(false),[copyError,setCopyError]=useState(false);
 const root=useRef(null), timer=useRef(null);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 useEffect(()=>{ScrollTrigger.refresh();},[locale,body]);
 useGSAP(()=>{gsap.fromTo('.reading-progress',{scaleX:0},{scaleX:1,ease:'none',scrollTrigger:{trigger:'.article-body',scroller:root.current.closest('.studio-landing__screen'),start:'top 35%',end:'bottom bottom',scrub:true}});},{scope:root});
 async function copy(){try{await navigator.clipboard.writeText(location.href);setCopied(true);clearTimeout(timer.current);timer.current=setTimeout(()=>setCopied(false),2200);}catch{setCopyError(true);}}
 const poolIds=collection?.articleIds || sectionIds;
 const readingPool=articles.filter(item=>poolIds&&!a.sample?poolIds.includes(item.id):item.sample===a.sample);
 const headings = a.blocks ? articleHeadings(a, t('preface')) : a.sections.map((part,i)=>({title:part.title,anchor:'part-'+i}));
 const headingsAreNumbered = a.archiveCategory && headings.some(heading => /^\d{1,2}$/.test(heading.title.trim()));
 const isCover = block => block.type === 'image' && block.src === a.cover;
 const showCover = a.cover && !loading && !failed && !a.preface?.some(isCover) && (!a.archiveCategory || !a.blocks?.some(isCover));
 const next=readingPool.length>1?localizeRecord(readingPool[(readingPool.findIndex(item=>item.id===a.id)+1)%readingPool.length],locale):null;
 return <main ref={root} className={'reader-page'+(a.archiveCategory?' archive-reader':'')} id="content" tabIndex={-1}>
  <div className="reading-progress" aria-hidden="true"/>
  <div className="reader-topline"><a href={"#"+parentPath} onClick={e=>navigate(e,parentPath)}><ArrowLeft size={16}/> {collectionName?t('backArticleList',{name:collectionName}):t('backColumns')}</a><span className="micro">PB—{a.number} / {a.category}</span></div>
  <header className="article-heading">{collection&&a.sample&&<p className="reader-demo-note">{t('sampleNotice',{name:collectionName})}</p>}<div className="story-meta"><span>{a.category}</span>{a.sample&&<span>{t('sampleArticle')}</span>}</div><h1 style={textStyle(a.titleStyle)}>{a.title.split('\n').map((x,i)=><span key={i}>{x}</span>)}</h1>{a.subtitle&&<p style={textStyle(a.subtitleStyle)}>{a.subtitle}</p>}<div className="article-byline"><ArticleMeta article={a}/><button onClick={copy}>{copied?<Check size={16}/>:<LinkSimple size={16}/>} {copied?t('copiedLink'):t('copyLink')}</button></div><span role="status" className="copy-status">{copyError?t('copyError'):''}</span></header>
  <div className={'article-layout'+(headings.length?'':' without-contents')}>
   {headings.length>0&&<aside className="reader-aside"><span className="micro">{t('articleContents')}</span><nav aria-label={t('articleContents')}>{headings.map((heading,i)=><button key={heading.anchor} onClick={()=>root.current.querySelector('#'+heading.anchor)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})}>{!headingsAreNumbered&&<span>{String(i+1).padStart(2,'0')}</span>}{heading.title}</button>)}</nav></aside>}
   <article className="article-body" aria-busy={Boolean(loading)}>
    {showCover&&<ReaderImage src={a.cover} alt={a.title} format={a.coverStyle} locale={locale} cover/>}
    {loading?<p role="status">{t('loadingStory')}</p>:failed?<p role="alert">{t('storyLoadError')} <button type="button" onClick={()=>setAttempt(n=>n+1)}>{t('retry')}</button></p>:<>
     {a.blocks?<ArticleBodyBlocks blocks={a.blocks} preface={a.preface} prefaceOffset={a.prefaceOffset} label={t('preface')} imageTextLabel={t('imageText')} locale={locale}/>:<><p className="article-lede">{a.intro}</p>{a.sections.map((s,i)=><section key={s.title} id={'part-'+i}><h2>{s.title}</h2>{s.paragraphs.map(p=><p key={p}>{p}</p>)}{i===0&&<blockquote>{a.quote}</blockquote>}</section>)}</>}
     <p className="end-mark">PAPERBULLET</p>
    </>}
    {a.sample&&<div className="sample-note">{t('sampleFooter')}</div>}
   </article>
  </div>
  {next&&<a className="next-story" href={'#'+articlePath(next.id)} onClick={e=>navigate(e,articlePath(next.id))}><span className="micro">{t('nextRead')}</span><h2>{next.shortTitle}</h2><ArrowUpRight size={30} weight="light"/></a>}

 </main>;
}
function ContactSection() {
 return <section className="contact-section" aria-labelledby="contact-title"><div><span className="micro red">KEEP IN TOUCH</span><h2 id="contact-title">让对话继续。</h2><p>阅读、收听，或把你的想法写给我们。</p></div><div className="contact-list">{contacts.map((contact,i)=>{const content=<>{contact.name==='小宇宙'?<img className="platform-logo" src={asset('xiaoyuzhou.png')} alt=""/>:<PixelCode text={'0'+(i+1)}/>}<div><h3>{contact.name}</h3><p>{contact.detail}</p></div>{contact.url?<ArrowUpRight size={21}/>:<span className="contact-pending">入口待补充</span>}</>;return contact.url?<a key={contact.name} href={contact.url} target={contact.url.startsWith('mailto:')?undefined:'_blank'} rel="noopener noreferrer">{content}</a>:<div key={contact.name}>{content}</div>;})}</div></section>;
}
function About() {
 const { about, locale } = useI18n();
 return <main className="content-page about-page" id="content" tabIndex={-1}>
  <span className="micro red">{locale==='en'?'01':'01 / ABOUT PAPERBULLET'}</span>
  <h1>{about.lines.map((line,index)=><span key={index}>{line}<span className={locale==='en'?undefined:'about-slogan__punctuation'}>{about.punctuation[index]}</span>{index===0&&<br/>}</span>)}</h1>
  <div className="about-intro">
   <AboutContact/>
   <div>{about.intro.map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div>
  </div>
  <article className="about-preface" aria-labelledby="preface-title">
   <header>
    <h2 id="preface-title">{about.title}</h2>
    <time className="about-preface__date" dateTime="2023-09-05">{about.date}</time>
   </header>
   <div>
    <div className="about-preface__text">{about.paragraphs.map((paragraph,index)=><p key={index} className={index===5?'about-preface__motto':undefined}>{paragraph}</p>)}</div>
    <footer className="about-preface__byline">{about.byline}</footer>
   </div>
  </article>
 </main>;
}
function Podcast({ navigate }) {
 const { t, locale, sections } = useI18n();
 const [program,setProgram]=useState('overthink');
 const selectedEpisodes=episodes.filter(e=>(e.program||'reserved')===program).map(episode=>localizeRecord(episode,locale));
 return <main className="content-page directory-page episode-page" id="content" tabIndex={-1}>
  <header className="directory-heading"><span className="micro red">{locale==='en'?'04':'04 / PODCAST'}</span><h1>{sections[2].title}</h1></header>
  <nav className="podcast-programs" aria-label={t('selectPodcast')}>
   <button type="button" aria-pressed={program==='overthink'} onClick={()=>setProgram('overthink')}><span className="program-art overthink-art"><img src={asset('overthink-reference.jpg')} alt={t('overthink')+' '+t('cover')}/></span><span className="program-title">{t('overthink')}</span></button>
   <button type="button" aria-pressed={program==='reserved'} onClick={()=>setProgram('reserved')}><span className="program-art"><img src={asset('podcast-cover.png')} alt={t('reserved')+' '+t('cover')}/></span><span className="program-title">{t('reserved')}</span></button>
  </nav>
  {program&&<>
  <div className="directory-bar"><span>{t(program)}</span><span className="micro">{selectedEpisodes.length} EPISODES</span></div>
  <section className={'episode-grid '+(program==='overthink'?'episode-grid-wide':'')} aria-label={t('episodeList')}>{selectedEpisodes.map((episode,i)=><a className="episode-card" href={episode.url} target="_blank" rel="noopener noreferrer" key={episode.url} aria-label={episode.title+' — '+t('listen')+' ('+t('newTab')+')'}>
   <img className="episode-cover" src={contentAsset(episode.cover||'/assets/podcast-cover.png')} alt="" loading={i<4?'eager':'lazy'}/>
   <h2>{episode.title}</h2>
   <div className="episode-meta">{episode.access?<small>{episode.access}</small>:episode.duration?<small>{episode.duration}</small>:null}{episode.publishedAt&&<time className="episode-date" dateTime={episode.publishedAt}>{episode.publishedAt.replace('T',' ')}</time>}</div>
  </a>)}</section>
  <a className="podcast-all" href={'https://www.xiaoyuzhoufm.com/podcast/'+(program==='overthink'?'6980695b5e2695907935a7b6':'68c436b4de7cd32c37b1c4a8')} target="_blank" rel="noopener noreferrer">{t('allEpisodes')} <ArrowUpRight size={18}/></a>
  </>}

 </main>;
}
export function App(){
 const { locale, sections, about, collectionText } = useI18n();
 const [route,setRoute]=useState(()=>readRoute(location.hash));
 const [contentRoute,setContentRoute]=useState(()=>route==='/'||route==='/screen'?'/about':route);
 useEffect(()=>{
  const change=()=>{
   const next=readRoute(location.hash);
   if(next!=='/' && location.hash!=='#'+next) history.replaceState(history.state,'','#'+next);
   if(next!=='/')setContentRoute(next==='/screen'?'/about':next);
   setRoute(next);
  };
  window.addEventListener('hashchange',change);
  change();
  return()=>window.removeEventListener('hashchange',change);
 },[]);
 useEffect(()=>{
  document.querySelector('.studio-landing__screen')?.scrollTo(0,0);
  document.getElementById('content')?.focus({preventScroll:true});
 },[contentRoute]);
 useEffect(()=>{
  const a=articles.find(x=>route.endsWith('/read/'+x.id));
  const collection=collectionForRoute(route);
  document.title=(a?localizeRecord(a,locale).shortTitle:collection?collectionText(collection).name:route==='/screen'?sections[4].title:sections[routes.indexOf(route)]?.title||about.lines.map((line,index)=>line+about.punctuation[index]).join(' '))+' — PAPERBULLET 锵稿';
 },[route,locale,sections,about,collectionText]);
 function navigate(e,path){
  if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  e.preventDefault();location.hash=path;
 }
 const article=articles.find(a=>contentRoute.endsWith('/read/'+a.id));
 const readerRoute=contentRoute.startsWith('/read/') ? archiveListPath(article)+contentRoute : contentRoute;
 return <StudioLanding view={route==='/'?'studio':'screen'} onEnter={()=>{location.hash=contentRoute;}}>
  <EditorialWorkspace route={readerRoute} navigate={navigate}>
   {article?<Reader key={contentRoute} article={article} route={readerRoute} navigate={navigate}/>:
    contentRoute.startsWith('/columns')||contentRoute.startsWith('/festivals')?<CollectionPage route={contentRoute} navigate={navigate}/>:
    contentRoute==='/about'?<About/>:contentRoute==='/podcast'?<Podcast navigate={navigate}/>:
    <SectionList section={contentRoute.slice(1)} index={routes.indexOf(contentRoute)} number={String(sectionOrder.indexOf(routes.indexOf(contentRoute))+1).padStart(2,'0')} navigate={navigate}/>}
  </EditorialWorkspace>
 </StudioLanding>;
}
