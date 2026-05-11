// SPDX-License-Identifier: GPL-3.0-or-later

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AiTroubleshootButton } from '@/components/AiTroubleshootButton'
import type { CiderDeckProfile, ProfileLogEntry } from '@/types/Profile'

interface ProfileLogViewerProps {
  profile?: CiderDeckProfile
  logs: ProfileLogEntry[]
}

export function ProfileLogViewer({ profile, logs }: ProfileLogViewerProps) {
  return (
    <Card className="h-full min-h-0">
      <CardHeader>
        <CardTitle>Launch Logs</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        {!profile ? (
          <p className="text-sm text-muted-foreground">
            Select a profile to view its launch history.
          </p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No logs captured for {profile.title} yet. Launch the profile to
            generate one.
          </p>
        ) : (
          <div className="space-y-3 overflow-auto pr-1">
            {logs.map(entry => (
              <article
                key={entry.id}
                className="rounded-lg border bg-muted/30 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                  <span className="font-mono text-muted-foreground">
                    {entry.command}
                  </span>
                  <time className="shrink-0 text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString()}
                  </time>
                </div>
                {entry.exitCode !== null ? (
                  <p className="mb-2 text-xs">
                    Exit code:{' '}
                    <span
                      className={
                        entry.exitCode === 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-destructive'
                      }
                    >
                      {entry.exitCode}
                    </span>
                  </p>
                ) : null}
                <pre className="overflow-auto rounded bg-background p-3 text-xs whitespace-pre-wrap">
                  {entry.stdout || '(no stdout)'}
                  {entry.stderr ? `\n\nstderr:\n${entry.stderr}` : ''}
                </pre>
              </article>
            ))}
          </div>
        )}

        <AiTroubleshootButton disabled={!profile} />
      </CardContent>
    </Card>
  )
}
