# Writing a lesson

A lesson is three files with one name, such as `07-compression`:

| File | What it is |
| --- | --- |
| `labs/<name>.cpp` | The lab: the engine's own C++ with a tap on every stage. |
| `tests/labs/<name>.test.ts` | The lab's tests: every number the lesson states is held here. |
| `src/content/lessons/<name>.mdx` | The lesson: the words, the equations, the figures. |

Compression is the pattern. Read its three files before writing another:
[labs/07-compression.cpp](labs/07-compression.cpp),
[tests/labs/07-compression.test.ts](tests/labs/07-compression.test.ts),
[src/content/lessons/07-compression.mdx](src/content/lessons/07-compression.mdx).

## The rules

1. **The engine's own code runs.** A stage is read from the running device, or computed by the
   kit class the device is built from, or written for the lesson. The lab says which
   (`kDevice`, `kKit`, `kLesson`, `kSource`, `kEngine`) and the page shows it under each stage. Nothing
   written for the lesson is passed off as the engine. Where the lab rebuilds part of a device,
   a `Check` reports how far the rebuild lands from the device, on every render.
2. **Every stated quantity is held by a test.** A number about behaviour is written
   `<Claim id="ratio-4">3 dB over</Claim>`, and a test whose title contains `claim ratio-4`
   measures it. Write the test, read the number it measures, then write the sentence.
   A number read off the code (a constant, a range) is not a claim: link the file with `<Src>`.
   `node scripts/check-claims.mjs` fails a claim no test names.
3. **The textbook case shows first.** Where a device's defaults hide the technique (a release
   that holds while a tail dies, a wobble on a delay), the lab turns that off, the lesson says
   so, and it comes back as a control. The bench's `note` says how the plate's starting
   settings differ from the device's own defaults.
4. **Own words.** Nothing is named after a product, a brand, a maker, an artist or a track, and
   nothing is described by comparison with another program ("as in ...", "...-style"). The
   standard names of mathematics and of textbook structures stay: Fourier, Hilbert, Hadamard,
   Householder, Nyquist, Hann. When in doubt, describe the thing. Text the library words itself
   (a device's descriptor, shown on its plate) is not ours to rename.
5. **Say what was measured.** A lesson may say what a test measured. It does not say how
   something sounds as a fact nobody has checked: "listen for the front of each hit coming
   back" is an invitation, "this sounds warm" is a claim with no test.
6. **Nothing outside the lesson's own files changes**: no file under `cpp/`, `src/` or `docs/`.

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

- **Private state is readable.** Labs are compiled with `-fno-access-control`, so
  `comp.reduction_` compiles. This is how a stage inside a device is read without changing the
  device. A local of a device's function is not state: work it out again from the device's own
  numbers, call it `kLesson`, and add a `Check` that holds it to something the device did store.
- **A loop is rendered twice and a little more.** Run `i` from 0 to `lab::total()`, read the
  source with `lab::in_at(channel, i)` and write taps with `tap.put(i, ...)`. `put` drops the
  first pass, keeps the second and crossfades the rest into the start, so tails wrap and the
  loop has no step. Init the device at the top of `lab_render` so every render is the same.
- **A tap that is not the loop** (a curve, a response, a spectrum, a picture) is opened with
  `tap.open(points)` and written with `tap.set(p, value)`; set `x0` and `x1` to what its first
  and last points stand at.
- **Kinds:** `kAudio` (a wave, heard), `kControl` (a value over time, one point each 16
  samples: `put` does the thinning), `kCurve` (y against x), `kSpectrum` (dB against hertz),
  `kFrames` (a spectrum over time).
- **Helpers:** `spectrum_tap(tap, x, count)`; `response_tap(tap, h, count)` (a filter's curve
  from its impulse response, at logarithmic steps from 20 Hz to 20 kHz);
  `spectrogram_tap(tap, x, count)`; `energy_decay_tap(tap, x, count)`; `to_db`, `power_to_db`,
  `difference_db(x, y, count)`, `peak`, `rms`; `run_blocks` for a device run in blocks.
  The page can already draw the spectrum of any audio tap, so a spectrum tap is only for
  something that is not a tap of the loop.
- **Memory:** no heap. Buffers are file-level arrays or `lab::take(count)` (zeroed, gone at
  the next render). The arena is 40 MB of floats; an 8 s stereo tap takes 3 MB.
- **A device with `.cpp` files** names them in a comment the build reads:
  `// lab-sources: cpp/devices/plate-reverb/plate_reverb.cpp`. Leave out its `device_api*.cpp`.
  `// lab-memory-mb: 128` and `// lab-arena-mb: 96` give a lab more room.
- **A stage made by the engine's TypeScript** (the room of lesson 15) is `kEngine`. The page
  runs the engine's function and hands the result to the lab as a second signal: `#define
  LAB_AUX` ahead of `lab.h`, then `lab::aux(channel)` and `lab::aux_frames()`.
  `src/lab/room.ts` is the one such hand-over there is.
- **A lab that plays by itself** (an instrument, an oscillator) ignores `lab::in_at` and its
  lesson names `sources: [none]`. `labs/bench.cpp` shows how notes are played into the
  engine's instruments.
- **Time.** A render runs on every move of a control. Keep it near 200 ms in the browser for a
  four-second loop (compression takes about 130 ms); `look.mjs` prints the time. Measure a
  static curve with short runs, not with the whole loop.

Build one lab, from the repository's root or from `site/`:

```sh
source /opt/emsdk/emsdk_env.sh        # Emscripten 4.0.15, wherever it is installed
bash site/scripts/build-labs.sh 07-compression
```

A name the lesson gives that the lab does not have (a tap, a control, a check) stops the page
from building, with the names the lab does have.

## The tests

`tests/labs/support.ts` has the tools: `lab(name)`, `benchSource(id, frames)` (a source exactly
as the page plays it), `sine`, `noise`, `silence`, `seconds`, `dbToGain`, `gainToDb`, `peak`,
`rms`, `mean`, `differenceDb`, `steps`, and `expectSoundLab`.

- The first test of every lab is `expectSoundLab(theLab, source, result)` on the lesson's first
  source: every tap finite and not one flat value, every audio tap looping without a step,
  every control moving at least one tap. A tap that is rightly flat goes in `{ quiet: [...] }`.
- A test may feed the lab any signal: a step, a tone at a chosen level, an impulse. That is how
  a time constant or a curve is measured.
- A test's title says what it holds in plain words and ends with the claim it holds:
  `'brings a tone 12 dB over the threshold at 4:1 out 3 dB over it (claim ratio-4)'`.
- Tolerances are stated in the test and are honest: the number in the lesson is the number
  measured, rounded, and the test allows the rounding.

```sh
cd site && npx vitest run tests/labs/07-compression.test.ts
```

## The lesson

Front matter:

```yaml
title: Compression
order: 7
summary: One or two sentences, for the index and the page's description.
lab: 07-compression
devices: [ambient-comp]          # the device pages that will link here
bench:
  device: ambient-comp
  params: { threshold: -24, ratio: 4 }   # by the device's own control ids (cpp/devices/<id>/device.json)
  as: insert                     # or send (a device that puts out the wet signal only), or instrument
  note: How these settings differ from the device's defaults, in a sentence.
sources: [drums, guitar, chords, saw, noise, sine]   # the first is what the page opens on
seconds: 4                       # the loop's length, at most 8
files:                           # every file of the engine the lesson talks about
  - cpp/devices/ambient-comp/ambient_comp.h
```

Sources: `drums`, `guitar`, `chords`, `sine` (440 Hz), `saw` (110 Hz), `noise`, `clicks` (one
sample, twice a bar), `sweep` (20 Hz to 20 kHz), or `none`. The reader can always put in a file
of their own. Pick the sources that show the technique and put the best first.

The page adds by itself: the header, "In the engine" (the files, linked at the commit), "The
real device" (the bench) and the play bar. The lesson writes the rest, in this order:

1. **The idea**, in two or three paragraphs of plain words. No equation yet.
2. **`<Stages taps="..." />`**, once, straight under the idea: every stage in the signal's
   order. Then the two or three controls that matter most and one picture of in against out.
3. **`## Stage by stage`**, an `###` for each stage: what it is for, its equation, what the
   equation's terms are in the code (`<Src>`), the constants the engine chose and why, and a
   figure of that stage with the controls that move it straight above the figure.
4. **`## What goes wrong`**: the edges. Aliasing, zipper noise, ringing, pumping, latency,
   whatever this technique's are, and what the engine does about each.
5. **`## What to try`**: five or six settings worth hearing, as a list.

The components, which need no import:

| Component | What it shows |
| --- | --- |
| `<Stages taps="in level gain out" />` | The strip of stages, each with a small picture and a Listen button where it is sound. |
| `<Controls ids="threshold ratio" />` | Sliders (or a switch, for a control with choices). |
| `<Wave taps="in out" from={1} span={0.05} fit stems>` | Audio taps against time. `from` and `span` in seconds; `fit` scales to the loudest; `stems` draws samples as dots on stems. |
| `<Trace taps="level reduction" lines="threshold" min={-60} max={0} unit="dB">` | Control taps against time. `lines` draws controls as level lines. |
| `<Curve taps="curve" xTitle="..." yTitle="..." min max xMin xMax diagonal stems follow="level" uprights="threshold" lines="...">` | Curve taps, y against x. A tap whose `scale` is `kLog` is drawn on a logarithmic axis. `follow` is a control tap: a dot rides the curve at its value while the loop plays. |
| `<Spectrum taps="in out" uprights="cutoff" min={-96} max={0} fMin fMax linear>` | The spectrum of audio taps (the page works it out) or of spectrum taps. |
| `<Spectrogram tap="picture" top={8000} min={-90} max={0}>` | A frames tap: frequency up, time across, level as colour. |
| `<Check id="rebuilt" />` | A check's value, live. |
| `<Claim id="x">3 dB</Claim>` | A stated quantity. A test names it. |
| `<Src path="cpp/kit/filters.h">the kit's `Svf`</Src>` | A link to the file at this commit. `lines="40-62"` for a range. |
| `<M t={String.raw`y[n] = a\,y[n-1]`} />` | An equation; with `block`, on a line of its own. Always `String.raw`. |
| `<Listen tap="out">Hear the output</Listen>` | A button in the text. |
| `<Aside title="...">` | A box beside the run of the text. |

A figure's children are its caption. Write the caption as what to look at and what moving a
control does to it.

Colours are roles, the same in every figure: the source is grey (`in`), the result red
(`out`), a control value blue (`ctl`), and three more for anything else (`alt` green, `alt2`,
`alt3`). A figure gives roles in order; say otherwise with `taps="levelOnePole:alt level:ctl"`.
A caption names the colours it sees, so check the picture before writing it.

A lesson that needs a picture of its own writes a React figure in `src/figures/` and its Astro
wrapper in `src/components/lesson/`, named for what it shows. A wrapper there is a component in
every lesson. `Trace.tsx` and `Trace.astro` are the shortest pair to start from: a figure reads
the lab through `useLab()`, draws on a canvas through `useCanvas` (which follows light and
dark) or with `Plot`, and marks its root `data-figure` and, once drawn, `data-drawn`.

MDX has two traps: a `{` or a `<` in the prose starts code, so write "less than" or use `<M>`;
and a component's attributes take strings in quotes and everything else in braces
(`span={0.05}`, `fit`).

### The voice

Plain and exact, for a reader who writes software and has not studied signal processing. Start
each stage from what it is for. Give the equation, then say in words what each term does.
Prefer the engine's actual numbers to round ones. Short sentences; no rhetorical questions in
a row; no em-dashes; British spelling as the repository's docs have it. Say "the device" or
its name, never "we". The reader is "you" only where they are asked to do something.

## Looking at the page

```sh
cd site && pnpm dev                                   # http://localhost:4321/live-mix/
node scripts/look.mjs lessons/07-compression/         # what a headless browser finds, and pictures
node scripts/look.mjs lessons/07-compression/ --width 390 --play --set threshold=-40
LESSONS=07-compression npx playwright test tests/browser/lessons.spec.ts --workers=1
```

`look.mjs` says whether the lab loaded, how long a render took, how many figures drew, whether
anything sticks out sideways, and what the console said, and saves the page as pictures. Read
the pictures: a figure can draw and still show nothing, or contradict its caption.
The browser test holds, for each lesson: it opens with no error and every figure draws; a
control redraws them; play starts sound and every stage that is sound can be heard; the real
device's plate appears and passes sound; nothing overflows at 390 and 1,280 pixels.

## Before a lesson is done

- `npx vitest run tests/labs/<name>.test.ts` passes, with `expectSoundLab` first.
- `node scripts/check-claims.mjs` names no claim of the lesson.
- The browser test passes for the lesson, and its pictures at 1,280 and 390 pixels were read.
- Every file the lesson talks about is in `files` and linked where it is talked about.
- The wording rules hold, in the lesson, the lab's names and the test's titles.
