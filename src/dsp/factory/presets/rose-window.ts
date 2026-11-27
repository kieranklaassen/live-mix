import { type FactoryPreset } from '../types'

// Rose Window's symmetry is its harmony: three petals leave out every third
// harmonic, four leave the odd ones, twelve leave a few far up. A preset here
// begins with the petals and how the rings are built, then says how the rose
// opens and turns. The turning is the movement, so most of these add a room and
// no second modulation, and what adds pitches keeps to octaves and fifths.

export const ROSE_WINDOW_PRESETS: readonly FactoryPreset[] = [
  // Cathedral pads: many petals, few harmonics, slow.
  {
    id: 'rose-window-twelve-in-the-nave',
    name: 'Twelve petals in a nave',
    category: 'pad',
    description:
      'Twelve petals: a plain round tone with a few high harmonics opening over it in nine seconds, in a vast nave.',
    instrument: { deviceId: 'rose-window', preset: 'Slow cathedral', params: { attack: 2 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.35 } }],
  },
  {
    id: 'rose-window-six-from-the-rim',
    name: 'Six from the rim inwards',
    category: 'pad',
    description:
      'A rose of six that opens from its edge: thin high light first, then body, then the note, on a long plate.',
    instrument: {
      deviceId: 'rose-window',
      preset: 'Slow cathedral',
      params: {
        petals: 6,
        order: 1,
        rings: 5,
        bloom: 3.5,
        attack: 1,
        stone: 0.15,
        fold: 0.3,
        light: 4500,
      },
    },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.35 } },
      { deviceId: 'tape', preset: 'Quarter inch' },
    ],
  },
  // Hollow reeds: four petals, the odd harmonics, folded.
  {
    id: 'rose-window-reed-by-the-wall',
    name: 'Reed against the wall',
    category: 'wind',
    description:
      'Odd harmonics alone, folded, with breath on them: a hollow reed played close to a stone wall.',
    instrument: {
      deviceId: 'rose-window',
      preset: 'Hollow reed',
      params: { volume: -4.1, stone: 0.65 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } }],
  },
  {
    id: 'rose-window-low-reed-echo',
    name: 'Low reed, tape behind',
    category: 'keys',
    description:
      'A darker reed with a soft knock at its start, curled towards a vowel, with warm repeats of tape behind it.',
    instrument: {
      deviceId: 'rose-window',
      preset: 'Hollow reed',
      params: {
        volume: -1.9,
        light: 1100,
        curl: 0.45,
        fold: 0.3,
        strike: 0.35,
        decay: 2.5,
        heart: 0.55,
        release: 1.2,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
    ],
  },
  // Three-petal flutes: every third harmonic left out.
  {
    id: 'rose-window-flute-of-three',
    name: 'Flute of three petals',
    category: 'wind',
    description:
      'A soft flute with every third harmonic missing, more breath than tone as it speaks, in an airy hall.',
    instrument: { deviceId: 'rose-window', preset: 'Three-petal flute', params: { volume: -1.9 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } }],
    preview: 'line',
  },
  {
    id: 'rose-window-flutes-turning-round',
    name: 'Flutes going round',
    category: 'pad',
    description:
      'Three-petal flutes held as a chord, their rings tipping against each other every two seconds, in a slow chorus.',
    instrument: {
      deviceId: 'rose-window',
      preset: 'Three-petal flute',
      params: {
        volume: -9,
        turn: -0.42,
        tilt: 0.9,
        heart: 0.5,
        rings: 5,
        reach: 0.6,
        breath: 0.35,
        attack: 0.8,
        release: 3,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  // Glass plucks: many petals, struck, bright.
  {
    id: 'rose-window-glass-in-the-hall',
    name: 'Eight panes, plucked',
    category: 'plucked',
    description:
      'Short bright glass from eight petals, each note struck and left to ring three seconds in a bright plate.',
    instrument: { deviceId: 'rose-window', preset: 'Glass plucks', params: { volume: -3 } },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 7.5 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'rose-window-glass-wood-echo',
    name: 'Soft panes, dotted echo',
    category: 'plucked',
    description:
      'Rounder plucks from five petals, their outer rings soon gone, skipping through dotted echoes of tape.',
    instrument: {
      deviceId: 'rose-window',
      preset: 'Glass plucks',
      params: {
        volume: 3.7,
        petals: 5,
        light: 2600,
        damping: 0.65,
        heart: 0.55,
        fold: 0.35,
        decay: 5,
        stone: 0.25,
      },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
    ],
    preview: 'line',
  },
  // Golden bells: a rose that never closes.
  {
    id: 'rose-window-golden-chimes',
    name: 'Golden chimes, wide sky',
    category: 'bell',
    description:
      'A rose that never closes rings as chimes for twelve seconds, its partials leaning from side to side, in an open valley.',
    instrument: { deviceId: 'rose-window', preset: 'Chime wheel', params: { volume: -5 } },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 5.5 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'rose-window-golden-gong-tape',
    name: 'Gong of the closing hour',
    category: 'bell',
    description:
      'Golden bells with their rings stretched sharp and folded into a low bronze gong, slow to fade in a dark cave.',
    instrument: { deviceId: 'rose-window', preset: 'Bronze gong', params: { volume: -1 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.25 } }],
    preview: 'low',
  },
  // Petal basses: three petals, folded, dark.
  {
    id: 'rose-window-bass-folded',
    name: 'Folded petal bass',
    category: 'bass',
    description:
      'Three petals folded hard and curled into a round bass with a soft knock, short and nearly in the centre.',
    instrument: { deviceId: 'rose-window', preset: 'Petal bass', params: { volume: 2.7 } },
    effects: [{ deviceId: 'saturator', preset: 'Soft tape warmth' }],
  },
  {
    id: 'rose-window-bass-held-odd',
    name: 'Odd bass, held long',
    category: 'bass',
    description:
      'A held bass on odd harmonics with rings that open after the note, in a small dark room.',
    instrument: {
      deviceId: 'rose-window',
      preset: 'Petal bass',
      params: {
        volume: 1.8,
        petals: 4,
        strike: 0.15,
        light: 1500,
        fold: 0.35,
        curl: 0.1,
        heart: 0.5,
        attack: 0.15,
        release: 0.6,
        bloom: 2,
        tilt: 0.5,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.15 } }],
  },
  // Opening keys: the strike first, the rose after it.
  {
    id: 'rose-window-keys-late-window',
    name: 'Keys under a late window',
    category: 'keys',
    description:
      'A soft strike, and behind it a rose of odd harmonics that opens from its rim over two seconds, in a warm hall.',
    instrument: {
      deviceId: 'rose-window',
      preset: 'Opening keys',
      params: { width: 0.8, attack: 0.4, bloom: 2, volume: -2, strike: 0.35 },
    },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 2 } },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'rose-window-keys-noon',
    name: 'Noon keys in a chamber',
    category: 'keys',
    description:
      'Clear keys from a rose of three, folded by a hard touch, with a slow stereo tremor from side to side.',
    instrument: {
      deviceId: 'rose-window',
      preset: 'Opening keys',
      params: {
        volume: -0.9,
        petals: 3,
        order: 0,
        bloom: 1.5,
        strike: 0.8,
        decay: 3,
        fold: 0.4,
        curl: 0.25,
        light: 2600,
        rings: 4,
        heart: 0.6,
        attack: 0.1,
        release: 0.8,
      },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } },
    ],
  },
  // Still drones: no turn, deep in the stone.
  {
    id: 'rose-window-drone-in-stone',
    name: 'Drone kept in stone',
    category: 'drone',
    description:
      'A rose of three that does not turn, folded and curled, coloured by four tones of a stone frame, in a low cathedral.',
    instrument: {
      deviceId: 'rose-window',
      preset: 'Still drone',
      params: { width: 0.6, volume: -2.4, attack: 1.5, bloom: 4 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.25 } }],
  },
  {
    id: 'rose-window-drone-passing-light',
    name: 'Light crossing a floor',
    category: 'drone',
    description:
      'A low fifth held still while one ring of light travels out through its odd harmonics every four seconds.',
    instrument: {
      deviceId: 'rose-window',
      preset: 'Passing light',
      params: { volume: 1.5, bloom: 2.8, light: 5000, heart: 0.4, curl: 0, stone: 0.3, turn: 0 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } }],
  },
  // Whirling choirs: rings that turn against each other.
  {
    id: 'rose-window-choir-whirling',
    name: 'Choir of five, whirling',
    category: 'voice',
    description:
      'Five petals turning fast against each other with breath and a stone throat, like a choir in a round, in a cathedral.',
    instrument: {
      deviceId: 'rose-window',
      preset: 'Whirling choir',
      params: { volume: -11, attack: 0.8 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } }],
  },
  {
    id: 'rose-window-choir-closed-mouths',
    name: 'Closed mouths, far off',
    category: 'voice',
    description:
      'A darker, slower choir of three, curled into closed vowels and heard from the back of a hall.',
    instrument: {
      deviceId: 'rose-window',
      preset: 'Whirling choir',
      params: {
        volume: -8.4,
        petals: 3,
        turn: -0.5,
        light: 900,
        curl: 0.6,
        stone: 0.85,
        breath: 0.25,
        heart: 0.5,
        tilt: 0.6,
      },
    },
    effects: [{ deviceId: 'distance', preset: 'Back of the hall' }],
  },
  // Dust lace: pointed, all breath.
  {
    id: 'rose-window-lace-of-dust',
    name: 'Lace of lit dust',
    category: 'texture',
    description:
      'One bright ring of seven petals blown nearly to breath, turning slowly in a bright haze.',
    instrument: {
      deviceId: 'rose-window',
      preset: 'Dust lace',
      params: { volume: -9.3, attack: 1.2 },
    },
    effects: [
      { deviceId: 'fog', preset: 'Bright haze', params: { mix: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'rose-window-lace-broken-panes',
    name: 'Panes lit by turns',
    category: 'texture',
    description:
      'A broken rose of five whose panes light and go dark by turns under passing clouds, with faint glints behind.',
    instrument: {
      deviceId: 'rose-window',
      preset: 'Broken panes',
      params: { volume: -9, breath: 0.3 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Faint glints' },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },
]
