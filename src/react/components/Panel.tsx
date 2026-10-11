// The chrome of a panel: the panel itself, its head row, a row of tabs, a
// section's label, and the row a property sits in. Every row is one row of the
// module tall with a 1 px line under it, so panels built from them line up
// with whatever is beside them.

import { forwardRef, useRef, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react'

import { cx } from './tokens'

export interface PanelProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode
}

/** A column on the panel ground that fills what its host gives it and scrolls nothing itself. */
export const Panel = forwardRef<HTMLElement, PanelProps>(function Panel(
  { className, children, ...rest },
  ref,
) {
  return (
    <section ref={ref} className={cx('lm-panel', className)} {...rest}>
      {children}
    </section>
  )
})

export interface PanelHeadProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: string
  /** Rendered before the title (a `Glyph`). */
  glyph?: ReactNode
  /** Controls at the right, flush with the row (`TextButton cell`). */
  actions?: ReactNode
}

export function PanelHead({ title, glyph, actions, className, children, ...rest }: PanelHeadProps) {
  return (
    <header className={cx('lm-panel__head', className)} {...rest}>
      {glyph}
      <h2 className="lm-panel__title">{title}</h2>
      {children}
      {actions}
    </header>
  )
}

export interface TabItem {
  id: string
  label: string
  /** A count after the label. */
  count?: number
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  tabs: readonly TabItem[]
  /** The id of the tab that is showing, or null when its panel is closed. */
  selected: string | null
  onSelect: (id: string) => void
  /** Controls at the right of the row. */
  aside?: ReactNode
  'data-testid'?: string
  /** Any other `data-*` attribute goes to every tab. */
  [data: `data-${string}`]: string | undefined
}

/**
 * A row of tabs on the page ground; the selected one stands on the panel
 * ground. The arrow keys move between tabs, Home and End go to the ends.
 */
export function Tabs({ tabs, selected, onSelect, aside, className, ...rest }: TabsProps) {
  const list = useRef<HTMLDivElement>(null)
  const data: Record<string, string | undefined> = {}
  const root: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(rest)) {
    if (key.startsWith('data-') && key !== 'data-testid') data[key] = value as string
    else root[key] = value
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const at = tabs.findIndex((tab) => tab.id === selected)
    const last = tabs.length - 1
    const moves: Record<string, number> = {
      ArrowRight: at >= last ? 0 : at + 1,
      ArrowLeft: at <= 0 ? last : at - 1,
      Home: 0,
      End: last,
    }
    const to = moves[event.key] ?? -1
    if (to < 0 || !tabs[to]) return
    event.preventDefault()
    onSelect(tabs[to].id)
    list.current?.querySelectorAll<HTMLElement>('[role="tab"]')[to]?.focus()
  }

  return (
    <div className={cx('lm-tabs', className)} {...root}>
      <div ref={list} role="tablist" className="lm-tabs__list" onKeyDown={onKeyDown}>
        {tabs.map((tab, index) => {
          const on = tab.id === selected
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={on}
              // One tab is in the tab order: the selected one, or the first when none is.
              tabIndex={on || (selected === null && index === 0) ? 0 : -1}
              className="lm-tab"
              onClick={() => onSelect(tab.id)}
              {...data}
            >
              {tab.label}
              {tab.count === undefined ? null : <span className="lm-tab__count">{tab.count}</span>}
            </button>
          )
        })}
      </div>
      {aside}
    </div>
  )
}

export interface SectionLabelProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
  /** A readout or a control at the right of the row. */
  aside?: ReactNode
}

/** The label over a group of rows: one row on the page ground, in the label size. */
export function SectionLabel({ children, aside, className, ...rest }: SectionLabelProps) {
  return (
    <div className={cx('lm-section-label', className)} {...rest}>
      <span className="lm-section-label__text">{children}</span>
      {aside}
    </div>
  )
}

export interface PropRowProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  /** The id of the field in the value cell, so the label names it. */
  htmlFor?: string
  children?: ReactNode
}

/** A property: a 120 px label and a value cell with a hairline between, one row tall. */
export function PropRow({ label, htmlFor, className, children, ...rest }: PropRowProps) {
  return (
    <div className={cx('lm-prop', className)} {...rest}>
      {htmlFor ? (
        <label className="lm-prop__label" htmlFor={htmlFor}>
          {label}
        </label>
      ) : (
        <span className="lm-prop__label">{label}</span>
      )}
      <div className="lm-prop__value">{children}</div>
    </div>
  )
}
