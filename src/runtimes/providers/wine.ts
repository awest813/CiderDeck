// SPDX-License-Identifier: GPL-3.0-or-later

import type {
  LaunchCommand,
  RuntimeConfig,
  RuntimeDetectionResult,
  RuntimeProvider,
  RuntimeValidationResult,
} from '@/runtimes/types'

const COMMON_WINE_PATHS = ['/opt/homebrew/bin/wine', '/usr/local/bin/wine']
const DEFAULT_WINE_PROGRAM = 'wine'

const nonEmpty = (s: string | undefined): s is string =>
  typeof s === 'string' && s.length > 0

export class WineRuntimeProvider implements RuntimeProvider {
  readonly id = 'wine'
  readonly name = 'Wine'
  readonly kind = 'wine'

  detect(): RuntimeDetectionResult {
    return {
      available: false,
      executablePath: COMMON_WINE_PATHS[0],
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
      throw new Error('Wine: target executable is required.')
    }

    const env: Record<string, string> = {
      WINEDEBUG: '-all',
      ...(config.envVars ?? {}),
    }

    if (nonEmpty(config.containerPath) && !env.WINEPREFIX) {
      env.WINEPREFIX = config.containerPath
    }

    return {
      program: nonEmpty(config.runtimeExecutable)
        ? config.runtimeExecutable
        : DEFAULT_WINE_PROGRAM,
      args: [config.targetExecutable, ...(config.launchArgs ?? [])],
      env,
    }
  }
}
