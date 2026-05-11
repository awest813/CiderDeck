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

export const getLauncherPreview = (game: GameEntry): LauncherPreview => {
  const backend = backendDetails[game.backend]
  const args = [...backend.baseArgs]

  if (game.bottlePath) {
    args.push('--bottle', game.bottlePath)
  }

  args.push(game.executablePath)

  return {
    program: backend.program,
    args,
    environment: getEnvironment(game.environmentVariables),
    launchArgs: game.launchArgs || undefined,
  }
}

export const getLauncherCommand = (game: GameEntry) =>
  JSON.stringify(getLauncherPreview(game), null, 2)

export const launchGame = async (game: GameEntry): Promise<LaunchLog> => {
  const command = getLauncherCommand(game)
  const backend = backendDetails[game.backend]

  return {
    id: createId(),
    gameId: game.id,
    createdAt: new Date().toISOString(),
    backend: game.backend,
    command,
    stdout: [
      `Preparing ${game.title} with ${backend.label}.`,
      `Launch preview: ${command}`,
      'Starter build: launch execution is simulated until native Tauri launcher commands are wired.',
    ].join('\n'),
    stderr:
      'No process was spawned. Use structured Rust process arguments before executing user-provided paths.',
  }
}
