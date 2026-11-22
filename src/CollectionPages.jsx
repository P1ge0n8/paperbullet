import { FestivalMark } from './FestivalMark';
import { ArrowLeft, ArrowRight, ArrowUpRight } from '@phosphor-icons/react';
import { articles } from './articles';
import { contentAsset } from './ContentBlocks';
import coverPreviews from './content/cover-previews.json';
import { columns, columnTopics, festivals, sectionArticles } from './collections';
import { localizeRecord, useI18n } from './i18n';

export function Directory({ kind, navigate }) {
 const { t, locale, sections, collectionText } = useI18n();
 const isColumn=kind==='columns';
 const items=(isColumn?columns:festivals.filter(item=>item.logo)).map(collectionText);
 const topics=isColumn?columnTopics:festivals.filter(item=>!item.logo);
 return <>
  <header className="directory-heading"><span className="micro red">{isColumn?'02':'03'}{locale!=='en'&&(isColumn?' / COLUMNS':' / FILM FESTIVALS')}</span><h1>{sections[isColumn?0:1].title}</h1><p>{t(isColumn?'columnsIntro':'festivalsIntro')}</p></header>
  {isColumn&&<TopicLinks title={t('columnTopics')} items={topics} navigate={navigate}/>}
  {isColumn&&<div className="directory-bar"><span>{t('columnAuthors')}</span><span className="micro">{String(items.length).padStart(2,'0')} REPORTERS</span></div>}
  <section className={'collection-grid '+(isColumn?'author-grid':'festival-grid')} aria-label={t(isColumn?'selectColumn':'selectFestival')}>
   {items.map((item,i)=>!isColumn&&item.logo?<FestivalMark item={item} navigate={navigate} key={item.id}/>:<a className="collection-card" href={'#/'+kind+'/'+item.id} key={item.id} onClick={e=>navigate(e,'/'+kind+'/'+item.id)}>
    <div className="collection-card-top"><span className="micro">{isColumn?'COLUMN':'FILM FESTIVAL'} / 0{i+1}</span><ArrowUpRight size={22} weight="light"/></div>
    <h2>{item.name}</h2><span className="collection-english">{item.english}</span>
    <p>{item.description}</p>
    <div className="collection-card-bottom"><span>{t('allArticles')} <ArrowRight size={18}/></span><small>{item.articleIds.length?t('articleCount',{count:item.articleIds.length}):t('awaitingArticles')}</small></div>
   </a>)}
  </section>
  {!isColumn&&topics.length>0&&<TopicLinks title={t('festivalTopics')} items={topics} navigate={navigate}/>}
 </>;
}

function TopicLinks({title,items,navigate}) {
 const { t, collectionText }=useI18n();
 return <section className="archive-topics"><div className="directory-bar"><h2>{title}</h2></div>
  <ul>{items.map(source=>{
   const item=collectionText(source);
   const path='/'+item.kind+'/'+item.id;
   return <li key={item.id}><a href={'#'+path} onClick={event=>navigate(event,path)}><span>{item.name}</span><small>{t('articleCount',{count:item.articleIds.length})}</small><ArrowRight size={16}/></a></li>;
  })}</ul>
 </section>;
}

export function CollectionList({ collection:sourceCollection, kind, navigate }) {
 const { t, collectionText } = useI18n();
 const collection=collectionText(sourceCollection);
 const isColumn=kind==='columns';
 const base='/'+kind+'/'+collection.id;
 return <>
  <nav className="collection-breadcrumb" aria-label={t('breadcrumbs')}><a href={'#/'+kind} onClick={e=>navigate(e,'/'+kind)}><ArrowLeft size={15}/> {t(isColumn?'allColumns':'allFestivals')}</a><span>/</span><span aria-current="page">{collection.name}</span></nav>
  <header className="collection-heading"><span className="micro red">{isColumn?'COLUMN':'FILM FESTIVAL'}{collection.english&&' / '+collection.english}</span><h1>{collection.name}</h1>{collection.description&&<p>{collection.description}</p>}</header>
  <ArticleList ids={collection.articleIds} base={base} navigate={navigate}/>
 </>;
}

export function SectionList({section, index, number, navigate}) {
 const { locale, sections }=useI18n();
 const info=sections[index];
 return <main className="content-page directory-page" id="content" tabIndex={-1}>
  <header className="directory-heading"><span className="micro red">{number}{locale!=='en'&&' / '+info.english}</span><h1>{info.title}</h1>{info.description&&<p>{info.description}</p>}</header>
  <ArticleList ids={sectionArticles[section]} base={'/'+section} navigate={navigate}/>
 </main>;
}
function ArticleList({ids,base,navigate}) {
 const { t }=useI18n();
 const requested=new Set(ids);
 const items=articles.filter(article=>requested.has(article.id));
 return <>
  <div className="directory-bar article-list-bar"><h2>{t('allArticles')}</h2><span className="micro">{t('articleCount',{count:items.length})}</span></div>
  {items.length?<ReadingCards items={items} base={base} navigate={navigate}/>:<div className="stay-tuned">{t('emptyList')}</div>}
 </>;
}
function ReadingCards({items,base,navigate,sample=false}) {
 const { t, locale } = useI18n();
 return (
  <div className="reading-card-grid">
   {items.map(sourceArticle => {
    const article = localizeRecord(sourceArticle,locale);
    const titlePrefix = [article.category + '｜', article.category + ' | '].find(prefix => article.shortTitle.startsWith(prefix));
    const title = titlePrefix ? article.shortTitle.slice(titlePrefix.length) : article.shortTitle;
    const year = article.publishedAt?.slice(0, 4) || '';
    const originalCover = contentAsset(article.cover);
    const preview = coverPreviews[article.cover];
    return (
    <a
     className="reading-card"
     key={article.id}
     href={'#' + base + '/read/' + article.id}
     onClick={event => navigate(event, base + '/read/' + article.id)}
    >
     {originalCover && <img className="reading-card-cover" src={preview ? contentAsset(preview) : originalCover} alt="" loading="lazy" decoding="async"
      onError={preview ? event => {
       if (event.currentTarget.getAttribute('src') !== originalCover) event.currentTarget.src = originalCover;
      } : undefined}/>}
     <span className="micro red">{[sample ? t('sampleArticle') : article.category, year, article.number].filter(Boolean).join(' / ')}</span>
     <h3 className={title.startsWith('《') ? 'has-leading-bracket' : undefined}>{title}</h3>
     {article.subtitle&&<p>{article.subtitle}</p>}
    </a>
    );
   })}
  </div>
 );
}
