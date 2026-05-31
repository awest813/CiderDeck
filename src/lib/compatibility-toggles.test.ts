// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, expect, it } from 'vitest'
import {
  COMPATIBILITY_ENV_TOGGLES,
  isEnvToggleEnabled,
  normalizeRenderer,
  setEnvToggle,
  setProfileRenderer,
} from '@/lib/compatibility-toggles'
import type { CompatibilityProfile } from '@/types/Profile'

const buildProfile = (
  overrides: Partial<CompatibilityProfile> = {}
): CompatibilityProfile => ({
  id: 'test-profile',
  title: 'Test Profile',
  category: 'compatibility-layer',
  helper: 'wine',
  backend: 'wine',
  status: 'ready',
  executablePath: '/Games/Test/Game.exe',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('normalizeRenderer', () => {
  it('treats auto and empty as undefined', () => {
    expect(normalizeRenderer(undefined)).toBeUndefined()
    expect(normalizeRenderer('auto')).toBeUndefined()
  })

  it('keeps explicit renderer values', () => {
    expect(normalizeRenderer('dxmt')).toBe('dxmt')
  })
})

describe('setProfileRenderer', () => {
  it('clears renderer when selecting auto renderer selection', () => {
    const result = setProfileRenderer(
      buildProfile({ renderer: 'dxmt' }),
      undefined
    )
    expect(result.renderer).toBeUndefined()
  })

  it('stores explicit renderer values', () => {
    const result = setProfileRenderer(buildProfile(), 'moltenvk')
    expect(result.renderer).toBe('moltenvk')
  })
})

describe('setEnvToggle', () => {
  const quietLogs = COMPATIBILITY_ENV_TOGGLES[0]
  if (!quietLogs) throw new Error('toggle not found')

  it('enables env toggle value', () => {
    const result = setEnvToggle(buildProfile(), quietLogs, true)
    expect(result.environmentVariables?.['WINEDEBUG']).toBe('-all')
  })

  it('removes env key when disabled', () => {
    const profile = buildProfile({
      environmentVariables: { WINEDEBUG: '-all', CUSTOM: '1' },
    })
    const result = setEnvToggle(profile, quietLogs, false)
    expect(result.environmentVariables?.['WINEDEBUG']).toBeUndefined()
    expect(result.environmentVariables?.['CUSTOM']).toBe('1')
  })

  it('clears environmentVariables when last key is removed', () => {
    const profile = buildProfile({
      environmentVariables: { WINEDEBUG: '-all' },
    })
    const result = setEnvToggle(profile, quietLogs, false)
    expect(result.environmentVariables).toBeUndefined()
  })
})

describe('isEnvToggleEnabled', () => {
  const quietLogs = COMPATIBILITY_ENV_TOGGLES[0]
  if (!quietLogs) throw new Error('toggle not found')

  it('returns true only for the configured enabled value', () => {
    expect(
      isEnvToggleEnabled(
        buildProfile({ environmentVariables: { WINEDEBUG: '-all' } }),
        quietLogs
      )
    ).toBe(true)
    expect(
      isEnvToggleEnabled(
        buildProfile({ environmentVariables: { WINEDEBUG: 'err+all' } }),
        quietLogs
      )
    ).toBe(false)
  })
})
