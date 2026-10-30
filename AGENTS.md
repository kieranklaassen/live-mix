# AGENTS.md

The guide for agents and people working in this repository. `CLAUDE.md` is a
symlink to this file. [README.md](README.md) says what the engine is, and
[CONCEPTS.md](CONCEPTS.md) its ideas.

## Checks before a merge

`pnpm check` runs the typecheck, the lint, the tests, the build and the
package check. Run it yourself; do not count on CI to have run it.

## Git

Work on a branch, and when the work is done and `pnpm check` passes, merge it
into `main` yourself. Open no pull request, and commit nothing to `main`
directly. Fetch `main` just before and bring it into the branch if it moved.
A change a user of the package sees carries a changeset (`pnpm changeset`).
The app in kieranklaassen/ambient-live pins a commit of `main`, so a merge
here reaches it only when that pin moves.

A commit's subject is a plain sentence about what the engine does now. It has
no `feat:` or `fix:` in front.
