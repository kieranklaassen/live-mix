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
})
