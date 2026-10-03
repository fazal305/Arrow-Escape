import { useEffect, useId, useRef } from 'react'

// Native <dialog> gives us a focus trap, inert background and Escape handling.
// Escape is ignored because every overlay here needs an explicit choice.
export default function Modal({ open, tone, eyebrow, title, children, actions }) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`modal modal-${tone}`}
      aria-labelledby={titleId}
      onCancel={(e) => e.preventDefault()}
    >
      <div className="modal-card">
        {eyebrow && <p className="modal-eyebrow">{eyebrow}</p>}
        <h2 id={titleId} className="modal-title">
          {title}
        </h2>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">{actions}</div>
      </div>
    </dialog>
  )
}
