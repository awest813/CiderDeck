// SPDX-License-Identifier: GPL-3.0-or-later

import { useEffect, useRef, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  runtimeBottleLabel,
  useBottleDetection,
} from '@/hooks/use-bottle-detection'
import { isTauri } from '@tauri-apps/api/core'
import { commands } from '@/lib/tauri-bindings'
import type { Bottle } from '@/lib/tauri-bindings'
import type { BottleHealth } from '@/lib/tauri-bindings'

const healthVariant: Record<
  BottleHealth,
  'default' | 'secondary' | 'destructive'
> = {
  Good: 'default',
  Warning: 'secondary',
  Broken: 'destructive',
}

function healthLabel(health: BottleHealth): string {
  return health === 'Good' ? 'Healthy' : health
}

function formatStorage(bytes: number | null): string {
  if (bytes === null) return 'Unknown'
  if (bytes === 0) return '0 B'
  const gb = 1024 * 1024 * 1024
  const mb = 1024 * 1024
  if (bytes >= gb) return `${(bytes / gb).toFixed(1)} GB`
  if (bytes >= mb) return `${(bytes / mb).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

// ============================================================================
// Create / Import Dialogs
// ============================================================================

interface CreateDialogProps {
  onCreated: () => void
  onCancel: () => void
}

function CreateBottleDialog({ onCreated, onCancel }: CreateDialogProps) {
  const [name, setName] = useState('')
  const [path, setPath] = useState('')
  const [runtime, setRuntime] = useState('wine')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!name.trim() || !path.trim()) {
      setError('Name and path are required.')
      return
    }
    setSubmitting(true)
    setError('')
    const result = await commands.createBottle(
      path.trim(),
      name.trim(),
      runtime
    )
    if (result.status === 'ok') {
      onCreated()
    } else {
      setError(result.error)
    }
    setSubmitting(false)
  }

  return (
    <Card
      className="h-fit"
      role="dialog"
      aria-modal="true"
      aria-label="Create bottle"
    >
      <CardHeader>
        <CardTitle>Create Bottle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Runtime</span>
          <select
            value={runtime}
            onChange={e => setRuntime(e.target.value)}
            className="border-input dark:bg-input/30 h-9 w-full appearance-none rounded-lg border bg-transparent px-3 py-2 text-sm transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] hover:bg-accent/30"
          >
            <option value="wine">Wine</option>
            <option value="whisky">Whisky</option>
            <option value="crossover">CrossOver</option>
            <option value="gptk">GPTK</option>
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Name</span>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="My Game Bottle"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Path</span>
          <Input
            value={path}
            onChange={e => setPath(e.target.value)}
            placeholder={
              runtime === 'whisky'
                ? '~/Library/Containers/.../Bottles/Name'
                : '~/.wine-game'
            }
          />
        </label>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            className="flex-1"
            onClick={handleCreate}
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface ImportDialogProps {
  onImported: () => void
  onCancel: () => void
}

function ImportBottleDialog({ onImported, onCancel }: ImportDialogProps) {
  const [archivePath, setArchivePath] = useState('')
  const [destPath, setDestPath] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleImport = async () => {
    if (!archivePath.trim() || !destPath.trim() || !name.trim()) {
      setError('All fields are required.')
      return
    }
    setSubmitting(true)
    setError('')
    const result = await commands.importBottle(
      archivePath.trim(),
      destPath.trim(),
      name.trim()
    )
    if (result.status === 'ok') {
      onImported()
    } else {
      setError(result.error)
    }
    setSubmitting(false)
  }

  return (
    <Card
      className="h-fit"
      role="dialog"
      aria-modal="true"
      aria-label="Import bottle"
    >
      <CardHeader>
        <CardTitle>Import Bottle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Archive path (.tar.gz)</span>
          <Input
            value={archivePath}
            onChange={e => setArchivePath(e.target.value)}
            placeholder="/path/to/bottle-backup.tar.gz"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Destination path</span>
          <Input
            value={destPath}
            onChange={e => setDestPath(e.target.value)}
            placeholder="~/.wine-imported"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Name</span>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Imported Bottle"
          />
        </label>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            className="flex-1"
            onClick={handleImport}
            disabled={submitting}
          >
            {submitting ? 'Importing...' : 'Import'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Bottle Card
// ============================================================================

interface BottleCardProps {
  bottle: Bottle
  onRefresh: () => void
}

function BottleCard({ bottle, onRefresh }: BottleCardProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmAction, setConfirmAction] = useState<
    'delete' | 'reset' | 'repair' | null
  >(null)
  const [showClone, setShowClone] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState(bottle.notes ?? '')
  const [exportPath, setExportPath] = useState('')
  const [cloneDest, setCloneDest] = useState('')
  const [cloneName, setCloneName] = useState(`${bottle.name}-copy`)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    setNotes(bottle.notes ?? '')
  }, [bottle.notes])

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (e) {
      if (mountedRef.current) setError(String(e))
    } finally {
      if (mountedRef.current) setBusy(false)
    }
  }

  const handleDelete = () =>
    run(async () => {
      const result = await commands.deleteBottle(bottle.path)
      if (result.status === 'ok') {
        onRefresh()
      } else {
        setError(result.error)
      }
    })

  const handleRepair = () =>
    run(async () => {
      const result = await commands.repairBottle(bottle.path, bottle.runtime)
      if (result.status === 'ok') {
        onRefresh()
      } else {
        setError(result.error)
      }
    })

  const handleReset = () =>
    run(async () => {
      const result = await commands.resetBottle(
        bottle.path,
        bottle.name,
        bottle.runtime
      )
      if (result.status === 'ok') {
        onRefresh()
      } else {
        setError(result.error)
      }
    })

  const handleClone = async () => {
    if (!cloneDest.trim() || !cloneName.trim()) return
    await run(async () => {
      const result = await commands.cloneBottle(
        bottle.path,
        cloneDest.trim(),
        cloneName.trim()
      )
      if (result.status === 'ok') {
        setShowClone(false)
        onRefresh()
      } else {
        setError(result.error)
      }
    })
  }

  const handleExport = async () => {
    if (!exportPath.trim()) return
    await run(async () => {
      const result = await commands.exportBottle(bottle.path, exportPath.trim())
      if (result.status === 'ok') {
        setShowExport(false)
      } else {
        setError(result.error)
      }
    })
  }

  const handleSaveNotes = async () => {
    await run(async () => {
      const result = await commands.saveBottleNotes(bottle.path, notes)
      if (result.status === 'ok') {
        setEditingNotes(false)
        onRefresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="rounded-xl border bg-card p-3 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{bottle.name}</p>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground truncate">
            {bottle.path}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {bottle.windows_version ? (
              <Badge variant="outline" className="text-xs">
                {bottle.windows_version}
              </Badge>
            ) : null}
            {bottle.architecture ? (
              <Badge variant="outline" className="text-xs">
                {bottle.architecture}
              </Badge>
            ) : null}
            {bottle.storage_bytes ? (
              <Badge variant="outline" className="text-xs">
                {formatStorage(bottle.storage_bytes)}
              </Badge>
            ) : null}
            {bottle.installed_components.map(comp => (
              <Badge key={comp} variant="secondary" className="text-xs">
                {comp}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge variant={healthVariant[bottle.health] ?? 'secondary'}>
            {healthLabel(bottle.health)}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                aria-label={`Actions for bottle ${bottle.name}`}
                disabled={busy}
              >
                {busy ? '...' : '⋯'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditingNotes(true)}>
                Edit Notes
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setShowClone(true)}>
                Clone
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setShowExport(true)}>
                Export…
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setConfirmAction('repair')}>
                Repair
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setConfirmAction('reset')}
                className="text-yellow-600 dark:text-yellow-400"
              >
                Reset
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setConfirmAction('delete')}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Notes display */}
      {bottle.notes && !editingNotes ? (
        <p className="mt-2 text-xs text-muted-foreground italic border-t pt-2">
          {bottle.notes}
        </p>
      ) : null}

      {/* Notes editor */}
      {editingNotes ? (
        <div className="mt-2 space-y-2 border-t pt-2">
          <textarea
            className="w-full rounded border bg-background p-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Compatibility notes, tips, known issues…"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="h-6 text-xs"
              onClick={handleSaveNotes}
              disabled={busy}
            >
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => {
                setNotes(bottle.notes ?? '')
                setEditingNotes(false)
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {/* Clone inline form */}
      {showClone ? (
        <div className="mt-2 space-y-2 border-t pt-2">
          <p className="text-xs font-medium">Clone to new location</p>
          <Input
            className="h-7 text-xs"
            value={cloneName}
            onChange={e => setCloneName(e.target.value)}
            placeholder="New bottle name"
          />
          <Input
            className="h-7 text-xs"
            value={cloneDest}
            onChange={e => setCloneDest(e.target.value)}
            placeholder="Destination path (e.g. ~/.wine-clone)"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="h-6 text-xs"
              onClick={handleClone}
              disabled={busy || !cloneDest.trim() || !cloneName.trim()}
            >
              {busy ? 'Cloning...' : 'Clone'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setShowClone(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {/* Export inline form */}
      {showExport ? (
        <div className="mt-2 space-y-2 border-t pt-2">
          <p className="text-xs font-medium">Export to archive</p>
          <Input
            className="h-7 text-xs"
            value={exportPath}
            onChange={e => setExportPath(e.target.value)}
            placeholder="/path/to/backup.tar.gz"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="h-6 text-xs"
              onClick={handleExport}
              disabled={busy || !exportPath.trim()}
            >
              {busy ? 'Exporting...' : 'Export'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setShowExport(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}

      {/* Repair confirmation */}
      <AlertDialog
        open={confirmAction === 'repair'}
        onOpenChange={open => {
          if (!open) setConfirmAction(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Repair bottle?</AlertDialogTitle>
            <AlertDialogDescription>
              This will run <code>wineboot --update</code> to re-initialise Wine
              internals. Your data will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmAction(null)
                handleRepair()
              }}
            >
              Repair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset confirmation */}
      <AlertDialog
        open={confirmAction === 'reset'}
        onOpenChange={open => {
          if (!open) setConfirmAction(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset bottle?</AlertDialogTitle>
            <AlertDialogDescription>
              This will wipe the Windows filesystem and registry for &quot;
              {bottle.name}&quot; and reinitialise it as a fresh prefix. All
              installed software will be lost. Your notes will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-yellow-600 text-white hover:bg-yellow-700"
              onClick={() => {
                setConfirmAction(null)
                handleReset()
              }}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={confirmAction === 'delete'}
        onOpenChange={open => {
          if (!open) setConfirmAction(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bottle?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{bottle.name}&quot; and all its files will be permanently
              deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setConfirmAction(null)
                handleDelete()
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ============================================================================
// Bottle Manager
// ============================================================================

export function BottleManager() {
  const { bottles, loading, error, refresh } = useBottleDetection()
  const [showCreate, setShowCreate] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const grouped = bottles.reduce(
    (acc, bottle) => {
      const key = bottle.runtime
      if (!acc[key]) acc[key] = []
      acc[key].push(bottle)
      return acc
    },
    {} as Record<string, Bottle[]>
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Bottles &amp; Prefixes</CardTitle>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refresh()}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowImport(true)}
          >
            Import
          </Button>
          <Button type="button" size="sm" onClick={() => setShowCreate(true)}>
            + New Bottle
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {!isTauri() ? (
          <p className="text-muted-foreground">
            Bottle management is only available in the native Tauri app.
          </p>
        ) : loading ? (
          <p className="text-muted-foreground">Scanning for bottles...</p>
        ) : error ? (
          <p className="text-destructive">{error}</p>
        ) : bottles.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed bg-muted/20 p-6 text-center transition-colors hover:border-muted-foreground/25">
            <div className="space-y-1">
              <p className="text-2xl text-muted-foreground/20 select-none">
                🫧
              </p>
              <p className="text-sm text-muted-foreground">
                No bottles detected. Create a new bottle or ensure Wine/Whisky/
                CrossOver is installed with existing bottles.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([runtime, items]) => (
              <div key={runtime}>
                <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  {runtimeBottleLabel(runtime)}
                </h3>
                <div className="space-y-2">
                  {items.map(bottle => (
                    <BottleCard
                      key={bottle.id}
                      bottle={bottle}
                      onRefresh={refresh}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreate ? (
          <CreateBottleDialog
            onCreated={() => {
              setShowCreate(false)
              refresh()
            }}
            onCancel={() => setShowCreate(false)}
          />
        ) : null}

        {showImport ? (
          <ImportBottleDialog
            onImported={() => {
              setShowImport(false)
              refresh()
            }}
            onCancel={() => setShowImport(false)}
          />
        ) : null}
      </CardContent>
    </Card>
  )
}
