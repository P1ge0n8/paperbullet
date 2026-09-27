import published from './content/published.json' with { type: 'json' };
// Real collection names supplied by the owner. Article assignments await approved copy.
export const columns = [
 { id:'zige', name:'子戈', english:'ZI GE', description:'子戈的专栏文章，汇集于此。', articleIds:[] },
 { id:'xuyuan', name:'徐元', english:'XU YUAN', description:'徐元的专栏文章，汇集于此。', articleIds:[] },
 { id:'meixuefeng', name:'梅雪峰', english:'MEI XUE FENG', description:'梅雪峰的专栏文章，汇集于此。', articleIds:[] },
];
export const festivals = [
 { id:'cannes', name:'戛纳电影节', english:'CANNES', logo:'cannes', description:'在这里，汇集戛纳电影节的观影笔记、评论与访谈。', articleIds:[] },
 { id:'venice', name:'威尼斯电影节', english:'VENICE', logo:'venice', description:'在这里，汇集威尼斯电影节的观影笔记、评论与访谈。', articleIds:[] },
 { id:'berlin', name:'柏林电影节', english:'BERLIN', logo:'berlin', description:'在这里，汇集柏林电影节的观影笔记、评论与访谈。', articleIds:[] },
];
for(const [kind,items] of [['columns',columns],['festivals',festivals]])for(const item of items)item.articleIds=published.articles.filter(a=>a.collection===kind+'/'+item.id).map(a=>a.id);
export function collectionForRoute(route) {
 const [,section,id] = route.split('/');
 return (section==='columns'?columns:section==='festivals'?festivals:[]).find(c=>c.id===id);
}
