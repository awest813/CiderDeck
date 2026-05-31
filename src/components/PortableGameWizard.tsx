// SPDX-License-Identifier: GPL-3.0-or-later

import { useState } from 'react'
import { isTauri } from '@tauri-apps/api/core'
import { open as openFilePicker } from '@tauri-apps/plugin-dialog'
import { FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { nameFromPath } from '@/lib/game-path-utils'
import { cn } from '@/lib/utils'
import type { GameImport, GameImportSource } from '@/lib/bindings'
import type { CiderDeckProfile } from '@/types/Profile'

type PortableSource = Extract<GameImportSource, 'ExeMsi' | 'AppBundle'>
type WizardStep = 'source' | 'file' | 'details' | 'profiles'

interface PortableGameWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (gameImport: GameImport) => void
  profiles: CiderDeckProfile[]
}

const STEP_LABELS: Record<WizardStep, string> = {
  source: 'Source',
  file: 'File',
  details: 'Details',
  profiles: 'Profiles',
}
const STEPS: WizardStep[] = ['source', 'file', 'details', 'profiles']

export function PortableGameWizard({
  open,
  onOpenChange,
  onImport,
  profiles,
}: PortableGameWizardProps) {
  const [step, setStep] = useState<WizardStep>('source')
  const [source, setSource] = useState<PortableSource>('ExeMsi')
  const [filePath, setFilePath] = useState('')
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(
    new Set()
  )

  const stepIndex = STEPS.indexOf(step)

  const reset = () => {
    setStep('source')
    setSource('ExeMsi')
    setFilePath('')
    setTitle('')
    setTags('')
    setNotes('')
    setSelectedProfiles(new Set())
  }

  const handleClose = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleBrowse = async () => {
    if (!isTauri()) return
    const filters =
      source === 'ExeMsi'
        ? [{ name: 'Windows Executables', extensions: ['exe', 'msi'] }]
        : undefined
    const directory = source === 'AppBundle'
    const result = await openFilePicker({ filters, directory, multiple: false })
    if (typeof result === 'string' && result) {
      setFilePath(result)
      if (!title) setTitle(nameFromPath(result))
    }
  }

  const handleNext = () => {
    if (step === 'source') setStep('file')
    else if (step === 'file') {
      if (!title && filePath) setTitle(nameFromPath(filePath))
      setStep('details')
    } else if (step === 'details') setStep('profiles')
    else handleFinish()
  }

  const handleBack = () => {
    if (step === 'file') setStep('source')
    else if (step === 'details') setStep('file')
    else if (step === 'profiles') setStep('details')
  }

  const handleFinish = () => {
    if (!title.trim()) return
    onImport({
      title: title.trim(),
      importSource: source,
      installPath: filePath.trim() || null,
      artworkPath: null,
      tags: tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
      notes: notes.trim() || null,
      profileIds: [...selectedProfiles],
      extraArgs: [],
    })
    reset()
    onOpenChange(false)
  }

  const canAdvance =
    step === 'source'
      ? true
      : step === 'file'
        ? true
        : step === 'details'
          ? title.trim().length > 0
          : true

  const toggleProfile = (id: string) => {
    setSelectedProfiles(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span>Add Portable Game</span>
            <span className="flex gap-1.5">
              {STEPS.map((s, i) => (
                <span
                  key={s}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-200',
                    i === stepIndex
                      ? 'bg-primary w-4'
                      : i < stepIndex
                        ? 'bg-primary/40 w-1.5'
                        : 'bg-muted-foreground/20 w-1.5'
                  )}
                />
              ))}
            </span>
          </DialogTitle>
          <DialogDescription>
            Step {stepIndex + 1} of {STEPS.length} — {STEP_LABELS[step]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {step === 'source' && (
            <div className="grid gap-2">
              <p className="text-sm text-muted-foreground">
                What kind of portable game are you adding?
              </p>
              {(
                [
                  {
                    value: 'ExeMsi' as const,
                    label: 'EXE / MSI',
                    description:
                      'Windows executable or installer already set up in a bottle',
                  },
                  {
                    value: 'AppBundle' as const,
                    label: 'App Bundle',
                    description: 'macOS .app bundle wrapping a Windows runtime',
                  },
                ] satisfies {
                  value: PortableSource
                  label: string
                  description: string
                }[]
              ).map(s => (
                <button
                  key={s.value}
                  type="button"
                  className={cn(
                    'rounded-xl border bg-card p-3 text-start shadow-sm transition-all duration-150 hover:-translate-y-px hover:shadow-md',
                    source === s.value
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/40'
                  )}
                  onClick={() => setSource(s.value)}
                >
                  <p className="font-medium tracking-tight">{s.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.description}
                  </p>
                </button>
              ))}
            </div>
          )}

          {step === 'file' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {source === 'ExeMsi'
                  ? 'Select the .exe or .msi that launches the game.'
                  : 'Select the .app bundle that launches the game.'}
              </p>
              <div className="flex gap-2">
                <Input
                  value={filePath}
                  onChange={e => setFilePath(e.target.value)}
                  placeholder={
                    source === 'ExeMsi'
                      ? '/path/to/game.exe'
                      : '/Applications/Game.app'
                  }
                  className="flex-1 font-mono text-sm"
                />
                {isTauri() && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleBrowse}
                    title="Browse…"
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {filePath && (
                <p className="text-xs text-muted-foreground">
                  Detected name:{' '}
                  <span className="font-medium text-foreground">
                    {nameFromPath(filePath)}
                  </span>
                </p>
              )}
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="wizard-title">Game title</Label>
                <Input
                  id="wizard-title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Game title"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wizard-tags">Tags (comma-separated)</Label>
                <Input
                  id="wizard-tags"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="action, rpg, wine"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wizard-notes">Notes (optional)</Label>
                <Input
                  id="wizard-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any compatibility notes…"
                />
              </div>
            </div>
          )}

          {step === 'profiles' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Link this game to one or more launch profiles, or skip for now.
              </p>
              {profiles.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No profiles yet. You can link profiles later from the game
                  detail panel.
                </p>
              ) : (
                <div className="max-h-52 space-y-1 overflow-y-auto">
                  {profiles.map(p => (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-2.5 transition-colors hover:bg-muted/40"
                    >
                      <Checkbox
                        checked={selectedProfiles.has(p.id)}
                        onCheckedChange={() => toggleProfile(p.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {p.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.helper}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={step === 'source' ? () => handleClose(false) : handleBack}
          >
            {step === 'source' ? 'Cancel' : 'Back'}
          </Button>
          <Button type="button" onClick={handleNext} disabled={!canAdvance}>
            {step === 'profiles' ? 'Add to Library' : 'Next'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
