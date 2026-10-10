// The truth of the bowed instruments' displays: a note's level comes and goes
// as the device's own figures say, it is lit for as long as the device lets
// it sound, and what a knob does to a note that is played shows on it.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  BOWED_INSTRUMENT_FACES,
  adsrRise,
  bowBeatHz,
  bowOctaveShare,
  bowPartialSeconds,
  bowRingSeconds,
  bowSlope,
  bowStrength,
  bowStringDb,
  bowSwell,
  bowVibratoCents,
  chamberHiss,
  chamberNoteLevel,
  chamberPlayerLevel,
  chamberRise,
  chamberSeats,
  chamberSpreadCents,
  chamberStagger,
  chamberVelocity,
  chamberVibratoOnset,
  machineChorusMs,
  machineDriftCents,
  machineKeyDb,
  machineKeyGain,
  machineToneDb,
} from '../components/displays/instrument-bowed'
import { type DisplayNote, type PlateDisplay } from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  patchUnder,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type DrawnPath,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()
const paramsOf = (id: string) => stock.get(id)?.params ?? {}
const { accent } = PLAIN_COLOURS

const note = (frequency: number, age: number, released: number | null = null): DisplayNote => ({
  id: Math.round(frequency),
  frequency,
  gain: 1,
  age,
  released,
})
const accents = (paths: DrawnPath[]): DrawnPath[] =>
  paths.filter((path) => path.kind === 'stroke' && path.colour === accent)
/** The parts that are lit: a string, a player's string, a rank. Each is a line of many points. */
const lights = (paths: DrawnPath[]): DrawnPath[] =>
  accents(paths).filter((path) => path.points.length > 2)
/** The notes on the life: each a post straight up from the floor. */
const posts = (paths: DrawnPath[]): DrawnPath[] =>
  accents(paths).filter(
    (path) => path.points.length === 2 && path.points[0][0] === path.points[1][0],
  )
/** The lines in the accent that are neither: a bow across a string. */
const bows = (paths: DrawnPath[]): DrawnPath[] =>
  accents(paths).filter(
    (path) => path.points.length === 2 && path.points[0][0] !== path.points[1][0],
  )
const tall = (path: DrawnPath): number => {
  const ys = path.points.map(([, y]) => y)
  return Math.max(...ys) - Math.min(...ys)
}
const wide = (path: DrawnPath): number => {
  const xs = path.points.map(([x]) => x)
  return Math.max(...xs) - Math.min(...xs)
}
const drawer = (display: PlateDisplay, id: string) => {
  const params = paramsOf(id)
  return (values: Record<string, number>, notes: DisplayNote[]) =>
    drawnPaths(runDisplay(display, params, 0.1, { values, notes, signal: testSignal() }))
}
/** The seconds at which a rising level passes `level`, by halving. */
const timeAt = (level: number, rise: (seconds: number) => number, most: number): number => {
  let low = 0
  let high = most
  for (let n = 0; n < 60; n++) {
    const middle = (low + high) / 2
    if (rise(middle) < level) low = middle
    else high = middle
  }
  return (low + high) / 2
}

/** Where among a drawing's calls the last post is stroked, and where `words` are set. */
const postThenWords = (drawn: RecordingContext, words: string): { post: number; words: number } => {
  const at = { post: -1, words: -1 }
  let stroke = ''
  let points: (readonly unknown[])[] = []
  drawn.calls.forEach((call, index) => {
    if (call.name === 'beginPath') points = []
    else if (call.name === 'moveTo' || call.name === 'lineTo') points.push(call.args)
    else if (call.name === 'set strokeStyle') stroke = String(call.args[0])
    else if (call.name === 'fillText' && call.args[0] === words) at.words = index
    else if (
      call.name === 'stroke' &&
      stroke === accent &&
      points.length === 2 &&
      points[0][0] === points[1][0]
    )
      at.post = index
  })
  return at
}

describe('the scale of a note’s life', () => {
  it('sets its words over the posts, which pass them as a held note ages', () => {
    // A note held for 0.9 s stands right by the line at one second, where "1 s" is said.
    for (const id of ['bowed-string', 'chamber-strings', 'string-machine']) {
      const { display } = BOWED_INSTRUMENT_FACES[id]
      for (const width of [204, 128]) {
        const drawn = runDisplay(display, paramsOf(id), 0.1, {
          notes: [note(220, 0.9), note(330, 0.6)],
          signal: testSignal(),
          width,
        })
        const at = postThenWords(drawn, '1 s')
        expect(at.post).toBeGreaterThan(-1)
        expect(at.words).toBeGreaterThan(at.post)
        // The words stand on a patch of the plate, so the post does not show through the letters.
        expect(patchUnder(drawn, '1 s', PLAIN_COLOURS.plate)).not.toBeNull()
      }
    }
  })
})

describe('the envelope the kit’s instruments share', () => {
  it('rises as `Adsr::next` does: towards 1.3, cut off at 1 after the attack', () => {
    expect(adsrRise(0, 2)).toBe(0)
    expect(adsrRise(1, 2)).toBeCloseTo(1.3 * (1 - Math.sqrt(0.3 / 1.3)), 6)
    expect(adsrRise(2, 2)).toBeCloseTo(1, 6)
    expect(adsrRise(9, 2)).toBe(1)
    // An attack under a sample is there at once.
    expect(adsrRise(0, 0)).toBe(1)
  })
})

describe('the Bow’s figures', () => {
  it('take the strength of a stroke from the note’s gain as `BowedString::start` does', () => {
    expect(bowStrength(0)).toBeCloseTo(0.3, 6)
    expect(bowStrength(1)).toBeCloseTo(1, 6)
  })

  it('ring for Decay while held and for the shorter of Decay and Release after', () => {
    // `BowedString::ring_time`.
    expect(bowRingSeconds(6, 2, false)).toBe(6)
    expect(bowRingSeconds(6, 2, true)).toBe(2)
    expect(bowRingSeconds(0.3, 2, true)).toBe(0.3)
  })

  it('swell a plucked string over Attack less its least, and bloom a driven one over Attack', () => {
    // `BowedString::set_envelope`: at the shortest Attack a pluck has no swell.
    expect(bowSwell(0, 0, 0.005)).toBe(1)
    expect(bowSwell(0, 0.4975, 1)).toBeCloseTo(adsrRise(0.5, 1), 2)
    expect(bowSwell(0, 0.995, 1)).toBeCloseTo(1, 6)
    expect(bowSwell(1, 0, 0.005)).toBe(0)
    expect(bowSwell(2, 1.2, 1.2)).toBeCloseTo(1, 6)
    expect(bowSwell(2, 0.6, 1.2)).toBeCloseTo(1.3 * (1 - Math.sqrt(0.3 / 1.3)), 6)
  })

  it('let a plucked string fall 60 dB over Decay from the pick on, faster from the key up', () => {
    expect(bowStringDb(0, 3, null, 1, 0.005, 6, 2)).toBeCloseTo(-30, 5)
    // Two seconds held, one let go: a third of Decay and half of Release.
    expect(bowStringDb(0, 3, 1, 1, 0.005, 6, 2)).toBeCloseTo(-20 - 30, 5)
    // Release never makes a string ring longer than Decay.
    expect(bowStringDb(0, 3, 1, 1, 0.005, 6, 15)).toBeCloseTo(-30, 5)
    expect(bowStringDb(0, 3, null, 0.5, 0.005, 6, 2)).toBeCloseTo(-30 + 20 * Math.log10(0.65), 3)
  })

  it('hold a driven string where its attack has come to, and let it ring out from the key up', () => {
    for (const mode of [1, 2]) {
      expect(bowStringDb(mode, 25, null, 1, 1.2, 6, 2)).toBeCloseTo(0, 5)
      expect(bowStringDb(mode, 0.6, null, 1, 1.2, 6, 2)).toBeCloseTo(
        20 * Math.log10(adsrRise(0.6, 1.2)),
        5,
      )
      expect(bowStringDb(mode, 9, 1, 1, 1.2, 6, 2)).toBeCloseTo(-30, 5)
      // Let go half way up the bloom, it rings out from there.
      expect(bowStringDb(mode, 1.6, 1, 1, 1.2, 6, 2)).toBeCloseTo(
        20 * Math.log10(adsrRise(0.6, 1.2)) - 30,
        5,
      )
    }
  })

  it('let the partial near 2.5 kHz ring for what Brightness says, beside the fundamental', () => {
    // `BowedString::shape`: 0.08 s at Brightness 0 to 30 s at 1 from the bridge alone; with the
    // string's own loss the two rates add, less the little the loop gain gives back.
    for (const brightness of [0, 0.25, 0.5, 0.75, 1]) {
      const bright = 0.08 * Math.pow(30 / 0.08, brightness)
      const both = 1 / (1 / 6 + 1 / bright)
      const partial = bowPartialSeconds(220, 6, brightness)
      expect(partial).toBeGreaterThan(both * 0.98)
      expect(partial).toBeLessThan(both * 1.05)
      expect(partial).toBeLessThanOrEqual(6)
    }
    expect(bowPartialSeconds(220, 6, 0.8)).toBeGreaterThan(bowPartialSeconds(220, 6, 0.3))
    expect(bowPartialSeconds(220, 2, 0.8)).toBeLessThan(bowPartialSeconds(220, 6, 0.8))
  })

  it('waver from a moment after the note, as `BowedString::tune` does', () => {
    // Silent for 0.3 s, in over 0.6 s, 40 cents at a Vibrato of 1; it starts with the note.
    expect(bowVibratoCents(0.25, 1, 5)).toBe(0)
    expect(bowVibratoCents(0.65, 1, 5)).toBeCloseTo((40 * 0.35) / 0.6, 5)
    expect(bowVibratoCents(1.05, 1, 5)).toBeCloseTo(40, 5)
    expect(bowVibratoCents(1.05, 0.25, 5)).toBeCloseTo(10, 5)
    expect(bowVibratoCents(1.15, 1, 5)).toBeCloseTo(-40, 5)
  })

  it('hand a sustained string’s level to the octave and sharpen a bowed one with Pressure', () => {
    expect(bowOctaveShare(0)).toBe(0)
    expect(bowOctaveShare(1)).toBeCloseTo(0.85, 6)
    expect(bowOctaveShare(0.5)).toBeCloseTo(0.2125, 6)
    expect(bowSlope(0)).toBeCloseTo(1.9, 6)
    expect(bowSlope(1)).toBeCloseTo(0.85, 6)
  })

  it('beat a note’s two strings at the difference of their pitches', () => {
    // Half of Detune down and half up.
    expect(bowBeatHz(220, 6)).toBeCloseTo(220 * (Math.pow(2, 3 / 1200) - Math.pow(2, -3 / 1200)), 6)
    expect(bowBeatHz(220, 0)).toBe(0)
  })
})

describe('the Bow’s display', () => {
  const { display } = BOWED_INSTRUMENT_FACES['bowed-string']
  const params = paramsOf('bowed-string')
  const run = drawer(display, 'bowed-string')

  it('lights nothing at rest', () => {
    expect(accents(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    for (const mode of [0, 1, 2]) expect(accents(run({ mode }, []))).toHaveLength(0)
  })

  it('lights a string for a note, two where Detune gives it two, and stands it on the life', () => {
    for (const mode of [0, 1, 2]) {
      expect(lights(run({ mode, detune: 0 }, [note(220, 0.5)]))).toHaveLength(1)
      expect(lights(run({ mode, detune: 6 }, [note(220, 0.5)]))).toHaveLength(2)
      expect(lights(run({ mode, detune: 0 }, [note(220, 0.5), note(330, 0.5)]))).toHaveLength(2)
      expect(posts(run({ mode }, [note(220, 0.5), note(330, 0.5)]))).toHaveLength(2)
    }
  })

  it('lets a plucked string’s post sink as it dies, and puts it out when it has', () => {
    const values = { mode: 0, attack: 0.005, decay: 6 }
    const early = posts(run(values, [note(220, 0.6)]))[0]
    const late = posts(run(values, [note(220, 4.2)]))[0]
    expect(tall(late)).toBeLessThan(tall(early) * 0.5)
    expect(lights(run(values, [note(220, 6.1)]))).toHaveLength(0)
    expect(posts(run(values, [note(220, 6.1)]))).toHaveLength(0)
  })

  it('keeps a driven string lit for as long as its key is held', () => {
    for (const mode of [1, 2]) {
      expect(lights(run({ mode, detune: 0 }, [note(220, 19)]))).toHaveLength(1)
      expect(posts(run({ mode }, [note(220, 19)]))).toHaveLength(1)
    }
  })

  it('puts a string out when it has rung for the shorter of Decay and Release from the key up', () => {
    for (const mode of [0, 1, 2]) {
      const let_go = [note(220, 2.5, 1.5)]
      expect(lights(run({ mode, detune: 0, decay: 20, release: 4 }, let_go))).toHaveLength(1)
      expect(lights(run({ mode, detune: 0, decay: 20, release: 1.4 }, let_go))).toHaveLength(0)
      // A long Release does not outlast a short Decay.
      expect(lights(run({ mode, detune: 0, decay: 1.4, release: 15 }, let_go))).toHaveLength(0)
    }
  })

  it('keeps a sounding note in the Mode and with the strings it was struck with', () => {
    // `BowedString::start` reads Mode and Detune once: moving them changes the next note, not this.
    const after = (
      before: Record<string, number>,
      then: Record<string, number>,
      notes: DisplayNote[],
    ) =>
      drawnPaths(
        runDisplay(
          display,
          params,
          0.2,
          { values: before, notes, signal: testSignal() },
          (time) => ({ values: time < 0.1 ? before : then }),
        ),
      )
    const long = [note(220, 19)]
    // Sustained for 19 s, then Mode goes to Pluck: the device still holds it. A string plucked
    // 19 s ago with a Decay of 6 s would be long gone.
    const held = after({ mode: 1, detune: 0 }, { mode: 0, detune: 0 }, long)
    expect(lights(held)).toHaveLength(1)
    expect(posts(held)).toHaveLength(1)
    expect(lights(run({ mode: 0, detune: 0 }, long))).toHaveLength(0)
    // The other way: plucked and died, then Mode goes to Sustain. It does not come back.
    expect(lights(after({ mode: 0, detune: 0 }, { mode: 1, detune: 0 }, long))).toHaveLength(0)
    // One string stays one when Detune is turned up, and two stay two when it is turned off.
    expect(lights(after({ mode: 1, detune: 0 }, { mode: 1, detune: 12 }, long))).toHaveLength(1)
    expect(lights(after({ mode: 1, detune: 12 }, { mode: 1, detune: 0 }, long))).toHaveLength(2)
    // The bow in hand is the knob's: it is not lit for a note that was struck as a sustained one.
    expect(bows(after({ mode: 2 }, { mode: 2 }, long))).toHaveLength(1)
    expect(bows(after({ mode: 1 }, { mode: 2 }, long))).toHaveLength(0)
  })

  it('blooms a driven string over Attack', () => {
    for (const mode of [1, 2]) {
      const slow = posts(run({ mode, attack: 10 }, [note(220, 0.05)]))[0]
      const fast = posts(run({ mode, attack: 0.005 }, [note(220, 0.05)]))[0]
      expect(tall(slow)).toBeLessThan(tall(fast) * 0.7)
    }
  })

  it('takes the driver in hand while it holds a note, and lays it down when the key is up', () => {
    // The bow is a line across the string; in the accent while it bows.
    expect(bows(run({ mode: 2 }, [note(220, 1)]))).toHaveLength(1)
    expect(bows(run({ mode: 2 }, [note(220, 1, 0.2)]))).toHaveLength(0)
    // A harder bow has thicker hair.
    const light = bows(run({ mode: 2, pressure: 0 }, [note(220, 1)]))[0]
    const heavy = bows(run({ mode: 2, pressure: 1 }, [note(220, 1)]))[0]
    expect(heavy.width).toBeGreaterThan(light.width)
  })

  it('stands its handles where the knobs are, and a drag sets them', () => {
    const settings: Record<string, number>[] = [
      {},
      { mode: 0, attack: 0.4, position: 0.05, body: 1 },
      { mode: 2, attack: 6, release: 9, position: 0.5 },
    ]
    for (const values of settings) {
      const view = viewOf(display, params, { values })
      const [position, attack, release] = display.handles?.(view) ?? []
      expect(position.drag(position.x, position.y).position).toBeCloseTo(view.value('position'), 4)
      expect(attack.drag(attack.x, attack.y).attack).toBeCloseTo(view.value('attack'), 4)
      expect(release.drag(release.x, release.y).release).toBeCloseTo(view.value('release'), 4)
      // To the right is further from the bridge, and longer.
      expect(position.drag(position.x - 6, position.y).position).toBeLessThan(
        view.value('position'),
      )
      expect(attack.drag(attack.x + 8, attack.y).attack).toBeGreaterThan(view.value('attack'))
      expect(release.drag(release.x + 8, release.y).release).toBeGreaterThan(view.value('release'))
    }
  })
})

describe('the Chamber Strings’ figures', () => {
  it('seat the section as `ChamberStrings::start` does', () => {
    for (let count = 1; count <= 6; count++) {
      const seats = chamberSeats(count)
      expect(seats).toHaveLength(count)
      seats.forEach((seat, p) => {
        // Seats across the image, in order.
        expect(seat.place).toBeCloseTo((2 * p + 1) / count - 1, 6)
        // `kAttackSpread`, `kReleaseSpread`, and the ranges of the vibrato.
        expect(Math.abs(seat.attackScale - 1)).toBeLessThanOrEqual(0.3)
        expect(Math.abs(seat.releaseScale - 1)).toBeLessThanOrEqual(0.15)
        expect(seat.vibratoHz).toBeGreaterThanOrEqual(5.3)
        expect(seat.vibratoHz).toBeLessThanOrEqual(6.3 + 1e-9)
        expect(seat.vibratoDepth).toBeGreaterThanOrEqual(0.6)
        expect(seat.vibratoDepth).toBeLessThanOrEqual(1)
        expect(seat.vibratoDelay).toBeGreaterThanOrEqual(0.15)
        expect(seat.vibratoDelay).toBeLessThanOrEqual(0.4 + 1e-9)
        expect(seat.wait).toBeLessThan(1)
      })
      // The pitches are centred on the note, and the first of the section enters with the key.
      expect(seats.reduce((sum, seat) => sum + seat.pitch, 0)).toBeCloseTo(0, 6)
      expect(Math.min(...seats.map((seat) => seat.wait))).toBe(0)
      // No two players share a step of a range.
      expect(new Set(seats.map((seat) => seat.pitch)).size).toBe(count)
      expect(new Set(seats.map((seat) => seat.attackScale)).size).toBe(count)
    }
    // A soloist plays the note as written.
    expect(chamberSeats(1)[0].pitch).toBe(0)
    expect(chamberSeats(1)[0].attackScale).toBe(1)
  })

  it('spread and stagger the players by Scatter', () => {
    expect(chamberSpreadCents(0)).toBe(1)
    expect(chamberSpreadCents(1)).toBe(20)
    expect(chamberStagger(0)).toBe(0)
    expect(chamberStagger(1)).toBeCloseTo(0.08, 6)
    expect(chamberVelocity(0)).toBe(0.25)
    expect(chamberVelocity(1)).toBe(1)
  })

  it('rise in an S whose tenth-to-nine-tenths time is Attack', () => {
    // `kRiseShare`: the whole rise takes Attack over 0.6084.
    expect(chamberRise(0, 0.6)).toBe(0)
    expect(chamberRise(0.6 / 0.6084, 0.6)).toBeCloseTo(1, 6)
    expect(chamberRise(0.3 / 0.6084, 0.6)).toBeCloseTo(0.5, 6)
    for (const attack of [0.05, 0.6, 6]) {
      const rise = (seconds: number) => chamberRise(seconds, attack)
      expect(timeAt(0.9, rise, 20) - timeAt(0.1, rise, 20)).toBeCloseTo(attack, 3)
    }
    // A player with a scale of their own is that much slower.
    expect(chamberRise(1.3 * 0.5, 0.6, 1.3)).toBeCloseTo(chamberRise(0.5, 0.6), 6)
  })

  it('bring a player in after their wait and let them fall 60 dB over their own release', () => {
    const seats = chamberSeats(6)
    const late = seats.reduce((a, b) => (b.wait > a.wait ? b : a))
    const wait = late.wait * 0.08
    expect(chamberPlayerLevel(late, wait * 0.9, null, 0.6, 1.2, 1)).toBe(0)
    expect(chamberPlayerLevel(late, wait + 0.2, null, 0.6, 1.2, 1)).toBeCloseTo(
      chamberRise(0.2, 0.6, late.attackScale),
      6,
    )
    // With no scatter everyone enters with the key.
    expect(chamberPlayerLevel(late, 0.2, null, 0.6, 1.2, 0)).toBeGreaterThan(0)
    // Held to full level, then let go for the player's own release: 60 dB down.
    const fallen = chamberPlayerLevel(
      late,
      20 + 1.2 * late.releaseScale,
      1.2 * late.releaseScale,
      0.6,
      1.2,
      1,
    )
    expect(20 * Math.log10(fallen)).toBeCloseTo(-60, 3)
    // A key let go before a player entered: they never do.
    expect(chamberPlayerLevel(late, wait * 0.5 + 3, 3, 0.6, 1.2, 1)).toBe(0)
  })

  it('take a note’s level as the mean of its players, and its hiss as the root of that', () => {
    const seats = chamberSeats(4)
    const mean =
      seats.reduce((sum, seat) => sum + chamberPlayerLevel(seat, 0.4, null, 0.6, 1.2, 0.35), 0) / 4
    expect(chamberNoteLevel(4, 0.4, null, 0.6, 1.2, 0.35)).toBeCloseTo(mean, 6)
    // `ChamberStrings::control`: the hiss leads a slow attack.
    expect(chamberHiss(4, 0.4, null, 0.6, 1.2, 0.35)).toBeCloseTo(Math.sqrt(mean), 6)
    expect(chamberHiss(4, 0.4, null, 0.6, 1.2, 0.35)).toBeGreaterThan(mean)
    // At the key up it is where it was, and from there it leaves with the tone.
    expect(chamberHiss(4, 0.4, 0, 0.6, 1.2, 0.35)).toBeCloseTo(Math.sqrt(mean), 6)
    const after = chamberNoteLevel(4, 0.9, 0.5, 0.6, 1.2, 0.35)
    expect(chamberHiss(4, 0.9, 0.5, 0.6, 1.2, 0.35)).toBeCloseTo(after / Math.sqrt(mean), 6)
  })

  it('bring a player’s vibrato in after their delay, over half a second', () => {
    expect(chamberVibratoOnset(0.2, 0.25)).toBe(0)
    expect(chamberVibratoOnset(0.5, 0.25)).toBeCloseTo(0.5, 6)
    expect(chamberVibratoOnset(0.75, 0.25)).toBe(1)
  })
})

describe('the Chamber Strings’ display', () => {
  const { display } = BOWED_INSTRUMENT_FACES['chamber-strings']
  const params = paramsOf('chamber-strings')
  const run = drawer(display, 'chamber-strings')

  it('lights nothing at rest, and every player of the section for a note', () => {
    expect(accents(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    expect(accents(run({}, []))).toHaveLength(0)
    for (const players of [1, 4, 6]) {
      const drawn = run({ players }, [note(261.63, 1)])
      expect(lights(drawn)).toHaveLength(players)
      expect(bows(drawn)).toHaveLength(players)
      expect(posts(drawn)).toHaveLength(1)
    }
    // A chord is the same players, and a post for each note.
    const chord = run({ players: 4 }, [note(261.63, 1), note(329.63, 1), note(392, 1)])
    expect(lights(chord)).toHaveLength(4)
    expect(posts(chord)).toHaveLength(3)
  })

  it('brings a ragged section in one player after another', () => {
    const early = [note(261.63, 0.02)]
    expect(lights(run({ players: 6, attack: 0.05, scatter: 0 }, early))).toHaveLength(6)
    // Within 80 ms at a Scatter of 1: after 20 ms the first two of six have entered.
    expect(lights(run({ players: 6, attack: 0.05, scatter: 1 }, early))).toHaveLength(2)
  })

  it('lets the players go out one by one about Release after the key up', () => {
    const at = (released: number) => [note(261.63, 20 + released, released)]
    expect(lights(run({ players: 6, release: 2 }, at(1)))).toHaveLength(6)
    // At Release itself the three with a slower fall of their own still sound.
    expect(lights(run({ players: 6, release: 2 }, at(2)))).toHaveLength(3)
    expect(lights(run({ players: 6, release: 2 }, at(2.3)))).toHaveLength(0)
    expect(posts(run({ players: 6, release: 2 }, at(2.3)))).toHaveLength(0)
  })

  it('swells the strings over Attack', () => {
    const slow = lights(run({ players: 1, attack: 6 }, [note(261.63, 0.3)]))[0]
    const fast = lights(run({ players: 1, attack: 0.05 }, [note(261.63, 0.3)]))[0]
    expect(slow.width).toBeLessThan(fast.width)
  })

  it('leaves a lit string straight until the player’s vibrato comes in', () => {
    const values = { players: 1, vibrato: 40, attack: 0.05 }
    expect(wide(lights(run(values, [note(261.63, 0.1)]))[0])).toBeCloseTo(0, 6)
    expect(wide(lights(run(values, [note(261.63, 2)]))[0])).toBeGreaterThan(1)
    expect(wide(lights(run({ ...values, vibrato: 0 }, [note(261.63, 2)]))[0])).toBeCloseTo(0, 6)
  })

  it('moves the bows towards the bridge with Bow', () => {
    const y = (bow: number) => bows(run({ players: 1, bow }, [note(261.63, 1)]))[0].points[0][1]
    expect(y(1)).toBeGreaterThan(y(0.4))
    expect(y(0.4)).toBeGreaterThan(y(0))
  })

  it('stands its handles where the knobs are, and a drag sets them', () => {
    const settings: Record<string, number>[] = [
      {},
      { players: 6, bow: 0.9, scatter: 1, width: 0, attack: 3 },
    ]
    for (const values of settings) {
      const view = viewOf(display, params, { values })
      const [bow, attack, release] = display.handles?.(view) ?? []
      expect(bow.drag(bow.x, bow.y).bow).toBeCloseTo(view.value('bow'), 4)
      expect(attack.drag(attack.x, attack.y).attack).toBeCloseTo(view.value('attack'), 4)
      expect(release.drag(release.x, release.y).release).toBeCloseTo(view.value('release'), 4)
      // Down is towards the bridge.
      expect(bow.drag(bow.x, bow.y + 2).bow).toBeGreaterThan(view.value('bow'))
      expect(attack.drag(attack.x + 8, attack.y).attack).toBeGreaterThan(view.value('attack'))
    }
  })
})

describe('the String Machine’s figures', () => {
  it('bring a key in over Attack and out 60 dB over Release', () => {
    // `StringMachine::note_on`.
    expect(machineKeyGain(0)).toBeCloseTo(0.35, 6)
    expect(machineKeyGain(1)).toBeCloseTo(1, 6)
    expect(machineKeyDb(0.6, null, 1, 0.6, 1.8)).toBeCloseTo(0, 5)
    expect(machineKeyDb(0.3, null, 1, 0.6, 1.8)).toBeCloseTo(20 * Math.log10(adsrRise(0.3, 0.6)), 5)
    expect(machineKeyDb(5.9, 0.9, 1, 0.6, 1.8)).toBeCloseTo(-30, 5)
    expect(machineKeyDb(5, null, 0, 0.6, 1.8)).toBeCloseTo(20 * Math.log10(0.35), 5)
  })

  it('filter as the shared low-pass at Tone and the high-pass at 90 Hz do', () => {
    // A two-pole low-pass with a Q of 0.6 passes its own frequency at 0.6.
    expect(machineToneDb(3200, 3200)).toBeCloseTo(20 * Math.log10(0.6), 0)
    expect(Math.abs(machineToneDb(3200, 3200) - 20 * Math.log10(0.6))).toBeLessThan(0.1)
    // Well above it, 12 dB an octave.
    expect(machineToneDb(2000, 500) - machineToneDb(4000, 500)).toBeGreaterThan(11.5)
    expect(machineToneDb(2000, 500) - machineToneDb(4000, 500)).toBeLessThan(12.8)
    // The high-pass is 3 dB down at 90 Hz and leaves the middle alone.
    expect(Math.abs(machineToneDb(90, 12000) + 3)).toBeLessThan(0.15)
    expect(Math.abs(machineToneDb(600, 12000))).toBeLessThan(0.2)
  })

  it('sweep the ensemble’s three lines a third of a cycle apart about 6 ms', () => {
    for (const seconds of [0, 0.13, 0.7, 1.9]) {
      const lines = [0, 1, 2].map((line) => machineChorusMs(line, seconds, 1))
      // Three sines a third apart add up to nothing.
      expect(lines[0] + lines[1] + lines[2]).toBeCloseTo(18, 6)
      for (const ms of lines) expect(Math.abs(ms - 6)).toBeLessThanOrEqual(1.2 + 0.18 + 1e-9)
    }
    expect(machineChorusMs(0, 0, 1)).toBeCloseTo(6, 6)
    // 0.6 Hz and 6 Hz at a Speed of 1: both come round after 1/0.6 s, and Speed scales both.
    expect(machineChorusMs(1, 0.4 + 1 / 0.6, 1)).toBeCloseTo(machineChorusMs(1, 0.4, 1), 6)
    expect(machineChorusMs(1, 0.2, 2)).toBeCloseTo(machineChorusMs(1, 0.4, 1), 6)
  })

  it('let a key wander 9 cents at most', () => {
    expect(machineDriftCents(0)).toBe(0)
    expect(machineDriftCents(1)).toBe(9)
  })
})

describe('the String Machine’s display', () => {
  const { display } = BOWED_INSTRUMENT_FACES['string-machine']
  const params = paramsOf('string-machine')
  const run = drawer(display, 'string-machine')

  it('lights nothing at rest, and the ranks a key plays', () => {
    expect(accents(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    expect(accents(run({}, []))).toHaveLength(0)
    expect(lights(run({}, [note(261.63, 1)]))).toHaveLength(3)
    // The 8′ is always there; Cello and Violin add the others.
    expect(lights(run({ low: 0, high: 0 }, [note(261.63, 1)]))).toHaveLength(1)
    expect(lights(run({ low: 0 }, [note(261.63, 1)]))).toHaveLength(2)
  })

  it('makes a rank as tall as its level', () => {
    const [violin, , cello] = lights(run({ low: 1, high: 0.25 }, [note(261.63, 3)]))
    expect(tall(violin)).toBeLessThan(tall(cello) * 0.6)
  })

  it('swells the ranks over Attack and puts them out Release after the key up', () => {
    const slow = lights(run({ attack: 8 }, [note(261.63, 0.2)]))[1]
    const fast = lights(run({ attack: 0.005 }, [note(261.63, 0.2)]))[1]
    expect(tall(slow)).toBeLessThan(tall(fast) * 0.8)
    expect(lights(run({ release: 2 }, [note(261.63, 5, 1)]))).toHaveLength(3)
    expect(lights(run({ release: 2 }, [note(261.63, 6.1, 2.1)]))).toHaveLength(0)
    expect(posts(run({ release: 2 }, [note(261.63, 6.1, 2.1)]))).toHaveLength(0)
  })

  it('stands every key that sounds on the life', () => {
    const chord = [note(220, 3, 0.4), note(261.63, 1), note(329.63, 1), note(392, 1)]
    expect(posts(run({}, chord))).toHaveLength(4)
  })

  it('rounds a key’s sawtooth as Tone rounds it', () => {
    // At 880 Hz a Tone of 200 Hz leaves little but a quiet fundamental.
    const dark = lights(run({ tone: 200 }, [note(880, 3)]))[1]
    const bright = lights(run({ tone: 12000 }, [note(880, 3)]))[1]
    expect(tall(dark)).toBeLessThan(tall(bright) * 0.3)
  })

  it('stands its handles where the knobs are, and a drag sets them', () => {
    const settings: Record<string, number>[] = [
      {},
      { attack: 0.005, release: 12 },
      { attack: 8, release: 0.05 },
    ]
    for (const values of settings) {
      const view = viewOf(display, params, { values })
      const [attack, release] = display.handles?.(view) ?? []
      expect(attack.drag(attack.x, attack.y).attack).toBeCloseTo(view.value('attack'), 4)
      expect(release.drag(release.x, release.y).release).toBeCloseTo(view.value('release'), 4)
    }
  })
})
