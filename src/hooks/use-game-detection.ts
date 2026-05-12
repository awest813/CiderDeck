// SPDX-License-Identifier: GPL-3.0-or-later

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { commands } from '@/lib/tauri-bindings'
import type { DetectedGame } from '@/lib/bindings'

const detectionKeys = {
  all: ['game-detection'] as const,
}

export function useGameDetection(enabled: boolean) {
  return useQuery({
    queryKey: detectionKeys.all,
    queryFn: async (): Promise<DetectedGame[]> => {
      return await commands.detectGamesFromBottles()
    },
    staleTime: 1000 * 60 * 5,
    enabled,
  })
}

export function useRefreshDetection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<DetectedGame[]> => {
      return await commands.detectGamesFromBottles()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: detectionKeys.all })
    },
  })
}
