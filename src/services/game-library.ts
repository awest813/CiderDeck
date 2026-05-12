// SPDX-License-Identifier: GPL-3.0-or-later

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { commands } from '@/lib/tauri-bindings'
import type { Game, GameImport } from '@/lib/bindings'

export const gameQueryKeys = {
  all: ['games'] as const,
  games: () => [...gameQueryKeys.all] as const,
}

export function useGameLibrary() {
  return useQuery({
    queryKey: gameQueryKeys.games(),
    queryFn: async (): Promise<Game[]> => {
      const result = await commands.listGames()
      if (result.status === 'error') {
        throw new Error(result.error)
      }
      return result.data
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useSaveGame() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (game: Game) => {
      const result = await commands.saveGame(game)
      if (result.status === 'error') {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameQueryKeys.games() })
    },
    onError: (error: Error) => {
      toast.error('Failed to save game', { description: error.message })
    },
  })
}

export function useDeleteGame() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (gameId: string) => {
      const result = await commands.deleteGame(gameId)
      if (result.status === 'error') {
        throw new Error(result.error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameQueryKeys.games() })
    },
    onError: (error: Error) => {
      toast.error('Failed to delete game', { description: error.message })
    },
  })
}

export function useImportGame() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (gameImport: GameImport) => {
      const result = await commands.importGame(gameImport)
      if (result.status === 'error') {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameQueryKeys.games() })
      toast.success('Game imported')
    },
    onError: (error: Error) => {
      toast.error('Failed to import game', { description: error.message })
    },
  })
}
