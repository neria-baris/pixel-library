# UX-PIXEL — competing interactive prototypes

Date: 2026-10-15. User explicitly requests web research, analysis, two complete competing prototypes and concurrent documentation; no integration into main. This independent design gate supersedes routine main push authorization for this task.

- Component/owns: standalone browser prototypes in `design/pixel-library/`; conductor owns `docs/design/pixel-library/` and audit records. No runtime source changes.
- Input: committed UI at ccd5cc1, ui.html/css/js and learning.html/css/js; synthetic book metadata and original sample text. No private PDFs, credentials or runtime configuration.
- Output: UTF-8 Hebrew RTL interactive HTML/CSS/JS, two distinct information architectures, local preview instructions, research and heuristic analysis. Explicit prototype/demo status.
- Invariants: no API calls, no actual translation, no scholarly approval, no real budget enforcement claims, no real credentials collected. Simulated progress explicit. Local file choice reads metadata only; nothing transmitted. Editing/download are sample-only.
- Errors: reject unsupported file extensions/oversize; empty search state; numeric budget validation; resumable simulated job.
- Side effects: prototype in-memory state; optional download of clearly labeled sample; separate loopback static preview only. No production jobs or data writes.
- Acceptance: two visually distinct old-library pixel-art designs; full library/upload/configure/confirmation/progress/pause/resume/result/review/export/learning/settings flows; primary controls visible, native accessible semantic controls, keyboard focus, numeric alternative to budget slider, mobile layout; DOM interaction checks plus rendered desktop/mobile visual inspection. No production regression scope because production paths unchanged.
- Out of scope: main merge/push, publishing, backend integration, paid provider/image calls, model routing changes, actual translation/learning generation, collecting keys, translation quality or release acceptance.

## Builder card

task_id: UX-PIXEL-BUILD; milestone: UX-PIXEL; builder: Claude Code Sonnet (requested alias sonnet; actual identity from CLI result). Sole writer of `design/pixel-library/` in this worktree. Read only relevant UI source plus this contract/research. Conductor does not write builder paths during execution. No recursive delegation, external network, Git, audit edits or production code changes. One implementation plus at most one focused correction. API runtime calls: 0. CLI subscription usage/charge: not_metered; bounded one invocation, max 40 model turns and soft 40 minutes, tool calls soft 20/hard 60; CLI estimated spend stop $10, not a claim about subscription billing. No independent adviser.

Design A: «חדר הקריאה», immersive dark walnut library with burgundy/olive antique books, amber pixel lamps, persistent right navigation and quiet parchment desk. Library-first shelves/cards and direct workspace.
Design B: «שולחן הקטלוג», airy ivory/paper card-catalog, sage/burgundy ink, light wooden pixel shelves/header and guided 3-step translation. Distinct composition, not merely recoloring A.
Both: crisp rectangular pixel SVG/CSS art (original, no external assets/fonts); readable Hebrew system font; no pixel text for long reading. Only ordered scales get sliders (3 review levels, effort, reader size); categorical options are visible native radios/segments. Budget slider plus exact number. Shared sample state logic is allowed while markup/layout differ. Advanced controls on one secondary level. Library search/filter; settings dialog with demo connection explanation, no secret input; six-language learning with effort and chapter selection/reader/gloss/progress; source/target review with save and draft labels; export as explicit sample HTML/text. Accessible navigation labels, focus management, dialog Escape, visible status, reduced-motion support. Every presented action must work or be explicitly marked unavailable in prototype. No fake successful API connection or real file translation. Include comparison landing page and README.

## Ownership update
2026-10-15: Claude network call failed before inference; escalation rejected automatically. User explicitly authorized Codex direct implementation in chat. Conductor is now sole writer of design/pixel-library/, without delegated builder/model overrides. Original builder card remains historical. No runtime or image model calls.
