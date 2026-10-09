// A picker: a panel that opens off a cell, with a search row, a list of rows
// and one action at its foot. Moved here from Ambient Live, where the effect
// picker and the preset list of an effect are made of it, so an app that
// draws a list of presets or of chains draws the same one. The parts take
// what they need as props: none knows an engine, a score or a keymap.
//
// `PickerPanel` is the frame and the keys; `PickerSearch`, `PickerGroup`,
// `PickerAction`, `Keycap` and `Highlight` are its rows. `PickList` puts
// them together for a plain list of named things.

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'

import { Glyph } from './Glyph'
import { infoProps, infoText, type InfoProps } from './info'
import { matchRanges } from './pick-search'
import { cx } from './tokens'

/** Where a panel sits in the window, in pixels. */
export interface PickerPlace {
  left: number
  top: number
  width: number
  height: number
}

export interface PickerPlaceInput {
  /** The cell the panel hangs off. */
  anchor: { left: number; right: number }
  /** The line the panel stands on (`side` above) or hangs from (`side` below): the top of the cell or of the bar it is in, or the cell's foot. */
  edge: number
  size: { width: number; height: number }
  viewport: { width: number; height: number }
  /** Which edge of the cell the panel lines up with. */
  align: 'start' | 'end'
  /** Whether the panel opens upward from the line or downward; upward when left out. */
  side?: 'above' | 'below'
}

/** How long a panel waits for a cell that left the page before it closes. */
const CELL_GONE_MS = 300

/** A window narrower than this is a phone's: a panel fills its width. */
export const PICKER_PHONE_WIDTH = 480

/**
 * The panel's place: lined up with its cell and kept whole inside the
 * window. Where the line leaves less room than the panel is tall, the panel
 * starts at the window's edge and covers part of what it opened from.
 */
export function pickerPlace({
  anchor,
  edge,
  size,
  viewport,
  align,
  side = 'above',
}: PickerPlaceInput): PickerPlace {
  // On a phone every panel is as wide as the window, the narrow ones too: none hangs off its cell with a strip of the page beside it.
  const width =
    viewport.width < PICKER_PHONE_WIDTH ? viewport.width : Math.min(size.width, viewport.width)
  const height = Math.min(size.height, viewport.height)
  const wanted = align === 'end' ? anchor.right - width : anchor.left
  const top = side === 'below' ? edge : edge - height
  return {
    left: Math.round(Math.max(0, Math.min(wanted, viewport.width - width))),
    top: Math.round(Math.max(0, Math.min(top, viewport.height - height))),
    width,
    height,
  }
}

/** The row after `delta` steps from `at` among `count` rows, stopping at both ends; -1 while there are none. */
export function cursorStep(at: number, delta: number, count: number): number {
  if (count <= 0) return -1
  if (at < 0) return delta > 0 ? 0 : count - 1
  return Math.max(0, Math.min(count - 1, at + delta))
}

/**
 * What Tab stops on inside a panel, in the order it goes: the controls that
 * can be pressed and are not put away.
 */
export function tabStops(panel: HTMLElement): HTMLElement[] {
  return [
    ...panel.querySelectorAll<HTMLElement>(
      // One selector, not a list of them: jsdom gives a list's finds kind by kind, and the stops are wanted in the order of the page.
      ':is(button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex])',
    ),
  ].filter(
    (control) =>
      control.tabIndex >= 0 &&
      control.closest('[hidden], [inert]') === null &&
      // jsdom lays nothing out and has no checkVisibility: there every control counts.
      (control.checkVisibility?.() ?? true),
  )
}

/**
 * Puts the focus on a cell, also on one among a plate's tools. A plate draws
 * its tools only while it is pointed at, holds the focus or has a panel open,
 * and a panel that closed on a pick leaves it none of the three: what is not
 * drawn takes no focus, so the plate shows them for this (`data-lm-refocus`).
 */
export function focusCell(cell: HTMLElement | null | undefined): void {
  if (!cell) return
  const plate = cell.closest('.lm-plate')
  plate?.setAttribute('data-lm-refocus', '')
  cell.focus()
  plate?.removeAttribute('data-lm-refocus')
}

/** Hands the focus back to what had it as a panel opened, or to the panel's cell where that is gone or cannot take it. */
function focusBack(cameFrom: HTMLElement | null, anchor: HTMLElement | null) {
  if (cameFrom?.isConnected) cameFrom.focus()
  if (!cameFrom || document.activeElement !== cameFrom) focusCell(anchor)
}

/** Scrolls a row of a list into sight, as little as that takes. */
function rowIntoView(id: string | null | undefined) {
  // jsdom has no layout and no scrollIntoView.
  if (id) document.getElementById(id)?.scrollIntoView?.({ block: 'nearest' })
}

/**
 * How many rows Page Up and Page Down move the cursor: what its list shows at
 * once, less the one a pinned group head lies over, and one row at least in a
 * list too short for two. Ten where that cannot be measured.
 */
function pageRows(search: HTMLElement | null): number {
  const row = document.getElementById(search?.getAttribute('aria-activedescendant') ?? '')
  const list = row?.closest<HTMLElement>('[role="listbox"]')
  const fit =
    row && list && row.offsetHeight > 0 ? Math.floor(list.clientHeight / row.offsetHeight) : 0
  return fit > 0 ? Math.max(fit - 1, 1) : 10
}

/** A tooltip as a paragraph of the info view: with its full stop. */
const sentence = (text: string) => (/[.!?…]$/.test(text) ? text : `${text}.`)

export interface PickerPanelProps {
  open: boolean
  /** The cell that opened it: the panel hangs off it, and focus goes back to it. */
  anchorRef: RefObject<HTMLElement | null>
  onClose: () => void
  /** The dialog's name. */
  label: string
  id: string
  width: number
  height: number
  align?: 'start' | 'end'
  /** Upward from the cell (or from its `rail`), or downward from the cell's foot. Upward when left out. */
  side?: 'above' | 'below'
  /**
   * The bar the cell is in, for a panel that stands on the bar's top edge and
   * not on the cell's: Ambient Live's bottom bar. Left out, the cell itself.
   */
  rail?: (anchor: HTMLElement) => HTMLElement | null
  /** The search field: focused on open, and where typing anywhere in the panel lands. */
  searchRef: RefObject<HTMLInputElement | null>
  /** A character typed with the focus elsewhere in the panel: it goes on the end of the query. */
  onType: (char: string) => void
  /** Up and down, by one row; Page Up and Page Down, by as many as a page of the list holds. */
  onMove: (delta: number) => void
  /** Return; with shift held the panel is meant to stay open. */
  onEnter: (keepOpen: boolean) => void
  /** Left and right, for a picker with two columns; true when the key was used. */
  onSide?: (side: 'left' | 'right') => boolean
  className?: string
  /** The panel's entry in the info view; left out, it says how a picker is worked. */
  info?: InfoProps
  'data-testid'?: string
  children: ReactNode
}

/**
 * The panel: a dialog rendered into the themed shell (what it opens from may
 * clip what hangs out of it), fixed beside its cell. Escape and a press
 * outside close it; the arrows, the page keys and return are the picker's,
 * wherever in the panel the focus is (a button keeps its own return, one
 * marked `data-row-play` does not), and a letter typed anywhere goes to the
 * search field. Tab stays in the panel while it is open, and so does the
 * focus: left on nothing, it goes to the search field.
 */
export function PickerPanel({
  open,
  anchorRef,
  onClose,
  label,
  id,
  width,
  height,
  align = 'start',
  side = 'above',
  rail,
  searchRef,
  onType,
  onMove,
  onEnter,
  onSide,
  className,
  info,
  'data-testid': testId,
  children,
}: PickerPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [place, setPlace] = useState<(PickerPlace & { host: HTMLElement }) | null>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const railRef = useRef(rail)
  railRef.current = rail
  // Another cell can be put under an open panel: the place is taken again when the cell is another one.
  const aimedAt = anchorRef.current

  useLayoutEffect(() => {
    if (!open) {
      setPlace(null)
      return
    }
    // Whether the cell has stood in the page since the panel opened on it.
    let stood = false
    // The wait to see whether a cell that left the page comes back.
    let gone: ReturnType<typeof setTimeout> | null = null
    const wide = () => (document.documentElement.clientWidth || width) >= PICKER_PHONE_WIDTH
    const measure = () => {
      // Read here, not above: a cell drawn in the same pass as the panel is in the ref by now.
      const anchor = anchorRef.current
      if (!anchor) return
      const drawn = anchor.getClientRects().length > 0
      // A cell that stood in the page and no longer does leaves the panel nothing to hang off: it
      // closes. Placed by a cell that is not there it would go to the window's edge, so it stays
      // where it is for the moment a layout takes to settle. jsdom draws nothing, so there the
      // cell never stood and the panel stays.
      if (stood && !drawn && wide()) {
        gone ??= setTimeout(() => {
          gone = null
          const cell = anchorRef.current
          if (cell?.getClientRects().length === 0 && wide()) closeRef.current()
          else measure()
        }, CELL_GONE_MS)
        return
      }
      if (drawn && gone !== null) {
        clearTimeout(gone)
        gone = null
      }
      stood ||= drawn
      // Outside a themed shell (a test renders a cell alone) the page itself hosts the panel.
      const host = anchor.closest<HTMLElement>('[data-lm-theme]') ?? document.body
      const bar = railRef.current?.(anchor) ?? anchor
      const cell = anchor.getBoundingClientRect()
      const next = pickerPlace({
        anchor: { left: cell.left, right: cell.right },
        edge: side === 'below' ? cell.bottom : bar.getBoundingClientRect().top,
        size: { width, height },
        viewport: {
          width: document.documentElement.clientWidth || width,
          height: document.documentElement.clientHeight || height,
        },
        align,
        side,
      })
      // Measured more often than it moves: the panel is drawn again only when its place is another.
      setPlace((was) =>
        was?.host === host &&
        was.left === next.left &&
        was.top === next.top &&
        was.width === next.width &&
        was.height === next.height
          ? was
          : { host, ...next },
      )
    }
    measure()
    // What the cell is in can scroll under the panel: it follows its cell.
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    // A bar moves when the panes beside it change size, without changing size itself: the place is taken again when any of them does.
    const anchor = anchorRef.current
    const bar = anchor ? (railRef.current?.(anchor) ?? null) : null
    const sizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    for (const pane of bar?.parentElement?.children ?? []) sizes?.observe(pane)
    // The cell itself is watched too: folded away it has no size, and nothing else says so.
    if (anchor) sizes?.observe(anchor)
    // A cell put at another place in its bar with no scroll and no change of size: that is seen too.
    const order =
      typeof MutationObserver === 'undefined' || !bar ? null : new MutationObserver(measure)
    if (bar) order?.observe(bar, { childList: true, subtree: true })
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      sizes?.disconnect()
      order?.disconnect()
      if (gone !== null) clearTimeout(gone)
    }
  }, [open, anchorRef, aimedAt, width, height, align, side])

  const shown = place !== null

  // What had the focus as the panel opened. A key can open it from elsewhere, and the keys go back there when it closes.
  const cameFromRef = useRef<HTMLElement | null>(null)

  // Focus goes to the search field when the panel opens, and back to where it was when it closes.
  useEffect(() => {
    if (!shown) return
    const anchor = anchorRef.current
    const panel = panelRef.current
    const active = document.activeElement as HTMLElement | null
    // Pressed, or with the focus on it, the cell is where the keys were: they go to the cell the panel hangs off then.
    const cameFrom = active === document.body || active === anchor ? null : active
    cameFromRef.current = cameFrom
    searchRef.current?.focus()
    // The list opens on the row of what is on, which can be far down it. The rows are in the page only now.
    rowIntoView(searchRef.current?.getAttribute('aria-activedescendant'))
    return () => {
      // The field left with the panel; a press elsewhere keeps the focus it took.
      const now = document.activeElement
      if (!now || now === document.body || panel?.contains(now)) focusBack(cameFrom, anchor)
    }
  }, [shown, anchorRef, searchRef])

  // The keys are the panel's for as long as it is open: focus left on nothing goes to the search field.
  const keepFocus = () => {
    const active = document.activeElement
    if (panelRef.current && (!active || active === document.body)) searchRef.current?.focus()
  }

  // A row taken out with the focus on it leaves the focus on nothing, and no blur tells of it: it is looked for each time the panel is drawn.
  useEffect(() => {
    if (open && shown) keepFocus()
  })

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return
      closeRef.current()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [open, anchorRef])

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    // The page's own keys (space, delete, a shortcut) are not for a panel that is open.
    event.stopPropagation()
    // Nor is a key the panel's while an input method puts a word together in the search: Return takes the word, Escape calls it off.
    if (event.nativeEvent.isComposing) return
    const target = event.target as HTMLElement
    const button = target.closest('button') !== null
    // A play cell is a button whose Return is the picker's: Space plays and stops, Return loads what is heard.
    const onButton = button && target.closest('[data-row-play]') === null
    // With a modifier an arrow or a page key is the search field's: Shift selects what was typed, Alt and Mod go by the word or to the end.
    const held = event.shiftKey || event.altKey || event.ctrlKey || event.metaKey
    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        onClose()
        focusBack(cameFromRef.current, anchorRef.current)
        return
      case 'ArrowDown':
      case 'ArrowUp':
        if (held) return
        event.preventDefault()
        onMove(event.key === 'ArrowDown' ? 1 : -1)
        return
      case 'PageDown':
      case 'PageUp': {
        if (held) return
        event.preventDefault()
        const page = pageRows(searchRef.current)
        onMove(event.key === 'PageDown' ? page : -page)
        return
      }
      case 'ArrowLeft':
      case 'ArrowRight':
        if (held) return
        if (onSide?.(event.key === 'ArrowLeft' ? 'left' : 'right')) event.preventDefault()
        return
      case 'Enter':
        // A key held down is one Return, and none while it is still down from the press that opened
        // the list: held on the cell, it picked the first row, the cell under it opened the list
        // again, and the next one picked again.
        if (event.repeat) {
          event.preventDefault()
          return
        }
        // On a button, return presses that.
        if (onButton) return
        event.preventDefault()
        onEnter(event.shiftKey)
        return
      case 'Tab': {
        const stops = panelRef.current ? tabStops(panelRef.current) : []
        const at = stops.indexOf(target)
        // Between two controls of the panel Tab goes on as it does.
        if (stops.length === 0 || (at >= 0 && at !== (event.shiftKey ? 0 : stops.length - 1)))
          return
        event.preventDefault()
        // From what is no stop it goes on to the control after that, with Shift to the one before; past either end it comes round to the other.
        const found = stops.findIndex(
          (stop) => target.compareDocumentPosition(stop) & Node.DOCUMENT_POSITION_FOLLOWING,
        )
        const after = found >= 0 ? found : stops.length
        const next = event.shiftKey ? (at >= 0 ? at : after) - 1 : after
        stops[(next + stops.length) % stops.length]?.focus()
        return
      }
      default:
        break
    }
    // A letter typed with the focus on a button still lands in the search field. Space is every button's own.
    const typed = event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey
    if (typed && target !== searchRef.current && !(button && event.key === ' ')) {
      event.preventDefault()
      searchRef.current?.focus()
      onType(event.key)
    }
  }

  // A row clicked with the mouse hands the focus back, so the next key is the picker's.
  function handleClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.detail > 0 && document.activeElement !== searchRef.current) searchRef.current?.focus()
  }

  if (!place) return null
  return createPortal(
    <div
      ref={panelRef}
      id={id}
      role="dialog"
      aria-label={label}
      className={cx('lm-picker', className)}
      style={{ left: place.left, top: place.top, width: place.width, height: place.height }}
      onKeyDown={handleKeyDown}
      onKeyUp={(event) => event.stopPropagation()}
      onClick={handleClick}
      // A press on what cannot take the focus leaves it on nothing too: looked at once the press is over.
      onBlur={(event) => {
        if (event.relatedTarget === null) requestAnimationFrame(keepFocus)
      }}
      data-testid={testId}
      {...(info ??
        infoProps(
          label,
          'A list to search and pick from. A letter typed anywhere in it goes to the search, Up and Down move the cursor, Page Up and Page Down a page of rows at a time, and Return does what the cell at its foot says. Tab goes round its controls, and Escape or a press outside closes it.',
        ))}
    >
      {children}
    </div>,
    place.host,
  )
}

// Glyphs -----------------------------------------------------------------------

/** The chevron of a cell that opens a list. */
export const PICK_CHEVRON_DOWN = 'M2.5 3.5L5 6.5L7.5 3.5'
/** The chevron of a cell that steps back. */
export const PICK_CHEVRON_LEFT = 'M6.5 2L3.5 5L6.5 8'
/** The chevron of a cell that steps on. */
export const PICK_CHEVRON_RIGHT = 'M3.5 2L6.5 5L3.5 8'

// Rows of the panel ----------------------------------------------------------------

/** A key's name in a small box, as a hint beside what it does. */
export function Keycap({ children, info }: { children: string; info?: InfoProps }) {
  return (
    <kbd className="lm-keycap" {...info}>
      {children}
    </kbd>
  )
}

export interface PickerSearchProps {
  inputRef: RefObject<HTMLInputElement | null>
  value: string
  onChange: (value: string) => void
  placeholder: string
  /** What the field searches, for a reader that cannot see the placeholder. */
  label: string
  /** The field's tooltip: what can be typed and what the keys do. */
  hint: string
  /** How many rows are shown, and out of how many when that is fewer. */
  shown: number
  total: number
  /** The list the field drives, and the row of it the cursor is on. */
  controls: string
  activeId?: string
  /** The field's entry in the info view; left out, it is made of `hint`. */
  info?: InfoProps
  'data-testid'?: string
}

/** The panel's first row: the search field, how many rows it leaves, and the key that closes the panel. */
export function PickerSearch({
  inputRef,
  value,
  onChange,
  placeholder,
  label,
  hint,
  shown,
  total,
  controls,
  activeId,
  info,
  'data-testid': testId,
}: PickerSearchProps) {
  const fieldInfo =
    info ??
    infoProps(
      'Search',
      `Finds rows by what is typed and draws the letters it found in the accent colour. ${sentence(hint)}`,
    )
  return (
    <div className="lm-picker__search">
      <span
        aria-hidden="true"
        className={cx('lm-picker__find', value !== '' && 'lm-picker__find--on')}
        {...fieldInfo}
      >
        <Glyph kind="find" />
      </span>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded="true"
        aria-autocomplete="list"
        aria-controls={controls}
        aria-activedescendant={activeId}
        aria-label={label}
        title={hint}
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="lm-picker__field"
        data-testid={testId}
        {...fieldInfo}
      />
      <span className="lm-picker__count-cell">
        <span
          className="lm-picker__count"
          title={shown === total ? `${total} in all` : `${shown} shown of ${total}`}
          data-testid={testId ? `${testId}-count` : undefined}
          {...infoProps(
            'Count',
            shown === total
              ? `How many rows the panel has to pick from: ${total} in all. With a search typed it counts what the search leaves, out of this number.`
              : `How many rows the search leaves: ${shown} of the ${total} there are in all.`,
          )}
        >
          {shown === total ? total : `${shown} of ${total}`}
        </span>
        <Keycap
          info={infoProps(
            'Escape',
            'Closes the panel and puts the focus back where it was: on the cell that opened it, or on what had the keys when a key opened it. A press outside the panel closes it too.',
          )}
        >
          esc
        </Keycap>
      </span>
    </div>
  )
}

/**
 * A group's head in a list of results: its name and how many rows are under
 * it. It stays at the top of the list while its rows scroll under it, and
 * says so (`data-pinned-head`): the list brings a row into view the head's
 * height short of its top, so a row the cursor lands on shows below the head.
 */
export function PickerGroup({
  label,
  count,
  info,
  'data-testid': testId,
}: {
  label: string
  count: number
  /** The head's entry in the info view; left out, it says what a head and its number are. */
  info?: InfoProps
  'data-testid'?: string
}) {
  return (
    <div
      role="presentation"
      className="lm-picker__group"
      data-pinned-head=""
      data-testid={testId}
      {...(info ??
        infoProps(
          label,
          'Heads a group of rows in the list. The number at its right counts the rows under it.',
        ))}
    >
      <span className="lm-picker__group-name">{label}</span>
      <span className="lm-picker__group-count">{count}</span>
    </div>
  )
}

/** A name with the letters the search found in the accent colour. */
export function Highlight({ text, query }: { text: string; query: string }) {
  const ranges = matchRanges(text, query)
  if (ranges.length === 0) return <>{text}</>
  const parts: ReactNode[] = []
  let at = 0
  for (const [start, end] of ranges) {
    if (start > at) parts.push(text.slice(at, start))
    parts.push(
      <mark key={start} className="lm-match">
        {text.slice(start, end)}
      </mark>,
    )
    at = end
  }
  if (at < text.length) parts.push(text.slice(at))
  return <>{parts}</>
}

export interface PickerActionProps {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  title: string
  className?: string
  /** The cell's entry in the info view; left out, it is made of `title`. */
  info?: InfoProps
  'data-testid'?: string
}

/** The picker's one action: what return does, spelled out. */
export function PickerAction({
  children,
  onClick,
  disabled = false,
  title,
  className,
  info,
  'data-testid': testId,
}: PickerActionProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={cx('lm-picker__action', className)}
      data-testid={testId}
      {...(info ??
        infoProps(
          'Action',
          infoText(
            sentence(title),
            disabled
              ? 'Held for now: there is nothing for it to do.'
              : 'Return does the same. With Shift held the panel stays open.',
          ),
        ))}
    >
      <span className="lm-picker__action-name">{children}</span>
      <Glyph kind="return" />
    </button>
  )
}

/**
 * Brings the cursor's row into view when the arrows move it past the edge of
 * its list. As the list opens its rows are not in the page yet: the panel
 * brings the row into view then.
 */
export function useRowInView(activeId: string | undefined, open: boolean): void {
  useEffect(() => {
    if (open) rowIntoView(activeId)
  }, [activeId, open])
}
