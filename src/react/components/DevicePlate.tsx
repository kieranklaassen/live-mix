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
import { Knob } from './Knob'
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
/** A word under a knob with more letters than this is set tighter, so none is cut short. */
const TIGHT_OVER = 7
const PLAIN_TIGHT_OVER = 8

const longestWord = (words: string): number =>
  Math.max(...words.split(/\s+/).map((word) => word.length))
/** Opened, a pictured plate with more knobs than this lays them in two rows beside the picture. */
const ONE_ROW_MOST = 12

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
}

/**
 * Where so many knobs go. Over a picture they sit in one row above it, and
 * the plate widens with them; past twelve they take two rows and the picture
 * stands clear at the right. A plate without a picture always has two rows.
 *
 * With a display: a strip lies under one row of knobs and ends where they do,
 * so the column at the right stays the plate's own; past twelve knobs they
 * take two rows and the strip stands beside them at the plate's full working
 * height. A window stands at the left and the knobs take two rows beside it.
 */
export function plateLayout(
  knobs: number,
  pictured: boolean,
  display?: Pick<PlateDisplay, 'place' | 'columns'>,
): PlateLayout {
  const cells = (px: number): number => Math.ceil(px / CELL) * CELL
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
      const width = cells(knobsRight + MORE_COLUMN)
      return {
        rows,
        columns,
        column: KNOB_COLUMN,
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
  /** Whether every knob shows from the start (default: only the face). */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Extra tools after the preset picker (a chain's move buttons). */
  actions?: ReactNode
  /** A line added to the plate's info text: how it is worked where it stands (a chain says it can be moved). */
  hint?: string
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
  defaultOpen = false,
  onOpenChange,
  actions,
  hint,
  source = null,
  onRemove,
  className,
  style,
  'data-testid': testId,
}: DevicePlateProps) {
  const d = useDevice(device, registry ? { registry } : {})
  const [presetName, setPresetName] = useState('')
  const [open, setOpen] = useState(defaultOpen)
  const held = usePlateInHand()
  const finishId = useId()
  const all = (device.panelParams ?? Object.keys(d.params)).filter((name) => d.params[name])
  const display = skin.display
  // A display takes the picture's place: a skin with both shows the display.
  const picture = display ? undefined : skin.picture
  const pictured = picture !== undefined || display !== undefined
  const onFace =
    display?.place === 'window'
      ? (display.columns ?? 2) * 2
      : pictured
        ? FACE_PER_ROW
        : FACE_PER_ROW * 2
  const face = (skin.face?.filter((name) => all.includes(name)) ?? all).slice(0, onFace)
  const rest = all.filter((name) => !face.includes(name))
  const names = open ? [...face, ...rest] : face
  const layout = plateLayout(names.length, picture !== undefined, display)
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
  const roomy = pictured ? TIGHT_OVER : PLAIN_TIGHT_OVER

  const toggleOpen = (): void => {
    setOpen(!open)
    onOpenChange?.(!open)
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
    <div className={cx('lm-plate__tools', picker && 'lm-plate__tools--above')}>
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
          width: layout.width,
          ...style,
        } as CSSProperties
      }
      data-testid={testId}
      data-powered={powered ? 'true' : 'false'}
      data-finish={skin.finish}
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
        {names.map((name) => {
          const spec = d.params[name]
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
              taper={paramTaper(spec)}
              unit={spec.unit || 'ratio'}
              bipolar={isBipolar(spec)}
              size={KNOB_SIZE}
              cap={skin.cap}
              format={
                labels
                  ? (value) => labels[Math.round(value) - spec.min] ?? String(Math.round(value))
                  : choice
                    ? (value) => String(Math.round(value))
                    : (value) => ownText?.paramText(name) ?? formatParamValue(spec, value)
              }
              onChange={(value) => {
                d.setParam(name, value)
                if (presetName) setPresetName('')
              }}
              onChangeStart={() => d.touch(name)}
              onChangeEnd={() => d.release(name)}
              info={paramInfo(spec) ?? `A setting of ${heading}.`}
              className={cx(
                'lm-plate__knob',
                longestWord(label) > roomy && 'lm-plate__knob--tight',
              )}
              data-testid={testId ? `${testId}-${name}` : undefined}
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
      {rest.length > 0 ? (
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
      {picker ? tools : null}
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
        {picker ? <div className="lm-plate__presets">{presetPicker}</div> : null}
        {picker ? null : tools}
        {showBypass ? (
          <DeviceToggle
            pressed={powered}
            label={`${heading} power`}
            info={`Turns ${heading} off and on. Off, the sound passes through unchanged and the settings are kept.`}
            onPressedChange={(next) => d.setBypass(!next)}
            className="lm-plate__lamp"
            data-testid={testId ? `${testId}-power` : undefined}
          />
        ) : null}
      </div>
    </section>
  )
}
