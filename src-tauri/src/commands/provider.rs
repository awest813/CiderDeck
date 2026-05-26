// SPDX-License-Identifier: GPL-3.0-or-later

//! Tauri commands that expose the RuntimeProvider abstraction to the frontend.
//!
//! These commands let the frontend validate a provider config and build a
//! structured launch command without the overhead of opening a native file
//! dialog or spawning the actual process.

use crate::runtime_provider::{LaunchCommand, ProviderConfig, ProviderValidation};

/// Build a structured launch command for the given provider without executing it.
///
/// The frontend can use this to preview and validate a launch command before
/// calling `launch_profile_executable`.
///
/// Returns `Err` if `provider_id` is not recognised or the config is
/// insufficient to produce a valid command.
#[tauri::command]
#[specta::specta]
pub async fn build_runtime_launch_command(
    provider_id: String,
    config: ProviderConfig,
) -> Result<LaunchCommand, String> {
    let provider = crate::runtime_provider::get_provider(&provider_id)
        .ok_or_else(|| format!("Unknown provider: {provider_id}"))?;

    log::debug!(
        "Building launch command for provider '{}' with target '{:?}'",
        provider_id,
        config.target_executable
    );

    provider.build_launch_command(&config)
}

/// Validate a provider config without building a command or launching anything.
///
/// Returns the full validation result including all errors so the UI can
/// surface them before the user attempts to launch.
#[tauri::command]
#[specta::specta]
pub async fn validate_runtime_config(
    provider_id: String,
    config: ProviderConfig,
) -> Result<ProviderValidation, String> {
    let provider = crate::runtime_provider::get_provider(&provider_id)
        .ok_or_else(|| format!("Unknown provider: {provider_id}"))?;

    log::debug!("Validating config for provider '{provider_id}'");
    Ok(provider.validate(&config))
}
