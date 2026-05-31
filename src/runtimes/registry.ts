// SPDX-License-Identifier: GPL-3.0-or-later

import type { RuntimeProvider } from '@/runtimes/types'
import { WineRuntimeProvider } from '@/runtimes/providers/wine'
import { WineDxmtRuntimeProvider } from '@/runtimes/providers/wine-dxmt'
import { CrossOverRuntimeProvider } from '@/runtimes/providers/crossover'
import { WhiskyRuntimeProvider } from '@/runtimes/providers/whisky'
import { GptkRuntimeProvider } from '@/runtimes/providers/gptk'
import { CustomRuntimeProvider } from '@/runtimes/providers/custom'
import { NativeWindowsRuntimeProvider } from '@/runtimes/providers/native'

export const RUNTIME_PROVIDERS: readonly RuntimeProvider[] = [
  new WineRuntimeProvider(),
  new WineDxmtRuntimeProvider(),
  new CrossOverRuntimeProvider(),
  new WhiskyRuntimeProvider(),
  new GptkRuntimeProvider(),
  new CustomRuntimeProvider(),
  new NativeWindowsRuntimeProvider(),
]

export const getRuntimeProvider = (id: string): RuntimeProvider | undefined =>
  RUNTIME_PROVIDERS.find(p => p.id === id)
