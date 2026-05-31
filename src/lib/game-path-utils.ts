// SPDX-License-Identifier: GPL-3.0-or-later

export function nameFromPath(filePath: string): string {
  const base = filePath.replace(/\\/g, '/').split('/').pop() ?? filePath
  return base
    .replace(/\.(exe|msi|app)$/i, '')
    .replace(/[._-]+/g, ' ')
    .trim()
}

export function isInstallerPath(filePath: string): boolean {
  return /\.(exe|msi)$/i.test(filePath.trim())
}

export function defaultBottlePath(name: string, runtime: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const folder = slug || 'game'
  if (runtime === 'whisky') {
    return `~/Library/Containers/com.isaacmarovitz.Whisky/Bottles/${folder}`
  }
  if (runtime === 'crossover') {
    return `~/Library/Application Support/CrossOver/Bottles/${folder}`
  }
  return `~/.wine-${folder}`
}
