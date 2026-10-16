# Writing a lesson

A lesson is one technique read through from why it exists to how the engine does it: what it is
used on, how it is built a piece at a time, each stage of the real device with set mathematics
and the real source, how to use it, what goes wrong and what people get wrong about it. Every
sound and picture on the way comes from the engine's own code.

This is the template a lesson is written to. Read it through before writing one.

A lesson is four files with one name, such as `compression`, and at most one figure of its own:

| File                             | What it is                                                                 |
| -------------------------------- | -------------------------------------------------------------------------- |
| `labs/<id>.cpp`                  | The lab: the engine's own C++ with a tap on every stage, and a build path. |
| `tests/labs/<id>.test.ts`        | The lab's tests: every number the lesson measured is held here.            |
| `src/content/settings/<id>.json` | The named settings: the home tile, the sets the cards play, the defaults.  |
| `src/content/lessons/<id>.mdx`   | The lesson: the words, the equations, the listings, the figures.           |

The figure of its own is optional: one pair, `src/figures/<Name>.tsx` with
`src/components/lesson/<Name>.astro`, with its styles inside it
([A figure of the lesson's own](#a-figure-of-the-lessons-own)).

The name is the lesson's id and its address, and it carries no number. The map,
[src/content/families.json](src/content/families.json), lists the eight families and the four
lessons of each by id and title, in order: a lesson's number is its place there. A lesson's file
that the map does not list stops the build, and a lesson the map lists that has no file yet is
a tile marked as not yet written.

Compression is the pattern. Read its four files before writing another:
[labs/compression.cpp](labs/compression.cpp),
[tests/labs/compression.test.ts](tests/labs/compression.test.ts),
[src/content/settings/compression.json](src/content/settings/compression.json),
[src/content/lessons/compression.mdx](src/content/lessons/compression.mdx).

A lesson is done when `bash site/scripts/lesson.sh <id>` exits 0 and its checker has no open
finding. [Checking one lesson](#checking-one-lesson) says what that script runs.

## The rules

1. **The engine's own code runs.** A stage is read from the running device, or computed by the
   kit class the device is built from, or made by the engine's TypeScript, or written for the
   lesson. The lab says which (`kDevice`, `kKit`, `kEngine`, `kLesson`, and `kSource` for the
   sound going in) and the page shows it under each stage. Every stage and every build step
   says where it comes from. Nothing written for the lesson is passed off as the engine. Where
   the lab rebuilds part of a device, a check reports how far the rebuild lands from the
   device, on every render: for the build part that is the build path's own comparison
   ([The build path](#the-build-path)), and anywhere else a `lab::Check`.
2. **Every number has a home.** A number a lesson states is one of three things, and nothing
   else.
   - **Measured on a render.** It is written as a claim, `<Claim id="ratio-4">3 dB over</Claim>`,
     and a test whose title contains `claim ratio-4` measures it and holds it to within the
     rounding of the number as written. Its sentence names the settings and the source it was
     measured on where it would not hold on others. Write the test, read the number it
     measures, then write the sentence.
   - **Read off the code** (a constant, a range, a table's size). It stands beside a link to
     the line that holds it: `<Src path="…" at="the text on that line">`, or a term of an
     equation linked to a keyed line of a listing with `\at`. The link is found by the line's text,
     so the build fails when the code has moved on.
   - **A setting.** It comes from the lesson's settings file, and the page prints it from
     there: a card writes its own settings out, so the text never types them a second time.
3. **The textbook case shows first.** Where a device's defaults hide the technique (a release
   that holds while a tail dies, a wobble on a delay), the lab turns that off, the lesson says
   so, and it comes back as a control. The bench's `note` says how the plate's starting
   settings differ from the device's own defaults, and where the lab's controls are the
   device's parameters the last part shows the two side by side
   ([The settings file](#the-settings-file)).
4. **Own words.** Nothing is named after a product, a brand, a maker, an artist or a track, and
   nothing is described by comparison with another program ("as in ...", "...-style"). The
   standard names of mathematics and of textbook structures stay: Fourier, Hilbert, Hadamard,
   Householder, Nyquist, Hann. When in doubt, describe the thing. This holds for the lab's
   names, the test's titles, the settings' labels and the lines a listing shows: a line of the
   source that breaks the rule is left out of its listing, visibly (`skip`). Text the library
   words itself (a device's descriptor, shown on its plate) is not ours to rename.
5. **Say what was measured.** A lesson may say what a test measured, and where. It does not
   say how something sounds as a fact nobody has checked: "listen for the front of each hit
   coming back" is an invitation, "this sounds warm" is a claim with no test. Whether a lesson
   sounds right, reads well and teaches is for an ear and an eye: no test holds it, and the
   lesson does not write as if one did.
6. **Nothing outside the lesson's own files changes**: no file under `cpp/`, `src/` (the
   engine, at the repository's root) or `docs/`, and no part the lessons share (a component,
   the page, the styles, `labs/lab.h`, `tests/labs/support.ts`, the store). Where a shared part
   is wanting, report exactly what is wanting: it is changed once, for every lesson. Do not
   work round it in the lesson's own files. Something found wrong in the engine on the way is
   reported, not fixed.

## The order of work

1. **Find the code.** The lesson's row in the plan's table of the thirty-two lessons
   ([docs/plans](../docs/plans/2026-10-16-0506-feat-map-look-and-long-lessons-plan.md)) names
   the engine code its lab runs, the pieces of its build part in order, and a picture it
   needs. Check each against the tree before writing: read the device's source, its
   `device.json` and its tests under `cpp/`. The pieces are adjusted where the device's code
   says otherwise.
2. **Write the lab** ([The lab](#the-lab)): the main path with a tap on every stage, then the
   build path. Build it.
3. **Write the lab's tests** ([The tests](#the-tests)) and read the numbers they measure.
4. **Write the settings file** ([The settings file](#the-settings-file)): a set for every card
   that plays, the tile, and the device's defaults where they apply.
5. **Write the text** ([The lesson](#the-lesson)), one part of the nine at a time, building as
   you go: a name the lab does not have stops the build and says which names it does have.
6. **Check it** with `lesson.sh`, then look at the page at both widths and in both schemes
   ([Looking at the page](#looking-at-the-page)).

## The lab

`labs/lab.h` is the whole interface, and its comments are the reference. In short:

```cpp
#include "lab.h"
#include "../../cpp/devices/ambient-comp/ambient_comp.h"

namespace {
livemix::AmbientComp comp;

lab::Control threshold{"threshold", "Threshold", "dB", -60.0f, 0.0f, -24.0f};
lab::Control attack{"attack", "Attack", "ms", 10.0f, 3000.0f, 10.0f, lab::kLog};
lab::Control tails{"tails", "Tails", "", 0.0f, 1.0f, 1.0f, lab::kLinear, "Hold|Release"};

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap reduction{"reduction", "Gain reduction", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};

lab::Check rebuilt{"rebuilt", "The curve worked out again, against the device", "dB"};
}  // namespace

void lab_setup() {}  // once: tables, anything that never changes

void lab_render(int frames) {  // every time a control moves
  comp.init(lab::kSampleRate);
  comp.set_param(livemix::ambient_comp::kThreshold, threshold.value);
  for (int i = 0; i < lab::total(); ++i) {
    comp.in_left()[0] = lab::in_at(0, i);
    comp.in_right()[0] = lab::in_at(1, i);
    comp.process(1);
    in_tap.put(i, lab::in_at(0, i), lab::in_at(1, i));
    reduction.put(i, static_cast<float>(comp.reduction_));  // private state: see below
    out_tap.put(i, comp.out_left()[0], comp.out_right()[0]);
  }
}
```

- **A name is read by the reader.** A control's name is its label on the page, and a tap's
  name is what a figure's key and a stage's button call it. Write each as the lesson's text
  will say it.
- **Private state is readable.** Labs are compiled with `-fno-access-control`, so
  `comp.reduction_` compiles. This is how a stage inside a device is read without changing the
  device. A local of a device's function is not state: work it out again from the device's own
  numbers, call it `kLesson`, and add a `Check` that holds it to something the device did store.
- **A loop is rendered twice and a little more.** Run `i` from 0 to `lab::total()`, read the
  source with `lab::in_at(channel, i)` and write taps with `tap.put(i, ...)`. `put` drops the
  first pass, keeps the second and crossfades the rest into the start, so tails wrap and the
  loop has no step. Init the device at the top of `lab_render` so every render is the same.
- **A device that sleeps.** A device that goes to sleep when nothing comes in can be spared
  most of the pass that is thrown away, as [labs/chorus-and-flanging.cpp](labs/chorus-and-flanging.cpp)
  does (`sleep_through`): only as much of the end of that pass as the device can remember is
  played into it. The lab must work that memory out (the longest delay in use, and the trips
  round a loop that take a sound down 100 dB), or the start of the kept pass is missing what
  still rang from the end.
- **A tap that is not the loop** (a curve, a response, a spectrum, a picture) is opened with
  `tap.open(points)` and written with `tap.set(p, value)`; set `x0` and `x1` to what its first
  and last points stand at.
- **Kinds:** `kAudio` (a wave, heard), `kControl` (a value over time, one point each 16
  samples: `put` does the thinning), `kCurve` (y against x), `kSpectrum` (dB against hertz),
  `kFrames` (a spectrum over time).
- **Helpers:** `spectrum_tap(tap, x, count)`; `response_tap(tap, h, count)` (a filter's curve
  from its impulse response, at logarithmic steps from 20 Hz to 20 kHz);
  `spectrogram_tap(tap, x, count)`; `energy_decay_tap(tap, x, count)`; `to_db`, `power_to_db`,
  `difference_db(x, y, count)`, `peak`, `rms`; `ratio_db(diff, ref)` for a lab that adds the
  two sums up as its loop runs; `fourier_at(h, count, hz)` (one frequency of an impulse
  response, as `re` and `im`); `kPi` as a double.
  The page can already draw the spectrum of any audio tap, so a spectrum tap is only for
  something that is not a tap of the loop.
- **Room:** a lab may declare 32 controls, 64 taps and 16 checks. No heap: buffers are
  file-level arrays or `lab::take(count)` (zeroed, gone at the next render). The arena is 40 MB
  of floats; an 8 s stereo tap takes 3 MB.
- **A device with `.cpp` files** names them in a comment the build reads:
  `// lab-sources: cpp/devices/plate-reverb/plate_reverb.cpp`. Leave out its `device_api*.cpp`.
  `// lab-memory-mb: 128` and `// lab-arena-mb: 96` give a lab more room.
- **A stage made by the engine's TypeScript** (the room of the convolution reverb lesson) is
  `kEngine`. The page runs the engine's function and hands the result to the lab as a second
  signal: `#define LAB_AUX` ahead of `lab.h`, then `lab::aux(channel)` and `lab::aux_frames()`.
  `src/lab/room.ts` is the one such hand-over there is. Where the engine's code is TypeScript
  and cannot be handed over as a signal, the lab's stage is written for the lesson, labelled
  so, and the lab's test holds it to the engine's own function on the same signal.
- **A lab that plays by itself** (an instrument, an oscillator) ignores `lab::in_at` and its
  lesson names `sources: [none]`. `labs/bench.cpp` shows how notes are played into the
  engine's instruments.
- **Time.** A render runs on every move of a control. Keep it near 300 ms in the browser for a
  four-second loop, build path included; `look.mjs` prints the time. A lab that runs long
  drops lanes from its build path before it drops a stage. Measure a static curve with short
  runs, not with the whole loop.

### The build path

Part 4 of a lesson puts the technique together a piece at a time. It runs on a path of its own
in the lab, beside the main one, and writes taps of its own whose ids begin `built`. The main
path, its taps, its claims and every other figure on the page never change with the step.

```cpp
// The pieces, in the order the steps add them.
enum Piece : int { kWire = 0, kMeasure = 1, kCurve = 2 };

lab::Build build{"A wire|Measure the level|Threshold and ratio", kMeasure, -100.0f,
                 "The level the build measures, against the device's own detector"};

lab::Tap built{"built", "The compressor so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_level{"builtLevel", "Level, as built", lab::kControl, lab::kKit, 1, "dB"};
lab::Tap built_gain{"builtGain", "Gain, as built", lab::kControl, lab::kLesson, 1, "dB"};
```

- `lab::Build` makes the control `build`, one choice a step, the first at 0; `build.at()` is
  the step the reader chose. The names between the bars are the steps' names on the page: the
  row of steps prints them, and the button that adds the next says "Add:" and its name.
- **`built` is the sound so far**, and it must be sound: it is what "Hear it so far" plays.
  The other built taps (`builtLevel`, `builtGain`) are the lanes the steps draw. A built tap may
  be flat at a step that has not reached it; it must say something at some step.
- **One step is compared with the engine.** The second argument names it, counted from 0: the
  last step that builds the engine's own code again. The third is the most the difference may
  be, in dB, below 0: a bound you measure and state. The fourth says what is compared with
  what, for the page. On every render, whichever step is chosen, the lab works out how far
  that step lands from what the engine itself made (a device's output or state, or a kit class)
  and writes it to `build.difference.value` with `lab::difference_db` or `lab::ratio_db`. Left
  unwritten it reads 0 dB, which no bound allows. The checks are `builtDifference`, `builtStep`
  and `builtBound`, and `<Check id="builtDifference" />` shows the difference in the text.
- Any step can be the compared one. A step after it is written for the lesson: its tap says
  `kLesson`, the text says so, and a test of its own holds it.
- **The pattern** ([labs/compression.cpp](labs/compression.cpp)): the pieces live in one struct
  that runs a sample through the pieces up to a count. Two copies of it run beside the device:
  one at `build.at()`, which the built taps show, and one held at `build.compared_step`, whose
  result is compared with the device. Where the device forgets (it rests after a silence), the
  build forgets with it.
- No named set moves `build`, and "back" leaves it where it is.

Build one lab, from the repository's root or from `site/`:

```sh
source /opt/emsdk/emsdk_env.sh        # Emscripten 4.0.15, wherever it is installed
bash site/scripts/build-labs.sh compression
```

A name the lesson gives that the lab does not have (a tap, a control, a check, a step too many
or too few) stops the page from building, with the names the lab does have.

## The tests

`tests/labs/support.ts` has the tools:

- **Loading and feeding:** `lab(name)`; `benchSource(id, frames)` (a source exactly as the page
  plays it: the eleven of the bench, below); `sine(hz, peak, frames)`, `noise(peak, frames)`,
  `silence(frames)`, `click(frames, at, size)` (silence with one sample in it).
- **Places and units:** `RATE` (48,000), `POINT_RATE` (a control tap's 3,000 points a second),
  `BIN` (one bin of a lab's spectrum, 11.72 Hz), `FADE` (the 960 samples a looped tap
  crossfades over); `seconds(s)` and `points(s)` for the sample, or the point of a control tap,
  that stands at a time.
- **Measuring:** `dbToGain`, `gainToDb`, `peak`, `rms`, `mean`, `differenceDb`;
  `range(x, from, to)` (the least, the most and how far apart); `kinks(x)` and
  `loops(x, anywhere)` (whether a tap comes round without a step, by its third difference at
  the wrap); `suddenness(changed, reference, at)` (how suddenly an event arrives: near 1 is a
  jump, small is a fade); `onsetMs(x, from, perSecond)` (when a sound speaks).
- **What every lab is held to:** `expectSoundLab(lab, source, result, { quiet, steps })` and
  `expectBuild(lab, source)`.
- **A number as the lesson writes it:** `expectWritten(measured, written)` and
  `matchesWritten(measured, written)`.

What a lab's test holds, in this order:

- The first test is `expectSoundLab(theLab, source, result)` on the lesson's first source:
  every tap finite and not one flat value, every audio tap looping without a step, every
  control moving at least one tap of the main path. A tap that is rightly flat goes in
  `{ quiet: [...] }`; an audio tap that starts on an event by design (a note, a jump at the
  loop's first sample) goes in `{ steps: [...] }`.
- The second is `expectBuild(theLab, source, values?)` (`values` turns controls for every step,
  for a piece that does nothing at the lab's starting values): the `build` control has a choice a step; every
  step changes a built tap and leaves the main path as it was; every built tap is finite at
  every step and loops; and at every step the compared step is within the lab's bound of what
  the engine made.
- **A claim's test** measures the quantity and passes it through the written-number helper
  with the number exactly as the sentence writes it: `expectWritten(ms, '39 ms')`,
  `expectWritten(apart, 'less than 0.001 dB')`. Half of the last written digit is allowed
  (39.4 is "39 ms", 39.6 is not), or the right side of a stated bound ("less than", "under",
  "at most", "more than", "over", "at least"). A measurement that supports fewer digits is
  written with fewer. Its title says what it holds in plain words and ends with the claim it
  holds: `'brings a tone 12 dB over the threshold at 4:1 out 3 dB over it (claim ratio-4)'`.
  In a long lesson the claims check fails a claim whose written number is not in the test that
  names it, in its title or in a call of the helper.
- **A build step that states a number** has a test that shows the number moving outside its
  tolerance when the piece is switched off: render at the step before, measure the same
  thing, and expect `matchesWritten` to be false. A number measured on the running device has
  no such proof, because nothing under `cpp/` may be switched off; its test holds it and the
  lesson says it was measured.
- **Each named set renders**, and a number its card's words state is held. Read the file with
  `readSettings(id)` and fill a set in with `resolveSet(lab.description, set)`, both from
  `src/lib/settings.ts`: that is what the page does, so the test renders what the card plays.
  Where the file has `defaults`, a test holds them equal to the defaults in the device's
  `device.json`.
- A test may feed the lab any signal: a step, a tone at a chosen level, an impulse. That is how
  a time constant or a curve is measured.
- **A click or an onset is measured against the same render without the event.** Render the
  passage twice, with the event and without it, and hand both to `suddenness`: the difference
  is the event alone, so the sound under it hides nothing. A jump can land on a zero crossing,
  so measure at a few moments a little apart and keep the worst.
- Tolerances are stated in the test and are honest: the number in the lesson is the number
  measured, rounded, and the test allows the rounding.
- The tile is held by `tests/labs/tiles.test.ts`, with every other lesson's
  ([The settings file](#the-settings-file)).

```sh
cd site && npx vitest run --no-file-parallelism tests/labs/compression.test.ts tests/labs/tiles.test.ts
```

The bench (`labs/bench.cpp`, listed in `src/lab/sources.ts`) has eleven sources, in this order:

| Id       | What it is                                                                   |
| -------- | ---------------------------------------------------------------------------- |
| `drums`  | A two-bar pattern on the drum kit: sharp hits with silence between.          |
| `guitar` | A picked line: single notes that ring and die.                               |
| `chords` | The guitar strummed, a chord a bar, left to ring.                            |
| `bass`   | A bass line: low notes one at a time, each struck and left to die.           |
| `pad`    | The same chords held, a bar each: slow swells with no sharp edge.            |
| `mix`    | The drums, the bass and the guitar chords together: several sounds on a bus. |
| `sine`   | One frequency, 440 Hz.                                                       |
| `saw`    | A saw wave at 110 Hz: every harmonic, falling in level.                      |
| `noise`  | White noise.                                                                 |
| `clicks` | A single sample, once a second: what a stage does to one instant.            |
| `sweep`  | A sine rising from 20 Hz to 20 kHz across the loop.                          |

The first six are music, played by the engine's own instruments, and are the loops the home
page offers; the rest are test signals from the kit's oscillators. A lesson whose lab plays by
itself lists `none`. The reader can always put in a file of their own.

## The settings file

`src/content/settings/<id>.json` holds every named setting of the lesson: the home tile's
entry, the sets the cards play and, where the lab's controls are the device's parameters, the
device's defaults as lab values. The page, the home tile and the lab's test read the same
file, so a number on a card is one a test can render.

```json
{
  "tile": {
    "values": { "ratio": 8 },
    "tap": "out",
    "picture": { "taps": ["in", "out"], "view": "wave", "from": 1, "span": 2 }
  },
  "sets": {
    "pump": {
      "label": "Pumping",
      "values": { "threshold": -36, "ratio": 8, "release": 0.12 },
      "source": "drums",
      "tap": "out"
    }
  },
  "defaults": { "values": { "ratio": 2, "attack": 300 } }
}
```

All three keys are optional, and a key the shape does not have is refused.

- **`sets`** are what the cards play, by the name a card asks for (`set="pump"`). `label` is
  what the play bar calls the card while it sounds ("Output · Pumping") and what its button is
  called for a reader who cannot see it. `values` are control values by id. `source` is one of
  the lesson's sources; left out, the set plays on the source the page is on. `tap` is the
  sound to play; left out, the lab's last sound on the main path.
- **A set is complete.** A control it does not name goes to the lab's starting value, so a card
  sounds the same whatever the reader did before it. It never names `build`.
- **`tile`** is the lesson's tile on the home map: the `values` and the `tap` its button plays
  on the loop the map's row picks, and its `picture`: the `taps` drawn, the `view` (`wave`,
  `spectrum`, `spectrogram` or `curve`), and the span of time (`from` and `span`, in seconds).
  The picture is drawn on the tile's `source`, or on the lesson's first. It should tell this
  lesson from its neighbours: take the picture the plan's table names for the lesson ("A
  picture it needs") where a tap gives it. A steady tone against time is a solid band, so a
  lesson of steady tones names a short span or another view. Without an entry the tile plays
  and draws the lab's last sound on the main path, at starting values, over the whole loop.
- **The tile's level** must sit between −36 and −5 dB RMS against full scale on every loop it
  takes: the six musical loops, or the lab's own notes for a lesson whose sources are `[none]`,
  which takes no loop. `tests/labs/tiles.test.ts` holds it.
- **`defaults`** are the device's own defaults as lab values, and are there only where the
  lab's controls are the device's parameters. The last part then shows where the lesson starts
  each control beside where the device does, with a button that sets the page to the device's
  and plays nothing. A test holds them equal to `cpp/devices/<device>/device.json`.
- **The build fails**, naming the lesson and the set, on a control the lab does not have, a
  value outside its control's range, a tap that is not there or is not sound, and a source the
  lesson does not list.

## The lesson

Front matter:

```yaml
title: Compression
family: dynamics # the family the map puts it in, by the family's id there
summary: One or two sentences. The standfirst under the title, and the page's description.
long: true # the long shape: the nine parts under a hero
opening: { input: in, output: out } # the taps of the opening picture
lab: compression
devices: [ambient-comp] # the device pages that will link here
bench:
  device: ambient-comp
  params: { threshold: -24, ratio: 4 } # by the device's own control ids (cpp/devices/<id>/device.json)
  as: insert # or send (a device that puts out the wet signal only), or instrument
  note: How these settings differ from the device's defaults, in a sentence.
sources: [drums, guitar, chords, saw, noise, sine] # the first is what the page opens on
seconds: 4 # the loop's length, at most 8
files: # every file of the engine the lesson talks about
  - cpp/devices/ambient-comp/ambient_comp.h
```

Pick the sources that show the technique and put the best first. Part 3 is heard on more than
one kind of sound, so list the loops its cards play.

The page adds by itself:

- **The hero:** the lesson's number, its family and its place in the family, the title, the
  summary as a standfirst, and a contents list of the parts the lesson has.
- **The row of sounds** the lesson can be heard on, bound to the same source as the play bar.
- **The opening picture:** the sound going in and what comes out on one time axis, at the lab's
  starting values on the first source, with a key and a button to hear each. It counts as one
  of the lesson's figures.
- **Part 9, the real device:** the device's plate on the same loop, the table of starting
  settings beside the device's defaults with its button (where the settings file has
  `defaults`), links to the device's page, its source, its tests and the lab's test, and the
  list of `files`.
- **The play bar**, in reach all the way down, and **tiles for the lessons before and after**.

### The nine parts

The lesson writes parts 1 to 8, in this order, each as `<Part id="…" title="…">`. The id gives
the part its number and its name; the title is the lesson's own headline for it. The build
stops on a part out of order, written twice or unknown, and on `device`, which the page adds.

| Part                                | `id`      | Holds at least                                                                                                                                                                                                                 |
| ----------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 Why you need it                   | `why`     | a concrete sound and a question about it; the problem shown failing before the fix; two stills; one prediction                                                                                                                 |
| 2 What it does, in one picture      | `picture` | one live figure, at most three controls, one sentence the reader can check against it                                                                                                                                          |
| 3 What you use it on                | `uses`    | three cards, each a still, why, starting settings and a card that plays them                                                                                                                                                   |
| 4 Build one, a piece at a time      | `build`   | four steps, each with its purpose, the lines it adds from the lab's build path, lanes and the controls so far; across the steps at least one stated number, held by a claim's test and by the test that switches its piece off |
| 5 Inside the engine, stage by stage | `engine`  | a signal-flow picture; every stage of the device, each as below; then all the stages at once                                                                                                                                   |
| The tile                            |           | its setting, the tap it plays, and a still that tells this lesson from its neighbours, taken from "A picture it needs" where a tap gives it ([The settings file](#the-settings-file))                                          |
| 6 Ways to use it                    | `ways`    | four cards, each with settings to try                                                                                                                                                                                          |
| 7 What goes wrong                   | `wrong`   | three faults, two of them heard through a card, each with what to do about it                                                                                                                                                  |
| 8 Common misconceptions             | `myths`   | four statements people make, each with what is true and where the page shows it                                                                                                                                                |
| 9 The real device                   | `device`  | the device's plate; where the lab's controls are the device's parameters, the lesson's starting settings beside the device's defaults with a button; links to the device's page, source and tests                              |

**The whole lesson:** 3,500 words or more, twelve figures (counting live figures and stills,
the opening picture among them), four listings and six equations counted across the lesson,
and every number in one of the three homes of rule 2. A claim's test passes its measurement
through the shared written-number helper with the number exactly as the sentence writes it; a
measurement that supports fewer digits is written with fewer.

**A prediction** asks the reader to predict an outcome before the page shows it. Every lesson
asks at least once, in part 1.

**A card** that says "Hear", "Try it" or "Hear it" sets the page to a complete named set and
plays it ([What is sounding](#what-is-sounding)).

**A build step** shows what the piece is for, the lines of code it adds, what the signal looks
like so far, the controls that exist so far, and a button to hear it so far. The sound and the
pictures of every step are rendered by the lab.

**A stage of part 5** has its purpose in words and a figure or a listing of the real source;
its equation, set as mathematics with its terms coloured as the figure's lines are, where the
stage is arithmetic; and a way to hear it where its tap is sound. A stage whose tap is not
sound says what kind of signal it is, which the page does by itself. "All the stages at once"
is one figure of every stage on one time axis: `<Lanes>` of the stages' taps.

**A figure** carries a key of its lines by name, which the page prints from the lab's own
names. A live figure's caption says what to try and what to notice; a still's says what to
notice.

With JavaScript off the page still shows its text, equations, listings, stills, captions,
every build step in order and the answer to each prediction, and no button that would do
nothing. So what a reader must not miss is said in the text or shown in a still, not only in
a live figure.

### The components

Every component under `src/components/lesson/` is one a lesson uses by its file's name, with
no import. Each file's first lines say how it is written. A name the lab or the settings file
does not have stops the build and lists the names there are.

#### The reading parts

**`Part`**: `id` (one of the eight above), `title` (the lesson's own headline).

```mdx
<Part id="why" title="Music is louder and quieter than the place it has to fit.">

A played part swings between soft and loud.

</Part>
```

**`Predict`**: `question`, `choices` (a list of strings). Its children are the answer, with
whatever shows it: a still, a figure, a button. The answer is in a disclosure of the browser's
own, shut until the reader opens it, and it opens with scripts off.

```mdx
<Predict
  question="The threshold goes down by 16 dB. What happens to the quiet hits?"
  choices={['They get quieter too', 'They stay as they were', 'They get louder']}
>

Those under the new threshold stay as they were.

<Still
  taps="in out"
  values={{ threshold: -40 }}
  caption="Only the hits over the line change height."
/>

</Predict>
```

**`Uses`** holds **`Use`**: `title`, `set` (a name under `sets`; optional), the slot `picture`
(a still), and the words as its children. With a `set` the card prints that set's settings in
words, read from the settings file in the lab's own names and units, and a button that says
"Hear". Without one it has neither.

```mdx
<Uses>
  <Use title="Drums" set="hit">
    <Still slot="picture" taps="in out" set="hit" caption="Each hit gets through before the gain arrives." />

    Hits are tall and short. A slower attack lets each one through.

  </Use>
</Uses>
```

**`Ways`** holds **`Way`**: `title`, `tag` (a few words over the title: what the idea turns
on; optional), `set` (optional). Its button says "Try it".

```mdx
<Ways>
  <Way title="Let the hit through" tag="a slow attack" set="hit">
    With a long attack the front of each hit has passed before the gain arrives.
  </Way>
</Ways>
```

**`Faults`** holds **`Fault`**: `title`, `set` (optional). Its button says "Hear it". The
words say what happens and what to do about it.

```mdx
<Faults>
  <Fault title="Pumping" set="pump">
    The gain dives on each hit and rushes back in the gap. Lengthen the release.
  </Fault>
</Faults>
```

**`Myths`** holds **`Myth`**: `says` (the statement people make). Its children say what is
true and where the page shows it.

```mdx
<Myths>
  <Myth says="A ratio of 4 means four times quieter.">
    The ratio works only on the part above the threshold, and in decibels. The curve of part 2 shows
    it.
  </Myth>
</Myths>
```

#### Pictures

**`Still`** is a picture rendered from the lab when the site is built: inline SVG with a key
and a caption, there with scripts off, and free for the browser. `taps` ("in out", or with a
role, "in level:alt"); `set` (a named set; left out, the lab's starting values); `values`
(control values laid over the set's); `source` (left out, the set's, and then the lesson's
first); `view` (`wave` when left out, `spectrum`, `spectrogram` or `curve`); `from` and `span`
(seconds); `caption` (what to notice). A still fits its own ranges.

```mdx
<Still taps="in out" set="pump" from={1} span={2} caption="The gaps between the hits rise." />
```

**`Lanes`** stacks taps on one time axis, a lane each, every lane named beside it: `taps`;
`ranges` (the bottom and the top of a value's lane, by the tap's id); `lines` (a control drawn
as a dashed line across a value's lane: the control's id, by the tap's id); `from`, `span`;
`label` (what the picture shows, for a reader who cannot see it). Its children are the caption.
It is the picture of a build step, and of all the stages at once.

```mdx
<Lanes
  taps="in builtLevel builtGain built"
  ranges={{ builtLevel: [-60, 0] }}
  lines={{ builtLevel: 'threshold' }}
>
  Try the threshold lower, and notice the gain lane dip where the level crosses the dashed line.
</Lanes>
```

**`Flow`** is the signal-flow picture of part 5: `label` (what it shows, in words) and
`blocks`, each `{ id, label?, row?, from?, back?, tap?, shape?, n?, signal? }`. `row` 0 is the
main path, 1 a row under it, −1 a row over it. `from` names the blocks that feed it; `back`
names blocks further along whose output comes back into it. `tap` is the lab's tap read at the
block's output: the block is lit while that tap sounds, and is named after it when it has no
`label`. `shape` is `box`, `end`, `dot` (where a wire divides) or `sum`. `n` is the number of
the stage that explains the block. `signal` is `sound` or `value`. Its children are the caption.

```mdx
<Flow
  label="The sound splits: one copy is multiplied by a gain, the other works that gain out."
  blocks={[
    { id: 'in', tap: 'in', shape: 'end' },
    { id: 'split', shape: 'dot', from: 'in' },
    { id: 'level', row: 1, from: 'split', tap: 'level', n: 2 },
    { id: 'times', label: 'Times the gain', from: ['split', 'level'] },
    { id: 'out', tap: 'out', shape: 'end', from: 'times' },
  ]}
>
  The side path never reaches the output. Press a stage's button below, and notice its block light.
</Flow>
```

**The live figures** read the lab in the page and draw again when a control moves. Their
children are the caption.

| Component                                                                         | What it shows                                                                                                                                                             |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<Wave taps="in out" from={1} span={0.05} fit stems>`                             | Audio taps against time. `from` and `span` in seconds; `fit` scales to the loudest; `stems` draws samples as dots on stems.                                               |
| `<Trace taps="level reduction" lines="threshold" min={-60} max={0} unit="dB">`    | Control taps against time. `lines` draws controls as level lines.                                                                                                         |
| `<Curve taps="curve" xTitle="…" yTitle="…" diagonal follow="level" uprights="…">` | Curve taps, y against x; also `min`, `max`, `xMin`, `xMax`, `xLog`, `stems`, `lines`. `follow` is a control tap: a dot rides the curve at its value while the loop plays. |
| `<Spectrum taps="in out" uprights="cutoff" min={-96} max={0} fMin fMax linear>`   | The spectrum of audio taps (the page works it out) or of spectrum taps.                                                                                                   |
| `<Spectrogram tap="picture" top={8000} min={-90} max={0}>`                        | A frames tap: frequency up, time across, level as colour.                                                                                                                 |

Each also takes `height` and `label`. Six more were made for one lesson each and take taps the
same way; the first lines of their files show how each is written: `<SamplesOnWaves>` (samples
against the waves through them), `<TurningVectors>` (a frame's bins as vectors that turn),
`<OverlappingWindows>` (the windows of overlapping frames and their sum), `<PhaseTurns>` (a
filter's phase in half turns), `<GrainCloud>` (each grain as a bead) and `<ConvolverCheck>`
(the lab's convolution against the browser's own).

**Lines are roles, and a caption names a line by its label.** There are six roles: `in` (the
source), `out` (the result), `ctl` (a control value), and `alt`, `alt2`, `alt3` for anything
else. A figure gives roles by what each tap is; say otherwise with
`taps="levelOnePole:alt level:ctl"`. The two schemes colour the roles differently, so a caption
never names a colour: it names a line by its label, the tap's name, as the key beside the
figure prints it. The shape check fails a caption that names a colour.

#### The build

**`Build`** holds one **`Step`** for each step of the lab's `build` control, in its order, or
the build fails. `Build` takes `tap` (the built sound to play, when the build path writes more
than one). `Step` takes `title` and `controls` (the lab's controls that exist by this step, by
id; a step with none says there is nothing to set yet). A step's children are what the piece
is for and its listing, with the new lines marked; its slot `picture` is the figure of the
signal so far, or several. The text up to the first listing stands beside the picture; the
listing, and anything the step writes after it, runs the step's whole width, so write the
purpose first and the listing after it. Every step is in the page as built, in order; once the
lab is ready one shows at a time, with Back, Add and "Hear it so far". A step's controls wake
when they come into view.

```mdx
<Build>
  <Step title="Start with a wire">
    Nothing is done to the sound yet: what goes in comes out.

    <Listing path="site/labs/compression.cpp" from="void run(float left, float right) {" to="if (pieces < kMeasure) return;" name="wire" />

    <Lanes slot="picture" taps="in built">
      The sound going in and the sound so far. Notice that they are the same.
    </Lanes>

  </Step>
  <Step title="Measure the level" controls="scLowCut">
    The build now reads how loud the sound is, sixteen samples at a time.

    <Check id="builtDifference" />

    <Lanes slot="picture" taps="in built builtLevel" ranges={{ builtLevel: [-60, 0] }} />

  </Step>
</Build>
```

#### The engine's stages

**`StageBlock`** is one stage of the device: `tap` (the lab's tap the stage is read at),
`title`, `n` (its number, as the signal-flow picture prints it under its block). Its children
are the purpose and a figure. Four slots, in the order they are shown, each of which a stage
may leave out: `equation`, `readback` (the equation read back term by term against the figure),
`listing`, and `listen` (the words on its button). Under the title the stage says where it
comes from, as the lab says it. A stage whose tap is sound gets the button; a stage whose tap
is not says what kind of signal it is.

```mdx
<StageBlock tap="sidechain" n={1} title="The detector ignores the lows">
  The detector listens to a copy of the sound with the lows taken out.

  <M slot="equation" block t={String.raw`\sig{ctl}{L} = 10 \log_{10} \at{measure-level}{p}`} />
  <Fragment slot="readback">Read it against the picture: the level is ten times the logarithm of the power.</Fragment>
  <Listing slot="listing" path="cpp/devices/ambient-comp/ambient_comp.h" from="void step_gain(float power) {" to="const float over = level - threshold_.next();" name="measure" at={{ level: 'const float level = power > kFloorPower' }} />
  <Fragment slot="listen">Hear what the detector hears</Fragment>
</StageBlock>
```

**`Listing`** shows lines of a file of the repository, read when the site is built, coloured,
numbered as the file numbers them and linked to the source at the commit built: `path`, `from`
and `to` (text on the first and the last line), `mark` (text on a line to mark as new, or a
list of them), `skip` (`[fromText, toText]`: lines to leave out, shown as one line that says
how many), `at` (lines an equation links to, each under a key, by text on the line), `name`.

```mdx
<Listing
  path="cpp/kit/filters.h"
  from="struct OnePole {"
  to="return x - lowpass(x); } };"
  mark="state = flush_denormal"
  skip={['void set_cutoff', 'void reset()']}
  at={{ step: 'state = flush_denormal' }}
  name="pole"
/>
```

- A text names its line by being there once: `from` and `to` once in the whole file, `mark`,
  `skip` and `at` once within the lines shown. A space in a text matches any run of spaces and line
  breaks. The build fails on a text that is not there, or is there twice.
- A line that `at` gives a key has the id `<name>-<key>`; a key is small letters, digits and
  hyphens. The name is the file's, without its ending, when not given. Two listings on one
  page with one name fail the build, so a lesson that lists a file twice names one of them.
- A listing is never given by line numbers.

**`M`** is an equation, set when the site is built: `t`, always as `String.raw`, and `block`
for a line of its own. Two commands are added to the mathematics. `\sig{role}{term}` sets a
term in the colour of a signal's role (`in`, `out`, `ctl`, `alt`, `alt2`, `alt3`), the colour
of that line in the figures. `\at{pole-step}{term}` links a term to the line of the listing
`pole` that its `at` gives the key `step`. A line is never linked by its number, which moves
when the file does: the build refuses `\at{pole-L19}{…}`, and the shape check fails a link
whose line is not on the page. An unknown role stops the build.

```mdx
<M block t={String.raw`\sig{out}{y[n]} = \at{pole-step}{a}\,\sig{in}{x[n]}`} />
```

**`Src`** links to a file of the engine at the commit built: `path`, `at` (text on the line
linked to), `to` (text on the last line, for a range). Its children are the link's words; with
none it prints the path. This is the home of a number read off the code. `lines="40-62"` still
works and nothing holds it to the file: a long lesson does not use it.

```mdx
The detector's two poles are <Src path="cpp/devices/ambient-comp/ambient_comp.h" at="kRmsSeconds =">30 ms each</Src>.
```

#### Controls and buttons

**`Controls`**: `ids`, the lab's controls by id, placed beside the figure they move. A ranged
control is drawn as a dial that is dragged sideways, stepped by the arrow keys, sent to an end
by Home and End, put back by a double click, and deaf to the wheel, so scrolling a long page
never moves one. A control with choices is a group of choices.

```mdx
<Controls ids="threshold ratio knee" />
```

**`Listen`**: `tap`, which must be sound. A button in the run of the text that plays one
stage; its children are its words.

```mdx
<Listen tap="out">Hear the output</Listen>
```

**`Hear`**: `set`, `label` (what the button says; "Hear" when left out). A card's button
anywhere in the text: it sets the page to a named set and plays it.

```mdx
<Hear set="pump" label="Hear it pump" />
```

#### Numbers and names

**`Claim`**: `id`. A measured quantity; a test names it (rule 2).

```mdx
A tone 12 dB over the threshold at 4:1 comes out <Claim id="ratio-4">3 dB over</Claim> it.
```

**`Check`**: `id`. A check's value, live, as the lab worked it out on this render.

```mdx
<Check id="builtDifference" />
```

**`Lesson`**: `id`, `cap`. Another lesson by its id, as a link: "lesson 13, Compression", with
the number and title the map gives. `cap` where it starts a sentence. A lesson is never named
by a typed number.

```mdx
The detector's filter is the one of <Lesson id="one-pole" />.
```

**`Aside`**: `title`. A box beside the run of the text.

```mdx
<Aside title="Why 30 ms">A shorter window follows the wave itself, not its level.</Aside>
```

The page places `Sounds`, `Opening` and `DeviceTable` itself. `Stages`, the strip of the
lessons not yet rewritten, is not used in a long lesson.

### What is sounding

The page's store names what is sounding, and the cards follow these rules. Write the text so
that it holds under them.

- **One card is lit.** A card's button sets every control to its set, picks its source, and
  plays its tap. Only the card that is sounding is lit, and the play bar names it beside its
  stage ("Output · Pumping"). Pressing another card switches to it and the first goes dark.
  Pressing the lit card stops the sound.
- **From silence the sound starts on its own render.** A card's sound begins when the render
  that carries its values lands. Until then its button is busy, and pressing it again calls
  the start off. "Hear it so far" waits for the render of its step in the same way.
- **Back.** At the first card, or the first press of the button that sets the page to the
  device's defaults, whichever comes first, the page remembers the source, the stage that was
  sounding and every control but the build step, whether or not anything is sounding. The play
  bar then offers the way back, which puts all of that back and forgets it. A second card does
  not replace what is remembered.
- **A hand move ends an audition.** When the reader moves a control, picks another source or
  changes the build step by hand, the card's name goes: the sound carries on as the stage's
  own, and no card is lit.
- **A stage's button** (`Listen`, a stage's block, "Hear it so far") is lit while its tap
  sounds and no card is.
- **Two cards may play one set.** Each is lit by its own press.
- **Nothing sounds or moves until the reader starts it.**

So a card's words describe its set as it stands when pressed, and never lean on what an
earlier card left behind. An invitation to move a control after a card ("now lengthen the
release") is sound: the set stays and the card's name goes.

### How a lesson teaches

A picture earns its place by what the reader does with it. A demonstration that is only
watched teaches little; predicting first, steps the reader paces and time the reader controls
are what help. So:

- A picture comes before its formula, and the formula is then read back term by term against
  the picture.
- One signal is shown in linked views added one at a time.
- Each figure shows one idea. A live one carries a sentence on what to try and one on what to
  notice, and a still one on what to notice.
- Anything that moves is started, paused and stepped by the reader.
- A comparison is offered as dry, processed and the difference.

### What the repository has learned

- A claim names its settings and source, and says which band or window a level or a time
  counts.
- No "never" or "always" beside a level.
- A click or an onset is measured against the same render without the event
  ([The tests](#the-tests)).
- A lab of a device that sleeps follows the pattern of the chorus lab and remembers the pass
  that is thrown away ([The lab](#the-lab)).
- Lessons that play notes use the words of [CONCEPTS.md](../CONCEPTS.md).

### The voice

Plain and exact, for a reader who plays music and writes software and has not studied signal
processing. One idea a paragraph. Start each stage from what it is for. Give the picture, then
the equation, then say in words what each term does. Prefer the engine's actual numbers to
round ones. Short sentences; no rhetorical questions in a row; no em-dashes; British spelling
as the repository's docs have it. Say "the device" or its name, never "we". The reader is "you"
only where they are asked to do something.

The text names a control by its label, never as a knob, a slider or a switch: "raise the
Threshold", not "turn the threshold knob". How a control is drawn is the page's business and
may change.

MDX has three traps. A `{` or a `<` in the prose starts code, so write "less than" or use
`<M>`. A component's attributes take strings in quotes and everything else in braces
(`span={0.05}`, `fit`). And a component's children are rendered before the component itself,
so a component of a lesson's own that counts or orders its children reads what they rendered
to, as `Build.astro` does.

## A figure of the lesson's own

A lesson may have one figure made for it, where a picture it needs cannot be made with `Still`,
`Lanes`, `Flow` and the live figures: a React figure in `src/figures/` and its Astro wrapper in
`src/components/lesson/`, named for what it shows, with its styles inside it. A wrapper there
is a component in every lesson. `Trace.tsx` and `Trace.astro` are the shortest pair to start
from: a figure reads the lab through `useLab()`, draws on a canvas through `useCanvas` (which
follows the scheme) or with `Plot`, and marks its root `data-figure` and, once drawn,
`data-drawn`. It takes its colours from the roles (`ROLE_VAR` in `src/figures/roles.ts`) and
the tokens of `src/styles/site.css`, never from a colour written in the component, and it
prints a key of its lines by name.

## Looking at the page

```sh
cd site && pnpm dev                                # http://localhost:4321/live-mix/
node scripts/look.mjs lessons/compression/         # what a headless browser finds, and pictures
node scripts/look.mjs lessons/compression/ --width 390 --play --set threshold=-40
LESSONS=compression npx playwright test tests/browser/lessons.spec.ts --workers=1
```

The last line needs the site as built (`pnpm build`); `lesson.sh` builds and tests one lesson by
itself.

`look.mjs` says whether the lab loaded, how long a render took, how many figures drew, whether
anything sticks out sideways, and what the console said, and saves the page as pictures. Read
the pictures at 1,280 and 390 pixels: a figure can draw and still show nothing, or contradict
its caption. `--url` gives the address of a build served somewhere else, such as a one-lesson
build. The dark scheme is the system's, and `look.mjs` has no option for it: a script of your
own asks a headless browser for it with `colorScheme: 'dark'` on the browser's context.

The browser test (`tests/browser/lessons.spec.ts`) takes whatever a lesson has and names none
of its taps, controls or sets. For a lesson in the long shape it holds:

- the page opens with no error at 1,280 and 390 pixels, every figure that shows has drawn, and
  nothing sticks out sideways, the device's plate open or shut;
- the contents list names the parts the page has, in order, and a link goes there;
- each prediction's answer is shut and opens;
- a control found by its role moves by the keys and the figures draw again, and the wheel over
  it scrolls the page and leaves its value;
- play starts the sound, every stage says where it comes from, and every stage that is sound
  can be heard;
- a card plays its set, is the only button lit and is named by the play bar; a second card
  takes over and the first goes dark; "back" restores a control the reader had moved and the
  source the reader had picked before the first card;
- the build shows one step, "Hear it so far" sounds, each Add steps forward with the sound
  going on and the step's picture drawn, and the last step has nothing to add;
- the real device's plate appears and passes sound;
- with JavaScript off the text, the equations, the listings, the stills, the captions, every
  build step in order and each prediction's answer are on the page, and no button, control or
  play bar shows.

The expected values of the card case come from the lesson's settings file, so a set must say
what its card is meant to do.

## Checking one lesson

`bash site/scripts/lesson.sh <id>` proves one lesson alone. It runs these in order and stops at
the first that fails:

1. the format check of the lesson's own files;
2. the build of that one lab;
3. the lab's test, and the level of the lesson's tile on every loop the tile takes;
4. a build of a site that holds that one lesson and the home page, written to
   `site/.lesson/<id>/` and never to `site/dist`. It loads that lesson's text and settings and
   no other lesson's, so a lesson half written beside it cannot stop it;
5. on that build, the claims check, the wording check and the shape check, each for that
   lesson alone;
6. the lesson's browser test, on that build served at a port of its own, and the lesson's
   tile on the map with scripts off: a link, and a picture that is drawn.

It prints one line a step, with its result and how long it took:

```text
format   ok         2 s   09:17:28 to 09:17:30
build    ok        15 s   09:17:43 to 09:17:58
```

It exits 0 when the lesson holds; 1 when a step failed; 2 when it could not start (no such
lesson, or the library or the bench not built: `pnpm build` in the repository's root, `pnpm
labs` here, once); and 3 when a step failed in a file that is not the lesson's own, which it
names. On 3, change nothing and run again later: someone else's file is half written.

What it reads from the environment:

- `SITE_SLOTS` names a folder of locks shared by everyone working in one tree. With it the
  heavy steps (lab, test, build, browser) run one at a time, or as many as `SITE_HEAVY_SLOTS`
  says, and the others two at a time. A
  lock is let go when its step ends, however it ends.
- `SITE_ONLY_LESSON` is set by the script itself: it is what makes the build hold one lesson,
  in `site/.lesson/<id>/`, served at port 4321 plus the lesson's number in the map.
  `SITE_PORT` overrides the port.

The one-lesson build has no docs, devices or search pages and no tiles for the lessons beside
it, and a mention of another lesson is not a link there. Only
`tests/browser/lessons.spec.ts` runs on it.

Each check also runs alone: `node scripts/check-claims.mjs [lesson]`,
`node scripts/check-wording.mjs [lesson] [folder]`,
`node scripts/check-lessons.mjs [lesson] [folder]`. A fault is one line, such as
`compression: part 3 (uses): 2 use cards with a picture and a set, 1 short of 3` or
`compression: the claim "back" writes "39 ms", and the test that names it does not`.

What the three checks hold:

- **Claims** (`scripts/check-claims.mjs`): every `<Claim id>` is named by a test as
  `claim <id>`, and in a long lesson each number with a unit in a claim's sentence is in that
  test as written, in its title or in a call of the written-number helper.
- **Wording** (`scripts/check-wording.mjs`): rule 4, in the lesson's sources and in the page as
  built, listings among them.
- **Shape** (`scripts/check-lessons.mjs`): the nine parts present and in order; the least each
  part holds and the whole lesson's floors, as [The nine parts](#the-nine-parts) gives them; a
  key on every figure; no colour named in a caption; no control named as a knob, a slider or a
  switch.

Many lessons are written side by side on one machine and in one working tree. When `SITE_SLOTS`
names a lock folder, each heavy step waits for one of a few slots there, so the lessons do not
starve each other; a slot is let go when its command ends for any reason. A step that fails in
a file outside the lesson's own (another lesson's figure that does not compile, a shared part)
ends the script with a code of its own and the file's name: run it again later, and edit
nothing you do not own.

A second person then checks the lesson cold: runs `lesson.sh` again, reads the page at both
widths, tries to break each claim, reads each claim's number against its test's assertion, and
lists every number with a unit that has none of the three homes of rule 2. What no command
proves is how the lesson sounds, whether its pictures read well and whether it teaches: that
is for an ear and an eye, and is said so where the lesson is handed over.

## Before a lesson is done

- `bash site/scripts/lesson.sh <id>` exits 0, and its checker has no open finding.
- The lab's test starts with `expectSoundLab` and `expectBuild`; every claim's number goes
  through `expectWritten` as the sentence writes it; each build step that states a number has
  the test that shows it move with the piece switched off; each named set renders.
- Every number in the text is a claim, stands beside a link to its line, or is printed from
  the settings file.
- The nine parts hold at least what the table says, and the whole lesson its floors.
- The pictures of the page at 1,280 and 390 pixels, in both schemes, were read: every figure
  shows what its caption says, and every caption names its lines by their labels.
- Every file the lesson talks about is in `files` and linked where it is talked about.
- The wording rules hold, in the lesson, the lab's names, the settings' labels, the test's
  titles and the lines the listings show.
- Nothing outside the lesson's own files changed, and what was found wanting in a shared part
  or wrong in the engine is reported.
