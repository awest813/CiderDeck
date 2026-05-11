// SPDX-License-Identifier: GPL-3.0-or-later

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AddProfileWizard } from '@/components/AddProfileWizard'
import { ProfileForm } from '@/components/profile-forms/ProfileForm'
import { ProfileLibrary } from '@/components/ProfileLibrary'
import { ProfileLogViewer } from '@/components/ProfileLogViewer'
import { ValidationPanel } from '@/components/ValidationPanel'
import { CATEGORIES } from '@/lib/helper-catalog'
import { cn } from '@/lib/utils'
import {
  deleteProfile,
  saveProfiles,
  upsertProfile,
} from '@/lib/profile-storage'
import { fetchPersistedLogs, launchProfile } from '@/lib/profile-runner'
import type { CiderDeckProfile, ProfileLogEntry } from '@/types/Profile'

const SESSION_LOG_LIMIT = 30

interface ProfilesPageProps {
  profiles: CiderDeckProfile[]
  onProfilesChange: (profiles: CiderDeckProfile[]) => void
}

export function ProfilesPage({
  profiles,
  onProfilesChange,
}: ProfilesPageProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string>()
  const [logsByProfile, setLogsByProfile] = useState<
    Record<string, ProfileLogEntry[]>
  >({})
  const [showWizard, setShowWizard] = useState(false)

  const selectedProfile = profiles.find(
    profile => profile.id === selectedProfileId
  )

  useEffect(() => {
    if (!selectedProfileId) return
    let cancelled = false
    fetchPersistedLogs(selectedProfileId).then(persisted => {
      if (cancelled) return
      setLogsByProfile(current => ({
        ...current,
        [selectedProfileId]:
          persisted.length > 0 ? persisted : (current[selectedProfileId] ?? []),
      }))
    })
    return () => {
      cancelled = true
    }
  }, [selectedProfileId])

  const handleSave = (profile: CiderDeckProfile) => {
    const next = upsertProfile(profiles, profile)
    saveProfiles(next)
    onProfilesChange(next)
    setSelectedProfileId(profile.id)
    setShowWizard(false)
  }

  const handleDelete = (profileId: string) => {
    const next = deleteProfile(profiles, profileId)
    saveProfiles(next)
    onProfilesChange(next)
    if (selectedProfileId === profileId) setSelectedProfileId(undefined)
    setLogsByProfile(current => {
      const { [profileId]: _removed, ...rest } = current
      return rest
    })
  }

  const handleLaunch = async (profile: CiderDeckProfile) => {
    setSelectedProfileId(profile.id)
    const entry = await launchProfile(profile)
    setLogsByProfile(current => ({
      ...current,
      [profile.id]: [entry, ...(current[profile.id] ?? [])].slice(
        0,
        SESSION_LOG_LIMIT
      ),
    }))
  }

  const profilesByCategory = CATEGORIES.map(category => ({
    category,
    count: profiles.filter(profile => profile.category === category.id).length,
  }))

  return (
    <main className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_380px] gap-6 overflow-hidden p-6">
      <section className="min-w-0 overflow-auto pr-1">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Profiles</h2>
            <p className="mt-1 text-muted-foreground">
              Manage and launch your helpers, source ports, emulators, and
              recompilation projects.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              setShowWizard(true)
              setSelectedProfileId(undefined)
            }}
          >
            + New Profile
          </Button>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3 lg:grid-cols-6">
          {profilesByCategory.map(({ category, count }) => (
            <div
              key={category.id}
              className={cn(
                'rounded-lg border bg-card p-3 transition-opacity',
                count === 0 && 'opacity-40'
              )}
            >
              <p className="text-sm font-semibold">{category.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{count}</p>
            </div>
          ))}
        </div>

        <ProfileLibrary
          profiles={profiles}
          selectedProfileId={selectedProfileId}
          onSelect={profileId => {
            setSelectedProfileId(profileId)
            setShowWizard(false)
          }}
          onLaunch={handleLaunch}
          onDelete={handleDelete}
        />
      </section>

      <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto">
        {showWizard ? (
          <AddProfileWizard
            onCreate={handleSave}
            onCancel={() => setShowWizard(false)}
          />
        ) : selectedProfile ? (
          <>
            <ProfileForm
              key={selectedProfile.id}
              helper={selectedProfile.helper}
              category={selectedProfile.category}
              initial={selectedProfile}
              onSubmit={handleSave}
            />
            <ValidationPanel profile={selectedProfile} />
            <ProfileLogViewer
              profile={selectedProfile}
              logs={logsByProfile[selectedProfile.id] ?? []}
            />
          </>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Select a profile to edit, or create a new one.
          </div>
        )}
      </aside>
    </main>
  )
}
