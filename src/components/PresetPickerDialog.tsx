// SPDX-License-Identifier: GPL-3.0-or-later

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { HelperId } from '@/types/Profile'
import { helperLabel } from '@/lib/helper-catalog'
import {
  COMPATIBILITY_PRESETS,
  type CompatibilityPreset,
} from '@/lib/compatibility-presets'

interface PresetPickerDialogProps {
  trigger: ReactNode
  onApply: (preset: CompatibilityPreset) => void
}

export function PresetPickerDialog({
  trigger,
  onApply,
}: PresetPickerDialogProps) {
  const [open, setOpen] = useState(false)

  const handleApply = (preset: CompatibilityPreset) => {
    onApply(preset)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Apply compatibility preset</DialogTitle>
          <DialogDescription>
            Presets apply a known-good runtime configuration to this profile.
            Your executable path, prefix, and other settings are preserved.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 pt-1">
          {COMPATIBILITY_PRESETS.map(preset => (
            <div
              key={preset.id}
              className="flex items-start justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{preset.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {helperLabel(preset.runtimeKind as HelperId)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {preset.description}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={() => handleApply(preset)}
              >
                Apply
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
