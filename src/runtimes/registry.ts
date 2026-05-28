// SPDX-License-Identifier: GPL-3.0-or-later

import type { RuntimeProvider } from '@/runtimes/types'
import { WineRuntimeProvider } from '@/runtimes/providers/wine'
import { CrossOverRuntimeProvider } from '@/runtimes/providers/crossover'
import { WhiskyRuntimeProvider } from '@/runtimes/providers/whisky'
import { GptkRuntimeProvider } from '@/runtimes/providers/gptk'
import { CustomRuntimeProvider } from '@/runtimes/providers/custom'

export const RUNTIME_PROVIDERS: readonly RuntimeProvider[] = [
  new WineRuntimeProvider(),
  new CrossOverRuntimeProvider(),
  new WhiskyRuntimeProvider(),
  new GptkRuntimeProvider(),
  new CustomRuntimeProvider(),
]

export const getRuntimeProvider = (id: string): RuntimeProvider | undefined =>
  RUNTIME_PROVIDERS.find(p => p.id === id)
