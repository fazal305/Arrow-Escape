import { buildOccupancy, checkExit, parseLevel } from './engine.js'

export const MAX_LIVES = 3

export function loadLevel(levels, levelIndex, runId = 0) {
  const { width, height, arrows } = parseLevel(levels[levelIndex])
  return {
    levelIndex,
    // Changes whenever a level is (re)started, so the board can reset its animations.
    runId,
    width,
    height,
    arrows,
    lives: MAX_LIVES,
    status: 'playing',
    // Incremented on every move so the UI can react to repeated identical events.
    moveCount: 0,
    lastMove: null,
  }
}

export function createReducer(levels) {
  return function reducer(state, action) {
    switch (action.type) {
      case 'select': {
        if (state.status !== 'playing') return state
        const arrow = state.arrows.find((a) => a.id === action.id)
        if (!arrow) return state
        const occupancy = buildOccupancy(state.arrows, state.width, state.height)
        const result = checkExit(arrow, occupancy, state.width, state.height)
        const moveCount = state.moveCount + 1

        if (result.blocked) {
          const lives = state.lives - 1
          return {
            ...state,
            lives,
            status: lives <= 0 ? 'gameover' : 'playing',
            moveCount,
            lastMove: { type: 'blocked', id: arrow.id, hit: result.hit, blocker: result.blocker, moveCount },
          }
        }

        const arrows = state.arrows.filter((a) => a.id !== arrow.id)
        const isLast = state.levelIndex === levels.length - 1
        let status = 'playing'
        if (!arrows.length) status = isLast ? 'complete' : 'cleared'
        return {
          ...state,
          arrows,
          status,
          moveCount,
          lastMove: { type: 'exit', arrow, rayLength: result.ray.length, moveCount },
        }
      }
      case 'retry':
        return loadLevel(levels, state.levelIndex, state.runId + 1)
      case 'next':
        return loadLevel(levels, Math.min(state.levelIndex + 1, levels.length - 1), state.runId + 1)
      case 'restartCampaign':
        return loadLevel(levels, 0, state.runId + 1)
      default:
        return state
    }
  }
}
