import { type InstrumentSet } from './set'

// Each direction is ten corners of the instrument by five: what turns the sand, how
// long it runs, how the beginning is met, on what body and in which register. The
// chain of a row is chosen for what that corner is for, from close up to far away.

export const SET: InstrumentSet = {
  device: 'turned-time',
  names: {
    body: ['Bell', 'Bar', 'String', 'Skin', 'Glass', 'Reed'],
    turn: ['New key', 'Empty glass', 'Let go'],
    neck: ['Soften', 'Strike', 'Hover', 'Pass'],
  },
  chains: {
    close: { effects: [{ deviceId: 'ambient-eq', preset: 'Keys' }], words: 'close and plain' },
    warm: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Warm' },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: 'warm and close',
    },
    shade: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Shaded' },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.15 } },
      ],
      words: 'in the shade',
    },
    booth: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.25 } }],
      words: 'in a small booth',
    },
    tight: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Tight room' }],
      words: 'in a tight little room',
    },
    room: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } }],
      words: 'in a plain room',
    },
    chamber: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.22 } }],
      words: 'in a tight chamber',
    },
    airyroom: {
      effects: [
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.3, damping: 0.1 } },
      ],
      words: 'in a short bright ambience',
    },
    widetop: {
      effects: [{ deviceId: 'spread', preset: 'Firm and airy' }],
      words: 'wide at the top and firm below',
    },
    firm: {
      effects: [
        { deviceId: 'spread', preset: 'Firm bass' },
        { deviceId: 'ambient-eq', preset: 'Open' },
      ],
      words: 'with the low end held in the middle',
    },
    desk: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Warm glue' },
        { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.12 } },
      ],
      words: 'through a warm desk',
    },
    reel: {
      effects: [{ deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.08 } }],
      words: 'on quarter inch tape',
    },
    deck: {
      effects: [
        { deviceId: 'tape', preset: 'Mastering deck' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'on a clean deck in a small room',
    },
    triode: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Triode glow' },
        { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.15 } },
      ],
      words: 'through a glowing valve',
    },
    iron: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Low warmth' },
        { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 4 } },
      ],
      words: 'with weight from an iron core',
    },
    thump: {
      effects: [
        { deviceId: 'tape', preset: 'Warm thump' },
        { deviceId: 'spread', preset: 'Firm bass' },
      ],
      words: 'pressed warm on cassette',
    },
    combo: {
      effects: [{ deviceId: 're-amp', preset: 'Combo in a room', params: { noise: 0 } }],
      words: 'through a small amplifier in a room',
    },
    bedside: {
      effects: [
        { deviceId: 're-amp', preset: 'Bedside radio', params: { noise: 0, mix: 0.7 } },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.15 } },
      ],
      words: 'from a bedside speaker',
    },
    wood: {
      effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.5 } }],
      words: 'inside a wooden body',
    },
    bottle: {
      effects: [
        { deviceId: 'vessel', preset: 'Blown bottle', params: { mix: 0.4 } },
        { deviceId: 'plate-reverb', preset: 'Tight room' },
      ],
      words: 'blown through a bottle',
    },
    kettle: {
      effects: [{ deviceId: 'vessel', preset: 'Kettle', params: { mix: 0.4 } }],
      words: 'in a copper kettle',
    },
    hint: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Hint of spring' }],
      words: 'with a hint of spring',
    },
    doubled: {
      effects: [{ deviceId: 'stereo-detune', preset: 'Doubled', params: { mix: 0.4 } }],
      words: 'doubled, a little apart',
    },
    slap: {
      effects: [{ deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.25 } }],
      words: 'with one slap off a near wall',
    },
    steps: {
      effects: [{ deviceId: 'distance', preset: 'A few steps back' }],
      words: 'a few steps back',
    },
    nextdoor: {
      effects: [{ deviceId: 'distance', preset: 'Next door' }],
      words: 'heard from next door',
    },
    felt: {
      effects: [
        { deviceId: 'sift', preset: 'Soft hammers' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: 'with the strikes softened',
    },
    thinveil: {
      effects: [{ deviceId: 'fog', preset: 'Thin veil', params: { mix: 0.35 } }],
      words: 'under a thin veil',
    },
    faintair: {
      effects: [
        { deviceId: 'chorus', preset: 'Faint air' },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.15 } },
      ],
      words: 'in a faint moving air',
    },
    late: {
      effects: [
        { deviceId: 'late-vibrato', preset: 'Finger vibrato' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: 'with a light vibrato',
    },
    smallplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Small plate' }],
      words: 'on a small plate',
    },
    longplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.28 } }],
      words: 'on a long plate',
    },
    darkplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.35 } }],
      words: 'on a dark plate',
    },
    hall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
      words: 'in a hall',
    },
    darkhall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.35 } }],
      words: 'in a dark hall',
    },
    cathedral: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } }],
      words: 'in a cathedral',
    },
    nave: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } }],
      words: 'in a vast nave',
    },
    airy: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.32 } }],
      words: 'with an airy tail',
    },
    valley: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
      words: 'across an open valley',
    },
    cave: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.32 } }],
      words: 'in a dark cave',
    },
    breathing: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.38 } }],
      words: 'in a hall that breathes',
    },
    expanse: {
      effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } }],
      words: 'in a wide open space',
    },
    horizon: {
      effects: [{ deviceId: 'expanse', preset: 'Event horizon', params: { mix: 0.3 } }],
      words: 'at the edge of an endless space',
    },
    swellroom: {
      effects: [{ deviceId: 'expanse', preset: 'Quick swell', params: { mix: 0.35 } }],
      words: 'in a room that swells up behind',
    },
    latehall: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.28 } }],
      words: 'with a hall that answers late',
    },
    bloom: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Rising fifths', params: { mix: 0.28 } }],
      words: 'with fifths rising in the tail',
    },
    longdark: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.35 } }],
      words: 'over a long dark bloom',
    },
    summer: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Wide summer', params: { mix: 0.32 } }],
      words: 'in a wide warm bloom',
    },
    choirtail: {
      effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.25 } }],
      words: 'with a choir rising behind',
    },
    glasstail: {
      effects: [{ deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.25 } }],
      words: 'with a thin glass shimmer above',
    },
    undertow: {
      effects: [{ deviceId: 'shimmer', preset: 'Undertow', params: { mix: 0.3 } }],
      words: 'with an octave drawn down beneath',
    },
    muffled: {
      effects: [{ deviceId: 'shimmer', preset: 'Muffled choir', params: { mix: 0.35 } }],
      words: 'before a muffled choir',
    },
    ah: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.3 } }],
      words: 'with a hall that sings ah',
    },
    monks: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.32 } }],
      words: 'with low monks in the walls',
    },
    chapel: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.3 } }],
      words: 'in a chapel',
    },
    spring: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.28 } }],
      words: 'in a long spring tank',
    },
    drip: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.28 } }],
      words: 'with a spring that drips',
    },
    reversed: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.32 } }],
      words: 'with the room running backwards',
    },
    gated: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.35 } }],
      words: 'in a room shut short',
    },
    slowtide: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Slow tide', params: { mix: 0.36 } }],
      words: 'with a slow tide of room',
    },
    cavern: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.3 } }],
      words: 'in a cavern of short echoes',
    },
    patter: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.3 } }],
      words: 'with a patter of small echoes',
    },
    climbing: {
      effects: [{ deviceId: 'spiral', preset: 'Slow ascent', params: { mix: 0.28 } }],
      words: 'under a tail that keeps climbing',
    },
    deeper: {
      effects: [{ deviceId: 'spiral', preset: 'Deep below', params: { mix: 0.35 } }],
      words: 'over a tail that keeps sinking',
    },
    glow: {
      effects: [{ deviceId: 'haze', preset: 'Glowing wall', params: { mix: 0.26 } }],
      words: 'against a glowing wall',
    },
    wool: {
      effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.35 } }],
      words: 'behind a wool blanket',
    },
    deepfog: {
      effects: [{ deviceId: 'fog', preset: 'Deep fog', params: { mix: 0.6 } }],
      words: 'deep in fog',
    },
    bank: {
      effects: [
        { deviceId: 'fog', preset: 'Dark bank', params: { mix: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.18 } },
      ],
      words: 'with a dark bank of fog',
    },
    repeats: {
      effects: [{ deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.28 } }],
      words: 'with warm tape repeats',
    },
    dotted: {
      effects: [{ deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.3 } }],
      words: 'with a dotted tape echo',
    },
    trail: {
      effects: [{ deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.28 } }],
      words: 'with a long dark echo trail',
    },
    darkecho: {
      effects: [{ deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.3 } }],
      words: 'with a dark soft echo',
    },
    hop: {
      effects: [{ deviceId: 'analog-delay', preset: 'Octave hop', params: { mix: 0.26 } }],
      words: 'with echoes that hop an octave',
    },
    crystals: {
      effects: [{ deviceId: 'grain-delay', preset: 'Crystals', params: { mix: 0.24 } }],
      words: 'with echoes that climb as crystals',
    },
    embers: {
      effects: [{ deviceId: 'grain-delay', preset: 'Falling embers', params: { mix: 0.28 } }],
      words: 'with echoes falling like embers',
    },
    backwards: {
      effects: [{ deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.32 } }],
      words: 'with slow backward echoes',
    },
    mirror: {
      effects: [{ deviceId: 'reverse-delay', preset: 'Long mirror', params: { mix: 0.32 } }],
      words: 'with a long backward mirror',
    },
    stars: {
      effects: [{ deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.32 } }],
      words: 'with seven echoes scattered wide',
    },
    farstar: {
      effects: [
        { deviceId: 'constellation', preset: 'One far star', params: { mix: 0.35 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: 'with one far echo',
    },
    stone: {
      effects: [{ deviceId: 'skipping-stone', preset: 'Skipping stone', params: { mix: 0.32 } }],
      words: 'with echoes that skip like a stone',
    },
    unfold: {
      effects: [{ deviceId: 'prism', preset: 'Slow unfolding', params: { mix: 0.3 } }],
      words: 'unfolding from low to high behind',
    },
    orbits: {
      effects: [{ deviceId: 'orbits', preset: 'Slow phasing', params: { mix: 0.32 } }],
      words: 'with loops that slide apart',
    },
    round: {
      effects: [
        { deviceId: 'canon', preset: 'Faint answer', params: { mix: 0.35 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: 'answered by a faint round',
    },
    fifthround: {
      effects: [{ deviceId: 'canon', preset: 'Canon at the fifth', params: { mix: 0.28 } }],
      words: 'answered a fifth away',
    },
    memory: {
      effects: [{ deviceId: 'echo-memory', preset: 'Hazy past', params: { mix: 0.35 } }],
      words: 'with hazy echoes of what went before',
    },
    loop: {
      effects: [{ deviceId: 'tape-loop', preset: 'Slow fade', params: { mix: 0.32 } }],
      words: 'on a loop that slowly fades',
    },
    bed: {
      effects: [{ deviceId: 'micro-looper', preset: 'Soft bed', params: { mix: 0.28 } }],
      words: 'over a soft looped bed',
    },
    tiles: {
      effects: [{ deviceId: 'cascade', preset: 'Slow tiles', params: { mix: 0.28 } }],
      words: 'with slow tiles of octaves',
    },
    slowchorus: {
      effects: [{ deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } }],
      words: 'on a slow drifting chorus',
    },
    ensemble: {
      effects: [{ deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.4 } }],
      words: 'on a lush ensemble',
    },
    swirl: {
      effects: [
        { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
      ],
      words: 'through a slow swirl',
    },
    jet: {
      effects: [
        { deviceId: 'flanger', preset: 'Glacial drift', params: { mix: 0.35 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'on a glacial comb',
    },
    rotary: {
      effects: [
        { deviceId: 'rotary', preset: 'Chorale' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'through a slow turning horn',
    },
    harmonic: {
      effects: [
        { deviceId: 'tremolo', preset: 'Harmonic shimmer' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
      ],
      words: 'on a shimmering tremolo',
    },
    gentle: {
      effects: [{ deviceId: 'tremolo', preset: 'Gentle breath' }],
      words: 'on a gentle tremolo',
    },
    pan: {
      effects: [
        { deviceId: 'tremolo', preset: 'Slow pan' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: 'swaying slowly from side to side',
    },
    currents: {
      effects: [{ deviceId: 'currents', preset: 'Slow water' }],
      words: 'each band on a slow current of its own',
    },
    glimmer: {
      effects: [{ deviceId: 'glimmer', preset: 'Light on water' }],
      words: 'with the partials catching the light',
    },
    flock: {
      effects: [{ deviceId: 'murmuration', preset: 'Evening flock', params: { mix: 0.45 } }],
      words: 'in a flock that wheels about',
    },
    breath: {
      effects: [
        { deviceId: 'breath', preset: 'Calm breath' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: 'on a slow breath',
    },
    gates: {
      effects: [
        { deviceId: 'pulses', preset: 'Slow drift', params: { floor: 0.4 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
      ],
      words: 'through two drifting gates',
    },
    singer: {
      effects: [
        { deviceId: 'late-vibrato', preset: 'Singer' },
        { deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.22 } },
      ],
      words: "with a singer's late vibrato",
    },
    wander: {
      effects: [
        { deviceId: 'around', preset: 'Slow wander' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: 'wandering round the head',
    },
    glacier: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.18 } },
      ],
      words: 'through a filter that opens by inches',
    },
    notch: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Slow notch' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'with a slow notch moving through',
    },
    touch: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Soft bloom', params: { driveDb: 3 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
      ],
      words: 'through a filter that opens to the touch',
    },
    lowpulse: {
      effects: [
        { deviceId: 'band-pulse', preset: 'Slow low pulse', params: { depth: 0.8 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'with a slow pulse down low',
    },
    winding: {
      effects: [
        { deviceId: 'winding-down', preset: 'Four slowing' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
      ],
      words: 'on a pulse that keeps slowing',
    },
    cassette: {
      effects: [{ deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.1 } }],
      words: 'on a worn cassette',
    },
    record: {
      effects: [
        {
          deviceId: 'vinyl',
          preset: 'Dust and scratches',
          params: { crackle: 0.15, pops: 0.05, surface: 0.1 },
        },
      ],
      words: 'off a dusty record',
    },
    kitchen: {
      effects: [
        {
          deviceId: 'radio',
          preset: 'Kitchen radio',
          params: { mix: 0.6, static: 0.03, interference: 0 },
        },
      ],
      words: 'from a kitchen radio',
    },
    early: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Glaze' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
      ],
      words: 'through an early converter',
    },
    shallows: {
      effects: [{ deviceId: 'underwater', preset: 'Just under', params: { bubbles: 0.15 } }],
      words: 'just under water',
    },
    cloud: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.34 } }],
      words: 'into a soft cloud of grains',
    },
    veilgrain: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Thin veil', params: { mix: 0.4 } }],
      words: 'through a thin veil of grains',
    },
    choirgrain: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Choir of fifths', params: { mix: 0.24 } }],
      words: 'with a grain choir in fifths',
    },
    mist: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.36 } }],
      words: 'hanging in a spectral mist',
    },
    water: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.4 } }],
      words: 'smeared into dark water',
    },
    stretch: {
      effects: [{ deviceId: 'stretch', preset: 'Half time haze', params: { mix: 0.36 } }],
      words: 'with a half time haze behind',
    },
    bowedbed: {
      effects: [{ deviceId: 'sustainer', preset: 'Slow strings', params: { mix: 0.3 } }],
      words: 'with a slow bowed bed beneath',
    },
    sines: {
      effects: [{ deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.32 } }],
      words: 'with an octave of sines behind',
    },
    sparks: {
      effects: [
        { deviceId: 'glints', preset: 'First light', params: { mix: 0.22 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'with first sparks above',
    },
    leaves: {
      effects: [{ deviceId: 'falling', preset: 'Falling leaves', params: { mix: 0.32 } }],
      words: 'with pieces falling off like leaves',
    },
    melt: {
      effects: [{ deviceId: 'melt', preset: 'Slow melt', params: { mix: 0.32 } }],
      words: 'with a tail that melts and sags',
    },
    evaporate: {
      effects: [{ deviceId: 'melt', preset: 'Evaporate', params: { mix: 0.32 } }],
      words: 'with a tail that thins into air',
    },
    dissolve: {
      effects: [{ deviceId: 'generations', preset: 'Into the room', params: { mix: 0.36 } }],
      words: 'dissolving into the room',
    },
    chime: {
      effects: [
        { deviceId: 'warp', preset: 'Soft chime', params: { mix: 0.35 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
      ],
      words: 'with the partials stretched a little',
    },
    evening: {
      effects: [{ deviceId: 'seasons', preset: 'Long evening', params: { turn: 0 } }],
      words: 'at the end of a long evening',
    },
    frost: {
      effects: [{ deviceId: 'seasons', preset: 'First frost', params: { turn: 0 } }],
      words: 'in a first frost',
    },
    rain: {
      effects: [{ deviceId: 'weather', preset: 'Light rain', params: { voice: 0.25 } }],
      words: 'in light rain',
    },
    surf: {
      effects: [{ deviceId: 'weather', preset: 'Slow surf', params: { voice: 0.2 } }],
      words: 'in slow surf',
    },
    behindglass: {
      effects: [
        { deviceId: 'low-bitrate', preset: 'Behind glass', params: { loss: 0.3, mix: 0.6 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'behind glass',
    },
    faintoct: {
      effects: [
        { deviceId: 'octaves', preset: 'Faint octave' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: 'with a faint octave above',
    },
    flutes: {
      effects: [
        { deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.18 } },
      ],
      words: 'doubled by flute stops',
    },
    below: {
      effects: [
        { deviceId: 'pitch-shifter', preset: 'Pad below', params: { mix: 0.28 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'with a pad an octave below',
    },
    halfspeed: {
      effects: [{ deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.35 } }],
      words: 'with a half speed copy beneath',
    },
    driftshift: {
      effects: [
        { deviceId: 'freq-shifter', preset: 'Slow drift', params: { mix: 0.35 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
      ],
      words: 'beating against a drifting copy',
    },
    larger: {
      effects: [
        { deviceId: 'size', preset: 'Larger' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'in a body made larger',
    },
    pedal: {
      effects: [{ deviceId: 'sympathetic', preset: 'Piano pedal', params: { mix: 0.32 } }],
      words: 'with the piano strings left open',
    },
    silent: {
      effects: [
        { deviceId: 'silent-keys', preset: 'Minor seven held', params: { mix: 0.35, root1: 26 } },
      ],
      words: 'waking silent strings',
    },
    bowls: {
      effects: [{ deviceId: 'bowls', preset: 'Faint halo', params: { mix: 0.3 } }],
      words: 'among singing bowls',
    },
    cistern: {
      effects: [{ deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.36 } }],
      words: 'in a cistern',
    },
    roundvowel: {
      effects: [
        { deviceId: 'imprint', preset: 'Round vowel', params: { amount: 0.8 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'in a round vowel',
    },
    overtone: {
      effects: [
        { deviceId: 'overtone-singer', preset: 'Overtone melody', params: { root: 2, mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.18 } },
      ],
      words: 'with a whistled overtone drawn out',
    },
    howl: {
      effects: [{ deviceId: 'howl', preset: 'Faint sustain', params: { mix: 0.3 } }],
      words: 'with a faint sustain from the room',
    },
    paper: {
      effects: [
        { deviceId: 'buzzing-bridge', preset: 'Paper edge', params: { amount: 0.35, mix: 0.5 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: 'with a paper edge',
    },
    reveal: {
      effects: [
        { deviceId: 'reveal', preset: 'Gentle opening' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: 'with the quiet parts brought up',
    },
    tails: {
      effects: [
        { deviceId: 'lift', preset: 'Just the ends' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'with only the tails raised',
    },
    swelled: {
      effects: [
        { deviceId: 'swell', preset: 'Bowed' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
      ],
      words: 'bowed in by a slow pedal',
    },
    drifter: {
      effects: [{ deviceId: 'spectral-drifter', preset: 'Octave halo', params: { mix: 0.26 } }],
      words: 'with an octave halo that drifts',
    },
    strings: {
      effects: [{ deviceId: 'pad-follower', preset: 'String pad', params: { mix: 0.3 } }],
      words: 'with a soft string pad grown behind',
    },
    common: {
      effects: [
        { deviceId: 'common-tones', preset: 'Hanging notes', params: { mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'with shared tones left hanging',
    },
    limit: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 4 } },
        { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.12 } },
      ],
      words: 'pressed up close',
    },
    limitroom: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 4 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.25 } },
      ],
      words: 'pressed up close in a room',
    },
    limitslap: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 4 } },
        { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.25 } },
      ],
      words: 'pressed close, with one slap',
    },
    limitspring: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 4 } },
        { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.22 } },
      ],
      words: 'pressed close into a spring tank',
    },
    limitecho: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 4 } },
        { deviceId: 'analog-delay', preset: 'Clean echo', params: { mix: 0.28 } },
      ],
      words: 'pressed close, with a clean echo',
    },
    limittape: {
      effects: [
        { deviceId: 'tape', preset: 'Hot glue' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 4 } },
      ],
      words: 'pressed on tape',
    },
    levelled: {
      effects: [
        { deviceId: 'ambient-comp', preset: 'Keys', params: { makeup: 4 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'evened by a slow hand, in a room',
    },
    frozen: {
      effects: [{ deviceId: 'sustainer', preset: 'Frozen moment', params: { mix: 0.3 } }],
      words: 'with moments held frozen behind',
    },
    stumble: {
      effects: [
        { deviceId: 'glitch', preset: 'Gentle stumble', params: { mix: 0.6 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: 'with gentle stumbles in the memory',
    },
    airroom: {
      effects: [
        { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -58 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
      ],
      words: 'with the air of a room left in',
    },
  },
  phrases: {
    ninth: {
      notes: [
        { atSec: 0, durSec: 6.6, note: 50, gain: 0.88 },
        { atSec: 0.1, durSec: 6.5, note: 57, gain: 0.75 },
        { atSec: 0.3, durSec: 6.3, note: 65, gain: 0.75 },
        { atSec: 0.5, durSec: 6.1, note: 72, gain: 0.68 },
        { atSec: 0.8, durSec: 5.8, note: 76, gain: 0.68 },
      ],
    },
    suspended: {
      notes: [
        { atSec: 0, durSec: 6.9, note: 43, gain: 0.88 },
        { atSec: 0, durSec: 6.9, note: 50, gain: 0.75 },
        { atSec: 0.4, durSec: 6.5, note: 67, gain: 0.75 },
        { atSec: 0, durSec: 3.2, note: 60, gain: 0.83 },
        { atSec: 3.2, durSec: 3.7, note: 59, gain: 0.75 },
      ],
    },
    oblique: {
      notes: [
        { atSec: 0, durSec: 3.5, note: 53, gain: 0.83 },
        { atSec: 0, durSec: 7, note: 60, gain: 0.75 },
        { atSec: 0, durSec: 3.5, note: 64, gain: 0.75 },
        { atSec: 0, durSec: 3.5, note: 69, gain: 0.75 },
        { atSec: 3.5, durSec: 3.5, note: 52, gain: 0.83 },
        { atSec: 3.5, durSec: 3.5, note: 62, gain: 0.75 },
        { atSec: 3.5, durSec: 3.5, note: 67, gain: 0.68 },
      ],
    },
    spires: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 38, gain: 0.88 },
        { atSec: 0.9, durSec: 6.3, note: 45, gain: 0.75 },
        { atSec: 1.8, durSec: 5.4, note: 57, gain: 0.75 },
        { atSec: 2.7, durSec: 4.5, note: 64, gain: 0.75 },
        { atSec: 3.6, durSec: 3.6, note: 71, gain: 0.68 },
      ],
    },
    highveil: {
      notes: [
        { atSec: 0, durSec: 6.8, note: 64, gain: 0.75 },
        { atSec: 0, durSec: 6.8, note: 71, gain: 0.75 },
        { atSec: 0.6, durSec: 6.2, note: 74, gain: 0.68 },
        { atSec: 1.2, durSec: 5.6, note: 79, gain: 0.6 },
      ],
    },
    turned: {
      notes: [
        { atSec: 0, durSec: 7, note: 52, gain: 0.75 },
        { atSec: 0, durSec: 7, note: 59, gain: 0.75 },
        { atSec: 0, durSec: 7, note: 64, gain: 0.68 },
        { atSec: 2, durSec: 1.6, note: 67, gain: 0.83 },
        { atSec: 3.6, durSec: 1.6, note: 74, gain: 0.75 },
        { atSec: 5.2, durSec: 1.8, note: 69, gain: 0.75 },
      ],
    },
    walking: {
      notes: [
        { atSec: 0, durSec: 1.8, note: 50, gain: 0.88 },
        { atSec: 0, durSec: 1.2, note: 69, gain: 0.88 },
        { atSec: 1.2, durSec: 0.9, note: 67, gain: 0.68 },
        { atSec: 1.8, durSec: 1.8, note: 52, gain: 0.83 },
        { atSec: 2.4, durSec: 1.2, note: 72, gain: 0.88 },
        { atSec: 3.6, durSec: 1.8, note: 53, gain: 0.88 },
        { atSec: 3.6, durSec: 1.5, note: 69, gain: 0.75 },
        { atSec: 4.8, durSec: 0.7, note: 67, gain: 0.68 },
        { atSec: 5.4, durSec: 1.9, note: 48, gain: 0.88 },
        { atSec: 5.6, durSec: 1.7, note: 64, gain: 0.75 },
      ],
    },
    twohands: {
      notes: [
        { atSec: 0, durSec: 2.9, note: 45, gain: 0.88 },
        { atSec: 0.35, durSec: 2.6, note: 52, gain: 0.75 },
        { atSec: 0.7, durSec: 2.3, note: 60, gain: 0.75 },
        { atSec: 1.05, durSec: 2, note: 64, gain: 0.68 },
        { atSec: 1.4, durSec: 1.7, note: 71, gain: 0.83 },
        { atSec: 3.3, durSec: 3.4, note: 43, gain: 0.88 },
        { atSec: 3.65, durSec: 3, note: 53, gain: 0.75 },
        { atSec: 4, durSec: 2.7, note: 59, gain: 0.75 },
        { atSec: 4.35, durSec: 2.4, note: 64, gain: 0.68 },
        { atSec: 4.7, durSec: 2.2, note: 69, gain: 0.83 },
      ],
    },
    ostinato: {
      notes: [
        { atSec: 0, durSec: 0.6, note: 57, gain: 0.83 },
        { atSec: 0.7, durSec: 0.6, note: 64, gain: 0.68 },
        { atSec: 1.4, durSec: 0.6, note: 57, gain: 0.75 },
        { atSec: 2.1, durSec: 0.6, note: 64, gain: 0.68 },
        { atSec: 2.8, durSec: 0.6, note: 57, gain: 0.83 },
        { atSec: 3.5, durSec: 0.6, note: 64, gain: 0.68 },
        { atSec: 4.2, durSec: 0.6, note: 57, gain: 0.75 },
        { atSec: 4.9, durSec: 1.6, note: 64, gain: 0.68 },
        { atSec: 0, durSec: 1.3, note: 72, gain: 0.88 },
        { atSec: 1.4, durSec: 1.3, note: 71, gain: 0.83 },
        { atSec: 2.8, durSec: 1.3, note: 69, gain: 0.83 },
        { atSec: 4.2, durSec: 2.3, note: 67, gain: 0.88 },
      ],
    },
    drops: {
      notes: [
        { atSec: 0, durSec: 0.35, note: 76, gain: 0.88 },
        { atSec: 0.7, durSec: 0.35, note: 69, gain: 0.75 },
        { atSec: 1.1, durSec: 0.35, note: 72, gain: 0.83 },
        { atSec: 2.2, durSec: 0.35, note: 64, gain: 0.88 },
        { atSec: 3, durSec: 0.35, note: 81, gain: 0.75 },
        { atSec: 4.4, durSec: 0.6, note: 67, gain: 0.88 },
        { atSec: 5, durSec: 0.6, note: 60, gain: 0.68 },
      ],
    },
    downpour: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 81, gain: 0.75 },
        { atSec: 0.4, durSec: 0.5, note: 79, gain: 0.75 },
        { atSec: 0.8, durSec: 0.5, note: 76, gain: 0.75 },
        { atSec: 1.2, durSec: 0.5, note: 74, gain: 0.83 },
        { atSec: 1.6, durSec: 0.5, note: 72, gain: 0.75 },
        { atSec: 2, durSec: 0.5, note: 69, gain: 0.83 },
        { atSec: 2.4, durSec: 0.5, note: 67, gain: 0.75 },
        { atSec: 2.8, durSec: 0.5, note: 64, gain: 0.83 },
        { atSec: 3.3, durSec: 0.5, note: 62, gain: 0.83 },
        { atSec: 3.9, durSec: 0.6, note: 60, gain: 0.83 },
        { atSec: 4.6, durSec: 0.6, note: 57, gain: 0.88 },
        { atSec: 5.4, durSec: 1.4, note: 50, gain: 0.88 },
      ],
    },
    lowpluck: {
      notes: [
        { atSec: 0, durSec: 1.2, note: 40, gain: 0.88 },
        { atSec: 0.7, durSec: 1, note: 52, gain: 0.75 },
        { atSec: 1.2, durSec: 1, note: 55, gain: 0.75 },
        { atSec: 1.9, durSec: 1, note: 59, gain: 0.75 },
        { atSec: 2.8, durSec: 1.2, note: 36, gain: 0.88 },
        { atSec: 3.5, durSec: 1, note: 48, gain: 0.75 },
        { atSec: 4, durSec: 1, note: 55, gain: 0.75 },
        { atSec: 4.7, durSec: 1.4, note: 64, gain: 0.75 },
      ],
    },
    floor: {
      notes: [
        { atSec: 0, durSec: 1.8, note: 38, gain: 0.88 },
        { atSec: 2, durSec: 1.2, note: 41, gain: 0.88 },
        { atSec: 3.4, durSec: 1.4, note: 36, gain: 0.88 },
        { atSec: 5, durSec: 2.2, note: 33, gain: 0.88 },
      ],
    },
    treads: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 33, gain: 0.88 },
        { atSec: 0.9, durSec: 0.4, note: 33, gain: 0.75 },
        { atSec: 1.8, durSec: 0.5, note: 40, gain: 0.88 },
        { atSec: 2.7, durSec: 0.4, note: 38, gain: 0.83 },
        { atSec: 3.6, durSec: 0.8, note: 36, gain: 0.88 },
        { atSec: 4.6, durSec: 0.5, note: 31, gain: 0.88 },
        { atSec: 5.5, durSec: 1.6, note: 33, gain: 0.88 },
      ],
    },
    keel: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 45, gain: 0.88 },
        { atSec: 1.8, durSec: 0.9, note: 48, gain: 0.75 },
        { atSec: 2.8, durSec: 1.5, note: 43, gain: 0.88 },
        { atSec: 4.5, durSec: 2.6, note: 41, gain: 0.88 },
      ],
    },
    anchor: {
      notes: [
        { atSec: 0, durSec: 3.2, note: 31, gain: 0.88 },
        { atSec: 3.5, durSec: 3.6, note: 36, gain: 0.88 },
      ],
    },
    tower: {
      notes: [
        { atSec: 0, durSec: 0.9, note: 72, gain: 0.88 },
        { atSec: 1.4, durSec: 0.9, note: 67, gain: 0.83 },
        { atSec: 2.8, durSec: 0.9, note: 76, gain: 0.88 },
        { atSec: 4.2, durSec: 1.2, note: 64, gain: 0.88 },
        { atSec: 4.2, durSec: 1.2, note: 71, gain: 0.75 },
      ],
    },
    highpeal: {
      notes: [
        { atSec: 0, durSec: 0.6, note: 84, gain: 0.75 },
        { atSec: 1.1, durSec: 0.6, note: 79, gain: 0.75 },
        { atSec: 2, durSec: 0.6, note: 88, gain: 0.68 },
        { atSec: 3.4, durSec: 0.6, note: 83, gain: 0.75 },
        { atSec: 4.6, durSec: 0.8, note: 76, gain: 0.83 },
      ],
    },
    lowpeal: {
      notes: [
        { atSec: 0, durSec: 1.4, note: 48, gain: 0.88 },
        { atSec: 1.9, durSec: 1.4, note: 55, gain: 0.88 },
        { atSec: 3.6, durSec: 1.4, note: 53, gain: 0.88 },
        { atSec: 5.2, durSec: 1.6, note: 60, gain: 0.83 },
      ],
    },
    palindrome: {
      notes: [
        { atSec: 0, durSec: 0.8, note: 64, gain: 0.83 },
        { atSec: 0.8, durSec: 0.8, note: 67, gain: 0.75 },
        { atSec: 1.6, durSec: 0.8, note: 71, gain: 0.83 },
        { atSec: 2.4, durSec: 0.8, note: 74, gain: 0.88 },
        { atSec: 3.2, durSec: 0.8, note: 71, gain: 0.83 },
        { atSec: 4, durSec: 0.8, note: 67, gain: 0.75 },
        { atSec: 4.8, durSec: 1.6, note: 64, gain: 0.83 },
      ],
    },
    ground: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 38, gain: 0.88 },
        { atSec: 0.4, durSec: 6.8, note: 45, gain: 0.75 },
        { atSec: 1.6, durSec: 5.6, note: 52, gain: 0.68 },
        { atSec: 3, durSec: 4.2, note: 62, gain: 0.6 },
      ],
    },
    hymn: {
      notes: [
        { atSec: 0, durSec: 2.3, note: 52, gain: 0.83 },
        { atSec: 0, durSec: 2.3, note: 59, gain: 0.75 },
        { atSec: 0, durSec: 2.3, note: 64, gain: 0.75 },
        { atSec: 0, durSec: 2.3, note: 67, gain: 0.75 },
        { atSec: 2.3, durSec: 2.2, note: 53, gain: 0.83 },
        { atSec: 2.3, durSec: 2.2, note: 57, gain: 0.75 },
        { atSec: 2.3, durSec: 2.2, note: 60, gain: 0.75 },
        { atSec: 2.3, durSec: 2.2, note: 69, gain: 0.83 },
        { atSec: 4.5, durSec: 2.8, note: 48, gain: 0.88 },
        { atSec: 4.5, durSec: 2.8, note: 60, gain: 0.75 },
        { atSec: 4.5, durSec: 2.8, note: 64, gain: 0.75 },
        { atSec: 4.5, durSec: 2.8, note: 67, gain: 0.75 },
      ],
    },
    chantline: {
      notes: [
        { atSec: 0, durSec: 2, note: 64, gain: 0.88 },
        { atSec: 1.9, durSec: 1.4, note: 67, gain: 0.83 },
        { atSec: 3.2, durSec: 1.3, note: 69, gain: 0.88 },
        { atSec: 4.4, durSec: 2.8, note: 71, gain: 0.83 },
      ],
    },
    neighbours: {
      notes: [
        { atSec: 0, durSec: 6.8, note: 57, gain: 0.83 },
        { atSec: 1, durSec: 0.8, note: 60, gain: 0.75 },
        { atSec: 2, durSec: 0.8, note: 59, gain: 0.75 },
        { atSec: 3, durSec: 0.8, note: 62, gain: 0.83 },
        { atSec: 4, durSec: 0.8, note: 60, gain: 0.75 },
        { atSec: 5, durSec: 1.6, note: 64, gain: 0.75 },
      ],
    },
    gears: {
      notes: [
        { atSec: 0, durSec: 6.6, note: 53, gain: 0.75 },
        { atSec: 0, durSec: 6.6, note: 60, gain: 0.75 },
        { atSec: 0, durSec: 6.6, note: 64, gain: 0.75 },
        { atSec: 0, durSec: 6.6, note: 67, gain: 0.68 },
        { atSec: 2.2, durSec: 0.6, note: 62, gain: 0.75 },
        { atSec: 3.8, durSec: 0.6, note: 69, gain: 0.75 },
      ],
    },
  },
  directions: [
    {
      id: 'hovering-pads',
      name: 'Hovering pads',
      category: 'pad',
      rows: `
Lantern left burning | Hovering glass pad | tilt=-.95 frame=420 attack=1.8 sand=4.5 depth=.2 exchange=.9 beat=.3 ears=.5 volume=-0.5 pour=.85 | hall | ninth | Dark glass that opens over two seconds and then lingers by its beginning
Window above the snow | Hovering glass pad | attack=.6 sand=2 depth=.55 inertia=.4 beat=2.6 ears=1 grains=0 volume=-2.5 tilt=-.6 frame=950 settling=20 | frost | oblique | Cool glass that hovers and shimmers quickly from ear to ear
Fogged by a mouth | Hovering glass pad | tilt=-.51 frame=740 attack=.35 sand=.9 depth=.7 pour=.7 exchange=.15 grains=.5 ears=.2 apart=.3 | thinveil | oblique | Glass that clouds over and clears again, with a soft pouring of sand
Cold room, warm wall | Hovering glass pad | tilt=0 frame=300 attack=3.8 sand=7 depth=.6 split=-.5 exchange=.5 beat=.9 release=9 volume=-2 pour=.8 | wool | ninth | Boxy glass, very slow to speak, its high partials drawn the other way
Tumbler on a piano lid | Hovering glass pad | tilt=-.45 frame=700 strike=.45 attack=.03 sand=1.6 depth=.45 neck=Strike exchange=.35 beat=.2 release=3 volume=-2.5 apart=.25 settling=15 | pedal | turned | Glass touched rather than swelled, tapping softly each time it lands
Rosin in lamplight | Hovering hum | body=String tilt=-.3 frame=420 attack=1.4 sand=2.4 depth=.4 exchange=.8 beat=1.6 ears=.7 split=.3 volume=0 | longplate | ninth | Bowed strings that hang about their beginning and beat slowly
Cellos behind a curtain | Hovering hum | body=String tilt=-.85 frame=170 attack=2.2 sand=1.2 depth=.65 inertia=.9 ears=.2 beat=.5 release=7 pour=.9 apart=.15 | muffled | suspended | Very dark low strings that lean a long time into every turn
Hair of the bow only | - | body=String neck=Hover tilt=.65 frame=2000 strike=0 attack=.9 sand=1.8 depth=.3 exchange=1 grains=.15 beat=.8 ears=.9 split=-.4 volume=-2 | airy | highveil | Thin strings whose overtones keep trading places at the neck
Gut and horsehair | - | body=String neck=Hover tilt=.1 frame=620 strike=.2 attack=.25 sand=.7 depth=.5 settling=35 exchange=.3 beat=.15 ears=.4 volume=0.5 pour=.25 | ensemble | oblique | Strings that bend a little sharp whenever they come near their beginning
Quartet fallen asleep | - | body=String neck=Hover tilt=-.2 frame=900 strike=0 attack=3.2 sand=10 depth=.8 pour=.8 apart=.6 stagger=.6 ears=.6 release=8 volume=-10 | summer | ninth | Strings that start apart along the sand and wander home one by one
Harmonium in a cellar | - | body=Reed neck=Hover tilt=-.6 frame=240 strike=0 attack=.8 sand=2.2 depth=.12 exchange=.2 beat=.7 ears=.3 grains=0 release=3 volume=-1 split=.2 | cistern | suspended | Dark reeds that hold close and only breathe
Reeds on the sill | - | body=Reed neck=Hover tilt=.3 frame=1100 strike=.05 attack=.5 sand=1.1 depth=.6 exchange=.6 beat=1.2 ears=.8 grains=0 release=4 volume=3.5 apart=.35 pour=.7 | faintair | oblique | Nasal reeds that fade by half and hover back, wide and beating
Lungs of a small organ | Opposed drone | neck=Hover split=.4 frame=350 attack=1.1 sand=5 depth=.5 tilt=-.2 beat=.25 ears=.5 release=5 volume=-0.5 | breathing | ninth | Reeds whose even partials swell while the odd ones sink, all without hurry
Sleeper in the next room | Hovering hum | body=Reed frame=150 tilt=-1 attack=1.5 sand=3.5 depth=.7 inertia=.5 beat=.4 ears=.1 release=4 volume=-1 pour=.85 | nextdoor | suspended | The roundest reeds, sinking and drawn back like a sleeper's breath
Kettle about to sing | - | body=Reed neck=Hover tilt=.8 frame=2700 strike=0 attack=1.9 sand=1.5 depth=.45 exchange=.9 beat=2 grains=.2 ears=.6 release=5 volume=1 apart=.2 split=.3 | kettle | highveil | Thin high reeds, a glassy frame about them and a hiss of sand below
Bells under a blanket | - | body=Bell neck=Hover tilt=-.8 frame=260 strike=0 attack=.7 sand=2.6 depth=.4 exchange=.6 beat=1.1 ears=.6 release=6 settling=25 split=.25 volume=-1.5 | darkhall | ninth | Bells without a strike, so round that only a hum is left to hover
Carillon seen from afar | - | body=Bell neck=Hover tilt=.2 frame=1700 strike=.1 attack=.4 sand=1.3 depth=.6 apart=.7 stagger=.5 exchange=.4 beat=.6 ears=1 release=8 volume=0.5 pour=.75 | expanse | ninth | Clear bells spread along the sand, each nearing its beginning in its own time
Votive candles | High tide of bells | neck=Hover split=-.3 tilt=.1 frame=1200 attack=1.2 sand=5 depth=.3 beat=1.8 grains=.5 ears=.7 volume=0 settling=30 | sparks | highveil | High bells that speak slowly and flicker, with a fine fall of grains
Green on old bronze | High tide of bells | neck=Hover split=-.8 tilt=-.3 frame=480 attack=2 sand=3 depth=.75 exchange=.8 beat=.4 release=10 | cave | oblique | Old dull bells, the high partials rising as the low ones sink
Halo round a bell jar | - | body=Bell neck=Hover tilt=-.4 frame=820 strike=0 attack=1 sand=.8 depth=.5 settling=70 exchange=.2 beat=.3 grains=0 ears=.5 release=7 volume=4.5 pour=.3 | swirl | turned | Unhurried bells that bend well sharp each time they come back to the neck
Wooden ribs, humming | Hovering hum | tilt=-.2 frame=330 attack=.9 sand=2.8 depth=.6 beat=2.2 ears=.8 volume=1.5 pour=.9 apart=.2 grains=.15 | wood | ninth | Round bars that hum without a knock, beating twice a second
Planks over deep water | Hovering hum | tilt=-.9 frame=130 attack=1.6 sand=5 depth=.1 inertia=.6 exchange=.2 beat=.2 ears=.4 release=9 pour=.7 | water | suspended | Low bars, nearly a pure tone, hardly fading at all
Marimba dreaming | Hovering hum | tilt=.4 frame=1300 strike=.3 attack=.08 sand=1 depth=.7 pour=.15 exchange=.7 beat=.6 volume=-1 apart=.4 | flock | oblique | Bars that fall quickly and wait faintly before they come home
Cedar chest opened | - | body=Bar neck=Hover tilt=.8 frame=700 strike=0 attack=.6 sand=1.8 depth=.4 exchange=1 beat=.9 grains=.35 ears=.7 release=5 volume=-1 split=.35 | roundvowel | ninth | Bars leaning on their double octave, the overtones passing it about
Long corridor of doors | - | body=Bar neck=Hover tilt=.1 frame=460 strike=.1 attack=.5 sand=4 depth=.9 pour=.9 stagger=.9 beat=1.4 ears=.9 grains=0 release=7 volume=-2.5 | latehall | spires | Bars that stay full for long, then empty and find their way back
Skin of a still pond | Dust on a skin | neck=Hover tilt=-.5 frame=280 strike=0 attack=.9 sand=3 depth=.4 split=0 settling=10 grains=.2 beat=.7 volume=-3 apart=.3 | shallows | ninth | A drum head made to sing softly, hovering with hardly any dust
Tent in a dry wind | Dust on a skin | neck=Hover tilt=.2 frame=900 attack=1.5 sand=1.4 depth=.6 split=0 settling=20 grains=.8 exchange=.4 beat=1.3 ears=.8 volume=0 pour=.8 | flock 1.mix=0.3 | oblique | Slow skins with sand blown over them all the time
Parchment held to light | Dust on a skin | neck=Hover tilt=.6 frame=1900 attack=.4 sand=5 depth=.55 split=-.7 settling=60 grains=.4 exchange=.7 ears=.5 release=7 volume=-3 | glimmer | highveil | Skins leaning up to their overtones, which run against the sand
Heart of a large drum | - | body=Skin neck=Hover tilt=-.6 frame=160 strike=0 attack=.6 sand=1.1 depth=.5 inertia=.7 exchange=.3 beat=.5 ears=.2 grains=.05 release=5 settling=20 | warm | suspended | Low drums with no stroke, filling and emptying once a breath
Saddle soap and leather | - | body=Skin neck=Hover tilt=0 frame=560 strike=.1 attack=.2 sand=2.2 depth=.75 settling=110 exchange=.6 beat=2 grains=.1 ears=.6 release=6 volume=-1.5 apart=.2 | record | turned | Skins that slide down into tune and slide up again at each return
Tides that cancel | Opposed drone | neck=Hover body=Glass tilt=-.52 frame=590 attack=1.3 sand=2.5 depth=.5 exchange=.3 beat=1 ears=.6 volume=0 | currents | ninth | Glass split in two halves that hover at opposite ends of the sand
Shadows trade places | Opposed drone | neck=Hover body=String tilt=-.1 frame=560 attack=1 sand=6 beat=.6 volume=6 turn=New_key depth=.45 split=.6 | longdark | suspended | Strings with odd and even partials trading the light over many seconds
Ceiling of a boathouse | Opposed drone | neck=Hover body=Bell split=-1 tilt=.3 frame=1500 attack=.7 sand=1.3 depth=.6 exchange=.5 beat=.9 volume=-1 | shallows 1.depth=0.35 | oblique | Bells whose top swells as their hum sinks, quick as reflected light
Both ends of a candle | Opposed drone | neck=Hover body=Bar tilt=.7 frame=420 attack=.5 sand=1.8 depth=.7 exchange=.8 beat=1.7 ears=1 volume=2 | pan | oblique | Bars split between the ears, one set growing while the other goes
Mirror behind the reeds | Opposed drone | neck=Hover tilt=.5 frame=1600 attack=.9 sand=1 depth=.4 split=.7 exchange=.15 beat=.1 ears=.9 volume=3 | bloom | highveil | High reeds in two bands that cross every few seconds, still and clear
Once a minute, a lamp | Long glass | neck=Hover attack=1.5 sand=24 depth=.8 pour=.95 exchange=.6 beat=.5 grains=.1 volume=1 tilt=-.66 frame=440 apart=.4 | horizon | ninth | Glass on nearly half a minute of sand, very slow to leave its beginning
Moon through gauze | Long glass | neck=Hover attack=2 sand=9 depth=.5 pour=.4 settling=5 exchange=1 beat=1.4 grains=.3 ears=.6 volume=-5.5 tilt=-.83 frame=740 split=.4 | mist | ninth | Glass that thins and thickens over many seconds
Stairwell after hours | Long glass | body=Reed neck=Hover tilt=-.4 frame=480 attack=1 sand=12 depth=.7 pour=.8 exchange=.8 beat=.3 grains=0 settling=0 volume=-1 apart=.3 split=.25 | cathedral | suspended | Reeds that take twelve seconds to empty and stay long at the neck
Library after the rain | Long glass | body=String neck=Hover tilt=-.6 frame=350 strike=.1 attack=.7 sand=16 depth=1 pour=.8 exchange=.5 beat=.8 grains=.6 ears=.5 release=10 apart=.5 | rain | ninth | Dark strings held full for long, with sand pouring under them
Salt flat at noon | Long glass | body=Bar neck=Hover tilt=.3 frame=2000 strike=.05 attack=1.2 sand=8 depth=.6 settling=0 exchange=.9 beat=2.4 grains=.2 ears=1 volume=6 apart=.6 | evaporate | highveil | High bars with no knock, flickering wide for eight seconds at a time
Small motor of light | Hovering hum | body=Glass tilt=-.25 frame=950 attack=.3 sand=.35 depth=.5 inertia=.2 exchange=.4 beat=.2 ears=.6 release=3 apart=.2 volume=-0.5 | gentle | oblique | Glass whose sand is out in a third of a second, so it pulses by itself
Gnats over still water | Hovering hum | body=Reed tilt=.6 frame=1800 attack=.5 sand=.25 depth=.35 inertia=.1 stagger=1 beat=3.5 ears=1 volume=6 apart=.4 split=.5 | wander | highveil | Reeds fluttering fast, the high keys quicker than the low
Ferry with engines idle | Hovering hum | body=String tilt=-.5 frame=200 attack=.4 sand=.4 depth=.65 inertia=.05 exchange=.03 beat=.9 ears=.3 release=3 volume=-0.5 pour=.8 settling=20 | cassette | suspended | Low strings that throb on a short sand with hardly any weight
Quartz in the walls | Hovering hum | body=Bell tilt=.4 frame=2300 attack=.15 sand=.5 depth=.8 apart=1 stagger=.3 exchange=.3 beat=.4 ears=.8 release=5 volume=5 | reveal | highveil | Bells pulsing out of step, each key of the chord at its own place
Slow fan in August | Hovering hum | body=Skin tilt=.1 frame=440 attack=.8 sand=.6 depth=.55 pour=.8 exchange=.2 beat=.3 grains=.1 ears=.9 release=4 volume=0 | rotary | ninth | Soft skins that swing round like a fan, full for most of the turn
Orchard past its season | - | body=Glass neck=Soften tilt=-.5 frame=380 strike=0 attack=1.4 sand=2 depth=.6 inertia=.8 exchange=.7 beat=.7 grains=.05 ears=.4 release=7 split=-.35 pour=.7 | cloud | ninth | Dark glass met as a round wave each time it comes home
Other side of the glass | - | body=Glass neck=Pass tilt=0 frame=1300 strike=0 attack=1.1 sand=1.5 depth=.5 inertia=.6 exchange=.4 beat=.5 grains=.15 ears=.8 release=6 volume=3 apart=.3 | drifter | oblique | Glass that passes through its beginning and comes out in another colour
Grass on both banks | - | body=Reed neck=Pass tilt=-.3 frame=700 strike=0 attack=1.6 sand=1.2 depth=.35 inertia=.9 exchange=.2 beat=1.3 grains=.25 ears=.7 release=5 volume=-0.5 pour=.8 apart=.4 | valley | suspended | Reeds that cross slowly between an odd colour and an even one
Moths at the hour mark | High tide of bells | neck=Soften tilt=-.2 frame=1600 attack=.9 sand=1.7 depth=.8 split=.6 beat=4.5 grains=.3 | stretch | highveil | Soft bells beating fast, every second partial out of step with time
A room not yet dark | Both bulbs | attack=1.3 tilt=-.4 frame=800 strike=.05 sand=2.4 depth=.6 exchange=.8 beat=.4 ears=.9 release=8 volume=-3.5 apart=.35 settling=18 grains=.2 | evening | ninth | Strings passing from side to side of their beginning, slow and dim
`,
    },
    {
      id: 'turning-keys',
      name: 'Turning keys',
      category: 'keys',
      rows: `
Answer before you ask | Keys that turn | tilt=.2 frame=1100 depth=.65 inertia=.05 exchange=.2 ears=.5 volume=-1 pour=.32 sand=1.5 strike=.5 | chamber | walking | Plucked keys that fall at once and snap back to their pluck with each new key
Latch and hinge | Keys that turn | tilt=-.3 frame=260 strike=.8 sand=.8 depth=.6 pour=.6 inertia=0 stagger=0 grains=.3 beat=0 release=.9 volume=-3 settling=40 | close | ostinato | Short woody strings, turned on the spot with a knock of the hinge
Thread pulled through | Keys that turn | tilt=.6 frame=2400 strike=.4 sand=3.5 depth=.5 pour=.5 memory=.8 exchange=.8 beat=.9 ears=.9 release=3 volume=1 split=.35 | stone | twohands | Thin bright strings with time to glitter before the next key calls them back
Door left on the chain | Keys that turn | tilt=-.6 frame=460 strike=.3 attack=.06 sand=2 depth=.9 inertia=.7 exchange=.5 beat=.5 release=2.5 volume=-3 pour=.7 | cassette | walking | Dull strings that lean heavily into each turn before they come home
Letter opened twice | Keys that turn | tilt=0 frame=620 strike=1 sand=1.6 depth=.65 pour=.4 settling=60 stagger=.6 ears=.7 volume=-7.5 | smallplate | twohands | Hard plucks that bend into tune, and bend out again on the way back
Boxwood under the thumb | Neighbour pulses | apart=0 frame=520 strike=.9 sand=.9 depth=.55 pour=.3 exchange=0 beat=0 release=.6 volume=5 | booth | ostinato | Dry wooden bars with a hard knock at the stroke and at every landing
Stairs down to the boats | Neighbour pulses | apart=.2 tilt=.4 frame=900 strike=.35 sand=2.2 depth=.6 exchange=.6 beat=1.4 ears=.8 release=3 settling=25 split=.3 | repeats | walking | Bars with a ringing double octave, turned lazily from key to key
Slats of a blind | Neighbour pulses | apart=0 body=Bar tilt=.9 frame=1800 strike=.5 sand=.5 depth=.5 inertia=.15 stagger=.5 memory=.5 beat=.4 release=1.2 volume=3.5 settling=20 | slap | - | Thin bright bars on a short sand, each return a little fainter
Sycamore bowl | Neighbour pulses | apart=0 tilt=-.7 frame=180 strike=.55 sand=1.5 depth=.45 neck=Soften exchange=.3 grains=.15 release=2 volume=-1.5 settling=15 pour=.75 | darkplate | twohands | Round bars that come back as a swell and leave the knock behind
Counting in pairs | Neighbour pulses | apart=.2 tilt=.1 frame=700 strike=.6 sand=.7 depth=.9 neck=Pass inertia=.3 beat=.8 ears=1 release=1.6 volume=3.5 split=.2 | pan | ostinato | Bars that pass through their stroke and answer hollow
Bell rope in the hand | - | strike=.6 tilt=.1 frame=800 sand=1.5 depth=.75 pour=.35 inertia=.1 exchange=.2 beat=.2 grains=.05 release=2 volume=0.5 settling=20 | deck | walking | Clear bells that jump back to their stroke as the next one sounds
Spoons on a string | - | tilt=-.07 frame=2010 sand=.6 depth=.6 inertia=0 stagger=.4 settling=90 exchange=.02 beat=.7 ears=.8 release=1 volume=-0.5 strike=.72 | hint | ostinato | Tinny bells, bent at the stroke, turned again and again on a short sand
Clock face in the dark | - | strike=.25 tilt=-.5 frame=500 attack=.04 sand=2.4 depth=.5 neck=Hover inertia=.5 exchange=.7 beat=.9 release=3.5 apart=.3 split=-.3 volume=-1.5 | darkecho | twohands | Dull bells that hang about before they land, in no hurry between keys
Return to sender | - | strike=.5 tilt=.3 frame=1300 sand=1 depth=.95 pour=.85 inertia=.2 exchange=.4 memory=1 ears=.6 release=1.5 volume=0 | reversed | - | Bells that fall to nothing and come all the way back when a key calls
Marble stairs, bare feet | - | strike=.45 tilt=-.2 frame=1900 sand=1.9 depth=.6 split=.8 exchange=.3 beat=1.5 ears=.9 release=2.5 volume=0 | airyroom | walking | Bells whose every second partial grows as the rest fade, until a key turns it
Ice against the pitcher | - | body=Glass strike=.6 sand=1.1 depth=.6 inertia=.1 exchange=.5 grains=.4 beat=.6 ears=.7 release=1.6 volume=-0.5 tilt=-.69 frame=520 apart=.3 | widetop | ostinato | Cool glass keys with a spill of small grains at every turn
Blue bottle, east window | - | body=Glass strike=.3 tilt=-.4 frame=600 sand=2.8 depth=.5 neck=Soften inertia=.4 exchange=.3 beat=.3 release=3 volume=-0.5 pour=.75 split=.25 | bottle | twohands | Round glass keys that come home as a soft wave
Cut crystal, low flame | - | body=Glass strike=.9 tilt=-.2 frame=1030 sand=.7 depth=.85 pour=.1 inertia=.05 settling=40 grains=.1 beat=1 release=1.2 volume=6 | farstar | walking | Hard glass plucks that vanish at once and leap back when turned
Vial in the snow | - | body=Glass strike=.15 tilt=-.14 frame=2530 attack=.12 sand=4 depth=.4 neck=Pass exchange=.8 beat=1.8 ears=1 release=4 volume=1.5 apart=.2 | frost 1.mix=0.6 | turned | Soft glass that passes through its start, its partials always on the move
Thumb on a wet rim | - | body=Glass strike=.1 tilt=-.8 frame=330 attack=.2 sand=1.6 depth=.7 neck=Hover inertia=.6 exchange=.2 beat=.15 ears=.2 release=2.2 pour=.9 | rotary | twohands | Dark rubbed glass keys that hover when they near their beginning
Parlour reed at dusk | - | body=Reed strike=.4 tilt=-.25 frame=1100 attack=.03 sand=1.4 depth=.55 inertia=.2 exchange=.8 grains=0 beat=2.4 release=.8 apart=.2 settling=35 pour=.2 ears=.9 volume=-2 | combo | walking | Reed keys that sag while held and stand up again as another is played
Squeezed and let out | - | body=Reed strike=.6 tilt=.4 frame=1600 sand=.6 depth=.95 pour=.6 neck=Soften inertia=.35 beat=3.2 ears=.6 grains=0 release=.5 volume=2 split=.3 exchange=.7 | doubled | ostinato | Reeds that close and open on half a second of sand, like a small bellows
Toy harmonica, found | - | body=Reed strike=.5 tilt=.7 frame=1600 attack=.02 sand=1 depth=.5 neck=Strike memory=.6 exchange=.5 beat=2.4 settling=50 grains=0 release=.7 volume=0.5 apart=.3 | stumble | - | Pinched reeds, sharp at the start, beating quickly
Clerk at the organ | - | body=Reed strike=0 tilt=-.5 frame=1100 attack=.08 sand=3 depth=.3 neck=Pass inertia=.5 exchange=.1 beat=.1 grains=0 ears=.4 release=1 pour=.9 split=.2 volume=-1 | flutes | twohands | Plain reed keys crossing slowly from an odd colour to an even one
Accordion in the stairs | - | body=Reed strike=.3 tilt=.05 frame=380 attack=.05 sand=.9 depth=.65 inertia=.1 split=.5 beat=3 ears=.8 grains=0 release=.9 volume=1.5 | nextdoor | walking | Reeds in two ranks beating fast, one swelling as the other sinks
Hands on a tabletop | Drum of sand | turn=New_key tilt=-.1 frame=480 sand=1.1 depth=.65 pour=.3 grains=.15 settling=40 beat=.2 memory=1 volume=4.5 | faintair | ostinato | Tuned skins struck hard and turned by the next hand
Paper drum, upstairs | Drum of sand | turn=New_key tilt=.5 frame=1300 strike=.5 sand=.6 depth=.5 grains=.5 settling=20 exchange=.6 ears=.9 release=1 volume=3 split=.4 | paper | walking | Thin skins with dust on them, turned quickly and lightly
Knuckles on a tub | Drum of sand | turn=New_key tilt=-.6 frame=150 strike=1 sand=1.8 depth=.8 settling=140 grains=0 exchange=.1 beat=.4 volume=3.5 pour=.2 | gated | lowpluck | Booming skins that swoop down into tune and up again when turned
Felt over kettledrums | Drum of sand | turn=New_key frame=330 strike=.25 attack=.06 sand=2.5 depth=.4 neck=Hover grains=.1 settling=30 beat=1.2 release=3 volume=1 tilt=0 pour=.75 | felt | lowpeal | Soft low skins that wait near their beginning
Courtyard game | Drum of sand | turn=New_key tilt=.2 frame=800 strike=.7 sand=.45 depth=.9 pour=.5 memory=.8 stagger=.7 grains=.25 release=.6 volume=-1 apart=.3 | patter | ostinato | Short dry skins, the high ones much quicker than the low
Held, then given back | Palindrome bells | body=String tilt=.1 frame=700 strike=.6 sand=1 depth=.7 pour=.4 release=1.6 volume=-1.5 settling=15 split=-.25 | tails | - | Strings that run back to their pluck when the key is let go
Last word to the hammer | Palindrome bells | body=Bar tilt=-.2 frame=400 strike=1 sand=.6 depth=.8 release=1 beat=.1 grains=0 volume=0.5 pour=.2 exchange=.05 | felt | ostinato | Bars that end on the knock they began with, as each key is lifted
Swell at the lifted hand | Palindrome bells | body=Reed tilt=-.3 frame=800 strike=.2 attack=.02 sand=1.5 depth=.85 release=1.2 neck=Soften grains=0 pour=.7 split=.3 | swelled 1.mix=0.4 | walking | Reeds that swell once more at the end of every key
Footprints refilled | Palindrome bells | body=Skin tilt=0 frame=260 strike=.7 sand=.8 depth=.7 settling=60 release=1.4 grains=.5 volume=-2 | early | ostinato | Sandy skins whose sound runs home when the hand is lifted
Glass put down again | Palindrome bells | body=Glass tilt=-.55 frame=870 strike=.5 sand=1.3 depth=.6 exchange=.6 release=2.4 ears=.7 volume=-1.5 apart=.2 | backwards | - | Glass keys that rise back to the touch that made them
Nobody turned it | Short sand plucks | body=Bell tilt=0 frame=1000 sand=.8 depth=.8 memory=1 stagger=.2 release=2 volume=2.5 settling=25 apart=.4 | unfold | walking | Small bells that come back by themselves each time the glass is empty
Clockwork kitten | Short sand plucks | body=Bar tilt=.5 frame=2100 memory=.8 stagger=.8 ears=.9 release=1.5 volume=3.5 sand=.45 depth=.5 strike=.45 apart=.5 | gates | ostinato | Tiny bars that bounce back from empty, quicker the higher they are
Changed its mind twice | Short sand plucks | body=Reed tilt=-.3 frame=600 strike=.2 sand=1.3 depth=.85 neck=Soften memory=.9 inertia=.5 release=1.4 pour=.85 split=.2 | bed | twohands | Reed keys that fade right out and then think better of it
Coins on a counter | Short sand plucks | body=Glass frame=900 strike=1 sand=.5 depth=.65 memory=.4 settling=100 grains=.3 release=1.2 volume=5 tilt=-.8 | drip | - | Hard glass taps that bounce a few times, bent and softer at each
Warm side of the wall | Short sand plucks | tilt=-.5 frame=280 strike=.4 sand=1.8 depth=.6 memory=.7 neck=Hover inertia=.6 release=2.5 volume=1.5 settling=22 pour=.8 apart=.15 | below | twohands | Muted strings that turn themselves and hover when they get back
Tired of returning | Keys that turn | memory=0 tilt=.3 frame=1500 sand=.9 depth=.7 inertia=.2 ears=.8 volume=6 split=-.4 | memory | ostinato | Strings that come back dimmer and darker with every key, and soon not at all
Photograph of a hand | Keys that turn | body=Bell memory=.2 strike=.7 tilt=-.1 frame=420 sand=1.4 depth=.5 exchange=.6 release=3 volume=-2.5 settling=30 | record | walking | Bells that lose their brightness at each return
Copied until pale | Keys that turn | body=Glass memory=.1 tilt=-.53 frame=930 strike=.45 sand=1.1 depth=.75 beat=.9 grains=.3 volume=5 apart=.25 split=.3 | loop | - | Glass keys whose returns grow pale almost at once
Same street, years later | Keys that turn | body=Bar memory=.3 neck=Pass tilt=.2 frame=640 sand=2 depth=.55 inertia=.5 beat=.5 release=2.5 volume=-0.5 settling=18 | dotted | twohands | Bars that cross to another colour and remember less each time
Half of a promise | Keys that turn | body=Reed memory=.25 neck=Strike strike=.3 tilt=-.1 frame=1400 sand=1.2 depth=.6 grains=0 release=1 volume=3 split=-.5 pour=.2 | swirl | walking | Reeds that return with half of what they set out with
Beads on many wires | Keys that turn | apart=.7 stagger=.8 tilt=.2 frame=1000 sand=.8 depth=.6 inertia=.1 ears=.9 release=2.2 volume=0.5 | crystals | twohands | Strings that only turn their neighbours, the high ones running ahead
Slow hand on a wheel | Keys that turn | stagger=1 inertia=1 tilt=-.2 frame=560 sand=3 depth=.8 exchange=.6 beat=1 release=4 volume=-3.5 pour=.8 | widetop | twohands | Strings as heavy as a wheel, the far keys turning long after the near
Split down the middle | Keys that turn | split=-1 tilt=.18 frame=1540 sand=1.4 depth=.5 strike=.4 beat=.6 ears=.6 volume=4 | jet | - | Strings whose high half rises while the low half falls
Every other plank | Keys that turn | body=Bar split=1 tilt=.5 frame=500 strike=.5 sand=1 depth=.7 exchange=.2 release=1.8 volume=2 | wood | ostinato | Bars with every second partial running against the rest
Crossing without looking | Both bulbs | attack=.01 strike=.7 tilt=-.2 frame=1100 sand=.5 depth=.8 inertia=.1 stagger=.4 beat=.2 release=1.3 volume=-1 settling=20 | hop | walking | Quick strings that shoot through their start and come out hollow
`,
    },
    {
      id: 'short-sand-plucks',
      name: 'Short sand plucks',
      category: 'plucked',
      rows: `
Gooseberry wire | Short sand plucks | strike=.8 memory=.2 beat=0 ears=.8 release=.5 volume=6 depth=.7 sand=.5 tilt=-.05 frame=1510 settling=15 | limit 1.gain=9 | drops | Tight bright strings, gone in half a second and back once, faintly
Comb with one tooth gone | Short sand plucks | tilt=-.1 frame=1200 strike=.5 sand=.6 depth=.6 settling=80 memory=.7 release=.9 volume=1 apart=.2 | limitroom | downpour | Plucks that start bent and come straight, then bend again as they bounce
Nylon at the sink | Short sand plucks | tilt=-.5 frame=520 strike=.4 sand=1.1 depth=.7 pour=.3 turn=New_key memory=1 ears=.3 release=1.2 apart=.15 settling=18 | close | twohands | Soft round strings, each new pluck sending the last one home
Twine round a parcel | Short sand plucks | tilt=-.8 frame=240 strike=.7 sand=.5 pour=.05 inertia=.4 ears=.1 release=.4 volume=6 depth=.8 | limittape | lowpluck | Muffled low strings with more thumb than tone
Silk thread at noon | Short sand plucks | tilt=.2 frame=2520 strike=.25 attack=.03 sand=.9 depth=.4 exchange=1 beat=.8 ears=1 release=1.6 volume=6 split=.2 | glasstail | drops | Hair fine strings whose overtones pass the pluck along
Hazelnuts | Short sand plucks | body=Bar tilt=0 frame=480 strike=.9 sand=.3 depth=.8 pour=.3 memory=.3 beat=0 release=.4 volume=6 settling=25 exchange=.05 | limit 1.gain=6 | downpour | Dry little bars with a nutty knock and one small bounce
Matchbox tune | Short sand plucks | body=Bar tilt=.7 frame=1500 strike=.6 sand=.6 depth=.5 turn=New_key memory=.8 exchange=.4 ears=.5 release=.7 volume=2.5 apart=.3 split=-.4 | bedside | - | Pinched bars that ring on their double octave
Chestnut floor | Short sand plucks | body=Bar tilt=-.6 frame=170 strike=.8 sand=.8 depth=.6 turn=New_key neck=Soften inertia=.3 release=1 volume=1 pour=.75 settling=20 | wood | lowpluck | Deep round bars, struck once and returned as a swell
Rungs of a short ladder | Short sand plucks | body=Bar tilt=-.24 frame=2290 strike=1 sand=.22 depth=.6 memory=.6 stagger=1 settling=0 ears=.9 release=.9 volume=6 apart=.15 | limitslap 1.gain=6 | drops | High bars hammered hard that chatter back from empty
Rain on the toolshed | Short sand plucks | body=Bar tilt=-.88 frame=570 strike=.7 sand=.45 depth=.95 grains=.7 memory=.5 stagger=.9 ears=1 release=1 volume=6 apart=.4 | rain | downpour | Bars and loose grains on one short sand, no two keys at one pace
Peas in a tumbler | Short sand plucks | body=Glass strike=.7 sand=.4 depth=.8 memory=.5 grains=.5 settling=30 release=.8 volume=1 tilt=-.45 frame=470 apart=.2 | limitroom | downpour | Little glass taps with grains bouncing after them
Dew counted aloud | Short sand plucks | body=Glass frame=900 strike=.4 sand=.9 depth=.7 pour=.15 turn=New_key memory=1 exchange=.6 release=1.5 volume=6 tilt=-.5 split=.3 | deck | drops | Clear glass drops, each lifting the one before it again
Splinter of moon | Short sand plucks | body=Glass sand=.25 memory=.7 beat=1.5 ears=1 release=2.2 volume=6 strike=.75 depth=.55 tilt=-.6 frame=640 apart=.3 | crystals | drops | Quick hard glass that bounces in both ears
Beaker under the thumb | Short sand plucks | body=Glass tilt=-.7 frame=420 strike=.6 sand=.7 depth=.6 neck=Soften turn=New_key inertia=.3 release=1.2 volume=1.5 settling=30 pour=.7 | bottle | twohands | Dark glass plucks that come back rounded
Fairground goldfish | Short sand plucks | body=Glass tilt=0 frame=1100 strike=.5 sand=.5 depth=.7 neck=Pass memory=.8 settling=120 exchange=.3 release=1.8 volume=6 | slap | downpour | Wobbling glass plucks that cross to another colour as they bounce
Bell on a doll's door | Short sand plucks | body=Bell tilt=.16 frame=1570 strike=.8 sand=.5 depth=.7 memory=.4 beat=.3 release=.9 volume=2.5 settling=20 split=.4 | limitecho | drops | Tiny bells that ring and bounce once
Thimble and needle | Short sand plucks | body=Bell tilt=-.4 frame=1400 strike=1 memory=.2 settling=20 release=.5 volume=6 depth=.7 pour=.25 sand=.4 exchange=.05 | limit 1.gain=11 | downpour | Bells cut to a tick and a glint
Goat path bells | Short sand plucks | body=Bell tilt=.1 frame=640 strike=.6 sand=1 depth=.6 stagger=.9 memory=.6 beat=1.2 settling=60 ears=.9 release=1.6 volume=3 apart=.25 | valley | drops | Rough small bells, bent and beating, none keeping step
Night light with stars | Short sand plucks | body=Bell tilt=-.6 frame=420 strike=.3 attack=.05 sand=1.2 depth=.8 neck=Hover turn=New_key memory=1 exchange=.5 release=2 volume=0 pour=.8 apart=.2 | smallplate | twohands | Round bells tapped softly, lingering near their start when called back
Sleigh left in a barn | Short sand plucks | body=Bell tilt=.7 frame=2600 strike=.4 sand=.35 memory=.9 grains=.4 stagger=.4 ears=1 beat=2.5 release=1.4 volume=6 depth=.35 settling=45 split=-.3 | harmonic | downpour | Thin jingling bells that keep turning themselves over
Thumbed tongues | Short sand plucks | body=Reed tilt=-.1 frame=700 strike=.9 attack=.01 sand=.5 depth=.8 pour=.1 memory=.4 beat=.6 release=.6 volume=1.5 split=.35 settling=18 | limitroom | - | Reeds flicked by a thumb, nasal and short
Tin whistle in a pocket | Short sand plucks | body=Reed tilt=.4 frame=1900 strike=.7 attack=.02 sand=.35 depth=.9 memory=.6 exchange=.4 ears=.9 release=.7 volume=4 apart=.35 | limitslap | drops | Bright reed chirps that answer themselves out of empty
Buzz of one bee | Short sand plucks | body=Reed tilt=.5 frame=850 strike=.6 attack=.01 sand=.7 depth=.6 turn=New_key memory=.8 beat=3.5 release=.8 volume=1 settling=40 split=-.6 pour=.15 | paper | ostinato | Short buzzing reeds, beating, turned by the next key
Pipe tapped with a spoon | Short sand plucks | body=Reed tilt=-.6 frame=1000 strike=.8 attack=.01 sand=.45 depth=.9 pour=.4 neck=Pass memory=.7 release=1 volume=5.5 settling=25 | gated | downpour | Stopped reed taps that cross from hollow to full
Murmur at each step | Short sand plucks | body=Reed tilt=-.4 frame=300 strike=.2 attack=.04 sand=.6 depth=.7 neck=Soften memory=.8 inertia=.4 release=1.3 volume=1 pour=.85 apart=.3 | ah | twohands | Soft low reed notes that swell once more after each is struck
Fingertips on vellum | Short sand plucks | body=Skin tilt=.1 frame=700 strike=.6 sand=.5 depth=.7 memory=.3 settling=30 grains=.1 release=.5 volume=2.5 | limit | ostinato | Dry tuned skins under the fingertips
Hollow log, two sticks | Short sand plucks | body=Skin tilt=-.3 frame=300 strike=1 sand=.4 depth=.9 pour=.3 memory=.5 settling=120 release=.6 volume=-1.5 | limitspring | ostinato | Skins that swoop down into tune with a hard stick
Drip on a tarpaulin | Short sand plucks | body=Skin tilt=.5 frame=1600 strike=.4 sand=.7 depth=.6 memory=.7 grains=.6 exchange=.7 ears=1 release=1.2 volume=3 settling=15 split=.4 | drip | downpour | Thin skins and wet grains, wide apart
Heel on a hollow stair | Short sand plucks | body=Skin tilt=-.7 frame=140 strike=.8 sand=.6 depth=.8 turn=New_key memory=1 settling=70 release=.7 volume=3 | firm | lowpeal | Low soft thuds that find a pitch, each turned by the next
Tambour behind a door | Short sand plucks | body=Skin tilt=0 frame=900 strike=.5 sand=.3 depth=.6 memory=.9 inertia=.2 beat=1 ears=.5 release=1 volume=5.5 settling=35 apart=.2 | nextdoor | ostinato | Quick skins that roll by themselves as the sand turns over
Well bucket | Keys that turn | tilt=-.6 frame=200 strike=.6 sand=.9 depth=.65 pour=.25 release=1 beat=.1 volume=6 | hint | lowpluck | Deep plucked strings, falling away and drawn up by the next
Mooring line | Keys that turn | tilt=-.2 frame=320 strike=.9 settling=50 release=.8 volume=6 depth=.65 pour=.4 sand=.9 turn=New_key memory=.8 | thump | lowpluck | A slack low string slapped hard, that strains back to the slap with the next key
Lead on a long rod | Keys that turn | body=Bar tilt=-.4 frame=130 strike=.7 sand=1.2 depth=.8 inertia=.8 neck=Strike release=1.5 volume=-13.5 settling=16 pour=.7 | iron | lowpluck | Heavy low bars that lean into the turn before they knock again
Anvil in a dream | Keys that turn | body=Bell tilt=-.5 frame=260 strike=.9 sand=.7 pour=.3 turn=Empty_glass memory=.5 release=2 volume=6 depth=.65 settling=55 split=.3 | darkplate | lowpluck | Dull low bells struck hard that bounce twice and darken
Cable in the wind | Keys that turn | tilt=.5 frame=900 strike=.8 sand=1 depth=.6 split=1 exchange=.5 beat=.6 ears=.8 release=1.8 volume=3.5 | jet | lowpluck | Long low strings with half of their overtones rising out of the pluck
Gravel under a gate | Falling texture | body=String tilt=-.1 frame=920 strike=.8 sand=.5 depth=.8 apart=0 settling=20 grains=.9 beat=.2 release=.8 volume=3 split=-.3 | room | - | Plucks with a handful of gravel thrown after each
Sugar on a drumhead | Falling texture | body=Skin tilt=-.1 frame=1100 strike=.5 sand=.6 depth=.7 apart=.2 settling=40 grains=1 beat=.6 release=.9 volume=3.5 pour=.2 | airyroom | downpour | Light taps almost lost in falling sugar
Seed packet | Falling texture | body=Bar tilt=-.8 frame=570 strike=.6 sand=.35 depth=.9 apart=0 memory=.3 settling=10 grains=.6 beat=.1 release=.6 volume=6 pour=.15 | limitroom | drops | Dry bars spilling a few seeds at each stroke
Frost off a branch | Falling texture | strike=.4 sand=.7 depth=.8 apart=.4 settling=15 grains=.7 beat=.5 release=1.4 volume=-0.5 tilt=-.02 frame=1110 split=-.4 | sparks | twohands | Bright glass plucks with a crackle of frost coming down
Coal tipped at dawn | Falling texture | body=Reed tilt=-.3 frame=260 strike=.9 attack=.01 sand=.5 depth=.8 apart=.1 settling=70 grains=.95 beat=1 release=.7 volume=2.5 split=.4 | cave | lowpluck | Short rough reeds, bent at the start, in a rattle of grains
Beads spilled uphill | Neighbour pulses | body=String tilt=.3 frame=1500 depth=.8 stagger=.6 memory=.7 ears=.9 release=1.2 volume=5 strike=.4 sand=.45 settling=20 | stars | twohands | Plucks spread along the sand, so a chord spills upward key by key
Loose change of light | Neighbour pulses | body=Glass strike=.6 sand=.5 depth=.9 stagger=.3 memory=.8 exchange=.5 grains=.2 release=1.8 volume=3 tilt=-.4 frame=1300 split=.5 | doubled | downpour | Glass plucks landing out of order, catching light as they turn
Typing in the attic | Neighbour pulses | body=Bar tilt=.41 frame=940 strike=1 sand=.25 depth=.8 memory=.5 settling=0 grains=0 release=.16 volume=1.5 pour=.35 exchange=0 | limitslap | ostinato | Very short bars that clatter on at their own places
Keys thrown to the floor | Neighbour pulses | body=Bell tilt=.4 frame=1400 strike=.9 sand=.4 depth=.8 stagger=.8 settling=50 beat=.8 release=1 volume=6 | spring | drops | Bells tumbling out of step with a hard edge
Gossip of small drums | Neighbour pulses | body=Skin tilt=.2 frame=600 strike=.6 sand=.35 depth=.7 memory=.6 settling=60 stagger=.5 ears=1 release=.6 volume=0 split=.3 | pan | ostinato | Little skins that answer only the keys beside them
Echo without a wall | Palindrome bells | body=String tilt=-.21 frame=1280 strike=.7 sand=.4 depth=.9 release=.9 grains=0 beat=.1 volume=-3 settling=20 | limitroom | drops | Plucks that run back to their own start as each finger lifts
Knock and its answer | Palindrome bells | body=Bar tilt=.1 frame=600 strike=.8 sand=.3 depth=1 pour=.3 release=.7 grains=0 volume=-0.5 settling=30 exchange=0 | limit | ostinato | A knock when the key goes down and another when it comes up
Bubble, then the pop | Palindrome bells | body=Glass strike=.6 attack=.06 sand=.5 depth=.8 settling=150 release=1.2 volume=2.5 tilt=-.55 frame=510 | farstar | drops | Bending glass drops that run back to a small pop as the key lifts
Apple let fall | Palindrome bells | body=Skin tilt=-.2 frame=420 strike=.5 sand=.4 depth=.8 neck=Soften settling=90 release=1 ears=.6 volume=0.5 pour=.8 | shade | downpour | Soft skins that rise once more when the key is let go
Said backwards at dinner | Palindrome bells | body=Reed tilt=.2 frame=1200 strike=.6 attack=.015 sand=.35 depth=.95 neck=Pass release=.8 grains=0 volume=3.5 split=.4 settling=15 | mirror | - | Clipped reed notes said once more in reverse at the lift of a hand
`,
    },
    {
      id: 'reed-basses',
      name: 'Reed basses',
      category: 'bass',
      rows: `
Barge pole | Reed bass | tilt=-.8 frame=130 sand=1.8 depth=.6 inertia=.9 strike=.3 beat=.1 release=.7 volume=-3 pour=.9 ears=0 | firm | floor | A very dark reed bass that leans its whole weight into each turn
Bellows under the house | Reed bass | tilt=.25 frame=520 strike=.15 attack=.25 sand=.8 depth=.85 pour=.9 neck=Soften release=.8 volume=0 split=.3 ears=0 exchange=.8 beat=1.2 | chamber | anchor | A reed bass that empties and fills again like a bellows
Mill wheel in a drought | Reed bass | tilt=-.6 frame=150 sand=2.6 depth=.5 exchange=.6 beat=.5 ears=.4 inertia=.6 release=1.2 split=.4 volume=-3.5 | water 1.mix=0.25 | anchor | A slow reed bass whose overtones are ground round as the sand runs
Cart over a bridge | Reed bass | tilt=.3 frame=420 strike=1 attack=.015 sand=.6 depth=.7 inertia=.5 memory=.4 grains=.5 release=.4 volume=5 settling=80 pour=.25 split=-.3 beat=2.2 | reel | treads | Short reed bass notes with a thud and a little grit
Ox at the furrow | Reed bass | tilt=-.75 frame=150 strike=.8 sand=1.4 depth=.75 turn=Empty_glass memory=.8 inertia=1 settling=20 release=.9 volume=-2.5 pour=.15 ears=0 grains=.3 beat=1.4 exchange=.6 | desk | - | A reed bass that slows, hesitates and heaves itself round when it is empty
Contrabass harmonica | Reed bass | tilt=.35 frame=520 strike=.4 sand=1 depth=.5 inertia=.2 beat=.7 ears=.3 release=.5 volume=6 split=.6 | combo | treads | A nasal reed bass with its upper partials forward
Generator behind glass | Reed bass | tilt=.5 frame=800 strike=.1 attack=.2 sand=3 depth=.4 exchange=.8 beat=1.2 ears=.6 inertia=.4 release=1.5 volume=1 pour=.7 split=-.4 | behindglass | anchor | A humming reed bass that slowly shifts its weight among its overtones
Bee against the pane | Reed bass | tilt=.8 frame=1100 strike=.3 attack=.03 sand=.5 depth=.6 settling=30 inertia=.1 beat=2.5 release=.4 volume=6 | paper | treads | A thin buzzing reed bass, beating fast
Bassoon in wet reeds | Reed bass | tilt=.1 frame=440 strike=.2 attack=.07 sand=1.6 depth=.7 neck=Hover settling=10 inertia=.6 grains=.15 beat=.3 release=.9 volume=1 split=.25 pour=.75 | late | floor | A woody reed bass that lingers near its start before it sinks
Iron stove door | Reed bass | tilt=.2 frame=300 strike=1 attack=.01 sand=.9 depth=.9 pour=.3 settling=90 inertia=.3 release=.6 volume=6 | touch 1.cutoffHz=700 | - | A hard reed bass bent sharp at the start and falling into tune
Thumb on the low string | Reed bass | body=String tilt=-.5 frame=180 strike=.5 attack=.01 sand=.9 depth=.6 pour=.4 inertia=.3 release=.6 volume=0 settling=15 ears=0 | thump | treads | A round plucked bass with each note sending the one before it home
Rope in a pulley | Reed bass | body=String tilt=.1 frame=420 strike=.8 attack=.01 sand=.7 depth=.8 pour=.3 settling=60 inertia=.6 beat=.2 release=.5 volume=0 ears=0 | triode | - | A plucked bass that bends down into tune and strains back up
Tarred twine | Reed bass | body=String tilt=-.8 frame=125 strike=.9 attack=.01 sand=.4 depth=.9 pour=.1 turn=Empty_glass memory=.3 release=.18 volume=4.5 ears=0 settling=20 exchange=.05 | limittape | treads | Very short dull bass plucks with one faint bounce
Banister at night | Reed bass | body=String tilt=.4 frame=900 strike=.6 attack=.01 sand=1.5 depth=.5 exchange=.6 beat=.5 ears=.5 memory=1 release=1.2 split=.35 volume=-1 | slap | floor | A bright plucked bass that lets its overtones wander as it fades
Anchor chain, slack | Reed bass | body=String tilt=0 frame=250 strike=.7 attack=.01 sand=1.1 depth=.75 grains=.8 inertia=.4 settling=25 release=.8 volume=0.5 | spring | lowpluck | A plucked bass with grains of rust falling off it
Bowed floorboard | Reed bass | body=String tilt=-.4 frame=160 strike=0 attack=.35 sand=1.8 depth=.5 neck=Soften inertia=.7 beat=.4 release=1.2 volume=-3.5 pour=.85 | levelled | anchor | A bowed bass that comes home as a soft dark wave
Six bows at the bottom | Reed bass | body=String tilt=-.15 frame=330 strike=0 attack=.6 sand=2.4 depth=.15 neck=Hover exchange=.7 beat=1.5 ears=.6 release=2 volume=1 split=.3 grains=.15 | ensemble | anchor | Bowed basses that hardly fade, beating against each other
Cable ferry at dusk | Reed bass | body=String tilt=-.7 frame=220 strike=.1 attack=.2 sand=4 depth=.8 pour=.95 inertia=.8 release=1.6 volume=-4 | glacier | floor | A bowed bass that stays full for long and then falls away
Grain of the oak | Reed bass | body=String tilt=.5 frame=640 strike=0 attack=.25 sand=1.2 depth=.6 split=.7 exchange=.5 beat=.3 ears=.8 release=1 volume=1.5 | wood | anchor | A bowed bass whose even partials rise as the odd ones sink
Engine of bows | Reed bass | body=String tilt=-.1 frame=280 strike=.05 attack=.15 sand=.6 depth=.45 neck=Hover turn=Empty_glass memory=1 inertia=.3 release=.9 volume=2.5 pour=.9 | cassette | floor | A bowed bass that pulses softly by itself
Padded mallet, long bar | Reed bass | body=Bar tilt=-.6 frame=140 strike=.4 attack=.01 sand=1.6 depth=.55 inertia=.5 release=1 exchange=.05 ears=0 pour=.35 volume=-3 | close | floor | The roundest bass here: one wooden bar and hardly an overtone
Wooden steps, boots | Reed bass | body=Bar tilt=.2 frame=520 attack=.01 sand=.7 depth=.65 inertia=.2 beat=0 release=.5 volume=6 strike=.7 pour=.32 settling=25 | booth | treads | A wooden bass that knocks at the stroke and knocks again when turned
Marimba in the well | Reed bass | body=Bar tilt=-.1 frame=240 strike=.6 attack=.01 sand=2.4 depth=.7 neck=Strike exchange=.5 beat=.8 ears=.5 release=1.8 split=.3 | triode | lowpluck | Low wooden bars ringing slowly on their double octave
Sole of the foot | Reed bass | body=Bar tilt=-.9 frame=120 strike=.2 attack=.06 sand=.9 depth=.4 neck=Soften memory=.9 release=.8 volume=-15.5 turn=New_key ears=0 exchange=0 pour=.9 | iron | anchor | A pure low tone that comes and goes with no edge at all
Log rolled off a truck | Reed bass | body=Bar tilt=.5 frame=340 strike=.7 attack=.01 sand=1 depth=.7 settling=80 inertia=.8 grains=.4 release=.7 volume=6 pour=.32 | nextdoor | - | A bending wooden bass, heavy in the turn and dusty
Bourdon, felted | Reed bass | body=Bell tilt=-.8 frame=150 attack=.02 sand=2 depth=.6 inertia=.4 exchange=.4 beat=.4 release=1.6 volume=-3 strike=.1 settling=22 | felt | keel | A dull bell for a bass, its stroke taken away
Steeple under the lake | Reed bass | body=Bell tilt=-.3 frame=260 strike=.5 attack=.015 sand=3.5 depth=.7 neck=Hover exchange=.8 beat=.9 ears=.7 release=3 volume=-1 pour=.8 split=.3 | deeper | keel | A low bell that hovers, its partials slow to settle
Portcullis at dusk | Reed bass | body=Bell tilt=.2 frame=700 strike=.8 attack=.01 sand=1.2 depth=.8 pour=.2 settling=50 inertia=.6 release=1 volume=1.5 | drip | keel | A clanging bass that bends and is hauled back
Meter in the basement | Reed bass | body=Bell tilt=0 frame=180 strike=.4 attack=.01 sand=.35 depth=.6 turn=Empty_glass memory=.8 inertia=.1 stagger=0 release=.6 volume=4 pour=.3 settling=18 | tight | keel | A low bell ticking over by itself on a short sand
Lantern on the keel | Reed bass | body=Bell strike=.1 attack=.4 sand=1.6 depth=.5 neck=Pass beat=.6 ears=.5 release=1.8 volume=-4 tilt=-.1 frame=420 split=.4 settling=15 | shallows | keel | A hollow low bell that crosses to a brighter side and back
Kettledrum by the door | Drum of sand | turn=New_key strike=.6 sand=1.4 depth=.6 settling=50 grains=.05 memory=.8 release=1 volume=2 tilt=-.05 frame=280 pour=.25 | room | keel | A tuned low drum, turned by each stroke that follows
Boots on a raft | Drum of sand | tilt=-.3 frame=200 strike=1 sand=.5 depth=.9 settling=120 grains=.3 inertia=.2 release=.5 volume=1 | limit | keel | A short booming bass that swoops down to its pitch
Whale oil drum | Drum of sand | attack=.08 sand=2.2 depth=.5 neck=Hover settling=15 grains=0 beat=.9 release=1.8 volume=2 tilt=-.2 frame=280 strike=.1 pour=.8 | deepfog 1.mix=0.4 | keel | A low skin with no stroke, hovering and beating slowly
Rug beaten on a line | Drum of sand | tilt=.1 frame=420 strike=.8 sand=.7 depth=.8 pour=.4 settling=70 grains=.9 exchange=.5 release=.6 volume=3.5 | slap | keel | A dusty bass thud with sand knocked loose
Pulse under a sleeve | Drum of sand | strike=.4 sand=.45 depth=.5 neck=Soften memory=1 settling=30 grains=0 release=.7 volume=1 tilt=-.1 frame=300 | nextdoor | keel | A soft low drum that goes on beating by itself under each touch
Bottle organ, lowest | Reed bass | body=Glass tilt=-1 frame=130 strike=.1 attack=.1 sand=1.5 depth=.5 neck=Soften inertia=.5 release=1 volume=0.5 pour=.8 ears=0 | bottle | floor | Glass so dark that a hum is left, met again as a soft wave
Ice under the skates | Reed bass | body=Glass tilt=-.2 frame=520 strike=.6 attack=.01 sand=1.1 depth=.7 exchange=.5 beat=.4 ears=.6 release=1 volume=-0.5 settling=30 | shade | treads | A struck glass bass, hard on top and hollow beneath
Cellar full of jars | Reed bass | body=Glass tilt=-.6 frame=250 strike=.4 attack=.02 sand=2.5 depth=.6 grains=.5 inertia=.3 beat=1 ears=.5 release=2 volume=2.5 apart=.2 | gentle | anchor | Low glass with a trickle of sand, shimmering slowly
Tanker light, far out | Reed bass | body=Glass tilt=.1 frame=320 strike=0 attack=.3 sand=3 depth=.3 neck=Hover exchange=.8 beat=.6 release=2.2 volume=-1.5 split=-.4 pour=.9 | steps | anchor | A low glassy tone that lights up as it nears its beginning
Submarine glass harp | Reed bass | body=Glass tilt=-.4 frame=180 strike=.2 attack=.05 sand=.8 neck=Pass turn=Empty_glass memory=1 inertia=.4 release=1.2 volume=6 depth=.35 pour=.7 settling=16 | undertow | floor | Low glass that passes back and forth through two dark colours
Pit saw, two handed | Both bulbs | tilt=-.5 frame=180 strike=.3 sand=1 depth=.5 inertia=.6 beat=.2 ears=.3 release=.8 settling=35 pour=.7 | desk | anchor | A string bass pulled from one side of its beginning to the other
Hinge of the year | Both bulbs | body=Reed tilt=-.7 frame=170 strike=.2 attack=.06 sand=1.4 depth=.35 inertia=.8 grains=0 release=.9 volume=1.5 pour=.9 split=-.3 | pan | floor | A reed bass crossing from hollow to full
Coal and chalk | Both bulbs | body=Bar tilt=0 frame=300 strike=.6 sand=.7 depth=.6 inertia=.2 beat=.1 ears=.3 release=.7 volume=3.5 pour=.2 settling=20 | levelled | treads | A bass that is a low bar on one side and its octave on the other
Crossbeams | Both bulbs | body=String tilt=.2 frame=500 strike=.5 split=.6 sand=1.6 depth=.7 exchange=.6 release=1 volume=6 | notch | - | A string bass with half of its partials out of step, crossing its start
Night freight, uncoupled | Both bulbs | body=Skin strike=.7 sand=.9 depth=.5 settling=40 inertia=.5 grains=.2 release=1.2 tilt=.2 frame=400 volume=-2.5 | cavern | keel | Low skins that cross from a thud to a hollow fifth
Engine room clock | Reed bass | tilt=-.2 frame=280 strike=.6 attack=.01 sand=.3 depth=.7 turn=Empty_glass memory=1 inertia=.05 release=.4 volume=6 split=.5 | lowpulse | floor | A reed bass that chugs on by itself while a key is held
Pumping out the boat | Reed bass | tilt=-.5 frame=200 strike=.3 sand=.5 depth=.9 pour=.7 turn=Empty_glass neck=Soften memory=.9 inertia=.3 grains=.4 release=.6 volume=-0.5 | shallows 1.depth=0.5 | anchor | A wet reed bass that surges up by itself again and again
Last bus, door open | Reed bass | tilt=.1 frame=360 strike=.5 attack=.02 sand=.8 depth=.8 turn=Let_go release=.6 ears=.3 volume=1.5 pour=.2 settling=28 | reel | treads | A reed bass that swells back to its start as the key comes up
Stone door, closing | Reed bass | body=Bell tilt=-.6 frame=200 strike=.9 attack=.01 sand=.6 depth=.8 turn=Let_go inertia=.2 release=1.4 volume=5.5 settling=15 pour=.15 | cave | keel | A low bell that ends with the stroke it began with, each time a key is lifted
Deep end, drained | Reed bass | body=String tilt=-.6 frame=150 strike=.6 attack=.01 sand=.7 depth=.85 turn=Let_go neck=Hover release=1 beat=.1 volume=2 pour=.25 | bank | floor | A plucked bass that runs home and waits there when the key is let go
`,
    },
    {
      id: 'palindrome-bells',
      name: 'Palindrome bells',
      category: 'bell',
      rows: `
Tongue and lip of bronze | Palindrome bells | tilt=0 frame=700 sand=1.4 depth=.7 strike=.6 release=3 settling=15 | room | tower | Bells that run back to their own strike when the key is let go
Gate that shuts itself | Palindrome bells | strike=1 sand=.7 depth=1 pour=.15 release=1.5 beat=.1 volume=6 tilt=.1 frame=1400 | chamber | highpeal | Hard bright bells, gone in a moment and struck again at the lift
Sunday told from the end | Palindrome bells | tilt=-.3 frame=420 strike=.5 sand=2.6 depth=.8 exchange=.7 beat=.8 release=6 ears=.7 split=.4 | cathedral | tower | Dark bells that find their way home once let go, their partials trading places
Ladle on a copper pan | Palindrome bells | tilt=.1 frame=1000 strike=.9 sand=1 depth=.75 settling=100 grains=.3 release=2 volume=0.5 apart=.2 | kettle | - | Bent metal that bends back up to its strike when released
Two sides of one coin | Palindrome bells | tilt=-.1 frame=1600 neck=Pass strike=.6 sand=1.2 depth=.6 release=2.5 beat=1 ears=.9 volume=-1 split=-.3 | pan | palindrome | Bells that run past their strike when let go and show another face
Spelling bee of glass | Palindrome bells | body=Glass strike=.7 sand=1 depth=.8 release=2 exchange=.3 volume=-1 tilt=-.84 frame=650 apart=.2 | smallplate | palindrome | Glass said forwards under the finger and backwards as it lifts
Lid of a crystal box | Palindrome bells | body=Glass sand=.5 depth=.9 pour=.75 settling=30 release=1.2 ears=.9 volume=1.5 tilt=-.51 frame=530 strike=.7 | glasstail | palindrome | Small hard glass that clicks open and, as the key lifts, shut
Snow slides off the bell | Palindrome bells | body=Glass tilt=-.6 frame=380 strike=.4 attack=.03 sand=2 depth=.7 neck=Soften grains=.7 release=4 apart=.25 | frost | tower | Dark glass bells in a slide of sand, rising round when let go
Chandelier taken down | Palindrome bells | body=Glass strike=.5 apart=.6 stagger=.6 sand=1.5 depth=.6 exchange=.8 beat=1.6 release=3.5 volume=-5.5 tilt=-.81 frame=830 | glimmer | tower | Glass pendants, each at its own place, running home as the keys lift
Decanter by lamplight | Palindrome bells | body=Glass neck=Hover strike=.5 sand=.9 depth=.5 exchange=.6 release=5 beat=.4 volume=-10.5 tilt=-.6 frame=500 split=.3 | summer | lowpeal | Rounded glass that goes home when let go and hangs there
Temple steps at noon | Turning bells | tilt=-.2 frame=560 strike=.7 sand=1.9 depth=.7 pour=.4 inertia=.1 settling=20 release=4 volume=1.5 split=.25 | valley | lowpeal | Bells that each new stroke sends back towards the one it had
Pilgrims passing a bell | Turning bells | tilt=.3 frame=1300 strike=.5 sand=1.2 depth=.8 inertia=.4 stagger=.5 beat=.7 ears=.8 release=3 volume=3 apart=.3 | fifthround | lowpeal | Bells that lean into the turn, the near ones before the far
Last ringer stays on | Turning bells | tilt=-.5 frame=300 strike=.6 sand=3.2 depth=.6 exchange=.6 memory=.5 grains=.05 release=6 settling=35 pour=.7 | darkhall | lowpeal | Low bells that come back a little darker for every stroke
Goodnight, said twice | Turning bells | tilt=0 frame=900 strike=.35 attack=.03 sand=1.5 depth=.65 neck=Soften inertia=.5 release=3.5 beat=.9 volume=1 pour=.85 split=-.3 | bed | palindrome | Gentle bells called back as a wave by the next of them
Peal against the clock | Turning bells | strike=.8 sand=.6 depth=.5 inertia=0 memory=1 stagger=.3 grains=0 release=2 volume=5.5 tilt=.14 frame=1490 settling=25 | dotted | highpeal | Bright quick bells that jump back on the spot
Watchman's one tap | Turning bells | turn=Empty_glass tilt=-.4 frame=480 strike=.5 sand=1 depth=.85 memory=.7 inertia=.3 release=5 volume=2 pour=.8 split=.4 | cave | lowpeal | Dull bells that empty, turn and tap themselves once more
Harbour bell in fog | Turning bells | turn=Empty_glass tilt=-.1 frame=360 strike=.4 sand=2 depth=.6 settling=40 exchange=.5 beat=1.3 ears=.6 release=6 volume=-1 apart=.2 | deepfog | lowpeal | A bent old bell that rolls over by itself
Wind has a key | Turning bells | turn=Empty_glass tilt=.16 frame=1720 strike=.3 sand=.8 depth=.6 stagger=1 memory=.9 grains=.5 ears=1 release=5 volume=6 split=-.5 apart=.4 | stars | highpeal | High bells that ring on by themselves in the sand, none in step
Alarm under a pillow | Turning bells | turn=Empty_glass tilt=-.7 frame=800 strike=.9 sand=.25 depth=.6 memory=.9 inertia=0 grains=0 release=3 volume=6 settling=18 | nextdoor | - | A muffled bell rolling fast on a very short sand
Orrery of small bells | Turning bells | turn=Empty_glass tilt=.2 frame=1500 strike=.6 apart=.5 sand=1.4 depth=.9 pour=.3 memory=1 stagger=.7 release=6 volume=6 | round | tower | Bells that come about again each in its own time
Garden latch in iron | - | body=Bar strike=.7 tilt=.3 frame=1500 turn=Let_go sand=.9 depth=.8 exchange=.3 grains=0 release=2 volume=-1 settling=20 split=.4 | airyroom | highpeal | Clear bars that ring back up to their knock at the lift of the hand
Pine xylophone, outdoors | - | body=Bar strike=.9 tilt=.1 frame=800 turn=New_key sand=.7 inertia=.1 stagger=.2 beat=0 release=1.4 volume=6 pour=.45 depth=.55 apart=.2 | steps | palindrome | Wooden bars knocked hard and knocked again by the next
Fan above the bars | - | body=Bar strike=.35 tilt=.4 frame=600 sand=2.6 depth=.4 neck=Hover exchange=.2 beat=3 ears=.8 grains=0 release=5 volume=6 pour=.9 split=.3 | harmonic | palindrome | Bars fanned quickly, hovering and hardly fading
Prayer bar in the hills | - | body=Bar strike=.5 tilt=-.2 frame=2000 sand=6 depth=.7 pour=.3 exchange=.9 beat=.4 grains=.1 ears=.7 release=9 volume=1 split=-.35 apart=.3 | expanse | highpeal | High bars with six seconds of sand, the overtones moving within
Bars of rain | - | body=Bar tilt=-.03 frame=2180 turn=Empty_glass sand=.5 memory=.6 stagger=.9 grains=.6 ears=1 release=3 volume=6 depth=.55 strike=.5 apart=.5 settling=30 | rain | highpeal | Thin bars that bounce from empty with grains between
Nursery at four | Short sand plucks | body=Bell tilt=-.2 frame=1100 strike=.4 sand=1.1 depth=.6 stagger=.2 release=3 volume=2.5 memory=.55 split=.35 apart=.3 | farstar | palindrome | Small round bells that rock back by themselves, softer each time
Brass thread on a loom | Short sand plucks | body=Bell strike=.7 sand=1.4 memory=1 exchange=.5 release=4 volume=2 tilt=.3 frame=1100 split=.5 depth=.35 | limitroom | tower | Bells with odd and even partials at opposite ends of the sand
Cup and spoon, distant | Short sand plucks | body=Bell strike=.6 memory=.6 settling=60 release=2.5 volume=6 depth=.6 sand=.9 tilt=-.1 frame=1600 | longplate | highpeal | Small cups struck, bent and struck again from empty
Crown of a clock tower | Short sand plucks | body=Bell tilt=-.5 frame=700 strike=1 sand=1.6 depth=.7 pour=.3 turn=New_key inertia=.2 memory=.9 release=5 volume=5 settling=40 | latehall | lowpeal | Heavy bells, struck with all the weight of the clapper
Icicles, tuned | Short sand plucks | body=Glass strike=.5 sand=.9 depth=.5 turn=Let_go exchange=.7 grains=.2 release=3 volume=0 tilt=-.77 frame=830 split=.6 apart=.2 | evaporate | tower | Round glass that runs home when let go, its overtones changing places
Halo after the hour | Hovering glass pad | body=Bell tilt=-.1 frame=1000 strike=.5 attack=.02 sand=2 depth=.6 beat=.6 release=7 volume=-1 pour=.8 settling=20 | nave | tower | Struck bells that slow as they come home and hang there glowing
Bell caught in a net | Hovering glass pad | body=Bell tilt=.1 frame=1050 strike=.6 attack=.015 sand=.9 depth=.5 inertia=.3 split=-.6 exchange=.4 ears=.9 release=6 volume=6 | jet | highpeal | Bells whose high partials climb while the hum sinks
Bowl in a monk's lap | Hovering glass pad | body=Bell tilt=-.6 frame=330 strike=.4 attack=.03 sand=4 depth=.5 exchange=.5 beat=1.6 grains=0 release=10 volume=-1 split=.3 | bowls | lowpeal | A low bowl, tapped, that beats and hardly moves from its beginning
Temple fish, wooden | Hovering glass pad | body=Bar tilt=-.1 frame=420 attack=.01 sand=.8 pour=.25 neck=Strike turn=New_key inertia=.1 exchange=.1 beat=.1 release=1.5 volume=6 strike=.7 depth=.6 settling=45 | darkplate | lowpeal | Hollow wooden knocks, each calling the last one back
Pane struck with a ring | Hovering glass pad | strike=.7 attack=.012 sand=1.5 depth=.6 beat=1.2 release=6 tilt=-.2 frame=1000 volume=0.5 apart=.3 split=-.4 | sparks | twohands | Struck glass that comes back and hovers by its stroke at every new key
Skin bells of a caravan | Drum of sand | turn=New_key tilt=.6 frame=1600 sand=1 settling=30 grains=.2 exchange=.6 ears=.9 release=2 volume=2.5 strike=.45 depth=.55 apart=.35 | valley 1.mix=0.22 | tower | Thin skins so tuned that they ring like small bells
Gong without a centre | Drum of sand | tilt=.3 frame=560 strike=.7 sand=2.5 depth=.5 settling=20 grains=.1 split=.7 exchange=.8 beat=1.7 memory=.9 release=5 volume=2.5 | cathedral 1.mix=0.22 | lowpeal | Beating low metal and hide, half of it rising as half of it falls
Teapot lids | Drum of sand | turn=Let_go sand=.5 depth=.8 settling=60 grains=.1 memory=1 release=1.2 volume=4.5 strike=.65 tilt=.2 frame=1500 split=.5 | hint | highpeal | Small clanks that clank once more when the key comes up
Seven hung stones | Drum of sand | body=Bar turn=New_key tilt=-.15 frame=830 strike=.8 sand=1.2 depth=.8 settling=50 grains=.4 memory=.8 release=2 volume=6 apart=.3 | cavern | palindrome | Stone bars with a scatter of grit at every turn
Village clock, rusted | Drum of sand | body=Bell tilt=-.3 frame=520 strike=.8 sand=1.6 depth=.7 settling=130 grains=.5 memory=.4 beat=2.2 release=4 volume=3 | memory | lowpeal | A rusty bell, bent far out of tune at each stroke, that soon forgets itself
Seen through a keyhole | Long glass | body=Bell tilt=.1 frame=1800 strike=.6 sand=10 depth=.8 pour=.35 exchange=.6 settling=10 release=10 ears=.6 volume=3 apart=.5 | airy | highpeal | Bells with ten seconds of sand, thinning without a hurry
Verses of one bell | Long glass | body=Bell tilt=-.4 frame=440 strike=.5 sand=5 depth=.6 neck=Soften exchange=1 beat=.7 grains=0 release=8 pour=.8 apart=.3 | muffled | lowpeal | Dark long bells, the strength handed from one overtone to the next
Eclipse at midday | Long glass | body=Bell tilt=.3 frame=1200 strike=.4 sand=7 depth=.9 split=-1 exchange=.3 grains=.2 release=10 volume=6 pour=.7 | reveal | tower | Bells whose top lights up slowly as their body goes dark
Ember kept under glass | Long glass | strike=.4 sand=6 depth=.5 neck=Hover settling=0 exchange=.6 grains=.1 release=8 volume=4.5 tilt=-.7 frame=480 split=.35 | ah | palindrome | Glass tapped once and left to glow for six seconds
Bronze, then its shadow | Long glass | body=Bell tilt=0 frame=700 strike=.8 sand=4 depth=1 pour=.9 neck=Pass turn=Let_go exchange=.5 release=5 volume=2.5 | drifter | lowpeal | Full bells that fall off late, and cross into shadow when let go
Quarter bells, unhung | Neighbour pulses | body=Bell tilt=.2 frame=1500 strike=.7 apart=.8 sand=.9 depth=.7 stagger=.4 ears=.8 release=3 volume=5.5 | unfold | tower | Bells that turn only the bells beside them, already on their way when struck
Dinner gong upstairs | Neighbour pulses | body=Bell tilt=-.6 frame=280 strike=.8 apart=0 sand=2.4 depth=.6 exchange=.6 beat=1.1 release=5 volume=0.5 pour=.75 settling=25 split=.3 | nextdoor | lowpeal | A soft low gong turned over by the next stroke
Crickets in bronze | Neighbour pulses | body=Bell apart=.4 sand=.22 stagger=.8 ears=1 release=2.5 volume=2 strike=.15 depth=.55 tilt=.2 frame=1900 split=-.4 | gates | tower | Small bells trembling on a fifth of a second of sand
Handbells, gloved | Neighbour pulses | body=Bell tilt=-.1 frame=900 attack=.03 apart=0 sand=1.6 depth=.5 neck=Soften beat=.5 release=3 volume=0 strike=.1 pour=.85 split=.3 | warm | palindrome | Handbells without a stroke, each bringing the last one back round
Anchor lights answering | Neighbour pulses | body=Glass tilt=-.22 frame=1010 strike=.5 apart=.6 sand=1.2 depth=.8 neck=Pass stagger=.5 beat=.6 ears=.9 release=3.5 volume=6 settling=20 | farstar 1.mix=0.45 | tower | Glass bells, some on the near side of their beginning and some beyond it
`,
    },
    {
      id: 'opposed-drones',
      name: 'Opposed drones',
      category: 'drone',
      rows: `
Forge bellows, shared | Opposed drone | tilt=.35 frame=900 sand=2.4 depth=.9 attack=.8 beat=1.4 ears=.6 inertia=.8 volume=0 pour=.9 apart=.15 | chapel | ground | Reeds passing the weight between odd and even partials, slow to turn
Mill race under ice | Opposed drone | tilt=.6 frame=1300 sand=1.4 depth=.5 attack=1.2 split=.6 exchange=.9 beat=1.1 ears=1 volume=0 apart=.3 | currents | ground | Bright reeds with every overtone on the move at a different hour
Crypt with one window | Opposed drone | tilt=-.7 frame=190 sand=6 depth=.7 attack=2 split=.8 beat=.15 ears=.3 release=8 pour=.9 apart=.25 grains=.15 | cistern | suspended | Dark reeds that take long to pass from hollow to full
Pipes still breathing | Opposed drone | tilt=.1 frame=760 sand=4 depth=.9 attack=.6 neck=Strike strike=.2 exchange=.2 beat=.7 volume=4 pour=.2 | breathing | - | Reeds in two ranks, one at its brightest when the other is gone
Belfry full of wings | Opposed drone | tilt=.4 frame=2100 sand=.9 depth=.4 attack=1 exchange=.5 beat=4 ears=.9 stagger=.6 volume=1 apart=.4 grains=.3 | flock | ground | Reeds beating fast, the two halves crossing every couple of seconds
Both hands on the bow | Opposed drone | body=String tilt=-.1 frame=440 sand=3 depth=.7 attack=.9 exchange=.3 volume=-3.5 turn=New_key beat=.7 settling=15 | longplate | ground | Bowed strings, the odd partials full while the even ones wait
Loom at rest | Opposed drone | body=String tilt=.3 frame=980 sand=1.8 attack=.5 split=.5 beat=1.6 ears=.9 exchange=.7 turn=New_key depth=.4 apart=.2 | strings | suspended | Strings beating quickly, some of their partials against the sand
Undertaker's fiddle | Opposed drone | body=String tilt=-.5 frame=260 sand=5 attack=1.5 settling=45 exchange=.4 beat=.2 volume=6 depth=.5 pour=.75 | nave | - | Low strings leaning a little sharp at one end of the sand
Dust in the f holes | Opposed drone | body=String tilt=.1 frame=600 sand=2.2 depth=.6 attack=.7 grains=.6 exchange=.5 beat=.9 ears=.5 turn=New_key settling=20 apart=.3 | wood 1.mix=0.4 | ground | Strings with a soft pouring of sand from one half to the other
Horsehair horizon | Opposed drone | body=String sand=2.6 exchange=.8 beat=.3 ears=1 turn=New_key depth=.45 tilt=.4 frame=1700 attack=1 apart=.35 settling=15 | evaporate | highveil | Thin high strings trading overtones across the whole width
Tall ship, low sky | Opposed drone | body=String split=-1 tilt=.2 frame=1100 sand=3.5 depth=.6 attack=1 exchange=.4 beat=.6 volume=-1 pour=.8 | bowedbed | ground | Strings whose top brightens as the bottom sinks away
Roots and branches | Opposed drone | body=String split=-.6 tilt=.45 frame=700 sand=1.6 depth=.75 attack=.4 neck=Hover exchange=.2 beat=1 ears=.6 volume=-1.5 apart=.25 | undertow | suspended | Strings in two storeys, hovering when the lower is at its strongest
Kite above a quarry | Opposed drone | body=Reed split=-.9 tilt=.7 frame=1800 sand=2 depth=.5 attack=1.6 exchange=.6 beat=.2 ears=.8 volume=-1.5 pour=.2 apart=.3 grains=.3 | airy | spires | Reeds whose high partials lift off and settle back
Shade moves up the wall | Opposed drone | body=Reed split=-.7 tilt=0 frame=420 sand=8 depth=.8 attack=.8 exchange=.3 beat=.5 volume=-1 pour=.9 | melt | ground | A reed whose brightness climbs out of it over eight seconds and more
Smoke leaves the candle | Opposed drone | body=Glass split=-.8 tilt=.1 frame=900 sand=2.8 depth=.9 attack=.6 exchange=.5 beat=.9 grains=.2 volume=5 settling=30 | climbing | - | Glass whose upper tones rise as the flame of it goes down
Bronze, always growing | Opposed drone | body=Bell tilt=-.3 frame=380 sand=3 depth=.5 attack=.8 exchange=.6 beat=1.3 ears=.7 turn=New_key apart=.4 | darkhall | oblique | Bells with no stroke, one half always growing
Great wheel of bells | Opposed drone | body=Bell tilt=.3 frame=1400 sand=4.5 depth=.7 attack=1.2 apart=.8 stagger=.5 beat=.4 volume=6 | cathedral | ninth | Bells along a wheel of sand, the partials of each split in two
Rust under the paint | Opposed drone | body=Bell sand=1.6 depth=.6 attack=.5 settling=100 exchange=.4 beat=2.2 grains=.15 tilt=-.2 frame=420 pour=.25 | cave | suspended | Low bells bending in and out of tune with the sand
Signal in the bones | Opposed drone | body=Bell split=-1 tilt=.1 frame=560 sand=.8 depth=.5 attack=.6 exchange=.1 beat=.1 ears=.9 pour=.7 | lowpulse | suspended | Bells whose hum and crown swell against each other, quite still in pitch
Abbey slipping by | Opposed drone | body=Bell split=.7 tilt=.6 frame=2300 sand=6 exchange=.8 beat=.8 volume=6 attack=1.5 depth=.45 apart=.6 settling=25 | stretch | highveil | High bells drawn out slowly, the partials entering by turns
Lit from either end | Opposed drone | body=Glass tilt=-.4 frame=500 sand=3 depth=.6 attack=1 exchange=.7 beat=.5 ears=.9 apart=.2 pour=.85 | mist | ground | Dark glass, lit from one side and then from the other
Salt poured bowl to bowl | Opposed drone | body=Glass tilt=.2 frame=1700 sand=1.5 depth=.7 attack=.7 grains=.8 exchange=.3 beat=.3 volume=-1.5 | veilgrain | ground | Glass with the sand heard running from bowl to bowl
Lake of cold lamps | Opposed drone | body=Glass tilt=.6 frame=2700 sand=5 depth=.4 attack=2.4 exchange=1 beat=1.8 ears=1 apart=.45 | glasstail | spires | Cold glass that never holds one colour
Filament, unlit | Opposed drone | body=Glass split=.4 tilt=-.8 frame=250 sand=9 depth=.7 attack=1.4 neck=Hover exchange=.4 beat=.1 ears=.2 pour=.95 | sines | suspended | A near pure hum of glass, hanging by its beginning
Fish tank, lights off | Opposed drone | body=Glass tilt=0 frame=820 sand=2 attack=.5 neck=Pass settling=25 exchange=.6 beat=.8 volume=6 depth=.35 | shallows 1.depth=0.4 | - | Glass crossing its beginning both ways at once
Pure as a bottled note | Opposed drone | body=Bar tilt=-.5 frame=160 sand=2.5 depth=.15 attack=.8 exchange=.05 beat=.4 ears=.4 pour=.7 | bottle | ground | A low bar that is nearly one tone, its octave coming and going
Beam of the long barn | Opposed drone | body=Bar tilt=.5 frame=480 sand=3.5 depth=.8 attack=.6 exchange=.6 beat=.9 ears=.8 volume=-1.5 apart=.5 | wood | ground | Bars trading their note for their double octave and back
Spirit level | Opposed drone | body=Bar split=-.5 tilt=-.1 frame=300 sand=7 depth=.1 attack=1.8 exchange=.9 beat=.2 | longdark | suspended | Bars that scarcely fade, only leaning from low to high
Hull at anchor | Opposed drone | body=Bar split=.8 tilt=-.8 frame=125 sand=1.8 depth=.7 attack=.4 inertia=1 beat=1 volume=0.5 pour=.85 | deeper | - | A low round hull of sound, heavy in every turn
Streetlight on its wire | Opposed drone | body=Bar tilt=.9 frame=1500 sand=1.2 depth=.6 attack=.5 exchange=.4 beat=3 ears=1 volume=2.5 apart=.3 settling=20 | driftshift | spires | Bars all overtone, swinging from ear to ear
Drumhead humming | Opposed drone | body=Skin sand=2.6 attack=.7 settling=0 exchange=.3 beat=.6 grains=.05 turn=New_key depth=.4 tilt=0 frame=360 apart=.3 | monks | oblique | A skin that hums instead of being struck, its halves in turn
Hide stretched on a hill | Opposed drone | body=Skin tilt=.3 frame=1000 sand=1.3 depth=.7 attack=.9 settling=30 grains=.7 exchange=.7 ears=1 volume=-1.5 apart=.4 | surf | oblique | Skins and blown sand, the one swelling as the other thins
Thunder that never came | Opposed drone | body=Skin split=-.9 tilt=-.7 frame=140 sand=5 depth=.8 attack=1.5 settling=15 beat=.9 release=7 volume=-1.5 pour=.9 | bank | suspended | Very low skins gathering and withdrawing
Frame drum in the sun | Opposed drone | body=Skin split=.5 tilt=.6 frame=1700 sand=3 depth=.4 attack=.5 settling=80 exchange=.9 beat=.4 volume=4 apart=.2 | roundvowel | suspended | Skins leaning on their overtones, sliding a little at each end
Lid of the world | Opposed drone | body=Skin frame=420 sand=.7 depth=.6 attack=.6 neck=Hover settling=10 beat=1.8 ears=.8 tilt=.1 apart=.4 | halfspeed | suspended | Skins that tremble between two halves of themselves
Change of guard | Both bulbs | split=1 tilt=-.2 frame=520 strike=0 attack=.9 sand=2 depth=.6 turn=Empty_glass exchange=.5 beat=.4 release=5 volume=6 pour=.2 settling=15 | doubled | ground | Strings passing through their beginning with half of them going the other way
Shore and far shore | Both bulbs | body=Reed split=.6 tilt=.2 frame=900 strike=0 attack=1.3 sand=3 depth=.5 turn=Empty_glass grains=0 beat=.8 release=6 volume=-0.5 pour=.75 apart=.3 | fifthround | oblique | Reeds crossing from a hollow bank to a full one and back
Mist on either hand | Both bulbs | body=Bell split=-.7 tilt=-.4 frame=640 strike=0 attack=1.8 sand=1.4 exchange=.7 beat=1.5 release=8 turn=New_key depth=.5 apart=.5 settling=35 | cloud | ninth | Dim bells crossing over, their tops out of step with their hum
Railings going by | Both bulbs | body=Bar split=1 tilt=.3 frame=700 strike=0 attack=.4 sand=.5 stagger=.3 beat=.2 ears=.9 release=3 volume=-5.5 turn=New_key depth=.6 apart=.4 | pan | suspended | Bars that flicker in and out all the while, half against half
Sundogs over a field | Both bulbs | body=Glass split=.9 tilt=.5 frame=2500 strike=0 attack=1.1 sand=4 depth=.6 turn=Empty_glass exchange=.8 grains=.3 release=8 volume=6 apart=.55 | frost | spires | Thin glass lit from both sides in turn
Transformer, friendly | Opposed drone | sand=.3 tilt=-.1 frame=500 depth=.6 attack=.5 exchange=.2 beat=.2 ears=.7 inertia=.1 stagger=0 volume=-0.5 pour=.8 settling=15 | lowpulse 1.depth=0.5 | - | Reeds flickering between their two halves
Refrigerator at night | Opposed drone | body=String sand=.45 tilt=-.6 frame=170 depth=.5 attack=.8 inertia=.2 beat=.6 ears=.2 volume=3 pour=.9 | steps | ground | Low strings with a soft throb that never quite stops
Moth at a paper lamp | Opposed drone | body=Glass sand=.22 tilt=.3 frame=1400 depth=.7 attack=.4 inertia=0 stagger=.7 beat=.4 ears=1 volume=0 apart=.3 | glimmer | suspended | Glass fluttering on a fifth of a second of sand
Purr, high and low | Opposed drone | body=Bell split=-.8 sand=.35 tilt=-.4 frame=330 depth=.45 attack=.7 inertia=.1 beat=1 settling=30 apart=.2 | rotary | suspended | Dull bells whose low half and high half purr by turns
Wings held open | Opposed drone | body=Skin sand=.4 tilt=.2 frame=780 depth=.55 attack=1 settling=10 grains=.3 inertia=.2 beat=2.4 ears=.9 volume=0 apart=.35 | wander | highveil | Skins that beat like wings, one side and then the other
Plucked once and held on | Opposed drone | body=String strike=.6 attack=.015 tilt=.2 frame=850 sand=1.6 depth=.6 neck=Strike split=.5 exchange=.5 beat=.3 volume=3.5 apart=.25 settling=18 pour=.2 | pedal | ground | Plucked strings that keep on sounding, struck again at each return
Thumb across the strings | Opposed drone | body=String strike=.8 attack=.01 tilt=.5 frame=1500 sand=1 depth=.5 neck=Strike split=.3 stagger=.6 exchange=1 beat=.2 settling=12 apart=.45 | paper 1.mix=0.35 | ground | Bright plucked strings ringing on, the overtones climbing through each
Bell that fills a valley | Opposed drone | body=Bell strike=.7 attack=.02 tilt=-.2 frame=480 sand=5 neck=Soften split=.8 beat=.8 release=9 volume=6 depth=.5 settling=40 | valley | suspended | A low stroke, and then the two halves of a bell in exchange
Sand on a chime floor | Opposed drone | body=Bar strike=.5 attack=.02 tilt=.1 frame=1200 sand=2 depth=.7 neck=Strike apart=.9 grains=.9 exchange=.4 | dissolve | spires | Bars knocking each at its own hour with sand always running
Gate held ajar | Opposed drone | turn=New_key body=Reed strike=.1 attack=.5 tilt=.3 frame=620 sand=20 depth=.7 split=-.4 exchange=.7 beat=.6 pour=.9 grains=.15 | howl | suspended | Reeds on twenty seconds of sand that only a new key disturbs
`,
    },
    {
      id: 'falling-textures',
      name: 'Falling textures',
      category: 'texture',
      rows: `
Scree in moonlight | Falling texture | strike=.5 sand=1.2 depth=.8 apart=1 settling=30 grains=.8 beat=.8 release=4 volume=-2 tilt=-.6 frame=870 split=-.3 | valley | ninth | Loose glass letting go of itself, key after key, in dry grains
Salt shaken over stars | Falling texture | sand=.45 depth=.5 apart=.5 settling=0 exchange=.4 beat=.3 volume=-3 tilt=-.78 frame=500 split=.4 grains=.8 | stars | gears | Small glass on a quick sand, in tune and thick with grains
Window in pieces | Falling texture | sand=2 depth=.9 pour=.1 settling=150 grains=.5 memory=.4 volume=2 tilt=-.12 frame=980 strike=.7 | dissolve | gears | Glass bent far sharp at every landing and never twice as bright
Limewater | Falling texture | tilt=-.5 frame=600 strike=.6 sand=1.6 depth=.8 stagger=.6 settling=20 grains=.3 exchange=.5 beat=.6 volume=0.5 split=.3 pour=.2 | cave | ninth | Round glass drops landing out of step
Powder off the eaves | Falling texture | strike=0 attack=.5 sand=3 depth=.4 neck=Soften settling=10 beat=1.2 release=6 volume=-3.5 tilt=-.44 frame=960 pour=.85 | frost | oblique | A soft powder of glass sliding down and back up
Quarry on a holiday | Falling texture | body=Skin tilt=-.1 frame=420 strike=.8 sand=.9 depth=.8 settling=70 grains=.7 beat=.5 inertia=.3 volume=6 split=.25 pour=.15 | cavern | - | One stone after another let go into the pit
Boulders under ice | Falling texture | body=Skin tilt=-.7 frame=140 strike=.7 sand=1.8 depth=.7 settling=50 grains=.2 exchange=.4 beat=1 inertia=.6 volume=-4 pour=.8 | larger | ninth | Low muffled thuds that roll back the way they came
Dry riverbed | Falling texture | body=Skin tilt=.5 frame=1700 strike=.4 sand=.6 depth=.6 settling=20 grains=1 exchange=.9 beat=.2 volume=-1.5 split=.5 | patter | gears | Skins and pebbles, all rattle and little note
Tarpaulin full of sand | Falling texture | body=Skin tilt=0 frame=260 strike=.3 attack=.1 sand=3.5 depth=.5 neck=Hover grains=.9 settling=40 volume=4.5 pour=.9 | surf | - | A sagging skin with sand poured over it steadily
Children on a tin roof | Falling texture | body=Skin tilt=.2 frame=900 sand=.3 depth=.9 settling=90 grains=.4 memory=.8 stagger=.5 volume=1 strike=.65 split=-.4 | stone | ostinato | Quick skins that stamp and tumble at every return
Carillon coming loose | Falling texture | body=Bell tilt=.1 frame=1200 strike=.7 sand=1.4 depth=.7 settling=40 grains=.3 beat=.8 volume=-0.5 split=.35 | leaves | gears | Bells landing one by one, each bent as it lands
Bell tree in a gust | Falling texture | body=Bell tilt=.7 frame=2800 strike=.3 sand=.5 depth=.6 settling=10 grains=.4 exchange=.3 beat=1.5 volume=3 split=-.6 | crystals | highveil | Very small bells stirred by one gust, the high ones quicker
Church roof, molten | Falling texture | body=Bell tilt=-.5 frame=360 strike=.4 sand=3 depth=.6 settling=130 grains=.1 beat=2.6 memory=.8 release=6 volume=-2.5 pour=.7 | melt | ninth | Low bells sagging into tune and out again
Each star a nail | Falling texture | body=Bell tilt=.3 frame=2100 sand=.8 depth=.8 settling=0 grains=.2 beat=.1 memory=.7 volume=6 pour=.32 strike=.8 | farstar | spires | Hard points of bell that vanish and are driven in again
Old coins through water | Falling texture | body=Bell tilt=-.1 frame=780 strike=.5 sand=2.2 depth=.8 neck=Pass settling=60 grains=.5 exchange=.6 volume=-2.5 pour=.8 | shallows | gears | Bells turning over as they sink, one face and then the other
Hail on the harvest | Falling texture | body=Bar tilt=-.1 frame=450 sand=.4 settling=10 grains=.7 exchange=.2 beat=.2 volume=1 strike=.7 depth=.8 split=.4 pour=.2 | rain | ostinato | Hard little bars and grit, striking out of time
Logs let into a lake | Falling texture | body=Bar tilt=-.5 frame=180 strike=.6 sand=2.4 depth=.7 settling=80 grains=.2 inertia=.5 beat=.6 volume=-3 pour=.85 | latehall | ninth | Low bars that slide in, go under and rise again
Windmill made of spoons | Falling texture | body=Bar tilt=.8 frame=2400 strike=.5 sand=.25 depth=.5 settling=5 grains=.1 memory=.9 beat=.6 volume=0 split=.6 | tiles | gears | Thin bars clicking round on a quarter of a second of sand
Fence falls in a field | Falling texture | body=Bar tilt=0 frame=640 strike=.8 sand=1 depth=.8 pour=.9 settling=30 grains=.4 inertia=.2 volume=2 | embers | twohands | Wooden bars toppling at their own hours
Chalk dust of a lesson | Falling texture | body=Bar tilt=.22 frame=610 strike=0 attack=.2 sand=1.5 depth=.4 neck=Soften grains=1 exchange=.8 beat=1.1 volume=-0.5 split=-.5 | veilgrain | highveil | Soft bars behind a steady fall of dust
Harp in the hail | Falling texture | body=String tilt=.18 frame=1800 strike=.8 sand=.9 depth=.8 settling=30 grains=.6 exchange=.4 beat=.4 volume=-1.5 pour=.15 | drip | twohands | Plucked strings landing key by key with ice among them
Wire fence thawing | Falling texture | body=String tilt=.1 frame=700 strike=.5 sand=2 depth=.6 settling=120 grains=.3 exchange=.7 beat=1.4 memory=.8 volume=0 split=.35 | evaporate | gears | Strings that begin stretched and slacken by degrees into tune
Cobwebs pulled down | Falling texture | body=String tilt=-.4 frame=460 strike=.1 attack=.15 sand=1.2 depth=.8 neck=Soften settling=20 grains=.4 beat=.5 volume=2.5 pour=.75 | bank | ninth | Soft threads giving way and drifting back
Net hauled in at dawn | Falling texture | body=String tilt=.6 frame=1300 strike=.6 sand=.5 depth=.7 neck=Strike settling=15 grains=.8 memory=1 beat=.2 volume=-3 split=-.35 | orbits | ostinato | Quick plucks in a net of grains, every return whole
Shelf gives way at last | Falling texture | body=String tilt=-.2 frame=300 strike=1 sand=3 depth=.9 pour=.8 settling=60 grains=.5 stagger=.4 beat=.6 volume=1.5 | swellroom | spires | Strings that hold full, then all go down at once
Starlings at low tide | Falling texture | body=String tilt=.1 frame=1100 strike=.2 attack=.06 sand=.6 depth=.6 settling=40 grains=.2 beat=3.5 exchange=.5 volume=0.5 split=.7 | flock | gears | Thin strings wheeling past each other, fast and beating
Cattle through a ford | Falling texture | body=Reed tilt=-.5 frame=280 strike=.3 attack=.1 sand=1.4 depth=.7 settling=70 grains=.6 beat=1 inertia=.5 volume=-4 pour=.8 | shallows 1.depth=0.4 | ninth | Low reeds lowing out of step in a wash of sand
Leaves in a letterbox | Falling texture | body=Reed tilt=.1 frame=820 strike=0 attack=.25 sand=2.6 depth=.8 neck=Hover settling=10 grains=.8 exchange=.8 volume=-2 pour=.95 split=.3 | leaves 1.mix=0.22 | gears | Papery reeds, each hanging a while before it drops
Queue of small horns | Falling texture | body=Reed tilt=.5 frame=1100 strike=.5 attack=.03 sand=.4 depth=.9 pour=.6 settling=20 grains=0 beat=.4 memory=.9 volume=1.5 | round | ostinato | Little horns that take their turns and turn back
Choir on a landslide | Falling texture | body=Reed tilt=-.2 frame=560 strike=0 attack=.4 sand=4 depth=.6 neck=Pass settling=150 grains=.3 beat=1.8 release=6 volume=0 split=-.4 pour=.7 | choirgrain | spires | Reed voices sliding down into tune from either side
Aurora, badly tuned | Falling texture | tilt=-.75 frame=370 strike=0 attack=.6 sand=2.5 depth=.5 settling=150 grains=.1 beat=5 neck=Hover release=7 volume=4 split=.5 | glimmer | highveil | Glass bent as far as it goes, beating fast and floating
Paper lanterns burning | Falling texture | body=Bell tilt=.2 frame=1700 strike=0 attack=.3 sand=1 depth=.7 settling=100 grains=.5 split=.8 beat=2 release=5 volume=-2 | glow | gears | Soft bells with half of their partials rising as the rest burn down
Swifts in a glass house | Falling texture | strike=.2 sand=.3 depth=.4 settling=60 grains=.2 split=-.7 exchange=1 beat=2.8 volume=-2 tilt=-.3 frame=1300 | drifter | gears | Glass darting between two layers of itself
Past the edge of violet | Falling texture | body=String tilt=.9 frame=3000 strike=.1 attack=.1 sand=1.8 depth=.6 settling=90 grains=.4 split=.6 exchange=1 beat=1.5 volume=1.5 | chime | highveil | Strings with the light pushed to the very top
Pollen count | Falling texture | body=Skin tilt=.7 frame=2300 strike=.1 sand=.7 depth=.5 settling=10 grains=.7 exchange=1 beat=3.2 neck=Pass split=-.5 | summer | gears | Dry high dust with a drum somewhere inside it
Cellar of rolling casks | Falling texture | body=Skin strike=.5 sand=1.2 depth=.6 settling=100 grains=.1 exchange=.2 beat=.7 inertia=.8 volume=-2 tilt=-.5 frame=180 split=.3 | cistern | lowpeal | Low drums rolling from wall to wall and back
Magma, unhurried | Falling texture | body=Reed tilt=-.8 frame=150 strike=0 attack=.8 sand=5 depth=.6 settling=80 grains=.5 exchange=.7 beat=.6 inertia=.7 release=7 volume=-2 pour=.9 | deeper | ground | Low dark reeds creeping along the sand
Landslip far offshore | Falling texture | body=Bar tilt=-.6 frame=130 strike=.8 sand=3 depth=.8 settling=120 grains=.6 beat=.3 inertia=.4 volume=-0.5 split=.25 | longdark | spires | Deep bars that slide and settle with a drag of gravel
Trawl net over stones | Falling texture | body=String tilt=-.4 frame=200 strike=.7 sand=.8 depth=.7 settling=70 grains=1 beat=.5 volume=-1.5 split=-.3 pour=.2 | undertow | ground | Low strings dragged through as much gravel as there is
Ship's hull in drift ice | Falling texture | body=Bell tilt=-.7 frame=240 strike=.6 sand=1.6 depth=.8 settling=150 grains=.4 exchange=.6 beat=1.6 release=6 volume=-1.5 split=.45 | nave | ground | Low dull bells groaning into tune, with ice along the side
Sewing machine in a mill | Falling texture | body=Bar tilt=.2 frame=1400 sand=.2 apart=.6 settling=0 grains=.3 stagger=.3 memory=1 beat=.1 volume=3.5 strike=.35 depth=.5 split=.4 | gates | ostinato | Bars stitching away on the shortest sand there is
Static between stations | Falling texture | tilt=-.83 frame=780 strike=.1 sand=.2 depth=.6 apart=.3 grains=1 stagger=.9 exchange=.2 beat=1 volume=-4.5 split=-.6 | kitchen | gears | Trembling glass behind a hiss of grains
Boiling, barely | Falling texture | body=Bell tilt=-.2 frame=600 strike=.2 sand=.28 depth=.7 apart=.9 settling=80 grains=.5 memory=.9 volume=-2 pour=.2 | shallows 1.bubbles=0.4 | ninth | Bubbling bells, each key at its own small boil
Cicadas before the storm | Falling texture | body=Reed tilt=.63 frame=2220 strike=.1 attack=.2 sand=.22 depth=.7 apart=1 settling=0 grains=.6 beat=2 volume=6 split=.5 pour=.2 | wander | highveil | A field of thin reeds shaking at many speeds
Telegraph in a blizzard | Falling texture | body=String tilt=.3 frame=1100 sand=.24 apart=.7 grains=.9 memory=1 beat=.1 settling=5 volume=-1 strike=.45 depth=.75 split=.3 | memory | ostinato | Plucks tapping on and on through driven snow
Glacier keeps its hours | Falling texture | body=Glass tilt=-.3 frame=420 strike=.3 sand=12 depth=.8 apart=.4 settling=100 grains=.7 exchange=.6 beat=.4 release=12 volume=-3.5 pour=.85 split=-.35 | horizon | spires | Dark glass on twelve seconds of sand, always creeping
Dune on the move | Falling texture | body=Reed tilt=.1 frame=900 strike=0 attack=1.2 sand=7 depth=.4 apart=.2 neck=Soften settling=20 grains=1 beat=.7 release=8 volume=-1.5 pour=.85 | stretch | ground | More sand than tone, a reed somewhere beneath it
Attic emptied slowly | Falling texture | body=Skin tilt=.1 frame=500 strike=.6 sand=9 depth=1 apart=.8 pour=.05 settling=60 grains=.5 exchange=.5 release=8 volume=6 | bed | gears | Thuds and their dust, returning after a long while
Hour the wall comes down | Falling texture | body=Bell tilt=.4 frame=1400 strike=.8 sand=6 depth=.9 pour=.95 apart=.6 grains=.6 settling=50 beat=1 release=9 volume=-1 | cathedral | spires | Bells that stand for seconds and then give way in dust
Rain comes off the sea | Falling texture | body=String tilt=.24 frame=1970 strike=.2 attack=.3 sand=5 depth=.6 apart=1 neck=Hover grains=.9 beat=2.2 release=8 volume=-2 split=.4 | mist 1.mix=0.28 | ninth | Strings strewn along the sand, a fine rain of grains coming over
`,
    },
    {
      id: 'returning-voices',
      name: 'Returning voices',
      category: 'voice',
      rows: `
Evening psalm, few seats | Returning voices | tilt=-.3 frame=520 attack=.5 sand=2.4 depth=.7 beat=.8 split=.4 apart=.2 pour=.8 | chapel | hymn | Close voices that sink and come back as a dark wave
Ah, through a doorway | Returning voices | tilt=.1 frame=900 attack=.3 sand=1.2 depth=.6 exchange=.4 beat=1.8 ears=.8 volume=1 apart=.3 pour=.7 | steps | hymn | An open vowel of reeds that swells and fades by half
Bench of sleepy basses | Returning voices | tilt=-.8 frame=230 attack=.7 sand=3.2 depth=.8 inertia=.8 ears=.3 pour=.9 grains=.2 | monks | suspended | Bass voices, round and slow, heavy in every turn
Nuns behind a grille | Returning voices | tilt=.4 frame=1500 attack=.25 sand=.9 depth=.8 exchange=.2 beat=.5 split=-.4 settling=20 volume=0 | nave | highveil | Narrow high reed voices that come and go quickly
Lullaby of the engine | Returning voices | tilt=-.5 frame=340 attack=.4 sand=.5 depth=.5 inertia=.3 beat=.3 stagger=0 pour=.85 grains=.15 split=.5 volume=-2 | cassette | hymn | Soft voices rocking on half a second of sand
Alto with her eyes shut | Returning voices | tilt=0 frame=700 attack=.15 sand=1.8 depth=.2 neck=Hover exchange=.05 beat=.2 ears=.2 volume=2.5 | late | chantline | One plain voice that hovers close to its beginning | voice
Boy treble on the stairs | Returning voices | tilt=.5 frame=1900 attack=.1 sand=2.6 depth=.6 neck=Strike strike=.1 exchange=.3 beat=.1 ears=.3 volume=0.5 settling=15 split=-.3 | late | chantline | A thin clear voice that brightens each time it comes home | voice
Widow at the well | Returning voices | tilt=-.2 frame=1100 attack=.2 sand=1.4 depth=.95 neck=Soften settling=60 beat=.4 volume=1 | thinveil | chantline | A voice that leans sharp, falls to nothing and is drawn up again
Shepherd's reply | Returning voices | tilt=.2 frame=460 attack=.06 sand=.7 depth=.9 neck=Pass inertia=.2 beat=0 volume=1 pour=.2 | valley | chantline | A call in one vowel and its answer in another | wind
Humming over the dishes | Returning voices | tilt=-.9 frame=300 attack=.12 sand=1 depth=.4 neck=Soften exchange=.1 grains=.35 beat=.2 ears=.1 volume=0.5 pour=.8 | booth | chantline | A closed mouth and a little running water
Monks' stair, unlit | Opposed drone | neck=Soften tilt=-.6 frame=200 attack=.8 sand=2.8 depth=.6 split=.4 beat=.5 pour=.75 grains=.2 | monks 1.mix=0.22 | suspended | Deep voices, part of them growing while the rest draw breath
Seated in two rows | Opposed drone | neck=Soften tilt=.1 frame=640 attack=.5 sand=1.6 depth=.8 split=1 exchange=.3 beat=.9 volume=-1 apart=.5 | pan | hymn | Two rows of voices that take the chord from each other
Mouths half open | Opposed drone | neck=Hover tilt=-.2 frame=1000 attack=.6 sand=2 depth=.5 split=-.6 exchange=.7 volume=-1 apart=.2 | ah | oblique | Voices whose bright edge rises as their chest falls
Argument in whispers | Opposed drone | neck=Pass tilt=.6 frame=2200 attack=.2 sand=.6 depth=.7 split=.5 exchange=.6 grains=.6 beat=2.2 volume=2.5 apart=.3 | behindglass | hymn | Whispered reeds speaking against each other
Song beneath the song | Opposed drone | neck=Soften tilt=-.1 frame=520 attack=.7 sand=7 depth=.55 split=.7 exchange=.5 pour=.9 settling=18 body=String volume=6 | overtone | ground | Low bowed strings that change hands slowly inside one chord
Cello tells it plainly | Returning voices | body=String tilt=-.3 frame=420 attack=.12 sand=1.6 depth=.6 beat=.2 ears=.3 exchange=.3 volume=-1 settling=16 pour=.75 | late 2.mix=0.25 | chantline | A string that sings a line and comes back to it softly | string
Violas instead of words | Returning voices | body=String tilt=0 frame=800 attack=.5 sand=2.2 depth=.7 beat=1.2 exchange=.6 volume=0 apart=.25 split=.3 | ensemble | hymn | Strings that swell like singers and darken as they return | string
Singing saw, quiet room | Returning voices | body=String tilt=-.7 frame=1200 attack=.2 sand=.9 depth=.5 neck=Hover settling=120 beat=.1 ears=.4 volume=2 | singer | chantline | A string leaning a long way sharp, hovering on one note
Daughters at the loom | Returning voices | body=String tilt=.5 frame=2000 attack=.4 sand=1.2 depth=.8 neck=Pass exchange=.8 ears=1 volume=2.5 split=.4 apart=.3 | loop | oblique | Thin bowed voices that cross over into hollow ones
Old man hums the bass | Returning voices | body=String tilt=-.9 frame=180 attack=.3 sand=2 depth=.5 exchange=.2 beat=.4 ears=.1 volume=3 pour=.9 grains=.2 | bedside | suspended | Dull bowed tones, half sung, that rise again in the dark
Oo from the bottle bank | Returning voices | body=Glass tilt=-.6 frame=480 attack=.2 sand=1.6 depth=.7 beat=.3 volume=-2 pour=.75 settling=20 | bottle | hymn | Rounded glass on one vowel, let swell and fade
Sirens under the pier | Returning voices | body=Glass tilt=0 frame=1000 attack=.6 sand=2.4 depth=.6 settling=80 exchange=.5 beat=1.4 ears=.8 volume=-1 apart=.3 | shallows | oblique | Glass voices that slide into tune and out of it at each return
Choir boys made of ice | Returning voices | body=Glass attack=.3 sand=1.4 depth=.8 neck=Strike strike=.2 exchange=.2 beat=.6 volume=-1 tilt=.1 frame=1700 split=.35 apart=.2 | cathedral | hymn | Clear high glass that brightens at the moment it comes home
Vowel on a wine glass | Returning voices | body=Glass tilt=-.2 frame=760 attack=.35 sand=4 depth=.4 neck=Hover exchange=.9 beat=.2 volume=-7 split=-.3 | roundvowel | suspended | A glass tone that keeps reshaping its mouth as it hovers
Mermaid in the plumbing | Returning voices | body=Glass tilt=-.4 frame=330 attack=.15 sand=.6 depth=.9 neck=Pass settling=40 grains=.3 beat=.8 volume=0 | cistern 1.mix=0.5 | chantline | A round glass call answered from further down the pipe
Hum note, alone | Returning voices | body=Bell tilt=-.5 frame=400 attack=.5 sand=2.2 depth=.6 beat=1.2 strike=.05 pour=.8 split=.3 | darkhall | hymn | A bell with the stroke left out, singing its hum note
Angelus, words forgotten | Returning voices | body=Bell tilt=.2 frame=1100 attack=.3 sand=1.4 depth=.8 exchange=.7 beat=.5 ears=.9 volume=-1 apart=.4 | common | oblique | Bell voices whose overtones rearrange themselves as they fade
Founder's lullaby | Returning voices | body=Bell tilt=-.8 frame=250 attack=.8 sand=3.6 depth=.2 neck=Hover beat=.8 pour=.9 volume=-1 | muffled 1.mix=0.28 | suspended | Very soft bell tones that stay near their beginning
Brass drawing breath | Returning voices | body=Bell tilt=.1 frame=640 attack=.7 sand=1 depth=.7 neck=Pass split=.5 beat=2 volume=1.5 | slowtide | hymn | Breathing bells, half in step and half against it
Saints in the sound bow | Returning voices | body=Bell tilt=.6 frame=2000 attack=1 sand=5 depth=.6 exchange=.8 beat=1.6 grains=.2 apart=.5 split=-.4 | ah | oblique | Bright bell voices slow to open, with grains like a hush over them
Throat of the drum | Returning voices | body=Skin tilt=-.3 frame=300 attack=.3 sand=1.4 depth=.6 settling=20 beat=.5 volume=-2.5 pour=.7 split=.25 | chapel 1.mix=0.2 | suspended | A skin that hums like a closed throat
Badger under the floor | Returning voices | body=Skin attack=.2 sand=.9 depth=.8 settling=110 beat=.9 ears=.3 volume=3.5 tilt=-.4 frame=260 | nextdoor | suspended | A low growl that slides into its note and rises again
Wooden saints | Returning voices | body=Bar tilt=-.1 frame=560 attack=.4 sand=2 depth=.6 exchange=.5 beat=.9 apart=.35 split=.4 volume=-2 | faintoct | hymn | Round wooden tones that swell like a small choir
Owl's two notes | Returning voices | body=Bar tilt=-.8 frame=420 attack=.08 sand=.8 depth=.9 inertia=.3 beat=.1 ears=.2 volume=2.5 settling=25 pour=.2 | farstar | chantline | A hollow hoot that comes back as a second, softer hoot | wind
Reed cutters at noon | Returning voices | body=Bar tilt=.7 frame=1500 attack=.25 sand=1.6 depth=.7 neck=Pass exchange=.3 beat=2.6 ears=.9 volume=0.5 apart=.3 split=-.5 | fifthround | oblique | Bars all overtone, calling over a field and coming back hollow
Both choirs at once | Both bulbs | body=Reed attack=.4 strike=.1 tilt=-.2 frame=600 sand=1.4 depth=.6 grains=0 beat=.9 release=3 volume=-0.5 pour=.75 apart=.25 | hall | hymn | Voices passing from a closed vowel to an open one and back
Through the hedge | Both bulbs | body=Reed attack=.15 strike=.2 tilt=.4 frame=1400 sand=.7 depth=.7 grains=.1 beat=.4 ears=.9 volume=1.5 settling=30 split=.3 | hop | chantline | A nasal call that crosses over and answers from the other side
Priest and people | Both bulbs | body=Reed attack=.3 strike=0 tilt=-.5 frame=280 sand=2.2 depth=.8 apart=.6 grains=0 inertia=.6 | reversed | hymn | Low voices, some on the near side and some already answering
Interpreter's booth | Both bulbs | attack=.5 strike=.1 tilt=.1 frame=950 sand=1.8 depth=.5 exchange=.8 beat=.2 volume=6 split=.5 apart=.2 grains=.2 | roundvowel 1.amount=0.5 | oblique | String voices that say it once plain and once hollow
Veil up, veil down | Both bulbs | body=Glass attack=.6 strike=0 tilt=-.3 frame=700 sand=1.1 beat=1.6 ears=.8 release=5 volume=0 depth=.5 apart=.4 | swelled | hymn | Glass voices changing colour each time the sand runs through
Last breath comes first | Palindrome bells | body=Reed tilt=-.2 frame=600 strike=.1 attack=.2 sand=1.2 depth=.8 neck=Soften release=2 grains=0 pour=.6 split=.45 | hall 1.mix=0.22 | hymn | Voices that swell once more as each chord is let go
Turned at the door | Palindrome bells | body=Reed tilt=.3 frame=1200 strike=.1 attack=.06 sand=.7 depth=.9 neck=Hover release=1.4 grains=0 beat=.9 settling=20 | mirror | chantline | A voice that comes back to the door once its key is let go | voice
Amen, unsaid | Palindrome bells | body=String tilt=-.4 frame=480 strike=0 attack=.4 sand=1.8 depth=.7 neck=Soften release=3.5 split=-.3 apart=.25 | choirtail | hymn | Strings that unsay each chord after the hands have left it | string
Called in from the yard | Palindrome bells | body=Glass tilt=-.24 frame=750 strike=.1 attack=.15 sand=.9 depth=.95 neck=Pass release=2.4 settling=50 volume=3.5 | backwards | chantline | A glassy call that runs home when let go, and on past the gate
Only the refrain | Palindrome bells | body=Bell tilt=-.5 frame=520 strike=.05 attack=.3 sand=1 depth=.8 neck=Soften release=2.8 exchange=.6 beat=1.4 volume=-2.5 split=.35 | round | oblique | Hummed bells that return only when they are let go
Crowd before the music | Returning voices | apart=.9 stagger=.7 tilt=.2 frame=850 attack=.2 sand=.8 depth=.7 settling=40 grains=.3 beat=2.6 ears=1 volume=-1 | flock | hymn | Many reeds murmuring at their own pace
Queue outside the bakery | Returning voices | apart=.5 stagger=1 tilt=.2 frame=420 attack=.1 sand=.45 depth=.6 grains=.2 beat=1 split=-.5 volume=-2 exchange=.8 | patter | hymn | Low voices chatting in short phrases that never line up
Prayer wheel, many hands | Returning voices | apart=.7 stagger=.2 tilt=-.1 frame=560 attack=.4 sand=3 depth=.9 exchange=.5 inertia=.9 pour=.85 | orbits | suspended | Voices spread round a wheel, each rising as another sinks
Steam and laundry songs | Returning voices | body=Skin apart=.4 tilt=.5 frame=1300 attack=.3 sand=1.4 depth=.6 settling=10 grains=.8 exchange=.7 split=.4 volume=-11.5 | summer | oblique | Breathy skins singing through steam
Ghosts at choir practice | Returning voices | body=Glass apart=.8 tilt=.2 frame=1600 attack=.9 sand=2.6 depth=.9 memory=.5 grains=.2 beat=2 ears=1 release=6 volume=-0.5 pour=.2 settling=30 | veilgrain | hymn | Faint glass voices that come back paler each time
`,
    },
    {
      id: 'neighbour-pulses',
      name: 'Neighbour pulses',
      category: 'keys',
      rows: `
Woodpecker, patient | Neighbour pulses | tilt=.2 frame=700 sand=.5 depth=.8 beat=0 release=.5 volume=0 strike=.7 settling=20 | booth | neighbours | Hard wooden pulses, and each new key turns only the key beside it
Lattice of short sticks | Neighbour pulses | tilt=.5 frame=1300 strike=.5 sand=.28 depth=.6 stagger=.5 ears=.9 volume=-1.5 split=.4 | airyroom | gears | Light bars on a short sand, interlocking from ear to ear
Cooper at his barrels | Neighbour pulses | tilt=-.6 frame=160 strike=.9 sand=.8 depth=.7 inertia=.3 settling=20 release=1 volume=6 pour=.2 | wood | lowpeal | Low bars thumped on the stroke and on every return
Balcony of wind chimes | Neighbour pulses | tilt=.9 frame=2500 strike=.3 sand=.7 depth=.9 stagger=.9 exchange=.4 beat=.8 ears=1 release=2.5 volume=1.5 split=-.5 settling=25 | sparks | highveil | Thin bars meeting by accident, the high ones hurrying
Beads on a rail | Neighbour pulses | tilt=0 frame=1000 sand=.35 settling=0 grains=.2 beat=0 release=.18 volume=1.5 strike=.75 pour=.4 depth=.9 exchange=0 | tight | gears | Beads of wood clicking back and forth on their wires
Answer from the porch | Neighbour pulses | body=String tilt=-.1 frame=600 sand=.6 depth=.7 pour=.35 release=1 volume=0 strike=.5 settling=15 apart=.6 | room | neighbours | Plucked pulses that hand the turn to the next key along
String figures | Neighbour pulses | body=String tilt=.3 frame=1400 strike=.4 sand=.35 depth=.5 stagger=.4 exchange=.5 ears=.9 release=1.4 volume=-4 split=.3 settling=18 | stone 1.mix=0.22 | gears | Fine strings crossing each other in and out of step
Shuttle and heddle | Neighbour pulses | body=String tilt=-.5 frame=300 strike=.7 sand=.25 depth=.8 inertia=0 beat=.1 release=.5 volume=0.5 pour=.2 apart=.5 grains=.25 | desk | ostinato | A muffled weave of plucks, each on a quarter second
Vines along a fence | Neighbour pulses | body=String tilt=.1 frame=900 strike=0 attack=.12 sand=.9 depth=.7 neck=Soften exchange=.7 beat=1.1 release=2 volume=0 pour=.85 split=-.3 | gentle | gears | Bowed pulses that swell one beside the other
Rubber bands, ruler | Neighbour pulses | body=String tilt=-.2 frame=460 strike=.9 sand=.4 depth=.7 settling=120 memory=.6 release=.5 volume=3.5 pour=.35 | slap | neighbours | Twanging pulses that bend down at each pluck and up at each return
Dripping colonnade | Neighbour pulses | body=Glass tilt=-.1 frame=1000 strike=.6 sand=.7 depth=.9 pour=.3 exchange=.3 release=1.5 volume=4 settling=25 | cave 1.mix=0.22 | neighbours | Glass drops, one column at a time
Abandoned greenhouse | Neighbour pulses | body=Glass strike=.5 sand=.45 depth=.6 grains=.6 stagger=.6 beat=.6 ears=1 release=1.4 tilt=-.15 frame=560 volume=-2 split=.4 apart=.7 | rain | gears | Dull glass ticking in its frame with sand between the panes
Lenses passed along | Neighbour pulses | body=Glass strike=.2 attack=.04 sand=1 depth=.7 neck=Hover exchange=.8 release=2.5 volume=-5 tilt=-.91 frame=370 pour=.9 | tight | gears | Round glass pulses that wait a moment before they go on
Hill to hill by mirror | Neighbour pulses | body=Glass tilt=.2 frame=1600 strike=.7 sand=.3 depth=.7 neck=Pass stagger=.2 beat=.2 ears=.8 volume=4 split=-.4 settling=20 | farstar | ostinato | Glass flashing one colour and then the other from hill to hill
Heartbeat in gift paper | Neighbour pulses | body=Glass tilt=-.8 frame=300 strike=.3 sand=.55 depth=.5 neck=Soften grains=.4 beat=.9 release=1.2 pour=.8 apart=.5 | nextdoor | neighbours | Dull glass that beats softly with a crackle over it
Ringers in the same loft | Neighbour pulses | body=Bell tilt=0 frame=900 strike=.6 sand=.8 depth=.7 release=2 volume=0.5 settling=15 split=.3 | hall 1.mix=0.22 | neighbours | Bells that pull only on the ropes beside them
Goats at the fence | Neighbour pulses | body=Bell tilt=-.3 frame=600 strike=.8 sand=.4 depth=.6 settling=70 stagger=.7 beat=1.6 release=1.2 | warm | gears | Cracked little bells nodding out of step
Till bells at closing | Neighbour pulses | body=Bell tilt=.6 memory=.6 ears=.9 volume=0.5 depth=.7 sand=.35 strike=.4 frame=2000 release=1.6 split=.5 settling=30 | limitecho | ostinato | Bright bells on a short sand, each return a bit fainter
Lighthouse keepers' code | Neighbour pulses | body=Bell tilt=-.5 frame=400 strike=.2 attack=.03 sand=1.2 depth=.8 neck=Soften exchange=.4 beat=.7 release=3 volume=-2.5 pour=.9 apart=.6 | trail | lowpeal | Soft low bells flashing on and off along the coast
Necklace undone | Neighbour pulses | body=Bell tilt=.2 frame=1700 strike=.5 sand=.5 depth=.8 apart=.6 split=.8 exchange=.6 beat=.4 release=1.8 volume=-2.5 | unfold | neighbours | Bells whose odd and even partials drop off in turn
Frogs along the ditch | Neighbour pulses | body=Reed tilt=.3 frame=420 strike=.5 attack=.015 sand=.35 depth=.9 settling=90 beat=.8 release=.5 volume=1.5 split=.3 | pan | neighbours | Short nasal reeds answering only their neighbours
Stenographers | Neighbour pulses | body=Bar tilt=-.1 frame=800 strike=.7 attack=.01 sand=.25 depth=.7 pour=.75 memory=.8 beat=.2 release=.4 volume=0.5 | gated | gears | Clipped wooden taps, side by side
Accordions across a lock | Neighbour pulses | body=Reed tilt=.2 frame=420 strike=.1 attack=.08 sand=.8 depth=.7 neck=Soften beat=2.8 ears=.9 release=1 volume=-2 pour=.8 split=-.6 settling=20 | surf | gears | Beating reeds that heave gently in and out of line
Duck calls, politely | Neighbour pulses | body=Reed tilt=.5 frame=1500 strike=.3 attack=.02 sand=.5 depth=.8 neck=Pass beat=.4 settling=30 release=.6 volume=2 split=.5 | repeats | neighbours | Pinched reeds that say it once hollow and once full
Morse under a blanket | Neighbour pulses | body=Reed tilt=-.8 frame=220 strike=.4 attack=.02 sand=.4 depth=1 inertia=.1 beat=0 release=.2 volume=1 pour=.85 | shade | ostinato | Dark short reed signals, quite gone between
Congregation of palms | Neighbour pulses | body=Skin tilt=.1 frame=700 strike=.7 sand=.45 depth=.8 settling=30 grains=.1 release=.6 volume=0 split=.3 | room | neighbours | Hand drums passing a beat from one to the next | drum
Corn on a drum | Neighbour pulses | body=Skin tilt=.35 frame=900 strike=1 sand=.2 depth=.6 grains=.55 stagger=.8 memory=.5 ears=1 release=.9 volume=0 split=-.4 settling=110 | paper | gears | Light skins and dry grain shaken together
Giants clap softly | Neighbour pulses | body=Skin tilt=-.6 frame=150 strike=.6 sand=.9 depth=.7 settling=60 inertia=.4 beat=.6 release=1.2 volume=6 pour=.2 | cavern 1.mix=0.2 | lowpeal | Deep padded beats leaning into each other | drum
Tabla seller's window | Neighbour pulses | body=Skin tilt=-.1 frame=420 strike=.9 sand=.6 depth=.9 settling=150 exchange=.5 release=.8 volume=-0.5 | slap 1.mix=0.18 | ostinato | Tuned skins that swoop at every stroke and unswoop at every turn | drum
Sleepwalker's tread | Neighbour pulses | body=Skin tilt=-.3 frame=240 strike=.2 attack=.06 sand=.7 depth=.6 neck=Hover settling=10 beat=1.2 release=1.5 volume=-0.5 pour=.8 | bank | ostinato | Muffled steps that pause before each is taken back | drum
Canal locks filling | Neighbour pulses | body=Glass tilt=-.3 frame=700 strike=0 attack=.8 sand=2 depth=.8 neck=Soften exchange=.6 beat=.7 release=5 split=.35 | hall | ninth | Slow glass pulses rising in four basins at four times | pad
Cradles in a row | Neighbour pulses | body=String tilt=-.4 frame=380 strike=0 attack=.6 sand=1.5 depth=.7 neck=Hover inertia=.5 beat=.5 release=4 pour=.8 split=.4 volume=-2 | pedal | gears | Bowed strings rocking side by side, never quite together | pad
Breathing house | Neighbour pulses | body=Reed tilt=-.5 frame=300 strike=0 attack=.9 sand=2.6 depth=.9 neck=Soften inertia=.8 beat=.3 release=4 split=-.4 pour=.85 settling=15 | breathing 1.mix=0.28 | hymn | Dark reeds that rise and fall in different rooms | pad
Snow, roof by roof | Neighbour pulses | body=Bell tilt=.1 frame=1500 strike=0 attack=.5 sand=1.8 depth=.6 stagger=.4 exchange=.8 grains=.5 beat=1.2 release=6 split=.5 | mist | highveil | Soft bells thickening and thinning, each roof to itself | pad
Beacons, five minutes on | Neighbour pulses | tilt=.3 frame=1100 strike=.05 attack=.4 sand=3.5 depth=1 pour=.9 exchange=.5 beat=.4 ears=.8 release=5 volume=-1.5 split=-.3 | combo | spires | Bars that stay lit a good while and then go out one by one | pad
Pumps down in a mine | Neighbour pulses | body=Reed tilt=-.6 frame=180 strike=.5 attack=.02 sand=.5 depth=.8 apart=.5 inertia=.3 beat=.1 release=.5 volume=5 pour=.9 split=.3 | firm | treads | Low reed pulses, a heave and a sigh | bass
Pile driver, half asleep | Neighbour pulses | body=Skin tilt=-.5 frame=130 strike=1 sand=.8 depth=.8 apart=.3 settling=90 inertia=.6 release=.8 volume=3 pour=.2 | thump | floor | A padded blow that slides to its note and lifts again | bass
Undertow of strings | Neighbour pulses | body=String tilt=-.7 frame=200 strike=.4 sand=.4 depth=.6 apart=.6 neck=Soften beat=.4 release=.9 volume=3 settling=18 | undertow 1.mix=0.2 | treads | Low plucks that pulse on quietly by the turn | bass
Shared marimba, low end | Neighbour pulses | tilt=-.3 frame=220 strike=.6 sand=.65 depth=.75 apart=.7 exchange=.3 beat=.3 ears=.7 release=1 volume=-2 settling=22 split=.3 grains=.2 | desk | lowpluck | Low bars struck apart and landing apart | bass
Boiler with a murmur | Neighbour pulses | body=Glass tilt=-.9 frame=140 strike=.1 attack=.05 sand=.3 depth=.5 apart=.4 grains=.3 beat=.6 release=.9 pour=.85 exchange=.05 | iron | anchor | A dark glass throb, going a little faster than breath | bass
Escapement, half undone | Neighbour pulses | body=Bar split=1 tilt=.6 frame=800 strike=.7 sand=.4 depth=.8 beat=.1 volume=0.5 | harmonic | gears | Ticking bars, one half of their partials ticking against the other
Looms in separate rooms | Neighbour pulses | body=String split=-.7 tilt=-.13 frame=1350 stagger=1 strike=.4 sand=.45 depth=.7 exchange=.4 release=1.2 volume=1 | jet | gears | Strings in two layers, the high keys twice as quick as the low
Swallows on five wires | Neighbour pulses | body=Reed stagger=.9 split=.6 tilt=.3 frame=1300 strike=.2 attack=.03 sand=.3 depth=.6 beat=1.8 ears=1 release=1 volume=2.5 | wander | highveil | High reeds fluttering on wires of different lengths
Pebbles in a wheel | Neighbour pulses | body=Glass stagger=.7 strike=.8 sand=.22 depth=.8 grains=.6 memory=.9 settling=30 release=1 tilt=-.85 frame=380 volume=-1 | tiles | gears | Glass and grain tumbling round at several speeds
Slow gear, quick gear | Neighbour pulses | body=Bell stagger=1 inertia=.6 tilt=-.2 frame=520 strike=.5 sand=.9 depth=.7 exchange=.3 beat=.5 release=2.4 volume=3.5 settling=35 split=.25 | winding | neighbours | Bells geared so that the low ones lag far behind
Corridor of metronomes | Neighbour pulses | turn=Empty_glass tilt=.1 frame=900 strike=.9 sand=.3 depth=.9 memory=1 inertia=0 beat=0 release=1.5 volume=2 split=.4 pour=.15 exchange=0 | patter 1.mix=0.22 | gears | Wooden ticks that go on by themselves and take no notice
Hands let go in turn | Neighbour pulses | turn=Let_go body=String tilt=.2 frame=1100 strike=.6 sand=.4 depth=.8 release=1.3 settling=20 split=-.3 volume=0 | limitroom | neighbours | Plucks that come back as each finger leaves its key
Fireflies, agreeing | Neighbour pulses | turn=Empty_glass body=Glass strike=.2 attack=.03 sand=.4 depth=.9 stagger=.3 memory=.9 exchange=.4 ears=1 release=2.5 volume=6 tilt=-.1 frame=1120 split=.6 | glimmer | gears | Small glass points that go on and off by themselves
Window cleaners' duet | Neighbour pulses | turn=Let_go body=Glass tilt=-.2 frame=640 sand=.7 neck=Pass settling=60 release=1.6 depth=.35 strike=.45 attack=.015 | shallows 1.depth=0.5 | neighbours | Glass strokes wiped one way and, as they are let go, the other
Pulse of the orchard | Neighbour pulses | turn=Empty_glass body=Reed tilt=-.3 frame=800 strike=.1 attack=.2 sand=.6 depth=.6 neck=Hover exchange=.5 beat=1 memory=.9 release=2 volume=-2 pour=.8 split=.3 settling=15 | cloud | hymn | Soft reeds swelling by themselves at a resting pulse
`,
    },
    {
      id: 'long-glasses',
      name: 'Long glasses',
      category: 'pad',
      rows: `
Window all afternoon | Long glass | sand=30 depth=.8 pour=.5 exchange=.7 beat=.6 attack=.1 tilt=-.4 frame=850 volume=-1.5 apart=.3 | expanse | ninth | Glass on the longest sand there is, its light moving from pane to pane
Fountain in a hard frost | Long glass | strike=.5 sand=6 depth=.6 settling=10 grains=.6 beat=1.2 volume=-4.5 tilt=.04 frame=1270 split=-.3 | glasstail | oblique | Bright glass struck once and spilling sand for six seconds
Lake beyond a tunnel | Long glass | tilt=-.6 frame=420 strike=.1 attack=.4 sand=9 depth=.7 pour=.8 exchange=.5 beat=.4 apart=.2 | darkhall 1.mix=0.28 | suspended | Glass, nearly all hum, that keeps its level for long and then withdraws
Prism and a slow sun | Long glass | tilt=0 frame=1000 strike=.4 sand=7 depth=.5 exchange=1 settling=0 grains=0 beat=.1 ears=.6 volume=-0.5 split=.3 | notch | oblique | Still clear glass that hands each overtone its turn
Cold tea, long talk | Long glass | tilt=-.59 frame=430 strike=.3 sand=5 depth=1 pour=.05 exchange=.4 memory=.6 release=6 volume=1 | record | turned | Glass that drops at once and stays faint until another key recalls it
Noon bell of the island | Long glass | body=Bell tilt=.1 frame=900 strike=.6 sand=8 depth=.7 pour=.4 exchange=.4 volume=2.5 split=.3 | valley | lowpeal | A bell let ring for eight seconds before it thinks of turning | bell
Shortest day of the year | Long glass | body=Bell tilt=-.6 frame=320 strike=.3 attack=.03 sand=20 depth=.6 exchange=.8 beat=.5 settling=80 apart=.4 | silent | ninth | Low bells bent at the stroke and twenty seconds in settling
Every bell in the parish | Long glass | body=Bell tilt=.4 frame=1600 strike=.5 sand=6 depth=.8 apart=.6 stagger=.5 beat=1.6 volume=-0.5 | cathedral | spires | Bells at many places along the same long sand | bell
Bronze under snowfall | Long glass | body=Bell tilt=-.2 frame=560 strike=.15 attack=.2 sand=12 depth=.5 neck=Soften grains=.7 exchange=.6 pour=.7 split=.25 | frost 1.mix=0.7 | oblique | Soft bells with a steady fall of fine grains over them
Rings of a far planet | Long glass | body=Bell tilt=.6 frame=2800 strike=.2 attack=.5 sand=16 depth=.7 exchange=1 beat=2.4 ears=1 volume=0.5 apart=.5 | airy | highveil | High thin bells whose every partial drifts
Lid propped with a book | Long glass | body=String tilt=.1 frame=700 strike=.6 sand=7 depth=.8 pour=.3 settling=10 grains=0 exchange=.3 release=8 volume=6 split=-.3 | pedal | twohands | Long plucked strings that new keys send back towards the pluck | string
Telephone wires, evening | Long glass | body=String tilt=.6 frame=2000 strike=.1 attack=.6 sand=12 depth=.6 exchange=.9 beat=.9 grains=.2 volume=4.5 apart=.6 split=.4 | wander | highveil | Thin wires humming, their overtones rising and sinking one by one | string
Rope bridge at dawn | Long glass | body=String tilt=-.5 frame=280 strike=.2 attack=.3 sand=9 depth=.7 neck=Soften exchange=.5 beat=.4 settling=0 pour=.8 | hall | suspended | Low bowed strings swaying over nine seconds of sand | string
Old letters, retied | Long glass | body=String tilt=-.1 frame=480 strike=.4 attack=.02 sand=5 depth=.6 memory=.2 exchange=.6 beat=.6 grains=.1 volume=0 apart=.2 | reel | walking | Strings that come back from every turn a little more faded | keys
Suspension cables | Long glass | body=String tilt=.3 frame=1200 strike=.7 sand=18 depth=.5 split=.5 exchange=.4 settling=60 beat=.3 volume=5.5 apart=.4 | horizon | spires | Struck cables, half of each rising out of itself very slowly | string
Last tram, rails singing | Long glass | body=Bar tilt=.4 frame=1500 strike=.4 sand=8 depth=.6 exchange=.6 beat=1.4 settling=0 volume=1.5 split=.4 apart=.25 | jet | oblique | Bars ringing on after the blow with a slow flicker
Floor of the old dance | Long glass | body=Bar tilt=-.4 frame=220 strike=.5 sand=6 depth=.7 pour=.7 exchange=.3 beat=.5 grains=.2 apart=.2 | wood 1.mix=0.35 | twohands | Round low bars that fade by slow inches | keys
Sundial, gnomon of oak | Long glass | body=Bar tilt=.1 frame=800 strike=.2 attack=.1 sand=25 depth=.8 exchange=.9 beat=.2 settling=20 grains=0 volume=4 split=-.4 apart=.5 | slowchorus | ninth | Bars lit by one overtone and then the next for nearly half a minute
Bars across the moon | Long glass | body=Bar tilt=.8 frame=2400 strike=.1 attack=.3 sand=10 depth=.5 neck=Pass exchange=.5 beat=.8 volume=3 apart=.35 split=.6 | evaporate | highveil | High bars, all edge, leaning from one side of time to the other
Timber raft adrift | Long glass | body=Bar tilt=-.8 frame=140 strike=.1 attack=.4 sand=14 depth=.12 neck=Hover exchange=.2 beat=.6 grains=.3 volume=2 | surf | suspended | Deep round bars that hardly leave their beginning
Organ loft, locked | Long glass | body=Reed tilt=-.3 frame=420 strike=0 attack=.6 sand=10 depth=.6 pour=.9 exchange=.5 grains=0 settling=0 beat=.3 split=.2 | nave | hymn | Reeds that stay full a long while and then thin from the top | organ
Shepherd on the far hill | Long glass | body=Reed tilt=.2 frame=1300 strike=.1 attack=.12 sand=6 depth=.8 neck=Soften exchange=.6 grains=.1 settling=20 volume=2 apart=.2 | steps | chantline | One reed, fading over six seconds and called back by the next note | wind
Bellows with a slow leak | Long glass | body=Reed tilt=-.6 frame=200 strike=.2 attack=.1 sand=5 depth=.9 pour=.9 exchange=.3 grains=.5 memory=.5 beat=.5 volume=1 | cassette | anchor | A low reed that loses its wind at last and is pumped again, weaker | bass
Sunrise behind curtains | Long glass | body=Reed tilt=.5 frame=900 strike=0 attack=4.2 sand=8 depth=.7 split=-.9 exchange=.4 grains=0 beat=.7 volume=-0.5 apart=.3 | glow | ninth | Reeds slow to speak, whose bright half goes on rising for eight seconds
Squeezeboxes in a barn | Long glass | body=Reed tilt=0 frame=600 strike=0 attack=.4 sand=7 depth=.5 exchange=.7 grains=0 beat=2.6 ears=1 settling=0 volume=2.5 split=.5 apart=.2 | swirl | oblique | Beating reeds, one at each ear, changing vowels by degrees
Gong, the room listening | Long glass | body=Skin tilt=.2 frame=520 strike=.5 sand=6 depth=.5 split=.4 settling=30 exchange=.9 beat=1.4 grains=.1 volume=5 | cavern 1.mix=0.25 | lowpeal | A wide low skin as slow as a gong, its partials rising out of it | drum
Drum in a downpour | Long glass | body=Skin tilt=-.3 frame=260 strike=.4 sand=9 depth=.6 settling=60 exchange=.4 grains=.9 beat=.5 volume=-0.5 apart=.45 split=.35 | rain | ninth | A slow skin under a long fall of sand
Skin and bone moon | Long glass | body=Skin tilt=.5 frame=1500 strike=.1 attack=.4 sand=12 depth=.4 neck=Hover exchange=1 settling=0 beat=.8 volume=-1.5 split=-.3 apart=.3 | choirgrain | highveil | Skins leaning on their overtones, barely fading
Funeral drum, far street | Long glass | body=Skin strike=.6 sand=5 depth=.7 pour=.4 settling=90 exchange=.2 grains=0 beat=.3 volume=1.5 tilt=-.4 frame=220 split=.3 | nextdoor | lowpeal | A muffled stroke that slides to its note and lasts five seconds | drum
Tent full of breathing | Long glass | body=Skin tilt=0 frame=700 strike=0 attack=1 sand=6 depth=.6 neck=Soften settling=10 exchange=.6 grains=.6 beat=1.8 volume=-1 pour=.8 | breath | oblique | Soft skins swelling and sinking with an airy pouring
Dawn on one side only | Long glass | split=-1 strike=.2 attack=.3 sand=10 depth=.9 exchange=.2 beat=.4 ears=1 volume=6 tilt=-.4 frame=760 apart=.4 | climbing | ninth | Glass whose low light goes as its high light comes
Braided river | Long glass | body=String split=1 tilt=-.2 frame=520 strike=.1 attack=.8 sand=8 depth=.8 exchange=.5 beat=.7 grains=.3 volume=6 apart=.3 | currents | suspended | Strings flowing both ways along the same eight seconds | string
Widening ring of bells | Long glass | body=Bell split=.7 tilt=.3 frame=1800 strike=.4 sand=14 depth=.6 exchange=.3 beat=1 ears=1 volume=4.5 apart=.5 | stars 1.mix=0.25 | tower | Bells that go on opening long after the stroke | bell
Wedge of geese | Long glass | body=Reed split=1 tilt=.7 frame=1700 strike=0 attack=.5 sand=5 depth=.7 apart=.5 exchange=.1 beat=4 grains=0 volume=-0.5 | flock 1.mix=0.3 | oblique | Thin reeds in two lines, drawing apart and closing
Tunnel with daylight | Long glass | body=Bar split=-.8 tilt=.3 frame=360 strike=.2 attack=.2 sand=6 depth=.9 exchange=.3 beat=.4 settling=0 volume=-4.5 pour=.75 | swellroom | spires | Low bars with a brightness growing at the far end
Museum of quiet clocks | Long glass | neck=Hover frame=580 strike=.65 sand=5 depth=.6 exchange=.5 beat=.3 grains=.2 volume=2.5 tilt=-.75 apart=.2 split=.3 | airroom | twohands | Struck glass that dwells by its beginning | keys
Mirror lake, no wind | Long glass | neck=Pass tilt=-.13 frame=800 strike=.2 attack=.1 sand=7 depth=.7 exchange=.6 beat=.2 ears=.5 volume=2 split=-.25 | fifthround | oblique | Glass that new keys send through its own reflection
Feather falls twice | Long glass | body=Bell neck=Soften tilt=-.05 frame=1500 strike=.1 attack=.05 sand=5 depth=.8 pour=.7 exchange=.7 grains=.3 volume=1 apart=.3 | leaves 1.mix=0.25 | highpeal | Light bells floating down and, at a touch, up again | bell
Candle that burns upward | Long glass | body=String neck=Pass tilt=-.3 frame=600 strike=.1 attack=.5 sand=6 depth=.9 exchange=.8 beat=1.2 volume=-5.5 apart=.25 pour=.8 | driftshift | hymn | Strings burning down through their beginning into a hollow flame | string
Snow returning to cloud | Long glass | turn=Let_go strike=.2 attack=.03 sand=3 depth=.9 exchange=.5 grains=.7 release=6 volume=-2 tilt=-.95 frame=620 split=.4 | backwards 1.mix=0.22 | tower | Glass drawn gently back up when it is let go, loose grains along it | bell
Desert clock | Long glass | body=Skin tilt=.3 frame=1100 strike=.2 sand=15 depth=.5 grains=1 settling=10 exchange=.5 beat=.6 volume=2 | valley | - | Sand pouring for a quarter of a minute over a thin warm skin | texture
Granary at midnight | Long glass | body=Bar tilt=-.2 frame=460 strike=.3 sand=11 depth=.6 grains=.9 exchange=.4 beat=.5 apart=.5 split=.3 volume=0 | dissolve | suspended | Low bars behind eleven seconds of falling grain | texture
Grains counted by a monk | Long glass | body=Bell tilt=-.25 frame=700 strike=.6 sand=5 depth=.7 grains=.8 settling=20 exchange=.6 beat=.9 split=-.5 apart=.35 | bowls | tower | Bells and the sand they are measured by | bell
Wind on a salt pan | Long glass | body=String tilt=.3 frame=1500 strike=0 attack=.8 sand=8 depth=.4 grains=.9 exchange=.8 beat=1.1 settling=0 volume=-1.5 apart=.4 | stretch | highveil | Thin strings in a wind of grains that never stops | texture
Archive, unopened | Long glass | body=String tilt=-.5 frame=340 strike=.2 attack=.3 sand=20 depth=.7 grains=.6 exchange=.6 beat=.2 settling=30 volume=4 split=.5 | frozen | ground | Dark strings under twenty seconds of dust | drone
Pyramid, inner stair | Long glass | tilt=-.9 frame=150 strike=.2 attack=.2 sand=16 depth=.6 neck=Hover exchange=.4 beat=.5 grains=.2 volume=4.5 pour=.8 | cistern | ground | Glass so low and dark that only its hum stands there | drone
Deep time, bedded rock | Long glass | body=Bell tilt=-.7 frame=190 strike=.4 sand=24 depth=.7 exchange=.7 settling=120 beat=.7 grains=.1 volume=-1 split=.3 | deeper | ground | Low bells bent far out of line, levelling for nearly half a minute | drone
Old growth | Long glass | body=String tilt=-.6 frame=170 strike=.5 attack=.03 sand=10 depth=.5 exchange=.5 settling=0 beat=.3 grains=0 split=.25 pour=.7 | iron | anchor | A long low string that gives up its brightness ring by ring | bass
Wreck on a slow current | Long glass | body=Reed tilt=-.7 frame=240 strike=0 attack=1.4 sand=13 depth=.8 split=.6 exchange=.6 beat=.4 grains=.2 settling=0 volume=2 pour=.9 apart=.2 | melt | ground | Low reeds turning over as slowly as a hull | drone
Age of the house | Long glass | body=Bar tilt=-.5 frame=130 strike=.6 sand=7 depth=.6 neck=Strike turn=Let_go inertia=.5 exchange=.2 grains=.3 release=5 volume=-1.5 | cave 1.mix=0.22 | anchor | A deep bar that returns to its own knock when the hand has gone | bass
`,
    },
  ],
}
