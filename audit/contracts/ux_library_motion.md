# UX-LIBRARY-MOTION — occasional talking cat and old-library atmosphere

2026-10-15. User asks an animated library cat that talks, jumps and appears occasionally, plus old/creaky library animations. Continue prototype A only, isolated design branch; no main/production integration.

- Owns: A-only motion CSS/JS, its local script/style tags and enhancement hook, original SVG cat poses/grouping of original A shelf art, evidence/docs/audit.
- Input: synthetic UI and existing art preference; OS reduced-motion, document visibility, scene intersection and dialog state. No files, secrets or providers.
- Output: occasional peek/jump/talk/leave cycle with local humorous speech bubbles and animated face/tail; manual summon/dismiss; gently moving old books/shelf, light and dust; accessible motion pause and optional locally synthesized creaks/purr, muted by default.
- Invariants: no remote audio/voices or speech/AI services; no sound until explicit toggle. Cat stays in reserved in-flow scene, never overlays actions/reader. One scheduler/scene, no duplication on rerender. Pause for hidden/offscreen/dialog/quiet-art/reduced-motion; manual summon in reduced/paused mode gives static readable speech. Preserve focus, native control interactions, key/model and delete/undo. B untouched.
- Errors: unsupported/blocked audio stays usable/muted with visible explanation. Stop/disconnect audio on pause or page exit; stop timers when idle. No flashing or essential information conveyed only by animation. No persistent storage.
- Acceptance: actual timed appearance/jump/talk/exit and recurrence scheduling; manual interaction, pause/resume, reduced-motion/quiet/tab/offscreen/dialog lifecycle, rerender duplication, mobile overflow and local-only/audio opt-in behavior; existing prototype flow regression and visual evidence.
- Out of scope: real speech synthesis, production integration, generated bitmap/sprite assets, ChatGPT pet lifecycle. Code-native SVG/CSS is appropriate here. External agents/providers0; direct Codex authorization persists; subscription metrics not_metered. Local verified commit/receipt, no remote/main actions.
