import { createId } from '@/lib/storage'
import type {
  CompatibilityBackend,
  GameEntry,
  LaunchLog,
} from '@/types/GameEntry'

interface BackendDetails {
  label: string
  description: string
  executable: string
}

export const backendDetails: Record<CompatibilityBackend, BackendDetails> = {
  wine: {
    label: 'Wine',
    description: 'Run the executable through a Wine prefix.',
    executable: 'wine',
  },
  crossover: {
    label: 'CrossOver',
    description: 'Launch through a CrossOver bottle.',
    executable: 'open -a CrossOver',
  },
  whisky: {
    label: 'Whisky',
    description: 'Launch through a Whisky bottle.',
    executable: 'open -a Whisky',
  },
  gptk: {
    label: 'GPTK',
    description: 'Use an Apple Game Porting Toolkit profile.',
    executable: 'gameportingtoolkit',
  },
}

const formatEnvironment = (environmentVariables?: Record<string, string>) => {
  if (!environmentVariables) {
    return ''
  }

  return Object.entries(environmentVariables)
    .filter(([, value]) => value.trim().length > 0)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ')
}

export const getLauncherCommand = (game: GameEntry) => {
  const environment = formatEnvironment(game.environmentVariables)
  const backend = backendDetails[game.backend]
  const bottle = game.bottlePath ? `--bottle "${game.bottlePath}"` : ''
  const args = game.launchArgs ?? ''
  const commandParts = [
    environment,
    backend.executable,
    bottle,
    `"${game.executablePath}"`,
    args,
  ].filter(Boolean)

  return commandParts.join(' ')
}

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
      `Command: ${command}`,
      'Starter build: launch execution is simulated until native Tauri launcher commands are wired.',
    ].join('\n'),
    stderr:
      'No process was spawned. Add a Rust launcher command before executing user-provided paths.',
  }
}
