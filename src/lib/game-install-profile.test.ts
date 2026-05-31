// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, expect, it } from 'vitest'
import { createInstallerLaunchProfile } from '@/lib/game-install-profile'

describe('createInstallerLaunchProfile', () => {
  it('creates a ready compatibility profile for the bottle and executable', () => {
    const profile = createInstallerLaunchProfile({
      title: 'Test Game',
      runtime: 'whisky',
      executablePath: 'Z:\\games\\test.exe',
      bottlePath: '/path/to/bottle',
    })

    expect(profile.category).toBe('compatibility-layer')
    expect(profile.helper).toBe('whisky')
    expect(profile.executablePath).toBe('Z:\\games\\test.exe')
    expect(profile.winePrefixPath).toBe('/path/to/bottle')
    expect(profile.status).toBe('ready')
  })
})
