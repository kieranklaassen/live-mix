// The one WebGL context every visual on a page is drawn with.
//
// A style is drawn here at the size asked and then copied to the 2D canvas that wants it, so a page never holds
// more than one context for its visuals however many screens show them. A style's shader is fetched and made the
// first time it is asked for, one new shader a frame, so a list of forty does not freeze the page as it opens; a
// style that cannot be made is given up on alone, and the others still draw.
//
// Browser only.

import { KIND_SLOTS, MAP_H, MAP_W, SPECTRUM_BANDS, type VisualSignals } from './frame'
import { have } from './have'
import type { VisualPalette } from './palettes'
import {
  SHADER_COMMON as common,
  SHADER_FOOTER as footer,
  SHADER_SOURCES as sources,
} from './shader-sources'

/** Where a drawn visual lies on the rig's canvas, for `drawImage`. */
export interface DrawnAt {
  x: number
  y: number
  w: number
  h: number
}

/** What one style is drawn with, beside the signals. */
export interface StyleDraw {
  id: string
  variation: 0 | 1
  size: number
  glow: number
  hue: number
  palette: VisualPalette
}

export interface VisualRig {
  readonly canvas: HTMLCanvasElement
  /** Hands over the picture of the piece for this frame, and lets one more shader be made. Once a frame, before any draw. */
  hear(signals: VisualSignals): void
  /**
   * Draws one style `width` by `height` pixels. Says where, for `drawImage`; null where this style cannot be drawn
   * here; undefined while its shader is still being made, when it is asked for again next frame.
   */
  draw(
    style: StyleDraw,
    width: number,
    height: number,
    signals: VisualSignals,
  ): DrawnAt | null | undefined
}

/** How long a style whose shader could not be fetched is left alone before it is asked for again. */
const FETCH_AGAIN_MS = 5000

const VERTEX =
  '#version 300 es\nvoid main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }'

/** A shader of this page: made, being made, or given up on (null). */
type Made = {
  program: WebGLProgram
  at: Record<string, WebGLUniformLocation | null>
  done: boolean
} | null

function buildRig(): VisualRig | false {
  if (typeof document === 'undefined') return false
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 360
  let gl: WebGL2RenderingContext | null = null
  try {
    gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    })
  } catch {
    gl = null
  }
  if (!gl) return false
  const context = gl
  const parallel = context.getExtension('KHR_parallel_shader_compile') as {
    COMPLETION_STATUS_KHR: number
  } | null
  let map: WebGLTexture | null = null
  let programs = new Map<string, Made>()
  // A style's text: undefined while it is being fetched, null where there is none.
  const texts = new Map<string, string | null | undefined>()
  let lost = false
  let toMake = 1

  function start() {
    programs = new Map()
    map = context.createTexture()
    context.bindTexture(context.TEXTURE_2D, map)
    context.texImage2D(
      context.TEXTURE_2D,
      0,
      context.RGBA,
      MAP_W,
      MAP_H,
      0,
      context.RGBA,
      context.UNSIGNED_BYTE,
      null,
    )
    for (const [name, value] of [
      [context.TEXTURE_MIN_FILTER, context.LINEAR],
      [context.TEXTURE_MAG_FILTER, context.LINEAR],
      [context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE],
      [context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE],
    ]) {
      context.texParameteri(context.TEXTURE_2D, name, value)
    }
  }
  start()
  // A phone takes the context away when the page is put aside; everything is made again when it comes back.
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault()
    lost = true
    tell()
  })
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false
    start()
    tell()
  })

  function textOf(id: string): string | null | undefined {
    if (texts.has(id)) return texts.get(id)
    const load = Object.hasOwn(sources, id) ? sources[id] : undefined
    if (!load) {
      texts.set(id, null)
      return null
    }
    texts.set(id, undefined)
    load().then(
      (text) => texts.set(id, text),
      () => {
        // Not fetched, as on a line that dropped for a moment: given up on for now and asked for again in a while.
        texts.set(id, null)
        programs.set(id, null)
        setTimeout(() => {
          texts.delete(id)
          if (programs.get(id) === null) programs.delete(id)
        }, FETCH_AGAIN_MS)
      },
    )
    return undefined
  }

  function shader(type: number, text: string): WebGLShader {
    const made = have(context.createShader(type), 'shader')
    context.shaderSource(made, text)
    context.compileShader(made)
    return made
  }

  function programOf(id: string): Made | undefined {
    const known = programs.get(id)
    if (known !== undefined) {
      if (known === null || known.done) return known
      // Being made: where the browser can say so, it is not waited for.
      if (parallel && !context.getProgramParameter(known.program, parallel.COMPLETION_STATUS_KHR))
        return undefined
      if (!context.getProgramParameter(known.program, context.LINK_STATUS)) {
        // The program only says that a shader was not compiled; what is wrong, and on which line, is in the shader's log.
        const logs = [context.getProgramInfoLog(known.program)]
        for (const part of context.getAttachedShaders(known.program) ?? [])
          logs.push(context.getShaderInfoLog(part))
        const said = logs
          .map((log) => (log ?? '').replace(/\0/g, '').trim())
          .filter((log) => log !== '')
        console.warn(`The visual ${id} could not be made:`, said.join('\n'))
        programs.set(id, null)
        return null
      }
      for (
        let index = 0,
          count = context.getProgramParameter(known.program, context.ACTIVE_UNIFORMS) as number;
        index < count;
        index++
      ) {
        const name = have(context.getActiveUniform(known.program, index), 'uniform').name.replace(
          '[0]',
          '',
        )
        known.at[name] = context.getUniformLocation(known.program, name)
      }
      known.done = true
      return known
    }
    const text = textOf(id)
    if (text === null) {
      programs.set(id, null)
      return null
    }
    if (text === undefined || toMake < 1) return undefined
    toMake--
    const program = context.createProgram()
    context.attachShader(program, shader(context.VERTEX_SHADER, VERTEX))
    context.attachShader(program, shader(context.FRAGMENT_SHADER, common + text + footer))
    context.linkProgram(program)
    programs.set(id, { program, at: {}, done: false })
    return parallel ? undefined : programOf(id)
  }

  return {
    canvas,
    hear(signals) {
      toMake = 1
      if (lost) return
      context.bindTexture(context.TEXTURE_2D, map)
      context.texSubImage2D(
        context.TEXTURE_2D,
        0,
        0,
        0,
        MAP_W,
        MAP_H,
        context.RGBA,
        context.UNSIGNED_BYTE,
        signals.map,
      )
    },
    draw(style, width, height, signals) {
      if (lost) return null
      const made = programOf(style.id)
      if (!made) return made
      if (canvas.width < width || canvas.height < height) {
        canvas.width = Math.max(canvas.width, width)
        canvas.height = Math.max(canvas.height, height)
      }
      const { at } = made
      const one = (name: string, value: number) => {
        if (at[name]) context.uniform1f(at[name], value)
      }
      context.viewport(0, 0, width, height)
      context.useProgram(made.program)
      one('uTime', signals.time)
      one('uLoop', signals.place)
      one('uTravel', signals.travel)
      one('uLevel', signals.mix)
      one('uLow', signals.low)
      one('uMid', signals.mid)
      one('uHigh', signals.high)
      one('uDrone', signals.drone)
      one('uPad', signals.pad)
      one('uTexture', signals.texture)
      one('uPhrase', signals.melodic)
      one('uHits', signals.hits)
      one('uCue', signals.cue)
      one('uKeys', signals.keys)
      one('uMic', signals.input)
      one('uEnergy', style.glow)
      one('uSpace', signals.space)
      one('uTone', signals.tone)
      one('uSize', style.size)
      one('uHue', style.hue)
      one('uVar', style.variation)
      one('uCalm', style.palette.calm)
      one('uPull', style.palette.pull)
      one('uArcMid', style.palette.arcMid)
      one('uArcWide', style.palette.arcWide)
      if (at.uRes) context.uniform2f(at.uRes, width, height)
      if (at.uBands) context.uniform1fv(at.uBands, signals.bands, 0, SPECTRUM_BANDS)
      if (at.uKind) context.uniform3fv(at.uKind, signals.kindColours, 0, KIND_SLOTS.length * 3)
      if (at.uMap) {
        context.activeTexture(context.TEXTURE0)
        context.bindTexture(context.TEXTURE_2D, map)
        context.uniform1i(at.uMap, 0)
      }
      context.drawArrays(context.TRIANGLES, 0, 3)
      return { x: 0, y: canvas.height - height, w: width, h: height }
    },
  }
}

// null: not asked yet. false: this browser cannot draw the visuals.
let rig: VisualRig | false | null = null
const watchers = new Set<() => void>()
const tell = () => {
  for (const watcher of watchers) watcher()
}

/** The page's rig; null where the browser has no WebGL 2. It is made the first time it is asked for. */
export function visualRig(): VisualRig | null {
  if (rig === null) {
    rig = buildRig()
    // Whoever only asked whether it may be drawn hears that it cannot.
    if (rig === false) tell()
  }
  return rig === false ? null : rig
}

/**
 * Whether the visuals can be drawn here as far as is known, without making the rig: a browser with no WebGL 2 says
 * no at once, and one that has it says yes until a picture is first shown and the context turns out not to be had.
 */
export function visualsMayDraw(): boolean {
  if (rig === null) return typeof WebGL2RenderingContext !== 'undefined'
  return rig !== false
}

/** Whether this browser can draw the visuals. Asking makes the rig. */
export function visualsReady(): boolean {
  return visualRig() !== null
}

/** Told when the context is lost or comes back, and when it turns out there is none to be had. */
export function watchVisuals(watcher: () => void): () => void {
  watchers.add(watcher)
  return () => watchers.delete(watcher)
}

/** What a screen says where the visuals cannot be drawn. */
export const VISUALS_NOT_DRAWN_NOTE =
  'This browser has no WebGL 2, so the visuals cannot be drawn here.'
