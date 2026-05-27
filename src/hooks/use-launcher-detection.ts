// SPDX-License-Identifier: GPL-3.0-or-later

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { commands } from '@/lib/tauri-bindings'
import type { SteamGame, EpicGame, GogGame } from '@/lib/bindings'

const launcherKeys = {
  steam: ['launcher-detection', 'steam'] as const,
  epic: ['launcher-detection', 'epic'] as const,
  gog: ['launcher-detection', 'gog'] as const,
}

export function useSteamDetection(enabled: boolean) {
  return useQuery({
    queryKey: launcherKeys.steam,
    queryFn: (): Promise<SteamGame[]> => commands.detectSteamGames(),
    staleTime: 1000 * 60 * 5,
    enabled,
  })
}

export function useEpicDetection(enabled: boolean) {
  return useQuery({
    queryKey: launcherKeys.epic,
    queryFn: (): Promise<EpicGame[]> => commands.detectEpicGames(),
    staleTime: 1000 * 60 * 5,
    enabled,
  })
}

export function useGogDetection(enabled: boolean) {
  return useQuery({
    queryKey: launcherKeys.gog,
    queryFn: (): Promise<GogGame[]> => commands.detectGogGames(),
    staleTime: 1000 * 60 * 5,
    enabled,
  })
}

export function useRefreshSteam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (): Promise<SteamGame[]> => commands.detectSteamGames(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: launcherKeys.steam })
    },
  })
}

export function useRefreshEpic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (): Promise<EpicGame[]> => commands.detectEpicGames(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: launcherKeys.epic })
    },
  })
}

export function useRefreshGog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (): Promise<GogGame[]> => commands.detectGogGames(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: launcherKeys.gog })
    },
  })
}
