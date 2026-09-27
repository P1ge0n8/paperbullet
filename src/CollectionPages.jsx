import { FestivalMark } from './FestivalMark';
import { ArrowLeft, ArrowRight, ArrowUpRight } from '@phosphor-icons/react';
import { articles, sampleArticles } from './articles';
import { columns, festivals } from './collections';

export function Directory({ kind, navigate }) {
 const isColumn=kind==='columns';
 const items=isColumn?columns:festivals;
 return <>
  <header className="directory-heading"><span className="micro red">{isColumn?'01 / COLUMNS':'02 / FILM FESTIVALS'}</span><h1>{isColumn?'专栏':'影展专题'}</h1><p>{isColumn?'从一个人的目光，看见更多电影。':'从一场影展出发，走进电影的现场。'}</p></header>
  {isColumn&&<div className="directory-bar"><span>专栏作者</span><span className="micro">{String(items.length).padStart(2,'0')} REPORTERS</span></div>}
  <section className={'collection-grid '+(isColumn?'author-grid':'festival-grid')} aria-label={isColumn?'选择专栏作者':'选择影展专题'}>
   {items.map((item,i)=>!isColumn?<FestivalMark item={item} navigate={navigate} key={item.id}/>:<a className="collection-card" href={'#/'+kind+'/'+item.id} key={item.id} onClick={e=>navigate(e,'/'+kind+'/'+item.id)}>
    <div className="collection-card-top"><span className="micro">{isColumn?'COLUMN':'FILM FESTIVAL'} / 0{i+1}</span><ArrowUpRight size={22} weight="light"/></div>
    <h2>{item.name}</h2><span className="collection-english">{item.english}</span>
    <p>{item.description}</p>
    <div className="collection-card-bottom"><span>所有文章 <ArrowRight size={18}/></span><small>{item.articleIds.length?item.articleIds.length+' 篇':'待收录'}</small></div>
   </a>)}
  </section>
 </>;
}

export function CollectionList({ collection, kind, navigate }) {
 const isColumn=kind==='columns';
 const parent=isColumn?'专栏':'影展专题';
 const ownArticles=articles.filter(a=>collection.articleIds.includes(a.id));
 const base='/'+kind+'/'+collection.id;
 return <>
  <nav className="collection-breadcrumb" aria-label="面包屑"><a href={'#/'+kind} onClick={e=>navigate(e,'/'+kind)}><ArrowLeft size={15}/> 全部{parent}</a><span>/</span><span aria-current="page">{collection.name}</span></nav>
  <header className="collection-heading"><span className="micro red">{isColumn?'COLUMN':'FILM FESTIVAL'} / {collection.english}</span><h1>{collection.name}</h1><p>{collection.description}</p></header>
  <div className="directory-bar"><h2>所有文章</h2><span className="micro">{String(ownArticles.length).padStart(2,'0')} ARTICLES</span></div>
  {ownArticles.length===0?<div className="collection-empty"><p>文章还在整理中。</p><span>{isColumn?'作者文章收录后，会在这里与你见面。':'影展报道收录后，会在这里与你见面。'}</span></div>:<ReadingCards items={ownArticles} base={base} navigate={navigate}/>}
  <section className="reading-demo" aria-label="阅读体验示例"><div className="demo-intro"><h2>先试读一篇</h2><p>{isColumn?'以下为网站排版示例，不是'+collection.name+'的作品。':'以下为网站排版示例，不是本影展的报道。'}</p></div><ReadingCards items={sampleArticles} base={base} navigate={navigate} sample/></section>
 </>;
}
function ReadingCards({items,base,navigate,sample=false}) {
 return <div className="reading-card-grid">{items.map(a=><a className="reading-card" key={a.id} href={'#'+base+'/read/'+a.id} onClick={e=>navigate(e,base+'/read/'+a.id)}><span className="micro red">{sample?'示例文章':a.category} / {a.number}</span><h3>{a.shortTitle}</h3><p>{a.subtitle}</p><div><small>{sample?'非正式刊发 · ':''}约 {a.minutes} 分钟</small><ArrowUpRight size={20}/></div></a>)}</div>;
}
