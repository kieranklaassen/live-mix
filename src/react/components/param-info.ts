// What a parameter does, for the info view. A device says it itself in
// `ParamSpec.description`; a parameter that does not (a hosted plug-in's, a
// device not yet written up) is described here when its name means the same
// thing on every device. A name that means different things on different
// devices (Shape, Mode, Tone, Position) has no entry: the device has to say.

import { type ParamSpec } from '../../core/params'

const COMMON: Readonly<Record<string, string>> = {
  mix: 'How much of the effect is heard against the untouched sound: none of it at the bottom, only the effect at the top.',
  'dry/wet':
    'How much of the effect is heard against the untouched sound: none of it at the bottom, only the effect at the top.',
  wet: 'How loud the effect is beside the untouched sound.',
  dry: 'How loud the untouched sound stays beside the effect.',
  attack:
    'How long the sound takes to come up after it starts. Short is immediate; long swells in.',
  release: 'How long the sound takes to die away after it is let go.',
  decay: 'How long the sound takes to fade.',
  sustain: 'The level a held note settles at once its start has passed.',
  feedback:
    'How much of the output is fed back in. More of it means more repeats and a longer, denser tail.',
  'pre-delay':
    'The gap before the effect starts. A longer gap keeps the start of the sound clear of what follows it.',
  predelay:
    'The gap before the effect starts. A longer gap keeps the start of the sound clear of what follows it.',
  'low cut': 'Removes everything below this frequency: rumble and weight the sound does not need.',
  'high cut': 'Removes everything above this frequency: the sound gets darker and softer.',
  'high-pass':
    'Removes everything below this frequency: rumble and weight the sound does not need.',
  'low-pass': 'Removes everything above this frequency: the sound gets darker and softer.',
  cutoff: 'The frequency where the filter starts to work.',
  resonance:
    'A peak at the filter frequency. A little adds colour; a lot makes the filter ring and whistle.',
  volume: 'How loud this is before the mixer.',
  output: 'The level that leaves the device, to make up for what it added or took away.',
  gain: 'How much the level is raised or lowered.',
  drive: 'How hard the sound is pushed into saturation: warmer first, then gritty.',
  width: 'How wide the sound sits between the speakers, from mono to wider than it came in.',
  pan: 'Where the sound sits between the left and the right speaker.',
  detune: 'How far the voices are tuned apart. A little thickens the sound; more makes it shimmer.',
  rate: 'How fast the movement goes round.',
  depth: 'How far the movement swings.',
  damping:
    'How quickly the high frequencies die away in the tail: more of it is darker and softer.',
  threshold: 'The level above which the device starts to work.',
  ratio: 'How strongly the level is held back once it passes the threshold.',
  'make-up': 'Raises the level again after it has been held back.',
  ceiling: 'The level the output is never allowed to pass.',
  glide: 'How long the pitch takes to slide from one note to the next.',
}

/** A sentence on what the parameter does: the device's own, else the common meaning of its name. */
export function paramInfo(spec: ParamSpec): string | undefined {
  const name = spec.name.trim().toLowerCase()
  // Only the names listed: a plug-in may call a parameter what every object has a property by.
  const common = Object.prototype.hasOwnProperty.call(COMMON, name) ? COMMON[name] : undefined
  return spec.description ?? common
}
