// The picture on a second screen: frames sent from the page that works them out to the pages that only show them.
//
// A frame is plain data (`frame.ts`), so another window of the same site paints the same picture from it: one
// that is put on a second screen, or shared in a call. The page with the piece sends, at its own pace and only
// while some screen is listening; a listening page paints what came last, and keeps the picture moving by its own
// clock in between, so it still drifts evenly where the sender is slowed down. A window that is covered is given
// few turns of its timers: what the picture follows of the music would come a second late from it, so a host can
// hand over a pace that is kept elsewhere (`every`).
//
// Browser only in what it is given: the line itself is anything that carries messages between pages, a
// `BroadcastChannel` where nothing else is handed over.

import { quietSignals, type VisualFrame } from './frame'
import { DEFAULT_PALETTE, visualPalette } from './palettes'

/** What carries the frames: a `BroadcastChannel`, or anything that does as one does. */
export interface VisualLine {
  postMessage(message: unknown): void
  close(): void
  onmessage: ((event: { data: unknown }) => void) | null
}

export interface VisualLineOptions {
  /** Opens the line of that name: a `BroadcastChannel` where nothing is said. */
  open?: (name: string) => VisualLine
  /** The time now in milliseconds, growing evenly: `performance.now()` where nothing is said. */
  now?: () => number
}

export interface SendVisualsOptions extends VisualLineOptions {
  /** How often a frame is sent, a second: 30 where nothing is said. */
  fps?: number
  /**
   * Calls `turn` every `ms` milliseconds until what it hands back is called: the page's own `setInterval` where
   * nothing is said. A browser slows the timers of a page that is covered or put behind another to one a second,
   * and the picture on the screen then follows the music a second late; a host that keeps time where it is not
   * slowed (a worker) hands that over here.
   */
  every?: (turn: () => void, ms: number) => () => void
}

const pageEvery = (turn: () => void, ms: number): (() => void) => {
  const timer = setInterval(turn, ms)
  return () => clearInterval(timer)
}

export interface VisualSender {
  /** Whether a screen is listening now. Nothing is worked out or sent while none is. */
  watched(): boolean
  close(): void
}

export interface VisualReceiver {
  /** The frame to paint at `now`: the one that came last, moved on by the time since. Before any came, a dark one. */
  frameAt: (nowMs: number) => VisualFrame
  /** Whether frames are coming: false before the first, and when none came for a while. */
  live(): boolean
  close(): void
}

/** A listening screen says so this often, in milliseconds; a sender that heard none for three of them stops. */
const HERE_EVERY_MS = 1000
const GONE_AFTER_MS = 3 * HERE_EVERY_MS

/**
 * What goes over the line. `visuals` is the shape's number: a page of another build that sends another is not
 * listened to. A sender asks who is there when it starts and when a screen leaves, and every screen answers `here`.
 */
type Said =
  | { visuals: 1; ask: true }
  | { visuals: 1; here: true }
  | { visuals: 1; gone: true }
  | { visuals: 1; frame: VisualFrame }

function said(data: unknown): Said | null {
  if (typeof data !== 'object' || data === null) return null
  return (data as { visuals?: unknown }).visuals === 1 ? (data as Said) : null
}

const openChannel = (name: string): VisualLine => {
  if (typeof BroadcastChannel === 'undefined')
    throw new Error('live-mix visuals: no BroadcastChannel')
  return new BroadcastChannel(name) as unknown as VisualLine
}
const clockNow = (): number => performance.now()

/**
 * Sends `frameAt(now)` down the line of that name for as long as a screen listens there, and nothing while none
 * does. It keeps its own pace, so the picture is sent on whether or not this page paints it too. `now` is the time
 * every other ask of this page's frames is made with.
 */
export function sendVisuals(
  name: string,
  frameAt: (nowMs: number) => VisualFrame,
  options: SendVisualsOptions = {},
): VisualSender {
  const { fps = 30, open = openChannel, now = clockNow, every = pageEvery } = options
  const line = open(name)
  let heardAt = -Infinity
  const watched = () => now() - heardAt < GONE_AFTER_MS
  const ask = () => line.postMessage({ visuals: 1, ask: true } satisfies Said)
  line.onmessage = (event) => {
    const message = said(event.data)
    if (!message) return
    if ('here' in message) heardAt = now()
    else if ('gone' in message) {
      // One screen left; another may still be there, and says so at once when asked.
      heardAt = -Infinity
      ask()
    }
  }
  ask()
  const stop = every(
    () => {
      if (!watched()) return
      const message: Said = { visuals: 1, frame: frameAt(now()) }
      line.postMessage(message)
    },
    1000 / Math.max(1, fps),
  )
  return {
    watched,
    close() {
      stop()
      line.onmessage = null
      line.close()
    },
  }
}

/**
 * Listens on the line of that name. `frameAt` is what a screen paints: hand it to `showVisuals`. The time it is
 * asked with is this page's own (`performance.now()`, which is what a screen's frames are counted in), and need
 * not be the sender's.
 */
export function receiveVisuals(name: string, options: VisualLineOptions = {}): VisualReceiver {
  const { open = openChannel, now = clockNow } = options
  const line = open(name)
  let frame: VisualFrame = {
    signals: quietSignals(),
    layers: [],
    palette: visualPalette(DEFAULT_PALETTE),
    grain: 0,
  }
  let cameAt = -Infinity
  // How fast the picture travelled between the last two frames, a second of its own time.
  let travelRate = 0
  line.onmessage = (event) => {
    const message = said(event.data)
    if (!message) return
    if ('ask' in message) here()
    if (!('frame' in message)) return
    const next = message.frame
    const dt = next.signals.time - frame.signals.time
    travelRate =
      cameAt > -Infinity && dt > 0
        ? Math.max(0, (next.signals.travel - frame.signals.travel) / dt)
        : 0
    frame = next
    cameAt = now()
  }
  const here = () => line.postMessage({ visuals: 1, here: true } satisfies Said)
  here()
  const timer = setInterval(here, HERE_EVERY_MS)
  return {
    frameAt: (nowMs) => {
      if (cameAt === -Infinity) return frame
      const since = Math.max(0, (nowMs - cameAt) / 1000)
      if (since === 0) return frame
      const { signals } = frame
      return {
        ...frame,
        signals: {
          ...signals,
          time: signals.time + since,
          travel: signals.travel + travelRate * since,
        },
      }
    },
    live: () => now() - cameAt < GONE_AFTER_MS,
    close() {
      clearInterval(timer)
      // Deaf first: the sender asks who is left, and this screen is not.
      line.onmessage = null
      line.postMessage({ visuals: 1, gone: true } satisfies Said)
      line.close()
    },
  }
}
