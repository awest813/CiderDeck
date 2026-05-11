import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { backendDetails } from '@/lib/launchers'
import type { GameEntry } from '@/types/GameEntry'

interface LogViewerProps {
  game?: GameEntry
}

export function LogViewer({ game }: LogViewerProps) {
  return (
    <Card className="h-full min-h-0">
      <CardHeader>
        <CardTitle>Launch Logs</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        {!game ? (
          <p className="text-sm text-muted-foreground">
            Select a game to view launch logs.
          </p>
        ) : game.logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No logs captured for {game.title} yet.
          </p>
        ) : (
          <div className="space-y-4 overflow-auto pr-1">
            {game.logs.map(log => (
              <article
                key={log.id}
                className="rounded-lg border bg-muted/30 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">
                    {backendDetails[log.backend].label}
                  </span>
                  <time className="text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </time>
                </div>
                <pre className="overflow-auto rounded bg-background p-3 text-xs whitespace-pre-wrap">
                  {log.stdout}
                  {log.stderr ? `\n\nstderr:\n${log.stderr}` : ''}
                </pre>
              </article>
            ))}
          </div>
        )}

        <Button type="button" variant="outline" disabled={!game}>
          Analyze Logs with AI (Coming Soon)
        </Button>
      </CardContent>
    </Card>
  )
}
