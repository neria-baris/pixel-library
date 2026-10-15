# UX-CAT-THOUGHTS-TRANSLATION

2026-10-15. Continue selected prototype A only, separate design branch, no main integration. User requests removing the occasional-visit note, cat thoughts instead of speech with feline content, and translation-process animation. Latest explicit correction also removes the motion toggle and reduced-motion behavior for A; this supersedes earlier motion requirements. B retains its existing behavior.

- Owns: local A cat/motion layer, original process-book art/animation, minimal progress hook, A-only adjustment of shared reduced-motion selector, tests/evidence/docs/audit.
- Inputs: local synthetic progress/paused state and existing cat lifecycle; no credentials, real source contents or providers.
- Outputs: thought bubble with trailing thought dots, closed-mouth cat and local feline thoughts; removed note and movement controls; animated open book/pages/letters/press linked to simulated translation progress and pause/resume.
- Invariants: lifecycle suspends hidden/offscreen/dialog motion; quiet-art preference still works; job pause freezes process animation; decorative motion never sets progress or grants quality approval. Sound remains explicit opt-in. A animations continue under OS reduced-motion per user instruction. No per-animation pause control. No changes to actual runtime or B.
- Acceptance: removed text/control, thought appearance/content/no mouth animation, process rendering/running/paused/resumed/stage/exit, hidden/offscreen/modal and quiet handling, animation remains active under reduced-motion, desktop/390/320 layout, existing model/book/flow regression.
- Side effects: demo-only local HTML/CSS/SVG/JS and synthetic evidence. External builders/providers0; direct Codex authorization persists; subscription metrics not_metered. Verified local commit and separate receipt, no push/main.
