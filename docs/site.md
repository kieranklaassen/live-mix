# The site

`site/` is the library's public site: about twenty lessons on the signal
processing the engine uses, this documentation as pages, a page for every
device, the API reference and a search over all of it. It is a project of its
own inside the repository, with its own `package.json` and lockfile, so
installing the library never installs the site's packages.

In a lesson a loop runs through the engine's own C++ in the page. The lesson
shows the signal at every stage, plays each stage, redraws when a control
moves, and ends with the real device behind its own plate on the same loop.

## What is where

| Path                         | What it is                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| `site/src/content/lessons/`  | The lessons, one `.mdx` each                                                                   |
| `site/labs/`                 | One C++ file a lesson: the engine's code with a tap on every stage, built to WebAssembly       |
| `site/tests/labs/`           | One test file a lesson: every quantity the lesson states, measured on the lab in Node          |
| `site/tests/browser/`        | The site as built, in a headless browser: every lesson, the docs, the devices, the search      |
| `site/src/pages/docs/`       | `docs/*.md` as pages. The Markdown stays where it is and is not copied                         |
| `site/src/pages/devices/`    | A page a device, written from the library's own descriptors                                    |
| `site/scripts/`              | The labs build, the API copy, the checks, a server for the build, `look.mjs` for a look at one |
| `.github/workflows/site.yml` | Builds and checks the site; on `main`, publishes it                                            |

[site/LESSONS.md](../site/LESSONS.md) is the guide to writing a lesson: the
three files, the rules a lesson keeps, the lab's interface, the components a
lesson is written with.

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
is at that commit. `pnpm labs 07-compression` builds one.

```sh
pnpm build                        # pages, then the API reference, then the search index
node scripts/serve.mjs            # the build, served as it will be published
bash scripts/check.sh             # everything the workflow runs, in its order
bash scripts/check.sh --root      # and once more, built as for a domain's root
```

`check.sh` builds the labs, checks format and types, runs the unit and lab
tests, checks the wording, builds, checks that every claim in a lesson is held
by a test, follows every link inside the build, and runs the browser tests on
the build.

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
compiled to WebAssembly, and `pnpm test` runs it: 583 tests. Every quantity a
lesson states (574 of them across the twenty lessons) is the title of a test
that measures it, and `check-claims.mjs` fails a lesson whose stated quantity
no test holds. These are measurements of the samples the code puts out: a
level in dB, a frequency, a time, a difference between two signals.

**Seen in a headless Chromium, on the site as built.** 113 browser tests: each
lesson opens with no error, every figure draws, moving a control renders again
and changes a picture, Play makes the meter move, every stage that is sound
can be chosen, the real device opens behind its plate and sound passes through
it, and the page fits a window 390 and 1280 px wide. The docs index and a link
between two docs, a lesson with JavaScript off, a device page for an effect
and for an instrument, and the search are covered the same way. "Sound" here
means the page's meter read above nothing: a number, not a judgement.

**Read, not run.** Every link inside the build is followed by
`check-links.mjs` (96,909 on the day), and the pages' wording is read against
a list of names by `check-wording.mjs`. Links out of the site are counted and
not fetched.

**Not checked.**

- How any lesson sounds. Whether a loop is pleasant, whether a stage is loud
  enough beside the next, whether the click-free crossfade at a loop's end is
  click-free to an ear: nobody has heard them.
- How any picture reads to a person. The figures were looked at as
  screenshots while each lesson was written, at two widths.
- Firefox and Safari, and any phone. Only Chromium has opened the site.
- The deploy job. It cannot run before Pages is switched on; its first run on
  `main` is its test.
- A build for a domain's root is made and its links are followed
  (`check.sh --root`), and its browser tests have not been run there.
- Whether the proposed domains are free.
