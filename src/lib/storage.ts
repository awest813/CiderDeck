import type { GameEntry, LaunchLog } from '@/types/GameEntry'

const STORAGE_KEY = 'ciderdeck.game-library.v1'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isGameEntry = (value: unknown): value is GameEntry => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.executablePath === 'string' &&
    typeof value.backend === 'string' &&
    typeof value.status === 'string'
  )
}

export const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const loadGames = (): GameEntry[] => {
  if (typeof localStorage === 'undefined') {
    return []
  }

  const rawGames = localStorage.getItem(STORAGE_KEY)
  if (!rawGames) {
    return []
  }

  try {
    const parsedGames: unknown = JSON.parse(rawGames)
    if (!Array.isArray(parsedGames)) {
      return []
    }

    return parsedGames.filter(isGameEntry).map(game => ({
      ...game,
      logs: Array.isArray(game.logs) ? game.logs : [],
    }))
  } catch {
    return []
  }
}

export const saveGames = (games: GameEntry[]) => {
  if (typeof localStorage === 'undefined') {
    return
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(games, null, 2))
}

export const upsertGame = (games: GameEntry[], game: GameEntry) => {
  const existingIndex = games.findIndex(existingGame => existingGame.id === game.id)
  if (existingIndex === -1) {
    return [game, ...games]
  }

  return games.map(existingGame =>
    existingGame.id === game.id ? game : existingGame
  )
}

export const deleteGame = (games: GameEntry[], gameId: string) =>
  games.filter(game => game.id !== gameId)

export const appendGameLog = (
  games: GameEntry[],
  gameId: string,
  log: LaunchLog
) =>
  games.map(game =>
    game.id === gameId ? { ...game, logs: [log, ...game.logs] } : game
  )
