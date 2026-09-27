import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';

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
const collectionIds=['columns/zige','columns/xuyuan','columns/meixuefeng','festivals/cannes','festivals/venice','festivals/berlin'];
export function validateContent(value) {
 const fail=message=>{throw Object.assign(new Error(message),{status:400});};
 if(!value||value.version!==1||!Array.isArray(value.articles)||!Array.isArray(value.episodes))fail('内容格式不正确。');
 if(value.articles.length>1000||value.episodes.length>1000)fail('内容数量超过本地后台上限。');
 for(const records of [value.articles,value.episodes]){
  const ids=new Set();for(const record of records){if(!validId(record.id)||ids.has(record.id))fail('网址标识不正确或重复。');ids.add(record.id);}
 }
 for(const a of value.articles){
  if(!text(a.title,240)||!a.title.trim()||!text(a.subtitle,1000)||!text(a.author,100)||!text(a.category,100))fail('请填写文章标题，并检查其他文本长度。');
  if(!['draft','published'].includes(a.status)||!collectionIds.includes(a.collection))fail('请选择文章状态与所属栏目。');
  if(a.publishedAt!==''&&!validDate(a.publishedAt))fail('文章日期格式不正确。');
  if(a.status==='published'&&(!a.author.trim()||!a.publishedAt))fail('发布文章前请填写作者和日期。');
  if(a.cover&&!safeImage(a.cover))fail('文章封面必须来自图片库。');
  if(!Array.isArray(a.blocks)||a.blocks.length>500)fail('文章段落格式不正确。');
  for(const b of a.blocks){
   if(!['paragraph','h2','h3','quote','image','link'].includes(b.type)||!text(b.text)||!Number.isInteger(b.fontSize)||b.fontSize<14||b.fontSize>48||!['left','center','right'].includes(b.align)||typeof b.bold!=='boolean'||typeof b.italic!=='boolean')fail('正文格式不正确。');
   if(b.type==='image'&&(!safeImage(b.src)||!text(b.alt,400)||!text(b.caption,1000)))fail('请选择正文图片并检查说明。');
   if(b.type==='link'&&!safeLink(b.href))fail('链接必须以 https:// 或 http:// 开头。');
  }
  if(a.status==='published'&&!a.blocks.some(b=>b.type==='image'||b.text.trim()))fail('发布文章前请填写正文。');
 }
 for(const e of value.episodes){
  if(e.publishedAt && !validDate(e.publishedAt))fail('播客发布时间格式不正确。');
  if(!text(e.title,400)||!e.title.trim()||!safeLink(e.url)||!safeImage(e.cover)||!(e.duration===null||text(e.duration,80))||!(e.access===null||text(e.access,80)))fail('请检查播客标题、封面与跳转链接。');
 }
 return value;
}
export async function atomicWrite(file,value){await mkdir(path.dirname(file),{recursive:true});const temp=file+'.'+randomUUID()+'.tmp';await writeFile(temp,JSON.stringify(value,null,2)+'\n');await rename(temp,file);}
export async function readContent(root){return JSON.parse(await readFile(path.join(root,'content/editorial.json'),'utf8'));}
export async function publishContent(root,content){
 const published={version:1,articles:content.articles.filter(a=>a.status==='published'),episodes:content.episodes};
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
