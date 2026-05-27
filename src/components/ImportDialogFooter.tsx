// SPDX-License-Identifier: GPL-3.0-or-later

import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'

interface ImportDialogFooterProps {
  onImport: () => void
  onRefresh: () => void
  onCancel: () => void
  selectedCount: number
  isLoading: boolean
  isRefreshing: boolean
}

export function ImportDialogFooter({
  onImport,
  onRefresh,
  onCancel,
  selectedCount,
  isLoading,
  isRefreshing,
}: ImportDialogFooterProps) {
  return (
    <DialogFooter className="flex-row-reverse">
      <Button
        type="button"
        onClick={onImport}
        disabled={selectedCount === 0 || isLoading || isRefreshing}
      >
        Import{selectedCount > 0 ? ` (${selectedCount})` : ''}
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={onRefresh}
        disabled={isLoading || isRefreshing}
      >
        Refresh
      </Button>
      <Button type="button" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
    </DialogFooter>
  )
}
