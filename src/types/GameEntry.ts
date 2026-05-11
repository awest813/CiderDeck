export type CompatibilityBackend = 'wine' | 'crossover' | 'whisky' | 'gptk'

export type GameStatus =
  | 'untested'
  | 'perfect'
  | 'playable'
  | 'boots'
  | 'broken'

export interface LaunchLog {
  id: string
  gameId: string
  createdAt: string
  backend: CompatibilityBackend
  command: string
  stdout: string
  stderr: string
  exitCode?: number
}

export interface GameEntry {
  id: string
  title: string
  executablePath: string
  backend: CompatibilityBackend
  status: GameStatus
  bottlePath?: string
  launchArgs?: string
  environmentVariables?: Record<string, string>
  notes?: string
  logs: LaunchLog[]
  createdAt: string
  updatedAt: string
}
