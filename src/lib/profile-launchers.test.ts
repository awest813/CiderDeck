import { describe, expect, it } from 'vitest'
import { buildCompatibilityLaunchRequest } from '@/lib/profile-launchers'
import type { CompatibilityProfile } from '@/types/Profile'

const baseProfile = (
  overrides: Partial<CompatibilityProfile>
): CompatibilityProfile => {
  const backend = overrides.backend ?? 'wine'

  return {
    id: `${backend}-profile`,
    title: `${backend} profile`,
    category: 'compatibility-layer',
    helper: backend,
    backend,
    status: 'ready',
    executablePath: '/Games/Test/Game.exe',
    createdAt: '2026-05-11T00:00:00.000Z',
    updatedAt: '2026-05-11T00:00:00.000Z',
    ...overrides,
  }
}

describe('buildCompatibilityLaunchRequest', () => {
  it('builds Wine requests with WINEPREFIX from bottlePath', () => {
    const request = buildCompatibilityLaunchRequest(
      baseProfile({
        backend: 'wine',
        helper: 'wine',
        bottlePath: '/prefix/wine',
      })
    )

    expect(request).toEqual({
      executablePath: 'wine',
      args: ['/Games/Test/Game.exe'],
      envVars: { WINEPREFIX: '/prefix/wine' },
    })
  })

  it('builds CrossOver requests with the bottle argument', () => {
    const request = buildCompatibilityLaunchRequest(
      baseProfile({
        backend: 'crossover',
        helper: 'crossover',
        bottlePath: 'Steam',
      })
    )

    expect(request).toEqual({
      executablePath:
        '/Applications/CrossOver.app/Contents/SharedSupport/CrossOver/bin/wine',
      args: ['--bottle', 'Steam', '--', '/Games/Test/Game.exe'],
      envVars: undefined,
    })
  })

  it('builds Whisky requests with bundled wine64 and WINEPREFIX', () => {
    const request = buildCompatibilityLaunchRequest(
      baseProfile({
        backend: 'whisky',
        helper: 'whisky',
        bottlePath: '/Users/me/Library/Containers/Whisky/Bottles/Test',
      })
    )

    expect(request).toEqual({
      executablePath: '/Applications/Whisky.app/Contents/MacOS/wine64',
      args: ['/Games/Test/Game.exe'],
      envVars: {
        WINEPREFIX: '/Users/me/Library/Containers/Whisky/Bottles/Test',
      },
    })
  })

  it('builds GPTK requests with bottlePath as a positional argument', () => {
    const request = buildCompatibilityLaunchRequest(
      baseProfile({
        backend: 'gptk',
        helper: 'gptk',
        bottlePath: '/prefix/gptk',
      })
    )

    expect(request).toEqual({
      executablePath: 'gameportingtoolkit',
      args: ['/prefix/gptk', '/Games/Test/Game.exe'],
      envVars: undefined,
    })
  })

  it('uses custom wineExecutablePath for Wine and Whisky', () => {
    const wineRequest = buildCompatibilityLaunchRequest(
      baseProfile({
        backend: 'wine',
        helper: 'wine',
        wineExecutablePath: '/opt/homebrew/bin/wine64',
      })
    )
    const whiskyRequest = buildCompatibilityLaunchRequest(
      baseProfile({
        backend: 'whisky',
        helper: 'whisky',
        wineExecutablePath: '/Applications/Whisky.app/bin/custom-wine64',
      })
    )

    expect(wineRequest.executablePath).toBe('/opt/homebrew/bin/wine64')
    expect(whiskyRequest.executablePath).toBe(
      '/Applications/Whisky.app/bin/custom-wine64'
    )
  })
})
