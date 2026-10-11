// An offline context whose memory comes back. Chromium never lets go of an
// `OfflineAudioContext` that a worklet module was loaded on while the document
// it was made in lives, and the context keeps the buffer it rendered into: 23
// MB for each minute of stereo at 48 kHz, at every render of a mix with a WASM
// device or the worklet ducker in it, until the page is closed. A context made
// in a frame goes when the frame does. So this one is made in a hidden frame
// of its own, with its worklet nodes made by that frame's constructor
// (`worklet-node.ts`), and `releaseOfflineContext` takes the frame away.
//
// Two things a host has to keep to:
// - Every offline context the page loads a worklet on is made this way. After
//   one the page made itself, Chromium keeps some of the framed ones too
//   (`browser-tests/specs/render-lets-go.spec.ts`). A live `AudioContext`
//   with worklets on it does no harm.
// - What is read from the render after the release is the page's own:
//   `planarFromAudioBuffer` copies the samples out, and `renderOffline`'s
//   `audio` is that copy.

import { setWorkletNodeConstructor, type WorkletNodeConstructor } from '../worklet-node'
import { type OfflineContextFactory, type OfflineContextLike } from './OfflineRenderer'

/** What a frame's window has that a render needs. */
interface FrameRealm {
  OfflineAudioContext?: new (
    numberOfChannels: number,
    length: number,
    sampleRate: number,
  ) => OfflineContextLike
  AudioWorkletNode?: WorkletNodeConstructor
}

const frames = new WeakMap<BaseAudioContext, HTMLIFrameElement>()

/**
 * An `OfflineAudioContext` in a hidden frame of its own, for a render that
 * gives its memory back: pass it as `createContext`, and hand the context to
 * `releaseOfflineContext` once the render is read and its engine disposed.
 */
export function createFramedOfflineContext(
  options: Parameters<OfflineContextFactory>[0],
  ownerDocument: Document = document,
): OfflineContextLike {
  const frame = ownerDocument.createElement('iframe')
  frame.hidden = true
  // A frame has a window only while it is in a document.
  ownerDocument.documentElement.append(frame)
  try {
    const realm = frame.contentWindow as FrameRealm | null
    if (!realm?.OfflineAudioContext) {
      throw new Error('live-mix: OfflineAudioContext is not available in a frame here')
    }
    const context = new realm.OfflineAudioContext(
      options.numberOfChannels,
      options.length,
      options.sampleRate,
    )
    if (realm.AudioWorkletNode) setWorkletNodeConstructor(context, realm.AudioWorkletNode)
    frames.set(context, frame)
    return context
  } catch (error) {
    frame.remove()
    throw error
  }
}

/**
 * Take away the frame of a context `createFramedOfflineContext` made, and
 * with it the context and the buffer it rendered into. Nothing can be made on
 * the context afterwards. Does nothing for any other context, or a second time.
 */
export function releaseOfflineContext(context: BaseAudioContext): void {
  const frame = frames.get(context)
  if (!frame) return
  frames.delete(context)
  frame.remove()
}
