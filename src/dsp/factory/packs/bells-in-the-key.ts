import { type FactoryPreset, type Phrase } from '../types'

// Cast bells whose third is a decision: given by the key, set by hand anywhere from the narrow
// 7/6 to a fourth, or leaning from one place to another inside a single strike. Four bodies
// (tower, handbell, small clock, rubbed rim) each walk the thirds, the hums and the ways of
// dying away; then the players who stand under them, who hold what is inside a bell.

// C, F, A, D, G, E, C tolled one a second: with the key followed C, F and G ring major and
// A, D and E minor.
const tolls = (bells: number[]): Phrase => ({
  notes: bells.map((note, i) => ({ atSec: i, durSec: i === 6 ? 1.3 : 0.95, note, gain: 0.9 })),
})
const FOLLOWED = tolls([72, 65, 69, 62, 67, 64, 60])

// The same tolls in C minor, with A flat and E flat: C, F, D and G ring minor, the two flats major.
const IN_MINOR = tolls([72, 65, 68, 62, 67, 63, 60])

// Six bells, A down to C, plain hunted from rounds to the row before reversed rounds, with the
// open handstroke lead after every second row.
const rows = (bells: number[]): Phrase => ({
  notes: ['123456', '214365', '241635', '426153', '462513', '645231'].flatMap((row, r) =>
    [...row].map((bell, place) => ({
      atSec: Math.round((r * 1.02 + Math.floor(r / 2) * 0.17 + place * 0.17) * 100) / 100,
      durSec: 0.4,
      note: bells[Number(bell) - 1],
      gain: place === 0 ? 0.86 : 0.8,
    })),
  ),
})
const ROWS = rows([69, 67, 65, 64, 62, 60])

// The same hunt on the six bells of a D major tower, B down to D.
const ROWS_IN_D = rows([71, 69, 67, 66, 64, 62])

// Three single strikes falling by fifths, D, G, C: whatever the third does, it does it inside
// each one. With the key followed the chain is ii, V, I; with every bell major it is V of V, V, I.
const CADENCE: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.3, note: 62, gain: 0.9 },
    { atSec: 2.4, durSec: 2.3, note: 55, gain: 0.9 },
    { atSec: 4.8, durSec: 2.5, note: 60, gain: 0.9 },
  ],
}

// Three more, G, C, F, the bells C major makes major. Leaning a semitone each begins on a true
// fourth: C to B, F to E, B flat to A.
const LEANING: Phrase = {
  notes: [
    { atSec: 0, durSec: 2.3, note: 55, gain: 0.9 },
    { atSec: 2.4, durSec: 2.3, note: 60, gain: 0.9 },
    { atSec: 4.8, durSec: 2.5, note: 53, gain: 0.9 },
  ],
}

// A harmonic minor on its own roots, i, iv, V, i: A and D ring minor and E major.
const RAISED: Phrase = {
  notes: [
    [57, 69],
    [50, 62],
    [52, 64],
    [57, 69],
  ].flatMap((pair, i) =>
    pair.map((note, v) => ({
      atSec: Math.round((i * 1.8 + v * 0.8) * 100) / 100,
      durSec: Math.round((i === 3 ? 1.9 - v * 0.8 : 1.7 - v * 0.8) * 100) / 100,
      note,
      gain: 0.86 - v * 0.06,
    })),
  ),
}

// Two bells a fourth apart, twice: over D the third of the G bell moves C to B, a seventh to a
// sixth; a tone lower the third of the F bell does the same over C, B flat to A.
const SEVEN_SIX: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.5, note: 62, gain: 0.85 },
    { atSec: 0, durSec: 3.5, note: 67, gain: 0.85 },
    { atSec: 3.6, durSec: 3.6, note: 60, gain: 0.85 },
    { atSec: 3.6, durSec: 3.6, note: 65, gain: 0.85 },
  ],
}

// Pairs of bells a fifth apart. With the thirds of C major each is a whole seventh chord:
// A minor seven, D minor seven, G seven, C major seven.
const SEVENTHS: Phrase = {
  notes: [
    [57, 64],
    [62, 69],
    [55, 62],
    [60, 67],
  ].flatMap((pair, i) =>
    pair.map((note, v) => ({
      atSec: Math.round(i * 180) / 100 + v * 0.04,
      durSec: i === 3 ? 1.9 : 1.65,
      note,
      gain: 0.86,
    })),
  ),
}

// The four seventh chords held by players, each with the pure thirds its bells have:
// every seventh steps down into the next chord's third, over the roots.
const SEVENTHS_SUNG: Phrase = {
  notes: [
    [45, 60.156, 67.156, 76],
    [50, 60.156, 65.156, 74],
    [43, 58.863, 65.156, 74],
    [48, 58.863, 63.863, 72],
  ].flatMap((chord, i) =>
    chord.map((note, v) => ({
      atSec: Math.round(i * 180) / 100,
      durSec: i === 3 ? 1.9 : 1.75,
      note,
      gain: v === 0 ? 0.6 : 0.5,
    })),
  ),
}

// A round at the octave below, the follower four notes behind: tenths, sixths and one octave.
const canon = (shift: number): Phrase => ({
  notes: [
    ...[72, 74, 76, 79, 76, 77, 79, 76, 79, 77, 76, 72].map((note, i) => ({
      atSec: Math.round(i * 40) / 100,
      durSec: i === 11 ? 1.2 : 0.38,
      note: note + shift,
      gain: 0.82,
    })),
    ...[60, 62, 64, 67, 64, 65, 67, 64, 67, 65, 64, 60].map((note, i) => ({
      atSec: Math.round((i + 4) * 40) / 100,
      durSec: i === 11 ? 1.4 : 0.38,
      note: note + shift,
      gain: 0.78,
    })),
  ],
})
const CANON = canon(0)
const CANON_IN_G = canon(-5)

// A carillon tune in D dorian over five slow bass bells, D, F, G, E, D: tenths on the way, and a
// sixth that opens to the octave at the close.
const CARILLON: Phrase = {
  notes: [
    ...[74, 72, 69, 72, 71, 69, 67, 72, 74].map((note, i) => ({
      atSec: Math.round(i * 70) / 100,
      durSec: i === 8 ? 1.7 : 0.65,
      note,
      gain: 0.82,
    })),
    ...[50, 53, 55, 52, 50].map((note, i) => ({
      atSec: Math.round(i * 140) / 100,
      durSec: i === 4 ? 1.7 : 1.3,
      note,
      gain: 0.8,
    })),
  ],
}

// F lydian: the bells on F and G both ring major, a tone apart, and the tune hangs on the B.
const LYDIAN_TUNE: Phrase = {
  notes: [
    { atSec: 0.6, durSec: 0.6, note: 72, gain: 0.8 },
    { atSec: 1.2, durSec: 0.8, note: 71, gain: 0.82 },
    { atSec: 2.6, durSec: 0.6, note: 74, gain: 0.8 },
    { atSec: 3.2, durSec: 1, note: 71, gain: 0.8 },
    { atSec: 4.8, durSec: 0.6, note: 69, gain: 0.78 },
    { atSec: 5.4, durSec: 1.8, note: 72, gain: 0.82 },
  ],
}
const LYDIAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.9, note: 53, gain: 0.85 },
    { atSec: 2, durSec: 2, note: 55, gain: 0.85 },
    { atSec: 4.2, durSec: 2.8, note: 53, gain: 0.85 },
    ...LYDIAN_TUNE.notes,
  ],
}

// E phrygian: the minor bell on E with the major bell of F a semitone over it.
const PHRYGIAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 1.5, note: 52, gain: 0.86 },
    { atSec: 0.7, durSec: 0.8, note: 71, gain: 0.78 },
    { atSec: 1.6, durSec: 1.9, note: 53, gain: 0.84 },
    { atSec: 2.3, durSec: 0.7, note: 69, gain: 0.78 },
    { atSec: 3, durSec: 0.6, note: 72, gain: 0.8 },
    { atSec: 3.6, durSec: 1.5, note: 55, gain: 0.82 },
    { atSec: 4.3, durSec: 0.8, note: 71, gain: 0.78 },
    { atSec: 5.2, durSec: 2, note: 52, gain: 0.86 },
    { atSec: 5.9, durSec: 1.3, note: 76, gain: 0.78 },
  ],
}

// Roots and fifths only. No key is a third, so the only third heard is the one in the bell.
const OPEN: Phrase = {
  notes: [
    { atSec: 0, durSec: 3, note: 50, gain: 0.86 },
    { atSec: 1.2, durSec: 1.9, note: 57, gain: 0.8 },
    { atSec: 2.4, durSec: 1.6, note: 62, gain: 0.84 },
    { atSec: 3.2, durSec: 1.1, note: 69, gain: 0.8 },
    { atSec: 4.4, durSec: 2.8, note: 55, gain: 0.86 },
    { atSec: 5.2, durSec: 2, note: 62, gain: 0.8 },
  ],
}

// A clock's chime of two quarters on A, D, G and E, then the hour struck three times on D.
const quarters = (shift: number): Phrase => ({
  notes: [
    ...[81, 74, 79, 76, 76, 79, 81, 74].map((note, i) => ({
      atSec: Math.round((i * 0.4 + (i > 3 ? 0.3 : 0)) * 100) / 100,
      durSec: 0.38,
      note: note + shift,
      gain: 0.8,
    })),
    { atSec: 3.9, durSec: 1, note: 62 + shift, gain: 0.88 },
    { atSec: 5, durSec: 1, note: 62 + shift, gain: 0.86 },
    { atSec: 6.1, durSec: 1.2, note: 62 + shift, gain: 0.88 },
  ],
})
const QUARTERS = quarters(0)
const QUARTERS_LOW = quarters(-12)

// What is inside a bell, held: hum, prime, third, quint and nominal of a minor bell on D with
// its 6/5 pure, then of a major bell on C with its 5/4 pure.
const PARTIALS: Phrase = {
  notes: [
    ...[50, 62, 65.156, 69.02, 74].map((note, i) => ({
      atSec: 0,
      durSec: 3.5,
      note,
      gain: 0.62 - i * 0.05,
    })),
    ...[48, 60, 63.863, 67.02, 72].map((note, i) => ({
      atSec: 3.6,
      durSec: 3.7,
      note,
      gain: 0.62 - i * 0.05,
    })),
  ],
}

// The suspension of the leaning bell written out: over the hum and prime of G a pure fourth is
// held, then comes down to a pure major third, and the deciem answers an octave up.
const UNDER_LEAN: Phrase = {
  notes: [
    { atSec: 0, durSec: 7.3, note: 43, gain: 0.55 },
    { atSec: 0, durSec: 7.3, note: 55, gain: 0.55 },
    { atSec: 0.3, durSec: 2.9, note: 59.98, gain: 0.58 },
    { atSec: 3.2, durSec: 4, note: 58.863, gain: 0.55 },
    { atSec: 0.6, durSec: 6.6, note: 67, gain: 0.45 },
    { atSec: 3.5, durSec: 3.7, note: 70.863, gain: 0.45 },
  ],
}

// Old towers: a bell on D over a hum a minor seventh below, then over one a ninth below.
const OLD_HUMS: Phrase = {
  notes: [
    { atSec: 0, durSec: 3.5, note: 51.99, gain: 0.62 },
    { atSec: 0, durSec: 7.3, note: 62, gain: 0.52 },
    { atSec: 0.2, durSec: 3.3, note: 65.05, gain: 0.5 },
    { atSec: 0.4, durSec: 6.9, note: 69.02, gain: 0.42 },
    { atSec: 3.6, durSec: 3.7, note: 47.98, gain: 0.62 },
    { atSec: 3.7, durSec: 3.6, note: 65.156, gain: 0.5 },
  ],
}

export const PRESETS: readonly FactoryPreset[] = [
  // Tower bells, the third given by a key.
  {
    id: 'bells-in-the-key-seven-tolls-two-thirds',
    name: 'Seven tolls, two thirds',
    category: 'bell',
    description:
      'Tower bells in C major rung hard, gone in six seconds: C, F and G sound major, A, D and E minor, in open air.',
    preview: FOLLOWED,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Tower in C major',
      params: { volume: 0, decay: 6, upper: 0.7, hardness: 0.7, doublet: 0.15, damping: 0.25 },
    },
    effects: [{ deviceId: 'distance', preset: 'Open air', params: { distance: 0.4 } }],
  },
  {
    id: 'bells-in-the-key-dorian-evensong-bells',
    name: 'Dorian evensong bells',
    category: 'bell',
    description:
      'Softly struck tower bells in D Dorian, where the bell on G rings major, dulled and laid on a dark plate.',
    preview: CARILLON,
    instrument: {
      deviceId: 'tierce-bells',
      params: {
        volume: 4,
        root: 2,
        scale: 2,
        hardness: 0.15,
        upper: 0.25,
        decay: 10,
        damping: 0.55,
        doublet: 0.8,
        humLevel: 0.35,
        release: 0.2,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } }],
  },
  {
    id: 'bells-in-the-key-phrygian-night-watch',
    name: 'Phrygian night watch',
    category: 'drone',
    description:
      'Slow deep tower bells in E Phrygian, nearly all hum and third, choked at each key-up and blurred into a dark bank of fog.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Hum a ninth below',
      params: {
        root: 4,
        scale: 3,
        humPitch: 0.5,
        humLevel: 0.8,
        upper: 0.12,
        quint: 0.1,
        decay: 30,
        hardness: 0.1,
        release: 0.5,
        volume: -1,
      },
    },
    effects: [{ deviceId: 'fog', preset: 'Dark bank' }],
  },
  {
    id: 'bells-in-the-key-noon-bells-in-f-lydian',
    name: 'Noon bells in F Lydian',
    category: 'bell',
    description:
      'Clean hard tower bells in F Lydian, F and G both major, opened wide, with a few bright echoes scattered after them.',
    preview: LYDIAN,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'New tower',
      params: {
        volume: -5,
        root: 5,
        scale: 4,
        upper: 0.85,
        hardness: 0.85,
        decay: 9,
        humLevel: 0.2,
        doublet: 0,
        spread: 1,
      },
    },
    effects: [{ deviceId: 'constellation', preset: 'Faint points', params: { mix: 0.25 } }],
  },
  {
    id: 'bells-in-the-key-flag-day-in-d-major',
    name: 'Flag day in D major',
    category: 'bell',
    description:
      'Short bright tower bells in D major, hunted from B down to D: D, G and A ring major, B, F sharp and E minor, in a bright chamber.',
    preview: ROWS_IN_D,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Carillon in D minor',
      params: {
        volume: 0,
        scale: 0,
        decay: 2.5,
        damping: 0.7,
        hardness: 0.9,
        upper: 0.7,
        quint: 0.3,
        release: 0.1,
      },
    },
    effects: [{ deviceId: 'expanse', preset: 'Bright chamber' }],
  },
  {
    id: 'bells-in-the-key-borrowed-minor-tolls',
    name: 'Borrowed minor tolls',
    category: 'bell',
    description:
      'A tower in C minor: C, D, F and G ring minor, A flat and E flat major, beating, on worn tape in a dark hall.',
    preview: IN_MINOR,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Old tower',
      params: {
        volume: -1,
        follow: 1,
        root: 0,
        scale: 1,
        humPitch: 0.5,
        humLevel: 0.6,
        upper: 0.35,
        decay: 16,
        doublet: 1.6,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.2 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bells-in-the-key-where-e-turns-major',
    name: 'Where E turns major',
    category: 'bell',
    description:
      'A harmonic minor in bronze: A rings minor over a strong hum and E rings major, the whole tower carried round in a slow circle.',
    preview: RAISED,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Changing keys',
      params: {
        volume: 0,
        hardness: 0.45,
        humLevel: 0.95,
        quint: 0.75,
        upper: 0.2,
        decay: 12,
        tierce: 386.31,
        release: 0.3,
        damping: 0.75,
        spread: 0,
      },
    },
    effects: [{ deviceId: 'around', preset: 'Slow circle' }],
  },
  // Tower bells, the third moving inside the strike.
  {
    id: 'bells-in-the-key-resolved-in-bronze',
    name: 'Resolved in bronze',
    category: 'bell',
    description:
      'Each strike starts on a fourth and comes down to a pure major third in 1.8 seconds, the quint out, in an airy hall.',
    preview: LEANING,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Four to three',
      params: {
        volume: -3,
        follow: 1,
        glide: 1.8,
        upper: 0.6,
        humLevel: 0.3,
        decay: 16,
        hardness: 0.55,
      },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.25 } }],
  },
  {
    id: 'bells-in-the-key-the-seventh-comes-down',
    name: 'The seventh comes down',
    category: 'bell',
    description:
      'Two tower bells at once, each third easing down a semitone in 2.4 seconds, the upper from 4/3 to 5/4, a pedal stop an octave below.',
    preview: SEVEN_SIX,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Four to three',
      params: {
        volume: -2,
        follow: 1,
        glide: 2.4,
        quint: 0.1,
        upper: 0.2,
        humLevel: 0.7,
        decay: 30,
        hardness: 0.2,
        doublet: 0.1,
      },
    },
    effects: [{ deviceId: 'stops', preset: 'Pedal under', params: { mix: 0.45 } }],
  },
  {
    id: 'bells-in-the-key-a-second-that-climbs',
    name: 'A second that climbs',
    category: 'bell',
    description:
      'A retardation in every bell: the third begins as a 9/8 second and climbs to 5/4 in two seconds, with a dark long echo.',
    preview: CADENCE,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Major bell',
      params: {
        volume: 3,
        lean: -182.4,
        glide: 2,
        quint: 0.3,
        humLevel: 0.6,
        upper: 0.35,
        decay: 8,
        damping: 0.7,
        hardness: 0.35,
        doublet: 0,
      },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.35 } }],
  },
  {
    id: 'bells-in-the-key-picardy-in-one-strike',
    name: 'Picardy in one strike',
    category: 'bell',
    description:
      'A minor third that brightens to major within 1.6 seconds of the clapper, wide and upper-heavy, through three long springs.',
    preview: CADENCE,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Major bell',
      params: {
        lean: -70.67,
        glide: 1.6,
        humLevel: 0.05,
        upper: 1,
        decay: 22,
        damping: 0.1,
        hardness: 0.65,
        doublet: 2.5,
        spread: 1,
      },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } }],
  },
  {
    id: 'bells-in-the-key-sours-as-it-rings',
    name: 'Sours as it rings',
    category: 'bell',
    description:
      'A bell that starts major and closes to the narrow 7/6 in two and a half seconds, its top shaded, swaying on a warped disc.',
    preview: OPEN,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Narrow third',
      params: {
        volume: 2,
        lean: 119.44,
        glide: 2.5,
        humLevel: 0.6,
        quint: 0.2,
        upper: 0.5,
        decay: 12,
        hardness: 0.25,
        doublet: 0.3,
      },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Warped', params: { crackle: 0.1 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  // Tower bells, the third set by hand.
  {
    id: 'bells-in-the-key-the-undecided-tower',
    name: 'The undecided tower',
    category: 'bell',
    description:
      'The neutral third, 11/9, on every bell with its pairs beating 0.7 times a second, the quint low, down a stone stairwell.',
    preview: OPEN,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Neutral tower',
      params: { volume: 2.5, quint: 0.15, upper: 0.6, humLevel: 0.25, hardness: 0.6, decay: 18 },
    },
    effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
  },
  {
    id: 'bells-in-the-key-seven-over-six-tower',
    name: 'Seven over six tower',
    category: 'bell',
    description:
      'A 7/6 third under a full quint, still, with hardly any hum, its partials twinkling apart from each other in a faint hall.',
    preview: OPEN,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Narrow third',
      params: {
        volume: -0.5,
        humLevel: 0.08,
        quint: 1,
        upper: 0.2,
        decay: 26,
        damping: 0.1,
        hardness: 0.5,
        doublet: 0,
      },
    },
    effects: [
      { deviceId: 'glimmer', preset: 'Wide twinkle' },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'bells-in-the-key-a-fourth-in-the-rain',
    name: 'A fourth in the rain',
    category: 'bell',
    description:
      'No third at all: the tierce set to a fourth with the quint out, short and dull, left out in light rain.',
    preview: OPEN,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Open fourth',
      params: {
        volume: 3.5,
        upper: 0.4,
        humLevel: 0.5,
        decay: 5,
        damping: 0.6,
        hardness: 0.6,
        doublet: 0.9,
        release: 0.1,
      },
    },
    effects: [{ deviceId: 'weather', preset: 'Light rain' }],
  },
  {
    id: 'bells-in-the-key-sweet-and-unreal',
    name: 'Sweet and unreal',
    category: 'bell',
    description:
      'The pure major-third bell, softly struck, its tones sifted out and held long and the strikes nearly taken away.',
    preview: OPEN,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Major bell',
      params: {
        volume: 4.5,
        hardness: 0.05,
        upper: 0.45,
        humLevel: 0.4,
        decay: 20,
        damping: 0.2,
        doublet: 0.2,
      },
    },
    effects: [{ deviceId: 'sift', preset: 'Long wash' }],
  },
  {
    id: 'bells-in-the-key-third-too-bright',
    name: 'Third too bright',
    category: 'bell',
    description:
      'A 9/7 third, wider than major, hard and overdriven through a triode and drying quickly in a small bright tank.',
    preview: CADENCE,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Major bell',
      params: {
        tierce: 435.08,
        hardness: 0.85,
        upper: 0.55,
        quint: 0,
        decay: 4,
        damping: 0.3,
        doublet: 0.1,
        spread: 0.1,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.2, decay: 3 } },
    ],
  },
  // Tower bells, hums.
  {
    id: 'bells-in-the-key-seventh-underfoot',
    name: 'Seventh underfoot',
    category: 'bell',
    description:
      'An old tower whose hum lies a minor seventh under the note, loud, beating 1.1 times a second, across a wide open valley.',
    preview: OPEN,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Old tower',
      params: {
        volume: 2,
        humLevel: 1,
        upper: 0.15,
        quint: 0.8,
        hardness: 0.3,
        damping: 0.8,
        release: 0.35,
      },
    },
    effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3, decay: 7 } }],
  },
  {
    id: 'bells-in-the-key-ninth-in-the-bell-yard',
    name: 'Ninth in the bell yard',
    category: 'drone',
    description:
      'Bells in C major over a hum a major ninth below, each strike faded in over a second and shadowed by dull detuned copies.',
    preview: OPEN,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Hum a ninth below',
      params: { volume: 3, quint: 0.5, upper: 0.5, decay: 24, release: 0.3, hardness: 0.5 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 1000 } },
      { deviceId: 'stereo-detune', preset: 'Shadow' },
    ],
  },
  {
    id: 'bells-in-the-key-cracked-still-rung',
    name: 'Cracked, still rung',
    category: 'bell',
    description:
      'A cracked bell, short and warbling four times a second over a flat hum, rung in rows through a station loudspeaker.',
    preview: ROWS,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Cracked tower',
      params: { volume: 4.5, decay: 2.2, hardness: 0.6, upper: 0.5, quint: 0.6 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Station platform', params: { drive: 0.2 } }],
  },
  {
    id: 'bells-in-the-key-hum-with-no-bell',
    name: 'Hum with no bell',
    category: 'drone',
    description:
      'Only the hum, the note and the third of a tower bell, quint and upper partials gone, wavering slowly under water.',
    preview: CADENCE,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Hum a ninth below',
      params: {
        volume: -2,
        humPitch: 0.5,
        humLevel: 1,
        quint: 0,
        upper: 0,
        decay: 40,
        damping: 0.1,
        hardness: 0,
        doublet: 0.4,
      },
    },
    effects: [{ deviceId: 'underwater', preset: 'Slow swell' }],
  },
  // Handbells: the note and its twelfth.
  {
    id: 'bells-in-the-key-ringers-in-a-row',
    name: 'Ringers in a row',
    category: 'bell',
    description:
      'Handbells in C major choked as each key is let go, so a fast row stays clear, close up in a tight chamber.',
    preview: ROWS,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Handbells in C',
      params: { release: 0.8, hardness: 0.75, upper: 0.8, decay: 4 },
    },
    effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber' }],
  },
  {
    id: 'bells-in-the-key-round-of-ringers',
    name: 'Round of ringers',
    category: 'bell',
    description:
      'Clean still handbells in C major with no hum, the whole round on a slow rotating speaker across the room.',
    preview: CANON,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Handbells in C',
      params: {
        volume: 3.5,
        decay: 2.5,
        hardness: 0.3,
        upper: 0.2,
        doublet: 0,
        release: 0.1,
        humLevel: 0,
        spread: 0.2,
      },
    },
    effects: [{ deviceId: 'rotary', preset: 'Across the room' }],
  },
  {
    id: 'bells-in-the-key-white-gloves',
    name: 'White gloves',
    category: 'bell',
    description:
      'Very soft handbells in A minor with a strong quint, each faded in over a quarter of a second, with a late sheen of plate.',
    preview: SEVENTHS,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Soft handbells',
      params: { volume: 3.5, decay: 22, upper: 0.15, quint: 0.8, doublet: 0.9 },
    },
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 260 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'bells-in-the-key-climbing-out-of-minor',
    name: 'Climbing out of minor',
    category: 'bell',
    description:
      'Handbells whose third climbs from 6/5 to 5/4 in two seconds over a full hum, their own sound played backwards behind them.',
    preview: CADENCE,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Rising handbells',
      params: { volume: 3.5, glide: 2, hardness: 0.2, upper: 0.3, decay: 7, damping: 0.5 },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Backwards echo', params: { mix: 0.3 } }],
  },
  {
    id: 'bells-in-the-key-handbell-appoggiatura',
    name: 'Handbell appoggiatura',
    category: 'bell',
    description:
      'A quick lean in every handbell: the third falls a semitone to its place in C major in a third of a second, with a short slap.',
    preview: CARILLON,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Handbells in C',
      params: {
        volume: -3,
        lean: 111.73,
        glide: 0.35,
        quint: 0,
        upper: 0.25,
        humLevel: 0.6,
        decay: 12,
        damping: 0.1,
        hardness: 0.6,
        doublet: 0.1,
      },
    },
    effects: [{ deviceId: 'analog-delay', preset: 'Slapback' }],
  },
  {
    id: 'bells-in-the-key-neither-nor-ringers',
    name: 'Neither-nor ringers',
    category: 'bell',
    description:
      'Handbells with the neutral 11/9 third over a hum a seventh below, warbling twice a second, through a bedside loudspeaker.',
    preview: OPEN,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Soft handbells',
      params: {
        volume: -0.5,
        follow: 0,
        tierce: 347.41,
        hardness: 0.4,
        upper: 0.6,
        humPitch: 0.561,
        humLevel: 1,
        doublet: 2,
        decay: 6,
        damping: 0.5,
      },
    },
    effects: [{ deviceId: 're-amp', preset: 'Bedside radio' }],
  },
  {
    id: 'bells-in-the-key-ringers-on-fourths',
    name: 'Ringers on fourths',
    category: 'bell',
    description:
      'Handbells with a fourth for a third and no quint, long and thin, widened from bottom to top in a shining tail.',
    preview: OPEN,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Rising handbells',
      params: {
        volume: -3.5,
        tierce: 498.04,
        lean: 0,
        quint: 0,
        humLevel: 0,
        upper: 0.75,
        decay: 30,
        damping: 0.05,
        hardness: 0.85,
        doublet: 0.6,
      },
    },
    effects: [
      { deviceId: 'spread', preset: 'Everything wide' },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  {
    id: 'bells-in-the-key-g-goes-minor',
    name: 'G goes minor',
    category: 'bell',
    description:
      'Handbells in D minor, where the G bell turns minor, struck hard and dulled by a twelve-bit glaze.',
    preview: FOLLOWED,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Handbells in C',
      params: {
        volume: -0.5,
        root: 2,
        scale: 1,
        hardness: 0.95,
        upper: 0.5,
        quint: 0.2,
        decay: 3,
        damping: 0.2,
        doublet: 0.4,
      },
    },
    effects: [{ deviceId: 'vintage-digital', preset: 'Glaze', params: { rate: 10000 } }],
  },
  {
    id: 'bells-in-the-key-choir-loft-ringers',
    name: 'Choir loft ringers',
    category: 'keys',
    description:
      'Handbells in C major with the hum up, played into a hall whose tail sings a soft vowel behind them.',
    preview: SEVENTHS,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Handbells in C',
      params: { volume: 1, humLevel: 1, upper: 0.4, hardness: 0.25, decay: 10, release: 0.2 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { decay: 4, mix: 0.4 } }],
  },
  {
    id: 'bells-in-the-key-table-bells-high-fourth',
    name: 'Table bells, high fourth',
    category: 'bell',
    description:
      'Lydian handbells on F, muted like bells pressed on a table, gone in under a second and answered by a skipping echo.',
    preview: LYDIAN,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Handbells in C',
      params: {
        volume: 6,
        root: 5,
        scale: 4,
        decay: 0.7,
        damping: 0.1,
        hardness: 0.55,
        upper: 0.6,
        humLevel: 0.2,
      },
    },
    effects: [{ deviceId: 'skipping-stone', preset: 'Skipping stone' }],
  },
  {
    id: 'bells-in-the-key-seconds-in-the-hand',
    name: 'Seconds in the hand',
    category: 'bell',
    description:
      'Handbells that start on a second and rise to a minor third in a second and a half, blurred to a hanging mist.',
    preview: SEVENTHS,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Soft handbells',
      params: {
        volume: -0.5,
        follow: 0,
        tierce: 315.64,
        lean: -111.73,
        glide: 1.5,
        hardness: 0.3,
        quint: 0.3,
        decay: 9,
      },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist' }],
  },
  {
    id: 'bells-in-the-key-bowls-answer-the-ringers',
    name: 'Bowls answer the ringers',
    category: 'bell',
    description:
      'Short hard handbells in C major whose notes wake a table of still metal bowls tuned to C major pentatonic.',
    preview: FOLLOWED,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Handbells in C',
      params: {
        volume: 6,
        decay: 2,
        hardness: 0.7,
        upper: 0.35,
        damping: 0.8,
        quint: 0.6,
        spread: 0.9,
      },
    },
    effects: [{ deviceId: 'bowls', preset: 'Still bowls' }],
  },
  {
    id: 'bells-in-the-key-ringers-over-the-wall',
    name: 'Ringers over the wall',
    category: 'bell',
    description:
      'Hard handbells in C major, each over a hum an octave below, heard from the next house with all the air between.',
    preview: ROWS,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Rising handbells',
      params: { volume: -5.5, follow: 1, lean: 0, decay: 8, upper: 0.4 },
    },
    effects: [{ deviceId: 'distance', preset: 'Next door' }],
  },
  {
    id: 'bells-in-the-key-pythagorean-ringers',
    name: 'Pythagorean ringers',
    category: 'bell',
    description:
      'Soft handbells with the wide 81/64 third on every note, gathered by three short loops of unequal length.',
    preview: CADENCE,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Handbells in C',
      params: {
        volume: 5.5,
        follow: 0,
        tierce: 407.82,
        decay: 5,
        hardness: 0.1,
        upper: 0.7,
        quint: 0,
        doublet: 0.1,
      },
    },
    effects: [{ deviceId: 'orbits', preset: 'Short canon', params: { mix: 0.45 } }],
  },
  // Small clocks.
  {
    id: 'bells-in-the-key-two-quarters-and-three',
    name: 'Two quarters and three',
    category: 'bell',
    description:
      'A small clock in C major, hammer hard and every partial quick, striking inside a case of thin tin.',
    preview: QUARTERS,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Mantel clock',
      params: { volume: -1, hardness: 0.9, decay: 5, upper: 0.7, doublet: 1.2 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Small tin' }],
  },
  {
    id: 'bells-in-the-key-clock-on-the-landing',
    name: 'Clock on the landing',
    category: 'bell',
    description:
      'A clock with a minor third and a hum that rings for half a minute after a soft hammer, at the back of a hall.',
    preview: QUARTERS,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Hall clock',
      params: { volume: 1, hardness: 0.1, decay: 28, upper: 0.5, quint: 0.8, doublet: 0.3 },
    },
    effects: [{ deviceId: 'distance', preset: 'Back of the hall' }],
  },
  {
    id: 'bells-in-the-key-clocks-in-canon',
    name: 'Clocks in canon',
    category: 'keys',
    description:
      'Little clock bells in G major, where D rings major too, followed a second and a half later by a faint second clock.',
    preview: CANON_IN_G,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Tiny carillon',
      params: {
        volume: 2.5,
        hardness: 0.35,
        upper: 0.35,
        quint: 0.7,
        decay: 6,
        release: 0.2,
        doublet: 0.2,
      },
    },
    effects: [{ deviceId: 'canon', preset: 'Faint answer', params: { gap: 1.6 } }],
  },
  {
    id: 'bells-in-the-key-the-wrong-hour',
    name: 'The wrong hour',
    category: 'bell',
    description:
      'A clock whose third was cast too wide at 9/7, worn and warbling three times a second, on an old dictation tape.',
    preview: QUARTERS,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Mantel clock',
      params: {
        volume: 4,
        follow: 0,
        tierce: 435.08,
        doublet: 3,
        decay: 12,
        hardness: 0.5,
        upper: 0.25,
        humLevel: 0.2,
      },
    },
    effects: [{ deviceId: 'tape', preset: 'Old dictation', params: { hiss: 0.25 } }],
  },
  {
    id: 'bells-in-the-key-clock-that-leans',
    name: 'Clock that leans',
    category: 'bell',
    description:
      'A clock bell over a lasting hum whose third falls from a fourth to a pure major third in 0.8 seconds, on a small plate.',
    preview: LEANING,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Hall clock',
      params: {
        volume: -3,
        follow: 1,
        lean: 111.73,
        glide: 0.8,
        quint: 0,
        upper: 0.6,
        decay: 20,
        damping: 0,
        hardness: 0.65,
        doublet: 0.1,
      },
    },
    effects: [{ deviceId: 'plate-reverb', preset: 'Small plate' }],
  },
  {
    id: 'bells-in-the-key-mantel-neither-mode',
    name: 'Mantel, neither mode',
    category: 'bell',
    description:
      'A mantel clock with a neutral third, choked and dry, its ticks of overtone thrown about as small bright sparks.',
    preview: OPEN,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Mantel clock',
      params: {
        volume: 4.5,
        follow: 0,
        tierce: 347.41,
        release: 0.5,
        decay: 3,
        damping: 0.1,
        upper: 0.4,
        quint: 0,
        humLevel: 0.7,
      },
    },
    effects: [{ deviceId: 'glints', preset: 'Thrown by touch', params: { pitch: 0 } }],
  },
  {
    id: 'bells-in-the-key-repeater-watch',
    name: 'Repeater watch',
    category: 'bell',
    description:
      'The smallest bell, no hum, gone in under a second and ticking against its own close clusters of echo.',
    preview: QUARTERS,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Tiny carillon',
      params: { volume: 0.5, root: 0, decay: 1.6, damping: 0.3, upper: 1, hardness: 1, quint: 0 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Close flicker', params: { mix: 0.3 } }],
  },
  {
    id: 'bells-in-the-key-dorian-clock',
    name: 'Dorian clock',
    category: 'bell',
    description:
      'Softly hammered clock bells in D Dorian with a strong hum, and an octave added below them.',
    preview: QUARTERS,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Mantel clock',
      params: {
        volume: 3,
        root: 2,
        scale: 2,
        hardness: 0.05,
        upper: 0.3,
        decay: 16,
        humLevel: 0.8,
        doublet: 0.2,
      },
    },
    effects: [{ deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6 } }],
  },
  {
    id: 'bells-in-the-key-clockmakers-window',
    name: "Clockmaker's window",
    category: 'texture',
    description:
      'Clock bells in C major, with moments from the last few seconds of them drifting back over the top.',
    preview: QUARTERS,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Tiny carillon',
      params: {
        volume: 6,
        root: 0,
        hardness: 0.3,
        upper: 0.4,
        decay: 7,
        damping: 0.2,
        quint: 0.5,
        spread: 0.4,
      },
    },
    effects: [{ deviceId: 'echo-memory', preset: 'Just now', params: { mix: 0.5 } }],
  },
  {
    id: 'bells-in-the-key-phrygian-hour',
    name: 'Phrygian hour',
    category: 'bell',
    description:
      'Clock bells in E Phrygian with a strong quint and warble, spread into colours that fall from high to low.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Mantel clock',
      params: {
        volume: 6,
        root: 4,
        scale: 3,
        quint: 1,
        doublet: 1.8,
        decay: 7,
        hardness: 0.3,
        upper: 0.6,
        spread: 1,
      },
    },
    effects: [{ deviceId: 'prism', preset: 'High to low', params: { mix: 0.45 } }],
  },
  {
    id: 'bells-in-the-key-narrow-striking-hour',
    name: 'Narrow striking hour',
    category: 'bell',
    description:
      'A hall clock at the narrow 7/6, its long hum turned minor seventh, brought up out of the quiet between strikes.',
    preview: OPEN,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Hall clock',
      params: {
        volume: -9.5,
        tierce: 266.87,
        humPitch: 0.561,
        hardness: 0.6,
        upper: 0.2,
        quint: 0.5,
        decay: 12,
      },
    },
    effects: [{ deviceId: 'lift', preset: 'Long tails' }],
  },
  {
    id: 'bells-in-the-key-stopped-clock',
    name: 'Stopped clock',
    category: 'texture',
    description:
      'Clock strikes in C major with no hum, smeared so that a glassy halo hangs on after the hammer has gone.',
    preview: SEVENTHS,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Tiny carillon',
      params: {
        volume: 2.5,
        root: 0,
        hardness: 0.2,
        upper: 0.8,
        decay: 5,
        damping: 0.6,
        quint: 0.3,
        doublet: 0.8,
        release: 0,
      },
    },
    effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.6 } }],
  },
  {
    id: 'bells-in-the-key-morning-wall-clock',
    name: 'Morning wall clock',
    category: 'bell',
    description:
      'A pure major clock bell on every key, plain and quick, through a hollow tube that keeps the middle of the sound.',
    preview: CADENCE,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Mantel clock',
      params: {
        volume: 6,
        follow: 0,
        tierce: 386.31,
        decay: 10,
        damping: 0.8,
        hardness: 0.55,
        upper: 0.5,
        doublet: 0,
        humLevel: 0.1,
        spread: 0.1,
      },
    },
    effects: [{ deviceId: 'imprint', preset: 'Hollow tube' }],
  },
  // Rubbed rims: the bell swells for as long as its key is down.
  {
    id: 'bells-in-the-key-rims-in-sevenths',
    name: 'Rims in sevenths',
    category: 'pad',
    description:
      'Rubbed rims in C major, two keys a fifth apart sounding a whole seventh chord, loosely thickened by three drifting voices.',
    preview: SEVENTHS,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Rubbed in C major',
      params: { volume: 3, upper: 0.4, decay: 4, release: 0.3, quint: 0.3 },
    },
    effects: [{ deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.4 } }],
  },
  {
    id: 'bells-in-the-key-rim-sighing-down',
    name: 'Rim sighing down',
    category: 'pad',
    description:
      'A rubbed rim whose third comes down from a fourth to a major third while it swells, dark, with the quint out.',
    preview: LEANING,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Rubbed suspension',
      params: { glide: 2, hardness: 0.6, upper: 0.5, humLevel: 0.1, doublet: 0 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'bells-in-the-key-two-rims-seven-to-six',
    name: 'Two rims, seven to six',
    category: 'pad',
    description:
      'Hard-rubbed rims whose third slides from a fourth to a major third in three seconds, the middle band pulsing side to side.',
    preview: SEVEN_SIX,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Rubbed suspension',
      params: {
        volume: 1,
        follow: 0,
        tierce: 386.31,
        glide: 3,
        hardness: 0.95,
        upper: 0.9,
        humLevel: 0.5,
        quint: 0.2,
        doublet: 0.4,
        spread: 1,
      },
    },
    effects: [{ deviceId: 'band-pulse', preset: 'Side to side' }],
  },
  {
    id: 'bells-in-the-key-undecided-rim',
    name: 'Undecided rim',
    category: 'drone',
    description:
      'A worn rim at 11/9 with its hum a minor seventh below, held by a slow compressor and wandering far round the room.',
    preview: OPEN,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Rubbed old rim',
      params: {
        volume: 1.5,
        hardness: 0.35,
        upper: 0.2,
        humLevel: 0.9,
        doublet: 0.6,
        quint: 0.2,
        decay: 25,
      },
    },
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells' },
      { deviceId: 'around', preset: 'Drone drift' },
    ],
  },
  {
    id: 'bells-in-the-key-rim-worn-through',
    name: 'Rim worn through',
    category: 'texture',
    description:
      'A rim rubbed as hard as it goes, pairs beating three and a half times a second, with a soft fuzz and grit under it.',
    preview: OPEN,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Rubbed old rim',
      params: {
        humPitch: 0.5,
        humLevel: 0.2,
        hardness: 1,
        upper: 1,
        doublet: 3.5,
        decay: 6,
        spread: 0.3,
      },
    },
    effects: [{ deviceId: 'haze', preset: 'Small room fuzz' }],
  },
  {
    id: 'bells-in-the-key-dorian-rims',
    name: 'Dorian rims',
    category: 'pad',
    description:
      'Rims in D Dorian that ring on long after the key, all hum, note and third, with soft sines an octave up over them.',
    preview: SEVENTHS,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Rubbed in C major',
      params: {
        root: 2,
        scale: 2,
        hardness: 0.1,
        upper: 0.1,
        humLevel: 0.8,
        decay: 34,
        quint: 0.1,
        doublet: 0.1,
      },
    },
    effects: [{ deviceId: 'sine-shadow', preset: 'Octave halo' }],
  },
  {
    id: 'bells-in-the-key-rim-with-a-ninth-below',
    name: 'Rim with a ninth below',
    category: 'drone',
    description:
      'Rubbed bells over a hum a ninth under the note, little left but hum, note and third, melting very slowly downward.',
    preview: OPEN,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Rubbed in C major',
      params: {
        humPitch: 0.445,
        humLevel: 1,
        quint: 0,
        upper: 0.05,
        hardness: 0.2,
        decay: 18,
        release: 0.35,
        doublet: 0.2,
      },
    },
    effects: [{ deviceId: 'melt', preset: 'Deep pool' }],
  },
  {
    id: 'bells-in-the-key-thin-glass-edge',
    name: 'Thin glass edge',
    category: 'pad',
    description:
      'No hum and no fifth, the rim bright and still like a wine glass in C major, with a bright chamber for a room.',
    preview: CARILLON,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Rubbed in C major',
      params: {
        humLevel: 0,
        quint: 0,
        upper: 0.8,
        hardness: 0.7,
        decay: 3,
        doublet: 0,
        release: 0.4,
        spread: 0.2,
      },
    },
    effects: [{ deviceId: 'ether-reverb', preset: 'Bright chamber' }],
  },
  {
    id: 'bells-in-the-key-rim-septimal-third',
    name: 'Rim, septimal third',
    category: 'drone',
    description:
      'A rim at the narrow 7/6 whose partials take turns swelling, six bands of it drifting in and out like water.',
    preview: CADENCE,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Rubbed old rim',
      params: {
        volume: 1.5,
        tierce: 266.87,
        humPitch: 0.5,
        hardness: 0.5,
        upper: 0.5,
        doublet: 0.1,
        quint: 0.6,
        spread: 0.6,
      },
    },
    effects: [{ deviceId: 'currents', preset: 'Glass notes' }],
  },
  {
    id: 'bells-in-the-key-open-rim-no-third',
    name: 'Open rim, no third',
    category: 'pad',
    description:
      'The rubbed rim set to a fourth with its quint full, so it rings as a bare fourth and fifth, under slow organ stops.',
    preview: OPEN,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Rubbed old rim',
      params: {
        volume: -1,
        tierce: 498.04,
        humPitch: 0.5,
        quint: 1,
        hardness: 0.3,
        upper: 0.35,
        doublet: 0.5,
        decay: 10,
      },
    },
    effects: [{ deviceId: 'stops', preset: 'Slow bloom' }],
  },
  {
    id: 'bells-in-the-key-rims-raised-seventh',
    name: 'Rims, raised seventh',
    category: 'pad',
    description:
      'Rims in A harmonic minor on an E Phrygian tune: E, F and G ring major, A and B minor, in a tremolo five times a second.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Rubbed in C major',
      params: {
        volume: 5,
        tierce: 386.31,
        root: 9,
        scale: 6,
        hardness: 0.55,
        upper: 0.6,
        humLevel: 0.3,
        doublet: 1,
        decay: 8,
        spread: 1,
      },
    },
    effects: [{ deviceId: 'tremolo', preset: 'Wide shimmer' }],
  },
  {
    id: 'bells-in-the-key-rim-waking-to-major',
    name: 'Rim waking to major',
    category: 'pad',
    description:
      'A minor rim that opens to major over three and a half seconds, smeared grain by grain into a slow cloud behind.',
    preview: SEVEN_SIX,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Rubbed suspension',
      params: {
        follow: 0,
        tierce: 386.31,
        lean: -70.67,
        glide: 3.5,
        humLevel: 0.9,
        upper: 0.15,
        hardness: 0.1,
        decay: 7,
        doublet: 0.8,
      },
    },
    effects: [{ deviceId: 'grain-cloud', preset: 'Slow smear', params: { mix: 0.5 } }],
  },
  {
    id: 'bells-in-the-key-rims-after-closedown',
    name: 'Rims after closedown',
    category: 'texture',
    description:
      'Rubbed bells in C major heard on a medium wave set with a small loudspeaker, steady, after the last programme.',
    preview: SEVENTHS,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Rubbed in C major',
      params: { hardness: 0.8, quint: 0.8, upper: 0.6, humLevel: 0.6, doublet: 1.5 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Clean transistor', params: { speaker: 0.8, static: 0.06 } },
    ],
  },
  {
    id: 'bells-in-the-key-rim-second-to-third',
    name: 'Rim, second to third',
    category: 'pad',
    description:
      'Rims that begin on a second and climb to a major third in two seconds, their own sound coming back reversed and slow.',
    preview: CADENCE,
    instrument: {
      deviceId: 'tierce-bells',
      preset: 'Rubbed suspension',
      params: {
        volume: 2.5,
        follow: 0,
        tierce: 386.31,
        lean: -182.4,
        glide: 2,
        hardness: 0.4,
        upper: 0.7,
        humLevel: 0.5,
        decay: 5,
        quint: 0.5,
      },
    },
    effects: [{ deviceId: 'reverse-delay', preset: 'Slow swells' }],
  },
  // Other metal: handpans that play the bells' own tunes.
  {
    id: 'bells-in-the-key-pan-beneath-the-tower',
    name: 'Pan beneath the tower',
    category: 'plucked',
    description:
      'A soft-handed steel pan for the seven tolls, its low thump of air up, in a stone stairwell.',
    preview: FOLLOWED,
    instrument: { deviceId: 'handpan', preset: 'Low ding', params: { touch: 0.15, shimmer: 0.6 } },
    effects: [{ deviceId: 'distance', preset: 'Stone stairwell', params: { distance: 0.35 } }],
  },
  {
    id: 'bells-in-the-key-hands-ring-the-rows',
    name: 'Hands ring the rows',
    category: 'plucked',
    description: 'Dry damped taps for change ringing, each hit doubled by one quick slap of tape.',
    preview: ROWS,
    instrument: {
      deviceId: 'handpan',
      preset: 'Rain taps',
      params: { position: 0.5, damp: 0.5, decay: 1.6 },
    },
    effects: [{ deviceId: 'tape-echo', preset: 'Single slap' }],
  },
  {
    id: 'bells-in-the-key-tongue-drum-carillon',
    name: 'Tongue drum carillon',
    category: 'plucked',
    description:
      'A pure tongue drum with no shimmer, long and round, warmed by a transformer and opened in a small plate.',
    preview: CARILLON,
    instrument: {
      deviceId: 'handpan',
      preset: 'Pure tongue',
      params: { touch: 0.25, decay: 6, cavity: 0.3 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'bells-in-the-key-halo-of-two-notes',
    name: 'Halo of two notes',
    category: 'plucked',
    description:
      'A ringing pan with every note answering the others, its attack taken away so that pairs of notes bloom, in a warm hall.',
    preview: SEVENTHS,
    instrument: { deviceId: 'handpan', preset: 'Halo', params: { decay: 9 } },
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal' },
      { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'bells-in-the-key-struck-at-the-rim',
    name: 'Struck at the rim',
    category: 'plucked',
    description:
      'Knuckles near the edge of a pan, all overtone, in a small glassy tail that climbs as it fades.',
    preview: LYDIAN,
    instrument: {
      deviceId: 'handpan',
      preset: 'Edge overtones',
      params: { touch: 0.8, damp: 0.2 },
    },
    effects: [{ deviceId: 'spiral', preset: 'Glass stair', params: { mix: 0.25 } }],
  },
  {
    id: 'bells-in-the-key-tank-strikes-the-hour',
    name: 'Tank strikes the hour',
    category: 'plucked',
    description:
      'A tank drum as a clock: damped, boomy and driven through a warm loudspeaker stack.',
    preview: QUARTERS_LOW,
    instrument: {
      deviceId: 'handpan',
      preset: 'Tank drum',
      params: { damp: 0.6, decay: 3, touch: 0.7 },
    },
    effects: [{ deviceId: 're-amp', preset: 'Warm stack' }],
  },
  {
    id: 'bells-in-the-key-hands-on-open-fifths',
    name: 'Hands on open fifths',
    category: 'plucked',
    description:
      'Centre tones of a pan on roots and fifths, with two close copies of each flying slowly round it.',
    preview: OPEN,
    instrument: { deviceId: 'handpan', preset: 'Centre tone', params: { sympathy: 0.2, decay: 4 } },
    effects: [{ deviceId: 'murmuration', preset: 'Two close by', params: { mix: 0.5 } }],
  },
  {
    id: 'bells-in-the-key-pan-round-in-steel',
    name: 'Pan round in steel',
    category: 'plucked',
    description:
      'Bright steel tongues in a round at the octave, short and hollow, the echoes hopping up an octave and back.',
    preview: CANON,
    instrument: { deviceId: 'handpan', preset: 'Bright tongue', params: { decay: 2, cavity: 0.5 } },
    effects: [{ deviceId: 'analog-delay', preset: 'Octave hop', params: { mix: 0.25 } }],
  },
  // Those who stand under: chords tuned to what is inside a bell.
  {
    id: 'bells-in-the-key-partials-at-first-light',
    name: 'Partials at first light',
    category: 'pad',
    description:
      'A pad with a metal sweep falling through each slow onset, on the hum, third and quint of a bell, with a faint chirp of springs.',
    preview: PARTIALS,
    instrument: {
      deviceId: 'aurora',
      preset: 'Metal dawn',
      params: { attack: 0.9, brilliance: 2600, ring: 0.8, detune: 3, release: 2 },
    },
    effects: [{ deviceId: 'spring-reverb', preset: 'Hint of spring' }],
  },
  {
    id: 'bells-in-the-key-congregation-hum',
    name: 'Congregation hum',
    category: 'pad',
    description:
      'A nearly closed filter swelling on the tones a bell holds, a low hum with its top gone, opened wide in the middle.',
    preview: PARTIALS,
    instrument: {
      deviceId: 'aurora',
      preset: 'Deep swell',
      params: { volume: -7, attack: 1.2, brilliance: 240, release: 3, swell: 1 },
    },
    effects: [{ deviceId: 'spread', preset: 'Open middle' }],
  },
  {
    id: 'bells-in-the-key-brass-leans-to-three',
    name: 'Brass leans to three',
    category: 'pad',
    description:
      'Short dark brass that overshoots on each entry of the written-out 4-3, in a hall whose tail falls in a straight line.',
    preview: UNDER_LEAN,
    instrument: {
      deviceId: 'aurora',
      preset: 'Short brass',
      params: { attack: 0.12, swell: 0.5, release: 1.2, detune: 2 },
    },
    effects: [{ deviceId: 'shaped-reverb', preset: 'Falling' }],
  },
  {
    id: 'bells-in-the-key-vowels-on-old-hums',
    name: 'Vowels on old hums',
    category: 'voice',
    description:
      'A resonant filter opening like a mouth over a hum a seventh and then a ninth below, phasing slowly in twelve stages.',
    preview: OLD_HUMS,
    instrument: {
      deviceId: 'aurora',
      preset: 'Opening vowel',
      params: { volume: -7, attack: 1, release: 2.5, brilliance: 520 },
    },
    effects: [{ deviceId: 'phaser', preset: 'Twelve stage cloud' }],
  },
  {
    id: 'bells-in-the-key-silver-sevenths-pure',
    name: 'Silver sevenths, pure',
    category: 'string',
    description:
      'Thin high strings on seventh chords with pure thirds, all below nine hundred hertz cut, each entry in a haze of tape flutter.',
    preview: SEVENTHS_SUNG,
    instrument: {
      deviceId: 'aurora',
      preset: 'Silver strings',
      params: { attack: 0.35, release: 1.6 },
    },
    effects: [{ deviceId: 'tape', preset: 'Flutter shimmer' }],
  },
  {
    id: 'bells-in-the-key-chime-strings-open',
    name: 'Chime strings, open',
    category: 'string',
    description:
      'A quick bright string tone, ring-modulated as each key goes down, with a long release, drifting nearer and farther in a hall.',
    preview: OPEN,
    instrument: {
      deviceId: 'aurora',
      preset: 'Chime strings',
      params: { resonance: 0.1, brilliance: 8000, release: 5 },
    },
    effects: [{ deviceId: 'distance', preset: 'Slow tide' }],
  },
  {
    id: 'bells-in-the-key-pipes-keep-the-round',
    name: 'Pipes keep the round',
    category: 'keys',
    description:
      'Plain undetuned pipes with a quick release for a round, sampled at a low rate with the top folded back.',
    preview: CANON,
    instrument: {
      deviceId: 'aurora',
      preset: 'Still pipes',
      params: { release: 0.3, brilliance: 3500, attack: 0.03 },
    },
    effects: [{ deviceId: 'vintage-digital', preset: 'Toy' }],
  },
  {
    id: 'bells-in-the-key-reeds-under-e-and-f',
    name: 'Reeds under E and F',
    category: 'pad',
    description:
      'Loose beating reeds for the semitone between two bells, narrow and nasal, throbbing softly three times a second.',
    preview: PHRYGIAN,
    instrument: {
      deviceId: 'aurora',
      preset: 'Loose reeds',
      params: { lowCut: 500, release: 0.8, detune: 30 },
    },
    effects: [{ deviceId: 'pulses', preset: 'Soft throb' }],
  },
  // Organs under the tower.
  {
    id: 'bells-in-the-key-organ-tuned-to-a-bell',
    name: 'Organ tuned to a bell',
    category: 'organ',
    description:
      'Sub and flute ranks hold a minor and then a major bell in pure thirds, the bellows moving, inside a wooden soundboard.',
    preview: PARTIALS,
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { celeste: 0, octave: 0.15, sub: 0.7, bellows: 0.5, attack: 0.4, tone: 1400 },
    },
    effects: [{ deviceId: 'vessel', preset: 'Wooden body' }],
  },
  {
    id: 'bells-in-the-key-quint-rank-suspension',
    name: 'Quint rank suspension',
    category: 'organ',
    description:
      'The plain rank with a strong twelfth and fifteenth, hollow, for a fourth that comes down to a pure third, a slow notch through it.',
    preview: UNDER_LEAN,
    instrument: {
      deviceId: 'organ',
      preset: 'Hollow quint',
      params: { attack: 0.8, release: 2.5, tone: 5000, fifteenth: 0.4 },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Slow notch' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'bells-in-the-key-pumped-under-old-bells',
    name: 'Pumped under old bells',
    category: 'organ',
    description:
      'A pump organ with fifteenth and celeste drawn, over a hum a seventh and then a ninth below, on worn cassette.',
    preview: OLD_HUMS,
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: {
        volume: -13,
        bellows: 1,
        reed: 0.2,
        fifteenth: 0.8,
        celeste: 0.9,
        breath: 0.8,
        tone: 5500,
      },
    },
    effects: [{ deviceId: 'patina', preset: 'Worn cassette' }],
  },
  {
    id: 'bells-in-the-key-vestry-tremulant',
    name: 'Vestry tremulant',
    category: 'organ',
    description:
      'A trembling reed rank with a twelfth over it for the carillon tune, heard from inside a closed cupboard.',
    preview: CARILLON,
    instrument: {
      deviceId: 'organ',
      preset: 'Vox humana',
      params: { reed: 0.9, twelfth: 0.6, tone: 4200 },
    },
    effects: [{ deviceId: 're-amp', preset: 'In the cupboard' }],
  },
  {
    id: 'bells-in-the-key-ranks-over-two-bells',
    name: 'Ranks over two bells',
    category: 'organ',
    description:
      'Upper ranks and quick accordion reeds on seventh chords with pure thirds, bright, thrown into tight clusters of echoes.',
    preview: SEVENTHS_SUNG,
    instrument: {
      deviceId: 'organ',
      preset: 'Accordion',
      params: { fifteenth: 0.6, twelfth: 0.5, reed: 0.35, celeste: 0.4, tone: 9000 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Tight clusters', params: { mix: 0.3 } }],
  },
  {
    id: 'bells-in-the-key-windy-gallery',
    name: 'Windy gallery',
    category: 'wind',
    description:
      'Mostly wind in the flutes, roots and fifths held like breath across a bottle, with currents of it crossing side to side.',
    preview: OPEN,
    instrument: {
      deviceId: 'organ',
      preset: 'Windy flute',
      params: { attack: 0.3, release: 1.2, tone: 6000, bellows: 1 },
    },
    effects: [
      { deviceId: 'vessel', preset: 'Blown bottle' },
      { deviceId: 'currents', preset: 'Side to side' },
    ],
  },
  // Horns below the louvres.
  {
    id: 'bells-in-the-key-horns-take-the-partials',
    name: 'Horns take the partials',
    category: 'wind',
    description:
      'A horn section swelling on the hum, third and quint of a bell in pure thirds, over a floor of room rumble.',
    preview: PARTIALS,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { attack: 1.4, release: 1.5, blow: 0.75, section: 1 },
    },
    effects: [{ deviceId: 'noise-floor', preset: 'Distant rumble' }],
  },
  {
    id: 'bells-in-the-key-low-brass-resolves',
    name: 'Low brass resolves',
    category: 'wind',
    description:
      'Soft low brass for the written-out 4-3 over a held octave, a short fog rounding off each entry.',
    preview: UNDER_LEAN,
    instrument: {
      deviceId: 'horns',
      preset: 'Soft tuba',
      params: { section: 0.5, attack: 0.7, blow: 0.25 },
    },
    effects: [{ deviceId: 'fog', preset: 'Pad softener' }],
  },
  {
    id: 'bells-in-the-key-flugel-on-the-raised-b',
    name: 'Flugel on the raised B',
    category: 'wind',
    description:
      'One breathy flugelhorn that calls the Lydian tune, answered by a slowing spiral of its own echoes.',
    preview: LYDIAN_TUNE,
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { attack: 0.12, vibrato: 0.5, blow: 0.5, release: 0.7 },
    },
    effects: [{ deviceId: 'constellation', preset: 'Slowing spiral', params: { mix: 0.3 } }],
  },
  {
    id: 'bells-in-the-key-muted-clock-strokes',
    name: 'Muted clock strokes',
    category: 'wind',
    description:
      'Muted trumpet that takes the chime and the hour, quick and pinched, sent through a kitchen set.',
    preview: QUARTERS,
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { attack: 0.03, release: 0.35, blow: 0.7 },
    },
    effects: [{ deviceId: 'radio', preset: 'Kitchen radio' }],
  },
  {
    id: 'bells-in-the-key-air-through-louvres',
    name: 'Air through louvres',
    category: 'wind',
    description:
      'A horn that is nearly all air on a hum a seventh and then a ninth under the note, with gusts of outside weather.',
    preview: OLD_HUMS,
    instrument: {
      deviceId: 'horns',
      preset: 'Horn of air',
      params: { attack: 0.8, release: 2, section: 0.4 },
    },
    effects: [{ deviceId: 'weather', preset: 'Breezy day' }],
  },
  {
    id: 'bells-in-the-key-band-plays-the-pairs',
    name: 'Band plays the pairs',
    category: 'wind',
    description:
      'A low brass section with a fourth added under each note of the pairs of fifths, heard on a slow rotating drum.',
    preview: SEVENTHS,
    instrument: {
      deviceId: 'horns',
      preset: 'Parallel fourths',
      params: { type: 4, attack: 0.25, release: 1, section: 1 },
    },
    effects: [{ deviceId: 'rotary', preset: 'Dark drum' }],
  },
  // Strings tuned to the bell.
  {
    id: 'bells-in-the-key-bowed-at-the-waist',
    name: 'Bowed at the waist',
    category: 'string',
    description:
      'Glassy light bows on a bell’s partials with pure thirds, slow to speak, sagging a little as each note hangs on.',
    preview: PARTIALS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Glass bow',
      params: { attack: 0.9, release: 2, brightness: 1, position: 0.03, detune: 3 },
    },
    effects: [{ deviceId: 'melt', preset: 'Soft sag' }],
  },
  {
    id: 'bells-in-the-key-viols-lean-together',
    name: 'Viols lean together',
    category: 'string',
    description:
      'A wide detuned section for the fourth that becomes a third, low and heavy-bodied, its vibrato late and slow.',
    preview: UNDER_LEAN,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Detuned section',
      params: { volume: -16.5, attack: 0.7, vibrato: 0, brightness: 0.25, release: 1.6 },
    },
    effects: [
      { deviceId: 'late-vibrato', preset: 'Slow bow' },
      { deviceId: 'ambient-eq', preset: 'Deep' },
    ],
  },
  {
    id: 'bells-in-the-key-wire-under-bronze',
    name: 'Wire under bronze',
    category: 'plucked',
    description:
      'Bright wire strings plucked in pairs a fifth apart, an octave added above them, in a harmonic tremolo held down by a limiter.',
    preview: SEVENTHS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Wire harp',
      params: { volume: -7.5, position: 0.04, brightness: 1, decay: 22 },
    },
    effects: [
      { deviceId: 'octaves', preset: 'Twelve string' },
      { deviceId: 'tremolo', preset: 'Harmonic shimmer' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9, gain: 5 } },
    ],
  },
  {
    id: 'bells-in-the-key-rope-on-a-stay',
    name: 'Rope on a stay',
    category: 'plucked',
    description:
      'A dull damped pluck like a rope pulled and checked, for ringing rows, with a hollow rattle of close echoes after it.',
    preview: ROWS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Damped pluck',
      params: { volume: -6, brightness: 0.2, decay: 0.8, position: 0.3 },
    },
    effects: [{ deviceId: 'swarm-reverb', preset: 'Tight swarm' }],
  },
  {
    id: 'bells-in-the-key-feedback-on-old-hums',
    name: 'Feedback on old hums',
    category: 'string',
    description:
      'Strings held in octave feedback over a hum a seventh and then a ninth below, pushed into a warm pre-amp and darkened.',
    preview: OLD_HUMS,
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Octave feedback',
      params: { attack: 0.9, release: 2, pressure: 1, brightness: 0.4 },
    },
    effects: [{ deviceId: 'analog-drive', preset: 'Worn tape' }],
  },
  // Voices that sing the partials.
  {
    id: 'bells-in-the-key-throat-in-the-belfry',
    name: 'Throat in the belfry',
    category: 'voice',
    description:
      'Overtone voices on roots and fifths whose mouths walk slowly through the harmonics, in a chapel that sings back.',
    preview: OPEN,
    instrument: {
      deviceId: 'overtone',
      preset: 'Slow chant',
      params: { attack: 0.5, release: 1.5, growl: 0, overtone: 5 },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel' }],
  },
  {
    id: 'bells-in-the-key-whistled-tierce',
    name: 'Whistled tierce',
    category: 'voice',
    description:
      'A still whistle fixed on the tenth harmonic, a pure third over every held note, opened out by scattered tiny glints.',
    preview: CADENCE,
    instrument: {
      deviceId: 'overtone',
      preset: 'Still whistle',
      params: { overtone: 10, focus: 0.9, attack: 0.15, release: 1.5, vibrato: 0 },
    },
    effects: [{ deviceId: 'glints', preset: 'Slow stars' }],
  },
  {
    id: 'bells-in-the-key-reed-drone-bell-tuning',
    name: 'Reed drone, bell tuning',
    category: 'drone',
    description:
      'A buzzing reed drone on the tones inside a bell, its whistle moving, put on an old parlour disc and through a thin vowel.',
    preview: PARTIALS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Reed drone',
      params: { volume: -15, overtone: 5, growl: 0.5, attack: 0.3, release: 1 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Parlour 78' },
      { deviceId: 'imprint', preset: 'Thin vowel' },
    ],
  },
  {
    id: 'bells-in-the-key-jaw-harp-peal',
    name: 'Jaw harp peal',
    category: 'plucked',
    description:
      'A quick twang for every bell of a plain hunt, the mouth moving four times a second, dry but for a slap of room.',
    preview: ROWS,
    instrument: { deviceId: 'overtone', preset: 'Jaw harp', params: { wander: 1, overtone: 6 } },
    effects: [{ deviceId: 'ether-reverb', preset: 'Slap room' }],
  },
  {
    id: 'bells-in-the-key-breath-pipe-old-hums',
    name: 'Breath pipe, old hums',
    category: 'voice',
    description:
      'A breathy pipe over a hum a seventh and then a ninth under the note, half speed copies of it dragging an octave below.',
    preview: OLD_HUMS,
    instrument: {
      deviceId: 'overtone',
      preset: 'Breath pipe',
      params: { volume: -13, breath: 1, attack: 0.4, release: 1.2, overtone: 7 },
    },
    effects: [{ deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.4 } }],
  },
]
