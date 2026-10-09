// An effect's presets, on the effect itself: the name of the one it is on,
// the two cells that step to the one before and after, and the list the name
// opens. Moved here from Ambient Live, where it stands on the foot of a
// plate (`DevicePlate`'s `presetPicker`). It takes the presets, the values
// and what a pick does as props: an app that keeps its own document writes
// the pick there. `DevicePresetCell` is the same cell read off a device.

import { useMemo, useRef, useState, type HTMLAttributes, type ReactNode } from 'react'

import { type Device } from '../../core/devices/Device'
import {
  atDefaults,
  currentPreset,
  retiredPresets,
  stepPreset,
} from '../../core/devices/preset-match'
import { type Preset } from '../../core/devices/presets'
import { type DeviceRegistry } from '../../core/devices/registry'
import { type ParamSpec } from '../../core/params'
import { useDevice, type DeviceWrites } from '../hooks/useParam'
import { Glyph } from './Glyph'
import { infoProps, type InfoProps } from './info'
import { PickList, type PickItem, type PickListProps } from './PickList'
import { PICK_CHEVRON_DOWN, PICK_CHEVRON_LEFT, PICK_CHEVRON_RIGHT } from './Picker'

/** What the cell says while every parameter is where the device starts it. */
export const PRESET_DEFAULT_LABEL = 'Default'
/** What the cell says once the parameters fit no preset. */
export const PRESET_NONE_LABEL = 'No preset'

/**
 * What a preset cell says: the name of the preset the parameters are on, of
 * one the device no longer lists (`retired`) where they are on that, else
 * `Default` or `No preset`.
 */
export function presetLabel(
  presets: readonly Preset[],
  values: Readonly<Record<string, number>>,
  specs: Readonly<Record<string, ParamSpec>>,
  options: { last?: string | null; retired?: readonly Preset[] } = {},
): { on: Preset | null; label: string } {
  const on =
    currentPreset(presets, values, specs, options.last ?? null) ??
    currentPreset(options.retired ?? [], values, specs, options.last ?? null)
  return {
    on,
    label: on?.name ?? (atDefaults(values, specs) ? PRESET_DEFAULT_LABEL : PRESET_NONE_LABEL),
  }
}

type PresetItem = PickItem & { preset: Preset }

export interface PresetCellProps {
  /** The effect's name as the person knows it. */
  name: string
  /** The presets the list offers, in its order. A name stands for one of them alone. */
  presets: readonly Preset[]
  /** Where the effect's parameters are now. */
  values: Readonly<Record<string, number>>
  specs: Readonly<Record<string, ParamSpec>>
  /** Presets the cell can still name and the list does not offer: `retiredPresets(descriptor)`. */
  retired?: readonly Preset[]
  /** A preset was picked, from the list or with a step cell: the app puts the effect on it. */
  onPick: (preset: Preset) => void
  /** The head a preset is listed under, for a list in parts: an app's own, then the device's. */
  groupOf?: (preset: Preset) => string | undefined
  /** What a preset is for, said dim beside its name. */
  detailOf?: (preset: Preset) => string | undefined
  /** Where the list opens: see `PickerPanel`. Above the cell, lined up with its right edge, when left out. */
  side?: 'above' | 'below'
  align?: 'start' | 'end'
  rail?: (anchor: HTMLElement) => HTMLElement | null
  width?: number
  height?: number
  /** An app's chips and cells in the list: see `PickList`. */
  filters?: ReactNode
  rowTools?: (preset: Preset) => ReactNode
  /** More attributes for the three cells (an app's own marks on them), by which cell it is. */
  cellProps?: (
    cell: 'name' | 'previous' | 'next',
  ) => (HTMLAttributes<HTMLButtonElement> & Record<`data-${string}`, string>) | undefined
  /** More attributes for a row of the list. */
  rowProps?: (preset: Preset) => HTMLAttributes<HTMLDivElement> & Record<`data-${string}`, string>
  /** The cell's entry in the info view. */
  info?: InfoProps
  /** The cell's test id; its parts are `<id>-name`, `<id>-previous`, `<id>-next` and `<id>-picker` (a `PickList`). */
  'data-testid'?: string
}

/**
 * The preset cell of one effect: nothing for an effect with no presets.
 * Which preset is on is read off the values each time it is drawn, so a knob
 * turned anywhere (on the plate, by an undo, by an agent) leaves the cell
 * saying what is true: the preset's name, `Default`, or `No preset`.
 */
export function PresetCell({
  name,
  presets,
  values,
  specs,
  retired,
  onPick,
  groupOf,
  detailOf,
  side = 'above',
  align = 'end',
  rail,
  width = 300,
  height = 340,
  filters,
  rowTools,
  cellProps,
  rowProps,
  info,
  'data-testid': testId,
}: PresetCellProps) {
  const anchorRef = useRef<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)
  // The preset picked last, for telling two presets apart that put the knobs in the same place.
  const [last, setLast] = useState<string | null>(null)

  const items = useMemo(
    (): PresetItem[] =>
      presets.map((preset) => ({
        id: preset.name,
        name: preset.name,
        detail: detailOf?.(preset),
        group: groupOf?.(preset),
        preset,
      })),
    [presets, detailOf, groupOf],
  )

  if (presets.length === 0) return null

  const { on, label } = presetLabel(presets, values, specs, { last, retired })
  const onAt = on ? presets.findIndex((preset) => preset.name === on.name) : -1
  const position = `${onAt >= 0 ? onAt + 1 : '–'} of ${presets.length}`

  function apply(preset: Preset) {
    setLast(preset.name)
    onPick(preset)
  }

  function step(delta: 1 | -1) {
    const next = stepPreset(presets, onAt >= 0 ? (on?.name ?? null) : null, delta)
    if (next) apply(next)
  }

  const list: Pick<PickListProps<PresetItem>, 'rowTools' | 'rowProps'> = {
    rowTools: rowTools ? (item) => rowTools(item.preset) : undefined,
    rowProps: rowProps ? (item) => rowProps(item.preset) : undefined,
  }

  return (
    <>
      <div
        className="lm-fxp"
        data-open={open || undefined}
        data-testid={testId}
        {...(info ??
          infoProps(
            'Presets',
            `The preset ${name} is on, and the two cells that step through its ${presets.length} presets where the plate has room for them. The name opens the list of them; where the name has no room, the chevron alone does.`,
          ))}
      >
        <button
          ref={anchorRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`${name} preset: ${label}`}
          onClick={() => setOpen((was) => !was)}
          title={`${label}: the preset ${name} is on (${position}). Click to see them all.`}
          className="lm-fxp__name"
          data-testid={testId ? `${testId}-name` : undefined}
          {...infoProps(
            'Preset',
            open
              ? `Names the preset ${name} is on. The list is open: a press on the name closes it.`
              : `Names the preset ${name} is on, ${position}: ${PRESET_DEFAULT_LABEL} while every knob is where the effect starts, ${PRESET_NONE_LABEL} when the knobs fit none. A press opens the list of them.`,
          )}
          {...cellProps?.('name')}
        >
          <span className="lm-fxp__label">{label}</span>
          <Glyph d={PICK_CHEVRON_DOWN} />
        </button>
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label={`Previous preset of ${name}`}
          title="Step to the preset before this one, without opening the list"
          className="lm-fxp__step"
          data-testid={testId ? `${testId}-previous` : undefined}
          {...infoProps(
            'Previous preset',
            `Steps ${name} to the preset before this one, without opening the list. From the first it goes round to the last, and with no preset on it takes the last.`,
          )}
          {...cellProps?.('previous')}
        >
          <Glyph d={PICK_CHEVRON_LEFT} />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label={`Next preset of ${name}`}
          title="Step to the next preset, without opening the list"
          className="lm-fxp__step"
          data-testid={testId ? `${testId}-next` : undefined}
          {...infoProps(
            'Next preset',
            `Steps ${name} to the next preset, without opening the list. From the last it goes round to the first, and with no preset on it takes the first.`,
          )}
          {...cellProps?.('next')}
        >
          <Glyph d={PICK_CHEVRON_RIGHT} />
        </button>
      </div>
      <PickList
        open={open}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
        label={`Presets of ${name}`}
        items={items}
        current={onAt >= 0 ? (on?.name ?? null) : null}
        onPick={(item) => apply(item.preset)}
        verb="Load"
        side={side}
        align={align}
        rail={rail}
        width={width}
        height={height}
        filters={filters}
        {...list}
        info={infoProps(
          'Preset list',
          `The presets of ${name}, to search and pick from. Return puts the one the cursor is on onto the effect. Escape or a press outside closes the list.`,
        )}
        data-testid={testId ? `${testId}-picker` : undefined}
      />
    </>
  )
}

export interface DevicePresetCellProps extends Omit<
  PresetCellProps,
  'name' | 'presets' | 'values' | 'specs' | 'retired' | 'onPick'
> {
  device: Device
  registry?: DeviceRegistry | null
  /** A host that keeps its own document takes the pick as one write of every parameter: see `DeviceWrites`. */
  writes?: DeviceWrites
  /** The effect's name; the descriptor's when left out. */
  name?: string
  /**
   * Presets of the app's own, listed before the device's. Each goes by its
   * values: a parameter it does not name is put where the device starts it.
   */
  presets?: readonly Preset[]
  /** Leave the device's own presets out of the list: only `presets` are offered. */
  ownOnly?: boolean
}

/**
 * The preset cell of a device: its own presets, and an app's before them.
 * A pick sets every parameter in one write, the ones the preset does not
 * name to where the device starts them.
 */
export function DevicePresetCell({
  device,
  registry,
  writes,
  name,
  presets: own,
  ownOnly = false,
  ...cell
}: DevicePresetCellProps) {
  const d = useDevice(device, { ...(registry ? { registry } : {}), ...(writes ? { writes } : {}) })
  const presets = useMemo(
    (): readonly Preset[] =>
      ownOnly ? (own ?? []) : own?.length ? [...own, ...d.presets] : d.presets,
    [own, ownOnly, d.presets],
  )
  const retired = useMemo(() => retiredPresets(d.descriptor), [d.descriptor])
  return (
    <PresetCell
      {...cell}
      name={name ?? d.descriptor?.name ?? device.id}
      presets={presets}
      values={d.values}
      specs={device.params}
      retired={retired}
      onPick={(preset) =>
        d.applyPreset({
          ...preset,
          // By value, never by name: one of the app's own is no preset the device knows.
          params: Object.fromEntries(
            Object.entries(device.params).map(([key, spec]) => [
              key,
              (Object.hasOwn(preset.params, key) ? preset.params[key] : undefined) ?? spec.default,
            ]),
          ),
        })
      }
    />
  )
}
