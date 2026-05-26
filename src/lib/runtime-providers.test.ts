// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, expect, it } from 'vitest'
import {
  CROSSOVER_DEFAULT_WINE_PATH,
  getRuntimeProvider,
  RUNTIME_PROVIDERS,
  WHISKY_DEFAULT_WINE_PATH,
} from '@/lib/runtime-providers'
import type { ProviderConfig, RuntimeProvider } from '@/lib/runtime-providers'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const cfg = (overrides: Partial<ProviderConfig> = {}): ProviderConfig => ({
  targetExecutable: '/Games/Test/Game.exe',
  ...overrides,
})

/** Retrieves a provider by id; throws if missing so tests fail fast. */
function requireProvider(id: string): RuntimeProvider {
  const p = getRuntimeProvider(id)
  if (!p) throw new Error(`Provider '${id}' not found in registry`)
  return p
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

describe('getRuntimeProvider / RUNTIME_PROVIDERS', () => {
  it('returns all five providers', () => {
    const ids = RUNTIME_PROVIDERS.map(p => p.id)
    expect(ids).toContain('wine')
    expect(ids).toContain('crossover')
    expect(ids).toContain('whisky')
    expect(ids).toContain('gptk')
    expect(ids).toContain('custom')
    expect(ids).toHaveLength(5)
  })

  it('getRuntimeProvider returns the right provider by id', () => {
    for (const id of ['wine', 'crossover', 'whisky', 'gptk', 'custom']) {
      const p = getRuntimeProvider(id)
      expect(p).toBeDefined()
      if (p) expect(p.id).toBe(id)
    }
  })

  it('getRuntimeProvider returns undefined for unknown id', () => {
    expect(getRuntimeProvider('unknown-runtime')).toBeUndefined()
    expect(getRuntimeProvider('')).toBeUndefined()
  })

  it('all provider ids are consistent with registry lookup', () => {
    for (const provider of RUNTIME_PROVIDERS) {
      expect(getRuntimeProvider(provider.id)).toBe(provider)
    }
  })
})

// ---------------------------------------------------------------------------
// Wine provider
// ---------------------------------------------------------------------------

describe('WineProvider', () => {
  const wine = requireProvider('wine')

  it('defaults program to "wine"', () => {
    const cmd = wine.buildLaunchCommand(cfg())
    expect(cmd.program).toBe('wine')
  })

  it('respects custom runtimeExecutable', () => {
    const cmd = wine.buildLaunchCommand(
      cfg({ runtimeExecutable: '/opt/homebrew/bin/wine64' })
    )
    expect(cmd.program).toBe('/opt/homebrew/bin/wine64')
  })

  it('sets WINEPREFIX from containerPath', () => {
    const cmd = wine.buildLaunchCommand(cfg({ containerPath: '/prefix/wine' }))
    expect(cmd.env['WINEPREFIX']).toBe('/prefix/wine')
  })

  it('does not set WINEPREFIX when containerPath is absent', () => {
    const cmd = wine.buildLaunchCommand(cfg())
    expect(cmd.env['WINEPREFIX']).toBeUndefined()
  })

  it('user env vars take precedence over WINEPREFIX default', () => {
    const cmd = wine.buildLaunchCommand(
      cfg({
        containerPath: '/provider/prefix',
        envVars: { WINEPREFIX: '/user/prefix' },
      })
    )
    expect(cmd.env['WINEPREFIX']).toBe('/user/prefix')
  })

  it('args = [targetExecutable, ...launchArgs]', () => {
    const cmd = wine.buildLaunchCommand(
      cfg({ launchArgs: ['-fullscreen', '-nosound'] })
    )
    expect(cmd.args).toEqual([
      '/Games/Test/Game.exe',
      '-fullscreen',
      '-nosound',
    ])
  })

  it('validate fails when targetExecutable is missing', () => {
    const result = wine.validate({ targetExecutable: undefined })
    expect(result.valid).toBe(false)
    expect(result.errors).not.toHaveLength(0)
  })

  it('validate passes when targetExecutable is set', () => {
    const result = wine.validate(cfg())
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('buildLaunchCommand throws when targetExecutable is missing', () => {
    expect(() =>
      wine.buildLaunchCommand({ targetExecutable: undefined })
    ).toThrow()
  })

  it('sets default WINEDEBUG for quieter logs', () => {
    const cmd = wine.buildLaunchCommand(cfg())
    expect(cmd.env['WINEDEBUG']).toBe('-all')
  })
})

// ---------------------------------------------------------------------------
// CrossOver provider
// ---------------------------------------------------------------------------

describe('CrossOverProvider', () => {
  const crossover = requireProvider('crossover')

  it('defaults program to CrossOver wine path', () => {
    const cmd = crossover.buildLaunchCommand(cfg())
    expect(cmd.program).toBe(CROSSOVER_DEFAULT_WINE_PATH)
  })

  it('inserts --bottle <name> -- <exe> when bottle is set', () => {
    const cmd = crossover.buildLaunchCommand(cfg({ containerPath: 'Steam' }))
    expect(cmd.args).toEqual([
      '--bottle',
      'Steam',
      '--',
      '/Games/Test/Game.exe',
    ])
  })

  it('omits --bottle flag when containerPath is absent', () => {
    const cmd = crossover.buildLaunchCommand(cfg())
    expect(cmd.args).toEqual(['--', '/Games/Test/Game.exe'])
  })

  it('appends launchArgs after target', () => {
    const cmd = crossover.buildLaunchCommand(
      cfg({ containerPath: 'My Bottle', launchArgs: ['-dx11'] })
    )
    expect(cmd.args).toEqual([
      '--bottle',
      'My Bottle',
      '--',
      '/Games/Test/Game.exe',
      '-dx11',
    ])
  })

  it('does not set WINEPREFIX', () => {
    const cmd = crossover.buildLaunchCommand(
      cfg({ containerPath: 'SomeBottle' })
    )
    expect(cmd.env['WINEPREFIX']).toBeUndefined()
  })

  it('validate fails when targetExecutable is missing', () => {
    expect(crossover.validate({}).valid).toBe(false)
  })

  it('respects custom runtimeExecutable', () => {
    const cmd = crossover.buildLaunchCommand(
      cfg({ runtimeExecutable: '/custom/wine' })
    )
    expect(cmd.program).toBe('/custom/wine')
  })
})

// ---------------------------------------------------------------------------
// Whisky provider
// ---------------------------------------------------------------------------

describe('WhiskyProvider', () => {
  const whisky = requireProvider('whisky')

  it('defaults program to Whisky wine64 path', () => {
    const cmd = whisky.buildLaunchCommand(cfg())
    expect(cmd.program).toBe(WHISKY_DEFAULT_WINE_PATH)
  })

  it('sets WINEPREFIX from containerPath', () => {
    const cmd = whisky.buildLaunchCommand(
      cfg({
        containerPath: '/Users/me/Library/Containers/Whisky/Bottles/Test',
      })
    )
    expect(cmd.env['WINEPREFIX']).toBe(
      '/Users/me/Library/Containers/Whisky/Bottles/Test'
    )
    expect(cmd.args).toEqual(['/Games/Test/Game.exe'])
  })

  it('respects custom runtimeExecutable', () => {
    const cmd = whisky.buildLaunchCommand(
      cfg({ runtimeExecutable: '/custom/wine64' })
    )
    expect(cmd.program).toBe('/custom/wine64')
  })

  it('user WINEPREFIX wins over containerPath', () => {
    const cmd = whisky.buildLaunchCommand(
      cfg({
        containerPath: '/provider/prefix',
        envVars: { WINEPREFIX: '/user/prefix' },
      })
    )
    expect(cmd.env['WINEPREFIX']).toBe('/user/prefix')
  })
})

// ---------------------------------------------------------------------------
// GPTK provider
// ---------------------------------------------------------------------------

describe('GptkProvider', () => {
  const gptk = requireProvider('gptk')

  it('defaults program to "gameportingtoolkit"', () => {
    const cmd = gptk.buildLaunchCommand(cfg({ containerPath: '/prefix/gptk' }))
    expect(cmd.program).toBe('gameportingtoolkit')
  })

  it('args = [containerPath, targetExecutable, ...launchArgs]', () => {
    const cmd = gptk.buildLaunchCommand(cfg({ containerPath: '/prefix/gptk' }))
    expect(cmd.args).toEqual(['/prefix/gptk', '/Games/Test/Game.exe'])
  })

  it('omits container from args when not set', () => {
    const cmd = gptk.buildLaunchCommand(cfg())
    expect(cmd.args).toEqual(['/Games/Test/Game.exe'])
  })

  it('validate fails when containerPath is missing', () => {
    const result = gptk.validate(cfg())
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.toLowerCase().includes('container'))).toBe(
      true
    )
  })

  it('validate fails when targetExecutable is missing', () => {
    const result = gptk.validate({ containerPath: '/prefix/gptk' })
    expect(result.valid).toBe(false)
  })

  it('validate passes when both paths are set', () => {
    const result = gptk.validate(cfg({ containerPath: '/prefix/gptk' }))
    expect(result.valid).toBe(true)
  })

  it('appends launchArgs after target', () => {
    const cmd = gptk.buildLaunchCommand(
      cfg({ containerPath: '/prefix/gptk', launchArgs: ['-dx12'] })
    )
    expect(cmd.args).toEqual(['/prefix/gptk', '/Games/Test/Game.exe', '-dx12'])
  })
})

// ---------------------------------------------------------------------------
// Custom provider
// ---------------------------------------------------------------------------

describe('CustomProvider', () => {
  const custom = requireProvider('custom')

  it('uses runtimeExecutable as program', () => {
    const cmd = custom.buildLaunchCommand(
      cfg({ runtimeExecutable: '/opt/my-wine/bin/wine' })
    )
    expect(cmd.program).toBe('/opt/my-wine/bin/wine')
    expect(cmd.args).toEqual(['/Games/Test/Game.exe'])
  })

  it('validate fails when runtimeExecutable is missing', () => {
    const result = custom.validate(cfg())
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('Runtime executable'))).toBe(true)
  })

  it('validate fails when targetExecutable is missing', () => {
    const result = custom.validate({
      runtimeExecutable: '/opt/wine/bin/wine',
    })
    expect(result.valid).toBe(false)
  })

  it('validate passes when both executables are set', () => {
    const result = custom.validate(
      cfg({ runtimeExecutable: '/opt/wine/bin/wine' })
    )
    expect(result.valid).toBe(true)
  })

  it('buildLaunchCommand throws when runtimeExecutable is missing', () => {
    expect(() => custom.buildLaunchCommand(cfg())).toThrow()
  })

  it('buildLaunchCommand throws when targetExecutable is missing', () => {
    expect(() =>
      custom.buildLaunchCommand({ runtimeExecutable: '/opt/wine/bin/wine' })
    ).toThrow()
  })

  it('includes launchArgs', () => {
    const cmd = custom.buildLaunchCommand(
      cfg({
        runtimeExecutable: '/opt/wine/bin/wine',
        launchArgs: ['-nosound'],
      })
    )
    expect(cmd.args).toEqual(['/Games/Test/Game.exe', '-nosound'])
  })

  it('passes through envVars', () => {
    const cmd = custom.buildLaunchCommand(
      cfg({
        runtimeExecutable: '/opt/wine/bin/wine',
        envVars: { MY_VAR: 'value' },
      })
    )
    expect(cmd.env['MY_VAR']).toBe('value')
  })
})
