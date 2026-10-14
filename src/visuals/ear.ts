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
  /** What is heard now. The same object every time, filled anew. */
  read(): Heard
  close(): void
}

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
  analyser.smoothingTimeConstant = 0.55
  analyser.minDecibels = -84
  analyser.maxDecibels = -18
  master.addTap(analyser)
  const spectrum = new Uint8Array(analyser.frequencyBinCount)
  const wave = new Float32Array(analyser.fftSize)
  const edges = bandEdges(analyser.frequencyBinCount, context.sampleRate)
  const heard: Heard = { level: 0, bands: new Float32Array(SPECTRUM_BANDS) }
  let open = true
  return {
    read() {
      if (!open) return heard
      analyser.getByteFrequencyData(spectrum)
      analyser.getFloatTimeDomainData(wave)
      bandsOf(spectrum, edges, heard.bands)
      heard.level = levelOf(wave)
      return heard
    },
    close() {
      if (!open) return
      open = false
      master.removeTap(analyser)
    },
  }
}
