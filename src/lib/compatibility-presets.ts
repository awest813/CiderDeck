// SPDX-License-Identifier: GPL-3.0-or-later

import type { RuntimeKind } from '@/runtimes/types'
import type { CompatibilityProfile } from '@/types/Profile'
import crossoverPreset from '@/presets/crossover-default.json'
import dxmtPreset from '@/presets/dx11-dxmt.json'
import gptkPreset from '@/presets/gptk-experimental.json'
import whiskyPreset from '@/presets/whisky-dxmt.json'
import wineBasicPreset from '@/presets/wine-basic.json'

export interface CompatibilityPreset {
  id: string
  name: string
  description: string
  runtimeKind: RuntimeKind
  env?: Record<string, string>
  renderer?: CompatibilityProfile['renderer']
  launchArgs?: string[]
}

export const COMPATIBILITY_PRESETS: readonly CompatibilityPreset[] = [
  crossoverPreset as CompatibilityPreset,
  dxmtPreset as CompatibilityPreset,
  gptkPreset as CompatibilityPreset,
  whiskyPreset as CompatibilityPreset,
  wineBasicPreset as CompatibilityPreset,
]

export const getPreset = (id: string): CompatibilityPreset | undefined =>
  COMPATIBILITY_PRESETS.find(p => p.id === id)

/**
 * Merges a preset into a compatibility profile.
 * - env vars: preset values are merged over existing profile env (preserving
 *   any keys not present in the preset)
 * - renderer: preset value replaces the profile value when present
 * - runtimeProviderId: set to the preset's runtimeKind
 * - all other profile fields (paths, title, id, etc.) are preserved
 */
export const applyPreset = (
  profile: CompatibilityProfile,
  preset: CompatibilityPreset
): CompatibilityProfile => ({
  ...profile,
  runtimeProviderId:
    preset.runtimeKind as CompatibilityProfile['runtimeProviderId'],
  renderer: preset.renderer ?? profile.renderer,
  environmentVariables: {
    ...(profile.environmentVariables ?? {}),
    ...(preset.env ?? {}),
  },
  launchArgs:
    preset.launchArgs !== undefined
      ? [...(profile.launchArgs ?? []), ...preset.launchArgs]
      : profile.launchArgs,
})
