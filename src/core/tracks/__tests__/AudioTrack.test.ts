import { describe, expect, it } from 'vitest'

import {
  MockAudioBuffer,
  asAudioContext,
  createMockContext,
  type MockAudioContext,
} from '../../../testing'
import { equalPowerFadeIn, equalPowerFadeOut } from '../../clips/curves'
import { fadeGain } from '../../clips/fade'
import { type Clip } from '../../clips/Clip'
import { Scheduler } from '../../transport/Scheduler'
import { Transport } from '../../transport/Transport'
import {
  AudioTrack,
  CROSSFADE_SECONDS,
  MAX_CLIP_GAIN_DB,
  STEER_CROSSFADE_SECONDS,
  STOP_FADE_SECONDS,
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
