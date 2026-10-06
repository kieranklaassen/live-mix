# Zone Sampler

`zone-sampler` is a multi-sample instrument: many recordings, each mapped to
a range of keys and velocities, played back repitched. It stands beside
`sampler`, which plays one recording across all the keys. It is a spec device
(`cpp/devices/zone-sampler/`), built, described and registered like every
other one ([devices.md](./devices.md)), and it takes its instrument through
`WasmDevice.loadZones`.

Until an instrument is loaded it plays three built-in looped tones, on the C
below middle C, middle C and the C above, so the device and its presets sound
without any files.

## Parameters

| Parameter  | Range              | Default | What it does                                                          |
| ---------- | ------------------ | ------- | --------------------------------------------------------------------- |
| `tune`     | -24 to 24 st       | 0       | Transposes the whole instrument                                       |
| `fine`     | -100 to 100 cents  | 0       | Fine tune                                                             |
| `attack`   | 0.001 to 8 s (log) | 0.003   | Time a note takes to rise                                             |
| `release`  | 0.01 to 12 s (log) | 0.4     | Time a note takes to die away once its key is let go                  |
| `tone`     | 200 to 18000 Hz    | 14000   | A low-pass over the whole instrument                                  |
| `velocity` | 0 to 1             | 0.7     | How much a note's level follows how hard it is played; 0 is one level |
| `volume`   | -48 to 6 dB        | -9      | Output level                                                          |

Pitch, tone and volume are smoothed per sample. Presets: Keys, Soft keys, Slow
swell, Short and bright, Octave down, Even touch.

## The zone map

An instrument is a zone map, plain JSON, and a table of decoded audio keyed by
the names the zones use:

```ts
import { type ZoneMap, type ZoneSample } from '@kieranklaassen/live-mix/dsp'

const map: ZoneMap = {
  name: 'Three notes',
  zones: [
    { sample: 'c3.wav', rootKey: 48, loKey: 36, hiKey: 53 },
    {
      sample: 'c4.wav',
      rootKey: 60,
      loKey: 54,
      hiKey: 65,
      loop: { start: 9000, end: 42000, crossfade: 2000 },
    },
    { sample: 'c5.wav', rootKey: 72, loKey: 66, hiKey: 96, tuneCents: -4, gainDb: -2 },
  ],
}
const samples: Record<string, ZoneSample> = {
  'c3.wav': { channels: [left, right], sampleRate: 44100 }, // one or two Float32Arrays
  // ...
}

const plan = device.loadZones(map, samples)
if (!plan.ok) console.warn(plan.reason)
```

| Field            | Default            | Meaning                                                                                      |
| ---------------- | ------------------ | -------------------------------------------------------------------------------------------- |
| `sample`         | required           | The sound's name in the sample table: a path as a file wrote it, or any id                   |
| `rootKey`        | required           | The MIDI note that plays the sound as recorded                                               |
| `tuneCents`      | 0                  | Fine tune of the zone                                                                        |
| `loKey`, `hiKey` | `rootKey`          | The keys the zone covers                                                                     |
| `loVel`, `hiVel` | 0, 127             | The velocities it answers                                                                    |
| `gainDb`, `pan`  | 0, 0               | Level, and balance from -1 to 1                                                              |
| `pitchTrack`     | 1                  | 1 follows the keys a semitone a key; 0 plays one pitch on every key                          |
| `start`, `end`   | 0, the sound's end | Frames played; `end` is one past the last                                                    |
| `loop`           | none               | `{ start, end, crossfade or crossfadeSec, mode }`; `end` is one past the last frame          |
| `loop.mode`      | `'continuous'`     | `'continuous'` loops through the release; `'sustain'` leaves the loop when the key is let go |
| `roundRobin`     | none               | `{ group, position, length }`: of the zones of one group, the next position plays each note  |

`normalizeZoneMap` fills the defaults in and reports what it had to correct;
`compactZone` takes them out again.

### What plays

- A key inside one or more zones plays those whose velocity range holds the
  note. Zones that cover the same keys and velocities are layers and sound
  together, up to four a note.
- A key no zone covers plays the nearest zone, repitched from its root: keys
  between two zones, and keys below the lowest and above the highest. When two
  zones are equally near, the one whose root is nearer plays, and then the one
  that was added first.
- A velocity no zone covers plays the nearest velocity layer.
- Round-robin zones take turns, one counter a group.
- A loop's crossfade blends the end of each pass with the audio that leads
  into the loop start, with the gains chosen from how alike the two are, so a
  loop of a steady tone keeps its level.
- 48 voices. When all are busy a new note takes the quietest voice that is
  releasing, else the quietest held one (the oldest on a tie), and what the
  taken voice was putting out fades over 8 ms so the steal does not click.

### On the audio thread

Voices, zones and the sample pool are allocated when the device is made.
Playing takes no memory, no locks and no I/O; loading copies into the pool
from a message, fades what is sounding out over 8 ms and swaps the table.

## Memory, and what happens over budget

A decoded sound costs four bytes a frame a channel. The device holds a pool of
16,000,000 floats (64 MB of linear memory in all, fixed when the module is
instantiated): 333 seconds of mono or 167 seconds of stereo at 48 kHz, and up
to 512 zones and 512 sounds. That is per device instance, on top of whatever
the host keeps decoded; on a phone see
[iphone-memory-and-element-source.md](./iphone-memory-and-element-source.md),
and let the decoded buffers go once `loadZones` returns (it copies).

`planZoneLoad(map, sizes, capacity, options)` decides before anything is
copied, and `loadZones` returns its plan:

- `overBudget: 'refuse'` (default): the instrument loads whole or not at all.
  The plan is `{ ok: false, reason, bytes, budgetBytes }`, the reason a
  sentence such as "it needs 81.2 MB of sample memory and the budget is
  61.0 MB", and the device keeps what it had.
- `overBudget: 'thin'`: less of it loads, in this order until it fits: stereo
  folded to mono, one take of each round robin, one velocity layer, then every
  other sampled key (the keys between play the nearest one left). The plan's
  `thinned` lists each step with the zones it left out and the bytes it saved.
  If it still does not fit, it is refused as above.
- `budgetBytes` sets a smaller budget than the pool, for a host that counts
  several instruments against one total.

Zones whose sound is not in the table are left out and named in `missing`.

## Offline

`renderPatch` takes the same instrument, prepared once:

```ts
import { prepareZoneLoad, renderPatch } from '@kieranklaassen/live-mix/dsp'

const zones = prepareZoneLoad(map, samples, capacity) // capacity: the definition's `zones`
const audio = await renderPatch(patch, { phrase, zones: zones.load })
```

## Under the hood

A device that takes zones says so in its manifest
(`"zones": { "max", "samples", "poolFloats" }`) and exports seven more
functions (`cpp/common/device_api.h`, "zone devices"): begin, add a sound and
get its buffer, a block of fields, add zones. A zone crosses as twenty floats
(`encodeZoneFields`). The worklet takes three messages, `zones-begin`, one
`zone-sample` a sound with its channels transferred, and `zones`.

`sampler`'s single-sound path (`loadSample`) also works here: it maps the one
sound to every key with middle C as its root.

## What is tested, and what is not

`cpp/test/zone_sampler_test.cpp` holds the device to the instrument
conformance checks and to its own behaviour (pitch on keys inside, between
and beyond three zones, velocity layers, round robin, loops and crossfades,
stealing, refusals, block-size independence).
`src/dsp/__tests__/zone-sampler-wasm.test.ts` renders a three-zone instrument
through the shipped module offline and checks the pitch and the zone on each
key, and drives the worklet's messages and `loadZones`.

Nobody has listened to it yet, and it has not been loaded with an instrument
made by another tool.
