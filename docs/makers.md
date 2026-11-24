# Note makers

A note maker stands between whatever plays notes and the instrument, and
writes notes of its own from them: a second voice, a mirror, a melody, a
chord over a bass. It makes no sound. Nobody has listened to one; what is
said of them here is what was computed and measured.

A maker is a rule over notes and seconds, in TypeScript, in
[`src/core/makers`](../src/core/makers). One rule runs in two places:

- `makePhrase(notes, maker, options)` writes a whole phrase at once. A patch
  with a maker is rendered through it (`renderPatch`, `madePhrase`).
- `MakerPlayer` runs the same rule on a clock, while a person plays. It
  keeps a timer only while the maker has something to do by itself.

What comes out depends on what was played and when, never on how often the
clock was asked, so a performance and its render are the same notes. Where a
maker needs chance it draws from a seed of its own (`MakerRandom`).

## In a patch

`Patch.maker` names one in front of the instrument:

```ts
const patch: Patch = {
  id: 'two-choirs',
  name: 'Two choirs',
  category: 'voice',
  description: 'A line on the choir with its mirror on the flute.',
  maker: {
    makerId: 'mirror-on-d',
    preset: 'Both ways', // one of the maker's own presets
    params: { delay: 0.5 }, // over it
    parts: { mirror: { deviceId: 'flute' } }, // a voice on an instrument of its own
    key: { root: 0, steps: [0, 2, 4, 5, 7, 9, 11] }, // absent, the white keys
  },
  instrument: { deviceId: 'choir' },
  effects: [{ deviceId: 'plate-reverb' }],
}
```

- The steps are counted in the key. A patch with none is on the white keys;
  `transposePatch` moves the key with the notes, and a host that plays it
  live gives the key of the piece.
- A maker writes notes of the key, and the piece's tuning is applied to what
  it wrote.
- Two notes of one pitch on one instrument are one voice. A part with an
  instrument of its own is another instrument. The instruments of the parts
  are added to the patch's own before the effects. One that plays a loaded
  sound (a sampler) is refused as a part.
- A patch whose instrument is a kit plays its notes as they come, and so
  does one whose maker is switched off (`bypass`).
- The times of a maker that has any (`timed`) follow the tempo of a sound
  that keeps one.
- A bank preset may carry a maker. A host that does not know makers, such as
  a build from before them, plays the preset's instrument as it is.

## Writing one

1. `src/core/makers/<id>.ts`: a class on `MakerBase` and a descriptor. The
   class says what happens when a note comes (`onNote`) and when it goes
   (`onRelease`), and leaves anything later to `at`. `start` and `end` (or
   `play`) write notes. `this.key` and `this.params` are the key and the
   controls as they stand. No `Math.random`, no `Date`, no timer.
2. The controls are `ParamSpec`s, each with a description of 20 to 170
   characters, and the maker has at least sixteen presets of its own.
3. `src/core/makers/__tests__/<id>.test.ts` calls `makerContract` and then
   says what the rule writes, by hand: the notes of the rule's own examples.
4. A row in `NOTE_MAKERS` (`table.ts`), and bank presets in
   `src/dsp/factory/presets/maker-<id>.ts`.

`makerContract` asks of every maker: the same notes however the clock is cut
up; another key is the same notes so far up or down; whatever begins ends;
no more than 64 voices at once; notes an instrument can play; every control
changes something; every preset writes something no other writes; and
`silence` silences it.
