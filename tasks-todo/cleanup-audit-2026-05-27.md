# Cleanup Audit — 2026-05-27

Generated from `knip`, `jscpd`, and `npm run check:all`. Items are ordered by confidence / impact.

---

## 🔴 Safe to Remove

### 1. Remove unused `zod-validation-error` devDependency

- **File:** `package.json`
- **Action:** Run `npm uninstall zod-validation-error`
- **Why:** Zero usage across all `src/` files; confirmed by knip.

### 2. Remove default export from `CommandPalette.tsx`

- **File:** `src/components/command-palette/CommandPalette.tsx`
- **Action:** Delete the `export default CommandPalette` line; the named export is the only one consumed.
- **Why:** Duplicate/dead export — no consumer of the default export exists.

### 3. Remove `CommandGroup` interface from `types.ts`

- **File:** `src/lib/commands/types.ts:17`
- **Action:** Delete the `CommandGroup` interface definition.
- **Why:** Never imported anywhere; shadcn's `CommandGroup` is used directly instead.

---

## 🟡 Needs Decision

### 4. Fix knip false positives — `quick-pane-main.tsx` + `QuickPaneApp.tsx`

- **File:** `knip.json`
- **Action:** Add `src/quick-pane-main.tsx` to the `entry` patterns in `knip.json` so knip tracks the secondary Vite entry point.
- **Why:** Knip can't see entries declared in `vite.config.ts` / `quick-pane.html`; this creates noisy false positives.

### 5. Remove `LeftSideBar.tsx` + `RightSideBar.tsx` (if no sidebar layout is planned)

- **Files:** `src/components/LeftSideBar.tsx`, `src/components/RightSideBar.tsx`
- **Action:** Delete both files and remove their barrel exports — _only if_ there are no sidebar layout plans.
- **Why:** Simple `<div>` wrappers exported but never imported anywhere.

### 6. Remove `loadEmergencyData` (if recovery feature is not planned)

- **File:** `src/lib/recovery.ts`
- **Action:** Delete the `loadEmergencyData` function and its mock in the test setup.
- **Why:** Fully documented and mocked but never called in production code.

### 7. Remove or formally document `unwrapResult`

- **File:** `src/lib/tauri-bindings.ts`
- **Action:** Either delete the function, or add a `@public` JSDoc tag and export it from the public API barrel.
- **Why:** Has a JSDoc usage example but is never actually called — unclear if it's a public utility or dead code.

### 8. Remove `getRuntimeProviderOrDefault` (if fallback lookup is not needed)

- **File:** `src/runtimes/registry.ts`
- **Action:** Delete `getRuntimeProviderOrDefault`; only `getRuntimeProvider` has callers.
- **Why:** The "or default" fallback variant has no callers.

### 9. Remove `useSaveProfiles` (if bulk-save hook is not planned)

- **File:** `src/services/profile-store.ts`
- **Action:** Delete `useSaveProfiles`; the app uses `useUpsertProfile` / `useDeleteProfile` instead.
- **Why:** Dead hook with no consumers.

### 10. Remove `FormProps` interface (if no shared form contract is needed)

- **File:** `src/components/profile-forms/shared.ts`
- **Action:** Delete the `FormProps` interface and its export.
- **Why:** Exported but never imported; profile forms use local types.

---

## ℹ️ `knip.json` Config Tidying

### 11. Clean up redundant `knip.json` entries

- **File:** `knip.json`
- **Action:**
  - Remove `src/test/**` from `ignore` (test files are auto-ignored)
  - Remove `babel-plugin-react-compiler` from `ignoreDependencies` (already not present)
  - Remove `src/main.tsx`, `vite.config.ts`, `vitest.config.ts` from `entry` (auto-discovered)

---

## 🔴 High-Priority Duplicate Code

### 12. Extract shared Wine-compatible provider helpers (Rust)

- **File:** `src-tauri/src/runtime_provider.rs`
- **Duplication:** ~241 lines — `WineProvider`, `CrossOverProvider`, `WhiskyProvider` all have identical `validate()`, `container_path()`, and near-identical `env_vars()` implementations.
- **Action:** Extract `wine_compatible_validate()`, `wine_compatible_container_path()`, and `wine_compatible_env_vars()` free functions (or a default-impl trait block) shared by all three structs.

### 13. Extract `<ImportDialogFooter />` component

- **Files:** `src/components/DetectedGamesDialog.tsx:128–149`, `src/components/LauncherImportDialog.tsx:326–347`
- **Duplication:** 21 lines — virtually identical `<DialogFooter>` with Import / Refresh / Cancel buttons; only callback names differ.
- **Action:** Create `src/components/ImportDialogFooter.tsx` with props `{ onImport, onRefresh, onCancel, selectedCount, isLoading, isRefreshing }` and replace both inlined footers.

---

## 🟡 Medium-Priority Duplicate Code

### 14. Extract `detect_wine_version()` helper (Rust)

- **File:** `src-tauri/src/commands/runtime.rs`
- **Duplication:** ~15 lines duplicated between Whisky and CrossOver version detection.
- **Action:** Extract `fn detect_wine_version(path: &str) -> Option<String>` and call it from both sites.

### 15. Extract `saveProfilesMutationFn` helper

- **File:** `src/services/profile-store.ts`
- **Duplication:** ~19 lines — `useUpsertProfile` and `useDeleteProfile` share identical `!isTauri() → localStorage → commands.saveProfiles → throw` logic.
- **Action:** Extract `async function saveProfilesMutationFn(profiles: CiderDeckProfile[])` and call it from both hooks.

### 16. Merge duplicate game-launch handlers

- **File:** `src/pages/GameLibraryPage.tsx`
- **Duplication:** `handleLaunch` and `handleLaunchWithProfile` share the same `setLaunching → launchProfile → toast → catch → finally` pattern (~17 lines).
- **Action:** Merge into a single `handleLaunch(game, profileId?: string)` with an optional profile override.

### 17. Extract `<DeleteConfirmDialog />` component

- **Files:** `src/components/GameCard.tsx`, `src/components/ProfileCard.tsx`, `src/components/BottleManager.tsx`, `src/components/GameDetailPanel.tsx`
- **Duplication:** 13–19 lines per file — all four repeat the same shadcn AlertDialog confirm pattern.
- **Action:** Create `src/components/DeleteConfirmDialog.tsx` with props `{ trigger, label, entityName, onConfirm }` and replace all four inline instances.

---

## 🐛 Test Warning Fix

### 18. Fix duplicate React key warning in `App.test.tsx`

- **File:** `src/test/App.test.tsx` (mock data)
- **Action:** Find the mock data array where two items share `key='0'` and give them unique keys.
- **Why:** Non-failing but noisy — masks real key warnings in future test output.
