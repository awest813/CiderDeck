// SPDX-License-Identifier: GPL-3.0-or-later

//! Game library commands for managing game entries.
//!
//! Games are persisted as a JSON array at `<app_data_dir>/games.json`.
//! Each game maps to one or more runtime profiles and tracks import source,
//! artwork, tags, and notes.

use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::types::validate_string_input;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum GameImportSource {
    Manual,
    AppBundle,
    ExeMsi,
    /// Imported from a Steam library
    SteamLibrary,
    /// Imported from Epic Games Launcher
    EpicLibrary,
    /// Imported from GOG Galaxy
    GogLibrary,
}

// ============================================================================
// Steam Detection
// ============================================================================

/// A game found in an installed Steam library.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct SteamGame {
    /// Steam app ID (numeric)
    pub app_id: String,
    /// Display name of the game
    pub name: String,
    /// Absolute path to the install directory
    pub install_dir: String,
    /// Size on disk in bytes (from Steam manifest)
    pub size_on_disk: Option<u64>,
}

/// A game found via the Epic Games Launcher.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct EpicGame {
    /// Epic catalog item ID / app name
    pub app_name: String,
    /// Display name of the game
    pub name: String,
    /// Absolute path to the install directory
    pub install_location: String,
    /// Relative path to the main executable (if present in manifest)
    pub launch_executable: Option<String>,
}

// ============================================================================
// GOG Galaxy Detection
// ============================================================================

/// A game found via GOG Galaxy.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GogGame {
    /// GOG game / product ID
    pub game_id: String,
    /// Display name of the game
    pub name: String,
    /// Absolute path to the install directory (directory containing the info file)
    pub install_dir: String,
}

fn home_dir() -> Option<PathBuf> {
    // On Windows the home directory is USERPROFILE; fall back to HOME for
    // macOS and Linux.
    std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .ok()
        .map(PathBuf::from)
}

/// Parse a minimal subset of Valve's KeyValues (VDF) format.
///
/// Only handles flat `"key"\t"value"` pairs at depth ≤ 1 inside the first
/// top-level block. This is sufficient to read `appmanifest_*.acf` and the
/// root level of `libraryfolders.vdf`.
fn vdf_get(text: &str, key: &str) -> Option<String> {
    let needle = format!("\"{key}\"");
    for line in text.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with(&needle) {
            // Rest of line after the key token
            let after = trimmed[needle.len()..].trim();
            // Value should be a quoted string
            if after.starts_with('"') && after.ends_with('"') && after.len() >= 2 {
                return Some(after[1..after.len() - 1].to_string());
            }
        }
    }
    None
}

/// Extract all library paths from `libraryfolders.vdf`.
///
/// Steam stores the canonical library at the `steamapps/` directory passed in,
/// plus extra libraries listed in the VDF. Each extra library entry has a
/// `"path"` field.
fn parse_library_folders(vdf_path: &std::path::Path) -> Vec<PathBuf> {
    let text = match std::fs::read_to_string(vdf_path) {
        Ok(t) => t,
        Err(_) => return Vec::new(),
    };

    let mut paths = Vec::new();
    for line in text.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("\"path\"") {
            let after = trimmed["\"path\"".len()..].trim();
            if after.starts_with('"') && after.ends_with('"') && after.len() >= 2 {
                let raw = &after[1..after.len() - 1];
                let lib_path = PathBuf::from(raw).join("steamapps");
                if lib_path.is_dir() {
                    paths.push(lib_path);
                }
            }
        }
    }
    paths
}

/// Parse one `appmanifest_*.acf` file into a `SteamGame`.
fn parse_acf(path: &std::path::Path, install_base: &std::path::Path) -> Option<SteamGame> {
    let text = std::fs::read_to_string(path).ok()?;
    let app_id = vdf_get(&text, "appid")?;
    let name = vdf_get(&text, "name")?;
    let install_sub = vdf_get(&text, "installdir")?;
    let size_on_disk = vdf_get(&text, "SizeOnDisk").and_then(|s| s.parse::<u64>().ok());

    let install_dir = install_base
        .join("common")
        .join(&install_sub)
        .to_string_lossy()
        .to_string();

    Some(SteamGame {
        app_id,
        name,
        install_dir,
        size_on_disk,
    })
}

/// Collect candidate Steam `steamapps` directories across all supported platforms.
///
/// Returns a de-duplicated, sorted list of existing `steamapps` directories.
fn steam_candidate_dirs(home: Option<&PathBuf>) -> Vec<PathBuf> {
    let mut candidates: Vec<PathBuf> = Vec::new();

    // macOS default location
    if let Some(h) = home {
        candidates.push(
            h.join("Library")
                .join("Application Support")
                .join("Steam")
                .join("steamapps"),
        );
    }

    // Windows: Program Files (x86) is the standard location; also check
    // Program Files and the LOCALAPPDATA roaming Steam installation.
    #[cfg(target_os = "windows")]
    {
        // %PROGRAMFILES(X86)%\Steam\steamapps  (most common)
        if let Ok(pf86) = std::env::var("PROGRAMFILES(X86)") {
            candidates.push(PathBuf::from(&pf86).join("Steam").join("steamapps"));
        }
        // %PROGRAMFILES%\Steam\steamapps
        if let Ok(pf) = std::env::var("PROGRAMFILES") {
            candidates.push(PathBuf::from(&pf).join("Steam").join("steamapps"));
        }
        // %LOCALAPPDATA%\Steam\steamapps  (rare, but some portable installs use this)
        if let Ok(local) = std::env::var("LOCALAPPDATA") {
            candidates.push(PathBuf::from(&local).join("Steam").join("steamapps"));
        }
    }

    // Linux: ~/.steam/steam/steamapps (Debian/Ubuntu) and ~/.local/share/Steam/steamapps
    #[cfg(target_os = "linux")]
    {
        if let Some(h) = home {
            candidates.push(h.join(".steam").join("steam").join("steamapps"));
            candidates.push(
                h.join(".local")
                    .join("share")
                    .join("Steam")
                    .join("steamapps"),
            );
        }
    }

    candidates
}

/// Detect all Steam games installed on the system.
///
/// Scans the platform-appropriate default `steamapps` directory and any
/// additional library paths listed in `libraryfolders.vdf`.
#[tauri::command]
#[specta::specta]
pub async fn detect_steam_games() -> Vec<SteamGame> {
    let home = home_dir();
    let candidate_dirs = steam_candidate_dirs(home.as_ref());

    let mut library_dirs: Vec<PathBuf> = Vec::new();
    for dir in candidate_dirs {
        if dir.is_dir() {
            // Parse libraryfolders.vdf if present to pick up extra libraries.
            let vdf = dir.join("libraryfolders.vdf");
            if vdf.exists() {
                library_dirs.extend(parse_library_folders(&vdf));
            }
            library_dirs.push(dir);
        }
    }

    // De-duplicate library dirs
    library_dirs.sort();
    library_dirs.dedup();

    // De-duplicate library dirs
    library_dirs.sort();
    library_dirs.dedup();

    let mut games: Vec<SteamGame> = Vec::new();
    let mut seen_app_ids: std::collections::HashSet<String> = std::collections::HashSet::new();

    for lib_dir in &library_dirs {
        let entries = match std::fs::read_dir(lib_dir) {
            Ok(e) => e,
            Err(_) => continue,
        };
        for entry in entries.flatten() {
            let path = entry.path();
            let fname = path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default();
            if fname.starts_with("appmanifest_") && fname.ends_with(".acf") {
                if let Some(game) = parse_acf(&path, lib_dir) {
                    if seen_app_ids.insert(game.app_id.clone()) {
                        games.push(game);
                    }
                }
            }
        }
    }

    log::info!("Steam detection: {} games found", games.len());
    games
}

// ============================================================================
// Epic Games Detection
// ============================================================================

/// Collect candidate Epic Games Launcher manifest directories across platforms.
fn epic_manifest_dirs(home: Option<&PathBuf>) -> Vec<PathBuf> {
    let mut candidates: Vec<PathBuf> = Vec::new();

    // macOS
    if let Some(h) = home {
        candidates.push(
            h.join("Library")
                .join("Application Support")
                .join("Epic")
                .join("EpicGamesLauncher")
                .join("Data")
                .join("Manifests"),
        );
    }

    // Windows: manifests live under ProgramData
    #[cfg(target_os = "windows")]
    {
        if let Ok(pd) = std::env::var("PROGRAMDATA") {
            candidates.push(
                PathBuf::from(&pd)
                    .join("Epic")
                    .join("EpicGamesLauncher")
                    .join("Data")
                    .join("Manifests"),
            );
        }
    }

    // Linux: ~/.config/Epic/EpicGamesLauncher/Data/Manifests (Heroic/Legendary layout)
    #[cfg(target_os = "linux")]
    {
        if let Some(h) = home {
            candidates.push(
                h.join(".config")
                    .join("Epic")
                    .join("EpicGamesLauncher")
                    .join("Data")
                    .join("Manifests"),
            );
        }
    }

    candidates
}

/// Detect all games installed via the Epic Games Launcher.
///
/// Scans the platform-appropriate manifests directory for `*.item` JSON files.
/// Each file describes one installed game.
#[tauri::command]
#[specta::specta]
pub async fn detect_epic_games() -> Vec<EpicGame> {
    let home = home_dir();
    let manifest_dirs = epic_manifest_dirs(home.as_ref());

    let mut games: Vec<EpicGame> = Vec::new();

    for manifests_dir in manifest_dirs {
        if !manifests_dir.is_dir() {
            continue;
        }

        let entries = match std::fs::read_dir(&manifests_dir) {
            Ok(e) => e,
            Err(_) => continue,
        };

        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) != Some("item") {
                continue;
            }
            let text = match std::fs::read_to_string(&path) {
                Ok(t) => t,
                Err(_) => continue,
            };
            let json: serde_json::Value = match serde_json::from_str(&text) {
                Ok(v) => v,
                Err(_) => continue,
            };

            let name = match json.get("DisplayName").and_then(|v| v.as_str()) {
                Some(n) => n.to_string(),
                None => continue,
            };
            let install_location = match json.get("InstallLocation").and_then(|v| v.as_str()) {
                Some(p) => p.to_string(),
                None => continue,
            };
            let app_name = json
                .get("MainGameAppName")
                .and_then(|v| v.as_str())
                .or_else(|| json.get("AppName").and_then(|v| v.as_str()))
                .unwrap_or("")
                .to_string();
            let launch_executable = json
                .get("LaunchExecutable")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());

            // Skip entries that look like DLC/addons (no install location)
            if install_location.is_empty() {
                continue;
            }

            // Avoid duplicates if multiple manifest dirs are scanned
            if games.iter().any(|g: &EpicGame| g.app_name == app_name) {
                continue;
            }

            games.push(EpicGame {
                app_name,
                name,
                install_location,
                launch_executable,
            });
        }
    }

    log::info!("Epic detection: {} games found", games.len());
    games
}

/// Detect all games installed via GOG Galaxy.
///
/// GOG leaves a `goggame-<id>.info` JSON file in each game's install directory.
/// This function scans common installation locations for those marker files and
/// parses the game name and ID from them.
///
/// Locations scanned on macOS (depth 1):
/// - `/Applications/`
/// - `~/Applications/`
/// - `~/GOG Games/`
///
/// Locations scanned on Windows (depth 1):
/// - `C:\GOG Games\`
/// - `%PROGRAMFILES%\GOG Games\`
/// - `%PROGRAMFILES(X86)%\GOG Games\`
///
/// Locations scanned on Linux (depth 1):
/// - `~/GOG Games/`
/// - `~/.local/share/GOG.com/Galaxy/Games/`
#[tauri::command]
#[specta::specta]
pub async fn detect_gog_games() -> Vec<GogGame> {
    let home = home_dir();

    // Candidate root directories that GOG typically installs games into.
    let mut search_roots: Vec<PathBuf> = Vec::new();

    // macOS locations
    #[cfg(target_os = "macos")]
    {
        search_roots.push(PathBuf::from("/Applications"));
        if let Some(ref h) = home {
            search_roots.push(h.join("Applications"));
            search_roots.push(h.join("GOG Games"));
        }
    }

    // Windows locations
    #[cfg(target_os = "windows")]
    {
        search_roots.push(PathBuf::from("C:\\GOG Games"));
        if let Ok(pf) = std::env::var("PROGRAMFILES") {
            search_roots.push(PathBuf::from(&pf).join("GOG Games"));
        }
        if let Ok(pf86) = std::env::var("PROGRAMFILES(X86)") {
            search_roots.push(PathBuf::from(&pf86).join("GOG Games"));
        }
    }

    // Linux locations
    #[cfg(target_os = "linux")]
    {
        if let Some(ref h) = home {
            search_roots.push(h.join("GOG Games"));
            search_roots.push(
                h.join(".local")
                    .join("share")
                    .join("GOG.com")
                    .join("Galaxy")
                    .join("Games"),
            );
        }
    }

    let mut games: Vec<GogGame> = Vec::new();

    for root in search_roots {
        if !root.is_dir() {
            continue;
        }

        // Scan one level deep inside the root directory.
        let top_entries = match std::fs::read_dir(&root) {
            Ok(e) => e,
            Err(_) => continue,
        };

        for top_entry in top_entries.flatten() {
            let top_path = top_entry.path();

            // GOG info files can live directly in a game folder, or on macOS
            // one level inside an `.app` bundle (Contents/).
            let candidate_dirs: Vec<PathBuf> = if top_path.is_dir() {
                let mut dirs = vec![top_path.clone()];
                // macOS .app bundles store their contents in Contents/
                if cfg!(target_os = "macos") {
                    dirs.push(top_path.join("Contents"));
                }
                dirs
            } else {
                continue;
            };

            for dir in candidate_dirs {
                if !dir.is_dir() {
                    continue;
                }
                let inner_entries = match std::fs::read_dir(&dir) {
                    Ok(e) => e,
                    Err(_) => continue,
                };
                for entry in inner_entries.flatten() {
                    let path = entry.path();
                    let file_name = match path.file_name().and_then(|n| n.to_str()) {
                        Some(n) => n.to_string(),
                        None => continue,
                    };
                    // GOG info files are named `goggame-<id>.info`
                    if !file_name.starts_with("goggame-")
                        || path.extension().and_then(|e| e.to_str()) != Some("info")
                    {
                        continue;
                    }

                    let text = match std::fs::read_to_string(&path) {
                        Ok(t) => t,
                        Err(_) => continue,
                    };
                    let json: serde_json::Value = match serde_json::from_str(&text) {
                        Ok(v) => v,
                        Err(_) => continue,
                    };

                    // Skip DLC / helper entries — only keep root / standalone games.
                    let game_id = match json.get("gameId").and_then(|v| v.as_str()) {
                        Some(id) => id.to_string(),
                        None => continue,
                    };
                    let root_game_id = json
                        .get("rootGameId")
                        .and_then(|v| v.as_str())
                        .unwrap_or(&game_id)
                        .to_string();
                    if game_id != root_game_id {
                        continue;
                    }

                    let name = match json.get("gameName").and_then(|v| v.as_str()) {
                        Some(n) if !n.is_empty() => n.to_string(),
                        _ => continue,
                    };

                    // Use the top-level entry path as the install directory.
                    let install_dir = top_path.to_string_lossy().into_owned();

                    // Avoid duplicates if a game has multiple info files in sub-dirs.
                    if games.iter().any(|g: &GogGame| g.game_id == game_id) {
                        continue;
                    }

                    games.push(GogGame {
                        game_id,
                        name,
                        install_dir,
                    });
                    break; // found info file for this top-level dir, move on
                }
            }
        }
    }

    log::info!("GOG detection: {} games found", games.len());
    games
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Game {
    pub id: String,
    pub title: String,
    #[serde(rename = "importSource")]
    pub import_source: GameImportSource,
    #[serde(rename = "installPath")]
    pub install_path: Option<String>,
    #[serde(rename = "artworkPath")]
    pub artwork_path: Option<String>,
    pub tags: Vec<String>,
    pub notes: Option<String>,
    #[serde(rename = "profileIds")]
    pub profile_ids: Vec<String>,
    /// Extra command-line arguments appended to the profile's args at launch time.
    #[serde(default, rename = "extraArgs")]
    pub extra_args: Vec<String>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GameImport {
    pub title: String,
    #[serde(rename = "importSource")]
    pub import_source: GameImportSource,
    #[serde(rename = "installPath")]
    pub install_path: Option<String>,
    #[serde(rename = "artworkPath")]
    pub artwork_path: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    pub notes: Option<String>,
    #[serde(default, rename = "profileIds")]
    pub profile_ids: Vec<String>,
    /// Extra command-line arguments appended to the profile's args at launch time.
    #[serde(default, rename = "extraArgs")]
    pub extra_args: Vec<String>,
}

fn games_file(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Failed to get app data directory: {error}"))?;
    std::fs::create_dir_all(&dir)
        .map_err(|error| format!("Failed to create app data directory: {error}"))?;
    Ok(dir.join("games.json"))
}

fn read_games_from_disk(path: &PathBuf) -> Vec<Game> {
    if !path.exists() {
        return Vec::new();
    }
    let contents = match std::fs::read_to_string(path) {
        Ok(c) => c,
        Err(error) => {
            log::warn!("Failed to read games file: {error}");
            return Vec::new();
        }
    };
    match serde_json::from_str(&contents) {
        Ok(games) => games,
        Err(error) => {
            log::warn!("Failed to parse games file: {error}");
            Vec::new()
        }
    }
}

fn write_games_atomic(path: &PathBuf, games: &[Game]) -> Result<(), String> {
    let json = serde_json::to_string_pretty(games)
        .map_err(|error| format!("Failed to serialize games: {error}"))?;
    let temp_path = path.with_extension("tmp");
    std::fs::write(&temp_path, json)
        .map_err(|error| format!("Failed to write games file: {error}"))?;
    std::fs::rename(&temp_path, path)
        .map_err(|error| format!("Failed to finalize games file: {error}"))?;
    Ok(())
}

fn generate_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let timestamp_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    let random: u32 = rand_simple();
    format!("{timestamp_ms:016x}-{random:08x}")
}

fn rand_simple() -> u32 {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let now = std::time::Instant::now();
    let mut hasher = DefaultHasher::new();
    now.hash(&mut hasher);
    std::thread::current().id().hash(&mut hasher);
    hasher.finish() as u32
}

#[tauri::command]
#[specta::specta]
pub async fn list_games(app: AppHandle) -> Result<Vec<Game>, String> {
    let path = games_file(&app)?;
    Ok(read_games_from_disk(&path))
}

#[tauri::command]
#[specta::specta]
pub async fn save_game(app: AppHandle, game: Game) -> Result<Game, String> {
    validate_string_input(&game.title, 200, "Game title")?;
    validate_string_input(&game.id, 100, "Game ID")?;
    let path = games_file(&app)?;
    let mut games = read_games_from_disk(&path);

    let now = chrono_now_iso();
    let index = games.iter().position(|g| g.id == game.id);
    let mut saved = game;
    saved.updated_at = now;

    match index {
        Some(i) => games[i] = saved.clone(),
        None => {
            saved.created_at = saved.updated_at.clone();
            games.insert(0, saved.clone());
        }
    }

    write_games_atomic(&path, &games)?;
    log::info!("Saved game: {} ({})", saved.title, saved.id);
    Ok(saved)
}

#[tauri::command]
#[specta::specta]
pub async fn delete_game(app: AppHandle, game_id: String) -> Result<(), String> {
    validate_string_input(&game_id, 100, "Game ID")?;
    let path = games_file(&app)?;
    let mut games = read_games_from_disk(&path);
    let before = games.len();
    games.retain(|g| g.id != game_id);
    if games.len() == before {
        return Err(format!("Game not found: {game_id}"));
    }
    write_games_atomic(&path, &games)?;
    log::info!("Deleted game: {game_id}");
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn import_game(app: AppHandle, import: GameImport) -> Result<Game, String> {
    validate_string_input(&import.title, 200, "Game title")?;
    let path = games_file(&app)?;
    let mut games = read_games_from_disk(&path);

    let now = chrono_now_iso();
    let game = Game {
        id: generate_id(),
        title: import.title,
        import_source: import.import_source,
        install_path: import.install_path,
        artwork_path: import.artwork_path,
        tags: import.tags,
        notes: import.notes,
        profile_ids: import.profile_ids,
        extra_args: import.extra_args,
        created_at: now.clone(),
        updated_at: now,
    };

    games.insert(0, game.clone());
    write_games_atomic(&path, &games)?;
    log::info!("Imported game: {} ({})", game.title, game.id);
    Ok(game)
}

fn chrono_now_iso() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let days_since_epoch = secs / 86400;
    let time_of_day_secs = secs % 86400;
    let hours = time_of_day_secs / 3600;
    let minutes = (time_of_day_secs % 3600) / 60;
    let seconds = time_of_day_secs % 60;

    let (y, m, d) = days_to_date(days_since_epoch);
    format!("{y:04}-{m:02}-{d:02}T{hours:02}:{minutes:02}:{seconds:02}.000Z")
}

fn days_to_date(days_since_epoch: u64) -> (u64, u64, u64) {
    let mut y = 1970;
    let mut remaining = days_since_epoch;

    loop {
        let year_len = if is_leap(y) { 366 } else { 365 };
        if remaining < year_len {
            break;
        }
        remaining -= year_len;
        y += 1;
    }

    let leap = is_leap(y);
    let month_days = [
        31,
        if leap { 29 } else { 28 },
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31,
    ];

    let mut m = 0;
    for &md in &month_days {
        if remaining < md {
            break;
        }
        remaining -= md;
        m += 1;
    }

    (y, m + 1, remaining + 1)
}

fn is_leap(y: u64) -> bool {
    (y % 4 == 0 && y % 100 != 0) || y % 400 == 0
}
