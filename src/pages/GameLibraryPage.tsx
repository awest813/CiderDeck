// SPDX-License-Identifier: GPL-3.0-or-later

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { GameCard } from '@/components/GameCard'
import { GameDetailPanel } from '@/components/GameDetailPanel'
import { GameImportDialog } from '@/components/GameImportDialog'
import { DetectedGamesDialog } from '@/components/DetectedGamesDialog'
import { Spinner } from '@/components/ui/spinner'
import {
  useGameDetection,
  useRefreshDetection,
} from '@/hooks/use-game-detection'
import {
  useGameLibrary,
  useSaveGame,
  useDeleteGame,
  useImportGame,
} from '@/services/game-library'
import { useProfileStore } from '@/services/profile-store'
import { launchProfile } from '@/lib/profile-runner'
import { cn } from '@/lib/utils'
import type {
  Game,
  GameImport,
  DetectedGame,
  GameImportSource,
} from '@/lib/bindings'

type ViewMode = 'grid' | 'list'

export function GameLibraryPage() {
  const [selectedGameId, setSelectedGameId] = useState<string>()
  const [importOpen, setImportOpen] = useState(false)
  const [importKey, setImportKey] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [detectOpen, setDetectOpen] = useState(false)
  const [detectKey, setDetectKey] = useState(0)

  const { data: games = [], isLoading: gamesLoading } = useGameLibrary()
  const { data: profiles = [] } = useProfileStore()
  const { data: detectedGames = [], isLoading: detectLoading } =
    useGameDetection(detectOpen)
  const refreshDetection = useRefreshDetection()
  const saveGame = useSaveGame()
  const deleteGame = useDeleteGame()
  const importGame = useImportGame()

  const selectedGame = games.find(g => g.id === selectedGameId)

  const allTags = [...new Set(games.flatMap(g => g.tags))].sort()

  const filteredGames = filterTag
    ? games.filter(g => g.tags.includes(filterTag))
    : games

  const handleImport = (gameImport: GameImport) => {
    importGame.mutate(gameImport)
  }

  const handleUpdateGame = (game: Game) => {
    saveGame.mutate(game)
  }

  const handleDeleteGame = (gameId: string) => {
    deleteGame.mutate(gameId)
    if (selectedGameId === gameId) {
      setSelectedGameId(undefined)
    }
  }

  const handleLaunch = async (game: Game) => {
    if (game.profileIds.length === 0) return
    const profile = profiles.find(p => p.id === game.profileIds[0])
    if (profile) {
      await launchProfile(profile)
    }
  }

  const handleImportDetected = (
    detected: DetectedGame[],
    _source: GameImportSource
  ) => {
    for (const g of detected) {
      const gameImport: GameImport = {
        title: g.name,
        profileIds: [],
        tags: [],
        notes: null,
        installPath: null,
        artworkPath: null,
        importSource: 'ExeMsi',
      }
      importGame.mutate(gameImport)
    }
  }

  const profileCountFor = (game: Game): number =>
    profiles.filter(p => game.profileIds.includes(p.id)).length

  if (gamesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <main className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_340px] gap-6 overflow-hidden p-6">
      <section className="min-w-0 overflow-auto pr-1">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Game Library</h2>
            <p className="mt-1 text-muted-foreground">
              Your games, linked to runtime profiles for one-click launch.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              setDetectKey(k => k + 1)
              setDetectOpen(true)
            }}
            variant="secondary"
          >
            + Auto-Detect
          </Button>
          <Button
            type="button"
            onClick={() => {
              setImportKey(k => k + 1)
              setImportOpen(true)
            }}
          >
            + Import Game
          </Button>
        </div>

        {allTags.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={filterTag === null ? 'secondary' : 'ghost'}
              onClick={() => setFilterTag(null)}
            >
              All
            </Button>
            {allTags.map(tag => (
              <Button
                key={tag}
                type="button"
                size="sm"
                variant={filterTag === tag ? 'secondary' : 'ghost'}
                onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
        ) : null}

        <div className="mb-4 flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>

        {filteredGames.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed bg-muted/30 p-8 text-center transition-colors hover:border-muted-foreground/25">
            <div className="space-y-2">
              <p className="text-4xl text-muted-foreground/20 select-none">
                🎮
              </p>
              <h3 className="text-xl font-semibold tracking-tight">
                No games yet
              </h3>
              <p className="text-sm text-muted-foreground">
                Import your first game to start building your library.
              </p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filteredGames.map(game => (
              <GameCard
                key={game.id}
                game={game}
                selected={game.id === selectedGameId}
                onSelect={setSelectedGameId}
                onLaunch={handleLaunch}
                onDelete={handleDeleteGame}
                profileCount={profileCountFor(game)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredGames.map(game => (
              <div
                key={game.id}
                className={cn(
                  'flex items-center justify-between rounded-lg border p-3 transition-all duration-150 cursor-pointer hover:shadow-sm',
                  game.id === selectedGameId
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent bg-card hover:border-border'
                )}
                onClick={() => setSelectedGameId(game.id)}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{game.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {game.importSource}{' '}
                    {game.profileIds.length > 0
                      ? `· ${game.profileIds.length} profile${game.profileIds.length > 1 ? 's' : ''}`
                      : ''}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation()
                    handleLaunch(game)
                  }}
                  disabled={game.profileIds.length === 0}
                >
                  Launch
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto">
        {selectedGame ? (
          <GameDetailPanel
            key={selectedGame.id}
            game={selectedGame}
            profiles={profiles}
            onUpdate={handleUpdateGame}
            onDelete={handleDeleteGame}
          />
        ) : (
          <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed bg-muted/20 p-6 text-center transition-colors hover:border-muted-foreground/25">
            <div className="space-y-1">
              <p className="text-2xl text-muted-foreground/20 select-none">
                🎮
              </p>
              <p className="text-sm text-muted-foreground">
                Select a game to view details and manage profiles.
              </p>
            </div>
          </div>
        )}
      </aside>

      <GameImportDialog
        key={importKey}
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
      />

      <DetectedGamesDialog
        key={detectKey}
        open={detectOpen}
        onOpenChange={setDetectOpen}
        detectedGames={detectedGames}
        isLoading={detectLoading}
        isRefreshing={refreshDetection.isPending}
        onImport={handleImportDetected}
        onRefresh={() =>
          refreshDetection.mutate(undefined, {
            onSuccess: () => setDetectKey(k => k + 1),
          })
        }
      />
    </main>
  )
}
