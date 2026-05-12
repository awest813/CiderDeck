// SPDX-License-Identifier: GPL-3.0-or-later

import { useEffect, useState } from 'react'
import { isTauri } from '@tauri-apps/api/core'
import { Sidebar, type SidebarPage } from '@/components/Sidebar'
import { GameLibraryPage } from '@/pages/GameLibraryPage'
import { ProfilesPage } from '@/pages/ProfilesPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { Spinner } from '@/components/ui/spinner'
import { useGameLibrary } from '@/services/game-library'
import {
  useProfileStore,
  migrateLocalStorageIfNeeded,
} from '@/services/profile-store'

export function LibraryPage() {
  const [activePage, setActivePage] = useState<SidebarPage>('library')
  const [migrated, setMigrated] = useState(false)

  const { data: games = [], isLoading: gamesLoading } = useGameLibrary()
  const { data: profiles = [], isLoading: profilesLoading } = useProfileStore()

  useEffect(() => {
    if (!isTauri() || migrated) return
    let cancelled = false
    migrateLocalStorageIfNeeded().then(didMigrate => {
      if (cancelled) return
      if (didMigrate) {
        setMigrated(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [migrated])

  if (gamesLoading || profilesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <Sidebar
        activePage={activePage}
        gameCount={games.length}
        profileCount={profiles.length}
        onPageChange={setActivePage}
      />

      {activePage === 'settings' ? (
        <main className="min-w-0 flex-1 overflow-auto">
          <SettingsPage />
        </main>
      ) : activePage === 'library' ? (
        <GameLibraryPage />
      ) : (
        <ProfilesPage profiles={profiles} />
      )}
    </div>
  )
}
