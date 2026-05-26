// SPDX-License-Identifier: GPL-3.0-or-later

import type {
  LaunchCommand,
  RuntimeConfig,
  RuntimeDetectionResult,
  RuntimeProvider,
  RuntimeValidationResult,
} from '@/runtimes/types'

export const WHISKY_DEFAULT_WINE_PATH =
  '/Applications/Whisky.app/Contents/MacOS/wine64'

const nonEmpty = (s: string | undefined): s is string =>
  typeof s === 'string' && s.length > 0

export class WhiskyRuntimeProvider implements RuntimeProvider {
  readonly id = 'whisky'
  readonly name = 'Whisky'
  readonly kind = 'whisky'

  detect(): RuntimeDetectionResult {
    return {
      available: false,
      executablePath: WHISKY_DEFAULT_WINE_PATH,
      details: 'Runtime probing is handled by native Tauri runtime detection.',
    }
  }

  validate(config: RuntimeConfig): RuntimeValidationResult {
    const errors: string[] = []
    if (!nonEmpty(config.targetExecutable)) {
      errors.push('Target executable is required.')
    }
    return { valid: errors.length === 0, errors }
  }

  buildLaunchCommand(config: RuntimeConfig): LaunchCommand {
    if (!nonEmpty(config.targetExecutable)) {
      throw new Error('Whisky: target executable is required.')
    }

    const env: Record<string, string> = { ...(config.envVars ?? {}) }
    if (nonEmpty(config.containerPath) && !env.WINEPREFIX) {
      env.WINEPREFIX = config.containerPath
    }

    return {
      program: nonEmpty(config.runtimeExecutable)
        ? config.runtimeExecutable
        : WHISKY_DEFAULT_WINE_PATH,
      args: [config.targetExecutable, ...(config.launchArgs ?? [])],
      env,
    }
  }
}
