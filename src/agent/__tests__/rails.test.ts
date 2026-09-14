import { describe, expect, it } from 'vitest'

import {
  DEFAULT_RAILS,
  DEFAULT_RATE_LIMITS,
  RailRejection,
  Rails,
  dbToGain,
  gainToDb,
  resolveRails,
} from '../rails'
import { type RailNote } from '../types'

describe('rail defaults', () => {
  it('are tuned for a breathwork listener', () => {
    expect(DEFAULT_RAILS).toMatchObject({
      levelRange: [0, 1],
      maxShortTermLufs: -14,
      maxTruePeakDb: -1,
      loudnessMode: 'clamp',
      maxGainChangePerSec: 1,
      protectVoice: true,
      minVoiceLevel: 0.25,
      noSilence: true,
      maxExtendPerCallSec: 300,
      maxSessionGrowthSec: 900,
      minFadeSec: 2,
      maxFadeSec: 30,
      consent: [],
    })
    expect(DEFAULT_RATE_LIMITS.steer_music).toEqual({ burst: 1, perMinute: 2 })
    expect(DEFAULT_RATE_LIMITS.default).toEqual({ burst: 3, perMinute: 30 })
  })

  it('overrides merge per field and rate limits per tool', () => {
    const config = resolveRails({
      maxShortTermLufs: -18,
      rateLimits: { steer_music: { burst: 3, perMinute: 9 } },
    })
    expect(config.maxShortTermLufs).toBe(-18)
    expect(config.maxTruePeakDb).toBe(-1)
    expect(config.rateLimits.steer_music).toEqual({ burst: 3, perMinute: 9 })
    expect(config.rateLimits.default).toEqual(DEFAULT_RATE_LIMITS.default)
    expect(gainToDb(dbToGain(-6))).toBeCloseTo(-6)
    expect(gainToDb(0)).toBe(-Infinity)
  })
})

describe('range clamp', () => {
  it('clamps a fader into the agent range and notes the requested value (AE2)', () => {
    const rails = new Rails()
    const notes: RailNote[] = []
    expect(rails.clampLevel(3, notes, 'music level')).toBe(1)
    expect(notes).toEqual([
      {
        rail: 'range',
        action: 'clamped',
        message: 'music level 3 clamped to 0..1',
        requested: 3,
        applied: 1,
      },
    ])
    expect(rails.clampLevel(0.5, notes)).toBe(0.5)
    expect(notes).toHaveLength(1)
  })
})

describe('gain slew', () => {
  it('allows a full-scale move, then limits rapid follow-ups until the bucket refills', () => {
    const rails = new Rails()
    const notes: RailNote[] = []
    expect(rails.slewGain('music', 1, 0.2, 0, notes)).toBe(0.2)
    expect(notes).toEqual([])
    // 200 ms later: 0.2 tokens left + 0.2 refilled.
    expect(rails.slewGain('music', 0.2, 1, 200, notes)).toBeCloseTo(0.6)
    expect(notes[0]).toMatchObject({ rail: 'gain-slew', action: 'clamped', requested: 1 })
    // A second later the bucket is full again.
    expect(rails.slewGain('music', 0.6, 1, 1300, notes)).toBe(1)
    expect(notes).toHaveLength(1)
  })

  it('does not consume budget when not committing (dry run)', () => {
    const rails = new Rails({ maxGainChangePerSec: 0.5 })
    const notes: RailNote[] = []
    expect(rails.slewGain('music', 0, 0.5, 0, notes, false)).toBe(0.5)
    expect(rails.slewGain('music', 0, 0.5, 0, notes, true)).toBe(0.5)
    expect(rails.slewGain('music', 0.5, 1, 0, notes, true)).toBe(0.5)
    expect(notes).toHaveLength(1)
  })

  it('is disabled with an infinite rate', () => {
    const rails = new Rails({ maxGainChangePerSec: Infinity })
    const notes: RailNote[] = []
    expect(rails.slewGain('music', 0, 1, 0, notes)).toBe(1)
    expect(rails.slewGain('music', 1, 0, 0, notes)).toBe(0)
    expect(notes).toEqual([])
  })
})

describe('loudness ceilings', () => {
  it('clamps an increase that would cross the short-term LUFS ceiling', () => {
    const rails = new Rails({ loudnessReading: () => ({ shortTermLufs: -16, truePeakDb: -6 }) })
    const notes: RailNote[] = []
    // +6 dB from 0.5 → 1.0 would land at −10 LUFS; only +2 dB is allowed.
    const applied = rails.guardLoudness(0.5, 1, notes, 'music level')
    expect(applied).toBeCloseTo(0.5 * dbToGain(2))
    expect(notes[0]).toMatchObject({ rail: 'loudness', action: 'clamped', requested: 1 })
    expect(notes[0].message).toContain('-14 LUFS ceiling')
  })

  it('clamps on the true-peak ceiling when that is the tighter one', () => {
    const rails = new Rails({ loudnessReading: () => ({ shortTermLufs: -30, truePeakDb: -2 }) })
    const notes: RailNote[] = []
    const applied = rails.guardLoudness(0.5, 1, notes, 'master level')
    expect(applied).toBeCloseTo(0.5 * dbToGain(1))
    expect(notes[0]).toMatchObject({ rail: 'true-peak', action: 'clamped' })
  })

  it('rejects instead of clamping in reject mode', () => {
    const rails = new Rails({
      loudnessMode: 'reject',
      loudnessReading: () => ({ shortTermLufs: -14.5 }),
    })
    expect(() => rails.guardLoudness(0.5, 1, [], 'music')).toThrow(RailRejection)
  })

  it('never clamps decreases, silence, or without a reading', () => {
    const rails = new Rails({ loudnessReading: () => ({ shortTermLufs: -10 }) })
    const notes: RailNote[] = []
    expect(rails.guardLoudness(1, 0.5, notes, 'music')).toBe(0.5)
    expect(rails.guardLoudness(0, 1, notes, 'music')).toBe(1)
    const silent = new Rails({ loudnessReading: () => ({ shortTermLufs: -Infinity }) })
    expect(silent.guardLoudness(0.5, 1, notes, 'music')).toBe(1)
    const unarmed = new Rails({ loudnessReading: () => null })
    expect(unarmed.guardLoudness(0.5, 1, notes, 'music')).toBe(1)
    expect(notes).toEqual([])
  })

  it('holds the level when the mix is already over the ceiling', () => {
    const rails = new Rails({ loudnessReading: () => ({ shortTermLufs: -12 }) })
    const notes: RailNote[] = []
    expect(rails.guardLoudness(0.5, 0.8, notes, 'music')).toBe(0.5)
    expect(notes[0].applied).toBe(0.5)
  })
})

describe('voice protection and no-silence', () => {
  it('refuses a hard mute, near-silence, solo-of-others and removal while speaking', () => {
    const rails = new Rails()
    expect(() => rails.guardVoice('mute', true)).toThrow(/cannot be muted/)
    expect(() => rails.guardVoice('level', true, 0.1)).toThrow(/below 0.25/)
    expect(() => rails.guardVoice('level', true, 0.3)).not.toThrow()
    expect(() => rails.guardVoice('solo-other', true)).toThrow(/silence the voice/)
    expect(() => rails.guardVoice('remove', true)).toThrow(/cannot be removed/)
  })

  it('lets everything through while the voice is silent, or when disabled', () => {
    const rails = new Rails()
    expect(() => rails.guardVoice('mute', false)).not.toThrow()
    expect(() => rails.guardVoice('level', false, 0)).not.toThrow()
    const off = new Rails({ protectVoice: false })
    expect(() => off.guardVoice('mute', true)).not.toThrow()
  })

  it('refuses to silence the music by mute or removal unless disabled', () => {
    const rails = new Rails()
    expect(() => rails.guardSilence('muting music')).toThrow(RailRejection)
    try {
      rails.guardSilence('muting music')
    } catch (error) {
      expect((error as RailRejection).note).toMatchObject({
        rail: 'no-silence',
        action: 'rejected',
      })
    }
    expect(() => new Rails({ noSilence: false }).guardSilence('muting music')).not.toThrow()
  })
})

describe('rate limits', () => {
  it('allows the burst, then refuses with a retry hint, and refills over time', () => {
    const rails = new Rails()
    expect(rails.takeCall('steer_music', 0)).toBeNull()
    const wait = rails.takeCall('steer_music', 1000)
    expect(wait).toBe(29_000)
    expect(rails.takeCall('steer_music', 1000 + 29_000)).toBeNull()
    expect(rails.peekCall('steer_music', 30_500)).toBeGreaterThan(0)
    expect(rails.takeCall('steer_music', 30_500)).toBeGreaterThan(0)
  })

  it('peeking never consumes', () => {
    const rails = new Rails({ rateLimits: { default: { burst: 1, perMinute: 60 } } })
    expect(rails.peekCall('anything', 0)).toBeNull()
    expect(rails.peekCall('anything', 0)).toBeNull()
    expect(rails.takeCall('anything', 0)).toBeNull()
    expect(rails.peekCall('anything', 0)).toBe(1000)
  })

  it('unknown tools use the default limit', () => {
    const rails = new Rails()
    expect(rails.rateLimitFor('custom_tool')).toEqual(DEFAULT_RATE_LIMITS.default)
    expect(rails.rateLimitFor('fade_out')).toEqual({ burst: 1, perMinute: 1 })
  })
})

describe('consent, extension and fades', () => {
  it('tracks granted scopes', () => {
    const rails = new Rails({ consent: ['arrange'] })
    expect(rails.hasConsent('arrange')).toBe(true)
    expect(rails.hasConsent('structure')).toBe(false)
    rails.grantConsent('structure')
    expect(rails.consents.sort()).toEqual(['arrange', 'structure'])
    rails.revokeConsent('arrange')
    expect(rails.hasConsent('arrange')).toBe(false)
  })

  it('caps an extension per call and at the headroom, noting each cut', () => {
    const rails = new Rails()
    const notes: RailNote[] = []
    expect(rails.clampExtend(500, 1000, notes)).toBe(300)
    expect(notes).toHaveLength(1)
    expect(rails.clampExtend(120, 45.7, notes)).toBe(45)
    expect(notes[1]).toMatchObject({ rail: 'headroom', requested: 120, applied: 45 })
    expect(rails.clampExtend(60, 0, notes)).toBe(0)
  })

  it('keeps fades between the startle and stall bounds', () => {
    const rails = new Rails()
    const notes: RailNote[] = []
    expect(rails.clampFade(0.2, notes)).toBe(2)
    expect(rails.clampFade(90, notes)).toBe(30)
    expect(rails.clampFade(8, notes)).toBe(8)
    expect(notes.map((note) => note.rail)).toEqual(['range', 'range'])
  })

  it('describes itself compactly for snapshots', () => {
    expect(new Rails().describe()).toEqual({
      levelRange: [0, 1],
      maxShortTermLufs: -14,
      maxTruePeakDb: -1,
      maxGainChangePerSec: 1,
      protectVoice: true,
      noSilence: true,
      maxExtendPerCallSec: 300,
      consent: [],
    })
  })
})
