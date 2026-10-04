// The plate bench: every stock effect as a plate, each a real device with
// sound running through it, so a display can be looked at while it works.
// A page for building and checking plates, and for taking their pictures.
//
//   plates.html                      every effect, graphite
//   ?only=tremolo,ambient-comp       these devices
//   ?category=dynamics               one family (a registry category)
//   ?theme=paper                     any of the kit's themes
//   ?open=1                          plates opened to every control
//   ?still=1                         no sound: what a plate shows at rest
//   ?chain=1                         in one `DeviceChainView` on a strip, as an app draws them
//   ?preset=<name>                   each device on its preset of that name, where it has one
//
// `window.plates` is there for a script: `ready`, `devices` by id, `context`.

import '@kieranklaassen/live-mix/react/styles.css'

import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

import {
  DeviceRegistry,
  createEngine,
  devices as stockDevices,
  type Device,
  type ChannelStrip,
  type DeviceCreateOptions,
  type Engine,
} from '@kieranklaassen/live-mix'
import { STOCK_WASM_DEVICES, type AssetOverrides } from '@kieranklaassen/live-mix/dsp'
import {
  DeviceChainView,
  DevicePlate,
  LiveMixProvider,
  deviceSkin,
} from '@kieranklaassen/live-mix/react'

const query = new URLSearchParams(location.search)
const only = query.get('only')?.split(',').filter(Boolean) ?? null
const category = query.get('category')
const theme = query.get('theme') ?? 'graphite'
const open = query.get('open') === '1'
const still = query.get('still') === '1'
const chain = query.get('chain') === '1'
const preset = query.get('preset')

function benchRegistry(): DeviceRegistry {
  const registry = new DeviceRegistry(stockDevices.list())
  // A compiled device runs in the shared processor; a worklet device (the ducker) in its own.
  const urls = {
    wasm: new URL('worklets/wasm-device.js', document.baseURI).href,
    worklet: new URL('worklets/ducker.js', document.baseURI).href,
  }
  for (const descriptor of STOCK_WASM_DEVICES) {
    const processorUrl = descriptor.kind === 'worklet' ? urls.worklet : urls.wasm
    const withUrl = {
      ...descriptor,
      create: (context: BaseAudioContext, options: DeviceCreateOptions) => {
        const request: DeviceCreateOptions & AssetOverrides = { processorUrl, ...options }
        return descriptor.create(context, request)
      },
    }
    if (registry.has(descriptor.id)) continue
    registry.register(withUrl)
  }
  return registry
}

/**
 * Four seconds of a key for a device that is keyed (the ducker): a burst like
 * a spoken phrase, a second and a half long, then quiet.
 */
function benchKey(context: BaseAudioContext): AudioBuffer {
  const seconds = 4
  const rate = context.sampleRate
  const buffer = context.createBuffer(1, seconds * rate, rate)
  const data = buffer.getChannelData(0)
  for (let n = 0; n < data.length; n += 1) {
    const t = n / rate
    if (t < 0.5 || t > 2) continue
    const edge = Math.min(1, (t - 0.5) / 0.05, (2 - t) / 0.2)
    const syllables = 0.6 + 0.4 * Math.sin(2 * Math.PI * 4 * t)
    data[n] = 0.5 * edge * syllables * Math.sin(2 * Math.PI * 180 * t)
  }
  return buffer
}

/** Feeds the key to a device that takes one. */
function keyed(device: Device, key: AudioNode): void {
  const takesKey = device as Device & { key?: (node: AudioNode) => void }
  if (typeof takesKey.key === 'function') takesKey.key(key)
}

/**
 * Eight seconds of something like music, the same every time, that comes
 * round on itself: a chord that swells, plucked notes over it, a low thump
 * every two seconds and a breath of noise. Loud and quiet, low and high, so a
 * compressor has something to hold and an EQ something to show.
 */
function benchSound(context: BaseAudioContext): AudioBuffer {
  const seconds = 8
  const rate = context.sampleRate
  const buffer = context.createBuffer(2, seconds * rate, rate)
  const left = buffer.getChannelData(0)
  const right = buffer.getChannelData(1)
  const chord = [110, 164.81, 220, 277.18, 329.63]
  const plucks = [659.25, 880, 987.77, 739.99, 1318.5, 880, 554.37, 659.25]
  let seed = 12345
  const noise = (): number => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 2147483648 - 1
  }
  let hiss = 0
  for (let i = 0; i < left.length; i++) {
    const t = i / rate
    const swell = 0.5 - 0.5 * Math.cos((t / seconds) * Math.PI * 4)
    let pad = 0
    chord.forEach((hz, k) => {
      pad += Math.sin(2 * Math.PI * hz * t + k) * (0.6 + 0.4 * Math.sin(t * (0.3 + k * 0.11)))
    })
    pad *= 0.05 * (0.25 + 0.75 * swell)
    const step = Math.floor(t * 2)
    const since = t * 2 - step
    const pluck =
      0.16 * Math.exp(-since * 5) * Math.sin(2 * Math.PI * plucks[step % plucks.length] * t)
    const beat = t % 2
    const thump =
      0.5 * Math.exp(-beat * 9) * Math.sin(2 * Math.PI * (48 + 60 * Math.exp(-beat * 30)) * t)
    hiss += (noise() - hiss) * 0.4
    const air = hiss * 0.03 * (1 - swell)
    left[i] = pad + pluck * (step % 2 ? 0.4 : 1) + thump + air
    right[i] = pad + pluck * (step % 2 ? 1 : 0.4) + thump - air
  }
  return buffer
}

interface Bench {
  engine: Engine
  registry: DeviceRegistry
  entries: { device: Device; feed: AudioNode; name: string }[]
  strip: ChannelStrip | null
}

async function makeBench(): Promise<Bench> {
  const context = new AudioContext({ latencyHint: 'interactive' })
  const registry = benchRegistry()
  const engine = createEngine({ context, devices: registry })
  const wanted = registry
    .list()
    .filter((descriptor) => descriptor.category !== 'instrument' && !descriptor.unavailable)
    .filter((descriptor) => (only ? only.includes(descriptor.id) : true))
    .filter((descriptor) => (category ? descriptor.category === category : true))
  if (only) wanted.sort((a, b) => only.indexOf(a.id) - only.indexOf(b.id))

  const source = context.createBufferSource()
  source.buffer = benchSound(context)
  source.loop = true
  const key = context.createBufferSource()
  key.buffer = benchKey(context)
  key.loop = true
  const silent = context.createGain()
  silent.gain.value = 0
  silent.connect(context.destination)

  const entries: Bench['entries'] = []
  let strip: Bench['strip'] = null
  if (chain) {
    const track = engine.addAudioTrack('Bench')
    strip = track.strip
    source.connect(strip.input)
    for (const descriptor of wanted) {
      const device = await registry.create(
        descriptor.id,
        context,
        preset && descriptor.presets?.[preset] ? { preset } : {},
      )
      strip.addInsert(device)
      keyed(device, key)
      entries.push({ device, feed: strip.input, name: descriptor.name })
    }
  } else {
    for (const descriptor of wanted) {
      const device = await registry.create(
        descriptor.id,
        context,
        preset && descriptor.presets?.[preset] ? { preset } : {},
      )
      const feed = context.createGain()
      source.connect(feed)
      feed.connect(device.input)
      device.output.connect(silent)
      keyed(device, key)
      entries.push({ device, feed, name: descriptor.name })
    }
  }
  if (!still) {
    source.start()
    key.start()
    void context.resume()
  }
  return { engine, registry, entries, strip }
}

function Plates() {
  const [bench, setBench] = useState<Bench | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    makeBench().then(
      (made) => {
        if (!live) return
        setBench(made)
        Object.assign(window, {
          plates: {
            ready: true,
            context: made.engine.context,
            devices: Object.fromEntries(
              made.entries.map((entry) => [entry.device.id, entry.device]),
            ),
          },
        })
      },
      (error: unknown) => setFailure(String(error)),
    )
    return () => {
      live = false
    }
  }, [])

  if (failure) return <pre data-testid="plates-failed">{failure}</pre>
  if (!bench) return <p>Loading devices…</p>
  return (
    <LiveMixProvider engine={bench.engine}>
      <main
        data-lm-theme={theme}
        className="lm-root"
        data-testid="plates"
        style={{
          minHeight: '100vh',
          padding: 20,
          background: 'var(--lm-bar)',
          color: 'var(--lm-text)',
          font: '11px var(--lm-font)',
        }}
      >
        {bench.strip ? (
          <DeviceChainView
            strip={bench.strip}
            skin={deviceSkin}
            showAdd={false}
            data-testid="chain"
          />
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
            {bench.entries.map(({ device, feed, name }) => {
              const skin = deviceSkin(device)
              return (
                <figure key={device.id} style={{ margin: 0 }} data-plate={device.id}>
                  {skin ? (
                    <DevicePlate
                      device={device}
                      skin={skin}
                      registry={bench.registry}
                      source={feed}
                      defaultOpen={open}
                      // A stand-in for an app's preset cell, so the tools stand where they do in an app.
                      presetPicker={<span style={{ fontSize: 9, opacity: 0.7 }}>Preset</span>}
                      // As many tools as an app gives a plate: earlier, later, swap, save (and remove).
                      actions={
                        <>
                          {['‹', '›', '⇄', '↓'].map((mark) => (
                            <button
                              key={mark}
                              type="button"
                              className="lm-button lm-button--neutral"
                            >
                              {mark}
                            </button>
                          ))}
                        </>
                      }
                      onRemove={() => {}}
                      data-testid={`plate-${device.id}`}
                    />
                  ) : null}
                  <figcaption style={{ marginTop: 4, color: 'var(--lm-muted)', fontSize: 9 }}>
                    {name} · {device.id}
                  </figcaption>
                </figure>
              )
            })}
          </div>
        )}
      </main>
    </LiveMixProvider>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('plates: #root missing')
document.body.style.margin = '0'
createRoot(root).render(
  <StrictMode>
    <Plates />
  </StrictMode>,
)
