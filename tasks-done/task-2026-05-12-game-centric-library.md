# v0.4 — Game-Centric Library Workflows (Phase A)

## Goal

Shift from tool-centric launching to game-centric library management. Introduce a `Game` entity that maps to one or more runtime profiles, with manual import from EXE/MSI paths and app bundles.

## Scope

### New: Game Library

- `Game` type: id, title, artwork_path, tags, notes, linked profile IDs, import source, install path, created/updated timestamps
- Rust backend: JSON file storage for games at `<app_data_dir>/games.json`
- CRUD commands: `list_games`, `save_game`, `delete_game`, `import_game`
- Import from: EXE/MSI paths, macOS app bundles
- Game library page: grid view with game cards (cover art, title, status)
- Game detail panel: artwork, tags, notes, linked profiles, launch options

### Migration: Profile Persistence

- Move profiles from `localStorage` to Rust backend (`<app_data_dir>/profiles.json`)
- Rust commands: `list_profiles`, `save_profiles`, `migrate_from_local_storage`
- One-time migration on first load: detect `localStorage` data, import to Rust
- Update `ProfilesPage` and `LibraryPage` to use TanStack Query hooks

### UI Changes

- New "Library" page in sidebar (game-centric view)
- Existing "Profiles" page stays (tool-centric, power-user view)
- Game cards show linked profile status and quick-launch button

## Out of Scope (Phase B/C)

- Steam/GOG/Epic library detection
- Installer-based game setup wizards
- Portable game workflows
- Auto-detect installed games

## Architecture Decisions

- **Storage**: JSON files (consistent with preferences/logs pattern)
- **State**: TanStack Query for persistent data, replaces localStorage
- **Game→Profile**: One-to-many (a game can have multiple profiles/bottles)
- **Import sources**: Enum tracking where the game came from (manual, app-bundle, exe-msi)

## Acceptance Criteria

- [ ] Games can be created, edited, and deleted via Rust backend
- [ ] Games display in a grid library view with artwork placeholders
- [ ] Each game can be linked to one or more existing profiles
- [ ] Import from EXE/MSI and app bundle paths works
- [ ] Profiles persist through Rust backend (not localStorage)
- [ ] One-time migration from existing localStorage data
- [ ] `npm run check:all` passes (typecheck, lint, clippy, tests)
