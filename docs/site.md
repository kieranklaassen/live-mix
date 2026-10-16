# The site

`site/` is the library's public site: thirty-two lessons on the signal
processing the engine uses, this documentation as pages, a page for every
device, the API reference and a search over all of it. It is a project of its
own inside the repository, with its own `package.json` and lockfile, so
installing the library never installs the site's packages.

The home page is the map of the lessons: eight families of four, each lesson
a tile with a picture drawn from its lab and a button that plays it.

A lesson is a long read in nine parts: why the technique is needed, what it
does in one picture, what it is used on, the technique built a piece at a
time, the engine's own device stage by stage with set mathematics and
listings of the real source, ways to use it, what goes wrong, what people get
wrong about it, and the real device behind its own plate. All the way down a
loop runs through the engine's own C++ in the page: the lesson shows the
signal at every stage, plays each stage, redraws when a control moves, and
its cards set the page to named settings and play them. With scripts off the
text, the equations, the listings, the still pictures, every step of the
build and the answer to each prediction are still there.

## What is where

| Path                             | What it is                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `site/src/content/lessons/`      | The lessons, one `.mdx` each                                                                          |
| `site/src/content/settings/`     | One `.json` a lesson: its tile on the map, the sets its cards play, the device's defaults             |
| `site/src/content/families.json` | The map of the lessons: eight families of four, by id and title. A lesson's number is its place there |
| `site/labs/`                     | One C++ file a lesson: the engine's code with a tap on every stage, built to WebAssembly              |
| `site/tests/labs/`               | One test file a lesson: every quantity the lesson states, measured on the lab in Node                 |
| `site/tests/unit/`               | The parts the lessons share, tried on small cases made for the purpose                                |
| `site/tests/browser/`            | The site as built, in a headless browser: the map, every lesson, the docs, the devices, the search    |
| `site/src/pages/docs/`           | `docs/*.md` as pages. The Markdown stays where it is and is not copied                                |
| `site/src/pages/devices/`        | A page a device, written from the library's own descriptors                                           |
| `site/scripts/`                  | The labs build, the API copy, the checks, `lesson.sh` for one lesson, a server, `look.mjs` for a look |
| `.github/workflows/site.yml`     | Builds and checks the site; on `main`, publishes it                                                   |

[site/LESSONS.md](../site/LESSONS.md) is the guide to writing a lesson: the
four files, the rules a lesson keeps, the lab's interface, the nine parts and
what each holds at least, the components a lesson is written with, and how
one lesson is checked alone.

## Building it

Node 22, pnpm, and Emscripten 4.0.15 (the version `scripts/build-wasm.sh`
builds the library's devices with).

```sh
pnpm install && pnpm build        # in the root: the site runs the library as built
cd site
pnpm install
pnpm labs                         # site/labs/*.cpp to site/public/labs/*.wasm
pnpm dev                          # http://localhost:4321/live-mix/
```

The labs are built, never committed, so a lesson always runs the engine as it
is at that commit. `pnpm labs compression` builds one.

```sh
pnpm build                        # pages, then the API reference, then the search index
node scripts/serve.mjs            # the build, served as it will be published
bash scripts/check.sh             # everything the workflow runs, in its order
bash scripts/check.sh --root      # and once more, built as for a domain's root
```

`check.sh` builds the labs, checks format and types, runs the unit and lab
tests, checks the wording, builds, checks that every claim in a lesson is held
by a test with its number as written, that every lesson holds its nine parts
and what each must hold, and the wording of the pages as built, follows every
link inside the build, and runs the browser tests on the build.

A whole build stops on a lesson the map lists that has no file, or no tile
entry in its settings file, and on a lesson's file the map does not list.

`bash scripts/lesson.sh <id>` checks one lesson alone, with a build that
holds that lesson and the home page and nothing else
([site/LESSONS.md](../site/LESSONS.md), "Checking one lesson").

The site's address comes from two variables the build reads: `SITE_URL` (the
origin, `https://kieranklaassen.github.io` when unset) and `SITE_BASE` (the
path under it, `/live-mix` when unset; `/` for a domain of its own).

## What a change to the engine does to the site

A lab compiles the engine's C++ and reads a device's private state, and a lab
test holds the numbers a lesson states. So a change in `cpp/`, or in a device
in `src/`, can turn the Site check red: a member a lab reads was renamed, or a
measured number moved. The fix is in `site/labs/` and `site/tests/labs/`, and
in the lesson's text when a number it states has changed. That is the check
doing what it is for: a lesson never goes on saying what the engine no longer
does.

## Publishing

The Site workflow builds and checks the site on every pull request that
touches `site/`, `cpp/`, `src/`, `docs/`, the root `package.json`,
`pnpm-lock.yaml`, `typedoc.json` or the workflow itself, and on every push to
`main`. On `main` it reads the repository's Pages settings, builds for the
address they give, and publishes the build that passed the checks.

Pages has to be switched on once, by an owner of the repository:

1. Settings, Pages.
2. Under "Build and deployment", Source: **GitHub Actions**.

Until then the workflow passes on `main` and says in a notice that nothing was
published. After it, the next push to `main` (or a run of the workflow from the
Actions tab) publishes to `https://kieranklaassen.github.io/live-mix/`.

## A domain

The workflow reads the address from the Pages settings, so a domain needs no
change in the repository: set it under Settings, Pages, "Custom domain", and
the next run builds for it. Tick "Enforce HTTPS" once the certificate is
issued.

Proposals. None has been bought, and whether the ones to buy are free has not
been looked up:

| Name                 | What it takes                                                      |
| -------------------- | ------------------------------------------------------------------ |
| `learn.ambient.town` | Nothing to buy: one record on a domain already owned. The simplest |
| `live-mix.dev`       | A purchase. The library's own name                                 |
| `livemix.audio`      | A purchase. The library's name, and what it is about               |
| `signalpath.school`  | A purchase. Names the lessons, not the library                     |

The records, at whoever holds the domain's DNS:

- **A sub-domain** (`learn.ambient.town`): one `CNAME` record, name `learn`,
  value `kieranklaassen.github.io`.
- **A domain of its own** (`live-mix.dev`): four `A` records on the apex,
  `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and
  `185.199.111.153`; four `AAAA` records beside them,
  `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153` and
  `2606:50c0:8003::153`; and a `CNAME` for `www` to
  `kieranklaassen.github.io`.

## What has been checked, and where

Checked on 16 October 2026, on Linux, in the container the site was written
in. Nothing here was checked on a person's machine, and nobody has listened to
any of it.

**Measured in Node, on the labs.** Each lesson's lab is the engine's C++
compiled to WebAssembly, and `pnpm test` runs it with the tests of the shared
parts: 2,184 tests. Every quantity a lesson states as measured
(1,575 of them across the thirty-two lessons) is named by a test that
measures it, and `check-claims.mjs` fails a lesson whose stated quantity no
test holds, or whose number as written is not in that test. These are
measurements of the samples the code puts out: a level in dB, a frequency, a
time, a difference between two signals. Each lab also reports, on every
render, how far the step of its build that rebuilds the engine's code lands
from what the engine itself made, and its test holds that to a stated bound.

**Seen in a headless Chromium, on the site as built.** 246
browser tests. The map shows a link and a drawn picture for every lesson with
scripts off, and with them a tile's button loads that lesson's lab and sound
passes. Each lesson opens with no error at 1,280 and 390 px, every figure
draws and nothing sticks out sideways; a listing or an equation wider than
the window scrolls in its own box, by the keys too; the contents list leads
to its parts; a prediction's answer is shut and opens; a control moves by the
keys and the figures draw again; Play makes the meter move and every stage
that is sound can be heard; a card plays its set and is the only one lit, and
"back" restores what the reader had; the build shows a step at a time and
sounds; the real device opens behind its plate and sound passes through it;
and with JavaScript off the text, the equations, the listings, the stills and
every build step are on the page with no button that would do nothing. The
docs index and a link between two docs, a device page for an effect and for
an instrument, and the search are covered the same way. "Sound" here means
the page's meter read above nothing: a number, not a judgement.

**Read, not run.** Every link inside the build is followed by
`check-links.mjs` (100,542 links across 4,033 pages on the day: 255 of the site and 3,778 of the API reference). The pages'
wording is read against a list of names by `check-wording.mjs`, and
`check-lessons.mjs` counts what each lesson's page holds against the floors
of its nine parts. Links out of the site are counted and not fetched.

**Not checked.**

- How any lesson sounds. No person has heard any of it in this work: whether
  a loop is pleasant, whether a stage is loud enough beside the next, whether
  the click-free crossfade at a loop's end is click-free to an ear.
- Whether a lesson reads well and teaches. The figures were looked at as
  screenshots while each lesson was written, at two widths; no reader has
  been through one.
- Firefox and Safari, and any phone. They have not been tried: only a
  headless Chromium on Linux has opened the site.
- The deploy job. It cannot run before Pages is switched on; its first run on
  `main` is its test.
- A build for a domain's root is made and its links are followed
  (`check.sh --root`), and its browser tests have not been run there.
- Whether the proposed domains are free.
