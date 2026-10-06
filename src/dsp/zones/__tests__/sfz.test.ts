import { describe, expect, it } from 'vitest'

import { parseSfz, writeSfz } from '../sfz'
import { normalizeZoneMap, type ZoneMap } from '../zone-map'

const resolved = (map: ZoneMap) => normalizeZoneMap(map).map.zones

describe('parseSfz', () => {
  it('reads a region: sample, key range, root, velocity range, tune, volume, pan', () => {
    const { map, unsupported, warnings } = parseSfz(
      '<region> sample=piano/C4.wav lokey=58 hikey=62 pitch_keycenter=60 lovel=1 hivel=80 tune=-12 volume=-3.5 pan=50',
    )
    expect(map.zones).toEqual([
      {
        sample: 'piano/C4.wav',
        rootKey: 60,
        loKey: 58,
        hiKey: 62,
        loVel: 1,
        hiVel: 80,
        tuneCents: -12,
        gainDb: -3.5,
        pan: 0.5,
      },
    ])
    expect(unsupported).toEqual([])
    expect(warnings).toEqual([])
  })

  it('gives a region without ranges the whole keyboard on middle C', () => {
    expect(parseSfz('<region> sample=a.wav').map.zones).toEqual([
      { sample: 'a.wav', rootKey: 60, loKey: 0, hiKey: 127 },
    ])
  })

  it('reads key as low key, high key and root at once, and note names with middle C as c4', () => {
    const { map } = parseSfz(
      [
        '<region> sample=a.wav key=c4',
        '<region> sample=b.wav lokey=F#3 hikey=bb3 pitch_keycenter=a3',
      ].join('\n'),
    )
    expect(map.zones).toEqual([
      { sample: 'a.wav', rootKey: 60, loKey: 60, hiKey: 60 },
      { sample: 'b.wav', rootKey: 57, loKey: 54, hiKey: 58 },
    ])
  })

  it('inherits from global, master and group, the nearest level winning', () => {
    const { map } = parseSfz(`
      <global> volume=-6 lovel=10 hivel=100
      <master> tune=10
      <group> lokey=40 hikey=50 pitch_keycenter=45 volume=-3
      <region> sample=a.wav
      <region> sample=b.wav hikey=47 volume=0
      <group> key=60
      <region> sample=c.wav
      <master>
      <region> sample=d.wav
      <global>
      <region> sample=e.wav
    `)
    expect(map.zones).toEqual([
      {
        sample: 'a.wav',
        rootKey: 45,
        loKey: 40,
        hiKey: 50,
        loVel: 10,
        hiVel: 100,
        tuneCents: 10,
        gainDb: -3,
      },
      { sample: 'b.wav', rootKey: 45, loKey: 40, hiKey: 47, loVel: 10, hiVel: 100, tuneCents: 10 },
      // A new group starts over; the master and the global above it still hold.
      {
        sample: 'c.wav',
        rootKey: 60,
        loKey: 60,
        hiKey: 60,
        loVel: 10,
        hiVel: 100,
        tuneCents: 10,
        gainDb: -6,
      },
      // A new master drops the old one's tune and the group.
      { sample: 'd.wav', rootKey: 60, loKey: 0, hiKey: 127, loVel: 10, hiVel: 100, gainDb: -6 },
      // A new global drops everything.
      { sample: 'e.wav', rootKey: 60, loKey: 0, hiKey: 127 },
    ])
  })

  it('lets a key in a region win over a range in its group, and the other way round', () => {
    const { map } = parseSfz(`
      <group> lokey=10 hikey=20 pitch_keycenter=15
      <region> sample=a.wav key=64
      <group> key=64
      <region> sample=b.wav lokey=60
    `)
    expect(map.zones).toEqual([
      { sample: 'a.wav', rootKey: 64, loKey: 64, hiKey: 64 },
      { sample: 'b.wav', rootKey: 64, loKey: 60, hiKey: 64 },
    ])
  })

  it('puts default_path in front of every sample and turns backslashes round', () => {
    const { map, unsupported } = parseSfz(`
      <control> default_path=..\\Samples\\ set_cc7=100
      <region> sample=Soft\\C4.wav
      <control> default_path=Other/
      <region> sample=D4.wav
    `)
    expect(map.zones.map((zone) => zone.sample)).toEqual(['../Samples/Soft/C4.wav', 'Other/D4.wav'])
    expect(unsupported).toEqual([{ name: '<control> set_cc7', count: 1 }])
  })

  it('keeps spaces in a sample name, up to the next opcode', () => {
    const { map } = parseSfz('<region> sample=My Piano/Grand C 4.wav lokey=60 hikey=61')
    expect(map.zones[0]).toMatchObject({ sample: 'My Piano/Grand C 4.wav', loKey: 60, hiKey: 61 })
  })

  it('reads loop points (the last frame becomes one past it), the mode and a crossfade in seconds', () => {
    const { map, warnings } = parseSfz(`
      <region> sample=a.wav loop_mode=loop_continuous loop_start=1000 loop_end=4999 loop_crossfade=0.05
      <region> sample=b.wav loopmode=loop_sustain loopstart=10 loopend=19
      <region> sample=c.wav loop_mode=no_loop loop_start=10 loop_end=20
      <region> sample=d.wav offset=100 end=999
    `)
    expect(map.zones.map((zone) => zone.loop)).toEqual([
      { start: 1000, end: 5000, crossfadeSec: 0.05 },
      { start: 10, end: 20, mode: 'sustain' },
      undefined,
      undefined,
    ])
    expect(map.zones[3]).toMatchObject({ start: 100, end: 1000 })
    expect(warnings).toEqual([])
  })

  it('says so when a loop has no points, or points and no mode', () => {
    const { map, warnings } = parseSfz(`
      <region> sample=a.wav loop_mode=loop_continuous
      <region> sample=b.wav loop_start=10 loop_end=20
    `)
    expect(map.zones[0].loop).toEqual({})
    expect(map.zones[1].loop).toBeUndefined()
    expect(warnings).toEqual([
      'a.wav: loop points kept in the audio file are not read; the whole sound loops',
      'b.wav: loop points without a loop_mode do not loop',
    ])
  })

  it('reads seq_length and seq_position as round robin: one group for each set of keys and velocities', () => {
    const { map } = parseSfz(`
      <group> key=60 seq_length=3
      <region> sample=a1.wav seq_position=1
      <region> sample=a2.wav seq_position=2
      <region> sample=a3.wav seq_position=3
      <group> key=62 seq_length=2
      <region> sample=b1.wav
      <region> sample=b2.wav seq_position=2
    `)
    expect(map.zones.map((zone) => zone.roundRobin)).toEqual([
      { group: 1, position: 1, length: 3 },
      { group: 1, position: 2, length: 3 },
      { group: 1, position: 3, length: 3 },
      { group: 2, position: 1, length: 2 },
      { group: 2, position: 2, length: 2 },
    ])
  })

  it('adds transpose to tune, amplitude to volume, and reads pitch_keytrack', () => {
    const { map, warnings } = parseSfz(`
      <region> sample=a.wav transpose=-2 tune=15 amplitude=50 volume=-1
      <region> sample=b.wav pitch_keytrack=0
      <region> sample=c.wav pitch_keytrack=1200
    `)
    expect(map.zones[0].tuneCents).toBe(-185)
    expect(map.zones[0].gainDb).toBeCloseTo(-7.0206, 3)
    expect(map.zones[1].pitchTrack).toBe(0)
    expect(map.zones[2].pitchTrack).toBe(1)
    expect(warnings).toEqual(['pitch_keytrack=1200 was brought into 0..100'])
  })

  it('applies note_offset and octave_offset from <control>', () => {
    const { map } = parseSfz(
      '<control> note_offset=1 octave_offset=-1 <region> sample=a.wav key=60',
    )
    expect(map.zones[0]).toMatchObject({ rootKey: 49, loKey: 49, hiKey: 49 })
  })

  it('strips comments and substitutes #define variables, the longest name first', () => {
    const { map } = parseSfz(`
      // a comment line
      #define $KEY 60
      #define $KEY2 72
      #define $DIR samples
      /* a block
         comment */
      <region> sample=$DIR/a.wav key=$KEY // trailing comment
      <region> sample=$DIR/b.wav key=$KEY2
    `)
    expect(map.zones).toEqual([
      { sample: 'samples/a.wav', rootKey: 60, loKey: 60, hiKey: 60 },
      { sample: 'samples/b.wav', rootKey: 72, loKey: 72, hiKey: 72 },
    ])
  })

  it('reads #include through the resolver it is given, and says so when it cannot', () => {
    const files: Record<string, string> = {
      'keys.sfz': '<region> sample=a.wav key=$ROOT\n#include "more.sfz"',
      'more.sfz': '<region> sample=b.wav key=61',
      'loop.sfz': '#include "loop.sfz"',
    }
    const main = '#define $ROOT 60\n<group> volume=-2\n#include "keys.sfz"\n#include "missing.sfz"'
    const read = parseSfz(main, { include: (path) => files[path] })
    expect(read.map.zones.map((zone) => [zone.sample, zone.rootKey, zone.gainDb])).toEqual([
      ['a.wav', 60, -2],
      ['b.wav', 61, -2],
    ])
    expect(read.warnings).toEqual(['#include "missing.sfz" was not read'])
    expect(parseSfz(main).warnings).toContain('#include "keys.sfz" was not read')
    // A file that includes itself ends, with a warning.
    expect(parseSfz('#include "loop.sfz"', { include: (path) => files[path] }).warnings).toEqual([
      '#include "loop.sfz" was not read',
      'no playable region was found',
    ])
  })

  it('collects what it cannot use, by name and count, and still reads the zones', () => {
    const { map, unsupported } = parseSfz(`
      <global> ampeg_decay=1 cutoff=2000
      <region> sample=a.wav key=60 fil_type=lpf_2p
      <region> sample=b.wav key=61 loop_mode=one_shot
      <region> sample=c.wav key=62 trigger=release
      <region> sample=*sine key=63
      <region> sample=d.wav pitch_keycenter=sample
      <curve> curve_index=1 v000=0 v127=1
      <effect> type=reverb
    `)
    expect(map.zones.map((zone) => zone.sample)).toEqual(['a.wav', 'b.wav', 'd.wav'])
    expect(unsupported).toEqual([
      { name: 'ampeg_decay', count: 5 },
      { name: 'cutoff', count: 5 },
      { name: 'fil_type', count: 1 },
      { name: 'loop_mode=one_shot', count: 1 },
      { name: 'trigger=release', count: 1 },
      { name: 'sample=*sine', count: 1 },
      { name: 'pitch_keycenter=sample', count: 1 },
      { name: '<curve>', count: 1 },
      { name: '<effect>', count: 1 },
    ])
  })

  it('offers the envelope a file sets for the whole instrument as hints', () => {
    const uniform = parseSfz(
      '<global> ampeg_attack=0.01 ampeg_release=1.5 <region> sample=a.wav <region> sample=b.wav',
    )
    expect(uniform.hints).toEqual({ attackSec: 0.01, releaseSec: 1.5 })
    expect(uniform.warnings).toEqual([])
    const mixed = parseSfz(
      '<region> sample=a.wav ampeg_release=1 <region> sample=b.wav ampeg_release=1 <region> sample=c.wav ampeg_release=3',
    )
    expect(mixed.hints).toEqual({ releaseSec: 1 })
    expect(mixed.warnings).toEqual([
      'ampeg_release differs between regions; the instrument has one release',
    ])
  })

  it('leaves out regions that are switched off or have no sample', () => {
    const { map, warnings } = parseSfz(`
      <region> sample=a.wav lokey=-1 hikey=-1
      <region> sample=b.wav end=-1
      <region> key=60
      <region> sample=c.wav
    `)
    expect(map.zones.map((zone) => zone.sample)).toEqual(['c.wav'])
    expect(warnings).toEqual(['1 region(s) without a sample were left out'])
  })

  it('takes Windows line ends, a byte-order mark, upper-case headers and a header against its opcode', () => {
    const { map } = parseSfz(
      '\uFEFF<GROUP>lokey=10\r\n<Region>sample=a.wav\r<region>sample=b.wav hikey=20\r\n',
    )
    expect(map.zones).toEqual([
      { sample: 'a.wav', rootKey: 60, loKey: 10, hiKey: 127 },
      { sample: 'b.wav', rootKey: 60, loKey: 10, hiKey: 20 },
    ])
  })

  it('does not throw on text that is no SFZ, and says what it could not read', () => {
    for (const text of [
      '',
      '   \n\n',
      'hello world',
      '<<<>>>===',
      '<region>',
      'sample=a.wav',
      '\u0000\u0001',
      '<region> lokey=abc sample=a.wav volume=loud',
    ]) {
      expect(() => parseSfz(text)).not.toThrow()
    }
    expect(parseSfz(undefined as unknown as string).map.zones).toEqual([])
    expect(parseSfz('hello world').warnings).toEqual([
      'text that is no opcode: hello world',
      'no playable region was found',
    ])
    const odd = parseSfz('<region> lokey=abc sample=a.wav volume=loud <weird> x=1')
    expect(odd.map.zones).toEqual([{ sample: 'a.wav', rootKey: 60, loKey: 0, hiKey: 127 }])
    expect(odd.warnings).toEqual([
      'lokey=abc is not a key',
      'volume=loud is not a number',
      '<weird> is not a section this reader knows',
    ])
  })

  it('names the instrument when asked to', () => {
    expect(parseSfz('<region> sample=a.wav', { name: 'Upright' }).map.name).toBe('Upright')
  })
})

describe('writeSfz', () => {
  const instrument: ZoneMap = {
    name: 'Upright',
    zones: [
      { sample: 'Samples/C3 soft.wav', rootKey: 48, loKey: 0, hiKey: 53, loVel: 0, hiVel: 63 },
      {
        sample: 'Samples/C3 hard.wav',
        rootKey: 48,
        loKey: 0,
        hiKey: 53,
        loVel: 64,
        hiVel: 127,
        tuneCents: -7.5,
        gainDb: -2.25,
        pan: -0.25,
      },
      {
        sample: 'Samples/C4.wav',
        rootKey: 60,
        loKey: 54,
        hiKey: 65,
        start: 12,
        end: 40000,
        loop: { start: 20000, end: 39000, crossfadeSec: 0.02, mode: 'sustain' },
      },
      {
        sample: 'Samples/C5 a.wav',
        rootKey: 72,
        loKey: 66,
        hiKey: 127,
        roundRobin: { group: 1, position: 1, length: 2 },
      },
      {
        sample: 'Samples/C5 b.wav',
        rootKey: 72,
        loKey: 66,
        hiKey: 127,
        roundRobin: { group: 1, position: 2, length: 2 },
      },
      {
        sample: 'Samples/click.wav',
        rootKey: 30,
        loKey: 30,
        hiKey: 30,
        pitchTrack: 0,
        tuneCents: 250,
        loop: { start: 4 },
      },
    ],
  }

  it('writes one region a zone, with the shared folder as default_path', () => {
    const { text, warnings } = writeSfz(instrument)
    expect(text).toBe(
      [
        '// Upright',
        '<control> default_path=Samples/',
        '<region> sample=C3 soft.wav lokey=0 hikey=53 pitch_keycenter=48 lovel=0 hivel=63',
        '<region> sample=C3 hard.wav lokey=0 hikey=53 pitch_keycenter=48 lovel=64 hivel=127 tune=-7.5 volume=-2.25 pan=-25',
        '<region> sample=C4.wav lokey=54 hikey=65 pitch_keycenter=60 offset=12 end=39999 loop_mode=loop_sustain loop_start=20000 loop_end=38999 loop_crossfade=0.02',
        '<region> sample=C5 a.wav lokey=66 hikey=127 pitch_keycenter=72 seq_length=2 seq_position=1',
        '<region> sample=C5 b.wav lokey=66 hikey=127 pitch_keycenter=72 seq_length=2 seq_position=2',
        '<region> sample=click.wav lokey=30 hikey=30 pitch_keycenter=30 transpose=2 tune=50 pitch_keytrack=0 loop_mode=loop_continuous loop_start=4',
        '',
      ].join('\n'),
    )
    expect(warnings).toEqual([
      'Samples/click.wav: a loop to the end of the sound is written without loop_end',
    ])
  })

  it('reads back as the same zones', () => {
    const { map, unsupported, warnings } = parseSfz(writeSfz(instrument).text)
    expect(resolved(map)).toEqual(resolved(instrument))
    expect(unsupported).toEqual([])
    expect(warnings).toEqual([])
  })

  it('reads its own output back the same a second time', () => {
    const once = writeSfz(instrument).text
    expect(writeSfz(parseSfz(once, { name: 'Upright' }).map).text).toBe(once)
  })

  it('writes a crossfade in frames as seconds when it knows the rate, and says so when it does not', () => {
    const map: ZoneMap = {
      zones: [{ sample: 'a.wav', rootKey: 60, loop: { start: 100, end: 2000, crossfade: 441 } }],
    }
    const known = writeSfz(map, { sampleRate: () => 44100 })
    expect(known.text).toContain('loop_crossfade=0.01')
    expect(parseSfz(known.text).map.zones[0].loop).toEqual({
      start: 100,
      end: 2000,
      crossfadeSec: 0.01,
    })
    const unknown = writeSfz(map)
    expect(unknown.text).not.toContain('loop_crossfade')
    expect(unknown.warnings).toEqual([
      'a.wav: its crossfade is in frames and its sample rate is not known; left out',
    ])
  })

  it('warns about a file name that will not read back, and about zones it had to leave out', () => {
    const { text, warnings } = writeSfz({
      zones: [
        { sample: 'take key=3.wav', rootKey: 60 },
        { sample: '', rootKey: 60 },
      ],
    })
    expect(text).toBe('<region> sample=take key=3.wav lokey=60 hikey=60 pitch_keycenter=60\n')
    expect(warnings).toEqual([
      'zone 1: no sample',
      '"take key=3.wav" will not read back as one file name',
    ])
  })

  it('writes an empty instrument as an empty file', () => {
    expect(writeSfz({ zones: [] })).toEqual({ text: '\n', warnings: [] })
  })
})
