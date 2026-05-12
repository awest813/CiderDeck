// SPDX-License-Identifier: GPL-3.0-or-later

import { useEffect, useState } from 'react'
import { isTauri } from '@tauri-apps/api/core'
import { commands } from '@/lib/tauri-bindings'
import type { Bottle } from '@/lib/tauri-bindings'

export interface BottleDetectionState {
  bottles: Bottle[]
  loading: boolean
  error: string | null
}

async function fetchBottles(): Promise<BottleDetectionState> {
  if (!isTauri()) {
    return { bottles: [], loading: false, error: null }
  }

  try {
    const bottles = await commands.detectBottles()
    return { bottles, loading: false, error: null }
  } catch (err) {
    return {
      bottles: [],
      loading: false,
      error: `Failed to detect bottles: ${String(err)}`,
    }
  }
}

export function useBottleDetection(): BottleDetectionState & {
  refresh: () => void
} {
  const [state, setState] = useState<BottleDetectionState>({
    bottles: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    fetchBottles().then(next => {
      if (!cancelled) setState(next)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return {
    ...state,
    refresh: () => {
      setState(prev => ({ ...prev, loading: true }))
      fetchBottles().then(next => setState(next))
    },
  }
}

export function runtimeBottleLabel(runtime: string): string {
  const labels: Record<string, string> = {
    wine: 'Wine',
    whisky: 'Whisky',
    crossover: 'CrossOver',
    gptk: 'GPTK',
  }
  return labels[runtime] ?? runtime
}
