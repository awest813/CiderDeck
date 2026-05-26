// SPDX-License-Identifier: GPL-3.0-or-later

export type HelperCategory =
  | 'compatibility-layer'
  | 'source-port'
  | 'strategy-sim'
  | 'emulator'
  | 'recompilation'
  | 'custom'

export type HelperId =
  | 'wine'
  | 'crossover'
  | 'whisky'
  | 'gptk'
  | 'doom'
  | 'quake'
  | 'quake2'
  | 'quake3'
  | 'build-engine'
  | 'alephone'
  | 'gemrb'
  | 'opendiablo'
  | 'openmw'
  | 'openrct2'
  | 'openra'
  | 'scummvm'
  | 'openxcom'
  | 'openciv'
  | 'openttd'
  | 'corsixth'
  | 'julius'
  | 'augustus'
  | 'emulator'
  | 'n64recomp'
  | 'custom'

export type ProfileStatus =
  | 'unconfigured'
  | 'missing-engine'
  | 'missing-data'
  | 'missing-rom'
  | 'missing-bios'
  | 'ready'
  | 'boots'
  | 'playable'
  | 'experimental'
  | 'broken'

export interface BaseProfile {
  id: string
  title: string
  category: HelperCategory
  helper: HelperId
  status: ProfileStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export const COMPATIBILITY_BACKENDS = [
  'wine',
  'crossover',
  'whisky',
  'gptk',
  'custom',
] as const

export type CompatibilityBackend = (typeof COMPATIBILITY_BACKENDS)[number]

export interface CompatibilityProfile extends BaseProfile {
  category: 'compatibility-layer'
  helper: 'wine' | 'crossover' | 'whisky' | 'gptk' | 'custom'
  backend: CompatibilityBackend
  wineExecutablePath?: string
  executablePath?: string
  bottlePath?: string
  launchArgs?: string[]
  environmentVariables?: Record<string, string>
}

export type DoomEngine =
  | 'gzdoom'
  | 'dsda-doom'
  | 'woof'
  | 'chocolate-doom'
  | 'crispy-doom'
  | 'custom'

export interface DoomProfile extends BaseProfile {
  category: 'source-port'
  helper: 'doom'
  engine: DoomEngine
  enginePath?: string
  iwadPath?: string
  pwadPaths?: string[]
  modPaths?: string[]
  configPath?: string
  launchArgs?: string[]
}

export type QuakeFamily = 'quake1' | 'quake2' | 'quake3'

export type QuakeEngine =
  | 'ironwail'
  | 'vkquake'
  | 'vkmacquake'
  | 'quakespasm'
  | 'quakespasm-spiked'
  | 'qss-m'
  | 'darkplaces'
  | 'fteqw'
  | 'yamagi-quake2'
  | 'vkquake2'
  | 'ioquake3'
  | 'spearmint'
  | 'custom'

export interface QuakeProfile extends BaseProfile {
  category: 'source-port'
  helper: 'quake' | 'quake2' | 'quake3'
  family: QuakeFamily
  engine: QuakeEngine
  enginePath?: string
  gameDataPath?: string
  gameDir?: string
  modDir?: string
  launchArgs?: string[]
}

export type InfinityGame = 'bg1' | 'bg2' | 'iwd1' | 'iwd2' | 'pst' | 'custom'

export interface GemRBProfile extends BaseProfile {
  category: 'source-port'
  helper: 'gemrb'
  game: InfinityGame
  gemRBPath?: string
  gameDataPath?: string
  configPath?: string
  savePath?: string
  cachePath?: string
  language?: string
  fullscreen?: boolean
  width?: number
  height?: number
  moddedInstall?: boolean
  launchArgs?: string[]
}

export type DiabloGame =
  | 'diablo1'
  | 'hellfire'
  | 'diablo2'
  | 'lord-of-destruction'
  | 'custom'

export type DiabloEngine =
  | 'devilutionx'
  | 'opendiablo2'
  | 'abyssengine-opendiablo2'
  | 'wine'
  | 'custom'

export interface OpenDiabloProfile extends BaseProfile {
  category: 'source-port'
  helper: 'opendiablo'
  game: DiabloGame
  engine: DiabloEngine
  enginePath?: string
  gameDataPath?: string
  mpqPaths?: string[]
  configPath?: string
  savePath?: string
  cachePath?: string
  fullscreen?: boolean
  width?: number
  height?: number
  launchArgs?: string[]
  environmentVariables?: Record<string, string>
}

export type MarathonScenario =
  | 'marathon'
  | 'marathon-2'
  | 'marathon-infinity'
  | 'third-party'
  | 'custom'

export interface AlephOneProfile extends BaseProfile {
  category: 'source-port'
  helper: 'alephone'
  scenario: MarathonScenario
  alephOnePath?: string
  scenarioPath?: string
  scriptsPath?: string
  savePath?: string
  fullscreen?: boolean
  width?: number
  height?: number
  launchArgs?: string[]
}

export interface OpenRCT2Profile extends BaseProfile {
  category: 'source-port'
  helper: 'openrct2'
  openRCT2Path?: string
  gameDataPath?: string
  savesPath?: string
  scenariosPath?: string
  launchArgs?: string[]
}

export interface OpenMWProfile extends BaseProfile {
  category: 'source-port'
  helper: 'openmw'
  enginePath?: string
  gameDataPath?: string
  configPath?: string
  userDataPath?: string
  savePath?: string
  resourcesPath?: string
  loadSavegamePath?: string
  fullscreen?: boolean
  width?: number
  height?: number
  launchArgs?: string[]
}

export type XcomGame =
  | 'ufo-defense'
  | 'enemy-unknown'
  | 'terror-from-the-deep'
  | 'custom'

export interface OpenXcomProfile extends BaseProfile {
  category: 'strategy-sim'
  helper: 'openxcom'
  game: XcomGame
  enginePath?: string
  gameDataPath?: string
  userDataPath?: string
  modPath?: string
  launchArgs?: string[]
}

export type CivEngine =
  | 'freeciv'
  | 'freeciv-web'
  | 'openciv1'
  | 'openciv3'
  | 'custom'

export type CivLaunchMode =
  | 'singleplayer'
  | 'multiplayer-client'
  | 'server'
  | 'web'

export interface CivProfile extends BaseProfile {
  category: 'strategy-sim'
  helper: 'openciv'
  engine: CivEngine
  executablePath?: string
  dataPath?: string
  configPath?: string
  savePath?: string
  serverPath?: string
  ruleset?: string
  launchMode?: CivLaunchMode
  launchArgs?: string[]
}

export type EmulatorEngine =
  | 'dosbox-staging'
  | 'dosbox-x'
  | 'ppsspp'
  | 'dolphin'
  | 'pcsx2'
  | 'duckstation'
  | 'retroarch'
  | 'mame'
  | 'ares'
  | 'custom'

export type EmulatorSystem =
  | 'dos'
  | 'psp'
  | 'gamecube'
  | 'wii'
  | 'ps2'
  | 'ps1'
  | 'arcade'
  | 'snes'
  | 'n64'
  | 'gba'
  | 'custom'

export interface EmulatorProfile extends BaseProfile {
  category: 'emulator'
  helper: 'emulator'
  system: EmulatorSystem
  emulator: EmulatorEngine
  emulatorPath?: string
  romOrDiscPath?: string
  biosPath?: string
  configPath?: string
  savePath?: string
  coreName?: string
  launchArgs?: string[]
}

export type N64RecompMode = 'player' | 'developer'

export type N64RecompRenderer = 'rt64' | 'software' | 'custom'

export interface N64RecompProfile extends BaseProfile {
  category: 'recompilation'
  helper: 'n64recomp'
  mode: N64RecompMode

  executablePath?: string
  romPath?: string
  generatedAssetPath?: string
  configPath?: string
  savePath?: string

  projectPath?: string
  n64RecompPath?: string
  n64ModernRuntimePath?: string
  rt64Path?: string
  buildDir?: string
  cmakePreset?: string
  symbolFilePath?: string
  generatedSourceDir?: string

  renderer?: N64RecompRenderer
  launchArgs?: string[]
  environmentVariables?: Record<string, string>
}

export type CiderDeckProfile =
  | CompatibilityProfile
  | DoomProfile
  | QuakeProfile
  | GemRBProfile
  | OpenDiabloProfile
  | AlephOneProfile
  | OpenRCT2Profile
  | OpenMWProfile
  | OpenXcomProfile
  | CivProfile
  | EmulatorProfile
  | N64RecompProfile

export interface ProfileLogEntry {
  id: string
  profileId: string
  createdAt: string
  command: string
  stdout: string
  stderr: string
  exitCode: number | null
}

export interface LaunchRequest {
  executablePath: string
  args: string[]
  envVars?: Record<string, string>
  workingDir?: string
}
