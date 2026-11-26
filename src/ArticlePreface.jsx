import React from 'react';
import { ContentBlocks, InlineContent, textStyle } from './ContentBlocks';
import './article-preface.css';

const isHeading = block => block.type === 'h2' || block.type === 'h3';
const hasContent = blocks => blocks?.some(block => block.text?.trim() || block.src || block.href);

function blockHeadings(blocks, prefix, startIndex = 0) {
 return blocks.flatMap((block, index) => isHeading(block)
  ? [{title:block.text, anchor:prefix + (startIndex + index)}] : []);
}

export function articleHeadings({blocks, preface, prefaceOffset = 0}, label) {
 if (!hasContent(preface)) return blockHeadings(blocks, 'block-');
 const offset = Math.min(prefaceOffset, blocks.length);
 const nativeHeading = isHeading(preface[0]);
 return [
  ...blockHeadings(blocks.slice(0, offset), 'block-'),
  {title:nativeHeading ? preface[0].text || label : label, anchor:'article-preface'},
  ...blockHeadings(nativeHeading ? preface.slice(1) : preface, 'preface-block-', nativeHeading ? 1 : 0),
  ...blockHeadings(blocks.slice(offset), 'block-', offset),
 ];
}

export default function ArticlePreface({blocks, label = '开腔', imageTextLabel, locale}) {
 if (!hasContent(blocks)) return null;
 const heading = isHeading(blocks[0]) ? blocks[0] : null;
 return <section className="article-preface" aria-labelledby="article-preface">
  <h2 className="article-preface__heading" id="article-preface" style={heading ? textStyle(heading) : undefined}>{heading?.text ? <InlineContent block={heading}/> : label}</h2>
  <ContentBlocks blocks={heading ? blocks.slice(1) : blocks} idPrefix="preface-block-" startIndex={heading ? 1 : 0}
   imageTextLabel={imageTextLabel} locale={locale}/>
 </section>;
}

export function ArticleBodyBlocks({blocks = [], preface, prefaceOffset = 0, label, imageTextLabel, locale}) {
 const display = {imageTextLabel, locale};
 if (!hasContent(preface)) return <ContentBlocks blocks={blocks} {...display}/>;
 const offset = Math.min(prefaceOffset, blocks.length);
 return <>
  <ContentBlocks blocks={blocks.slice(0, offset)} {...display}/>
  <ArticlePreface blocks={preface} label={label} {...display}/>
  <ContentBlocks blocks={blocks.slice(offset)} startIndex={offset} {...display}/>
 </>;
}
