// SPDX-License-Identifier: GPL-3.0-or-later

import { cn } from '@/lib/utils'
import {
  COMPATIBILITY_RENDERER_OPTIONS,
  normalizeRenderer,
  type CompatibilityRenderer,
} from '@/lib/compatibility-toggles'

interface RendererToggleGroupProps {
  value?: CompatibilityRenderer
  onChange: (renderer: CompatibilityRenderer | undefined) => void
  disabled?: boolean
  className?: string
}

export function RendererToggleGroup({
  value,
  onChange,
  disabled = false,
  className,
}: RendererToggleGroupProps) {
  const selected = normalizeRenderer(value)

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {COMPATIBILITY_RENDERER_OPTIONS.map(({ value: optionValue, label }) => (
        <button
          key={label}
          type="button"
          disabled={disabled}
          onClick={() => onChange(optionValue)}
          className={cn(
            'rounded border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
            selected === optionValue
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
