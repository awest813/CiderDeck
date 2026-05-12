// SPDX-License-Identifier: GPL-3.0-or-later

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type SidebarPage = 'library' | 'profiles' | 'settings'

interface SidebarProps {
  activePage: SidebarPage
  gameCount: number
  profileCount: number
  onPageChange: (page: SidebarPage) => void
}

export function Sidebar({
  activePage,
  gameCount,
  profileCount,
  onPageChange,
}: SidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-sidebar p-4">
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
          CiderDeck
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          Open Game Workbench
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Compatibility layers, source ports, emulators, and recompilation
          projects in one local library.
        </p>
      </div>

      <nav className="flex flex-col gap-1">
        <Button
          type="button"
          variant={activePage === 'library' ? 'secondary' : 'ghost'}
          className={cn(
            'justify-between',
            activePage === 'library' && 'font-semibold'
          )}
          onClick={() => onPageChange('library')}
        >
          Library
          <span className="rounded-full bg-background/80 px-2 py-0.5 text-xs text-muted-foreground">
            {gameCount}
          </span>
        </Button>
        <Button
          type="button"
          variant={activePage === 'profiles' ? 'secondary' : 'ghost'}
          className={cn(
            'justify-between',
            activePage === 'profiles' && 'font-semibold'
          )}
          onClick={() => onPageChange('profiles')}
        >
          Profiles
          <span className="rounded-full bg-background/80 px-2 py-0.5 text-xs text-muted-foreground">
            {profileCount}
          </span>
        </Button>
        <Button
          type="button"
          variant={activePage === 'settings' ? 'secondary' : 'ghost'}
          className={cn(
            'justify-start',
            activePage === 'settings' && 'font-semibold'
          )}
          onClick={() => onPageChange('settings')}
        >
          Settings
        </Button>
      </nav>

      <div className="mt-auto rounded-xl border bg-card p-3 text-xs leading-relaxed text-muted-foreground shadow-sm">
        Profiles and games are persisted through the native Rust backend. Native
        launching uses structured commands — no shells, no string concatenation.
        Bring your own legally obtained game data.
      </div>
    </aside>
  )
}
