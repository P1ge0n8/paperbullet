# Collection hierarchy QA — 2026-09-27

final result: passed

## Scope and visual source
User requested Initium-inspired information architecture, retaining the existing PAPERBULLET identity. Reference pages: https://theinitium.com/column/, https://theinitium.com/series/, https://theinitium.com/audio/, and https://theinitium.com/tag/job-inside-out/.
Source captures: work/qa-collections/reference-columns.png, reference-series.png, reference-podcast.png. Rendered captures: work/qa-collections/columns.png, festivals.png, podcast.png, mobile-columns.png, mobile-list.png.

Reference and final directory captures are 886 × 801 pixels / CSS viewport, normalized 1:1. Initial implementation inspection was 1280 × 720. Mobile captures are 390 × 844. Matching reference/implementation captures were emitted in the same comparison inputs for all three directory pages. An immediate post-navigation capture showed the prior route and was discarded; the final columns capture was taken after the correct heading was confirmed. Full-view text was legible, so no additional focused crop was needed.

## Findings and deliberate adaptation
No remaining P0/P1/P2 findings in the requested prototype scope.
- Typography: preserved Songti and monospace brand typography. Centered page titles, modest descriptive text, large collection names, and smaller article metadata establish clear hierarchy. No clipped titles in desktop or mobile checks.
- Layout: collection directories lead into collection lists, then readers; stable card links and explicit parent navigation. Three author cards, two festival cards, and a three-column podcast grid collapse into a single column below 800px. At 390px the document width equals the viewport for the directory and author list.
- Colors: existing ivory, purple-gray rules and red interaction accents remain. This is an intentional brand adaptation, not a pixel clone of Initium's white/blue system.
- Assets: supplied logo and Xiaoyuzhou logo remain sharp. No ImageGen, invented portraits or copied Initium covers. Collection cards use their actual names as content; photography is intentionally omitted until owner-supplied imagery exists.
- Content: owner-supplied names 子戈、徐元、梅雪峰 and FIRST/戛纳 are implemented. Formal article assignments are empty; generic existing samples are clearly separated and labeled as not by the named author / not festival reporting. Only the confirmed Xiaoyuzhou destination is enabled.

## Comparison history
Initial podcast implementation used a two-column grid, making the single card excessively wide and pushing its title below the 720px first viewport (P2). Changed to the reference's three-column desktop grid. Post-fix same-size comparison: work/qa-collections/podcast.png shows the title clearly in the viewport, with no fabricated extra cards. No further P0/P1/P2 changes required.

## Interaction verification
- Browser clicked Columns → 子戈 → sample article → 返回子戈; the return preserves the parent list and the next sample preserves collection context.
- Browser clicked Festivals → FIRST; reloading the nested URL retains the correct heading.
- Podcast card href equals the owner-confirmed Xiaoyuzhou program URL and opens in a new tab. External playback was not exercised.
- Nested author navigation retains the active Columns item.
- Browser console warnings/errors: none in inspected QA tab.
- Production build passed; 7 Node checks passed, including strict collection/deep-link routing and unknown-route fallback.
- Existing keyboard focus labels and reduced-motion CSS remain. OS-level reduced-motion emulation was not exercised.

## Remaining content work
Approved author articles, festival reporting, portraits/covers, and additional podcast URLs have not been supplied. These are editorial inputs, not broken controls. Prototype remains local; no publication performed.

## Latest revisions: compact episodes and festival logos
final result: passed

Podcast: replaced cover with supplied 1000×1000 original; grid capped at 980px, four desktop columns and two phone columns. Local Noto Serif TC 600 matches the observed Initium heading family, with 18px desktop / 16px mobile titles. Font license retained. At 390px: 161.6px covers, no horizontal overflow, 15 exact episode destinations retained. This is a static public directory snapshot, not an automatically synchronized archive.

Festivals: verified all three supplied marks visually at 1280×720. Cannes uses its original transparent asset, Venice uses a black CSS silhouette of the supplied alpha, and Berlin white is removed visually using multiply compositing on ivory. Names sit below their marks; cards open the corresponding collection. Berlin click verified in browser. These marks and sparse layout intentionally replace prior textual folder panels. No clipped marks or stray backgrounds observed. Active navigation remains red and has no underline. Screenshot saved as current chat outputs/festivals-preview.png.

Home: visually verified PAPERBULLET default and BANG! on keyboard focus using the same state as pointer enter/leave. Added missing G and ! bitmap glyphs; section-selection signals remain. Pointer handlers inspected; direct pointer hovering was not separately exercised. Build and all 7 existing tests passed after changes.

## Festival signal animation
final result: passed

Original supplied marks remain at rest. Mouse entry and keyboard focus activate local canvas bitmap marks, using red pixels, a traveling bright band and a single brief startup displacement. Exit/blur restores the original. Animation uses the existing GSAP ticker and is removed on deactivation/unmount; reduced motion uses a static frame. Berlin luminance sampling excludes the white background. Verified the focused Berlin bitmap visually, the three canvases in the DOM, and no errors in the inspected browser logs. Screenshot: current chat outputs/festival-motion.png. Build passed. Visual motion checking used keyboard focus; direct pointer hover was not separately automated. Typography, spacing and navigation remain unchanged.

## Local content studio — 2026-09-27
final result: passed

New local admin page uses existing ivory/red branding with a list/editor layout, readable system UI font, native labeled inputs and a paragraph-based article editor. Browser verified first-run setup/login screen, persisted article editing, font size changes, cover picker, media library and article preview in an isolated test copy. A test article was moved from draft to published and appeared in its author collection; the reader displayed its exact edited timestamp (2026-09-20 19:30). Fixed datetime-local input compatibility by handling input as well as change, and explicit React import in shared block renderer. No test articles or accounts were added to the real content project. Screenshot saved as current chat outputs/content-studio-preview.png.

Production build and 10 tests passed. Tests cover validation, draft exclusion, conflicting saves, origin/CSRF/login protections, disk persistence, uploads and existing route/build checks. Local account remains unconfigured for owner first-run setup. Credentials are ignored by Git; public build excludes editor and drafts. Upload API tested using PNG fixture; native file picker upload not separately automated. GitHub push and public deployment not performed.

## Page polish — 2026-09-27
final result: passed

Removed flame image from homepage DOM and obsolete flame styles. Three small SVG electrical spark clusters are attached to the goggles assembly, staggered only during hover/focus. Browser verified zero flame nodes, three spark groups, active spark animation and intact BANG! state. All interior footers now contain only PAPERBULLET@2026. Author directory counter verified as 03 REPORTERS; festival directory bar absent. Keyed route content plays a 460ms opacity/1px displacement entrance on navigation; reduced-motion disables it and sparks. Fixed a blend-mode regression by supplying the page background and avoiding a persistent animated stacking context; final screenshot confirms Berlin has no white rectangle. Browser navigation and production build passed. Screenshot: current chat outputs/page-polish-preview.png.

## Goggles click turn
final result: passed
Click now rotates the complete supplied artwork assembly in perspective while entering the index layout: Z −7°, Y −18°, X 4°, 1 second easing. Original image, pixel visor and spark SVG remain aligned. Browser click verified the final transform and visible index; desktop screenshot shows no clipping or collision. Reduced motion applies the pose immediately. This is a 2D perspective turn, not a true new 3D viewpoint. Production build passed. Screenshot: current chat outputs/goggles-turn-preview.png.

User reverted the goggles perspective-turn revision. Removed the assembly rotation tween and index-open styling, restored index reveal delay to 0.2 seconds. Earlier page refinements remain.

## Idle visor phrases
final result: passed
Idle text now cycles every 4.2 seconds: PAPERBULLET, 隐姓不埋名，, 缴械不投降。. Chinese glyphs are sampled into red display dots once per phrase; both phrases visually checked inside the original clipped lens. Hover/focus BANG! overrides and pauses cycling; section signals keep priority; logo reset returns to PAPERBULLET. Reduced motion disables automatic cycling. Browser observed both Chinese phases, BANG!, and reset to PAPERBULLET; production build passed. Screenshot: current chat outputs/visor-cycle-preview.png.
