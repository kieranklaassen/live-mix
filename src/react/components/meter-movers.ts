// How a meter on a source moves on the frames: its fills and its peak-hold
// markers are put in place by animations that stand still, each at the
// millisecond its level asks for.
//
// Cutting a fill with `clip-path`, giving it a length or placing a marker by
// `bottom` has the browser paint it again and put every layer of the page
// together again: with a mixer of meters on a page that plays, 8 ms of a
// frame. A transform an animation holds is taken as it is, and the fill's
// picture, painted once, is kept.
//
// A segmented fill stands still and is cut by the window around it: the window
// is moved along the bar by what is dark, and what is in it is moved back by
// as much. A solid fill is as long as its bar and slides in its window, to the
// device pixel it would be laid out to.
//
// Where elements cannot be animated (jsdom), or a CSS pixel is not a whole
// number of device pixels (layers would stand between pixels), nothing is
// moved, and the meter writes its styles.

/** The elements of one bar that move. */
export interface MeterBarParts {
  bar: HTMLElement
  fill: HTMLElement | null
  hold: HTMLElement | null
}

export interface MeterMovers {
  /**
   * Move the fills and markers of these bars, and of no others. Answers with
   * the elements that were moved before and are not now: their styles are the
   * meter's to write again.
   */
  take(
    bars: readonly MeterBarParts[],
    vertical: boolean,
    segments: boolean,
  ): ReadonlySet<HTMLElement>
  /** Put a fill or a marker at its place along the bar, 0 to 1; false when it is not one that is moved. */
  put(element: HTMLElement, position: number): boolean
  end(): void
}

/** Puts one element, and gives it back as it was. */
interface Mover {
  put(position: number): void
  end(): void
}

/** The milliseconds of a fill's animation, which a level is put at. */
const FILL_MS = 1000

/** How far along a marker or a solid fill can be put, in pixels: a power of two keeps whole pixels whole. */
const REACH = 2 ** 14

function still(element: HTMLElement, from: string, to: string, duration: number): Animation {
  const animation = element.animate([{ transform: from }, { transform: to }], {
    duration,
    fill: 'both',
  })
  animation.pause()
  return animation
}

function canMove(): boolean {
  return (
    typeof Element === 'function' &&
    typeof Element.prototype.animate === 'function' &&
    typeof ResizeObserver === 'function' &&
    Number.isInteger(window.devicePixelRatio)
  )
}

/** The window a fill is in; null when the meter's elements are not as they are here. */
function windowOf(fill: HTMLElement): { outer: HTMLElement; inner: HTMLElement } | null {
  const inner = fill.parentElement
  const outer = inner?.parentElement
  return inner && outer?.classList.contains('lm-meter__window') ? { outer, inner } : null
}

function segmentedMover(fill: HTMLElement, vertical: boolean): Mover | null {
  const around = windowOf(fill)
  if (!around) return null
  const { outer, inner } = around
  const axis = vertical ? 'translateY' : 'translateX'
  // A vertical fill is dark from its top, a horizontal one from its right.
  const sign = vertical ? '' : '-'
  const back = vertical ? '-' : ''
  outer.dataset.moved = 'cut'
  const animations = [
    still(outer, `${axis}(0%)`, `${axis}(${sign}100%)`, FILL_MS),
    still(inner, `${axis}(0%)`, `${axis}(${back}100%)`, FILL_MS),
  ]
  return {
    put: (position) => {
      // React may have rendered the cut meanwhile.
      if (fill.style.clipPath !== 'none') fill.style.clipPath = 'none'
      for (const animation of animations) animation.currentTime = (1 - position) * FILL_MS
    },
    end: () => {
      delete outer.dataset.moved
      for (const animation of animations) animation.cancel()
    },
  }
}

/** An element put so many CSS pixels along by an animation of its own. */
function along(element: HTMLElement, vertical: boolean): { put(px: number): void; end(): void } {
  const axis = vertical ? 'translateY' : 'translateX'
  element.style.willChange = 'transform'
  const animation = still(element, `${axis}(${-REACH}px)`, `${axis}(${REACH}px)`, 2 * REACH)
  return {
    put: (px) => {
      animation.currentTime = REACH + px
    },
    end: () => {
      element.style.willChange = ''
      animation.cancel()
    },
  }
}

/** A length the browser lays out, in device pixels: in 64ths of one. */
function laidOut(position: number, length: number): number {
  return Math.floor(position * length * 64) / 64
}

function solidMover(fill: HTMLElement, vertical: boolean, lengthOf: () => number): Mover | null {
  const around = windowOf(fill)
  if (!around) return null
  const { outer } = around
  const property = vertical ? 'height' : 'width'
  outer.dataset.moved = 'slide'
  const mark = along(fill, vertical)
  return {
    put: (position) => {
      if (fill.style[property] !== '100%') fill.style[property] = '100%'
      const scale = window.devicePixelRatio
      const length = lengthOf() * scale
      const filled = laidOut(position, length)
      mark.put((vertical ? Math.round(length - filled) : Math.round(filled) - length) / scale)
    },
    end: () => {
      delete outer.dataset.moved
      mark.end()
    },
  }
}

function holdMover(hold: HTMLElement, vertical: boolean, lengthOf: () => number): Mover {
  const property = vertical ? 'bottom' : 'left'
  const mark = along(hold, vertical)
  return {
    put: (position) => {
      if (hold.style[property] !== '0px') hold.style[property] = '0px'
      const scale = window.devicePixelRatio
      const length = lengthOf() * scale
      const at = laidOut(position, length)
      const px = vertical
        ? Math.round(length - scale - at) - Math.round(length - scale)
        : Math.round(at)
      mark.put(px / scale)
    },
    end: () => mark.end(),
  }
}

const NONE: ReadonlySet<HTMLElement> = new Set()

/**
 * The movers of one meter. `changed` is called when what they go by did, the
 * length of a bar or the device's pixels: the meter takes its bars again.
 */
export function moversOf(changed: () => void): MeterMovers {
  const movers = new Map<HTMLElement, Mover>()
  const lengths = new Map<HTMLElement, number>()
  let drawnAs = ''
  let sizes: ResizeObserver | null = null

  // A window moved to another screen, or a page zoomed: its pixels are others.
  let scale = 0
  const rescaled = (): void => {
    if (window.devicePixelRatio !== scale) changed()
  }

  const letGo = (element: HTMLElement): void => {
    movers.get(element)?.end()
    movers.delete(element)
  }

  const stop = (): void => {
    for (const element of [...movers.keys()]) letGo(element)
    sizes?.disconnect()
    sizes = null
    lengths.clear()
  }

  let listening = false
  const listen = (on: boolean): void => {
    if (on === listening) return
    listening = on
    if (on) window.addEventListener('resize', rescaled)
    else window.removeEventListener('resize', rescaled)
  }

  return {
    take: (bars, vertical, segments) => {
      if (bars.length === 0 && movers.size === 0 && !listening) return NONE
      const before = new Set(movers.keys())
      const able = bars.length > 0 && canMove()
      scale = window.devicePixelRatio
      listen(bars.length > 0)
      const as = `${vertical} ${segments}`
      if (!able || drawnAs !== as) stop()
      drawnAs = as
      if (!able) return before
      const kept = new Set<HTMLElement>()
      sizes ??= new ResizeObserver((entries) => {
        for (const entry of entries) {
          const bar = entry.target as HTMLElement
          lengths.set(bar, vertical ? entry.contentRect.height : entry.contentRect.width)
        }
        changed()
      })
      for (const { bar, fill, hold } of bars) {
        if (!lengths.has(bar)) {
          lengths.set(bar, 0)
          sizes.observe(bar)
        }
        const lengthOf = (): number => lengths.get(bar) ?? 0
        const take = (element: HTMLElement | null, make: () => Mover | null): void => {
          const mover = element && (movers.get(element) ?? make())
          if (!element || !mover) return
          movers.set(element, mover)
          kept.add(element)
        }
        if (fill && segments) take(fill, () => segmentedMover(fill, vertical))
        // What is put by the length of its bar waits for that.
        if (lengthOf() === 0) continue
        if (fill && !segments) take(fill, () => solidMover(fill, vertical, lengthOf))
        if (hold) take(hold, () => holdMover(hold, vertical, lengthOf))
      }
      for (const element of before) if (!kept.has(element)) letGo(element)
      for (const bar of [...lengths.keys()]) {
        if (!bars.some((parts) => parts.bar === bar)) {
          lengths.delete(bar)
          sizes.unobserve(bar)
        }
      }
      for (const element of kept) before.delete(element)
      return before
    },
    put: (element, position) => {
      const mover = movers.get(element)
      mover?.put(position)
      return mover !== undefined
    },
    end: () => {
      stop()
      listen(false)
    },
  }
}
