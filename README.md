# CiderDeck

CiderDeck is a **GPL-3.0-or-later**, macOS-first launcher and workbench for
game compatibility runtimes, source ports, emulators, and recompilation
projects.

This fork is maintained by **awest813** and tracks the current code in this
repository, including the latest runtime provider work, Wine-DXMT support, and
game library workflows.

CiderDeck does **not** ship proprietary game data. Bring your own legally
obtained ROMs, ISOs, BIOS files, WADs, PAKs, MPQs, and game folders.

> **Targeting macOS first.** Linux and Windows support may follow later.

## What CiderDeck does today

- Stores per-profile settings for runtimes, helpers, and custom launch flows
- Builds structured launch commands (`program` + `args[]` + env) instead of
  shell strings
- Captures stdout, stderr, exit codes, and launch history per profile
- Provides validation for missing executables, prefixes, bottles, and data
- Manages a game library with imports, detection, tags, artwork, and per-game
  launch options
- Ships curated presets and quick toggles for runtime and renderer settings

## Runtime providers

| Provider | Notes |
| --- | --- |
| Wine | Standard Wine installs |
| Wine + DXMT | Homebrew `wine-dxmt` installs with DXMT enabled |
| CrossOver | Existing CrossOver installs |
| Whisky | Existing Whisky installs |
| GPTK | Apple Game Porting Toolkit |
| Custom | User-supplied runtime paths and launch settings |
| Native | Launch without a compatibility layer |

## Game library workflows

- Import games manually, from EXE/MSI/App Bundle sources, or from the guided
  portable game wizard
- Detect games from Steam, Epic Games, and GOG
- Link one or more profiles to a game and switch launch options per title
- Use preset profiles, renderer toggles, and compatibility environment toggles
- Browse in grid or list view, filter by tags, and edit artwork and notes

The long-term plan lives in [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Tech stack

- [Tauri v2](https://tauri.app/)
- React 19 + TypeScript
- Vite + Tailwind CSS v4
- `tauri-specta` for type-safe Tauri commands
- Local storage for the current release, with SQLite on the roadmap

## Run locally

```bash
npm install
npm run dev          # frontend only
npm run tauri:dev    # full Tauri app
```

## Validation

```bash
npm run typecheck
npm run lint
npm run check:all    # typecheck + lint + format + tests + cargo checks
npm run rust:test
```

## Safety & legal

- Launches use explicit program/args/env values, not shell concatenation
- Rust commands validate input and persist logs atomically
- Profile IDs used for log files are filtered against a strict allowlist
- CiderDeck does not download, distribute, or bundle game data or DRM tools

See [`THIRD_PARTY.md`](THIRD_PARTY.md) for the external tools CiderDeck
integrates with.

## License

CiderDeck is licensed under the **GNU General Public License v3.0 or later**
(`SPDX-License-Identifier: GPL-3.0-or-later`). The full text is in
[`LICENSE`](LICENSE).
