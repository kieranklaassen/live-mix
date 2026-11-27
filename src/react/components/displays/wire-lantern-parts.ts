// What the display of Wire Lantern (`wire-lantern.ts`) draws from: the solids,
// wire of one length along every edge with the waves that stand on it, and the
// level of every wave of a key as it is played, heard and dies.
//
// The arithmetic is the device's own (`cpp/devices/wire-lantern/lantern_solids.h`):
// a tone stands where cos(kL) is an eigenvalue of the walk from corner to
// corner, or where sin(kL) is 0 and the wave runs round the loops. How a family
// is heard at one place when it is played at another is the projector of its
// eigenspace, split in what the touched corner feels and the rest.

import { clamp } from '../display-kit'
import { type DisplayNote } from '../plate-display'

type Grid = number[][]

export const FAMILIES = 24
const TWO_PI = 2 * Math.PI
/** A sine by its turns. */
export const sine = (turns: number): number => Math.sin(TWO_PI * turns)
/** So many of them. */
export const each = <T>(n: number, make: (i: number) => T): T[] =>
  Array.from({ length: n }, (_, i) => make(i))

// --- The solids (`lantern_solids.h`) -------------------------------------------

// Name, edges, the route of the ears, of `voicing` the tilt, root, loop, keep,
// slope, rise, held and sings, and where the corners stand, y up.
const TABLE = `
Ring|01 12 23 34 45 50|012345|-.85 1.1 .8 .5 .4 .7 -.65 2|0,-.18,1 .87,.18,.5 .87,-.18,-.5 0,.18,-1 -.87,-.18,-.5 -.87,.18,.5
Tetrahedron|01 02 03 12 13 23|0123|-.45 1.1 1.3 3 .4 14 .7 1.7|0,1,0 0,-.55,1 .87,-.55,-.5 -.87,-.55,-.5
Octahedron|02 03 04 05 12 13 14 15 24 25 34 35|021435|-.15 .95 .9 1 .3 1 .1 3.6|0,1,0 0,-1,0 1,0,0 -1,0,0 0,0,1 0,0,-1
Cube|01 02 04 13 15 23 26 37 45 46 57 67|01326754|1.65 1.2 .8 5.6 1.6 2.5 1.6 1|.62,.62,.62 -.62,.62,.62 .62,-.62,.62 -.62,-.62,.62 .62,.62,-.62 -.62,.62,-.62 .62,-.62,-.62 -.62,-.62,-.62
Prism|01 03 34 12 14 45 20 25 53|012543|-.25 1.1 .9 .26 .6 .7 1.2 4.2|0,.7,.85 .74,.7,-.42 -.74,.7,-.42 0,-.7,.85 .74,-.7,-.42 -.74,-.7,-.42
Web|01 12 14 45 02 23 25 56 03 31 36 64|4563021|-.55 .4 .7 .8 .2 220 -.1 9|0,.75,0 0,.25,.5 .43,.25,-.25 -.43,.25,-.25 0,-.55,1.1 .95,-.55,-.55 -.95,-.55,-.55`

export interface Family {
  /** A wave with a node at every corner, round the loops; else one of the corners'. */
  loop: boolean
  root: number
  cosine: boolean
  turns: number
  overSine: number
  ratio: number
  /** Cents over the lowest, where the solid has it. */
  natural: number
}
export interface WireSolid {
  name: string
  corners: number[][]
  edges: number[][]
  route: number[]
  voicing: number[]
  scale: number
  /** The projectors of the corner families' eigenspaces, and of the odd and even loops. */
  g: Grid[]
  h: Grid[]
  families: Family[]
}

/** The values and the vectors (rows) of a symmetric matrix, by Jacobi's rotations. */
function eigen(a: Grid): { values: number[]; vectors: Grid } {
  const n = a.length
  const v = each(n, (i) => each(n, (j) => (i === j ? 1 : 0)))
  for (let sweep = 0; sweep < 40; sweep++)
    for (let p = 0; p < n; p++)
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < 1e-14) continue
        const angle = 0.5 * Math.atan2(2 * a[p][q], a[q][q] - a[p][p])
        const [c, s] = [Math.cos(angle), Math.sin(angle)]
        const turn = (x: number, y: number): [number, number] => [c * x - s * y, s * x + c * y]
        for (const row of a) [row[p], row[q]] = turn(row[p], row[q])
        for (const m of [a, v])
          for (let k = 0; k < n; k++) [m[p][k], m[q][k]] = turn(m[p][k], m[q][k])
      }
  return { values: each(n, (i) => a[i][i]), vectors: v }
}

/** `open_interval`: the nearest octave, second, fourth, fifth, sixth or seventh, or high odd harmonic. */
export function wireOpen(cents: number): number {
  if (cents < 1) return 0
  const open = [2786.314, 3368.826, 3986.314, 4568.826, 4688.269]
  for (const step of [0, 203.91, 498.045, 701.955, 884.359, 996.09])
    for (let octave = 0; octave < 8; octave++) open.push(step + 1200 * octave)
  return open.reduce((best, at) => (Math.abs(at - cents) < Math.abs(best - cents) ? at : best))
}

function build(row: string): WireSolid {
  const [name, pairs, route, voiced, points] = row.split('|')
  const numbers = (words: string, by: string): number[] => words.split(by).map(Number)
  const corners = points.split(' ').map((point) => numbers(point, ','))
  const edges = pairs.split(' ').map((pair) => numbers(pair, ''))
  const degree = corners.map((_, c) => edges.filter((edge) => edge.includes(c)).length)
  const walk = corners.map(() => corners.map(() => 0))
  for (const [i, j] of edges) walk[i][j] = walk[j][i] = 1 / Math.sqrt(degree[i] * degree[j])
  const { values, vectors } = eigen(walk)
  const inside = values.filter((mu) => Math.abs(mu) < 1 - 1e-8)
  const roots = inside.filter((mu, i) => inside.findIndex((x) => Math.abs(x - mu) < 1e-7) === i)
  const g = roots.map((mu) =>
    corners.map((_, i) =>
      corners.map((_, j) =>
        vectors.reduce(
          (sum, v, m) =>
            Math.abs(values[m] - mu) < 1e-7
              ? sum + (v[i] * v[j]) / Math.sqrt(degree[i] * degree[j])
              : sum,
          0,
        ),
      ),
    ),
  )
  // A loop wave leaves nothing at any corner: the null space of what the edges bring there.
  const h = [1, -1].map((sign) => {
    const brought = edges.map(([a, b]) =>
      edges.map(
        ([c, d]) => Number(a === c) + Number(b === d) + sign * (Number(a === d) + Number(b === c)),
      ),
    )
    const loops = eigen(brought)
    const still = loops.vectors.filter((_, m) => Math.abs(loops.values[m]) < 1e-6)
    return edges.map((_, i) => edges.map((_, j) => still.reduce((sum, v) => sum + v[i] * v[j], 0)))
  })
  const bipartite = values.some((mu) => mu < -1 + 1e-8)
  const found: { kl: number; loop: boolean; root: number }[] = []
  for (let n = 0; n < 12; n++) {
    roots.forEach((mu, root) => {
      for (const kl of [n * TWO_PI + Math.acos(mu), (n + 1) * TWO_PI - Math.acos(mu)])
        found.push({ kl, loop: false, root })
    })
    if (bipartite || h[0][0][0] > 1e-6)
      found.push({ kl: Math.PI * (2 * n + 1), loop: true, root: 0 })
    found.push({ kl: TWO_PI * (n + 1), loop: true, root: 1 })
  }
  found.sort((a, b) => a.kl - b.kl)
  const families = found.slice(0, FAMILIES).map(({ kl, loop, root }) => {
    const natural = 1200 * Math.log2(kl / found[0].kl)
    return {
      loop,
      root,
      cosine: loop && (root === 1 || bipartite),
      turns: kl / TWO_PI,
      overSine: loop ? 0 : 1 / Math.sin(kl),
      ratio: kl / found[0].kl,
      natural,
    }
  })
  const scale = Math.sqrt(2 * edges.length)
  return {
    name,
    corners,
    edges,
    route: numbers(route, ''),
    voicing: numbers(voiced, ' '),
    scale,
    g,
    h,
    families,
  }
}

const built = new Map<number, WireSolid>()
/** The solid of a step of Solid, found the first time it is asked for. */
export function wireSolid(step: number): WireSolid {
  const solid = built.get(step) ?? build(TABLE.trim().split('\n')[step])
  built.set(step, solid)
  return solid
}

// --- Where a key is played and heard -------------------------------------------

/** `play`: the edge that is played, how far along it, and what each family's two lines take of it. */
export function wirePlayed(solid: WireSolid, step: number, along: number) {
  const { edges, families, route, scale } = solid
  const [felt] = route
  const near = solid.corners.map((_, c) =>
    c === felt ? 0 : edges.some((edge) => edge.includes(c) && edge.includes(felt)) ? 1 : 2,
  )
  const away = ([u, v]: number[]): number => near[u] + near[v]
  const order = edges.map((_, e) => e).sort((a, b) => away(edges[a]) - away(edges[b]))
  const edge = order[Math.floor((Math.floor(step / 2) * (edges.length - 1)) / 2)]
  const [u, v] = edges[edge]
  const at = near[u] > near[v] !== (step % 2 === 1) ? 1 - along : along
  const share = families.flatMap((family) => {
    const own = solid.h[family.root]?.[edge][edge] ?? 0
    if (family.loop)
      return [
        family.cosine ? Math.SQRT2 * sine(family.turns * at + 0.25) : 0,
        own > 1e-6 ? scale * Math.sqrt(own) * sine(family.turns * at) : 0,
      ]
    const g = solid.g[family.root]
    const alpha = sine(family.turns * (1 - at)) * family.overSine * scale
    const beta = sine(family.turns * at) * family.overSine * scale
    const unit = g[felt][felt] > 1e-6 ? 1 / Math.sqrt(g[felt][felt]) : 0
    const a = (alpha * g[felt][u] + beta * g[felt][v]) * unit
    const all = alpha * alpha * g[u][u] + 2 * alpha * beta * g[u][v] + beta * beta * g[v][v]
    return [a, all - a * a > 1e-4 * all ? Math.sqrt(all - a * a) : 0]
  })
  /** `hear`: the size of every line's wave on an edge, `x` of the way along it. */
  const hear = (heard: number, x: number): number[] => {
    const [p, q] = edges[heard]
    return families.flatMap((family, f) => {
      const { turns, root } = family
      const b = share[2 * f + 1]
      if (family.loop) {
        const own = solid.h[root][edge][edge]
        const round = own > 1e-6 ? (scale / Math.sqrt(own)) * solid.h[root][edge][heard] : 0
        return [family.cosine ? Math.SQRT2 * sine(turns * x + 0.25) : 1, round * sine(turns * x)]
      }
      const g = solid.g[root]
      const unit = g[felt][felt] > 1e-6 ? 1 / Math.sqrt(g[felt][felt]) : 0
      const from = (y: number, i: number, j: number, c: number): number =>
        (sine(turns * (1 - y)) * g[i][c] + sine(turns * y) * g[j][c]) * family.overSine * scale
      const shape = (c: number): number => g[felt][c] * unit * scale
      const rest = (c: number): number =>
        b > 0 ? ((from(at, u, v, c) - share[2 * f] * g[felt][c] * unit) * scale) / b : 0
      const stands = (end: (c: number) => number): number =>
        (sine(turns * (1 - x)) * end(p) + sine(turns * x) * end(q)) * family.overSine
      return [stands(shape), stands(rest)]
    })
  }
  return { edge, at, share, hear }
}
export type Played = ReturnType<typeof wirePlayed>

// --- A key (`wire_lantern.h`) ---------------------------------------------------

/** Reads a knob, in its own unit. */
export type Ask = (param: string) => number
export type WireNote = Pick<DisplayNote, 'frequency' | 'gain' | 'age' | 'released'>

const SIXTY_DB = 6.907755279
const BOW = 2
const BREATH = 3
// By the edge, then by the exciter: the device's tables of the same names.
const GAUGE = [0, 0.15, -0.3, 0.3, -0.25, 0.45]
const KNOT = [0, 0.25, 0.1666667, 0.25, 0.125, 0.0714286]
const KNOT_PHASE = [0.25, 0, 0, 0.25, 0.25, 0]
const POWER = [0.8, 0.15, 0.1, 1.5]
const REACH = [1.7, 2.2, 2.6, 1.1]
const GROW = [2.5, 2.6, 2.3, 2.3]
const RISE = [0.0045, 0.0012, 0.02, 0.06]
const KEEP = [0.75, 1.9, 1.6, 0.5]
const SLOPE = [1.1, 0.4, 0.6, 1.2]

const scatter = (k: number, seed: number): number => (((k * 0.754877 + seed) % 1) + 1) % 1
/** The step a choice stands on. */
export const step = (ask: Ask, param: string, most: number): number =>
  clamp(Math.round(ask(param)), 0, most)
/** The edge that is played, of six. */
export const edgeStep = (ask: Ask): number => clamp(Math.round(ask('edge')) - 1, 0, 5)
/** How far along its edge the wire is played. */
export const wireAlong = (pluck: number): number => 0.03 + 0.47 * pluck
/** Where a key's ears begin, in turns. */
export const placeOf = (hz: number): number => 0.381966 * (69 + 12 * Math.log2(hz / 440))

/** `tune`: where each tone stands, in cents over the note, True and the stiffness of the wire counted. */
export function wireCents(ask: Ask): number[] {
  const loose = 1 - ask('true')
  const stiff = 8e-4 * loose * loose * (0.15 + ask('wire') ** 2)
  return wireSolid(step(ask, 'solid', 5)).families.map(({ natural, ratio }) => {
    const bent = natural + (wireOpen(natural) - natural) * (1 - loose * loose)
    return bent + 865.6 * Math.log((1 + stiff * ratio * ratio) / (1 + stiff))
  })
}

/** `start`: the level of every line of a key, two to a tone, as a share of the whole. */
export function wireLevels(ask: Ask, played: Played, hz: number, gain: number): number[] {
  const solid = step(ask, 'solid', 5)
  const x = step(ask, 'exciter', BREATH)
  const { families, voicing } = wireSolid(solid)
  const [tilted, root, loops, , , , held, sings] = voicing
  const loose = 1 - ask('true')
  const at = wireAlong(ask('pluck'))
  const edge = edgeStep(ask)
  const hard = clamp(ask('hardness') + 0.6 * (gain - 0.7), 0, 1.2)
  const tilt = (x >= BOW ? held : tilted) + GAUGE[edge] + 2.4 * (at - 0.22)
  let power = 1e-9
  const levels = families.flatMap(({ loop, natural, ratio }, f) => {
    const [a, b] = [Math.abs(played.share[2 * f]), Math.abs(played.share[2 * f + 1])]
    const strength = Math.hypot(a, b)
    let want = (1.7 * strength) / (1 + 0.7 * strength)
    if (f === 0) want = root * Math.max(want, 0.95) * (0.55 + at)
    if (loop) want *= loops
    if (f > 0) {
      // Octaves and fifths lead where the net is true; where it is not, no two tones are as strong.
      const open = wireOpen(natural)
      const leads = open % 1200 < 1 || Math.abs((open % 1200) - 701.955) < 1 || open > 2700
      if (!leads) want *= 1 - 0.6 * (1 - loose * loose)
      want *= 10 ** (0.8 * loose * loose * (scatter(f, 0.17 + 0.21 * solid) - 0.5))
      if (edge > 0) want *= 0.05 + sine(KNOT[edge] * ratio + KNOT_PHASE[edge]) ** 2
    }
    if (x >= BOW) want *= 1 + 5.5 * Math.exp(-((2.4 * Math.log(ratio / sings)) ** 2))
    const reach = ratio / (REACH[x] * Math.exp(GROW[x] * hard))
    const high = (hz * ratio) / 6500
    const share =
      ratio ** (1.3 * (hard - 0.45) - POWER[x] - tilt) / ((1 + reach * reach) * (1 + high * high))
    const one = strength > 1e-5 ? (want * share) / strength : 0
    const pair = [f === 0 && strength <= 1e-5 ? want * share : one * a, one * b]
    power += (pair[0] ** 2 + pair[1] ** 2) / (1 + ((hz * ratio) / 5000) ** 2)
    return pair
  })
  const whole = (gain * (0.55 + 0.45 * gain)) / Math.sqrt(power)
  return levels.map((level) => level * whole)
}

/** `rates`, `pull`, `opening`: those levels as they stand after the key's time, held and let go. */
export function wireNow(ask: Ask, levels: readonly number[], note: WireNote): number[] {
  const { families, voicing } = wireSolid(step(ask, 'solid', 5))
  const [, , , keep, slopes, rises] = voicing
  const x = step(ask, 'exciter', BREATH)
  const hz = note.frequency
  const corner = ask('cornerLoss')
  const touch = ask('touch')
  const soft = 1 - ask('wire')
  const slope = slopes * SLOPE[x] * (0.04 + 1.1 * soft ** 2 + 1.5 * soft ** 4)
  const base = clamp(hz / 220, 0.2, 16) ** 0.3 / (ask('decay') * keep * KEEP[x])
  const palm = 6.5 * Math.max(touch - 0.3, 0) ** 2
  const ending = (x === BREATH ? 2.2 : 1) / ask('release')
  const up = note.released ?? 0
  const down = Math.max(note.age - up, 0)
  const slow = Math.min(rises, x >= BOW ? 8 : 300) * Math.sqrt(clamp(220 / hz, 0.15, 3))
  const rise = ask('swell') - 0.05 + RISE[x] * slow
  const opened = 0.5 - 0.5 * Math.cos(Math.PI * clamp(note.age / rise, 0, 1))
  // While a slow strike opens, it rings on.
  const u = clamp(down / rise, 0, 1)
  const rung = rise > 0.0214 ? rise * (0.03 * u + 0.1386 * u ** 7) + Math.max(down - rise, 0) : down
  return levels.map((level, k) => {
    const { loop, ratio } = families[k >> 1]
    const felt = k % 2 === 0
    const leaks = k < 2 ? 0.5 : !loop || felt ? 1 + 0.5 * ratio : 0
    const lost = k < 2 ? 1.2 : leaks > 0 ? 2.6 + 0.9 * ratio : 0.25
    const far = (hz * ratio) / (600 * Math.exp(3 * ask('wire')))
    const finger = felt ? (k < 2 ? 20 : 30) * touch ** 2.5 : 0
    const rate =
      base * (1 + slope * (ratio - 1) + slopes * far * far) + palm + lost * corner ** 3 + finger
    let stands = level * Math.exp(-SIXTY_DB * rate * rung)
    if (x >= BOW) {
      const less = palm + leaks * 2.6 * corner ** 1.5 + (felt ? (k < 2 ? 9 : 14) * touch ** 2 : 0)
      const come = 1 - 0.65 * Math.exp(-down * (0.8 + 2 / (0.6 + 0.4 * ratio)))
      stands = (level * come) / ((1 + less) * (1 + (0.06 + 0.9 * soft * soft) * (ratio - 1)))
    }
    return opened * stands * Math.exp(-SIXTY_DB * (rate + ending) * up)
  })
}

/** Where the ear stands on the route after `turned` turns: the edge, and how far along it. */
export function wireEar(ask: Ask, turned: number): { edge: number; x: number } {
  const { route, edges } = wireSolid(step(ask, 'solid', 5))
  const where = (((turned % 1) + 1) % 1) * route.length
  const leg = Math.min(Math.floor(where), route.length - 1)
  const [from, to] = [route[leg], route[(leg + 1) % route.length]]
  const edge = edges.findIndex((pair) => pair.includes(from) && pair.includes(to))
  return { edge, x: edges[edge][0] === from ? where - leg : 1 - where + leg }
}

/** `aim`: what one ear makes of every line: the waves where it stands, the bright face, the shade. */
export function wireHeard(ask: Ask, played: Played, hz: number, walked: number, far: boolean) {
  const { families, route } = wireSolid(step(ask, 'solid', 5))
  const width = ask('width')
  const turned = 0.5 * ask('ear') + walked
  const at = wireEar(ask, turned + placeOf(hz) + (far ? 0.43 * width : 0))
  const facing = turned + 0.19 * sine(placeOf(hz)) + (far ? 0.3 * width : 0) + 0.25
  const face = 0.75 * (ask('wire') - 0.6) + 0.48 * sine(facing)
  const drawn = (4.8 * ask('shade')) / (0.6 + 0.4 * ask('shade'))
  const shade = 9000 * Math.exp(-drawn) * Math.sqrt(clamp(hz / 220, 0.25, 16))
  return played.hear(at.edge, at.x).map((size, k) => {
    const { ratio, turns } = families[k >> 1]
    // What passes quicker than it can be followed is heard as its mean.
    const depth = (k < 2 ? 0.38 : 0.94) / (1 + ((2 * ask('turn') * route.length * turns) / 9) ** 2)
    const dark = (hz * ratio) / shade
    const colour = 1 / (1 + dark * dark * (1 + 0.3 * dark))
    const wave = Math.sqrt(1 + depth * (Math.min(size * size, 3.5) - 1))
    return colour * wave * Math.exp(face * Math.min(Math.log(ratio), 2.6))
  })
}
