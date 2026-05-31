// SPDX-License-Identifier: GPL-3.0-or-later

import { toast } from 'sonner'
import type { CompatibilityProfile } from '@/types/Profile'

export const applyCompatibilityProfileWithUndo = (
  profile: CompatibilityProfile,
  next: CompatibilityProfile,
  message: string,
  onUpdate: (profile: CompatibilityProfile) => void
): void => {
  const previous = profile
  onUpdate(next)
  toast.success(message, {
    action: {
      label: 'Undo',
      onClick: () => onUpdate(previous),
    },
  })
}
