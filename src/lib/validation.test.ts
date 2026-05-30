// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, expect, it } from 'vitest'
import { validateCompatibilityProfile, validateProfile } from '@/lib/validation'
import type { CompatibilityProfile } from '@/types/Profile'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function compatProfile(
  overrides: Partial<CompatibilityProfile> = {}
): CompatibilityProfile {
  return {
    id: 'test-compat',
    title: 'Test Compatibility Profile',
    category: 'compatibility-layer',
    helper: 'wine',
    backend: 'wine',
    status: 'unconfigured',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Wine backend
// ---------------------------------------------------------------------------

describe('validateCompatibilityProfile — Wine', () => {
  it('errors when executable path is missing', () => {
    const result = validateCompatibilityProfile(
      compatProfile({ backend: 'wine' })
    )
    expect(result.hasErrors).toBe(true)
    expect(
      result.issues.some(
        i => i.severity === 'error' && i.message.includes('executable')
      )
    ).toBe(true)
  })

  it('passes with executable path set', () => {
    const result = validateCompatibilityProfile(
      compatProfile({ backend: 'wine', executablePath: '/Games/test.exe' })
    )
    expect(result.hasErrors).toBe(false)
  })

  it('warns when no prefix is configured', () => {
    const result = validateCompatibilityProfile(
      compatProfile({ backend: 'wine', executablePath: '/Games/test.exe' })
    )
    expect(
      result.issues.some(
        i => i.severity === 'warning' && i.message.includes('prefix')
      )
    ).toBe(true)
  })

  it('no prefix warning when winePrefixPath is set', () => {
    const result = validateCompatibilityProfile(
      compatProfile({
        backend: 'wine',
        executablePath: '/Games/test.exe',
        winePrefixPath: '/home/.wine',
      })
    )
    expect(
      result.issues.some(
        i => i.severity === 'warning' && i.message.includes('prefix')
      )
    ).toBe(false)
  })

  it('no prefix warning when bottlePath is set', () => {
    const result = validateCompatibilityProfile(
      compatProfile({
        backend: 'wine',
        executablePath: '/Games/test.exe',
        bottlePath: '/home/.wine',
      })
    )
    expect(
      result.issues.some(
        i => i.severity === 'warning' && i.message.includes('prefix')
      )
    ).toBe(false)
  })

  it('info when no wine executable set', () => {
    const result = validateCompatibilityProfile(
      compatProfile({ backend: 'wine', executablePath: '/Games/test.exe' })
    )
    expect(
      result.issues.some(
        i => i.severity === 'info' && i.message.includes('Wine executable')
      )
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Whisky backend
// ---------------------------------------------------------------------------

describe('validateCompatibilityProfile — Whisky', () => {
  it('errors when executable path is missing', () => {
    const result = validateCompatibilityProfile(
      compatProfile({ backend: 'whisky', helper: 'whisky' })
    )
    expect(result.hasErrors).toBe(true)
  })

  it('warns when no prefix is configured', () => {
    const result = validateCompatibilityProfile(
      compatProfile({
        backend: 'whisky',
        helper: 'whisky',
        executablePath: '/Games/test.exe',
      })
    )
    expect(
      result.issues.some(
        i => i.severity === 'warning' && i.message.includes('Whisky prefix')
      )
    ).toBe(true)
  })

  it('info about Whisky wine64 default', () => {
    const result = validateCompatibilityProfile(
      compatProfile({
        backend: 'whisky',
        helper: 'whisky',
        executablePath: '/Games/test.exe',
      })
    )
    expect(
      result.issues.some(
        i => i.severity === 'info' && i.message.includes('wine64')
      )
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// CrossOver backend
// ---------------------------------------------------------------------------

describe('validateCompatibilityProfile — CrossOver', () => {
  it('errors when executable path is missing', () => {
    const result = validateCompatibilityProfile(
      compatProfile({ backend: 'crossover', helper: 'crossover' })
    )
    expect(result.hasErrors).toBe(true)
  })

  it('warns when no bottle is configured', () => {
    const result = validateCompatibilityProfile(
      compatProfile({
        backend: 'crossover',
        helper: 'crossover',
        executablePath: '/Games/test.exe',
      })
    )
    expect(
      result.issues.some(
        i => i.severity === 'warning' && i.message.includes('CrossOver bottle')
      )
    ).toBe(true)
  })

  it('no bottle warning when bottlePath is set', () => {
    const result = validateCompatibilityProfile(
      compatProfile({
        backend: 'crossover',
        helper: 'crossover',
        executablePath: '/Games/test.exe',
        bottlePath: 'Steam',
      })
    )
    expect(
      result.issues.some(
        i => i.severity === 'warning' && i.message.includes('bottle')
      )
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// GPTK backend
// ---------------------------------------------------------------------------

describe('validateCompatibilityProfile — GPTK', () => {
  it('errors when executable path is missing', () => {
    const result = validateCompatibilityProfile(
      compatProfile({ backend: 'gptk', helper: 'gptk' })
    )
    expect(result.hasErrors).toBe(true)
    expect(
      result.issues.some(
        i => i.severity === 'error' && i.message.includes('executable')
      )
    ).toBe(true)
  })

  it('errors when prefix/bottle path is missing', () => {
    const result = validateCompatibilityProfile(
      compatProfile({
        backend: 'gptk',
        helper: 'gptk',
        executablePath: '/Games/test.exe',
      })
    )
    expect(result.hasErrors).toBe(true)
    expect(
      result.issues.some(
        i => i.severity === 'error' && i.message.includes('prefix/bottle')
      )
    ).toBe(true)
  })

  it('no prefix error when winePrefixPath is set', () => {
    const result = validateCompatibilityProfile(
      compatProfile({
        backend: 'gptk',
        helper: 'gptk',
        executablePath: '/Games/test.exe',
        winePrefixPath: '/opt/gptk-prefix',
      })
    )
    expect(
      result.issues.some(
        i => i.severity === 'error' && i.message.includes('prefix/bottle')
      )
    ).toBe(false)
  })

  it('no prefix error when bottlePath is set', () => {
    const result = validateCompatibilityProfile(
      compatProfile({
        backend: 'gptk',
        helper: 'gptk',
        executablePath: '/Games/test.exe',
        bottlePath: '/opt/gptk-prefix',
      })
    )
    expect(
      result.issues.some(
        i => i.severity === 'error' && i.message.includes('prefix/bottle')
      )
    ).toBe(false)
  })

  it('includes GPTK info note', () => {
    const result = validateCompatibilityProfile(
      compatProfile({
        backend: 'gptk',
        helper: 'gptk',
        executablePath: '/Games/test.exe',
        bottlePath: '/opt/gptk-prefix',
      })
    )
    expect(
      result.issues.some(
        i => i.severity === 'info' && i.message.includes('GPTK')
      )
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Custom backend
// ---------------------------------------------------------------------------

describe('validateCompatibilityProfile — Custom', () => {
  it('errors when runtime executable is missing', () => {
    const result = validateCompatibilityProfile(
      compatProfile({
        backend: 'custom',
        helper: 'custom',
        executablePath: '/Games/test.exe',
      })
    )
    expect(result.hasErrors).toBe(true)
    expect(
      result.issues.some(
        i => i.severity === 'error' && i.message.includes('runtime executable')
      )
    ).toBe(true)
  })

  it('errors when target executable is missing', () => {
    const result = validateCompatibilityProfile(
      compatProfile({
        backend: 'custom',
        helper: 'custom',
        wineExecutablePath: '/opt/wine/bin/wine',
      })
    )
    expect(result.hasErrors).toBe(true)
    expect(
      result.issues.some(
        i => i.severity === 'error' && i.message.includes('target executable')
      )
    ).toBe(true)
  })

  it('passes when both executables are set', () => {
    const result = validateCompatibilityProfile(
      compatProfile({
        backend: 'custom',
        helper: 'custom',
        executablePath: '/Games/test.exe',
        wineExecutablePath: '/opt/wine/bin/wine',
      })
    )
    expect(result.hasErrors).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// validateProfile dispatch
// ---------------------------------------------------------------------------

describe('validateProfile — dispatch', () => {
  it('routes wine helper to compatibility validator', () => {
    const result = validateProfile(
      compatProfile({ helper: 'wine', backend: 'wine' })
    )
    expect(result.hasErrors).toBe(true) // missing executable
  })

  it('routes crossover helper to compatibility validator', () => {
    const result = validateProfile(
      compatProfile({ helper: 'crossover', backend: 'crossover' })
    )
    expect(result.hasErrors).toBe(true)
  })

  it('routes gptk helper to compatibility validator', () => {
    const result = validateProfile(
      compatProfile({ helper: 'gptk', backend: 'gptk' })
    )
    expect(result.hasErrors).toBe(true)
  })

  it('routes custom helper to compatibility validator', () => {
    const result = validateProfile(
      compatProfile({ helper: 'custom', backend: 'custom' })
    )
    expect(result.hasErrors).toBe(true)
  })

  it('routes whisky helper to compatibility validator', () => {
    const result = validateProfile(
      compatProfile({ helper: 'whisky', backend: 'whisky' })
    )
    expect(result.hasErrors).toBe(true)
  })
})
