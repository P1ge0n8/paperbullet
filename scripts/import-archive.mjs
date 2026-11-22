import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importArchive } from '../server/archive-import.mjs';

const source=process.argv[2];
if(!source||process.argv.length!==3) {
 console.error('用法：node scripts/import-archive.mjs <records.json>');
 process.exitCode=1;
} else {
 try {
  const root=process.env.PAPERBULLET_ROOT?path.resolve(process.env.PAPERBULLET_ROOT):path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  const result=await importArchive(root,JSON.parse(await readFile(source,'utf8')));
  console.log('新增 '+result.added+' 篇，已导入 '+result.skipped+' 篇。');
 } catch(error){console.error(error.message);process.exitCode=1;}
}
