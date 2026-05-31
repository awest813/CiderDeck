// SPDX-License-Identifier: GPL-3.0-or-later

import type { GameImportSource } from '@/lib/bindings'
import type { CompatibilityPreset } from '@/lib/compatibility-presets'

export type LauncherStore = 'steam' | 'gog' | 'epic'

/** Tag format written when importing from Steam, GOG, or Epic. */
export const launcherStoreIdTag = (store: LauncherStore, id: string): string =>
  `store:${store}:${id}`

export interface GamePresetContext {
  title: string
  importSource?: GameImportSource
  tags?: string[]
  installPath?: string | null
}

const normalize = (value: string): string => value.trim().toLowerCase()

export const parseLauncherStoreId = (
  tags: string[] | undefined,
  store: LauncherStore
): string | undefined => {
  if (!tags?.length) return undefined
  const prefix = `store:${store}:`
  const tag = tags.find(entry => entry.startsWith(prefix))
  return tag?.slice(prefix.length)
}

const matchesTitlePatterns = (
  preset: CompatibilityPreset,
  title: string
): boolean => {
  const normalized = normalize(title)
  if (!normalized || !preset.gameTitlePatterns?.length) return false
  return preset.gameTitlePatterns.some(pattern =>
    normalized.includes(normalize(pattern))
  )
}

const matchesStoreIds = (
  preset: CompatibilityPreset,
  context: GamePresetContext
): boolean => {
  const { tags, importSource } = context
  if (!tags?.length) return false

  if (
    importSource === 'SteamLibrary' &&
    preset.steamAppIds?.length &&
    preset.steamAppIds.includes(parseLauncherStoreId(tags, 'steam') ?? '')
  ) {
    return true
  }

  if (
    importSource === 'GogLibrary' &&
    preset.gogGameIds?.length &&
    preset.gogGameIds.includes(parseLauncherStoreId(tags, 'gog') ?? '')
  ) {
    return true
  }

  if (
    importSource === 'EpicLibrary' &&
    preset.epicAppNames?.length &&
    preset.epicAppNames.includes(parseLauncherStoreId(tags, 'epic') ?? '')
  ) {
    return true
  }

  return false
}

const matchesInstallPath = (
  preset: CompatibilityPreset,
  installPath: string | null | undefined
): boolean => {
  if (!installPath || !preset.installPathPatterns?.length) return false
  const normalized = normalize(installPath.replaceAll('\\', '/'))
  return preset.installPathPatterns.some(pattern =>
    normalized.includes(normalize(pattern))
  )
}

/** True when a bundled preset should be prioritized for this library game. */
export const presetMatchesGameContext = (
  preset: CompatibilityPreset,
  context: GamePresetContext
): boolean =>
  matchesTitlePatterns(preset, context.title) ||
  matchesStoreIds(preset, context) ||
  matchesInstallPath(preset, context.installPath)
