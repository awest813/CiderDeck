// SPDX-License-Identifier: GPL-3.0-or-later

//! Runtime detection for compatibility backends (Wine, Whisky, CrossOver, GPTK).
//!
//! Detects whether each compatibility backend is installed, its version,
//! and its executable path by probing the filesystem and running version
//! commands.

use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::Path;
use std::process::Command;

/// Info about a detected compatibility runtime.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RuntimeInfo {
    /// Unique identifier (e.g. "wine", "whisky", "crossover", "gptk")
    pub id: String,
    /// Human-readable name (e.g. "Wine", "Whisky")
    pub name: String,
    /// Whether the runtime was detected on this system
    pub available: bool,
    /// Version string, if detected
    pub version: Option<String>,
    /// Path to the detected executable, if any
    pub executable_path: Option<String>,
    /// Error message if detection failed unexpectedly
    pub error: Option<String>,
}

// ============================================================================
// Wine Detection
// ============================================================================

fn detect_wine() -> RuntimeInfo {
    log::debug!("Detecting Wine runtime");

    let candidates = [
        "wine",
        "wine64",
        "/opt/homebrew/bin/wine",
        "/usr/local/bin/wine",
    ];

    for candidate in &candidates {
        if let Some(info) = try_wine(candidate) {
            log::info!("Wine detected at {candidate}: {:?}", info.version);
            return info;
        }
    }

    log::debug!("Wine not found");
    RuntimeInfo {
        id: "wine".to_string(),
        name: "Wine".to_string(),
        available: false,
        version: None,
        executable_path: None,
        error: None,
    }
}

fn try_wine(program: &str) -> Option<RuntimeInfo> {
    let output = Command::new(program).arg("--version").output().ok()?;

    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let version = parse_wine_version(&stdout);

    Some(RuntimeInfo {
        id: "wine".to_string(),
        name: "Wine".to_string(),
        available: true,
        version,
        executable_path: Some(program.to_string()),
        error: None,
    })
}

fn parse_wine_version(output: &str) -> Option<String> {
    let line = output.lines().next()?;
    line.split_whitespace()
        .find(|part| part.starts_with("wine-"))
        .or_else(|| {
            line.split_whitespace()
                .find(|part| part.contains(|c: char| c.is_ascii_digit()))
        })
        .map(|s| s.trim().to_string())
}

// ============================================================================
// Whisky Detection
// ============================================================================

fn detect_whisky() -> RuntimeInfo {
    log::debug!("Detecting Whisky runtime");

    let whisky_app = "/Applications/Whisky.app";

    if !Path::new(whisky_app).exists() {
        log::debug!("Whisky.app not found at {whisky_app}");
        return RuntimeInfo {
            id: "whisky".to_string(),
            name: "Whisky".to_string(),
            available: false,
            version: None,
            executable_path: None,
            error: None,
        };
    }

    let version = get_app_bundle_version(whisky_app);

    let wine64_path = format!("{whisky_app}/Contents/MacOS/wine64");
    let wine_version = if Path::new(&wine64_path).exists() {
        Command::new(&wine64_path)
            .arg("--version")
            .output()
            .ok()
            .and_then(|o| {
                if o.status.success() {
                    parse_wine_version(&String::from_utf8_lossy(&o.stdout))
                } else {
                    None
                }
            })
    } else {
        None
    };

    log::info!("Whisky detected with version {:?}", version);
    RuntimeInfo {
        id: "whisky".to_string(),
        name: "Whisky".to_string(),
        available: true,
        version: version.or(wine_version),
        executable_path: Some(wine64_path),
        error: None,
    }
}

// ============================================================================
// CrossOver Detection
// ============================================================================

fn detect_crossover() -> RuntimeInfo {
    log::debug!("Detecting CrossOver runtime");

    let crossover_app = "/Applications/CrossOver.app";

    if !Path::new(crossover_app).exists() {
        log::debug!("CrossOver.app not found at {crossover_app}");
        return RuntimeInfo {
            id: "crossover".to_string(),
            name: "CrossOver".to_string(),
            available: false,
            version: None,
            executable_path: None,
            error: None,
        };
    }

    let version = get_app_bundle_version(crossover_app);

    let wine_path = "/Applications/CrossOver.app/Contents/SharedSupport/CrossOver/bin/wine";
    let wine_version = if Path::new(wine_path).exists() {
        Command::new(wine_path)
            .arg("--version")
            .output()
            .ok()
            .and_then(|o| {
                if o.status.success() {
                    parse_wine_version(&String::from_utf8_lossy(&o.stdout))
                } else {
                    None
                }
            })
    } else {
        None
    };

    log::info!("CrossOver detected with version {:?}", version);
    RuntimeInfo {
        id: "crossover".to_string(),
        name: "CrossOver".to_string(),
        available: true,
        version: version.or(wine_version),
        executable_path: Some(wine_path.to_string()),
        error: None,
    }
}

// ============================================================================
// Apple Game Porting Toolkit (GPTK) Detection
// ============================================================================

fn detect_gptk() -> RuntimeInfo {
    log::debug!("Detecting Apple Game Porting Toolkit");

    let candidates = [
        "gameportingtoolkit",
        "/usr/local/bin/gameportingtoolkit",
        "/opt/homebrew/bin/gameportingtoolkit",
    ];

    for candidate in &candidates {
        if let Some(info) = try_gptk(candidate) {
            log::info!("GPTK detected at {candidate}");
            return info;
        }
    }

    log::debug!("GPTK not found");
    RuntimeInfo {
        id: "gptk".to_string(),
        name: "Apple Game Porting Toolkit".to_string(),
        available: false,
        version: None,
        executable_path: None,
        error: None,
    }
}

fn try_gptk(program: &str) -> Option<RuntimeInfo> {
    let output = Command::new(program).arg("--version").output().ok()?;

    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let version = stdout
        .lines()
        .next()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    Some(RuntimeInfo {
        id: "gptk".to_string(),
        name: "Apple Game Porting Toolkit".to_string(),
        available: true,
        version,
        executable_path: Some(program.to_string()),
        error: None,
    })
}

// ============================================================================
// Helpers
// ============================================================================

fn get_app_bundle_version(app_path: &str) -> Option<String> {
    Command::new("defaults")
        .args(["read", app_path, "CFBundleShortVersionString"])
        .output()
        .ok()
        .and_then(|o| {
            if o.status.success() {
                let s = String::from_utf8_lossy(&o.stdout).trim().to_string();
                if s.is_empty() {
                    None
                } else {
                    Some(s)
                }
            } else {
                None
            }
        })
}

// ============================================================================
// Aggregated Detection
// ============================================================================

/// Detect all known compatibility runtimes and return their info.
pub fn detect_all_runtimes() -> Vec<RuntimeInfo> {
    vec![
        detect_wine(),
        detect_whisky(),
        detect_crossover(),
        detect_gptk(),
    ]
}

/// Tauri command: detect all installed compatibility runtimes.
#[tauri::command]
#[specta::specta]
pub async fn detect_runtimes() -> Vec<RuntimeInfo> {
    detect_all_runtimes()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_wine_version_wine_prefix() {
        let version = parse_wine_version("wine-9.0\n");
        assert_eq!(version, Some("wine-9.0".to_string()));
    }

    #[test]
    fn test_parse_wine_version_with_staging() {
        let version = parse_wine_version("wine-9.0 (Staging)\n");
        assert_eq!(version, Some("wine-9.0".to_string()));
    }

    #[test]
    fn test_parse_wine_version_no_match() {
        let version = parse_wine_version("unexpected output\n");
        assert_eq!(version, None);
    }

    #[test]
    fn test_parse_wine_version_with_digit_fallback() {
        let version = parse_wine_version("Wine 9.0\n");
        assert_eq!(version, Some("9.0".to_string()));
    }

    #[test]
    fn test_detect_all_runtimes_returns_all_four() {
        let runtimes = detect_all_runtimes();
        assert_eq!(runtimes.len(), 4);

        let ids: Vec<&str> = runtimes.iter().map(|r| r.id.as_str()).collect();
        assert!(ids.contains(&"wine"));
        assert!(ids.contains(&"whisky"));
        assert!(ids.contains(&"crossover"));
        assert!(ids.contains(&"gptk"));
    }

    #[test]
    fn test_runtime_info_defaults_on_not_found() {
        let runtimes = detect_all_runtimes();
        for info in &runtimes {
            assert!(info.error.is_none(), "Unexpected error for {}", info.id);
            assert!(!info.id.is_empty());
            assert!(!info.name.is_empty());
        }
    }
}
