# Compatibility Notes

CiderDeck tracks compatibility per game so users can document what works, what fails, and which backend was tested.

## Statuses

- **Untested**: Added to the library but not launched yet
- **Perfect**: Runs without known issues
- **Playable**: Runs with minor issues
- **Boots**: Starts but has major issues
- **Broken**: Does not run successfully

## Backend Notes

- **Wine**: General compatibility layer for running Windows applications
- **CrossOver**: Commercial Wine distribution with bottles and curated fixes
- **Whisky**: macOS-focused Wine/GPTK wrapper
- **GPTK**: Apple Game Porting Toolkit workflow for DirectX translation testing

## Safety Boundaries

CiderDeck should not bypass anti-cheat, DRM, platform restrictions, or vendor protections. The launcher should focus on user-owned local configuration and troubleshooting.
