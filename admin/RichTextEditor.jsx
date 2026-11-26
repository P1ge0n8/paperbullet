import React, { useEffect, useRef, useState } from 'react';
import { Extension, Node, mergeAttributes } from '@tiptap/core';
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { NodeSelection } from '@tiptap/pm/state';
import { ArrowCounterClockwise, ArrowClockwise, ImageSquare, LinkSimple, TextAlignLeft, TextAlignCenter, TextAlignRight, TextB, TextItalic, TextTSlash } from '@phosphor-icons/react';
import { blocksToDocument, documentToBlocks, safeRichTextHref } from '../shared/rich-text.mjs';
import { contentAsset, imageStyle } from '../src/ContentBlocks';
import './rich-editor.css';

const localImage = src => typeof src === 'string' && /^\/(?:assets|uploads)\//.test(src) && !src.includes('..');
const LegacyBlocks = Extension.create({
 name: 'legacyBlocks',
 addGlobalAttributes() {
  return [{ types: ['paragraph', 'heading'], attributes: { legacy: { default: null, rendered: false, parseHTML: () => null } } }];
 },
});

function EditorialImageView({ node, selected }) {
 const { src, alt, caption } = node.attrs;
 return <NodeViewWrapper className={'rich-image' + (selected ? ' is-selected' : '')} contentEditable={false} data-drag-handle>
  <figure style={{...imageStyle(node.attrs),maxHeight:undefined}}>
   {src ? <img src={contentAsset(src)} alt={alt || caption || '文章插图'} style={{maxHeight:node.attrs.maxHeight ? `${node.attrs.maxHeight}px` : 'min(48svh, 420px)'}} draggable="false"/> : <div className="rich-image-missing">尚未选择图片</div>}
   {caption && <figcaption>{caption}</figcaption>}
  </figure>
  {selected && <span className="rich-image-selection">已选中图片 · 在工具栏下方调整</span>}
 </NodeViewWrapper>;
}

const EditorialImage = Node.create({
 name: 'image', group: 'block', atom: true, draggable: true,
 addAttributes() {
  const defaults = { type:'image', src:'', alt:'', caption:'', imageText:null, width:null, maxHeight:null, align:'center', text:'', fontSize:null, bold:false, italic:false, legacy:null };
  return Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, { default:value, rendered: ['src','alt'].includes(key), parseHTML: element => key === 'src' || key === 'alt' ? element.getAttribute(key) || '' : value }]));
 },
 parseHTML() { return [{tag:'img[src]', getAttrs:element => localImage(element.getAttribute('src')) ? null : false}]; },
 renderHTML({ HTMLAttributes }) { return ['img', mergeAttributes(HTMLAttributes)]; },
 addNodeView() { return ReactNodeViewRenderer(EditorialImageView); },
});

export const richTextExtensions = [
 StarterKit.configure({
  heading:{levels:[2,3]}, bulletList:false, orderedList:false, listItem:false, listKeymap:false,
  code:false, codeBlock:false, strike:false, underline:false, horizontalRule:false, trailingNode:false,
  link:{openOnClick:false, autolink:false, linkOnPaste:true, defaultProtocol:'https', isAllowedUri:url => !!safeRichTextHref(url)},
 }),
 LegacyBlocks, TextStyle, FontSize, TextAlign.configure({types:['heading','paragraph'], alignments:['left','center','right'], defaultAlignment:'left'}), EditorialImage,
];

function selectionState(editor) {
 const selection = editor.state.selection;
 const image = selection instanceof NodeSelection && selection.node.type.name === 'image' ? {pos:selection.from, attrs:selection.node.attrs} : null;
 return {
  bold:editor.isActive('bold'), italic:editor.isActive('italic'), link:editor.isActive('link'),
  fontSize:editor.getAttributes('textStyle').fontSize || '',
  type:editor.isActive('blockquote') ? 'quote' : editor.isActive('heading',{level:2}) ? 'h2' : editor.isActive('heading',{level:3}) ? 'h3' : 'paragraph',
  align:editor.getAttributes(editor.isActive('heading') ? 'heading' : 'paragraph').textAlign || 'left',
  undo:editor.can().undo(), redo:editor.can().redo(), image,
  characters:editor.state.doc.textContent.replace(/\s/g,'').length,
 };
}

function ToolButton({ label, children, active, disabled, onClick }) {
 return <button type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled} onMouseDown={event => event.preventDefault()} onClick={onClick}>{children}</button>;
}

export default function RichTextEditor({ blocks, onChange, onChooseImage, label='文章正文', disabled=false }) {
 const rootRef = useRef(null);
 const changeRef = useRef(onChange);
 const emitted = useRef(JSON.stringify(blocks));
 const [initialContent] = useState(() => blocksToDocument(blocks));
 const [interacted, setInteracted] = useState(false);
 const [tools, setTools] = useState(null);
 const [fontSize, setFontSize] = useState('');
 const [linkPanel, setLinkPanel] = useState(null);
 const [linkError, setLinkError] = useState('');
 const [pasteNotice, setPasteNotice] = useState('');
 changeRef.current = onChange;
 const editor = useEditor({
  extensions:richTextExtensions, content:initialContent, editable:!disabled, shouldRerenderOnTransaction:false,
  onFocus() { setInteracted(true); },
  editorProps:{
   attributes:{class:'rich-document', role:'textbox', 'aria-multiline':'true', 'aria-label':label, spellcheck:'false'},
   handlePaste(_view,event) {
    if (Array.from(event.clipboardData?.files || []).some(file => file.type.startsWith('image/'))) {
     setPasteNotice('图片请通过「插入图片」上传，以便保存到网站。');
    }
    return false;
   },
   handleDrop(_view,event,_slice,moved) {
    if (!moved && event.dataTransfer?.files.length) {
     setPasteNotice('图片请通过「插入图片」上传，以便保存到网站。');
     return true;
    }
    return false;
   },
   transformPastedHTML(html) {
    const document = new DOMParser().parseFromString(html,'text/html');
    document.querySelectorAll('script,style,iframe,object,embed').forEach(element => element.remove());
    let removed = false;
    document.querySelectorAll('img').forEach(element => { if (!localImage(element.getAttribute('src'))) { element.remove(); removed = true; } });
    document.querySelectorAll('[style]').forEach(element => {
     const size = parseFloat(element.style.fontSize);
     if (size && (!Number.isInteger(size) || size < 14 || size > 48 || !element.style.fontSize.endsWith('px'))) element.style.removeProperty('font-size');
    });
    if (removed) setPasteNotice('已粘贴文字。外部图片请通过「插入图片」上传。');
    return document.body.innerHTML;
   },
  },
  onUpdate({editor:instance}) {
   const next = documentToBlocks(instance.getJSON());
   emitted.current = JSON.stringify(next);
   changeRef.current(next);
  },
 });
 useEffect(() => {
  if (!editor) return;
  const refresh = () => setTools(selectionState(editor));
  refresh(); editor.on('transaction',refresh);
  return () => editor.off('transaction',refresh);
 },[editor]);
 useEffect(() => { if (editor) editor.setEditable(!disabled,false); },[editor,disabled]);
 useEffect(() => {
  const header = document.querySelector('.studio-header');
  if (!header || !rootRef.current) return;
  const measure = () => rootRef.current?.style.setProperty('--rich-header-offset',`${Math.ceil(header.getBoundingClientRect().height)}px`);
  measure();
  const observer = new ResizeObserver(measure);
  observer.observe(header);
  return () => observer.disconnect();
 },[editor,!!tools]);
 useEffect(() => {
  if (!editor) return;
  const incoming = JSON.stringify(blocks);
  if (incoming !== emitted.current) {
   emitted.current = incoming;
   editor.commands.setContent(blocksToDocument(blocks),{emitUpdate:false});
  }
 },[editor,blocks]);
 useEffect(() => { setFontSize(tools?.fontSize ? String(parseFloat(tools.fontSize)) : ''); },[tools?.fontSize]);
 if (!editor || !tools) return <p className="hint">正在载入编辑区…</p>;

 function chooseImage(replace=false) {
  const bookmark = editor.state.selection.getBookmark();
  const position = replace ? tools.image?.pos : null;
  onChooseImage(url => {
   if (editor.isDestroyed || !localImage(url)) return;
   if (position !== null && editor.state.doc.nodeAt(position)?.type.name === 'image') {
    editor.chain().focus().setNodeSelection(position).updateAttributes('image',{src:url}).run();
   } else {
    const selection = bookmark.resolve(editor.state.doc);
    editor.view.dispatch(editor.state.tr.setSelection(selection));
    editor.chain().focus().insertContent({type:'image',attrs:{src:url}}).run();
   }
  });
 }
 function changeType(type) {
  const chain = editor.chain().focus().unsetBlockquote();
  if (type === 'quote') chain.setParagraph().setBlockquote();
  else if (type === 'h2' || type === 'h3') chain.setHeading({level:Number(type.slice(1))});
  else chain.setParagraph();
  chain.command(({tr}) => {
   const mark = editor.schema.marks.textStyle.create({fontSize:`${type==='h2' ? 28 : type==='h3' ? 24 : 20}px`});
   tr.doc.nodesBetween(tr.selection.from,tr.selection.to,(node,pos) => {
    if (node.isTextblock) {tr.addMark(pos+1,pos+node.nodeSize-1,mark);return false;}
   });
   if (tr.selection.empty) tr.addStoredMark(mark);
   return true;
  }).run();
 }
 function applyFontSize() {
  if (fontSize === (tools.fontSize ? String(parseFloat(tools.fontSize)) : '')) return;
  if (!fontSize) { editor.chain().focus().unsetFontSize().run(); return; }
  const value = Number(fontSize);
  if (Number.isInteger(value) && value >= 14 && value <= 48) editor.chain().focus().setFontSize(value+'px').run();
  else setFontSize(tools.fontSize ? String(parseFloat(tools.fontSize)) : '');
 }
 function openLink() {
  setLinkError('');
  setLinkPanel({href:editor.getAttributes('link').href || '', bookmark:editor.state.selection.getBookmark()});
 }
 function applyLink(remove=false) {
  const href = linkPanel.href.trim();
  if (!remove && !safeRichTextHref(href)) { setLinkError('请填写以 https:// 或 http:// 开头的完整网址。'); return; }
  editor.view.dispatch(editor.state.tr.setSelection(linkPanel.bookmark.resolve(editor.state.doc)));
  if (remove) editor.chain().focus().extendMarkRange('link').unsetLink().run();
  else editor.chain().focus().extendMarkRange('link').setLink({href}).run();
  setLinkPanel(null); setLinkError('');
 }
 function updateImage(values) {
  if (tools.image && editor.state.doc.nodeAt(tools.image.pos)?.type.name === 'image') {
   const node = editor.state.doc.nodeAt(tools.image.pos);
   editor.view.dispatch(editor.state.tr.setNodeMarkup(tools.image.pos,undefined,{...node.attrs,...values}));
  }
 }
 const image = interacted ? tools.image?.attrs : null;
 const textDisabled = disabled || !!tools.image;
 return <div ref={rootRef} className="rich-editor" data-disabled={disabled || undefined} onPointerDownCapture={() => setInteracted(true)}>
  <div className="rich-toolbar-shell">
   <div className="rich-toolbar" role="toolbar" aria-label={label+'工具栏'}>
    <select aria-label="段落样式" value={tools.type} disabled={textDisabled} onChange={event => changeType(event.target.value)}>
     <option value="paragraph">正文</option><option value="h2">二级标题</option><option value="h3">三级标题</option><option value="quote">引用</option>
    </select>
    <label className="rich-font-size"><span className="rich-sr-only">选中文字字号</span><input aria-label="选中文字字号" type="number" min="14" max="48" step="1" placeholder="默认" value={fontSize} disabled={textDisabled} onChange={event => setFontSize(event.target.value)} onBlur={applyFontSize} onKeyDown={event => {if(event.key==='Enter'){event.preventDefault();applyFontSize();}}}/><span>px</span></label>
    <div className="rich-tool-group">
     <ToolButton label="粗体（⌘/Ctrl+B）" active={tools.bold} disabled={textDisabled} onClick={() => editor.chain().focus().toggleBold().run()}><TextB size={19}/></ToolButton>
     <ToolButton label="斜体（⌘/Ctrl+I）" active={tools.italic} disabled={textDisabled} onClick={() => editor.chain().focus().toggleItalic().run()}><TextItalic size={19}/></ToolButton>
     <ToolButton label="设置链接" active={tools.link} disabled={textDisabled} onClick={openLink}><LinkSimple size={19}/></ToolButton>
     <ToolButton label="清除文字格式" disabled={textDisabled} onClick={() => editor.chain().focus().unsetAllMarks().run()}><TextTSlash size={19}/></ToolButton>
    </div>
    <div className="rich-tool-group">
     {[["left",'左对齐',TextAlignLeft],["center",'居中',TextAlignCenter],["right",'右对齐',TextAlignRight]].map(([align,name,Icon]) => <ToolButton key={align} label={name} active={tools.align===align} disabled={textDisabled} onClick={() => editor.chain().focus().setTextAlign(align).run()}><Icon size={19}/></ToolButton>)}
    </div>
    <ToolButton label="插入图片" disabled={disabled} onClick={() => chooseImage()}><ImageSquare size={19}/><span>插入图片</span></ToolButton>
    <div className="rich-tool-group rich-history">
     <ToolButton label="撤销（⌘/Ctrl+Z）" disabled={disabled || !tools.undo} onClick={() => editor.chain().focus().undo().run()}><ArrowCounterClockwise size={18}/></ToolButton>
     <ToolButton label="重做（⌘/Ctrl+Shift+Z）" disabled={disabled || !tools.redo} onClick={() => editor.chain().focus().redo().run()}><ArrowClockwise size={18}/></ToolButton>
    </div>
   </div>
   {linkPanel && <div className="rich-link-panel">
    <label>链接地址<input autoFocus type="url" placeholder="https://…" value={linkPanel.href} disabled={disabled} onChange={event => setLinkPanel({...linkPanel,href:event.target.value})} onKeyDown={event => {if(event.key==='Enter'){event.preventDefault();applyLink();}if(event.key==='Escape'){event.preventDefault();setLinkPanel(null);editor.commands.focus();}}}/></label>
    <button type="button" disabled={disabled} onClick={() => applyLink()}>应用</button><button type="button" disabled={disabled} onClick={() => applyLink(true)}>移除链接</button><button type="button" onClick={() => {setLinkPanel(null);editor.commands.focus();}}>取消</button>
    {linkError && <p role="alert">{linkError}</p>}
   </div>}
   {image && <div className="rich-image-panel" aria-label="所选图片设置">
    <div className="rich-image-panel-title"><strong>图片设置</strong><button type="button" disabled={disabled} onClick={() => chooseImage(true)}>替换图片</button><button type="button" disabled={disabled} onClick={() => updateImage({width:null,maxHeight:null,align:'center'})}>恢复默认尺寸</button><button type="button" disabled={disabled} className="danger" onClick={() => editor.chain().focus().setNodeSelection(tools.image.pos).deleteSelection().run()}>删除图片</button></div>
    <div className="rich-image-options">
     <label>宽度 {image.width || 100}%<input aria-label="图片宽度" type="range" min="20" max="100" value={image.width || 100} disabled={disabled} onChange={event => updateImage({width:Number(event.target.value)})}/></label>
     <label>最大高度（px）<input aria-label="图片最大高度" type="number" min="120" max="1200" placeholder="自动" value={image.maxHeight || ''} disabled={disabled} onChange={event => updateImage({maxHeight:event.target.value ? Number(event.target.value) : null})}/></label>
     <label>图片对齐<select value={image.align || 'center'} disabled={disabled} onChange={event => updateImage({align:event.target.value})}><option value="left">左对齐</option><option value="center">居中</option><option value="right">右对齐</option></select></label>
     <label>图注<input value={image.caption || ''} maxLength={1000} disabled={disabled} onChange={event => updateImage({caption:event.target.value})}/></label>
    </div>
    <details><summary>图片描述与图内文字</summary><label>图片描述<input value={image.alt || ''} maxLength={400} disabled={disabled} onChange={event => updateImage({alt:event.target.value})}/></label><label>图内文字<textarea rows={3} value={image.imageText || ''} maxLength={100000} disabled={disabled} onChange={event => updateImage({imageText:event.target.value})}/></label></details>
   </div>}
  </div>
  {pasteNotice && <div className="rich-paste-note" role="status">{pasteNotice}<button type="button" onClick={() => setPasteNotice('')}>知道了</button></div>}
  <EditorContent editor={editor}/>
  <div className="rich-editor-footer"><span>直接书写或粘贴整篇文章 · Enter 换段，Shift+Enter 换行</span><span>{tools.characters.toLocaleString()} 字符</span></div>
 </div>;
}
