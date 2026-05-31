// SPDX-License-Identifier: GPL-3.0-or-later

import { useMemo, useState } from 'react'
import { isTauri } from '@tauri-apps/api/core'
import { open as openFilePicker } from '@tauri-apps/plugin-dialog'
import { FolderOpen, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
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
import { Spinner } from '@/components/ui/spinner'
import {
  useBottleDetection,
  runtimeBottleLabel,
} from '@/hooks/use-bottle-detection'
import { commands } from '@/lib/tauri-bindings'
import { createInstallerLaunchProfile } from '@/lib/game-install-profile'
import {
  defaultBottlePath,
  isInstallerPath,
  nameFromPath,
} from '@/lib/game-path-utils'
import { cn } from '@/lib/utils'
import type { DetectedGame, GameImport } from '@/lib/bindings'
import type { CiderDeckProfile, CompatibilityBackend } from '@/types/Profile'

type WizardStep =
  | 'installer'
  | 'bottle'
  | 'install'
  | 'discover'
  | 'details'
  | 'profiles'

const STEPS: WizardStep[] = [
  'installer',
  'bottle',
  'install',
  'discover',
  'details',
  'profiles',
]

const STEP_LABELS: Record<WizardStep, string> = {
  installer: 'Installer',
  bottle: 'Bottle',
  install: 'Install',
  discover: 'Discover',
  details: 'Details',
  profiles: 'Profiles',
}

const RUNTIMES: CompatibilityBackend[] = ['wine', 'whisky', 'crossover', 'gptk']

interface GameInstallWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (gameImport: GameImport) => void
  onCreateProfile: (profile: CiderDeckProfile) => void
  profiles: CiderDeckProfile[]
}

export function GameInstallWizard({
  open,
  onOpenChange,
  onImport,
  onCreateProfile,
  profiles,
}: GameInstallWizardProps) {
  const { bottles, refresh: refreshBottles } = useBottleDetection()

  const [step, setStep] = useState<WizardStep>('installer')
  const [installerPath, setInstallerPath] = useState('')
  const [runtime, setRuntime] = useState<CompatibilityBackend>('wine')
  const [bottleMode, setBottleMode] = useState<'existing' | 'new'>('existing')
  const [bottlePath, setBottlePath] = useState('')
  const [bottleName, setBottleName] = useState('')
  const [installing, setInstalling] = useState(false)
  const [installLog, setInstallLog] = useState('')
  const [installFailed, setInstallFailed] = useState(false)
  const [detectedGames, setDetectedGames] = useState<DetectedGame[]>([])
  const [detecting, setDetecting] = useState(false)
  const [selectedExe, setSelectedExe] = useState('')
  const [manualExePath, setManualExePath] = useState('')
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(
    new Set()
  )
  const [createLaunchProfile, setCreateLaunchProfile] = useState(true)

  const stepIndex = STEPS.indexOf(step)
  const resolvedExe = selectedExe || manualExePath.trim()

  const runtimeBottles = useMemo(
    () => bottles.filter(b => b.runtime === runtime),
    [bottles, runtime]
  )

  const reset = () => {
    setStep('installer')
    setInstallerPath('')
    setRuntime('wine')
    setBottleMode('existing')
    setBottlePath('')
    setBottleName('')
    setInstalling(false)
    setInstallLog('')
    setInstallFailed(false)
    setDetectedGames([])
    setDetecting(false)
    setSelectedExe('')
    setManualExePath('')
    setTitle('')
    setTags('')
    setNotes('')
    setSelectedProfiles(new Set())
    setCreateLaunchProfile(true)
  }

  const handleClose = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleBrowseInstaller = async () => {
    if (!isTauri()) return
    const result = await openFilePicker({
      filters: [{ name: 'Windows Installers', extensions: ['exe', 'msi'] }],
      multiple: false,
    })
    if (typeof result === 'string' && result) {
      setInstallerPath(result)
      if (!title) setTitle(nameFromPath(result))
      if (!bottleName) setBottleName(nameFromPath(result))
      if (!bottlePath)
        setBottlePath(defaultBottlePath(nameFromPath(result), runtime))
    }
  }

  const ensureBottle = async (): Promise<string | null> => {
    if (bottleMode === 'existing') {
      return bottlePath.trim() || null
    }

    const path = bottlePath.trim()
    const name = bottleName.trim() || nameFromPath(path)
    if (!path) {
      toast.error('Enter a bottle path')
      return null
    }

    if (!isTauri()) {
      toast.error('Creating bottles requires the desktop app')
      return null
    }

    const existing = bottles.find(b => b.path === path)
    if (existing) return existing.path

    const result = await commands.createBottle(path, name, runtime)
    if (result.status === 'error') {
      toast.error('Failed to create bottle', { description: result.error })
      return null
    }

    refreshBottles()
    return result.data.path
  }

  const runInstall = async () => {
    const prefix = await ensureBottle()
    if (!prefix) return

    setBottlePath(prefix)
    setInstalling(true)
    setInstallLog('')
    setInstallFailed(false)

    if (!isTauri()) {
      setInstalling(false)
      setStep('discover')
      return
    }

    const result = await commands.runGameInstaller(
      installerPath.trim(),
      prefix,
      runtime
    )

    setInstalling(false)

    if (result.status === 'error') {
      toast.error('Installer failed to start', { description: result.error })
      setInstallFailed(true)
      return
    }

    const log = [result.data.stdout, result.data.stderr]
      .filter(Boolean)
      .join('\n')
      .trim()
    setInstallLog(log)

    const failed = result.data.exitCode !== null && result.data.exitCode !== 0
    setInstallFailed(failed)

    if (failed) {
      toast.warning('Installer exited with a non-zero code', {
        description: 'You can still pick the installed game executable.',
      })
    } else {
      toast.success('Installer finished')
    }

    await scanForGames(prefix)
    setStep('discover')
  }

  const scanForGames = async (prefix: string) => {
    if (!isTauri()) return

    setDetecting(true)
    const result = await commands.detectGamesForBottle(prefix)
    setDetecting(false)

    if (result.status === 'error') {
      toast.error('Failed to scan bottle', { description: result.error })
      return
    }

    setDetectedGames(result.data)
    if (result.data.length === 1) {
      const game = result.data[0]
      if (game) {
        setSelectedExe(game.exe_path)
        if (!title) setTitle(game.name)
      }
    }
  }

  const handleNext = async () => {
    if (step === 'installer') {
      if (!installerPath.trim() || !isInstallerPath(installerPath)) {
        toast.error('Select a valid .exe or .msi installer')
        return
      }
      setStep('bottle')
      return
    }

    if (step === 'bottle') {
      if (bottleMode === 'existing' && !bottlePath.trim()) {
        toast.error('Select a bottle')
        return
      }
      if (bottleMode === 'new' && !bottlePath.trim()) {
        toast.error('Enter a bottle path')
        return
      }
      setStep(isTauri() ? 'install' : 'discover')
      if (!isTauri()) {
        void scanForGames(bottlePath.trim())
      }
      return
    }

    if (step === 'install') {
      if (installLog) {
        setStep('discover')
        return
      }
      await runInstall()
      return
    }

    if (step === 'discover') {
      if (!resolvedExe) {
        toast.error('Select or enter the game executable')
        return
      }
      if (!title) setTitle(nameFromPath(resolvedExe))
      setStep('details')
      return
    }

    if (step === 'details') {
      if (!title.trim()) {
        toast.error('Enter a game title')
        return
      }
      setStep('profiles')
      return
    }

    handleFinish()
  }

  const handleBack = () => {
    if (step === 'bottle') setStep('installer')
    else if (step === 'install') setStep('bottle')
    else if (step === 'discover') setStep(isTauri() ? 'install' : 'bottle')
    else if (step === 'details') setStep('discover')
    else if (step === 'profiles') setStep('details')
  }

  const handleFinish = () => {
    if (!title.trim() || !resolvedExe) return

    const profileIds = [...selectedProfiles]

    if (createLaunchProfile) {
      const profile = createInstallerLaunchProfile({
        title: title.trim(),
        runtime,
        executablePath: resolvedExe,
        bottlePath: bottlePath.trim(),
      })
      onCreateProfile(profile)
      profileIds.push(profile.id)
    }

    onImport({
      title: title.trim(),
      importSource: 'Installer',
      installPath: resolvedExe,
      artworkPath: null,
      tags: tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
      notes: notes.trim() || null,
      profileIds,
      extraArgs: [],
    })

    toast.success(`Added "${title.trim()}" to your library`)
    reset()
    onOpenChange(false)
  }

  const toggleProfile = (id: string) => {
    setSelectedProfiles(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const canAdvance =
    step === 'installer'
      ? installerPath.trim().length > 0 && isInstallerPath(installerPath)
      : step === 'bottle'
        ? bottlePath.trim().length > 0
        : step === 'install'
          ? !installing
          : step === 'discover'
            ? resolvedExe.length > 0
            : step === 'details'
              ? title.trim().length > 0
              : true

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span>Install Game</span>
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
          {step === 'installer' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Choose the Windows installer (.exe or .msi) for the game.
              </p>
              <div className="flex gap-2">
                <Input
                  value={installerPath}
                  onChange={e => setInstallerPath(e.target.value)}
                  placeholder="/path/to/setup.exe"
                  className="flex-1 font-mono text-sm"
                />
                {isTauri() ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => void handleBrowseInstaller()}
                    title="Browse…"
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          )}

          {step === 'bottle' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Runtime</Label>
                <select
                  value={runtime}
                  onChange={e => {
                    const next = e.target.value as CompatibilityBackend
                    setRuntime(next)
                    setBottlePath('')
                  }}
                  className="border-input h-9 w-full rounded-lg border bg-transparent px-3 text-sm"
                >
                  {RUNTIMES.map(r => (
                    <option key={r} value={r}>
                      {runtimeBottleLabel(r)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <button
                  type="button"
                  className={cn(
                    'rounded-xl border p-3 text-start',
                    bottleMode === 'existing'
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/40'
                  )}
                  onClick={() => setBottleMode('existing')}
                >
                  <p className="font-medium">Use existing bottle</p>
                  <p className="text-sm text-muted-foreground">
                    Install into a prefix you already have
                  </p>
                </button>
                <button
                  type="button"
                  className={cn(
                    'rounded-xl border p-3 text-start',
                    bottleMode === 'new'
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/40'
                  )}
                  onClick={() => {
                    setBottleMode('new')
                    if (!bottlePath && bottleName) {
                      setBottlePath(defaultBottlePath(bottleName, runtime))
                    }
                  }}
                >
                  <p className="font-medium">Create new bottle</p>
                  <p className="text-sm text-muted-foreground">
                    Initialize a fresh prefix before installing
                  </p>
                </button>
              </div>

              {bottleMode === 'existing' ? (
                <div className="space-y-2">
                  <Label>Bottle</Label>
                  {runtimeBottles.length > 0 ? (
                    <select
                      value={bottlePath}
                      onChange={e => setBottlePath(e.target.value)}
                      className="border-input h-9 w-full rounded-lg border bg-transparent px-3 text-sm"
                    >
                      <option value="">Select a bottle…</option>
                      {runtimeBottles.map(b => (
                        <option key={b.path} value={b.path}>
                          {b.name} — {b.path}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No {runtimeBottleLabel(runtime)} bottles found. Create a
                      new bottle instead.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="bottle-name">Bottle name</Label>
                    <Input
                      id="bottle-name"
                      value={bottleName}
                      onChange={e => {
                        setBottleName(e.target.value)
                        setBottlePath(
                          defaultBottlePath(e.target.value || 'game', runtime)
                        )
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bottle-path">Bottle path</Label>
                    <Input
                      id="bottle-path"
                      value={bottlePath}
                      onChange={e => setBottlePath(e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'install' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Run the installer inside{' '}
                <span className="font-mono text-xs">{bottlePath}</span>. This
                may take a few minutes.
              </p>
              {installing ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running installer…
                </div>
              ) : installLog ? (
                <pre className="max-h-40 overflow-auto rounded-lg border bg-muted/40 p-3 text-xs whitespace-pre-wrap">
                  {installLog}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Press Next to start the installer.
                </p>
              )}
              {installFailed ? (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  The installer reported an error. You can continue and pick the
                  game executable manually.
                </p>
              ) : null}
            </div>
          )}

          {step === 'discover' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Choose the installed game executable. We scanned the bottle for
                likely launchers.
              </p>
              {detecting ? (
                <div className="flex justify-center py-6">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : detectedGames.length > 0 ? (
                <div className="max-h-48 space-y-1.5 overflow-y-auto">
                  {detectedGames.map(game => (
                    <button
                      key={game.exe_path}
                      type="button"
                      className={cn(
                        'w-full rounded-lg border p-2.5 text-start text-sm transition-colors',
                        selectedExe === game.exe_path
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/40'
                      )}
                      onClick={() => {
                        setSelectedExe(game.exe_path)
                        if (!title) setTitle(game.name)
                      }}
                    >
                      <p className="font-medium">{game.name}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {game.exe_path}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No executables detected yet. Enter the path to the game .exe
                  below.
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="manual-exe">Game executable path</Label>
                <Input
                  id="manual-exe"
                  value={manualExePath}
                  onChange={e => {
                    setManualExePath(e.target.value)
                    setSelectedExe('')
                  }}
                  placeholder="Z:\\Program Files\\Game\\game.exe"
                  className="font-mono text-sm"
                />
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="install-title">Game title</Label>
                <Input
                  id="install-title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="install-tags">Tags (comma-separated)</Label>
                <Input
                  id="install-tags"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="install-notes">Notes (optional)</Label>
                <Input
                  id="install-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 'profiles' && (
            <div className="space-y-3">
              <label className="flex items-start gap-3 rounded-lg border p-3">
                <Checkbox
                  checked={createLaunchProfile}
                  onCheckedChange={checked =>
                    setCreateLaunchProfile(checked === true)
                  }
                />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Create a launch profile</p>
                  <p className="text-xs text-muted-foreground">
                    Uses {runtimeBottleLabel(runtime)} with the selected
                    executable and bottle
                  </p>
                </div>
              </label>

              <p className="text-sm text-muted-foreground">
                Optionally link additional existing profiles.
              </p>
              {profiles.length > 0 ? (
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {profiles.map(p => (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border p-2"
                    >
                      <Checkbox
                        checked={selectedProfiles.has(p.id)}
                        onCheckedChange={() => toggleProfile(p.id)}
                      />
                      <span className="truncate text-sm">{p.title}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={
              step === 'installer' ? () => handleClose(false) : handleBack
            }
            disabled={installing}
          >
            {step === 'installer' ? 'Cancel' : 'Back'}
          </Button>
          <Button
            type="button"
            onClick={() => void handleNext()}
            disabled={!canAdvance || installing}
          >
            {step === 'profiles'
              ? 'Add to Library'
              : step === 'install' && !installLog
                ? 'Run Installer'
                : 'Next'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
