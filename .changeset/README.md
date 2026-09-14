# Changesets

Every PR that changes the published package adds a changeset (`pnpm changeset`).
While the package is `0.x`, a **minor** bump means breaking and a **patch** bump
means everything else; both consumer apps pin exact versions and migrate one at a
time per breaking bump.

Merging the "Version Packages" PR that the release workflow opens publishes to
npm via trusted publishing (GitHub OIDC, no token).
