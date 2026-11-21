import React from 'react';
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
export function ContentBlocks({blocks=[]}){
 return blocks.map((block,i)=>{
  const style={...textStyle(block),whiteSpace:'pre-wrap'};
  if(block.type==='image')return <figure key={i}><img style={imageStyle(block)} src={contentAsset(block.src)} alt={block.alt||''} loading="lazy"/>{block.caption&&<figcaption>{block.caption}</figcaption>}</figure>;
  if(block.type==='link')return <p key={i} style={style}><a href={block.href} target="_blank" rel="noopener noreferrer">{block.text||block.href}</a></p>;
  const Tag=({h2:'h2',h3:'h3',quote:'blockquote'})[block.type]||'p';
  return <Tag key={i} id={block.type==='h2'||block.type==='h3'?'block-'+i:undefined} style={style}>{block.text}</Tag>;
 });
}
