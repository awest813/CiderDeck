// SPDX-License-Identifier: GPL-3.0-or-later

import { isTauri } from '@tauri-apps/api/core'
import { commands } from '@/lib/tauri-bindings'
import { createId } from '@/lib/profile-storage'
import { buildLaunchRequest, LaunchRequestError } from '@/lib/profile-launchers'
import { logger } from '@/lib/logger'
import type {
  CiderDeckProfile,
  LaunchRequest,
  ProfileLogEntry,
} from '@/types/Profile'

const formatCommand = (request: LaunchRequest): string => {
  const env = request.envVars
    ? Object.entries(request.envVars)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ') + ' '
    : ''
  const quotedArgs = request.args.map(arg =>
    /\s/.test(arg) ? JSON.stringify(arg) : arg
  )
  return `${env}${request.executablePath} ${quotedArgs.join(' ')}`.trim()
}

const buildLogEntry = (
  profile: CiderDeckProfile,
  command: string,
  outcome: { stdout: string; stderr: string; exit_code: number | null }
): ProfileLogEntry => ({
  id: createId(),
  profileId: profile.id,
  createdAt: new Date().toISOString(),
  command,
  stdout: outcome.stdout,
  stderr: outcome.stderr,
  exitCode: outcome.exit_code,
})

/**
 * Build the launch request for a profile and either invoke the native
 * Tauri command or return a simulated preview log when running in a
 * non-Tauri environment (e.g. browser dev mode).
 *
 * @param extraArgs - Extra arguments appended to the profile's args after the
 *   launch request is built (e.g. per-game overrides from the game library).
 */
export const launchProfile = async (
  profile: CiderDeckProfile,
  extraArgs: string[] = []
): Promise<ProfileLogEntry> => {
  let request: LaunchRequest
  try {
    request = await buildLaunchRequest(profile)
  } catch (error) {
    return buildLogEntry(profile, '(launch request not built)', {
      stdout: '',
      stderr:
        error instanceof LaunchRequestError
          ? error.message
          : `Unexpected error: ${String(error)}`,
      exit_code: null,
    })
  }

  // Append per-game extra args (if any) after the profile's own args.
  if (extraArgs.length > 0) {
    request = { ...request, args: [...request.args, ...extraArgs] }
  }

  const command = formatCommand(request)

  if (!isTauri()) {
    return buildLogEntry(profile, command, {
      stdout: [
        'CiderDeck launch preview (no native runtime).',
        `Program: ${request.executablePath}`,
        `Args: ${JSON.stringify(request.args)}`,
        request.workingDir ? `Working dir: ${request.workingDir}` : '',
        request.envVars ? `Env: ${JSON.stringify(request.envVars)}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      stderr: '',
      exit_code: null,
    })
  }

  try {
    const result = await commands.launchProfileExecutable(
      request.executablePath,
      request.args,
      request.envVars ?? null,
      request.workingDir ?? null
    )
    if (result.status === 'error') {
      throw result.error
    }
    const outcome = result.data
    const entry = buildLogEntry(profile, command, outcome)
    await persistLogEntry(profile.id, entry)
    return entry
  } catch (error) {
    return buildLogEntry(profile, command, {
      stdout: '',
      stderr: `Launch failed: ${String(error)}`,
      exit_code: null,
    })
  }
}

const persistLogEntry = async (
  profileId: string,
  entry: ProfileLogEntry
): Promise<void> => {
  if (!isTauri()) return
  try {
    await commands.saveLog(profileId, entry)
  } catch (error) {
    // Persisting logs is best-effort. Log the failure and continue.
    logger.warn('Failed to persist log entry', { profileId, error })
  }
}

export const fetchPersistedLogs = async (
  profileId: string
): Promise<ProfileLogEntry[]> => {
  if (!isTauri()) return []
  try {
    const result = await commands.readLogs(profileId)
    return result.status === 'ok' ? result.data : []
  } catch {
    return []
  }
}
