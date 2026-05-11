// SPDX-License-Identifier: GPL-3.0-or-later

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { validateProfile } from '@/lib/validation'
import type { CiderDeckProfile } from '@/types/Profile'
import type { ValidationSeverity } from '@/types/Validation'

interface ValidationPanelProps {
  profile?: CiderDeckProfile
}

const severityClass: Record<ValidationSeverity, string> = {
  error: 'border-destructive/50 bg-destructive/10 text-destructive',
  warning:
    'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  info: 'border-muted bg-muted/40 text-muted-foreground',
}

export function ValidationPanel({ profile }: ValidationPanelProps) {
  const result = useMemo(
    () => (profile ? validateProfile(profile) : null),
    [profile]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Validation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {!profile ? (
          <p className="text-muted-foreground">
            Select a profile to see validation results.
          </p>
        ) : !result || result.issues.length === 0 ? (
          <p className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-emerald-700 dark:text-emerald-300">
            No issues detected. Profile looks ready to launch.
          </p>
        ) : (
          <ul className="space-y-2">
            {result.issues.map((issue, index) => (
              <li
                key={index}
                className={`rounded border px-3 py-2 ${severityClass[issue.severity]}`}
              >
                <span className="font-semibold capitalize">
                  {issue.severity}:
                </span>{' '}
                {issue.message}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
