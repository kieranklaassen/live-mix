---
'@kieranklaassen/live-mix': patch
---

`./dsp`: main-thread `WasmDevice` host (`WasmDevice.create`, `defineWasmDevice`) with module compiled once per page and the processor loaded once per context; lazy asset resolution with `{ processorUrl, wasm }` overrides; in-thread click-free `bypass`; `Device` contract and `ParamSpec` in core; `createDattorroReverb(ctx, options)`.
