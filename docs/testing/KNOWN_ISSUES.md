# Known Issues — v0.1.0 Internal Testing

This document lists known issues and limitations for the current internal testing build.

## Build & Distribution

| Issue                            | Status   | Notes                                               |
| -------------------------------- | -------- | --------------------------------------------------- |
| App is unsigned                  | Expected | Gatekeeper bypass required (see User Testing Guide) |
| No auto-update                   | Expected | Updater disabled until signing keys are configured  |
| No notarization                  | Expected | Will be addressed before public release             |
| Updater public key not generated | Blocked  | Run `tauri signer generate` when ready for release  |

## Functionality

| Issue                                         | Status        | Notes                                         |
| --------------------------------------------- | ------------- | --------------------------------------------- |
| AI Troubleshoot button is non-functional      | Expected      | Placeholder for future Log Doctor feature     |
| Browser storage only (no SQLite)              | Expected      | Data stored in WebView local storage for v0.1 |
| No cloud sync                                 | Expected      | All data is local to the machine              |
| Quick Pane may not work on all macOS versions | Investigating | Requires NSPanel support (macOS 11+)          |

## UI / UX

| Issue                                    | Status | Notes                                      |
| ---------------------------------------- | ------ | ------------------------------------------ |
| Some forms lack i18n translations        | Known  | English is fully supported; others partial |
| Window state may not persist after crash | Known  | Window-state plugin saves on clean exit    |

## Platform

| Issue                         | Status   | Notes                                    |
| ----------------------------- | -------- | ---------------------------------------- |
| Linux/Windows not supported   | Expected | macOS-first; other platforms may follow  |
| Intel Mac not actively tested | Known    | Should work but not validated this cycle |

---

_Updated: 2026-05-30. File new issues at https://github.com/awest813/CiderDeck/issues with label `user-testing`._
