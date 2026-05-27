// SPDX-License-Identifier: GPL-3.0-or-later

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
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Game } from '@/lib/bindings'

interface GameCardProps {
  game: Game
  selected: boolean
  onSelect: (gameId: string) => void
  onLaunch: (game: Game) => Promise<void>
  onDelete: (gameId: string) => void
  profileCount: number
  launching: boolean
}

const importSourceLabel: Record<string, string> = {
  Manual: 'Manual',
  AppBundle: 'App Bundle',
  ExeMsi: 'EXE/MSI',
  SteamLibrary: 'Steam',
  EpicLibrary: 'Epic',
}

export function GameCard({
  game,
  selected,
  onSelect,
  onLaunch,
  onDelete,
  profileCount,
  launching,
}: GameCardProps) {
  return (
    <Card
      className={cn(
        'group cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
        selected && 'ring-2 ring-primary'
      )}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(game.id)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(game.id)
        }
      }}
    >
      <div className="relative flex h-40 items-center justify-center overflow-hidden bg-muted">
        {game.artworkPath ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105 img-premium"
              style={{
                backgroundImage: `url("${game.artworkPath.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}")`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </>
        ) : (
          <span className="text-4xl text-muted-foreground/30 select-none">
            🎮
          </span>
        )}
        <Badge
          variant="secondary"
          className="absolute top-2 right-2 text-xs backdrop-blur-sm bg-background/60"
        >
          {importSourceLabel[game.importSource] ?? game.importSource}
        </Badge>
        {profileCount > 0 ? (
          <Badge className="absolute bottom-2 left-2 text-xs shadow-sm">
            {profileCount} {profileCount === 1 ? 'profile' : 'profiles'}
          </Badge>
        ) : null}
      </div>
      <CardContent className="space-y-2 p-3">
        <h3 className="truncate text-sm font-semibold">{game.title}</h3>
        {game.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {game.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {game.tags.length > 3 ? (
              <Badge variant="outline" className="text-xs">
                +{game.tags.length - 3}
              </Badge>
            ) : null}
          </div>
        ) : null}
        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
          <Button
            type="button"
            size="sm"
            onClick={() => onLaunch(game)}
            disabled={profileCount === 0 || launching}
          >
            {launching ? 'Launching...' : 'Launch'}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" size="sm" variant="ghost">
                Delete
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
      </CardContent>
    </Card>
  )
}
