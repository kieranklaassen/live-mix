// An insert chain: one panel per device with move/remove actions and
// drag-and-drop reordering, plus a picker that instantiates a registry device
// into the chain. The chain belongs to a channel strip or to a bus (the
// master); both only append and remove, so a reorder rebuilds the tail of the
// chain from the first changed slot.

import { useCallback, useState, type CSSProperties, type DragEvent } from 'react'

import { type Device } from '../../core/devices/Device'
import {
  DEVICE_CATEGORIES,
  type DeviceDescriptor,
  type DeviceRegistry,
} from '../../core/devices/registry'
import { type StripHost } from '../../core/tracks/ChannelStrip'
import { useMaybeEngine } from '../hooks/useEngine'
import { useExternalSnapshot } from '../store'
import { DevicePanel, type DevicePanelProps } from './DevicePanel'
import { cx } from './tokens'

/** What a chain edits: anything with an ordered insert list (`ChannelStrip`, `Bus`). */
export interface InsertHost {
  readonly name: string
  readonly inserts: readonly Device[]
  addInsert(device: Device): void
  removeInsert(device: Device): void
  onChange(listener: () => void): () => void
}

/** A strip, a bus, or a track that carries a strip. */
export function resolveInsertHost(host: InsertHost | StripHost): InsertHost {
  return 'strip' in host ? host.strip : host
}

/**
 * Move the insert at `from` to `to`, re-adding the changed tail in order. The
 * first `pinned` inserts never move and nothing moves in front of them.
 */
export function reorderInserts(host: InsertHost, from: number, to: number, pinned = 0): void {
  const current = [...host.inserts]
  const outside = (index: number): boolean => index < pinned || index >= current.length
  if (from === to || outside(from) || outside(to)) return
  const next = [...current]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  let first = 0
  while (first < current.length && current[first] === next[first]) first += 1
  for (const device of current.slice(first)) host.removeInsert(device)
  for (const device of next.slice(first)) host.addInsert(device)
}

/** The picker's default: every effect. An instrument is a source, not an insert. */
export function isInsertDevice(descriptor: DeviceDescriptor): boolean {
  return descriptor.category !== 'instrument'
}

/** Descriptors under their category label, in menu order; empty categories are left out. */
export function groupDevices(
  descriptors: readonly DeviceDescriptor[],
): { label: string; devices: DeviceDescriptor[] }[] {
  return DEVICE_CATEGORIES.map(({ id, label }) => ({
    label,
    devices: descriptors.filter((descriptor) => descriptor.category === id),
  })).filter((group) => group.devices.length > 0)
}

function sameDevices(a: readonly Device[], b: readonly Device[]): boolean {
  return a.length === b.length && a.every((device, index) => device === b[index])
}

/** The host's inserts, re-read whenever it reports a change. */
export function useInserts(host: InsertHost): readonly Device[] {
  const subscribe = useCallback((onChange: () => void) => host.onChange(() => onChange()), [host])
  const read = useCallback((): readonly Device[] => [...host.inserts], [host])
  return useExternalSnapshot(subscribe, read, sameDevices)
}

function contextOf(host: InsertHost): BaseAudioContext | null {
  const nodes = host as { destination?: AudioNode; gainNode?: AudioNode }
  return (nodes.destination ?? nodes.gainNode)?.context ?? null
}

export interface DeviceChainViewProps {
  /** A track, its strip, or a bus such as the master. */
  strip: InsertHost | StripHost
  /** Defaults to the provided engine's registry; needed for names, presets and the add picker. */
  registry?: DeviceRegistry
  /** Show the add-device picker (default: when a registry is available). */
  showAdd?: boolean
  /**
   * Leading inserts the host application owns (a trim, a fixed stage): they
   * are not shown and cannot be moved or removed, and nothing moves ahead of them.
   */
  pinned?: number
  /** Which registry devices the picker offers (default: everything but instruments). */
  filter?: (descriptor: DeviceDescriptor) => boolean
  /** The picker's resting label (default "Add device…"). */
  addLabel?: string
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
  pinned = 0,
  filter = isInsertDevice,
  addLabel = 'Add device…',
  onRemove,
  onAdd,
  panelProps,
  className,
  style,
  'data-testid': testId,
}: DeviceChainViewProps) {
  const strip = resolveInsertHost(stripOrHost)
  const engine = useMaybeEngine()
  const reg = registry ?? engine?.devices ?? null
  const inserts = useInserts(strip)
  const skip = Math.max(0, Math.floor(pinned))
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
    const context = engine?.context ?? contextOf(strip)
    if (!reg || !id || !context) return
    setAdding(true)
    try {
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
    if (Number.isInteger(from)) reorderInserts(strip, from, index, skip)
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
      {inserts.map((device, index) =>
        index < skip ? null : (
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
            data-testid={testId ? `${testId}-item-${index - skip}` : undefined}
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
                    disabled={index === skip}
                    onClick={() => reorderInserts(strip, index, index - 1, skip)}
                    data-testid={testId ? `${testId}-earlier-${index - skip}` : undefined}
                  >
                    ◂
                  </button>
                  <button
                    type="button"
                    className="lm-button lm-button--neutral lm-chain__move"
                    aria-label={`Move ${device.id} later`}
                    disabled={index === inserts.length - 1}
                    onClick={() => reorderInserts(strip, index, index + 1, skip)}
                    data-testid={testId ? `${testId}-later-${index - skip}` : undefined}
                  >
                    ▸
                  </button>
                  {panelProps?.actions}
                </>
              }
              data-testid={testId ? `${testId}-device-${index - skip}` : undefined}
            />
          </div>
        ),
      )}
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
            <option value="">{adding ? 'Adding…' : addLabel}</option>
            {groupDevices(reg.list().filter(filter)).map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.devices.map((descriptor) => (
                  <option key={descriptor.id} value={descriptor.id}>
                    {descriptor.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  )
}
