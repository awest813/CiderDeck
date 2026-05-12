# Auto-Detect Games from Bottles

## Goal

Scan detected Whisky bottles and Wine prefixes for installed games. Parse the `uninstall.reg` file and scan `Program Files` directories to discover `.exe` entries, then surface them as `DetectedGame` entries that can be imported into the game library.

## Implementation

### Rust Backend

1. **New type** `DetectedGame` in `bottle.rs`:
   - `name: String` — Display name (from uninstall.reg DisplayName, fallback to .exe filename)
   - `exe_path: String` — Full path to the game's main executable
   - `bottle_id: String` — ID of the bottle this game was found in
   - `bottle_name: String` — Display name of the bottle
   - `bottle_path: String` — Filesystem path to the bottle
   - `publisher: Option<String>` — From uninstall.reg DisplayPublisher
   - `version: Option<String>` — From uninstall.reg DisplayVersion

2. **Detection logic** in `bottle.rs`:
   - Parse `uninstall.reg` for `DisplayName` / `DisplayPublisher` / `DisplayVersion` entries
   - Extract `UninstallString` or `InstallLocation` for the .exe path
   - Fallback: scan `drive_c/Program Files` and `drive_c/Program Files (x86)` for `.exe` files
   - Skip common system files (wine, uninstaller, updater, etc.)
   - Skip non-game entries using a blocklist

3. **New command** `detect_games_from_bottles`: Returns all detected games across all bottles

### Frontend

4. **TypeScript type** `DetectedGame` matching the Rust type

5. **`useGameDetection` hook**: Calls `detect_games_from_bottles`, returns results with loading state

6. **"Auto-Detect Games" button** in `GameLibraryPage`:
   - Calls the detection hook
   - Shows a confirmation list (game name, bottle, publisher)
   - "Import All" → creates Game entries for each detected game
   - Or select individual games to import
   - Matches by .exe path to avoid duplicates

## Acceptance Criteria

- [ ] Games are auto-detected from Whisky bottles and Wine prefixes
- [ ] Uninstall registry data (name, publisher, version) is extracted where available
- [ ] Games are discovered from Program Files as fallback
- [ ] Blocklist prevents system utilities from appearing as "games"
- [ ] Import dialog shows detected games with bottle source
- [ ] Duplicate detection prevents re-importing the same game
- [ ] `npm run check:all` passes
