import test from 'node:test';
import assert from 'node:assert/strict';
import {replaceArticleSection} from '../shared/article-editing.mjs';
const p=text=>({type:'paragraph',text});
const fixture=()=>({id:'story',title:'原题',prefaceOffset:1,blocks:[p('原始说明'),p('原文')],preface:[p('开腔')],translations:{en:{title:'Title',blocks:[p('Note'),p('English body')],preface:[p('Preface')]},'zh-HK':{blocks:[p('說明'),p('繁體')]}}});
test('source split/merge preserves translated text, images, and inherited preface position',()=>{
 const article=fixture(); const en=structuredClone(article.translations.en);
 replaceArticleSection(article,'zh-CN','leading',[p('说明一'),p('说明二')]);
 assert.equal(article.prefaceOffset,2);
 assert.deepEqual(article.blocks,[p('说明一'),p('说明二'),p('原文')]);
 assert.deepEqual(article.translations.en,{...en,prefaceOffset:1});
 replaceArticleSection(article,'zh-CN','blocks',[p('合并的新正文')]);
 assert.deepEqual(article.translations.en,{...en,prefaceOffset:1});
});
test('translation editing owns its entire document without rewriting the original',()=>{
 const article=fixture(), original=structuredClone(article);
 replaceArticleSection(article,'en','blocks',[p('One'),p('Two'),{type:'image',src:'/uploads/test.png',caption:'Caption',imageText:'Preserved'}]);
 assert.deepEqual(article.blocks,original.blocks);
 assert.deepEqual(article.translations['zh-HK'],original.translations['zh-HK']);
 assert.deepEqual(article.translations.en.blocks.slice(0,1),[p('Note')]);
 assert.equal(article.translations.en.prefaceOffset,1);
 replaceArticleSection(article,'en','preface',[]);
 assert.deepEqual(article.preface,original.preface);
 assert.deepEqual(article.translations.en.preface,[]);
 assert.throws(()=>replaceArticleSection(article,'fr','blocks',[]));
});
