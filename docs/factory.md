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

|             | Count | Groups                                                                                                       |
| ----------- | ----- | ------------------------------------------------------------------------------------------------------------ |
| **Presets** | 75    | Five for each of the fifteen stock instruments: pads, keys, bells, strings, voices, organs, drones, textures |
| **Chains**  | 33    | Space, echo, tape, motion, texture, pitch, master; every WASM effect is in at least one                      |
| **Sounds**  | 34    | Looping drones, pads and textures, one-shots, short phrases, and three made from other sounds                |

The bank is data: importing it loads no module and touches no audio. A host
lists it before audio starts and renders only what someone asks to hear.

- `renderPresetPreview(preset)` plays the preset's phrase (its category's:
  a held chord for a pad, a broken chord for keys, four strikes for a bell, a
  low fifth for a drone; `preview` overrides it) for eight seconds with the
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
lock. A sound has a catalogue `number` that never changes (ambient-live's
sample id for it is a billion plus the number) and a `kind` that
`analyzeSound` must agree with, so the list can show the right icon before
the sound has been rendered.

## What the bank is held to

`src/dsp/factory/__tests__/factory.test.ts` renders every entry with the
committed modules and fails the build when one leaves these limits:

| Entry  | Rule                                                                                                                                                       |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All    | Kebab-case id unique across presets and chains, name of at most 24 characters and unique, a one-sentence description, every device, preset and value valid |
| Bank   | At least three presets per instrument, two per category, and every WASM effect used somewhere                                                              |
| Preset | Raw preview peak at or below −3 dBFS, loudest 400 ms between −36 and −12 dBFS, no DC offset, finite output                                                 |
| Chain  | On the dry phrase: peak at or below −1 dBFS, within 9 LU of the dry input, and it changes the sound                                                        |
| Sound  | 2 to 32 s, peak at −6 dBFS, not near-silent, `analyzeSound` gives its `kind`, a loop's seam no larger than a step inside it, a one-shot ends at silence    |

The bank as written sits well inside them: preset previews have their loudest
400 ms between about −31 and −23 dBFS with peaks under −9, chains stay within
3 LU of the dry input, stereo width (side over mid) is between about −12 and
−2 dB, and a whole patch costs under about 12 % of real time on the bench.

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
# FACTORY=<part of an id> narrows any of them; FACTORY_WAV=tmp/wav keeps the audio
```

`peak` is the sample peak, `lufs` BS.1770 integrated loudness, `loudest` the
RMS of the loudest 400 ms, `attack` the time to within 6 dB of the loudest
50 ms, `tail` the last half second relative to the loudest part, `centroid`
where the energy sits, `width` side over mid (above 0 dB collapses in mono)
and the last column the render cost.

## Adding to the bank

1. A preset goes in `src/dsp/factory/presets/<instrument>.ts`, a chain in
   `chains.ts`, a sound in `sounds.ts` with the next free `number` (numbers
   are never reused).
2. Run the bench for it and bring it inside the limits with the instrument's
   volume or an effect's mix, not by leaving it.
3. `pnpm vitest run src/dsp/factory` must pass.

Words are part of the entry: a name says what the sound is in two or three
plain words, a description says in one sentence what it sounds like and how
it is made. No artist names, trademarks or praise.

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
- **`limiter-1176` passed single transients.** A click at −6 dBFS left at
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
- **`zita-rev1` lost level as mix rose**: its presets came out 2.4 to 4.5 LU
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
  −39 dBFS, so three presets use `limiter-1176` input gain as make-up; its
  Width changes level and stays mono up to 75.
- `organ` is close to mono; `atmosphere`'s event types (rain, crackle) have a
  25 to 30 dB crest factor and sit far below the other sounds at default
  volume; `tape` hiss keeps running after the notes stop, by design.
- Wet levels differ widely between reverbs fully wet: `dattorro` "Long plate"
  +6.5 LU, `spectral-blur` "Slow dissolve" +5 LU (`zita-rev1` "Hall" was
  −7 LU and is levelled now, see above).
- `choir` with `ensemble` above 0, or any vibrato, beats deeply enough for
  `analyzeSound` to count notes (27 onsets on one held note at `ensemble` 1);
  `organ` does the same at `celeste` 0.9. The factory sounds made from them
  keep both at 0.
- `atmosphere` at its default width has as much side as mid; `sympathetic`'s
  Major and Minor tunings follow the root's own scale (root D rings F sharp
  and C sharp); `drone` "Tanpura" has its fifth partial as loud as the root.
- `renderPatch`'s loop fold is an equal-power crossfade, which is right for
  noise and moving sound but adds a steady tone to itself in amplitude: a held
  note can come out up to 3 dB louder or quieter across the crossfade,
  depending on the phase it meets itself in. The organ, cello and string
  sounds get round it in `sounds.ts`: each note is retuned by under two cents
  to a whole number of cycles per loop, and a `freq-shifter` then moves
  everything a quarter of a cycle per loop, so every partial meets itself a
  quarter turn on, where amplitudes add in power.
