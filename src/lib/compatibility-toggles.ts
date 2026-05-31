// SPDX-License-Identifier: GPL-3.0-or-later

import type { CompatibilityProfile } from '@/types/Profile'

export type CompatibilityRenderer = NonNullable<
  CompatibilityProfile['renderer']
>

export const COMPATIBILITY_RENDERER_OPTIONS: {
  value: CompatibilityRenderer | undefined
  label: string
}[] = [
  { value: undefined, label: 'Auto' },
  { value: 'wined3d', label: 'wined3d' },
  { value: 'dxmt', label: 'dxmt' },
  { value: 'd3dmetal', label: 'd3dmetal' },
  { value: 'moltenvk', label: 'moltenvk' },
]

export interface CompatibilityEnvToggle {
  id: string
  label: string
  description: string
  envKey: string
  enabledValue: string
}

export const COMPATIBILITY_ENV_TOGGLES: readonly CompatibilityEnvToggle[] = [
  {
    id: 'quiet-logs',
    label: 'Quiet logs',
    description: 'Sets WINEDEBUG=-all for less Wine console noise',
    envKey: 'WINEDEBUG',
    enabledValue: '-all',
  },
]

export const normalizeRenderer = (
  renderer?: CompatibilityProfile['renderer']
): CompatibilityRenderer | undefined => {
  if (!renderer || renderer === 'auto') return undefined
  return renderer
}

export const setProfileRenderer = (
  profile: CompatibilityProfile,
  renderer: CompatibilityRenderer | undefined
): CompatibilityProfile => ({
  ...profile,
  renderer,
})

export const isEnvToggleEnabled = (
  profile: CompatibilityProfile,
  toggle: CompatibilityEnvToggle
): boolean =>
  profile.environmentVariables?.[toggle.envKey] === toggle.enabledValue

export const setEnvToggle = (
  profile: CompatibilityProfile,
  toggle: CompatibilityEnvToggle,
  enabled: boolean
): CompatibilityProfile => {
  const current = profile.environmentVariables ?? {}

  if (enabled) {
    return {
      ...profile,
      environmentVariables: {
        ...current,
        [toggle.envKey]: toggle.enabledValue,
      },
    }
  }

  const environmentVariables = Object.fromEntries(
    Object.entries(current).filter(([key]) => key !== toggle.envKey)
  )

  return {
    ...profile,
    environmentVariables:
      Object.keys(environmentVariables).length > 0
        ? environmentVariables
        : undefined,
  }
}
