// The info view: a small pane that says what the control under the pointer
// is and does, as the box in the bottom left corner of Ableton Live does. It
// reads `data-lm-info` off the page (see `info.ts`), so a host gives every
// control a sentence and puts one `InfoView` where the eye can find it. The
// kit's own controls carry their entries already.

import { useEffect, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'

import {
  INFO_TEXT_ATTR,
  INFO_TITLE_ATTR,
  findInfo,
  infoParagraphs,
  sameInfo,
  type InfoEntry,
} from './info'
import { cx } from './tokens'

export interface UseInfoOptions {
  /**
   * The part of the page that is described: an element, or a ref to one.
   * Left out, the whole document.
   */
  root?: RefObject<Element | null> | Element | null
  /** Stop following the pointer (the view is hidden); the entry is then null. */
  disabled?: boolean
}

function isRef(root: UseInfoOptions['root']): root is RefObject<Element | null> {
  return typeof root === 'object' && root !== null && 'current' in root
}

/** The attributes whose change alters what is said about the control under the pointer. */
const WATCHED = [INFO_TEXT_ATTR, INFO_TITLE_ATTR]

/**
 * The element the view follows. A ref's element can be mounted after the
 * view, or mounted again under the same ref, so the page is watched and the
 * ref read afresh as it changes.
 */
function useScope(root: UseInfoOptions['root'], disabled: boolean): Element | null {
  const [scope, setScope] = useState<Element | null>(null)

  useEffect(() => {
    if (disabled || typeof document === 'undefined') {
      setScope(null)
      return
    }
    const resolve = (): void => {
      const found = isRef(root) ? root.current : (root ?? document.documentElement)
      setScope((previous) => (previous === found ? previous : found))
    }
    resolve()
    if (!isRef(root)) return
    const observer = typeof MutationObserver === 'undefined' ? null : new MutationObserver(resolve)
    observer?.observe(document.documentElement, { subtree: true, childList: true })
    return () => observer?.disconnect()
  }, [root, disabled])

  return scope
}

/**
 * The entry of whatever the pointer is over inside `root`, or of what has
 * the keyboard focus when that moved last; null over nothing that has one.
 * It follows the control: a button whose text changes when it is pressed is
 * read again.
 */
export function useInfo({ root, disabled = false }: UseInfoOptions = {}): InfoEntry | null {
  const [entry, setEntry] = useState<InfoEntry | null>(null)
  const scope = useScope(root, disabled)

  useEffect(() => {
    if (disabled || !scope) {
      setEntry(null)
      return
    }

    // What the pointer or the focus is on now.
    let target: Element | null = null
    const read = (): void => {
      if (target && !target.isConnected) target = null
      const next = findInfo(target, scope)?.entry ?? null
      setEntry((previous) => (sameInfo(previous, next) ? previous : next))
    }
    const follow = (event: Event): void => {
      target = event.target instanceof Element ? event.target : null
      read()
    }
    const leave = (): void => {
      target = null
      read()
    }

    // A press can change what a control says, or take the control away: read
    // again once the page has drawn the change.
    let pending: ReturnType<typeof setTimeout> | null = null
    const readSoon = (): void => {
      if (pending !== null) return
      pending = setTimeout(() => {
        pending = null
        read()
      }, 0)
    }
    const observer = typeof MutationObserver === 'undefined' ? null : new MutationObserver(readSoon)
    observer?.observe(scope, { subtree: true, attributes: true, attributeFilter: WATCHED })

    scope.addEventListener('pointerover', follow)
    scope.addEventListener('pointerleave', leave)
    scope.addEventListener('focusin', follow)
    scope.addEventListener('click', readSoon)
    scope.addEventListener('keyup', readSoon)
    return () => {
      scope.removeEventListener('pointerover', follow)
      scope.removeEventListener('pointerleave', leave)
      scope.removeEventListener('focusin', follow)
      scope.removeEventListener('click', readSoon)
      scope.removeEventListener('keyup', readSoon)
      observer?.disconnect()
      if (pending !== null) clearTimeout(pending)
    }
  }, [scope, disabled])

  return entry
}

/** What the view says over nothing that has an entry. */
export const INFO_IDLE: InfoEntry = {
  title: 'Info',
  text: 'Point at a control to read what it does.',
}

export interface InfoViewProps extends UseInfoOptions {
  /** Draw this entry instead of following the pointer. */
  entry?: InfoEntry | null
  /** Shown while the pointer is over nothing that has an entry. */
  idle?: InfoEntry
  /** The view's name for assistive technology (default "Info"). */
  label?: string
  /** Controls in the title row, after the name: a button that hides the view. */
  actions?: ReactNode
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

function Followed({ root, disabled, ...rest }: InfoViewProps) {
  const entry = useInfo({ root, disabled })
  return <InfoPane {...rest} entry={entry} />
}

function InfoPane({
  entry,
  idle = INFO_IDLE,
  label = 'Info',
  actions,
  className,
  style,
  'data-testid': testId,
}: Omit<InfoViewProps, 'root' | 'disabled'>) {
  const shown = entry ?? idle
  return (
    <aside
      className={cx('lm-info', !entry && 'lm-info--idle', className)}
      style={style}
      aria-label={label}
      data-testid={testId}
    >
      <header className="lm-info__header">
        <h3 className="lm-info__title" data-testid={testId ? `${testId}-title` : undefined}>
          {shown.title}
        </h3>
        {actions ? <div className="lm-info__actions">{actions}</div> : null}
      </header>
      <div className="lm-info__text" data-testid={testId ? `${testId}-text` : undefined}>
        {infoParagraphs(shown.text).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </aside>
  )
}

/**
 * A pane that names the control under the pointer and says what it does. It
 * follows the pointer inside `root` unless an `entry` is handed to it.
 */
export function InfoView(props: InfoViewProps) {
  if (props.entry !== undefined) return <InfoPane {...props} />
  return <Followed {...props} />
}
