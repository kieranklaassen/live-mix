# Instrument file formats

Readers and writers for multi-sample instrument files, to and from the zone
map [`zone-sampler`](./zone-sampler.md) plays. They are pure functions over
text: no network, no file access, no dependencies. Decoding the audio the
zones name is the host's business.

```ts
import { parseSfz, writeSfz, parseDspreset, writeDspreset } from '@kieranklaassen/live-mix/dsp'

const { map, hints, unsupported, warnings } = parseSfz(text, { include: (path) => files.get(path) })
// map: a ZoneMap; hints: { attackSec?, releaseSec? } for the device's Attack and Release
// unsupported: [{ name: 'cutoff', count: 12 }, ...]   warnings: sentences
const { text: out, warnings: lost } = writeSfz(map)
```

Reading never throws. A file that makes no sense gives no zones and says why
in `warnings`; anything a file asks for that a zone map cannot say is counted
in `unsupported` by the name the file uses, and the rest of the file is still
read. Writing reports what the format could not hold.

| Format                       | Read | Write | Module                      |
| ---------------------------- | ---- | ----- | --------------------------- |
| SFZ (`.sfz`)                 | yes  | yes   | `src/dsp/zones/sfz.ts`      |
| Decent Sampler (`.dspreset`) | yes  | yes   | `src/dsp/zones/dspreset.ts` |
| EXS24 (`.exs`)               | no   | no    | left out, see below         |

## SFZ

Read: `sample`, `default_path`, `key`, `lokey`, `hikey`, `pitch_keycenter`,
`lovel`, `hivel`, `tune`, `transpose`, `pitch_keytrack`, `volume`,
`amplitude`, `pan`, `offset`, `end`, `loop_mode`, `loop_start`, `loop_end`,
`loop_crossfade`, `seq_length`, `seq_position`, `note_offset`,
`octave_offset`; `ampeg_attack` and `ampeg_release` as hints when the whole
file agrees on them. `<control>`, `<global>`, `<master>`, `<group>` and
`<region>` inherit in that order, the nearest winning. `#define` is expanded;
`#include` is read through the `include` function the caller gives and
reported when there is none. Note names (`c4`, `f#3`) are read with C4 as 60.
Comments, and sample paths with spaces, are handled.

Reported and not played: filters, per-region envelopes beyond attack and
release, LFOs, controllers, key switches, `one_shot`, release and legato
triggers (`trigger` other than `attack`; those regions are left out),
generated sounds (`sample=*sine`), effects, and any opcode not listed above.

Written: one `<region>` a zone, with the folder every sound shares as
`default_path` under `<control>`. `end` and `loop_end` are inclusive in the
file and one past the last frame in a zone map; the reader and the writer
convert. A crossfade is seconds in the file: a zone that holds it in frames needs
`sampleRate` in the write options, or the crossfade is left out with a
warning.

## Decent Sampler

Read, on `<sample>` and inherited from its `<group>` and from `<groups>`:
`path`, `rootNote`, `loNote`, `hiNote`, `loVel`, `hiVel`, `start`, `end`,
`tuning` (semitones), `volume` (linear, or `"3dB"`), `pan` (-100 to 100),
`loopEnabled`, `loopStart`, `loopEnd`, `loopCrossfade`, `seqMode`,
`seqPosition`, `seqLength`, `pitchKeyTrack`, `trigger`; `globalTuning` and
`groupTuning`; `attack` and `release` as hints. The XML reader is a small one
of its own (`src/dsp/zones/xml.ts`): elements, attributes, comments, CDATA,
the five named entities and numeric ones; a document it cannot follow gives
no zones and a warning.

Reported and not played: `<ui>`, `<effects>`, `<midi>`, `<modulators>`,
`<tags>`, per-sample envelopes beyond attack and release, release and legato
triggers, sequence modes other than round robin (played in turn all the same), and
any attribute not listed above.

Written: one `<group>` holding a `<sample>` a zone.

Written from the format's published description, and not yet checked against
a preset another tool made. Three readings are assumptions until one is:
`end` and `loopEnd` are taken as inclusive; `volume` on `<groups>`, `<group>`
and `<sample>` is multiplied together rather than the nearest winning; and
note names are read with C4 as 60.

## EXS24

Left out. It is an undocumented binary format; what is known of its layout
comes from reverse engineering, and a reader written from memory of that,
with no file to test against, would be wrong in ways nobody could see. It
wants real files and a reference to check against first.

## Tests

`src/dsp/zones/__tests__/`: round trips through each writer and reader,
inheritance at every level, and odd input (empty files, a byte-order mark,
unterminated elements, ranges the wrong way round, keys out of range, unknown
opcodes). No instrument file made by another tool is in the repository, so
every test file was written here.
