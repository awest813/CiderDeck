// SPDX-License-Identifier: GPL-3.0-or-later

export type {
  LaunchCommand,
  RuntimeConfig as ProviderConfig,
  RuntimeDetectionResult,
  RuntimeKind,
  RuntimeProfile,
  RuntimeProvider,
  RuntimeValidationResult as ValidationResult,
} from '@/runtimes/types'

export { RUNTIME_PROVIDERS, getRuntimeProvider } from '@/runtimes/registry'

export { CROSSOVER_DEFAULT_WINE_PATH } from '@/runtimes/providers/crossover'
export { WHISKY_DEFAULT_WINE_PATH } from '@/runtimes/providers/whisky'
export { WINE_DXMT_DEFAULT_PATH } from '@/runtimes/providers/wine-dxmt'
