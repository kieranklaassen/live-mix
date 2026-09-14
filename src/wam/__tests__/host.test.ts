import { describe, expect, it } from 'vitest'

import { asAudioContext, createMockContext } from '../../testing'
import { ensureWamHost, hasWamHost, initializeWamHost } from '../host'
import { fakeHostInitializer } from './fake-wam'

describe('ensureWamHost', () => {
  it('installs the SDK host (WamEnv + WamGroup: two worklet modules) on the context', async () => {
    const ctx = createMockContext()
    const host = await ensureWamHost(asAudioContext(ctx), { groupId: 'live-mix', groupKey: 'k' })
    expect(host).toEqual({ groupId: 'live-mix', groupKey: 'k' })
    expect(ctx.audioWorklet.modules).toHaveLength(2)
    for (const url of ctx.audioWorklet.modules) expect(url).toMatch(/^blob:/)
  })

  it('derives ids from the SDK when none are given', async () => {
    const ctx = createMockContext()
    const [groupId, groupKey] = await initializeWamHost(asAudioContext(ctx))
    expect(groupId).toMatch(/^wam-host-/)
    expect(groupKey.length).toBeGreaterThan(0)
  })

  it('is one host per context: later calls share the first, options included', async () => {
    const ctx = createMockContext()
    const { initialize, calls } = fakeHostInitializer()
    const first = ensureWamHost(asAudioContext(ctx), { initialize, groupId: 'a' })
    const second = ensureWamHost(asAudioContext(ctx), { initialize, groupId: 'b' })
    expect(await first).toEqual(await second)
    expect(calls.count).toBe(1)
    expect(calls.last?.[1]).toBe('a')
    expect(hasWamHost(asAudioContext(ctx))).toBe(true)

    const other = createMockContext()
    expect(hasWamHost(asAudioContext(other))).toBe(false)
    await ensureWamHost(asAudioContext(other), { initialize })
    expect(calls.count).toBe(2)
  })

  it('forgets a failed installation so the next call retries', async () => {
    const ctx = createMockContext()
    let attempts = 0
    const initialize = (): Promise<[string, string]> => {
      attempts += 1
      return attempts === 1 ? Promise.reject(new Error('no worklet')) : Promise.resolve(['g', 'k'])
    }
    await expect(ensureWamHost(asAudioContext(ctx), { initialize })).rejects.toThrow('no worklet')
    expect(hasWamHost(asAudioContext(ctx))).toBe(false)
    await expect(ensureWamHost(asAudioContext(ctx), { initialize })).resolves.toEqual({
      groupId: 'g',
      groupKey: 'k',
    })
    expect(attempts).toBe(2)
  })
})
