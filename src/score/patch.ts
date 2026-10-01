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
  const inserts =
    owner === MASTER_OWNER ? score.master.inserts : findStripHost(score, owner)?.strip.inserts
  if (!inserts) throw new Error(`live-mix: the score has no "${owner}" to put effects on`)
  const pinned = Math.max(0, Math.floor(options.pinned ?? 0))
  const taken = new Set(allDevices(score).map((location) => location.device.id))
  const ops: Operation[] = inserts
    .slice(pinned)
    .map((device) => ({ type: 'device.remove', id: device.id }))
  for (const effect of patch.effects) {
    let n = 1
    while (taken.has(`${effect.deviceId}-${n}`)) n += 1
    const id = `${effect.deviceId}-${n}`
    taken.add(id)
    ops.push({ type: 'device.add', owner, device: scoreDeviceFromPatch(id, effect) })
  }
  return ops
}
