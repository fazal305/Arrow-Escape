// Fills each shape mask in shapes.js with arrows and writes src/levels/levels.json.
//
// Arrows are placed one at a time, and each new arrow's exit ray must be clear
// of every arrow placed before it. Removing them in reverse placement order is
// therefore always legal, so every generated level is solvable by construction.
//
//   npm run levels
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PALETTE, SHAPES } from './shapes.js'
import { isSolvable, parseLevel, buildOccupancy, checkExit } from '../src/game/engine.js'

const DIRS = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] }
const BODY_CHAR = { U: '^', D: 'v', L: '<', R: '>' }
const CANDIDATES_PER_SHAPE = 60

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const shuffle = (list, rand) => {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function rayCells([r, c], dir, width, height) {
  const [dr, dc] = DIRS[dir]
  const cells = []
  for (let rr = r + dr, cc = c + dc; rr >= 0 && cc >= 0 && rr < height && cc < width; rr += dr, cc += dc) {
    cells.push(rr * width + cc)
  }
  return cells
}

function fillShape(shape, seed) {
  const rand = mulberry32(seed)
  const { mask, minLen, maxLen } = shape
  const height = mask.length
  const width = mask[0].length
  const owner = new Int32Array(width * height).fill(-1)
  const inMask = (r, c) => r >= 0 && c >= 0 && r < height && c < width && mask[r][c] !== '.'
  const free = (r, c) => inMask(r, c) && owner[r * width + c] === -1
  const arrows = []

  const tryPlace = (head, shortest) => {
    const [hr, hc] = head
    const region = mask[hr][hc]
    for (const dir of shuffle(Object.keys(DIRS), rand)) {
      const ray = rayCells(head, dir, width, height)
      if (ray.some((i) => owner[i] !== -1)) continue
      const onRay = new Set(ray)
      const target = minLen + Math.floor(rand() * (maxLen - minLen + 1))
      const cells = [head]
      const used = new Set([hr * width + hc])
      let heading = dir
      while (cells.length < target) {
        const [r, c] = cells[cells.length - 1]
        // Grow away from the head; favour keeping the current heading so arrows have long runs.
        const back = Object.keys(DIRS).map((d) => [d, r - DIRS[d][0], c - DIRS[d][1]])
        const options = shuffle(back, rand)
          .filter(([, nr, nc]) => free(nr, nc) && mask[nr][nc] === region)
          .filter(([, nr, nc]) => !used.has(nr * width + nc) && !onRay.has(nr * width + nc))
          .sort(([a], [b]) => (b === heading) - (a === heading) || 0)
        if (!options.length) break
        const pick = rand() < 0.55 ? options[0] : options[Math.floor(rand() * options.length)]
        heading = pick[0]
        cells.push([pick[1], pick[2]])
        used.add(pick[1] * width + pick[2])
      }
      if (cells.length < shortest) continue
      const id = arrows.length
      cells.forEach(([r, c]) => (owner[r * width + c] = id))
      arrows.push({ id, dir, cells, ray })
      return true
    }
    return false
  }

  // Inner cells get boxed in once arrows surround them, so start near the
  // middle of the board and work outwards (with jitter so levels vary).
  const midR = (height - 1) / 2
  const midC = (width - 1) / 2
  const jitter = shape.jitter ?? 3
  for (let pass = 0; pass < 4; pass++) {
    const empties = []
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (free(r, c)) empties.push({ cell: [r, c], d: Math.hypot(r - midR, c - midC) + rand() * jitter })
      }
    }
    empties.sort((a, b) => a.d - b.d)
    for (const { cell } of empties) if (free(...cell)) tryPlace(cell, 2)
  }

  // Fill leftover single cells by extending a neighbouring tail, as long as the
  // cell is not on the exit ray of the arrow itself or of any arrow placed after it.
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (!free(r, c)) continue
      const idx = r * width + c
      for (const arrow of arrows) {
        const [tr, tc] = arrow.cells[arrow.cells.length - 1]
        if (Math.abs(tr - r) + Math.abs(tc - c) !== 1 || mask[tr][tc] !== mask[r][c]) continue
        if (arrows.slice(arrow.id).some((a) => a.ray.includes(idx))) continue
        arrow.cells.push([r, c])
        owner[idx] = arrow.id
        break
      }
    }
  }

  // Cells that still could not join any arrow become single-cell arrows.
  for (let r = 0; r < height; r++) for (let c = 0; c < width; c++) if (free(r, c)) tryPlace([r, c], 1)

  let filled = 0
  let total = 0
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (inMask(r, c)) total++
      if (owner[r * width + c] !== -1) filled++
    }
  }
  return { arrows, width, height, coverage: filled / total }
}

function encode({ arrows, width, height }) {
  const grid = Array.from({ length: height }, () => Array(width).fill('.'))
  for (const { dir, cells } of arrows) {
    const [hr, hc] = cells[0]
    grid[hr][hc] = dir
    for (let i = 1; i < cells.length; i++) {
      const [r, c] = cells[i]
      const [pr, pc] = cells[i - 1]
      const toward = Object.keys(DIRS).find((d) => r + DIRS[d][0] === pr && c + DIRS[d][1] === pc)
      grid[r][c] = BODY_CHAR[toward]
    }
  }
  return grid.map((row) => row.join(''))
}

// Prefer levels that cover the whole shape and leave few arrows free at the start.
function score(candidate) {
  const parsed = parseLevel({ name: 'candidate', rows: encode(candidate) })
  const occupancy = buildOccupancy(parsed.arrows, parsed.width, parsed.height)
  const openAtStart = parsed.arrows.filter((a) => !checkExit(a, occupancy, parsed.width, parsed.height).blocked).length
  const singles = parsed.arrows.filter((a) => a.cells.length === 1).length
  return candidate.coverage * 10 - (openAtStart / parsed.arrows.length) * 4 - singles * 0.5
}

const levels = SHAPES.map((shape) => {
  let best = null
  for (let i = 0; i < CANDIDATES_PER_SHAPE; i++) {
    const candidate = fillShape(shape, shape.seed * 1000 + i)
    const s = score(candidate)
    if (!best || s > best.score) best = { ...candidate, score: s }
  }
  const level = {
    id: shape.id,
    name: shape.name,
    rows: encode(best),
    regions: shape.mask,
    palette: PALETTE,
  }
  const parsed = parseLevel(level)
  if (!isSolvable(parsed)) throw new Error(`Generated level ${shape.id} is not solvable`)
  console.log(
    `${shape.name.padEnd(12)} ${best.width}x${best.height}  arrows ${String(parsed.arrows.length).padStart(3)}  coverage ${(best.coverage * 100).toFixed(0)}%`,
  )
  return level
})

const out = fileURLToPath(new URL('../src/levels/levels.json', import.meta.url))
writeFileSync(out, JSON.stringify(levels, null, 2) + '\n')
console.log(`Wrote ${levels.length} levels to src/levels/levels.json`)
