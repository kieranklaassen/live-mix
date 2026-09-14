---
'@kieranklaassen/live-mix': patch
---

Distribution moves to GitHub Packages (private): `publishConfig.registry` = `npm.pkg.github.com`, release workflow publishes with `GITHUB_TOKEN` and pushes a `next` snapshot when changesets are pending; the `github:` fallback and CI job authenticate with a token. `scripts/ci-local.sh` runs the whole CI matrix locally.
