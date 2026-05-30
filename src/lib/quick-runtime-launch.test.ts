import { describe, expect, it } from 'vitest'
import {
  createQuickRuntimeLaunchProfile,
  getCurrentRuntimeBackend,
  getQuickRuntimeOptions,
} from '@/lib/quick-runtime-launch'
import type { RuntimeInfo } from '@/lib/bindings'
import type { CompatibilityProfile } from '@/types/Profile'

const buildProfile = (
  overrides: Partial<CompatibilityProfile> = {}
): CompatibilityProfile => ({
  id: 'compat-profile',
  title: 'Compatibility Profile',
  category: 'compatibility-layer',
  helper: 'wine',
  backend: 'wine',
  status: 'ready',
  executablePath: '/Games/Test/Game.exe',
  createdAt: '2026-05-30T00:00:00.000Z',
  updatedAt: '2026-05-30T00:00:00.000Z',
  ...overrides,
})

describe('quick runtime launch helpers', () => {
  it('returns alternate quick runtimes for the current profile', () => {
    expect(getQuickRuntimeOptions(buildProfile())).toEqual([
      { id: 'crossover', label: 'CrossOver', available: true },
      { id: 'whisky', label: 'Whisky', available: true },
      { id: 'gptk', label: 'Apple GPTK', available: true },
    ])
  })

  it('uses runtime detection results when available', () => {
    const runtimes: RuntimeInfo[] = [
      {
        id: 'crossover',
        name: 'CrossOver',
        available: false,
        version: null,
        executable_path: null,
        error: 'Missing',
      },
      {
        id: 'whisky',
        name: 'Whisky',
        available: true,
        version: '2.0',
        executable_path: '/Applications/Whisky.app',
        error: null,
      },
    ]

    expect(getQuickRuntimeOptions(buildProfile(), runtimes)).toEqual([
      { id: 'crossover', label: 'CrossOver', available: false },
      { id: 'whisky', label: 'Whisky', available: true },
      { id: 'gptk', label: 'Apple GPTK', available: false },
    ])
  })

  it('uses runtimeProviderId when present', () => {
    expect(
      getCurrentRuntimeBackend(
        buildProfile({
          backend: 'wine',
          runtimeProviderId: 'gptk',
        })
      )
    ).toBe('gptk')
  })

  it('creates an in-memory launch override profile', () => {
    const profile = buildProfile({
      backend: 'whisky',
      helper: 'whisky',
      bottlePath: '/Bottles/Game',
    })

    expect(createQuickRuntimeLaunchProfile(profile, 'wine')).toEqual({
      ...profile,
      runtimeProviderId: 'wine',
    })
  })
})
