import { useEffect, useRef, useState } from 'react';
import { DownloadSimple } from '@phosphor-icons/react';
import { useI18n } from './i18n';

export function ArticlePdfExport({ article, disabled }) {
 const { t, locale } = useI18n();
 const [busy, setBusy] = useState(false);
 const [failed, setFailed] = useState(false);
 const task = useRef(null);
 const url = useRef('');
 useEffect(() => () => {
  task.current?.abort();
  if (url.current) URL.revokeObjectURL(url.current);
 }, []);

 const title = article.title.replace(/[<>:"/\\|?*\u0000-\u001F]+/g, ' ').replace(/\s+/g, ' ').trim();
 const filename = (Array.from(title).slice(0, 70).join('').replace(/[. ]+$/, '') || article.id) + '.pdf';

 async function generate(event) {
  if (task.current || disabled) return;
  const workspace = event.currentTarget.closest('.workspace');
  const controller = new AbortController();
  task.current = controller;
  setFailed(false);
  setBusy(true);
  try {
   const { createArticlePdf } = await import('./article-pdf');
   const blob = await createArticlePdf({
    workspace, title: article.title, author: article.author, locale, exportLabel: t('exportPdf'),
   }, controller.signal);
   if (controller.signal.aborted) return;
   if (url.current) URL.revokeObjectURL(url.current);
   url.current = URL.createObjectURL(blob);
   const link = document.createElement('a');
   link.href = url.current;
   link.download = filename;
   document.body.append(link);
   link.click();
   link.remove();
  } catch {
   if (!controller.signal.aborted) setFailed(true);
  } finally {
   if (!controller.signal.aborted) setBusy(false);
   controller.abort();
   task.current = null;
  }
 }

 return <span className="article-pdf-export">
  <button type="button" disabled={disabled || busy} aria-busy={busy} onClick={generate}>
   <DownloadSimple size={16}/> <span>{busy ? t('preparingPdf') : t('exportPdf')}</span>
  </button>
  {failed && <span className="pdf-export-error" role="alert">{t('pdfExportError')}</span>}
 </span>;
}
