// Level encoding (one string per row):
//   U D L R  arrow head; the letter is the direction the arrow exits in
//   ^ v < >  body segment; points at the next segment towards the head
//   .        empty cell
export const DIRS = {
  U: [-1, 0],
  D: [1, 0],
  L: [0, -1],
  R: [0, 1],
}

const BODY_TO_DIR = { '^': 'U', v: 'D', '<': 'L', '>': 'R' }
const DIR_NAMES = { U: 'up', D: 'down', L: 'left', R: 'right' }

export const dirName = (dir) => DIR_NAMES[dir]

const key = (r, c) => `${r},${c}`

export function parseLevel(level) {
  const { rows, regions, palette = {} } = level
  const height = rows.length
  const width = rows[0]?.length ?? 0
  if (!height || !width) throw new Error(`Level "${level.name}" is empty`)
  rows.forEach((row, r) => {
    if (row.length !== width) throw new Error(`Level "${level.name}" row ${r} has the wrong width`)
  })

  // For each cell, which body cell points into it (its predecessor away from the head).
  const pointedFrom = new Map()
  const heads = []
  let bodyCount = 0
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const ch = rows[r][c]
      if (ch === '.') continue
      if (DIRS[ch]) {
        heads.push([r, c, ch])
        continue
      }
      const dir = BODY_TO_DIR[ch]
      if (!dir) throw new Error(`Level "${level.name}" has an unknown cell "${ch}" at ${r},${c}`)
      bodyCount++
      const [dr, dc] = DIRS[dir]
      const target = key(r + dr, c + dc)
      if (pointedFrom.has(target)) {
        throw new Error(`Level "${level.name}" has two segments pointing into ${target}`)
      }
      pointedFrom.set(target, [r, c])
    }
  }

  let claimedBody = 0
  const arrows = heads.map(([r, c, dir], id) => {
    const cells = [[r, c]]
    let next = pointedFrom.get(key(r, c))
    while (next) {
      cells.push(next)
      next = pointedFrom.get(key(next[0], next[1]))
      if (cells.length > width * height) throw new Error(`Level "${level.name}" has a looping arrow`)
    }
    claimedBody += cells.length - 1
    if (cells.length > 1) {
      const [dr, dc] = DIRS[dir]
      if (cells[1][0] === r + dr && cells[1][1] === c + dc) {
        throw new Error(`Level "${level.name}" has an arrow at ${r},${c} pointing into its own body`)
      }
    }
    const region = regions?.[r]?.[c]
    return { id, dir, cells, color: palette[region] ?? 'sky' }
  })

  if (claimedBody !== bodyCount) {
    throw new Error(`Level "${level.name}" has body segments that are not attached to a head`)
  }

  return { width, height, arrows }
}

export function buildOccupancy(arrows, width, height) {
  const grid = new Int32Array(width * height).fill(-1)
  for (const arrow of arrows) {
    for (const [r, c] of arrow.cells) grid[r * width + c] = arrow.id
  }
  return grid
}

// Walks the head forward to the board edge. The body follows the head like a
// snake, so a cell of its own body only blocks the head if that segment has
// not moved out of the way by the time the head arrives.
export function checkExit(arrow, occupancy, width, height) {
  const [dr, dc] = DIRS[arrow.dir]
  const n = arrow.cells.length
  const ray = []
  let [r, c] = arrow.cells[0]
  for (let step = 1; ; step++) {
    r += dr
    c += dc
    if (r < 0 || c < 0 || r >= height || c >= width) break
    const owner = occupancy[r * width + c]
    if (owner !== -1) {
      if (owner !== arrow.id) return { blocked: true, hit: [r, c], blocker: owner, ray }
      const index = arrow.cells.findIndex(([br, bc]) => br === r && bc === c)
      if (index <= n - 1 - step) return { blocked: true, hit: [r, c], blocker: owner, ray }
    }
    ray.push([r, c])
  }
  return { blocked: false, ray }
}

// The full sequence of grid points the arrow travels through, ordered from
// the furthest exit point back to its tail. At step t the arrow occupies
// path[travel - t] (head) through path[travel - t + n - 1] (tail).
export function exitPath(arrow, rayLength) {
  const [dr, dc] = DIRS[arrow.dir]
  const n = arrow.cells.length
  const travel = rayLength + n + 1
  const [hr, hc] = arrow.cells[0]
  const ahead = []
  for (let d = travel; d >= 1; d--) ahead.push([hr + dr * d, hc + dc * d])
  return { path: [...ahead, ...arrow.cells], travel }
}

export function isSolvable({ arrows, width, height }) {
  let remaining = arrows
  while (remaining.length) {
    const occupancy = buildOccupancy(remaining, width, height)
    const next = remaining.filter((a) => checkExit(a, occupancy, width, height).blocked)
    if (next.length === remaining.length) return false
    remaining = next
  }
  return true
}
