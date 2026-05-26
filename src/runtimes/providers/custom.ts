// SPDX-License-Identifier: GPL-3.0-or-later

import type {
  LaunchCommand,
  RuntimeConfig,
  RuntimeDetectionResult,
  RuntimeProvider,
  RuntimeValidationResult,
} from '@/runtimes/types'

const nonEmpty = (s: string | undefined): s is string =>
  typeof s === 'string' && s.length > 0

export class CustomRuntimeProvider implements RuntimeProvider {
  readonly id = 'custom'
  readonly name = 'Custom Runtime'
  readonly kind = 'custom'

  async detect(): Promise<RuntimeDetectionResult> {
    return {
      available: true,
      details: 'Custom runtime is always available after user configuration.',
    }
  }

  async validate(config: RuntimeConfig): Promise<RuntimeValidationResult> {
    const errors: string[] = []
    if (!nonEmpty(config.runtimeExecutable)) {
      errors.push('Runtime executable path is required for a custom provider.')
    }
    if (!nonEmpty(config.targetExecutable)) {
      errors.push('Target executable is required.')
    }
    return { valid: errors.length === 0, errors }
  }

  async buildLaunchCommand(config: RuntimeConfig): Promise<LaunchCommand> {
    if (!nonEmpty(config.runtimeExecutable)) {
      throw new Error('Custom: runtime executable path is required.')
    }
    if (!nonEmpty(config.targetExecutable)) {
      throw new Error('Custom: target executable is required.')
    }

    return {
      program: config.runtimeExecutable,
      args: [config.targetExecutable, ...(config.launchArgs ?? [])],
      env: { ...(config.envVars ?? {}) },
    }
  }
}
