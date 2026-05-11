import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold">Settings</h2>
        <p className="text-muted-foreground">
          Configure CiderDeck launcher paths and future storage options.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planned Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Wine, CrossOver, Whisky, and GPTK executable detection.</p>
          <p>Local JSON file location and future SQLite migration controls.</p>
          <p>Safe log retention and AI troubleshooting preferences.</p>
        </CardContent>
      </Card>
    </div>
  )
}
