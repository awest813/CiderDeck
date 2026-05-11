import type { ReactNode } from 'react'
import { LibraryPage } from '@/pages/LibraryPage'
import { cn } from '@/lib/utils'

interface MainWindowContentProps {
  children?: ReactNode
  className?: string
}

export function MainWindowContent({
  children,
  className,
}: MainWindowContentProps) {
  return (
    <div className={cn('flex h-full flex-col bg-background', className)}>
      {children ?? <LibraryPage />}
    </div>
  )
}
