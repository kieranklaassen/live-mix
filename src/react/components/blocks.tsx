// The parts a block of a bar is laid out with: the places of a surface, the
// head of a block that was gone into, a list of things to go into, the one
// sentence a block says and its one main action, choices, the layout of a
// block's body, a card and a chip, a sheet that stays mounted while it is
// closed, and the groups of a bar that is one row tall. Moved from Ambient
// Live, whose bottom bar is built from them.
// Presentational: the host owns what is chosen and what a press
// does. Each part passes what it is not told about to its element:
// `infoProps`, a `data-testid`, a `title`.

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ForwardedRef,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
} from 'react'

import { cx } from './tokens'

type ButtonRest = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'children' | 'onChange'>
type DivRest = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'>
/** `data-*` attributes pass through the parts as they do through an element. */
type DataRest = Record<`data-${string}`, string | number | boolean | undefined>

const GLYPH = {
  width: 12,
  height: 12,
  viewBox: '0 0 12 12',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

export interface ChevronProps {
  back?: boolean
  className?: string
}

/** A chevron: forward for "goes in", back for the way out. */
export function Chevron({ back = false, className }: ChevronProps) {
  return (
    <svg {...GLYPH} className={cx('lm-chevron', className)}>
      <path d={back ? 'M7.5 2.5L4 6L7.5 9.5' : 'M4.5 2.5L8 6L4.5 9.5'} />
    </svg>
  )
}

export interface StarProps {
  on?: boolean
  className?: string
}

/** A star, filled when on. */
export function Star({ on = false, className }: StarProps) {
  return (
    <svg {...GLYPH} className={cx('lm-star', className)} data-on={on || undefined}>
      <path
        d="M6 1.2L7.5 4.2L10.8 4.7L8.4 7L9 10.3L6 8.7L3 10.3L3.6 7L1.2 4.7L4.5 4.2Z"
        fill={on ? 'currentColor' : 'none'}
      />
    </svg>
  )
}

// --- Places ------------------------------------------------------------------

export interface PlaceItem<T extends string> {
  id: T
  name: string
  /** One short line under the name: what the place holds now. */
  note?: ReactNode
  icon?: ReactNode
  /** A thin level at the cell's edge, as a meter the caller draws. */
  level?: ReactNode
  /** What the cell's button is given besides: `infoProps`, a `data-testid`, a `title`. */
  props?: ButtonRest & DataRest
}

export type PlacesProps<T extends string> = {
  items: readonly PlaceItem<T>[]
  /** The place in view; null when the surface shows something that is none of them. */
  value: T | null
  onChange: (id: T) => void
  /** The accessible name of the group. */
  label: string
  across?: boolean
} & Omit<HTMLAttributes<HTMLElement>, 'children' | 'onChange'>

/**
 * The places of a surface as cells that are always there, the one in view filled with the accent:
 * a column sharing the height it is given, or a row of words (`across`) where there is one row.
 */
export function Places<T extends string>({
  items,
  value,
  onChange,
  label,
  across = false,
  className,
  ...rest
}: PlacesProps<T>) {
  return (
    <nav
      {...rest}
      aria-label={label}
      className={cx('lm-places', className)}
      data-across={across || undefined}
    >
      {items.map(({ id, name, note, icon, level, props }) => (
        <button
          {...props}
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={cx('lm-place', props?.className)}
        >
          {icon}
          <span className="lm-place__words">
            <span className="lm-place__name">{name}</span>
            {note !== undefined && <span className="lm-place__note">{note}</span>}
          </span>
          {level !== undefined && (
            <span className="lm-place__level" aria-hidden="true">
              {level}
            </span>
          )}
        </button>
      ))}
    </nav>
  )
}

// --- A block's head, a list that goes in -------------------------------------

export type BlockHeadProps = {
  /** The way back: its word, what a press does, and what its button is given besides. */
  back?: { label: string; onClick: () => void; props?: ButtonRest & DataRest }
  title: ReactNode
  state?: ReactNode
  on?: boolean
  /** Between the title and the state. */
  children?: ReactNode
} & DivRest

/**
 * The first row inside a block that was gone into: the way back out, what this is, and at the
 * right its state in words, with a lamp that is lit while it is at work.
 */
export function BlockHead({
  back,
  title,
  state,
  on = false,
  children,
  className,
  ...rest
}: BlockHeadProps) {
  return (
    <div {...rest} className={cx('lm-block-head', className)}>
      {back && (
        <button
          {...back.props}
          type="button"
          onClick={back.onClick}
          className={cx('lm-block-head__back', back.props?.className)}
        >
          <Chevron back />
          {back.label}
        </button>
      )}
      <span className="lm-block-head__title">{title}</span>
      <span className="lm-block-head__rest">{children}</span>
      {state !== undefined && <State on={on}>{state}</State>}
    </div>
  )
}

export type StateProps = { on?: boolean } & HTMLAttributes<HTMLSpanElement>

/**
 * A block's state in words, with a lamp that is lit while it is at work: the right end of a
 * `BlockHead`, and by itself where a block's head is a frame's own title bar.
 */
export function State({ on = false, children, className, ...rest }: StateProps) {
  return (
    <span {...rest} className={cx('lm-block-head__state', className)} data-on={on || undefined}>
      <i aria-hidden="true" />
      {children}
    </span>
  )
}

export type ListRowProps = {
  icon?: ReactNode
  name: ReactNode
  line?: ReactNode
  /** Said at the right while the thing is at work; with it the row is lifted. */
  mark?: ReactNode
} & ButtonRest

/** One row of a list of things to go into: an icon, a name, one line of what it is, a mark while it is at work. */
export function ListRow({ icon, name, line, mark, className, ...rest }: ListRowProps) {
  return (
    <button
      {...rest}
      type="button"
      className={cx('lm-list-row', className)}
      data-marked={mark ? '' : undefined}
    >
      {icon !== undefined && <span className="lm-list-row__icon">{icon}</span>}
      <span className="lm-list-row__words">
        <span className="lm-list-row__name">{name}</span>
        {line !== undefined && <span className="lm-list-row__line">{line}</span>}
      </span>
      {mark && (
        <span className="lm-list-row__mark">
          <i aria-hidden="true" />
          {mark}
        </span>
      )}
      <Chevron className="lm-list-row__go" />
    </button>
  )
}

// --- What a block says, and its one main action ------------------------------

export type SaysProps = HTMLAttributes<HTMLParagraphElement>

/** The one sentence at the top of a block: what it does, in plain words. */
export function Says({ children, className, ...rest }: SaysProps) {
  return (
    <p {...rest} className={cx('lm-says', className)}>
      {children}
    </p>
  )
}

export type MainActionProps = {
  icon?: ReactNode
  tone?: 'fill' | 'line'
  small?: boolean
  children: ReactNode
} & ButtonRest

/**
 * The one large action of a block: filled before it is taken, in line while it runs (Stop).
 * `small` is an action on a row among choices, as tall as they are.
 */
export function MainAction({
  icon,
  tone = 'fill',
  small = false,
  children,
  className,
  ...rest
}: MainActionProps) {
  return (
    <button
      {...rest}
      type="button"
      className={cx('lm-main-action', className)}
      data-tone={tone}
      data-small={small || undefined}
    >
      {icon}
      {children}
    </button>
  )
}

export type PlainActionProps = {
  icon?: ReactNode
  on?: boolean
  children?: ReactNode
} & ButtonRest

/**
 * A small button that does one plain thing: an icon, a word. Beside a main action, never in place of one.
 * With no word it is its icon alone, and the caller names it (`aria-label`). `on` lights it while
 * what it starts goes on, and so does `aria-busy` while what it started is under way.
 */
export const PlainAction = forwardRef<HTMLButtonElement, PlainActionProps>(function PlainAction(
  { icon, on = false, children, className, ...rest },
  ref,
) {
  const alone = children === undefined || children === null
  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      className={cx('lm-plain-action', className)}
      data-on={on || undefined}
      data-alone={alone || undefined}
    >
      {icon}
      {children}
    </button>
  )
})

// --- Choices -----------------------------------------------------------------

export interface ChoiceOption<T extends string | number> {
  value: T
  label: ReactNode
  disabled?: boolean
  /** What the option's button is given besides: `infoProps`, a `data-testid`, a `title`. */
  props?: ButtonRest & DataRest
}

export type ChoiceProps<T extends string | number> = {
  options: readonly ChoiceOption<T>[]
  value: T | null
  onChange: (value: T) => void
  /** The accessible name of the group. */
  label: string
  disabled?: boolean
  fill?: boolean
  tall?: boolean
  wrap?: boolean
} & DivRest

/**
 * One of a few, side by side in one frame: the chosen one filled. With `fill` the frame takes the
 * width it is given and the options share it; `tall` options hold two lines, a name over a mark.
 * With `wrap` each option is as wide as its words and they go on to a second row where one is
 * too narrow for them, so no word is cut.
 */
export function Choice<T extends string | number>({
  options,
  value,
  onChange,
  label,
  disabled = false,
  fill = false,
  tall = false,
  wrap = false,
  className,
  ...rest
}: ChoiceProps<T>) {
  return (
    <div
      {...rest}
      role="group"
      aria-label={label}
      className={cx('lm-choice', className)}
      data-fill={fill || undefined}
      data-tall={tall || undefined}
      data-wrap={wrap || undefined}
    >
      {options.map((option) => (
        <button
          {...option.props}
          key={String(option.value)}
          type="button"
          aria-pressed={option.value === value}
          disabled={disabled || option.disabled}
          onClick={() => onChange(option.value)}
          className={cx('lm-choice__option', option.props?.className)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export type DropdownProps = {
  /** The accessible name of the picker. */
  label: string
} & SelectHTMLAttributes<HTMLSelectElement>

/**
 * One of a list too long to lay side by side: the platform's own select in the frame a `Choice`
 * has, given its options as children and told of a pick the select's own way.
 */
export function Dropdown({ label, children, className, ...rest }: DropdownProps) {
  return (
    <select {...rest} aria-label={label} className={cx('lm-dropdown', className)}>
      {children}
    </select>
  )
}

export type DropdownButtonProps = {
  children: ReactNode
} & ButtonRest

/**
 * The frame of a `Dropdown` over a list of the caller's own: a button that says what is picked,
 * and a press opens the list. The caller says whether it is open (`aria-expanded`).
 */
export const DropdownButton = forwardRef<HTMLButtonElement, DropdownButtonProps>(
  function DropdownButton({ children, className, ...rest }, ref) {
    return (
      <button {...rest} ref={ref} type="button" className={cx('lm-dropdown', className)}>
        {children}
      </button>
    )
  },
)

export interface ChoiceListOption<T extends string | number> {
  value: T
  name: ReactNode
  /** One sentence under the name: what the choice does. */
  line?: ReactNode
  /** What the option's button is given besides: `infoProps`, a `data-testid`, a `title`. */
  props?: ButtonRest & DataRest
}

export type ChoiceListProps<T extends string | number> = {
  options: readonly ChoiceListOption<T>[]
  value: T | null
  onChange: (value: T) => void
  /** The accessible name of the group. */
  label: string
} & DivRest

function ChoiceListInner<T extends string | number>(
  { options, value, onChange, label, className, ...rest }: ChoiceListProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  // The Tab key stops on the picked row, or on the first while none is: a row that is off is passed over.
  const on = options.filter((option) => !option.props?.disabled)
  const stop = options.indexOf(on.find((option) => option.value === value) ?? on[0] ?? options[0])
  return (
    <div
      {...rest}
      ref={ref}
      role="radiogroup"
      aria-label={label}
      className={cx('lm-choice-list', className)}
      onKeyDown={(event) => {
        rest.onKeyDown?.(event)
        const rows = [
          ...event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]:not(:disabled)'),
        ]
        const at = rows.indexOf(event.target as HTMLElement)
        const held = event.shiftKey || event.altKey || event.ctrlKey || event.metaKey
        if (event.defaultPrevented || held || at < 0) return
        const to =
          event.key === 'ArrowDown'
            ? Math.min(at + 1, rows.length - 1)
            : event.key === 'ArrowUp'
              ? Math.max(at - 1, 0)
              : event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? rows.length - 1
                  : -1
        if (to < 0) return
        // The keys are the list's: a panel around it has nothing left to do with them.
        event.preventDefault()
        event.stopPropagation()
        rows[to]?.focus()
      }}
    >
      {options.map((option, index) => (
        <button
          {...option.props}
          key={String(option.value)}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          tabIndex={index === stop ? 0 : -1}
          onClick={() => onChange(option.value)}
          className={cx('lm-choice-list__option', option.props?.className)}
        >
          <i className="lm-choice-list__ring" aria-hidden="true" />
          <span className="lm-choice-list__words">
            <span className="lm-choice-list__name">{option.name}</span>
            {option.line !== undefined && (
              <span className="lm-choice-list__line">{option.line}</span>
            )}
          </span>
        </button>
      ))}
    </div>
  )
}

/**
 * One of a few, each on a row of a list with a sentence under its name: the picked one has its
 * ring filled. For a choice whose options need saying what they do. The arrow keys, Home and End
 * move among the rows, and a press picks.
 */
export const ChoiceList = forwardRef(ChoiceListInner) as <T extends string | number>(
  props: ChoiceListProps<T> & { ref?: Ref<HTMLDivElement> },
) => ReactElement

export type TickProps = {
  on: boolean
  onChange: (on: boolean) => void
  children: ReactNode
} & ButtonRest

/** A thing that is on or off, as a box with its word: the box fills when on. */
export function Tick({ on, onChange, children, className, ...rest }: TickProps) {
  return (
    <button
      {...rest}
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={cx('lm-tick', className)}
    >
      <i aria-hidden="true" />
      {children}
    </button>
  )
}

export type PillProps = { on?: boolean } & HTMLAttributes<HTMLSpanElement>

/** A word in a ring that says whether a thing is there: lit when it is. Not a control. */
export function Pill({ on = false, children, className, ...rest }: PillProps) {
  return (
    <span {...rest} className={cx('lm-pill', className)} data-on={on || undefined}>
      <i aria-hidden="true" />
      {children}
    </span>
  )
}

export type TallyProps = HTMLAttributes<HTMLSpanElement>

/** How many of a thing, in the figures' face beside its name. Not a control. */
export function Tally({ children, className, ...rest }: TallyProps) {
  return (
    <span {...rest} className={cx('lm-tally', className)}>
      {children}
    </span>
  )
}

export type SearchFieldProps = {
  /** The accessible name of the field. */
  label: string
  found?: ReactNode
  onClear?: () => void
  /** What the cross is given besides: `infoProps`, a `data-testid`, a `title`. */
  clearProps?: ButtonRest & DataRest
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'>

/**
 * The field a list is searched with: a magnifier, the field, and at its end what the search found
 * (`found`) and, with `onClear`, a cross that empties it. The magnifier is lit while something is
 * typed. What it is not told about goes to the field itself.
 */
export function SearchField({
  label,
  found,
  onClear,
  clearProps,
  className,
  ...rest
}: SearchFieldProps) {
  const typed = rest.value !== undefined && rest.value !== ''
  return (
    <span className={cx('lm-search-field', className)} data-typed={typed || undefined}>
      <svg {...GLYPH} className="lm-search-field__glass">
        <circle cx="5" cy="5" r="3.2" />
        <path d="M7.4 7.4L10.4 10.4" />
      </svg>
      <input
        {...rest}
        type="text"
        role="searchbox"
        aria-label={label}
        className="lm-search-field__field"
      />
      {found}
      {onClear && (
        <button
          aria-label="Clear the search"
          {...clearProps}
          type="button"
          onClick={onClear}
          className={cx('lm-search-field__clear', clearProps?.className)}
        >
          <svg {...GLYPH} width={10} height={10}>
            <path d="M3 3L9 9M9 3L3 9" />
          </svg>
        </button>
      )}
    </span>
  )
}

// --- Layout of a block's body ------------------------------------------------

export type GroupProps = {
  name: ReactNode
  note?: ReactNode
  beside?: boolean
  children: ReactNode
} & DivRest

/**
 * A named group of a block: its name in small capitals over what belongs to it. With `beside`
 * the name stands beside it where the room is low (`Room`). A `note` is one line at the end of
 * the name's row: what the group holds now.
 */
export function Group({ name, note, beside = false, children, className, ...rest }: GroupProps) {
  const id = useId()
  const named = (
    <span id={id} className="lm-group__name">
      {name}
    </span>
  )
  return (
    <div
      {...rest}
      role="group"
      aria-labelledby={id}
      className={cx('lm-group', className)}
      data-beside={beside || undefined}
    >
      {note === undefined ? (
        named
      ) : (
        <span className="lm-group__head">
          {named}
          <span className="lm-group__note">{note}</span>
        </span>
      )}
      {children}
    </div>
  )
}

export type BarGroupProps = {
  name: ReactNode
  bare?: boolean
  low?: boolean
  ruled?: boolean
  children: ReactNode
} & DivRest

/**
 * A named group of a bar that is one row tall: its name in small capitals beside what belongs to
 * it, and the parts in it as low as the row, 16 px; `low`, 14 px, in a bar whose row keeps its
 * edges for a bevel. `bare` leaves the name undrawn where the bar has no room for it: it names
 * the group all the same. `ruled` draws a rule before it, in a bar whose groups stand on one ground.
 */
export function BarGroup({
  name,
  bare = false,
  low = false,
  ruled = false,
  children,
  className,
  ...rest
}: BarGroupProps) {
  const id = useId()
  return (
    <div
      {...rest}
      role="group"
      aria-labelledby={id}
      className={cx('lm-bar-group', className)}
      data-bare={bare || undefined}
      data-low={low || undefined}
      data-ruled={ruled || undefined}
    >
      <span id={id} className="lm-bar-group__name">
        {name}
      </span>
      {children}
    </div>
  )
}

export type JoinedProps = { children: ReactNode } & DivRest

/** The class of a surface worked with a finger: the parts in it take a finger's size (`Room`'s `finger`, or the class by itself). */
export const FINGER = 'lm-finger'

/**
 * Parts that are one control, in one frame with a rule between them: a thing and the picker of
 * what it works on, a count between its two steps.
 */
export function Joined({ children, className, ...rest }: JoinedProps) {
  return (
    <div {...rest} className={cx('lm-joined', className)}>
      {children}
    </div>
  )
}

export type RoomProps = { finger?: boolean; children: ReactNode } & DivRest

/**
 * The body of a block that tells the parts in it how much room there is: a main action, a card,
 * a tall choice and a group with its name `beside` are drawn lower where the bar is low, and a
 * card closer on a phone. A block lays out what is its own by the same container, `lm-room`.
 * With `finger` the parts in it are a finger's size: a main action 40 px tall, and nothing that
 * is pressed narrower than 40 px.
 */
export function Room({ finger = false, children, className, ...rest }: RoomProps) {
  return (
    <div {...rest} className={cx('lm-room', finger && FINGER, className)}>
      {children}
    </div>
  )
}

export type RowProps = {
  name: ReactNode
  hint?: ReactNode
  children: ReactNode
} & DivRest

/**
 * One choice of a block on one row: its name at the left, the control, and a hint of what it means.
 * Its class is `lm-block-row`: `lm-row` is the kit's channel row, a cell tall with a rule under it.
 */
export function Row({ name, hint, children, className, ...rest }: RowProps) {
  return (
    <div {...rest} className={cx('lm-block-row', className)}>
      <span className="lm-block-row__name">{name}</span>
      {children}
      {hint !== undefined && <span className="lm-block-row__hint">{hint}</span>}
    </div>
  )
}

export type HintProps = HTMLAttributes<HTMLSpanElement>

/** A short line of help beside or under a control. */
export function Hint({ children, className, ...rest }: HintProps) {
  return (
    <span {...rest} className={cx('lm-hint', className)}>
      {children}
    </span>
  )
}

export type FigureProps = {
  unit?: ReactNode
  chars?: number
  children: ReactNode
} & HTMLAttributes<HTMLSpanElement>

/**
 * A number in a frame with what it is counted in: the caller's own field or a readout, and its
 * unit after it. `chars` is how many figures a field shows.
 */
export function Figure({ unit, chars, children, className, style, ...rest }: FigureProps) {
  const shown =
    chars === undefined ? style : ({ ...style, '--lm-figure-chars': chars } as CSSProperties)
  return (
    <span {...rest} className={cx('lm-figure', className)} style={shown}>
      {children}
      {unit !== undefined && <span className="lm-figure__unit">{unit}</span>}
    </span>
  )
}

export type WellProps = { caption?: ReactNode; children?: ReactNode } & DivRest

/** The sunken room of a block where what it hears is drawn; while idle its caption says what will show. */
export function Well({ caption, children, className, ...rest }: WellProps) {
  return (
    <div {...rest} className={cx('lm-well lm-block-well', className)}>
      {children}
      {caption !== undefined && <span className="lm-block-well__caption">{caption}</span>}
    </div>
  )
}

// --- Cards and chips ---------------------------------------------------------

export type CardProps = {
  picked?: boolean
  /** At work now: sounding, playing, running. */
  active?: boolean
  /** A press goes into the thing: the card has no picked state to tell. */
  goes?: boolean
  /** The thing is not there yet. */
  yet?: boolean
  progress?: number
  /** A CSS colour for a band along the card's upper edge: the colour the thing has elsewhere. */
  hue?: string
  /** A thin level at the card's edge, as a meter the caller draws. */
  level?: ReactNode
  children: ReactNode
} & ButtonRest

/**
 * One of a few things in a row that can be picked, such as a chord of a loop. The picked one has
 * the accent's frame; the one at work shows how far along it is on its lower edge
 * (`progress`, 0 to 1, or left to the caller as the `--lm-card-progress` variable on the card,
 * which `ref` reaches). A card that `goes` into its thing is not picked or unpicked: a press
 * leaves the row. One for a thing that is not there `yet` has a dashed frame.
 */
export const Card = forwardRef<HTMLButtonElement, CardProps>(function Card(
  {
    picked = false,
    active = false,
    goes = false,
    yet = false,
    progress,
    hue,
    level,
    children,
    className,
    style,
    ...rest
  },
  ref,
) {
  const shown =
    progress === undefined ? style : ({ ...style, '--lm-card-progress': progress } as CSSProperties)
  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      aria-pressed={goes ? undefined : picked}
      className={cx('lm-card', className)}
      style={shown}
      data-active={active || undefined}
      data-goes={goes || undefined}
      data-yet={yet || undefined}
      data-level={level !== undefined || undefined}
    >
      {hue !== undefined && (
        <i className="lm-card__hue" aria-hidden="true" style={{ background: hue }} />
      )}
      {children}
      {level !== undefined && (
        <span className="lm-card__level" aria-hidden="true">
          {level}
        </span>
      )}
      {active && <i className="lm-card__progress" aria-hidden="true" />}
    </button>
  )
})

export type StepProps = {
  icon?: ReactNode
  /** Its place among the steps; left out, a frame that stands by itself. */
  number?: number
  name: ReactNode
  line?: ReactNode
  foot?: ReactNode
  /** Between the line and the foot. */
  children?: ReactNode
} & DivRest

/**
 * One step of a few toward a thing that is not there yet, in a dashed frame: its number, its name,
 * a line of what to do and a foot that says where. Words, not a control.
 */
export function Step({ icon, number, name, line, foot, children, className, ...rest }: StepProps) {
  return (
    <div {...rest} className={cx('lm-step', className)}>
      <span className="lm-step__head">
        {icon !== undefined && (
          <span className="lm-step__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        {number !== undefined && <span className="lm-step__number">{number}</span>}
        <span className="lm-step__name">{name}</span>
      </span>
      {line !== undefined && <span className="lm-step__line">{line}</span>}
      {children}
      {foot !== undefined && <span className="lm-step__foot">{foot}</span>}
    </div>
  )
}

export type NamedChipProps = {
  /** A CSS colour for the mark at the chip's left. */
  swatch?: string
  starred?: boolean
  count?: ReactNode
  on?: boolean
  children: ReactNode
} & ButtonRest

/**
 * A small named thing to press: a swatch of its colour, its name, and a star when it is a starred
 * one. A `count` stands at its end, how many it holds; told `on` or not, it is a thing that is on
 * or off, and it fills while on.
 */
export function NamedChip({
  swatch,
  starred = false,
  count,
  on,
  children,
  className,
  ...rest
}: NamedChipProps) {
  return (
    <button aria-pressed={on} {...rest} type="button" className={cx('lm-named-chip', className)}>
      {swatch !== undefined && (
        <i className="lm-named-chip__swatch" aria-hidden="true" style={{ background: swatch }} />
      )}
      <span className="lm-named-chip__name">{children}</span>
      {count !== undefined && <span className="lm-named-chip__count">{count}</span>}
      {starred && <Star on className="lm-named-chip__star" />}
    </button>
  )
}

export type OfferProps = {
  name: ReactNode
  /** At the end of the name's row: a choice the new thing is made with. */
  beside?: ReactNode
  line?: ReactNode
  children?: ReactNode
} & DivRest

/**
 * An offer to make something new, set apart from what stands around it by a dashed frame: a plus
 * and its name, beside the name what the new thing is made on, one sentence on what a press
 * makes, and under it the ways to take it.
 */
export function Offer({ name, beside, line, children, className, ...rest }: OfferProps) {
  const id = useId()
  return (
    <div {...rest} role="group" aria-labelledby={id} className={cx('lm-offer', className)}>
      <div className="lm-offer__head">
        <svg {...GLYPH} className="lm-offer__plus">
          <path d="M6 2v8M2 6h8" />
        </svg>
        <span id={id} className="lm-offer__name">
          {name}
        </span>
        {beside !== undefined && <span className="lm-offer__beside">{beside}</span>}
      </div>
      {line !== undefined && <p className="lm-offer__line">{line}</p>}
      {children}
    </div>
  )
}

// --- KeptSheet ---------------------------------------------------------------

/** What the Tab key can reach inside a sheet. */
const TABBABLE = 'a[href], button, input, select, textarea, [tabindex]'

export type KeptSheetProps = {
  open: boolean
  onClose: () => void
  title: ReactNode
  /** One line along the sheet's foot. */
  foot?: ReactNode
  children: ReactNode
  /** What the Close button is given besides: `infoProps`, a `data-testid`. */
  closeProps?: ButtonRest & DataRest
} & DivRest

/**
 * A sheet over the page for what is set up once and then left: it stays mounted while closed
 * (`hidden`), so what lives in it goes on working. Escape and a press beside it close it, and the
 * Tab key stays inside it while it is open. Put it where nothing of the page stacks over it.
 * `Sheet` is the other one: there while it is mounted, for one thing to settle.
 */
export function KeptSheet({
  open,
  onClose,
  title,
  foot,
  children,
  className,
  closeProps,
  ...rest
}: KeptSheetProps) {
  const id = useId()
  const sheet = useRef<HTMLDivElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  const closing = useRef(onClose)
  useEffect(() => {
    closing.current = onClose
  }, [onClose])
  // The focus goes into the sheet as it opens, and back to where it was as it closes.
  useEffect(() => {
    if (!open) return
    const before = document.activeElement
    close.current?.focus()
    return () => {
      if (before instanceof HTMLElement && before.isConnected) before.focus()
    }
  }, [open])
  // Heard before the page hears it: Escape is the sheet's while it is open, and Tab goes round inside it.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.isComposing) return
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        closing.current()
        return
      }
      if (event.key !== 'Tab' || !sheet.current) return
      const stops = [...sheet.current.querySelectorAll<HTMLElement>(TABBABLE)].filter(
        (stop) =>
          stop.tabIndex >= 0 &&
          !(stop as HTMLButtonElement).disabled &&
          stop.closest('[hidden]') === null,
      )
      const first = stops[0]
      const last = stops[stops.length - 1]
      if (!first || !last) return
      const at = document.activeElement
      const outside = !sheet.current.contains(at)
      if (event.shiftKey ? outside || at === first : outside || at === last) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open])
  return (
    <div
      className="lm-kept-sheet-ground"
      role="presentation"
      hidden={!open}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        {...rest}
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className={cx('lm-kept-sheet', className)}
      >
        <div className="lm-kept-sheet__head">
          <h2 id={id} className="lm-kept-sheet__title">
            {title}
          </h2>
          <button
            {...closeProps}
            ref={close}
            type="button"
            onClick={onClose}
            className={cx('lm-kept-sheet__close', closeProps?.className)}
          >
            Close
          </button>
        </div>
        <div className="lm-kept-sheet__body">{children}</div>
        {foot !== undefined && <div className="lm-kept-sheet__foot">{foot}</div>}
      </div>
    </div>
  )
}

export type SheetPartProps = {
  name: ReactNode
  /** A word or two after the name: whether the thing is there, lit when it is. */
  state?: ReactNode
  on?: boolean
  line?: ReactNode
  children?: ReactNode
} & DivRest

/** One part of a sheet: its name, whether it is there, a line of what it is, and under them its controls. */
export function SheetPart({
  name,
  state,
  on = false,
  line,
  children,
  className,
  ...rest
}: SheetPartProps) {
  const id = useId()
  return (
    <div {...rest} role="group" aria-labelledby={id} className={cx('lm-sheet-part', className)}>
      <div className="lm-sheet-part__head">
        <h3 id={id} className="lm-sheet-part__name">
          {name}
        </h3>
        {state !== undefined && (
          <span className="lm-sheet-part__state" data-on={on || undefined}>
            {state}
          </span>
        )}
      </div>
      {line !== undefined && <p className="lm-sheet-part__line">{line}</p>}
      {children}
    </div>
  )
}
