# Task — v0.4 Phase B: Game-Centric Workflows

## Background

Phase A of v0.4 established the core game library: the `Game` data model, CRUD
commands, the game library UI, bottle detection, and a basic import dialog.

Phase B expands game-centric workflows now that the foundation exists: launcher-driven
import paths, multi-profile launch support, richer import-source labelling, and
UX polish.

## Goal

Implement Steam and Epic Games launcher detection, a launcher import dialog, per-game
multi-profile launch picker, and consistent import-source labels throughout the UI.

## Acceptance Criteria

- [x] `GameImportSource` enum extended with `SteamLibrary` and `EpicLibrary` variants
- [x] `SteamGame` and `EpicGame` Rust structs with display name and install path
- [x] `detect_steam_games` Tauri command — scans `~/Library/Application Support/Steam`
      including additional library folders from `libraryfolders.vdf`
- [x] `detect_epic_games` Tauri command — parses
      `~/Library/Application Support/Epic/EpicGamesLauncher/Data/Manifests/*.item`
- [x] `detectSteamGames` / `detectEpicGames` TypeScript bindings
- [x] `useSteamDetection` / `useEpicDetection` TanStack Query hooks with lazy loading
- [x] `LauncherImportDialog` — tabbed Steam/Epic import dialog with duplicate filtering,
      select-all, and per-game "Already imported" badges
- [x] `GameLibraryPage` — "+ From Launchers" button and `LauncherImportDialog` wiring;
      duplicate detection uses `existingInstallPaths` / `existingTitles` computed sets
- [x] `GameDetailPanel` — multi-profile launch picker: single linked profile shows
      "Launch" button; two or more shows a "Launch with…" dropdown menu
- [x] `GameDetailPanel` — `onLaunch(game, profileId)` prop for profile-aware launching
- [x] `GameCard` — `SteamLibrary` → "Steam", `EpicLibrary` → "Epic" labels
- [x] `GameImportDialog` — `SteamLibrary` and `EpicLibrary` added as selectable sources
      with appropriate install-path placeholder copy
- [x] `npm run check:all` (typecheck + lint + tests) passes

## Out of Scope

- GOG Galaxy detection (future)
- Portable game onboarding wizard (future)
- Community preset sharing (later milestone)
- Automatic runtime/bottle suggestion for imported games (future)
