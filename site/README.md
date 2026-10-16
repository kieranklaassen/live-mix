# The site

The public site of live-mix: thirty-two lessons on the signal processing the
engine uses, in eight families of four on a map; the docs as pages; a page
for every device; the API reference; search. A lesson is a long read in nine
parts that runs the engine's own C++ in the page.

- [docs/site.md](../docs/site.md): how it is built, checked and published,
  what has been checked and where, and how a domain is pointed at it.
- [LESSONS.md](./LESSONS.md): how a lesson is written and checked.

```sh
pnpm install && pnpm build         # in the repository's root
cd site && pnpm install
pnpm labs && pnpm dev              # http://localhost:4321/live-mix/
bash scripts/lesson.sh compression # one lesson, checked alone
bash scripts/check.sh              # everything the Site workflow runs
```

Emscripten 4.0.15 builds the labs (`pnpm labs`), and the unit test of
`labs/lab.h` compiles a lab of its own: without `emcc` on the path that test
is skipped and says so.
