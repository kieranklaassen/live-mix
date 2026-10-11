// Displays of the instruments played from keys: hammers on strings, tines and glass.
//
// Each is the mechanism that makes the instrument's sound, drawn from the
// device's own figures: a hammer and its felt under a note's strings, a tine
// before its pickup, four operators and the partials they make. Beside it
// stand the notes: every key that sounds is lit on the part it plays, for as
// long as the device's own figures let it ring.

import {
  INK,
  clamp,
  crisp,
  dot,
  fillRect,
  freqGrid,
  gainToDb,
  ground,
  lerp,
  rule,
  text,
  xOfHz,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayNote,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { hzOfKey, keyOfHz, levelFoot, outShare, pitchName, xOfPitch } from './instrument-parts'
import { secondsText } from './tails'

type Size = Pick<DisplayView, 'width' | 'height'>
type Paint = Pick<DisplayFrame, 'ctx' | 'colours'>

const TAU = Math.PI * 2
/** Under this a level is not drawn at all. */
const SILENT_DB = -120
/** A level as a share of a scale that ends 60 dB under full, where the devices' own ring times end. */
const shareOfDb = (db: number): number => clamp(1 + db / 60, 0, 1)
/** Under this share of its light a note is done. */
const DONE = 0.02
/** What is left after `seconds` of something that falls 60 dB in `over` seconds. */
const fall = (seconds: number, over: number): number =>
  Math.pow(10, (-3 * seconds) / Math.max(over, 1e-6))
/** Two notes with one id are one note when their strikes are this near; a key struck twice is further apart. */
const SAME_NOTE_SEC = 0.25

/**
 * What a note keeps of the knobs it was struck under. These instruments read
 * some of their knobs when a note starts and the note keeps them, so a knob
 * that moves under a sounding note must not move that note's light.
 */
interface Struck {
  id: number
  /** When it was struck, on the frame's clock. */
  born: number
  seen: boolean
  knobs: number[]
}

/**
 * The knobs every note of this frame was struck under: one entry for each
 * note in the order of `frame.notes`, written to `into`. A note seen for the
 * first time takes `knobs` as they stand; one that is no longer sent is forgotten.
 */
function struckUnder(
  memory: Struck[],
  frame: Pick<DisplayFrame, 'notes' | 'now'>,
  knobs: readonly number[],
  into: Struck[],
): Struck[] {
  for (const kept of memory) kept.seen = false
  into.length = frame.notes.length
  for (let index = 0; index < frame.notes.length; index++) {
    const note = frame.notes[index]
    const born = frame.now - note.age
    let found: Struck | null = null
    for (const kept of memory) {
      if (!kept.seen && kept.id === note.id && Math.abs(kept.born - born) < SAME_NOTE_SEC) {
        found = kept
        break
      }
    }
    if (!found) {
      found = { id: note.id, born, seen: true, knobs: [...knobs] }
      memory.push(found)
    }
    found.born = born
    found.seen = true
    into[index] = found
  }
  for (let index = memory.length - 1; index >= 0; index--)
    if (!memory[index].seen) memory.splice(index, 1)
  return into
}

// --- Felt Piano --------------------------------------------------------------

const FELT_LOW_KEY = 21
const FELT_HIGH_KEY = 108
const FELT_MIDDLE_KEY = 60

/** `FeltPianoDevice::midi_note_for`: the key a pitch lands on, from A0 to C8. */
export const feltKey = (hz: number): number => clamp(keyOfHz(hz), FELT_LOW_KEY, FELT_HIGH_KEY)

/** `ModeTable::baseT60ForNote`: seconds the aftersound of a key takes to fall 60 dB with no felt. */
function feltBaseSeconds(key: number): number {
  const seconds = 36 * Math.exp(-0.031 * (key - FELT_LOW_KEY))
  return key > 85 ? seconds * Math.exp(-(key - 85) / 20) : seconds
}

/** `ModeTable::stringCountForNote`: one wound string at the bottom, two above it, three from G1 up. */
export function feltStringCount(key: number): number {
  return key <= 26 ? 1 : key <= 32 ? 2 : 3
}

/** `ModeTable::strikePositionForNote`: where along its string a key's hammer lands, as a share of its length. */
export function feltStrikePosition(key: number): number {
  return 0.125 - (0.058 * (key - FELT_LOW_KEY)) / 87
}

/** `ModeTable::inharmonicityForNote` times Stiffness: how far a key's overtones are pulled sharp. */
export function feltInharmonicity(key: number, stiffness: number): number {
  const measured =
    key >= 60
      ? 3.1e-4 * Math.exp(0.075 * (key - 60))
      : 2.6e-4 + (0.5e-4 * (key - FELT_LOW_KEY)) / 39
  return measured * stiffness
}

/** `ModeTable::buildNote`, `detuneCents`: the cents the outer strings of a key stand from its pitch. */
export function feltDetuneCents(key: number, detune: number): number {
  return (1.2 - (0.7 * (key - FELT_LOW_KEY)) / 87) * 2 * detune
}

/**
 * `ModeTable::buildNote`, the unison: where each string of a key stands as a
 * share of `feltDetuneCents`, how strongly it takes the hammer, and how much
 * shorter than the key's prompt time the second and third ring. The first is
 * the aftersound and has a ring time of its own.
 */
const FELT_UNISON: readonly (readonly number[])[] = [[0], [-0.5, 0.5], [-1, 0.18, 1]]
const FELT_STRING_LEVEL = [1, 0.95, 0.9]
const FELT_PROMPT = [1, 0.62, 0.45]
/** A cent as a share of a frequency, as `buildNote` takes it. */
const FELT_CENT = 5.78e-4

/** What `ModeTable::buildNote` and `HammerExciter::trigger` read of the knobs when a key is struck: a note keeps its own. */
interface FeltTone {
  felt: number
  hardness: number
  stiffness: number
  detune: number
  soft: boolean
}

/**
 * `ModeTable::buildNote`: what the strings of a key give of partial `n`
 * together, `seconds` after the hammer left them, as a share of what they give
 * at the strike. The strings of a unison are tuned apart and die at rates of
 * their own, so the partial falls fast, then slowly, and beats on the way.
 */
function feltPartial(key: number, n: number, tone: FeltTone, seconds: number): number {
  const fn = n * hzOfKey(key) * Math.sqrt(1 + feltInharmonicity(key, tone.stiffness) * n * n)
  const base = feltBaseSeconds(key) * (1 - 0.28 * tone.felt)
  const prompt = Math.max(0.035, base / (n * Math.sqrt(n)))
  const slow = Math.max(0.05, (base * Math.pow(n, -0.3)) / (1 + fn / 9000))
  // Only the lower three fifths of a key's partials have the whole unison; the rest one string.
  const partials = clamp(112 - key, 16, 96)
  const strings = n <= Math.floor((partials * 3) / 5) ? feltStringCount(key) : 1
  const cents = feltDetuneCents(key, tone.detune)
  let re = 0
  let im = 0
  let full = 0
  for (let s = 0; s < strings; s++) {
    const level = FELT_STRING_LEVEL[s] * fall(seconds, s === 0 ? slow : prompt * FELT_PROMPT[s])
    const turn = TAU * fn * FELT_UNISON[strings - 1][s] * cents * FELT_CENT * seconds
    re += level * Math.cos(turn)
    im += level * Math.sin(turn)
    full += FELT_STRING_LEVEL[s]
  }
  return Math.hypot(re, im) / full
}

/** `ModeTable::buildNote`: seconds the aftersound of a key's fundamental takes to fall 60 dB under so much felt. */
export function feltRingSeconds(key: number, felt: number): number {
  return Math.max(0.05, (feltBaseSeconds(key) * (1 - 0.28 * felt)) / (1 + hzOfKey(key) / 9000))
}

/** How far the fundamental of a key has fallen `seconds` after the strike, in dB: the unison's two decays and its beating. */
export function feltUnisonDb(key: number, felt: number, detune: number, seconds: number): number {
  return gainToDb(
    feltPartial(key, 1, { felt, detune, hardness: 0, stiffness: 1, soft: false }, seconds),
  )
}

/** `HammerExciter::trigger`: milliseconds the hammer's pulse lasts on the string, which is all the tone control there is. */
export function feltContactMs(
  key: number,
  velocity: number,
  felt: number,
  hardness: number,
  soft: boolean,
): number {
  const hz = hzOfKey(key)
  let ms = 4 * Math.sqrt(55 / hz)
  ms *= 1.45 - 1.2 * velocity
  ms *= 1.55 - 1.15 * hardness
  ms *= 1 + 2.6 * felt
  if (soft) ms *= 1.25
  ms *= 0.68 * (hz < 440 ? Math.pow(hz / 440, 0.35) : 1)
  return clamp(ms, 0.2, 16)
}

/** `HammerExciter::trigger`: the level of the hammer's pulse in dB under a full strike on bare strings. */
export function feltStrikeDb(velocity: number, felt: number, soft: boolean): number {
  const effective = velocity * (1 - 0.45 * felt) + 0.18 * felt
  return gainToDb(Math.pow(effective, 1.5 - 0.5 * felt) * (soft ? 0.75 : 1))
}

/** `FeltVoice::render`: seconds a fallen damper takes to take 60 dB off its strings. */
export const feltDamperSeconds = (damper: number): number => 0.6 - 0.56 * damper
/** `FeltVoice::render`: the share of its grip a half pedal leaves a damper; none from halfway down. */
export const feltPedalGrip = (sustain: number): number => Math.max(0, 1 - 2 * sustain)
/** `SympatheticBank::updateBlockRate`: seconds the sympathetic strings ring, short under their dampers and long with the pedal down. */
export const feltSympatheticSeconds = (sustain: number): number => 0.12 + 3.38 * sustain
/** `FeltReverb::setSize`: seconds the room rings. */
export const feltRoomSeconds = (size: number): number => 0.2 + 2.8 * size
/** `SympatheticBank.cpp`, `kStringNotes`: the twelve strings that ring in sympathy, C2 to B2. */
const FELT_SYMPATHETIC_KEY = 36
/** `FeltReverb`, `kOutputHeadroom`: what the room's sound is turned down by beside the piano's. */
const FELT_ROOM_HEADROOM = 0.35

/** A note the piano was sent, followed from its strike as `FeltSynth` and `FeltVoice` follow a voice. */
interface FeltTrack {
  id: number
  /** When it was struck, on the frame's clock, and how long ago that is. */
  born: number
  age: number
  key: number
  gain: number
  tone: FeltTone
  keyDown: boolean
  /** Its damper has been let fall (`FeltVoice::released`); it only grips while no pedal holds it up. */
  falling: boolean
  /** Held by the sustain pedal, by the sostenuto pedal: the two flags of a voice. */
  sustained: boolean
  sostenuto: boolean
  /** Another note took its voice. */
  stolen: boolean
  /** dB its damper has taken off it. */
  damped: number
  /** Where its strings stand now, and where the room still has it, in dB under a full strike. */
  db: number
  room: number
  seen: boolean
}

interface FeltState {
  tracks: FeltTrack[]
  /** Where the two holding pedals stood on the frame before; null before the first. */
  sustainDown: boolean | null
  sostenutoDown: boolean | null
  /** The twelve sympathetic strings, in dB under a full strike. */
  glow: Float32Array
  /** The knobs a struck key reads, as they stand on this frame. */
  tone: FeltTone
  /** The partials of the string that is drawn moving: how strong each is beside the first, and how fast it turns. */
  partials: Float32Array
  turns: Float32Array
}

const feltSounds = (track: FeltTrack): boolean => !track.stolen && shareOfDb(track.db) >= DONE

/** Where a note's strings stand `age` seconds after the strike with no damper on them, in dB under a full strike. */
function feltStringDb(track: FeltTrack, age: number): number {
  return (
    feltStrikeDb(track.gain, track.tone.felt, track.tone.soft) +
    gainToDb(feltPartial(track.key, 1, track.tone, age))
  )
}

/** Moves a note on by `elapsed` seconds: `FeltVoice::render`'s damper, and the room behind it. */
function feltAdvance(track: FeltTrack, elapsed: number, damping: number, roomFall: number): void {
  if (track.falling && !track.sustained && !track.sostenuto) track.damped += damping * elapsed
  track.db = track.stolen ? SILENT_DB : feltStringDb(track, track.age) - track.damped
  track.room = Math.max(track.db, track.room - roomFall * elapsed)
}

/**
 * `FeltSynth::note_on`: a key struck again lets the damper fall on the note
 * that was on it, and at the limit of voices the quietest note gives way
 * (`find_voice_to_steal`: a note whose key is up before one that is held).
 */
function feltStrike(
  tracks: FeltTrack[],
  note: DisplayNote,
  born: number,
  tone: FeltTone,
  voices: number,
  sustainDown: boolean,
): FeltTrack {
  const key = feltKey(note.frequency)
  let sounding = 0
  let tail: FeltTrack | null = null
  let held: FeltTrack | null = null
  for (const other of tracks) {
    if (other.key === key) other.falling = true
    if (!feltSounds(other)) continue
    sounding++
    if (!other.keyDown && !other.sostenuto) {
      if (!tail || other.db < tail.db) tail = other
    } else if (!other.sostenuto && (!held || other.db < held.db)) held = other
  }
  if (sounding >= voices) {
    const gone = tail ?? held ?? tracks.find(feltSounds)
    if (gone) {
      gone.stolen = true
      gone.db = SILENT_DB
    }
  }
  const track: FeltTrack = {
    id: note.id,
    born,
    age: note.age,
    key,
    gain: clamp(note.gain, 0, 1),
    tone: { ...tone },
    keyDown: true,
    falling: false,
    // A voice begun under the pedal is held by it.
    sustained: sustainDown,
    sostenuto: false,
    stolen: false,
    damped: 0,
    db: SILENT_DB,
    room: SILENT_DB,
    seen: true,
  }
  tracks.push(track)
  return track
}

/**
 * The notes of this frame as the piano has them: what it was sent, with each
 * note's damper and the pedals followed from frame to frame, because how long
 * a note rings on after its key is up hangs on where the pedals stood then.
 */
function feltFollow(frame: DisplayFrame<FeltState>): FeltTrack[] {
  const { state, now } = frame
  const tracks = state.tracks
  // At rest and switched off there is nothing to follow, and what the pedals did is forgotten.
  if (!frame.powered || (frame.notes.length === 0 && frame.signal === null)) {
    tracks.length = 0
    state.sustainDown = null
    state.sostenutoDown = null
    state.glow.fill(SILENT_DB)
    return tracks
  }
  const sustain = frame.value('sustain')
  const sustainDown = sustain >= 0.5
  const sostenutoDown = frame.value('sostenuto') >= 0.5
  // `FeltSynth::handle_sustain_pedal`: down, it takes hold of the keys that are down; up, the dampers fall on the keys that are up.
  if (state.sustainDown !== null && state.sustainDown !== sustainDown) {
    for (const track of tracks) {
      if (sustainDown) track.sustained = track.sustained || track.keyDown
      else {
        track.sustained = false
        if (!track.keyDown && !track.sostenuto) track.falling = true
      }
    }
  }
  // `FeltSynth::handle_sostenuto_pedal`: down, it takes hold of what sounds; up, it lets all of that go, a held key too.
  if (state.sostenutoDown !== null && state.sostenutoDown !== sostenutoDown) {
    for (const track of tracks) {
      if (sostenutoDown) track.sostenuto = feltSounds(track)
      else if (track.sostenuto) {
        track.sostenuto = false
        track.falling = true
      }
    }
  }
  state.sustainDown = sustainDown
  state.sostenutoDown = sostenutoDown

  const damping = (60 * feltPedalGrip(sustain)) / feltDamperSeconds(frame.value('damper'))
  const roomFall = 60 / feltRoomSeconds(frame.value('reverbSize'))
  const voices = Math.round(frame.value('polyphony'))
  for (const track of tracks) track.seen = false
  for (const note of frame.notes) {
    const born = now - note.age
    let track: FeltTrack | null = null
    for (const known of tracks) {
      if (!known.seen && known.id === note.id && Math.abs(known.born - born) < SAME_NOTE_SEC) {
        track = known
        break
      }
    }
    let elapsed = 0
    if (track) {
      elapsed = Math.max(0, note.age - track.age)
      track.age = note.age
      track.born = born
      track.seen = true
    } else {
      track = feltStrike(tracks, note, born, state.tone, voices, sustainDown)
      // First seen with its key already up: its damper has been on it since, as the pedals stand
      // now, and the room has what it had of the note then, less what has rung out.
      if (note.released !== null && !sustainDown) {
        track.keyDown = false
        track.falling = true
        track.damped = damping * note.released
        track.room = feltStringDb(track, note.age - note.released) - roomFall * note.released
      }
    }
    // `FeltSynth::note_off`: the key comes up, and the damper falls unless a pedal holds it.
    if (track.keyDown && note.released !== null) {
      track.keyDown = false
      if (!track.sustained && !track.sostenuto) track.falling = true
    }
    feltAdvance(track, elapsed, damping, roomFall)
  }
  // A note the plate has forgotten rings on while a pedal holds it; one that is done is dropped.
  const wet = gainToDb(FELT_ROOM_HEADROOM)
  for (let index = tracks.length - 1; index >= 0; index--) {
    const track = tracks[index]
    if (track.seen) continue
    track.keyDown = false
    track.age += frame.dt
    feltAdvance(track, frame.dt, damping, roomFall)
    if (!feltSounds(track) && shareOfDb(track.room + wet) < DONE) tracks.splice(index, 1)
  }

  // The sympathetic strings: each rings with the notes of its pitch class, and on for its own time.
  const sinks = (60 * frame.dt) / feltSympatheticSeconds(sustain)
  for (let string = 0; string < 12; string++)
    state.glow[string] = Math.max(SILENT_DB, state.glow[string] - sinks)
  for (const track of tracks) {
    if (feltSounds(track))
      state.glow[track.key % 12] = Math.max(state.glow[track.key % 12], track.db)
  }
  return tracks
}

/**
 * Where each key from A0 to C8 stands on a keyboard, in white keys from its
 * left edge: a white key at its middle, a black one on the line between its
 * neighbours.
 */
const FELT_BLACK = [false, true, false, true, false, false, true, false, true, false, true, false]
const FELT_WHITES = 52
const FELT_KEY_AT: readonly number[] = (() => {
  const at: number[] = []
  let whites = 0
  for (let key = FELT_LOW_KEY; key <= FELT_HIGH_KEY; key++) {
    at.push(FELT_BLACK[key % 12] ? whites : whites + 0.5)
    if (!FELT_BLACK[key % 12]) whites++
  }
  return at
})()

interface FeltParts {
  /** The action in side view: one note's strings from end to end, its hammer, felt and damper. */
  action: Box
  /** The strings' height and their two ends. */
  stringY: number
  left: number
  right: number
  /** The notes that sound, each over its key. */
  lights: Box
  keys: Box
  foot: Box
}

function feltParts(view: Size): FeltParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const foot: Box = { x: all.x, y: all.y + all.h - 7, w: all.w, h: 6 }
  const keys: Box = { x: all.x, y: foot.y - 10, w: all.w, h: 8 }
  const tall = Math.round(clamp(all.h * 0.2, 8, 24))
  const lights: Box = { x: all.x, y: keys.y - tall, w: all.w, h: tall }
  const action: Box = { x: all.x, y: all.y + 10, w: all.w, h: lights.y - all.y - 11 }
  return {
    action,
    stringY: action.y + 13,
    left: action.x + 5,
    right: action.x + action.w - 7,
    lights,
    keys,
    foot,
  }
}

const feltKeyX = (key: number, keys: Box): number =>
  keys.x + (FELT_KEY_AT[key - FELT_LOW_KEY] * keys.w) / FELT_WHITES

/** How many partials the moving string is drawn in, and how often it swings a second: slow enough that the highest is still seen to move. */
const FELT_DRAWN_PARTIALS = 7
const FELT_SWING_HZ = 2
/** How far the string swings at a full strike, and how far apart a cent stands two strings of a unison, in px. */
const FELT_SWING_PX = 6
const FELT_PX_PER_CENT = 3.2
/** How long the hammer is seen going up and coming back, in seconds. */
const FELT_HAMMER_UP_SEC = 0.03
const FELT_HAMMER_BACK_SEC = 0.12

/**
 * The partials of a struck string as it moves now: what the hammer's place and
 * its pulse give each (`ModeTable::buildNote`, `HammerExciter::trigger`: a
 * half sine as long as the contact), what its strings have left of it, and
 * how far its stiffness has turned it ahead of the first.
 */
function feltShape(state: FeltState, track: FeltTrack): number {
  const { key, tone } = track
  const hz = hzOfKey(key)
  const place = feltStrikePosition(key)
  const contact = feltContactMs(key, track.gain, tone.felt, tone.hardness, tone.soft) / 1000
  const stiff = feltInharmonicity(key, tone.stiffness)
  let power = 0
  let first = 1
  for (let n = 1; n <= FELT_DRAWN_PARTIALS; n++) {
    const stretch = Math.sqrt(1 + stiff * n * n)
    const fn = n * hz * stretch
    const comb = Math.sin(n * Math.PI * place)
    const struck =
      ((0.15 * Math.sign(comb) + 0.85 * comb) / Math.sqrt(n) / (1 + fn / 12000)) *
      (fn / Math.sqrt(fn * fn + 90 * 90))
    const x = fn * contact
    const near = Math.abs(1 - 4 * x * x)
    const pulse = near < 1e-3 ? Math.PI / 4 : Math.abs(Math.cos(Math.PI * x)) / near
    const level = struck * pulse * feltPartial(key, n, tone, track.age)
    if (n === 1) first = Math.max(Math.abs(level), 1e-9)
    state.partials[n - 1] = level / first
    state.turns[n - 1] = n * stretch
    power += (level / first) * (level / first)
  }
  // The more partials there are, the more of the swing is theirs: the whole stays as wide as the note is loud.
  return 1 / Math.sqrt(power)
}

/** How tall a hammer's head stands on its shank, in px. */
const FELT_HEAD_PX = 11

/**
 * A hammer in side view: a head of felt on a wooden core, on a shank that
 * turns about its pivot. `top` is where its nose is. A soft hammer has a round
 * nose that lies long on the string; a hard one a narrow one.
 */
function feltHammer(
  frame: Paint,
  x: number,
  top: number,
  hardness: number,
  shank: number,
  pivotX: number,
  pivotY: number,
  colour: string,
): void {
  const { ctx, colours } = frame
  const half = lerp(5.5, 4.5, hardness)
  const foot = top + FELT_HEAD_PX
  ctx.beginPath()
  ctx.moveTo(x, foot + 3)
  ctx.lineTo(pivotX, pivotY)
  ctx.globalAlpha = INK.text
  ctx.strokeStyle = colour
  ctx.lineWidth = shank
  ctx.lineCap = 'round'
  ctx.stroke()
  dot(ctx, pivotX, pivotY, 1.6, colours.plate, { ring: colour })
  fillRect(ctx, { x: x - 1.5, y: foot - 1, w: 3, h: 4.5 }, colour)
  // The felt is widest low down and comes to its nose at the top.
  const waist = top + FELT_HEAD_PX * 0.64
  const nose = half * lerp(0.95, 0.12, hardness)
  ctx.beginPath()
  ctx.moveTo(x, foot)
  ctx.quadraticCurveTo(x - half, foot, x - half, waist)
  ctx.quadraticCurveTo(x - nose, top, x, top)
  ctx.quadraticCurveTo(x + nose, top, x + half, waist)
  ctx.quadraticCurveTo(x + half, foot, x, foot)
  ctx.closePath()
  ctx.globalAlpha = 1
  ctx.fillStyle = colours.plate
  ctx.fill()
  ctx.globalAlpha = INK.back
  ctx.fillStyle = colour
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.strokeStyle = colour
  ctx.lineWidth = 1
  ctx.lineJoin = 'round'
  ctx.stroke()
  // The core the felt is wrapped around.
  ctx.beginPath()
  ctx.moveTo(x - 1.5, foot)
  ctx.lineTo(x, top + 4.5)
  ctx.lineTo(x + 1.5, foot)
  ctx.closePath()
  ctx.fillStyle = colour
  ctx.fill()
}

const felt = plateDisplay<FeltState>({
  place: 'window',
  columns: 2,
  params: [
    'felt',
    'hardness',
    'detune',
    'stiffness',
    'thump',
    'action',
    'resonance',
    'damper',
    'reverbMix',
    'reverbSize',
    'sustain',
    'sostenuto',
    'soft',
    'polyphony',
  ],
  live: { signal: true, notes: true, stereo: true },
  info: 'One note in side view: its strings, the felt strip, the hammer under them and the damper over them, with the three pedals. Below, every key that sounds is lit as high as its strings still ring, over the level of each side. The figures are the hammer’s time on the string and the ring time.',
  init: () => ({
    tracks: [],
    sustainDown: null,
    sostenutoDown: null,
    glow: new Float32Array(12).fill(SILENT_DB),
    tone: { felt: 0, hardness: 0, stiffness: 1, detune: 0, soft: false },
    partials: new Float32Array(FELT_DRAWN_PARTIALS),
    turns: new Float32Array(FELT_DRAWN_PARTIALS),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { action, stringY, left, right, lights, keys, foot } = feltParts(frame)
    const sustain = clamp(frame.value('sustain'), 0, 1)
    const resonance = clamp(frame.value('resonance'), 0, 1)
    const mix = clamp(frame.value('reverbMix'), 0, 1)
    const tone = state.tone
    tone.felt = clamp(frame.value('felt'), 0, 1)
    tone.hardness = clamp(frame.value('hardness'), 0, 1)
    tone.stiffness = frame.value('stiffness')
    tone.detune = frame.value('detune')
    tone.soft = frame.value('soft') >= 0.5

    const tracks = feltFollow(frame)
    // The note in the side view is the last one struck that still sounds; middle C at a middling touch while none does.
    let shown: FeltTrack | null = null
    for (const track of tracks)
      if (feltSounds(track) && (!shown || track.born >= shown.born)) shown = track
    const key = shown ? shown.key : FELT_MIDDLE_KEY
    const touch = shown ? shown.gain : 0.5
    const struck = shown ? shown.tone : tone
    // `FeltReverb::processSample`: the piano through the cosine of Mix, the room through its sine.
    const dry = gainToDb(Math.cos((mix * Math.PI) / 2))
    const wet = gainToDb(Math.sin((mix * Math.PI) / 2) * FELT_ROOM_HEADROOM)

    // --- The action ---
    const hammerX = left + feltStrikePosition(key) * (right - left)
    const since = shown ? shown.age : Infinity

    // The soundboard the bridge stands on, as thick as there is of the hammer's knock; it shows the knock for a moment.
    const board: Box = {
      x: Math.min(hammerX + 40, right - 30),
      y: stringY + 9,
      w: right + 5 - Math.min(hammerX + 40, right - 30),
      h: 1 + 3 * clamp(frame.value('thump'), 0, 1),
    }
    fillRect(ctx, board, colours.ink, INK.text)
    if (shown && since < 0.09) {
      // `FeltVoice::start_note`, `thumpAmp`.
      const knock = frame.value('thump') * shown.gain * (0.5 + 0.8 * shown.tone.felt) * 0.6
      fillRect(ctx, board, colours.accent, clamp(2 * knock, 0, 1) * (1 - since / 0.09))
    }
    ctx.beginPath()
    ctx.moveTo(right - 2.5, board.y)
    ctx.lineTo(right - 1, stringY + 1)
    ctx.lineTo(right + 1, stringY + 1)
    ctx.lineTo(right + 2.5, board.y)
    ctx.closePath()
    ctx.globalAlpha = INK.text
    ctx.fillStyle = colours.ink
    ctx.fill()
    ctx.globalAlpha = 1
    fillRect(ctx, { x: left - 3, y: stringY - 5, w: 3, h: 10 }, colours.ink, INK.text)

    // The strings of the key's unison, as far apart as they are tuned and as thick as they are stiff.
    const strings = feltStringCount(key)
    const apart = feltDetuneCents(key, struck.detune) * FELT_PX_PER_CENT
    ctx.beginPath()
    for (let s = 0; s < strings; s++) {
      const y = crisp(stringY + FELT_UNISON[strings - 1][s] * apart)
      ctx.moveTo(left, y)
      ctx.lineTo(right, y)
    }
    ctx.globalAlpha = INK.text
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 0.6 + 0.4 * clamp(struck.stiffness, 0, 2)
    ctx.stroke()
    ctx.globalAlpha = 1

    // The string as the note moves it: in the partials the hammer gave it, each dying and turning at its own rate.
    if (shown) {
      const share = shareOfDb(shown.db + dry)
      const wide = FELT_SWING_PX * Math.pow(share, 0.7) * feltShape(state, shown)
      const turn = TAU * FELT_SWING_HZ * shown.age
      const steps = Math.max(16, Math.round((right - left) / 4))
      ctx.beginPath()
      for (let step = 0; step <= steps; step++) {
        const u = step / steps
        let y = 0
        for (let n = 1; n <= FELT_DRAWN_PARTIALS; n++)
          y +=
            state.partials[n - 1] * Math.sin(n * Math.PI * u) * Math.sin(state.turns[n - 1] * turn)
        const x = left + u * (right - left)
        if (step === 0) ctx.moveTo(x, stringY)
        else ctx.lineTo(x, stringY - wide * y)
      }
      ctx.strokeStyle = colours.accent
      ctx.lineWidth = 1.5
      ctx.lineJoin = 'round'
      ctx.stroke()
    }

    // The felt strip between hammer and strings, as thick as there is of it.
    const stripTop = stringY + (strings > 1 ? apart : 0) + 2.5
    const strip = 6 * struck.felt
    if (strip > 0.3) {
      const box: Box = { x: hammerX - 12, y: stripTop, w: 24, h: strip }
      fillRect(ctx, box, colours.ink, INK.back)
      ctx.globalAlpha = INK.text
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.strokeRect(box.x, box.y, box.w, box.h)
      ctx.globalAlpha = 1
    }

    // The hammer: it rests nearer the strings under the soft pedal, and goes up to them when its key is struck.
    const rest = stringY + 9.5 + (struck.soft ? 1 : 4.5)
    const meets = stripTop + strip - (strip > 0.3 ? 0 : 3)
    const up =
      since < FELT_HAMMER_UP_SEC
        ? since / FELT_HAMMER_UP_SEC
        : clamp(1 - (since - FELT_HAMMER_UP_SEC) / FELT_HAMMER_BACK_SEC, 0, 1)
    feltHammer(
      frame,
      hammerX,
      lerp(rest, meets, up),
      struck.hardness,
      // The shank is the action: as thick as there is of its tick and thud.
      1 + 2 * clamp(frame.value('action'), 0, 1),
      hammerX + 26,
      action.y + action.h - 3,
      up > 0 ? colours.accent : colours.ink,
    )

    // The damper: off the strings by as much as the pedal lifts it, off them while its key holds
    // it up, and coming down on them as it takes the note away.
    const lifted = shown
      ? shown.falling && !shown.sustained && !shown.sostenuto
        ? 1 - clamp(shown.damped / 60, 0, 1)
        : 1
      : 0
    const lift = 5 * Math.max(lifted, clamp(2 * sustain, 0, 1))
    // It is as wide as its grip: a wider felt stops the strings sooner.
    const grip = lerp(5, 14, clamp(frame.value('damper'), 0, 1))
    const damperX = hammerX + 16
    const damperY = stringY - (strings > 1 ? apart : 0) - 1.5 - lift
    fillRect(ctx, { x: damperX, y: damperY - 2, w: grip, h: 2 }, colours.ink, INK.back)
    fillRect(ctx, { x: damperX, y: damperY - 5, w: grip, h: 3 }, colours.ink, INK.text)
    rule(ctx, damperX + grip / 2, damperY - 5, damperX + grip / 2, damperY - 9, {
      colour: colours.ink,
      alpha: INK.text,
    })

    // The pedals under the board, as a piano has them: soft, sostenuto, sustain. One that is
    // down stands lower and is filled.
    const pedalY = action.y + action.h - 8
    const pedalX = right - 46
    rule(ctx, pedalX + 15, board.y + board.h, pedalX + 15, pedalY + 2, {
      colour: colours.ink,
      alpha: INK.text,
      width: 2,
    })
    rule(ctx, pedalX - 1, pedalY + 0.5, pedalX + 31, pedalY + 0.5, {
      colour: colours.ink,
      alpha: INK.text,
    })
    for (let index = 0; index < 3; index++) {
      const pedal =
        index === 0 ? frame.value('soft') : index === 1 ? frame.value('sostenuto') : sustain
      const down = pedal >= 0.5
      // Only the sustain pedal has a way between up and down.
      const sink = 2.5 * (index === 2 ? clamp(pedal, 0, 1) : down ? 1 : 0)
      const box: Box = { x: pedalX + index * 11, y: pedalY + 2 + sink, w: 8, h: 4 }
      fillRect(ctx, box, colours.plate)
      fillRect(ctx, box, colours.ink, down ? 1 : INK.fill)
      ctx.globalAlpha = INK.text
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1)
      ctx.globalAlpha = 1
    }

    // --- The keys and the notes over them ---
    const white = keys.w / FELT_WHITES
    const floor = keys.y - 0.5

    // The twelve sympathetic strings over their keys, as long as there is of them, lit while they ring.
    if (resonance > 0.0001) {
      for (let string = 0; string < 12; string++) {
        const x = crisp(feltKeyX(FELT_SYMPATHETIC_KEY + string, keys))
        const top = floor - 1 - 7 * resonance
        rule(ctx, x, floor, x, top, { colour: colours.ink, alpha: INK.back })
        const rings = shareOfDb(state.glow[string] + dry)
        if (rings >= DONE) rule(ctx, x, floor, x, top, { colour: colours.accent, alpha: rings })
      }
    }

    for (const track of tracks) {
      const x = feltKeyX(track.key, keys)
      // What the room still has of it stands behind what its strings have.
      const room = shareOfDb(track.room + wet)
      if (room >= DONE) {
        ctx.beginPath()
        ctx.moveTo(x, floor)
        ctx.lineTo(x, floor - room * lights.h)
        ctx.globalAlpha = 0.32
        ctx.strokeStyle = colours.accent
        ctx.lineWidth = 3.5
        ctx.lineCap = 'butt'
        ctx.stroke()
      }
      const share = track.stolen ? 0 : shareOfDb(track.db + dry)
      if (share < DONE) continue
      ctx.beginPath()
      ctx.moveTo(x, floor)
      ctx.lineTo(x, floor - share * lights.h)
      ctx.globalAlpha = 1
      ctx.strokeStyle = colours.accent
      ctx.lineWidth = 1.75
      ctx.lineCap = 'butt'
      ctx.stroke()
      // A note the sostenuto pedal holds is marked at the top of its place.
      if (track.sostenuto) dot(ctx, x, lights.y + 1.5, 1.4, colours.ink)
    }
    ctx.globalAlpha = 1

    // The keyboard: a key that is down is lit.
    ctx.beginPath()
    for (let index = 1; index < FELT_WHITES; index++) {
      const x = crisp(keys.x + index * white)
      ctx.moveTo(x, keys.y)
      ctx.lineTo(x, keys.y + keys.h)
    }
    ctx.globalAlpha = 0.28
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.globalAlpha = INK.back
    ctx.strokeRect(keys.x + 0.5, keys.y + 0.5, keys.w - 1, keys.h - 1)
    ctx.globalAlpha = 1
    for (const track of tracks) {
      if (!track.keyDown || FELT_BLACK[track.key % 12]) continue
      const x = feltKeyX(track.key, keys)
      fillRect(
        ctx,
        { x: x - white / 2 + 0.5, y: keys.y + 1, w: white - 1, h: keys.h - 2 },
        colours.accent,
      )
    }
    const black = Math.max(1.5, white * 0.55)
    for (let at = FELT_LOW_KEY; at <= FELT_HIGH_KEY; at++) {
      if (!FELT_BLACK[at % 12]) continue
      const x = feltKeyX(at, keys)
      fillRect(ctx, { x: x - black / 2, y: keys.y, w: black, h: keys.h * 0.62 }, colours.ink, 0.85)
    }
    for (const track of tracks) {
      if (!track.keyDown || !FELT_BLACK[track.key % 12]) continue
      const x = feltKeyX(track.key, keys)
      fillRect(ctx, { x: x - black / 2, y: keys.y, w: black, h: keys.h * 0.62 }, colours.accent)
    }

    // `FeltVoice::start_note` stands a key between the speakers by its pitch, the bass to the
    // left, and Width narrows or spreads that. How far is not drawn from the knob (past its
    // middle the outer keys come out of the two sides in opposite phase, which is no place on a
    // line); each half of the foot is the level of its own side, so a low key fills the left further.
    sidesFoot(frame, foot)

    // The words: how long the hammer lies on the string, and how long the note rings.
    const top = action.y - 3
    text(
      frame,
      `${feltContactMs(key, touch, struck.felt, struck.hardness, struck.soft).toFixed(1)} ms`,
      action.x,
      top,
    )
    text(
      frame,
      `${pitchName(hzOfKey(key))} ${secondsText(feltRingSeconds(key, struck.felt))}`,
      action.x + action.w,
      top,
      { align: 'right' },
    )
  },
})

// --- Tine Piano --------------------------------------------------------------

/** `tine_piano.h`: the figures of a struck tine, its tone bar, its bell and its pickup. */
const TINE_KEY_HZ = 261.63
const TINE_BELL_RATIO = 6.267
const TINE_MAX_SWING = 0.55
const TINE_REST = 0.57735
const TINE_REST_TRAVEL = 0.22
const TINE_SOFT_STRIKE = 0.5
const TINE_BELL_SWING = 0.09
const TINE_TINE_DECAY = 0.5
const TINE_BAR_DECAY = 1.1
const TINE_BAR_LEVEL = 0.3
const TINE_BAR_RISE_SEC = 0.03
const TINE_RESTRIKE_SEC = 0.04
const TINE_VOICE_GAIN = 0.42
const TINE_TONE_LOW_HZ = 500
const TINE_TONE_SPAN = 28
const TINE_TONE_Q = 0.6

/** `TinePiano::sustain_seconds` times Decay: seconds a held key at `hz` takes to fall 60 dB. */
export function tineSustainSeconds(hz: number, decay: number): number {
  return clamp(11 * Math.pow(TINE_KEY_HZ / Math.max(hz, 1), 0.45), 1.2, 24) * decay
}

/** `TinePiano::bell_seconds`: the same for the bell, which Decay does not move. */
export function tineBellSeconds(hz: number): number {
  return clamp(0.45 * Math.pow(TINE_KEY_HZ / Math.max(hz, 1), 0.3), 0.12, 0.9)
}

/**
 * `Voice::render`, `body`: the level of tine and tone bar together `seconds`
 * after the strike, 1 at the strike. The tine's share falls in half the
 * sustain time; the bar's arrives over 30 ms and takes a little over all of it.
 */
export function tineBody(seconds: number, sustain: number): number {
  return (
    fall(seconds, sustain * TINE_TINE_DECAY) +
    TINE_BAR_LEVEL *
      fall(seconds, sustain * TINE_BAR_DECAY) *
      (1 - Math.exp(-seconds / TINE_BAR_RISE_SEC))
  )
}

/** `TinePiano::apply`, Bark: where the tine rests above the pole's axis, in pole widths. */
export const tineRest = (bark: number): number => TINE_REST - TINE_REST_TRAVEL * bark

/** `TinePiano::note_on`, `swing`: how far a struck tine swings at the pickup, in pole widths. */
export function tineSwing(
  hz: number,
  gain: number,
  bark: number,
  hardness: number,
  sampleRate: number,
): number {
  const strike = lerp(TINE_SOFT_STRIKE, 0.15 + 0.85 * gain, hardness)
  const key = clamp(Math.pow(TINE_KEY_HZ / hz, 0.3), 0.5, 1.3)
  // The most a key may swing before the pickup's harmonics fold back.
  const share = hz / (0.5 * sampleRate)
  const clean = Math.pow(1e-3 * share, share)
  return Math.min(TINE_MAX_SWING * (0.35 + 0.65 * bark) * strike * key, clean)
}

/** `TinePiano::note_on`, `bell_level`: the bell's swing beside the tine's at the strike. */
export function tineBellLevel(
  hz: number,
  gain: number,
  bell: number,
  hardness: number,
  sampleRate: number,
): number {
  const room = clamp((0.45 * sampleRate - hz * TINE_BELL_RATIO) / (0.1 * sampleRate), 0, 1)
  return bell * TINE_BELL_SWING * room * lerp(0.5, 1.3 * gain * gain, hardness)
}

/** `TinePiano::note_on`, `voice.gain`: how loud a key is for how hard it is struck. */
export const tineLoudness = (gain: number): number => 0.12 + 0.88 * gain * Math.sqrt(gain)

/** `TinePiano::process`: the gain the tremolo gives one side at `phase` of its cycle; the right side's cycle stands Pan times half a cycle on from the left's. */
export function tineTremoloGain(phase: number, depth: number): number {
  const level = Math.sqrt((1 - 0.5 * depth) * (1 - 0.5 * depth) + 0.125 * depth * depth)
  return (1 - depth * (0.5 + 0.5 * Math.sin(TAU * phase))) / level
}

/**
 * `Voice::release`: seconds the damper takes to take 60 dB off a note whose
 * key is up. A key struck again while it sounds is caught in 40 ms.
 */
function tineDamperSeconds(notes: readonly DisplayNote[], index: number, release: number): number {
  const note = notes[index]
  if (note.released === null) return release
  for (let later = index + 1; later < notes.length; later++) {
    if (notes[later].id === note.id && Math.abs(notes[later].age - note.released) < 0.03)
      return Math.min(release, TINE_RESTRIKE_SEC)
  }
  return release
}

/** How far a key has fallen, in dB under a full strike: struck `age` seconds ago, let go `released` ago. */
export function tineNoteDb(
  age: number,
  released: number | null,
  gain: number,
  sustain: number,
  damper: number,
): number {
  return gainToDb(tineBody(age, sustain) * tineLoudness(gain)) - (60 * (released ?? 0)) / damper
}

/** `kit::fast_tanh`: the amplifier's soft stage. */
function tineSoft(x: number): number {
  const at = clamp(x, -3, 3)
  return (at * (27 + at * at)) / (27 + 9 * at * at)
}

/** How many cycles of a wave are drawn, and how finely each is worked out between two points. */
const TINE_WAVE_CYCLES = 2
const TINE_WAVE_POINTS = 96
const TINE_WAVE_FINE = 4

/**
 * `Voice::render` and `TinePiano::process` as far as the tone control: two
 * cycles of what one key gives, written to `out`. The tine swings `swing`
 * pole widths about `rest`, with `body` of its own level and `ring` of the
 * bell's; the pickup turns that into a voltage, the amplifier rounds it by
 * `drive` and the tone control cuts it at `toneHz`. A damper on the tine is
 * in `body` and `ring` and nowhere else: the device takes it once on the way
 * the tine swings and once on its speed, as it takes them.
 */
export function tineWave(
  out: Float32Array,
  hz: number,
  swing: number,
  body: number,
  ring: number,
  loudness: number,
  rest: number,
  drive: number,
  toneHz: number,
): void {
  const per = (out.length / TINE_WAVE_CYCLES) * TINE_WAVE_FINE
  const rate = hz * per
  // `kit::Svf`.
  const g = Math.tan((Math.PI * Math.min(toneHz, rate * 0.49)) / rate)
  const k = 1 / TINE_TONE_Q
  const a1 = 1 / (1 + g * (g + k))
  const a2 = g * a1
  const a3 = g * a2
  let ic1 = 0
  let ic2 = 0
  const flux0 = 1 / (1 + rest * rest)
  const unity = (TINE_VOICE_GAIN * 0.5) / (rest * flux0 * flux0)
  // Three cycles first, so the filter has settled where the drawing begins.
  const lead = 3 * per
  const count = lead + out.length * TINE_WAVE_FINE
  for (let i = 0; i < count; i++) {
    const turn = (TAU * i) / per
    const along = swing * (body * Math.sin(turn) + ring * Math.sin(TINE_BELL_RATIO * turn))
    const speed = body * Math.cos(turn) + ring * TINE_BELL_RATIO * Math.cos(TINE_BELL_RATIO * turn)
    const u = rest + along
    const flux = 1 / (1 + u * u)
    const volts = tineSoft(2 * u * flux * flux * speed * loudness * unity * drive) / drive
    const v3 = volts - ic2
    const v1 = a1 * ic1 + a2 * v3
    const v2 = ic2 + a2 * ic1 + a3 * v3
    ic1 = 2 * v1 - ic1
    ic2 = 2 * v2 - ic2
    if (i >= lead && (i - lead) % TINE_WAVE_FINE === 0) out[(i - lead) / TINE_WAVE_FINE] = v2
  }
}

/** The first two ways a rod held at one end bends, 1 at its free end: `u` runs from the clamp. */
function tineBend(u: number, second: boolean): number {
  const beta = second ? 4.6941 : 1.8751
  const sigma = second ? 1.0185 : 0.7341
  const at = beta * u
  const shape = Math.cosh(at) - Math.cos(at) - sigma * (Math.sinh(at) - Math.sin(at))
  return second ? -shape / 2 : shape / 2
}

/**
 * The tines that are drawn, E1 to E7 as such a piano has them, and the ring
 * times a tine's length spans on a scale of ratios. The device has no such
 * ends (it plays from 16 Hz to 8 kHz): a note past them lights the last tine.
 */
const TINE_LOW_KEY = 28
const TINE_HIGH_KEY = 100
const TINE_LOW_HZ = 41.2
const TINE_HIGH_HZ = 2637
const TINE_SHORT_SEC = 0.25
const TINE_LONG_SEC = 100
/** How wide a pole is drawn, in px: the unit the tine's rest and swing are in. */
const TINE_POLE_PX = 16
/** How often the drawn tine swings a second, and how long its hammer is seen. */
const TINE_SWING_HZ = 4
const TINE_HAMMER_SEC = 0.12
/** The stretch of time the tremolo is drawn over, in seconds. */
const TINE_TREMOLO_SEC = 1
/** The wave's box holds this much either side of nought; a hard key at the defaults is about half of it. */
const TINE_WAVE_FULL = 0.75
/** How hard the two keys of the wave drawing are struck. */
const TINE_HARD = 1
const TINE_SOFT = 0.3

const tineLength = (seconds: number): number =>
  clamp(Math.log(seconds / TINE_SHORT_SEC) / Math.log(TINE_LONG_SEC / TINE_SHORT_SEC), 0.05, 1)

interface TineParts {
  /** One tine before its pickup, in side view. */
  fork: Box
  /** The amplifier: the wave a key gives, and under it the tremolo. */
  wave: Box
  tremolo: Box
  /** Every tine from low to high, each as long as it rings. */
  comb: Box
  foot: Box
}

function tineParts(view: Size): TineParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const foot: Box = { x: all.x, y: all.y + all.h - 7, w: all.w, h: 6 }
  const tall = Math.round(clamp(all.h * 0.2, 8, 22))
  const comb: Box = { x: all.x + 3, y: foot.y - 3 - tall, w: all.w - 6, h: tall }
  const amp = Math.round(clamp(all.w * 0.36, 40, 76))
  const top = all.y + 11
  const room = comb.y - 4 - top
  const tremolo = Math.round(clamp(room * 0.28, 8, 14))
  return {
    fork: { x: all.x, y: top, w: all.w - amp - 7, h: room },
    wave: { x: all.x + all.w - amp, y: all.y + 1, w: amp, h: room + 10 - tremolo - 12 },
    tremolo: { x: all.x + all.w - amp, y: top + room - tremolo, w: amp, h: tremolo },
    comb,
    foot,
  }
}

interface TineState {
  /** The wave of a hard key and of a soft one as the knobs set them, and of the note that sounds. */
  hard: Float32Array
  soft: Float32Array
  now: Float32Array
  /** The settings the first two were worked out at: they stand until a knob moves. */
  waveAt: Float64Array
  /** The knobs as they stand, the notes that keep theirs, and each note of this frame's own. */
  knobs: number[]
  memory: Struck[]
  struck: Struck[]
}

/**
 * `tine_piano.h`: Bell, Bark's swing, Hardness and Decay are read when a key
 * is struck, and Release when it comes up. Where each stands in `Struck.knobs`;
 * Release is nought until the key is up.
 */
const TINE_BELL_AT = 0
const TINE_BARK_AT = 1
const TINE_HARDNESS_AT = 2
const TINE_DECAY_AT = 3
const TINE_RELEASE_AT = 4

/** A wave across a box, nought on its middle line. */
function tineTrace(
  frame: Paint,
  wave: Float32Array,
  box: Box,
  colour: string,
  alpha: number,
  width: number,
): void {
  const { ctx } = frame
  const middle = box.y + box.h / 2
  ctx.beginPath()
  for (let i = 0; i < wave.length; i++) {
    const x = box.x + (i / (wave.length - 1)) * box.w
    const y = middle - clamp(wave[i] / TINE_WAVE_FULL, -1, 1) * (box.h / 2 - 1)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.globalAlpha = alpha
  ctx.strokeStyle = colour
  ctx.lineWidth = width
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.globalAlpha = 1
}

/**
 * The foot of a display whose sound moves between the speakers: the bar every
 * instrument has, each half filling from the middle with the level of its own side.
 */
function sidesFoot(frame: Paint & Pick<DisplayFrame, 'signal' | 'powered'>, box: Box): void {
  const { ctx, colours } = frame
  fillRect(ctx, box, colours.ink, INK.fill)
  const signal = frame.powered ? frame.signal : null
  if (signal) {
    const half = box.w / 2
    for (let side = 0; side < 2; side++) {
      const db = gainToDb(((side === 0 ? signal.left : signal.right) ?? signal.output).rms)
      const wide = (Number.isFinite(db) ? shareOfDb(db) : 0) * half
      if (wide > 0)
        fillRect(
          ctx,
          { x: side === 0 ? box.x + half - wide : box.x + half, y: box.y, w: wide, h: box.h },
          colours.accent,
        )
    }
  }
  ctx.globalAlpha = INK.rule
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1)
  ctx.globalAlpha = 1
}

const tine = plateDisplay<TineState>({
  place: 'window',
  columns: 2,
  params: [
    'bell',
    'bark',
    'decay',
    'release',
    'hardness',
    'tremolo',
    'tremoloRate',
    'pan',
    'tone',
    'drive',
  ],
  live: { signal: true, notes: true, stereo: true },
  info: 'A tine under its tone bar, before its pickup, and at the right the wave a hard and a soft key give and the tremolo of the two sides. Below stand the tines from low to high, each as long as it rings: a struck one lights and its light runs down as it dies.',
  init: () => ({
    hard: new Float32Array(TINE_WAVE_POINTS),
    soft: new Float32Array(TINE_WAVE_POINTS),
    now: new Float32Array(TINE_WAVE_POINTS),
    waveAt: new Float64Array(6).fill(-1),
    knobs: [0, 0, 0, 0, 0],
    memory: [],
    struck: [],
  }),
  draw(frame) {
    const { ctx, colours, state, notes } = frame
    ground(frame)
    const { fork, wave, tremolo, comb, foot } = tineParts(frame)
    const bell = clamp(frame.value('bell'), 0, 1)
    const bark = clamp(frame.value('bark'), 0, 1)
    const decay = frame.value('decay')
    const release = frame.value('release')
    const hardness = clamp(frame.value('hardness'), 0, 1)
    const depth = clamp(frame.value('tremolo'), 0, 1)
    const rate = frame.value('tremoloRate')
    const pan = clamp(frame.value('pan'), 0, 1)
    const rest = tineRest(bark)
    // `TinePiano::apply`: Drive and Tone as the amplifier takes them.
    const drive = 0.5 + 7.5 * frame.value('drive') * frame.value('drive')
    const toneHz = TINE_TONE_LOW_HZ * Math.pow(TINE_TONE_SPAN, clamp(frame.value('tone'), 0, 1))
    const sr = frame.sampleRate

    // Every note under the knobs it was struck under, and under the Release its key came up at.
    state.knobs[TINE_BELL_AT] = bell
    state.knobs[TINE_BARK_AT] = bark
    state.knobs[TINE_HARDNESS_AT] = hardness
    state.knobs[TINE_DECAY_AT] = decay
    const under = struckUnder(state.memory, frame, state.knobs, state.struck)
    const sustainOf = (index: number): number =>
      tineSustainSeconds(notes[index].frequency, under[index].knobs[TINE_DECAY_AT])
    const damperOf = (index: number): number =>
      tineDamperSeconds(notes, index, under[index].knobs[TINE_RELEASE_AT] || release)

    // The note the tine in side view moves with: the last one struck that still sounds.
    let said = -1
    for (let index = 0; index < notes.length; index++) {
      const note = notes[index]
      const kept = under[index].knobs
      if (note.released === null) kept[TINE_RELEASE_AT] = 0
      else if (kept[TINE_RELEASE_AT] === 0) kept[TINE_RELEASE_AT] = release
      const db = tineNoteDb(note.age, note.released, note.gain, sustainOf(index), damperOf(index))
      if (shareOfDb(db) >= DONE) said = index
    }
    const sounding = said >= 0 ? notes[said] : null
    const hz = sounding ? sounding.frequency : TINE_KEY_HZ

    // --- The tine before its pickup ---
    const railX = fork.x + 5
    const tineY = fork.y + Math.round(fork.h * 0.5)
    const tipX = fork.x + fork.w * 0.66
    const long = tipX - railX
    // The rail the tine and its bar are held on.
    fillRect(ctx, { x: fork.x, y: fork.y + 3, w: 5, h: fork.h - 8 }, colours.ink, INK.text)
    // The tone bar over the tine: it is not struck and not read; it keeps the note going.
    const bar: Box = { x: railX, y: tineY - 16, w: Math.min(fork.w * 0.9, long + 14), h: 5 }
    fillRect(ctx, bar, colours.ink, INK.back)
    ctx.globalAlpha = INK.text
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.strokeRect(bar.x + 0.5, bar.y + 0.5, bar.w - 1, bar.h - 1)
    ctx.globalAlpha = 1
    rule(ctx, railX + 3, bar.y + bar.h, railX + 3, tineY, { colour: colours.ink, alpha: INK.text })

    // The pickup: Bark brings its pole nearer the tine's tip and its axis nearer the tine's rest.
    const poleX = tipX + lerp(5, 2, bark)
    const axisY = tineY + rest * TINE_POLE_PX
    // What the coil reads of the pole's field across the tine's way: 1 / (1 + u²), widest on the
    // axis. It is drawn as far as the tine has room to swing, between its bar and its hammer.
    const low = Math.max(-1.9, (bar.y + bar.h + 1 - axisY) / TINE_POLE_PX)
    const high = Math.min(1.9, (fork.y + fork.h - axisY) / TINE_POLE_PX)
    ctx.beginPath()
    ctx.moveTo(poleX, axisY + low * TINE_POLE_PX)
    for (let step = 0; step <= 32; step++) {
      const u = lerp(low, high, step / 32)
      ctx.lineTo(poleX - (0.8 * TINE_POLE_PX) / (1 + u * u), axisY + u * TINE_POLE_PX)
    }
    ctx.lineTo(poleX, axisY + high * TINE_POLE_PX)
    ctx.closePath()
    ctx.globalAlpha = INK.fill
    ctx.fillStyle = colours.ink
    ctx.fill()
    ctx.globalAlpha = 1
    const pole: Box = { x: poleX, y: axisY - TINE_POLE_PX / 2, w: 7, h: TINE_POLE_PX }
    fillRect(ctx, pole, colours.ink, INK.text)
    const coil: Box = { x: poleX + 4, y: axisY - TINE_POLE_PX * 0.5 - 3, w: 9, h: TINE_POLE_PX + 6 }
    fillRect(ctx, coil, colours.plate)
    fillRect(ctx, coil, colours.ink, INK.fill)
    ctx.beginPath()
    for (let turn = 0; turn < 3; turn++) {
      const x = crisp(coil.x + 2 + turn * 2.5)
      ctx.moveTo(x, coil.y)
      ctx.lineTo(x, coil.y + coil.h)
    }
    ctx.globalAlpha = INK.back
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.globalAlpha = INK.text
    ctx.strokeRect(coil.x + 0.5, coil.y + 0.5, coil.w - 1, coil.h - 1)
    ctx.globalAlpha = 1
    // The lead from the coil to the amplifier: it comes in on the wave's own line.
    const leadX = wave.x - 4
    const leadY = wave.y + wave.h / 2
    ctx.beginPath()
    ctx.moveTo(coil.x + coil.w, crisp(axisY))
    ctx.lineTo(crisp(leadX), crisp(axisY))
    ctx.lineTo(crisp(leadX), crisp(leadY))
    ctx.lineTo(wave.x, crisp(leadY))
    ctx.globalAlpha = INK.back
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.lineJoin = 'miter'
    ctx.stroke()
    ctx.globalAlpha = 1

    // The tine at rest, and its hammer under it.
    rule(ctx, railX, tineY, tipX, tineY, { colour: colours.ink, alpha: INK.text, width: 1.5 })
    // Its tip is as small as it is hard, on an arm that swings up from a pivot under the rail.
    const hammerX = railX + long * 0.42
    const since = sounding ? sounding.age : Infinity
    const up = since < TINE_HAMMER_SEC ? 1 - since / TINE_HAMMER_SEC : 0
    const tip = lerp(3.5, 2, hardness)
    const hammerY = tineY + 1.5 + tip + 5 * (1 - up)
    const pivotX = railX + 2
    const pivotY = fork.y + fork.h - 2
    const struck = up > 0 ? colours.accent : colours.ink
    ctx.beginPath()
    ctx.moveTo(pivotX, pivotY)
    ctx.lineTo(hammerX, hammerY + tip)
    ctx.globalAlpha = up > 0 ? 1 : INK.text
    ctx.strokeStyle = struck
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    ctx.stroke()
    ctx.globalAlpha = 1
    dot(ctx, pivotX, pivotY, 1.5, colours.ink, { alpha: INK.text })
    dot(ctx, hammerX, hammerY, tip, struck, { alpha: up > 0 ? 1 : INK.text })

    // The tine as the note moves it: the tine's own bend as far as it swings at the pickup, in
    // pole widths, and the bell's bend on top of it while the bell lasts.
    let body = 1
    let ring = 0
    let damper = 1
    let swing = 0
    if (sounding) {
      const kept = under[said].knobs
      body = tineBody(sounding.age, sustainOf(said))
      ring =
        tineBellLevel(hz, sounding.gain, kept[TINE_BELL_AT], kept[TINE_HARDNESS_AT], sr) *
        fall(sounding.age, tineBellSeconds(hz))
      damper = fall(sounding.released ?? 0, damperOf(said))
      swing = tineSwing(hz, sounding.gain, kept[TINE_BARK_AT], kept[TINE_HARDNESS_AT], sr)
      const turn = TAU * TINE_SWING_HZ * sounding.age
      const first = damper * swing * body * Math.sin(turn) * TINE_POLE_PX
      const second = damper * swing * ring * Math.sin(TINE_BELL_RATIO * turn) * TINE_POLE_PX
      ctx.beginPath()
      ctx.moveTo(railX, tineY)
      for (let step = 1; step <= 16; step++) {
        const u = step / 16
        // The bell's bend is small at the tip and is drawn larger, or it would not be seen at all.
        ctx.lineTo(
          railX + u * long,
          tineY - first * tineBend(u, false) - 4 * second * tineBend(u, true),
        )
      }
      ctx.strokeStyle = colours.accent
      ctx.lineWidth = 1.75
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.stroke()
      dot(ctx, tipX, tineY - first - 4 * second, 1.75, colours.accent)
    }

    // --- The amplifier ---
    // The wave a hard key and a soft one give at the strike, through the pickup, Drive and Tone.
    rule(ctx, wave.x, wave.y + wave.h / 2, wave.x + wave.w, wave.y + wave.h / 2, {
      colour: colours.ink,
      alpha: INK.grid,
    })
    const waveAt = state.waveAt
    if (
      waveAt[0] !== bark ||
      waveAt[1] !== hardness ||
      waveAt[2] !== bell ||
      waveAt[3] !== drive ||
      waveAt[4] !== toneHz ||
      waveAt[5] !== sr
    ) {
      waveAt[0] = bark
      waveAt[1] = hardness
      waveAt[2] = bell
      waveAt[3] = drive
      waveAt[4] = toneHz
      waveAt[5] = sr
      for (let touch = 0; touch < 2; touch++) {
        const gain = touch === 1 ? TINE_HARD : TINE_SOFT
        tineWave(
          touch === 1 ? state.hard : state.soft,
          TINE_KEY_HZ,
          tineSwing(TINE_KEY_HZ, gain, bark, hardness, sr),
          1,
          tineBellLevel(TINE_KEY_HZ, gain, bell, hardness, sr),
          tineLoudness(gain),
          rest,
          drive,
          toneHz,
        )
      }
    }
    tineTrace(frame, state.soft, wave, colours.ink, INK.back, 1)
    tineTrace(frame, state.hard, wave, colours.ink, INK.text, 1.25)
    // The note that sounds, as it is now: it grows purer as it dies.
    if (sounding) {
      tineWave(
        state.now,
        hz,
        swing,
        damper * body,
        damper * ring,
        tineLoudness(sounding.gain),
        rest,
        drive,
        toneHz,
      )
      tineTrace(frame, state.now, wave, colours.accent, 1, 1.5)
    }

    // The tremolo over a second: the gain of the left side, and of the right, Pan times half a
    // cycle on from it (`lfo_phase_ + lag`).
    // Where it is in its cycle is not known, so it stands still; the foot shows it move.
    const most = tineTremoloGain(0.75, 1)
    for (let side = 0; side < 2; side++) {
      const right = side === 0
      ctx.beginPath()
      const steps = Math.max(8, Math.round(tremolo.w))
      for (let step = 0; step <= steps; step++) {
        const seconds = (step / steps) * TINE_TREMOLO_SEC
        const gain = tineTremoloGain(rate * seconds + (right ? 0.5 * pan : 0), depth)
        const x = tremolo.x + (step / steps) * tremolo.w
        const y = tremolo.y + tremolo.h - (gain / most) * (tremolo.h - 1)
        if (step === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.globalAlpha = right ? INK.back : 1
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = right ? 1 : 1.25
      ctx.lineJoin = 'round'
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    rule(ctx, tremolo.x, tremolo.y + tremolo.h, tremolo.x + tremolo.w, tremolo.y + tremolo.h, {
      colour: colours.ink,
      alpha: INK.rule,
    })
    text(
      frame,
      `${rate < 9.95 ? rate.toFixed(1) : Math.round(rate)} Hz`,
      tremolo.x + tremolo.w,
      tremolo.y - 3,
      { align: 'right' },
    )

    // --- The tines ---
    const feet = comb.y + comb.h
    const tipOf = (at: number): number => feet - tineLength(tineSustainSeconds(at, decay)) * comb.h
    // Every tine of the 73, or every other one where they would stand under 2 px apart; the Cs
    // are drawn stronger to count by.
    const every = comb.w / (TINE_HIGH_KEY - TINE_LOW_KEY) < 2 ? 2 : 1
    for (let pass = 0; pass < 2; pass++) {
      const strong = pass === 1
      ctx.beginPath()
      for (let key = TINE_LOW_KEY; key <= TINE_HIGH_KEY; key += every) {
        if ((key % 12 === 0) !== strong) continue
        const at = hzOfKey(key)
        const x = xOfPitch(at, comb, TINE_LOW_HZ, TINE_HIGH_HZ)
        ctx.moveTo(x, feet)
        ctx.lineTo(x, tipOf(at))
      }
      ctx.globalAlpha = strong ? INK.text : 0.4
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.lineCap = 'butt'
      ctx.stroke()
    }
    // The pickups stand on one rail before the tips.
    ctx.beginPath()
    for (let key = TINE_LOW_KEY; key <= TINE_HIGH_KEY; key++) {
      const at = hzOfKey(key)
      const x = xOfPitch(at, comb, TINE_LOW_HZ, TINE_HIGH_HZ)
      if (key === TINE_LOW_KEY) ctx.moveTo(x - 1, tipOf(at) - 2.5)
      ctx.lineTo(x + (key === TINE_HIGH_KEY ? 1 : 0), tipOf(at) - 2.5)
    }
    ctx.globalAlpha = INK.text
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.stroke()
    ctx.globalAlpha = 1
    rule(ctx, comb.x - 3, feet, comb.x + comb.w + 3, feet, { colour: colours.ink, alpha: INK.text })

    for (let index = 0; index < notes.length; index++) {
      const note = notes[index]
      const sustain = sustainOf(index)
      const share = shareOfDb(
        tineNoteDb(note.age, note.released, note.gain, sustain, damperOf(index)),
      )
      if (share < DONE) continue
      const x = xOfPitch(note.frequency, comb, TINE_LOW_HZ, TINE_HIGH_HZ)
      const tall = tineLength(sustain) * comb.h
      // It sways as the tine in the side view does: from its own strike, slowly enough to be seen.
      const sway = 1.5 * Math.pow(share, 0.7) * Math.sin(TAU * TINE_SWING_HZ * note.age)
      ctx.beginPath()
      ctx.moveTo(x, feet)
      ctx.lineTo(x + sway * share * share, feet - share * tall)
      ctx.strokeStyle = colours.accent
      ctx.lineWidth = 1.75
      ctx.lineCap = 'round'
      ctx.stroke()
      // Its pickup is lit while the tine before it swings.
      dot(ctx, x, feet - tall - 2.5, 1.5, colours.accent, { alpha: Math.pow(share, 0.5) })
    }

    sidesFoot(frame, foot)

    // The words: the note and how long it rings held.
    text(
      frame,
      `${pitchName(hz)} ${secondsText(said >= 0 ? sustainOf(said) : tineSustainSeconds(hz, decay))}`,
      fork.x,
      fork.y - 4,
    )
  },
})

// --- Glass -------------------------------------------------------------------

/** `fm_glass.h`: the ratios a modulator may stand at, the four algorithms and what each makes of the envelopes. */
const GLASS_RATIOS = [0.5, 1, 1.41, 2, 2.76, 3, 3.5, 4, 5, 7, 9, 14]
const GLASS_NAMES = ['Bell', 'Glass', 'Mallet', 'Pad']
const GLASS_STACK = 1
const GLASS_MALLET = 2
/**
 * `fm_glass.h`, `kShapes`: the modulators' attack as a multiple of Attack,
 * the first and second modulator's decay as multiples of Decay, the second's
 * index beside the first's, the second half's level beside the first's, and
 * the brightness the modulators settle on at Sustain 1.
 */
const GLASS_SHAPES = [
  { attack: 0.5, decayA: 1, decayB: 0.6, indexB: 0.7, levelB: 1, floor: 0.35 },
  { attack: 0.5, decayA: 1, decayB: 0.4, indexB: 0.6, levelB: 0.8, floor: 0.3 },
  { attack: 0.25, decayA: 0.5, decayB: 0.3, indexB: 1, levelB: 1, floor: 0.2 },
  { attack: 2, decayA: 2, decayB: 3, indexB: 0.8, levelB: 1, floor: 0.7 },
] as const
const GLASS_MAX_INDEX = 8
const GLASS_KEY_HZ = 261.63
const GLASS_AMP_DECAY = 4
const GLASS_MAX_FEEDBACK = 0.75
const GLASS_BAND_LIMIT = 0.47
const GLASS_FEEDBACK_MARGIN = 3
const GLASS_STACK_MARGIN = 2
const GLASS_FEEDBACK_HARMONICS = 28
const GLASS_BAR_RATIO = 4
const GLASS_BAR_LEVEL = 0.35
const GLASS_RESTRIKE_SEC = 0.03

/** `FmGlass::key_time_scale`: how much longer than the set time a note at `hz` decays. */
export function glassTimeScale(hz: number): number {
  return clamp(Math.pow(GLASS_KEY_HZ / hz, 0.4), 0.4, 2.5)
}

/** `FmGlass::key_index_scale`: the share of the set modulation index a note at `hz` gets. */
export function glassIndexScale(hz: number): number {
  return clamp(Math.pow(GLASS_KEY_HZ / hz, 0.5), 0.3, 1.4)
}

/** `FmGlass::shape`: seconds a held note at `hz` rings, four times as long as its brightness lasts. */
export function glassRingSeconds(hz: number, decay: number): number {
  return decay * glassTimeScale(hz) * GLASS_AMP_DECAY
}

/** `fm_glass.h`: how many times a second the two halves of a note at `hz` beat, Detune cents apart. */
export function glassBeatHz(hz: number, detune: number): number {
  return hz * (Math.pow(2, detune / 2400) - Math.pow(2, -detune / 2400))
}

/** `kit::Adsr`: an envelope `seconds` after its gate opened, while the gate stays open. */
function adsrHeld(seconds: number, attack: number, decay: number, sustain: number): number {
  if (seconds <= 0) return 0
  // The attack aims at 1.3 and is cut off at 1, which it reaches when the attack time is up.
  if (seconds < attack) return Math.min(1, 1.3 * (1 - Math.pow(0.3 / 1.3, seconds / attack)))
  const level = sustain + (1 - sustain) * fall(seconds - attack, decay)
  return level - sustain < 1e-5 ? sustain : level
}

/**
 * `kit::Adsr`: an envelope `seconds` after its gate opened, the gate shut
 * `released` seconds ago (null while it is open). The decay takes 60 dB off
 * the way to the sustain level in `decay` seconds, the release 60 dB off
 * wherever the envelope stood in `release` seconds.
 */
export function adsrLevel(
  seconds: number,
  released: number | null,
  attack: number,
  decay: number,
  sustain: number,
  release: number,
): number {
  if (released === null) return adsrHeld(seconds, attack, decay, sustain)
  const level = adsrHeld(seconds - released, attack, decay, sustain) * fall(released, release)
  return level < 1e-5 ? 0 : level
}

/** The knobs of Glass as the device takes them. */
interface GlassSet {
  algorithm: number
  ratio: number
  /** Brightness through its 1.5 power, and Feedback in radians (`FmGlass::apply`). */
  brightness: number
  feedback: number
  decay: number
  attack: number
  release: number
  sustain: number
  detune: number
  velocity: number
  spread: number
  sampleRate: number
}

// `fm_glass.h`, "band-limiting": how much index fits under the limit, as the device works it out per note.

function glassIndexForRoom(room: number, peakHz: number, skirtHz: number): number {
  if (room < skirtHz) return 0
  if (room < 0.06 * peakHz + 2.2 * skirtHz) return 0.06
  const root =
    (Math.sqrt(2.56 * skirtHz * skirtHz + 4 * peakHz * (room - 1.8 * skirtHz)) - 1.6 * skirtHz) /
    (2 * peakHz)
  return root * root
}

const glassSkirt = (slope: number, margin: number): number => 1 + margin * (slope - 1)
const glassFeedbackPeak = (beta: number): number => 1 / (1 - beta)

function glassFeedbackSlope(beta: number): number {
  if (beta < 0.05) return 1 + 0.375 * beta * beta
  const s = Math.sqrt(1 - beta * beta)
  return Math.sqrt((2 * (1 - s)) / (beta * beta * s))
}

/** `FmGlass::feedback_room`: the share of the set feedback a modulator may have. */
function glassFeedbackRoom(
  carrierHz: number,
  modulatorHz: number,
  beta: number,
  sampleRate: number,
): number {
  const fit =
    ((GLASS_BAND_LIMIT * sampleRate - carrierHz) / modulatorHz - 2) / GLASS_FEEDBACK_HARMONICS
  if (fit <= 0) return 0
  const most = Math.cbrt(fit * fit)
  return beta <= most ? 1 : most / beta
}

/** `FmGlass::pair_cap`: the largest index in radians a modulator may have on its carrier. */
function glassPairCap(
  carrierHz: number,
  modulatorHz: number,
  beta: number,
  sampleRate: number,
): number {
  const room = GLASS_BAND_LIMIT * sampleRate - carrierHz
  if (room <= 0 || modulatorHz <= 0) return 0
  return glassIndexForRoom(
    room,
    modulatorHz * glassFeedbackPeak(beta),
    modulatorHz * glassSkirt(glassFeedbackSlope(beta), GLASS_FEEDBACK_MARGIN),
  )
}

/** `FmGlass::stack_fits`. */
function glassStackFits(
  room: number,
  middleHz: number,
  index: number,
  top: number,
  beta: number,
): boolean {
  let square = 1 + 2 * top * top
  if (top < 3) {
    let j1 = top
    let j2 = 0.5 * top * top
    let t1 = j1
    let t2 = j2
    for (let k = 1; k < 14; k++) {
      t1 *= (-top * top) / (k * (k + 1))
      t2 *= (-top * top) / (k * (k + 2))
      j1 += t1
      j2 += t2
    }
    square += j1 - 2 * top * j2
  }
  const peak = 1 + 2 * top * glassFeedbackPeak(beta)
  const slope = Math.max(1, Math.sqrt(square) * glassFeedbackSlope(beta))
  const tail = index < 0.002 ? 0 : index < 0.06 ? 1 : 1.6 * Math.sqrt(index) + 1.8
  return index * middleHz * peak + tail * middleHz * glassSkirt(slope, GLASS_STACK_MARGIN) <= room
}

/** `FmGlass::stack_scale`: the share of both of a stack's indices that fits. */
function glassStackScale(
  carrierHz: number,
  middleHz: number,
  index: number,
  top: number,
  beta: number,
  sampleRate: number,
): number {
  const room = GLASS_BAND_LIMIT * sampleRate - carrierHz
  if (room <= 0) return 0
  if (glassStackFits(room, middleHz, index, top, beta)) return 1
  let low = 0
  let high = 1
  for (let step = 0; step < 8; step++) {
    const middle = 0.5 * (low + high)
    if (glassStackFits(room, middleHz, index * middle, top * middle, beta)) low = middle
    else high = middle
  }
  return low
}

/** What `FmGlass::note_on` and `tune` make of one note: its level, its indices at their peak and its feedback, in radians. */
interface GlassTuned {
  level: number
  /** The first modulator's index on its carrier, and the second's on its own (in a stack: on the first). */
  indexA: number
  indexB: number
  betaA: number
  betaB: number
  /** Mallet: the level of the partial four times the note. */
  bar: number
}

/** `FmGlass::note_on` and `tune`: a note at `hz` struck as hard as `gain`, as the knobs stand. */
function glassTune(set: GlassSet, hz: number, gain: number, into: GlassTuned): GlassTuned {
  const sr = set.sampleRate
  const limit = GLASS_BAND_LIMIT * sr
  const shape = GLASS_SHAPES[set.algorithm]
  const flat = hz * Math.pow(2, -set.detune / 2400)
  const sharp = hz * Math.pow(2, set.detune / 2400)
  const touch = 1 - set.velocity * 0.75 * (1 - gain)
  const wanted = set.brightness * GLASS_MAX_INDEX * glassIndexScale(hz) * touch
  into.level = 1 - set.velocity * (1 - gain * Math.sqrt(gain))
  into.bar = 0
  if (set.algorithm === GLASS_STACK) {
    const middle = flat * set.ratio
    const top = middle * 2
    const beta = set.feedback * glassFeedbackRoom(middle, top, set.feedback, sr)
    const partials = (0.5 * ((limit - flat) / middle - 1)) / glassFeedbackPeak(beta)
    const topCap = Math.min(glassPairCap(middle, top, beta, sr), glassIndexForRoom(partials, 1, 1))
    const onMiddle = Math.min(wanted * shape.indexB, topCap)
    const scale = glassStackScale(flat, middle, wanted, onMiddle, beta, sr)
    into.indexA = middle < limit ? scale * wanted : 0
    into.indexB = top < limit ? scale * onMiddle : 0
    into.betaA = 0
    into.betaB = beta
  } else if (set.algorithm === GLASS_MALLET) {
    const strike = hz * set.ratio
    const beta = set.feedback * glassFeedbackRoom(sharp, strike, set.feedback, sr)
    into.indexA = Math.min(wanted, glassPairCap(sharp, strike, beta, sr))
    into.indexB = 0
    into.betaA = beta
    into.betaB = 0
    if (hz * GLASS_BAR_RATIO < limit)
      into.bar = Math.min(set.brightness * 2 * glassIndexScale(hz) * touch, GLASS_BAR_LEVEL)
  } else {
    into.betaA = set.feedback * glassFeedbackRoom(flat, flat * set.ratio, set.feedback, sr)
    into.betaB = set.feedback * glassFeedbackRoom(sharp, sharp * set.ratio, set.feedback, sr)
    into.indexA = Math.min(wanted, glassPairCap(flat, flat * set.ratio, into.betaA, sr))
    into.indexB = Math.min(
      wanted * shape.indexB,
      glassPairCap(sharp, sharp * set.ratio, into.betaB, sr),
    )
  }
  return into
}

/** The peak index in radians of the first modulator of a note, band-limited as `FmGlass::tune` limits it. */
export function glassIndex(
  hz: number,
  gain: number,
  knobs: {
    algorithm: number
    ratio: number
    brightness: number
    velocity: number
    feedback: number
    detune: number
  },
  sampleRate = 48000,
): number {
  const set: GlassSet = {
    algorithm: knobs.algorithm,
    ratio: GLASS_RATIOS[knobs.ratio],
    brightness: knobs.brightness * Math.sqrt(knobs.brightness),
    feedback: knobs.feedback * GLASS_MAX_FEEDBACK,
    velocity: knobs.velocity,
    detune: knobs.detune,
    decay: 1,
    attack: 0.001,
    release: 1,
    sustain: 0,
    spread: 0,
    sampleRate,
  }
  return glassTune(set, hz, gain, { level: 0, indexA: 0, indexB: 0, betaA: 0, betaB: 0, bar: 0 })
    .indexA
}

/** The four envelopes of a note as `FmGlass::shape` sets them: its loudness, its two modulators and Mallet's bar. */
interface GlassEnvelopes {
  carrier: number
  modA: number
  modB: number
  bar: number
}

function glassEnvelopes(
  set: GlassSet,
  hz: number,
  age: number,
  released: number | null,
  release: number,
  into: GlassEnvelopes,
): GlassEnvelopes {
  const shape = GLASS_SHAPES[set.algorithm]
  const decay = set.decay * glassTimeScale(hz)
  const ring = decay * GLASS_AMP_DECAY
  const attack = Math.max(0.001, set.attack * shape.attack)
  const floor = shape.floor * set.sustain
  const mallet = set.algorithm === GLASS_MALLET
  into.carrier = adsrLevel(age, released, set.attack, ring, set.sustain, release)
  into.modA = adsrLevel(age, released, attack, decay * shape.decayA, floor, release)
  into.modB = mallet ? 0 : adsrLevel(age, released, attack, decay * shape.decayB, floor, release)
  // The bar partial is part of the strike: it never sustains.
  into.bar = mallet ? adsrLevel(age, released, set.attack, ring * shape.decayB, 0, release) : 0
  return into
}

/** `FmGlass::note_on`: seconds a note's release takes; a key struck again while held is let go in 30 ms. */
function glassReleaseSeconds(
  notes: readonly DisplayNote[],
  index: number,
  release: number,
): number {
  const note = notes[index]
  if (note.released === null) return release
  for (let later = index + 1; later < notes.length; later++) {
    if (notes[later].id === note.id && Math.abs(notes[later].age - note.released) < 0.03)
      return Math.min(release, GLASS_RESTRIKE_SEC)
  }
  return release
}

/** `FmGlass::self_modulated`: an operator that modulates itself by `beta` radians, y = sin(x + beta y). */
function glassOperator(turn: number, beta: number): number {
  let y = Math.sin(turn)
  if (beta < 1e-4) return y
  for (let step = 0; step < 4; step++) {
    const at = turn + beta * y
    y -= (y - Math.sin(at)) / (1 - beta * Math.cos(at))
  }
  return y
}

/** The points a modulator's cycle is taken at to find its sidebands, and the most sidebands found either side. */
const GLASS_POINTS = 256
const GLASS_SIDEBANDS = 64
const GLASS_COS = new Float32Array(GLASS_POINTS)
const GLASS_SIN = new Float32Array(GLASS_POINTS)
for (let k = 0; k < GLASS_POINTS; k++) {
  GLASS_COS[k] = Math.cos((TAU * k) / GLASS_POINTS)
  GLASS_SIN[k] = Math.sin((TAU * k) / GLASS_POINTS)
}
/** The spectrum's scale: from 30 Hz to 16 kHz, and down to 54 dB under a whole note. */
const GLASS_LOW_HZ = 30
const GLASS_HIGH_HZ = 16000
const GLASS_FLOOR_DB = -54
const GLASS_COLUMNS = 1024
/** How many notes are drawn in their partials at once; the device has 16 voices. */
const GLASS_LIT_MOST = 8
/** How hard the soft touch of the spectrum is struck. */
const GLASS_SOFT = 0.3

interface GlassState {
  /** One cycle of a modulator, and the carrier's phase under it. */
  wave: Float32Array
  turnRe: Float32Array
  turnIm: Float32Array
  /** The sidebands of a carrier, from so many below it to so many above. */
  sideRe: Float32Array
  sideIm: Float32Array
  /** What the wave was made of last, so that it is not made again for the other half of a note. */
  waveOf: number
  /** The partials of one note by the column of the spectrum they fall in. */
  re: Float32Array
  im: Float32Array
  /** The partials of middle C struck hard and softly, and the settings they were worked out at. */
  hard: Float32Array
  soft: Float32Array
  restAt: Float64Array
  tuned: GlassTuned
  envelopes: GlassEnvelopes
  /** The notes that sound on this frame, as places in `frame.notes`. */
  lit: number[]
  /** The knobs as they stand, the notes that keep theirs, and each note of this frame's own. */
  knobs: number[]
  memory: Struck[]
  struck: Struck[]
}

/**
 * `FmGlass::note_on`: the algorithm, the ratio and what Velocity makes of the
 * touch are a note's own from its start. Where each stands in `Struck.knobs`.
 */
const GLASS_ALGORITHM_AT = 0
const GLASS_RATIO_AT = 1
const GLASS_VELOCITY_AT = 2

/**
 * The sidebands of a carrier whose phase is moved `index` radians by the wave
 * in `state.wave`: how much of it stands `n` modulator pitches away, for `n`
 * from `-most` to `most`. They are Bessel functions when the wave is a sine;
 * a modulator that feeds itself or is modulated is not one, so they are taken
 * from the wave itself.
 */
function glassSidebands(state: GlassState, index: number, most: number): void {
  // A cycle is taken at four points for every sideband wanted, so that what
  // lies beyond them folds back far under the floor of the picture.
  const points = most <= 8 ? 32 : most <= 16 ? 64 : most <= 32 ? 128 : GLASS_POINTS
  const stride = GLASS_POINTS / points
  for (let k = 0; k < points; k++) {
    const turn = index * state.wave[k * stride]
    state.turnRe[k] = Math.cos(turn)
    state.turnIm[k] = Math.sin(turn)
  }
  for (let n = -most; n <= most; n++) {
    const step = (((-n * stride) % GLASS_POINTS) + GLASS_POINTS) % GLASS_POINTS
    let at = 0
    let re = 0
    let im = 0
    for (let k = 0; k < points; k++) {
      re += state.turnRe[k] * GLASS_COS[at] - state.turnIm[k] * GLASS_SIN[at]
      im += state.turnRe[k] * GLASS_SIN[at] + state.turnIm[k] * GLASS_COS[at]
      at += step
      if (at >= GLASS_POINTS) at -= GLASS_POINTS
    }
    state.sideRe[n + GLASS_SIDEBANDS] = re / points
    state.sideIm[n + GLASS_SIDEBANDS] = im / points
  }
}

/** One cycle of an operator that modulates itself by `beta` into `state.wave`, unless it stands there already. */
function glassWave(state: GlassState, beta: number): void {
  if (state.waveOf === beta) return
  for (let k = 0; k < GLASS_POINTS; k++)
    state.wave[k] = glassOperator((TAU * k) / GLASS_POINTS, beta)
  state.waveOf = beta
}

/** How many sidebands either side an index reaches above the floor, under a wave whose steepest slope is `peak` times a sine's. */
function glassReach(index: number, peak: number): number {
  if (index < 1e-4) return 0
  return Math.min(GLASS_SIDEBANDS, Math.ceil(index * peak + 1.6 * Math.sqrt(index * peak) + 3))
}

/**
 * One partial into its column: at `hz` (below nought it is heard at the same
 * pitch above it, turned over), `turn` radians on from where it began.
 */
function glassPartial(
  state: GlassState,
  box: Box,
  hz: number,
  re: number,
  im: number,
  turn: number,
): void {
  const cos = Math.cos(turn)
  const sin = Math.sin(turn)
  const at = Math.abs(hz)
  if (at < GLASS_LOW_HZ || at > GLASS_HIGH_HZ) return
  const column = Math.round(xOfHz(at, box, GLASS_LOW_HZ, GLASS_HIGH_HZ) - box.x)
  state.re[column] += (hz < 0 ? -1 : 1) * (re * cos - im * sin)
  state.im[column] += re * sin + im * cos
}

/**
 * The partials of one note as one speaker has them, into `state.re` and
 * `state.im`: `FmGlass::render` taken apart. Each half of the note is a
 * carrier and the sidebands its modulator gives it. The two halves stand
 * Detune apart, which is too near to draw apart, so a partial of one stands
 * in the place of the same partial of the other; `seconds` after the strike
 * it has turned against it, and the two beat on the picture as in the ear.
 * `FmGlass::process`: a speaker has all of one half and as much of the other
 * as Spread leaves it, so the beat is as deep as the halves are alike there.
 */
function glassSpray(
  state: GlassState,
  set: GlassSet,
  box: Box,
  hz: number,
  tuned: GlassTuned,
  envelopes: GlassEnvelopes,
  seconds: number,
): void {
  const columns = Math.min(GLASS_COLUMNS, Math.ceil(box.w) + 2)
  state.re.fill(0, 0, columns)
  state.im.fill(0, 0, columns)
  const shape = GLASS_SHAPES[set.algorithm]
  const flat = Math.pow(2, -set.detune / 2400)
  const sharp = 1 / flat
  const lean = (1 - set.spread) * 0.125 * TAU
  const a = envelopes.carrier * tuned.level * Math.cos(lean)
  const b = envelopes.carrier * tuned.level * shape.levelB * Math.sin(lean)
  const middle = GLASS_SIDEBANDS
  if (set.algorithm === GLASS_STACK) {
    // The first half: a carrier under a modulator that is itself under one at twice its pitch.
    const top = tuned.indexB * envelopes.modB
    for (let k = 0; k < GLASS_POINTS; k++) {
      const turn = (TAU * k) / GLASS_POINTS
      state.wave[k] = Math.sin(turn + top * glassOperator(2 * turn, tuned.betaB))
    }
    state.waveOf = -1
    const index = tuned.indexA * envelopes.modA
    const most = glassReach(index, 1 + 2 * top * glassFeedbackPeak(tuned.betaB))
    glassSidebands(state, index, most)
    for (let n = -most; n <= most; n++) {
      const at = hz * (1 + n * set.ratio)
      glassPartial(
        state,
        box,
        at,
        a * state.sideRe[n + middle],
        a * state.sideIm[n + middle],
        TAU * (flat - 1) * at * seconds,
      )
    }
    // The second: a bare carrier.
    glassPartial(state, box, hz, b, 0, TAU * (sharp - 1) * hz * seconds)
    return
  }
  if (set.algorithm === GLASS_MALLET) {
    // One modulator at the note's own pitch times Ratio strikes both carriers.
    glassWave(state, tuned.betaA)
    const index = tuned.indexA * envelopes.modA
    const most = glassReach(index, glassFeedbackPeak(tuned.betaA))
    glassSidebands(state, index, most)
    for (let n = -most; n <= most; n++) {
      const re = state.sideRe[n + middle]
      const im = state.sideIm[n + middle]
      const off = n * hz * set.ratio
      glassPartial(state, box, hz + off, a * re, a * im, TAU * (flat - 1) * hz * seconds)
      glassPartial(state, box, hz + off, b * re, b * im, TAU * (sharp - 1) * hz * seconds)
    }
    // The bar: a partial four times the note in both halves, for as long as the strike lasts.
    glassPartial(
      state,
      box,
      hz * GLASS_BAR_RATIO,
      envelopes.bar * tuned.bar * tuned.level * (Math.cos(lean) + shape.levelB * Math.sin(lean)),
      0,
      0,
    )
    return
  }
  // Bell and Pad: two pairs, each a carrier under its own modulator.
  for (let half = 0; half < 2; half++) {
    const second = half === 1
    const beta = second ? tuned.betaB : tuned.betaA
    glassWave(state, beta)
    const index = second ? tuned.indexB * envelopes.modB : tuned.indexA * envelopes.modA
    const most = glassReach(index, glassFeedbackPeak(beta))
    glassSidebands(state, index, most)
    const tuning = second ? sharp : flat
    const level = second ? b : a
    for (let n = -most; n <= most; n++) {
      const at = hz * (1 + n * set.ratio)
      glassPartial(
        state,
        box,
        at,
        level * state.sideRe[n + middle],
        level * state.sideIm[n + middle],
        TAU * (tuning - 1) * at * seconds,
      )
    }
  }
}

/** How strong the partials in `state.re` and `state.im` stand in each column, into `levels`. */
function glassLevels(state: GlassState, box: Box, levels: Float32Array): void {
  const columns = Math.min(GLASS_COLUMNS, Math.ceil(box.w) + 2)
  for (let column = 0; column < columns; column++)
    levels[column] = Math.hypot(state.re[column], state.im[column])
}

/** Partials as stems on the spectrum, each as high as it is strong against a whole note. */
function glassStems(
  frame: Paint,
  levels: Float32Array,
  box: Box,
  whole: number,
  colour: string,
  alpha: number,
  width: number,
): void {
  const { ctx } = frame
  const foot = box.y + box.h
  const columns = Math.min(GLASS_COLUMNS, Math.ceil(box.w) + 2)
  let any = false
  ctx.beginPath()
  for (let column = 0; column < columns; column++) {
    const level = levels[column] / whole
    if (level <= 0) continue
    const share = 1 - gainToDb(level) / GLASS_FLOOR_DB
    if (share < DONE) continue
    const x = Math.floor(box.x + column) + 0.5
    const y = foot - Math.min(1, share) * box.h
    ctx.moveTo(x, foot)
    ctx.lineTo(x, y)
    any = true
  }
  if (!any) return
  ctx.globalAlpha = alpha
  ctx.strokeStyle = colour
  ctx.lineWidth = width
  ctx.lineCap = 'butt'
  ctx.stroke()
  ctx.globalAlpha = 1
}

/** An operator of the diagram: a box with its pitch against the note's in it, a carrier filled and a modulator not. */
function glassBox(
  frame: Pick<DisplayFrame, 'ctx' | 'colours' | 'fontFamily'>,
  x: number,
  y: number,
  w: number,
  h: number,
  words: string,
  carrier: boolean,
  feedback: number,
  level: number,
): void {
  const { ctx, colours } = frame
  if (carrier) fillRect(ctx, { x, y, w, h }, colours.ink, INK.fill)
  // What it feeds back into itself, as a loop on its corner.
  if (feedback > 0.005) {
    ctx.beginPath()
    ctx.arc(x + 1, y + 1, 3.5, Math.PI * 0.5, TAU)
    ctx.globalAlpha = lerp(INK.rule, 1, feedback)
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = lerp(1, 1.75, feedback)
    ctx.stroke()
  }
  ctx.globalAlpha = INK.text
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w) - 1, Math.round(h) - 1)
  ctx.globalAlpha = 1
  text(frame, words, x + w / 2, y + h / 2 + 3, { align: 'center' })
  // Its envelope while a note sounds, along its foot: the carriers' is the loudness, the modulators' the brightness.
  if (level >= DONE)
    fillRect(ctx, { x, y: y + h - 1.5, w: w * Math.min(1, level), h: 2 }, colours.accent)
}

/** A ratio as it is written in a box: no more figures than it has. */
const glassRatioText = (ratio: number): string => String(Math.round(ratio * 100) / 100)

interface GlassParts {
  /** The operators and how they are joined. */
  diagram: Box
  /** A note's loudness and brightness over time. */
  life: Box
  /** The partials the operators make. */
  spectrum: Box
  foot: Box
}

function glassParts(view: Size): GlassParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const foot: Box = { x: all.x, y: all.y + all.h - 7, w: all.w, h: 6 }
  const top = all.y + 11
  const tall = Math.round(clamp((foot.y - top) * 0.44, 12, 40))
  const spectrum: Box = { x: all.x, y: foot.y - 3 - tall, w: all.w, h: tall }
  const wide = Math.round(clamp(all.w * 0.37, 50, 74))
  const room = spectrum.y - 4 - top
  return {
    diagram: { x: all.x, y: top, w: wide, h: room },
    life: { x: all.x + wide + 6, y: top, w: all.w - wide - 6, h: room },
    spectrum,
    foot,
  }
}

const glass = plateDisplay<GlassState>({
  place: 'window',
  columns: 2,
  params: [
    'algorithm',
    'ratio',
    'brightness',
    'decay',
    'attack',
    'release',
    'sustain',
    'detune',
    'feedback',
    'velocity',
    'spread',
  ],
  live: { signal: true, notes: true },
  info: 'The four operators and how they are joined, each with its pitch against the note’s, beside a note’s loudness and, under it, its brightness over time. Below are the partials they make: a played note stands there in its own, and they fall back to the bare tone as its brightness dies.',
  init: () => ({
    wave: new Float32Array(GLASS_POINTS),
    turnRe: new Float32Array(GLASS_POINTS),
    turnIm: new Float32Array(GLASS_POINTS),
    sideRe: new Float32Array(2 * GLASS_SIDEBANDS + 1),
    sideIm: new Float32Array(2 * GLASS_SIDEBANDS + 1),
    waveOf: -1,
    re: new Float32Array(GLASS_COLUMNS),
    im: new Float32Array(GLASS_COLUMNS),
    hard: new Float32Array(GLASS_COLUMNS),
    soft: new Float32Array(GLASS_COLUMNS),
    restAt: new Float64Array(10).fill(-1),
    tuned: { level: 0, indexA: 0, indexB: 0, betaA: 0, betaB: 0, bar: 0 },
    envelopes: { carrier: 0, modA: 0, modB: 0, bar: 0 },
    lit: [],
    knobs: [0, 0, 0],
    memory: [],
    struck: [],
  }),
  draw(frame) {
    const { ctx, colours, state, notes } = frame
    ground(frame)
    const { diagram, life, spectrum, foot } = glassParts(frame)
    const algorithm = clamp(Math.round(frame.value('algorithm')), 0, GLASS_SHAPES.length - 1)
    const brightness = clamp(frame.value('brightness'), 0, 1)
    const set: GlassSet = {
      algorithm,
      ratio: GLASS_RATIOS[clamp(Math.round(frame.value('ratio')), 0, GLASS_RATIOS.length - 1)],
      brightness: brightness * Math.sqrt(brightness),
      feedback: clamp(frame.value('feedback'), 0, 1) * GLASS_MAX_FEEDBACK,
      decay: frame.value('decay'),
      attack: frame.value('attack'),
      release: frame.value('release'),
      sustain: clamp(frame.value('sustain'), 0, 1),
      detune: frame.value('detune'),
      velocity: clamp(frame.value('velocity'), 0, 1),
      spread: clamp(frame.value('spread'), 0, 1),
      sampleRate: frame.sampleRate,
    }
    const shape = GLASS_SHAPES[algorithm]
    const tuned = state.tuned
    const envelopes = state.envelopes

    // Every note under the algorithm, the ratio and the Velocity it was struck under: `struckAs`
    // sets the three as one note of `frame.notes` has them, or back to where the knobs stand.
    state.knobs[GLASS_ALGORITHM_AT] = algorithm
    state.knobs[GLASS_RATIO_AT] = set.ratio
    state.knobs[GLASS_VELOCITY_AT] = set.velocity
    const under = struckUnder(state.memory, frame, state.knobs, state.struck)
    const struckAs = (index: number): void => {
      const knobs = index < 0 ? state.knobs : under[index].knobs
      set.algorithm = knobs[GLASS_ALGORITHM_AT]
      set.ratio = knobs[GLASS_RATIO_AT]
      set.velocity = knobs[GLASS_VELOCITY_AT]
    }

    // The notes that sound: the device lets one go when its loudness has run out.
    const lit = state.lit
    lit.length = 0
    for (let index = 0; index < notes.length; index++) {
      const note = notes[index]
      struckAs(index)
      const level =
        glassEnvelopes(
          set,
          note.frequency,
          note.age,
          note.released,
          glassReleaseSeconds(notes, index, set.release),
          envelopes,
        ).carrier * glassTune(set, note.frequency, note.gain, tuned).level
      if (shareOfDb(gainToDb(level)) >= DONE) lit.push(index)
    }
    struckAs(-1)
    const last = lit.length > 0 ? lit[lit.length - 1] : -1
    const said = last >= 0 ? notes[last] : null
    const hz = said ? said.frequency : GLASS_KEY_HZ

    // --- The operators ---
    // Carriers stand at the right, at the note's pitch; what modulates them stands to their left.
    const wide = Math.min(24, (diagram.w - 9) / 2)
    const tall = Math.min(11, diagram.h / 3 - 1)
    const leftX = diagram.x
    const rightX = diagram.x + diagram.w - wide - 5
    const rowY = (row: number, rows: number): number =>
      diagram.y + ((row + 0.5) * diagram.h) / rows - tall / 2
    const join = (x1: number, y1: number, x2: number, y2: number): void =>
      rule(ctx, x1, y1, x2, y2, { colour: colours.ink, alpha: INK.text })
    const out = (y: number): void =>
      join(rightX + wide, y + tall / 2, diagram.x + diagram.w, y + tall / 2)
    // The operators drawn are the ones the next note gets. The note that sounds runs along
    // their feet only while it was struck in this algorithm: one struck in another has other operators.
    const here = said !== null && under[last].knobs[GLASS_ALGORITHM_AT] === algorithm
    if (said && here)
      glassEnvelopes(
        set,
        hz,
        said.age,
        said.released,
        glassReleaseSeconds(notes, last, set.release),
        envelopes,
      )
    const carrier = here ? envelopes.carrier : 0
    const modA = here ? envelopes.modA : 0
    const modB = here ? envelopes.modB : 0
    const beats = here ? envelopes.bar : 0
    const ratio = glassRatioText(set.ratio)
    const fed = set.feedback / GLASS_MAX_FEEDBACK
    if (algorithm === GLASS_STACK) {
      const middle = rowY(1, 3)
      join(leftX + wide / 2, rowY(0, 3) + tall, leftX + wide / 2, middle)
      join(leftX + wide, middle + tall / 2, rightX, middle + tall / 2)
      glassBox(
        frame,
        leftX,
        rowY(0, 3),
        wide,
        tall,
        glassRatioText(set.ratio * 2),
        false,
        fed,
        modB,
      )
      glassBox(frame, leftX, middle, wide, tall, ratio, false, 0, modA)
      glassBox(frame, rightX, middle, wide, tall, '1', true, 0, carrier)
      glassBox(frame, rightX, rowY(2, 3), wide, tall, '1', true, 0, carrier)
      out(middle)
      out(rowY(2, 3))
    } else if (algorithm === GLASS_MALLET) {
      const middle = rowY(1, 3)
      join(leftX + wide, middle + tall / 2, rightX, rowY(0, 3) + tall / 2)
      join(leftX + wide, middle + tall / 2, rightX, rowY(2, 3) + tall / 2)
      glassBox(frame, leftX, middle, wide, tall, ratio, false, fed, modA)
      glassBox(frame, rightX, rowY(0, 3), wide, tall, '1', true, 0, carrier)
      glassBox(frame, rightX, middle, wide, tall, String(GLASS_BAR_RATIO), true, 0, beats)
      glassBox(frame, rightX, rowY(2, 3), wide, tall, '1', true, 0, carrier)
      for (let row = 0; row < 3; row++) out(rowY(row, 3))
    } else {
      for (let row = 0; row < 2; row++) {
        const y = rowY(row, 2)
        join(leftX + wide, y + tall / 2, rightX, y + tall / 2)
        glassBox(frame, leftX, y, wide, tall, ratio, false, fed, row === 0 ? modA : modB)
        glassBox(frame, rightX, y, wide, tall, '1', true, 0, carrier)
        out(y)
      }
    }

    // --- A note's life ---
    // Its loudness held, from the strike until it has rung out, and its brightness under it:
    // both on a scale of 60 dB, so a decay is a straight line.
    const scale = glassTimeScale(hz)
    const decay = set.decay * scale
    const ring = decay * GLASS_AMP_DECAY
    const span = set.attack + 1.02 * Math.max(ring, set.release)
    const yOf = (level: number): number => life.y + (1 - shareOfDb(gainToDb(level))) * life.h
    const xOf = (seconds: number): number => life.x + clamp(seconds / span, 0, 1) * life.w
    const modAttack = Math.max(0.001, set.attack * shape.attack)
    const floor = shape.floor * set.sustain
    // `FmGlass::process`: each half leans to its own side by Spread, so one speaker has all of
    // one and so much of the other, and they beat in it as deep as the two are alike.
    const lean = (1 - set.spread) * 0.125 * TAU
    const own = Math.cos(lean)
    const other = Math.sin(lean) * shape.levelB
    const beat = glassBeatHz(hz, set.detune)
    const beaten = (seconds: number): number =>
      Math.sqrt(own * own + other * other + 2 * own * other * Math.cos(TAU * beat * seconds)) /
      (own + other)
    const steps = Math.max(8, Math.round(life.w))
    const base = life.y + life.h
    ctx.beginPath()
    ctx.moveTo(life.x, base)
    for (let step = 0; step <= steps; step++) {
      const seconds = (step / steps) * span
      ctx.lineTo(
        life.x + (step / steps) * life.w,
        yOf(adsrHeld(seconds, modAttack, decay * shape.decayA, floor)),
      )
    }
    ctx.lineTo(life.x + life.w, base)
    ctx.closePath()
    ctx.globalAlpha = INK.fill
    ctx.fillStyle = colours.ink
    ctx.fill()
    ctx.globalAlpha = 1
    // Let go at the top of its attack, it dies in Release: the dashed line.
    ctx.beginPath()
    for (let step = 0; step <= steps; step++) {
      const seconds = (step / steps) * span
      if (seconds < set.attack) continue
      const y = yOf(fall(seconds - set.attack, set.release))
      if (seconds - set.attack < span / steps) ctx.moveTo(xOf(set.attack), life.y)
      ctx.lineTo(life.x + (step / steps) * life.w, y)
    }
    ctx.setLineDash([2, 2])
    ctx.globalAlpha = INK.back
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.setLineDash([])
    // Where the beats are too close to draw, the loudness is drawn at their top.
    const drawn = beat * span <= life.w / 4
    ctx.beginPath()
    for (let step = 0; step <= steps; step++) {
      const seconds = (step / steps) * span
      const level = adsrHeld(seconds, set.attack, ring, set.sustain) * (drawn ? beaten(seconds) : 1)
      const x = life.x + (step / steps) * life.w
      if (step === 0) ctx.moveTo(x, yOf(level))
      else ctx.lineTo(x, yOf(level))
    }
    ctx.globalAlpha = 1
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.stroke()
    rule(ctx, life.x, base, life.x + life.w, base, { colour: colours.ink, alpha: INK.rule })

    // --- The partials ---
    freqGrid(frame, spectrum, GLASS_LOW_HZ, GLASS_HIGH_HZ)
    rule(
      ctx,
      spectrum.x,
      spectrum.y + spectrum.h,
      spectrum.x + spectrum.w,
      spectrum.y + spectrum.h,
      {
        colour: colours.ink,
        alpha: INK.rule,
      },
    )
    const whole = own + other
    // Middle C at its brightest: each partial is thick as far up as a soft touch brings it and
    // thin from there to where a hard one does. Both stand until a knob moves, so they are
    // worked out only then.
    const restAt = state.restAt
    if (
      restAt[0] !== algorithm ||
      restAt[1] !== set.ratio ||
      restAt[2] !== brightness ||
      restAt[3] !== set.feedback ||
      restAt[4] !== set.detune ||
      restAt[5] !== set.velocity ||
      restAt[6] !== set.sampleRate ||
      restAt[7] !== spectrum.x ||
      restAt[8] !== spectrum.w ||
      restAt[9] !== set.spread
    ) {
      restAt[0] = algorithm
      restAt[1] = set.ratio
      restAt[2] = brightness
      restAt[3] = set.feedback
      restAt[4] = set.detune
      restAt[5] = set.velocity
      restAt[6] = set.sampleRate
      restAt[7] = spectrum.x
      restAt[8] = spectrum.w
      restAt[9] = set.spread
      envelopes.carrier = 1
      envelopes.modA = 1
      envelopes.modB = 1
      envelopes.bar = 1
      glassTune(set, GLASS_KEY_HZ, 1, tuned)
      glassSpray(state, set, spectrum, GLASS_KEY_HZ, tuned, envelopes, 0)
      glassLevels(state, spectrum, state.hard)
      glassTune(set, GLASS_KEY_HZ, GLASS_SOFT, tuned)
      glassSpray(state, set, spectrum, GLASS_KEY_HZ, tuned, envelopes, 0)
      glassLevels(state, spectrum, state.soft)
    }
    glassStems(frame, state.soft, spectrum, whole, colours.ink, INK.back, 3)
    glassStems(frame, state.hard, spectrum, whole, colours.ink, INK.text, 1)

    // The notes that sound, each in the partials it has now, and each as a point on its way through its life.
    for (let at = Math.max(0, lit.length - GLASS_LIT_MOST); at < lit.length; at++) {
      const note = notes[lit[at]]
      struckAs(lit[at])
      glassEnvelopes(
        set,
        note.frequency,
        note.age,
        note.released,
        glassReleaseSeconds(notes, lit[at], set.release),
        envelopes,
      )
      glassTune(set, note.frequency, note.gain, tuned)
      glassSpray(state, set, spectrum, note.frequency, tuned, envelopes, note.age)
      glassLevels(state, spectrum, state.re)
      glassStems(frame, state.re, spectrum, whole, colours.accent, 1, 1.5)
      // Its second half is as loud beside the first as its own algorithm makes it.
      const half = Math.sin(lean) * GLASS_SHAPES[set.algorithm].levelB
      const beating =
        Math.sqrt(
          own * own +
            half * half +
            2 * own * half * Math.cos(TAU * glassBeatHz(note.frequency, set.detune) * note.age),
        ) /
        (own + half)
      // A lower note lives longer than the one the line is drawn for: its time since the attack
      // is drawn as much shorter as its life is longer, so every point moves along the one line.
      const lived =
        Math.min(note.age, set.attack) +
        (Math.max(0, note.age - set.attack) * scale) / glassTimeScale(note.frequency)
      dot(ctx, xOf(lived), yOf(envelopes.carrier * tuned.level * beating), 1.75, colours.accent)
    }
    struckAs(-1)

    levelFoot(frame, foot, outShare(frame))

    // The words: the algorithm, and how long the note rings held. With Sustain it does not ring
    // out while its key is down, and no time is said.
    const holds = shareOfDb(gainToDb(set.sustain)) >= DONE
    text(frame, GLASS_NAMES[algorithm], diagram.x, diagram.y - 4)
    text(
      frame,
      `${pitchName(hz)} ${holds ? 'held' : secondsText(ring)}`,
      life.x + life.w,
      diagram.y - 4,
      { align: 'right' },
    )
  },
})

export const KEYS_INSTRUMENT_FACES: Readonly<Record<string, PlateFace>> = {
  'felt-piano': {
    display: felt,
    face: ['felt', 'hardness', 'damper', 'reverbMix'],
    sections: [
      ['felt', 'hardness', 'detune', 'stiffness'],
      ['thump', 'action', 'pedalNoise', 'grit'],
      ['resonance', 'damper'],
      ['sustain', 'sostenuto', 'soft'],
      ['reverbMix', 'reverbSize', 'width', 'outputDb'],
      ['polyphony'],
    ],
  },
  'tine-piano': { display: tine, face: ['bark', 'bell', 'tremolo', 'tone'] },
  'fm-glass': { display: glass, face: ['algorithm', 'ratio', 'brightness', 'decay'] },
}
