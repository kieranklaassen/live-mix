---
'@kieranklaassen/live-mix': patch
---

`InstrumentTrack` + `engine.addInstrumentTrack`, the `NoteDevice` contract, `note-on`/`note-off` device messages (processor calls optional `device_note_on/off` exports), `WasmDevice.noteOn/noteOff/postMessage`, and a definition-level `processor: { name, url }` so an app can host an app-local worklet on the same ABI.
