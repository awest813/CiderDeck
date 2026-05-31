// SPDX-License-Identifier: GPL-3.0-or-later

import type { RuntimeKind } from '@/runtimes/types'
import type { CompatibilityProfile } from '@/types/Profile'
import {
  presetMatchesGameContext,
  type GamePresetContext,
} from '@/lib/preset-game-matching'
import crossoverPreset from '@/presets/crossover-default.json'
import dxmtPreset from '@/presets/dx11-dxmt.json'
import fallout3GotyPreset from '@/presets/fallout-3-goty.json'
import gptkPreset from '@/presets/gptk-experimental.json'
import whiskyPreset from '@/presets/whisky-dxmt.json'
import wineBasicPreset from '@/presets/wine-basic.json'
import wineDxmtHomebrewPreset from '@/presets/wine-dxmt-homebrew.json'
import wineMoltenvkPreset from '@/presets/wine-moltenvk.json'

export interface CompatibilityPreset {
  id: string
  name: string
  description: string
  runtimeKind: RuntimeKind
  /** Case-insensitive substrings; preset is prioritized when the game title contains any. */
  gameTitlePatterns?: string[]
  steamAppIds?: string[]
  gogGameIds?: string[]
  epicAppNames?: string[]
  installPathPatterns?: string[]
  env?: Record<string, string>
  renderer?: CompatibilityProfile['renderer']
  windowsVersion?: CompatibilityProfile['windowsVersion']
  dllOverrides?: Record<string, string>
  launchArgs?: string[]
}

export const COMPATIBILITY_PRESETS: readonly CompatibilityPreset[] = [
  fallout3GotyPreset as CompatibilityPreset,
  crossoverPreset as CompatibilityPreset,
  dxmtPreset as CompatibilityPreset,
  gptkPreset as CompatibilityPreset,
  whiskyPreset as CompatibilityPreset,
  wineBasicPreset as CompatibilityPreset,
  wineDxmtHomebrewPreset as CompatibilityPreset,
  wineMoltenvkPreset as CompatibilityPreset,
]

export const getPreset = (id: string): CompatibilityPreset | undefined =>
  COMPATIBILITY_PRESETS.find(p => p.id === id)

export type { GamePresetContext } from '@/lib/preset-game-matching'
export {
  launcherStoreIdTag,
  presetMatchesGameContext,
} from '@/lib/preset-game-matching'

/** @deprecated Use presetMatchesGameContext */
export const presetMatchesGameTitle = (
  preset: CompatibilityPreset,
  gameTitle: string
): boolean => presetMatchesGameContext(preset, { title: gameTitle })

export interface PresetGroups {
  recommended: CompatibilityPreset[]
  other: CompatibilityPreset[]
}

export const groupPresetsByRuntime = (
  runtimeKind?: RuntimeKind
): PresetGroups => {
  if (!runtimeKind) {
    return { recommended: [...COMPATIBILITY_PRESETS], other: [] }
  }

  const recommended = COMPATIBILITY_PRESETS.filter(
    preset => preset.runtimeKind === runtimeKind
  )
  const other = COMPATIBILITY_PRESETS.filter(
    preset => preset.runtimeKind !== runtimeKind
  )

  return { recommended, other }
}

export interface PresetPickerGroups extends PresetGroups {
  /** Game-specific presets shown first when the title matches. */
  priority: CompatibilityPreset[]
}

export const groupPresetsForPicker = (options?: {
  runtimeKind?: RuntimeKind
  gameTitle?: string
  game?: GamePresetContext
}): PresetPickerGroups => {
  const context: GamePresetContext | undefined =
    options?.game ??
    (options?.gameTitle?.trim()
      ? { title: options.gameTitle.trim() }
      : undefined)
  const priority = context
    ? COMPATIBILITY_PRESETS.filter(preset =>
        presetMatchesGameContext(preset, context)
      )
    : []
  const priorityIds = new Set(priority.map(preset => preset.id))
  const { recommended, other } = groupPresetsByRuntime(options?.runtimeKind)

  return {
    priority,
    recommended: recommended.filter(preset => !priorityIds.has(preset.id)),
    other: other.filter(preset => !priorityIds.has(preset.id)),
  }
}

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
  windowsVersion: preset.windowsVersion ?? profile.windowsVersion,
  dllOverrides: preset.dllOverrides
    ? { ...(profile.dllOverrides ?? {}), ...preset.dllOverrides }
    : profile.dllOverrides,
  environmentVariables: {
    ...(profile.environmentVariables ?? {}),
    ...(preset.env ?? {}),
  },
  launchArgs:
    preset.launchArgs !== undefined
      ? [...(profile.launchArgs ?? []), ...preset.launchArgs]
      : profile.launchArgs,
})
