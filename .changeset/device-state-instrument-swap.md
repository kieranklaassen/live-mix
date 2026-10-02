---
'@kieranklaassen/live-mix': patch
---

A score can hold the whole sound of a track: the instrument an instrument track plays can be changed in the document, and a device can carry state besides its parameters.

- `ScoreDevice.state`: opaque text a device holds besides its parameters (a hosted plug-in's own chunk, base64). `device.setState` sets or clears it. A device is created from its state (`DeviceCreateOptions.state`) with its `params` on top.
- `device.replace { id, device }`: another device where one is. An insert keeps its place, an instrument track or a return keeps its strip. Automation on the old device goes with it and comes back on undo; the same instance of the same device with other settings keeps it.
- `patchInstrumentOps(score, track, patch)`: the operations that load an instrument preset onto an instrument track (its instrument, then its effects), one undo step as a `batch`.
- `ScoreRenderer` swaps a replaced instrument in on the track that is there instead of rebuilding it: strip, inserts and sends stay, and the old instrument rings out for `instrumentTailSec` (default `DEFAULT_INSTRUMENT_TAIL_SECONDS`, 10 s). `whenIdle()` also waits for a state on its way into a device.
- `StatefulDevice` / `isStatefulDevice`: the contract for a device whose state a score keeps. `NativeDevice` implements it: `setState` skips a state it already holds and resolves to whether it loaded, `onStateChange` fires when the plug-in says its state changed or its window closes, `editorOpen` says whether the window is open. A value the plug-in reports where it already was is no longer an `onEdit`.
- `followNativeEdits` keeps each hosted plug-in's state in the document (no undo step): when the plug-in first appears, after changes that came from it, when it says so, when its window closes, and every few seconds while the window is open (`state`, `stateDelayMs`, `statePollMs`, `onStateError`). `captureNativeState(document, renderer)` reads every plug-in now, for a save or an export.
- Plug-in host: a `stateChanged` event when a plug-in tells its host that its state changed without a parameter moving.
- The stand-in for a plug-in that is missing or does not load (`MissingNativeDevice`) takes notes and plays nothing, and a hosted instrument that fails to load now comes back as that stand-in instead of rejecting: an instrument track whose plug-in is not there renders silent and keeps its settings and state.
