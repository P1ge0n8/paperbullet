import test from 'node:test';
import assert from 'node:assert/strict';
import {articles,readRoute} from '../src/articles.js';
import {contacts} from '../src/contacts.js';
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
