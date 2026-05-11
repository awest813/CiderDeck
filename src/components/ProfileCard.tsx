// SPDX-License-Identifier: GPL-3.0-or-later

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { helperLabel } from '@/lib/helper-catalog'
import { cn } from '@/lib/utils'
import type { CiderDeckProfile } from '@/types/Profile'

interface ProfileCardProps {
  profile: CiderDeckProfile
  selected: boolean
  onLaunch: (profile: CiderDeckProfile) => void
  onSelect: (profileId: string) => void
  onDelete: (profileId: string) => void
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
        'gap-4 py-4 transition-colors',
        selected && 'border-primary bg-primary/5'
      )}
    >
      <CardHeader className="px-4">
        <CardTitle className="flex items-start justify-between gap-3">
          <button
            type="button"
            className="cursor-pointer text-start text-lg font-semibold"
            onClick={() => onSelect(profile.id)}
          >
            {profile.title}
          </button>
          <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground capitalize">
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
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onDelete(profile.id)}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
