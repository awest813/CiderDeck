# Task 2 — Runtime Detection for Compatibility Backends

## Background

The project currently assumes Wine, Whisky, CrossOver, and GPTK are installed
without checking. There's no way to detect which backends are available, their
versions, or their installation paths. This makes troubleshooting harder and
prevents the UI from guiding users toward working configurations.

v0.2 of the roadmap calls for "standardizing all compatibility helpers behind
one runtime abstraction." Runtime detection is the foundation: once we know
what's installed and where, we can validate profiles against reality, guide
users during setup, and prepare for v0.3's bottle/prefix manager.

## Goal

Add runtime detection for all four compatibility backends (Wine, Whisky,
CrossOver, GPTK) via a Rust trait, expose results through a Tauri command,
and surface them in the frontend UI.

## Acceptance Criteria

- [ ] Rust `RuntimeProvider` trait + implementations for Wine, Whisky,
      CrossOver, and GPTK
- [ ] `detect_runtimes` Tauri command returning detected runtime info
- [ ] TypeScript bindings generated for the new types and command
- [ ] Frontend `useRuntimeDetection` hook for consuming detection results
- [ ] ValidationPanel shows backend availability warnings
- [ ] Compatibility profile form hints about detected runtimes
- [ ] Tests for Rust detection logic
- [ ] `npm run check:all` passes with zero errors

## Out of Scope

- Bottle/prefix management (v0.3)
- Game-centric library (v0.4)
- Non-macOS runtime detection (macOS-first; other platforms use defaults)
- CrossOver bottle listing or Whisky bottle enumeration
