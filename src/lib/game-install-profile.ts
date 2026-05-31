// SPDX-License-Identifier: GPL-3.0-or-later

import { newProfileTimestamps } from '@/lib/profile-storage'
import type {
  CompatibilityBackend,
  CompatibilityProfile,
} from '@/types/Profile'

export function createInstallerLaunchProfile(input: {
  title: string
  runtime: CompatibilityBackend
  executablePath: string
  bottlePath: string
}): CompatibilityProfile {
  const { id, createdAt, updatedAt } = newProfileTimestamps()

  return {
    id,
    title: input.title,
    category: 'compatibility-layer',
    helper: input.runtime,
    backend: input.runtime,
    runtimeProviderId: input.runtime,
    status: 'ready',
    executablePath: input.executablePath,
    winePrefixPath: input.bottlePath,
    bottlePath: input.bottlePath,
    createdAt,
    updatedAt,
  }
}
