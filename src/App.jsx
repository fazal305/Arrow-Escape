import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import levels from './levels/levels.json'
import Board from './components/Board.jsx'
import Modal from './components/Modal.jsx'
import StatusBar from './components/StatusBar.jsx'
import { createReducer, loadLevel, MAX_LIVES } from './game/gameReducer.js'
import { readSavedLevel, saveLevel } from './game/progress.js'
import useReducedMotion from './hooks/useReducedMotion.js'

const reducer = createReducer(levels)

function announcementFor(state) {
  const { lastMove, lives, arrows, status } = state
  if (!lastMove) return ''
  if (lastMove.type === 'blocked') {
    if (status === 'gameover') return 'Blocked. No hearts left. Game over.'
    return `Blocked by another arrow. ${lives} ${lives === 1 ? 'heart' : 'hearts'} left.`
  }
  if (status === 'complete') return 'Arrow escaped. Campaign complete!'
  if (status === 'cleared') return 'Arrow escaped. Level clear!'
  return `Arrow escaped. ${arrows.length} left.`
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, null, () => loadLevel(levels, readSavedLevel(levels.length)))
  const [animating, setAnimating] = useState(false)
  const reducedMotion = useReducedMotion()
  const level = levels[state.levelIndex]

  useEffect(() => {
    saveLevel(state.levelIndex)
  }, [state.levelIndex])

  const select = useCallback((id) => dispatch({ type: 'select', id }), [])
  const announcement = useMemo(() => announcementFor(state), [state])

  // Let the last arrow finish sliding off before the overlay covers the board.
  const overlay = state.status !== 'playing' && !(animating && state.status !== 'gameover') ? state.status : null
  const levelNumber = state.levelIndex + 1

  return (
    <div className="app">
      <header className="masthead">
        <a className="brand" href="./" aria-label="Arrow Escape home">
          <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M7 24V14a4 4 0 0 1 4-4h11" />
            <path d="m19 5 6 5-6 5" />
          </svg>
          <span className="brand-name">Arrow Escape</span>
        </a>
        <button
          type="button"
          className="button button-ghost"
          onClick={() => dispatch({ type: 'retry' })}
          disabled={state.status !== 'playing'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" />
          </svg>
          Restart level
        </button>
      </header>

      <main className="stage">
        <h1 className="visually-hidden">Arrow Escape, an untangling puzzle game</h1>
        <StatusBar
          levelNumber={levelNumber}
          levelCount={levels.length}
          levelName={level.name}
          lives={state.lives}
          arrowsLeft={state.arrows.length}
        />

        <div className="board-frame">
          <Board
            key={state.runId}
            level={level}
            state={state}
            onSelect={select}
            reducedMotion={reducedMotion}
            onAnimatingChange={setAnimating}
          />
        </div>

        <p className="hint">
          Tap an arrow to send it sliding the way it points. Its body follows the head like a snake.
          Hitting another arrow costs a heart.
        </p>
        <p className="visually-hidden" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
      </main>

      <footer className="footer">
        <p>
          A browser remake of a Pygame puzzle. No accounts, no tracking; progress is saved only in this browser.
        </p>
        <a href="https://github.com/fazal305/Arrow-Escape">Source on GitHub</a>
      </footer>

      <Modal
        open={overlay === 'cleared'}
        tone="success"
        eyebrow={`Level ${levelNumber} of ${levels.length}`}
        title="Level clear"
        actions={
          <button type="button" className="button button-primary" onClick={() => dispatch({ type: 'next' })} autoFocus>
            Next level
          </button>
        }
      >
        <p>
          {level.name} is untangled with {state.lives} of {MAX_LIVES} {MAX_LIVES === 1 ? 'heart' : 'hearts'} to spare.
          Next up: <strong>{levels[state.levelIndex + 1]?.name}</strong>.
        </p>
      </Modal>

      <Modal
        open={overlay === 'gameover'}
        tone="danger"
        eyebrow={`Level ${levelNumber} · ${level.name}`}
        title="Game over"
        actions={
          <button type="button" className="button button-primary" onClick={() => dispatch({ type: 'retry' })} autoFocus>
            Retry level
          </button>
        }
      >
        <p>
          Out of hearts with {state.arrows.length} {state.arrows.length === 1 ? 'arrow' : 'arrows'} still on the board.
          Look for arrows with a clear line to the edge first.
        </p>
      </Modal>

      <Modal
        open={overlay === 'complete'}
        tone="success"
        eyebrow="All levels cleared"
        title="Campaign complete"
        actions={
          <button
            type="button"
            className="button button-primary"
            onClick={() => dispatch({ type: 'restartCampaign' })}
            autoFocus
          >
            Play again from level 1
          </button>
        }
      >
        <p>You untangled all {levels.length} boards, from {levels[0].name} to the {level.name}.</p>
      </Modal>
    </div>
  )
}
