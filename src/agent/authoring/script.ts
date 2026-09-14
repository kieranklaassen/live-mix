// The session script (U38): the tuin breathwork skill's three-part script as
// typed JSON — sections with target durations, a breathing pattern, timed
// voice cues, breath holds, theme and intensity — the document a planner LLM
// fills and `compileScript` turns into a score. This library never calls a
// model: `SESSION_SCRIPT_SCHEMA` is the prompt contract (also the parameter
// schema of the `author_script` tool), `validateSessionScript` the structural
// gate and `checkScriptCanon` the tuin/Breathwork Live canon (three parts,
// active always 3, two holds, three breaths to close, "part" never "journey").

import { formatIssues, validateSchema, type JsonSchema, type SchemaIssue } from '../jsonSchema'

export const SESSION_SCRIPT_FORMAT = 1

export type SectionRole = 'grounding' | 'active' | 'integration'
export const SECTION_ROLES: readonly SectionRole[] = ['grounding', 'active', 'integration']

/** The tuin section number a role plays in the selector. */
export const SECTION_NUMBER_BY_ROLE: Readonly<Record<SectionRole, 1 | 2 | 3>> = {
  grounding: 1,
  active: 2,
  integration: 3,
}

export type BreathRoute = 'nose' | 'mouth'
export const BREATH_ROUTES: readonly BreathRoute[] = ['nose', 'mouth']

/** belly: slow diaphragmatic; three-part: belly → chest → release at a slow pace; connected: the active wave with no pause; slow: long integration breaths. */
export type BreathStyle = 'belly' | 'three-part' | 'connected' | 'slow'
export const BREATH_STYLES: readonly BreathStyle[] = ['belly', 'three-part', 'connected', 'slow']

/** Breathwork Live's cue kinds plus the tuin sound release. */
export type CueKind =
  'cue' | 'checkin' | 'transition-ack' | 'sound-release' | 'hold-entry' | 'hold-release' | 'closing'
export const CUE_KINDS: readonly CueKind[] = [
  'cue',
  'checkin',
  'transition-ack',
  'sound-release',
  'hold-entry',
  'hold-release',
  'closing',
]

export type HoldKind = 'inhale' | 'exhale'
export const HOLD_KINDS: readonly HoldKind[] = ['inhale', 'exhale']

export type TimeOfDay = 'morning' | 'afternoon' | 'evening'
export const TIMES_OF_DAY: readonly TimeOfDay[] = ['morning', 'afternoon', 'evening']

/** The tuin themes; the field is free text, these are the ones with reference material. */
export const CANONICAL_THEMES = [
  'migraine',
  'grounding',
  'energizing',
  'overwhelmed',
  'chill',
] as const

export interface BreathingPattern {
  inhaleSec: number
  exhaleSec: number
  /** Retention after the inhale (0 when omitted). */
  holdInSec?: number
  /** Retention after the exhale (0 when omitted). */
  holdOutSec?: number
  route: BreathRoute
  style: BreathStyle
}

export interface VoiceCue {
  /** Seconds from the section's start. */
  atSec: number
  /** What the voice says; `<2s>`-style pause tags allowed. */
  text: string
  kind?: CueKind
  /** 1..3, the cue's energy (tuin `intensity:` header). */
  intensity?: number
  /** The tuin phase the cue belongs to ("settle", "heart", "peak", …). */
  phase?: string
  /** A breathing pattern that applies from this cue to the end of the section (the gradual transitions). */
  breathing?: BreathingPattern
}

export interface BreathHold {
  /** Seconds from the section's start. */
  atSec: number
  durationSec: number
  kind: HoldKind
}

export interface ScriptSection {
  role: SectionRole
  name: string
  /** Target length; the music the compiler selects fills at least this. */
  durationSec: number
  /** Music intensity the section expects, 1..3. */
  intensity: number
  breathing: BreathingPattern
  cues: VoiceCue[]
  holds?: BreathHold[]
}

export interface SessionScript {
  format: typeof SESSION_SCRIPT_FORMAT
  id?: string
  title: string
  theme: string
  timeOfDay?: TimeOfDay
  intention?: string
  /** The listener's name, for the compiler's metadata only (the text already carries it). */
  listener?: string
  /** BCP 47 tag for the voice provider. */
  language?: string
  sections: [ScriptSection, ScriptSection, ScriptSection]
}

// --- Defaults --------------------------------------------------------------------------------

/** The canon's breathing per role (references/breathing-patterns.md). */
export const DEFAULT_BREATHING: Readonly<Record<SectionRole, BreathingPattern>> = {
  grounding: { inhaleSec: 5, exhaleSec: 5, route: 'nose', style: 'belly' },
  active: { inhaleSec: 2, exhaleSec: 2, route: 'mouth', style: 'connected' },
  integration: { inhaleSec: 5.5, exhaleSec: 7, route: 'mouth', style: 'slow' },
}

/** The canon's section names. */
export const DEFAULT_SECTION_NAMES: Readonly<Record<SectionRole, string>> = {
  grounding: 'Grounding',
  active: 'Active Breath',
  integration: 'Integration',
}

/** Total target length: the sum of the sections. */
export function scriptDurationSec(script: SessionScript): number {
  return script.sections.reduce((sum, section) => sum + section.durationSec, 0)
}

/** One breath cycle's length. */
export function breathCycleSec(pattern: BreathingPattern): number {
  return (
    pattern.inhaleSec + (pattern.holdInSec ?? 0) + pattern.exhaleSec + (pattern.holdOutSec ?? 0)
  )
}

// --- Pause tags ------------------------------------------------------------------------------

const PAUSE_TAG = /<(\d+(?:\.\d+)?)s>/g
const PAUSE_TAG_ONLY = /^<\d+(?:\.\d+)?s>$/
const ANY_TAG = /<[^>]*>/g

/** Seconds of `<2s>`-style pauses in a cue. */
export function pauseSeconds(text: string): number {
  let total = 0
  for (const match of text.matchAll(PAUSE_TAG)) total += Number.parseFloat(match[1])
  return total
}

/** The cue without its pause tags, whitespace collapsed (what a TTS engine reads). */
export function stripPauseTags(text: string): string {
  return text.replace(PAUSE_TAG, ' ').replace(/\s+/g, ' ').trim()
}

/** Tags that are not pause tags: markup the TTS would read aloud. */
export function foreignTags(text: string): string[] {
  return [...text.matchAll(ANY_TAG)].map((m) => m[0]).filter((tag) => !PAUSE_TAG_ONLY.test(tag))
}

// --- JSON Schema (the prompt contract) -------------------------------------------------------

const seconds = (description: string, min = 0): JsonSchema => ({
  type: 'number',
  minimum: min,
  description,
})

const breathingSchema: JsonSchema = {
  type: 'object',
  description:
    'One breath cycle. Grounding: 4–6 s in through the nose to the belly, 4–6 s out. Active: connected mouth breathing, ~1 s belly + 1 s chest in, ~2 s out, no pause. Integration: slow, exhale longer than inhale.',
  properties: {
    inhaleSec: seconds('Inhale length in seconds.', 0.5),
    exhaleSec: seconds('Exhale length in seconds.', 0.5),
    holdInSec: seconds('Retention after the inhale; omit or 0 for none.'),
    holdOutSec: seconds('Retention after the exhale; omit or 0 for none.'),
    route: { type: 'string', enum: [...BREATH_ROUTES], description: 'Nose or mouth.' },
    style: {
      type: 'string',
      enum: [...BREATH_STYLES],
      description:
        'belly (slow diaphragmatic), three-part (belly → chest → release, slow), connected (the active wave, no pauses), slow (long integration breaths).',
    },
  },
  required: ['inhaleSec', 'exhaleSec', 'route', 'style'],
  additionalProperties: false,
}

const cueSchema: JsonSchema = {
  type: 'object',
  description:
    'One spoken instruction. Invitational, partnership language ("just you, me, and the breath"), personal; say "part" never "section"; never the word "journey". Pause tags <2s>, <1.5s>, <0.5s> are allowed inside the text. One cue every 30–60 s; the voice reacts to the music, never anticipates it.',
  properties: {
    atSec: seconds('Seconds from the start of this part.'),
    text: { type: 'string', minLength: 1, maxLength: 1200, description: 'The words spoken.' },
    kind: {
      type: 'string',
      enum: [...CUE_KINDS],
      description:
        'cue (default), checkin, transition-ack (react to the music after it changed), sound-release (the active peak: "Make a sound. On three."), hold-entry / hold-release (around a breath hold), closing (the three deep breaths and "Welcome back").',
    },
    intensity: {
      type: 'integer',
      minimum: 1,
      maximum: 3,
      description: 'Energy of the delivery, 1 calm … 3 driving.',
    },
    phase: {
      type: 'string',
      maxLength: 40,
      description:
        'The phase this cue serves: settle, heart, tap, belly, expand, combine, rhythm; theme, tension, peak, build; acknowledge, slow, still, hold, wake, install, three-breaths, close.',
    },
    breathing: {
      ...breathingSchema,
      description:
        'Optional: a breathing pattern that takes over from this cue to the end of the part (the gradual belly → mouth → three-part build late in grounding).',
    },
  },
  required: ['atSec', 'text'],
  additionalProperties: false,
}

const holdSchema: JsonSchema = {
  type: 'object',
  description: 'A breath hold: the guide falls silent, the voice enters and releases it.',
  properties: {
    atSec: seconds('Seconds from the start of this part.'),
    durationSec: {
      type: 'number',
      minimum: 10,
      maximum: 120,
      description: 'Hold length, 10–120 s.',
    },
    kind: {
      type: 'string',
      enum: [...HOLD_KINDS],
      description: 'inhale: retention on full; exhale: retention on empty.',
    },
  },
  required: ['atSec', 'durationSec', 'kind'],
  additionalProperties: false,
}

const sectionSchema: JsonSchema = {
  type: 'object',
  description:
    'One of the three parts, in order: grounding (music intensity 1, slow belly breathing, 7 phases), active (intensity 3 always, connected breathing, sound release about two thirds through, never wind down), integration (2 → 1, slow breathing, exactly two holds — one inhale, one exhale — wake, install the theme, three deep breaths, "Welcome back").',
  properties: {
    role: { type: 'string', enum: [...SECTION_ROLES] },
    name: { type: 'string', minLength: 1, maxLength: 60, description: 'Spoken name of the part.' },
    durationSec: {
      type: 'number',
      minimum: 60,
      maximum: 3600,
      description: 'Target length in seconds; the music selected fills at least this.',
    },
    intensity: {
      type: 'integer',
      minimum: 1,
      maximum: 3,
      description: 'Music intensity the part expects: grounding 1, active 3, integration 1.',
    },
    breathing: breathingSchema,
    cues: { type: 'array', minItems: 1, maxItems: 120, items: cueSchema },
    holds: { type: 'array', maxItems: 4, items: holdSchema },
  },
  required: ['role', 'name', 'durationSec', 'intensity', 'breathing', 'cues'],
  additionalProperties: false,
}

/**
 * The schema a planner fills: a complete three-part session script. Also the
 * `script` parameter of the `author_script` tool.
 */
export const SESSION_SCRIPT_SCHEMA: JsonSchema = {
  type: 'object',
  description:
    'A complete guided breathwork session: three parts (grounding, active, integration) with target durations, a breathing pattern each, timed voice cues and breath holds. Music is selected and placed by the compiler; write the words and the timing.',
  properties: {
    format: { const: SESSION_SCRIPT_FORMAT, description: 'Always 1.' },
    id: { type: 'string', maxLength: 80, description: 'Your id for the session (optional).' },
    title: { type: 'string', minLength: 1, maxLength: 120 },
    theme: {
      type: 'string',
      minLength: 1,
      maxLength: 60,
      description: `The theme woven through the words: ${CANONICAL_THEMES.join(', ')}, or your own word (release, presence, harmony).`,
    },
    timeOfDay: { type: 'string', enum: [...TIMES_OF_DAY] },
    intention: {
      type: 'string',
      maxLength: 400,
      description: 'One line: what this session is for.',
    },
    listener: { type: 'string', maxLength: 80, description: "The listener's name." },
    language: { type: 'string', maxLength: 20, description: 'BCP 47 tag for the voice, e.g. en.' },
    sections: { type: 'array', minItems: 3, maxItems: 3, items: sectionSchema },
  },
  required: ['format', 'title', 'theme', 'sections'],
  additionalProperties: false,
}

// --- Validation ------------------------------------------------------------------------------

export interface ScriptIssue {
  /** `sections[1].cues[3].atSec`-style path into the script. */
  path: string
  message: string
}

export class SessionScriptError extends Error {
  readonly issues: readonly ScriptIssue[]
  readonly canon: readonly CanonIssue[]

  constructor(issues: readonly ScriptIssue[], canon: readonly CanonIssue[] = []) {
    const lines = [
      ...issues.map((issue) => `  ${issue.path}: ${issue.message}`),
      ...canon.map((issue) => `  ${issue.path} [${issue.rule}]: ${issue.message}`),
    ]
    super(
      `live-mix: invalid session script (${lines.length} issue${lines.length === 1 ? '' : 's'}):\n${lines.join('\n')}`,
    )
    this.name = 'SessionScriptError'
    this.issues = issues
    this.canon = canon
  }
}

/**
 * Structural validation: the schema, then what it cannot express — cues and
 * holds inside their part and in time order, holds not overlapping, only
 * pause tags in the text. Empty means the input is a `SessionScript`.
 */
export function validateSessionScript(input: unknown): ScriptIssue[] {
  const schemaIssues: SchemaIssue[] = validateSchema(SESSION_SCRIPT_SCHEMA, input)
  if (schemaIssues.length > 0) return schemaIssues.map((issue) => ({ ...issue }))
  const script = input as SessionScript
  const issues: ScriptIssue[] = []
  script.sections.forEach((section, s) => {
    const path = `sections[${s}]`
    let previousAt = -Infinity
    section.cues.forEach((cue, c) => {
      const cuePath = `${path}.cues[${c}]`
      if (cue.atSec >= section.durationSec) {
        issues.push({
          path: `${cuePath}.atSec`,
          message: `cue at ${cue.atSec} s starts after the part ends (${section.durationSec} s)`,
        })
      }
      if (cue.atSec < previousAt) {
        issues.push({ path: `${cuePath}.atSec`, message: 'cues must be in time order' })
      }
      previousAt = cue.atSec
      const tags = foreignTags(cue.text)
      if (tags.length > 0) {
        issues.push({
          path: `${cuePath}.text`,
          message: `only pause tags like <2s> are allowed, found ${tags.join(' ')}`,
        })
      }
      if (stripPauseTags(cue.text).length === 0) {
        issues.push({ path: `${cuePath}.text`, message: 'a cue needs words, not only pauses' })
      }
    })
    const holds = [...(section.holds ?? [])].sort((a, b) => a.atSec - b.atSec)
    holds.forEach((hold, h) => {
      const holdPath = `${path}.holds[${h}]`
      if (hold.atSec + hold.durationSec > section.durationSec) {
        issues.push({ path: `${holdPath}`, message: 'the hold runs past the end of the part' })
      }
      const next = holds[h + 1]
      if (next && next.atSec < hold.atSec + hold.durationSec) {
        issues.push({ path: `${path}.holds[${h + 1}].atSec`, message: 'holds overlap' })
      }
    })
  })
  return issues
}

// --- Canon -----------------------------------------------------------------------------------

export type CanonRule =
  | 'section-order'
  | 'grounding-intensity'
  | 'active-intensity'
  | 'integration-intensity'
  | 'integration-two-holds'
  | 'closing-cue'
  | 'sound-release'
  | 'sound-release-position'
  | 'cue-cadence'
  | 'first-cue'
  | 'no-journey'
  | 'say-part'
  | 'cue-in-hold'

export interface CanonIssue {
  rule: CanonRule
  path: string
  message: string
}

/** The canon as prose, for a planner's system prompt (`sessionScriptPromptContract`). */
export const SESSION_SCRIPT_CANON: readonly { rule: CanonRule; text: string }[] = [
  {
    rule: 'section-order',
    text: 'Exactly three parts in this order: grounding, active, integration.',
  },
  {
    rule: 'grounding-intensity',
    text: 'Grounding expects music intensity 1: slow, belly breathing, seven phases from settle to rhythm.',
  },
  {
    rule: 'active-intensity',
    text: 'Active always expects intensity 3 and never winds down; keep building until the music changes.',
  },
  {
    rule: 'integration-intensity',
    text: 'Integration expects intensity 1 (the music itself steps 2 → 1); acknowledge the change after it happens.',
  },
  {
    rule: 'integration-two-holds',
    text: 'Integration has exactly two breath holds: one on the inhale, one on the exhale.',
  },
  {
    rule: 'closing-cue',
    text: 'The last cue of integration is the closing: three deep breaths together, then "Welcome back".',
  },
  {
    rule: 'sound-release',
    text: 'Active has one sound-release cue ("Make a sound. On three. Ahhh.") about two thirds of the way through.',
  },
  {
    rule: 'cue-cadence',
    text: 'Cues are 20–90 s apart (one every 30–60 s is the norm), the first within the first minute of a part.',
  },
  { rule: 'no-journey', text: 'Never use the word "journey".' },
  { rule: 'say-part', text: 'Say "part", never "section", when you speak about the structure.' },
  { rule: 'cue-in-hold', text: 'No cue starts inside a breath hold except a hold-release.' },
]

export interface CanonOptions {
  /** Smallest gap between cues. Default 20 s. */
  minCueGapSec?: number
  /** Largest gap between cues. Default 90 s. */
  maxCueGapSec?: number
  /** How late the first cue of a part may fall. Default 60 s. */
  firstCueBySec?: number
  /** Where the sound release may fall in the active part, as fractions of its length. Default 0.45–0.9. */
  soundReleaseWindow?: readonly [number, number]
}

/** The tuin / Breathwork Live canon over a structurally valid script. Empty means canon-clean. */
export function checkScriptCanon(script: SessionScript, options: CanonOptions = {}): CanonIssue[] {
  const minGap = options.minCueGapSec ?? 20
  const maxGap = options.maxCueGapSec ?? 90
  const firstBy = options.firstCueBySec ?? 60
  const [releaseFrom, releaseTo] = options.soundReleaseWindow ?? [0.45, 0.9]
  const issues: CanonIssue[] = []
  const push = (rule: CanonRule, path: string, message: string) =>
    issues.push({ rule, path, message })

  script.sections.forEach((section, s) => {
    const path = `sections[${s}]`
    const expectedRole = SECTION_ROLES[s]
    if (section.role !== expectedRole) {
      push(
        'section-order',
        `${path}.role`,
        `part ${s + 1} must be "${expectedRole}", got "${section.role}"`,
      )
    }
    section.cues.forEach((cue, c) => {
      const cuePath = `${path}.cues[${c}]`
      if (/\bjourney\b/i.test(cue.text))
        push('no-journey', `${cuePath}.text`, 'the word "journey" is never used')
      if (/\bsections?\b/i.test(cue.text))
        push('say-part', `${cuePath}.text`, 'say "part", not "section"')
      if (c === 0 && cue.atSec > firstBy) {
        push(
          'first-cue',
          `${cuePath}.atSec`,
          `the first cue of a part falls within ${firstBy} s, this one at ${cue.atSec} s`,
        )
      }
      if (c > 0) {
        const gap = cue.atSec - section.cues[c - 1].atSec
        if (gap < minGap)
          push(
            'cue-cadence',
            `${cuePath}.atSec`,
            `only ${gap} s after the previous cue (minimum ${minGap} s)`,
          )
        if (gap > maxGap)
          push(
            'cue-cadence',
            `${cuePath}.atSec`,
            `${gap} s after the previous cue (maximum ${maxGap} s)`,
          )
      }
      for (const hold of section.holds ?? []) {
        const inside = cue.atSec > hold.atSec && cue.atSec < hold.atSec + hold.durationSec
        if (inside && cue.kind !== 'hold-release') {
          push(
            'cue-in-hold',
            `${cuePath}.atSec`,
            `cue at ${cue.atSec} s starts inside the ${hold.kind} hold (${hold.atSec}–${hold.atSec + hold.durationSec} s)`,
          )
        }
      }
    })
  })

  const [grounding, active, integration] = script.sections
  if (grounding.intensity !== 1)
    push(
      'grounding-intensity',
      'sections[0].intensity',
      `grounding expects intensity 1, got ${grounding.intensity}`,
    )
  if (active.intensity !== 3)
    push(
      'active-intensity',
      'sections[1].intensity',
      `active is always intensity 3, got ${active.intensity}`,
    )
  if (integration.intensity !== 1)
    push(
      'integration-intensity',
      'sections[2].intensity',
      `integration expects intensity 1, got ${integration.intensity}`,
    )

  const releases = active.cues.filter((cue) => cue.kind === 'sound-release')
  if (releases.length !== 1) {
    push(
      'sound-release',
      'sections[1].cues',
      `active needs exactly one sound-release cue, found ${releases.length}`,
    )
  } else {
    const at = releases[0].atSec / active.durationSec
    if (at < releaseFrom || at > releaseTo) {
      push(
        'sound-release-position',
        'sections[1].cues',
        `the sound release falls at ${Math.round(at * 100)} % of the part; aim for ${Math.round(releaseFrom * 100)}–${Math.round(releaseTo * 100)} %`,
      )
    }
  }

  const holds = integration.holds ?? []
  const inhale = holds.filter((hold) => hold.kind === 'inhale').length
  const exhale = holds.filter((hold) => hold.kind === 'exhale').length
  if (holds.length !== 2 || inhale !== 1 || exhale !== 1) {
    push(
      'integration-two-holds',
      'sections[2].holds',
      `integration needs exactly two holds, one inhale and one exhale; found ${holds.length} (${inhale} inhale, ${exhale} exhale)`,
    )
  }
  const last = integration.cues[integration.cues.length - 1]
  if (last?.kind !== 'closing') {
    push(
      'closing-cue',
      'sections[2].cues',
      'the last cue of integration must be the closing (three deep breaths, "Welcome back")',
    )
  }
  return issues
}

export interface ParseSessionScriptOptions extends CanonOptions {
  /** `error` (default): canon issues throw; `warn`: returned via `onCanon`; `off`: not checked. */
  canon?: 'error' | 'warn' | 'off'
  onCanon?: (issues: CanonIssue[]) => void
}

/**
 * Validate (throws `SessionScriptError`), check the canon per `options.canon`,
 * and return the script with defaults filled (cue kinds, hold lists).
 */
export function parseSessionScript(
  input: unknown,
  options: ParseSessionScriptOptions = {},
): SessionScript {
  const value: unknown = typeof input === 'string' ? JSON.parse(input) : input
  const issues = validateSessionScript(value)
  if (issues.length > 0) throw new SessionScriptError(issues)
  const script = normaliseScript(value as SessionScript)
  const mode = options.canon ?? 'error'
  if (mode !== 'off') {
    const canon = checkScriptCanon(script, options)
    if (canon.length > 0) {
      if (mode === 'error') throw new SessionScriptError([], canon)
      options.onCanon?.(canon)
    }
  }
  return script
}

/** A fresh copy with cue kinds and hold lists filled and cues/holds in time order. */
export function normaliseScript(script: SessionScript): SessionScript {
  const sections = script.sections.map((section) => ({
    ...section,
    breathing: { ...section.breathing },
    cues: [...section.cues]
      .sort((a, b) => a.atSec - b.atSec)
      .map((cue) => ({ ...cue, kind: cue.kind ?? 'cue' })),
    holds: [...(section.holds ?? [])]
      .sort((a, b) => a.atSec - b.atSec)
      .map((hold) => ({ ...hold })),
  })) as [ScriptSection, ScriptSection, ScriptSection]
  return { ...script, sections }
}

/** One line per issue, for a tool's error message. */
export function formatScriptIssues(
  issues: readonly ScriptIssue[],
  canon: readonly CanonIssue[] = [],
): string {
  const structural = formatIssues(issues)
  const rules = canon.map((issue) => `${issue.path} [${issue.rule}]: ${issue.message}`).join('; ')
  return [structural, rules].filter((part) => part.length > 0).join('; ')
}

/**
 * The prompt contract as text: what the compiler needs, the schema, and the
 * canon — paste it into a planner's system prompt and ask for JSON.
 */
export function sessionScriptPromptContract(): string {
  const rules = SESSION_SCRIPT_CANON.map((rule) => `- ${rule.text}`).join('\n')
  return [
    'Write a complete guided breathwork session as one JSON object matching the schema below.',
    "Music is selected and placed by the compiler from a library on a 1–3 intensity ladder; write the words and their timing. Each part's durationSec is a target the music fills at least; keep cue times inside it.",
    '',
    'Rules:',
    rules,
    '',
    'Schema (JSON Schema 2020-12):',
    JSON.stringify(SESSION_SCRIPT_SCHEMA, null, 2),
  ].join('\n')
}
