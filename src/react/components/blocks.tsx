// The parts a block of a bar is laid out with: the places of a surface, the
// head of a block that was gone into, a list of things to go into, the one
// sentence a block says and its one main action, choices, the layout of a
// block's body, and a card. Moved from Ambient Live, whose bottom bar is built
// from them. Presentational: the host owns what is chosen and what a press
// does. Each part passes what it is not told about to its element:
// `infoProps`, a `data-testid`, a `title`.

import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
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
  children: ReactNode
} & ButtonRest

/** A small button that does one plain thing: an icon, a word. Beside a main action, never in place of one. */
export function PlainAction({ icon, children, className, ...rest }: PlainActionProps) {
  return (
    <button {...rest} type="button" className={cx('lm-plain-action', className)}>
      {icon}
      {children}
    </button>
  )
}

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
} & DivRest

/**
 * One of a few, side by side in one frame: the chosen one filled. With `fill` the frame takes the
 * width it is given and the options share it; `tall` options hold two lines, a name over a mark.
 */
export function Choice<T extends string | number>({
  options,
  value,
  onChange,
  label,
  disabled = false,
  fill = false,
  tall = false,
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

// --- Layout of a block's body ------------------------------------------------

export type GroupProps = {
  name: ReactNode
  beside?: boolean
  children: ReactNode
} & DivRest

/**
 * A named group of a block: its name in small capitals over what belongs to it. With `beside`
 * the name stands beside it where the room is low (`Room`).
 */
export function Group({ name, beside = false, children, className, ...rest }: GroupProps) {
  const id = useId()
  return (
    <div
      {...rest}
      role="group"
      aria-labelledby={id}
      className={cx('lm-group', className)}
      data-beside={beside || undefined}
    >
      <span id={id} className="lm-group__name">
        {name}
      </span>
      {children}
    </div>
  )
}

export type RoomProps = { children: ReactNode } & DivRest

/**
 * The body of a block that tells the parts in it how much room there is: a main action, a card,
 * a tall choice and a group with its name `beside` are drawn lower where the bar is low, and a
 * card closer on a phone. A block lays out what is its own by the same container, `lm-room`.
 */
export function Room({ children, className, ...rest }: RoomProps) {
  return (
    <div {...rest} className={cx('lm-room', className)}>
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

// --- Cards -------------------------------------------------------------------

export type CardProps = {
  picked?: boolean
  /** At work now: sounding, playing, running. */
  active?: boolean
  progress?: number
  children: ReactNode
} & ButtonRest

/**
 * One of a few things in a row that can be picked, such as a chord of a loop. The picked one has
 * the accent's frame; the one at work shows how far along it is on its lower edge
 * (`progress`, 0 to 1, or left to the caller as the `--lm-card-progress` variable on the card,
 * which `ref` reaches).
 */
export const Card = forwardRef<HTMLButtonElement, CardProps>(function Card(
  { picked = false, active = false, progress, children, className, style, ...rest },
  ref,
) {
  const shown =
    progress === undefined ? style : ({ ...style, '--lm-card-progress': progress } as CSSProperties)
  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      aria-pressed={picked}
      className={cx('lm-card', className)}
      style={shown}
      data-active={active || undefined}
    >
      {children}
      {active && <i className="lm-card__progress" aria-hidden="true" />}
    </button>
  )
})

// --- A part of a sheet -------------------------------------------------------

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
