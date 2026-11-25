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

## The makers

Written from the makers themselves by `UPDATE_DOCS=1 npx vitest run
src/core/makers/__tests__/docs.test.ts`; do not edit it by hand. A control
marked (time) or (rate) is moved with the tempo by a sound that keeps time.

<!-- prettier-ignore-start -->

<!-- makers: start -->

### Six Voices From One Line (`six-voices`)

Plays each note with its mirror round a centre, the middle, the mirror of the middle, its octave flip and the centre, all in the key: one line becomes a choir. It answers.

| Id | Control | Range | Rest | What it does |
| --- | --- | --- | --- | --- |
| `line` | Line | 0 to 1 | 1 | How hard the note you play sounds itself, taken to the nearest note of the key. At zero only the voices made from it are heard. |
| `mirror` | Mirror | 0 to 1 | 0.65 | Level of the mirror: as many steps below the centre as the note is above it, and the other way round. |
| `middle` | Middle | 0 to 1 | 0.4 | Level of the middle: the note halfway between yours and the centre. |
| `mirrorMiddle` | Mirror middle | 0 to 1 | 0.35 | Level of the mirror of the middle: the halfway note on the other side. |
| `octaflip` | Octave flip | 0 to 1 | 0.3 | Level of the octave flip: your note an octave down when it is above the centre, an octave up when it is below. |
| `centreLevel` | Centre level | 0 to 1 | 0.3 | Level of the centre: the note that stands still while the others turn round it. |
| `fall` | Fall | 0 to 4 | 1 | How much quieter a made voice is the further it lies from the centre. At one it halves for each octave; at zero distance does not count. |
| `delay` | Delay (time) | 0 to 3 s | 0 | How long each voice waits after the one before it. A few hundredths strum the chord; half a second or more makes a canon. |
| `order` | Order | Voices, Pairs, Outward, Inward, Upward, Downward | Voices | Which voice comes first under Delay: mirror first, mirrors in pairs, nearest the centre, furthest from it, lowest or highest. |
| `hold` | Centre hold (time) | 0 to 8 s | 0 | At zero the centre is struck with each note. Over zero it is one held note under all of them, and stays this long after the last key. |
| `human` | Humanize | 0 to 1 | 0.2 | Lets each made voice come up to eight hundredths of a second late and a little louder or softer, as players do. |
| `centre` | Centre | -14 to 14 st, by 1 | 1 | The note everything turns round, in scale steps from the root near middle C. One is the second degree: D4 on the white keys. |
| `walk` | Walk | Still, Climb, Sink, Sway, Open, Triad | Still | Moves the centre while you play, from D: Climb D E G D, Sink D C A D, Sway D E D C, Open D G D A, Triad D F A F. |
| `walkTime` | Walk time (time) | 1 to 32 s | 8 | How long the centre stays on each note of its walk. After a rest this long the walk begins again. |

Parts: `mirror` (Mirror), `middle` (Middle), `mirror-middle` (Mirror middle), `octaflip` (Octave flip), `centre` (Centre).

Presets: All six, Open fan, Filled fan, Over one note, Four in canon, Long canon, Rolled up, Falling water, Out from the middle, Closing in, By twos, Hidden tune, Slow hills, Slow valleys, Breathing, Two pillars, Turning chord, High round, Deep round, On the fifth, Octave shadow, Bell answers.

### Mirror on D (`mirror-on-d`)

Turns what is played upside down round the note its scale reads the same from both ways: major turns minor, rising turns falling, and nothing leaves the key. It answers.

| Id | Control | Range | Rest | What it does |
| --- | --- | --- | --- | --- |
| `mode` | Mode | Replace, Both, Answer | Both | Replace plays the mirror alone. Both plays the note and its mirror. Answer mirrors every other phrase, a phrase ending at a rest. |
| `axis` | Axis | Centre, Across | Centre | The note everything turns round: the key's centre (D on the white keys), or the point a tritone above it, which gives the same notes an octave higher. |
| `octave` | Octave | 2 to 6, by 1 | 4 | Which octave the axis is in. A higher axis puts every mirror higher. |
| `fold` | Fold | 0 to 3 oct, by 1 | 0 | How many octaves a mirror may be moved back towards where it was played, so a mirrored bass stays low. At zero it lies where it falls. |
| `turns` | Turns | All, Above, Below | All | Which notes turn: all of them, only those above the axis so the bass stays, or only those below it. |
| `delay` | Delay (time) | 0 to 8 s | 0 | How long the mirror waits after the note. At zero they sound together. |
| `level` | Mirror level | 0 to 1 | 0.7 | How hard the mirror is played, as a share of the note it came from. |
| `rest` | Rest (time) | 0.1 to 4 s | 0.6 | How long nothing has to be held before the next note begins a new phrase, which Answer turns by and Fold moves as one. |
| `strikes` | Strikes | 0 to 8, by 1 | 0 | How many strikes a phrase has at the most, a chord being one: one turns every other chord, held or not. At zero only a rest ends a phrase. |
| `round` | Round | Two, Three | Two | In Answer, two phrases to the round: as played, then mirrored. With three, a third is mirrored and brought back by octaves to where it was played. |
| `foldBy` | Fold by | Phrase, Note | Phrase | What Fold moves as one: the phrase, by its first chord, whose mirror waits a moment for all of it, so a line keeps its shape; or each note, so a bass stays a bass. |

Parts: `mirror` (Mirror).

Presets: Both ways, Upside down, In its own place, The line falls, The bass stays, The bass rises, Far side, High water, A deeper root, Faint inner voices, Fold by the phrase, A second behind, Slow ripple, Reflected sky, Canon over a bass, Say and answer, Answer in place, Three sides, Long breaths, Every other chord, Three at a time, Answer over a bass.

### Companion Voice (`companion-voice`)

Writes a second voice beside a line by rule: the nearest note of one triad, like a bell of its own, or thirds, sixths, fifths, fourths, or two voices of fauxbourdon. It answers.

| Id | Control | Range | Rest | What it does |
| --- | --- | --- | --- | --- |
| `rule` | Rule | Near triad, Second triad, Third triad, Thirds, Sixths, Fifths, Fourths, Fauxbourdon | Near triad | The nearest note of the tonic triad, the second or the third one from the line; one interval of the key; or two voices that make an inverted triad with the line. |
| `side` | Side | Below, Above, Alternate, Behind | Below | Which side of the line it keeps. Alternate changes at every note, from below. Behind is below while the line rises and above while it falls. |
| `tonic` | Tonic | 1 to 7, by 1 | 1 | The degree of the key the triad stands on and cadences end on: 1 is the root, 6 of C is A minor. A scale of another size takes its note nearest to that degree of major. |
| `octave` | Octave | -2 to 2 oct, by 1 | 0 | Moves the companion by whole octaves from where its rule puts it. |
| `follow` | Follows | All, Top, Bottom | Top | Which notes of a chord have a companion: all of them, the highest held, or the lowest. Top and Bottom wait a thirtieth of a second to hear the chord. |
| `every` | Every | 1 to 4, by 1 | 1 | At 1 every note it follows is answered, at 2 every other one, and so on. |
| `delay` | Delay (time) | 0 to 8 s | 0 | How long the companion waits after the note. At zero they sound together, within the moment that Follows waits. |
| `level` | Level | 0 to 1 | 0.7 | How hard the companion is played, as a share of the note it goes with. |
| `melody` | Line level | 0 to 1 | 1 | How hard the line itself is played, as a share of how it was struck. At zero the companion is heard alone. |
| `ring` | Ring (time) | 0 to 8 s | 0 | How long the companion goes on after its note is let go. |
| `cadence` | Cadence | None, Held, On tonic, Held tonic | None | Which notes are a cadence, where the companion is at the octave, or in a triad rule at the tonic: none, any that is held, any on the tonic, or a tonic that is held. |
| `opens` | Held for (time) | 0.2 to 8 s | 1.5 | For a cadence that is held, how long a note is held before the companion moves on to the octave or the tonic. |

Parts: `companion` (Companion), `third` (Third voice).

Presets: Bell under, Bell over, Either hand, Second bell, Far bells, Late bell, Bell of the fourth, Homecoming, Deep bell, Only the bell, Chord and shadow, Close thirds, Slow tenths, Thirds in answer, Warm sixths, Sixths from behind, Bare fifths, Fifths overhead, Stone fourths, Sung in three, Three rising, Over the bass, Distant choirbook.

### Rule of the Octave (`rule-of-the-octave`)

Plays the upper voices over a bass: each step of the scale has one chord when the bass rises to it and another when it falls, and the voices move as little as they can. It answers.

| Id | Control | Range | Rest | What it does |
| --- | --- | --- | --- | --- |
| `rule` | Rule | In the key, Full rule, Triads, Sevenths, Sixths | In the key | The chord on each step: the old rule inside the key, the full rule with its notes outside the key, or a triad, a seventh or a sixth chord on every step. |
| `turn` | Direction | As played, Rising, Falling | As played | Which chord a step has in the first two rules: by whether the bass rose or fell to it, always the rising one, or always the falling one. |
| `voices` | Voices | 2 to 4, by 1 | 3 | How many upper voices there are over the bass. |
| `spacing` | Spacing | Close, Half open, Open, Wide | Close | How far apart neighbouring upper voices lie: a fourth or less, about a fifth, about a sixth as strings are laid, or about an octave. |
| `height` | Height | -12 to 24 st, by 1 | 7 | Where the upper voices lie, from the key's middle root to their middle. They stay above the bass, so a high bass lifts them. |
| `keys` | Keys above | Play, Tune on top, Silent | Play | What held keys above the bass do: sound beside the voices, sound as a tune that the voices stay under and that outlasts the bass, or sound only as the bass. |
| `hold` | Shared notes | Held, Restruck | Held | Whether a note that two chords share is held through the change or struck again with the new chord. |
| `delay` | Late (time) | 0 to 4 s | 0 | How long the upper voices come after the bass. The old chord stays until then, so it is suspended over the new bass. |
| `strum` | Spread (time) | 0 to 3 s | 0 | The time from the lowest upper voice to the highest. Each voice leaves its old note when its new one comes. |
| `sustain` | Sustain (time) | 0.05 to 8 s | 0.4 | How long the upper voices ring after the last key is let go. A bass played within that time takes them over. |
| `linger` | Linger (time) | 0 to 4 s | 0 | How long a note that a voice leaves rings on into the next chord. At zero a voice has one note at a time. |
| `level` | Level | 0.05 to 1 | 0.6 | How hard the upper voices are played, as a share of the bass. |

Parts: `upper` (Upper voices).

Presets: First lesson, With its sharps, Open strings, Four voice choir, Always falling, Always rising, Plain triads, Soft sevenths, Wide sevenths, String of sixths, Late hand, Slow suspensions, Rolled chords, Long harp roll, Melting choir, Two above, Tune on top, Bass alone speaks, High and thin, Low consort, Afterglow hand.

### One Spine Five Roles (`one-spine`)

Runs a progression of eight chords while a key is held, and plays one role of it or all: pad, bass, arpeggio, bell line, drone. Sounds on one spine fit each other. It walks.

| Id | Control | Range | Rest | What it does |
| --- | --- | --- | --- | --- |
| `spine` | Spine | Sevenths, Lament, Turning, Borrowed, Circle, Tides, Climb, Pedal, Rocking, Open road, Fifths up, Narrow gate, Bright sill, Stairs, Long stay, Open fourths | Sevenths | Which eight chords run. All keep to the key but Borrowed, which plays the chord on the fourth degree with its other third: minor in major, major in minor. |
| `role` | Role | Pad, Bass, Arpeggio, Bell, Drone | Pad | What the main instrument plays: the chords, their lowest notes, the chord tones one by one, the top note of each chord, or the tonic. |
| `chord` | Chord length (time) | 1 to 24 s | 4 | How long each chord lasts. Sounds with the same spine and the same length, begun together, stay together. A rest longer than this starts over. |
| `voicing` | Voicing | Close, Open, Wide, Full, Thin | Close | How the pad and the arpeggio lay the chord out: close, the middle an octave up, the root (or the lowest) set low, the bass note added below, or the outer two alone. |
| `steps` | Arp notes | 2 to 16, by 1 | 4 | How many notes the arpeggio plays in each chord, going up through it and down. |
| `keys` | Keys | Timing, Octave, Degree | Timing | What the lowest held key decides besides when the spine runs: nothing more, the octave of the main role, or the degree the spine stands on. |
| `common` | Common notes | Struck, Held | Struck | A note of the pad, the bass or the drone that the next chord has too: struck again with it, or held on. |
| `pad` | Pad | 0 to 1 | 0 | How hard the chords are played beside the main role; none at zero. Does nothing while Role is Pad, which then plays as hard as the keys. |
| `bass` | Bass | 0 to 1 | 0 | How hard the bass is played beside the main role; none at zero. Does nothing while Role is Bass, which then plays as hard as the keys. |
| `arp` | Arpeggio | 0 to 1 | 0 | How hard the arpeggio is played beside the main role; none at zero. Does nothing while Role is Arpeggio, which then plays as hard as the keys. |
| `bell` | Bell | 0 to 1 | 0 | How hard the bell line is played beside the main role; none at zero. Does nothing while Role is Bell, which then plays as hard as the keys. |
| `drone` | Drone | 0 to 1 | 0 | How hard the tonic is held beside the main role; none at zero. Does nothing while Role is Drone, which then plays as hard as the keys. |

Parts: `pad` (Pad), `bass` (Bass), `arp` (Arpeggio), `bell` (Bell), `drone` (Drone).

Presets: Falling sevenths, All five, Lament bass, Lament for strings, Turning harp, Borrowed evening, Circle, unhurried, Tides, Morning climb, Over one note, Rocking boat, Open road, Rising fifths, Narrow gate, Bright sill, Stairs down, Long stay, Open fourths, Bell tower, Tonic and air, Where you stand, Your own octave.

### Hexatonic Walker (`hexatonic-walker`)

Walks a held chord by moves that change one note and keep two, C to C minor to A flat and on, so each chord melts into the next. It leaves the key unless it is kept there. It walks.

| Id | Control | Range | Rest | What it does |
| --- | --- | --- | --- | --- |
| `word` | Word | P L, L P, R L, L R, P R, P R R P, Keep root, Keep third, Keep fifth, Own word, Wander | P L | The moves, said over and over. Keep walks the six chords that share that note of the first one. Own word repeats moves drawn from the seed; Wander goes on drawing. |
| `moves` | Moves | 1 to 3, by 1 | 1 | How many moves make one change of chord. One changes one note; two and three pass over the chords between, to the far side of the cycle. |
| `time` | Chord time (time) | 0.5 to 24 s | 4 | How long each chord lasts before the next move. |
| `rhythm` | Rhythm | Melt, Stagger, Up, Down, Rock | Melt | Melt strikes only what moves, and a played chord whole. Stagger strikes the voice that moves, then those that stay. Up, Down and Rock break the chord, the mover first. |
| `step` | Step (time) | 0.1 to 4 s | 0.4 | The time from voice to voice: in a broken chord, and between voices that move or are struck together, where it is never more than a quarter of the chord time. |
| `ring` | Ring | 0.1 to 1 | 1 | In Up, Down and Rock, how long each note is held, as a share of the time to three steps later. At full it holds until its voice is struck again or moves. |
| `keep` | Keep | Free, Nearly, In key | Free | Free leaves the key as the moves do. Nearly takes only chords with two notes in the key, In key only chords wholly in it, with another move where the word leaves. |
| `turn` | Turn back | Goes on, After 8, After 6, After 4, After 3, After 2 | Goes on | Whether the walk goes on, or goes back the way it came after so many changes, to the chord it began on, and out again. |
| `bass` | Bass | Off, Root, Held | Off | A low voice under the walk: the root of each chord, or the root of the first chord held under all of them. |
| `top` | Top line | Off, Mover, Keeper | Off | A high voice half way through each chord: the note that has just moved, or a note that stayed where it was. |
| `octave` | Octave | -1 to 2 oct, by 1 | 0 | Moves the three voices and the top line by octaves from where the chord was played. The bass stays. |
| `seed` | Seed | 1 to 64, by 1 | 1 | Which word Own word repeats and which way Wander goes. The same seed walks the same way. |

Parts: `bass` (Bass), `top` (Top line).

Presets: Hexatonic melt, Six chords round, Other way round, Thirds descending, Thirds climbing, White key wander, Slow white keys, Minor thirds, Four chord loop, One root, six skies, One third, six ways, One fifth holding, Far pole, Falling fifths, Major thirds, There and back, Borrowed light, Own word, rolling, Own word, hushed, Two out, two home, Long drift.

### Two Roads (`two-roads`)

A slow melody that goes up one road and down another, dwells on a strong note and ends each phrase on its resting note: melodic minor, ragas, maqam paths and gapped modes. It walks.

| Id | Control | Range | Rest | What it does |
| --- | --- | --- | --- | --- |
| `map` | Map | Melodic minor, Bhimpalasi, Bageshri, Yaman, Bihag, Bilaskhani, Rageshri, Asavari, Rast, Bayati, Hijaz, Nahawand, Do gapped, Re gapped, Sol gapped, La gapped | Melodic minor | The way up and down, in place of the key's scale. At best fit ragas and gapped modes stay in a major or natural minor key; melodic minor and the maqam paths leave it. |
| `tonic` | Resting note | Best fit, Fit, kept, Key root, Root, kept, Played, Played, kept | Best fit | Where phrases end: the degree on which the map leaves the key least, the root of the key, or the lowest key held. Kept leaves out the notes the key lacks. |
| `pace` | Pace (time) | 0.2 to 6 s | 0.7 | How long an ordinary note lasts, about. Passing notes are shorter, the strong note and its partner longer. |
| `dwell` | Dwell | 0.1 to 0.5 | 0.4 | The share of the singing time the strong note takes. Its partner takes half as much, or more where it is the resting note, and the others share what is left. |
| `zigzag` | Zigzag | 0 to 1 | 0.5 | How many of the falls of a fourth have a turn inside: G F E, back to G, and only then D. At zero every fall goes straight down. |
| `range` | Range | 3 to 15, by 1 | 9 | How many steps of the map over the resting note the melody reaches at its widest. Under it, half as many, or to the strong note when that is within a fifth. |
| `grow` | Growth (time) | 0 to 90 s | 32 | How long the range takes to grow by one step; grown, it shrinks as slowly and grows again. At zero the whole range is there at once. |
| `phrase` | Phrase (time) | 2 to 40 s | 8 | How long a phrase is, about. No two are quite the same length, and each ends on the resting note. |
| `rest` | Silence (time) | 0 to 20 s | 2.5 | How long the melody is silent between two phrases, about. A key pressed in it begins the next phrase. A drone goes on. |
| `tail` | Tail (time) | 0 to 30 s | 8 | How long the melody has to bring its phrase home after the last key is let go. At zero it stops at once. |
| `drone` | Drone | 0 to 1 | 0.4 | How hard a drone under the melody is played: the resting note an octave down and one more, struck anew with each phrase. At zero there is none. |
| `seed` | Take | 1 to 64, by 1 | 1 | Another number is another melody under the same rules. The same number plays it again. |

Parts: `drone` (Drone).

Presets: Melodic minor, Afternoon longing, Past midnight, First lamps, Night garden, Grey morning, Sixths and fourths, Late morning, Straight road, Courtyard, Far caravan, Letter home, Harbour air, Standing stones, Cold loch, Lament, Slow opening, Running water, Wherever you are, Inside the key.

### Breath Budget (`breath-budget`)

Gives every held note so many seconds of air, less the louder it is, and then a breath: a held chord becomes a section that never breathes together. It walks.

| Id | Control | Range | Rest | What it does |
| --- | --- | --- | --- | --- |
| `lung` | Lung (time) | 2 to 40 s | 14 | How long a soft note (0.35) lasts on one breath. A note twice as loud lasts half as long. |
| `breath` | Breath (time) | 0.2 to 6 s | 1.4 | How long a voice is silent before it comes back. Shorter by itself when a section has too many voices to take turns. |
| `weight` | Loud spends | 0 to 2 | 1 | How much loudness costs. At 1 twice as loud lasts half as long, at 0 every voice lasts the same, at 2 twice as loud lasts a quarter. |
| `register` | High spends | -1 to 1 | 0 | How much height costs, from the root near middle C: at 1 an octave higher lasts half as long and an octave lower twice, at -1 the other way. |
| `vary` | Vary | 0 to 0.6 | 0.2 | How much one breath differs from another in how long it lasts, as a share of it. |
| `scatter` | Start scatter | 0 to 0.9 | 0.75 | How far apart the first breaths of a chord are: the share of its air a voice may begin without. The first note always begins with all of it. |
| `gap` | Apart (time) | 0 to 6 s | 1 | The least time from one voice stopping to the next, so the chord never lets go together. Less by itself when a section has too little air for it. |
| `most` | Silent at once | 1 to 6, by 1 | 1 | How many voices may be taking a breath at one time. One of a chord always sings, whatever this says. |
| `back` | Return | Same, Next, Below, Octave, Neighbour, Any | Same | Where a voice comes back: its own note, the next free chord note up or down, its own in another octave, a step of the key away and home, or any. |
| `reach` | Reach | 0 to 2 oct, by 1 | 1 | How many octaves over the highest note held a voice may come back. At zero the chord turns over inside itself. |
| `bass` | Bass | Moves, Stays | Stays | Whether the lowest voice moves as the others do, or always comes back on its own note and keeps the chord standing on it. |
| `level` | Return level | 0.2 to 1 | 0.9 | How loud a voice comes back, as a share of how it was played. A softer one lasts longer. |

Parts: `second` (Second desk), `relief` (Relief).

Presets: Section, Six in a loft, Long lungs, Catch breaths, Turning voicing, Climbing choir, Coming down, Octave relay, Leaning notes, Change of seats, High voices tire, Low voices tire, Loud ones tire, All lungs alike, Two at a time, Half the room, Soft returns, No floor, One player, Far apart, Bass walks, Restless hymn.

<!-- makers: end -->

<!-- prettier-ignore-end -->
