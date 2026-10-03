import { useEffect, useState } from 'react'
import { exitPath } from '../game/engine.js'
import { arrowStyle, headPolygon, polyline } from '../game/geometry.js'

const CELLS_PER_SECOND = 18
const ease = (p) => 0.55 * p + 0.45 * p * p

const toPoint = ([r, c]) => [c + 0.5, r + 0.5]

function pointAt(path, f) {
  const i = Math.floor(f)
  const t = f - i
  const [ax, ay] = toPoint(path[i])
  if (t === 0 || i + 1 >= path.length) return [ax, ay]
  const [bx, by] = toPoint(path[i + 1])
  return [ax + (bx - ax) * t, ay + (by - ay) * t]
}

// Snake position after `t` steps: tail first, head last.
function snakePoints(path, travel, n, t) {
  const headF = travel - t
  const tailF = headF + n - 1
  const points = [pointAt(path, tailF)]
  for (let i = Math.floor(tailF); i > headF; i--) {
    if (i < tailF) points.push(toPoint(path[i]))
  }
  points.push(pointAt(path, headF))
  return points
}

export default function LeavingArrow({ id, arrow, rayLength, reducedMotion, onDone }) {
  const [{ path, travel }] = useState(() => exitPath(arrow, rayLength))
  const [t, setT] = useState(0)

  useEffect(() => {
    if (reducedMotion) {
      const timer = setTimeout(() => onDone(id), 160)
      return () => clearTimeout(timer)
    }
    const duration = Math.max(320, (travel / CELLS_PER_SECOND) * 1000)
    const start = performance.now()
    let frame
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration)
      setT(ease(p) * travel)
      if (p < 1) frame = requestAnimationFrame(tick)
      else onDone(id)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [id, travel, reducedMotion, onDone])

  const n = arrow.cells.length
  const points = snakePoints(path, travel, n, t)
  const head = points[points.length - 1]

  return (
    <g
      className={`arrow arrow-leaving${reducedMotion ? ' arrow-fade' : ''}`}
      style={arrowStyle(arrow)}
      aria-hidden="true"
    >
      <g className="arrow-shape">
        {n > 1 && <polyline className="arrow-body" points={polyline(points)} />}
        {n > 1 && <circle className="arrow-tail" cx={points[0][0]} cy={points[0][1]} r="0.11" />}
        <polygon className="arrow-head" points={headPolygon(head, arrow.dir)} />
      </g>
    </g>
  )
}
