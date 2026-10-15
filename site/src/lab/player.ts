// What makes the sound. One AudioContext, made in the reader's click. A stage plays as a looping
// buffer; a new render, or another stage, starts a new buffer at the same place in the loop and
// crosses over to it in 20 ms. Every stage plays at one gain, with room over it, so a stage that
// passes full scale is heard unclipped and stages keep their true difference in level.

import type { Sounder, Tap } from './store.ts'

const SAMPLE_RATE = 48_000
const FADE = 0.02
/** With the volume at its starting place the stages play 12 dB under full scale. */
export const START_VOLUME = 0.7
export const volumeGain = (volume: number) => 0.5 * volume * volume

/** The part of the Web Audio API the player leans on, so a test can stand in for it. */
export interface PlayerContext {
  readonly currentTime: number
  readonly sampleRate: number
  readonly destination: AudioNode
  readonly state: string
  resume(): Promise<void>
  createGain(): GainNode
  createAnalyser(): AnalyserNode
  createBufferSource(): AudioBufferSourceNode
  createBuffer(channels: number, length: number, sampleRate: number): AudioBuffer
}

interface Voice {
  source: AudioBufferSourceNode
  gain: GainNode
}

export interface Player extends Sounder {
  /** The context, made on first use: call this only from a click. */
  context(): PlayerContext
  /** Where the bench's device takes the loop from, and where it sends its sound. */
  benchFeed(): AudioNode
  benchReturn(): AudioNode
  /** Seconds into the loop of what is sounding, or null when nothing is. */
  position(): number | null
  /** The loudest sample going out just now, 0 to 1 and over. */
  level(): number
}

export function createPlayer(makeContext: () => PlayerContext): Player {
  let context: PlayerContext | undefined
  let master: GainNode
  let taps: GainNode
  let feed: GainNode
  let back: GainNode
  let analyser: AnalyserNode
  let scope: Float32Array<ArrayBuffer> | undefined
  let voice: Voice | undefined
  let feedVoice: Voice | undefined
  /** The context's time at which the loop that is sounding was at its start. */
  let origin = 0
  let duration = 0
  let volume = START_VOLUME

  const ensure = (): PlayerContext => {
    if (context) {
      if (context.state === 'suspended') void context.resume()
      return context
    }
    context = makeContext()
    master = context.createGain()
    master.gain.value = volumeGain(volume)
    analyser = context.createAnalyser()
    analyser.fftSize = 2048
    master.connect(analyser)
    analyser.connect(context.destination)
    taps = context.createGain()
    taps.connect(master)
    feed = context.createGain()
    back = context.createGain()
    back.gain.value = 0
    back.connect(master)
    if (context.state === 'suspended') void context.resume()
    return context
  }

  const bufferOf = (ctx: PlayerContext, tap: Tap): AudioBuffer => {
    const buffer = ctx.createBuffer(2, Math.max(1, tap.length), SAMPLE_RATE)
    const left = tap.channels_data[0]
    const right = tap.channels_data[1] ?? left
    if (left) buffer.getChannelData(0).set(left)
    if (right) buffer.getChannelData(1).set(right)
    return buffer
  }

  const fadeOut = (ctx: PlayerContext, old: Voice | undefined) => {
    if (!old) return
    const now = ctx.currentTime
    old.gain.gain.setValueAtTime(old.gain.gain.value, now)
    old.gain.gain.linearRampToValueAtTime(0, now + FADE)
    old.source.stop(now + FADE)
  }

  /** A looping voice for a tap, into `into`, at the loop's present place (or its start). */
  const start = (ctx: PlayerContext, tap: Tap, into: AudioNode, restart: boolean): Voice => {
    const buffer = bufferOf(ctx, tap)
    const now = ctx.currentTime
    const sounding = voice !== undefined || feedVoice !== undefined
    if (restart || !sounding || duration <= 0) origin = now
    duration = buffer.duration
    const offset = (((now - origin) % duration) + duration) % duration
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(1, now + FADE)
    source.connect(gain)
    gain.connect(into)
    source.start(now, offset)
    return { source, gain }
  }

  const benchLevel = (ctx: PlayerContext, level: number) => {
    const now = ctx.currentTime
    back.gain.setValueAtTime(back.gain.value, now)
    back.gain.linearRampToValueAtTime(level, now + FADE)
  }

  return {
    context: ensure,
    benchFeed: () => (ensure(), feed),
    benchReturn: () => (ensure(), back),
    play(tap) {
      const ctx = ensure()
      // From silence a play starts at the loop's start; from the bench it carries on in place.
      const next = start(ctx, tap, taps, voice === undefined && feedVoice === undefined)
      fadeOut(ctx, voice)
      fadeOut(ctx, feedVoice)
      feedVoice = undefined
      benchLevel(ctx, 0)
      voice = next
    },
    update(tap) {
      if (!context || !voice) return
      const next = start(context, tap, taps, false)
      fadeOut(context, voice)
      voice = next
    },
    bench(source) {
      const ctx = ensure()
      if (!source) {
        fadeOut(ctx, feedVoice)
        feedVoice = undefined
        benchLevel(ctx, 0)
        return
      }
      const next = start(ctx, source, feed, false)
      fadeOut(ctx, voice)
      fadeOut(ctx, feedVoice)
      voice = undefined
      feedVoice = next
      benchLevel(ctx, 1)
    },
    stop() {
      if (!context) return
      fadeOut(context, voice)
      fadeOut(context, feedVoice)
      voice = undefined
      feedVoice = undefined
      benchLevel(context, 0)
    },
    setVolume(next) {
      volume = next
      if (!context) return
      master.gain.setTargetAtTime(volumeGain(volume), context.currentTime, 0.015)
    },
    position() {
      if (!context || (!voice && !feedVoice) || duration <= 0) return null
      return (((context.currentTime - origin) % duration) + duration) % duration
    },
    level() {
      if (!context || (!voice && !feedVoice)) return 0
      scope ??= new Float32Array(analyser.fftSize)
      analyser.getFloatTimeDomainData(scope)
      let peak = 0
      for (let i = 0; i < scope.length; i += 1) peak = Math.max(peak, Math.abs(scope[i]!))
      return peak
    },
  }
}

/** The player of a page: a real AudioContext at the labs' rate where the browser will give one. */
export function createPagePlayer(): Player {
  return createPlayer(() => {
    try {
      return new AudioContext({ sampleRate: SAMPLE_RATE, latencyHint: 'interactive' })
    } catch {
      return new AudioContext()
    }
  })
}
