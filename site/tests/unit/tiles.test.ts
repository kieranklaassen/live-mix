// The home map's tile player (src/lab/tiles.ts), driven with a stand-in for the worker and one
// for what makes the sound: every reply is handed over by the test, when the test says.

import { describe, expect, it } from 'vitest'
import type { Result, Tap } from '../../src/lab/store.ts'
import {
  buttonName,
  createTilePlayer,
  statusOf,
  type LabWorker,
  type Tile,
} from '../../src/lab/tiles.ts'
import type { WorkerReply, WorkerRequest } from '../../src/lab/worker.ts'

const tile = (id: string, title: string, more: Partial<Tile> = {}): Tile => ({
  id,
  title,
  number: 1,
  lab: id,
  seconds: 4,
  values: {},
  tap: 'out',
  own: false,
  ...more,
})

const COMPRESSION = tile('compression', 'Compression', { values: { ratio: 8 } })
const LIMITING = tile('limiting', 'Limiting and true peaks', { seconds: 2 })
const STRING = tile('plucked-string', 'The plucked string', { own: true })

interface StandIn extends LabWorker {
  sent: WorkerRequest[]
  ended: boolean
  answer(reply: WorkerReply): void
  die(): void
}

/** A render's result whose `out` tap is told from another's by its one sample. */
function result(mark: number): Result {
  const out: Tap = {
    index: 0,
    id: 'out',
    name: 'Output',
    unit: '',
    kind: 'audio',
    origin: 'device',
    channels: 1,
    channels_data: [Float32Array.of(mark)],
    length: 1,
    x0: 0,
    x1: 1,
    columns: 0,
    log: false,
  }
  return { frames: 1, ms: 1, checks: {}, taps: { out } }
}

function setUp(tiles: Tile[] = [COMPRESSION, LIMITING, STRING]) {
  const workers: StandIn[] = []
  /** What the sounder was asked, in order: "play 3" is a play of the render marked 3. */
  const sound: string[] = []
  const heard = (what: string) => (tap: Tap) => sound.push(`${what} ${tap.channels_data[0]![0]}`)
  const player = createTilePlayer(tiles, {
    worker(answer, died) {
      const made: StandIn = {
        sent: [],
        ended: false,
        send: (request) => made.sent.push(request),
        end: () => (made.ended = true),
        answer,
        die: died,
      }
      workers.push(made)
      return made
    },
    url: (lab) => `/labs/${lab}.wasm`,
    sounder: {
      play: heard('play'),
      update: heard('update'),
      stop: () => sound.push('stop'),
      setVolume: (volume) => sound.push(`volume ${volume}`),
      wake: () => sound.push('wake'),
    },
  })
  const ready = (worker: StandIn) => worker.answer({ type: 'ready', description: undefined! })
  /** Answer the render the worker was asked last. */
  const lands = (worker: StandIn, mark: number) => {
    const asked = worker.sent.at(-1)
    if (asked?.type !== 'render') throw new Error('The worker was not asked for a render.')
    worker.answer({ type: 'result', seq: asked.seq, result: result(mark) })
  }
  const status = (one: Tile) => statusOf(player.getState(), one.id)
  return { player, workers, sound, ready, lands, status }
}

describe('a press on a tile', () => {
  it('loads the lesson’s lab and the bench, renders it on the chosen loop, then sounds', () => {
    const { player, workers, sound, ready, lands, status } = setUp()
    expect(buttonName(player.getState(), COMPRESSION)).toBe('Hear Compression')

    player.press('compression')
    expect(status(COMPRESSION)).toBe('loading')
    expect(buttonName(player.getState(), COMPRESSION)).toBe('Loading Compression')
    // What the sound comes out of is made in the press, before anything is loaded.
    expect(sound).toEqual(['wake'])
    expect(workers).toHaveLength(1)
    expect(workers[0]!.sent).toEqual([
      {
        type: 'init',
        labUrl: '/labs/compression.wasm',
        benchUrl: '/labs/bench.wasm',
        frames: 192_000,
        spectra: [],
      },
    ])

    ready(workers[0]!)
    expect(workers[0]!.sent[1]).toEqual({
      type: 'render',
      seq: 1,
      source: 'drums',
      values: { ratio: 8 },
    })
    expect(status(COMPRESSION)).toBe('loading')

    lands(workers[0]!, 1)
    expect(status(COMPRESSION)).toBe('sounding')
    expect(buttonName(player.getState(), COMPRESSION)).toBe('Stop Compression')
    expect(player.getState().sounding).toEqual({ id: 'compression', loop: 'drums' })
    expect(sound).toEqual(['wake', 'play 1'])
  })

  it('on another tile during a load ends that load, and only the second sounds', () => {
    const { player, workers, sound, ready, lands, status } = setUp()
    player.press('compression')
    ready(workers[0]!)
    player.press('limiting')

    expect(workers[0]!.ended).toBe(true)
    expect(workers).toHaveLength(2)
    expect(workers[1]!.sent[0]).toMatchObject({
      type: 'init',
      labUrl: '/labs/limiting.wasm',
      frames: 96_000,
    })
    expect(status(COMPRESSION)).toBe('idle')
    expect(status(LIMITING)).toBe('loading')

    // The first worker's render, were it to land after all, sounds nothing.
    lands(workers[0]!, 1)
    expect(sound).toEqual(['wake', 'wake'])

    ready(workers[1]!)
    lands(workers[1]!, 2)
    expect(sound).toEqual(['wake', 'wake', 'play 2'])
    expect(status(COMPRESSION)).toBe('idle')
    expect(status(LIMITING)).toBe('sounding')
  })

  it('on the tile that sounds stops it', () => {
    const { player, workers, sound, ready, lands, status } = setUp()
    player.press('compression')
    ready(workers[0]!)
    lands(workers[0]!, 1)

    player.press('compression')
    expect(sound).toEqual(['wake', 'play 1', 'stop'])
    expect(status(COMPRESSION)).toBe('idle')
    expect(player.getState().sounding).toBeNull()
    // The worker did nothing that had to be cancelled: it stays, with its lab, for the next press.
    expect(workers[0]!.ended).toBe(false)
  })

  it('on the tile that is loading drops the load, and nothing starts later', () => {
    const { player, workers, sound, ready, lands, status } = setUp()
    player.press('compression')
    ready(workers[0]!)
    player.press('compression')

    expect(workers[0]!.ended).toBe(true)
    expect(status(COMPRESSION)).toBe('idle')
    lands(workers[0]!, 1)
    expect(sound).toEqual(['wake', 'stop'])
    expect(status(COMPRESSION)).toBe('idle')
    expect(workers).toHaveLength(1)
  })

  it('on another tile while one sounds loads the new lab in place, and the old sound stays until it lands', () => {
    const { player, workers, sound, ready, lands, status } = setUp()
    player.press('compression')
    ready(workers[0]!)
    lands(workers[0]!, 1)

    player.press('limiting')
    expect(workers).toHaveLength(1)
    expect(workers[0]!.sent.at(-1)).toEqual({
      type: 'lab',
      labUrl: '/labs/limiting.wasm',
      frames: 96_000,
      spectra: [],
    })
    expect(status(COMPRESSION)).toBe('sounding')
    expect(status(LIMITING)).toBe('loading')
    expect(sound).toEqual(['wake', 'play 1', 'wake'])

    ready(workers[0]!)
    lands(workers[0]!, 2)
    expect(sound).toEqual(['wake', 'play 1', 'wake', 'play 2'])
    expect(status(COMPRESSION)).toBe('idle')
    expect(status(LIMITING)).toBe('sounding')
  })

  it('on the tile that sounds, while another loads, stops the sound and drops the load', () => {
    const { player, workers, sound, ready, lands, status } = setUp()
    player.press('compression')
    ready(workers[0]!)
    lands(workers[0]!, 1)
    player.press('limiting')

    player.press('compression')
    expect(workers[0]!.ended).toBe(true)
    expect(sound.at(-1)).toBe('stop')
    expect(status(COMPRESSION)).toBe('idle')
    expect(status(LIMITING)).toBe('idle')
  })
})

describe('a load that fails', () => {
  it('says so at the tile and in one line, and a press tries again', () => {
    const { player, workers, sound, ready, lands, status } = setUp()
    player.press('compression')
    workers[0]!.answer({ type: 'failed', message: '/labs/compression.wasm answered 404' })

    expect(status(COMPRESSION)).toBe('failed')
    expect(buttonName(player.getState(), COMPRESSION)).toBe('Hear Compression')
    expect(player.getState().said).toBe('Compression did not load. Press its button to try again.')
    expect(workers[0]!.ended).toBe(true)
    expect(sound).toEqual(['wake'])

    player.press('compression')
    expect(status(COMPRESSION)).toBe('loading')
    expect(player.getState().said).toBe('')
    expect(workers).toHaveLength(2)
    expect(workers[1]!.sent[0]).toMatchObject({ type: 'init', labUrl: '/labs/compression.wasm' })
    ready(workers[1]!)
    lands(workers[1]!, 3)
    expect(status(COMPRESSION)).toBe('sounding')
    expect(sound).toEqual(['wake', 'wake', 'play 3'])
  })

  it('leaves the tile that sounds as it is', () => {
    const { player, workers, sound, ready, lands, status } = setUp()
    player.press('compression')
    ready(workers[0]!)
    lands(workers[0]!, 1)
    player.press('limiting')
    workers[0]!.die()

    expect(status(LIMITING)).toBe('failed')
    expect(status(COMPRESSION)).toBe('sounding')
    expect(sound).toEqual(['wake', 'play 1', 'wake'])
    expect(player.getState().said).toBe(
      'Limiting and true peaks did not load. Press its button to try again.',
    )
  })
})

describe('the loop row', () => {
  it('picks and starts nothing while no tile sounds', () => {
    const { player, workers, sound } = setUp()
    player.setLoop('pad')
    expect(player.getState().loop).toBe('pad')
    expect(workers).toHaveLength(0)
    expect(sound).toEqual([])
  })

  it('renders the tile that sounds again on the new loop, in place', () => {
    const { player, workers, sound, ready, lands, status } = setUp()
    player.press('compression')
    ready(workers[0]!)
    lands(workers[0]!, 1)

    player.setLoop('bass')
    // The lab is in the worker already: one more render, and no load.
    expect(workers).toHaveLength(1)
    expect(workers[0]!.sent.map((request) => request.type)).toEqual(['init', 'render', 'render'])
    expect(workers[0]!.sent.at(-1)).toMatchObject({ source: 'bass', values: { ratio: 8 } })
    expect(status(COMPRESSION)).toBe('sounding')

    lands(workers[0]!, 2)
    expect(sound).toEqual(['wake', 'play 1', 'update 2'])
    expect(player.getState().sounding).toEqual({ id: 'compression', loop: 'bass' })
  })

  it('changed during a load is the loop the tile lands on', () => {
    const { player, workers, sound, ready, lands } = setUp()
    player.press('compression')
    ready(workers[0]!)
    player.setLoop('guitar')

    // The render on the old loop lands: it does not sound, and the lab is rendered on the new one.
    lands(workers[0]!, 1)
    expect(sound).toEqual(['wake'])
    expect(workers[0]!.sent.at(-1)).toMatchObject({ type: 'render', source: 'guitar' })
    lands(workers[0]!, 2)
    expect(sound).toEqual(['wake', 'play 2'])
    expect(player.getState().sounding).toEqual({ id: 'compression', loop: 'guitar' })
  })

  it('is not heard through a tile that plays its own notes', () => {
    const { player, workers, sound, ready, lands } = setUp()
    player.press('plucked-string')
    ready(workers[0]!)
    expect(workers[0]!.sent.at(-1)).toMatchObject({ type: 'render', source: 'none' })
    lands(workers[0]!, 1)
    expect(player.getState().sounding).toEqual({ id: 'plucked-string', loop: null })

    player.setLoop('mix')
    expect(workers[0]!.sent).toHaveLength(2)
    expect(sound).toEqual(['wake', 'play 1'])
  })
})

describe('stop, and the level', () => {
  it('stop drops a load and silences the sound', () => {
    const { player, workers, sound, ready, lands, status } = setUp()
    player.press('compression')
    ready(workers[0]!)
    lands(workers[0]!, 1)
    player.press('limiting')
    player.stop()

    expect(workers[0]!.ended).toBe(true)
    expect(sound.at(-1)).toBe('stop')
    expect(status(COMPRESSION)).toBe('idle')
    expect(status(LIMITING)).toBe('idle')
  })

  it('the level goes to what makes the sound', () => {
    const { player, sound } = setUp()
    player.setVolume(0.4)
    expect(player.getState().volume).toBe(0.4)
    expect(sound).toEqual(['volume 0.4'])
  })
})
