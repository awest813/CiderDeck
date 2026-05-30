# CiderDeck User Testing Guide

## Target Hardware & Software

| Requirement   | Value                                    |
| ------------- | ---------------------------------------- |
| Machine       | MacBook Air M1 (Apple Silicon)           |
| macOS version | 11.0 (Big Sur) or later                  |
| Architecture  | arm64 (Apple Silicon native)             |
| Build type    | Unsigned internal `.app` bundle          |
| Auto-update   | **Disabled** for this testing phase      |
| Distribution  | Direct `.app` zip archive or `.dmg` file |

## Tester Setup

### Prerequisites

You need at least **one** helper tool installed to meaningfully test CiderDeck:

| Category            | Example tools to install                                        |
| ------------------- | --------------------------------------------------------------- |
| Compatibility layer | [Whisky](https://getwhisky.app), CrossOver, or Homebrew Wine    |
| Source port         | GZDoom, Ironwail, DevilutionX (via Homebrew or direct download) |
| Emulator            | DOSBox Staging, RetroArch, PPSSPP, DuckStation                  |
| Recompilation       | Zelda64Recomp / Ship of Harkinian player builds                 |

You also need your own legally obtained game data (WADs, ROMs, ISOs, etc.). CiderDeck does **not** provide game data.

### Installing CiderDeck (Internal Build)

1. Download the `.zip` or `.dmg` shared by the developer.
2. **Important — Gatekeeper bypass** (required for unsigned builds):
   - Extract or mount the archive.
   - **Right-click** (or Ctrl+click) `CiderDeck.app` → **Open**.
   - macOS will warn "CiderDeck can't be opened because it is from an unidentified developer."
   - Click **Open** in the dialog that appears on the second attempt.
   - Alternatively, run:
     ```bash
     xattr -cr /Applications/CiderDeck.app
     ```
3. Drag `CiderDeck.app` to `/Applications` (optional but recommended).
4. Launch CiderDeck.

### First Launch Expectations

- The app opens centered on screen (1200 × 800).
- No permissions prompts should appear unless you use notification features.
- Your library will be empty — that's expected.

## Smoke-Test Checklist

Run through each item and note pass/fail. Report any crashes, blank screens, or unexpected behavior.

### App Launch & Window

- [ ] App launches without crash on M1
- [ ] Window appears at expected size and is resizable
- [ ] Title bar renders correctly (macOS native traffic lights)
- [ ] App quits cleanly via Cmd+Q
- [ ] App re-opens and restores window position/size

### Profiles (Core Flow)

- [ ] **Create profile**: Sidebar → Profiles → + New Profile → pick category → pick helper → fill form → Save
- [ ] **View profile**: Newly created profile appears in the library
- [ ] **Edit profile**: Open profile → change a field → Save
- [ ] **Delete profile**: Delete via card menu → confirm deletion
- [ ] **Validation**: Create a profile with an invalid path → see warning/error badge

### Launching

- [ ] **Launch profile**: Select a valid profile → click Launch
- [ ] **Log capture**: After launch, stdout/stderr/exit code appear in log viewer
- [ ] **Launch history**: Multiple launches are listed in chronological order

### Game Library

- [ ] **Import game**: Add a game to the library manually
- [ ] **Detected games**: If applicable, test auto-detection of installed games
- [ ] **Game detail panel**: Click a game → see detail pane on the right

### Keyboard Shortcuts

- [ ] **Cmd+K**: Opens command palette
- [ ] **Cmd+,**: Opens preferences
- [ ] **Cmd+1**: Toggles left sidebar
- [ ] **Cmd+2**: Toggles right sidebar

### Command Palette

- [ ] Opens with Cmd+K
- [ ] Typing filters available commands
- [ ] Selecting a command executes it
- [ ] Escape closes the palette

### Preferences

- [ ] Theme switch (Light / Dark / System) applies immediately
- [ ] Language selection works
- [ ] Quick Pane shortcut is configurable

### Quick Pane

- [ ] Global shortcut summons the Quick Pane (if configured)
- [ ] Quick Pane appears as a floating overlay
- [ ] Clicking outside or pressing Escape dismisses it

### Bottle Manager (if applicable)

- [ ] Create a new bottle prefix
- [ ] Browse bottle contents
- [ ] Rename/delete a bottle

### Edge Cases

- [ ] Launch with a missing executable path → graceful error
- [ ] Profile with no game data path → validation warning
- [ ] Very long profile names display correctly (no overflow)
- [ ] Rapid double-click on Launch does not spawn duplicate processes

## How to Report Bugs

### What to Include

1. **Steps to reproduce** — exactly what you clicked/typed
2. **Expected behavior** — what you thought would happen
3. **Actual behavior** — what actually happened (crash, blank screen, wrong output)
4. **Screenshot or screen recording** if possible
5. **Log files** (see below)

### Where to Find Logs

CiderDeck logs are stored at:

```
~/Library/Logs/com.awest813.ciderdeck/
```

Attach the most recent `.log` file to your bug report.

Profile launch logs are stored in:

```
~/Library/Application Support/com.awest813.ciderdeck/logs/
```

### Where to Report

- GitHub Issues: https://github.com/awest813/CiderDeck/issues
- Or send directly to the developer via the shared channel

Use the label **`user-testing`** when filing issues.

## Known Limitations (v0.1.0 Internal)

- **No auto-update** — you must manually download new builds
- **Unsigned build** — Gatekeeper will warn on first launch (see install instructions above)
- **No AI Troubleshoot** — the button is reserved for a future feature
- **Browser storage only** — profile data is stored in local browser storage; no SQLite yet
- **macOS only** — Linux and Windows are not supported in this version
- **No cloud sync** — data is local to this machine only

## Exit Criteria

This testing round is considered successful when:

- [ ] CiderDeck installs and launches reliably on MacBook Air M1
- [ ] Core profile create/edit/delete/launch flow works end-to-end
- [ ] No crashes during normal usage paths
- [ ] Testers can find and follow documentation to get started
- [ ] Critical feedback is collected and triaged
