// SPDX-License-Identifier: GPL-3.0-or-later

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { helperLabel } from '@/lib/helper-catalog'
import { cn } from '@/lib/utils'
import type { CiderDeckProfile, ProfileStatus } from '@/types/Profile'

interface ProfileCardProps {
  profile: CiderDeckProfile
  selected: boolean
  onLaunch: (profile: CiderDeckProfile) => void
  onSelect: (profileId: string) => void
  onDelete: (profileId: string) => void
}

const statusBadgeClass: Record<ProfileStatus, string> = {
  ready:
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
  playable:
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
  boots:
    'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30',
  experimental:
    'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30',
  broken: 'bg-destructive/10 text-destructive border border-destructive/30',
  unconfigured:
    'bg-secondary text-secondary-foreground border border-transparent',
  'missing-engine':
    'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30',
  'missing-data':
    'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30',
  'missing-rom':
    'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30',
  'missing-bios':
    'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30',
}

const summaryFor = (profile: CiderDeckProfile): string => {
  switch (profile.helper) {
    case 'wine':
    case 'crossover':
    case 'whisky':
    case 'gptk':
      return profile.executablePath ?? 'No executable set'
    case 'doom':
      return profile.iwadPath ?? 'No IWAD configured'
    case 'quake':
    case 'quake2':
    case 'quake3':
      return profile.gameDataPath ?? 'No game data folder set'
    case 'gemrb':
      return profile.gameDataPath ?? 'No Infinity Engine data set'
    case 'opendiablo':
      return profile.gameDataPath ?? 'No Diablo data set'
    case 'alephone':
      return profile.scenarioPath ?? 'No Marathon scenario set'
    case 'openrct2':
      return profile.gameDataPath ?? 'No RCT2 data set'
    case 'openmw':
      return profile.gameDataPath ?? 'No Morrowind Data Files set'
    case 'openxcom':
      return profile.gameDataPath ?? 'No X-COM data set'
    case 'openciv':
      return profile.executablePath ?? 'No engine set'
    case 'emulator':
      return profile.romOrDiscPath ?? 'No ROM/ISO set'
    case 'n64recomp':
      return profile.mode === 'developer'
        ? (profile.projectPath ?? 'No project path set')
        : (profile.executablePath ?? 'No executable set')
    default:
      return ''
  }
}

export function ProfileCard({
  profile,
  selected,
  onLaunch,
  onSelect,
  onDelete,
}: ProfileCardProps) {
  return (
    <Card
      className={cn(
        'gap-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
        selected
          ? 'border-primary bg-primary/5'
          : 'hover:border-primary/40 hover:bg-accent/30'
      )}
    >
      <CardHeader className="px-4">
        <CardTitle className="flex items-start justify-between gap-3">
          <button
            type="button"
            className="cursor-pointer text-start text-lg font-semibold tracking-tight"
            onClick={() => onSelect(profile.id)}
          >
            {profile.title}
          </button>
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium capitalize shadow-sm',
              statusBadgeClass[profile.status]
            )}
          >
            {profile.status.replace(/-/g, ' ')}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 text-sm">
        <div>
          <p className="font-medium">{helperLabel(profile.helper)}</p>
          <p className="truncate text-muted-foreground">
            {summaryFor(profile)}
          </p>
        </div>
        {profile.notes ? (
          <p className="line-clamp-2 text-muted-foreground">{profile.notes}</p>
        ) : null}
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={() => onLaunch(profile)}>
            Launch
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onSelect(profile.id)}
          >
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete profile?</AlertDialogTitle>
                <AlertDialogDescription>
                  &ldquo;{profile.title}&rdquo; will be permanently removed.
                  This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onDelete(profile.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
