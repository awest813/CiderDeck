// SPDX-License-Identifier: GPL-3.0-or-later

import { useEffect, useState } from 'react'
import { isTauri } from '@tauri-apps/api/core'
import { commands } from '@/lib/tauri-bindings'
import type { RuntimeInfo } from '@/lib/tauri-bindings'

export interface RuntimeDetectionState {
  runtimes: RuntimeInfo[]
  loading: boolean
  error: string | null
}

async function detectRuntimes(): Promise<RuntimeDetectionState> {
  if (!isTauri()) {
    return { runtimes: [], loading: false, error: null }
  }

  try {
    const runtimes = await commands.detectRuntimes()
    return { runtimes, loading: false, error: null }
  } catch (err) {
    return {
      runtimes: [],
      loading: false,
      error: `Failed to detect runtimes: ${String(err)}`,
    }
  }
}

export function useRuntimeDetection(): RuntimeDetectionState & {
  refetch: () => void
} {
  const [state, setState] = useState<RuntimeDetectionState>({
    runtimes: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    detectRuntimes().then(next => {
      if (!cancelled) setState(next)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return {
    ...state,
    refetch: () => {
      setState(prev => ({ ...prev, loading: true }))
      detectRuntimes().then(next => setState(next))
    },
  }
}
