# Task 1 — Bottle Configuration Panel

## Background

Whisky's core strength is its per-bottle configuration UI: Windows version picker,
Enhanced Sync mode (None/ESync/MSync), DXVK toggles (on/off, async, HUD level),
Metal HUD/Trace/DXR flags, Retina mode, DPI slider, AVX toggle, and quick access
to Wine tools (winecfg, regedit, control panel).

CiderDeck has bottle detection, CRUD operations, health monitoring, and notes — but
no way to configure a bottle's Wine settings from the UI. Users must know which env
vars to set or edit registry keys manually. The existing `COMPATIBILITY_ENV_TOGGLES`
array has only one entry (`quiet-logs`). The `COMPATIBILITY_RENDERER_OPTIONS` cover
renderer selection but not the per-bottle toggles Whisky exposes.

This task absorbs Whisky's `ConfigView.swift` concepts into CiderDeck's existing
bottle card / detail panel as a new "Configuration" section.

## Origin

Whisky gap analysis — Whisky's `ConfigView.swift`, `BottleSettings.swift`,
`BottleSettings.environmentVariables()`.

## Goal

Add a "Configuration" expandable section to the `BottleCard` component (or a
dedicated `BottleConfigPanel`) that lets users toggle per-bottle Wine settings
and see them reflected in launch environment variables.

## Acceptance Criteria

- [ ] New `COMPATIBILITY_ENV_TOGGLES` entries covering Whisky's key toggles:
      - Enhanced Sync: ESync (`WINEESYNC=1`), MSync (`WINEMSYNC=1` + `WINEESYNC=1`)
      - DXVK Async (`DXVK_ASYNC=1`)
      - DXVK HUD levels: Full / Partial (`devinfo,fps,frametimes`) / FPS / Off
      - Metal HUD (`MTL_HUD_ENABLED=1`)
      - Metal Trace (`METAL_CAPTURE_ENABLED=1`)
      - DXR / Ray Tracing (`D3DM_SUPPORT_DXR=1`)
      - AVX advertisement (`ROSETTA_ADVERTISE_AVX=1`)
- [ ] `BottleConfigPanel` React component with toggle switches and pickers
      for Enhanced Sync mode, DXVK options, Metal options, and AVX
- [ ] Per-bottle configuration stored in the `.ciderdeck-meta.json` sidecar
      (extend `BottleSidecar` struct in Rust with a `config` field)
- [ ] Configuration merged into environment variables at launch time
      (profile env + bottle config env + preset env)
- [ ] "Open winecfg" / "Open regedit" / "Open control panel" buttons that
      invoke `wine64 winecfg`, `wine64 regedit`, `wine64 control` via
      the existing `launch_profile_executable` Tauri command
- [ ] Windows version change via `wine64 winecfg -v <version>` subprocess
- [ ] Tests for the new toggle definitions and env-var composition
- [ ] `npm run check:all` passes

## Out of Scope

- DPI slider and Retina mode (macOS-specific, lower priority)
- DXVK DLL replacement on disk (Whisky physically swaps DLLs — too invasive)
- Winetricks integration (separate task)
- Running processes view / tasklist (separate task)

## Architecture Notes

- Extend `BottleSidecar` in `bottle.rs` with an optional `config: Option<BottleConfig>`
- `BottleConfig` is a flat struct of optional fields: `enhanced_sync`, `dxvk`,
  `dxvk_async`, `dxvk_hud`, `metal_hud`, `metal_trace`, `dxr`, `avx`
- On the frontend, `COMPATIBILITY_ENV_TOGGLES` should support grouped toggles
  (radio groups like Enhanced Sync, not just on/off switches)
- The BottleConfigPanel reads/writes via new `save_bottle_config` / sidecar commands
