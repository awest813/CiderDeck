// SPDX-License-Identifier: GPL-3.0-or-later

import { Button } from '@/components/ui/button'
import { BottleManager } from '@/components/BottleManager'
import { useRuntimeDetection } from '@/hooks/use-runtime-detection'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { isTauri } from '@tauri-apps/api/core'

export function SettingsPage() {
  const { runtimes, loading, refetch } = useRuntimeDetection()

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="mt-1 text-muted-foreground">
          Configure CiderDeck launcher paths and future storage options.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detected Runtimes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {!isTauri() ? (
            <p className="text-muted-foreground">
              Runtime detection is only available when running in a native Tauri
              environment.
            </p>
          ) : loading ? (
            <p className="text-muted-foreground">Detecting runtimes...</p>
          ) : runtimes.length === 0 ? (
            <p className="text-muted-foreground">
              No runtimes detected. Install Wine, Whisky, CrossOver, or Apple
              Game Porting Toolkit to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {runtimes.map(runtime => (
                <div
                  key={runtime.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  <div>
                    <p className="font-medium">{runtime.name}</p>
                    {runtime.version ? (
                      <p className="text-xs text-muted-foreground">
                        {runtime.version}
                      </p>
                    ) : null}
                    {runtime.executable_path ? (
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {runtime.executable_path}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant={runtime.available ? 'default' : 'secondary'}>
                    {runtime.available ? 'Detected' : 'Not found'}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
            >
              Re-detect runtimes
            </Button>
          </div>
        </CardContent>
      </Card>

      <BottleManager />
    </div>
  )
}
