// SPDX-License-Identifier: GPL-3.0-or-later

//! Profile persistence commands.
//!
//! Profiles are persisted as a JSON array at `<app_data_dir>/profiles.json`.
//! This replaces the previous localStorage-based storage.
//! Includes a one-time migration command for existing localStorage data.

use serde_json::Value;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

fn profiles_file(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Failed to get app data directory: {error}"))?;
    std::fs::create_dir_all(&dir)
        .map_err(|error| format!("Failed to create app data directory: {error}"))?;
    Ok(dir.join("profiles.json"))
}

fn read_profiles_from_disk(path: &PathBuf) -> Vec<Value> {
    if !path.exists() {
        return Vec::new();
    }
    let contents = match std::fs::read_to_string(path) {
        Ok(c) => c,
        Err(error) => {
            log::warn!("Failed to read profiles file: {error}");
            return Vec::new();
        }
    };
    match serde_json::from_str(&contents) {
        Ok(profiles) => profiles,
        Err(error) => {
            log::warn!("Failed to parse profiles file: {error}");
            Vec::new()
        }
    }
}

fn write_profiles_atomic(path: &PathBuf, profiles: &[Value]) -> Result<(), String> {
    let json = serde_json::to_string_pretty(profiles)
        .map_err(|error| format!("Failed to serialize profiles: {error}"))?;
    let temp_path = path.with_extension("tmp");
    std::fs::write(&temp_path, json)
        .map_err(|error| format!("Failed to write profiles file: {error}"))?;
    std::fs::rename(&temp_path, path)
        .map_err(|error| format!("Failed to finalize profiles file: {error}"))?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn list_profiles(app: AppHandle) -> Result<Vec<Value>, String> {
    let path = profiles_file(&app)?;
    Ok(read_profiles_from_disk(&path))
}

#[tauri::command]
#[specta::specta]
pub async fn save_profiles(app: AppHandle, profiles: Vec<Value>) -> Result<(), String> {
    if profiles.len() > 10_000 {
        return Err("Too many profiles (max 10,000)".to_string());
    }
    let path = profiles_file(&app)?;
    write_profiles_atomic(&path, &profiles)?;
    log::info!("Saved {} profiles", profiles.len());
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn migrate_from_local_storage(
    app: AppHandle,
    profiles_json: String,
) -> Result<u32, String> {
    if profiles_json.len() > 5_000_000 {
        return Err("Migration data too large (max 5MB)".to_string());
    }

    let parsed: Vec<Value> = serde_json::from_str(&profiles_json)
        .map_err(|error| format!("Invalid JSON from localStorage: {error}"))?;

    if parsed.is_empty() {
        return Ok(0);
    }

    let valid: Vec<Value> = filter_valid_profiles(parsed);

    if valid.is_empty() {
        log::warn!("Migration data contains no valid profiles");
        return Ok(0);
    }

    let count = valid.len() as u32;

    let path = profiles_file(&app)?;

    if path.exists() {
        let existing = read_profiles_from_disk(&path);
        if !existing.is_empty() {
            log::warn!(
                "Profiles file already exists with {} entries, skipping migration",
                existing.len()
            );
            return Ok(0);
        }
    }

    write_profiles_atomic(&path, &valid)?;
    log::info!("Migrated {count} profiles from localStorage");
    Ok(count)
}

fn filter_valid_profiles(parsed: Vec<Value>) -> Vec<Value> {
    parsed
        .into_iter()
        .filter(|v| {
            v.is_object()
                && v.get("id").is_some()
                && v.get("title").is_some()
                && v.get("helper").is_some()
                && v.get("category").is_some()
                && v.get("status").is_some()
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn filter_removes_invalid_profiles() {
        let parsed = vec![
            json!({ "id": "a", "title": "Game A", "helper": "wine", "category": "compatibility-layer", "status": "ready" }),
            json!({ "no_id": true }),
            json!({ "id": "b", "title": "Game B" }),
            json!({ "id": "c", "title": "Game C", "helper": "dosbox", "category": "dosbox", "status": "unconfigured" }),
            json!("not an object"),
        ];
        let valid = filter_valid_profiles(parsed);
        assert_eq!(valid.len(), 2);
        assert_eq!(valid[0]["id"], "a");
        assert_eq!(valid[1]["id"], "c");
    }

    #[test]
    fn filter_empty_returns_empty() {
        let valid = filter_valid_profiles(vec![]);
        assert!(valid.is_empty());
    }

    #[test]
    fn filter_all_invalid_returns_empty() {
        let parsed = vec![
            json!({"id": "x"}),
            json!({"title": "y"}),
            json!(null),
        ];
        let valid = filter_valid_profiles(parsed);
        assert!(valid.is_empty());
    }
}
