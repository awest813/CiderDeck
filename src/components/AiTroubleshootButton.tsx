// SPDX-License-Identifier: GPL-3.0-or-later

import { Button } from '@/components/ui/button'

interface AiTroubleshootButtonProps {
  disabled?: boolean
}

export function AiTroubleshootButton({ disabled }: AiTroubleshootButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={disabled}
      title="AI Log Doctor will be wired up in a later release."
    >
      AI Troubleshoot (Coming Soon)
    </Button>
  )
}
