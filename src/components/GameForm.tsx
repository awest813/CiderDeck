import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createId } from '@/lib/storage'
import type {
  CompatibilityBackend,
  GameEntry,
  GameStatus,
} from '@/types/GameEntry'

const backendOptions: CompatibilityBackend[] = [
  'wine',
  'crossover',
  'whisky',
  'gptk',
]

const statusOptions: GameStatus[] = [
  'untested',
  'perfect',
  'playable',
  'boots',
  'broken',
]

interface GameFormState {
  title: string
  executablePath: string
  backend: CompatibilityBackend
  status: GameStatus
  bottlePath: string
  launchArgs: string
  environmentVariables: string
  notes: string
}

interface GameFormProps {
  game?: GameEntry
  onSave: (game: GameEntry) => void
}

const toEnvironmentText = (environmentVariables?: Record<string, string>) => {
  if (!environmentVariables) {
    return ''
  }

  return Object.entries(environmentVariables)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
}

const parseEnvironmentText = (environmentText: string) => {
  const environmentVariables: Record<string, string> = {}

  for (const line of environmentText.split('\n')) {
    const trimmedLine = line.trim()
    const separatorIndex = trimmedLine.indexOf('=')

    if (separatorIndex <= 0) {
      continue
    }

    const key = trimmedLine.slice(0, separatorIndex).trim()
    const value = trimmedLine.slice(separatorIndex + 1).trim()

    if (key) {
      environmentVariables[key] = value
    }
  }

  return Object.keys(environmentVariables).length > 0
    ? environmentVariables
    : undefined
}

const getInitialState = (game?: GameEntry): GameFormState => ({
  title: game?.title ?? '',
  executablePath: game?.executablePath ?? '',
  backend: game?.backend ?? 'wine',
  status: game?.status ?? 'untested',
  bottlePath: game?.bottlePath ?? '',
  launchArgs: game?.launchArgs ?? '',
  environmentVariables: toEnvironmentText(game?.environmentVariables),
  notes: game?.notes ?? '',
})

export function GameForm({ game, onSave }: GameFormProps) {
  const [formState, setFormState] = useState<GameFormState>(() =>
    getInitialState(game)
  )

  useEffect(() => {
    setFormState(getInitialState(game))
  }, [game])

  const updateField = (field: keyof GameFormState, value: string) => {
    setFormState(currentState => ({ ...currentState, [field]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const now = new Date().toISOString()
    onSave({
      id: game?.id ?? createId(),
      title: formState.title.trim(),
      executablePath: formState.executablePath.trim(),
      backend: formState.backend,
      status: formState.status,
      bottlePath: formState.bottlePath.trim() || undefined,
      launchArgs: formState.launchArgs.trim() || undefined,
      environmentVariables: parseEnvironmentText(
        formState.environmentVariables
      ),
      notes: formState.notes.trim() || undefined,
      logs: game?.logs ?? [],
      createdAt: game?.createdAt ?? now,
      updatedAt: now,
    })

    if (!game) {
      setFormState(getInitialState())
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>{game ? 'Edit Game' : 'Add Game'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2 text-sm font-medium">
            <span>Title</span>
            <input
              required
              className="w-full rounded-md border bg-background px-3 py-2"
              value={formState.title}
              onChange={event => updateField('title', event.target.value)}
            />
          </label>

          <label className="block space-y-2 text-sm font-medium">
            <span>Executable path</span>
            <input
              required
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="/Users/me/Games/Game.exe"
              value={formState.executablePath}
              onChange={event =>
                updateField('executablePath', event.target.value)
              }
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-2 text-sm font-medium">
              <span>Backend</span>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 capitalize"
                value={formState.backend}
                onChange={event => updateField('backend', event.target.value)}
              >
                {backendOptions.map(backend => (
                  <option key={backend} value={backend}>
                    {backend}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-sm font-medium">
              <span>Status</span>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 capitalize"
                value={formState.status}
                onChange={event => updateField('status', event.target.value)}
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-2 text-sm font-medium">
            <span>Bottle or prefix path</span>
            <input
              className="w-full rounded-md border bg-background px-3 py-2"
              value={formState.bottlePath}
              onChange={event => updateField('bottlePath', event.target.value)}
            />
          </label>

          <label className="block space-y-2 text-sm font-medium">
            <span>Launch args</span>
            <input
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="-fullscreen -dx11"
              value={formState.launchArgs}
              onChange={event => updateField('launchArgs', event.target.value)}
            />
          </label>

          <label className="block space-y-2 text-sm font-medium">
            <span>Environment variables</span>
            <textarea
              className="min-h-20 w-full rounded-md border bg-background px-3 py-2"
              placeholder="KEY=value"
              value={formState.environmentVariables}
              onChange={event =>
                updateField('environmentVariables', event.target.value)
              }
            />
          </label>

          <label className="block space-y-2 text-sm font-medium">
            <span>Notes</span>
            <textarea
              className="min-h-24 w-full rounded-md border bg-background px-3 py-2"
              value={formState.notes}
              onChange={event => updateField('notes', event.target.value)}
            />
          </label>

          <Button type="submit" className="w-full">
            {game ? 'Save Changes' : 'Add Game'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
