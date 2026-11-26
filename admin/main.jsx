import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { contentAsset, textStyle, imageStyle } from '../src/ContentBlocks';
import { ArticleBodyBlocks } from '../src/ArticlePreface';
import { archiveCategories, classifyArchiveProject } from '../shared/archive.mjs';
import { defaultCollections, festivalLogoOptions } from '../shared/editorial-defaults.mjs';
import RichTextEditor from './RichTextEditor';
import { replaceArticleSection } from '../shared/article-editing.mjs';
import './style.css';

const dateNow = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const newId = prefix => prefix + '-' + crypto.randomUUID().slice(0, 8);
const blankBlock = (type = 'paragraph') => ({ type, text: '', fontSize: type === 'h2' ? 28 : type === 'h3' ? 24 : 20, align: type === 'image' ? 'center' : 'left', bold: false, italic: false, ...(type === 'image' ? { src: '', alt: '', caption: '' } : {}), ...(type === 'link' ? { href: '' } : {}) });
const collectionPath = collection => collection.kind + '/' + collection.id;
const tabLabels = { articles: '文章', episodes: '播客', collections: '栏目分类', media: '图片库' };

const translationFields = {
 articles: ['title', 'subtitle', 'author', 'category', 'blocks', 'preface', 'prefaceOffset'],
 collections: ['name', 'english', 'description'],
 episodes: ['title', 'duration', 'access'],
};

function Alignment({ label, value = 'left', onChange }) {
 return <label>{label}<select value={value} onChange={event => onChange(event.target.value)}><option value="left">左对齐</option><option value="center">居中</option><option value="right">右对齐</option></select></label>;
}

function TextFormat({ label, value = {}, onChange }) {
 return <div className="format-controls" aria-label={label + '排版'}>
  <label>{label}字号（px）<input type="number" min="12" max="80" step="1" placeholder="跟随网站默认" value={value.fontSize ?? ''} onChange={event => onChange({ ...value, fontSize: event.target.value === '' ? null : Number(event.target.value) })}/></label>
  <Alignment label={label + '对齐'} value={value.align} onChange={align => onChange({ ...value, align })}/>
  <div className="format-toggles"><button type="button" aria-label={label + '粗体'} aria-pressed={!!value.bold} onClick={() => onChange({ ...value, bold: !value.bold })}><b>B</b> 粗体</button><button type="button" aria-label={label + '斜体'} aria-pressed={!!value.italic} onClick={() => onChange({ ...value, italic: !value.italic })}><i>I</i> 斜体</button><button type="button" onClick={() => onChange({})}>恢复默认</button></div>
 </div>;
}

function ImageFormat({ label, value = {}, onChange }) {
 return <div className="image-format" aria-label={label + '尺寸'}>
  <label>{label}宽度：{value.width ? value.width + '%' : '自动'}<input type="range" min="20" max="100" step="1" value={value.width ?? 100} onChange={event => onChange({ ...value, width: Number(event.target.value) })}/></label>
  <label>{label}最大高度（px）<input type="number" min="120" max="1200" step="1" placeholder="跟随网站默认" value={value.maxHeight ?? ''} onChange={event => onChange({ ...value, maxHeight: event.target.value === '' ? null : Number(event.target.value) })}/></label>
  <Alignment label={label + '对齐'} value={value.align || 'center'} onChange={align => onChange({ ...value, align })}/>
  <button type="button" onClick={() => onChange({})}>恢复默认尺寸</button>
  <small>宽度按正文区域的百分比设置，图片保留完整比例；最大高度留空使用网站默认值。</small>
 </div>;
}

function MediaGallery({ images, busy, onChoose }) {
 const [filter,setFilter] = useState('');
 const [page,setPage] = useState(0);
 const matches = (images||[]).filter(image => image.url.toLowerCase().includes(filter.trim().toLowerCase()));
 const perPage = 60;
 const pages = Math.max(1, Math.ceil(matches.length/perPage));
 const currentPage = Math.min(page,pages-1);
 return <><div className="gallery-tools"><input aria-label="搜索图片路径" placeholder="搜索文件名或文章标识" value={filter} onChange={event => {setFilter(event.target.value);setPage(0);}}/>
  <button type="button" disabled={!currentPage} onClick={() => setPage(currentPage-1)}>上一页</button><span>{currentPage+1} / {pages}</span><button type="button" disabled={currentPage+1>=pages} onClick={() => setPage(currentPage+1)}>下一页</button></div>
  <div className="media-grid">{matches.slice(currentPage*perPage,(currentPage+1)*perPage).map(image => {
   const thumbnail = <><img src={contentAsset(image.url)} alt={image.name} loading="lazy"/><small>{image.name}</small><code>{image.url}</code></>;
   return onChoose ? <button type="button" key={image.url} disabled={busy} onClick={() => onChoose(image.url)}>{thumbnail}</button> : <div key={image.url}>{thumbnail}</div>;
  })}</div>{!images ? <p>正在载入图片库…</p> : !matches.length && <p>没有匹配的图片。</p>}</>;
}

function MediaPicker({ images, busy, onUpload, onChoose, onClose }) {
 const ref = useRef(null);
 const backdropPress = useRef(false);
 useEffect(() => {
  const dialog = ref.current;
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  dialog.showModal();
  return () => { document.body.style.overflow = previousOverflow; if (dialog.open) dialog.close(); };
 }, []);
 function outside(event) {
  const box = event.currentTarget.getBoundingClientRect();
  return event.target === event.currentTarget && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom);
 }
 return <dialog ref={ref} className="media-modal" aria-labelledby="media-picker-title" onClose={onClose} onPointerDown={event => { backdropPress.current = outside(event); }} onClick={event => { if (backdropPress.current && outside(event) && !busy) ref.current.close(); }} onCancel={event => { if (busy) event.preventDefault(); }}>
  <header><h2 id="media-picker-title">选择图片</h2><button type="button" disabled={busy} onClick={() => ref.current.close()}>关闭</button></header>
  <label className="upload-button">上传新图片<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={busy} onChange={event => { onUpload(event.target.files[0]); event.target.value = ''; }}/></label>
  <MediaGallery images={images} busy={busy} onChoose={onChoose}/>
 </dialog>;
}

function Admin() {
 const [session, setSession] = useState(null), [content, setContent] = useState(null), [revision, setRevision] = useState('');
 const [locale, setLocale] = useState('zh-CN');
 const [tab, setTab] = useState('articles'), [selected, setSelected] = useState(''), [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false);
 const [notice, setNotice] = useState(''), [error, setError] = useState(''), [images, setImages] = useState(null), [picker, setPicker] = useState(null), [preview, setPreview] = useState(false), [query, setQuery] = useState('');
 const [categoryFilter,setCategoryFilter]=useState('');
 const mediaRequest=useRef(null);
 const username = useRef(null), password = useRef(null), confirmation = useRef(null);
 async function api(route, options = {}) {
  const response = await fetch('/api/admin/' + route, { ...options, headers: { 'Content-Type': 'application/json', ...(session?.csrf ? { 'X-CSRF-Token': session.csrf } : {}), ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '操作失败。');
  return data;
 }
 useEffect(() => { api('session').then(setSession).catch(error => setError(error.message)); }, []);
 useEffect(() => { if (session?.authenticated) reload(); }, [session?.authenticated]);
 useEffect(() => {
  if(session?.authenticated && (tab==='media'||picker) && !images)refreshMedia().catch(error=>setError(error.message));
 },[session?.authenticated,tab,Boolean(picker),images]);
 useEffect(() => { const prevent = event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } }; window.addEventListener('beforeunload', prevent); return () => window.removeEventListener('beforeunload', prevent); }, [dirty]);
 async function reload() {
  try {
   const data = await api('content');
   setContent({ ...data.content, collections: data.content.collections ?? structuredClone(defaultCollections) });
   setRevision(data.revision); setDirty(false); setError(''); setNotice(''); setImages(null);
  } catch (error) { setError(error.message); }
 }
 function refreshMedia() {
  if(!mediaRequest.current)mediaRequest.current=api('media').then(data=>setImages(data.images)).finally(()=>{mediaRequest.current=null;});
  return mediaRequest.current;
 }
 async function authenticate(event) {
  event.preventDefault(); setError('');
  if (session.setup && password.current.value !== confirmation.current.value) { setError('两次密码不一致。'); return; }
  setBusy(true);
  try { const data = await api(session.setup ? 'setup' : 'login', { method: 'POST', body: JSON.stringify({ username: username.current.value, password: password.current.value }) }); setSession({ authenticated: true, setup: false, csrf: data.csrf }); }
  catch (error) { setError(error.message); } finally { setBusy(false); }
 }
 async function save() {
  setBusy(true); setError(''); setNotice('');
  try {
   const classified = {...content, articles:content.articles.map(classifyArchiveProject)};
   const data = await api('content', { method: 'PUT', body: JSON.stringify({content:classified, revision}) });
   setContent(classified);
   setRevision(data.revision); setDirty(false); setNotice('已保存到本地。检查前台预览后，可在 VS Code 提交并推送上线。');
  }
  catch (error) { setError(error.message); } finally { setBusy(false); }
 }
 async function logout() {
  if (dirty && !confirm('还有未保存的修改，确定退出？')) return;
  try { await api('logout', { method: 'POST', body: '{}' }); setSession({ authenticated: false, setup: false }); setContent(null); setDirty(false); }
  catch (error) { setError(error.message); }
 }
 const records = content?.[tab] || [];
 const recordKey = record => tab === 'collections' ? collectionPath(record) : record.id;
 const sourceRecord = records.find(record => recordKey(record) === selected);
 const localized = locale !== 'zh-CN';
 const translation = localized ? sourceRecord?.translations?.[locale] : null;
 const current = sourceRecord && translation ? { ...sourceRecord, ...translation } : sourceRecord;
 const collectionUses = current && tab === 'collections' ? content.articles.filter(article => article.collection === collectionPath(current)) : [];
 function mutate(change) {
  setContent(previous => {
   const rows=previous[tab].map(record=>recordKey(record)===selected ? structuredClone(record) : record);
   return change({...previous,[tab]:rows});
  });
  setDirty(true);setNotice('');setError('');
 }
 function update(values) {
  mutate(next => {
   const record = next[tab].find(record => recordKey(record) === selected);
   const translatedKeys = translationFields[tab];
   if (tab === 'articles' && !localized && values.prefaceOffset !== undefined) {
    for (const translated of Object.values(record.translations || {})) {
     translated.prefaceOffset ??= Math.min(record.prefaceOffset || 0, (translated.blocks ?? record.blocks).length);
    }
   }
   for (const [key, value] of Object.entries(values)) {
    if (localized && translatedKeys.includes(key) && record.translations?.[locale]) record.translations[locale][key] = value;
    else record[key] = value;
   }
   return next;
  });
  if (tab === 'collections' && values.kind) setSelected(values.kind + '/' + current.id);
 }
 function createTranslation() {
  mutate(next => {
   const record = next[tab].find(record => recordKey(record) === selected);
   const keys = translationFields[tab].filter(key => record[key] !== undefined);
   record.translations ||= {};
   record.translations[locale] = Object.fromEntries(keys.map(key => [key, structuredClone(record[key] ?? '')]));
   return next;
  });
 }
 function removeTranslation() {
  if (!confirm('删除当前语言的译文？网站将显示简体原文。保存后生效。')) return;
  mutate(next => { delete next[tab].find(record => recordKey(record) === selected).translations[locale]; return next; });
 }
 function add() {
  if (tab === 'articles' && !content.collections.length) { setError('请先在「栏目分类」中新建专栏或影展，再添加文章。'); return; }
  let item;
  if (tab === 'articles') item = { id: newId('article'), number: '', title: '未命名文章', subtitle: '', author: '', category: '影评', collection: collectionPath(content.collections[0]), status: 'draft', publishedAt: dateNow(), cover: '', blocks: [blankBlock()] };
  else if (tab === 'collections') item = { id: newId('collection'), kind: 'columns', name: '未命名专栏', english: '', description: '' };
  else item = { id: newId('episode'), title: '未命名节目', program: 'reserved', status: 'draft', url: 'https://www.xiaoyuzhoufm.com/podcast/68c436b4de7cd32c37b1c4a8', cover: '/assets/podcast-cover.png', duration: '', access: '', publishedAt: dateNow() };
  mutate(next => { next[tab].unshift(item); return next; }); setSelected(recordKey(item)); setPreview(false); setLocale('zh-CN');
 }
 function remove() {
  if (collectionUses.length) { setError('这个栏目还有 ' + collectionUses.length + ' 篇文章（包括草稿）。请先把文章移到其他栏目，再删除。'); return; }
  if (!confirm('删除「' + (current.title || current.name) + '」？保存后生效。')) return;
  mutate(next => { next[tab] = next[tab].filter(record => recordKey(record) !== selected); return next; }); setSelected('');
 }
 function moveRecord(offset) {
  const index = records.findIndex(record => recordKey(record) === selected);
  if (index + offset < 0 || index + offset >= records.length) return;
  mutate(next => { [next[tab][index], next[tab][index + offset]] = [next[tab][index + offset], next[tab][index]]; return next; });
 }
 async function importFile(file) {
  if(!file)return;
  if(dirty){setError('请先保存当前修改，再导入文章。');return;}
  setBusy(true);setError('');setNotice('');
  try {
   const result=await api('import',{method:'POST',body:file});
   await reload();
   setNotice('新增 '+result.added+' 篇，跳过已导入的 '+result.skipped+' 篇。');
  }catch(error){setError(error.message);}finally{setBusy(false);}
 }
 async function upload(file) {
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) { setError('图片最大 10 MB。'); return; }
  setBusy(true); setError('');
  try { const data = await api('upload', { method: 'POST', headers: { 'Content-Type': file.type }, body: file }); await refreshMedia(); if (picker) chooseImage(data.url); else setNotice('图片已保存到项目图片库。'); }
  catch (error) { setError(error.message); } finally { setBusy(false); }
 }
 function chooseImage(url) {
  if (picker?.type === 'cover') update({ cover: url });
  if (picker?.type === 'inline') picker.onChoose(url);
  setPicker(null);
 }
 function changeArticleSection(field, blocks) {
  mutate(next => {
   const record = next.articles.find(item => item.id === selected);
   replaceArticleSection(record, locale, field, blocks);
   return next;
  });
 }
 function publicationFields() {
  return <>
      <label>发布时间<input type={tab==='articles' && (current.publishedAt?.length===10 || (current.archiveCategory&&!current.publishedAt)) ? 'date' : 'datetime-local'} value={current.publishedAt || ''} onChange={event => update({ publishedAt: event.target.value })}/><small>按填写的日期与时间展示；列表顺序用上移／下移调整。</small></label>
      <div className="cover-field"><div><strong>{tab === 'articles' ? '文章封面（选填）' : '播客封面'}</strong><div><button type="button" onClick={() => setPicker({ type: 'cover' })}>从图片库选择／上传</button>{current.cover && tab === 'articles' && <button type="button" onClick={() => update({ cover: '' })}>移除封面</button>}</div></div>{current.cover && <img src={contentAsset(current.cover)} alt="当前封面"/>}</div>
      {tab === 'articles' && current.cover && <ImageFormat label="封面" value={current.coverStyle} onChange={coverStyle => update({ coverStyle })}/>}
  </>;
 }
 function articleEditors() {
  const boundary = Math.min(current.prefaceOffset || 0, current.blocks.length);
  const sections = [
   ...(boundary ? [{field:'leading', label:'序言前的内容', blocks:current.blocks.slice(0, boundary)}] : []),
   {field:'preface', label:'序言（开腔）', blocks:current.preface || []},
   {field:'blocks', label:'文章正文', blocks:current.blocks.slice(boundary)},
  ];
  return sections.map(({field, label, blocks}) => {
   const canvas = <RichTextEditor key={selected + ':' + locale + ':' + field} label={label}
    blocks={blocks} disabled={busy} onChange={value => changeArticleSection(field, value)}
    onChooseImage={onChoose => setPicker({type:'inline', onChoose})}/>;
   return field === 'preface' ? <details className="preface-editor" key={field} open={blocks.some(block => block.text || block.src) || undefined}>
    <summary>序言（开腔）<small>选填 · 独立于正文</small></summary>
    <p className="hint">点击下方开始写开腔和署名，留空则隐藏。第一段可设为标题。</p>
    <label className="preface-position">序言前保留的正文段数
     <input type="number" min="0" max={current.blocks.length} step="1" value={boundary}
      onChange={event => update({prefaceOffset:Math.max(0, Math.min(current.blocks.length, Math.trunc(Number(event.target.value)) || 0))})}/>
     <small>填 0 让序言排在最前面；调整后请核对预览顺序。</small>
    </label>{canvas}
   </details> : <section className="writing-section" key={field}><h2>{label}</h2>
    {field === 'blocks' && <p className="hint">直接输入或粘贴整篇文章。选中文字设置格式，点击插图调整尺寸与图注。</p>}{canvas}</section>;
  });
 }
 function changeTab(key) { setLocale('zh-CN'); setTab(key); setSelected(''); setPreview(false); setQuery(''); setCategoryFilter(''); setError(''); }
 const previewUrl = current && tab === 'articles' ? '/?lang=' + locale + '#' + (current.collection ? '/' + current.collection : '') + '/read/' + current.id : tab === 'episodes' ? '/?lang=' + locale + '#/podcast' : '/#/about';

 if (!session) return <div className="login"><p>{error || '正在连接本地后台…'}</p></div>;
 if (!session.authenticated) return <div className="login"><form onSubmit={authenticate}><span className="eyebrow">PAPERBULLET / LOCAL STUDIO</span><h1>{session.setup ? '设置你的后台' : '登录内容后台'}</h1><p>文章、图片与播客，在这里整理。</p><label>管理员账号<input ref={username} required minLength={2} maxLength={80} autoComplete="username" autoFocus/></label><label>密码<input ref={password} type="password" required minLength={session.setup ? 12 : 1} maxLength={256} autoComplete={session.setup ? 'new-password' : 'current-password'}/></label>{session.setup && <><label>再次输入密码<input ref={confirmation} type="password" required minLength={12} autoComplete="new-password"/></label><small>密码至少 12 个字符。账号仅保存在此电脑。</small></>}<button className="primary" disabled={busy}>{busy ? '请稍候…' : session.setup ? '创建账号并进入' : '登录'}</button>{error && <p className="error" role="alert">{error}</p>}<a href="/#/about" target="_blank" rel="noreferrer">查看网站 ↗</a></form></div>;
 return <div className="studio">
  <header className="studio-header"><div><span className="eyebrow">PAPERBULLET</span><strong>内容工作室</strong></div><span className={'save-state ' + (dirty ? 'unsaved' : '')}>{dirty ? '有未保存修改' : '已保存'}</span><a href="/#/about" target="_blank" rel="noreferrer">网站预览 ↗</a><button type="button" onClick={() => { if (!dirty || confirm('重新载入会丢弃未保存修改，继续？')) reload(); }} disabled={busy}>重新载入</button><button type="button" className="primary" disabled={busy || !dirty} onClick={save}>{busy ? '处理中…' : '保存全部修改'}</button><button type="button" onClick={logout} disabled={busy}>退出</button></header>
  <p className="workflow-note">编辑内容 → 保存全部修改 → 检查本地预览 → 在 VS Code 提交并推送上线</p>
  <nav className="studio-tabs" aria-label="内容管理">{Object.entries(tabLabels).map(([key, label]) => <button type="button" key={key} disabled={busy} aria-current={tab === key ? 'page' : undefined} onClick={() => changeTab(key)}>{label}<span>{key === 'media' ? images?.length ?? '…' : content?.[key]?.length || 0}</span></button>)}</nav>
  <div className="messages" aria-live="polite">{error && <p className="error" role="alert">{error}</p>}{notice && <p className="success">{notice}</p>}</div>
  {!content ? <p className="empty">正在载入内容…</p> : tab === 'media' ? <section className="media-page"><h1>图片库</h1><p>上传后可用作文章封面、正文插图或播客图片。支持 PNG、JPG、WebP、GIF，最大 10 MB。</p><label className="upload-button">上传图片<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={busy} onChange={event => { upload(event.target.files[0]); event.target.value = ''; }}/></label><MediaGallery images={images} busy={busy}/></section> : <div className="workspace">
   <aside className="record-list"><div className="list-top"><h2>{tabLabels[tab]} <small>{records.length}</small></h2><button type="button" onClick={add} disabled={busy}>＋ 新建</button></div>{tab==='articles' && <label className="archive-import">导入文章 JSON<input type="file" accept=".json,application/json" disabled={busy||dirty} onChange={event=>{importFile(event.target.files[0]);event.target.value='';}}/></label>}<input aria-label="搜索内容" placeholder={tab === 'collections' ? '搜索栏目名称或标识' : '搜索标题或文章标识'} value={query} onChange={event => setQuery(event.target.value)}/>{tab==='articles' && <select className="archive-filter" aria-label="按网站栏目筛选" value={categoryFilter} onChange={event=>setCategoryFilter(event.target.value)}><option value="">全部网站栏目</option>{Object.entries(archiveCategories).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select>}{records.filter(record => (!categoryFilter || record.archiveCategory===categoryFilter || (categoryFilter==='partnership'&&record.partnership)) && ((record.title || record.name).includes(query) || record.id.includes(query))).map(record => <button type="button" className={'record ' + (selected === recordKey(record) ? 'selected' : '')} key={recordKey(record)} disabled={busy} onClick={() => { setSelected(recordKey(record)); setPreview(false); setError(''); }}><span>{tab === 'collections' ? (record.kind === 'columns' ? '专栏' : '影展专题') : (record.status || 'published') === 'published' ? '本地公开' : '草稿'}</span><strong>{record.title || record.name}</strong><small>{tab === 'collections' ? content.articles.filter(article => article.collection === collectionPath(record)).length + ' 篇文章（含草稿）' : record.publishedAt?.replace('T', ' ') || '未设置发布时间'}</small></button>)}{!records.length && <p className="empty">还没有内容。点击「新建」开始整理。</p>}</aside>
   <main className="editor">{!current ? <div className="editor-welcome"><span className="eyebrow">PAPERBULLET EDITORIAL</span><h1>{tab === 'articles' ? '从一篇文字开始。' : tab === 'collections' ? '为文字整理归处。' : '让声音被听见。'}</h1><p>选择左侧内容继续编辑，或新建一项。</p><button type="button" className="primary" disabled={busy} onClick={add}>＋ 新建{tabLabels[tab]}</button></div> : <>
    <div className="editor-top"><span>{tabLabels[tab]}编辑</span><div><button type="button" onClick={() => moveRecord(-1)} disabled={busy || records[0] === sourceRecord}>上移</button><button type="button" onClick={() => moveRecord(1)} disabled={busy || records.at(-1) === sourceRecord}>下移</button>{tab === 'articles' && <button type="button" onClick={() => setPreview(!preview)}>{preview ? '继续编辑' : '预览排版'}</button>}{tab !== 'collections' && !dirty && (current.status || 'published') === 'published' && <a className="button-link" href={previewUrl} target="_blank" rel="noopener noreferrer">前台查看 ↗</a>}<button type="button" className="danger" onClick={remove} disabled={busy}>删除</button></div></div>
    {<section className="language-editor" aria-label="内容翻译"><label>编辑语言<select value={locale} disabled={busy} onChange={event => { setLocale(event.target.value); setPreview(false); }}><option value="zh-CN">简体原文</option><option value="zh-HK">繁體香港</option><option value="en">English</option></select></label><p>{localized ? translation ? tab === 'collections' ? '栏目名称、英文名称与介绍独立保存；类型和标志各语言共用。' : tab === 'articles' ? '正在编辑译文。标题、序言和正文文字按语言保存。各语言的段落、图片和局部格式独立保存，不影响其他译文。' : '节目标题、时长与附加标记独立保存；节目归属、图片和链接各语言共用。' : '未提供译文，网站暂时显示简体原文。建立后请将复制的原文逐项翻译。' : tab === 'articles' ? '正文和序言按语言独立编辑；修改原文后，请自行检查和更新已有译文。' : '原文与译文分别保存。修改原文后，可切换语言同步更新已有译文。'}</p>{localized && (translation ? <button type="button" disabled={busy} className="danger" onClick={removeTranslation}>删除此译文</button> : <button type="button" disabled={busy} onClick={createTranslation}>建立译文</button>)}</section>}
    {localized && !translation ? <div className="translation-empty"><h2>{sourceRecord.title || sourceRecord.name}</h2><p>点击「建立译文」，再编辑这一语言的标题和文字。</p></div> : tab === 'articles' && preview ? <div className="article-preview"><p className="hint">当前编辑内容的排版预览；保存后可查看本地前台，草稿不会出现在公开网站。</p><span>{current.author} · {current.publishedAt?.replace('T', ' ')}</span><h1 style={textStyle(current.titleStyle)}>{current.title}</h1><p className="subtitle" style={textStyle(current.subtitleStyle)}>{current.subtitle}</p>{current.cover && !(current.archiveCategory && [...(current.preface || []), ...current.blocks].some(block=>block.type==='image'&&block.src===current.cover)) && <img className="cover-preview" style={imageStyle(current.coverStyle)} src={contentAsset(current.cover)} alt=""/>}<ArticleBodyBlocks blocks={current.blocks} preface={current.preface} prefaceOffset={current.prefaceOffset} label={locale === 'en' ? 'Preface' : locale === 'zh-HK' ? '開腔' : '开腔'} locale={locale}/></div> : <fieldset disabled={busy} className="editor-fields">
     {tab === 'collections' ? <>
      <label>栏目名称<input className="title-input" value={current.name} maxLength={100} onChange={event => update({ name: event.target.value })}/></label>
      <div className="field-row"><label>栏目类型<select value={current.kind} disabled={collectionUses.length > 0} onChange={event => update({ kind: event.target.value })}><option value="columns">专栏作者</option><option value="festivals">影展专题</option></select>{collectionUses.length > 0 && <small>先将所属文章移到其他栏目，即可调整类型或删除。</small>}</label><label>英文名称<input value={current.english} maxLength={100} onChange={event => update({ english: event.target.value })}/></label></div>
      <label>栏目介绍<textarea rows={4} value={current.description} maxLength={1000} onChange={event => update({ description: event.target.value })}/></label>
      {current.kind === 'festivals' && <label>已有影展标志<select value={current.logo || ''} onChange={event => update({ logo: event.target.value || undefined })}>
       <option value="">使用文字卡片</option>
       {festivalLogoOptions.map(({logo,name})=><option key={logo} value={logo}>{name}</option>)}
      </select></label>}
      <div className="collection-assignments"><h2>所属文章</h2>{collectionUses.length ? <ul>{collectionUses.map(article => <li key={article.id}><button type="button" onClick={() => { changeTab('articles'); setSelected(article.id); }}>{article.title}</button><small>{article.status === 'published' ? '本地公开' : '草稿'}</small></li>)}</ul> : <p className="hint">尚未归入文章。在文章编辑页的「所属栏目」中选择这里。</p>}</div>
     </> : <>
      <label>{tab === 'articles' ? '主标题' : '节目标题'}<textarea className="title-input" rows={2} value={current.title} onChange={event => update({ title: event.target.value })} maxLength={tab === 'articles' ? 240 : 400}/></label>
      {tab === 'articles' ? <>
       <details className="title-format-settings"><summary>主标题排版</summary><TextFormat label="主标题" value={current.titleStyle} onChange={titleStyle => update({ titleStyle })}/></details>
       <label>副标题／摘要<textarea rows={3} value={current.subtitle} maxLength={1000} onChange={event => update({ subtitle: event.target.value })}/></label>
       <details className="title-format-settings"><summary>副标题排版</summary><TextFormat label="副标题" value={current.subtitleStyle} onChange={subtitleStyle => update({ subtitleStyle })}/></details>
       <details className="article-settings"><summary>文章设置 <small>分类、作者与状态</small></summary><div className="article-settings-fields">
       <div className="field-row"><label>网站栏目<select value={current.archiveCategory||''} onChange={event => {const value=event.target.value;update({archiveCategory:value||undefined,...(!value&&!current.collection&&content.collections[0]?{collection:collectionPath(content.collections[0])}:{})});}}><option value="">按原有专栏或影展归类</option>{Object.entries(archiveCategories).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
        {current.archiveCategory && <label>影展名称<input value={current.festival||''} maxLength={160} onChange={event=>update({festival:event.target.value})}/></label>}</div>
       {current.archiveCategory && <label className="partnership-flag"><input type="checkbox" checked={!!current.partnership} onChange={event=>update({partnership:event.target.checked})}/>同时收录到商业合作</label>}
       <div className="field-row"><label>所属栏目<select value={current.collection} onChange={event => update({ collection: event.target.value })}>{current.archiveCategory && <option value="">使用网站栏目</option>}{content.collections.map(collection => <option key={collectionPath(collection)} value={collectionPath(collection)}>{collection.kind === 'columns' ? '专栏 · ' : '影展 · '}{collection.name}</option>)}</select></label><label>状态<select value={current.status} onChange={event => update({ status: event.target.value })}><option value="draft">草稿（仅后台可见）</option><option value="published">公开（保存后进入本地前台）</option></select></label></div>
       <div className="field-row"><label>作者<input value={current.author} maxLength={100} onChange={event => update({ author: event.target.value })}/></label><label>文章分类<input value={current.category} maxLength={100} onChange={event => update({ category: event.target.value })}/></label></div>
       {(current.archiveCategory || current.sourceTranscript!==undefined) && <details className="archive-source"><summary>原图与完整文字校对</summary><label>完整截图转录（仅后台）<textarea rows={10} maxLength={500000} value={current.sourceTranscript||''} onChange={event=>update({sourceTranscript:event.target.value})}/></label><label>原图地址（选填）<input placeholder="/uploads/…" value={current.sourceImage||''} onChange={event=>update({sourceImage:event.target.value})}/></label>{current.sourceImage?.startsWith('/uploads/')&&<a href={contentAsset(current.sourceImage)} target="_blank" rel="noreferrer">打开原图 ↗</a>}</details>}
       <label>文章编号<input inputMode="numeric" placeholder="如 006，留空自动编号" value={current.number || ''} maxLength={12} onChange={event => update({ number: event.target.value.replace(/\D/g, '') })}/><small>保留前导零，显示在文章卡片与阅读页。</small></label>
       </div></details>
      </> : <>
       <div className="field-row"><label>所属播客<select value={current.program || 'reserved'} onChange={event => update({ program: event.target.value })}><option value="overthink">过度解读</option><option value="reserved">保留意见</option></select></label><label>状态<select value={current.status || 'published'} onChange={event => update({ status: event.target.value })}><option value="draft">草稿（仅后台可见）</option><option value="published">公开（保存后进入本地前台）</option></select></label></div>
       <label>跳转链接<input type="url" placeholder="https://www.xiaoyuzhoufm.com/episode/…" value={current.url} onChange={event => update({ url: event.target.value })}/><small>点击节目卡片会打开这个地址，请填写对应单集链接。</small></label>
      </>}
      {tab === 'articles' ? <details className="article-settings"><summary>日期与封面 <small>{current.status === 'draft' ? '草稿' : '本地公开'} · {current.publishedAt?.replace('T', ' ') || '未设置日期'}</small></summary><div className="article-settings-fields">
      {publicationFields()}
      </div></details> : <>
      {publicationFields()}
      </>}
      {tab === 'episodes' ? <div className="field-row"><label>时长<input placeholder="如 57分钟" maxLength={80} value={current.duration || ''} onChange={event => update({ duration: event.target.value })}/></label><label>附加标记<input placeholder="如 试听，可留空" maxLength={80} value={current.access || ''} onChange={event => update({ access: event.target.value })}/></label></div> : articleEditors()}
     </>}
     <small className="record-id">固定网址标识：{tab === 'collections' ? collectionPath(current) : current.id}</small>
    </fieldset>}
   </>}</main>
  </div>}
  {picker && <MediaPicker images={images} busy={busy} onUpload={upload} onChoose={chooseImage} onClose={() => setPicker(null)}/>}
 </div>;
}
createRoot(document.getElementById('root')).render(<Admin/>);
