// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, expect, it } from 'vitest'
import {
  COMPATIBILITY_PRESETS,
  applyPreset,
  getPreset,
} from '@/lib/compatibility-presets'
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
  winePrefixPath: '/Prefixes/test',
  environmentVariables: { EXISTING_VAR: '1' },
  renderer: 'wined3d',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('COMPATIBILITY_PRESETS', () => {
  it('contains all bundled presets', () => {
    const ids = COMPATIBILITY_PRESETS.map(p => p.id)
    expect(ids).toContain('dx11-dxmt')
    expect(ids).toContain('gptk-experimental')
    expect(ids).toContain('wine-basic')
  })

  it('each preset has required fields', () => {
    for (const preset of COMPATIBILITY_PRESETS) {
      expect(typeof preset.id).toBe('string')
      expect(typeof preset.name).toBe('string')
      expect(typeof preset.description).toBe('string')
      expect(typeof preset.runtimeKind).toBe('string')
    }
  })
})

describe('getPreset', () => {
  it('returns a preset by id', () => {
    const preset = getPreset('dx11-dxmt')
    expect(preset?.id).toBe('dx11-dxmt')
    expect(preset?.name).toBe('DX11 via DXMT')
  })

  it('returns undefined for unknown id', () => {
    expect(getPreset('not-a-preset')).toBeUndefined()
  })
})

describe('applyPreset', () => {
  it('sets runtimeProviderId from preset runtimeKind', () => {
    const preset = getPreset('gptk-experimental')
    if (!preset) throw new Error('preset not found')
    const result = applyPreset(buildProfile(), preset)
    expect(result.runtimeProviderId).toBe('gptk')
  })

  it('sets renderer from preset', () => {
    const preset = getPreset('dx11-dxmt')
    if (!preset) throw new Error('preset not found')
    const result = applyPreset(buildProfile(), preset)
    expect(result.renderer).toBe('dxmt')
  })

  it('merges env vars, preserving profile keys not in preset', () => {
    const preset = getPreset('wine-basic')
    if (!preset) throw new Error('preset not found')
    const profile = buildProfile({
      environmentVariables: { EXISTING_VAR: '1', MY_CUSTOM: 'yes' },
    })
    const result = applyPreset(profile, preset)
    expect(result.environmentVariables).toMatchObject({
      EXISTING_VAR: '1',
      MY_CUSTOM: 'yes',
      WINEDEBUG: '-all',
    })
  })

  it('preset env vars overwrite same-key profile env vars', () => {
    const preset = getPreset('wine-basic')
    if (!preset) throw new Error('preset not found')
    const profile = buildProfile({
      environmentVariables: { WINEDEBUG: 'err+all' },
    })
    const result = applyPreset(profile, preset)
    expect(result.environmentVariables?.['WINEDEBUG']).toBe('-all')
  })

  it('preserves paths, title, id and other profile fields', () => {
    const preset = getPreset('dx11-dxmt')
    if (!preset) throw new Error('preset not found')
    const profile = buildProfile()
    const result = applyPreset(profile, preset)
    expect(result.id).toBe(profile.id)
    expect(result.title).toBe(profile.title)
    expect(result.executablePath).toBe(profile.executablePath)
    expect(result.winePrefixPath).toBe(profile.winePrefixPath)
  })

  it('appends preset launchArgs after existing profile args when present', () => {
    const base = getPreset('wine-basic')
    if (!base) throw new Error('preset not found')
    const preset = { ...base, launchArgs: ['--no-sandbox'] }
    const profile = buildProfile({ launchArgs: ['--verbose'] })
    const result = applyPreset(profile, preset)
    expect(result.launchArgs).toEqual(['--verbose', '--no-sandbox'])
  })

  it('leaves launchArgs unchanged when preset has none', () => {
    const preset = getPreset('wine-basic')
    if (!preset) throw new Error('preset not found')
    const profile = buildProfile({ launchArgs: ['--verbose'] })
    const result = applyPreset(profile, preset)
    expect(result.launchArgs).toEqual(['--verbose'])
  })

  it('keeps existing renderer when preset has no renderer field', () => {
    const base = getPreset('wine-basic')
    if (!base) throw new Error('preset not found')
    const preset = { ...base, renderer: undefined }
    const profile = buildProfile({ renderer: 'moltenvk' })
    const result = applyPreset(profile, preset)
    expect(result.renderer).toBe('moltenvk')
  })
})
