// The words of the beat and breath devices. None of their text names a state
// of mind or of health, or promises one: a device says what is heard and
// leaves what it is for to the listener. The list below is the floor of that
// rule, not the whole of it. The same file holds what the family says about
// ears and speakers: a device that opens with its tones apart says "On
// headphones" first, and every Ears, Width and Offset says what speakers or a
// mono fold make of it.

import { describe, expect, it } from 'vitest'

import { FACTORY_CHAINS, FACTORY_PRESETS } from '../../dsp/factory'
import { STOCK_WASM_DEVICES } from '../../dsp/registry'
import { DEVICE_SKINS } from '../components/device-skins'
import { PLATE_FACES } from '../components/displays'
import { runDisplay, drawDisplay, testNotes, testSignal, viewOf } from './display-harness'

const FAMILY = [
  'binaural',
  'isochronic',
  'coloured-noise',
  'breath-pacer',
  'still-point',
  'twin-bars',
  'ear-shift',
  'band-pulse',
  'winding-down',
] as const

/** No word of the family's text begins with one of these. */
const STEMS = [
  'sleep',
  'focus',
  'heal',
  'therap',
  'cure',
  'anxi',
  'stress',
  'entrain',
  'brain',
  'mind',
  'meditat',
  'hypno',
  'relax',
  'calm',
  'dream',
  'trance',
  'drows',
  'sooth',
  'lull',
  'seren',
  'tranquil',
  'peace',
  'mood',
  'wellness',
  'wellbeing',
  'alert',
  'concentrat',
  'insomn',
  'treat',
  'medic',
  'delta',
  'theta',
  'alpha',
  'beta',
  'gamma',
]

const BANNED = new RegExp(`\\b(?:${STEMS.join('|')})`, 'i')

/** The first banned word in `text`, or null. */
export function bannedWord(text: string): string | null {
  const found = BANNED.exec(text)
  if (!found) return null
  const rest = /^[\p{L}]*/u.exec(text.slice(found.index))
  return rest ? rest[0] : found[0]
}

const deviceOf = (id: string) => STOCK_WASM_DEVICES.find((device) => device.id === id)
const paramsOf = (id: string) => Object.entries(deviceOf(id)?.params ?? {})

interface Line {
  at: string
  text: string
}

/** Everything a device says of itself: its name, its sentence, its knobs, its choices and its presets. */
function deviceLines(id: string): Line[] {
  const device = deviceOf(id)
  if (!device) return []
  const lines: Line[] = [
    { at: `${id}: name`, text: device.name },
    { at: `${id}: description`, text: device.description ?? '' },
  ]
  for (const [key, spec] of paramsOf(id)) {
    lines.push({ at: `${id}.${key}: name`, text: spec.name ?? key })
    lines.push({ at: `${id}.${key}: description`, text: spec.description ?? '' })
    if (spec.unit) lines.push({ at: `${id}.${key}: unit`, text: spec.unit })
    for (const choice of spec.choices ?? [])
      lines.push({ at: `${id}.${key}: choice`, text: choice })
  }
  for (const [key, meter] of Object.entries(device.meters ?? {}))
    lines.push({ at: `${id}: meter ${key}`, text: meter.name ?? key })
  for (const name of Object.keys(device.presets ?? {}))
    lines.push({ at: `${id}: preset`, text: name })
  return lines
}

/** The bank's presets and chains that hold a device of the family. */
function bankLines(): Line[] {
  const family = new Set<string>(FAMILY)
  const lines: Line[] = []
  for (const patch of [...FACTORY_PRESETS, ...FACTORY_CHAINS]) {
    const devices = [...(patch.instrument ? [patch.instrument] : []), ...patch.effects]
    if (!devices.some((device) => family.has(device.deviceId))) continue
    lines.push({ at: `bank ${patch.id}: id`, text: patch.id.replace(/-/g, ' ') })
    lines.push({ at: `bank ${patch.id}: name`, text: patch.name })
    lines.push({ at: `bank ${patch.id}: description`, text: patch.description })
  }
  return lines
}

/** What a plate says: the skin's name and labels, the face's labels, and what its display says and writes. */
function plateLines(id: string): Line[] {
  const lines: Line[] = []
  const skin = DEVICE_SKINS[id]
  if (skin?.name) lines.push({ at: `${id}: skin name`, text: skin.name })
  for (const [key, label] of Object.entries(skin?.labels ?? {}))
    lines.push({ at: `${id}: skin label ${key}`, text: label })
  const face = PLATE_FACES[id]
  if (!face) return lines
  for (const [key, label] of Object.entries(face.labels ?? {}))
    lines.push({ at: `${id}: face label ${key}`, text: label })
  const display = face.display
  lines.push({ at: `${id}: display info`, text: display.info })

  const params = Object.fromEntries(paramsOf(id))
  const meters = Object.fromEntries(
    Object.keys(deviceOf(id)?.meters ?? {}).map((name) => [name, 0.5]),
  )
  const written = (words: readonly string[], when: string) => {
    for (const word of words) lines.push({ at: `${id}: display ${when}`, text: word })
  }
  // At rest, and running for two seconds with sound, keys and readings.
  written(drawDisplay(display, params).words(), 'at rest')
  const running = { meters, signal: testSignal(), notes: testNotes() }
  written(runDisplay(display, params, 2, running).words(), 'running')
  // At each end of every knob, and at each choice, so a word that only one setting writes is read too.
  for (const [key, spec] of Object.entries(params)) {
    const ends = spec.choices ? spec.choices.map((_, n) => n) : [spec.min, spec.max]
    for (const value of ends)
      written(
        drawDisplay(display, params, { ...running, values: { [key]: value } }).words(),
        `at ${key} ${value}`,
      )
  }
  for (const handle of display.handles?.(viewOf(display, params)) ?? [])
    lines.push({ at: `${id}: handle ${handle.key}`, text: handle.name })
  return lines
}

describe('the words of the beat and breath devices', () => {
  it('finds a banned word at the start of a word and nowhere else', () => {
    expect(bannedWord('Good for focus at a desk')).toBe('focus')
    expect(bannedWord('theta')).toBe('theta')
    expect(bannedWord('A calming hall')).toBe('calming')
    expect(bannedWord('Sleepy')).toBe('Sleepy')
    // Inside a word, or a word that only looks alike, is no fault.
    expect(bannedWord('A better hall, treble cut, remind')).toBeNull()
    expect(bannedWord('Stop if you feel light-headed.')).toBeNull()
  })

  it('has all nine devices', () => {
    expect(FAMILY.filter((id) => !deviceOf(id))).toEqual([])
  })

  it('has a plate, a display and bank entries for each', () => {
    const family = new Set<string>(FAMILY)
    const inBank = new Set<string>()
    for (const patch of [...FACTORY_PRESETS, ...FACTORY_CHAINS])
      for (const device of [...(patch.instrument ? [patch.instrument] : []), ...patch.effects])
        if (family.has(device.deviceId)) inBank.add(device.deviceId)
    expect(FAMILY.filter((id) => !DEVICE_SKINS[id])).toEqual([])
    expect(FAMILY.filter((id) => !PLATE_FACES[id])).toEqual([])
    expect(FAMILY.filter((id) => !inBank.has(id))).toEqual([])
  })

  it('names no state of mind or of health anywhere', () => {
    const lines = [...FAMILY.flatMap(deviceLines), ...bankLines(), ...FAMILY.flatMap(plateLines)]
    // Enough was read for the check to mean something.
    expect(lines.length).toBeGreaterThan(900)
    const faults = lines
      .map((line) => ({ ...line, word: bannedWord(line.text) }))
      .filter((line) => line.word !== null)
      .map((line) => `${line.at}: "${line.word}" in "${line.text}"`)
    expect(faults).toEqual([])
  })

  it('opens with "On headphones" where the tones start apart', () => {
    const faults: string[] = []
    for (const id of FAMILY) {
      const ears = paramsOf(id).find(([key]) => key === 'ears')?.[1]
      if (!ears || ears.default <= 0) continue
      if (!(deviceOf(id)?.description ?? '').startsWith('On headphones'))
        faults.push(
          `${id}: Ears starts at ${ears.default} and the description does not open with it`,
        )
    }
    expect(faults).toEqual([])
  })

  it('says at every Ears, Width and Offset what speakers or a mono fold give', () => {
    const faults: string[] = []
    let read = 0
    for (const id of FAMILY) {
      for (const [key, spec] of paramsOf(id)) {
        if (key !== 'ears' && key !== 'width' && key !== 'offset') continue
        read++
        const text = spec.description ?? ''
        if (!/\b(?:speakers?|mono)\b/i.test(text))
          faults.push(`${id}.${key}: nothing on speakers or mono`)
        // Half a turn apart at half Duty, the two sides add to no pulse at all.
        if (key === 'offset' && !(/\b180\b/.test(text) && /\bmono\b/i.test(text)))
          faults.push(`${id}.${key}: does not say what 180 gives in mono`)
      }
    }
    expect(read).toBeGreaterThanOrEqual(8)
    expect(faults).toEqual([])
  })
})
