import { type FactoryPreset } from '../types'

// Each key is a pair of tones a few hertz apart. A bank preset keeps Ears at
// 0.8 or under, so a little of each tone is in the other ear and the bank's
// width rule holds, and Bed at 0.5 or under, so the output stays below the
// soft clip's knee. A reverb sums what it is fed: where the point is the beat
// between the two ears the chain keeps the sides apart, and where a room
// follows the description says that it blends them.
//
// The first fifteen take their rates and shapes from what the research on
// beats has used (slow movement, three to four, six, ten, sixteen and forty a
// second, the carriers, the glides, the noise colours); the second fifteen
// from where beating is already an instrument (paired bars, a detuned rank,
// two strings of one note, the near unison, a beat in time with the piece, a
// pure interval, a low hum, a room and a little noise).

export const BINAURAL_PRESETS: readonly FactoryPreset[] = [
  {
    id: 'binaural-pair-six-apart',
    name: 'Pair six apart',
    category: 'pad',
    description:
      'On headphones each key of a chord is a pair of warm tones six hertz apart, with only a warm tilt, so the two ears stay apart.',
    instrument: { deviceId: 'binaural', preset: 'Six a second', params: { ears: 0.8, volume: -3 } },
    effects: [{ deviceId: 'ambient-eq', preset: 'Warm' }],
  },
  {
    id: 'binaural-pair-over-pink',
    name: 'Pair over pink',
    category: 'pad',
    description:
      'A pair of warm tones six hertz apart over a bed of pink noise, in a hall that blends the two ears a little.',
    instrument: {
      deviceId: 'binaural',
      preset: 'Pink bed, six',
      params: { ears: 0.7, bed: 0.45, volume: -1.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'binaural-slow-crossed-pair',
    name: 'Slow crossed pair',
    category: 'pad',
    description:
      'Each ear holds two tones two hertz apart and swells twice a second, while the ears differ by one hertz, under a faint plate.',
    instrument: { deviceId: 'binaural', preset: 'Slow cross', params: { ears: 0.8, volume: 0.5 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Faint sheen' }],
  },
  {
    id: 'binaural-pair-over-brown',
    name: 'Pair over brown',
    category: 'drone',
    description:
      'Soft low pairs two hertz apart turning over a bed of brown noise, in a hall with a long low tail that blends the ears.',
    instrument: {
      deviceId: 'binaural',
      preset: 'Brown bed, slow',
      params: { ears: 0.6, bed: 0.4, volume: -1.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.2 } }],
  },
  {
    id: 'binaural-pair-three-apart',
    name: 'Pair three apart',
    category: 'pad',
    description:
      'On headphones a pair of round tones three hertz apart sways between the ears on every key, through quarter inch tape.',
    instrument: {
      deviceId: 'binaural',
      preset: 'Three a second',
      params: { ears: 0.8, volume: -1.5 },
    },
    effects: [{ deviceId: 'tape', preset: 'Quarter inch' }],
  },
  {
    id: 'binaural-four-apart-in-air',
    name: 'Four apart in air',
    category: 'pad',
    description:
      'Both tones in both ears: a chord that swells four times a second in the air, the same on speakers and headphones, in a hall.',
    instrument: { deviceId: 'binaural', preset: 'Four in the air', params: { volume: -0.5 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'binaural-widening-pair',
    name: 'Widening pair',
    category: 'pad',
    description:
      'A bright pair that starts eight hertz apart and widens to sixteen over eight minutes, smooth then rough, on tape in a small plate.',
    instrument: { deviceId: 'binaural', preset: 'Eight to sixteen', params: { volume: -1.3 } },
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { output: 2.7 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'binaural-pair-over-white',
    name: 'Pair over white',
    category: 'pad',
    description:
      'Both tones in both ears ten hertz apart, a fast flutter in the air over a thin bed of white noise, in a dark plate.',
    instrument: { deviceId: 'binaural', preset: 'White bed, ten', params: { volume: 0 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } }],
  },
  {
    id: 'binaural-rough-pair',
    name: 'Rough pair',
    category: 'keys',
    description:
      'Notes with full partials whose pairs stand sixteen hertz apart: a rough buzz half in the air, pushed into hot tape.',
    instrument: { deviceId: 'binaural', preset: 'Rough sixteen', params: { volume: 0 } },
    effects: [
      { deviceId: 'tape', preset: 'Hot glue' },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'binaural-forty-apart-in-air',
    name: 'Forty apart in air',
    category: 'pad',
    description:
      'Two bare tones forty hertz apart in both ears: a fast even buzz in the air under every key, in a short room.',
    instrument: { deviceId: 'binaural', preset: 'Forty in the air', params: { volume: -2 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience' }],
  },
  {
    id: 'binaural-forty-crossed',
    name: 'Forty crossed',
    category: 'pad',
    description:
      'On headphones each ear holds two tones forty hertz apart and buzzes at forty while the ears differ by twenty, with a faint halo.',
    instrument: {
      deviceId: 'binaural',
      preset: 'Forty crossed',
      params: { ears: 0.8, volume: 1.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Faint halo' }],
  },
  {
    id: 'binaural-low-bare-pair',
    name: 'Low bare pair',
    category: 'drone',
    description:
      'On headphones two low keys as bare pairs five hertz apart, between 100 and 300 hertz where a pair is soft and round, in faint air.',
    instrument: { deviceId: 'binaural', preset: 'Bare pair', params: { ears: 0.7, volume: -1.5 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Faint air' }],
  },
  {
    id: 'binaural-clear-pair',
    name: 'Clear pair',
    category: 'pad',
    description:
      'On headphones a bare pair five hertz apart for one line of notes; the two-ear beat is clearest on keys near the A above middle C.',
    instrument: {
      deviceId: 'binaural',
      preset: 'Bare pair',
      params: { ears: 0.8, attack: 0.3, release: 1.2, volume: -3 },
    },
    effects: [{ deviceId: 'ambient-eq', preset: 'Keys' }],
    preview: 'line',
  },
  {
    id: 'binaural-narrowing-pair',
    name: 'Narrowing pair',
    category: 'pad',
    description:
      'A pair that starts ten hertz apart and narrows to six over ten minutes, over a soft pink bed, in a dark hall that blends the ears.',
    instrument: {
      deviceId: 'binaural',
      preset: 'Ten down to six',
      params: { ears: 0.8, volume: -1.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.25 } }],
  },
  {
    id: 'binaural-opening-pair',
    name: 'Opening pair',
    category: 'pad',
    description:
      'A pair half a hertz apart that opens to three hertz in the first minute, a slow turn quickening over a dark bed, behind a thin veil.',
    instrument: {
      deviceId: 'binaural',
      preset: 'Rising to three',
      params: { ears: 0.7, volume: -4 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Thin veil' }],
  },
  // --- Where beating is already an instrument ---
  {
    id: 'binaural-struck-pairs-seven',
    name: 'Struck pairs, seven',
    category: 'bell',
    description:
      'Struck notes in pairs seven hertz apart, the same shimmer on low keys and high, ringing four seconds in a bright plate.',
    instrument: {
      deviceId: 'binaural',
      preset: 'Bars seven apart',
      params: { ears: 0.8, volume: 2 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } }],
  },
  {
    id: 'binaural-struck-pairs-nine',
    name: 'Struck pairs, nine',
    category: 'keys',
    description:
      'Short struck notes full of partials, each a pair nine hertz apart half in the air: a fast metal shimmer with a hint of spring.',
    instrument: {
      deviceId: 'binaural',
      preset: 'Bars seven apart',
      params: { beat: 9, ears: 0.5, warmth: 0.9, release: 1.6, volume: -0.5 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Hint of spring' }],
  },
  {
    id: 'binaural-detuned-rank',
    name: 'Detuned rank',
    category: 'organ',
    description:
      'Two ranks of full pipes a hertz and a half apart in both ears: a slow wave in the air on every chord, in a cathedral.',
    instrument: { deviceId: 'binaural', preset: 'Detuned rank', params: { volume: -0.5 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } }],
  },
  {
    id: 'binaural-soft-rank-wave',
    name: 'Soft rank wave',
    category: 'organ',
    description:
      'Two soft ranks one hertz apart for low keys, rising and falling once a second in the air, with an octave above in a long nave.',
    instrument: {
      deviceId: 'binaural',
      preset: 'Detuned rank',
      params: { beat: 1, warmth: 0.6, attack: 0.6, release: 2.5, volume: -3 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'binaural-two-strings',
    name: 'Two strings',
    category: 'plucked',
    description:
      'Two strings of one note a hertz apart, struck and left to ring nine seconds in the air, with strings that ring in sympathy.',
    instrument: { deviceId: 'binaural', preset: 'Two strings', params: { volume: -3 } },
    effects: [{ deviceId: 'sympathetic', preset: 'Piano pedal', params: { mix: 0.3 } }],
  },
  {
    id: 'binaural-two-slow-strings',
    name: 'Two slow strings',
    category: 'string',
    description:
      'A single line on two strings half a hertz apart, eased in and let fall for six seconds, the slow wave in the air of a long spring.',
    instrument: {
      deviceId: 'binaural',
      preset: 'Two strings',
      params: { beat: 0.5, warmth: 0.5, attack: 0.4, release: 6, volume: -5 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } }],
    preview: 'line',
  },
  {
    id: 'binaural-near-unison-pair',
    name: 'Near unison pair',
    category: 'drone',
    description:
      'Two tones half a hertz apart on each low key, kept soft, turning once in two seconds in a dark hall without end.',
    instrument: { deviceId: 'binaural', preset: 'Near unison', params: { ears: 0.8, volume: -4 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Dark infinite' }],
  },
  {
    id: 'binaural-unison-in-the-air',
    name: 'Unison in the air',
    category: 'pad',
    description:
      'A chord of near unisons under a hertz apart in both ears, swelling and thinning in the air every second or so, in open space.',
    instrument: {
      deviceId: 'binaural',
      preset: 'Near unison',
      params: { ears: 0, beat: 0.8, warmth: 0.3, attack: 3, volume: -3 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } }],
  },
  {
    id: 'binaural-pair-in-time-four',
    name: 'Pair in time, four',
    category: 'keys',
    description:
      'Four swells a second in the air with an echo each half second: sixteenths at sixty to the minute, eighths at 120.',
    instrument: {
      deviceId: 'binaural',
      preset: 'Four in the air',
      params: { warmth: 0.6, attack: 0.05, release: 1.2, volume: -2 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Clean and steady', params: { time: 500, mix: 0.3 } },
    ],
  },
  {
    id: 'binaural-pair-in-time-three',
    name: 'Pair in time, three',
    category: 'pad',
    description:
      'Three sways a second between the ears with an echo two thirds of a second behind: eighths at ninety to the minute, triplets at sixty.',
    instrument: {
      deviceId: 'binaural',
      preset: 'Three a second',
      params: { ears: 0.6, volume: -2.5 },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 667, mix: 0.3 } }],
    preview: 'line',
  },
  {
    id: 'binaural-eight-and-four',
    name: 'Eight and four',
    category: 'pad',
    description:
      'Eight swells a second in each ear and four between the ears: sixteenths and eighths at 120 to the minute, in a small room.',
    instrument: { deviceId: 'binaural', preset: 'Eight a second', params: { volume: 2.5 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room' }],
  },
  {
    id: 'binaural-still-interval-pair',
    name: 'Still interval pair',
    category: 'drone',
    description:
      "Hold a fifth, a fourth or an octave: such keys do not beat by themselves, so only the pair's three hertz move, in a plate.",
    instrument: {
      deviceId: 'binaural',
      preset: 'Bare pair',
      params: { beat: 3, ears: 0.7, warmth: 0.35, attack: 2.5, release: 6, volume: 0 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } }],
  },
  {
    id: 'binaural-low-hum-pair',
    name: 'Low hum pair',
    category: 'pad',
    description:
      'One key as two tones forty hertz apart in both ears, near 240 and 280 hertz at middle C: a low rough hum in the air, on warm tape.',
    instrument: {
      deviceId: 'binaural',
      preset: 'Forty in the air',
      params: { warmth: 0.25, attack: 0.5, volume: -2 },
    },
    effects: [{ deviceId: 'tape', preset: 'Warm thump' }],
    preview: 'hold',
  },
  {
    id: 'binaural-pair-in-a-long-hall',
    name: 'Pair in a long hall',
    category: 'pad',
    description:
      'A pair four hertz apart and a pink bed in a very long hall. The hall folds the ears together, so the beat is in the air too.',
    instrument: {
      deviceId: 'binaural',
      preset: 'Six a second',
      params: { beat: 4, ears: 0.55, bed: 0.3, colour: 0.5, attack: 2.5, release: 6, volume: -2.5 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave' }],
  },
  {
    id: 'binaural-pair-under-hiss',
    name: 'Pair under hiss',
    category: 'pad',
    description:
      'A slow pair one hertz apart under steady tape hiss, in a long plate that blends the ears so the turn is partly in the air.',
    instrument: { deviceId: 'binaural', preset: 'Slow turn', params: { ears: 0.55, volume: -1.5 } },
    effects: [
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { width: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.22 } },
    ],
  },
]
