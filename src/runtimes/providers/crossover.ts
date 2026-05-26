// SPDX-License-Identifier: GPL-3.0-or-later

import type {
  LaunchCommand,
  RuntimeConfig,
  RuntimeDetectionResult,
  RuntimeProvider,
  RuntimeValidationResult,
} from '@/runtimes/types'

export const CROSSOVER_DEFAULT_WINE_PATH =
  '/Applications/CrossOver.app/Contents/SharedSupport/CrossOver/bin/wine'

const nonEmpty = (s: string | undefined): s is string =>
  typeof s === 'string' && s.length > 0

export class CrossOverRuntimeProvider implements RuntimeProvider {
  readonly id = 'crossover'
  readonly name = 'CrossOver'
  readonly kind = 'crossover'

  async detect(): Promise<RuntimeDetectionResult> {
    return {
      available: false,
      executablePath: CROSSOVER_DEFAULT_WINE_PATH,
      details: 'Runtime probing is handled by native Tauri runtime detection.',
    }
  }

  async validate(config: RuntimeConfig): Promise<RuntimeValidationResult> {
    const errors: string[] = []
    if (!nonEmpty(config.targetExecutable)) {
      errors.push('Target executable is required.')
    }
    return { valid: errors.length === 0, errors }
  }

  async buildLaunchCommand(config: RuntimeConfig): Promise<LaunchCommand> {
    if (!nonEmpty(config.targetExecutable)) {
      throw new Error('CrossOver: target executable is required.')
    }

    const args: string[] = []
    if (nonEmpty(config.containerPath)) {
      args.push('--bottle', config.containerPath)
    }
    args.push('--', config.targetExecutable, ...(config.launchArgs ?? []))

    return {
      program: nonEmpty(config.runtimeExecutable)
        ? config.runtimeExecutable
        : CROSSOVER_DEFAULT_WINE_PATH,
      args,
      env: { ...(config.envVars ?? {}) },
    }
  }
}
