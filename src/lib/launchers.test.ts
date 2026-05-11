import { describe, expect, it } from 'vitest'
import { getLauncherPreview } from '@/lib/launchers'
import type { GameEntry } from '@/types/GameEntry'

const game = (overrides: Partial<GameEntry> = {}): GameEntry => ({
  id: 'game-1',
  title: 'Test Game',
  executablePath: '/Games/Test/Game.exe',
  backend: 'wine',
  status: 'untested',
  logs: [],
  createdAt: '2026-05-11T00:00:00.000Z',
  updatedAt: '2026-05-11T00:00:00.000Z',
  ...overrides,
})

describe('getLauncherPreview', () => {
  it('sets WINEPREFIX as environment for Wine bottles', () => {
    expect(
      getLauncherPreview(game({ bottlePath: '/Users/me/.wine-game' }))
    ).toMatchObject({
      program: 'wine',
      args: ['/Games/Test/Game.exe'],
      environment: { WINEPREFIX: '/Users/me/.wine-game' },
    })
  })

  it('preserves quoted launch arguments', () => {
    expect(
      getLauncherPreview(
        game({ launchArgs: '--profile "value with spaces" --flag' })
      ).args
    ).toEqual([
      '/Games/Test/Game.exe',
      '--profile',
      'value with spaces',
      '--flag',
    ])
  })
})
