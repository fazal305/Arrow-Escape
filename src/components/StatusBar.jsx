import { MAX_LIVES } from '../game/gameReducer.js'

function Heart({ full }) {
  return (
    <svg className={`heart${full ? ' is-full' : ''}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 2.9 4.5 6.6 4.5c2.2 0 3.6 1.2 5.4 3.1 1.8-1.9 3.2-3.1 5.4-3.1 3.7 0 5.7 3.8 4.2 7.2C19.5 16.4 12 21 12 21z" />
    </svg>
  )
}

export default function StatusBar({ levelNumber, levelCount, levelName, lives, arrowsLeft }) {
  return (
    <div className="status">
      <div className="status-level">
        <span className="status-label">
          Level {levelNumber}
          <span className="status-of"> / {levelCount}</span>
        </span>
        <span className="status-name">{levelName}</span>
      </div>
      <div className="status-meta">
        <span className="status-count">
          <strong>{arrowsLeft}</strong> {arrowsLeft === 1 ? 'arrow' : 'arrows'} left
        </span>
        <div className="hearts" role="img" aria-label={`${lives} of ${MAX_LIVES} lives left`}>
          {Array.from({ length: MAX_LIVES }, (_, i) => (
            <Heart key={i} full={i < lives} />
          ))}
        </div>
      </div>
    </div>
  )
}
