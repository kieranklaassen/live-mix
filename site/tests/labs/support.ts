// What every lab test shares: loading a built lab, the sources, and a few measurements.

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'
import {
  loadLab,
  SAMPLE_RATE,
  type Lab,
  type RenderResult,
  type Source,
} from '../../src/lab/runner.ts'

const LABS = fileURLToPath(new URL('../../public/labs/', import.meta.url))

/** A lab built by `pnpm labs`. A missing file means the labs were not built first. */
export async function lab(name: string): Promise<Lab> {
  const bytes = await readFile(`${LABS}${name}.wasm`).catch(() => {
    throw new Error(`site/public/labs/${name}.wasm is missing: run \`pnpm labs\` in site/ first.`)
  })
  return loadLab(bytes)
}

export const seconds = (s: number) => Math.round(s * SAMPLE_RATE)

export function silence(frames: number): Source {
  return { left: new Float32Array(frames), right: new Float32Array(frames) }
}

/** A sine on both channels. `peak` is its amplitude. */
export function sine(hz: number, peak: number, frames: number): Source {
  const left = new Float32Array(frames)
  for (let i = 0; i < frames; i += 1)
    left[i] = peak * Math.sin((2 * Math.PI * hz * i) / SAMPLE_RATE)
  return { left, right: left.slice() }
}

/** White noise, the same every time for a seed. */
export function noise(peak: number, frames: number, seed = 1): Source {
  let state = seed >>> 0 || 1
  const next = () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return ((state >>> 0) / 0xffffffff) * 2 - 1
  }
  const left = new Float32Array(frames)
  const right = new Float32Array(frames)
  for (let i = 0; i < frames; i += 1) {
    left[i] = peak * next()
    right[i] = peak * next()
  }
  return { left, right }
}

export const dbToGain = (db: number) => 10 ** (db / 20)
export const gainToDb = (gain: number) => 20 * Math.log10(Math.max(gain, 1e-9))

export function peak(x: Float32Array): number {
  let top = 0
  for (const v of x) top = Math.max(top, Math.abs(v))
  return top
}

export function rms(x: Float32Array, from = 0, to = x.length): number {
  let sum = 0
  for (let i = from; i < to; i += 1) sum += x[i]! * x[i]!
  return Math.sqrt(sum / Math.max(1, to - from))
}

export function mean(x: Float32Array, from = 0, to = x.length): number {
  let sum = 0
  for (let i = from; i < to; i += 1) sum += x[i]!
  return sum / Math.max(1, to - from)
}

/** The level of `a - b` against the level of `b`, in dB. */
export function differenceDb(a: Float32Array, b: Float32Array): number {
  let diff = 0
  let ref = 0
  for (let i = 0; i < b.length; i += 1) {
    diff += (a[i]! - b[i]!) ** 2
    ref += b[i]! ** 2
  }
  return 10 * Math.log10(Math.max(diff / Math.max(ref, 1e-30), 1e-14))
}

/** The largest step between neighbouring samples inside a tap, and the step across its wrap. */
export function steps(x: Float32Array): { inside: number; wrap: number } {
  let inside = 0
  for (let i = 1; i < x.length; i += 1) inside = Math.max(inside, Math.abs(x[i]! - x[i - 1]!))
  return { inside, wrap: Math.abs(x[0]! - x[x.length - 1]!) }
}

/**
 * What every lab is held to on its default source: every tap is finite and says something,
 * every audio tap loops without a step, and every control moves at least one tap.
 */
export function expectSoundLab(
  theLab: Lab,
  source: Source,
  result: RenderResult,
  options: { quiet?: string[] } = {},
) {
  for (const tap of Object.values(result.taps)) {
    expect(tap.length, `tap ${tap.id} was written`).toBeGreaterThan(0)
    for (const data of tap.channels_data) {
      expect(
        data.every((v) => Number.isFinite(v)),
        `tap ${tap.id} is finite`,
      ).toBe(true)
      if (!options.quiet?.includes(tap.id)) {
        expect(
          data.some((v) => v !== data[0]),
          `tap ${tap.id} is not one flat value`,
        ).toBe(true)
      }
      if (tap.kind === 'audio') {
        const { inside, wrap } = steps(data)
        expect(wrap, `tap ${tap.id} loops without a step`).toBeLessThanOrEqual(inside + 1e-6)
      }
    }
  }
  for (const control of theLab.description.controls) {
    const moved = control.initial === control.max ? control.min : control.max
    const other = theLab.render(source, { [control.id]: moved })
    const changed = Object.values(other.taps).some((tap) =>
      tap.channels_data.some((data, c) => {
        const before = result.taps[tap.id]!.channels_data[c]!
        return data.length !== before.length || data.some((v, i) => v !== before[i])
      }),
    )
    expect(changed, `control ${control.id} changes a tap`).toBe(true)
  }
}
