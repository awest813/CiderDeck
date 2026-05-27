// SPDX-License-Identifier: GPL-3.0-or-later

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { GameImportSource } from '@/lib/bindings'
import type { GameImport } from '@/lib/bindings'

interface GameImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (gameImport: GameImport) => void
}

const importSources: {
  value: GameImportSource
  label: string
  description: string
}[] = [
  {
    value: 'Manual',
    label: 'Manual',
    description: 'Add a game entry manually',
  },
  {
    value: 'ExeMsi',
    label: 'EXE / MSI',
    description: 'Windows executable or installer',
  },
  { value: 'AppBundle', label: 'App Bundle', description: 'macOS .app bundle' },
  {
    value: 'SteamLibrary',
    label: 'Steam',
    description: 'Steam install folder',
  },
  {
    value: 'EpicLibrary',
    label: 'Epic',
    description: 'Epic Games install folder',
  },
  {
    value: 'GogLibrary',
    label: 'GOG',
    description: 'GOG Galaxy install folder',
  },
]

export function GameImportDialog({
  open,
  onOpenChange,
  onImport,
}: GameImportDialogProps) {
  const [title, setTitle] = useState('')
  const [source, setSource] = useState<GameImportSource>('Manual')
  const [installPath, setInstallPath] = useState('')
  const [tags, setTags] = useState('')

  const handleSubmit = () => {
    if (!title.trim()) return

    onImport({
      title: title.trim(),
      importSource: source,
      installPath: installPath.trim() || null,
      artworkPath: null,
      tags: tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
      notes: null,
      profileIds: [],
    })

    setTitle('')
    setSource('Manual')
    setInstallPath('')
    setTags('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Game</DialogTitle>
          <DialogDescription>
            Add a game to your library. You can link it to profiles later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="game-title">Title</Label>
            <Input
              id="game-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Game title"
            />
          </div>

          <div className="space-y-2">
            <Label>Import source</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {importSources.map(s => (
                <button
                  key={s.value}
                  type="button"
                  className={`rounded-xl border bg-card p-2.5 text-start text-sm shadow-sm transition-all duration-150 hover:-translate-y-px hover:shadow-md ${
                    source === s.value
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/40'
                  }`}
                  onClick={() => setSource(s.value)}
                >
                  <p className="font-medium tracking-tight">{s.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {(source === 'ExeMsi' ||
            source === 'AppBundle' ||
            source === 'SteamLibrary' ||
            source === 'EpicLibrary' ||
            source === 'GogLibrary') && (
            <div className="space-y-2">
              <Label htmlFor="install-path">Install path</Label>
              <Input
                id="install-path"
                value={installPath}
                onChange={e => setInstallPath(e.target.value)}
                placeholder={
                  source === 'ExeMsi'
                    ? '/path/to/game.exe'
                    : source === 'AppBundle'
                      ? '/Applications/Game.app'
                      : '/path/to/install/folder'
                }
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="game-tags">Tags (comma-separated)</Label>
            <Input
              id="game-tags"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="action, rpg, steam"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!title.trim()}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
