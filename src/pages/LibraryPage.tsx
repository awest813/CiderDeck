// SPDX-License-Identifier: GPL-3.0-or-later

import { useState } from 'react'
import { Sidebar, type SidebarPage } from '@/components/Sidebar'
import { loadProfiles } from '@/lib/profile-storage'
import { ProfilesPage } from '@/pages/ProfilesPage'
import { SettingsPage } from '@/pages/SettingsPage'

export function LibraryPage() {
  const [activePage, setActivePage] = useState<SidebarPage>('profiles')
  const [profileCount] = useState(() => loadProfiles().length)

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <Sidebar
        activePage={activePage}
        profileCount={profileCount}
        onPageChange={setActivePage}
      />

      {activePage === 'settings' ? (
        <main className="min-w-0 flex-1 overflow-auto">
          <SettingsPage />
        </main>
      ) : (
        <ProfilesPage />
      )}
    </div>
  )
}
