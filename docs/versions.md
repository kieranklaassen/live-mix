# Version history (U30)

Named snapshots of the score (R24): saved by hand, taken automatically at
session milestones, restored as one undoable operation, and diffed against
each other at the operation and the field level. Storage is compact and
budgeted; a `VersionStorage` adapter persists it (IndexedDB in browsers,
memory in tests, `localStorage` when that is all there is).

```ts
import {
  Arbiter,
  ScoreDocument,
  VersionHistory,
  indexedDbVersionStorage,
} from '@kieranklaassen/live-mix'

const document = ScoreDocument.parse(json)
const arbiter = new Arbiter(document)
const versions = new VersionHistory(document, {
  storage: indexedDbVersionStorage({ dbName: 'breathwork' }),
  arbiter, // restores go through the policy (a held fader defers them)
})
await versions.open() // earlier sessions' versions, oldest first

versions.save('before the drop')
versions.checkpoint('section', 'Settle') // automatic kind, named milestone
versions.list() // VersionSummary[]: id, label, kind, milestone?, atMs, author, seq, base, opCount, bytes
versions.restore(id) // one `score.replace` step: document.undo() brings the current state back
versions.diff(a, b) // { operations: StoredOp[] | null, fields: FieldChange[] }
```

## Saving and milestones

- `save(label, { kind?, milestone?, author?, atMs? })` snapshots the
  document now (`kind` defaults to `manual`).
- `checkpoint(milestone, label?)` is a `kind: 'auto'` save named after a
  milestone — `start`, `section`, `end`, or any string. With
  `autoCheckpoints` (default on) the history takes a `start` checkpoint when
  constructed and after every `document.load`. Call `checkpoint('section',
name)` from your section-change hook (Breathwork Live's conductor when
  `advanceSection` runs) and `checkpoint('end')` when the session ends;
  nothing in the library owns those moments.
- `restore(id, { author?, label? })` applies `{ type: 'score.replace',
score }` — a new operation that swaps the whole document, validates it,
  and inverts to the previous one — through the arbiter when one is bound
  (returns its `ArbiterResult`: a held target defers the restore), else
  straight to the document. Undo/redo treat it as any other step.
- `remove(id)` forgets a version; `clear()` empties the history and the
  store. `onChange` reports `saved`, `removed`, `restored`, `opened`.

## Compact storage

Each version is one record (`StoredVersion`, `format: 1`): id, label,
kind, milestone, time, author, the log position (`epoch` — which log
instance, since `load` starts a new one — and `seq`), its `parent`, and one
or both of:

- `score` — the full document (a **base**), and/or
- `ops` — the operation-log slice since the parent, without inverses
  (`StoredOp`: seq, op, author, atMs, kind, label).

A version is stored as a **delta** (ops only) when it has a parent in the
same log, the slice fits `budgetBytes` (256 KiB) and is smaller than the
full score, and fewer than `fullEvery` (8) deltas precede it; otherwise it
keeps a full score (plus the slice when it fits, so operation-level diffs
survive). `scoreOf(id)` walks to the nearest base and replays the slices
(small cache). Removing a version joins its slice into its child, or
promotes the child to a base when the removed one was a root, so nothing
dangles.

`totalBudgetBytes` (16 MiB) is a soft cap: when saves exceed it the oldest
**automatic** checkpoints are pruned first (never the newest version, never a
named one — named versions are the user's and stay however far over budget
they run). `bytes` reports the total; `byteLength` measures UTF-8 like a
storage quota does.

## Diff

`diff(fromId, toId)`:

- `operations` — the log entries between the two, oldest first, when `to`
  descends from `from`: read from the live log when both are in it, else
  assembled from the stored slices; `null` when a link lost its slice (a
  version stored full-only, a different lineage, or the reverse direction).
- `fields` — `diffScores(before, after)`: every differing field with a path
  that names entities by id (`tracks[music].strip.level`,
  `tracks[music].clips[c9]`), kinds `added`, `removed`, `changed`, `moved`
  (order among surviving ids changed; a removal alone is not a move).
  Unidentified lists (breakpoints, tempo segments) diff by index.
  `describeFieldChange` gives one line per change.

## Storage adapters

`VersionStorage` is five promises: `list()`, `get(id)`, `put(record)`,
`remove(id)`, `clear()`. Writes are queued write-through; `flush()`
resolves when they have settled and failures go to `onError` (never into
`save`). `open()` merges what the store holds with what was saved so far and
re-epochs live saves so they never chain onto a dead log.

- `memoryVersionStorage()` — tests and server renders (`size`, `bytes`).
- `webStorageVersionStorage(localStorage, { key })` — a `StorageLike`
  (`live-mix:versions` index + one item per version).
- `indexedDbVersionStorage({ dbName, storeName, indexedDB? })` — one object
  store keyed by id, opened lazily; rejects when IndexedDB is absent
  (server, private modes) so a consumer can fall back.

## React

`<LiveMixProvider versions={history}>` provides it. `useVersions(history?)`
returns `{ versions, latest, bytes, save, checkpoint, restore, remove,
diff, scoreOf, open, history }` and re-renders on every history event.
`VersionList` in the kit renders the save row and the list newest first
with Restore/Remove (`manualOnly`, `showSave`, `showRemove`, `onRestore`,
`formatTime`); styles under `.lm-versions*`.

## Not in this unit

- No automatic section detection: the consumer calls `checkpoint('section')`.
- No merge of concurrent versions; a restore is a linear step.
- No compression beyond the delta format; IndexedDB stores the JSON as is.
