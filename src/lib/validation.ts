// SPDX-License-Identifier: GPL-3.0-or-later

import type {
  AlephOneProfile,
  CiderDeckProfile,
  CivProfile,
  CompatibilityProfile,
  DoomProfile,
  EmulatorProfile,
  EmulatorSystem,
  GemRBProfile,
  N64RecompProfile,
  OpenDiabloProfile,
  OpenMWProfile,
  OpenRCT2Profile,
  OpenXcomProfile,
  QuakeProfile,
} from '@/types/Profile'
import {
  DEFAULT_WHISKY_WINE_PATH,
  DEFAULT_WINE_PROGRAM,
} from '@/lib/profile-launchers'
import type { ValidationIssue, ValidationResult } from '@/types/Validation'

const error = (message: string): ValidationIssue => ({
  severity: 'error',
  message,
})

const warning = (message: string): ValidationIssue => ({
  severity: 'warning',
  message,
})

const info = (message: string): ValidationIssue => ({
  severity: 'info',
  message,
})

const requirePath = (
  value: string | undefined,
  label: string,
  severity: 'error' | 'warning' = 'error'
): ValidationIssue | null => {
  if (value && value.trim().length > 0) {
    return null
  }
  return severity === 'error'
    ? error(`Missing ${label}.`)
    : warning(`Missing ${label}.`)
}

const finalize = (issues: ValidationIssue[]): ValidationResult => ({
  issues,
  hasErrors: issues.some(issue => issue.severity === 'error'),
})

export const validateCompatibilityProfile = (
  profile: CompatibilityProfile
): ValidationResult => {
  const issues: ValidationIssue[] = []
  const exec = requirePath(profile.executablePath, 'Windows executable path')
  if (exec) issues.push(exec)
  if (profile.backend === 'gptk') {
    issues.push(
      info(
        'GPTK requires Apple Game Porting Toolkit installed and a configured prefix.'
      )
    )
  }
  if (
    (profile.backend === 'wine' || profile.backend === 'whisky') &&
    !profile.bottlePath
  ) {
    const backendLabel = profile.backend === 'wine' ? 'Wine' : 'Whisky'
    issues.push(
      warning(
        `No ${backendLabel} prefix specified — default prefix will be used.`
      )
    )
  }
  if (
    (profile.backend === 'wine' || profile.backend === 'whisky') &&
    !profile.wineExecutablePath
  ) {
    const binaryLabel =
      profile.backend === 'wine'
        ? DEFAULT_WINE_PROGRAM
        : `Whisky bundled wine64 (${DEFAULT_WHISKY_WINE_PATH})`
    issues.push(info(`No Wine executable path set — using ${binaryLabel}.`))
  }
  return finalize(issues)
}

export const validateDoomProfile = (profile: DoomProfile): ValidationResult => {
  const issues: ValidationIssue[] = []
  const enginePath = requirePath(profile.enginePath, 'Doom engine path')
  if (enginePath) issues.push(enginePath)
  const iwad = requirePath(profile.iwadPath, 'IWAD path (e.g. DOOM.WAD)')
  if (iwad) issues.push(iwad)
  if (profile.engine === 'custom') {
    issues.push(info('Using a custom Doom engine — verify command-line flags.'))
  }
  return finalize(issues)
}

export const validateQuakeProfile = (
  profile: QuakeProfile
): ValidationResult => {
  const issues: ValidationIssue[] = []
  const enginePath = requirePath(profile.enginePath, 'Quake engine path')
  if (enginePath) issues.push(enginePath)
  const dataPath = requirePath(
    profile.gameDataPath,
    profile.family === 'quake1'
      ? 'id1 game data folder'
      : profile.family === 'quake2'
        ? 'baseq2 game data folder'
        : 'baseq3 game data folder'
  )
  if (dataPath) issues.push(dataPath)
  if (
    profile.engine === 'qss-m' ||
    profile.engine === 'quakespasm-spiked' ||
    profile.engine === 'vkmacquake'
  ) {
    issues.push(
      info(`${profile.engine} is community-maintained — features may vary.`)
    )
  }
  return finalize(issues)
}

export const validateGemRBProfile = (
  profile: GemRBProfile
): ValidationResult => {
  const issues: ValidationIssue[] = []
  const enginePath = requirePath(profile.gemRBPath, 'GemRB executable path')
  if (enginePath) issues.push(enginePath)
  const dataPath = requirePath(
    profile.gameDataPath,
    'Infinity Engine game data path (folder containing chitin.key)'
  )
  if (dataPath) issues.push(dataPath)
  if (profile.game === 'pst') {
    issues.push(
      info(
        'Planescape: Torment requires the original CD/GOG installation files.'
      )
    )
  }
  return finalize(issues)
}

export const validateOpenDiabloProfile = (
  profile: OpenDiabloProfile
): ValidationResult => {
  const issues: ValidationIssue[] = []
  const enginePath = requirePath(profile.enginePath, 'OpenDiablo engine path')
  if (enginePath) issues.push(enginePath)
  const dataPath = requirePath(
    profile.gameDataPath,
    'Game data path (folder containing MPQ files)'
  )
  if (dataPath) issues.push(dataPath)
  if (
    profile.engine === 'opendiablo2' ||
    profile.engine === 'abyssengine-opendiablo2'
  ) {
    issues.push(
      warning('OpenDiablo2 is experimental — expect missing features.')
    )
  }
  if (
    (profile.game === 'diablo2' || profile.game === 'lord-of-destruction') &&
    (!profile.mpqPaths || profile.mpqPaths.length === 0)
  ) {
    issues.push(
      warning('Diablo II typically requires d2data/d2char/d2music/d2sfx MPQs.')
    )
  }
  return finalize(issues)
}

export const validateAlephOneProfile = (
  profile: AlephOneProfile
): ValidationResult => {
  const issues: ValidationIssue[] = []
  const enginePath = requirePath(
    profile.alephOnePath,
    'Aleph One executable path'
  )
  if (enginePath) issues.push(enginePath)
  const scenarioPath = requirePath(
    profile.scenarioPath,
    'Marathon scenario folder'
  )
  if (scenarioPath) issues.push(scenarioPath)
  return finalize(issues)
}

export const validateOpenRCT2Profile = (
  profile: OpenRCT2Profile
): ValidationResult => {
  const issues: ValidationIssue[] = []
  const enginePath = requirePath(
    profile.openRCT2Path,
    'OpenRCT2 executable path'
  )
  if (enginePath) issues.push(enginePath)
  if (!profile.gameDataPath) {
    issues.push(
      warning(
        'No RCT2 game data path set — OpenRCT2 cannot start without legitimate RCT2 assets.'
      )
    )
  }
  return finalize(issues)
}

export const validateOpenMWProfile = (
  profile: OpenMWProfile
): ValidationResult => {
  const issues: ValidationIssue[] = []
  const enginePath = requirePath(profile.enginePath, 'OpenMW executable path')
  if (enginePath) issues.push(enginePath)
  const dataPath = requirePath(
    profile.gameDataPath,
    'Morrowind Data Files folder (contains Morrowind.bsa, Morrowind.esm)'
  )
  if (dataPath) issues.push(dataPath)
  if (!profile.configPath) {
    issues.push(
      warning(
        'No openmw.cfg specified — OpenMW will use its default config location.'
      )
    )
  }
  return finalize(issues)
}

export const validateOpenXcomProfile = (
  profile: OpenXcomProfile
): ValidationResult => {
  const issues: ValidationIssue[] = []
  const enginePath = requirePath(profile.enginePath, 'OpenXcom executable path')
  if (enginePath) issues.push(enginePath)
  const dataPath = requirePath(
    profile.gameDataPath,
    'Original X-COM game data path'
  )
  if (dataPath) issues.push(dataPath)
  return finalize(issues)
}

export const validateCivProfile = (profile: CivProfile): ValidationResult => {
  const issues: ValidationIssue[] = []
  const exec = requirePath(profile.executablePath, 'Engine executable path')
  if (exec) issues.push(exec)
  if (profile.launchMode === 'server' && !profile.serverPath) {
    issues.push(warning('Server mode selected but no server binary path set.'))
  }
  if (profile.engine === 'openciv1' || profile.engine === 'openciv3') {
    issues.push(info(`${profile.engine} is in active development.`))
  }
  return finalize(issues)
}

const SYSTEMS_REQUIRING_BIOS: ReadonlySet<EmulatorSystem> = new Set([
  'ps1',
  'ps2',
  'psp',
])

export const validateEmulatorProfile = (
  profile: EmulatorProfile
): ValidationResult => {
  const issues: ValidationIssue[] = []
  const enginePath = requirePath(
    profile.emulatorPath,
    'Emulator executable path'
  )
  if (enginePath) issues.push(enginePath)
  const rom = requirePath(profile.romOrDiscPath, 'ROM/ISO/disc image path')
  if (rom) issues.push(rom)
  if (SYSTEMS_REQUIRING_BIOS.has(profile.system) && !profile.biosPath) {
    issues.push(
      warning(
        `${profile.system.toUpperCase()} usually requires a BIOS dump — none configured.`
      )
    )
  }
  if (profile.emulator === 'retroarch' && !profile.coreName) {
    issues.push(error('RetroArch requires a core name (e.g. snes9x_libretro).'))
  }
  return finalize(issues)
}

export const validateN64RecompProfile = (
  profile: N64RecompProfile
): ValidationResult => {
  const issues: ValidationIssue[] = []
  if (profile.mode === 'player') {
    const exec = requirePath(
      profile.executablePath,
      'Recompiled executable path'
    )
    if (exec) issues.push(exec)
    if (!profile.romPath) {
      issues.push(
        warning(
          'No ROM/asset source set — most recomp ports need an original ROM for asset extraction.'
        )
      )
    }
  } else {
    const project = requirePath(
      profile.projectPath,
      'Recomp project source path'
    )
    if (project) issues.push(project)
    const recomp = requirePath(profile.n64RecompPath, 'N64Recomp tool path')
    if (recomp) issues.push(recomp)
    if (!profile.buildDir) {
      issues.push(warning('No build directory set — defaults will be used.'))
    }
  }
  if (profile.renderer === 'software') {
    issues.push(
      info('Software renderer selected — performance will be reduced.')
    )
  }
  return finalize(issues)
}

export const validateProfile = (
  profile: CiderDeckProfile
): ValidationResult => {
  switch (profile.helper) {
    case 'wine':
    case 'crossover':
    case 'whisky':
    case 'gptk':
      return validateCompatibilityProfile(profile as CompatibilityProfile)
    case 'doom':
      return validateDoomProfile(profile as DoomProfile)
    case 'quake':
    case 'quake2':
    case 'quake3':
      return validateQuakeProfile(profile as QuakeProfile)
    case 'gemrb':
      return validateGemRBProfile(profile as GemRBProfile)
    case 'opendiablo':
      return validateOpenDiabloProfile(profile as OpenDiabloProfile)
    case 'alephone':
      return validateAlephOneProfile(profile as AlephOneProfile)
    case 'openrct2':
      return validateOpenRCT2Profile(profile as OpenRCT2Profile)
    case 'openmw':
      return validateOpenMWProfile(profile as OpenMWProfile)
    case 'openxcom':
      return validateOpenXcomProfile(profile as OpenXcomProfile)
    case 'openciv':
      return validateCivProfile(profile as CivProfile)
    case 'emulator':
      return validateEmulatorProfile(profile as EmulatorProfile)
    case 'n64recomp':
      return validateN64RecompProfile(profile as N64RecompProfile)
    default:
      return finalize([info('No validator implemented for this helper yet.')])
  }
}
