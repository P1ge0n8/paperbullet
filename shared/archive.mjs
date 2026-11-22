export const archiveCategories = Object.freeze({
 review: '专栏 · 影评',
 guide: '专栏 · 看片指南',
 culture: '专栏 · 影坛观察',
 festival: '影展专题',
 interview: '深度访谈',
 partnership: '商业合作',
});

export const partnershipProjectNames = Object.freeze([
 '金鸡手机电影计划', '德国电影史选映', 'IM两岸青年影展', '华语青年电影周',
 'FIRST青年电影展', '吴天明青年电影展', 'VITA SHORTS华语短片联展',
]);

const projectKey = name => name.normalize('NFKC').replace(/\s+/gu,'').toUpperCase();
const partnershipProjectKeys = new Set(partnershipProjectNames.map(projectKey));

export const oscarTopicName = '奥斯卡金像奖';
const translatedCategories = {
 partnership: {en:'Partnerships', 'zh-HK':'商業合作'},
 culture: {en:'Columns · Film Culture', 'zh-HK':'專欄 · 影壇觀察'},
};

export function classifyArchiveProject(article) {
 if (!article?.festival) return article;
 const key = projectKey(article.festival);
 let category;
 if (partnershipProjectKeys.has(key)) category = 'partnership';
 else if (key === oscarTopicName) category = 'culture';
 else return article;
 const result = {...article, archiveCategory:category, category:archiveCategories[category], festival:''};
 if (category === 'partnership') {
  result.partnership = true;
  result.collection = '';
 } else if (article.collection?.startsWith('festivals/')) {
  result.collection = '';
 }
 if (article.translations) {
  result.translations = Object.fromEntries(Object.entries(article.translations).map(([locale,entry])=>[
   locale, entry?.category ? {...entry, category:translatedCategories[category][locale]} : entry,
  ]));
 }
 return result;
}
