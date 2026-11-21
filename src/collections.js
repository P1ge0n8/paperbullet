import published from './content/published.json' with { type: 'json' };
import { defaultCollections } from '../shared/editorial-defaults.mjs';

const collections = published.collections ?? defaultCollections;
function collectionGroup(kind) {
 return collections.filter(item => item.kind === kind).map(item => ({
  ...item,
  articleIds: published.articles.filter(article => article.collection === `${kind}/${item.id}`).map(article => article.id),
 }));
}
export const columns = collectionGroup('columns');
export const festivals = collectionGroup('festivals');
export function collectionForRoute(route) {
 const [, section, id] = route.split('/');
 return (section === 'columns' ? columns : section === 'festivals' ? festivals : []).find(collection => collection.id === id);
}
