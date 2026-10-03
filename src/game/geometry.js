import { DIRS } from './engine.js'

export function headPolygon([x, y], dir) {
  const [dr, dc] = DIRS[dir]
  const tip = [x + dc * 0.42, y + dr * 0.42]
  const base = [x - dc * 0.08, y - dr * 0.08]
  const half = 0.3
  const left = [base[0] - dr * half, base[1] + dc * half]
  const right = [base[0] + dr * half, base[1] - dc * half]
  return [tip, left, right].map((p) => p.join(',')).join(' ')
}

export const polyline = (points) => points.map((p) => p.join(',')).join(' ')

// Neighbouring arrows often share a region colour, so alternate the shade to
// keep where one arrow ends and the next begins readable.
const SHADES = ['transparent 0%', 'white 24%', 'black 20%']
export const arrowStyle = (arrow) => ({
  '--arrow-color': `color-mix(in oklab, var(--arrow-${arrow.color}), ${SHADES[arrow.id % SHADES.length]})`,
})
