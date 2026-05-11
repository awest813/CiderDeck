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
- "macOS Proton-style" means curated runtime + per-game presets and safe
  toggles, not a literal Proton port
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

- Shift from tool-centric launching to game-centric library management
- Map each game to one or more runtime profiles/bottles
- Manual imports from:
  - app bundles
  - Steam/GOG/Epic install paths
  - standalone EXE/MSI workflows
- Install flows for installer-based and portable games
- Add per-game artwork, tags, notes, and launch options

## v0.5 — Proton-Style Convenience

- Curated presets for common runtime/game scenarios
- One-click compatibility toggles and known-good recipes
- Easy runtime switching ("try with Whisky", "try with GPTK", "try with Wine")
- Rollback-safe profile/bottle changes for low-risk experimentation

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
  (decision criteria: user outcomes, maintenance cost, and support burden;
  decide by v0.3 after v0.2 runtime-layer feedback)
- CrossOver scope: shallow interoperability first vs deeper integration later
- Preset distribution model: bundled, curated catalog, or user-installed
- Automation boundaries: what is safe and supportable without legal risk

## Out of Scope (Long-Term)

- Cloud accounts, social features, or leaderboards
- Anti-cheat or DRM circumvention tooling
- Automatic ROM, BIOS, or proprietary game-data downloads
