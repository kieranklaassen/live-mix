// The control protocol of the plug-in host (`native/host`): JSON text frames
// on `ws://127.0.0.1:<port>/control?token=…`. A request is
// `{ id, method, params }`, its answer `{ id, result }` or
// `{ id, error: { message } }`, and anything with an `event` field is a
// notification from the host. docs/native.md is the reference; these are the
// types of protocol version 1.

import type { NativeLinkState } from './link-time'

export const NATIVE_PROTOCOL_VERSION = 1

/** Where the host listens and the token it expects, as the shell hands them to the page. */
export interface NativeHostAddress {
  /** `ws://127.0.0.1:<port>`, no path. */
  url: string
  token: string
}

/** The answer to `hello`. */
export interface NativeHostInfo {
  protocol: number
  name: string
  version: string
  /** The JUCE version the host was built with. */
  juce: string
  /** Plug-in formats the host can load, e.g. `['VST3', 'AudioUnit']`. */
  formats: string[]
  platform: 'mac' | 'windows' | 'linux'
  /**
   * True when the host's last scan was cut short (the host was quit, or the
   * page that asked went away): its list holds what was found until then,
   * and another scan carries on from there. Absent from older hosts.
   */
  scanUnfinished?: boolean
  /** Whether the host was built with Ableton Link. Absent from hosts older than Link support. */
  link?: boolean
  /** The Link release the host was built with, e.g. `'4.1'`. */
  linkVersion?: string
}

/** One plug-in the host knows about, from a scan. */
export interface NativePluginInfo {
  /** Stable identifier (format, name, file hash, unique id); what `load` takes. */
  id: string
  name: string
  vendor: string
  /** `'VST3'` or `'AudioUnit'`. */
  format: string
  /** The plug-in's own category string, e.g. `'Fx|Reverb'`. */
  category: string
  version: string
  /** Path of the bundle, or the Audio Unit identifier. */
  file: string
  isInstrument: boolean
}

export interface NativeScanOptions {
  /** Extra folders to search besides the format's standard locations. */
  paths?: readonly string[]
  /**
   * Search the standard locations (default true). With false only `paths`
   * are searched, and Audio Units, which the system lists rather than a
   * folder, are left out.
   */
  defaultPaths?: boolean
  /** Forget the cached list first, and what scans left out with it: every file is looked at again. */
  rescan?: boolean
  /**
   * Entries of `failed` or `crashed` to give another go: this scan looks at
   * them again, and only at them and at what is new. For a plug-in that was
   * updated, or whose licence is there now.
   */
  retry?: readonly string[]
  /**
   * How many seconds a plug-in may keep the scan waiting without using the
   * processor before the scan goes on without it (default 10). A plug-in
   * that waits for something that never comes would hold the scan for ever.
   * Not for a version 3 Audio Unit, which the system makes outside the scan
   * process: only `timeout` holds for it.
   */
  idle?: number
  /** How many seconds one plug-in may take at most, at work or not (default 120). */
  timeout?: number
  /**
   * How many plug-ins one scan process takes before the host starts the
   * next (default 40). Plug-ins leave threads and memory behind in the
   * process that loaded them; enough of them end it.
   */
  perProcess?: number
}

/** What the host knows: the answer to a scan, and to `plugins` without one. */
export interface NativeScanResult {
  plugins: NativePluginInfo[]
  /**
   * Files no plug-in could be loaded from, in this scan or an earlier one.
   * The host keeps them with its list, and a scan does not open them again
   * until it is asked to with `retry` or `rescan`.
   */
  failed: string[]
  /**
   * Plug-ins left out because they crashed or never answered while they
   * were scanned, in this scan or an earlier one. A scan does not try them
   * again until it is asked to with `retry` or `rescan`. None of them is in
   * `failed`.
   */
  crashed: string[]
  /**
   * What to call each entry of `failed` and `crashed`: the plug-in's name
   * where the host can tell it without loading the plug-in. An Audio Unit is
   * listed by a code, not a file.
   */
  names: Record<string, string>
  /** True when the scan was ended with `stopScan` before it was through. */
  stopped?: boolean
}

export interface NativeScanProgress {
  format: string
  file: string
  /** The plug-in's name, where the host can tell it before loading it. Absent from older hosts. */
  name?: string
  /** 0..1 within the current format. */
  progress: number
}

/** One row of a loaded plug-in's parameter table. Values are normalised 0..1. */
export interface NativeParamInfo {
  /** Position in the plug-in's parameter list; what `setParam` addresses. */
  index: number
  /** The plug-in's own parameter id, stable across sessions. */
  id: string
  name: string
  /** Unit label, e.g. `'ms'`. */
  label: string
  value: number
  default: number
  /** The plug-in's own rendering of `value`, e.g. `'2.4 s'`. */
  text: string
  discrete: boolean
  boolean: boolean
  automatable: boolean
  /** The plug-in's bypass switch; the device's own bypass replaces it. */
  bypass: boolean
  /** Number of steps of a discrete parameter, else 0. */
  steps: number
  /** One label per step, for a discrete parameter with few steps. */
  choices?: string[]
}

export interface NativeLoadOptions {
  /** A `NativePluginInfo.id`. */
  plugin?: string
  /** Or the bundle to load without a scan. */
  file?: string
  /** With `file`, which plug-in of a bundle that holds several. */
  name?: string
  sampleRate: number
  /** Largest block the host will be asked to process. */
  blockSize: number
  /** An earlier `getState` result to restore before the first block. */
  state?: string
}

/** The answer to `load`. */
export interface NativeSlotInfo {
  /** Handle of the loaded instance; every later request names it. */
  slot: string
  plugin: string
  name: string
  vendor: string
  format: string
  isInstrument: boolean
  /** Channels on the plug-in's main buses after the host asked for stereo. */
  inputs: number
  outputs: number
  sampleRate: number
  blockSize: number
  /** The plug-in's own reported latency. */
  latencySamples: number
  tailSeconds: number
  hasEditor: boolean
  acceptsMidi: boolean
  params: NativeParamInfo[]
}

export interface NativeParamChange {
  index: number
  value: number
  text: string
  /** `'client'` echoes a `setParam`; `'plugin'` is the plug-in's editor, a preset or a state restore. */
  origin: 'client' | 'plugin'
}

export interface NativeHostEvents {
  scanProgress: NativeScanProgress
  params: { slot: string; changes: NativeParamChange[] }
  latency: { slot: string; latencySamples: number }
  /**
   * The plug-in says its state changed in a way its parameters do not show
   * (a program picked, a file loaded in its window): `getState` now returns
   * something else.
   */
  stateChanged: { slot: string }
  editorClosed: { slot: string }
  /** The Link session changed: tempo, peers, start/stop, channels, or the beat moved. */
  link: NativeLinkState
  /** The control connection is gone; every slot it loaded went with it. */
  close: { reason: string }
}

export type NativeHostEvent = keyof NativeHostEvents
