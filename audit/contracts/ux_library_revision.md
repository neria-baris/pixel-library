# UX-LIBRARY-REVISION — user feedback on selected prototype

2026-10-15. Continue prototype-only work in design/pixel-library-prototypes. User rejects remaining arrows, absent deletion, mismatched brass slider/rail, Reading Room name and top room illustration; palette is acceptable. Direct Codex authorization persists. No production/main/remote integration.

- Owns: A-only presentation/enhancement layer; minimal shared A-conditional naming/art/filter hooks; landing copy; focused evidence/audit. Keep B as comparison baseline.
- Inputs:106b5ae prototype, native control state/events, original synthetic book records/art. No user content or credentials.
- Output: plain Library name, restrained original pixel-book shelf illustration, one matte-green geometry for rails/grips, word-based navigation and +/- disclosure instead of arrows, always-visible delete per book.
- Invariants: preserve palette, native input keyboard/drag and exact number entry. Deletion affects only in-memory sample inventory, requires an in-product confirmation with book name, permits undo, never reads/deletes a real file or calls a provider. Cancel/Escape retain inventory and restore focus; deleted books stay absent across filter/navigation, return after undo/reload. No research approval.
- Errors: deletion of a missing record is harmless; zero remaining books has a usable empty state; search/filter/count reflect deletions. Browser events cannot duplicate controls after rerender.
- Acceptance: named delete visible at1440/390/320; cancel/Escape/confirm/undo/multiple-delete empty state and focus tested; no remaining arrow glyphs or arrow-only controls in A; new name/art and coherent native slider rendered; actual pointer drag/keyboard behavior, no overflow at desktop/mobile; B unchanged; current flows remain passing.
- Side effects: in-memory sample deletion/undo and local evidence only. No filesystem deletion, production jobs, keys, persistent storage or external APIs.
- Scope/cost: one direct refinement and scoped correction if needed. External builders/advisers/runtime0; subscription usage/charge not_metered. Remains local-only, not remotely backed up, no merge/push per user.
