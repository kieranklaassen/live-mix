// Space: reverbs.

import { type FactoryChain } from '../types'

export const SPACE_CHAINS: readonly FactoryChain[] = [
  {
    id: 'long-plate',
    name: 'Long plate',
    category: 'space',
    description: 'A bright steel plate with a long even tail, the plain reverb for anything.',
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate' }],
  },
  {
    id: 'breathing-hall',
    name: 'Breathing hall',
    category: 'space',
    description: 'A large hall whose tail rises and falls every five seconds, like slow breath.',
    effects: [{ deviceId: 'fdn-reverb', preset: 'Breathing' }],
  },
  {
    id: 'infinite-space',
    name: 'Infinite space',
    category: 'space',
    description: 'A modulated space with a one minute tail that swells in behind each note.',
    effects: [{ deviceId: 'expanse', preset: 'Event horizon', params: { width: 0.8 } }],
  },
  {
    id: 'frozen-room',
    name: 'Frozen room',
    category: 'space',
    description:
      'A big undamped room with a long wide tail; its freeze switch holds whatever is ringing in it.',
    effects: [
      {
        deviceId: 'ether-reverb',
        preset: 'Cathedral',
        params: { decay: 30, damping: 0.1, size: 1, mix: 0.25 },
      },
    ],
  },
  {
    id: 'spring-tank',
    name: 'Spring tank',
    category: 'space',
    description: 'Three long springs with the chirp and drip of the tank in an old amplifier.',
    effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.4 } }],
  },

  {
    id: 'backwards-cloud',
    name: 'Backwards cloud',
    category: 'space',
    description:
      'Each note is answered by a cloud that grows backwards behind it and cuts off, inside a quiet plate.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Reverse' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'singing-hall',
    name: 'Singing hall',
    category: 'space',
    description: 'A hall whose tail holds a soft sung ah behind every note.',
    effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.35 } }],
  },
  {
    id: 'wandering-choir',
    name: 'Wandering choir',
    category: 'space',
    description: 'A choir whose vowel drifts on its own, left to dissolve in a plate.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Vowel drift', params: { mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'amp-down-the-hall',
    name: 'Amp down the hall',
    category: 'space',
    description:
      'A guitar amplifier heard from the far end of a hall, with a plate carrying the tail on.',
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall', params: { output: -1.5 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'swarm-cavern',
    name: 'Swarm cavern',
    category: 'space',
    description: 'A rush of separate echoes after each note that piles up into a dark cave.',
    effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern' }],
  },

  {
    id: 'close-chamber',
    name: 'Close chamber',
    category: 'space',
    description: 'A few cents of width on the source, then a short bright chamber close around it.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Faint width' },
      {
        deviceId: 'hall-reverb',
        preset: 'Tight chamber',
        params: { midDecay: 1.3, mix: 0.3 },
      },
    ],
  },
  {
    id: 'long-low-hall',
    name: 'Long low hall',
    category: 'space',
    description:
      'A transformer thickens the lows, then a hall holds them twice as long as the rest.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth', params: { output: -3 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { crossover: 350, lowDecay: 5, damping: 4500 },
      },
    ],
  },
  {
    id: 'slap-into-plate',
    name: 'Slap into plate',
    category: 'space',
    description:
      'One saturated tape slap stands between the note and the dark plate that answers it.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 110, mix: 0.3 } },
      {
        deviceId: 'plate-reverb',
        preset: 'Dark plate',
        params: { predelayMs: 150, decay: 0.85, mix: 0.24 },
      },
    ],
  },
  {
    id: 'chapel-into-nave',
    name: 'Chapel into nave',
    category: 'space',
    description:
      'Close early reflections from a small room, then the slow six second tail of a nave.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'bright-upper-air',
    name: 'Bright upper air',
    category: 'space',
    description:
      'Only the top of the sound is spread wide and hung in a thin tail with no bass in it.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Top only', params: { focus: 600 } },
      { deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'driven-gated-room',
    name: 'Driven gated room',
    category: 'space',
    description:
      'A pushed console stage into a dense room that holds for half a second and stops dead.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Console', params: { drive: 0.55 } },
      { deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.5, mix: 0.45 } },
    ],
  },
  {
    id: 'trembling-hall',
    name: 'Trembling hall',
    category: 'space',
    description:
      'A long hall played through a valve amp and its tremolo, so the tail itself pulses across the sides.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { decay: 9, mix: 0.2 } },
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.2, output: 1.5 } },
      { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 3.2, depth: 0.6, phase: 40 } },
    ],
  },
  {
    id: 'slow-phased-hall',
    name: 'Slow phased hall',
    category: 'space',
    description:
      'A long bright hall with a phaser after it, drawing notches through the tail every sixteen seconds.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
      {
        deviceId: 'phaser',
        preset: 'Slow swirl',
        params: { centerHz: 600, feedback: 45, stereo: 60 },
      },
    ],
  },
  {
    id: 'opening-haze',
    name: 'Opening haze',
    category: 'space',
    description:
      'A far plate, mostly reverb, behind a low pass that opens and closes every twelve seconds.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.6 } },
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { cutoffHz: 1000, lfoRateHz: 0.08 },
      },
    ],
  },
  {
    id: 'dripping-dark-hall',
    name: 'Dripping dark hall',
    category: 'space',
    description: 'Two springs splash on every attack and their drips fall away into a dark hall.',
    effects: [
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { drive: 0.3, mix: 0.2 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'ringing-strings-room',
    name: 'Ringing strings room',
    category: 'space',
    description:
      'Twelve strings tuned to the white keys ring on as under a held pedal, in a small room.',
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Piano pedal',
        params: { strings: 8, decay: 5, mix: 0.35, width: 0.8 },
      },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'sinking-cathedral',
    name: 'Sinking cathedral',
    category: 'space',
    description:
      'A tail that drops an octave on each pass, sinking into a vast space with no treble.',
    effects: [
      { deviceId: 'shimmer', preset: 'Undertow', params: { decay: 10, mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 12, mix: 0.3 } },
    ],
  },
  {
    id: 'far-wall-slap',
    name: 'Far wall slap',
    category: 'space',
    description: 'One hard mono slap comes back off a far wall, and a small room softens both.',
    effects: [
      {
        deviceId: 'shaped-reverb',
        preset: 'Mono slap',
        params: { preDelay: 190, time: 0.1, mix: 0.4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'concrete-culvert',
    name: 'Concrete culvert',
    category: 'space',
    description:
      'A short pipe that rings like metal on every attack, opening into a dark mono tunnel.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Metal pipe', params: { feedback: 0.7 } },
      { deviceId: 'expanse', preset: 'Narrow tunnel' },
    ],
  },
  {
    id: 'empty-stairwell',
    name: 'Empty stairwell',
    category: 'space',
    description: 'Hard separate echoes off close walls, ringing on in a small bright space.',
    effects: [
      { deviceId: 'expanse', preset: 'Hard echoes' },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { decay: 3.5, mix: 0.25 } },
    ],
  },
  {
    id: 'drifting-in-a-plate',
    name: 'Drifting in a plate',
    category: 'space',
    description:
      'The sound drifts slowly from side to side while the plate behind it stays where it is.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.6 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { decay: 0.85, mix: 0.3 } },
    ],
  },
  {
    id: 'dissolve-and-hold',
    name: 'Dissolve and hold',
    category: 'space',
    description:
      'A diffuse wash spreads under each note, and a dark plate holds it for a minute after you stop.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Diffuse room' },
      {
        deviceId: 'plate-reverb',
        preset: 'Endless wash',
        params: { decay: 0.985, damping: 0.7, mix: 0.17 },
      },
    ],
  },
  {
    id: 'squashed-room',
    name: 'Squashed room',
    category: 'space',
    description:
      'A small room crushed by a fast limiter, so each note and the room behind it sit at one level.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 1.6, mix: 0.45 } },
      { deviceId: 'fet-limiter', preset: 'Squash' },
    ],
  },
  {
    id: 'across-the-valley',
    name: 'Across the valley',
    category: 'space',
    description:
      'One clear echo returns from the far side after most of a second, into a long open tail.',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Clean echo',
        params: { time: 700, feedback: 0.15, tone: 4000, mix: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'behind-the-door',
    name: 'Behind the door',
    category: 'space',
    description:
      'A hall heard through its closed door: nearly all reverb, far off, with the highs taken away.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.7 } },
      {
        deviceId: 'ambient-eq',
        preset: 'Muffled',
        params: { low: 0, presence: -10, air: -12, highCut: 1000 },
      },
    ],
  },
  {
    id: 'smooth-long-tail',
    name: 'Smooth long tail',
    category: 'space',
    description: 'A long bright tail with the tones that ring out of it turned down as they build.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
      { deviceId: 'tamer', preset: 'Bright tail' },
    ],
  },
]
