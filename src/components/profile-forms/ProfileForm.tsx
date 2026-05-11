// SPDX-License-Identifier: GPL-3.0-or-later

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { newProfileTimestamps } from '@/lib/profile-storage'
import {
  joinArgs,
  joinMultiline,
  parseEnvText,
  splitArgs,
  splitMultiline,
  STATUS_OPTIONS,
  stringifyEnv,
} from '@/components/profile-forms/shared'
import { helperLabel } from '@/lib/helper-catalog'
import { COMPATIBILITY_BACKENDS } from '@/types/Profile'
import type {
  AlephOneProfile,
  CiderDeckProfile,
  CivProfile,
  CompatibilityBackend,
  CompatibilityProfile,
  DiabloEngine,
  DiabloGame,
  DoomEngine,
  DoomProfile,
  EmulatorEngine,
  EmulatorProfile,
  EmulatorSystem,
  GemRBProfile,
  HelperCategory,
  HelperId,
  InfinityGame,
  MarathonScenario,
  N64RecompMode,
  N64RecompProfile,
  N64RecompRenderer,
  OpenDiabloProfile,
  OpenMWProfile,
  OpenRCT2Profile,
  OpenXcomProfile,
  ProfileStatus,
  QuakeEngine,
  QuakeFamily,
  QuakeProfile,
  XcomGame,
  CivEngine,
  CivLaunchMode,
} from '@/types/Profile'

interface ProfileFormProps {
  helper: HelperId
  category: HelperCategory
  initial?: CiderDeckProfile
  onSubmit: (profile: CiderDeckProfile) => void
  onCancel?: () => void
  submitLabel?: string
}

interface FormState {
  title: string
  status: ProfileStatus
  notes: string
  // generic shared fields
  executablePath: string
  bottlePath: string
  gameDataPath: string
  configPath: string
  savePath: string
  cachePath: string
  scenarioPath: string
  scriptsPath: string
  modPath: string
  modPaths: string
  pwadPaths: string
  mpqPaths: string
  iwadPath: string
  romOrDiscPath: string
  biosPath: string
  coreName: string
  romPath: string
  generatedAssetPath: string
  projectPath: string
  n64RecompPath: string
  n64ModernRuntimePath: string
  rt64Path: string
  buildDir: string
  cmakePreset: string
  symbolFilePath: string
  generatedSourceDir: string
  serverPath: string
  ruleset: string
  dataPath: string
  openRCT2Path: string
  savesPath: string
  scenariosPath: string
  resourcesPath: string
  loadSavegamePath: string
  enginePath: string
  alephOnePath: string
  gemRBPath: string
  emulatorPath: string
  userDataPath: string
  gameDir: string
  modDir: string
  // selectors
  backend: CompatibilityBackend
  doomEngine: DoomEngine
  quakeFamily: QuakeFamily
  quakeEngine: QuakeEngine
  infinityGame: InfinityGame
  diabloGame: DiabloGame
  diabloEngine: DiabloEngine
  marathonScenario: MarathonScenario
  xcomGame: XcomGame
  civEngine: CivEngine
  civMode: CivLaunchMode
  emulatorEngine: EmulatorEngine
  emulatorSystem: EmulatorSystem
  n64Mode: N64RecompMode
  n64Renderer: N64RecompRenderer
  // misc
  language: string
  fullscreen: boolean
  width: string
  height: string
  moddedInstall: boolean
  launchArgs: string
  envVars: string
}

const isCompatibilityHelper = (
  helper: HelperId
): helper is CompatibilityBackend =>
  COMPATIBILITY_BACKENDS.includes(helper as CompatibilityBackend)

const emptyState = (): FormState => ({
  title: '',
  status: 'unconfigured',
  notes: '',
  executablePath: '',
  bottlePath: '',
  gameDataPath: '',
  configPath: '',
  savePath: '',
  cachePath: '',
  scenarioPath: '',
  scriptsPath: '',
  modPath: '',
  modPaths: '',
  pwadPaths: '',
  mpqPaths: '',
  iwadPath: '',
  romOrDiscPath: '',
  biosPath: '',
  coreName: '',
  romPath: '',
  generatedAssetPath: '',
  projectPath: '',
  n64RecompPath: '',
  n64ModernRuntimePath: '',
  rt64Path: '',
  buildDir: '',
  cmakePreset: '',
  symbolFilePath: '',
  generatedSourceDir: '',
  serverPath: '',
  ruleset: '',
  dataPath: '',
  openRCT2Path: '',
  savesPath: '',
  scenariosPath: '',
  resourcesPath: '',
  loadSavegamePath: '',
  enginePath: '',
  alephOnePath: '',
  gemRBPath: '',
  emulatorPath: '',
  userDataPath: '',
  gameDir: '',
  modDir: '',
  backend: 'wine',
  doomEngine: 'gzdoom',
  quakeFamily: 'quake1',
  quakeEngine: 'quakespasm',
  infinityGame: 'bg2',
  diabloGame: 'diablo1',
  diabloEngine: 'devilutionx',
  marathonScenario: 'marathon-infinity',
  xcomGame: 'ufo-defense',
  civEngine: 'freeciv',
  civMode: 'singleplayer',
  emulatorEngine: 'retroarch',
  emulatorSystem: 'snes',
  n64Mode: 'player',
  n64Renderer: 'rt64',
  language: '',
  fullscreen: true,
  width: '',
  height: '',
  moddedInstall: false,
  launchArgs: '',
  envVars: '',
})

const stateFromHelper = (helper: HelperId): FormState => {
  const base = emptyState()
  if (isCompatibilityHelper(helper)) {
    base.backend = helper
  }
  return base
}

const stateFromProfile = (profile: CiderDeckProfile): FormState => {
  const base = emptyState()
  base.title = profile.title
  base.status = profile.status
  base.notes = profile.notes ?? ''

  switch (profile.helper) {
    case 'wine':
    case 'crossover':
    case 'whisky':
    case 'gptk': {
      const p = profile as CompatibilityProfile
      base.backend = p.backend
      base.executablePath = p.executablePath ?? ''
      base.bottlePath = p.bottlePath ?? ''
      base.launchArgs = joinArgs(p.launchArgs)
      base.envVars = stringifyEnv(p.environmentVariables)
      break
    }
    case 'doom': {
      const p = profile as DoomProfile
      base.doomEngine = p.engine
      base.enginePath = p.enginePath ?? ''
      base.iwadPath = p.iwadPath ?? ''
      base.pwadPaths = joinMultiline(p.pwadPaths)
      base.modPaths = joinMultiline(p.modPaths)
      base.configPath = p.configPath ?? ''
      base.launchArgs = joinArgs(p.launchArgs)
      break
    }
    case 'quake':
    case 'quake2':
    case 'quake3': {
      const p = profile as QuakeProfile
      base.quakeFamily = p.family
      base.quakeEngine = p.engine
      base.enginePath = p.enginePath ?? ''
      base.gameDataPath = p.gameDataPath ?? ''
      base.gameDir = p.gameDir ?? ''
      base.modDir = p.modDir ?? ''
      base.launchArgs = joinArgs(p.launchArgs)
      break
    }
    case 'gemrb': {
      const p = profile as GemRBProfile
      base.infinityGame = p.game
      base.gemRBPath = p.gemRBPath ?? ''
      base.gameDataPath = p.gameDataPath ?? ''
      base.configPath = p.configPath ?? ''
      base.savePath = p.savePath ?? ''
      base.cachePath = p.cachePath ?? ''
      base.language = p.language ?? ''
      base.fullscreen = p.fullscreen ?? true
      base.width = p.width ? String(p.width) : ''
      base.height = p.height ? String(p.height) : ''
      base.moddedInstall = p.moddedInstall ?? false
      base.launchArgs = joinArgs(p.launchArgs)
      break
    }
    case 'opendiablo': {
      const p = profile as OpenDiabloProfile
      base.diabloGame = p.game
      base.diabloEngine = p.engine
      base.enginePath = p.enginePath ?? ''
      base.gameDataPath = p.gameDataPath ?? ''
      base.mpqPaths = joinMultiline(p.mpqPaths)
      base.configPath = p.configPath ?? ''
      base.savePath = p.savePath ?? ''
      base.cachePath = p.cachePath ?? ''
      base.fullscreen = p.fullscreen ?? true
      base.width = p.width ? String(p.width) : ''
      base.height = p.height ? String(p.height) : ''
      base.launchArgs = joinArgs(p.launchArgs)
      base.envVars = stringifyEnv(p.environmentVariables)
      break
    }
    case 'alephone': {
      const p = profile as AlephOneProfile
      base.marathonScenario = p.scenario
      base.alephOnePath = p.alephOnePath ?? ''
      base.scenarioPath = p.scenarioPath ?? ''
      base.scriptsPath = p.scriptsPath ?? ''
      base.savePath = p.savePath ?? ''
      base.fullscreen = p.fullscreen ?? true
      base.width = p.width ? String(p.width) : ''
      base.height = p.height ? String(p.height) : ''
      base.launchArgs = joinArgs(p.launchArgs)
      break
    }
    case 'openrct2': {
      const p = profile as OpenRCT2Profile
      base.openRCT2Path = p.openRCT2Path ?? ''
      base.gameDataPath = p.gameDataPath ?? ''
      base.savesPath = p.savesPath ?? ''
      base.scenariosPath = p.scenariosPath ?? ''
      base.launchArgs = joinArgs(p.launchArgs)
      break
    }
    case 'openmw': {
      const p = profile as OpenMWProfile
      base.enginePath = p.enginePath ?? ''
      base.gameDataPath = p.gameDataPath ?? ''
      base.configPath = p.configPath ?? ''
      base.userDataPath = p.userDataPath ?? ''
      base.savePath = p.savePath ?? ''
      base.resourcesPath = p.resourcesPath ?? ''
      base.loadSavegamePath = p.loadSavegamePath ?? ''
      base.fullscreen = p.fullscreen ?? true
      base.width = p.width ? String(p.width) : ''
      base.height = p.height ? String(p.height) : ''
      base.launchArgs = joinArgs(p.launchArgs)
      break
    }
    case 'openxcom': {
      const p = profile as OpenXcomProfile
      base.xcomGame = p.game
      base.enginePath = p.enginePath ?? ''
      base.gameDataPath = p.gameDataPath ?? ''
      base.userDataPath = p.userDataPath ?? ''
      base.modPath = p.modPath ?? ''
      base.launchArgs = joinArgs(p.launchArgs)
      break
    }
    case 'openciv': {
      const p = profile as CivProfile
      base.civEngine = p.engine
      base.civMode = p.launchMode ?? 'singleplayer'
      base.executablePath = p.executablePath ?? ''
      base.dataPath = p.dataPath ?? ''
      base.configPath = p.configPath ?? ''
      base.savePath = p.savePath ?? ''
      base.serverPath = p.serverPath ?? ''
      base.ruleset = p.ruleset ?? ''
      base.launchArgs = joinArgs(p.launchArgs)
      break
    }
    case 'emulator': {
      const p = profile as EmulatorProfile
      base.emulatorEngine = p.emulator
      base.emulatorSystem = p.system
      base.emulatorPath = p.emulatorPath ?? ''
      base.romOrDiscPath = p.romOrDiscPath ?? ''
      base.biosPath = p.biosPath ?? ''
      base.configPath = p.configPath ?? ''
      base.savePath = p.savePath ?? ''
      base.coreName = p.coreName ?? ''
      base.launchArgs = joinArgs(p.launchArgs)
      break
    }
    case 'n64recomp': {
      const p = profile as N64RecompProfile
      base.n64Mode = p.mode
      base.n64Renderer = p.renderer ?? 'rt64'
      base.executablePath = p.executablePath ?? ''
      base.romPath = p.romPath ?? ''
      base.generatedAssetPath = p.generatedAssetPath ?? ''
      base.configPath = p.configPath ?? ''
      base.savePath = p.savePath ?? ''
      base.projectPath = p.projectPath ?? ''
      base.n64RecompPath = p.n64RecompPath ?? ''
      base.n64ModernRuntimePath = p.n64ModernRuntimePath ?? ''
      base.rt64Path = p.rt64Path ?? ''
      base.buildDir = p.buildDir ?? ''
      base.cmakePreset = p.cmakePreset ?? ''
      base.symbolFilePath = p.symbolFilePath ?? ''
      base.generatedSourceDir = p.generatedSourceDir ?? ''
      base.launchArgs = joinArgs(p.launchArgs)
      base.envVars = stringifyEnv(p.environmentVariables)
      break
    }
    default:
      break
  }
  return base
}

const Field = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => (
  <label className="block space-y-2 text-sm font-medium">
    <span>{label}</span>
    {children}
  </label>
)

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full rounded-md border bg-background px-3 py-2 ${props.className ?? ''}`}
  />
)

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={`min-h-20 w-full rounded-md border bg-background px-3 py-2 ${props.className ?? ''}`}
  />
)

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={`w-full rounded-md border bg-background px-3 py-2 capitalize ${props.className ?? ''}`}
  />
)

const buildProfile = (
  helper: HelperId,
  category: HelperCategory,
  state: FormState,
  initial?: CiderDeckProfile
): CiderDeckProfile => {
  const meta = initial
    ? { id: initial.id, createdAt: initial.createdAt }
    : newProfileTimestamps()
  const updatedAt = new Date().toISOString()
  const widthValue = state.width ? Number(state.width) : undefined
  const heightValue = state.height ? Number(state.height) : undefined

  const baseFields = {
    id: meta.id,
    title: state.title.trim() || 'Untitled profile',
    status: state.status,
    notes: state.notes.trim() || undefined,
    createdAt: 'createdAt' in meta ? meta.createdAt : updatedAt,
    updatedAt,
  }

  const launchArgs = splitArgs(state.launchArgs)
  const launchArgsField =
    launchArgs.length > 0 ? { launchArgs } : { launchArgs: undefined }

  switch (helper) {
    case 'wine':
    case 'crossover':
    case 'whisky':
    case 'gptk':
      return {
        ...baseFields,
        category: 'compatibility-layer',
        helper,
        backend: state.backend,
        executablePath: state.executablePath.trim() || undefined,
        bottlePath: state.bottlePath.trim() || undefined,
        environmentVariables: parseEnvText(state.envVars),
        ...launchArgsField,
      } as CompatibilityProfile
    case 'doom':
      return {
        ...baseFields,
        category: 'source-port',
        helper: 'doom',
        engine: state.doomEngine,
        enginePath: state.enginePath.trim() || undefined,
        iwadPath: state.iwadPath.trim() || undefined,
        pwadPaths: splitMultiline(state.pwadPaths),
        modPaths: splitMultiline(state.modPaths),
        configPath: state.configPath.trim() || undefined,
        ...launchArgsField,
      } as DoomProfile
    case 'quake':
    case 'quake2':
    case 'quake3':
      return {
        ...baseFields,
        category: 'source-port',
        helper,
        family: state.quakeFamily,
        engine: state.quakeEngine,
        enginePath: state.enginePath.trim() || undefined,
        gameDataPath: state.gameDataPath.trim() || undefined,
        gameDir: state.gameDir.trim() || undefined,
        modDir: state.modDir.trim() || undefined,
        ...launchArgsField,
      } as QuakeProfile
    case 'gemrb':
      return {
        ...baseFields,
        category: 'source-port',
        helper: 'gemrb',
        game: state.infinityGame,
        gemRBPath: state.gemRBPath.trim() || undefined,
        gameDataPath: state.gameDataPath.trim() || undefined,
        configPath: state.configPath.trim() || undefined,
        savePath: state.savePath.trim() || undefined,
        cachePath: state.cachePath.trim() || undefined,
        language: state.language.trim() || undefined,
        fullscreen: state.fullscreen,
        width: widthValue,
        height: heightValue,
        moddedInstall: state.moddedInstall,
        ...launchArgsField,
      } as GemRBProfile
    case 'opendiablo':
      return {
        ...baseFields,
        category: 'source-port',
        helper: 'opendiablo',
        game: state.diabloGame,
        engine: state.diabloEngine,
        enginePath: state.enginePath.trim() || undefined,
        gameDataPath: state.gameDataPath.trim() || undefined,
        mpqPaths: splitMultiline(state.mpqPaths),
        configPath: state.configPath.trim() || undefined,
        savePath: state.savePath.trim() || undefined,
        cachePath: state.cachePath.trim() || undefined,
        fullscreen: state.fullscreen,
        width: widthValue,
        height: heightValue,
        environmentVariables: parseEnvText(state.envVars),
        ...launchArgsField,
      } as OpenDiabloProfile
    case 'alephone':
      return {
        ...baseFields,
        category: 'source-port',
        helper: 'alephone',
        scenario: state.marathonScenario,
        alephOnePath: state.alephOnePath.trim() || undefined,
        scenarioPath: state.scenarioPath.trim() || undefined,
        scriptsPath: state.scriptsPath.trim() || undefined,
        savePath: state.savePath.trim() || undefined,
        fullscreen: state.fullscreen,
        width: widthValue,
        height: heightValue,
        ...launchArgsField,
      } as AlephOneProfile
    case 'openrct2':
      return {
        ...baseFields,
        category: 'source-port',
        helper: 'openrct2',
        openRCT2Path: state.openRCT2Path.trim() || undefined,
        gameDataPath: state.gameDataPath.trim() || undefined,
        savesPath: state.savesPath.trim() || undefined,
        scenariosPath: state.scenariosPath.trim() || undefined,
        ...launchArgsField,
      } as OpenRCT2Profile
    case 'openmw':
      return {
        ...baseFields,
        category: 'source-port',
        helper: 'openmw',
        enginePath: state.enginePath.trim() || undefined,
        gameDataPath: state.gameDataPath.trim() || undefined,
        configPath: state.configPath.trim() || undefined,
        userDataPath: state.userDataPath.trim() || undefined,
        savePath: state.savePath.trim() || undefined,
        resourcesPath: state.resourcesPath.trim() || undefined,
        loadSavegamePath: state.loadSavegamePath.trim() || undefined,
        fullscreen: state.fullscreen,
        width: widthValue,
        height: heightValue,
        ...launchArgsField,
      } as OpenMWProfile
    case 'openxcom':
      return {
        ...baseFields,
        category: 'strategy-sim',
        helper: 'openxcom',
        game: state.xcomGame,
        enginePath: state.enginePath.trim() || undefined,
        gameDataPath: state.gameDataPath.trim() || undefined,
        userDataPath: state.userDataPath.trim() || undefined,
        modPath: state.modPath.trim() || undefined,
        ...launchArgsField,
      } as OpenXcomProfile
    case 'openciv':
      return {
        ...baseFields,
        category: 'strategy-sim',
        helper: 'openciv',
        engine: state.civEngine,
        executablePath: state.executablePath.trim() || undefined,
        dataPath: state.dataPath.trim() || undefined,
        configPath: state.configPath.trim() || undefined,
        savePath: state.savePath.trim() || undefined,
        serverPath: state.serverPath.trim() || undefined,
        ruleset: state.ruleset.trim() || undefined,
        launchMode: state.civMode,
        ...launchArgsField,
      } as CivProfile
    case 'emulator':
      return {
        ...baseFields,
        category: 'emulator',
        helper: 'emulator',
        system: state.emulatorSystem,
        emulator: state.emulatorEngine,
        emulatorPath: state.emulatorPath.trim() || undefined,
        romOrDiscPath: state.romOrDiscPath.trim() || undefined,
        biosPath: state.biosPath.trim() || undefined,
        configPath: state.configPath.trim() || undefined,
        savePath: state.savePath.trim() || undefined,
        coreName: state.coreName.trim() || undefined,
        ...launchArgsField,
      } as EmulatorProfile
    case 'n64recomp':
      return {
        ...baseFields,
        category: 'recompilation',
        helper: 'n64recomp',
        mode: state.n64Mode,
        executablePath: state.executablePath.trim() || undefined,
        romPath: state.romPath.trim() || undefined,
        generatedAssetPath: state.generatedAssetPath.trim() || undefined,
        configPath: state.configPath.trim() || undefined,
        savePath: state.savePath.trim() || undefined,
        projectPath: state.projectPath.trim() || undefined,
        n64RecompPath: state.n64RecompPath.trim() || undefined,
        n64ModernRuntimePath: state.n64ModernRuntimePath.trim() || undefined,
        rt64Path: state.rt64Path.trim() || undefined,
        buildDir: state.buildDir.trim() || undefined,
        cmakePreset: state.cmakePreset.trim() || undefined,
        symbolFilePath: state.symbolFilePath.trim() || undefined,
        generatedSourceDir: state.generatedSourceDir.trim() || undefined,
        renderer: state.n64Renderer,
        environmentVariables: parseEnvText(state.envVars),
        ...launchArgsField,
      } as N64RecompProfile
    default:
      return {
        ...baseFields,
        category,
        helper,
      } as unknown as CiderDeckProfile
  }
}

export function ProfileForm({
  helper,
  category,
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: ProfileFormProps) {
  const [state, setState] = useState<FormState>(() =>
    initial ? stateFromProfile(initial) : stateFromHelper(helper)
  )

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState(current => ({ ...current, [key]: value }))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const profile = buildProfile(helper, category, state, initial)
    onSubmit(profile)
  }

  const renderHelperFields = () => {
    switch (helper) {
      case 'wine':
      case 'crossover':
      case 'whisky':
      case 'gptk':
        return (
          <>
            <Field label="Backend">
              <Select
                value={state.backend}
                onChange={e =>
                  update('backend', e.target.value as CompatibilityBackend)
                }
              >
                {(['wine', 'crossover', 'whisky', 'gptk'] as const).map(b => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Executable path (.exe)">
              <Input
                value={state.executablePath}
                onChange={e => update('executablePath', e.target.value)}
              />
            </Field>
            <Field label="Bottle / WINEPREFIX path">
              <Input
                value={state.bottlePath}
                onChange={e => update('bottlePath', e.target.value)}
              />
            </Field>
            <Field label="Environment variables (KEY=value per line)">
              <Textarea
                value={state.envVars}
                onChange={e => update('envVars', e.target.value)}
              />
            </Field>
          </>
        )
      case 'doom':
        return (
          <>
            <Field label="Engine">
              <Select
                value={state.doomEngine}
                onChange={e =>
                  update('doomEngine', e.target.value as DoomEngine)
                }
              >
                {(
                  [
                    'gzdoom',
                    'dsda-doom',
                    'woof',
                    'chocolate-doom',
                    'crispy-doom',
                    'custom',
                  ] as const
                ).map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Engine path">
              <Input
                value={state.enginePath}
                onChange={e => update('enginePath', e.target.value)}
              />
            </Field>
            <Field label="IWAD (DOOM.WAD, DOOM2.WAD, …)">
              <Input
                value={state.iwadPath}
                onChange={e => update('iwadPath', e.target.value)}
              />
            </Field>
            <Field label="PWADs (one per line)">
              <Textarea
                value={state.pwadPaths}
                onChange={e => update('pwadPaths', e.target.value)}
              />
            </Field>
            <Field label="Mods (one per line)">
              <Textarea
                value={state.modPaths}
                onChange={e => update('modPaths', e.target.value)}
              />
            </Field>
            <Field label="Config file path">
              <Input
                value={state.configPath}
                onChange={e => update('configPath', e.target.value)}
              />
            </Field>
          </>
        )
      case 'quake':
      case 'quake2':
      case 'quake3':
        return (
          <>
            <Field label="Family">
              <Select
                value={state.quakeFamily}
                onChange={e =>
                  update('quakeFamily', e.target.value as QuakeFamily)
                }
              >
                {(['quake1', 'quake2', 'quake3'] as const).map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Engine">
              <Select
                value={state.quakeEngine}
                onChange={e =>
                  update('quakeEngine', e.target.value as QuakeEngine)
                }
              >
                {(
                  [
                    'ironwail',
                    'vkquake',
                    'vkmacquake',
                    'quakespasm',
                    'quakespasm-spiked',
                    'qss-m',
                    'darkplaces',
                    'fteqw',
                    'yamagi-quake2',
                    'vkquake2',
                    'ioquake3',
                    'spearmint',
                    'custom',
                  ] as const
                ).map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Engine path">
              <Input
                value={state.enginePath}
                onChange={e => update('enginePath', e.target.value)}
              />
            </Field>
            <Field label="Game data folder (id1, baseq2, baseq3)">
              <Input
                value={state.gameDataPath}
                onChange={e => update('gameDataPath', e.target.value)}
              />
            </Field>
            <Field label="Game dir (e.g. mission pack subfolder)">
              <Input
                value={state.gameDir}
                onChange={e => update('gameDir', e.target.value)}
              />
            </Field>
            <Field label="Mod dir (overrides gamedir if set)">
              <Input
                value={state.modDir}
                onChange={e => update('modDir', e.target.value)}
              />
            </Field>
          </>
        )
      case 'gemrb':
        return (
          <>
            <Field label="Game">
              <Select
                value={state.infinityGame}
                onChange={e =>
                  update('infinityGame', e.target.value as InfinityGame)
                }
              >
                {(['bg1', 'bg2', 'iwd1', 'iwd2', 'pst', 'custom'] as const).map(
                  o => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  )
                )}
              </Select>
            </Field>
            <Field label="GemRB executable path">
              <Input
                value={state.gemRBPath}
                onChange={e => update('gemRBPath', e.target.value)}
              />
            </Field>
            <Field label="Game data path (folder with chitin.key)">
              <Input
                value={state.gameDataPath}
                onChange={e => update('gameDataPath', e.target.value)}
              />
            </Field>
            <Field label="Config path (GemRB.cfg)">
              <Input
                value={state.configPath}
                onChange={e => update('configPath', e.target.value)}
              />
            </Field>
            <Field label="Save path">
              <Input
                value={state.savePath}
                onChange={e => update('savePath', e.target.value)}
              />
            </Field>
          </>
        )
      case 'opendiablo':
        return (
          <>
            <Field label="Game">
              <Select
                value={state.diabloGame}
                onChange={e =>
                  update('diabloGame', e.target.value as DiabloGame)
                }
              >
                {(
                  [
                    'diablo1',
                    'hellfire',
                    'diablo2',
                    'lord-of-destruction',
                    'custom',
                  ] as const
                ).map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Engine">
              <Select
                value={state.diabloEngine}
                onChange={e =>
                  update('diabloEngine', e.target.value as DiabloEngine)
                }
              >
                {(
                  [
                    'devilutionx',
                    'opendiablo2',
                    'abyssengine-opendiablo2',
                    'wine',
                    'custom',
                  ] as const
                ).map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Engine path">
              <Input
                value={state.enginePath}
                onChange={e => update('enginePath', e.target.value)}
              />
            </Field>
            <Field label="Game data path (folder with MPQs)">
              <Input
                value={state.gameDataPath}
                onChange={e => update('gameDataPath', e.target.value)}
              />
            </Field>
            <Field label="MPQ files (one per line)">
              <Textarea
                value={state.mpqPaths}
                onChange={e => update('mpqPaths', e.target.value)}
              />
            </Field>
          </>
        )
      case 'alephone':
        return (
          <>
            <Field label="Scenario">
              <Select
                value={state.marathonScenario}
                onChange={e =>
                  update('marathonScenario', e.target.value as MarathonScenario)
                }
              >
                {(
                  [
                    'marathon',
                    'marathon-2',
                    'marathon-infinity',
                    'third-party',
                    'custom',
                  ] as const
                ).map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Aleph One executable path">
              <Input
                value={state.alephOnePath}
                onChange={e => update('alephOnePath', e.target.value)}
              />
            </Field>
            <Field label="Scenario folder">
              <Input
                value={state.scenarioPath}
                onChange={e => update('scenarioPath', e.target.value)}
              />
            </Field>
          </>
        )
      case 'openrct2':
        return (
          <>
            <Field label="OpenRCT2 executable path">
              <Input
                value={state.openRCT2Path}
                onChange={e => update('openRCT2Path', e.target.value)}
              />
            </Field>
            <Field label="RCT2 game data path">
              <Input
                value={state.gameDataPath}
                onChange={e => update('gameDataPath', e.target.value)}
              />
            </Field>
            <Field label="Saves path">
              <Input
                value={state.savesPath}
                onChange={e => update('savesPath', e.target.value)}
              />
            </Field>
            <Field label="Scenarios path">
              <Input
                value={state.scenariosPath}
                onChange={e => update('scenariosPath', e.target.value)}
              />
            </Field>
          </>
        )
      case 'openmw':
        return (
          <>
            <Field label="OpenMW executable path">
              <Input
                value={state.enginePath}
                onChange={e => update('enginePath', e.target.value)}
              />
            </Field>
            <Field label="Morrowind Data Files folder">
              <Input
                value={state.gameDataPath}
                onChange={e => update('gameDataPath', e.target.value)}
              />
            </Field>
            <Field label="openmw.cfg path">
              <Input
                value={state.configPath}
                onChange={e => update('configPath', e.target.value)}
              />
            </Field>
            <Field label="User data path (saves, mods)">
              <Input
                value={state.userDataPath}
                onChange={e => update('userDataPath', e.target.value)}
              />
            </Field>
            <Field label="Resources path">
              <Input
                value={state.resourcesPath}
                onChange={e => update('resourcesPath', e.target.value)}
              />
            </Field>
            <Field label="Load savegame at startup (optional)">
              <Input
                value={state.loadSavegamePath}
                onChange={e => update('loadSavegamePath', e.target.value)}
              />
            </Field>
          </>
        )
      case 'openxcom':
        return (
          <>
            <Field label="Game">
              <Select
                value={state.xcomGame}
                onChange={e => update('xcomGame', e.target.value as XcomGame)}
              >
                {(
                  [
                    'ufo-defense',
                    'enemy-unknown',
                    'terror-from-the-deep',
                    'custom',
                  ] as const
                ).map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="OpenXcom executable path">
              <Input
                value={state.enginePath}
                onChange={e => update('enginePath', e.target.value)}
              />
            </Field>
            <Field label="X-COM game data path">
              <Input
                value={state.gameDataPath}
                onChange={e => update('gameDataPath', e.target.value)}
              />
            </Field>
            <Field label="User data path (saves, mods)">
              <Input
                value={state.userDataPath}
                onChange={e => update('userDataPath', e.target.value)}
              />
            </Field>
            <Field label="Mod path">
              <Input
                value={state.modPath}
                onChange={e => update('modPath', e.target.value)}
              />
            </Field>
          </>
        )
      case 'openciv':
        return (
          <>
            <Field label="Engine">
              <Select
                value={state.civEngine}
                onChange={e => update('civEngine', e.target.value as CivEngine)}
              >
                {(
                  [
                    'freeciv',
                    'freeciv-web',
                    'openciv1',
                    'openciv3',
                    'custom',
                  ] as const
                ).map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Launch mode">
              <Select
                value={state.civMode}
                onChange={e =>
                  update('civMode', e.target.value as CivLaunchMode)
                }
              >
                {(
                  [
                    'singleplayer',
                    'multiplayer-client',
                    'server',
                    'web',
                  ] as const
                ).map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Engine executable path">
              <Input
                value={state.executablePath}
                onChange={e => update('executablePath', e.target.value)}
              />
            </Field>
            <Field label="Server binary path">
              <Input
                value={state.serverPath}
                onChange={e => update('serverPath', e.target.value)}
              />
            </Field>
            <Field label="Ruleset">
              <Input
                value={state.ruleset}
                onChange={e => update('ruleset', e.target.value)}
              />
            </Field>
          </>
        )
      case 'emulator':
        return (
          <>
            <Field label="Emulator">
              <Select
                value={state.emulatorEngine}
                onChange={e =>
                  update('emulatorEngine', e.target.value as EmulatorEngine)
                }
              >
                {(
                  [
                    'dosbox-staging',
                    'dosbox-x',
                    'ppsspp',
                    'dolphin',
                    'pcsx2',
                    'duckstation',
                    'retroarch',
                    'mame',
                    'ares',
                    'custom',
                  ] as const
                ).map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="System">
              <Select
                value={state.emulatorSystem}
                onChange={e =>
                  update('emulatorSystem', e.target.value as EmulatorSystem)
                }
              >
                {(
                  [
                    'dos',
                    'psp',
                    'gamecube',
                    'wii',
                    'ps2',
                    'ps1',
                    'arcade',
                    'snes',
                    'n64',
                    'gba',
                    'custom',
                  ] as const
                ).map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Emulator executable path">
              <Input
                value={state.emulatorPath}
                onChange={e => update('emulatorPath', e.target.value)}
              />
            </Field>
            <Field label="ROM / ISO / disc path">
              <Input
                value={state.romOrDiscPath}
                onChange={e => update('romOrDiscPath', e.target.value)}
              />
            </Field>
            <Field label="BIOS path (if needed)">
              <Input
                value={state.biosPath}
                onChange={e => update('biosPath', e.target.value)}
              />
            </Field>
            <Field label="RetroArch core (e.g. snes9x_libretro)">
              <Input
                value={state.coreName}
                onChange={e => update('coreName', e.target.value)}
              />
            </Field>
          </>
        )
      case 'n64recomp':
        return (
          <>
            <Field label="Mode">
              <Select
                value={state.n64Mode}
                onChange={e =>
                  update('n64Mode', e.target.value as N64RecompMode)
                }
              >
                {(['player', 'developer'] as const).map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Renderer">
              <Select
                value={state.n64Renderer}
                onChange={e =>
                  update('n64Renderer', e.target.value as N64RecompRenderer)
                }
              >
                {(['rt64', 'software', 'custom'] as const).map(o => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </Field>
            {state.n64Mode === 'player' ? (
              <>
                <Field label="Recompiled executable path">
                  <Input
                    value={state.executablePath}
                    onChange={e => update('executablePath', e.target.value)}
                  />
                </Field>
                <Field label="Original ROM (for asset extraction)">
                  <Input
                    value={state.romPath}
                    onChange={e => update('romPath', e.target.value)}
                  />
                </Field>
                <Field label="Generated asset folder">
                  <Input
                    value={state.generatedAssetPath}
                    onChange={e => update('generatedAssetPath', e.target.value)}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Project source path">
                  <Input
                    value={state.projectPath}
                    onChange={e => update('projectPath', e.target.value)}
                  />
                </Field>
                <Field label="N64Recomp tool path">
                  <Input
                    value={state.n64RecompPath}
                    onChange={e => update('n64RecompPath', e.target.value)}
                  />
                </Field>
                <Field label="N64ModernRuntime path">
                  <Input
                    value={state.n64ModernRuntimePath}
                    onChange={e =>
                      update('n64ModernRuntimePath', e.target.value)
                    }
                  />
                </Field>
                <Field label="RT64 path">
                  <Input
                    value={state.rt64Path}
                    onChange={e => update('rt64Path', e.target.value)}
                  />
                </Field>
                <Field label="Build directory">
                  <Input
                    value={state.buildDir}
                    onChange={e => update('buildDir', e.target.value)}
                  />
                </Field>
                <Field label="CMake preset">
                  <Input
                    value={state.cmakePreset}
                    onChange={e => update('cmakePreset', e.target.value)}
                  />
                </Field>
                <Field label="Symbol file path">
                  <Input
                    value={state.symbolFilePath}
                    onChange={e => update('symbolFilePath', e.target.value)}
                  />
                </Field>
                <Field label="Generated source dir">
                  <Input
                    value={state.generatedSourceDir}
                    onChange={e => update('generatedSourceDir', e.target.value)}
                  />
                </Field>
              </>
            )}
            <Field label="Environment variables (KEY=value per line)">
              <Textarea
                value={state.envVars}
                onChange={e => update('envVars', e.target.value)}
              />
            </Field>
          </>
        )
      default:
        return (
          <>
            <Field label="Executable path">
              <Input
                value={state.executablePath}
                onChange={e => update('executablePath', e.target.value)}
              />
            </Field>
            <Field label="Data path">
              <Input
                value={state.gameDataPath}
                onChange={e => update('gameDataPath', e.target.value)}
              />
            </Field>
          </>
        )
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>
          {initial ? 'Edit Profile' : 'New Profile'} — {helperLabel(helper)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Field label="Title">
            <Input
              required
              value={state.title}
              onChange={e => update('title', e.target.value)}
            />
          </Field>
          <Field label="Status">
            <Select
              value={state.status}
              onChange={e => update('status', e.target.value as ProfileStatus)}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>

          {renderHelperFields()}

          <Field label="Extra launch args (space-separated)">
            <Input
              value={state.launchArgs}
              onChange={e => update('launchArgs', e.target.value)}
            />
          </Field>
          <Field label="Notes">
            <Textarea
              value={state.notes}
              onChange={e => update('notes', e.target.value)}
            />
          </Field>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {submitLabel ?? (initial ? 'Save Changes' : 'Add Profile')}
            </Button>
            {onCancel ? (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
