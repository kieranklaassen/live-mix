---
'@kieranklaassen/live-mix': patch
---

`WORKLET_DUCKER_DESCRIPTOR` (`kind: 'worklet'`, category dynamics, presets) joins `STOCK_WASM_DEVICES`, so `registerStockWasmDevices()` lists the sidechain ducker; `registry.create('ducker', ctx, { params, processorUrl, createNode })` builds a `WorkletDucker` (key it with `device.key(node)`).
