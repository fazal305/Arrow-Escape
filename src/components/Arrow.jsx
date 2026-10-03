import { memo } from 'react'
import { dirName } from '../game/engine.js'
import { arrowStyle, headPolygon, polyline } from '../game/geometry.js'

const center = ([r, c]) => [c + 0.5, r + 0.5]

const hitArea = (cells) =>
  cells.map(([r, c]) => `M${c} ${r}h1v1h-1z`).join('')

function Arrow({ arrow, onSelect, registerNode, disabled }) {
  const points = [...arrow.cells].reverse().map(center)
  const head = center(arrow.cells[0])
  const label = `${arrow.cells.length}-segment arrow at row ${arrow.cells[0][0] + 1}, column ${
    arrow.cells[0][1] + 1
  }, pointing ${dirName(arrow.dir)}`

  const activate = () => {
    if (!disabled) onSelect(arrow.id)
  }

  return (
    <g
      ref={(node) => registerNode(arrow.id, node)}
      className="arrow"
      style={arrowStyle(arrow)}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-disabled={disabled || undefined}
      onClick={activate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          activate()
        }
      }}
    >
      <path className="arrow-hit" d={hitArea(arrow.cells)} />
      <g className="arrow-shape">
        {points.length > 1 && <polyline className="arrow-focus" points={polyline(points)} />}
        <polygon className="arrow-focus-head" points={headPolygon(head, arrow.dir)} />
        {points.length > 1 && <polyline className="arrow-body" points={polyline(points)} />}
        {points.length > 1 && <circle className="arrow-tail" cx={points[0][0]} cy={points[0][1]} r="0.11" />}
        <polygon className="arrow-head" points={headPolygon(head, arrow.dir)} />
      </g>
    </g>
  )
}

export default memo(Arrow)
