import { type FactoryPreset } from '../types'

// Each preset is drawn from a row of the family's sources (counts of seconds
// the research uses, and places where a slow swell is already music) and says
// what is heard: the counts in seconds, how many breaths that is a minute, what
// the swell is made of and the room. The device's own level sits under the
// bank's, so every preset sets Volume. Only the two counts with long holds come
// to fewer than four and a half breaths a minute; every other cycle, and every
// slow down at its end, is 13.3 seconds or shorter.

export const BREATH_PACER_PRESETS: readonly FactoryPreset[] = [
  // --- Counts the research uses ---
  {
    id: 'five-in-five-out',
    name: 'Five in five out',
    category: 'pad',
    description:
      'Air and a soft tone swelling for five seconds and falling for five, six breaths a minute, a soft mark at each turn, in a hall.',
    instrument: { deviceId: 'breath-pacer', preset: 'Five five', params: { volume: -4.1 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } }],
  },
  {
    id: 'five-and-a-half-tone',
    name: 'Five and a half tone',
    category: 'pad',
    description:
      'A warm tone that swells for five and a half seconds and falls as long, never to silence, about five and a half breaths a minute.',
    instrument: {
      deviceId: 'breath-pacer',
      preset: 'Five and a half',
      params: { volume: -7.9 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } }],
  },
  {
    id: 'six-in-six-out',
    name: 'Six in six out',
    category: 'texture',
    description:
      'Air that opens from dull to bright over six seconds and closes over six, five breaths a minute, in an open space.',
    instrument: { deviceId: 'breath-pacer', preset: 'Six six', params: { volume: -8.2 } },
    effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.25 } }],
  },
  {
    id: 'four-in-six-out',
    name: 'Four in six out',
    category: 'pad',
    description:
      'Tone and air rising for four seconds and falling for six, six breaths a minute, with a clear mark at each turn, in a room.',
    instrument: { deviceId: 'breath-pacer', preset: 'Four six', params: { volume: -8.8 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } }],
  },
  {
    id: 'long-out-air',
    name: 'Long out air',
    category: 'texture',
    description:
      'Air alone swelling for four seconds and sinking for six, six breaths a minute, never quite to silence, in a long plate.',
    instrument: {
      deviceId: 'breath-pacer',
      preset: 'Air alone',
      params: { in: 4, out: 6, release: 1.5, volume: -6.2 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
  },
  {
    id: 'three-one-four-two',
    name: 'Three one four two',
    category: 'pad',
    description:
      'Air and tone in for three seconds, held for one, out for four and at rest for two, six breaths a minute, in a small room.',
    instrument: {
      deviceId: 'breath-pacer',
      preset: 'Three one four two',
      params: { volume: -4.4 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } }],
  },
  {
    id: 'fours-all-round',
    name: 'Fours all round',
    category: 'pad',
    description:
      'A tone in for four seconds, held four, out four and silent four, struck as it starts in and as it starts out, in a tight chamber.',
    instrument: { deviceId: 'breath-pacer', preset: 'Fours all round', params: { volume: -10.4 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber' }],
  },
  {
    id: 'four-seven-eight',
    name: 'Four seven eight',
    category: 'pad',
    description:
      'Bright air in for four seconds, held for seven and out for eight, about three breaths a minute, with a bright hall behind it.',
    instrument: {
      deviceId: 'breath-pacer',
      preset: 'In 4 hold 7 out 8',
      params: { volume: -6 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.25 } }],
  },
  {
    id: 'five-slowing-to-ten',
    name: 'Five slowing to ten',
    category: 'pad',
    description:
      'Air with a mark at each turn, a breath every five seconds that slows to one every ten over five minutes, in a hall.',
    instrument: {
      deviceId: 'breath-pacer',
      preset: 'Five slowing to ten',
      params: { volume: -6.2 },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } }],
  },
  {
    id: 'long-slow-down',
    name: 'Long slow down',
    category: 'pad',
    description:
      'A tone with no marks, a breath every five seconds that slows to one every ten over fifteen minutes, in a dark hall.',
    instrument: { deviceId: 'breath-pacer', preset: 'Long slow down', params: { volume: -11.3 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } }],
  },
  {
    id: 'marked-slow-down',
    name: 'Marked slow down',
    category: 'drone',
    description:
      'Struck marks over a tone that never leaves, a turn every two and a half seconds slowing to one every five over ten minutes.',
    instrument: {
      deviceId: 'breath-pacer',
      preset: 'Marks over a tone',
      params: { in: 2.5, out: 2.5, slowTo: 2, over: 10, volume: -6.5 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } }],
  },
  {
    id: 'soft-marks-in-air',
    name: 'Soft marks in air',
    category: 'texture',
    description:
      'Air swelling for five seconds and falling for five, with a soft mark at the key as it starts in and a fifth lower as it starts out.',
    instrument: {
      deviceId: 'breath-pacer',
      preset: 'Five five',
      params: { air: 0.7, tone: 0, marks: 0.55, bright: 0.3, release: 2, volume: -4.7 },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Faint air', params: { mix: 0.2 } }],
  },
  {
    id: 'pink-air-alone',
    name: 'Pink air alone',
    category: 'texture',
    description:
      'Pink noise alone swelling for five seconds and falling for five, six breaths a minute, bright at the top and dull at the bottom.',
    instrument: { deviceId: 'breath-pacer', preset: 'Air alone', params: { volume: -7.6 } },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.2 } }],
  },
  {
    id: 'tone-over-faint-air',
    name: 'Tone over faint air',
    category: 'pad',
    description:
      'A plain tone swelling for five seconds and falling for five with pink air well under it, six breaths a minute, in a plate.',
    instrument: {
      deviceId: 'breath-pacer',
      preset: 'Tone alone',
      params: { in: 5, out: 5, air: 0.55, bright: 0.6, volume: -12.1 },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.3 } }],
  },
  {
    id: 'still-colour-breath',
    name: 'Still colour breath',
    category: 'pad',
    description:
      'Air and tone swelling for four seconds and falling for four while the colour stands still, never quite to silence, in a booth.',
    instrument: { deviceId: 'breath-pacer', preset: 'Still colour', params: { volume: -2.8 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.15 } }],
  },
  {
    id: 'low-breath-drone',
    name: 'Low breath drone',
    category: 'drone',
    description:
      'Warm tone with a little air for low keys, swelling for five and a half seconds and falling as long, on warm tape in a hall.',
    instrument: {
      deviceId: 'breath-pacer',
      preset: 'Five and a half',
      params: { marks: 0, bright: 0.7, release: 2.5, volume: -12.1 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
    ],
  },

  // --- Where a slow swell is already music ---
  {
    id: 'two-bars-at-sixty',
    name: 'Two bars at sixty',
    category: 'pad',
    description:
      'A tone that swells and brightens for four beats and falls for four at 60 beats a minute, two bars of four to a breath, in a hall.',
    instrument: { deviceId: 'breath-pacer', preset: 'Tone alone', params: { volume: -15 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
  },
  {
    id: 'struck-bar-lines',
    name: 'Struck bar lines',
    category: 'pad',
    description:
      'A struck mark on every bar line at 120 beats a minute, air and tone swelling through one bar and falling through the next.',
    instrument: { deviceId: 'breath-pacer', preset: 'Two two struck', params: { volume: -4.3 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } }],
  },
  {
    id: 'swell-then-two-bars',
    name: 'Swell then two bars',
    category: 'pad',
    description:
      'At 120 beats a minute a bar of swell, a bar of fall and two bars of silence, a mark on the first two bar lines, with a long echo.',
    instrument: { deviceId: 'breath-pacer', preset: 'Swell then rest', params: { volume: -4.8 } },
    effects: [
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.25 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'marks-on-the-bar-line',
    name: 'Marks on the bar line',
    category: 'keys',
    description:
      'Marks alone: a soft struck note on every bar line at 80 beats a minute, the key on one bar and a fifth lower on the next.',
    instrument: { deviceId: 'breath-pacer', preset: 'Marks alone', params: { volume: -9 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Room' }],
  },
  {
    id: 'tone-hiss-and-hall',
    name: 'Tone, hiss and hall',
    category: 'pad',
    description:
      'A tone that never leaves, brighter and louder every six seconds, over a little steady hiss in a long hall.',
    instrument: { deviceId: 'breath-pacer', preset: 'Tone that stays', params: { volume: -12.5 } },
    effects: [
      { deviceId: 'noise-floor', preset: 'Faint hiss' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'air-in-a-cathedral',
    name: 'Air in a cathedral',
    category: 'texture',
    description:
      'Air in for two seconds, held for three and out for four, left to ring for seconds after the key in a cathedral.',
    instrument: { deviceId: 'breath-pacer', preset: 'Air that lingers', params: { volume: -8 } },
    effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } }],
  },
  {
    id: 'room-tone-breath',
    name: 'Room tone breath',
    category: 'drone',
    description:
      'Air and tone for low keys, three seconds in, one held, four out and two at rest, over the faint noise of an empty room.',
    instrument: {
      deviceId: 'breath-pacer',
      preset: 'Three one four two',
      params: { marks: 0, floor: 0.2, bright: 0.8, release: 3, volume: -5.9 },
    },
    effects: [
      { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -48 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'quick-swelling-pad',
    name: 'Quick swelling pad',
    category: 'pad',
    description:
      'A chord that swells and sinks once every two seconds, never to silence, thickened by a slow chorus in a hall.',
    instrument: { deviceId: 'breath-pacer', preset: 'Quick swell', params: { volume: -4.2 } },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'only-colour-moves',
    name: 'Only colour moves',
    category: 'drone',
    description:
      'A steady sound of air and tone whose colour opens for three seconds and closes for three while its level stays put.',
    instrument: { deviceId: 'breath-pacer', preset: 'Only colour moves', params: { volume: -2.9 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Faint sheen' }],
  },
  {
    id: 'surf-of-air',
    name: 'Surf of air',
    category: 'texture',
    description:
      'Air like surf, five seconds coming in and eight going out, never quite gone, under five breaths a minute, in a wide space.',
    instrument: { deviceId: 'breath-pacer', preset: 'Long tide', params: { volume: -9.9 } },
    effects: [{ deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.3 } }],
  },
  {
    id: 'held-at-the-top',
    name: 'Held at the top',
    category: 'pad',
    description:
      'A chord that swells in two seconds, stays for six and falls in two, its colour almost still, through a slow rotor.',
    instrument: { deviceId: 'breath-pacer', preset: 'Held at the top', params: { volume: -7.7 } },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'swell-cut-at-key-up',
    name: 'Swell cut at key up',
    category: 'keys',
    description:
      'Air and tone that swell for four seconds, hold for two and stop dead when the last key is let go, with a short soft echo.',
    instrument: { deviceId: 'breath-pacer', preset: 'Cut at key up', params: { volume: -2.7 } },
    effects: [{ deviceId: 'tape-echo', preset: 'Short and soft', params: { mix: 0.25 } }],
  },
  {
    id: 'marks-over-a-drone',
    name: 'Marks over a drone',
    category: 'drone',
    description:
      'A tone that never leaves with a struck note every three seconds, the key and then a fifth below it, ringing in a long plate.',
    instrument: { deviceId: 'breath-pacer', preset: 'Marks over a tone', params: { volume: -6.5 } },
    effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
  },
  {
    id: 'soft-mallet-marks',
    name: 'Soft mallet marks',
    category: 'bell',
    description:
      'Each key a soft struck sine that dies within half a second, with no air and no tone under it, in a small bright room.',
    instrument: {
      deviceId: 'breath-pacer',
      preset: 'Marks alone',
      params: { release: 0.12, volume: -9.5 },
    },
    effects: [{ deviceId: 'expanse', preset: 'Bright chamber', params: { mix: 0.25 } }],
  },
]
