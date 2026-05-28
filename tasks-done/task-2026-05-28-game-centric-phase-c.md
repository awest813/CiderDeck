# v0.4 — Game-Centric Library Workflows (Phase C)

## Goal

Complete v0.4 by marking GOG Galaxy detection as done and implementing per-game extra launch arguments (`extraArgs`).

## Scope

### GOG Galaxy Detection (already implemented, now documented)

- `detect_gog_games` Tauri command scans `/Applications`, `~/Applications`, `~/GOG Games` for `goggame-*.info` marker files
- `GogGame` struct with `name` and `install_dir`
- `GogLibrary` variant in `GameImportSource` enum
- `useGogDetection` and `useRefreshGog` TanStack Query hooks in `use-launcher-detection.ts`
- `LauncherImportDialog` third "GOG" tab
- `GameCard` source label for `GogLibrary`
- `GameImportDialog` includes GOG as selectable source

### Per-Game Extra Launch Arguments (`extraArgs`)

- `extra_args: Vec<String>` field added to Rust `Game` and `GameImport` structs
  - `#[serde(default)]` for backward compatibility with existing `games.json` files
  - `#[serde(rename = "extraArgs")]` to match TypeScript camelCase convention
- `extraArgs: string[]` added to TypeScript `Game` and `GameImport` types in `bindings.ts`
- `launchProfile(profile, extraArgs: string[] = [])` — optional second parameter appends extra args after profile-specified args
- `GameLibraryPage.handleLaunch` passes `game.extraArgs` to `launchProfile`
- `GameDetailPanel` — edit form has "Extra launch arguments (space-separated)" input; view mode shows args when non-empty
- All `GameImport` construction sites updated with `extraArgs: []`:
  - `GameImportDialog.tsx`
  - `GameLibraryPage.tsx` (handleImportDetected)
  - `LauncherImportDialog.tsx` (steam, epic, gog tabs)

## Architecture Decisions

- **Append order**: Extra args go after profile args, so profile config takes precedence in any ordering-sensitive scenarios
- **Space-separated UI**: Single text input parsed by whitespace matches common CLI conventions; tags use comma-separation to differentiate
- **`serde(default)`**: Ensures zero-migration backward compatibility — existing saves deserialize with an empty Vec

## Out of Scope

- Portable game onboarding wizard
- Installer-based install flows
