// The script tools through the controller: catalogue and schemas, consent,
// validation and canon rejection, the load as one undoable batch, dry runs,
// the voice rail, rate limits, previews with and without a seek, and render
// jobs that finish with WAV bytes.

import Ajv2020 from 'ajv/dist/2020'
import { describe, expect, it, vi } from 'vitest'

import {
  MockAudioBuffer,
  asAudioContext,
  createMockContext,
  createMockOfflineContext,
  type MockAudioContext,
} from '../../../testing'
import { type OfflineContextFactory } from '../../../core/render/OfflineRenderer'
import { readWavInfo } from '../../../core/render/encode'
import { createEngine, type Engine } from '../../../core/Engine'
import { loadScore } from '../../../score/loadScore'
import {
  createScore,
  defaultStrip,
  masterDestination,
  serializeScore,
  type Score,
} from '../../../score/schema'
import { ScoreDocument } from '../../../score/ScoreDocument'
import { AgentController } from '../../AgentController'
import { type AgentSession, type ToolFailure, type ToolSuccess } from '../../types'
import { compileScript } from '../compile'
import { type SessionScript } from '../script'
import {
  SCRIPT_TOOL_NAMES,
  SCRIPT_TOOL_RATE_LIMITS,
  type ScriptAuthoring,
  createScriptAuthoring,
  scoreExtentSec,
  scriptTools,
  type ScriptAuthoringOptions,
} from '../tools'
import { shortLibrary, shortScript } from './fixtures'

const ajv = new Ajv2020({ strict: true, allErrors: true })
const SAMPLE_RATE = 48000

function buffer(seconds = 10): AudioBuffer {
  return new MockAudioBuffer(
    2,
    Math.round(seconds * SAMPLE_RATE),
    SAMPLE_RATE,
  ) as unknown as AudioBuffer
}

/** A document with a live coach voice already in it, as Breathwork Live's session has. */
function sessionScore(): Score {
  const score = createScore({ id: 'session', name: 'Session' })
  score.tracks = [
    {
      kind: 'live',
      id: 'voice',
      name: 'Voice',
      destination: masterDestination(),
      strip: defaultStrip(),
    },
  ]
  return score
}

interface Rig {
  ctx: MockAudioContext
  engine: Engine
  document: ScoreDocument
  controller: AgentController
  authoring: ScriptAuthoring
  clock: { ms: number }
  offline: ReturnType<typeof createMockOfflineContext>[]
}

async function rig(
  options: {
    score?: Score
    session?: AgentSession
    authoring?: ScriptAuthoringOptions
    library?: boolean
  } = {},
): Promise<Rig> {
  const ctx = createMockContext({ sampleRate: SAMPLE_RATE })
  const engine = createEngine({
    context: asAudioContext(ctx),
    setIntervalFn: () => 0 as unknown as ReturnType<typeof setInterval>,
    clearIntervalFn: () => {},
  })
  const clock = { ms: 1_000_000 }
  const document = new ScoreDocument(options.score ?? sessionScore(), { now: () => clock.ms })
  const renderer = loadScore(engine, document, {
    resolveSource: (source) => buffer(source.durationSec ?? 10),
    onError: (error) => {
      throw error
    },
  })
  await renderer.whenIdle()
  const offline: ReturnType<typeof createMockOfflineContext>[] = []
  const factory: OfflineContextFactory = (args) => {
    const context = createMockOfflineContext(args)
    offline.push(context)
    return context as unknown as ReturnType<OfflineContextFactory>
  }
  const authoring = createScriptAuthoring({
    render: {
      createContext: factory,
      renderer: { resolveSource: (source) => buffer(source.durationSec ?? 10) },
      sampleRate: 8000,
    },
    ...options.authoring,
  })
  const controller = new AgentController({
    engine,
    document,
    roles: { voice: 'voice', music: 'music' },
    library: options.library === false ? [] : shortLibrary(),
    session: options.session,
    now: () => clock.ms,
    tools: authoring.tools(),
  })
  return { ctx, engine, document, controller, authoring, clock, offline }
}

/** Narrow away `undefined`/`null` in a fixture lookup. */
function must<T>(value: T | undefined | null, what = 'value'): T {
  if (value === undefined || value === null) throw new Error(`expected ${what}`)
  return value
}

function ok(result: ReturnType<AgentController['call']>): ToolSuccess {
  if (!result.ok)
    throw new Error(`expected success, got ${result.error.code}: ${result.error.message}`)
  return result
}

function failed(result: ReturnType<AgentController['call']>): ToolFailure {
  if (result.ok) throw new Error('expected a failure')
  return result
}

describe('catalogue', () => {
  it('lists the three tools with their rate limits, in OpenAI and Anthropic shapes', async () => {
    const { controller } = await rig()
    const names = controller.listTools().map((tool) => tool.name)
    for (const name of SCRIPT_TOOL_NAMES) expect(names).toContain(name)
    const author = must(controller.listTools().find((tool) => tool.name === 'author_script'))
    expect(author.consent).toBe('structure')
    expect(author.rateLimit).toEqual(SCRIPT_TOOL_RATE_LIMITS.author_script)
    expect(author.category).toBe('operation')
    expect(controller.toOpenAiTools().map((tool) => tool.name)).toContain('render_session')
    expect(controller.toAnthropicTools().map((tool) => tool.name)).toContain('preview_section')
  })

  it.each(SCRIPT_TOOL_NAMES)(
    '%s: the schema compiles under Ajv 2020-12 strict mode',
    async (name) => {
      const { controller } = await rig()
      const tool = must(controller.listTools().find((candidate) => candidate.name === name))
      expect(typeof ajv.compile(tool.parameters)).toBe('function')
    },
  )

  it('needs a document and a library to author; previews and renders need the document', async () => {
    const bare = new AgentController({ tools: scriptTools() })
    expect(bare.listTools().map((tool) => tool.name)).not.toContain('author_script')
    expect(bare.listTools().map((tool) => tool.name)).not.toContain('preview_section')
    const noLibrary = await rig({ library: false })
    const names = noLibrary.controller.listTools().map((tool) => tool.name)
    expect(names).not.toContain('author_script')
    expect(names).toContain('preview_section')
    expect(names).toContain('render_session')
  })
})

describe('author_script', () => {
  it('needs the structure consent, then loads the compiled score as one undoable batch', async () => {
    const { controller, document, authoring, clock } = await rig({
      session: { isSpeaking: () => false },
    })
    const onAuthored = vi.fn()
    authoring.options.onAuthored = onAuthored
    const refused = failed(controller.call('author_script', { script: shortScript() }))
    expect(refused.error.code).toBe('consent_required')

    controller.grantConsent('structure')
    const result = ok(controller.call('author_script', { script: shortScript() }))
    expect(result.operations).toHaveLength(1)
    expect(result.operations[0].type).toBe('batch')
    expect(result.result).toMatchObject({
      title: 'Evening grounding',
      theme: 'grounding',
      seed: 0,
      cues: 11,
      warnings: [],
      canon: [],
    })
    const parts = result.result.parts as Record<string, unknown>[]
    expect(parts.map((part) => part.role)).toEqual(['grounding', 'active', 'integration'])
    expect(parts[0]).toMatchObject({ part: 1, startSec: 0, targetDurationSec: 90 })
    expect(document.score.tracks.map((track) => track.id)).toEqual([
      'music',
      'voice',
      'breath-guide',
    ])
    expect(document.score.tracks[1].kind).toBe('audio')
    expect(document.score.name).toBe('Evening grounding')
    expect(authoring.compiled?.durationSec).toBe(result.result.durationSec)
    expect(authoring.script?.title).toBe('Evening grounding')
    expect(onAuthored).toHaveBeenCalledTimes(1)
    expect(document.log.entries[document.log.entries.length - 1].author.kind).toBe('agent')
    expect(controller.audit.entries[controller.audit.entries.length - 1].summary).toMatch(
      /author "Evening grounding"/,
    )

    // The live voice track was replaced by the compiled voice clips track; undo brings it back.
    const undone = ok(controller.undo())
    expect(undone.result.undone).toBe(result.callId)
    expect(document.score.tracks.map((track) => track.id)).toEqual(['voice'])
    expect(document.score.tracks[0].kind).toBe('live')
    expect(document.score.lanes).toEqual([])
    clock.ms += 60_000
  })

  it('matches compileScript for the same seed, and a different seed picks differently', async () => {
    const { controller, document } = await rig({
      score: createScore({ id: 'evening-grounding' }),
      session: { isSpeaking: () => false },
    })
    controller.grantConsent('structure')
    ok(controller.call('author_script', { script: shortScript(), seed: 4 }))
    expect(serializeScore(document.score)).toBe(
      serializeScore(compileScript(shortScript(), shortLibrary(), { seed: 4 })),
    )
  })

  it('rejects malformed scripts as invalid_args and canon breaks as rejected, naming the rule', async () => {
    const { controller, document, clock } = await rig({ session: { isSpeaking: () => false } })
    controller.grantConsent('structure')
    const malformed = failed(
      controller.call('author_script', { script: { format: 1, title: 'x' } }),
    )
    expect(malformed.error.code).toBe('invalid_args')
    expect(malformed.error.issues?.some((issue) => issue.path.includes('sections'))).toBe(true)
    clock.ms += 31_000

    const script: SessionScript = shortScript()
    script.sections[1].intensity = 2
    script.sections[0].cues[0].text = 'A journey begins.'
    const canon = failed(controller.call('author_script', { script }))
    expect(canon.error.code).toBe('rejected')
    expect(canon.error.message).toMatch(/\[active-intensity\]/)
    expect(canon.error.message).toMatch(/\[no-journey\]/)
    expect(document.score.tracks.map((track) => track.id)).toEqual(['voice'])

    clock.ms += 31_000
    const late = shortScript()
    late.sections[0].cues[2].atSec = 200
    const semantic = failed(controller.call('author_script', { script: late }))
    expect(semantic.error.code).toBe('rejected')
    expect(semantic.error.message).toMatch(/starts after the part ends/)
  })

  it('can let canon issues through as warnings in the result', async () => {
    const { controller } = await rig({
      session: { isSpeaking: () => false },
      authoring: { canon: 'warn' },
    })
    controller.grantConsent('structure')
    const script = shortScript()
    script.sections[0].cues[0].text = 'A journey begins.'
    const result = ok(controller.call('author_script', { script }))
    expect(result.result.canon).toEqual([expect.stringMatching(/^\[no-journey\]/)])
  })

  it('dry runs compile but apply nothing', async () => {
    const { controller, document, authoring } = await rig({ session: { isSpeaking: () => false } })
    controller.grantConsent('structure')
    const result = ok(controller.call('author_script', { script: shortScript() }, { dryRun: true }))
    expect(result.dryRun).toBe(true)
    expect(result.operations).toEqual([])
    expect(result.compiled).toHaveLength(1)
    expect(result.result.title).toBe('Evening grounding')
    expect(document.score.tracks.map((track) => track.id)).toEqual(['voice'])
    expect(authoring.compiled).toBeNull()
    // The dry run consumed no budget: the real call still passes the rate limit.
    ok(controller.call('author_script', { script: shortScript() }))
  })

  it('refuses to replace the voice while the coach is speaking (voice rail)', async () => {
    const { controller, document } = await rig()
    controller.grantConsent('structure')
    const refused = failed(controller.call('author_script', { script: shortScript() }))
    expect(refused.error.code).toBe('rejected')
    expect(refused.rails).toEqual([expect.objectContaining({ rail: 'voice', action: 'rejected' })])
    expect(document.score.tracks[0].kind).toBe('live')
    // With the compiled voice on another id the live voice is untouched and the call passes.
    const other = await rig({ authoring: { compile: { ids: { voice: 'script-voice' } } } })
    other.controller.grantConsent('structure')
    ok(other.controller.call('author_script', { script: shortScript() }))
    expect(other.document.score.tracks.map((track) => track.id)).toEqual([
      'voice',
      'music',
      'script-voice',
      'breath-guide',
    ])
    expect(other.document.score.tracks[0].kind).toBe('live')
  })

  it("lets the consumer's rails table override the tools' declared rate limits", async () => {
    const ctx = createMockContext({ sampleRate: SAMPLE_RATE })
    const engine = createEngine({ context: asAudioContext(ctx) })
    const document = new ScoreDocument(createScore({ id: 'evening-grounding' }))
    const controller = new AgentController({
      engine,
      document,
      library: shortLibrary(),
      session: { isSpeaking: () => false },
      tools: scriptTools(),
      rails: { rateLimits: { author_script: { burst: 5, perMinute: 60 } }, consent: ['structure'] },
    })
    const author = must(controller.listTools().find((tool) => tool.name === 'author_script'))
    expect(author.rateLimit).toEqual({ burst: 5, perMinute: 60 })
    ok(controller.call('author_script', { script: shortScript() }))
    ok(controller.call('author_script', { script: shortScript(), seed: 1 }))
    engine.dispose()
  })

  it('is rate-limited to one call per 30 s by default', async () => {
    const { controller, clock } = await rig({ session: { isSpeaking: () => false } })
    controller.grantConsent('structure')
    ok(controller.call('author_script', { script: shortScript() }))
    const limited = failed(controller.call('author_script', { script: shortScript(), seed: 1 }))
    expect(limited.error.code).toBe('rate_limited')
    expect(limited.error.retryAfterMs).toBeGreaterThan(0)
    clock.ms += 31_000
    ok(controller.call('author_script', { script: shortScript(), seed: 1 }))
  })
})

describe('preview_section', () => {
  it('rejects before a script is authored and describes a part after', async () => {
    const { controller, authoring } = await rig({ session: { isSpeaking: () => false } })
    expect(failed(controller.call('preview_section', { part: 2 })).error.message).toMatch(
      /no script/,
    )
    expect(failed(controller.call('preview_section', { part: 4 })).error.code).toBe('invalid_args')
    controller.grantConsent('structure')
    ok(controller.call('author_script', { script: shortScript() }))
    const result = ok(controller.call('preview_section', { part: 2 }))
    const section = must(authoring.compiled).sections[1]
    expect(result.result).toMatchObject({
      part: 2,
      role: 'active',
      name: 'Active Breath',
      startSec: section.startSec,
      endSec: section.endSec,
    })
    const music = result.result.music as { intensity: number }[]
    expect(music.every((track) => track.intensity === 3)).toBe(true)
    const cues = result.result.cues as { key: string; kind: string; atSec: number }[]
    expect(cues.map((cue) => cue.key)).toEqual(['s2-c1', 's2-c2', 's2-c3', 's2-c4'])
    expect(cues[2].kind).toBe('sound-release')
    expect(cues[0].atSec).toBe(section.startSec + 7 + 5)
    expect(result.operations).toEqual([])
    expect(result.result.seekedToSec).toBeUndefined()
  })

  it('seeks a stopped transport to the part and refuses while playing', async () => {
    const { controller, engine, authoring } = await rig({ session: { isSpeaking: () => false } })
    controller.grantConsent('structure')
    ok(controller.call('author_script', { script: shortScript() }))
    const start = must(authoring.compiled).sections[2].startSec
    const seeked = ok(controller.call('preview_section', { part: 3, seek: true }))
    expect(seeked.result.seekedToSec).toBe(start)
    expect(engine.transport.position().positionSec).toBeCloseTo(start, 6)
    engine.transport.start()
    const refused = failed(controller.call('preview_section', { part: 1, seek: true }))
    expect(refused.error.code).toBe('rejected')
    expect(refused.error.message).toMatch(/playing/)
    ok(controller.call('preview_section', { part: 1 }))
  })
})

describe('render_session', () => {
  it('starts a job that finishes with WAV bytes of the authored length', async () => {
    const { controller, authoring, offline, clock } = await rig({
      session: { isSpeaking: () => false },
    })
    const onRender = vi.fn()
    authoring.options.onRender = onRender
    controller.grantConsent('structure')
    ok(controller.call('author_script', { script: shortScript() }))
    const result = ok(controller.call('render_session', {}))
    expect(result.result).toMatchObject({
      jobId: 1,
      status: 'rendering',
      sampleRate: 8000,
      format: 'wav',
    })
    expect(result.result.durationSec).toBe(must(authoring.compiled).durationSec)
    expect(authoring.rendering?.id).toBe(1)
    const limited = failed(controller.call('render_session', { sampleRate: 16000 }))
    expect(limited.error.code).toBe('rate_limited')
    clock.ms += 31_000
    const busy = failed(controller.call('render_session', { sampleRate: 16000 }))
    expect(busy.error.code).toBe('rejected')
    expect(busy.error.message).toMatch(/still running/)

    const job = await authoring.jobs[0].done
    expect(job.status).toBe('done')
    expect(job.finishedAtMs).toBeDefined()
    expect(authoring.rendering).toBeUndefined()
    expect(authoring.lastRender).toBe(job)
    const info = readWavInfo(must(job.wav))
    expect(info.sampleRate).toBe(8000)
    expect(info.frames).toBe(Math.round(must(authoring.compiled).durationSec * 8000))
    expect(offline).toHaveLength(1)
    expect(offline[0].scheduleSnapshot().sources.length).toBeGreaterThan(10)
    expect(onRender).toHaveBeenCalledWith(job)
  })

  it('renders whatever the document holds when no script was authored, and reports failures', async () => {
    const { controller, authoring, document, clock } = await rig()
    expect(failed(controller.call('render_session', {})).error.message).toMatch(/nothing to render/)
    clock.ms += 31_000
    document.apply({ type: 'source.add', source: { id: 'g1', url: '/g1.mp3', durationSec: 30 } })
    document.apply({
      type: 'track.add',
      track: {
        kind: 'audio',
        id: 'music',
        name: 'Music',
        destination: masterDestination(),
        strip: defaultStrip(),
        clips: [
          {
            id: 'c1',
            sourceId: 'g1',
            startSec: 2,
            offsetSec: 0,
            durationSec: 30,
            fadeInSec: 0,
            fadeOutSec: 0,
            fadeCurve: 'linear',
            gainDb: 0,
          },
        ],
      },
    })
    expect(scoreExtentSec(document.score)).toBe(32)
    const result = ok(controller.call('render_session', { durationSec: 5, sampleRate: 16000 }))
    expect(result.result).toMatchObject({ durationSec: 5, sampleRate: 16000 })
    const job = await authoring.jobs[0].done
    expect(job.status).toBe('done')
    expect(readWavInfo(must(job.wav)).frames).toBe(5 * 16000)

    clock.ms += 60_000
    authoring.options.render = {
      createContext: () => {
        throw new Error('no offline context here')
      },
    }
    ok(controller.call('render_session', { durationSec: 1 }))
    const broken = await authoring.jobs[1].done
    expect(broken.status).toBe('failed')
    expect(String(broken.error)).toMatch(/no offline context/)
    expect(broken.wav).toBeUndefined()
  })

  it('is a dry-run-safe intent: nothing starts without applying', async () => {
    const { controller, authoring } = await rig({ session: { isSpeaking: () => false } })
    controller.grantConsent('structure')
    ok(controller.call('author_script', { script: shortScript() }))
    const dry = ok(controller.call('render_session', {}, { dryRun: true }))
    expect(dry.dryRun).toBe(true)
    expect(authoring.jobs).toEqual([])
  })
})
