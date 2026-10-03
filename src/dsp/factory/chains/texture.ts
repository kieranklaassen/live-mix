// Texture: granular and spectral.

import { type FactoryChain } from '../types'

export const TEXTURE_CHAINS: readonly FactoryChain[] = [
  {
    id: 'soft-grain-cloud',
    name: 'Soft grain cloud',
    category: 'texture',
    description:
      'The last moments replayed as overlapping grains in a hall; its freeze holds the cloud still.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Soft cloud' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'spectral-smear',
    name: 'Spectral smear',
    category: 'texture',
    description:
      'Every frequency hangs on after its note and attacks dissolve; switch on freeze for a drone.',
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Slow dissolve',
        params: { blur: 0.8, mix: 0.4, width: 0.7 },
      },
    ],
  },
  {
    id: 'sympathetic-strings',
    name: 'Sympathetic strings',
    category: 'texture',
    description:
      'Sixteen strings that tune themselves to the notes you play and ring on after them.',
    effects: [
      {
        deviceId: 'sympathetic',
        preset: 'Follow the tune',
        params: { strings: 12, sympathy: 0.5, decay: 6, mix: 0.3, width: 0.85 },
      },
    ],
  },
  {
    id: 'bowed-swells',
    name: 'Bowed swells',
    category: 'texture',
    description:
      'Attacks are removed so each note fades in like a bow, levelled and carried on by a plate.',
    effects: [
      { deviceId: 'swell', preset: 'Bowed' },
      { deviceId: 'fet-limiter', params: { inputGain: 8, outputGain: -2 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'scattered-drift',
    name: 'Scattered drift',
    category: 'texture',
    description:
      'Reversed grains of the last two seconds wander off pitch both ways, in a dark room.',
    effects: [
      { deviceId: 'spectral-drifter', preset: 'Scatter', params: { bloom: 0.85, mix: 0.4 } },
      {
        deviceId: 'expanse',
        preset: 'Small dark room',
        params: { size: 0.3, decay: 4, mix: 0.35 },
      },
    ],
  },

  {
    id: 'soft-stumbles',
    name: 'Soft stumbles',
    category: 'texture',
    description:
      'Now and then a moment repeats, turns backwards or winds down, each one faded in and blurred by a hall.',
    effects: [
      { deviceId: 'glitch', preset: 'Gentle stumble', params: { calm: 0.85, chance: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'skipping-disc',
    name: 'Skipping disc',
    category: 'texture',
    description:
      'The sound sticks on tiny fragments like a scratched disc, softened and set in a plate.',
    effects: [
      { deviceId: 'glitch', preset: 'Skipping disc', params: { calm: 0.45, mix: 0.8 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'stacked-loops',
    name: 'Stacked loops',
    category: 'texture',
    description:
      'Each note comes back as little loops an octave and two octaves up, falling into a long plate.',
    effects: [
      { deviceId: 'cascade', preset: 'Octave stack', params: { mix: 0.45 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'drawn-drone',
    name: 'Drawn drone',
    category: 'texture',
    description: 'A slowly darkening drone is drawn out of every note and carried into a hall.',
    effects: [
      { deviceId: 'cascade', preset: 'Long drone', params: { mix: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sideband-ghosts',
    name: 'Sideband ghosts',
    category: 'texture',
    description:
      'Every pitch shifted off its harmony on a drifting sideband set, repeated on worn tape and left in a plate.',
    effects: [
      {
        deviceId: 'radio',
        preset: 'Sideband voices',
        params: { tuning: 0.25, interference: 0.1, mix: 0.8 },
      },
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { feedback: 0.45, mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'section-behind',
    name: 'Section behind',
    category: 'texture',
    description:
      'A string section swells in behind each chord and follows the harmony, set in a soft plate.',
    effects: [
      { deviceId: 'pad-follower', preset: 'String pad' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'strings-above',
    name: 'Strings above',
    category: 'texture',
    description:
      'A section an octave above what you play rises slowly over it and drifts off into a hall.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Octave halo' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'sustain-pedal',
    name: 'Sustain pedal',
    category: 'texture',
    description:
      'Holds each note or chord as an even pad that glides to the next, with a little room around it.',
    effects: [
      { deviceId: 'sustainer', preset: 'Sustain pedal', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'held-strings',
    name: 'Held strings',
    category: 'texture',
    description:
      'Every chord you play is caught and swells in behind you as a slow string section in a long plate.',
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings', params: { mix: 0.45 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
    ],
  },

  {
    id: 'fine-grain-veil',
    name: 'Fine grain veil',
    category: 'texture',
    description:
      'A fine layer of short forward grains sits just behind the sound and widens it a little, in a small room.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Thin veil', params: { size: 90, spread: 0.9, mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'attacks-dissolved',
    name: 'Attacks dissolved',
    category: 'texture',
    description:
      'Phases are scrambled so every attack loses its edge and a short haze follows it, in a tight room.',
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'Softened attacks',
        params: { blur: 0.2, smear: 0.7, width: 1 },
      },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 2 } },
    ],
  },
  {
    id: 'grain-struck-strings',
    name: 'Grain struck strings',
    category: 'texture',
    description:
      'Stray fragments of the last few seconds come back at random, and each one sets strings tuned to the white keys ringing.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Stray memories', params: { density: 4, mix: 0.35 } },
      {
        deviceId: 'sympathetic',
        preset: 'Long ring',
        params: { sympathy: 0.7, decay: 6, mix: 0.4, width: 0.5 },
      },
    ],
  },
  {
    id: 'notes-into-pad',
    name: 'Notes into pad',
    category: 'texture',
    description:
      'Attacks are faded out and the rest is blurred almost fully wet, so any sound comes back as a slow pad in a hall.',
    effects: [
      { deviceId: 'swell', preset: 'Bowed' },
      { deviceId: 'spectral-blur', preset: 'Pad from anything', params: { mix: 0.9 } },
      { deviceId: 'stereo-widener', preset: 'Narrow' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { inputGain: 3, outputGain: -0.5 } },
    ],
  },
  {
    id: 'blurred-low-bed',
    name: 'Blurred low bed',
    category: 'texture',
    description:
      'The lows of each note hang on as a blurred bed under the sound, warmed by a tape stage.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Sub bed', params: { tilt: -4, width: 0, mix: 0.15 } },
      { deviceId: 'saturator', preset: 'Soft tape warmth', params: { driveDb: 3 } },
    ],
  },
  {
    id: 'octave-grain-rain',
    name: 'Octave grain rain',
    category: 'texture',
    description:
      'Sparse short grains an octave up fall after each note and splash into slack, chirping springs.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Octave rain', params: { density: 5, mix: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Slack and strange', params: { decay: 3, mix: 0.3 } },
    ],
  },
  {
    id: 'glitter-after-notes',
    name: 'Glitter after notes',
    category: 'texture',
    description:
      'Fast plucked replays an octave and two above glitter for a second after each note, with a short halo.',
    effects: [
      { deviceId: 'cascade', preset: 'Glass rain', params: { mix: 0.4 } },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'airy-octave-blur',
    name: 'Airy octave blur',
    category: 'texture',
    description:
      'Only the top of the sound is blurred and doubled an octave up, a bright air left hanging in a long thin tail.',
    effects: [
      {
        deviceId: 'spectral-blur',
        preset: 'High air',
        params: { tilt: 1.5, lowCut: 700, mix: 0.4 },
      },
      { deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'low-tide-grains',
    name: 'Low tide grains',
    category: 'texture',
    description:
      'Long grains an octave down, most of them backwards, roll in under the sound and sink into a dark hall.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Low tide', params: { density: 7, mix: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'backwards-undertow',
    name: 'Backwards undertow',
    category: 'texture',
    description:
      'Each note returns backwards over a copy an octave down and twice as long, then drops down a narrow dark shaft.',
    effects: [
      { deviceId: 'cascade', preset: 'Undertow', params: { spread: 0.2 } },
      { deviceId: 'swarm-reverb', preset: 'Mine shaft', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'granulated-hall',
    name: 'Granulated hall',
    category: 'texture',
    description:
      'A long hall tail is cut into tiny grains with abrupt edges and scattered, so the room crackles as it fades.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.55 } },
      {
        deviceId: 'grain-cloud',
        preset: 'Glass shards',
        params: {
          position: 0.01,
          size: 35,
          density: 30,
          pitch: 0,
          spray: 0.4,
          scatter: 0.15,
          feedback: 0,
          mix: 0.55,
        },
      },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'stepped-filter-haze',
    name: 'Stepped filter haze',
    category: 'texture',
    description:
      'A filter jumps to a random band three times a second and a blur holds each one, so the colours overlap.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Stepped',
        params: { cutoffHz: 700, resonance: 3, lfoRateHz: 3 },
      },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { blur: 0.75, mix: 0.6 } },
      { deviceId: 'expanse', preset: 'Bright chamber', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'bell-metal-grains',
    name: 'Bell metal grains',
    category: 'texture',
    description:
      'A copy shifted up by a fixed number of hertz rings like inharmonic bells, scattered as grains in a cathedral.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Bell metal', params: { mix: 0.5 } },
      {
        deviceId: 'grain-cloud',
        preset: 'Soft cloud',
        params: { size: 320, reverse: 0.4, mix: 0.4 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: -1 } },
    ],
  },
  {
    id: 'residue-ghost',
    name: 'Residue ghost',
    category: 'texture',
    description:
      'Keeps what a starved stream would throw away: a thin grainy ghost of each note hung over it in open air.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Thin air', params: { smear: 0.5, mix: 0.4 } },
      { deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'shards-into-cloud',
    name: 'Shards into cloud',
    category: 'texture',
    description:
      'Tiny stuck fragments, some an octave off, are thrown into a cloud of grains and patter away in a cave.',
    effects: [
      { deviceId: 'glitch', preset: 'Shards', params: { chance: 0.4, calm: 0.3 } },
      { deviceId: 'grain-delay', preset: 'Grain cloud', params: { mix: 0.35 } },
      { deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.25 } },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { inputGain: 2, outputGain: -0.5 } },
    ],
  },
  {
    id: 'gathering-drone',
    name: 'Gathering drone',
    category: 'texture',
    description:
      'Every note hangs in the blur for many seconds, so a phrase gathers into a drone under a very slow sweeping comb.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Endless', params: { shimmer: 0.1, mix: 0.5 } },
      { deviceId: 'flanger', preset: 'Glacial drift', params: { feedback: 35, mix: 0.35 } },
      { deviceId: 'stereo-widener', preset: 'Narrow', params: { width: 0.4 } },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'chords-piling-up',
    name: 'Chords piling up',
    category: 'texture',
    description:
      'Each new chord is caught on top of the last, so harmony piles up in a slow chorus and takes many seconds to fade.',
    effects: [
      { deviceId: 'sustainer', preset: 'Stacked harmony', params: { mix: 0.4 } },
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'backward-grain-bloom',
    name: 'Backward grain bloom',
    category: 'texture',
    description:
      'Every grain plays backwards close behind the note, and a reverb swells up after it and fades.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Backwards room', params: { feedback: 0.35, mix: 0.45 } },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'fogged-string-pad',
    name: 'Fogged string pad',
    category: 'texture',
    description:
      'A soft string pad grows out of the notes and lingers, and both are ground into a dense fog of grains that hangs over them.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Lingering', params: { brightness: 3000, mix: 0.5 } },
      { deviceId: 'grain-cloud', preset: 'Thick fog', params: { density: 40, mix: 0.5 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 1.5 } },
    ],
  },
  {
    id: 'phrase-turned-pad',
    name: 'Phrase turned pad',
    category: 'texture',
    description:
      'The last few seconds loop as a blur of grains and hold until the next phrase replaces them, under a slow phaser.',
    effects: [
      {
        deviceId: 'micro-looper',
        preset: 'Soft bed',
        params: { length: 2.5, smear: 1, fade: 1, drift: 0.05, spread: 0.6, mix: 0.3 },
      },
      {
        deviceId: 'phaser',
        preset: 'Deep eight-stage',
        params: { feedback: 40, rate: 0.17, stereo: 60, mix: 0.35 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 8, mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 3.5 } },
    ],
  },
]
