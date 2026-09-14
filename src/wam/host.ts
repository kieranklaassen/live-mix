// A WAM 2.0 host is a `WamEnv` plus one `WamGroup` installed in the audio
// worklet global scope of a context; plugins created with the group's id can
// then find each other for event routing. `@webaudiomodules/sdk` does the
// installation (`initializeWamHost`), which is two `addModule` calls, so it
// happens once per context and every WamDevice on that context shares it —
// the same shape as `ensureProcessor` for the library's own worklets.
//
// Only `initializeWamHost` is imported, by its file path: the SDK's index
// pulls in `WamNode extends AudioWorkletNode` at module level, which throws
// wherever `AudioWorkletNode` is missing (Node, SSR). This entry stays
// import-safe there.

import initializeWamHost from '@webaudiomodules/sdk/src/initializeWamHost.js'

/** The group a context's WAMs belong to; hand `groupId` to `createInstance`. */
export interface WamHost {
  readonly groupId: string
  /** Kept from plugins; only the host needs it (event routing across WAMs). */
  readonly groupKey: string
}

/** `initializeWamHost`'s shape, injectable for tests and alternative SDK builds. */
export type WamHostInitializer = (
  context: BaseAudioContext,
  groupId?: string,
  groupKey?: string,
) => Promise<[groupId: string, groupKey: string]>

export interface WamHostOptions {
  /** Group id plugins are created into; the SDK derives one from `performance.now()` when omitted. */
  groupId?: string
  groupKey?: string
  /** Replaces the SDK's `initializeWamHost`. */
  initialize?: WamHostInitializer
}

const hosts = new WeakMap<BaseAudioContext, Promise<WamHost>>()

/**
 * The WAM host of `context`, installed on first call and shared afterwards.
 * Options only matter on that first call; a failed installation is forgotten
 * so the next attempt retries.
 */
export function ensureWamHost(
  context: BaseAudioContext,
  options: WamHostOptions = {},
): Promise<WamHost> {
  let host = hosts.get(context)
  if (!host) {
    const initialize = options.initialize ?? initializeWamHost
    host = initialize(context, options.groupId, options.groupKey)
      .then(([groupId, groupKey]) => ({ groupId, groupKey }))
      .catch((error: unknown) => {
        hosts.delete(context)
        throw error
      })
    hosts.set(context, host)
  }
  return host
}

/** True once `ensureWamHost` has been called (and not failed) for `context`. */
export function hasWamHost(context: BaseAudioContext): boolean {
  return hosts.has(context)
}

export { initializeWamHost }
