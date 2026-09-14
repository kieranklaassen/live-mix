// A strip's insert chain: one panel per device with move/remove actions and
// drag-and-drop reordering, plus a picker that instantiates a registry device
// into the chain. `ChannelStrip` only appends and removes, so a reorder
// rebuilds the tail of the chain from the first changed slot.

import { useState, type CSSProperties, type DragEvent } from 'react'

import { type Device } from '../../core/devices/Device'
import { type DeviceRegistry } from '../../core/devices/registry'
import { type ChannelStrip, type StripHost } from '../../core/tracks/ChannelStrip'
import { useMaybeEngine } from '../hooks/useEngine'
import { useStrip } from '../hooks/useTrack'
import { resolveStrip } from './ChannelStripView'
import { DevicePanel, type DevicePanelProps } from './DevicePanel'
import { cx } from './tokens'

/** Move the insert at `from` to `to`, re-adding the changed tail in order. */
export function reorderInserts(strip: ChannelStrip, from: number, to: number): void {
  const current = [...strip.inserts]
  if (from === to || from < 0 || to < 0 || from >= current.length || to >= current.length) return
  const next = [...current]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  let first = 0
  while (first < current.length && current[first] === next[first]) first += 1
  for (const device of current.slice(first)) strip.removeInsert(device)
  for (const device of next.slice(first)) strip.addInsert(device)
}

export interface DeviceChainViewProps {
  strip: ChannelStrip | StripHost
  /** Defaults to the provided engine's registry; needed for names, presets and the add picker. */
  registry?: DeviceRegistry
  /** Show the add-device picker (default: when a registry is available). */
  showAdd?: boolean
  /** Called instead of `removeInsert` + `dispose` when set. */
  onRemove?: (device: Device, index: number) => void
  /** Called with the created device instead of `addInsert` when set. */
  onAdd?: (device: Device) => void
  /** Forwarded to every panel (knob size, choice labels, …). */
  panelProps?: Partial<Omit<DevicePanelProps, 'device' | 'registry' | 'onRemove'>>
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

export function DeviceChainView({
  strip: stripOrHost,
  registry,
  showAdd,
  onRemove,
  onAdd,
  panelProps,
  className,
  style,
  'data-testid': testId,
}: DeviceChainViewProps) {
  const strip = resolveStrip(stripOrHost)
  const engine = useMaybeEngine()
  const reg = registry ?? engine?.devices ?? null
  const { inserts } = useStrip(strip)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const addShown = showAdd ?? reg !== null

  const remove = (device: Device, index: number): void => {
    if (onRemove) {
      onRemove(device, index)
      return
    }
    strip.removeInsert(device)
    device.dispose()
  }

  const add = async (id: string): Promise<void> => {
    if (!reg || !id) return
    setAdding(true)
    try {
      const context = engine?.context ?? strip.destination.context
      const device = await reg.create(id, context)
      if (onAdd) onAdd(device)
      else strip.addInsert(device)
    } finally {
      setAdding(false)
    }
  }

  const onDragStart = (index: number) => (event: DragEvent<HTMLElement>) => {
    setDragIndex(index)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }
  const onDragOver = (index: number) => (event: DragEvent<HTMLElement>) => {
    if (dragIndex === null) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    if (overIndex !== index) setOverIndex(index)
  }
  const onDrop = (index: number) => (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    const from = dragIndex ?? Number(event.dataTransfer.getData('text/plain'))
    setDragIndex(null)
    setOverIndex(null)
    if (Number.isInteger(from)) reorderInserts(strip, from, index)
  }
  const onDragEnd = (): void => {
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <div
      className={cx('lm-chain', className)}
      style={style}
      role="list"
      aria-label={`${strip.name} devices`}
      data-testid={testId}
    >
      {inserts.map((device, index) => (
        <div
          key={`${device.id}-${index}`}
          role="listitem"
          className={cx(
            'lm-chain__item',
            dragIndex === index && 'lm-chain__item--dragging',
            overIndex === index && dragIndex !== index && 'lm-chain__item--over',
          )}
          draggable
          onDragStart={onDragStart(index)}
          onDragOver={onDragOver(index)}
          onDrop={onDrop(index)}
          onDragEnd={onDragEnd}
          data-testid={testId ? `${testId}-item-${index}` : undefined}
        >
          <div className="lm-chain__handle" aria-hidden="true" title="Drag to reorder">
            ⋮⋮
          </div>
          <DevicePanel
            {...panelProps}
            device={device}
            registry={reg ?? undefined}
            onRemove={() => remove(device, index)}
            actions={
              <>
                <button
                  type="button"
                  className="lm-button lm-button--neutral lm-chain__move"
                  aria-label={`Move ${device.id} earlier`}
                  disabled={index === 0}
                  onClick={() => reorderInserts(strip, index, index - 1)}
                  data-testid={testId ? `${testId}-earlier-${index}` : undefined}
                >
                  ◂
                </button>
                <button
                  type="button"
                  className="lm-button lm-button--neutral lm-chain__move"
                  aria-label={`Move ${device.id} later`}
                  disabled={index === inserts.length - 1}
                  onClick={() => reorderInserts(strip, index, index + 1)}
                  data-testid={testId ? `${testId}-later-${index}` : undefined}
                >
                  ▸
                </button>
                {panelProps?.actions}
              </>
            }
            data-testid={testId ? `${testId}-device-${index}` : undefined}
          />
        </div>
      ))}
      {addShown && reg ? (
        <div className="lm-chain__add" role="listitem">
          <select
            className="lm-chain__picker"
            aria-label="Add device"
            value=""
            disabled={adding}
            onChange={(event) => {
              void add(event.target.value)
            }}
            data-testid={testId ? `${testId}-add` : undefined}
          >
            <option value="">{adding ? 'Adding…' : 'Add device…'}</option>
            {reg.list().map((descriptor) => (
              <option key={descriptor.id} value={descriptor.id}>
                {descriptor.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  )
}
