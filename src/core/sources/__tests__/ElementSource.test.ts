import { describe, expect, it } from 'vitest'

import {
  asAudioContext,
  asMediaElement,
  createMockContext,
  createMockMediaElement,
} from '../../../testing'
import { ElementSource } from '../ElementSource'

function setup(options: Partial<ConstructorParameters<typeof ElementSource>[1]> = {}) {
  const ctx = createMockContext()
  const element = createMockMediaElement({ duration: 2700 })
  const source = new ElementSource(asAudioContext(ctx), {
    id: 'bed',
    url: '/beds/forest.mp3',
    createAudioElement: () => asMediaElement(element),
    ...options,
  })
  return { ctx, element, source }
}

describe('ElementSource', () => {
  it('configures the element and attaches it to the graph once', () => {
    const { ctx, element, source } = setup()
    expect(source.kind).toBe('element')
    expect(source.id).toBe('bed')
    expect(source.url).toBe('/beds/forest.mp3')
    expect(element.src).toBe('/beds/forest.mp3')
    expect(element.crossOrigin).toBe('anonymous')
    expect(element.preload).toBe('auto')
    expect(element.loop).toBe(false)
    expect(element.autoplay).toBe(false)
    expect(ctx.elementSources).toHaveLength(1)
    expect(ctx.elementSources[0].mediaElement).toBe(element)
    expect(source.node).toBe(ctx.elementSources[0])
    expect(source.durationSec).toBe(2700)
    expect(source.isPlaying).toBe(false)
    // Browsers allow one source node per element; the mock enforces it too.
    expect(() => ctx.createMediaElementSource(element)).toThrow(/InvalidStateError/)
  })

  it('honours crossOrigin null and a preload hint', () => {
    const { element } = setup({ crossOrigin: null, preload: 'metadata' })
    expect(element.crossOrigin).toBeNull()
    expect(element.preload).toBe('metadata')
  })

  it('seek writes currentTime only when it changes and never below zero', () => {
    const { element, source } = setup()
    source.seek(12)
    source.seek(12)
    source.seek(-3)
    expect(element.seeks.calls).toEqual([[12], [0]])
  })

  it('prime seeks, forces preload auto and starts loading an idle element', () => {
    const { element, source } = setup({ preload: 'none' })
    source.prime(30)
    expect(element.preload).toBe('auto')
    expect(element.seeks.calls).toEqual([[30]])
    expect(element.loadCalls.count).toBe(1)
    // Already loading: no second load().
    source.prime(31)
    expect(element.loadCalls.count).toBe(1)
    // Playing: left alone.
    void source.play()
    source.prime(40)
    expect(element.seeks.calls).toEqual([[30], [31]])
  })

  it('unlock plays and pauses muted, restores muted, and never rejects', async () => {
    const { element, source } = setup()
    await source.unlock()
    expect(element.playCalls.count).toBe(1)
    expect(element.pauseCalls.count).toBe(1)
    expect(element.muted).toBe(false)

    const refused = setup()
    refused.element.rejectPlayWith = new Error('NotAllowedError')
    refused.element.muted = true
    await expect(refused.source.unlock()).resolves.toBeUndefined()
    expect(refused.element.muted).toBe(true)
  })

  it('unlock leaves an element that is already playing alone: it is neither muted nor paused', async () => {
    const { element, source } = setup()
    await source.play() // a voice is sounding
    const unlocking = source.unlock()
    expect(element.muted).toBe(false)
    await unlocking
    expect(source.isPlaying).toBe(true)
    expect(element.pauseCalls.count).toBe(0)
    expect(element.playCalls.count).toBe(1)
  })

  it('a play that comes while the unlock is under way is heard, and is not paused by it', async () => {
    const { element, source } = setup()
    const unlocking = source.unlock()
    expect(element.muted).toBe(true)
    const playing = source.play() // a voice whose start falls inside the same gesture
    expect(element.muted).toBe(false)
    await unlocking
    await expect(playing).resolves.toBe(true)
    expect(source.isPlaying).toBe(true)
    expect(element.pauseCalls.count).toBe(0)
    expect(element.muted).toBe(false)
  })

  it('a second unlock while the first is under way waits for the same pause', async () => {
    const { element, source } = setup()
    const first = source.unlock()
    const second = source.unlock()
    await Promise.all([first, second])
    // The second found it muted by the first, and "restored" that: every later voice was silent.
    expect(element.muted).toBe(false)
    expect(element.playCalls.count).toBe(1)
    expect(element.pauseCalls.count).toBe(1)
    expect(source.isPlaying).toBe(false)
  })

  it('play reports success or refusal instead of throwing', async () => {
    const { element, source } = setup()
    await expect(source.play()).resolves.toBe(true)
    expect(source.isPlaying).toBe(true)
    element.rejectPlayWith = new Error('NotAllowedError')
    await expect(source.play()).resolves.toBe(false)
  })

  it('dispose detaches the node and releases the media; later calls are no-ops', async () => {
    const { ctx, element, source } = setup()
    source.dispose()
    expect(ctx.elementSources[0].disconnectCalls.count).toBe(1)
    expect(element.pauseCalls.count).toBe(1)
    expect(element.src).toBe('')
    expect(element.loadCalls.count).toBe(1)
    source.dispose()
    source.seek(5)
    source.prime(5)
    await expect(source.play()).resolves.toBe(false)
    await source.unlock()
    expect(element.playCalls.count).toBe(0)
    expect(element.seeks.count).toBe(0)
  })
})
