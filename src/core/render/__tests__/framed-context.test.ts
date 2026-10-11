import { afterEach, describe, expect, it, vi } from 'vitest'

import { createWorkletNode } from '../../worklet-node'
import { createFramedOfflineContext, releaseOfflineContext } from '../framed-context'

/** A document with nothing in it but what a frame is made and kept with. */
function fakeDocument(realm: object | null = frameRealm()) {
  const attached: object[] = []
  const frame = {
    hidden: false,
    contentWindow: realm,
    removed: 0,
    remove: () => {
      frame.removed += 1
      const at = attached.indexOf(frame)
      if (at >= 0) attached.splice(at, 1)
    },
  }
  const document = {
    createElement: (tag: string) => {
      if (tag !== 'iframe') throw new Error(`unexpected <${tag}>`)
      return frame
    },
    documentElement: {
      append: (element: object) => {
        attached.push(element)
      },
    },
  }
  return { document: document as unknown as Document, attached, frame }
}

function frameRealm() {
  class OfflineAudioContext {
    constructor(
      readonly numberOfChannels: number,
      readonly length: number,
      readonly sampleRate: number,
    ) {}
  }
  class AudioWorkletNode {
    readonly realm = 'frame'
    constructor(
      readonly context: unknown,
      readonly name: string,
    ) {}
  }
  return { OfflineAudioContext, AudioWorkletNode }
}

const OPTIONS = { numberOfChannels: 2, length: 48000, sampleRate: 48000 }

describe('createFramedOfflineContext', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("makes the context with a hidden frame's own constructor, in a frame that is in the document", () => {
    const realm = frameRealm()
    const { document, attached, frame } = fakeDocument(realm)
    const context = createFramedOfflineContext(OPTIONS, document)
    expect(context).toBeInstanceOf(realm.OfflineAudioContext)
    expect(context).toMatchObject(OPTIONS)
    expect(attached).toEqual([frame])
    expect(frame.hidden).toBe(true)
  })

  it("has the context's worklet nodes made with the frame's own constructor", () => {
    const realm = frameRealm()
    const { document } = fakeDocument(realm)
    const context = createFramedOfflineContext(OPTIONS, document)
    const node = createWorkletNode(context, 'a-processor', {})
    expect(node).toBeInstanceOf(realm.AudioWorkletNode)
    expect(node).toMatchObject({ context, name: 'a-processor' })
  })

  it("leaves the page's constructor in place where the frame has none of its own", () => {
    const { OfflineAudioContext } = frameRealm()
    const { document } = fakeDocument({ OfflineAudioContext })
    const context = createFramedOfflineContext(OPTIONS, document)
    class PageWorkletNode {}
    vi.stubGlobal('AudioWorkletNode', PageWorkletNode)
    expect(createWorkletNode(context, 'a-processor', {})).toBeInstanceOf(PageWorkletNode)
  })

  it('takes the frame out of the document when the context is released, once', () => {
    const { document, attached, frame } = fakeDocument()
    const context = createFramedOfflineContext(OPTIONS, document)
    releaseOfflineContext(context)
    expect(attached).toEqual([])
    releaseOfflineContext(context)
    expect(frame.removed).toBe(1)
  })

  it('leaves no frame behind when the frame has no offline context to make', () => {
    const { document, attached } = fakeDocument({})
    expect(() => createFramedOfflineContext(OPTIONS, document)).toThrow(
      /OfflineAudioContext is not available in a frame/,
    )
    expect(attached).toEqual([])
  })

  it('releases a context it did not make by doing nothing', () => {
    const context = new (frameRealm().OfflineAudioContext)(2, 1, 48000)
    expect(() => releaseOfflineContext(context as unknown as BaseAudioContext)).not.toThrow()
  })
})
