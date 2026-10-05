---
'@kieranklaassen/live-mix': patch
---

Hosted plug-ins, racks and Link Audio: what is let go of when something is given up, and a few names and values that were taken for what they are not.

- `NativeDevice.create` in an offline render: a device whose host did not open audio in time was given up half taken down. It went on listening to the host client, which outlives the render, and its bridge worklet was never told to stop. It is disposed whole.
- `NativeDevice.create`: a saved value under `constructor` or `toString` was taken for one of the plug-in's parameters, because every object has those names, and sent to the host with no index, which the host takes for the plug-in's first parameter: that knob went to zero. Only the plug-in's own names are sent. `ScoreRenderer` asked the same way in three places (the values put back after a state has landed, a hand over a lane-bound control, a lane removed) and now asks for the table's own names there too.
- `NativeHostClient`: a frame that is JSON and no object (`null`) threw out of the socket's handler. A `hello` answered with nothing, or with an error, left the socket open with nobody holding the client; it is closed and the connection refused.
- `validatePatch`, `presetParams`, `patchDeviceParams`, `DeviceRegistry.create`: a device whose table is only known once it is made (`dynamicParams`, every hosted plug-in) had the values a chain or a preset holds for it refused (`has no parameter "p7"`) or dropped, though the descriptor says its names are not checked. They are let through as given, as the score's schema and the renderer already did; the device clamps them.
- `validateDescriptor`: a factory preset that sets `constructor` passed where one that sets any other unknown parameter is refused.
- `createMacroMapping`, `Rack.mapMacro`: a macro could be mapped onto `constructor`; the mapping had a function for a spec and no range. It is refused like any other parameter the device does not have.
- `captureRackPreset`: a rack whose mapped device had been taken off its chain threw. The mapping is left out of the preset.
- `createRackFromPreset`: when a device could not be made or a mapping named a missing device, the rack and the devices already made stayed connected with nobody holding them. They are disposed before the error is passed on.
- `Rack.addChain`: a chain made with a gain or a pan that is no number kept `NaN` and wrote it to an AudioParam, which a browser refuses. It starts on the default, as `setGain` and `setPan` already did for a later change.
- `buildLatencyReport`: a path whose destination is itself was counted twice, and every path feeding it carried the extra. A cycle of one is broken like any other.
- `LinkAudioSender`, `LinkAudioReceiver`: what the worker had posted before it heard of a `dispose` arrived after it, so a disposed channel went back to `open` and called `onStatus` (and the sender `onStats`). A disposed channel stays closed. And one made with an `offsetMs` that is no number told its worker a clock that is no number; it is taken for no offset, as `setOffsetMs` already did.
