import { describe, expect, it } from 'vitest'

import { NativeHostClient } from '../HostClient'
import { NativeLink } from '../NativeLink'
import { linkPhase } from '../link-time'
import { FAKE_HOST_ADDRESS, FakePluginHost } from '../../testing/fake-plugin-host'

/** A page clock and a host clock a test moves by hand: the host runs 7 s ahead. */
function clocks() {
  const time = { ms: 1000 }
  return {
    time,
    now: () => time.ms,
    hostClock: () => Math.round(time.ms * 1000) + 7_000_000,
  }
}

async function open(options: { link?: boolean } = {}) {
  const { time, now, hostClock } = clocks()
  const host = new FakePluginHost({ linkClock: hostClock, link: options.link })
  const client = await NativeHostClient.connect(FAKE_HOST_ADDRESS, {
    createSocket: host.createSocket,
  })
  const link = await NativeLink.open(client, { now, syncIntervalMs: 0 })
  return { host, client, link, time }
}

describe('NativeLink', () => {
  it('reads the session and measures the clock when it opens', async () => {
    const { host, link } = await open()
    expect(link.available).toBe(true)
    expect(link.state).toMatchObject({ enabled: false, peers: 0, bpm: 120, quantum: 4 })
    expect(host.calls('linkPing')).toHaveLength(6)
    expect(link.clock.offsetMicros).toBe(7_000_000)
    expect(link.hostMicrosAt(2000)).toBe(9_000_000)
  })

  it('says so when the host has no Link, and asks it nothing', async () => {
    const { host, link } = await open({ link: false })
    expect(link.available).toBe(false)
    expect(host.calls('link')).toHaveLength(0)
    expect(await link.set({ enabled: true })).toMatchObject({ available: false, enabled: false })
    expect(await link.start(0)).toBe(1000)
    await link.stop()
    expect(host.calls('linkStart')).toHaveLength(0)
  })

  it('changes what it is asked to and keeps the answer', async () => {
    const { link } = await open()
    const seen: number[] = []
    link.onChange((state) => seen.push(state.bpm))
    const state = await link.set({ enabled: true, name: 'Ambient Live', bpm: 98 })
    expect(state).toMatchObject({ enabled: true, name: 'Ambient Live', bpm: 98 })
    expect(link.state.bpm).toBe(98)
    expect(seen).toEqual([98])
  })

  it('counts beats on the page clock by the tempo', async () => {
    const { link, time } = await open()
    await link.set({ enabled: true, bpm: 120 })
    const from = link.beatAt()
    time.ms += 1500
    expect(link.beatAt() - from).toBeCloseTo(3, 9)
    expect(link.localMsAtBeat(from + 4)).toBeCloseTo(1000 + 2000, 6)
  })

  it('follows what peers do', async () => {
    const { host, link, time } = await open()
    await link.set({ enabled: true })
    const changes: [number, number][] = []
    link.onChange((state, previous) => changes.push([previous.peers, state.peers]))

    host.link.peerJoins({ bpm: 96 })
    expect(link.state).toMatchObject({ peers: 1, bpm: 96 })
    expect(changes).toEqual([[0, 1]])
    // The event's own name is not part of the state.
    expect('event' in link.state).toBe(false)

    const before = link.beatAt()
    host.link.peerSetsTempo(60)
    time.ms += 1000
    expect(link.beatAt() - before).toBeCloseTo(1, 9)
  })

  it('alone, a beat asked for now falls now', async () => {
    const { link, time } = await open()
    await link.set({ enabled: true })
    time.ms += 123
    const at = await link.start(16)
    expect(at).toBe(1123)
    expect(link.beatAt(at)).toBeCloseTo(16, 9)
  })

  it('is refused a start at a beat that is no number, as the host refuses it', async () => {
    const { link, time } = await open()
    await link.set({ enabled: true })
    await link.start(16)
    time.ms += 500
    await expect(link.start(Number.NaN)).rejects.toThrow('linkStart needs a beat')
    await expect(link.followStart(Number.NaN)).rejects.toThrow('linkStart needs a beat')
    // The beat is where the tempo has carried it, not at 0.
    expect(link.beatAt()).toBeCloseTo(17, 9)
    expect((await link.refresh()).beat).toBeCloseTo(17, 9)
  })

  it('in a session, a beat asked for now waits for its place in the bar', async () => {
    const { host, link, time } = await open()
    await link.set({ enabled: true })
    host.link.peerJoins()
    time.ms += 700 // 1.4 beats in at 120 bpm
    const phaseNow = linkPhase(link.beatAt(), 4)
    const at = await link.start(64)
    // The next downbeat: what is left of the bar, at half a second a beat.
    expect(at - time.ms).toBeCloseTo((4 - phaseNow) * 500, 3)
    expect(link.beatAt(at)).toBeCloseTo(64, 6)
    // The bar itself did not move for anybody.
    expect(linkPhase(link.beatAt(), 4)).toBeCloseTo(phaseNow, 6)
  })

  it('shares start and stop', async () => {
    const { host, link, time } = await open()
    await link.set({ enabled: true, startStopSync: true })
    host.link.peerJoins()

    // We start: the session is told.
    await link.start(0, { playing: true })
    expect(link.state.playing).toBe(true)
    await link.stop()
    expect(link.state.playing).toBe(false)

    // A peer starts: we hear it, and find where our beat 8 falls for that start.
    const heard: boolean[] = []
    link.onChange((state) => heard.push(state.playing))
    time.ms += 300
    host.link.peerStarts()
    expect(heard).toEqual([true])
    const at = await link.followStart(8)
    expect(at).toBeGreaterThanOrEqual(time.ms)
    expect(at - time.ms).toBeLessThanOrEqual(2000)
    expect(link.beatAt(at)).toBeCloseTo(8, 6)

    host.link.peerStops()
    expect(link.state.playing).toBe(false)
  })

  it('does not hear a peer start without start/stop sync', async () => {
    const { host, link } = await open()
    await link.set({ enabled: true })
    host.link.peerJoins()
    host.link.peerStarts()
    expect(link.state.playing).toBe(false)
  })

  it('goes idle when the host goes away, and quiet when disposed', async () => {
    const { host, client, link } = await open()
    await link.set({ enabled: true, bpm: 77 })
    host.link.peerJoins()
    let calls = 0
    link.onChange(() => (calls += 1))
    host.socket.close()
    expect(client.closed).toBe(true)
    expect(link.state).toMatchObject({ enabled: false, peers: 0, bpm: 77 })
    expect(calls).toBe(1)

    link.dispose()
    host.link.peerSetsTempo(140)
    expect(calls).toBe(1)
  })

  it('measures the clock again on a timer until disposed', async () => {
    const { now, hostClock } = clocks()
    const host = new FakePluginHost({ linkClock: hostClock })
    const client = await NativeHostClient.connect(FAKE_HOST_ADDRESS, {
      createSocket: host.createSocket,
    })
    let tick: (() => void) | null = null
    let cleared = false
    const link = await NativeLink.open(client, {
      now,
      firstSyncs: 1,
      setIntervalFn: (callback) => {
        tick = callback
        return 1 as unknown as ReturnType<typeof setInterval>
      },
      clearIntervalFn: () => {
        cleared = true
      },
    })
    expect(host.calls('linkPing')).toHaveLength(1)
    ;(tick as unknown as () => void)()
    await Promise.resolve()
    expect(host.calls('linkPing')).toHaveLength(2)
    link.dispose()
    expect(cleared).toBe(true)
  })
})
