---
'@kieranklaassen/live-mix': minor
---

Three stock devices are renamed, because each carried a maker's or a product's name, and a device that is renamed keeps answering to the id it had.

- **Breaking, in `./dsp`:** `dattorro` is `plate-reverb` (`PLATE_REVERB_DEVICE`, `PLATE_REVERB_PARAMS`, `PLATE_REVERB_DESCRIPTOR`, `createPlateReverb`, `PlateReverb`, `PlateReverbParamName`, `wasm/plate-reverb.wasm`), `zita-rev1` is `hall-reverb` (`HALL_REVERB_*`, `createHallReverb`, `HallReverb`, `HallReverbParamName`, `wasm/hall-reverb.wasm`) and `limiter-1176` is `fet-limiter` (`FET_LIMITER_*`, `createFetLimiter`, `FetLimiter`, `FetLimiterParamName`, `wasm/fet-limiter.wasm`). The old export names and file names are gone. The three `.wasm` files are byte for byte what they were.
- **`DeviceDescriptor.formerIds`** (and `WasmDeviceMeta.formerIds`): the ids a device went by. `DeviceRegistry.has`, `get`, `describe`, `create` and `presets` find the device under each of them, `resolveId(id)` gives the id of today, and `ids` and `list` show the device once. `resolvePreset` takes a preset object saved under a former id, and so does `useDevice().applyPreset` where the device's descriptor is known. So a score, patch or preset saved before a rename loads the same device with the same settings.
- **`withCurrentDeviceIds(score, devices)`** moves a score on to the ids of today and leaves instance ids alone; `parseScore(input, { devices })` does it too. A score saved under old ids validates and renders without it.
- **`describeStockWasmDevice(id)`** (`./dsp`) looks a stock WASM device up by an id of today or a former one, with no registry; `renderPatch` and `canRenderPatch` use it by default.
- The factory presets, chains, sounds and packs name the three devices by their new ids, and `shipped-presets.json` keeps its rows under the old ids, still checked, beside new rows under the new ones.
