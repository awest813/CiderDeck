// SPDX-License-Identifier: GPL-3.0-or-later

import type {
  CiderDeckProfile,
  HelperCategory,
  HelperId,
  ProfileStatus,
} from '@/types/Profile'

export const STATUS_OPTIONS: ProfileStatus[] = [
  'unconfigured',
  'missing-engine',
  'missing-data',
  'missing-rom',
  'missing-bios',
  'ready',
  'boots',
  'playable',
  'experimental',
  'broken',
]

export interface FormProps<TProfile extends CiderDeckProfile> {
  initial?: TProfile
  onSubmit: (profile: TProfile) => void
  helper: HelperId
  category: HelperCategory
}

export const splitMultiline = (value: string): string[] =>
  value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

export const joinMultiline = (values?: string[]): string =>
  values && values.length > 0 ? values.join('\n') : ''

export const splitArgs = (value: string): string[] =>
  value
    .split(/\s+/)
    .map(piece => piece.trim())
    .filter(piece => piece.length > 0)

export const joinArgs = (values?: string[]): string =>
  values && values.length > 0 ? values.join(' ') : ''

export const parseEnvText = (
  text: string
): Record<string, string> | undefined => {
  const env: Record<string, string> = {}
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    const idx = trimmed.indexOf('=')
    if (idx <= 0) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key) env[key] = value
  }
  return Object.keys(env).length > 0 ? env : undefined
}

export const stringifyEnv = (env?: Record<string, string>): string => {
  if (!env) return ''
  return Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
}
