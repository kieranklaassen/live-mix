// The truth of the subtractive synthesizers' displays: an envelope stands
// where the device's own would, a note is lit for as long as that envelope
// lets it sound, and the filter is drawn where the knobs and the note hold it.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  SUBTRACTIVE_INSTRUMENT_FACES,
  emberCopyLevel,
  emberCopyPlace,
  emberCutoffHz,
  emberDrive,
  emberSynced,
  adsrEnvelope,
  emberFilterDb,
  adsrKeyDown,
  adsrKeyUp,
  adsrLevel,
  emberLfo,
  emberNoiseDb,
  emberOvertone,
  emberPlaying,
  adsrRun,
  duskCutoffHz,
  duskDelays,
  duskLadderGain,
  duskSweepAge,
  duskTimes,
  duskWave,
  duskWaves,
  duskWidth,
  emberVelocityGain,
  emberVoices,
  bassBeatHz,
  bassContour,
  bassCutoffHz,
  bassDrive,
  bassLadderGain,
  bassOvertone,
  bassPartials,
  bassPitch,
  bassPlay,
  bassVoice,
  bassWave,
  auroraBeatHz,
  auroraHighpassHz,
  auroraLowpassHz,
  auroraQ,
  auroraRingHz,
  auroraShape,
  auroraSwell,
  auroraSwellLevel,
  auroraTimes,
  auroraTrim,
  auroraVelocity,
  auroraVoices,
  auroraZing,
  type AdsrTimes,
  type AuroraSetting,
  type AuroraVoice,
  type DuskSetting,
} from '../components/displays/instrument-subtractive'
import { type DisplayNote } from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type DrawnPath,
} from './display-harness'

const stock = stockDescriptors()
const paramsOf = (id: string) => stock.get(id)?.params ?? {}
const { accent } = PLAIN_COLOURS

const note = (
  frequency: number,
  age: number,
  released: number | null = null,
  gain = 1,
): DisplayNote => ({ id: Math.round(frequency), frequency, gain, age, released })
/** Everything laid in the accent: the light of the notes that sound. */
const lights = (paths: DrawnPath[]): DrawnPath[] => paths.filter((path) => path.colour === accent)
/** The lowest y a path reaches: how high it stands on the display. */
const top = (path: DrawnPath): number => Math.min(...path.points.map(([, y]) => y))

describe('the ember’s figures', () => {
  const times: AdsrTimes = { attack: 0.5, decay: 2, sustain: 0.4, release: 3 }

  it('run an envelope as `Adsr::next` does', () => {
    // The attack aims at 1.3 and is at the peak after exactly its time.
    expect(adsrLevel(times, 0.25, null)).toBeCloseTo(1.3 * (1 - Math.sqrt(0.3 / 1.3)), 5)
    expect(adsrLevel(times, 0.5, null)).toBeCloseTo(1, 5)
    // The decay covers 60 dB of the way to Sustain in its time, then rests there.
    expect(adsrLevel(times, 0.5 + 2, null)).toBeCloseTo(0.4 + 0.6 * 0.001, 5)
    expect(adsrLevel(times, 0.5 + 1, null)).toBeCloseTo(0.4 + 0.6 * Math.pow(0.001, 0.5), 5)
    expect(adsrLevel(times, 60, null)).toBe(0.4)
    // The release falls 60 dB in its time from wherever the level stood, and ends at −100 dB.
    expect(adsrLevel(times, 63, 3)).toBeCloseTo(0.4 * 0.001, 6)
    expect(adsrLevel(times, 0.5 + 1.5, 1.5)).toBeCloseTo(Math.pow(0.001, 0.5), 5)
    expect(adsrLevel(times, 60 + 3 * 1.5, 3 * 1.5)).toBeGreaterThan(0)
    expect(adsrLevel(times, 60 + 3 * 1.7, 3 * 1.7)).toBe(0)
  })

  it('begin an attack again from where the level stands', () => {
    const env = adsrEnvelope()
    adsrKeyDown(env)
    adsrRun(env, 10, times)
    adsrKeyUp(env)
    adsrRun(env, 1, times)
    const fallen = env.level
    expect(fallen).toBeCloseTo(0.4 * Math.pow(0.001, 1 / 3), 5)
    adsrKeyDown(env)
    adsrRun(env, 0.1, times)
    expect(env.level).toBeCloseTo(1.3 - (1.3 - fallen) * Math.pow(0.3 / 1.3, 0.2), 5)
  })

  it('give each wave the overtones of `PolyBlepOsc`', () => {
    // A saw: 2 / (π n). A square: 4 / (π n) on the odd ones. A triangle: 8 / (π n)², odd. A sine: one.
    expect(emberOvertone(0, 1, 0.5)).toBeCloseTo(2 / Math.PI, 6)
    expect(emberOvertone(0, 7, 0.5)).toBeCloseTo(2 / (7 * Math.PI), 6)
    expect(emberOvertone(1, 3, 0.5)).toBeCloseTo(4 / (3 * Math.PI), 6)
    expect(emberOvertone(1, 2, 0.5)).toBeCloseTo(0, 6)
    // A pulse a quarter wide has no fourth overtone.
    expect(emberOvertone(1, 4, 0.25)).toBeCloseTo(0, 6)
    expect(emberOvertone(2, 3, 0.5)).toBeCloseTo(8 / (9 * Math.PI * Math.PI), 6)
    expect(emberOvertone(2, 2, 0.5)).toBe(0)
    expect(emberOvertone(3, 1, 0.5)).toBe(1)
    expect(emberOvertone(3, 2, 0.5)).toBe(0)
  })

  /** The level of overtone `n` of a wave given as its cosine and sine shares, in dB at one side's filter. */
  const sideDb = (shares: Float32Array, n: number): number =>
    20 * Math.log10(Math.hypot(shares[n * 2], shares[n * 2 + 1]) * emberCopyLevel(1))

  it('send the oscillators to each side at √½ and share that between the unison copies', () => {
    // `Ember::refresh_controls`: sqrt(0.5 (1 ∓ pan)) with the pan in the middle, over the root of the copies.
    expect(emberCopyLevel(1)).toBeCloseTo(Math.SQRT1_2, 6)
    expect(emberCopyLevel(4)).toBeCloseTo(Math.SQRT1_2 / 2, 6)
    // The copies stand from one end to the other, a lone one in the middle.
    expect(emberCopyPlace(0, 1)).toBe(0)
    expect(emberCopyPlace(0, 4)).toBe(-1)
    expect(emberCopyPlace(3, 4)).toBe(1)
    expect(emberCopyPlace(1, 3)).toBe(0)
  })

  it('cut a synced oscillator off where `PolyBlepOsc::next` starts it again', () => {
    const shares = new Float32Array(802)
    // At the master's own pitch nothing is cut off: the saw as it is, all of it a sine share.
    emberSynced(0, 0.5, 1, shares)
    expect(shares[2]).toBeCloseTo(0, 6)
    expect(shares[3]).toBeCloseTo(-2 / Math.PI, 6)
    expect(shares[7 * 2 + 1]).toBeCloseTo(-2 / (7 * Math.PI), 6)
    // An octave up it runs two whole cycles: a saw on every second overtone of the master.
    emberSynced(0, 0.5, 2, shares)
    expect(Math.hypot(shares[2], shares[3])).toBeCloseTo(0, 6)
    expect(Math.hypot(shares[4], shares[5])).toBeCloseTo(2 / Math.PI, 6)
    // Every overtone the picture can show is worked out, the four hundredth too: a low note has that many.
    emberSynced(0, 0.5, 2.5, shares)
    expect(Math.hypot(shares[800], shares[801])).toBeCloseTo(5 / (400 * Math.PI), 6)
    // A fifth up (seven semitones), the device's own output read off overtone by overtone, in dB.
    emberSynced(0, 0.5, Math.pow(2, 7 / 12), shares)
    const measured = [-8.16, -14.25, -12.96, -20.13, -22.28, -18.99, -24.93, -26.44]
    measured.forEach((db, index) => expect(sideDb(shares, index + 1)).toBeCloseTo(db, 1))
  })

  it('bend a level as the drive of `Voice::render` does', () => {
    expect(emberDrive(0, 0.6)).toBe(0.6)
    // Full: sixteen times into the curve, a quarter of it out.
    expect(emberDrive(1, 1)).toBeCloseTo(0.25, 6)
    expect(emberDrive(1, -0.25)).toBeCloseTo(-0.25, 6)
    // Half: 8.5 times in, over the root of 8.5, half and half with the sound as it was.
    const t = 0.85
    const bent = (t * (27 + t * t)) / (27 + 9 * t * t)
    expect(emberDrive(0.5, 0.1)).toBeCloseTo(0.05 + (0.5 * bent) / Math.sqrt(8.5), 6)
    // A saw through it at half, as the device puts it out: the first three overtones, in dB.
    const shares = new Float32Array(8)
    const count = 20000
    for (let k = 0; k < count; k++) {
      const u = (k + 0.5) / count
      const out = emberDrive(0.5, emberCopyLevel(1) * (2 * u - 1)) / emberCopyLevel(1)
      for (let n = 1; n <= 3; n++) {
        shares[n * 2] += (2 * out * Math.cos(2 * Math.PI * n * u)) / count
        shares[n * 2 + 1] += (2 * out * Math.sin(2 * Math.PI * n * u)) / count
      }
    }
    expect(sideDb(shares, 1)).toBeCloseTo(-7.25, 1)
    expect(sideDb(shares, 2)).toBeCloseTo(-17.77, 1)
    expect(sideDb(shares, 3)).toBeCloseTo(-17.9, 1)
  })

  it('filter as `SvfTptSynth` does', () => {
    // No resonance is a damping of 2: 6 dB down at the cutoff, twice that through both stages.
    expect(emberFilterDb(0, false, 1000, 0, 1000, 96000)).toBeCloseTo(-6.02, 2)
    expect(emberFilterDb(0, true, 1000, 0, 1000, 96000)).toBeCloseTo(-12.04, 2)
    // Full resonance is a damping of 0.1: 20 dB up at the cutoff.
    expect(emberFilterDb(0, false, 1000, 1, 1000, 96000)).toBeCloseTo(20, 2)
    // Far above the cutoff a low pass falls 12 dB an octave, a band pass 6.
    const fall = (type: number): number =>
      emberFilterDb(type, false, 100, 0, 1600, 96000) -
      emberFilterDb(type, false, 100, 0, 3200, 96000)
    expect(fall(0)).toBeCloseTo(12, 0)
    expect(fall(2)).toBeCloseTo(6, 0)
    // A high pass leaves what is far above alone, and a band pass its own middle.
    expect(emberFilterDb(1, false, 100, 0.5, 10000, 96000)).toBeCloseTo(0, 1)
    expect(emberFilterDb(2, true, 1000, 0.3, 1000, 96000)).toBeCloseTo(0, 5)
  })

  it('stand the cutoff where `Voice::render` does', () => {
    expect(emberCutoffHz(1000, 0, 72, 0, 1, 0, 1)).toBeCloseTo(1000, 6)
    // Full key tracking moves it an octave for an octave above middle C.
    expect(emberCutoffHz(1000, 1, 72, 0, 0, 0, 0.5)).toBeCloseTo(2000, 6)
    // The envelope at full carries it six octaves, a full velocity two of its four.
    expect(emberCutoffHz(100, 0, 60, 0.5, 1, 0, 0.5)).toBeCloseTo(800, 6)
    expect(emberCutoffHz(100, 0, 60, 0, 0, 1, 1)).toBeCloseTo(400, 6)
    expect(emberCutoffHz(100, 0, 60, -1, 1, 0, 0.5)).toBe(20)
    expect(emberCutoffHz(10000, 0, 60, 1, 1, 0, 0.5)).toBe(20000)
    expect(emberVelocityGain(0.7, 0.5)).toBeCloseTo(0.65, 6)
    expect(emberVelocityGain(0, 0.1)).toBe(1)
  })

  it('shape an LFO as `Lfo::next` does', () => {
    expect(emberLfo(0, 0.25)).toBeCloseTo(1, 6)
    // The triangle starts at its foot, the saw falls, the square starts high.
    expect(emberLfo(1, 0)).toBe(-1)
    expect(emberLfo(1, 0.5)).toBe(1)
    expect(emberLfo(2, 0.25)).toBe(0.5)
    expect(emberLfo(3, 0.25)).toBe(1)
    expect(emberLfo(3, 0.75)).toBe(-1)
    // Sample and hold keeps one value through a cycle and takes another at the next.
    expect(emberLfo(4, 2.1)).toBe(emberLfo(4, 2.9))
    expect(emberLfo(4, 2.1)).not.toBe(emberLfo(4, 3.1))
  })

  it('lay the noise under the overtones as a floor', () => {
    // White between ±1 has a third of full power, spread up to the sample rate of the voices' half band.
    expect(emberNoiseDb(1, 480, 48000)).toBeCloseTo(10 * Math.log10((2 / 3) * 0.01), 6)
    expect(emberNoiseDb(0.5, 480, 48000)).toBeCloseTo(emberNoiseDb(1, 480, 48000) - 6.02, 2)
  })

  const setting = { mode: 0, glide: 0, amp: times, filter: times, velToAmp: 0.7 }

  it('take the quietest voice that was let go when a seventeenth note comes', () => {
    // `VoiceAllocator::allocate`. Two keys held, then sixteen short notes a tenth of a second apart, all still falling.
    const notes = [note(110, 30), note(165, 30)]
    for (let n = 0; n < 16; n++) notes.push(note(220 + n * 10, 2 - n * 0.1, 1.9 - n * 0.1))
    const playing = emberVoices(notes, setting, emberPlaying())
    expect(playing.count).toBe(16)
    // The held keys keep their voices; the two short notes that have fallen furthest gave theirs up.
    expect(playing.voices[0].key).toBeCloseTo(45, 1)
    expect(playing.voices[1].key).toBeCloseTo(52, 1)
    expect(playing.voices[2].key).toBeCloseTo(69 + 12 * Math.log2(240 / 440), 5)
    // With every key held there is none let go to take: the quietest goes, here the softest touch.
    const held = Array.from({ length: 17 }, (_, n) =>
      note(220 + n * 10, 20, null, n === 5 ? 0.2 : 1),
    )
    const full = emberVoices(held, setting, emberPlaying())
    expect(full.count).toBe(16)
    expect(full.voices.slice(0, 16).every((voice) => voice.velocity === 1)).toBe(true)
  })

  it('give every note a voice in poly, and let it go when its amp envelope ends', () => {
    const playing = emberVoices(
      [note(220, 30, 20), note(330, 4, 1), note(440, 0.2)],
      setting,
      emberPlaying(),
    )
    expect(playing.count).toBe(2)
    expect(playing.voices[0].key).toBeCloseTo(64, 1)
    expect(playing.voices[1].amp.level).toBeCloseTo(adsrLevel(times, 0.2, null), 6)
  })

  it('glide a poly voice in from the note before it', () => {
    const playing = emberVoices(
      [note(220, 1), note(440, 0.25)],
      { ...setting, glide: 1 },
      emberPlaying(),
    )
    // A quarter of the way from the A below to the A above, straight in pitch.
    expect(playing.voices[1].pitch).toBeCloseTo(57 + 3, 5)
    expect(playing.voices[1].key).toBeCloseTo(69, 5)
    expect(playing.voices[0].pitch).toBeCloseTo(57, 5)
  })

  it('play one voice in mono, back to the key held before, with or without a new attack', () => {
    // A held, then C over it and let go: the voice is back on A.
    const notes = [note(220, 20), note(261.63, 10, 0.1)]
    const mono = emberVoices(notes, { ...setting, mode: 1 }, emberPlaying())
    expect(mono.count).toBe(1)
    expect(mono.voices[0].key).toBeCloseTo(57, 5)
    // Mono began the envelope again a tenth of a second ago, from Sustain; legato left it there.
    expect(mono.voices[0].amp.level).toBeGreaterThan(0.4)
    const legato = emberVoices(notes, { ...setting, mode: 2 }, emberPlaying())
    expect(legato.voices[0].key).toBeCloseTo(57, 5)
    expect(legato.voices[0].amp.level).toBe(0.4)
    // The last key up lets the voice go.
    const gone = emberVoices([note(220, 20, 12)], { ...setting, mode: 1 }, emberPlaying())
    expect(gone.count).toBe(0)
  })
})

describe('the ember’s display', () => {
  const { display } = SUBTRACTIVE_INSTRUMENT_FACES.ember
  const params = paramsOf('ember')
  const run = (values: Record<string, number>, notes: DisplayNote[], width = 408) =>
    drawnPaths(runDisplay(display, params, 0.1, { values, notes, signal: testSignal(), width }))

  it('lights nothing at rest, at any of its three widths', () => {
    for (const width of [128, 204, 408]) {
      expect(lights(drawnPaths(drawDisplay(display, params, { width })))).toHaveLength(0)
      expect(lights(run({}, [], width))).toHaveLength(0)
      expect(lights(run({}, [note(220, 0.3)], width)).length).toBeGreaterThan(0)
    }
  })

  it('puts a note out when its amp envelope has ended', () => {
    // Release 0.2 s: at −100 dB after a third of a second.
    expect(lights(run({}, [note(220, 1, 0.25)])).length).toBeGreaterThan(0)
    expect(lights(run({}, [note(220, 1, 0.4)]))).toHaveLength(0)
    // A longer release keeps it lit.
    expect(lights(run({ ampRelease: 5 }, [note(220, 1, 0.4)])).length).toBeGreaterThan(0)
    // With no sustain a held note dies on its own.
    expect(lights(run({ ampSustain: 0, ampDecay: 0.1 }, [note(220, 2)]))).toHaveLength(0)
  })

  it('lights fewer overtones under a closed filter, and more as the envelope opens it', () => {
    /** The lit overtones: the one path of many upright strokes in the accent. */
    const lit = (values: Record<string, number>, age: number): number =>
      Math.max(...lights(run(values, [note(110, age)])).map((path) => path.points.length))
    const open = lit({}, 1)
    const closed = lit({ cutoff: 200 }, 1)
    expect(closed).toBeLessThan(open)
    // Six octaves of envelope with no sustain: open at the peak, closed again when it has fallen.
    const swept = { cutoff: 200, filterEnvAmount: 1, filterSustain: 0, filterDecay: 0.5 }
    expect(lit(swept, 0.02)).toBeGreaterThan(closed)
    expect(lit(swept, 3)).toBe(closed)
  })

  it('rides each note on the amp envelope as high as it is loud', () => {
    /** The stems of the notes on the amp envelope: two points from the foot, right of the overtones (which end at 230 of 408). */
    const stems = (values: Record<string, number>, notes: DisplayNote[]): DrawnPath[] =>
      lights(run(values, notes)).filter(
        (path) =>
          path.kind === 'stroke' &&
          path.points.length === 2 &&
          path.points[0][1] > 80 &&
          path.points[0][0] > 233,
      )
    const chord = [note(220, 1, null, 1), note(330, 1, null, 0.2)]
    const even = stems({ velToAmp: 0 }, chord)
    expect(even).toHaveLength(2)
    expect(top(even[0])).toBeCloseTo(top(even[1]), 5)
    const touched = stems({ velToAmp: 1 }, chord)
    expect(top(touched[1])).toBeGreaterThan(top(touched[0]) + 10)
    // One voice in mono, whatever is held.
    expect(stems({ voiceMode: 1 }, chord)).toHaveLength(1)
  })

  const { ink } = PLAIN_COLOURS
  /** At 408 by 100 the overtones stand on 73 px for 72 dB, and Drive's square from 57 to 75 across, 48 to 66 down. */
  const PER_DB = 73 / 72
  const still = (values: Record<string, number>, width = 408): DrawnPath[] =>
    drawnPaths(drawDisplay(display, params, { values, width }))
  /** The faint layer under the overtones: everything the oscillators make, a stroke from the foot for each. */
  const made = (values: Record<string, number>): [number, number][] =>
    still(values).find(
      (path) => path.kind === 'stroke' && path.colour === ink && path.alpha === 0.3,
    )?.points ?? []

  it('stands the sub and the oscillators as high as each side’s filter is sent them', () => {
    // A sine and the sub, both at full: the sub goes to the filter whole, the oscillator at √½, 3 dB under it.
    const sine = made({ osc1Shape: 3, subLevel: 1 })
    expect(sine).toHaveLength(4)
    expect(sine[3][1] - sine[1][1]).toBeCloseTo(3.01 * PER_DB, 1)
    // The device's own output with a saw: its first overtone 6.93 dB under the sub.
    const saw = made({ subLevel: 1 })
    expect(saw[3][1] - saw[1][1]).toBeCloseTo(6.93 * PER_DB, 1)
    // Unison shares the power out and loses none: at no detune the picture is the one of a single copy.
    const one = made({ subLevel: 1, unisonVoices: 1 })
    const eight = made({ subLevel: 1, unisonVoices: 8, unisonDetune: 0 })
    expect(eight[3][1]).toBeCloseTo(one[3][1], 6)
    // Detuned a semitone either way, the copies stand apart and each is lower than the one was.
    const apart = made({ osc1Shape: 3, unisonVoices: 2, unisonDetune: 100 })
    expect(apart).toHaveLength(4)
    expect(apart[2][0]).toBeGreaterThan(apart[0][0])
    expect(apart[1][1] - sine[3][1]).toBeCloseTo(3.01 * PER_DB, 1)
  })

  it('bends Drive’s line as far as the knob is turned, at every width', () => {
    /** How high the line in Drive's square reaches. */
    const bend = (drive: number): number =>
      Math.min(
        ...still({ filterDrive: drive })
          .filter(
            (path) =>
              path.kind === 'stroke' &&
              path.points.length > 30 &&
              path.points.every(([x, y]) => x >= 57 && x <= 75 && y >= 48 && y <= 66),
          )
          .map(top),
      )
    // Left as it is the sound runs corner to corner; at full it is squared off at a quarter.
    expect(bend(0)).toBeCloseTo(57 - 8, 5)
    expect(bend(1)).toBeCloseTo(57 - 8 * 0.25, 5)
    expect(bend(0.5)).toBeCloseTo(57 - 8 * emberDrive(0.5, 1), 5)
    for (const width of [128, 204, 408]) {
      const print = (drive: number): string =>
        drawDisplay(display, params, { values: { filterDrive: drive }, width }).print()
      expect(print(0.5)).not.toBe(print(0))
      expect(print(1)).not.toBe(print(0.5))
    }
  })

  it('draws an LFO too fast to tell its cycles apart as the band it fills', () => {
    /** The points of the longest line in LFO 1's panel, which begins at 342 of 408. */
    const line = (values: Record<string, number>): number =>
      Math.max(
        0,
        ...still(values)
          .filter(
            (path) => path.kind === 'stroke' && path.points.every(([x, y]) => x >= 342 && y < 50),
          )
          .map((path) => path.points.length),
      )
    const bands = (values: Record<string, number>): number =>
      drawDisplay(display, params, { values, width: 408 }).calls.filter(
        (call) => call.name === 'fillRect' && call.args[0] === 342 && call.args[3] === 21,
      ).length
    // Two seconds across 61 px: 5 Hz is ten cycles, 40 Hz eighty, more than there are pixels.
    expect(line({ lfo1Rate: 5, lfo1Amount: 1 })).toBeGreaterThan(100)
    expect(bands({ lfo1Rate: 5, lfo1Amount: 1 })).toBe(0)
    expect(line({ lfo1Rate: 40, lfo1Amount: 1 })).toBeLessThan(10)
    expect(bands({ lfo1Rate: 40, lfo1Amount: 1 })).toBe(1)
    // Switched off it is the flat line of any LFO at no amount.
    expect(bands({ lfo1Rate: 40, lfo1Amount: 0 })).toBe(0)
  })

  it('stands its handle on the cutoff, and a drag sets it', () => {
    const settings: Record<string, number>[] = [
      {},
      { cutoff: 800 },
      { cutoff: 300, keyTrack: 1, filterType: 2 },
    ]
    for (const values of settings) {
      const view = viewOf(display, params, { values, width: 408 })
      const [cutoff] = display.handles?.(view) ?? []
      expect(cutoff.drag(cutoff.x, cutoff.y).cutoff).toBeCloseTo(view.value('cutoff'), 3)
      expect(cutoff.drag(cutoff.x - 20, cutoff.y).cutoff).toBeLessThan(view.value('cutoff'))
      expect(cutoff.wheel?.(1).resonance).toBeCloseTo(view.value('resonance') + 0.05, 6)
    }
  })
})

describe('the dusk’s figures', () => {
  it('shape one envelope for level and filter as `Dusk::set_envelope` does', () => {
    const times = duskTimes(0.6, 2.5)
    expect(times).toEqual({ attack: 0.6, decay: 2.5, sustain: 0.7, release: 2.5 })
    // At the peak after the attack, 60 dB of the way down to 0.7 a release time later.
    expect(adsrLevel(times, 0.6, null)).toBeCloseTo(1, 5)
    expect(adsrLevel(times, 0.6 + 2.5, null)).toBeCloseTo(0.7 + 0.3 * 0.001, 5)
    expect(adsrLevel(times, 30, 2.5)).toBeCloseTo(0.7 * 0.001, 6)
  })

  it('stand the cutoff where `Dusk::cutoff_hz` does', () => {
    // Cutoff is the corner at middle C; it follows the keys fully, and the envelope's peak moves it six octaves.
    expect(duskCutoffHz(2500, 0, 1, 261.6256, 48000)).toBeCloseTo(2500, 3)
    expect(duskCutoffHz(2500, 0.25, 0, 130.8128, 48000)).toBeCloseTo(1250, 3)
    expect(duskCutoffHz(100, 0.5, 1, 261.6256, 48000)).toBeCloseTo(800, 3)
    expect(duskCutoffHz(100, -1, 1, 261.6256, 48000)).toBe(16)
    expect(duskCutoffHz(18000, 1, 1, 1046.5, 48000)).toBe(21600)
  })

  it('play the waves each choice of Wave names', () => {
    expect(duskWaves(0)).toEqual({ saw: 1, pulse: 0, moving: false })
    expect(duskWaves(1)).toEqual({ saw: 0, pulse: 1, moving: false })
    expect(duskWaves(2)).toEqual({ saw: 1, pulse: 1, moving: false })
    expect(duskWaves(3)).toEqual({ saw: 0, pulse: 1, moving: true })
    expect(duskWaves(4)).toEqual({ saw: 1, pulse: 1, moving: true })
  })

  it('sweep the pulse from half to 88 % and back at 0.6 Hz', () => {
    expect(duskWidth(0)).toBeCloseTo(0.5, 6)
    expect(duskWidth(0.5 / 0.6)).toBeCloseTo(0.88, 6)
    expect(duskWidth(1 / 0.6 + 0.25 / 0.6)).toBeCloseTo(0.69, 6)
  })

  it('move the chorus’s two lines as `TwoLineChorus::process` does', () => {
    // I: the left line begins at its shortest and the right at its longest, and they cross a quarter of a cycle on.
    expect(duskDelays(1, 0)[0]).toBeCloseTo(0.00166, 6)
    expect(duskDelays(1, 0)[1]).toBeCloseTo(0.00535, 6)
    expect(duskDelays(1, 0.25 / 0.513)[0]).toBeCloseTo(duskDelays(1, 0.25 / 0.513)[1], 6)
    expect(duskDelays(1, 0.5 / 0.513)[0]).toBeCloseTo(0.00535, 6)
    // II is the same sweep, faster. I + II moves both lines together, a little.
    expect(duskDelays(2, 0.5 / 0.863)[0]).toBeCloseTo(0.00535, 6)
    expect(duskDelays(3, 0.5 / 9.75)).toEqual([
      expect.closeTo(0.0037, 6),
      expect.closeTo(0.0037, 6),
    ])
  })

  it('know when the sweeps began, and say when it cannot', () => {
    const times = duskTimes(0.6, 2.5)
    expect(duskSweepAge([], times)).toBeNull()
    // Overlapping notes: the sweeps began with the first.
    expect(duskSweepAge([note(220, 6, 3), note(330, 4)], times)).toBe(6)
    // The first had ended (0.7 falls to −100 dB in 1.61 release times) before the second: they began again.
    expect(duskSweepAge([note(220, 12, 9), note(330, 4)], times)).toBe(4)
    expect(duskSweepAge([note(220, 12, 7.9), note(330, 4)], times)).toBe(12)
    // A note that was let go is kept for a minute. A first note so old that one before it, out of
    // sight, could still have sounded (a full level falls to −100 dB in 1.67 release times) tells nothing.
    expect(duskSweepAge([note(220, 19)], times)).toBe(19)
    expect(duskSweepAge([note(220, 55)], times)).toBe(55)
    expect(duskSweepAge([note(220, 56)], times)).toBeNull()
    expect(duskSweepAge([note(220, 39)], duskTimes(0.6, 12))).toBe(39)
    expect(duskSweepAge([note(220, 41)], duskTimes(0.6, 12))).toBeNull()
  })

  it('filter as four stages with a loop around them', () => {
    // With no loop: four stages, each 3 dB down at the cutoff.
    expect(duskLadderGain(1000, 1000, 0, 48000)).toBeCloseTo(0.25, 4)
    expect(duskLadderGain(10, 1000, 0, 48000)).toBeCloseTo(1, 3)
    // The loop takes 1 / (1 + feedback) from the pass band and gives a peak at the cutoff.
    expect(duskLadderGain(10, 1000, 2, 48000)).toBeCloseTo(1 / 3, 3)
    expect(duskLadderGain(1000, 1000, 2, 48000)).toBeCloseTo(0.25 / (1 - 2 * 0.25), 4)
  })

  /**
   * `Dusk::process` for one key of a sawtooth, sample by sample through
   * `SingingLadder::process` at 48 kHz: how loud what comes out is over its
   * last second (root mean square), in the measure of the wave.
   */
  const heard = (hz: number, cutoffHz: number, feedback: number, saw = 1): number => {
    const sampleRate = 48000
    const fastTanh = (x: number): number => {
      const c = Math.max(-3, Math.min(3, x))
      return (c * (27 + c * c)) / (27 + 9 * c * c)
    }
    const g = Math.tan((Math.PI * cutoffHz) / sampleRate)
    const stage = g / (1 + g)
    const g2 = stage * stage
    const drive = 0.12 * Math.sqrt(1 + feedback)
    const s = [0, 0, 0, 0]
    let phase = 0.3
    let sum = 0
    for (let i = 0; i < 3 * sampleRate; i++) {
      phase += hz / sampleRate
      if (phase >= 1) phase -= 1
      const sigma = (1 - stage) * (g2 * stage * s[0] + g2 * s[1] + stage * s[2] + s[3])
      let y = fastTanh(
        (saw * (2 * phase - 1) * drive - feedback * sigma) / (1 + feedback * g2 * g2),
      )
      for (let k = 0; k < 4; k++) {
        const v = (y - s[k]) * stage
        y = v + s[k]
        s[k] = y + v
      }
      if (i >= 2 * sampleRate) sum += (y / 0.12) * (y / 0.12)
    }
    return Math.sqrt(sum / sampleRate)
  }
  /** The same as the display has it: the wave it keeps, and the note the filter sings on top of it. */
  const drawn = (
    hz: number,
    cutoffHz: number,
    feedback: number,
    saw = 1,
  ): { loud: number; sung: number } => {
    const setting: DuskSetting = {
      saw,
      pulse: 0,
      width: 0.5,
      sub: 0,
      feedback,
      lowCutHz: 1e-3,
      sampleRate: 48000,
    }
    const wave = new Float32Array(256)
    const sung = duskWave(hz, cutoffHz, setting, wave)
    const power = wave.reduce((sum, value) => sum + value * value, 0) / wave.length
    return { loud: Math.sqrt(power + (sung * sung) / 2), sung }
  }

  it('comes out of the filter as loud as `SingingLadder::process` lets it', () => {
    // A cutoff between two overtones, and one on the fourth, where Resonance rings it up against the saturator.
    for (const cutoffHz of [1111, 523.2])
      for (const feedback of [0, 1, 2.5, 3.6, 4]) {
        const device = heard(130.8, cutoffHz, feedback)
        expect(Math.abs(drawn(130.8, cutoffHz, feedback).loud / device - 1)).toBeLessThan(0.05)
        expect(drawn(130.8, cutoffHz, feedback).sung).toBe(0)
      }
    // Without the saturator the fourth overtone would stand 22 times as tall at a loop gain of 3.9; it stands 6 times.
    expect(drawn(130.8, 523.2, 3.9).loud).toBeLessThan(0.8)
  })

  it('sings a note of its own from a loop gain of four, as tall as the saturator leaves it', () => {
    // A key next to silent: what comes out is the filter's own sine, so its height is √2 of how loud it is.
    for (const feedback of [4.05, 4.1, 4.2, 4.3]) {
      const device = heard(130.8, 1111, feedback, 1e-4) * Math.SQRT2
      expect(Math.abs(drawn(130.8, 1111, feedback, 1e-4).sung / device - 1)).toBeLessThan(0.06)
    }
    // At the top of Resonance it stands as tall as the sawtooth went in, over what is left of the key.
    const full = drawn(130.8, 1111, 4.3)
    expect(full.sung).toBeGreaterThan(0.9)
    expect(Math.abs(full.loud / heard(130.8, 1111, 4.3) - 1)).toBeLessThan(0.06)
    // An overtone on the cutoff takes the loop for itself: no second note beside it.
    const onIt = drawn(130.8, 523.2, 4.3)
    expect(onIt.sung).toBe(0)
    expect(Math.abs(onIt.loud / heard(130.8, 523.2, 4.3) - 1)).toBeLessThan(0.08)
  })
})

describe('the dusk’s display', () => {
  const { display } = SUBTRACTIVE_INSTRUMENT_FACES.dusk
  const params = paramsOf('dusk')
  const run = (values: Record<string, number>, notes: DisplayNote[], width = 204) =>
    drawnPaths(runDisplay(display, params, 0.1, { values, notes, signal: testSignal(), width }))
  /** The waves laid in the accent: the dry one and the chorus's copies. */
  const waves = (paths: DrawnPath[]): DrawnPath[] =>
    lights(paths).filter((path) => path.kind === 'stroke' && path.points.length > 8)
  const left = (path: DrawnPath): number => Math.min(...path.points.map(([x]) => x))

  it('lights nothing at rest, and the wave with its two copies when a note sounds', () => {
    expect(lights(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    expect(lights(run({}, []))).toHaveLength(0)
    expect(waves(run({}, [note(220, 0.5)]))).toHaveLength(3)
    // With the chorus off there is the dry wave and no copy.
    expect(waves(run({ chorus: 0 }, [note(220, 0.5)]))).toHaveLength(1)
  })

  it('puts a note out when its envelope has ended', () => {
    // Release 2.5 s from 0.7: at −100 dB after 4.04 s.
    expect(lights(run({}, [note(220, 10, 3.9)])).length).toBeGreaterThan(0)
    expect(lights(run({}, [note(220, 10, 4.2)]))).toHaveLength(0)
    expect(lights(run({ release: 0.1 }, [note(220, 10, 0.3)]))).toHaveLength(0)
  })

  it('slides the copies as late as the lines hold them, against each other', () => {
    // A quarter of mode I's cycle after the sweep began both lines are at the middle; before it the left is the shorter.
    const [earlyLeft, , earlyRight] = waves(run({}, [note(220, 0.1)]))
    expect(left(earlyLeft)).toBeLessThan(left(earlyRight))
    const [lateLeft, , lateRight] = waves(run({}, [note(220, 0.9)]))
    expect(left(lateLeft)).toBeGreaterThan(left(earlyLeft))
    expect(left(lateRight)).toBeLessThan(left(earlyRight))
    // I + II moves both the same way.
    const [bothLeft, , bothRight] = waves(run({ chorus: 3 }, [note(220, 0.03)]))
    expect(left(bothLeft)).toBe(left(bothRight))
  })

  it('draws the lit wave as high as the envelope stands', () => {
    const height = (path: DrawnPath): number => {
      const ys = path.points.map(([, y]) => y)
      return Math.max(...ys) - Math.min(...ys)
    }
    const dry = (age: number): DrawnPath =>
      waves(run({ chorus: 0, envelope: 0 }, [note(220, age)]))[0]
    expect(height(dry(0.1))).toBeLessThan(height(dry(0.6)) * 0.6)
    expect(height(dry(8))).toBeCloseTo(height(dry(0.6)) * 0.7, 0)
  })

  it('rides the note the filter sings on the wave from the top of Resonance, and names it', () => {
    const rest = (values: Record<string, number>) =>
      runDisplay(display, params, 0.1, { values: { chorus: 0, envelope: 0, ...values } })
    /** How often the dry wave at rest turns round: the one heavy ink line left of the envelope. */
    const turns = (values: Record<string, number>): number => {
      const wave = drawnPaths(rest(values)).find(
        (path) =>
          path.colour === PLAIN_COLOURS.ink &&
          path.width === 1.5 &&
          path.points.length > 50 &&
          path.points.every(([x]) => x < 134),
      )
      if (!wave) throw new Error('no dry wave')
      const ys = wave.points.map(([, y]) => y)
      let count = 0
      for (let i = 2; i < ys.length; i++)
        if ((ys[i] - ys[i - 1]) * (ys[i - 1] - ys[i - 2]) < 0) count++
      return count
    }
    // Cutoff 2 kHz is 1 kHz for the C under middle C the picture rests on: fifteen cycles of it in the window.
    expect(turns({ resonance: 1, cutoff: 2000 })).toBeGreaterThan(26)
    expect(rest({ resonance: 1, cutoff: 2000 }).words()).toContain('C3 sings B5')
    expect(rest({ resonance: 0.94, cutoff: 2000 }).words()).toContain('C3 sings B5')
    expect(rest({ resonance: 0.9, cutoff: 2000 }).words()).toContain('C3 1 kHz')
    // The loop sings from four times around, Resonance 0.93 of 4.3. Here the cutoff stands at 9 kHz,
    // over every overtone that is drawn: nothing else rings, and so high a note is a band as tall,
    // a line that goes up and down at every step.
    expect(turns({ resonance: 0.92, cutoff: 18000 })).toBeLessThan(10)
    expect(turns({ resonance: 0.94, cutoff: 18000 })).toBeGreaterThan(140)
    expect(rest({ resonance: 0.94, cutoff: 18000 }).words()).toContain('C3 sings C♯9')
    expect(rest({ resonance: 0.92, cutoff: 18000 }).words()).toContain('C3 9 kHz')
  })
})

describe('the ladder bass’s figures', () => {
  const C2 = 65.40639

  it('run the contour as `LadderBass::advance_contour` does', () => {
    // The strike aims at 1.3 and is at the top after 2 ms.
    expect(bassContour(0.001, null, 0.6)).toBeCloseTo(1.3 * (1 - Math.sqrt(0.3 / 1.3)), 5)
    expect(bassContour(0.002, null, 0.6)).toBeCloseTo(1, 5)
    // While a key is down it falls 60 dB in the Decay time, and is let go at −100 dB.
    expect(bassContour(0.002 + 0.3, null, 0.6)).toBeCloseTo(Math.sqrt(0.001), 5)
    expect(bassContour(0.002 + 0.6, null, 0.6)).toBeCloseTo(0.001, 6)
    expect(bassContour(0.002 + 0.6 * 1.6, null, 0.6)).toBeGreaterThan(0)
    expect(bassContour(0.002 + 0.6 * 1.7, null, 0.6)).toBe(0)
    // With Decay at the top it holds under a key, and just under the top it does not.
    expect(bassContour(30, null, 10)).toBe(1)
    expect(bassContour(0.002 + 9.8, null, 9.8)).toBeCloseTo(0.001, 6)
    // With the key up it falls in Decay or in 0.8 s, whichever is the shorter.
    expect(bassContour(0.002 + 0.1 + 0.4, 0.4, 2)).toBeCloseTo(
      Math.exp(-6.907755279 * (0.1 / 2 + 0.4 / 0.8)),
      6,
    )
    expect(bassContour(0.002 + 0.1 + 0.1, 0.1, 0.2)).toBeCloseTo(0.001, 6)
    expect(bassContour(30 + 0.8, 0.8, 10)).toBeCloseTo(0.001, 6)
  })

  it('stand the cutoff where `LadderBass::process` does', () => {
    // At C2 it is the knob, opened by up to five octaves with the contour.
    expect(bassCutoffHz(500, 0.6, 0, C2)).toBeCloseTo(500, 3)
    expect(bassCutoffHz(500, 0.6, 1, C2)).toBeCloseTo(4000, 2)
    expect(bassCutoffHz(500, 1, 0.5, C2)).toBeCloseTo(500 * Math.pow(2, 2.5), 2)
    // It follows the keyboard by half: two octaves up, one octave open.
    expect(bassCutoffHz(500, 0, 0, C2 * 4)).toBeCloseTo(1000, 2)
    expect(bassCutoffHz(12000, 1, 1, C2)).toBe(18000)
  })

  it('blend a sawtooth and a square that run against each other', () => {
    expect(bassWave(0, 0.25)).toBeCloseTo(-0.5, 6)
    expect(bassWave(1, 0.25)).toBeCloseTo(0.7, 6)
    expect(bassWave(1, 0.75)).toBeCloseTo(-0.7, 6)
    // The overtones are those of the wave itself.
    const measured = (wave: number, n: number): number => {
      let cos = 0
      let sin = 0
      for (let i = 0; i < 8192; i++) {
        const t = (i + 0.5) / 8192
        cos += bassWave(wave, t) * Math.cos(2 * Math.PI * n * t)
        sin += bassWave(wave, t) * Math.sin(2 * Math.PI * n * t)
      }
      return Math.hypot(cos, sin) / 4096
    }
    for (const wave of [0, 0.3, 0.7, 1])
      for (const n of [1, 2, 3, 4, 7])
        expect(bassOvertone(wave, n)).toBeCloseTo(measured(wave, n), 3)
    // Near 0.42 the two cancel in the note's own pitch and every odd overtone: an octave up is left.
    expect(bassOvertone(2 / 4.8, 1)).toBeCloseTo(0, 6)
    expect(bassOvertone(2 / 4.8, 3)).toBeCloseTo(0, 6)
    expect(bassOvertone(2 / 4.8, 2)).toBeCloseTo((1 - 2 / 4.8) / Math.PI, 6)
  })

  it('mixes the two waves as `LadderBass::process` does, with their signs', () => {
    // `WaveOsc::next` without its band limiting, and the gains `process` gives the two.
    const mixed = (wave: number, t: number): number =>
      0.2 * (1 - wave) * (2 * t - 1) + 0.2 * 0.7 * wave * (t < 0.5 ? 1 : -1)
    for (const wave of [0, 0.3, 0.42, 0.6, 1])
      for (const t of [0.05, 0.3, 0.55, 0.95])
        expect(0.2 * bassWave(wave, t)).toBeCloseTo(mixed(wave, t), 9)
    // A rising sawtooth has −2 / (π n) of each overtone and a square that starts high +4 / (π n) of the
    // odd ones, so the note's own pitch is |2.4 Wave − 1| · 2 / π strong and its octave (1 − Wave) / π.
    const own = [0.63662, 0.17825, 0.00509, 0.28011, 0.89127]
    const octave = [0.31831, 0.22282, 0.18462, 0.12732, 0]
    ;[0, 0.3, 0.42, 0.6, 1].forEach((wave, index) => {
      expect(bassOvertone(wave, 1)).toBeCloseTo(own[index], 4)
      expect(bassOvertone(wave, 2)).toBeCloseTo(octave[index], 4)
    })
  })

  it('adds the two oscillators as powers, for where they stand against each other is not known', () => {
    const partials = new Float32Array(129)
    // With no sub and no drive the saturator takes a few hundredths: each of the note's overtones
    // (the even partials of the sub's pitch) is √2 of one oscillator's, not twice it.
    for (const wave of [0, 0.3, 0.42, 0.6, 1]) {
      bassPartials(wave, 0, 0, partials)
      for (const n of [1, 2, 3, 4, 9, 20]) {
        const one = 0.2 * bassOvertone(wave, n)
        expect(Math.abs(partials[2 * n] - Math.SQRT2 * one)).toBeLessThan(0.04 * one + 1e-4)
      }
      expect(partials[1]).toBeLessThan(1e-6)
      expect(partials[3]).toBeLessThan(1e-6)
    }
    // Where the two waves cancel, the note's own pitch and its odd overtones are gone and the even ones stay.
    bassPartials(2 / 4.8, 0, 0, partials)
    expect(partials[2]).toBeLessThan(1e-6)
    expect(partials[6]).toBeLessThan(1e-6)
    expect(partials[4]).toBeGreaterThan(0.05)
    // The sub is the first partial, 0.4 strong at full; Drive bends it and puts overtones of its own beside it.
    bassPartials(1, 1, 0, partials)
    expect(partials[1]).toBeGreaterThan(0.36)
    expect(partials[1]).toBeLessThan(0.4)
    const clean = partials[3]
    bassPartials(1, 1, 1, partials)
    expect(partials[3]).toBeGreaterThan(10 * clean)
  })

  it('beat, drive and filter by the device’s own numbers', () => {
    expect(bassBeatHz(0, C2)).toBe(0)
    expect(bassBeatHz(6, C2)).toBeCloseTo(C2 * (Math.pow(2, 6 / 2400) - Math.pow(2, -6 / 2400)), 6)
    expect(bassBeatHz(6, C2 * 2)).toBeCloseTo(2 * bassBeatHz(6, C2), 6)
    // Drive is up to 24 dB into the filter, and half of it comes back off after.
    expect(bassDrive(0)).toEqual({ gain: 1, makeUp: 1.25 })
    expect(bassDrive(1).gain).toBeCloseTo(Math.pow(10, 24 / 20), 4)
    expect(bassDrive(1).makeUp).toBeCloseTo(1.25 * Math.pow(10, -12 / 20), 5)
    // Four stages: 12 dB down at the cutoff, 24 dB an octave from far above it.
    expect(bassLadderGain(0, 0)).toBe(1)
    expect(bassLadderGain(1, 0)).toBeCloseTo(0.25, 6)
    expect(bassLadderGain(64, 0) / bassLadderGain(32, 0)).toBeCloseTo(1 / 16, 2)
    // Emphasis is a loop of up to four times around: it takes from the pass band what it gives the peak.
    expect(bassLadderGain(0, 0.5)).toBeCloseTo(1 / 3, 6)
    expect(bassLadderGain(1, 0.5)).toBeCloseTo(0.5, 6)
    expect(bassLadderGain(1, 1)).toBeGreaterThan(bassLadderGain(1, 0.9))
  })

  it('play one voice from a stack of keys as `note_on` and `note_off` do', () => {
    const play = (notes: DisplayNote[], glide = 0.3) => bassPlay(notes, 0.6, glide, bassVoice())
    const one = play([note(55, 0.5, null, 0.4)])
    expect(one.since).toBeCloseTo(0.5, 6)
    expect(one.up).toBeNull()
    expect(one.touch).toBeCloseTo(0.35 + 0.65 * 0.4, 6)
    expect(play([note(55, 0.5, 0.2)]).up).toBeCloseTo(0.2, 6)
    expect(play([]).since).toBeLessThan(0)

    // A key pressed over a held one strikes again and slides from it in a straight line.
    const slid = play([note(55, 1), note(110, 0.4)])
    expect(slid.since).toBeCloseTo(0.4, 6)
    expect(bassPitch(slid, 0)).toBeCloseTo(Math.log2(55), 6)
    expect(bassPitch(slid, 0.15)).toBeCloseTo(Math.log2(55) + 0.5, 6)
    expect(bassPitch(slid, 0.4)).toBeCloseTo(Math.log2(110), 6)
    // With Glide at zero, or after the first key went up, it starts on pitch.
    expect(bassPitch(play([note(55, 1), note(110, 0.4)], 0), 0)).toBeCloseTo(Math.log2(110), 6)
    expect(bassPitch(play([note(55, 1, 0.6), note(110, 0.4)]), 0)).toBeCloseTo(Math.log2(110), 6)
    // The keys of a chord out of silence land together: the last plays, and has nothing to slide from.
    expect(bassPitch(play([note(55, 0.5), note(110, 0.5)]), 0)).toBeCloseTo(Math.log2(110), 6)
    // Over a note that still sounds they slide.
    const over = play([note(82.4, 0.7, 0.6), note(55, 0.5), note(110, 0.5)])
    expect(bassPitch(over, 0)).toBeCloseTo(Math.log2(55), 6)

    // The top key up: back to the one still held, with no new strike.
    const back = play([note(55, 1), note(110, 0.6, 0.2)], 0.1)
    expect(back.since).toBeCloseTo(0.6, 6)
    expect(back.up).toBeNull()
    expect(bassPitch(back, 0.4)).toBeCloseTo(Math.log2(110), 6)
    expect(bassPitch(back, 0.45)).toBeCloseTo(Math.log2(110) - 0.5, 6)
    expect(bassPitch(back, 0.6)).toBeCloseTo(Math.log2(55), 6)
    // The last key up lets the contour go.
    expect(play([note(55, 1, 0.1), note(110, 0.6, 0.2)]).up).toBeCloseTo(0.1, 6)
  })
})

describe('the ladder bass’s display', () => {
  const { display } = SUBTRACTIVE_INSTRUMENT_FACES['ladder-bass']
  const params = paramsOf('ladder-bass')
  const run = (values: Record<string, number>, notes: DisplayNote[], width = 204) =>
    drawnPaths(runDisplay(display, params, 0.1, { values, notes, signal: testSignal(), width }))
  /** The lit line of the cutoff, from the strike to now. */
  const line = (paths: DrawnPath[]): DrawnPath => {
    const found = lights(paths).find((path) => path.kind === 'stroke' && path.width === 1.5)
    if (!found) throw new Error('no lit line')
    return found
  }
  const end = (path: DrawnPath): [number, number] => path.points[path.points.length - 1]
  /** How many heights the lit rungs stand at. */
  const heights = (paths: DrawnPath[]): number =>
    new Set(
      lights(paths)
        .filter((path) => path.width === 1 && path.points.length > 2)
        .flatMap((path) => path.points.map(([, y]) => y.toFixed(2))),
    ).size

  it('lights nothing at rest', () => {
    for (const width of [128, 204])
      expect(lights(drawnPaths(drawDisplay(display, params, { width })))).toHaveLength(0)
    expect(lights(run({}, []))).toHaveLength(0)
  })

  it('lights a note until its contour is silent', () => {
    // Decay 0.6 s: at −100 dB one second after the strike, key down or not.
    expect(lights(run({}, [note(65.4, 0.9)])).length).toBeGreaterThan(0)
    expect(lights(run({}, [note(65.4, 1.1)]))).toHaveLength(0)
    expect(lights(run({}, [note(98, 0.9, 0.7)])).length).toBeGreaterThan(0)
    expect(lights(run({}, [note(98, 1.3, 1.1)]))).toHaveLength(0)
    // With Decay at the top it holds for as long as the key, and falls in 0.8 s after it.
    expect(lights(run({ decay: 10 }, [note(65.4, 15)])).length).toBeGreaterThan(0)
    expect(lights(run({ decay: 10 }, [note(65.4, 15, 1.2)])).length).toBeGreaterThan(0)
    expect(lights(run({ decay: 10 }, [note(65.4, 15, 1.5)]))).toHaveLength(0)
  })

  it('runs the lit line as far as the note is old, down as the filter closes', () => {
    const young = end(line(run({}, [note(65.4, 0.05)])))
    const old = end(line(run({}, [note(65.4, 0.4)])))
    expect(old[0]).toBeGreaterThan(young[0] + 20)
    expect(old[1]).toBeGreaterThan(young[1] + 5)
    // The note's place across the picture is its age on a scale of ratios from 3 ms to 12 s.
    expect(old[0]).toBeCloseTo(5 + (Math.log(0.4 / 0.003) / Math.log(4000)) * 194, 0)
    // With Contour at zero the filter stays where Cutoff puts it.
    const flat = line(run({ contour: 0 }, [note(65.4, 0.4)]))
    expect(new Set(flat.points.map(([, y]) => y.toFixed(3))).size).toBe(1)
    // A higher key stands the filter higher, by half its distance from C2.
    const high = end(line(run({ contour: 0 }, [note(261.6, 0.4)])))
    expect(high[1]).toBeLessThan(end(flat)[1] - 3)
  })

  it('bends the rungs of a note that slides', () => {
    const keys = [note(55, 1), note(110, 0.2)]
    expect(heights(run({ decay: 3, glide: 0.5 }, keys))).toBeGreaterThan(
      heights(run({ decay: 3, glide: 0 }, keys)) * 2,
    )
  })

  it('draws no rung where Wave cancels an overtone', () => {
    /** Whether a rung stands at that pitch at rest: a thin ink line along time at its height (25 Hz to 18 kHz over 64 px from 79 up). */
    const rung = (wave: number, hz: number): boolean => {
      const y = 79 - (Math.log(hz / 25) / Math.log(18000 / 25)) * 64
      const drawn = drawDisplay(display, params, { values: { wave, sub: 0 }, width: 204 })
      return drawnPaths(drawn).some(
        (path) =>
          path.kind === 'stroke' &&
          path.colour === PLAIN_COLOURS.ink &&
          path.width === 1 &&
          path.points.filter(([, at]) => Math.abs(at - y) < 0.01).length >= 2,
      )
    }
    const C2 = 65.40639
    // A sawtooth has every overtone, a square the odd ones only.
    expect(rung(0, C2)).toBe(true)
    expect(rung(0, 2 * C2)).toBe(true)
    expect(rung(1, C2)).toBe(true)
    expect(rung(1, 2 * C2)).toBe(false)
    expect(rung(1, 3 * C2)).toBe(true)
    // Between them the two run against each other: at 0.3 the note's own pitch is weaker than its octave
    // and still there; near 0.42 it is gone with every odd overtone, a sawtooth an octave up; at 0.6 it is back.
    expect(rung(0.3, C2)).toBe(true)
    expect(rung(2 / 4.8, C2)).toBe(false)
    expect(rung(2 / 4.8, 3 * C2)).toBe(false)
    expect(rung(2 / 4.8, 2 * C2)).toBe(true)
    expect(rung(2 / 4.8, 4 * C2)).toBe(true)
    expect(rung(0.6, C2)).toBe(true)
  })

  it('stands its handles on the line, and a drag sets Cutoff and Decay', () => {
    const settings: Record<string, number>[] = [{}, { cutoff: 200, decay: 10 }, { decay: 0.1 }]
    for (const values of settings) {
      const view = viewOf(display, params, { values, width: 204 })
      const [cutoff, decay] = display.handles?.(view) ?? []
      expect(cutoff.drag(cutoff.x, cutoff.y).cutoff).toBeCloseTo(view.value('cutoff'), 2)
      expect(cutoff.drag(cutoff.x, cutoff.y - 10).cutoff).toBeGreaterThan(view.value('cutoff'))
      expect(decay.drag(decay.x, decay.y).decay).toBeCloseTo(view.value('decay'), 3)
      expect(decay.drag(decay.x + 10, decay.y).decay).toBeGreaterThan(view.value('decay'))
    }
  })
})

describe('the aurora’s figures', () => {
  const C4 = 261.6256
  const setting: AuroraSetting = { brilliance: 1000, lowCut: 40, contour: 1, swell: 1 }

  it('shape the envelope and the contour as `Aurora::control` does', () => {
    const times = auroraTimes(0.4, 3)
    expect(times).toEqual({ attack: 0.4, decay: 0.01, sustain: 1, release: 3 })
    expect(adsrLevel(times, 0.4, null)).toBeCloseTo(1, 5)
    expect(adsrLevel(times, 20, null)).toBe(1)
    expect(adsrLevel(times, 20, 3)).toBeCloseTo(0.001, 6)
    // Three octaves under, in a straight line to two over at the Attack time, then back with a time of 0.3 s plus Attack.
    expect(auroraShape(0, null, 0.4, 3)).toBeCloseTo(-3, 6)
    expect(auroraShape(0.2, null, 0.4, 3)).toBeCloseTo(-0.5, 6)
    expect(auroraShape(0.4, null, 0.4, 3)).toBeCloseTo(2, 6)
    expect(auroraShape(0.4 + 0.7, null, 0.4, 3)).toBeCloseTo(2 / Math.E, 6)
    // Let go, it glides back to where it started with two fifths of Release as its time.
    expect(auroraShape(0.4, 1.2, 0.4, 3)).toBeCloseTo(-3 + 5 / Math.E, 6)
    expect(auroraShape(0.2, 1.2, 0.4, 3)).toBeCloseTo(-3 + 2.5 / Math.E, 6)
    expect(auroraShape(0.4, 60, 0.4, 3)).toBeCloseTo(-3, 6)
  })

  it('swell once the attack is done, in level and in brightness', () => {
    expect(auroraSwell(0.3, 0.4)).toBe(0)
    expect(auroraSwell(0.4 + 1.6, 0.4)).toBeCloseTo(1 - 1 / Math.E, 6)
    expect(auroraSwell(60, 0.4)).toBeCloseTo(1, 6)
    // More Swell starts the note lower; the plateau is the same.
    expect(auroraSwellLevel(1, 0)).toBeCloseTo(0.4, 6)
    expect(auroraSwellLevel(0.5, 0)).toBeCloseTo(0.7, 6)
    expect(auroraSwellLevel(0, 0)).toBe(1)
    expect(auroraSwellLevel(1, 1)).toBe(1)
    expect(auroraVelocity(0)).toBeCloseTo(0.35, 6)
    expect(auroraVelocity(1)).toBe(1)
  })

  it('stand the corners where `Aurora::tune` does', () => {
    expect(auroraLowpassHz(setting, C4, 1, 0, 0)).toBeCloseTo(1000, 3)
    expect(auroraLowpassHz(setting, C4, 1, 2, 0)).toBeCloseTo(4000, 2)
    expect(auroraLowpassHz(setting, C4, 1, 0, 1)).toBeCloseTo(1000 * Math.pow(2, 1.5), 2)
    expect(auroraLowpassHz({ ...setting, contour: 0.5, swell: 0 }, C4, 1, 2, 1)).toBeCloseTo(
      2000,
      2,
    )
    // Both corners follow the keyboard by half; a soft note closes the low pass by up to an octave and a half.
    expect(auroraLowpassHz(setting, C4 * 4, 1, 0, 0)).toBeCloseTo(2000, 2)
    expect(auroraLowpassHz(setting, C4, 0, 0, 0)).toBeCloseTo(1000 * Math.pow(2, -1.5), 2)
    expect(auroraLowpassHz({ ...setting, brilliance: 16000 }, C4, 1, 2, 1)).toBe(16000)
    expect(auroraHighpassHz(40, C4)).toBeCloseTo(40, 4)
    expect(auroraHighpassHz(40, C4 * 4)).toBeCloseTo(80, 4)
    expect(auroraQ(0)).toBeCloseTo(0.7071, 6)
    expect(auroraQ(1)).toBeCloseTo(6, 1)
    // `Aurora::resonate` trims the level as the filters ring: by a third at the top.
    expect(auroraTrim(0)).toBe(1)
    expect(auroraTrim(0.5)).toBeCloseTo(0.8, 6)
    expect(auroraTrim(1)).toBeCloseTo(2 / 3, 6)
  })

  it('ring from 1.4 kHz down to 35 Hz, and beat by the gap between the layers', () => {
    expect(auroraZing(0, 0.4)).toBe(1)
    expect(auroraZing(0.35 + 1.2 * 0.4, 0.4)).toBeCloseTo(1 / Math.E, 6)
    expect(auroraRingHz(1)).toBeCloseTo(35 * Math.pow(2, 5.32), 3)
    expect(auroraRingHz(1)).toBeGreaterThan(1390)
    expect(auroraRingHz(0)).toBe(35)
    expect(auroraBeatHz(0, C4)).toBe(0)
    expect(auroraBeatHz(8, C4)).toBeCloseTo((C4 * 8 * Math.LN2) / 1200, 6)
  })

  it('give a note a voice until its envelope ends, and take the quietest when eight are busy', () => {
    const voices = (notes: DisplayNote[]): AuroraVoice[] => {
      const into: AuroraVoice[] = []
      return into.slice(0, auroraVoices(notes, 0.4, 3, into, []))
    }
    expect(voices([note(220, 2)])).toEqual([
      { hz: 220, gain: 1, held: 2, released: null, envelope: 1 },
    ])
    // Release 3 s: let go at −100 dB after 5 s.
    expect(voices([note(220, 10, 4.9)])).toHaveLength(1)
    expect(voices([note(220, 10, 4.9)])[0].held).toBeCloseTo(5.1, 6)
    expect(voices([note(220, 10, 5.1)])).toHaveLength(0)

    const eight = [9, 8, 7, 6, 5, 4, 3, 2].map((age, index) => note(100 + 10 * index, age))
    expect(voices(eight)).toHaveLength(8)
    // A ninth takes the one that is fading.
    const fading = eight.map((each, index) => (index === 2 ? { ...each, released: 1.5 } : each))
    const afterFading = voices([...fading, note(400, 0.5)])
    expect(afterFading.map((voice) => voice.hz)).toEqual([100, 110, 130, 140, 150, 160, 170, 400])
    // With none fading it takes the quietest: here the one still in its attack.
    const late = [...eight.slice(0, 7), note(300, 1.1)]
    const afterLate = voices([...late, note(400, 1)])
    expect(afterLate.map((voice) => voice.hz)).toEqual([100, 110, 120, 130, 140, 150, 160, 400])
  })
})

describe('the aurora’s display', () => {
  const { display } = SUBTRACTIVE_INSTRUMENT_FACES.aurora
  const params = paramsOf('aurora')
  const run = (values: Record<string, number>, notes: DisplayNote[], width = 204) =>
    drawnPaths(runDisplay(display, params, 0.1, { values, notes, signal: testSignal(), width }))
  /** The bar a note stands as, across its band. */
  const bars = (paths: DrawnPath[]): DrawnPath[] =>
    lights(paths).filter((path) => path.kind === 'stroke' && path.width === 2)
  const across = (path: DrawnPath): number => path.points[0][0]
  /** The dots laid in the accent: one on each note's low pass, one more on the ring while it rings. */
  const dots = (paths: DrawnPath[]): number =>
    lights(paths).filter((path) => path.kind === 'fill' && path.points.length === 0).length

  it('lights nothing at rest', () => {
    for (const width of [128, 204])
      expect(lights(drawnPaths(drawDisplay(display, params, { width })))).toHaveLength(0)
    expect(lights(run({}, []))).toHaveLength(0)
  })

  it('lights a note until its envelope has ended', () => {
    expect(bars(run({}, [note(220, 30)]))).toHaveLength(1)
    // Release 3 s: gone 5 s after the key went up.
    expect(bars(run({}, [note(220, 10, 4.8)]))).toHaveLength(1)
    expect(lights(run({}, [note(220, 10, 5.2)]))).toHaveLength(0)
    expect(lights(run({ release: 0.05 }, [note(220, 1, 0.1)]))).toHaveLength(0)
    expect(bars(run({}, [note(196, 1), note(261.6, 1), note(392, 1)]))).toHaveLength(3)
  })

  it('moves a note through its attack and its held key, and on when it is let go', () => {
    const at = (age: number, released: number | null = null): number =>
      across(bars(run({}, [note(220, age, released)]))[0])
    expect(at(0.2)).toBeLessThan(at(0.4))
    expect(at(0.4)).toBeLessThan(at(2))
    expect(at(2)).toBeLessThan(at(6.4))
    // A key held longer than the picture has room for waits where the release begins.
    expect(at(30)).toBe(at(6.4))
    expect(at(30, 0.5)).toBeGreaterThan(at(30) + 5)
    expect(at(30, 2)).toBeGreaterThan(at(30, 0.5))
  })

  it('stands the top of a note’s bar on its low pass', () => {
    const height = (values: Record<string, number>, age: number, gain = 1): number =>
      top(bars(run(values, [note(261.6256, age, null, gain)]))[0])
    // It starts under, is over at the Attack time and settles; the swell lifts it again.
    expect(height({}, 0.05)).toBeGreaterThan(height({}, 0.4) + 10)
    expect(height({ swell: 0 }, 0.4)).toBeLessThan(height({ swell: 0 }, 6))
    expect(height({ contour: 0 }, 0.4)).toBeGreaterThan(height({ contour: 0 }, 6))
    // With neither it stays where Brilliance puts it, and a soft note stands lower.
    const still = { contour: 0, swell: 0 }
    expect(height(still, 0.05)).toBe(height(still, 6))
    expect(height(still, 1, 0.2)).toBeGreaterThan(height(still, 1) + 3)
    expect(height({ ...still, brilliance: 4000 }, 1)).toBeLessThan(height(still, 1) - 5)
  })

  it('marks the ring on a note for as long as it rings', () => {
    expect(dots(run({ ring: 0 }, [note(220, 0.1)]))).toBe(1)
    expect(dots(run({ ring: 1 }, [note(220, 0.1)]))).toBe(2)
    expect(dots(run({ ring: 1 }, [note(220, 20)]))).toBe(1)
  })

  it('stands its handles on the picture, and a drag sets Attack and Brilliance', () => {
    const settings: Record<string, number>[] = [{}, { attack: 2, brilliance: 300 }, { swell: 0 }]
    for (const values of settings) {
      const view = viewOf(display, params, { values, width: 204 })
      const [attack, brilliance] = display.handles?.(view) ?? []
      expect(attack.drag(attack.x, attack.y).attack).toBeCloseTo(view.value('attack'), 4)
      expect(attack.drag(attack.x + 10, attack.y).attack).toBeGreaterThan(view.value('attack'))
      expect(brilliance.drag(brilliance.x, brilliance.y).brilliance).toBeCloseTo(
        view.value('brilliance'),
        1,
      )
      expect(brilliance.drag(brilliance.x, brilliance.y - 10).brilliance).toBeGreaterThan(
        view.value('brilliance'),
      )
    }
  })
})
