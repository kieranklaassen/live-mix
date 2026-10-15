import { type FactoryPreset } from '../types'

// Each preset is drawn from a row of the family's sources (rates and shapes the
// research uses, and places where an even pulse is already music) and says what
// is heard: the rate, the colour, the room. A pulse of ten a second or faster
// whose point is the silence between pulses stays dry or in a short room, since
// a long tail fills the gaps. Offset stays at 120 degrees or under, so a mono
// fold never loses the pulse.

export const ISOCHRONIC_PRESETS: readonly FactoryPreset[] = [
  // --- Rates and shapes the research uses ---
  {
    id: 'slow-wave-chord',
    name: 'Slow wave chord',
    category: 'pad',
    description:
      'A warm chord that swells and sinks back four times in five seconds, never quite to silence, in a hall.',
    instrument: { deviceId: 'isochronic', preset: 'Slow swell', params: { volume: -9.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'two-second-swell',
    name: 'Two second swell',
    category: 'pad',
    description:
      'A soft chord that comes once every two seconds and is gone for longer than it stays, ringing on in a long plate.',
    instrument: { deviceId: 'isochronic', preset: 'One in two seconds' },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
  },
  {
    id: 'three-a-second-pad',
    name: 'Three a second pad',
    category: 'pad',
    description:
      'A full chord switched on and off three times a second with soft edges, in a small room.',
    instrument: { deviceId: 'isochronic', preset: 'Three a second' },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } }],
  },
  {
    id: 'six-a-second-pad',
    name: 'Six a second pad',
    category: 'pad',
    description:
      'A warm chord pulsing six times a second, each pulse a little shorter than its gap, close up in a booth.',
    instrument: { deviceId: 'isochronic', preset: 'Six a second' },
    effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.1 } }],
  },
  {
    id: 'ten-a-second-close',
    name: 'Ten a second close',
    category: 'pad',
    description:
      'A chord of soft tones switched ten times a second with near silence between the pulses, in a small box.',
    instrument: { deviceId: 'isochronic', preset: 'Ten a second', params: { volume: -7 } },
    effects: [{ deviceId: 'expanse', preset: 'Small box', params: { mix: 0.06 } }],
  },
  {
    id: 'ten-in-noise',
    name: 'Ten in noise',
    category: 'texture',
    description:
      'A band of noise at the key chopped ten times a second, with a trace of a tight chamber around it.',
    instrument: { deviceId: 'isochronic', preset: 'Noise at ten' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.12 } }],
  },
  {
    id: 'fourteen-flutter',
    name: 'Fourteen flutter',
    category: 'pad',
    description:
      'Pure tones with noise in them fluttering fourteen times a second, with a short plate that fills the gaps only a little.',
    instrument: { deviceId: 'isochronic', preset: 'Fourteen a second' },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.12 } }],
  },
  {
    id: 'eighteen-light-hall',
    name: 'Eighteen light',
    category: 'pad',
    description:
      'A slow chord with a light flutter of eighteen a second that never drops to silence, in a hall.',
    instrument: { deviceId: 'isochronic', preset: 'Eighteen light' },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } }],
  },
  {
    id: 'forty-smooth-chord',
    name: 'Forty smooth',
    category: 'pad',
    description:
      'A chord broken into forty even pulses a second, on for half of each, dry over the faint hiss of a reel machine.',
    instrument: { deviceId: 'isochronic', preset: 'Forty smooth', params: { volume: -7 } },
    effects: [{ deviceId: 'tape', preset: 'Quarter inch' }],
  },
  {
    id: 'forty-clicks-keys',
    name: 'Forty clicks',
    category: 'keys',
    description:
      'Each key a train of forty short clicks of pure tone a second, hard edged, with a trace of a tight chamber.',
    instrument: { deviceId: 'isochronic', preset: 'Forty clicks', params: { volume: -3.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.1 } }],
  },
  {
    id: 'forty-in-noise-purr',
    name: 'Forty in noise',
    category: 'texture',
    description:
      'A band of noise at the key pulsing forty times a second, a purr at that pitch, with a little of a small dark room.',
    instrument: { deviceId: 'isochronic', preset: 'Forty in noise' },
    effects: [{ deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.08 } }],
  },
  // The glides take minutes: a preview hears only where each begins.
  {
    id: 'ten-down-to-six',
    name: 'Ten down to six',
    category: 'pad',
    description:
      'Tone and noise pulsing ten a second and slowing to six over ten minutes, the right ear a sixth of a pulse late.',
    instrument: { deviceId: 'isochronic', preset: 'Ten to six' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.2 } }],
  },
  {
    id: 'twelve-down-to-four',
    name: 'Twelve down to four',
    category: 'pad',
    description:
      'Bright short pulses that start at twelve a second and slow to four over fifteen minutes, with a trace of a plate.',
    instrument: { deviceId: 'isochronic', preset: 'Twelve to four', params: { volume: -4.5 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.08 } }],
  },
  {
    id: 'eleven-down-to-two',
    name: 'Eleven down to two',
    category: 'pad',
    description:
      'A slow chord whose pulse falls from eleven a second to two over twenty minutes, its gaps half filled by an open space.',
    instrument: { deviceId: 'isochronic', preset: 'Eleven to two', params: { volume: -7 } },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } }],
  },
  {
    id: 'eight-up-to-sixteen',
    name: 'Eight up to sixteen',
    category: 'pad',
    description:
      'A warm chord whose light pulse quickens from eight a second to sixteen over eight minutes, through a reel machine and a room.',
    instrument: { deviceId: 'isochronic', preset: 'Eight to sixteen', params: { volume: -7 } },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
    ],
  },
  {
    id: 'pulse-losing-pace',
    name: 'Pulse losing pace',
    category: 'pad',
    description:
      'One soft pulse a second of tone and noise that slows to four in five seconds over ten minutes, in a valley.',
    instrument: { deviceId: 'isochronic', preset: 'Slowing from one', params: { volume: -9 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.25 } }],
  },
  // --- Where an even pulse is already music ---
  {
    id: 'sixty-six-a-minute',
    name: 'Sixty six a minute',
    category: 'drone',
    description:
      'Low keys knocked sixty six times a minute, each knock short and round, in a room.',
    instrument: { deviceId: 'isochronic', preset: 'Sixty six a minute' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room' }],
  },
  {
    id: 'blip-each-second',
    name: 'Blip each second',
    category: 'pad',
    description:
      'A chord heard as one short blip a second, quarter notes at tempo 60, with an echo half a second after each.',
    instrument: { deviceId: 'isochronic', preset: 'One blip a second', params: { volume: -4.5 } },
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 500, mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'two-a-second-echo',
    name: 'Two a second echo',
    category: 'pad',
    description:
      'A warm chord on and off twice a second, quarter notes at tempo 120, with a dark echo that falls in the gaps.',
    instrument: { deviceId: 'isochronic', preset: 'Two a second' },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 250, mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'eight-short-keys',
    name: 'Eight short keys',
    category: 'keys',
    description:
      'Keys chopped into eight short bright notes a second, sixteenths at tempo 120, in a small plate.',
    instrument: { deviceId: 'isochronic', preset: 'Eight short', params: { volume: -3 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate' }],
  },
  {
    id: 'five-in-air-hall',
    name: 'Five in air',
    category: 'pad',
    description:
      'Tone and noise pulsing five a second, the right ear a quarter of a pulse behind; the hall blends the two ears.',
    instrument: { deviceId: 'isochronic', preset: 'Five and air' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.35 } }],
  },
  {
    id: 'low-hum-six',
    name: 'Low hum six',
    category: 'drone',
    description:
      'Low keys with all their warmth, pulsing six a second without falling silent, in a dark hall.',
    instrument: { deviceId: 'isochronic', preset: 'Warm for low keys' },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } }],
  },
  {
    id: 'low-hum-forty',
    name: 'Low hum forty',
    category: 'drone',
    description:
      'Low keys pulsed forty times a second, which lays a rough hum under them. Keys under 80 hertz sound an octave up.',
    instrument: { deviceId: 'isochronic', preset: 'Forty smooth', params: { warmth: 0.6 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.15 } }],
  },
  {
    id: 'ear-to-ear-chord',
    name: 'Ear to ear',
    category: 'pad',
    description:
      'On headphones a chord passes from the left ear to the right four times a second. Fifths and octaves suit it.',
    instrument: { deviceId: 'isochronic', preset: 'Left then right', params: { offset: 120 } },
    effects: [{ deviceId: 'tape', preset: 'Clean transfer' }],
  },
  {
    id: 'four-soft-organ',
    name: 'Four soft organ',
    category: 'organ',
    description:
      'A full warm chord with a soft pulse of four a second, eighth notes at tempo 120, through a slow rotary speaker.',
    instrument: {
      deviceId: 'isochronic',
      preset: 'Four soft',
      params: { warmth: 0.85, volume: -7.5 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Chorale' }],
  },
  {
    id: 'triplet-pulse-echo',
    name: 'Three to the second',
    category: 'pad',
    description:
      'Short pulses of tone and a little noise three to the second, triplets at tempo 60, with a warm repeat between them.',
    instrument: {
      deviceId: 'isochronic',
      preset: 'Three a second',
      params: { duty: 0.3, edge: 10, warmth: 0.2, air: 0.25 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Warm repeats', params: { time: 500, mix: 0.25 } }],
  },
  {
    id: 'six-in-a-long-plate',
    name: 'Six in a long plate',
    category: 'pad',
    description:
      'Mostly noise at the keys, pulsing six a second into a long plate that fills the gaps between pulses.',
    instrument: {
      deviceId: 'isochronic',
      preset: 'Six a second',
      params: { air: 0.7, depth: 0.8, volume: -5 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.4 } }],
  },
  {
    id: 'flutter-under-shimmer',
    name: 'Flutter and shimmer',
    category: 'pad',
    description:
      'A slow chord with a shallow flutter of ten a second, under a reverb whose tail climbs an octave.',
    instrument: {
      deviceId: 'isochronic',
      preset: 'Ten a second',
      params: { depth: 0.35, warmth: 0.5, attack: 1.5, release: 4, volume: -7.5 },
    },
    effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.3 } }],
  },
  {
    id: 'noise-knock-spring',
    name: 'Noise knock',
    category: 'texture',
    description:
      'A knock of noise at the key, sixty nine times a minute, each one splashing in a spring tank.',
    instrument: {
      deviceId: 'isochronic',
      preset: 'Sixty six a minute',
      params: { rate: 1.15, air: 1, duty: 0.15, edge: 5, volume: -4.5 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank' }],
  },
  {
    id: 'pulsed-reed-line',
    name: 'Pulsed line',
    category: 'wind',
    description:
      'One bright line with a soft pulse of six a second under it, sixteenths at tempo 90, in a room.',
    instrument: {
      deviceId: 'isochronic',
      preset: 'Three a second',
      params: {
        rate: 6,
        duty: 0.7,
        depth: 0.45,
        warmth: 1,
        attack: 0.08,
        release: 0.5,
        volume: -7,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } }],
  },
]
