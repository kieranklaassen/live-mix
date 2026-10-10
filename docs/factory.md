# Patches and the factory bank

A device preset is one device's parameters. A **patch** is the whole sound: an
instrument with the effects after it, or an effect chain on its own. The
**factory bank** is the set of patches and sounds the library ships, made only
of the stock WASM devices, with a renderer that plays any of them without an
audio context. ambient-live's browser lists the bank, previews an entry before
loading it and paints with the sounds.

Everything on this page was tuned by measurement. Nobody has listened to it:
the bank was written where there are no ears, so levels, tails, width and
spectrum were held to numbers (below) and the choices of sound come from
knowing how these sounds are usually made. Treat names and descriptions as
claims to check by ear.

## A patch

```ts
import { validatePatch, type Patch } from '@kieranklaassen/live-mix'

const patch: Patch = {
  id: 'slow-tape-strings', // stable: saved work refers to it
  name: 'Slow tape strings',
  category: 'string',
  description: 'Strings that take three seconds to arrive, worn by tape.',
  instrument: { deviceId: 'string-machine', preset: 'Slow strings', params: { width: 0.6 } },
  effects: [
    { deviceId: 'tape', preset: 'Quarter inch' },
    { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.4 } },
  ],
}
validatePatch(patch, engine.devices) // [] when every device, preset and value is known
```

Each device entry is `{ deviceId, preset?, params?, bypass? }`: a score device
without its instance id, so a host that keeps its chains in a score can store
a patch as it stands. `preset` names one of that device's own presets, `params`
go over it, and anything not named keeps the spec default
(`patchDeviceParams(descriptor, device)` gives the resulting map). A patch with
no `instrument` is an effect chain.

| Function                                           | What it does                                                                                              |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `validatePatch(patch, registry)`                   | Lists unknown devices, presets and parameters, values out of range, an effect in the instrument slot      |
| `createPatchDevice(registry, ctx, device)`         | Instantiates one entry with its preset, params and bypass                                                 |
| `createPatchEffects(registry, ctx, patch)`         | Instantiates the effects in order; all or nothing, so a patch that fails to load leaves nothing behind    |
| `replaceInserts(host, devices, { pinned })`        | Swaps a strip's or a bus's inserts after the pinned ones; returns what came off for the caller to dispose |
| `capturePatch({ id, name, instrument?, effects })` | Snapshots live devices as a patch                                                                         |
| `isPatch(value)`                                   | Structural check for a patch read back from storage                                                       |

Loading one onto an instrument track is three lines the host owns, because
only the host knows what to do with the instrument that leaves:

```ts
const effects = await createPatchEffects(engine.devices, ctx, patch)
const old = track.setDevice(await createPatchDevice(engine.devices, ctx, patch.instrument))
for (const device of replaceInserts(track.strip, effects)) device.dispose()
```

A host that keeps its chains in a score document loads a chain as an edit of
the document instead, so it is saved, logged and undone with everything else.
`patchEffectOps(score, owner, patch, { pinned })` gives the `device.remove` and
`device.add` operations for a track, group, return or `MASTER_OWNER`, with
instance ids nothing in the score has yet; applied as one `batch` the load is
one undo step, and the renderer makes the devices. `scoreDeviceFromPatch(id,
device)` is the single-device form.

```ts
const ops = patchEffectOps(document.score, 'pad', chain, { pinned: 1 })
arbiter.apply({ type: 'batch', ops, label: `Load ${chain.name}` })
```

An instrument preset goes onto an instrument track the same way:
`patchInstrumentOps(score, track, patch, { pinned })` gives a `device.replace`
for the track's own device (the preset's instrument with its settings) and
then the effect operations. The track keeps its strip, level and sends; a
track already playing that instrument keeps the instance and takes the
settings, and the renderer swaps any other instrument in on the same track
with the old one ringing out.

```ts
const ops = patchInstrumentOps(document.score, 'synth', preset)
arbiter.apply({ type: 'batch', ops, label: `Load ${preset.name}` })
```

## Rendering without an audio context

`renderPatch` (`./dsp`) instantiates the device modules directly and calls the
C ABI block by block: a phrase into the instrument, its output through each
effect in turn. Notes land on their exact sample, so the same patch gives the
same audio in Node, in a browser and in CI, which an `OfflineAudioContext`
does not (instrument notes carry no timestamp there).

```ts
import { renderPatch } from '@kieranklaassen/live-mix/dsp'

const audio = await renderPatch(patch, {
  durationSec: 8,
  sampleRate: 48000,
  phrase: { notes: [{ atSec: 0, durSec: 4, note: 62 }] }, // MIDI notes; gain defaults to 0.8
  normalizePeakDb: -6,
}) // { channels: [left, right], sampleRate }
```

| Option                    | Use                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| `phrase`                  | What an instrument patch plays                                                                |
| `input`                   | What an effect chain processes, at `sampleRate`; silence follows it so the tail is heard      |
| `sample`                  | The sound a sample instrument (`grain-synth`, `sampler`) plays                                |
| `skipSec`                 | Rendered and thrown away first, so a loop starts with the attack over and the reverb full     |
| `loopCrossfadeSec`        | Renders this much more and folds it over the start (equal power): the result loops seamlessly |
| `loopFold`                | `'linear'` folds at equal amplitude: for a phrase played round again, where the two are alike |
| `fadeInSec`, `fadeOutSec` | Linear fades at the ends                                                                      |
| `normalizePeakDb`         | Scales the result to this peak                                                                |
| `sliceMs`, `signal`       | Hands the thread back every 12 ms by default so a page stays responsive; aborts on the signal |
| `describe`, `compile`     | Where device ids are looked up and how a module is compiled (Node reads the files from disk)  |

Only WASM devices render this way (`canRenderPatch`): the node devices
(`delay`, `compressor`, `eq3`, `parametric-eq`, `filter`, `utility`,
`convolver-reverb`) and the worklet `ducker` need an audio context. That is
why the bank uses none of them. A patch of an instrument and two effects
renders eight seconds in roughly half a second to a second and a half.

`wasmDeviceDescriptor` returns a `WasmDeviceDescriptor`, which keeps its
`definition` (where its module is); `isWasmDescriptor` tells one from the
other kinds. A host with a WASM device of its own passes a `describe` that
knows it, as ambient-live does for its sine core.

## The bank

```ts
import {
  FACTORY_PRESETS, // FactoryPreset[]: an instrument and 1 to 4 effects
  FACTORY_CHAINS, // FactoryChain[]: 1 to 5 effects
  FACTORY_SOUNDS, // FactorySound[]: recipes, rendered when asked for
  FACTORY_PRESET_CATEGORIES,
  FACTORY_CHAIN_CATEGORIES,
  renderPresetPreview,
  renderChainPreview,
  renderFactorySound,
} from '@kieranklaassen/live-mix/dsp'
```

|             | Count | Groups                                                                                                                                        |
| ----------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Presets** | 680   | Twenty for each of the thirty-four stock instruments: pads, keys, bells, strings, plucked, wind, voices, organs, drones, textures             |
| **Chains**  | 218   | Space (31), echo (28), tape (39), motion (26), texture (34), pitch (35), master (25); every WASM effect is in at least one                    |
| **Sounds**  | 100   | Looping drones (19), pads (27) and textures (16), one-shots (22) and phrases (16, seven of which come round); nine are made from other sounds |

The bank is data: importing it loads no module and touches no audio. A host
lists it before audio starts and renders only what someone asks to hear.

Beside the bank are the packs, a hundred presets each, which are fetched
apart from it: see [Packs](#packs).

- `renderPresetPreview(preset)` plays the preset's phrase (its category's:
  a held chord for a pad, a broken chord for keys and plucked strings, four
  strikes for a bell, one moving line for wind, a low fifth for a drone;
  `preview` overrides it) for eight seconds with the
  tail.
- `renderChainPreview(chain, { input })` runs the first six seconds of `input`
  through the chain and lets it ring for two more. Without an input a dry
  electric piano phrase plays (`CHAIN_PREVIEW_PATCH`, `CHAIN_PREVIEW_PHRASE`).
- `renderFactorySound(sound)` renders the recipe: a patch (a preset id or an
  inline patch), a phrase, a length, and for a loop the crossfade that closes
  it. A sound with a `source` (a granular cloud of the piano phrase) renders
  that sound first and plays it through a sample instrument.

All three come out at `FACTORY_PEAK_DB` (−6 dBFS peak), so nothing in a
browser list is louder than the entry above it. Every phrase stays on the
white keys, so previews and sounds sit together and inside a C major scale
lock; see below for other keys. A sound has a catalogue `number` that never changes (ambient-live's
sample id for it is a billion plus the number) and a `kind` that
`analyzeSound` must agree with, so the list can show the right icon before
the sound has been rendered.

## The bank in another key

Every sound is written on the white keys: C major, A minor, D dorian and the
other modes of the same seven notes. So one transposition moves the whole
bank into any key, and every sound stays inside it.

```ts
import {
  factoryTranspose,
  renderFactorySound,
  transposeFactorySound,
} from '@kieranklaassen/live-mix/dsp'

const by = factoryTranspose({ root: 4, mode: 'minor' }) // E minor: -5, the shortest way (5 down to 6 up)
transposeFactorySound(sound, by).name // "Low drone A" for "Low drone D"
const audio = await renderFactorySound(sound, { transpose: by })
```

`transposeFactorySound` moves the notes, the devices that are set to a pitch
(the sympathetic strings' scale, a Thesis' centre) and the note names in the
name and description, which the bank writes in braces (`'Low drone {D}'`).
The id and the catalogue number stay, so it is the same sound to whatever
refers to it. A sound made from another one renders that one in the new key
and keeps its own notes. The three sounds of steady tones are retuned, by
under two cents, to a whole number of cycles per loop at render time
(`tuning: 'whole-cycles'`), in whatever key that is.

`keyChord(key, degree)` is one of the seven chords of a key, `chordTakes`,
`chordTones` and `chordName` say which colours (seventh, ninth, sus2, …) it
takes without leaving the key, which notes those are and what the chord is
then called.

## Sounds that keep time

A sound with a beat to it (a drum loop, a pulse, a bass line) has a `bpm`:
the tempo it is written at, 120 in everything the bank ships. It is a loop of
whole bars in four (2, 4 or 8 s at 120), its first stroke on a downbeat,
every stroke on a grid, and it is played at any other tempo by moving the
notes: nothing is stretched.

```ts
import { renderFactorySound, soundAtTempo } from '@kieranklaassen/live-mix/dsp'

const audio = await renderFactorySound(sound, { bpm: 96, transpose: by })
soundAtTempo(sound, 96).durationSec // 5 for a loop of 4 s at 120: as many beats long
```

`soundAtTempo` gives the recipe as it is played at a tempo: every note as
many beats in and as many beats long, the sound as many beats long, and
`bpm` the tempo it is now at. A drum rings as long as it did, so only what
lies between the hits changes. An echo's `time` and an LFO's rate in the
patch follow (`TIMED_PARAMS` in `tempo.ts`: the five delays, `tremolo` and
`auto-filter`), so a dotted-eighth echo is one at every tempo; a value the
control cannot reach is halved or doubled until it can, which is still on
the beat. A loop's crossfade is never made longer than it is written. The
tempo asked for is kept inside `FACTORY_TEMPO_RANGE` (20 to 480). A sound
with no `bpm` is the same sound at every tempo and comes back as the same
object, so a host can ask every sound for the piece's tempo and key its
store by `bpm` only where the sound has one.

A host that follows a tempo (ambient-live: its own, or an Ableton Link
session's) renders such a sound again when the tempo has settled and swaps
it under what plays it; what it painted with the sound is as many beats
long as before.

`sounds/rhythm.ts` is what these are written with: `row(key, 'X...x...', {
per, hold, swing, lateSec })` lays one voice out in steps (`X` loud, `x`,
`o`, `-` soft, `.` a rest; sixteen steps to the bar unless `per` says
otherwise, so a row `per: 12` is triplets and `per: 5` goes against the
four), and `bars(count, rows, { passes, crossfadeSec })` makes the rows a
loop of that many bars and sets `bpm`. A row shorter than the loop repeats
to fill it and has to fill it exactly.

A variant (`varySound`) of a sound that keeps time keeps time: touch moves a
stroke by at most `VARIATION_LIMITS.beatTimingSec` (20 ms) instead of the
`timingSec` a free phrase is given.

### Kits

Two instruments have things for keys instead of pitches: `drum-kit` and
`glitch-kit` (`KIT_INSTRUMENTS`, `isKitInstrument`). Each of the twelve keys
of an octave is one drum (every C the kick, every D the snare) or one fault
(a click, a pop, a cut of noise), the octave it is played in tunes it, and a
hit is a one-shot that note-off does not end (`cpp/kit/keymap.h`). `KIT` and
`FAULT` in `rhythm.ts` name the keys.

A sound played on a kit is marked `kit` by `sound()`, and
`transposeFactorySound` leaves its notes where they are (the kick stays the
kick in every key) and moves the kit's `tune` instead, so the drums are
tuned to the key of the piece. A variant of one never moves a chord or
detunes, and a host that snaps played notes to a scale has to leave a kit's
alone: seven of its twelve drums would be out of reach.

Presets of the kits are in the category `drum`, whose preview (`drum` in
`phrases.ts`) plays every one of the twelve keys over three bars at 120.

## New sounds from a seed

```ts
import { generateSound, renderGeneratedSound } from '@kieranklaassen/live-mix/dsp'

const sound = generateSound({
  seed: 20261002,
  kind: 'pad',
  key: { root: 2, mode: 'dorian' },
  degree: 3,
})
sound.name // "Shimmer pad Gsus2"
const audio = await renderGeneratedSound(sound)
```

`generateSound` makes a recipe and renders nothing. The seed decides which
instrument plays, how it is set and, for a phrase, the line; the key and the
chord (`degree`, 0 to 6; drawn from the seed when left out, the key's own
chord most often and never the diminished one) decide the notes. So the same
seed in another key is the same sound moved there, and a host that stores
`{ seed, kind, degree }` can make the sound again in whatever key the piece
is in. `kind` is one of `GENERATED_KINDS`: `drone`, `pad`, `texture`,
`oneshot`, `melodic`.

Every voice starts from a recipe of the bank and keeps what made it loop:
notes held through the fold, slow motion at whole cycles per loop, pure
fifths under a drone, and the whole-cycle tuning with a quarter turn for the
steady ones. `generate.test.ts` holds them to the bank's rules (every note in the key in
all six modes, the same devices in every key, one sound of every voice
rendered and classified).

What the bench says, so nobody has to find out again: of 250 generated
sounds across all keys and chords, 246 came out as the kind asked for; the
four that did not are drones whose level moves enough for `analyzeSound` to
call them pads (its line between the two is how flat the level is). Two
drone voices that crossed that line most of the time were taken out. The
bank itself, moved through all twelve keys, keeps its kind in 394 of 408
renders: the others are mostly the low drones a few semitones up, where
they move more.

## A variant of a sound

A sound is a recipe, so it can be played once more, differently:

```ts
import { describeVariant, renderFactorySound, varySound } from '@kieranklaassen/live-mix/dsp'

const vary = { seed: 4711, chords: 0.3, speed: 0, pattern: 0.2, touch: 0.25 }
const audio = await renderFactorySound(sound, { vary, transpose })
const variant = varySound(sound, vary) // the recipe, nothing rendered
describeVariant(sound, vary) // { chordSteps: -2, octaves: 0, rate: 1, rests: 1, swaps: 0, laterSec: 0 }
```

`varySound` gives the recipe of a variant and renders nothing. A seed is one
variant, always the same one. There are four kinds of difference
(`VARIATION_KINDS`), each with an amount of its own from 0 to 1; `amount` is
for every kind that is not given one. At 0 in every kind, or without a
variation, the sound itself comes back, the same object, so nothing about its
render changes; so does a sound a kind has nothing to work on (the speed of a
held chord). A host that keeps the seed and the amounts beside the sound's id
has kept the variant. A new kind is a new name in `VARIATION_KINDS` and a
stretch of `vary.ts`; what the others give for a seed does not move.

What each kind changes, in proportion to its amount (`VARIATION_LIMITS` is
what an amount of 1 allows):

| kind    |         | at 1    |                                                                                                                                             |
| ------- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| chords  | chord   | 0.75    | the chance that the whole sound is played on another chord of the key: every note the same number of steps along the white keys             |
|         | voicing | 0.4     | the chance that a chord of three notes or more rings with one upper note an octave away                                                     |
|         | octave  | 0.2     | the chance, for each single note of a phrase, that it is played an octave away: never the first, never the lowest                           |
| speed   | rate    | 1 oct   | a phrase that ends is played from half to twice as fast, from its first note on; slower, it stops where the sound's last note was           |
|         | double  | 0.5     | the chance that a phrase played round is played at double time (twice in its length) or at half time (its first half over the whole length) |
| pattern | rests   | 0.4     | the share of a phrase's moments that rest, spread through it as evenly as they go: never the first, never the lowest note                   |
|         | places  | 0.35    | the chance that two neighbouring single notes of a phrase change places: never the first note, never the lowest                             |
|         | thin    | 0.4     | the chance that a chord of three notes or more sounds without one of its upper notes                                                        |
| touch   | timing  | 0.12 s  | a note is early or late, never by more than a third of the way to its neighbour; notes struck together move together                        |
|         | gain    | 3 dB    | a note is played harder or softer against the others; the hardest note of the variant is as hard as the sound's hardest                     |
|         | tuning  | 7 cents | not for a sound tuned to whole cycles                                                                                                       |
|         | start   | 4 s     | a held chord is taken up that much later, at another moment of whatever moves in its instrument                                             |

The methods are old ones. The chord is a weighted choice: a third down or up
first (two notes of a triad in common), a fourth or a fifth next (one), a step
last (none), and the further ones only come in above a third and two thirds
of the amount; no sound is ever stood on B, the one white key with no fifth
above it. The rests are a Euclidean rhythm: the moments that sound are spread
over the phrase as evenly as their number allows, turned so the first one
sounds. Everything else is a chance per note or per sound.

A host can also say the chord and leave only the rest to the seed:
`chord` in the variation is steps along the white keys from where the sound
is written, −3 to 3, and it stands in for the draw at any amount of
`chords`, 0 included, so `{ seed, chord: 2 }` is the sound a third up and
nothing else about it changed. `chordMoves(sound)` lists the steps a sound
can take, nearest first (never onto B, never out of range; where the near
way leaves the range the same chord an octave the other way is taken, and
`describeVariant` says how far the notes went), and `soundDegree(sound)` is
the white key it is written on, 0 for C to 6 for B, by its lowest note: with
`keyChord` and `chordName` a host names the chord in whatever key it plays
the sound in. A chord a sound cannot take leaves it where it is written.
Without `chord` every variant is what it was before there was one.

```ts
chordMoves(sound) // [1, -2, 2, -3, 3] for a sound written on C
varySound(sound, { seed: 1, chord: 3 }) // on the fourth, otherwise as written
varySound(sound, { seed: 7, chords: 0.4, touch: 0.5, chord: -2 }) // variant 7, on the sixth
```

What no kind changes: the instrument and its settings, the effects, the
length, the loop and its fold, the key, and the attack a sound starts on. In a
sound that ends, the notes it ends on are never later and no key is down
longer, so it still dies away inside its length. A sound made of another one
(`source`) has no chord of its own to move: its notes say how far the other
sound's audio is shifted.

Every factory sound is written on the white keys, and a chord is moved along
them. So a variant is made of the sound as written and transposed afterwards:
`renderFactorySound` does both in that order, and a host that keeps its own
copy of a varied recipe transposes that. Everything is drawn from the seed and
a note's own place in the phrase, never from a running count, and a phrase
that is played round (`cycled`) is varied as one pass and laid out again for
every pass, so the loop still meets itself, and a variant in another key is
the same variant moved there.

`vary.test.ts` holds each kind to its own business, holds a variant of every
sound of the bank and of every pack sound there is to what a sound must keep
without rendering, and renders ten by their touch and by every kind at once.
`FACTORY_REPORT=variants` is the bench: per variant what it does, how far it
is from its sound (`printDistance`, the same measure as `ALIKE`), the
loudness against the sound's, the kind the analysis gives, and whether it
comes round or ends as the sound does, with `KIND`, `LEVEL` (over 2 LU from
the sound), `SAME` (under 0.02 dB apart: nothing to hear), `OFFKEY`, `SEAM`,
`STEP-IN`, `CUT` and `LATE`.

```bash
FACTORY_REPORT=variants pnpm vitest run src/dsp/factory/__tests__/report.test.ts # two seeds of every bank sound, every kind at 1
FACTORY_REPORT=variants FACTORY_KIND=chords FACTORY_EVERY=4 pnpm vitest run src/dsp/factory/__tests__/report.test.ts # one kind alone
FACTORY_REPORT=variants FACTORY_AMOUNT=0.25 FACTORY_SEEDS=4 FACTORY_EVERY=5 pnpm vitest run src/dsp/factory/__tests__/report.test.ts
FACTORY_REPORT=variants FACTORY_PACK=<id> pnpm vitest run src/dsp/factory/__tests__/report.test.ts # a pack's sounds
```

What the bench says, so nobody has to find out again. Each kind alone at an
amount of 1, two variants of every fourth sound of the bank (25 sounds, 50
variants a kind); a variant's distance from its sound is the level between
the two renders, band by band.

| Kind    | Variants that differ | Distance, where they differ   | Loudness against the sound's       | What was flagged                                                                           |
| ------- | -------------------- | ----------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------ |
| Chords  | 34 of 50 (23 sounds) | 0.1 to 5.0 dB, half under 1.7 | within 1 LU for 28, 2.1 LU at most | two held chords moved to E and to D read 37 and 34 % on the black keys, from 14 and 13 %   |
| Speed   | 10 of 50 (5 sounds)  | 1.1 to 7.7 dB, half under 4.4 | over 2 LU for 3, 3.2 LU at most    | one slowed phrase ends at -58 dB, where the sound ends at -107                             |
| Pattern | 10 of 50 (5 sounds)  | 1.4 to 6.5 dB, half under 2.5 | over 2 LU for 3, 3.1 LU at most    | one phrase with four of its notes resting is called a one-shot by `analyzeSound`           |
| Touch   | 50 of 50 (25 sounds) | 0.1 to 2.2 dB, half under 1.0 | within 1 LU for 45, 2.0 LU at most | two pads are called another kind by `analyzeSound`, their level now moving across its line |

Every loop still comes round in every one of them, and none starts on a
step. Chords reaches every kind of sound but one played from a `source`;
speed and pattern are for phrases, so a bank of drones and pads is varied
mostly by its chords and its touch. The notes of a variant on another chord
are all of the key: the black-key share that rises is the overtones of a
chord on E, A or D, whose thirds and fifths lie closer to black keys than
those of a chord on C, F or G. A render is brought to the bank's peak
whatever is played, so a variant's loudness is not its sound's: a phrase at
double time, or with notes resting between the ones that are left, comes out
2 to 3 LU louder at an amount of 1. A host that minds can bring a variant to
its sound's loudness after rendering; the library does not. The draws that
ask only the seed (which chord, how fast, whether a held chord loses a note)
are the same for every sound at one seed, so a host should give each sound
seeds of its own, as it would anyway.

What varies least is a sound that is one note struck once: its tuning moves
by a few cents and, with chords up, it may sound an octave away or on
another step, and nothing else does, because the whole of a sound played
softer is not level-safe (a single high felt piano note played 3 dB softer
came out 4.6 LU quieter at the same peak). The share of a sound on the black
keys moves by a point or two under the touch, but for the gong wash, grains
of a source with no clear pitch: 10 to 41 % from one variant to the next, on
the same held note, as its grains fall.

## What the bank is held to

`src/dsp/factory/__tests__/factory.test.ts` renders every entry with the
committed modules and fails the build when one leaves these limits:

| Entry  | Rule                                                                                                                                                                                                 |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All    | Kebab-case id unique across presets and chains, name of at most 24 characters and unique, a one-sentence description of at most 140 characters, every device, preset and value valid                 |
| Bank   | Twenty presets per instrument, twenty chains per group, two presets per category, every WASM effect used somewhere, no two presets and no two chains set exactly alike                               |
| Preset | Raw preview peak at or below −8 dBFS, loudest 400 ms between −30 and −22 dBFS, side no louder than mid, no DC offset; no two presets of one instrument within 1 dB of each other in sound            |
| Chain  | On the dry phrase: peak at or below −5 dBFS, within 4 LU of the dry input, no DC offset, and it changes the sound                                                                                    |
| Sound  | 2 to 32 s, peak at −6 dBFS, not near-silent, `analyzeSound` gives its `kind`, a name of at most 24 characters in every key, a loop comes round on itself, a sound that ends starts and stops at rest |

How a sound starts, ends and wraps is held to the measure a host enters and
leaves a clip by (`src/core/clips/seam.ts`): a loop `comesRound` (its last
samples lead into its first with no step larger than the steps inside it),
and a sound that ends neither `entersOnStep` nor `leavesOnStep`. A host that
lays a factory loop end to end therefore has nothing to mend at the wrap.

A sound that shipped stays what it was. `shipped-sounds.test.ts` holds every
number to the id, length and whether it loops that it first shipped with
(`shipped-sounds.json`), because a host stores a sound by its number and
strokes are painted to its length: a number is never reused or given to
another sound, and a sound that is to be longer, shorter or looped is a new
sound with a new number.

The bank as written sits inside them: preset previews have their loudest
400 ms between −30 and −23 dBFS with peaks under −8.5 (Muted echo pattern and
Muted acoustic echo shipped at −33 and stay there), chains come out between
3.7 LU under the dry input and 2.8 LU over it (but for Night shortwave, a
narrow radio band that fades by design and sits 6 LU under it), stereo width
(side over mid) runs from mono to −2 dB with half the presets between −13 and
−5, and a whole patch costs at most 8 % of real time on the bench (a chain
at most 5 %).

Two things the whole bench shows that the rules do not hold. Across
instruments, three pairs of organ presets measure under 1 dB apart on the
organ phrase (Clarinet stop organ and Flugelhorn organ, Hollow glass organ
and Tape flute pipes, Saw rotary organ and Rotor brass organ): the
rule is for presets of one instrument, and these are different instruments
under the hands. And eighteen of the twenty-five master chains sit within
0.3 dB of another on the dry phrase, because a master chain is meant to do
little to a phrase that peaks at −10 dBFS: they part when they are driven.

### The bench

`report.test.ts` is skipped in a normal run. With `FACTORY_REPORT` set it
prints one line per entry to `tmp/`:

```bash
FACTORY_REPORT=presets FACTORY_DEVICE=choir pnpm vitest run src/dsp/factory/__tests__/report.test.ts
cat tmp/factory-presets-choir.txt
# worn-tape-choir  peak -12.4 dB  lufs -21.7  loudest -24.7 dB  attack 0.15 s  tail -29.8 dB  centroid 818 Hz  width -5.4 dB  6.3% rt
FACTORY_REPORT=chains  pnpm vitest run src/dsp/factory/__tests__/report.test.ts # first line is the dry input
FACTORY_REPORT=sounds  pnpm vitest run src/dsp/factory/__tests__/report.test.ts # with the kind the analysis gives
FACTORY_REPORT=devices pnpm vitest run src/dsp/factory/__tests__/report.test.ts # every device, parameter and preset
FACTORY_REPORT=keys    pnpm vitest run src/dsp/factory/__tests__/report.test.ts # every sound in all twelve keys
FACTORY_REPORT=generated FACTORY_SEEDS=40 pnpm vitest run src/dsp/factory/__tests__/report.test.ts # that many seeds of each kind
FACTORY_REPORT=chains  FACTORY_CATEGORY=tape pnpm vitest run src/dsp/factory/__tests__/report.test.ts # one group of chains
FACTORY_REPORT=stress  FACTORY_DEVICE=choir  pnpm vitest run src/dsp/factory/__tests__/report.test.ts # presets pushed, see below
FACTORY_REPORT=stress  FACTORY_CATEGORY=tape pnpm vitest run src/dsp/factory/__tests__/report.test.ts # chains pushed
# FACTORY=<part of an id> narrows any of them; FACTORY_WAV=tmp/wav keeps the audio
```

A line of `presets` or `chains` ends, in capitals, with where the entry leaves
what the bank is held to: `PEAK`, `LOUD`, `QUIET`, `DC` and, for a preset,
`WIDE` (side over mid). Before the lines come the faults that need no render:
`INVALID` (a device, preset or value that does not exist, or too many
effects), `LONG` (a name over 24 characters or a description over 140),
`WORDS` (a description that is not a sentence, a name ending in a digit),
`TWICE` (a name or id used before) and `SAME` (settings exactly those of
another entry). After them, under "nearest in sound", every entry is listed
with the one it sounds most like and how far off that is, nearest pairs
first, with `ALIKE` on a pair under 1 dB apart (0.3 dB for chains, which all
carry the same phrase): `printDistance` in `render-support.ts`, the level over
time, the spectrum and the width of two renders compared.
`FACTORY_WITH_PACKS=1` compares a preset with the pack presets of its
instrument as well, so a new preset is not a pack preset under another name.

`stress` asks what the level limits do not. A preset is left to ring for
half a minute (`GROWS` when the end is louder than the middle, `RINGS` when
it is still within 20 dB of its loudest second), played with eight keys at
full velocity (`HOT` over −1 dBFS) and with one key at each end of the
keyboard (`NAN`). A chain is fed the dry phrase for half a minute, the phrase
at −1 dBFS (`HOT` over full scale) and nothing at all (`NOISE` when it puts
out more than −60 dBFS by itself). These are prompts and not rules: a held
drone rings because it is one, and a preset that says it holds its last
chord is meant to.

`FACTORY_NUMBERS=135-140` narrows `sounds` and `keys` to a range of catalogue
numbers. A line of `sounds` adds to the measurements below: the kind the
analysis gives with what it went on (`hits`, `flat`, `tonal`); for a loop
whether it comes `round`, `fold` (the level over the crossfade against the
same stretch rendered straight: a seam that swells or dips) and `swing` (the
loudest second against the quietest); for a sound that ends, `lead` (silence
before it starts) and `end` (the level it stops at). Then, in capitals, what
wants a look: `KIND`, `QUIET` or `LOUD` (outside the band for its kind:
drones −19 to −12 LUFS, pads −22 to −13, textures −25 to −15, one-shots and
phrases −24 to −13), `DC`, `WIDE` (side within 1.5 dB of mid), `NAME` (over
24 characters in some key), `SLOW` (over 12 % of real time), `SEAM`, `FOLD`
(over 1.5 dB), `STEP-IN`, `CUT`, `LATE`. They are prompts and not rules:
`FOLD` on waves that are between two swells at the wrap is the waves.

`peak` is the sample peak, `lufs` BS.1770 integrated loudness, `loudest` the
RMS of the loudest 400 ms, `attack` the time to within 6 dB of the loudest
50 ms, `tail` the last half second relative to the loudest part, `centroid`
where the energy sits, `width` side over mid (above 0 dB collapses in mono)
and the last column the render cost.

## Adding to the bank

1. A preset goes in `src/dsp/factory/presets/<instrument>.ts`, a chain in
   `chains/<group>.ts`, a sound in its family's file under `sounds/` with the
   next free `number` (numbers are never reused). New entries go after the
   ones that are there: a preset or chain that shipped keeps its id, its name
   and every value, because a host stores it by id and someone may have saved
   a piece on it.
2. Run the bench for it and bring it inside the limits with the instrument's
   volume or an effect's mix, not by leaving it. Run it with
   `FACTORY_WITH_PACKS=1` and as `stress` too, and listen for what the
   figures cannot say: a single note through a stereo reverb can sit far to
   one side while the preview chord measures centred (see the devices below).
3. A new sound gets its row in `shipped-sounds.json`:
   `UPDATE_SHIPPED_SOUNDS=1 pnpm vitest run src/dsp/factory/__tests__/shipped-sounds.test.ts`.
4. `pnpm vitest run src/dsp/factory` must pass.

### Writing a sound

The sounds are in `src/dsp/factory/sounds/`, a file per family, put together
in order in `index.ts`:

| File               | Numbers    | What                                                                |
| ------------------ | ---------- | ------------------------------------------------------------------- |
| `first.ts`         | 101 to 134 | The first thirty-four, of every kind                                |
| `drones-held.ts`   | 135 to 140 | Held notes on the acoustic and modelled instruments                 |
| `drones-synth.ts`  | 141 to 146 | Synthesizer drones                                                  |
| `pads-synth.ts`    | 147 to 153 | Synthesizer chords that move                                        |
| `pads-acoustic.ts` | 154 to 160 | Strings, brass, voices, reeds and flutes in chords                  |
| `textures.ts`      | 161 to 170 | Weather, water, night, rooms and machines: no pitch                 |
| `oneshots.ts`      | 171 to 184 | One note or one chord, struck or plucked, that rings out            |
| `phrases.ts`       | 185 to 194 | Short phrases on one instrument, most of which come round           |
| `made.ts`          | 195 to 200 | Sounds made from another sound of the bank, through a sample device |

`recipe.ts` has what a recipe is written with:

- `looped(seconds, skip, crossfade, notes)`: notes held from the start, the
  first `skip` seconds thrown away (the attack), the end folded over the
  start. For anything held.
- `played(seconds, strokes, fadeOut?)`: notes struck at their times, rendered
  once and let ring. For a sound that ends.
- `cycled(seconds, strokes, { passes, crossfadeSec })`: the same strokes
  played round and round, the first `passes` rounds thrown away, the next one
  kept and folded linearly (`loopFold: 'linear'`) into the one after. What is
  kept starts with the tails of the round before in it, so laid end to end it
  plays on as if it had never stopped. For a phrase or a plucked chord that
  is to loop. No stroke may start in the last crossfade of the round, and it
  costs every round it renders: `passes: 1` is three rounds for one kept.
  An instrument whose restruck note adds to what still rings of it (the
  handpan) needs `passes: 2` before a round is like the next.
- `weather(...)`, `bells(...)`: the atmosphere device and the bell
  instruments as the first thirty-four set them.

A held tone that is to loop is tuned to a whole number of cycles per loop
(`tuning: 'whole-cycles'`) and turned a quarter cycle (`quarterTurn(seconds)`
from `parts.ts`), or the fold swells or dips by up to 3 dB (see the last
entry of [What the bench found](#what-the-bench-found-in-the-devices)).
Movement in a loop (an LFO, a chorus, a tremolo, a pluck that repeats) has
to come round too: a whole number of cycles in the loop's length.

A sound stays on the white keys in everything that sounds, not only in the
notes of its phrase: the partials of a bell, the strings of a tanpura, a
chord mode, a shimmer or a harmonizer add pitches of their own. A major
third over D, E, A or B is a black key, a minor third over C, F or G, a fifth
over B. Every note the name or description mentions is in braces in `words`,
so the sound is named where the key of a piece puts it.

Everything skipped is rendered and thrown away in the listener's browser, as
is every pass of `cycled` but one. A sound is as long as it needs to be to
not be heard repeating: eight seconds for most, sixteen where a slow
movement needs it.

Words are part of the entry: a name says what the sound is in two or three
plain words, a description says in one sentence what it sounds like and how
it is made. No artist names, trademarks or praise.

## Packs

A pack is a hundred presets that share one idea of sound: a room, a way of
working, a kind of tape. Every pack has at least two presets for each of the
thirty-four instruments and gives the rest to the instruments its idea turns
on, so whatever instrument is loaded, every pack has something for it.

An instrument that comes after the packs shipped is not asked of them
(`AFTER_THE_PACKS` in `packs/__tests__/support.ts`, today `zone-sampler`): a
pack is exactly a hundred presets and a shipped preset stays what it is, so
two more could only come in by dropping two that shipped. Its presets are in
the bank.

```ts
import {
  FACTORY_PACKS, // FactoryPack[]: id, name, description, count, sounds, chains
  FACTORY_PACK_SIZE, // 100
  factoryPack,
  loadFactoryPacks, // () => Promise<readonly FactoryPreset[]>
} from '@kieranklaassen/live-mix/dsp'

const presets = await loadFactoryPacks()
const mine = presets.filter((preset) => preset.pack === FACTORY_PACKS[0].id)
```

`FACTORY_PACKS` is a few lines of names and comes with the bank. The presets
do not: all 2,500 of them are a module of their own
(`src/dsp/factory/packs/all.ts`) behind a dynamic `import()`, which a bundler
keeps out of the script a page starts with. `loadFactoryPacks()` fetches them
once and hands back the same list from then on; a fetch that fails is tried
again by the next call. Each preset it gives carries the `pack` it belongs
to. A pack preset is an ordinary `FactoryPreset`: `renderPresetPreview`,
`patchInKey` and `loadPatch` take it as they take the bank's, and its id
starts with its pack's (`<pack id>-...`), so the ids of the bank, the chains
and the packs never meet.

| Pack                                           | What it is                                                                                                                                                           |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Empty Concourse** (`concourse`)              | Piano notes, glassy bells and sung vowels on loops of unequal length that never meet the same way twice: music for the hours between flights.                        |
| **Soft Pedal** (`soft-pedal`)                  | A piano played with the soft pedal down and left to hang in a very long, slightly detuned room. Few notes, slow, with the lid nearly closed.                         |
| **Austin Slow Brass** (`slow-brass`)           | Horns and strings that take half a minute to arrive and longer to leave, made by two patient people with guitars: no beat, no hurry, one chord.                      |
| **Shedding Oxide** (`oxide`)                   | Short orchestral loops on tape so old it sheds a little more each time round, until the tune is mostly the gaps.                                                     |
| **Faded Nature Film** (`nature-film`)          | Detuned synthesizers off a wobbling reel, as heard under a 1970s wildlife documentary in a Scottish classroom.                                                       |
| **Cornish Lucid Dreams** (`lucid`)             | Pads and bells remembered from sleep on the far south-west coast of England: soft, dark, a little out of tune and oddly moving.                                      |
| **Static Cathedral** (`static-cathedral`)      | Organ, piano and guitar pushed through broken digital gear until the church fills with warm static. Loud things made distant.                                        |
| **Coast Fog Four-Track** (`four-track`)        | A voice, a guitar and an old electric piano recorded to cassette by the Pacific, with the reverb up until the words are gone.                                        |
| **Museum Window Garden** (`window-garden`)     | A few bright notes on an electric piano, with water and birds outside: Japanese environmental music of the early eighties, written for a room with a view of trees.  |
| **Rosewood Circles** (`rosewood`)              | Marimba patterns that turn slowly round each other, with gongs and bowls between: percussion minimalism from Tokyo, played with soft mallets.                        |
| **Park Bench Zither** (`park-zither`)          | An open-tuned zither struck with hammers and brushed by hand through a phaser and an echo, bright as a laugh, first heard busking in a New York park.                |
| **Sonoran Night Air** (`sonoran`)              | Analogue pads that breathe as slowly as a sleeper, over the Arizona desert after dark. Open sky, long reverb, an hour without an edge.                               |
| **Polar Night Signal** (`polar-signal`)        | Cold loops and far-off radio from above the Arctic Circle: a town in the dark for two months, snow, a foghorn, a signal fading in and out.                           |
| **Pulse under the Forest** (`forest-pulse`)    | Old orchestral strings looped and blurred into fog between the trees near Cologne, with a kick drum's heartbeat somewhere far below.                                 |
| **Far North Bowed Guitar** (`far-north`)       | An electric guitar played with a cello bow, a falsetto, a pump organ and a glockenspiel, rising very slowly over an island of lava and moss.                         |
| **Steel in Slow Orbit** (`orbit-steel`)        | Pedal steel that slides instead of twangs, and guitars with all the attack taken off: country instruments sent up to circle the moon.                                |
| **Old Broadcast Hall** (`broadcast-hall`)      | A felt-damped upright with its mechanism in the microphone, a chorus polysynth and a tape echo, in a wooden radio hall by the river in Berlin.                       |
| **Sunburnt Laptop Guitar** (`laptop-guitar`)   | A guitar fed through a laptop until the chords melt into grain and glitter: beach pop remembered through a broken summer in Vienna.                                  |
| **Island Patch Cables** (`patch-cables`)       | A voltage-controlled synthesizer with no keyboard habits, woodwinds and a voice folded into it: bubbling, bright and green, from an island in the Pacific Northwest. |
| **Ashram Harp and Organ** (`ashram`)           | Harp glissandi, a swirling organ, a drone of strings and tanpura: spiritual jazz that left the clubs for an ashram in California.                                    |
| **Berlin Sequencer, 1974** (`sequencer-1974`)  | A bass sequence running through the night under tape-replay flutes and choirs, phased strings and an organ, in West Berlin in the mid seventies.                     |
| **Neon Rain, 2019** (`neon-rain`)              | Brass swells from a huge polysynth, electric piano through chorus and a digital hall the size of a city: Los Angeles in the rain, as 1982 imagined it.               |
| **Six Squared** (`six-squared`)                | Short sad synth loops layered until they glow, pressed hard into hiss and left in a long dark reverb: night music from England with rave in its memory.              |
| **Indiana Reel Room** (`reel-room`)            | Slow orchestral swells run through tape until they blur, over a drone low enough to feel: steep darkness, hiss and fades that take minutes.                          |
| **Stairwell Choir of One** (`stairwell-choir`) | One voice sung into a looper again and again until it is a choir, in the kind of reverb a stairwell or a church gives you for nothing.                               |

### What a pack is held to

`src/dsp/factory/packs/__tests__/<pack id>.pack.test.ts` renders every preset
of its pack, and `packs.test.ts` reads across them:

| Entry  | Rule                                                                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pack   | Exactly 100 presets, at least two for each instrument, a kebab-case id, a name of at most 24 characters, a one-sentence description               |
| Preset | The bank's rules, and tighter levels: raw preview peak at or below −8 dBFS, loudest 400 ms between −30 and −22 dBFS, no DC offset, 1 to 4 effects |
| Words  | A name of 3 to 24 characters that does not end in a digit, a description of at most 140 characters, an id that starts with its pack's             |
| Across | No id twice among bank, chains and packs; no name twice among bank and packs; no two presets with the same devices set to the same values         |

The levels are narrower than the bank's so that a list of thousands plays at
one loudness. As with the bank, nothing here has been heard by the tests:
they hold a preset to what can be measured.

### Writing a pack

1. Add its `{ id, name, description }` to `FACTORY_PACKS` in
   `packs/index.ts`, its presets as `packs/<pack id>.ts` (which exports
   `PRESETS`, a `readonly FactoryPreset[]`), an import and a line in
   `packs/all.ts`, and a `<pack id>.pack.test.ts` beside the others.
2. Measure it as you write:

   ```bash
   FACTORY_REPORT=packs FACTORY_PACK=<pack id> pnpm vitest run src/dsp/factory/__tests__/report.test.ts
   cat tmp/factory-packs-<pack id>.txt
   ```

   One line a preset, as for the bank, ending in capitals where it leaves
   the limits (`PEAK`, `LOUD`, `QUIET`, `DC`, `SLOW` over 12 % of real time),
   and at the foot what the pack still lacks: an instrument short of two, a
   name twice, two presets set alike. `FACTORY=<part of an id>` narrows it.

3. `pnpm vitest run src/dsp/factory/packs` must pass.

A pack may take after a way of making music; it never says whose. Names,
descriptions and ids hold no artist, record, track, label or maker's name:
they hint by sound, place, weather and hour. Each preset is written by hand
as a designed sound, starting from the instrument and not only from its
effects, and a description says only what its chain and its measurements
bear out.

## Pack sounds

A pack also holds a hundred sounds to paint with: its own presets played. A
pack sound names one of the pack's presets, says what is played on it and for
how long, and may change a setting or the effects where the sound needs it.
It is a `FactorySound` like the bank's, with its patch written out and the
`pack` it belongs to, so `renderFactorySound` and `transposeFactorySound`
take it as they take a sound of the bank.

```ts
import {
  FACTORY_PACKS, // each pack says how many sounds it holds: `sounds`, 100 or 0
  loadFactoryPackSounds, // () => Promise<readonly FactorySound[]>
  renderFactorySound,
} from '@kieranklaassen/live-mix/dsp'

const sounds = await loadFactoryPackSounds()
const mine = sounds.filter((sound) => sound.pack === FACTORY_PACKS[0].id)
const audio = await renderFactorySound(mine[0])
```

Like the packs' presets they are a module of their own
(`src/dsp/factory/sound-packs/all.ts`) behind a dynamic `import()`, fetched
once by `loadFactoryPackSounds()`; `FACTORY_PACKS` says before that which
packs have sounds. The packs are written one after another, so a pack whose
sounds are not there yet says `sounds: 0`.

A pack's sounds count up from a thousand times the pack's place: 1001 to 1100
for the first pack, 2001 to 2100 for the second. The bank's own numbers stay
under a thousand. A host that rendered the bank's hundred when it started
should not do that with these: a pack sound is rendered when someone asks to
hear it, which is why what is rendered for one (its skip, its length and its
fold) is kept under 26 seconds.

### What a pack sound is held to

`src/dsp/factory/sound-packs/__tests__/<pack id>.sounds.test.ts` reads every
recipe of its pack and renders every fifth sound;
`FACTORY_SOUND_PACKS=all pnpm vitest run src/dsp/factory/sound-packs` renders
them all, which is how a pack is checked before it ships.
`sound-packs.test.ts` reads across the packs.

| Entry  | Rule                                                                                                                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pack   | A hundred sounds or none, numbered in order from the pack's own thousand, at least ten of each kind (drone, pad, texture, one-shot, melodic), at most 1,000 seconds in all                        |
| Recipe | Every note a white key; 2 to 16 seconds long, at most 26 rendered; the first note its name gives is one it plays; a valid patch of WASM devices with at most five effects; an id under its pack's |
| Words  | A name of at most 24 characters in every key with its notes in braces, a one-sentence description of at most 140 characters                                                                       |
| Render | The bank's rules for a sound (its kind by the analysis, a loop that comes round, a sound that ends at rest), and loudness inside its kind's band, no DC offset                                    |
| Across | No id, number or name twice among the bank's sounds and every pack's; no id shared with a preset or chain; no recipe written twice                                                                |
| Kept   | A sound that has shipped keeps its number, id, length and loop (`__tests__/shipped/<pack id>.json`, added to with `UPDATE_SHIPPED_SOUNDS=1`)                                                      |

### Writing a pack's sounds

`sound-packs/<pack id>.ts` hands its recipes to `packSounds` with the pack's
presets:

```ts
import { PRESETS } from '../packs/concourse'
import { type FactorySound } from '../types'
import { cycled, looped, packSounds, played } from './recipe'

export const SOUNDS: readonly FactorySound[] = packSounds('concourse', 1000, PRESETS, [
  {
    n: 1, // its place in the pack: the sound is number 1001
    id: 'boarding-chime-a', // the sound's id is concourse-boarding-chime-a
    name: 'Boarding chime {A}',
    kind: 'oneshot',
    description: 'One struck {A} on the boarding chime, left to ring out in the hall.',
    preset: 'concourse-boarding-chime', // one of the pack's presets
    ...played(8, [[0, 1.2, 69]], 1.5),
  },
])
```

`set` changes settings of the preset's instrument for this sound, `effects`
puts other effects in place of the preset's, `then` adds effects after them
(a `quarterTurn` for a loop of steady tones). `instrument` writes an
instrument out for a sound no preset of the pack plays: weather, for most
packs. `source` names a sound of the bank for a sample instrument to play.
Everything under [Writing a sound](#writing-a-sound) holds: white keys in
everything that sounds, note names in braces, loops that come round.

```bash
FACTORY_REPORT=sounds FACTORY_PACK=<pack id> pnpm vitest run src/dsp/factory/__tests__/report.test.ts
cat tmp/factory-sounds-<pack id>.txt
FACTORY_REPORT=keys FACTORY_KEYS=-5,6 FACTORY_PACK=<pack id> pnpm vitest run src/dsp/factory/__tests__/report.test.ts
```

The bench prints the bank's line for each sound, then what the pack lacks as
a whole (its count, a kind it is short of), what each recipe breaks before it
is rendered, and the sounds that are nearest each other. `black` is the share
of a sound's power that lies on the black keys: a few per cent for a sound in
tune with the bank, about two fifths for rain. `OFFKEY` marks a pitched sound
over a quarter, which is either partials that are meant (a gong, a folded
wave) or a note the key does not have (a shifted fifth over a B, a chord mode
on the wrong degree). `FACTORY_NUMBERS=1001-1020` and `FACTORY=<part of an
id>` narrow it. When the pack is whole, add its id to `WITH_SOUNDS` in
`packs/index.ts` and its rows with `UPDATE_SHIPPED_SOUNDS=1`.

### The layout of the build

A device finds its module beside the script it is in:
`new URL('../wasm/plate-reverb.wasm', import.meta.url)`, which is right from
`dist/dsp/index.js` and from nowhere else. The build splits code that two
scripts share into chunks at the top of `dist/`, and a path that was right
one level down then points at nothing; a consumer's bundler leaves the file
out without a word, and the device fails when it is first used.

A script behind a dynamic `import()` shares whatever it imports with the
entry, so it must import nothing that reaches a device's descriptor. The
packs' presets are data alone. The packs' sounds are written with the bank's
own helpers (`looped`, `hall`, `transposeWords`), and those import only
leaves: `factory/words.ts` and `note-frequency.ts` import nothing, and
`factory/parts.ts` and `factory/sounds/recipe.ts` nothing but them and
types. Keep it so: a helper a pack sound needs goes in one of those, not in a
module that imports the registry or the renderer.

`pnpm pack:check` holds the build to it: every path a built script resolves
against itself must land on a file of the tarball.

## Pack chains

A pack holds a hundred effect chains as well: two to four effects in a row,
in the pack's idea of sound, for any channel. A pack chain is a
`FactoryChain` like the bank's, with the `pack` it belongs to, so
`renderChainPreview`, `patchEffectOps` and `loadPatch` take it as they take a
chain of the bank.

```ts
import {
  FACTORY_PACKS, // each pack says how many chains it holds: `chains`, 100
  loadFactoryPackChains, // () => Promise<readonly FactoryChain[]>
} from '@kieranklaassen/live-mix/dsp'

const chains = await loadFactoryPackChains()
const mine = chains.filter((chain) => chain.pack === FACTORY_PACKS[0].id)
```

Like the packs' presets and sounds they are a module of their own
(`src/dsp/factory/chain-packs/all.ts`) behind a dynamic `import()`, fetched
once by `loadFactoryPackChains()`. A pack chain's id starts with its pack's, it is listed under one
of the bank's seven groups, and every effect in it is on one of that effect's
own presets, with at most a time or a rate moved a little and an output
trimmed.

### How a pack's chains are made

Nobody writes two and a half thousand chains by hand, and nobody has heard
these. They are drawn, by a bench that is in the repository
(`src/dsp/factory/chain-packs/bench/`) and is no part of the library:

- **The lexicon** (`bench/lexicon/<device id>.ts`) says of every preset of
  every effect what it is in a few true words, what a chain led by it can be
  called, which place in a chain it can take (a room, a hall, an echo, a
  loop, wear, hiss, drive, motion and so on) and how it sounds (dark, long,
  worn, wide, faint, heavy, and `whole` for the few presets fit to stand on a
  finished mix). It was written by hand from each device's own description,
  its preset values and a table of every preset measured alone
  (`bench/probe.test.ts`). `bench/lexicon.test.ts` holds it to the devices:
  a preset added to an effect needs its words before the tests pass. An
  effect added since the chains were drawn has no file until someone writes
  it, and no pack chain uses it: the Tamer is the first
  (`LEXICON_COMPLETE=1` lists what is missing).
- **The recipes** (`bench/recipes.ts`) say what follows what: a loop, then
  wear, into a hall. They are the same for every pack. A tone in a track's
  chain has to be one that is heard, and a master chain is an equaliser, a
  compressor, a widener or a trace of tape before a limiter, each of them
  `whole`: nothing that takes the low end or the top, pumps, folds to mono or
  is heard as an effect, and no reverb.
- **A palette** (`bench/palettes/<pack id>.ts`) is where a pack becomes
  itself: how its hundred are spread over the groups, the traits and effects
  it leans to or never touches, the few recipes only it has, and the words
  its chains are named with.
- **The builder** (`bench/build.test.ts`) draws a recipe, fills each place
  with one preset by the palette's weights (a preset or a recipe the palette
  weighs under a quarter comes in only when nothing else can do the job),
  moves times and rates by up to an eighth, and then measures: the chain on
  three dry sounds (a sparse electric piano, a held chord, struck bells), and
  on the piano at full level for half a minute. In a shared recipe it does
  not put the same job in twice (two long tails, two wobbles, two reversals,
  two far-off rooms, a hiss under a preset that already hisses, the top taken
  off twice), nor a hint where it cannot be heard (beside a preset that takes
  the dry sound away, before a space that covers it, in a job another preset
  of the chain does in full), nor an effect that undoes an earlier one (a
  width folded to the middle again, a brightness taken off again, a dullness
  lifted again, repeats or a pulse under a long tail with no dry sound), and
  it does not name a chain for a preset that is only a hint; a pack's own
  recipes are held to their slots alone. It trims the chain to the level a
  pack plays at with the chain's own output, and keeps it only if it is
  inside the limits below and at least 1 dB by the bench's print from every
  chain kept before it, in the bank and in every pack. A master chain is a
  few tenths from the dry sound by design, and so from every other: it is
  told only from the master chains of its own pack, by 0.3 dB. A chain's name
  is one of its pack's words and what its leading effect is ("Harbour plate",
  "Loop under snow"); a master chain is named for what it gives a mix
  ("Stopover finish", "Tiptoe mixdown"), each with a pack word of its own. A
  name and its plural are one name ("Seasick echo", "Seasick echoes"), so are
  a name and its words turned round ("Treeline pad", "Pad at treeline"), and a
  noun that reads as something else with a capital never stands first
  ("Polish in the park", "Record past the gate"). Its sentence is each effect
  as the lexicon says it, in order.

| The bench refuses | When                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `SILENT`, `NAN`   | Nothing comes out on one of the three sounds, or a sample is not a number                               |
| `PEAK`            | Over −5 dBFS on the piano (which peaks at −10.6 dry), −3 on the chord or the bells                      |
| `LOUD`, `QUIET`   | More than 3.5 LU from the dry piano, 7 from the chord or the bells                                      |
| `DC`              | A mean of 0.01 or more                                                                                  |
| `SAME`            | Within 1 dB of all three dry sounds (0.3 for a master chain)                                            |
| `TWIN`            | Within 1 dB, on the three sounds together, of a chain already kept (a master chain: 0.3, its own pack)  |
| `GROWS`           | Half a minute on, the piano at −1 dBFS, the last five seconds are over 1 dB above seconds 12 to 17      |
| `HOT`             | The same run peaks over +3 dBFS                                                                         |
| `NOISE`           | The same run still puts out over −30 dBFS nineteen seconds after the playing stopped, and holds nothing |

```bash
# Once, and again when an effect's presets change: every preset alone (about 25 minutes; CHAIN_BENCH_SHARD=0/4 splits it)
CHAIN_BENCH=probe pnpm vitest run src/dsp/factory/chain-packs/bench/probe.test.ts
# Once: the bank's own chains as the bench hears them
CHAIN_BENCH=bank pnpm vitest run src/dsp/factory/chain-packs/bench/build.test.ts
# A palette's words, nothing measured (five seconds): tmp/chain-bench/sample-<pack id>.txt
CHAIN_BENCH=build CHAIN_BENCH_PACK=<pack id> CHAIN_BENCH_DRY=1 pnpm vitest run src/dsp/factory/chain-packs/bench/build.test.ts
# The pack, measured (about five minutes): tmp/chain-bench/<pack id>.txt and chain-packs/<pack id>.ts
CHAIN_BENCH=build CHAIN_BENCH_PACK=<pack id> pnpm vitest run src/dsp/factory/chain-packs/bench/build.test.ts
# After packs were drawn side by side, or after the lexicon, a recipe or a palette was mended: see below
CHAIN_BENCH=settle pnpm vitest run src/dsp/factory/chain-packs/bench/build.test.ts
```

Packs drawn at the same time have not seen each other, and a chain is only
as true as the lexicon was on the day it was drawn. `settle` goes through the
packs in their order and takes out of each what an earlier pack already has
(a name, an id, the same effects on the same presets, a sound within the twin
limit), what no longer fits its recipe's slots or the builder's rules as the
lexicon and the recipes are now, what has a name its palette's words and its
leading preset's nouns no longer give, and what a reader struck
(`tmp/chain-bench/struck.json`, `{ "<pack id>": ["<chain name>"] }`: a reader
with the pack's report in front of them is the only check there is on a name
that says something its chain is not). It says every remaining chain's
sentence again in the lexicon's present words. Building each pack once more
afterwards fills what was taken out and writes its module anew.

That is how the packs were made. Every pack was drawn and then read, a reader
to a pack, against the rule on names and for what a measurement cannot see: a
name that reads as a household object ("Rose-petal pan", for a pan from side
to side), a choir where nothing sings, a master chain whose equaliser thins
the bass of a whole mix, two effects that cancel. The first reading struck
about one chain in seven. What it found was mended where it came from, in the
lexicon's nouns, clauses and tags, the recipes and the palettes' words, not
chain by chain; `settle` then held every chain to the mends, about half were
drawn again, and the new ones were read in their turn. The second reading
struck about one new chain in fourteen, most for a name ("Plate on the
stairs", "Finish a flight up") and a few for a pattern no rule yet refused (a
faint room before a hall, the top dulled twice); those were mended the same
way, an eighth of the chains were drawn once more, and those were read a
third time. The third reading struck about one new chain in twenty-five, a
third of them a name that was another's words turned round, which the bench
now refuses. The thirty or so chains drawn after it were read by whoever ran
the bench, not by a reader to a pack.

The bench keeps what it has drawn under `tmp/chain-bench/` and draws only what
a pack still lacks, so a pack that is short after a change is topped up, not
drawn again; `CHAIN_BENCH_FRESH=1` starts it over. A pack that has shipped is
not drawn again at all: see "Kept" below.

### What a pack chain is held to

`src/dsp/factory/chain-packs/__tests__/<pack id>.chains.test.ts` reads every
chain of its pack and renders every tenth on the bank's dry phrase;
`FACTORY_CHAIN_PACKS=all pnpm vitest run src/dsp/factory/chain-packs` renders
them all, which is how a pack is checked before it ships.
`chain-packs.test.ts` reads across the packs.

| Entry  | Rule                                                                                                                                                     |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pack   | A hundred chains or none, at least five in each of the seven groups                                                                                      |
| Chain  | Two to four effects, each on a preset, no effect twice; a valid patch of WASM devices; an id under its pack's                                            |
| Words  | A name of 3 to 20 characters that does not end in a digit, a one-sentence description of at most 140 characters                                          |
| Render | The bank's rules for a chain: peak at or below −5 dBFS on the dry phrase, within 4 LU of it, no DC offset, and a sound that is not the dry phrase        |
| Across | No id shared with anything in the bank or the packs; no name twice among all chains; no two chains on the same effects and presets, or set exactly alike |
| Kept   | A chain that has shipped keeps its id, its name and every value (`__tests__/shipped/<pack id>.json`, added to with `UPDATE_SHIPPED_CHAINS=1`)            |

The naming rule of the packs holds here too: a palette's words hint by place,
material, weather and hour, and where a noun of the lexicon would in one pack
name a work of the musician it takes after, that pack's palette lists it under
`avoid`.

## What the bench found in the devices

Writing the bank meant measuring every device and most of their presets.
The first group below was re-measured after it was reported and has since been
fixed in the devices; each entry says what the fault was, what the device does
now and what is left. The second group is as the bench reported it and is not
fixed.

Fixed:

- **`ether-reverb` preset "Frozen" was silent.** Freeze muted the input and
  the dry signal, so loaded with freeze on there was nothing to hold and
  nothing could get in. A freeze with nothing ringing now waits: the first
  sound gets in, and the room is held once its tail has passed its top. On
  the chain phrase "Frozen" comes out at −17.2 LUFS and is still there at
  the end (the last half second 1.6 dB under the loudest part). `expanse`,
  `grain-cloud` and `spectral-blur` are not changed: loaded with freeze on
  they still pass only the dry signal and hold nothing. No factory chain
  loads with a freeze on.
- **`fet-limiter` passed single transients.** A click at −6 dBFS left at
  +6 dBFS with 12 dB of input gain and at +18 dBFS with 24 dB, because the
  0.8 ms attack never sees it. A ceiling now follows the compressor (a wire
  to half scale, a tanh knee from there to full scale): the same clicks
  leave at 0.0 dBFS, and a steady tone is where it was (−7 and −4 dBFS).
- **`saturator` overshot full scale** with `outputDb` 0, on every curve and
  not only Hard. Most of it was the DC blocker tilting the flat top of a
  clipped low note: 3.7 dB over on a 41 Hz tone, 0.1 to 1.2 dB on the chain
  phrase at 12 to 36 dB of drive. The blocker now works under the curve's
  ceiling and that part is gone (41 Hz: 0.0 dB; the phrase: under 0.1 dB up
  to 24 dB of drive, 0.3 dB on Hard at 36). What is left is what
  band-limiting a squared wave adds, on a pure tone 0.1 dB at 12 dB of drive
  and up to 1.5 dB at 36: holding that would put back the aliasing the
  oversampling removes (−86 dBFS became −40 when it was tried), so it stays.
  At `oversample` 1x the output is the curve exactly.
- **`ember`'s pulse oscillator carried DC** when its width was off centre
  (the stock presets "Glass pad" and "Dark drone" by −0.045 and −0.027 at
  the oscillator). The pulse is now centred on zero at every width; both
  presets measure 0.000.
- **`grain-synth`'s built-in sound was out of phase in its middle.** With
  Spread 0 the side signal was 4 to 5 dB above the mid at positions 0.3 to
  0.6, so the stock presets there collapsed in mono until a sample was
  loaded. Its stereo is now made of each partial leaning a little from side
  to side, which sums to the plain partials in mono: the side is 5.6 to
  12.5 dB under the mid at every position.
- **`hall-reverb` lost level as mix rose**: its presets came out 2.4 to 4.5 LU
  below the dry signal, and 7 dB fully wet. The balance is now levelled
  (`docs/faust-devices.md`): the presets are within 0.9 LU of the dry phrase
  and steady sound within 0.2 dB at any mix. The nineteen factory presets
  that end in it had been turned up to make good the loss, so each was
  trimmed by what it gained (2.4 to 4.1 dB, at the instrument's volume or at
  the output of a tape, saturator or limiter standing before the reverb) and
  measures within 0.3 LU of where it was. Seven factory sounds struck at
  time zero are 0.7 to 2.6 LU louder at the same −6 dBFS peak: Mix glides up
  from zero in the first 20 ms after loading, which used to let the strike
  through 3.7 dB above the rest of the note and now lets it through 0.2 dB
  above.

As reported:

- `ether-reverb`: level and left/right balance move with pitch (about 7 dB and
  ±4.5 dB across transpositions of one phrase); its tail is shorter than
  `decay` says (near 11 s at `decay` 30); "Room" goes out of phase on pure
  tones; "Cathedral" runs about 5 dB hotter than `fdn-reverb` at a similar mix.
- `bloom-reverb` rings much shorter than its decay value; `shimmer`'s tail
  shortens as `shimmer` rises.
- `bowed-string` in Bow mode: `position` changes nothing measurable and
  `brightness` very little; only `pressure` moves the spectrum. Its Volume
  swell preset is quiet (−32 dBFS loudest on a chord) and its 0.9 s attack
  measures as 0.2 s.
- `felt-piano` plays its pedal thump on load when a preset sets `sustain` to 1.
- `modal-bells`: "Vibraphone" chokes short notes (release 0.75); "Gong" is
  very dark and quiet on low notes.
- `lattice` comes out about 5 LU quiet on every preset; `spectral-drifter` is
  close to mono and about 7 LU below the dry signal.
- `thesis` has no volume parameter and one key at high resonance sits near
  −39 dBFS, so three presets use `fet-limiter` input gain as make-up; its
  Width changes level and stays mono up to 75.
- `organ` is close to mono; `atmosphere`'s event types (rain, crackle) have a
  25 to 30 dB crest factor and sit far below the other sounds at default
  volume; `tape` hiss keeps running after the notes stop, by design.
- Wet levels differ widely between reverbs fully wet: `plate-reverb` "Long plate"
  +6.5 LU, `spectral-blur` "Slow dissolve" +5 LU (`hall-reverb` "Hall" was
  −7 LU and is levelled now, see above).
- `choir` with `ensemble` above 0, or any vibrato, beats deeply enough for
  `analyzeSound` to count notes (27 onsets on one held note at `ensemble` 1);
  `organ` does the same at `celeste` 0.9. The factory sounds made from them
  keep both at 0.
- `atmosphere` at its default width has as much side as mid; `sympathetic`'s
  Major and Minor tunings follow the root's own scale (root D rings F sharp
  and C sharp); `drone` "Tanpura" has its fifth partial as loud as the root.
- Found while the bank went from 34 sounds to 100, and worked round in the
  recipes (`sounds/`), not fixed:
  - Level: instruments leave at about −35 dBFS RMS, so `ambient-comp` does
    nothing above a threshold of −45 and `fet-limiter` nothing under about
    30 dB of input. Both let a pick through and pull the body of the note
    down after it, so a plucked sound comes out quieter at the bank's peak,
    not louder (`soften` or `ambient-limiter` "Pinned" does what was wanted).
    `ambient-comp` is linked on stereo power, so the level of the mono sum
    still moves after it.
  - `felt-piano`: the level of a single note depends on its pitch, E4 about
    10 dB over D4 at gain 0.6 and 5 to 6 dB at 0.9, so the balance of a phrase
    shifts from key to key.
  - `flute`: its pitch rises with how hard it is blown and is in tune near
    gain 0.75; one flute alone is close to a sine.
  - `tanpura`: the key played is not the string heard first (key G3 sounds D3,
    the first string a fourth under it), and its plucks wander in time by
    design: twelve take 7.9 to 8.1 s, so a loop sets `speed` for the cycle to
    fill it (2.698 for twelve plucks in 8 s).
  - `handpan`: a note struck again adds to what still rings of it, so the
    second round of a phrase is louder than the first.
  - `pedal-steel`: on a picked note the third harmonic is the loudest partial,
    10 dB over the fundamental, which is a black key on B. A held note
    darkens and its fifth beats; only `sustainer` fully wet holds it level.
  - `modal-bells` "Church bell": its partials are 0.5, 1, 1.2, 1.5, 2, 2.5, 3,
    4, 5.33, 6.67 and 8 times the note. The minor third (1.2) is a natural
    only over D, E, A and B, and 2.5 is a major third: `position` 0.667 puts
    that one on its node, which leaves D as the root with every partial on a
    white key.
  - `harp`: `halo` does nothing while a single string rings.
  - `dusk`: its chorus turns at 0.513 Hz whatever is set, which no loop of 8
    or 16 s comes round on; the `chorus` effect at 0.25 Hz does.
  - `fm-glass`: with `detune` above 0 the two sides beat against each other
    to silence in mono.
  - `ladder-bass`, `aurora`, `wavetable`: `sub` adds the octave below every
    note of a chord, which puts close intervals in the bass. Alone under one
    low note it is all there is under 40 Hz, where `analyzeSound` hears no
    pitch: a sub drone needs harmonics above it to stay a drone five
    semitones down.
  - `horns` with `section` above 0 and `chamber-strings` with more than one
    player move enough to read as a pad, not a drone; so do spring and plate
    reverbs after a held `pedal-steel`.
  - `mallets` at `decay` 1.5: the bars stop before a hall's tail does, and the
    tail is counted as hits (one key read as a beat); at 2.2 it is not.
  - `plate-reverb`: the drift in its tail under one long held note is counted as
    hits; `hall-reverb` under the same note is not.
  - `sampler` preset "Tape choir" plays an octave down and six cents sharp
    (`fine` 6).
  - `spring-reverb` and a plate after a held `pedal-steel` chord: the
    brightness of the result jumped from key to key; through `expanse` it
    rises evenly with the key.
- Found while the bank went from 170 presets to 680 and from 76 chains to
  216, and worked round in the presets and chains, not fixed:
  - Stereo reverbs put a single steady note to one side, by how its pitch
    falls on their delay lines. The preview chord measures centred, so the
    bench's width figure does not show it. On pure tones (flute, clarinet,
    sine, glockenspiel, tines): `spring-reverb` 10 to 16 dB ("Two spring
    tank", "Long three spring"; "Narrow warm tank" is balanced), `ether-reverb`
    up to 8 dB and 12 to 16 on a fading tail ("Bright chamber", "Cathedral"),
    `fdn-reverb` "Short ambience" up to 12.6 dB on a fading note and 1 to 4
    when larger, `plate-reverb`, `shimmer` and `expanse` 4 to 6, `vowel-reverb` up
    to 4.7 at full width, `hall-reverb` 1 to 4. `bloom-reverb` with `bloom` 0
    stays within 0.2 dB but rings on A. A preset on a pure-toned instrument
    therefore ends in `hall-reverb`, `bloom-reverb` or a narrow room.
  - Echoes and followers lean too: `tape-echo` and `echo-memory` to the left
    at any `spread` (3.3 dB at 0.5), `octaves` by note with `spread` up,
    `sympathetic` 4 to 15 dB left in its tail at `width` 0.6 and above (0.35
    is balanced, and narrowing it raises its level 3 dB), `pad-follower` 1 to
    2 dB left on a phrase and up to 8 on one note, `re-amp`'s room up to 3 dB
    either way as `room` moves and 7 to 10 on a far microphone, `phaser` on a
    sparse low spectrum at `stereo` above about 15.
  - Instruments that pan by pitch before any effect: `flute`, `organ`,
    `handpan`, `harp` (low strings 3.5 dB left), `zither` (up to 6 dB),
    `tanpura` (each key's first string is on the left), `west-coast` with
    `chance` up, `modal-bells` with `spread` above 0.2, `fm-glass` on its Bell
    and Glass algorithms, `horns` with `section` 1 (10 dB from side to side
    on a pure tone).
  - `fet-limiter` works from −12 dBFS on each channel, lets a pick or strike
    through and pulls the ring down after it with its half-second release, so
    it is no clean make-up gain and pumps a bed under sparse clicks.
    `analog-drive` at low drive holds a pick where `ambient-comp` "Pluck
    tamer" lets it through; `analog-drive`'s own auto gain holds an output
    ceiling (fed −1 dBFS it peaks at −12 to −15).
  - `auto-filter` in Peak mode gains about 2Q at its cutoff with nothing to
    make it good (+21.6 dB at Q 6: a held note the sweep crosses comes out
    11 dB louder), and its envelope follows linear level, so "Touch wah" barely
    moves at the level instruments leave at.
  - Mixes that are crossfades and cost level part-way: `chorus` (2.5 to 4 LU
    at 0.4, and it combs a pure tone by up to 5 dB from key to key),
    `micro-looper` (4.5 LU at 0.4), `ambient-comp`, `phaser` (3 LU at 0.5),
    `vinyl` (2.5 LU).
  - Devices that add level: `ether-reverb` grows with `decay` ("Cathedral"
    +4 LU alone, "Shining tail" 11 LU hot fully wet) and passes full scale at
    a mix of 0.3 to 0.4 fed at −1 dBFS; `spectral-blur` +2.5 LU at a mix of
    0.3 to 0.45 with wet peaks 4 to 6 dB over the dry, and it delays the dry
    signal 47 ms; `freq-shifter` "Barber pole" +3.8 LU and up to 7 dB of
    peak. `spectral-drifter` goes the other way, its wet 9 to 12 dB under
    the dry.
  - Noise that outlasts the notes: `radio` interference fires with no input
    at any amount above 0 and its static runs about 20 s after the input
    stops (and `radio` is mono, with no output level); `vinyl` surface noise
    starts with the first input and never stops; `tape` hiss as before.
  - `stereo-widener` "Mono" is not mono under about 1 kHz (the side of a wide
    pad stays 8 dB under the mid); `rotary` widens only above its 800 Hz
    split; `low-bitrate` gates to digital silence, so a reverb before it
    loses its tail 1.2 s after the release.
  - Instruments: `ember`'s unison copies are detuned in equal steps and
    start an eighth of a cycle apart, so eight voices nearly cancel on a
    first note and surge about once a second, and its LFO to Amp or Pan is
    not smoothed; `dusk`'s chorus I + II is a fixed comb and exactly mono;
    `felt-piano`'s `action`, `pedalNoise` and `sostenuto` do nothing
    measurable and `polyphony` 1 clicks on a stolen voice; `guitar` stops a
    note on key release whatever `sustain` says; `thesis` voices share one
    noise source, so bands that coincide add in phase; `wavetable`'s sub
    starts at a random phase against its oscillators; `ladder-bass` mixes saw
    and square in opposite polarity (near `wave` 0.42 the fundamental
    cancels); `tape-orchestra` holds a note for ever at `length` 9; `drone`
    with `partials` 0 leaves one partial at full level.
  - Presets that shipped and flag on the stress run, left as they shipped:
    eight keys at full velocity pass −1 dBFS on Slow shore, Temple
    shakuhachi, Soprano into tape echo, Bare piano hall, Ice chime crystals, Rain
    taps, Yarn marimba and Storm over the hills; the chains Frozen room,
    Spectral smear, Harmony in thirds and Chord organ pass full scale fed at
    −1 dBFS; Latched pedal tone grows because it loads held.
- Found while every preset of every effect was measured alone for the packs'
  chains (`chain-packs/bench/probe.test.ts`: 826 presets on a sparse piano, a
  held chord and bells), and worked round in the lexicon, which says of a
  preset what it measures as and not what it is called. Not fixed:
  - Presets that are not what their names say: `hall-reverb` "Dark hall"
    measures brighter than "Bright hall", and `fdn-reverb` "Bright air" is
    not bright; `shimmer` "Endless ascent", `spectral-blur` "Endless",
    `low-bitrate` "Frozen stream" and `grain-delay` "Frozen haze" die away;
    `sustainer` "Frozen moment" catches nothing and `micro-looper` "Soft
    bed" has lost its loop in ten seconds; `ether-reverb` "Frozen" and "Soft
    freeze" pass the first sound and mute everything after it; `swell` "Slow
    attack" takes 160 ms; `chorus` "Vibrato" is a warble with the dry sound
    in it; `analog-delay` "Noisy clock" adds no noise; on `vinyl` "Slow
    platter" the spin time does nothing.
  - Presets that barely act at the level instruments leave at:
    `spectral-drifter` (every preset 0.1 to 1.5 dB off the dry sound),
    `vintage-digital` (nine of sixteen under 1 dB), `saturator` (and its
    "Init" comes out 5.8 LU hot), `auto-filter` "Low-pass gate" (no envelope
    amount).
  - Level: eleven of `lattice`'s sixteen presets come out more than 3.5 LU
    quiet; `octaves` has no level control and runs 2 LU hot;
    `stereo-widener` "Ultra wide" is 9 LU hot on a held chord and
    `bloom-reverb` "Wide summer" 6 LU.
  - Stereo: with the Random shape an LFO's Stereo does nothing under 180°,
    so those `flanger` and `phaser` presets stay mono; `rotary`'s brake
    presets are near mono.
  - `echo-memory` "Far back" and "Minute ago" read as growing on the bench's
    half-minute run, which is shorter than their reach: probably a false
    alarm, and they are kept out of the packs' chains all the same.
  - The noise devices (`noise-floor`, `vinyl`, `tape`, `radio`) put out
    nothing until they have been played into and go on after the playing
    stops, so a render of silence says nothing about them: the bench reads a
    chain's noise from the end of a half-minute run in which the playing
    stopped at six seconds.
  - Found when the lexicon was gone through again after the packs' chains had
    been read: `swell` "Backwards" plays nothing backwards (a late swell) and
    "Loud notes only" is a gate; `shaped-reverb`'s Reverse shape is a rising
    level, not a reversal, and its Pulse shape makes three waves in a Time;
    `sustainer` "Wavering choir" has no vowels in it; `tremolo` "Drifting
    comb" and "Slow chorus" are a comb sweep and a chorus; `micro-looper`
    "Sampler grit" is muffled and has no grit; `rotary` sums what it is given
    to mono; `tape`'s and `patina`'s hiss sounds only while something passes;
    `fet-limiter` "Squash", "Tucked under" and "Flattened" measure alike;
    `analog-drive` "Warm glue" tilts by about 4 dB at either end;
    `sympathetic` "Minor wash" is 8.5 LU hot on bells and `patina` "Hot
    valve" 6 LU over the dry sound; `stereo-detune` "Thickener" and "Top
    only", `vowel-reverb` "Lone voice" and `spring-reverb` "Dark amp spring"
    are under 1 dB off it.
  - Two preset names a reader took for names of things that are sold:
    `grain-delay` "Crystals" (octave-climbing grain repeats) and `rotary`
    "Chorale" and "Tremolo" (a maker's labels for the two speeds). The
    lexicon no longer names a chain for them; the presets are as they shipped.
  - Of the bank's own 216 chains the packs' bench would refuse fifteen: eight
    are too near the dry sound (most of them master chains, within 0.3 dB),
    five still put out over −30 dBFS half a minute on (loops and holds that
    are meant to go on), two are over 3.5 LU quiet on the piano, one of
    those five among them, and one passes +3 dBFS fed at −1.
- `renderPatch`'s loop fold is an equal-power crossfade, which is right for
  noise and moving sound but adds a steady tone to itself in amplitude: a held
  note can come out up to 3 dB louder or quieter across the crossfade,
  depending on the phase it meets itself in. The organ, cello and string
  sounds get round it in `sounds/first.ts`: each note is retuned by under two cents
  to a whole number of cycles per loop, and a `freq-shifter` then moves
  everything a quarter of a cycle per loop, so every partial meets itself a
  quarter turn on, where amplitudes add in power.
