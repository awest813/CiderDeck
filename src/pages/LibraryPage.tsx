// SPDX-License-Identifier: GPL-3.0-or-later

import { useState } from 'react'
import { Sidebar, type SidebarPage } from '@/components/Sidebar'
import { loadProfiles } from '@/lib/profile-storage'
import { ProfilesPage } from '@/pages/ProfilesPage'
import { SettingsPage } from '@/pages/SettingsPage'
import type { CiderDeckProfile } from '@/types/Profile'

export function LibraryPage() {
  const [activePage, setActivePage] = useState<SidebarPage>('profiles')
  const [profiles, setProfiles] = useState<CiderDeckProfile[]>(() =>
    loadProfiles()
  )

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <Sidebar
        activePage={activePage}
        profileCount={profiles.length}
        onPageChange={setActivePage}
      />

      {activePage === 'settings' ? (
        <main className="min-w-0 flex-1 overflow-auto">
          <SettingsPage />
        </main>
      ) : (
        <ProfilesPage profiles={profiles} onProfilesChange={setProfiles} />
      )}
    </div>
  )
}
