// SPDX-License-Identifier: GPL-3.0-or-later

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  BOTTLE_BOOLEAN_TOGGLES,
  BOTTLE_DXVK_HUD_OPTIONS,
  BOTTLE_ENHANCED_SYNC_OPTIONS,
  BOTTLE_WINDOWS_VERSION_OPTIONS,
  normalizeBottleConfig,
  wineExecutableForRuntime,
} from '@/lib/bottle-config'
import { commands, type Bottle, type BottleConfig } from '@/lib/tauri-bindings'

interface BottleConfigPanelProps {
  bottle: Bottle
  onRefresh: () => void
}

type WineTool = 'winecfg' | 'regedit' | 'control'

const DEFAULT_WINDOWS_VERSION = 'win10'

export function BottleConfigPanel({
  bottle,
  onRefresh,
}: BottleConfigPanelProps) {
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState<BottleConfig>(bottle.config ?? {})
  const [windowsVersion, setWindowsVersion] = useState(
    bottle.windows_version ?? DEFAULT_WINDOWS_VERSION
  )
  const [saving, setSaving] = useState(false)
  const [runningTool, setRunningTool] = useState<WineTool | 'windows-version' | null>(
    null
  )
  const [error, setError] = useState('')

  useEffect(() => {
    setConfig(bottle.config ?? {})
    setWindowsVersion(bottle.windows_version ?? DEFAULT_WINDOWS_VERSION)
  }, [bottle.config, bottle.windows_version])

  const updateConfig = (partial: Partial<BottleConfig>) => {
    setConfig(current => ({ ...current, ...partial }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const result = await commands.saveBottleConfig(
        bottle.path,
        normalizeBottleConfig(config) ?? {}
      )
      if (result.status === 'error') {
        setError(result.error)
        return
      }
      onRefresh()
    } catch (nextError) {
      setError(String(nextError))
    } finally {
      setSaving(false)
    }
  }

  const runWineTool = async (tool: WineTool, args: string[]) => {
    setRunningTool(tool)
    setError('')
    try {
      const result = await commands.launchProfileExecutable(
        wineExecutableForRuntime(bottle.runtime),
        args,
        { WINEPREFIX: bottle.path },
        bottle.path
      )
      if (result.status === 'error') {
        setError(result.error)
        return
      }
      if (result.data.exit_code && result.data.exit_code !== 0) {
        setError(result.data.stderr || `${tool} exited with code ${result.data.exit_code}`)
      }
    } catch (nextError) {
      setError(String(nextError))
    } finally {
      setRunningTool(null)
    }
  }

  const handleSetWindowsVersion = async () => {
    setRunningTool('windows-version')
    setError('')
    try {
      const result = await commands.launchProfileExecutable(
        wineExecutableForRuntime(bottle.runtime),
        ['winecfg', '-v', windowsVersion],
        { WINEPREFIX: bottle.path },
        bottle.path
      )
      if (result.status === 'error') {
        setError(result.error)
        return
      }
      if (result.data.exit_code && result.data.exit_code !== 0) {
        setError(
          result.data.stderr ||
            `winecfg -v exited with code ${result.data.exit_code}`
        )
        return
      }
      onRefresh()
    } catch (nextError) {
      setError(String(nextError))
    } finally {
      setRunningTool(null)
    }
  }

  return (
    <div className="mt-2 border-t pt-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium">Configuration</p>
          <p className="text-xs text-muted-foreground">
            Per-bottle Wine env toggles and tool shortcuts.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={() => setOpen(current => !current)}
        >
          {open ? 'Hide' : 'Show'}
        </Button>
      </div>

      {open ? (
        <div className="mt-3 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Enhanced Sync</Label>
            <RadioGroup
              value={config.enhanced_sync ?? 'none'}
              onValueChange={value =>
                updateConfig({
                  enhanced_sync:
                    value === 'none' ? null : (value as BottleConfig['enhanced_sync']),
                })
              }
              className="grid gap-2"
            >
              {BOTTLE_ENHANCED_SYNC_OPTIONS.map(option => (
                <label
                  key={option.value}
                  className="flex items-start gap-3 rounded-lg border px-3 py-2"
                >
                  <RadioGroupItem value={option.value} id={`${bottle.id}-${option.value}`} />
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium">{option.label}</div>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">DXVK HUD</Label>
            <RadioGroup
              value={config.dxvk_hud ?? 'off'}
              onValueChange={value =>
                updateConfig({
                  dxvk_hud:
                    value === 'off' ? null : (value as BottleConfig['dxvk_hud']),
                })
              }
              className="grid gap-2"
            >
              {BOTTLE_DXVK_HUD_OPTIONS.map(option => (
                <label
                  key={option.value}
                  className="flex items-start gap-3 rounded-lg border px-3 py-2"
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`${bottle.id}-dxvk-${option.value}`}
                  />
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium">{option.label}</div>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            {BOTTLE_BOOLEAN_TOGGLES.map(toggle => {
              const id = `${bottle.id}-${toggle.id}`
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
                    checked={config[toggle.id] === true}
                    onCheckedChange={checked =>
                      updateConfig({ [toggle.id]: checked } as Partial<BottleConfig>)
                    }
                  />
                </div>
              )
            })}
          </div>

          <div className="space-y-2 rounded-lg border px-3 py-3">
            <Label className="text-xs font-medium">Windows version</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={windowsVersion} onValueChange={setWindowsVersion}>
                <SelectTrigger className="h-8 min-w-32 text-xs">
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {BOTTLE_WINDOWS_VERSION_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs"
                onClick={handleSetWindowsVersion}
                disabled={runningTool !== null}
              >
                {runningTool === 'windows-version' ? 'Applying…' : 'Apply'}
              </Button>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border px-3 py-3">
            <Label className="text-xs font-medium">Wine tools</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => runWineTool('winecfg', ['winecfg'])}
                disabled={runningTool !== null}
              >
                {runningTool === 'winecfg' ? 'Opening…' : 'Open winecfg'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => runWineTool('regedit', ['regedit'])}
                disabled={runningTool !== null}
              >
                {runningTool === 'regedit' ? 'Opening…' : 'Open regedit'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => runWineTool('control', ['control'])}
                disabled={runningTool !== null}
              >
                {runningTool === 'control' ? 'Opening…' : 'Open control panel'}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs"
              onClick={handleSave}
              disabled={saving || runningTool !== null}
            >
              {saving ? 'Saving…' : 'Save configuration'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setConfig(bottle.config ?? {})
                setWindowsVersion(
                  bottle.windows_version ?? DEFAULT_WINDOWS_VERSION
                )
                setError('')
              }}
              disabled={saving || runningTool !== null}
            >
              Reset
            </Button>
          </div>

          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
