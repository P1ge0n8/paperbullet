# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Approved design
Recreate exec-f02b5dc1-bf96-4c97-a5cc-0a7847260b49.png: ivory editorial page, fine sidebar rule, centered supplied logo above original mechanical goggles; no person. Keep purple-gray ink-drawn goggles with dark red visor, no yellow reference markings. Navigation order: 01.专栏 02.影展专题 03.播客 04.深度访谈 05.关于锵稿. Scope is homepage, section entrances can show honest pending-content panels until editorial content is supplied. Flames appear only on hover, keyboard focus, or touch activation. Preserve reduced-motion support.

## Revision 2026-09-27
User overrides earlier approved design: first viewport contains only top-left supplied logo and original goggles. Remove center logo, latest-content block and all rules, hover copy. Reveal five-section index and new slogan only after scrolling. English brand is PAPERBULLET. Slogan: 隐姓不埋名，缴械不投降。 Use GSAP and a red bitmap glitch display confined to the visor. Preserve existing honest pending-content dialogs.

## Latest user revision
Do not use ImageGen imagery. Homepage keeps the supplied corner logo and mechanical goggles with red PAPERBULLET glitch display. Clicking goggles or the discreet 点击继续 button enters content; replace the prior scroll-to-index entry. Local draft only until user requests publication. Editorial articles are explicitly labeled samples.

## Reference integration
Implement the five OutSea-inspired ideas: shared red pixel numbering and original mechanical imagery, click-to-reveal index with visor scan when choosing a section, article author/date/duration metadata, concrete About description, and contact section. No fabricated public destinations or publication metadata: missing values are explicitly pending; preserve sample labels. No ImageGen covers.
User supplied Xiaoyuzhou podcast https://www.xiaoyuzhoufm.com/podcast/68c436b4de7cd32c37b1c4a8 and its platform logo. Show actual program name 保留意见： and adapt the supplied logo using subdued color on ivory in the podcast and About links. Do not infer ownership, contact email or other accounts from external show metadata.

Homepage revision: index hover changes text color only, no right arrows. Replace index numbers with custom linework coin icons (bullet, finger gun, earmuffs, crosshair with red dot, cartridge casing). Visor retains numeric prefixes and uses 02 FILM FEST and 05 ABOUT US. Other page numbering stays unchanged.

Latest icon override: homepage film-festival coin uses the exact user-provided pig SVG; podcast coin uses the exact user-provided ear SVG. Preserve their paths, fit inside the existing coin rims, and retain all other icons.

Latest homepage override: remove all decorative coin rims; use equally sized standalone line icons. Film festival uses finger-gun reference again, podcast keeps ear. Entry text is BANG !. Center every numbered visor label in lens coordinates with the existing perspective slope.

Latest visual override: homepage index symbols sit inside dimensional tilted coins inspired by user reference, with visible milled thickness, metallic purple-gray face and restrained red inset rim. Preserve existing five center symbols and BANG entry.
Latest user override: discard dimensional coins entirely. Use the five exact supplied 24x24 SVG path designs at 22px, stroke width 1: filmstrip with sparkles, finger gun, earbuds, flask, piggy bank. No frame, metal shading, tilt or shadow. Keep BANG and visor behavior.
Homepage index hover: fade only label text to opacity 0, leaving the icon visible; restore on pointer exit. Keep link hit area and accessible name intact. Keyboard focus keeps text visible; no sticky hover hiding on touch devices.

Interior header revision: keep 锵稿 · and replace 电影与声音 with 缴械不投降. Align the Chinese line within the English PAPERBULLET width. On mouse hover, crossfade each section label into its corresponding exact homepage SVG in red, with a brief subtle glitch. Keep link geometry stable, keyboard labels readable, and reduced-motion support.

## Initium-inspired content hierarchy — 2026-09-27
Use https://theinitium.com/column/, /series/ and /audio/ as structure references. Keep PAPERBULLET colors, typography, homepage and header behavior. Columns is an author directory with 子戈、徐元、梅雪风, then each author's article list, then the reader. Festivals is a collection directory with FIRST 影展 and 戛纳电影节, then collection article lists and the reader. Podcast cards link directly to corresponding confirmed Xiaoyuzhou destinations; currently only 保留意见： is supplied. No ImageGen or invented author portraits/covers. Until approved articles arrive, actual articleIds stay empty; existing generic samples are isolated as reading demos and explicitly not attributed to named authors or festivals. Reader back links and next-article links preserve the originating collection. Keep legacy /read/ links working.

Podcast episode revision: user supplied purple 保留意见 cover (public/assets/podcast-cover.png), use the exact full-color image for every episode. Follow the supplied Initium screenshot's image-first grid (4 columns wide, responsive). Display exact verified episode titles; each card links to its distinct Xiaoyuzhou /episode/ URL, never just the podcast homepage. src/episodes.js is a static snapshot of 15 episodes exposed by the public web directory on 2026-09-27; preserve source order and trial labels. Keep an all-programs link for older episodes and updates; do not claim live synchronization.

Podcast refinement: replace cover with the latest square 1000px high-resolution purple artwork. Keep cards compact (max grid width 980px, four desktop columns, two mobile columns); keep rendered covers around 224px or smaller. Use local Noto Serif TC 600 for episode headings, matching the verified Initium font, at 18px desktop / 16px mobile. Regenerate the font subset when adding titles.

Latest revision: goggles hover displays BANG!, exit restores PAPERBULLET; preserve index selection labels. Interior active nav uses red text without underline. Festival directory is three supplied logo entrances with names below: Cannes, Venice, Berlin. Use original supplied assets and remove Berlin white background in rendering; no generated replacements.

Festival logo motion: retain sharp original marks at rest; mouse hover and keyboard focus crossfade to a red bitmap sampled from the supplied logo, with a soft scanning band and short startup displacement. Leave/blur restores the original. No perpetual flashing; reduced-motion displays a static red bitmap.

Local editorial studio: npm run admin runs a loopback-only backend at 127.0.0.1:4181/admin. User sets their own first-run account. Credentials and sessions must never be committed. Article/episode source is content/editorial.json; generated public data excludes drafts. Both article and podcast publication timestamps are editable to the minute, displayed as entered, not scheduled publishing. Keep rich content as validated blocks rendered by React; never introduce unsanitized HTML. Uploads stay under public/uploads. GitHub updates are manual via VS Code source control; do not auto-push or deploy. Preserve the public static build and protected Sites files.

Latest page polish: remove homepage flames and use only three small intermittent electrical spark clusters attached to the goggles on hover/focus. Interior footer contains only PAPERBULLET@2026. Author directory counter reads 03 REPORTERS. Remove the entire festival directory bar (影展系列 and collection count). Every route arrival uses a short subtle glitch/fade transition; honor reduced-motion and preserve immediate navigation/accessibility.

User reverted the click perspective turn. Restore the original goggles pose and index reveal timing; retain local sparks and other earlier page refinements.

Homepage corner logo resets the current homepage to the collapsed index state, restores centered goggles and PAPERBULLET, and shows the BANG entry again. Cancel any in-flight reveal or section-navigation animation before resetting; preserve modifier-click link behavior.

Idle visor cycles PAPERBULLET → 隐姓不埋名， → 缴械不投降。 every 4.2 seconds. Preserve punctuation and Chinese red-dot rendering. Hover/focus BANG! and section-selection labels take priority and pause the idle timer. Logo reset restarts at PAPERBULLET. Reduced motion keeps the initial idle phrase static.

Touch devices: festival marks automatically preview the red pixel scan for 2.2 seconds when at least 55% visible, replaying only after leaving and re-entering the viewport. Touch click still navigates immediately. Desktop hover/focus remains. Keep the original mark visible until the canvas is drawn; reduced-motion uses a static red preview.

## Page cleanup — 2026-10-27
Remove the homepage index slogan. Festival collection pages omit reading demos and use centered lowercase stay tuned when empty. Interviews use the same empty state. About removes the values, reading CTA and contact content beneath its introduction. Podcast opens with centered side-by-side program choices: 过度解读 left, 保留意见 right; labels match the Parallax terminal font stack. Use the supplied screenshot artwork via a CSS crop for 过度解读; no episodes or destination supplied yet, so show stay tuned. Keep existing 保留意见 episodes reachable via its choice. Local preview until publication is requested.

Red brand mark: hide the white outer margin with a circular CSS clip on both homepage and interior headers; preserve the supplied logo artwork.

Latest cleanup: remove column reading demos too; every empty collection says stay tuned. Overthink now has the two user-provided Xiaoyuzhou episodes; keep program separation in editorial data. Episode titles use the Parallax terminal font stack at 12px desktop and 11px mobile. Homepage idle visor displays the supplied bullet/shattered-glass artwork with bottom caption cropped out; hover and navigation retain red text overrides.

User clarification: the supplied bullet/glass motif must be rendered in the existing red glowing pixel/glitch visor style, never as a flat blue-white image. Sample its contours from the source and keep motion confined to the lens.

User reverted the bullet motif in the goggles. Restore the prior red text visor including idle phrase cycle, BANG hover, and section labels. Explore the new graphic style only in a separate concept image.

## Approved podcast concept — 2026-11-06
Implement outputs/podcast-concept.png from the current chat: ivory editorial page, red brand and active states, pale yellow angled title highlight, centered program choices, two wide original Overthink episode banners side by side on desktop and stacked on mobile. Default to Overthink, keep Reserved Opinions reachable with its existing square covers. Keep previously approved compact 12px/11px titles rather than enlarged generated concept text. Preserve actual source artworks and existing header wording; do not reproduce generated asset/text errors. Homepage stays on the restored red text visor.

## Studio homepage — 2026-11-16

The new homepage shows a forward-projecting film projector and physical props in a studio cove. After the shutter opens and the screen reaches the viewport, the five editorial sections are read directly on the level, full-screen projection. The projected preview and the interactive directory share a component. Keep existing article and collection URLs reachable directly and retain the return to the studio.

Show the loaded film coils and the moving strip prominently on the projector. Leave its housing unbranded. The set dressing is the cartridge prop, the 35 mm canister, and the loose 16 mm spool. On the full-screen directory, align the visible left and right edges of PAPERBULLET with 锵稿 above it.

## Index navigation — 2026-11-20

Use the supplied BounceSidebar interaction for the projected index, with the five Chinese section labels and a 6px orange dot that travels along an arc. Restore all five original IndexCoin marks and the original Songti typeface with large labels. The latest 2026-11-21 revision places a smaller horizontal logo and wordmark at the top left, and removes the old top rule, 栏目索引 caption, and visible 返回摄影棚 text. The brand links back to the studio. Keep the menu centered in the page. Hover and keyboard focus preview the dot position before the link opens its section. English menu labels are deferred to the user's later revision. The projection preview and full-screen index use the same menu.

Keep PAPERBULLET@2026 horizontally centered at the bottom of the index, below the existing footer rule.
Balance the top-left brand as one compact lockup: the red mark should be close to the visible height of the two-line wordmark, with a tighter gap. Keep the complete lockup closer to the top-left corner, with roughly 40px left / 29px top desktop insets and 20px phone insets, while preserving the menu and footer positions.
Interior pages must use this exact same red mark and Chinese-over-English wordmark, with matching size, spacing, color, and corner coordinates at every viewport. Replace the previous English-over-slogan header branding; retain its link to the index and the separate return-to-studio control.
Optically center PAPERBULLET beneath the Chinese name with a slight rightward correction (0.06 of the Chinese font size, about 2px), shared across the index and content pages.

## Article image scale — 2026-11-20

The user finds full-column posters too tall and wants the next paragraph to appear sooner. Size article images in proportion to the viewport, preserve their complete aspect ratios, and center them within the text column.

Collection article lists use small square cover cards like the podcast grid. Under each cover, show the category, publication year, and article number in red, then the black title without a repeated category prefix, then the original muted introduction. The Cannes article is number 006, displayed as 戛纳专栏2026 / 006 above 《希望》的另一面. Use a smaller title and visually align its leading book-title bracket with the text above and below. Omit reading time and the arrow from these cards.

## Unified editorial workspace — 2026-11-21

Merge the index and content pages into one ivory workspace. Enter directly into 关于锵稿, which is first in the navigation, followed by 专栏、影展专题、播客、深度访谈. Each section keeps its original icon. Clicking another section reveals its content, and clicking an article opens the reader in that pane. Keep the original five icons with their corresponding sections, Songti labels, orange bouncing marker, shared corner brand, and centered PAPERBULLET@2026 footer. Desktop navigation stays on the left; at phone widths it becomes a horizontal, scrollable top navigation and the marker bounces horizontally beneath the selected item.

Keep the studio and the real workspace surface mounted together. Returning to the studio reverses the same projection/camera/shutter timeline used on entry, and re-entry restores the current page and reading position. Pause the 3D render loop while the full-screen workspace is active. Preserve direct article URLs, browser history, reduced motion, and the fallback link when WebGL is unavailable.


## About editorial and page motion — 2026-11-21

The About page includes the complete user-supplied 「锵稿新公号·发刊词」 in Simplified Chinese, retaining its nine paragraphs, historical name 「枪稿」, the original relative date wording, and signature 「（锵稿主笔 子戈）」. Rewrite the introduction from this source rather than generic brand claims. Do not include the user's editing instructions in the article.

Content changes slide upward from below and ease firmly into place. Keep the shared brand and navigation stationary and disable this transition for reduced-motion users.


About-page introduction, label, and founding editorial share the same left edge; the introduction and editorial use the same 760px maximum reading width. Section index labels follow the current navigation order: 01 关于锵稿, 02 专栏, 03 影展专题, 04 播客, 05 深度访谈, 06 商业合作. Article numbers, author-card numbers, and content counts retain their own numbering.

Replace 电影与文字 / FILM & WORDS with 商业合作 / 联系我们 and standalone Xiaoyuzhou, Weibo, and WeChat marks, sized and colored for the ivory editorial design. Preserve the existing confirmed Xiaoyuzhou show URL; Weibo links to https://weibo.com/u/6358247616. WeChat opens the supplied QR code alone in a centered dialog over a translucent blurred page, with 扫描联系 beneath it. Preserve the QR source pixels and quiet zone. Support keyboard, backdrop dismissal, and phone screens. The user-supplied founding editorial date is 2023-09-05; display it below the title as 2023年9月5日.

The 播客 page heading shares the same Songti font family, weight, size, line height, and spacing as the other directory headings. Retain only its pale fluorescent marker, sized proportionally to the shared heading on desktop and phone. Latest user override: center the top heading areas of all six sections and their collection pages, including section index labels and short heading descriptions. The About slogan also centers; its introduction, contacts, and founding editorial retain their reading layout.

## Local editing and multilingual release — 2026-11-21

Use the existing local Node/Vite backend, launched through PAPERBULLET.code-workspace or npm run admin. Support article title/subtitle styles, block bold/italic/alignment, cover and body image dimensions, article numbering, dynamic author/festival collections, podcast programme/status/order, media upload, and per-record translations. content/editorial.json is the single editable content source; published.json is generated and excludes drafts. Preserve all published IDs, assets and original content. Keep credentials in ignored .local-admin, and never put the admin service in the public build. The user's explicit request authorizes this release to the existing GitHub repository; subsequent publishing remains a deliberate VS Code commit and manual publish task.

The corner logo returns to the studio through the existing reverse transition. Its former return-link position contains an animated language menu: 简体中文, 繁體中文, English. Retain zh-HK language semantics without showing （香港） in the option. Localize both the interface and supplied article/podcast text, including the studio button and projection slogan. Missing future translations fall back to original text; the CMS supports creating and editing translations rather than silently machine-translating them.

Optically center Chinese About slogan lines by hanging the unused trailing portion of full-width punctuation; do not apply that correction to English punctuation. Episode cards open their destinations without a separate 在小宇宙收听 caption or arrow. Festival marks share exactly aligned original/pixel canvases; run a brief bounded scan for hover/focus and a staggered, finite visible-area preview on touch, while preserving one-tap navigation and reduced motion.

English section headings display only their centered index number (01–06), omitting the slash and repeated uppercase English label. In English, the supplied festival logos stand alone without another translated festival name beneath them; keep their accessible link names. Chinese versions retain their section labels and festival names. Changing language fades the current text out before revealing the new language; preserve the current route and reading position, and respect reduced motion.

The archive groups column articles under 影评, 看片指南 and 影坛观察 alongside the author directory. Group festival coverage by festival, keep the three existing festival marks, and list credited collaborations in 商业合作 even when they also belong to a festival. Deep interviews and partnerships use the shared article reader. Archive article bodies load on demand. Retain text as selectable blocks and cropped illustrations in their original reading order, with expandable image transcripts when present.

Keep article listings compact on desktop and phones. Use small square thumbnails, tighter collection headings and modest inline images that readers can open at full resolution. Trim screenshot backgrounds and template shadows from extracted illustrations, preserving the original composition, captions, lettering and comic panels.

File 金鸡手机电影计划、德国电影史选映、IM两岸青年影展、华语青年电影周、FIRST青年电影展、吴天明青年电影展 and VITA SHORTS华语短片联展 exclusively under 商业合作. Clear their festival tags. Use the assigned project to classify a story, preserving editorial mentions in other articles.

File commentary on the Academy Awards under 专栏 · 影坛观察 and include it in the relevant author's column. Remove 奥斯卡金像奖 from the festival directory.

Give each article an optional, separately editable 序言（开腔） with original paragraphs, illustrations and signature. Keep original covers and reprint notes before the preface when present. Use the same section order in the public reader and editor preview.

Article lists fill their available width with five compact columns on wide screens. On the About page, align the contact details and founding editorial header in the left column with their corresponding text to the right; stack the columns on small screens.

In 影展专题, show the eight archived festival marks alongside Cannes, Venice and Berlin using the same clickable logo cards and red pixel interaction. Keep 年度影展回顾 and 国际影展观察 as text links below the grid. Preserve the existing festival and article URLs.
