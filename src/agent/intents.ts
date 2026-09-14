// Intent tools (R26): the musical vocabulary a coach speaks in, compiled to
// score operations, engine calls or the consumer's session hooks — whichever
// backend is present (hooks win, because the consumer owns sections, pace and
// its own dip logic). Every intent passes the same rails as the raw
// operations. The mapping table lives in docs/agent-api.md.

import { type Clip } from '../core/clips/Clip'
import {
  INTENSITY_LADDER,
  MAX_INTENSITY,
  MIN_INTENSITY,
  STEER_DIRECTIONS,
  clampIntensity,
  resolveReplacementTracks,
  targetIntensity,
  type SteerDirection,
} from '../core/music/intensity'
import { rankByKeyMatch } from '../core/music/keyMatch'
import { CROSSFADE_SECONDS, STEER_CROSSFADE_SECONDS } from '../core/tracks/AudioTrack'
import { type Operation } from '../score/operations'
import { findDevice, findStripHost, findTrack } from '../score/schema'
import { type JsonSchema } from './jsonSchema'
import { dbToGain } from './rails'
import {
  ToolError,
  type ControllerView,
  type ToolContext,
  type ToolPlan,
  type ToolSpec,
} from './registry'
import { type SteerOutcome } from './types'

// --- Schema helpers -------------------------------------------------------------------

function params(
  properties: Record<string, JsonSchema>,
  required: readonly string[] = Object.keys(properties),
): JsonSchema {
  return { type: 'object', properties, required, additionalProperties: false }
}

// Levels are described as 0..1 but not bounded in the schema: out-of-range
// requests are clamped by the range rail and logged with the requested value
// (AE2), rather than refused before the model learns what was applied.
const level = (description: string): JsonSchema => ({
  type: 'number',
  description: `${description} Values outside 0..1 are clamped.`,
})

const noArgs = params({})

// --- Backends -----------------------------------------------------------------------

function musicOwner(view: ControllerView): string | null {
  const id = view.roles.music
  if (!id || !view.document) return null
  return findStripHost(view.document.score, id) ? id : null
}

function ambienceOwner(view: ControllerView): string | null {
  const id = view.roles.ambience
  if (!id || !view.document) return null
  return findStripHost(view.document.score, id) ? id : null
}

/** The voice-keyed ducker's instance id: the `ducker` role, else a `ducker` insert on the music. */
function duckerDevice(view: ControllerView): string | null {
  const score = view.document?.score
  if (!score) return null
  if (view.roles.ducker && findDevice(score, view.roles.ducker)) return view.roles.ducker
  const music = musicOwner(view)
  if (!music) return null
  const host = findStripHost(score, music)
  const insert = host?.strip.inserts.find((device) => device.deviceId === 'ducker')
  return insert?.id ?? null
}

function currentMusicLevel(view: ControllerView): number | undefined {
  const described = view.session.describe?.().musicVolume
  if (described !== undefined) return described
  const owner = musicOwner(view)
  if (!owner || !view.document) return undefined
  return findStripHost(view.document.score, owner)?.strip.level
}

/** Clamp, slew and loudness-guard a role level; returns the value to apply. */
function guardRoleLevel(
  ctx: ToolContext,
  key: string,
  current: number | undefined,
  requested: number,
  what: string,
): number {
  const { rails } = ctx.view
  let value = rails.clampLevel(requested, ctx.notes, what)
  if (current !== undefined) {
    value = rails.slewGain(key, current, value, ctx.atMs, ctx.notes, !ctx.dryRun)
    value = rails.guardLoudness(current, value, ctx.notes, what)
  }
  return value
}

/** Plan a level change through the session hook when present, else the score strip. */
function planRoleLevel(
  ctx: ToolContext,
  role: 'music' | 'ambience',
  requested: number,
  label: string,
): ToolPlan {
  const { view } = ctx
  const session = view.session
  const hook = role === 'music' ? session.setMusicVolume : session.setAmbience
  const owner = role === 'music' ? musicOwner(view) : ambienceOwner(view)
  const current =
    role === 'music'
      ? currentMusicLevel(view)
      : owner && view.document
        ? findStripHost(view.document.score, owner)?.strip.level
        : undefined
  const value = guardRoleLevel(ctx, `${role}:level`, current, requested, `${role} level`)
  if (hook) {
    return {
      operations: [],
      effects: [() => ({ level: hook(value) })],
      result: { level: value },
      label,
    }
  }
  if (!owner) throw new ToolError('unavailable', `no ${role} track to set`)
  return {
    operations: [{ type: 'strip.set', owner, param: 'level', value }],
    effects: [],
    result: { level: value },
    label,
  }
}

function planDuck(ctx: ToolContext, requested: number, label: string): ToolPlan {
  const { view } = ctx
  const depth = view.rails.clampRange(requested, 0, 1, ctx.notes, 'duck depth')
  const hook = view.session.setDuckDepth
  if (hook) {
    return {
      operations: [],
      effects: [() => ({ depth: hook(depth) })],
      result: { depth },
      label,
    }
  }
  const device = duckerDevice(view)
  if (!device) throw new ToolError('unavailable', 'no ducker to set')
  return {
    operations: [{ type: 'device.setParam', device, param: 'depth', value: depth }],
    effects: [],
    result: { depth },
    label,
  }
}

function currentDuckDepth(view: ControllerView): number | undefined {
  const device = duckerDevice(view)
  if (!device || !view.document) return undefined
  return findDevice(view.document.score, device)?.device.params.depth
}

// --- Steering -------------------------------------------------------------------------

function canSteerViaSession(view: ControllerView): boolean {
  const session = view.session
  if (session.steer) return true
  return (
    session.replaceUpcoming !== undefined &&
    view.library().length > 0 &&
    session.describe?.().nowPlaying !== undefined
  )
}

function canSteerViaScore(view: ControllerView): boolean {
  const owner = musicOwner(view)
  if (!owner || !view.document) return false
  const track = findTrack(view.document.score, owner)
  return track?.kind === 'audio' && view.library().length > 0
}

interface SteerRequest {
  direction: SteerDirection
  /** Explicit ladder target (set_intensity); derived from the direction otherwise. */
  targetIntensity?: number
}

function planSteer(ctx: ToolContext, request: SteerRequest, label: string): ToolPlan {
  const { view } = ctx
  const session = view.session
  const maxDelta = Math.max(0, view.headroomSec())
  const outcomeResult = (outcome: SteerOutcome, target: number): Record<string, unknown> => ({
    direction: request.direction,
    targetIntensity: target,
    nowPlaying: outcome.nowPlaying,
    boundaryShiftSec: Math.round(outcome.boundaryShiftSec),
    ...(outcome.trackIds ? { trackIds: outcome.trackIds } : {}),
  })

  const steer = session.steer
  if (steer) {
    const now = session.describe?.().nowPlaying
    const target =
      request.targetIntensity ?? targetIntensity(now?.intensity ?? MIN_INTENSITY, request.direction)
    return {
      operations: [],
      effects: [
        () => {
          const outcome = steer(request.direction, target)
          if (!outcome) {
            throw new ToolError('rejected', 'no replacement music is available right now')
          }
          view.noteGrowth(outcome.boundaryShiftSec)
          return outcomeResult(outcome, target)
        },
      ],
      result: { direction: request.direction, targetIntensity: target },
      label,
    }
  }

  const state = session.describe?.()
  const now = state?.nowPlaying
  const replaceUpcoming = session.replaceUpcoming
  if (replaceUpcoming && now) {
    const target = request.targetIntensity ?? targetIntensity(now.intensity, request.direction)
    const picks = resolveReplacementTracks({
      library: view.library(),
      currentTrack: { intensity: now.intensity, camelot: now.camelot },
      direction: request.direction,
      targetIntensity: target,
      excludeIds: [...(session.playedIds?.() ?? []), now.id],
      remainingSeconds: state?.sectionRemainingSec ?? now.remainingSec ?? 1,
    })
    if (picks.length === 0) {
      throw new ToolError('rejected', 'no replacement music is available right now')
    }
    const outcome: SteerOutcome = {
      nowPlaying: picks[0].title,
      boundaryShiftSec: 0,
      trackIds: picks.map((pick) => pick.id),
    }
    return {
      operations: [],
      effects: [
        () => {
          const shift = replaceUpcoming(picks, maxDelta)
          const applied = Number.isFinite(shift) && shift > 0 ? shift : 0
          view.noteGrowth(applied)
          return outcomeResult({ ...outcome, boundaryShiftSec: applied }, target)
        },
      ],
      result: outcomeResult(outcome, target),
      label,
    }
  }

  const compiled = compileSteerToScore(ctx, request, maxDelta)
  return {
    operations: compiled.operations,
    effects: [
      () => {
        view.noteGrowth(compiled.outcome.boundaryShiftSec)
      },
    ],
    result: outcomeResult(compiled.outcome, compiled.target),
    label,
  }
}

interface CompiledSteer {
  operations: Operation[]
  outcome: SteerOutcome
  target: number
}

/**
 * The score path: the music track's clip sounding now anchors the ladder;
 * the remainder of the arrangement on that track (to its last clip's end) is
 * replaced by full library tracks chained with crossfades, so the end moves
 * out by the boundary shift (capped by `maxDelta`, truncating only the last
 * clip). Sources the score lacks are added first.
 */
export function compileSteerToScore(
  ctx: ToolContext,
  request: SteerRequest,
  maxDelta: number,
): CompiledSteer {
  const { view } = ctx
  const document = view.document
  const owner = musicOwner(view)
  if (!document || !owner) throw new ToolError('unavailable', 'no music track to steer')
  const score = document.score
  const track = findTrack(score, owner)
  if (track?.kind !== 'audio') throw new ToolError('unavailable', 'no music track to steer')
  const library = view.library()
  const byId = new Map(library.map((item) => [String(item.id), item]))
  const nowSec = view.nowSec()

  const sounding = track.clips
    .filter((clip) => clip.startSec <= nowSec && nowSec < clip.startSec + clip.durationSec)
    .sort((a, b) => b.startSec - a.startSec)[0]
  const current = sounding ? byId.get(sounding.sourceId) : undefined
  const anchor = current
    ? { intensity: current.intensity, camelot: current.camelot }
    : { intensity: MIN_INTENSITY, camelot: 'Unknown' }
  const target = request.targetIntensity ?? targetIntensity(anchor.intensity, request.direction)
  const boundary = track.clips.reduce(
    (end, clip) => Math.max(end, clip.startSec + clip.durationSec),
    nowSec,
  )
  const picks = resolveReplacementTracks({
    library,
    currentTrack: anchor,
    direction: request.direction,
    targetIntensity: target,
    excludeIds: [
      ...track.clips.map((clip) => clip.sourceId),
      ...(view.session.playedIds?.() ?? []),
    ],
    remainingSeconds: Math.max(1, boundary - nowSec),
  })
  if (picks.length === 0) {
    throw new ToolError('rejected', 'no replacement music is available right now')
  }

  const clips: Clip[] = []
  let start = nowSec
  for (const pick of picks) {
    if (boundary - start <= 0 && clips.length > 0) break
    clips.push({
      id: `agent-${String(pick.id)}-${Math.round(start * 1000)}`,
      sourceId: String(pick.id),
      startSec: start,
      offsetSec: 0,
      durationSec: pick.durationSec,
      fadeInSec: clips.length === 0 ? STEER_CROSSFADE_SECONDS : CROSSFADE_SECONDS,
      fadeOutSec: CROSSFADE_SECONDS,
      fadeCurve: 'equalPower',
      gainDb: pick.gainDb ?? 0,
    })
    if (start + pick.durationSec >= boundary) break
    start = start + pick.durationSec - CROSSFADE_SECONDS
  }
  const last = clips[clips.length - 1]
  let newEnd = last.startSec + last.durationSec
  const allowed = boundary + maxDelta
  if (newEnd > allowed) {
    last.durationSec = Math.max(CROSSFADE_SECONDS * 2, allowed - last.startSec)
    newEnd = last.startSec + last.durationSec
  }

  const operations: Operation[] = []
  for (const clip of clips) {
    if (score.sources.some((source) => source.id === clip.sourceId)) continue
    const item = byId.get(clip.sourceId)
    if (!item) continue
    operations.push({
      type: 'source.add',
      source: {
        id: clip.sourceId,
        ...(item.url ? { url: item.url } : {}),
        durationSec: item.durationSec,
        analysis: { title: item.title, intensity: item.intensity, camelot: item.camelot },
      },
    })
  }
  if (sounding) {
    const fadeEnd = nowSec + STEER_CROSSFADE_SECONDS
    if (sounding.startSec + sounding.durationSec > fadeEnd) {
      operations.push({
        type: 'clip.trim',
        track: owner,
        id: sounding.id,
        durationSec: fadeEnd - sounding.startSec,
      })
    }
    operations.push({
      type: 'clip.update',
      track: owner,
      id: sounding.id,
      patch: { fadeOutSec: STEER_CROSSFADE_SECONDS },
    })
  }
  operations.push({ type: 'clip.replaceFrom', track: owner, fromSec: nowSec, clips })

  return {
    operations: [{ type: 'batch', ops: operations, label: `steer ${request.direction}` }],
    outcome: {
      nowPlaying: picks[0].title,
      boundaryShiftSec: Math.max(0, newEnd - boundary),
      trackIds: clips.map((clip) => clip.sourceId),
    },
    target,
  }
}

// --- The tools -------------------------------------------------------------------------

const setMusicVolume: ToolSpec = {
  definition: {
    name: 'set_music_volume',
    description:
      'Set the music level, 0.0 silent to 1.0 full. Call only when the listener says the music is too loud or too quiet.',
    parameters: params({ level: level('Music level 0..1.') }),
    category: 'intent',
  },
  available: (view) => view.session.setMusicVolume !== undefined || musicOwner(view) !== null,
  plan: (args, ctx) => planRoleLevel(ctx, 'music', args.level as number, 'set music volume'),
}

const setAmbience: ToolSpec = {
  definition: {
    name: 'set_ambience',
    description: 'Set the ambience (nature bed) level, 0.0 off to 1.0 full.',
    parameters: params({ level: level('Ambience level 0..1.') }),
    category: 'intent',
  },
  available: (view) => view.session.setAmbience !== undefined || ambienceOwner(view) !== null,
  plan: (args, ctx) => planRoleLevel(ctx, 'ambience', args.level as number, 'set ambience'),
}

const duck: ToolSpec = {
  definition: {
    name: 'duck',
    description:
      'Softer under the voice: how deeply the music dips while the coach speaks, 0 (no dip) to 1 (silent under speech).',
    parameters: params({ depth: level('Duck depth 0..1.') }),
    category: 'intent',
  },
  available: (view) => view.session.setDuckDepth !== undefined || duckerDevice(view) !== null,
  plan: (args, ctx) => planDuck(ctx, args.depth as number, 'duck'),
}

const steerMusic: ToolSpec = {
  definition: {
    name: 'steer_music',
    description:
      'Change the music to a different track: calmer or stronger (more-intense) steps the intensity ladder, change keeps it, brighter/darker keep it and lean major/minor on the Camelot wheel. Replacement tracks are key-compatible and play in full, so the current part may grow — the result says by how much. Call only when the listener explicitly asks for different music.',
    parameters: params({
      direction: {
        type: 'string',
        enum: [...STEER_DIRECTIONS],
        description: 'Where to take the music.',
      },
    }),
    category: 'intent',
  },
  available: (view) => canSteerViaSession(view) || canSteerViaScore(view),
  plan: (args, ctx) =>
    planSteer(
      ctx,
      { direction: args.direction as SteerDirection },
      `steer ${String(args.direction)}`,
    ),
}

const setIntensity: ToolSpec = {
  definition: {
    name: 'set_intensity',
    description:
      'Move the music to a rung of the intensity ladder: 1 grounding, 2 settled, 3 active. Key-compatible full tracks replace the remainder of the current part.',
    parameters: params({
      level: {
        type: 'integer',
        minimum: MIN_INTENSITY,
        maximum: MAX_INTENSITY,
        description: `Target intensity ${INTENSITY_LADDER.join('/')}.`,
      },
    }),
    category: 'intent',
  },
  available: (view) => canSteerViaSession(view) || canSteerViaScore(view),
  plan: (args, ctx) => {
    const target = clampIntensity(args.level as number)
    const now = ctx.view.session.describe?.().nowPlaying
    const direction: SteerDirection =
      now === undefined || target === now.intensity
        ? 'change'
        : target < now.intensity
          ? 'calmer'
          : 'stronger'
    const plan = planSteer(ctx, { direction, targetIntensity: target }, `set intensity ${target}`)
    return { ...plan, result: { ...plan.result, level: target } }
  },
}

const matchKey: ToolSpec = {
  definition: {
    name: 'match_key',
    description:
      'Rank candidate tracks by how well their Camelot key sits with an anchor key: exact or neighbouring keys first, then the smallest pitch shift (in semitones) that would make them compatible.',
    parameters: params(
      {
        anchor: { type: 'string', description: "Anchor Camelot code, e.g. '8A'." },
        candidates: {
          type: 'array',
          minItems: 1,
          maxItems: 50,
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Your id for the track.' },
              camelot: { type: 'string', description: 'Camelot code.' },
            },
            required: ['id', 'camelot'],
            additionalProperties: false,
          },
        },
        maxSemitones: {
          type: 'integer',
          minimum: 0,
          maximum: 6,
          description: 'Largest pitch shift to consider. Default 3.',
        },
      },
      ['anchor', 'candidates'],
    ),
    category: 'query',
  },
  available: () => true,
  plan: (args) => {
    const anchor = args.anchor as string
    const candidates = args.candidates as { id: string; camelot: string }[]
    const ranked = rankByKeyMatch(anchor, candidates, {
      maxSemitones: args.maxSemitones as number | undefined,
    }).map(({ candidate, match }) => ({
      id: candidate.id,
      camelot: candidate.camelot,
      semitones: match?.semitones ?? null,
      distance: match?.distance ?? null,
      compatible: match !== null && match.semitones === 0,
    }))
    return { operations: [], effects: [], result: { anchor, ranked }, label: 'match key' }
  },
}

const extendSection: ToolSpec = {
  definition: {
    name: 'extend_section',
    description:
      'Give the current part more time. Call when the listener is deep in the work and needs longer. Max 300 seconds per call; the result reports the seconds actually added.',
    parameters: params({
      seconds: {
        type: 'integer',
        minimum: 1,
        description: 'Seconds to add; more than 300 is capped at 300.',
      },
    }),
    category: 'intent',
  },
  available: (view) => view.session.extendSection !== undefined,
  plan: (args, ctx) => {
    const { view } = ctx
    const extend = view.session.extendSection
    if (!extend) throw new ToolError('unavailable', 'the session cannot extend sections')
    const requested = args.seconds as number
    const granted = view.rails.clampExtend(requested, view.headroomSec(), ctx.notes)
    if (granted <= 0) throw new ToolError('rejected', 'the session has no headroom left to extend')
    return {
      operations: [],
      effects: [
        () => {
          const applied = extend(granted)
          const seconds = Number.isFinite(applied) && applied > 0 ? applied : 0
          view.noteGrowth(seconds)
          return { appliedSec: Math.round(seconds) }
        },
      ],
      result: { requestedSec: requested, grantedSec: granted, appliedSec: granted },
      label: `extend section ${granted} s`,
    }
  },
}

const advanceSection: ToolSpec = {
  definition: {
    name: 'advance_section',
    description:
      'Move to the next part early. Call when the listener is done with this part or the intensity is too much and they need integration now.',
    parameters: noArgs,
    category: 'intent',
  },
  available: (view) => view.session.advanceSection !== undefined,
  plan: (_args, ctx) => {
    const advance = ctx.view.session.advanceSection
    if (!advance) throw new ToolError('unavailable', 'the session cannot advance sections')
    return {
      operations: [],
      effects: [() => ({ sectionIndex: advance() })],
      result: { sectionIndex: (ctx.view.session.describe?.().sectionIndex ?? 0) + 1 },
      label: 'advance section',
    }
  },
}

const setBreathPace: ToolSpec = {
  definition: {
    name: 'set_breath_pace',
    description:
      'Slow down or speed up the guided breathing rhythm (and the on-screen breath). Takes effect immediately and never changes the music; prefer slower over pushing through.',
    parameters: params({
      direction: { type: 'string', enum: ['slower', 'faster'] },
    }),
    category: 'intent',
  },
  available: (view) => view.session.setBreathPace !== undefined,
  plan: (args, ctx) => {
    const setPace = ctx.view.session.setBreathPace
    if (!setPace) throw new ToolError('unavailable', 'the session has no breath pace')
    const direction = args.direction as 'slower' | 'faster'
    return {
      operations: [],
      effects: [() => ({ paceMultiplier: setPace(direction) })],
      result: { direction },
      label: `breath pace ${direction}`,
    }
  },
}

const fadeOut: ToolSpec = {
  definition: {
    name: 'fade_out',
    description:
      'Fade the whole mix to silence over a few seconds and stop — the end of the session. Never a hard cut.',
    parameters: params({
      seconds: { type: 'number', minimum: 0, maximum: 120, description: 'Fade length in seconds.' },
    }),
    category: 'intent',
  },
  available: (view) => view.session.fadeOut !== undefined || view.engine !== null,
  plan: (args, ctx) => {
    const { view } = ctx
    const seconds = view.rails.clampFade(args.seconds as number, ctx.notes)
    const fade = view.session.fadeOut
    const engine = view.engine
    if (!fade && !engine) throw new ToolError('unavailable', 'nothing to fade')
    return {
      operations: [],
      effects: [
        () => {
          if (fade) fade(seconds)
          else engine?.stop({ fadeSec: seconds })
        },
      ],
      result: { seconds },
      label: `fade out ${seconds} s`,
    }
  },
}

/** −3 dB on the music and a slightly deeper duck: room for the voice. */
export const MORE_SPACE_MUSIC_DB = -3
export const MORE_SPACE_DUCK_STEP = 0.1

const moreSpace: ToolSpec = {
  definition: {
    name: 'more_space',
    description:
      'Make room for the voice: the music comes down 3 dB and dips a little deeper under speech.',
    parameters: noArgs,
    category: 'intent',
  },
  available: (view) => setMusicVolume.available(view),
  plan: (_args, ctx) => {
    const { view } = ctx
    const current = currentMusicLevel(view) ?? 1
    const music = planRoleLevel(ctx, 'music', current * dbToGain(MORE_SPACE_MUSIC_DB), 'more space')
    const plan: ToolPlan = {
      operations: [...music.operations],
      effects: [...music.effects.map((effect) => () => renameKey(effect(), 'level', 'musicLevel'))],
      result: { musicLevel: music.result.level },
      label: 'more space',
    }
    if (duck.available(view)) {
      const depth = currentDuckDepth(view) ?? 0.5
      const ducked = planDuck(ctx, depth + MORE_SPACE_DUCK_STEP, 'more space')
      plan.operations.push(...ducked.operations)
      plan.effects.push(
        ...ducked.effects.map((effect) => () => renameKey(effect(), 'depth', 'duckDepth')),
      )
      plan.result.duckDepth = ducked.result.depth
    }
    return plan
  },
}

function renameKey(
  fragment: Record<string, unknown> | void,
  from: string,
  to: string,
): Record<string, unknown> | void {
  if (!fragment || !(from in fragment)) return fragment
  const { [from]: value, ...rest } = fragment
  return { ...rest, [to]: value }
}

const getState: ToolSpec = {
  definition: {
    name: 'get_state',
    description:
      'The current state of the mix for you to read: transport, section, what is playing, levels, meters, recent changes.',
    parameters: noArgs,
    category: 'query',
  },
  available: () => true,
  plan: (_args, ctx) => ({
    operations: [],
    effects: [],
    result: { ...ctx.view.snapshot() },
    label: 'get state',
  }),
}

const undo: ToolSpec = {
  definition: {
    name: 'undo',
    description:
      'Revert one of your earlier calls (the latest applied one when no callId is given) by applying the inverse of every operation it made.',
    parameters: params(
      { callId: { type: 'integer', minimum: 1, description: 'The call to revert.' } },
      [],
    ),
    category: 'control',
  },
  available: (view) => view.document !== null,
  plan: (args, ctx) => {
    const { view } = ctx
    const entry =
      args.callId !== undefined
        ? view.audit.find(args.callId as number)
        : view.audit.lastApplied(ctx.author)
    if (!entry) throw new ToolError('rejected', 'nothing to undo')
    if (entry.outcome !== 'applied' || entry.operations.length === 0) {
      throw new ToolError('rejected', `call ${entry.callId} applied no operations`)
    }
    if (entry.undoneBy !== undefined) {
      throw new ToolError(
        'rejected',
        `call ${entry.callId} was already undone by ${entry.undoneBy}`,
      )
    }
    const target = entry
    return {
      operations: [...entry.inverses].reverse(),
      effects: [
        () => {
          target.undoneBy = ctx.callId
        },
      ],
      result: { undone: entry.callId, tool: entry.tool, operations: entry.operations.length },
      label: `undo ${entry.tool} (#${entry.callId})`,
    }
  },
}

/** The intent, query and control tools, in catalogue order. */
export function intentTools(): ToolSpec[] {
  return [
    setMusicVolume,
    setAmbience,
    duck,
    steerMusic,
    setIntensity,
    matchKey,
    extendSection,
    advanceSection,
    setBreathPace,
    fadeOut,
    moreSpace,
    getState,
    undo,
  ]
}
