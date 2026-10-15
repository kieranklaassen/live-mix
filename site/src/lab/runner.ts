// Runs a lab: writes the source in, sets the controls, renders, and copies the taps out.
// The same code runs in Node, where the lab tests call it, and in the page's worker.

import { describeLab, type LabDescription, type TapInfo } from './describe.ts'
import { instantiateLab, type LabExports } from './wasm.ts'

/** Every render is at this rate, so a picture and a test come out the same anywhere. */
export const SAMPLE_RATE = 48_000
/** Points of a control tap are this many samples apart. */
export const CONTROL_PERIOD = 16

export interface Source {
  left: Float32Array
  right: Float32Array
}

export interface TapData extends TapInfo {
  /** One array per channel. Empty when the lab did not write the tap. */
  channels_data: Float32Array[]
  length: number
  /** For a curve, a spectrum or a picture: what the first and the last point stand at. */
  x0: number
  x1: number
  /** For a picture: how many columns its points are laid out in. */
  columns: number
  /** For a curve or a spectrum: its points stand in even ratios from x0 to x1, not in even steps. */
  log: boolean
}

export interface RenderResult {
  frames: number
  taps: Record<string, TapData>
  checks: Record<string, number>
  /** How long the lab took, in milliseconds. */
  ms: number
}

export interface Lab {
  description: LabDescription
  /** Render `frames` of the source at the given control values (missing ones stay at their defaults). */
  render(source: Source, values: Record<string, number>, frames?: number): RenderResult
  /** The average spectrum of an audio tap of the last render, in dB per bin up to half the sample rate. */
  spectrum(tap: string, channel?: number, start?: number, count?: number): Float32Array
}

const now = () => (typeof performance === 'undefined' ? Date.now() : performance.now())

export async function loadLab(bytes: BufferSource): Promise<Lab> {
  const wasm: LabExports = await instantiateLab(bytes)
  const description = describeLab(wasm)
  const heap = () => new Float32Array(wasm.memory.buffer)

  function render(source: Source, values: Record<string, number>, frames?: number): RenderResult {
    const wanted = Math.min(frames ?? source.left.length, source.left.length, description.maxFrames)
    const count = Math.max(0, wanted - (wanted % CONTROL_PERIOD))
    const memory = heap()
    memory.set(source.left.subarray(0, count), wasm.lab_input(0) >> 2)
    memory.set(source.right.subarray(0, count), wasm.lab_input(1) >> 2)
    for (const control of description.controls) {
      wasm.lab_set(control.index, values[control.id] ?? control.initial)
    }
    const started = now()
    wasm.lab_run(count)
    const ms = now() - started

    const taps: Record<string, TapData> = {}
    for (const tap of description.taps) {
      const length = wasm.lab_tap_length(tap.index)
      const start = wasm.lab_tap_data(tap.index) >> 2
      const channels_data: Float32Array[] = []
      if (length > 0 && start > 0) {
        // Copied out: the lab's memory is written over by the next render.
        const all = heap()
        for (let c = 0; c < tap.channels; c += 1) {
          channels_data.push(all.slice(start + c * length, start + (c + 1) * length))
        }
      }
      taps[tap.id] = {
        ...tap,
        channels_data,
        length: channels_data.length ? length : 0,
        x0: wasm.lab_tap_x0(tap.index),
        x1: wasm.lab_tap_x1(tap.index),
        columns: wasm.lab_tap_columns(tap.index),
        log: wasm.lab_tap_scale(tap.index) === 1,
      }
    }
    const checks: Record<string, number> = {}
    for (const check of description.checks) checks[check.id] = wasm.lab_check_value(check.index)
    return { frames: count, taps, checks, ms }
  }

  function spectrum(tap: string, channel = 0, start = 0, count = 0): Float32Array {
    const info = description.taps.find((t) => t.id === tap)
    if (!info) throw new Error(`No tap called ${tap}`)
    const pointer = wasm.lab_spectrum(info.index, channel, start, count) >> 2
    return heap().slice(pointer, pointer + wasm.lab_spectrum_bins())
  }

  return { description, render, spectrum }
}
