// SPDX-License-Identifier: GPL-3.0-or-later

//! Bottle / prefix detection and management for compatibility backends.
//!
//! Scans the filesystem for existing Wine prefixes, Whisky bottles,
//! CrossOver bottles, and GPTK prefixes. Provides commands for
//! detecting, inspecting, creating, cloning, repairing, resetting,
//! exporting, importing, and deleting bottles.

use serde::{Deserialize, Serialize};
use specta::Type;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

/// Sidecar filename stored inside each bottle directory.
const SIDECAR_FILE: &str = ".ciderdeck-meta.json";

// ============================================================================
// Sidecar Metadata
// ============================================================================

/// Per-bottle metadata stored in a sidecar file inside the bottle directory.
/// Survives detection scans and persists user notes and compatibility info.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
struct BottleSidecar {
    notes: Option<String>,
}

fn read_bottle_sidecar(bottle_path: &Path) -> BottleSidecar {
    let meta_path = bottle_path.join(SIDECAR_FILE);
    fs::read_to_string(&meta_path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn write_bottle_sidecar(bottle_path: &Path, sidecar: &BottleSidecar) -> Result<(), String> {
    let meta_path = bottle_path.join(SIDECAR_FILE);
    let json = serde_json::to_string_pretty(sidecar)
        .map_err(|e| format!("Failed to serialize bottle metadata: {e}"))?;
    fs::write(&meta_path, json).map_err(|e| format!("Failed to write bottle metadata: {e}"))?;
    Ok(())
}

// ============================================================================
// Data Types
// ============================================================================

/// Health status of a bottle / prefix.
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub enum BottleHealth {
    Good,
    Warning,
    Broken,
}

/// Info about a game detected inside a bottle / prefix.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct DetectedGame {
    pub name: String,
    pub exe_path: String,
    pub bottle_id: String,
    pub bottle_name: String,
    pub bottle_path: String,
    pub publisher: Option<String>,
    pub version: Option<String>,
}

/// Info about a detected or managed bottle / prefix.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Bottle {
    /// Unique identifier (generated)
    pub id: String,
    /// Display name (derived from directory name)
    pub name: String,
    /// Which runtime this bottle belongs to ("wine", "whisky", "crossover", "gptk")
    pub runtime: String,
    /// Filesystem path to the bottle
    pub path: String,
    /// Runtime version (e.g., "wine-9.0")
    pub runtime_version: Option<String>,
    /// Architecture ("win32" or "win64")
    pub architecture: Option<String>,
    /// Windows version configured in the prefix (e.g., "win10", "win7")
    pub windows_version: Option<String>,
    /// Notable installed components (e.g., "dotnet48", "vcrun2022")
    pub installed_components: Vec<String>,
    /// Storage size in bytes, if calculable
    pub storage_bytes: Option<u64>,
    /// User-editable notes
    pub notes: Option<String>,
    /// Health assessment
    pub health: BottleHealth,
}

// ============================================================================
// Filesystem Helpers
// ============================================================================

fn home_dir() -> Option<PathBuf> {
    #[cfg(target_os = "macos")]
    {
        std::env::var("HOME").ok().map(PathBuf::from)
    }
    #[cfg(not(target_os = "macos"))]
    {
        dirs_next_home()
    }
}

#[cfg(not(target_os = "macos"))]
fn dirs_next_home() -> Option<PathBuf> {
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .ok()
        .map(PathBuf::from)
}

fn dir_size(path: &Path) -> Option<u64> {
    let mut total: u64 = 0;

    fn walk(dir: &Path, total: &mut u64) {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    if let Ok(meta) = entry.metadata() {
                        *total += meta.len();
                    }
                } else if path.is_dir() {
                    // Skip symlink cycles
                    if path.read_link().is_ok() {
                        continue;
                    }
                    walk(&path, total);
                }
            }
        }
    }

    if !path.is_dir() {
        return None;
    }
    walk(path, &mut total);
    Some(total)
}

fn dir_name(path: &Path) -> String {
    path.file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "Unknown".to_string())
}

fn is_valid_prefix(path: &Path) -> bool {
    path.is_dir()
        && (path.join("drive_c").is_dir() || path.join("dosdevices").is_dir())
        && path.join("system.reg").exists()
}

fn get_prefix_windows_version(path: &Path) -> Option<String> {
    let reg_path = path.join("system.reg");

    if !reg_path.exists() {
        return None;
    }

    let contents = fs::read_to_string(&reg_path).ok()?;

    for line in contents.lines() {
        if line.contains("ProductName") {
            let after_equals = line.split('=').nth(1)?.trim();
            let cleaned = after_equals.trim_matches('"');
            let short = match cleaned {
                "Microsoft Windows 10" => "win10".to_string(),
                "Microsoft Windows 11" => "win11".to_string(),
                "Microsoft Windows 8.1" => "win8.1".to_string(),
                "Microsoft Windows 8" => "win8".to_string(),
                "Microsoft Windows 7" => "win7".to_string(),
                "Microsoft Windows XP" => "winxp".to_string(),
                other => {
                    if other.contains("Windows 10") {
                        "win10".to_string()
                    } else if other.contains("Windows 11") {
                        "win11".to_string()
                    } else {
                        other.to_string()
                    }
                }
            };
            return Some(short);
        }
    }

    None
}

fn get_prefix_architecture(path: &Path) -> Option<String> {
    let reg_path = path.join("system.reg");

    if !reg_path.exists() {
        return None;
    }

    let contents = fs::read_to_string(&reg_path).ok()?;

    for line in contents.lines() {
        if line.contains("#arch=") {
            let arch = line.trim_start_matches("#arch=").trim();
            return Some(if arch == "win64" {
                "win64".to_string()
            } else {
                "win32".to_string()
            });
        }
    }

    // Check if drive_c/Program Files (x86) exists as a heuristic
    if path.join("drive_c").join("Program Files (x86)").is_dir() {
        return Some("win64".to_string());
    }

    None
}

fn get_installed_components(path: &Path) -> Vec<String> {
    let uninstall_key = path.join("drive_c").join("uninstall.reg");

    if !uninstall_key.exists() {
        return Vec::new();
    }

    let contents = match fs::read_to_string(&uninstall_key) {
        Ok(c) => c,
        Err(_) => return Vec::new(),
    };

    let mut components = Vec::new();
    let known: &[(&str, &str)] = &[
        ("dotnet", "dotnet"),
        ("vcrun", "vcrun"),
        ("corefonts", "corefonts"),
        ("mono", "wine-mono"),
        ("gecko", "wine-gecko"),
        ("dxvk", "dxvk"),
        ("vkd3d", "vkd3d"),
        ("d3d", "d3d"),
        ("msxml", "msxml"),
    ];

    for line in contents.lines() {
        for (pattern, label) in known {
            if line.to_lowercase().contains(pattern) && !components.contains(&label.to_string()) {
                components.push(label.to_string());
            }
        }
    }

    components
}

fn detect_wine_version(path: &Path, wine_bin: &str) -> Option<String> {
    let output = Command::new(wine_bin)
        .env("WINEPREFIX", path)
        .arg("--version")
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let version = stdout
        .lines()
        .next()?
        .split_whitespace()
        .find(|part| part.starts_with("wine-"))
        .or_else(|| stdout.lines().next())
        .map(|s| s.trim().to_string())?;

    Some(version)
}

// ============================================================================
// Wine Prefix Detection (macOS)
// ============================================================================

fn detect_wine_bottle(path: &Path, name: &str) -> Bottle {
    let valid = is_valid_prefix(path);
    let health = if valid {
        BottleHealth::Good
    } else if path.join("drive_c").is_dir() {
        BottleHealth::Warning
    } else {
        BottleHealth::Broken
    };

    let windows_version = if valid {
        get_prefix_windows_version(path)
    } else {
        None
    };
    let architecture = get_prefix_architecture(path);
    let components = get_installed_components(path);
    let storage = dir_size(path);

    let runtime_version = detect_wine_version(path, "wine");
    let sidecar = read_bottle_sidecar(path);

    let id = format!("wine-{}", name.replace(['/', '\\', ' '], "-"));

    Bottle {
        id,
        name: name.to_string(),
        runtime: "wine".to_string(),
        path: path.to_string_lossy().to_string(),
        runtime_version,
        architecture,
        windows_version,
        installed_components: components,
        storage_bytes: storage,
        notes: sidecar.notes,
        health,
    }
}

fn scan_wine_prefixes() -> Vec<Bottle> {
    log::debug!("Scanning for Wine prefixes");

    let mut bottles = Vec::new();
    let home = match home_dir() {
        Some(h) => h,
        None => return bottles,
    };

    let candidates = [
        home.join(".wine"),
        home.join(".wine32"),
        home.join(".wine64"),
        home.join("Wine Files"),
    ];

    for candidate in &candidates {
        if candidate.is_dir() {
            let name = dir_name(candidate);
            bottles.push(detect_wine_bottle(candidate, &name));
        }
    }

    // Scan custom Wine prefixes in a subdirectory if present
    let wine_prefixes_dir = home.join(".local").join("share").join("wineprefixes");
    if wine_prefixes_dir.is_dir() {
        if let Ok(entries) = fs::read_dir(&wine_prefixes_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    let name = dir_name(&path);
                    bottles.push(detect_wine_bottle(&path, &name));
                }
            }
        }
    }

    log::debug!("Found {} Wine prefixes", bottles.len());
    bottles
}

// ============================================================================
// Whisky Bottle Detection (macOS)
// ============================================================================

fn scan_whisky_bottles() -> Vec<Bottle> {
    let mut bottles = Vec::new();
    let home = match home_dir() {
        Some(h) => h,
        None => return bottles,
    };

    let whisky_bottles_dir = home
        .join("Library")
        .join("Containers")
        .join("com.isaacmarovitz.Whisky")
        .join("Bottles");

    if !whisky_bottles_dir.is_dir() {
        return bottles;
    }

    let whisky_wine = "/Applications/Whisky.app/Contents/MacOS/wine64";

    if let Ok(entries) = fs::read_dir(&whisky_bottles_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let valid = is_valid_prefix(&path);
                if !valid {
                    continue;
                }
                let name = dir_name(&path);
                let windows_version = get_prefix_windows_version(&path);
                let architecture = get_prefix_architecture(&path);
                let components = get_installed_components(&path);
                let storage = dir_size(&path);

                let runtime_version = if Path::new(whisky_wine).exists() {
                    detect_wine_version(&path, whisky_wine)
                } else {
                    None
                };

                let id = format!("whisky-{}", name.replace(['/', '\\', ' '], "-"));
                let sidecar = read_bottle_sidecar(&path);

                bottles.push(Bottle {
                    id,
                    name,
                    runtime: "whisky".to_string(),
                    path: path.to_string_lossy().to_string(),
                    runtime_version,
                    architecture,
                    windows_version,
                    installed_components: components,
                    storage_bytes: storage,
                    notes: sidecar.notes,
                    health: if valid {
                        BottleHealth::Good
                    } else {
                        BottleHealth::Warning
                    },
                });
            }
        }
    }

    bottles
}

// ============================================================================
// CrossOver Bottle Detection (macOS)
// ============================================================================

fn scan_crossover_bottles() -> Vec<Bottle> {
    let mut bottles = Vec::new();
    let home = match home_dir() {
        Some(h) => h,
        None => return bottles,
    };

    let cx_bottles_dir = home
        .join("Library")
        .join("Application Support")
        .join("CrossOver")
        .join("Bottles");

    if !cx_bottles_dir.is_dir() {
        return bottles;
    }

    let cx_wine = "/Applications/CrossOver.app/Contents/SharedSupport/CrossOver/bin/wine";

    if let Ok(entries) = fs::read_dir(&cx_bottles_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let valid = is_valid_prefix(&path);
                if !valid {
                    continue;
                }
                let name = dir_name(&path);
                let windows_version = get_prefix_windows_version(&path);
                let architecture = get_prefix_architecture(&path);
                let components = get_installed_components(&path);
                let storage = dir_size(&path);

                let runtime_version = if Path::new(cx_wine).exists() {
                    detect_wine_version(&path, cx_wine)
                } else {
                    None
                };

                let id = format!("crossover-{}", name.replace(['/', '\\', ' '], "-"));
                let sidecar = read_bottle_sidecar(&path);

                bottles.push(Bottle {
                    id,
                    name,
                    runtime: "crossover".to_string(),
                    path: path.to_string_lossy().to_string(),
                    runtime_version,
                    architecture,
                    windows_version,
                    installed_components: components,
                    storage_bytes: storage,
                    notes: sidecar.notes,
                    health: BottleHealth::Good,
                });
            }
        }
    }

    bottles
}

// ============================================================================
// GPTK Prefix Detection (macOS)
// ============================================================================

fn scan_gptk_bottles() -> Vec<Bottle> {
    let mut bottles = Vec::new();
    let home = match home_dir() {
        Some(h) => h,
        None => return bottles,
    };

    let candidates = [
        home.join("my-game-prefix"),
        home.join("gptk-prefix"),
        home.join(".wine-gptk"),
    ];

    for candidate in &candidates {
        if candidate.is_dir() {
            let valid = is_valid_prefix(candidate);
            if !valid {
                continue;
            }
            let name = dir_name(candidate);
            let windows_version = get_prefix_windows_version(candidate);
            let architecture = get_prefix_architecture(candidate);
            let components = get_installed_components(candidate);
            let storage = dir_size(candidate);

            let id = format!("gptk-{}", name.replace(['/', '\\', ' '], "-"));
            let sidecar = read_bottle_sidecar(candidate);

            bottles.push(Bottle {
                id,
                name,
                runtime: "gptk".to_string(),
                path: candidate.to_string_lossy().to_string(),
                runtime_version: None,
                architecture,
                windows_version,
                installed_components: components,
                storage_bytes: storage,
                notes: sidecar.notes,
                health: BottleHealth::Good,
            });
        }
    }

    bottles
}

// ============================================================================
// Game Detection from Bottles
// ============================================================================

const GAME_SKIP_PREFIXES: &[&str] = &[
    "unins000",
    "uninstaller",
    "uninstall",
    "revo_uninstaller",
    "gecko",
    "mono",
    "wine",
    "wineboot",
    "winecfg",
    "regedit",
    "msiexec",
    "notepad",
    "cmd",
    "control",
    "explorer",
    "taskmgr",
    "taskkill",
    "tasklist",
    "ipconfig",
    "ping",
    "hostname",
    "winver",
    "dxdiag",
    "dxsetup",
    "vcredist",
    "dotnetfx",
    "NDP",
    "dotnet",
    "vc_redist",
    "vcredist",
    "vcredist_x",
    "vcredist_x64",
    "vcredist_x86",
    "spinstaller",
    "crashhandler",
    "upc",
    "directx",
    "autoplay",
    "dplayx",
    "dpnsvr",
    "dpwsockx",
    "dplay",
    "dplaysvr",
    "dpmodemx",
];

fn looks_like_game(name: &str, exe_name: &str) -> bool {
    let lower = name.to_lowercase();
    let exe_lower = exe_name.to_lowercase();

    for skip in GAME_SKIP_PREFIXES {
        if lower.starts_with(skip) || exe_lower.starts_with(skip) {
            return false;
        }
    }

    if lower.contains("cider")
        || lower.contains("wrapper")
        || lower.contains("prefix")
        || lower.contains("system")
    {
        return false;
    }

    true
}

fn parse_uninstall_reg(path: &Path) -> Vec<(String, String, Option<String>, Option<String>)> {
    let contents = match fs::read_to_string(path) {
        Ok(c) => c,
        Err(_) => return Vec::new(),
    };

    let mut results = Vec::new();
    let mut current_key = String::new();
    let mut display_name: Option<String> = None;
    let mut uninstall_str: Option<String> = None;
    let mut publisher: Option<String> = None;
    let mut version: Option<String> = None;

    for line in contents.lines() {
        let line = line.trim();
        if line.starts_with('[') {
            if !current_key.is_empty() && display_name.is_some() {
                if let Some(exe) = uninstall_str.as_ref().and_then(|s| extract_exe_path(s)) {
                    let name = display_name.clone().unwrap_or_default();
                    let exe_name = std::path::Path::new(&exe)
                        .file_stem()
                        .map(|s| s.to_string_lossy().to_string())
                        .unwrap_or_default();

                    if looks_like_game(&name, &exe_name) {
                        results.push((name, exe, publisher.clone(), version.clone()));
                    }
                }
            }

            current_key = line.to_string();
            display_name = None;
            uninstall_str = None;
            publisher = None;
            version = None;
        } else if line.starts_with("\"DisplayName\"") {
            display_name = extract_reg_value(line);
        } else if line.starts_with("\"UninstallString\"")
            || line.starts_with("\"QuietUninstallString\"")
        {
            uninstall_str = extract_reg_value(line);
        } else if line.starts_with("\"DisplayPublisher\"") {
            publisher = extract_reg_value(line);
        } else if line.starts_with("\"DisplayVersion\"") {
            version = extract_reg_value(line);
        }
    }

    if !current_key.is_empty() && display_name.is_some() {
        if let Some(exe) = uninstall_str.as_ref().and_then(|s| extract_exe_path(s)) {
            let name = display_name.clone().unwrap_or_default();
            let exe_name = std::path::Path::new(&exe)
                .file_stem()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_default();

            if looks_like_game(&name, &exe_name) {
                results.push((name, exe, publisher.clone(), version.clone()));
            }
        }
    }

    results
}

fn extract_reg_value(line: &str) -> Option<String> {
    line.split_once('=')?
        .1
        .trim()
        .trim_matches('"')
        .trim()
        .trim_start_matches('"')
        .trim_end_matches('"')
        .to_string()
        .into()
}

fn extract_exe_path(uninstall_str: &str) -> Option<String> {
    let cleaned = uninstall_str.trim();
    if cleaned.ends_with(".exe") {
        return Some(cleaned.to_string());
    }
    let parts: Vec<&str> = cleaned.split_whitespace().collect();
    for part in parts {
        if part.to_lowercase().ends_with(".exe") {
            return Some(part.to_string());
        }
    }
    None
}

fn scan_program_files(
    base: &Path,
    bottle_id: &str,
    bottle_name: &str,
    bottle_path: &str,
    results: &mut Vec<DetectedGame>,
) {
    if !base.is_dir() {
        return;
    }

    let skip_names: std::collections::HashSet<_> = GAME_SKIP_PREFIXES
        .iter()
        .map(|s| s.to_lowercase())
        .collect();

    if let Ok(entries) = fs::read_dir(base) {
        for entry in entries.flatten() {
            let entry_path = entry.path();
            if entry_path.is_dir() {
                scan_program_files(&entry_path, bottle_id, bottle_name, bottle_path, results);
            } else if let Some(ext) = entry_path.extension() {
                if ext == "exe" {
                    let exe_name = entry_path
                        .file_stem()
                        .map(|s| s.to_string_lossy().to_string())
                        .unwrap_or_default();

                    if skip_names.contains(&exe_name.to_lowercase()) {
                        continue;
                    }

                    if looks_like_game(&exe_name, &exe_name) {
                        results.push(DetectedGame {
                            name: exe_name,
                            exe_path: entry_path.to_string_lossy().to_string(),
                            bottle_id: bottle_id.to_string(),
                            bottle_name: bottle_name.to_string(),
                            bottle_path: bottle_path.to_string(),
                            publisher: None,
                            version: None,
                        });
                    }
                }
            }
        }
    }
}

fn detect_games_in_bottle(bottle: &Bottle) -> Vec<DetectedGame> {
    let drive_c = Path::new(&bottle.path).join("drive_c");
    let mut games = Vec::new();

    let uninstall_path = drive_c.join("uninstall.reg");
    if uninstall_path.exists() {
        let entries = parse_uninstall_reg(&uninstall_path);
        for (name, exe_path, publisher, version) in entries {
            games.push(DetectedGame {
                name,
                exe_path,
                bottle_id: bottle.id.clone(),
                bottle_name: bottle.name.clone(),
                bottle_path: bottle.path.clone(),
                publisher,
                version,
            });
        }
    }

    let program_files = drive_c.join("Program Files");
    let program_files_x86 = drive_c.join("Program Files (x86)");
    scan_program_files(
        &program_files,
        &bottle.id,
        &bottle.name,
        &bottle.path,
        &mut games,
    );
    scan_program_files(
        &program_files_x86,
        &bottle.id,
        &bottle.name,
        &bottle.path,
        &mut games,
    );

    let mut seen = std::collections::HashSet::new();
    games.retain(|g| seen.insert(g.exe_path.to_lowercase()));
    games
}

/// Detect installed games inside a single bottle by path.
#[allow(dead_code)]
#[tauri::command]
#[specta::specta]
pub async fn detect_games_for_bottle(bottle_path: String) -> Result<Vec<DetectedGame>, String> {
    let bottle = get_bottle_meta(bottle_path).await?;
    Ok(detect_games_in_bottle(&bottle))
}

/// Detect all installed games from all detected bottles.
#[tauri::command]
#[specta::specta]
pub async fn detect_games_from_bottles() -> Vec<DetectedGame> {
    log::info!("Starting game detection from bottles");

    let bottles = detect_bottles().await;
    let mut all_games = Vec::new();

    for bottle in &bottles {
        let games = detect_games_in_bottle(bottle);
        all_games.extend(games);
    }

    log::info!(
        "Game detection complete: {} games found across {} bottles",
        all_games.len(),
        bottles.len()
    );
    all_games
}

// ============================================================================
// Tauri Commands
// ============================================================================

/// Detect all Wine/Whisky/CrossOver/GPTK bottles on the system.
#[tauri::command]
#[specta::specta]
pub async fn detect_bottles() -> Vec<Bottle> {
    log::info!("Starting bottle detection scan");

    let mut all = Vec::new();
    all.extend(scan_wine_prefixes());
    all.extend(scan_whisky_bottles());
    all.extend(scan_crossover_bottles());
    all.extend(scan_gptk_bottles());

    log::info!("Bottle detection complete: {} bottles found", all.len());
    all
}

/// Get detailed metadata for a specific bottle by path.
#[tauri::command]
#[specta::specta]
pub async fn get_bottle_meta(bottle_path: String) -> Result<Bottle, String> {
    log::debug!("Getting bottle metadata for: {bottle_path}");

    let path = Path::new(&bottle_path);
    if !path.is_dir() {
        return Err("Bottle path does not exist or is not a directory.".to_string());
    }

    let name = dir_name(path);
    let valid = is_valid_prefix(path);
    let health = if valid {
        BottleHealth::Good
    } else if path.join("drive_c").is_dir() {
        BottleHealth::Warning
    } else {
        BottleHealth::Broken
    };
    let windows_version = get_prefix_windows_version(path);
    let architecture = get_prefix_architecture(path);
    let components = get_installed_components(path);
    let storage = dir_size(path);

    let path_str = path.to_string_lossy();
    let runtime = if path_str.contains("Whisky") {
        "whisky"
    } else if path_str.contains("CrossOver") {
        "crossover"
    } else if path_str.contains("gptk") || path_str.contains("GPTK") {
        "gptk"
    } else {
        "wine"
    };

    let id = format!("{runtime}-{}", name.replace(['/', '\\', ' '], "-"));
    let sidecar = read_bottle_sidecar(path);

    Ok(Bottle {
        id,
        name,
        runtime: runtime.to_string(),
        path: bottle_path,
        runtime_version: None,
        architecture,
        windows_version,
        installed_components: components,
        storage_bytes: storage,
        notes: sidecar.notes,
        health,
    })
}

/// Create a new Wine prefix at the given path.
/// Runs `wineboot -i` to initialize the prefix.
#[tauri::command]
#[specta::specta]
pub async fn create_bottle(
    bottle_path: String,
    name: String,
    runtime: String,
) -> Result<Bottle, String> {
    log::info!("Creating {runtime} bottle at: {bottle_path}");

    let path_buf = PathBuf::from(&bottle_path);
    if path_buf.exists() {
        return Err("Bottle path already exists.".to_string());
    }

    if let Some(parent) = path_buf.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directory: {e}"))?;
    }

    let wine_bin = match runtime.as_str() {
        "whisky" => "/Applications/Whisky.app/Contents/MacOS/wine64",
        "crossover" => "/Applications/CrossOver.app/Contents/SharedSupport/CrossOver/bin/wine",
        _ => "wine",
    };

    let output = Command::new(wine_bin)
        .env("WINEPREFIX", bottle_path.as_str())
        .arg("wineboot")
        .arg("-i")
        .output()
        .map_err(|e| format!("Failed to initialize bottle: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Bottle creation failed: {stderr}"));
    }

    // Verify wineboot actually created the prefix structure
    if !is_valid_prefix(&path_buf) {
        return Err(
            "wineboot completed but prefix structure is incomplete (system.reg or drive_c missing)."
                .to_string(),
        );
    }

    let id = format!("{}-{}", runtime, name.replace(['/', '\\', ' '], "-"));

    log::info!("Bottle created successfully: {id} at {bottle_path}");

    Ok(Bottle {
        id,
        name,
        runtime,
        path: bottle_path,
        runtime_version: None,
        architecture: Some("win64".to_string()),
        windows_version: Some("win10".to_string()),
        installed_components: Vec::new(),
        storage_bytes: dir_size(&path_buf),
        notes: None,
        health: BottleHealth::Good,
    })
}

/// Delete a bottle's filesystem data. Returns the path that was removed.
#[tauri::command]
#[specta::specta]
pub async fn delete_bottle(bottle_path: String) -> Result<String, String> {
    log::info!("Deleting bottle at path: {bottle_path}");

    let path = Path::new(&bottle_path);

    // Canonicalize to resolve symlinks and path traversal components
    let canonical =
        fs::canonicalize(path).map_err(|_| "Bottle path does not exist.".to_string())?;

    if !canonical.is_dir() {
        return Err("Bottle path does not exist.".to_string());
    }

    // Safety: verify the path is a valid Wine prefix before deleting
    if !is_valid_prefix(&canonical) {
        return Err(
            "Path does not appear to be a valid Wine prefix. Refusing to delete.".to_string(),
        );
    }

    let removed_path = canonical.to_string_lossy().to_string();
    fs::remove_dir_all(&canonical).map_err(|e| format!("Failed to delete bottle: {e}"))?;

    log::info!("Bottle deleted: {removed_path}");
    Ok(removed_path)
}

// ============================================================================
// Clone / Repair / Reset / Export / Import / Notes
// ============================================================================

/// Recursively copy a directory tree from `src` to `dst`.
fn copy_dir_all(src: &Path, dst: &Path) -> Result<(), String> {
    fs::create_dir_all(dst).map_err(|e| format!("Failed to create directory: {e}"))?;
    for entry in fs::read_dir(src).map_err(|e| format!("Failed to read source directory: {e}"))? {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {e}"))?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if src_path.is_symlink() {
            // Re-create symlinks instead of following them to avoid infinite loops
            if let Ok(target) = fs::read_link(&src_path) {
                #[cfg(unix)]
                std::os::unix::fs::symlink(target, &dst_path)
                    .map_err(|e| format!("Failed to create symlink: {e}"))?;
                #[cfg(not(unix))]
                return Err("Symlinks are only supported on Unix".to_string());
            }
        } else if src_path.is_dir() {
            copy_dir_all(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path).map_err(|e| format!("Failed to copy file: {e}"))?;
        }
    }
    Ok(())
}

/// Return the wine binary path for a given runtime identifier.
fn wine_bin_for_runtime(runtime: &str) -> &'static str {
    match runtime {
        "whisky" => "/Applications/Whisky.app/Contents/MacOS/wine64",
        "crossover" => "/Applications/CrossOver.app/Contents/SharedSupport/CrossOver/bin/wine",
        _ => "wine",
    }
}

/// Clone an existing bottle to a new location.
/// Preserves all files including the CiderDeck sidecar.
#[tauri::command]
#[specta::specta]
pub async fn clone_bottle(
    source_path: String,
    dest_path: String,
    name: String,
) -> Result<Bottle, String> {
    log::info!("Cloning bottle from {source_path} to {dest_path}");

    let src = Path::new(&source_path);
    let dst = PathBuf::from(&dest_path);

    let canonical_src =
        fs::canonicalize(src).map_err(|_| "Source bottle path does not exist.".to_string())?;

    if !is_valid_prefix(&canonical_src) {
        return Err("Source path does not appear to be a valid Wine prefix.".to_string());
    }

    if dst.exists() {
        return Err("Destination path already exists.".to_string());
    }

    copy_dir_all(&canonical_src, &dst)?;

    // Detect metadata from the clone
    let valid = is_valid_prefix(&dst);
    let health = if valid {
        BottleHealth::Good
    } else if dst.join("drive_c").is_dir() {
        BottleHealth::Warning
    } else {
        BottleHealth::Broken
    };

    let path_str = canonical_src.to_string_lossy();
    let runtime = if path_str.contains("Whisky") {
        "whisky"
    } else if path_str.contains("CrossOver") {
        "crossover"
    } else if path_str.contains("gptk") || path_str.contains("GPTK") {
        "gptk"
    } else {
        "wine"
    };

    let id = format!("{runtime}-{}", name.replace(['/', '\\', ' '], "-"));
    let sidecar = read_bottle_sidecar(&dst);

    log::info!("Bottle cloned successfully: {id} at {dest_path}");

    Ok(Bottle {
        id,
        name,
        runtime: runtime.to_string(),
        path: dest_path,
        runtime_version: None,
        architecture: get_prefix_architecture(&dst),
        windows_version: get_prefix_windows_version(&dst),
        installed_components: get_installed_components(&dst),
        storage_bytes: dir_size(&dst),
        notes: sidecar.notes,
        health,
    })
}

/// Repair a bottle by running `wineboot --update`.
/// This re-initializes Wine internals without destroying user data.
#[tauri::command]
#[specta::specta]
pub async fn repair_bottle(bottle_path: String, runtime: String) -> Result<(), String> {
    log::info!("Repairing {runtime} bottle at: {bottle_path}");

    let path = Path::new(&bottle_path);
    if !path.is_dir() {
        return Err("Bottle path does not exist.".to_string());
    }

    let wine_bin = wine_bin_for_runtime(&runtime);

    let output = Command::new(wine_bin)
        .env("WINEPREFIX", &bottle_path)
        .arg("wineboot")
        .arg("--update")
        .output()
        .map_err(|e| format!("Failed to run wineboot: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Repair failed: {stderr}"));
    }

    log::info!("Bottle repaired successfully: {bottle_path}");
    Ok(())
}

/// Reset a bottle back to a clean state.
/// Removes the Windows filesystem and registry, then reinitializes.
/// The CiderDeck sidecar (notes) is preserved across the reset.
#[tauri::command]
#[specta::specta]
pub async fn reset_bottle(
    bottle_path: String,
    name: String,
    runtime: String,
) -> Result<Bottle, String> {
    log::info!("Resetting {runtime} bottle at: {bottle_path}");

    let path = PathBuf::from(&bottle_path);
    if !path.is_dir() {
        return Err("Bottle path does not exist.".to_string());
    }

    let canonical =
        fs::canonicalize(&path).map_err(|_| "Failed to resolve bottle path.".to_string())?;

    if !is_valid_prefix(&canonical) {
        return Err("Path does not appear to be a valid Wine prefix.".to_string());
    }

    // Preserve notes before wipe
    let sidecar = read_bottle_sidecar(&canonical);

    // Remove the core prefix directories and registry files
    let items_to_remove = [
        canonical.join("drive_c"),
        canonical.join("system.reg"),
        canonical.join("user.reg"),
        canonical.join("userdef.reg"),
        canonical.join(".update-timestamp"),
    ];

    for item in &items_to_remove {
        if item.is_dir() {
            fs::remove_dir_all(item).map_err(|e| format!("Failed to remove {item:?}: {e}"))?;
        } else if item.exists() {
            fs::remove_file(item).map_err(|e| format!("Failed to remove {item:?}: {e}"))?;
        }
    }

    // Reinitialize the prefix
    let wine_bin = wine_bin_for_runtime(&runtime);

    let output = Command::new(wine_bin)
        .env("WINEPREFIX", &bottle_path)
        .arg("wineboot")
        .arg("-i")
        .output()
        .map_err(|e| format!("Failed to run wineboot: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Reset initialization failed: {stderr}"));
    }

    if !is_valid_prefix(&canonical) {
        return Err("Reset completed but prefix structure is incomplete.".to_string());
    }

    // Restore preserved notes
    write_bottle_sidecar(&canonical, &sidecar)?;

    let id = format!("{runtime}-{}", name.replace(['/', '\\', ' '], "-"));

    log::info!("Bottle reset successfully: {id}");

    Ok(Bottle {
        id,
        name,
        runtime,
        path: bottle_path,
        runtime_version: None,
        architecture: Some("win64".to_string()),
        windows_version: Some("win10".to_string()),
        installed_components: Vec::new(),
        storage_bytes: dir_size(&canonical),
        notes: sidecar.notes,
        health: BottleHealth::Good,
    })
}

/// Export a bottle as a compressed tar archive (.tar.gz).
/// Returns the path of the created archive.
#[tauri::command]
#[specta::specta]
pub async fn export_bottle(bottle_path: String, archive_path: String) -> Result<String, String> {
    log::info!("Exporting bottle at {bottle_path} to {archive_path}");

    let src = Path::new(&bottle_path);
    if !src.is_dir() {
        return Err("Bottle path does not exist.".to_string());
    }

    let canonical =
        fs::canonicalize(src).map_err(|_| "Failed to resolve bottle path.".to_string())?;

    if !is_valid_prefix(&canonical) {
        return Err("Path does not appear to be a valid Wine prefix.".to_string());
    }

    let bottle_dir = canonical
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .ok_or_else(|| "Failed to determine bottle directory name.".to_string())?;

    let parent_dir = canonical
        .parent()
        .ok_or_else(|| "Failed to determine parent directory.".to_string())?;

    let output = Command::new("tar")
        .args([
            "-czf",
            &archive_path,
            "-C",
            &parent_dir.to_string_lossy(),
            &bottle_dir,
        ])
        .output()
        .map_err(|e| format!("Failed to run tar: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Export failed: {stderr}"));
    }

    log::info!("Bottle exported successfully to: {archive_path}");
    Ok(archive_path)
}

/// Import a bottle from a compressed tar archive (.tar.gz).
/// Extracts the archive to `dest_path` and validates the result.
#[tauri::command]
#[specta::specta]
pub async fn import_bottle(
    archive_path: String,
    dest_path: String,
    name: String,
) -> Result<Bottle, String> {
    log::info!("Importing bottle from {archive_path} to {dest_path}");

    let archive = Path::new(&archive_path);
    if !archive.exists() {
        return Err("Archive file does not exist.".to_string());
    }

    let dest = PathBuf::from(&dest_path);
    if dest.exists() {
        return Err("Destination path already exists.".to_string());
    }

    fs::create_dir_all(&dest)
        .map_err(|e| format!("Failed to create destination directory: {e}"))?;

    let output = Command::new("tar")
        .args([
            "-xzf",
            &archive_path,
            "-C",
            &dest_path,
            "--strip-components=1",
        ])
        .output()
        .map_err(|e| format!("Failed to run tar: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        // Clean up on failure
        let _ = fs::remove_dir_all(&dest);
        return Err(format!("Import failed: {stderr}"));
    }

    if !is_valid_prefix(&dest) {
        let _ = fs::remove_dir_all(&dest);
        return Err(
            "Archive does not contain a valid Wine prefix (missing drive_c or system.reg)."
                .to_string(),
        );
    }

    let health = BottleHealth::Good;
    let sidecar = read_bottle_sidecar(&dest);

    let id = format!("wine-{}", name.replace(['/', '\\', ' '], "-"));

    log::info!("Bottle imported successfully: {id} at {dest_path}");

    Ok(Bottle {
        id,
        name,
        runtime: "wine".to_string(),
        path: dest_path,
        runtime_version: None,
        architecture: get_prefix_architecture(&dest),
        windows_version: get_prefix_windows_version(&dest),
        installed_components: get_installed_components(&dest),
        storage_bytes: dir_size(&dest),
        notes: sidecar.notes,
        health,
    })
}

/// Persist user-provided notes for a bottle.
/// Writes to a `.ciderdeck-meta.json` sidecar file inside the bottle directory.
#[tauri::command]
#[specta::specta]
pub async fn save_bottle_notes(bottle_path: String, notes: String) -> Result<(), String> {
    log::debug!("Saving notes for bottle at: {bottle_path}");

    let path = Path::new(&bottle_path);
    if !path.is_dir() {
        return Err("Bottle path does not exist.".to_string());
    }

    let sidecar = BottleSidecar {
        notes: if notes.trim().is_empty() {
            None
        } else {
            Some(notes)
        },
    };

    write_bottle_sidecar(path, &sidecar)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    // Helper: build a minimal valid Wine prefix in a temp dir
    fn make_fake_prefix(dir: &Path) {
        fs::create_dir_all(dir.join("drive_c")).unwrap();
        fs::write(dir.join("system.reg"), "").unwrap();
    }

    #[test]
    fn test_is_valid_prefix_no_dir() {
        assert!(!is_valid_prefix(Path::new("/nonexistent/path")));
    }

    #[test]
    fn test_dir_name() {
        assert_eq!(
            dir_name(Path::new("/Users/test/.wine")),
            ".wine".to_string()
        );
        assert_eq!(
            dir_name(Path::new("/Users/test/.wine/")),
            ".wine".to_string()
        );
    }

    #[test]
    fn test_detect_bottles_returns_vec() {
        let bottles = scan_wine_prefixes();
        // On a test machine without Wine, this should return empty vec (not panic)
        assert!(bottles.is_empty() || bottles.iter().all(|b| b.runtime == "wine"));
    }

    #[test]
    fn test_sidecar_roundtrip() {
        let tmp = TempDir::new().unwrap();
        let path = tmp.path();

        // Reading from a directory with no sidecar returns empty default
        let initial = read_bottle_sidecar(path);
        assert!(initial.notes.is_none());

        // Write notes
        let sidecar = BottleSidecar {
            notes: Some("test notes".to_string()),
        };
        write_bottle_sidecar(path, &sidecar).unwrap();

        // Read them back
        let loaded = read_bottle_sidecar(path);
        assert_eq!(loaded.notes.as_deref(), Some("test notes"));
    }

    #[test]
    fn test_copy_dir_all() {
        let tmp = TempDir::new().unwrap();
        let src = tmp.path().join("src");
        let dst = tmp.path().join("dst");
        make_fake_prefix(&src);

        copy_dir_all(&src, &dst).unwrap();

        assert!(dst.join("drive_c").is_dir());
        assert!(dst.join("system.reg").exists());
    }

    #[test]
    fn test_wine_bin_for_runtime() {
        assert_eq!(wine_bin_for_runtime("wine"), "wine");
        assert!(wine_bin_for_runtime("whisky").contains("Whisky"));
        assert!(wine_bin_for_runtime("crossover").contains("CrossOver"));
        assert_eq!(wine_bin_for_runtime("gptk"), "wine");
    }

    #[test]
    fn test_is_valid_prefix_requires_system_reg() {
        let tmp = TempDir::new().unwrap();
        // drive_c present but no system.reg → not valid
        fs::create_dir_all(tmp.path().join("drive_c")).unwrap();
        assert!(!is_valid_prefix(tmp.path()));

        // Add system.reg → valid
        fs::write(tmp.path().join("system.reg"), "").unwrap();
        assert!(is_valid_prefix(tmp.path()));
    }
}
