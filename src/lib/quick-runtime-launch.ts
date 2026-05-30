// SPDX-License-Identifier: GPL-3.0-or-later

import { helperLabel } from '@/lib/helper-catalog'
import type { RuntimeInfo } from '@/lib/bindings'
import type {
  CompatibilityBackend,
  CompatibilityProfile,
} from '@/types/Profile'

export const QUICK_RUNTIME_BACKENDS = [
  'wine',
  'crossover',
  'whisky',
  'gptk',
] as const

export type QuickRuntimeBackend = (typeof QUICK_RUNTIME_BACKENDS)[number]

export interface QuickRuntimeOption {
  id: QuickRuntimeBackend
  label: string
  available: boolean
}

export const isQuickRuntimeBackend = (
  value: string
): value is QuickRuntimeBackend =>
  QUICK_RUNTIME_BACKENDS.some(candidate => candidate === value)

export const getCurrentRuntimeBackend = (
  profile: CompatibilityProfile
): CompatibilityBackend => profile.runtimeProviderId ?? profile.backend

export const getQuickRuntimeOptions = (
  profile: CompatibilityProfile,
  runtimes: RuntimeInfo[] = []
): QuickRuntimeOption[] => {
  const currentRuntime = getCurrentRuntimeBackend(profile)

  return QUICK_RUNTIME_BACKENDS.filter(
    runtime => runtime !== currentRuntime
  ).map(runtime => ({
    id: runtime,
    label: helperLabel(runtime),
    available:
      runtimes.length === 0 ||
      runtimes.some(
        detected => detected.id === runtime && detected.available === true
      ),
  }))
}

export const createQuickRuntimeLaunchProfile = (
  profile: CompatibilityProfile,
  runtime: QuickRuntimeBackend
): CompatibilityProfile => {
  if (!isQuickRuntimeBackend(runtime)) {
    throw new Error(`Unsupported quick runtime: ${runtime}`)
  }

  return {
    ...profile,
    runtimeProviderId: runtime,
  }
}
