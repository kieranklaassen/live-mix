// JSON Schemas for every score operation (U28 `OPERATION_TYPES`), the shared
// `$defs` they reference, and the tool name each operation is exposed under.
// Tool names follow the OpenAI/Anthropic rule `^[a-zA-Z0-9_-]{1,64}$`:
// `clip.replaceFrom` becomes `clip_replace_from`. The schemas mirror the
// score's validator (`schema.ts`): a document that passes these is not yet
// guaranteed to fit the score — `apply` still checks references — but the
// model gets ranges, enums and required fields up front.

import { FOLLOW_ACTION_KINDS } from '../core/session/followActions'
import { LAUNCH_MODES } from '../core/session/Slot'
import { OPERATION_TYPES, type OperationType } from '../score/operations'
import { STRIP_PARAMS } from '../score/schema'
import { withDefs, type JsonSchema } from './jsonSchema'

// --- Tool names --------------------------------------------------------------------------

/** `clip.replaceFrom` → `clip_replace_from`. */
export function toolNameForOperation(type: OperationType): string {
  return type.replace(/\./g, '_').replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

const operationByToolName = new Map<string, OperationType>(
  OPERATION_TYPES.map((type) => [toolNameForOperation(type), type]),
)

/** The operation a tool name stands for, or undefined for intents and queries. */
export function operationForToolName(name: string): OperationType | undefined {
  return operationByToolName.get(name)
}

// --- Shared definitions --------------------------------------------------------------------

const id = (description: string): JsonSchema => ({ type: 'string', minLength: 1, description })
const number = (description: string, range: { min?: number; max?: number } = {}): JsonSchema => ({
  type: 'number',
  description,
  ...(range.min !== undefined ? { minimum: range.min } : {}),
  ...(range.max !== undefined ? { maximum: range.max } : {}),
})
const integer = (description: string, min = 0): JsonSchema => ({
  type: 'integer',
  minimum: min,
  description,
})
const ref = (name: string): JsonSchema => ({ $ref: `#/$defs/${name}` })
const nullableNumber = (description: string, min?: number): JsonSchema => ({
  type: ['number', 'null'],
  description,
  ...(min !== undefined ? { minimum: min } : {}),
})

const paramMap: JsonSchema = {
  type: 'object',
  description: 'Parameter values by name.',
  additionalProperties: { type: 'number' },
}

/** `$defs` shared by the operation schemas; each tool schema carries only what it references. */
export const OPERATION_DEFS: Record<string, JsonSchema> = {
  Destination: {
    type: 'object',
    description: "Where a strip's output goes: the master or a group by id.",
    anyOf: [
      {
        type: 'object',
        properties: { kind: { const: 'master' } },
        required: ['kind'],
        additionalProperties: false,
      },
      {
        type: 'object',
        properties: { kind: { const: 'group' }, id: id('Group id.') },
        required: ['kind', 'id'],
        additionalProperties: false,
      },
    ],
  },
  Device: {
    type: 'object',
    description: 'A device instance: registry id plus its state.',
    properties: {
      id: id('Instance id, unique across the score.'),
      deviceId: id("Registry id, e.g. 'filter'."),
      preset: { type: 'string', description: 'Factory preset name; params overlay it.' },
      params: paramMap,
      bypass: { type: 'boolean' },
    },
    required: ['id', 'deviceId', 'params', 'bypass'],
    additionalProperties: false,
  },
  Send: {
    type: 'object',
    properties: {
      target: id('Return id.'),
      level: nullableNumber('Send level ≥ 0; null is a direct connection.', 0),
    },
    required: ['target', 'level'],
    additionalProperties: false,
  },
  Strip: {
    type: 'object',
    description: 'Fader, pan, trim, mute/solo, inserts and post-fader sends.',
    properties: {
      level: number('Fader gain, 1 is unity.', { min: 0 }),
      pan: number('−1 left … 1 right.', { min: -1, max: 1 }),
      inputGain: number('Input trim, 1 is unity.', { min: 0 }),
      mute: { type: 'boolean' },
      solo: { type: 'boolean' },
      soloSafe: { type: 'boolean' },
      inserts: { type: 'array', items: ref('Device') },
      sends: { type: 'array', items: ref('Send') },
    },
    required: ['level', 'pan', 'inputGain', 'mute', 'solo', 'soloSafe', 'inserts', 'sends'],
    additionalProperties: false,
  },
  Clip: {
    type: 'object',
    description: 'A slice of a source on the timeline (seconds).',
    properties: {
      id: id('Clip id, unique per track.'),
      sourceId: id('Source id the clip plays.'),
      startSec: number('Timeline position.', { min: 0 }),
      offsetSec: number('Seconds into the source where playback enters.', { min: 0 }),
      durationSec: number('Audible length.', { min: 0 }),
      fadeInSec: number('Fade-in length.', { min: 0 }),
      fadeOutSec: number('Fade-out length.', { min: 0 }),
      fadeCurve: { type: 'string', enum: ['linear', 'equalPower'] },
      gainDb: number('Loudness trim in dB (the track caps it at ±12).'),
      loop: { type: 'boolean', description: 'Loop the source when the clip outlives it.' },
      semitones: number('Pitch shift on a stretch source.'),
    },
    required: [
      'id',
      'sourceId',
      'startSec',
      'offsetSec',
      'durationSec',
      'fadeInSec',
      'fadeOutSec',
      'fadeCurve',
      'gainDb',
    ],
    additionalProperties: false,
  },
  ClipPatch: {
    type: 'object',
    description: 'Clip fields to change (id cannot change).',
    properties: {
      sourceId: id('Source id.'),
      startSec: number('Timeline position.', { min: 0 }),
      offsetSec: number('Source offset.', { min: 0 }),
      durationSec: number('Audible length.', { min: 0 }),
      fadeInSec: number('Fade-in length.', { min: 0 }),
      fadeOutSec: number('Fade-out length.', { min: 0 }),
      fadeCurve: { type: 'string', enum: ['linear', 'equalPower'] },
      gainDb: number('Loudness trim in dB.'),
      loop: { type: 'boolean' },
      semitones: number('Pitch shift on a stretch source.'),
    },
    additionalProperties: false,
  },
  Source: {
    type: 'object',
    description: 'A decoded sample clips reference.',
    properties: {
      id: id('Source id.'),
      url: { type: 'string', description: 'Where the renderer loads it from.' },
      durationSec: number('Source length.', { min: 0 }),
      analysis: {
        type: 'object',
        description: 'Server analysis (LUFS, key, BPM, …).',
        additionalProperties: true,
      },
    },
    required: ['id'],
    additionalProperties: false,
  },
  Track: {
    type: 'object',
    description:
      "An audio, live-input or instrument track; live tracks' audio is attached by the app.",
    properties: {
      kind: { type: 'string', enum: ['audio', 'live', 'instrument'] },
      id: id('Track id (also the engine name).'),
      name: { type: 'string' },
      destination: ref('Destination'),
      strip: ref('Strip'),
      lookaheadSec: number('Audio tracks: scheduler lookahead.', { min: 0 }),
      preloadSec: number('Audio tracks: preload lead.', { min: 0 }),
      clips: { type: 'array', items: ref('Clip'), description: 'Audio tracks only.' },
      device: ref('Device'),
    },
    required: ['kind', 'id', 'name', 'destination', 'strip'],
    additionalProperties: false,
  },
  Group: {
    type: 'object',
    description: 'A summing strip; groups feed the master or another group (never a cycle).',
    properties: {
      id: id('Group id.'),
      name: { type: 'string' },
      destination: ref('Destination'),
      strip: ref('Strip'),
    },
    required: ['id', 'name', 'destination', 'strip'],
    additionalProperties: false,
  },
  Return: {
    type: 'object',
    description: 'A return track: one device fed by sends, with its own strip.',
    properties: {
      id: id('Return id.'),
      name: { type: 'string' },
      destination: ref('Destination'),
      strip: ref('Strip'),
      device: ref('Device'),
    },
    required: ['id', 'name', 'destination', 'strip', 'device'],
    additionalProperties: false,
  },
  ParamTarget: {
    type: 'object',
    description: 'What a lane or route drives: a strip parameter or a device parameter.',
    anyOf: [
      {
        type: 'object',
        properties: {
          kind: { const: 'strip' },
          owner: id("Track, group or return id, or 'master' (level only)."),
          param: { type: 'string', enum: [...STRIP_PARAMS] },
        },
        required: ['kind', 'owner', 'param'],
        additionalProperties: false,
      },
      {
        type: 'object',
        properties: {
          kind: { const: 'device' },
          device: id('Device instance id.'),
          param: id('Parameter name.'),
        },
        required: ['kind', 'device', 'param'],
        additionalProperties: false,
      },
    ],
  },
  Breakpoint: {
    type: 'object',
    properties: {
      timeSec: number('Timeline position.'),
      value: number('Parameter value.'),
      curve: {
        type: 'string',
        enum: ['step', 'linear', 'exponential', 'smooth'],
        description: 'Segment shape towards the next breakpoint; linear when omitted.',
      },
    },
    required: ['timeSec', 'value'],
    additionalProperties: false,
  },
  Lane: {
    type: 'object',
    description: 'An automation lane: one per parameter target.',
    properties: {
      id: id('Lane id.'),
      target: ref('ParamTarget'),
      defaultValue: number('Value while the lane has no breakpoints.'),
      breakpoints: { type: 'array', items: ref('Breakpoint') },
    },
    required: ['id', 'target', 'breakpoints'],
    additionalProperties: false,
  },
  Modulator: {
    type: 'object',
    description: 'A modulation source.',
    anyOf: [
      {
        type: 'object',
        properties: {
          id: id('Modulator id.'),
          kind: { const: 'lfo' },
          rateHz: number('Cycles per second.', { min: 0 }),
          shape: { type: 'string', enum: ['sine', 'triangle', 'saw', 'square'] },
          depth: number('0..1', { min: 0, max: 1 }),
          phase: number('Start phase in cycles.'),
        },
        required: ['id', 'kind', 'rateHz', 'shape', 'depth', 'phase'],
        additionalProperties: false,
      },
      {
        type: 'object',
        properties: {
          id: id('Modulator id.'),
          kind: { const: 'random' },
          rateHz: number('Steps per second.', { min: 0 }),
          seed: number('PRNG seed.'),
          smooth: { type: 'boolean' },
        },
        required: ['id', 'kind', 'rateHz', 'seed', 'smooth'],
        additionalProperties: false,
      },
      {
        type: 'object',
        properties: {
          id: id('Modulator id.'),
          kind: { const: 'macro' },
          value: number('0..1', { min: 0, max: 1 }),
        },
        required: ['id', 'kind', 'value'],
        additionalProperties: false,
      },
      {
        type: 'object',
        properties: {
          id: id('Modulator id.'),
          kind: { const: 'external-phase' },
          phaseOffset: number('Offset in cycles.'),
          depth: number('0..1', { min: 0, max: 1 }),
          shape: { type: 'string', enum: ['sine', 'triangle', 'saw', 'square'] },
        },
        required: ['id', 'kind', 'phaseOffset', 'depth', 'shape'],
        additionalProperties: false,
      },
    ],
  },
  ModulatorPatch: {
    type: 'object',
    description: "Fields to change; only those of the modulator's kind are accepted.",
    properties: {
      rateHz: number('Rate.', { min: 0 }),
      shape: { type: 'string', enum: ['sine', 'triangle', 'saw', 'square'] },
      depth: number('0..1', { min: 0, max: 1 }),
      phase: number('Phase in cycles.'),
      seed: number('PRNG seed.'),
      smooth: { type: 'boolean' },
      value: number('0..1', { min: 0, max: 1 }),
      phaseOffset: number('Offset in cycles.'),
    },
    additionalProperties: false,
  },
  Route: {
    type: 'object',
    description: 'A modulation route from a modulator to a parameter.',
    properties: {
      id: id('Route id.'),
      source: id('Modulator id.'),
      target: ref('ParamTarget'),
      depth: number('−1..1 fraction of the target range.', { min: -1, max: 1 }),
      polarity: { type: 'string', enum: ['unipolar', 'bipolar'] },
    },
    required: ['id', 'source', 'target', 'depth', 'polarity'],
    additionalProperties: false,
  },
  TempoSegment: {
    type: 'object',
    description: 'A tempo segment; the first starts at 0 and segments ascend.',
    properties: {
      atSec: number('Timeline second the segment starts at.', { min: 0 }),
      bpm: number('Beats per minute.', { min: 0 }),
      beatsPerBar: integer('Beats per bar from this point on; default 4.', 1),
    },
    required: ['atSec', 'bpm'],
    additionalProperties: false,
  },
  ElementTrack: {
    type: 'object',
    description: 'A streaming (media element) track; its clips need sources with a url.',
    properties: {
      id: id('Element track id.'),
      name: { type: 'string' },
      destination: ref('Destination'),
      lookaheadSec: number('Scheduler lookahead.', { min: 0 }),
      preloadSec: number('Preload lead.', { min: 0 }),
      clips: { type: 'array', items: ref('Clip') },
    },
    required: ['id', 'name', 'destination', 'clips'],
    additionalProperties: false,
  },
  LaunchQuantize: {
    description:
      "Launch grid: 'none' (immediately), 'bar', 'beat', a positive bar count, or { seconds } on the clock.",
    anyOf: [
      { type: 'string', enum: ['none', 'bar', 'beat'] },
      { type: 'number', exclusiveMinimum: 0, description: 'Bars.' },
      {
        type: 'object',
        properties: { seconds: number('Period in seconds.', { min: 0 }) },
        required: ['seconds'],
        additionalProperties: false,
      },
    ],
  },
  SlotClip: {
    type: 'object',
    description: 'The clip a slot launches: a Clip without id and startSec.',
    properties: {
      sourceId: id('Source id the clip plays.'),
      offsetSec: number('Seconds into the source where playback enters.', { min: 0 }),
      durationSec: number('Audible length (one pass when looping).', { min: 0 }),
      fadeInSec: number('Fade-in length.', { min: 0 }),
      fadeOutSec: number('Fade-out length.', { min: 0 }),
      fadeCurve: { type: 'string', enum: ['linear', 'equalPower'] },
      gainDb: number('Loudness trim in dB.'),
      loop: { type: 'boolean', description: 'Loop until stopped.' },
      semitones: number('Pitch shift on a stretch source.'),
    },
    required: [
      'sourceId',
      'offsetSec',
      'durationSec',
      'fadeInSec',
      'fadeOutSec',
      'fadeCurve',
      'gainDb',
    ],
    additionalProperties: false,
  },
  FollowAction: {
    type: 'object',
    description:
      'What a slot does after its follow time: A with probability `chance`, else B. Kinds walk the column of slots on the track.',
    properties: {
      a: { type: 'string', enum: [...FOLLOW_ACTION_KINDS] },
      b: { type: 'string', enum: [...FOLLOW_ACTION_KINDS] },
      chance: number('Probability of A.', { min: 0, max: 1 }),
      time: {
        type: 'object',
        description: 'Measured from the launch; omitted means the clip duration.',
        properties: {
          unit: { type: 'string', enum: ['bars', 'seconds'] },
          value: number('Amount.', { min: 0 }),
        },
        required: ['unit', 'value'],
        additionalProperties: false,
      },
    },
    required: ['a', 'b', 'chance'],
    additionalProperties: false,
  },
  Scene: {
    type: 'object',
    description: 'A session grid row.',
    properties: { id: id('Scene id.'), name: { type: 'string' } },
    required: ['id', 'name'],
    additionalProperties: false,
  },
  Slot: {
    type: 'object',
    description:
      'A session grid cell (audio track × scene): the clip it launches (null = a stop button) and its launch settings.',
    properties: {
      id: id('Slot id.'),
      track: id('Audio track id.'),
      scene: id('Scene id.'),
      clip: { anyOf: [ref('SlotClip'), { type: 'null' }] },
      quantize: ref('LaunchQuantize'),
      launchMode: { type: 'string', enum: [...LAUNCH_MODES] },
      legato: { type: 'boolean', description: 'Enter the new clip where the old one was.' },
      follow: ref('FollowAction'),
    },
    required: ['id', 'track', 'scene', 'clip', 'launchMode', 'legato'],
    additionalProperties: false,
  },
  Operation: {
    type: 'object',
    description: 'Any score operation, as the matching tool would take it plus its `type`.',
    properties: { type: { type: 'string', enum: [...OPERATION_TYPES] } },
    required: ['type'],
    additionalProperties: true,
  },
}

// --- Per-operation schemas ---------------------------------------------------------------------

interface OperationSpec {
  description: string
  properties: Record<string, JsonSchema>
  required: readonly string[]
}

const owner = id("Track, group or return id; 'master' where the master is allowed.")
const index = integer('Position in the list; appended when omitted.')

const OPERATION_SPECS: Record<OperationType, OperationSpec> = {
  'score.rename': {
    description: 'Rename the score.',
    properties: { name: { type: 'string' } },
    required: ['name'],
  },
  'transport.loop': {
    description: 'Enable/disable the transport loop and/or set its length (null = no end).',
    properties: {
      enabled: { type: 'boolean' },
      lengthSec: nullableNumber('Loop length in seconds, or null for no end.'),
    },
    required: [],
  },
  'tempo.set': {
    description: 'Replace the tempo map (segments ascending from 0).',
    properties: { segments: { type: 'array', items: ref('TempoSegment'), minItems: 1 } },
    required: ['segments'],
  },
  'elementTrack.add': {
    description: 'Add a streaming (media element) track.',
    properties: { track: ref('ElementTrack'), index },
    required: ['track'],
  },
  'elementTrack.remove': {
    description: 'Remove a streaming track.',
    properties: { id: id('Element track id.') },
    required: ['id'],
  },
  'elementTrack.route': {
    description: 'Re-route a streaming track to the master or a group.',
    properties: { id: id('Element track id.'), destination: ref('Destination') },
    required: ['id', 'destination'],
  },
  'elementTrack.setClips': {
    description: "Replace a streaming track's clips.",
    properties: { id: id('Element track id.'), clips: { type: 'array', items: ref('Clip') } },
    required: ['id', 'clips'],
  },
  'source.add': {
    description: 'Register a source (a decoded sample) clips can reference.',
    properties: { source: ref('Source'), index },
    required: ['source'],
  },
  'source.remove': {
    description: 'Remove a source; refused while a clip uses it.',
    properties: { id: id('Source id.') },
    required: ['id'],
  },
  'track.add': {
    description: 'Add an audio, live-input or instrument track.',
    properties: { track: ref('Track'), index },
    required: ['track'],
  },
  'track.remove': {
    description: 'Remove a track with its lanes and routes.',
    properties: { id: id('Track id.') },
    required: ['id'],
  },
  'track.move': {
    description: 'Move a track to another position.',
    properties: { id: id('Track id.'), index: integer('New position.') },
    required: ['id', 'index'],
  },
  'group.add': {
    description: 'Add a summing group.',
    properties: { group: ref('Group'), index },
    required: ['group'],
  },
  'group.remove': {
    description: 'Remove a group; its members re-route to where it fed.',
    properties: { id: id('Group id.') },
    required: ['id'],
  },
  'group.move': {
    description: 'Move a group to another position.',
    properties: { id: id('Group id.'), index: integer('New position.') },
    required: ['id', 'index'],
  },
  'return.add': {
    description: 'Add a return track (one device fed by sends).',
    properties: { return: ref('Return'), index },
    required: ['return'],
  },
  'return.remove': {
    description: 'Remove a return; sends to it are dropped.',
    properties: { id: id('Return id.') },
    required: ['id'],
  },
  'return.move': {
    description: 'Move a return to another position.',
    properties: { id: id('Return id.'), index: integer('New position.') },
    required: ['id', 'index'],
  },
  'strip.rename': {
    description: 'Rename a track, group or return.',
    properties: { id: owner, name: { type: 'string' } },
    required: ['id', 'name'],
  },
  'strip.route': {
    description: 'Re-route a track, group or return to the master or a group.',
    properties: { id: owner, destination: ref('Destination') },
    required: ['id', 'destination'],
  },
  'strip.set': {
    description:
      "Set a strip's fader level (0..1 for the agent, 1 is unity), pan (−1..1) or input gain; 'master' level is allowed.",
    properties: {
      owner,
      param: { type: 'string', enum: [...STRIP_PARAMS] },
      value: number('New value.'),
    },
    required: ['owner', 'param', 'value'],
  },
  'strip.mute': {
    description: 'Mute or unmute a track, group or return.',
    properties: { owner, mute: { type: 'boolean' } },
    required: ['owner', 'mute'],
  },
  'strip.solo': {
    description: 'Solo or unsolo a track, group or return.',
    properties: { owner, solo: { type: 'boolean' } },
    required: ['owner', 'solo'],
  },
  'strip.soloSafe': {
    description: 'Exempt a strip from being implicitly muted by other solos.',
    properties: { owner, soloSafe: { type: 'boolean' } },
    required: ['owner', 'soloSafe'],
  },
  'clip.add': {
    description: 'Place a clip on an audio track.',
    properties: { track: id('Audio track id.'), clip: ref('Clip') },
    required: ['track', 'clip'],
  },
  'clip.remove': {
    description: 'Remove a clip.',
    properties: { track: id('Audio track id.'), id: id('Clip id.') },
    required: ['track', 'id'],
  },
  'clip.move': {
    description: 'Move a clip to a new start time.',
    properties: {
      track: id('Audio track id.'),
      id: id('Clip id.'),
      startSec: number('New start.', { min: 0 }),
    },
    required: ['track', 'id', 'startSec'],
  },
  'clip.trim': {
    description: "Change a clip's start, source offset and/or duration.",
    properties: {
      track: id('Audio track id.'),
      id: id('Clip id.'),
      startSec: number('New start.', { min: 0 }),
      offsetSec: number('New source offset.', { min: 0 }),
      durationSec: number('New length.', { min: 0 }),
    },
    required: ['track', 'id'],
  },
  'clip.update': {
    description: 'Patch clip fields (fades, gain, loop, source…).',
    properties: { track: id('Audio track id.'), id: id('Clip id.'), patch: ref('ClipPatch') },
    required: ['track', 'id', 'patch'],
  },
  'clip.replaceFrom': {
    description:
      'Drop every clip starting at or after fromSec and add the given clips (all starting there or later) — a re-plan of the remainder.',
    properties: {
      track: id('Audio track id.'),
      fromSec: number('Replace from this timeline second.', { min: 0 }),
      clips: { type: 'array', items: ref('Clip') },
    },
    required: ['track', 'fromSec', 'clips'],
  },
  'device.add': {
    description: "Insert a device into a strip's chain ('master' for the master chain).",
    properties: { owner, device: ref('Device'), index },
    required: ['owner', 'device'],
  },
  'device.remove': {
    description: 'Remove an insert device with its lanes and routes.',
    properties: { id: id('Device instance id.') },
    required: ['id'],
  },
  'device.move': {
    description: 'Move an insert within its chain.',
    properties: { id: id('Device instance id.'), index: integer('New position.') },
    required: ['id', 'index'],
  },
  'device.setParam': {
    description: 'Set one device parameter (clamped to the descriptor range).',
    properties: {
      device: id('Device instance id.'),
      param: id('Parameter name.'),
      value: number('New value.'),
    },
    required: ['device', 'param', 'value'],
  },
  'device.setParams': {
    description: 'Set several device parameters; null clears one back to the preset/default.',
    properties: {
      device: id('Device instance id.'),
      params: {
        type: 'object',
        additionalProperties: { type: ['number', 'null'] },
        description: 'Name → value (null clears).',
      },
    },
    required: ['device', 'params'],
  },
  'device.preset': {
    description: 'Load a factory preset (null for none); params replaces the explicit overlay.',
    properties: {
      device: id('Device instance id.'),
      preset: { type: ['string', 'null'], description: 'Preset name or null.' },
      params: paramMap,
    },
    required: ['device', 'preset'],
  },
  'device.bypass': {
    description: 'Bypass or engage a device.',
    properties: { device: id('Device instance id.'), bypass: { type: 'boolean' } },
    required: ['device', 'bypass'],
  },
  'send.add': {
    description: 'Add a post-fader send from a strip to a return.',
    properties: {
      owner,
      target: id('Return id.'),
      level: nullableNumber('Send level ≥ 0; null is a direct connection.', 0),
      index,
    },
    required: ['owner', 'target', 'level'],
  },
  'send.remove': {
    description: 'Remove a send.',
    properties: { owner, target: id('Return id.') },
    required: ['owner', 'target'],
  },
  'send.set': {
    description: "Set a send's level (null for direct).",
    properties: {
      owner,
      target: id('Return id.'),
      level: nullableNumber('Send level ≥ 0; null is a direct connection.', 0),
    },
    required: ['owner', 'target', 'level'],
  },
  'lane.add': {
    description: 'Add an automation lane (one per parameter target).',
    properties: { lane: ref('Lane'), index },
    required: ['lane'],
  },
  'lane.remove': {
    description: 'Remove an automation lane.',
    properties: { id: id('Lane id.') },
    required: ['id'],
  },
  'lane.setBreakpoints': {
    description: "Replace a lane's breakpoints.",
    properties: { id: id('Lane id.'), breakpoints: { type: 'array', items: ref('Breakpoint') } },
    required: ['id', 'breakpoints'],
  },
  'lane.addBreakpoint': {
    description: 'Add one breakpoint to a lane.',
    properties: { id: id('Lane id.'), breakpoint: ref('Breakpoint') },
    required: ['id', 'breakpoint'],
  },
  'lane.removeBreakpoint': {
    description: 'Remove the breakpoint at a time.',
    properties: { id: id('Lane id.'), timeSec: number('Breakpoint time.') },
    required: ['id', 'timeSec'],
  },
  'modulator.add': {
    description: 'Add a modulator (lfo, random, macro or external-phase).',
    properties: { modulator: ref('Modulator'), index },
    required: ['modulator'],
  },
  'modulator.remove': {
    description: 'Remove a modulator with its routes.',
    properties: { id: id('Modulator id.') },
    required: ['id'],
  },
  'modulator.update': {
    description: "Patch a modulator's fields.",
    properties: { id: id('Modulator id.'), patch: ref('ModulatorPatch') },
    required: ['id', 'patch'],
  },
  'route.add': {
    description: 'Route a modulator to a parameter.',
    properties: { route: ref('Route'), index },
    required: ['route'],
  },
  'route.remove': {
    description: 'Remove a modulation route.',
    properties: { id: id('Route id.') },
    required: ['id'],
  },
  'route.update': {
    description: "Change a route's depth and/or polarity.",
    properties: {
      id: id('Route id.'),
      depth: number('−1..1', { min: -1, max: 1 }),
      polarity: { type: 'string', enum: ['unipolar', 'bipolar'] },
    },
    required: ['id'],
  },
  'transport.quantize': {
    description: 'Set the global launch quantisation of the session grid.',
    properties: { quantize: ref('LaunchQuantize') },
    required: ['quantize'],
  },
  'scene.add': {
    description: 'Add a session grid row.',
    properties: { scene: ref('Scene'), index },
    required: ['scene'],
  },
  'scene.remove': {
    description: 'Remove a scene and every slot in it.',
    properties: { id: id('Scene id.') },
    required: ['id'],
  },
  'scene.move': {
    description: 'Move a scene to another row index.',
    properties: { id: id('Scene id.'), index: integer('New row index.') },
    required: ['id', 'index'],
  },
  'scene.rename': {
    description: 'Rename a scene.',
    properties: { id: id('Scene id.'), name: { type: 'string' } },
    required: ['id', 'name'],
  },
  'slot.add': {
    description: 'Put a slot in a free cell (audio track × scene).',
    properties: { slot: ref('Slot'), index },
    required: ['slot'],
  },
  'slot.remove': {
    description: 'Remove a slot from the grid.',
    properties: { id: id('Slot id.') },
    required: ['id'],
  },
  'slot.update': {
    description:
      "Patch a slot's cell, clip or launch settings; `quantize: null` and `follow: null` clear them, `clip: null` empties the slot.",
    properties: {
      id: id('Slot id.'),
      patch: {
        type: 'object',
        properties: {
          track: id('Audio track id.'),
          scene: id('Scene id.'),
          clip: { anyOf: [ref('SlotClip'), { type: 'null' }] },
          quantize: { anyOf: [ref('LaunchQuantize'), { type: 'null' }] },
          launchMode: { type: 'string', enum: [...LAUNCH_MODES] },
          legato: { type: 'boolean' },
          follow: { anyOf: [ref('FollowAction'), { type: 'null' }] },
        },
        additionalProperties: false,
      },
    },
    required: ['id', 'patch'],
  },
  batch: {
    description: 'Apply several operations as one undoable step.',
    properties: {
      ops: { type: 'array', items: ref('Operation'), minItems: 1 },
      label: { type: 'string' },
    },
    required: ['ops'],
  },
}

/** The parameters schema of one operation's tool: self-contained, with only the `$defs` it uses. */
export function operationSchema(type: OperationType): JsonSchema {
  const spec = OPERATION_SPECS[type]
  return withDefs(
    {
      type: 'object',
      description: spec.description,
      properties: spec.properties,
      required: spec.required,
      additionalProperties: false,
    },
    OPERATION_DEFS,
  )
}

export function operationDescription(type: OperationType): string {
  return OPERATION_SPECS[type].description
}
