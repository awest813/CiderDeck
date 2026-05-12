// SPDX-License-Identifier: GPL-3.0-or-later

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { validateProfile } from '@/lib/validation'
import { useRuntimeDetection } from '@/hooks/use-runtime-detection'
import { COMPATIBILITY_BACKENDS } from '@/types/Profile'
import type { CiderDeckProfile } from '@/types/Profile'
import type { ValidationSeverity } from '@/types/Validation'
import type { RuntimeInfo } from '@/lib/tauri-bindings'

interface ValidationPanelProps {
  profile?: CiderDeckProfile
}

const severityClass: Record<ValidationSeverity, string> = {
  error: 'border-destructive/50 bg-destructive/10 text-destructive',
  warning:
    'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  info: 'border-muted bg-muted/40 text-muted-foreground',
}

const compatibilityHelpers = new Set<string>(COMPATIBILITY_BACKENDS)

export function ValidationPanel({ profile }: ValidationPanelProps) {
  const { runtimes } = useRuntimeDetection()

  const result = useMemo(
    () => (profile ? validateProfile(profile) : null),
    [profile]
  )

  const backendRuntime = useMemo<RuntimeInfo | undefined>(() => {
    if (!profile || !compatibilityHelpers.has(profile.helper)) {
      return undefined
    }
    return runtimes.find(r => r.id === profile.helper)
  }, [profile, runtimes])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Validation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm" aria-live="polite">
        {!profile ? (
          <p className="text-muted-foreground">
            Select a profile to see validation results.
          </p>
        ) : (
          <>
            {result && result.issues.length > 0 ? (
              <ul className="space-y-2">
                {result.issues.map(issue => (
                  <li
                    key={issue.severity + issue.message}
                    className={`rounded border px-3 py-2 ${severityClass[issue.severity]}`}
                  >
                    <span className="font-semibold capitalize">
                      {issue.severity}:
                    </span>{' '}
                    {issue.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-emerald-700 dark:text-emerald-300">
                No issues detected. Profile looks ready to launch.
              </p>
            )}

            {backendRuntime ? (
              <div className="flex items-center justify-between rounded border p-3">
                <div>
                  <p className="text-xs font-medium">{backendRuntime.name}</p>
                  {backendRuntime.version ? (
                    <p className="text-xs text-muted-foreground">
                      {backendRuntime.version}
                    </p>
                  ) : null}
                </div>
                <Badge
                  variant={backendRuntime.available ? 'default' : 'secondary'}
                >
                  {backendRuntime.available ? 'Detected' : 'Not found'}
                </Badge>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}
