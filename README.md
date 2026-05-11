# CiderDeck

CiderDeck is a **GPL-3.0-or-later** open launcher and workbench for game
compatibility layers, source ports, open engines, emulators, and
recompilation projects.

It is **not** a re-implementation of any game and **does not** ship
proprietary game data. CiderDeck helps you organize, validate, launch, and
troubleshoot the open-source tools that already exist — you bring your own
legally obtained ROMs, ISOs, BIOS files, WADs, PAKs, MPQs, and game folders.

> **Targeting macOS first.** Linux and Windows support may follow later.

## What CiderDeck does

- Stores per-helper **profiles** for compatibility layers, source ports,
  emulators, recompilation projects, and custom tools
- Builds **structured launch commands** (`program` + `args[]` + env) — never
  shell strings — and runs them through a Tauri Rust command
- Captures **stdout / stderr / exit code** from each launch and persists a
  log history per profile
- Runs a **lightweight validator** for each profile (missing engine path,
  missing data folder, missing BIOS, experimental engine, etc.)
- Reserves an **AI Troubleshoot** button for a future Log Doctor — no AI
  API is wired up yet

## Supported helper categories

| Category             | Helpers                                                                                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compatibility layer  | Wine, CrossOver, Whisky, Apple Game Porting Toolkit (GPTK)                                                                                                                                                                   |
| Source port / engine | Doom (GZDoom, dsda-doom, Woof, Chocolate/Crispy), Quake 1/2/3 (Ironwail, vkQuake, Quakespasm, Yamagi, ioquake3, …), GemRB, OpenDiablo / DevilutionX, Aleph One (Marathon), OpenRCT2, OpenRA, OpenMW, ScummVM (planned forms) |
| Strategy / sim       | OpenXcom, Freeciv / OpenCiv, OpenTTD, CorsixTH, Julius/Augustus (planned forms)                                                                                                                                              |
| Emulator             | DOSBox Staging, DOSBox-X, PPSSPP, Dolphin, PCSX2, DuckStation, RetroArch, MAME, ares, custom                                                                                                                                 |
| Recompilation        | N64Recomp / Recomp64 (player and developer modes), custom recomp/decomp                                                                                                                                                      |

The full long-term plan lives in [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Tech stack

- [Tauri v2](https://tauri.app/)
- React 19 + TypeScript
- Vite + Tailwind CSS v4
- `tauri-specta` for type-safe Tauri commands
- Local browser storage for v0.1; SQLite is on the roadmap

## Run it locally

```bash
npm install
npm run dev          # frontend only (browser preview)
npm run tauri:dev    # full Tauri app
```

Other useful scripts:

```bash
npm run typecheck
npm run lint
npm run check:all    # typecheck + lint + format + tests + cargo checks
npm run rust:test
```

## Add a profile

1. Open the **Profiles** tab in the sidebar
2. Click **+ New Profile**
3. Pick a category (Compatibility, Source Port, Strategy/Sim, Emulator,
   Recompilation, or Custom)
4. Pick a helper (Wine, GZDoom, RetroArch, N64Recomp, …)
5. Fill in the helper-specific form and save
6. The profile appears in the library — click **Launch** to run it

Once persisted, validation runs every time you select the profile. You can
edit, delete, or re-launch from the card actions or the right-hand panel.

## Safety & security

- CiderDeck **never builds shell commands by string concatenation**. Every
  launch is `std::process::Command::new(program).args(args)` with explicit
  env vars — no `sh -c`.
- The Rust commands `launch_profile_executable`, `run_build_step`,
  `save_log`, and `read_logs` validate input and persist logs atomically.
- Profile IDs used as log filenames are filtered against a strict
  `[a-zA-Z0-9_-]+` allowlist.

## Legal & non-affiliation

CiderDeck is an independent open-source project. It is **not affiliated
with**, sponsored by, or endorsed by Valve, Apple, CodeWeavers, WineHQ,
id Software, Blizzard, Bungie, MicroProse, Firaxis, Nintendo, Sony,
Microsoft, or any other rights holder.

CiderDeck does not download, distribute, or bundle:

- ROMs, ISOs, BIOS dumps
- WAD, PAK, MPQ, BIN/CUE, or other game data files
- Commercial game executables
- Anti-cheat bypasses or DRM circumvention tooling

You are responsible for using only legally obtained game data with the
helpers CiderDeck launches. See [`THIRD_PARTY.md`](THIRD_PARTY.md) for
details on the external tools CiderDeck integrates with.

## License

CiderDeck is licensed under the **GNU General Public License v3.0 or later**
(`SPDX-License-Identifier: GPL-3.0-or-later`). The full license text is in
[`LICENSE`](LICENSE).
