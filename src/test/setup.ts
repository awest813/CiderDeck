import '@testing-library/jest-dom'
import { vi } from 'vitest'

const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock Tauri APIs for tests
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(vi.fn()),
}))

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn(() => ({
    isMaximized: vi.fn().mockResolvedValue(false),
    isFullscreen: vi.fn().mockResolvedValue(false),
    maximize: vi.fn().mockResolvedValue(undefined),
    unmaximize: vi.fn().mockResolvedValue(undefined),
    onResized: vi.fn().mockResolvedValue(vi.fn()),
    onFocusChanged: vi.fn().mockResolvedValue(vi.fn()),
    show: vi.fn().mockResolvedValue(undefined),
    hide: vi.fn().mockResolvedValue(undefined),
    setFocus: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}))

vi.mock('@tauri-apps/plugin-os', () => ({
  platform: vi.fn(() => 'macos'),
}))

vi.mock('@tauri-apps/plugin-updater', () => ({
  check: vi.fn().mockResolvedValue(null),
}))

// Mock typed Tauri bindings (tauri-specta generated)
vi.mock('@/lib/tauri-bindings', () => ({
  commands: {
    greet: vi.fn().mockResolvedValue('Hello, test!'),
    loadPreferences: vi
      .fn()
      .mockResolvedValue({ status: 'ok', data: { theme: 'system' } }),
    savePreferences: vi.fn().mockResolvedValue({ status: 'ok', data: null }),
    sendNativeNotification: vi
      .fn()
      .mockResolvedValue({ status: 'ok', data: null }),
    saveEmergencyData: vi.fn().mockResolvedValue({ status: 'ok', data: null }),
    loadEmergencyData: vi.fn().mockResolvedValue({ status: 'ok', data: null }),
    cleanupOldRecoveryFiles: vi
      .fn()
      .mockResolvedValue({ status: 'ok', data: 0 }),
    launchProfileExecutable: vi.fn().mockResolvedValue({
      status: 'ok',
      data: { stdout: '', stderr: '', exit_code: 0 },
    }),
    runBuildStep: vi.fn().mockResolvedValue({
      status: 'ok',
      data: { stdout: '', stderr: '', exit_code: 0 },
    }),
    saveLog: vi.fn().mockResolvedValue({ status: 'ok', data: null }),
    readLogs: vi.fn().mockResolvedValue({ status: 'ok', data: [] }),
    listGames: vi.fn().mockResolvedValue({ status: 'ok', data: [] }),
    saveGame: vi.fn().mockResolvedValue({ status: 'ok', data: null }),
    deleteGame: vi.fn().mockResolvedValue({ status: 'ok', data: null }),
    importGame: vi.fn().mockResolvedValue({ status: 'ok', data: null }),
    listProfiles: vi.fn().mockResolvedValue({ status: 'ok', data: [] }),
    saveProfiles: vi.fn().mockResolvedValue({ status: 'ok', data: null }),
    migrateFromLocalStorage: vi.fn().mockResolvedValue({
      status: 'ok',
      data: 0,
    }),
    detectGamesFromBottles: vi.fn().mockResolvedValue([]),
    detectGamesForBottle: vi.fn().mockResolvedValue({ status: 'ok', data: [] }),
    runGameInstaller: vi.fn().mockResolvedValue({
      status: 'ok',
      data: { exitCode: 0, stdout: '', stderr: '' },
    }),
  },
  unwrapResult: vi.fn((result: { status: string; data?: unknown }) => {
    if (result.status === 'ok') return result.data
    throw result
  }),
}))
