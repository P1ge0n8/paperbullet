# Design QA

final result: passed

## Source and scope
Source: user attachments codex-clipboard-d42223d6-45bd-4b40-a74d-1ab35d78dded.png (1487 × 1058), detailed visor and sidebar attachments, and seven explicit revision requirements. User instructions intentionally supersede the reference's center logo, rules, latest-content section, old slogan and immediate navigation. Original assets and section dialogs reused from the first version.

## Browser evidence
- qa/desktop-home.png: desktop entry, 1487 × 1058 CSS viewport.
- qa/desktop-index.png: desktop scrolled, active flames, 1487 × 1058 CSS viewport.
- qa/mobile-index.png: mobile scrolled, 390 × 844 CSS viewport.
Browser captures were displayed at the corresponding viewport aspect ratio. The desktop reference and implementation were emitted together for full-view comparison. The implementation's full desktop capture was sufficient to read the dot-matrix visor and assess its confinement; a subsequent attempted focused browser crop had mismatched framing and was not used as evidence.

## Review
- Typography: preserved Chinese Songti serif and monospace English supporting text; no unwanted hover copy or old English brand remains in rendered UI.
- Layout: first viewport contains only corner logo and central goggles. Index and slogan appear progressively with scroll. Latest-content block and rules removed. Mobile index uses two columns without overlapping goggles.
- Color: preserved #f8f5e9 ivory, purple-gray mechanical artwork and red identity. Flat ivory from original code retained; screenshot's fine paper grain is not reproduced (P3).
- Assets: original supplied logo and first-version goggles/flames retained. Pixel lettering is a requested animated display, clipped within the original red visor; no replacement illustration.
- Content: PAPERBULLET spelling and 隐姓不埋名，缴械不投降。 verified. Existing pending-content dialogs remain honest about unpublished articles.

## Iteration
Initial active flames reached the desktop right edge (P2). Reduced flame width from 128% to 108%, height from 125% to 95%, and adjusted placement. Restarted preview to clear stale stylesheet, recaptured desktop-index.png, and confirmed complete flame edges with clear space around navigation. No remaining P0/P1/P2 findings.

## Interaction checks
Verified entry, scrolled reveal, logo return, flame activation, about dialog opening and dismissal, and mobile scrolled layout. Browser console error/warning logs empty. Build succeeded; four existing packaging checks passed. Reduced-motion handling is present in code; OS preference emulation was not tested. Editorial backend is outside this homepage revision.
