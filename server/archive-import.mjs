import path from 'node:path';
import { realpath, stat } from 'node:fs/promises';
import { archiveCategories } from '../shared/archive.mjs';
import { publishStoredContent, readContent, revision, safeImage, saveContent, validId, validateContent } from './content.mjs';

function invalid(message) { return Object.assign(new Error(message),{status:400}); }

function normalizeBlocks(blocks) {
 if (!Array.isArray(blocks)) throw invalid('缺少文章段落。');
 return blocks.map(block=>{
  if(!block || typeof block!=='object')throw invalid('文章段落格式不正确。');
  const image=block.type==='image';
  return {text:'',fontSize:block.type==='h2'?28:block.type==='h3'?24:18,align:image?'center':'left',bold:false,italic:false,
   ...(image?{alt:'',caption:'',width:100}:{}),...block};
 });
}
function normalizeRecord(record) {
 if(!Object.hasOwn(archiveCategories,record.archiveCategory))throw invalid('请选择文章归档分类。');
 const article={subtitle:'',author:'',category:archiveCategories[record.archiveCategory],collection:'',publishedAt:'',status:'draft',cover:'',festival:'',partnership:record.archiveCategory==='partnership',...record,blocks:normalizeBlocks(record.blocks)};
 if(record.preface!==undefined)article.preface=normalizeBlocks(record.preface);
 if(record.translations)article.translations=Object.fromEntries(Object.entries(record.translations).map(([lang,entry])=>{
  if(!entry || typeof entry!=='object' || Array.isArray(entry))return [lang,entry];
  const translation={...entry};
  if(entry.blocks!==undefined)translation.blocks=normalizeBlocks(entry.blocks);
  if(entry.preface!==undefined)translation.preface=normalizeBlocks(entry.preface);
  return [lang,translation];
 }));
 return article;
}
async function verifyImages(root,articles) {
 const paths=new Set();
 for(const article of articles) {
  for(const value of [article.cover,article.sourceImage])if(value)paths.add(value);
  for(const version of [article,...Object.values(article.translations||{})]){
   for(const blocks of [version.preface,version.blocks]){
    for(const b of blocks||[])if(b.type==='image')paths.add(b.src);
   }
  }
 }
 if(!paths.size)return;
 const publicDir=await realpath(path.join(root,'public'));
 for(const image of paths) {
  if(!safeImage(image))throw invalid('无效图片地址：'+image);
  const file=await realpath(path.join(publicDir,image)).catch(()=>null);
  if(!file||!file.startsWith(publicDir+path.sep)||!(await stat(file)).isFile())throw invalid('找不到对应的本地图片：'+image);
 }
}
export async function importArchive(root,records) {
 if(!Array.isArray(records)||records.length>1000)throw invalid('导入文件必须是最多 1000 篇文章的 JSON 数组。');
 const existing=await readContent(root);
 const byId=new Map(existing.articles.map(article=>[article.id,article]));
 const importedIds=new Set(existing.archiveImports||[]);
 const ids=new Set();
 const additions=[];
 for(const record of records) {
  if(!record||!validId(record.id)||ids.has(record.id))throw invalid('导入文章的网址标识无效或重复：'+(record?.id??''));
  ids.add(record.id);
  if(importedIds.has(record.id))continue;
  if(byId.has(record.id))throw invalid('已有其他文章使用这个网址标识：'+record.id);
  try{
   const article=normalizeRecord(record);
   validateContent({version:1,collections:existing.collections,articles:[article],episodes:[]});
   additions.push(article);
  }catch(error){throw invalid(record.id+'：'+error.message);}
 }
 if(additions.length) {
  await verifyImages(root,additions);
  const content={...existing,articles:[...existing.articles,...additions],archiveImports:[...importedIds,...additions.map(article=>article.id)]};
  await saveContent(root,content,revision(existing));
 } else {
  // Also repairs derived preview files if a previous run was interrupted after saving.
  await publishStoredContent(root);
 }
 return {added:additions.length,skipped:records.length-additions.length};
}
