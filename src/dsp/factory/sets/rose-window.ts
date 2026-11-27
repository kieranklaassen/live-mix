import { type InstrumentSet } from './set'

// The set of Rose Window. A direction is a window looked at from one place: the
// nave, the reed, the flute, the pane that is plucked, the wheel of bells. Each
// is ten families of five, a family being one build of the rose (its petals, its
// tracery, the way it opens) and its five members five keys, rooms and gestures
// of it. A third is heard close and dry, since the rings already turn.

export const SET: InstrumentSet = {
  device: 'rose-window',
  names: {
    tracery: ['Smooth', 'Pointed', 'Broken', 'Golden bells'],
    order: ['Heart first', 'Rim first', 'Passing'],
  },
  chains: {
    bare: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Open' }],
      words: ', close and dry',
    },
    warm: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Warm', params: { low: 2 } }],
      words: ', close and warm',
    },
    shade: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Shaded' }],
      words: ', dry, with the top shaded',
    },
    keen: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Bright' }],
      words: ', dry and bright',
    },
    thin: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Thin' },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: ', dry and thinned out',
    },
    deep: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Deep', params: { low: 4 } }],
      words: ', dry, with a deeper floor',
    },
    hollow: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Hollow' }],
      words: ', dry and scooped in the middle',
    },
    cloth: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 1600 } }],
      words: ', dry, behind a heavy cloth',
    },
    front: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Forward', params: { low: -2 } }],
      words: ', dry and well forward',
    },
    level: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 5 } },
        { deviceId: 'ambient-eq', preset: 'Keys' },
      ],
      words: ', close and held level',
    },
    touch: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 5 } },
        { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.16 } },
      ],
      words: ', close, in a touch of tiled room',
    },
    wide: {
      effects: [{ deviceId: 'spread', preset: 'Wide but safe' }],
      words: ', dry and opened wide',
    },
    airy: {
      effects: [{ deviceId: 'spread', preset: 'Wide top' }],
      words: ', dry, with only the top spread wide',
    },
    firm: {
      effects: [
        { deviceId: 'spread', preset: 'Firm bass' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', dry, firm in the middle',
    },
    narrow: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'stereo-widener', preset: 'Narrow' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', narrow and dry',
    },
    mono: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Mono' },
        { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 1 } },
      ],
      words: ', in the very centre',
    },
    console: {
      effects: [{ deviceId: 'analog-drive', preset: 'Console' }],
      words: 'through a warm console',
    },
    iron: {
      effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }],
      words: 'through iron that thickens the lows',
    },
    triode: {
      effects: [{ deviceId: 'analog-drive', preset: 'Triode glow', params: { drive: 0.35 } }],
      words: 'through the glow of a triode',
    },
    sheen: {
      effects: [{ deviceId: 'analog-drive', preset: 'Sheen' }],
      words: 'with a thin sheen of drive',
    },
    grit: {
      effects: [{ deviceId: 'saturator', preset: 'Soft tape warmth', params: { driveDb: 8 } }],
      words: ', softly saturated',
    },
    shine: {
      effects: [{ deviceId: 'saturator', preset: 'Parallel shine', params: { mix: 0.22 } }],
      words: 'with a little folded shine on it',
    },
    reel: {
      effects: [{ deviceId: 'tape', preset: 'Quarter inch' }],
      words: 'on quarter inch tape',
    },
    cassette: {
      effects: [{ deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.25 } }],
      words: 'on an old cassette',
    },
    blanket: {
      effects: [{ deviceId: 'tape', preset: 'Under a blanket' }],
      words: 'on tape, under a blanket',
    },
    glue: {
      effects: [
        { deviceId: 'ambient-comp', preset: 'Glue' },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: ', dry and gently held together',
    },
    double: {
      effects: [{ deviceId: 'stereo-detune', preset: 'Faint width' }],
      words: ', doubled by a hair',
    },
    thick: {
      effects: [{ deviceId: 'stereo-detune', preset: 'Piano haze' }],
      words: ', thickened by a detuned copy',
    },
    wood: {
      effects: [{ deviceId: 'vessel', preset: 'Hint of wood' }],
      words: 'in a box of thin wood',
    },
    pipe: {
      effects: [{ deviceId: 'vessel', preset: 'Inside a pipe', params: { mix: 0.4 } }],
      words: 'inside an open pipe',
    },
    shell: {
      effects: [{ deviceId: 'vessel', preset: 'Shell to the ear', params: { mix: 0.4 } }],
      words: 'held inside a shell',
    },
    clay: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.5 } },
      ],
      words: 'inside a clay pot',
    },
    tin: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.4 } },
      ],
      words: 'in a small tin',
    },
    tube: {
      effects: [{ deviceId: 'vessel', preset: 'Glass tube', params: { mix: 0.4 } }],
      words: 'in a glass tube',
    },
    tamed: {
      effects: [
        { deviceId: 'tamer', preset: 'Gentle' },
        { deviceId: 'ambient-eq', preset: 'Open' },
      ],
      words: ', dry, with what rings out tamed',
    },
    combo: {
      effects: [
        { deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.12, room: 0.25 } },
      ],
      words: 'through a small amplifier in a room',
    },
    pillow: {
      effects: [{ deviceId: 're-amp', preset: 'Pillow speaker' }],
      words: 'through a speaker under a pillow',
    },
    hallway: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 're-amp', preset: 'Down the hall' },
      ],
      words: 'through a speaker down the hall',
    },
    felt: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'sift', preset: 'Soft hammers' },
        { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 1 } },
      ],
      words: 'with every stroke felted',
    },
    quietup: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'reveal', preset: 'Gentle opening' },
      ],
      words: 'with its quiet overtones raised',
    },
    tails: {
      effects: [{ deviceId: 'lift', preset: 'Long tails' }],
      words: 'with its tails brought up',
    },
    smaller: {
      effects: [{ deviceId: 'size', preset: 'Smaller', params: { mix: 0.75 } }],
      words: 'in a body made smaller',
    },
    giant: {
      effects: [{ deviceId: 'size', preset: 'Larger' }],
      words: 'in a body made larger',
    },
    booth: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Small booth' }],
      words: 'in a small booth',
    },
    closet: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } }],
      words: 'in a close room',
    },
    bright: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.22 } },
      ],
      words: 'in a bright chamber',
    },
    chamber: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber' }],
      words: 'in a tight chamber',
    },
    tiled: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'plate-reverb', preset: 'Tight room' },
      ],
      words: 'in a small tiled room',
    },
    short: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience' }],
      words: 'in a short room',
    },
    parlour: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.22 } }],
      words: 'in a furnished room',
    },
    darkroom: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.22 } },
      ],
      words: 'in a small dark room',
    },
    box: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'expanse', preset: 'Small box', params: { mix: 0.25 } },
      ],
      words: 'in a wooden closet of echoes',
    },
    spring: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Hint of spring' }],
      words: 'with a hint of spring',
    },
    twang: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'spring-reverb', preset: 'Slack and strange', params: { mix: 0.28 } },
      ],
      words: 'through a pair of slack springs',
    },
    hall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
      words: 'in a wide hall',
    },
    darkhall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.33 } }],
      words: 'in a dark hall',
    },
    airhall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } }],
      words: 'in a hall of air',
    },
    nave: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.38 } }],
      words: 'in a vast nave',
    },
    under: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } }],
      words: 'over a warm undertow',
    },
    halo: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Faint halo' }],
      words: 'in a faint halo',
    },
    plate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
      words: 'on a long plate',
    },
    darkplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } }],
      words: 'on a dark plate',
    },
    silver: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.16 } }],
      words: 'on a faint silver plate',
    },
    wash: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Endless wash', params: { mix: 0.28 } }],
      words: 'in a wash that hardly ends',
    },
    cathedral: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.32 } }],
      words: 'in a stone cathedral',
    },
    distant: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Distant', params: { mix: 0.55 } }],
      words: 'from a long way off',
    },
    space: {
      effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } }],
      words: 'in a wide open space',
    },
    crypt: {
      effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.35 } }],
      words: 'over a low crypt',
    },
    thinair: {
      effects: [{ deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.28 } }],
      words: 'in thin high air',
    },
    tunnel: {
      effects: [{ deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.28 } }],
      words: 'in a narrow tunnel',
    },
    valley: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
      words: 'over an open valley',
    },
    cave: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } }],
      words: 'in a dark cave',
    },
    brightair: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.26 } }],
      words: 'in bright air',
    },
    late: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Late arrival', params: { mix: 0.3 } }],
      words: 'with a hall that answers late',
    },
    breathing: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.34 } }],
      words: 'in a hall that breathes',
    },
    summer: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Wide summer', params: { mix: 0.34 } }],
      words: 'in a wide summer haze',
    },
    winter: {
      effects: [
        { deviceId: 'bloom-reverb', preset: 'Winter drift', params: { mix: 0.34, interval: 1 } },
      ],
      words: 'with a wintry tail that drifts',
    },
    fifths: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Rising fifths', params: { mix: 0.3 } }],
      words: 'with fifths rising in the tail',
    },
    ah: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.32 } }],
      words: 'in a hall that sings ah',
    },
    oo: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind' }],
      words: 'with an oo sung behind',
    },
    monks: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.34 } }],
      words: 'with low monks behind',
    },
    chapel: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel' }],
      words: 'in a small singing chapel',
    },
    glimmer: {
      effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.2 } }],
      words: 'with a faint glimmer above',
    },
    loft: {
      effects: [{ deviceId: 'shimmer', preset: 'Organ loft', params: { mix: 0.3 } }],
      words: 'with an organ loft above',
    },
    lowshadow: {
      effects: [{ deviceId: 'shimmer', preset: 'Low shadow', params: { mix: 0.28 } }],
      words: 'with an octave of shadow below',
    },
    reverse: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.32 } }],
      words: 'with a tail that rises backwards',
    },
    swelled: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.36 } }],
      words: 'with a tail that blooms and falls',
    },
    gated: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.28 } }],
      words: 'in a gated room',
    },
    glow: {
      effects: [{ deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.22 } }],
      words: 'in a faint warm fuzz',
    },
    wool: {
      effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.34 } }],
      words: 'under a wool blanket of haze',
    },
    fogged: {
      effects: [{ deviceId: 'fog', preset: 'Morning mist' }],
      words: ', blurred into mist',
    },
    veil: {
      effects: [{ deviceId: 'fog', preset: 'Thin veil', params: { mix: 0.35 } }],
      words: 'behind a thin veil of fog',
    },
    lifted: {
      effects: [{ deviceId: 'spiral', preset: 'Faint lift', params: { mix: 0.22 } }],
      words: 'with a tail that climbs slowly',
    },
    sinking: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'spiral', preset: 'Slow descent', params: { mix: 0.28 } },
      ],
      words: 'with a tail that sinks slowly',
    },
    swarm: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.32 } }],
      words: 'in a dark well of small echoes',
    },
    glassrain: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'swarm-reverb', preset: 'Glass rain', params: { mix: 0.25 } },
      ],
      words: 'with glassy scattered echoes',
    },
    openfifth: {
      effects: [
        {
          deviceId: 'silent-keys',
          preset: 'Open fifth and bass',
          params: { mix: 0.4, output: -2 },
        },
      ],
      words: 'with open strings waking below',
    },
    strings: {
      effects: [{ deviceId: 'silent-keys', preset: 'Glass strings', params: { mix: 0.35 } }],
      words: 'with glass strings waking',
    },
    sympathy: {
      effects: [{ deviceId: 'sympathetic', preset: 'Open triad', params: { mix: 0.3 } }],
      words: 'with an open triad in sympathy',
    },
    ringing: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'sympathetic', preset: 'Long ring', params: { mix: 0.4 } },
      ],
      words: 'with sympathetic strings ringing on',
    },
    bowls: {
      effects: [{ deviceId: 'bowls', preset: 'Bowl table', params: { mix: 0.28 } }],
      words: 'among bowls that answer',
    },
    repeats: {
      effects: [{ deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.26 } }],
      words: 'with warm repeats of tape',
    },
    dotted: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.28 } },
      ],
      words: 'with dotted repeats',
    },
    trail: {
      effects: [{ deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.3 } }],
      words: 'with a long dark trail of echo',
    },
    heads: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.28 } },
      ],
      words: 'with three heads of echo',
    },
    slap: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.24 } },
      ],
      words: 'with one slap of tape',
    },
    bucket: {
      effects: [{ deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.28 } }],
      words: 'with dark soft echoes',
    },
    chorused: {
      effects: [{ deviceId: 'analog-delay', preset: 'Chorused', params: { mix: 0.3 } }],
      words: 'with chorused echoes',
    },
    falltape: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'analog-delay', preset: 'Falling tape', params: { mix: 0.26 } },
      ],
      words: 'with echoes that fall an octave',
    },
    pebble: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.26 } },
      ],
      words: 'with a pebble skipping after it',
    },
    slowing: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'skipping-stone', preset: 'Slowing bounces', params: { mix: 0.3 } },
      ],
      words: 'with echoes that slow down',
    },
    stars: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.34 } },
      ],
      words: 'with echoes scattered like stars',
    },
    points: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'constellation', preset: 'Faint points', params: { mix: 0.24 } },
      ],
      words: 'with faint points of echo',
    },
    fan: {
      effects: [{ deviceId: 'prism', preset: 'Low to high', params: { mix: 0.4 } }],
      words: 'fanned out from low to high',
    },
    unfold: {
      effects: [{ deviceId: 'prism', preset: 'Slow unfolding', params: { mix: 0.4 } }],
      words: 'with its colours slowly unfolding',
    },
    mirror: {
      effects: [{ deviceId: 'reverse-delay', preset: 'Faint reflection', params: { mix: 0.24 } }],
      words: 'with a faint reflection backwards',
    },
    backswell: {
      effects: [{ deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.34 } }],
      words: 'with backward swells behind',
    },
    recall: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'echo-memory', preset: 'Recalling', params: { mix: 0.34 } },
      ],
      words: 'with moments of it drifting back',
    },
    crystals: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'grain-delay', preset: 'Crystals', params: { mix: 0.22 } },
      ],
      words: 'with crystals an octave above',
    },
    embers: {
      effects: [{ deviceId: 'grain-delay', preset: 'Falling embers', params: { mix: 0.28 } }],
      words: 'with embers falling after it',
    },
    round: {
      effects: [{ deviceId: 'canon', preset: 'Round of three', params: { mix: 0.36 } }],
      words: 'answered by itself in a round',
    },
    shadowed: {
      effects: [{ deviceId: 'canon', preset: 'Octave shadow', params: { mix: 0.3 } }],
      words: 'shadowed an octave away',
    },
    loop: {
      effects: [{ deviceId: 'tape-loop', preset: 'Slow fade', params: { mix: 0.34 } }],
      words: 'left on a slow tape loop',
    },
    orbits: {
      effects: [{ deviceId: 'orbits', preset: 'Slow phasing', params: { mix: 0.3 } }],
      words: 'with loops that slip apart',
    },
    bed: {
      effects: [{ deviceId: 'micro-looper', preset: 'Soft bed' }],
      words: 'over a soft bed of itself',
    },
    glacial: {
      effects: [{ deviceId: 'auto-filter', preset: 'Glacial low-pass' }],
      words: 'under a glacial low pass',
    },
    notch: {
      effects: [{ deviceId: 'auto-filter', preset: 'Slow notch' }],
      words: 'with a slow notch passing',
    },
    bloomed: {
      effects: [{ deviceId: 'auto-filter', preset: 'Soft bloom' }],
      words: 'opened softly by a filter',
    },
    swirl: {
      effects: [{ deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.42 } }],
      words: 'in a slow swirl of phase',
    },
    sweep: {
      effects: [{ deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.45 } }],
      words: 'under a glacial sweep',
    },
    comb: {
      effects: [{ deviceId: 'flanger', preset: 'Glacial drift', params: { mix: 0.36 } }],
      words: 'with a comb drifting over it',
    },
    drift: {
      effects: [{ deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.42 } }],
      words: 'in a slow chorus',
    },
    ensemble: {
      effects: [{ deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.42 } }],
      words: ', made an ensemble',
    },
    sea: {
      effects: [{ deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.5 } }],
      words: 'in a deep slow chorus',
    },
    amptrem: {
      effects: [
        { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.42 } },
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.14 } },
      ],
      words: 'with the tremolo of an amplifier',
    },
    shimmered: {
      effects: [{ deviceId: 'tremolo', preset: 'Harmonic shimmer' }],
      words: 'with a tremolo between low and high',
    },
    panned: {
      effects: [{ deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.6 } }],
      words: ', crossing slowly from side to side',
    },
    swaying: {
      effects: [{ deviceId: 'tremolo', preset: 'Sea swell', params: { depth: 0.5 } }],
      words: ', swelling as the sea does',
    },
    chorale: {
      effects: [{ deviceId: 'rotary', preset: 'Chorale', params: { mix: 0.75 } }],
      words: 'through a slow rotary speaker',
    },
    whirl: {
      effects: [{ deviceId: 'rotary', preset: 'Tremolo', params: { mix: 0.65 } }],
      words: 'through a fast rotary speaker',
    },
    drum: {
      effects: [{ deviceId: 'rotary', preset: 'Dark drum' }],
      words: 'through the low drum of a rotary',
    },
    flock: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'murmuration', preset: 'Evening flock', params: { mix: 0.36 } },
      ],
      words: 'with a flock wheeling round it',
    },
    pair: {
      effects: [{ deviceId: 'murmuration', preset: 'Two close by' }],
      words: 'with two others close by',
    },
    waters: {
      effects: [{ deviceId: 'currents', preset: 'Slow water' }],
      words: ', drifting in slow bands',
    },
    gleam: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'glimmer', preset: 'Light on water' },
      ],
      words: 'with light moving on its partials',
    },
    ripple: {
      effects: [{ deviceId: 'glimmer', preset: 'Rising ripple' }],
      words: 'with a ripple climbing through it',
    },
    breathed: {
      effects: [{ deviceId: 'breath', preset: 'Calm breath' }],
      words: ', breathing calmly',
    },
    tide: {
      effects: [{ deviceId: 'breath', preset: 'Tide' }],
      words: ', opening and closing like a tide',
    },
    throb: {
      effects: [{ deviceId: 'pulses', preset: 'Soft throb' }],
      words: 'in a soft double throb',
    },
    sparse: {
      effects: [{ deviceId: 'pulses', preset: 'Long tide' }],
      words: ', let through by a long slow tide',
    },
    singer: {
      effects: [{ deviceId: 'late-vibrato', preset: 'Singer', params: { depth: 16 } }],
      words: 'with a vibrato that comes late',
    },
    circle: {
      effects: [{ deviceId: 'around', preset: 'Slow circle' }],
      words: ', carried slowly round the head',
    },
    wander: {
      effects: [
        { deviceId: 'around', preset: 'Slow wander' },
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.14 } },
      ],
      words: ', wandering round the head',
    },
    across: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'distance', preset: 'Across the room' },
      ],
      words: 'heard across the room',
    },
    backhall: {
      effects: [{ deviceId: 'distance', preset: 'Back of the hall' }],
      words: 'from the back of the hall',
    },
    shore: {
      effects: [{ deviceId: 'distance', preset: 'Far shore' }],
      words: 'from a far shore',
    },
    cloud: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.34 } },
      ],
      words: 'in a soft cloud of grains',
    },
    choirgrain: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Choir of fifths', params: { mix: 0.34 } }],
      words: 'among grains of fifths',
    },
    smear: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Slow smear', params: { mix: 0.45 } }],
      words: 'smeared slowly by grains',
    },
    mist: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.4 } }],
      words: 'in a hanging mist',
    },
    frozen: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Clean sustain', params: { mix: 0.38 } }],
      words: 'with each chord held on as glass',
    },
    water: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.42 } }],
      words: 'over dark water',
    },
    stack: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'cascade', preset: 'Faint halo', params: { mix: 0.22 } },
      ],
      words: 'with a cascade of octaves',
    },
    glints: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'glints', preset: 'First light', params: { mix: 0.2 } },
      ],
      words: 'with first light glinting off it',
    },
    dust: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'glints', preset: 'Faint dust' },
      ],
      words: 'in a faint dust of sparks',
    },
    sighs: {
      effects: [{ deviceId: 'falling', preset: 'Slow sighs', params: { mix: 0.36 } }],
      words: 'with slow sighs falling from it',
    },
    snow: {
      effects: [{ deviceId: 'falling', preset: 'Dark snow', params: { mix: 0.38 } }],
      words: 'in dark snow',
    },
    stretched: {
      effects: [{ deviceId: 'stretch', preset: 'Faint halo', params: { mix: 0.3 } }],
      words: 'with a slow cloud trailing far behind',
    },
    held: {
      effects: [{ deviceId: 'sustainer', preset: 'Thin halo', params: { mix: 0.28 } }],
      words: 'with a thin halo held on',
    },
    section: {
      effects: [{ deviceId: 'pad-follower', preset: 'String pad', params: { mix: 0.34 } }],
      words: 'with a soft string section behind',
    },
    sines: {
      effects: [{ deviceId: 'sine-shadow', preset: 'Long linger', params: { mix: 0.34 } }],
      words: 'shadowed by slow sines',
    },
    octave: {
      effects: [{ deviceId: 'octaves', preset: 'Cathedral' }],
      words: 'with octaves above and below',
    },
    flutes: {
      effects: [{ deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.5 } }],
      words: 'with flute stops drawn',
    },
    pedal: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'stops', preset: 'Pedal under', params: { mix: 0.5 } },
      ],
      words: 'with a pedal stop under it',
    },
    above: {
      effects: [{ deviceId: 'pitch-shifter', preset: 'Faint air', params: { mix: 0.2 } }],
      words: 'with a faint octave above',
    },
    padfifth: {
      effects: [{ deviceId: 'pitch-shifter', preset: 'Pad fifth', params: { mix: 0.26 } }],
      words: 'with a quiet fifth above',
    },
    halved: {
      effects: [{ deviceId: 'half-speed', preset: 'Under the mix' }],
      words: 'with itself at half speed under',
    },
    still: {
      effects: [{ deviceId: 'freq-shifter', preset: 'Still water', params: { mix: 0.3 } }],
      words: 'with a slow beating laid over it',
    },
    ringed: {
      effects: [{ deviceId: 'ring', preset: 'Faint halo' }],
      words: 'with a faint ring of sidebands',
    },
    chime: {
      effects: [{ deviceId: 'warp', preset: 'Soft chime', params: { mix: 0.4 } }],
      words: 'with its partials stretched a little',
    },
    sag: {
      effects: [{ deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.3 } }],
      words: 'with a tail that sags in pitch',
    },
    evaporate: {
      effects: [{ deviceId: 'melt', preset: 'Evaporate', params: { mix: 0.36 } }],
      words: 'with a tail that thins into nothing',
    },
    dissolve: {
      effects: [{ deviceId: 'generations', preset: 'Faint afterimage', params: { mix: 0.28 } }],
      words: 'dissolving into the tones of a room',
    },
    bowed: {
      effects: [{ deviceId: 'swell', preset: 'Bowed' }],
      words: 'with its attacks bowed in',
    },
    vowel: {
      effects: [{ deviceId: 'imprint', preset: 'Open vowel', params: { amount: 0.7 } }],
      words: ', shaped to an open vowel',
    },
    roundO: {
      effects: [{ deviceId: 'imprint', preset: 'Round vowel', params: { amount: 0.7 } }],
      words: ', shaped to a round vowel',
    },
    whistle: {
      effects: [{ deviceId: 'overtone-singer', preset: 'Faint melody' }],
      words: 'with a faint melody of overtones',
    },
    lean: {
      effects: [{ deviceId: 'scale-filter', preset: 'Lean to the key' }],
      words: ', leaning to the key',
    },
    drifted: {
      effects: [{ deviceId: 'spectral-drifter', preset: 'Octave halo', params: { mix: 0.24 } }],
      words: 'with grains that bloom upwards',
    },
    hang: {
      effects: [{ deviceId: 'common-tones', preset: 'Hanging notes', params: { mix: 0.5 } }],
      words: 'with common tones hanging on',
    },
    hiss: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'noise-floor', preset: 'Faint hiss' },
        { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 1 } },
      ],
      words: 'with a floor of tape hiss',
    },
    vinyl: {
      effects: [{ deviceId: 'vinyl', preset: 'New pressing' }],
      words: 'on a new pressing of vinyl',
    },
    worn: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.15 } },
      ],
      words: 'on a worn cassette',
    },
    glaze: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'vintage-digital', preset: 'Glaze' },
      ],
      words: 'with the glaze of an early sampler',
    },
    transistor: {
      effects: [{ deviceId: 'radio', preset: 'Clean transistor' }],
      words: 'through a clean transistor set',
    },
    underW: {
      effects: [{ deviceId: 'underwater', preset: 'Just under' }],
      words: 'just under water',
    },
    clouds: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'weather', preset: 'Passing clouds' },
      ],
      words: 'under passing clouds',
    },
    rain: {
      effects: [{ deviceId: 'weather', preset: 'Light rain' }],
      words: 'in light rain',
    },
    frost: {
      effects: [{ deviceId: 'seasons', preset: 'First frost', params: { mix: 0.6 } }],
      words: 'in a first frost',
    },
    paper: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'buzzing-bridge', preset: 'Paper edge', params: { mix: 0.25 } },
      ],
      words: 'with a buzz of paper at its edge',
    },
    evenHall: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.24 } },
      ],
      words: 'held even in a wide hall',
    },
    evenPlate: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.22 } },
      ],
      words: 'held even on a long plate',
    },
    evenShort: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.18 } },
      ],
      words: 'held even in a short room',
    },
    evenValley: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.24 } },
      ],
      words: 'held even over a valley',
    },
    evenWarm: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 2 } },
      ],
      words: ', held even and warm',
    },
    evenNave: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.24 } },
      ],
      words: 'held even in a vast nave',
    },
    evenChamber: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.18 } },
      ],
      words: 'held even in a tight chamber',
    },
  },
  phrases: {
    nave: {
      notes: [
        { atSec: 0, durSec: 3.55, note: 45, gain: 0.6 },
        { atSec: 0, durSec: 3.55, note: 57, gain: 0.5 },
        { atSec: 0, durSec: 3.7, note: 64, gain: 0.5 },
        { atSec: 0, durSec: 4.8, note: 72, gain: 0.55 },
        { atSec: 3.6, durSec: 3.7, note: 43, gain: 0.6 },
        { atSec: 3.6, durSec: 3.7, note: 62, gain: 0.5 },
        { atSec: 3.6, durSec: 3.7, note: 67, gain: 0.5 },
        { atSec: 4.8, durSec: 2.5, note: 71, gain: 0.5 },
      ],
    },
    lauds: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 50, gain: 0.6 },
        { atSec: 0, durSec: 7.2, note: 57, gain: 0.5 },
        { atSec: 1.2, durSec: 6, note: 62, gain: 0.5 },
        { atSec: 2.4, durSec: 4.8, note: 69, gain: 0.45 },
        { atSec: 3.6, durSec: 3.6, note: 74, gain: 0.45 },
        { atSec: 4.8, durSec: 2.4, note: 76, gain: 0.4 },
      ],
    },
    evening: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 48, gain: 0.6 },
        { atSec: 0, durSec: 7.2, note: 55, gain: 0.5 },
        { atSec: 0.1, durSec: 7.1, note: 64, gain: 0.5 },
        { atSec: 0.2, durSec: 7, note: 71, gain: 0.45 },
        { atSec: 0.3, durSec: 6.9, note: 74, gain: 0.4 },
      ],
    },
    chorale: {
      notes: [
        { atSec: 0, durSec: 1.55, note: 45, gain: 0.65 },
        { atSec: 0, durSec: 1.55, note: 60, gain: 0.5 },
        { atSec: 0, durSec: 1.55, note: 64, gain: 0.5 },
        { atSec: 0, durSec: 1.55, note: 69, gain: 0.6 },
        { atSec: 1.6, durSec: 1.55, note: 41, gain: 0.65 },
        { atSec: 1.6, durSec: 1.55, note: 60, gain: 0.5 },
        { atSec: 1.6, durSec: 1.55, note: 65, gain: 0.5 },
        { atSec: 1.6, durSec: 1.55, note: 69, gain: 0.6 },
        { atSec: 3.2, durSec: 1.45, note: 48, gain: 0.65 },
        { atSec: 3.2, durSec: 1.45, note: 60, gain: 0.5 },
        { atSec: 3.2, durSec: 1.45, note: 64, gain: 0.5 },
        { atSec: 3.2, durSec: 1.45, note: 67, gain: 0.6 },
        { atSec: 4.7, durSec: 0.85, note: 43, gain: 0.65 },
        { atSec: 4.7, durSec: 0.85, note: 60, gain: 0.5 },
        { atSec: 4.7, durSec: 0.85, note: 62, gain: 0.5 },
        { atSec: 4.7, durSec: 0.85, note: 67, gain: 0.6 },
        { atSec: 5.6, durSec: 1.65, note: 43, gain: 0.65 },
        { atSec: 5.6, durSec: 1.65, note: 59, gain: 0.5 },
        { atSec: 5.6, durSec: 1.65, note: 62, gain: 0.5 },
        { atSec: 5.6, durSec: 1.65, note: 67, gain: 0.6 },
      ],
    },
    reedcall: {
      notes: [
        { atSec: 0, durSec: 1.7, note: 62, gain: 0.7 },
        { atSec: 1.7, durSec: 0.7, note: 65, gain: 0.6 },
        { atSec: 2.4, durSec: 0.6, note: 64, gain: 0.6 },
        { atSec: 3, durSec: 1.2, note: 60, gain: 0.65 },
        { atSec: 4.2, durSec: 2.8, note: 57, gain: 0.7 },
      ],
    },
    shepherd: {
      notes: [
        { atSec: 0, durSec: 1.2, note: 69, gain: 0.6 },
        { atSec: 1.2, durSec: 0.5, note: 72, gain: 0.5 },
        { atSec: 1.7, durSec: 1.5, note: 76, gain: 0.7 },
        { atSec: 3.2, durSec: 0.4, note: 74, gain: 0.5 },
        { atSec: 3.6, durSec: 0.6, note: 72, gain: 0.55 },
        { atSec: 4.3, durSec: 0.6, note: 67, gain: 0.5 },
        { atSec: 4.9, durSec: 2.3, note: 69, gain: 0.65 },
      ],
    },
    suspended: {
      notes: [
        { atSec: 0, durSec: 1.4, note: 60, gain: 0.55 },
        { atSec: 0, durSec: 2, note: 69, gain: 0.6 },
        { atSec: 1.4, durSec: 1.2, note: 59, gain: 0.55 },
        { atSec: 2, durSec: 1.2, note: 67, gain: 0.6 },
        { atSec: 2.6, durSec: 1.2, note: 57, gain: 0.55 },
        { atSec: 3.2, durSec: 1.2, note: 65, gain: 0.6 },
        { atSec: 3.8, durSec: 1.7, note: 55, gain: 0.55 },
        { atSec: 4.4, durSec: 1.1, note: 64, gain: 0.6 },
        { atSec: 5.5, durSec: 1.8, note: 53, gain: 0.6 },
        { atSec: 5.5, durSec: 1.8, note: 65, gain: 0.65 },
      ],
    },
    lowreed: {
      notes: [
        { atSec: 0, durSec: 2.4, note: 45, gain: 0.7 },
        { atSec: 2.5, durSec: 1, note: 52, gain: 0.6 },
        { atSec: 3.5, durSec: 0.8, note: 50, gain: 0.6 },
        { atSec: 4.3, durSec: 2.9, note: 40, gain: 0.7 },
      ],
    },
    walk: {
      notes: [
        { atSec: 0, durSec: 1.3, note: 36, gain: 0.8 },
        { atSec: 1.4, durSec: 0.5, note: 43, gain: 0.6 },
        { atSec: 2, durSec: 1.2, note: 45, gain: 0.7 },
        { atSec: 3.3, durSec: 0.9, note: 41, gain: 0.7 },
        { atSec: 4.3, durSec: 2.6, note: 33, gain: 0.8 },
      ],
    },
    deepline: {
      notes: [
        { atSec: 0, durSec: 1.9, note: 40, gain: 0.8 },
        { atSec: 2, durSec: 0.8, note: 41, gain: 0.6 },
        { atSec: 2.9, durSec: 0.8, note: 40, gain: 0.6 },
        { atSec: 3.8, durSec: 1.4, note: 36, gain: 0.7 },
        { atSec: 5.3, durSec: 2, note: 33, gain: 0.8 },
      ],
    },
    ostinato: {
      notes: [
        { atSec: 0, durSec: 0.42, note: 57, gain: 0.7 },
        { atSec: 0.45, durSec: 0.42, note: 64, gain: 0.5 },
        { atSec: 0.9, durSec: 0.42, note: 69, gain: 0.5 },
        { atSec: 1.35, durSec: 0.42, note: 72, gain: 0.6 },
        { atSec: 1.8, durSec: 0.42, note: 64, gain: 0.4 },
        { atSec: 2.25, durSec: 0.42, note: 76, gain: 0.65 },
        { atSec: 2.7, durSec: 0.42, note: 69, gain: 0.45 },
        { atSec: 3.15, durSec: 0.42, note: 64, gain: 0.4 },
        { atSec: 3.6, durSec: 0.42, note: 55, gain: 0.7 },
        { atSec: 4.05, durSec: 0.42, note: 62, gain: 0.5 },
        { atSec: 4.5, durSec: 0.42, note: 67, gain: 0.5 },
        { atSec: 4.95, durSec: 0.42, note: 71, gain: 0.6 },
        { atSec: 5.4, durSec: 0.42, note: 62, gain: 0.4 },
        { atSec: 5.85, durSec: 0.42, note: 74, gain: 0.65 },
        { atSec: 6.3, durSec: 0.42, note: 69, gain: 0.5 },
      ],
    },
    rolled: {
      notes: [
        { atSec: 0, durSec: 2.2, note: 45, gain: 0.65 },
        { atSec: 0.09, durSec: 2.11, note: 57, gain: 0.6 },
        { atSec: 0.18, durSec: 2.02, note: 60, gain: 0.65 },
        { atSec: 0.27, durSec: 1.93, note: 64, gain: 0.6 },
        { atSec: 0.36, durSec: 1.84, note: 69, gain: 0.65 },
        { atSec: 2.4, durSec: 2.2, note: 41, gain: 0.65 },
        { atSec: 2.49, durSec: 2.11, note: 57, gain: 0.6 },
        { atSec: 2.58, durSec: 2.02, note: 60, gain: 0.65 },
        { atSec: 2.67, durSec: 1.93, note: 65, gain: 0.6 },
        { atSec: 2.76, durSec: 1.84, note: 72, gain: 0.65 },
        { atSec: 4.8, durSec: 2.2, note: 43, gain: 0.65 },
        { atSec: 4.89, durSec: 2.11, note: 55, gain: 0.6 },
        { atSec: 4.98, durSec: 2.02, note: 59, gain: 0.65 },
        { atSec: 5.07, durSec: 1.93, note: 62, gain: 0.6 },
        { atSec: 5.16, durSec: 1.84, note: 67, gain: 0.65 },
      ],
    },
    drops: {
      notes: [
        { atSec: 0, durSec: 0.3, note: 81, gain: 0.6 },
        { atSec: 1.1, durSec: 0.3, note: 76, gain: 0.5 },
        { atSec: 1.9, durSec: 0.4, note: 79, gain: 0.6 },
        { atSec: 3.2, durSec: 0.3, note: 72, gain: 0.5 },
        { atSec: 3.5, durSec: 0.3, note: 84, gain: 0.4 },
        { atSec: 4.6, durSec: 0.4, note: 74, gain: 0.6 },
        { atSec: 5.7, durSec: 1.2, note: 69, gain: 0.6 },
      ],
    },
    inCanon: {
      notes: [
        { atSec: 0, durSec: 0.55, note: 69, gain: 0.6 },
        { atSec: 0.6, durSec: 0.55, note: 72, gain: 0.6 },
        { atSec: 1.2, durSec: 0.55, note: 57, gain: 0.55 },
        { atSec: 1.2, durSec: 0.55, note: 76, gain: 0.6 },
        { atSec: 1.8, durSec: 0.55, note: 60, gain: 0.55 },
        { atSec: 1.8, durSec: 0.55, note: 79, gain: 0.6 },
        { atSec: 2.4, durSec: 0.55, note: 64, gain: 0.55 },
        { atSec: 2.4, durSec: 0.55, note: 72, gain: 0.6 },
        { atSec: 3, durSec: 0.55, note: 67, gain: 0.55 },
        { atSec: 3, durSec: 0.55, note: 71, gain: 0.6 },
        { atSec: 3.6, durSec: 0.55, note: 60, gain: 0.55 },
        { atSec: 3.6, durSec: 0.55, note: 69, gain: 0.6 },
        { atSec: 4.2, durSec: 0.55, note: 59, gain: 0.55 },
        { atSec: 4.2, durSec: 0.55, note: 67, gain: 0.6 },
        { atSec: 4.8, durSec: 0.55, note: 57, gain: 0.55 },
        { atSec: 4.8, durSec: 0.55, note: 64, gain: 0.6 },
        { atSec: 5.4, durSec: 0.55, note: 55, gain: 0.55 },
        { atSec: 6, durSec: 1.2, note: 52, gain: 0.55 },
      ],
    },
    peal: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 76, gain: 0.7 },
        { atSec: 0.6, durSec: 0.5, note: 74, gain: 0.55 },
        { atSec: 1.2, durSec: 0.5, note: 72, gain: 0.55 },
        { atSec: 1.8, durSec: 0.5, note: 69, gain: 0.5 },
        { atSec: 2.4, durSec: 0.5, note: 67, gain: 0.55 },
        { atSec: 3, durSec: 0.5, note: 76, gain: 0.7 },
        { atSec: 3.6, durSec: 0.5, note: 72, gain: 0.5 },
        { atSec: 4.2, durSec: 0.5, note: 74, gain: 0.55 },
        { atSec: 4.8, durSec: 0.5, note: 67, gain: 0.5 },
        { atSec: 5.4, durSec: 0.5, note: 69, gain: 0.6 },
      ],
    },
    toll: {
      notes: [
        { atSec: 0, durSec: 2, note: 52, gain: 0.8 },
        { atSec: 2.3, durSec: 2, note: 64, gain: 0.5 },
        { atSec: 3.1, durSec: 1.6, note: 67, gain: 0.45 },
        { atSec: 4.7, durSec: 2.4, note: 45, gain: 0.8 },
      ],
    },
    highBells: {
      notes: [
        { atSec: 0, durSec: 0.6, note: 88, gain: 0.5 },
        { atSec: 0.9, durSec: 0.6, note: 83, gain: 0.5 },
        { atSec: 2, durSec: 0.6, note: 84, gain: 0.55 },
        { atSec: 3.3, durSec: 0.6, note: 79, gain: 0.5 },
        { atSec: 4.1, durSec: 0.6, note: 91, gain: 0.4 },
        { atSec: 5, durSec: 1.2, note: 76, gain: 0.55 },
      ],
    },
    gongs: {
      notes: [
        { atSec: 0, durSec: 4.6, note: 36, gain: 0.8 },
        { atSec: 2.4, durSec: 2.2, note: 55, gain: 0.4 },
        { atSec: 4.7, durSec: 2.6, note: 31, gain: 0.85 },
      ],
    },
    answer: {
      notes: [
        { atSec: 0, durSec: 0.8, note: 72, gain: 0.65 },
        { atSec: 0.8, durSec: 1.2, note: 79, gain: 0.6 },
        { atSec: 2.3, durSec: 0.8, note: 60, gain: 0.6 },
        { atSec: 3.1, durSec: 1.2, note: 55, gain: 0.6 },
        { atSec: 4.5, durSec: 0.6, note: 71, gain: 0.5 },
        { atSec: 5.1, durSec: 2, note: 76, gain: 0.6 },
      ],
    },
    nocturne: {
      notes: [
        { atSec: 0, durSec: 1.7, note: 45, gain: 0.6 },
        { atSec: 0.4, durSec: 1.3, note: 52, gain: 0.4 },
        { atSec: 0.8, durSec: 0.9, note: 60, gain: 0.4 },
        { atSec: 1.2, durSec: 1.2, note: 72, gain: 0.65 },
        { atSec: 1.8, durSec: 1.7, note: 41, gain: 0.6 },
        { atSec: 2.2, durSec: 1.3, note: 53, gain: 0.4 },
        { atSec: 2.4, durSec: 0.8, note: 71, gain: 0.55 },
        { atSec: 2.6, durSec: 0.9, note: 57, gain: 0.4 },
        { atSec: 3.2, durSec: 1.2, note: 69, gain: 0.6 },
        { atSec: 3.6, durSec: 1.6, note: 48, gain: 0.6 },
        { atSec: 4, durSec: 1.2, note: 55, gain: 0.4 },
        { atSec: 4.4, durSec: 0.8, note: 64, gain: 0.5 },
        { atSec: 5.2, durSec: 2, note: 43, gain: 0.6 },
        { atSec: 5.5, durSec: 1.7, note: 55, gain: 0.4 },
        { atSec: 5.8, durSec: 1.4, note: 62, gain: 0.45 },
        { atSec: 6.1, durSec: 1.2, note: 71, gain: 0.55 },
      ],
    },
    ison: {
      notes: [
        { atSec: 0, durSec: 7.3, note: 43, gain: 0.6 },
        { atSec: 0, durSec: 7.3, note: 55, gain: 0.45 },
        { atSec: 0.8, durSec: 1.5, note: 67, gain: 0.5 },
        { atSec: 2.3, durSec: 0.9, note: 69, gain: 0.5 },
        { atSec: 3.2, durSec: 1.2, note: 71, gain: 0.5 },
        { atSec: 4.4, durSec: 0.9, note: 69, gain: 0.45 },
        { atSec: 5.3, durSec: 2, note: 67, gain: 0.5 },
      ],
    },
    psalm: {
      notes: [
        { atSec: 0, durSec: 2.5, note: 50, gain: 0.6 },
        { atSec: 0, durSec: 2.5, note: 57, gain: 0.5 },
        { atSec: 0, durSec: 2.5, note: 65, gain: 0.5 },
        { atSec: 0, durSec: 2.5, note: 69, gain: 0.55 },
        { atSec: 2.5, durSec: 1.3, note: 48, gain: 0.6 },
        { atSec: 2.5, durSec: 1.3, note: 57, gain: 0.5 },
        { atSec: 2.5, durSec: 1.3, note: 64, gain: 0.5 },
        { atSec: 2.5, durSec: 1.3, note: 72, gain: 0.55 },
        { atSec: 3.8, durSec: 1.3, note: 43, gain: 0.6 },
        { atSec: 3.8, durSec: 1.3, note: 62, gain: 0.5 },
        { atSec: 3.8, durSec: 1.3, note: 67, gain: 0.5 },
        { atSec: 3.8, durSec: 1.3, note: 71, gain: 0.55 },
        { atSec: 5.1, durSec: 2.2, note: 45, gain: 0.6 },
        { atSec: 5.1, durSec: 2.2, note: 60, gain: 0.5 },
        { atSec: 5.1, durSec: 2.2, note: 64, gain: 0.5 },
        { atSec: 5.1, durSec: 2.2, note: 69, gain: 0.55 },
      ],
    },
    highChoir: {
      notes: [
        { atSec: 0, durSec: 3.5, note: 71, gain: 0.5 },
        { atSec: 0, durSec: 7.2, note: 64, gain: 0.5 },
        { atSec: 1, durSec: 6.2, note: 67, gain: 0.45 },
        { atSec: 2, durSec: 5.2, note: 79, gain: 0.4 },
        { atSec: 3.5, durSec: 3.7, note: 72, gain: 0.5 },
      ],
    },
    quartal: {
      notes: [
        { atSec: 0, durSec: 7, note: 57, gain: 0.55 },
        { atSec: 0, durSec: 7, note: 62, gain: 0.5 },
        { atSec: 0.8, durSec: 6.2, note: 67, gain: 0.45 },
        { atSec: 1.6, durSec: 5.4, note: 72, gain: 0.45 },
        { atSec: 2.4, durSec: 4.6, note: 76, gain: 0.4 },
      ],
    },
  },
  directions: [
    {
      id: 'cathedral-pads',
      name: 'Cathedral pads',
      category: 'pad',
      rows: `
Before the doors open | Slow cathedral | petals=12 heart=0.45 rings=7 reach=0.9 attack=3.2 bloom=3.5 stone=0 tilt=0.9 turn=0.45 light=1400 breath=0.35 volume=-4.5 width=1 damping=0.6 | nave | nave | Twelve petals rising for three seconds with air in them, their rings rocking over a dim tone
Noon through the south | Slow cathedral | petals=11 heart=0.35 rings=6 reach=0.85 light=6500 attack=1.2 bloom=5 turn=0.3 fold=0 damping=0.1 volume=-7 width=0.8 | hall | evening | Eleven petals in full sun, high rings clear over a lean note
Candle at the far altar | Slow cathedral | petals=10 heart=0.8 rings=2 light=700 attack=2 release=5 turn=0.5 tilt=1 breath=0.25 stone=0.2 volume=-3.5 bloom=6 damping=0.8 reach=0.2 width=0.6 | distant | nave | One dim tone with two dark rings that tip away and back about once a second
Swept marble aisle | Slow cathedral | petals=5 heart=0.5 rings=3 reach=0.8 light=2400 stone=0.9 attack=0.9 bloom=1.5 release=2 fold=0.35 turn=0.1 volume=-3 damping=0.6 width=0.7 | bare | chorale | Five petals set deep in the stone frame, folded a little, quick to open
Choir screen at dusk | Slow cathedral | petals=5 heart=0.6 rings=3 light=1700 bend=0 attack=1 bloom=6 turn=-0.4 tilt=0.9 release=9 volume=0 tracery=Pointed order=Heart_first reach=0.3 damping=0.7 width=0.8 breath=0.25 | fifths | nave | One near ring of five petals, dim, turning slowly against the note
Edge of the great window | Opening keys | petals=6 order=Rim_first strike=0 attack=0.6 bloom=3.2 rings=7 reach=0.6 light=5000 stone=0.1 heart=0.5 volume=-6 damping=0.3 width=0.95 | valley | nave | Six petals that begin at the rim as thin light and find their note after it
West front after rain | Frost on the rim | petals=5 bloom=2.8 light=3800 turn=0.25 attack=0.5 heart=0.4 breath=0.35 rings=8 fold=0.1 release=5 volume=-6.5 width=0.8 damping=0.7 decay=8 | rain | evening | Five petals from the rim inwards, with damp air on them
Scaffold in sunlight | Opening keys | petals=6 order=Rim_first strike=0.05 attack=0.3 bloom=1.6 rings=3 reach=0.5 curl=0.4 fold=0.45 light=1700 heart=0.55 damping=0.6 width=0.75 | sheen | chorale | Six petals folded and curled, the rim first and the heart a moment behind
Lead before the glass | Frost on the rim | petals=3 bloom=3.5 light=2400 stone=0.5 turn=0 tilt=0 attack=0.5 heart=0.4 rings=8 reach=0.5 width=0.6 volume=-4.5 damping=0.25 decay=12 | crypt | lauds | Three petals that do not turn, the edge first and the note after
Gulls over the spire | Frost on the rim | petals=8 bloom=2 order=Rim_first light=4500 turn=0.6 tilt=0.6 attack=0.8 heart=0.5 rings=2 reach=0.7 volume=-6 width=1 damping=0.2 decay=10 | fifths | evening | Eight petals, high and clear from the rim, rings rocking slowly over
String room upstairs | Still drone | petals=3 turn=0.2 tilt=0.3 light=2800 stone=0.3 fold=0.75 curl=0.2 attack=1 bloom=2.5 release=2.5 heart=0.35 volume=-7 width=1 rings=9 damping=0.3 | wide | nave | Three petals folded most of the way, like bowed strings with a slow turn in them
Velvet pew | Still drone | petals=4 fold=0.7 curl=0.1 light=600 stone=0.2 attack=1.5 bloom=3.5 turn=0.15 heart=0.5 release=4 breath=0.05 volume=-4.5 damping=0.9 width=0.5 | cloth | nave | Odd harmonics folded hard and kept very dark, a dense soft weight
Painted ceiling | Still drone | petals=3 fold=0.3 curl=0.6 light=3500 stone=0.15 attack=1.8 bloom=5 turn=-0.3 tilt=0.7 heart=0.4 rings=5 width=1 volume=-18.5 order=Passing damping=0.2 | summer | evening | Three petals curled into open colours, a slow light passing out through them
Organ loft, strings on | Still drone | petals=5 fold=0.5 curl=0.35 light=2000 stone=0.6 attack=0.5 bloom=1.5 release=1.5 rings=9 reach=0.9 turn=0.05 volume=-2 width=0.6 damping=0.15 | loft | chorale | Five petals with every ring speaking, folded, quick as a string stop
Tapestry wall | Still drone | petals=3 fold=1 curl=0 light=1300 stone=0.45 attack=1.1 bloom=4 turn=0.3 tilt=0.1 heart=0.3 damping=0.8 volume=-3.5 width=0.8 | ensemble | nave | Three petals folded as far as they go, woollen and thick
One lit pane | Dust lace | petals=8 tracery=Pointed heart=0.75 rings=3 reach=0.45 light=3000 breath=0.1 attack=1.5 turn=0.2 tilt=0.5 volume=1.5 bloom=3 width=0.8 damping=0.2 | silver | evening | A steady tone with one ring of eight petals bright far above it
Line of clerestory | Dust lace | petals=3 tracery=Pointed heart=0.95 rings=7 reach=0.45 light=2200 breath=0.2 attack=0.5 fold=0.4 turn=0.35 stone=0.3 volume=-4.5 bloom=2.5 width=0.6 damping=0.6 | plate | lauds | One ring of three petals lifted out and folded into a thin line
Blue pane at midnight | Dust lace | petals=5 tracery=Pointed heart=0.75 rings=2 reach=0.2 light=1500 breath=0.05 attack=1.2 bloom=4 turn=-0.2 stone=0.6 volume=-1 order=Heart_first damping=0.7 width=0.7 | glacial | evening | A dark tone and one near ring of five, its glow there with the note
Comb of light | Dust lace | petals=4 tracery=Pointed heart=0.5 rings=5 reach=0.4 curl=0.5 light=1600 breath=0.15 attack=0.8 tilt=0.2 turn=0.1 release=3 volume=-1.5 bloom=2.5 damping=0.15 width=0.9 | comb | evening | One odd ring lifted out and curled, hollow through the middle
Needle of the spire | Dust lace | petals=12 tracery=Pointed heart=0.8 rings=2 reach=0.5 light=4000 breath=0.3 attack=1 turn=0.45 release=6 volume=-1 bloom=6 damping=0.1 width=0.8 | above | evening | A plain note with one needle of a ring very high over it
Clouds on the glass | Broken panes | petals=4 attack=0.6 heart=0.7 rings=5 light=2000 turn=0.1 release=5 stone=0.3 breath=0.2 volume=2 bloom=4 damping=0.6 width=1 decay=3 | hall 1.mix=0.42 | nave | Panes of odd harmonics lit and dark by turns while the note stays
Half the window boarded | Broken panes | petals=3 rings=4 reach=0.3 heart=0.5 light=900 attack=1 release=3 stone=0.7 tilt=0.1 turn=0 volume=-0.5 bloom=3 damping=0.8 width=0.5 decay=8 | parlour | lauds | Dark panes of three close round the heart, going out and coming back
Magpie light | Broken panes | petals=9 rings=3 reach=0.8 heart=0.55 light=4000 attack=0.3 release=2 turn=0.5 tilt=0.8 breath=0 volume=-3.5 damping=0.3 decay=12 | double | evening | Nine petals, black and white panes flicking high above a plain tone
Workmen on the roof | Broken panes | petals=6 heart=0.3 rings=9 light=2000 attack=1.5 release=7 order=Rim_first bloom=3 bend=18 volume=-1.5 reach=0.6 damping=0.7 width=0.8 decay=10 | breathing | nave | Six petals of sharpened panes, the rim first, lit by turns
Pigeons crossing the sun | Broken panes | petals=7 heart=0.65 rings=6 reach=0.5 light=1400 attack=0.7 release=6 turn=-0.5 width=0.5 volume=1 damping=0.7 decay=3 | wash | evening | A sure heart with dim panes of seven flickering round it
Light walks the floor | Passing light | petals=3 bloom=2.2 light=2600 attack=1 rings=8 reach=0.8 stone=0.3 turn=0.15 volume=1.5 width=0.85 damping=0.6 decay=8 | plate 1.mix=0.22 | nave | One ring of light passing out through three petals and starting again
Slow lighthouse nave | Passing light | petals=6 bloom=4 light=4500 attack=1.5 heart=0.6 rings=5 turn=0 tilt=0 release=7 volume=0 damping=0.2 width=0.95 decay=12 | nave 1.mix=0.28 | lauds | A light that goes round once in six seconds through a still rose of six
Procession of lamps | Passing light | petals=4 bloom=1.5 light=1400 attack=0.5 heart=0.5 rings=9 fold=0.5 curl=0.3 stone=0.5 volume=3.5 width=0.75 damping=0.7 decay=10 | repeats | chorale | Light passing quickly through folded odd harmonics, lamp after lamp
Sun between columns | Passing light | petals=5 bloom=1.8 light=5500 attack=0.8 heart=0.35 rings=6 reach=0.6 breath=0.3 tilt=0.6 turn=0.3 volume=-0.5 width=1 damping=0.25 decay=3 | panned | evening | Five petals brightening and dimming as the light goes by, with air
Tide on the stair | Passing light | petals=3 bloom=2.8 light=3200 attack=2 heart=0.35 rings=4 curl=0.2 release=8 breath=0.15 volume=0.5 damping=0.7 width=0.8 reach=0.2 decay=8 | tide | evening | A round tone of three petals that a slow light climbs and leaves
Compline stop | Night organ | petals=5 heart=0.45 rings=4 light=1500 stone=0.5 attack=0.12 release=0.9 turn=0.05 volume=0 reach=0.3 tilt=0.2 width=0.5 damping=0.6 breath=0.35 | chamber | chorale | Five petals and a little wind, quick to speak, plain and dark | organ
Full chest of pipes | Night organ | petals=3 heart=0.4 rings=8 reach=0.8 light=3500 fold=0.25 stone=0.35 attack=0.1 release=0.5 turn=0.1 tilt=0.1 volume=-4.5 width=0.95 damping=0.1 | octave | chorale | Three petals with all rings drawn, broad and bright as a full organ | organ
Stopped wood, eight foot | Night organ | petals=3 heart=0.6 rings=5 reach=0.15 light=1000 breath=0.3 attack=0.1 stone=0.7 turn=0 tilt=0.1 volume=2 width=0.3 bloom=1.5 damping=0.8 | wood | chorale | Three petals near the heart with breath at the mouth, a stopped pipe | organ
Cornet in the side aisle | Night organ | petals=3 heart=0.55 rings=5 reach=0.4 light=1500 fold=0.6 curl=0.1 stone=0.7 attack=0.1 turn=0.2 release=0.4 volume=4.5 tracery=Pointed width=0.4 damping=0.6 | chapel | suspended | Three petals, one ring folded to a nasal stop, every note clean at both ends | organ
Village harmonium | Night organ | petals=3 heart=0.35 rings=6 reach=0.6 light=1700 fold=0.6 curl=0.15 breath=0.4 attack=0.25 stone=0.3 turn=-0.35 tilt=0.6 volume=-5.5 width=0.6 damping=0.6 | swaying 1.depth=0.25 | chorale | Three folded petals with bellows air and rings rocking against each other | organ
Vowel in the vault | Whirling choir | petals=3 turn=0.2 curl=0.8 fold=0.1 light=1200 stone=0.9 breath=0.15 attack=1 release=5 heart=0.5 tilt=0.4 volume=-4.5 bloom=3 damping=0.8 width=0.7 | oo | psalm | Three petals curled far, a dark rounded colour held in stone
Breath of the crypt | Whirling choir | petals=4 turn=-0.15 curl=0.5 fold=0.2 light=600 stone=1 breath=0.6 attack=2 release=4 heart=0.6 rings=3 volume=-5 bloom=5 damping=0.9 width=0.5 reach=0.2 | cave | lauds | Low light, full stone and a good deal of breath on odd harmonics
Amber through smoke | Whirling choir | petals=6 turn=0.35 curl=1 fold=0.4 light=2200 stone=0.3 breath=0.25 attack=1 rings=7 heart=0.3 tilt=0.7 volume=-0.5 bloom=4 order=Passing width=0.8 damping=0.6 | glow | evening | Six petals curled as far as they go, a slow light between two colours
Mouths of the gargoyles | Whirling choir | petals=5 turn=-0.3 curl=0.65 fold=0.6 light=1600 stone=0.7 breath=0.1 attack=0.6 rings=9 reach=0.9 heart=0.25 volume=-6 bloom=2.5 width=0.8 damping=0.2 | tunnel | nave | Five petals folded and curled in stone, rough open vowels that cross
Wine-dark rosette | Whirling choir | petals=3 turn=0.1 curl=0.4 fold=0.8 light=800 stone=0.4 breath=0.05 attack=2.2 heart=0.6 rings=6 width=0.7 release=7 volume=-6 bloom=7 damping=0.85 tilt=0.15 | darkhall 1.mix=0.22 | evening | Three petals folded deep under a low light, red and round
Stroke, then the window | Opening keys | petals=6 order=Heart_first strike=0.5 decay=3 attack=1.5 bloom=3 rings=5 light=3500 release=5 heart=0.5 volume=0.5 width=0.9 damping=0.6 | hall | nave | A clear stroke, and behind its fading a rose of six that swells
Bell rope and blue glass | Chime wheel | petals=5 strike=0.45 decay=20 rings=4 reach=0.4 heart=0.6 attack=1.2 light=2500 stone=0.4 turn=0.15 release=8 bloom=2 volume=-2 width=0.7 damping=0.2 | plate | lauds | A golden rose, half struck and half swelling, slow to die
Copper dome at four | Bronze gong | petals=8 strike=0.4 fold=0.2 curl=0.1 bend=20 heart=0.65 decay=12 attack=1.8 light=1800 rings=5 release=6 bloom=2 volume=-3.5 width=0.8 damping=0.2 | held | evening | Wide golden partials over a warm heart, struck softly and left to swell
Frost, then thaw | Frost on the rim | petals=7 strike=0.35 decay=2 damping=0.8 attack=2 bloom=4 light=2800 turn=0.1 heart=0.4 rings=3 release=6 width=0.75 | winter | nave | A short cold touch of seven petals, then the rim of a slow pad
Sundogs at noon | Broken panes | petals=10 strike=0.3 decay=6 attack=1 heart=0.5 rings=3 light=2200 turn=0.3 tilt=0.3 release=4 order=Passing bloom=2 volume=2.5 reach=0.45 damping=0.5 width=1 | brightair | evening | Ten petals struck and held, lit panes and a light drifting past
Warped lead | Slow cathedral | petals=4 bend=-25 heart=0.5 rings=6 reach=0.7 light=2400 attack=1.2 bloom=3.5 fold=0.15 turn=0.25 stone=0.2 tilt=0.5 volume=-4.5 damping=0.7 width=0.8 | glue | nave | Odd rings drawn flat of true, so every chord moves slowly inside
Old glass, rippled | Slow cathedral | petals=6 bend=8 heart=0.4 rings=8 reach=0.8 light=3800 attack=1.6 bloom=4.5 turn=0.4 tilt=0.8 stone=0 damping=0.2 width=1 | gleam | evening | Six petals a hair sharp in their rings, rippling slowly
Bronze saints | Slow cathedral | petals=3 bend=45 heart=0.55 rings=4 reach=0.5 light=1500 attack=1 bloom=3 stone=0.6 fold=0.3 turn=0.1 release=5 volume=-4 tracery=Golden_bells decay=30 width=0.8 damping=0.2 | lifted | nave | Three golden petals with their rings stretched sharp, a metal pad in stone
Leaning tower, east side | Slow cathedral | petals=7 bend=-60 heart=0.7 rings=3 reach=0.7 light=2000 attack=2 bloom=6 turn=-0.2 tilt=0.6 breath=0.2 volume=-6 damping=0.75 width=0.6 | dissolve | lauds | A sure note with seven petals leaning far flat around it
Sea window, facing north | Slow cathedral | petals=5 bend=15 heart=0.3 rings=5 reach=1 light=5500 attack=1.4 bloom=6 turn=0.15 breath=0.4 damping=0.2 release=8 order=Passing volume=-2.5 width=1 | shore | nave | Five petals a little sharp, breathy, a light passing out through them
`,
    },
    {
      id: 'hollow-reeds',
      name: 'Hollow reeds',
      category: 'wind',
      rows: `
Reed in the cloister | Hollow reed | heart=0.35 rings=5 light=2200 fold=0.6 stone=0.6 release=0.6 tilt=0 volume=1 width=0.25 petals=4 reach=0.5 turn=0.04 bloom=2.2 damping=0.7 decay=2 | chamber | reedcall | A plain reed of odd harmonics, folded past half, close to one wall
Chalk line reed | Hollow reed | heart=0.3 rings=9 reach=1 light=2300 fold=0.15 stone=0 breath=0.15 attack=0.15 turn=0.25 volume=-4.5 width=0.35 damping=0.15 bloom=1.5 decay=3 | keen | shepherd | Every odd ring drawn thin and clear, with hardly any breath
Boatman at the weir | Hollow reed | heart=0.55 fold=0.6 light=1100 breath=0.45 release=1.2 stone=0.2 damping=0.8 turn=0.2 tilt=0.4 volume=-1.5 width=0.6 bloom=2.2 reach=0.4 decay=1.5 | repeats | reedcall | A full dark reed folded more than half, breath round every note
Oboe of lead | Hollow reed | petals=5 heart=0.25 fold=0.55 curl=0.3 light=3000 stone=0.7 breath=0.2 release=0.5 rings=8 volume=-0.5 width=0.3 bloom=1.5 damping=0.2 reach=0.6 decay=2 | short | suspended | Five petals folded and curled in stone, narrow and nasal
Wet reed, dry hall | Hollow reed | fold=0.8 curl=0.2 heart=0.4 light=2600 breath=0.6 attack=0.2 release=0.8 strike=0.2 decay=1 rings=5 volume=2 width=0.5 bloom=2.4 | hall 1.mix=0.18 | shepherd | Folded almost full, a small tap and much breath as each note speaks
Two shawms at the gate | Hollow reed | petals=6 fold=0.7 heart=0.2 light=3400 stone=0.6 curl=0.4 breath=0.1 attack=0.12 rings=9 reach=0.9 volume=-5.5 width=0.7 damping=0.1 decay=3 | bright | suspended | Six petals with almost no heart, folded hard, broad and open
Pipe of the well | Hollow reed | petals=7 fold=0.3 heart=0.5 rings=5 light=1800 stone=0.6 curl=0.1 breath=0.35 release=1.5 volume=0.5 width=0.4 reach=0.3 bloom=2.4 decay=1.5 | pipe | reedcall | Seven petals in stone, a hollow tube with a few near rings
Cane split at the end | Hollow reed | petals=9 fold=0.5 curl=0.6 heart=0.4 rings=3 light=3000 stone=0.3 breath=0.25 attack=0.1 bend=10 volume=-8 width=0.5 damping=0.2 bloom=1.5 decay=2 | paper | shepherd | Nine petals curled and folded, a little sharp, with a rasp in them
Horn window | Hollow reed | petals=3 fold=0.65 curl=0 heart=0.5 light=1100 stone=0.5 attack=0.35 release=1 breath=0.1 turn=0.05 volume=-7.5 width=0.5 damping=0.8 bloom=2.8 decay=3 | iron | reedcall | Three petals folded under a low light, a soft brass more than a reed
Cold bagpipe lane | Hollow reed | petals=5 fold=0.9 curl=0.1 heart=0.3 light=2400 stone=0.8 breath=0.05 attack=0.1 release=0.3 rings=9 reach=1 volume=0.5 width=0.6 damping=0.15 decay=1.5 | openfifth | ison | Five petals folded nearly full, unyielding, stopped as soon as let go
Cellar reed | Hollow reed | heart=0.25 rings=7 light=1300 fold=0.7 stone=0.4 breath=0.35 attack=0.2 release=0.9 width=0.2 volume=-2.5 petals=3 reach=0.4 damping=0.85 bloom=2.5 decay=2 | warm | lowreed | Three low petals with little heart, folded far and dark in the middle | bass
Long black tube | Hollow reed | heart=0.35 rings=9 reach=0.9 light=1600 fold=0.3 curl=0.25 breath=0.3 attack=0.3 release=1.6 turn=0.15 volume=3.5 width=0.4 damping=0.2 bloom=3 decay=3 | cave 1.mix=0.2 | lowreed | Low odd harmonics far up the tube, curled slightly, slow to leave
Barge reed at four | Hollow reed | petals=3 heart=0.4 fold=0.7 curl=0.3 light=1300 breath=0.5 attack=0.25 stone=0.3 tilt=0.5 turn=0.3 volume=-1.5 width=0.5 damping=0.8 bloom=2.5 decay=1.5 | blanket | lowreed | A low reed of three petals, folded, half of it breath
Contra in the stairwell | Hollow reed | petals=4 heart=0.25 fold=0.85 light=2000 stone=0.75 breath=0.1 attack=0.15 release=0.7 rings=7 strike=0.25 decay=2 volume=0.5 tilt=0 width=0.3 reach=0.5 | late 1.mix=0.2 | deepline | Very little heart under hard-folded odd rings, tongued, in stone | bass
Mud and cane | Hollow reed | petals=5 heart=0.6 fold=0.4 curl=0.7 light=700 breath=0.35 attack=0.4 release=1.2 stone=0.15 damping=0.9 volume=-1.5 width=0.4 bloom=2.5 decay=2 | drum | lowreed | Dark low notes curled far round, five petals under hardly any light
Air and then a note | Hollow reed | breath=0.8 heart=0.65 fold=0.2 light=2200 attack=0.2 release=1 stone=0.5 rings=3 turn=0.1 volume=-0.5 petals=3 order=Rim_first bloom=1.8 reach=0.3 width=0.4 damping=0.8 decay=3 | halo | lauds | More air than reed, a thin edge first and the note growing inside it
Draught at the vestry | Hollow reed | petals=8 breath=0.95 heart=0.6 light=3000 fold=0 curl=0 attack=0.3 release=1.5 stone=0.5 rings=5 volume=-1 reach=0.2 width=0.6 damping=0.3 bloom=2.2 decay=1.5 | brightair | shepherd | Nearly all breath, blown on the pitch, with eight petals close behind
Whisper of sedge | Hollow reed | petals=8 breath=0.7 heart=0.3 light=1000 fold=0.4 attack=0.4 release=2 tilt=0.8 turn=-0.4 rings=4 volume=-1 width=0.8 damping=0.75 bloom=2.8 decay=2 | rain | suspended | Breathy and dark, eight petals tipping against each other
Cheek to the bottle | Hollow reed | breath=0.8 heart=0.75 rings=4 light=1500 fold=0.1 stone=0.9 attack=0.2 release=1 volume=3.5 petals=7 tracery=Pointed reach=0.2 damping=0.7 width=0.15 order=Heart_first tilt=0 decay=3 | clay | reedcall | One near ring of seven and a gust of air, blown across a mouth of stone
Snow on the mouthpiece | Hollow reed | petals=3 breath=0.75 heart=0.35 light=3000 fold=0.3 curl=0.3 attack=0.3 release=3 damping=0.1 stone=0 volume=-3.5 bloom=2.8 width=0.75 decay=1.5 | frost | shepherd | Bright air curled round three petals, slow to fade
Goatherd on the ridge | Hollow reed | bend=-30 heart=0.45 rings=3 fold=0.5 light=1500 stone=0.3 breath=0.2 attack=0.12 release=0.5 volume=0 petals=3 tracery=Pointed reach=0.3 width=0.2 damping=0.2 decay=2 | closet | shepherd | One ring drawn flat and folded, a rustic reed, sour at the edge and sure in the middle
Reed left in the sun | Hollow reed | bend=20 petals=4 heart=0.5 fold=0.5 light=3200 breath=0.25 attack=0.2 release=1.2 turn=0.3 tilt=0.6 volume=-1.5 bloom=2.2 width=0.6 damping=0.2 decay=3 | chorused | reedcall | Rings a little sharp and rocking, so a held note shimmers
Third valley over | Hollow reed | bend=-70 petals=6 heart=0.5 rings=5 light=2000 breath=0.4 attack=0.3 release=2 stone=0.4 volume=-2 reach=0.4 bloom=3 width=0.7 damping=0.75 decay=1.5 | valley | shepherd | A breathy note with six petals far flat round it, across distance
Bent brass reed | Hollow reed | bend=60 petals=3 heart=0.35 rings=4 fold=0.6 light=2200 breath=0.1 attack=0.1 release=0.4 stone=0.55 volume=-3 width=0.4 damping=0.15 decay=2 | combo | suspended | Three petals bent sharp and folded, metal on the tongue
Mirage, two notes | Hollow reed | bend=35 petals=5 heart=0.3 rings=7 reach=0.9 fold=0.1 light=2000 breath=0.2 attack=0.3 release=2.5 turn=-0.3 volume=-1 bloom=1.5 width=0.9 order=Rim_first decay=3 | embers | suspended | Five petals stretched sharp, the rim before the heart, unsure which note it is
High ring of cane | Dust lace | petals=4 tracery=Pointed heart=0.5 rings=4 reach=0.5 breath=0.3 attack=0.2 release=0.6 fold=0.3 light=2000 turn=0.1 volume=0 width=0.3 damping=0.2 bloom=1.5 | tiled | reedcall | One odd ring stands out above the note, a whistle inside a reed
Duduk on the sill | Dust lace | petals=3 tracery=Pointed heart=0.6 rings=3 reach=0.4 breath=0.4 attack=0.35 release=1 fold=0.5 light=1200 stone=0.6 strike=0.05 volume=2 width=0.4 damping=0.8 bloom=2.4 | across | suspended | A near ring of three lifted out and folded, warm and throaty
Sky between reeds | Dust lace | petals=6 tracery=Pointed heart=0.65 rings=6 reach=0.6 breath=0.5 attack=0.2 release=2 light=3500 turn=0.3 volume=0 width=0.8 damping=0.1 bloom=2.5 | thinair | shepherd | A far ring of six petals with half a breath in it
Nose of the saint | Dust lace | petals=5 tracery=Pointed heart=0.6 rings=5 reach=0.35 breath=0.15 attack=0.12 fold=0.8 curl=0.2 light=1800 stone=0.8 release=0.4 volume=1.5 width=0.3 bloom=1.5 damping=0.65 | chapel | reedcall | One near ring folded hard in stone, tight and through the nose
Reed blown from glass | Dust lace | petals=8 tracery=Pointed heart=0.65 rings=2 reach=0.4 breath=0.1 attack=0.15 release=1.2 curl=0.6 light=2600 turn=0.2 volume=1 tilt=0 width=0.5 bloom=2.2 damping=0.2 | tube | suspended | A plain tone with one curled ring of eight high up, clean and brittle
Squeeze box on deck | Hollow reed | petals=3 turn=0.7 tilt=0.8 heart=0.3 fold=0.4 light=2600 attack=0.1 release=0.25 breath=0.2 rings=7 volume=-4 width=1 damping=0.2 bloom=1.5 decay=1 | closet | chorale | Three petals with rings rocking fast, like two reeds a shade apart | organ
Reed organ, front room | Hollow reed | petals=4 turn=-0.6 tilt=0.9 heart=0.4 fold=0.3 light=1800 attack=0.15 release=0.4 breath=0.3 stone=0.5 volume=-4.5 width=0.6 bloom=2.2 damping=0.75 decay=1.5 | parlour | chorale | Odd reeds whose rings cross quickly against each other, with bellows air | organ
Concertina in the snow | Hollow reed | petals=5 turn=0.55 tilt=1 heart=0.5 rings=3 fold=0.5 light=3000 attack=0.1 release=0.5 breath=0.1 volume=-3 width=0.8 damping=0.15 reach=0.5 decay=1 | spring | suspended | Five folded petals tipping all the way over, clear and quick | organ
Harbour accordions | Hollow reed | petals=3 turn=-0.75 tilt=0.7 heart=0.2 fold=0.7 curl=0.2 light=2000 attack=0.2 release=0.6 stone=0.3 rings=9 volume=-1.5 width=1 damping=0.8 bloom=2.5 reach=0.45 decay=1.5 | drift | chorale | Folded reeds of three with every ring whirling the other way to the next | organ
Footpump hymn | Hollow reed | petals=6 turn=0.8 tilt=0.5 heart=0.6 rings=4 fold=0.2 light=1300 attack=0.3 release=0.8 breath=0.5 stone=0.2 volume=-3 width=0.6 damping=0.85 bloom=2.5 reach=0.3 decay=1 | pillow | chorale | Dark breathy reeds of six, trembling as the pump does | organ
Snake on the warm wall | Hollow reed | curl=0.9 fold=0.5 heart=0.5 turn=0.5 tilt=0.8 light=1400 breath=0.1 attack=0.2 release=1 volume=-1.5 petals=5 rings=4 reach=0.35 width=0.4 damping=0.7 bloom=2.8 decay=3 | bare | reedcall | Five petals curled and folded, sliding from one hollow colour to the next
Turning weathercock | Hollow reed | curl=1 fold=0 petals=3 heart=0.45 turn=0.5 light=2800 breath=0.1 attack=0.15 release=0.7 stone=0.15 volume=3 width=0.8 bloom=2.2 damping=0.2 decay=1.5 | wander | shepherd | Three petals curled as far as they go and turning once in a second
Smoke from the censer | Hollow reed | curl=0.85 fold=0.35 petals=5 heart=0.5 turn=-0.25 light=1400 breath=0.5 attack=0.5 release=2.5 tilt=0.4 volume=-0.5 width=0.6 bloom=3.2 damping=0.8 decay=2 | sighs | suspended | Five petals curled dark, breath rising round them as they cross
Yes and no of it | Hollow reed | curl=0.5 fold=0.6 petals=4 heart=0.2 turn=0.2 light=2400 stone=0.5 breath=0.15 attack=0.1 release=0.5 rings=8 volume=-4 width=0.4 bloom=1.5 damping=0.2 decay=3 | vowel | reedcall | Folded, curled odd rings that say one thing and then the other
Ivy over the door | Hollow reed | curl=0.6 fold=0.15 petals=7 heart=0.6 rings=5 turn=-0.45 tilt=0.9 light=2000 attack=0.4 release=1.8 volume=-1 width=0.8 bloom=2.6 damping=0.6 decay=1.5 | fan 1.mix=0.25 | suspended | Seven petals curled round a clear note, crossing as they turn
Reeds at first light | Hollow reed | attack=1.5 bloom=4 release=4 heart=0.4 fold=0.3 light=2600 breath=0.3 turn=0.15 stone=0.3 volume=-2.5 width=0.9 damping=0.25 decay=10 | hang | nave | Odd harmonics swelling slowly, with a little air, as a whole bank of reeds | pad
Fen before harvest | Hollow reed | petals=3 attack=2 bloom=3 release=5 heart=0.35 fold=0.6 light=1400 breath=0.45 tilt=0.7 turn=-0.2 volume=-7.5 width=0.75 damping=0.75 decay=3 | lean | evening | Folded reeds of three rising in two seconds, grainy with breath | pad
Grey heron | Hollow reed | petals=6 order=Rim_first attack=0.4 bloom=2.5 release=3 heart=0.5 fold=0.2 light=2600 breath=0.35 stone=0.2 volume=-7.5 width=0.6 damping=0.3 decay=8 | shore | lauds | Six petals that come rim first, the thin edge and then the bird | pad
Millpond consort | Hollow reed | petals=5 order=Passing bloom=1.8 attack=0.8 release=3 heart=0.45 fold=0.45 light=2200 breath=0.2 rings=6 volume=3 width=0.8 damping=0.7 decay=12 | section | nave | A light passing through folded reeds of five, over and over | pad
Last barge west | Hollow reed | petals=4 attack=1.2 bloom=7 release=7 heart=0.6 fold=0.5 curl=0.3 light=1000 stone=0.7 turn=0.3 volume=-5 width=0.5 damping=0.8 decay=10 | lowshadow | lauds | A slow dark reed that opens for six seconds in stone | pad
Tongued and gone | Hollow reed | strike=0.9 decay=2 damping=0.5 heart=0.35 fold=0.5 light=3000 breath=0.2 release=0.6 rings=6 volume=2 width=0.4 | touch | ostinato | Short odd notes struck and folded, soon dead | plucked
Thumb on the tines | Hollow reed | strike=1 decay=5 damping=0.2 heart=0.5 fold=0.4 light=2600 stone=0.3 breath=0 release=1.5 rings=3 volume=1 petals=9 reach=0.4 width=0.3 bend=-15 | wood | ostinato | Nine petals a shade flat, folded, struck with a strong heart | plucked
Comb of the music case | Hollow reed | petals=5 strike=0.95 decay=7 damping=0.3 heart=0.3 fold=0.1 light=5000 bend=12 release=3 breath=0 stone=0.2 volume=1 tracery=Golden_bells width=0.6 | silver | inCanon | Five thin struck golden petals a shade sharp, ringing on | plucked
Knock, knock, reed | Hollow reed | petals=5 strike=0.7 decay=2.5 attack=0.3 heart=0.4 fold=0.8 light=1600 stone=0.85 breath=0.3 release=0.8 volume=-3 width=0.4 order=Rim_first bloom=1.8 | slap | rolled | A stone knock first, then a folded reed that comes in from its rim | keys
Cane xylophone | Hollow reed | petals=7 strike=1 decay=3.5 damping=0.8 heart=0.5 fold=0.3 bend=-35 light=2600 stone=0.7 release=1 rings=3 breath=0.1 volume=3.5 width=0.5 | short | ostinato | Seven flat petals struck dry in stone, soon over | plucked
`,
    },
    {
      id: 'petal-flutes',
      name: 'Petal flutes',
      category: 'wind',
      rows: `
Flute in the side chapel | Three-petal flute | heart=0.4 rings=4 light=3200 breath=0.3 stone=0.5 release=0.9 tilt=0.8 volume=-0.5 petals=6 reach=0.3 fold=0.3 turn=0.6 width=0.4 damping=0.15 bloom=2.4 | chapel | shepherd | Six petals close round the heart that tip as they turn, breath at each start
Morning on the wing | Three-petal flute | heart=0.6 rings=5 reach=0.6 light=3500 breath=0.4 turn=0.2 release=1.5 attack=0.2 volume=0 width=0.5 bloom=1.5 damping=0.2 | drifted | reedcall | A clear flute with five rings, quick and light
Silver under cloth | Three-petal flute | heart=0.6 rings=4 light=1200 breath=0.3 fold=0.6 release=0.5 stone=0 volume=0 width=0.3 petals=6 attack=0.35 bloom=2.2 damping=0.85 | thick | suspended | A dim round tone of six folded petals, breath on top
Bird table | Three-petal flute | heart=0.5 rings=5 light=5000 breath=0.2 attack=0.1 release=0.3 strike=0.5 decay=3 turn=0.3 volume=1 petals=5 bend=14 reach=0.6 width=0.5 damping=0.15 | shine | shepherd | A tapped flute of five with a bright edge, short and nimble
Weathered fife | Three-petal flute | heart=0.55 rings=7 reach=0.7 light=3000 fold=0.4 breath=0.55 attack=0.12 release=0.4 stone=0.4 volume=-4 strike=0.05 width=0.35 tilt=0.15 bloom=2.2 | front | reedcall | Seven rings and a fold, coarser, with the air heard
All breath, some moon | Three-petal flute | breath=0.9 heart=0.6 light=1300 attack=0.4 release=2 rings=3 turn=-0.4 volume=0 petals=5 tilt=0.8 bloom=3 width=0.8 damping=0.8 | late | suspended | Almost only air on five dark petals, the note a faint line
Blown across a jar | Three-petal flute | breath=0.9 heart=0.7 rings=5 light=1800 stone=0.85 attack=0.4 release=0.6 volume=2.5 petals=4 tracery=Broken reach=0.3 turn=0.2 width=0.5 damping=0.7 bloom=2.5 fold=0.5 bend=-20 | shell | lauds | Air over odd panes, some of them shaded by turns, a wide jar
Hoarse whistle | Three-petal flute | breath=0.7 heart=0.5 fold=0.6 curl=0.3 light=2600 attack=0.15 release=0.5 rings=5 stone=0.2 volume=-2.5 width=0.4 bloom=1.5 damping=0.2 | grit | shepherd | Folded and curled under the breath, rough at the lip
Sea air through a gap | Three-petal flute | petals=5 breath=1 heart=0.4 light=5500 attack=0.3 release=2.5 rings=4 tilt=0.8 turn=-0.3 volume=-1.5 bloom=3.2 width=0.9 damping=0.25 | shore | shepherd | Breath alone, shaped by five petals that cross as they turn
Steam from the spout | Three-petal flute | petals=5 breath=0.95 heart=0.55 light=2000 attack=0.3 release=1 rings=3 reach=0.2 damping=0.1 volume=-2.5 tracery=Pointed width=0.3 turn=0.7 tilt=0.9 bloom=1.5 | short | reedcall | High thin air with a kettle note, one ring of five, far inside it
Four recorders, one room | Three-petal flute | breath=0.25 heart=0.5 rings=4 light=2600 attack=0.1 release=0.4 stone=0 turn=0.45 volume=-6 petals=3 reach=0.35 fold=0.3 curl=0.5 tilt=0.4 width=0.8 damping=0.2 bend=6 | chamber | chorale | Four flutes not quite agreed in a small room, a little curl in their tone | organ
Stopped flute, oak chest | Three-petal flute | petals=6 heart=0.65 rings=3 reach=0.2 light=1300 breath=0.6 attack=0.1 release=0.5 stone=0.4 curl=0.6 volume=3.5 width=0.3 damping=0.75 bloom=1.5 tracery=Pointed fold=0.5 | wood | chorale | One near ring of six, curled and folded behind a loud chiff, a stopped pipe | organ
Two-foot piccolo stop | Three-petal flute | petals=6 heart=0.35 rings=4 reach=0.35 light=2200 breath=0.15 attack=0.1 release=0.4 turn=0.5 volume=-6.5 tracery=Pointed width=0.6 tilt=0.6 damping=0.15 stone=0.3 | bright | chorale | One ring of six lifted over the note, small and clear | organ
Tierce on a Sunday | Three-petal flute | heart=0.25 rings=3 reach=0.5 light=3000 breath=0.1 attack=0.1 release=0.6 fold=0.2 stone=0.25 volume=-3.5 width=0.5 damping=0.15 | hall 1.mix=0.22 | chorale | Rings louder than the heart, at the octave, the third and the seventh | organ
Tremulant drawn | Three-petal flute | heart=0.6 rings=7 light=3200 breath=0.2 attack=0.12 turn=0.75 tilt=0.8 release=0.5 stone=0.2 volume=-4 width=0.75 petals=3 reach=0.6 bloom=1.5 damping=0.15 | cathedral 1.mix=0.22 | chorale | Three-petal pipes whose rings tip over twice and more a second | organ
Low flute on the landing | Three-petal flute | heart=0.45 rings=5 light=1100 fold=0.6 breath=0.85 attack=0.3 release=1.2 stone=0.4 volume=-5 width=0.3 bloom=2.4 damping=0.85 petals=5 reach=0.3 | darkroom | lowreed | A low flute of five, folded, breath as loud as tone
Bamboo in the fog | Three-petal flute | heart=0.35 rings=6 light=2000 fold=0.2 breath=0.75 bend=-28 attack=0.25 release=1.5 stone=0.8 volume=-1.5 petals=4 reach=0.5 curl=0.5 turn=0.1 width=0.4 bloom=2.8 damping=0.2 | veil | lowreed | Odd rings flat of true, much breath, a thick tube of stone
Arch under the railway | Three-petal flute | heart=0.7 rings=3 light=800 breath=0.4 attack=0.5 release=3 turn=0.2 width=0.8 tilt=0.5 volume=2 bloom=3 damping=0.8 | halved | lowreed | A dark low tone with three near rings leaning as they go
Great bass recorder | Three-petal flute | petals=4 heart=0.55 rings=6 light=1400 fold=0.25 breath=0.3 attack=0.15 release=0.7 stone=0.8 strike=0.2 decay=1 volume=2 width=0.4 bloom=2.5 damping=0.6 | short | deepline | Odd rings deep in stone with a chiff at the start, low and hollow | bass
Whale under the ice | Three-petal flute | heart=0.6 rings=4 light=900 curl=0.4 fold=0.5 breath=0.2 attack=0.9 release=5 turn=-0.35 tilt=0.9 volume=-7 reach=0.15 width=0.8 bloom=5 damping=0.6 | water | lowreed | A great slow tone with near rings crossing in it
Panpipes off the roof | Three-petal flute | strike=0.6 decay=2.5 damping=0.2 breath=0.9 heart=0.45 rings=3 light=2600 release=0.4 attack=0.1 volume=-1.5 width=0.5 petals=4 reach=0.3 fold=0.3 | tiled | ostinato | Short puffs of breath with a note inside, half struck | plucked
Puffed clay row | Three-petal flute | strike=0.8 decay=3 breath=0.6 heart=0.75 rings=3 light=1200 stone=0.4 release=0.3 fold=0.1 volume=-0.5 damping=0.29 reach=0.2 width=0.3 | clay | ostinato | Struck breath on a round heart, short and close | plucked
Kissed bottle tops | Three-petal flute | strike=0.95 decay=9 breath=0.5 heart=0.9 rings=2 light=3500 stone=0.8 release=1.5 damping=0.6 volume=-3.5 width=0.5 tilt=0.1 | box | drops | A breathy knock and a pure short tone, stone round it | plucked
Children with whistles | Three-petal flute | petals=5 strike=0.5 decay=1.5 breath=0.2 heart=0.6 rings=4 light=3000 bend=45 release=0.4 attack=0.2 volume=3 order=Rim_first bloom=1.5 reach=0.6 width=0.9 damping=0.1 | pair | ostinato | Five petals well sharp, the rims of them blown ahead of the notes | plucked
Pipe and tabor | Three-petal flute | strike=0.5 decay=2.5 damping=0.7 breath=0.4 heart=0.7 fold=0.4 light=2000 stone=1 attack=0.15 release=0.4 volume=2.5 width=0.5 rings=4 reach=0.3 | booth | shepherd | A knock on full stone and a thin held pipe behind it
Whistle on the ferry | Three-petal flute | heart=0.8 rings=4 light=2400 breath=0.45 attack=0.15 release=0.8 turn=0.3 strike=0 volume=-2 width=0.3 reach=0.2 curl=0.5 fold=0.35 bloom=2.2 damping=0.3 | singer | shepherd | A strong heart with a little curl round it, whistled through the teeth
Night watch signal | Three-petal flute | heart=0.45 rings=6 reach=0.7 light=4000 breath=0.1 attack=0.1 release=1.5 tilt=0 turn=0.3 volume=0.5 width=0.1 damping=0.2 | backhall | answer | A round call with six rings that flash as they cross
Wren behind the wall | Three-petal flute | petals=7 heart=0.6 rings=3 light=6000 breath=0.2 attack=0.1 release=0.4 strike=0.35 decay=1 volume=2 reach=0.5 tilt=0.2 width=0.3 damping=0.15 bloom=1.5 fold=0.3 | spring | shepherd | A tapped whistle of seven petals, a glint of folds far up
Antenna in the attic | Three-petal flute | heart=0.5 rings=5 light=3000 curl=0.3 fold=0.1 breath=0 attack=0.3 release=1.2 turn=0.4 volume=-2.5 petals=3 reach=0.15 tilt=0.6 order=Passing bloom=2.4 width=0.5 damping=0.2 | singer 1.depth=30 | lauds | An unbreathed tone of three that a small light goes over every three seconds
Kettle of the moon | Three-petal flute | petals=10 heart=0.65 rings=1 reach=0.9 light=7000 breath=0.35 attack=0.5 release=3 stone=0.1 volume=-0.5 width=0.9 bloom=3 damping=0.05 | glimmer | reedcall | One pair of rings at nine and eleven over a plain breathy note
Flutes, winding stair | Three-petal flute | turn=-0.5 tilt=1 heart=0.55 rings=5 light=2000 breath=0.5 attack=0.5 release=2 volume=1.5 petals=5 order=Passing bloom=2.6 reach=0.3 curl=0.4 width=0.8 damping=0.7 | plate | nave | Curled breathy rings of five, a light climbing through them as they turn | pad
Wooden choir, far bank | Three-petal flute | attack=1.2 bloom=3.5 release=3 heart=0.6 breath=0.5 light=1700 stone=0.5 fold=0.15 volume=-2.5 damping=0.8 width=0.7 | notch | nave | Breathy flutes swelling for a second, dark with distance | pad
Doves in the roof beams | Three-petal flute | attack=0.7 heart=0.75 rings=3 light=1300 breath=0.6 turn=0.45 tilt=0.7 release=2 curl=0.2 volume=-4 bloom=2.8 width=0.7 damping=0.7 | hang | evening | Soft round notes that brood and tip, a little air on them | pad
Bells of breath | Three-petal flute | order=Rim_first bloom=2.2 attack=0.3 heart=0.5 rings=5 light=3200 breath=0.65 release=4 strike=0.3 decay=3 volume=-2.5 width=0.9 | strings | evening | A soft stroke, then breath from the rim inwards | pad
Slow swimmers | Three-petal flute | order=Passing bloom=2 attack=0.6 heart=0.5 rings=6 reach=0.6 light=2200 breath=0.3 release=3 fold=0.15 volume=3 width=0.85 damping=0.7 | sea | lauds | A light passing out through flutes every three seconds | pad
Ocarina of slate | Three-petal flute | heart=0.7 rings=4 light=1800 stone=1 breath=0.45 attack=0.12 release=0.4 fold=0.5 volume=-2.5 petals=6 reach=0.2 bend=-20 turn=0 width=0.15 damping=0.3 bloom=1.5 | shell | shepherd | Six petals a shade flat in full stone, four fixed colours under the breath
Cup of a hand | Three-petal flute | petals=3 heart=0.55 rings=4 light=1800 stone=0.7 breath=0.5 curl=1 attack=0.2 release=0.6 volume=-0.5 turn=0.25 reach=0.25 fold=0.4 bloom=2.8 damping=0.7 width=0.3 | roundO | suspended | Three petals curled as far as they go behind the hand
Chimney on a still day | Three-petal flute | petals=3 heart=0.4 rings=6 light=1800 stone=0.85 breath=0.7 attack=0.3 release=1.5 turn=0 tilt=0 volume=1 reach=0.3 fold=0.4 bloom=3.5 damping=0.7 width=0.4 | pipe | reedcall | Still petals of three in stone, folded, a deep throat of brick
Milk churn lid | Three-petal flute | petals=5 heart=0.5 rings=3 light=2400 stone=0.9 fold=0.5 breath=0.35 bend=-40 attack=0.1 release=0.5 volume=-8 width=0.3 damping=0.2 bloom=1.5 | tin | answer | Five flat petals folded in stone, a dull metal hoot
Niche of fine glass | Three-petal flute | petals=4 heart=0.55 rings=4 light=5000 stone=0.4 breath=0.15 attack=0.25 release=2 volume=-1.5 reach=0.3 bloom=2.6 damping=0.1 width=0.6 | tube | suspended | Four petals, clear rings over a clean heart
Flutter in the dark | Broken panes | petals=3 heart=0.7 rings=4 reach=0.4 light=1100 breath=0.35 attack=0.2 release=0.8 turn=0.2 volume=5.5 tilt=0.1 bloom=2.2 width=0.4 damping=0.7 decay=1.5 | chamber 1.mix=0.3 | reedcall | A breathy flute lit and lost and lit again
Moth flute | Broken panes | petals=4 heart=0.7 rings=3 light=2600 breath=0.5 attack=0.3 release=1.5 strike=0.2 decay=1.5 volume=3.5 width=0.6 bloom=2.5 reach=0.4 damping=0.6 | dust | suspended | A sure heart with small odd panes flickering in the air beside it
Torn bellows | Broken panes | petals=4 heart=0.5 fold=0.5 light=1200 breath=0.8 attack=0.4 release=1 stone=0.6 rings=6 volume=5 bloom=2.8 damping=0.75 width=0.6 decay=2 | hallway | lowreed | Odd dark panes and gusts of breath that come and fail
Signal lost at sea | Broken panes | petals=3 heart=0.7 rings=4 light=1700 breath=0.3 attack=0.15 release=0.6 bend=15 turn=0.3 volume=1.5 reach=0.4 width=0.4 damping=0.3 decay=3 | transistor | answer | A plain call, its lit panes going under and coming back
Overblown at the sill | Broken panes | petals=6 heart=0.4 rings=4 reach=0.6 light=2200 breath=0.45 attack=0.1 release=0.7 curl=0.4 volume=1 width=0.5 damping=0.2 bloom=1.5 decay=1.5 | points | shepherd | Six curled panes that overblow one after another
Wet fingertip, cold rim | Three-petal flute | petals=6 order=Rim_first bloom=1.5 heart=0.4 rings=4 light=4000 breath=0.1 attack=0.6 release=3 bend=8 stone=0 volume=-1.5 reach=0.4 width=0.6 damping=0.15 | bowls 1.mix=0.2 | suspended | Six petals rubbed in from the rim, a hair sharp, clean | bell
Frosted flute | Frost on the rim | petals=3 bloom=1.6 attack=0.4 release=1.5 heart=0.5 light=3200 turn=0.2 tilt=0.3 breath=0.5 strike=0.05 rings=3 width=0.45 damping=0.2 | frost | reedcall | Three petals from the rim inwards with cold air on them
Tall glass, half full | Three-petal flute | petals=8 heart=0.45 rings=4 reach=0.4 light=6000 breath=0.05 attack=0.9 release=4 turn=0.15 fold=0.1 volume=-5.5 bloom=4.5 damping=0.1 width=0.8 | space 1.mix=0.2 | evening | Eight clear petals swelling with hardly any breath | pad
Ice flute, second verse | Three-petal flute | petals=3 heart=0.6 rings=5 reach=0.8 light=4000 bend=22 breath=0.2 attack=0.2 release=1.5 damping=0.1 volume=2.5 width=0.5 bloom=2.2 tilt=0 | thin | shepherd | Rings of three drawn sharp and very clear, brittle
Blue smoke flute | Three-petal flute | curl=0.8 fold=0.2 heart=0.6 rings=5 light=2000 breath=0.55 attack=0.4 release=1.8 turn=-0.3 tilt=0.5 volume=0 width=0.75 bloom=3.2 damping=0.7 | trail | suspended | Three petals curled round the breath, always changing colour
`,
    },
    {
      id: 'glass-plucks',
      name: 'Glass plucks',
      category: 'plucked',
      rows: `
Pane tapped with a ring | Glass plucks | petals=9 heart=0.3 rings=5 light=7500 decay=12 damping=0.1 release=3 turn=0.2 volume=-0.5 width=0.7 reach=0.35 stone=0.4 bend=12 | touch | drops | Nine petals a shade sharp, tapped hard and ringing on clear
Leaded light at three | Glass plucks | petals=7 heart=0.4 rings=3 light=5000 decay=10 damping=0.4 stone=0.25 release=4 volume=2 reach=0.4 width=0.6 | silver | ostinato | Seven petals round a clear heart, struck and left to fade
Sleet on the skylight | Glass plucks | petals=12 heart=0.3 rings=3 reach=1 light=8000 decay=3.5 damping=0.07 release=1 tilt=0.7 turn=0.4 volume=-1.5 width=0.95 | glassrain | ostinato | Thin high splinters of twelve petals, soon gone
Coloured chips | Glass plucks | petals=6 heart=0.5 rings=4 light=6000 decay=6 fold=0.3 curl=0.2 release=1.5 damping=0.25 volume=1 width=0.6 reach=0.5 | dotted | inCanon | Six petals folded slightly, each chip with its own tint
Bucket and squeegee | Glass plucks | petals=3 heart=0.6 rings=4 reach=0.4 light=2400 decay=8 damping=0.6 breath=0.5 release=1.5 volume=2 stone=0.3 fold=0.5 curl=0.3 bend=-18 width=0.5 | tiled | drops | Three flat petals struck and folded, with a wet breath on the stroke
Lute in the ambulatory | Glass plucks | petals=5 heart=0.4 rings=5 light=2200 decay=3.5 damping=0.35 stone=0.7 release=0.4 fold=0.6 volume=-4 reach=0.5 width=0.3 curl=0.3 | evenChamber | rolled | Five folded petals struck close like gut, stone at the back of each
Kora by a fountain | Glass plucks | petals=3 heart=0.45 rings=8 reach=0.7 light=4500 decay=7 damping=0.33 fold=0.15 stone=0.2 release=2.5 volume=1.5 width=0.65 | shadowed | ostinato | Eight rings of three struck bright, the outermost dying first
Gut and cedar | Glass plucks | petals=3 heart=0.35 rings=8 light=2000 decay=4 damping=0.5 stone=0.9 release=0.6 fold=0.6 breath=0.1 volume=4 width=0.35 reach=0.5 turn=0.1 | wood | rolled | Rings of three struck full, folded, with a stone body of their own
Harp under a dust sheet | Glass plucks | petals=6 heart=0.55 rings=4 light=1600 decay=14 damping=0.4 release=3 turn=0.5 tilt=0.7 volume=-1 width=0.6 fold=0 reach=0.4 stone=0.5 bend=8 | hall | rolled | Six petals dimly lit, leaning as they ring, struck and left | string
Low strings unbraced | Glass plucks | petals=3 heart=0.35 rings=9 reach=0.9 light=2600 decay=9 damping=0.4 fold=0.4 stone=0.6 release=4 volume=3.5 width=0.7 curl=0.3 turn=0.6 | sympathy | gongs | Nine folded rings of three, struck low and long | string
Marbles in the aisle | Glass plucks | petals=5 heart=0.4 rings=3 light=3500 decay=5 damping=0.3 release=1.5 stone=0.1 strike=0.9 attack=0.1 volume=-6 bend=70 reach=0.5 width=0.1 tilt=0 | pebble 2.mix=0.14 | drops | Five petals bent sharp, round marbles knocked together on stone
Beads on a tray | Glass plucks | petals=7 heart=0.3 rings=3 light=7000 decay=3 damping=0.15 release=0.5 stone=0.15 volume=2 reach=0.2 tilt=0.2 width=0.6 | stars | drops | A short bright bead with rings at six and eight behind it
Dropped coins, dry font | Glass plucks | petals=5 heart=0.3 rings=3 light=3500 decay=3.5 damping=0.2 bend=45 release=0.8 stone=0.4 volume=0.5 width=0.6 | gated | ostinato | Five petals bent sharp, small hard metal, gone at once
Pebble in a gutter | Glass plucks | petals=4 heart=0.7 rings=3 light=800 decay=2.5 damping=0.6 stone=0.9 release=0.3 breath=0.2 volume=-4 width=0.4 | slap | ostinato | Dark odd knocks deep in stone, over quickly
Hail on lead | Glass plucks | petals=5 heart=0.05 rings=5 light=2600 decay=2 fold=0.6 damping=0.2 stone=0.7 release=0.3 curl=0.3 volume=5 reach=0.4 tilt=0.3 width=0.5 | short | inCanon | Five folded petals with hardly a heart, dull and small
Koto on slate | Glass plucks | petals=3 heart=0.4 rings=7 light=3500 decay=8 damping=0.29 curl=0.5 fold=0.3 release=1.2 turn=0.3 volume=-4.5 width=0.35 stone=0.3 tilt=0.2 | level 1.gain=8 | ostinato | Three petals curled and struck, twanging as the rings turn
Wire across the vault | Glass plucks | petals=4 heart=0.35 rings=9 reach=1 light=5000 decay=7 damping=0.13 fold=0.2 curl=0.4 release=3 bend=6 volume=-7.5 width=0.8 | twang | rolled | Odd wires a hair sharp, curled, all nine rings ringing
Thorn and string | Glass plucks | petals=5 heart=0.25 rings=6 light=4000 decay=3.5 damping=0.39 fold=0.7 curl=0.2 stone=0.3 release=0.5 volume=5.5 width=0.4 | paper | ostinato | Five petals folded hard, a rough pluck soon over
Bent nail on a fence | Glass plucks | petals=6 heart=0.5 rings=4 light=4500 decay=6 damping=0.4 curl=0.8 bend=-30 release=1.5 stone=0.5 volume=0.5 width=0.5 tilt=0.15 | tin | drops | Six flat petals curled far, rusty and loose
Shamisen rain | Glass plucks | petals=3 heart=0.5 rings=5 light=2800 decay=3 damping=0.8 fold=0.5 breath=0.3 stone=0.55 release=0.4 volume=4.5 width=0.4 | rain | ostinato | Folded three-petal plucks with a skin and some breath, short
Thumb piano, window seat | Glass plucks | petals=7 heart=0.45 rings=3 light=2000 decay=4 damping=0.2 stone=0.7 bend=24 release=0.6 volume=-2.5 reach=0.2 fold=0.2 width=0.3 | quietup | inCanon | A close cluster of seven well sharp, tongues of metal
Teeth of the music comb | Glass plucks | petals=7 heart=0.25 rings=3 light=4000 decay=11 damping=0.05 release=1 stone=0 turn=0.1 volume=-1 reach=0.3 width=0.6 tracery=Golden_bells tilt=0.1 | wood | inCanon | Seven golden petals, tiny and clean, ringing on in the case
Mallets on sycamore | Glass plucks | petals=4 heart=0.55 rings=4 light=1600 decay=3 damping=0.3 stone=0.8 release=1 breath=0.05 volume=5.5 width=0.5 reach=0.4 | amptrem | ostinato | A heavy heart and odd rings, warm wooden bars
Copper bars cooling | Glass plucks | petals=4 heart=0.35 rings=5 light=5000 decay=18 damping=0.2 bend=45 release=6 turn=0.5 tilt=0.8 volume=-0.5 reach=0.5 width=0.8 | chime | answer | Odd rings bent sharp, bars that ring long and lean
Vibes of the undercroft | Glass plucks | petals=4 heart=0.5 rings=4 light=3200 decay=14 damping=0.3 release=4 turn=0.6 tilt=0.9 volume=1 reach=0.4 width=0.7 bend=6 fold=0.4 stone=0.5 | shimmered | rolled | A round struck tone whose odd rings flicker as they tip
Echo of a thimble | Glass plucks | petals=5 heart=0.2 rings=3 light=5000 decay=2.5 damping=0.15 release=0.8 stone=0.3 volume=0.5 reach=0.15 tilt=0.15 width=0.4 | heads | drops | Five petals, a small tap that comes back
Skips across the pond | Glass plucks | petals=5 heart=0.5 rings=5 light=3000 decay=6 damping=0.25 release=1 fold=0.4 volume=-1 reach=0.2 width=0.25 | slowing | drops | Five round petals plucked once and thrown over water
Arpeggio for two walls | Glass plucks | petals=3 heart=0.5 rings=5 light=4000 decay=4.5 damping=0.33 release=1 curl=0.2 width=1 volume=1 | falltape | ostinato | Three petals plucked clear, as wide as the rose goes
Lanterns down the canal | Glass plucks | petals=5 heart=0.45 rings=4 light=4000 decay=10 damping=0.2 release=3 turn=0.15 volume=3 reach=0.2 width=0.8 | unfold | answer | Five petals over a sure heart, each note opening as it goes by
Reply from the gallery | Glass plucks | petals=6 heart=0.5 rings=4 light=5500 decay=5 damping=0.3 release=1.5 volume=2.5 width=0.6 stone=0.5 bend=-12 reach=0.4 | round | answer | Six petals a shade flat struck clear, sparse enough to hear who replies
Quills on parchment | Glass plucks | petals=3 heart=0.3 rings=9 reach=0.8 light=5500 decay=4.5 damping=0.35 fold=0.1 stone=0.35 release=0.3 breath=0.15 tilt=0.1 width=0.4 | level | rolled | A bright quill of nine rings, stopped as soon as the key is up | keys
Spinet in the crossing | Glass plucks | petals=4 heart=0.25 rings=8 reach=0.7 light=6000 decay=6 damping=0.4 curl=0.1 release=0.4 turn=0.1 volume=-1.5 width=0.6 | cathedral 1.mix=0.18 | rolled | Thin odd harmonics plucked by quills, quick to stop | keys
Clavichord, door ajar | Glass plucks | petals=3 heart=0.6 rings=5 light=2200 decay=3 damping=0.15 stone=0.3 release=0.3 fold=0.5 breath=0.1 volume=6 width=0.2 tracery=Pointed reach=0.3 | across | nocturne | A small ring of three folded over the note, damped and near the wood | keys
Virginals under snow | Glass plucks | petals=5 heart=0.35 rings=6 light=3500 decay=4 damping=0.33 release=0.6 fold=0.4 order=Rim_first bloom=2.2 strike=0.6 attack=0.5 volume=2 width=0.6 | hiss | nocturne | Five folded petals with the rim left hanging under each pluck | keys
Regal and quill | Glass plucks | petals=6 heart=0.3 rings=5 light=2300 decay=2 damping=0.4 fold=0.5 strike=0.6 attack=0.1 release=0.3 stone=0.5 width=0.4 volume=-3.5 | console | rolled | Six folded petals plucked, with a small reed held behind | keys
Plucked from the edge | Dust lace | petals=8 tracery=Pointed strike=1 decay=5 heart=0.9 rings=3 reach=0.5 breath=0.2 light=2600 release=1.5 damping=0.2 volume=0 width=0.6 | evenShort | ostinato | One ring of eight struck over a plain note, a ping above a tap
Flageolets on nothing | Dust lace | petals=3 tracery=Pointed strike=1 decay=7 heart=0.8 rings=3 reach=0.3 breath=0.05 light=1300 release=3 damping=0.5 volume=-0.5 tilt=0.1 width=0.4 | evenHall | drops | A near ring of three struck over a plain heart, flageolets
Pins in velvet | Dust lace | petals=5 tracery=Pointed strike=0.95 decay=3 heart=0.75 rings=5 reach=0.6 breath=0.5 light=1600 release=0.5 fold=0.4 stone=0.3 volume=1.5 damping=0.29 tilt=0.1 width=0.3 | felt | ostinato | One ring of five folded into soft breathy pins
Crow on the cross | Dust lace | petals=4 tracery=Pointed strike=0.9 decay=4.5 heart=0.75 rings=4 reach=0.4 curl=0.6 fold=0.4 breath=0.1 light=1300 stone=0.6 release=0.6 volume=3.5 damping=0.5 width=0.5 | tiled | inCanon | An odd ring lifted out, curled and folded, dry as a beak
Second sun | Dust lace | petals=11 tracery=Pointed strike=0.85 decay=12 heart=0.8 rings=2 reach=0.5 breath=0 light=4000 release=5 attack=0.8 volume=-0.5 damping=0.29 width=0.8 | glints | answer | A round note with one ring of eleven struck bright above it
Glitter over the crypt | Broken panes | petals=8 strike=1 decay=6 heart=0.5 rings=5 light=3000 breath=0 release=3 damping=0.2 volume=3.5 tilt=0.15 width=0.6 | crypt 1.mix=0.25 | drops | Struck panes of eight, some lit and some already dark
Cracked tile scale | Broken panes | petals=3 strike=0.95 decay=3.5 heart=0.4 rings=6 light=1500 fold=0.3 stone=0.6 release=0.5 breath=0.1 volume=-3 damping=0.6 width=0.5 | level 1.gain=10 | ostinato | Three-petal panes struck in stone, each key with pieces of its own missing
Mosaic floor, barefoot | Broken panes | petals=4 strike=0.9 decay=7 heart=0.5 rings=6 light=2400 breath=0.1 release=1 damping=0.2 stone=0.6 volume=0 reach=0.5 fold=0.4 width=0.3 | parlour | rolled | Odd panes struck close in stone, each chord with holes in it
Sequins on black cloth | Broken panes | petals=12 strike=1 decay=4.5 heart=0.4 rings=3 light=4000 breath=0 release=2 turn=0.5 tilt=0.8 volume=3.5 reach=0.6 width=0.85 damping=0.1 | airy | ostinato | Twelve small bright panes, flashing and gone
Gate left to bang | Broken panes | petals=9 strike=1 decay=2.5 heart=0.4 rings=5 light=900 bend=-110 fold=0.5 stone=0.3 release=0.6 volume=4 damping=0.6 width=0.5 turn=0.6 tilt=0.9 | evenValley | answer | Nine dim panes far flat, a loose knock out of doors
Long string, low sun | Glass plucks | petals=3 heart=0.6 rings=6 light=1600 decay=9 damping=0.26 release=7 fold=0.3 turn=0.3 tilt=0.5 volume=2 width=0.7 | under | gongs | Low plucks folded a little, long in dying | string
Aeolian ladder | Glass plucks | petals=7 heart=0.4 rings=5 reach=0.8 light=5000 decay=10 damping=0.15 release=8 turn=-0.4 tilt=0.8 volume=0 width=0.95 | space | drops | Seven bright petals left to ring and cross each other
Rim of the fountain | Glass plucks | petals=6 heart=0.5 rings=3 light=3800 decay=7 strike=0.75 order=Passing bloom=1.5 attack=0.6 release=5 volume=1 width=0.7 | orbits | answer | A stroke of six petals, with light passing out through the rest
Psaltery at vespers | Glass plucks | petals=4 heart=0.45 rings=7 reach=0.8 light=4200 decay=12 damping=0.5 release=9 stone=0.3 volume=-6 width=0.6 | ringing | rolled | Odd courses struck and never stopped, sounding into each other | string
Gold thread unspooled | Glass plucks | petals=5 heart=0.55 rings=4 light=5000 decay=9 damping=0.3 release=5 curl=0.4 turn=0.35 volume=-3 width=0.75 | stack | ostinato | Five curled petals plucked, thin and bright, colours turning
`,
    },
    {
      id: 'chime-wheels',
      name: 'Chime wheels',
      category: 'bell',
      rows: `
Chimes, north porch | Chime wheel | petals=5 heart=0.3 rings=5 light=3500 decay=14 damping=0.1 release=6 turn=0.15 volume=-1 width=0.85 bend=-25 tilt=0.4 fold=0.3 reach=0.7 | valley | peal | Five golden petals a shade flat and folded, hardly moving as they ring
Sanctus handbell | Chime wheel | petals=4 heart=0.4 rings=4 reach=0.25 light=2600 strike=1 decay=9 damping=0.2 release=4 stone=0.2 volume=4 width=0.6 bend=22 turn=0.1 tilt=0.2 | hall | highBells | A small clear bell of four golden petals, its rings a shade sharp
Doorway of small bells | Chime wheel | petals=5 heart=0.45 rings=4 reach=0.7 light=3400 strike=1 decay=6 damping=0.07 release=2 turn=0.6 tilt=1 volume=0 width=0.8 | evenPlate | peal | Bright short bells whose rings tip right over as they turn
Seven on a leather strap | Chime wheel | petals=7 heart=0.4 rings=3 light=4500 strike=1 decay=4.5 damping=0.2 release=1 fold=0.2 stone=0.4 volume=4.5 width=0.6 | evenShort | peal | Seven golden petals, tight little bells, dry
Glint on the weathervane | Chime wheel | petals=9 heart=0.4 rings=3 light=5000 strike=0.9 decay=12 damping=0.15 release=9 turn=0.2 volume=3 reach=0.4 tilt=0.2 width=0.7 | reverse | highBells | Nine golden petals, two high rings that stay a long time
Tenor of the tower | Chime wheel | petals=3 heart=0.5 rings=7 light=1700 decay=20 damping=0.4 stone=0.6 fold=0.2 release=9 turn=0.25 volume=-5.5 tilt=0 width=0.15 | cathedral | toll | A great bell of three golden petals, slow to leave
Curfew over the fens | Chime wheel | petals=3 heart=0.35 rings=6 reach=0.6 light=1600 strike=0.9 decay=15 damping=0.5 release=8 bend=-20 stone=0.3 volume=2 width=0.6 | shore | toll | A darker bell with its rings drawn flat, heard across water
Bell with a hairline | Chime wheel | petals=4 heart=0.3 rings=7 light=3000 strike=1 decay=12 damping=0.2 fold=0.7 curl=0.3 bend=35 stone=0.5 release=4 volume=-3 width=0.5 | evenWarm | toll | Four golden petals folded and bent, a bell with a flaw in it
Muffled on one side | Chime wheel | petals=5 heart=0.6 rings=4 light=1000 strike=0.8 decay=10 damping=0.9 release=5 stone=0.8 volume=1 width=0.3 | darkhall | toll | A golden bell with its rings soaked up, mostly stone left
Wedding, three miles off | Chime wheel | petals=3 heart=0.6 rings=6 light=2000 strike=0.75 decay=8 damping=0.3 breath=0.3 release=6 turn=0.5 tilt=0.9 volume=1.5 width=0.9 reach=0.4 bend=20 curl=0.3 fold=0.3 | shore 1.distance=0.8 | peal | A peal a little sharp with breath in it, each bell swinging as it turns
Gong of the refectory | Bronze gong | petals=7 fold=0.5 curl=0.4 bend=95 light=3500 decay=18 damping=0.35 stone=0.3 release=9 volume=4 strike=1 width=0.3 tilt=0.2 | darkplate | gongs | Seven golden petals folded and bent sharp, a broad bronze
Sheet bronze, slow roll | Bronze gong | petals=3 fold=0.8 curl=0.7 bend=110 light=3500 strike=0.5 attack=1.5 decay=25 release=10 turn=0.3 volume=-1 width=0.8 | cave 1.mix=0.2 | gongs | Half struck and half swelling, folded deep, rings far sharp
Lake gong | Bronze gong | petals=6 fold=0.2 curl=0.2 bend=-90 heart=0.5 light=1400 decay=24 strike=0.8 release=12 turn=-0.35 tilt=0.3 width=0.5 reach=0.8 damping=0.15 rings=9 volume=-5 | water | gongs | Six golden petals drawn far flat round a steady heart
Cliff above the quarry | Bronze gong | petals=5 fold=1 curl=0.4 bend=140 heart=0.3 light=4000 decay=12 damping=0.33 strike=1 release=6 stone=0.6 volume=1.5 width=0.7 | evenHall | gongs | Five golden petals bent sharp and folded hard, a rough splash
Brass kettle, felt stick | Bronze gong | petals=8 fold=0.4 curl=0.1 bend=40 heart=0.6 light=1200 decay=9 damping=0.7 strike=0.85 release=5 volume=-2.5 width=0.5 | felt | gongs | Dark golden rings bent sharp, a short warm clang
Bars of the orrery | Glass plucks | petals=5 bend=120 heart=0.4 rings=4 light=3500 decay=5 damping=0.15 strike=1 release=6 stone=0.1 volume=6 reach=0.35 tilt=0.2 width=0.6 fold=0.3 | shimmered | answer | Five petals bent far sharp, small metal bars flickering
Iron stair rail | Glass plucks | petals=3 bend=120 heart=0.4 rings=4 light=3500 decay=12 damping=0.4 stone=0.6 fold=0.3 release=2 volume=-2 width=0.6 | tiled | peal | Three petals bent sharp on iron, grey and near
Tubes in the wind porch | Glass plucks | petals=6 bend=60 heart=0.5 rings=3 light=6000 decay=14 damping=0.25 release=10 turn=0.4 tilt=0.15 volume=3 width=0.6 | breathing | highBells | Long tubes of six sharpened petals that lean as they ring
Anvil in the next field | Glass plucks | petals=5 bend=-120 heart=0.35 rings=5 light=4000 decay=6 damping=0.26 fold=0.4 stone=0.4 release=2 volume=-1.5 width=0.5 | slap | answer | Five petals drawn far flat and folded, hit once, answered once
Triangle before the Amen | Glass plucks | petals=11 bend=100 heart=0.15 rings=2 light=5000 decay=10 damping=0.1 release=8 volume=2 width=0.6 | silver | drops | Eleven petals bent sharp, almost no heart, a thin ring of wire
Bowl on a folded cloth | Chime wheel | petals=3 heart=0.7 rings=3 light=2500 strike=0.8 decay=16 damping=0.5 release=12 turn=0.5 tilt=0.8 stone=0 volume=-1 width=0.7 | bare | toll | A heavy heart with three golden rings that come and go round it
Bowl touched at three | Chime wheel | petals=3 heart=0.5 rings=3 strike=0.45 attack=1 bloom=3 decay=30 light=1800 release=10 turn=0.55 tilt=1 volume=-4 reach=0.3 width=0.8 | bowls | lauds | A bowl touched softly, then left beating as its rings tip
Seven bowls of water | Chime wheel | petals=7 heart=0.5 rings=3 reach=0.4 light=4500 strike=0.9 decay=9 release=7 bend=14 volume=0 width=0.7 damping=0.15 | waters | answer | Seven golden petals, water-clear over a strong tone
Great bowl, felt mallet | Chime wheel | petals=4 heart=0.75 rings=4 light=900 strike=0.7 decay=28 damping=0.8 release=15 turn=0.45 tilt=0.2 fold=0.2 volume=0.5 width=0.4 | crypt | gongs | A great dim bowl, most of it heart, for half a minute
Bowl sung back to itself | Chime wheel | petals=5 heart=0.65 rings=4 light=3000 strike=0.6 decay=14 attack=0.8 breath=0.4 release=9 curl=0.5 turn=-0.4 volume=-6 width=0.7 | recall | toll | Five golden petals curled, with breath, struck and sustained
Celesta under glass | Chime wheel | petals=3 heart=0.45 rings=4 light=6500 strike=1 decay=4 damping=0.2 release=1.2 stone=0.25 volume=3.5 reach=0.4 turn=0.15 tilt=0.2 width=0.5 | tube | inCanon | Four golden rings round a clear heart, short as a celesta | keys
Toy piano, nave floor | Chime wheel | petals=6 heart=0.45 rings=3 light=4500 strike=1 decay=3.5 damping=0.26 release=0.6 stone=0.5 fold=0.2 volume=2.5 width=0.4 | evenNave | inCanon | Six golden petals, dry little tines | keys
Clock of twelve figures | Chime wheel | petals=12 heart=0.35 rings=3 light=6500 strike=0.95 decay=3 damping=0.3 release=2 volume=6 reach=0.4 width=0.6 stone=0.5 fold=0.4 turn=-0.3 | repeats | peal | Twelve golden petals, folded and exact, each one struck again behind
Glockenspiel in frost | Chime wheel | petals=5 heart=0.4 rings=3 reach=0.5 light=8000 strike=1 decay=7 damping=0.2 release=3 bend=15 volume=6 width=0.7 | frost | highBells | Five golden petals very bright, a little sharp, cold
Carillon, practice room | Chime wheel | petals=4 heart=0.4 rings=5 light=3500 strike=0.95 decay=6 damping=0.45 release=0.8 stone=0.4 volume=-3 tilt=0.2 width=0.5 | chamber | rolled | A keyboard of golden bells damped when the key comes up | keys
Wind chimes of slate | Broken panes | petals=5 bend=80 strike=1 decay=8 heart=0.4 rings=5 light=3500 breath=0.1 release=4 stone=0.5 volume=6 damping=0.29 tilt=0.1 width=0.5 | clouds | highBells | Sharp panes struck, a few of them dark in each, slate on a cord
Bottles in the plum tree | Broken panes | petals=3 bend=-45 strike=0.9 decay=9 heart=0.55 rings=4 light=3000 breath=0.4 release=5 turn=0.3 volume=1 damping=0.29 width=0.8 reach=0.4 | stars | peal | Flat panes of three with breath, each key lit differently
Shards in a sack | Broken panes | petals=8 bend=130 strike=1 decay=9 heart=0.2 rings=6 light=5000 release=1 fold=0.3 damping=0.2 volume=-2 tilt=0.1 width=0.7 | glassrain | drops | Eight petals far sharp, broken small, thrown about
Cattle on the far slope | Broken panes | petals=4 bend=50 strike=0.85 decay=8 heart=0.6 rings=4 light=1200 fold=0.4 stone=0.8 release=1 breath=0.2 volume=3 damping=0.15 width=0.8 | evenValley | answer | Dull sharpened odd panes in stone, near and then not
Bell tower in hail | Broken panes | petals=6 bend=25 strike=0.8 decay=12 heart=0.6 rings=7 light=5500 attack=0.8 release=8 turn=0.5 tilt=0.8 volume=1.5 width=0.8 | rain | peal | Six sharpened petals, many of their panes dark for a key at a time
Bells held to the light | Chime wheel | petals=3 strike=0.25 attack=1.2 bloom=2 decay=25 heart=0.5 rings=6 light=4000 release=10 turn=0.35 volume=-16 width=0.9 | summer | evening | A chord of golden bells swelling after a soft stroke | pad
Bronze at low tide | Bronze gong | petals=8 strike=0.4 attack=2 fold=0.4 curl=0.6 bend=110 decay=30 light=1800 release=10 bloom=4 turn=-0.2 volume=-1.5 width=0.8 | tide | lauds | Stretched golden rings of eight swelling in slowly, folded, softly struck | pad
Carillon of breath | Chime wheel | petals=6 strike=0.3 attack=0.8 decay=18 breath=0.85 heart=0.6 rings=5 light=2200 release=8 turn=0.5 volume=-6 order=Passing bloom=2.6 reach=0.3 tilt=0.8 width=0.8 | padfifth | evening | Bells with more breath than metal, a light going over what is left | pad
Halo of tin saints | Chime wheel | petals=10 strike=0.4 attack=1 bloom=1.5 decay=20 heart=0.6 rings=2 light=5500 release=9 order=Rim_first turn=0.4 volume=-3.5 width=0.95 | glimmer | evening | Ten golden petals from the rim inwards, very high, softly struck | pad
Bells under the floor | Chime wheel | petals=3 strike=0.35 attack=1.8 bloom=5 decay=30 heart=0.55 rings=5 light=1000 stone=0.7 release=12 order=Passing volume=-4 width=0.7 | lowshadow | nave | Dark golden rings in stone, a light moving out through them | pad
Buoy past the harbour | Chime wheel | petals=4 heart=0.5 rings=4 light=1100 strike=0.9 decay=7 damping=0.39 stone=0.5 bend=-35 turn=0.3 release=5 volume=1 width=0.5 | sinking | toll | A dark flat bell rocking on water
Pit bell, shift change | Chime wheel | petals=6 heart=0.3 rings=5 light=1700 strike=1 decay=5 fold=0.6 stone=0.7 damping=0.5 release=3 volume=5.5 width=0.4 | iron | toll | Six golden petals folded in stone, heavy and near
Lead coffin, one knock | Bronze gong | petals=7 heart=0.5 fold=0.3 curl=0.6 bend=-130 light=700 strike=1 decay=8 damping=0.8 stone=1 release=4 width=0.4 volume=6 | swarm | gongs | Seven golden petals far flat in full stone, a thud with a voice
Warm brick, small bell | Chime wheel | petals=5 heart=0.4 rings=5 light=1900 strike=0.85 decay=5 damping=0.3 stone=0.6 release=2.5 volume=5 reach=0.3 turn=0.15 tilt=0.2 width=0.3 fold=0.4 | warm | answer | A round folded bell in stone, small in the hand
Ship's hour in fog | Chime wheel | petals=3 heart=0.4 rings=5 light=1500 strike=0.8 decay=9 breath=0.5 fold=0.2 release=6 width=0.5 volume=3 | fogged | answer | A breathy golden bell with its edge gone
Crystal of seven | Chime wheel | petals=7 tracery=Pointed strike=1 decay=8 bend=35 heart=0.75 rings=3 reach=0.2 light=1300 release=6 volume=3 width=0.7 damping=0.15 | strings | peal | One ring of seven, bent sharp, over a plain struck tone
Ice in a tin cup | Chime wheel | petals=3 tracery=Pointed strike=0.95 decay=7 bend=40 heart=0.8 rings=3 reach=0.2 light=1000 release=1.5 stone=0.4 volume=0 damping=0.3 width=0.5 tilt=0.2 | tin | drops | A bent ring of three struck over a round heart, cold
Prayer wheel, gilded | Chime wheel | petals=8 heart=0.5 rings=3 light=4500 turn=0.75 tilt=0.8 strike=0.7 decay=15 attack=0.6 release=10 volume=2.5 width=0.45 bend=30 fold=0.3 stone=0.4 | circle | peal | Eight golden petals bent sharp, spinning fast enough to flutter
Planet rings | Chime wheel | petals=9 heart=0.5 rings=3 reach=0.5 light=5000 turn=-0.6 tilt=0.9 strike=0.8 decay=20 release=14 bend=-15 volume=-1.5 damping=0.15 width=0.95 | sparse | highBells | Nine golden petals a little flat, crossing for a great while
Gamelan of the lead shed | Bronze gong | petals=9 heart=0.35 fold=0.2 curl=0.2 bend=-80 light=3000 strike=0.9 decay=6 damping=0.2 stone=0.3 release=4 volume=3 tilt=0.2 rings=5 reach=0.4 width=0.6 | pair | peal | Nine golden petals drawn flat, a dull bronze row
`,
    },
    {
      id: 'petal-basses',
      name: 'Petal basses',
      category: 'bass',
      rows: `
Round stone bass | Petal bass | heart=0.75 fold=0.45 curl=0 light=1000 stone=1 strike=0.9 decay=5 release=0.9 turn=0.3 tilt=0.6 volume=6 width=0.2 | warm | walk | Struck round low notes in full stone, the folds heard behind
Folded velvet, low | Petal bass | heart=0.5 fold=1 curl=0.1 light=450 strike=0.4 attack=0.1 release=0.5 stone=0.15 volume=2.5 width=0.2 decay=3 | cloth | walk | Folded as far as it goes under very little light
Plum skin | Petal bass | heart=0.4 fold=0.3 curl=0.9 light=1300 strike=0.3 release=0.8 turn=0.55 tilt=0.7 volume=5.5 petals=7 rings=4 reach=0.3 width=0.5 stone=0.6 damping=0.2 attack=0.2 | glue | deepline | Seven curled petals in stone, colours going round under the skin
Bass with its hat on | Petal bass | petals=5 heart=0.55 fold=0.5 curl=0.2 light=1400 strike=0.8 decay=3.5 damping=0.8 stone=0.2 release=0.25 volume=4 width=0.25 | console | walk | Five folded petals struck short, the outer rings soaked up
Oxblood leather | Petal bass | petals=4 heart=0.4 fold=0.85 curl=0.4 light=700 strike=0.35 stone=0.9 release=0.6 width=0.1 volume=-4.5 decay=4 reach=0.4 | iron | - | Odd harmonics folded hard in stone, dense and near the centre
Odd bass in the aisle | Petal bass | petals=4 heart=0.7 fold=0.5 curl=0.1 strike=0.5 attack=0.12 light=900 release=0.6 rings=4 volume=6 tracery=Pointed reach=0.3 decay=6 damping=0.3 width=0.4 stone=0.5 turn=0.1 | short | walk | One odd ring standing over a struck heart, folded, hollow and firm
Square tower bass | Petal bass | petals=4 heart=0.2 fold=0.5 curl=0.7 strike=0.2 light=2600 rings=7 reach=0.7 attack=0.1 release=0.3 volume=3 damping=0.1 stone=0.4 width=0.4 tilt=0 turn=0.2 | hollow | - | Odd ranks curled and folded with little heart, bright for a bass
Pipe under the pavement | Petal bass | petals=6 heart=0.45 fold=0.2 strike=0 attack=0.25 light=900 stone=0.9 release=0.9 breath=0.5 volume=3 rings=5 reach=0.3 curl=0.3 width=0.15 bloom=2.5 damping=0.7 | pipe | deepline | Six dark petals in full stone, a wind moving through them
Dim square lamp | Petal bass | petals=4 heart=0.75 fold=0.4 curl=0.4 strike=0.15 attack=0.4 bloom=1.7 light=1600 release=1.2 turn=0.3 tilt=0.6 volume=6 order=Passing rings=4 width=0.5 reach=0.4 stone=0.1 | drift | deepline | Curled odd rings that a dim light goes over every two seconds
Bolted door hum | Petal bass | petals=7 heart=0.65 fold=0.55 strike=0.05 attack=0.15 light=2000 stone=0.5 release=0.5 rings=3 volume=6 reach=0.2 width=0.2 curl=0.2 damping=0.7 bloom=2.2 | combo | walk | Seven petals close above a low hum, a hole between them
Bare foundation | Petal bass | heart=1 fold=0 curl=0 rings=1 light=400 strike=0.2 attack=0.1 release=0.4 stone=0 volume=-1 | mono | walk | The heart alone and dark, nothing around it but the first ring
Sub in the choir stalls | Petal bass | heart=0.9 fold=0.15 rings=2 light=700 strike=0 attack=0.3 release=1 stone=0.2 width=0.1 volume=-2.5 | deep | deepline | Nearly a pure low tone with a trace of wood
Pulse under snow | Petal bass | heart=0.9 fold=0.2 curl=0.2 rings=2 light=500 strike=0.8 decay=4 release=0.3 damping=0.8 volume=5.5 width=0.1 | mono | - | A soft low thump, almost all heart, soon gone
Moon over a barge | Petal bass | heart=0.6 rings=5 light=1200 strike=0.1 attack=0.5 fold=0.3 release=2 turn=0.5 tilt=0.9 width=0.6 volume=1 reach=0.3 | under | walk | A round tone with near rings tipping slowly over it
Dew on the lead roof | Petal bass | petals=8 heart=0.5 rings=3 reach=0.5 light=5000 fold=0 curl=0 strike=0.3 decay=2 release=0.8 stone=0 volume=-0.5 width=0.5 damping=0.1 | halo | walk | A clear low tone with rings of eight a long way up
Growl behind the rood | Petal bass | petals=3 heart=0.3 fold=0.9 curl=1 light=1500 strike=0.3 attack=0.1 stone=0.6 release=0.3 turn=0.3 volume=1.5 width=0.4 rings=8 reach=0.4 damping=0.2 | firm | walk | Three petals curled and folded to the limit, growling as they turn
Cellar with a mouth | Petal bass | heart=0.4 fold=0.7 curl=1 light=800 strike=0.15 attack=0.2 stone=0.5 release=0.6 turn=0.4 volume=5 width=0.15 petals=5 tilt=0.4 damping=0.8 bloom=2.4 | roundO | deepline | Five petals curled as far as they go, a mouth below the stairs
Bear in the bell chamber | Petal bass | petals=3 heart=0.25 fold=0.9 curl=0.6 light=1800 strike=0.4 release=0.4 stone=0.3 turn=-0.4 tilt=0.5 volume=2.5 width=0.4 | triode | lowreed | Hardly any heart, folded and curled, rough at the edge
Yawning arch | Petal bass | petals=4 heart=0.5 fold=0.3 curl=0.7 light=1200 strike=0 attack=0.8 bloom=2.8 release=1.5 turn=0.4 volume=-1 width=0.4 reach=0.4 | bloomed | deepline | Odd curled rings that open wide and slowly close
Pitch and hemp | Petal bass | petals=6 heart=0.45 fold=0.8 curl=0.5 light=650 strike=0.5 decay=2 stone=0.2 release=0.5 volume=3 width=0.2 | drum | walk | Six petals folded and curled in the dark, sticky
Gut on a nave floor | Petal bass | petals=3 heart=0.5 fold=0.4 curl=0.2 light=2200 strike=1 decay=6 damping=0.39 release=0.3 volume=2 width=0.25 | evenChamber | walk | A struck bass of three with a clear edge, fingers on gut
Double bass in lead | Petal bass | petals=3 heart=0.6 fold=0.5 light=1300 strike=0.95 decay=6 damping=0.8 stone=0.5 release=0.5 rings=7 volume=6 width=0.15 | wood | walk | Seven rings plucked and quickly damped in a wooden body
Short fuse | Petal bass | petals=4 heart=0.45 fold=0.6 light=3000 strike=1 decay=4 damping=0.5 release=0.4 stone=0.6 volume=3 width=0.3 curl=0.6 bend=-20 | level | - | Odd folded plucks a little flat, bright for a moment
Steel guy rope | Petal bass | petals=5 heart=0.3 fold=0.5 curl=0.4 bend=8 light=2600 strike=1 decay=12 damping=0.35 release=0.8 volume=6 width=0.35 | spring | deepline | Five petals a shade sharp, a slack steel twang
Muted with a palm | Petal bass | petals=3 heart=0.75 fold=0.3 curl=0 light=900 strike=0.9 decay=4 damping=0.8 breath=0.25 release=0.2 stone=0.3 volume=6 width=0.1 | shade | - | A heavy heart, struck and soon stopped, a little skin noise
Tremor in the crypt | Broken panes | petals=3 heart=0.6 fold=0.5 light=800 attack=0.15 strike=0.3 release=0.6 stone=0.5 width=0.25 volume=6 decay=3 | under | walk | A folded low note lit and unlit under slow clouds
Loose cable | Broken panes | petals=4 heart=0.5 rings=7 fold=0.3 light=1800 strike=0.6 decay=4.5 release=0.4 breath=0.2 width=0.4 volume=-8.5 damping=0.29 reach=0.4 | grit 1.driveDb=15 | walk | Odd panes cutting in and out of a struck bass
Generator by the chapel | Broken panes | petals=5 heart=0.65 rings=4 light=600 attack=0.3 release=1 turn=0.6 tilt=0.8 stone=0.7 volume=6 width=0.3 reach=0.3 decay=2 | under | lowreed | A dark heart with five dim petals failing round it
Torn speaker cone | Broken panes | petals=3 heart=0.35 rings=9 fold=0.7 light=1400 strike=0.4 release=0.3 curl=0.3 stone=0.2 volume=-0.5 width=0.3 damping=0.2 attack=0.2 | glaze | walk | Folded panes of three breaking up through a low line
Cloud shadow on a field | Broken panes | petals=6 heart=0.6 rings=3 light=1200 attack=0.6 release=2.5 strike=0 breath=0.3 volume=5.5 width=0.4 reach=0.4 damping=0.2 | clouds | walk | A low plain tone with six petals coming through gaps
Mason's mallet | Stone knocks | petals=6 heart=0.55 fold=0.3 curl=0.4 bend=-25 light=1200 decay=9 release=1.2 volume=2 damping=0.6 width=0.2 | narrow | walk | Struck low in full stone, six petals a little flat
Coal down a chute | Stone knocks | petals=5 heart=0.4 fold=0.6 curl=0.8 bend=-60 light=900 decay=5 damping=0.5 release=0.6 volume=6 width=0.3 stone=0.6 rings=7 reach=0.3 | darkroom | - | Flat folded petals knocked loose, hardly any light on them
Footsteps overhead | Stone knocks | petals=3 heart=0.75 fold=0.2 curl=0.2 bend=0 light=700 decay=5 damping=0.5 breath=0.4 release=0.4 volume=6 width=0.1 | narrow | walk | Round stone thuds with a heart to them, somebody upstairs
Tuned well cover | Stone knocks | petals=4 heart=0.5 fold=0.5 curl=0.1 bend=30 light=2000 decay=7 damping=0.4 stone=0.8 release=1.5 volume=6 width=0.3 reach=0.4 | late | deepline | Odd sharpened rings on stone, long iron
Roof beam, bowed | Stone knocks | petals=3 heart=0.45 fold=0.7 curl=0.3 bend=0 strike=0.1 attack=0.4 light=1000 stone=1 release=1 volume=4.5 width=0.3 damping=0.8 | bowed | lowreed | Folded and held in full stone, no knock left
Bass bell, deep water | Chime wheel | petals=3 heart=0.75 rings=4 light=900 strike=0.8 decay=9 damping=0.6 release=4 turn=0.2 width=0.4 volume=2.5 | underW | gongs | A golden bell so low it is a bass, heavy in the heart
Chain over the capstan | Bronze gong | petals=5 heart=0.6 fold=0.4 curl=0.4 bend=40 light=1200 strike=0.9 decay=5 damping=0.7 release=2 volume=3.5 width=0.3 | iron | deepline | Golden rings bent sharp under a steady heart, link on link
Slow hammer, warm bronze | Bronze gong | petals=3 heart=0.8 fold=0.6 curl=0 bend=15 light=700 strike=0.75 decay=8 attack=0.3 release=3 stone=0.2 volume=2.5 width=0.4 | warm | gongs | A folded golden tone, dark, a slow mallet and a round fall
Gong under a blanket | Bronze gong | petals=6 heart=0.5 fold=0.3 curl=0.5 bend=-30 light=500 strike=0.85 decay=12 damping=0.5 release=5 volume=3.5 width=0.3 | blanket | gongs | Six golden petals drawn flat and covered
Tin roof bass | Chime wheel | petals=8 heart=0.5 rings=4 reach=0.3 light=2500 strike=1 decay=4.5 damping=0.26 fold=0.3 release=0.5 stone=0.4 volume=6 width=0.3 | tin | walk | Eight golden petals over a firm low heart, hard and short
Breath under the door | Three-petal flute | heart=0.6 breath=0.9 light=1300 attack=0.2 release=0.6 fold=0.3 strike=0.1 width=0.4 stone=0.3 volume=2.5 rings=4 damping=0.3 | short | walk | A low breathy tone, half air, close to the ground
Blown drain | Three-petal flute | petals=7 heart=0.5 breath=0.85 light=1200 fold=0.7 stone=0.9 attack=0.15 release=0.4 volume=6 width=0.2 damping=0.2 reach=0.5 | pipe | deepline | Seven petals of breath and folds in a stone tube
Elephant asleep | Three-petal flute | heart=0.6 breath=0.6 light=500 fold=0.6 curl=0.5 attack=0.7 release=1.5 turn=0.3 tilt=0.5 volume=2 width=0.4 bloom=3 damping=0.8 | breathed | lowreed | Dark curled air that rises and sinks
Hollow trunk, dry ditch | Three-petal flute | petals=3 heart=0.4 breath=0.4 light=1500 fold=0.7 curl=0.6 stone=0.6 attack=0.2 release=0.5 turn=0.4 rings=8 volume=1 width=0.3 bloom=1.5 damping=0.2 | bare | deepline | Folded and curled low breath, the colours circling
Chuff of the pump engine | Three-petal flute | heart=0.6 breath=1 light=1400 strike=0.5 decay=2.5 attack=0.1 release=0.5 stone=0.5 damping=0.52 volume=5 width=0.1 | pillow 1.output=9 | walk | Short low puffs, more air than note
Sixteen foot, soft | Night organ | petals=3 heart=0.5 rings=5 light=1100 attack=0.15 release=0.8 stone=0.3 fold=0.1 volume=-2 width=0.2 reach=0.2 damping=0.7 | warm | walk | A soft low stop of three petals, level from end to end | organ
Reeds under the swell | Night organ | petals=3 heart=0.35 rings=8 fold=0.5 light=1800 attack=0.12 release=0.5 turn=0.2 stone=0.4 volume=-1.5 width=0.6 damping=0.2 reach=0.5 | hall 1.mix=0.18 | lowreed | A folded pedal reed with every ring open | organ
Tide coming under | Still drone | petals=3 heart=0.6 fold=0.4 curl=0.3 light=700 attack=1.5 bloom=3 release=3 turn=0.3 width=0.5 volume=4 damping=0.8 | swaying | gongs | A low folded rise that takes a second and a half | pad
Basement strings | Still drone | petals=3 heart=0.35 fold=0.5 curl=0.1 light=1600 attack=0.7 bloom=2.4 release=1.2 turn=-0.3 tilt=0.6 rings=9 volume=-2 width=0.4 damping=0.2 | section | lowreed | Low bowed folds of three, crossing slowly | string
Smoke from wet peat | Still drone | petals=5 heart=0.5 fold=0.6 curl=0.7 light=450 attack=0.6 release=2.5 breath=0.35 turn=0.4 tilt=0.8 volume=6 bloom=3 width=0.5 damping=0.85 | wool | deepline | Five curled petals in the dark with breath over them
`,
    },
    {
      id: 'opening-keys',
      name: 'Opening keys',
      category: 'keys',
      rows: `
Keys in the rose's shade | Opening keys | petals=4 strike=0.4 decay=3 bloom=2 attack=0.5 light=1800 release=1.5 heart=0.55 stone=0.3 volume=3 width=0.6 damping=0.3 rings=5 reach=0.35 curl=0.4 | evenShort | nocturne | A soft stroke, and odd rings opening from the rim behind it
Hands at the sill | Opening keys | petals=6 strike=0.55 decay=7 bloom=1.5 attack=0.3 rings=4 light=5000 release=1 turn=0.3 volume=-2.5 damping=0.39 width=0.7 | bright | inCanon | Six petals struck clear, the edge of the window behind them
Third floor, west light | Opening keys | petals=3 strike=0.22 decay=4 bloom=4 attack=0.7 heart=0.55 light=3000 release=3 fold=0.35 volume=5.5 width=0.8 damping=0.75 curl=0.4 rings=6 reach=0.4 stone=0.6 turn=-0.4 | bed | nocturne | Folded three-petal keys whose rim stays on and slowly finds the note
Breakfast room | Opening keys | petals=6 strike=0.65 decay=2.5 bloom=1.8 heart=0.4 rings=4 light=4000 release=0.7 breath=0.2 damping=0.25 volume=2.5 reach=0.4 width=0.5 | bucket | nocturne | Six petals from the rim, friendly, a little breath on each stroke
Shutters half open | Opening keys | petals=5 strike=0.45 decay=5 bloom=8 attack=1.2 heart=0.5 light=1500 release=4 stone=0.5 tilt=0.8 volume=6 width=0.7 | thick | rolled | Dark struck keys, the rim of five petals arriving much later
Tines in a warm box | Glass plucks | petals=4 strike=0.75 decay=8 heart=0.55 rings=4 light=1800 damping=0.3 release=0.6 fold=0.25 attack=0.1 volume=0 reach=0.3 width=0.4 bend=8 | amptrem | nocturne | Odd tines round a full heart, part struck and part held
Electric keys, wet road | Glass plucks | petals=5 strike=0.7 decay=4 heart=0.65 rings=4 light=2000 damping=0.25 fold=0.7 release=0.5 attack=0.1 volume=0 width=0.6 | drift | rolled | Five petals that bark a little when folded by a hard touch
Cabinet at the station | Glass plucks | petals=3 strike=0.85 decay=5 heart=0.5 rings=5 light=2800 damping=0.6 turn=0.6 tilt=0.9 release=0.8 volume=-1 reach=0.4 width=0.8 fold=0.4 | whirl | nocturne | Round struck keys, three folded petals set whirling
Reeds of steel | Glass plucks | petals=3 strike=0.6 decay=2 heart=0.4 rings=6 light=2200 fold=0.6 attack=0.1 release=0.3 stone=0.25 volume=0.5 width=0.4 bloom=1.5 damping=0.3 | triode | inCanon | Folded keys with a bite at the front and a steady buzz behind
Bar piano, felt roof | Glass plucks | petals=5 strike=0.8 decay=6 heart=0.6 rings=8 light=1400 damping=0.7 fold=0.3 bend=5 release=0.6 stone=0.8 volume=0.5 width=0.5 reach=0.9 turn=0.1 | cassette | nocturne | Five dark petals a hair sharp, damped in stone, near and dusty
Lamp oil keys | Petal bass | petals=5 heart=0.5 fold=0.5 curl=0.5 light=1600 strike=0.7 decay=10 release=0.8 width=0.45 volume=1 damping=0.8 stone=0.1 | reel | nocturne | Folded and curled five-petal keys under a low yellow light
Ledger and ink | Petal bass | petals=4 heart=0.5 fold=0.35 curl=0.5 light=2200 strike=0.8 decay=4.5 release=0.4 stone=0.3 volume=0 width=0.4 | console | inCanon | Curled odd keys, short and woody, each note a little different
Upright by the pantry | Petal bass | petals=3 heart=0.55 fold=0.3 curl=0.1 light=2600 strike=0.9 decay=14 damping=0.35 stone=0.7 release=0.5 rings=8 width=0.5 volume=-2.5 bend=3 reach=0.8 | parlour | nocturne | Eight rings struck in a stone frame, a plain piano of a kind
Coal scuttle keys | Petal bass | petals=6 heart=0.5 fold=0.7 curl=0.4 light=1000 strike=0.75 decay=2.5 release=0.4 stone=0.6 volume=1 width=0.5 | blanket | rolled | Six petals folded and curled, dull short keys
Clerk's abacus | Stone knocks | petals=8 heart=0.4 rings=4 fold=0.2 curl=0.2 bend=0 light=4000 decay=4.5 release=0.6 stone=0.7 reach=0.3 width=0.4 damping=0.4 | level | ostinato | Eight petals knocked in stone, tidy and dry
Percussive stop | Night organ | petals=3 strike=0.5 decay=1 heart=0.5 rings=5 light=2400 attack=0.1 release=0.3 fold=0.1 turn=0.1 volume=-4 width=0.4 bloom=1.5 reach=0.3 | chorale | rolled | A click of three petals at the front of a plain held organ tone | organ
Chapel combo | Night organ | petals=3 strike=0.35 decay=1.2 heart=0.5 rings=7 light=2800 turn=0.65 tilt=0.6 release=0.3 stone=0.2 volume=-3.5 width=0.9 reach=0.8 | whirl | chorale | Three petals with most of their rings, a small percussion and quick rocking | organ
Two ranks and a knock | Night organ | petals=6 strike=0.6 decay=1 heart=0.4 rings=3 light=3500 stone=0.7 release=0.4 fold=0.2 volume=3 width=0.4 | chamber | inCanon | Six petals held behind a stone knock, short releases
Positive, one hand | Night organ | petals=5 strike=0.25 decay=1.5 heart=0.45 rings=4 reach=0.8 light=4500 release=0.3 turn=0 breath=0.15 volume=3 width=0.5 | cathedral 1.mix=0.16 | inCanon | Bright still pipes of five with a chiff | organ
Reed stop, left hand | Night organ | petals=3 strike=0.2 heart=0.3 rings=8 fold=0.55 curl=0.2 light=1600 attack=0.1 release=0.3 stone=0.4 volume=-4.5 width=0.4 damping=0.8 decay=1.5 | drum | nocturne | Folded reeds with every ring open, dark and quick | organ
Felt over slate | Opening keys | petals=4 order=Heart_first strike=0.5 decay=3 damping=0.5 heart=0.5 rings=4 light=2000 release=0.8 breath=0.3 attack=0.2 volume=-5.5 width=0.5 reach=0.2 | felt | nocturne | A soft touch on a round odd tone, breath like cloth
Nursery at nine | Opening keys | petals=6 order=Heart_first strike=0.7 decay=4 damping=0.15 heart=0.45 rings=3 light=3000 release=1 breath=0.1 volume=0 width=0.4 reach=0.2 bend=-20 | wood | inCanon | Six petals a shade flat over a round heart, small as a toy
Cotton mallets | Opening keys | petals=3 order=Rim_first strike=0.5 decay=2 damping=0.6 heart=0.55 rings=5 light=1500 attack=0.4 bloom=2.4 release=1.5 volume=6 reach=0.2 width=0.6 | under | nocturne | A soft stroke and the rim of it left behind, low and slow
Through the party wall | Opening keys | petals=3 order=Heart_first strike=0.65 decay=3 light=900 heart=0.45 fold=0.3 stone=0.6 release=0.6 volume=-4.5 width=0.2 rings=6 reach=0.3 | hallway | nocturne | Dark folded keys in stone, somebody else's evening
Snowed in, upright | Opening keys | petals=3 order=Heart_first strike=0.8 decay=8 damping=0.8 light=1200 heart=0.65 rings=6 release=1.2 stone=0.35 turn=0.1 volume=-3.5 width=0.4 | veil | rolled | Damped three-petal keys, round, snow on the strings
Stroke and slow dawn | Opening keys | petals=3 order=Heart_first strike=0.35 decay=2 bloom=4 attack=1 rings=9 reach=0.9 light=4500 release=4 heart=0.4 width=0.7 volume=-6 | summer | rolled | A short stroke, then nine rings opening one after another
Ferns uncurling | Opening keys | petals=7 order=Heart_first strike=0.4 decay=3 bloom=3 attack=0.6 curl=0.7 light=2400 release=2.5 turn=0.35 volume=2 width=0.8 stone=0.6 fold=0.5 reach=0.2 heart=0.6 rings=5 | unfold | nocturne | Curled petals that open after the stroke and go on changing
Lid raised by degrees | Opening keys | petals=6 order=Heart_first strike=0.3 decay=4 bloom=6 attack=0.5 light=1800 release=3 fold=0.4 stone=0.4 heart=0.6 volume=-4.5 width=0.5 | bloomed | rolled | Six folded petals darkly struck, coming up for six seconds
Grace note garden | Opening keys | petals=4 order=Heart_first strike=0.55 decay=3.5 bloom=2 attack=0.8 light=3500 release=2 breath=0.4 heart=0.45 volume=0 damping=0.39 width=0.2 tilt=0.2 | pebble 2.mix=0.14 | drops | A quick odd stroke and a breathy swell out of it
After the lid is shut | Opening keys | petals=6 order=Rim_first strike=0.5 decay=1.2 bloom=4 attack=1.5 rings=4 light=3000 release=7 heart=0.45 volume=-1 reach=0.4 width=0.7 damping=0.2 | tails | nocturne | The stroke goes at once and the rim of six petals stays for long
Lamps lit down the lane | Passing light | petals=3 strike=0.6 decay=4.5 attack=0.4 bloom=1.5 light=3000 release=1.5 heart=0.5 rings=7 stone=0.2 volume=-2.5 damping=0.29 width=0.6 | evenShort | nocturne | Struck keys, a ring of light going out through every note
Trains past a window | Passing light | petals=5 strike=0.5 decay=3 attack=0.3 bloom=1.7 light=4500 release=2 heart=0.4 fold=0.3 volume=3 width=0.9 | dotted | rolled | Five folded petals struck, light crossing them every two seconds
Beacon keys | Passing light | petals=5 strike=0.7 decay=8 attack=0.5 bloom=2 light=3500 release=3 heart=0.5 rings=4 volume=3 tracery=Golden_bells reach=0.3 width=0.7 | late | answer | A round golden stroke of five, then a slow beam in what is left
Carousel after hours | Passing light | petals=4 strike=0.4 decay=1.5 attack=0.2 bloom=1.5 light=2200 release=0.8 heart=0.45 turn=0.55 tilt=0.8 curl=0.3 volume=-1 width=0.8 | flock | inCanon | Odd curled keys going round twice, by light and by turn
Draught through a score | Passing light | petals=6 strike=0.65 decay=2.5 attack=0.6 bloom=2.4 light=1700 release=2 breath=0.5 heart=0.5 volume=5 width=0.6 damping=0.75 | mirror | nocturne | Breathy dark keys, a page of light over each
Gilt celesta | Chime wheel | petals=6 strike=0.95 decay=4 heart=0.4 rings=3 light=3600 damping=0.3 release=0.5 stone=0.6 volume=1 reach=0.3 bend=18 fold=0.4 width=0.4 turn=0.2 tilt=0.3 | chamber | inCanon | Six golden petals, folded, stopped by the key, in a gilt box
Bell keys, snow roof | Chime wheel | petals=5 strike=0.7 decay=8 heart=0.7 rings=3 light=2200 attack=0.2 release=2 turn=0.4 volume=1 width=0.6 damping=0.6 | embers | nocturne | Golden keys struck soft, some of the tone held behind and dying
Antique steel | Chime wheel | petals=7 strike=0.9 decay=5 heart=0.55 rings=2 light=5000 fold=0.2 release=0.8 bend=-10 volume=1 width=0.5 | vinyl | inCanon | Seven flat golden petals, thin steel, old surface
Bowls on a shelf of keys | Chime wheel | petals=4 strike=0.8 decay=12 heart=0.6 rings=4 light=2200 release=4 turn=0.5 tilt=0.7 volume=-4.5 reach=0.3 width=0.6 | sympathy | nocturne | Heavy-hearted golden keys that ring and turn
Dulcimer loft | Chime wheel | petals=3 tracery=Smooth strike=0.95 decay=8 heart=0.35 rings=8 light=4500 bend=4 release=2 stone=0.3 damping=0.26 volume=-1 width=0.7 | ringing | ostinato | Three petals a hair sharp, hammered under the rafters
Inkwell | Hollow reed | strike=0.75 decay=4.5 heart=0.4 fold=0.55 light=1400 release=0.4 attack=0.1 curl=0.3 stone=0.3 rings=6 breath=0.1 volume=5.5 width=0.25 | swirl | inCanon | Dark odd keys, folded and curled, round and close
Nimble left hand | Hollow reed | strike=0.85 decay=2 heart=0.35 fold=0.7 light=2200 release=0.2 rings=4 stone=0.6 breath=0.1 damping=0.3 volume=2 petals=6 curl=0.5 width=0.2 bend=10 reach=0.4 | front | ostinato | Six petals folded and curled, a short nasal key gone at the release
Wire-strung bureau | Hollow reed | petals=3 strike=0.95 decay=6 heart=0.25 fold=0.4 light=5000 release=0.3 rings=9 reach=0.9 curl=0.2 breath=0 volume=1.5 damping=0.29 width=0.6 | comb | rolled | Nine bright wires, folded, quick to stop
Cough drops | Hollow reed | petals=5 strike=0.9 decay=2.5 heart=0.6 fold=0.8 light=2000 release=0.3 curl=0.6 stone=0.5 breath=0.3 volume=0 width=0.3 | clay | ostinato | Five petals folded and curled into round short syllables
Rubber and brass | Hollow reed | petals=4 strike=0.6 decay=2.5 heart=0.3 fold=0.9 light=1800 release=0.6 bend=-15 turn=0.3 rings=7 volume=1.5 width=0.5 | throb | rolled | Odd keys folded nearly full, flat in the rings
Dusty sampler keys | Broken panes | petals=4 strike=0.8 decay=4 heart=0.5 rings=6 light=2400 release=0.6 attack=0.2 breath=0.1 stone=0 volume=3 reach=0.5 bend=-8 width=0.6 fold=0.4 | glaze | nocturne | Odd keys with a pane missing here and there
Moths at the keyboard | Broken panes | petals=5 strike=0.4 decay=4.5 heart=0.6 rings=4 light=1100 attack=0.4 release=1.5 breath=0.6 turn=0.3 volume=-2 damping=0.2 order=Rim_first bloom=2 width=0.7 reach=0.4 | dust | inCanon | Five broken petals half struck, their rims fluttering behind the note
Keys with rust on them | Broken panes | petals=3 strike=0.7 decay=5 heart=0.5 fold=0.4 light=800 release=0.8 bend=32 stone=0.5 volume=-1.5 damping=0.29 width=0.3 | worn | nocturne | Dark sharpened panes, folded, gone brown with use
Letters never posted | Broken panes | petals=8 strike=0.5 decay=8 heart=0.65 rings=3 light=1500 attack=0.8 release=3 order=Rim_first bloom=2 volume=3.5 damping=0.29 width=0.75 reach=0.4 | recall | nocturne | A round heart and panes of eight, the rim first, half remembered
Half the hammers gone | Broken panes | petals=5 strike=0.95 decay=5 heart=0.4 rings=7 light=2400 release=0.5 stone=0.6 damping=0.39 breath=0.1 volume=-3 width=0.5 | box | rolled | Five struck panes, some of every chord not there
`,
    },
    {
      id: 'still-drones',
      name: 'Still drones',
      category: 'drone',
      rows: `
Pillar drone | Still drone | petals=3 heart=0.5 rings=6 light=1200 stone=0.9 fold=0.4 curl=0.2 attack=0.9 bloom=10 release=6 volume=-2 tilt=0.2 width=0.5 damping=0.7 | crypt | ison | Three still petals folded in full stone, weight without movement
Slab, unpolished | Still drone | petals=3 heart=0.3 rings=9 fold=0.85 curl=0.1 light=1800 stone=0.5 attack=1.5 bloom=4 release=4 tilt=0.1 volume=-5 width=0.8 damping=0.2 | bare | - | Nine rings folded hard and standing still, grain and all
Quarry at dusk | Still drone | petals=5 heart=0.4 rings=6 fold=0.6 curl=0.7 light=900 stone=1 attack=0.8 bloom=6 release=7 volume=-4 width=0.7 damping=0.9 | cave | ison | Five still petals folded and curled in full stone, low light
Plinth | Still drone | petals=9 heart=0.5 rings=3 fold=0.6 curl=0.5 light=2000 stone=0.7 attack=1 bloom=3 release=3 tilt=0.3 width=0.5 volume=3.5 reach=0.4 bend=-8 | short | - | Nine petals folded and curled, tipped and held there, square and sure
Millstone at rest | Still drone | petals=4 heart=0.45 rings=7 fold=0.5 curl=0.3 light=700 stone=0.85 attack=0.9 bloom=12 release=8 width=0.3 volume=-7.5 reach=0.3 damping=0.8 | iron | gongs | Odd folded rings, dark, hardly wider than one stone
Hollow of the bell | Still drone | petals=4 heart=0.35 rings=8 reach=0.9 fold=0.15 curl=0.5 light=2600 stone=0.4 attack=0.8 release=5 volume=-3.5 bloom=5 damping=0.1 | hall | ison | Odd rings curled and still, hollow all the way up
Empty cistern hum | Still drone | petals=4 heart=0.6 rings=5 fold=0.2 curl=0.1 light=800 stone=0.6 attack=0.8 release=6 breath=0.3 volume=-4.5 reach=0.2 width=0.4 bloom=9 order=Heart_first | shell | lauds | Odd rings gathering slowly over their own low note, with a little breath
Square of light, still | Still drone | petals=8 heart=0.5 rings=4 reach=0.8 fold=0.1 curl=0 light=5000 stone=0 attack=2.8 bloom=7 release=6 damping=0.1 width=1 | space | evening | Eight still petals, clear and unfolded
Windowless wall | Still drone | petals=5 heart=0.35 rings=5 fold=0.8 curl=0.7 light=1800 stone=0.6 attack=1.4 bloom=16 release=5 damping=0.6 volume=0.5 reach=0.3 width=0.2 | darkhall | gongs | Five petals folded and curled close to the wall, nothing let in
Corridor of one colour | Still drone | petals=8 heart=0.35 rings=3 fold=0.25 curl=0.8 light=2600 stone=0.55 attack=0.8 release=6 tilt=0.2 bloom=5 volume=-6.5 reach=0.3 width=0.8 damping=0.2 | tunnel | quartal | Eight petals curled far and held, a single glassy vowel
Light on the long wall | Passing light | petals=3 bloom=3 attack=0.8 light=2400 heart=0.45 rings=9 turn=0 release=6 stone=0.4 volume=5 width=0.8 damping=0.2 decay=15 | notch | ison | One ring of light climbing nine rings of three every four seconds
Lighthouse keeper's hour | Passing light | petals=6 bloom=2.4 attack=1 light=5000 heart=0.3 rings=6 turn=0 tilt=0 release=5 fold=0.3 volume=1 width=0.9 damping=0.6 decay=8 | shore | lauds | Six folded petals, the beam round in three seconds and more
Planets crossing | Passing light | petals=9 bloom=5 attack=3.5 light=6500 heart=0.6 rings=4 turn=0.1 release=8 volume=-2 tracery=Golden_bells decay=30 width=0.9 | lifted | evening | Nine golden petals over a steady heart, a light seven seconds on the way out
Ember passed by hand | Passing light | petals=5 bloom=1.5 attack=0.5 light=1000 heart=0.65 rings=6 fold=0.5 curl=0.2 turn=0 stone=0.6 release=4 volume=5.5 width=0.6 damping=0.85 decay=10 | wool | gongs | A dim glow going round and round through five folded petals
Breathing of the wall | Passing light | petals=4 bloom=2.8 attack=2 light=1600 heart=0.65 rings=5 breath=0.5 turn=0.15 release=6 volume=5.5 damping=0.7 width=0.8 decay=15 | breathed | lauds | Odd rings with air in them, brightening and dimming
Hum of one lamp | Night organ | petals=3 heart=0.95 rings=2 light=900 stone=0.2 attack=0.8 release=5 turn=0 breath=0.05 volume=-1 width=0.3 | bare | ison | Very nearly a pure tone, two faint rings, quite still
Ground for a singer | Night organ | petals=6 heart=0.5 rings=5 light=2400 fold=0.4 attack=0.7 release=3 turn=0 tilt=0.2 stone=0.7 volume=-2 reach=0.2 bloom=6 damping=0.2 width=0.4 | chamber | ison | A plain even drone of six petals in stone to sing over
Bare fifth at noon | Night organ | petals=6 heart=0.45 rings=3 light=4000 attack=0.8 release=3 turn=0 stone=0 reach=0.9 volume=-6 width=0.6 bloom=4 damping=0.1 tilt=0.1 | above | - | Six clear petals over a low fifth, nothing hidden
Low pedal, long winter | Night organ | petals=3 heart=0.6 rings=6 light=1100 fold=0.35 attack=3.5 release=8 turn=-0.3 tilt=0.4 stone=0.5 volume=-5 reach=0.15 width=0.5 bloom=20 damping=0.4 | under | evening | A pedal that takes three seconds to arrive and longer to open
Stone and one voice | Night organ | petals=5 heart=0.6 rings=5 light=1400 stone=1 curl=0.4 attack=0.7 release=4 turn=0.05 breath=0.2 volume=-4.5 reach=0.2 bloom=5 damping=0.2 | mono | ison | A strong heart in full stone with a curl of colour
Sun at its height | Still drone | petals=3 heart=0.4 rings=9 reach=0.9 light=2400 stone=0 fold=0.1 curl=0 attack=1.5 bloom=2 release=5 damping=0.1 volume=-16.5 width=0.95 | summer | lauds | Nine rings of three all open, a whole wall of partials
Copper wire hum | Still drone | petals=4 heart=0.05 rings=9 reach=1 light=5500 stone=0.1 fold=0.3 curl=0.15 attack=0.6 bloom=3 release=3 volume=-4.5 width=0.8 | tamed | ison | Odd wires with hardly a heart, even and thin
White nave | Still drone | petals=6 heart=0.3 rings=7 reach=0.9 light=4000 stone=0.3 fold=0.2 attack=3.5 bloom=4 release=7 order=Heart_first curl=0 volume=-7.5 width=0.9 | brightair | evening | Six petals, pale and tall, three seconds and more in coming
Twenty panes let in | Still drone | petals=3 heart=0.5 rings=9 reach=0.8 light=5000 stone=0 fold=0 curl=0 attack=2.5 bloom=18 release=6 tilt=0 volume=-8 damping=0.1 order=Heart_first width=0.95 | frozen | evening | Rings of three let in one after another, a quarter of a minute to the last of them
Salt flat | Still drone | petals=6 heart=0.65 rings=3 reach=0.3 light=1500 stone=0.2 fold=0.15 curl=0.1 attack=0.5 release=6 bend=5 volume=2 tracery=Pointed width=0.9 damping=0.7 | thinair | quartal | Six petals, one ring of them standing far out, wide and pale
Wind in the bell louvres | Still drone | petals=3 heart=0.5 breath=0.85 light=2200 fold=0.2 curl=0.2 attack=0.8 bloom=4 release=5 turn=0.1 volume=-4.5 width=0.8 damping=0.7 | clouds | ison | A drone of breath on three petals with a thin note inside
Sand against glass | Still drone | petals=7 heart=0.3 breath=0.95 light=6000 fold=0 curl=0 attack=1 release=4 stone=0.1 rings=5 volume=-7.5 bloom=4 width=0.9 damping=0.2 | dust | lauds | Bright breath on seven petals, close to noise
Fog bank horn | Still drone | petals=4 heart=0.55 breath=0.6 light=700 fold=0.5 curl=0.1 attack=0.7 release=5 stone=0.5 volume=-1.5 width=0.4 reach=0.4 bloom=6 | distant | walk | A low breathy odd tone from somewhere out there
Bellows left running | Still drone | petals=5 heart=0.4 breath=0.7 light=1500 fold=0.7 curl=0.3 attack=0.8 release=2 stone=0.7 rings=8 volume=-1.5 width=0.6 bloom=3 damping=0.2 | parlour | ison | Folded reeds with more wind than they need
Cold air, warm stone | Still drone | petals=6 heart=0.9 breath=0.75 light=2400 fold=0.3 curl=0.1 attack=1 release=6 stone=0.6 volume=-5 order=Rim_first bloom=2 rings=4 reach=0.15 width=0.6 damping=0.2 | oo | lauds | Air first and then a round tone in stone, the one about the other
Great gong, held | Bronze gong | petals=3 strike=0.5 attack=1.5 bloom=3 decay=30 bend=60 fold=0.4 curl=0.3 light=1600 release=8 turn=0 volume=-1.5 width=0.8 | glacial | gongs | Stretched golden rings touched and then held as long as bronze holds
Temple air | Chime wheel | petals=5 strike=0.3 attack=0.9 decay=30 heart=0.6 rings=4 light=2800 turn=0.1 tilt=0.3 release=9 bloom=3 volume=-3 width=0.7 | bowls | ison | A golden rose softly touched, hovering between bell and drone
Copper roof in heat | Still drone | petals=3 bend=70 heart=0.45 rings=5 fold=0.3 curl=0.2 light=2600 stone=0.3 attack=1.5 bloom=2 release=5 volume=-1.5 tracery=Golden_bells decay=30 width=0.8 damping=0.2 | comb | lauds | Three golden petals, rings far sharp, shimmering as metal does
Bent lead rod | Still drone | petals=6 bend=-100 heart=0.65 rings=4 fold=0.4 curl=0 light=1100 stone=0.6 attack=1.2 release=6 volume=0 width=0.5 bloom=7 damping=0.75 | swarm | gongs | Six petals drawn far flat under a sure low tone
Tuning of the planets | Still drone | petals=8 bend=25 heart=0.4 rings=4 fold=0.1 curl=0.3 light=4500 stone=0 attack=3 release=8 turn=-0.15 tilt=0.5 volume=-11 width=0.9 bloom=4 | sinking | evening | Eight sharpened petals crossing so gradually that chords never settle
Sun through lead clouds | Broken panes | petals=3 heart=0.6 rings=7 light=1700 attack=0.8 release=6 stone=0.5 turn=0 fold=0.3 volume=0.5 width=0.8 bloom=5 damping=0.7 decay=8 | under | ison | A drone of three with panes going dark and coming back
Interrupted ground | Broken panes | petals=4 heart=0.65 rings=6 light=1000 attack=1 release=4 turn=0.1 stone=0.3 breath=0.1 volume=5.5 width=0.5 reach=0.3 decay=10 | warm | gongs | A low odd drone with dim panes cut out of it
Fire behind a grate | Broken panes | petals=5 heart=0.35 rings=8 fold=0.6 light=2400 attack=0.8 release=3 breath=0.4 stone=0.3 volume=-3.5 width=0.6 bloom=2.5 damping=0.2 decay=15 | glow | ison | Folded panes of five flickering low and red
Aurora wall | Broken panes | petals=7 heart=0.5 rings=4 light=2600 attack=2 release=9 turn=0.3 tilt=0.7 order=Passing bloom=2.5 volume=6 reach=0.5 width=1 decay=8 | wash | evening | Seven panes lit by turns with a light passing through
Rooms in other houses | Broken panes | petals=6 heart=0.7 rings=5 light=2800 attack=0.8 release=6 turn=-0.3 stone=0.8 bend=-12 volume=-4.5 width=0.6 bloom=4 decay=10 | hallway | lauds | Six flat panes in stone, lamps being put out and lit
Pedal thirty-two | Night organ | petals=3 heart=0.35 rings=8 light=700 fold=0.6 stone=0.4 attack=0.5 release=2 turn=0.1 volume=1 width=0.5 reach=0.4 bloom=4 damping=0.2 | nave 1.mix=0.22 | walk | A low broad stop of three, folded a little, from the far wall | organ
Hurdy-gurdy of glass | Night organ | petals=3 heart=0.25 rings=9 reach=0.8 fold=0.45 curl=0.3 light=3500 attack=0.3 release=0.8 turn=0.2 stone=0.2 volume=-3 width=0.7 damping=0.1 | openfifth | ison | Folded, curled courses of three, a wheel that never stops
Organ with a stone lung | Night organ | petals=4 heart=0.5 rings=6 fold=0.4 stone=1 light=2000 attack=0.6 release=1.5 breath=0.45 turn=0 volume=-0.5 width=0.4 damping=0.7 | flutes | ison | Odd pipes wholly in stone, with wind | organ
Mixture stop, left on | Night organ | petals=4 heart=0.6 rings=3 reach=0.4 fold=0.15 light=2200 attack=0.2 release=1.2 turn=0.1 stone=0.15 tracery=Pointed width=0.7 volume=-3 | cathedral | lauds | Four petals, one upper ring set out against the note | organ
Shruti at the hearth | Night organ | petals=5 heart=0.4 rings=6 fold=0.6 curl=0.1 light=1400 attack=0.7 release=1.5 breath=0.3 turn=0.3 tilt=0.4 stone=0.4 volume=-2.5 width=0.5 damping=0.75 bloom=2.5 | closet | ison | Five folded petals with bellows air, warm and near
Slow vowel ground | Whirling choir | petals=3 turn=0.3 tilt=0.5 curl=0.9 fold=0.1 light=1600 breath=0.1 attack=0.8 release=5 stone=0.5 volume=-4 width=0.6 bloom=4 | vowel | ison | Three petals curled far, changing with each slow turn
Ground note of the gorge | Whirling choir | petals=4 turn=0.05 curl=0.6 fold=0.5 light=1000 breath=0.3 attack=1.3 release=6 stone=0.9 heart=0.5 volume=-2 tilt=0.2 width=0.4 bloom=5 damping=0.7 | monks | gongs | Odd, folded and curled in stone, a deep sung ground
Rungs of one tone | Whirling choir | petals=5 turn=0.2 tilt=0.1 curl=1 fold=0.2 light=2600 breath=0.05 attack=0.7 release=4 heart=0.55 stone=0.2 volume=-3 width=0.5 bloom=3 damping=0.2 | whistle | ison | Five petals curled as far as they go, a tune picked out above
Monks behind glass | Whirling choir | petals=3 turn=-0.12 curl=0.5 fold=0.7 light=700 breath=0.2 attack=1 release=4 stone=0.7 heart=0.35 volume=-3.5 width=0.5 bloom=2.6 | fogged | psalm | Folded dark throats of three, words lost
Choirless choir loft | Whirling choir | petals=6 turn=0.08 curl=0.75 fold=0.35 light=3500 breath=0.4 attack=1.8 release=6 stone=0.3 heart=0.25 volume=-6.5 width=0.9 bloom=4 damping=0.2 | ah | evening | Six petals curled and bright, voices where there are none
`,
    },
    {
      id: 'whirling-choirs',
      name: 'Whirling choirs',
      category: 'voice',
      rows: `
Round dance of voices | Whirling choir | petals=4 turn=-0.75 tilt=0.9 attack=0.5 light=1600 stone=0.5 breath=0.35 release=1.5 volume=-5 bloom=2.2 width=1 rings=7 curl=0.6 fold=0.1 heart=0.55 reach=0.4 | octave | psalm | Four petals whirling against each other, a choir in a ring
Dervishes at noon | Whirling choir | petals=3 turn=-0.95 tilt=1 attack=0.6 light=3500 stone=0.3 breath=0.2 rings=7 release=1 heart=0.3 volume=-4.5 width=1 damping=0.1 | circle | psalm | Rings of three flung round as fast as they go, bright
Wheel in the back room | Whirling choir | petals=4 turn=0.85 tilt=0.8 attack=0.3 light=1800 stone=0.6 breath=0.4 curl=0.5 release=1 heart=0.55 volume=-2.5 width=0.5 bloom=2.4 damping=0.7 | chamber | suspended | Odd curled voices all turning one way, quick and even
Maypole, seen from above | Whirling choir | petals=8 turn=-0.75 tilt=0.7 attack=0.6 light=3600 stone=0.2 breath=0.3 fold=0.1 release=3 heart=0.5 volume=-12 order=Rim_first reach=0.4 bloom=2 width=0.9 rings=4 | flock | evening | Eight clear petals crossing from the rim, each key at its own pace
Wind takes the hymn | Whirling choir | petals=8 turn=-0.85 tilt=1 attack=0.8 light=3000 stone=0.4 breath=0.7 rings=3 release=2.5 volume=-5.5 bloom=2.5 damping=0.2 | shore | psalm | Eight breathy petals whirled away as they are sung
Humming past the screen | Whirling choir | petals=3 turn=-0.3 curl=0.5 light=700 stone=0.8 breath=0.15 heart=0.65 attack=0.8 release=2 fold=0.2 volume=-3 width=0.5 damping=0.9 bloom=2.4 | warm | psalm | Dark curled voices with closed lips, full of stone
Lullaby with no words | Whirling choir | petals=4 turn=0.25 curl=0.3 light=900 stone=0.6 breath=0.35 heart=0.65 attack=0.6 release=1.5 tilt=0.4 volume=-0.5 width=0.4 rings=4 reach=0.2 bloom=2.2 damping=0.7 | closet | suspended | A round heart and odd rings, hummed at the bedside
Nuns on the back stairs | Whirling choir | petals=5 turn=-0.4 curl=0.6 light=1200 stone=0.9 breath=0.2 heart=0.5 attack=0.4 release=1.2 fold=0.1 volume=-2 width=0.4 bloom=2.2 reach=0.4 | across | psalm | Five curled petals in full stone, through a door
Bees in the choir | Whirling choir | petals=3 turn=-0.55 tilt=0.6 curl=0.4 fold=0.7 light=1000 stone=0.5 breath=0.1 heart=0.4 attack=0.9 release=2 rings=8 volume=-9 width=0.8 bloom=2.5 | blanket | evening | Folded hums of three, buzzing under cloth
Sleep in the pews | Whirling choir | petals=6 turn=0.2 tilt=0.5 light=800 stone=0.4 breath=0.5 heart=0.6 attack=1.5 release=4 curl=0.2 volume=-2 reach=0.2 rings=5 width=0.6 bloom=4 damping=0.85 | breathed | nave | Low-lit voices with a plain tone inside
Trebles at the rail | Whirling choir | petals=3 turn=-0.35 tilt=0.4 heart=0.6 rings=4 light=3500 stone=0.3 breath=0.3 attack=0.3 release=1.5 curl=0.1 volume=-2.5 width=0.7 reach=0.3 bloom=2.2 damping=0.2 | airhall | highChoir | Clear young voices, three near rings over a strong heart
Highest gallery | Whirling choir | petals=4 turn=-0.5 tilt=0.6 heart=0.7 rings=3 light=1500 stone=0.1 breath=0.2 attack=0.7 release=3 curl=0 fold=0 volume=0 tracery=Pointed width=0.9 bloom=2.6 reach=0.4 damping=0.1 | drifted | highChoir | Four petals, one ring of them thin and high over the note
Choir on white ground | Whirling choir | petals=8 turn=0.3 heart=0.5 rings=3 light=5000 stone=0.2 breath=0.6 attack=1 release=4 volume=-3.5 reach=0.4 bloom=3 width=0.9 damping=0.15 | frost | highChoir | Eight petals, two rings and a cloud of breath
Angels with sore throats | Whirling choir | petals=5 turn=-0.45 heart=0.4 rings=5 fold=0.5 curl=0.3 light=2600 stone=0.5 breath=0.55 attack=0.5 release=2 volume=-7 bloom=2.2 width=0.7 | grit | highChoir | Five folded breathy petals, high and a little hoarse
One treble late | Whirling choir | petals=6 turn=0.3 tilt=0.7 heart=0.65 rings=4 light=1700 breath=0.25 stone=0.8 attack=0.2 release=1 bloom=2.5 volume=6 reach=0.2 tracery=Pointed fold=0.5 width=0.25 damping=0.2 | singer | answer | A plain voice with one near ring of six folded round it
Prayers under the breath | Whirling choir | breath=0.9 petals=7 turn=-0.6 heart=0.45 light=2600 stone=0.7 curl=0.3 attack=0.4 release=1.5 volume=0.5 reach=0.3 order=Passing bloom=2.2 width=0.5 | chapel | psalm | Seven petals nearly all whisper, the murmur coming and going
Secrets in the vestry | Whirling choir | breath=0.8 petals=7 turn=-0.6 tilt=0.8 heart=0.3 light=3600 stone=0.4 fold=0.3 attack=0.3 release=0.8 volume=-5 width=0.8 bloom=1.5 | closet | suspended | Seven petals of quick whispering, crossing
Breathers in the nave | Whirling choir | breath=0.7 petals=5 turn=-0.35 heart=0.5 light=1400 stone=0.8 curl=0.2 attack=0.8 release=4 rings=6 volume=-4 order=Rim_first bloom=2.2 reach=0.3 width=0.8 damping=0.7 | nave | nave | Slow dark breaths, the edge of each before its note
Ghost of a descant | Whirling choir | breath=0.85 petals=10 turn=-0.4 heart=0.5 rings=3 light=4500 attack=0.8 release=3 stone=0.1 volume=-4.5 bloom=3 width=0.9 reach=0.4 | glimmer | highChoir | Ten petals of air over a hushed line
Cold mouths, open door | Whirling choir | breath=0.75 petals=3 turn=-0.6 heart=0.4 fold=0.4 curl=0.6 light=2200 stone=0.6 attack=0.6 release=2 volume=-4.5 width=0.6 reach=0.5 bloom=2.2 damping=0.2 | brightair | psalm | Breath curled and folded through three petals
Basses in a stairwell | Whirling choir | petals=3 turn=-0.2 tilt=0.2 heart=0.5 rings=7 fold=0.5 light=1300 stone=0.8 breath=0.15 attack=0.4 release=1 curl=0.2 volume=-7 width=0.4 bloom=2.2 damping=0.7 | pedal | lowreed | Low folded voices of three in stone
Two deep cantors | Whirling choir | petals=4 turn=0.1 heart=0.6 fold=0.35 curl=0.5 light=900 stone=1 breath=0.2 attack=0.3 release=1 rings=5 volume=5 width=0.5 bloom=2 reach=0.3 | monks | deepline | Odd curled voices in full stone, a throat apart
Ferrymen, rowing | Whirling choir | petals=5 turn=-0.35 tilt=0.8 heart=0.55 fold=0.6 light=1100 stone=0.5 breath=0.4 attack=0.5 release=1.5 volume=4.5 width=0.6 bloom=2.5 damping=0.8 | swaying | lowreed | Low breathy folds of five leaning as they pull
Mine shaft chorus | Whirling choir | petals=3 turn=-0.55 heart=0.35 rings=9 fold=0.75 light=1600 stone=0.6 breath=0.1 attack=0.7 release=2.5 curl=0.4 volume=-3 width=0.5 bloom=3 damping=0.2 | swarm | lowreed | Hard-folded low voices, every ring in use
Underneath the sermon | Whirling choir | petals=6 turn=0.2 heart=0.55 rings=4 light=1300 stone=0.7 breath=0.3 attack=1 release=3 fold=0.3 volume=-1.5 reach=0.1 width=0.4 bloom=5 damping=0.8 | cloth | gongs | Very dark round voices below the rest
Open ah | Whirling choir | petals=3 turn=-0.25 curl=0.35 fold=0.45 light=3200 stone=0.6 breath=0.25 heart=0.4 attack=0.5 release=1.5 rings=7 volume=-4.5 width=0.7 bloom=2 damping=0.2 | vowel | psalm | Folded, curled petals of three, sung at full throat
Round oh | Whirling choir | petals=4 turn=-0.2 curl=0.6 fold=0.25 light=1500 stone=0.7 breath=0.2 heart=0.6 attack=0.5 release=1.8 volume=-2.5 width=0.6 bloom=2.2 damping=0.8 | roundO | suspended | Odd voices curled dark, lips nearly shut
Ee in a tin chapel | Whirling choir | petals=8 turn=-0.4 curl=0.4 fold=0.5 light=3600 stone=0.3 breath=0.2 heart=0.3 attack=0.4 release=1 bend=10 volume=-9.5 width=0.6 bloom=1.5 | tin | psalm | Eight folded petals, pinched and bright
Vowels on a wheel | Whirling choir | petals=3 turn=0.55 tilt=0.3 curl=1 fold=0.15 light=2400 stone=0.4 breath=0.15 heart=0.45 attack=0.7 release=2 volume=-8 width=0.8 bloom=2.5 | bare | evening | Three petals curled as far as they go, a new vowel each second
Mouths of the river | Whirling choir | petals=5 turn=-0.15 tilt=0.9 curl=0.85 fold=0.3 light=1900 stone=0.5 breath=0.45 heart=0.5 attack=3.2 release=5 volume=-5.5 bloom=6 width=0.9 | sighs | evening | Five curled petals, vowels that take seconds to open
Solo from the pulpit | Three-petal flute | petals=3 heart=0.55 rings=5 breath=0.3 curl=0.45 stone=0.7 light=2400 attack=0.2 release=1 turn=-0.35 tilt=0.4 volume=-1 width=0.4 bloom=2.2 reach=0.3 | singer | suspended | One curled voice in stone, straight at first
Alto at the window | Three-petal flute | petals=5 heart=0.6 rings=5 breath=0.25 curl=0.9 fold=0.6 stone=0.9 light=1000 attack=0.25 release=1.2 turn=0.3 volume=0.5 width=0.5 bloom=2.2 damping=0.75 | hall 1.mix=0.2 | reedcall | A dark voice of five petals, curled and folded in stone
Lament over slow water | Three-petal flute | petals=5 heart=0.45 rings=6 breath=0.4 curl=0.5 stone=0.8 light=2000 attack=0.4 release=2 turn=-0.5 bend=-8 width=0.6 bloom=2.8 damping=0.7 volume=0 | trail | suspended | Five petals a shade flat, breathy, in stone
Shepherd's cry, far | Three-petal flute | petals=3 heart=0.4 rings=7 breath=0.2 fold=0.6 curl=0.2 stone=0.6 light=3500 attack=0.12 release=0.8 turn=-0.2 volume=4 width=0.2 bloom=1.5 damping=0.15 | backhall | shepherd | A bright folded call of three petals
Counter tenor, dry | Three-petal flute | petals=8 heart=0.6 rings=3 breath=0.15 curl=0.2 stone=0.6 light=2800 attack=0.2 release=0.6 turn=-0.6 tilt=0.5 volume=-3 width=0.3 reach=0.2 fold=0.6 bloom=1.5 damping=0.2 | front | suspended | A clear voice of eight petals folded round the heart
Entrance from the porch | Whirling choir | order=Rim_first bloom=3 petals=3 turn=-0.3 attack=0.8 light=2800 heart=0.5 release=3 stone=0.6 volume=-5.5 width=0.8 damping=0.3 | reverse | nave | Voices that begin as an edge of air and then have notes
Doors thrown wide | Whirling choir | order=Rim_first bloom=1.5 petals=6 turn=-0.6 tilt=0.9 attack=0.4 light=3000 heart=0.35 stone=0.1 release=2 fold=0.4 volume=-5.5 width=1 reach=0.6 curl=0.6 breath=0.15 | loft | psalm | Six folded petals, bright rim first
Veils coming off | Whirling choir | order=Heart_first bloom=8 petals=5 turn=-0.25 attack=1.5 light=3500 heart=0.55 stone=0.5 release=5 curl=0.5 volume=-2.5 width=0.8 damping=0.6 | swelled | nave | A plain tone that becomes a curled choir over eight seconds
Antiphon of light | Whirling choir | order=Passing bloom=2.2 petals=4 turn=-0.4 attack=0.6 light=3000 heart=0.4 stone=0.5 breath=0.3 release=2 rings=7 volume=0 width=0.8 tilt=0.5 | panned | psalm | Odd voices with a light going out through them
Procession past the door | Whirling choir | order=Passing bloom=3 petals=3 turn=0.3 attack=1 light=1600 heart=0.5 stone=0.8 breath=0.4 release=4 volume=-1 width=0.5 | hallway | psalm | Dark voices brightening as a slow light goes out and on
Murmur before the rite | Broken panes | petals=3 heart=0.6 curl=0.5 stone=0.8 breath=0.6 light=1400 attack=0.5 release=1.5 turn=-0.3 volume=0 width=0.6 bloom=2.2 damping=0.7 decay=3 | parlour | psalm | Breathy curled panes of three, people settling
Radio choir at sea | Broken panes | petals=5 heart=0.5 curl=0.4 fold=0.3 stone=0.6 breath=0.3 light=2600 attack=0.4 release=1 turn=-0.5 volume=-4 width=0.4 bloom=2 decay=8 | transistor | psalm | Five petals of voices fading in and out
Crowd under one arch | Broken panes | petals=4 heart=0.45 fold=0.6 curl=0.5 stone=1 breath=0.4 light=1800 attack=0.8 release=2.5 rings=8 volume=-2 width=0.8 bloom=3 damping=0.75 decay=2 | swarm | nave | Odd folded panes wholly in stone, many mouths
Choir with gaps in it | Broken panes | petals=6 heart=0.6 rings=4 stone=0.5 breath=0.35 light=3200 attack=0.6 release=3 tilt=0.7 turn=0.2 volume=4.5 reach=0.4 bloom=2.8 width=0.7 decay=3 | points | highChoir | A clear heart with six petals lit here and there
Litany of candles | Broken panes | petals=8 heart=0.6 rings=4 curl=0.3 stone=0.7 breath=0.45 light=2600 attack=0.5 release=4 order=Rim_first bloom=2 volume=0.5 width=0.8 decay=8 | monks | evening | Eight panes flickering rim first over an answer
Sung syllable, struck | Whirling choir | strike=0.6 decay=1.5 attack=0.3 petals=3 curl=0.5 turn=-0.3 light=2200 stone=0.7 release=0.5 heart=0.5 volume=-1.5 width=0.4 bloom=1.5 | chamber | rolled | A struck curled syllable with a short voice behind | keys
Choir plucked like harps | Whirling choir | strike=0.85 decay=5 damping=0.33 petals=5 curl=0.7 turn=-0.6 light=3000 stone=0.5 breath=0.5 release=1 volume=-1 width=0.8 heart=0.6 rings=4 reach=0.3 | stars | ostinato | Breathy plucked vowels of five, thrown upwards | plucked
Ha, ha, across the lake | Whirling choir | strike=0.75 decay=2.5 attack=0.1 petals=4 breath=0.75 light=2600 stone=0.6 release=0.3 heart=0.6 damping=0.52 volume=-3.5 width=0.7 | slowing | answer | Short puffs of odd breathy voice | plucked
Bell choir, human | Whirling choir | strike=0.5 decay=5 attack=0.8 petals=5 rings=4 light=4000 stone=0.4 breath=0.25 heart=0.45 release=3 turn=-0.35 volume=0.5 reach=0.3 width=0.8 bloom=2.2 damping=0.2 | shadowed | peal | Five petals struck and sung on | bell
Do not wake the house | Whirling choir | strike=0.4 decay=2 attack=0.5 petals=3 heart=0.65 rings=5 light=1100 stone=0.8 breath=0.5 release=1.5 turn=0.2 volume=0.5 reach=0.15 bloom=3 width=0.3 damping=0.7 | veil | nocturne | A very soft stroke and a hum, three dark petals | keys
`,
    },
    {
      id: 'dust-and-lace',
      name: 'Dust and lace',
      category: 'texture',
      rows: `
Lace on the stair | Dust lace | petals=7 rings=3 reach=0.6 breath=0.7 light=2000 attack=0.8 turn=0.3 heart=0.75 stone=0.1 volume=-3.5 width=0.8 bloom=3 | sines | quartal | One ring of seven and a note, both blown nearly to breath, turning
Cobweb at dawn | Dust lace | petals=9 rings=2 reach=0.5 breath=0.5 light=2600 attack=1 turn=-0.4 tilt=0.9 heart=0.8 fold=0 volume=-3.5 width=0.9 bloom=2.5 damping=0.2 | stack | highChoir | A fine ring of nine over a quiet note, crossing, half air
Torn net curtain | Dust lace | petals=4 rings=6 reach=0.4 breath=0.8 light=1200 attack=0.5 fold=0.5 turn=0.45 heart=0.15 volume=-5 width=0.7 damping=0.7 | cassette | quartal | An odd ring of breath, folded and ragged
Bobbin and thread | Dust lace | petals=5 rings=4 reach=0.5 breath=0.35 light=2600 attack=0.2 curl=0.6 turn=0.6 tilt=0.8 heart=0.75 volume=-3 width=0.8 bloom=1.5 | ripple | highChoir | A curled ring of five wound like thread round a note
Dew on gossamer | Dust lace | petals=9 rings=2 reach=0.3 breath=0.35 light=2600 attack=0.3 turn=0.2 heart=0.8 strike=0.4 decay=10 volume=5 damping=0.6 | glints | - | One pair of rings above a small note, struck, and breath after it
Dust in a shaft of sun | Dust lace | petals=3 rings=6 reach=0.5 breath=0.9 light=1200 attack=0.6 turn=0.35 heart=0.7 stone=0.2 volume=-6 width=0.7 bloom=2.5 damping=0.2 | dust | quartal | A ring of three, nearly all breath, motes going up from it
Chalk and wool | Dust lace | petals=6 rings=3 reach=0.3 breath=0.95 light=700 attack=0.7 fold=0.3 heart=0.4 stone=0.5 volume=-2.5 width=0.4 damping=0.85 bloom=2.8 | wool | lauds | Dark breath on one near ring of six
Flour sifted at night | Dust lace | petals=11 rings=1 reach=0.6 breath=1 light=2000 attack=0.9 turn=-0.75 tilt=0.7 heart=0.6 volume=-2.5 width=0.95 bloom=1.5 | fogged | quartal | Nothing but breath, on a note and the last ring of eleven
Attic, trapdoor up | Dust lace | petals=4 rings=3 reach=0.4 breath=0.75 light=1600 attack=0.4 curl=0.4 heart=0.55 stone=0.7 release=3 volume=-1 width=0.4 damping=0.7 bloom=2 | vinyl | - | A breathy odd ring in stone, old air with a note in it
Pollen on the pews | Dust lace | petals=7 rings=2 reach=0.4 breath=0.7 light=1500 attack=0.7 turn=-0.3 tilt=0.6 heart=0.8 order=Passing bloom=3 volume=-1.5 width=1 | glassrain | highChoir | A ring of seven in warm air, a light passing through it
Window breaking slowly | Broken panes | petals=7 heart=0.15 rings=8 reach=0.7 light=2600 attack=0.5 fold=0.3 turn=0.4 breath=0.1 release=4 bend=20 volume=-1.5 width=0.8 bloom=2.4 decay=3 stone=0.5 tilt=0.8 | stretched | quartal | Sharp panes of seven lit by turns
Stained light on water | Broken panes | petals=5 heart=0.5 rings=6 light=3000 attack=1 release=6 turn=-0.4 tilt=0.8 breath=0.25 order=Passing bloom=2 volume=4 width=1 damping=0.7 decay=9 | waters | lauds | Panes of five, a light passing, nothing still
City from a night train | Broken panes | petals=3 heart=0.35 rings=9 reach=0.6 light=1500 attack=0.3 release=2 strike=0.3 decay=2 volume=0 width=0.9 | dotted | quartal | Lit panes of three going by at two speeds
Old film, hand cranked | Broken panes | petals=4 heart=0.6 rings=5 light=1500 attack=0.4 release=2 fold=0.4 stone=0.5 breath=0.4 volume=-3 width=0.4 damping=0.8 bloom=2 decay=3 reach=0.4 | worn | - | Dark odd panes with breath, flickering
Boughs across a lamp | Broken panes | petals=6 heart=0.7 rings=4 light=2600 attack=0.7 release=5 breath=0.55 turn=0.15 curl=0.4 volume=1 width=0.8 bloom=3 decay=9 | rain | quartal | Curled panes of six and breath, shadows over a clear note
Glitter let fall | Passing light | petals=8 rings=5 reach=0.8 light=3800 bloom=1.5 attack=0.4 heart=0.4 turn=0.5 tilt=0.8 breath=0.3 strike=0.4 decay=3 volume=0.5 width=0.95 | crystals | highChoir | Eight bright petals with a quick light through them
Scan line | Passing light | petals=3 rings=9 reach=1 light=2200 bloom=1.5 attack=0.5 heart=0.4 turn=0 tilt=0 fold=0 breath=0 volume=1.5 width=0.6 decay=3 | keen | - | A quick light stepping cleanly out through nine rings
Phosphor wake | Passing light | petals=3 rings=7 light=2400 bloom=2 attack=0.8 heart=0.4 breath=0.5 turn=-0.6 curl=0.7 fold=0.2 volume=6 tracery=Smooth width=0.8 tilt=0.8 decay=9 | sea | quartal | A curled breathy light going out through three petals again and again
Northern lights, kitchen | Passing light | petals=6 rings=8 reach=0.9 light=4500 bloom=3 attack=1.5 heart=0.4 curl=0.7 turn=0.3 tilt=0.6 release=7 volume=5 width=0.95 damping=0.2 decay=3 | sweep | lauds | Six curled petals, a slow light in them, colours trading
Search lamps over clouds | Passing light | petals=11 rings=4 reach=0.9 light=4500 bloom=2.5 attack=1 heart=0.45 turn=-0.3 release=6 stone=0.1 breath=0.4 volume=3.5 width=1 decay=9 | backswell | quartal | Eleven petals, beams going out in breath
Rain begins on glass | Glass plucks | petals=12 strike=0.95 decay=2 heart=0.2 rings=3 light=4500 breath=0.6 damping=0.05 release=0.6 turn=0.4 volume=0 reach=0.5 bend=30 width=0.95 tilt=0.9 | glassrain 2.mix=0.4 | ostinato | Breathy ticks of twelve sharpened petals
Icicles on the gutter | Glass plucks | petals=7 strike=1 decay=8 heart=0.25 rings=3 light=8000 bend=40 damping=0.1 release=4 volume=-1 reach=0.3 tilt=0.1 width=0.7 | points | highBells | Seven sharpened petals tapped, long and thin
Foil strips, open door | Glass plucks | petals=7 strike=0.9 decay=6 heart=0.35 rings=5 reach=0.7 light=3500 breath=0.3 fold=0.3 release=3 turn=0.7 tilt=1 volume=-3.5 damping=0.16 width=0.9 | gleam | drops | Seven thin petals flashing fast as they fade
Dry pods shaken | Glass plucks | petals=4 strike=0.85 decay=2.5 heart=0.4 rings=6 light=2500 breath=0.9 stone=0.6 release=0.4 damping=0.52 volume=0.5 width=0.6 | stars | ostinato | Odd breath struck short, dry as seeds
Typewriter under snow | Glass plucks | petals=6 strike=1 decay=2.5 heart=0.5 rings=3 light=1300 stone=0.9 fold=0.5 breath=0.5 release=0.3 volume=0 tilt=0.1 width=0.3 | darkroom | ostinato | Dull folded knocks of six petals, stone on stone
Gale at the belfry | Three-petal flute | petals=3 breath=1 heart=0.4 light=2500 attack=1 release=4 turn=0.4 tilt=0.7 rings=6 stone=0.3 volume=-5.5 bloom=3 width=1 damping=0.2 | clouds 2.exposure=0.8 | quartal | Nothing but breath on three petals, in gusts
Steam pipes at four | Three-petal flute | petals=8 breath=0.95 heart=0.2 light=2400 attack=0.4 release=2 stone=0.7 fold=0.3 rings=4 volume=-2.5 width=0.6 damping=0.3 bloom=2.2 | tube | - | Eight petals of steam in a stone room
Shell and tide | Three-petal flute | petals=5 breath=0.9 heart=0.6 light=1600 attack=1.5 release=5 curl=0.5 turn=-0.3 volume=-2.5 bloom=4 width=0.8 damping=0.7 | tide | lauds | Curled breath of five, coming in and going out
Paper in the rafters | Three-petal flute | petals=6 breath=0.8 heart=0.3 light=3800 attack=0.1 release=2 fold=0.6 strike=0.4 decay=1 rings=5 volume=-1.5 width=0.7 | paper | drops | Dry folded breath with a flick at the start
Last of the incense | Three-petal flute | petals=7 breath=0.7 heart=0.75 light=1400 attack=1.2 release=6 turn=-0.5 tilt=0.6 stone=0.6 volume=-2.5 order=Passing bloom=3.5 rings=4 reach=0.2 fold=0.5 width=0.6 damping=0.2 | evaporate | lauds | Dark breath round a plain tone, something passing up through it
Bent light through resin | Still drone | petals=5 bend=-80 heart=0.35 rings=5 fold=0.2 curl=0.4 light=2800 attack=0.8 bloom=3 release=4 turn=0.4 tilt=0.6 stone=0.1 width=0.7 damping=0.7 volume=-7.5 | still | quartal | Five petals drawn far flat, curled and turning
Oil on a puddle | Still drone | petals=3 bend=18 heart=0.4 rings=7 fold=0.3 curl=0.8 light=3500 attack=1 bloom=3.5 release=5 turn=0.5 tilt=0.8 stone=0 volume=-4 damping=0.2 | swirl | highChoir | Three sharpened petals curled far, colours sliding over each other
Magnetic weather | Still drone | petals=9 bend=-130 heart=0.5 rings=4 fold=0.4 curl=0.2 light=1800 attack=1.2 release=5 turn=-0.5 tilt=1 stone=0.3 volume=-4.5 tracery=Golden_bells decay=30 width=0.9 damping=0.2 reach=0.8 | ringed | quartal | Golden rings of nine drawn far flat, crossing, folded
Nave in a snow globe | Still drone | petals=8 bend=-20 heart=0.35 rings=4 fold=0 curl=0.2 light=6500 attack=1 bloom=4.5 release=6 turn=0.3 stone=0.2 volume=-3.5 reach=0.4 damping=0.1 width=0.8 | smaller | highChoir | Eight flat petals, high and clear, a toy of a great room
Faults in the marble | Still drone | petals=4 bend=-45 heart=0.3 rings=8 fold=0.5 curl=0.5 light=1200 attack=0.8 release=5 turn=0.15 stone=0.8 tilt=0.4 volume=-6.5 bloom=5 width=0.6 damping=0.75 | giant | lauds | Odd rings far flat, folded and curled in dark stone
Grain of the negative | Broken panes | petals=8 heart=0.1 rings=6 reach=0.6 breath=0.7 light=1800 attack=0.6 release=3 fold=0.2 volume=-5.5 strike=0.1 width=0.8 bloom=3 decay=3 | cloud | quartal | Eight panes of breath, the note hardly there
Cinema dust | Dust lace | petals=3 rings=5 reach=0.5 breath=0.65 light=1800 attack=0.2 heart=0.7 curl=0.5 turn=-0.5 tilt=0.8 volume=-2 bloom=2 width=0.8 damping=0.75 | smear | quartal | A breathy curled ring of three crossing itself
Starlings by thousands | Dust lace | petals=5 rings=4 reach=0.4 breath=0.45 light=1500 attack=0.2 heart=0.55 fold=0.6 turn=0.75 tilt=1 volume=-6.5 width=1 bloom=1.5 | choirgrain | lauds | One folded ring of five spun fast and scattered
Frost ferns | Frost on the rim | petals=9 bloom=5 light=6000 attack=0.8 heart=0.3 breath=0.55 turn=-0.3 tilt=0.9 release=6 rings=3 strike=0.25 decay=4 width=0.9 | snow | highChoir | Nine petals growing in from the rim after a light stroke
Sugar dissolving | Chime wheel | petals=9 strike=0.8 decay=7 heart=0.35 rings=3 light=8000 breath=0.5 release=3 turn=0.5 volume=0.5 damping=0.16 width=0.8 | cloud 2.mix=0.5 | drops | Nine golden petals, small and breathy, gone before they land
Dynamo two streets off | Still drone | petals=3 heart=0.6 rings=5 fold=0.7 curl=0.6 light=350 attack=0.8 release=3 turn=0.5 tilt=0.7 breath=0.4 stone=0.4 volume=-5 bloom=4 width=0.6 damping=0.8 | drum | gongs | Folded and curled with almost no light, a turning murmur
Roof bearing down | Bronze gong | petals=4 strike=0.4 attack=1.2 decay=30 fold=0.7 curl=0.5 bend=100 light=700 release=8 turn=0.4 tilt=0.6 volume=-1.5 width=0.8 bloom=4 rings=5 reach=0.3 stone=0.8 | sag | gongs | Dark golden rings bent sharp and folded, swelling after a soft blow
Tunnel of one train | Passing light | petals=3 bloom=1.5 attack=0.3 heart=0.4 rings=9 light=1000 fold=0.8 stone=0.7 turn=0.2 release=3 volume=6 width=0.7 decay=9 | tunnel | gongs | A dark folded light coming round and round out of the stone
Sea under the cellar | Three-petal flute | petals=3 breath=0.4 heart=0.35 light=800 attack=1 release=5 stone=0.8 curl=0.9 fold=0.6 turn=-0.3 tilt=0.8 volume=0 rings=7 reach=0.3 width=0.6 bloom=5 damping=0.7 | underW | gongs | Low dark folds of three, curled far, a swell in full stone
Static on the horizon | Dust lace | petals=6 rings=5 reach=0.35 breath=0.8 light=950 attack=0.2 heart=0.65 fold=0.5 stone=0.5 release=4 volume=-5.5 width=0.5 bloom=2 | transistor | lauds | A breathy folded ring of six, dark and weak
Frozen bell, half asleep | Chime wheel | petals=6 strike=0.35 attack=0.9 decay=30 heart=0.4 rings=4 light=5000 turn=-0.3 tilt=0.7 release=9 breath=0.3 volume=-6.5 width=0.8 | frozen | quartal | Six golden petals, lightly touched, kept from fading
Second hand stopped | Passing light | petals=4 bloom=8 attack=1 heart=0.35 rings=7 light=2200 turn=0.05 release=8 fold=0.35 curl=0.2 volume=0.5 reach=0.7 width=0.8 decay=3 | mist | quartal | Folded odd rings with a light so slow it seems to stand
Memory of a window | Opening keys | petals=6 order=Rim_first strike=0.2 bloom=2 attack=0.4 light=2000 release=8 heart=0.55 breath=0.5 curl=0.3 volume=-1.5 width=0.7 damping=0.7 | bed 1.mix=0.18 | lauds | Six breathy petals, the rim a moment before the rest
Hours of the moth | Whirling choir | petals=7 turn=-1 tilt=1 heart=0.45 rings=4 light=3500 breath=0.6 attack=0.6 release=3 stone=0.1 curl=0.1 volume=-6.5 bloom=2 width=1 | loop | quartal | Seven breathy petals fluttering as fast as rings can turn
Where the glass was | Dust lace | petals=4 rings=2 reach=0.3 breath=0.4 light=2000 attack=3 heart=0.6 turn=0.1 release=9 stone=0.4 volume=1 bloom=5 width=0.5 damping=0.7 | sines | evening | A plain breathy tone with one faint odd ring
`,
    },
  ],
}
