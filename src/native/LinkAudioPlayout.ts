// The Link Audio playout's work, apart from the worklet scope it runs in:
// keep the blocks of a peer's channel as they arrive and play each sample a
// fixed delay after the moment it was heard at the sender.
//
// Three things make that more than a queue:
//
//   Two sample clocks. The sender's device and this context each count their
//   own samples, at another rate or at the same rate a few parts in a
//   million apart. Every block says when it was heard, so the playout reads
//   the stream at whatever speed keeps it on those moments, between samples
//   (four-point interpolation), and never runs dry or piles up.
//
//   The network. Blocks come late by a little or a lot, and now and then not
//   at all. The delay is what covers the lateness: the playout listens to the
//   first quarter second, takes the latest block it saw plus a margin, and
//   holds that. It grows only when blocks keep coming too late for it, never
//   shrinks, and says so each time, because whoever records the channel moves
//   the recording earlier by it.
//
//   The clocks' own wobble. Where a block belongs on the context's clock is
//   known to a tenth of a millisecond at best, so the place of the whole
//   stream is the smoothed place of its blocks, and the reading speed is
//   pulled towards it gently: a correction is a fraction of a cent of pitch,
//   not a click.

import type { LinkReceivedBlock, LinkReceiveStats, LinkSourceEvent } from './link-receive-protocol'

/** How much of the channel is listened to before its delay is chosen. */
const PRIME_SEC = 0.25
/** The very first blocks are left out of that: a channel that has just been asked for sends a burst. */
const PRIME_SKIP_SEC = 0.05
/** The least spare time between a block arriving and its being due. */
const MARGIN_SEC = 0.004
/** A delay never grows past this by itself. */
const MAX_DELAY_SEC = 1
/**
 * Blocks too late for the delay make it grow when there are this many within
 * the window and they are spread over more than the span. One stall holds up
 * several blocks and lets them through together: that is not a reason.
 */
const LATE_BLOCKS = 3
const LATE_WINDOW_SEC = 10
const LATE_SPAN_SEC = 0.3
/** The delay grows to cover the blocks that were late this recently: the stall at hand. */
const LATE_RECENT_SEC = 0.25
/** Further than this from where it should be, the reading place jumps; nearer, it is pulled. */
const RESYNC_SEC = 0.03
/** A pull closes the distance in about this long, */
const PULL_SEC = 0.5
/** and never changes the speed by more than this: 0.2 %, three cents of pitch. */
const MAX_PULL = 0.002
/** Blocks whose moments are averaged before the stream's place is smoothed. */
const ORIGIN_SETTLE_BLOCKS = 16
const ORIGIN_SMOOTHING = 1 / 64
/**
 * A block this far from the stream's place is not wobble; this many in a row,
 * to one side, move the place, and the reading with it.
 */
const ORIGIN_STEP_SEC = 0.005
const ORIGIN_STEP_BLOCKS = 8
/** A block that follows the last by count and is this far from following it in time starts over. */
const DISCONTINUITY_SEC = 0.05
/** Frames a new start fades in over. */
const FADE_FRAMES = 64
/** Sound kept, in seconds of the sender's rate: more than any delay. */
const BUFFER_SEC = 2
/** Frames past the reading place the interpolation looks at. */
const LOOKAHEAD_FRAMES = 2

export interface LinkAudioPlayoutOptions {
  /** The context's sample rate. */
  sampleRate: number
  /** Seconds behind the sender, held as given; left out or null, the playout settles on one. */
  delaySec?: number | null
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value))

export class LinkAudioPlayout {
  private readonly sampleRate: number
  private readonly emit: (event: LinkSourceEvent) => void
  /** The delay is the playout's to choose. */
  private readonly auto: boolean
  private delay: number | null

  // The stream as it was sent: the sender's rate, and its frames counted from
  // the first block of this run.
  private rate = 0
  private capacity = 0
  private left = new Float32Array(0)
  private right = new Float32Array(0)
  /** One past the last frame written. */
  private written = 0
  /** The first frame that is sound of this run; older places in the ring are not. */
  private firstValid = 0
  /** The count the next block has when nothing was lost; -1 before the first. */
  private nextCount = -1

  /** The context time heard here when frame 0 was heard at the sender, smoothed. */
  private origin = 0
  private originBlocks = 0
  private stepStreak = 0

  private priming: { frames: number; least: number; most: number } | null = null
  private late: { at: number; lateness: number }[] = []

  private playing = false
  /** Where in the stream the next output frame reads, in the sender's frames. */
  private readPos = 0
  private fade = 0

  private blocks = 0
  private lost = 0
  private starved = 0
  private sinceStats = 0

  constructor(options: LinkAudioPlayoutOptions, emit: (event: LinkSourceEvent) => void) {
    this.sampleRate = options.sampleRate
    this.emit = emit
    const fixed = options.delaySec
    this.delay = typeof fixed === 'number' && Number.isFinite(fixed) && fixed >= 0 ? fixed : null
    this.auto = this.delay === null
  }

  /** How far behind the sender the channel plays; null until it has settled. */
  get delaySec(): number | null {
    return this.delay
  }

  /**
   * One block from the intake. `now` is the context time of the next frame
   * to be rendered: a block whose first frame is due before it came too late.
   */
  push(block: LinkReceivedBlock, now: number): void {
    const { frames, channels, sampleRate, count, contextTime, samples } = block
    if (!(frames > 0) || !(sampleRate > 0) || samples.length < frames * channels) return
    if (sampleRate !== this.rate) this.restart(sampleRate)
    this.blocks += 1

    let start = this.written
    const byTime = Math.round((contextTime - this.origin) * this.rate)
    if (this.nextCount < 0) {
      this.begin(contextTime)
      start = 0
    } else if (count < this.nextCount) {
      // Older than what has been taken: it came the long way round.
      if (byTime < this.written) return
      // An earlier count at a later moment: the sender began again, counting anew.
      this.begin(contextTime)
      start = 0
    } else {
      if (count > this.nextCount) this.lost += count - this.nextCount
      const follows =
        count === this.nextCount && Math.abs(byTime - this.written) <= DISCONTINUITY_SEC * this.rate
      if (follows) {
        this.follow(contextTime - start / this.rate)
      } else if (byTime < this.written) {
        // The stream says an earlier moment than it had reached: it began again.
        this.begin(contextTime)
        start = 0
      } else {
        // Blocks are missing, or the sender paused: this one goes where its moment is.
        this.skipTo(byTime)
        start = byTime
      }
    }

    this.write(samples, frames, channels, start)
    this.written = start + frames
    this.nextCount = count + 1
    this.settle(now - contextTime, frames, now)
  }

  /** Renders one quantum; `frame` is the context frame of its first sample. */
  process(left: Float32Array, right: Float32Array, frame: number): void {
    const frames = left.length
    this.sinceStats += frames
    if (this.sinceStats >= this.sampleRate) {
      this.sinceStats = 0
      this.emit({ type: 'stats', stats: this.takeStats() })
    }

    if (this.rate === 0 || this.delay === null || this.nextCount < 0) {
      left.fill(0)
      right.fill(0)
      return
    }

    // Where the stream should be read for this quantum's first frame.
    const target = (frame / this.sampleRate - this.delay - this.origin) * this.rate
    const nominal = this.rate / this.sampleRate
    let step = nominal
    if (!this.playing) {
      this.playing = true
      this.readPos = target
      this.fade = FADE_FRAMES
    } else {
      const ahead = target - this.readPos
      if (Math.abs(ahead) > RESYNC_SEC * this.rate) {
        this.readPos = target
        this.fade = FADE_FRAMES
      } else {
        step = nominal * (1 + clamp(ahead / (this.rate * PULL_SEC), -MAX_PULL, MAX_PULL))
      }
    }

    const mask = this.capacity - 1
    const from = Math.max(this.firstValid, this.written - this.capacity) + 1
    const to = this.written - LOOKAHEAD_FRAMES
    const l = this.left
    const r = this.right
    let pos = this.readPos
    for (let i = 0; i < frames; i += 1) {
      const index = Math.floor(pos)
      if (index < from || index >= to) {
        left[i] = 0
        right[i] = 0
        if (index >= to) this.starved += 1
      } else {
        const t = pos - index
        const a = (index - 1) & mask
        const b = index & mask
        const c = (index + 1) & mask
        const d = (index + 2) & mask
        let gain = 1
        if (this.fade > 0) {
          gain = 1 - this.fade / FADE_FRAMES
          this.fade -= 1
        }
        left[i] = gain * between(l[a], l[b], l[c], l[d], t)
        right[i] = gain * between(r[a], r[b], r[c], r[d], t)
      }
      pos += step
    }
    this.readPos = pos
  }

  /** What arrived, was lost and was missed since this was last asked. */
  takeStats(): LinkReceiveStats {
    const stats = {
      blocks: this.blocks,
      lost: this.lost,
      starvedFrames: this.starved,
      delaySec: this.delay,
    }
    this.blocks = 0
    this.lost = 0
    this.starved = 0
    return stats
  }

  /** A stream at another rate: everything kept is of the old one. */
  private restart(rate: number): void {
    this.rate = rate
    let capacity = 1
    while (capacity < rate * BUFFER_SEC) capacity *= 2
    this.capacity = capacity
    this.left = new Float32Array(capacity)
    this.right = new Float32Array(capacity)
    this.nextCount = -1
  }

  /** The first block of a run: it is frame 0, and its moment is where the stream stands. */
  private begin(contextTime: number): void {
    this.written = 0
    this.firstValid = 0
    this.origin = contextTime
    this.originBlocks = 1
    this.stepStreak = 0
    this.playing = false
    if (this.auto && this.delay === null) {
      this.priming = { frames: 0, least: Infinity, most: -Infinity }
    }
  }

  /** One more block's word on where the stream stands. */
  private follow(origin: number): void {
    if (this.originBlocks < ORIGIN_SETTLE_BLOCKS) {
      this.originBlocks += 1
      this.origin += (origin - this.origin) / this.originBlocks
      return
    }
    const off = origin - this.origin
    if (Math.abs(off) > ORIGIN_STEP_SEC) {
      const side = Math.sign(off)
      this.stepStreak = Math.sign(this.stepStreak) === side ? this.stepStreak + side : side
      if (Math.abs(this.stepStreak) >= ORIGIN_STEP_BLOCKS) {
        // The output moved (another device, a dropped buffer) and everything is
        // heard that much earlier or later from here on: the reading place goes
        // there at once. Pulled, it would be off the beat for seconds.
        this.origin = origin
        this.stepStreak = 0
        this.playing = false
      }
      return
    }
    this.stepStreak = 0
    this.origin += off * ORIGIN_SMOOTHING
  }

  /** Leaves silence from what was written up to `frame`. */
  private skipTo(frame: number): void {
    if (frame - this.written >= this.capacity) {
      this.firstValid = frame
      return
    }
    const mask = this.capacity - 1
    for (let index = this.written; index < frame; index += 1) {
      this.left[index & mask] = 0
      this.right[index & mask] = 0
    }
  }

  private write(samples: Float32Array, frames: number, channels: number, start: number): void {
    const mask = this.capacity - 1
    const count = Math.min(frames, this.capacity)
    const skip = frames - count
    for (let i = 0; i < count; i += 1) {
      const at = (start + skip + i) & mask
      const sample = (skip + i) * channels
      this.left[at] = samples[sample]
      // A mono channel plays from both sides.
      this.right[at] = channels > 1 ? samples[sample + 1] : samples[sample]
    }
  }

  /** Chooses the delay from how late blocks arrive, and grows it when they keep arriving too late. */
  private settle(lateness: number, frames: number, now: number): void {
    if (!this.auto) return

    const priming = this.priming
    if (priming) {
      priming.frames += frames
      if (priming.frames > PRIME_SKIP_SEC * this.rate) {
        priming.least = Math.min(priming.least, lateness)
        priming.most = Math.max(priming.most, lateness)
      }
      if (priming.frames >= PRIME_SEC * this.rate && Number.isFinite(priming.most)) {
        this.priming = null
        // As uneven as blocks came, that much is kept spare.
        this.setDelay(priming.most + Math.max(MARGIN_SEC, priming.most - priming.least))
      }
      return
    }

    if (this.delay === null) return
    const spare = this.delay - lateness - LOOKAHEAD_FRAMES / this.rate
    if (spare >= 0) return
    this.late = this.late.filter((entry) => now - entry.at <= LATE_WINDOW_SEC)
    this.late.push({ at: now, lateness })
    if (this.late.length < LATE_BLOCKS || now - this.late[0].at < LATE_SPAN_SEC) return
    if (this.delay >= MAX_DELAY_SEC) return
    const recent = this.late.filter((entry) => now - entry.at <= LATE_RECENT_SEC)
    const worst = Math.max(...recent.map((entry) => entry.lateness))
    this.late = []
    this.setDelay(worst + 2 * MARGIN_SEC)
    // What has been played is played; the stream is picked up at its new place.
    this.playing = false
  }

  private setDelay(delaySec: number): void {
    const delay = clamp(delaySec, 0, MAX_DELAY_SEC)
    if (delay === this.delay) return
    this.delay = delay
    this.emit({ type: 'delay', delaySec: delay })
  }
}

/** The curve through four samples, read `t` of the way from the second to the third. */
function between(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const a = -0.5 * p0 + 1.5 * p1 - 1.5 * p2 + 0.5 * p3
  const b = p0 - 2.5 * p1 + 2 * p2 - 0.5 * p3
  const c = -0.5 * p0 + 0.5 * p2
  return ((a * t + b) * t + c) * t + p1
}
