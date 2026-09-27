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
Use https://theinitium.com/column/, /series/ and /audio/ as structure references. Keep PAPERBULLET colors, typography, homepage and header behavior. Columns is an author directory with 子戈、徐元、梅雪峰, then each author's article list, then the reader. Festivals is a collection directory with FIRST 影展 and 戛纳电影节, then collection article lists and the reader. Podcast cards link directly to corresponding confirmed Xiaoyuzhou destinations; currently only 保留意见： is supplied. No ImageGen or invented author portraits/covers. Until approved articles arrive, actual articleIds stay empty; existing generic samples are isolated as reading demos and explicitly not attributed to named authors or festivals. Reader back links and next-article links preserve the originating collection. Keep legacy /read/ links working.

Podcast episode revision: user supplied purple 保留意见 cover (public/assets/podcast-cover.png), use the exact full-color image for every episode. Follow the supplied Initium screenshot's image-first grid (4 columns wide, responsive). Display exact verified episode titles; each card links to its distinct Xiaoyuzhou /episode/ URL, never just the podcast homepage. src/episodes.js is a static snapshot of 15 episodes exposed by the public web directory on 2026-09-27; preserve source order and trial labels. Keep an all-programs link for older episodes and updates; do not claim live synchronization.

Podcast refinement: replace cover with the latest square 1000px high-resolution purple artwork. Keep cards compact (max grid width 980px, four desktop columns, two mobile columns); keep rendered covers around 224px or smaller. Use local Noto Serif TC 600 for episode headings, matching the verified Initium font, at 18px desktop / 16px mobile. Regenerate the font subset when adding titles.

Latest revision: goggles hover displays BANG!, exit restores PAPERBULLET; preserve index selection labels. Interior active nav uses red text without underline. Festival directory is three supplied logo entrances with names below: Cannes, Venice, Berlin. Use original supplied assets and remove Berlin white background in rendering; no generated replacements.

Festival logo motion: retain sharp original marks at rest; mouse hover and keyboard focus crossfade to a red bitmap sampled from the supplied logo, with a soft scanning band and short startup displacement. Leave/blur restores the original. No perpetual flashing; reduced-motion displays a static red bitmap.

Local editorial studio: npm run admin runs a loopback-only backend at 127.0.0.1:4181/admin. User sets their own first-run account. Credentials and sessions must never be committed. Article/episode source is content/editorial.json; generated public data excludes drafts. Both article and podcast publication timestamps are editable to the minute, displayed as entered, not scheduled publishing. Keep rich content as validated blocks rendered by React; never introduce unsanitized HTML. Uploads stay under public/uploads. GitHub updates are manual via VS Code source control; do not auto-push or deploy. Preserve the public static build and protected Sites files.

Latest page polish: remove homepage flames and use only three small intermittent electrical spark clusters attached to the goggles on hover/focus. Interior footer contains only PAPERBULLET@2026. Author directory counter reads 03 REPORTERS. Remove the entire festival directory bar (影展系列 and collection count). Every route arrival uses a short subtle glitch/fade transition; honor reduced-motion and preserve immediate navigation/accessibility.

User reverted the click perspective turn. Restore the original goggles pose and index reveal timing; retain local sparks and other earlier page refinements.

Homepage corner logo resets the current homepage to the collapsed index state, restores centered goggles and PAPERBULLET, and shows the BANG entry again. Cancel any in-flight reveal or section-navigation animation before resetting; preserve modifier-click link behavior.

Idle visor cycles PAPERBULLET → 隐姓不埋名， → 缴械不投降。 every 4.2 seconds. Preserve punctuation and Chinese red-dot rendering. Hover/focus BANG! and section-selection labels take priority and pause the idle timer. Logo reset restarts at PAPERBULLET. Reduced motion keeps the initial idle phrase static.
