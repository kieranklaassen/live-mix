// Motion: modulation.

import { type FactoryChain } from '../types'

export const MOTION_CHAINS: readonly FactoryChain[] = [
  {
    id: 'slow-chorus',
    name: 'Slow chorus',
    category: 'motion',
    description: 'Three voices drifting over twelve seconds: width and movement without wobble.',
    effects: [{ deviceId: 'chorus', preset: 'Slow drift' }],
  },
  {
    id: 'phaser-sweep',
    name: 'Phaser sweep',
    category: 'motion',
    description: 'Eight resonant stages swept up and down once every sixteen seconds.',
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Deep eight-stage',
        params: { rate: 0.06, depth: 85, shape: 1, stereo: 60, feedback: 55, mix: 0.42 },
      },
    ],
  },
  {
    id: 'rotary-chorale',
    name: 'Rotary chorale',
    category: 'motion',
    description: 'A rotating speaker on its slow speed, heard from across the room.',
    effects: [{ deviceId: 'rotary', preset: 'Across the room', params: { distance: 0.6 } }],
  },
  {
    id: 'tremolo-and-pan',
    name: 'Tremolo and pan',
    category: 'motion',
    description:
      'A harmonic tremolo that shimmers rather than pulses, then drifts from side to side.',
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 2.8, depth: 0.55 } },
      { deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.6 } },
    ],
  },
  {
    id: 'filter-tide',
    name: 'Filter tide',
    category: 'motion',
    description:
      'A low-pass filter that starts closed and takes a hundred seconds to open and close again.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { cutoffHz: 900, resonance: 1, lfoAmount: 40, lfoRateHz: 0.01, lfoShape: 1 },
      },
    ],
  },

  {
    id: 'breathing-pulses',
    name: 'Breathing pulses',
    category: 'motion',
    description:
      'The reverb comes in three slow waves and comes round again, quieter each time, into a plate.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'twin-rate-ensemble',
    name: 'Twin rate ensemble',
    category: 'motion',
    description:
      'Two choruses in a row, one slow and deep, one quick and shallow: the thick shimmer of a string machine.',
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { rate: 0.6, depth: 45, spread: 25 } },
      {
        deviceId: 'chorus',
        preset: 'Fast flutter',
        params: { rate: 5.6, depth: 12, delayMs: 9, spread: 25, mix: 0.4 },
      },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 5.5 } },
    ],
  },
  {
    id: 'spring-then-tremolo',
    name: 'Spring then tremolo',
    category: 'motion',
    description:
      'One spring, a tremolo after it and the speaker of a small combo amplifier, so the splash pulses with the notes.',
    effects: [
      {
        deviceId: 'spring-reverb',
        preset: 'Dark amp spring',
        params: { mix: 0.35, decay: 2.8, tone: 3600, drip: 0.5 },
      },
      {
        deviceId: 'tremolo',
        preset: 'Amp tremolo',
        params: { rate: 5.2, depth: 0.6, smooth: 0.35 },
      },
      {
        deviceId: 're-amp',
        preset: 'Combo in a room',
        params: { distance: 0.15, noise: 0.03, output: 1.5 },
      },
    ],
  },
  {
    id: 'fast-rotary-room',
    name: 'Fast rotary room',
    category: 'motion',
    description:
      'A rotating speaker on its fast speed with the amplifier pushed and the horn forward, in a small room.',
    effects: [
      {
        deviceId: 'rotary',
        preset: 'Tremolo',
        params: {
          hornDepth: 0.8,
          drumDepth: 0.7,
          drive: 0.5,
          balance: 0.6,
          distance: 0.4,
          spread: 0.9,
        },
      },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'soft-keys-phaser',
    name: 'Soft keys phaser',
    category: 'motion',
    description:
      'A warm preamp and a four stage phaser turning every two seconds, the soft swirl for an electric piano, in a small plate.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { output: 1 } },
      {
        deviceId: 'phaser',
        preset: 'Classic four-stage',
        params: { centerHz: 700, feedback: 30, rate: 0.5, depth: 55, stereo: 40 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'drifting-double',
    name: 'Drifting double',
    category: 'motion',
    description:
      'Two unsteady copies either side and a later, duller pair behind them, like extra takes: width with no sweep.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Drifting', params: { drift: 0.7 } },
      {
        deviceId: 'stereo-detune',
        preset: 'Late copy',
        params: { detune: 3, delay: 48, tone: 6000, mix: 0.25 },
      },
    ],
  },
  {
    id: 'touch-wah-echo',
    name: 'Touch wah echo',
    category: 'motion',
    description:
      'A resonant low pass that opens further the harder you play, then dark analog repeats of every note.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Touch wah',
        params: { type: 0, cutoffHz: 300, resonance: 4, driveDb: 6, envAmount: 100, mix: 0.85 },
      },
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 340, feedback: 0.5, mix: 0.36 },
      },
    ],
  },
  {
    id: 'sweeping-hall',
    name: 'Sweeping hall',
    category: 'motion',
    description:
      'A hall with a slow flanger after it, so the jet sweep passes through the tail as well as the notes and drifts from side to side.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Hall', params: { midDecay: 3.2, mix: 0.4 } },
      {
        deviceId: 'flanger',
        preset: 'Slow sweep',
        params: { rate: 0.07, feedback: 45, stereo: 30, mix: 0.4 },
      },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 4.5 } },
    ],
  },
  {
    id: 'filter-fed-echo',
    name: 'Filter fed echo',
    category: 'motion',
    description:
      'A low pass swings open and shut before a tape echo, so each repeat is caught at a different brightness.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { slope: 1, cutoffHz: 1100, resonance: 1, lfoAmount: 65, lfoRateHz: 0.31 },
      },
      {
        deviceId: 'tape-echo',
        preset: 'Warm repeats',
        params: { time: 430, feedback: 0.55, spread: 0.5, mix: 0.38 },
      },
    ],
  },
  {
    id: 'swelling-nave',
    name: 'Swelling nave',
    category: 'motion',
    description:
      'A cathedral whose tail sings a soft ah, and the whole of it rises and falls at random like surf on a beach.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
      { deviceId: 'tremolo', preset: 'Sea swell', params: { rate: 0.22, depth: 0.6 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 3 } },
    ],
  },
  {
    id: 'opening-notes',
    name: 'Opening notes',
    category: 'motion',
    description:
      'Each note starts dull, opens a moment later and dims again as it fades, spread by a chorus and a hall.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Soft bloom',
        params: { cutoffHz: 420, resonance: 1.1, driveDb: 6, envAmount: 100, envAttackMs: 150 },
      },
      { deviceId: 'chorus', preset: 'Wide chorus', params: { rate: 0.5, mix: 0.35 } },
      { deviceId: 'fet-limiter', params: { inputGain: 3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3, breathDepth: 0 } },
    ],
  },
  {
    id: 'bow-and-vibrato',
    name: 'Bow and vibrato',
    category: 'motion',
    description:
      'Each note fades in like a bow stroke, is held up as it dies and wavers in pitch like a string player, in a hall.',
    effects: [
      { deviceId: 'swell', preset: 'Slow bow', params: { attack: 500 } },
      { deviceId: 'ambient-comp', preset: 'Long sustain', params: { makeup: 15.5 } },
      {
        deviceId: 'tremolo',
        preset: 'Pitch wobble',
        params: { rate: 5.4, depth: 0.22, drift: 0.4 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'overtone-sweep',
    name: 'Overtone sweep',
    category: 'motion',
    description:
      'A narrow peak climbs and falls through the harmonics, picking them out one at a time, levelled and set in an airy hall.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Resonant peak',
        params: {
          cutoffHz: 1200,
          resonance: 6,
          envAmount: 0,
          lfoAmount: 50,
          lfoRateHz: 0.12,
          lfoShape: 1,
        },
      },
      { deviceId: 'fet-limiter', params: { outputGain: -3 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'chorus-phase-wash',
    name: 'Chorus phase wash',
    category: 'motion',
    description:
      'An ensemble chorus, then a slow phaser, then a huge modulated space that keeps the swirl going long after the notes.',
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { spread: 50 } },
      { deviceId: 'phaser', preset: 'Slow swirl', params: { stereo: 90, mix: 0.45 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 24, modDepth: 0.5, width: 0.7 },
      },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 6.5 } },
    ],
  },
  {
    id: 'undersea-sway',
    name: 'Undersea sway',
    category: 'motion',
    description:
      'A deep slow chorus under a low pass that opens and closes over twenty seconds, in a dark cathedral that is slow to empty.',
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.5 } },
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { cutoffHz: 380, resonance: 0.8, driveDb: 0, lfoAmount: 20, lfoRateHz: 0.05 },
      },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.32, decay: 45 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 4.5 } },
    ],
  },
  {
    id: 'bright-air-flange',
    name: 'Bright air flange',
    category: 'motion',
    description:
      'A short flanger combing the upper harmonics and swaying between the sides, thinned of its lows by a bright preamp, in a bright hall.',
    effects: [
      {
        deviceId: 'flanger',
        preset: 'Through-zero feel',
        params: { delayMs: 0.7, rate: 0.18, feedback: 35, stereo: 30 },
      },
      {
        deviceId: 'analog-drive',
        preset: 'Sheen',
        params: { drive: 0.3, lowCut: 200, tone: 0.8, output: 4 },
      },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'photocell-throb',
    name: 'Photocell throb',
    category: 'motion',
    description:
      'A warm valve stage into a four stage phaser throbbing three times a second, kept in the middle with a dark spring.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.4, output: 1.5 } },
      {
        deviceId: 'phaser',
        preset: 'Fast throb',
        params: { centerHz: 800, feedback: 45, rate: 3, depth: 75 },
      },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'barber-pole-hall',
    name: 'Barber pole hall',
    category: 'motion',
    description:
      'A comb that seems to rise for ever, each pass a hertz further off pitch and so a little inharmonic, answered late by a hall.',
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Barber pole',
        params: { fine: 1.2, feedback: 0.55, width: 0.6, mix: 0.35 },
      },
      { deviceId: 'fdn-reverb', preset: 'Late arrival', params: { mix: 0.3, predelayMs: 120 } },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'random-step-grit',
    name: 'Random step grit',
    category: 'motion',
    description:
      'A flanger that jumps to a new place four times a second, through an eight bit converter and worn tape that dips and dulls.',
    effects: [
      { deviceId: 'flanger', preset: 'Stepped random', params: { feedback: 55 } },
      {
        deviceId: 'vintage-digital',
        preset: 'Dusty',
        params: { rate: 4000, bits: 8, aliasing: 0.8, filter: 0, drive: 6 },
      },
      {
        deviceId: 'tape',
        preset: 'Worn thin',
        params: { wow: 0.5, age: 0.8, hiss: 0.2, output: 3 },
      },
    ],
  },
  {
    id: 'three-against-two',
    name: 'Three against two',
    category: 'motion',
    description:
      'Two tremolos at two and three pulses a second cut the sound into a cross rhythm, in a small room.',
    effects: [
      { deviceId: 'saturator', preset: 'Init', params: { driveDb: 5 } },
      { deviceId: 'tremolo', preset: 'On and off', params: { rate: 2, depth: 0.8, smooth: 0.25 } },
      {
        deviceId: 'tremolo',
        preset: 'On and off',
        params: { rate: 3, depth: 0.7, shape: 0, phase: 90, smooth: 0.2 },
      },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },
  {
    id: 'singing-comb',
    name: 'Singing comb',
    category: 'motion',
    description:
      'A comb filter driven close to ringing and slid slowly, so a pipe sings along with the notes, held by a limiter in a damped plate.',
    effects: [
      {
        deviceId: 'flanger',
        preset: 'Metal resonator',
        params: { delayMs: 1.6, rate: 0.04, depth: 45, feedback: 85, stereo: 10 },
      },
      { deviceId: 'fet-limiter', params: { inputGain: 2 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'loops-near-and-far',
    name: 'Loops near and far',
    category: 'motion',
    description:
      'The sound walks nearer and farther by itself while three loops record it, so each layer comes back from another distance; turn Wander.',
    effects: [
      { deviceId: 'distance', preset: 'Slow tide', params: { rate: 0.12, level: 1 } },
      { deviceId: 'orbits', preset: 'Out of step' },
    ],
  },
  {
    id: 'slow-currents',
    name: 'Slow currents',
    category: 'motion',
    description:
      'Five bands of the sound swell, fade and drift from side to side, each on its own slow cycle, like water; Rate sets how slow.',
    effects: [{ deviceId: 'currents', preset: 'Slow water', params: { sway: 0.75, rate: 0.14 } }],
  },
  {
    id: 'pad-in-the-current',
    name: 'Pad in the current',
    category: 'motion',
    description:
      'Each chord is caught and held as a string pad, and its bands rise, fall and cross from side to side like a slow tide; Depth sets how far.',
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings' },
      { deviceId: 'currents', preset: 'Wide tide' },
    ],
  },
  {
    id: 'bells-in-the-current',
    name: 'Bells in the current',
    category: 'motion',
    description:
      'A bell with a fifth in it rings in every note, and narrow bands of the sound surface and sink by themselves in a hall; Rate hurries them.',
    effects: [
      { deviceId: 'ring', preset: 'Fifth halo', params: { mix: 0.3 } },
      { deviceId: 'currents', preset: 'Glass notes' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'slow-breath',
    name: 'Slow breath',
    category: 'motion',
    description:
      'The sound breathes in for three seconds and out for four and a half, fading, darkening and narrowing as it empties; Depth sets how far.',
    effects: [{ deviceId: 'breath', preset: 'Calm breath', params: { width: 0.8 } }],
  },
  {
    id: 'loops-breathing-apart',
    name: 'Loops breathing apart',
    category: 'motion',
    description:
      'The playing breathes in and out, and three loops of unequal length bring the breaths back out of step with each other; Depth deepens them.',
    effects: [
      { deviceId: 'breath', preset: 'Calm breath', params: { depth: 0.6 } },
      { deviceId: 'orbits', preset: 'Out of step', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'drifting-pulses',
    name: 'Drifting pulses',
    category: 'motion',
    description:
      'Two soft gates pulse the sound left and right on one pattern, the second a little faster, so they slide apart and meet; Rate sets the pace.',
    effects: [{ deviceId: 'pulses', preset: 'Slow drift', params: { floor: 0.7, accent: 0.6 } }],
  },
  {
    id: 'phasing-pulses',
    name: 'Phasing pulses',
    category: 'motion',
    description:
      'Held chords are pulsed by two gates in a fixed canon, and three loops of unequal length turn the pattern on itself; Rate sets the pulse.',
    effects: [
      { deviceId: 'sustainer', preset: 'Sustain pedal' },
      { deviceId: 'pulses', preset: 'Canon of three' },
      { deviceId: 'orbits', preset: 'Slow phasing', params: { mix: 0.5 } },
    ],
  },
  {
    id: 'ripples-in-fog',
    name: 'Ripples in fog',
    category: 'motion',
    description:
      'Two drifting gates pulse the sound and a short cloud blurs each pulse into a ripple with no edge; Size makes the cloud longer.',
    effects: [
      { deviceId: 'pulses', preset: 'Slow drift', params: { rate: 6 } },
      { deviceId: 'fog', preset: 'Soft cloud', params: { width: 0.6 } },
    ],
  },
  {
    id: 'vibrato-arrives-late',
    name: 'Vibrato arrives late',
    category: 'motion',
    description:
      'Each note starts straight and begins to sway in pitch after a quarter second, as a singer does; a new note stills it; Wait sets how long.',
    effects: [{ deviceId: 'late-vibrato', preset: 'Singer', params: { width: 0.3 } }],
  },
  {
    id: 'bowed-in-fog',
    name: 'Bowed in fog',
    category: 'motion',
    description:
      'Each attack is blurred away, and what is left starts straight and then wavers like a bowed string in a plate; Depth sets the sway.',
    effects: [
      { deviceId: 'fog', preset: 'No attack', params: { width: 0.5 } },
      { deviceId: 'late-vibrato', preset: 'Finger vibrato', params: { depth: 30 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'evening-flock',
    name: 'Evening flock',
    category: 'motion',
    description:
      'Twelve copies of the sound fly around the listener, each with its own distance, delay and bend in pitch; Range sets how far they go.',
    effects: [{ deviceId: 'murmuration', preset: 'Evening flock', params: { birds: 12 } }],
  },
  {
    id: 'shoal-turning',
    name: 'Shoal turning',
    category: 'motion',
    description:
      'The sound sinks just under a bright surface and six copies of it drift slowly round the listener; Depth takes it deeper.',
    effects: [
      { deviceId: 'underwater', preset: 'Sunlit shallows' },
      { deviceId: 'murmuration', preset: 'Slow drift', params: { speed: 0.5 } },
    ],
  },
  {
    id: 'birds-before-sunrise',
    name: 'Birds before sunrise',
    category: 'motion',
    description:
      "Quick whistles leap among the harmonics of the key's note and nine copies carry them around a bright hall; Pace sets how fast they call.",
    effects: [
      { deviceId: 'overtone-singer', preset: 'Bird calls', params: { drone: 0.9 } },
      { deviceId: 'murmuration', preset: 'High and bright' },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
    ],
  },
]
