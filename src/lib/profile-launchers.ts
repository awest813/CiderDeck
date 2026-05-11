// SPDX-License-Identifier: GPL-3.0-or-later

import type {
  AlephOneProfile,
  CiderDeckProfile,
  CivProfile,
  CompatibilityProfile,
  DoomProfile,
  EmulatorProfile,
  GemRBProfile,
  LaunchRequest,
  N64RecompProfile,
  OpenDiabloProfile,
  OpenMWProfile,
  OpenRCT2Profile,
  OpenXcomProfile,
  QuakeProfile,
} from '@/types/Profile'

const DEFAULT_WHISKY_WINE_PATH =
  '/Applications/Whisky.app/Contents/MacOS/wine64'

const cleanArgs = (parts: (string | undefined | null | false)[]): string[] =>
  parts.filter(
    (part): part is string => typeof part === 'string' && part.length > 0
  )

const cleanEnv = (
  env?: Record<string, string>
): Record<string, string> | undefined => {
  if (!env) return undefined
  const cleaned = Object.fromEntries(
    Object.entries(env).filter(
      ([key, value]) => key.trim().length > 0 && value.trim().length > 0
    )
  )
  return Object.keys(cleaned).length > 0 ? cleaned : undefined
}

export class LaunchRequestError extends Error {}

export function buildCompatibilityLaunchRequest(
  profile: CompatibilityProfile
): LaunchRequest {
  if (!profile.executablePath) {
    throw new LaunchRequestError('Executable path is required.')
  }

  const env: Record<string, string> = {
    ...(profile.environmentVariables ?? {}),
  }
  let program: string
  const args: string[] = []

  switch (profile.backend) {
    case 'wine':
      program = profile.wineExecutablePath || 'wine'
      if (profile.bottlePath) {
        env.WINEPREFIX = profile.bottlePath
      }
      args.push(profile.executablePath)
      break
    case 'crossover':
      program =
        '/Applications/CrossOver.app/Contents/SharedSupport/CrossOver/bin/wine'
      if (profile.bottlePath) {
        args.push('--bottle', profile.bottlePath)
      }
      args.push('--', profile.executablePath)
      break
    case 'whisky':
      program = profile.wineExecutablePath || DEFAULT_WHISKY_WINE_PATH
      if (profile.bottlePath) {
        env.WINEPREFIX = profile.bottlePath
      }
      args.push(profile.executablePath)
      break
    case 'gptk':
      program = 'gameportingtoolkit'
      if (profile.bottlePath) {
        args.push(profile.bottlePath)
      }
      args.push(profile.executablePath)
      break
  }

  if (profile.launchArgs) args.push(...profile.launchArgs)

  return {
    executablePath: program,
    args,
    envVars: cleanEnv(env),
  }
}

export function buildDoomLaunchRequest(profile: DoomProfile): LaunchRequest {
  if (!profile.enginePath) {
    throw new LaunchRequestError('Doom engine path is required.')
  }

  const args: string[] = []
  if (profile.iwadPath) args.push('-iwad', profile.iwadPath)

  const fileArgs = [
    ...(profile.pwadPaths ?? []),
    ...(profile.modPaths ?? []),
  ].filter(path => path.length > 0)
  if (fileArgs.length > 0) {
    args.push('-file', ...fileArgs)
  }

  if (profile.configPath) args.push('-config', profile.configPath)
  if (profile.launchArgs) args.push(...profile.launchArgs)

  return {
    executablePath: profile.enginePath,
    args,
  }
}

export function buildQuakeLaunchRequest(profile: QuakeProfile): LaunchRequest {
  if (!profile.enginePath) {
    throw new LaunchRequestError('Quake engine path is required.')
  }

  const args: string[] = []
  if (profile.gameDataPath) args.push('-basedir', profile.gameDataPath)
  if (profile.gameDir) args.push('-game', profile.gameDir)
  if (profile.modDir && profile.modDir !== profile.gameDir) {
    args.push('+gamedir', profile.modDir)
  }
  if (profile.launchArgs) args.push(...profile.launchArgs)

  return {
    executablePath: profile.enginePath,
    args,
  }
}

export function buildGemRBLaunchRequest(profile: GemRBProfile): LaunchRequest {
  if (!profile.gemRBPath) {
    throw new LaunchRequestError('GemRB executable path is required.')
  }

  const args: string[] = []
  if (profile.configPath) args.push('-c', profile.configPath)
  if (profile.launchArgs) args.push(...profile.launchArgs)

  return {
    executablePath: profile.gemRBPath,
    args,
  }
}

export function buildOpenDiabloLaunchRequest(
  profile: OpenDiabloProfile
): LaunchRequest {
  if (!profile.enginePath) {
    throw new LaunchRequestError('OpenDiablo engine path is required.')
  }

  const args: string[] = []
  if (profile.engine === 'devilutionx') {
    if (profile.gameDataPath) args.push('--data-dir', profile.gameDataPath)
    if (profile.savePath) args.push('--save-dir', profile.savePath)
    if (profile.configPath) args.push('--config-dir', profile.configPath)
    if (profile.fullscreen === false) args.push('-w')
  } else if (
    profile.engine === 'opendiablo2' ||
    profile.engine === 'abyssengine-opendiablo2'
  ) {
    if (profile.gameDataPath) args.push('--mpqdir', profile.gameDataPath)
  }

  if (profile.launchArgs) args.push(...profile.launchArgs)

  return {
    executablePath: profile.enginePath,
    args,
    envVars: cleanEnv(profile.environmentVariables),
  }
}

export function buildAlephOneLaunchRequest(
  profile: AlephOneProfile
): LaunchRequest {
  if (!profile.alephOnePath) {
    throw new LaunchRequestError('Aleph One executable path is required.')
  }

  const args = cleanArgs([profile.scenarioPath, ...(profile.launchArgs ?? [])])

  return {
    executablePath: profile.alephOnePath,
    args,
  }
}

export function buildOpenRCT2LaunchRequest(
  profile: OpenRCT2Profile
): LaunchRequest {
  if (!profile.openRCT2Path) {
    throw new LaunchRequestError('OpenRCT2 executable path is required.')
  }

  const args: string[] = []
  if (profile.gameDataPath) {
    args.push('--openrct2-data-path', profile.gameDataPath)
  }
  if (profile.launchArgs) args.push(...profile.launchArgs)

  return {
    executablePath: profile.openRCT2Path,
    args,
  }
}

export function buildOpenMWLaunchRequest(
  profile: OpenMWProfile
): LaunchRequest {
  if (!profile.enginePath) {
    throw new LaunchRequestError('OpenMW executable path is required.')
  }

  const args: string[] = []
  if (profile.configPath) args.push('--config', profile.configPath)
  if (profile.gameDataPath) args.push('--data', profile.gameDataPath)
  if (profile.userDataPath) args.push('--user-data', profile.userDataPath)
  if (profile.resourcesPath) args.push('--resources', profile.resourcesPath)
  if (profile.loadSavegamePath) {
    args.push('--load-savegame', profile.loadSavegamePath)
  }
  if (profile.fullscreen === false) {
    args.push('--fullscreen=false')
  }
  if (profile.launchArgs) args.push(...profile.launchArgs)

  return {
    executablePath: profile.enginePath,
    args,
  }
}

export function buildOpenXcomLaunchRequest(
  profile: OpenXcomProfile
): LaunchRequest {
  if (!profile.enginePath) {
    throw new LaunchRequestError('OpenXcom executable path is required.')
  }

  const args: string[] = []
  if (profile.gameDataPath) args.push('-data', profile.gameDataPath)
  if (profile.userDataPath) args.push('-user', profile.userDataPath)
  if (profile.launchArgs) args.push(...profile.launchArgs)

  return {
    executablePath: profile.enginePath,
    args,
  }
}

export function buildCivLaunchRequest(profile: CivProfile): LaunchRequest {
  if (!profile.executablePath) {
    throw new LaunchRequestError('Civ engine path is required.')
  }

  const args: string[] = []
  if (profile.engine === 'freeciv' || profile.engine === 'freeciv-web') {
    if (profile.ruleset) args.push('--ruleset', profile.ruleset)
    if (profile.dataPath) args.push('--read', profile.dataPath)
    if (profile.launchMode === 'server' && profile.serverPath) {
      args.push('--server', profile.serverPath)
    }
  }
  if (profile.launchArgs) args.push(...profile.launchArgs)

  return {
    executablePath: profile.executablePath,
    args,
  }
}

export function buildEmulatorLaunchRequest(
  profile: EmulatorProfile
): LaunchRequest {
  if (!profile.emulatorPath) {
    throw new LaunchRequestError('Emulator path is required.')
  }

  const args: string[] = []

  switch (profile.emulator) {
    case 'retroarch':
      if (profile.coreName) args.push('-L', profile.coreName)
      if (profile.configPath) args.push('-c', profile.configPath)
      if (profile.romOrDiscPath) args.push(profile.romOrDiscPath)
      break
    case 'dosbox-staging':
    case 'dosbox-x':
      if (profile.configPath) args.push('-conf', profile.configPath)
      if (profile.romOrDiscPath) args.push(profile.romOrDiscPath)
      break
    case 'dolphin':
      if (profile.romOrDiscPath) args.push('-e', profile.romOrDiscPath)
      break
    case 'pcsx2':
      if (profile.romOrDiscPath) args.push('--', profile.romOrDiscPath)
      break
    case 'duckstation':
      if (profile.romOrDiscPath) args.push('-fastboot', profile.romOrDiscPath)
      break
    case 'ppsspp':
    case 'mame':
    case 'ares':
    case 'custom':
    default:
      if (profile.romOrDiscPath) args.push(profile.romOrDiscPath)
      break
  }

  if (profile.launchArgs) args.push(...profile.launchArgs)

  return {
    executablePath: profile.emulatorPath,
    args,
  }
}

export function buildN64RecompLaunchRequest(
  profile: N64RecompProfile
): LaunchRequest {
  if (profile.mode === 'developer') {
    if (!profile.projectPath) {
      throw new LaunchRequestError(
        'Recomp project path is required in developer mode.'
      )
    }
    // Developer mode doesn't launch a game directly; this returns a default
    // "describe environment" command. Use run_build_step for actual builds.
    return {
      executablePath: 'echo',
      args: cleanArgs([
        'CiderDeck N64Recomp developer mode -',
        profile.projectPath,
      ]),
      envVars: cleanEnv(profile.environmentVariables),
      workingDir: profile.projectPath,
    }
  }

  if (!profile.executablePath) {
    throw new LaunchRequestError(
      'Recompiled executable path is required in player mode.'
    )
  }

  const args: string[] = []
  if (profile.romPath) args.push('--rom', profile.romPath)
  if (profile.configPath) args.push('--config', profile.configPath)
  if (profile.savePath) args.push('--save', profile.savePath)
  if (profile.renderer) args.push('--renderer', profile.renderer)
  if (profile.launchArgs) args.push(...profile.launchArgs)

  return {
    executablePath: profile.executablePath,
    args,
    envVars: cleanEnv(profile.environmentVariables),
  }
}

export function buildLaunchRequest(profile: CiderDeckProfile): LaunchRequest {
  switch (profile.helper) {
    case 'wine':
    case 'crossover':
    case 'whisky':
    case 'gptk':
      return buildCompatibilityLaunchRequest(profile as CompatibilityProfile)
    case 'doom':
      return buildDoomLaunchRequest(profile as DoomProfile)
    case 'quake':
    case 'quake2':
    case 'quake3':
      return buildQuakeLaunchRequest(profile as QuakeProfile)
    case 'gemrb':
      return buildGemRBLaunchRequest(profile as GemRBProfile)
    case 'opendiablo':
      return buildOpenDiabloLaunchRequest(profile as OpenDiabloProfile)
    case 'alephone':
      return buildAlephOneLaunchRequest(profile as AlephOneProfile)
    case 'openrct2':
      return buildOpenRCT2LaunchRequest(profile as OpenRCT2Profile)
    case 'openmw':
      return buildOpenMWLaunchRequest(profile as OpenMWProfile)
    case 'openxcom':
      return buildOpenXcomLaunchRequest(profile as OpenXcomProfile)
    case 'openciv':
      return buildCivLaunchRequest(profile as CivProfile)
    case 'emulator':
      return buildEmulatorLaunchRequest(profile as EmulatorProfile)
    case 'n64recomp':
      return buildN64RecompLaunchRequest(profile as N64RecompProfile)
    default:
      throw new LaunchRequestError(
        `No launch builder implemented for helper "${(profile as CiderDeckProfile).helper}".`
      )
  }
}
