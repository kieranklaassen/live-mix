import { describe, expect, it } from 'vitest'

import { parseDspreset, writeDspreset } from '../dspreset'
import { parseSfz, writeSfz } from '../sfz'
import { decodeXmlText, parseXml } from '../xml'
import { normalizeZoneMap, type ZoneMap } from '../zone-map'

const resolved = (map: ZoneMap) => normalizeZoneMap(map).map.zones

const preset = (groups: string, attributes = '') =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<DecentSampler minVersion="1.0.0">\n<groups ${attributes}>\n${groups}\n</groups>\n</DecentSampler>`

describe('parseXml', () => {
  it('reads elements and attributes, and skips everything else', () => {
    const { roots, warnings } = parseXml(`
      <?xml version="1.0"?>
      <!DOCTYPE thing>
      <!-- a comment with <tags> in it -->
      <a one="1" two='2 "quoted"' three = "a &amp; b &lt;c&gt; &#65;&#x42; &unknown;">
        text is skipped
        <![CDATA[ <not-an-element/> ]]>
        <b/>
        <c x="a > b"></c>
      </a>
    `)
    expect(warnings).toEqual([])
    expect(roots).toEqual([
      {
        name: 'a',
        attributes: { one: '1', two: '2 "quoted"', three: 'a & b <c> AB &unknown;' },
        children: [
          { name: 'b', attributes: {}, children: [] },
          { name: 'c', attributes: { x: 'a > b' }, children: [] },
        ],
      },
    ])
  })

  it('reports what is not closed or closes nothing, and keeps what it read', () => {
    expect(parseXml('<a><b></a>').warnings).toEqual(['<b> is never closed'])
    expect(parseXml('<a></b></a>').warnings).toEqual(['</b> closes nothing'])
    expect(parseXml('<a><b>').warnings).toEqual(['<b> is never closed'])
    expect(parseXml('<a x="1').warnings).toEqual(['a tag is never closed'])
    expect(parseXml('<!-- never').warnings).toEqual(['a comment is never closed'])
    expect(parseXml('<a><b/>').roots[0].children).toHaveLength(1)
    expect(parseXml('').roots).toEqual([])
    expect(parseXml(null as unknown as string).roots).toEqual([])
  })

  it('decodes the five named entities and numeric ones', () => {
    expect(decodeXmlText('&quot;&apos;&amp;&lt;&gt;&#233;&#x1F3B9;&#0;')).toBe('"\'&<>é🎹&#0;')
  })
})

describe('parseDspreset', () => {
  it('reads a sample: path, root, key range, velocity range, tuning in semitones, volume, pan', () => {
    const { map, unsupported, warnings } = parseDspreset(
      preset(
        '<group><sample path="Samples/C4.wav" rootNote="60" loNote="58" hiNote="62" loVel="1" hiVel="80" tuning="-0.12" volume="-3.5dB" pan="50"/></group>',
      ),
    )
    expect(map.zones).toEqual([
      {
        sample: 'Samples/C4.wav',
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

  it('gives a sample without ranges the whole keyboard on middle C', () => {
    expect(parseDspreset(preset('<group><sample path="a.wav"/></group>')).map.zones).toEqual([
      { sample: 'a.wav', rootKey: 60, loKey: 0, hiKey: 127 },
    ])
  })

  it('inherits from the group and from groups, the nearest one winning', () => {
    const { map } = parseDspreset(
      preset(
        `<group loNote="40" hiNote="50" rootNote="45" loVel="10">
           <sample path="a.wav"/>
           <sample path="b.wav" hiNote="47" loVel="0"/>
         </group>
         <group>
           <sample path="c.wav" rootNote="70"/>
         </group>`,
        'hiVel="100"',
      ),
    )
    expect(map.zones).toEqual([
      { sample: 'a.wav', rootKey: 45, loKey: 40, hiKey: 50, loVel: 10, hiVel: 100 },
      { sample: 'b.wav', rootKey: 45, loKey: 40, hiKey: 47, loVel: 0, hiVel: 100 },
      { sample: 'c.wav', rootKey: 70, loKey: 0, hiKey: 127, loVel: 0, hiVel: 100 },
    ])
  })

  it('reads a volume as a factor or in dB, and multiplies the three levels', () => {
    const { map } = parseDspreset(
      preset(
        `<group volume="0.5">
           <sample path="a.wav" volume="0.5"/>
           <sample path="b.wav" volume="6 dB"/>
           <sample path="c.wav" volume="0"/>
         </group>`,
        'volume="-2dB"',
      ),
    )
    expect(map.zones[0].gainDb).toBeCloseTo(-2 - 6.0206 - 6.0206, 3)
    expect(map.zones[1].gainDb).toBeCloseTo(-2 - 6.0206 + 6, 3)
    expect(map.zones[2].gainDb).toBe(-96)
  })

  it('adds globalTuning and groupTuning to the tuning', () => {
    const { map } = parseDspreset(
      preset(
        '<group groupTuning="-1" tuning="0.5"><sample path="a.wav"/><sample path="b.wav" tuning="0"/></group>',
        'globalTuning="12"',
      ),
    )
    expect(map.zones.map((zone) => zone.tuneCents)).toEqual([1150, 1100])
  })

  it('reads loops (the last frame becomes one past it), a crossfade in frames, and start and end', () => {
    const { map, warnings } = parseDspreset(
      preset(
        `<group>
           <sample path="a.wav" loopEnabled="true" loopStart="1000" loopEnd="4999" loopCrossfade="200"/>
           <sample path="b.wav" loopEnabled="false" loopStart="10" loopEnd="19"/>
           <sample path="c.wav" loopEnabled="1"/>
           <sample path="d.wav" start="100" end="999"/>
         </group>`,
      ),
    )
    expect(map.zones.map((zone) => zone.loop)).toEqual([
      { start: 1000, end: 5000, crossfade: 200 },
      undefined,
      {},
      undefined,
    ])
    expect(map.zones[3]).toMatchObject({ start: 100, end: 1000 })
    expect(warnings).toEqual([
      'c.wav: loop points kept in the audio file are not read; the whole sound loops',
    ])
  })

  it('reads round robin from the sample or from its group', () => {
    const { map, unsupported } = parseDspreset(
      preset(
        `<group seqMode="round_robin" seqPosition="1"><sample path="a1.wav" rootNote="60" loNote="60" hiNote="60"/></group>
         <group seqMode="round_robin" seqPosition="2"><sample path="a2.wav" rootNote="60" loNote="60" hiNote="60"/></group>
         <group>
           <sample path="b1.wav" rootNote="62" loNote="62" hiNote="62" seqMode="round_robin" seqPosition="1" seqLength="3"/>
           <sample path="b2.wav" rootNote="62" loNote="62" hiNote="62" seqMode="random" seqPosition="2"/>
           <sample path="c.wav" rootNote="64" loNote="64" hiNote="64" seqMode="always" seqPosition="2"/>
         </group>`,
      ),
    )
    expect(map.zones.map((zone) => zone.roundRobin)).toEqual([
      { group: 1, position: 1, length: 1 },
      { group: 1, position: 2, length: 2 },
      { group: 2, position: 1, length: 3 },
      { group: 2, position: 2, length: 2 },
      undefined,
    ])
    // Read into a device, the group's length is its highest position.
    expect(resolved(map).map((zone) => zone.roundRobin?.length)).toEqual([2, 2, 3, 3, undefined])
    expect(unsupported).toEqual([{ name: 'seqMode=random', count: 1 }])
  })

  it('reads pitchKeyTrack, and offers attack and release as hints', () => {
    const { map, hints } = parseDspreset(
      preset(
        '<group><sample path="a.wav" pitchKeyTrack="false"/><sample path="b.wav" pitchKeyTrack="true"/></group>',
        'attack="0.01" release="1.5"',
      ),
    )
    expect(map.zones.map((zone) => zone.pitchTrack)).toEqual([0, undefined])
    expect(hints).toEqual({ attackSec: 0.01, releaseSec: 1.5 })
  })

  it('collects what it cannot use, by name and count, and still reads the zones', () => {
    const { map, unsupported, warnings } = parseDspreset(`
      <DecentSampler minVersion="1.0.0">
        <ui width="812" height="375"><tab><labeled-knob label="Tone"/></tab></ui>
        <groups decay="1" ampVelTrack="0.5">
          <group tags="mic1" silencedByTags="mic2">
            <sample path="a.wav" rootNote="60" tags="x" loopCrossfadeMode="equal_power"/>
            <sample path="rel.wav" trigger="release"/>
            <sample rootNote="61"/>
            <effects/>
          </group>
          <group enabled="false"><sample path="off.wav"/></group>
          <oscillator/>
        </groups>
        <effects><effect type="reverb"/></effects>
        <midi/>
      </DecentSampler>
    `)
    expect(map.zones.map((zone) => zone.sample)).toEqual(['a.wav'])
    expect(unsupported).toEqual([
      { name: '<ui>', count: 1 },
      { name: 'sample@tags', count: 1 },
      { name: 'sample@loopCrossfadeMode', count: 1 },
      { name: 'group@tags', count: 3 },
      { name: 'group@silencedByTags', count: 3 },
      { name: 'groups@decay', count: 3 },
      { name: 'groups@ampVelTrack', count: 3 },
      { name: 'trigger=release', count: 1 },
      { name: '<effects> in <group>', count: 1 },
      { name: '<oscillator> in <groups>', count: 1 },
      { name: '<effects>', count: 1 },
      { name: '<midi>', count: 1 },
    ])
    expect(warnings).toEqual([
      'a <sample> without a path was left out',
      'a group that is switched off was left out',
    ])
  })

  it('reads note names, and says which octave it took middle C to be', () => {
    const { map, warnings } = parseDspreset(
      preset('<group><sample path="a.wav" rootNote="C4" loNote="A3" hiNote="D#4"/></group>'),
    )
    expect(map.zones[0]).toMatchObject({ rootKey: 60, loKey: 57, hiKey: 63 })
    expect(warnings).toEqual(['note names were read with middle C as C4'])
  })

  it('does not throw on text that is no preset, and says what it could not read', () => {
    for (const text of [
      '',
      'hello',
      '<',
      '<<>>',
      '<DecentSampler>',
      '<DecentSampler><groups><group><sample',
      '<a/>',
      '\u0000',
    ]) {
      expect(() => parseDspreset(text)).not.toThrow()
    }
    expect(parseDspreset('<instrument/>')).toMatchObject({
      map: { zones: [] },
      warnings: ['no <DecentSampler> element was found', 'no playable sample was found'],
    })
    const odd = parseDspreset(
      preset('<group><sample path="a.wav" rootNote="x" loVel="soft" volume="loud"/></group>'),
    )
    expect(odd.map.zones).toEqual([{ sample: 'a.wav', rootKey: 60, loKey: 0, hiKey: 127 }])
    expect(odd.warnings).toEqual([
      'rootNote="x" is not a key',
      'loVel="soft" is not a number',
      'volume="loud" is not a volume',
    ])
    // An unclosed file still gives the samples it holds.
    const cut = parseDspreset(
      '<DecentSampler><groups><group><sample path="a.wav"/><sample path="b.wav"/>',
    )
    expect(cut.map.zones).toHaveLength(2)
    expect(cut.warnings).toEqual(['<group> is never closed'])
  })
})

describe('writeDspreset', () => {
  const instrument: ZoneMap = {
    name: 'Upright',
    zones: [
      { sample: 'Samples/C3 soft.wav', rootKey: 48, loKey: 0, hiKey: 53, loVel: 0, hiVel: 63 },
      {
        sample: 'Samples/C3 "hard" & loud.wav',
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
        loop: { start: 20000, end: 39000, crossfade: 960 },
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
      { sample: 'Samples/click.wav', rootKey: 30, loKey: 30, hiKey: 30, pitchTrack: 0 },
    ],
  }

  it('writes one sample a zone', () => {
    const { text, warnings } = writeDspreset(instrument)
    expect(text).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!-- Upright -->',
        '<DecentSampler minVersion="1.0.0">',
        '  <groups>',
        '    <group>',
        '      <sample path="Samples/C3 soft.wav" rootNote="48" loNote="0" hiNote="53" loVel="0" hiVel="63"/>',
        '      <sample path="Samples/C3 &quot;hard&quot; &amp; loud.wav" rootNote="48" loNote="0" hiNote="53" loVel="64" hiVel="127" tuning="-0.075" volume="-2.25dB" pan="-25"/>',
        '      <sample path="Samples/C4.wav" rootNote="60" loNote="54" hiNote="65" loVel="0" hiVel="127" start="12" end="39999" loopEnabled="true" loopStart="20000" loopEnd="38999" loopCrossfade="960"/>',
        '      <sample path="Samples/C5 a.wav" rootNote="72" loNote="66" hiNote="127" loVel="0" hiVel="127" seqMode="round_robin" seqPosition="1" seqLength="2"/>',
        '      <sample path="Samples/C5 b.wav" rootNote="72" loNote="66" hiNote="127" loVel="0" hiVel="127" seqMode="round_robin" seqPosition="2" seqLength="2"/>',
        '      <sample path="Samples/click.wav" rootNote="30" loNote="30" hiNote="30" loVel="0" hiVel="127" pitchKeyTrack="false"/>',
        '    </group>',
        '  </groups>',
        '</DecentSampler>',
        '',
      ].join('\n'),
    )
    expect(warnings).toEqual([])
  })

  it('reads back as the same zones', () => {
    const { map, unsupported, warnings } = parseDspreset(writeDspreset(instrument).text)
    expect(resolved(map)).toEqual(resolved(instrument))
    expect(unsupported).toEqual([])
    expect(warnings).toEqual([])
  })

  it('reads its own output back the same a second time', () => {
    const once = writeDspreset(instrument).text
    expect(writeDspreset(parseDspreset(once, { name: 'Upright' }).map).text).toBe(once)
  })

  it('says what the format cannot hold', () => {
    const map: ZoneMap = {
      zones: [
        {
          sample: 'a.wav',
          rootKey: 60,
          pitchTrack: 0.5,
          loop: { start: 10, end: 2000, crossfadeSec: 0.01, mode: 'sustain' },
        },
        { sample: 'b.wav', rootKey: 62, loop: {} },
      ],
    }
    expect(writeDspreset(map).warnings).toEqual([
      'a.wav: pitch tracking is on or off here; 0.5 was written as off',
      'a.wav: its crossfade is in seconds and its sample rate is not known; left out',
      'a.wav: a loop that is left on release is written as a plain loop',
      'b.wav: a loop to the end of the sound is written without loopEnd',
    ])
    expect(writeDspreset(map, { sampleRate: () => 48000 }).text).toContain('loopCrossfade="480"')
  })
})

describe('one instrument, both formats', () => {
  it('goes from one to the other and back with the same zones', () => {
    const sfz = [
      '<control> default_path=Samples/',
      '<global> ampeg_release=0.8',
      '<group> lovel=0 hivel=63',
      '<region> sample=soft C3.wav lokey=36 hikey=53 pitch_keycenter=48 tune=-4',
      '<region> sample=soft C5.wav lokey=54 hikey=96 pitch_keycenter=72 loop_mode=loop_continuous loop_start=1000 loop_end=8999',
      '<group> lovel=64 hivel=127 volume=-1.5 seq_length=2',
      '<region> sample=hard C4 a.wav key=60 seq_position=1',
      '<region> sample=hard C4 b.wav key=60 seq_position=2',
    ].join('\n')
    const first = parseSfz(sfz)
    const viaPreset = parseDspreset(writeDspreset(first.map).text)
    expect(resolved(viaPreset.map)).toEqual(resolved(first.map))
    const back = parseSfz(writeSfz(viaPreset.map).text)
    expect(resolved(back.map)).toEqual(resolved(first.map))
    expect(resolved(first.map)).toHaveLength(4)
  })
})
