// The page side of the shared-room check. `EngineOptions.sharedSpace` lets
// tracks whose strip only sets a level send into one convolver instead of
// one each, on the grounds that a gain ahead of a convolution is the same as
// that gain after it. The mocks say which nodes are made; whether it is the
// same sound is settled here, on a real OfflineAudioContext: one scene is
// rendered with a room per track and again with the shared room, and the two
// are taken apart sample by sample.

import { createEngine, createUtility, type SpaceOptions } from '@kieranklaassen/live-mix'

const RATE = 44100
const RENDER_SEC = 9

export interface SharedRoomVoice {
  hz: number
  atSec: number
  spaceDb: number
  pan?: number
  gainDb?: number
  lowpassHz?: number
  channels?: 1 | 2
}

export interface SharedRoomTrack {
  voices: SharedRoomVoice[]
  /** A utility ahead of the track's effects, set to this gain: what a host's level lane writes to. */
  trimDb?: number
  level?: number
  pan?: number
}

export interface SharedRoomCase {
  space?: SpaceOptions
  tracks: SharedRoomTrack[]
}

export interface SharedRoomMeasure {
  /** The loudest sample of the render with a room per track. */
  peak: number
  /** The largest difference between the two renders at any sample, in dBFS. */
  maxDiffDb: number
  /** The energy of the difference against the energy of the render, in dB. */
  diffDb: number
  /** How many convolvers the tracks sent into, with a room each and sharing. */
  roomsOwn: number
  roomsShared: number
}

/** A plucked tone with some noise in it, the same every time for one pitch and channel. */
function pluck(ctx: BaseAudioContext, hz: number, channels: number): AudioBuffer {
  const buffer = ctx.createBuffer(channels, 2 * RATE, RATE)
  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel)
    let seed = (12345 + Math.round(hz) + channel) >>> 0
    for (let i = 0; i < data.length; i += 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      const noise = (seed / 0xffff_ffff - 0.5) * 0.2
      const envelope = Math.min(1, i / 2000) * Math.exp(-i / (RATE * 0.8))
      data[i] = envelope * (0.5 * Math.sin((2 * Math.PI * hz * i) / RATE + channel) + noise)
    }
  }
  return buffer
}

async function render(
  scene: SharedRoomCase,
  sharedSpace: boolean,
): Promise<{ audio: AudioBuffer; rooms: number }> {
  const context = new OfflineAudioContext(2, RENDER_SEC * RATE, RATE)
  const engine = createEngine({ context, sharedSpace, space: scene.space })
  const group = engine.addGroup('clips')
  group.strip.setLevel(0.8)
  // Levels are in place before the first sample: the two only differ while a level moves.
  const settled = { at: 0, timeConstant: 0.000_01 }
  const tracks = scene.tracks.map((spec, index) => {
    const track = engine.addAudioTrack(`track-${index}`, { destination: group })
    if (spec.trimDb !== undefined) {
      track.strip.addInsert(createUtility(context, { params: { gainDb: spec.trimDb } }))
    }
    if (spec.level !== undefined) track.strip.setLevel(spec.level, settled)
    if (spec.pan !== undefined) track.strip.setPan(spec.pan, settled)
    spec.voices.forEach((voice, voiceIndex) => {
      track.play(
        `voice-${voiceIndex}`,
        {
          buffer: pluck(context, voice.hz, voice.channels ?? 2),
          offsetSec: 0,
          durationSec: 2,
          fadeInSec: 0.01,
          fadeOutSec: 0.2,
          fadeCurve: 'linear',
          gainDb: voice.gainDb ?? 0,
          pan: voice.pan ?? 0,
          lowpassHz: voice.lowpassHz ?? 20_000,
          spaceDb: voice.spaceDb,
        },
        voice.atSec,
      )
    })
    return track
  })
  const rooms = new Set(tracks.map((track) => track.space)).size
  const audio = await context.startRendering()
  return { audio, rooms }
}

async function measure(scene: SharedRoomCase): Promise<SharedRoomMeasure> {
  const own = await render(scene, false)
  const shared = await render(scene, true)
  let peak = 0
  let maxDiff = 0
  let energy = 0
  let diffEnergy = 0
  for (let channel = 0; channel < 2; channel += 1) {
    const a = own.audio.getChannelData(channel)
    const b = shared.audio.getChannelData(channel)
    for (let i = 0; i < a.length; i += 1) {
      const diff = a[i] - b[i]
      peak = Math.max(peak, Math.abs(a[i]))
      maxDiff = Math.max(maxDiff, Math.abs(diff))
      energy += a[i] * a[i]
      diffEnergy += diff * diff
    }
  }
  const floor = 1e-12
  return {
    peak,
    maxDiffDb: 20 * Math.log10(Math.max(maxDiff, floor)),
    diffDb: 10 * Math.log10(Math.max(diffEnergy, floor * floor) / Math.max(energy, floor * floor)),
    roomsOwn: own.rooms,
    roomsShared: shared.rooms,
  }
}

export async function measureSharedRooms<K extends string>(
  cases: Record<K, SharedRoomCase>,
): Promise<Record<K, SharedRoomMeasure>> {
  const measured = {} as Record<K, SharedRoomMeasure>
  for (const name of Object.keys(cases) as K[]) measured[name] = await measure(cases[name])
  return measured
}
