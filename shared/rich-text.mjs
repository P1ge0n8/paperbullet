// The editor uses a document tree; saved articles keep the existing portable blocks.
export function safeRichTextHref(value) {
 try {
  const url = new URL(value);
  return typeof value === 'string' && ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
 } catch { return false; }
}

const defaultSize = type => type === 'h2' ? 28 : type === 'h3' ? 24 : 20;
const fontSize = (value, fallback = 20) => {
 const number = typeof value === 'string' && /^\d+(?:px)?$/.test(value) ? Number(value.replace('px', '')) : value;
 return Number.isInteger(number) && number >= 14 && number <= 48 ? number : fallback;
};
const alignment = value => ['left', 'center', 'right'].includes(value) ? value : 'left';
const baseStyle = block => ({ bold: !!block.bold, italic: !!block.italic, fontSize: fontSize(block.fontSize, defaultSize(block.type)) });
const sameStyle = (a, b) => a.bold === b.bold && a.italic === b.italic && a.fontSize === b.fontSize && a.href === b.href;

function mergeSegments(segments) {
 const result = [];
 for (const segment of segments) {
  if (!segment.text) continue;
  const previous = result.at(-1);
  if (previous && sameStyle(previous, segment)) previous.text += segment.text;
  else result.push({ ...segment });
 }
 return result;
}

function blockSegments(block) {
 const style = baseStyle(block);
 const runs = Array.isArray(block.runs) ? block.runs : [{ text: block.text || '' }];
 return mergeSegments(runs.map(run => ({
  text: run.text,
  bold: typeof run.bold === 'boolean' ? run.bold : style.bold,
  italic: typeof run.italic === 'boolean' ? run.italic : style.italic,
  fontSize: fontSize(run.fontSize, style.fontSize),
  ...(safeRichTextHref(run.href || (block.type === 'link' ? block.href : undefined))
   ? { href: run.href || block.href } : {}),
 })));
}

function segmentMarks(segment) {
 return [
  ...(segment.bold ? [{ type: 'bold' }] : []),
  ...(segment.italic ? [{ type: 'italic' }] : []),
  { type: 'textStyle', attrs: { fontSize: `${segment.fontSize}px` } },
  ...(segment.href ? [{ type: 'link', attrs: { href: segment.href } }] : []),
 ];
}

function inlineNodes(block) {
 return blockSegments(block).flatMap(segment => {
  const marks = segmentMarks(segment);
  return segment.text.split('\n').flatMap((text, index) => [
   ...(index ? [{ type: 'hardBreak', marks }] : []),
   ...(text ? [{ type: 'text', text, marks }] : []),
  ]);
 });
}

export function blocksToDocument(blocks = []) {
 const content = blocks.map(block => {
  const legacy = structuredClone(block);
  if (block.type === 'image') return { type: 'image', attrs: { ...legacy, legacy } };
  const node = {
   type: ['h2', 'h3'].includes(block.type) ? 'heading' : 'paragraph',
   attrs: { legacy, textAlign: alignment(block.align), ...(['h2', 'h3'].includes(block.type) ? { level: Number(block.type.slice(1)) } : {}) },
   content: inlineNodes(block),
  };
  return block.type === 'quote' ? { type: 'blockquote', content: [node] } : node;
 });
 return { type: 'doc', content: content.length ? content : [{ type: 'paragraph', attrs: { legacy: null, textAlign: 'left' } }] };
}

function nodeSegments(node) {
 return mergeSegments((node.content || []).flatMap(child => {
  if (!['text', 'hardBreak'].includes(child.type)) return [];
  const marks = child.marks || [];
  const href = marks.find(mark => mark.type === 'link')?.attrs?.href;
  return [{
   text: child.type === 'hardBreak' ? '\n' : child.text || '',
   bold: marks.some(mark => mark.type === 'bold'),
   italic: marks.some(mark => mark.type === 'italic'),
   fontSize: fontSize(marks.find(mark => mark.type === 'textStyle')?.attrs?.fontSize),
   ...(safeRichTextHref(href) ? { href } : {}),
  }];
 }));
}

function textBlock(node, quoted) {
 const legacy = node.attrs?.legacy;
 const type = quoted ? 'quote' : node.type === 'heading' ? (node.attrs?.level === 3 ? 'h3' : 'h2') : 'paragraph';
 const align = alignment(node.attrs?.textAlign);
 const segments = nodeSegments(node);
 const text = segments.map(segment => segment.text).join('');
 const originalType = legacy?.type === 'link' ? 'paragraph' : legacy?.type;
 if (legacy && originalType === type && alignment(legacy.align) === align &&
     text === legacy.text && JSON.stringify(blockSegments(legacy)) === JSON.stringify(segments)) return structuredClone(legacy);

 const style = legacy ? baseStyle(legacy) : { bold: false, italic: false, fontSize: defaultSize(type) };
 const block = { ...legacy, type, text, ...style, align };
 delete block.href;
 delete block.runs;
 // These fields cannot migrate from an image into a text paragraph.
 for (const key of ['src', 'alt', 'caption', 'imageText', 'width', 'maxHeight']) delete block[key];
 const runs = segments.map(segment => ({
  text: segment.text,
  ...(segment.bold !== style.bold ? { bold: segment.bold } : {}),
  ...(segment.italic !== style.italic ? { italic: segment.italic } : {}),
  ...(segment.fontSize !== style.fontSize ? { fontSize: segment.fontSize } : {}),
  ...(segment.href ? { href: segment.href } : {}),
 }));
 if (runs.some(run => Object.keys(run).length > 1)) block.runs = runs;
 return block;
}

export function documentToBlocks(document) {
 const blocks = [];
 function visit(nodes, quoted = false) {
  for (const node of nodes || []) {
   if (node.type === 'blockquote') visit(node.content, true);
   else if (node.type === 'image') {
    const { legacy, ...attrs } = node.attrs || {};
    const block = { type: 'image', text: '', fontSize: 20, bold: false, italic: false, align: 'center', alt: '', caption: '', ...legacy };
    for (const [key, value] of Object.entries(attrs)) if (value !== undefined && value !== null) block[key] = value;
    // A cleared height is meaningful; other optional defaults should not rewrite old records.
    if (attrs.maxHeight === null && legacy?.maxHeight !== undefined) block.maxHeight = null;
    if (attrs.width === null) delete block.width;
    delete block.runs;
    blocks.push(block);
   } else if (['paragraph', 'heading'].includes(node.type)) blocks.push(textBlock(node, quoted));
  }
 }
 visit(document?.content);
 const soleNode = document?.content?.[0];
 if (blocks.length === 1 && blocks[0].type === 'paragraph' && !blocks[0].text &&
     document.content.length === 1 && !soleNode.attrs?.legacy) return [];
 return blocks;
}
