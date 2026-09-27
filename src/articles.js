import published from './content/published.json' with { type: 'json' };
import { collectionForRoute } from './collections.js';
// Preview copy only. Replace these records with approved editorial content before publication.
export const sampleArticles = [
  {
    id: 'after-the-lights', number: '001', category: '观看笔记', title: '灯亮以后，\n电影还没有结束。', shortTitle: '灯亮以后，电影还没有结束。',
    subtitle: '关于散场、停留，以及银幕之外的几分钟。', minutes: 4,
    intro: '我们习惯用片尾字幕为一部电影画上句号。但有时候，真正属于自己的观看，要等到灯亮以后才开始。',
    sections: [
      { title: '先别急着离开', paragraphs: ['银幕暗下来，周围的人开始寻找外套和手机。有人压低声音交谈，有人一直坐到最后一行字幕消失。影院又变回一个普通的房间，我们却不一定能立刻回到进来时的生活。', '刚刚看过的街道、房间和脸孔，还在意识里占据着位置。它们没有整齐地变成一个评价，也没有马上成为可以分享的观点。有时，我们只是想再坐一会儿。'] },
      { title: '一个尚未完成的回答', paragraphs: ['“好看吗？”是散场后最容易听到的问题，也是有时最难回答的问题。我们可能记不清情节的转折，却一直记得一个人转过身时的迟疑；可能并不认同人物的选择，却愿意把那份困惑多留一阵。', '电影给人的东西，未必总能被归纳成一个判断。看完一部作品，不一定需要立刻为它站队。允许感受暂时没有名字，也是一种认真。'] },
      { title: '把一点余光带回日常', paragraphs: ['走出影院，城市的声音重新围过来。十字路口的红灯、便利店的玻璃、陌生人的一句话，似乎都和两小时前没有区别。但某个细节突然变得可见，某段沉默突然值得等待。', '也许我们一次次走进黑暗，就是为了在回来以后，重新看见那些原本已经熟悉的东西。电影结束了，观看还在继续。'] },
    ], quote: '允许感受暂时没有名字，也是一种认真。',
  },
  {
    id: 'outside-the-frame', number: '002', category: '影评', title: '画面之外，\n还有谁在说话？', shortTitle: '画面之外，还有谁在说话？', subtitle: '从一个空镜头出发，重新听见电影。', minutes: 3,
    intro: '当镜头停留在一间空房间里，电影真的安静下来了吗？声音有时比画面更早告诉我们，一个人曾经在这里。',
    sections: [
      {title:'听见没有出现的人',paragraphs:['脚步声从走廊尽头传来，但镜头没有转过去。观众因此开始想象：谁在靠近，谁在离开，又是谁选择了不出场？没有被看见的部分，让一个有限的画框获得了更大的空间。','我们常常把注意力放在可见的人物与动作上。但一次观看也可以从声音开始：关门的轻重、远处的交通、回答之前的一口呼吸，都在悄悄改变场景的含义。']},
      {title:'空白也有重量',paragraphs:['空镜并不总是等待下一段故事的间隙。一个被留下的房间，可以保留争执之后的温度；一条无人经过的路，也可以让我们意识到等待有多漫长。','下一次看电影，不妨暂时放下“这个镜头讲了什么”的问题，问问自己：如果闭上眼睛，我仍然能够感受到什么？']},
    ],quote:'没有被看见的部分，让画框获得了更大的空间。',
  },
  {
    id: 'a-seat-in-the-dark', number: '003', category: '随笔', title: '在黑暗里，\n为陌生人留一个座位。', shortTitle: '在黑暗里，为陌生人留一个座位。', subtitle: '关于共同观看的一点小事。', minutes: 3,
    intro: '我们买下一张属于自己的电影票，却总是在与陌生人分享的黑暗中，看完那部只属于自己的电影。',
    sections: [
      {title:'一起看，也各自看',paragraphs:['同一场电影里，笑声并不总在同一个瞬间响起。有人提前察觉了一个笑话，有人被另一处细节打动。那些短促的回应提醒我们：眼前的故事，正在每个人那里生成不同的形状。','一起观看的意义，也许不在于离开时获得一致的结论，而在于我们曾经愿意把同一段时间交给银幕，并允许不同的感受同时存在。']},
      {title:'散场之后',paragraphs:['如果身边的人始终沉默，不必急着替他解释；如果一位朋友喜欢你不喜欢的作品，也不必立刻说服对方。对话可以从一个具体的镜头开始，从“你记住了哪里”开始。','影院里一排排空座位，终究会被不同的人坐满。我们期待的，也正是那些尚未相遇的目光。']},
    ],quote:'允许不同的感受，在同一个房间里存在。',
  },
];
export const articles = [...published.articles.map((a,i)=>({...a, sample:false, number:String(i+1).padStart(3,'0'),shortTitle:a.title.replaceAll('\n',''),minutes:Math.max(1,Math.ceil(a.blocks.reduce((n,b)=>n+(b.text?.length||0),0)/450)),sections:[]})),...sampleArticles.map(a=>({...a,sample:true}))];
export function readRoute(hash) {
  const value = hash.replace(/^#/, '') || '/';
  if (value === '/' || value === '/columns' || value === '/about' || ['/festivals','/podcast','/interviews'].includes(value)) return value;
  if (articles.some(a => value === '/read/' + a.id)) return value;
  const collection=collectionForRoute(value);
  if(collection){
    const parts=value.split('/');
    if(parts.length===3 || (parts.length===5 && parts[3]==='read' && articles.some(a=>a.id===parts[4]))) return value;
  }
  return '/';
}
