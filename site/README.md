# The site

The public site of live-mix: lessons on the signal processing the engine
uses, the docs as pages, a page for every device, the API reference, search.

- [docs/site.md](../docs/site.md): how it is built, checked and published, and
  how a domain is pointed at it.
- [LESSONS.md](./LESSONS.md): how a lesson is written.

```sh
pnpm install && pnpm build   # in the repository's root
cd site && pnpm install
pnpm labs && pnpm dev        # http://localhost:4321/live-mix/
bash scripts/check.sh        # everything the Site workflow runs
```
