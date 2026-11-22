import test from 'node:test';
import assert from 'node:assert/strict';
import {articles,readRoute} from '../src/articles.js';
import {contacts} from '../src/contacts.js';
import { PDFDocument, PDFName } from 'pdf-lib';
import { inflateSync } from 'node:zlib';
import { createPageImagePdf } from '../src/article-pdf-document.js';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { defaultCollections, festivalLogoOptions } from '../shared/editorial-defaults.mjs';
import { validateContent, saveContent, publishContent, revision } from '../server/content.mjs';
test('article URLs resolve; unknown content falls back safely',()=>{
 assert.equal(new Set(articles.map(a=>a.id)).size,articles.length);
 for(const a of articles) assert.equal(readRoute('#/read/'+a.id),'/read/'+a.id);
 assert.equal(readRoute('#/read/not-published'),'/');
});
test('only verified podcast destination is enabled',()=>{
 assert.deepEqual(contacts.filter(c=>c.url).map(c=>c.url),['https://www.xiaoyuzhoufm.com/podcast/68c436b4de7cd32c37b1c4a8']);
});

test('long-image PDF preserves the full page ratio and places consecutive JPEG tiles edge to edge', async () => {
 const jpeg = await readFile(new URL('../public/assets/logo.jpg', import.meta.url));
 const capture = await createPageImagePdf({
  width: 1000, height: 32000, title: '影展長文', author: '子戈', locale: 'zh-HK',
 });
 await capture.addTile(jpeg, 0, 12000);
 await capture.addTile(jpeg, 12000, 20000);
 const blob = await capture.finish();
 assert.equal(blob.type, 'application/pdf');

 const pdf = await PDFDocument.load(await blob.arrayBuffer());
 assert.equal(pdf.getPageCount(), 1);
 assert.equal(pdf.getTitle(), '影展長文');
 assert.equal(pdf.getAuthor(), '子戈');
 assert.equal(pdf.catalog.get(PDFName.of('Lang')).decodeText(), 'zh-HK');
 const [page] = pdf.getPages();
 assert.deepEqual(page.getSize(), { width: 450, height: 14400 });

 const images = page.node.Resources().lookup(PDFName.of('XObject')).values();
 assert.equal(images.length, 2);
 for (const ref of images) assert.deepEqual(Buffer.from(pdf.context.lookup(ref).getContents()), jpeg);
 const commands = page.node.Contents().asArray().map(ref =>
  inflateSync(pdf.context.lookup(ref).getContents()).toString('ascii')
 ).join('\n');
 const matrices = [...commands.matchAll(/(-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) cm/g)]
  .map(match => match.slice(1).map(Number));
 assert.ok(matrices.some(([a,b,c,d,x,y]) => a===1 && b===0 && c===0 && d===1 && x===0 && y===9000));
 assert.deepEqual(matrices.filter(([a]) => a===450), [[450,0,0,5400,0,0], [450,0,0,9000,0,0]]);
});

test('former project bookmarks resolve to the partnerships section',async()=>{
 const {formerFestivalTopicPaths,sectionArticles,collectionForRoute}=await import('../src/collections.js');
 for (const [id, target] of formerFestivalTopicPaths) {
  if (target !== '/partnerships') continue;
  const base='/festivals/'+id;
  assert.equal(collectionForRoute(base),undefined);
  assert.equal(readRoute('#'+base),'/partnerships');
  assert.equal(readRoute('#'+base+'/read/unpublished-or-missing'),'/');
  assert.equal(readRoute('#'+base+'/extra'),'/');
 }
 const oldArticle='#/festivals/topic-ssx-v8h-jez-ke2-n5h-iup-rkx-g7m/read/img-9222';
 assert.equal(readRoute(oldArticle),sectionArticles.partnerships.includes('img-9222')?'/partnerships/read/img-9222':'/');
});

test('old Oscar bookmarks resolve to Film Culture and the current column of each article',async()=>{
 const {collectionForRoute,columnTopics}=await import('../src/collections.js');
 const oldPath='/festivals/topic-hnp-k33-ggx-ssx-fyn-hna';
 const newPath='/columns/topic-culture';
 assert.equal(collectionForRoute(oldPath),undefined);
 assert.equal(readRoute('#'+oldPath),newPath);
 assert.equal(readRoute('#'+oldPath+'/extra'),'/');
 assert.equal(readRoute('#'+oldPath+'/read/missing'),'/');
 assert.equal(readRoute('#'+oldPath+'/read/img-9190/extra'),'/');
 for (const id of ['img-9190','img-9137','img-9050','img-9048','img-9033']) {
  const column=columnTopics.find(item=>item.articleIds.includes(id));
  const expected=column ? '/columns/'+column.id+'/read/'+id : '/';
  assert.equal(readRoute('#'+oldPath+'/read/'+id),expected);
 }
});

test('collection deep links resolve and malformed paths do not',async()=>{
 const {columns,festivals,collectionForRoute}=await import('../src/collections.js');
 for(const [kind,items] of [['columns',columns],['festivals',festivals]]){
  for(const item of items){
   const base='/'+kind+'/'+item.id;
   assert.equal(readRoute('#'+base),base);
   assert.equal(collectionForRoute(base).name,item.name);
   for(const a of articles) assert.equal(readRoute('#'+base+'/read/'+a.id),base+'/read/'+a.id);
   assert.equal(readRoute('#'+base+'/read/missing'),'/');
   assert.equal(readRoute('#'+base+'/extra'),'/');
   assert.equal(readRoute('#'+base+'/read/'+articles[0].id+'/extra'),'/');
   assert.ok(item.articleIds.every(id=>articles.some(a=>a.id===id&&!a.sample)), 'only real published articles belong to collections');
  }
 }
 assert.equal(readRoute('#/columns/unknown'),'/');
 assert.equal(readRoute('#/festivals/unknown'),'/');
});

test('archive festival marks have matching artwork and can be saved in the studio', async () => {
 const { festivals } = await import('../src/collections.js');
 const expectedMarks = new Map([
  ['北京国际电影节', 'beijing'], ['NOWNESS天才计划', 'nowness'],
  ['金鸡国际影展', 'goldenrooster'], ['海南岛国际电影节', 'hainan'],
  ['观潮', 'guanchao'], ['香港国际电影节', 'hongkong'],
  ['平遥国际电影展', 'pingyao'], ['HiShorts!厦门短片周', 'hishorts'],
 ]);
 const textTopics = ['年度影展回顾', '国际影展观察'];
 const optionsByName = new Map(festivalLogoOptions.map(option => [option.name, option.logo]));
 for (const [name, logo] of expectedMarks) assert.equal(optionsByName.get(name), logo, name);
 for (const name of textTopics) assert.equal(optionsByName.has(name), false, name);
 for (const item of festivals.filter(festival => festival.id.startsWith('topic-'))) {
  if (expectedMarks.has(item.name)) assert.equal(item.logo, expectedMarks.get(item.name), item.name);
  if (textTopics.includes(item.name)) assert.ok(!item.logo, item.name);
 }

 const collections = festivalLogoOptions.map(({name, logo}) => ({
  id: logo, kind: 'festivals', name, logo, english: '', description: '',
 }));
 assert.doesNotThrow(() => validateContent({version: 1, articles: [], episodes: [], collections}));
 for (const {logo} of collections) {
  const image = await readFile(new URL('../public/assets/festival-' + logo + '.png', import.meta.url));
  assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', logo);
 }
});

const block = { type:'paragraph', text:'正文内容', fontSize:18, align:'left', bold:false, italic:false };
const article = { id:'roundtrip-story', number:'006', title:'正标题', subtitle:'副标题', author:'作者', category:'影评', collection:'columns/zige', status:'published', publishedAt:'2023-09-05', cover:'/assets/podcast-cover.png', blocks:[block] };
const episode = { id:'roundtrip-episode', title:'播客单集', url:'https://www.xiaoyuzhoufm.com/episode/example', cover:'/assets/podcast-cover.png', duration:null, access:null };
const documentWith = changes => ({ version:1, articles:[structuredClone(article)], episodes:[structuredClone(episode)], ...changes });

test('legacy collections and podcast states remain valid without mutating the source', async () => {
 const root=await mkdtemp(path.join(tmpdir(),'pb-legacy-'));
 const source=documentWith();
 const before=structuredClone(source);
 try {
  validateContent(source);
  await publishContent(root,source);
  const published=JSON.parse(await readFile(path.join(root,'src/content/published.json'),'utf8'));
  assert.deepEqual(published.collections,defaultCollections);
  assert.equal(published.episodes[0].program,'reserved');
  assert.equal(published.episodes[0].status,'published');
  assert.deepEqual(source,before);
 } finally { await rm(root,{recursive:true,force:true}); }
});

test('dynamic collection membership prevents deleting categories still used by articles', () => {
 const custom={id:'new-column',kind:'columns',name:'新专栏',english:'NEW COLUMN',description:'简介'};
 const assigned={...article,collection:'columns/new-column'};
 const source=documentWith({collections:[...defaultCollections,custom],articles:[assigned]});
 assert.equal(validateContent(source),source);
 assert.throws(()=>validateContent({...source,collections:defaultCollections}), /所属栏目不存在/);
 assert.throws(()=>validateContent({...source,collections:[...source.collections,custom]}), /不能重复/);
 assert.doesNotThrow(()=>validateContent({...source,collections:[...source.collections,{...custom,kind:'festivals'}]}));
 for(const invalid of [null,{...custom,id:'../escape'},{...custom,kind:'unknown'},{...custom,name:''},{...custom,logo:'unknown'}]) {
  assert.throws(()=>validateContent({...source,collections:[invalid]}),error=>error.status===400);
 }
});

test('title and image styling rejects unsafe, nonnumeric and out-of-range settings', () => {
 for(const titleStyle of [null,[],{fontSize:NaN},{fontSize:Infinity},{fontSize:81},{fontSize:11},{fontSize:18.5},{fontSize:'24'},{italic:'yes'},{bold:1},{align:'justify'},{backgroundImage:'url(https://example.com)'}]) {
  assert.throws(()=>validateContent(documentWith({articles:[{...article,titleStyle}]})),error=>error.status===400);
 }
 for(const coverStyle of [{width:19},{width:101},{width:50.5},{width:null},{maxHeight:119},{maxHeight:1201},{maxHeight:Infinity},{align:'bad'},{transform:'scale(2)'}]) {
  assert.throws(()=>validateContent(documentWith({articles:[{...article,coverStyle}]})),error=>error.status===400);
 }
 assert.doesNotThrow(()=>validateContent(documentWith({articles:[{...article,titleStyle:{fontSize:null},subtitleStyle:{fontSize:12,bold:false,italic:true,align:'center'},coverStyle:{width:100,maxHeight:null,align:'right'}}]})));
 for(const number of [6,'0123456789012','006a'])assert.throws(()=>validateContent(documentWith({articles:[{...article,number}]})),error=>error.status===400);
 for(const invalid of [null,{...block,type:'image',src:'/assets/podcast-cover.png',alt:'',caption:'',width:0},{...block,type:'image',src:'/assets/podcast-cover.png',alt:'',caption:'',maxHeight:'600'}]) {
  assert.throws(()=>validateContent(documentWith({articles:[{...article,blocks:[invalid]}]})),error=>error.status===400);
 }
});

test('save preserves headings, image sizes, category order and leading-zero numbering while excluding drafts', async () => {
 const root=await mkdtemp(path.join(tmpdir(),'pb-editorial-save-'));
 const initial=documentWith();
 const styled={...article,titleStyle:{fontSize:44,bold:false,italic:true,align:'center'},subtitleStyle:{fontSize:18,bold:true,italic:false,align:'left'},coverStyle:{width:60,maxHeight:480,align:'center'},blocks:[{...block,type:'image',src:'/assets/podcast-cover.png',alt:'图片描述',caption:'图注',width:45,maxHeight:320,align:'right'},block]};
 const changed=documentWith({collections:[...defaultCollections].reverse(),articles:[styled,{...article,id:'private-article',status:'draft'}],episodes:[{...episode,program:'overthink',status:'published'},{...episode,id:'private-episode',program:'reserved',status:'draft'}]});
 try {
  await mkdir(path.join(root,'content'));
  await writeFile(path.join(root,'content/editorial.json'),JSON.stringify(initial));
  const nextRevision=await saveContent(root,changed,revision(initial));
  assert.equal(nextRevision,revision(changed));
  assert.deepEqual(JSON.parse(await readFile(path.join(root,'content/editorial.json'),'utf8')),changed);
  const published=JSON.parse(await readFile(path.join(root,'src/content/published.json'),'utf8'));
  assert.deepEqual(published.collections,changed.collections);
  assert.deepEqual(published.articles,[styled]);
  assert.equal(published.articles[0].number,'006');
  assert.deepEqual(published.episodes,[changed.episodes[0]]);
 } finally { await rm(root,{recursive:true,force:true}); }
});

test('podcast program and publishing state are constrained to supported choices', () => {
 for(const invalid of [{...episode,program:'unknown'},{...episode,status:'scheduled'},null]) {
  assert.throws(()=>validateContent(documentWith({episodes:[invalid]})),error=>error.status===400);
 }
});

test('translated records preserve identity and validate translated body content', async () => {
 const translated={...article,preface:[{...block,text:'开篇文字'}],translations:{en:{title:'A title',subtitle:'A subtitle',preface:[{...block,text:'Opening remarks'}],blocks:[{...block,text:'Translated text',italic:true}]},'zh-HK':{title:'正標題',subtitle:'副標題'}}};
 const source=documentWith({articles:[translated],episodes:[{...episode,translations:{en:{title:'Episode',duration:'57 minutes'}}}]});
 assert.equal(validateContent(source),source);
 for(const translations of [
  {en:{id:'changed-id'}},
  {fr:{title:'Other'}},
  {en:{blocks:[{...block,type:'link',href:'javascript:alert(1)'}]}},
  {en:{blocks:[{...block,type:'image',src:'/private/photo.png',alt:'',caption:''}]}},
  {en:{blocks:[{...block,fontSize:999}]}},
  {en:{preface:[{...block,type:'link',href:'javascript:alert(1)'}]}},
  {en:{preface:null}},
 ]) assert.throws(()=>validateContent(documentWith({articles:[{...article,translations}]})),error=>error.status===400);
 for(const preface of ['序言',{},[{...block,fontSize:999}],Array(500).fill(block)])
  assert.throws(()=>validateContent(documentWith({articles:[{...article,preface}]})),error=>error.status===400);
 for(const prefaceOffset of [-1,1.5,'1',null,2]){
  assert.throws(()=>validateContent(documentWith({articles:[{...translated,prefaceOffset}]})),/序言位置/);
  assert.throws(()=>validateContent(documentWith({articles:[{...translated,translations:{en:{prefaceOffset}}}]})),/序言位置/);
 }
 const shorterTranslation={...translated,prefaceOffset:1,translations:{en:{blocks:[],preface:[block]}}};
 assert.doesNotThrow(()=>validateContent(documentWith({articles:[shorterTranslation]})));
 assert.equal(shorterTranslation.translations.en.prefaceOffset,undefined);
 assert.doesNotThrow(()=>validateContent(documentWith({articles:[{...translated,blocks:[]}]})));
 assert.throws(()=>validateContent(documentWith({articles:[{...article,preface:[],blocks:[]}]})),error=>error.status===400);
 const root=await mkdtemp(path.join(tmpdir(),'pb-translations-'));
 try {
  await publishContent(root,source);
  const published=JSON.parse(await readFile(path.join(root,'src/content/published.json'),'utf8'));
  assert.deepEqual(published.articles[0].preface,translated.preface);
  assert.deepEqual(published.articles[0].translations,translated.translations);
  assert.equal(published.episodes[0].translations.en.title,'Episode');
 } finally { await rm(root,{recursive:true,force:true}); }
});

test('archive import is atomic, preserves edited and deleted stories, and publishes only reader content', async () => {
 const {importArchive}=await import('../server/archive-import.mjs');
 const root=await mkdtemp(path.join(tmpdir(),'pb-archive-'));
 const load=async relative=>JSON.parse(await readFile(path.join(root,relative),'utf8'));
 const source={...documentWith(),articles:[article,{...article,id:'private-draft',status:'draft'}]};
 const image='/uploads/archive/img-1234/part-001.jpg';
 const record={id:'img-1234',title:'导入标题',archiveCategory:'interview',status:'published',sourceTranscript:'PRIVATE-TRANSCRIPT',cover:image,prefaceOffset:1,preface:[{type:'paragraph',text:'序言'},{type:'image',src:image,imageText:'图注'}],blocks:[{type:'paragraph',text:'正文'},{type:'image',src:image,imageText:'图内文字',caption:'图片说明'}],translations:{en:{title:'Interview',prefaceOffset:0,preface:[{type:'quote',text:'Introduction'}],blocks:[{type:'paragraph',text:'English body'}]}}};
 try {
  await mkdir(path.join(root,'content'));
  await writeFile(path.join(root,'content/editorial.json'),JSON.stringify(source));
  await mkdir(path.join(root,'public/uploads/archive/img-1234'),{recursive:true});
  await writeFile(path.join(root,'public',image),Buffer.from([255,216,255]));
  for(const invalid of [{...record,id:article.id},{...record,archiveCategory:'unknown'},{...record,sourceImage:'/assets/raw.jpg'},{...record,cover:'/uploads/archive/../hidden.jpg'},{...record,cover:'/uploads/missing.jpg'}]){
   await assert.rejects(importArchive(root,[invalid]),error=>error.status===400);
   assert.deepEqual(await load('content/editorial.json'),source);
  }
  const missingImage={type:'image',src:'/uploads/unavailable.jpg'};
  for(const invalid of [{...record,preface:[missingImage]},{...record,translations:{en:{preface:[missingImage]}}}]){
   await assert.rejects(importArchive(root,[invalid]),/找不到对应的本地图片/);
   assert.deepEqual(await load('content/editorial.json'),source);
  }
  await assert.rejects(importArchive(root,[record,record]),error=>error.status===400);
  assert.deepEqual(await importArchive(root,[record]),{added:1,skipped:0});
  const saved=await load('content/editorial.json');
  assert.deepEqual(saved.episodes,source.episodes);
  assert.deepEqual(saved.articles.slice(0,2),source.articles);
  assert.equal(saved.articles[2].sourceTranscript,'PRIVATE-TRANSCRIPT');
  const index=await load('src/content/published.json');
  assert.equal(index.articles.length,2);
  const summary=index.articles[1];
  assert.deepEqual(summary.blocks,[]);
  assert.equal(summary.preface,undefined);
  assert.equal(summary.prefaceOffset,undefined);
  assert.equal(summary.archiveBody,'/archive-articles/img-1234.json');
  assert.equal(summary.sourceTranscript,undefined);
  assert.deepEqual(summary.translations.en,{title:'Interview'});
  const body=await load('public'+summary.archiveBody);
  assert.equal(body.sourceTranscript,undefined);
  assert.equal(body.blocks[1].imageText,'图内文字');
  assert.equal(body.translations.en.blocks[0].text,'English body');
  assert.equal(body.preface[0].text,'序言');
  assert.equal(body.prefaceOffset,1);
  assert.equal(body.translations.en.prefaceOffset,0);
  assert.equal(body.preface[1].align,'center');
  assert.equal(body.translations.en.preface[0].text,'Introduction');
  assert.equal(summary.blockTextLength,10);
  const edited=structuredClone(saved);
  edited.articles[2].title='整理过的标题';
  await saveContent(root,edited,revision(saved));
  assert.deepEqual(await importArchive(root,[record]),{added:0,skipped:1});
  assert.deepEqual(await load('content/editorial.json'),edited);
  const deleted={...edited,articles:source.articles};
  await saveContent(root,deleted,revision(edited));
  await importArchive(root,[record]);
  assert.deepEqual(await load('content/editorial.json'),deleted);
  await assert.rejects(load('public'+summary.archiveBody),error=>error.code==='ENOENT');
 } finally { await rm(root,{recursive:true,force:true}); }
});
