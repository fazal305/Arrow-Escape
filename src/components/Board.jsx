import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import Arrow from './Arrow.jsx'
import LeavingArrow from './LeavingArrow.jsx'

const SHAKE = [
  { transform: 'translate(0, 0)' },
  { transform: 'translate(-0.14px, 0)' },
  { transform: 'translate(0.14px, 0)' },
  { transform: 'translate(-0.1px, 0)' },
  { transform: 'translate(0.1px, 0)' },
  { transform: 'translate(0, 0)' },
]

export default function Board({ level, state, onSelect, reducedMotion, onAnimatingChange }) {
  const { width, height, arrows, lastMove, status } = state
  const clipId = useId()
  const nodes = useRef(new Map())
  const [leaving, setLeaving] = useState([])
  const [hit, setHit] = useState(null)
  const [handledMove, setHandledMove] = useState(lastMove)

  // React to the reducer's latest move while rendering, so a leaving arrow
  // is drawn in the same frame its static version disappears.
  if (lastMove !== handledMove) {
    setHandledMove(lastMove)
    if (lastMove?.type === 'exit') {
      setLeaving((list) => [...list, { key: lastMove.moveCount, arrow: lastMove.arrow, rayLength: lastMove.rayLength }])
    } else if (lastMove?.type === 'blocked') {
      setHit({ cell: lastMove.hit, key: lastMove.moveCount })
    }
  }

  useEffect(() => {
    if (lastMove?.type !== 'blocked') return
    const node = nodes.current.get(lastMove.id)
    if (!node) return
    const shake = node.animate(reducedMotion ? [{ opacity: 1 }, { opacity: 0.5 }, { opacity: 1 }] : SHAKE, {
      duration: reducedMotion ? 300 : 420,
      easing: 'ease-out',
    })
    node.classList.add('is-blocked')
    const timer = setTimeout(() => node.classList.remove('is-blocked'), 650)
    return () => {
      shake.cancel()
      clearTimeout(timer)
      node.classList.remove('is-blocked')
    }
  }, [lastMove, reducedMotion])

  useEffect(() => {
    onAnimatingChange(leaving.length > 0)
  }, [leaving.length, onAnimatingChange])

  const registerNode = useCallback((id, node) => {
    if (node) nodes.current.set(id, node)
    else nodes.current.delete(id)
  }, [])

  const finishLeaving = useCallback((key) => setLeaving((list) => list.filter((l) => l.key !== key)), [])

  const silhouette = useMemo(() => {
    const cells = []
    level.regions?.forEach((row, r) =>
      [...row].forEach((ch, c) => {
        if (ch !== '.') cells.push({ r, c, color: level.palette?.[ch] ?? 'sky' })
      }),
    )
    return cells
  }, [level])

  const ordered = useMemo(
    () => [...arrows].sort((a, b) => a.cells[0][0] - b.cells[0][0] || a.cells[0][1] - b.cells[0][1]),
    [arrows],
  )

  const pad = 0.3
  return (
    <svg
      className="board"
      viewBox={`${-pad} ${-pad} ${width + pad * 2} ${height + pad * 2}`}
      style={{ '--board-ratio': width / height }}
      aria-label={`${level.name} puzzle board, ${arrows.length} ${arrows.length === 1 ? 'arrow' : 'arrows'} left`}
      role="group"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={-pad} y={-pad} width={width + pad * 2} height={height + pad * 2} rx="0.4" />
        </clipPath>
      </defs>

      <g className="board-silhouette" aria-hidden="true">
        {silhouette.map(({ r, c, color }) => (
          <rect
            key={`${r},${c}`}
            x={c + 0.06}
            y={r + 0.06}
            width="0.88"
            height="0.88"
            rx="0.22"
            style={{ fill: `var(--arrow-${color})` }}
          />
        ))}
      </g>
      <g className="board-dots" aria-hidden="true">
        {Array.from({ length: width * height }, (_, i) => (
          <circle key={i} cx={(i % width) + 0.5} cy={Math.floor(i / width) + 0.5} r="0.045" />
        ))}
      </g>

      <g clipPath={`url(#${clipId})`}>
        {ordered.map((arrow) => (
          <Arrow
            key={arrow.id}
            arrow={arrow}
            onSelect={onSelect}
            registerNode={registerNode}
            disabled={status !== 'playing'}
          />
        ))}
        {leaving.map((l) => (
          <LeavingArrow
            key={l.key}
            id={l.key}
            arrow={l.arrow}
            rayLength={l.rayLength}
            reducedMotion={reducedMotion}
            onDone={finishLeaving}
          />
        ))}
      </g>

      {hit && (
        <g key={hit.key} className="hit-marker" aria-hidden="true" onAnimationEnd={() => setHit(null)}>
          <circle cx={hit.cell[1] + 0.5} cy={hit.cell[0] + 0.5} r="0.42" />
        </g>
      )}
    </svg>
  )
}
