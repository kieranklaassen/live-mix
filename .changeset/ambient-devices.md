---
'@kieranklaassen/live-mix': patch
---

Ambient devices, built as spec devices on `cpp/kit` and registered by `registerStockWasmDevices()`:

- `chorus`, `flanger`, `phaser` (modulation), `saturator` (drive) and `auto-filter` (eq): ports of the kkfonie DSP. Each `device.json` records the source commit and every deviation from it.

A `WasmDeviceDefinition` that gives only `latencySamples` now reports `latencySec` as well, so delay compensation sees the device whichever field it reads.
