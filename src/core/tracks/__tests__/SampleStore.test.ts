import { describe, expect, it, vi } from 'vitest'

import { MockAudioBuffer, asAudioContext, createMockContext } from '../../../testing'
import { SampleStore } from '../SampleStore'

const okFetch = vi.fn(async (url: string) => ({
  ok: true,
  status: 200,
  arrayBuffer: async () => new ArrayBuffer(url.length),
})) as unknown as typeof fetch

describe('SampleStore', () => {
  it('fetches, decodes and caches by id; repeated loads share one promise', async () => {
    const ctx = createMockContext()
    const store = new SampleStore(asAudioContext(ctx), { fetchImpl: okFetch })
    const first = store.load('a', '/music/a.mp3')
    const second = store.load('a', '/music/a.mp3')
    expect(second).toBe(first)
    expect(store.loading('a')).toBe(first)
    const sample = await first
    expect(sample.id).toBe('a')
    expect(sample.durationSec).toBe('/music/a.mp3'.length)
    expect(sample.peaks).toBeNull()
    expect(store.get('a')).toBe(sample)
    expect(store.has('a')).toBe(true)
    expect(store.loading('a')).toBeUndefined()
    expect(ctx.decodeCalls.count).toBe(1)
    await store.load('a', '/music/a.mp3')
    expect(ctx.decodeCalls.count).toBe(1)
    expect(store.size).toBe(1)
  })

  it('decodes ArrayBuffers and accepts pre-decoded buffers', async () => {
    const ctx = createMockContext()
    const store = new SampleStore(asAudioContext(ctx))
    const fromBytes = await store.load('bytes', new ArrayBuffer(3))
    expect(fromBytes.durationSec).toBe(3)
    const decoded = new MockAudioBuffer(1, 4410, 44100)
    const fromBuffer = await store.load('buf', decoded as unknown as AudioBuffer)
    expect(fromBuffer.buffer).toBe(decoded)
    expect(fromBuffer.durationSec).toBeCloseTo(0.1)
    expect(ctx.decodeCalls.count).toBe(1)
  })

  it('computes waveform peaks at decode time when asked', async () => {
    const ctx = createMockContext()
    const store = new SampleStore(asAudioContext(ctx), { peaks: 16 })
    const decoded = new MockAudioBuffer(1, 1000, 44100)
    decoded.getChannelData(0).set(Float32Array.from({ length: 1000 }, (_, i) => i / 999))
    const sample = await store.load('ramp', decoded as unknown as AudioBuffer)
    expect(sample.peaks?.min).toHaveLength(16)
    expect(sample.peaks?.max[15]).toBeCloseTo(1, 2)

    const defaulted = new SampleStore(asAudioContext(ctx), { peaks: true })
    const withDefault = await defaulted.load('x', new ArrayBuffer(1))
    expect(withDefault.peaks?.min).toHaveLength(512)
  })

  it('a failed fetch rejects, is forgotten, and can be retried', async () => {
    const ctx = createMockContext()
    let attempts = 0
    const flaky = vi.fn(async () => {
      attempts += 1
      return attempts === 1
        ? { ok: false, status: 500, arrayBuffer: async () => new ArrayBuffer(0) }
        : { ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(2) }
    }) as unknown as typeof fetch
    const store = new SampleStore(asAudioContext(ctx), { fetchImpl: flaky })
    await expect(store.load('a', '/a.mp3')).rejects.toThrow(/500/)
    expect(store.has('a')).toBe(false)
    expect(store.loading('a')).toBeUndefined()
    const retried = await store.load('a', '/a.mp3')
    expect(retried.durationSec).toBe(2)
  })

  it('forget and clear drop decoded samples', async () => {
    const ctx = createMockContext()
    const store = new SampleStore(asAudioContext(ctx))
    await store.load('a', new ArrayBuffer(1))
    await store.load('b', new ArrayBuffer(1))
    store.forget('a')
    expect(store.has('a')).toBe(false)
    expect(store.has('b')).toBe(true)
    store.clear()
    expect(store.size).toBe(0)
  })
})
