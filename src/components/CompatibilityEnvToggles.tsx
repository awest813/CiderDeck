// SPDX-License-Identifier: GPL-3.0-or-later

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  COMPATIBILITY_ENV_TOGGLES,
  isEnvToggleEnabled,
  setEnvToggle,
  type CompatibilityEnvToggle,
} from '@/lib/compatibility-toggles'
import type { CompatibilityProfile } from '@/types/Profile'

interface CompatibilityEnvTogglesProps {
  profile: CompatibilityProfile
  onChange: (profile: CompatibilityProfile) => void
  disabled?: boolean
}

export function CompatibilityEnvToggles({
  profile,
  onChange,
  disabled = false,
}: CompatibilityEnvTogglesProps) {
  const handleToggle = (toggle: CompatibilityEnvToggle, enabled: boolean) => {
    onChange(setEnvToggle(profile, toggle, enabled))
  }

  return (
    <div className="space-y-2">
      {COMPATIBILITY_ENV_TOGGLES.map(toggle => {
        const id = `env-toggle-${profile.id}-${toggle.id}`
        const enabled = isEnvToggleEnabled(profile, toggle)

        return (
          <div
            key={toggle.id}
            className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2"
          >
            <div className="min-w-0 space-y-0.5">
              <Label htmlFor={id} className="text-xs font-medium">
                {toggle.label}
              </Label>
              <p className="text-xs text-muted-foreground">
                {toggle.description}
              </p>
            </div>
            <Switch
              id={id}
              checked={enabled}
              disabled={disabled}
              onCheckedChange={checked => handleToggle(toggle, checked)}
            />
          </div>
        )
      })}
    </div>
  )
}
