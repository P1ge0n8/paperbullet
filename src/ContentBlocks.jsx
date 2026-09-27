import React from 'react';
export const contentAsset = url => url?.startsWith('/') ? import.meta.env.BASE_URL+url.slice(1) : url;
export function ContentBlocks({blocks=[]}){
 return blocks.map((block,i)=>{
  const style={fontSize:block.fontSize+'px',textAlign:block.align,fontWeight:block.bold?700:undefined,fontStyle:block.italic?'italic':undefined,whiteSpace:'pre-wrap'};
  if(block.type==='image')return <figure key={i}><img src={contentAsset(block.src)} alt={block.alt||''} loading="lazy"/>{block.caption&&<figcaption>{block.caption}</figcaption>}</figure>;
  if(block.type==='link')return <p key={i} style={style}><a href={block.href} target="_blank" rel="noopener noreferrer">{block.text||block.href}</a></p>;
  const Tag=({h2:'h2',h3:'h3',quote:'blockquote'})[block.type]||'p';
  return <Tag key={i} id={block.type==='h2'||block.type==='h3'?'block-'+i:undefined} style={style}>{block.text}</Tag>;
 });
}
