// The home map's one island. The page as built already holds every tile as a link with its
// picture, and the loop row as a group of choices. This puts a play button on each tile that has
// a lab, hears the loop row, runs the page's one tile player (lab/tiles.ts), and shows the small
// bar once something has been pressed: stop, what sounds, the level, a meter. With scripts off
// none of it is there, and the tiles are still links.

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { labUrl, labWorker, pagePlayer } from '../lab/page.ts'
import {
  buttonName,
  createTilePlayer,
  INITIAL_TILES,
  statusOf,
  type Tile,
  type TilePlayer,
  type TilesState,
} from '../lab/tiles.ts'
import type { WorkerReply } from '../lab/worker.ts'
import { twoDigits } from '../lib/lesson-map.ts'
import { toDb } from './draw.ts'

interface Props {
  tiles: Tile[]
  /** The loops of the row, to name the one a tile sounds on. */
  loops: { id: string; name: string }[]
}

/** Where a tile's button and its line of words go, in the page as built. */
interface Slots {
  root: HTMLElement
  play: Element
  note: Element
}

const PLAY = 'M2,1L11,6L2,11Z'
const STOP = 'M2,2H10V10H2Z'
const BUSY = 'M1,5H3V7H1ZM5,5H7V7H5ZM9,5H11V7H9Z'

function makePlayer(tiles: Tile[]): TilePlayer {
  return createTilePlayer(tiles, {
    worker(answer, died) {
      const worker = labWorker()
      worker.onmessage = (event: MessageEvent<WorkerReply>) => answer(event.data)
      worker.onerror = died
      return {
        send: (request) => worker.postMessage(request),
        end: () => worker.terminate(),
      }
    },
    url: labUrl,
    // The player makes its context on first use, which is inside a press.
    sounder: {
      play: (tap) => pagePlayer().play(tap),
      update: (tap) => pagePlayer().update(tap),
      stop: () => pagePlayer().stop(),
      setVolume: (volume) => pagePlayer().setVolume(volume),
      wake: () => pagePlayer().wake(),
    },
  })
}

/** The meter, and the line that crosses the sounding tile's picture: both run only while sound does. */
function useMotion(state: TilesState, slots: Map<string, Slots>) {
  const bar = useRef<HTMLSpanElement | null>(null)
  const sounding = state.sounding?.id
  useEffect(() => {
    const meter = bar.current
    if (meter) meter.style.transform = 'scaleX(0)'
    if (!sounding) return
    // A picture against time says where it starts and how long it is: the line crosses that.
    const picture = slots.get(sounding)?.root.querySelector<HTMLElement>('[data-time]')
    const [from = 0, span = 0] = (picture?.dataset.time ?? '').split(' ').map(Number)
    const head = picture && span > 0 ? document.createElement('span') : undefined
    if (head) {
      head.className = 'tile-head'
      picture?.append(head)
    }
    let frame = 0
    let held = 0
    const move = () => {
      frame = requestAnimationFrame(move)
      const player = pagePlayer()
      if (meter) {
        // 60 dB of the meter's length; the level falls back slowly so a hit can be seen.
        held = Math.max(player.level(), held * 0.93)
        meter.style.transform = `scaleX(${Math.min(1, Math.max(0, 1 + toDb(held) / 60))})`
      }
      if (head) {
        const at = ((player.position() ?? -1) - from) / span
        head.style.display = at >= 0 && at <= 1 ? 'block' : 'none'
        head.style.setProperty('--at', String(at))
      }
    }
    move()
    return () => {
      cancelAnimationFrame(frame)
      head?.remove()
    }
  }, [sounding, slots])
  return bar
}

export default function TileMap({ tiles, loops }: Props) {
  const [player] = useState(() => makePlayer(tiles))
  const state = useSyncExternalStore(player.subscribe, player.getState, () => INITIAL_TILES)
  const [slots, setSlots] = useState<Map<string, Slots>>(() => new Map())

  // The tiles and the loop row are in the page as built: find them once.
  useEffect(() => {
    const found = new Map<string, Slots>()
    for (const root of document.querySelectorAll<HTMLElement>('[data-tile]')) {
      const play = root.querySelector('.tile-play')
      const note = root.querySelector('.tile-note')
      if (play && note) found.set(root.dataset.tile ?? '', { root, play, note })
    }
    setSlots(found)

    const row = document.querySelector<HTMLElement>('[data-loops]')
    const picked = () => row?.querySelector<HTMLInputElement>('input:checked')?.value
    const pick = () => player.setLoop(picked() ?? state.loop)
    // A browser may have kept another choice than the first from before a reload.
    pick()
    row?.addEventListener('change', pick)
    const onKey = (event: KeyboardEvent) => {
      const busy = player.getState().loading !== null || player.getState().sounding !== null
      if (event.key === 'Escape' && busy) player.stop()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      row?.removeEventListener('change', pick)
      document.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player])

  // A tile's look follows its state: the stylesheet reads it off the tile.
  useEffect(() => {
    for (const [id, { root }] of slots) root.dataset.state = statusOf(state, id)
  }, [state, slots])

  const meter = useMotion(state, slots)

  const named = (id: string | null | undefined) => {
    const tile = tiles.find((one) => one.id === id)
    return tile ? `${twoDigits(tile.number)} ${tile.title}` : ''
  }
  const loop = state.sounding?.loop
  const what = [
    state.sounding &&
      `${named(state.sounding.id)} · ${loop ? (loops.find((one) => one.id === loop)?.name ?? loop) : 'its own notes'}`,
    state.loading && `Loading ${named(state.loading)}`,
  ].filter(Boolean)

  return (
    <>
      {tiles.map((tile) => {
        const slot = slots.get(tile.id)
        if (!slot) return null
        const status = statusOf(state, tile.id)
        return [
          createPortal(
            <button
              type="button"
              className="tile-button"
              aria-label={buttonName(state, tile)}
              aria-busy={status === 'loading' || undefined}
              onClick={() => player.press(tile.id)}
            >
              <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                <path d={status === 'sounding' ? STOP : status === 'loading' ? BUSY : PLAY} />
              </svg>
            </button>,
            slot.play,
            `${tile.id} play`,
          ),
          status === 'failed' &&
            createPortal(
              <span className="tile-failed">It did not load. Press play to try again.</span>,
              slot.note,
              `${tile.id} note`,
            ),
        ]
      })}
      {/* A failure is announced here, once; the line at the tile is for the eye. */}
      <p className="tiles-said" role="status">
        {state.said}
      </p>
      {state.open && (
        <div className="tilebar" role="region" aria-label="Player">
          <button
            type="button"
            className="tilebar-stop"
            disabled={what.length === 0}
            onClick={() => player.stop()}
          >
            <span aria-hidden="true">■</span> Stop
          </button>
          <span className="tilebar-what">{what.length > 0 ? what.join(', ') : 'Stopped'}</span>
          <div className="tilebar-level">
            <label htmlFor="tile-volume">Level</label>
            <input
              id="tile-volume"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={state.volume}
              onChange={(event) => player.setVolume(Number(event.target.value))}
            />
            {/* The lesson bar's meter, so one test helper reads either. */}
            <span className="playbar-meter" aria-hidden="true">
              <span ref={meter} />
            </span>
          </div>
        </div>
      )}
    </>
  )
}
