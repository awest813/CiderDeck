# CiderDeck Roadmap

CiderDeck is GPL-3.0-or-later. Each milestone aims to ship a small,
working slice rather than a complete vision.

## v0.1 — Base Library + Launcher (current)

- Local **profile** storage for compatibility layers, source ports,
  emulators, recompilation projects, and custom helpers
- Three-step **Add Profile wizard** (category → helper → form)
- Helper-aware **ProfileForm** (compat / Doom / Quake / GemRB /
  OpenDiablo / Aleph One / OpenRCT2 / OpenXcom / Freeciv / Emulator /
  N64Recomp)
- **LaunchRequest** builders (`buildLaunchRequest` and per-helper variants)
- Structured Tauri Rust commands:
  - `launch_profile_executable`
  - `run_build_step`
  - `save_log`
  - `read_logs`
- Per-profile **log persistence** (JSON in app-data dir, capped at 200
  entries)
- Per-profile **validation panel** (errors, warnings, info)
- Placeholder **AI Troubleshoot** button (no API wired)
- The legacy single-purpose Wine/CrossOver/Whisky/GPTK Game Library page
  is preserved as a second sidebar tab

## v0.2 — Source Port Helpers

- Doom — IWAD discovery hints, mod ordering helper
- Quake / Quake II / Quake III — better mission-pack handling, Steam/GOG
  prefix discovery
- OpenDiablo / DevilutionX — guided MPQ checking, Hellfire toggle
- GemRB — preset templates per Infinity Engine title
- Aleph One — scenario auto-detect, Marathon trilogy bundling

## v0.3 — Strategy / Sim Helpers

- OpenXcom — UFO + TFTD presets, OXCE detection
- Freeciv / OpenCiv — server vs. client launch flow, ruleset picker
- OpenRCT2 — RCT2 install detection, scenario library tab
- OpenRA — mod selection (RA / TD / D2K)
- OpenTTD, CorsixTH, Julius/Augustus — first-class profile forms

## v0.4 — Emulator Profiles

- DOSBox Staging / DOSBox-X — config templating, mount helper
- PPSSPP — DLC and save-data path helpers
- Dolphin — GameCube vs. Wii presets, controller profiles
- PCSX2 — VU/EE clamping presets, BIOS region picker
- DuckStation — fastboot toggle, memory-card helpers
- RetroArch — core picker driven by the libretro core list
- MAME, ares — system selection helpers

## v0.5 — Recompilation Workbench

- N64Recomp / Recomp64 player mode polish (renderer presets, mod loading)
- Developer mode build pipeline using `run_build_step`
- Streaming build & runtime logs with severity filtering
- Per-project asset extraction wizard
- Custom decomp/recomp project templates

## v0.6 — AI Log Doctor

- Local-first log summarization using a configurable backend
- Likely-subsystem heuristics ("renderer", "audio", "input", "shaders", …)
- Suggested fixes with **confidence and risk level**
- Copy-able shell commands and rollback notes
- No automatic execution of any suggestion

## Out of scope (long-term)

- Cloud sync, accounts, leaderboards
- A community compatibility database (could happen, but only as opt-in)
- Steam imports, achievement scraping
- Anti-cheat or DRM workarounds
- Automatic ROM, BIOS, or game-data downloads of any kind
