import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SidebarPage = 'library' | 'settings'

interface SidebarProps {
  activePage: SidebarPage
  gameCount: number
  onPageChange: (page: SidebarPage) => void
}

export function Sidebar({ activePage, gameCount, onPageChange }: SidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-muted/20 p-4">
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase">
          CiderDeck
        </p>
        <h1 className="mt-2 text-2xl font-bold">Compatibility Launcher</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Wine, CrossOver, Whisky, and GPTK profiles in one local library.
        </p>
      </div>

      <nav className="flex flex-col gap-2">
        <Button
          type="button"
          variant={activePage === 'library' ? 'secondary' : 'ghost'}
          className={cn(
            'justify-between',
            activePage === 'library' && 'font-semibold'
          )}
          onClick={() => onPageChange('library')}
        >
          Library
          <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
            {gameCount}
          </span>
        </Button>
        <Button
          type="button"
          variant={activePage === 'settings' ? 'secondary' : 'ghost'}
          className={cn(
            'justify-start',
            activePage === 'settings' && 'font-semibold'
          )}
          onClick={() => onPageChange('settings')}
        >
          Settings
        </Button>
      </nav>

      <div className="mt-auto rounded-lg border bg-background p-3 text-sm text-muted-foreground">
        Local JSON-style storage first. SQLite and native launch execution come
        later.
      </div>
    </aside>
  )
}
