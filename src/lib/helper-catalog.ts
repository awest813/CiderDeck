// SPDX-License-Identifier: GPL-3.0-or-later

import type { HelperCategory, HelperId } from '@/types/Profile'

export interface CategoryDescriptor {
  id: HelperCategory
  label: string
  blurb: string
}

export interface HelperDescriptor {
  id: HelperId
  label: string
  category: HelperCategory
  blurb: string
}

export const CATEGORIES: CategoryDescriptor[] = [
  {
    id: 'compatibility-layer',
    label: 'Compatibility Layer',
    blurb: 'Wine, CrossOver, Whisky, or Apple GPTK profiles.',
  },
  {
    id: 'source-port',
    label: 'Source Port / Open Engine',
    blurb: 'Doom, Quake, GemRB, OpenDiablo, Aleph One, OpenRCT2, OpenMW…',
  },
  {
    id: 'strategy-sim',
    label: 'Strategy / Sim',
    blurb: 'OpenXcom, Freeciv/OpenCiv, OpenTTD, CorsixTH, Julius/Augustus…',
  },
  {
    id: 'emulator',
    label: 'Emulator',
    blurb:
      'DOSBox, PPSSPP, Dolphin, PCSX2, DuckStation, RetroArch, MAME, ares…',
  },
  {
    id: 'recompilation',
    label: 'Recompilation',
    blurb: 'N64Recomp/Recomp64 player and developer profiles.',
  },
  {
    id: 'custom',
    label: 'Custom',
    blurb: 'Anything else — define it yourself.',
  },
]

export const HELPERS: HelperDescriptor[] = [
  {
    id: 'wine',
    label: 'Wine',
    category: 'compatibility-layer',
    blurb: 'Run Windows binaries via a Wine prefix.',
  },
  {
    id: 'crossover',
    label: 'CrossOver',
    category: 'compatibility-layer',
    blurb: "CodeWeavers' commercial Wine distribution.",
  },
  {
    id: 'whisky',
    label: 'Whisky',
    category: 'compatibility-layer',
    blurb: 'macOS-native Wine wrapper.',
  },
  {
    id: 'gptk',
    label: 'Apple GPTK',
    category: 'compatibility-layer',
    blurb: 'Apple Game Porting Toolkit prefix.',
  },
  {
    id: 'doom',
    label: 'Doom',
    category: 'source-port',
    blurb: 'GZDoom, dsda-doom, Woof, Chocolate/Crispy Doom, custom.',
  },
  {
    id: 'quake',
    label: 'Quake / Quake II / Quake III',
    category: 'source-port',
    blurb: 'Ironwail, vkQuake, Quakespasm, Yamagi, ioquake3…',
  },
  {
    id: 'gemrb',
    label: 'GemRB (Infinity Engine)',
    category: 'source-port',
    blurb: 'Baldur’s Gate, Icewind Dale, Planescape: Torment.',
  },
  {
    id: 'opendiablo',
    label: 'OpenDiablo / DevilutionX',
    category: 'source-port',
    blurb: 'Diablo, Hellfire, Diablo II, Lord of Destruction.',
  },
  {
    id: 'alephone',
    label: 'Aleph One (Marathon)',
    category: 'source-port',
    blurb: 'Marathon, Marathon 2, Marathon Infinity, third-party scenarios.',
  },
  {
    id: 'openrct2',
    label: 'OpenRCT2',
    category: 'source-port',
    blurb: 'Open-source RollerCoaster Tycoon 2 reimplementation.',
  },
  {
    id: 'openxcom',
    label: 'OpenXcom',
    category: 'strategy-sim',
    blurb: 'X-COM: UFO Defense / TFTD reimplementation.',
  },
  {
    id: 'openciv',
    label: 'Freeciv / OpenCiv',
    category: 'strategy-sim',
    blurb: 'Freeciv, Freeciv-web, openciv1, openciv3.',
  },
  {
    id: 'emulator',
    label: 'Emulator',
    category: 'emulator',
    blurb:
      'DOSBox, PPSSPP, Dolphin, PCSX2, DuckStation, RetroArch, MAME, ares.',
  },
  {
    id: 'n64recomp',
    label: 'N64Recomp / Recomp64',
    category: 'recompilation',
    blurb: 'Player or developer mode for N64 recompilation projects.',
  },
  {
    id: 'custom',
    label: 'Custom',
    category: 'custom',
    blurb: 'A custom helper not yet in the catalog.',
  },
]

export const helpersForCategory = (
  category: HelperCategory
): HelperDescriptor[] => HELPERS.filter(helper => helper.category === category)

export const helperLabel = (id: HelperId): string =>
  HELPERS.find(helper => helper.id === id)?.label ?? id
