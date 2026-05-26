// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * RuntimeProvider abstraction for Wine-like compatibility tools.
 *
 * Each provider encapsulates the logic for a specific compatibility runtime
 * (Wine, CrossOver, Whisky, GPTK, or a fully custom command). Providers
 * compute environment variables, build argument lists, validate configurations,
 * and produce structured launch commands.
 *
 * **No shell strings are ever built.** All commands are expressed as
 * `LaunchCommand { program, args, env }` triples that map directly to
 * `std::process::Command::new(program).args(args).envs(env)` on the Rust side.
 *
 * Log capture integration: the `LaunchCommand` produced by
 * `buildLaunchCommand` is intended to be passed to `launchProfileExecutable`
 * (via `profile-runner.ts`) which persists the resulting stdout/stderr/exit
 * code as a `ProfileLogEntry` through the `save_log` Tauri command.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Input configuration for a provider. All fields are optional so the same
 * type works for fully-configured profiles, partially-filled forms, and
 * validation probes.
 */
export interface ProviderConfig {
  /** Path to the Windows executable to run inside the runtime */
  targetExecutable?: string
  /** Path to the bottle / Wine prefix / CrossOver bottle name / GPTK prefix */
  containerPath?: string
  /** Override for the Wine-like binary (undefined → provider default) */
  runtimeExecutable?: string
  /** Extra environment variables merged on top of provider defaults */
  envVars?: Record<string, string>
  /** Extra CLI arguments appended after provider-generated arguments */
  launchArgs?: string[]
}

/**
 * A fully resolved launch command: program + args + env.
 *
 * Never contains a shell string. Pass `program` to
 * `launch_profile_executable` as `executablePath`, and `args` / `env` as
 * their respective parameters.
 */
export interface LaunchCommand {
  /** The executable to invoke */
  program: string
  /** Ordered argument list — no shell escaping needed */
  args: string[]
  /** Environment variable overrides for the child process */
  env: Record<string, string>
}

/** Structured validation outcome from a provider. */
export interface ValidationResult {
  /** True if the config is complete and ready to launch */
  valid: boolean
  /** Human-readable error messages; empty when `valid` is true */
  errors: string[]
}

// ============================================================================
// RuntimeProvider interface
// ============================================================================

/**
 * Unified abstraction for a Wine-like compatibility runtime provider.
 *
 * Implement this interface to add support for a new compatibility runtime
 * without changing any call sites. All implementations live in this module;
 * callers retrieve them via {@link getRuntimeProvider} or {@link RUNTIME_PROVIDERS}.
 */
export interface RuntimeProvider {
  /** Stable machine identifier (e.g. `"wine"`, `"crossover"`) */
  readonly id: string
  /** Human-readable display name (e.g. `"Wine"`, `"CrossOver"`) */
  readonly name: string

  /**
   * Resolve the runtime executable path for `config`.
   * Returns the provider-specific default when `runtimeExecutable` is not set.
   */
  getExecutablePath(config: ProviderConfig): string | undefined

  /** Resolve the container / bottle / prefix path from `config`. */
  getContainerPath(config: ProviderConfig): string | undefined

  /**
   * Compute the complete set of environment variables for `config`.
   *
   * Provider defaults (e.g. `WINEPREFIX`) are merged with `config.envVars`;
   * the user's explicit vars take precedence.
   */
  getEnvVars(config: ProviderConfig): Record<string, string>

  /**
   * Build the full ordered argument list for `config`.
   *
   * Includes provider-specific flags (e.g. `--bottle <name>` for CrossOver)
   * followed by the target executable and any `config.launchArgs`.
   */
  getLaunchArgs(config: ProviderConfig): string[]

  /**
   * Validate `config` without launching anything.
   *
   * Returns all errors so the UI can surface them before the user attempts
   * to launch. Always call this before `buildLaunchCommand` in UIs.
   */
  validate(config: ProviderConfig): ValidationResult

  /**
   * Build the complete structured launch command.
   *
   * Throws if the config is not valid enough to produce a command (e.g.
   * missing required executable path). Call {@link validate} first if you
   * want structured error messages.
   */
  buildLaunchCommand(config: ProviderConfig): LaunchCommand
}

// ============================================================================
// Helpers
// ============================================================================

const nonEmpty = (s: string | undefined): s is string =>
  typeof s === 'string' && s.length > 0

const mergeEnv = (
  base: Record<string, string>,
  overrides?: Record<string, string>
): Record<string, string> => ({ ...base, ...overrides })

// ============================================================================
// Wine provider
// ============================================================================

const WINE_DEFAULT_PROGRAM = 'wine'

class WineProvider implements RuntimeProvider {
  readonly id = 'wine'
  readonly name = 'Wine'

  getExecutablePath(config: ProviderConfig): string {
    const exe = config.runtimeExecutable
    return nonEmpty(exe) ? exe : WINE_DEFAULT_PROGRAM
  }

  getContainerPath(config: ProviderConfig): string | undefined {
    const path = config.containerPath
    return nonEmpty(path) ? path : undefined
  }

  getEnvVars(config: ProviderConfig): Record<string, string> {
    const base: Record<string, string> = {}
    const container = this.getContainerPath(config)
    if (container) {
      base['WINEPREFIX'] = container
    }
    // User-supplied vars take precedence over provider defaults
    return mergeEnv(base, config.envVars)
  }

  getLaunchArgs(config: ProviderConfig): string[] {
    const args: string[] = []
    const target = config.targetExecutable
    if (nonEmpty(target)) args.push(target)
    if (config.launchArgs) args.push(...config.launchArgs)
    return args
  }

  validate(config: ProviderConfig): ValidationResult {
    const errors: string[] = []
    if (!nonEmpty(config.targetExecutable)) {
      errors.push('Target executable is required.')
    }
    return { valid: errors.length === 0, errors }
  }

  buildLaunchCommand(config: ProviderConfig): LaunchCommand {
    if (!nonEmpty(config.targetExecutable)) {
      throw new Error('Wine: target executable is required.')
    }
    return {
      program: this.getExecutablePath(config),
      args: this.getLaunchArgs(config),
      env: this.getEnvVars(config),
    }
  }
}

// ============================================================================
// CrossOver provider
// ============================================================================

export const CROSSOVER_DEFAULT_WINE_PATH =
  '/Applications/CrossOver.app/Contents/SharedSupport/CrossOver/bin/wine'

class CrossOverProvider implements RuntimeProvider {
  readonly id = 'crossover'
  readonly name = 'CrossOver'

  getExecutablePath(config: ProviderConfig): string {
    const exe = config.runtimeExecutable
    return nonEmpty(exe) ? exe : CROSSOVER_DEFAULT_WINE_PATH
  }

  getContainerPath(config: ProviderConfig): string | undefined {
    const path = config.containerPath
    return nonEmpty(path) ? path : undefined
  }

  getEnvVars(config: ProviderConfig): Record<string, string> {
    return mergeEnv({}, config.envVars)
  }

  getLaunchArgs(config: ProviderConfig): string[] {
    const args: string[] = []
    const bottle = this.getContainerPath(config)
    if (bottle) {
      args.push('--bottle', bottle)
    }
    const target = config.targetExecutable
    if (nonEmpty(target)) {
      args.push('--', target)
    }
    if (config.launchArgs) args.push(...config.launchArgs)
    return args
  }

  validate(config: ProviderConfig): ValidationResult {
    const errors: string[] = []
    if (!nonEmpty(config.targetExecutable)) {
      errors.push('Target executable is required.')
    }
    return { valid: errors.length === 0, errors }
  }

  buildLaunchCommand(config: ProviderConfig): LaunchCommand {
    if (!nonEmpty(config.targetExecutable)) {
      throw new Error('CrossOver: target executable is required.')
    }
    return {
      program: this.getExecutablePath(config),
      args: this.getLaunchArgs(config),
      env: this.getEnvVars(config),
    }
  }
}

// ============================================================================
// Whisky provider
// ============================================================================

export const WHISKY_DEFAULT_WINE_PATH =
  '/Applications/Whisky.app/Contents/MacOS/wine64'

class WhiskyProvider implements RuntimeProvider {
  readonly id = 'whisky'
  readonly name = 'Whisky'

  getExecutablePath(config: ProviderConfig): string {
    const exe = config.runtimeExecutable
    return nonEmpty(exe) ? exe : WHISKY_DEFAULT_WINE_PATH
  }

  getContainerPath(config: ProviderConfig): string | undefined {
    const path = config.containerPath
    return nonEmpty(path) ? path : undefined
  }

  getEnvVars(config: ProviderConfig): Record<string, string> {
    const base: Record<string, string> = {}
    const container = this.getContainerPath(config)
    if (container) {
      base['WINEPREFIX'] = container
    }
    return mergeEnv(base, config.envVars)
  }

  getLaunchArgs(config: ProviderConfig): string[] {
    const args: string[] = []
    const target = config.targetExecutable
    if (nonEmpty(target)) args.push(target)
    if (config.launchArgs) args.push(...config.launchArgs)
    return args
  }

  validate(config: ProviderConfig): ValidationResult {
    const errors: string[] = []
    if (!nonEmpty(config.targetExecutable)) {
      errors.push('Target executable is required.')
    }
    return { valid: errors.length === 0, errors }
  }

  buildLaunchCommand(config: ProviderConfig): LaunchCommand {
    if (!nonEmpty(config.targetExecutable)) {
      throw new Error('Whisky: target executable is required.')
    }
    return {
      program: this.getExecutablePath(config),
      args: this.getLaunchArgs(config),
      env: this.getEnvVars(config),
    }
  }
}

// ============================================================================
// GPTK provider
// ============================================================================

const GPTK_DEFAULT_PROGRAM = 'gameportingtoolkit'

class GptkProvider implements RuntimeProvider {
  readonly id = 'gptk'
  readonly name = 'Apple Game Porting Toolkit'

  getExecutablePath(config: ProviderConfig): string {
    const exe = config.runtimeExecutable
    return nonEmpty(exe) ? exe : GPTK_DEFAULT_PROGRAM
  }

  getContainerPath(config: ProviderConfig): string | undefined {
    const path = config.containerPath
    return nonEmpty(path) ? path : undefined
  }

  getEnvVars(config: ProviderConfig): Record<string, string> {
    return mergeEnv({}, config.envVars)
  }

  getLaunchArgs(config: ProviderConfig): string[] {
    const args: string[] = []
    const container = this.getContainerPath(config)
    if (container) args.push(container)
    const target = config.targetExecutable
    if (nonEmpty(target)) args.push(target)
    if (config.launchArgs) args.push(...config.launchArgs)
    return args
  }

  validate(config: ProviderConfig): ValidationResult {
    const errors: string[] = []
    if (!nonEmpty(config.targetExecutable)) {
      errors.push('Target executable is required.')
    }
    if (!nonEmpty(config.containerPath)) {
      errors.push('Container (bottle) path is required for GPTK.')
    }
    return { valid: errors.length === 0, errors }
  }

  buildLaunchCommand(config: ProviderConfig): LaunchCommand {
    if (!nonEmpty(config.targetExecutable)) {
      throw new Error('GPTK: target executable is required.')
    }
    return {
      program: this.getExecutablePath(config),
      args: this.getLaunchArgs(config),
      env: this.getEnvVars(config),
    }
  }
}

// ============================================================================
// Custom provider
// ============================================================================

/**
 * A fully user-configured runtime where the user supplies the executable.
 *
 * Useful for Wine forks, Proton builds, or other Wine-compatible runtimes
 * not covered by the named providers. The `runtimeExecutable` field is
 * required; all others follow the same semantics as the Wine provider.
 */
class CustomProvider implements RuntimeProvider {
  readonly id = 'custom'
  readonly name = 'Custom Command'

  getExecutablePath(config: ProviderConfig): string | undefined {
    const exe = config.runtimeExecutable
    return nonEmpty(exe) ? exe : undefined
  }

  getContainerPath(config: ProviderConfig): string | undefined {
    const path = config.containerPath
    return nonEmpty(path) ? path : undefined
  }

  getEnvVars(config: ProviderConfig): Record<string, string> {
    return mergeEnv({}, config.envVars)
  }

  getLaunchArgs(config: ProviderConfig): string[] {
    const args: string[] = []
    const target = config.targetExecutable
    if (nonEmpty(target)) args.push(target)
    if (config.launchArgs) args.push(...config.launchArgs)
    return args
  }

  validate(config: ProviderConfig): ValidationResult {
    const errors: string[] = []
    if (!nonEmpty(config.runtimeExecutable)) {
      errors.push('Runtime executable path is required for a custom provider.')
    }
    if (!nonEmpty(config.targetExecutable)) {
      errors.push('Target executable is required.')
    }
    return { valid: errors.length === 0, errors }
  }

  buildLaunchCommand(config: ProviderConfig): LaunchCommand {
    const program = this.getExecutablePath(config)
    if (!program) {
      throw new Error('Custom: runtime executable path is required.')
    }
    if (!nonEmpty(config.targetExecutable)) {
      throw new Error('Custom: target executable is required.')
    }
    return {
      program,
      args: this.getLaunchArgs(config),
      env: this.getEnvVars(config),
    }
  }
}

// ============================================================================
// Registry
// ============================================================================

/** All built-in providers, in display order. */
export const RUNTIME_PROVIDERS: readonly RuntimeProvider[] = [
  new WineProvider(),
  new CrossOverProvider(),
  new WhiskyProvider(),
  new GptkProvider(),
  new CustomProvider(),
]

/**
 * Retrieve the provider for `id`, or `undefined` if not recognised.
 *
 * @example
 * const provider = getRuntimeProvider('wine')
 * const cmd = provider?.buildLaunchCommand({ targetExecutable: '/Games/game.exe' })
 */
export function getRuntimeProvider(id: string): RuntimeProvider | undefined {
  return RUNTIME_PROVIDERS.find(p => p.id === id)
}
