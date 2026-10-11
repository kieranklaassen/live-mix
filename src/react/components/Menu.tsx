// A menu: a list of one-row items on the panel ground, each with its shortcut
// right-aligned in mono. Give it `items`, or `MenuItem` children when each
// item needs attributes of its own. The arrow keys move between items, Home
// and End go to the ends, Escape calls `onClose`. The host places it (it is
// positioned absolutely) and decides when it is open.

import {
  forwardRef,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

import { cx } from './tokens'

export interface MenuEntry {
  label: string
  shortcut?: string
  onSelect: () => void
  disabled?: boolean
}

export interface MenuProps extends HTMLAttributes<HTMLDivElement> {
  /** The items in order; `'separator'` draws a line. */
  items?: readonly (MenuEntry | 'separator')[]
  /** Called on Escape. */
  onClose?: () => void
  /** `MenuItem` and `MenuSeparator` elements, after any `items`. */
  children?: ReactNode
  'data-testid'?: string
}

export const Menu = forwardRef<HTMLDivElement, MenuProps>(function Menu(
  { items, onClose, className, children, onKeyDown, ...rest },
  ref,
) {
  const own = useRef<HTMLDivElement | null>(null)

  const move = (event: KeyboardEvent<HTMLDivElement>): void => {
    onKeyDown?.(event)
    if (event.key === 'Escape') {
      if (onClose) {
        event.preventDefault()
        onClose()
      }
      return
    }
    const entries = [
      ...(own.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ??
        []),
    ]
    if (entries.length === 0) return
    const at = entries.indexOf(document.activeElement as HTMLButtonElement)
    const last = entries.length - 1
    const moves: Record<string, number> = {
      ArrowDown: at >= last ? 0 : at + 1,
      ArrowUp: at <= 0 ? last : at - 1,
      Home: 0,
      End: last,
    }
    const to = moves[event.key]
    if (to === undefined) return
    event.preventDefault()
    entries[to]?.focus()
  }

  return (
    <div
      ref={(node) => {
        own.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      role="menu"
      className={cx('lm-menu', className)}
      onKeyDown={move}
      {...rest}
    >
      {items?.map((item, index) =>
        item === 'separator' ? (
          <MenuSeparator key={`separator-${index}`} />
        ) : (
          <MenuItem
            key={item.label}
            shortcut={item.shortcut}
            disabled={item.disabled}
            onSelect={item.onSelect}
          >
            {item.label}
          </MenuItem>
        ),
      )}
      {children}
    </div>
  )
})

export interface MenuItemProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onSelect'> {
  shortcut?: string
  onSelect: () => void
  /** Marks the item as the one in force, for a choice among items. */
  checked?: boolean
  children?: ReactNode
}

/** One item of a `Menu`. Every other attribute (`data-*`, `aria-*`) goes to its `button`. */
export const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(function MenuItem(
  { shortcut, onSelect, checked, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      role={checked === undefined ? 'menuitem' : 'menuitemradio'}
      aria-checked={checked}
      className={cx('lm-menu__item', checked && 'lm-menu__item--checked', className)}
      onClick={onSelect}
      {...rest}
    >
      <span className="lm-menu__label">{children}</span>
      {shortcut ? <span className="lm-menu__key">{shortcut}</span> : null}
    </button>
  )
})

/** The line between two groups of items. */
export function MenuSeparator() {
  return <div role="separator" className="lm-menu__separator" />
}
