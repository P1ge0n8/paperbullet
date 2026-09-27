# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Approved design
Recreate exec-f02b5dc1-bf96-4c97-a5cc-0a7847260b49.png: ivory editorial page, fine sidebar rule, centered supplied logo above original mechanical goggles; no person. Keep purple-gray ink-drawn goggles with dark red visor, no yellow reference markings. Navigation order: 01.专栏 02.影展专题 03.播客 04.深度访谈 05.关于锵稿. Scope is homepage, section entrances can show honest pending-content panels until editorial content is supplied. Flames appear only on hover, keyboard focus, or touch activation. Preserve reduced-motion support.

## Revision 2026-09-27
User overrides earlier approved design: first viewport contains only top-left supplied logo and original goggles. Remove center logo, latest-content block and all rules, hover copy. Reveal five-section index and new slogan only after scrolling. English brand is PAPERBULLET. Slogan: 隐姓不埋名，缴械不投降。 Use GSAP and a red bitmap glitch display confined to the visor. Preserve existing honest pending-content dialogs.
