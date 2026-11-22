import { domToForeignObjectSvg } from 'modern-screenshot';
import { createPageImagePdf } from './article-pdf-document';

async function snapshotWorkspace(workspace, exportLabel, signal) {
 const width = Math.ceil(workspace.getBoundingClientRect().width);
 const host = document.createElement('div');
 host.inert = true;
 host.setAttribute('aria-hidden', 'true');
 Object.assign(host.style, {
  position: 'fixed', right: '100%', top: '0', width: width + 'px', pointerEvents: 'none',
 });
 const copy = workspace.cloneNode(true);
 host.append(copy);
 // Keep the original viewport for responsive type and image sizes, but lay sticky
 // elements out once at the top, even if the reader has already scrolled down.
 for (const el of copy.querySelectorAll('.workspace-header, .workspace-nav, .reader-aside')) {
  el.style.position = 'relative';
  el.style.top = 'auto';
 }
 copy.style.position = 'relative';
 copy.querySelector('.reading-progress').style.position = 'absolute';
 copy.querySelector('.page-arrival').style.animation = 'none';
 const button = copy.querySelector('.article-pdf-export button');
 button.disabled = false;
 button.removeAttribute('aria-busy');
 button.querySelector('span').textContent = exportLabel;
 copy.querySelector('.pdf-export-error')?.remove();
 const photos = [...copy.querySelectorAll('img')];
 photos.forEach(photo => { photo.loading = 'eager'; });
 document.body.append(host);
 try {
  copy.querySelector('.workspace-nav').scrollLeft = workspace.querySelector('.workspace-nav').scrollLeft;
  await Promise.all([document.fonts.ready, ...photos.map(photo => photo.decode())]);
  signal.throwIfAborted();
  // The SVG renderer rounds anonymous flex items differently from the live DOM.
  // Keep a single-line byline together; leave genuinely wrapped bylines as they are.
  const byline = copy.querySelector('.publication-meta');
  if (byline.getBoundingClientRect().height <= parseFloat(getComputedStyle(byline).lineHeight) + 1) {
   byline.style.flexWrap = 'nowrap';
   byline.style.whiteSpace = 'nowrap';
  }
  const height = Math.ceil(Math.max(copy.scrollHeight, copy.getBoundingClientRect().height));
  const background = getComputedStyle(copy).backgroundColor;
  const svg = await domToForeignObjectSvg(copy, {
   width, height, scale: 1, backgroundColor: background,
   fetch: { requestInit: { signal, cache: 'force-cache' } },
   filter: node => !node.classList?.contains('skip-link'),
  });
  // Failed or missing inline images must not silently produce an incomplete submission.
  const embedded = [...svg.querySelectorAll('img')];
  if (embedded.length !== photos.length || embedded.some(img => !img.src.startsWith('data:image/') || img.src.length < 100)) {
   throw new Error('Unable to embed all article images');
  }
  return { width, height, background, svg };
 } finally {
  host.remove();
 }
}

async function renderStrip(encodedSvg, width, top, height, pixelWidth, background) {
 const pixelHeight = Math.max(1, Math.round(height * pixelWidth / width));
 const canvas = document.createElement('canvas');
 canvas.width = pixelWidth;
 canvas.height = pixelHeight;
 try {
  const image = new Image();
  // Make each image viewport a strip of the same layout, not a full-height bitmap.
  const prefix = '<svg xmlns="http://www.w3.org/2000/svg" width="' + pixelWidth + '" height="' + pixelHeight +
   '" viewBox="0 ' + top + ' ' + width + ' ' + height + '" preserveAspectRatio="none">';
  image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(prefix) + encodedSvg + '%3C%2Fsvg%3E';
  await image.decode();
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, pixelWidth, pixelHeight);
  ctx.drawImage(image, 0, 0, pixelWidth, pixelHeight);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.96));
  if (!blob) throw new Error('Unable to render page image');
  return new Uint8Array(await blob.arrayBuffer());
 } finally {
  canvas.width = canvas.height = 0;
 }
}

export async function createArticlePdf({workspace, title, author, locale, exportLabel}, signal) {
 signal.throwIfAborted();
 const { width, height, background, svg } = await snapshotWorkspace(workspace, exportLabel, signal);
 signal.throwIfAborted();
 const encoded = encodeURIComponent(new XMLSerializer().serializeToString(svg));
 const pdf = await createPageImagePdf({width, height, title, author, locale});
 const pixelWidth = Math.min(4096, width * 2);
 const stripHeight = Math.max(1, Math.floor(2048 * width / pixelWidth));
 for (let top = 0; top < height; top += stripHeight) {
  signal.throwIfAborted();
  const size = Math.min(stripHeight, height - top);
  const jpeg = await renderStrip(encoded, width, top, size, pixelWidth, background);
  await pdf.addTile(jpeg, top, size);
 }
 return pdf.finish();
}
