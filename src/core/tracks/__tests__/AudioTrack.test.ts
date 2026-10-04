import { describe, expect, it, vi } from 'vitest'

import {
  MockAudioBuffer,
  asAudioContext,
  createMockContext,
  createMockOfflineContext,
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
  PLACEMENT_GLIDE_SECONDS,
  PLACEMENT_RAMP_SECONDS,
  STEER_CROSSFADE_SECONDS,
  STOP_FADE_SECONDS,
  placedTrimGain,
  trimGain,
} from '../AudioTrack'
import { SampleStore } from '../SampleStore'
import { spaceDrift, spaceDriveGains } from '../space'

function setup(
  options: {
    currentTime?: number
    lookaheadSec?: number
    preloadSec?: number
    baseLatency?: number
  } = {},
) {
  const ctx = createMockContext({
    currentTime: options.currentTime ?? 0,
    sampleRate: 48000,
    baseLatency: options.baseLatency,
  })
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

/** The gain that feeds a room's saturator: where a driven room's sends go. */
function gainInto(ctx: MockAudioContext, shaper: MockAudioContext['shapers'][number]) {
  const into = ctx.gains.find((gain) => gain.isConnectedTo(shaper))
  if (!into) throw new Error('nothing feeds the saturator')
  return into
}

function buffer(ctx: MockAudioContext, seconds: number): AudioBuffer {
  return new MockAudioBuffer(2, seconds * ctx.sampleRate, ctx.sampleRate) as unknown as AudioBuffer
}

function wave(
  ctx: MockAudioContext,
  seconds: number,
  at: (turns: number, through: number) => number,
): AudioBuffer {
  const made = new MockAudioBuffer(2, seconds * ctx.sampleRate, ctx.sampleRate)
  for (let channel = 0; channel < 2; channel += 1) {
    const data = made.getChannelData(channel)
    for (let frame = 0; frame < data.length; frame += 1) {
      data[frame] = at(frame / ctx.sampleRate, frame / data.length)
    }
  }
  return made as unknown as AudioBuffer
}

/**
 * A sound made to loop: a 100 Hz wave that starts a quarter of the way through
 * a cycle and comes round on itself every `period` seconds (its whole length
 * unless told).
 */
function looped(ctx: MockAudioContext, seconds: number, period = seconds): AudioBuffer {
  const cycles = Math.round(100 * period)
  return wave(ctx, seconds, (sec) => 0.5 * Math.sin(2 * Math.PI * (0.25 + (cycles * sec) / period)))
}

/** A sound that starts on its attack, from rest, and dies away to nothing. */
function struck(ctx: MockAudioContext, seconds: number): AudioBuffer {
  return wave(
    ctx,
    seconds,
    (sec, through) => 0.5 * (1 - through) * Math.sin(2 * Math.PI * 100.25 * sec),
  )
}

/** Recorded events with their numbers to nine places, past which the clock's arithmetic is rounding. */
function toNine(events: { method: string; args: unknown[] }[]): [string, ...unknown[]][] {
  return events.map((event) => [
    event.method,
    ...event.args.map((arg) => (typeof arg === 'number' ? Number(arg.toFixed(9)) : arg)),
  ])
}

/** A sound that starts from rest and just stops, at the top of a wave. */
function cutOff(ctx: MockAudioContext, seconds: number): AudioBuffer {
  const cycles = Math.round(100 * seconds) + 0.25
  return wave(ctx, seconds, (sec) => 0.5 * Math.sin((2 * Math.PI * cycles * sec) / seconds))
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
      // Ahead of ClipPlayer's own events: silent from half a frame before the
      // start, so the source's first frame is not heard at full level.
      { method: 'setValueAtTime', args: [0, 3 - 0.5 / ctx.sampleRate] },
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

  it('no fades, to the end of its sound: a single unity setValueAtTime and no ramps', () => {
    const { ctx, track } = setup()
    track.play(
      'k',
      {
        buffer: buffer(ctx, 6),
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

  describe('a clip whose sound would step where it starts or ends', () => {
    const bare = { fadeInSec: 0, fadeOutSec: 0, fadeCurve: 'linear' as const }
    const E = JOIN_EASE_SECONDS
    const UNITY = [{ method: 'setValueAtTime', args: [1, 3] }]
    // Silent from half a frame before its start, so its first frame is not heard ahead of the come-up.
    const HALF_FRAME = 0.5 / 48000
    const comeUpAt = (start: number, over = E) => [
      { method: 'setValueAtTime', args: [0, start - HALF_FRAME] },
      { method: 'setValueAtTime', args: [0, start] },
      { method: 'linearRampToValueAtTime', args: [1, start + over] },
    ]
    const comeUp = comeUpAt(3)
    const tail = (end: number, sec = E) => [
      { method: 'setValueAtTime', args: [1, end] },
      { method: 'linearRampToValueAtTime', args: [0, end + sec] },
    ]

    it('a sound made to loop comes up over a few milliseconds and tails as long past its end, on its own start', () => {
      const { ctx, track } = setup()
      const voice = track.play(
        'k',
        { buffer: looped(ctx, 10), offsetSec: 0, durationSec: 10, ...bare },
        3,
      )
      expect(ctx.gains[1].gain.events).toEqual([...comeUp, ...tail(13)])
      // The source is brought round for the tail and stopped where the tail ends.
      const source = ctx.sources[0]
      expect([source.loop, source.loopStart, source.loopEnd]).toEqual([true, 0, 10])
      expect(source.startCalls.calls).toEqual([[3, 0]])
      expect(source.stopCalls.calls).toEqual([[13 + E]])
      // The clip still ends where it is drawn.
      expect(voice?.endTime).toBe(13)
    })

    it('the tail of one pass and the come-up of the next are mirrors, so a looped sound that follows itself is unbroken', () => {
      const { ctx, track } = setup()
      const repeating = { buffer: looped(ctx, 8), offsetSec: 0, loop: true, ...bare }
      track.play('first', { ...repeating, durationSec: 16 }, 3)
      track.play('second', { ...repeating, durationSec: 16 }, 19)
      const out = ctx.gains[1].gain.events.slice(-2)
      const into = ctx.gains[2].gain.events.slice(0, 3)
      expect(out).toEqual(tail(19))
      expect(into).toEqual(comeUpAt(19))
      // The first is still reading the region, round onto its start, while the second comes up on that start.
      expect(ctx.sources[0].stopCalls.calls).toEqual([[19 + E]])
      expect(ctx.sources[1].startCalls.calls).toEqual([[19, 0]])
    })

    it('a clip drawn longer than its sound is left to run out: it is not brought round to fill the clip', () => {
      const { ctx, track } = setup()
      // Eight seconds of sound under a twelve second clip that does not loop: four seconds of silence end it.
      const voice = track.play(
        'long',
        { buffer: looped(ctx, 8), offsetSec: 0, durationSec: 12, ...bare },
        3,
      )
      expect(ctx.gains[1].gain.events).toEqual(comeUp)
      const source = ctx.sources[0]
      expect(source.loop).toBe(false)
      expect(source.startCalls.calls).toEqual([[3, 0, 12]])
      expect(source.stopCalls.calls).toEqual([])
      expect(voice?.endTime).toBe(15)
    })

    it('a looping clip cut inside its region tails on what the sound goes on to', () => {
      const { ctx, track } = setup()
      // An 8 second sound for 14 seconds: once round, then cut six seconds in.
      track.play(
        'cut',
        { buffer: looped(ctx, 8), offsetSec: 0, loop: true, durationSec: 14, ...bare },
        3,
      )
      expect(ctx.gains[1].gain.events).toEqual([...comeUp, ...tail(17)])
      expect(ctx.sources[0].startCalls.calls).toEqual([[3, 0]])
      expect(ctx.sources[0].stopCalls.calls).toEqual([[17 + E]])
    })

    it('a clip shorter than its source tails on the source, as far as the source goes', () => {
      const { ctx, track } = setup()
      track.play('cut', { buffer: looped(ctx, 10), offsetSec: 0, durationSec: 6, ...bare }, 3)
      expect(ctx.gains[1].gain.events).toEqual([...comeUp, ...tail(9)])
      // No length: the source reads on past the clip's end and is stopped with the tail.
      expect(ctx.sources[0].loop).toBe(false)
      expect(ctx.sources[0].startCalls.calls).toEqual([[3, 0]])
      expect(ctx.sources[0].stopCalls.calls).toEqual([[9 + E]])
      // Three milliseconds short of the end of the source: that is all the tail there is.
      track.play('near', { buffer: looped(ctx, 10), offsetSec: 0, durationSec: 9.997, ...bare }, 3)
      const events = toNine(ctx.gains[2].gain.events)
      expect(events.slice(-2)).toEqual([
        ['setValueAtTime', 1, 12.997],
        ['linearRampToValueAtTime', 0, 13],
      ])
    })

    it('a sound that starts on its attack and dies away is left exactly as it was made', () => {
      const { ctx, track } = setup()
      track.play('k', { buffer: struck(ctx, 10), offsetSec: 0, durationSec: 10, ...bare }, 3)
      expect(ctx.gains[1].gain.events).toEqual(UNITY)
      expect(ctx.sources[0].loop).toBe(false)
      expect(ctx.sources[0].startCalls.calls).toEqual([[3, 0, 10]])
      expect(ctx.sources[0].stopCalls.calls).toEqual([])
    })

    it('a struck sound cut while it rings tails, and still starts on its attack', () => {
      const { ctx, track } = setup()
      // Cut at the top of a wave, two seconds in.
      const end = 3 + 2.0025
      track.play('k', { buffer: struck(ctx, 10), offsetSec: 0, durationSec: 2.0025, ...bare }, 3)
      expect(ctx.gains[1].gain.events).toEqual([...UNITY, ...tail(end)])
      expect(ctx.sources[0].startCalls.calls).toEqual([[3, 0]])
      expect(ctx.sources[0].stopCalls.calls).toEqual([[end + E]])
    })

    it('a sound that stops partway through a wave, with nothing to go on to, fades over its last few milliseconds', () => {
      const { ctx, track } = setup()
      track.play('k', { buffer: cutOff(ctx, 10), offsetSec: 0, durationSec: 10, ...bare }, 3)
      expect(ctx.gains[1].gain.events).toEqual([
        ...UNITY,
        { method: 'setValueAtTime', args: [1, 13 - E] },
        { method: 'linearRampToValueAtTime', args: [0, 13] },
      ])
      // Played out as any clip the length of its sound is.
      expect(ctx.sources[0].startCalls.calls).toEqual([[3, 0, 10]])
      expect(ctx.sources[0].stopCalls.calls).toEqual([])
    })

    it('a cut that falls where the sound is at rest is left', () => {
      const { ctx, track } = setup()
      track.play('silent', { buffer: buffer(ctx, 10), offsetSec: 0, durationSec: 6, ...bare }, 3)
      expect(ctx.gains[1].gain.events).toEqual(UNITY)
      expect(ctx.sources[0].startCalls.calls).toEqual([[3, 0, 6]])
      // Within a millisecond of the sound's own end counts as that end.
      track.play('near', { buffer: struck(ctx, 10), offsetSec: 0, durationSec: 9.9995, ...bare }, 3)
      expect(ctx.gains[2].gain.events).toEqual(UNITY)
    })

    it('a clip with fades of its own keeps them and gets nothing else', () => {
      const { ctx, track } = setup()
      track.play(
        'faded',
        {
          buffer: looped(ctx, 10),
          offsetSec: 0,
          durationSec: 6,
          ...bare,
          fadeInSec: 2,
          fadeOutSec: 1,
        },
        3,
      )
      expect(ctx.gains[1].gain.events).toEqual([
        { method: 'setValueAtTime', args: [0, 3 - HALF_FRAME] },
        { method: 'setValueAtTime', args: [0, 3] },
        { method: 'linearRampToValueAtTime', args: [1, 5] },
        { method: 'setValueAtTime', args: [1, 8] },
        { method: 'linearRampToValueAtTime', args: [0, 9] },
      ])
      expect(ctx.sources[0].startCalls.calls).toEqual([[3, 0, 6]])
      // One fade of its own: the other end is still seen to.
      track.play(
        'out',
        { buffer: looped(ctx, 10), offsetSec: 0, durationSec: 6, ...bare, fadeOutSec: 1 },
        3,
      )
      expect(ctx.gains[2].gain.events).toEqual([
        ...comeUp,
        { method: 'setValueAtTime', args: [1, 8] },
        { method: 'linearRampToValueAtTime', args: [0, 9] },
      ])
    })

    it('a region of its own inside the source is judged by its own two ends', () => {
      const { ctx, track } = setup()
      // Frames 2 s to 6 s of a wave that takes four seconds to come round: a region that loops.
      const region = {
        buffer: looped(ctx, 8, 2),
        loop: true,
        loopStartSec: 2,
        loopEndSec: 6,
        ...bare,
      }
      track.play('round', { ...region, offsetSec: 2, durationSec: 8 }, 3)
      expect(ctx.gains[1].gain.events).toEqual([...comeUp, ...tail(11)])
      expect(ctx.sources[0].stopCalls.calls).toEqual([[11 + E]])
    })

    it('a reversed clip is judged on its mirrored sound', () => {
      const { ctx, track } = setup()
      // Backwards from eight to two: it stops with two seconds of the sound unplayed.
      track.play(
        'short',
        { buffer: looped(ctx, 10), offsetSec: 2, durationSec: 6, reversed: true, ...bare },
        3,
      )
      expect(ctx.gains[1].gain.events.slice(-2)).toEqual(tail(9))
      // Backwards to the start of a sound that dies away: nothing to do.
      track.play(
        'to-start',
        { buffer: struck(ctx, 10), offsetSec: 0, durationSec: 6, reversed: true, ...bare },
        3,
      )
      expect(ctx.gains[2].gain.events).toEqual(UNITY)
    })

    it('the come-up and the tail are of the clock at any rate; a last fade is of the clip', () => {
      const { ctx, track } = setup()
      track.setRate(2)
      track.play('k', { buffer: looped(ctx, 10), offsetSec: 0, durationSec: 6, ...bare }, 3)
      expect(ctx.gains[1].gain.events).toEqual([...comeUp, ...tail(6)])
      expect(ctx.sources[0].stopCalls.calls).toEqual([[6 + E]])
      track.play('k2', { buffer: cutOff(ctx, 10), offsetSec: 0, durationSec: 10, ...bare }, 3)
      expect(ctx.gains[2].gain.events).toEqual([
        ...UNITY,
        { method: 'setValueAtTime', args: [1, 8 - E / 2] },
        { method: 'linearRampToValueAtTime', args: [0, 8] },
      ])
    })

    it('a clip shorter than the ease comes up over the whole of itself', () => {
      const { ctx, track } = setup()
      track.play('blip', { buffer: looped(ctx, 10), offsetSec: 0, durationSec: 0.002, ...bare }, 3)
      expect(toNine(ctx.gains[1].gain.events)).toEqual([
        ['setValueAtTime', 0, Number((3 - HALF_FRAME).toFixed(9))],
        ['setValueAtTime', 0, 3],
        ['linearRampToValueAtTime', 1, 3.002],
        ['setValueAtTime', 1, 3.002],
        ['linearRampToValueAtTime', 0, 3.007],
      ])
    })
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

  it('stop(key) and stopAll() silence a voice that has not started at once; onended forgets a voice', () => {
    const { ctx, track } = setup()
    const opts = {
      buffer: buffer(ctx, 10),
      offsetSec: 0,
      durationSec: 6,
      fadeInSec: 0,
      fadeOutSec: 0,
      fadeCurve: 'linear' as const,
    }
    track.play('a', opts, 1)
    track.play('b', opts, 1)
    track.play('c', opts, 2)
    track.stop('a')
    expect(ctx.sources[0].stopCalls.calls).toEqual([[]])
    expect(ctx.sources[0].disconnectCalls.count).toBe(1)
    expect(track.voice('a')).toBeUndefined()
    ctx.sources[1].finish()
    expect(track.voice('b')).toBeUndefined()
    expect(ctx.sources[1].disconnectCalls.count).toBe(1)
    track.stopAll()
    expect(ctx.sources[2].stopCalls.calls).toEqual([[]])
    expect(track.voices()).toHaveLength(0)
  })

  describe('a voice stopped while it sounds', () => {
    const E = JOIN_EASE_SECONDS
    const bare = { fadeInSec: 0, fadeOutSec: 0, fadeCurve: 'linear' as const }
    const fall = (at: number, from = 1) => [
      { method: 'cancelAndHoldAtTime', args: [at] },
      { method: 'setValueAtTime', args: [from, at] },
      { method: 'linearRampToValueAtTime', args: [0, at + E] },
    ]

    it('is not cut dead: it falls silent over a few milliseconds and its key is free at once', () => {
      const { ctx, track } = setup()
      const voice = track.play(
        'k',
        { buffer: buffer(ctx, 10), offsetSec: 0, durationSec: 6, ...bare },
        0,
      )
      ctx.currentTime = 2
      track.stop('k')
      expect(ctx.gains[1].gain.events.slice(-3)).toEqual(fall(2))
      expect(ctx.sources[0].stopCalls.calls).toEqual([[2 + E]])
      expect(voice?.endTime).toBe(2 + E)
      // Forgotten now, still wired until its source ends.
      expect(track.voice('k')).toBeUndefined()
      expect(ctx.sources[0].disconnectCalls.count).toBe(0)
      ctx.sources[0].finish()
      expect(ctx.sources[0].disconnectCalls.count).toBe(1)
    })

    it('stopAll() lets every sounding voice fall and silences the ones still to come', () => {
      const { ctx, track } = setup()
      const opts = { buffer: buffer(ctx, 10), offsetSec: 0, durationSec: 6, ...bare }
      track.play('sounding', opts, 0)
      track.play('pending', opts, 3)
      ctx.currentTime = 2
      track.stopAll()
      expect(ctx.sources[0].stopCalls.calls).toEqual([[2 + E]])
      expect(ctx.sources[1].stopCalls.calls).toEqual([[]])
      expect(track.voices()).toHaveLength(0)
    })

    it('falls from where its own fade has got to, and from its come-up', () => {
      const { ctx, track } = setup()
      // Halfway down a four second fade-out.
      track.play(
        'fading',
        {
          buffer: buffer(ctx, 10),
          offsetSec: 0,
          durationSec: 6,
          fadeInSec: 0,
          fadeOutSec: 4,
          fadeCurve: 'linear',
        },
        0,
      )
      ctx.currentTime = 4
      track.stop('fading')
      expect(ctx.gains[1].gain.events.slice(-3)).toEqual(fall(4, 0.5))
      // Two of the five milliseconds into the come-up of a sound made to loop.
      ctx.currentTime = 10
      track.play('rising', { buffer: looped(ctx, 8), offsetSec: 0, durationSec: 8, ...bare }, 10)
      ctx.currentTime = 10.002
      track.stop('rising')
      expect(toNine(ctx.gains[2].gain.events.slice(-3))).toEqual(toNine(fall(10.002, 0.4)))
    })

    it('falls from the level it was given where its two fades overlap, not from the triangle they draw', () => {
      const { ctx, track } = setup()
      // Four seconds up and four down in six: the fade-in is played out, and the fade-out has the last two.
      track.play(
        'k',
        {
          buffer: buffer(ctx, 10),
          offsetSec: 0,
          durationSec: 6,
          fadeInSec: 4,
          fadeOutSec: 4,
          fadeCurve: 'linear',
        },
        0,
      )
      expect(ctx.gains[1].gain.events.slice(-3)).toEqual([
        { method: 'linearRampToValueAtTime', args: [1, 4] },
        { method: 'setValueAtTime', args: [1, 4] },
        { method: 'linearRampToValueAtTime', args: [0, 6] },
      ])
      ctx.currentTime = 5
      track.stop('k')
      expect(ctx.gains[1].gain.events.slice(-3)).toEqual(fall(5, 0.5))

      // On the way up, past where the triangle would have turned down.
      ctx.currentTime = 10
      track.play(
        'up',
        {
          buffer: buffer(ctx, 10),
          offsetSec: 0,
          durationSec: 6,
          fadeInSec: 4,
          fadeOutSec: 4,
          fadeCurve: 'linear',
        },
        10,
      )
      ctx.currentTime = 13.5
      track.stop('up')
      expect(ctx.gains[2].gain.events.slice(-3)).toEqual(fall(13.5, 0.875))
    })

    it('joined inside its fade-out, falls from the line it was put on', () => {
      const { ctx, track } = setup({ currentTime: 5 })
      // A six second clip that started at 0, entered at 5 with a fade-out over its last four.
      track.play(
        'k',
        {
          buffer: buffer(ctx, 10),
          offsetSec: 0,
          durationSec: 6,
          fadeInSec: 0,
          fadeOutSec: 4,
          fadeCurve: 'linear',
          easeInSec: 0,
        },
        0,
      )
      ctx.currentTime = 5.5
      track.stop('k')
      expect(toNine(ctx.gains[1].gain.events.slice(-3))).toEqual(toNine(fall(5.5, 0.125)))
    })

    it('where the browser cannot hold a level, cancels and sets it', () => {
      const { ctx, track } = setup()
      const voice = track.play(
        'k',
        { buffer: buffer(ctx, 10), offsetSec: 0, durationSec: 6, ...bare },
        0,
      )
      const level = voice?.gain.gain as unknown as { cancelAndHoldAtTime?: unknown }
      level.cancelAndHoldAtTime = undefined
      ctx.currentTime = 2
      track.stop('k')
      expect(ctx.gains[1].gain.events.slice(-3)).toEqual([
        { method: 'cancelScheduledValues', args: [2] },
        { method: 'setValueAtTime', args: [1, 2] },
        { method: 'linearRampToValueAtTime', args: [0, 2 + E] },
      ])
    })

    it('in its tail it is left to finish it; past its end it is silenced', () => {
      const { ctx, track } = setup()
      // A sound made to loop, once: it tails for five milliseconds past 8 s.
      track.play('k', { buffer: looped(ctx, 8), offsetSec: 0, durationSec: 8, ...bare }, 0)
      const written = ctx.gains[1].gain.events.length
      ctx.currentTime = 8.002
      track.stopAll()
      expect(ctx.gains[1].gain.events).toHaveLength(written)
      expect(ctx.sources[0].stopCalls.calls).toEqual([[8 + E]])
      expect(track.voices()).toHaveLength(0)
      ctx.sources[0].finish()
      expect(ctx.sources[0].disconnectCalls.count).toBe(1)

      track.play('over', { buffer: buffer(ctx, 10), offsetSec: 0, durationSec: 1, ...bare }, 9)
      ctx.currentTime = 11
      track.stop('over')
      expect(ctx.sources[1].stopCalls.last).toEqual([])
    })
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

  it('transport stop with a fade stops sources at now + fade; pause lets what sounds fall silent', async () => {
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
    // Pause lets go of everything at once: the voice the stop left sounding and the new one fall silent together.
    expect(ctx.sources[0].stopCalls.last).toEqual([1 + JOIN_EASE_SECONDS])
    expect(ctx.sources[1].stopCalls.last).toEqual([1 + JOIN_EASE_SECONDS])
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
      { method: 'setValueAtTime', args: [0, 4 - 0.5 / ctx.sampleRate] },
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
    // The ramp is cut where it is far from rest, so the source reads on into a tail and is stopped after it.
    expect(ctx.sources[0].startCalls.calls).toEqual([[1, 5]])
    expect(ctx.sources[0].stopCalls.calls).toEqual([[4 + JOIN_EASE_SECONDS]])
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
    // The ramp is cut where it is far from rest, so the source reads on into a tail and is stopped after it.
    expect(ctx.sources[0].startCalls.calls).toEqual([[1, 5]])
    expect(ctx.sources[0].stopCalls.calls).toEqual([[4 + JOIN_EASE_SECONDS]])
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
    // The level glides: a straight line in dB from where it stood.
    expect(trim.gain.events[0]).toEqual({ method: 'setValueAtTime', args: [1, 2] })
    const [level, at] = trim.gain.lastEvent('exponentialRampToValueAtTime')?.args as number[]
    expect(level).toBeCloseTo(10 ** (-9 / 20))
    expect(at).toBe(2 + PLACEMENT_GLIDE_SECONDS)
    // The send did not exist: it is made silent and comes up beside the dry path.
    const send = played?.placement?.send as unknown as (typeof ctx.gains)[number]
    expect(send.gain.value).toBe(0)
    expect(send.gain.lastEvent('setTargetAtTime')?.args[0]).toBeCloseTo(10 ** (-3 / 20))
    expect(send.isConnectedTo(ctx.convolvers[0])).toBe(true)
    // Taking the send away again fades it; the node stays for the next change.
    track.place('k', { gainDb: -9, pan: -0.6, lowpassHz: 2000 })
    expect(send.gain.lastEvent('setTargetAtTime')?.args[0]).toBe(0)
    expect(ctx.convolvers).toHaveLength(1)
    // Nothing was ringing in a room that was not there: it is left as it is.
    expect(track.strip.sourceNodes).toContain(ctx.convolvers[0])
  })

  it('a send that is already open glides to its new level, once it has arrived', () => {
    const { ctx, track } = setup({ currentTime: 2 })
    const played = track.play('k', { ...voice, buffer: buffer(ctx, 10), pan: 0, spaceDb: -6 }, 1)
    const send = played?.placement?.send as unknown as (typeof ctx.gains)[number]
    track.place('k', { gainDb: 0, pan: 0, spaceDb: 0 })
    expect(send.gain.events).toEqual([
      { method: 'setValueAtTime', args: [10 ** (-6 / 20), 2] },
      { method: 'exponentialRampToValueAtTime', args: [1, 2 + PLACEMENT_GLIDE_SECONDS] },
    ])
    // Closed and opened again it approaches, and glides once that has settled.
    track.place('k', { gainDb: 0, pan: 0 })
    ctx.currentTime = 3
    track.place('k', { gainDb: 0, pan: 0, spaceDb: -6 })
    track.place('k', { gainDb: 0, pan: 0, spaceDb: -12 })
    expect(send.gain.events.slice(-2).map((event) => event.method)).toEqual([
      'setTargetAtTime',
      'setTargetAtTime',
    ])
    ctx.currentTime = 4
    track.place('k', { gainDb: 0, pan: 0, spaceDb: -18 })
    expect(send.gain.lastEvent('exponentialRampToValueAtTime')?.args[1]).toBe(
      4 + PLACEMENT_GLIDE_SECONDS,
    )
  })

  describe('the room behind a voice that is turned down', () => {
    type MockGain = MockAudioContext['gains'][number]
    const ramps = (gain: MockGain): number[][] =>
      gain.gain.eventsFor('exponentialRampToValueAtTime').map((event) => event.args as number[])
    /** The gains a tilted room has: one ahead of the convolver, one after it. */
    function tilted(ctx: MockAudioContext, dest: MockGain): { pre: MockGain; post: MockGain } {
      const [room] = ctx.convolvers
      const pre = ctx.gains.find((gain) => gain.isConnectedTo(room))
      const post = ctx.gains.find((gain) => gain !== dest && room.isConnectedTo(gain))
      if (!pre || !post) throw new Error('the room has not been tilted')
      return { pre, post }
    }

    it('comes down with it, and what the voice sends from then on goes in as loud as before', () => {
      const { ctx, dest, track } = setup({ currentTime: 2 })
      const played = track.play('k', { ...voice, buffer: buffer(ctx, 10), pan: 0, spaceDb: -6 }, 1)
      const [room] = ctx.convolvers
      const send = played?.placement?.send as unknown as MockGain
      const trim = played?.trim as unknown as MockGain
      expect(track.place('k', { gainDb: -12, pan: 0, spaceDb: -6 })).toBe(true)
      const { pre, post } = tilted(ctx, dest)
      const down = 10 ** (-12 / 20)
      const reached = 2 + PLACEMENT_GLIDE_SECONDS
      expect(ramps(trim)[0][0]).toBeCloseTo(down, 12)
      expect(ramps(trim)[0][1]).toBe(reached)
      // After the room: what rings is as far down as the voice, by the same moment.
      expect(ramps(post)[0][0]).toBeCloseTo(down, 12)
      expect(ramps(post)[0][1]).toBe(reached)
      // Ahead of it: up by as much, so the trim and this gain cancel on the way in.
      expect(ramps(pre)[0][0] * ramps(trim)[0][0]).toBeCloseTo(1, 12)
      expect(ramps(pre)[0][1]).toBe(reached)
      // Both come back to 1 together, long after.
      expect(ramps(post)[1][0]).toBe(1)
      expect(ramps(pre)[1]).toEqual(ramps(post)[1])
      expect(ramps(post)[1][1]).toBeGreaterThan(reached + 5)
      // The send goes in ahead of the new gain, and the strip hears the room through the other.
      expect(send.isConnectedTo(pre)).toBe(true)
      expect(send.isConnectedTo(room)).toBe(false)
      expect(post.isConnectedTo(dest)).toBe(true)
      expect(room.isConnectedTo(dest)).toBe(false)
      expect(track.strip.sourceNodes).toContain(post)
      expect(track.strip.sourceNodes).not.toContain(room)
      expect(track.space).toBe(room)
      // A voice that starts afterwards sends in at the same place.
      const next = track.play('n', { ...voice, buffer: buffer(ctx, 10), pan: 0, spaceDb: -6 }, 2)
      expect((next?.placement?.send as unknown as MockGain).isConnectedTo(pre)).toBe(true)
    })

    it('comes down by the voice’s share of what is sent into it', () => {
      const { ctx, dest, track } = setup({ currentTime: 2 })
      track.play('a', { ...voice, buffer: buffer(ctx, 10), pan: 0, spaceDb: -6 }, 1)
      track.play('b', { ...voice, buffer: buffer(ctx, 10), pan: 0, spaceDb: -6 }, 1)
      track.place('a', { gainDb: -20, pan: 0, spaceDb: -6 })
      const { post } = tilted(ctx, dest)
      // Two equal voices, one down 20 dB: the power sent falls from 2 to 1.01.
      expect(ramps(post)[0][0]).toBeCloseTo(Math.sqrt(1.01 / 2), 12)
    })

    it('comes down when a send is turned down, as it does for the level', () => {
      const { ctx, dest, track } = setup({ currentTime: 2 })
      track.play('k', { ...voice, buffer: buffer(ctx, 10), pan: 0, spaceDb: 0 }, 1)
      track.place('k', { gainDb: 0, pan: 0, spaceDb: -12 })
      expect(ramps(tilted(ctx, dest).post)[0][0]).toBeCloseTo(10 ** (-12 / 20), 12)
    })

    it('is left alone when the voice is turned up, when it has not started, and when its send closes', () => {
      const { ctx, dest, track } = setup({ currentTime: 2 })
      track.play('k', { ...voice, buffer: buffer(ctx, 10), gainDb: -12, pan: 0, spaceDb: -6 }, 1)
      track.play('later', { ...voice, buffer: buffer(ctx, 10), pan: 0, spaceDb: -6 }, 3)
      const gains = ctx.gains.length
      track.place('k', { gainDb: 0, pan: 0, spaceDb: -6 })
      track.place('later', { gainDb: -30, pan: 0, spaceDb: -6 })
      track.place('k', { gainDb: 0, pan: 0 })
      expect(ctx.gains).toHaveLength(gains)
      expect(ctx.convolvers[0].isConnectedTo(dest)).toBe(true)
    })

    it('follows a scheduled clip that is turned down, once for the edit', async () => {
      const { ctx, dest, samples, track } = setup({ lookaheadSec: 1 })
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
        spaceDb: -6,
      }
      track.clips.add(clip)
      track.clips.add({ ...clip, id: 'b' })
      transport.start()
      scheduler.tick()
      ctx.currentTime = 1
      track.clips.update('a', { gainDb: -20 })
      const { post } = tilted(ctx, dest)
      expect(ramps(post)).toHaveLength(2)
      expect(ramps(post)[0][0]).toBeCloseTo(Math.sqrt(1.01 / 2), 12)
      scheduler.dispose()
    })
  })

  describe('a voice that was started without a place', () => {
    type MockGain = MockAudioContext['gains'][number]

    it('follows its level through the trim it has', () => {
      const { ctx, track } = setup({ currentTime: 2 })
      const played = track.play('k', { ...voice, buffer: buffer(ctx, 10), gainDb: -6 }, 1)
      const trim = played?.trim as unknown as MockGain
      expect(track.place('k', { gainDb: -12 })).toBe(true)
      expect(trim.gain.events).toEqual([
        { method: 'setValueAtTime', args: [trimGain(-6), 2] },
        {
          method: 'exponentialRampToValueAtTime',
          args: [trimGain(-12), 2 + PLACEMENT_GLIDE_SECONDS],
        },
      ])
      // The same level again sends nothing.
      track.place('k', { gainDb: -12 })
      expect(trim.gain.events).toHaveLength(2)
      expect(ctx.panners).toHaveLength(0)
    })

    it('is given a trim when it was started at unity, and loses it with the voice', () => {
      const { ctx, dest, track } = setup({ currentTime: 2 })
      const played = track.play('k', { ...voice, buffer: buffer(ctx, 10) }, 1)
      const envelope = played?.gain as unknown as MockGain
      expect(played?.trim).toBeNull()
      expect(envelope.isConnectedTo(dest)).toBe(true)
      // Nothing to move: nothing is made.
      expect(track.place('k', { gainDb: 0 })).toBe(true)
      expect(played?.trim).toBeNull()
      expect(track.place('k', { gainDb: -6 })).toBe(true)
      const trim = played?.trim as unknown as MockGain
      expect(trim).not.toBeNull()
      expect(envelope.isConnectedTo(trim)).toBe(true)
      expect(envelope.isConnectedTo(dest)).toBe(false)
      expect(trim.isConnectedTo(dest)).toBe(true)
      expect(track.strip.sourceNodes).toEqual([trim])
      expect(trim.gain.lastEvent('exponentialRampToValueAtTime')?.args[0]).toBeCloseTo(trimGain(-6))
      track.stop('k')
      // Sounding, so it falls silent first; its nodes go when its source ends.
      ctx.sources[0].finish()
      expect(trim.isConnectedTo(dest)).toBe(false)
      expect(track.strip.sourceNodes).toEqual([])
    })

    it('goes as far down as a placed clip once its clip names the middle', () => {
      const { ctx, track } = setup({ currentTime: 2 })
      const played = track.play('k', { ...voice, buffer: buffer(ctx, 10), gainDb: -6 }, 1)
      const trim = played?.trim as unknown as MockGain
      const last = (): number =>
        trim.gain.lastEvent('exponentialRampToValueAtTime')?.args[0] as number
      track.place('k', { gainDb: -40 })
      expect(last()).toBeCloseTo(trimGain(-MAX_CLIP_GAIN_DB))
      expect(track.place('k', { gainDb: -40, pan: 0 })).toBe(true)
      expect(last()).toBeCloseTo(placedTrimGain(-40))
    })

    it('takes the level and says so when it is asked for a place it has no nodes for', () => {
      const { ctx, track } = setup({ currentTime: 2 })
      const played = track.play('k', { ...voice, buffer: buffer(ctx, 10), gainDb: -6 }, 1)
      const trim = played?.trim as unknown as MockGain
      expect(track.place('k', { gainDb: -9, pan: 0.5 })).toBe(false)
      expect(track.place('k', { gainDb: -9, lowpassHz: 2000 })).toBe(false)
      expect(track.place('k', { gainDb: -9, spaceDb: -6 })).toBe(false)
      expect(track.place('missing', { gainDb: 0, pan: 0.5 })).toBe(false)
      expect(trim.gain.eventsFor('exponentialRampToValueAtTime')).toHaveLength(1)
      expect(ctx.panners).toHaveLength(0)
      expect(ctx.convolvers).toHaveLength(0)
    })
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

  it('a driven, drifting room is a saturator ahead of the convolver and a moving delay after it', () => {
    const ctx = createMockContext({ sampleRate: 48000 })
    const dest = ctx.createGain()
    const track = new AudioTrack(asAudioContext(ctx), {
      name: 'music',
      destination: dest as unknown as AudioNode,
      samples: new SampleStore(asAudioContext(ctx)),
      now: () => ctx.currentTime,
      spaceImpulse: () => buffer(ctx, 2),
      spaceColour: () => ({ driveDb: 12, driftCents: 10, driftHz: 0.5 }),
    })
    const played = track.play('k', { ...voice, buffer: buffer(ctx, 10), spaceDb: 0 }, 1)
    const send = played?.placement?.send as unknown as (typeof ctx.gains)[number]
    const [room] = ctx.convolvers
    const [shaper] = ctx.shapers
    const [delay] = ctx.delays
    const gains = spaceDriveGains(12)
    const into = gainInto(ctx, shaper)
    const outOf = [...shaper.outputs][0] as (typeof ctx.gains)[number]
    expect(send.isConnectedTo(into)).toBe(true)
    expect(send.isConnectedTo(room)).toBe(false)
    expect(into.gain.value).toBeCloseTo(gains.into)
    expect(outOf.gain.value).toBeCloseTo(gains.outOf)
    expect(outOf.isConnectedTo(room)).toBe(true)
    expect(shaper.oversample).toBe('2x')
    expect(shaper.curve?.length).toBeGreaterThan(1000)
    // The room comes back through the delay, and only the delay feeds the strip.
    expect(room.isConnectedTo(delay)).toBe(true)
    expect(room.isConnectedTo(dest)).toBe(false)
    expect(delay.isConnectedTo(dest)).toBe(true)
    expect(track.strip.sourceNodes).toContain(delay)
    const drift = spaceDrift({ driftCents: 10, driftHz: 0.5 })
    expect(delay.delayTime.value).toBeCloseTo(drift.delaySec)
    expect(ctx.oscillators).toHaveLength(2)
    expect(ctx.oscillators.map((oscillator) => oscillator.frequency.value)).toEqual(drift.rates)
    expect(ctx.oscillators.every((oscillator) => oscillator.startCalls.count === 1)).toBe(true)
    expect(track.space).toBe(room)
  })

  it('refreshSpace on the same impulse moves the drive and drift of the nodes that are there', () => {
    const ctx = createMockContext({ sampleRate: 48000, currentTime: 3 })
    const dest = ctx.createGain()
    const impulse = buffer(ctx, 2)
    let colour = { driveDb: 6, driftCents: 5, driftHz: 0.5 }
    const track = new AudioTrack(asAudioContext(ctx), {
      name: 'music',
      destination: dest as unknown as AudioNode,
      samples: new SampleStore(asAudioContext(ctx)),
      now: () => ctx.currentTime,
      spaceImpulse: () => impulse,
      spaceColour: () => colour,
    })
    // Nothing has been sent yet: there is no room to change.
    track.refreshSpace()
    expect(ctx.convolvers).toHaveLength(0)
    track.play('k', { ...voice, buffer: buffer(ctx, 10), spaceDb: 0 }, 1)
    const [shaper] = ctx.shapers
    const into = gainInto(ctx, shaper)
    colour = { driveDb: 18, driftCents: 20, driftHz: 1 }
    track.refreshSpace()
    expect(ctx.convolvers).toHaveLength(1)
    expect(into.gain.lastEvent('setTargetAtTime')?.args[0]).toBeCloseTo(spaceDriveGains(18).into)
    expect(into.gain.lastEvent('setTargetAtTime')?.args[1]).toBe(3)
    const drift = spaceDrift({ driftCents: 20, driftHz: 1 })
    expect(ctx.delays[0].delayTime.lastEvent('setTargetAtTime')?.args[0]).toBeCloseTo(
      drift.delaySec,
    )
    expect(ctx.oscillators[1].frequency.lastEvent('setTargetAtTime')?.args[0]).toBeCloseTo(
      drift.rates[1],
    )
  })

  it('refreshSpace on another impulse moves what sounds to a new room and lets the old one ring out', () => {
    vi.useFakeTimers()
    try {
      const ctx = createMockContext({ sampleRate: 48000 })
      const dest = ctx.createGain()
      let impulse = buffer(ctx, 2)
      let colour = { driveDb: 0, driftCents: 0, driftHz: 0.5 }
      const track = new AudioTrack(asAudioContext(ctx), {
        name: 'music',
        destination: dest as unknown as AudioNode,
        samples: new SampleStore(asAudioContext(ctx)),
        now: () => ctx.currentTime,
        spaceImpulse: () => impulse,
        spaceColour: () => colour,
      })
      const a = track.play('a', { ...voice, buffer: buffer(ctx, 10), spaceDb: 0 }, 1)
      const b = track.play('b', { ...voice, buffer: buffer(ctx, 10), pan: 0.2 }, 1)
      const send = a?.placement?.send as unknown as (typeof ctx.gains)[number]
      const [old] = ctx.convolvers
      impulse = buffer(ctx, 4)
      track.refreshSpace()
      const [, next] = ctx.convolvers
      expect(next.buffer).toBe(impulse)
      expect(track.space).toBe(next)
      expect(send.isConnectedTo(next)).toBe(true)
      expect(send.isConnectedTo(old)).toBe(false)
      // A voice that sends nothing has nothing to move.
      expect(b?.placement?.send).toBeNull()
      // The old room still feeds the strip, so what was in it is heard to its end.
      expect(old.isConnectedTo(dest)).toBe(true)
      vi.advanceTimersByTime(1900)
      expect(old.isConnectedTo(dest)).toBe(true)
      vi.advanceTimersByTime(700)
      expect(old.isConnectedTo(dest)).toBe(false)
      expect(track.strip.sourceNodes).not.toContain(old)
      expect(next.isConnectedTo(dest)).toBe(true)

      // A clean room that becomes a driven one is a new set of nodes too, on the same impulse.
      colour = { driveDb: 9, driftCents: 0, driftHz: 0.5 }
      track.refreshSpace()
      expect(ctx.convolvers).toHaveLength(3)
      expect(ctx.convolvers[2].buffer).toBe(impulse)
      expect(send.isConnectedTo(next)).toBe(false)
      const into = gainInto(ctx, ctx.shapers[0])
      expect(send.isConnectedTo(into)).toBe(true)
      // A voice started now sends straight into the room as it is.
      const c = track.play('c', { ...voice, buffer: buffer(ctx, 10), spaceDb: -6 }, 1)
      expect(
        (c?.placement?.send as unknown as (typeof ctx.gains)[number]).isConnectedTo(into),
      ).toBe(true)

      // Disposing takes down the room and the one still ringing out.
      track.dispose()
      expect(next.isConnectedTo(dest)).toBe(false)
      expect(ctx.convolvers[2].outputs.size).toBe(0)
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('refreshSpace in a render that is not on the clock keeps the old room until the track goes', () => {
    vi.useFakeTimers()
    try {
      // A render can run slower than real time: a timer would cut the tail.
      const ctx = createMockOfflineContext({ sampleRate: 48000, length: 48000 * 20 })
      const dest = ctx.createGain()
      let impulse = buffer(ctx, 2)
      const track = new AudioTrack(asAudioContext(ctx), {
        name: 'music',
        destination: dest as unknown as AudioNode,
        samples: new SampleStore(asAudioContext(ctx)),
        now: () => ctx.currentTime,
        spaceImpulse: () => impulse,
      })
      const a = track.play('a', { ...voice, buffer: buffer(ctx, 10), spaceDb: 0 }, 1)
      const send = a?.placement?.send as unknown as (typeof ctx.gains)[number]
      const [old] = ctx.convolvers
      impulse = buffer(ctx, 4)
      track.refreshSpace()
      const [, next] = ctx.convolvers
      expect(send.isConnectedTo(next)).toBe(true)
      expect(vi.getTimerCount()).toBe(0)
      vi.advanceTimersByTime(60_000)
      expect(old.isConnectedTo(dest)).toBe(true)
      expect(next.isConnectedTo(dest)).toBe(true)

      track.dispose()
      expect(old.isConnectedTo(dest)).toBe(false)
      expect(next.isConnectedTo(dest)).toBe(false)
    } finally {
      vi.useRealTimers()
    }
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
      ).gain.lastEvent('exponentialRampToValueAtTime').args[0],
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

  it('a stretched timeline keeps its sounding voices: rescale takes them along to where their clips now are', async () => {
    const { ctx, track, transport, scheduler } = await scheduled()
    track.clips.add(clip('pad', 2))
    transport.start()
    ctx.currentTime = 104
    scheduler.tick()
    expect(ctx.sources).toHaveLength(1)
    const voice = track.voice('pad:0:2.000')
    expect(voice).toBeDefined()

    // 120 bpm to 96 bpm: every position 1.25 times as far along.
    scheduler.rescale(() => {
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

    // And the same edits outside rescale cut it, as a moved clip is.
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

describe('AudioTrack with a loop length of its own', () => {
  function note(id: string, startSec: number, durationSec = 2): Clip {
    return {
      id,
      sourceId: 's',
      startSec,
      offsetSec: 0,
      durationSec,
      fadeInSec: 0,
      fadeOutSec: 0,
      fadeCurve: 'linear',
      gainDb: 0,
    }
  }

  async function looped(loopLengthSec?: number | null) {
    const ctx = createMockContext({ currentTime: 0, sampleRate: 48000 })
    const samples = new SampleStore(asAudioContext(ctx))
    const transport = new Transport({
      now: () => ctx.currentTime,
      loop: { enabled: true, lengthSec: 32 },
    })
    const scheduler = new Scheduler({ transport, tickMs: 40 })
    const track = new AudioTrack(asAudioContext(ctx), {
      name: 'tape',
      destination: ctx.createGain() as unknown as AudioNode,
      samples,
      now: () => ctx.currentTime,
      lookaheadSec: 0.2,
      loopLengthSec,
      scheduler,
    })
    await samples.load('s', buffer(ctx, 10))
    /** Runs the clock to `sec`, ticking as the timer would. */
    const runTo = (sec: number) => {
      while (ctx.currentTime < sec) {
        ctx.currentTime = Math.min(sec, Math.round((ctx.currentTime + 0.1) * 10) / 10)
        scheduler.tick()
      }
    }
    const starts = () => ctx.sources.map((source) => source.startCalls.calls[0][0])
    return { ctx, transport, scheduler, track, runTo, starts }
  }

  it('follows the transport loop until it is given one', async () => {
    const { track, transport, runTo, starts } = await looped()
    expect(track.loopLengthSec).toBeNull()
    expect(track.timebase).toBeUndefined()
    track.clips.add(note('a', 5))
    transport.start()
    runTo(40)
    expect(starts()).toEqual([5, 37])
  })

  it('repeats its clips at its own length, on the time the transport has run', async () => {
    const { track, transport, runTo, starts } = await looped(10)
    expect(track.loopLengthSec).toBe(10)
    expect(track.timebase?.loop).toEqual({ enabled: true, lengthSec: 10 })
    track.clips.add(note('a', 5))
    transport.start()
    runTo(40)
    expect(starts()).toEqual([5, 15, 25, 35])
    expect(track.voice('a:3:5.000')).toBeDefined()
  })

  it('runs its own loop at the transport\u2019s rate, with every voice read that much faster', async () => {
    const { ctx, track, transport, runTo, starts } = await looped(10)
    track.clips.add(note('a', 5))
    transport.setRate(2)
    transport.start()
    runTo(12)
    // A pass of 10 timeline seconds is 5 on the clock.
    expect(starts()).toEqual([2.5, 7.5])
    expect(ctx.sources.map((source) => source.playbackRate.value)).toEqual([2, 2])
    // Slowed to the clock's own speed 12 s in (24 s along, 4 into the third pass): the same pass, later.
    transport.setRate(1)
    runTo(14)
    expect(starts().slice(2)).toEqual([13])
    expect(track.voice('a:2:5.000')).toBeDefined()
  })

  it('takes a length while it plays: what sounds fades, and it is entered where the loop now stands', async () => {
    const { ctx, track, transport, runTo, starts } = await looped()
    track.clips.add(note('a', 5, 4))
    transport.start()
    runTo(16)
    expect(starts()).toEqual([5])
    track.loopLengthSec = 10
    // 16 s in is 6 s into the 10 s loop's second pass: a second into the clip.
    expect(ctx.sources).toHaveLength(2)
    expect(ctx.sources[1].startCalls.calls).toEqual([[16, 1, 3]])
    const eased = ctx.gains.at(-1)?.gain.events.slice(0, 2)
    expect(eased).toEqual([
      { method: 'setValueAtTime', args: [0, 16] },
      { method: 'linearRampToValueAtTime', args: [1, 16 + JOIN_EASE_SECONDS] },
    ])
    runTo(30)
    expect(starts()).toEqual([5, 16, 25])
  })

  it('lets a sounding voice go over a few milliseconds when its length changes', async () => {
    const { ctx, track, transport, runTo } = await looped(10)
    track.clips.add(note('a', 5, 4))
    transport.start()
    runTo(6)
    const voice = track.voice('a:0:5.000')
    expect(voice).toBeDefined()
    track.loopLengthSec = 20
    expect(track.voice('a:0:5.000')).toBeUndefined()
    expect(voice?.endTime).toBeCloseTo(6 + REJOIN_FADE_SECONDS)
    // 6 s in is 6 s into the 20 s loop too: the clip comes straight back from there.
    expect(ctx.sources[1].startCalls.calls).toEqual([[6, 1, 3]])
  })

  it('goes back to the transport loop when the length is taken away', async () => {
    const { track, transport, runTo, starts } = await looped(10)
    track.clips.add(note('a', 5))
    transport.start()
    runTo(16)
    track.loopLengthSec = null
    expect(track.timebase).toBeUndefined()
    runTo(40)
    expect(starts()).toEqual([5, 15, 37])
  })

  it('keeps the length when it is moved to another scheduler, and has none to run on without one', async () => {
    const { ctx, track, transport, scheduler } = await looped(10)
    const first = track.timebase
    track.detach()
    expect(track.loopLengthSec).toBe(10)
    expect(track.timebase).toBeUndefined()
    track.loopLengthSec = 12
    track.attach(new Scheduler({ transport, tickMs: 40 }))
    expect(track.timebase).not.toBe(first)
    expect(track.timebase?.loop.lengthSec).toBe(12)
    expect(ctx.sources).toHaveLength(0)
    scheduler.dispose()
  })

  it('refuses a length that is not a positive number', async () => {
    const { track } = await looped()
    expect(() => (track.loopLengthSec = 0)).toThrow(RangeError)
    expect(() => (track.loopLengthSec = Number.NaN)).toThrow(RangeError)
  })
})

describe('AudioTrack rate (tape speed)', () => {
  const faded = {
    offsetSec: 1,
    durationSec: 6,
    fadeInSec: 2,
    fadeOutSec: 1,
    fadeCurve: 'linear' as const,
  }

  /** Recorded numbers rounded to 9 places: clock times come out of a division by the rate. */
  function rounded(events: { method: string; args: unknown[] }[]): [string, ...unknown[]][] {
    return events.map(({ method, args }) => [
      method,
      ...args.map((arg) => (typeof arg === 'number' ? Number(arg.toFixed(9)) : arg)),
    ])
  }

  it('plays at the clock by default and leaves the source at its own rate', () => {
    const { ctx, track } = setup()
    expect(track.rate).toBe(1)
    track.play('k', { buffer: buffer(ctx, 10), ...faded }, 3)
    expect(ctx.sources[0].playbackRate.value).toBe(1)
    expect(ctx.sources[0].playbackRate.events).toEqual([])
  })

  it('starts a voice at the rate: the buffer read that much faster, fades and end that much sooner', () => {
    const { ctx, track } = setup()
    track.setRate(2)
    const voice = track.play('k', { buffer: buffer(ctx, 10), ...faded }, 3)
    const source = ctx.sources[0]
    expect(source.playbackRate.value).toBe(2)
    // The same 6 s of buffer from the same offset: at double speed it is over in 3 s of clock.
    expect(source.startCalls.calls).toEqual([[3, 1, 6]])
    expect(ctx.gains[1].gain.events).toEqual([
      { method: 'setValueAtTime', args: [0, 3 - 0.5 / ctx.sampleRate] },
      { method: 'setValueAtTime', args: [0, 3] },
      { method: 'linearRampToValueAtTime', args: [1, 4] },
      { method: 'setValueAtTime', args: [1, 5.5] },
      { method: 'linearRampToValueAtTime', args: [0, 6] },
    ])
    expect(voice?.endTime).toBe(6)
  })

  it('joins late by as much of the clip as the rate has run through', () => {
    const { ctx, track } = setup({ currentTime: 4 })
    track.setRate(0.5)
    track.play('k', { buffer: buffer(ctx, 10), ...faded }, 3)
    // A second of clock late at half speed is half a second into the clip.
    expect(ctx.sources[0].startCalls.calls).toEqual([[4, 1.5, 5.5]])
    expect(ctx.gains[1].gain.events).toEqual([
      { method: 'setValueAtTime', args: [fadeGain(0.5, 6, 2, 1), 4] },
      { method: 'linearRampToValueAtTime', args: [1, 7] },
      { method: 'setValueAtTime', args: [1, 13] },
      { method: 'linearRampToValueAtTime', args: [0, 15] },
    ])
  })

  it('moves a sounding voice to a new rate: pitch at once, and what is left of its envelope', () => {
    const { ctx, track } = setup()
    const voice = track.play('k', { buffer: buffer(ctx, 10), ...faded }, 3)
    const source = ctx.sources[0]
    const level = ctx.gains[1].gain
    ctx.currentTime = 4
    level.events.length = 0
    track.setRate(0.5)

    expect(source.playbackRate.events).toEqual([{ method: 'setValueAtTime', args: [0.5, 4] }])
    // 1 s into the clip at clock 4, with 5 s of it left: 10 s of clock at half speed.
    expect(rounded(level.events)).toEqual([
      ['cancelAndHoldAtTime', 4],
      ['linearRampToValueAtTime', 1, 6],
      ['setValueAtTime', 1, 12],
      ['linearRampToValueAtTime', 0, 14],
    ])
    expect(voice?.endTime).toBe(14)
    // It ends by running out of the 6 s it was started with, so it is not told when.
    expect(source.stopCalls.count).toBe(0)
  })

  it('writes the level it has reached where the browser cannot hold it', () => {
    const { ctx, track } = setup()
    track.play('k', { buffer: buffer(ctx, 10), ...faded }, 3)
    const level = ctx.gains[1].gain
    ;(level as { cancelAndHoldAtTime?: unknown }).cancelAndHoldAtTime = undefined
    ctx.currentTime = 8.5
    level.events.length = 0
    track.setRate(2)
    // Half way down the fade-out, with half a second of clip left.
    expect(rounded(level.events)).toEqual([
      ['cancelScheduledValues', 8.5],
      ['setValueAtTime', 0.5, 8.5],
      ['linearRampToValueAtTime', 0, 8.75],
    ])
  })

  it('carries one change into the next: each starts from where the clip has got to', () => {
    const { ctx, track } = setup()
    const voice = track.play('k', { buffer: buffer(ctx, 20), ...faded, durationSec: 12 }, 0)
    const level = ctx.gains[1].gain
    ctx.currentTime = 4
    track.setRate(0.5)
    // 4 s in. Two more seconds of clock at half speed: 5 s in.
    ctx.currentTime = 6
    level.events.length = 0
    track.setRate(2)
    // 7 s of clip left at double speed.
    expect(rounded(level.events)).toEqual([
      ['cancelAndHoldAtTime', 6],
      ['setValueAtTime', 1, 9],
      ['linearRampToValueAtTime', 0, 9.5],
    ])
    expect(voice?.endTime).toBeCloseTo(9.5, 9)
    expect(ctx.sources[0].playbackRate.events).toEqual([
      { method: 'setValueAtTime', args: [0.5, 4] },
      { method: 'setValueAtTime', args: [2, 6] },
    ])
  })

  it('stops a looping voice where its clip now ends', () => {
    const { ctx, track } = setup()
    track.play(
      'k',
      { buffer: buffer(ctx, 2), ...faded, offsetSec: 0, fadeInSec: 0, fadeOutSec: 0, loop: true },
      3,
    )
    const source = ctx.sources[0]
    expect(source.stopCalls.calls).toEqual([[9]])
    ctx.currentTime = 6
    track.setRate(1.5)
    // 3 s of clip left take 2 s of clock.
    expect(source.stopCalls.calls).toEqual([[9], [8]])
  })

  it('moves the tail of a clip cut partway to where the clip now ends, and leaves a tail that has begun', () => {
    const { ctx, track } = setup()
    track.play(
      'k',
      { buffer: looped(ctx, 10), ...faded, offsetSec: 0, fadeInSec: 0, fadeOutSec: 0 },
      3,
    )
    const level = ctx.gains[1].gain
    ctx.currentTime = 6
    level.events.length = 0
    track.setRate(1.5)
    // 3 s of clip left take 2 s of clock; the tail after them is as long as it was.
    expect(rounded(level.events).slice(-2)).toEqual([
      ['setValueAtTime', 1, 8],
      ['linearRampToValueAtTime', 0, 8 + JOIN_EASE_SECONDS],
    ])
    expect(ctx.sources[0].stopCalls.calls.at(-1)).toEqual([8 + JOIN_EASE_SECONDS])
    // In the tail only the pitch follows.
    ctx.currentTime = 8.002
    level.events.length = 0
    track.setRate(1)
    expect(level.events).toEqual([])
    expect(ctx.sources[0].stopCalls.calls.at(-1)).toEqual([8 + JOIN_EASE_SECONDS])
  })

  it('eases a voice in over the same few milliseconds when the rate changes inside the ease', () => {
    const { ctx, track } = setup({ currentTime: 4.5 })
    track.play('k', { buffer: buffer(ctx, 10), ...faded, easeInSec: 0.004 }, 3)
    const level = ctx.gains[1].gain
    ;(level as { cancelAndHoldAtTime?: unknown }).cancelAndHoldAtTime = undefined
    ctx.currentTime = 4.502
    level.events.length = 0
    track.setRate(0.5)
    const afterEase = fadeGain(1.504, 6, 2, 1)
    expect(rounded(level.events)).toEqual([
      ['cancelScheduledValues', 4.502],
      ['setValueAtTime', Number((afterEase / 2).toFixed(9)), 4.502],
      // The 2 ms of clip left in the ease take 4 ms of clock.
      ['linearRampToValueAtTime', Number(afterEase.toFixed(9)), 4.506],
      ['linearRampToValueAtTime', 1, 5.498],
      ['setValueAtTime', 1, 11.498],
      ['linearRampToValueAtTime', 0, 13.498],
    ])
  })

  it('changes only the pitch of a voice that is fading out or was given a stop time', () => {
    const { ctx, track } = setup()
    track.play('fading', { buffer: buffer(ctx, 10), ...faded }, 0)
    track.play('stopping', { buffer: buffer(ctx, 10), ...faded }, 0)
    ctx.currentTime = 3
    track.fadeOutVoice('fading', 3, 0.5)
    track.stop('stopping', 3.25)
    const fading = ctx.gains[1].gain
    const stopping = ctx.gains[2].gain
    const before = [fading.events.length, stopping.events.length]
    ctx.currentTime = 3.1
    track.setRate(0.5)
    expect([fading.events.length, stopping.events.length]).toEqual(before)
    expect(ctx.sources.map((source) => source.playbackRate.events)).toEqual([
      [{ method: 'setValueAtTime', args: [0.5, 3.1] }],
      [{ method: 'setValueAtTime', args: [0.5, 3.1] }],
    ])
    expect(ctx.sources[0].stopCalls.calls).toEqual([[3.5]])
    expect(ctx.sources[1].stopCalls.calls).toEqual([[3.25]])
  })

  it('runs a voice that has not begun at the new rate from its own first frame', () => {
    const { ctx, track } = setup()
    const voice = track.play('k', { buffer: buffer(ctx, 10), ...faded }, 3)
    const level = ctx.gains[1].gain
    level.events.length = 0
    ctx.currentTime = 1
    track.setRate(2)
    expect(ctx.sources[0].playbackRate.events).toEqual([{ method: 'setValueAtTime', args: [2, 3] }])
    expect(rounded(level.events)).toEqual([
      ['cancelScheduledValues', 3],
      ['setValueAtTime', 0, 3],
      ['linearRampToValueAtTime', 1, 4],
      ['setValueAtTime', 1, 5.5],
      ['linearRampToValueAtTime', 0, 6],
    ])
    expect(voice?.startTime).toBe(3)
    expect(voice?.endTime).toBe(6)
  })

  it('leaves equal-power voices on the clock, new and sounding', () => {
    const { ctx, track } = setup()
    const options = {
      buffer: buffer(ctx, 30),
      offsetSec: 0,
      durationSec: 20,
      fadeInSec: CROSSFADE_SECONDS,
      fadeOutSec: CROSSFADE_SECONDS,
      fadeCurve: 'equalPower' as const,
    }
    track.play('before', options, 0)
    const events = ctx.gains[1].gain.events.length
    ctx.currentTime = 5
    track.setRate(0.5)
    track.play('after', options, 5)
    expect(ctx.gains[1].gain.events).toHaveLength(events)
    expect(ctx.sources.map((source) => source.playbackRate.events)).toEqual([[], []])
    expect(ctx.sources.map((source) => source.playbackRate.value)).toEqual([1, 1])
    expect(ctx.sources[1].stopCalls.calls).toEqual([[25]])
  })

  it('leaves a voice that has played out as it is: nothing is written at a time before the clock began', () => {
    for (const loop of [false, true]) {
      const { ctx, track } = setup()
      track.setRate(4)
      // 6 s of clip at four times the speed is over at 1.6 on the clock; its `ended` has not come.
      const voice = track.play('k', { buffer: buffer(ctx, 10), ...faded, loop }, 0.1)
      const source = ctx.sources[0]
      const level = ctx.gains[1].gain
      const stops = source.stopCalls.calls.length
      ctx.currentTime = 2
      level.events.length = 0
      track.setRate(0.25)
      // A ramp or a stop below zero is a RangeError in a browser.
      expect(level.events).toEqual([])
      expect(source.stopCalls.calls).toHaveLength(stops)
      expect(voice?.endTime).toBe(1.6)
    }
  })

  it('refuses a rate that is not a positive number and ignores the one it has', () => {
    const { ctx, track } = setup()
    track.play('k', { buffer: buffer(ctx, 10), ...faded }, 0)
    track.setRate(1)
    expect(ctx.sources[0].playbackRate.events).toEqual([])
    expect(() => track.setRate(0)).toThrow(RangeError)
    expect(() => track.setRate(Number.NaN)).toThrow(RangeError)
  })

  describe('on a scheduler', () => {
    function clip(id: string, startSec: number, extra: Partial<Clip> = {}): Clip {
      return {
        id,
        sourceId: 's',
        startSec,
        offsetSec: 0,
        durationSec: 8,
        fadeInSec: 0,
        fadeOutSec: 2,
        fadeCurve: 'linear',
        gainDb: 0,
        ...extra,
      }
    }

    async function scheduled() {
      const { ctx, samples, track } = setup({ currentTime: 100, lookaheadSec: 0.2 })
      const transport = new Transport({
        now: () => ctx.currentTime,
        loop: { enabled: true, lengthSec: 32 },
      })
      const scheduler = new Scheduler({ transport, tickMs: 40 })
      track.attach(scheduler)
      await samples.load('s', buffer(ctx, 20))
      return { ctx, track, transport, scheduler }
    }

    it('takes the transport rate: a sounding clip follows, a pending one is started again', async () => {
      const { ctx, track, transport, scheduler } = await scheduled()
      track.clips.add(clip('pad', 0))
      track.clips.add(clip('next', 4.05))
      transport.start()
      ctx.currentTime = 104
      scheduler.tick()
      expect(ctx.sources).toHaveLength(2)
      expect(ctx.sources[1].startCalls.calls[0][0]).toBeCloseTo(104.05, 9)

      transport.setRate(0.5)
      expect(track.rate).toBe(0.5)
      // The sounding pad: half its 8 s left, now 8 s of clock.
      expect(ctx.sources[0].playbackRate.events).toEqual([
        { method: 'setValueAtTime', args: [0.5, 104] },
      ])
      expect(track.voice('pad:0:0.000')?.endTime).toBe(112)
      // The pending one was silenced and scheduled afresh: 0.05 s of timeline is 0.1 s of clock.
      expect(ctx.sources).toHaveLength(3)
      expect(ctx.sources[1].stopCalls.count).toBe(1)
      expect(ctx.sources[2].playbackRate.value).toBe(0.5)
      expect(ctx.sources[2].startCalls.calls[0][0]).toBeCloseTo(104.1, 9)
      expect(track.voices()).toHaveLength(2)
      scheduler.dispose()
    })

    it('a track attached while the transport runs at another rate plays at it', async () => {
      const { ctx, samples } = setup({ currentTime: 100 })
      const transport = new Transport({ now: () => ctx.currentTime, rate: 1.25 })
      const scheduler = new Scheduler({ transport, tickMs: 40 })
      const track = new AudioTrack(asAudioContext(ctx), {
        name: 'late',
        destination: ctx.createGain() as unknown as AudioNode,
        samples,
        now: () => ctx.currentTime,
        scheduler,
      })
      expect(track.rate).toBe(1.25)
      scheduler.dispose()
    })

    it('enters a clip partway where the rate has brought the transport', async () => {
      const { ctx, track, transport, scheduler } = await scheduled()
      track.clips.add(clip('pad', 2, { fadeOutSec: 0 }))
      transport.setRate(2)
      transport.seek(5)
      transport.start()
      // 3 s into the clip; its start, at double speed, was 1.5 s of clock ago.
      expect(ctx.sources).toHaveLength(1)
      expect(ctx.sources[0].startCalls.calls).toEqual([[100, 3, 5]])
      expect(track.voice('pad:0:2.000')?.endTime).toBe(102.5)
      scheduler.dispose()
    })
  })
})

describe('AudioTrack on a device: nothing starts nearer the clock than can be kept to the frame', () => {
  // A device buffer of two blocks at 48 kHz: the floor is that and a block, 8 ms.
  const DEVICE = 256 / 48000
  const FLOOR = 384 / 48000
  const E = JOIN_EASE_SECONDS
  const HALF = 0.5 / 48000
  const bare = { fadeInSec: 0, fadeOutSec: 0, fadeCurve: 'linear' as const }
  const nine = (value: number) => Number(value.toFixed(9))
  const starts = (ctx: MockAudioContext, index = 0) =>
    ctx.sources[index].startCalls.calls.map((args) => args.map((arg) => nine(arg as number)))
  const levels = (voice: { gain: GainNode } | null) =>
    toNine(
      (voice?.gain.gain as unknown as { events: { method: string; args: unknown[] }[] }).events,
    )

  it('a start that has passed joins that far ahead of the clock and eases in, whoever asked', () => {
    const { ctx, track } = setup({ currentTime: 5, baseLatency: DEVICE })
    const voice = track.play(
      'k',
      { buffer: buffer(ctx, 10), offsetSec: 1, durationSec: 6, ...bare },
      4,
    )
    // A second and the floor into the clip, at 5.008.
    expect(starts(ctx)).toEqual([[5.008, 2.008, 4.992]])
    expect(voice?.startTime).toBeCloseTo(5 + FLOOR, 9)
    expect(voice?.endTime).toBe(10)
    // Silent from half a frame before its first, like any voice that starts on a frame of its own.
    expect(levels(voice)).toEqual([
      ['setValueAtTime', 0, nine(5 + FLOOR - HALF)],
      ['setValueAtTime', 0, 5.008],
      ['linearRampToValueAtTime', 1, nine(5.008 + E)],
    ])
  })

  it('a join the scheduler asked for starts there too, with the ease it was given', () => {
    const { ctx, track } = setup({ currentTime: 5, baseLatency: DEVICE })
    const voice = track.play(
      'k',
      { buffer: buffer(ctx, 10), offsetSec: 0, durationSec: 6, ...bare, easeInSec: 0.002 },
      4,
    )
    expect(starts(ctx)).toEqual([[5.008, 1.008, 4.992]])
    expect(levels(voice).slice(-1)).toEqual([['linearRampToValueAtTime', 1, 5.01]])
  })

  it('a start due any moment plays whole, from as soon as can be kept', () => {
    for (const when of [5, 5.004]) {
      const { ctx, track } = setup({ currentTime: 5, baseLatency: DEVICE })
      const voice = track.play(
        'k',
        { buffer: buffer(ctx, 10), offsetSec: 1, durationSec: 6, ...bare },
        when,
      )
      expect(starts(ctx)).toEqual([[5.008, 1, 6]])
      expect(voice?.startTime).toBeCloseTo(5.008, 9)
      expect(voice?.endTime).toBeCloseTo(11.008, 9)
      expect(levels(voice)).toEqual([['setValueAtTime', 1, 5.008]])
    }
  })

  it('a start far enough ahead is left where it was asked for', () => {
    for (const when of [5 + FLOOR, 5.5]) {
      const { ctx, track } = setup({ currentTime: 5, baseLatency: DEVICE })
      const voice = track.play(
        'k',
        { buffer: buffer(ctx, 10), offsetSec: 1, durationSec: 6, ...bare },
        when,
      )
      expect(starts(ctx)).toEqual([[nine(when), 1, 6]])
      expect(voice?.startTime).toBe(when)
    }
  })

  it('a looped sound due now comes up from there', () => {
    const { ctx, track } = setup({ currentTime: 5, baseLatency: DEVICE })
    const voice = track.play(
      'k',
      { buffer: looped(ctx, 4), offsetSec: 0, durationSec: 4, ...bare },
      5,
    )
    expect(levels(voice).slice(0, 3)).toEqual([
      ['setValueAtTime', 0, nine(5 + FLOOR - HALF)],
      ['setValueAtTime', 0, 5.008],
      ['linearRampToValueAtTime', 1, nine(5.008 + E)],
    ])
  })

  it('a voice let go falls from there, where one entered in its place comes up', () => {
    const { ctx, track } = setup({ baseLatency: DEVICE })
    const opts = { buffer: buffer(ctx, 10), offsetSec: 0, durationSec: 6, ...bare }
    const voice = track.play('sounding', opts, 0)
    track.play('pending', opts, 3)
    ctx.currentTime = 2
    track.stopAll()
    expect(levels(voice).slice(-3)).toEqual([
      ['cancelAndHoldAtTime', 2.008],
      ['setValueAtTime', 1, 2.008],
      ['linearRampToValueAtTime', 0, nine(2.008 + E)],
    ])
    expect(
      ctx.sources[0].stopCalls.calls.map((args) => args.map((arg) => nine(arg as number))),
    ).toEqual([[nine(2.008 + E)]])
    expect(voice?.endTime).toBeCloseTo(2.008 + E, 9)
    // Not sounding yet: dropped now.
    expect(ctx.sources[1].stopCalls.calls).toEqual([[]])
    expect(track.voices()).toHaveLength(0)

    // Its place is taken from the same moment.
    const joined = track.play('joined', { ...opts, easeInSec: E }, 1)
    expect(starts(ctx, 2)).toEqual([[2.008, 1.008, 4.992]])
    expect(levels(joined).slice(-1)).toEqual([['linearRampToValueAtTime', 1, nine(2.008 + E)]])
  })

  it('a voice released for another fades from there too, off its own envelope', () => {
    const { ctx, track } = setup({ baseLatency: DEVICE })
    // Halfway up a four second fade-in.
    const voice = track.play(
      'k',
      { buffer: buffer(ctx, 10), offsetSec: 0, durationSec: 8, ...bare, fadeInSec: 4 },
      1,
    )
    ctx.currentTime = 3
    track.release('k', 0.02)
    // The fade-in is kept up to where the fade-out starts, not dropped from now.
    expect(levels(voice).slice(-3)).toEqual([
      ['cancelAndHoldAtTime', 3.008],
      ['setValueAtTime', 0.502, 3.008],
      ['linearRampToValueAtTime', 0, 3.028],
    ])
    expect(voice?.endTime).toBeCloseTo(3.028, 9)
    expect(track.voice('k')).toBeUndefined()
  })

  describe('wiring that takes a while (a first send into a space makes the space)', () => {
    /** The first gain made from here on takes 150 ms of the clock. */
    function stall(ctx: MockAudioContext) {
      const createGain = ctx.createGain.bind(ctx)
      let stalled = false
      Object.assign(ctx, {
        createGain: () => {
          if (!stalled) ctx.currentTime += 0.15
          stalled = true
          return createGain()
        },
      })
    }

    it('reads the clock once the voice is wired: a start that passed meanwhile joins, eased', () => {
      const { ctx, track } = setup({ currentTime: 5, baseLatency: DEVICE })
      stall(ctx)
      const voice = track.play(
        'k',
        { buffer: buffer(ctx, 10), offsetSec: 0, durationSec: 6, ...bare },
        5.02,
      )
      // Due at 5.02 and wired at 5.15: joined the floor ahead of that, 0.138 s in.
      expect(starts(ctx)).toEqual([[5.158, 0.138, 5.862]])
      expect(levels(voice).slice(-1)).toEqual([['linearRampToValueAtTime', 1, nine(5.158 + E)]])
    })

    it('makes nothing of a voice that is over by then', () => {
      const { ctx, track } = setup({ currentTime: 5, baseLatency: DEVICE })
      stall(ctx)
      const voice = track.play(
        'k',
        { buffer: buffer(ctx, 10), offsetSec: 0, durationSec: 0.1, ...bare },
        5.02,
      )
      expect(voice).toBeNull()
      expect(ctx.sources[0].startCalls.count).toBe(0)
      expect(ctx.sources[0].disconnectCalls.count).toBe(1)
      expect(track.voices()).toHaveLength(0)
    })
  })

  it('a voice that ends before the fall could begin is left to end', () => {
    const { ctx, track } = setup({ baseLatency: DEVICE })
    // Starts at the floor (8 ms) and ends at 2.006 s; let go at 2 s, the fall would begin at 2.008 s.
    const voice = track.play(
      'k',
      { buffer: buffer(ctx, 10), offsetSec: 0, durationSec: 1.998, ...bare },
      0,
    )
    ctx.currentTime = 2
    const before = levels(voice)
    track.stop('k')
    expect(levels(voice)).toEqual(before)
    expect(ctx.sources[0].stopCalls.count).toBe(0)
    expect(track.voice('k')).toBeUndefined()
  })
})
