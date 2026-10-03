import { describe, expect, it } from 'vitest'
import levels from '../levels/levels.json'
import { buildOccupancy, checkExit, isSolvable, parseLevel } from './engine.js'
import { createReducer, loadLevel, MAX_LIVES } from './gameReducer.js'

const level = (rows) => ({ name: 'test', rows })

describe('parseLevel', () => {
  it('traces bent arrows from head to tail', () => {
    const { arrows } = parseLevel(level(['>v.', '.>R', '...']))
    expect(arrows).toHaveLength(1)
    expect(arrows[0].dir).toBe('R')
    expect(arrows[0].cells).toEqual([
      [1, 2],
      [1, 1],
      [0, 1],
      [0, 0],
    ])
  })

  it('rejects body segments without a head', () => {
    expect(() => parseLevel(level(['>>', '..']))).toThrow(/not attached/)
  })

  it('rejects a head pointing into its own neck', () => {
    expect(() => parseLevel(level(['R<']))).toThrow(/own body/)
  })

  it('rejects ragged rows and unknown characters', () => {
    expect(() => parseLevel(level(['..', '.']))).toThrow(/wrong width/)
    expect(() => parseLevel(level(['x']))).toThrow(/unknown cell/)
  })
})

describe('checkExit', () => {
  const run = (rows, id = 0) => {
    const { arrows, width, height } = parseLevel(level(rows))
    const arrow = arrows.find((a) => a.id === id)
    return checkExit(arrow, buildOccupancy(arrows, width, height), width, height)
  }

  it('lets an arrow with a clear path leave', () => {
    const result = run(['>R..'])
    expect(result.blocked).toBe(false)
    expect(result.ray).toEqual([
      [0, 2],
      [0, 3],
    ])
  })

  it('blocks an arrow whose path crosses another arrow', () => {
    // Head (0,0) exits right but arrow pointing down sits at (0,2).
    const result = run(['R.D', '...'])
    expect(result.blocked).toBe(true)
    expect(result.hit).toEqual([0, 2])
  })

  it('does not block on its own tail when the tail moves away in time', () => {
    // Head (2,0) exits up through (0,0), which its tail has left by then.
    expect(run(['>v.', '.v.', 'U<.']).blocked).toBe(false)
  })

  it('blocks on its own body when the segment is still there', () => {
    // Head (3,0) exits up into (2,0); the segment behind it refills that cell.
    const result = run(['...', 'v<<', '>v.', 'U<.'])
    expect(result.blocked).toBe(true)
    expect(result.hit).toEqual([2, 0])
  })
})

describe('bundled levels', () => {
  it.each(levels.map((l) => [l.name, l]))('%s parses and is solvable', (_, l) => {
    const parsed = parseLevel(l)
    expect(parsed.arrows.length).toBeGreaterThan(0)
    expect(isSolvable(parsed)).toBe(true)
  })
})

describe('reducer', () => {
  const reducer = createReducer(levels)

  it('removes a free arrow and loses a life on a blocked one', () => {
    const isBlocked = (state, a) =>
      checkExit(a, buildOccupancy(state.arrows, state.width, state.height), state.width, state.height).blocked
    let state = loadLevel(levels, 5)
    const free = state.arrows.find((a) => !isBlocked(state, a))

    state = reducer(state, { type: 'select', id: free.id })
    expect(state.arrows.some((a) => a.id === free.id)).toBe(false)
    expect(state.lastMove.type).toBe('exit')

    const blocked = state.arrows.find((a) => isBlocked(state, a))
    state = reducer(state, { type: 'select', id: blocked.id })
    expect(state.lives).toBe(MAX_LIVES - 1)
    expect(state.lastMove.type).toBe('blocked')
    expect(state.arrows).toHaveLength(loadLevel(levels, 5).arrows.length - 1)
  })

  it('ends the game after three collisions and retries with full lives', () => {
    let state = loadLevel(levels, 9)
    const occupancy = buildOccupancy(state.arrows, state.width, state.height)
    const blocked = state.arrows.find((a) => checkExit(a, occupancy, state.width, state.height).blocked)
    for (let i = 0; i < MAX_LIVES; i++) state = reducer(state, { type: 'select', id: blocked.id })
    expect(state.status).toBe('gameover')
    expect(reducer(state, { type: 'select', id: blocked.id })).toBe(state)
    state = reducer(state, { type: 'retry' })
    expect(state.lives).toBe(MAX_LIVES)
    expect(state.status).toBe('playing')
  })

  it('clears a level and completes the campaign on the last one', () => {
    const clear = (index) => {
      let state = loadLevel(levels, index)
      while (state.arrows.length) {
        const occupancy = buildOccupancy(state.arrows, state.width, state.height)
        const free = state.arrows.find((a) => !checkExit(a, occupancy, state.width, state.height).blocked)
        state = reducer(state, { type: 'select', id: free.id })
      }
      return state
    }
    expect(clear(0).status).toBe('cleared')
    expect(clear(levels.length - 1).status).toBe('complete')
  })
})
