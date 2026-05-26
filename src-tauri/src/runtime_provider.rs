// SPDX-License-Identifier: GPL-3.0-or-later

//! RuntimeProvider abstraction for Wine-like compatibility tools.
//!
//! Each provider encapsulates detection, validation, executable resolution,
//! bottle/prefix/container path resolution, environment variable composition,
//! launch-argument assembly, and structured launch-command construction.
//!
//! **No shell strings are ever built.** Every launch command is expressed as
//! a `LaunchCommand { program, args, env }` triple that maps directly to
//! `std::process::Command::new(program).args(args).envs(env)`.

use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;

use crate::commands::runtime::RuntimeInfo;

// ============================================================================
// Shared types
// ============================================================================

/// Input configuration passed to a provider when building a launch command.
///
/// All fields are optional so the same struct can represent a fully configured
/// profile, a partially filled form, or a pure validation probe.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ProviderConfig {
    /// Path to the Windows executable that will be run inside the runtime
    /// (e.g. `C:\Game\game.exe` as seen on the Wine virtual filesystem, or
    /// the host-side path accepted by the runtime).
    pub target_executable: Option<String>,
    /// Path to the bottle / Wine prefix / CrossOver bottle name / GPTK prefix
    pub container_path: Option<String>,
    /// Override for the Wine-like binary (None → provider default)
    pub runtime_executable: Option<String>,
    /// Extra environment variables merged on top of provider defaults
    #[serde(default)]
    pub env_vars: HashMap<String, String>,
    /// Extra CLI arguments appended after provider-generated arguments
    #[serde(default)]
    pub launch_args: Vec<String>,
}

/// A fully resolved launch command: program + args + env.
///
/// Never contains a shell string. Pass directly to
/// `std::process::Command::new(program).args(args).envs(env)`.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct LaunchCommand {
    /// The executable to invoke
    pub program: String,
    /// Ordered argument list (no shell escaping needed)
    pub args: Vec<String>,
    /// Environment variable overrides for the child process
    pub env: HashMap<String, String>,
}

/// Structured validation outcome from a provider.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProviderValidation {
    /// True if the config is complete and ready to launch
    pub valid: bool,
    /// Human-readable error messages; empty when `valid` is true
    pub errors: Vec<String>,
}

// ============================================================================
// RuntimeProvider trait
// ============================================================================

/// Unified abstraction for a Wine-like compatibility runtime.
///
/// Implementors must be `Send + Sync` so they can be used across thread
/// boundaries in async Tauri commands.
pub trait RuntimeProvider: Send + Sync {
    /// Stable machine identifier (e.g. `"wine"`, `"crossover"`)
    fn id(&self) -> &str;

    /// Human-readable display name (e.g. `"Wine"`, `"CrossOver"`)
    fn name(&self) -> &str;

    /// Probe the host system and return detection info.
    ///
    /// Runs external processes (`wine --version`, `defaults read …`) to
    /// determine availability and version. May be slow; call only when needed.
    fn detect(&self) -> RuntimeInfo;

    /// Validate `config` without launching anything.
    ///
    /// Returns all errors found so the UI can surface them before the user
    /// attempts to launch.
    fn validate(&self, config: &ProviderConfig) -> ProviderValidation;

    /// Resolve the runtime executable path for `config`.
    ///
    /// Returns the provider-specific default when
    /// `config.runtime_executable` is not set.
    fn executable_path(&self, config: &ProviderConfig) -> Option<String>;

    /// Resolve the container / bottle / prefix path from `config`.
    fn container_path(&self, config: &ProviderConfig) -> Option<String>;

    /// Compute the complete set of environment variables for `config`.
    ///
    /// Provider defaults (e.g. `WINEPREFIX`) are merged with
    /// `config.env_vars`; the user's explicit vars take precedence.
    fn env_vars(&self, config: &ProviderConfig) -> HashMap<String, String>;

    /// Build the full ordered argument list for `config`.
    ///
    /// Includes provider-specific flags (e.g. `--bottle <name>` for
    /// CrossOver) followed by the target executable and any
    /// `config.launch_args`.
    fn launch_args(&self, config: &ProviderConfig) -> Vec<String>;

    /// Build the complete structured launch command.
    ///
    /// Returns `Err` if the config is not valid enough to produce a command
    /// (e.g. missing required executable path).  Callers should call
    /// [`validate`](Self::validate) first if they want structured error
    /// messages.
    fn build_launch_command(&self, config: &ProviderConfig) -> Result<LaunchCommand, String>;
}

// ============================================================================
// Wine provider
// ============================================================================

pub struct WineProvider;

impl RuntimeProvider for WineProvider {
    fn id(&self) -> &str {
        "wine"
    }

    fn name(&self) -> &str {
        "Wine"
    }

    fn detect(&self) -> RuntimeInfo {
        crate::commands::runtime::detect_wine_pub()
    }

    fn validate(&self, config: &ProviderConfig) -> ProviderValidation {
        let mut errors = Vec::new();
        if config
            .target_executable
            .as_deref()
            .map_or(true, str::is_empty)
        {
            errors.push("Target executable is required.".to_string());
        }
        ProviderValidation {
            valid: errors.is_empty(),
            errors,
        }
    }

    fn executable_path(&self, config: &ProviderConfig) -> Option<String> {
        Some(
            config
                .runtime_executable
                .clone()
                .filter(|s| !s.is_empty())
                .unwrap_or_else(|| "wine".to_string()),
        )
    }

    fn container_path(&self, config: &ProviderConfig) -> Option<String> {
        config.container_path.clone().filter(|s| !s.is_empty())
    }

    fn env_vars(&self, config: &ProviderConfig) -> HashMap<String, String> {
        let mut env = config.env_vars.clone();
        if let Some(prefix) = self.container_path(config) {
            env.entry("WINEPREFIX".to_string()).or_insert(prefix);
        }
        env
    }

    fn launch_args(&self, config: &ProviderConfig) -> Vec<String> {
        let mut args = Vec::new();
        if let Some(exe) = config.target_executable.as_deref().filter(|s| !s.is_empty()) {
            args.push(exe.to_string());
        }
        args.extend(config.launch_args.clone());
        args
    }

    fn build_launch_command(&self, config: &ProviderConfig) -> Result<LaunchCommand, String> {
        let target = config
            .target_executable
            .as_deref()
            .filter(|s| !s.is_empty())
            .ok_or("Wine: target executable is required.")?;

        let program = self
            .executable_path(config)
            .unwrap_or_else(|| "wine".to_string());

        let mut args = vec![target.to_string()];
        args.extend(config.launch_args.clone());

        Ok(LaunchCommand {
            program,
            args,
            env: self.env_vars(config),
        })
    }
}

// ============================================================================
// CrossOver provider
// ============================================================================

/// Default Wine binary bundled inside CrossOver.
pub const CROSSOVER_DEFAULT_WINE: &str =
    "/Applications/CrossOver.app/Contents/SharedSupport/CrossOver/bin/wine";

pub struct CrossOverProvider;

impl RuntimeProvider for CrossOverProvider {
    fn id(&self) -> &str {
        "crossover"
    }

    fn name(&self) -> &str {
        "CrossOver"
    }

    fn detect(&self) -> RuntimeInfo {
        crate::commands::runtime::detect_crossover_pub()
    }

    fn validate(&self, config: &ProviderConfig) -> ProviderValidation {
        let mut errors = Vec::new();
        if config
            .target_executable
            .as_deref()
            .map_or(true, str::is_empty)
        {
            errors.push("Target executable is required.".to_string());
        }
        ProviderValidation {
            valid: errors.is_empty(),
            errors,
        }
    }

    fn executable_path(&self, config: &ProviderConfig) -> Option<String> {
        Some(
            config
                .runtime_executable
                .clone()
                .filter(|s| !s.is_empty())
                .unwrap_or_else(|| CROSSOVER_DEFAULT_WINE.to_string()),
        )
    }

    fn container_path(&self, config: &ProviderConfig) -> Option<String> {
        config.container_path.clone().filter(|s| !s.is_empty())
    }

    fn env_vars(&self, config: &ProviderConfig) -> HashMap<String, String> {
        config.env_vars.clone()
    }

    fn launch_args(&self, config: &ProviderConfig) -> Vec<String> {
        let mut args = Vec::new();
        if let Some(bottle) = self.container_path(config) {
            args.push("--bottle".to_string());
            args.push(bottle);
        }
        if let Some(exe) = config.target_executable.as_deref().filter(|s| !s.is_empty()) {
            args.push("--".to_string());
            args.push(exe.to_string());
        }
        args.extend(config.launch_args.clone());
        args
    }

    fn build_launch_command(&self, config: &ProviderConfig) -> Result<LaunchCommand, String> {
        let _ = config
            .target_executable
            .as_deref()
            .filter(|s| !s.is_empty())
            .ok_or("CrossOver: target executable is required.")?;

        Ok(LaunchCommand {
            program: self
                .executable_path(config)
                .unwrap_or_else(|| CROSSOVER_DEFAULT_WINE.to_string()),
            args: self.launch_args(config),
            env: self.env_vars(config),
        })
    }
}

// ============================================================================
// Whisky provider
// ============================================================================

/// Default Wine binary bundled inside Whisky.
pub const WHISKY_DEFAULT_WINE: &str = "/Applications/Whisky.app/Contents/MacOS/wine64";

pub struct WhiskyProvider;

impl RuntimeProvider for WhiskyProvider {
    fn id(&self) -> &str {
        "whisky"
    }

    fn name(&self) -> &str {
        "Whisky"
    }

    fn detect(&self) -> RuntimeInfo {
        crate::commands::runtime::detect_whisky_pub()
    }

    fn validate(&self, config: &ProviderConfig) -> ProviderValidation {
        let mut errors = Vec::new();
        if config
            .target_executable
            .as_deref()
            .map_or(true, str::is_empty)
        {
            errors.push("Target executable is required.".to_string());
        }
        ProviderValidation {
            valid: errors.is_empty(),
            errors,
        }
    }

    fn executable_path(&self, config: &ProviderConfig) -> Option<String> {
        Some(
            config
                .runtime_executable
                .clone()
                .filter(|s| !s.is_empty())
                .unwrap_or_else(|| WHISKY_DEFAULT_WINE.to_string()),
        )
    }

    fn container_path(&self, config: &ProviderConfig) -> Option<String> {
        config.container_path.clone().filter(|s| !s.is_empty())
    }

    fn env_vars(&self, config: &ProviderConfig) -> HashMap<String, String> {
        let mut env = config.env_vars.clone();
        if let Some(prefix) = self.container_path(config) {
            env.entry("WINEPREFIX".to_string()).or_insert(prefix);
        }
        env
    }

    fn launch_args(&self, config: &ProviderConfig) -> Vec<String> {
        let mut args = Vec::new();
        if let Some(exe) = config.target_executable.as_deref().filter(|s| !s.is_empty()) {
            args.push(exe.to_string());
        }
        args.extend(config.launch_args.clone());
        args
    }

    fn build_launch_command(&self, config: &ProviderConfig) -> Result<LaunchCommand, String> {
        let target = config
            .target_executable
            .as_deref()
            .filter(|s| !s.is_empty())
            .ok_or("Whisky: target executable is required.")?;

        let program = self
            .executable_path(config)
            .unwrap_or_else(|| WHISKY_DEFAULT_WINE.to_string());

        let mut args = vec![target.to_string()];
        args.extend(config.launch_args.clone());

        Ok(LaunchCommand {
            program,
            args,
            env: self.env_vars(config),
        })
    }
}

// ============================================================================
// GPTK provider
// ============================================================================

pub struct GptkProvider;

impl RuntimeProvider for GptkProvider {
    fn id(&self) -> &str {
        "gptk"
    }

    fn name(&self) -> &str {
        "Apple Game Porting Toolkit"
    }

    fn detect(&self) -> RuntimeInfo {
        crate::commands::runtime::detect_gptk_pub()
    }

    fn validate(&self, config: &ProviderConfig) -> ProviderValidation {
        let mut errors = Vec::new();
        if config
            .target_executable
            .as_deref()
            .map_or(true, str::is_empty)
        {
            errors.push("Target executable is required.".to_string());
        }
        if config
            .container_path
            .as_deref()
            .map_or(true, str::is_empty)
        {
            errors.push("Container (bottle) path is required for GPTK.".to_string());
        }
        ProviderValidation {
            valid: errors.is_empty(),
            errors,
        }
    }

    fn executable_path(&self, config: &ProviderConfig) -> Option<String> {
        Some(
            config
                .runtime_executable
                .clone()
                .filter(|s| !s.is_empty())
                .unwrap_or_else(|| "gameportingtoolkit".to_string()),
        )
    }

    fn container_path(&self, config: &ProviderConfig) -> Option<String> {
        config.container_path.clone().filter(|s| !s.is_empty())
    }

    fn env_vars(&self, config: &ProviderConfig) -> HashMap<String, String> {
        config.env_vars.clone()
    }

    fn launch_args(&self, config: &ProviderConfig) -> Vec<String> {
        let mut args = Vec::new();
        if let Some(container) = self.container_path(config) {
            args.push(container);
        }
        if let Some(exe) = config.target_executable.as_deref().filter(|s| !s.is_empty()) {
            args.push(exe.to_string());
        }
        args.extend(config.launch_args.clone());
        args
    }

    fn build_launch_command(&self, config: &ProviderConfig) -> Result<LaunchCommand, String> {
        let _ = config
            .target_executable
            .as_deref()
            .filter(|s| !s.is_empty())
            .ok_or("GPTK: target executable is required.")?;

        Ok(LaunchCommand {
            program: self
                .executable_path(config)
                .unwrap_or_else(|| "gameportingtoolkit".to_string()),
            args: self.launch_args(config),
            env: self.env_vars(config),
        })
    }
}

// ============================================================================
// Custom provider
// ============================================================================

/// A fully user-configured runtime where the user provides the executable.
/// Useful for Wine forks, Proton builds, or other Wine-compatible runtimes
/// not covered by the named providers.
pub struct CustomProvider;

impl RuntimeProvider for CustomProvider {
    fn id(&self) -> &str {
        "custom"
    }

    fn name(&self) -> &str {
        "Custom Command"
    }

    fn detect(&self) -> RuntimeInfo {
        // Custom providers are always "available" — the user is responsible
        // for providing a valid executable path.
        RuntimeInfo {
            id: self.id().to_string(),
            name: self.name().to_string(),
            available: true,
            version: None,
            executable_path: None,
            error: None,
        }
    }

    fn validate(&self, config: &ProviderConfig) -> ProviderValidation {
        let mut errors = Vec::new();
        if config
            .runtime_executable
            .as_deref()
            .map_or(true, str::is_empty)
        {
            errors.push("Runtime executable path is required for a custom provider.".to_string());
        }
        if config
            .target_executable
            .as_deref()
            .map_or(true, str::is_empty)
        {
            errors.push("Target executable is required.".to_string());
        }
        ProviderValidation {
            valid: errors.is_empty(),
            errors,
        }
    }

    fn executable_path(&self, config: &ProviderConfig) -> Option<String> {
        config.runtime_executable.clone().filter(|s| !s.is_empty())
    }

    fn container_path(&self, config: &ProviderConfig) -> Option<String> {
        config.container_path.clone().filter(|s| !s.is_empty())
    }

    fn env_vars(&self, config: &ProviderConfig) -> HashMap<String, String> {
        config.env_vars.clone()
    }

    fn launch_args(&self, config: &ProviderConfig) -> Vec<String> {
        let mut args = Vec::new();
        if let Some(exe) = config.target_executable.as_deref().filter(|s| !s.is_empty()) {
            args.push(exe.to_string());
        }
        args.extend(config.launch_args.clone());
        args
    }

    fn build_launch_command(&self, config: &ProviderConfig) -> Result<LaunchCommand, String> {
        let program = self
            .executable_path(config)
            .ok_or("Custom: runtime executable path is required.")?;

        let _ = config
            .target_executable
            .as_deref()
            .filter(|s| !s.is_empty())
            .ok_or("Custom: target executable is required.")?;

        Ok(LaunchCommand {
            program,
            args: self.launch_args(config),
            env: self.env_vars(config),
        })
    }
}

// ============================================================================
// Provider registry
// ============================================================================

/// Return the provider for `id`, or `None` if not recognised.
pub fn get_provider(id: &str) -> Option<Box<dyn RuntimeProvider>> {
    match id {
        "wine" => Some(Box::new(WineProvider)),
        "crossover" => Some(Box::new(CrossOverProvider)),
        "whisky" => Some(Box::new(WhiskyProvider)),
        "gptk" => Some(Box::new(GptkProvider)),
        "custom" => Some(Box::new(CustomProvider)),
        _ => None,
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn wine_config(exe: &str) -> ProviderConfig {
        ProviderConfig {
            target_executable: Some(exe.to_string()),
            container_path: None,
            runtime_executable: None,
            env_vars: HashMap::new(),
            launch_args: Vec::new(),
        }
    }

    // --- Wine ---

    #[test]
    fn wine_defaults_to_wine_binary() {
        let p = WineProvider;
        let cmd = p.build_launch_command(&wine_config("/Games/game.exe")).unwrap();
        assert_eq!(cmd.program, "wine");
        assert_eq!(cmd.args, vec!["/Games/game.exe"]);
        assert!(cmd.env.is_empty());
    }

    #[test]
    fn wine_sets_wineprefix_env() {
        let p = WineProvider;
        let config = ProviderConfig {
            target_executable: Some("/Games/game.exe".to_string()),
            container_path: Some("/prefix/wine".to_string()),
            runtime_executable: None,
            env_vars: HashMap::new(),
            launch_args: Vec::new(),
        };
        let cmd = p.build_launch_command(&config).unwrap();
        assert_eq!(cmd.env.get("WINEPREFIX").map(String::as_str), Some("/prefix/wine"));
    }

    #[test]
    fn wine_respects_custom_runtime_executable() {
        let p = WineProvider;
        let config = ProviderConfig {
            target_executable: Some("/Games/game.exe".to_string()),
            container_path: None,
            runtime_executable: Some("/opt/homebrew/bin/wine64".to_string()),
            env_vars: HashMap::new(),
            launch_args: Vec::new(),
        };
        let cmd = p.build_launch_command(&config).unwrap();
        assert_eq!(cmd.program, "/opt/homebrew/bin/wine64");
    }

    #[test]
    fn wine_user_env_vars_not_overridden_by_wineprefix() {
        let p = WineProvider;
        let mut user_env = HashMap::new();
        user_env.insert("WINEPREFIX".to_string(), "/user/prefix".to_string());
        let config = ProviderConfig {
            target_executable: Some("/Games/game.exe".to_string()),
            container_path: Some("/provider/prefix".to_string()),
            runtime_executable: None,
            env_vars: user_env,
            launch_args: Vec::new(),
        };
        let cmd = p.build_launch_command(&config).unwrap();
        // User-specified env var wins
        assert_eq!(cmd.env.get("WINEPREFIX").map(String::as_str), Some("/user/prefix"));
    }

    #[test]
    fn wine_validates_missing_target() {
        let p = WineProvider;
        let config = ProviderConfig {
            target_executable: None,
            container_path: None,
            runtime_executable: None,
            env_vars: HashMap::new(),
            launch_args: Vec::new(),
        };
        let v = p.validate(&config);
        assert!(!v.valid);
        assert!(!v.errors.is_empty());
    }

    // --- CrossOver ---

    #[test]
    fn crossover_uses_default_wine_path() {
        let p = CrossOverProvider;
        let config = ProviderConfig {
            target_executable: Some("/Games/game.exe".to_string()),
            container_path: Some("Steam".to_string()),
            runtime_executable: None,
            env_vars: HashMap::new(),
            launch_args: Vec::new(),
        };
        let cmd = p.build_launch_command(&config).unwrap();
        assert_eq!(cmd.program, CROSSOVER_DEFAULT_WINE);
        assert_eq!(cmd.args, vec!["--bottle", "Steam", "--", "/Games/game.exe"]);
    }

    #[test]
    fn crossover_no_bottle_omits_bottle_flag() {
        let p = CrossOverProvider;
        let config = ProviderConfig {
            target_executable: Some("/Games/game.exe".to_string()),
            container_path: None,
            runtime_executable: None,
            env_vars: HashMap::new(),
            launch_args: Vec::new(),
        };
        let cmd = p.build_launch_command(&config).unwrap();
        assert_eq!(cmd.args, vec!["--", "/Games/game.exe"]);
    }

    // --- Whisky ---

    #[test]
    fn whisky_uses_bundled_wine64() {
        let p = WhiskyProvider;
        let config = ProviderConfig {
            target_executable: Some("/Games/game.exe".to_string()),
            container_path: Some("/Users/me/Library/Containers/Whisky/Bottles/Test".to_string()),
            runtime_executable: None,
            env_vars: HashMap::new(),
            launch_args: Vec::new(),
        };
        let cmd = p.build_launch_command(&config).unwrap();
        assert_eq!(cmd.program, WHISKY_DEFAULT_WINE);
        assert_eq!(
            cmd.env.get("WINEPREFIX").map(String::as_str),
            Some("/Users/me/Library/Containers/Whisky/Bottles/Test")
        );
    }

    // --- GPTK ---

    #[test]
    fn gptk_places_container_before_exe() {
        let p = GptkProvider;
        let config = ProviderConfig {
            target_executable: Some("/Games/game.exe".to_string()),
            container_path: Some("/prefix/gptk".to_string()),
            runtime_executable: None,
            env_vars: HashMap::new(),
            launch_args: Vec::new(),
        };
        let cmd = p.build_launch_command(&config).unwrap();
        assert_eq!(cmd.program, "gameportingtoolkit");
        assert_eq!(cmd.args, vec!["/prefix/gptk", "/Games/game.exe"]);
    }

    #[test]
    fn gptk_validates_missing_container() {
        let p = GptkProvider;
        let config = ProviderConfig {
            target_executable: Some("/Games/game.exe".to_string()),
            container_path: None,
            runtime_executable: None,
            env_vars: HashMap::new(),
            launch_args: Vec::new(),
        };
        let v = p.validate(&config);
        assert!(!v.valid);
        assert!(v.errors.iter().any(|e| e.contains("Container")));
    }

    // --- Custom ---

    #[test]
    fn custom_requires_runtime_executable() {
        let p = CustomProvider;
        let config = ProviderConfig {
            target_executable: Some("/Games/game.exe".to_string()),
            container_path: None,
            runtime_executable: None,
            env_vars: HashMap::new(),
            launch_args: Vec::new(),
        };
        let v = p.validate(&config);
        assert!(!v.valid);
        let result = p.build_launch_command(&config);
        assert!(result.is_err());
    }

    #[test]
    fn custom_builds_command_with_provided_executable() {
        let p = CustomProvider;
        let config = ProviderConfig {
            target_executable: Some("/Games/game.exe".to_string()),
            container_path: None,
            runtime_executable: Some("/opt/my-wine/bin/wine".to_string()),
            env_vars: HashMap::new(),
            launch_args: Vec::new(),
        };
        let cmd = p.build_launch_command(&config).unwrap();
        assert_eq!(cmd.program, "/opt/my-wine/bin/wine");
        assert_eq!(cmd.args, vec!["/Games/game.exe"]);
    }

    // --- Registry ---

    #[test]
    fn registry_returns_all_known_providers() {
        for id in &["wine", "crossover", "whisky", "gptk", "custom"] {
            assert!(
                get_provider(id).is_some(),
                "provider '{id}' should be in registry"
            );
        }
    }

    #[test]
    fn registry_returns_none_for_unknown() {
        assert!(get_provider("unknown-runtime").is_none());
    }

    #[test]
    fn registry_provider_ids_are_consistent() {
        for id in &["wine", "crossover", "whisky", "gptk", "custom"] {
            let provider = get_provider(id).unwrap();
            assert_eq!(provider.id(), *id);
        }
    }

    // --- launch_args include extra args ---

    #[test]
    fn launch_args_appended_for_wine() {
        let p = WineProvider;
        let config = ProviderConfig {
            target_executable: Some("/Games/game.exe".to_string()),
            container_path: None,
            runtime_executable: None,
            env_vars: HashMap::new(),
            launch_args: vec!["-fullscreen".to_string(), "-nosound".to_string()],
        };
        let cmd = p.build_launch_command(&config).unwrap();
        assert_eq!(
            cmd.args,
            vec!["/Games/game.exe", "-fullscreen", "-nosound"]
        );
    }
}
