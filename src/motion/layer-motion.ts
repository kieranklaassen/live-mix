// A layer's motion: its entrance, its exit and its keyframes, and the one
// function that turns them and a time into every animated value.
//
//   const resolved = resolveLayerMotion(layer.motion, { length, rest, profile })   // once per change
//   const values = motionAt(resolved, time - layer.start)                          // once per frame
//
// Motion is a function of time. `motionAt` reads its arguments and nothing
// else, so the value at a time is the same number whether it is reached by
// playing, by scrubbing or by an export stepping frame by frame.
//
// Three things combine, in this order (docs/motion.md):
// the layer's rest pose; then its keyframes, which replace the rest value of
// the property they are on; then its in or its out, which multiplies scale
// and opacity and adds an offset and a blur on top.

import { curveOf, isEasing, isNumber, isRecord } from './easing'
import {
  KEYFRAME_PROPERTIES,
  keyframeTrack,
  trackValue,
  type Keyframe,
  type KeyframeProperty,
  type KeyframeTrack,
} from './keyframes'
import {
  NO_POSE,
  PRESETS,
  PRESET_NAMES,
  presetDuration,
  presetPose,
  type MotionPreset,
  type MotionSide,
  type PresetName,
  type PresetPose,
} from './presets'
import { NEUTRAL_PROFILE, type MotionProfile } from './profile'
import { MAX_BOUNCE } from './spring'
import { ORIGIN, restValues, type MotionValues, type RestPose } from './values'

/** The motion of a layer as a document stores it. */
export interface LayerMotion {
  /** How the layer arrives. Left out, it fades in. */
  in?: MotionPreset
  /** How the layer leaves. Left out, it fades out. */
  out?: MotionPreset
  keyframes?: Partial<Record<KeyframeProperty, Keyframe[]>>
}

/** How long a side with no preset fades for, in seconds, when the layer does not say. */
export const DEFAULT_FADE = 0.2

export interface MotionContext {
  /** How long the layer is on screen, in seconds. */
  length: number
  /** Where the layer is when nothing animates it. Left out, the picture's top left, upright and opaque. */
  rest?: RestPose
  /** The profile of the style the layer is drawn in. Left out, neutral. */
  profile?: MotionProfile
  /** How many characters the layer's text has, for a typed entrance. */
  characters?: number
  /** How long a side with no preset fades for. Left out, `DEFAULT_FADE` each way. */
  fade?: { in?: number; out?: number }
}

/** The preset one side of a layer plays: its own, or the fade it falls back to. */
function sidePreset(
  motion: LayerMotion | undefined,
  side: MotionSide,
  fade?: MotionContext['fade'],
): MotionPreset {
  return motion?.[side] ?? { preset: 'fade', duration: fade?.[side] ?? DEFAULT_FADE }
}

export interface ResolvedSide {
  preset: PresetName
  /** Seconds it plays for: scaled by the profile, and never more than half the layer. */
  duration: number
  /** What it lays over the layer, by progress from the start of this side to its end. */
  pose: (progress: number) => PresetPose
}

/** A layer's motion made ready to sample. */
export interface ResolvedMotion {
  length: number
  rest: RestPose
  in: ResolvedSide
  out: ResolvedSide
  tracks: readonly { property: KeyframeProperty; track: KeyframeTrack }[]
}

const EASY_EASE = curveOf('easyEase')

/**
 * The fade of a layer that has no preset on a side: Easy Ease, the same in
 * as out.
 */
const plainFade = (side: MotionSide): ResolvedSide['pose'] =>
  side === 'in'
    ? (progress) => ({ ...NO_POSE, opacity: EASY_EASE(progress) })
    : (progress) => ({ ...NO_POSE, opacity: EASY_EASE(1 - progress) })

/**
 * Resolves a layer's motion through a profile. Each of the entrance and the
 * exit is cut to half the layer, so the two never overlap. Do this again
 * when the layer, its length or the profile changes.
 */
export function resolveLayerMotion(
  motion: LayerMotion | undefined,
  context: MotionContext,
): ResolvedMotion {
  const profile = context.profile ?? NEUTRAL_PROFILE
  const side = (which: MotionSide): ResolvedSide => {
    const own = motion?.[which]
    const spec = sidePreset(motion, which, context.fade)
    return {
      preset: spec.preset,
      duration: Math.min(
        presetDuration(spec, which, { profile, characters: context.characters }),
        context.length / 2,
      ),
      pose: own ? presetPose(own, which, profile) : plainFade(which),
    }
  }
  return {
    length: context.length,
    rest: context.rest ?? ORIGIN,
    in: side('in'),
    out: side('out'),
    tracks: KEYFRAME_PROPERTIES.flatMap((property) => {
      const keyframes = motion?.keyframes?.[property]
      return keyframes && keyframes.length > 0
        ? [{ property, track: keyframeTrack(keyframes) }]
        : []
    }),
  }
}

/** Every animated value of a layer, `time` seconds after its start. */
export function motionAt(resolved: ResolvedMotion, time: number): MotionValues {
  const values = restValues(resolved.rest)
  for (const { property, track } of resolved.tracks) {
    // A track is made only from a list with a keyframe in it, so it always has a value.
    const value = trackValue(track, time)
    if (value !== undefined) values[property] = value
  }

  const { in: entrance, out: exit, length } = resolved
  let pose: PresetPose | null = null
  if (entrance.duration > 0 && time < entrance.duration)
    pose = entrance.pose(time / entrance.duration)
  else if (exit.duration > 0 && time > length - exit.duration)
    pose = exit.pose(1 - (length - time) / exit.duration)
  if (pose) {
    values.scale *= pose.scale
    values.opacity *= pose.opacity
    values.blur += pose.blur
    values.reveal = pose.reveal
    values.offsetX = pose.offsetX
    values.offsetY = pose.offsetY
  }

  // A spring between two keyframes may pass its ends.
  values.opacity = Math.min(Math.max(values.opacity, 0), 1)
  values.scale = Math.max(values.scale, 0)
  values.blur = Math.max(values.blur, 0)
  return values
}

/** Every animated value of a layer at a time, straight from what a document stores. To sample many times, resolve once. */
export function layerMotionAt(
  motion: LayerMotion | undefined,
  time: number,
  context: MotionContext,
): MotionValues {
  return motionAt(resolveLayerMotion(motion, context), time)
}

// --- What a stored motion field must be ------------------------------------------------

export interface MotionIssue {
  /** Where in the layer the fault is, as a dotted path from `motion`. */
  path: string
  /** What is wrong, worded to follow the layer's name: "has an exit strength that is not from 0 to 1". */
  message: string
}

const article = (word: string): string => (/^[aeiou]/.test(word) || word === 'x' ? 'an' : 'a')

const SIDE_WORDS: Record<MotionSide, string> = { in: 'entrance', out: 'exit' }

/** The range a keyframe's value must stay in, for the properties that have one. */
const VALUE_FAULTS: Partial<Record<KeyframeProperty, (value: number) => string | null>> = {
  opacity: (value) => (value < 0 || value > 1 ? 'that is not from 0 to 1' : null),
  scale: (value) => (value < 0 ? 'below 0' : null),
  blur: (value) => (value < 0 ? 'below 0' : null),
}

/**
 * Everything wrong with a stored motion field; none when it is one this
 * library reads. `layer.text` says whether the layer has text to type.
 */
export function motionIssues(value: unknown, layer: { text: boolean }): MotionIssue[] {
  if (!isRecord(value)) return [{ path: 'motion', message: 'has motion that is not an object' }]
  const issues: MotionIssue[] = []
  const add = (path: string, message: string): void => {
    issues.push({ path: `motion.${path}`, message })
  }

  for (const [key, part] of Object.entries(value)) {
    if (key === 'in' || key === 'out') {
      const side = SIDE_WORDS[key]
      if (!isRecord(part) || typeof part.preset !== 'string') {
        add(key, `has an ${side} that is not a preset with a name`)
        continue
      }
      for (const field of Object.keys(part)) {
        if (!['preset', 'duration', 'strength', 'bounce'].includes(field))
          add(`${key}.${field}`, `has an ${side} with a part it does not know, ${field}`)
      }
      if (!(PRESET_NAMES as readonly string[]).includes(part.preset)) {
        add(`${key}.preset`, `has an ${side} preset that is not one of ${PRESET_NAMES.join(', ')}`)
      } else if (PRESETS[part.preset as PresetName].needsText && !layer.text) {
        add(
          `${key}.preset`,
          `has a ${part.preset} ${side}, and ${part.preset} needs a layer with text`,
        )
      }
      if (part.duration !== undefined && !(isNumber(part.duration) && part.duration >= 0)) {
        add(`${key}.duration`, `has an ${side} duration that is not 0 seconds or more`)
      }
      if (
        part.strength !== undefined &&
        !(isNumber(part.strength) && part.strength >= 0 && part.strength <= 1)
      ) {
        add(`${key}.strength`, `has an ${side} strength that is not from 0 to 1`)
      }
      if (
        part.bounce !== undefined &&
        !(isNumber(part.bounce) && part.bounce >= 0 && part.bounce <= MAX_BOUNCE)
      ) {
        add(`${key}.bounce`, `has an ${side} bounce that is not from 0 to ${MAX_BOUNCE}`)
      }
    } else if (key === 'keyframes') {
      if (!isRecord(part)) {
        add(key, 'has keyframes that are not lists by property')
        continue
      }
      for (const [property, list] of Object.entries(part)) {
        const path = `keyframes.${property}`
        if (!(KEYFRAME_PROPERTIES as readonly string[]).includes(property)) {
          add(
            path,
            `has keyframes on ${property}, which is not one of ${KEYFRAME_PROPERTIES.join(', ')}`,
          )
          continue
        }
        if (!Array.isArray(list) || list.length === 0) {
          add(path, `has an empty list of ${property} keyframes`)
          continue
        }
        const one = `${article(property)} ${property} keyframe`
        let before = -Infinity
        list.forEach((keyframe: unknown, index) => {
          if (!isRecord(keyframe) || !isNumber(keyframe.time) || !isNumber(keyframe.value)) {
            add(`${path}.${index}`, `has ${one} that is not a time and a value`)
            return
          }
          if (keyframe.time <= before)
            add(
              `${path}.${index}`,
              `has ${property} keyframes that are not in time order, each later than the one before`,
            )
          before = keyframe.time
          const fault = VALUE_FAULTS[property as KeyframeProperty]?.(keyframe.value)
          if (fault) add(`${path}.${index}.value`, `has ${one} ${fault}`)
          if (keyframe.easing !== undefined && !isEasing(keyframe.easing))
            add(`${path}.${index}.easing`, `has ${one} with an easing it cannot read`)
        })
      }
    } else {
      add(key, `has motion with a part it does not know, ${key}`)
    }
  }
  return issues
}
