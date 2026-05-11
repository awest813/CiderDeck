// SPDX-License-Identifier: GPL-3.0-or-later

//! Profile launcher and log persistence commands.
//!
//! All process invocation goes through `std::process::Command` with a structured
//! argument vector. The frontend must pass `program` and `args` separately —
//! we never accept a single shell string and never invoke a shell.
//!
//! Logs are persisted as JSON arrays per profile under
//! `<app_data_dir>/logs/<profile_id>.json`.

use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::Command;
use tauri::{AppHandle, Manager};

use crate::types::FILENAME_PATTERN;

/// Result of running a launched/external process.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProcessOutcome {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
}

/// Stored log entry (mirrors the TypeScript `ProfileLogEntry`).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProfileLogEntry {
    pub id: String,
    #[serde(rename = "profileId")]
    pub profile_id: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    pub command: String,
    pub stdout: String,
    pub stderr: String,
    #[serde(rename = "exitCode")]
    pub exit_code: Option<i32>,
}

fn validate_profile_id(profile_id: &str) -> Result<(), String> {
    if profile_id.is_empty() || profile_id.chars().count() > 100 {
        return Err("Invalid profile id length.".to_string());
    }
    if !FILENAME_PATTERN.is_match(profile_id) {
        return Err("Profile id contains invalid characters.".to_string());
    }
    Ok(())
}

fn logs_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Failed to get app data directory: {error}"))?
        .join("logs");
    std::fs::create_dir_all(&dir)
        .map_err(|error| format!("Failed to create logs directory: {error}"))?;
    Ok(dir)
}

fn run_command(
    program: &str,
    args: &[String],
    env_vars: Option<&HashMap<String, String>>,
    working_dir: Option<&str>,
) -> Result<ProcessOutcome, String> {
    if program.trim().is_empty() {
        return Err("Program path cannot be empty.".to_string());
    }

    let mut command = Command::new(program);
    command.args(args);

    if let Some(dir) = working_dir {
        if !dir.is_empty() {
            command.current_dir(dir);
        }
    }

    if let Some(vars) = env_vars {
        for (key, value) in vars {
            command.env(key, value);
        }
    }

    let output = command
        .output()
        .map_err(|error| format!("Failed to spawn process: {error}"))?;

    Ok(ProcessOutcome {
        stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
        stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
        exit_code: output.status.code(),
    })
}

/// Launch a profile's executable with structured arguments.
/// The frontend is responsible for translating profile data into a safe
/// (program, args) pair — this command never invokes a shell.
#[tauri::command]
#[specta::specta]
pub async fn launch_profile_executable(
    executable_path: String,
    args: Option<Vec<String>>,
    env_vars: Option<HashMap<String, String>>,
    working_dir: Option<String>,
) -> Result<ProcessOutcome, String> {
    log::info!("Launching profile executable: {executable_path}");
    run_command(
        &executable_path,
        &args.unwrap_or_default(),
        env_vars.as_ref(),
        working_dir.as_deref(),
    )
}

/// Run a build step (e.g. `cmake --build`) for recompilation projects.
/// `working_dir` is required to keep build artifacts scoped to the project.
#[tauri::command]
#[specta::specta]
pub async fn run_build_step(
    working_dir: String,
    program: String,
    args: Vec<String>,
    env_vars: Option<HashMap<String, String>>,
) -> Result<ProcessOutcome, String> {
    if working_dir.trim().is_empty() {
        return Err("working_dir is required for build steps.".to_string());
    }
    log::info!("Running build step in {working_dir}: {program}");
    run_command(&program, &args, env_vars.as_ref(), Some(&working_dir))
}

/// Append a log entry for a profile, persisted as JSON.
#[tauri::command]
#[specta::specta]
pub async fn save_log(
    app: AppHandle,
    profile_id: String,
    entry: ProfileLogEntry,
) -> Result<(), String> {
    validate_profile_id(&profile_id)?;
    let dir = logs_dir(&app)?;
    let file_path = dir.join(format!("{profile_id}.json"));

    let mut existing: Vec<ProfileLogEntry> = if file_path.exists() {
        let contents = std::fs::read_to_string(&file_path)
            .map_err(|error| format!("Failed to read existing log file: {error}"))?;
        serde_json::from_str(&contents).unwrap_or_default()
    } else {
        Vec::new()
    };

    existing.insert(0, entry);

    // Cap stored history at 200 entries to bound disk usage.
    if existing.len() > 200 {
        existing.truncate(200);
    }

    let json_content = serde_json::to_string_pretty(&existing)
        .map_err(|error| format!("Failed to serialize logs: {error}"))?;

    let temp_path = file_path.with_extension("tmp");
    std::fs::write(&temp_path, json_content)
        .map_err(|error| format!("Failed to write log file: {error}"))?;
    std::fs::rename(&temp_path, &file_path)
        .map_err(|error| format!("Failed to finalize log file: {error}"))?;

    Ok(())
}

/// Read all stored logs for a profile, newest first.
#[tauri::command]
#[specta::specta]
pub async fn read_logs(app: AppHandle, profile_id: String) -> Result<Vec<ProfileLogEntry>, String> {
    validate_profile_id(&profile_id)?;
    let dir = logs_dir(&app)?;
    let file_path = dir.join(format!("{profile_id}.json"));

    if !file_path.exists() {
        return Ok(Vec::new());
    }

    let contents = std::fs::read_to_string(&file_path)
        .map_err(|error| format!("Failed to read log file: {error}"))?;
    let entries: Vec<ProfileLogEntry> = serde_json::from_str(&contents)
        .map_err(|error| format!("Failed to parse logs: {error}"))?;
    Ok(entries)
}
