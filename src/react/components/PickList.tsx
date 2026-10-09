// A list of named things to search and pick one from: an effect's presets,
// the effects a chain can take, the chains a strip can start from. It is a
// `PickerPanel` with the rows Ambient Live's preset list has: the search, the
// rows, the hint and the one action at the foot. What an app adds to a row
// (a star, a cell that plays it, a cell that deletes it) goes in `rowTools`,
// and what narrows the list besides the search goes in `filters`.
//
// `PickCell` is a cell that opens one. Nothing here knows an engine or a
// score: a pick is handed to `onPick`, and what it does is the app's.

import {
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react'

import { type Patch } from '../../core/devices/patch'
import { DEVICE_CATEGORIES, type DeviceDescriptor } from '../../core/devices/registry'
import { Glyph } from './Glyph'
import { infoProps, infoText, type InfoProps } from './info'
import { searchRows } from './pick-search'
import {
  Highlight,
  PICK_CHEVRON_DOWN,
  PickerAction,
  PickerGroup,
  PickerPanel,
  PickerSearch,
  cursorStep,
  useRowInView,
} from './Picker'
import { cx } from './tokens'

/** One thing a list offers. */
export interface PickItem {
  /** What a pick is known by; one of a list has it alone. */
  id: string
  name: string
  /** What it is for, said dim beside the name. The search reads it too. */
  detail?: string
  /** More words the search finds it by. */
  more?: readonly string[]
  /** The head it is listed under. Items of one group are given together. */
  group?: string
}

/** A row of the list as it is drawn. */
export interface PickRow<T extends PickItem = PickItem> {
  item: T
  /** The search found it; the rest follow, dimmed. */
  match: boolean
}

/**
 * The items as the list shows them. With nothing typed they are in the order
 * given. With a search the ones it found lead, best first, and the rest
 * follow in their own order: a search that found nothing still lists them,
 * so the list never empties under what is being typed.
 */
export function pickRows<T extends PickItem>(items: readonly T[], query: string): PickRow<T>[] {
  if (query.trim() === '') return items.map((item) => ({ item, match: true }))
  const found = searchRows(
    items.map((item) => ({
      name: item.name,
      more: [...(item.detail ? [item.detail] : []), ...(item.more ?? [])],
      item,
    })),
    query,
  ).map((row) => row.item)
  const leading = new Set(found)
  return [
    ...found.map((item) => ({ item, match: true })),
    ...items.filter((item) => !leading.has(item)).map((item) => ({ item, match: false })),
  ]
}

/** A name as part of an id or a test id: its letters and digits, the rest a dash. */
export function pickSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** A registry's devices as items: each under the head of its category, in the order the categories are listed. */
export function deviceItems(descriptors: readonly DeviceDescriptor[]): PickItem[] {
  const order = new Map(DEVICE_CATEGORIES.map((category, index) => [category.id, index]))
  const label = new Map(DEVICE_CATEGORIES.map((category) => [category.id, category.label]))
  return descriptors
    .map((descriptor, index) => ({ descriptor, index }))
    .sort(
      (a, b) =>
        (order.get(a.descriptor.category) ?? DEVICE_CATEGORIES.length) -
          (order.get(b.descriptor.category) ?? DEVICE_CATEGORIES.length) || a.index - b.index,
    )
    .map(({ descriptor }) => ({
      id: descriptor.id,
      name: descriptor.name,
      detail: descriptor.description,
      group: label.get(descriptor.category) ?? descriptor.category,
    }))
}

/** Chains as items: a patch's name, what it is for, and its category as a word the search finds it by. */
export function patchItems(patches: readonly Patch[]): PickItem[] {
  return patches.map((patch) => ({
    id: patch.id,
    name: patch.name,
    detail: patch.description || undefined,
    more: [patch.category],
  }))
}

export interface PickListProps<T extends PickItem = PickItem> {
  open: boolean
  /** The cell that opened it. */
  anchorRef: RefObject<HTMLElement | null>
  onClose: () => void
  /** What is listed, as the dialog and its list are named: "Presets of Compressor". */
  label: string
  items: readonly T[]
  /** The id of the one that is on now: the list opens on it, and it is not picked again. */
  current?: string | null
  /** A row was picked. The list has closed already, unless `keepOpen` (Shift with Return). */
  onPick: (item: T, keepOpen: boolean) => void
  /** What a pick does, as the action cell says it: "Load" gives "Load Voice, even". */
  verb?: string
  /** What the current one is called in the action cell: "On" gives "On Voice, even". */
  currentVerb?: string
  placeholder?: string
  width?: number
  height?: number
  align?: 'start' | 'end'
  side?: 'above' | 'below'
  rail?: (anchor: HTMLElement) => HTMLElement | null
  /** A row under the search: an app's chips for what to list. */
  filters?: ReactNode
  /** What stands at a row's right end: an app's star, play or delete cells. */
  rowTools?: (item: T) => ReactNode
  /** More attributes for a row: an app's own marks on it. */
  rowProps?: (item: T) => HTMLAttributes<HTMLDivElement> & Record<`data-${string}`, string>
  /** A row's entry in the info view; left out, it says what a press and a double press do. */
  rowInfo?: (item: T, state: { current: boolean; cursor: boolean; match: boolean }) => InfoProps
  /** The panel's entry in the info view. */
  info?: InfoProps
  /** The panel's test id; its parts are `<id>-search`, `<id>-list`, `<id>-row-<slug of the id>`, `<id>-action`. */
  'data-testid'?: string
}

/** The list: see the head of this file. */
export function PickList<T extends PickItem = PickItem>({
  open,
  anchorRef,
  onClose,
  label,
  items,
  current = null,
  onPick,
  verb = 'Load',
  currentVerb = 'On',
  placeholder,
  width = 300,
  height = 340,
  align = 'end',
  side = 'above',
  rail,
  filters,
  rowTools,
  rowProps,
  rowInfo,
  info,
  'data-testid': testId,
}: PickListProps<T>) {
  const panelId = useId()
  const searchRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  // The row the cursor was put on; null leaves it on what the list opens on.
  const [cursor, setCursor] = useState<string | null>(null)
  // A list that was closed opens as a new one: nothing typed, the cursor on what is on.
  const [wasOpen, setWasOpen] = useState(open)
  if (wasOpen !== open) {
    setWasOpen(open)
    if (open) {
      setQuery('')
      setCursor(null)
    }
  }

  const rows = useMemo(() => pickRows(items, query), [items, query])
  const searching = query.trim() !== ''
  const found = rows.filter((row) => row.match).length
  // The row Return acts on: the cursor's, else the first the search found, else (nothing typed)
  // the one that is on, and the first where nothing is.
  const onAt = current == null ? -1 : rows.findIndex((row) => row.item.id === current)
  const at =
    cursor !== null
      ? rows.findIndex((row) => row.item.id === cursor)
      : searching
        ? found > 0
          ? 0
          : -1
        : onAt >= 0
          ? onAt
          : rows.length > 0
            ? 0
            : -1
  const target = at >= 0 ? rows[at] : undefined
  const rowId = (index: number) => `${panelId}-row-${index}`
  const activeId = at >= 0 ? rowId(at) : undefined
  useRowInView(activeId, open)

  function load(row: PickRow<T> | undefined, keepOpen: boolean) {
    if (!row || row.item.id === current) return
    if (!keepOpen) onClose()
    else setCursor(row.item.id)
    onPick(row.item, keepOpen)
  }

  const grouped = !searching && items.some((item) => item.group !== undefined)
  const groupCount = (group: string | undefined) =>
    rows.filter((row) => row.item.group === group).length
  const lower = verb.toLowerCase()

  return (
    <PickerPanel
      open={open}
      anchorRef={anchorRef}
      onClose={onClose}
      label={label}
      id={panelId}
      width={width}
      height={height}
      align={align}
      side={side}
      rail={rail}
      searchRef={searchRef}
      onType={(char) => {
        setQuery(query + char)
        setCursor(null)
      }}
      onMove={(delta) => {
        const next = rows[cursorStep(at, delta, rows.length)]
        if (next) setCursor(next.item.id)
      }}
      onEnter={(keepOpen) => load(target, keepOpen)}
      info={info}
      data-testid={testId}
    >
      <PickerSearch
        inputRef={searchRef}
        value={query}
        onChange={(value) => {
          setQuery(value)
          // A search starts on the first row it finds. Emptied again, the list is as it opened: on
          // what is on, not on the first row, which Return would load over it.
          setCursor(null)
        }}
        placeholder={placeholder ?? `Search ${label.toLowerCase()}`}
        label={placeholder ?? `Search ${label.toLowerCase()}`}
        hint={`Type part of a name. Up and down move, return ${lower}s.`}
        shown={searching ? found : items.length}
        total={items.length}
        controls={`${panelId}-list`}
        activeId={activeId}
        data-testid={testId ? `${testId}-search` : undefined}
      />
      {filters}
      <div
        id={`${panelId}-list`}
        role="listbox"
        aria-label={label}
        className="lm-picker__list"
        // A list that scrolls is a Tab stop of the browser's own making: the keys reach its rows from the search field.
        tabIndex={-1}
        data-testid={testId ? `${testId}-list` : undefined}
        {...infoProps(
          label,
          'With a search typed the rows it found lead and the rest follow dimmed. A press puts the cursor on a row; a double press picks it.',
        )}
      >
        {rows.map((row, index) => {
          const { item } = row
          const selected = index === at
          const on = item.id === current
          const head =
            grouped && item.group !== undefined && item.group !== rows[index - 1]?.item.group ? (
              <PickerGroup
                key={`head-${item.group}`}
                label={item.group}
                count={groupCount(item.group)}
              />
            ) : null
          return [
            head,
            <div
              key={`row-${item.id}`}
              id={rowId(index)}
              role="option"
              aria-selected={selected}
              title={
                item.detail
                  ? `${item.name}: ${item.detail}`
                  : `${item.name}. Click to pick it, double-click to ${lower} it.`
              }
              onClick={() => setCursor(item.id)}
              onDoubleClick={(event) => {
                if (!(event.target as HTMLElement).closest('button')) load(row, false)
              }}
              className={cx(
                'lm-picker__row',
                selected && 'lm-picker__row--cursor',
                on && 'lm-picker__row--on',
                !row.match && 'lm-picker__row--dim',
              )}
              data-testid={testId ? `${testId}-row-${pickSlug(item.id)}` : undefined}
              {...(rowInfo?.(item, { current: on, cursor: selected, match: row.match }) ??
                infoProps(
                  item.name,
                  infoText(
                    item.detail,
                    on
                      ? `${item.name} is on now.`
                      : selected
                        ? `The cursor is on ${item.name}: Return ${lower}s it and closes the list. A double press does the same.`
                        : `A press puts the cursor on ${item.name}. A double press ${lower}s it and closes the list.`,
                    !row.match && 'Dimmed: the search did not find it.',
                  ),
                ))}
              {...rowProps?.(item)}
            >
              <span className="lm-picker__name">
                <Highlight text={item.name} query={query} />
              </span>
              {item.detail ? <span className="lm-picker__detail">{item.detail}</span> : null}
              {on ? <span className="lm-picker__on">on now</span> : null}
              {rowTools?.(item)}
            </div>,
          ]
        })}
        {rows.length === 0 ? (
          <p
            className="lm-picker__empty"
            data-testid={testId ? `${testId}-empty` : undefined}
            {...infoProps('Nothing listed', 'There is nothing to pick from here.')}
          >
            Nothing to pick from.
          </p>
        ) : null}
      </div>
      <div className="lm-picker__foot">
        <p
          className="lm-picker__hint"
          {...infoProps(
            'Keys of the list',
            `Up and Down move the cursor a row, Page Up and Page Down a page. Return ${lower}s what it is on and closes the list; with Shift held the list stays open, to try one after another. A letter typed anywhere goes to the search, Tab goes round the controls of the list, and Escape closes the list.`,
          )}
        >
          <span>Up and down move, return {lower}s.</span>
        </p>
        <PickerAction
          onClick={() => load(target, false)}
          disabled={!target || target.item.id === current}
          title={
            target
              ? target.item.id === current
                ? `${target.item.name} is on already`
                : `${verb} ${target.item.name} and close this`
              : `Nothing to ${lower}`
          }
          data-testid={testId ? `${testId}-action` : undefined}
          info={infoProps(
            verb,
            target
              ? target.item.id === current
                ? `${target.item.name} is on already, so there is nothing to ${lower}. Move the cursor to another row.`
                : `${verb}s ${target.item.name} and closes the list. Return does the same; with Shift held the list stays open.`
              : rows.length > 0
                ? `The search found nothing, so there is nothing to ${lower}. Up or Down puts the cursor on one of the dimmed rows.`
                : `Nothing is listed, so there is nothing to ${lower}.`,
          )}
        >
          {target
            ? target.item.id === current
              ? `${currentVerb} ${target.item.name}`
              : `${verb} ${target.item.name}`
            : `Nothing to ${lower}`}
        </PickerAction>
      </div>
    </PickerPanel>
  )
}

export interface PickCellProps<T extends PickItem = PickItem> extends Omit<
  PickListProps<T>,
  'open' | 'anchorRef' | 'onClose' | 'onPick' | 'data-testid'
> {
  /** What the cell says: "Add effect", or the name of what is on. */
  children: ReactNode
  /** The cell's tooltip. */
  title?: string
  onPick: (item: T, keepOpen: boolean) => void
  disabled?: boolean
  className?: string
  /** More attributes for the cell's button: an app's own marks on it. */
  cellProps?: HTMLAttributes<HTMLButtonElement> & Record<`data-${string}`, string>
  /** The cell's entry in the info view. */
  cellInfo?: InfoProps
  /** The cell's test id; its list is `<id>-list` with the parts of a `PickList`. */
  'data-testid'?: string
}

/** A cell that opens a `PickList` off itself: the cell of an Add effect or of a strip's chains. */
export function PickCell<T extends PickItem = PickItem>({
  children,
  title,
  onPick,
  disabled = false,
  className,
  cellProps,
  cellInfo,
  'data-testid': testId,
  ...list
}: PickCellProps<T>) {
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={title}
        onClick={() => setOpen((was) => !was)}
        className={cx('lm-pick-cell', open && 'lm-pick-cell--open', className)}
        data-testid={testId}
        {...(cellInfo ??
          infoProps(
            null,
            infoText(title, 'Opens a list to search and pick from. A second press closes it.'),
          ))}
        {...cellProps}
      >
        <span className="lm-pick-cell__label">{children}</span>
        <Glyph d={PICK_CHEVRON_DOWN} />
      </button>
      <PickList
        {...list}
        open={open}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
        onPick={onPick}
        data-testid={testId ? `${testId}-list` : undefined}
      />
    </>
  )
}
