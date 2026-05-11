// SPDX-License-Identifier: GPL-3.0-or-later

import { ProfileCard } from '@/components/ProfileCard'
import type { CiderDeckProfile } from '@/types/Profile'

interface ProfileLibraryProps {
  profiles: CiderDeckProfile[]
  selectedProfileId?: string
  onSelect: (profileId: string) => void
  onLaunch: (profile: CiderDeckProfile) => void
  onDelete: (profileId: string) => void
}

export function ProfileLibrary({
  profiles,
  selectedProfileId,
  onSelect,
  onLaunch,
  onDelete,
}: ProfileLibraryProps) {
  if (profiles.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed p-8 text-center">
        <div>
          <h2 className="text-xl font-semibold">No profiles yet</h2>
          <p className="mt-2 text-muted-foreground">
            Add your first profile to start managing helpers, ports, emulators,
            or recompilation projects.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {profiles.map(profile => (
        <ProfileCard
          key={profile.id}
          profile={profile}
          selected={profile.id === selectedProfileId}
          onLaunch={onLaunch}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
