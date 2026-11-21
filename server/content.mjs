import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { defaultCollections } from '../shared/editorial-defaults.mjs';

export const revision = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const validId = value => typeof value==='string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(value);
const text = (value,max=20000) => typeof value==='string' && value.length<=max;
export const safeLink = value => {try {const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}};
export const safeImage = value => typeof value==='string' && /^\/(assets|uploads)\/[a-zA-Z0-9_.-]+\.(png|jpe?g|webp|gif)$/i.test(value);
function validDate(value){
 if(!text(value,16)||!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(value))return false;
 const parsed=new Date(value.length===10?value+'T00:00:00Z':value+':00Z');
 return !Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,value.length)===value;
}
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const alignment = value => ['left','center','right'].includes(value);
const integerBetween = (value,min,max) => Number.isInteger(value) && value>=min && value<=max;
function validTextStyle(style) {
 if(style===undefined)return true;
 if(!object(style)||Object.keys(style).some(key=>!['fontSize','bold','italic','align'].includes(key)))return false;
 return (style.fontSize===undefined||style.fontSize===null||integerBetween(style.fontSize,12,80))
  &&(style.bold===undefined||typeof style.bold==='boolean')
  &&(style.italic===undefined||typeof style.italic==='boolean')
  &&(style.align===undefined||alignment(style.align));
}
function validImageSize(style) {
 return (style.width===undefined||integerBetween(style.width,20,100))
  &&(style.maxHeight===undefined||style.maxHeight===null||integerBetween(style.maxHeight,120,1200));
}
function validCoverStyle(style) {
 if(style===undefined)return true;
 return object(style)&&!Object.keys(style).some(key=>!['width','maxHeight','align'].includes(key))
  &&validImageSize(style)&&(style.align===undefined||alignment(style.align));
}
function validateTranslations(record,fields,validate) {
 if(record.translations===undefined)return;
 const fail=()=>{throw Object.assign(new Error('译文格式不正确，请检查语言、文字与排版。'),{status:400});};
 if(!object(record.translations))fail();
 for(const [locale,translation] of Object.entries(record.translations)){
  if(!['zh-HK','en'].includes(locale)||!object(translation)||Object.keys(translation).some(key=>!fields.includes(key)))fail();
  validate({...record,...translation,translations:undefined});
 }
}
export function validateContent(value) {
 const fail=message=>{throw Object.assign(new Error(message),{status:400});};
 if(!value||value.version!==1||!Array.isArray(value.articles)||!Array.isArray(value.episodes))fail('内容格式不正确。');
 if(value.articles.length>1000||value.episodes.length>1000)fail('内容数量超过本地后台上限。');
 const collections=value.collections===undefined?defaultCollections:value.collections;
 if(!Array.isArray(collections)||collections.length>200)fail('栏目分类格式不正确或数量超过上限。');
 const collectionIds=new Set();
 for(const collection of collections){
  if(!object(collection)||!validId(collection.id)||!['columns','festivals'].includes(collection.kind))fail('栏目网址标识或类型不正确。');
  const key=collection.kind+'/'+collection.id;
  if(collectionIds.has(key))fail('同一类别中的栏目网址标识不能重复。');
  collectionIds.add(key);
  if(!text(collection.name,100)||!collection.name.trim()||!text(collection.english,100)||!text(collection.description,1000))fail('请填写栏目名称，并检查英文名称与简介长度。');
  if(collection.logo!==undefined&&!['cannes','venice','berlin'].includes(collection.logo))fail('影展标志不正确。');
  validateTranslations(collection,['name','description','english'],translated=>validateContent({version:1,collections:[translated],articles:[],episodes:[]}));
 }
 for(const records of [value.articles,value.episodes]){
  const ids=new Set();for(const record of records){if(!object(record)||!validId(record.id)||ids.has(record.id))fail('网址标识不正确或重复。');ids.add(record.id);}
 }
 for(const a of value.articles){
  if(!text(a.title,240)||!a.title.trim()||!text(a.subtitle,1000)||!text(a.author,100)||!text(a.category,100))fail('请填写文章标题，并检查其他文本长度。');
  if(!['draft','published'].includes(a.status))fail('请选择文章状态。');
  if(!collectionIds.has(a.collection))fail('文章所属栏目不存在。删除或更改栏目之前，请先将文章移至其他栏目。');
  if(a.number!==undefined&&a.number!==''&&!(typeof a.number==='string'&&/^\d{1,12}$/.test(a.number)))fail('文章编号请使用最多 12 位数字，或留空自动编号。');
  if(!validTextStyle(a.titleStyle)||!validTextStyle(a.subtitleStyle))fail('标题排版格式不正确：字号应为 12–80 的整数。');
  if(!validCoverStyle(a.coverStyle))fail('封面排版格式不正确：宽度应为 20–100%，高度应为 120–1200px。');
  if(a.publishedAt!==''&&!validDate(a.publishedAt))fail('文章日期格式不正确。');
  if(a.status==='published'&&(!a.author.trim()||!a.publishedAt))fail('发布文章前请填写作者和日期。');
  if(a.cover&&!safeImage(a.cover))fail('文章封面必须来自图片库。');
  if(!Array.isArray(a.blocks)||a.blocks.length>500)fail('文章段落格式不正确。');
  for(const b of a.blocks){
   if(!object(b)||!['paragraph','h2','h3','quote','image','link'].includes(b.type)||!text(b.text)||!Number.isInteger(b.fontSize)||b.fontSize<14||b.fontSize>48||!alignment(b.align)||typeof b.bold!=='boolean'||typeof b.italic!=='boolean')fail('正文格式不正确。');
   if(b.type==='image'&&(!safeImage(b.src)||!text(b.alt,400)||!text(b.caption,1000)))fail('请选择正文图片并检查说明。');
   if(b.type==='image'&&!validImageSize(b))fail('正文图片宽度应为 20–100%，高度应为 120–1200px。');
   if(b.type==='link'&&!safeLink(b.href))fail('链接必须以 https:// 或 http:// 开头。');
  }
  if(a.status==='published'&&!a.blocks.some(b=>b.type==='image'||b.text.trim()))fail('发布文章前请填写正文。');
  validateTranslations(a,['title','subtitle','author','category','blocks'],translated=>validateContent({version:1,collections,articles:[translated],episodes:[]}));
 }
 for(const e of value.episodes){
  if(e.program!==undefined&&!['overthink','reserved'].includes(e.program))fail('请选择播客所属节目。');
  if(e.status!==undefined&&!['draft','published'].includes(e.status))fail('请选择播客状态。');
  if(e.publishedAt && !validDate(e.publishedAt))fail('播客发布时间格式不正确。');
  if(!text(e.title,400)||!e.title.trim()||!safeLink(e.url)||!safeImage(e.cover)||!(e.duration===null||text(e.duration,80))||!(e.access===null||text(e.access,80)))fail('请检查播客标题、封面与跳转链接。');
  validateTranslations(e,['title','duration','access'],translated=>validateContent({version:1,collections,articles:[],episodes:[translated]}));
 }
 return value;
}
export async function atomicWrite(file,value){await mkdir(path.dirname(file),{recursive:true});const temp=file+'.'+randomUUID()+'.tmp';await writeFile(temp,JSON.stringify(value,null,2)+'\n');await rename(temp,file);}
export async function readContent(root){return JSON.parse(await readFile(path.join(root,'content/editorial.json'),'utf8'));}
export async function publishContent(root,content){
 validateContent(content);
 const published={version:1,collections:content.collections??defaultCollections,articles:content.articles.filter(a=>a.status==='published'),episodes:content.episodes.filter(e=>e.status!=='draft').map(e=>({...e,program:e.program??'reserved',status:e.status??'published'}))};
 await atomicWrite(path.join(root,'src/content/published.json'),published);
}
export async function saveContent(root,value,expected){
 const existing=await readContent(root);
 if(revision(existing)!==expected)throw Object.assign(new Error('内容已在另一个窗口或 VS Code 中修改。请先复制当前未保存内容，再重新载入并合并修改。'),{status:409});
 validateContent(value);
 await atomicWrite(path.join(root,'content/editorial.json'),value);
 await publishContent(root,value);
 return revision(value);
}
