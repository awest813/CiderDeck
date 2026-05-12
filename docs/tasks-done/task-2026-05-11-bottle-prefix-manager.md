# Task 3 — Bottle / Prefix Manager

## Background

Currently, bottles/prefixes are represented as a single optional `bottlePath?: string`
field on `CompatibilityProfile`. Users must manually type or paste paths. There is no
bottle auto-detection, no health monitoring, no shared bottle across profiles, and no
dedicated bottle management UI.

v0.3 of the roadmap calls for first-class bottle/prefix management with detection,
CRUD workflows, metadata tracking, health reporting, and storage usage visibility.

## Goal

Add bottle detection, management, and UI so users can discover existing Wine/Whisky/
CrossOver/GPTK bottles, create new ones, and pick them from a dropdown when
configuring compatibility profiles.

## Acceptance Criteria

- [ ] `Bottle` data model in Rust + TypeScript with id, name, runtime, path, version,
      architecture, Windows version, components, storage size, health, notes
- [ ] Bottle detection: scan system for existing Wine prefixes, Whisky bottles,
      CrossOver bottles, and GPTK prefixes
- [ ] `detect_bottles` Tauri command (lists detected bottles with metadata)
- [ ] `create_bottle` Tauri command (creates a new Wine prefix / Whisky bottle)
- [ ] `delete_bottle` Tauri command (removes a bottle's file system data)
- [ ] `get_bottle_meta` Tauri command (detailed metadata for a single bottle)
- [ ] Bottle storage on frontend (localStorage with manual management)
- [ ] `useBottleDetection` hook for consuming bottle data
- [ ] Bottle list UI in Settings page with health, storage, version info
- [ ] Bottle picker dropdown in compatibility profile form replacing free-text input
- [ ] Create/delete bottle dialogs
- [ ] Tests for Rust bottle detection logic
- [ ] `npm run check:all` passes

## Out of Scope

- Bottle clone/repair/reset/export-import workflows (future iteration)
- Multi-profile bottle sharing enforcement
- Non-macOS bottle detection paths
