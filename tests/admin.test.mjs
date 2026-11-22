import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,mkdir,writeFile,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {validateContent,publishContent,revision,saveContent} from '../server/content.mjs';
const base={version:1,articles:[],episodes:[]};
const article={id:'qa-story',title:'校验文章',subtitle:'',author:'测试作者',category:'影评',status:'draft',collection:'columns/zige',publishedAt:'2026-09-27T20:35',cover:'',blocks:[{type:'paragraph',text:'正文内容',fontSize:20,bold:false,italic:false,align:'left'}]};
test('validates rich blocks, destinations, IDs and editable timestamps',()=>{
 assert.equal(validateContent({...base,articles:[article]}).articles.length,1);
 for(const invalid of [ {...article,publishedAt:'2026-02-31T25:00'},{...article,blocks:[{...article.blocks[0],type:'script'}]},{...article,blocks:[{...article.blocks[0],type:'link',href:'javascript:alert(1)'}]},{...article,cover:'/uploads/../account.png'}])assert.throws(()=>validateContent({...base,articles:[invalid]}));
 assert.throws(()=>validateContent({...base,articles:[article,article]}));
});
test('draft isolation and optimistic conflict detection survive disk saves',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'pb-content-'));
 try{await mkdir(path.join(root,'content'));await writeFile(path.join(root,'content/editorial.json'),JSON.stringify(base));
 const changed={...base,articles:[article]};await saveContent(root,changed,revision(base));
 assert.equal(JSON.parse(await readFile(path.join(root,'src/content/published.json'))).articles.length,0);
 await assert.rejects(saveContent(root,changed,revision(base)),e=>e.status===409);
 changed.articles=[{...article,status:'published'}];await publishContent(root,changed);
 assert.equal(JSON.parse(await readFile(path.join(root,'src/content/published.json'))).articles[0].publishedAt,'2026-09-27T20:35');
 }finally{await rm(root,{recursive:true,force:true});}
});
test('local API enforces login, origin, CSRF; persists content and uploads',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'pb-api-'));let processHandle;
 try{
  await mkdir(path.join(root,'content'));await writeFile(path.join(root,'content/editorial.json'),JSON.stringify(base));
  await symlink(path.resolve('node_modules'),path.join(root,'node_modules'),'dir');
  const port=4197;const origin='http://127.0.0.1:'+port;
  processHandle=spawn(process.execPath,['server/local-admin.mjs'],{cwd:process.cwd(),env:{...process.env,ADMIN_PORT:String(port),PAPERBULLET_ROOT:root,PAPERBULLET_ADMIN_DIR:''},stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Server did not start')),15000);processHandle.stdout.on('data',data=>{if(data.toString().includes('本地后台')){clearTimeout(timer);resolve();}});processHandle.once('exit',()=>{clearTimeout(timer);reject(new Error('Server exited'));});});
  const request=(route,options={})=>fetch(origin+'/api/admin/'+route,options);
  assert.equal((await request('content')).status,401);
  assert.equal((await request('setup',{method:'POST',headers:{Origin:'https://elsewhere.test'},body:'{}'})).status,403);
  const created=await request('setup',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({username:'test-editor',password:'local-test-password-3492'})});
  assert.equal(created.status,200);const cookie=created.headers.get('set-cookie').split(';')[0],csrf=(await created.json()).csrf;
  const headers={Cookie:cookie,Origin:origin,'Content-Type':'application/json','X-CSRF-Token':csrf};
  assert.equal((await request('content',{method:'PUT',headers:{Cookie:cookie,Origin:origin},body:'{}'})).status,403);
  assert.equal((await request('import',{method:'POST',headers:{Origin:origin},body:'[]'})).status,401);
  assert.equal((await request('import',{method:'POST',headers:{Cookie:cookie,Origin:origin},body:'[]'})).status,403);
  const snapshot=await (await request('content',{headers})).json();
  const updated={...base,articles:[{...article,status:'published'}]};
  const saved=await request('content',{method:'PUT',headers,body:JSON.stringify({content:updated,revision:snapshot.revision})});assert.equal(saved.status,200);
  const readback=await (await request('content',{headers})).json();assert.equal(readback.content.articles[0].title,article.title);
  assert.equal((await request('upload',{method:'POST',headers,body:'<svg onload="bad()"/>'})).status,400);
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP1kAAAAASUVORK5CYII=','base64');
  const uploaded=await request('upload',{method:'POST',headers:{...headers,'Content-Type':'image/png'},body:png});assert.equal(uploaded.status,200);const media=await uploaded.json();assert.ok(media.url.startsWith('/uploads/'));assert.deepEqual(await readFile(path.join(root,'public',media.url)),png);
  const sourceTranscript='校对'.repeat(180000);
  const archive=[0,1,2].map(n=>({id:'archive-'+n,title:'图文',status:'published',archiveCategory:'festival',festival:'测试影展',sourceTranscript,blocks:[{type:'paragraph',text:'文章内容'}]}));
  const imported=await request('import',{method:'POST',headers,body:JSON.stringify(archive)});assert.equal(imported.status,200);assert.deepEqual(await imported.json(),{added:3,skipped:0});
  const stored=await (await request('content',{headers})).json();assert.equal(stored.content.articles[1].sourceTranscript,sourceTranscript);
  const resaved=await request('content',{method:'PUT',headers,body:JSON.stringify(stored)});assert.equal(resaved.status,200);
  const articleBody=await fetch(origin+'/archive-articles/archive-0.json');assert.equal(articleBody.status,200);assert.equal((await articleBody.json()).sourceTranscript,undefined);
  assert.equal((await fetch(origin+'/.local-admin/account.json')).status,404);
  assert.equal((await fetch(origin+'/content/editorial.json')).status,404);
  // Prime Vite's ES module, then replace the index from outside the server as the CLI does.
  const previewUrl=origin+'/src/content/published.json?import';
  const previewModule=async()=>(await fetch(previewUrl)).text();
  const marker='externally-updated-preview-title';
  assert.ok(!(await previewModule()).includes(marker));
  const changed=JSON.parse(await readFile(path.join(root,'content/editorial.json'),'utf8'));
  const baseRevision=revision(changed);
  changed.articles[0].title=marker;
  await saveContent(root,changed,baseRevision);
  let refreshed=false;
  for(let attempt=0;attempt<25&&!refreshed;attempt++){
   await new Promise(resolve=>setTimeout(resolve,100));
   refreshed=(await previewModule()).includes(marker);
  }
  assert.ok(refreshed,'The original preview URL must reflect external editorial saves');
  assert.equal((await request('logout',{method:'POST',headers,body:'{}'})).status,200);
  assert.equal((await request('content',{headers})).status,401);
 }finally{if(processHandle&&processHandle.exitCode===null&&!processHandle.killed){const closed=new Promise(resolve=>processHandle.once('exit',resolve));processHandle.kill();await closed;}await rm(root,{recursive:true,force:true});}
});
