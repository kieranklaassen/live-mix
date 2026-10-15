// The engine's side of the bench, in a file of its own so the library is fetched only when a
// reader opens a device. Follows playground/src/plates.tsx: a registry of every stock device, an
// engine on the page's audio context, the device created from the registry, its plate from the kit.

import { useEffect, useState } from 'react'
import {
  DeviceRegistry,
  createEngine,
  devices as stockDevices,
  generateSpaceImpulse,
  isNoteDevice,
  type Device,
  type Engine,
} from '@kieranklaassen/live-mix'
import { registerStockWasmDevices } from '@kieranklaassen/live-mix/dsp'
import {
  DevicePlate,
  DevicePresetCell,
  LiveMixProvider,
  deviceSkin,
} from '@kieranklaassen/live-mix/react'
import { labStore, pagePlayer, useLab } from '../lab/page.ts'
import { BENCH } from '../lab/store.ts'
import type { BenchProps } from './DeviceBench.tsx'

interface Built {
  engine: Engine
  registry: DeviceRegistry
  device: Device
  feed: AudioNode
}

/** What an instrument is played while it is the sounding stage: a slow broken chord that comes round. */
const PHRASE: readonly { at: number; hold: number; note: number; gain: number }[] = [
  { at: 0, hold: 2.4, note: 50, gain: 0.8 },
  { at: 0.5, hold: 1.6, note: 57, gain: 0.7 },
  { at: 1, hold: 1.6, note: 65, gain: 0.55 },
  { at: 1.5, hold: 1.6, note: 69, gain: 0.6 },
  { at: 2, hold: 1.8, note: 72, gain: 0.8 },
  { at: 3, hold: 0.9, note: 62, gain: 0.7 },
  { at: 3.5, hold: 0.4, note: 69, gain: 0.5 },
]
const PHRASE_SECONDS = 4

async function build(props: BenchProps): Promise<Built> {
  const context = pagePlayer().context() as AudioContext
  const registry = registerStockWasmDevices(new DeviceRegistry(stockDevices.list()))
  const engine = createEngine({ context, devices: registry })
  const options: Record<string, unknown> = { params: props.params }
  if (props.impulse) {
    options.impulse = generateSpaceImpulse(context, {
      decaySec: props.impulse.seconds,
      seed: props.impulse.seed,
    })
  }
  const device = await registry.create(props.device, context, options)
  const feed = pagePlayer().benchFeed()
  const back = pagePlayer().benchReturn()
  if (props.as !== 'instrument') feed.connect(device.input)
  // A device that puts out only its wet sound is heard as a send is: beside the dry loop.
  if (props.as === 'send') feed.connect(back)
  device.output.connect(back)
  return { engine, registry, device, feed }
}

export default function BenchPlate(props: BenchProps) {
  const [built, setBuilt] = useState<Built | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const state = useLab()
  const sounding = state.playing && state.sounding === BENCH

  useEffect(() => {
    let live = true
    let made: Built | undefined
    build(props).then(
      (result) => {
        made = result
        if (!live) return
        setBuilt(result)
        labStore().openBench()
      },
      (error: unknown) =>
        live && setFailure(error instanceof Error ? error.message : String(error)),
    )
    return () => {
      live = false
      if (made) {
        try {
          made.feed.disconnect(made.device.input)
        } catch {
          // An instrument was never fed.
        }
        made.device.output.disconnect()
        made.device.dispose()
      }
    }
    // The bench is built once for the device the page names.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // An instrument plays its phrase while it is the sounding stage.
  useEffect(() => {
    const device = built?.device
    if (!sounding || !device || props.as !== 'instrument' || !isNoteDevice(device)) return
    const timers: ReturnType<typeof setTimeout>[] = []
    const held = new Set<number>()
    let round = 0
    const play = () => {
      const base = round * 100
      for (const [index, { at, hold, note, gain }] of PHRASE.entries()) {
        const id = base + index
        timers.push(
          setTimeout(() => {
            held.add(id)
            device.noteOn(id, 440 * 2 ** ((note - 69) / 12), gain)
          }, at * 1000),
          setTimeout(
            () => {
              held.delete(id)
              device.noteOff(id)
            },
            (at + hold) * 1000,
          ),
        )
      }
      round += 1
    }
    play()
    const again = setInterval(play, PHRASE_SECONDS * 1000)
    return () => {
      clearInterval(again)
      timers.forEach(clearTimeout)
      held.forEach((id) => device.noteOff(id))
    }
  }, [sounding, built, props.as])

  if (failure) {
    return (
      <p className="bench-note" role="alert" data-bench-failed="">
        The device did not start: {failure}
      </p>
    )
  }
  if (!built) return <p className="bench-note">Building the device…</p>
  const skin = deviceSkin(built.device)
  return (
    <LiveMixProvider engine={built.engine}>
      {skin ? (
        <DevicePlate
          device={built.device}
          skin={skin}
          registry={built.registry}
          source={props.as === 'instrument' ? null : built.feed}
          spread={props.as === 'instrument'}
          defaultOpen
          showBypass={props.as !== 'instrument'}
          presetPicker={<DevicePresetCell device={built.device} registry={built.registry} />}
          data-testid="bench-plate"
        />
      ) : (
        <p className="bench-note" data-testid="bench-plate">
          {props.name} is running. It has no plate of its own.
        </p>
      )}
    </LiveMixProvider>
  )
}
