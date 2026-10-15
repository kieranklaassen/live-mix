import { type FactoryPreset } from '../types'

// Still Point holds keys as steady tones and sends one sine slowly through
// them. Every preset here comes from a row of the beat and breath family's
// sources (S for the science rows, M for the music rows) or from a plain
// musical use, named in the comment over it. A reverb sums both sides, so a preset whose point is the
// split between the ears has only effects that keep the sides apart (an EQ, a
// tape, a noise bed, an echo), or says that its room blends them. No preset
// puts Ears over 0.8, and none with Ears under a half has a sine louder than
// 0.75 of a key over tones purer than Warmth 0.45.

export const STILL_POINT_PRESETS: readonly FactoryPreset[] = [
  // M7, a sweep through held tones.
  {
    id: 'still-point-fifth-pass',
    name: 'Sine through a fifth',
    category: 'drone',
    description:
      'A sine climbs through a low fifth in half a minute. Its beat with each key slows to nothing as they meet, in a hall.',
    instrument: { deviceId: 'still-point', preset: 'Half minute pass', params: { volume: -8 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'still-point-minute-chord',
    name: 'Minute across a chord',
    category: 'pad',
    description:
      'A sine takes a minute to cross a held chord, beating slower and then faster against each note in turn, in a long plate.',
    instrument: { deviceId: 'still-point', preset: 'One minute pass', params: { volume: -7.5 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
  },
  {
    id: 'still-point-two-minute-drone',
    name: 'Two minute crossing',
    category: 'drone',
    description:
      'A soft sine takes two minutes to pass a slow warm drone, two semitones past each end, on tape in an open space.',
    instrument: { deviceId: 'still-point', preset: 'Two minute pass', params: { volume: -7 } },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'still-point-one-key-crossed',
    name: 'One key crossed',
    category: 'drone',
    description:
      'One pure key and a pure sine that takes 45 seconds to pass it. The beat between them falls still halfway, in a small room.',
    instrument: { deviceId: 'still-point', preset: 'Pure crossing', params: { volume: -4.5 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Room' }],
    preview: 'hold',
  },
  {
    id: 'still-point-warm-chord-crossed',
    name: 'Warm chord crossed',
    category: 'pad',
    description:
      'Full warm tones with a sine that crosses them in 40 seconds, a semitone and a half past each end, in a dark hall.',
    instrument: { deviceId: 'still-point', preset: 'Warm crossing', params: { volume: -7 } },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } },
    ],
  },
  // M8, a near-unison drone: the sine stays a fraction of a semitone from the keys.
  {
    id: 'still-point-near-unison',
    name: 'Near unison drone',
    category: 'drone',
    description:
      'Pure low tones and a sine a tenth of a semitone past them that takes two minutes to cross, with faint hiss and a halo of hall.',
    instrument: { deviceId: 'still-point', preset: 'Near unison', params: { volume: -8 } },
    effects: [
      { deviceId: 'noise-floor', preset: 'Faint hiss' },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'still-point-deep-slow-wave',
    name: 'Deep slow wave',
    category: 'drone',
    description:
      'A low drone that swells and sinks under once a second as a strong sine drifts a fifth of a semitone past it, thick with tape.',
    instrument: {
      deviceId: 'still-point',
      preset: 'Deep slow beat',
      params: { level: 0.7, volume: -10.5 },
    },
    effects: [{ deviceId: 'tape', preset: 'Warm thump' }],
  },
  {
    id: 'still-point-faint-waver',
    name: 'Faint slow waver',
    category: 'drone',
    description:
      'A warm drone with a faint sine close under its lowest tone, a slow waver that takes a minute and a half to cross, in a plate.',
    instrument: { deviceId: 'still-point', preset: 'Faint slow beat', params: { volume: -4 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.2 } }],
  },
  {
    id: 'still-point-slow-bloom',
    name: 'Slow bloom of tones',
    category: 'drone',
    description:
      'Full tones that take ten seconds to arrive and twelve to leave, a strong sine beating slowly close by, in a wide open reverb.',
    instrument: { deviceId: 'still-point', preset: 'Soft bloom', params: { volume: -4.5 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
  },
  {
    id: 'still-point-unison-nave',
    name: 'Unison in a nave',
    category: 'drone',
    description:
      'One warm key and a sine within an eighth of a semitone of it, the beat never over two a second, held in a very long hall.',
    instrument: {
      deviceId: 'still-point',
      preset: 'Near unison',
      params: { time: 90, reach: 0.12, warmth: 0.5, release: 10, volume: -7.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.35 } }],
    preview: 'hold',
  },
  // M10, pure intervals: keys a fifth, a fourth or an octave apart do not beat
  // with each other, so the sine's beat is the only one.
  {
    id: 'still-point-still-fifth',
    name: 'Fifth standing still',
    category: 'drone',
    description:
      'Hold a fifth, a fourth or an octave: the keys stand still together and only the sine, a pass in 20 seconds, beats, in a hall.',
    instrument: { deviceId: 'still-point', preset: 'Slow swell', params: { volume: -3 } },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Drone' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'still-point-even-match',
    name: 'Sine as loud as a key',
    category: 'drone',
    description:
      'Hold a fifth: a sine as loud as one key crosses in twelve seconds, and the pure part of each key fades where they meet.',
    instrument: { deviceId: 'still-point', preset: 'Even match' },
    effects: [
      { deviceId: 'tamer', preset: 'Gentle' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'still-point-octaves-ringing',
    name: 'Octaves ringing on',
    category: 'drone',
    description:
      'For octaves and fifths: tones that speak at once and ring for fifteen seconds while the sine beats on, in a cathedral.',
    instrument: { deviceId: 'still-point', preset: 'Long tail', params: { volume: -7.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } }],
  },
  // M12, a room and a little noise.
  {
    id: 'still-point-room-and-hiss',
    name: 'Room and hiss',
    category: 'drone',
    description:
      'A sine passing through a low fifth in half a minute with hiss underneath, and a room that blends tones and hiss together.',
    instrument: {
      deviceId: 'still-point',
      preset: 'Half minute pass',
      params: { warmth: 0.5, attack: 2, release: 5, volume: -5 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Tape floor' },
      { deviceId: 'ether-reverb', preset: 'Ether' },
    ],
  },
  {
    id: 'still-point-empty-room',
    name: 'Empty room drone',
    category: 'drone',
    description:
      'A warm low drone and a soft sine a minute in passing, with the rumble of an empty room and its short reverb around them.',
    instrument: {
      deviceId: 'still-point',
      params: {
        time: 60,
        reach: 0.5,
        level: 0.4,
        warmth: 0.7,
        attack: 2.5,
        release: 8,
        volume: -7.5,
      },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Empty room' },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  // S9, carriers between the ears: keys from 100 to 500 Hz with Ears up, and
  // nothing after them that sums the two sides unless the words say so.
  {
    id: 'still-point-key-left-sine-right',
    name: 'Key left sine right',
    category: 'drone',
    description:
      'For keys from 100 to 300 hertz. On headphones the key leans left and the sine right, the beat between the ears, over muffled hiss.',
    instrument: {
      deviceId: 'still-point',
      preset: 'Sine in one ear',
      params: { ears: 0.8 },
    },
    effects: [{ deviceId: 'noise-floor', preset: 'Muffled hiss', params: { level: -40 } }],
    preview: 'hold',
  },
  {
    id: 'still-point-split-pure-line',
    name: 'Split pure line',
    category: 'wind',
    description:
      'For a line from 300 to 500 hertz. On headphones the pure line leans left and a pure sine right, in an echo that keeps them apart.',
    instrument: {
      deviceId: 'still-point',
      preset: 'Split and pure',
      params: { ears: 0.75, attack: 0.3, release: 1.5, volume: -8 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded' },
      { deviceId: 'analog-delay', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'still-point-full-chord-split',
    name: 'Full chord split',
    category: 'pad',
    description:
      'On headphones a full chord leans left and a sine three semitones past it leans right, each side on its own track of tape.',
    instrument: { deviceId: 'still-point', preset: 'Full and split', params: { volume: -8 } },
    effects: [{ deviceId: 'tape', preset: 'Mastering deck' }],
  },
  {
    id: 'still-point-warm-key-split',
    name: 'Warm key slow split',
    category: 'drone',
    description:
      'On headphones a full warm key leans left while the sine takes 50 seconds to pass it on the right. No room, so they stay apart.',
    instrument: {
      deviceId: 'still-point',
      preset: 'Slow split pass',
      params: { ears: 0.8, volume: -6.5 },
    },
    effects: [{ deviceId: 'ambient-eq', preset: 'Warm' }],
    preview: 'hold',
  },
  {
    id: 'still-point-chord-over-rumble',
    name: 'Split over a rumble',
    category: 'pad',
    description:
      'On headphones a nearly pure chord leans left and the sine right, a pass each half minute, over a low rumble of noise.',
    instrument: {
      deviceId: 'still-point',
      params: { time: 30, reach: 1, ears: 0.7, warmth: 0.15, attack: 2, release: 4, volume: -8 },
    },
    effects: [{ deviceId: 'noise-floor', preset: 'Distant rumble', params: { level: -34 } }],
  },
  {
    id: 'still-point-thin-veil-split',
    name: 'Fifth under a veil',
    category: 'drone',
    description:
      'A full low fifth with the sine a little to the right of it, a pass in 50 seconds, under a veil of reverb too thin to blend them.',
    instrument: { deviceId: 'still-point', preset: 'Slow split pass', params: { volume: -7 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Thin veil' }],
  },
  {
    id: 'still-point-split-in-a-cathedral',
    name: 'Split in a cathedral',
    category: 'pad',
    description:
      'The keys lean left and the sine right, but the cathedral after them blends both sides, so the beat is in the air again.',
    instrument: { deviceId: 'still-point', preset: 'Half split', params: { volume: -7.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } }],
  },
  // Plain musical uses: the same tones played as notes, lines and short chords.
  {
    id: 'still-point-fifth-beyond',
    name: 'Sine a fifth beyond',
    category: 'pad',
    description:
      'A sine that swings from a fifth under the chord to a fifth over it in half a minute, a little apart in the ears, in a bright hall.',
    instrument: { deviceId: 'still-point', preset: 'Fifth reach', params: { volume: -6.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.25 } }],
  },
  {
    id: 'still-point-octave-beyond',
    name: 'Sine an octave beyond',
    category: 'drone',
    description:
      'A sine that swings from an octave under the key to an octave over it in 24 seconds: the beat races to a hum and comes back slow.',
    instrument: { deviceId: 'still-point', preset: 'Octave reach', params: { volume: -8.5 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Late hall' }],
    preview: 'hold',
  },
  {
    id: 'still-point-worn-tones',
    name: 'Worn full tones',
    category: 'pad',
    description:
      'Full tones and a slow sine on a worn cassette, its wow and hiss lying over the beat, in a small room.',
    instrument: {
      deviceId: 'still-point',
      params: { time: 16, warmth: 1, attack: 0.8, volume: -6.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'still-point-quick-sweep-keys',
    name: 'Quick sweep keys',
    category: 'keys',
    description:
      'Notes that speak in a fifth of a second while the sine sweeps the whole chord every four seconds, with an echo in a room.',
    instrument: { deviceId: 'still-point', preset: 'Quick sweep' },
    effects: [
      { deviceId: 'analog-delay', params: { mix: 0.25 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'still-point-line-wide-sine',
    name: 'Line and a wide sine',
    category: 'wind',
    description:
      'A pure line with a sine that swings a major third above and below it every ten seconds, fast beats and slow, in a small plate.',
    instrument: { deviceId: 'still-point', preset: 'Third each side', params: { volume: -4 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate' }],
  },
  {
    id: 'still-point-full-short-chords',
    name: 'Full short chords',
    category: 'organ',
    description:
      'Full tones that start and stop at once with a faint sine sweeping under them every eight seconds, in a spring reverb.',
    instrument: { deviceId: 'still-point', preset: 'Full short tones', params: { volume: -7 } },
    effects: [{ deviceId: 'spring-reverb' }],
  },
  {
    id: 'still-point-short-tones-echo',
    name: 'Short tones and echo',
    category: 'bell',
    description:
      'Short plain tones, each shadowed by a sine that slides across a semitone away, repeated by an echo into a plate.',
    instrument: {
      deviceId: 'still-point',
      preset: 'Short tones',
      params: { release: 0.6, volume: 0 },
    },
    effects: [
      { deviceId: 'tape-echo', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'still-point-low-notes-shadow',
    name: 'Shadowed low notes',
    category: 'bass',
    description:
      'Low warm notes with a soft sine a semitone off that slides through each, a flutter that slows and quickens, in a tight chamber.',
    instrument: {
      deviceId: 'still-point',
      params: { time: 8, reach: 1, level: 0.4, warmth: 0.7, attack: 0.03, release: 0.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber' }],
  },
]
