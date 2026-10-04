# Performing a piece: scenes, dials, cues and rides

A composed piece plays the same every time. A perform set is what a player
does on top of it: bring sounds in and out, go from one scene to the next on
the bar, turn a dial that moves several things at once, fire a sound on the
beat. The same vocabulary serves a person at a keyboard, an agent, a
controller and a game that hosts the music.

Performing rides on top of the piece and never writes to it. A scene is not
an edit of the score; it is a set of levels the mix is held at while the
scene is in play. Leave, and the piece plays as it was composed.

```ts
import {
  Performer,
  ScoreDocument,
  TempoMap,
  createEngine,
  loadScore,
  performSetOf,
} from '@kieranklaassen/live-mix'

const engine = createEngine({ context })
const document = ScoreDocument.parse(json, { devices: engine.devices })
loadScore(engine, document)

const performer = new Performer({
  engine,
  set: performSetOf(document.score), // what the piece carries under meta.perform
  tempo: () => new TempoMap(document.score.tempo), // read at every use
  seed: document.score.transport.seed ?? 0,
})

engine.transport.start()
performer.go('night') // on the next bar, over the scene's morph
performer.dial('energy', 0.8) // every target follows through its own range
performer.cue('bell') // once, on the next beat
performer.ride('pad', 0) // one sound out, on the next bar
performer.on('bar', ({ bar, at }) => game.onBar(bar, at)) // a little ahead, with its audio-clock time
```

## Rides: the layer under it

`ChannelStrip.setRide(value, { layer, at, timeConstant, arriveAt })` is a gain
after the fader and before the mute and solo gate, at 1 until somebody moves
it:

```
input gain → inserts → pan → fader → ride … ride → gate → destination
                                                       └→ post-fader sends
```

- The fader, and so the level the score document holds, is not touched. A
  mixer view shows the mix as composed; a ride is what the performance adds.
- Sends and shadow pairs (`strip.shadow()`, the shared room) come after the
  rides, so a sound that is ridden out stops feeding its reverb too and what
  already rang out is left to ring.
- Layers are named and each is its own node, so two writers do not cut each
  other's approach short. `Performer` uses `scene` for scenes and single
  rides and `dial` for dials. A strip nobody rides has no ride node.
- `strip.ride(layer)` reads where a layer is heading, `strip.rideLayers` lists
  them, `strip.rideNode(layer)` is the gain for a host that wants to automate
  it itself. A change is announced as `ride` on `strip.onChange`.

A lane written straight onto `strip.fader.gain` is not affected by a ride and
does not affect one: they multiply.

## The set

A `PerformSet` is plain JSON. A host keeps it wherever it keeps the piece;
`performSetOf(score)` reads it from `score.meta.perform` (`PERFORM_META_KEY`)
and `normalisePerformSet(value)` turns anything into a well-formed set,
keeping what it can read and dropping the rest, so an older or hand-written
set never throws.

```
PerformSet (version 1)
├─ scenes[]   { id, name, rides: { [track]: 0…2 }, dials: { [dial]: 0…1 }, morphBars?, follow? }
├─ dials[]    { id, name, value, targets[] }
│             target: { kind: 'ride', track } | { kind: 'host', id }, each with input?, output?, curve?
├─ cues[]     { id, name, sample, gainDb?, pan?, spaceDb?, quantize? }
├─ quantize     the grid a scene or a ride waits for      default 'bar'
├─ cueQuantize  the grid a cue waits for                  default 'beat'
├─ morphBars    bars a scene takes to come in             default 2
└─ follow       whether scenes hand over by their rules   default false
```

Everything that is a length is in bars or beats, so a tempo change moves a
set with the piece.

**Scene.** `rides` names the tracks the scene speaks for: 0 is out, 1 is the
mix as composed, up to `MAX_RIDE` (2) pushes a sound forward. A track the
scene does not name stays where it is, so a scene can be "the pad out,
everything else as you had it". `dials` sets dials the same way.

**Dial.** One value from 0 to 1 that moves several targets, each through its
own `input` range (the part of the dial's travel it listens to), `output`
range and `curve` (the mapping curves of the control surface: `linear`,
`log`, `exp`, `s`). `shapeDial(target, value)` is that arithmetic on its own.
A `ride` target moves a track's `dial` ride. A `host` target is handed to the
`host` callback with the value and a glide, for whatever the host wants a dial
to move: a reverb's mix, a filter, a light in a game.
`ladderTargets(tracks, { overlap, always })` builds the targets of a dial that
brings tracks in one after another, which is what an Energy dial is.

**Cue.** A sample from the engine's `SampleStore`, played once from start to
end. Each press is its own voice.

**Follow rule.** `{ a, b, chance, after }`: after `after` (bars or seconds)
target `a` is taken with probability `chance`, otherwise `b`. A target is
`stay`, `next`, `previous`, `first`, `last`, `any`, `other` or `{ scene }`.
`describePerformFollow(rule, scenes)` puts one into words.

The editing helpers (`withScene`, `withoutScene`, `moveScene`, `withDial`,
`withoutDial`, `withCue`, `withoutCue`, `withoutTrack`, `freeId`) return a new
set and keep it consistent: removing a dial or a track takes it out of every
scene, and a rule that names a scene which has gone reads as `stay`.

## The runtime

| Call                                            | What happens                                                                                                                     |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `go(scene, { quantize?, morphBars? })`          | On the next line of the grid the scene's rides and dials start moving and arrive over its morph. Replaces a queued scene         |
| `cancel()`                                      | Calls off the scene that waits                                                                                                   |
| `ride(track, value, { quantize?, morphBars? })` | One track in, out or between, on the next line                                                                                   |
| `dial(id, value, { at?, seconds? })`            | At once, gliding over 80 ms unless told otherwise. Safe to call every frame                                                      |
| `cue(id, { quantize? })`                        | Plays on the next line of the cue grid; returns the audio-clock time, or null when the sample is not loaded                      |
| `play(cue, { quantize? })`                      | Plays a cue the set does not hold (any loaded sample, `{ id, name, sample, … }`), on the same grid and with the same `cue` event |
| `capture({ id, name, tracks? })`                | What is sounding now as a scene to keep                                                                                          |
| `reset(seconds?)`                               | Every ride to 1, every dial to rest, no scene in play                                                                            |
| `follow(on)`                                    | Follow rules on or off for this performance                                                                                      |
| `restore({ scene, rides, dials })`              | Takes up a performance where another performer left it, at once                                                                  |
| `refresh()`                                     | Puts every ride on its strip again, for a host whose strips are rebuilt by a render                                              |
| `load(set)`                                     | A new or edited set; the scene in play and dial values carry over                                                                |
| `state`                                         | Plain data: scene, queued scene and beats until it lands, rides, queued rides, dials, following, beats until the rule            |
| `on(type, listener)`, `onEvent`, `onChange`     | Events (`scene`, `queue`, `ride`, `dial`, `cue`, `bar`, `beat`, `set`), and a signal that `state` may read differently           |
| `dispose()`                                     | Every ride back to 1                                                                                                             |

**Lines.** A move is asked for at any moment and lands on a line. The
performer keeps the line in beats since the timeline began and hands the move
to the graph on the scheduler pass that brings it within `lookaheadSec`
(0.12 s), at the audio-clock time the line falls on. Until then it is only a
note: another `go` replaces it, `cancel` drops it, a seek moves it to the next
line from where the playhead landed, a stop lets it through at once. A tempo
change (`Transport.rescale` with a `tempo` function) leaves it on its beat.
With the transport stopped every move happens at once.

**Morphs.** A ride is approached exponentially (`setTargetAtTime`), with a
time constant of a quarter of the morph, so it is within 2% (35 dB down, for
a sound going out) when the morph ends and can be redirected at any point
without a step. An approach never quite arrives, so the ride is given the end
of the morph as its `arriveAt`: from there a second approach with a 20 ms time
constant (`RIDE_ARRIVAL_TIME_CONSTANT`) closes the last 2%, and a sound taken
out is out a tenth of a second after its morph ends. `morphBars: 0` is a 5 ms
approach. Dial rides and `reset` arrive the same way at the end of their
glide.

**Follow.** When a scene comes in, its rule is armed from the line it came in
on, so a rule of 8 bars hands over on a bar line. Draws come from
`seededUnit(seed, 'perform', n)`: the same seed and the same moves give the
same evening. A hand always wins over a rule that has not been drawn yet.

**Events.** `bar` and `beat` are reported up to the lookahead before they
fall, with `at`, the audio-clock time. A host that draws or moves something
on the beat schedules against `at`; one that only wants to know uses them as
they come. `scene`, `ride`, `dial` and `cue` carry the time the change begins.

## Wiring it to a host

```ts
const performer = new Performer({
  engine,
  set,
  tempo: () => currentTempoMap(), // read at every use: follows a tempo that moves
  seed: () => document.score.transport.seed ?? 0,
  strip: (track) => engineStrip(engine, track), // the default: a track, group or return of that name
  host: (id, value, { at, seconds }) => {
    if (id === 'space') plate.setParam('mix', value, { at, timeConstant: seconds / 4 })
  },
  cueDestination: clips, // a group or bus, so cues pass the same master chain
})
```

## Limits

- Bars and beats are reported for a loop that holds a whole number of beats.
- A cue is handed to the graph when it is asked for: it sounds at its time
  even if the transport stops before then.
- Rides are not in the offline renderer: a render is the piece as composed.
- `reset` and `dispose` hand a dial's host targets their resting values (the
  dial's own `value`). What a target was before the performer existed is the
  host's to know and put back.
