// SPDX-License-Identifier: GPL-3.0-or-later

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { isTauri } from '@tauri-apps/api/core'
import { toast } from 'sonner'
import { commands, type JsonValue } from '@/lib/tauri-bindings'
import {
  deleteProfile as deleteFromList,
  loadProfiles as loadFromLocalStorage,
  saveProfiles as saveToLocalStorage,
  upsertProfile,
} from '@/lib/profile-storage'
import type { CiderDeckProfile } from '@/types/Profile'

export const profileQueryKeys = {
  all: ['profiles'] as const,
  profiles: () => [...profileQueryKeys.all] as const,
}

function profilesFromValues(values: unknown[]): CiderDeckProfile[] {
  return values.filter(
    (v): v is CiderDeckProfile =>
      typeof v === 'object' &&
      v !== null &&
      typeof (v as Record<string, unknown>).id === 'string' &&
      typeof (v as Record<string, unknown>).title === 'string' &&
      typeof (v as Record<string, unknown>).helper === 'string' &&
      typeof (v as Record<string, unknown>).category === 'string' &&
      typeof (v as Record<string, unknown>).status === 'string'
  )
}

async function saveProfilesMutationFn(
  profiles: CiderDeckProfile[]
): Promise<CiderDeckProfile[]> {
  if (!isTauri()) {
    saveToLocalStorage(profiles)
    return profiles
  }

  const result = await commands.saveProfiles(profiles as unknown as JsonValue[])
  if (result.status === 'error') {
    throw new Error(result.error)
  }
  return profiles
}

export function useProfileStore() {
  return useQuery({
    queryKey: profileQueryKeys.profiles(),
    queryFn: async (): Promise<CiderDeckProfile[]> => {
      if (!isTauri()) {
        return loadFromLocalStorage()
      }

      const result = await commands.listProfiles()
      if (result.status === 'error') {
        throw new Error(result.error)
      }
      return profilesFromValues(result.data)
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpsertProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      profiles,
      profile,
    }: {
      profiles: CiderDeckProfile[]
      profile: CiderDeckProfile
    }) => {
      const updated = upsertProfile(profiles, profile)
      return saveProfilesMutationFn(updated)
    },
    onSuccess: updated => {
      queryClient.setQueryData(profileQueryKeys.profiles(), updated)
    },
    onError: (error: Error) => {
      toast.error('Failed to save profile', { description: error.message })
    },
  })
}

export function useDeleteProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      profiles,
      profileId,
    }: {
      profiles: CiderDeckProfile[]
      profileId: string
    }) => {
      const updated = deleteFromList(profiles, profileId)
      return saveProfilesMutationFn(updated)
    },
    onSuccess: updated => {
      queryClient.setQueryData(profileQueryKeys.profiles(), updated)
    },
    onError: (error: Error) => {
      toast.error('Failed to delete profile', { description: error.message })
    },
  })
}

export async function migrateLocalStorageIfNeeded(): Promise<boolean> {
  if (!isTauri()) return false

  const localStorageData = loadFromLocalStorage()
  if (localStorageData.length === 0) return false

  try {
    const result = await commands.migrateFromLocalStorage(
      JSON.stringify(localStorageData)
    )
    if (result.status === 'ok' && result.data > 0) {
      localStorage.removeItem('ciderdeck.profiles.v1')
      return true
    }
  } catch {
    // Migration failure is non-fatal
  }
  return false
}
