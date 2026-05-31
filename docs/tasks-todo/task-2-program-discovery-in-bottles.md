# Task 2 — Program Discovery and Management in Bottles

## Background

Whisky's program management is a key UX: it walks `drive_c/Program Files/` and
`Program Files (x86)/` for `.exe` files, parses Start Menu `.lnk` shortcuts to
auto-pin post-install programs, supports a blocklist for hiding unwanted entries,
and stores per-program settings (locale, extra args, extra env vars).

CiderDeck already has `detect_games_in_bottle` (scans `Program Files` dirs and
`uninstall.reg`) and `detect_games_from_bottles`, but these are used only for
game import — there is no browsable program list per bottle, no blocklist, no
per-program settings, and no post-install auto-discovery.

This task absorbs Whisky's program discovery and per-program configuration into
CiderDeck's bottle detail view.

## Origin

Whisky gap analysis — Whisky's `Bottle+Extensions.swift` (updateInstalledPrograms,
getStartMenuPrograms), `ProgramsView.swift`, `ProgramSettings.swift`,
`ProgramView.swift`.

## Goal

Show discovered programs inside each bottle with launch, configure, and hide
actions, so users can manage what's installed in a bottle without leaving CiderDeck.

## Acceptance Criteria

- [ ] Enhance `detect_games_in_bottle` to also scan Start Menu `.lnk` directories
      (`drive_c/ProgramData/Microsoft/Windows/Start Menu/` and
      `drive_c/users/*/AppData/Roaming/Microsoft/Windows/Start Menu/`)
- [ ] New `BottleProgram` struct in Rust with name, exe path, architecture
      (x86/x64), pinned flag, blocked flag
- [ ] `list_bottle_programs` Tauri command returning all discovered programs
- [ ] `BottleProgramsList` React component embedded in bottle detail view:
      - Searchable/filterable list of programs
      - Pin/unpin toggle per program
      - "Add to blocklist" action to hide unwanted entries
      - Run button per program (launches via existing profile launch flow)
      - Architecture badge (x86/x64) per program
- [ ] Per-program settings stored in bottle sidecar:
      - Extra launch arguments
      - Extra environment variables
      - Locale override (`LC_ALL`)
- [ ] Post-install refresh: after launching an installer exe, re-scan programs
- [ ] Tests for program scanning logic in Rust
- [ ] `npm run check:all` passes

## Out of Scope

- PE icon extraction (Whisky parses PE `.rsrc` sections — complex, defer)
- `.lnk` file parsing (use filename-based discovery first, full ShellLink
  parsing is a future enhancement)
- macOS `.app` bundle shortcut generation (Whisky's ProgramShortcut.swift —
  macOS-specific, separate task)
- Winetricks verb tracking per program

## Architecture Notes

- `BottleProgram` lives alongside `DetectedGame` in `bottle.rs` but is
  broader (includes non-game executables like tools and utilities)
- Pin/blocklist state stored in `.ciderdeck-meta.json` sidecar
- Program launch uses the bottle's runtime to build a `LaunchCommand`
- Architecture detection can use simple heuristics (path contains "x86")
  before investing in PE header parsing
