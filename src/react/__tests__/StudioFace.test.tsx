// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { type Device } from '../../core/devices/Device'
import { ground, INK } from '../components/display-kit'
import { DevicePlate } from '../components/DevicePlate'
import { type DeviceSkin } from '../components/device-skins'
import { HOSTED_PLATES, PLATE_PALETTES } from '../components/plate-palettes'
import { PlateLookProvider } from '../components/StudioFace'
import {
  STUDIO_FRAGMENT_SHADER,
  STUDIO_KNOBS_MOST,
  STUDIO_MARK_KEY,
  contrast,
  forgetStudioRig,
  luminance,
  parseCssColour,
  studioKnobTop,
  studioMarkSeen,
  studioPalette,
  studioSeen,
  type Rgb,
} from '../components/studio-face'
import { createTestEngine, type TestEngine } from './harness'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  forgetStudioRig()
  document.head.querySelectorAll('style[data-test]').forEach((style) => style.remove())
})

const hex = (text: string): Rgb => {
  const n = parseInt(text.slice(1), 16)
  return [n >> 16, (n >> 8) & 255, n & 255]
}

async function make(fixture: TestEngine, id = 'filter'): Promise<Device> {
  return fixture.engine.devices.create(id, fixture.engine.context)
}

const SKIN: DeviceSkin = {
  plate: '#23566b',
  ink: '#e6f1ee',
  accent: '#8fe0d0',
  finish: 'grain',
  cap: 'pointer',
}

describe('studio colours', () => {
  const plates = [
    ...Object.entries(PLATE_PALETTES),
    ...HOSTED_PLATES.map((palette, index) => [`hosted ${index}`, palette] as const),
  ]

  it('keeps the lettering, the legend and the screen readable on every plate the kit has', () => {
    expect(plates.length).toBeGreaterThan(100)
    for (const [id, skin] of plates) {
      const palette = studioPalette(hex(skin.plate), hex(skin.ink), hex(skin.accent))
      expect(contrast(palette.word, palette.paint), `${id} words on its paint`).toBeGreaterThan(5)
      expect(contrast(palette.legend, palette.key), `${id} legend on its cap`).toBeGreaterThan(7)
      expect(contrast(palette.screenInk, palette.glass), `${id} screen`).toBeGreaterThan(4.5)
      // The face under the lettering is held to a range the lettering reads on, at 4.5 to 1 or better.
      const word = luminance(palette.word)
      const [dark, light] = palette.range
      if (palette.light) expect((word + 0.05) / (light + 0.05), id).toBeGreaterThan(4.5)
      else expect((dark + 0.05) / (word + 0.05), id).toBeGreaterThan(4.5)
    }
  })

  it('leaves a plate its own colour: the paint gives way only as far as the lettering needs', () => {
    for (const [id, skin] of plates) {
      const palette = studioPalette(hex(skin.plate), hex(skin.ink), hex(skin.accent))
      expect(
        contrast(palette.paint, hex(skin.plate)),
        `${id} paint against its plate`,
      ).toBeLessThan(1.5)
      // A plate whose ink already reads is painted in exactly its colour.
      if (contrast(hex(skin.ink), hex(skin.plate)) > 5.2) {
        expect(palette.paint, id).toEqual(hex(skin.plate))
      }
    }
  })

  it("keeps a knob's indicator at 3 to 1 on the metal beside it, out of the lamp's fan and in the middle of it", () => {
    const light = (of: readonly number[]): number =>
      0.2126 * of[0] + 0.7152 * of[1] + 0.0722 * of[2]
    for (const [id, skin] of plates) {
      const palette = studioPalette(hex(skin.plate), hex(skin.ink), hex(skin.accent))
      const [least, most] = palette.bed
      expect(least, `${id} bed`).toBeLessThanOrEqual(most)
      // The paint under the least and the most of the lamp's plain light a plate has.
      const marks = STUDIO_MARK_KEY.map((key) => luminance(studioMarkSeen(palette.mark, key)))
      // The top with none of the fan on it, all of it, and every step between; its rings a little
      // lighter and darker; the wall of a ring cut into it facing the lamp and facing away.
      for (let fan = 0; fan <= 1.001; fan += 0.05) {
        for (const rings of [0.94, 1.06]) {
          for (const wall of [0.4, 1, 1.6]) {
            const metal = studioKnobTop(palette.knob, fan).map((v) => v * rings * wall)
            const given = Math.max(light(metal), 0.0001)
            // What the shader does beside the indicator: the metal's light is held inside the bed's.
            const held = Math.min(Math.max(given, least), most) / given
            const seen = luminance(studioSeen(metal.map((v) => v * held)))
            for (const mark of marks) {
              const [high, low] = mark > seen ? [mark, seen] : [seen, mark]
              expect(
                (high + 0.05) / (low + 0.05),
                `${id} indicator on its top, fan ${fan.toFixed(2)}`,
              ).toBeGreaterThanOrEqual(3)
            }
          }
        }
      }
    }
  })

  it('holds the metal beside the indicator in the shader, by what the colours say', () => {
    expect(STUDIO_FRAGMENT_SHADER).toContain('clamp(kl, uBed.x, uBed.y)')
    // Out of the fan a top is left as it is: the bed does nothing a still knob would show.
    for (const [id, skin] of plates) {
      const palette = studioPalette(hex(skin.plate), hex(skin.ink), hex(skin.accent))
      const rest = studioKnobTop(palette.knob, 0)
      const given = 0.2126 * rest[0] + 0.7152 * rest[1] + 0.0722 * rest[2]
      expect(given, `${id} top at rest, over the bed's least`).toBeGreaterThanOrEqual(
        palette.bed[0],
      )
      expect(given, `${id} top at rest, under the bed's most`).toBeLessThanOrEqual(palette.bed[1])
    }
  })

  it('reads the colours a browser computes, and not a see-through one', () => {
    expect(parseCssColour('rgb(35, 86, 107)')).toEqual([35, 86, 107])
    expect(parseCssColour('rgba(35, 86, 107, 0.8)')).toEqual([35, 86, 107])
    expect(parseCssColour('rgb(35 86 107 / 80%)')).toEqual([35, 86, 107])
    expect(parseCssColour('color(srgb 1 0.5 0)')).toEqual([255, 127.5, 0])
    expect(parseCssColour('rgba(0, 0, 0, 0)')).toBeNull()
    expect(parseCssColour('transparent')).toBeNull()
    expect(parseCssColour('oklch(0.7 0.1 200)')).toBeNull()
  })

  it('has room in its shader for as many knobs as it says', () => {
    expect(STUDIO_FRAGMENT_SHADER).toContain(`uniform vec4 uK[${STUDIO_KNOBS_MOST}];`)
    expect(STUDIO_FRAGMENT_SHADER).toContain(`k < ${STUDIO_KNOBS_MOST};`)
  })
})

describe('a display on a ground it is given', () => {
  it('lays its own ground unless it is told how much of it to lay', () => {
    const laid: number[] = []
    const ctx = {
      set globalAlpha(alpha: number) {
        laid.push(alpha)
      },
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D
    const colours = { plate: '#000', ink: '#fff', accent: '#f00' }
    const box = ground({ ctx, colours, width: 184, height: 48 })
    expect(laid).toEqual([INK.hush, INK.ground, INK.rule, 1])
    expect(ctx.fillRect).toHaveBeenCalledTimes(2)

    // On glass of its own it lays nothing, and draws in the same box.
    laid.length = 0
    expect(ground({ ctx, colours: { ...colours, ground: 0 }, width: 184, height: 48 })).toEqual(box)
    expect(laid).toEqual([])
    expect(ctx.fillRect).toHaveBeenCalledTimes(2)
    expect(ctx.strokeRect).toHaveBeenCalledTimes(1)
  })
})

/** A WebGL context and a 2D one that take every call and do nothing, and a page that lays plates out. */
function stubStudio(): { drawn: () => number; sent: (name: string) => number[] | undefined } {
  let drawn = 0
  const sent = new Map<string, number[]>()
  const anything = (answers: Record<string, unknown>): unknown =>
    new Proxy(answers, {
      get: (kept, name: string) => (name in kept ? kept[name] : (kept[name] = vi.fn(() => ({})))),
      set: () => true,
    })
  const gl = anything({
    getShaderParameter: () => true,
    getProgramParameter: () => true,
    getAttribLocation: () => 0,
    // A uniform is known here by its name, and what was last sent to it is kept.
    getUniformLocation: (_program: unknown, name: string) => name,
    uniform4fv: (name: string, values: ArrayLike<number>) => {
      sent.set(name, [...Array.from(values)])
    },
    drawArrays: () => {
      drawn++
    },
  })
  const flat = anything({})
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((kind: string) =>
    kind === 'webgl' ? gl : flat) as never)
  // jsdom lays nothing out: every plate is 220 by 300 and every part of one 30 by 30.
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(220)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(300)
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const plate = this.classList.contains('lm-plate')
    return new DOMRect(plate ? 0 : 40, plate ? 0 : 60, plate ? 220 : 30, plate ? 300 : 30)
  })
  // The stylesheet is not loaded here: the three properties the photograph reads the skin from.
  const style = document.createElement('style')
  style.dataset.test = 'studio'
  style.textContent =
    '.lm-plate__studio { color: rgb(230, 241, 238); outline-color: rgb(143, 224, 208); text-decoration-color: rgb(35, 86, 107); }'
  document.head.append(style)
  return { drawn: () => drawn, sent: (name) => sent.get(name) }
}

describe('the studio look on a plate', () => {
  let fixture: TestEngine
  beforeEach(() => {
    fixture = createTestEngine()
  })

  it('is the flat plate where it is not asked for, on the server, and where there is no WebGL', async () => {
    const device = await make(fixture)
    const plate = <DevicePlate device={device} skin={SKIN} upright data-testid="plate" />
    const Wrapper = fixture.wrapper
    const flat = renderToStaticMarkup(<Wrapper>{plate}</Wrapper>)
    expect(flat).not.toContain('lm-plate__studio')
    // Asked for on the server: what is sent is the flat plate, whatever the browser can do.
    stubStudio()
    expect(
      renderToStaticMarkup(
        <Wrapper>
          <PlateLookProvider look="studio">{plate}</PlateLookProvider>
        </Wrapper>,
      ),
    ).toBe(flat)
    vi.restoreAllMocks()
    forgetStudioRig()

    // Asked for in a browser without WebGL (jsdom has none).
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    render(<PlateLookProvider look="studio">{plate}</PlateLookProvider>, {
      wrapper: fixture.wrapper,
    })
    const shown = screen.getByTestId('plate')
    expect(shown.querySelector('.lm-plate__studio')).toBeNull()
    expect(shown).not.toHaveAttribute('data-lm-look')
    expect(shown.querySelector('.lm-plate__finish')).not.toBeNull()
  })

  it('lies under the same plate: its size, its knobs, its cells and its lamp are what they were', async () => {
    const device = await make(fixture)
    const flat = render(<DevicePlate device={device} skin={SKIN} upright data-testid="plate" />, {
      wrapper: fixture.wrapper,
    })
    const parts = (): string[] =>
      [...screen.getByTestId('plate').querySelectorAll('[data-testid], [role=slider], button')].map(
        (part) =>
          [
            part.tagName,
            part.getAttribute('data-testid'),
            part.getAttribute('aria-label'),
            part.getAttribute('aria-valuenow'),
            part.getAttribute('data-lm-info-title'),
          ].join(' '),
      )
    const before = parts()
    const size = screen.getByTestId('plate').style.cssText
    flat.unmount()

    const studio = stubStudio()
    render(<DevicePlate device={device} skin={SKIN} upright look="studio" data-testid="plate" />, {
      wrapper: fixture.wrapper,
    })
    const plate = screen.getByTestId('plate')
    expect(plate).toHaveAttribute('data-lm-look', 'studio')
    expect(plate.firstElementChild).toHaveClass('lm-plate__studio')
    expect(plate.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    expect(studio.drawn()).toBeGreaterThan(0)
    expect(parts()).toEqual(before)
    // The photograph hands the stylesheet the colours it was taken in, beside the skin's own.
    expect(plate.style.getPropertyValue('--lm-studio-word')).toMatch(/^rgb\(/)
    expect(plate.style.getPropertyValue('--lm-studio-glass')).toMatch(/^rgb\(/)
    expect(plate.style.getPropertyValue('--lm-plate')).toBe('#23566b')
    const kept = plate.style.cssText.replace(/\s*--lm-studio-[a-z]+:[^;]+;/g, '')
    expect(kept).toBe(size)
  })

  it('is taken again when a knob turns or the lamp goes out, and at no other time', async () => {
    const device = await make(fixture)
    const studio = stubStudio()
    const view = render(
      <DevicePlate device={device} skin={SKIN} upright look="studio" data-testid="plate" />,
      { wrapper: fixture.wrapper },
    )
    const taken = studio.drawn()
    view.rerender(
      <DevicePlate device={device} skin={SKIN} upright look="studio" data-testid="plate" />,
    )
    expect(studio.drawn()).toBe(taken)
    const [name] = device.panelParams ?? Object.keys(device.params)
    act(() => device.setParam(name, device.params[name].max))
    expect(studio.drawn()).toBe(taken + 1)
    act(() => {
      device.bypass = true
    })
    expect(studio.drawn()).toBe(taken + 2)
    expect(screen.getByTestId('plate')).toHaveAttribute('data-lm-look', 'studio')
  })

  it("cuts a pane of glass for a host's preset cell only where the cell says it is one", async () => {
    const device = await make(fixture)
    const studio = stubStudio()
    const view = render(
      <DevicePlate
        device={device}
        skin={SKIN}
        upright
        look="studio"
        presetPicker={<span>Preset</span>}
        data-testid="plate"
      />,
      { wrapper: fixture.wrapper },
    )
    expect(screen.getByTestId('plate')).toHaveAttribute('data-lm-look', 'studio')
    // A bare word stands on the paint: the pane is put where nothing is drawn.
    expect(studio.sent('uPreset')?.[0]).toBeLessThan(-1000)
    view.unmount()

    render(
      <DevicePlate
        device={device}
        skin={SKIN}
        upright
        look="studio"
        presetPicker={<span data-lm-pane="">Preset</span>}
        data-testid="plate"
      />,
      { wrapper: fixture.wrapper },
    )
    // Every part is 30 by 30 at 40, 60 on this page: the pane is cut under the cell.
    expect(studio.sent('uPreset')).toEqual([40, 60, 30, 30])
  })

  it('leaves a plate flat that asks to be, under a provider that asks for the studio look', async () => {
    const device = await make(fixture)
    stubStudio()
    render(
      <PlateLookProvider look="studio">
        <DevicePlate device={device} skin={SKIN} upright look="flat" data-testid="plate" />
      </PlateLookProvider>,
      { wrapper: fixture.wrapper },
    )
    const plate = screen.getByTestId('plate')
    expect(plate).not.toHaveAttribute('data-lm-look')
    expect(plate.querySelector('.lm-plate__studio')).toBeNull()
  })

  it('gives the plate back flat when the look is taken away', async () => {
    const device = await make(fixture)
    stubStudio()
    const view = render(
      <PlateLookProvider look="studio">
        <DevicePlate device={device} skin={SKIN} upright data-testid="plate" />
      </PlateLookProvider>,
      { wrapper: fixture.wrapper },
    )
    expect(screen.getByTestId('plate')).toHaveAttribute('data-lm-look', 'studio')
    view.rerender(
      <PlateLookProvider look="flat">
        <DevicePlate device={device} skin={SKIN} upright data-testid="plate" />
      </PlateLookProvider>,
    )
    const plate = screen.getByTestId('plate')
    expect(plate).not.toHaveAttribute('data-lm-look')
    expect(plate.querySelector('.lm-plate__studio')).toBeNull()
    expect(plate.style.getPropertyValue('--lm-studio-word')).toBe('')
  })
})
