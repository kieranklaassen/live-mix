import { type InstrumentSet } from './set'

// Laid out by how the bell is used as a mouth: struck and left to say one word,
// played under felt, plucked, rocked to sleep in glass, laid low, sung with the key
// held, set against its neighbours, woken by breath, drawn out to an amen and cut
// short in wood. Each direction is ten corners of the instrument, five to a corner.

export const SET: InstrumentSet = {
  device: 'bronze-vowels',
  names: {
    metal: ['Harmonic', 'Bar', 'Plate', 'Bell', 'Glass'],
    mallet: ['Felt', 'Wood', 'Nail', 'Breath'],
    word: ['Ah oh oo', 'We', 'Hum', 'Noon', 'Nay nay', 'Ay ma', 'Home', 'Seem', 'Whoosh', 'Hush'],
  },
  chains: {
    bare: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Open', params: { clear: 0.2 } }],
      words: ', close and dry',
    },
    booth: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Keys' },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.14 } },
      ],
      words: ', close up in a small booth',
    },
    sides: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
        { deviceId: 'tamer', preset: 'Gentle' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', dry and opened to the sides',
    },
    narrow: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Narrow' },
        { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 2 } },
      ],
      words: ', dry, narrow and warm',
    },
    shaded: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Shaded' },
        { deviceId: 'spread', preset: 'Soft tilt' },
      ],
      words: ', dry, its top in the shade',
    },
    lit: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Bright', params: { presence: 2, air: 4 } },
        { deviceId: 'stereo-detune', preset: 'Faint width' },
      ],
      words: ', dry and lit from above',
    },
    deep: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 3 } },
        { deviceId: 'saturator', preset: 'Warm glue' },
      ],
      words: ', dry, with its floor deepened',
    },
    evened: {
      effects: [
        { deviceId: 'tamer', preset: 'Ringing tones', params: { depth: 0.7 } },
        { deviceId: 'spread', preset: 'Wide pad' },
      ],
      words: ', dry and wide, its ringing held down',
    },
    near: {
      effects: [
        { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { makeup: 6 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 3 } },
      ],
      words: ', dry and held close',
    },
    wall: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 8 } },
      ],
      words: ', dry and right up front',
    },
    walled: {
      effects: [
        { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.14 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 8 } },
      ],
      words: ', up front in a short dull room',
    },
    iron: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Iron lows' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 3 } },
      ],
      words: ', through a transformer, dry',
    },
    triode: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Triode glow' },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.1 } },
      ],
      words: ', through a warm valve, close',
    },
    grit: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Parallel grit', params: { highCut: 7000 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 3 } },
      ],
      words: ', with a little grit beside it',
    },
    fold: {
      effects: [
        { deviceId: 'saturator', preset: 'Folded glass', params: { driveDb: 5, mix: 0.35 } },
        { deviceId: 'ambient-eq', preset: 'Shaded' },
      ],
      words: ', its peaks folded over softly',
    },
    reel: {
      effects: [{ deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1 } }],
      words: ', on quarter inch tape',
    },
    cassette: {
      effects: [
        { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.2 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 3 } },
      ],
      words: ', on a cassette, a little worn',
    },
    blanket: {
      effects: [
        { deviceId: 'tape', preset: 'Under a blanket' },
        { deviceId: 'stereo-detune', preset: 'Soft halo' },
      ],
      words: ', under a blanket of old tape',
    },
    hotvalve: {
      effects: [{ deviceId: 'patina', preset: 'Hot valve', params: { noise: 0.1 } }],
      words: ', on an old valve machine',
    },
    wornreel: {
      effects: [
        {
          deviceId: 'patina',
          preset: 'Quarter inch reel',
          params: { wear: 0.6, wobble: 0.5, noise: 0.15 },
        },
      ],
      words: ', on a worn reel',
    },
    combo: {
      effects: [{ deviceId: 're-amp', preset: 'Combo in a room' }],
      words: ', from a loudspeaker in a room',
    },
    pillow: {
      effects: [{ deviceId: 're-amp', preset: 'Pillow speaker', params: { output: 2 } }],
      words: ', from a speaker under a pillow',
    },
    cupboard: {
      effects: [{ deviceId: 're-amp', preset: 'In the cupboard', params: { room: 0.15 } }],
      words: ', from inside a cupboard',
    },
    platform: {
      effects: [
        { deviceId: 're-amp', preset: 'Station platform', params: { room: 0.35 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', from a station loudspeaker',
    },
    board: {
      effects: [
        { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.45 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 2 } },
      ],
      words: ', on a wooden soundboard',
    },
    bottle: {
      effects: [
        { deviceId: 'vessel', preset: 'Blown bottle', params: { mix: 0.5, air: 0.2 } },
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.12 } },
      ],
      words: ', inside a bottle',
    },
    clay: {
      effects: [
        { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.55 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 2 } },
      ],
      words: ', inside a clay pot',
    },
    tin: {
      effects: [
        { deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.4 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', in a small tin',
    },
    shell: {
      effects: [{ deviceId: 'vessel', preset: 'Whispering shell', params: { mix: 0.4, air: 0.3 } }],
      words: ', held in a shell',
    },
    pipe: {
      effects: [
        { deviceId: 'vessel', preset: 'Inside a pipe', params: { mix: 0.45 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: ', down a metal pipe',
    },
    skin: {
      effects: [
        { deviceId: 'vessel', preset: 'Drum head', params: { mix: 0.5 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 2 } },
      ],
      words: ', through a drum skin',
    },
    doubled: {
      effects: [
        { deviceId: 'stereo-detune', preset: 'Doubled' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', doubled a shade late on either side',
    },
    slap: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.28 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 2 } },
      ],
      words: ', with one short slap of tape',
    },
    sampler: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Sampler' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 2 } },
      ],
      words: ', as an early sampler kept it',
    },
    glaze: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Glaze' },
        { deviceId: 'chorus', preset: 'Faint air', params: { mix: 0.3 } },
      ],
      words: ', under a thin digital glaze',
    },
    disc: {
      effects: [{ deviceId: 'vinyl', preset: 'New pressing', params: { crackle: 0.2 } }],
      words: ', on a fresh record',
    },
    parlour: {
      effects: [
        { deviceId: 'vinyl', preset: 'Parlour 78', params: { crackle: 0.25, surface: 0.2 } },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.14 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', on an old fast record',
    },
    kitchen: {
      effects: [
        {
          deviceId: 'radio',
          preset: 'Kitchen radio',
          params: { static: 0.06, interference: 0.03 },
        },
      ],
      words: ', from a kitchen radio',
    },
    shortwave: {
      effects: [
        {
          deviceId: 'radio',
          preset: 'Night shortwave',
          params: { static: 0.1, interference: 0.05, fading: 0.4 },
        },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', through a shortwave set at night',
    },
    felted: {
      effects: [
        { deviceId: 'sift', preset: 'Felt and air' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', with the strikes wrapped in felt',
    },
    strikes: {
      effects: [
        { deviceId: 'sift', preset: 'Strikes forward' },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.15 } },
      ],
      words: ', the strikes brought forward',
    },
    tones: {
      effects: [
        { deviceId: 'sift', preset: 'Tones only', params: { tones: 2 } },
        { deviceId: 'stereo-widener', preset: 'Wide' },
      ],
      words: ', with only its tones left',
    },
    blunt: {
      effects: [
        { deviceId: 'fog', preset: 'Short blur', params: { size: 45 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 2 } },
      ],
      words: ', with every attack blunted',
    },
    pane: {
      effects: [
        { deviceId: 'fog', preset: 'Behind glass', params: { mix: 0.75 } },
        { deviceId: 'stereo-widener', preset: 'Wide' },
        { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 0 } },
      ],
      words: ', behind a thick pane',
    },
    smaller: {
      effects: [
        { deviceId: 'size', preset: 'Smaller' },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.12 } },
      ],
      words: ', moved into a smaller body',
    },
    giant: {
      effects: [
        { deviceId: 'size', preset: 'Giant', params: { size: 0.7 } },
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.15 } },
      ],
      words: ", moved into a giant's body",
    },
    wobble: {
      effects: [
        { deviceId: 'size', preset: 'Wobble', params: { mix: 0.7 } },
        { deviceId: 'ambient-eq', preset: 'Open' },
      ],
      words: ', its body wobbling',
    },
    paper: {
      effects: [
        { deviceId: 'buzzing-bridge', preset: 'Paper edge', params: { amount: 0.12 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 2 } },
      ],
      words: ', buzzing against paper',
    },
    gourd: {
      effects: [
        { deviceId: 'buzzing-bridge', preset: 'Great gourd', params: { mix: 0.45 } },
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.14 } },
      ],
      words: ", with a gourd's skin buzzing under it",
    },
    leather: {
      effects: [{ deviceId: 'buzzing-bridge', preset: 'Soft strap', params: { mix: 0.4 } }],
      words: ', against a soft leather strap',
    },
    dense: {
      effects: [
        { deviceId: 'ambient-comp', preset: 'Dense pad', params: { makeup: 8 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10 } },
      ],
      words: ', held dense and near',
    },
    tails: {
      effects: [
        { deviceId: 'lift', preset: 'Long tails', params: { limit: 9 } },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.12 } },
      ],
      words: ', its tails lifted up close',
    },
    overtones: {
      effects: [
        { deviceId: 'reveal', preset: 'Overtones', params: { amount: 0.55, range: 16 } },
        { deviceId: 'ambient-eq', preset: 'Shaded' },
      ],
      words: ', its overtones brought forward',
    },
    tube: {
      effects: [
        { deviceId: 'imprint', preset: 'Hollow tube', params: { amount: 1 } },
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.14 } },
      ],
      words: ', coloured by a hollow tube',
    },
    box: {
      effects: [{ deviceId: 'imprint', preset: 'Dark box', params: { replace: 0.4 } }],
      words: ', coloured by a dark box',
    },
    phone: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Phone line', params: { driveDb: 6 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10 } },
      ],
      words: ', down a telephone line',
    },
    gatefilter: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Low-pass gate', params: { cutoffHz: 700 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 3 } },
      ],
      words: ', under a closed low filter',
    },
    bloomfilter: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Soft bloom', params: { driveDb: 3 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
        { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 0 } },
      ],
      words: ', its top opened by each strike',
    },
    wah: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Touch wah', params: { resonance: 3, mix: 0.5 } },
        { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.1 } },
      ],
      words: ', with a filter that answers the touch',
    },
    table: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.24 } }],
      words: ', on a table in a small room',
    },
    chamber: {
      effects: [
        { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', in a tight chamber',
    },
    stub: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.25 } }],
      words: ', on a short dull plate',
    },
    room: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.24 } }],
      words: ', in an ordinary room',
    },
    hall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.28 } }],
      words: ', in a hall',
    },
    bright: {
      effects: [
        { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.28 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', in a bright hall',
    },
    nave: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } }],
      words: ', in a vast nave',
    },
    cathedral: {
      effects: [
        { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
        { deviceId: 'ambient-eq', preset: 'Thin' },
      ],
      words: ', high in a cathedral',
    },
    dark: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.32 } }],
      words: ', in a dark hall',
    },
    longplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.28 } }],
      words: ', on a long plate',
    },
    brightplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.2 } }],
      words: ', on a bright plate, dry in front',
    },
    valley: {
      effects: [
        { deviceId: 'distance', preset: 'Open air', params: { level: 0.95 } },
        { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.25 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', across an open valley',
    },
    cave: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.26 } }],
      words: ', in a dark cave',
    },
    springs: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.22 } }],
      words: ', with a little spring behind',
    },
    drip: {
      effects: [
        { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.25 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', dripping through a spring tank',
    },
    coil: {
      effects: [
        { deviceId: 'spring-reverb', preset: 'Single slack coil', params: { mix: 0.28 } },
        { deviceId: 'ambient-eq', preset: 'Warm' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', down one slack coil',
    },
    open: {
      effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } }],
      words: ', in a wide open space',
    },
    event: {
      effects: [{ deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.32 } }],
      words: ', in a space that swells in after it',
    },
    stairwell: {
      effects: [{ deviceId: 'distance', preset: 'Stone stairwell', params: { level: 0.9 } }],
      words: ', in a stone stairwell',
    },
    nextdoor: {
      effects: [
        { deviceId: 'distance', preset: 'Next door', params: { level: 1 } },
        { deviceId: 'ambient-eq', preset: 'Muffled' },
      ],
      words: ', heard from next door',
    },
    shore: {
      effects: [
        { deviceId: 'distance', preset: 'Far shore', params: { level: 1 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', from a far shore',
    },
    fogged: {
      effects: [
        { deviceId: 'distance', preset: 'Through fog', params: { level: 1 } },
        { deviceId: 'fog', preset: 'Thin veil', params: { mix: 0.6 } },
      ],
      words: ', through fog',
    },
    monks: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.3 } }],
      words: ', with low voices in the walls',
    },
    vowels: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Vowel drift', params: { mix: 0.32 } }],
      words: ', in a hall that changes its vowel',
    },
    ohs: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.3 } }],
      words: ', an oo hanging behind it',
    },
    glimmer: {
      effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.3 } }],
      words: ', with a faint octave glow',
    },
    fifths: {
      effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { mix: 0.28, decay: 5 } }],
      words: ', with fifths rising behind',
    },
    glow: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Faint glow' }],
      words: ', glowing faintly afterwards',
    },
    winter: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Winter drift', params: { mix: 0.3 } }],
      words: ', with a thin winter drift behind',
    },
    warmhaze: {
      effects: [{ deviceId: 'haze', preset: 'Faint warmth' }],
      words: ', in a warm fuzz of its own',
    },
    climb: {
      effects: [{ deviceId: 'spiral', preset: 'Faint lift' }],
      words: ', its tail climbing faintly',
    },
    cavern: {
      effects: [
        { deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.28 } },
        { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 0 } },
      ],
      words: ', among scattered cavern echoes',
    },
    patter: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.26 } }],
      words: ', with a patter of close echoes',
    },
    halo: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.35 } }],
      words: ', with a short halo that stops',
    },
    rise: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.3 } }],
      words: ', with a reversed swell after it',
    },
    triad: {
      effects: [{ deviceId: 'sympathetic', preset: 'Open triad', params: { mix: 0.3 } }],
      words: ', with open strings ringing along',
    },
    pedal: {
      effects: [{ deviceId: 'sympathetic', preset: 'Piano pedal', params: { mix: 0.32 } }],
      words: ', over strings held by a pedal',
    },
    silent: {
      effects: [
        { deviceId: 'silent-keys', preset: 'Open fifth and bass', params: { mix: 0.4, output: 0 } },
      ],
      words: ', waking a silent chord',
    },
    bowls: {
      effects: [{ deviceId: 'bowls', preset: 'Low fifths', params: { mix: 0.3 } }],
      words: ', with a table of bowls answering',
    },
    chimes: {
      effects: [{ deviceId: 'bowls', preset: 'Short chime', params: { mix: 0.28 } }],
      words: ', with small bright bowls answering',
    },
    warmecho: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.25, feedback: 0.35 } },
      ],
      words: ', with warm tape echoes',
    },
    dotted: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.26 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 2 } },
      ],
      words: ', in dotted tape echoes',
    },
    trail: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.28, feedback: 0.45 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', leaving a long dark trail of echo',
    },
    bucket: {
      effects: [{ deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.25 } }],
      words: ', with dark wavering echoes',
    },
    hop: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Fifth hop', params: { mix: 0.22, feedback: 0.4 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', its echoes hopping up a fifth',
    },
    drift: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Slow drift', params: { mix: 0.27, feedback: 0.4 } },
      ],
      words: ', with slow drifting echoes',
    },
    stone: {
      effects: [
        { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.3 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', skipping away like a pebble',
    },
    bounces: {
      effects: [
        { deviceId: 'skipping-stone', preset: 'Slowing bounces', params: { mix: 0.28 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', its bounces slowing down',
    },
    points: {
      effects: [
        { deviceId: 'constellation', preset: 'Faint points', params: { mix: 0.35 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', with a few points of echo far off',
    },
    stars: {
      effects: [{ deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.3 } }],
      words: ', with echoes scattered to the sides',
    },
    round: {
      effects: [{ deviceId: 'canon', preset: 'Round of three', params: { mix: 0.35 } }],
      words: ', sung again in a round',
    },
    shadow: {
      effects: [{ deviceId: 'canon', preset: 'Octave shadow', params: { mix: 0.3 } }],
      words: ', with an octave shadow after it',
    },
    mirror: {
      effects: [{ deviceId: 'canon', preset: 'Mirror answer', params: { mix: 0.3 } }],
      words: ', answered backwards',
    },
    prism: {
      effects: [{ deviceId: 'prism', preset: 'Low to high', params: { mix: 0.3, feedback: 0.25 } }],
      words: ', unfolding from low to high',
    },
    scatter: {
      effects: [
        { deviceId: 'prism', preset: 'Scattered notes', params: { mix: 0.32 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', its colours scattered in time',
    },
    recall: {
      effects: [{ deviceId: 'echo-memory', preset: 'Faint recall' }],
      words: ', with faint memories of it',
    },
    moons: {
      effects: [
        { deviceId: 'orbits', preset: 'Faint trace' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', in slow loops out of step',
    },
    loop: {
      effects: [{ deviceId: 'tape-loop', preset: 'Slow fade', params: { mix: 0.32 } }],
      words: ', on a slowly fading loop',
    },
    mirrorlong: {
      effects: [{ deviceId: 'reverse-delay', preset: 'Faint reflection' }],
      words: ', with a faint reflection reversed',
    },
    glintecho: {
      effects: [{ deviceId: 'grain-delay', preset: 'Faint glints' }],
      words: ', with glints in its echo',
    },
    cascade: {
      effects: [
        { deviceId: 'cascade', preset: 'Faint halo' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', with a faint cascade above',
    },
    bed: {
      effects: [
        { deviceId: 'micro-looper', preset: 'Faint bed' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', over a faint loop of itself',
    },
    harmonic: {
      effects: [
        { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 2.6, depth: 0.6 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: ', in a harmonic tremolo',
    },
    throb: {
      effects: [
        { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 3.2, depth: 0.6 } },
        { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.15 } },
      ],
      words: ', throbbing in an old amplifier',
    },
    panned: {
      effects: [
        { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.4 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', walking from side to side',
    },
    shudder: {
      effects: [
        { deviceId: 'tremolo', preset: 'Fast shudder', params: { rate: 11, depth: 0.6 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 2 } },
      ],
      words: ', shuddering fast',
    },
    chop: {
      effects: [
        { deviceId: 'tremolo', preset: 'Chopper', params: { rate: 4, depth: 0.85 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', chopped evenly',
    },
    chorale: {
      effects: [{ deviceId: 'rotary', preset: 'Chorale' }],
      words: ', through a slow rotating horn',
    },
    spin: {
      effects: [{ deviceId: 'rotary', preset: 'Tremolo', params: { drive: 0.15 } }],
      words: ', through a fast rotating horn',
    },
    ensemble: {
      effects: [
        { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.4 } },
        { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 0 } },
      ],
      words: ', in a lush ensemble',
    },
    deepsea: {
      effects: [
        { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.4 } },
        { deviceId: 'ambient-eq', preset: 'Shaded' },
      ],
      words: ', in a deep slow chorus',
    },
    swirl: {
      effects: [
        { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.45 } },
        { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 0 } },
      ],
      words: ', in a slow phase swirl',
    },
    twelve: {
      effects: [
        { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { mix: 0.45 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.12 } },
        { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 0 } },
      ],
      words: ', in a cloud of moving notches',
    },
    sweep: {
      effects: [{ deviceId: 'flanger', preset: 'Gentle sweep', params: { mix: 0.4 } }],
      words: ', under a gentle sweeping comb',
    },
    hollow: {
      effects: [{ deviceId: 'flanger', preset: 'Negative hollow', params: { mix: 0.45 } }],
      words: ', hollowed by a slow comb',
    },
    notch: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Slow notch', params: { resonance: 0.8 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', with a notch passing slowly through',
    },
    singer: {
      effects: [
        { deviceId: 'late-vibrato', preset: 'Singer' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', with a vibrato that comes late',
    },
    calm: {
      effects: [
        { deviceId: 'breath', preset: 'Calm breath', params: { in: 1.4, out: 2, air: 0.1 } },
      ],
      words: ', opening and closing like a breath',
    },
    sigh: {
      effects: [
        { deviceId: 'breath', preset: 'Long slow sigh', params: { out: 5, air: 0.15 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', in a long slow sigh',
    },
    water: {
      effects: [{ deviceId: 'currents', preset: 'Slow water', params: { rate: 0.22 } }],
      words: ', its colours moving like slow water',
    },
    ripples: {
      effects: [
        { deviceId: 'currents', preset: 'Ripples' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
        { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 0 } },
      ],
      words: ', rippling in bands',
    },
    light: {
      effects: [{ deviceId: 'glimmer', preset: 'Light on water' }],
      words: ', its partials catching the light',
    },
    twinkle: {
      effects: [
        { deviceId: 'glimmer', preset: 'Wide twinkle' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', twinkling wide',
    },
    soft: {
      effects: [{ deviceId: 'pulses', preset: 'Soft throb', params: { rate: 1.6 } }],
      words: ', in a soft slow throb',
    },
    weave: {
      effects: [
        { deviceId: 'pulses', preset: 'Wide weave', params: { mix: 0.8 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', in two pulses that drift apart',
    },
    low8: {
      effects: [{ deviceId: 'band-pulse', preset: 'Slow low pulse' }],
      words: ', its low band pulsing slowly',
    },
    flock: {
      effects: [{ deviceId: 'murmuration', preset: 'Evening flock', params: { mix: 0.4 } }],
      words: ', flying round in a small flock',
    },
    circle: {
      effects: [{ deviceId: 'around', preset: 'Slow circle' }],
      words: ', turning slowly round the head',
    },
    pendulum: {
      effects: [
        { deviceId: 'around', preset: 'Wide pendulum' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', swinging on a wide pendulum',
    },
    slowing: {
      effects: [{ deviceId: 'winding-down', preset: 'Three slowing' }],
      words: ', in pulses that seem to slow',
    },
    veil: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Thin veil', params: { mix: 0.4 } }],
      words: ', with a thin veil of grains',
    },
    choirgrain: {
      effects: [
        { deviceId: 'grain-cloud', preset: 'Choir of fifths', params: { mix: 0.25 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', with a cloud of fifths above',
    },
    sustain: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Clean sustain', params: { mix: 0.4 } }],
      words: ', its spectrum hanging on',
    },
    mist: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.4 } }],
      words: ', dissolving into hanging mist',
    },
    stretched: {
      effects: [{ deviceId: 'stretch', preset: 'Near shadow', params: { mix: 0.4 } }],
      words: ', with a slow stretched shadow',
    },
    sag: {
      effects: [{ deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.4 } }],
      words: ', sagging like warm wax',
    },
    evaporate: {
      effects: [{ deviceId: 'melt', preset: 'Evaporate', params: { mix: 0.35 } }],
      words: ', its tail evaporating upwards',
    },
    leaves: {
      effects: [{ deviceId: 'falling', preset: 'Falling leaves', params: { mix: 0.3 } }],
      words: ', with leaves falling off it',
    },
    mistup: {
      effects: [{ deviceId: 'falling', preset: 'Rising mist', params: { mix: 0.3 } }],
      words: ', with a mist rising off it',
    },
    dust: {
      effects: [
        { deviceId: 'glints', preset: 'Faint dust' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', with a faint bright dust',
    },
    sparks: {
      effects: [{ deviceId: 'glints', preset: 'Slow stars', params: { mix: 0.25 } }],
      words: ', throwing off slow sparks',
    },
    afterimage: {
      effects: [{ deviceId: 'generations', preset: 'Faint afterimage' }],
      words: ', with a faint afterimage in a room',
    },
    rain: {
      effects: [{ deviceId: 'weather', preset: 'Light rain', params: { voice: 0.25 } }],
      words: ', out in light rain',
    },
    surf: {
      effects: [{ deviceId: 'weather', preset: 'Slow surf', params: { voice: 0.2 } }],
      words: ', with a slow surf passing over',
    },
    under: {
      effects: [{ deviceId: 'underwater', preset: 'Just under', params: { bubbles: 0.2 } }],
      words: ', just under water',
    },
    shallows: {
      effects: [{ deviceId: 'underwater', preset: 'Sunlit shallows', params: { bubbles: 0.15 } }],
      words: ', in sunlit shallows',
    },
    ghost: {
      effects: [
        { deviceId: 'low-bitrate', preset: 'Ghost', params: { mix: 0.7 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', thinned like a starved signal',
    },
    floorhiss: {
      effects: [
        { deviceId: 'noise-floor', preset: 'Faint hiss' },
        { deviceId: 'tape', preset: 'Warm thump' },
      ],
      words: ', over faint tape hiss',
    },
    frozen: {
      effects: [
        { deviceId: 'sustainer', preset: 'Thin halo' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
        { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 0 } },
      ],
      words: ', over a halo that holds on',
    },
    strings: {
      effects: [
        { deviceId: 'pad-follower', preset: 'Barely there' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', with a soft pad growing behind',
    },
    sines: {
      effects: [
        { deviceId: 'sine-shadow', preset: 'Nearly dry' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', with pure tones swelling behind',
    },
    halfshadow: {
      effects: [
        { deviceId: 'half-speed', preset: 'Thin shadow' },
        { deviceId: 'ambient-eq', preset: 'Open' },
      ],
      words: ', with a half-speed shadow below',
    },
    hanging: {
      effects: [{ deviceId: 'common-tones', preset: 'Hanging notes', params: { mix: 0.5 } }],
      words: ', what stays the same hanging on',
    },
    frost: {
      effects: [{ deviceId: 'seasons', preset: 'First frost', params: { mix: 0.7 } }],
      words: ', in the first frost',
    },
    summer: {
      effects: [{ deviceId: 'seasons', preset: 'Touch of sun' }],
      words: ', with a touch of sun',
    },
    leaf: {
      effects: [
        { deviceId: 'seasons', preset: 'Dry leaves', params: { mix: 0.7 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', in dry leaves',
    },
    stumble: {
      effects: [
        { deviceId: 'glitch', preset: 'Gentle stumble', params: { mix: 0.7 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 0 } },
      ],
      words: ', with a gentle stumble now and then',
    },
    octave: {
      effects: [
        { deviceId: 'octaves', preset: 'Faint octave' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', with a faint octave beside it',
    },
    sub: {
      effects: [
        { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.4 } },
        { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 0 } },
      ],
      words: ', with an octave added below',
    },
    pipes: {
      effects: [
        { deviceId: 'stops', preset: 'Nearly dry' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', with soft organ stops over it',
    },
    silver: {
      effects: [{ deviceId: 'stops', preset: 'Sub and silver', params: { mix: 0.5 } }],
      words: ', doubled low and silver high',
    },
    fifthup: {
      effects: [
        { deviceId: 'pitch-shifter', preset: 'Fifth above', params: { mix: 0.25 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', with a soft fifth above',
    },
    hertz: {
      effects: [
        { deviceId: 'freq-shifter', preset: 'Slow drift', params: { mix: 0.4 } },
        { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 0 } },
      ],
      words: ', every partial drifting by hertz',
    },
    ringhalo: {
      effects: [{ deviceId: 'ring', preset: 'Faint halo', params: { mix: 0.22 } }],
      words: ', with a faint halo of sidebands',
    },
    chime: {
      effects: [{ deviceId: 'warp', preset: 'Soft chime' }],
      words: ', bent softly towards a chime',
    },
    stiff: {
      effects: [{ deviceId: 'warp', preset: 'Stiff string', params: { mix: 0.5 } }],
      words: ', its partials stretched apart',
    },
    whistle: {
      effects: [{ deviceId: 'overtone-singer', preset: 'Faint melody' }],
      words: ', with a whistled overtone above',
    },
    bloomup: {
      effects: [
        { deviceId: 'spectral-drifter', preset: 'Octave halo', params: { mix: 0.25 } },
        { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 0 } },
      ],
      words: ', an octave drifting in the tail',
    },
    howls: {
      effects: [{ deviceId: 'howl', preset: 'Faint sustain' }],
      words: ', leaning into a faint feedback',
    },
    scale: {
      effects: [
        { deviceId: 'scale-filter', preset: 'Lean to the key' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', leaning towards one key',
    },
    swellin: {
      effects: [
        { deviceId: 'swell', preset: 'Bowed' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', with every attack bowed away',
    },
    earturn: {
      effects: [
        { deviceId: 'ear-shift', preset: 'Slow turn' },
        { deviceId: 'ambient-eq', preset: 'Open' },
      ],
      words: ', turning slowly between the ears',
    },
  },
  phrases: {
    temple: {
      notes: [
        { atSec: 0, durSec: 5, note: 50, gain: 0.9 },
        { atSec: 2.4, durSec: 4, note: 57, gain: 0.72 },
        { atSec: 4.6, durSec: 2.6, note: 65, gain: 0.64 },
      ],
    },
    peal: {
      notes: [
        { atSec: 0, durSec: 1, note: 79, gain: 0.8 },
        { atSec: 0.5, durSec: 1, note: 77, gain: 0.72 },
        { atSec: 1, durSec: 1, note: 76, gain: 0.72 },
        { atSec: 1.5, durSec: 1, note: 74, gain: 0.72 },
        { atSec: 2, durSec: 1, note: 72, gain: 0.72 },
        { atSec: 2.5, durSec: 2, note: 67, gain: 0.8 },
        { atSec: 3.5, durSec: 1, note: 77, gain: 0.72 },
        { atSec: 4, durSec: 1, note: 79, gain: 0.72 },
        { atSec: 4.5, durSec: 1, note: 74, gain: 0.64 },
        { atSec: 5, durSec: 1, note: 76, gain: 0.64 },
        { atSec: 5.5, durSec: 1.8, note: 72, gain: 0.8 },
      ],
    },
    changes: {
      notes: [
        { atSec: 0, durSec: 1.2, note: 72, gain: 0.8 },
        { atSec: 0.7, durSec: 1.2, note: 69, gain: 0.72 },
        { atSec: 1.4, durSec: 1.2, note: 67, gain: 0.72 },
        { atSec: 2.1, durSec: 1.4, note: 65, gain: 0.72 },
        { atSec: 2.8, durSec: 1.2, note: 69, gain: 0.8 },
        { atSec: 3.5, durSec: 1.2, note: 72, gain: 0.72 },
        { atSec: 4.2, durSec: 1.2, note: 65, gain: 0.72 },
        { atSec: 4.9, durSec: 2.2, note: 67, gain: 0.8 },
      ],
    },
    twoparts: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 64, gain: 0.8 },
        { atSec: 0, durSec: 3.2, note: 48, gain: 0.72 },
        { atSec: 1.6, durSec: 0.8, note: 65, gain: 0.72 },
        { atSec: 2.4, durSec: 0.8, note: 67, gain: 0.72 },
        { atSec: 3.2, durSec: 1.6, note: 69, gain: 0.8 },
        { atSec: 3.2, durSec: 1.8, note: 53, gain: 0.72 },
        { atSec: 4.8, durSec: 1, note: 67, gain: 0.72 },
        { atSec: 5, durSec: 2.2, note: 50, gain: 0.64 },
        { atSec: 5.8, durSec: 1.5, note: 65, gain: 0.64 },
      ],
    },
    felt: {
      notes: [
        { atSec: 0, durSec: 1.2, note: 57, gain: 0.8 },
        { atSec: 0, durSec: 2.6, note: 45, gain: 0.64 },
        { atSec: 0.6, durSec: 1, note: 64, gain: 0.64 },
        { atSec: 1.2, durSec: 1, note: 67, gain: 0.64 },
        { atSec: 1.8, durSec: 1.4, note: 72, gain: 0.8 },
        { atSec: 2.8, durSec: 1, note: 71, gain: 0.64 },
        { atSec: 3.2, durSec: 2.8, note: 48, gain: 0.64 },
        { atSec: 3.4, durSec: 1, note: 67, gain: 0.64 },
        { atSec: 4, durSec: 1, note: 64, gain: 0.64 },
        { atSec: 4.6, durSec: 2, note: 69, gain: 0.72 },
      ],
    },
    cradle: {
      notes: [
        { atSec: 0, durSec: 1.4, note: 67, gain: 0.72 },
        { atSec: 0, durSec: 2.8, note: 48, gain: 0.56 },
        { atSec: 1.4, durSec: 0.7, note: 64, gain: 0.64 },
        { atSec: 2.1, durSec: 1.4, note: 69, gain: 0.72 },
        { atSec: 3.5, durSec: 0.7, note: 67, gain: 0.64 },
        { atSec: 2.8, durSec: 2.8, note: 53, gain: 0.56 },
        { atSec: 4.2, durSec: 1.4, note: 72, gain: 0.72 },
        { atSec: 5.6, durSec: 1.6, note: 67, gain: 0.64 },
      ],
    },
    plucks: {
      notes: [
        { atSec: 0, durSec: 0.3, note: 57, gain: 0.9 },
        { atSec: 0.4, durSec: 0.3, note: 64, gain: 0.8 },
        { atSec: 0.8, durSec: 0.3, note: 69, gain: 0.8 },
        { atSec: 1.2, durSec: 0.5, note: 72, gain: 0.9 },
        { atSec: 2, durSec: 0.3, note: 71, gain: 0.8 },
        { atSec: 2.4, durSec: 0.3, note: 64, gain: 0.8 },
        { atSec: 3.2, durSec: 0.3, note: 53, gain: 0.9 },
        { atSec: 3.6, durSec: 0.3, note: 60, gain: 0.8 },
        { atSec: 4, durSec: 0.3, note: 69, gain: 0.8 },
        { atSec: 4.4, durSec: 0.8, note: 67, gain: 0.88 },
        { atSec: 5.6, durSec: 1, note: 64, gain: 0.8 },
      ],
    },
    run: {
      notes: [
        { atSec: 0, durSec: 0.2, note: 60, gain: 0.9 },
        { atSec: 0.2, durSec: 0.2, note: 62, gain: 0.8 },
        { atSec: 0.4, durSec: 0.2, note: 64, gain: 0.8 },
        { atSec: 0.6, durSec: 0.2, note: 67, gain: 0.8 },
        { atSec: 0.8, durSec: 0.9, note: 69, gain: 0.9 },
        { atSec: 2, durSec: 0.2, note: 76, gain: 0.8 },
        { atSec: 2.2, durSec: 0.2, note: 74, gain: 0.8 },
        { atSec: 2.4, durSec: 0.2, note: 72, gain: 0.8 },
        { atSec: 2.6, durSec: 1, note: 69, gain: 0.88 },
        { atSec: 4, durSec: 0.3, note: 64, gain: 0.8 },
        { atSec: 4.4, durSec: 0.3, note: 67, gain: 0.8 },
        { atSec: 4.8, durSec: 1.8, note: 62, gain: 0.9 },
      ],
    },
    low: {
      notes: [
        { atSec: 0, durSec: 2.4, note: 38, gain: 0.9 },
        { atSec: 2.4, durSec: 1.2, note: 45, gain: 0.88 },
        { atSec: 3.6, durSec: 2, note: 36, gain: 0.9 },
        { atSec: 5.6, durSec: 1.7, note: 43, gain: 0.9 },
      ],
    },
    walk: {
      notes: [
        { atSec: 0, durSec: 0.8, note: 36, gain: 0.9 },
        { atSec: 0.9, durSec: 0.8, note: 43, gain: 0.9 },
        { atSec: 1.8, durSec: 0.8, note: 45, gain: 0.9 },
        { atSec: 2.7, durSec: 1.6, note: 41, gain: 0.9 },
        { atSec: 4.5, durSec: 0.6, note: 40, gain: 0.9 },
        { atSec: 5.1, durSec: 0.6, note: 38, gain: 0.9 },
        { atSec: 5.7, durSec: 1.6, note: 36, gain: 0.9 },
      ],
    },
    gong: {
      notes: [
        { atSec: 0, durSec: 4, note: 36, gain: 0.9 },
        { atSec: 3.4, durSec: 3.8, note: 48, gain: 0.8 },
        { atSec: 5, durSec: 2.2, note: 55, gain: 0.64 },
      ],
    },
    vesper: {
      notes: [
        { atSec: 0, durSec: 3.6, note: 50, gain: 0.8 },
        { atSec: 0, durSec: 3.5, note: 57, gain: 0.68 },
        { atSec: 0.2, durSec: 3.4, note: 65, gain: 0.64 },
        { atSec: 0.4, durSec: 4.8, note: 72, gain: 0.64 },
        { atSec: 3.6, durSec: 3.7, note: 48, gain: 0.8 },
        { atSec: 3.5, durSec: 3.7, note: 57, gain: 0.68 },
        { atSec: 3.6, durSec: 3.6, note: 64, gain: 0.64 },
        { atSec: 5.2, durSec: 2.1, note: 71, gain: 0.6 },
      ],
    },
    suspend: {
      notes: [
        { atSec: 0, durSec: 7, note: 48, gain: 0.64 },
        { atSec: 0, durSec: 3, note: 60, gain: 0.72 },
        { atSec: 1.2, durSec: 2.6, note: 67, gain: 0.72 },
        { atSec: 2.6, durSec: 1.8, note: 65, gain: 0.64 },
        { atSec: 3.2, durSec: 2.2, note: 59, gain: 0.64 },
        { atSec: 4.4, durSec: 2.8, note: 64, gain: 0.72 },
        { atSec: 5.2, durSec: 2.1, note: 60, gain: 0.64 },
      ],
    },
    chant: {
      notes: [
        { atSec: 0, durSec: 1.4, note: 62, gain: 0.88 },
        { atSec: 1.3, durSec: 0.9, note: 64, gain: 0.8 },
        { atSec: 2.1, durSec: 1.4, note: 65, gain: 0.88 },
        { atSec: 3.4, durSec: 0.9, note: 67, gain: 0.8 },
        { atSec: 4.2, durSec: 1.2, note: 64, gain: 0.8 },
        { atSec: 5.3, durSec: 1.9, note: 62, gain: 0.88 },
      ],
    },
    organum: {
      notes: [
        { atSec: 0, durSec: 1.8, note: 50, gain: 0.8 },
        { atSec: 0, durSec: 1.8, note: 57, gain: 0.8 },
        { atSec: 1.7, durSec: 1.6, note: 52, gain: 0.8 },
        { atSec: 1.7, durSec: 1.6, note: 59, gain: 0.8 },
        { atSec: 3.2, durSec: 1.8, note: 53, gain: 0.8 },
        { atSec: 3.2, durSec: 1.8, note: 60, gain: 0.8 },
        { atSec: 4.9, durSec: 2.3, note: 50, gain: 0.8 },
        { atSec: 4.9, durSec: 2.3, note: 57, gain: 0.8 },
      ],
    },
    call: {
      notes: [
        { atSec: 0, durSec: 1.4, note: 69, gain: 0.9 },
        { atSec: 1.2, durSec: 1, note: 72, gain: 0.8 },
        { atSec: 2.4, durSec: 1.6, note: 48, gain: 0.88 },
        { atSec: 2.4, durSec: 1.6, note: 55, gain: 0.8 },
        { atSec: 4, durSec: 1.2, note: 71, gain: 0.88 },
        { atSec: 5, durSec: 0.8, note: 67, gain: 0.8 },
        { atSec: 5.8, durSec: 1.5, note: 45, gain: 0.88 },
      ],
    },
    answer: {
      notes: [
        { atSec: 0, durSec: 2, note: 74, gain: 0.8 },
        { atSec: 1, durSec: 2, note: 62, gain: 0.8 },
        { atSec: 2.4, durSec: 2, note: 72, gain: 0.8 },
        { atSec: 3.4, durSec: 2, note: 57, gain: 0.8 },
        { atSec: 4.8, durSec: 2.4, note: 69, gain: 0.8 },
        { atSec: 5.6, durSec: 1.7, note: 53, gain: 0.8 },
      ],
    },
    drone: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 38, gain: 0.88 },
        { atSec: 0.4, durSec: 6.8, note: 45, gain: 0.72 },
        { atSec: 1.2, durSec: 6, note: 52, gain: 0.64 },
      ],
    },
    fifth: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 43, gain: 0.8 },
        { atSec: 0.2, durSec: 7, note: 50, gain: 0.72 },
        { atSec: 2.6, durSec: 4.6, note: 62, gain: 0.64 },
        { atSec: 4, durSec: 3.2, note: 64, gain: 0.56 },
      ],
    },
    stars: {
      notes: [
        { atSec: 0, durSec: 2, note: 84, gain: 0.72 },
        { atSec: 1.3, durSec: 2, note: 79, gain: 0.64 },
        { atSec: 2.6, durSec: 2, note: 88, gain: 0.56 },
        { atSec: 4.2, durSec: 2, note: 86, gain: 0.64 },
        { atSec: 5.4, durSec: 1.8, note: 76, gain: 0.64 },
      ],
    },
    alone: { notes: [{ atSec: 0, durSec: 6, note: 57, gain: 0.9 }] },
    wood: {
      notes: [
        { atSec: 0, durSec: 0.2, note: 60, gain: 0.9 },
        { atSec: 0.3, durSec: 0.2, note: 67, gain: 0.8 },
        { atSec: 0.6, durSec: 0.2, note: 64, gain: 0.8 },
        { atSec: 0.9, durSec: 0.2, note: 60, gain: 0.9 },
        { atSec: 1.2, durSec: 0.2, note: 67, gain: 0.8 },
        { atSec: 1.5, durSec: 0.2, note: 69, gain: 0.8 },
        { atSec: 1.8, durSec: 0.2, note: 72, gain: 0.9 },
        { atSec: 2.4, durSec: 0.2, note: 57, gain: 0.9 },
        { atSec: 2.7, durSec: 0.2, note: 64, gain: 0.8 },
        { atSec: 3, durSec: 0.2, note: 60, gain: 0.8 },
        { atSec: 3.3, durSec: 0.2, note: 57, gain: 0.9 },
        { atSec: 3.6, durSec: 0.2, note: 64, gain: 0.8 },
        { atSec: 3.9, durSec: 0.2, note: 67, gain: 0.8 },
        { atSec: 4.2, durSec: 0.2, note: 69, gain: 0.9 },
        { atSec: 4.8, durSec: 0.2, note: 53, gain: 0.9 },
        { atSec: 5.1, durSec: 0.2, note: 60, gain: 0.8 },
        { atSec: 5.4, durSec: 0.2, note: 64, gain: 0.88 },
        { atSec: 5.7, durSec: 1, note: 72, gain: 0.9 },
      ],
    },
    talk: {
      notes: [
        { atSec: 0, durSec: 0.25, note: 62, gain: 0.9 },
        { atSec: 0.4, durSec: 0.15, note: 62, gain: 0.8 },
        { atSec: 0.6, durSec: 0.5, note: 65, gain: 0.9 },
        { atSec: 1.5, durSec: 0.25, note: 60, gain: 0.9 },
        { atSec: 1.9, durSec: 0.5, note: 57, gain: 0.9 },
        { atSec: 3, durSec: 0.2, note: 62, gain: 0.9 },
        { atSec: 3.3, durSec: 0.2, note: 64, gain: 0.8 },
        { atSec: 3.6, durSec: 0.2, note: 62, gain: 0.8 },
        { atSec: 3.9, durSec: 0.7, note: 69, gain: 0.9 },
        { atSec: 5.1, durSec: 0.3, note: 67, gain: 0.88 },
        { atSec: 5.6, durSec: 1.2, note: 62, gain: 0.9 },
      ],
    },
    rain: {
      notes: [
        { atSec: 0, durSec: 0.6, note: 81, gain: 0.8 },
        { atSec: 0.7, durSec: 0.6, note: 76, gain: 0.64 },
        { atSec: 1.9, durSec: 0.6, note: 79, gain: 0.72 },
        { atSec: 2.3, durSec: 0.6, note: 72, gain: 0.64 },
        { atSec: 3.4, durSec: 0.6, note: 83, gain: 0.64 },
        { atSec: 4.6, durSec: 0.6, note: 74, gain: 0.72 },
        { atSec: 5, durSec: 0.6, note: 77, gain: 0.64 },
        { atSec: 6.2, durSec: 0.9, note: 69, gain: 0.72 },
      ],
    },
    treble: {
      notes: [
        { atSec: 0, durSec: 1.3, note: 67, gain: 0.8 },
        { atSec: 1.2, durSec: 1.2, note: 71, gain: 0.76 },
        { atSec: 2.3, durSec: 1.7, note: 72, gain: 0.84 },
        { atSec: 3.9, durSec: 0.7, note: 69, gain: 0.72 },
        { atSec: 4.5, durSec: 0.9, note: 71, gain: 0.76 },
        { atSec: 5.3, durSec: 2, note: 67, gain: 0.8 },
      ],
    },
    canon: {
      notes: [
        { atSec: 0, durSec: 0.9, note: 60, gain: 0.8 },
        { atSec: 0.85, durSec: 0.9, note: 64, gain: 0.76 },
        { atSec: 1.7, durSec: 0.9, note: 67, gain: 0.8 },
        { atSec: 1.7, durSec: 0.9, note: 48, gain: 0.72 },
        { atSec: 2.55, durSec: 0.9, note: 72, gain: 0.8 },
        { atSec: 2.55, durSec: 0.9, note: 52, gain: 0.68 },
        { atSec: 3.4, durSec: 0.9, note: 71, gain: 0.76 },
        { atSec: 3.4, durSec: 0.9, note: 55, gain: 0.7 },
        { atSec: 4.25, durSec: 0.9, note: 69, gain: 0.76 },
        { atSec: 4.25, durSec: 0.9, note: 60, gain: 0.68 },
        { atSec: 5.1, durSec: 0.9, note: 67, gain: 0.76 },
        { atSec: 5.1, durSec: 0.9, note: 59, gain: 0.68 },
        { atSec: 5.95, durSec: 1.4, note: 64, gain: 0.72 },
        { atSec: 5.95, durSec: 1.4, note: 57, gain: 0.68 },
      ],
    },
    hymn: {
      notes: [
        { atSec: 0, durSec: 1.8, note: 48, gain: 0.72 },
        { atSec: 0, durSec: 1.8, note: 64, gain: 0.64 },
        { atSec: 0, durSec: 1.8, note: 67, gain: 0.72 },
        { atSec: 1.8, durSec: 1.8, note: 45, gain: 0.72 },
        { atSec: 1.8, durSec: 1.8, note: 64, gain: 0.64 },
        { atSec: 1.8, durSec: 1.8, note: 69, gain: 0.72 },
        { atSec: 3.6, durSec: 1.8, note: 53, gain: 0.72 },
        { atSec: 3.6, durSec: 1.8, note: 60, gain: 0.64 },
        { atSec: 3.6, durSec: 1.8, note: 69, gain: 0.72 },
        { atSec: 5.4, durSec: 1.9, note: 55, gain: 0.72 },
        { atSec: 5.4, durSec: 1.9, note: 59, gain: 0.64 },
        { atSec: 5.4, durSec: 1.9, note: 67, gain: 0.72 },
      ],
    },
    chain: {
      notes: [
        { atSec: 0, durSec: 1.8, note: 57, gain: 0.72 },
        { atSec: 0, durSec: 2.6, note: 72, gain: 0.8 },
        { atSec: 1.8, durSec: 1.8, note: 55, gain: 0.72 },
        { atSec: 2.6, durSec: 1.8, note: 71, gain: 0.72 },
        { atSec: 3.6, durSec: 1.8, note: 53, gain: 0.72 },
        { atSec: 4.4, durSec: 1.8, note: 69, gain: 0.72 },
        { atSec: 5.4, durSec: 1.9, note: 52, gain: 0.72 },
        { atSec: 6.2, durSec: 1.1, note: 67, gain: 0.68 },
      ],
    },
  },
  directions: [
    {
      id: 'temple-syllable',
      name: 'Temple syllables',
      category: 'bell',
      rows: `
First light at the gate | Temple syllable | word=Ah_oh_oo speak=7 hum=.5 stray=.9 point=.95 wear=.15 beat=1.2 tract=-1 mallet=Wood hardness=.45 ring=36 clarity=.8 air=.2 volume=2 | hall | temple | A great raw bell under a wooden beam says ah, oh, oo over seven seconds
Rope through the ceiling | Temple syllable | word=Ay_ma speak=3 stray=.4 hardness=.9 beat=1.4 point=.1 clarity=.55 contagion=.1 width=.55 volume=.5 | stairwell | answer | A cast bell struck hard says ay ma and turns in a slow beat
Incense before rain | Temple syllable | word=Hush hardness=.35 air=.4 wear=.6 tract=-3 point=.9 clarity=.8 stagger=.95 volume=3.5 | bare | alone | A soft stroke that opens to ah and goes off in a hush of air
Pilgrim on the steps | Temple syllable | word=Seem speak=3.5 tract=2 hum=.15 ring=20 point=.6 contagion=.2 stagger=.85 air=.25 width=.75 volume=-.5 | chamber | chant | A lighter bell says seem, from a bright ee down to shut lips
Moss on the bell frame | Temple syllable | wear=.9 hum=.7 tract=-5 hardness=.4 word=Home point=.7 beat=.2 swell=.08 clarity=.65 contagion=.2 stagger=.75 air=.35 width=1 volume=-1.5 | dark | temple | A worn bell gone dark and round says home over a deep hum
Green copper roof | - | metal=Bell stray=1 mallet=Wood hardness=.6 hum=.1 sing=0 ring=24 wear=.15 release=0 stagger=.95 beat=.5 air=.25 width=.9 volume=6 | valley | peal | Raw metal under a wooden stick rings ah, oh, oo and keeps its edge
Crow on the bell tower | - | metal=Bell stray=.9 mallet=Wood hardness=.85 point=.9 clarity=.5 word=Nay_nay speak=2 sing=.1 knock=.5 ring=16 hum=.45 stagger=.85 wear=.4 beat=1.8 air=.3 width=.9 volume=6 | strikes | call | A hard stick at the waist of a raw bell, half saying nay nay
Splinters of midday | - | metal=Bell stray=1 mallet=Wood hardness=.4 word=We speak=1.2 tract=3 clarity=1 hum=0 beat=3 ring=10 point=1 stagger=.95 wear=.65 volume=3.5 | slap | changes | A raw bell under wood says we quickly, with a fast shake
Iron gate at dusk | - | metal=Bell stray=.85 mallet=Wood hardness=.3 word=Noon speak=6 hum=.55 point=.1 sing=.2 wear=.7 tract=-6 clarity=.8 contagion=-.2 stagger=.45 knock=.1 volume=6 | pane 3.outputGain=7.5 | gong | A raw low mouth says noon, most of it behind shut lips
Dry well in August | - | metal=Bell stray=.95 mallet=Wood hardness=.7 clarity=.2 ring=7 wear=.65 release=.4 knock=.6 hum=.3 contagion=.8 stagger=.55 beat=.9 width=.55 volume=.5 | bottle | plucks | A short raw bell with a wooden knock and hardly a vowel
Shaded courtyard gong | - | metal=Plate hardness=.35 stray=.5 word=Ah_oh_oo speak=4 hum=.4 ring=26 width=1 swell=.06 point=.9 clarity=.95 contagion=-.3 stagger=.65 wear=.3 beat=2.8 air=.2 knock=0 volume=6 | shaded | temple | A plate under soft felt blooms into ah and closes to oo
Monsoon on brass | - | metal=Plate hardness=.7 stray=.9 word=Whoosh air=.5 speak=2.6 ring=20 width=1 point=.65 stagger=.85 wear=.3 beat=.3 volume=1.5 | rain | vesper | A raw plate that says whoosh, half of it wind
Saffron at the window | - | metal=Plate stray=.1 hardness=.5 word=We tract=1 speak=3.6 beat=1 sing=.4 point=.35 clarity=.9 stagger=.8 wear=.15 air=.2 width=.85 knock=.45 volume=4.5 | ensemble | answer | A tuned plate opens from oo to ee on every stroke
Elephant road | - | metal=Plate mallet=Wood hardness=.55 tract=-8 hum=.6 ring=12 knock=.4 word=Nay_nay speak=3 wear=.6 clarity=.9 beat=.8 air=.2 volume=6 | shore 2.gain=8 | answer | A wooden clapper in a wide plate says nay nay from a giant's mouth
Lacquer and brass | - | metal=Plate tract=-4 word=Ay_ma speak=5 hum=.5 ring=22 mallet=Felt hardness=.3 wear=.9 stray=.2 swell=.06 stagger=.7 beat=1.4 air=.35 width=.7 volume=6 | springs | organum | A worn plate under soft felt slowly says ay ma, low in the mouth
Handbell in a sleeve | - | metal=Bell stray=.2 hardness=.5 tract=6 ring=5 release=.6 hum=0 word=Ah_oh_oo speak=1 width=.4 sing=.2 swell=.1 clarity=.9 beat=1 volume=-.5 | narrow | treble | A small muffled bell with a child's mouth says ah, oh, oo in a second
Sheep going up | - | metal=Bell stray=.7 mallet=Wood hardness=.75 tract=8 ring=2.5 hum=0 word=Nay_nay speak=.8 sing=0 knock=.35 release=.3 wear=.6 point=.35 clarity=.85 beat=3.2 air=.1 volume=6 | valley 2.mix=.15 3.gain=10.5 | rain | Little bells under wood that bleat nay nay and stop short
Brass thimble | - | metal=Bell mallet=Nail hardness=.15 ring=3 wear=.7 hum=0 word=We speak=.6 sing=0 beat=0 tract=7 stray=.1 clarity=1 point=.25 contagion=.5 air=.1 width=.55 volume=6 | tin | run | A nail on a tiny tuned bell says one quick we
Doorbell on Sunday | - | metal=Bell stray=0 hardness=.65 tract=3 ring=8 hum=.05 word=Home speak=1.8 beat=.2 clarity=.9 release=.2 point=.6 contagion=1 stagger=.75 width=.4 volume=-3.5 | kitchen | call | A tuned small bell says home and shuts its lips
Sleigh in the pines | - | metal=Bell stray=.6 mallet=Nail hardness=.3 tract=0 ring=4 beat=7 hum=0 sing=0 word=Hush speak=1.4 air=.4 width=1 point=.65 clarity=.7 contagion=-.3 stagger=.7 wear=.75 volume=6 | frost | rain | Nails on shaken bells that hiss as they fade
An hour for one word | - | metal=Bell hardness=.35 word=Ah_oh_oo speak=20 ring=40 sing=.5 hum=.4 release=0 wear=.2 swell=.04 point=.95 clarity=.6 contagion=0 stagger=.9 beat=2.1 air=.2 width=.6 knock=0 volume=-1 | open | alone | One soft stroke that takes twenty seconds over ah, oh, oo
Valley in no hurry | - | metal=Bell hardness=.35 word=Home speak=14 ring=36 tract=-4 beat=.2 stagger=.9 hum=.6 release=0 stray=.9 point=0 wear=.2 clarity=.75 contagion=.8 width=.5 volume=-4.5 | climb | vesper | Low raw bells struck at the rim, home said far apart in time
Reading the long scroll | - | metal=Bell hardness=.6 word=We speak=9 sing=.7 stray=.2 ring=30 tract=-2 clarity=1 stagger=.1 swell=.1 point=.7 contagion=.8 wear=.85 beat=2 air=.15 width=.65 volume=-2.5 | reel | chant | Nine seconds from a round oo to a bright ee on tuned bronze
Unmoving candle | - | metal=Bell hardness=.2 word=Hum speak=10 ring=40 stray=.3 hum=.3 beat=.15 air=.05 width=.3 contagion=.8 knock=.05 volume=0 | sides | suspend | A softly struck bell that hums with its lips closed
Monks at the far end | - | metal=Bell hardness=.45 word=Ay_ma speak=7 hum=.5 tract=-6 stray=.1 sing=.8 air=.25 swell=.08 point=.4 clarity=.85 stagger=.4 knock=.3 volume=-2 | monks | organum | Low tuned bells say ay ma over seven seconds with some breath
Town hall carillon | - | metal=Bell stray=0 clarity=1 hardness=.7 hum=.1 beat=0 word=Ah_oh_oo speak=1.6 ring=14 stagger=0 swell=.08 point=.4 knock=.3 volume=-.5 | brightplate | peal | Bells tuned to the harmonics say ah, oh, oo together
Market day chimes | - | metal=Bell stray=0 mallet=Wood hardness=.6 word=We speak=.9 tract=2 ring=9 beat=1.5 contagion=0 point=.35 clarity=.9 stagger=.5 knock=.05 volume=6 | dotted | changes | Tuned bells under wood say we once a second
Plain tune at ten | - | metal=Bell stray=0 mallet=Felt hardness=.9 knock=0 word=Nay_nay speak=1.5 hum=0 sing=.1 ring=16 wear=.7 point=.15 clarity=.55 stagger=.6 beat=1 air=.3 width=.6 volume=1 | bright 2.gain=4.5 | canon | Tuned bells under hard felt open and close their mouths twice
Clockwork saint | - | metal=Bell stray=.05 mallet=Nail hardness=.4 word=Seem speak=1 ring=6 beat=0 release=.3 width=.2 hum=.5 wear=.8 clarity=.6 tract=-5 point=.3 contagion=-.5 stagger=.7 volume=3.5 | parlour | run | A nail on tuned bells that closes from ee in a second
Four quarters and a hum | - | metal=Bell stray=0 hardness=.4 hum=1 word=Noon speak=3 clarity=1 ring=24 tract=-2 swell=.08 point=.95 contagion=.5 stagger=.3 air=.1 width=.85 knock=.35 | blanket | changes | Tuned bells with the full octave under them say noon
Bell with no tongue | Unspoken bell | hardness=.5 point=.5 ring=20 stagger=.8 volume=2 | bare | temple | A plain cast bell under wood that says nothing at all
Cracked rim | Unspoken bell | stray=1 hardness=.8 beat=4 ring=6 wear=.45 mallet=Nail point=.05 contagion=1 air=0 width=.85 knock=.3 | grit | call | A raw bell flicked at the rim, shaking and wordless
Fog signal bell | Unspoken bell | mallet=Felt hardness=.25 hum=.9 tract=0 wear=.8 ring=34 point=.1 swell=.06 stagger=.8 air=.05 width=.25 volume=-4.5 | fogged | gong | A dark wordless bell under felt with a great hum
Pewter morning | Unspoken bell | metal=Plate clarity=.15 hardness=.45 mallet=Felt hum=.1 beat=.4 swell=.08 contagion=.6 stagger=.8 width=.35 volume=-.5 | water | vesper | A plate left almost unspoken, blooming late
Noon in the greenhouse | Unspoken bell | metal=Glass clarity=.1 hardness=.8 hum=0 wear=0 ring=16 contagion=1 width=.35 knock=.3 volume=6 | glimmer | stars | Hard wood on glass, kept bright and wordless
Shaken at the altar | Shaken bell | beat=5 hardness=.6 tract=2 word=Ay_ma swell=.08 point=.15 contagion=.6 stagger=.25 air=.2 knock=.2 volume=1.5 | chamber 1.mix=.12 | peal | Shaken bells with half a vowel say ay ma
Trembling bronze | Shaken bell | beat=8 stray=.3 clarity=.9 word=Ah_oh_oo speak=5 ring=24 hum=.3 tract=-3 sing=.5 point=.7 stagger=.8 air=.1 volume=6 | sweep | temple | Bronze that trembles as fast as it can while it says ah, oh, oo
Alarm, long ago | Shaken bell | beat=7 mallet=Wood hardness=.9 ring=5 clarity=.7 tract=0 word=Nay_nay speak=.6 point=.4 stagger=.6 volume=6 | shortwave 2.gain=8 | talk | A shaken bell under hard wood says nay nay over and over
Horse at the tram stop | Shaken bell | beat=3.5 mallet=Nail hardness=.25 tract=-2 ring=3.5 wear=.5 word=Home speak=.9 contagion=.5 knock=.25 volume=3 | platform | changes | A nail on a shaking bell says home and is gone
Aspen in a bell | Shaken bell | beat=5.5 metal=Glass stray=.4 hardness=.4 word=Whoosh air=.6 speak=2 swell=.06 point=.1 contagion=0 stagger=.9 knock=.1 volume=6 | twinkle | stars | Shaken glass that says whoosh, all flutter and air
Under the river bed | - | metal=Bell wear=1 tract=-9 hum=.8 hardness=.15 word=Home speak=8 ring=40 release=0 stray=.9 beat=1.5 point=.8 clarity=.85 stagger=.85 volume=2.5 | under | gong | A bell worn down to its lowest tones says home from a giant's mouth
Rope worn to a thread | - | metal=Bell wear=.95 tract=-7 hum=.5 hardness=.7 word=Ay_ma speak=2.4 ring=20 knock=.5 point=.5 clarity=.95 beat=1.2 volume=.5 | giant | answer | A worn bell struck hard with a thump says a dark ay ma
Root cellar bell | - | metal=Bell wear=.85 tract=-5 hum=1 hardness=.3 word=Hum ring=30 beat=.8 clarity=1 mallet=Wood point=.7 stagger=.85 air=.1 width=.3 volume=5.5 | cave | temple | A dark bell that only hums, with the octave under it full
Peat fire banked low | - | metal=Bell wear=1 tract=-4 hum=.35 mallet=Breath swell=.4 air=.7 word=Hush speak=4 sing=.8 point=.15 contagion=.6 stagger=.2 beat=1.3 width=.9 volume=.5 | leather | suspend | A worn bell woken by breath says hush over a low hum
Anchor lifted slowly | - | metal=Plate wear=.9 hum=.7 speak=4 ring=30 beat=1.2 stray=.9 word=Home hardness=.65 tract=-6 clarity=.7 point=.4 stagger=.4 knock=.3 volume=4.5 | coil | gong | A dark raw plate under hard felt that says home deep in the mouth
Hand laid on bronze | - | metal=Bell release=1 ring=30 hardness=.6 word=Ah_oh_oo speak=1.2 sing=.9 hum=.1 swell=.1 point=.25 clarity=.7 contagion=.8 stagger=.3 wear=.05 beat=.1 air=.3 width=.75 volume=-4 | room | talk | A bell stopped by the hand the moment the key comes up
Counting under breath | - | metal=Bell release=.9 ring=2 hardness=.3 mallet=Felt word=Seem speak=.5 hum=.4 clarity=1 sing=0 tract=-3 stagger=.55 wear=.4 beat=.2 air=.3 width=.6 knock=.35 volume=-1.5 | near | plucks | Short damped strokes that say seem in half a second
Cloth between strokes | - | metal=Bell release=.8 ring=4 mallet=Wood hardness=.15 wear=.9 word=Home speak=.7 hum=.2 knock=.45 clarity=.85 stagger=.7 beat=.6 air=.35 width=.7 volume=.5 | felted | wood | Soft wood on a bell under cloth, home and shut
Muffled for the night | - | metal=Plate release=.85 ring=1.5 hardness=.25 hum=.5 word=Noon speak=.8 tract=-6 sing=0 clarity=.8 stagger=.5 wear=.4 beat=.2 air=.3 width=.6 knock=.35 volume=6 | blunt 2.gain=6.5 | wood | A damped plate that says noon in under a second
Stopped with two fingers | - | metal=Bell release=1 ring=10 mallet=Nail hardness=.5 tract=2 word=We speak=.4 sing=.8 stray=.8 point=.7 contagion=.8 stagger=.3 beat=.4 air=.25 width=.85 volume=-.5 | bounces | talk | A flicked bell says we twice a second and is stopped dead
`,
    },
    {
      id: 'felt-keys',
      name: 'Felt keys',
      category: 'keys',
      rows: `
Practice upstairs | Felt keys | hardness=.2 speak=2.2 hum=.2 ring=14 point=.45 clarity=.95 air=.05 | nextdoor | felt | Wooden bars under soft felt say ah, oh, oo in two seconds
Slippers on the pedals | Felt keys | hardness=.45 word=Home speak=1.2 tract=-3 knock=.5 beat=.6 volume=0 | floorhiss | twoparts | Bars that say a low home under a felt head with a thump
Paper lamp | Felt keys | word=We speak=2.8 tract=2 hum=0 point=.7 sing=.7 swell=.04 clarity=.95 stagger=.2 wear=.3 beat=.1 air=.05 volume=3 | booth | treble | Wooden bars that open slowly from oo to ee
Fingerless gloves | Felt keys | hardness=.1 clarity=.5 hum=.35 wear=.7 ring=20 swell=.04 point=.5 stagger=.05 beat=1 | deep | felt | The softest felt on bars, half spoken, with a hum under each key
Crumbs on the piano lid | Felt keys | word=Nay_nay speak=.9 stray=1 hardness=.6 ring=7 knock=.4 point=.05 clarity=.65 wear=.15 beat=.2 volume=6 | parlour 3.gain=8 | twoparts | Raw bars that say nay nay in under a second
Evening by the stove | - | metal=Harmonic stray=0 mallet=Felt hardness=.3 ring=9 sing=.4 beat=.3 word=Ah_oh_oo speak=1.8 release=.6 contagion=0 width=.4 point=.8 wear=.85 clarity=.6 hum=.4 swell=.06 stagger=.6 air=.3 knock=.2 volume=-2 | reel | canon | A worn tuned body under felt closes from ah to oo over its hum
Sewing room upright | - | metal=Harmonic stray=.15 hardness=.5 ring=6 sing=.2 hum=.05 beat=1.2 word=Home speak=1 release=.7 knock=.5 tract=-2 point=.65 clarity=.75 contagion=-.3 stagger=.7 wear=.75 volume=1.5 | box | felt | A tuned body whose tones beat says home and stops with the key
Blue hour sonatina | - | metal=Harmonic stray=.2 hardness=.55 ring=18 sing=.3 word=We speak=1.4 tract=-4 release=.5 hum=0 beat=.6 wear=.6 swell=.08 point=.15 stagger=.05 air=.3 knock=.4 volume=5 | longplate | twoparts | A felted body low in the throat says we and darkens as it rings
Letters kept in a bench | - | stray=.1 hardness=.12 ring=12 word=Hum sing=.6 release=.4 beat=.2 air=.2 metal=Harmonic point=.9 hum=.5 clarity=.8 stagger=.7 wear=.05 volume=-9 | blanket | canon | Very soft keys with the lips shut and a little breath
Piano under a sheet | - | metal=Harmonic stray=.3 hardness=.4 ring=10 word=Noon speak=2.4 clarity=1 sing=.5 release=.5 hum=.15 swell=.08 point=.2 contagion=.7 air=.25 width=.8 knock=.15 volume=6 | felted | felt | Felted keys that close their lips at once and open late, saying noon
Milk glass keys | - | metal=Glass hardness=.15 ring=6 sing=.4 word=Ah_oh_oo speak=2 release=.5 hum=.1 beat=.3 contagion=.5 wear=.7 air=.3 knock=.2 volume=0 | tones | felt | Glass under very soft felt, a round ah to oo
Hotel bar at four | - | metal=Glass stray=.1 hardness=.4 ring=4 sing=.3 word=We speak=.8 tract=-6 release=.6 hum=.3 beat=2.2 stagger=.75 wear=.15 air=.35 width=.75 volume=2 | throb | felt | Glass tuned to the key, low in the mouth, beating as it says we
Ice down the stairs | - | metal=Glass stray=.8 hardness=.55 ring=2 sing=0 word=Nay_nay speak=.7 tract=3 release=.4 hum=0 point=.95 clarity=.8 stagger=.9 wear=.3 beat=1.9 volume=6 | pendulum 3.gain=4 | run | Short bright glass keys that say nay nay
Breakfast in May | - | metal=Glass hardness=.3 ring=9 word=Home speak=1.6 hum=.4 release=.35 contagion=.9 stagger=0 swell=.04 point=.65 clarity=.75 wear=.8 beat=2.1 air=.05 width=.4 knock=.15 volume=1 | summer | twoparts | Soft glass keys that agree on every vowel and say home
Seat by the heater | - | metal=Glass stray=.3 mallet=Wood hardness=.2 ring=5 word=Ay_ma speak=3 release=.3 hum=.15 sing=.8 width=1 clarity=.9 contagion=.6 stagger=.9 volume=6 | ensemble 2.outputGain=12 | cradle | Glass under soft wood says ay ma, held by the key
Tines at closing time | - | metal=Bell stray=0 hardness=.35 ring=8 sing=.45 beat=.4 word=Ah_oh_oo speak=1.2 release=.7 wear=.7 contagion=0 tract=5 hum=.25 swell=.06 point=.85 clarity=.65 stagger=.25 air=.05 width=.4 knock=.2 volume=-1 | triode | canon | Small-mouthed tuned bells under felt, rounded quickly from ah to oo
Suitcase by the door | - | metal=Bell stray=0 hardness=.6 ring=5 sing=.3 hum=0 beat=0 word=We speak=.6 tract=-5 release=.7 knock=.1 swell=.1 clarity=.95 volume=5 | spin | felt | Tuned bells that say we low in the throat at each key
Elevator to the roof | - | metal=Bell stray=.1 hardness=.25 ring=12 word=Home speak=2 sing=.6 release=.5 beat=1 width=.9 hum=.2 swell=.1 clarity=.9 | chorale | hymn | Tuned bells under soft felt say home
Dial tone serenade | - | metal=Bell stray=0 hardness=.45 ring=6 clarity=1 word=Seem speak=1 tract=1 release=.6 hum=.4 beat=0 sing=.4 swell=.08 point=.1 wear=.6 air=.3 knock=.5 volume=6 | phone 2.gain=7.5 | talk | Tuned bells that close from ee to shut lips
The corner table | - | metal=Bell stray=.15 mallet=Wood hardness=.12 ring=4 word=Ay_ma speak=.8 hum=.15 release=.8 contagion=0 wear=.8 point=.55 clarity=.8 stagger=.75 air=.35 width=1 volume=3.5 | combo | twoparts | Short tuned bells under soft wood say ay ma
Moth at the piano | Felt keys | metal=Harmonic hardness=.4 beat=5 word=Ah_oh_oo speak=3 sing=.6 stray=.1 tract=-5 point=.1 swell=.1 clarity=.85 stagger=.05 wear=.5 air=.1 volume=4 | harmonic | felt | A tuned body under felt whose halves flutter against each other
Swing seat | Felt keys | metal=Bell stray=.2 hardness=.3 word=Home ring=16 release=.2 point=.25 stagger=.55 wear=.8 air=.2 volume=3.5 | panned | canon | Soft bells that say home in a second and a half
Pulse of the desk lamp | Felt keys | metal=Glass hardness=.4 word=Noon speak=1.2 sing=.7 beat=.1 volume=4.5 | soft | hymn | Glass under felt that shuts and opens its lips
Trembling sugar | Felt keys | hardness=.55 word=We speak=.5 beat=2 stray=.2 ring=8 swell=.04 point=.4 clarity=.75 stagger=.55 wear=.85 air=.15 volume=0 | shudder | run | Bars that say we twice a second under felt
Boat engine lullaby | Felt keys | tract=-4 hum=.5 word=Ah_oh_oo speak=2.4 ring=8 release=.5 hardness=.5 metal=Bell stray=.5 clarity=.8 swell=.1 beat=.2 air=.25 volume=-.5 | chop | felt | A felted bell with its hum says ah, oh, oo in a large mouth
Sighs between chords | - | mallet=Breath swell=.08 air=.5 ring=6 sing=.6 speak=1.6 release=.5 knock=.4 metal=Bell stray=.1 word=Home hum=.2 tract=-3 clarity=.95 beat=.8 volume=-2 | room | vesper | A puff of breath wakes tuned bells that say home
Frost on the keyboard | - | metal=Glass mallet=Breath stray=.5 swell=.05 air=.6 ring=4 hum=0 word=Hush speak=1.2 release=.6 sing=.3 point=.85 contagion=.2 beat=1.8 volume=4.5 | frost | felt | Breath on glass keys that turns to a hush
Warm air over bars | - | metal=Bar mallet=Breath swell=.1 air=.4 ring=14 sing=.8 hum=.3 word=We speak=1.8 tract=-3 release=.4 clarity=.8 contagion=.8 stagger=.55 wear=.05 beat=.5 width=.5 volume=-1.5 | afterimage | chain | Breath wakes wooden bars that say we
Whispered sums | - | metal=Bell mallet=Breath stray=0 swell=.03 hardness=.7 air=.8 ring=3 word=Nay_nay speak=.8 hum=0 sing=.4 release=.7 point=1 clarity=.65 contagion=1 stagger=.65 wear=.8 beat=.6 width=.4 volume=6 | stub | talk | Whispering tuned bells that say nay nay and stop
Curtain drawing breath | - | metal=Plate mallet=Breath swell=.2 air=.5 ring=6 word=Whoosh speak=2 sing=.7 hum=.2 release=.5 tract=-4 hardness=.35 point=.95 clarity=1 contagion=-.5 stagger=.75 wear=.3 beat=2.2 width=.6 volume=5 | calm | vesper | A plate woken by breath says a soft whoosh
Quick mouths | - | stray=0 hardness=.6 speak=.25 word=Ah_oh_oo clarity=1 ring=5 sing=.6 hum=0 beat=0 release=.7 contagion=0 stagger=0 metal=Glass point=.75 swell=.08 wear=.45 air=.25 width=.25 knock=.4 volume=6 | wah | plucks | Tuned glass keys that say ah, oh, oo four times a second
Gossip in the tearoom | - | metal=Bar hardness=.6 speak=.4 word=Ay_ma ring=16 sing=.6 clarity=1 tract=2 release=.6 stagger=.8 hum=0 swell=.06 point=.75 contagion=.1 beat=1.6 volume=6 | platform 2.gain=5 | talk | Bars that say ay ma in quick turns, each at its own pace
Two syllable hello | Talking metal | metal=Bell stray=0 hardness=.5 speak=.6 word=We ring=7 sing=.8 hum=.2 release=.8 stagger=0 tract=-1 width=.3 volume=.5 | smaller | chant | Tuned bells that say we with the key and stop with it
Duck on the canal | - | metal=Harmonic stray=.4 mallet=Nail hardness=.15 speak=.35 word=Nay_nay tract=-6 ring=4 sing=.7 release=.8 hum=.25 wear=.7 clarity=.7 stagger=.55 beat=.5 air=.3 width=.7 volume=6 | drip 2.gain=8.5 | talk | A nail on a rough body says nay nay quickly, low in the throat
Murmured multiplication | Talking metal | metal=Glass stray=0 hardness=.3 speak=.5 word=Seem ring=3 sing=.7 hum=.1 release=.7 tract=-4 point=.15 wear=.2 volume=6 | pipe | twoparts | Tuned glass that says seem twice a second
Held like a hymn | - | metal=Harmonic stray=0 swell=.06 hardness=.4 sing=1 word=Ah_oh_oo speak=2.6 release=.7 hum=.3 knock=0 beat=.4 air=.1 clarity=.7 contagion=.9 | pipes | hymn | Tuned keys fed as long as they are held say ah, oh, oo | organ
Chapel harmonium | - | metal=Harmonic stray=.1 swell=.12 hardness=.7 sing=1 clarity=.6 word=Seem speak=5 release=.9 hum=.5 knock=0 beat=1.4 air=.3 contagion=1 width=.85 | triad | hymn | A fed body, half spoken, that takes five seconds over seem | organ
Reed organ on the porch | - | metal=Bell stray=0 swell=.1 hardness=.6 sing=1 word=We speak=4 release=.8 hum=0 beat=2 knock=0 tract=-3 point=.85 contagion=.6 stagger=.5 wear=.7 air=.05 width=1 volume=-.5 | throb | hymn | Tuned bells fed by the key that beat and say we | organ
Sung from the keyboard | - | metal=Bar swell=.04 hardness=.5 sing=1 word=Ah_oh_oo speak=1.5 release=.6 hum=.1 clarity=1 stagger=.3 tract=-2 point=.55 wear=.2 air=.35 width=1 volume=-.5 | singer | chant | Wooden bars that go on singing ah, oh, oo under the hand
Glass under slow hands | - | metal=Glass stray=.2 swell=.15 hardness=.35 sing=1 word=Home speak=3.5 release=.4 hum=.2 knock=0 point=.2 clarity=.6 contagion=.8 wear=.5 beat=.4 air=.1 | moons | vesper | Glass keys fed by the hand say home as they are held
Wet street reflections | Felt keys | metal=Bell hardness=.35 ring=20 beat=1.8 width=1 release=.1 word=Ah_oh_oo speak=3.4 mallet=Wood stray=.7 swell=.06 point=.85 clarity=.85 stagger=.6 wear=.35 air=.25 volume=3 | deepsea | felt | Soft wood on bells that keep ringing and turn in a slow beat
Pianos a street apart | Felt keys | metal=Harmonic hardness=.45 beat=3 width=1 word=Home speak=2 ring=14 point=.35 clarity=.95 stagger=.8 wear=.15 air=.2 volume=3 | doubled | twoparts | A felted body in two beating halves says home
Wind in the sheet music | Felt keys | metal=Glass beat=.8 hardness=.3 width=1 air=.35 word=We speak=2.2 ring=5 point=.05 clarity=.75 wear=.15 volume=.5 | flock | felt | Airy glass keys that open from oo to ee
Balcony at midnight | Felt keys | metal=Plate stray=.1 hardness=.35 word=Ay_ma speak=1.6 ring=9 hum=.1 tract=-3 release=.4 point=1 clarity=.9 stagger=.95 wear=.65 beat=1.4 volume=5 | swirl 2.outputGain=7 | vesper | A tuned plate under felt says ay ma
Rain on both windows | Felt keys | metal=Bell stray=.6 mallet=Wood hardness=.3 word=Home ring=9 speak=1.4 tract=-4 point=.55 clarity=.55 stagger=.5 wear=.25 beat=2.6 air=.35 volume=6 | scale | felt | Soft wood on bells that say home low in the mouth
Lesson on a cassette | Felt keys | hardness=.5 word=Ah_oh_oo speak=1 metal=Harmonic beat=.9 tract=6 clarity=1 point=.65 stagger=.65 wear=.1 air=.3 | cassette | twoparts | A felted body with a child's mouth says ah, oh, oo in a second
Pages of a primer | Felt keys | metal=Glass stray=0 word=Nay_nay speak=1 hardness=.5 tract=-3 ring=4 point=.2 clarity=.8 beat=1.8 volume=3.5 | sampler | canon | Tuned glass keys that say nay nay, the mouth low
Attic upright | Felt keys | metal=Harmonic stray=1 hardness=.6 word=Seem speak=1.5 beat=1.5 ring=5 swell=.1 volume=-.5 | disc | run | A body left out of tune with itself says seem under felt
Radio play, scene two | Felt keys | metal=Bell stray=.1 hardness=.7 word=Ay_ma speak=1.1 tract=-2 ring=6 point=.9 beat=2 volume=-.5 | kitchen | talk | Hard felt on tuned bells that say ay ma
Forgotten on the stand | Felt keys | metal=Bar hardness=.35 word=Hum ring=20 hum=.5 sing=.8 wear=.6 swell=.1 beat=.5 | wornreel | cradle | Wooden bars that only hum, with the octave under them
`,
    },
    {
      id: 'plucked-yes',
      name: 'Plucked yes',
      category: 'plucked',
      rows: `
Reed pen | Plucked yes | speak=.7 word=Seem stray=.6 point=.95 tract=-5 ring=3 wear=.8 clarity=.7 hum=.3 swell=.08 stagger=1 air=.15 width=.85 | wall | plucks | A nail on an untuned body, closing quickly from ee, low in the mouth
Yes at the threshold | Plucked yes | speak=1.6 hardness=.2 ring=12 sing=.6 tract=-6 wear=.75 hum=.3 clarity=.9 swell=.04 point=1 stagger=.95 air=.05 width=.65 | walled | chant | A nail on a tuned body that opens clearly from oo to ee
Lute on the landing | Plucked yes | mallet=Wood hardness=.1 word=Ah_oh_oo speak=.8 tract=-2 ring=5 point=.8 clarity=.95 stagger=.85 | stairwell | plucks | A soft stick plucks a tuned body that says ah, oh, oo
Gate latch | Plucked yes | word=Nay_nay speak=.5 ring=1.5 sing=0 release=.6 knock=.5 wear=.7 tract=-6 clarity=.55 hum=.35 point=.4 stagger=.85 air=.3 | grit | talk | A nail with a tick, saying nay nay and cut short
Barley tea | Plucked yes | word=Home speak=1.3 tract=-6 hum=.3 wear=.8 ring=8 point=.2 clarity=.7 stagger=.6 air=.2 width=.25 | reel | felt | A dark pluck with its octave below says home
Frost flower | - | metal=Glass mallet=Nail hardness=.2 ring=3 hum=0 word=We speak=.8 sing=.1 release=.2 tract=-2 stray=.6 point=.9 contagion=1 stagger=.25 wear=0 beat=1.6 air=.1 width=.7 volume=2.5 | points | stars | A nail on glass says one short bright we
Ring on a wine glass | - | metal=Glass mallet=Nail hardness=.6 ring=8 hum=0 word=Ah_oh_oo speak=1.5 tract=-5 stray=0 clarity=1 sing=.3 point=.55 contagion=-.3 stagger=.5 wear=.25 beat=1.8 air=.35 width=.9 volume=-1.5 | bare | treble | A hard nail on tuned glass closes from ah to oo
Berries on a sill | - | metal=Glass mallet=Nail hardness=.1 ring=1.2 hum=0 word=Nay_nay speak=.4 sing=0 release=.1 knock=.6 stray=.9 width=1 point=.25 clarity=.8 stagger=.8 wear=.25 air=.2 volume=6 | bounces | rain | Tiny short glass plucks with a tick, saying nay nay
Salt on the rim | - | metal=Glass mallet=Nail hardness=.35 ring=5 hum=0 word=Hush speak=1.5 sing=.3 beat=2 wear=.6 air=.45 point=.2 clarity=.95 stagger=.75 width=.25 volume=0 | sparks | run | A nail on glass that fades into a hush
Chandelier draught | - | metal=Glass mallet=Nail hardness=.3 ring=14 hum=0 beat=4 word=Whoosh air=.4 speak=2.4 width=1 release=0 point=.15 stagger=.05 wear=.45 knock=.4 volume=2.5 | glintecho | stars | Beating glass that says whoosh after the nail
Thumbs on the steps | - | metal=Bar mallet=Nail hardness=.1 ring=10 word=Home speak=.9 hum=.15 release=.2 sing=.1 tract=-3 stray=.4 clarity=.6 contagion=.5 wear=.3 air=.2 width=.95 knock=.25 | wall | wood | A thumb nail on bars that say home
Gourd lamp | - | metal=Bar mallet=Nail hardness=.3 ring=14 word=Ah_oh_oo speak=.7 hum=.1 release=.2 sing=.3 tract=-5 swell=.04 point=.65 clarity=.95 contagion=.7 stagger=.1 wear=.45 beat=.4 air=.05 width=.65 knock=.2 volume=-1 | gourd | wood | Thumbed bars say ah, oh, oo deep in the throat
Walking song for thumbs | - | metal=Bar mallet=Nail hardness=.15 ring=20 word=We speak=1.1 hum=.3 sing=.5 clarity=1 release=.1 point=.1 contagion=.1 stagger=.75 wear=.1 beat=0 | paper | plucks | Thumbed bars say we with the octave under them
Rust on the tongues | - | metal=Bar mallet=Nail stray=1 hardness=.5 ring=9 word=Ay_ma speak=.6 hum=0 sing=.2 knock=.5 point=.7 clarity=.7 contagion=-.2 stagger=.65 wear=.8 beat=2.8 volume=-1.5 | leather 1.output=4 | wood | Raw thumbed bars that say ay ma
Lost between stations | - | metal=Bar mallet=Nail hardness=.25 ring=30 word=Seem speak=1.6 sing=.7 beat=1 wear=.75 tract=-4 clarity=.7 hum=.4 point=.95 contagion=0 volume=-1 | shortwave | call | Long thumbed bars that say seem
Wire fence at noon | - | metal=Bell mallet=Nail stray=1 hardness=.2 ring=3 word=We speak=.5 tract=-4 hum=0 sing=0 wear=.6 swell=.06 point=.85 clarity=.85 contagion=.7 stagger=.95 beat=.6 air=.05 width=.25 knock=.1 volume=1 | springs | plucks | A nail on raw bell metal, one low quick we
Thorn | - | metal=Bell mallet=Nail stray=.7 hardness=.05 ring=1 word=Ah_oh_oo speak=.3 tract=-6 hum=.1 sing=0 release=.5 point=.15 contagion=1 wear=.05 air=.3 knock=.1 | near | talk | A soft nail on a bell, all over in a moment
Beads across a doorway | - | metal=Bell mallet=Nail stray=.4 ring=6 word=Ay_ma speak=1 beat=3 contagion=-.8 width=1 wear=.6 hum=.2 tract=-5 clarity=.6 hardness=.15 knock=.5 volume=1.5 | stars | run | Plucked bells that turn each other to the opposite vowel
Cat on the fence | - | metal=Bell mallet=Nail stray=.1 hardness=.4 ring=4 word=We speak=.35 tract=3 sing=.6 release=.6 hum=0 clarity=1 point=.65 contagion=1 wear=.25 beat=.6 air=.25 knock=.25 volume=1.5 | wobble | talk | A high quick we, three times a second, on tuned bells
Pins dropped in order | - | metal=Bell mallet=Nail stray=.9 hardness=.6 ring=2 word=Noon speak=1 tract=-3 sing=0 wear=.6 hum=.25 clarity=.85 contagion=.8 beat=1.2 air=.25 width=1 knock=.4 volume=6 | scatter 2.gain=14 | run | Nails on raw bells that close their lips at once
Orchard harp | - | metal=Harmonic mallet=Wood hardness=.2 stray=.1 ring=9 word=Ah_oh_oo speak=1.2 hum=.1 sing=.2 release=.1 beat=.4 clarity=1 wear=.5 knock=.45 volume=3 | pedal | plucks | A wooden plectrum on a tuned body, ah to oo
Twelve courses | - | metal=Harmonic mallet=Wood hardness=.45 stray=0 ring=12 beat=2.6 word=We speak=1.8 tract=-3 hum=.2 release=.1 width=1 wear=.65 clarity=.5 contagion=.7 stagger=.9 volume=6 | silver | plucks | Paired tones under a wooden pick that beat and say we
Convent fiddle | - | metal=Harmonic mallet=Wood hardness=.6 stray=.3 ring=3 word=Home speak=.6 hum=0 sing=.3 release=.5 knock=.7 point=.8 contagion=.1 beat=1.6 volume=2.5 | board | chant | A hard wooden pluck with a knock says home
Saturday at the taverna | - | metal=Harmonic mallet=Wood hardness=.8 stray=.6 ring=5 word=Nay_nay speak=.9 beat=1.6 hum=0 sing=.2 point=.1 clarity=.7 contagion=.1 stagger=.75 wear=.3 volume=.5 | trail 2.gain=11 | run | Hard picks on an untuned body, nay nay in under a second
Shadow of a harp | - | metal=Harmonic mallet=Wood hardness=.08 stray=0 ring=24 word=Hum hum=.4 sing=.5 release=0 wear=.8 point=.65 stagger=.85 beat=.2 air=.1 width=.3 volume=6 | shadow | plucks | The softest pluck, lips closed, with a long dark ring
Palm mute | - | metal=Harmonic mallet=Nail hardness=.15 ring=.5 sing=0 release=.8 word=We speak=.3 tract=-3 hum=.2 clarity=.6 wear=.75 beat=1.3 volume=6 | iron | talk | A damped pluck that has time for one we
Rubber bands on a box | - | metal=Harmonic mallet=Wood hardness=.1 ring=.4 sing=.2 release=.9 word=Ay_ma speak=.25 hum=.3 stray=.4 point=.9 contagion=.5 wear=.3 beat=0 air=.2 width=.9 volume=5.5 | clay | plucks | Short stopped plucks that say ay ma at once
Peas into a bowl | - | metal=Bar mallet=Nail hardness=.2 ring=1.5 sing=0 release=.6 word=Nay_nay speak=.2 tract=1 hum=0 knock=.6 stray=.8 point=.75 stagger=.75 wear=.15 beat=.6 air=.1 width=.35 volume=5.5 | tin 2.gain=4.5 | wood | The shortest raw bars with a tick, nay nay in a fifth of a second
Stitches in felt | - | metal=Plate mallet=Nail hardness=.1 ring=.8 sing=0 release=.7 word=Home speak=.4 tract=-6 hum=.5 point=.85 clarity=.85 stagger=.7 wear=.55 air=.05 width=.4 volume=6 | felted 2.gain=9 | plucks | A muted plate plucked low, home and shut
Buttoned coat | - | metal=Glass mallet=Wood hardness=.2 ring=.3 sing=0 release=1 word=Ah_oh_oo speak=.4 hum=.2 tract=-4 clarity=.7 stagger=.7 beat=.5 air=.3 knock=.15 volume=6 | blunt | talk | Glass stopped short under soft wood, ah to oo
Drained pool | - | metal=Harmonic mallet=Nail hardness=.3 ring=3 word=We speak=.6 tract=-4 hum=0 sing=.2 release=.4 beat=.5 contagion=.7 knock=.35 volume=6 | hop 2.gain=6.5 | run | A nail on a half tuned body gives one low we
Calling over the weir | - | metal=Bell mallet=Wood hardness=.4 ring=2.5 stray=.2 word=Ah_oh_oo speak=.9 hum=0 sing=0 release=.3 tract=1 clarity=.75 stagger=.6 wear=.4 beat=0 air=.3 width=.7 knock=.35 volume=4 | warmecho | call | Short tuned bells under wood call ah, oh, oo
Stones into the quarry | - | metal=Plate mallet=Wood hardness=.6 ring=2 stray=.5 word=Home speak=1 hum=.3 sing=0 release=.2 tract=-5 point=.85 clarity=.9 stagger=.6 wear=.4 beat=1.9 air=.25 width=.7 volume=6 | stone 2.gain=9 | plucks | A short plate under wood says home
Tape head gossip | - | metal=Glass mallet=Nail hardness=.25 ring=1.5 stray=.2 word=Nay_nay speak=.6 hum=0 sing=0 tract=-4 release=.3 stagger=.9 wear=.45 beat=.3 air=.25 width=.95 volume=4 | dotted | plucks | Low glass plucks that say nay nay
Backwards stair | - | metal=Harmonic mallet=Wood hardness=.25 stray=.2 ring=4 word=Seem speak=.8 sing=.3 release=.3 wear=.7 tract=-3 clarity=.6 hum=.5 point=.15 stagger=.8 beat=1.8 width=.2 volume=3 | mirror | run | A wooden pluck that says seem
Gravel throat | - | metal=Harmonic mallet=Nail stray=.8 hardness=.4 ring=6 word=Ah_oh_oo speak=.2 tract=-8 sing=.8 hum=.4 release=.7 clarity=1 point=.35 contagion=.6 wear=.1 beat=1 air=.05 width=.25 volume=.5 | triode | walk | A giant's throat says ah, oh, oo five times a second | bass
Frog at the sluice | - | mallet=Nail ring=5 word=We speak=.22 sing=.7 hum=.6 release=.8 hardness=.15 wear=.7 metal=Bell stray=.9 tract=-7 point=.1 contagion=.2 beat=3.2 air=.3 knock=.2 volume=-.5 | drip | talk | A raw bell under a soft nail, a low we four times a second over its octave
Motor under the jetty | Talking metal | metal=Bar mallet=Nail hardness=.4 ring=12 word=Ay_ma speak=.2 tract=-4 sing=.9 hum=.5 release=.7 point=1 volume=2 | deep | walk | Thumbed bars that rattle ay ma five times a second | bass
Bee in the windowpane | - | metal=Bell stray=0 mallet=Nail hardness=.5 ring=4 word=Nay_nay speak=.3 tract=-2 sing=.9 hum=0 release=.6 beat=6 point=.65 clarity=.6 contagion=-.5 wear=.7 air=.15 volume=6 | sides 3.gain=6 | talk | Nailed tuned bells buzzing nay nay in a fast beat
Teasing the parrot | Talking metal | metal=Glass stray=0 mallet=Nail hardness=.5 ring=6 word=Ay_ma speak=.4 tract=2 sing=.8 hum=0 release=.6 clarity=1 contagion=0 point=.4 wear=.7 air=.25 volume=6 | phone 2.gain=8.5 | talk | Tuned glass that says ay ma as fast as talk
Jump rope | - | metal=Harmonic mallet=Wood hardness=.4 stray=0 tract=7 ring=4 word=Nay_nay speak=.6 hum=0 sing=.4 release=.4 stagger=.9 point=1 clarity=.8 contagion=-.3 beat=0 air=0 width=.35 knock=.4 volume=6 | slap | plucks | A child's small mouth says nay nay on short plucks
Paper crown | - | metal=Harmonic mallet=Nail hardness=.05 stray=0 tract=5 ring=8 word=We speak=1 hum=0 sing=.4 wear=.6 point=.95 clarity=.65 stagger=.65 width=.55 volume=6 | smaller | run | A soft nail on a small tuned mouth that says we
Skipping count | - | metal=Bell mallet=Felt hardness=.6 stray=0 tract=7 ring=3 word=Ay_ma speak=.5 hum=0 sing=.3 release=.5 swell=.08 clarity=.5 contagion=.7 stagger=.9 wear=.55 beat=.1 width=.2 volume=6 | dotted 2.gain=6 | changes | Small tuned bells under felt say ay ma like children | keys
Kite above the sheds | - | metal=Glass mallet=Wood hardness=.3 stray=.1 tract=6 ring=2 word=Seem speak=.7 hum=0 sing=.3 clarity=1 beat=1 knock=.45 volume=6 | cascade 2.gain=10.5 | treble | High tuned glass under wood says seem
Sparrow on the rail | - | metal=Bar mallet=Wood hardness=.5 tract=9 ring=12 word=We speak=.4 hum=0 sing=.2 stray=.3 contagion=1 beat=.3 air=.35 width=.6 knock=0 volume=1 | patter | rain | Small bars that chirp we
Copper tray | - | metal=Plate mallet=Nail hardness=.1 tract=-5 ring=5 stray=.3 word=Ah_oh_oo speak=1.2 hum=.1 sing=.2 release=.1 clarity=.55 stagger=.9 beat=.8 volume=6 | chamber 2.gain=7.5 | plucks | A soft nail on a plate says a low ah, oh, oo
Anvil flower | - | metal=Plate mallet=Wood hardness=.5 tract=-7 ring=4 stray=.8 word=Nay_nay speak=.7 hum=.2 sing=0 knock=.6 clarity=.9 wear=.55 beat=.2 volume=4 | pipe | call | Wood knocks a raw plate that says nay nay, low
Zither of sheet tin | - | metal=Plate tract=-3 ring=9 stray=0 speak=1.5 hum=0 beat=2 width=1 sing=.3 mallet=Wood word=Ah_oh_oo hardness=.65 clarity=.6 contagion=.6 wear=.35 air=.2 knock=.2 volume=6 | walled | run | A tuned plate under hard wood beats and closes from ah
Spoon on a saw blade | - | metal=Plate mallet=Wood hardness=.2 tract=-4 ring=12 stray=.6 word=Ay_ma speak=2 hum=0 sing=.6 beat=1 point=.7 contagion=-.5 stagger=.65 wear=.15 air=.3 width=.8 volume=3.5 | hertz 2.outputGain=10.5 | call | Soft wood on a plate that bends through ay ma
Gutter after the storm | - | metal=Plate mallet=Nail hardness=.15 tract=-8 ring=2.5 stray=.5 word=Hush speak=1 air=.5 hum=.2 sing=0 point=.9 clarity=.95 stagger=.7 wear=.5 beat=2 width=.65 volume=6 | leaf 2.gain=17.5 | plucks | A low nailed plate that fades into a hush
`,
    },
    {
      id: 'glass-lullaby',
      name: 'Glass lullabies',
      category: 'bell',
      rows: `
Green night light | Glass lullaby | speak=4 stray=0 point=.9 clarity=1 beat=2.2 mallet=Nail hardness=.15 tract=1 hum=.05 wear=.6 swell=.03 stagger=.4 air=.2 volume=.5 | shaded | cradle | Tuned glass under a soft nail closes from ah to oo, beating
Counting eyelashes | Glass lullaby | speak=7 beat=.5 ring=26 word=Nay_nay stray=.8 mallet=Felt hardness=.4 tract=-2 point=.3 clarity=.7 swell=.08 wear=.6 air=.3 volume=6 | hall 1.mix=.2 | cradle | Raw glass under soft felt that opens and shuts over seven seconds
Snow globe at rest | Glass lullaby | word=Home stray=.1 hum=.3 beat=2.2 ring=12 point=.6 clarity=.8 stagger=.75 volume=2 | dust | treble | Tuned glass that says home with a steady beat
Half asleep by verse two | Glass lullaby | word=Ay_ma speak=3 sing=.8 tract=-5 wear=.8 swell=.08 point=.85 clarity=.95 stagger=.2 air=.3 | tails | cradle | Low-mouthed glass that says ay ma and darkens
Mobile in a draught | Glass lullaby | contagion=-1 speak=2 word=We stagger=1 hardness=.45 swell=.08 clarity=.6 wear=.35 air=.2 | circle | rain | Glasses that answer each other with the opposite vowel
Milk and moonlight | - | metal=Glass swell=1.4 hardness=.3 sing=.9 hum=.3 beat=.4 word=Ah_oh_oo speak=8 stray=.2 knock=0 width=1 point=.35 clarity=.65 wear=.8 air=.2 | nave | vesper | Glass that swells for over a second and closes slowly to oo | pad
Breath on the cold pane | - | metal=Glass swell=2.4 mallet=Breath air=.5 sing=1 hum=.1 word=Hush speak=6 stray=.5 knock=0 point=.9 contagion=.6 stagger=.25 beat=1.8 width=.9 volume=3 | sines | fifth | Glass breathed awake over two seconds, closing on a hush | pad
Curtains, then stars | - | metal=Glass swell=.8 hardness=.6 sing=.8 hum=0 word=We speak=5 tract=2 beat=1.4 knock=0 width=1 point=.55 clarity=.7 contagion=-.3 stagger=.55 wear=.15 air=.35 | event | chain | Glass that swells from oo to a bright ee | pad
Slow tide on the sill | - | metal=Glass swell=3 hardness=.5 sing=1 hum=.5 word=Home speak=6 tract=-5 wear=.6 knock=0 clarity=.85 stagger=.75 beat=.2 air=.3 width=.9 volume=-2 | surf | drone | Dark glass three seconds in coming, saying home low in the mouth | pad
Sleep arrives by boat | - | metal=Glass swell=1.1 hardness=.2 sing=1 stray=0 word=Hum clarity=1 hum=.4 speak=9 knock=0 beat=.8 stagger=.65 wear=.3 air=.35 width=.85 | water | suspend | Tuned glass that swells in and hums with shut lips | pad
Tin drummer's waltz | - | metal=Glass stray=0 mallet=Nail hardness=.35 ring=1.4 hum=0 word=Ah_oh_oo speak=.6 sing=0 release=0 tract=1 point=.85 clarity=1 stagger=.75 wear=.5 beat=1.5 volume=4 | parlour | cradle | Tiny tuned glass plucked with a nail says ah, oh, oo
Key in the toy's back | - | metal=Glass stray=.05 mallet=Nail hardness=.2 ring=.8 hum=0 word=We speak=.5 sing=0 knock=.5 beat=0 tract=5 clarity=1 point=.9 stagger=.75 wear=.3 air=.3 width=.8 volume=.5 | tin | peal | Short nailed glass in a child's mouth, ticking as it says we
Ballerina on a spring | - | metal=Glass stray=0 mallet=Wood hardness=.3 ring=2 hum=.1 word=Nay_nay speak=1 sing=0 tract=3 beat=1 clarity=.95 contagion=.8 stagger=.95 wear=.15 air=.2 width=.95 knock=.45 volume=6 | coil 3.gain=9.5 | cradle | Small tuned glass under wood says nay nay
Winding the old cradle | - | metal=Bell stray=0 mallet=Nail hardness=.2 ring=2.5 hum=0 word=Home speak=.8 sing=0 tract=4 beat=.5 contagion=1 knock=.45 volume=5.5 | wobble | cradle | Tiny tuned bells plucked with a nail say home
Last turn of the key | - | metal=Glass stray=.1 mallet=Nail hardness=.15 ring=3 hum=.2 word=Seem speak=1.4 sing=.2 tract=-1 wear=.7 point=.9 contagion=0 stagger=.9 beat=2.2 air=.2 width=.6 volume=6 | slowing | peal | Plucked glass that says seem and shuts
All the glasses agree | - | metal=Glass contagion=1 stagger=0 hardness=.35 word=Ah_oh_oo speak=3 sing=.7 hum=.1 ring=16 stray=.9 point=.9 swell=.08 clarity=.7 wear=.75 beat=.3 air=.3 width=.75 knock=.3 volume=0 | bowls | suspend | Raw glasses that all come round at once to the newest vowel
Choir of tumblers | - | metal=Glass contagion=1 stagger=.2 stray=0 clarity=1 word=We speak=4 sing=.9 hum=0 mallet=Wood hardness=.3 tract=1 point=.8 wear=.85 beat=2 air=.05 width=.55 knock=.05 volume=6 | vowels | answer | Tuned tumblers under soft wood learn we from the last one struck
Grandmother's cabinet | - | metal=Glass contagion=.8 hardness=.55 mallet=Wood word=Home speak=2.6 ring=9 hum=.2 knock=.4 stray=.6 point=.7 clarity=.5 wear=.7 beat=2 volume=6 | cupboard | felt | Glass under wood that learns home from its neighbour
Seven glasses of water | - | metal=Glass contagion=.6 mallet=Wood hardness=.25 word=Noon speak=2 ring=6 hum=.3 beat=.3 stray=.3 sing=.2 point=.15 clarity=.6 stagger=.4 wear=.5 width=.45 knock=.15 volume=6 | pendulum 3.gain=15 | chain | Glass tapped with soft wood closes and opens, saying noon
Echo of a good night | - | metal=Glass contagion=1 hardness=.3 word=Seem speak=5 ring=20 hum=.05 beat=1 sing=.6 tract=-3 swell=.1 clarity=.9 volume=-1 | recall | call | Glasses that pass seem from one to the next
Icicles at the eaves | - | metal=Glass stray=1 hardness=.6 tract=3 ring=5 hum=0 word=We speak=1 sing=0 release=0 width=1 swell=.1 clarity=.85 beat=.9 volume=0 | scatter | rain | Raw glass that drips a bright we
Thin ice, first step | - | metal=Glass stray=.9 mallet=Wood hardness=.5 ring=3 hum=0 word=Hush speak=1 air=.5 tract=-1 sing=0 point=.8 contagion=.1 stagger=.75 wear=.45 beat=1.7 width=.7 volume=6 | leaf | plucks | Raw glass under wood that breaks into a hush
Hail in a bucket | - | metal=Glass stray=.8 mallet=Nail hardness=.4 ring=1 hum=0 word=Nay_nay speak=.4 sing=0 knock=.7 width=.8 point=.6 clarity=.9 contagion=0 stagger=.9 wear=.25 beat=.3 air=.15 volume=4.5 | patter | run | Short raw glass with a tick, saying nay nay
Frozen washing line | - | metal=Glass stray=1 hardness=.4 ring=10 beat=3 hum=0 word=Ay_ma speak=4 sing=.5 tract=-4 point=.75 clarity=.7 contagion=-.2 stagger=.7 wear=.85 volume=1 | hertz | answer | Raw glass that shakes through a low ay ma
Crystal, one hairline | - | metal=Glass stray=.7 hardness=.75 ring=7 clarity=.3 hum=.1 word=Home speak=2 wear=.1 sing=.1 point=.95 contagion=0 stagger=.5 beat=2.9 air=.05 width=.55 knock=.15 volume=0 | ringhalo | stars | Hard-struck glass that only half says home
Cellar of sleeping wine | - | metal=Glass tract=-8 wear=.9 hardness=.3 hum=.6 word=Ah_oh_oo speak=6 ring=24 sing=.5 swell=.1 point=.7 contagion=.8 stagger=.1 beat=2 air=.15 width=.65 volume=-1.5 | cave | temple | Dark glass with a full octave below, ah, oh, oo in a huge mouth
Owl glass | - | metal=Glass tract=-5 wear=.7 hardness=.2 hum=.2 word=Noon speak=2.4 sing=.6 ring=10 clarity=1 swell=.04 point=.85 contagion=-.2 stagger=.55 beat=.5 air=.1 width=.2 knock=.5 volume=6 | fogged | call | Dark glass that hoots noon through shut lips
Moonless | - | metal=Glass wear=1 hardness=.1 word=Hum speak=8 ring=30 sing=.7 stray=.7 beat=2 clarity=.6 hum=0 mallet=Breath swell=.5 air=.45 tract=-9 width=.65 volume=5.5 | bare | alone | The softest breath on raw glass, its top worn off, humming in a giant's mouth
Lantern in a dry shaft | - | metal=Glass tract=-9 wear=.6 hardness=.5 hum=.3 word=We speak=5 ring=14 sing=.4 beat=1.5 swell=.08 point=.05 clarity=.5 contagion=1 stagger=.25 air=.15 width=.55 knock=.5 | pipe | vesper | Glass in a giant's mouth opens from oo towards ee
Plum dark | - | metal=Glass tract=-7 wear=.8 mallet=Wood hardness=.35 hum=.8 word=Home speak=3 ring=18 stray=.8 sing=.3 point=.9 clarity=.7 contagion=-.5 stagger=.75 beat=.1 air=0 width=.15 knock=.4 volume=6 | pane 3.outputGain=11 | gong | Raw dark glass under wood, its octave below full, says home | bass
Wet finger going round | - | metal=Glass mallet=Breath swell=.35 sing=1 air=.15 stray=0 hum=0 word=Ah_oh_oo speak=4 knock=0 beat=1 point=.45 clarity=1 contagion=-.5 stagger=.85 wear=.35 width=.75 volume=-1.5 | ensemble | vesper | Rubbed glass that sings ah, oh, oo as long as it is held | organ
Reeds bundled with glass | - | metal=Glass mallet=Breath swell=.15 sing=1 stray=.3 word=We speak=3 knock=.2 tract=-7 hum=.6 air=.7 clarity=.6 wear=.7 beat=1.3 width=.75 | pipes | organum | Blown glass that opens from oo to ee under the hand | organ
Rim song after midnight | - | metal=Glass mallet=Breath swell=.7 sing=.9 air=.3 stray=.6 hum=0 word=Seem speak=7 knock=0 tract=-2 beat=2.4 clarity=.55 wear=.6 width=.65 volume=1 | flock | fifth | Raw glass rubbed awake, beating, from ee to shut lips | organ
Glasses learn to hum | - | metal=Glass mallet=Breath swell=.2 sing=1 air=.1 stray=0 hum=.6 word=Hum knock=0 speak=5 clarity=1 width=.3 contagion=.9 wear=.8 volume=-12.5 | narrow | hymn | Rubbed tuned glass that learns to keep its lips shut, octave below | organ
Vesper in a goblet | - | metal=Glass mallet=Breath swell=.5 sing=1 air=.2 stray=.1 hum=.1 word=Ay_ma speak=5 knock=0 tract=-6 width=1 point=.2 wear=.55 beat=1.9 volume=-1 | monks | chain | Rubbed glass that says ay ma in a large low mouth | organ
Under a wool blanket | - | metal=Bell stray=0 hardness=.1 ring=12 hum=.4 word=Ah_oh_oo speak=4 wear=.9 sing=.6 tract=-3 beat=.3 | blanket | cradle | Tuned bells hardly touched, round and low
Maneless rocking horse | - | metal=Harmonic stray=.1 hardness=.25 ring=7 hum=.1 word=Nay_nay speak=3 sing=.5 tract=2 beat=.6 release=.2 point=.8 clarity=.9 stagger=.55 wear=.45 air=.25 width=.75 volume=6 | pendulum 3.gain=11 | cradle | A softly struck tuned body rocks through nay nay
Teddy with one ear | - | metal=Bar hardness=.3 ring=14 hum=.2 word=Home speak=1.4 sing=.4 tract=3 release=.1 point=.3 clarity=.7 wear=.85 beat=1.6 air=.2 knock=.35 volume=1.5 | low8 | treble | Small-mouthed bars under felt say home | keys
Temple bells on a thread | - | metal=Bell stray=.4 hardness=.3 tract=4 ring=6 hum=0 word=Seem speak=2 sing=.2 beat=2 width=1 clarity=.65 wear=.65 knock=.3 volume=5.5 | chimes | treble | Small bells under felt that beat and say seem
Boat bunk in a swell | - | metal=Plate stray=.2 hardness=.2 ring=14 hum=.3 word=We speak=5 sing=.6 tract=-4 beat=.4 swell=.08 clarity=.8 wear=.85 air=.1 knock=.15 | ripples | cradle | A soft plate that takes five seconds over we
Edge of a dream | - | metal=Glass hardness=.35 speak=3 hum=.1 sing=.8 ring=14 word=Seem stray=.7 swell=.5 tract=-3 point=0 clarity=.5 contagion=.5 stagger=.05 wear=.25 beat=.9 air=.2 width=1 | mist | suspend | Raw glass with a soft edge closes from ee to shut lips | pad
Night feed before four | - | metal=Glass hardness=.3 word=Home speak=2.4 hum=.2 sing=.4 ring=8 tract=-1 mallet=Breath swell=.06 air=.4 point=.65 stagger=.9 wear=.15 width=.85 volume=2 | bed | cradle | A touch of breath on glass that says home in two and a half seconds
Breath beside the crib | - | metal=Glass hardness=.25 mallet=Breath swell=.5 air=.6 word=Whoosh speak=3 sing=.8 hum=.2 tract=-5 contagion=1 beat=.1 volume=2 | sigh | alone | Glass that breathes whoosh, round and then shut | texture
Lullaby in the next flat | - | metal=Glass hardness=.5 word=We speak=2 hum=.1 sing=.3 ring=5 stray=0 tract=-4 swell=.08 point=1 contagion=.5 stagger=.05 beat=1.1 air=.3 volume=-1 | nextdoor | cradle | Tuned glass that says we low in the mouth
The story ends slowly | - | metal=Glass hardness=.4 word=Ay_ma speak=6 hum=.1 sing=.7 ring=20 beat=.7 contagion=.9 point=.75 clarity=.6 wear=.65 volume=0 | stretched | chant | Glass that learns ay ma and takes six seconds over it | texture
Highest bell in the nave | - | metal=Glass hardness=.5 ring=12 hum=0 word=Ah_oh_oo speak=1.5 tract=-3 sing=.3 stray=.1 wear=.1 clarity=.7 stagger=.55 width=.2 knock=.35 volume=-1.5 | cathedral | stars | Tuned glass, high up, going from bright to dark
Frost fern unfolding | - | metal=Glass hardness=.7 ring=3 hum=0 word=We speak=.8 sing=0 stray=.7 wear=0 width=1 air=.3 swell=.08 point=.5 clarity=.75 beat=.3 knock=.25 volume=4 | cascade | stars | Raw bright glass that flickers open on we
Comet over the yard | - | metal=Glass mallet=Nail hardness=.5 ring=20 hum=0 word=Whoosh speak=2 air=.5 sing=.2 beat=1 width=1 swell=.04 point=.55 clarity=.8 contagion=-.5 stagger=.6 wear=.7 knock=.5 volume=1.5 | climb | stars | A nail on long glass that says whoosh
Dew on a spider's thread | - | metal=Glass mallet=Wood hardness=.15 ring=2 hum=0 word=Seem speak=.9 sing=0 tract=-4 stray=.2 beat=.5 point=.8 clarity=.9 contagion=.7 stagger=.15 air=.25 volume=1.5 | points 2.gain=7.5 | rain | Short glass under the softest wood says seem
Pin of light | - | metal=Glass mallet=Nail hardness=.25 ring=6 hum=0 sing=.2 stray=0 clarity=1 wear=.5 word=Nay_nay speak=2 point=.2 contagion=.6 stagger=.3 beat=3.2 air=.1 width=.95 volume=6 | glimmer | answer | A nail on tuned glass that opens and shuts its mouth
`,
    },
    {
      id: 'bass-gong-vowel',
      name: 'Gongs that say it low',
      category: 'bass',
      rows: `
Cellar mouth | Bass gong vowel | hum=.9 speak=4 stray=0 point=.9 beat=2 tract=-2 sing=.9 mallet=Felt hardness=.6 clarity=.85 swell=.06 contagion=.6 stagger=.45 wear=.3 air=0 volume=3 | deep | low | A tuned low plate under firm felt beats over a deep hum and says home
Tide gate | Bass gong vowel | word=Ah_oh_oo speak=3 hardness=.4 stray=.3 ring=20 point=.5 contagion=.6 wear=.85 beat=.7 air=.2 volume=4 | cave 1.mix=.18 | gong | A low plate closes from ah to oo and turns wide
Coal barge at a lock | Bass gong vowel | word=Noon speak=5 wear=.9 hum=.6 mallet=Wood hardness=.3 knock=.5 clarity=.85 beat=.5 volume=5.5 | iron | drone | A dark plate under wood with a knock, its mouth mostly shut
Mountain clearing throat | Bass gong vowel | word=Nay_nay speak=3 stray=1 hardness=.5 tract=-8 point=.7 contagion=.8 stagger=.25 beat=.2 air=.2 volume=5.5 | giant | gong | A raw plate in a giant's mouth opens twice
Ore in the hold | Bass gong vowel | word=Hum sing=.9 ring=40 beat=.2 hum=.7 contagion=.5 wear=.3 air=.3 knock=.5 volume=1 | pane 3.outputGain=8.5 | drone | A plate that only hums, with the octave below it | drone
Bass that says yes | - | metal=Harmonic stray=0 hardness=.35 hum=.5 ring=10 sing=.6 release=.6 word=We speak=.8 tract=-3 contagion=0 width=.2 beat=0 swell=.1 point=.35 clarity=.65 wear=.8 air=.2 | iron | walk | A tuned low body opens from oo to ee on each note
Pulpit oak | - | metal=Harmonic stray=.1 hardness=.25 hum=.7 ring=8 sing=.4 release=.7 word=Home speak=.7 tract=-4 contagion=0 width=.3 point=.2 clarity=.7 stagger=.6 wear=.85 air=.2 volume=2.5 | triode | walk | A felted low body says a short home
Bass at a round table | - | metal=Harmonic stray=0 hardness=.15 hum=.3 ring=14 sing=.7 release=.5 word=Ah_oh_oo speak=1.6 tract=-6 beat=.2 clarity=.8 wear=.25 | narrow | low | A soft tuned bass, ah to oo in a large mouth
Bow left at home | - | metal=Harmonic stray=.2 mallet=Nail hardness=.2 hum=.4 ring=6 sing=.3 release=.6 word=Ay_ma speak=.9 tract=-4 width=.3 point=.55 clarity=.85 stagger=.5 wear=.7 beat=1.1 air=.05 volume=0 | board | walk | Low notes plucked with a nail that say ay ma
Bus shelter bass | - | metal=Harmonic stray=.5 hardness=.6 hum=.2 ring=5 sing=.6 release=.8 word=Nay_nay speak=.5 tract=-2 beat=.6 width=.5 point=.6 stagger=.9 wear=.25 air=.15 volume=2 | cassette | walk | A hard low body says nay nay and stops with the key
Timber under the pier | - | metal=Bar hardness=.4 hum=.5 ring=20 sing=.4 release=.4 word=Home speak=1 tract=-3 stray=.4 knock=.5 point=.35 clarity=.95 stagger=.8 wear=.15 air=.2 width=.4 | clay | walk | Low wooden bars with a thump say home
Log canoe | - | metal=Bar mallet=Wood hardness=.2 hum=.35 ring=24 sing=.2 release=.2 word=Ah_oh_oo speak=1.4 tract=-6 width=.5 wear=.75 beat=.9 volume=1.5 | skin | low | Soft wood on low bars, ah, oh, oo in a large mouth
Cargo hatch | - | metal=Bar mallet=Wood hardness=.7 hum=.7 ring=12 sing=0 release=.5 word=We speak=.6 tract=-5 stray=1 knock=.6 point=.3 contagion=1 wear=.8 beat=.9 air=.05 width=.4 volume=3.5 | stub 1.mix=.18 | low | Hard wood on raw low bars that say we
Barrels in a row | - | metal=Bar hardness=.2 ring=16 sing=.6 release=.6 word=Nay_nay speak=.9 tract=-4 width=.3 wear=.7 hum=.75 point=.95 contagion=-.2 stagger=.6 air=.05 volume=2 | gatefilter | walk | Dark low bars with the full octave below say nay nay
Peat cutter's song | - | metal=Bar mallet=Nail hardness=.3 ring=30 sing=.7 release=.3 word=Seem speak=2 tract=-3 stray=.2 wear=.7 hum=.9 clarity=.75 contagion=.5 stagger=.75 width=.15 volume=0 | gourd | low | Thumbed low bars that close from ee to nothing
Rain on the bell rope | - | metal=Bell stray=.6 hardness=.5 hum=.6 ring=34 sing=.2 release=0 word=Ah_oh_oo speak=4 tract=-5 beat=1 clarity=.75 contagion=.8 stagger=.6 wear=.15 width=.55 volume=3.5 | stairwell | gong | A low cast bell says ah, oh, oo and beats once a second | bell
Harbour before engines | - | metal=Bell stray=.8 mallet=Wood hardness=.4 hum=.5 ring=26 sing=0 release=0 word=Home speak=6 tract=-7 wear=.7 contagion=1 beat=.1 knock=.45 volume=5.5 | shore | gong | Wood on a raw low bell, home in a giant's mouth | bell
Drowned belfry | - | metal=Bell stray=.5 hardness=.35 hum=.8 ring=40 sing=.4 word=We speak=7 tract=-8 wear=.8 beat=.4 swell=.1 clarity=.7 contagion=.9 stagger=.5 width=.55 volume=-1 | under | low | A low bell that opens slowly towards ee | bell
Undertaker's clock | - | metal=Bell stray=.3 hardness=.6 hum=.4 ring=12 sing=0 release=.3 word=Seem speak=2 tract=-4 beat=.2 knock=.5 wear=.5 clarity=.95 contagion=.5 stagger=.75 width=.15 volume=-1 | box | walk | A low bell struck hard that says seem and shuts
Below the bell pit | - | metal=Bell stray=0 hardness=.2 hum=1 ring=30 sing=.8 word=Hum speak=5 tract=-3 clarity=1 width=.4 point=.75 contagion=.9 stagger=.6 wear=.1 beat=.4 volume=5.5 | sub | drone | A tuned low bell hums with all of its octave below | drone
Unhurried ground | - | swell=.6 sing=1 hum=.6 hardness=.3 word=Ah_oh_oo speak=9 tract=-5 knock=0 release=.4 beat=.3 metal=Bar stray=.4 point=.6 clarity=.8 stagger=.85 wear=.15 air=.3 width=.95 | dark | drone | Low bars fed by the key take nine seconds from ah to oo | drone
Engine room prayer | - | metal=Plate stray=.4 swell=.4 sing=1 hum=.7 hardness=.5 word=Ay_ma speak=6 tract=-4 knock=0 release=.3 beat=1.6 point=.6 clarity=.8 contagion=1 stagger=.7 width=.75 volume=0 | howls | drone | A low fed plate that beats and says ay ma | drone
Field at four below | - | metal=Glass stray=0 swell=1.2 sing=1 hum=.8 hardness=.4 word=Home speak=8 tract=-4 knock=0 wear=.5 contagion=.9 beat=0 air=.3 width=.85 volume=-1 | frozen | drone | Low tuned glass fed for as long as it is held says home | drone
Where the rivers join | - | metal=Bell stray=.2 swell=.9 sing=1 hum=.5 hardness=.45 word=We speak=10 tract=-2 knock=0 beat=1 contagion=1 point=.55 clarity=.75 stagger=.7 width=.7 | water | fifth | Low bells that swell and share one slow we | drone
Boiler in December | - | metal=Plate stray=.8 swell=1.8 sing=1 hum=.5 hardness=.6 word=Whoosh speak=5 air=.5 tract=-5 knock=0 clarity=.9 contagion=.6 stagger=.85 width=.7 volume=-.5 | pipe | drone | A raw low plate comes up on a breath, whoosh | drone
The great bottle | - | mallet=Breath release=.6 metal=Plate stray=.3 swell=.3 hum=.8 sing=1 air=.7 word=Hush speak=3 tract=-8 knock=.4 point=.1 clarity=.55 wear=.8 beat=.7 width=.3 volume=6 | pipe | low | Breath across a low plate over its octave, opening into a hush
Bassoon in a blanket | - | metal=Harmonic mallet=Breath stray=.1 swell=.1 hum=.2 sing=1 air=.2 word=Ay_ma speak=1.2 tract=-2 release=.8 clarity=1 beat=.8 volume=-1.5 | box | walk | A breathed low body says ay ma while it is held | wind
Seal on the skerry | - | metal=Harmonic mallet=Breath stray=.3 swell=.25 hum=.6 sing=.9 air=.35 word=We speak=1.5 tract=-8 release=.5 point=.7 clarity=.85 contagion=.9 stagger=.6 wear=.1 beat=.6 width=.5 volume=-1.5 | shore | call | A breathed low body in a giant's mouth says we | wind
Slow bellows | - | metal=Bar mallet=Breath swell=.5 hum=.8 sing=1 air=.6 word=Whoosh speak=3 tract=-6 release=.3 knock=.3 point=.35 clarity=.95 contagion=0 stagger=.5 beat=.3 volume=4.5 | calm | low | Low bars worked by breath say whoosh | wind
Wind under the door | - | mallet=Breath swell=.8 stray=.6 hum=.4 sing=1 air=.8 word=Hush speak=4 release=.2 metal=Glass tract=-1 wear=.8 point=.65 clarity=.65 contagion=-.2 stagger=.75 beat=1.8 volume=-3 | rise | drone | Low glass that is mostly air says hush | texture
Dub from the basement | - | metal=Harmonic stray=0 hardness=.2 hum=.8 ring=5 sing=.3 release=.7 word=Ah_oh_oo speak=.6 tract=-4 width=.2 swell=.06 point=.8 contagion=.1 beat=1.1 volume=2 | trail | walk | A short soft bass, ah to oo
Sweeping the dance floor | - | metal=Harmonic stray=.3 hardness=.6 hum=.4 ring=8 sing=.8 release=.6 word=Ay_ma speak=.4 tract=-5 beat=.5 point=.8 clarity=.95 contagion=.7 stagger=.15 air=.3 volume=5 | notch | walk | A hard low body says ay ma twice a second or more
Elastic floorboards | - | metal=Bar mallet=Nail release=.6 word=We speak=.4 tract=-6 hum=.5 point=.3 ring=24 hardness=.25 sing=.6 clarity=.9 stagger=.9 wear=.65 beat=1 volume=-1.5 | near 2.gain=5 | walk | Thumbed low bars that say we in a moment
Limestone steps | - | metal=Plate mallet=Wood hardness=.3 hum=.5 ring=4 sing=0 release=.5 word=Home speak=.6 tract=-5 stray=.3 clarity=.65 contagion=1 wear=.15 beat=.4 air=.2 knock=.3 volume=6 | bounces 2.gain=13 | low | A short low plate under wood says home
Night bus, upper deck | - | metal=Bell stray=0 hardness=.3 hum=.5 ring=4 sing=.5 release=.7 word=Nay_nay speak=.7 tract=-3 point=.9 contagion=0 beat=1.4 volume=5.5 | chop | walk | Tuned low bells under felt say nay nay
Gong fathoms down | - | metal=Plate stray=.9 hardness=.3 hum=.4 ring=40 sing=.4 release=0 word=Seem speak=8 tract=-6 width=1 wear=.7 swell=.06 clarity=.5 stagger=.5 beat=.4 air=.25 volume=5 | shallows | gong | A raw low plate that closes over eight seconds from ee
Great wheel in low gear | - | metal=Plate stray=.5 hardness=.6 hum=.3 ring=30 sing=.3 release=0 word=We speak=2 tract=-5 width=1 beat=2.5 contagion=.9 knock=.45 volume=6 | sweep | gong | A hard-struck low plate that beats and says we
Monolith at sunset | - | metal=Plate stray=.1 hardness=.45 hum=.6 ring=36 sing=.7 release=0 word=Ay_ma speak=12 tract=-7 width=1 point=.75 clarity=.85 contagion=.9 stagger=.6 wear=.1 beat=.4 volume=3 | nave 1.mix=.22 | gong | A tuned low plate says ay ma over twelve seconds
Tarpaulin gong | - | metal=Plate stray=.6 mallet=Wood hardness=.2 hum=.3 ring=9 sing=0 release=.3 word=Noon speak=1.6 tract=-6 wear=.8 point=.45 beat=1.3 air=.15 knock=.15 volume=6 | skin 1.mix=.35 2.gain=13.5 | gong | A dark plate under soft wood closes its lips at once
Gong of the dry lake | - | metal=Plate stray=.8 mallet=Breath swell=.3 hum=.5 ring=24 sing=.6 air=.4 word=Ah_oh_oo speak=5 tract=-5 width=1 point=.75 contagion=.1 stagger=.8 wear=.4 beat=.9 volume=5.5 | gourd 1.mix=.3 | low | A low plate woken by a breath, ah, oh, oo
Giant at the sink | Giant's hum | speak=3 word=Ah_oh_oo knock=.4 ring=16 tract=-6 point=1 stagger=.85 wear=.25 air=.2 width=.4 volume=-2.5 | tube | low | A giant's mouth closes from ah to oo over a full hum
Cave painter hums | Giant's hum | swell=.6 knock=.1 air=.4 beat=1 tract=-7 point=.55 clarity=.55 stagger=.7 wear=.2 width=.9 | cavern | fifth | Low bells swell into a hum with shut lips and breath | drone
Giant down the corridor | Giant's hum | word=Nay_nay speak=2 hardness=.6 hum=.5 sing=.7 release=.4 clarity=.8 wear=.85 air=.1 volume=.5 | nextdoor | walk | A giant's mouth says nay nay over a low hum
Asleep under a glacier | Giant's hum | metal=Glass word=Home speak=7 wear=.6 hum=.6 stray=.2 point=.95 clarity=.95 stagger=.7 air=.2 width=.3 volume=-4.5 | frost | gong | Tuned low glass in a giant's mouth says home
Snore on the mountain | Giant's hum | metal=Harmonic word=Whoosh speak=2.5 air=.6 hum=.5 swell=.3 point=.3 clarity=.9 stagger=.85 wear=.2 width=.95 volume=-1 | halo | low | A low fed body breathes whoosh from a giant's mouth | texture
Pedal of the old bell | - | metal=Bell stray=.1 hardness=.4 hum=.9 ring=20 sing=.9 release=.5 word=Ah_oh_oo speak=2 tract=0 swell=.05 beat=.1 point=.5 contagion=-.3 stagger=.05 volume=-1 | pipes | low | A tuned low bell held by the key, ah to oo above its octave
Lowest row of the choir | - | metal=Harmonic stray=0 swell=.3 sing=1 hum=.4 hardness=.5 word=We speak=3 tract=-4 knock=0 release=.6 clarity=1 air=.15 wear=.35 beat=.7 | monks | organum | A clear low body swells and says we like a bass singer | voice
Basso filling his lungs | - | metal=Bell stray=0 swell=.5 sing=1 hum=.5 hardness=.35 word=Ay_ma speak=4 tract=-5 knock=0 air=.4 release=.5 point=.75 clarity=.9 stagger=.95 wear=.05 width=.85 | reel | drone | Tuned low bells swell and say ay ma with breath | voice
Roots in the bell frame | - | metal=Harmonic stray=0 hardness=.1 hum=1 ring=40 sing=.8 release=.2 word=Hum tract=-2 speak=6 beat=.15 width=.1 clarity=.95 wear=.45 volume=1 | sides | drone | The purest low hum, lips shut, barely beating | drone
Lorry over the bridge | - | metal=Plate stray=1 hardness=.8 hum=.7 ring=10 sing=0 release=.1 word=Home speak=2 tract=-8 wear=.9 knock=.7 clarity=.75 stagger=.7 beat=.2 air=.3 width=.4 volume=1 | valley 3.gain=5.5 | gong | A hard blow on a raw plate with a thump, home in a giant's mouth
`,
    },
    {
      id: 'sung-bronze',
      name: 'Sung bronze',
      category: 'voice',
      rows: `
Vowels at evensong | Sung bronze | speak=4 air=.2 beat=.3 swell=.6 point=.4 wear=.7 | cathedral | vesper | Bells fed by the keys sing ah, oh, oo on pure harmonics
Choir of one metal | Sung bronze | contagion=1 stagger=0 word=We speak=3 tract=2 width=.3 volume=-3.5 | bright | suspend | Sung bells that all come round to the same we
Wordless at the altar | Sung bronze | word=Hum air=.15 hum=.4 swell=1 beat=.6 point=.85 volume=1 | hall | chain | Sung bells with closed lips and the octave below
Litany, left side | Sung bronze | word=Ay_ma speak=2.4 stagger=.8 swell=.3 tract=-2 point=.9 wear=.35 beat=0 width=.85 volume=0 | table | hymn | Sung bells that say ay ma, each key at its own pace
Gallery over the door | Sung bronze | word=Seem speak=6 air=.5 tract=3 swell=.8 stray=.2 point=.45 wear=.05 width=.9 volume=-2.5 | rise | fifth | High-mouthed sung bells go from ee to shut lips with breath
Alone in the choir loft | - | metal=Harmonic stray=0 swell=.12 sing=1 hum=0 hardness=.4 knock=0 word=Ah_oh_oo speak=1.6 air=.15 release=.6 tract=0 clarity=1 beat=0 width=.2 wear=.4 volume=-1.5 | singer | chant | One clear fed voice from ah to oo
Woman calling goats | - | metal=Harmonic stray=0 swell=.06 sing=1 hardness=.6 knock=0 word=We speak=1 air=.1 release=.7 beat=.2 width=.3 wear=.6 tract=-3 clarity=.8 hum=.1 contagion=.8 volume=-.5 | valley 1.level=1 | call | A voice thrown out plainly, opening from oo to ee
Tenor in the washroom | - | metal=Harmonic stray=0 swell=.15 sing=1 hum=.2 hardness=.5 knock=0 word=Home speak=2 air=.1 release=.6 tract=-3 clarity=1 beat=.4 width=.2 stagger=.6 wear=.4 volume=-1.5 | chamber | chant | A low clear voice that says home
Mezzo behind a curtain | - | metal=Harmonic stray=.05 swell=.25 sing=1 hum=.1 hardness=.3 knock=0 word=Nay_nay speak=2.4 air=.35 release=.5 tract=-1 clarity=1 beat=.6 width=.4 point=.2 contagion=.8 wear=.5 volume=5 | calm | treble | A soft breathy voice that closes its mouth twice
Falsetto over rooftops | - | metal=Harmonic stray=0 swell=.2 sing=1 knock=0 speak=3 air=.5 release=.5 beat=.3 width=.5 word=Home tract=3 hum=.1 wear=.7 clarity=.7 hardness=.2 point=.6 stagger=.8 volume=-2 | bucket | treble | A thin high voice with breath says home
Brothers in the crypt | - | metal=Harmonic stray=0 swell=.4 sing=1 hum=.5 hardness=.45 knock=0 word=Ah_oh_oo speak=5 tract=-6 air=.2 release=.4 clarity=1 beat=.8 point=.75 contagion=-.3 stagger=.15 wear=.65 width=.3 | dark | organum | Low mouths with the octave below sing ah, oh, oo
Salt miners' hymn | - | metal=Bell stray=0 swell=.2 sing=1 hum=.6 hardness=.6 knock=.1 word=Home speak=3 tract=-7 air=.1 release=.5 beat=1.4 point=1 clarity=.85 contagion=.6 stagger=.85 wear=.25 width=.85 | cavern | hymn | Tuned bells in giant mouths say home
Basses in the back pew | - | metal=Harmonic stray=.1 swell=.3 sing=1 hum=.8 hardness=.2 knock=0 word=Hum tract=-4 air=.3 release=.5 speak=6 width=.6 point=.15 stagger=.05 wear=.45 beat=1.3 volume=-14 | bare | organum | Low voices humming with shut lips and breath
Throat song, open steppe | - | metal=Harmonic stray=0 swell=.1 sing=1 hum=.7 hardness=.9 knock=0 word=We speak=6 tract=-5 clarity=1 release=.6 beat=0 width=.2 wear=.7 volume=5 | whistle | drone | A hard low voice that opens slowly towards ee | drone
Oxen and men | - | metal=Harmonic stray=.3 swell=.5 sing=1 hum=.4 hardness=.5 knock=.2 word=Nay_nay speak=4 tract=-9 air=.4 release=.3 beat=2 point=1 contagion=1 stagger=.15 wear=.15 width=.6 volume=-1.5 | coil | low | Rough giant mouths that open and close, nay nay
Schoolyard at recess | - | metal=Harmonic stray=0 swell=.08 sing=1 hum=0 hardness=.5 knock=.1 word=Nay_nay speak=.9 tract=7 air=.2 release=.6 stagger=1 beat=.4 contagion=0 point=.8 wear=.45 width=.7 volume=5 | flock | changes | Small mouths sing nay nay, each at its own pace
First communion | - | metal=Harmonic stray=0 swell=.35 sing=1 hum=0 hardness=.3 knock=0 word=Ah_oh_oo speak=4 tract=5 air=.25 release=.4 stagger=.1 beat=.2 clarity=1 point=.55 wear=.1 | cathedral 1.mix=.24 | treble | Small clear mouths go together from ah to oo
Paper boats in a row | - | metal=Glass stray=0 swell=.3 sing=1 hum=0 hardness=.45 knock=0 word=Home speak=2.4 tract=4 air=.2 release=.4 width=1 point=.65 contagion=.9 stagger=.3 beat=.3 | fifthup | answer | Tuned glass with a small mouth sings home
Carol on tiptoe | - | metal=Bell stray=0 swell=.15 sing=1 hum=.1 hardness=.4 knock=0 word=Seem speak=1.6 tract=6 air=.1 release=.6 clarity=1 point=.15 stagger=.85 beat=1.5 width=.15 volume=4 | silent | treble | Tuned bells with small mouths say seem
Twins on the swing | - | metal=Harmonic stray=0 swell=.1 sing=1 hum=0 hardness=.6 knock=0 word=We speak=1.3 tract=8 air=.1 release=.5 contagion=-1 beat=1 width=1 clarity=.95 stagger=.9 volume=4 | pendulum | answer | Small voices that answer each other with the opposite vowel
Nothing but whisper | - | metal=Harmonic mallet=Breath stray=0 swell=.5 sing=1 hum=.1 knock=.2 word=Ah_oh_oo speak=4 air=1 release=.4 width=1 hardness=.3 point=.2 clarity=.95 contagion=.6 stagger=.25 wear=.45 beat=.7 volume=-1.5 | shell | vesper | Nearly all breath, whispering ah, oh, oo through tuned metal
Secrets in the cloister | - | metal=Bell mallet=Breath stray=.1 swell=.2 sing=1 hum=0 knock=.3 word=Hush speak=2 air=.9 release=.6 tract=-2 stagger=.7 point=.75 contagion=.7 wear=.7 width=.9 volume=1.5 | mirrorlong | talk | Whispered tuned bells that say hush in turns
Steam and altos | - | metal=Harmonic mallet=Breath stray=.1 swell=.9 sing=1 hum=.2 knock=0 word=Whoosh speak=3.6 air=.8 release=.3 tract=-2 point=.35 clarity=.9 contagion=-.5 stagger=.65 wear=.9 width=.55 volume=6 | fogged | suspend | A choir of breath that goes round and shut and back to air
Asleep in the pew | - | metal=Glass mallet=Breath stray=0 swell=.8 sing=.9 hum=.3 knock=0 word=Hum speak=6 air=.7 release=.2 tract=-4 point=.1 clarity=.85 contagion=.2 beat=1.7 width=.3 volume=5.5 | sigh | alone | Breath through tuned glass with the lips closed
Prayer against the wall | - | metal=Plate mallet=Breath stray=0 sing=1 hum=.2 knock=0 word=Ay_ma speak=2 air=.7 release=.5 tract=-3 clarity=1 swell=.12 point=.85 contagion=.7 stagger=.45 wear=.65 width=.95 volume=6 | box | chant | A whispered plate tuned to the key says ay ma
Brass angels in storage | - | metal=Bell stray=.7 swell=.8 sing=1 hum=.2 hardness=.5 knock=0 word=Ah_oh_oo speak=6 air=.2 release=.2 beat=1.2 width=1 clarity=.85 wear=.4 volume=-1.5 | swirl | chain | Untuned bells that swell and sing ah, oh, oo | pad
Molten procession | - | metal=Plate stray=.6 swell=1.4 sing=1 hum=.4 hardness=.6 knock=0 word=We speak=7 air=.1 release=.1 tract=-3 width=1 point=.05 clarity=.65 contagion=.2 beat=1.8 | warmhaze | suspend | A raw plate swells and opens slowly from oo to ee | pad
Verdigris chorus | - | metal=Bell stray=1 swell=.3 sing=1 hum=0 hardness=.35 knock=0 word=Home speak=3.5 air=.4 release=.3 tract=-5 beat=2.5 point=.95 stagger=.55 wear=.3 width=.8 | sag | answer | Raw bells held by the key say home and beat | pad
Night shift sings | - | metal=Bar stray=.7 swell=.4 sing=1 hum=.3 hardness=.7 knock=0 word=Nay_nay speak=3 air=.1 release=.3 tract=-2 clarity=1 point=.4 stagger=.4 volume=6 | stiff | organum | Raw bars fed until they sing nay nay | pad
Bronze at the waterline | - | metal=Bell stray=.45 swell=1.2 sing=1 hum=.5 hardness=.3 knock=0 word=Noon speak=9 air=.2 release=.1 tract=-4 wear=.7 point=.05 clarity=.8 stagger=.7 beat=.1 volume=6 | shallows | drone | Bells over a second in coming that shut and open their lips | pad
Open glass mouths | - | metal=Glass stray=0 swell=.4 sing=1 hum=0 hardness=.7 knock=0 word=Ah_oh_oo speak=8 air=.1 release=.3 clarity=1 tract=-1 width=1 contagion=.9 beat=.2 | fifths | vesper | Bright tuned glass that stays long on ah | pad
Chandelier sings back | - | metal=Glass stray=.4 swell=.2 sing=1 hum=0 hardness=.5 knock=0 word=We speak=2 air=.2 release=.1 contagion=1 width=1 beat=1.5 point=.55 | twinkle | answer | Glass that learns we from the newest key
Window full of voices | - | metal=Glass stray=.1 swell=1.2 sing=1 hum=.2 hardness=.3 knock=0 word=Ay_ma speak=5 air=.5 release=.2 tract=-4 clarity=.8 stagger=.6 wear=.4 beat=.1 width=.85 volume=-2 | veil | suspend | Low-mouthed glass that swells and says ay ma with breath | pad
Cathedral of ice | - | metal=Glass stray=.8 swell=.6 sing=1 hum=.1 hardness=.6 knock=0 word=Seem speak=4 air=.3 release=.2 tract=-3 wear=.1 point=.7 clarity=.7 stagger=.65 beat=2.8 volume=-1.5 | winter | fifth | Raw glass held until it has said seem | pad
Far end of the table | - | metal=Glass stray=0 swell=.1 sing=1 hum=.4 hardness=.2 knock=0 word=Home speak=1.4 air=.05 release=.6 clarity=1 width=.4 point=.6 stagger=.8 wear=.15 | tones | organum | Tuned glass with an octave below says home plainly | organ
Fiddlers half talking | - | metal=Harmonic stray=.1 swell=.2 sing=1 hum=0 hardness=.7 knock=0 word=Ah_oh_oo speak=5 clarity=.5 air=.1 release=.4 beat=1.6 width=.8 point=.85 stagger=.8 wear=.4 volume=0 | ensemble | hymn | A bright body swelling like bows, only half a vowel | string
Viols at low water | - | metal=Harmonic stray=.15 swell=.35 sing=1 hum=.2 hardness=.5 knock=0 word=Home speak=4 clarity=.4 air=.15 release=.4 tract=-4 beat=.8 point=.25 contagion=.1 stagger=.1 wear=.85 width=.95 | board | chain | A dark body that swells like gut strings and half says home | string
Bowed saw at dusk | - | metal=Plate stray=0 swell=.3 sing=1 hardness=.4 knock=0 word=We speak=2.4 clarity=.7 release=.4 beat=.3 width=.3 wear=.7 hum=.3 tract=-4 point=.3 contagion=-.2 stagger=.4 volume=-4 | swellin | chant | A tuned plate swelling like a bow opens from oo to ee | string
Kettle of crickets | - | metal=Harmonic stray=.6 swell=.5 sing=1 hum=0 hardness=.8 knock=0 word=Seem speak=3 clarity=.6 air=.2 release=.3 tract=-3 beat=4 width=1 contagion=.8 stagger=.6 volume=-1.5 | light | fifth | An untuned body that flutters like many bows and says seem | string
One string, two players | - | metal=Harmonic stray=0 swell=.8 sing=1 hum=.1 hardness=.6 knock=0 word=Nay_nay speak=5 clarity=.3 release=.2 beat=2.6 width=1 tract=-5 point=.95 contagion=.5 stagger=.35 air=.05 volume=3 | doubled | vesper | A bowed body in two beating halves that hardly speaks | string
Small pipes wide open | - | metal=Harmonic stray=0 swell=.05 sing=1 hum=.3 hardness=.55 knock=.1 word=Ah_oh_oo speak=20 air=.1 release=1 beat=0 clarity=.6 width=.5 wear=.05 | silver | hymn | A fed body that keeps its ah for seconds and stops at once | organ
Chapel with a cold | - | metal=Harmonic stray=.1 swell=.1 sing=1 hum=.6 hardness=.3 knock=.2 word=Hum air=.4 release=.9 beat=1 tract=-2 speak=3 point=.55 clarity=.8 contagion=1 stagger=.7 width=.75 | hollow | organum | A breathy low organ of closed mouths | organ
Barrel organ, far lane | - | metal=Bell stray=0 swell=.04 sing=1 hum=0 hardness=.7 knock=0 word=Nay_nay speak=1.2 release=1 beat=3 tract=3 clarity=.8 contagion=1 volume=3.5 | shore | hymn | Tuned bells held by the key that beat and say nay nay | organ
Stops pulled one by one | - | metal=Harmonic stray=0 swell=.15 sing=1 hum=.2 hardness=.9 knock=0 word=We speak=6 release=.9 beat=.2 clarity=1 stagger=1 tract=-3 wear=.45 volume=-1.5 | prism | vesper | A hard body that takes six seconds from oo to ee | organ
Organ of frozen pipes | - | metal=Glass stray=0 swell=.06 sing=1 hum=.5 hardness=.4 knock=.1 word=Noon speak=2.6 release=1 beat=.8 wear=.6 point=.6 contagion=-.2 stagger=0 volume=-.5 | frozen 3.outputGain=9.5 | hymn | Tuned glass that closes and opens over its octave | organ
Mass on the shortwave | - | metal=Harmonic stray=0 swell=.5 sing=1 hum=.1 hardness=.4 knock=0 word=Ah_oh_oo speak=3 air=.3 release=.3 beat=.6 tract=1 clarity=.85 stagger=.55 wear=.45 width=.2 | shortwave | hymn | A choir of tuned metal from ah to oo
Snowed-in psalm | - | metal=Bell stray=0 swell=.7 sing=1 hum=.3 hardness=.3 knock=0 word=Home speak=4 air=.6 release=.2 tract=-3 wear=.8 point=.1 clarity=1 stagger=.9 beat=1.6 width=.35 | frost | suspend | Soft breathy bells sing home
Pollen in the gallery | - | metal=Harmonic stray=0 swell=.4 sing=1 hum=0 hardness=.5 knock=0 word=We speak=2.6 air=.4 release=.2 tract=3 width=1 stagger=.9 clarity=.9 beat=.5 | choirgrain | answer | Light voices, each in its own time, opening on ee
Photographic negative | - | metal=Harmonic stray=.2 swell=.3 sing=1 hum=0 hardness=.6 knock=0 word=Hush speak=2.4 air=.5 release=.5 tract=-4 clarity=1 point=.6 stagger=.55 wear=.95 beat=1.4 volume=.5 | ghost | chant | Low voices that go from a round er to a hiss
Voices kept in wax | - | metal=Harmonic stray=.1 swell=.2 sing=1 hardness=.35 knock=0 word=Ay_ma speak=1.8 air=.3 release=.5 beat=1.2 width=.2 tract=-3 wear=.7 hum=.3 clarity=.8 point=.2 volume=.5 | parlour | treble | Breathy voices that say ay ma
`,
    },
    {
      id: 'answering-bells',
      name: 'Answering bells',
      category: 'bell',
      rows: `
A bell on either hill | Answering bells | speak=3 tract=-2 hum=.3 point=.2 wear=.3 beat=1.9 air=.2 | glow | answer | Bells that turn each other to the opposite of we, deep and wide
The elder corrects | Answering bells | word=Ah_oh_oo speak=4 sing=.9 contagion=-.7 hardness=.4 stray=.85 beat=2 tract=2 swell=.08 point=.2 wear=.55 air=.35 knock=.4 volume=-1.5 | hall 1.mix=.2 | suspend | Raw held bells that lean away from the newest vowel, ah against oo
Yes, no, perhaps | Answering bells | word=Nay_nay speak=1.4 tract=1 ring=8 hardness=.8 point=.9 clarity=.5 wear=.75 beat=2.9 knock=.05 volume=4.5 | booth | changes | Hard-struck bells at the waist, open against closed
Half the field in frost | Answering bells | word=Seem speak=3 stray=.9 tract=2 stagger=.5 ring=12 swell=.04 wear=.45 beat=.4 air=.2 volume=1 | earturn | call | Raw bells set to the opposite of seem
Ferry leaves the bell | Answering bells | word=Home speak=5 hum=.6 tract=-6 wear=.8 swell=.04 point=.55 beat=1.6 volume=-2.5 | shore | answer | Dark bells that answer home with its opposite
Sparrows contradict | - | metal=Harmonic stray=.2 tract=6 contagion=-1 stagger=1 word=We speak=.8 hardness=.6 ring=8 hum=0 sing=.4 release=.3 swell=.08 point=.15 beat=1.2 air=.25 width=.85 knock=.15 volume=.5 | stars | rain | Small tuned mouths, each set against the last one's we
Playground treaty | - | metal=Harmonic stray=0 tract=5 contagion=-.9 stagger=.6 word=Nay_nay speak=.6 sing=.5 release=.4 point=.6 hardness=.55 hum=.1 clarity=.7 ring=10 beat=1.7 air=.05 knock=0 volume=6 | round | changes | Small mouths that open when the others close
Kettles on one hob | - | metal=Bell stray=.2 tract=4 contagion=-1 stagger=.8 word=Hush speak=1.2 air=.4 ring=6 hum=0 sing=.5 swell=.08 point=.35 clarity=.75 wear=.75 width=.35 knock=.35 volume=6 | bloomfilter 3.outputGain=6 | talk | Small bells, some hissing while the others open
Raised voices | - | metal=Bell stray=.5 tract=3 contagion=-1 stagger=.9 word=Ay_ma speak=1 hardness=.7 ring=5 hum=0 sing=.3 point=.8 clarity=.8 wear=.85 beat=3 volume=5.5 | drift | talk | Quick bells that say ay ma against each other
Magpies on the wire | - | metal=Harmonic stray=.7 mallet=Wood tract=4 contagion=-1 stagger=1 word=Noon speak=1 hardness=.5 ring=7 hum=0 sing=.2 knock=.4 beat=.4 air=.35 width=.6 volume=6 | stumble 3.gain=6 | run | Wood on an untuned body, mouths opening in turns
Grandfather and child | - | metal=Bell stray=.3 tract=0 contagion=-.5 stagger=1 word=Ah_oh_oo speak=6 hum=.4 ring=24 sing=.5 swell=.08 point=.05 clarity=.8 wear=.4 beat=.1 air=.3 width=.65 knock=.35 | stairwell | answer | Low bells speak slowly and high ones fast, vowels apart
Slow reply in the hills | - | stray=.6 tract=-4 contagion=-.8 stagger=1 word=Home speak=8 hum=.5 ring=30 mallet=Wood hardness=.4 release=0 metal=Plate swell=.1 point=.7 clarity=.45 wear=.65 beat=2.1 air=.15 width=.65 volume=6 | valley | answer | Wood on plates that take eight seconds over home and its opposite
Letter, then telegram | - | metal=Harmonic stray=.1 tract=-2 contagion=-.6 stagger=1 word=We speak=4 hum=.2 ring=14 sing=.6 release=.2 swell=.04 point=.75 clarity=.6 wear=.65 beat=2.2 volume=-1.5 | bucket 1.mix=.2 | call | A tuned body, low keys slow and high keys quick, saying we
Clock and cuckoo | - | metal=Bar stray=.5 tract=2 contagion=-.9 stagger=1 word=Noon speak=3 hardness=.6 ring=20 hum=0 mallet=Wood knock=.5 clarity=.7 beat=1.3 volume=3.5 | board | call | Wood on bars that shut and open at their own pace | keys
Turtle, hare, turtle | - | metal=Glass stray=.2 contagion=-.7 stagger=1 word=Nay_nay speak=3 hum=.2 ring=8 hardness=.5 tract=-3 swell=.1 clarity=1 beat=1.2 volume=4.5 | moons | answer | Low glass slow, high glass quick, opening against each other
Pupils in a row | - | metal=Bell contagion=1 stagger=0 stray=.2 word=We speak=2 hardness=.5 hum=.1 sing=.8 tract=1 point=.5 clarity=.85 wear=.65 width=.55 volume=-1.5 | brightplate 1.mix=.14 | changes | Bells that all learn we from the one just struck
The word goes round | - | metal=Bell contagion=.9 stagger=.3 stray=.6 word=Ay_ma speak=4 hardness=.65 hum=.3 sing=.6 beat=1.5 point=.65 clarity=.7 wear=.75 volume=-1.5 | patter | call | Bells that pass ay ma on and beat as they do
Roll call at dawn | - | metal=Plate contagion=1 stagger=0 stray=.2 word=Ah_oh_oo speak=3 hardness=.4 hum=.1 sing=.7 tract=-2 ring=14 point=.45 clarity=.95 air=.05 knock=.05 volume=1 | lit | peal | Plates that each bring the rest back to ah
Teaching the tower | - | metal=Bell contagion=1 stagger=.5 stray=.4 word=Seem speak=3 hardness=.35 hum=.5 sing=.9 tract=-4 wear=.7 clarity=.9 width=.2 | monks | answer | Dark bells that learn seem from the newest
Handed down in brass | - | metal=Harmonic contagion=1 stagger=.1 stray=.3 word=Nay_nay speak=2 hardness=.7 hum=.1 sing=.8 tract=-3 release=.3 point=.8 swell=.08 clarity=.85 beat=.4 knock=.25 volume=6 | chime | changes | A bright body whose keys open and close as one
Canon at the well | - | metal=Bell contagion=-1 stray=.1 word=Ah_oh_oo speak=2.4 hardness=.5 hum=0 sing=.5 ring=10 tract=1 stagger=.7 wear=.2 beat=1.4 air=.35 width=.7 volume=1 | round | canon | Tuned bells, ah against oo
Mirror in the belfry | - | metal=Bell contagion=-1 stray=.7 word=We speak=2 hardness=.6 hum=.2 ring=8 sing=.2 mallet=Wood point=.1 clarity=.75 stagger=.4 knock=.3 volume=0 | mirror | canon | Wood at the rim of raw bells, we against its opposite
Three rooms, one song | - | metal=Glass contagion=-.8 stray=.1 word=Home speak=2 hardness=.4 hum=.1 ring=6 sing=.4 tract=-4 clarity=.85 stagger=.75 wear=.3 beat=.4 air=.3 width=.8 knock=.3 volume=-1.5 | prism | canon | Low glass that answers home with its opposite
Bells over the canal | - | metal=Bell contagion=-.6 stray=.3 word=Noon speak=2.6 hardness=.4 hum=.2 ring=14 sing=.6 beat=2 width=1 swell=.08 point=.4 clarity=.85 stagger=.4 knock=.3 volume=6 | loop | peal | Wide beating bells that close in turn
Last word twice | - | metal=Harmonic contagion=-1 stray=0 word=Ay_ma speak=1.6 hardness=.5 hum=.1 ring=7 sing=.6 release=.4 tract=-1 wear=.4 beat=.2 air=.35 knock=.4 volume=1 | recall | talk | Tuned keys that say ay ma against each other | keys
Glass opinions | - | metal=Glass contagion=-1 stagger=.8 word=We speak=3 hardness=.4 hum=0 sing=.7 width=1 stray=.5 swell=.08 clarity=.55 wear=.6 beat=0 air=.25 | overtones | answer | Glasses set to opposite vowels of we, spread wide
Splitting the moonbeam | - | metal=Glass contagion=-1 stagger=.4 word=Ah_oh_oo speak=5 hardness=.6 hum=.1 sing=.8 stray=0 clarity=1 tract=-3 swell=.1 beat=.7 volume=-.5 | prism 1.mix=.22 | suspend | Tuned glass, ah on one key and oo on another
Panes disagree | - | metal=Glass contagion=-.8 stagger=1 word=Hush speak=2 air=.5 hardness=.5 hum=0 sing=.5 ring=8 stray=.8 tract=-2 mallet=Wood clarity=.4 wear=.6 beat=.2 width=.25 volume=6 | evened | plucks | Raw glass under wood, one key hissing as another opens
Cut crystal on stone | - | metal=Glass contagion=-1 stagger=.2 word=Seem speak=2 mallet=Nail hardness=.4 hum=0 sing=.3 ring=10 stray=.6 tract=-2 clarity=.5 wear=.7 beat=2.2 width=.35 knock=.5 volume=-4 | chimes | run | A nail on glass that turns the rest against seem
Dew argues with frost | - | metal=Glass contagion=-.7 stagger=.7 word=Nay_nay speak=2 mallet=Wood hardness=.25 hum=.3 sing=.4 ring=5 tract=-5 beat=2 point=.3 clarity=.9 wear=.2 air=.2 width=.85 knock=.2 volume=6 | twelve 3.outputGain=9 | canon | Low glass under soft wood, open against closed
Cymbals made of slate | - | metal=Plate contagion=-1 stagger=.6 word=Whoosh speak=3 air=.4 hardness=.6 hum=.1 ring=16 stray=.7 width=1 tract=-3 point=.65 clarity=.45 wear=.95 beat=1.9 volume=6 | evaporate | answer | Plates that rush while others go round, whoosh | texture
Copper roofs in wind | - | metal=Plate contagion=-.9 stagger=.9 word=Ah_oh_oo speak=2.6 hardness=.4 hum=.2 ring=18 stray=.4 tract=-4 sing=.5 width=1 swell=.1 clarity=.9 beat=.8 volume=.5 | weave | call | Felted plates that set ah against oo
Shields on the wall | - | metal=Plate contagion=-1 stagger=.3 word=Nay_nay speak=1.6 mallet=Wood hardness=.4 hum=.3 ring=7 stray=.6 tract=-6 knock=.4 point=.7 clarity=.9 wear=.5 beat=1.5 volume=4 | clay 1.mix=.4 2.gain=7 | wood | Low plates under wood that open as others shut
Gongs facing a path | - | metal=Plate contagion=-.8 stagger=1 word=Home speak=5 hardness=.25 hum=.6 ring=30 stray=.5 tract=-5 sing=.5 point=.95 clarity=.95 wear=.6 beat=1.9 volume=3.5 | cavern | gong | Low plates that answer home with its opposite
Thin plates in fog | - | metal=Plate contagion=-1 stagger=.5 word=We speak=4 hardness=.55 hum=0 ring=12 stray=0 tract=-1 sing=.8 beat=1 point=.75 clarity=.9 wear=.45 air=.25 width=.75 volume=3 | fogged | answer | Tuned plates set against each other on we
Woodpeckers negotiate | - | metal=Bar contagion=-1 stagger=.7 mallet=Wood word=Ay_ma speak=.8 hardness=.6 ring=24 hum=0 sing=.4 tract=2 knock=.4 release=.2 clarity=.95 wear=.15 air=.2 width=.95 volume=2 | slap | wood | Wood on bars that set ay ma against itself | keys
Table tennis at dusk | - | metal=Bar contagion=-.9 stagger=.4 mallet=Wood word=We speak=.6 hardness=.3 ring=14 hum=.1 sing=.2 tract=-2 point=.9 release=.3 wear=.3 beat=1.3 air=.2 width=.65 volume=5 | pendulum | wood | Soft wood on bars, quick opposites of we | keys
Neighbours on the stairs | - | metal=Bar contagion=-1 stagger=.9 word=Home speak=1.4 hardness=.4 ring=30 hum=.3 sing=.6 tract=-4 wear=.2 point=.2 clarity=.6 beat=1.5 width=.4 knock=.45 volume=1.5 | cupboard | felt | Felted bars that answer home with its opposite | keys
Letters that crossed | - | metal=Bar contagion=-.7 stagger=1 word=Ah_oh_oo speak=1 hardness=.5 ring=40 hum=.2 sing=.7 stray=.2 tract=0 width=1 clarity=.65 wear=.6 knock=.25 volume=-1 | glaze | wood | Wide bars that set ah against oo as they are played | keys
Doubt in the toolshed | - | metal=Bar contagion=-1 stagger=.5 mallet=Nail word=Nay_nay speak=1.2 hardness=.4 ring=26 hum=0 sing=.5 stray=.9 tract=-3 point=.6 beat=1.8 volume=1 | pillow | talk | Thumbed raw bars, open against closed | keys
Ringing from the rim | - | metal=Bell point=0 stray=.7 contagion=-.5 hardness=.7 word=We speak=2 hum=0 ring=20 sing=.2 wear=.2 tract=1 beat=.8 stagger=.75 air=.25 width=.9 volume=-2 | bright | peal | Bells struck at the very rim, brightening on we
Waist high in bells | - | metal=Bell point=1 stray=.4 contagion=-.6 hardness=.6 word=Ah_oh_oo speak=2 hum=.4 ring=12 sing=.4 tract=-3 beat=.6 air=.3 width=.65 knock=.05 | dense | peal | Bells struck at the waist, ah against oo
Wedding by the tracks | - | metal=Bell point=.15 stray=.5 contagion=-1 hardness=.8 word=Ay_ma speak=1.2 hum=.2 ring=14 sing=.3 beat=2.4 release=0 clarity=.75 wear=.8 width=.35 knock=.35 volume=4 | hanging | changes | Hard bells that beat and say ay ma across each other
Bells of the lower town | - | metal=Bell point=.5 stray=.8 contagion=-.8 mallet=Wood hardness=.5 word=Home speak=2 hum=.5 ring=18 sing=.1 tract=-4 release=0 clarity=.4 stagger=.2 beat=1.7 air=.1 width=.75 knock=.4 volume=0 | nextdoor 1.level=1 | answer | Raw bells under wood, home against its opposite
Rings on the lake's face | - | metal=Bell point=.7 stray=0 contagion=-1 hardness=.3 word=Noon speak=4 hum=.1 ring=24 sing=.7 tract=-1 width=1 stagger=.6 swell=.1 wear=.4 beat=0 air=.2 volume=6 | bloomup 2.outputGain=10 | suspend | Soft tuned bells that open as others shut, wide apart
Choirs across the nave | - | metal=Bell stray=0 swell=.5 sing=1 contagion=-1 stagger=.3 word=Ah_oh_oo speak=5 hum=.1 knock=0 air=.2 width=1 release=.3 point=.65 clarity=.8 wear=.15 beat=1.4 volume=-2 | ohs | chain | Sung bells that turn away from the newest vowel, ah against oo | pad
Held from both shores | - | metal=Glass stray=0 swell=.8 sing=1 contagion=-1 stagger=.8 word=We speak=6 hum=.2 knock=0 width=1 tract=-2 beat=.7 release=.2 point=.85 | sustain | vesper | Tuned glass that swells, oo against ee | pad
Debate of reeds | - | metal=Harmonic stray=.1 swell=.15 sing=1 contagion=-.9 stagger=.5 word=Nay_nay speak=2.4 hum=0 knock=0 air=.3 tract=-2 release=.6 point=.6 wear=.05 beat=.8 volume=.5 | hollow | hymn | A breathy fed body, some mouths open as others close | organ
Day side, night side | - | metal=Plate stray=.1 swell=1.2 sing=1 contagion=-1 stagger=.6 word=Seem speak=6 hum=.3 knock=0 width=1 tract=-4 wear=.5 release=.1 point=.4 clarity=.85 volume=3 | summer | suspend | A tuned plate that swells, seem against its opposite | pad
Quiet quorum | - | metal=Bell stray=.3 swell=.3 sing=.9 contagion=-.7 stagger=.9 word=Hum speak=5 hum=.4 knock=0 clarity=1 tract=-3 wear=.7 release=.2 point=.85 beat=1.6 air=.15 width=.85 volume=3.5 | strings | chain | The newest bell hums with shut lips and opens the mouths of the rest | pad
`,
    },
    {
      id: 'breath-chime',
      name: 'Breath chimes',
      category: 'wind',
      rows: `
Whisper at the keyhole | Breath chime | word=Hush speak=1.6 swell=.08 tract=1 contagion=1 beat=.1 | bare | talk | A quick breath on thin glass that says hush
Dandelion clock | Breath chime | word=We speak=4 air=.6 swell=.4 stray=.2 tract=0 hum=.1 point=.15 clarity=.9 contagion=.2 stagger=.8 wear=.65 beat=1.8 | veil | answer | Breath wakes glass that opens from oo to ee
Gauze over the window | Breath chime | word=Ah_oh_oo speak=6 swell=.9 air=.5 wear=.6 sing=.8 point=.3 clarity=.9 contagion=1 stagger=.75 beat=.5 | glimmer | vesper | Glass breathed awake over a second, closing to oo
Cold larder door | Breath chime | word=Seem speak=2 stray=.9 tract=-4 swell=.1 ring=20 sing=.8 hum=.4 clarity=.6 air=.6 contagion=.8 beat=1.6 volume=-6 | frost | call | Raw glass and cold air that close from ee
Kite over the estuary | Breath chime | word=Whoosh speak=5 air=.7 swell=.6 tract=-5 hum=.2 width=1 clarity=.85 stagger=.75 wear=.3 beat=.3 volume=6 | circle | fifth | Large-mouthed glass says whoosh over five seconds
Pipes by an open door | - | metal=Harmonic mallet=Breath stray=0 swell=.06 knock=.7 air=.35 sing=.8 hum=0 word=Ah_oh_oo speak=1.6 tract=-2 release=.7 clarity=1 beat=0 point=.2 contagion=.5 stagger=.15 wear=.55 width=.35 volume=4 | room | plucks | A puff of breath on tuned pipes, ah to oo
Bottle blown on a dock | - | metal=Harmonic mallet=Breath stray=0 swell=.1 knock=.5 air=.5 sing=.9 hum=.2 word=Home speak=2 tract=-5 release=.6 ring=6 point=.55 clarity=.8 stagger=.85 wear=.65 beat=1.2 width=.9 volume=-1.5 | bottle | call | Breath across a round tuned body says home
Flute with a tongue | - | metal=Harmonic mallet=Breath stray=0 swell=.04 knock=.6 air=.2 sing=1 hum=0 word=Nay_nay speak=.8 tract=2 release=.8 clarity=.9 width=.2 contagion=.9 beat=.3 volume=6 | walled 2.gain=6 | treble | A breathed pipe that opens and shuts as it plays
Reed beds at flood | - | metal=Harmonic mallet=Breath stray=.5 swell=.2 knock=.4 air=.5 sing=1 hum=0 word=We speak=2.4 tract=-4 release=.4 beat=2 point=.3 clarity=.65 wear=.75 volume=-2 | under | vesper | Breath on an untuned body that beats and says we
Conch at low tide | - | metal=Harmonic mallet=Breath stray=.2 swell=.3 knock=.8 air=.3 sing=1 hum=.4 word=Ay_ma speak=3 tract=-6 release=.4 hardness=.4 wear=.8 clarity=.7 stagger=.6 beat=.7 width=.6 volume=-1.5 | shell | call | A large low breath with a puff says ay ma
Chimes in still air | - | metal=Bell mallet=Breath stray=.6 swell=.03 knock=.1 air=.15 sing=.2 hum=0 word=Ah_oh_oo speak=2 ring=12 tract=2 release=0 width=1 point=.6 clarity=.55 contagion=-.2 stagger=.6 wear=.15 beat=2.4 volume=-.5 | scatter | rain | Bells woken by the lightest breath, ah, oh, oo | bell
Temple eaves in spring | - | metal=Bell mallet=Breath stray=.8 swell=.05 air=.3 sing=.1 hum=0 word=We speak=1.4 ring=8 tract=4 release=0 point=.8 clarity=.5 contagion=.9 stagger=.4 wear=.5 beat=.3 width=.45 volume=0 | chimes | rain | Raw small bells in a breath of air say we | bell
Silver leaves | - | metal=Glass mallet=Breath stray=.7 swell=.04 air=.25 sing=.1 hum=0 word=Seem speak=1.4 ring=6 tract=-2 release=0 width=1 point=.1 contagion=.5 wear=.15 beat=1.9 volume=4 | leaves | stars | Raw glass touched by breath says seem | bell
Beads of mercury | - | metal=Glass mallet=Breath stray=.1 swell=.03 hardness=.8 knock=.2 air=.1 sing=.2 hum=0 word=Nay_nay speak=1 ring=3 release=0 clarity=.65 contagion=1 beat=2 width=.75 volume=6 | bounces | rain | Tuned glass under a short hard breath, nay nay | bell
Bamboo behind the house | - | metal=Bar mallet=Breath stray=.4 swell=.03 hardness=.7 knock=.6 air=.3 sing=.1 hum=.1 word=Home speak=1 ring=24 tract=-1 release=.1 point=.6 clarity=.55 contagion=.9 stagger=.25 beat=1.1 width=.75 volume=0 | leaf | wood | A puff of breath on bars that say home | plucked
Bronze exhaling | - | metal=Bell mallet=Breath stray=.2 swell=.8 air=.6 sing=1 hum=.3 word=Ah_oh_oo speak=5 tract=-3 release=.2 knock=.1 point=.2 clarity=.9 stagger=.85 beat=1.5 width=.6 volume=-10 | open | chain | Bells that come up on a breath and close to oo | pad
Plate warming in the sun | - | metal=Plate mallet=Breath stray=.2 swell=1.6 air=.4 sing=1 hum=.2 word=We speak=6 tract=-2 release=.1 width=1 point=.8 clarity=.9 contagion=.7 stagger=.2 beat=.5 volume=3 | summer | suspend | A plate breathed up slowly that opens on we | pad
Lamps out on the marsh | - | metal=Glass mallet=Breath stray=.4 swell=1 air=.35 sing=.9 hum=.2 word=Noon tract=-3 release=.1 beat=1.4 speak=4 clarity=.7 contagion=.8 stagger=1 wear=.1 width=1 volume=6 | shallows | suspend | Glass that rises on a breath, shuts its lips and opens | pad
Exhale, count of eight | Hushing tide | metal=Bell mallet=Breath stray=0 swell=2 air=.8 sing=1 hum=.4 word=Home speak=8 tract=-5 release=.1 wear=.8 point=.15 clarity=.6 beat=.2 volume=-.5 | sigh | drone | Tuned bells two seconds in coming, breathy and dark, say home | pad
Cloud crossing the choir | - | metal=Harmonic mallet=Breath stray=.1 swell=1.2 air=.7 sing=1 word=Seem speak=5 release=.2 width=1 tract=-1 clarity=.8 hum=.3 point=.9 contagion=.6 stagger=.1 beat=.8 volume=1 | vowels | suspend | A breath that rises in tuned metal and closes from ee | pad
Mostly air | Hushing tide | metal=Bell mallet=Breath stray=.5 swell=.4 air=1 sing=.7 hum=.1 word=Whoosh speak=2.4 tract=-3 clarity=.9 volume=2 | surf 1.voice=.1 | vesper | More breath than bell: a hiss, a round vowel, then shut lips | texture
Sand over a drumhead | Hushing tide | metal=Plate mallet=Breath stray=.9 swell=.2 air=1 sing=.6 hum=.2 word=Hush speak=2 tract=-6 clarity=.9 beat=1.2 volume=4.5 | skin | vesper | A raw plate that is nearly all hiss | texture
Surf in a bell jar | Hushing tide | metal=Glass mallet=Breath stray=.5 swell=.9 air=1 sing=.9 hum=.2 word=Whoosh speak=4 tract=-7 wear=.7 point=.1 beat=1.7 volume=-4.5 | pipe | fifth | Air rushing in glass with a giant's mouth | texture
Snow sliding off a roof | Hushing tide | metal=Bar mallet=Breath stray=.6 swell=.3 air=.9 sing=.8 hum=.3 word=Hush speak=3 tract=-4 ring=30 clarity=.9 beat=1.2 volume=2.5 | sag | suspend | Bars under a long breath that fades into hiss | texture
Paper lung | - | metal=Harmonic mallet=Breath stray=.3 swell=.15 air=.9 sing=.9 hum=0 word=Whoosh speak=1.2 tract=3 release=.6 point=.15 clarity=.7 contagion=-.2 stagger=.6 wear=.85 width=.65 volume=2.5 | paper | talk | Short rushing breaths through a small mouth | texture
Shepherd's thin whistle | - | metal=Harmonic mallet=Breath stray=0 swell=.08 air=.3 sing=1 knock=.3 word=We speak=1.2 release=.7 beat=.3 width=.3 tract=0 wear=.8 clarity=.8 hum=.3 point=.95 contagion=.5 stagger=.35 volume=.5 | valley 1.level=1 | treble | A plain thin voice blown on we
Ocarina in a coat sleeve | - | metal=Glass mallet=Breath stray=0 swell=.07 air=.3 sing=1 hum=.2 knock=.4 word=Ah_oh_oo speak=1 tract=-2 clarity=1 release=.7 wear=.8 width=.1 hardness=.3 point=.95 contagion=.5 stagger=.05 beat=.8 | narrow | chant | Round tuned glass blown softly, ah to oo
Nightjar | - | metal=Harmonic mallet=Breath stray=.1 swell=.03 air=.5 sing=.8 hum=0 knock=.6 word=Nay_nay speak=.35 tract=4 release=.7 beat=5 clarity=.75 volume=6 | weave 3.gain=5 | talk | Quick fluttering breaths, nay nay three times a second
Steam whistle, far yard | - | metal=Bell mallet=Breath stray=.4 swell=.2 air=.5 sing=1 hum=.3 knock=.4 word=Home speak=3 tract=-2 clarity=1 release=.5 beat=1.8 point=.5 contagion=1 stagger=.15 width=.7 | shore | organum | Blown bells that beat and say home
Grass blade, two thumbs | - | metal=Bar mallet=Breath stray=.8 swell=.05 air=.6 sing=1 hum=0 hardness=.9 knock=.5 word=Ay_ma speak=.8 tract=1 release=.7 clarity=.75 wear=.4 beat=.3 volume=2 | leather | chant | A hard breath on raw bars that buzzes ay ma
Harmonica at the gate | - | metal=Harmonic mallet=Breath stray=.1 swell=.06 air=.2 sing=1 beat=2.2 word=We speak=.9 release=.8 hardness=.5 wear=.8 tract=-4 clarity=.7 hum=.2 point=.95 contagion=0 | combo | twoparts | Breath on a beating tuned body, we on each chord | organ
Melodica in the hallway | - | metal=Harmonic mallet=Breath stray=0 swell=.04 air=.15 sing=1 hum=0 speak=2.4 tract=1 release=1 word=Nay_nay hardness=.9 clarity=.9 beat=1.4 point=.9 contagion=1 stagger=.2 width=.9 volume=6 | doubled | felt | A hard reed tone that opens and shuts for as long as it is held | organ
Leather bellows, leaking | - | metal=Plate mallet=Breath stray=0 swell=.12 hardness=.5 air=.6 sing=1 hum=.3 word=Nay_nay speak=3 tract=-5 release=.9 beat=1 point=.65 contagion=.9 stagger=.35 volume=6 | calm | organum | A tuned plate and much air that open and shut | organ
Sheng of brown glass | - | metal=Glass mallet=Breath stray=.3 swell=.08 hardness=.7 air=.1 sing=1 hum=.1 word=Seem speak=4 tract=-1 release=.8 point=.75 contagion=-.5 stagger=.7 wear=.35 beat=1.9 width=.95 volume=2 | triad | hymn | Blown glass chords that close from ee | organ
Pump organ, cold room | - | metal=Harmonic mallet=Breath stray=.3 swell=.2 hardness=.4 air=.4 sing=1 hum=.6 word=Home speak=3 tract=-4 release=.7 beat=1.6 wear=.7 point=.3 clarity=.9 contagion=.9 stagger=.85 width=.95 volume=-1 | wornreel | hymn | Dark reeds over their octave, breathing home | organ
Breath on the sleeve mic | - | metal=Harmonic mallet=Breath stray=0 swell=.1 air=.7 sing=.6 hum=0 word=Ah_oh_oo speak=1 tract=0 ring=3 release=.5 knock=.6 clarity=1 point=.05 contagion=.2 stagger=.95 wear=.85 beat=1 width=.5 | near | talk | Close breathy syllables, ah, oh, oo | voice
Radio seance | - | metal=Bell mallet=Breath stray=.3 swell=.4 air=.8 sing=.9 hum=.2 word=Ay_ma speak=3 tract=-2 release=.3 point=.25 clarity=.9 contagion=0 beat=.3 volume=0 | shortwave | alone | A breathed bell that says ay ma | texture
Someone in the drapes | - | metal=Bell mallet=Breath stray=0 swell=.3 air=.9 sing=.7 hum=.2 word=Hum speak=3 tract=-5 release=.4 point=.9 contagion=0 beat=1.9 volume=4 | blanket | alone | Breath and a low hum with shut lips | texture
Breathing in reverse | - | metal=Glass mallet=Breath stray=.2 swell=.2 air=.6 sing=.5 hum=.1 word=Whoosh speak=2 tract=-3 ring=5 point=.6 clarity=.65 contagion=-.2 stagger=.6 wear=.15 beat=1.7 width=1 volume=2.5 | rise | call | Glass breathed awake on whoosh | texture
Ghost in the valve room | Hushing tide | metal=Plate mallet=Breath stray=.5 swell=.5 sing=.9 hum=.3 word=We speak=3 tract=-7 release=.3 air=.4 wear=.8 clarity=.85 beat=.3 | ghost | vesper | A raw plate breathed on, we in a giant's mouth | texture
Aurora, breath by breath | - | metal=Glass mallet=Breath swell=.7 sing=.9 hum=0 word=We speak=5 width=1 tract=4 beat=2.5 stray=.5 air=.7 point=.8 clarity=.9 contagion=.7 stagger=.25 | mistup | answer | Raw glass rising on breath from oo to ee, its halves beating
Feather in a cathedral | - | metal=Glass mallet=Breath swell=.3 air=.5 sing=.6 hum=0 speak=3 word=Seem stray=.6 tract=-2 hardness=.1 ring=14 point=.55 clarity=.65 stagger=.8 wear=.25 width=.95 volume=.5 | nave | stars | The softest breath on raw glass, closing from ee
Smoke rings at cards | - | metal=Bell mallet=Breath stray=.2 swell=.25 air=.4 sing=.5 hum=.2 word=Noon speak=1.6 tract=-4 ring=8 release=.2 wear=.8 clarity=.95 beat=.8 volume=1 | weave 3.gain=4.5 | call | Dark breathed bells that shut and open round
Chimney at four o'clock | - | metal=Bar mallet=Breath stray=.2 swell=.5 air=.5 sing=1 hum=.5 word=Ah_oh_oo speak=4 tract=-6 release=.3 point=.9 contagion=.5 stagger=.3 width=.85 volume=-1 | howls | fifth | Bars worked by breath, low in the mouth, ah to oo
Lungs of the old theatre | - | metal=Plate mallet=Breath stray=.1 swell=.6 air=.5 sing=1 hum=.4 word=Whoosh speak=3 tract=-3 release=.2 beat=.6 contagion=1 point=.55 stagger=.45 wear=.45 volume=-3 | swirl | vesper | Tuned plates that all breathe one whoosh
Finches in the gutter | - | metal=Bell mallet=Breath stray=.3 swell=.03 hardness=.9 air=.3 sing=.4 hum=0 knock=.5 word=We speak=.4 tract=3 ring=4 release=.4 clarity=.85 stagger=.65 wear=.45 beat=.4 width=.7 volume=0 | glintecho | rain | Small hard puffs on bells that chirp we
Matchbox wind band | - | metal=Harmonic mallet=Breath stray=.4 swell=.05 hardness=.7 air=.2 sing=.8 hum=0 knock=.7 word=Ay_ma speak=.6 tract=2 release=.8 clarity=.95 contagion=.5 stagger=.8 width=.3 volume=3.5 | tin | plucks | Tiny breathed mouths that say ay ma
Flute kept for monsoon | - | metal=Harmonic mallet=Breath stray=0 swell=.12 air=.6 sing=1 hum=.1 knock=.3 word=Home speak=2 tract=-3 clarity=1 beat=.5 release=.5 contagion=.6 volume=2 | rain | chant | A low breathy pipe that says home
Straw in a tall glass | - | metal=Glass mallet=Breath stray=.5 swell=.05 hardness=.4 air=.4 sing=.6 hum=0 knock=.5 word=Nay_nay speak=1.4 tract=-6 ring=6 point=.7 clarity=.85 stagger=.9 wear=.1 width=.9 volume=1.5 | drip | run | Low glass blown in puffs that open and shut
Pipe smoke in brass | - | metal=Bell mallet=Breath stray=0 swell=.2 hardness=.6 air=.3 sing=1 hum=.3 word=Seem speak=2.4 tract=-4 release=.6 clarity=1 beat=1.2 point=.05 contagion=1 volume=-1 | chorale | organum | Tuned bells breathed on, closing from ee
`,
    },
    {
      id: 'long-amen',
      name: 'Long amens',
      category: 'pad',
      rows: `
Amen before snow | Long amen | speak=12 swell=1.6 tract=-2 hum=.2 point=.25 clarity=.6 contagion=.6 beat=1.3 volume=2 | hall | suspend | A slow chord that takes twelve seconds over ay ma, low keys last
Softer the next time | Long amen | word=Ah_oh_oo speak=14 wear=.9 stray=0 swell=.8 air=.3 point=.75 clarity=.95 volume=-11.5 | dark | vesper | A dark pure chord with breath, closing slowly from ah to oo
Foundry at prayer | Long amen | metal=Bell stray=.5 speak=10 beat=1.2 hum=.5 tract=-5 point=.1 clarity=.55 contagion=.2 volume=5 | cathedral 1.mix=.24 | suspend | Cast bells that swell, beat and say ay ma over ten seconds
Glass keeping vigil | Long amen | metal=Glass stray=.1 tract=-1 speak=9 hum=.1 wear=.5 clarity=.95 contagion=.5 volume=.5 | bloomup | vesper | Tuned glass swells and takes nine seconds over ay ma
Hymn under roof beams | Long amen | metal=Bar stray=.3 speak=8 word=Home swell=.6 wear=.3 tract=-3 clarity=.85 beat=.4 air=.35 | board | organum | Bars fed by the keys say a slow home
Great organ, swell shut | - | metal=Harmonic stray=0 swell=.3 sing=1 hum=.7 hardness=.3 knock=0 word=Home speak=16 tract=-5 wear=.8 release=.7 stagger=.5 point=.9 beat=1.5 clarity=.8 volume=-5.5 | nave | chain | A dark beating body over its octave takes sixteen seconds to say home | organ
Reeds at the recessional | - | metal=Harmonic stray=.1 swell=.2 sing=1 hardness=.9 knock=0 word=Seem speak=12 release=.8 beat=1 wear=.6 hum=.5 clarity=.7 tract=-4 point=.7 contagion=.8 stagger=.35 air=.25 volume=-1 | bright | chain | A hard body that closes over twelve seconds from ee | organ
Positive organ, Lent | - | metal=Bell stray=0 swell=.15 sing=1 hum=0 hardness=.5 knock=0 word=Hum speak=10 release=.9 beat=.2 tract=-1 width=.4 point=.8 contagion=.1 stagger=.75 wear=.45 air=.05 volume=4 | chamber 1.mix=.24 | hymn | Tuned bells with shut lips, held plainly | organ
Both manuals coupled | - | metal=Harmonic stray=.05 swell=.4 sing=1 hum=1 hardness=.6 knock=0 word=We speak=18 tract=-3 release=.6 beat=.8 width=1 clarity=.55 contagion=.5 wear=.3 air=.2 volume=-17 | octave | chain | A tuned body with all of its octave below opens over eighteen seconds | organ
Organ in a boathouse | - | metal=Glass stray=.2 swell=.5 sing=1 hum=.4 hardness=.5 knock=0 word=Noon speak=8 tract=-4 release=.5 wear=.6 clarity=.95 beat=.7 volume=6 | ripples 3.outputGain=8 | organum | Glass chords that shut their lips and open after eight seconds | organ
Standing stones at noon | - | metal=Plate stray=.3 swell=1.4 sing=1 hum=.8 hardness=.3 knock=0 word=Ah_oh_oo speak=18 tract=-7 ring=40 release=0 point=.65 contagion=.8 stagger=.05 beat=1 air=.15 width=.8 | cave | drone | A low plate that swells and closes its giant's mouth over eighteen seconds | drone
Needle finding north | - | metal=Bell stray=.2 swell=1 sing=1 hum=.6 hardness=.4 knock=0 word=We speak=14 tract=-4 ring=40 beat=.2 contagion=1 stagger=0 point=.55 clarity=.65 wear=.15 air=.3 width=1 | circle | fifth | Low bells that open together, fourteen seconds to ee | drone
Dog asleep on a barge | - | metal=Harmonic stray=.2 swell=2 sing=1 hardness=.2 knock=0 word=Hum speak=12 tract=-6 wear=.9 beat=.6 hum=.75 point=.55 clarity=.85 stagger=.6 volume=3.5 | low8 | drone | A dark body that hums two seconds after it is asked | drone
Power lines in fog | - | metal=Bar stray=.8 swell=1.2 sing=1 hum=.5 hardness=.8 knock=0 word=Seem speak=9 tract=-3 beat=1.5 clarity=.6 point=.1 wear=.7 air=.3 volume=-.5 | earturn | drone | Raw bars fed into a hum that drifts from ee to shut lips | drone
Roots drinking | - | metal=Glass stray=.5 swell=.9 sing=1 hum=.7 hardness=.3 knock=0 word=Ay_ma speak=16 tract=-8 wear=.7 stagger=.3 point=.3 clarity=1 beat=1.3 air=.1 | under | fifth | Low glass in a giant's mouth takes sixteen seconds over ay ma | drone
Bells left to themselves | - | metal=Bell hardness=.5 sing=.4 hum=.3 ring=40 release=0 speak=15 beat=.6 swell=.1 stagger=.7 word=Nay_nay stray=.9 mallet=Wood point=.9 tract=-4 wear=.15 clarity=.6 width=.2 volume=6 | open 1.mix=.36 | answer | Raw bells under wood that ring on after the key, open and shut | bell
Weeks after the wedding | - | metal=Bell stray=.2 hardness=.3 sing=.6 hum=.5 ring=40 release=0 word=Home speak=10 wear=.8 beat=1 swell=.4 tract=-3 point=.15 clarity=.8 contagion=0 stagger=.55 air=.35 width=.6 | mist | suspend | Bells that come up gently and round off to home
Weather vane, very slow | - | metal=Bell stray=1 hardness=.45 sing=.8 hum=.1 ring=36 release=0 word=Whoosh speak=10 air=.4 beat=.3 swell=.7 width=1 point=.7 contagion=.8 stagger=.05 volume=4 | pendulum | vesper | Raw bells that rush, go round and shut over ten seconds | texture
Rust forming | - | metal=Bell stray=.8 hardness=.7 sing=.9 hum=.3 ring=30 release=.05 word=We speak=8 wear=.4 beat=2 swell=1.5 tract=-5 point=.65 contagion=.7 stagger=.5 air=0 width=.95 | fold | suspend | Raw bells that swell dark and open over eight seconds
Bronze asleep in hay | - | metal=Bell stray=.1 hardness=.15 sing=.7 hum=.6 ring=40 release=0 word=Noon speak=12 wear=.9 swell=.6 clarity=1 beat=.6 volume=2 | hanging | drone | Soft bells that keep their lips shut for most of twelve seconds
Glacier, one inch | - | metal=Glass stray=.3 swell=3 sing=1 hum=.3 hardness=.4 knock=0 word=We speak=16 tract=-2 ring=40 release=0 clarity=.6 stagger=.5 wear=.15 beat=.5 air=.25 width=.85 volume=-10 | sustain | fifth | Glass three seconds in coming and sixteen in opening
Meltwater under ice | - | metal=Glass stray=.6 swell=1.6 sing=1 hum=0 hardness=.6 knock=0 word=Hush speak=9 air=.4 tract=-5 release=.1 beat=2.4 point=.8 clarity=.85 stagger=.85 wear=.45 volume=-.5 | shallows 1.mix=.8 | suspend | Raw beating glass that drifts from er to a hiss
Skylight at solstice | - | metal=Glass stray=0 swell=1 sing=1 hum=0 hardness=.7 knock=0 word=Ah_oh_oo speak=20 tract=0 clarity=1 width=1 wear=.1 contagion=1 air=.05 volume=2 | light | fifth | Bright tuned glass that takes twenty seconds from ah to oo
Long light on water | - | metal=Glass stray=.1 swell=2 sing=.9 hum=.2 hardness=.3 knock=0 word=Seem speak=10 tract=1 beat=.5 width=1 release=0 contagion=1 air=.35 | glow | vesper | Tuned glass that rises and closes from a bright ee
Quartz in the dark room | - | metal=Glass stray=.4 swell=.6 sing=1 hum=.5 hardness=.2 knock=0 word=Hum speak=14 tract=-7 clarity=1 wear=.8 release=.1 point=.8 contagion=.6 stagger=.45 air=.05 width=1 volume=2 | box | drone | Dark glass humming over its octave
Orbit of a slow moon | - | metal=Plate stray=.2 swell=2.4 sing=1 hum=.2 hardness=.4 knock=0 word=Ah_oh_oo speak=12 width=1 release=0 ring=40 tract=-1 point=.8 contagion=.1 stagger=.75 wear=.45 beat=.9 air=.25 volume=-5 | circle 1.rate=.12 | vesper | A tuned plate that blooms for seconds and closes from ah
Distant solar wind | - | metal=Plate stray=.8 swell=1.8 sing=1 hum=.1 hardness=.6 knock=0 word=Whoosh speak=14 air=.6 width=1 release=0 tract=-4 point=.6 clarity=.75 stagger=.55 wear=.7 beat=1.3 volume=.5 | winter | vesper | A raw plate and wind, fourteen seconds to one whoosh | texture
Copper sundown | - | metal=Plate stray=0 swell=.8 sing=1 hum=.4 hardness=.5 knock=0 word=Home speak=9 tract=-3 beat=1.6 release=.2 wear=.6 point=.9 clarity=.9 stagger=.95 volume=1 | warmhaze | suspend | A tuned beating plate says home over nine seconds
Tectonic prayer | - | metal=Plate stray=.6 swell=3 sing=1 hum=.7 hardness=.5 knock=0 word=Nay_nay speak=16 tract=-9 release=0 ring=40 point=.1 clarity=.9 stagger=.9 beat=1.3 width=.7 volume=-1 | cavern 2.outputGain=8 | gong | A low plate that opens twice in sixteen seconds | drone
Hangar at first light | - | metal=Plate stray=.4 swell=1 sing=1 hum=.3 hardness=.7 knock=0 word=We speak=7 tract=-4 width=1 release=.1 beat=.4 point=.25 clarity=.9 stagger=.8 wear=.45 air=.2 | event | suspend | A plate that swells and opens over seven seconds
One vowel for hours | - | metal=Harmonic stray=0 swell=.9 sing=1 hum=.1 hardness=.5 knock=0 word=Ah_oh_oo speak=20 air=.2 tract=-1 clarity=1 contagion=1 stagger=.4 point=.65 wear=.7 beat=1.1 | ohs | vesper | A clear choir of metal that stays near ah | voice
Novices at compline | - | metal=Harmonic stray=0 swell=.7 sing=1 hum=.2 hardness=.3 knock=0 word=Home speak=12 air=.4 tract=3 clarity=1 stagger=.9 beat=.4 contagion=.9 width=.65 volume=-1.5 | singer 2.mix=.28 | treble | High breathy mouths that say home in turns | voice
Abbot and echo | - | metal=Harmonic stray=.05 swell=.5 sing=1 hum=.5 hardness=.4 knock=0 word=Ay_ma speak=9 air=.15 tract=-6 clarity=1 beat=.6 point=.9 contagion=1 stagger=.75 wear=.85 width=.4 volume=-2 | trail | organum | Low mouths over their octave say ay ma | voice
Voices before speech | - | metal=Glass stray=0 swell=1.2 sing=1 hum=0 hardness=.4 knock=0 word=Hum speak=16 air=.5 tract=5 clarity=1 volume=5 | deepsea | fifth | Small shut mouths of tuned glass with breath | voice
Sirens off duty | - | metal=Bell stray=0 swell=1.4 sing=1 hum=.2 hardness=.6 knock=0 word=We speak=10 air=.3 tract=0 clarity=1 contagion=-.6 point=.15 stagger=.8 beat=1.4 width=.2 | flock | answer | Tuned bells that swell and open on ee against each other | voice
Stairs of light | - | metal=Harmonic stray=0 swell=1.1 sing=1 hum=.1 hardness=.4 knock=0 word=Ah_oh_oo speak=8 tract=2 width=1 release=.1 clarity=1 point=.4 stagger=.55 beat=.9 volume=-2 | fifths | chain | A clear chord that closes from ah to oo over eight seconds
Film left in the sun | - | metal=Harmonic stray=.6 swell=.8 sing=1 hum=.3 hardness=.5 knock=0 word=Home speak=10 tract=-4 beat=2.2 release=.2 clarity=.8 volume=-1.5 | wobble | suspend | An untuned beating chord takes ten seconds over home
Cloth of small hours | - | metal=Bell stray=.1 swell=1 sing=1 hum=.4 hardness=.3 knock=0 word=Seem speak=12 tract=-3 wear=.6 air=.2 clarity=.75 contagion=1 width=.7 | veil | suspend | Soft tuned bells that close over twelve seconds
Postcard from a flood | - | metal=Glass stray=.2 swell=.5 sing=1 hum=.2 hardness=.5 knock=0 word=Noon speak=6 tract=-4 beat=1 point=.85 contagion=.2 volume=2 | floorhiss | vesper | Low glass that shuts for three seconds and opens again
Half remembered psalm | - | metal=Harmonic stray=.1 swell=.6 sing=1 hum=.2 hardness=.5 knock=0 word=Ay_ma speak=7 air=.4 tract=0 wear=.6 point=1 contagion=.1 beat=2.1 volume=-1 | halfshadow | chant | A breathy tuned line that says a seven second ay ma
Lighthouse turning | - | metal=Harmonic stray=.1 swell=.7 sing=1 hum=.4 hardness=.6 knock=0 word=We speak=12 tract=-5 beat=.3 release=.2 point=.2 stagger=.1 wear=.5 air=.35 volume=0 | pendulum 1.rate=.15 | fifth | A low chord that opens over twelve seconds
Pulse of the valley | - | metal=Bell stray=.1 swell=.6 sing=1 hum=.3 hardness=.4 knock=0 word=Home speak=9 tract=-4 release=.2 contagion=.8 point=.2 stagger=.15 air=.25 width=.9 | soft | chain | Tuned bells that agree on a slow home
Sleeper train | - | metal=Plate stray=.1 swell=.5 sing=1 hum=.5 hardness=.4 knock=0 word=Ah_oh_oo speak=8 tract=-5 release=.2 wear=.7 clarity=.6 stagger=.95 beat=.2 volume=-8 | slowing | vesper | A dark tuned plate closing from ah to oo
Windmill, light airs | - | metal=Glass stray=.1 swell=.8 sing=1 hum=.1 hardness=.5 knock=0 word=We speak=6 tract=-3 release=.2 air=.3 point=.65 contagion=-.5 stagger=.65 wear=.1 beat=1.8 width=.9 volume=-1 | chop 1.rate=2 1.depth=.6 | suspend | Tuned glass that opens over six seconds
Swaying harbour lights | - | metal=Harmonic stray=0 swell=1 sing=1 hardness=.35 knock=0 word=Seem speak=9 tract=-2 beat=.5 width=1 clarity=.75 hum=.5 wear=.6 point=.15 volume=1 | twelve | chain | A soft chord that closes from ee, its halves turning
Breath across the moor | Hushing tide | metal=Bell mallet=Breath stray=.3 swell=2.6 sing=1 hum=.3 air=.8 word=Hush speak=10 tract=-5 release=.1 point=.8 clarity=.9 beat=1.3 | fogged | drone | Bells nearly three seconds in coming, more hiss as they go | texture
Sea caves, inhaling | - | metal=Plate mallet=Breath stray=.5 swell=3.5 sing=1 hum=.5 air=.9 word=Whoosh speak=9 tract=-8 release=0 point=.75 clarity=.8 contagion=-.2 stagger=.65 wear=.85 beat=1.7 volume=1 | surf | drone | A plate that rises for over three seconds on a long whoosh | texture
Slow leaves down a shaft | - | metal=Glass stray=.5 swell=.8 sing=.8 hum=.1 hardness=.5 word=Ay_ma speak=8 tract=-3 air=.3 release=0 point=.75 contagion=.8 stagger=.25 beat=.2 width=.95 volume=-2 | leaves | answer | Glass that swells and says ay ma over eight seconds | texture
Motes at noon mass | - | metal=Bell stray=.4 swell=1.3 sing=.9 hum=.1 hardness=.6 word=Nay_nay speak=9 tract=1 air=.4 width=1 point=.55 contagion=-.2 stagger=0 beat=1 volume=6 | sparks | fifth | Bells that swell and open twice in nine seconds | texture
The word will not come | - | metal=Harmonic stray=.2 swell=5 sing=1 hum=.3 hardness=.4 knock=0 word=Home speak=14 tract=-4 air=.3 release=0 wear=.5 beat=.7 | stretched | fifth | A chord five seconds in coming that never quite says home | texture
`,
    },
    {
      id: 'dry-wood-word',
      name: 'Dry wood words',
      category: 'keys',
      rows: `
Carpenter's hello | Dry wood word | speak=.5 ring=20 stray=1 tract=3 point=1 swell=.1 contagion=0 stagger=.1 beat=2.7 air=.1 volume=0 | wall | wood | Wood on raw bars that say nay nay in half a second
Bench, vice, window | Dry wood word | word=Ah_oh_oo speak=.8 tract=-2 stray=.2 knock=.4 swell=.06 clarity=.9 contagion=.1 stagger=.95 beat=1.5 air=.15 volume=-4.5 | walled | wood | Wood on bars that close from ah to oo
Clog on cobbles | Dry wood word | word=Home speak=.5 tract=-5 hum=.3 knock=.7 point=.3 clarity=.8 stagger=.55 volume=2.5 | cupboard | wood | A wooden knock and a low short home
Spoons at the table | Dry wood word | word=We speak=.4 stray=1 tract=1 hardness=.7 ring=10 clarity=.8 contagion=.2 beat=2 air=.15 | evened | talk | Raw bars under hard wood that say we at once
Walnut shell castanet | Dry wood word | word=Noon speak=.6 tract=4 hardness=.4 ring=14 knock=.6 point=.9 clarity=.9 stagger=.85 air=.2 volume=2.5 | board 2.gain=6 | wood | Small bars that click, shut and open
Rosewood under the arch | - | metal=Bar mallet=Felt hardness=.5 ring=30 sing=.4 hum=.15 stray=.2 word=Ah_oh_oo speak=1.2 release=.2 tract=-2 wear=.3 swell=.1 point=.75 contagion=.8 stagger=.1 beat=1.3 air=.15 width=.65 volume=-1 | chamber | felt | Felted bars that ring and close from ah to oo
Marimba by the river | - | metal=Bar mallet=Felt hardness=.6 ring=40 sing=.5 hum=.4 stray=.1 word=Home speak=2 release=.1 tract=-4 beat=1 point=.75 contagion=-.5 stagger=.7 wear=.1 air=.3 width=.85 | water | canon | Long low bars with an octave below say home
Balsa and felt | - | metal=Bar mallet=Felt hardness=.8 ring=14 sing=.1 hum=0 stray=.5 word=We speak=.8 release=.4 tract=2 knock=.1 point=.3 clarity=.95 beat=2.1 air=.1 volume=-1 | bare | run | Light bars under hard felt that say we
Rolled on the low bars | - | metal=Bar mallet=Felt hardness=.3 ring=24 sing=1 hum=.5 stray=.3 word=Nay_nay speak=1 release=.4 tract=-3 swell=.06 point=.05 contagion=1 beat=0 knock=.5 volume=4 | shudder 1.rate=8 | organum | Low bars kept going by the key, open and shut
Oil lamp, cedar box | - | metal=Bar mallet=Felt hardness=.4 ring=18 sing=.6 hum=.2 stray=.1 word=Ay_ma speak=1.6 release=.3 tract=-1 air=.2 swell=.1 contagion=1 beat=.3 width=.6 volume=2 | box | cradle | Bars with a little breath that say ay ma
Chestnuts on a tin roof | - | metal=Bar mallet=Wood hardness=.8 ring=6 sing=0 hum=0 stray=1 word=Nay_nay speak=.3 release=.6 tract=4 knock=.8 point=.65 contagion=.9 stagger=0 beat=2.3 air=.15 width=.4 volume=0 | tin | wood | Hard raw bars with a knock, nay nay in a third of a second | drum
Railway sleepers | - | metal=Bar mallet=Wood hardness=.4 ring=4 sing=0 hum=.8 stray=.6 word=Home speak=.4 release=.7 tract=-6 knock=.8 point=.2 clarity=.8 contagion=.2 stagger=.85 wear=.1 beat=.4 air=.1 width=.25 volume=-1.5 | skin | wood | Short low bars, a knock and a hum cut off | drum
Door, floor, ladder | - | metal=Plate mallet=Wood hardness=.2 ring=1 sing=0 hum=.4 stray=.7 word=Noon speak=.4 release=.6 tract=-7 knock=.9 point=.7 clarity=.7 wear=.8 beat=2.8 volume=.5 | clay 2.gain=6 | wood | A dull plate that is mostly knock, shut at once | drum
Axe in the next wood | - | metal=Bar mallet=Wood hardness=.6 ring=8 sing=0 hum=.2 stray=.9 word=Hush speak=.5 release=.3 tract=-2 knock=1 clarity=.7 contagion=1 wear=.8 air=.3 volume=3 | valley | call | The knock of wood with a raw bar behind it that hisses out | drum
Tongue drum, tongue out | - | metal=Bar mallet=Wood hardness=.15 ring=12 sing=.1 hum=.5 stray=.4 word=Ay_ma speak=.5 release=.3 tract=-3 knock=.5 point=1 clarity=.75 wear=.15 beat=.3 volume=0 | gourd | wood | Soft wood on low bars that say ay ma | drum
Cane chair | - | metal=Bar mallet=Nail hardness=.2 ring=16 sing=.2 hum=.1 speak=.6 release=.3 word=Seem clarity=.9 tract=0 knock=.6 point=.9 stray=.9 wear=.4 contagion=.2 stagger=.85 beat=3 air=.3 volume=0 | leather | plucks | Thumbed raw bars with a tick that close from ee | plucked
Twig on a fence | - | metal=Bar mallet=Nail hardness=.6 ring=5 sing=0 hum=0 stray=.9 word=We speak=.3 release=.5 tract=2 knock=.5 point=.55 contagion=.9 stagger=.5 wear=.1 beat=1.4 air=.2 | grit | run | Nailed raw bars, we in a third of a second | plucked
Basket of keys | - | metal=Bar mallet=Nail hardness=.35 ring=20 sing=.4 stray=.7 word=Seem speak=.7 release=.1 beat=3 width=1 clarity=.7 wear=.7 hum=.3 tract=-5 point=.3 air=.15 knock=.3 volume=6 | wah | plucks | Beating thumbed bars that close from ee | plucked
Cricket cage | - | metal=Bar mallet=Nail hardness=.5 ring=10 sing=.8 hum=0 stray=.3 word=Nay_nay speak=.25 release=.6 tract=4 point=.35 clarity=.95 contagion=.1 stagger=.5 beat=.4 knock=.5 volume=6 | sampler | talk | Thumbed bars that chatter nay nay four times a second | plucked
Splinter | - | metal=Bar mallet=Nail hardness=.15 ring=3 sing=0 hum=.2 stray=.2 word=Home speak=.3 release=.8 tract=-5 clarity=1 knock=.2 beat=.9 air=.05 volume=5.5 | blunt | plucks | One short thumbed home, low in the mouth | plucked
Parquet | - | metal=Harmonic mallet=Wood hardness=.4 ring=2 sing=0 hum=.2 stray=.15 word=Ah_oh_oo speak=.4 release=.6 tract=-2 knock=.6 wear=.6 clarity=.6 contagion=0 beat=1.7 air=.15 volume=5 | stub | plucks | Wood on a short tuned body with a knock, ah to oo
Abacus lesson | - | metal=Harmonic mallet=Wood hardness=.7 ring=1 sing=0 hum=0 stray=.6 word=Nay_nay speak=.35 release=.7 tract=3 knock=.7 clarity=.5 stagger=1 beat=.1 volume=-.5 | kitchen | run | Short clicked keys that open and shut
Varnish drying | - | metal=Harmonic mallet=Felt hardness=.6 ring=1.6 sing=0 hum=.3 stray=.1 word=We speak=.5 release=.7 tract=-4 point=.9 wear=.1 air=.05 width=.7 knock=.4 | reel | felt | Short felted keys that open low on we
Desk lid, distant bell | - | metal=Harmonic mallet=Wood hardness=.25 ring=3 sing=.2 hum=.1 stray=.2 word=Home speak=.6 release=.5 tract=-1 knock=.8 point=.85 clarity=.95 stagger=.6 wear=.35 beat=1.8 air=.2 width=.75 volume=4 | stairwell | canon | Soft wood and a knock on tuned keys that say home
Typing on an oak table | - | metal=Harmonic mallet=Wood hardness=.5 ring=.6 sing=0 hum=.4 stray=.8 word=Seem speak=.25 release=.9 tract=-5 knock=.5 point=.9 clarity=.85 contagion=-.5 stagger=.65 wear=.35 beat=2.9 air=.2 width=.65 | hotvalve | talk | Untuned keys stopped short as they close from ee
Coconut halves, parade | - | metal=Bar mallet=Wood hardness=.3 ring=7 sing=0 hum=.2 stray=.6 word=Ah_oh_oo speak=.3 release=.5 tract=-4 point=.8 clarity=1 contagion=-.5 stagger=.7 wear=.25 beat=3 air=.2 width=.6 volume=2 | bounces | wood | Soft wood on short bars, ah to oo in a third of a second
Ladle against the pot | - | metal=Bell mallet=Wood sing=0 word=We speak=.5 release=.6 knock=.6 point=.6 tract=2 hum=0 stray=.9 hardness=.6 ring=3 wear=.5 clarity=.7 stagger=.55 beat=.2 air=.3 width=.65 | near | plucks | Wood on a short raw bell that says we
Latch, then silence | - | metal=Bell mallet=Wood hardness=.6 ring=.8 sing=0 hum=.1 stray=.9 word=Noon speak=.3 release=.9 tract=-3 knock=.6 point=.8 clarity=.85 stagger=.85 wear=.5 beat=1.8 volume=5 | grit 2.gain=6 | talk | Raw bells under wood, shut as soon as struck
Teacup, saucer, spoon | - | metal=Glass mallet=Wood hardness=.4 ring=.8 sing=0 hum=.1 stray=.4 word=Nay_nay speak=.4 release=.7 tract=-2 knock=.5 point=.85 contagion=.2 beat=1.8 volume=1 | near 2.gain=6 | plucks | Short glass under wood that says nay nay
Porcelain crate | - | metal=Glass mallet=Wood hardness=.2 ring=1.5 sing=.1 hum=.4 stray=.8 word=Home speak=.6 release=.5 tract=-6 point=.2 clarity=.75 contagion=-.5 stagger=.65 wear=.65 width=.55 volume=6 | patter | run | Raw glass under soft wood, low and round
Wood that learnt to sing | - | metal=Bar mallet=Wood hardness=.4 ring=40 sing=1 hum=.2 stray=.1 word=Ah_oh_oo speak=2 release=.5 tract=-1 clarity=1 point=1 contagion=.5 stagger=0 beat=.7 air=.3 volume=-1 | chorale | twoparts | Bars under wood that go on singing ah, oh, oo
Violin maker's shelf | - | metal=Bar mallet=Breath hardness=.6 swell=.2 ring=30 sing=1 hum=.1 stray=.2 word=We speak=3 release=.5 tract=-2 beat=1.2 point=.8 contagion=.2 stagger=.85 wear=.35 air=.45 width=.8 | board | chain | Bars breathed awake that open from oo to ee | string
Plank bridge at night | - | metal=Bar mallet=Wood hardness=.3 ring=40 sing=.8 hum=.6 stray=.4 word=Home speak=3 release=.1 tract=-6 wear=.6 clarity=.8 stagger=.7 beat=.1 air=.3 width=.4 knock=.3 volume=3 | cave 1.mix=.2 | low | Low bars under wood that go on saying home | bass
Cedar organ | - | metal=Bar mallet=Felt hardness=.5 swell=.08 ring=40 sing=1 hum=.4 stray=0 word=Seem speak=4 release=.9 tract=-1 knock=0 point=.4 contagion=.8 wear=.85 beat=1.6 air=.05 width=.95 | pipes | hymn | Tuned bars held by the key close from ee | organ
Sleepwalker on the deck | - | metal=Bar mallet=Felt hardness=.2 swell=.5 ring=40 sing=1 hum=.3 stray=.5 word=Nay_nay speak=4 release=.2 tract=-4 beat=.7 point=.9 contagion=.6 stagger=.25 air=.05 width=.9 volume=3.5 | deepsea 1.mix=.5 | vesper | Bars that swell and open twice in four seconds | pad
Hammer in the lane | - | metal=Bar mallet=Wood hardness=.6 ring=10 sing=0 hum=.1 word=Ah_oh_oo speak=.6 release=.4 point=.4 knock=.5 stray=1 wear=.85 tract=5 clarity=.75 stagger=.65 air=.05 width=.45 volume=1.5 | warmecho | talk | Hard wood on raw bars with a small mouth, ah, oh, oo
Pine cones downstairs | - | metal=Bar mallet=Wood hardness=.35 ring=8 sing=0 hum=0 stray=.7 word=We speak=.5 release=.4 tract=-3 width=1 swell=.08 point=.15 clarity=.7 contagion=.5 stagger=.7 wear=.35 beat=.3 air=.3 knock=.3 volume=2 | stone | run | Wood on raw bars that say we
Shuttle of an old loom | - | metal=Bar mallet=Nail hardness=.3 ring=12 sing=.2 hum=.2 stray=.3 word=Nay_nay speak=.5 release=.3 tract=-3 point=.95 contagion=.1 stagger=1 wear=.25 beat=1.4 air=.2 width=.65 volume=6 | dotted | wood | Thumbed bars that open and shut | plucked
Clapper in the granary | - | metal=Plate mallet=Wood hardness=.4 ring=2 sing=0 hum=.2 stray=.4 word=Ay_ma speak=.6 release=.5 tract=-4 knock=.6 contagion=1 beat=.1 volume=3 | skin 2.gain=6 | call | Wood on a short plate that says ay ma
Sticks above a canyon | - | metal=Bar mallet=Wood hardness=.7 ring=16 sing=0 hum=.1 stray=.5 word=Seem speak=.8 release=.2 tract=-1 point=.1 clarity=.55 contagion=.9 stagger=.25 beat=1 air=.1 width=.8 knock=.4 volume=2 | points | call | Hard wood on bars that close from ee
Robot of plywood | Talking metal | metal=Bar mallet=Wood hardness=.6 ring=20 sing=.9 hum=.2 stray=.2 word=Ay_ma speak=.35 release=.7 tract=-2 clarity=1 stagger=0 point=.3 volume=6 | glaze | talk | Bars that say ay ma three times a second, all together
Wasp in the violin case | - | metal=Bar mallet=Wood hardness=.4 ring=24 sing=.9 hum=0 stray=.2 word=Nay_nay speak=.22 release=.6 tract=0 beat=4 clarity=.9 wear=.35 air=.2 volume=6 | paper | talk | Beating bars that buzz nay nay
Puppet with a hinge | - | metal=Bar mallet=Wood hardness=.5 ring=14 sing=.6 hum=.1 stray=.4 word=We speak=.3 release=.7 tract=-6 stagger=1 contagion=.8 beat=.1 air=.3 width=.75 knock=.1 volume=6 | phone | talk | Low-mouthed bars that say we at their own pace
Carved fish | - | metal=Bar mallet=Felt hardness=.7 ring=16 sing=.5 hum=.3 stray=.3 word=Hush speak=.8 release=.4 tract=1 air=.7 point=.4 contagion=.9 stagger=.2 wear=.85 beat=1.5 width=.9 knock=.3 volume=.5 | shell | plucks | Breathy bars that fade into a hush
Parrot perch | - | metal=Bar mallet=Wood hardness=.5 ring=30 sing=.7 hum=0 stray=.5 word=Ay_ma speak=.7 release=.4 tract=7 contagion=0 stagger=.8 point=.75 wear=.35 beat=1.8 air=.05 width=.8 volume=6 | wobble | changes | High-mouthed bars that say ay ma in turns
Canteen xylophone | - | metal=Bar mallet=Wood hardness=.75 ring=24 sing=0 hum=0 stray=.3 word=Ah_oh_oo speak=.8 release=.1 tract=5 wear=.1 clarity=.6 stagger=.5 beat=.5 air=.25 width=.65 volume=-1.5 | platform | peal | Hard wood on bright bars with a small mouth
Cloister of birch | - | metal=Bar mallet=Wood hardness=.45 ring=36 sing=.2 hum=.2 stray=.2 word=Home speak=1.6 release=0 tract=-2 wear=.5 stagger=.65 beat=.7 air=.3 width=.75 volume=2 | cathedral 1.mix=.22 | canon | Wood on long bars that say home
Driftwood fire | - | metal=Bar mallet=Wood hardness=.3 ring=30 sing=.4 hum=.3 stray=.6 word=Whoosh speak=1.4 release=.1 tract=-4 air=.6 point=.2 knock=.45 volume=4 | disc | plucks | Bars in a rush of breath, round and then shut
Wet planks at the lock | - | metal=Bar mallet=Wood hardness=.25 ring=20 sing=.3 hum=.5 stray=.3 word=We speak=1 release=.2 tract=-5 wear=.6 contagion=.5 beat=1 knock=.1 | under | wood | Dark bars under soft wood that open low on we
Attic beams in spring | - | metal=Bar mallet=Felt hardness=.5 ring=36 sing=.5 hum=.1 stray=.4 word=Ah_oh_oo speak=1.4 release=.1 beat=2 tract=4 clarity=1 stagger=.9 wear=.1 air=.25 width=.9 knock=.4 volume=2 | summer | cradle | Felted bars that beat and close from ah to oo
`,
    },
  ],
}
