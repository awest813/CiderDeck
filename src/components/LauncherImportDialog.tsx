// SPDX-License-Identifier: GPL-3.0-or-later

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import {
  useSteamDetection,
  useEpicDetection,
  useRefreshSteam,
  useRefreshEpic,
} from '@/hooks/use-launcher-detection'
import type { GameImport } from '@/lib/bindings'

type LauncherTab = 'steam' | 'epic'

interface LauncherImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** IDs of install paths already in the library (for duplicate filtering) */
  existingInstallPaths: Set<string>
  /** Titles already in the library (for duplicate filtering) */
  existingTitles: Set<string>
  onImport: (imports: GameImport[]) => void
}

function formatBytes(bytes: number | null): string {
  if (bytes == null || bytes === 0) return ''
  const gb = bytes / 1_073_741_824
  if (gb >= 1) return ` · ${gb.toFixed(1)} GB`
  const mb = bytes / 1_048_576
  return ` · ${mb.toFixed(0)} MB`
}

export function LauncherImportDialog({
  open,
  onOpenChange,
  existingInstallPaths,
  existingTitles,
  onImport,
}: LauncherImportDialogProps) {
  const [tab, setTab] = useState<LauncherTab>('steam')
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())

  const {
    data: steamGames = [],
    isLoading: steamLoading,
  } = useSteamDetection(open && tab === 'steam')
  const {
    data: epicGames = [],
    isLoading: epicLoading,
  } = useEpicDetection(open && tab === 'epic')

  const refreshSteam = useRefreshSteam()
  const refreshEpic = useRefreshEpic()

  const switchTab = (next: LauncherTab) => {
    setTab(next)
    setSelectedPaths(new Set())
  }

  const isDuplicate = (installPath: string, title: string) =>
    existingInstallPaths.has(installPath.toLowerCase()) ||
    existingTitles.has(title.toLowerCase())

  const toggle = (path: string) => {
    setSelectedPaths(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const handleImport = () => {
    const imports: GameImport[] = []

    if (tab === 'steam') {
      for (const g of steamGames) {
        if (!selectedPaths.has(g.install_dir)) continue
        imports.push({
          title: g.name,
          importSource: 'SteamLibrary',
          installPath: g.install_dir,
          artworkPath: null,
          tags: ['steam'],
          notes: null,
          profileIds: [],
        })
      }
    } else {
      for (const g of epicGames) {
        if (!selectedPaths.has(g.install_location)) continue
        imports.push({
          title: g.name,
          importSource: 'EpicLibrary',
          installPath: g.install_location,
          artworkPath: null,
          tags: ['epic'],
          notes: null,
          profileIds: [],
        })
      }
    }

    if (imports.length > 0) {
      onImport(imports)
    }
    onOpenChange(false)
  }

  const isLoading = tab === 'steam' ? steamLoading : epicLoading
  const isRefreshing =
    (tab === 'steam' ? refreshSteam : refreshEpic).isPending

  const currentGames =
    tab === 'steam'
      ? steamGames.map(g => ({
          key: g.install_dir,
          title: g.name,
          subtitle: `App ${g.app_id}${formatBytes(g.size_on_disk)}`,
          duplicate: isDuplicate(g.install_dir, g.name),
        }))
      : epicGames.map(g => ({
          key: g.install_location,
          title: g.name,
          subtitle: g.app_name,
          duplicate: isDuplicate(g.install_location, g.name),
        }))

  const availableGames = currentGames.filter(g => !g.duplicate)
  const selectedCount = availableGames.filter(g =>
    selectedPaths.has(g.key)
  ).length

  const handleRefresh = () => {
    if (tab === 'steam') {
      refreshSteam.mutate(undefined, {
        onSuccess: () => setSelectedPaths(new Set()),
      })
    } else {
      refreshEpic.mutate(undefined, {
        onSuccess: () => setSelectedPaths(new Set()),
      })
    }
  }

  const selectAll = () => {
    setSelectedPaths(new Set(availableGames.map(g => g.key)))
  }

  const clearAll = () => setSelectedPaths(new Set())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import from Launchers</DialogTitle>
          <DialogDescription>
            Import games detected from your installed launchers.
          </DialogDescription>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex gap-1 rounded-lg border p-1">
          {(['steam', 'epic'] as LauncherTab[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150',
                tab === t
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'steam' ? '🎮 Steam' : '🎯 Epic'}
            </button>
          ))}
        </div>

        {/* Content area */}
        {isLoading || isRefreshing ? (
          <div className="flex items-center justify-center py-10">
            <Spinner className="h-6 w-6" />
          </div>
        ) : currentGames.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed bg-muted/20 p-6 text-center">
            <div>
              <p className="text-sm font-medium">
                {tab === 'steam' ? 'Steam' : 'Epic'} not detected
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {tab === 'steam'
                  ? 'Make sure Steam is installed and has at least one game.'
                  : 'Make sure Epic Games Launcher is installed.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {availableGames.length > 0 && (
              <div className="flex justify-between px-0.5">
                <p className="text-xs text-muted-foreground">
                  {availableGames.length} game
                  {availableGames.length !== 1 ? 's' : ''} available
                  {currentGames.length - availableGames.length > 0 &&
                    ` · ${currentGames.length - availableGames.length} already imported`}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs text-primary hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
            <div className="max-h-72 space-y-1.5 overflow-y-auto">
              {currentGames.map(game => {
                const isSelected = selectedPaths.has(game.key)
                return (
                  <label
                    key={game.key}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-3 shadow-sm transition-all duration-150',
                      game.duplicate
                        ? 'cursor-not-allowed opacity-50'
                        : isSelected
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'hover:-translate-y-px hover:border-primary/40 hover:shadow-md'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={game.duplicate}
                      onChange={() => !game.duplicate && toggle(game.key)}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {game.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {game.subtitle}
                      </p>
                    </div>
                    {game.duplicate && (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        Already imported
                      </Badge>
                    )}
                  </label>
                )
              })}
            </div>
          </div>
        )}

        <DialogFooter className="flex-row-reverse">
          <Button
            type="button"
            onClick={handleImport}
            disabled={selectedCount === 0 || isLoading || isRefreshing}
          >
            Import{selectedCount > 0 ? ` (${selectedCount})` : ''}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
          >
            Refresh
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
