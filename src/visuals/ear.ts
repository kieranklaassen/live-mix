// What the visuals hear: the level and the spectrum of the whole mix, read from the master as it plays.
//
// It is a tap of its own, so nothing the meters read is changed by it, and it costs nothing until something asks
// what is heard.
//
// Browser only.

import { SPECTRUM_BANDS } from './frame'
import type { Heard } from './follow'

/** Where the master can be listened to. */
export interface TappedMaster {
  addTap(node: AudioNode): void
  removeTap(node: AudioNode): void
}

/** Any node listened to as a master is: the engine's master has `addTap` of its own, a plain node is tapped with this. */
export function tapOf(node: AudioNode): TappedMaster {
  return {
    addTap: (tap) => void node.connect(tap),
    removeTap: (tap) => node.disconnect(tap),
  }
}

export interface VisualEar {
  /**
   * What is heard now. The same object every time, filled anew. With `agoSec`, what was read that long ago
   * instead: the master is listened to before the sound has left the speakers, and where that takes long (a
   * wireless headset) the picture would run ahead of what is heard.
   */
  read(agoSec?: number): Heard
  close(): void
}

/** How many readings are kept to answer for a while ago, and how far back that goes at most, in seconds. */
const KEPT_READINGS = 64
export const EAR_KEEPS_SEC = 0.5

/** The spectrum is read between these, in equal steps of pitch. */
const LOWEST_HZ = 40
const HIGHEST_HZ = 14_000
/** The level that reads as nothing and the one that reads as full, dBFS. */
const QUIET_DB = -54
const FULL_DB = -9

const clamp01 = (value: number): number => (value > 0 ? (value < 1 ? value : 1) : 0)

/** The first and one past the last bin of each band, for a spectrum of `bins` bins up to half of `sampleRate`. */
export function bandEdges(bins: number, sampleRate: number): Uint16Array {
  const edges = new Uint16Array(SPECTRUM_BANDS + 1)
  const hzPerBin = sampleRate / 2 / bins
  for (let band = 0; band <= SPECTRUM_BANDS; band++) {
    const hz = LOWEST_HZ * Math.pow(HIGHEST_HZ / LOWEST_HZ, band / SPECTRUM_BANDS)
    edges[band] = Math.min(bins, Math.max(band, Math.round(hz / hzPerBin)))
  }
  return edges
}

/**
 * The level of each band, 0 to 1, from a spectrum in bytes (0 the quietest an analyser reads, 255 the loudest). A
 * band reads as its loudest bin, and the high ones are lifted a little, since music has less up there.
 */
export function bandsOf(
  spectrum: Uint8Array,
  edges: Uint16Array,
  into: Float32Array,
): Float32Array {
  for (let band = 0; band < SPECTRUM_BANDS; band++) {
    let top = 0
    for (
      let bin = edges[band], end = Math.max(edges[band] + 1, edges[band + 1]);
      bin < end && bin < spectrum.length;
      bin++
    ) {
      if (spectrum[bin] > top) top = spectrum[bin]
    }
    into[band] = clamp01((top / 255) * (1 + 0.35 * (band / (SPECTRUM_BANDS - 1))))
  }
  return into
}

/** The level of a stretch of the wave, 0 to 1. */
export function levelOf(wave: Float32Array): number {
  let sum = 0
  for (const sample of wave) sum += sample * sample
  const rms = Math.sqrt(sum / Math.max(1, wave.length))
  if (rms < 1e-6) return 0
  return clamp01((20 * Math.log10(rms) - QUIET_DB) / (FULL_DB - QUIET_DB))
}

/** Listens to the master of a running engine. */
export function createEar(context: BaseAudioContext, master: TappedMaster): VisualEar {
  const analyser = context.createAnalyser()
  analyser.fftSize = 2048
  // Each reading is evened out with the one before by this much: little, so that a sound that comes in is in the
  // spectrum within a frame or two (the follower lets it fall slowly, `follow.ts`).
  analyser.smoothingTimeConstant = 0.4
  analyser.minDecibels = -84
  analyser.maxDecibels = -18
  master.addTap(analyser)
  const spectrum = new Uint8Array(analyser.frequencyBinCount)
  const wave = new Float32Array(analyser.fftSize)
  const edges = bandEdges(analyser.frequencyBinCount, context.sampleRate)
  const heard: Heard = { level: 0, bands: new Float32Array(SPECTRUM_BANDS) }
  // The last readings, round and round: when each was taken on the engine's clock, its level and its bands.
  const keptAt = new Float64Array(KEPT_READINGS).fill(-Infinity)
  const keptLevel = new Float32Array(KEPT_READINGS)
  const keptBands = new Float32Array(KEPT_READINGS * SPECTRUM_BANDS)
  let newest = -1
  let open = true
  return {
    read(agoSec = 0) {
      if (!open) return heard
      analyser.getByteFrequencyData(spectrum)
      analyser.getFloatTimeDomainData(wave)
      bandsOf(spectrum, edges, heard.bands)
      heard.level = levelOf(wave)
      const now = context.currentTime
      const ago = Math.min(EAR_KEEPS_SEC, agoSec)
      // Nothing is kept for an ear that is only ever asked what is heard now.
      if (!(ago > 0) && newest < 0) return heard
      newest = (newest + 1) % KEPT_READINGS
      keptAt[newest] = now
      keptLevel[newest] = heard.level
      keptBands.set(heard.bands, newest * SPECTRUM_BANDS)
      if (!(ago > 0)) return heard
      // The newest reading that is at least that old; the oldest there is while none is.
      let found = newest
      for (let back = 0; back < KEPT_READINGS; back++) {
        const slot = (newest - back + KEPT_READINGS) % KEPT_READINGS
        if (keptAt[slot] === -Infinity) break
        found = slot
        if (keptAt[slot] <= now - ago) break
      }
      heard.level = keptLevel[found]
      heard.bands.set(keptBands.subarray(found * SPECTRUM_BANDS, (found + 1) * SPECTRUM_BANDS))
      return heard
    },
    close() {
      if (!open) return
      open = false
      master.removeTap(analyser)
    },
  }
}

/** The sound as it leaves the speakers, a level for each short stretch of it: what a picture's timing is held against (`sync.ts`). */
export interface HeardTrace {
  /**
   * Hands over every stretch heard since the last ask: `atSec` is when it leaves the speakers, on the clock given
   * (seconds), and `level` how loud it is, 0 to 1. Asked at least a few times a second it leaves nothing out.
   */
  read(put: (atSec: number, level: number) => void): void
  /** How long the sound takes from the engine's clock to the speakers, in seconds, as far as the browser says. */
  latencySec(): number
  close(): void
}

/** How long a stretch is that gets a level of its own, in seconds. */
const TRACE_HOP_SEC = 0.005

/** The clock of an engine as far as the trace reads it: a running `AudioContext` has all of it. */
type TimedContext = BaseAudioContext & {
  outputLatency?: number
  baseLatency?: number
  getOutputTimestamp?: () => { contextTime?: number; performanceTime?: number }
}

/**
 * How long a sound takes from the engine's clock to the speakers, in seconds: what the browser says the output
 * takes, and where it does not say, what its own buffer takes. Nothing where it says neither.
 */
export function outputLatencySec(context: BaseAudioContext): number {
  const timed = context as TimedContext
  const said = timed.outputLatency
  if (typeof said === 'number' && Number.isFinite(said) && said > 0) return said
  const base = timed.baseLatency
  return typeof base === 'number' && Number.isFinite(base) && base > 0 ? base : 0
}

/**
 * Listens to the master for the scope. `clock` is the time now in seconds on the clock the traces share: the
 * page's own, `performance.now() / 1000`.
 */
export function hearTrace(
  context: BaseAudioContext,
  master: TappedMaster,
  clock: () => number,
): HeardTrace {
  const analyser = context.createAnalyser()
  // As long a stretch as an analyser keeps: a third of a second, so a page that is asked seldom still hears all of it.
  analyser.fftSize = 16_384
  analyser.smoothingTimeConstant = 0
  master.addTap(analyser)
  const wave = new Float32Array(analyser.fftSize)
  const hop = Math.max(1, Math.round(context.sampleRate * TRACE_HOP_SEC))
  // The first stretch not handed over yet, counted in stretches from the engine's start.
  let next = -1
  let open = true
  return {
    read(put) {
      if (!open) return
      analyser.getFloatTimeDomainData(wave)
      const endSec = context.currentTime
      const endSample = Math.round(endSec * context.sampleRate)
      const firstSample = endSample - wave.length
      const last = Math.floor(endSample / hop) - 1
      const first = Math.max(next, Math.ceil(Math.max(0, firstSample) / hop))
      if (last < first) return
      // When the engine's time `endSec` is heard. The browser says which moment of the engine's time is at the
      // speakers at which moment of the page's; where it does not, or says something far off, it is now and later
      // by what the output takes.
      const guessed = clock() + outputLatencySec(context)
      const stamp = (context as TimedContext).getOutputTimestamp?.()
      const stampedSec = stamp?.contextTime ?? 0
      const stampedMs = stamp?.performanceTime ?? 0
      const said =
        stampedSec > 0 && stampedMs > 0 ? stampedMs / 1000 + endSec - stampedSec : guessed
      const heardAt = Math.abs(said - guessed) < 1 ? said : guessed
      for (let stretch = first; stretch <= last; stretch++) {
        const from = stretch * hop - firstSample
        let sum = 0
        for (let index = from; index < from + hop; index++) sum += wave[index] * wave[index]
        const rms = Math.sqrt(sum / hop)
        const level =
          rms < 1e-6 ? 0 : clamp01((20 * Math.log10(rms) - QUIET_DB) / (FULL_DB - QUIET_DB))
        put(heardAt + ((stretch + 0.5) * hop) / context.sampleRate - endSec, level)
      }
      next = last + 1
    },
    latencySec: () => outputLatencySec(context),
    close() {
      if (!open) return
      open = false
      master.removeTap(analyser)
    },
  }
}
