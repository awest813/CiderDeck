import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildCompatibilityLaunchRequest } from '@/lib/profile-launchers'
import { commands } from '@/lib/tauri-bindings'
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
  beforeEach(() => {
    vi.mocked(commands.getBottleMeta).mockResolvedValue({
      status: 'ok',
      data: { config: null },
    })
  })

  it('builds Wine requests with WINEPREFIX from bottlePath', async () => {
    const request = await buildCompatibilityLaunchRequest(
      baseProfile({
        backend: 'wine',
        helper: 'wine',
        bottlePath: '/prefix/wine',
      })
    )

    expect(request).toEqual({
      executablePath: 'wine',
      args: ['/Games/Test/Game.exe'],
      envVars: { WINEDEBUG: '-all', WINEPREFIX: '/prefix/wine' },
    })
  })

  it('builds CrossOver requests with the bottle argument', async () => {
    const request = await buildCompatibilityLaunchRequest(
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

  it('builds Whisky requests with bundled wine64 and WINEPREFIX', async () => {
    const request = await buildCompatibilityLaunchRequest(
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

  it('builds GPTK requests with bottlePath as a positional argument', async () => {
    const request = await buildCompatibilityLaunchRequest(
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

  it('uses custom wineExecutablePath for Wine and Whisky', async () => {
    const wineRequest = await buildCompatibilityLaunchRequest(
      baseProfile({
        backend: 'wine',
        helper: 'wine',
        wineExecutablePath: '/opt/homebrew/bin/wine64',
      })
    )
    const whiskyRequest = await buildCompatibilityLaunchRequest(
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

  it('supports runtimeProviderId and winePrefixPath fields', async () => {
    const request = await buildCompatibilityLaunchRequest(
      baseProfile({
        backend: 'wine',
        helper: 'wine',
        runtimeProviderId: 'wine',
        bottlePath: undefined,
        winePrefixPath: '/prefix/from-runtime-profile',
      })
    )

    expect(request.envVars).toMatchObject({
      WINEPREFIX: '/prefix/from-runtime-profile',
    })
  })

  it('maps windows/renderer/dll overrides into launch environment', async () => {
    const request = await buildCompatibilityLaunchRequest(
      baseProfile({
        backend: 'wine',
        helper: 'wine',
        windowsVersion: 'win10',
        renderer: 'dxmt',
        dllOverrides: {
          d3d11: 'native,builtin',
          dxgi: 'native,builtin',
        },
      })
    )

    expect(request.envVars).toMatchObject({
      CIDERDECK_WINDOWS_VERSION: 'win10',
      CIDERDECK_RENDERER: 'dxmt',
      WINEDLLOVERRIDES: 'd3d11=native,builtin;dxgi=native,builtin',
    })
  })

  it('merges bottle config env vars before profile overrides', async () => {
    vi.mocked(commands.getBottleMeta).mockResolvedValue({
      status: 'ok',
      data: {
        config: {
          enhanced_sync: 'Msync',
          dxvk_async: true,
        },
      },
    })

    const request = await buildCompatibilityLaunchRequest(
      baseProfile({
        backend: 'wine',
        helper: 'wine',
        bottlePath: '/prefix/wine',
        environmentVariables: {
          DXVK_ASYNC: '0',
          CUSTOM_FLAG: '1',
        },
      })
    )

    expect(request.envVars).toMatchObject({
      WINEPREFIX: '/prefix/wine',
      WINEESYNC: '1',
      WINEMSYNC: '1',
      DXVK_ASYNC: '0',
      CUSTOM_FLAG: '1',
    })
  })
})
