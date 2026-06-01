import { describe, expect, it } from 'vitest'
import {
  buildBottleConfigEnv,
  normalizeBottleConfig,
  wineExecutableForRuntime,
} from '@/lib/bottle-config'

describe('buildBottleConfigEnv', () => {
  it('builds env vars for enhanced sync and boolean toggles', () => {
    expect(
      buildBottleConfigEnv({
        enhanced_sync: 'Msync',
        dxvk_async: true,
        dxvk_hud: null,
        metal_hud: true,
        metal_trace: false,
        dxr: true,
        avx: true,
      })
    ).toEqual({
      WINEESYNC: '1',
      WINEMSYNC: '1',
      DXVK_ASYNC: '1',
      MTL_HUD_ENABLED: '1',
      D3DM_SUPPORT_DXR: '1',
      ROSETTA_ADVERTISE_AVX: '1',
    })
  })

  it('maps DXVK HUD presets', () => {
    expect(buildBottleConfigEnv({ dxvk_hud: 'Fps' })).toEqual({
      DXVK_HUD: 'fps',
    })
    expect(buildBottleConfigEnv({ dxvk_hud: 'Partial' })).toEqual({
      DXVK_HUD: 'devinfo,fps,frametimes',
    })
    expect(buildBottleConfigEnv({ dxvk_hud: 'Full' })).toEqual({
      DXVK_HUD: 'memory,devinfo,fps,frametimes',
    })
  })
})

describe('normalizeBottleConfig', () => {
  it('returns null when the config is empty', () => {
    expect(normalizeBottleConfig({})).toBeNull()
  })

  it('preserves configured values', () => {
    expect(
      normalizeBottleConfig({
        enhanced_sync: 'Esync',
        dxvk_async: false,
      })
    ).toEqual({
      enhanced_sync: 'Esync',
      dxvk_async: false,
      dxvk_hud: null,
      metal_hud: null,
      metal_trace: null,
      dxr: null,
      avx: null,
    })
  })
})

describe('wineExecutableForRuntime', () => {
  it('returns runtime-specific wine binaries', () => {
    expect(wineExecutableForRuntime('whisky')).toContain('Whisky.app')
    expect(wineExecutableForRuntime('crossover')).toContain('CrossOver.app')
    expect(wineExecutableForRuntime('wine')).toBe('wine')
  })
})
