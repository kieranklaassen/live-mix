// `new AudioWorkletNode(...)` for every worklet host in the library (WASM
// devices, the worklet ducker, the LUFS meter, the recorder, hosted plug-ins
// and the Link taps), with the constructor the node's context was given.
//
// The page's own constructor is right for a context the page made. A context
// made in another frame wants that frame's. A render that should give its
// memory back is made in a frame that is removed afterwards
// (`render/framed-context.ts`), and in Electron 44 on a Mac such a context
// was let go only when its worklet nodes were made by the frame's constructor
// as well (measured in Everycut, 2026-10-08; Chromium 141 on Linux lets go
// with either). A host that makes a frame of its own says which constructor
// with `setWorkletNodeConstructor`.

export type WorkletNodeConstructor = new (
  context: BaseAudioContext,
  name: string,
  options?: AudioWorkletNodeOptions,
) => AudioWorkletNode

const constructors = new WeakMap<BaseAudioContext, WorkletNodeConstructor>()

/**
 * Have every worklet node the library makes on `context` made with
 * `constructor`: the `AudioWorkletNode` of the frame the context was made in.
 * A `createNode` handed to one device still wins for that device.
 */
export function setWorkletNodeConstructor(
  context: BaseAudioContext,
  constructor: WorkletNodeConstructor,
): void {
  constructors.set(context, constructor)
}

/** A worklet node on `context`, made with the constructor it was given or else the page's. */
export function createWorkletNode(
  context: BaseAudioContext,
  name: string,
  options: AudioWorkletNodeOptions,
): AudioWorkletNode {
  const Constructor = constructors.get(context) ?? AudioWorkletNode
  return new Constructor(context, name, options)
}
