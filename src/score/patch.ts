// Patches into a score. A host that keeps its chains in a score document
// loads an effect chain as device operations, so the load is in the document,
// in the log and on the undo stack like any other edit.

import { type Patch, type PatchDevice } from '../core/devices/patch'
import { type Operation } from './operations'
import { MASTER_OWNER, allDevices, findStripHost, type Score, type ScoreDevice } from './schema'

/** A patch's device as a score declares it, under the instance id `id`. */
export function scoreDeviceFromPatch(id: string, device: PatchDevice): ScoreDevice {
  const out: ScoreDevice = {
    id,
    deviceId: device.deviceId,
    params: { ...device.params },
    bypass: device.bypass === true,
  }
  if (device.preset !== undefined) out.preset = device.preset
  return out
}

export interface PatchEffectOpsOptions {
  /**
   * Leading inserts of the owner that stay where they are (a trim, a fixed
   * stage the host keeps); the patch's effects go after them. Default 0.
   */
  pinned?: number
}

/** Instance ids for a patch's devices that no device in the score has: `tape-1`, `tape-2`, … */
function idAllocator(score: Score): (deviceId: string) => string {
  const taken = new Set(allDevices(score).map((location) => location.device.id))
  return (deviceId) => {
    let n = 1
    while (taken.has(`${deviceId}-${n}`)) n += 1
    const id = `${deviceId}-${n}`
    taken.add(id)
    return id
  }
}

function effectOps(
  score: Score,
  owner: string,
  patch: Pick<Patch, 'effects'>,
  options: PatchEffectOpsOptions,
  freshId: (deviceId: string) => string,
): Operation[] {
  const inserts =
    owner === MASTER_OWNER ? score.master.inserts : findStripHost(score, owner)?.strip.inserts
  if (!inserts) throw new Error(`live-mix: the score has no "${owner}" to put effects on`)
  const pinned = Math.max(0, Math.floor(options.pinned ?? 0))
  const ops: Operation[] = inserts
    .slice(pinned)
    .map((device) => ({ type: 'device.remove', id: device.id }))
  for (const effect of patch.effects) {
    ops.push({
      type: 'device.add',
      owner,
      device: scoreDeviceFromPatch(freshId(effect.deviceId), effect),
    })
  }
  return ops
}

/**
 * The operations that put a patch's effects on `owner` in place of the
 * inserts it has: a track, group or return by id, or `MASTER_OWNER`. Apply
 * them as one `batch` and the load is one undo step. New devices get instance
 * ids no device in the score has (`tape-1`, `tape-2`, …). Throws when the
 * score has no such owner.
 */
export function patchEffectOps(
  score: Score,
  owner: string,
  patch: Pick<Patch, 'effects'>,
  options: PatchEffectOpsOptions = {},
): Operation[] {
  return effectOps(score, owner, patch, options, idAllocator(score))
}

/**
 * The operations that load an instrument preset onto an instrument track:
 * its instrument with its settings in place of the track's own device
 * (`device.replace`), and its effects in place of the track's inserts. The
 * strip's level, pan and sends stay, and a track already playing the
 * preset's instrument keeps that instance and the state it holds. Apply them
 * as one `batch` and the load is one undo step. Throws when the patch has no
 * instrument or the score has no such instrument track.
 */
export function patchInstrumentOps(
  score: Score,
  track: string,
  patch: Pick<Patch, 'instrument' | 'effects'>,
  options: PatchEffectOpsOptions = {},
): Operation[] {
  if (!patch.instrument) throw new Error('live-mix: the patch has no instrument')
  const host = findStripHost(score, track)
  if (!host || !('kind' in host) || host.kind !== 'instrument') {
    throw new Error(`live-mix: the score has no instrument track "${track}"`)
  }
  const freshId = idAllocator(score)
  // The same instrument stays the instance it is and takes the preset's
  // settings, so what it is playing goes on; another one is a new instance.
  const kept = host.device.deviceId === patch.instrument.deviceId
  const device = scoreDeviceFromPatch(
    kept ? host.device.id : freshId(patch.instrument.deviceId),
    patch.instrument,
  )
  // A patch cannot say what a device holds besides its parameters, and the
  // instance that stays still holds it: dropping it here would take a hosted
  // sample or program out of the document while it goes on sounding.
  if (kept && host.device.state !== undefined) device.state = host.device.state
  return [
    {
      type: 'device.replace',
      id: host.device.id,
      device,
    },
    ...effectOps(score, track, patch, options, freshId),
  ]
}
