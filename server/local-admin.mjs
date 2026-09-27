import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import { readContent,saveContent,revision,validateContent,publishContent } from './content.mjs';

const root=process.env.PAPERBULLET_ROOT?path.resolve(process.env.PAPERBULLET_ROOT):path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const port=Number(process.env.ADMIN_PORT||4181);
const privateDir=path.join(root,'.local-admin');
await mkdir(privateDir,{recursive:true,mode:0o700});
const credentialFile=path.join(privateDir,'account.json');
let account;try{account=JSON.parse(await readFile(credentialFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
await publishContent(root,validateContent(await readContent(root)));
const sessions=new Map();let attempts=[];let saving=false;
let vite;
const error=(message,status=400)=>Object.assign(new Error(message),{status});
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
async function body(req,limit=2*1024*1024){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>limit)throw error('文件过大。',413);chunks.push(chunk);}return Buffer.concat(chunks);}
async function json(req){try{return JSON.parse((await body(req)).toString());}catch(e){if(e.status)throw e;throw error('请求格式不正确。');}}
function session(req){const token=req.headers.cookie?.match(/(?:^|;\s*)pb_session=([a-f0-9]{64})(?:;|$)/)?.[1];const data=sessions.get(token);if(data&&data.until>Date.now())return {token,...data};if(token)sessions.delete(token);return null;}
function login(res){const token=randomBytes(32).toString('hex'),csrf=randomBytes(24).toString('hex');sessions.set(token,{csrf,until:Date.now()+8*60*60*1000});res.setHeader('Set-Cookie',`pb_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800`);return csrf;}
function imageExtension(bytes){if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'png';if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'jpg';if(['GIF87a','GIF89a'].includes(bytes.subarray(0,6).toString()))return 'gif';if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP')return 'webp';throw error('仅支持 PNG、JPG、WebP、GIF 图片。');}
const server=http.createServer(async(req,res)=>{
 const expectedHosts=[`127.0.0.1:${port}`,`localhost:${port}`];
 if(!expectedHosts.includes(req.headers.host))return send(res,403,{error:'仅允许本机访问。'});
 const pathname=new URL(req.url,'http://'+req.headers.host).pathname;
 // Never serve credentials or editorial drafts through Vite's source endpoints.
 let decoded;try{decoded=decodeURIComponent(pathname);}catch{return send(res,400,{error:'路径不正确。'});}
 if(!pathname.startsWith('/api/admin/')&&/(?:^|[/\\])(?:\.local-admin|content|server)(?:[/\\]|$)/.test(decoded)&&!decoded.startsWith('/src/content/'))return send(res,404,{error:'不存在。'});
 if(!pathname.startsWith('/api/admin/'))return vite.middlewares(req,res);
 try{
  if(req.method!=='GET'&&req.headers.origin!=='http://'+req.headers.host)throw error('请求来源不正确，请从本机后台页面操作。',403);
  const auth=session(req);
  if(pathname==='/api/admin/session'&&req.method==='GET')return send(res,200,{setup:!account,authenticated:!!auth,csrf:auth?.csrf});
  if(pathname==='/api/admin/setup'&&req.method==='POST'){
   if(account)throw error('管理员账号已存在。',409);
   const {username,password}=await json(req);
   if(typeof username!=='string'||username.trim().length<2||username.length>80||typeof password!=='string'||password.length<12||password.length>256)throw error('账号至少 2 个字符，密码至少 12 个字符。');
   const salt=randomBytes(32).toString('hex');
   const next={username:username.trim(),salt,hash:scryptSync(password,salt,64).toString('hex')};
   try{await writeFile(credentialFile,JSON.stringify(next),{mode:0o600,flag:'wx'});}catch(e){if(e.code==='EEXIST')throw error('账号已设置，请刷新后登录。',409);throw e;}
   account=next;return send(res,200,{csrf:login(res)});
  }
  if(pathname==='/api/admin/login'&&req.method==='POST'){
   attempts=attempts.filter(t=>t>Date.now()-15*60*1000);if(attempts.length>=10)throw error('登录尝试过多，请 15 分钟后重试。',429);
   const {username,password}=await json(req);attempts.push(Date.now());
   if(!account||typeof password!=='string'||password.length>256||!timingSafeEqual(scryptSync(password,account.salt,64),Buffer.from(account.hash,'hex'))||username!==account.username)throw error('账号或密码不正确。',401);
   attempts=[];return send(res,200,{csrf:login(res)});
  }
  if(!auth)throw error('请先登录后台。',401);
  if(req.method!=='GET'&&req.headers['x-csrf-token']!==auth.csrf)throw error('会话校验失败，请重新登录。',403);
  if(pathname==='/api/admin/logout'&&req.method==='POST'){sessions.delete(auth.token);res.setHeader('Set-Cookie','pb_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');return send(res,200,{ok:true});}
  if(pathname==='/api/admin/content'&&req.method==='GET'){const content=await readContent(root);return send(res,200,{content,revision:revision(content)});}
  if(pathname==='/api/admin/content'&&req.method==='PUT'){
   if(saving)throw error('另一项保存正在进行，请稍后再试。',409);
   const {content,revision:expected}=await json(req);saving=true;
   try{return send(res,200,{revision:await saveContent(root,content,expected)});}finally{saving=false;}
  }
  if(pathname==='/api/admin/media'&&req.method==='GET'){
   const images=[];
   for(const folder of ['uploads','assets']){const dir=path.join(root,'public',folder);await mkdir(dir,{recursive:true});for(const name of await readdir(dir)){if(!/\.(png|jpe?g|webp|gif)$/i.test(name))continue;const info=await stat(path.join(dir,name));if(info.isFile())images.push({url:`/${folder}/${name}`,name,size:info.size});}}
   return send(res,200,{images});
  }
  if(pathname==='/api/admin/upload'&&req.method==='POST'){
   const bytes=await body(req,10*1024*1024),ext=imageExtension(bytes),name=Date.now()+'-'+randomBytes(6).toString('hex')+'.'+ext;
   await mkdir(path.join(root,'public/uploads'),{recursive:true});await writeFile(path.join(root,'public/uploads',name),bytes,{flag:'wx'});
   return send(res,200,{url:'/uploads/'+name,name,size:bytes.length});
  }
  throw error('不存在的后台接口。',404);
 }catch(e){send(res,e.status||500,{error:e.status?e.message:'保存失败，请查看本地后台终端。'});if(!e.status)console.error(e);}
});
vite=await createViteServer({root,server:{middlewareMode:true,host:'127.0.0.1',hmr:{server,clientPort:port}},appType:'spa'});
server.listen(port,'127.0.0.1',()=>console.log(`本地后台：http://127.0.0.1:${port}/admin/\n前台预览：http://127.0.0.1:${port}/`));
server.on('error',e=>{console.error(e.message);process.exit(1);});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server.close();vite.close().then(()=>process.exit(0));});
