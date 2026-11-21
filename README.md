# PAPERBULLET · 锵稿

电影放映棚入口、五个编辑栏目，以及只在本机运行的内容后台。内容先在本地编辑和预览，确认后通过 VS Code 提交并手动发布。

- [正式网站](https://p1ge0n8.github.io/paperbullet/)
- [GitHub 仓库](https://github.com/P1ge0n8/paperbullet)
- [部署进度](https://github.com/P1ge0n8/paperbullet/actions)
- **[详细本地使用教程](docs/本地后台使用教程.md)**：准备、编辑、排版、语言、发布、回退和代码位置。

## 从 VS Code 启动

打开项目里的 `PAPERBULLET.code-workspace`，使用 Node.js 22.12+。首次在终端执行：

```sh
npm ci
npm run admin
```

后台：[http://127.0.0.1:4181/admin/](http://127.0.0.1:4181/admin/)
本地网站：[http://127.0.0.1:4181/](http://127.0.0.1:4181/)

首次使用时设置本机管理员账号，已有账号时登录原账号。本次升级不会重置密码。

也可以从 VS Code「运行任务」选择：

| 任务 | 作用 |
| --- | --- |
| 锵稿：启动本地后台 | 编辑后台和本地网站共用 4181 端口 |
| 锵稿：只预览前台 | 只启动网站开发预览 |
| 锵稿：发布前检查 | 校验内容、运行测试、构建网站 |
| 锵稿：手动发布到 GitHub | 检查已提交版本，等待输入「发布」后推送 |

## 后台可以编辑什么

- **文章**：主标题、副标题／摘要、编号、署名、日期、分类、栏目、草稿／公开状态、分段正文。
- **排版**：主／副标题和正文段落的字号、粗体、斜体、对齐；正文支持二／三级标题、引用、图片、链接。样式以整段为单位。
- **图片**：封面与正文插图的宽度、高度上限、对齐，保持原图比例，可恢复默认尺寸。
- **播客**：节目归属、标题、封面、跳转链接、日期、时长、标记、草稿状态和排序。
- **栏目分类**：作者专栏／影展专题的名称、英文名称、介绍和顺序；有文章引用的栏目不能直接删除。
- **图片库**：上传 PNG、JPG、WebP、GIF，单张最大 10 MB。
- **多语言内容**：维护简体、繁体和英文文案；原稿修改后需要同步检查译文。

「保存全部修改」只写入本机项目。公开内容进入本地前台和下一次构建；发布时间不是定时发布开关。

## 发布流程

1. 后台保存，检查本地网站。
2. 运行 `npm run check`。
3. 在 VS Code「源代码管理」查看、暂存并提交本次修改，新图片也要提交。
4. 运行 `npm run publish:github`，核对提交后在终端输入「发布」。
5. 等待 [Publish PAPERBULLET](https://github.com/P1ge0n8/paperbullet/actions) 部署成功，再检查正式网站。

发布脚本限定 `main` 和 `P1ge0n8/paperbullet`，不会自动暂存、提交或强制推送。main 收到新提交后，现有 GitHub Actions 流程会构建并部署网站。

## 数据和本机资料

- `content/editorial.json`：源内容，包含草稿和栏目分类。
- `src/content/published.json`：保存／构建时自动生成，网站读取，不含草稿。
- `public/uploads/`：上传图片；`public/assets/`：已有素材。
- `admin/`：后台界面；`server/`：保存和登录逻辑；`src/`：公开网站。
- `.vscode/tasks.json`：任务；`scripts/publish-github.mjs`：手动发布脚本。
- `.local-admin/`：本机账号资料，已被 Git 忽略，不应上传。

公开仓库中的源数据包含草稿，草稿仍可从仓库源码看到；保密内容先保存在仓库之外。后台和账号服务不进入公开站点构建。

## 验证

```sh
npm run check
```

包含内容校验、内容／后台／站点测试和生产构建。后台测试使用独立临时目录，不修改真实账号和文章。

## 导航交互参考

栏目圆点导航参考 [Rare UI — Bounce Sidebar](https://www.rareui.com/components/bouncesidebar)，沿用本项目的 GSAP 实现，并适配手机顶部横向排列。
