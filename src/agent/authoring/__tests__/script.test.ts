// The session script: schema (checked under Ajv strict as well as the
// built-in validator), the semantic checks the schema cannot express, the
// canon rules, parsing/normalising, and the prompt contract.

import Ajv2020 from 'ajv/dist/2020'
import { describe, expect, it } from 'vitest'

import { validateSchema } from '../../jsonSchema'
import {
  DEFAULT_BREATHING,
  SESSION_SCRIPT_CANON,
  SESSION_SCRIPT_SCHEMA,
  SessionScriptError,
  breathCycleSec,
  checkScriptCanon,
  foreignTags,
  formatScriptIssues,
  parseSessionScript,
  pauseSeconds,
  scriptDurationSec,
  sessionScriptPromptContract,
  stripPauseTags,
  validateSessionScript,
  type SessionScript,
} from '../script'
import { shortScript } from './fixtures'

const ajv = new Ajv2020({ strict: true, allErrors: true })

/** Narrow away `undefined`/`null` in a fixture lookup. */
function must<T>(value: T | undefined | null, what = 'value'): T {
  if (value === undefined || value === null) throw new Error(`expected ${what}`)
  return value
}

function withSection(
  script: SessionScript,
  index: number,
  patch: (section: SessionScript['sections'][number]) => void,
): SessionScript {
  const copy = structuredClone(script)
  patch(copy.sections[index])
  return copy
}

describe('SESSION_SCRIPT_SCHEMA', () => {
  it('compiles under Ajv 2020-12 strict mode and accepts the fixture', () => {
    const validate = ajv.compile(SESSION_SCRIPT_SCHEMA)
    expect(validate(shortScript()), JSON.stringify(validate.errors)).toBe(true)
    expect(validateSchema(SESSION_SCRIPT_SCHEMA, shortScript())).toEqual([])
  })

  it.each([
    ['wrong format', (s: SessionScript) => ({ ...s, format: 2 })],
    ['two sections', (s: SessionScript) => ({ ...s, sections: s.sections.slice(0, 2) })],
    ['unknown property', (s: SessionScript) => ({ ...s, mood: 'calm' })],
    ['missing title', (s: SessionScript) => ({ ...s, title: undefined })],
    [
      'cue without text',
      (s: SessionScript) =>
        withSection(s, 0, (sec) => ((sec.cues[0] as { text?: string }).text = undefined)),
    ],
    [
      'bad role',
      (s: SessionScript) => withSection(s, 0, (sec) => ((sec as { role: string }).role = 'warmup')),
    ],
    [
      'hold too short',
      (s: SessionScript) => withSection(s, 2, (sec) => (must(sec.holds)[0].durationSec = 3)),
    ],
    ['intensity 4', (s: SessionScript) => withSection(s, 1, (sec) => (sec.intensity = 4))],
    [
      'part under a minute',
      (s: SessionScript) => withSection(s, 0, (sec) => (sec.durationSec = 30)),
    ],
  ])('rejects %s under Ajv and the built-in validator alike', (_name, corrupt) => {
    const bad = corrupt(shortScript())
    const validate = ajv.compile(SESSION_SCRIPT_SCHEMA)
    expect(validate(bad)).toBe(false)
    expect(validateSchema(SESSION_SCRIPT_SCHEMA, bad).length).toBeGreaterThan(0)
    expect(validateSessionScript(bad).length).toBeGreaterThan(0)
  })
})

describe('validateSessionScript (beyond the schema)', () => {
  it('accepts the fixture', () => {
    expect(validateSessionScript(shortScript())).toEqual([])
  })

  it('refuses cues past the end of the part, out of order, or with foreign tags', () => {
    const late = withSection(shortScript(), 0, (sec) => (sec.cues[2].atSec = 95))
    expect(validateSessionScript(late)).toEqual([
      expect.objectContaining({ path: 'sections[0].cues[2].atSec' }),
    ])
    const disordered = withSection(shortScript(), 0, (sec) => (sec.cues[1].atSec = 70))
    expect(validateSessionScript(disordered).map((i) => i.path)).toEqual([
      'sections[0].cues[2].atSec',
    ])
    const markup = withSection(
      shortScript(),
      0,
      (sec) => (sec.cues[0].text = 'Breathe <break time="2s"/> out <2s>'),
    )
    expect(validateSessionScript(markup)[0].message).toMatch(/only pause tags/)
    const empty = withSection(shortScript(), 0, (sec) => (sec.cues[0].text = '<2s> <1s>'))
    expect(validateSessionScript(empty)[0].message).toMatch(/needs words/)
  })

  it('refuses holds past the part end or overlapping', () => {
    const past = withSection(shortScript(), 2, (sec) => (must(sec.holds)[1].atSec = 70))
    expect(validateSessionScript(past)[0].message).toMatch(/runs past/)
    const overlap = withSection(shortScript(), 2, (sec) => (must(sec.holds)[1].atSec = 30))
    expect(validateSessionScript(overlap).some((i) => i.message === 'holds overlap')).toBe(true)
  })
})

describe('checkScriptCanon', () => {
  it('passes the fixture and lists every rule in the prompt canon', () => {
    expect(checkScriptCanon(shortScript())).toEqual([])
    const rules = new Set(SESSION_SCRIPT_CANON.map((rule) => rule.rule))
    expect(rules.size).toBe(SESSION_SCRIPT_CANON.length)
    expect(rules.has('active-intensity')).toBe(true)
  })

  it.each([
    ['section-order', (s: SessionScript) => withSection(s, 0, (sec) => (sec.role = 'active'))],
    ['grounding-intensity', (s: SessionScript) => withSection(s, 0, (sec) => (sec.intensity = 2))],
    ['active-intensity', (s: SessionScript) => withSection(s, 1, (sec) => (sec.intensity = 2))],
    [
      'integration-intensity',
      (s: SessionScript) => withSection(s, 2, (sec) => (sec.intensity = 3)),
    ],
    [
      'integration-two-holds',
      (s: SessionScript) => withSection(s, 2, (sec) => (sec.holds = [must(sec.holds)[0]])),
    ],
    [
      'integration-two-holds',
      (s: SessionScript) => withSection(s, 2, (sec) => (must(sec.holds)[1].kind = 'inhale')),
    ],
    ['closing-cue', (s: SessionScript) => withSection(s, 2, (sec) => (sec.cues[3].kind = 'cue'))],
    ['sound-release', (s: SessionScript) => withSection(s, 1, (sec) => (sec.cues[2].kind = 'cue'))],
    [
      'sound-release-position',
      (s: SessionScript) =>
        withSection(s, 1, (sec) => {
          sec.cues[0].kind = 'sound-release'
          sec.cues[2].kind = 'cue'
        }),
    ],
    ['cue-cadence', (s: SessionScript) => withSection(s, 0, (sec) => (sec.cues[1].atSec = 10))],
    [
      'cue-cadence',
      (s: SessionScript) =>
        withSection(s, 0, (sec) => {
          sec.cues[1].atSec = 5
          sec.cues[2].atSec = 89
          sec.durationSec = 200
        }),
    ],
    [
      'first-cue',
      (s: SessionScript) =>
        withSection(s, 1, (sec) => {
          sec.cues = sec.cues.map((cue) => ({ ...cue, atSec: cue.atSec + 61 }))
          sec.durationSec = 160
        }),
    ],
    [
      'no-journey',
      (s: SessionScript) =>
        withSection(s, 0, (sec) => (sec.cues[0].text = 'Welcome to this journey.')),
    ],
    [
      'say-part',
      (s: SessionScript) =>
        withSection(s, 0, (sec) => (sec.cues[0].text = 'This section is about arriving.')),
    ],
    ['cue-in-hold', (s: SessionScript) => withSection(s, 2, (sec) => (sec.cues[1].atSec = 25))],
  ] as const)('flags %s', (rule, corrupt) => {
    const issues = checkScriptCanon(corrupt(shortScript()))
    expect(issues.map((issue) => issue.rule)).toContain(rule)
  })

  it('lets a hold-release cue start inside a hold and respects custom cadence bounds', () => {
    const release = withSection(shortScript(), 2, (sec) => {
      sec.cues[1].atSec = 30
      sec.cues[1].kind = 'hold-release'
    })
    expect(checkScriptCanon(release).map((i) => i.rule)).not.toContain('cue-in-hold')
    const tight = checkScriptCanon(shortScript(), { minCueGapSec: 25 })
    expect(tight.some((i) => i.rule === 'cue-cadence')).toBe(true)
  })
})

describe('parseSessionScript', () => {
  it('normalises: cue kinds default to cue, holds sorted, JSON strings accepted', () => {
    const script = parseSessionScript(JSON.stringify(shortScript()))
    expect(script.sections[0].cues.every((cue) => cue.kind !== undefined)).toBe(true)
    expect(script.sections[0].cues[0].kind).toBe('cue')
    const swapped = withSection(shortScript(), 2, (sec) => must(sec.holds).reverse())
    expect(must(parseSessionScript(swapped).sections[2].holds).map((h) => h.kind)).toEqual([
      'inhale',
      'exhale',
    ])
  })

  it('throws SessionScriptError with structural issues, then canon issues by default', () => {
    expect(() => parseSessionScript({ format: 1 })).toThrow(SessionScriptError)
    const journey = withSection(shortScript(), 0, (sec) => (sec.cues[0].text = 'A journey begins.'))
    let caught: unknown
    try {
      parseSessionScript(journey)
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(SessionScriptError)
    const error = caught as SessionScriptError
    expect(error.issues).toEqual([])
    expect(error.canon.map((i) => i.rule)).toEqual(['no-journey'])
    expect(error.message).toMatch(/\[no-journey\]/)
    expect(formatScriptIssues(error.issues, error.canon)).toMatch(/journey/)
  })

  it('can warn instead of throwing on canon issues, or skip the canon', () => {
    const journey = withSection(shortScript(), 0, (sec) => (sec.cues[0].text = 'A journey begins.'))
    const seen: string[] = []
    const script = parseSessionScript(journey, {
      canon: 'warn',
      onCanon: (issues) => seen.push(...issues.map((i) => i.rule)),
    })
    expect(script.title).toBe('Evening grounding')
    expect(seen).toEqual(['no-journey'])
    expect(() => parseSessionScript(journey, { canon: 'off' })).not.toThrow()
  })
})

describe('helpers', () => {
  it('sums durations and breath cycles', () => {
    expect(scriptDurationSec(shortScript())).toBe(260)
    expect(breathCycleSec(DEFAULT_BREATHING.grounding)).toBe(10)
    expect(
      breathCycleSec({
        inhaleSec: 4,
        holdInSec: 7,
        exhaleSec: 8,
        holdOutSec: 1,
        route: 'nose',
        style: 'slow',
      }),
    ).toBe(20)
  })

  it('reads and strips pause tags', () => {
    const text = 'Kieran. <2s> Breathe. <1.5s> Out. <0.5s>'
    expect(pauseSeconds(text)).toBe(4)
    expect(stripPauseTags(text)).toBe('Kieran. Breathe. Out.')
    expect(foreignTags('Hi <b>there</b> <2s>')).toEqual(['<b>', '</b>'])
  })

  it('renders the prompt contract with the rules and the schema', () => {
    const contract = sessionScriptPromptContract()
    expect(contract).toContain('Rules:')
    for (const rule of SESSION_SCRIPT_CANON) expect(contract).toContain(rule.text)
    expect(contract).toContain('"sections"')
    expect(JSON.parse(contract.slice(contract.indexOf('{')))).toEqual(SESSION_SCRIPT_SCHEMA)
  })
})
