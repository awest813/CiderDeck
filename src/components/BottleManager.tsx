// SPDX-License-Identifier: GPL-3.0-or-later

import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export function BottleManager() {
  const { bottles, loading, error, refresh } = useBottleDetection()
  const [showCreate, setShowCreate] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleDelete = async (bottle: Bottle) => {
    setDeleting(bottle.id)
    setDeleteError('')
    const result = await commands.deleteBottle(bottle.path)
    if (!mountedRef.current) return
    if (result.status === 'ok') {
      refresh()
    } else {
      setDeleteError(result.error)
    }
    setDeleting(null)
  }

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
                    <div
                      key={bottle.id}
                      className="rounded-xl border bg-card p-3 shadow-sm transition-all duration-200 hover:shadow-md"
                    >
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
                              <Badge
                                key={comp}
                                variant="secondary"
                                className="text-xs"
                              >
                                {comp}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <Badge
                            variant={
                              healthVariant[bottle.health] ?? 'secondary'
                            }
                          >
                            {healthLabel(bottle.health)}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-destructive"
                            aria-label={`Delete bottle ${bottle.name}`}
                            onClick={() => handleDelete(bottle)}
                            disabled={deleting === bottle.id}
                          >
                            {deleting === bottle.id ? '...' : 'Delete'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {deleteError ? (
          <p className="text-xs text-destructive">{deleteError}</p>
        ) : null}

        {showCreate ? (
          <CreateBottleDialog
            onCreated={() => {
              setShowCreate(false)
              refresh()
            }}
            onCancel={() => setShowCreate(false)}
          />
        ) : null}
      </CardContent>
    </Card>
  )
}
