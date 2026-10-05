---
'@kieranklaassen/live-mix': patch
---

The effects as code: a name that is no parameter, and a render that was called off.

- `limitRendered`: a value under a name every object has (`constructor`, `toString`) was taken for the limiter's first parameter, so a saved limiter that carried one had its file limited to that value in place of its ceiling. Only the limiter's own parameters are set.
- The registry's `ducker`: a value in `params` under a name that is an option of its host took that option's place: `windowSize` set the key's window, `reportHz: 0` took the meters away, `createNode` or `processorUrl` made the device fail to build. Only the ducker's own parameters are taken from `params`.
- `renderPatch`: the abort signal was looked at only after a slice of rendering, so a render shorter than a slice, or one asked for in one go (`sliceMs: 0`), was rendered to the end for a signal that had aborted before the call or while the modules were compiled. It is looked at before the first block as well.
