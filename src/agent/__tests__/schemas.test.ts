import Ajv2020 from 'ajv/dist/2020'
import { describe, expect, it } from 'vitest'

import { OPERATION_TYPES, apply } from '../../score/operations'
import { demoScore } from '../../score/__tests__/fixtures'
import { validateSchema } from '../jsonSchema'
import { operationForToolName, operationSchema, toolNameForOperation } from '../operationSchemas'
import { TOOL_NAME_PATTERN, toAnthropicTools, toOpenAiTools } from '../registry'
import { OPERATION_ARGS, OPERATION_PRELUDE, rig } from './fixtures'

const ajv = new Ajv2020({ strict: true, allErrors: true })

/** Break a valid argument object in ways the schema must catch. */
function corruptions(args: Record<string, unknown>): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [{ ...args, unexpected: 1 }]
  for (const [key, value] of Object.entries(args)) {
    const wrong: Record<string, unknown> = { ...args }
    wrong[key] = typeof value === 'string' ? 12 : typeof value === 'number' ? 'twelve' : 12
    out.push(wrong)
  }
  return out
}

describe('operation tool schemas', () => {
  it('every operation has a tool with an OpenAI/Anthropic-legal name, round-tripping to its type', () => {
    for (const type of OPERATION_TYPES) {
      const name = toolNameForOperation(type)
      expect(name).toMatch(TOOL_NAME_PATTERN)
      expect(operationForToolName(name)).toBe(type)
    }
    expect(toolNameForOperation('clip.replaceFrom')).toBe('clip_replace_from')
    expect(toolNameForOperation('strip.soloSafe')).toBe('strip_solo_safe')
    expect(operationForToolName('steer_music')).toBeUndefined()
  })

  it.each(OPERATION_TYPES)('%s: the schema compiles under Ajv 2020-12 strict mode', (type) => {
    const validate = ajv.compile(operationSchema(type))
    expect(typeof validate).toBe('function')
  })

  it.each(OPERATION_TYPES)(
    '%s: the sample arguments validate and apply to the demo score',
    (type) => {
      const args = OPERATION_ARGS[type]
      const validate = ajv.compile(operationSchema(type))
      expect(validate(args), JSON.stringify(validate.errors)).toBe(true)
      expect(validateSchema(operationSchema(type), args)).toEqual([])
      const before = (OPERATION_PRELUDE[type] ?? []).reduce(apply, demoScore())
      expect(() => apply(before, { type, ...args } as never)).not.toThrow()
    },
  )

  it.each(OPERATION_TYPES)(
    '%s: corrupted arguments fail under Ajv and the built-in validator alike',
    (type) => {
      const schema = operationSchema(type)
      const validate = ajv.compile(schema)
      for (const bad of corruptions(OPERATION_ARGS[type])) {
        const ajvOk = validate(bad)
        const ours = validateSchema(schema, bad)
        expect(ajvOk, `ajv accepted ${JSON.stringify(bad)}`).toBe(false)
        expect(ours.length, `built-in accepted ${JSON.stringify(bad)}`).toBeGreaterThan(0)
      }
    },
  )

  it('a slot takes a clip that names its place, held to the clip ranges', () => {
    const validate = ajv.compile(operationSchema('slot.add'))
    const slot = (clip: Record<string, unknown>) => ({
      slot: {
        id: 's',
        track: 'kick',
        scene: 'verse',
        launchMode: 'trigger',
        legato: false,
        clip: {
          sourceId: 'a',
          offsetSec: 0,
          durationSec: 4,
          fadeInSec: 0,
          fadeOutSec: 0,
          fadeCurve: 'linear',
          gainDb: 0,
          ...clip,
        },
      },
    })
    expect(validate(slot({ pan: -0.4, lowpassHz: 3000, spaceDb: -6 }))).toBe(true)
    expect(validate(slot({ pan: 2 }))).toBe(false)
    expect(validate(slot({ lowpassHz: 5 }))).toBe(false)
    expect(validate(slot({ spaceDb: 'far' }))).toBe(false)
  })

  it('missing required fields are reported by path', () => {
    const issues = validateSchema(operationSchema('strip.set'), { owner: 'kick' })
    expect(issues.map((issue) => issue.path).sort()).toEqual(['param', 'value'])
  })

  it('schemas are self-contained: every $ref resolves inside the tool schema', () => {
    for (const type of OPERATION_TYPES) {
      const schema = operationSchema(type)
      const text = JSON.stringify(schema)
      const refs = [...text.matchAll(/"\$ref":"#\/\$defs\/([A-Za-z]+)"/g)].map((match) => match[1])
      for (const name of refs)
        expect(schema.$defs?.[name], `${type} lacks $defs.${name}`).toBeDefined()
      expect(Object.keys(schema.$defs ?? {}).length).toBeLessThanOrEqual(12)
    }
    expect(operationSchema('strip.set').$defs).toBeUndefined()
    expect(Object.keys(operationSchema('track.add').$defs ?? {}).sort()).toEqual([
      'Clip',
      'Destination',
      'Device',
      'Meta',
      'Send',
      'Strip',
      'Track',
    ])
  })
})

describe('the catalogue', () => {
  it('lists every operation and intent with a valid schema, and exports both provider shapes', async () => {
    const { controller } = await rig({ session: { extendSection: () => 0 } })
    const tools = controller.listTools()
    const names = tools.map((tool) => tool.name)
    for (const type of OPERATION_TYPES) expect(names).toContain(toolNameForOperation(type))
    for (const intent of [
      'set_music_volume',
      'set_ambience',
      'duck',
      'steer_music',
      'set_intensity',
      'match_key',
      'extend_section',
      'fade_out',
      'more_space',
      'get_state',
      'undo',
    ]) {
      expect(names).toContain(intent)
    }
    expect(names).not.toContain('advance_section')
    expect(new Set(names).size).toBe(names.length)
    for (const tool of tools) {
      expect(tool.name).toMatch(TOOL_NAME_PATTERN)
      expect(tool.description.length).toBeGreaterThan(10)
      expect(tool.rateLimit.burst).toBeGreaterThan(0)
      expect(() => ajv.compile(tool.parameters)).not.toThrow()
    }

    const openai = toOpenAiTools(tools)
    expect(openai[0]).toMatchObject({ type: 'function', name: 'score_rename' })
    expect(openai.find((tool) => tool.name === 'steer_music')?.parameters).toEqual({
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['calmer', 'stronger', 'more-intense', 'change', 'brighter', 'darker'],
          description: 'Where to take the music.',
        },
      },
      required: ['direction'],
      additionalProperties: false,
    })
    const chat = toOpenAiTools(tools, { shape: 'chat' })
    expect(chat[0].function.name).toBe('score_rename')
    const anthropic = toAnthropicTools(tools)
    expect(anthropic.find((tool) => tool.name === 'extend_section')?.input_schema).toMatchObject({
      required: ['seconds'],
    })
    expect(controller.toOpenAiTools()).toEqual(openai)
    expect(controller.toAnthropicTools()).toEqual(anthropic)
  })

  it('intent schemas reject out-of-range and unknown arguments', async () => {
    const { controller } = await rig()
    for (const tool of controller.listTools()) {
      const validate = ajv.compile(tool.parameters)
      expect(validate({ nothing: 'here' }), tool.name).toBe(
        tool.parameters.required?.length === 0 && tool.parameters.additionalProperties !== false,
      )
    }
    const steer = controller.listTools().find((tool) => tool.name === 'steer_music')
    expect(validateSchema(steer?.parameters ?? {}, { direction: 'louder' })).toHaveLength(1)
    const extend = controller.listTools().find((tool) => tool.name === 'extend_section')
    expect(extend).toBeUndefined()
  })

  it('refuses a key that every object answers to, where no property of that name is declared', () => {
    const schema = {
      type: 'object' as const,
      properties: { theme: { type: 'string' as const } },
      additionalProperties: false,
    }
    expect(validateSchema(schema, { theme: 'paper' })).toEqual([])
    expect(validateSchema(schema, { theme: 'paper', nope: 1 })).toHaveLength(1)
    // As a model's arguments arrive: parsed, so "__proto__" is a key of its own.
    for (const key of ['constructor', 'toString', 'hasOwnProperty', 'valueOf', '__proto__']) {
      const args: unknown = JSON.parse(`{"theme":"paper","${key}":1}`)
      expect(validateSchema(schema, args), key).toEqual([
        { path: key, message: 'is not a known property' },
      ])
    }
  })

  it('asks for a required key of the value itself, not one every object answers to', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        constructor: { type: 'string' as const },
        valueOf: { type: 'number' as const },
      },
      required: ['constructor', 'valueOf'],
      additionalProperties: false,
    }
    const validate = ajv.compile(schema)
    expect(validate({})).toBe(false)
    expect(validateSchema(schema, {})).toEqual([
      { path: 'constructor', message: 'is required' },
      { path: 'valueOf', message: 'is required' },
    ])
    const given = { constructor: 'paper', valueOf: 2 }
    expect(validate(given)).toBe(true)
    expect(validateSchema(schema, given)).toEqual([])
  })

  it('holds every place of a list to its items, a place with nothing in it too', () => {
    const schema = { type: 'array' as const, items: { type: 'number' as const } }
    const holed: number[] = [1]
    holed[2] = 3
    expect(ajv.compile(schema)(holed)).toBe(false)
    expect(validateSchema(schema, holed).map((issue) => issue.path)).toEqual(['[1]'])
    expect(validateSchema(schema, [1, undefined, 3]).map((issue) => issue.path)).toEqual(['[1]'])
  })

  it('takes nothing that JSON cannot carry for a null', () => {
    const nullable = { type: ['number', 'null'] as ('number' | 'null')[] }
    const validate = ajv.compile(nullable)
    expect(validateSchema(nullable, null)).toEqual([])
    for (const value of [undefined, () => 1, Symbol('s'), BigInt(3)]) {
      expect(validate(value), typeof value).toBe(false)
      expect(validateSchema(nullable, value), typeof value).toEqual([
        { path: '', message: `expected number | null, got ${typeof value}` },
      ])
      expect(validateSchema({ type: 'array', items: nullable }, [value]), typeof value).toEqual([
        { path: '[0]', message: `expected number | null, got ${typeof value}` },
      ])
    }
    // An absent key is still absent, whatever it may be given as.
    expect(
      validateSchema({ type: 'object', properties: { level: nullable } }, { level: undefined }),
    ).toEqual([])
  })

  it('counts the characters of a text as JSON Schema does: a pair of surrogates is one', () => {
    const schema = { type: 'string' as const, minLength: 2, maxLength: 3 }
    const validate = ajv.compile(schema)
    for (const [text, fits] of [
      ['\u{1F30A}\u{1F30A}\u{1F30A}', true],
      ['\u{1F30A}', false],
      ['\u{1F30A}\u{1F30A}\u{1F30A}\u{1F30A}', false],
      ['abc', true],
      ['abcd', false],
      // Half a pair is a character of its own.
      ['\ud83c\ud83c', true],
    ] as const) {
      expect(validate(text), text).toBe(fits)
      expect(validateSchema(schema, text).length === 0, text).toBe(fits)
    }
  })
})
