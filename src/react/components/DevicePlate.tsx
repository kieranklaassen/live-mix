// A device as a plate: an object of its own in the chain, drawn from a skin
// (`device-skins.tsx`). The plate has the skin's colour and finish, a picture
// of what the device does under the knobs, and the knobs wear the skin's cap.
// A few knobs sit on the face; a cell opens the rest, and the plate widens by
// whole cells to hold them. The name is on a tag, and the lamp beside it is
// the power switch. It is the same device as in `DevicePanel`: every knob,
// the presets and the readings are there, with the same info text. A device
// with a window of its own (a hosted plug-in) has a cell that opens it.
//
// A skin with a display (`plate-display.ts`) has a canvas in the picture's
// place that shows what the device is doing while it does it: under the row
// of knobs (`strip`), or beside two rows of them (`window`). The column at the
// right is the plate's own either way: the cell that opens the rest at its
// top, the chain's tools at its foot.

import {
  memo,
  useEffect,
  useId,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'

import {
  type Device,
  isEditorDevice,
  isMeteredDevice,
  isParamTextDevice,
} from '../../core/devices/Device'
import { type DeviceRegistry } from '../../core/devices/registry'
import { normalizeParam } from '../../core/params'
import { useDevice } from '../hooks/useParam'
import { formatParamValue, isChoiceParam, paramStep, paramTaper } from './control-math'
import { DeviceMeterReadout, isBipolar, printedMeters } from './DevicePanel'
import {
  PLATE_PICTURE_HEIGHT,
  PLATE_PICTURE_WIDTH,
  PlateFinishLayer,
  isDarkPlate,
  type DeviceSkin,
  type PlatePicture,
} from './device-skins'
import { infoProps, infoText } from './info'
import { Knob, knobModulation } from './Knob'
import { paramInfo } from './param-info'
import {
  DISPLAY_STRIP_HEIGHT,
  DISPLAY_STRIP_WIDTH,
  DISPLAY_WINDOW_HEIGHT,
  displayWindowWidth,
  type PlateDisplay,
} from './plate-display'
import { PlateDisplayLayer } from './PlateDisplay'
import { DeviceToggle } from './Toggle'
import { cx } from './tokens'

/** The grid a plate sits on: a 20 px cell. */
const CELL = 20
const KNOB_SIZE = 30
/** A knob with its word: 48 px over a picture, 56 px on a plain plate, whose words are longer. */
const KNOB_COLUMN = 48
const PLAIN_KNOB_COLUMN = 56
/** Left of the first knob, and the column at the right that holds the cell opening the rest. */
const KNOBS_LEFT = 4
const MORE_COLUMN = 44
const FACE_PER_ROW = 4
/** A capital of a long word at the names' size, set close, in the widest face a theme has: px. */
const LETTER = 5.6
/** What the names' usual spacing adds to a letter, and what a name keeps clear at its two sides: px. */
const LETTER_APART = 0.32
const NAME_CLEAR = 4
/**
 * The letters a column holds at the names' usual spacing; a longer word is
 * set tighter, so none is cut short. Seven in a column of 48, eight in 56.
 */
const roomyLetters = (column: number): number =>
  Math.floor((column - NAME_CLEAR) / (LETTER + LETTER_APART))
/**
 * The least a plate with a strip is wide: as wide as one with a window, so a
 * chain of them is even, and its foot holds a preset's name beside its own.
 */
const STRIP_PLATE_LEAST = 280

const longestWord = (words: string): number =>
  Math.max(...words.split(/\s+/).map((word) => word.length))
/**
 * How far a name is narrowed to stand whole in its column: 1 for a word that
 * fits. The names on a plate stay one size; a long one gives up width alone.
 */
const squeeze = (words: string, column: number): number =>
  Math.min(1, column / (longestWord(words) * LETTER))
/** Opened, a pictured plate with more knobs than this lays them in two rows beside the picture. */
const ONE_ROW_MOST = 12

/**
 * An upright plate, as a pedal stands on a board: eleven cells wide and
 * fifteen high. The display is across the top, the knobs under it in two
 * rows, then the row of tools, the presets, and the name on the foot beside
 * the lamp.
 */
export const UPRIGHT_PLATE_WIDTH = 220
export const UPRIGHT_PLATE_HEIGHT = 300
const UPRIGHT_SIDE = 8
/** Two rows of knobs on a face with a display; four on a plain one. */
const UPRIGHT_ROWS = 2
const UPRIGHT_PLAIN_ROWS = 4
const UPRIGHT_FACE_PER_ROW = 4
/** A row of knobs under a display, and the closer rows of a plain plate. */
const UPRIGHT_ROW = 56
const UPRIGHT_PLAIN_ROW = 50
/** Up to four knobs stand two abreast and are larger, as on a pedal with few controls. */
const UPRIGHT_LARGE_KNOB = 36
const UPRIGHT_KNOBS_TOP = 110

/**
 * A spread plate (`spread`): an instrument, whose knobs are all played and so
 * all stand on the plate at once. Upright, the display keeps the window an
 * effect's has, at the top left, and the knobs fill the rest in columns as
 * wide as a pedal's: two rows beside the display, then two rows under it
 * across the whole plate. With C columns that is 4C - 8 knobs, so up to eight
 * knobs is exactly a pedal and more make the plate wider by whole cells.
 *
 * A skin whose knobs fall into sections (an oscillator, a filter, an envelope)
 * keeps each section together: a block two rows high, its knobs across the
 * top row and then the bottom, with one empty column between two blocks.
 */
const SPREAD_DISPLAY_COLUMNS = 4
/** A plate this many columns wide or wider may have a display twice as wide, where its skin asks for one. */
const SPREAD_WIDE_FROM = 9
/** The two rows beside the display share its height; the two under it are the kit's upright rows. */
const SPREAD_BESIDE_ROWS = 2
const SPREAD_BESIDE_ROW = 50
const SPREAD_UNDER_ROWS = 2
/** Beyond this many columns no plate is tried: 200 knobs in one section. */
const SPREAD_COLUMNS_MOST = 100

/** What a spread plate is told beyond that it is one. */
export interface PlateSpread {
  /** How many knobs each section has, in the order of the knobs; left out, the knobs are one run. */
  sections?: readonly number[]
  /** The skin asks for a display twice as wide; it gets one on a plate wide enough. */
  wide?: boolean
}

type SpreadCell = { row: number; column: number }

/**
 * Where the knobs of a spread plate go when the display takes `shown` columns:
 * the fewest columns that hold them, and each knob's cell. Sections fill the
 * room beside the display first and go under it from the first that does not
 * fit there.
 */
function spreadCells(
  knobs: number,
  sections: readonly number[] | undefined,
  shown: number,
): { columns: number; cells: SpreadCell[] } {
  if (!sections || sections.length === 0) {
    // One run: two rows of all but the display's columns, two rows of all.
    const columns = Math.max(
      shown,
      Math.ceil((knobs + SPREAD_BESIDE_ROWS * shown) / (SPREAD_BESIDE_ROWS + SPREAD_UNDER_ROWS)),
    )
    const beside = columns - shown
    const first = SPREAD_BESIDE_ROWS * beside
    const cells: SpreadCell[] = []
    for (let index = 0; index < knobs; index++) {
      cells.push(
        index < first
          ? { row: 1 + Math.floor(index / beside), column: shown + 1 + (index % beside) }
          : {
              row: SPREAD_BESIDE_ROWS + 1 + Math.floor((index - first) / columns),
              column: 1 + ((index - first) % columns),
            },
      )
    }
    return { columns, cells }
  }
  for (let columns = shown; columns <= SPREAD_COLUMNS_MOST; columns++) {
    const cells: SpreadCell[] = []
    // Where the next block starts, and whether the blocks have gone under the display.
    let under = false
    let at = shown + 1
    let fits = true
    for (const size of sections) {
      if (size <= 0) continue
      const wide = Math.ceil(size / 2)
      if (!under && at + wide - 1 > columns) {
        under = true
        at = 1
      }
      if (at + wide - 1 > columns) {
        fits = false
        break
      }
      const top = under ? SPREAD_BESIDE_ROWS + 1 : 1
      for (let knob = 0; knob < size; knob++) {
        cells.push({ row: top + Math.floor(knob / wide), column: at + (knob % wide) })
      }
      at += wide + 1
    }
    if (fits) return { columns, cells }
  }
  return spreadCells(knobs, undefined, shown)
}

/** Left of a display, and between a display and the knobs beside it. */
const DISPLAY_LEFT = 8
const DISPLAY_GAP = 4
/** Where a strip starts, under the row of knobs. */
const STRIP_TOP = 60

export interface PlateLayout {
  rows: number
  columns: number
  /** Width of one knob with its word, in px. */
  column: number
  /** Width of the plate in px: whole cells. */
  width: number
  /** Where the knobs start from the plate's left edge, in px. */
  knobsLeft: number
  /** Where the display stands and how large it is, in px; null for a plate without one. */
  display: { left: number; top: number; width: number; height: number } | null
  /** Set on an upright plate alone: its height, where its knobs start, a row's height and a knob's size, in px. */
  upright?: { height: number; knobsTop: number; row: number; knob: number }
  /**
   * Set on an upright spread plate with a display or a picture: how many of
   * its columns the display takes, the heights of its rows from the top in
   * px, and where a knob goes by its place in the order (row and column,
   * from 1).
   */
  spread?: {
    shown: number
    rowHeights: readonly number[]
    cell(index: number): { row: number; column: number }
  }
}

/**
 * Where so many knobs go. Over a picture they sit in one row above it, and
 * the plate widens with them; past twelve they take two rows and the picture
 * stands clear at the right. A plate without a picture always has two rows.
 *
 * With a display: a strip lies under one row of knobs and ends where they do,
 * so the column at the right stays the plate's own, on a plate never narrower
 * than one with a window (a face of four knobs shares that room); past twelve knobs they
 * take two rows and the strip stands beside them at the plate's full working
 * height. A window stands at the left and the knobs take two rows beside it.
 *
 * Upright, the plate is 220 by 300 whatever it shows: a display or a picture
 * across the top and the knobs in two rows under it, or four rows of knobs
 * from the top with neither. Opened past its face it widens by columns.
 */
export function plateLayout(
  knobs: number,
  pictured: boolean,
  display?: Pick<PlateDisplay, 'place' | 'columns'>,
  upright = false,
  spread: boolean | PlateSpread = false,
): PlateLayout {
  const cells = (px: number): number => Math.ceil(px / CELL) * CELL
  if (upright && spread && (display !== undefined || pictured)) {
    const shape: PlateSpread = spread === true ? {} : spread
    let shown = SPREAD_DISPLAY_COLUMNS
    let placed = spreadCells(knobs, shape.sections, shown)
    // A display twice as wide is for a plate that is wide already; the knobs are laid again around it.
    if (shape.wide && display !== undefined && placed.columns >= SPREAD_WIDE_FROM) {
      shown = 2 * SPREAD_DISPLAY_COLUMNS
      placed = spreadCells(knobs, shape.sections, shown)
    }
    const { columns } = placed
    const pedal = Math.floor((UPRIGHT_PLATE_WIDTH - 2 * UPRIGHT_SIDE) / UPRIGHT_FACE_PER_ROW)
    const width =
      columns === SPREAD_DISPLAY_COLUMNS
        ? UPRIGHT_PLATE_WIDTH
        : cells(2 * UPRIGHT_SIDE + columns * pedal)
    // The cells the width was rounded up by are shared among the columns.
    const column = Math.floor((width - 2 * UPRIGHT_SIDE) / columns)
    return {
      rows: SPREAD_BESIDE_ROWS + SPREAD_UNDER_ROWS,
      columns,
      column,
      width,
      knobsLeft: UPRIGHT_SIDE,
      display: display
        ? {
            left: UPRIGHT_SIDE,
            top: UPRIGHT_SIDE,
            // A pedal's display, or two of them side by side: never one stretched to the columns.
            width: (shown / SPREAD_DISPLAY_COLUMNS) * (UPRIGHT_PLATE_WIDTH - 2 * UPRIGHT_SIDE),
            height: DISPLAY_WINDOW_HEIGHT,
          }
        : null,
      upright: {
        height: UPRIGHT_PLATE_HEIGHT,
        knobsTop: UPRIGHT_SIDE,
        row: UPRIGHT_ROW,
        knob: KNOB_SIZE,
      },
      spread: {
        shown,
        // The second row is as high as it takes for the third to start where a pedal's knobs do.
        rowHeights: [
          SPREAD_BESIDE_ROW,
          UPRIGHT_KNOBS_TOP - UPRIGHT_SIDE - SPREAD_BESIDE_ROW,
          UPRIGHT_ROW,
          UPRIGHT_ROW,
        ],
        cell: (index) => placed.cells[index] ?? { row: 1, column: 1 },
      },
    }
  }
  if (upright) {
    // A display or a picture has the top; without either the knobs start there and take four rows.
    const topped = display !== undefined || pictured
    const rows = topped ? UPRIGHT_ROWS : UPRIGHT_PLAIN_ROWS
    const across = Math.ceil(knobs / rows)
    // A lone knob stands in the middle; few stand two abreast, more three and four. Past the face the plate widens by columns.
    const columns = topped
      ? Math.max(knobs === 1 ? 1 : 2, across)
      : Math.max(UPRIGHT_FACE_PER_ROW, across)
    const face = Math.floor((UPRIGHT_PLATE_WIDTH - 2 * UPRIGHT_SIDE) / UPRIGHT_FACE_PER_ROW)
    const width =
      columns <= UPRIGHT_FACE_PER_ROW
        ? UPRIGHT_PLATE_WIDTH
        : cells(2 * UPRIGHT_SIDE + columns * face) + (UPRIGHT_PLATE_WIDTH % CELL)
    // A face shares the plate's width; past it a knob keeps the column of four abreast, and the rows stand in the middle.
    const column =
      columns <= UPRIGHT_FACE_PER_ROW ? Math.floor((width - 2 * UPRIGHT_SIDE) / columns) : face
    return {
      rows,
      columns,
      column,
      width,
      knobsLeft: Math.floor((width - columns * column) / 2),
      display: display
        ? {
            left: UPRIGHT_SIDE,
            top: UPRIGHT_SIDE,
            width: width - 2 * UPRIGHT_SIDE,
            height: DISPLAY_WINDOW_HEIGHT,
          }
        : null,
      upright: {
        height: UPRIGHT_PLATE_HEIGHT,
        knobsTop: topped ? UPRIGHT_KNOBS_TOP : UPRIGHT_SIDE,
        row: topped ? UPRIGHT_ROW : UPRIGHT_PLAIN_ROW,
        knob: topped && columns <= 2 ? UPRIGHT_LARGE_KNOB : KNOB_SIZE,
      },
    }
  }
  if (display?.place === 'window') {
    const face = display.columns ?? 2
    const window = displayWindowWidth(face)
    const columns = Math.max(face, Math.ceil(knobs / 2))
    const knobsLeft = DISPLAY_LEFT + window + DISPLAY_GAP
    return {
      rows: 2,
      columns,
      column: KNOB_COLUMN,
      width: cells(knobsLeft + columns * KNOB_COLUMN + MORE_COLUMN),
      knobsLeft,
      display: { left: DISPLAY_LEFT, top: 8, width: window, height: DISPLAY_WINDOW_HEIGHT },
    }
  }
  if (display) {
    const rows = knobs > ONE_ROW_MOST ? 2 : 1
    const columns = Math.max(FACE_PER_ROW, Math.ceil(knobs / rows))
    const knobsRight = KNOBS_LEFT + columns * KNOB_COLUMN
    if (rows === 1) {
      const width = Math.max(STRIP_PLATE_LEAST, cells(knobsRight + MORE_COLUMN))
      // A face of four shares the room the least width gives it; more knobs keep their usual column.
      const column =
        columns === FACE_PER_ROW
          ? Math.floor((width - KNOBS_LEFT - MORE_COLUMN) / columns)
          : KNOB_COLUMN
      return {
        rows,
        columns,
        column,
        width,
        knobsLeft: KNOBS_LEFT,
        display: {
          left: DISPLAY_LEFT,
          top: STRIP_TOP,
          width: width - DISPLAY_LEFT - MORE_COLUMN - DISPLAY_GAP,
          height: DISPLAY_STRIP_HEIGHT,
        },
      }
    }
    const left = knobsRight + DISPLAY_GAP
    return {
      rows,
      columns,
      column: KNOB_COLUMN,
      width: cells(left + DISPLAY_STRIP_WIDTH + DISPLAY_GAP + MORE_COLUMN),
      knobsLeft: KNOBS_LEFT,
      display: { left, top: 8, width: DISPLAY_STRIP_WIDTH, height: DISPLAY_WINDOW_HEIGHT },
    }
  }
  const column = pictured ? KNOB_COLUMN : PLAIN_KNOB_COLUMN
  const rows = pictured ? (knobs > ONE_ROW_MOST ? 2 : 1) : knobs > FACE_PER_ROW ? 2 : 1
  const columns = Math.max(FACE_PER_ROW, Math.ceil(knobs / rows))
  const beside = pictured && rows === 2 ? PLATE_PICTURE_WIDTH : MORE_COLUMN
  const width = cells(KNOBS_LEFT + columns * column + beside)
  return { rows, columns, column, width, knobsLeft: KNOBS_LEFT, display: null }
}

/**
 * A skin's sections as the device has them: the knobs it lacks left out, an
 * empty section dropped, and the knobs no section names gathered in a last
 * one. Null for a skin without sections.
 */
export function plateSections(
  sections: DeviceSkin['sections'],
  params: readonly string[],
): string[][] | null {
  if (!sections || sections.length === 0) return null
  const seen = new Set<string>()
  const kept: string[][] = []
  for (const section of sections) {
    const names = section.filter((name) => params.includes(name) && !seen.has(name))
    for (const name of names) seen.add(name)
    if (names.length > 0) kept.push(names)
  }
  const others = params.filter((name) => !seen.has(name))
  if (others.length > 0) kept.push(others)
  return kept
}

export interface DevicePlateProps {
  device: Device
  skin: DeviceSkin
  /** Where to find the descriptor (name, presets); defaults to the provided engine's registry. */
  registry?: DeviceRegistry
  /** The device's full name, for its label and its info text; defaults to the descriptor's. */
  title?: string
  /** Labels for choice parameters by name; overrides the labels a spec carries in `choices`. */
  choiceLabels?: Readonly<Record<string, readonly string[]>>
  showBypass?: boolean
  /** Default: when the descriptor has presets. */
  showPresets?: boolean
  /**
   * A host's own preset picker for this device. It stands on the foot beside
   * the name and stays in view, where the kit's own list only shows with the
   * tools; given one, the kit's list is left out.
   */
  presetPicker?: ReactNode
  /**
   * Stands the plate upright, as a pedal on a board: the display across the
   * top, two rows of knobs under it, the name on the foot. Default: the plate
   * lies flat, 140 px high.
   */
  upright?: boolean
  /**
   * Lays every knob on the plate at once, with no cell to open the rest: for
   * an instrument, whose knobs are all played. Upright, the first knobs stand
   * in two rows beside the display and the rest in two rows under it, and the
   * plate is as wide as they need (`plateLayout`); lying flat it is the plate
   * opened, and stays so.
   */
  spread?: boolean
  /** Whether every knob shows from the start (default: only the face). */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Extra tools after the preset picker (a chain's move buttons). */
  actions?: ReactNode
  /** A line added to the plate's info text: how it is worked where it stands (a chain says it can be moved). */
  hint?: string
  /**
   * A line added to one knob's info text, after what the parameter does: what
   * else a host lets a hand do there (a menu on a right-click, what moves it).
   */
  knobHint?: (param: string) => string | undefined
  /**
   * The node that feeds the device, so a display can show the level going in
   * beside the level coming out. A chain gives it; left out, a display shows
   * only what comes out.
   */
  source?: AudioNode | null
  onRemove?: () => void
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

const PictureLayer = memo(
  function PictureLayer({
    picture,
    at,
  }: {
    picture: PlatePicture
    /** The positions the picture was drawn from, as one string: it is drawn again when this changes. */
    stamp: string
    at: (param: string) => number
  }) {
    return (
      <svg
        className="lm-plate__picture"
        width={PLATE_PICTURE_WIDTH}
        height={PLATE_PICTURE_HEIGHT}
        viewBox={`0 0 ${PLATE_PICTURE_WIDTH} ${PLATE_PICTURE_HEIGHT}`}
        aria-hidden="true"
      >
        {picture.draw(at)}
      </svg>
    )
  },
  (before, after) => before.picture === after.picture && before.stamp === after.stamp,
)

/**
 * A finger points at nothing, and in Safari a press gives a knob no focus, so
 * a plate pressed with a finger or a pen is in hand: its tools show as they do
 * under a pointer, until a press lands anywhere else. One plate is in hand at
 * a time, because the press that takes one up puts the last one down.
 */
function usePlateInHand(): { is: boolean; take: (event: ReactPointerEvent) => void } {
  const [is, setIs] = useState(false)
  useEffect(() => {
    if (!is) return
    // Every press puts the plate down, and a press that came from the plate
    // (its own list in a layer over the page counts) takes it up again in the
    // same turn: this listener runs before the plate's, so nothing is drawn between.
    const put = (): void => setIs(false)
    document.addEventListener('pointerdown', put, true)
    return () => document.removeEventListener('pointerdown', put, true)
  }, [is])
  return {
    is,
    take: (event) => {
      if (event.pointerType !== 'mouse') setIs(true)
    },
  }
}

/** A device drawn from a skin: plate, finish, picture, its own knobs. */
export function DevicePlate({
  device,
  skin,
  registry,
  title,
  choiceLabels,
  showBypass = true,
  showPresets,
  presetPicker,
  upright = false,
  spread = false,
  defaultOpen = false,
  onOpenChange,
  actions,
  hint,
  knobHint,
  source = null,
  onRemove,
  className,
  style,
  'data-testid': testId,
}: DevicePlateProps) {
  const d = useDevice(device, registry ? { registry } : {})
  const [presetName, setPresetName] = useState('')
  const [opened, setOpen] = useState(defaultOpen)
  // A spread plate is open and stays so.
  const open = spread || opened
  const held = usePlateInHand()
  const finishId = useId()
  const all = (device.panelParams ?? Object.keys(d.params)).filter((name) => d.params[name])
  const display = skin.display
  // A display takes the picture's place: a skin with both shows the display.
  const picture = display ? undefined : skin.picture
  const pictured = picture !== undefined || display !== undefined
  const onFace = upright
    ? UPRIGHT_FACE_PER_ROW * (pictured ? UPRIGHT_ROWS : UPRIGHT_PLAIN_ROWS)
    : display?.place === 'window'
      ? (display.columns ?? 2) * 2
      : pictured
        ? FACE_PER_ROW
        : FACE_PER_ROW * 2
  const chosen = skin.face?.filter((name) => all.includes(name)) ?? all
  // An upright face holds more than a skin chose for a flat one: its own first, then the rest in their order.
  const face = (
    upright ? [...chosen, ...all.filter((name) => !chosen.includes(name))] : chosen
  ).slice(0, onFace)
  const rest = all.filter((name) => !face.includes(name))
  // Spread and upright, a skin's sections set the order, each kept together, and a knob in none of
  // them stands in a last one with the others like it. Without sections the knobs keep the skin's
  // order first and then their own: the face is no smaller set.
  const sections = spread && upright ? plateSections(skin.sections, all) : null
  const names = sections
    ? sections.flat()
    : spread
      ? [...chosen, ...all.filter((name) => !chosen.includes(name))]
      : open
        ? [...face, ...rest]
        : face
  const layout = plateLayout(
    names.length,
    picture !== undefined,
    display,
    upright,
    spread && { sections: sections?.map((section) => section.length), wide: skin.wide },
  )
  const ownText = isParamTextDevice(device) ? device : null
  const editor = isEditorDevice(device) ? device : null
  const presetsShown = presetPicker === undefined && (showPresets ?? d.presets.length > 0)
  const heading = title ?? d.descriptor?.name ?? d.id
  const tag = skin.name ?? heading
  const about = d.descriptor?.description
  const powered = !d.bypass

  const at = (param: string): number => {
    const spec = d.params[param]
    return spec ? normalizeParam(spec, d.values[param]) : 0
  }
  const stamp = picture?.params.map((param) => at(param).toFixed(3)).join(' ') ?? ''

  // The letters a knob's column holds at the word's usual size; a longer word is set tighter.
  const roomy = roomyLetters(layout.column)

  const toggleOpen = (): void => {
    setOpen(!opened)
    onOpenChange?.(!opened)
  }

  // A picker that draws nothing (null) keeps the kit's list away and asks for no room.
  const picker = presetPicker !== undefined && presetPicker !== null && presetPicker !== false
  const name = (
    <h3 className="lm-plate__name" title={heading}>
      {tag}
    </h3>
  )
  // Beside a picker the foot has no room for them: they stand in a row of their own just above it.
  const tools = (
    <div className={cx('lm-plate__tools', (picker || upright) && 'lm-plate__tools--above')}>
      {presetsShown ? (
        <select
          className="lm-device__presets"
          aria-label={`${heading} preset`}
          {...infoProps(
            'Preset',
            `Sets every knob of ${heading} to one of its ready-made settings. Turning a knob afterwards leaves the preset behind.`,
          )}
          value={presetName}
          onChange={(event) => {
            const name = event.target.value
            setPresetName(name)
            if (name) d.applyPreset(name)
          }}
          data-testid={testId ? `${testId}-preset` : undefined}
        >
          <option value="">Preset…</option>
          {d.presets.map((preset) => (
            <option key={preset.name} value={preset.name}>
              {preset.name}
            </option>
          ))}
        </select>
      ) : null}
      {actions}
      {onRemove ? (
        <button
          type="button"
          className="lm-button lm-button--neutral lm-device__remove"
          aria-label={`Remove ${heading}`}
          onClick={onRemove}
          {...infoProps('Remove', `Takes ${heading} out of the chain, with its settings.`)}
          data-testid={testId ? `${testId}-remove` : undefined}
        >
          ×
        </button>
      ) : null}
    </div>
  )

  return (
    <section
      className={cx(
        'lm-plate',
        !powered && 'lm-plate--off',
        open && 'lm-plate--open',
        held.is && 'lm-plate--held',
        pictured && 'lm-plate--pictured',
        display && 'lm-plate--display',
        display && `lm-plate--${display.place}`,
        // No picture and no display: two rows of knobs, and the column at the right is the plate's own.
        !pictured && !display && 'lm-plate--plain',
        upright && 'lm-plate--upright',
        spread && 'lm-plate--spread',
        editor && 'lm-plate--editor',
        className,
      )}
      style={
        {
          '--lm-plate': skin.plate,
          '--lm-plate-ink': skin.ink,
          '--lm-plate-accent': skin.accent,
          '--lm-plate-rows': layout.rows,
          '--lm-plate-columns': layout.columns,
          '--lm-plate-column': `${layout.column}px`,
          '--lm-plate-knobs-left': `${layout.knobsLeft}px`,
          ...(layout.upright
            ? {
                '--lm-plate-knobs-top': `${layout.upright.knobsTop}px`,
                '--lm-plate-row': `${layout.upright.row}px`,
                height: layout.upright.height,
              }
            : {}),
          ...(layout.spread
            ? {
                '--lm-plate-row-heights': layout.spread.rowHeights
                  .map((height) => `${height}px`)
                  .join(' '),
              }
            : {}),
          width: layout.width,
          ...style,
        } as CSSProperties
      }
      data-testid={testId}
      data-lm-device={device.id}
      data-powered={powered ? 'true' : 'false'}
      data-finish={skin.finish}
      data-lettering={skin.clearLettering ? 'clear' : undefined}
      aria-label={heading}
      onPointerDownCapture={held.take}
      {...infoProps(
        heading,
        infoText(about ?? `${heading}: one of the devices of this chain.`, hint),
      )}
    >
      <PlateFinishLayer
        finish={skin.finish}
        dark={skin.dark ?? isDarkPlate(skin.plate)}
        id={`lm-plate-finish-${finishId.replace(/[^a-zA-Z0-9_-]/g, '')}`}
      />
      {picture ? <PictureLayer picture={picture} stamp={stamp} at={at} /> : null}
      {display && layout.display ? (
        <PlateDisplayLayer
          display={display}
          device={device}
          source={source}
          width={layout.display.width}
          height={layout.display.height}
          style={{ left: layout.display.left, top: layout.display.top }}
          powered={powered}
          params={d.params}
          values={d.values}
          heading={heading}
          onDragStart={(names) => d.touchMany(names)}
          onDrag={(params) => {
            d.setMany(params)
            if (presetName) setPresetName('')
          }}
          onDragEnd={(names) => d.releaseMany(names)}
          data-testid={testId ? `${testId}-display` : undefined}
        />
      ) : null}
      <div className="lm-plate__knobs">
        {names.map((name, index) => {
          const spec = d.params[name]
          const cell = layout.spread?.cell(index)
          const labels = choiceLabels?.[name] ?? (spec.choices?.length ? spec.choices : undefined)
          const choice = labels !== undefined || isChoiceParam(spec)
          const label = skin.labels?.[name] ?? (spec.name || name)
          return (
            <Knob
              key={name}
              label={label}
              value={d.values[name]}
              defaultValue={spec.default}
              min={spec.min}
              max={spec.max}
              step={choice ? 1 : paramStep(spec)}
              // A list, or a value that only takes steps, is never set between two of them.
              wholeSteps={choice || (spec.step !== undefined && spec.step > 0)}
              taper={paramTaper(spec)}
              unit={spec.unit || 'ratio'}
              bipolar={isBipolar(spec)}
              modulation={knobModulation(device, name, d.modulations[name])}
              size={layout.upright?.knob ?? KNOB_SIZE}
              cap={skin.cap}
              format={
                labels
                  ? (value) => labels[Math.round(value) - spec.min] ?? String(Math.round(value))
                  : choice
                    ? (value) => String(Math.round(value))
                    : (value) => ownText?.paramText(name) ?? formatParamValue(spec, value)
              }
              // A device's own words are for the value it holds now: none are had for its default.
              formatPresentOnly={!choice && ownText?.paramText(name) !== undefined}
              onChange={(value) => {
                d.setParam(name, value)
                if (presetName) setPresetName('')
              }}
              onChangeStart={() => d.touch(name)}
              onChangeEnd={() => d.release(name)}
              info={infoText(paramInfo(spec) ?? `A setting of ${heading}.`, knobHint?.(name))}
              className={cx(
                'lm-plate__knob',
                longestWord(label) > roomy && 'lm-plate__knob--tight',
              )}
              style={{
                ...(cell ? { gridRow: cell.row, gridColumn: cell.column } : {}),
                ...(longestWord(label) > roomy && squeeze(label, layout.column) < 1
                  ? { '--lm-plate-squeeze': squeeze(label, layout.column).toFixed(3) }
                  : {}),
              }}
              data-testid={testId ? `${testId}-${name}` : undefined}
              data-lm-param={name}
            />
          )
        })}
      </div>
      {editor ? (
        <button
          type="button"
          className="lm-plate__more lm-plate__edit"
          aria-label={`Open ${heading} editor`}
          {...infoProps(
            'Open editor',
            `Opens the window ${heading} draws itself, with every control it has. The knobs here are its first few, and move with the ones in the window.`,
          )}
          onClick={() => {
            // A plug-in that cannot show a window says so there; the plate stays as it is.
            void editor.openEditor().catch(() => {})
          }}
          data-testid={testId ? `${testId}-editor` : undefined}
        >
          Edit
        </button>
      ) : null}
      {rest.length > 0 && !spread ? (
        <button
          type="button"
          className={cx('lm-plate__more', editor && 'lm-plate__more--second')}
          aria-expanded={open}
          aria-label={
            open
              ? `Show fewer controls of ${heading}`
              : `Show ${rest.length} more controls of ${heading}`
          }
          {...infoProps(
            open ? 'Fewer controls' : 'More controls',
            open
              ? `Folds ${heading} back to the knobs on its face. The settings stay as they are.`
              : `Opens ${heading} to every one of its controls: ${rest.length} more than the face shows.`,
          )}
          onClick={toggleOpen}
          data-testid={testId ? `${testId}-more` : undefined}
        >
          {open ? '−' : `+${rest.length}`}
        </button>
      ) : null}
      {picker || upright ? tools : null}
      {picker && upright ? <div className="lm-plate__presets">{presetPicker}</div> : null}
      <div className={cx('lm-plate__foot', picker && 'lm-plate__foot--picker')}>
        {name}
        {/* A display shows the device's readings itself, so the foot does not print them again. */}
        {isMeteredDevice(device) && !display
          ? printedMeters(device).map(([name, spec]) => (
              <DeviceMeterReadout
                key={name}
                device={device}
                name={name}
                spec={spec}
                // A bypassed device does no work, so there is nothing to follow.
                active={powered}
                testId={testId}
              />
            ))
          : null}
        {picker && !upright ? <div className="lm-plate__presets">{presetPicker}</div> : null}
        {picker || upright ? null : tools}
        {showBypass ? (
          <DeviceToggle
            pressed={powered}
            label={`${heading} power`}
            info={`Turns ${heading} off and on. Off, the sound passes through unchanged and the settings are kept.`}
            onPressedChange={(next) => d.setBypass(!next)}
            className="lm-plate__lamp"
            data-testid={testId ? `${testId}-power` : undefined}
            data-lm-power
          />
        ) : null}
      </div>
    </section>
  )
}
