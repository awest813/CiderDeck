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

/**
 * Native Windows runtime provider.
 *
 * Launches a Windows EXE directly — no compatibility layer, no Wine prefix.
 * Used when CiderDeck runs natively on Windows.
 */
export class NativeWindowsRuntimeProvider implements RuntimeProvider {
  readonly id = 'native'
  readonly name = 'Windows Native'
  readonly kind = 'native'

  async detect(): Promise<RuntimeDetectionResult> {
    return {
      available: true,
      details: 'Native Windows execution requires no additional runtime.',
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
      throw new Error('Windows Native: target executable is required.')
    }

    return {
      program: config.targetExecutable,
      args: [...(config.launchArgs ?? [])],
      env: { ...(config.envVars ?? {}) },
    }
  }
}
