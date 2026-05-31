# CiderDeck Roadmap

CiderDeck is GPL-3.0-or-later and macOS-first.
Each milestone ships a small, usable slice toward one clear outcome:
an open-source compatibility manager for Windows games on macOS.

## Product Goal

Make CiderDeck the open-source, macOS-first game compatibility manager:
a "macOS Lutris" with Proton-style convenience while respecting
CrossOver intellectual property and avoiding proprietary feature cloning.

## Product Boundaries

- CiderDeck is a compatibility manager/orchestrator, not a game
  reimplementation project
- No bundled proprietary game data, no anti-cheat workarounds, and no DRM
  circumvention tooling
- "macOS Proton-style" means curated runtime + per-game presets and reversible
  toggles that avoid privileged/system-file changes, not a literal Proton port
- CrossOver integration is treated as interoperability with existing installs
  first (launching and using existing bottles); creating or modifying
  CrossOver-managed bottles is a later milestone decision

## Milestones

## v0.1 — Stable Core Launcher (current)

- Profile-based launcher with helper-aware forms and validation
- Structured launch requests and typed Tauri command bridge
- Per-profile logging, persistence, and troubleshooting foundation
- Solid baseline for Wine, CrossOver, Whisky, GPTK, and custom helper flows

## v0.2 — Unified Runtime Provider Layer

- Standardize all compatibility helpers behind one runtime abstraction:
  - Wine
  - Whisky
  - Apple Game Porting Toolkit (GPTK)
  - CrossOver
  - Custom runtime/provider
- Ensure all runtime-backed profiles support:
  - executable path
  - prefix/bottle/container selection
  - environment variables
  - launch arguments
  - validation and log capture

## v0.3 — Bottle / Prefix Manager

- First-class management of Wine prefixes, Whisky bottles, and related
  container concepts
- Create, clone, repair, reset, export/import, and delete workflows
- Track runtime version, architecture, Windows version, installed components,
  and compatibility notes per bottle
- Surface bottle health and storage usage for troubleshooting

## v0.4 — Game-Centric Library Workflows

**Phase A** ✅ Complete — core game library foundation:

- `Game` data model (Rust + TypeScript), CRUD Tauri commands, JSON persistence
- Game library UI: grid/list view, tag filter, artwork support
- `GameImportDialog` with Manual / EXE/MSI / App Bundle sources
- Bottle auto-detection UI integrated into profile management

**Phase B** ✅ Complete — expanded import and launch workflows:

- Steam and Epic Games launcher detection (`detect_steam_games`, `detect_epic_games`)
- `LauncherImportDialog`: tabbed Steam/Epic import with duplicate filtering
- "+ From Launchers" entry point in Game Library toolbar
- Multi-profile launch picker in `GameDetailPanel` (single button or "Launch with…" dropdown)
- `SteamLibrary` / `EpicLibrary` labels in `GameCard` and `GameImportDialog`

**Phase C** ✅ Complete — GOG Galaxy detection and per-game launch options:

- GOG Galaxy detection (`detect_gog_games`) — scans `/Applications`, `~/Applications`, and `~/GOG Games` for `goggame-*.info` marker files
- `GogLibrary` import source and GOG tab in `LauncherImportDialog`
- `useGogDetection` / `useRefreshGog` TanStack Query hooks
- `extraArgs` per-game extra launch arguments — stored on `Game`, editable in `GameDetailPanel`, appended to the profile's args at launch time

**Phase D** ✅ Complete — portable game onboarding wizard:

- `PortableGameWizard` — four-step guided dialog (Source → File → Details → Profiles)
- Native file picker via `@tauri-apps/plugin-dialog` for EXE/MSI and App Bundle sources
- Auto-name suggestion from file/folder path (`nameFromPath` helper)
- Profile linking step with checkbox list; graceful fallback in non-Tauri environments
- `+ Add Portable` toolbar button in `GameLibraryPage`

Remaining for v0.4 (future iterations):

- Install flows for installer-based games

## v0.5 — Proton-Style Convenience

**Phase A** ✅ Complete — curated presets and quick runtime switching:

- Bundled compatibility presets (Wine, DXMT, GPTK, Whisky, CrossOver)
- `PresetPickerDialog` in profile forms and game library linked profiles
- Quick runtime switching ("Try with…") from `GameDetailPanel`
- Rollback-safe preset apply via toast undo

**Phase B** ✅ Complete — one-click toggles from the game library:

- Shared `RendererToggleGroup` for profile forms and linked profiles
- `CompatibilityEnvToggles` for common env recipes (e.g. quiet Wine logs)
- Undo-safe renderer and env changes from `GameDetailPanel`

**Phase C** ✅ Complete — preset discovery and shared rollback:

- Runtime-aware preset grouping in `PresetPickerDialog` (recommended vs other runtimes)
- Six bundled presets including Whisky, CrossOver, and Wine + MoltenVK
- Shared `applyCompatibilityProfileWithUndo` helper for toast-based profile rollback
- Undo when applying presets in profile forms

## v0.6 — macOS-Native Compatibility Experience

- Finder-focused UX polish: drag-and-drop, file associations, native paths
- Better Apple Silicon vs Intel guidance and runtime requirement surfacing
- Improved handling for app bundles, mounted installers, and macOS storage
- Stronger macOS-first diagnostics and log workflows

## v0.7 — Community and Ecosystem Integrations

- Import/export shareable profile manifests
- Optional community-maintained presets/installer definitions
- Metadata integrations for game details and artwork
- Compatibility reports and reproducible bug-report exports
- Keep community features opt-in and separated from core launching

## v1.0 — Production-Ready Compatibility Platform

- Stable plugin/helper interfaces for adding new runtime providers
- Published runtime/provider API and contribution guidelines
- Public compatibility matrix and maintenance roadmap
- Production release workflows for packaging, signing, and updates
- Complete developer docs for helpers, validators, and installer patterns

## Strategic Decisions to Lock Early

- Primary identity: game launcher, runtime manager, or balanced hybrid
  (decision criteria: reduced setup friction, reduced support volume,
  maintenance cost, and support burden;
  decide by end of v0.2 to inform v0.3 architecture)
- CrossOver scope: shallow interoperability first vs deeper integration later
  (decision criteria: legal review, user demand, and long-term maintenance;
  decide by end of v0.2)
- Preset distribution model: bundled, curated catalog, or user-installed
  (decision criteria: moderation burden, GPL compatibility and third-party
  distribution rights clarity, and UX simplicity;
  decide by v0.4)
- Automation boundaries: what is safe and supportable without legal risk
  (decision criteria: legal constraints, safety, and support overhead;
  decide by v0.4 before wider preset/community rollout)

## Out of Scope (Long-Term)

- Cloud accounts, social features, or leaderboards
- Anti-cheat or DRM circumvention tooling
- Automatic ROM, BIOS, or proprietary game-data downloads
