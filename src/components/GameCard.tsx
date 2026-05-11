import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { backendDetails } from '@/lib/launchers'
import { cn } from '@/lib/utils'
import type { GameEntry } from '@/types/GameEntry'

type GameCardProps = {
  game: GameEntry
  selected: boolean
  onDelete: (gameId: string) => void
  onLaunch: (game: GameEntry) => void
  onSelect: (gameId: string) => void
}

export function GameCard({
  game,
  selected,
  onDelete,
  onLaunch,
  onSelect,
}: GameCardProps) {
  return (
    <Card
      className={cn(
        'gap-4 py-4 transition-colors',
        selected && 'border-primary bg-primary/5'
      )}
    >
      <CardHeader className="px-4">
        <CardTitle className="flex items-start justify-between gap-3">
          <button
            type="button"
            className="cursor-pointer text-start text-lg font-semibold"
            onClick={() => onSelect(game.id)}
          >
            {game.title}
          </button>
          <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground capitalize">
            {game.status}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 text-sm">
        <div>
          <p className="font-medium">{backendDetails[game.backend].label}</p>
          <p className="truncate text-muted-foreground">{game.executablePath}</p>
        </div>
        {game.notes ? (
          <p className="line-clamp-2 text-muted-foreground">{game.notes}</p>
        ) : null}
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={() => onLaunch(game)}>
            Launch
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onSelect(game.id)}
          >
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onDelete(game.id)}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
