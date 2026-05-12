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
import type { DetectedGame, GameImportSource } from '@/lib/bindings'

interface DetectedGamesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  detectedGames: DetectedGame[]
  isLoading: boolean
  isRefreshing: boolean
  onImport: (games: DetectedGame[], importSource: GameImportSource) => void
  onRefresh: () => void
}

export function DetectedGamesDialog({
  open,
  onOpenChange,
  detectedGames,
  isLoading,
  isRefreshing,
  onImport,
  onRefresh,
}: DetectedGamesDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(detectedGames.map(g => g.exe_path))
  )

  const toggle = (exePath: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(exePath)) {
        next.delete(exePath)
      } else {
        next.add(exePath)
      }
      return next
    })
  }

  const selectedGames = detectedGames.filter(g => selected.has(g.exe_path))

  const handleImport = (source: GameImportSource) => {
    onImport(selectedGames, source)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Auto-Detect Games</DialogTitle>
          <DialogDescription>
            {isLoading || isRefreshing
              ? 'Scanning bottles for installed games…'
              : detectedGames.length === 0
                ? 'No games found in your bottles. Try installing a game first.'
                : `Found ${detectedGames.length} game${detectedGames.length === 1 ? '' : 's'}. Select the ones you want to add.`}
          </DialogDescription>
        </DialogHeader>

        {isLoading || isRefreshing ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        ) : detectedGames.length > 0 ? (
          <div className="max-h-80 space-y-1.5 overflow-y-auto">
            {detectedGames.map(game => {
              const isSelected = selected.has(game.exe_path)
              return (
                <label
                  key={game.exe_path}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-3 shadow-sm transition-all duration-150',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'hover:-translate-y-px hover:border-primary/40 hover:shadow-md'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(game.exe_path)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{game.name}</p>
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {game.bottle_name}
                      </Badge>
                      {game.publisher ? (
                        <Badge variant="outline" className="text-xs">
                          {game.publisher}
                        </Badge>
                      ) : null}
                      {game.version ? (
                        <Badge variant="outline" className="text-xs">
                          v{game.version}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        ) : null}

        <DialogFooter className="flex-row-reverse">
          <Button
            type="button"
            onClick={() => handleImport('ExeMsi')}
            disabled={selectedGames.length === 0 || isLoading || isRefreshing}
          >
            Import {selectedGames.length > 0 ? `(${selectedGames.length})` : ''}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onRefresh}
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
