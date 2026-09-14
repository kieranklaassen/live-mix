// `compileScript`: a session script plus a music library in, a score out —
// deterministically. What tuin's compose step does with pydub (concatenate
// the selected tracks per part, overlay each voice clip at its time code,
// music 6 dB under the voice) becomes arrangement on four tracks of one score:
// music clips chained with crossfades, voice clips from a `VoiceProvider`,
// a ducking lane on the music fader around every cue, an optional ambience
// bed, and a breath-guide lane shaped by the breathing pattern. The same
// score then plays live through `loadScore` or bounces through
// `renderScore` (R22): one document, two renderers.

import { type Clip } from '../../core/clips/Clip'
import { type Breakpoint, type LaneCurve } from '../../core/automation/ParamLane'
import { dbToGain } from '../../core/devices/native/units'
import { ENV_ATTACK_MS, ENV_RELEASE_MS } from '../../core/devices/native/Ducker'
import { CROSSFADE_SECONDS } from '../../core/tracks/AudioTrack'
import { apply, type Operation } from '../../score/operations'
import {
  createScore,
  defaultStrip,
  masterDestination,
  type Score,
  type ScoreAudioTrack,
  type ScoreLane,
  type ScoreSource,
} from '../../score/schema'
import { type AgentTrack } from '../types'
import {
  SECTION_NUMBER_BY_ROLE,
  breathCycleSec,
  type BreathingPattern,
  type CueKind,
  type HoldKind,
  type SectionRole,
  type SessionScript,
} from './script'
import {
  selectTracksForSection,
  pythonChooser,
  type SectionSelection,
  type SessionSelection,
  type TrackChooser,
} from './selector'
import { cueKey, estimatedVoiceProvider, type VoiceProvider } from './voice'

// --- Constants (the tuin compose step's numbers, and the library's) -----------------------

/** Seconds after a part's music starts before its first cue may begin (tuin `buffer_seconds`). */
export const SCRIPT_CUE_BUFFER_SECONDS = 7
/** Smallest silence between two cues (tuin: "at least 2 seconds after previous"). */
export const SCRIPT_CUE_GAP_SECONDS = 2
/** Music under the voice, in dB (tuin `music_volume_reduction_db`). */
export const SCRIPT_MUSIC_DB = -6
/** How much further the music dips while a cue plays. */
export const SCRIPT_DUCK_DB = -6
export const SCRIPT_DUCK_ATTACK_SECONDS = ENV_ATTACK_MS / 1000
export const SCRIPT_DUCK_RELEASE_SECONDS = ENV_RELEASE_MS / 1000
/** The dip stays down this long after a cue ends before releasing. */
export const SCRIPT_DUCK_HOLD_SECONDS = 0.25
/** Fade-in of a part's music when a part boundary is cut to the script (pydub `fade_in(2000)`). */
export const SCRIPT_SECTION_FADE_IN_SECONDS = 2
/** Fade-out of music trimmed at a part boundary (pydub `fade_out(3000)`). */
export const SCRIPT_TRIM_FADE_OUT_SECONDS = 3
export const SCRIPT_SESSION_FADE_IN_SECONDS = 2
export const SCRIPT_SESSION_FADE_OUT_SECONDS = 4
export const SCRIPT_VOICE_FADE_IN_SECONDS = 0.02
export const SCRIPT_VOICE_FADE_OUT_SECONDS = 0.08

export type ScriptTrackRole = 'music' | 'voice' | 'ambience' | 'breathGuide'

/** Track ids the compiler writes; consumers map roles to them. */
export const SCRIPT_TRACK_IDS: Readonly<Record<ScriptTrackRole, string>> = {
  music: 'music',
  voice: 'voice',
  ambience: 'ambience',
  breathGuide: 'breath-guide',
}

export const SCRIPT_LANE_IDS = {
  duck: 'music-duck',
  breathGuide: 'breath-guide-envelope',
} as const

// --- Options -----------------------------------------------------------------------------

export interface CompileMix {
  /** Music fader in dB. Default −6 (tuin). */
  musicDb?: number
  /** Voice fader in dB. Default 0. */
  voiceDb?: number
  /** Ambience fader in dB. Default −18. */
  ambienceDb?: number
  /** Breath-guide fader in dB (the lane shapes 0..1 on top). Default −12. */
  breathGuideDb?: number
}

export interface DuckOptions {
  /** Extra dip under a cue, in dB. Default −6. */
  depthDb?: number
  attackSec?: number
  releaseSec?: number
  holdSec?: number
}

export interface AmbienceOptions {
  /** A streamable source (needs a `url`); loops under the whole session. */
  source: ScoreSource & { url: string }
  gainDb?: number
  fadeInSec?: number
  fadeOutSec?: number
}

export interface BreathGuideOptions {
  /** A noise/pad source looped under the envelope; without it the lane still exists for a consumer's own synth. */
  source?: ScoreSource & { url: string }
  /** `linear` (triangle swells, 2–4 events per breath) or `smooth` (half-cosine, 16 sub-ramps per segment). Default linear. */
  curve?: 'linear' | 'smooth'
}

export interface CompileScriptOptions {
  /** CPython-compatible seed for music selection. Default 0. */
  seed?: number | bigint
  /** Replaces the seeded chooser. */
  chooser?: TrackChooser<AgentTrack>
  /** Voice assets per cue. Default: estimated durations, `voice://estimate/<key>` URLs. */
  voice?: VoiceProvider
  /**
   * `music` (default, tuin): a part lasts as long as its selected tracks; cues
   * follow the music. `script`: a part lasts exactly `durationSec`; music
   * trimmed with a fade at the boundary.
   */
  fit?: 'music' | 'script'
  /** Overlap between consecutive music clips. Default `CROSSFADE_SECONDS`. */
  crossfadeSec?: number
  cueBufferSec?: number
  cueGapSec?: number
  mix?: CompileMix
  /** `false` disables the ducking lane. */
  duck?: DuckOptions | false
  ambience?: AmbienceOptions
  /** `false` disables the breath-guide track and lane. */
  breathGuide?: BreathGuideOptions | false
  sessionFadeInSec?: number
  sessionFadeOutSec?: number
  /** Score id. Default the script's id, else `session`. */
  scoreId?: string
  /** Override the track ids. */
  ids?: Partial<Record<ScriptTrackRole, string>>
}

// --- Result ------------------------------------------------------------------------------

export type CompileWarningCode =
  'section-no-music' | 'section-music-short' | 'cue-overflow' | 'cue-shifted'

export interface CompileWarning {
  code: CompileWarningCode
  path: string
  message: string
}

export interface CompiledHold {
  kind: HoldKind
  startSec: number
  endSec: number
}

export interface CompiledCue {
  key: string
  sectionIndex: number
  cueIndex: number
  kind: CueKind
  text: string
  /** Absolute timeline position. */
  atSec: number
  durationSec: number
  endSec: number
  /** How far the minimum-gap rule pushed it past its scripted time. */
  shiftedSec: number
  url: string
  sourceId: string
}

export interface CompiledSection {
  index: number
  role: SectionRole
  name: string
  startSec: number
  endSec: number
  /** The script's target. */
  targetDurationSec: number
  /** Summed track durations (the selector's number, tuin parity). */
  musicDurationSec: number
  tracks: AgentTrack[]
  cueKeys: string[]
  holds: CompiledHold[]
}

export interface CompiledScript {
  score: Score
  /** Where the render ends: the later of the music and the last cue. */
  durationSec: number
  sections: CompiledSection[]
  cues: CompiledCue[]
  selection: SessionSelection<AgentTrack>
  warnings: CompileWarning[]
}

// --- Selection over the script's own durations --------------------------------------------

/**
 * `select_songs_for_session` with each part filled to its own target instead
 * of a third of the total (identical when the parts are equal): grounding,
 * active, integration in order, each anchored on the previous part's last
 * pick, never repeating a track.
 */
export function selectTracksForScript(
  script: SessionScript,
  library: readonly AgentTrack[],
  options: Pick<CompileScriptOptions, 'seed' | 'chooser'> = {},
): SessionSelection<AgentTrack> {
  const chooser = options.chooser ?? pythonChooser<AgentTrack>(options.seed ?? 0)
  const used = new Set<string>()
  const sections: SectionSelection<AgentTrack>[] = []
  let previous: AgentTrack | undefined
  for (const section of script.sections) {
    const picked = selectTracksForSection(
      section.durationSec,
      SECTION_NUMBER_BY_ROLE[section.role],
      library,
      { previous, chooser, used },
    )
    sections.push(picked)
    previous = picked.tracks[picked.tracks.length - 1] ?? previous
  }
  const total = script.sections.reduce((sum, section) => sum + section.durationSec, 0)
  return {
    sections: sections as SessionSelection<AgentTrack>['sections'],
    usedIds: used,
    sectionTargetSec: Math.floor(total / 3),
  }
}

// --- The compiler ------------------------------------------------------------------------

/** The score only. */
export function compileScript(
  script: SessionScript,
  library: readonly AgentTrack[],
  options: CompileScriptOptions = {},
): Score {
  return compileScriptDetailed(script, library, options).score
}

/** The score with its timeline, the selection and the compiler's warnings. */
export function compileScriptDetailed(
  script: SessionScript,
  library: readonly AgentTrack[],
  options: CompileScriptOptions = {},
): CompiledScript {
  const ids = { ...SCRIPT_TRACK_IDS, ...options.ids }
  const fit = options.fit ?? 'music'
  const crossfade = Math.max(0, options.crossfadeSec ?? CROSSFADE_SECONDS)
  const buffer = options.cueBufferSec ?? SCRIPT_CUE_BUFFER_SECONDS
  const gap = options.cueGapSec ?? SCRIPT_CUE_GAP_SECONDS
  const mix = {
    musicDb: SCRIPT_MUSIC_DB,
    voiceDb: 0,
    ambienceDb: -18,
    breathGuideDb: -12,
    ...options.mix,
  }
  const voice = options.voice ?? estimatedVoiceProvider()
  const warnings: CompileWarning[] = []
  const selection = selectTracksForScript(script, library, options)

  // Music: one continuous chain of full tracks, part boundaries where a part's first clip starts.
  const musicClips: Clip[] = []
  const sections: CompiledSection[] = []
  const sessionFadeIn = options.sessionFadeInSec ?? SCRIPT_SESSION_FADE_IN_SECONDS
  const sessionFadeOut = options.sessionFadeOutSec ?? SCRIPT_SESSION_FADE_OUT_SECONDS
  let cursor = 0
  let previousEnd = 0
  script.sections.forEach((section, index) => {
    const picked = selection.sections[index]
    const start = index === 0 ? 0 : fit === 'music' ? Math.max(0, previousEnd - crossfade) : cursor
    const musicDurationSec = picked.totalDurationSec
    let clipCursor = start
    let end = start
    const firstFadeIn =
      index === 0 ? sessionFadeIn : fit === 'script' ? SCRIPT_SECTION_FADE_IN_SECONDS : crossfade
    picked.tracks.forEach((track, position) => {
      const clip: Clip = {
        id: `music-s${index + 1}-${position + 1}`,
        sourceId: String(track.id),
        startSec: round(clipCursor),
        offsetSec: 0,
        durationSec: track.durationSec,
        fadeInSec: position === 0 ? firstFadeIn : crossfade,
        fadeOutSec: crossfade,
        fadeCurve: 'equalPower',
        gainDb: track.gainDb ?? 0,
      }
      musicClips.push(clip)
      end = clip.startSec + clip.durationSec
      clipCursor = end - crossfade
    })
    if (picked.tracks.length === 0) {
      end = start + section.durationSec
      warnings.push({
        code: 'section-no-music',
        path: `sections[${index}]`,
        message: `no unused track fits "${section.name}"; the part plays in silence for ${section.durationSec} s`,
      })
    }
    if (fit === 'script') {
      const boundary = start + section.durationSec
      for (let i = musicClips.length - 1; i >= 0; i -= 1) {
        const clip = musicClips[i]
        if (clip.startSec < start) break
        if (clip.startSec >= boundary) {
          musicClips.splice(i, 1)
          continue
        }
        if (clip.startSec + clip.durationSec > boundary) {
          clip.durationSec = round(boundary - clip.startSec)
          clip.fadeOutSec = Math.min(SCRIPT_TRIM_FADE_OUT_SECONDS, clip.durationSec / 2)
        }
      }
      if (picked.tracks.length > 0 && end < boundary) {
        warnings.push({
          code: 'section-music-short',
          path: `sections[${index}]`,
          message: `the music for "${section.name}" ends ${round(boundary - end)} s before the part does`,
        })
      }
      end = boundary
    }
    sections.push({
      index,
      role: section.role,
      name: section.name,
      startSec: round(start),
      endSec: round(end),
      targetDurationSec: section.durationSec,
      musicDurationSec,
      tracks: [...picked.tracks],
      cueKeys: [],
      holds: (section.holds ?? []).map((hold) => ({
        kind: hold.kind,
        startSec: round(start + buffer + hold.atSec),
        endSec: round(start + buffer + hold.atSec + hold.durationSec),
      })),
    })
    previousEnd = end
    cursor = end
  })
  if (musicClips.length > 0) {
    const last = musicClips[musicClips.length - 1]
    last.fadeOutSec = Math.min(Math.max(sessionFadeOut, last.fadeOutSec), last.durationSec / 2)
  }
  const musicEnd = sections.length > 0 ? sections[sections.length - 1].endSec : 0

  // Voice: each cue at its part's start + buffer + its time, never closer than the gap.
  const cues: CompiledCue[] = []
  const voiceClips: Clip[] = []
  const voiceSources = new Map<string, ScoreSource>()
  script.sections.forEach((section, sectionIndex) => {
    const placed = sections[sectionIndex]
    let lastEnd = -Infinity
    section.cues.forEach((cue, cueIndex) => {
      const key = cueKey(sectionIndex, cueIndex)
      const asset = voice.asset({ script, sectionIndex, section, cueIndex, cue, key })
      const scheduled = placed.startSec + buffer + cue.atSec
      const at = round(Math.max(scheduled, lastEnd + gap))
      const durationSec = round(Math.max(0.05, asset.durationSec))
      const endSec = round(at + durationSec)
      const sourceId = asset.id ?? `voice:${key}`
      if (!voiceSources.has(sourceId)) {
        voiceSources.set(sourceId, { id: sourceId, url: asset.url, durationSec })
      }
      if (at > scheduled) {
        warnings.push({
          code: 'cue-shifted',
          path: `sections[${sectionIndex}].cues[${cueIndex}]`,
          message: `cue ${key} moved ${round(at - scheduled)} s later to keep ${gap} s after the previous cue`,
        })
      }
      if (endSec > placed.endSec) {
        warnings.push({
          code: 'cue-overflow',
          path: `sections[${sectionIndex}].cues[${cueIndex}]`,
          message: `cue ${key} ends ${round(endSec - placed.endSec)} s after the music of "${section.name}"`,
        })
      }
      cues.push({
        key,
        sectionIndex,
        cueIndex,
        kind: cue.kind ?? 'cue',
        text: cue.text,
        atSec: at,
        durationSec,
        endSec,
        shiftedSec: round(at - scheduled),
        url: asset.url,
        sourceId,
      })
      placed.cueKeys.push(key)
      voiceClips.push({
        id: `voice-${key}`,
        sourceId,
        startSec: at,
        offsetSec: 0,
        durationSec,
        fadeInSec: SCRIPT_VOICE_FADE_IN_SECONDS,
        fadeOutSec: SCRIPT_VOICE_FADE_OUT_SECONDS,
        fadeCurve: 'linear',
        gainDb: 0,
      })
      lastEnd = endSec
    })
  })
  const voiceEnd = cues.reduce((end, cue) => Math.max(end, cue.endSec), 0)
  const durationSec = round(Math.max(musicEnd, voiceEnd > 0 ? voiceEnd + 1 : 0))

  // The document.
  const score = createScore({ id: options.scoreId ?? script.id ?? 'session', name: script.title })
  const sources = new Map<string, ScoreSource>()
  for (const track of selection.sections.flatMap((section) => section.tracks)) {
    const id = String(track.id)
    if (sources.has(id)) continue
    const analysis: Record<string, unknown> = {
      title: track.title,
      intensity: track.intensity,
      camelot: track.camelot,
    }
    if (track.energy !== undefined) analysis.energy = track.energy
    if (track.gainDb !== undefined) analysis.gainDb = track.gainDb
    sources.set(id, {
      id,
      ...(track.url ? { url: track.url } : {}),
      durationSec: track.durationSec,
      analysis,
    })
  }
  for (const source of voiceSources.values()) sources.set(source.id, source)

  const musicBase = dbToGain(mix.musicDb)
  const music: ScoreAudioTrack = {
    kind: 'audio',
    id: ids.music,
    name: 'Music',
    destination: masterDestination(),
    strip: defaultStrip({ level: musicBase }),
    clips: musicClips,
  }
  const voiceTrack: ScoreAudioTrack = {
    kind: 'audio',
    id: ids.voice,
    name: 'Voice',
    destination: masterDestination(),
    strip: defaultStrip({ level: dbToGain(mix.voiceDb) }),
    clips: voiceClips,
  }
  score.tracks = [music, voiceTrack]
  const lanes: ScoreLane[] = []

  if (options.duck !== false && cues.length > 0) {
    lanes.push({
      id: SCRIPT_LANE_IDS.duck,
      target: { kind: 'strip', owner: ids.music, param: 'level' },
      defaultValue: musicBase,
      breakpoints: duckBreakpoints(cues, musicBase, options.duck ?? {}),
    })
  }

  if (options.ambience) {
    const { source } = options.ambience
    sources.set(source.id, {
      id: source.id,
      url: source.url,
      ...(source.durationSec !== undefined ? { durationSec: source.durationSec } : {}),
      ...(source.analysis ? { analysis: { ...source.analysis } } : {}),
    })
    score.tracks.push({
      kind: 'audio',
      id: ids.ambience,
      name: 'Ambience',
      destination: masterDestination(),
      strip: defaultStrip({ level: dbToGain(mix.ambienceDb) }),
      clips: [
        {
          id: 'ambience-bed',
          sourceId: source.id,
          startSec: 0,
          offsetSec: 0,
          durationSec,
          fadeInSec: options.ambience.fadeInSec ?? 4,
          fadeOutSec: options.ambience.fadeOutSec ?? 6,
          fadeCurve: 'equalPower',
          gainDb: options.ambience.gainDb ?? 0,
          loop: true,
        },
      ],
    })
  }

  if (options.breathGuide !== false) {
    const guide = options.breathGuide ?? {}
    const clips: Clip[] = []
    if (guide.source) {
      sources.set(guide.source.id, {
        id: guide.source.id,
        url: guide.source.url,
        ...(guide.source.durationSec !== undefined
          ? { durationSec: guide.source.durationSec }
          : {}),
      })
      clips.push({
        id: 'breath-guide-bed',
        sourceId: guide.source.id,
        startSec: 0,
        offsetSec: 0,
        durationSec,
        fadeInSec: 1,
        fadeOutSec: 2,
        fadeCurve: 'equalPower',
        gainDb: 0,
        loop: true,
      })
    }
    score.tracks.push({
      kind: 'audio',
      id: ids.breathGuide,
      name: 'Breath guide',
      destination: masterDestination(),
      strip: defaultStrip({ level: dbToGain(mix.breathGuideDb), inputGain: 0 }),
      clips,
    })
    lanes.push({
      id: SCRIPT_LANE_IDS.breathGuide,
      target: { kind: 'strip', owner: ids.breathGuide, param: 'inputGain' },
      defaultValue: 0,
      breakpoints: breathBreakpoints(script, sections, buffer, guide.curve ?? 'linear'),
    })
  }

  score.sources = [...sources.values()]
  score.lanes = lanes
  return { score, durationSec, sections, cues, selection, warnings }
}

// --- Lanes -------------------------------------------------------------------------------

/**
 * The ducking lane: around every cue the music fader falls from `base` to
 * `base · depth` over the attack, stays down through the cue and the hold,
 * and returns over the release. Cues closer than a release apart share one
 * dip. Exported for the visual (KD9: the UI draws the same breakpoints).
 */
export function duckBreakpoints(
  cues: readonly Pick<CompiledCue, 'atSec' | 'endSec'>[],
  base: number,
  options: DuckOptions = {},
): Breakpoint[] {
  const attack = options.attackSec ?? SCRIPT_DUCK_ATTACK_SECONDS
  const release = options.releaseSec ?? SCRIPT_DUCK_RELEASE_SECONDS
  const hold = options.holdSec ?? SCRIPT_DUCK_HOLD_SECONDS
  const ducked = base * dbToGain(options.depthDb ?? SCRIPT_DUCK_DB)
  const intervals: { from: number; to: number }[] = []
  for (const cue of [...cues].sort((a, b) => a.atSec - b.atSec)) {
    const from = Math.max(0, cue.atSec - attack)
    const to = cue.endSec + hold + release
    const last = intervals[intervals.length - 1]
    if (last && from <= last.to) last.to = Math.max(last.to, to)
    else intervals.push({ from, to })
  }
  const points: Breakpoint[] = []
  for (const { from, to } of intervals) {
    const down = Math.min(from + attack, to)
    const up = Math.max(to - release, down)
    points.push({ timeSec: round(from), value: base })
    points.push({ timeSec: round(down), value: ducked })
    if (up > down) points.push({ timeSec: round(up), value: ducked })
    points.push({ timeSec: round(to), value: base })
  }
  return points
}

interface BreathWindow {
  from: number
  to: number
  pattern: BreathingPattern
}

/**
 * The breath-guide envelope, 0..1: per part, breath cycles of the part's
 * pattern (or the pattern a cue switched to) from its start, silent through
 * the holds. Exported so a UI can draw exactly what the lane plays (KD9).
 */
export function breathBreakpoints(
  script: SessionScript,
  sections: readonly CompiledSection[],
  bufferSec: number,
  curve: 'linear' | 'smooth',
): Breakpoint[] {
  const points: Breakpoint[] = []
  const shape: LaneCurve | undefined = curve === 'smooth' ? 'smooth' : undefined
  const push = (timeSec: number, value: number, withCurve = false): void => {
    const point: Breakpoint = { timeSec: round(timeSec), value }
    if (withCurve && shape) point.curve = shape
    points.push(point)
  }
  script.sections.forEach((section, index) => {
    const placed = sections[index]
    const segments: { from: number; pattern: BreathingPattern }[] = [
      { from: placed.startSec, pattern: section.breathing },
    ]
    for (const cue of section.cues) {
      if (cue.breathing) {
        segments.push({ from: placed.startSec + bufferSec + cue.atSec, pattern: cue.breathing })
      }
    }
    segments.sort((a, b) => a.from - b.from)
    const windows: BreathWindow[] = []
    segments.forEach((segment, i) => {
      const segmentEnd = segments[i + 1]?.from ?? placed.endSec
      let from = Math.max(segment.from, placed.startSec)
      const holds = placed.holds.filter((hold) => hold.endSec > from && hold.startSec < segmentEnd)
      for (const hold of holds) {
        if (hold.startSec > from)
          windows.push({ from, to: hold.startSec, pattern: segment.pattern })
        from = Math.max(from, hold.endSec)
      }
      if (segmentEnd > from) windows.push({ from, to: segmentEnd, pattern: segment.pattern })
    })
    for (const window of windows) {
      const cycle = breathCycleSec(window.pattern)
      if (cycle <= 0) continue
      const { inhaleSec, exhaleSec } = window.pattern
      const holdIn = window.pattern.holdInSec ?? 0
      const holdOut = window.pattern.holdOutSec ?? 0
      // Rising segments carry the curve; flat holds and the fall to a hold-out do not.
      let t = window.from
      push(t, 0, true)
      while (t + inhaleSec <= window.to) {
        push(t + inhaleSec, 1, holdIn === 0)
        if (holdIn > 0) push(t + inhaleSec + holdIn, 1, true)
        const exhaleEnd = t + inhaleSec + holdIn + exhaleSec
        if (exhaleEnd > window.to) break
        push(exhaleEnd, 0, holdOut === 0)
        t += cycle
        if (holdOut > 0 && t <= window.to) push(t, 0, true)
      }
      push(window.to, 0)
    }
  })
  return points
}

// --- Loading a compiled score into a document ---------------------------------------------

export interface LoadOperationsOptions {
  /** Batch label. */
  label?: string
}

/**
 * The operations that turn `current` into a document carrying `target`'s
 * tracks, lanes and sources (and its name): existing tracks and lanes with the
 * same ids or parameter targets are removed first, sources are added when
 * absent. Everything else in `current` — the master, groups, returns, other
 * tracks — stays. Returned as one `batch` so it is one undo step.
 */
export function operationsToLoad(
  current: Score,
  target: Score,
  options: LoadOperationsOptions = {},
): Operation[] {
  const ops: Operation[] = []
  let working = current
  const push = (op: Operation): void => {
    working = apply(working, op)
    ops.push(op)
  }
  for (const track of target.tracks) {
    if (working.tracks.some((candidate) => candidate.id === track.id)) {
      push({ type: 'track.remove', id: track.id })
    }
  }
  for (const lane of target.lanes) {
    const clash = working.lanes.find(
      (candidate) =>
        candidate.id === lane.id ||
        (candidate.target.kind === lane.target.kind &&
          JSON.stringify(candidate.target) === JSON.stringify(lane.target)),
    )
    if (clash) push({ type: 'lane.remove', id: clash.id })
  }
  for (const source of target.sources) {
    if (!working.sources.some((candidate) => candidate.id === source.id)) {
      push({ type: 'source.add', source })
    }
  }
  for (const track of target.tracks) push({ type: 'track.add', track })
  for (const lane of target.lanes) push({ type: 'lane.add', lane })
  if (working.name !== target.name) push({ type: 'score.rename', name: target.name })
  if (working.transport.loop.enabled) push({ type: 'transport.loop', enabled: false })
  if (ops.length === 0) return []
  return [{ type: 'batch', ops, label: options.label ?? `load script "${target.name}"` }]
}

function round(seconds: number): number {
  return Math.round(seconds * 1000) / 1000
}
