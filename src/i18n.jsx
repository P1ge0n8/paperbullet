import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { defaultCollections } from '../shared/editorial-defaults.mjs';

export const languages = [
 { value: 'zh-CN', label: '简体中文' },
 { value: 'zh-HK', label: '繁體中文' },
 { value: 'en', label: 'English' },
];
const storageKey = 'paperbullet.locale';
const validLanguage = value => languages.some(language => language.value === value);
export function localizeRecord(record, locale) {
 if (!record || locale === 'zh-CN' || !record.translations?.[locale]) return record;
 const translated = record.translations[locale];
 const result = { ...record };
 for (const key of ['title', 'subtitle', 'author', 'category', 'blocks', 'name', 'description', 'english', 'duration', 'access']) {
  if (translated[key] !== undefined) result[key] = translated[key];
 }
 if (typeof result.title === 'string') result.shortTitle = result.title.replaceAll('\n', '');
 return result;
}

const simplified = {
 language: '选择语言', skipContent: '跳至主要内容', returnStudio: '返回放映棚', sectionIndex: '栏目索引',
 author: '作者：', unsigned: '待署名（样稿）', unpublished: '未正式刊发', readMinutes: '约 {count} 分钟',
 backColumns: '返回专栏', backArticleList: '返回{name} · 文章列表', sampleNotice: '阅读排版示例 · 非{name}作品或报道',
 sampleArticle: '示例文章', copyLink: '复制链接', copiedLink: '链接已复制', copyError: '请从浏览器地址栏复制本文链接。',
 articleContents: '文章目录', sampleFooter: '本文为阅读体验示例，非正式刊发内容。', nextRead: '继续阅读 / NEXT',
 selectPodcast: '选择播客栏目', episodeList: '播客单集', listen: '在小宇宙收听', newTab: '在新标签页打开', overthink: '过度解读', reserved: '保留意见', cover: '封面',
 allEpisodes: '在小宇宙查看完整节目与最新更新', columnsIntro: '从一个人的目光，看见更多电影。',
 festivalsIntro: '从一场影展出发，走进电影的现场。', columnAuthors: '专栏作者', selectColumn: '选择专栏作者',
 selectFestival: '选择影展专题', allArticles: '所有文章', articleCount: '{count} 篇', awaitingArticles: '待收录',
 breadcrumbs: '面包屑', allColumns: '全部专栏', allFestivals: '全部影展专题', contact: '商业合作 / 联系我们',
 xiaoyuzhou: '小宇宙', weibo: '微博', wechat: '微信', scanContact: '扫描联系', closeQR: '关闭二维码',
 qrAlt: '锵稿微信联系二维码', studioFailed: '摄影棚未能载入', studioLoading: '正在装片…', enterSections: '直接进入栏目',
 sections: [
  { title: '专栏', english: 'COLUMNS', description: '在日常里，继续看电影。影评、随笔，与银幕内外的观察。' },
  { title: '影展专题', english: 'FILM FESTIVALS', description: '从第一场到最后一场，记录影展中的电影、相遇与回声。' },
  { title: '播客', english: 'PODCAST', description: '散场以后，继续聊电影。让关于电影的对话留在耳边。' },
  { title: '深度访谈', english: 'CONVERSATIONS', description: '走近镜头背后的人，听他们讲述创作的来路。' },
  { title: '关于锵稿', english: 'PAPERBULLET', description: '锵稿，一个关于电影的独立内容空间。' },
 ],
 about: {
  lines: ['隐姓不埋名', '缴械不投降'], punctuation: ['，', '。'],
  intro: [
   '锵稿的前身是2017年9月5日上线的「枪稿」，由几位出身《电影世界》《大众电影》的纸媒编辑创办。换了发表文字的地方，依然按照会被印在纸上的文字风格写影评。',
   '经历数次重启后，我们以「锵稿」的名字继续向前。「缴械不投降」，是这次新生的开始，也是我们继续写作的态度。',
  ],
  title: '锵稿新公号·发刊词', date: '2023年9月5日', byline: '（锵稿主笔 子戈）',
  paragraphs: [
   '六年前的今天（2017年9月5日），枪稿正式上线。几位《电影世界》《大众电影》出身的纸媒编辑创办了这个号。但实际情况是，大家不过是换了个地方，继续按照会被印在纸上的文字风格写影评。',
   '创立的前几年还算顺当，尽管时常404，但还不至于歇业。直到最近两年，在接连经历三次重启后，我们终于意识到，也许该换一种活法。',
   '于是，六年后的今天，「锵稿」正式上线。之所以选在今天，自然有延续衣钵之意，但既然换了名字和门面，也就不算重生，算是新生了。',
   '发刊词已经写过太多次，实在不知道还能写些什么。由于撰写频率越来越快，我只是觉得，世界的变化已经翻天覆地，不可能回到从前了。',
   '所以《春光乍泄》里那句「不如我们从头来过」才成了一句空话。不管多不情愿，我们都只能挥挥手，向前看。',
   '「缴械不投降。」',
   '在写下第一个字时，这句话突然就闯到我脑子里，以至于都没反应过来，它到底是什么意思。',
   '但很快就意识到，用它做本文的结束和本号的开始，再合适不过。',
   '那就让我们重新认识一下：你好，我们是「锵稿」。',
  ],
 },
};
const traditional = {
 ...simplified,
 language: '選擇語言', skipContent: '跳至主要內容', returnStudio: '返回放映棚', sectionIndex: '欄目索引',
 unsigned: '待署名（樣稿）', unpublished: '未正式刊發', readMinutes: '約 {count} 分鐘', backColumns: '返回專欄',
 backArticleList: '返回{name} · 文章列表', sampleNotice: '閱讀排版示例 · 非{name}作品或報道', sampleArticle: '示例文章',
 copyLink: '複製連結', copiedLink: '連結已複製', copyError: '請從瀏覽器網址列複製本文連結。', articleContents: '文章目錄',
 sampleFooter: '本文為閱讀體驗示例，非正式刊發內容。', nextRead: '繼續閱讀 / NEXT', selectPodcast: '選擇播客欄目',
 episodeList: '播客單集', listen: '在小宇宙收聽', newTab: '在新分頁開啟', allEpisodes: '在小宇宙查看完整節目與最新更新', overthink: '過度解讀', reserved: '保留意見',
 columnsIntro: '從一個人的目光，看見更多電影。', festivalsIntro: '從一場影展出發，走進電影的現場。',
 columnAuthors: '專欄作者', selectColumn: '選擇專欄作者', selectFestival: '選擇影展專題', awaitingArticles: '待收錄',
 breadcrumbs: '導覽路徑', allColumns: '全部專欄', allFestivals: '全部影展專題', contact: '商業合作 / 聯絡我們',
 scanContact: '掃描聯絡', closeQR: '關閉二維碼', qrAlt: '鏘稿微信聯絡二維碼', studioFailed: '攝影棚未能載入',
 studioLoading: '正在裝片…', enterSections: '直接進入欄目',
 sections: [
  { title: '專欄', english: 'COLUMNS', description: '在日常裏，繼續看電影。影評、隨筆，與銀幕內外的觀察。' },
  { title: '影展專題', english: 'FILM FESTIVALS', description: '從第一場到最後一場，記錄影展中的電影、相遇與回聲。' },
  { title: '播客', english: 'PODCAST', description: '散場以後，繼續聊電影。讓關於電影的對話留在耳邊。' },
  { title: '深度訪談', english: 'CONVERSATIONS', description: '走近鏡頭背後的人，聽他們講述創作的來路。' },
  { title: '關於鏘稿', english: 'PAPERBULLET', description: '鏘稿，一個關於電影的獨立內容空間。' },
 ],
 about: {
  lines: ['隱姓不埋名', '繳械不投降'], punctuation: ['，', '。'],
  intro: [
   '鏘稿的前身是2017年9月5日上線的「槍稿」，由幾位出身《電影世界》《大眾電影》的紙媒編輯創辦。換了發表文字的地方，依然按照會被印在紙上的文字風格寫影評。',
   '經歷數次重啟後，我們以「鏘稿」的名字繼續向前。「繳械不投降」，是這次新生的開始，也是我們繼續寫作的態度。',
  ],
  title: '鏘稿新公號·發刊詞', date: '2023年9月5日', byline: '（鏘稿主筆 子戈）',
  paragraphs: [
   '六年前的今天（2017年9月5日），槍稿正式上線。幾位《電影世界》《大眾電影》出身的紙媒編輯創辦了這個號。但實際情況是，大家不過是換了個地方，繼續按照會被印在紙上的文字風格寫影評。',
   '創立的前幾年還算順當，儘管時常404，但還不至於歇業。直到最近兩年，在接連經歷三次重啟後，我們終於意識到，也許該換一種活法。',
   '於是，六年後的今天，「鏘稿」正式上線。之所以選在今天，自然有延續衣缽之意，但既然換了名字和門面，也就不算重生，算是新生了。',
   '發刊詞已經寫過太多次，實在不知道還能寫些甚麼。由於撰寫頻率越來越快，我只是覺得，世界的變化已經翻天覆地，不可能回到從前了。',
   '所以《春光乍洩》裏那句「不如我們從頭來過」才成了一句空話。不管多不情願，我們都只能揮揮手，向前看。',
   '「繳械不投降。」',
   '在寫下第一個字時，這句話突然就闖到我腦子裏，以至於都沒反應過來，它到底是甚麼意思。',
   '但很快就意識到，用它做本文的結束和本號的開始，再合適不過。',
   '那就讓我們重新認識一下：你好，我們是「鏘稿」。',
  ],
 },
};
const english = {
 ...simplified,
 language: 'Choose language', skipContent: 'Skip to content', returnStudio: 'Return to the studio', sectionIndex: 'Sections',
 author: 'By ', unsigned: 'Uncredited (sample)', unpublished: 'Not published', readMinutes: '{count} min read',
 backColumns: 'Back to columns', backArticleList: 'Back to {name} · Articles', sampleNotice: 'Layout sample · Not a contribution to {name}',
 sampleArticle: 'Sample article', copyLink: 'Copy link', copiedLink: 'Link copied', copyError: 'Copy this article’s link from the address bar.',
 articleContents: 'In this article', sampleFooter: 'This is a reading sample, not a published article.', nextRead: 'READ NEXT',
 selectPodcast: 'Choose a podcast', episodeList: 'Podcast episodes', listen: 'Listen on Xiaoyuzhou', newTab: 'opens in a new tab', overthink: 'Overthinking', reserved: 'Reserved Opinions', cover: 'cover',
 allEpisodes: 'Full shows and latest episodes on Xiaoyuzhou', columnsIntro: 'A personal perspective on a wider world of cinema.',
 festivalsIntro: 'From a film festival to the heart of cinema.', columnAuthors: 'Columnists', selectColumn: 'Choose a columnist',
 selectFestival: 'Choose a film festival', allArticles: 'All articles', articleCount: '{count} articles', awaitingArticles: 'Coming soon',
 breadcrumbs: 'Breadcrumbs', allColumns: 'All columns', allFestivals: 'All film festivals', contact: 'Partnerships / Contact',
 xiaoyuzhou: 'Xiaoyuzhou', weibo: 'Weibo', wechat: 'WeChat', scanContact: 'Scan to contact us', closeQR: 'Close QR code',
 qrAlt: 'PAPERBULLET WeChat contact QR code', studioFailed: 'The studio could not load', studioLoading: 'Loading the film…', enterSections: 'Enter the site',
 sections: [
  { title: 'Columns', english: 'COLUMNS', description: 'Keep watching. Film criticism, essays, and observations on and off screen.' },
  { title: 'Film Festivals', english: 'FILM FESTIVALS', description: 'Films, encounters, and impressions, from the first screening to the last.' },
  { title: 'Podcasts', english: 'PODCAST', description: 'The film ends; the conversation continues.' },
  { title: 'Conversations', english: 'CONVERSATIONS', description: 'Meet the people behind the camera and follow their creative journeys.' },
  { title: 'About', english: 'PAPERBULLET', description: 'PAPERBULLET, an independent space for writing about cinema.' },
 ],
 about: {
  lines: ['Anonymous, not forgotten', 'Disarmed, never surrendered'], punctuation: ['.', '.'],
  intro: [
   'PAPERBULLET began as 枪稿, launched on 5 September 2017 by former print editors from Movie World and Popular Cinema. The place of publication changed; the writing remained film criticism with the care and character of words destined for print.',
   'After several restarts, we moved forward under the name 锵稿. “Disarmed, never surrendered” marks this new beginning—and our resolve to keep writing.',
  ],
  title: 'PAPERBULLET · An opening statement', date: '5 September 2023', byline: '(Zi Ge, lead writer at PAPERBULLET)',
  paragraphs: [
   'Six years ago today, on 5 September 2017, 枪稿 went live. A few print editors from Movie World and Popular Cinema founded the account. In truth, we had simply moved elsewhere, continuing to write film criticism in the same style as words intended for the printed page.',
   'The first few years went fairly smoothly. Pages would sometimes disappear behind a 404, but we could still keep going. Only after three successive restarts over the past two years did we finally realise that perhaps we needed a different way to carry on.',
   'And so, six years later, 锵稿 goes live today. Choosing this date naturally signals continuity. But with a new name and a new face, this is less a rebirth than a new beginning.',
   'We have written so many opening statements that I no longer know what more to say. As the intervals between them grow shorter, all I feel is how completely the world has changed. There is no going back.',
   'That is why “Why don’t we start over?” from Happy Together has become an empty promise. However reluctant we may be, all we can do is wave goodbye and look ahead.',
   '“Disarmed, never surrendered.”',
   'As I wrote the very first word, this phrase suddenly entered my mind—before I had even worked out what it meant.',
   'But I soon realised that nothing could be more fitting as the ending of this piece and the beginning of this account.',
   'Then let us introduce ourselves again: Hello, we are 锵稿—PAPERBULLET.',
  ],
 },
};
const messages = { 'zh-CN': simplified, 'zh-HK': traditional, en: english };
const collectionTranslations = {
 'zh-HK': {
  'columns/zige': { name:'子戈', description:'子戈的專欄文章，匯集於此。' },
  'columns/xuyuan': { name:'徐元', description:'徐元的專欄文章，匯集於此。' },
  'columns/meixuefeng': { name:'梅雪峰', description:'梅雪峰的專欄文章，匯集於此。' },
  'festivals/cannes': { name:'康城電影節', description:'在這裏，匯集康城電影節的觀影筆記、評論與訪談。' },
  'festivals/venice': { name:'威尼斯電影節', description:'在這裏，匯集威尼斯電影節的觀影筆記、評論與訪談。' },
  'festivals/berlin': { name:'柏林電影節', description:'在這裏，匯集柏林電影節的觀影筆記、評論與訪談。' },
 },
 en: {
  'columns/zige': { name:'Zi Ge', description:'Film criticism and essays by Zi Ge.' },
  'columns/xuyuan': { name:'Xu Yuan', description:'Film criticism and essays by Xu Yuan.' },
  'columns/meixuefeng': { name:'Mei Xuefeng', description:'Film criticism and essays by Mei Xuefeng.' },
  'festivals/cannes': { name:'Cannes Film Festival', description:'Viewing notes, criticism, and conversations from Cannes.' },
  'festivals/venice': { name:'Venice Film Festival', description:'Viewing notes, criticism, and conversations from Venice.' },
  'festivals/berlin': { name:'Berlin International Film Festival', description:'Viewing notes, criticism, and conversations from Berlin.' },
 },
};
const I18nContext = createContext(null);

export function I18nProvider({ children }) {
 const [locale, setLocaleState] = useState(() => {
  const requested = new URLSearchParams(location.search).get('lang');
  if (validLanguage(requested)) return requested;
  try { const saved = localStorage.getItem(storageKey); return validLanguage(saved) ? saved : 'zh-CN'; }
  catch { return 'zh-CN'; }
 });
 const committedLocale = useRef(locale), requestedLocale = useRef(locale), scrollSnapshot = useRef(null);
 const transition = useRef({ timer: null, version: 0, element: null, wasInert: false, wasBusy: null });
 const finishTransition = useCallback(() => {
  const current = transition.current;
  clearTimeout(current.timer);
  if (current.element) {
   current.element.inert = current.wasInert;
   if (current.wasBusy === null) current.element.removeAttribute('aria-busy');
   else current.element.setAttribute('aria-busy', current.wasBusy);
  }
  current.element = null;
  document.documentElement.dataset.localeTransition = 'idle';
 }, []);
 const fadeIn = useCallback(() => {
  if (!transition.current.element || matchMedia('(prefers-reduced-motion: reduce)').matches) {
   finishTransition();
   return;
  }
  document.documentElement.dataset.localeTransition = 'in';
  const version = transition.current.version;
  transition.current.timer = setTimeout(() => {
   if (transition.current.version === version) finishTransition();
  }, 190);
 }, [finishTransition]);
 const setLocale = useCallback(value => {
  if (!validLanguage(value)) return;
  const url = new URL(location.href);
  url.searchParams.set('lang', value);
  history.replaceState(history.state, '', url);
  const current = transition.current;
  clearTimeout(current.timer);
  const version = ++current.version;
  requestedLocale.current = value;
  if (value === committedLocale.current) {
   fadeIn();
   return;
  }
  const commit = () => {
   if (version !== transition.current.version) return;
   const screen = document.querySelector('.studio-landing__screen');
   scrollSnapshot.current = screen ? { screen, top: screen.scrollTop, hash: location.hash, locale: value } : null;
   setLocaleState(value);
  };
  const element = document.querySelector('.workspace-body');
  if (!element || matchMedia('(prefers-reduced-motion: reduce)').matches) {
   finishTransition();
   commit();
   return;
  }
  if (!current.element) {
   current.element = element;
   current.wasInert = element.inert;
   current.wasBusy = element.getAttribute('aria-busy');
  }
  element.inert = true;
  element.setAttribute('aria-busy', 'true');
  document.documentElement.dataset.localeTransition = 'out';
  current.timer = setTimeout(commit, 150);
 }, [fadeIn, finishTransition]);
 useLayoutEffect(() => {
  committedLocale.current = locale;
  document.documentElement.lang = locale;
  try { localStorage.setItem(storageKey, locale); } catch { /* A private browser can still change this page's language. */ }
  const snapshot = scrollSnapshot.current;
  if (snapshot?.locale === locale) {
   if (snapshot.screen.isConnected && snapshot.hash === location.hash) snapshot.screen.scrollTop = snapshot.top;
   scrollSnapshot.current = null;
  }
  if (locale === requestedLocale.current) fadeIn();
 }, [locale, fadeIn]);
 useEffect(() => () => {
  transition.current.version++;
  finishTransition();
 }, [finishTransition]);
 const value = useMemo(() => {
  const copy = messages[locale];
  const t = (key, values = {}) => (copy[key] ?? simplified[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
  const collectionText = item => {
   if (locale === 'zh-CN') return item;
   const key = `${item.kind}/${item.id}`;
   const translated = collectionTranslations[locale]?.[key];
   const original = defaultCollections.find(collection => collection.kind === item.kind && collection.id === item.id);
   const fallback = {
    ...item,
    name: translated && item.name === original?.name ? translated.name : locale === 'en' && item.english ? item.english : item.name,
    description: translated && item.description === original?.description ? translated.description : item.description,
   };
   return localizeRecord(fallback, locale);
  };
  return { locale, setLocale, t, sections: copy.sections, about: copy.about, collectionText };
 }, [locale, setLocale]);
 return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);

export function LanguageSwitcher() {
 const { locale, setLocale, t } = useI18n();
 const [open, setOpen] = useState(false);
 const selectedIndex = languages.findIndex(language => language.value === locale);
 const [activeIndex, setActiveIndex] = useState(selectedIndex);
 const root = useRef(null), trigger = useRef(null), options = useRef([]);
 const menuId = useId();

 function close(restoreFocus = false) {
  setOpen(false);
  if (restoreFocus) trigger.current?.focus({ preventScroll: true });
 }
 function show(index = selectedIndex) {
  setActiveIndex(index);
  setOpen(true);
 }
 useLayoutEffect(() => {
  if (open) options.current[activeIndex]?.focus({ preventScroll: true });
 }, [open, activeIndex]);
 useEffect(() => {
  if (!open) return;
  const dismiss = event => { if (!root.current?.contains(event.target)) setOpen(false); };
  document.addEventListener('pointerdown', dismiss, true);
  document.addEventListener('focusin', dismiss);
  return () => {
   document.removeEventListener('pointerdown', dismiss, true);
   document.removeEventListener('focusin', dismiss);
  };
 }, [open]);
 function keyboard(event) {
  if (event.key === 'Escape' && open) {
   event.preventDefault();
   event.stopPropagation();
   close(true);
  } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
   event.preventDefault();
   if (event.key === 'Home') show(0);
   else if (event.key === 'End') show(languages.length - 1);
   else if (!open) show(selectedIndex);
   else setActiveIndex(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + languages.length) % languages.length);
  }
 }

 return <div className="language-switch" ref={root} data-open={open} onKeyDown={keyboard}>
  <button ref={trigger} type="button" className="language-trigger" aria-haspopup="listbox" aria-expanded={open} aria-controls={menuId} aria-label={t('language')+'：'+languages[selectedIndex].label} onClick={() => open ? close(true) : show()}>
   <span>{languages[selectedIndex].label}</span>
   <svg className="language-chevron" viewBox="0 0 12 12" width="12" height="12" fill="none" aria-hidden="true"><path d="m2.5 4.5 3.5 3 3.5-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
  </button>
  <div id={menuId} className="language-menu" role="listbox" aria-label={t('language')} aria-hidden={!open} inert={!open}>
   {languages.map((language,index) => <button key={language.value} ref={element => { options.current[index] = element; }} type="button" role="option" className="language-option" data-locale={language.value} aria-selected={locale===language.value} tabIndex={open&&activeIndex===index?0:-1} onFocus={() => setActiveIndex(index)} onClick={() => { setLocale(language.value); close(true); }}>
    <span>{language.label}</span><span className="language-option__mark" aria-hidden="true">●</span>
   </button>)}
  </div>
 </div>;
}
