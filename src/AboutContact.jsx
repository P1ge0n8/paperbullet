import { useEffect, useRef, useState } from 'react';
import { X } from '@phosphor-icons/react';
import { contacts } from './contacts';
import { useI18n } from './i18n';

const asset = name => `${import.meta.env.BASE_URL}assets/${name}`;
const podcastUrl = contacts.find(contact => contact.name === '小宇宙').url;

function ContactMark({ name }) {
 return <span className={`about-contact__mark about-contact__mark--${name}`} aria-hidden="true" style={{ '--contact-mark': `url("${asset(`contact-icons/${name}.svg`)}")` }}/>;
}

export function AboutContact() {
 const { t } = useI18n();
 const [open, setOpen] = useState(false);
 const dialogRef = useRef(null);
 const triggerRef = useRef(null);
 const backdropPress = useRef(false);

 useEffect(() => {
  if (!open) return;
  const dialog = dialogRef.current;
  const scroller = triggerRef.current.closest('.studio-landing__screen');
  const overflow = scroller?.style.overflow;
  if (scroller) scroller.style.overflow = 'hidden';
  dialog.showModal();
  const close = () => dialog.close();
  window.addEventListener('hashchange', close);
  return () => {
   window.removeEventListener('hashchange', close);
   if (dialog.open) dialog.close();
   if (scroller) scroller.style.overflow = overflow;
  };
 }, [open]);

 function outsideDialog(event) {
  const box = event.currentTarget.getBoundingClientRect();
  return event.target === event.currentTarget && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom);
 }

 return <section className="about-contact" aria-labelledby="about-contact-title">
  <h2 id="about-contact-title">{t('contact')}</h2>
  <div className="about-contact__links">
   <a href={podcastUrl} target="_blank" rel="noopener noreferrer" aria-label={t('xiaoyuzhou')+' ('+t('newTab')+')'} title={t('xiaoyuzhou')}><ContactMark name="xiaoyuzhou"/></a>
   <a href="https://weibo.com/u/6358247616" target="_blank" rel="noopener noreferrer" aria-label={t('weibo')+' ('+t('newTab')+')'} title={t('weibo')}><ContactMark name="weibo"/></a>
   <button ref={triggerRef} type="button" aria-label={t('wechat')+'：'+t('scanContact')} aria-haspopup="dialog" aria-controls="wechat-contact-dialog" title={t('wechat')} onClick={() => setOpen(true)}><ContactMark name="wechat"/></button>
  </div>
  <dialog ref={dialogRef} id="wechat-contact-dialog" className="wechat-dialog" aria-labelledby="wechat-contact-caption" onClose={() => { setOpen(false); triggerRef.current?.focus({ preventScroll: true }); }} onPointerDown={event => { backdropPress.current = outsideDialog(event); }} onClick={event => { if (backdropPress.current && outsideDialog(event)) dialogRef.current.close(); }}>
   <button className="wechat-dialog__close" type="button" aria-label={t('closeQR')} onClick={() => dialogRef.current.close()}><X size={23} weight="light"/></button>
   <img className="wechat-dialog__code" src={asset('wechat-contact-qr.svg')} width="518" height="518" alt={t('qrAlt')}/>
   <p id="wechat-contact-caption">{t('scanContact')}</p>
  </dialog>
 </section>;
}
