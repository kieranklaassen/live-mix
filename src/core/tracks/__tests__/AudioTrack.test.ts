import { describe, expect, it, vi } from 'vitest'

import {
  MockAudioBuffer,
  asAudioContext,
  createMockContext,
  type MockAudioContext,
} from '../../../testing'
import { equalPowerFadeIn, equalPowerFadeOut } from '../../clips/curves'
import { fadeGain } from '../../clips/fade'
import { type Clip } from '../../clips/Clip'
import { REJOIN_FADE_SECONDS, Scheduler } from '../../transport/Scheduler'
import { Transport } from '../../transport/Transport'
import {
  AudioTrack,
  CROSSFADE_SECONDS,
  JOIN_EASE_SECONDS,
  MAX_CLIP_GAIN_DB,
  MIN_PLACED_GAIN_DB,
  PLACEMENT_RAMP_SECONDS,
  STEER_CROSSFADE_SECONDS,
  STOP_FADE_SECONDS,
  placedTrimGain,
  trimGain,
} from '../AudioTrack'
import { SampleStore } from '../SampleStore'

function setup(options: { currentTime?: number; lookaheadSec?: number; preloadSec?: number } = {}) {
  const ctx = createMockContext({ currentTime: options.currentTime ?? 0, sampleRate: 48000 })
  const dest = ctx.createGain()
  const samples = new SampleStore(asAudioContext(ctx))
  const track = new AudioTrack(asAudioContext(ctx), {
    name: 'music',
    destination: dest as unknown as AudioNode,
    samples,
    now: () => ctx.currentTime,
    lookaheadSec: options.lookaheadSec,
    preloadSec: options.preloadSec,
  })
  return { ctx, dest, samples, track }
}

function buffer(ctx: MockAudioContext, seconds: number): AudioBuffer {
  return new MockAudioBuffer(2, seconds * ctx.sampleRate, ctx.sampleRate) as unknown as AudioBuffer
}

describe('AudioTrack linear voices (ambient-live ClipPlayer parity)', () => {
  it('records exactly the ClipPlayer.play events for an on-time start with fades', () => {
    const { ctx, dest, track } = setup()
    const buf = buffer(ctx, 10)
    const voice = track.play(
      'k',
      {
        buffer: buf,
        offsetSec: 1,
        durationSec: 6,
        fadeInSec: 2,
        fadeOutSec: 1,
        fadeCurve: 'linear',
      },
      3,
    )
    expect(voice).not.toBeNull()
    const source = ctx.sources[0]
    const gain = ctx.gains[1]
    expect(source.buffer).toBe(buf)
    expect(source.connectCalls.calledWith(gain)).toBe(true)
    expect(gain.connectCalls.calledWith(dest)).toBe(true)
    expect(ctx.gains).toHaveLength(2)
    expect(gain.gain.events).toEqual([
      { method: 'setValueAtTime', args: [fadeGain(0, 6, 2, 1), 3] },
      { method: 'linearRampToValueAtTime', args: [1, 5] },
      { method: 'setValueAtTime', args: [1, 8] },
      { method: 'linearRampToValueAtTime', args: [0, 9] },
    ])
    expect(source.startCalls.calls).toEqual([[3, 1, 6]])
    expect(source.stopCalls.count).toBe(0)
    expect(voice?.startTime).toBe(3)
    expect(voice?.endTime).toBe(9)
  })

  it('joins a start that has passed partway in, keeping the drawn fade slope', () => {
    const { ctx, track } = setup({ currentTime: 4.5 })
    track.play(
      'k',
      {
        buffer: buffer(ctx, 10),
        offsetSec: 1,
        durationSec: 6,
        fadeInSec: 2,
        fadeOutSec: 1,
        fadeCurve: 'linear',
      },
      3,
    )
    const source = ctx.sources[0]
    const gain = ctx.gains[1]
    // late = 1.5: start at 4.5, offset 2.5, remaining 4.5; fade-in ends at 5.
    expect(source.startCalls.calls).toEqual([[4.5, 2.5, 4.5]])
    expect(gain.gain.events[0]).toEqual({
      method: 'setValueAtTime',
      args: [fadeGain(1.5, 6, 2, 1), 4.5],
    })
    expect(gain.gain.events[1]).toEqual({ method: 'linearRampToValueAtTime', args: [1, 5] })
  })

  it('returns null and creates nothing when the start is entirely in the past', () => {
    const { ctx, track } = setup({ currentTime: 20 })
    const voice = track.play(
      'k',
      {
        buffer: buffer(ctx, 10),
        offsetSec: 0,
        durationSec: 6,
        fadeInSec: 0,
        fadeOutSec: 0,
        fadeCurve: 'linear',
      },
      3,
    )
    expect(voice).toBeNull()
    expect(ctx.sources).toHaveLength(0)
    expect(track.voices()).toHaveLength(0)
  })

  it('no fades: a single unity setValueAtTime and no ramps', () => {
    const { ctx, track } = setup()
    track.play(
      'k',
      {
        buffer: buffer(ctx, 10),
        offsetSec: 0,
        durationSec: 6,
        fadeInSec: 0,
        fadeOutSec: 0,
        fadeCurve: 'linear',
      },
      3,
    )
    expect(ctx.gains[1].gain.events).toEqual([{ method: 'setValueAtTime', args: [1, 3] }])
  })

  it('stopPending silences only voices that have not started and returns their keys', () => {
    const { ctx, track } = setup({ currentTime: 0 })
    const opts = {
      buffer: buffer(ctx, 10),
      offsetSec: 0,
      durationSec: 6,
      fadeInSec: 0,
      fadeOutSec: 0,
      fadeCurve: 'linear' as const,
    }
    track.play('sounding', opts, 0)
    track.play('pending', opts, 2)
    ctx.currentTime = 1
    expect(track.stopPending()).toEqual(['pending'])
    expect(ctx.sources[1].stopCalls.calls).toEqual([[]])
    expect(ctx.sources[1].disconnectCalls.count).toBe(1)
    expect(ctx.gains[2].disconnectCalls.count).toBe(1)
    expect(ctx.sources[1].onended).toBeNull()
    expect(ctx.sources[0].stopCalls.count).toBe(0)
    expect(track.voices().map((v) => v.key)).toEqual(['sounding'])
  })

  it('stop(key) silences immediately; stopAll() silences everything; onended forgets a voice', () => {
    const { ctx, track } = setup()
    const opts = {
      buffer: buffer(ctx, 10),
      offsetSec: 0,
      durationSec: 6,
      fadeInSec: 0,
      fadeOutSec: 0,
      fadeCurve: 'linear' as const,
    }
    track.play('a', opts, 0)
    track.play('b', opts, 1)
    track.play('c', opts, 2)
    track.stop('a')
    expect(ctx.sources[0].stopCalls.calls).toEqual([[]])
    expect(track.voice('a')).toBeUndefined()
    ctx.sources[1].finish()
    expect(track.voice('b')).toBeUndefined()
    expect(ctx.sources[1].disconnectCalls.count).toBe(1)
    track.stopAll()
    expect(ctx.sources[2].stopCalls.calls).toEqual([[]])
    expect(track.voices()).toHaveLength(0)
  })

  it('loop clips set source.loop over the offset and stop at the clip end', () => {
    const { ctx, track } = setup()
    const buf = buffer(ctx, 4)
    track.play(
      'k',
      {
        buffer: buf,
        offsetSec: 0.5,
        durationSec: 10,
        fadeInSec: 0,
        fadeOutSec: 0,
        fadeCurve: 'linear',
        loop: true,
      },
      1,
    )
    const source = ctx.sources[0]
    expect(source.loop).toBe(true)
    expect(source.loopStart).toBe(0.5)
    expect(source.loopEnd).toBe(4)
    expect(source.startCalls.calls).toEqual([[1, 0.5]])
    expect(source.stopCalls.calls).toEqual([[11]])

    // An explicit loop region is honoured with the entry offset inside it (legato launches).
    track.play(
      'region',
      {
        buffer: buffer(ctx, 4),
        offsetSec: 2.5,
        durationSec: 10,
        fadeInSec: 0,
        fadeOutSec: 0,
        fadeCurve: 'linear',
        loop: true,
        loopStartSec: 1,
        loopEndSec: 3,
      },
      1,
    )
    const region = ctx.sources[1]
    expect(region.loopStart).toBe(1)
    expect(region.loopEnd).toBe(3)
    expect(region.startCalls.calls).toEqual([[1, 2.5]])

    // A late join wraps into the region instead of running past its end onto the source tail.
    ctx.currentTime = 4.5
    track.play(
      'late',
      {
        buffer: buffer(ctx, 4),
        offsetSec: 1,
        durationSec: 10,
        fadeInSec: 0,
        fadeOutSec: 0,
        fadeCurve: 'linear',
        loop: true,
        loopStartSec: 1,
        loopEndSec: 3,
      },
      2, // 2.5 s late: 1 + 2.5 = 3.5 → 1.5 inside [1, 3)
    )
    expect(ctx.sources[2].startCalls.calls).toEqual([[4.5, 1.5]])
  })
})

describe('AudioTrack equal-power voices (Breathwork Live scheduleEntry parity)', () => {
  const entry = (ctx: MockAudioContext, gainDb?: number) => ({
    buffer: buffer(ctx, 10),
    offsetSec: 0,
    durationSec: 10,
    fadeInSec: CROSSFADE_SECONDS,
    fadeOutSec: CROSSFADE_SECONDS,
    fadeCurve: 'equalPower' as const,
    gainDb,
  })

  it('records exactly the scheduleEntry events, gain created before source', () => {
    const { ctx, dest, track } = setup()
    track.play('a', entry(ctx), 0)
    const gain = ctx.gains[1]
    const source = ctx.sources[0]
    expect(gain.gain.events.map((e) => e.method)).toEqual([
      'setValueAtTime',
      'setValueCurveAtTime',
      'setValueCurveAtTime',
    ])
    expect(gain.gain.events[0].args).toEqual([0, 0])
    const [fadeIn, fadeOut] = gain.gain.eventsFor('setValueCurveAtTime')
    expect(fadeIn.args[0]).toEqual(equalPowerFadeIn())
    expect(fadeIn.args.slice(1)).toEqual([0, CROSSFADE_SECONDS])
    expect(fadeOut.args[0]).toEqual(equalPowerFadeOut())
    expect(fadeOut.args.slice(1)).toEqual([10 - CROSSFADE_SECONDS, CROSSFADE_SECONDS])
    // Absent gainDb connects straight through at unity — no trim node.
    expect(ctx.gains).toHaveLength(2)
    expect(gain.connectCalls.calledWith(dest)).toBe(true)
    expect(source.connectCalls.calledWith(gain)).toBe(true)
    expect(source.startCalls.calls).toEqual([[0]])
    expect(source.stopCalls.calls).toEqual([[10]])
  })

  it('chains the fade gain through a 10^(gainDb/20) trim node clamped at ±12 dB', () => {
    const { ctx, dest, track } = setup()
    track.play('a', entry(ctx, -6), 0)
    const fade = ctx.gains[1]
    const trim = ctx.gains[2]
    expect(trim.gain.value).toBeCloseTo(0.501, 3)
    expect(fade.connectCalls.calledWith(trim)).toBe(true)
    expect(trim.connectCalls.calledWith(dest)).toBe(true)
    expect(fade.connectCalls.calledWith(dest)).toBe(false)

    track.play('loud', entry(ctx, 40), 0)
    expect(ctx.gains[4].gain.value).toBeCloseTo(10 ** (MAX_CLIP_GAIN_DB / 20), 6)
    expect(trimGain(-40)).toBeCloseTo(10 ** (-MAX_CLIP_GAIN_DB / 20), 6)
    expect(trimGain(undefined)).toBe(1)
  })

  it('a start that has passed plays from now (max(startAt, now)), fades relative to now', () => {
    const { ctx, track } = setup({ currentTime: 2 })
    track.play('r', { ...entry(ctx), durationSec: 20 }, 1.5)
    const source = ctx.sources[0]
    const gain = ctx.gains[1]
    expect(source.startCalls.calls).toEqual([[2]])
    expect(source.stopCalls.calls).toEqual([[22]])
    expect(gain.gain.events[0].args).toEqual([0, 2])
    expect(gain.gain.eventsFor('setValueCurveAtTime')[1].args.slice(1)).toEqual([
      22 - CROSSFADE_SECONDS,
      CROSSFADE_SECONDS,
    ])
  })

  it('fadeOut on a sounding voice cancels, applies the fade-out curve and stops after it', () => {
    const { ctx, track } = setup()
    track.play('a', entry(ctx), 0)
    track.play('pending', entry(ctx), 7.5)
    ctx.currentTime = 2
    track.fadeOut('a', 2, CROSSFADE_SECONDS)
    track.fadeOut('pending', 2, CROSSFADE_SECONDS)
    const gainA = ctx.gains[1]
    expect(gainA.gain.eventsFor('cancelScheduledValues')).toEqual([
      { method: 'cancelScheduledValues', args: [2] },
    ])
    const fade = gainA.gain.eventsFor('setValueCurveAtTime')[2]
    expect(fade.args[0]).toEqual(equalPowerFadeOut())
    expect(fade.args.slice(1)).toEqual([2, CROSSFADE_SECONDS])
    expect(ctx.sources[0].stopCalls.last).toEqual([2 + CROSSFADE_SECONDS])
    expect(track.voice('a')?.endTime).toBe(2 + CROSSFADE_SECONDS)
    // Scheduled but not yet sounding: silenced outright at `at`.
    expect(ctx.sources[1].stopCalls.last).toEqual([2])
    expect(ctx.gains[2].gain.eventsFor('cancelScheduledValues')).toHaveLength(0)
  })

  it('stopAll({ at }) stops every source at `at` without disconnecting (engine stop fade)', () => {
    const { ctx, track } = setup()
    track.play('a', entry(ctx), 0)
    track.play('b', entry(ctx), 7.5)
    ctx.currentTime = 1
    track.stopAll({ at: 1 + STOP_FADE_SECONDS })
    expect(ctx.sources[0].stopCalls.last).toEqual([1.75])
    expect(ctx.sources[1].stopCalls.last).toEqual([1.75])
    expect(ctx.sources[0].disconnectCalls.count).toBe(0)
    expect(track.voices()).toHaveLength(2)
  })

  it('offsetSec > 0 passes the offset to start; a loop flag sets source.loop', () => {
    const { ctx, track } = setup()
    track.play('a', { ...entry(ctx), offsetSec: 3, loop: true }, 1)
    expect(ctx.sources[0].startCalls.calls).toEqual([[1, 3]])
    expect(ctx.sources[0].loop).toBe(true)
  })
})

describe('AudioTrack as Schedulables', () => {
  function clip(id: string, startSec: number, extra: Partial<Clip> = {}): Clip {
    return {
      id,
      sourceId: `s-${id}`,
      startSec,
      offsetSec: 0,
      durationSec: 4,
      fadeInSec: 0,
      fadeOutSec: 0,
      fadeCurve: 'linear',
      gainDb: 0,
      ...extra,
    }
  }

  function scheduled(options: { lookaheadSec?: number; preloadSec?: number; loop?: boolean } = {}) {
    const { ctx, samples, track, dest } = setup({
      lookaheadSec: options.lookaheadSec ?? 0.2,
      preloadSec: options.preloadSec,
    })
    const transport = new Transport({
      now: () => ctx.currentTime,
      loop: options.loop ? { enabled: true, lengthSec: 32 } : undefined,
    })
    const scheduler = new Scheduler({ transport, tickMs: 40 })
    track.attach(scheduler)
    return { ctx, samples, track, dest, transport, scheduler }
  }

  it('plays clips once as they enter the lookahead window, keyed clipId:iteration:startSec', async () => {
    const { ctx, samples, track, transport, scheduler } = scheduled()
    await samples.load('s-a', buffer(ctx, 10))
    track.clips.add(clip('a', 1))
    transport.start()
    scheduler.tick()
    expect(ctx.sources).toHaveLength(0)
    ctx.currentTime = 0.85
    scheduler.tick()
    scheduler.tick()
    expect(ctx.sources).toHaveLength(1)
    expect(ctx.sources[0].startCalls.calls).toEqual([[1, 0, 4]])
    expect(track.voice('a:0:1.000')).toBeDefined()
    scheduler.dispose()
  })

  it('declines a clip whose sample is not decoded and picks it up once it is', async () => {
    const { ctx, samples, track, transport, scheduler } = scheduled()
    track.clips.add(clip('a', 0.1))
    transport.start()
    scheduler.tick()
    expect(ctx.sources).toHaveLength(0)
    await samples.load('s-a', buffer(ctx, 10))
    scheduler.tick()
    expect(ctx.sources).toHaveLength(1)
    scheduler.dispose()
  })

  it('preloads through resolveSource inside preloadSec, ahead of the playback window', async () => {
    const ctx = createMockContext({ sampleRate: 48000 })
    const dest = ctx.createGain()
    const samples = new SampleStore(asAudioContext(ctx))
    const requested: string[] = []
    const track = new AudioTrack(asAudioContext(ctx), {
      name: 'music',
      destination: dest as unknown as AudioNode,
      samples,
      now: () => ctx.currentTime,
      lookaheadSec: 5,
      preloadSec: 12,
      resolveSource: (c) => {
        requested.push(c.id)
        return new ArrayBuffer(10)
      },
    })
    const transport = new Transport({ now: () => ctx.currentTime })
    const scheduler = new Scheduler({ transport })
    track.attach(scheduler)
    track.clips.add(clip('far', 10))
    track.clips.add(clip('later', 20))
    transport.start()
    scheduler.tick()
    expect(requested).toEqual(['far'])
    expect(samples.loading('s-far')).toBeDefined()
    await samples.loading('s-far')
    expect(samples.has('s-far')).toBe(true)
    // Not inside the 5 s playback window yet: nothing sounds.
    expect(ctx.sources).toHaveLength(0)
    ctx.currentTime = 5.5
    scheduler.tick()
    expect(ctx.sources).toHaveLength(1)
    expect(ctx.sources[0].startCalls.calls).toEqual([[10, 0, 4]])
    scheduler.dispose()
  })

  it('edits re-derive the queue: a moved pending clip is cancelled and rescheduled', async () => {
    const { ctx, samples, track, transport, scheduler } = scheduled({ lookaheadSec: 1 })
    await samples.load('s-a', buffer(ctx, 10))
    track.clips.add(clip('a', 0.5))
    transport.start()
    scheduler.tick()
    expect(ctx.sources).toHaveLength(1)
    expect(ctx.sources[0].startCalls.calls).toEqual([[0.5, 0, 4]])
    track.clips.update('a', { startSec: 0.8 })
    expect(ctx.sources[0].stopCalls.calls).toEqual([[]])
    expect(ctx.sources).toHaveLength(2)
    expect(ctx.sources[1].startCalls.calls).toEqual([[0.8, 0, 4]])
    scheduler.dispose()
  })

  it('never starts a muted clip, stops one muted while sounding, and plays it again once unmuted', async () => {
    const { ctx, samples, track, transport, scheduler } = scheduled({ lookaheadSec: 1, loop: true })
    await samples.load('s-a', buffer(ctx, 10))
    await samples.load('s-b', buffer(ctx, 10))
    track.clips.add(clip('a', 0.5, { muted: true }))
    track.clips.add(clip('b', 0.5))
    transport.start()
    scheduler.tick()
    // Only the unmuted clip was handed to the graph; the muted one is still on the track.
    expect(ctx.sources).toHaveLength(1)
    expect(track.voice('b:0:0.500')).toBeDefined()
    expect(track.clips.all().map((c) => c.id)).toEqual(['a', 'b'])
    expect(track.clips.audible().map((c) => c.id)).toEqual(['b'])

    ctx.currentTime = 1
    track.clips.update('b', { muted: true })
    expect(ctx.sources[0].stopCalls.count).toBe(1)
    expect(track.clips.audible()).toEqual([])

    // Unmuted, it is due again on the next pass of the loop.
    track.clips.update('b', { muted: false })
    ctx.currentTime = 31.8
    scheduler.tick()
    expect(ctx.sources).toHaveLength(2)
    expect(track.voice('b:1:0.500')).toBeDefined()
    scheduler.dispose()
  })

  it('transport stop with a fade stops sources at now + fade; pause silences immediately', async () => {
    const { ctx, samples, track, transport, scheduler } = scheduled({ lookaheadSec: 1 })
    await samples.load('s-a', buffer(ctx, 10))
    track.clips.add(clip('a', 0))
    transport.start()
    scheduler.tick()
    ctx.currentTime = 1
    transport.stop({ fadeSec: 0.75 })
    expect(ctx.sources[0].stopCalls.last).toEqual([1.75])

    transport.start()
    scheduler.tick()
    expect(ctx.sources).toHaveLength(2)
    transport.pause()
    // Pause silences everything at once: the fading voice and the new one.
    expect(ctx.sources[0].stopCalls.last).toEqual([])
    expect(ctx.sources[1].stopCalls.last).toEqual([])
    expect(track.voices()).toHaveLength(0)
    scheduler.dispose()
  })

  it('loop: the same clip plays once per pass under distinct keys', async () => {
    const { ctx, samples, track, transport, scheduler } = scheduled({ lookaheadSec: 1, loop: true })
    await samples.load('s-a', buffer(ctx, 10))
    track.clips.add(clip('a', 0.5, { durationSec: 1 }))
    transport.start()
    scheduler.tick()
    ctx.currentTime = 31.8
    scheduler.tick()
    expect(ctx.sources).toHaveLength(2)
    expect(ctx.sources[1].startCalls.calls).toEqual([[32.5, 0, 1]])
    expect(track.voice('a:0:0.500')).toBeDefined()
    expect(track.voice('a:1:0.500')).toBeDefined()
    scheduler.dispose()
  })

  it('dispose detaches from the scheduler and silences voices', async () => {
    const { ctx, samples, track, transport, scheduler } = scheduled({ lookaheadSec: 1 })
    await samples.load('s-a', buffer(ctx, 10))
    track.clips.add(clip('a', 0))
    transport.start()
    scheduler.tick()
    track.dispose()
    expect(ctx.sources[0].stopCalls.calls).toEqual([[]])
    track.clips.add(clip('b', 0.1))
    scheduler.tick()
    expect(ctx.sources).toHaveLength(1)
    scheduler.dispose()
  })
})

describe('AudioTrack reversed clips', () => {
  function ramp(ctx: MockAudioContext, seconds: number): AudioBuffer {
    const made = new MockAudioBuffer(2, seconds * ctx.sampleRate, ctx.sampleRate)
    for (let channel = 0; channel < 2; channel += 1) {
      const data = made.getChannelData(channel)
      for (let frame = 0; frame < data.length; frame += 1) data[frame] = frame + channel
    }
    return made as unknown as AudioBuffer
  }

  const voice = (buf: AudioBuffer, extra: Record<string, unknown> = {}) => ({
    buffer: buf,
    offsetSec: 2,
    durationSec: 3,
    fadeInSec: 1,
    fadeOutSec: 0.5,
    fadeCurve: 'linear' as const,
    reversed: true,
    ...extra,
  })

  it('plays a mirrored copy of the buffer from the far end of the slice, under the same envelope', () => {
    const { ctx, track } = setup()
    const buf = ramp(ctx, 10)
    track.play('k', voice(buf), 4)
    const source = ctx.sources[0]
    const copy = source.buffer as unknown as MockAudioBuffer
    expect(copy).not.toBe(buf)
    expect(copy.length).toBe(buf.length)
    const last = buf.length - 1
    expect(Array.from(copy.getChannelData(0).subarray(0, 3))).toEqual([last, last - 1, last - 2])
    expect(copy.getChannelData(1)[last]).toBe(1)
    // Source seconds 2..5 are seconds 5..8 of the copy.
    expect(source.startCalls.calls).toEqual([[4, 5, 3]])
    expect(source.loop).toBe(false)
    // The fades belong to the clip, not to the sound: the same events as a forward voice.
    expect(ctx.gains[1].gain.events).toEqual([
      { method: 'setValueAtTime', args: [fadeGain(0, 3, 1, 0.5), 4] },
      { method: 'linearRampToValueAtTime', args: [1, 5] },
      { method: 'setValueAtTime', args: [1, 6.5] },
      { method: 'linearRampToValueAtTime', args: [0, 7] },
    ])
    // The source buffer itself is left as it was.
    expect(buf.getChannelData(0)[1]).toBe(1)
  })

  it('makes the mirrored copy once per buffer', () => {
    const { ctx, track } = setup()
    const buf = ramp(ctx, 4)
    track.play('a', voice(buf, { offsetSec: 0, durationSec: 1 }), 1)
    track.play('b', voice(buf, { offsetSec: 1, durationSec: 1 }), 2)
    expect(ctx.sources[1].buffer).toBe(ctx.sources[0].buffer)
    track.play('c', voice(buf, { offsetSec: 0, durationSec: 1, reversed: false }), 3)
    expect(ctx.sources[2].buffer).toBe(buf)
  })

  it('a clip longer than what is left of its source goes quiet where the slice ends', () => {
    const { ctx, track } = setup()
    const made = track.play('k', voice(ramp(ctx, 10), { offsetSec: 6, durationSec: 9 }), 1)
    // Four seconds of sound, read from the very end; the clip itself still runs its nine.
    expect(ctx.sources[0].startCalls.calls).toEqual([[1, 0, 4]])
    expect(made?.endTime).toBe(10)
  })

  it('joins late partway through the mirrored slice, and not at all once the slice is spent', () => {
    const late = setup({ currentTime: 5 })
    late.track.play('k', voice(ramp(late.ctx, 10)), 4)
    expect(late.ctx.sources[0].startCalls.calls).toEqual([[5, 6, 2]])

    const spent = setup({ currentTime: 6 })
    const made = spent.track.play(
      'k',
      voice(ramp(spent.ctx, 10), { offsetSec: 6, durationSec: 9 }),
      1,
    )
    expect(made).toBeNull()
    expect(spent.ctx.sources).toHaveLength(0)
  })

  it('a looping clip cycles over the mirrored region and stops at the clip end', () => {
    const { ctx, track } = setup()
    track.play('k', voice(ramp(ctx, 10), { offsetSec: 4, durationSec: 20, loop: true }), 2)
    const source = ctx.sources[0]
    expect(source.loop).toBe(true)
    expect([source.loopStart, source.loopEnd]).toEqual([0, 6])
    expect(source.startCalls.calls).toEqual([[2, 0]])
    expect(source.stopCalls.calls).toEqual([[22]])

    // A late join wraps inside the mirrored region.
    const late = setup({ currentTime: 9 })
    late.track.play(
      'k',
      voice(ramp(late.ctx, 10), { offsetSec: 4, durationSec: 20, loop: true }),
      2,
    )
    expect(late.ctx.sources[0].startCalls.calls).toEqual([[9, 1]])
  })

  it('an equal-power voice reads the mirrored slice for exactly its length', () => {
    const { ctx, track } = setup()
    track.play(
      'k',
      voice(ramp(ctx, 10), { fadeCurve: 'equalPower', fadeInSec: 1, fadeOutSec: 1 }),
      4,
    )
    const source = ctx.sources[0]
    expect(source.buffer).not.toBeNull()
    expect(source.startCalls.calls).toEqual([[4, 5, 3]])
    expect(source.stopCalls.calls).toEqual([[7]])
  })

  it('the scheduler plays a reversed clip off the mirrored copy, made ahead of the start', async () => {
    const { ctx, samples, track } = setup({ lookaheadSec: 0.2, preloadSec: 2 })
    const transport = new Transport({ now: () => ctx.currentTime })
    const scheduler = new Scheduler({ transport, tickMs: 40 })
    track.attach(scheduler)
    const buf = ramp(ctx, 10)
    await samples.load('s-a', buf)
    const mirror = vi.spyOn(ctx, 'createBuffer')
    track.clips.add({
      id: 'a',
      sourceId: 's-a',
      startSec: 1,
      offsetSec: 2,
      durationSec: 3,
      fadeInSec: 0,
      fadeOutSec: 0,
      fadeCurve: 'linear',
      gainDb: 0,
      reversed: true,
    })
    transport.start()
    scheduler.tick()
    // Inside the preload window, outside the playback one: the copy exists, nothing sounds yet.
    expect(ctx.sources).toHaveLength(0)
    expect(mirror).toHaveBeenCalledTimes(1)
    ctx.currentTime = 0.9
    scheduler.tick()
    expect(ctx.sources).toHaveLength(1)
    expect(ctx.sources[0].buffer).not.toBe(buf)
    expect(ctx.sources[0].startCalls.calls).toEqual([[1, 5, 3]])
    expect(mirror).toHaveBeenCalledTimes(1)
    scheduler.dispose()
  })

  it('a reversed clip still decoding is offered to the preload again, so its copy is made before the start', async () => {
    const { ctx, samples, track } = setup({ lookaheadSec: 0.2, preloadSec: 2 })
    const transport = new Transport({ now: () => ctx.currentTime })
    const scheduler = new Scheduler({ transport, tickMs: 40 })
    track.attach(scheduler)
    const mirror = vi.spyOn(ctx, 'createBuffer')
    track.clips.add({
      id: 'a',
      sourceId: 's-a',
      startSec: 1,
      offsetSec: 2,
      durationSec: 3,
      fadeInSec: 0,
      fadeOutSec: 0,
      fadeCurve: 'linear',
      gainDb: 0,
      reversed: true,
    })
    transport.start()
    scheduler.tick()
    // In the preload window with nothing decoded: no copy yet.
    expect(mirror).not.toHaveBeenCalled()
    await samples.load('s-a', ramp(ctx, 10))
    ctx.currentTime = 0.3
    scheduler.tick()
    // Decoded, still outside the playback window: the copy is made now, not at the start.
    expect(mirror).toHaveBeenCalledTimes(1)
    expect(ctx.sources).toHaveLength(0)
    ctx.currentTime = 0.9
    scheduler.tick()
    expect(ctx.sources[0].startCalls.calls).toEqual([[1, 5, 3]])
    expect(mirror).toHaveBeenCalledTimes(1)
    scheduler.dispose()
  })
})

describe('AudioTrack.fadeOutVoice (adapter primitive)', () => {
  it('fades unconditionally, whatever the voice timing, and pulls the end in', () => {
    const ctx = createMockContext({ sampleRate: 48000 })
    const dest = ctx.createGain()
    const track = new AudioTrack(asAudioContext(ctx), {
      name: 'm',
      destination: dest as unknown as AudioNode,
      samples: new SampleStore(asAudioContext(ctx)),
      now: () => ctx.currentTime,
    })
    const opts = {
      buffer: buffer(ctx, 10),
      offsetSec: 0,
      durationSec: 10,
      fadeInSec: CROSSFADE_SECONDS,
      fadeOutSec: CROSSFADE_SECONDS,
      fadeCurve: 'equalPower' as const,
    }
    track.play('pending', opts, 7.5)
    // fadeOut() would only stop a pending voice; fadeOutVoice() fades it regardless.
    track.fadeOutVoice('pending', 2, STEER_CROSSFADE_SECONDS)
    const gain = ctx.gains[1]
    expect(gain.gain.eventsFor('cancelScheduledValues')).toEqual([
      { method: 'cancelScheduledValues', args: [2] },
    ])
    expect(gain.gain.eventsFor('setValueCurveAtTime')[2].args.slice(1)).toEqual([
      2,
      STEER_CROSSFADE_SECONDS,
    ])
    expect(ctx.sources[0].stopCalls.last).toEqual([2 + STEER_CROSSFADE_SECONDS])
    expect(track.voice('pending')?.endTime).toBe(6)
    track.fadeOutVoice('missing', 2, 1)
  })
})

describe('AudioTrack placed clips', () => {
  const voice = {
    offsetSec: 0,
    durationSec: 4,
    fadeInSec: 0,
    fadeOutSec: 0,
    fadeCurve: 'linear' as const,
  }

  function mono(ctx: MockAudioContext, seconds: number): AudioBuffer {
    return new MockAudioBuffer(
      1,
      seconds * ctx.sampleRate,
      ctx.sampleRate,
    ) as unknown as AudioBuffer
  }

  it('a clip that names no placement makes no nodes of its own', () => {
    const { ctx, track } = setup()
    const played = track.play('k', { ...voice, buffer: buffer(ctx, 10), gainDb: -6 }, 1)
    expect(played?.placement).toBeNull()
    expect(ctx.filters).toHaveLength(0)
    expect(ctx.panners).toHaveLength(0)
    expect(ctx.convolvers).toHaveLength(0)
    expect(track.space).toBeNull()
  })

  it('plays through its own trim, low-pass and panner into the strip', () => {
    const { ctx, dest, track } = setup()
    const played = track.play(
      'k',
      { ...voice, buffer: buffer(ctx, 10), gainDb: -6, pan: -0.4, lowpassHz: 3000 },
      1,
    )
    const [, gain, trim] = ctx.gains
    const [lowpass] = ctx.filters
    const [panner] = ctx.panners
    expect(ctx.sources[0].isConnectedTo(gain)).toBe(true)
    expect(gain.isConnectedTo(trim)).toBe(true)
    expect(trim.isConnectedTo(lowpass)).toBe(true)
    expect(lowpass.isConnectedTo(panner)).toBe(true)
    expect(panner.isConnectedTo(dest)).toBe(true)
    expect(trim.gain.value).toBeCloseTo(10 ** (-6 / 20))
    expect(lowpass.type).toBe('lowpass')
    expect(lowpass.frequency.value).toBe(3000)
    // A Web Audio low-pass takes its resonance in dB: this is the flat one.
    expect(lowpass.Q.value).toBeCloseTo(-3.01, 2)
    expect(panner.pan.value).toBe(-0.4)
    expect(played?.placement?.panner).toBe(panner)
    expect(played?.placement?.send).toBeNull()
    // Nothing is sent, so no room is made.
    expect(ctx.convolvers).toHaveLength(0)
  })

  it('a placed clip that names only a pan is left open and has a trim to follow', () => {
    const { ctx, track } = setup()
    const played = track.play('k', { ...voice, buffer: buffer(ctx, 10), pan: 0 }, 1)
    expect(played?.trim).not.toBeNull()
    expect(played?.trim?.gain.value).toBe(1)
    expect(ctx.filters[0].frequency.value).toBeCloseTo(48000 * 0.49)
    expect(ctx.panners[0].pan.value).toBe(0)
  })

  it('makes up the 3 dB a panner takes off a mono source at the centre', () => {
    const { ctx, track } = setup()
    track.play('m', { ...voice, buffer: mono(ctx, 10), pan: 0 }, 1)
    track.play('s', { ...voice, buffer: buffer(ctx, 10), pan: 0 }, 1)
    expect(track.voice('m')?.trim?.gain.value).toBeCloseTo(Math.SQRT2)
    expect(track.voice('s')?.trim?.gain.value).toBe(1)
  })

  it('a placed trim reaches below the ±12 dB of a loudness trim, and is capped above', () => {
    expect(placedTrimGain(-18)).toBeCloseTo(10 ** (-18 / 20))
    expect(placedTrimGain(-200)).toBeCloseTo(10 ** (MIN_PLACED_GAIN_DB / 20))
    expect(placedTrimGain(40)).toBeCloseTo(10 ** (MAX_CLIP_GAIN_DB / 20))
    expect(placedTrimGain(undefined)).toBe(1)
    const { ctx, track } = setup()
    track.play('k', { ...voice, buffer: buffer(ctx, 10), gainDb: -18, pan: 0 }, 1)
    expect(track.voice('k')?.trim?.gain.value).toBeCloseTo(10 ** (-18 / 20))
  })

  it('sends from after the low-pass into one room per track, which feeds the strip', () => {
    const ctx = createMockContext({ sampleRate: 48000 })
    const dest = ctx.createGain()
    const impulse = buffer(ctx, 2)
    const spaceImpulse = vi.fn(() => impulse)
    const track = new AudioTrack(asAudioContext(ctx), {
      name: 'music',
      destination: dest as unknown as AudioNode,
      samples: new SampleStore(asAudioContext(ctx)),
      now: () => ctx.currentTime,
      spaceImpulse,
    })
    const a = track.play('a', { ...voice, buffer: buffer(ctx, 10), spaceDb: -6 }, 1)
    const b = track.play('b', { ...voice, buffer: mono(ctx, 10), spaceDb: 0, pan: 0.5 }, 1)
    expect(ctx.convolvers).toHaveLength(1)
    const [room] = ctx.convolvers
    expect(track.space).toBe(room)
    expect(spaceImpulse).toHaveBeenCalledTimes(1)
    expect(room.buffer).toBe(impulse)
    expect(room.normalize).toBe(false)
    expect(room.isConnectedTo(dest)).toBe(true)
    const [lowpassA, lowpassB] = ctx.filters
    const sendA = a?.placement?.send as unknown as (typeof ctx.gains)[number]
    const sendB = b?.placement?.send as unknown as (typeof ctx.gains)[number]
    expect(lowpassA.isConnectedTo(sendA)).toBe(true)
    expect(lowpassB.isConnectedTo(sendB)).toBe(true)
    expect(sendA.isConnectedTo(room)).toBe(true)
    expect(sendB.isConnectedTo(room)).toBe(true)
    expect(sendA.gain.value).toBeCloseTo(10 ** (-6 / 20))
    // The mono voice's trim carries the panner's makeup; its send takes it back out.
    expect(sendB.gain.value).toBeCloseTo(Math.SQRT1_2)
  })

  it('generates the stock room when none is handed in', () => {
    const { ctx, track } = setup()
    track.play('k', { ...voice, buffer: buffer(ctx, 10), spaceDb: 0 }, 1)
    const impulse = ctx.convolvers[0].buffer
    expect(impulse?.numberOfChannels).toBe(2)
    expect(impulse?.duration).toBeCloseTo(5.02, 2)
  })

  it('place moves a sounding voice, sending only what changed', () => {
    const { ctx, track } = setup({ currentTime: 2 })
    const played = track.play(
      'k',
      { ...voice, buffer: buffer(ctx, 10), gainDb: 0, pan: 0.2, lowpassHz: 8000 },
      1,
    )
    const [panner] = ctx.panners
    const [lowpass] = ctx.filters
    const trim = played?.trim as unknown as (typeof ctx.gains)[number]
    expect(track.place('k', { gainDb: 0, pan: -0.6, lowpassHz: 8000 })).toBe(true)
    expect(panner.pan.events).toEqual([
      { method: 'setTargetAtTime', args: [-0.6, 2, PLACEMENT_RAMP_SECONDS] },
    ])
    expect(lowpass.frequency.events).toEqual([])
    expect(trim.gain.events).toEqual([])
    track.place('k', { gainDb: -9, pan: -0.6, lowpassHz: 2000, spaceDb: -3 })
    expect(panner.pan.events).toHaveLength(1)
    expect(lowpass.frequency.events).toEqual([
      { method: 'setTargetAtTime', args: [2000, 2, PLACEMENT_RAMP_SECONDS] },
    ])
    expect(trim.gain.lastEvent('setTargetAtTime')?.args[0]).toBeCloseTo(10 ** (-9 / 20))
    // The send did not exist: it is made silent and comes up beside the dry path.
    const send = played?.placement?.send as unknown as (typeof ctx.gains)[number]
    expect(send.gain.value).toBe(0)
    expect(send.gain.lastEvent('setTargetAtTime')?.args[0]).toBeCloseTo(10 ** (-3 / 20))
    expect(send.isConnectedTo(ctx.convolvers[0])).toBe(true)
    // Taking the send away again fades it; the node stays for the next change.
    track.place('k', { gainDb: -9, pan: -0.6, lowpassHz: 2000 })
    expect(send.gain.lastEvent('setTargetAtTime')?.args[0]).toBe(0)
    expect(ctx.convolvers).toHaveLength(1)
  })

  it('place leaves a voice that was started unplaced, and one that is gone, alone', () => {
    const { ctx, track } = setup()
    track.play('k', { ...voice, buffer: buffer(ctx, 10), gainDb: -6 }, 1)
    expect(track.place('k', { gainDb: 0, pan: 0.5 })).toBe(false)
    expect(track.place('missing', { gainDb: 0, pan: 0.5 })).toBe(false)
    expect(ctx.panners).toHaveLength(0)
  })

  it('an equal-power voice is placed the same way', () => {
    const { ctx, dest, track } = setup()
    const played = track.play(
      'k',
      {
        ...voice,
        fadeInSec: 1,
        fadeOutSec: 1,
        fadeCurve: 'equalPower',
        buffer: buffer(ctx, 10),
        pan: 0.3,
        spaceDb: -12,
      },
      1,
    )
    expect(played?.placement?.send).not.toBeNull()
    expect(ctx.panners[0].pan.value).toBe(0.3)
    expect(ctx.panners[0].isConnectedTo(dest)).toBe(true)
    expect(ctx.gains[1].isConnectedTo(played?.trim as never)).toBe(true)
  })

  it('stopping a voice takes its nodes out and leaves the room ringing', () => {
    const { ctx, dest, track } = setup()
    const played = track.play('k', { ...voice, buffer: buffer(ctx, 10), pan: 0, spaceDb: 0 }, 1)
    const send = played?.placement?.send as unknown as (typeof ctx.gains)[number]
    track.stop('k')
    expect(ctx.filters[0].outputs.size).toBe(0)
    expect(ctx.panners[0].isConnectedTo(dest)).toBe(false)
    expect(send.isConnectedTo(ctx.convolvers[0])).toBe(false)
    expect(ctx.convolvers[0].isConnectedTo(dest)).toBe(true)
    expect(track.strip.sourceNodes).toEqual([ctx.convolvers[0]])
    track.dispose()
    expect(ctx.convolvers[0].isConnectedTo(dest)).toBe(false)
    expect(track.space).toBeNull()
  })

  it('a scheduled clip that is moved while it sounds follows without starting again', async () => {
    const { ctx, samples, track } = setup({ lookaheadSec: 1 })
    const transport = new Transport({ now: () => ctx.currentTime })
    const scheduler = new Scheduler({ transport, tickMs: 40 })
    track.attach(scheduler)
    await samples.load('s', buffer(ctx, 10))
    const clip: Clip = {
      id: 'a',
      sourceId: 's',
      startSec: 0.5,
      offsetSec: 0,
      durationSec: 4,
      fadeInSec: 0,
      fadeOutSec: 0,
      fadeCurve: 'linear',
      gainDb: 0,
      pan: 0,
    }
    track.clips.add(clip)
    transport.start()
    scheduler.tick()
    expect(ctx.sources).toHaveLength(1)
    ctx.currentTime = 1
    track.clips.update('a', { gainDb: -6, pan: 0.5, lowpassHz: 4000, spaceDb: -9 })
    expect(ctx.sources).toHaveLength(1)
    expect(ctx.sources[0].stopCalls.count).toBe(0)
    expect(ctx.panners[0].pan.lastEvent('setTargetAtTime')?.args).toEqual([
      0.5,
      1,
      PLACEMENT_RAMP_SECONDS,
    ])
    expect(ctx.filters[0].frequency.lastEvent('setTargetAtTime')?.args[0]).toBe(4000)
    const live = track.voice('a:0:0.500')
    expect(
      (
        live?.trim as never as { gain: { lastEvent(m: string): { args: number[] } } }
      ).gain.lastEvent('setTargetAtTime').args[0],
    ).toBeCloseTo(10 ** (-6 / 20))
    expect(live?.placement?.send).not.toBeNull()
    // An edit of another clip sends this one nothing new.
    const events = ctx.panners[0].pan.events.length
    track.clips.add({ ...clip, id: 'b', startSec: 20 })
    expect(ctx.panners[0].pan.events).toHaveLength(events)
    scheduler.dispose()
  })
})

describe('AudioTrack clips entered partway', () => {
  function clip(id: string, startSec: number, extra: Partial<Clip> = {}): Clip {
    return {
      id,
      sourceId: 's',
      startSec,
      offsetSec: 0,
      durationSec: 16,
      fadeInSec: 0,
      fadeOutSec: 0,
      fadeCurve: 'linear',
      gainDb: 0,
      ...extra,
    }
  }

  async function scheduled(currentTime = 100) {
    const { ctx, samples, track } = setup({ currentTime, lookaheadSec: 0.2 })
    const transport = new Transport({
      now: () => ctx.currentTime,
      loop: { enabled: true, lengthSec: 32 },
    })
    const scheduler = new Scheduler({ transport, tickMs: 40 })
    track.attach(scheduler)
    await samples.load('s', buffer(ctx, 20))
    return { ctx, samples, track, transport, scheduler }
  }

  it('easeInSec comes up from silence to the envelope, which carries on from there', () => {
    const { ctx, track } = setup({ currentTime: 4.5 })
    track.play(
      'k',
      {
        buffer: buffer(ctx, 10),
        offsetSec: 1,
        durationSec: 6,
        fadeInSec: 2,
        fadeOutSec: 1,
        fadeCurve: 'linear',
        easeInSec: 0.005,
      },
      3,
    )
    // The same late join as without it: 1.5 s in, at 4.5.
    expect(ctx.sources[0].startCalls.calls).toEqual([[4.5, 2.5, 4.5]])
    expect(ctx.gains[1].gain.events).toEqual([
      { method: 'setValueAtTime', args: [0, 4.5] },
      { method: 'linearRampToValueAtTime', args: [fadeGain(1.505, 6, 2, 1), 4.505] },
      { method: 'linearRampToValueAtTime', args: [1, 5] },
      { method: 'setValueAtTime', args: [1, 8] },
      { method: 'linearRampToValueAtTime', args: [0, 9] },
    ])
  })

  it('easeInSec inside the fade-out eases to where the fade has got to, and never past the end', () => {
    const { ctx, track } = setup({ currentTime: 8.5 })
    const opts = {
      buffer: buffer(ctx, 10),
      offsetSec: 0,
      durationSec: 6,
      fadeInSec: 0,
      fadeOutSec: 1,
      fadeCurve: 'linear' as const,
      easeInSec: 0.005,
    }
    track.play('k', opts, 3)
    expect(ctx.gains[1].gain.events).toEqual([
      { method: 'setValueAtTime', args: [0, 8.5] },
      { method: 'linearRampToValueAtTime', args: [fadeGain(5.505, 6, 0, 1), 8.505] },
      { method: 'linearRampToValueAtTime', args: [0, 9] },
    ])
    ctx.currentTime = 8.998
    track.play('end', { ...opts, fadeOutSec: 0 }, 3)
    const events = ctx.gains[2].gain.events
    expect(events[1].method).toBe('linearRampToValueAtTime')
    expect(events[1].args[1]).toBeCloseTo(9, 9)
  })

  it('the transport started inside a clip plays it from that point in it, eased in', async () => {
    const { ctx, track, transport, scheduler } = await scheduled()
    track.clips.add(clip('pad', 2, { offsetSec: 1 }))
    transport.seek(6)
    transport.start()
    // Four seconds into the clip: the source is entered at its offset plus four, for the twelve left.
    expect(ctx.sources).toHaveLength(1)
    expect(ctx.sources[0].startCalls.calls).toEqual([[100, 5, 12]])
    expect(ctx.gains[1].gain.events).toEqual([
      { method: 'setValueAtTime', args: [0, 100] },
      { method: 'linearRampToValueAtTime', args: [1, 100 + JOIN_EASE_SECONDS] },
    ])
    expect(track.voice('pad:0:2.000')?.endTime).toBe(112)
    scheduler.dispose()
  })

  it('a seek while playing lands inside a clip the same way, and inside a repeating one in its region', async () => {
    const { ctx, track, transport, scheduler } = await scheduled()
    track.clips.add(clip('pad', 2))
    track.clips.add(
      clip('loop', 20, {
        sourceId: 's',
        durationSec: 10,
        loop: true,
        loopStartSec: 0,
        loopEndSec: 4,
      }),
    )
    transport.start()
    ctx.currentTime = 101
    transport.seek(10)
    expect(ctx.sources[0].startCalls.calls).toEqual([[101, 8, 8]])
    ctx.currentTime = 102
    transport.seek(27)
    // Seven seconds into a clip that cycles over four: three seconds into the region.
    expect(ctx.sources[1].loop).toBe(true)
    expect(ctx.sources[1].startCalls.calls).toEqual([[102, 3]])
    scheduler.dispose()
  })

  it('a reversed clip is entered partway through its mirrored slice', async () => {
    const { ctx, track, transport, scheduler } = await scheduled()
    track.clips.add(clip('back', 2, { durationSec: 8, reversed: true }))
    transport.seek(5)
    transport.start()
    // The slice is the first 8 s of a 20 s source; mirrored it sits at 12..20, entered 3 s in.
    expect(ctx.sources[0].startCalls.calls).toEqual([[100, 15, 5]])
    scheduler.dispose()
  })

  it('a clip whose sample decodes after the playhead passed its start comes in where it has got to', async () => {
    const { ctx, samples, track } = setup({ currentTime: 100, lookaheadSec: 0.2 })
    const transport = new Transport({ now: () => ctx.currentTime })
    const scheduler = new Scheduler({ transport, tickMs: 40 })
    track.attach(scheduler)
    track.clips.add(clip('pad', 0.1))
    transport.start()
    ctx.currentTime = 103
    scheduler.tick()
    expect(ctx.sources).toHaveLength(0)
    await samples.load('s', buffer(ctx, 20))
    scheduler.tick()
    expect(ctx.sources[0].startCalls.calls[0][0]).toBe(103)
    expect(ctx.sources[0].startCalls.calls[0][1]).toBeCloseTo(2.9, 9)
    scheduler.dispose()
  })

  it('an equal-power clip is not entered partway: it waits for its start', async () => {
    const { ctx, track, transport, scheduler } = await scheduled()
    track.clips.add(
      clip('section', 2, {
        fadeCurve: 'equalPower',
        fadeInSec: CROSSFADE_SECONDS,
        fadeOutSec: CROSSFADE_SECONDS,
      }),
    )
    transport.seek(6)
    transport.start()
    scheduler.tick()
    expect(ctx.sources).toHaveLength(0)
    scheduler.dispose()
  })

  it('rejoin leaves a sounding equal-power clip as it sounds: let go, it could not come back partway', async () => {
    const { ctx, track, transport, scheduler } = await scheduled()
    track.clips.add(
      clip('section', 2, {
        fadeCurve: 'equalPower',
        fadeInSec: CROSSFADE_SECONDS,
        fadeOutSec: CROSSFADE_SECONDS,
      }),
    )
    transport.seek(1.9)
    transport.start()
    ctx.currentTime = 104.1
    scheduler.tick()
    expect(ctx.sources).toHaveLength(1)
    const voice = track.voice('section:0:2.000')

    track.clips.update('section', { offsetSec: 2 })
    scheduler.rejoin(['section'])
    expect(ctx.sources).toHaveLength(1)
    expect(ctx.sources[0].stopCalls.calls).toEqual([[100.1 + 16]])
    expect(track.voice('section:0:2.000')).toBe(voice)

    // Made linear, it can be entered partway, so it is let go and comes back as it now is.
    track.clips.update('section', { fadeCurve: 'linear', fadeInSec: 0, fadeOutSec: 0 })
    scheduler.rejoin(['section'])
    expect(ctx.sources).toHaveLength(2)
    expect(ctx.sources[0].stopCalls.last).toEqual([104.1 + REJOIN_FADE_SECONDS])
    expect(ctx.sources[1].startCalls.calls[0][0]).toBe(104.1)
    scheduler.dispose()
  })

  it('rejoin fades the voice of an edited clip out and plays the clip as it now is from the same point', async () => {
    const { ctx, track, transport, scheduler } = await scheduled()
    track.clips.add(clip('pad', 2))
    transport.seek(1.9)
    transport.start()
    ctx.currentTime = 104.1
    scheduler.tick()
    expect(ctx.sources).toHaveLength(1)

    // Trimmed at the front by two seconds and faded out: same place on the timeline, another slice.
    track.clips.update('pad', { offsetSec: 2, fadeOutSec: 4 })
    expect(ctx.sources).toHaveLength(1)
    scheduler.rejoin(['pad'])

    const old = ctx.gains[1].gain
    expect(old.eventsFor('cancelScheduledValues')).toEqual([
      { method: 'cancelScheduledValues', args: [104.1] },
    ])
    expect(old.lastEvent('linearRampToValueAtTime')?.args).toEqual([0, 104.1 + REJOIN_FADE_SECONDS])
    expect(ctx.sources[0].stopCalls.last).toEqual([104.1 + REJOIN_FADE_SECONDS])
    // It is not cut off by the voice that takes its key, and unwires itself when it ends.
    expect(ctx.sources[0].stopCalls.count).toBe(1)
    expect(ctx.sources[0].disconnectCalls.count).toBe(0)
    ctx.sources[0].finish()
    expect(ctx.sources[0].disconnectCalls.count).toBe(1)

    expect(ctx.sources).toHaveLength(2)
    const [at, offset, left] = ctx.sources[1].startCalls.calls[0]
    expect(at).toBe(104.1)
    expect(offset).toBeCloseTo(6, 9)
    expect(left).toBeCloseTo(12, 9)
    expect(track.voice('pad:0:2.000')?.source).toBe(ctx.sources[1])
    expect(ctx.gains[2].gain.events[0]).toEqual({ method: 'setValueAtTime', args: [0, 104.1] })
    scheduler.dispose()
  })

  it('rejoin plays a clip dragged under the playhead at once, and an edit that cuts one short stops it', async () => {
    const { ctx, track, transport, scheduler } = await scheduled()
    track.clips.add(clip('pad', 20, { durationSec: 8 }))
    transport.start()
    ctx.currentTime = 105
    scheduler.tick()
    track.clips.update('pad', { startSec: 2 })
    expect(ctx.sources).toHaveLength(0)
    scheduler.rejoin(['pad'])
    expect(ctx.sources[0].startCalls.calls).toEqual([[105, 3, 5]])

    // Its right edge is dragged back behind the playhead.
    track.clips.update('pad', { durationSec: 2 })
    expect(ctx.sources[0].stopCalls.last).toEqual([105 + REJOIN_FADE_SECONDS])
    expect(track.voices()).toHaveLength(0)
    scheduler.dispose()
  })

  it('a stretched timeline keeps its sounding voices: retime takes them along to where their clips now are', async () => {
    const { ctx, track, transport, scheduler } = await scheduled()
    track.clips.add(clip('pad', 2))
    transport.start()
    ctx.currentTime = 104
    scheduler.tick()
    expect(ctx.sources).toHaveLength(1)
    const voice = track.voice('pad:0:2.000')
    expect(voice).toBeDefined()

    // 120 bpm to 96 bpm: every position 1.25 times as far along.
    scheduler.retime(() => {
      transport.rescale(1.25, 40)
      track.clips.update('pad', { startSec: 2.5 })
    })

    // The same voice, untouched, under its clip's new start.
    expect(ctx.sources).toHaveLength(1)
    expect(ctx.sources[0].stopCalls.count).toBe(0)
    expect(track.voice('pad:0:2.000')).toBeUndefined()
    expect(track.voice('pad:0:2.500')).toBe(voice)
    expect(voice?.key).toBe('pad:0:2.500')

    // It still follows its clip, and still ends as a voice does.
    track.clips.update('pad', { gainDb: -6 })
    ctx.sources[0].finish()
    expect(track.voices()).toHaveLength(0)

    // And the same edits outside retime cut it, as a moved clip is.
    track.clips.add(clip('drone', 1))
    scheduler.rejoin(['drone'])
    expect(ctx.sources).toHaveLength(2)
    transport.rescale(0.8, 32)
    track.clips.update('drone', { startSec: 0.8 })
    expect(ctx.sources[1].stopCalls.count).toBe(1)
    scheduler.dispose()
  })

  it('release silences a voice that has not started, and one with no fade asked for', () => {
    const { ctx, track } = setup()
    const opts = {
      buffer: buffer(ctx, 10),
      offsetSec: 0,
      durationSec: 6,
      fadeInSec: 0,
      fadeOutSec: 0,
      fadeCurve: 'linear' as const,
    }
    track.play('pending', opts, 2)
    track.play('sounding', opts, 0)
    track.release('pending', 0.005)
    ctx.currentTime = 1
    track.release('sounding', 0)
    track.release('missing', 0.005)
    expect(ctx.sources[0].stopCalls.calls).toEqual([[]])
    expect(ctx.sources[1].stopCalls.calls).toEqual([[]])
    expect(track.voices()).toHaveLength(0)
  })
})
