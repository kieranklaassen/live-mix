// An insert chain: one panel per device with move/remove actions, plus a
// picker that instantiates a registry device into the chain. A device is
// carried to another place by its title bar (`chain-reorder.ts`). The chain
// belongs to a channel strip or to a bus (the master); both only append and
// remove, so a reorder rebuilds the tail of the chain from the first changed
// slot.
//
// Inside a provider with an `arbiter` whose score carries the chain's owner,
// adding, removing and moving are score operations (`device.add`,
// `device.remove`, `device.move`) and the renderer changes the chain: the
// edits are in the document, in the log and on the undo stack.

import { useCallback, useState, type CSSProperties } from 'react'

import { type Device } from '../../core/devices/Device'
import {
  DEVICE_CATEGORIES,
  type DeviceDescriptor,
  type DeviceRegistry,
} from '../../core/devices/registry'
import { type StripHost } from '../../core/tracks/ChannelStrip'
import { type Arbiter } from '../../score/Arbiter'
import {
  MASTER_OWNER,
  allDevices,
  findDevice,
  findStripHost,
  type DeviceLocation,
  type ScoreDevice,
} from '../../score/schema'
import { useMaybeArbiter, useMaybeEngine } from '../hooks/useEngine'
import { useExternalSnapshot } from '../store'
import { useChainReorder } from './chain-reorder'
import { DevicePanel, type DevicePanelProps } from './DevicePanel'
import { infoProps } from './info'
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

/** The owner id the arbiter's score knows this chain by, or null when it is not in the score. */
function scoreOwner(
  arbiter: Arbiter | null,
  host: InsertHost,
  master: InsertHost | null,
): string | null {
  if (!arbiter) return null
  if (host === master) return MASTER_OWNER
  return findStripHost(arbiter.score, host.name) ? host.name : null
}

/** The insert chain the score holds for an owner. */
function scoreInserts(arbiter: Arbiter, owner: string): readonly ScoreDevice[] {
  if (owner === MASTER_OWNER) return arbiter.score.master.inserts
  return findStripHost(arbiter.score, owner)?.strip.inserts ?? []
}

/** An instance id no device in the score has yet: `delay-1`, `delay-2`, … */
export function freshDeviceId(arbiter: Arbiter, deviceId: string): string {
  const taken = new Set(allDevices(arbiter.score).map((location) => location.device.id))
  let n = 1
  while (taken.has(`${deviceId}-${n}`)) n += 1
  return `${deviceId}-${n}`
}

/**
 * The picker's default: every effect that can be made here. An instrument is
 * a source, not an insert, and an unavailable device is only a stand-in.
 */
export function isInsertDevice(descriptor: DeviceDescriptor): boolean {
  return descriptor.category !== 'instrument' && descriptor.unavailable !== true
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

/** What the grip at a device's left says in the info view. */
const REORDER_INFO =
  'Drag this grip, or the title bar beside it, sideways to carry the device to another place in the chain. A line shows where it will land; Escape puts it back. The sound runs through the devices from left to right, so their order changes the result.'
/** The line a device in a chain adds to its own info text. */
const REORDER_HINT = 'Drag its title bar sideways to move it in the chain.'

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
  /** Called instead of `removeInsert` + `dispose` (or the score operation) when set. */
  onRemove?: (device: Device, index: number) => void
  /** Called with the created device instead of `addInsert` (or the score operation) when set. */
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
  const arbiter = useMaybeArbiter()
  const reg = registry ?? engine?.devices ?? null
  const inserts = useInserts(strip)
  const owner = scoreOwner(arbiter, strip, engine?.master ?? null)
  const skip = Math.max(0, Math.floor(pinned))
  const [adding, setAdding] = useState(false)
  const addShown = showAdd ?? reg !== null

  const remove = (device: Device, index: number): void => {
    if (onRemove) {
      onRemove(device, index)
      return
    }
    const id = owner !== null ? arbiter?.deviceIdFor(device) : undefined
    if (arbiter && id !== undefined) {
      arbiter.apply({ type: 'device.remove', id })
      return
    }
    strip.removeInsert(device)
    device.dispose()
  }

  /** Where the score holds a device of this chain, when the score owns the chain. */
  const scoreSlot = (device: Device | undefined): DeviceLocation | undefined => {
    if (!arbiter || owner === null || !device) return undefined
    const id = arbiter.deviceIdFor(device)
    return id === undefined ? undefined : findDevice(arbiter.score, id)
  }

  /** A device let go: it lands on the slot the one now at that place holds, else a rebuild. */
  const move = (from: number, to: number): void => {
    if (from === to || from < skip || to < skip) return
    if (!arbiter || owner === null) {
      reorderInserts(strip, from, to, skip)
      return
    }
    const moved = scoreSlot(inserts[from])
    // The score lists only its own devices; land on the slot the target holds there.
    const index = scoreSlot(inserts[to])?.index
    if (moved && index !== undefined)
      arbiter.apply({ type: 'device.move', id: moved.device.id, index })
  }

  /**
   * The move buttons: one slot earlier or later. The step is through the
   * score's own order, which the engine's chain follows a render behind — read
   * out of the chain, a second click would land back on the slot the first
   * came from.
   */
  const step = (index: number, delta: 1 | -1): void => {
    if (!arbiter || owner === null) {
      move(index, index + delta)
      return
    }
    const moved = index < skip ? undefined : scoreSlot(inserts[index])
    if (!moved) return
    // The pinned inserts the score holds head its chain; nothing steps in front of them.
    const first = inserts.slice(0, skip).filter((device) => scoreSlot(device)).length
    const to = moved.index + delta
    if (to >= first && to < scoreInserts(arbiter, owner).length)
      arbiter.apply({ type: 'device.move', id: moved.device.id, index: to })
  }

  const add = async (id: string): Promise<void> => {
    const context = engine?.context ?? contextOf(strip)
    if (!reg || !id) return
    if (arbiter && owner !== null && !onAdd) {
      arbiter.apply({
        type: 'device.add',
        owner,
        device: { id: freshDeviceId(arbiter, id), deviceId: id, params: {}, bypass: false },
      })
      return
    }
    if (!context) return
    setAdding(true)
    try {
      const device = await reg.create(id, context)
      if (onAdd) onAdd(device)
      else strip.addInsert(device)
    } finally {
      setAdding(false)
    }
  }

  // The carry counts among the devices shown; the chain counts the pinned ones too.
  const reorder = useChainReorder((from, to) => move(from + skip, to + skip))

  return (
    <div
      ref={reorder.chainRef}
      className={cx('lm-chain', reorder.carried !== null && 'lm-chain--reordering', className)}
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
              reorder.carried === index - skip && 'lm-chain__item--dragging',
            )}
            onPointerDown={reorder.onPointerDown(index - skip)}
            data-testid={testId ? `${testId}-item-${index - skip}` : undefined}
          >
            <div
              className="lm-chain__handle"
              aria-hidden="true"
              title="Drag to reorder"
              {...infoProps('Reorder', REORDER_INFO)}
            >
              ⋮⋮
            </div>
            <DevicePanel
              hint={REORDER_HINT}
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
                    {...infoProps(
                      'Move earlier',
                      'Moves the device one place towards the start of the chain, so the sound reaches it sooner.',
                    )}
                    disabled={index === skip}
                    onClick={() => step(index, -1)}
                    data-testid={testId ? `${testId}-earlier-${index - skip}` : undefined}
                  >
                    ◂
                  </button>
                  <button
                    type="button"
                    className="lm-button lm-button--neutral lm-chain__move"
                    aria-label={`Move ${device.id} later`}
                    {...infoProps(
                      'Move later',
                      'Moves the device one place towards the end of the chain, so it works on what the devices before it made.',
                    )}
                    disabled={index === inserts.length - 1}
                    onClick={() => step(index, 1)}
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
      {reorder.carried !== null ? (
        <div
          ref={reorder.labelRef}
          className="lm-chain__carried"
          aria-hidden="true"
          data-testid={testId ? `${testId}-carried` : undefined}
        >
          {reorder.label}
        </div>
      ) : null}
      {reorder.marker !== null ? (
        <div
          className="lm-chain__marker"
          style={{ left: reorder.marker }}
          aria-hidden="true"
          data-testid={testId ? `${testId}-marker` : undefined}
        />
      ) : null}
      {addShown && reg ? (
        <div className="lm-chain__add" role="listitem">
          <select
            className="lm-chain__picker"
            aria-label="Add device"
            {...infoProps(
              'Add device',
              'Puts a new device at the end of this chain. Pick one from the list, sorted by what it does.',
            )}
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
