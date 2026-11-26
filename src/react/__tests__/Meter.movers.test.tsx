// @vitest-environment jsdom
// A meter on a source moves its fills and markers by animations that stand
// still, where the browser has them. jsdom has none: these tests stand in for
// them, and for the observer that says how long a bar is.
import '@testing-library/jest-dom/vitest'
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { dbToGain } from '../../core/devices/native/units'
import { Meter, type MeterProps } from '../components/Meter'
import { dbToMeterPosition } from '../components/control-math'
import { createTestEngine } from './harness'

interface StandIn {
  element: HTMLElement
  from: string
  to: string
  duration: number
  currentTime: number
  paused: boolean
  cancelled: boolean
}

let animations: StandIn[] = []
let observers: { run: (length: number) => void; gone: boolean }[] = []
const realScale = window.devicePixelRatio

/** An element that is on the page. */
function here(element: HTMLElement | null): HTMLElement {
  if (!element) throw new Error('not on the page')
  return element
}

function setScale(scale: number): void {
  Object.defineProperty(window, 'devicePixelRatio', { value: scale, configurable: true })
}

beforeEach(() => {
  animations = []
  observers = []
  setScale(2)
  Object.assign(Element.prototype, {
    animate(this: HTMLElement, frames: { transform: string }[], options: { duration: number }) {
      const standIn: StandIn & { pause(): void; cancel(): void } = {
        element: this,
        from: frames[0].transform,
        to: frames[1].transform,
        duration: options.duration,
        currentTime: 0,
        paused: false,
        cancelled: false,
        pause() {
          standIn.paused = true
        },
        cancel() {
          standIn.cancelled = true
        },
      }
      animations.push(standIn)
      return standIn
    },
  })
  vi.stubGlobal(
    'ResizeObserver',
    class {
      targets: Element[] = []
      gone = false
      constructor(callback: (entries: unknown[]) => void) {
        const run = (length: number): void => {
          act(() =>
            callback(
              this.targets.map((target) => ({
                target,
                contentRect: { width: length, height: length },
              })),
            ),
          )
        }
        const self = { run, gone: false }
        observers.push(self)
        this.disconnect = () => {
          self.gone = true
          this.targets = []
        }
      }
      disconnect: () => void
      observe(target: Element): void {
        this.targets.push(target)
      }
      unobserve(target: Element): void {
        this.targets = this.targets.filter((one) => one !== target)
      }
    },
  )
})

afterEach(() => {
  cleanup()
  delete (Element.prototype as { animate?: unknown }).animate
  vi.unstubAllGlobals()
  setScale(realScale)
})

function mount(props: MeterProps) {
  const fixture = createTestEngine()
  const view = render(<Meter {...props} />, { wrapper: fixture.wrapper })
  let time = 0
  const find = (selector: string): HTMLElement =>
    here(view.container.querySelector<HTMLElement>(selector))
  return {
    ...view,
    find,
    /** Says how long the bars are, as the observer does once they are laid out. */
    measure: (length: number): void =>
      observers
        .filter((one) => !one.gone)
        .at(-1)
        ?.run(length),
    level(db: number): void {
      fixture.ctx.analysers[0].level = Number.isFinite(db) ? dbToGain(db) : 0
      time += 100
      act(() => fixture.frames.flush(time))
    },
    of: (element: HTMLElement | null): StandIn[] =>
      animations.filter((one) => one.element === element && !one.cancelled),
  }
}

const PEAK = '.lm-meter__fill--peak'

/** The first number of a style: the analyser keeps a level in single precision. */
const percent = (style: string): number => Number(/[\d.]+/.exec(style)?.[0])
/** The place of a level along a bar, in percent. */
const at = (db: number): number => dbToMeterPosition(db, -60, 0) * 100

describe('Meter on a source, moved by animations that stand still', () => {
  it('cuts a segmented fill by the window around it, and never by its own style', () => {
    const meter = mount({ look: 'segments' })
    const fill = meter.find(PEAK)
    const inner = here(fill.parentElement)
    const outer = here(inner.parentElement)
    meter.level(-20)
    const position = dbToMeterPosition(-20, -60, 0)
    expect(fill.style.clipPath).toBe('none')
    expect(outer.dataset.moved).toBe('cut')
    const [window] = meter.of(outer)
    const [back] = meter.of(inner)
    expect([window.from, window.to]).toEqual(['translateY(0%)', 'translateY(100%)'])
    expect([back.from, back.to]).toEqual(['translateY(0%)', 'translateY(-100%)'])
    expect(window.paused && back.paused).toBe(true)
    // The window is down by what is dark, and what is in it is up by as much.
    expect(window.currentTime / window.duration).toBeCloseTo(1 - position, 6)
    expect(back.currentTime).toBe(window.currentTime)
    meter.level(-6)
    expect(window.currentTime / window.duration).toBeCloseTo(1 - dbToMeterPosition(-6, -60, 0), 6)
    expect(fill.style.clipPath).toBe('none')
    expect(meter.of(outer)).toHaveLength(1)
  })

  it('cuts a horizontal segmented fill from its right', () => {
    const meter = mount({ look: 'segments', orientation: 'horizontal' })
    meter.level(-20)
    const inner = here(meter.find(PEAK).parentElement)
    expect(meter.of(inner.parentElement)[0].to).toBe('translateX(-100%)')
    expect(meter.of(inner)[0].to).toBe('translateX(100%)')
  })

  it('slides a solid fill to the device pixel once the length of its bar is known', () => {
    const meter = mount({ orientation: 'horizontal', bars: ['peak'] })
    meter.level(-20)
    const fill = meter.find(PEAK)
    // Until then it has the length it is laid out with.
    expect(meter.of(fill)).toHaveLength(0)
    expect(percent(fill.style.width)).toBeCloseTo(at(-20), 4)
    meter.measure(66)
    expect(fill.style.width).toBe('100%')
    expect(fill.closest<HTMLElement>('.lm-meter__window')?.dataset.moved).toBe('slide')
    const [slide] = meter.of(fill)
    const px = slide.currentTime - slide.duration / 2
    // 66 px are 132 of the device's; the end stands on one of them.
    expect(px).toBe((Math.round(dbToMeterPosition(-20, -60, 0) * 132) - 132) / 2)
    meter.level(-40)
    expect(slide.currentTime - slide.duration / 2).toBe(
      (Math.round(dbToMeterPosition(-40, -60, 0) * 132) - 132) / 2,
    )
    expect(fill.style.width).toBe('100%')
  })

  it('slides an upright solid fill down by what is not filled', () => {
    const meter = mount({ bars: ['peak'], holdMs: 0 })
    meter.level(-30)
    meter.measure(100)
    const [slide] = meter.of(meter.find(PEAK))
    expect(slide.from.startsWith('translateY(')).toBe(true)
    expect(slide.currentTime - slide.duration / 2).toBe(
      Math.round(200 - dbToMeterPosition(-30, -60, 0) * 200) / 2,
    )
  })

  it('puts the marker of the held peak on a device pixel, from the foot of the bar', () => {
    const meter = mount({ look: 'segments', bars: ['peak'] })
    meter.level(-20)
    const hold = meter.find('.lm-meter__hold')
    expect(percent(hold.style.bottom)).toBeCloseTo(at(-20), 4)
    meter.measure(77)
    expect(hold.style.bottom).toBe('0px')
    const [mark] = meter.of(hold)
    const px = mark.currentTime - mark.duration / 2
    const laid = Math.floor(dbToMeterPosition(-20, -60, 0) * 154 * 64) / 64
    expect(px).toBe((Math.round(152 - laid) - 152) / 2)
  })

  it('writes its styles again where a pixel is not a whole number of the device’s', () => {
    const meter = mount({ look: 'segments', bars: ['peak'] })
    meter.level(-20)
    meter.measure(77)
    const fill = meter.find(PEAK)
    const hold = meter.find('.lm-meter__hold')
    setScale(1.5)
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(animations.every((one) => one.cancelled)).toBe(true)
    expect(fill.closest<HTMLElement>('.lm-meter__window')?.dataset.moved).toBeUndefined()
    expect(percent(fill.style.clipPath)).toBeCloseTo(100 - at(-20), 4)
    expect(percent(hold.style.bottom)).toBeCloseTo(at(-20), 4)
    meter.level(-10)
    expect(percent(fill.style.clipPath)).toBeCloseTo(100 - at(-10), 4)
    // And is moved again on a screen where it is one.
    setScale(1)
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(fill.style.clipPath).toBe('none')
  })

  it('changes the look and the way it stands with nothing of the old one left', () => {
    const meter = mount({ look: 'segments', bars: ['peak'] })
    meter.level(-20)
    meter.measure(80)
    meter.rerender(<Meter bars={['peak']} orientation="horizontal" />)
    const fill = meter.find(PEAK)
    expect(fill.style.clipPath).toBe('')
    meter.measure(80)
    expect(fill.style.width).toBe('100%')
    expect(meter.of(fill)).toHaveLength(1)
    expect(meter.of(fill.parentElement)).toHaveLength(0)
  })

  it('lets go of everything when it is taken off the page', () => {
    const meter = mount({ look: 'segments' })
    meter.level(-20)
    meter.measure(80)
    expect(animations.some((one) => !one.cancelled)).toBe(true)
    meter.unmount()
    expect(animations.every((one) => one.cancelled)).toBe(true)
    expect(observers.every((one) => one.gone)).toBe(true)
  })

  it('moves nothing of a meter with a reading of its own', () => {
    const reading = {
      peak: 0.1,
      rms: 0.05,
      peakDb: -20,
      hasLufs: false,
      lufsShortTerm: -Infinity,
      truePeakDb: -Infinity,
    }
    render(<Meter look="segments" reading={reading as never} />)
    expect(animations).toHaveLength(0)
  })
})
