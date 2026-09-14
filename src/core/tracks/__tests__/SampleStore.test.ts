import { describe, expect, it, vi } from 'vitest'

import { MockAudioBuffer, asAudioContext, createMockContext } from '../../../testing'
import { SampleStore, bytesOfBuffer } from '../SampleStore'

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

  it('a load forgotten or cleared while decoding is not kept', async () => {
    const ctx = createMockContext()
    const store = new SampleStore(asAudioContext(ctx))
    const pending = store.load('a', new ArrayBuffer(1))
    store.forget('a')
    await pending
    expect(store.has('a')).toBe(false)
    const cleared = store.load('b', new ArrayBuffer(1))
    store.clear()
    await cleared
    expect(store.size).toBe(0)
  })
})

// --- Eviction (U18) ---------------------------------------------------------------

const RATE = 48000
/** Stereo float PCM: 60 s ≈ 23 MB, the assessment's figure. */
const MINUTE_BYTES = 2 * 60 * RATE * 4

function minutes(seconds: number): AudioBuffer {
  return new MockAudioBuffer(2, seconds * RATE, RATE) as unknown as AudioBuffer
}

async function fill(store: SampleStore, ids: string[], seconds = 60): Promise<void> {
  for (const id of ids) await store.load(id, minutes(seconds))
}

describe('SampleStore eviction', () => {
  it('counts decoded bytes as channels × frames × 4 and never evicts by default', async () => {
    const ctx = createMockContext()
    const store = new SampleStore(asAudioContext(ctx))
    await fill(store, ['a', 'b', 'c', 'd'])
    expect(bytesOfBuffer(minutes(60))).toBe(MINUTE_BYTES)
    expect(store.get('a')?.bytes).toBe(MINUTE_BYTES)
    expect(store.get('a')?.kind).toBe('buffer')
    expect(store.bytes).toBe(4 * MINUTE_BYTES)
    expect(store.budgetBytes).toBe(Infinity)
    expect(store.metrics).toEqual({
      bytes: 4 * MINUTE_BYTES,
      budgetBytes: Infinity,
      count: 4,
      pinned: 0,
      held: 0,
      evictions: 0,
      evictedBytes: 0,
      loads: 4,
      overBudget: false,
    })
  })

  it('drops least recently used samples once a load passes the budget', async () => {
    const ctx = createMockContext()
    const store = new SampleStore(asAudioContext(ctx), { budgetBytes: 3 * MINUTE_BYTES })
    const evicted: string[] = []
    store.onEvict(({ sample, reason }) => evicted.push(`${sample.id}:${reason}`))
    await fill(store, ['a', 'b', 'c'])
    expect(store.ids()).toEqual(['a', 'b', 'c'])
    expect(evicted).toEqual([])

    await store.load('d', minutes(60))
    expect(store.ids()).toEqual(['b', 'c', 'd'])
    expect(evicted).toEqual(['a:budget'])
    expect(store.bytes).toBe(3 * MINUTE_BYTES)
    expect(store.metrics.evictions).toBe(1)
    expect(store.metrics.evictedBytes).toBe(MINUTE_BYTES)
  })

  it('get and touch mark a sample as most recently used; peek and has do not', async () => {
    const ctx = createMockContext()
    const store = new SampleStore(asAudioContext(ctx), { budgetBytes: 3 * MINUTE_BYTES })
    await fill(store, ['a', 'b', 'c'])
    store.peek('a')
    store.has('a')
    expect(store.ids()).toEqual(['a', 'b', 'c'])
    store.get('a')
    expect(store.ids()).toEqual(['b', 'c', 'a'])
    store.touch('b')
    expect(store.ids()).toEqual(['c', 'a', 'b'])
    await store.load('d', minutes(60))
    expect(store.ids()).toEqual(['a', 'b', 'd'])
    // A second `load` of a held id is a use too.
    await store.load('a', minutes(60))
    expect(store.ids()).toEqual(['b', 'd', 'a'])
    expect(ctx.decodeCalls.count).toBe(0)
  })

  it('evicts enough to fit a large load and frees several small samples for one big one', async () => {
    const ctx = createMockContext()
    const store = new SampleStore(asAudioContext(ctx), { budgetBytes: 4 * MINUTE_BYTES })
    await fill(store, ['a', 'b', 'c', 'd'])
    await store.load('long', minutes(180))
    expect(store.ids()).toEqual(['d', 'long'])
    expect(store.bytes).toBe(4 * MINUTE_BYTES)
  })

  it('a sample larger than the whole budget is admitted and everything evictable goes', async () => {
    const ctx = createMockContext()
    const store = new SampleStore(asAudioContext(ctx), { budgetBytes: 2 * MINUTE_BYTES })
    await fill(store, ['a', 'b'])
    await store.load('huge', minutes(300))
    expect(store.ids()).toEqual(['huge'])
    expect(store.metrics.overBudget).toBe(true)
  })

  it('pinned samples are skipped, and unpinning makes room again', async () => {
    const ctx = createMockContext()
    const store = new SampleStore(asAudioContext(ctx), { budgetBytes: 3 * MINUTE_BYTES })
    store.pin('a')
    expect(store.isPinned('a')).toBe(true)
    await fill(store, ['a', 'b', 'c'])
    await store.load('d', minutes(60))
    expect(store.ids()).toEqual(['a', 'c', 'd'])
    expect(store.metrics.pinned).toBe(1)
    store.pin('c')
    store.pin('d')
    await store.load('e', minutes(60))
    // Nothing evictable (the new load survives its own admission): the store
    // runs over budget rather than dropping a pin.
    expect(store.ids()).toEqual(['a', 'c', 'd', 'e'])
    expect(store.metrics.overBudget).toBe(true)
    store.unpin('c')
    expect(store.ids()).toEqual(['a', 'd', 'e'])
    expect(store.metrics.overBudget).toBe(false)
  })

  it('held samples are skipped until their last hold is released', async () => {
    const ctx = createMockContext()
    const store = new SampleStore(asAudioContext(ctx), { budgetBytes: 2 * MINUTE_BYTES })
    const releaseA1 = store.retain('a')
    const releaseA2 = store.retain('a')
    await fill(store, ['a', 'b'])
    expect(store.holds('a')).toBe(2)
    expect(store.isEvictable('a')).toBe(false)
    expect(store.isEvictable('b')).toBe(true)
    await store.load('c', minutes(60))
    expect(store.ids()).toEqual(['a', 'c'])
    await store.load('d', minutes(60))
    expect(store.ids()).toEqual(['a', 'd'])
    expect(store.metrics).toMatchObject({ held: 1, overBudget: false })

    releaseA1()
    releaseA1()
    expect(store.holds('a')).toBe(1)
    expect(store.ids()).toEqual(['a', 'd'])
    releaseA2()
    expect(store.holds('a')).toBe(0)
    // Within budget, so the release alone does not drop it …
    expect(store.ids()).toEqual(['a', 'd'])
    // … but the next load over budget does.
    await store.load('e', minutes(60))
    expect(store.ids()).toEqual(['d', 'e'])
  })

  it('a release while over budget evicts at once', async () => {
    const ctx = createMockContext()
    const store = new SampleStore(asAudioContext(ctx), { budgetBytes: MINUTE_BYTES })
    const release = store.retain('a')
    await fill(store, ['a', 'b'])
    expect(store.ids()).toEqual(['a', 'b'])
    expect(store.metrics.overBudget).toBe(true)
    release()
    expect(store.ids()).toEqual(['b'])
    expect(store.metrics.overBudget).toBe(false)
  })

  it('evictOnRelease drops a sample the moment its last hold goes, unless pinned', async () => {
    const ctx = createMockContext()
    const store = new SampleStore(asAudioContext(ctx), { evictOnRelease: true })
    const evicted: string[] = []
    store.onEvict(({ sample, reason }) => evicted.push(`${sample.id}:${reason}`))
    const releaseA = store.retain('a')
    const releaseB = store.retain('b')
    store.pin('b')
    await fill(store, ['a', 'b', 'c'])
    releaseA()
    releaseB()
    expect(store.ids()).toEqual(['b', 'c'])
    expect(evicted).toEqual(['a:release'])
    // Never held: stays (no budget to push it out).
    expect(store.has('c')).toBe(true)
    // A re-load after eviction decodes again and counts as another load.
    await store.load('a', new ArrayBuffer(1))
    expect(ctx.decodeCalls.count).toBe(1)
    expect(store.metrics.loads).toBe(4)
  })

  it('lowering the budget evicts immediately; evict() reports what it dropped', async () => {
    const ctx = createMockContext()
    const store = new SampleStore(asAudioContext(ctx))
    await fill(store, ['a', 'b', 'c', 'd'])
    expect(store.evict()).toEqual([])
    store.budgetBytes = 2 * MINUTE_BYTES
    expect(store.ids()).toEqual(['c', 'd'])
    store.pin('c')
    store.budgetBytes = MINUTE_BYTES
    expect(store.ids()).toEqual(['c'])
    store.budgetBytes = 0
    expect(store.ids()).toEqual(['c'])
    store.unpin('c')
    expect(store.size).toBe(0)
    expect(store.metrics.evictions).toBe(4)
    expect(store.metrics.evictedBytes).toBe(4 * MINUTE_BYTES)
  })

  it('forget clears pins and holds and is not counted as an eviction; clear resets bytes', async () => {
    const ctx = createMockContext()
    const store = new SampleStore(asAudioContext(ctx), { budgetBytes: 10 * MINUTE_BYTES })
    store.pin('a')
    store.retain('a')
    await fill(store, ['a', 'b'])
    store.forget('a')
    expect(store.isPinned('a')).toBe(false)
    expect(store.holds('a')).toBe(0)
    expect(store.bytes).toBe(MINUTE_BYTES)
    expect(store.metrics.evictions).toBe(0)
    store.clear()
    expect(store.bytes).toBe(0)
    expect(store.metrics).toMatchObject({ bytes: 0, count: 0, pinned: 0, held: 0 })
  })

  it('a 45-minute playlist stays under budget: only the recent tracks remain', async () => {
    const ctx = createMockContext()
    const store = new SampleStore(asAudioContext(ctx), { budgetBytes: 200 * 1024 * 1024 })
    const trackSeconds = 180
    const trackBytes = 2 * trackSeconds * RATE * 4
    for (let i = 0; i < 15; i += 1) {
      const id = `track-${i}`
      const release = store.retain(id)
      await store.load(id, minutes(trackSeconds))
      store.get(id)
      release()
    }
    const kept = Math.floor((200 * 1024 * 1024) / trackBytes)
    expect(store.size).toBe(kept)
    expect(store.bytes).toBeLessThanOrEqual(200 * 1024 * 1024)
    expect(store.ids()).toEqual(Array.from({ length: kept }, (_, i) => `track-${15 - kept + i}`))
    expect(store.metrics.evictions).toBe(15 - kept)
    expect(store.metrics.overBudget).toBe(false)
  })

  it('onEvict unsubscribes', async () => {
    const ctx = createMockContext()
    const store = new SampleStore(asAudioContext(ctx), { budgetBytes: MINUTE_BYTES })
    const seen: string[] = []
    const off = store.onEvict(({ sample }) => seen.push(sample.id))
    await fill(store, ['a', 'b'])
    off()
    await store.load('c', minutes(60))
    expect(seen).toEqual(['a'])
  })
})
