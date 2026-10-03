// Remembers the level the player reached on this device. Storage can be
// unavailable (private mode, blocked site data), so every access is guarded.
const KEY = 'arrow-escape:level'

export function readSavedLevel(levelCount) {
  try {
    const value = Number.parseInt(window.localStorage.getItem(KEY), 10)
    return Number.isInteger(value) && value >= 0 && value < levelCount ? value : 0
  } catch {
    return 0
  }
}

export function saveLevel(levelIndex) {
  try {
    window.localStorage.setItem(KEY, String(levelIndex))
  } catch {
    // Progress just won't survive a reload.
  }
}
