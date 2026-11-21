import test from 'node:test';
import assert from 'node:assert/strict';
import {articles,readRoute} from '../src/articles.js';
import {contacts} from '../src/contacts.js';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { defaultCollections } from '../shared/editorial-defaults.mjs';
import { validateContent, saveContent, publishContent, revision } from '../server/content.mjs';
test('article URLs resolve; unknown content falls back safely',()=>{
 assert.equal(new Set(articles.map(a=>a.id)).size,articles.length);
 for(const a of articles) assert.equal(readRoute('#/read/'+a.id),'/read/'+a.id);
 assert.equal(readRoute('#/read/not-published'),'/');
});
test('only verified podcast destination is enabled',()=>{
 assert.deepEqual(contacts.filter(c=>c.url).map(c=>c.url),['https://www.xiaoyuzhoufm.com/podcast/68c436b4de7cd32c37b1c4a8']);
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
 const translated={...article,translations:{en:{title:'A title',subtitle:'A subtitle',blocks:[{...block,text:'Translated text',italic:true}]},'zh-HK':{title:'正標題',subtitle:'副標題'}}};
 const source=documentWith({articles:[translated],episodes:[{...episode,translations:{en:{title:'Episode',duration:'57 minutes'}}}]});
 assert.equal(validateContent(source),source);
 for(const translations of [
  {en:{id:'changed-id'}},
  {fr:{title:'Other'}},
  {en:{blocks:[{...block,type:'link',href:'javascript:alert(1)'}]}},
  {en:{blocks:[{...block,type:'image',src:'/private/photo.png',alt:'',caption:''}]}},
  {en:{blocks:[{...block,fontSize:999}]}},
 ]) assert.throws(()=>validateContent(documentWith({articles:[{...article,translations}]})),error=>error.status===400);
 const root=await mkdtemp(path.join(tmpdir(),'pb-translations-'));
 try {
  await publishContent(root,source);
  const published=JSON.parse(await readFile(path.join(root,'src/content/published.json'),'utf8'));
  assert.deepEqual(published.articles[0].translations,translated.translations);
  assert.equal(published.episodes[0].translations.en.title,'Episode');
 } finally { await rm(root,{recursive:true,force:true}); }
});
