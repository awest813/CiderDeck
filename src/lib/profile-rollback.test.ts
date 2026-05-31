// SPDX-License-Identifier: GPL-3.0-or-later

import { describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { applyCompatibilityProfileWithUndo } from '@/lib/profile-rollback'
import type { CompatibilityProfile } from '@/types/Profile'

vi.mock('sonner', () => ({
  toast: { success: vi.fn() },
}))

const buildProfile = (): CompatibilityProfile => ({
  id: 'p1',
  title: 'Test',
  category: 'compatibility-layer',
  helper: 'wine',
  backend: 'wine',
  status: 'ready',
  renderer: 'wined3d',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

describe('applyCompatibilityProfileWithUndo', () => {
  it('updates profile and registers undo toast action', () => {
    const profile = buildProfile()
    const next = { ...profile, renderer: 'dxmt' as const }
    const onUpdate = vi.fn()

    applyCompatibilityProfileWithUndo(profile, next, 'Updated', onUpdate)

    expect(onUpdate).toHaveBeenCalledWith(next)
    expect(toast.success).toHaveBeenCalledWith(
      'Updated',
      expect.objectContaining({
        action: expect.objectContaining({ label: 'Undo' }),
      })
    )

    const call = vi.mocked(toast.success).mock.calls[0]?.[1] as {
      action?: { onClick?: () => void }
    }
    call.action?.onClick?.()
    expect(onUpdate).toHaveBeenCalledWith(profile)
  })
})
