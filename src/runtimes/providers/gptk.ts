// SPDX-License-Identifier: GPL-3.0-or-later

import type {
  LaunchCommand,
  RuntimeConfig,
  RuntimeDetectionResult,
  RuntimeProvider,
  RuntimeValidationResult,
} from '@/runtimes/types'

const GPTK_PROGRAM = 'gameportingtoolkit'
const nonEmpty = (s: string | undefined): s is string =>
  typeof s === 'string' && s.length > 0

export class GptkRuntimeProvider implements RuntimeProvider {
  readonly id = 'gptk'
  readonly name = 'Apple Game Porting Toolkit'
  readonly kind = 'gptk'

  detect(): RuntimeDetectionResult {
    return {
      available: false,
      details: 'Runtime probing is handled by native Tauri runtime detection.',
    }
  }

  validate(config: RuntimeConfig): RuntimeValidationResult {
    const errors: string[] = []
    if (!nonEmpty(config.targetExecutable)) {
      errors.push('Target executable is required.')
    }
    if (!nonEmpty(config.containerPath)) {
      errors.push('Container (bottle) path is required for GPTK.')
    }
    return { valid: errors.length === 0, errors }
  }

  buildLaunchCommand(config: RuntimeConfig): LaunchCommand {
    if (!nonEmpty(config.targetExecutable)) {
      throw new Error('GPTK: target executable is required.')
    }

    return {
      program: nonEmpty(config.runtimeExecutable)
        ? config.runtimeExecutable
        : GPTK_PROGRAM,
      args: [
        ...(nonEmpty(config.containerPath) ? [config.containerPath] : []),
        config.targetExecutable,
        ...(config.launchArgs ?? []),
      ],
      env: { ...(config.envVars ?? {}) },
    }
  }
}
