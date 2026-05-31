// SPDX-License-Identifier: GPL-3.0-or-later

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { helperLabel } from '@/lib/helper-catalog'
import {
  groupPresetsForPicker,
  type CompatibilityPreset,
} from '@/lib/compatibility-presets'
import type { HelperId } from '@/types/Profile'
import type { RuntimeKind } from '@/runtimes/types'

interface PresetPickerDialogProps {
  trigger: ReactNode
  onApply: (preset: CompatibilityPreset) => void
  /** When set, matching presets are shown first under "Recommended". */
  runtimeKind?: RuntimeKind
  /** When set, game-specific presets (e.g. Fallout 3 GOTY) are listed first. */
  gameTitle?: string
}

function PresetRow({
  preset,
  onApply,
  highlight,
}: {
  preset: CompatibilityPreset
  onApply: (preset: CompatibilityPreset) => void
  highlight?: boolean
}) {
  return (
    <div
      className={
        highlight
          ? 'flex items-start justify-between gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3'
          : 'flex items-start justify-between gap-3 rounded-lg border p-3'
      }
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{preset.name}</span>
          {highlight ? (
            <Badge className="text-xs">For this game</Badge>
          ) : null}
          <Badge variant="secondary" className="text-xs">
            {helperLabel(preset.runtimeKind as HelperId)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{preset.description}</p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0"
        onClick={() => onApply(preset)}
      >
        Apply
      </Button>
    </div>
  )
}

export function PresetPickerDialog({
  trigger,
  onApply,
  runtimeKind,
  gameTitle,
}: PresetPickerDialogProps) {
  const [open, setOpen] = useState(false)
  const [pendingPreset, setPendingPreset] =
    useState<CompatibilityPreset | null>(null)
  const { priority, recommended, other } = groupPresetsForPicker({
    runtimeKind,
    gameTitle,
  })

  const handleApply = (preset: CompatibilityPreset) => {
    onApply(preset)
    setOpen(false)
    setPendingPreset(null)
  }

  const requestApply = (preset: CompatibilityPreset) => {
    if (runtimeKind && preset.runtimeKind !== runtimeKind) {
      setPendingPreset(preset)
      return
    }
    handleApply(preset)
  }

  return (
    <>
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
          <div className="max-h-[min(24rem,60vh)] space-y-3 overflow-y-auto pt-1">
            {priority.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Priority for this game
                </p>
                {priority.map(preset => (
                  <PresetRow
                    key={preset.id}
                    preset={preset}
                    onApply={requestApply}
                    highlight
                  />
                ))}
              </div>
            ) : null}
            {recommended.length > 0 ? (
              <div className="space-y-2">
                {runtimeKind && (other.length > 0 || priority.length > 0) ? (
                  <p className="text-xs font-medium text-muted-foreground">
                    Recommended for {helperLabel(runtimeKind as HelperId)}
                  </p>
                ) : null}
                {recommended.map(preset => (
                  <PresetRow
                    key={preset.id}
                    preset={preset}
                    onApply={requestApply}
                  />
                ))}
              </div>
            ) : null}
            {other.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Other runtimes
                </p>
                {other.map(preset => (
                  <PresetRow
                    key={preset.id}
                    preset={preset}
                    onApply={requestApply}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingPreset !== null}
        onOpenChange={isOpen => {
          if (!isOpen) setPendingPreset(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch runtime?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingPreset && runtimeKind ? (
                <>
                  &ldquo;{pendingPreset.name}&rdquo; targets{' '}
                  <strong>
                    {helperLabel(pendingPreset.runtimeKind as HelperId)}
                  </strong>
                  , but this profile uses{' '}
                  <strong>{helperLabel(runtimeKind as HelperId)}</strong>.
                  Applying it will change the profile backend and may require a
                  different bottle or Wine install.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingPreset) handleApply(pendingPreset)
              }}
            >
              Apply preset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
