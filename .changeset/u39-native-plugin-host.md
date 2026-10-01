---
'@kieranklaassen/live-mix': minor
---

VST3 and Audio Unit plug-ins as devices (U39).

- `native/host`: a JUCE 9 program a desktop shell starts next to the page. It scans the machine's plug-ins, loads them into slots, opens their own windows and speaks a small WebSocket protocol on the loopback interface. Built from source with CMake (`pnpm host:build`); its source ships in the package and its binary never does.
- `@kieranklaassen/live-mix/native`: `NativeHostClient` (the control connection), `NativeDevice` (a loaded plug-in behind the `Device` contract, as an effect or an instrument, live and in an offline render), `registerNativeDevices` / `scanNativeDevices` (scanned plug-ins in a device registry, id `native:<plugin id>`), `registerMissingNativeDevices` (a document keeps a plug-in this machine does not have), `followNativeEdits` (changes made in a plug-in's own window reach the score document, grouped into undo steps) and `bridgeLatencyFor`.
- `@kieranklaassen/live-mix/native/shell` (Node): `startPluginHost`, `buildPluginHost`, `pluginHostBinaryPath` for an Electron or Tauri shell.
- `holdRenderAt(context, timeSec, task)`: the one way to pause an offline render at a time, so several callers can share a block. `Device.notice`, `NoteDevice.notesDelivered()`, `DeviceDescriptor.unavailable` and `dynamicParams`, and the `plugin` device category, are what hosted plug-ins needed from the core.
- `@kieranklaassen/live-mix/testing`: `FakePluginHost`, a host in memory for an app's own tests.

`DevicePanel` shows a device's `notice`, and a dense knob's value no longer overflows its cell. docs/native.md is the guide.
