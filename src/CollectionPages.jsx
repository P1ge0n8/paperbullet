import { FestivalMark } from './FestivalMark';
import { ArrowLeft, ArrowRight, ArrowUpRight } from '@phosphor-icons/react';
import { articles } from './articles';
import { contentAsset } from './ContentBlocks';
import { columns, festivals } from './collections';
import { localizeRecord, useI18n } from './i18n';

export function Directory({ kind, navigate }) {
 const { t, locale, sections, collectionText } = useI18n();
 const isColumn=kind==='columns';
 const items=(isColumn?columns:festivals).map(collectionText);
 return <>
  <header className="directory-heading"><span className="micro red">{isColumn?'02':'03'}{locale!=='en'&&(isColumn?' / COLUMNS':' / FILM FESTIVALS')}</span><h1>{sections[isColumn?0:1].title}</h1><p>{t(isColumn?'columnsIntro':'festivalsIntro')}</p></header>
  {isColumn&&<div className="directory-bar"><span>{t('columnAuthors')}</span><span className="micro">{String(items.length).padStart(2,'0')} REPORTERS</span></div>}
  <section className={'collection-grid '+(isColumn?'author-grid':'festival-grid')} aria-label={t(isColumn?'selectColumn':'selectFestival')}>
   {items.map((item,i)=>!isColumn&&item.logo?<FestivalMark item={item} navigate={navigate} key={item.id}/>:<a className="collection-card" href={'#/'+kind+'/'+item.id} key={item.id} onClick={e=>navigate(e,'/'+kind+'/'+item.id)}>
    <div className="collection-card-top"><span className="micro">{isColumn?'COLUMN':'FILM FESTIVAL'} / 0{i+1}</span><ArrowUpRight size={22} weight="light"/></div>
    <h2>{item.name}</h2><span className="collection-english">{item.english}</span>
    <p>{item.description}</p>
    <div className="collection-card-bottom"><span>{t('allArticles')} <ArrowRight size={18}/></span><small>{item.articleIds.length?t('articleCount',{count:item.articleIds.length}):t('awaitingArticles')}</small></div>
   </a>)}
  </section>
 </>;
}

export function CollectionList({ collection:sourceCollection, kind, navigate }) {
 const { t, collectionText } = useI18n();
 const collection=collectionText(sourceCollection);
 const isColumn=kind==='columns';
 const ownArticles=articles.filter(a=>collection.articleIds.includes(a.id));
 const base='/'+kind+'/'+collection.id;
 return <>
  <nav className="collection-breadcrumb" aria-label={t('breadcrumbs')}><a href={'#/'+kind} onClick={e=>navigate(e,'/'+kind)}><ArrowLeft size={15}/> {t(isColumn?'allColumns':'allFestivals')}</a><span>/</span><span aria-current="page">{collection.name}</span></nav>
  <header className="collection-heading"><span className="micro red">{isColumn?'COLUMN':'FILM FESTIVAL'} / {collection.english}</span><h1>{collection.name}</h1><p>{collection.description}</p></header>
  <div className="directory-bar"><h2>{t('allArticles')}</h2><span className="micro">{String(ownArticles.length).padStart(2,'0')} ARTICLES</span></div>
  {ownArticles.length===0?<div className="stay-tuned">stay tuned</div>:<ReadingCards items={ownArticles} base={base} navigate={navigate}/>}
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
    return (
    <a
     className="reading-card"
     key={article.id}
     href={'#' + base + '/read/' + article.id}
     onClick={event => navigate(event, base + '/read/' + article.id)}
    >
     {article.cover && <img className="reading-card-cover" src={contentAsset(article.cover)} alt="" loading="lazy"/>}
     <span className="micro red">{sample ? t('sampleArticle') : article.category + (locale==='en'&&year?' ':'') + year} / {article.number}</span>
     <h3 className={title.startsWith('《') ? 'has-leading-bracket' : undefined}>{title}</h3>
     <p>{article.subtitle}</p>
    </a>
    );
   })}
  </div>
 );
}
