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
  {
    id: 'light-on-water',
    name: 'Light on water',
    category: 'motion',
    description:
      'A twentieth of a second late, every narrow band of the sound has its own slow tremolo, so partials catch the light and let it go; try Rate.',
    effects: [{ deviceId: 'glimmer', preset: 'Light on water', params: { depth: 0.45 } }],
  },
  {
    id: 'glittering-nave',
    name: 'Glittering nave',
    category: 'motion',
    description:
      'A cathedral tail whose upper partials flicker fast, each side its own way, over a still low end, a twentieth of a second late; try Lean.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } },
      { deviceId: 'glimmer', preset: 'Glitter on top', params: { depth: 0.85 } },
    ],
  },
  {
    id: 'sunlight-from-below',
    name: 'Sunlight from below',
    category: 'motion',
    description:
      'Heard from just under the surface, a ripple of brightness climbing the partials every second or two, a twentieth of a second late; try Rate.',
    effects: [
      { deviceId: 'underwater', preset: 'Sunlit shallows' },
      { deviceId: 'glimmer', preset: 'Rising ripple', params: { lean: 0.5 } },
    ],
  },
  {
    id: 'circling-the-listener',
    name: 'Circling the listener',
    category: 'motion',
    description:
      'The sound walks a slow circle round your head, the far ear in its shadow and the back a little duller; Rate sets how long a lap takes.',
    effects: [{ deviceId: 'around', preset: 'Slow circle' }],
  },
  {
    id: 'bass-stays-top-circles',
    name: 'Bass stays, top circles',
    category: 'motion',
    description:
      'The sound circles your head while everything under 180 Hz is held in the middle, so the floor never moves; Low split sets where.',
    effects: [
      { deviceId: 'around', preset: 'Slow circle' },
      { deviceId: 'spread', preset: 'Firm bass', params: { lowHz: 180, output: 2 } },
    ],
  },
  {
    id: 'cloud-going-round',
    name: 'Cloud going round',
    category: 'motion',
    description:
      'Notes swell in out of a cloud and the whole cloud walks a slow circle round your head; Rate sets how long a lap takes.',
    effects: [
      { deviceId: 'fog', preset: 'Slow rise' },
      { deviceId: 'around', preset: 'Slow circle' },
    ],
  },
  {
    id: 'bowls-carried-round',
    name: 'Bowls carried round',
    category: 'motion',
    description:
      'Bowls tuned to the key ring with every note you play and are carried with the playing round your head; Ring sets how long they sing.',
    effects: [
      { deviceId: 'bowls', preset: 'Bowl table', params: { strike: 1 } },
      { deviceId: 'around', preset: 'Slow circle' },
    ],
  },
  {
    id: 'slow-wave-in-a-nave',
    name: 'Slow wave in a nave',
    category: 'motion',
    description:
      'A cathedral tail whose middle swells and sinks 48 times a minute, while the bass and the air above 2.5 kHz stay level.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
      { deviceId: 'band-pulse', preset: 'One up, one down', params: { rate: 0.8, depth: 0.7 } },
    ],
  },
  {
    id: 'four-a-second-apart',
    name: 'Four a second, apart',
    category: 'motion',
    description:
      'Four soft pulses a second on the middle band, the right side a quarter of a pulse behind the left, widened by a slow chorus.',
    effects: [
      { deviceId: 'band-pulse', preset: 'Four a second', params: { depth: 0.6, offset: 90 } },
      { deviceId: 'chorus', preset: 'Subtle widener' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 3 } },
    ],
  },
  {
    id: 'six-a-second-plate',
    name: 'Six a second in a plate',
    category: 'motion',
    description:
      'Six pulses a second on the band from 150 Hz to 1.5 kHz, each a soft swell, and a plate that rings through the gaps.',
    effects: [
      { deviceId: 'band-pulse', preset: 'Six a second' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 2.5 } },
    ],
  },
  {
    id: 'ten-a-second-room',
    name: 'Ten a second, room',
    category: 'motion',
    description:
      'A small room, then ten pulses a second on everything from 200 Hz to 2 kHz, so the room flutters with the notes.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Room' },
      { deviceId: 'band-pulse', preset: 'Ten a second' },
    ],
  },
  {
    id: 'fourteen-on-strings',
    name: 'Fourteen on strings',
    category: 'motion',
    description:
      'Each chord is caught and held as a string pad, and its low middle flutters fourteen times a second under a still top.',
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings' },
      { deviceId: 'band-pulse', preset: 'Fourteen a second' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 2 } },
    ],
  },
  {
    id: 'eighteen-in-a-hall',
    name: 'Eighteen in a hall',
    category: 'motion',
    description:
      'A hall, then the band from 200 Hz to 1 kHz pulsed eighteen times a second at half depth, the tail with the notes.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
      { deviceId: 'band-pulse', preset: 'Sixteen mid band', params: { rate: 18, depth: 0.5 } },
    ],
  },
  {
    id: 'forty-smooth-warm',
    name: 'Forty smooth, warm',
    category: 'motion',
    description:
      'A warm preamp, then forty smooth pulses a second from 100 Hz to 4 kHz: an even roughness on every note, in a small plate.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { output: 1 } },
      { deviceId: 'band-pulse', preset: 'Forty, smooth' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'forty-ticks-over-bass',
    name: 'Forty ticks over bass',
    category: 'motion',
    description:
      'From 300 Hz to 3 kHz the sound comes in forty short ticks a second, a buzz over a bass that is left whole, held by a limiter.',
    effects: [
      { deviceId: 'band-pulse', preset: 'Forty ticks' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 3 } },
    ],
  },
  {
    id: 'sixteenths-in-time',
    name: 'Sixteenths in time',
    category: 'motion',
    description:
      'Eight pulses a second, the sixteenth notes of a piece at 120 beats a minute, with a clean echo on every beat.',
    effects: [
      { deviceId: 'band-pulse', preset: 'Eight a second', params: { depth: 0.8, edge: 8 } },
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 500, mix: 0.3 } },
    ],
  },
  {
    id: 'sixty-six-a-minute',
    name: 'Sixty six a minute',
    category: 'motion',
    description:
      'Held chords whose low middle sounds for a fifth of each beat, 66 beats a minute, a soft swell and a long gap, in a hall.',
    effects: [
      { deviceId: 'sustainer', preset: 'Sustain pedal' },
      { deviceId: 'band-pulse', preset: 'Seventy a minute', params: { rate: 1.1 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 3 } },
    ],
  },
  {
    id: 'hall-a-hertz-apart',
    name: 'Hall a hertz apart',
    category: 'motion',
    description:
      'A hall, then all of it from 60 Hz to 2 kHz a hertz apart between the ears, so notes and tail beat once a second; headphones.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
      { deviceId: 'ear-shift', preset: 'One, wide band', params: { ears: 0.7 } },
    ],
  },
  {
    id: 'pad-six-apart',
    name: 'Pad six apart',
    category: 'motion',
    description:
      'Each chord is held as a string pad that beats six times a second between the ears; on speakers it pulses in the air.',
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings' },
      { deviceId: 'ear-shift', preset: 'Six a second', params: { ears: 0.8, high: 2000 } },
    ],
  },
  {
    id: 'second-rank',
    name: 'Second rank',
    category: 'motion',
    description:
      'Organ stops on every note and a slow wave through them, three in two seconds, as two ranks a little apart make, in a cathedral.',
    effects: [
      { deviceId: 'stops', preset: 'Principal chorus' },
      { deviceId: 'ear-shift', preset: 'Slow wave' },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 2.5 } },
    ],
  },
  {
    id: 'spring-ten-a-second',
    name: 'Spring ten a second',
    category: 'motion',
    description:
      'A spring tank, then all of it from 60 Hz to 2 kHz pulsing ten times a second in the air, the same on speakers as on headphones.',
    effects: [
      { deviceId: 'spring-reverb', preset: 'Two spring tank' },
      { deviceId: 'ear-shift', preset: 'Ten in the air', params: { low: 60, high: 2000 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 2.5 } },
    ],
  },
  {
    id: 'two-beats-an-echo',
    name: 'Two beats an echo',
    category: 'motion',
    description:
      'Echoes half a second apart and four hertz between the ears: the beat comes round twice to an echo, in time at 120 beats a minute.',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Clean echo',
        params: { time: 500, feedback: 0.45 },
      },
      { deviceId: 'ear-shift', preset: 'Six a second', params: { beat: 4, ears: 0.8, high: 2000 } },
    ],
  },
  {
    id: 'dull-and-three-apart',
    name: 'Dull and three apart',
    category: 'motion',
    description:
      'A low pass at 700 Hz, then all that is left three hertz apart between the ears: the whole sound beats, not a band of it; headphones.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { slope: 1, cutoffHz: 700 },
      },
      { deviceId: 'ear-shift', preset: 'Six a second', params: { beat: 3, ears: 0.8, high: 2000 } },
    ],
  },
  {
    id: 'pad-pulsing-at-four',
    name: 'Pad pulsing at four',
    category: 'motion',
    description:
      'A string pad swells in behind the notes and all of it from 60 Hz to 2 kHz pulses four times a second in the air, in a plate.',
    effects: [
      { deviceId: 'pad-follower', preset: 'String pad' },
      { deviceId: 'ear-shift', preset: 'Four in the air', params: { low: 60 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 4.5 } },
    ],
  },
  {
    id: 'beat-into-a-plate',
    name: 'Beat into a plate',
    category: 'motion',
    description:
      'Two hertz between the ears and a little room noise, then a plate that sums the sides: in its tail the beat is a faint pulse in the air.',
    effects: [
      { deviceId: 'ear-shift', preset: 'Six a second', params: { beat: 2, ears: 0.7, high: 2000 } },
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -40 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 3 } },
    ],
  },
  {
    id: 'eight-half-in-the-air',
    name: 'Eight, half in the air',
    category: 'motion',
    description:
      'A warm preamp, then eight a second, half between the ears and half in the air: each ear dips 6 dB and the two together pulse to silence.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { output: -1.5 } },
      { deviceId: 'ear-shift', preset: 'Eight, half air', params: { high: 2000 } },
    ],
  },
  {
    id: 'bowed-half-a-hertz',
    name: 'Bowed, half a hertz',
    category: 'motion',
    description:
      'Each note fades in like a bow stroke and beats between the ears once every two seconds, from 60 Hz to 2 kHz; headphones.',
    effects: [
      { deviceId: 'swell', preset: 'Slow bow' },
      { deviceId: 'ear-shift', preset: 'Slow turn', params: { ears: 0.6, high: 2000 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 7 } },
    ],
  },
  {
    id: 'four-slowing-in-a-hall',
    name: 'Four slowing in a hall',
    category: 'motion',
    description:
      'Four layers of one pulse, each twice as fast as the next, seem to slow for ever, halving every twenty seconds, in a hall.',
    effects: [
      { deviceId: 'winding-down', preset: 'Four slowing' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 4 } },
    ],
  },
  {
    id: 'five-layers-on-strings',
    name: 'Five layers on strings',
    category: 'motion',
    description:
      'Each chord is held as a string pad under a weave of five pulses at half depth, all halving their pace every thirty seconds.',
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings' },
      { deviceId: 'winding-down', preset: 'Five layers', params: { halving: 30 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 3 } },
    ],
  },
  {
    id: 'losing-pace-held',
    name: 'Losing pace, held',
    category: 'motion',
    description:
      'Held chords pulse 72 times a minute, and the pulse seems to lose half its pace every minute and a half, in a hall.',
    effects: [
      { deviceId: 'sustainer', preset: 'Sustain pedal' },
      { deviceId: 'winding-down', preset: 'Losing pace' },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 1.5 } },
    ],
  },
  {
    id: 'three-a-second-sliding',
    name: 'Three a second, sliding',
    category: 'motion',
    description:
      'Three pulses a second that seem to slow, the right side a quarter of a pulse behind the left, and all under 400 Hz kept in the middle.',
    effects: [
      { deviceId: 'winding-down', preset: 'Three slowing', params: { depth: 0.8, offset: 90 } },
      { deviceId: 'spread', preset: 'Firm bass', params: { output: 4 } },
    ],
  },
  {
    id: 'six-a-second-slowing',
    name: 'Six a second, slowing',
    category: 'motion',
    description:
      'Six pulses a second at half depth, with three and twelve beside them, all sliding down an octave every thirty seconds in a short room.',
    effects: [
      { deviceId: 'winding-down', preset: 'Six a second' },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 2.5 } },
    ],
  },
  {
    id: 'eight-a-second-rising',
    name: 'Eight a second, rising',
    category: 'motion',
    description:
      'A small room, then eight pulses a second that seem to quicken for ever: each fades as it doubles and a slower one takes over.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Room' },
      { deviceId: 'winding-down', preset: 'Eight quickening' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 2.5 } },
    ],
  },
  {
    id: 'eighths-slowing-in-time',
    name: 'Eighths slowing in time',
    category: 'motion',
    description:
      'At 120 beats a minute: eighth notes that seem to halve their pace every eight bars, with a clean echo a dotted quarter behind.',
    effects: [
      {
        deviceId: 'winding-down',
        preset: 'Four slowing',
        params: { halving: 16, layers: 3, depth: 0.8, edge: 10 },
      },
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 750, mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 3 } },
    ],
  },
  {
    id: 'slowing-without-end',
    name: 'Slowing without end',
    category: 'motion',
    description:
      'Five layers of a deep pulse halve their pace every eight seconds, each fading out below as a quicker one fades in above, on a dark plate.',
    effects: [
      { deviceId: 'winding-down', preset: 'Ever slower' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 5 } },
    ],
  },
  {
    id: 'quickening-without-end',
    name: 'Quickening without end',
    category: 'motion',
    description:
      'Five layers of a deep pulse double their pace every eight seconds, the quickest fading out as a slow one fades in, in a bright hall.',
    effects: [
      { deviceId: 'winding-down', preset: 'Ever quicker' },
      { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.25 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 4 } },
    ],
  },
  {
    id: 'two-crossing-in-a-cloud',
    name: 'Two crossing in a cloud',
    category: 'motion',
    description:
      'One deep pulse crosses over to its double every ten seconds, swelling about a decibel once each time, blurred by a short cloud.',
    effects: [
      { deviceId: 'winding-down', preset: 'Two crossing' },
      { deviceId: 'fog', preset: 'Short blur' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: 2.5 } },
    ],
  },
]
