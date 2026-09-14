// The compiler: a valid score every time, deterministic for the same input,
// music placed as the selector picked it with crossfades at every join, cues
// at part start + buffer + their time (never closer than the gap), a ducking
// lane around each cue, a breath-guide lane from the pattern that falls
// silent through the holds, ambience and fit modes, and the operations that
// load a compiled score into a live document.

import { describe, expect, it } from 'vitest'

import { CROSSFADE_SECONDS } from '../../../core/tracks/AudioTrack'
import { dbToGain } from '../../../core/devices/native/units'
import { ParamLane } from '../../../core/automation/ParamLane'
import { apply } from '../../../score/operations'
import {
  createScore,
  serializeScore,
  validateScore,
  type ScoreAudioTrack,
} from '../../../score/schema'
import { ScoreDocument } from '../../../score/ScoreDocument'
import { type AgentTrack } from '../../types'
import {
  SCRIPT_CUE_BUFFER_SECONDS,
  SCRIPT_CUE_GAP_SECONDS,
  SCRIPT_DUCK_ATTACK_SECONDS,
  SCRIPT_DUCK_HOLD_SECONDS,
  SCRIPT_DUCK_RELEASE_SECONDS,
  SCRIPT_LANE_IDS,
  SCRIPT_MUSIC_DB,
  SCRIPT_TRACK_IDS,
  compileScript,
  compileScriptDetailed,
  duckBreakpoints,
  operationsToLoad,
  selectTracksForScript,
} from '../compile'
import { selectTracksForSession } from '../selector'
import { type SessionScript } from '../script'
import {
  cueRefs,
  estimateSpeechSeconds,
  estimatedVoiceProvider,
  staticVoiceProvider,
  synthesizeVoice,
  type VoiceAsset,
} from '../voice'
import { shortLibrary, shortScript } from './fixtures'

/** Narrow away `undefined`/`null` in a fixture lookup. */
function must<T>(value: T | undefined | null, what = 'value'): T {
  if (value === undefined || value === null) throw new Error(`expected ${what}`)
  return value
}

function audioTrack(
  compiled: { score: { tracks: { id: string }[] } },
  id: string,
): ScoreAudioTrack {
  const track = compiled.score.tracks.find((candidate) => candidate.id === id)
  if (!track || (track as ScoreAudioTrack).kind !== 'audio') throw new Error(`no audio track ${id}`)
  return track as ScoreAudioTrack
}

describe('compileScript', () => {
  it('produces a valid format-2 score with music, voice and breath-guide tracks', () => {
    const compiled = compileScriptDetailed(shortScript(), shortLibrary())
    expect(validateScore(compiled.score)).toEqual([])
    expect(compiled.score.id).toBe('evening-grounding')
    expect(compiled.score.name).toBe('Evening grounding')
    expect(compiled.score.tracks.map((track) => track.id)).toEqual([
      SCRIPT_TRACK_IDS.music,
      SCRIPT_TRACK_IDS.voice,
      SCRIPT_TRACK_IDS.breathGuide,
    ])
    expect(compiled.score.lanes.map((lane) => lane.id)).toEqual([
      SCRIPT_LANE_IDS.duck,
      SCRIPT_LANE_IDS.breathGuide,
    ])
    expect(compiled.warnings).toEqual([])
    expect(compiled.cues).toHaveLength(11)
    expect(compiled.sections).toHaveLength(3)
    expect(compiled.durationSec).toBe(compiled.sections[2].endSec)
    expect(compileScript(shortScript(), shortLibrary())).toEqual(compiled.score)
  })

  it('is deterministic: the same script and library serialise to the same score', () => {
    const a = serializeScore(compileScript(shortScript(), shortLibrary()))
    const b = serializeScore(compileScript(shortScript(), shortLibrary()))
    expect(a).toBe(b)
    const c = serializeScore(compileScript(shortScript(), shortLibrary(), { seed: 5 }))
    expect(c).not.toBe(a)
    expect(serializeScore(compileScript(shortScript(), shortLibrary(), { seed: 5 }))).toBe(c)
  })

  it('selects per part with the tuin ladder and anchors each part on the previous pick', () => {
    const compiled = compileScriptDetailed(shortScript(), shortLibrary())
    const [grounding, active, integration] = compiled.sections
    expect(grounding.tracks.map((t) => t.intensity)).toEqual([1, 2, 2])
    expect(active.tracks.every((t) => t.intensity === 3)).toBe(true)
    expect(integration.tracks[0].intensity).toBe(2)
    expect(integration.tracks.slice(1).every((t) => t.intensity === 1)).toBe(true)
    const ids = compiled.sections.flatMap((s) => s.tracks.map((t) => String(t.id)))
    expect(new Set(ids).size).toBe(ids.length)
    for (const section of compiled.sections) {
      expect(section.musicDurationSec).toBeGreaterThanOrEqual(section.targetDurationSec)
      expect(section.musicDurationSec).toBe(
        section.tracks.reduce((sum, t) => sum + t.durationSec, 0),
      )
    }
  })

  it('equals select_songs_for_session when the parts are equal thirds', () => {
    const script = shortScript()
    for (const section of script.sections) section.durationSec = 100
    const selection = selectTracksForScript(script, shortLibrary(), { seed: 3 })
    const canon = selectTracksForSession(300, shortLibrary(), { seed: 3 })
    expect(selection.sections.map((s) => s.tracks.map((t) => t.id))).toEqual(
      canon.sections.map((s) => s.tracks.map((t) => t.id)),
    )
  })

  it('chains music clips with equal-power crossfades and fades the session in and out', () => {
    const compiled = compileScriptDetailed(shortScript(), shortLibrary())
    const clips = audioTrack(compiled, 'music').clips
    expect(clips.length).toBe(compiled.sections.reduce((n, s) => n + s.tracks.length, 0))
    clips.forEach((clip, index) => {
      expect(clip.fadeCurve).toBe('equalPower')
      if (index === 0) {
        expect(clip.startSec).toBe(0)
        expect(clip.fadeInSec).toBe(2)
      } else {
        const previous = clips[index - 1]
        expect(clip.startSec).toBeCloseTo(
          previous.startSec + previous.durationSec - CROSSFADE_SECONDS,
          6,
        )
        expect(clip.fadeInSec).toBe(CROSSFADE_SECONDS)
      }
      if (index === clips.length - 1) expect(clip.fadeOutSec).toBe(4)
      else expect(clip.fadeOutSec).toBe(CROSSFADE_SECONDS)
    })
    // A part starts where its first clip starts and ends where its last clip ends.
    compiled.sections.forEach((section, index) => {
      const own = clips.filter((clip) => clip.id.startsWith(`music-s${index + 1}-`))
      expect(section.startSec).toBe(own[0].startSec)
      expect(section.endSec).toBeCloseTo(
        own[own.length - 1].startSec + own[own.length - 1].durationSec,
        6,
      )
      if (index > 0)
        expect(section.startSec).toBeCloseTo(
          compiled.sections[index - 1].endSec - CROSSFADE_SECONDS,
          6,
        )
    })
    // The library's loudness trim rides on the clip.
    const rising = clips.find((clip) => clip.sourceId === 'a1')
    expect(rising?.gainDb).toBe(-1.5)
  })

  it('places cues at part start + buffer + their time and carries the voice assets as sources', () => {
    const compiled = compileScriptDetailed(shortScript(), shortLibrary())
    const script = shortScript()
    for (const cue of compiled.cues) {
      const section = compiled.sections[cue.sectionIndex]
      const scripted = script.sections[cue.sectionIndex].cues[cue.cueIndex]
      expect(cue.atSec).toBeCloseTo(
        section.startSec + SCRIPT_CUE_BUFFER_SECONDS + scripted.atSec,
        6,
      )
      expect(cue.shiftedSec).toBe(0)
      expect(cue.durationSec).toBe(estimateSpeechSeconds(scripted.text))
      expect(cue.url).toBe(`voice://estimate/${cue.key}`)
      expect(compiled.score.sources.find((s) => s.id === cue.sourceId)).toMatchObject({
        url: cue.url,
        durationSec: cue.durationSec,
      })
    }
    const voice = audioTrack(compiled, 'voice')
    expect(voice.clips.map((clip) => clip.id)).toEqual(
      compiled.cues.map((cue) => `voice-${cue.key}`),
    )
    expect(voice.strip.level).toBe(1)
    expect(audioTrack(compiled, 'music').strip.level).toBeCloseTo(dbToGain(SCRIPT_MUSIC_DB), 9)
  })

  it('keeps the minimum gap between cues, shifting later ones and warning', () => {
    const script = shortScript()
    script.sections[0].cues[1].atSec = 5
    script.sections[0].cues[2].atSec = 25
    const long = 'word '.repeat(60).trim()
    script.sections[0].cues[0].text = long
    const compiled = compileScriptDetailed(script, shortLibrary(), {
      voice: estimatedVoiceProvider(),
    })
    const [first, second] = compiled.cues
    expect(first.durationSec).toBeGreaterThan(20)
    expect(second.atSec).toBeCloseTo(first.endSec + SCRIPT_CUE_GAP_SECONDS, 6)
    expect(second.shiftedSec).toBeGreaterThan(0)
    expect(
      compiled.warnings.some((w) => w.code === 'cue-shifted' && w.path === 'sections[0].cues[1]'),
    ).toBe(true)
  })

  it('warns when a cue runs past its part or a part finds no music, and extends the render', () => {
    const script = shortScript()
    script.sections[2].cues[3].atSec = 79
    script.sections[2].cues[3].text = 'word '.repeat(80).trim()
    const compiled = compileScriptDetailed(script, shortLibrary())
    expect(compiled.warnings.some((w) => w.code === 'cue-overflow')).toBe(true)
    const last = compiled.cues[compiled.cues.length - 1]
    expect(compiled.durationSec).toBeCloseTo(last.endSec + 1, 6)

    const calmOnly = shortLibrary().filter((track) => track.intensity === 1)
    const silentActive = compileScriptDetailed(shortScript(), calmOnly)
    const warning = silentActive.warnings.find((w) => w.code === 'section-no-music')
    expect(warning?.path).toBe('sections[1]')
    expect(silentActive.sections[1].endSec - silentActive.sections[1].startSec).toBe(90)
    expect(validateScore(silentActive.score)).toEqual([])
  })

  it('writes a ducking lane on the music fader around every cue', () => {
    const compiled = compileScriptDetailed(shortScript(), shortLibrary())
    const lane = must(
      compiled.score.lanes.find((candidate) => candidate.id === SCRIPT_LANE_IDS.duck),
    )
    expect(lane.target).toEqual({ kind: 'strip', owner: 'music', param: 'level' })
    const base = dbToGain(SCRIPT_MUSIC_DB)
    const ducked = base * dbToGain(-6)
    expect(lane.defaultValue).toBeCloseTo(base, 9)
    const evaluator = new ParamLane({
      breakpoints: lane.breakpoints,
      defaultValue: lane.defaultValue,
    })
    for (const cue of compiled.cues) {
      expect(evaluator.valueAt(cue.atSec)).toBeCloseTo(ducked, 6)
      expect(evaluator.valueAt(cue.atSec + cue.durationSec / 2)).toBeCloseTo(ducked, 6)
      expect(evaluator.valueAt(cue.atSec - SCRIPT_DUCK_ATTACK_SECONDS - 0.5)).toBeCloseTo(base, 6)
      const released = cue.endSec + SCRIPT_DUCK_HOLD_SECONDS + SCRIPT_DUCK_RELEASE_SECONDS
      const next = compiled.cues.find((c) => c.atSec > cue.atSec)
      if (!next || next.atSec - SCRIPT_DUCK_ATTACK_SECONDS > released) {
        expect(evaluator.valueAt(released + 0.01)).toBeCloseTo(base, 6)
      }
    }
    expect(compiled.score.lanes.some((l) => l.id === SCRIPT_LANE_IDS.duck)).toBe(true)
    const noDuck = compileScript(shortScript(), shortLibrary(), { duck: false })
    expect(noDuck.lanes.map((l) => l.id)).toEqual([SCRIPT_LANE_IDS.breathGuide])
  })

  it('merges dips of cues closer than a release and honours custom duck options', () => {
    const base = 0.5
    const points = duckBreakpoints(
      [
        { atSec: 10, endSec: 15 },
        { atSec: 15.5, endSec: 20 },
        { atSec: 40, endSec: 42 },
      ],
      base,
      { depthDb: -12, attackSec: 0.1, releaseSec: 1, holdSec: 0 },
    )
    const ducked = base * dbToGain(-12)
    expect(points).toEqual([
      { timeSec: 9.9, value: base },
      { timeSec: 10, value: ducked },
      { timeSec: 20, value: ducked },
      { timeSec: 21, value: base },
      { timeSec: 39.9, value: base },
      { timeSec: 40, value: ducked },
      { timeSec: 42, value: ducked },
      { timeSec: 43, value: base },
    ])
    expect(duckBreakpoints([], base)).toEqual([])
  })

  it('shapes the breath-guide lane from the pattern, switching at a cue and silent through holds', () => {
    const compiled = compileScriptDetailed(shortScript(), shortLibrary())
    const lane = must(
      compiled.score.lanes.find((candidate) => candidate.id === SCRIPT_LANE_IDS.breathGuide),
    )
    expect(lane.target).toEqual({ kind: 'strip', owner: 'breath-guide', param: 'inputGain' })
    const evaluator = new ParamLane({
      breakpoints: lane.breakpoints,
      defaultValue: 0,
      min: 0,
      max: 1,
    })
    const [grounding, , integration] = compiled.sections
    // Grounding: 5 s in, 5 s out from the part's start …
    expect(evaluator.valueAt(grounding.startSec)).toBe(0)
    expect(evaluator.valueAt(grounding.startSec + 5)).toBe(1)
    expect(evaluator.valueAt(grounding.startSec + 2.5)).toBeCloseTo(0.5, 6)
    expect(evaluator.valueAt(grounding.startSec + 10)).toBe(0)
    // … until the third cue switches to 3 s / 3 s.
    const switchAt = grounding.startSec + SCRIPT_CUE_BUFFER_SECONDS + 60
    expect(evaluator.valueAt(switchAt)).toBe(0)
    expect(evaluator.valueAt(switchAt + 3)).toBe(1)
    expect(evaluator.valueAt(switchAt + 6)).toBe(0)
    // Integration holds: flat zero.
    for (const hold of integration.holds) {
      for (const t of [hold.startSec, (hold.startSec + hold.endSec) / 2, hold.endSec - 0.01]) {
        expect(evaluator.valueAt(t)).toBe(0)
      }
      // Breathing resumes from the hold's end.
      expect(evaluator.valueAt(hold.endSec + 5)).toBe(1)
    }
    const guide = audioTrack(compiled, 'breath-guide')
    expect(guide.clips).toEqual([])
    expect(guide.strip.inputGain).toBe(0)
    expect(guide.strip.level).toBeCloseTo(dbToGain(-12), 9)
  })

  it('carries a looped noise bed under the breath guide and an ambience bed when sources are given', () => {
    const compiled = compileScriptDetailed(shortScript(), shortLibrary(), {
      breathGuide: { source: { id: 'noise', url: '/noise.mp3', durationSec: 8 }, curve: 'smooth' },
      ambience: { source: { id: 'dawn', url: '/dawn.mp3', durationSec: 60 }, gainDb: -2 },
      mix: { ambienceDb: -20 },
    })
    expect(validateScore(compiled.score)).toEqual([])
    expect(compiled.score.tracks.map((t) => t.id)).toEqual([
      'music',
      'voice',
      'ambience',
      'breath-guide',
    ])
    const ambience = audioTrack(compiled, 'ambience')
    expect(ambience.clips).toEqual([
      expect.objectContaining({
        sourceId: 'dawn',
        startSec: 0,
        durationSec: compiled.durationSec,
        loop: true,
        gainDb: -2,
      }),
    ])
    expect(ambience.strip.level).toBeCloseTo(dbToGain(-20), 9)
    const guide = audioTrack(compiled, 'breath-guide')
    expect(guide.clips[0]).toMatchObject({
      sourceId: 'noise',
      loop: true,
      durationSec: compiled.durationSec,
    })
    const lane = must(compiled.score.lanes.find((l) => l.id === SCRIPT_LANE_IDS.breathGuide))
    expect(lane.breakpoints.some((point) => point.curve === 'smooth')).toBe(true)
    expect(compiled.score.sources.map((s) => s.id)).toEqual(
      expect.arrayContaining(['noise', 'dawn']),
    )
    const none = compileScript(shortScript(), shortLibrary(), { breathGuide: false })
    expect(none.tracks.map((t) => t.id)).toEqual(['music', 'voice'])
  })

  it("fit 'script' cuts every part to its target with pydub's fades", () => {
    const compiled = compileScriptDetailed(shortScript(), shortLibrary(), { fit: 'script' })
    expect(validateScore(compiled.score)).toEqual([])
    expect(compiled.sections.map((s) => [s.startSec, s.endSec])).toEqual([
      [0, 90],
      [90, 180],
      [180, 260],
    ])
    const clips = audioTrack(compiled, 'music').clips
    for (const section of compiled.sections) {
      const own = clips.filter(
        (clip) => clip.startSec >= section.startSec && clip.startSec < section.endSec,
      )
      const last = own[own.length - 1]
      expect(last.startSec + last.durationSec).toBeLessThanOrEqual(section.endSec + 1e-9)
      if (section.index > 0) expect(own[0].fadeInSec).toBe(2)
    }
    const trimmed = clips.filter((clip) => clip.fadeOutSec === 3)
    expect(trimmed.length).toBeGreaterThan(0)
    // The closing cue (70 s + the 7 s buffer, ~10 s long) runs past the 260 s of music: warned, render extended.
    const closing = compiled.cues[compiled.cues.length - 1]
    expect(compiled.warnings.length).toBeGreaterThan(0)
    expect(compiled.warnings.every((w) => w.code === 'cue-overflow')).toBe(true)
    expect(compiled.durationSec).toBeCloseTo(closing.endSec + 1, 6)
  })

  it('uses custom track ids, mix levels and a static voice provider', () => {
    const script = shortScript()
    const assets: Record<string, VoiceAsset> = {}
    for (const ref of cueRefs(script)) {
      assets[ref.key] = { url: `https://cdn/voice/${ref.key}.mp3`, durationSec: 4 }
    }
    const compiled = compileScriptDetailed(script, shortLibrary(), {
      ids: { music: 'bed', voice: 'guide' },
      mix: { musicDb: -3, voiceDb: -1 },
      voice: staticVoiceProvider(assets),
    })
    expect(compiled.score.tracks.map((t) => t.id)).toEqual(['bed', 'guide', 'breath-guide'])
    expect(audioTrack(compiled, 'bed').strip.level).toBeCloseTo(dbToGain(-3), 9)
    expect(audioTrack(compiled, 'guide').strip.level).toBeCloseTo(dbToGain(-1), 9)
    expect(
      compiled.cues.every((cue) => cue.durationSec === 4 && cue.url.startsWith('https://cdn/')),
    ).toBe(true)
    expect(compiled.score.lanes[0].target).toEqual({ kind: 'strip', owner: 'bed', param: 'level' })
  })
})

describe('voice providers', () => {
  it('estimates durations from words and pause tags, deterministically', () => {
    expect(
      estimateSpeechSeconds('one two three four five six seven eight nine ten', {
        wordsPerMinute: 120,
        tailSec: 0,
      }),
    ).toBe(5)
    expect(
      estimateSpeechSeconds('Breathe. <2s> Out. <1.5s>', { wordsPerMinute: 60, tailSec: 0.5 }),
    ).toBe(6)
    const provider = estimatedVoiceProvider({ urlFor: (ref) => `local/${ref.key}.wav` })
    const ref = cueRefs(shortScript())[0]
    expect(provider.asset(ref)).toEqual({
      url: 'local/s1-c1.wav',
      durationSec: estimateSpeechSeconds(ref.cue.text),
    })
  })

  it('synthesises every missing cue with bounded concurrency and falls back for the rest', async () => {
    const script = shortScript()
    const calls: string[] = []
    let inFlight = 0
    let peak = 0
    const synthesizer = {
      synthesize: async (text: string, ref: { key: string }) => {
        inFlight += 1
        peak = Math.max(peak, inFlight)
        await new Promise((resolve) => setTimeout(resolve, 1))
        inFlight -= 1
        calls.push(ref.key)
        return { url: `tts://${ref.key}`, durationSec: text.length / 20 }
      },
    }
    const existing: Record<string, VoiceAsset> = { 's1-c1': { url: 'kept', durationSec: 3 } }
    const progress: number[] = []
    const { provider, assets } = await synthesizeVoice(script, synthesizer, {
      concurrency: 3,
      existing,
      onAsset: (_key, _asset, done) => progress.push(done),
    })
    const total = cueRefs(script).length
    expect(calls).toHaveLength(total - 1)
    expect(calls).not.toContain('s1-c1')
    expect(peak).toBeLessThanOrEqual(3)
    expect(progress).toEqual(Array.from({ length: total - 1 }, (_, i) => i + 1))
    expect(assets['s1-c1']).toEqual({ url: 'kept', durationSec: 3 })
    expect(provider.asset(cueRefs(script)[1]).url).toBe('tts://s1-c2')
    const partial = staticVoiceProvider({ 's1-c1': { url: 'kept', durationSec: 3 } })
    expect(partial.asset(cueRefs(script)[1]).url).toBe('voice://estimate/s1-c2')
  })
})

describe('operationsToLoad', () => {
  it('turns an empty document into the compiled score in one batch, undoable', () => {
    const compiled = compileScriptDetailed(shortScript(), shortLibrary())
    const document = new ScoreDocument(createScore({ id: 'evening-grounding' }))
    const ops = operationsToLoad(document.score, compiled.score)
    expect(ops).toHaveLength(1)
    expect(ops[0].type).toBe('batch')
    document.apply(ops[0])
    expect(serializeScore(document.score)).toBe(serializeScore(compiled.score))
    document.undo()
    expect(document.score.tracks).toEqual([])
    expect(document.score.lanes).toEqual([])
    expect(document.score.sources).toEqual([])
  })

  it('replaces a previously loaded script and leaves foreign tracks alone', () => {
    const first = compileScript(shortScript(), shortLibrary())
    const document = new ScoreDocument(createScore({ id: 'evening-grounding' }))
    document.apply({
      type: 'track.add',
      track: {
        kind: 'live',
        id: 'coach',
        name: 'Coach',
        destination: { kind: 'master' },
        strip: {
          level: 1,
          pan: 0,
          inputGain: 1,
          mute: false,
          solo: false,
          soloSafe: false,
          inserts: [],
          sends: [],
        },
      },
    })
    document.apply(operationsToLoad(document.score, first)[0])
    document.apply({ type: 'strip.set', owner: 'music', param: 'level', value: 0.3 })
    // A foreign lane on the same parameter the compiled duck lane targets is removed first.
    document.apply({ type: 'lane.remove', id: SCRIPT_LANE_IDS.duck })
    document.apply({
      type: 'lane.add',
      lane: {
        id: 'hand-duck',
        target: { kind: 'strip', owner: 'music', param: 'level' },
        breakpoints: [],
      },
    })
    const second: SessionScript = { ...shortScript(), title: 'Morning energy' }
    const compiled = compileScript(second, shortLibrary(), { seed: 2 })
    const ops = operationsToLoad(document.score, compiled)
    document.apply(ops[0])
    expect(document.score.name).toBe('Morning energy')
    expect(document.score.tracks.map((t) => t.id)).toEqual([
      'coach',
      'music',
      'voice',
      'breath-guide',
    ])
    expect(document.score.lanes.map((l) => l.id)).toEqual([
      SCRIPT_LANE_IDS.duck,
      SCRIPT_LANE_IDS.breathGuide,
    ])
    expect((document.score.tracks[1] as ScoreAudioTrack).strip.level).toBeCloseTo(
      dbToGain(SCRIPT_MUSIC_DB),
      9,
    )
    expect(validateScore(document.score)).toEqual([])
    // Sources already present are kept, not duplicated.
    const ids = document.score.sources.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(operationsToLoad(document.score, compiled)).toHaveLength(1)
  })

  it('returns no operations when there is nothing to change', () => {
    const empty = createScore({ name: 'x' })
    expect(operationsToLoad(empty, { ...empty })).toEqual([])
    const lib: AgentTrack[] = shortLibrary()
    const compiled = compileScript(shortScript(), lib)
    const loaded = apply(
      createScore({ id: 'evening-grounding' }),
      operationsToLoad(createScore(), compiled)[0],
    )
    expect(loaded.tracks.length).toBe(3)
  })
})
