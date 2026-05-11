// SPDX-License-Identifier: GPL-3.0-or-later

import { createId } from '@/lib/storage'
import type { CiderDeckProfile } from '@/types/Profile'

const STORAGE_KEY = 'ciderdeck.profiles.v1'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isProfile = (value: unknown): value is CiderDeckProfile => {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.helper === 'string' &&
    typeof value.category === 'string' &&
    typeof value.status === 'string'
  )
}

export const loadProfiles = (): CiderDeckProfile[] => {
  if (typeof localStorage === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isProfile)
  } catch {
    return []
  }
}

export const saveProfiles = (profiles: CiderDeckProfile[]) => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles, null, 2))
}

export const upsertProfile = (
  profiles: CiderDeckProfile[],
  profile: CiderDeckProfile
): CiderDeckProfile[] => {
  const index = profiles.findIndex(existing => existing.id === profile.id)
  if (index === -1) return [profile, ...profiles]
  return profiles.map(existing =>
    existing.id === profile.id ? profile : existing
  )
}

export const deleteProfile = (
  profiles: CiderDeckProfile[],
  profileId: string
): CiderDeckProfile[] => profiles.filter(profile => profile.id !== profileId)

export const newProfileTimestamps = () => {
  const now = new Date().toISOString()
  return { id: createId(), createdAt: now, updatedAt: now }
}
