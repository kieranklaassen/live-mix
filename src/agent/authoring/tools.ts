// Agent tools for authored scores (U38) on top of the U29 controller:
// `author_script` takes a whole session script, validates it against the
// schema and the canon, compiles it with the controller's library and loads
// the result into the document as one undoable batch; `preview_section`
// describes one part of the compiled timeline (and may seek a stopped
// transport to it); `render_session` bounces the current document offline to
// WAV. Register them with `new AgentController({ tools: scriptTools({...}) })`.
// The same rails apply: consent for the structural load, the voice and
// no-silence guards, per-tool rate limits, dry runs, the audit trail.

import { encodeWav } from '../../core/render/encode'
import { type OfflineContextFactory, type RenderResult } from '../../core/render/OfflineRenderer'
import { renderScore } from '../../score/renderScore'
import { type Score } from '../../score/schema'
import { type ScoreRendererOptions } from '../../score/ScoreRenderer'
import { type JsonSchema } from '../jsonSchema'
import { ToolError, type ToolContext, type ToolPlan, type ToolSpec } from '../registry'
import { type AgentTrack, type RateLimit } from '../types'
import {
  compileScriptDetailed,
  operationsToLoad,
  type CompiledScript,
  type CompiledSection,
  type CompileScriptOptions,
} from './compile'
import {
  SESSION_SCRIPT_SCHEMA,
  SessionScriptError,
  formatScriptIssues,
  parseSessionScript,
  type CanonIssue,
  type CanonOptions,
  type SessionScript,
} from './script'

// --- Options -------------------------------------------------------------------------------

export interface ScriptRenderOptions {
  /** `OfflineAudioContext` by default; injectable for tests and non-DOM hosts. */
  createContext?: OfflineContextFactory
  /** Default 48000. */
  sampleRate?: number
  /** Score renderer options for the bounce (sample resolution, device registry). */
  renderer?: ScoreRendererOptions
  /** Virtual clock step for pre-scheduling. Default 0.05 s. */
  tickSec?: number
}

export interface ScriptAuthoringOptions {
  /** Compiler options (voice provider, mix, ambience, fit, …). */
  compile?: CompileScriptOptions
  /** `reject` (default): canon issues refuse the script; `warn`: they ride along in the result. */
  canon?: 'reject' | 'warn'
  canonOptions?: CanonOptions
  render?: ScriptRenderOptions
  /** After a script is loaded into the document. */
  onAuthored?: (compiled: CompiledScript, script: SessionScript) => void
  /** After a render job finishes (done or failed). */
  onRender?: (job: RenderJob) => void
  rateLimits?: Partial<Record<ScriptToolName, RateLimit>>
}

export type ScriptToolName = 'author_script' | 'preview_section' | 'render_session'

export const SCRIPT_TOOL_NAMES: readonly ScriptToolName[] = [
  'author_script',
  'preview_section',
  'render_session',
]

export const SCRIPT_TOOL_RATE_LIMITS: Readonly<Record<ScriptToolName, RateLimit>> = {
  author_script: { burst: 1, perMinute: 2 },
  preview_section: { burst: 3, perMinute: 12 },
  render_session: { burst: 1, perMinute: 2 },
}

// --- Render jobs ---------------------------------------------------------------------------

export type RenderJobStatus = 'rendering' | 'done' | 'failed'

export interface RenderJob {
  id: number
  status: RenderJobStatus
  startedAtMs: number
  finishedAtMs?: number
  durationSec: number
  sampleRate: number
  /** The score as it was when the render started. */
  score: Score
  result?: RenderResult
  /** RIFF/WAVE bytes of the master, once done. */
  wav?: ArrayBuffer
  error?: unknown
  /** Resolves with the job itself when it is done or failed. */
  done: Promise<RenderJob>
}

// --- Schemas -------------------------------------------------------------------------------

const authorParameters: JsonSchema = {
  type: 'object',
  properties: {
    script: SESSION_SCRIPT_SCHEMA,
    seed: {
      type: 'integer',
      minimum: 0,
      description:
        'Music selection seed; the same script and seed always pick the same tracks. Change it to hear a different selection.',
    },
  },
  required: ['script'],
  additionalProperties: false,
}

const previewParameters: JsonSchema = {
  type: 'object',
  properties: {
    part: {
      type: 'integer',
      minimum: 1,
      maximum: 3,
      description: '1 grounding, 2 active, 3 integration.',
    },
    seek: {
      type: 'boolean',
      description:
        'Also move a stopped transport to the start of the part, so pressing play previews it. Refused while playing.',
    },
  },
  required: ['part'],
  additionalProperties: false,
}

const renderParameters: JsonSchema = {
  type: 'object',
  properties: {
    sampleRate: { type: 'integer', minimum: 8000, maximum: 192000, description: 'Default 48000.' },
    durationSec: {
      type: 'number',
      minimum: 1,
      description: 'Render length; default the length of the authored session.',
    },
  },
  required: [],
  additionalProperties: false,
}

// --- The authoring state and its tools -----------------------------------------------------

/**
 * Holds what the tools share: the last script and its compiled timeline, and
 * the render jobs. One instance per controller; `tools()` is what you
 * register. Also usable without an agent (`compile`, `render`).
 */
export class ScriptAuthoring {
  readonly options: ScriptAuthoringOptions
  script: SessionScript | null = null
  compiled: CompiledScript | null = null
  readonly jobs: RenderJob[] = []
  private nextJobId = 1

  constructor(options: ScriptAuthoringOptions = {}) {
    this.options = options
  }

  /** Parse (schema, semantics, canon per `options.canon`) — throws `SessionScriptError`. */
  parse(input: unknown): { script: SessionScript; canon: CanonIssue[] } {
    const canon: CanonIssue[] = []
    const script = parseSessionScript(input, {
      ...this.options.canonOptions,
      canon: this.options.canon === 'warn' ? 'warn' : 'error',
      onCanon: (issues) => canon.push(...issues),
    })
    return { script, canon }
  }

  /** Compile with the given library; `seed` overrides the compile option's. */
  compile(
    script: SessionScript,
    library: readonly AgentTrack[],
    seed?: number | bigint,
  ): CompiledScript {
    return compileScriptDetailed(script, library, {
      ...this.options.compile,
      ...(seed !== undefined ? { seed } : {}),
    })
  }

  /** The running job, if any. */
  get rendering(): RenderJob | undefined {
    return this.jobs.find((job) => job.status === 'rendering')
  }

  /** The most recently finished job (done or failed). */
  get lastRender(): RenderJob | undefined {
    return [...this.jobs].reverse().find((job) => job.status !== 'rendering')
  }

  /** Bounce `score` offline; the job resolves with WAV bytes. */
  render(
    score: Score,
    options: { durationSec: number; sampleRate?: number; nowMs?: number } = { durationSec: 0 },
  ): RenderJob {
    const render = this.options.render ?? {}
    const sampleRate = options.sampleRate ?? render.sampleRate ?? 48000
    const durationSec = options.durationSec
    let settle: (job: RenderJob) => void = () => {}
    const done = new Promise<RenderJob>((resolve) => {
      settle = resolve
    })
    const job: RenderJob = {
      id: this.nextJobId++,
      status: 'rendering',
      startedAtMs: options.nowMs ?? Date.now(),
      durationSec,
      sampleRate,
      score,
      done,
    }
    this.jobs.push(job)
    renderScore(score, {
      durationSec,
      sampleRate,
      ...(render.createContext ? { createContext: render.createContext } : {}),
      ...(render.tickSec !== undefined ? { tickSec: render.tickSec } : {}),
      ...(render.renderer ? { renderer: render.renderer } : {}),
    })
      .then((result) => {
        job.result = result
        job.wav = encodeWav(result.audio)
        job.status = 'done'
      })
      .catch((error: unknown) => {
        job.error = error
        job.status = 'failed'
      })
      .finally(() => {
        job.finishedAtMs = Date.now()
        this.options.onRender?.(job)
        settle(job)
      })
    return job
  }

  /** The three tools, in catalogue order. */
  tools(): ToolSpec[] {
    return [this.authorScript(), this.previewSection(), this.renderSession()]
  }

  private rateLimit(name: ScriptToolName): RateLimit {
    return this.options.rateLimits?.[name] ?? SCRIPT_TOOL_RATE_LIMITS[name]
  }

  // --- author_script -------------------------------------------------------------------

  private authorScript(): ToolSpec {
    return {
      definition: {
        name: 'author_script',
        description:
          'Author the whole session: hand over a complete three-part script (grounding, active, integration) with timed cues and breathing. It is validated against the canon, music is selected from the library on the Camelot wheel and the intensity ladder, cues and ducking are placed, and the result replaces the music, voice, ambience and breath-guide tracks of the score. One undoable step. Call once per session, before it starts.',
        parameters: authorParameters,
        category: 'operation',
        consent: 'structure',
        rateLimit: this.rateLimit('author_script'),
      },
      available: (view) => view.document !== null && view.library().length > 0,
      plan: (args, ctx) => this.planAuthor(args, ctx),
    }
  }

  private planAuthor(args: Record<string, unknown>, ctx: ToolContext): ToolPlan {
    const { view } = ctx
    const document = view.document
    if (!document) throw new ToolError('unavailable', 'author_script needs a score document')
    const library = view.library()
    if (library.length === 0) throw new ToolError('unavailable', 'no music library to select from')

    let parsed: { script: SessionScript; canon: CanonIssue[] }
    try {
      parsed = this.parse(args.script)
    } catch (error) {
      if (error instanceof SessionScriptError) {
        throw new ToolError(
          'rejected',
          `script rejected: ${formatScriptIssues(error.issues, error.canon)}`,
        )
      }
      throw error
    }
    const seed = args.seed as number | undefined
    const compiled = this.compile(parsed.script, library, seed)
    const current = document.score
    if (view.roles.voice && current.tracks.some((track) => track.id === view.roles.voice)) {
      const replaced = compiled.score.tracks.some((track) => track.id === view.roles.voice)
      if (replaced) view.rails.guardVoice('remove', view.speaking())
    }

    const operations = operationsToLoad(current, compiled.score, {
      label: `load script "${parsed.script.title}"`,
    })
    const result: Record<string, unknown> = {
      title: parsed.script.title,
      theme: parsed.script.theme,
      seed: seed ?? Number(this.options.compile?.seed ?? 0),
      durationSec: compiled.durationSec,
      parts: compiled.sections.map(summariseSection),
      cues: compiled.cues.length,
      warnings: compiled.warnings.slice(0, 12).map((warning) => warning.message),
      canon: parsed.canon.slice(0, 12).map((issue) => `[${issue.rule}] ${issue.message}`),
    }
    return {
      operations,
      effects: [
        () => {
          this.script = parsed.script
          this.compiled = compiled
          this.options.onAuthored?.(compiled, parsed.script)
        },
      ],
      result,
      label: `author "${parsed.script.title}" (${compiled.durationSec} s)`,
    }
  }

  // --- preview_section -----------------------------------------------------------------

  private previewSection(): ToolSpec {
    return {
      definition: {
        name: 'preview_section',
        description:
          'Describe one part of the authored session: where it starts and ends, which tracks play, when each cue and hold falls. With seek: true a stopped transport moves to its start so play previews it.',
        parameters: previewParameters,
        category: 'query',
        rateLimit: this.rateLimit('preview_section'),
      },
      available: (view) => view.document !== null,
      plan: (args, ctx) => this.planPreview(args, ctx),
    }
  }

  private planPreview(args: Record<string, unknown>, ctx: ToolContext): ToolPlan {
    const compiled = this.compiled
    if (!compiled) throw new ToolError('rejected', 'no script has been authored yet')
    const part = args.part as number
    const section = compiled.sections[part - 1]
    if (!section)
      throw new ToolError('rejected', `the session has ${compiled.sections.length} parts`)
    const seek = args.seek === true
    const engine = ctx.view.engine
    if (seek) {
      if (!engine) throw new ToolError('unavailable', 'no engine to seek')
      if (engine.transport.state === 'playing') {
        throw new ToolError('rejected', 'the session is playing; stop it before previewing a part')
      }
    }
    const cues = compiled.cues
      .filter((cue) => cue.sectionIndex === section.index)
      .map((cue) => ({
        key: cue.key,
        atSec: cue.atSec,
        kind: cue.kind,
        text: cue.text.length > 80 ? `${cue.text.slice(0, 77)}…` : cue.text,
      }))
    const result: Record<string, unknown> = {
      ...summariseSection(section),
      music: section.tracks.map((track) => ({
        title: track.title,
        camelot: track.camelot,
        intensity: track.intensity,
        durationSec: track.durationSec,
      })),
      cues,
      holds: section.holds,
    }
    return {
      operations: [],
      effects: seek
        ? [
            () => {
              engine?.transport.seek(section.startSec)
              return { seekedToSec: section.startSec }
            },
          ]
        : [],
      result,
      label: `preview part ${part}`,
    }
  }

  // --- render_session ------------------------------------------------------------------

  private renderSession(): ToolSpec {
    return {
      definition: {
        name: 'render_session',
        description:
          'Bounce the whole authored session offline to a WAV file (the same score the live player uses). Starts a render job; the host receives the file when it finishes. One job at a time.',
        parameters: renderParameters,
        category: 'intent',
        rateLimit: this.rateLimit('render_session'),
      },
      available: (view) => view.document !== null,
      plan: (args, ctx) => this.planRender(args, ctx),
    }
  }

  private planRender(args: Record<string, unknown>, ctx: ToolContext): ToolPlan {
    const document = ctx.view.document
    if (!document) throw new ToolError('unavailable', 'render_session needs a score document')
    if (this.rendering) {
      throw new ToolError('rejected', `render job ${this.rendering.id} is still running`)
    }
    const score = document.score
    const durationSec =
      (args.durationSec as number | undefined) ??
      this.compiled?.durationSec ??
      scoreExtentSec(score)
    if (durationSec <= 0) throw new ToolError('rejected', 'nothing to render: the score is empty')
    const sampleRate =
      (args.sampleRate as number | undefined) ?? this.options.render?.sampleRate ?? 48000
    const jobId = this.nextJobId
    return {
      operations: [],
      effects: [
        () => {
          const job = this.render(score, { durationSec, sampleRate, nowMs: ctx.atMs })
          return { jobId: job.id }
        },
      ],
      result: { jobId, status: 'rendering', durationSec, sampleRate, format: 'wav' },
      label: `render ${durationSec} s at ${sampleRate} Hz`,
    }
  }
}

function summariseSection(section: CompiledSection): Record<string, unknown> {
  return {
    part: section.index + 1,
    role: section.role,
    name: section.name,
    startSec: section.startSec,
    endSec: section.endSec,
    durationSec: Math.round((section.endSec - section.startSec) * 1000) / 1000,
    targetDurationSec: section.targetDurationSec,
    tracks: section.tracks.map((track) => track.title),
    cues: section.cueKeys.length,
  }
}

/** The end of the last clip on any track. */
export function scoreExtentSec(score: Score): number {
  let end = 0
  for (const track of score.tracks) {
    if (track.kind !== 'audio') continue
    for (const clip of track.clips) end = Math.max(end, clip.startSec + clip.durationSec)
  }
  for (const track of score.elementTracks) {
    for (const clip of track.clips) end = Math.max(end, clip.startSec + clip.durationSec)
  }
  return end
}

/** The three script tools over a fresh `ScriptAuthoring`. */
export function scriptTools(options: ScriptAuthoringOptions = {}): ToolSpec[] {
  return new ScriptAuthoring(options).tools()
}

export function createScriptAuthoring(options: ScriptAuthoringOptions = {}): ScriptAuthoring {
  return new ScriptAuthoring(options)
}
