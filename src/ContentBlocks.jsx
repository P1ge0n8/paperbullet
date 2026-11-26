import React from 'react';
import { ArrowsOutSimple } from '@phosphor-icons/react';
import { safeRichTextHref } from '../shared/rich-text.mjs';
import './reader-media.css';
export const contentAsset = url => url?.startsWith('/') ? import.meta.env.BASE_URL+url.slice(1) : url;
export function textStyle(format={}) {
 return {
  fontSize: format.fontSize || undefined,
  textAlign: format.align,
  fontWeight: typeof format.bold === 'boolean' ? (format.bold ? 700 : 400) : undefined,
  fontStyle: typeof format.italic === 'boolean' ? (format.italic ? 'italic' : 'normal') : undefined,
  fontSynthesis: format.bold || format.italic ? 'weight style' : undefined,
 };
}
export function imageStyle(format={}) {
 const align=format.align || 'center';
 return {
  width: format.width ? `${format.width}%` : undefined,
  maxWidth: '100%',
  height: 'auto',
  maxHeight: format.maxHeight ? `${format.maxHeight}px` : undefined,
  objectFit: 'contain',
  marginLeft: align==='left' ? 0 : 'auto',
  marginRight: align==='right' ? 0 : 'auto',
 };
}
const imageLinkLabels = {
 'zh-CN': '在新标签页查看原图',
 'zh-HK': '在新分頁查看原圖',
 en: 'Open full-size image in a new tab',
};

export function ReaderImage({src, alt='', format={}, locale='zh-CN', cover=false}) {
 const url=contentAsset(src);
 const label=imageLinkLabels[locale] || imageLinkLabels['zh-CN'];
 const dimensions={
  '--image-width': format.width ? `${format.width}%` : undefined,
  '--image-max-height': format.maxHeight ? `${format.maxHeight}px` : undefined,
 };
 return <div className={cover?'reading-image reading-image--cover':'reading-image'} data-align={format.align||'center'} style={dimensions}>
  <a className="reading-image__link" href={url} target="_blank" rel="noopener noreferrer"
     title={label} aria-label={alt ? `${label} · ${alt}` : label}>
   <img className="reading-image__photo" src={url} alt={alt} loading={cover?'eager':'lazy'} decoding="async"/>
   <ArrowsOutSimple className="reading-image__zoom" size={15} aria-hidden="true"/>
  </a>
 </div>;
}

export function InlineContent({block, allowLinks=true}) {
 if (!Array.isArray(block.runs)) return block.text;
 return block.runs.map((run,index)=>{
  const content=<span style={textStyle(run)}>{run.text}</span>;
  return allowLinks && safeRichTextHref(run.href)
   ? <a key={index} href={run.href} target="_blank" rel="noopener noreferrer">{content}</a>
   : <React.Fragment key={index}>{content}</React.Fragment>;
 });
}

export function ContentBlocks({blocks=[], imageTextLabel="图中文字", locale='zh-CN', idPrefix='block-', startIndex=0}){
 return blocks.map((block,i)=>{
  const style={...textStyle(block),whiteSpace:'pre-wrap'};
  if(block.type==='image')return <figure key={i}><ReaderImage src={block.src} alt={block.alt || block.caption || ''} format={block} locale={locale}/>{block.caption&&<figcaption>{block.caption}</figcaption>}{block.imageText&&<details className="figure-transcript"><summary>{imageTextLabel}</summary><p>{block.imageText}</p></details>}</figure>;
  if(block.type==='link')return <p key={i} style={style}><a href={block.href} target="_blank" rel="noopener noreferrer">{block.text ? <InlineContent block={block} allowLinks={false}/> : block.href}</a></p>;
  const Tag=({h2:'h2',h3:'h3',quote:'blockquote'})[block.type]||'p';
  return <Tag key={i} id={block.type==='h2'||block.type==='h3'?idPrefix+(startIndex+i):undefined} style={style}><InlineContent block={block}/></Tag>;
 });
}
