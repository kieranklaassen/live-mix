// The page side of the room-character check. A room can be rough (`grain`),
// driven (`driveDb`) and drifting (`driftCents`), and it can be changed while
// it sounds (`Engine.setSpace`). The mocks say which nodes are made; what
// those nodes do to sound is measured here, on a real OfflineAudioContext:
// a steady tone is sent into the room alone and what comes back is read for
// its level, its harmonics and how far its pitch moves.

import {
  SPACE_DRIVE_LEVEL_DB,
  canHoldRender,
  holdRenderAt,
  renderOffline,
  type SpaceOptions,
} from '@kieranklaassen/live-mix'

const RATE = 48000
const TONE_HZ = 440
/** The dry clip is turned all the way down and its send all the way up: the room alone, 36 dB under the clip. */
const DRY_DB = -60
const SEND_DB = 24

export interface RoomCase {
  space?: SpaceOptions
  /** The tone's level where it reaches the room, in dBFS RMS. Default the level a driven room holds. */
  levelDb?: number
  toneSec: number
  renderSec: number
  /** Another room from this time on. */
  change?: { atSec: number; space: SpaceOptions }
}

export interface RoomMeasure {
  /** RMS of what came back while the tone was steady, in dBFS. */
  levelDb: number
  /** The second and third harmonic against the tone itself, in dB. */
  secondDb: number
  thirdDb: number
  /** The furthest the tone's pitch sat from where it was sent, in cents, and the nearest. */
  highCents: number
  lowCents: number
  /** The biggest step between two samples, against the level: a click shows here. */
  maxStep: number
  /** RMS in the second after the tone has ended, against the level while it sounded, in dB. */
  afterDb: number
}

/** A sine that reaches the room at `levelDb` RMS. A buffer holds more than full scale, and the send takes it back down. */
function toneBuffer(ctx: BaseAudioContext, seconds: number, levelDb: number): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.round(seconds * RATE), RATE)
  const data = buffer.getChannelData(0)
  const peak = Math.SQRT2 * 10 ** ((levelDb - DRY_DB - SEND_DB) / 20)
  for (let i = 0; i < data.length; i += 1) {
    data[i] = peak * Math.sin((2 * Math.PI * TONE_HZ * i) / RATE)
  }
  return buffer
}

/** Power of `data` at `hz` over a stretch, by a windowed single-bin transform. */
function powerAt(data: Float32Array, from: number, to: number, hz: number): number {
  let re = 0
  let im = 0
  let weight = 0
  const length = to - from
  for (let i = 0; i < length; i += 1) {
    const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (length - 1))
    const phase = (2 * Math.PI * hz * i) / RATE
    re += window * data[from + i] * Math.cos(phase)
    im -= window * data[from + i] * Math.sin(phase)
    weight += window
  }
  return (re * re + im * im) / (weight * weight)
}

/** The tone's phase against a steady one, over a short stretch. */
function phaseAt(data: Float32Array, from: number, length: number): number {
  let re = 0
  let im = 0
  for (let i = 0; i < length; i += 1) {
    const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (length - 1))
    const phase = (2 * Math.PI * TONE_HZ * (from + i)) / RATE
    re += window * data[from + i] * Math.cos(phase)
    im -= window * data[from + i] * Math.sin(phase)
  }
  return Math.atan2(im, re)
}

function rms(data: Float32Array, from: number, to: number): number {
  let sum = 0
  for (let i = from; i < to; i += 1) sum += data[i] * data[i]
  return Math.sqrt(sum / Math.max(1, to - from))
}

const db = (ratio: number): number => 20 * Math.log10(Math.max(ratio, 1e-12))

async function measure(room: RoomCase): Promise<RoomMeasure> {
  const result = await renderOffline({
    durationSec: room.renderSec,
    sampleRate: RATE,
    engine: { space: room.space },
    build: async (engine) => {
      const level = room.levelDb ?? SPACE_DRIVE_LEVEL_DB
      await engine.samples.load('tone', toneBuffer(engine.context, room.toneSec, level))
      engine.addAudioTrack('placed').clips.add({
        id: 'clip',
        sourceId: 'tone',
        startSec: 0,
        offsetSec: 0,
        durationSec: room.toneSec,
        fadeInSec: 0.01,
        fadeOutSec: 0.01,
        fadeCurve: 'linear',
        gainDb: DRY_DB,
        spaceDb: SEND_DB,
      })
      const change = room.change
      if (change && canHoldRender(engine.context)) {
        void holdRenderAt(engine.context, change.atSec, () => engine.setSpace(change.space))
      }
    },
  })
  result.engine.dispose()
  const [left] = result.audio.channels
  // Steady from a second in (the room has filled by then) to the tone's end.
  const from = Math.round(1 * RATE)
  const to = Math.round(room.toneSec * RATE)
  const tone = powerAt(left, from, to, TONE_HZ)
  const level = rms(left, from, to)

  // Pitch: how fast the tone's phase moves against a steady tone, read every
  // 10 ms over 40 ms stretches. A turn of phase a second is a hertz.
  const hop = Math.round(0.01 * RATE)
  const stretch = Math.round(0.04 * RATE)
  let highCents = -Infinity
  let lowCents = Infinity
  let before = phaseAt(left, from, stretch)
  for (let at = from + hop; at + stretch <= to; at += hop) {
    const phase = phaseAt(left, at, stretch)
    let moved = phase - before
    if (moved > Math.PI) moved -= 2 * Math.PI
    if (moved < -Math.PI) moved += 2 * Math.PI
    before = phase
    const hz = TONE_HZ + moved / (2 * Math.PI * (hop / RATE))
    const cents = 1200 * Math.log2(hz / TONE_HZ)
    highCents = Math.max(highCents, cents)
    lowCents = Math.min(lowCents, cents)
  }

  let maxStep = 0
  for (let i = from + 1; i < left.length; i += 1) {
    maxStep = Math.max(maxStep, Math.abs(left[i] - left[i - 1]))
  }

  return {
    levelDb: db(level),
    secondDb: 10 * Math.log10(Math.max(powerAt(left, from, to, 2 * TONE_HZ), 1e-30) / tone),
    thirdDb: 10 * Math.log10(Math.max(powerAt(left, from, to, 3 * TONE_HZ), 1e-30) / tone),
    highCents,
    lowCents,
    maxStep: maxStep / Math.max(level, 1e-12),
    afterDb: db(
      rms(left, to + RATE, Math.min(left.length, to + 2 * RATE)) / Math.max(level, 1e-12),
    ),
  }
}

export async function measureRooms<Name extends string>(
  cases: Record<Name, RoomCase>,
): Promise<Record<Name, RoomMeasure>> {
  const out = {} as Record<Name, RoomMeasure>
  for (const name of Object.keys(cases) as Name[]) out[name] = await measure(cases[name])
  return out
}
