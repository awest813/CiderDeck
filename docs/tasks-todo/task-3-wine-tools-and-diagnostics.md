# Task 3 — Wine Tools and Diagnostics

## Background

Whisky provides quick-access buttons for Wine's built-in tools (winecfg, regedit,
control panel), a "Kill All" action (`wineserver -k`), shader cache clearing,
and per-run timestamped log files with structured headers. CiderDeck already
captures stdout/stderr/exit code per launch, but lacks:

- Quick-launch buttons for Wine tools within a bottle context
- A "kill wineserver" action for hung processes
- Shader cache management
- Structured per-run log files with bottle/runtime metadata headers
- Log rotation (Whisky deletes logs older than 7 days)

This task absorbs Whisky's diagnostics and tooling patterns into CiderDeck.

## Origin

Whisky gap analysis — Whisky's `Wine.swift` (control, regedit, cfg),
`WhiskyApp.swift` (wipeShaderCaches, killBottles, deleteOldLogs),
`FileHandle+Extensions.swift` (writeApplicaitonInfo).

## Goal

Give users quick access to Wine diagnostic tools, process management, and
structured log files so they can troubleshoot compatibility issues without
leaving CiderDeck.

## Acceptance Criteria

- [ ] "Wine Tools" button group in BottleCard or BottleConfigPanel:
      - Open winecfg (`wine64 winecfg` with WINEPREFIX set)
      - Open regedit (`wine64 regedit`)
      - Open control panel (`wine64 control`)
      Each runs as a detached subprocess via `launch_profile_executable`
- [ ] `kill_wineserver` Tauri command that runs `wineserver -k` with
      the bottle's WINEPREFIX, resolving the correct wineserver binary
      from the runtime's wine path
- [ ] "Kill Wine Processes" button per bottle and a global "Kill All" action
- [ ] `clear_shader_cache` Tauri command that removes the `d3dm/` directory
      from the Darwin user cache dir (via `getconf DARWIN_USER_CACHE_DIR`)
- [ ] "Clear Shader Caches" menu item or button in Settings/diagnostics
- [ ] Structured log file headers: when saving a launch log, prepend
      CiderDeck version, runtime name/version, bottle name/path,
      Windows version, and key env toggles (Enhanced Sync, DXVK, renderer)
- [ ] Log rotation: on app startup, delete log files older than 7 days
      from the CiderDeck logs directory
- [ ] Tests for kill/cache/log commands
- [ ] `npm run check:all` passes

## Out of Scope

- In-app streaming log viewer (future enhancement — currently logs are
  captured post-run)
- Running processes table (`wine64 tasklist.exe` — Whisky has this but
  it's commented out in their own UI; lower priority)
- Terminal integration (`NSAppleScript` to open Terminal.app with Wine
  env — macOS-specific, separate consideration)

## Architecture Notes

- Wine tool launches should reuse the existing `launch_profile_executable`
  command with the tool as the target executable and the bottle's runtime
  for env resolution
- `kill_wineserver` needs to find `wineserver` relative to the runtime's
  wine binary (e.g. `/Applications/Whisky.app/Contents/MacOS/wineserver`
  or `wineserver` in PATH for standalone Wine)
- Shader cache path discovery uses `/usr/bin/getconf DARWIN_USER_CACHE_DIR`
  on macOS; on Linux the equivalent is `~/.cache/`
- Log rotation runs once at startup via a `setup` Tauri plugin hook or
  an explicit init command
