// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, expect, it } from 'vitest'
import { getPreset } from '@/lib/compatibility-presets'
import {
  launcherStoreIdTag,
  parseLauncherStoreId,
  presetMatchesGameContext,
} from '@/lib/preset-game-matching'

describe('launcherStoreIdTag', () => {
  it('formats store tags for import', () => {
    expect(launcherStoreIdTag('steam', '22370')).toBe('store:steam:22370')
    expect(launcherStoreIdTag('gog', '1454315831')).toBe('store:gog:1454315831')
  })
})

describe('parseLauncherStoreId', () => {
  it('reads store id from tags', () => {
    const tags = ['gog', launcherStoreIdTag('gog', '1454315831')]
    expect(parseLauncherStoreId(tags, 'gog')).toBe('1454315831')
  })
})

describe('presetMatchesGameContext — Fallout 3 GOTY', () => {
  const preset = () => {
    const p = getPreset('fallout-3-goty')
    if (!p) throw new Error('preset not found')
    return p
  }

  it('matches Steam GOTY title', () => {
    expect(
      presetMatchesGameContext(preset(), {
        title: 'Fallout 3: Game of the Year Edition',
      })
    ).toBe(true)
  })

  it('matches GOG store id from import tags', () => {
    expect(
      presetMatchesGameContext(preset(), {
        title: 'Fallout 3: Game of the Year Edition',
        importSource: 'GogLibrary',
        tags: ['gog', launcherStoreIdTag('gog', '1454315831')],
      })
    ).toBe(true)
  })

  it('matches Epic store id from import tags', () => {
    expect(
      presetMatchesGameContext(preset(), {
        title: 'Fallout 3',
        importSource: 'EpicLibrary',
        tags: [
          'epic',
          launcherStoreIdTag('epic', 'adeae8bbfc94427db57c7dfecce3f1d4'),
        ],
      })
    ).toBe(true)
  })

  it('matches Steam app id from import tags', () => {
    expect(
      presetMatchesGameContext(preset(), {
        title: 'Fallout 3',
        importSource: 'SteamLibrary',
        tags: ['steam', launcherStoreIdTag('steam', '22370')],
      })
    ).toBe(true)
  })

  it('matches typical GOG install folder path', () => {
    expect(
      presetMatchesGameContext(preset(), {
        title: 'Imported game',
        installPath: '/Users/you/GOG Games/Fallout 3',
      })
    ).toBe(true)
  })

  it('does not match Fallout: New Vegas', () => {
    expect(
      presetMatchesGameContext(preset(), {
        title: 'Fallout: New Vegas',
      })
    ).toBe(false)
  })

  it('does not match unrelated GOG games', () => {
    expect(
      presetMatchesGameContext(preset(), {
        title: 'The Witcher 3',
        importSource: 'GogLibrary',
        tags: ['gog', launcherStoreIdTag('gog', '1207664643')],
      })
    ).toBe(false)
  })
})
