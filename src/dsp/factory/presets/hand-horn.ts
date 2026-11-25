import { type FactoryPreset } from '../types'

// The Hand Horn has a tube of one crook and a hand: a key the tube has is open
// and bright, any other is the next note above, stopped, and darker the further
// it was lowered. So which crook a preset is on is most of what it is, and the
// words here say which of the preview's notes are open and which are the
// hand's (the rule is `cpp/devices/hand-horn/ladder.h`; Lip is 35 cents where
// nothing else is said).

export const HAND_HORN_PRESETS: readonly FactoryPreset[] = [
  // A line of D, F and A on one crook after another: which of the three the hand is in, and how far, is the crook's to say.
  {
    id: 'hand-horn-into-the-shade',
    name: 'Into the shade',
    category: 'wind',
    description:
      'On the C crook a D is open, an F just under half stopped and an A over half: a line into the shade, in a hall.',
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Hand on the C crook',
      params: { shadow: 1, volume: -2.1 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall' }],
    preview: 'line',
  },
  {
    id: 'hand-horn-dark-middle',
    name: 'Dark middle note',
    category: 'wind',
    description:
      "On the D crook a D and an A are open and the F between them is the hand's: one dark note in a bright line, in a small plate.",
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Hand on the C crook',
      params: { crook: 2, shadow: 0.9, blow: 0.8, volume: -1.9 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate' }],
    preview: 'line',
  },
  {
    id: 'hand-horn-light-in-the-middle',
    name: 'Light in the middle',
    category: 'wind',
    description:
      'On the E flat crook D and A are nearly full in the hand and F is open: a line with its light in the middle, in a room.',
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Hand on the C crook',
      params: { crook: 3, shadow: 0.85, attack: 0.1, volume: -2.9 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room' }],
    preview: 'line',
  },
  {
    id: 'hand-horn-out-of-the-hand',
    name: 'Out of the hand',
    category: 'wind',
    description:
      'On the F crook D is stopped, F and A are open: the line opens its hand as it climbs, over a soft tape echo.',
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Crook in F',
      params: { shadow: 1, volume: -5.6 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
    preview: 'line',
  },
  {
    id: 'hand-horn-three-lit-notes',
    name: 'Three lit notes',
    category: 'wind',
    description:
      'On the G crook all three notes of D minor are open, the F lipped up and a little thin, in bright air.',
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Wide lips',
      params: { lip: 35, blow: 0.8, breath: 0.2, distance: 0.1, volume: -4.1 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Bright air' }],
    preview: 'line',
  },
  {
    id: 'hand-horn-behind-the-hand',
    name: 'Behind the hand',
    category: 'wind',
    description:
      'On the A flat crook D, F and A are all stopped: a small nasal horn that never opens, close up in a dark room.',
    instrument: { deviceId: 'hand-horn', preset: 'All in the hand', params: { volume: -0.8 } },
    effects: [{ deviceId: 'expanse', preset: 'Small dark room' }],
    preview: 'line',
  },
  // Two horns or three, set apart by their pitch.
  {
    id: 'hand-horn-two-horns-in-d',
    name: 'Two horns in D',
    category: 'wind',
    description:
      'A horn to each key on one D crook, low to the left, high to the right: D, A, C and E open, F in the hand, in a room.',
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Two horns apart',
      params: { crook: 2, blow: 0.75, volume: -6.9 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room' }],
    preview: 'keys',
  },
  {
    id: 'hand-horn-duo-on-the-f-crook',
    name: 'Duo on the F crook',
    category: 'wind',
    description:
      'Horns on the F crook set wide apart by their pitch: A, C, F and high E ring, D is in the hand, with one clean echo.',
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Crook in F',
      params: { spread: 1, release: 0.8, volume: -9.2 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Clean echo' }],
    preview: 'keys',
  },
  {
    id: 'hand-horn-half-handed-duo',
    name: 'Half handed duo',
    category: 'wind',
    description:
      'Hands half in: a stopped key sounds halfway from the nearest note of the tube to its own, up to a semitone off, in a chamber.',
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Half a hand',
      params: { crook: 4, spread: 1, release: 1.2, volume: -6.4 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber' }],
    preview: 'keys',
  },
  // Lip slides: one horn, and keys held into each other pass every note of the tube.
  {
    id: 'hand-horn-ladder-down-the-hall',
    name: 'Ladder down the hall',
    category: 'wind',
    description:
      'Hold C5, reach for C4: the lips go down the C crook note by note and rest on each, two seconds of rungs in a hall.',
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Ladder of a tenth',
      params: { slide: 2, attack: 0.05, breath: 0.2, volume: -0.6 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall' }],
    preview: 'keys',
  },
  {
    id: 'hand-horn-slurs-in-a-spring',
    name: 'Slurs in a spring',
    category: 'wind',
    description:
      "One bright horn in F whose overlapping keys slur over the tube's notes in an eighth of a second, in a spring tank.",
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Quick lip slurs',
      params: { slide: 0.125, volume: -4.1 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank' }],
    preview: 'keys',
  },
  {
    id: 'hand-horn-climb-into-the-dark',
    name: 'Climb into the dark',
    category: 'wind',
    description:
      'A soft horn on the low B flat tube that takes a second between held keys, rung by rung, into a very long dark space.',
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Slow climb at dusk',
      params: { crook: 0, slide: 1, attack: 0.3, distance: 0.3, volume: -3.1 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Long dark' }],
    preview: 'keys',
  },
  {
    id: 'hand-horn-rungs-on-tape',
    name: 'Rungs on tape',
    category: 'wind',
    description:
      'Half second slides on the alto C tube, where the rungs are a fourth to a whole step apart, caught by three tape heads.',
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Ladder of a tenth',
      params: { crook: 10, slide: 0.5, attack: 0.04, release: 0.4, breath: 0.3, volume: 0.5 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Three heads' }],
    preview: 'keys',
  },
  // Far horns.
  {
    id: 'hand-horn-valley-horn',
    name: 'Valley horn',
    category: 'wind',
    description:
      'A horn at the far end of an open valley: soft and dull, with every note answered long after it stops.',
    instrument: { deviceId: 'hand-horn', preset: 'Far horn', params: { volume: 2.0 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley' }],
    preview: 'line',
  },
  {
    id: 'hand-horn-over-the-lake',
    name: 'Over the lake',
    category: 'wind',
    description:
      'A call on the D crook across water with notes cut short, one slap back, and later echoes from the other shore.',
    instrument: { deviceId: 'hand-horn', preset: 'Across the water', params: { volume: 2.8 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 620, mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Far echoes' },
    ],
    preview: 'line',
  },
  {
    id: 'hand-horn-past-the-ridge',
    name: 'Past the ridge',
    category: 'wind',
    description:
      'A hunting horn over the ridge: no hand, a scooped start, and wide and blurred by the way it has come.',
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Hunting call',
      params: { release: 0.4, volume: -3.9 },
    },
    effects: [
      { deviceId: 'distance', preset: 'Far shore' },
      { deviceId: 'fdn-reverb', preset: 'Open valley' },
    ],
    preview: 'line',
  },
  {
    id: 'hand-horn-answered-from-afar',
    name: 'Answered from afar',
    category: 'wind',
    description:
      'A far horn on the A crook whose D and F are in the hand, and a second one that follows it like a round.',
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Far horn',
      params: { crook: 8, distance: 0.7, volume: 1.4 },
    },
    effects: [
      { deviceId: 'canon', preset: 'Faint answer' },
      { deviceId: 'hall-reverb', preset: 'Far away' },
    ],
    preview: 'line',
  },
  // Drones.
  {
    id: 'hand-horn-covered-fifth',
    name: 'Covered fifth',
    category: 'drone',
    description:
      'A low fifth on the A flat crook, both notes fully in the hand: no edge and no light, only a dark hum in a cathedral.',
    instrument: { deviceId: 'hand-horn', preset: 'Dark corner', params: { tremble: 0, volume: 6 } },
    effects: [{ deviceId: 'expanse', preset: 'Low cathedral' }],
    preview: 'low',
  },
  {
    id: 'hand-horn-half-lit-fifth',
    name: 'Half lit fifth',
    category: 'drone',
    description:
      'Two horns on one A crook hold a low fifth: A is open, D under it is fully in the hand and darker, on a wide dark plate.',
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Long swell',
      params: { attack: 1.2, shadow: 1, volume: 2.5 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate' }],
    preview: 'low',
  },
  {
    id: 'hand-horn-open-fifth-strings',
    name: 'Open fifth, strings',
    category: 'drone',
    description:
      'Two horns hold the low fifth that the D crook has open, partials two and three, with strings tuned to a minor key ringing along.',
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Basso crook',
      params: { crook: 2, attack: 0.6, release: 2, breath: 0.2, volume: -4.1 },
    },
    effects: [{ deviceId: 'sympathetic', preset: 'Minor strings' }],
    preview: 'low',
  },
  // Choirs.
  {
    id: 'hand-horn-choir-one-dark',
    name: 'Choir, one in the dark',
    category: 'pad',
    description:
      'Horns in D rise over a second: in a chord of D minor with a ninth every voice is open but the F, in a cathedral.',
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Long swell',
      params: { crook: 2, attack: 1, shadow: 1, blow: 0.7, volume: -8.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral' }],
    preview: 'chord',
  },
  {
    id: 'hand-horn-slow-hands-choir',
    name: 'Slow hands choir',
    category: 'pad',
    description:
      'A choir of hands that open and close together about once in two seconds: pitch and colour move as one, in open space.',
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Slow hand wave',
      params: { crook: 5, volume: -9.3 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space' }],
    preview: 'chord',
  },
  {
    id: 'hand-horn-partials-of-g',
    name: 'Partials of G',
    category: 'pad',
    description:
      'No hand at all: every key falls to the nearest note of the G tube, as sharp or flat as the tube has it, in a bright hall.',
    instrument: {
      deviceId: 'hand-horn',
      preset: 'Open tube only',
      params: { crook: 6, attack: 0.3, release: 1.5, blow: 0.6, volume: -9.1 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Bright hall' }],
    preview: 'chord',
  },
  // And a rough one.
  {
    id: 'hand-horn-rough-in-a-barn',
    name: 'Rough in a barn',
    category: 'wind',
    description:
      'Each note scoops up from the next lower note of the A tube with a crack on the way, in a slapping room.',
    instrument: { deviceId: 'hand-horn', preset: 'Rough start', params: { volume: 1.4 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Slap room' }],
    preview: 'line',
  },
]
