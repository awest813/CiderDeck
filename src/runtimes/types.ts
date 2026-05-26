// SPDX-License-Identifier: GPL-3.0-or-later

export type RuntimeKind = 'wine' | 'crossover' | 'whisky' | 'gptk' | 'custom'

export interface RuntimeProfile {
  executablePath?: string
  runtimeProviderId?: RuntimeKind
  runtimeExecutablePath?: string
  wineExecutablePath?: string
  winePrefixPath?: string
  bottlePath?: string
  launchArgs?: string[]
  environmentVariables?: Record<string, string>
  windowsVersion?: 'win7' | 'win10' | 'win11'
  renderer?: 'wined3d' | 'dxmt' | 'd3dmetal' | 'moltenvk' | 'auto'
  dllOverrides?: Record<string, string>
}

export interface RuntimeConfig {
  targetExecutable?: string
  containerPath?: string
  runtimeExecutable?: string
  envVars?: Record<string, string>
  launchArgs?: string[]
}

export interface RuntimeDetectionResult {
  available: boolean
  executablePath?: string
  details?: string
}

export interface RuntimeValidationResult {
  valid: boolean
  errors: string[]
}

export interface LaunchCommand {
  program: string
  args: string[]
  env: Record<string, string>
  cwd?: string
}

export interface RuntimeProvider {
  id: string
  name: string
  kind: RuntimeKind

  detect(): RuntimeDetectionResult
  validate(config: RuntimeConfig): RuntimeValidationResult
  buildLaunchCommand(config: RuntimeConfig): LaunchCommand
}
