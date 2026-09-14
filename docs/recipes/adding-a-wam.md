# Recipe: adding a WAM (WebAudioModules 2.0 plugin)

Third-party browser plugins in the [WAM 2.0](https://www.webaudiomodules.com)
format load through `@kieranklaassen/live-mix/wam` and become ordinary
`Device`s: an insert on a strip, a return device, an instrument on an
`InstrumentTrack`, a score device by URL. The entry is separate on purpose so
`.` and `./dsp` never depend on the SDK (KD3; `pnpm pack:check` enforces it).
The full host reference — parameters, presets vs. state, automation caveats,
GUI, latency, licensing, the gallery — is [wam.md](../wam.md).

## 1. Install the optional peers (consumer)

```sh
npm install @webaudiomodules/sdk@0.0.12 @webaudiomodules/api@2.0.0-alpha.6
```

Both are optional peers pinned to the versions the adapter is tested against.
The entry imports only the SDK's `initializeWamHost` (a deep import), so it
stays import-safe under SSR; plugins bring their own `WamNode`.

## 2. Load one plugin

```ts
import { createEngine } from '@kieranklaassen/live-mix'
import { WamDevice } from '@kieranklaassen/live-mix/wam'

const engine = createEngine({ context: new AudioContext() })
const music = engine.addAudioTrack('music')

const verb = await WamDevice.create(
  engine.context,
  'https://www.webaudiomodules.com/community/plugins/wimmics/kbverb/index.js',
  { params: { mix: 0.3 } },
)
music.strip.addInsert(verb)
console.table(verb.params) // WamParamSpec: ParamSpec + type / step / choices / exponent
verb.setParam('mix', 0.5) // ramped by the plugin; bypass is the 5 ms dry/wet crossfade
panel.append(await verb.createGui()) // the plugin's own UI, placed where the kit wants it
```

`create` installs the WAM host once per context (`ensureWamHost`), imports the
module (`import(url)`, marked `/* @vite-ignore */`; cross-origin needs CORS on
the plugin server — the community index has it), instantiates it, mirrors its
parameter info into a `ParamSpec` table and applies `params`. Serve over
HTTPS or localhost.

## 3. Make it a registry device (so every UI lists it)

```ts
import { devices } from '@kieranklaassen/live-mix'
import { registerWamDevice, wamDeviceDescriptor } from '@kieranklaassen/live-mix/wam'

// Probe once (instantiates the plugin to read its parameters), register with kind 'wam':
const kbverb = await registerWamDevice(engine.context, 'https://…/kbverb/index.js')
kbverb.id // 'wam:<identifier>'
const another = await devices.create(kbverb.id, engine.context, { preset: 'Hall' })

// Persist { id, name, params, wam, url } (no probe on reload) — this is also how a score references a WAM:
const { id, name, params, wam, url } = kbverb
localStorage.setItem('kbverb', JSON.stringify({ id, name, params, wam, url }))
const persisted = JSON.parse(localStorage.getItem('kbverb'))
devices.register(wamDeviceDescriptor({ ...persisted, source: persisted.url }))
```

A `DevicePanel` renders from the probed `WamParamSpec`s (switches and
dropdowns from `type`/`step`/`choices`), presets work unchanged
(`capturePreset` after `syncParams()` if the GUI was used), and
`getState`/`setState` carry the plugin's own recall.

## 4. Automate and play it

```ts
import { ParamLane } from '@kieranklaassen/live-mix'
import { wamDeviceParam } from '@kieranklaassen/live-mix/wam'

const lane = new ParamLane({
  min: 0,
  max: 1,
  breakpoints: [
    { timeSec: 0, value: 0 },
    { timeSec: 8, value: 1 },
  ],
})
engine.automation.add(lane, wamDeviceParam(verb, 'mix')) // lanes → wam-automation events inside the lookahead

const synth = await WamDevice.create(engine.context, 'https://…/obxd/index.js')
engine.addInstrumentTrack('synth', { device: synth }) // WamDevice is a NoteDevice: notes → MIDI events
```

Caveat from the WAM API: `clearEvents()` is plugin-wide, so a lane's cancel
drops every pending event on that plugin (other params, MIDI). Lanes write
inside the lookahead window, so the gap is small; documented in
[wam.md § Automation](../wam.md#automation-u19).

## 5. Your own Faust effect as a WAM

`cpp/faust/*.dsp` can become WAMs without touching this repo's build:

```sh
npx @shren/faust2wam cpp/faust/zita-rev1.dsp out/zita-wam        # effect
npx @shren/faust2wam my-synth.dsp out/my-synth -poly              # polyphonic MIDI instrument
```

Serve `out/…` and load `index.js` with `WamDevice.create`. For the stock
effects the WASM ABI path (`./dsp`) stays primary — smaller, no SDK,
bit-identical parity tests; WAM is for sharing an effect with other WAM hosts
or loading someone else's.

## 6. Before shipping in an app

Licences: the WAM api/sdk are MIT; the community gallery plugins publish no
licence file in several cases — confirm per plugin and self-host before a
consumer depends on one. Latency: `latencySec` comes from
`getCompensationDelay()` (treated as samples), so PDC picks it up; pass
`latencySec` explicitly for plugins that report nothing. Kieran's real-browser
checklist is [wam.md § Playground snippet](../wam.md#playground-snippet-real-browser-smoke-kieran).
