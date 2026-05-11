# Task 1 — Remove Legacy Game Library

## Background

The codebase has two parallel systems that serve the same purpose:

- **Legacy** (`GameEntry`, `launchers.ts`, `storage.ts`, Game Library tab): a
  compatibility-only prototype from early development. Handles Wine/CrossOver/
  Whisky/GPTK only; logs stored inline on the `GameEntry` object.
- **Current** (`CiderDeckProfile`, `profile-launchers.ts`, `profile-storage.ts`,
  Profiles tab): the full multi-helper architecture (compatibility layers, source
  ports, emulators, recompilation, custom). Logs persisted via Rust. Full
  per-helper forms and validators.

The legacy system is dead code — the Profiles tab already covers its use cases
and is the UX path described in the README.

## Goal

Remove all legacy Game Library code, leaving only the Profiles system.

## Acceptance Criteria

- [ ] `src/types/GameEntry.ts` is deleted
- [ ] `src/lib/launchers.ts` is deleted
- [ ] `src/lib/launchers.test.ts` is deleted
- [ ] `src/lib/storage.ts` is deleted (`createId` moved to `profile-storage.ts`)
- [ ] `src/components/GameForm.tsx` is deleted
- [ ] `src/components/GameCard.tsx` is deleted
- [ ] `src/components/GameLibrary.tsx` is deleted
- [ ] `src/components/LogViewer.tsx` is deleted
- [ ] `Sidebar.tsx` shows only Profiles + Settings; `gameCount` prop removed
- [ ] `LibraryPage.tsx` has no game-library state or rendering branch
- [ ] `npm run check:all` passes with zero errors

## Out of Scope

- Any new features or UI additions
- Migrating existing `ciderdeck.game-library.v1` localStorage data
  (v0.4 will handle game-centric library imports)
