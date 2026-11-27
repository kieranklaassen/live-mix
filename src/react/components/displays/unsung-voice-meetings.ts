// The arithmetic of Unsung Voice that its display draws, as the device has it
// (`cpp/devices/unsung-voice/meetings.h`; the names are its own): where the
// overtones of the held keys meet, and how likely the line goes from one of
// those meetings to another. How loud they are is in `unsung-voice-bodies.ts`.

import { clamp } from '../display-kit'

/** One overtone in a meeting: whose it is (an index into the keys), which it is, where it is by itself. */
export interface UnsungPart {
  key: number
  /** 0 is the partner's, which no key sings. */
  harmonic: number
  hz: number
}

/** A pitch where overtones of different keys meet. */
export interface UnsungMeeting {
  hz: number
  weight: number
  parts: readonly UnsungPart[]
}

/** `kMost` and the keys there are. */
const MOST = 12
export const UNSUNG_KEYS = 12
/** The register is the ceiling and the two octaves under it. */
export const UNSUNG_FLOOR = 0.25

interface Overtone extends UnsungPart {
  weight: number
  plain: number
  of: number
}

/** `partner_ratio`: what Partner is above its key, by semitones. */
export const UNSUNG_PARTNERS: readonly number[] = [
  0,
  16 / 15,
  9 / 8,
  6 / 5,
  5 / 4,
  4 / 3,
  7 / 5,
  3 / 2,
  8 / 5,
  5 / 3,
  7 / 4,
  15 / 8,
  2,
]

const near = (a: number, b: number): boolean => b > 0 && a < b * 1.03 && b < a * 1.03

/** `plain`: an octave, a fifth or a third of its key weighs more than one that is none of them. */
function plainness(k: number): number {
  while (k % 2 === 0) k /= 2
  return k <= 5 ? 1 : k === 7 ? 0.7 : 2.4 / k
}

/** `search`: the meetings between two pitches, by pitch. */
function search(
  keys: readonly number[],
  tolerance: number,
  low: number,
  high: number,
  partner: number,
): UnsungMeeting[] {
  const row: Overtone[] = []
  const add = (hz: number, of: number, key: number, heard: boolean, loud: number): void => {
    for (let k = heard ? 2 : 1; k <= 24 && hz * k <= high; k += 1)
      if (hz * k >= low)
        row.push({
          hz: hz * k,
          key,
          harmonic: heard ? k : 0,
          of,
          weight: loud / Math.sqrt(heard ? k : k + 1),
          plain: heard ? plainness(k) : 1,
        })
  }
  const lowest = keys.indexOf(Math.min(...keys))
  const ratio = UNSUNG_PARTNERS[clamp(Math.trunc(partner + 0.5), 0, 12)]
  keys.forEach((hz, i) => add(hz, i, i, true, 1))
  if (ratio > 0)
    keys.forEach((hz, i) => add(hz * ratio, MOST + i, i, false, i === lowest ? 0.8 : 0.4))
  row.sort((a, b) => a.hz - b.hz)
  const reach = Math.pow(2, tolerance / 1200)
  const list: UnsungMeeting[] = []
  for (let i = 0; i < row.length;) {
    let end = i + 1
    while (end < row.length && row[end].hz <= row[i].hz * reach) end += 1
    const meeting = gather(row.slice(i, end), tolerance)
    const heard = meeting.parts.some((part) => part.harmonic > 0)
    const sung = keys.some((hz) => near(meeting.hz, hz))
    if (meeting.parts.length > 1 && heard && !sung) {
      keep(list, meeting)
      i = end
    } else i += 1
  }
  return list
}

/** `gather`: one meeting out of overtones that stand close, three of different keys at most. */
function gather(row: readonly Overtone[], tolerance: number): UnsungMeeting {
  const parts: Overtone[] = []
  for (const each of row)
    if (parts.length < 3 && !parts.some((part) => part.of === each.of)) parts.push(each)
  const sum = parts.reduce((total, part) => total + part.weight, 0)
  const pitch = parts.reduce((total, part) => total + part.weight * Math.log2(part.hz), 0)
  const cents = 1200 * Math.log2(parts[parts.length - 1].hz / parts[0].hz)
  const off = (cents - 0.75 * tolerance) / (0.45 * tolerance)
  const strange = Math.min(...parts.map((part) => part.plain))
  return {
    hz: Math.pow(2, pitch / sum),
    weight: sum * strange * (0.22 + 2 / (1 + off * off)),
    parts: parts.map(({ key, harmonic, hz }) => ({ key, harmonic, hz })),
  }
}

/** `keep`: two a hair apart are one, and when the list is full the weakest goes. */
function keep(list: UnsungMeeting[], meeting: UnsungMeeting): void {
  const last = list.at(-1)
  if (last && meeting.hz < last.hz * 1.02) {
    if (meeting.weight > last.weight) list[list.length - 1] = meeting
    return
  }
  if (list.length === MOST) {
    const weakest = list.reduce((at, each, i) => (each.weight < list[at].weight ? i : at), 0)
    if (list[weakest].weight >= meeting.weight) return
    list.splice(weakest, 1)
  }
  list.push(meeting)
}

/** `Meetings::find`: where the overtones of these keys meet, from low to high. */
export function unsungMeetings(
  keys: readonly number[],
  tolerance: number,
  ceiling: number,
  partner: number,
): UnsungMeeting[] {
  const own = keys.filter(
    (hz, i) => !keys.slice(0, i).some((each) => Math.abs(each - hz) < 4e-3 * hz),
  )
  if (own.length === 0) return []
  const seen = own.map((hz) => keys.indexOf(hz))
  let list = search(own, tolerance, ceiling * UNSUNG_FLOOR, ceiling, partner)
  if (list.length === 0 && partner >= 0.5)
    list = search(own, tolerance, ceiling * UNSUNG_FLOOR, Math.max(ceiling, 2600), 12)
  if (list.length === 0)
    list = search(own, tolerance, ceiling, 4200, partner >= 0.5 ? 12 : 0).slice(0, 1)
  return list.map((each) => ({
    ...each,
    parts: each.parts.map((part) => ({ ...part, key: seen[part.key] })),
  }))
}

/** `Meetings::first`: the meeting a line begins on, -1 for none; `other` is where the other line stands. */
export function unsungFirst(list: readonly UnsungMeeting[], lean: number, other = 0): number {
  let best = -1
  let most = -1
  list.forEach((meeting, i) => {
    if (near(meeting.hz, other) && list.length > 1) return
    const place = list.length > 1 ? i / (list.length - 1) : 0.5
    const off = place - 0.5 + 0.5 * lean
    const weight = meeting.weight / (0.06 + off * off)
    if (weight > most) [best, most] = [i, weight]
  })
  return best
}

/** `Meetings::next`: how likely the line goes from `hz` to each meeting; `other` is where the other line stands. */
export function unsungOdds(
  list: readonly UnsungMeeting[],
  hz: number,
  other: number,
  lean: number,
): number[] {
  const odds = list.map(() => 0)
  const side = (up: boolean): number[] =>
    (up ? list.map((_, i) => i) : list.map((_, i) => list.length - 1 - i))
      .filter((i) => (up ? list[i].hz > hz * 1.03 : list[i].hz * 1.03 < hz))
      .filter((i) => !near(list[i].hz, other))
      .slice(0, 3)
  const give = (up: boolean, share: number): void => {
    if (share <= 0) return
    let found = side(up)
    const end = up ? 0 : list.length - 1
    if (found.length === 0 && Math.abs(lean) > 0.6 && list.length > 2) {
      if (!near(list[end].hz, other) && !near(list[end].hz, hz)) {
        odds[end] += share
        return
      }
    }
    if (found.length === 0) found = side(!up)
    const weights = found.map((i, n) => list[i].weight / (1 + n))
    const total = weights.reduce((sum, each) => sum + each, 0)
    found.forEach((i, n) => (odds[i] += (share * weights[n]) / total))
  }
  const up = clamp(0.5 + 0.5 * lean, 0, 1)
  give(true, up)
  give(false, 1 - up)
  return odds
}

/** The meeting a pitch stands on, if it stands on one. */
export const unsungAt = (list: readonly UnsungMeeting[], hz: number): UnsungMeeting | undefined =>
  list.find((each) => Math.abs(each.hz / hz - 1) < 4e-3)
