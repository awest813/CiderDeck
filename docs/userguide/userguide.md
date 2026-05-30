# CiderDeck User Guide

## System Requirements

| Requirement  | Minimum                           |
| ------------ | --------------------------------- |
| macOS        | 11.0 (Big Sur) or later           |
| Architecture | Apple Silicon (M1/M2/M3) or Intel |
| Disk space   | ~150 MB for the app               |

## Installation

1. Download the latest `.dmg` or `.zip` from the [Releases page](https://github.com/awest813/CiderDeck/releases).
2. Open the `.dmg` and drag **CiderDeck** to your Applications folder (or extract the `.zip`).
3. Launch CiderDeck from Applications or Spotlight.

> **Note for unsigned/internal builds:** macOS Gatekeeper may block the app. Right-click the app → **Open** → click **Open** in the dialog, or run `xattr -cr /Applications/CiderDeck.app` in Terminal.

## First Launch

On first launch:

- The main window opens centered at 1200 × 800 pixels.
- Your profile library is empty — create your first profile to get started.
- No internet connection is required for basic usage.

## Getting Started

CiderDeck helps you organize, validate, and launch game compatibility tools. This guide covers the core features available in the app.

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut        | Mac          | Windows/Linux | Action                |
| --------------- | ------------ | ------------- | --------------------- |
| Command Palette | Cmd+K        | Ctrl+K        | Open command palette  |
| Preferences     | Cmd+,        | Ctrl+,        | Open preferences      |
| Quick Pane      | Configurable | Configurable  | Open quick entry pane |
| Left Sidebar    | Cmd+1        | Ctrl+1        | Toggle left sidebar   |
| Right Sidebar   | Cmd+2        | Ctrl+2        | Toggle right sidebar  |

## Core Features

### Command Palette

Press **Cmd+K** to open the command palette - a quick way to find and run any action. Start typing to search through available commands.

### Quick Pane

The Quick Pane is a small floating window that can be summoned with a global keyboard shortcut, even when the app is in the background. Use it for quick data entry or actions without switching to the main window.

Configure the Quick Pane shortcut in **Preferences → Keyboard Shortcuts**.

### Preferences

Press **Cmd+,** to open preferences:

- **Theme**: Light, Dark, or System
- **Language**: Select your preferred language
- **Keyboard Shortcuts**: Customize the Quick Pane shortcut

### Native Menus

Access features from the menu bar:

- **App Menu**: About, Check for Updates, Preferences, Quit
- **View Menu**: Toggle sidebars

All menu items have keyboard shortcuts and are also available in the command palette.

## Layout

- **Title Bar**: Window controls and app title
- **Left Sidebar**: Collapsible panel (Cmd+1)
- **Main Content**: Primary app content
- **Right Sidebar**: Collapsible panel (Cmd+2)

## Updates

The app checks for updates automatically (when enabled):

- Manual check: App menu → Check for Updates
- Updates download from GitHub releases
- You'll be notified when updates are available

> **Internal testing builds:** Auto-update is disabled. Download new versions manually from the developer.

## Troubleshooting

### App won't open (Gatekeeper)

If macOS says the app "can't be opened because it is from an unidentified developer":

1. Right-click the app → **Open** → click **Open** in the warning dialog.
2. Or run in Terminal: `xattr -cr /Applications/CiderDeck.app`

### Profile launch fails

- Check that the helper executable path is correct and the file exists.
- Ensure the game data path points to valid data files.
- Check the log viewer for stdout/stderr output from the failed launch.

### Blank screen on launch

- Try quitting and relaunching the app.
- Delete window state: remove `~/Library/Application Support/com.awest813.ciderdeck/` and relaunch.

### Where are my logs?

- **App logs**: `~/Library/Logs/com.awest813.ciderdeck/`
- **Profile launch logs**: `~/Library/Application Support/com.awest813.ciderdeck/logs/`

### How to reset the app

To completely reset CiderDeck and start fresh:

```bash
rm -rf ~/Library/Application\ Support/com.awest813.ciderdeck/
rm -rf ~/Library/Logs/com.awest813.ciderdeck/
```

---

_This user guide is expanded as new features are added to the app._
