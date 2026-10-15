import { type FactoryPreset } from '../types'

// Twin Bars strikes two bars a fixed number of hertz apart on every key, so
// what a chain does to the two sides decides where the beat is heard. An
// effect that sums its input (a hall, a plate, a spring) blends the two bars
// and the beat is in the air; tape, an echo with no spread, a veil of Fog and
// grains keep the sides apart and leave it between the ears. Ears is 0.8 at
// the most here, so a preset keeps some of its level in mono.
//
// The first fifteen take their rate from what has been studied (a slow beat
// under three hertz, three to four, six and ten a second); the second fifteen
// from where beating is already an instrument: paired metal bars, a struck
// bowl, glass, wooden bars, a beat in time with the piece, pure intervals,
// a room and a little noise.

export const TWIN_BARS_PRESETS: readonly FactoryPreset[] = [
  // A slow beat, half a hertz to two and a half: kept between the ears.
  {
    id: 'half-hertz-pair',
    name: 'Half hertz pair',
    category: 'bell',
    description:
      'On headphones a bright metal pair half a hertz apart moves from ear to ear once in two seconds. Speakers give a slow swell.',
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Half a hertz',
      params: { ears: 0.8, volume: -10 },
    },
    effects: [{ deviceId: 'tape', preset: 'Mastering deck' }],
  },
  {
    id: 'glass-sway',
    name: 'Glass sway',
    category: 'bell',
    description:
      'On headphones soft glass half a hertz apart sways slowly between the ears, behind a thin veil that keeps the two sides apart.',
    instrument: { deviceId: 'twin-bars', preset: 'Slow sway', params: { ears: 0.8, volume: -9 } },
    effects: [{ deviceId: 'fog', preset: 'Thin veil' }],
  },
  {
    id: 'one-hertz-long-metal',
    name: 'One hertz, long metal',
    category: 'bell',
    description:
      'On headphones a long metal pair one hertz apart turns between the ears once a second, with faint glints a twelfth above.',
    instrument: { deviceId: 'twin-bars', preset: 'One, long metal', params: { volume: -6.5 } },
    effects: [{ deviceId: 'grain-delay', preset: 'Faint glints' }],
  },
  {
    id: 'two-hertz-soft-wood',
    name: 'Two hertz, soft wood',
    category: 'bell',
    description:
      'On headphones soft wooden bars two hertz apart: a short hum that rocks between the ears twice a second, inside a wooden body.',
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Two, soft wood',
      params: { ears: 0.8, volume: -3 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Hint of wood' }],
  },
  {
    id: 'dark-metal-drift',
    name: 'Dark metal drift',
    category: 'bell',
    description:
      'On headphones dark metal under the softest mallet, the pair two and a half hertz apart, drifts between the ears, with one faint answer.',
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Dark soft metal',
      params: { ears: 0.8, volume: -5 },
    },
    effects: [{ deviceId: 'canon', preset: 'Faint answer' }],
  },
  // Three to four a second, as real swells.
  {
    id: 'four-swells-middle',
    name: 'Four swells, middle',
    category: 'bell',
    description:
      'Metal with both bars in the middle: every note swells four times a second, on speakers as on headphones, in a hall.',
    instrument: { deviceId: 'twin-bars', preset: 'Four a second', params: { ears: 0, volume: -5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall' }],
  },
  {
    id: 'stopped-glass-four',
    name: 'Stopped glass, four',
    category: 'bell',
    description:
      'Bright glass four hertz apart, stopped when the key is let go: short notes that swell once or twice, in a small plate.',
    instrument: { deviceId: 'twin-bars', preset: 'Damped glass', params: { volume: -5 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate' }],
  },
  {
    id: 'wood-hum-three',
    name: 'Wood hum, three',
    category: 'bell',
    description:
      'Soft mallets on wood three hertz apart: a dark hum that swells three times a second, close up in a tight chamber.',
    instrument: { deviceId: 'twin-bars', preset: 'Soft wood hum', params: { volume: -4 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber' }],
  },
  {
    id: 'short-metal-three',
    name: 'Short metal, three',
    category: 'bell',
    description:
      'Hard mallets on short metal bars three hertz apart: each note swells three times a second as it dies, in a spring tank.',
    instrument: { deviceId: 'twin-bars', preset: 'Three, short', params: { volume: -8 } },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank' },
    ],
  },
  // Six a second, between the ears and in the air.
  {
    id: 'six-ear-to-ear',
    name: 'Six, ear to ear',
    category: 'bell',
    description:
      'On headphones soft metal six hertz apart, one bar mostly in each ear, so the flutter is made between the ears. Dry, on tape.',
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Six, one an ear',
      params: { ears: 0.8, volume: -5 },
    },
    effects: [{ deviceId: 'tape', preset: 'Quarter inch' }],
  },
  {
    id: 'six-in-the-air',
    name: 'Six in the air',
    category: 'bell',
    description:
      'Metal six hertz apart with both bars in the middle: six real swells a second that speakers carry too, in a dark hall.',
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Six, one an ear',
      params: { ears: 0, volume: -4 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall' }],
  },
  {
    id: 'bright-glass-five',
    name: 'Bright glass, five',
    category: 'bell',
    description:
      'The hardest mallet on glass five hertz apart: a bright ring that trembles five times a second, in bright air that blends the bars.',
    instrument: { deviceId: 'twin-bars', preset: 'Bright glass', params: { volume: -6.5 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Bright air' }],
  },
  // Ten a second and over: real pulsing, both bars in the middle or near it.
  {
    id: 'ten-glass-in-the-air',
    name: 'Ten, glass in the air',
    category: 'bell',
    description:
      'Glass ten hertz apart with both bars in the middle: a real flutter of ten a second, on speakers too, in a bright hall.',
    instrument: { deviceId: 'twin-bars', preset: 'Ten in the air', params: { volume: -5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Bright hall' }],
  },
  {
    id: 'ten-wood-in-the-air',
    name: 'Ten, wood in the air',
    category: 'bell',
    description:
      'Wooden bars ten hertz apart, both in the middle: a knock, then a hum that flutters ten times a second, in a room.',
    instrument: { deviceId: 'twin-bars', preset: 'Ten, wood in air', params: { volume: -2 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room' }],
  },
  {
    id: 'twelve-fine-flutter',
    name: 'Twelve, fine flutter',
    category: 'bell',
    description:
      'Glass twelve hertz apart, half way between the ears and the middle: a fine quick flutter on each note, in a bright plate.',
    instrument: { deviceId: 'twin-bars', preset: 'Twelve, glass', params: { volume: -4.5 } },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
      { deviceId: 'ambient-limiter', preset: 'Loud', params: { gain: 4 } },
    ],
  },
  // Paired metal bars: the same hertz from the lowest key to the highest.
  {
    id: 'paired-metal-bars',
    name: 'Paired metal bars',
    category: 'bell',
    description:
      'Paired metal bars seven hertz apart on every key, low or high: a quick shimmer on each note, in a room.',
    instrument: { deviceId: 'twin-bars', preset: 'Seven, paired', params: { volume: -6 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room' }],
  },
  {
    id: 'hard-pair-eight',
    name: 'Hard pair, eight',
    category: 'bell',
    description:
      'The hardest mallet on bright metal bars eight hertz apart: a knock and a fast shimmer that rings out over an open valley.',
    instrument: { deviceId: 'twin-bars', preset: 'Eight, hard', params: { volume: -9 } },
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Open valley' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 5.5 } },
    ],
  },
  {
    id: 'one-rate-low-to-high',
    name: 'One rate, low to high',
    category: 'keys',
    description:
      'A broken chord on metal bars six hertz apart, each pair struck 40 ms apart: the low keys shimmer at the same rate as the high.',
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Scattered metal',
      params: { ears: 0.8, volume: -6 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Room' }],
  },
  // A struck bowl: every partial a pair a few hertz apart, long and soft.
  {
    id: 'metal-bowl-slow-pair',
    name: 'Metal bowl, slow pair',
    category: 'bell',
    description:
      'A soft mallet on metal, each tone a pair one and a half hertz apart that rings for sixteen seconds, in a warm hall.',
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Slow metal bowl',
      params: { ears: 0.6, volume: -5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow' }],
  },
  {
    id: 'bowl-and-strings',
    name: 'Bowl and strings',
    category: 'bell',
    description:
      'A struck bowl whose pairs lie four hertz apart, long and soft, with strings tuned to C major that ring along with every note.',
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Four a second',
      params: { mallet: 0.1, decay: 14, damp: 0, tone: 0.4, volume: -3 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Long ring' }],
  },
  // Glass: a slow beat and a very long ring.
  {
    id: 'glass-bowl-long-ring',
    name: 'Glass bowl, long ring',
    category: 'bell',
    description:
      'A soft mallet on glass, the pair one hertz apart, ringing twenty seconds in a long plate that blends the two bars.',
    instrument: { deviceId: 'twin-bars', preset: 'Glass bowl', params: { ears: 0.6, volume: -9 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate' }],
  },
  {
    id: 'glass-in-the-middle',
    name: 'Glass in the middle',
    category: 'bell',
    description:
      'Glass with both bars in the middle, two hertz apart: a slow clear swell twice a second, on speakers too, with an airy tail.',
    instrument: { deviceId: 'twin-bars', preset: 'Glass, middle', params: { volume: -6 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail' }],
  },
  // Wooden bars: a knock, a short hum and a quick flutter as it dies.
  {
    id: 'wooden-bars-flutter',
    name: 'Wooden bars, flutter',
    category: 'bell',
    description:
      'Wooden bars nine hertz apart: a knock, then a short hum that flutters quickly as it dies, in a tight room.',
    instrument: { deviceId: 'twin-bars', preset: 'Wood flutter', params: { volume: -4 } },
    effects: [
      { deviceId: 'plate-reverb', preset: 'Tight room' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 5 } },
    ],
  },
  {
    id: 'dry-wood-knock',
    name: 'Dry wood knock',
    category: 'bell',
    description:
      'The hardest mallet on wood, six hertz apart and near the middle: a dry knock with a flutter under it, warmed by tape.',
    instrument: { deviceId: 'twin-bars', preset: 'Wood knock' },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 10 } },
    ],
  },
  {
    id: 'flam-on-wood',
    name: 'Flam on wood',
    category: 'bell',
    description:
      'Each wooden pair is struck as a flam, 25 ms apart, with five hertz between the bars, in a small booth.',
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Flam of wood',
      params: { ears: 0.8, volume: -6.5 },
    },
    effects: [
      { deviceId: 'ether-reverb', preset: 'Small booth' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
    ],
  },
  // A beat in time with the piece: the rate is the tempo over sixty, times a whole number.
  {
    id: 'in-time-at-sixty',
    name: 'In time at sixty',
    category: 'bell',
    description:
      'Metal four hertz apart with an echo every half second: two swells to each echo, in time with a piece at 60 or 120 a minute.',
    instrument: { deviceId: 'twin-bars', preset: 'Four a second', params: { volume: -4.5 } },
    effects: [{ deviceId: 'tape-echo', preset: 'Clean and steady', params: { time: 500 } }],
  },
  {
    id: 'in-time-at-ninety',
    name: 'In time at ninety',
    category: 'bell',
    description:
      'Metal six hertz apart with an echo every two thirds of a second: four swells to each echo, in time at ninety a minute.',
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Seven, paired',
      params: { beat: 6, volume: -6.5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 667 } },
      { deviceId: 'ambient-limiter', preset: 'Late night', params: { gain: 3 } },
    ],
  },
  {
    id: 'sixteen-rough-edge',
    name: 'Sixteen, rough edge',
    category: 'bell',
    description:
      'Metal sixteen hertz apart, too quick to count: a rough edge on each note, with an echo every quarter second, in time at 120.',
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Twenty, rough',
      params: { beat: 16, volume: -5 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 250 } }],
  },
  // Pure intervals: keys that do not beat on their own leave the device's beat alone.
  {
    id: 'low-fifth-slow-swell',
    name: 'Low fifth, slow swell',
    category: 'drone',
    description:
      'For fifths, fourths and octaves low down: such keys do not beat on their own, so only the swell of two a second moves.',
    instrument: {
      deviceId: 'twin-bars',
      preset: 'One, long metal',
      params: { beat: 2, ears: 0.4, volume: -6.5 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave' }],
  },
  // A room and a little noise.
  {
    id: 'bars-over-room-noise',
    name: 'Bars over room noise',
    category: 'bell',
    description:
      'Soft metal four hertz apart over a little room noise in a cathedral, which blends the two bars so the beat is in the air.',
    instrument: {
      deviceId: 'twin-bars',
      preset: 'Four a second',
      params: { mallet: 0.3, tone: 0.4, ears: 0.4, volume: -5 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Empty room', params: { width: 0.4 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
  },
]
