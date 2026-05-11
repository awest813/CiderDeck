import { useState } from 'react'
import { GameForm } from '@/components/GameForm'
import { GameLibrary } from '@/components/GameLibrary'
import { LogViewer } from '@/components/LogViewer'
import { Sidebar } from '@/components/Sidebar'
import { backendDetails, launchGame } from '@/lib/launchers'
import {
  appendGameLog,
  deleteGame,
  loadGames,
  saveGames,
  upsertGame,
} from '@/lib/storage'
import { SettingsPage } from '@/pages/SettingsPage'
import type { GameEntry } from '@/types/GameEntry'

type ActivePage = 'library' | 'settings'

export function LibraryPage() {
  const [activePage, setActivePage] = useState<ActivePage>('library')
  const [games, setGames] = useState<GameEntry[]>(() => loadGames())
  const [selectedGameId, setSelectedGameId] = useState<string>()

  const selectedGame = games.find(game => game.id === selectedGameId)

  const persistGames = (nextGames: GameEntry[]) => {
    saveGames(nextGames)
    return nextGames
  }

  const handleSaveGame = (game: GameEntry) => {
    setGames(currentGames => persistGames(upsertGame(currentGames, game)))
    setSelectedGameId(game.id)
  }

  const handleDeleteGame = (gameId: string) => {
    setGames(currentGames => persistGames(deleteGame(currentGames, gameId)))
    if (selectedGameId === gameId) {
      setSelectedGameId(undefined)
    }
  }

  const handleLaunchGame = async (game: GameEntry) => {
    const log = await launchGame(game)
    setGames(currentGames => persistGames(appendGameLog(currentGames, game.id, log)))
    setSelectedGameId(game.id)
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <Sidebar
        activePage={activePage}
        gameCount={games.length}
        onPageChange={setActivePage}
      />

      {activePage === 'settings' ? (
        <main className="min-w-0 flex-1 overflow-auto">
          <SettingsPage />
        </main>
      ) : (
        <main className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_360px] gap-6 overflow-hidden p-6">
          <section className="min-w-0 overflow-auto pr-1">
            <div className="mb-6">
              <p className="text-sm font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                Game Library
              </p>
              <h2 className="mt-2 text-4xl font-bold">CiderDeck</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Manage Windows game profiles for Wine, CrossOver, Whisky, and
                Apple Game Porting Toolkit.
              </p>
            </div>

            <div className="mb-6 grid grid-cols-4 gap-3">
              {Object.entries(backendDetails).map(([backend, details]) => (
                <div key={backend} className="rounded-lg border bg-card p-3">
                  <p className="font-medium">{details.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {details.description}
                  </p>
                </div>
              ))}
            </div>

            <GameLibrary
              games={games}
              selectedGameId={selectedGameId}
              onDelete={handleDeleteGame}
              onLaunch={handleLaunchGame}
              onSelect={setSelectedGameId}
            />
          </section>

          <aside className="flex min-h-0 flex-col gap-6 overflow-hidden">
            <GameForm game={selectedGame} onSave={handleSaveGame} />
            <LogViewer game={selectedGame} />
          </aside>
        </main>
      )}
    </div>
  )
}
