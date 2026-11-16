# 锵稿放映室

首页摄影棚由 React Three Fiber 渲染。此目录的构建输出写入网站的 public/studio；基础模型、光照、胶片和加载封面也在该目录。先在此处运行 npm ci 与 npm run build，再在上一级运行网站的 npm run build。日常仅编辑刊物内容可以直接使用已有摄影棚构建。

放映机、卷盘和穿片路径在 src/FilmProjector.tsx，静物在 src/Props.tsx，镜头与银幕在 src/Projection.tsx。后者把母站的栏目页对齐墙上的投影四角，运镜结束后交给同一个可操作的栏目页。版权与素材来源见 ../public/studio/NOTICE.txt。
