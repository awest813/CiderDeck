// SPDX-License-Identifier: GPL-3.0-or-later

//! Bottle / prefix detection and management for compatibility backends.
//!
//! Scans the filesystem for existing Wine prefixes, Whisky bottles,
//! CrossOver bottles, and GPTK prefixes. Provides commands for
//! detecting, inspecting, creating, and deleting bottles.

use serde::{Deserialize, Serialize};
use specta::Type;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

// ============================================================================
// Data Types
// ============================================================================

/// Health status of a bottle / prefix.
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub enum BottleHealth {
    /// No issues detected
    Good,
    /// Minor issues (e.g., missing common components)
    Warning,
    /// Bottle may be corrupted or missing critical files
    Broken,
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
        notes: None,
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
                    notes: None,
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
                    notes: None,
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
                notes: None,
                health: BottleHealth::Good,
            });
        }
    }

    bottles
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
        notes: None,
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
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

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
}
