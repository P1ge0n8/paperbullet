import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';
import { getSchema } from '@tiptap/core';
import { blocksToDocument, documentToBlocks, safeRichTextHref } from '../shared/rich-text.mjs';
import { validateContent } from '../server/content.mjs';

const paragraph = { type:'paragraph', text:'连续正文', fontSize:20, bold:false, italic:false, align:'left' };
const article = { id:'rich-text-story', title:'文章', subtitle:'', author:'作者', category:'影评', collection:'columns/zige', status:'published', publishedAt:'2026-11-26', cover:'', blocks:[paragraph] };
const contentWith = blocks => ({ version:1, articles:[{...article,blocks}], episodes:[] });

test('every existing article, preface and translation survives an unchanged editor roundtrip', async()=>{
 const original = JSON.parse(await readFile(new URL('../content/editorial.json',import.meta.url),'utf8'));
 let count=0;
 for(const record of original.articles){
  for(const version of [record,...Object.values(record.translations||{})]){
   for(const field of ['blocks','preface']){
    if(!version[field])continue;
    const snapshot=structuredClone(version[field]);
    assert.deepEqual(documentToBlocks(blocksToDocument(version[field])),snapshot,`${record.id} ${field}`);
    assert.deepEqual(version[field],snapshot,'Conversion must not mutate its input');
    count+=snapshot.length;
   }
  }
 }
 assert.ok(count>0,'Exercise the complete editorial archive');
});

test('inline formats, hard breaks, legacy links and image transcripts roundtrip losslessly',()=>{
 const blocks=[
  {...paragraph,text:'第一行\n第二行\n',runs:[{text:'第一行',bold:true},{text:'\n第二行',italic:true,fontSize:24,href:'https://example.com/story'},{text:'\n'}]},
  {...paragraph,type:'link',href:'https://example.com',text:'旧版链接'},
  {...paragraph,type:'quote',text:'引用',bold:true,fontSize:18},
  {...paragraph,type:'h3',text:'小标题',fontSize:24,customSource:'keep'},
  {...paragraph,type:'image',src:'/uploads/archive/picture.png',alt:'插图',caption:'图注',imageText:'图内可读文字',width:60,maxHeight:320,align:'right',customSource:'keep'},
 ];
 assert.deepEqual(documentToBlocks(blocksToDocument(blocks)),blocks);
 assert.deepEqual(documentToBlocks(blocksToDocument([])),[]);
 assert.deepEqual(documentToBlocks(blocksToDocument([{...paragraph,text:''}])),[{...paragraph,text:''}]);
});

test('the actual Tiptap schema preserves existing blocks and inline formats after normalization',async()=>{
 const root=fileURLToPath(new URL('..',import.meta.url));
 const cache=path.join(root,'node_modules/.cache');
 await mkdir(cache,{recursive:true});
 const temporary=await mkdtemp(path.join(cache,'editor-schema-'));
 try{
  const output=path.join(temporary,'editor.mjs');
  await build({entryPoints:[path.join(root,'admin/RichTextEditor.jsx')],outfile:output,bundle:true,platform:'node',format:'esm',packages:'external',loader:{'.css':'empty'},logLevel:'silent'});
  const {richTextExtensions}=await import(pathToFileURL(output));
  const schema=getSchema(richTextExtensions);
  const original=JSON.parse(await readFile(path.join(root,'content/editorial.json'),'utf8'));
  for(const record of original.articles){
   for(const version of [record,...Object.values(record.translations||{})]){
    for(const field of ['blocks','preface']){
     if(!version[field])continue;
     const document=schema.nodeFromJSON(blocksToDocument(version[field]));
     document.check();
     assert.deepEqual(documentToBlocks(document.toJSON()),version[field],`${record.id} ${field}`);
    }
   }
  }
  const formatted=[{...paragraph,text:'前面\n后面',runs:[{text:'前面',bold:true},{text:'\n后面',italic:true,fontSize:24,href:'https://example.com'}]}];
  const document=schema.nodeFromJSON(blocksToDocument(formatted));
  document.check();
  assert.deepEqual(documentToBlocks(document.toJSON()),formatted);
  const image={...paragraph,type:'image',src:'/uploads/image.png',alt:'',caption:'',width:40,maxHeight:240};
  const imageDoc=blocksToDocument([image]);
  imageDoc.content[0].attrs.width=null;
  imageDoc.content[0].attrs.maxHeight=null;
  const cleared=documentToBlocks(schema.nodeFromJSON(imageDoc).toJSON())[0];
  assert.equal(cleared.width,undefined);
  assert.equal(cleared.maxHeight,null);
  assert.equal(cleared.src,image.src);
 }finally{await rm(temporary,{recursive:true,force:true});}
});

test('editing only a selected word preserves the remaining text and paragraph formatting',()=>{
 const doc=blocksToDocument([{...paragraph,text:'前面重点后面',fontSize:18,italic:true}]);
 const baseMarks=[{type:'italic'},{type:'textStyle',attrs:{fontSize:'18px'}}];
 doc.content[0].content=[
  {type:'text',text:'前面',marks:baseMarks},
  {type:'text',text:'重点',marks:[...baseMarks,{type:'bold'},{type:'link',attrs:{href:'https://example.com'}}]},
  {type:'text',text:'后面',marks:baseMarks},
 ];
 const [result]=documentToBlocks(doc);
 assert.equal(result.text,'前面重点后面');
 assert.equal(result.fontSize,18);
 assert.equal(result.italic,true);
 assert.deepEqual(result.runs,[{text:'前面'},{text:'重点',bold:true,href:'https://example.com'},{text:'后面'}]);
 assert.doesNotThrow(()=>validateContent(contentWith([result])));
 assert.deepEqual(documentToBlocks(blocksToDocument([result])),[result]);
});

test('splitting, merging, removing marks and changing heading types use the edited document',()=>{
 const doc=blocksToDocument([{...paragraph,text:'甲乙',bold:true}]);
 const first=doc.content[0];
 first.content=[{type:'text',text:'甲',marks:[]}];
 doc.content.push({...structuredClone(first),type:'heading',attrs:{...first.attrs,level:2},content:[{type:'text',text:'乙',marks:[{type:'textStyle',attrs:{fontSize:'28px'}}]}]});
 const result=documentToBlocks(doc);
 assert.equal(result.length,2);
 assert.equal(result[0].text,'甲');
 assert.equal(result[0].runs[0].bold,false);
 assert.equal(result[1].type,'h2');
 assert.equal(result[1].text,'乙');
 assert.equal(result[1].runs[0].fontSize,28);
 assert.doesNotThrow(()=>validateContent(contentWith(result)));
});

test('inline schema rejects unsafe links, inconsistent text and unrecognized markup',()=>{
 const valid={...paragraph,text:'有格式',runs:[{text:'有',bold:true},{text:'格式',italic:true,fontSize:24,href:'https://example.com'}]};
 assert.doesNotThrow(()=>validateContent(contentWith([valid])));
 for(const runs of [
  [],[{text:'不同'}],[{text:'有格式',fontSize:99}],[{text:'有格式',bold:'yes'}],
  [{text:'有格式',href:'javascript:alert(1)'}],[{text:'有格式',href:'https://user:password@example.com'}],
  [{text:'有格式',html:'<script>bad()</script>'}], [{text:'有格式',style:{position:'fixed'}}],
 ])assert.throws(()=>validateContent(contentWith([{...valid,runs}])),error=>error.status===400);
 const translated={...article,translations:{en:{blocks:[{...valid,runs:[{text:'有格式',href:'data:text/html,test'}]}]}}};
 assert.throws(()=>validateContent({...contentWith([]),articles:[translated]}));
 assert.equal(safeRichTextHref('https://example.com'),true);
 assert.equal(safeRichTextHref('/relative'),false);
 assert.equal(safeRichTextHref('javascript:alert(1)'),false);
});

test('unsafe pasted mark destinations cannot become active stored links',()=>{
 const doc={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'链接文字',marks:[{type:'link',attrs:{href:'javascript:alert(1)'}}]}]}]};
 assert.deepEqual(documentToBlocks(doc),[{...paragraph,text:'链接文字'}]);
});
