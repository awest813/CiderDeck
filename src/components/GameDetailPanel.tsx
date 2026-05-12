// SPDX-License-Identifier: GPL-3.0-or-later

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Game } from '@/lib/bindings'
import type { CiderDeckProfile } from '@/types/Profile'

interface GameDetailPanelProps {
  game: Game
  profiles: CiderDeckProfile[]
  onUpdate: (game: Game) => void
  onDelete: (gameId: string) => void
}

export function GameDetailPanel({
  game,
  profiles,
  onUpdate,
  onDelete,
}: GameDetailPanelProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(game.title)
  const [notes, setNotes] = useState(game.notes ?? '')
  const [artworkPath, setArtworkPath] = useState(game.artworkPath ?? '')
  const [tagInput, setTagInput] = useState(game.tags.join(', '))

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
                    backgroundImage: `url("${CSS.escape(game.artworkPath)}")`,
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
              {game.notes ? (
                <p className="text-sm text-muted-foreground">{game.notes}</p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Linked Profiles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {linkedProfiles.length > 0 ? (
            linkedProfiles.map(profile => (
              <div
                key={profile.id}
                className="flex items-center justify-between rounded-xl border bg-card p-2 shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <span className="text-sm">{profile.title}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleProfile(profile.id)}
                >
                  Unlink
                </Button>
              </div>
            ))
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
            </div>
          ) : null}
        </CardContent>
      </Card>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-destructive hover:text-destructive"
          >
            Delete Game
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete game?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{game.title}&rdquo; will be permanently removed. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete(game.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
