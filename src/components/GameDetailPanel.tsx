// SPDX-License-Identifier: GPL-3.0-or-later

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CompatibilityEnvToggles } from '@/components/CompatibilityEnvToggles'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { PresetPickerDialog } from '@/components/PresetPickerDialog'
import { RendererToggleGroup } from '@/components/RendererToggleGroup'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRuntimeDetection } from '@/hooks/use-runtime-detection'
import { helperLabel } from '@/lib/helper-catalog'
import {
  applyPreset,
  type CompatibilityPreset,
} from '@/lib/compatibility-presets'
import {
  normalizeRenderer,
  setProfileRenderer,
  type CompatibilityRenderer,
} from '@/lib/compatibility-toggles'
import { applyCompatibilityProfileWithUndo } from '@/lib/profile-rollback'
import {
  getCurrentRuntimeBackend,
  getQuickRuntimeOptions,
  type QuickRuntimeBackend,
} from '@/lib/quick-runtime-launch'
import { cn } from '@/lib/utils'
import type { Game } from '@/lib/bindings'
import type { CiderDeckProfile, CompatibilityProfile } from '@/types/Profile'

interface GameDetailPanelProps {
  game: Game
  profiles: CiderDeckProfile[]
  onUpdate: (game: Game) => void
  onUpdateProfile: (profile: CiderDeckProfile) => void
  onDelete: (gameId: string) => void
  onLaunch: (game: Game, profileId: string) => Promise<void>
  onLaunchWithRuntime: (
    game: Game,
    profileId: string,
    runtime: QuickRuntimeBackend
  ) => Promise<void>
}

const isCompatibilityProfile = (
  profile: CiderDeckProfile
): profile is CompatibilityProfile => profile.category === 'compatibility-layer'

export function GameDetailPanel({
  game,
  profiles,
  onUpdate,
  onUpdateProfile,
  onDelete,
  onLaunch,
  onLaunchWithRuntime,
}: GameDetailPanelProps) {
  const [editing, setEditing] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [title, setTitle] = useState(game.title)
  const [notes, setNotes] = useState(game.notes ?? '')
  const [artworkPath, setArtworkPath] = useState(game.artworkPath ?? '')
  const [tagInput, setTagInput] = useState(game.tags.join(', '))
  const [extraArgsInput, setExtraArgsInput] = useState(game.extraArgs.join(' '))
  const { runtimes } = useRuntimeDetection()

  const linkedProfiles = profiles.filter(p => game.profileIds.includes(p.id))
  const unlinkedProfiles = profiles.filter(p => !game.profileIds.includes(p.id))

  const handleSave = () => {
    onUpdate({
      ...game,
      title: title.trim() || game.title,
      notes: notes.trim() || null,
      artworkPath: artworkPath.trim() || null,
      tags: tagInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
      extraArgs: extraArgsInput
        .split(' ')
        .map(a => a.trim())
        .filter(Boolean),
    })
    setEditing(false)
  }

  const toggleProfile = (profileId: string) => {
    const linked = game.profileIds.includes(profileId)
    onUpdate({
      ...game,
      profileIds: linked
        ? game.profileIds.filter(id => id !== profileId)
        : [...game.profileIds, profileId],
    })
  }

  const handleLaunchWith = async (profileId: string) => {
    setLaunching(true)
    try {
      await onLaunch(game, profileId)
    } finally {
      setLaunching(false)
    }
  }

  const handleLaunchWithRuntime = async (
    profileId: string,
    runtime: QuickRuntimeBackend
  ) => {
    setLaunching(true)
    try {
      await onLaunchWithRuntime(game, profileId, runtime)
    } finally {
      setLaunching(false)
    }
  }

  const handleApplyPreset = (
    profile: CompatibilityProfile,
    preset: CompatibilityPreset
  ) => {
    applyCompatibilityProfileWithUndo(
      profile,
      applyPreset(profile, preset),
      `Applied preset "${preset.name}"`,
      onUpdateProfile
    )
  }

  const handleRendererChange = (
    profile: CompatibilityProfile,
    renderer: CompatibilityRenderer | undefined
  ) => {
    applyCompatibilityProfileWithUndo(
      profile,
      setProfileRenderer(profile, renderer),
      'Updated renderer',
      onUpdateProfile
    )
  }

  const handleCompatibilityProfileChange = (
    profile: CompatibilityProfile,
    next: CompatibilityProfile
  ) => {
    applyCompatibilityProfileWithUndo(
      profile,
      next,
      'Updated compatibility settings',
      onUpdateProfile
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{editing ? 'Edit Game' : game.title}</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                if (editing) {
                  setTitle(game.title)
                  setNotes(game.notes ?? '')
                  setArtworkPath(game.artworkPath ?? '')
                  setTagInput(game.tags.join(', '))
                  setExtraArgsInput(game.extraArgs.join(' '))
                }
                setEditing(!editing)
              }}
            >
              {editing ? 'Cancel' : 'Edit'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={cn(
              'relative flex h-32 items-center justify-center overflow-hidden rounded-lg bg-muted',
              game.artworkPath && 'bg-cover bg-center'
            )}
            style={
              game.artworkPath
                ? {
                    backgroundImage: `url("${game.artworkPath.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}")`,
                  }
                : undefined
            }
          >
            {game.artworkPath && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            )}
            {!game.artworkPath ? (
              <span className="text-3xl text-muted-foreground/30 select-none">
                🎮
              </span>
            ) : null}
          </div>

          {editing ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-artwork">Artwork path</Label>
                <Input
                  id="edit-artwork"
                  value={artworkPath}
                  onChange={e => setArtworkPath(e.target.value)}
                  placeholder="/path/to/cover.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                <Input
                  id="edit-tags"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-extra-args">
                  Extra launch arguments (space-separated)
                </Label>
                <Input
                  id="edit-extra-args"
                  value={extraArgsInput}
                  onChange={e => setExtraArgsInput(e.target.value)}
                  placeholder="-windowed -nosound"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <Button type="button" onClick={handleSave} className="w-full">
                Save Changes
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {game.installPath ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Install path
                  </p>
                  <p className="truncate text-sm">{game.installPath}</p>
                </div>
              ) : null}
              {game.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {game.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {game.extraArgs.length > 0 ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Extra launch args
                  </p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {game.extraArgs.join(' ')}
                  </p>
                </div>
              ) : null}
              {game.notes ? (
                <p className="text-sm text-muted-foreground">{game.notes}</p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <span>Linked Profiles</span>
            {linkedProfiles.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="sm" disabled={launching}>
                    {launching ? 'Launching…' : 'Launch with…'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Choose profile</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {linkedProfiles.map(profile => (
                    <DropdownMenuItem
                      key={profile.id}
                      onClick={() => handleLaunchWith(profile.id)}
                    >
                      {profile.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : linkedProfiles.length === 1 ? (
              <Button
                type="button"
                size="sm"
                disabled={launching}
                onClick={() => {
                  const profile = linkedProfiles[0]
                  if (profile) handleLaunchWith(profile.id)
                }}
              >
                {launching ? 'Launching…' : 'Launch'}
              </Button>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {linkedProfiles.length > 0 ? (
            linkedProfiles.map(profile => {
              const runtimeOptions = isCompatibilityProfile(profile)
                ? getQuickRuntimeOptions(profile, runtimes)
                : []

              return (
                <div
                  key={profile.id}
                  className="space-y-2 rounded-xl border bg-card p-2 shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{profile.title}</p>
                      {isCompatibilityProfile(profile) ? (
                        <p className="text-xs text-muted-foreground">
                          Runtime:{' '}
                          {helperLabel(getCurrentRuntimeBackend(profile))}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isCompatibilityProfile(profile) ? (
                        <PresetPickerDialog
                          trigger={
                            <Button type="button" size="sm" variant="outline">
                              Apply preset…
                            </Button>
                          }
                          runtimeKind={getCurrentRuntimeBackend(profile)}
                          game={{
                            title: game.title,
                            importSource: game.importSource,
                            tags: game.tags,
                            installPath: game.installPath,
                          }}
                          onApply={preset => handleApplyPreset(profile, preset)}
                        />
                      ) : null}
                      {runtimeOptions.length > 0 ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={launching}
                            >
                              Try with…
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                              Quick runtime switch
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {runtimeOptions.map(option => (
                              <DropdownMenuItem
                                key={option.id}
                                disabled={launching || !option.available}
                                onClick={() =>
                                  void handleLaunchWithRuntime(
                                    profile.id,
                                    option.id
                                  )
                                }
                              >
                                {option.label}
                                {!option.available ? (
                                  <DropdownMenuShortcut>
                                    Not found
                                  </DropdownMenuShortcut>
                                ) : null}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleProfile(profile.id)}
                      >
                        Unlink
                      </Button>
                    </div>
                  </div>
                  {isCompatibilityProfile(profile) ? (
                    <div className="space-y-2 border-t pt-2">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Renderer
                        </p>
                        <RendererToggleGroup
                          value={normalizeRenderer(profile.renderer)}
                          onChange={renderer =>
                            handleRendererChange(profile, renderer)
                          }
                        />
                      </div>
                      <CompatibilityEnvToggles
                        profile={profile}
                        onChange={next =>
                          handleCompatibilityProfileChange(profile, next)
                        }
                      />
                    </div>
                  ) : null}
                </div>
              )
            })
          ) : (
            <p className="text-sm text-muted-foreground">
              No profiles linked yet.
            </p>
          )}

          {unlinkedProfiles.length > 0 ? (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-medium text-muted-foreground">
                Link a profile:
              </p>
              {unlinkedProfiles.slice(0, 5).map(profile => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between rounded-xl border border-dashed p-2 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className="text-sm text-muted-foreground">
                    {profile.title}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => toggleProfile(profile.id)}
                  >
                    Link
                  </Button>
                </div>
              ))}
              {unlinkedProfiles.length > 5 ? (
                <p className="text-xs text-muted-foreground">
                  +{unlinkedProfiles.length - 5} more profiles — link from the
                  Profiles page
                </p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        trigger={
          <Button
            type="button"
            variant="ghost"
            className="w-full text-destructive hover:text-destructive"
          >
            Delete Game
          </Button>
        }
        label="Delete game?"
        entityName={game.title}
        onConfirm={() => onDelete(game.id)}
      />
    </div>
  )
}
