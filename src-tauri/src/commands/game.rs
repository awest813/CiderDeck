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
