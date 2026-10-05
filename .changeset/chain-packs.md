---
'@kieranklaassen/live-mix': patch
---

A hundred effect chains for every pack: 2,500 more chains, fetched apart from the bank.

- `loadFactoryPackChains()` fetches every pack's chains once, each a `FactoryChain` stamped with its `pack`; `FactoryPack.chains` says how many a pack holds and `FACTORY_CHAIN_PACK_SIZE` is the hundred. They are a chunk of their own, like the packs' presets and sounds.
- A pack chain is two to four effects in one of the bank's seven groups, every effect on one of its own presets, with an id under its pack's.
- The chains are drawn, not written: a bench in the repository (`src/dsp/factory/chain-packs/bench/`, no part of the package) fills recipes from a lexicon of all 826 effect presets by each pack's palette, brings each chain to level and keeps it only inside the bank's limits and clear of every chain kept before it. Measured on three dry sounds and read, a reader to a pack, for what a measurement cannot see, three times over as what each reading struck was mended and drawn again; never heard. See "Pack chains" in `docs/factory.md`.
