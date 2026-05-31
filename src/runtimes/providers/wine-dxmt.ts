// SPDX-License-Identifier: GPL-3.0-or-later

import type {
  LaunchCommand,
  RuntimeConfig,
  RuntimeDetectionResult,
  RuntimeProvider,
  RuntimeValidationResult,
} from '@/runtimes/types'

/**
 * Default wine binary installed by the `wine-dxmt` Homebrew cask from
 * https://github.com/zzzz465/homebrew-wine-dxmt.
 *
 * Install:  brew tap zzzz465/homebrew-wine-dxmt && brew install --cask wine-dxmt
 */
export const WINE_DXMT_DEFAULT_PATH = '/usr/local/bin/wine-dxmt'

const nonEmpty = (s: string | undefined): s is string =>
  typeof s === 'string' && s.length > 0

/**
 * Runtime provider for Wine Staging + DXMT installed via the
 * zzzz465/homebrew-wine-dxmt Homebrew tap.  Functionally identical to the
 * plain Wine provider but defaults to the `wine-dxmt` binary so that the
 * DXMT DirectX 11-to-Metal translation layer is active for all launches.
 */
export class WineDxmtRuntimeProvider implements RuntimeProvider {
  readonly id = 'wine-dxmt'
  readonly name = 'Wine + DXMT (Homebrew)'
  readonly kind = 'wine-dxmt'

  async detect(): Promise<RuntimeDetectionResult> {
    return {
      available: false,
      executablePath: WINE_DXMT_DEFAULT_PATH,
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
      throw new Error('Wine+DXMT: target executable is required.')
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
        : WINE_DXMT_DEFAULT_PATH,
      args: [config.targetExecutable, ...(config.launchArgs ?? [])],
      env,
    }
  }
}
