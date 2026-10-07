// A sheet: one thing to settle, over the whole window on a scrim. A head row
// with its title, the body, and a foot two rows tall with the buttons at the
// right, the primary one last. Escape calls `onClose`, Tab stays inside it,
// and the focus goes back where it was when the sheet is taken away. The host
// decides when it is there: mount it to open it.

import {
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

import { cx } from './tokens'

const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

export interface SheetProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: string
  onClose: () => void
  /** The buttons, in order; the last is the one the sheet leads to. */
  footer?: ReactNode
  /** Px width (default 480). */
  width?: number
  children?: ReactNode
  'data-testid'?: string
}

export function Sheet({
  title,
  onClose,
  footer,
  width = 480,
  className,
  style,
  children,
  ...rest
}: SheetProps) {
  const sheet = useRef<HTMLDivElement>(null)
  const titleId = useId()

  // The focus comes into the sheet when it opens and goes back where it was when it goes.
  useEffect(() => {
    const before = document.activeElement
    const first = sheet.current?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? sheet.current)?.focus()
    return () => {
      if (before instanceof HTMLElement && before.isConnected) before.focus()
    }
  }, [])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const stops = [...(sheet.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])]
    if (stops.length === 0) {
      event.preventDefault()
      return
    }
    const first = stops[0]
    const last = stops[stops.length - 1]
    const at = document.activeElement
    if (event.shiftKey && (at === first || at === sheet.current)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && at === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="lm-scrim">
      <div
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx('lm-sheet', className)}
        style={{ width, ...style }}
        onKeyDown={onKeyDown}
        {...rest}
      >
        <header className="lm-sheet__head">
          <h2 id={titleId} className="lm-sheet__title">
            {title}
          </h2>
        </header>
        <div className="lm-sheet__body">{children}</div>
        {footer ? <footer className="lm-sheet__foot">{footer}</footer> : null}
      </div>
    </div>
  )
}
