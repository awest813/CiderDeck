// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, expect, it } from 'vitest'
import {
  defaultBottlePath,
  isInstallerPath,
  nameFromPath,
} from '@/lib/game-path-utils'

describe('nameFromPath', () => {
  it('strips extensions and normalizes separators', () => {
    expect(nameFromPath('/Games/My_Game-Setup.exe')).toBe('My Game Setup')
  })
})

describe('isInstallerPath', () => {
  it('accepts exe and msi', () => {
    expect(isInstallerPath('/tmp/setup.exe')).toBe(true)
    expect(isInstallerPath('/tmp/setup.msi')).toBe(true)
  })

  it('rejects other files', () => {
    expect(isInstallerPath('/tmp/readme.txt')).toBe(false)
  })
})

describe('defaultBottlePath', () => {
  it('builds runtime-specific bottle paths', () => {
    expect(defaultBottlePath('My Game', 'wine')).toBe('~/.wine-my-game')
    expect(defaultBottlePath('My Game', 'whisky')).toContain(
      'Whisky/Bottles/my-game'
    )
  })
})
