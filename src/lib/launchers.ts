import { isTauri } from '@tauri-apps/api/core'
import { commands } from '@/lib/tauri-bindings'
import { createId } from '@/lib/storage'
import type {
  CompatibilityBackend,
  GameEntry,
  LaunchLog,
} from '@/types/GameEntry'

interface BackendDetails {
  label: string
  description: string
  program: string
  baseArgs: string[]
}

interface LauncherPreview {
  program: string
  args: string[]
  environment: Record<string, string>
  launchArgs?: string
}

export const backendDetails: Record<CompatibilityBackend, BackendDetails> = {
  wine: {
    label: 'Wine',
    description: 'Run the executable through a Wine prefix.',
    program: 'wine',
    baseArgs: [],
  },
  crossover: {
    label: 'CrossOver',
    description: 'Launch through a CrossOver bottle.',
    program: 'open',
    baseArgs: ['-a', 'CrossOver', '--args'],
  },
  whisky: {
    label: 'Whisky',
    description: 'Launch through a Whisky bottle.',
    program: 'open',
    baseArgs: ['-a', 'Whisky', '--args'],
  },
  gptk: {
    label: 'GPTK',
    description: 'Use an Apple Game Porting Toolkit profile.',
    program: 'gameportingtoolkit',
    baseArgs: [],
  },
}

const getEnvironment = (environmentVariables?: Record<string, string>) => {
  if (!environmentVariables) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(environmentVariables).filter(
      ([, value]) => value.trim().length > 0
    )
  )
}

const getBottleEnvironment = (
  backend: CompatibilityBackend,
  bottlePath?: string
): Record<string, string> => {
  if ((backend === 'wine' || backend === 'whisky') && bottlePath) {
    return { WINEPREFIX: bottlePath }
  }
  return {}
}

const splitLaunchArgs = (launchArgs?: string): string[] =>
  launchArgs
    ? launchArgs
        .split(/\s+/)
        .map(arg => arg.trim())
        .filter(arg => arg.length > 0)
    : []

export const getLauncherPreview = (game: GameEntry): LauncherPreview => {
  const backend = backendDetails[game.backend]
  const args = [...backend.baseArgs]

  if (game.bottlePath && game.backend !== 'wine' && game.backend !== 'whisky') {
    args.push('--bottle', game.bottlePath)
  }

  args.push(game.executablePath)
  args.push(...splitLaunchArgs(game.launchArgs))

  return {
    program: backend.program,
    args,
    environment: {
      ...getBottleEnvironment(game.backend, game.bottlePath),
      ...getEnvironment(game.environmentVariables),
    },
    launchArgs: game.launchArgs || undefined,
  }
}

export const getLauncherCommand = (game: GameEntry) =>
  JSON.stringify(getLauncherPreview(game), null, 2)

export const launchGame = async (game: GameEntry): Promise<LaunchLog> => {
  const command = getLauncherCommand(game)
  const preview = getLauncherPreview(game)
  const backend = backendDetails[game.backend]

  if (isTauri()) {
    const result = await commands.launchProfileExecutable(
      preview.program,
      preview.args,
      preview.environment,
      null
    )

    if (result.status === 'ok') {
      return {
        id: createId(),
        gameId: game.id,
        createdAt: new Date().toISOString(),
        backend: game.backend,
        command,
        stdout: result.data.stdout,
        stderr: result.data.stderr,
        exitCode: result.data.exit_code,
      }
    }

    return {
      id: createId(),
      gameId: game.id,
      createdAt: new Date().toISOString(),
      backend: game.backend,
      command,
      stdout: '',
      stderr: `Launch failed: ${result.error}`,
      exitCode: null,
    }
  }

  return {
    id: createId(),
    gameId: game.id,
    createdAt: new Date().toISOString(),
    backend: game.backend,
    command,
    stdout: [
      `Preparing ${game.title} with ${backend.label}.`,
      `Launch preview: ${command}`,
      'Browser preview mode: no native process was spawned.',
    ].join('\n'),
    stderr: '',
    exitCode: null,
  }
}
