# CiderDeck

CiderDeck is a macOS desktop launcher for managing Windows games through Wine, CrossOver, Whisky, and Apple Game Porting Toolkit.

It is not a replacement for Wine, Proton, or CrossOver. Instead, it is a friendly compatibility dashboard that helps users organize games, launch them with the right backend, capture logs, and troubleshoot issues.

## Goals

- Manage a local Windows game library on macOS
- Launch games through Wine, CrossOver, Whisky, or GPTK
- Store per-game compatibility profiles
- Capture launch logs
- Help users diagnose crashes
- Eventually support AI-powered log analysis and compatibility recipes

## Tech Stack

- Tauri
- React
- TypeScript
- Rust
- Vite
- Tailwind CSS

## MVP Features

- Add, edit, and delete games
- Choose a compatibility backend
- Store executable path, bottle path, launch args, and notes
- Launch a game from the library
- Capture stdout/stderr logs
- View logs per game
- Placeholder AI log analyzer button

## Non-Goals for v0.1

- No cloud sync
- No accounts
- No community database
- No automatic Steam import
- No Wine patching
- No anti-cheat bypassing

## Supported Backends

Planned support:

- Wine
- CrossOver
- Whisky
- Apple Game Porting Toolkit

## Roadmap

See `docs/ROADMAP.md`.

## License

MIT
