// The studio look of a device plate: the plate as a product photograph. Seen
// from exactly above, so it stands flat in a chain like any plate, and all the
// depth is in the light: one large soft lamp from the upper left, shadows as
// long as each part is high, knobs of turned aluminium anodised in the plate's
// own colour, satin paint, a display under glass, a lamp in a bright bezel.
//
// One fragment shader works every pixel out from distances (no ray march), in
// one WebGL context shared by every plate on the page: a plate is drawn into
// the shared canvas and copied to its own. It is drawn again only when
// something on it changes (a knob, the lamp, its size), never on frames.
// Words, the display and everything a hand works stay what `DevicePlate`
// makes them; this draws what is under them. Nothing here imports React.
//
// The look is the kit's own: it copies no maker's box, knob or lettering.

import { type KnobCap } from './Knob'

/** A colour as three numbers, 0..255, in sRGB. */
export type Rgb = readonly [number, number, number]

/** A box on the plate in CSS px from its top left corner. */
export interface FaceBox {
  x: number
  y: number
  w: number
  h: number
}

/** One knob: where its middle is, how large it is across, and where it points (radians, 0 is up, clockwise). */
export interface FaceKnob {
  x: number
  y: number
  size: number
  angle: number
}

/** What is on a plate, as the shader needs it: sizes in CSS px. */
export interface FaceScene {
  width: number
  height: number
  cap: Exclude<KnobCap, 'arc'>
  knobs: readonly FaceKnob[]
  /** The display's window; null for a plate without one. */
  display: FaceBox | null
  /** The preset cell's window; null without one. */
  preset: FaceBox | null
  /** The cells that open the rest of the knobs or a plug-in's own window: low caps on the box. */
  keys: readonly FaceBox[]
  /** The middle of the lamp; null for a plate without a power switch. */
  lamp: { x: number; y: number } | null
  powered: boolean
  /** How many times its own size a host shows the plate (a CSS zoom): the picture has the pixels for it. Absent means once. */
  shown?: number
}

/** The most knobs one plate is photographed with; a plate with more keeps the flat look. */
export const STUDIO_KNOBS_MOST = 64
const KEYS_MOST = 2
/** How round the box's corners are, in px. */
export const STUDIO_CORNER = 10

// --- Colour ---

const clamp = (value: number, low = 0, high = 1): number =>
  value < low ? low : value > high ? high : value
const WHITE: Rgb = [255, 255, 255]
const BLACK: Rgb = [0, 0, 0]

/** `a` mixed toward `b` by `t` (0..1), in sRGB. */
export const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]
/** `colour` toward white (`by` above 0) or toward black (below). */
const tone = (colour: Rgb, by: number): Rgb =>
  mixRgb(colour, by > 0 ? WHITE : BLACK, Math.min(1, Math.abs(by)))

/** Relative luminance, 0..1. */
export function luminance(colour: Rgb): number {
  const [r, g, b] = colour.map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** How strongly one colour stands against another: 1 (the same) to 21 (black on white). */
export function contrast(a: Rgb, b: Rgb): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (high + 0.05) / (low + 0.05)
}

/** A colour as the shader wants it: linear light, 0..1. */
const linear = (colour: Rgb): [number, number, number] => [
  Math.pow(clamp(colour[0] / 255), 2.2),
  Math.pow(clamp(colour[1] / 255), 2.2),
  Math.pow(clamp(colour[2] / 255), 2.2),
]

/**
 * What the photograph makes of linear light: the shader's own roll-off into
 * white, its gamma and its slight S, as the colour that reaches the screen.
 */
export function studioSeen(light: readonly number[]): Rgb {
  const seen = (v: number): number => {
    const rolled = Math.min(v, 0.8) + 0.2 * (1 - Math.exp(-Math.max(v - 0.8, 0) / 0.2))
    const g = Math.pow(clamp(rolled), 1 / 2.2)
    return 255 * (g + 0.14 * (g * g * (3 - 2 * g) - g))
  }
  return [seen(light[0]), seen(light[1]), seen(light[2])]
}

/**
 * The turned top of a knob, in linear light, where it shows `fan` of the lamp
 * (0 none of it, 1 the middle of the fan): the shader's own sum.
 */
export const studioKnobTop = (knob: readonly number[], fan: number): [number, number, number] => [
  knob[0] * (0.25 + 1.5 * fan) + 0.18 * fan * fan,
  knob[1] * (0.25 + 1.5 * fan) + 0.18 * fan * fan,
  knob[2] * (0.25 + 1.5 * fan) + 0.18 * fan * fan,
]

/** An indicator's paint as it is photographed under `key` of the lamp's plain light. */
export const studioMarkSeen = (mark: readonly number[], key: number): Rgb =>
  studioSeen([mark[0], mark[1], mark[2]].map((v) => v * (0.3 + 0.7 * key)))

/** A colour as CSS writes it. */
export const cssRgb = (colour: Rgb): string =>
  `rgb(${colour.map((v) => Math.round(clamp(v, 0, 255))).join(' ')})`

/**
 * A computed CSS colour as three numbers: `rgb(1, 2, 3)`, `rgba(1 2 3 / 0.5)`
 * and `color(srgb 0.1 0.2 0.3)` are what a browser computes a colour to.
 * Null for anything else, and for a colour that is see-through.
 */
export function parseCssColour(text: string): Rgb | null {
  const numbers = (text.match(/-?\d*\.?\d+(?:e-?\d+)?%?/g) ?? []).map((part) =>
    part.endsWith('%') ? parseFloat(part) / 100 : parseFloat(part),
  )
  if (numbers.length < 3 || numbers.some((n) => !Number.isFinite(n))) return null
  if (numbers.length > 3 && numbers[3] < 0.5) return null
  if (/^rgba?\(/.test(text)) return [numbers[0], numbers[1], numbers[2]]
  if (text.startsWith('color(srgb ')) return [numbers[0] * 255, numbers[1] * 255, numbers[2] * 255]
  return null
}

const read = new Map<string, Rgb | null>()

/**
 * Any colour a browser computed, as three numbers: the two forms above read
 * from the text, and anything else (a colour in another space) painted on one
 * pixel and read back. Null where neither can be done.
 */
export function readCssColour(text: string): Rgb | null {
  const known = read.get(text)
  if (known !== undefined) return known
  let colour = parseCssColour(text)
  if (!colour && text && !/^rgba?\(|^color\(srgb |^transparent$/.test(text)) {
    try {
      const pixel = document.createElement('canvas')
      pixel.width = pixel.height = 1
      const ctx = pixel.getContext('2d', { willReadFrequently: true })
      if (ctx) {
        ctx.fillStyle = text
        ctx.fillRect(0, 0, 1, 1)
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
        if (a > 127) colour = [r, g, b]
      }
    } catch {
      // No canvas here: the colour stays unread.
    }
  }
  if (read.size > 400) read.clear()
  read.set(text, colour)
  return colour
}

/** The least the lettering stands against the paint and the screen under it. */
const WORD_CONTRAST = 5.1
const SCREEN_CONTRAST = 4.8

/** The least an indicator's paint stands against the metal right beside it. */
const MARK_CONTRAST = 3.2
/**
 * The lamp's plain light on an indicator at its least (the far corner of a
 * wide plate) and its most (the corner under the lamp).
 */
export const STUDIO_MARK_KEY: readonly [number, number] = [0.65, 1.3]
/** How much of the lamp's fan the metal is worked out under. */
const FANS = [0, 0.25, 0.5, 0.75, 1]
const lightOf = (light: readonly number[]): number =>
  0.2126 * light[0] + 0.7152 * light[1] + 0.0722 * light[2]

/**
 * How much light the metal beside an indicator may give for the paint to
 * read on it: at most (`pale` paint) or at least (dark paint), in linear
 * light. The metal is the knob's colour under any of the lamp's fan.
 */
function markBed(knob: readonly number[], mark: readonly number[], pale: boolean): number {
  const seen = luminance(studioMarkSeen(mark, STUDIO_MARK_KEY[pale ? 0 : 1]))
  const wanted = pale ? (seen + 0.05) / MARK_CONTRAST - 0.05 : MARK_CONTRAST * (seen + 0.05) - 0.05
  let bed = pale ? 9 : 0
  for (const fan of FANS) {
    const top = studioKnobTop(knob, fan)
    const light = Math.max(lightOf(top), 0.0001)
    // The metal at `given` light, as it is seen. It only grows with the light, so the edge is found by halving.
    const at = (given: number): number => luminance(studioSeen(top.map((v) => (v * given) / light)))
    let low = 0
    let high = 4
    for (let k = 0; k < 24; k++) {
      const middle = (low + high) / 2
      if (at(middle) < wanted) low = middle
      else high = middle
    }
    bed = pale ? Math.min(bed, low) : Math.max(bed, high)
  }
  return bed
}

/** The colours one plate is photographed in, all from the skin's own three. */
export interface StudioPalette {
  /** The paint: the plate's colour, moved only as far as its lettering needs. */
  paint: Rgb
  /** The lettering printed on the paint. */
  word: Rgb
  /** Whether the lettering is lighter than the paint. */
  light: boolean
  /** How dark and how light the open face may be under the lettering, in linear light. */
  range: readonly [number, number]
  /** The lamp's light, at full strength, in linear light. */
  lamp: readonly [number, number, number]
  /** The cap of a cell that opens something, and the legend on it. */
  key: Rgb
  legend: Rgb
  /** The screen under the glass: its ground, what it writes in, and its second ink. */
  glass: Rgb
  screenInk: Rgb
  screenMark: Rgb
  /** The knobs' metal as it mirrors the light, and the paint of their indicator, in linear light. */
  knob: readonly [number, number, number]
  mark: readonly [number, number, number]
  /**
   * The least and the most light the metal right beside an indicator gives,
   * in linear light. A pale indicator is cut into a bed that stays dark where
   * the lamp's fan crosses the top; a dark one into a bed that stays pale.
   */
  bed: readonly [number, number]
}

/**
 * A plate's studio colours from its skin's three. The lettering is the ink,
 * pushed toward white or black until it reads on the paint; where that is not
 * enough the paint gives way a little. The screen is the plate's own colour in
 * shade, the knobs are anodised in it a little lighter, and the lamp burns in
 * the accent's hue.
 */
export function studioPalette(plate: Rgb, ink: Rgb, accent: Rgb): StudioPalette {
  const light = luminance(ink) > luminance(plate)
  let word = ink
  let paint = plate
  for (let k = 0; k < 12 && contrast(word, paint) < WORD_CONTRAST; k++) {
    word = mixRgb(word, light ? WHITE : BLACK, 0.2)
  }
  for (let k = 0; k < 30 && contrast(word, paint) < WORD_CONTRAST; k++) {
    paint = mixRgb(paint, light ? BLACK : WHITE, 0.02)
  }
  // How light and how dark the open face may be for the lettering to read at 4.5 to 1, kept a little over.
  const wordLight = luminance(word)
  const range: readonly [number, number] = light
    ? [0, (wordLight + 0.05) / 4.9 - 0.05]
    : [4.8 * (wordLight + 0.05) - 0.05, 9]

  const lit = linear(accent)
  const top = Math.max(...lit, 0.001)
  const lamp: [number, number, number] = [lit[0] / top, lit[1] / top, lit[2] / top]

  const key = light ? tone(ink, -0.04) : tone(ink, 0.1)
  let legend = paint
  for (let k = 0; k < 30 && contrast(legend, key) < 7.5; k++) {
    legend = mixRgb(legend, light ? BLACK : WHITE, 0.06)
  }

  // The screen: the plate's colour in shade. Its faintest words are drawn at 0.8 of the ink and must
  // read where the screen is at its worst for them: under the lamp's reflection for pale ink, in the
  // far corner's falling light for dark ink.
  let glass = tone(plate, luminance(plate) > 0.45 ? -0.12 : -0.3)
  const inkLight = Math.pow(luminance(ink), 1 / 2.2)
  const reads = (colour: Rgb): number => {
    const ground = light ? luminance(colour) * 1.25 + 0.055 : luminance(colour) * 1.02
    const thin = Math.pow(0.8 * inkLight + 0.2 * Math.pow(ground, 1 / 2.2), 2.2)
    return (Math.max(thin, ground) + 0.05) / (Math.min(thin, ground) + 0.05)
  }
  for (let k = 0; k < 40 && reads(glass) < SCREEN_CONTRAST; k++) {
    glass = mixRgb(glass, light ? BLACK : WHITE, 0.04)
  }
  const screenMark = contrast(accent, glass) >= 2.6 ? accent : tone(ink, light ? 0.6 : -0.6)

  // The knobs: lighter than the paint, as bare anodised metal is, and the more so the darker the plate.
  const deep = 1 + 0.65 * luminance(paint)
  const base = linear(paint).map((v) => Math.pow(v, deep))
  const lum = Math.max(0.2126 * base[0] + 0.7152 * base[1] + 0.0722 * base[2], 0.0001)
  const knob = base.map((v) => (v * (lum * 1.25 + 0.07)) / lum + 0.02) as [number, number, number]
  // The indicator's paint: white on all but the palest plates, where it is the ink, and darker
  // until the top at rest is pale enough for it. The lamp's fan can make a top as white as the
  // paint, so the metal beside the indicator is held where the paint reads on it.
  let mark: [number, number, number] = [1, 1, 1]
  let bed: readonly [number, number] = [0, markBed(knob, mark, true)]
  if (luminance(plate) > 0.62) {
    const rest = lightOf(studioKnobTop(knob, 0)) * 0.94
    let dark = tone(ink, -0.2)
    for (let k = 0; k < 8 && markBed(knob, linear(dark), false) > rest; k++) {
      dark = mixRgb(dark, BLACK, 0.25)
    }
    mark = linear(dark)
    bed = [markBed(knob, mark, false), 99]
  }

  return {
    paint,
    word,
    light,
    range,
    lamp,
    key,
    legend,
    glass,
    screenInk: ink,
    screenMark,
    knob,
    mark,
    bed,
  }
}

// --- The shader, in parts. Measures are CSS px, y down on the plate, z up out of it. ---

const CAP_INDEX: Readonly<Record<Exclude<KnobCap, 'arc'>, number>> = {
  disc: 0,
  dot: 1,
  skirt: 2,
  pointer: 3,
}

const FS_HEAD = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes, uSize;
uniform float uScale;
uniform vec3 uLight;
uniform vec3 uPaint, uKnob, uMark, uGlass, uLamp, uKey, uInk;
uniform vec2 uLum, uLampAt, uBed;
uniform float uCap, uKnobs, uOn;
uniform vec4 uK[${STUDIO_KNOBS_MOST}];
uniform vec4 uKeys[${KEYS_MOST}];
uniform vec4 uWin, uPreset;
const vec2 SOFT = vec2(230.0, 190.0);
// How many pixels a px is, for an edge: the plate's, or a knob's own while one is drawn.
float gAA;
vec3 gEye;
float aa(float d) { return clamp(d * gAA + 0.5, 0.0, 1.0); }
float sdBox(vec2 p, vec2 hs, float r) {
  vec2 q = abs(p) - hs + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
// Which way a rounded box's outline faces at p.
vec2 gradBox(vec2 p, vec2 hs, float r) {
  vec2 q = abs(p) - hs + r;
  vec2 s = vec2(p.x < 0.0 ? -1.0 : 1.0, p.y < 0.0 ? -1.0 : 1.0);
  if (q.x > 0.0 && q.y > 0.0) return s * normalize(q);
  return q.x > q.y ? vec2(s.x, 0.0) : vec2(0.0, s.y);
}
float sdRect(vec2 p, vec4 r, float rad) { return sdBox(p - r.xy - r.zw * 0.5, r.zw * 0.5, rad); }
vec2 gradRect(vec2 p, vec4 r, float rad) { return gradBox(p - r.xy - r.zw * 0.5, r.zw * 0.5, rad); }
float sdHex(vec2 p, float r) {
  const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
  p = abs(p);
  p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
  p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
  return length(p) * sign(p.y);
}
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}
// How steeply a rounded shoulder of radius R falls, x px in from its outline (0 on the flat, steep at the wall).
float shoulder(float x, float R) {
  float u = clamp(1.0 - x / R, 0.0, 0.97);
  return u / sqrt(1.0 - u * u);
}
`

// The room: one softbox up and to the left, a dim ceiling, a dark line at the horizon, a strip of fill opposite.
const FS_LIGHT = `
// Where a mirror at pos facing n sends the eye, and where that meets the softbox's plane (xy from its middle, z how far).
vec3 gR;
vec3 lampPlane(vec3 pos, vec3 n) {
  vec3 v = normalize(gEye - pos);
  gR = reflect(-v, n);
  float t = (uLight.z - pos.z) / max(gR.z, 0.03);
  vec2 q = pos.xy + gR.xy * t - uLight.xy;
  return vec3(q.x * 0.906 - q.y * 0.423, q.x * 0.423 + q.y * 0.906, t);
}
// How much of the softbox that mirror shows; rough spreads it (0 a mirror, 0.4 satin paint).
float softbox(vec3 pos, vec3 n, float rough) {
  vec3 q = lampPlane(pos, n);
  float blur = 5.0 + rough * q.z;
  return smoothstep(blur, -blur, sdBox(q.xy, SOFT, 50.0)) * smoothstep(-0.02, 0.12, gR.z);
}
// A lathe-turned top: fine rings about the axis draw the softbox out along the radius, into two fans.
float turned(vec3 pos, vec2 radial, float wide) {
  vec3 v = normalize(gEye - pos);
  vec2 q = pos.xy - v.xy / v.z * (uLight.z - pos.z) - uLight.xy;
  float across = abs(q.x * radial.y - q.y * radial.x);
  float along = dot(q, radial);
  float fan = exp(-across * across / (wide * wide));
  return fan * (along < 0.0 ? 1.0 : 0.8);
}
// The rest of the room in that mirror, without the softbox: grey, 0..1.
float room(vec3 r, float rough) {
  float w = 0.1 + rough;
  float sky = 0.2 + 0.2 * smoothstep(0.0, 1.0, r.z);
  float line = smoothstep(w, 0.0, abs(r.z - 0.1));
  float fill = smoothstep(0.82 - w, 0.97, dot(r, normalize(vec3(0.62, 0.5, 0.6))));
  return sky * (1.0 - 0.8 * line) + 0.55 * fill;
}
// The lamp's plain light on a matt surface, 1 on the open face at the plate's middle.
float keyLight(vec3 pos, vec3 n) {
  vec3 to = uLight - pos;
  float d = length(to);
  vec3 c = uLight - vec3(uSize * 0.5, 0.0);
  float d0 = length(c);
  float flat0 = (c.z / d0 + 0.3) / 1.3;
  float wrap = clamp((dot(n, to / d) + 0.3) / 1.3, 0.0, 1.0);
  return wrap / flat0 * mix(1.0, d0 * d0 / (d * d), 0.55);
}
// The shadow a post throws on the face: c its foot, R its radius, h its height. It softens with the height that throws it.
float postShadow(vec2 p, vec2 c, float R, float h) {
  vec3 l = normalize(uLight - vec3(c, 0.0));
  vec2 s = -l.xy / l.z * h;
  float len = max(length(s), 0.001);
  vec2 dir = s / len;
  float t = clamp(dot(p - c, dir), 0.0, len);
  float d = length(p - c - dir * t) - R;
  // Past the end of the throw the edge is the top's, at full height; near the foot it is tight.
  float far = max(dot(p - c, dir), 0.0) / len;
  float blur = 0.6 + 0.3 * h * clamp(far, 0.0, 1.0);
  return smoothstep(blur, -blur, d);
}
`

// The kit's four caps as four real knobs, each worked out for a knob 30 px across (a larger one is that, scaled).
// Each answers, for a place q from its axis and the angle it is turned to: kCov how much of the pixel it covers,
// kZ its height there, kG the tilt of its surface (the normal's xy over its z), kTop how much of it is
// lathe-turned top, kInk how much is the indicator's paint, kBed how near that paint is, kSh its own shadow on itself.
const FS_KNOB = `
float kCov, kZ, kTop, kInk, kSh, kCut, kRough, kBed;
vec2 kG, kW;
float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}
// The indicator: a line cut from a to b and filled with paint. kInk the paint, kCut the hair of shade at the cut's edge,
// kBed the bed it is cut into: all of it for a pixel round the paint, gone 3 px out.
void indicator(vec2 q, vec2 a, vec2 b, float w, float on) {
  float sd = sdSeg(q, a, b);
  float ink = aa(w - sd) * on;
  kBed = max(kBed, (1.0 - smoothstep(w + 1.0, w + 3.0, sd)) * on);
  kCut = max(kCut, (aa(w + 0.45 - sd) * on - ink));
  kInk = max(kInk, ink);
}
// A ring turned into a top at radius R: which way its two walls face (out on the inner wall, in on the outer).
vec2 ringCut(float r, vec2 e, float R, float w) {
  float x = (r - R) / w;
  return -e * x * exp(-x * x) * 1.5;
}
// disc: a straight knob, knurled round the side, turned on top with one ring cut into it, and a chamfer that shows the lamp as a thin line.
void knobDisc(vec2 q, float ang) {
  float r = length(q);
  vec2 e = q / max(r, 0.001);
  float th = (atan(q.y, q.x) - ang) * 40.0;
  kCov = aa(13.0 - 0.22 * (1.0 - cos(th)) - r);
  float top = aa(10.3 - r), cham = aa(11.3 - r);
  kG = mix(e * 2.4 + vec2(-e.y, e.x) * sin(th) * 1.7, e * 0.3, cham) * (1.0 - top);
  kW = ringCut(r, e, 7.9, 0.45);
  kZ = 16.0 - 7.0 * (1.0 - cham);
  kTop = top;
  vec2 d = vec2(sin(ang), -cos(ang));
  indicator(q, d * 2.0, d * 10.0, 0.8, cham);
  kSh = 0.0;
}
// dot: a smooth knob with a low crown that rolls over into its side, and a dot let into it.
void knobDome(vec2 q, float ang) {
  float r = length(q);
  vec2 e = q / max(r, 0.001);
  kCov = aa(12.8 - r);
  kG = e * (shoulder(12.8 - r, 3.6) + 0.035 * r);
  kW = ringCut(r, e, 10.3, 0.4) * 0.8;
  kZ = 14.0;
  kTop = aa(9.6 - r) * 0.5;
  kRough = 0.26;
  vec2 d = vec2(sin(ang), -cos(ang));
  indicator(q, d * 6.9, d * 6.9001, 1.7, 1.0);
  kSh = 0.0;
}
// skirt: a low spun skirt with a knurled post standing on it. lit is which way the lamp lies from the knob.
void knobSkirt(vec2 q, float ang, vec3 lit) {
  float r = length(q);
  vec2 e = q / max(r, 0.001);
  float th = (atan(q.y, q.x) - ang) * 28.0;
  kCov = aa(13.7 - r);
  float post = aa(8.8 - 0.18 * (1.0 - cos(th)) - r);
  float top = aa(6.9 - r), cham = aa(7.8 - r);
  vec2 skirt = e * (0.34 + shoulder(13.7 - r, 0.9));
  vec2 grip = mix(e * 2.2 + vec2(-e.y, e.x) * sin(th) * 1.6, e * 0.3, cham) * (1.0 - top);
  kG = mix(skirt, grip, post);
  kZ = mix(3.0, 16.0, post);
  kTop = top;
  vec2 d = vec2(sin(ang), -cos(ang));
  indicator(q, d * 1.6, d * 6.6, 0.75, cham);
  indicator(q, d * 10.3, d * 12.7, 0.75, 1.0 - post);
  // The post's shadow on the skirt.
  vec2 s = -lit.xy / lit.z * 12.0;
  float len = length(s);
  float t = clamp(dot(q, s) / (len * len), 0.0, 1.0);
  kSh = smoothstep(0.6 + 2.2 * t, -0.6 - 2.2 * t, length(q - s * t) - 8.8) * (1.0 - post);
}
// pointer: a round body drawn out into a nose. How far outside its outline q is (under 0 inside).
float pointerSd(vec2 q, float ang) {
  vec2 d = vec2(sin(ang), -cos(ang));
  float u = dot(q, d);
  float v = abs(q.x * d.y - q.y * d.x);
  float a = v - mix(4.9, 1.9, clamp(u / 14.2, 0.0, 1.0)) + 1.3;
  float b = u - 14.2 + 1.3;
  float nose = max(length(max(vec2(a, b), 0.0)) + min(max(a, b), 0.0) - 1.3, -u);
  float body = length(q) - 9.6;
  float k = clamp(0.5 + 0.5 * (nose - body) / 2.0, 0.0, 1.0);
  return mix(nose, body, k) - 2.0 * k * (1.0 - k);
}
void knobPointer(vec2 q, float ang) {
  float sd = pointerSd(q, ang);
  vec2 g = normalize(vec2(pointerSd(q + vec2(0.3, 0.0), ang) - sd, pointerSd(q + vec2(0.0, 0.3), ang) - sd) + 0.00001);
  kCov = aa(-sd);
  kG = g * shoulder(-sd, 1.7);
  kZ = 15.0;
  kTop = aa(-sd - 1.5);
  vec2 d = vec2(sin(ang), -cos(ang));
  indicator(q, d * 3.4, d * 12.4, 0.75, 1.0);
  kSh = 0.0;
}
// The shadow a knob at c (m times the size it was worked out at) throws on the face at p, and how close p is to its foot.
vec2 knobShadow(vec2 p, vec2 c, float ang, float m) {
  float foot;
  float sh;
  if (uCap < 0.5) {
    foot = length(p - c) - 13.0 * m;
    sh = postShadow(p, c, 12.9 * m, 16.0 * m);
  } else if (uCap < 1.5) {
    foot = length(p - c) - 12.8 * m;
    sh = postShadow(p, c, 12.7 * m, 14.0 * m);
  } else if (uCap < 2.5) {
    foot = length(p - c) - 13.7 * m;
    sh = max(postShadow(p, c, 13.7 * m, 3.0 * m), postShadow(p, c, 8.8 * m, 16.0 * m));
  } else {
    foot = pointerSd((p - c) / m, ang) * m;
    vec3 l = normalize(uLight - vec3(c, 0.0));
    vec2 s = -l.xy / l.z;
    sh = 0.0;
    for (int j = 1; j <= 9; j++) {
      float h = 15.0 * m * float(j) / 9.0;
      float blur = 0.6 + 0.3 * h;
      sh = max(sh, smoothstep(blur, -blur, pointerSd((p - c - s * h) / m, ang) * m));
    }
  }
  return vec2(sh, foot);
}
`

// The picture: the painted box first, then what is let into it, then what stands on it.
const FS_MAIN = `
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
// A matt thing under the lamp and the room, with a coat that mirrors the softbox a little.
vec3 matt(vec3 pos, vec3 n, vec3 alb, float sh, float ao, float rough, float coat) {
  float key = keyLight(pos, n) * (1.0 - sh);
  vec3 c = alb * ((0.2 + 0.1 * n.z) * ao * (1.0 - 0.4 * sh) + 0.7 * key);
  return c + coat * softbox(pos, n, rough) * (1.0 - 0.85 * sh) * ao;
}
// Bright metal: the room and the softbox mirrored in it, and below the horizon the painted box it stands on.
vec3 chrome(vec3 pos, vec3 n, vec3 f0, float sh, float ao, float rough, vec3 below) {
  float box = softbox(pos, n, rough);
  vec3 env = mix(vec3(room(gR, rough)), below, smoothstep(0.1, -0.1 - rough, gR.z));
  return f0 * (env * ao * (1.0 - 0.5 * sh) + 3.2 * box * (1.0 - 0.8 * sh));
}
void main() {
  gAA = uScale;
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uScale;
  vec2 half_ = uSize * 0.5;
  gEye = vec3(half_, 1500.0);
  vec2 pc = p - half_;
  float sdP = sdBox(pc, half_, ${STUDIO_CORNER}.0);
  float cover = aa(-sdP);
  if (cover <= 0.0) { gl_FragColor = vec4(0.0); return; }
  vec3 l0 = normalize(uLight - vec3(p, 0.0));
  // How far a shadow is thrown for each px of height.
  vec2 S = -l0.xy / l0.z;

  // --- The box: satin paint, the edge rolling over, the faint tooth of a powder coat ---
  vec2 g = gradBox(pc, half_, ${STUDIO_CORNER}.0) * min(shoulder(-sdP, 6.2), 2.6);
  vec2 grain = (vec2(vnoise(p * 2.3), vnoise(p * 2.3 + 31.7)) - 0.5) * 0.042 + (vec2(vnoise(p * 0.6 + 7.0), vnoise(p * 0.6 + 19.0)) - 0.5) * 0.015;
  // The display's window and the preset's: the face rolls into each opening.
  float sdW = sdRect(p, uWin, 5.0);
  g -= gradRect(p, uWin, 5.0) * min(shoulder(sdW, 1.3), 2.2) * step(0.0, sdW);
  float sdQ = sdRect(p, uPreset, 3.0);
  g -= gradRect(p, uPreset, 3.0) * min(shoulder(sdQ, 1.1), 2.2) * step(0.0, sdQ);
  // The powder coat's tooth, hushed where the face rolls into an opening.
  g += grain * smoothstep(0.6, 2.2, min(sdW, sdQ));

  // Shadows on the face: the knobs, the keys, the nut under the lamp. The knob p is on, or beside, is kept for later.
  float sh = 0.0, ao = 1.0;
  vec4 at = vec4(0.0);
  float ki = -1.0;
  for (int k = 0; k < ${STUDIO_KNOBS_MOST}; k++) {
    if (float(k) >= uKnobs) break;
    vec4 K = uK[k];
    vec2 dq = p - K.xy;
    float reach = 44.0 * K.z;
    if (abs(dq.x) > reach || abs(dq.y) > reach) continue;
    vec2 s = knobShadow(p, K.xy, K.w, K.z);
    sh = 1.0 - (1.0 - sh) * (1.0 - s.x);
    ao *= 1.0 - 0.55 * exp(-max(s.y, 0.0) / 1.4);
    if (length(dq) < 19.0 * K.z) { at = K; ki = float(k); }
  }
  for (int j = 0; j < ${KEYS_MOST}; j++) {
    vec4 key = uKeys[j];
    if (key.z < 1.0) continue;
    float sd = sdRect(p, key, 4.0);
    sh = max(sh, smoothstep(1.1, -1.1, sdRect(p - S * 2.0, key, 4.0)));
    ao *= 1.0 - 0.5 * exp(-max(sd, 0.0) / 0.9);
  }
  vec2 pl = p - uLampAt;
  float sdN = sdHex(pl, 7.4) - 0.6;
  sh = max(sh, smoothstep(1.2, -1.2, sdHex(pl - S * 2.2, 7.4) - 0.6));
  ao *= 1.0 - 0.5 * exp(-max(sdN, 0.0) / 0.9);

  vec3 n = normalize(vec3(g, 1.0));
  vec3 col = matt(vec3(p, 0.0), n, uPaint, sh, ao, 0.42, 0.12);
  // Words are printed on the open face: it never gets so light or so dark that they stop reading (a soft knee, not a patch).
  float open = smoothstep(2.6, 4.8, -sdP);
  // Where the edge rolls over it shows the lamp more tightly: one soft bright line along the top and the left.
  col += 0.16 * softbox(vec3(p, 0.0), n, 0.16) * (1.0 - open);
  float Y = max(luma(col), 0.0001);
  float knee = 0.9 * uLum.y, space = 0.1 * uLum.y;
  float capped = min(Y, knee) + space * (1.0 - exp(-max(Y - knee, 0.0) / space));
  float heel = 1.25 * uLum.x, give = 0.25 * uLum.x + 0.0001;
  capped = max(capped, heel) - give * (1.0 - exp(-max(heel - capped, 0.0) / give));
  col *= mix(1.0, capped / Y, open);
  // Screen printed by each knob: the two strokes where its travel ends, as the flat plate has them. Flat ink, lit and shaded as the paint is.
  vec2 q = (p - at.xy) / max(at.z, 0.001);
  if (ki >= 0.0) {
    gAA = uScale * at.z;
    vec2 d = vec2(q.x < 0.0 ? -0.7071 : 0.7071, 0.7071);
    float print = aa(0.5 - sdSeg(q, d * 15.2, d * 17.4));
    col = mix(col, uInk * min(luma(col) / max(luma(uPaint), 0.0001), 1.2), print);
    gAA = uScale;
  }
  // The lamp's own glow on the paint.
  float lr = length(pl);
  col += uLamp * uOn * 0.22 * exp(-lr * lr / 90.0);

  // --- Glass: the display's window and the preset's, set down into the box, the walls' shade lying on them ---
  float deep = 3.0;
  float shW = smoothstep(-1.6, 1.6, sdRect(p - S * deep, uWin, 5.0));
  float shQ = smoothstep(-1.0, 1.0, sdRect(p - S * 1.6, uPreset, 3.0));
  float inW = aa(-sdW), inQ = aa(-sdQ);
  float glassSh = mix(shQ, shW, inW);
  vec3 up = vec3(0.0, 0.0, 1.0);
  vec3 glass = matt(vec3(p, -deep), up, uGlass, glassSh, 1.0, 0.0, 0.0);
  glass += softbox(vec3(p, -deep), up, 0.015) * 0.065 + 0.012 * room(gR, 0.0);
  // A dark seam where glass meets wall.
  glass *= 1.0 - 0.7 * exp(-max(-sdW, 0.0) / 0.7) * inW - 0.7 * exp(-max(-sdQ, 0.0) / 0.6) * inQ * (1.0 - inW);
  col = mix(col, glass, max(inW, inQ));
`

const FS_PARTS = `
  // --- A cell that opens something: a low matt cap, its top dished a hair, its shoulder showing the lamp ---
  for (int j = 0; j < ${KEYS_MOST}; j++) {
    vec4 key = uKeys[j];
    if (key.z < 1.0) continue;
    float sdK = sdRect(p, key, 4.0);
    float inK = aa(-sdK);
    float edgeK = 1.0 - smoothstep(1.2, 2.6, -sdK);
    vec2 gk = gradRect(p, key, 4.0) * min(shoulder(-sdK, 1.9), 2.4) - (p - key.xy - key.zw * 0.5) * 0.006 * (1.0 - edgeK);
    vec3 kn0 = normalize(vec3(gk, 1.0));
    vec3 keyC = matt(vec3(p, 2.0), kn0, uKey, 0.0, 1.0, 0.4, 0.05) + 0.22 * softbox(vec3(p, 2.0), kn0, 0.14) * edgeK;
    col = mix(col, keyC, inK);
  }

  // --- The knob p is on ---
  if (ki >= 0.0) {
    float ang = at.w;
    gAA = uScale * at.z;
    kInk = 0.0;
    kCut = 0.0;
    kBed = 0.0;
    kRough = 0.09;
    kW = vec2(0.0);
    if (uCap < 0.5) knobDisc(q, ang);
    else if (uCap < 1.5) knobDome(q, ang);
    else if (uCap < 2.5) knobSkirt(q, ang, normalize(uLight - vec3(at.xy, 0.0)));
    else knobPointer(q, ang);
    gAA = uScale;
    if (kCov > 0.0) {
      vec3 kn = normalize(vec3(kG, 1.0));
      vec3 pos = vec3(p, kZ * at.z);
      float r = length(q);
      // Anodised aluminium: part satin, part mirror, in the knob's own colour.
      float key = keyLight(pos, kn) * (1.0 - kSh);
      float box = softbox(pos, kn, kRough) * (1.0 - 2.2 * (kRough - 0.09));
      float rm = mix(room(gR, 0.1), 0.16, smoothstep(0.1, -0.2, gR.z));
      vec3 body = uKnob * (0.5 * (0.12 + 0.88 * key * key) + 0.4 * rm * (1.0 - 0.5 * kSh) + 2.4 * box * (1.0 - kSh));
      // The top: the two fans of a lathe-turned face, and the rings themselves, only just seen.
      float fan = turned(pos, q / max(r, 0.001), 112.0) * smoothstep(0.2, 3.0, r);
      float rings = 0.94 + 0.12 * vnoise(vec2(r * 4.0, 3.0 + ki * 7.0));
      // A cut in the top (the ring, the indicator's edge) is light on the wall that faces the lamp and dark on the other.
      float wall = dot(kW, normalize(uLight.xy - p));
      vec3 top = (uKnob * (0.25 + 1.5 * fan) + 0.18 * fan * fan) * rings;
      vec3 kcol = mix(body, top, kTop) * clamp(1.0 + 1.1 * wall, 0.4, 1.6);
      // The bed the indicator is cut into: the metal there gives no more light, and no less, than its paint reads on.
      float kl = max(dot(kcol, vec3(0.2126, 0.7152, 0.0722)), 0.0001);
      kcol *= mix(1.0, clamp(kl, uBed.x, uBed.y) / kl, kBed) * (1.0 - 0.45 * kCut);
      kcol = mix(kcol, uMark * (0.3 + 0.7 * keyLight(pos, up)), kInk);
      col = mix(col, kcol, kCov);
    }
  }

  // --- The lamp: a hex nut on the paint, a round bezel on the nut, a domed lens in the bezel ---
  float inN = aa(-sdN);
  float h0 = sdHex(pl, 7.4);
  vec2 gn = normalize(vec2(sdHex(pl + vec2(0.3, 0.0), 7.4) - h0, sdHex(pl + vec2(0.0, 0.3), 7.4) - h0) + 0.00001) * min(shoulder(-sdN, 1.0), 1.1);
  float shB = postShadow(p, uLampAt, 5.7, 2.4);
  // The nut's face is turned too: it shows the lamp in two faint fans.
  vec3 nut = chrome(vec3(p, 2.2), normalize(vec3(gn, 1.0)), vec3(0.88), shB, 1.0 - 0.6 * exp(-max(lr - 5.7, 0.0) / 0.6), 0.1, uPaint * 0.5 + 0.03);
  nut *= 0.8 + 0.55 * turned(vec3(p, 2.2), pl / max(lr, 0.001), 170.0) * aa(-sdN - 1.0);
  col = mix(col, nut, inN);
  float tb = clamp((lr - 4.4) / 1.3, -0.95, 0.95);
  vec2 gb = pl / max(lr, 0.001) * tb / sqrt(1.0 - tb * tb);
  float inB = aa(5.7 - lr);
  col = mix(col, chrome(vec3(p, 4.4), normalize(vec3(gb, 1.0)), vec3(0.96), 0.0, 1.0, 0.015, vec3(0.2)), inB);
  float inL = aa(3.15 - lr);
  vec3 ln = normalize(vec3(pl * 0.3, 1.0));
  vec3 lens = uLamp * mix(0.04 + 0.1 * keyLight(vec3(p, 4.0), ln), 0.55 + 2.2 * exp(-lr * lr / 2.2), uOn);
  lens += softbox(vec3(p, 4.4), ln, 0.03) * mix(0.5, 0.3, uOn);
  lens *= 1.0 - 0.6 * smoothstep(2.0, 3.15, lr) * (1.0 - 0.6 * uOn);
  col = mix(col, lens, inL);
  // The lit lens on the bezel round it.
  col += uLamp * uOn * 0.3 * exp(-(lr - 3.15) * (lr - 3.15) / 1.5) * inB * (1.0 - inL);

  // Highlights roll off into white as film does; the plate's own colour is left as it is.
  vec3 over = max(col - 0.8, 0.0);
  col = min(col, 0.8) + 0.2 * (1.0 - exp(-over / 0.2));
  col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
  // A photograph's contrast: a slight S through the middle.
  col = mix(col, col * col * (3.0 - 2.0 * col), 0.14);
  gl_FragColor = vec4(col * cover, cover);
}
`

const VS = 'attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }'

/** The whole fragment shader, for a check that it compiles. */
export const STUDIO_FRAGMENT_SHADER = FS_HEAD + FS_LIGHT + FS_KNOB + FS_MAIN + FS_PARTS
export const STUDIO_VERTEX_SHADER = VS

// --- One WebGL context for every plate on the page ---

const UNIFORMS = [
  'uRes',
  'uSize',
  'uScale',
  'uLight',
  'uPaint',
  'uKnob',
  'uMark',
  'uGlass',
  'uLamp',
  'uKey',
  'uInk',
  'uLum',
  'uLampAt',
  'uBed',
  'uCap',
  'uKnobs',
  'uOn',
  'uK',
  'uKeys',
  'uWin',
  'uPreset',
] as const

interface Rig {
  canvas: HTMLCanvasElement
  gl: WebGLRenderingContext
  u: Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>
}

/** Null until first asked for, false where there is no WebGL (or its context is lost), else what a draw needs. */
let rig: Rig | false | null = null
let glCanvas: HTMLCanvasElement | null = null
const watchers = new Set<() => void>()
const tell = (): void => watchers.forEach((watcher) => watcher())

function buildRig(): Rig | false {
  if (typeof document === 'undefined') return false
  // Where the reader has the system's own colours forced on the page, a photograph would not follow them.
  if (typeof matchMedia === 'function' && matchMedia('(forced-colors: active)').matches)
    return false
  try {
    if (!glCanvas) {
      glCanvas = document.createElement('canvas')
      // A lost context: the plates lie flat until it is back, then the rig is built again.
      glCanvas.addEventListener('webglcontextlost', (event) => {
        event.preventDefault()
        rig = false
        tell()
      })
      glCanvas.addEventListener('webglcontextrestored', () => {
        rig = null
        tell()
      })
    }
    const gl = glCanvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    })
    if (!gl) return false
    const shader = (type: number, source: string): WebGLShader => {
      const made = gl.createShader(type)
      if (!made) throw new Error('no shader')
      gl.shaderSource(made, source)
      gl.compileShader(made)
      if (!gl.getShaderParameter(made, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(made) ?? 'the shader did not compile')
      }
      return made
    }
    const program = gl.createProgram()
    if (!program) return false
    gl.attachShader(program, shader(gl.VERTEX_SHADER, VS))
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, STUDIO_FRAGMENT_SHADER))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? 'the shader did not link')
    }
    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const a = gl.getAttribLocation(program, 'a')
    gl.enableVertexAttribArray(a)
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0)
    const u = Object.fromEntries(
      UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)]),
    ) as Rig['u']
    return { canvas: glCanvas, gl, u }
  } catch {
    // No shader on this machine: the plates keep the flat look.
    return false
  }
}

/** Whether a plate can be photographed here: there is WebGL, and the shader compiled. */
export function studioReady(): boolean {
  rig ??= buildRig()
  return rig !== false
}

/** Hears the answer of `studioReady` change (a context lost or given back). Returns what stops it. */
export function watchStudio(watcher: () => void): () => void {
  watchers.add(watcher)
  return () => {
    watchers.delete(watcher)
  }
}

/** For a test: forget the rig, so the next plate asks again. */
export function forgetStudioRig(): void {
  rig = null
  glCanvas = null
}

/** Where the softbox hangs over a plate: up and to the left of its middle. */
const LIGHT = { x: -175, y: -330, z: 600 }
/** How many of its own pixels a plate is drawn with for each screen pixel, at the most. */
const RATIO_MOST = 3
/** Far off the plate: where a part that is not there is put, so it shades nothing. */
const NOWHERE = -4000

const packed = (box: FaceBox | null): [number, number, number, number] =>
  box ? [box.x, box.y, box.w, box.h] : [NOWHERE, NOWHERE, 8, 8]

/**
 * Photographs `scene` in `palette` into `face`, a canvas the size of the
 * plate. Returns false, and leaves the canvas as it was, where it cannot
 * (no WebGL, a context lost, more knobs than the shader holds).
 */
export function drawStudioFace(
  face: HTMLCanvasElement,
  scene: FaceScene,
  palette: StudioPalette,
): boolean {
  if (!studioReady() || !rig) return false
  if (scene.knobs.length > STUDIO_KNOBS_MOST || scene.width < 1 || scene.height < 1) return false
  const ctx = face.getContext('2d')
  if (!ctx) return false
  const { gl, u, canvas } = rig
  // The ratio of the screen the face is on: its own window's, which is not the page's where a host draws the plate
  // into a window it opened.
  const screen = (face.ownerDocument?.defaultView ?? globalThis).devicePixelRatio
  const ratio = Math.min(
    RATIO_MOST,
    Math.max(1, (typeof screen === 'number' && screen > 0 ? screen : 1) * (scene.shown ?? 1)),
  )
  const fw = Math.max(1, Math.round(scene.width * ratio))
  const fh = Math.max(1, Math.round(scene.height * ratio))
  if (face.width !== fw) face.width = fw
  if (face.height !== fh) face.height = fh
  // Under 2 px per px the picture is drawn at twice the size and brought down, so every edge is smooth.
  const scale = ratio < 2 ? ratio * 2 : ratio
  const w = Math.round(scene.width * scale)
  const h = Math.round(scene.height * scale)
  // The shared canvas only ever grows: plates of several sizes take turns on it.
  if (canvas.width < w) canvas.width = w
  if (canvas.height < h) canvas.height = h
  gl.viewport(0, 0, w, h)
  gl.enable(gl.SCISSOR_TEST)
  gl.scissor(0, 0, w, h)
  gl.uniform2f(u.uRes, w, h)
  gl.uniform2f(u.uSize, scene.width, scene.height)
  gl.uniform1f(u.uScale, scale)
  gl.uniform3f(u.uLight, scene.width / 2 + LIGHT.x, scene.height / 2 + LIGHT.y, LIGHT.z)
  const three = (at: WebGLUniformLocation | null, of: readonly number[]): void =>
    gl.uniform3f(at, of[0], of[1], of[2])
  three(u.uPaint, linear(palette.paint))
  three(u.uKnob, palette.knob)
  three(u.uMark, palette.mark)
  three(u.uGlass, linear(palette.glass))
  three(u.uLamp, palette.lamp)
  three(u.uKey, linear(palette.key))
  three(u.uInk, linear(palette.word))
  gl.uniform2f(u.uLum, palette.range[0], palette.range[1])
  gl.uniform2f(u.uLampAt, scene.lamp?.x ?? NOWHERE, scene.lamp?.y ?? NOWHERE)
  gl.uniform2f(u.uBed, palette.bed[0], palette.bed[1])
  gl.uniform1f(u.uCap, CAP_INDEX[scene.cap] ?? 0)
  gl.uniform1f(u.uKnobs, scene.knobs.length)
  gl.uniform1f(u.uOn, scene.powered ? 1 : 0)
  const knobs = new Float32Array(STUDIO_KNOBS_MOST * 4)
  scene.knobs.forEach((knob, index) => {
    knobs.set([knob.x, knob.y, knob.size / 30, knob.angle], index * 4)
  })
  gl.uniform4fv(u.uK, knobs)
  const keys = new Float32Array(KEYS_MOST * 4)
  scene.keys.slice(0, KEYS_MOST).forEach((key, index) => keys.set(packed(key), index * 4))
  gl.uniform4fv(u.uKeys, keys)
  gl.uniform4fv(u.uWin, packed(scene.display))
  gl.uniform4fv(u.uPreset, packed(scene.preset))
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, fw, fh)
  ctx.imageSmoothingQuality = 'high'
  // The plate was drawn in the shared canvas's lower left corner, which is its upper rows turned over.
  ctx.drawImage(canvas, 0, canvas.height - h, w, h, 0, 0, fw, fh)
  return true
}
