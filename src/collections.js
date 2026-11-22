import published from './content/published.json' with { type: 'json' };
import { defaultCollections, festivalLogoOptions } from '../shared/editorial-defaults.mjs';
import { oscarTopicName, partnershipProjectNames } from '../shared/archive.mjs';

const collections = published.collections ?? defaultCollections;
const publishedArticles = published.articles;
const columnCategories = ['review', 'guide', 'culture'];
const articleIds = matches => publishedArticles.filter(matches).map(article => article.id);

export const columns = collections.filter(item => item.kind === 'columns').map(item => ({
 ...item,
 articleIds: articleIds(article => {
  if (article.collection === 'columns/' + item.id) return true;
  if (!columnCategories.includes(article.archiveCategory)) return false;
  const authors = (article.author || '').split(/[、，,／/\s]+/);
  return authors.includes(item.name) || (item.id === 'meixuefeng' && authors.includes('梅雪风'));
 }),
}));

function topic(id, name, traditional, english) {
 return {
  kind: 'columns', id: 'topic-' + id, name, english,
  translations: { 'zh-HK': { name: traditional }, en: { name: english } },
  articleIds: articleIds(article => article.archiveCategory === id),
 };
}
export const columnTopics = [
 topic('review', '影评', '影評', 'Film Reviews'),
 topic('guide', '看片指南', '看片指南', 'Viewing Guides'),
 topic('culture', '影坛观察', '影壇觀察', 'Film Culture'),
];

const registeredFestivals = collections.filter(item => item.kind === 'festivals');
const logosByFestival = { cannes: '戛纳', venice: '威尼斯', berlin: '柏林' };
// Existing bookmarks use the original label encoded as Unicode code points in base 36.
function festivalTopicId(name) {
 return 'topic-' + Array.from(name, char => char.codePointAt(0).toString(36)).join('-');
}
export const formerFestivalTopicPaths = new Map([
 ...partnershipProjectNames.map(name => [festivalTopicId(name), '/partnerships']),
 [festivalTopicId(oscarTopicName), '/columns/topic-culture'],
]);
function festivalFor(article) {
 const designated = registeredFestivals.find(item => article.collection === 'festivals/' + item.id);
 if (designated) return designated;
 if (!article.festival && article.archiveCategory !== 'festival') return null;
 const label = article.festival?.trim() || '影展综合';
 const known = registeredFestivals.find(item => item.name === label || (logosByFestival[item.id] && label.startsWith(logosByFestival[item.id])));
 if (known) return known;
 const mark = festivalLogoOptions.find(item => item.name === label);
 return { kind: 'festivals', id: festivalTopicId(label), name: label, ...mark };
}
const byFestival = new Map(registeredFestivals.map(item => [item.id, { ...item, articleIds: [] }]));
for (const article of publishedArticles) {
 const item = festivalFor(article);
 if (!item) continue;
 if (!byFestival.has(item.id)) byFestival.set(item.id, { ...item, articleIds: [] });
 byFestival.get(item.id).articleIds.push(article.id);
}
export const festivals = [...byFestival.values()];

export const sectionArticles = {
 interviews: articleIds(article => article.archiveCategory === 'interview'),
 partnerships: articleIds(article => article.archiveCategory === 'partnership' || article.partnership === true),
};

export function archiveListPath(article) {
 if (!article?.archiveCategory) return '';
 if (article.archiveCategory === 'interview') return '/interviews';
 if (article.archiveCategory === 'partnership') return '/partnerships';
 if (article.archiveCategory === 'festival') {
  const festival=festivals.find(item=>item.articleIds.includes(article.id));
  return festival ? '/festivals/'+festival.id : '';
 }
 const category=columnTopics.find(item=>item.articleIds.includes(article.id));
 return category ? '/columns/'+category.id : '';
}

export function collectionForRoute(route) {
 const [, kind, id] = route.split('/');
 const items = kind === 'columns' ? [...columns, ...columnTopics] : kind === 'festivals' ? festivals : [];
 return items.find(item => item.id === id);
}
