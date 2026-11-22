// Shared fallback for projects saved before collection management was available.
export const defaultCollections = [
 { id: 'zige', kind: 'columns', name: '子戈', english: 'ZI GE', description: '子戈的专栏文章，汇集于此。' },
 { id: 'xuyuan', kind: 'columns', name: '徐元', english: 'XU YUAN', description: '徐元的专栏文章，汇集于此。' },
 { id: 'meixuefeng', kind: 'columns', name: '梅雪风', english: 'MEI XUE FENG', description: '梅雪风的专栏文章，汇集于此。' },
 { id: 'cannes', kind: 'festivals', name: '戛纳电影节', english: 'CANNES', logo: 'cannes', description: '在这里，汇集戛纳电影节的观影笔记、评论与访谈。' },
 { id: 'venice', kind: 'festivals', name: '威尼斯电影节', english: 'VENICE', logo: 'venice', description: '在这里，汇集威尼斯电影节的观影笔记、评论与访谈。' },
 { id: 'berlin', kind: 'festivals', name: '柏林电影节', english: 'BERLIN', logo: 'berlin', description: '在这里，汇集柏林电影节的观影笔记、评论与访谈。' },
];

function archiveMark(logo, name, traditional, english) {
 return { logo, name, translations: { 'zh-HK': { name: traditional }, en: { name: english } } };
}

export const festivalLogoOptions = [
 ...defaultCollections.filter(item => item.logo).map(({ logo, name }) => ({ logo, name })),
 archiveMark('beijing', '北京国际电影节', '北京國際電影節', 'Beijing International Film Festival'),
 archiveMark('nowness', 'NOWNESS天才计划', 'NOWNESS天才計劃', 'NOWNESS Short Film Awards'),
 archiveMark('goldenrooster', '金鸡国际影展', '金雞國際影展', 'Golden Rooster International Film Panorama'),
 archiveMark('hainan', '海南岛国际电影节', '海南島國際電影節', 'Hainan Island International Film Festival'),
 archiveMark('guanchao', '观潮', '觀潮', 'Guanchao'),
 archiveMark('hongkong', '香港国际电影节', '香港國際電影節', 'Hong Kong International Film Festival'),
 archiveMark('pingyao', '平遥国际电影展', '平遙國際電影展', 'Pingyao International Film Festival'),
 archiveMark('hishorts', 'HiShorts!厦门短片周', 'HiShorts!廈門短片週', 'HiShorts! Xiamen Short Film Week'),
];
