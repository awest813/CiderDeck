import { GameCard } from '@/components/GameCard'
import type { GameEntry } from '@/types/GameEntry'

interface GameLibraryProps {
  games: GameEntry[]
  selectedGameId?: string
  onDelete: (gameId: string) => void
  onLaunch: (game: GameEntry) => void
  onSelect: (gameId: string) => void
}

export function GameLibrary({
  games,
  selectedGameId,
  onDelete,
  onLaunch,
  onSelect,
}: GameLibraryProps) {
  if (games.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed p-8 text-center">
        <div>
          <h2 className="text-xl font-semibold">No games yet</h2>
          <p className="mt-2 text-muted-foreground">
            Add your first Windows game profile to start tracking compatibility.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {games.map(game => (
        <GameCard
          key={game.id}
          game={game}
          selected={game.id === selectedGameId}
          onDelete={onDelete}
          onLaunch={onLaunch}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
