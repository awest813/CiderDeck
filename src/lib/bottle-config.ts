// SPDX-License-Identifier: GPL-3.0-or-later

import type {
  BottleConfig,
  BottleDxvkHud,
  BottleEnhancedSync,
} from '@/lib/tauri-bindings'

export interface BottleChoiceOption<T extends string> {
  value: T
  label: string
  description: string
}

export interface BottleBooleanToggle {
  id: keyof BottleConfig
  label: string
  description: string
}

export const BOTTLE_ENHANCED_SYNC_OPTIONS: readonly BottleChoiceOption<
  BottleEnhancedSync | 'none'
>[] = [
  {
    value: 'none',
    label: 'Off',
    description: 'Do not force Wine synchronization overrides.',
  },
  {
    value: 'Esync',
    label: 'ESync',
    description: 'Set WINEESYNC=1 for eventfd-based synchronization.',
  },
  {
    value: 'Msync',
    label: 'MSync',
    description: 'Set WINEMSYNC=1 and WINEESYNC=1 for futex-based sync.',
  },
]

export const BOTTLE_DXVK_HUD_OPTIONS: readonly BottleChoiceOption<
  BottleDxvkHud | 'off'
>[] = [
  {
    value: 'off',
    label: 'Off',
    description: 'Do not show a DXVK HUD overlay.',
  },
  {
    value: 'Fps',
    label: 'FPS',
    description: 'Show only the current frame rate.',
  },
  {
    value: 'Partial',
    label: 'Partial',
    description: 'Show device info, FPS, and frametimes.',
  },
  {
    value: 'Full',
    label: 'Full',
    description: 'Show a fuller DXVK HUD for troubleshooting.',
  },
]

export const BOTTLE_BOOLEAN_TOGGLES: readonly BottleBooleanToggle[] = [
  {
    id: 'dxvk_async',
    label: 'DXVK Async',
    description: 'Sets DXVK_ASYNC=1.',
  },
  {
    id: 'metal_hud',
    label: 'Metal HUD',
    description: 'Sets MTL_HUD_ENABLED=1.',
  },
  {
    id: 'metal_trace',
    label: 'Metal Trace',
    description: 'Sets METAL_CAPTURE_ENABLED=1.',
  },
  {
    id: 'dxr',
    label: 'Ray tracing',
    description: 'Sets D3DM_SUPPORT_DXR=1.',
  },
  {
    id: 'avx',
    label: 'Advertise AVX',
    description: 'Sets ROSETTA_ADVERTISE_AVX=1 on Apple Silicon.',
  },
]

export const BOTTLE_WINDOWS_VERSION_OPTIONS = [
  'win11',
  'win10',
  'win8.1',
  'win8',
  'win7',
  'winxp',
] as const

export const buildBottleConfigEnv = (
  config?: BottleConfig | null
): Record<string, string> => {
  if (!config) return {}

  const env: Record<string, string> = {}

  if (config.enhanced_sync === 'Esync') {
    env['WINEESYNC'] = '1'
  } else if (config.enhanced_sync === 'Msync') {
    env['WINEESYNC'] = '1'
    env['WINEMSYNC'] = '1'
  }

  if (config.dxvk_async) {
    env['DXVK_ASYNC'] = '1'
  }

  if (config.dxvk_hud === 'Fps') {
    env['DXVK_HUD'] = 'fps'
  } else if (config.dxvk_hud === 'Partial') {
    env['DXVK_HUD'] = 'devinfo,fps,frametimes'
  } else if (config.dxvk_hud === 'Full') {
    env['DXVK_HUD'] = 'memory,devinfo,fps,frametimes'
  }

  if (config.metal_hud) {
    env['MTL_HUD_ENABLED'] = '1'
  }
  if (config.metal_trace) {
    env['METAL_CAPTURE_ENABLED'] = '1'
  }
  if (config.dxr) {
    env['D3DM_SUPPORT_DXR'] = '1'
  }
  if (config.avx) {
    env['ROSETTA_ADVERTISE_AVX'] = '1'
  }

  return env
}

export const normalizeBottleConfig = (
  config: BottleConfig
): BottleConfig | null => {
  const normalized: BottleConfig = {
    enhanced_sync: config.enhanced_sync ?? null,
    dxvk_async: config.dxvk_async ?? null,
    dxvk_hud: config.dxvk_hud ?? null,
    metal_hud: config.metal_hud ?? null,
    metal_trace: config.metal_trace ?? null,
    dxr: config.dxr ?? null,
    avx: config.avx ?? null,
  }

  return Object.values(normalized).some(value => value !== null) ? normalized : null
}

export const wineExecutableForRuntime = (runtime: string): string => {
  switch (runtime) {
    case 'whisky':
      return '/Applications/Whisky.app/Contents/MacOS/wine64'
    case 'crossover':
      return '/Applications/CrossOver.app/Contents/SharedSupport/CrossOver/bin/wine'
    default:
      return 'wine'
  }
}
