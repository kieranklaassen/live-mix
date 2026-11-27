import { type InstrumentSet } from './set'

// Laid out by what stands against the light: rows seen from a train, roofs, one edge, dunes,
// towers, pines, ridges that speak, rows at rest, haze, and frost. Each direction is ten
// corners of five presets, and most of the movement is the instrument's own.

export const SET: InstrumentSet = {
  device: 'ridge-lines',
  names: {
    near: ['Hills', 'Pines', 'Cliffs', 'Towers'],
    far: ['Hills', 'Pines', 'Cliffs'],
  },
  chains: {
    bare: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Open', params: { clear: 0.2 } }],
      words: ', close and dry',
    },
    warm: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Warm' },
        { deviceId: 'analog-drive', preset: 'Low warmth' },
      ],
      words: ', warm and dry',
    },
    shaded: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Shaded' },
        { deviceId: 'spread', preset: 'Soft tilt' },
      ],
      words: ', dry, its top in the shade',
    },
    thinned: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 220 } },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: ', thinned to its middle and dry',
    },
    scooped: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Hollow' },
        { deviceId: 'stereo-detune', preset: 'Faint width' },
      ],
      words: ', dry, scooped in the middle',
    },
    floor: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 6 } },
        { deviceId: 'spread', preset: 'Firm bass' },
      ],
      words: ', dry, its floor raised',
    },
    shutdoor: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 1500 } },
        { deviceId: 'stereo-widener', preset: 'Normal' },
      ],
      words: ', behind a shut door',
    },
    forward: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Forward' },
        { deviceId: 'ambient-comp', preset: 'Dense pad', params: { makeup: 6 } },
      ],
      words: ', dry and pushed forward',
    },
    wideopen: {
      effects: [
        { deviceId: 'spread', preset: 'Wide pad' },
        { deviceId: 'tamer', preset: 'Gentle' },
      ],
      words: ', dry and opened wide',
    },
    ends: {
      effects: [
        { deviceId: 'spread', preset: 'Wide ends' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', dry, wide above and below',
    },
    narrow: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Narrow' },
        { deviceId: 'analog-drive', preset: 'First hint' },
      ],
      words: ', narrow and dry',
    },
    middle: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Mono' },
        { deviceId: 'saturator', preset: 'Soft tape warmth' },
      ],
      words: ', all in the middle, a little warmed',
    },
    airwide: {
      effects: [
        { deviceId: 'spread', preset: 'Air only' },
        { deviceId: 'ambient-eq', preset: 'Texture' },
      ],
      words: ', dry, only its air wide',
    },
    console: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Console' },
        { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.12 } },
      ],
      words: ', through a mixing desk and a short plate',
    },
    triode: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Triode glow' },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.1 } },
      ],
      words: ', glowing in a triode',
    },
    iron: {
      effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }],
      words: ', through a heavy transformer, dry',
    },
    fuzzed: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { mix: 0.45 } },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.12 } },
      ],
      words: ', half of it in a dark fuzz',
    },
    grit: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Parallel grit', params: { mix: 0.22 } },
        { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 6500 } },
      ],
      words: ', a little grit beside it',
    },
    tube: {
      effects: [
        { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 8, outputDb: -4 } },
        { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 1 } },
      ],
      words: ', leaning on a tube',
    },
    folded: {
      effects: [
        { deviceId: 'saturator', preset: 'Folded glass', params: { mix: 0.3 } },
        { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 7000 } },
      ],
      words: ', a little of it folded over',
    },
    reel: {
      effects: [{ deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.08 } }],
      words: ', on quarter inch tape',
    },
    cassette: {
      effects: [{ deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.15 } }],
      words: ', on a cassette',
    },
    blanket: {
      effects: [
        { deviceId: 'tape', preset: 'Under a blanket', params: { hiss: 0.05 } },
        { deviceId: 'stereo-detune', preset: 'Soft halo' },
      ],
      words: ', on old tape under a blanket',
    },
    wornthin: {
      effects: [
        { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.15 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: ', on tape worn thin',
    },
    thump: {
      effects: [
        { deviceId: 'tape', preset: 'Warm thump', params: { hiss: 0.05 } },
        { deviceId: 'ambient-eq', preset: 'Layer', params: { lowCut: 35 } },
      ],
      words: ', on tape that thumps in the lows',
    },
    seatape: {
      effects: [
        { deviceId: 'tape', preset: 'Seasick', params: { hiss: 0.06, mix: 0.6 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', on a tape that leans and rights itself',
    },
    dusty: {
      effects: [{ deviceId: 'patina', preset: 'Dusty record', params: { noise: 0.25 } }],
      words: ', off a dusty record',
    },
    kitchen: {
      effects: [{ deviceId: 'patina', preset: 'Kitchen radio', params: { noise: 0.08 } }],
      words: ', from a kitchen radio',
    },
    hotvalve: {
      effects: [
        { deviceId: 'patina', preset: 'Hot valve', params: { noise: 0.05 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.12 } },
      ],
      words: ', inside a hot valve',
    },
    platter: {
      effects: [
        { deviceId: 'vinyl', preset: 'New pressing', params: { crackle: 0.14 } },
        { deviceId: 'ambient-eq', preset: 'Master' },
      ],
      words: ', on a new pressing',
    },
    slowdisc: {
      effects: [
        { deviceId: 'vinyl', preset: 'Slow platter', params: { crackle: 0.12, surface: 0.15 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: ', on a warped disc turning slowly',
    },
    glaze: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Glaze' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', under a twelve bit glaze',
    },
    dustbits: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Worn', params: { mix: 0.5 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', half of it through worn old converters',
    },
    combo: {
      effects: [{ deviceId: 're-amp', preset: 'Combo in a room', params: { noise: 0.02 } }],
      words: ', from a small amplifier in a room',
    },
    pillow: {
      effects: [{ deviceId: 're-amp', preset: 'Pillow speaker', params: { noise: 0, output: 2 } }],
      words: ', from a little speaker under a pillow',
    },
    cupboard: {
      effects: [{ deviceId: 're-amp', preset: 'In the cupboard', params: { noise: 0.02 } }],
      words: ', from inside a cupboard',
    },
    platform: {
      effects: [
        { deviceId: 're-amp', preset: 'Station platform', params: { noise: 0.04, drive: 0.3 } },
      ],
      words: ', over the horn of a station platform',
    },
    woolly: {
      effects: [{ deviceId: 're-amp', preset: 'Dark and woolly', params: { noise: 0 } }],
      words: ', through a dark woolly loudspeaker',
    },
    stack: {
      effects: [{ deviceId: 're-amp', preset: 'Warm stack', params: { noise: 0.02, drive: 0.35 } }],
      words: ', through a warm stack of loudspeakers',
    },
    board: {
      effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.4 } }],
      words: ', set on a wooden board',
    },
    bottle: {
      effects: [
        { deviceId: 'vessel', preset: 'Blown bottle', params: { mix: 0.45, air: 0.3 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: ', sounding in a bottle',
    },
    shell: {
      effects: [{ deviceId: 'vessel', preset: 'Shell to the ear', params: { mix: 0.4, air: 0.4 } }],
      words: ', held in a shell',
    },
    pot: {
      effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.6 } }],
      words: ', inside a clay pot',
    },
    tin: {
      effects: [
        { deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.35 } },
        { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 6500 } },
      ],
      words: ', in a small tin',
    },
    kettle: {
      effects: [
        { deviceId: 'vessel', preset: 'Kettle', params: { mix: 0.4 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: ', inside a kettle',
    },
    well: {
      effects: [
        { deviceId: 'vessel', preset: 'Deep well', params: { mix: 0.45, air: 0.2 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.1 } },
      ],
      words: ', down a deep well',
    },
    vowelled: {
      effects: [
        { deviceId: 'imprint', preset: 'Open vowel', params: { amount: 0.9 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', pressed into an open vowel',
    },
    tubed: {
      effects: [
        { deviceId: 'imprint', preset: 'Hollow tube', params: { amount: 0.9 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', pressed into a hollow tube',
    },
    darkbox: {
      effects: [
        { deviceId: 'imprint', preset: 'Dark box' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', shut in a dark box',
    },
    smaller: {
      effects: [
        { deviceId: 'size', preset: 'Smaller' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', its body made small, in a room',
    },
    musicbox: {
      effects: [
        { deviceId: 'size', preset: 'Music box', params: { mix: 0.7 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', its body made tiny',
    },
    giant: {
      effects: [
        { deviceId: 'size', preset: 'Giant', params: { mix: 0.7 } },
        { deviceId: 'ambient-eq', preset: 'Layer', params: { lowCut: 60 } },
      ],
      words: ', its body made huge',
    },
    secondman: {
      effects: [
        { deviceId: 'size', preset: 'Second player' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', with a second player beside it',
    },
    paper: {
      effects: [
        { deviceId: 'buzzing-bridge', preset: 'Paper edge', params: { mix: 0.45 } },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', with a paper edge that buzzes',
    },
    shells: {
      effects: [
        { deviceId: 'buzzing-bridge', preset: 'Three shells', params: { amount: 0.5, mix: 0.35 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', with loose shells rattling under it',
    },
    strap: {
      effects: [
        { deviceId: 'buzzing-bridge', preset: 'Soft strap', params: { mix: 0.5 } },
        { deviceId: 'ambient-eq', preset: 'Keys' },
      ],
      words: ', a leather strap slapping under it',
    },
    softhammer: {
      effects: [
        { deviceId: 'sift', preset: 'Soft hammers' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', its strikes softened',
    },
    feltair: {
      effects: [
        { deviceId: 'sift', preset: 'Felt and air' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', felt on its strikes and the air spread wide',
    },
    doubled: {
      effects: [
        { deviceId: 'stereo-detune', preset: 'Doubled' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', doubled on either side',
    },
    cloudtune: {
      effects: [
        { deviceId: 'stereo-detune', preset: 'Cloud' },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', in a cloud of near copies',
    },
    lifted: {
      effects: [
        { deviceId: 'lift', preset: 'Long tails' },
        { deviceId: 'ambient-eq', preset: 'Keys' },
      ],
      words: ', the ends of its notes lifted',
    },
    booth: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.18 } }],
      words: ', in a small booth',
    },
    chamber: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } }],
      words: ', in a tight chamber',
    },
    parlour: {
      effects: [
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.24 } },
        { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 2 } },
      ],
      words: ', in a carpeted room',
    },
    room: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.24 } }],
      words: ', in a plain room',
    },
    smallplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } }],
      words: ', on a small plate',
    },
    fewsteps: {
      effects: [{ deviceId: 'distance', preset: 'A few steps back', params: { wander: 0 } }],
      words: ', a few steps away',
    },
    acrossroom: {
      effects: [{ deviceId: 'distance', preset: 'Across the room' }],
      words: ', from across the room',
    },
    nextdoor: {
      effects: [{ deviceId: 'distance', preset: 'Next door' }],
      words: ', from next door',
    },
    stairwell: {
      effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
      words: ', in a stone stairwell',
    },
    openair: {
      effects: [{ deviceId: 'distance', preset: 'Open air' }],
      words: ', out in the open air',
    },
    hintspring: {
      effects: [
        { deviceId: 'spring-reverb', preset: 'Hint of spring' },
        { deviceId: 'ambient-eq', preset: 'Keys' },
      ],
      words: ', with a hint of spring',
    },
    springs: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } }],
      words: ', into two springs',
    },
    darkspring: {
      effects: [
        { deviceId: 'spring-reverb', preset: 'Dark amp spring' },
        { deviceId: 'saturator', preset: 'Warm glue' },
      ],
      words: ', into one dark spring',
    },
    brightbox: {
      effects: [{ deviceId: 'expanse', preset: 'Bright chamber', params: { mix: 0.24 } }],
      words: ', in a bright chamber',
    },
    smalldark: {
      effects: [{ deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.28 } }],
      words: ', in a small dark room',
    },
    hall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
      words: 'in a hall',
    },
    darkhall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } }],
      words: 'in a dark hall',
    },
    cathedral: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.26 } }],
      words: 'in a cathedral',
    },
    nave: {
      effects: [
        { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.28 } },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: 'in a vast nave',
    },
    undertow: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.3 } }],
      words: 'over the warm undertow of a hall',
    },
    airytail: {
      effects: [
        { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
        { deviceId: 'spread', preset: 'Wide top' },
      ],
      words: 'with an airy tail',
    },
    faraway: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.6 } }],
      words: 'far down a hall',
    },
    longplate: {
      effects: [
        { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.26 } },
        { deviceId: 'stereo-detune', preset: 'Soft halo' },
      ],
      words: 'on a long plate',
    },
    sheen: {
      effects: [
        { deviceId: 'plate-reverb', preset: 'Faint sheen' },
        { deviceId: 'chorus', preset: 'Subtle widener' },
      ],
      words: 'under a faint sheen',
    },
    wash: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Endless wash', params: { mix: 0.28 } }],
      words: 'in a wash of plate that hardly ends',
    },
    openspace: {
      effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } }],
      words: 'in a wide open space',
    },
    farecho: {
      effects: [{ deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.3 } }],
      words: 'with echoes far off',
    },
    queasy: {
      effects: [{ deviceId: 'expanse', preset: 'Seasick choir', params: { mix: 0.28 } }],
      words: 'in a hall that sways',
    },
    valley: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
      words: 'across an open valley',
    },
    cave: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } }],
      words: 'in a dark cave',
    },
    breathroom: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.36 } }],
      words: 'in a hall that breathes',
    },
    brightair: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.28 } }],
      words: 'in bright air',
    },
    late: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Late arrival', params: { mix: 0.34 } }],
      words: 'with the hall arriving late',
    },
    shore: {
      effects: [{ deviceId: 'distance', preset: 'Far shore', params: { room: 0.8, decay: 3.5 } }],
      words: 'from a far shore',
    },
    infog: { effects: [{ deviceId: 'distance', preset: 'Through fog' }], words: 'through fog' },
    backhall: {
      effects: [{ deviceId: 'distance', preset: 'Back of the hall' }],
      words: 'from the back of a hall',
    },
    winterroom: {
      effects: [
        { deviceId: 'bloom-reverb', preset: 'Winter drift', params: { mix: 0.3 } },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: 'in a winter hall that drifts down',
    },
    glowroom: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Rising fifths', params: { mix: 0.26 } }],
      words: 'with fifths rising in the tail',
    },
    glimmerhall: {
      effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.2 } }],
      words: 'under a faint octave glimmer',
    },
    fifthhall: {
      effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { mix: 0.26 } }],
      words: 'with fifths climbing in the hall',
    },
    mufflechoir: {
      effects: [{ deviceId: 'shimmer', preset: 'Muffled choir', params: { mix: 0.32 } }],
      words: 'before a muffled choir',
    },
    undershadow: {
      effects: [{ deviceId: 'shimmer', preset: 'Low shadow', params: { mix: 0.3 } }],
      words: 'over a short octave shadow',
    },
    glasshall: {
      effects: [{ deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.24 } }],
      words: 'under a glass roof two octaves up',
    },
    ahs: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.3 } }],
      words: 'in a hall that says ah',
    },
    oos: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.32 } }],
      words: 'with an oo behind it',
    },
    monks: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.3 } }],
      words: 'in a hall of low voices',
    },
    cavern: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.28 } }],
      words: 'in a cavern of short echoes',
    },
    darkwell: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.36 } }],
      words: 'in a dark well of echoes',
    },
    glinting: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Glinting', params: { mix: 0.26 } }],
      words: 'in a swarm of glinting echoes',
    },
    liftaway: {
      effects: [{ deviceId: 'spiral', preset: 'Faint lift', params: { mix: 0.24 } }],
      words: 'with a tail that lifts',
    },
    sinking: {
      effects: [{ deviceId: 'spiral', preset: 'Slow descent', params: { mix: 0.28 } }],
      words: 'with a tail that sinks',
    },
    bowls: {
      effects: [
        { deviceId: 'bowls', preset: 'Bowl table', params: { mix: 0.25, root: 9, scale: 1 } },
      ],
      words: 'over a table of bowls',
    },
    lowbowls: {
      effects: [{ deviceId: 'bowls', preset: 'Low fifths', params: { mix: 0.3 } }],
      words: 'over low bowls in fifths',
    },
    pedalheld: {
      effects: [{ deviceId: 'sympathetic', preset: 'Piano pedal', params: { mix: 0.32 } }],
      words: ', strings ringing with it',
    },
    glassharp: {
      effects: [
        { deviceId: 'sympathetic', preset: 'Glass harp', params: { mix: 0.34, root: 0 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', many thin strings answering',
    },
    silentkeys: {
      effects: [{ deviceId: 'silent-keys', preset: 'Dark strings', params: { mix: 0.4 } }],
      words: 'over dark strings held silent',
    },
    majorkeys: {
      effects: [{ deviceId: 'silent-keys', preset: 'Wide major nine', params: { mix: 0.4 } }],
      words: 'over a wide chord held silent',
    },
    woolhaze: {
      effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.3 } }],
      words: 'in a woolly haze',
    },
    faintfuzz: {
      effects: [{ deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.28 } }],
      words: 'in a small warm haze',
    },
    glasshaze: {
      effects: [{ deviceId: 'haze', preset: 'Glass halo', params: { mix: 0.22 } }],
      words: 'with a halo of glass',
    },
    longrise: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.34 } }],
      words: 'with a tail that rises and stops',
    },
    shorthalo: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Short halo' }],
      words: ', a short halo round it',
    },
    gated: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.3 } }],
      words: ', its room shut off early',
    },
    tides: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Slow tide', params: { mix: 0.36 } }],
      words: 'in a hall that comes in tides',
    },
    slap: {
      effects: [{ deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.28 } }],
      words: ', with one slap of tape',
    },
    repeats: {
      effects: [{ deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.26 } }],
      words: ', with warm repeats',
    },
    dotted: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.26, feedback: 0.4 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', dotted echoes bouncing',
    },
    wornecho: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Worn tape', params: { mix: 0.3, feedback: 0.5 } },
      ],
      words: ', with worn wavering echoes',
    },
    darktrail: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.3, feedback: 0.6 } },
      ],
      words: ', with a long dark trail of echoes',
    },
    gallop: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Two head gallop', params: { mix: 0.26 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.12 } },
      ],
      words: ', two heads of tape galloping after',
    },
    cleanecho: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 420, mix: 0.26 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', with clean echoes',
    },
    darkecho: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.26 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.18 } },
      ],
      words: ', with dark echoes',
    },
    fifthhop: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Fifth hop', params: { mix: 0.24, feedback: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', with echoes that hop a fifth',
    },
    halfnote: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Slow drift', params: { mix: 0.26 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', with loose echoes drifting',
    },
    backwards: {
      effects: [
        { deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.32 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.16 } },
      ],
      words: ', its own notes swelling backwards',
    },
    mirror: {
      effects: [
        { deviceId: 'reverse-delay', preset: 'Faint reflection', params: { mix: 0.24 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', faintly mirrored',
    },
    pebble: {
      effects: [{ deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.28 } }],
      words: ', skipping away like a pebble',
    },
    rings: {
      effects: [
        { deviceId: 'skipping-stone', preset: 'Wide rings', params: { mix: 0.32 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', skipping in wide rings',
    },
    scatter: {
      effects: [
        { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.3 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', with seven scattered echoes',
    },
    spiralled: {
      effects: [{ deviceId: 'constellation', preset: 'Slowing spiral', params: { mix: 0.3 } }],
      words: ', with echoes that slow down',
    },
    fan: {
      effects: [
        { deviceId: 'prism', preset: 'Low to high', params: { mix: 0.35 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', fanned out from low to high',
    },
    unfolding: {
      effects: [{ deviceId: 'prism', preset: 'Slow unfolding', params: { mix: 0.4 } }],
      words: ', its colours unfolding late',
    },
    hazypast: {
      effects: [{ deviceId: 'echo-memory', preset: 'Hazy past', params: { mix: 0.36 } }],
      words: ', with hazy moments coming back',
    },
    answered: {
      effects: [
        { deviceId: 'canon', preset: 'Faint answer', params: { mix: 0.28 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', answered by itself',
    },
    octcanon: {
      effects: [
        { deviceId: 'canon', preset: 'Octave shadow', params: { mix: 0.34 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', answered an octave below',
    },
    crystals: {
      effects: [
        { deviceId: 'grain-delay', preset: 'Crystals', params: { mix: 0.22 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', with echoes climbing in octaves',
    },
    embers: {
      effects: [{ deviceId: 'grain-delay', preset: 'Falling embers', params: { mix: 0.28 } }],
      words: ', with echoes falling like embers',
    },
    deckloop: {
      effects: [{ deviceId: 'tape-loop', preset: 'Slow fade', params: { mix: 0.36 } }],
      words: ', looping on two decks',
    },
    phasing: {
      effects: [{ deviceId: 'orbits', preset: 'Slow phasing', params: { mix: 0.3 } }],
      words: ', its loops slipping out of step',
    },
    ampshake: {
      effects: [
        { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.45 } },
        { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.16 } },
      ],
      words: ", in an amplifier's tremolo",
    },
    harmonic: {
      effects: [
        { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 2.6, depth: 0.7 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', lows and highs trembling in turn',
    },
    breathes: {
      effects: [
        { deviceId: 'tremolo', preset: 'Gentle breath' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
      ],
      words: ', its level breathing in a hall',
    },
    panned: {
      effects: [
        { deviceId: 'tremolo', preset: 'Slow pan' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', swung slowly from side to side',
    },
    wobble: {
      effects: [
        { deviceId: 'tremolo', preset: 'Wide wobble', params: { depth: 0.3 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', with a wide wobble',
    },
    chorale: {
      effects: [{ deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.15 } }],
      words: ', in a slow rotary cabinet',
    },
    spun: {
      effects: [
        { deviceId: 'rotary', preset: 'Tremolo', params: { drive: 0.1, mix: 0.7 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', in a fast rotary cabinet',
    },
    faintturn: {
      effects: [
        { deviceId: 'rotary', preset: 'Faint motion' },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
      ],
      words: ', turning faintly on a dark plate',
    },
    ensemble: {
      effects: [{ deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.45 } }],
      words: ', spread by an ensemble',
    },
    slowdrift: {
      effects: [
        { deviceId: 'chorus', preset: 'Slow drift' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', drifting apart in a hall',
    },
    hollowswell: {
      effects: [
        { deviceId: 'chorus', preset: 'Hollow swell', params: { feedback: -45, mix: 0.4 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.18 } },
      ],
      words: ', hollowed by a slow comb',
    },
    swirl: {
      effects: [
        { deviceId: 'phaser', preset: 'Slow swirl' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', in a slow phaser swirl',
    },
    sixstage: {
      effects: [
        { deviceId: 'phaser', preset: 'Warm six-stage', params: { mix: 0.4 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', through a warm phaser',
    },
    standing: {
      effects: [
        { deviceId: 'phaser', preset: 'Still formant', params: { feedback: -60 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', between two still notches',
    },
    jet: {
      effects: [
        { deviceId: 'flanger', preset: 'Gentle sweep', params: { mix: 0.4 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', in a gentle flanger sweep',
    },
    glacial: {
      effects: [
        { deviceId: 'flanger', preset: 'Glacial drift', params: { mix: 0.35, feedback: 35 } },
        { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.18 } },
      ],
      words: ', a comb drifting through it',
    },
    water: {
      effects: [
        { deviceId: 'currents', preset: 'Slow water' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', its bands moving like water',
    },
    breakers: {
      effects: [
        { deviceId: 'currents', preset: 'Breaking waves', params: { depth: 0.65 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', breaking in waves',
    },
    leaves: {
      effects: [
        { deviceId: 'glimmer', preset: 'Light on water', params: { depth: 0.5 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', its partials flickering one by one',
    },
    ripple: {
      effects: [
        { deviceId: 'glimmer', preset: 'Rising ripple', params: { depth: 0.6 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.18 } },
      ],
      words: ', with ripples rising through it',
    },
    calm: {
      effects: [
        { deviceId: 'breath', preset: 'Calm breath', params: { air: 0.1 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', opening and closing as if breathing',
    },
    circle: {
      effects: [
        { deviceId: 'around', preset: 'Slow circle' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', circling slowly',
    },
    eight: {
      effects: [
        { deviceId: 'around', preset: 'Slow eight' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.18 } },
      ],
      words: ', going round in a slow eight',
    },
    flock: {
      effects: [
        { deviceId: 'murmuration', preset: 'Evening flock', params: { mix: 0.35 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', among an evening flock of copies',
    },
    twoclose: {
      effects: [{ deviceId: 'murmuration', preset: 'Two close by' }],
      words: ', with two copies flying close',
    },
    throb: {
      effects: [
        { deviceId: 'pulses', preset: 'Soft throb', params: { floor: 0.6 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', in a soft throb',
    },
    sides: {
      effects: [
        { deviceId: 'pulses', preset: 'Left then right', params: { floor: 0.45 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', pulsing left then right',
    },
    comesgoes: {
      effects: [
        { deviceId: 'pulses', preset: 'Comes and goes', params: { floor: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', with a pulse that comes and goes',
    },
    midpulse: {
      effects: [
        { deviceId: 'band-pulse', preset: 'Four a second', params: { depth: 0.4 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', its middle pulsing',
    },
    lowpulse: {
      effects: [
        { deviceId: 'band-pulse', preset: 'Slow low pulse', params: { depth: 0.5 } },
        { deviceId: 'ambient-eq', preset: 'Layer', params: { lowCut: 35 } },
      ],
      words: ', its lows pulsing slowly, dry',
    },
    losing: {
      effects: [
        { deviceId: 'winding-down', preset: 'Soft losing pace' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', with a pulse that loses pace',
    },
    slowbow: {
      effects: [
        { deviceId: 'late-vibrato', preset: 'Slow bow', params: { depth: 16 } },
        { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } },
      ],
      words: ', swaying late in a chamber',
    },
    shadowswell: {
      effects: [
        { deviceId: 'swell', preset: 'Bowed' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.24 } },
      ],
      words: ', each note faded in, in a hall',
    },
    halfbow: {
      effects: [
        { deviceId: 'swell', preset: 'Half bowed' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: ', half of it faded in',
    },
    glacier: {
      effects: [
        {
          deviceId: 'auto-filter',
          preset: 'Glacial low-pass',
          params: { cutoffHz: 1200, lfoRateHz: 0.12, driveDb: 0 },
        },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', under a filter that opens and shuts slowly',
    },
    bloomfilter: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Soft bloom', params: { driveDb: 2, cutoffHz: 420 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', a filter opening with each note',
    },
    touchwah: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Touch wah', params: { resonance: 2.5, mix: 0.45 } },
        { deviceId: 'spring-reverb', preset: 'Hint of spring' },
      ],
      words: ', a filter following its touch',
    },
    notch: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Slow notch' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
      ],
      words: ', a notch passing slowly through',
    },
    stillwater: {
      effects: [
        { deviceId: 'freq-shifter', preset: 'Still water' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', shifted by a hair against itself',
    },
    driftshift: {
      effects: [
        { deviceId: 'freq-shifter', preset: 'Slow drift', params: { mix: 0.35, feedback: 0.35 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', slowly phasing with itself',
    },
    veil: {
      effects: [
        { deviceId: 'fog', preset: 'Thin veil', params: { mix: 0.35 } },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', behind a thin veil',
    },
    mist: {
      effects: [{ deviceId: 'fog', preset: 'Morning mist', params: { mix: 0.7 } }],
      words: ', blurred in morning mist',
    },
    deepfog: {
      effects: [
        { deviceId: 'fog', preset: 'Dark bank', params: { mix: 0.6 } },
        { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.16 } },
      ],
      words: ', lost in a dark bank of fog',
    },
    softcloud: {
      effects: [
        { deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.34 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', in a soft cloud of grains',
    },
    fifthcloud: {
      effects: [
        { deviceId: 'grain-cloud', preset: 'Choir of fifths', params: { mix: 0.3 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', with a cloud of fifths',
    },
    lowcloud: {
      effects: [
        { deviceId: 'grain-cloud', preset: 'Low tide', params: { mix: 0.3, feedback: 0.3 } },
      ],
      words: ', with slow grains an octave under',
    },
    octrain: {
      effects: [
        { deviceId: 'grain-cloud', preset: 'Octave rain', params: { mix: 0.22, feedback: 0.25 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', under a rain of octaves',
    },
    hanging: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.4 } }],
      words: ', its spectrum hanging like mist',
    },
    glassblur: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.3 } }],
      words: ', smeared into a glassy halo',
    },
    darkwater: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.4 } }],
      words: ', smeared into dark water',
    },
    stars: {
      effects: [
        { deviceId: 'glints', preset: 'Slow stars', params: { mix: 0.22 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', with a few slow sparks',
    },
    chimes: {
      effects: [
        { deviceId: 'glints', preset: 'Overtone chimes', params: { mix: 0.22 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', overtone chimes flying off it',
    },
    leaffall: {
      effects: [
        { deviceId: 'falling', preset: 'Falling leaves', params: { mix: 0.26 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.18 } },
      ],
      words: ', small pieces falling a fifth',
    },
    sighs: {
      effects: [
        { deviceId: 'falling', preset: 'Slow sighs', params: { mix: 0.34 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', followed by slow sighs',
    },
    darksnow: {
      effects: [{ deviceId: 'falling', preset: 'Dark snow', params: { mix: 0.34, again: 0.35 } }],
      words: ', under dark snow',
    },
    softsag: {
      effects: [{ deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.3 } }],
      words: ', its tail sagging a little',
    },
    thinair: {
      effects: [{ deviceId: 'melt', preset: 'Into thin air', params: { sag: 30, mix: 0.3 } }],
      words: ', its tail thinning upwards',
    },
    evening: {
      effects: [{ deviceId: 'seasons', preset: 'Long evening', params: { mix: 0.7 } }],
      words: ', late in a long evening',
    },
    frost: {
      effects: [{ deviceId: 'seasons', preset: 'First frost', params: { mix: 0.7 } }],
      words: ', in the first frost',
    },
    summer: {
      effects: [{ deviceId: 'seasons', preset: 'High summer', params: { mix: 0.7 } }],
      words: ', in high summer',
    },
    autumn: {
      effects: [{ deviceId: 'seasons', preset: 'Leaf fall', params: { mix: 0.65 } }],
      words: ', as the leaves come down',
    },
    rain: {
      effects: [
        { deviceId: 'weather', preset: 'Light rain', params: { voice: 0.25 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', out in light rain',
    },
    breeze: {
      effects: [{ deviceId: 'weather', preset: 'Breezy day', params: { voice: 0.15 } }],
      words: ', moved by a breeze',
    },
    clouds: {
      effects: [
        { deviceId: 'weather', preset: 'Passing clouds', params: { voice: 0.1 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', clouds passing over it',
    },
    surf: {
      effects: [
        { deviceId: 'weather', preset: 'Slow surf', params: { voice: 0.2, exposure: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: ', slow surf washing through it',
    },
    shallows: {
      effects: [
        { deviceId: 'underwater', preset: 'Sunlit shallows', params: { bubbles: 0.1 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.18 } },
      ],
      words: ', in sunlit shallows',
    },
    under: {
      effects: [
        { deviceId: 'underwater', preset: 'Just under', params: { bubbles: 0.05, depth: 0.14 } },
      ],
      words: ', just under water',
    },
    octhalo: {
      effects: [
        { deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.26 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', sines an octave up swelling behind',
    },
    lowsines: {
      effects: [
        { deviceId: 'sine-shadow', preset: 'Low shadow', params: { mix: 0.3 } },
        { deviceId: 'ambient-eq', preset: 'Layer', params: { lowCut: 30 } },
      ],
      words: ', with a shadow of low sines',
    },
    cellos: {
      effects: [{ deviceId: 'pad-follower', preset: 'Dark cellos', params: { mix: 0.36 } }],
      words: ', dark strings following',
    },
    swellpad: {
      effects: [{ deviceId: 'pad-follower', preset: 'Slow swell', params: { mix: 0.34 } }],
      words: ', a pad swelling in after it',
    },
    flutestops: {
      effects: [
        { deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', with flute pipes speaking after',
    },
    pedalpipe: {
      effects: [
        { deviceId: 'stops', preset: 'Pedal under', params: { mix: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.18 } },
      ],
      words: ', over a pedal pipe in a cathedral',
    },
    glasspipes: {
      effects: [
        { deviceId: 'stops', preset: 'Glass on top', params: { mix: 0.3 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', thin high pipes on top',
    },
    openfifth: {
      effects: [
        { deviceId: 'stops', preset: 'Open fifths', params: { mix: 0.35, fifth: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', with pipes a fifth above',
    },
    octaveup: {
      effects: [
        { deviceId: 'octaves', preset: 'Faint octave', params: { up1: 0.22 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', a faint octave over it',
    },
    slowoct: {
      effects: [
        { deviceId: 'octaves', preset: 'Slow halo', params: { up2: 0.25 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: ', slow octaves rising over it',
    },
    suboct: {
      effects: [
        { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.5 } },
        { deviceId: 'ambient-eq', preset: 'Layer', params: { lowCut: 30 } },
      ],
      words: ', an octave under it, dry',
    },
    padbelow: {
      effects: [
        { deviceId: 'pitch-shifter', preset: 'Pad below', params: { mix: 0.32 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.18 } },
      ],
      words: ', an octave beneath in a hall',
    },
    halftime: {
      effects: [{ deviceId: 'stretch', preset: 'Half time haze', params: { mix: 0.34 } }],
      words: ', trailed by itself at half pace',
    },
    nearshadow: {
      effects: [
        { deviceId: 'stretch', preset: 'Near shadow', params: { mix: 0.32 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: ', a slower shadow close behind',
    },
    heldon: {
      effects: [{ deviceId: 'sustainer', preset: 'Slow strings', params: { mix: 0.36 } }],
      words: ', held on as slow strings',
    },
    afterglow: {
      effects: [
        { deviceId: 'sustainer', preset: 'Brief afterglow', params: { mix: 0.34 } },
        { deviceId: 'ambient-eq', preset: 'Keys' },
      ],
      words: ', with a brief afterglow',
    },
    frozenroom: {
      effects: [
        { deviceId: 'ether-reverb', preset: 'Soft freeze', params: { mix: 0.24 } },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: 'over a soft frozen room',
    },
    dissolve: {
      effects: [
        { deviceId: 'generations', preset: 'Slow dissolve', params: { mix: 0.36, hiss: 0.04 } },
      ],
      words: ', dissolving into its room',
    },
    roomcopies: {
      effects: [
        { deviceId: 'generations', preset: 'Faint afterimage', params: { mix: 0.28, hiss: 0.04 } },
        { deviceId: 'ambient-eq', preset: 'Keys' },
      ],
      words: ', with a faint afterimage of the room',
    },
    commons: {
      effects: [
        { deviceId: 'common-tones', preset: 'Long hold', params: { mix: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', held tones hanging on',
    },
    halfunder: {
      effects: [
        { deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.26 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', itself at half speed underneath',
    },
    softbed: {
      effects: [
        { deviceId: 'micro-looper', preset: 'Soft bed', params: { mix: 0.28 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: ', on a soft bed of its own loop',
    },
    shortwave: {
      effects: [
        {
          deviceId: 'radio',
          preset: 'Night shortwave',
          params: { static: 0.08, interference: 0.03, fading: 0.4, mix: 0.75 },
        },
      ],
      words: ', over shortwave at night',
    },
    hintstatic: {
      effects: [
        { deviceId: 'radio', preset: 'Hint of static', params: { static: 0.2, mix: 0.25 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', with a hint of static',
    },
    tapefloor: {
      effects: [
        { deviceId: 'noise-floor', preset: 'Faint hiss', params: { level: -58 } },
        { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.12 } },
      ],
      words: ', on tape with a faint floor of hiss',
    },
    emptyroom: {
      effects: [
        { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -50 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', in an empty room one can hear',
    },
    behindglass: {
      effects: [
        { deviceId: 'low-bitrate', preset: 'Behind glass', params: { loss: 0.3, mix: 0.6 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.16 } },
      ],
      words: ', swirling as if behind glass',
    },
    watery: {
      effects: [
        { deviceId: 'low-bitrate', preset: 'Watery trace' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.18 } },
      ],
      words: ', with a watery trace',
    },
    octstack: {
      effects: [
        { deviceId: 'cascade', preset: 'Octave stack', params: { mix: 0.26, high: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', its octaves cascading after',
    },
    tiles: {
      effects: [{ deviceId: 'cascade', preset: 'Slow tiles', params: { mix: 0.3, high: 0.35 } }],
      words: ', repeated in slow tiles',
    },
    softchime: {
      effects: [
        { deviceId: 'warp', preset: 'Soft chime', params: { mix: 0.4 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', half of it bent to a soft chime',
    },
    thinglow: {
      effects: [
        { deviceId: 'warp', preset: 'Thin glow' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', its partials spread by a hair',
    },
    ringhalo: {
      effects: [
        { deviceId: 'ring', preset: 'Faint halo', params: { mix: 0.1, root: 9 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', ringing faintly against an A',
    },
    howls: {
      effects: [
        { deviceId: 'howl', preset: 'Faint sustain' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', just beginning to feed back',
    },
    whistled: {
      effects: [
        { deviceId: 'overtone-singer', preset: 'Slow wander', params: { mix: 0.4, root: 9 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', overtones of A wandering out of it',
    },
    leaning: {
      effects: [
        { deviceId: 'scale-filter', preset: 'Lean to the key' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
      ],
      words: ', leaning to the white keys',
    },
    driftgrain: {
      effects: [
        { deviceId: 'spectral-drifter', preset: 'Detune cloud', params: { mix: 0.3 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', in a cloud of detuned grains',
    },
    limited: {
      effects: [
        { deviceId: 'fet-limiter', preset: 'Light touch' },
        { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.14 } },
      ],
      words: ', held even and close',
    },
  },
  phrases: {
    window: {
      notes: [
        { atSec: 0, durSec: 3.5, note: 50, gain: 0.5 },
        { atSec: 0, durSec: 3.5, note: 57, gain: 0.45 },
        { atSec: 0, durSec: 3.5, note: 65, gain: 0.5 },
        { atSec: 0, durSec: 3.5, note: 72, gain: 0.5 },
        { atSec: 3.6, durSec: 3.7, note: 43, gain: 0.5 },
        { atSec: 3.6, durSec: 3.7, note: 57, gain: 0.4 },
        { atSec: 3.6, durSec: 3.7, note: 65, gain: 0.45 },
        { atSec: 3.6, durSec: 3.7, note: 71, gain: 0.5 },
      ],
    },
    junction: {
      notes: [
        { atSec: 0, durSec: 2.4, note: 50, gain: 0.5 },
        { atSec: 0, durSec: 2.4, note: 57, gain: 0.4 },
        { atSec: 0, durSec: 2.4, note: 65, gain: 0.4 },
        { atSec: 0, durSec: 1.4, note: 72, gain: 0.5 },
        { atSec: 1.4, durSec: 2.1, note: 71, gain: 0.5 },
        { atSec: 2.4, durSec: 2, note: 48, gain: 0.5 },
        { atSec: 2.4, durSec: 2, note: 60, gain: 0.4 },
        { atSec: 2.4, durSec: 4.9, note: 64, gain: 0.4 },
        { atSec: 3.5, durSec: 3.8, note: 69, gain: 0.5 },
        { atSec: 4.4, durSec: 2.9, note: 45, gain: 0.5 },
        { atSec: 4.4, durSec: 2.9, note: 52, gain: 0.4 },
        { atSec: 4.4, durSec: 2.9, note: 60, gain: 0.4 },
      ],
    },
    gather: {
      notes: [
        { atSec: 0, durSec: 7.3, note: 45, gain: 0.5 },
        { atSec: 0.7, durSec: 6.6, note: 52, gain: 0.45 },
        { atSec: 1.5, durSec: 5.8, note: 60, gain: 0.45 },
        { atSec: 2.4, durSec: 4.9, note: 64, gain: 0.45 },
        { atSec: 3.3, durSec: 4, note: 67, gain: 0.45 },
        { atSec: 4.2, durSec: 3.1, note: 71, gain: 0.4 },
      ],
    },
    tenths: {
      notes: [
        { atSec: 0, durSec: 1.8, note: 50, gain: 0.5 },
        { atSec: 0, durSec: 1.8, note: 57, gain: 0.35 },
        { atSec: 0, durSec: 1.8, note: 65, gain: 0.5 },
        { atSec: 1.8, durSec: 1.6, note: 52, gain: 0.5 },
        { atSec: 1.8, durSec: 1.6, note: 60, gain: 0.35 },
        { atSec: 1.8, durSec: 1.6, note: 67, gain: 0.5 },
        { atSec: 3.4, durSec: 1.6, note: 53, gain: 0.5 },
        { atSec: 3.4, durSec: 1.6, note: 60, gain: 0.35 },
        { atSec: 3.4, durSec: 1.6, note: 69, gain: 0.5 },
        { atSec: 5, durSec: 2.3, note: 48, gain: 0.5 },
        { atSec: 5, durSec: 2.3, note: 60, gain: 0.35 },
        { atSec: 5, durSec: 2.3, note: 64, gain: 0.5 },
      ],
    },
    attic: {
      notes: [
        { atSec: 0, durSec: 2.4, note: 45, gain: 0.6 },
        { atSec: 0.5, durSec: 2, note: 60, gain: 0.4 },
        { atSec: 1, durSec: 1.6, note: 64, gain: 0.4 },
        { atSec: 1.5, durSec: 1, note: 71, gain: 0.55 },
        { atSec: 2.5, durSec: 2.4, note: 41, gain: 0.55 },
        { atSec: 3, durSec: 1.8, note: 60, gain: 0.4 },
        { atSec: 3.5, durSec: 1.4, note: 64, gain: 0.4 },
        { atSec: 3.5, durSec: 1.2, note: 69, gain: 0.55 },
        { atSec: 4.8, durSec: 2.4, note: 48, gain: 0.55 },
        { atSec: 5.2, durSec: 2, note: 55, gain: 0.4 },
        { atSec: 5.6, durSec: 1.6, note: 64, gain: 0.4 },
        { atSec: 5.6, durSec: 1.6, note: 67, gain: 0.5 },
      ],
    },
    sixths: {
      notes: [
        { atSec: 0, durSec: 1.1, note: 64, gain: 0.6 },
        { atSec: 0, durSec: 1.1, note: 72, gain: 0.55 },
        { atSec: 1.2, durSec: 1.1, note: 62, gain: 0.5 },
        { atSec: 1.2, durSec: 1.1, note: 71, gain: 0.5 },
        { atSec: 2.4, durSec: 1.5, note: 60, gain: 0.5 },
        { atSec: 2.4, durSec: 1.5, note: 69, gain: 0.55 },
        { atSec: 0, durSec: 2.3, note: 45, gain: 0.45 },
        { atSec: 2.4, durSec: 1.5, note: 41, gain: 0.45 },
        { atSec: 4.2, durSec: 1, note: 59, gain: 0.5 },
        { atSec: 4.2, durSec: 1, note: 67, gain: 0.5 },
        { atSec: 4.2, durSec: 1, note: 43, gain: 0.45 },
        { atSec: 5.4, durSec: 1.9, note: 60, gain: 0.5 },
        { atSec: 5.4, durSec: 1.9, note: 64, gain: 0.5 },
        { atSec: 5.4, durSec: 1.9, note: 36, gain: 0.45 },
      ],
    },
    hocket: {
      notes: [
        { atSec: 0, durSec: 0.3, note: 57, gain: 0.7 },
        { atSec: 0.5, durSec: 0.3, note: 64, gain: 0.5 },
        { atSec: 1, durSec: 0.3, note: 60, gain: 0.6 },
        { atSec: 1.5, durSec: 0.3, note: 69, gain: 0.5 },
        { atSec: 2, durSec: 0.3, note: 59, gain: 0.6 },
        { atSec: 2.5, durSec: 0.3, note: 67, gain: 0.5 },
        { atSec: 3, durSec: 0.3, note: 57, gain: 0.65 },
        { atSec: 3.5, durSec: 0.6, note: 64, gain: 0.55 },
        { atSec: 4.4, durSec: 0.3, note: 53, gain: 0.65 },
        { atSec: 4.9, durSec: 0.3, note: 65, gain: 0.5 },
        { atSec: 5.4, durSec: 0.3, note: 60, gain: 0.55 },
        { atSec: 5.9, durSec: 1.2, note: 64, gain: 0.6 },
      ],
    },
    ostinato: {
      notes: [
        { atSec: 0, durSec: 0.35, note: 57, gain: 0.7 },
        { atSec: 0.4, durSec: 0.3, note: 64, gain: 0.45 },
        { atSec: 0.8, durSec: 0.3, note: 62, gain: 0.45 },
        { atSec: 1.2, durSec: 0.3, note: 69, gain: 0.55 },
        { atSec: 1.6, durSec: 0.35, note: 57, gain: 0.65 },
        { atSec: 2, durSec: 0.3, note: 64, gain: 0.45 },
        { atSec: 2.4, durSec: 0.3, note: 62, gain: 0.45 },
        { atSec: 2.8, durSec: 0.3, note: 67, gain: 0.55 },
        { atSec: 3.2, durSec: 0.35, note: 53, gain: 0.65 },
        { atSec: 3.6, durSec: 0.3, note: 64, gain: 0.45 },
        { atSec: 4, durSec: 0.3, note: 60, gain: 0.45 },
        { atSec: 4.4, durSec: 0.3, note: 69, gain: 0.55 },
        { atSec: 4.8, durSec: 0.35, note: 55, gain: 0.65 },
        { atSec: 5.2, durSec: 0.3, note: 62, gain: 0.45 },
        { atSec: 5.6, durSec: 1.5, note: 59, gain: 0.5 },
        { atSec: 5.6, durSec: 1.5, note: 67, gain: 0.5 },
      ],
    },
    edge: {
      notes: [
        { atSec: 0, durSec: 1.9, note: 62, gain: 0.6 },
        { atSec: 1.9, durSec: 1, note: 69, gain: 0.65 },
        { atSec: 2.9, durSec: 0.5, note: 67, gain: 0.5 },
        { atSec: 3.4, durSec: 0.5, note: 65, gain: 0.5 },
        { atSec: 3.9, durSec: 2.2, note: 64, gain: 0.6 },
        { atSec: 6.1, durSec: 0.4, note: 62, gain: 0.5 },
        { atSec: 6.5, durSec: 0.8, note: 60, gain: 0.5 },
      ],
    },
    kite: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 69, gain: 0.6 },
        { atSec: 1.6, durSec: 0.8, note: 72, gain: 0.55 },
        { atSec: 2.4, durSec: 0.4, note: 74, gain: 0.5 },
        { atSec: 2.8, durSec: 2, note: 76, gain: 0.6 },
        { atSec: 4.9, durSec: 0.6, note: 74, gain: 0.5 },
        { atSec: 5.5, durSec: 0.5, note: 71, gain: 0.5 },
        { atSec: 6, durSec: 1.3, note: 72, gain: 0.55 },
      ],
    },
    reedline: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 50, gain: 0.65 },
        { atSec: 1.6, durSec: 0.6, note: 53, gain: 0.5 },
        { atSec: 2.2, durSec: 0.6, note: 55, gain: 0.5 },
        { atSec: 2.8, durSec: 1.8, note: 57, gain: 0.65 },
        { atSec: 4.7, durSec: 0.5, note: 55, gain: 0.5 },
        { atSec: 5.2, durSec: 0.5, note: 52, gain: 0.5 },
        { atSec: 5.7, durSec: 1.6, note: 50, gain: 0.6 },
      ],
    },
    dune: {
      notes: [
        { atSec: 0, durSec: 1.5, note: 38, gain: 0.7 },
        { atSec: 1.6, durSec: 0.5, note: 45, gain: 0.5 },
        { atSec: 2.2, durSec: 1.1, note: 43, gain: 0.6 },
        { atSec: 3.4, durSec: 0.4, note: 41, gain: 0.5 },
        { atSec: 3.9, durSec: 1.5, note: 36, gain: 0.7 },
        { atSec: 5.5, durSec: 0.4, note: 40, gain: 0.5 },
        { atSec: 6, durSec: 1.3, note: 33, gain: 0.65 },
      ],
    },
    crest: {
      notes: [
        { atSec: 0, durSec: 0.45, note: 33, gain: 0.75 },
        { atSec: 0.75, durSec: 0.3, note: 33, gain: 0.5 },
        { atSec: 1.25, durSec: 0.6, note: 40, gain: 0.6 },
        { atSec: 2, durSec: 0.45, note: 41, gain: 0.7 },
        { atSec: 2.75, durSec: 0.3, note: 41, gain: 0.5 },
        { atSec: 3.25, durSec: 0.6, note: 36, gain: 0.6 },
        { atSec: 4, durSec: 0.45, note: 38, gain: 0.7 },
        { atSec: 4.75, durSec: 0.3, note: 45, gain: 0.5 },
        { atSec: 5.25, durSec: 0.5, note: 43, gain: 0.55 },
        { atSec: 6, durSec: 1.3, note: 33, gain: 0.75 },
      ],
    },
    deep: {
      notes: [
        { atSec: 0, durSec: 3.4, note: 33, gain: 0.7 },
        { atSec: 0, durSec: 3.4, note: 45, gain: 0.4 },
        { atSec: 3.6, durSec: 1.6, note: 29, gain: 0.7 },
        { atSec: 5.3, durSec: 2, note: 31, gain: 0.7 },
      ],
    },
    rain: {
      notes: [
        { atSec: 0, durSec: 0.3, note: 76, gain: 0.6 },
        { atSec: 0.55, durSec: 0.3, note: 69, gain: 0.5 },
        { atSec: 1.35, durSec: 0.3, note: 72, gain: 0.55 },
        { atSec: 1.65, durSec: 0.3, note: 64, gain: 0.45 },
        { atSec: 2.6, durSec: 0.3, note: 79, gain: 0.55 },
        { atSec: 2.9, durSec: 0.3, note: 71, gain: 0.45 },
        { atSec: 3.9, durSec: 0.4, note: 67, gain: 0.55 },
        { atSec: 4.3, durSec: 0.3, note: 74, gain: 0.5 },
        { atSec: 5.4, durSec: 0.3, note: 60, gain: 0.6 },
        { atSec: 5.55, durSec: 0.3, note: 72, gain: 0.45 },
        { atSec: 6.4, durSec: 0.6, note: 69, gain: 0.5 },
      ],
    },
    twohands: {
      notes: [
        { atSec: 0, durSec: 0.6, note: 45, gain: 0.7 },
        { atSec: 0.3, durSec: 0.3, note: 64, gain: 0.5 },
        { atSec: 0.6, durSec: 0.3, note: 67, gain: 0.5 },
        { atSec: 0.9, durSec: 0.3, note: 71, gain: 0.55 },
        { atSec: 1.5, durSec: 0.6, note: 52, gain: 0.6 },
        { atSec: 1.8, durSec: 0.3, note: 64, gain: 0.45 },
        { atSec: 2.1, durSec: 0.3, note: 67, gain: 0.5 },
        { atSec: 2.4, durSec: 0.6, note: 69, gain: 0.55 },
        { atSec: 3.2, durSec: 0.6, note: 41, gain: 0.7 },
        { atSec: 3.5, durSec: 0.3, note: 60, gain: 0.5 },
        { atSec: 3.8, durSec: 0.3, note: 64, gain: 0.5 },
        { atSec: 4.1, durSec: 0.3, note: 69, gain: 0.55 },
        { atSec: 4.7, durSec: 0.6, note: 48, gain: 0.6 },
        { atSec: 5, durSec: 0.3, note: 64, gain: 0.45 },
        { atSec: 5.3, durSec: 0.3, note: 67, gain: 0.5 },
        { atSec: 5.6, durSec: 1.2, note: 72, gain: 0.55 },
      ],
    },
    peal: {
      notes: [
        { atSec: 0, durSec: 0.4, note: 79, gain: 0.6 },
        { atSec: 0.6, durSec: 0.4, note: 77, gain: 0.5 },
        { atSec: 1.2, durSec: 0.4, note: 76, gain: 0.55 },
        { atSec: 1.8, durSec: 0.4, note: 74, gain: 0.5 },
        { atSec: 2.4, durSec: 0.4, note: 72, gain: 0.55 },
        { atSec: 3.3, durSec: 0.4, note: 77, gain: 0.5 },
        { atSec: 3.9, durSec: 0.4, note: 79, gain: 0.5 },
        { atSec: 4.5, durSec: 0.4, note: 74, gain: 0.5 },
        { atSec: 5.1, durSec: 0.8, note: 76, gain: 0.6 },
        { atSec: 5.1, durSec: 0.8, note: 60, gain: 0.5 },
      ],
    },
    frost: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 88, gain: 0.5 },
        { atSec: 1.1, durSec: 0.5, note: 83, gain: 0.45 },
        { atSec: 2.3, durSec: 0.4, note: 91, gain: 0.4 },
        { atSec: 2.7, durSec: 0.5, note: 86, gain: 0.45 },
        { atSec: 4.2, durSec: 0.5, note: 79, gain: 0.55 },
        { atSec: 5.6, durSec: 0.8, note: 84, gain: 0.5 },
      ],
    },
    lowtoll: {
      notes: [
        { atSec: 0, durSec: 1, note: 50, gain: 0.7 },
        { atSec: 1.6, durSec: 0.8, note: 57, gain: 0.5 },
        { atSec: 2.4, durSec: 0.8, note: 60, gain: 0.5 },
        { atSec: 3.6, durSec: 1, note: 48, gain: 0.65 },
        { atSec: 5, durSec: 0.8, note: 55, gain: 0.5 },
        { atSec: 5.8, durSec: 1, note: 64, gain: 0.5 },
      ],
    },
    quartet: {
      notes: [
        { atSec: 0, durSec: 2, note: 50, gain: 0.5 },
        { atSec: 0, durSec: 1, note: 57, gain: 0.45 },
        { atSec: 0, durSec: 2, note: 65, gain: 0.45 },
        { atSec: 0, durSec: 1, note: 69, gain: 0.5 },
        { atSec: 1, durSec: 1, note: 59, gain: 0.45 },
        { atSec: 1, durSec: 1, note: 67, gain: 0.5 },
        { atSec: 2, durSec: 1.6, note: 48, gain: 0.5 },
        { atSec: 2, durSec: 1.6, note: 60, gain: 0.45 },
        { atSec: 2, durSec: 1.6, note: 64, gain: 0.5 },
        { atSec: 2, durSec: 1.6, note: 67, gain: 0.4 },
        { atSec: 3.6, durSec: 1.8, note: 53, gain: 0.5 },
        { atSec: 3.6, durSec: 0.9, note: 60, gain: 0.45 },
        { atSec: 3.6, durSec: 1.8, note: 69, gain: 0.5 },
        { atSec: 4.5, durSec: 0.9, note: 59, gain: 0.45 },
        { atSec: 5.4, durSec: 1.9, note: 52, gain: 0.5 },
        { atSec: 5.4, durSec: 1.9, note: 59, gain: 0.45 },
        { atSec: 5.4, durSec: 1.9, note: 67, gain: 0.5 },
      ],
    },
    lament: {
      notes: [
        { atSec: 0, durSec: 1.8, note: 45, gain: 0.55 },
        { atSec: 0, durSec: 1.8, note: 57, gain: 0.4 },
        { atSec: 0, durSec: 1.8, note: 64, gain: 0.45 },
        { atSec: 0, durSec: 2.3, note: 72, gain: 0.5 },
        { atSec: 1.8, durSec: 1.8, note: 43, gain: 0.55 },
        { atSec: 1.8, durSec: 1.8, note: 62, gain: 0.4 },
        { atSec: 1.8, durSec: 1.8, note: 64, gain: 0.4 },
        { atSec: 2.3, durSec: 1.3, note: 71, gain: 0.5 },
        { atSec: 3.6, durSec: 1.8, note: 41, gain: 0.55 },
        { atSec: 3.6, durSec: 1.8, note: 57, gain: 0.4 },
        { atSec: 3.6, durSec: 1.8, note: 64, gain: 0.4 },
        { atSec: 3.6, durSec: 2.3, note: 69, gain: 0.5 },
        { atSec: 5.4, durSec: 1.9, note: 40, gain: 0.55 },
        { atSec: 5.4, durSec: 1.9, note: 59, gain: 0.4 },
        { atSec: 5.4, durSec: 1.9, note: 64, gain: 0.4 },
        { atSec: 5.9, durSec: 1.4, note: 67, gain: 0.5 },
      ],
    },
    psalm: {
      notes: [
        { atSec: 0, durSec: 1.7, note: 57, gain: 0.55 },
        { atSec: 0, durSec: 1.7, note: 64, gain: 0.5 },
        { atSec: 1.7, durSec: 0.8, note: 59, gain: 0.5 },
        { atSec: 1.7, durSec: 0.8, note: 62, gain: 0.5 },
        { atSec: 2.5, durSec: 1.6, note: 60, gain: 0.55 },
        { atSec: 4.3, durSec: 1, note: 62, gain: 0.5 },
        { atSec: 4.3, durSec: 1, note: 65, gain: 0.5 },
        { atSec: 5.3, durSec: 2, note: 57, gain: 0.55 },
        { atSec: 5.3, durSec: 2, note: 64, gain: 0.5 },
      ],
    },
    trio: {
      notes: [
        { atSec: 0, durSec: 2.4, note: 38, gain: 0.5 },
        { atSec: 0, durSec: 1.2, note: 65, gain: 0.5 },
        { atSec: 1.2, durSec: 0.6, note: 64, gain: 0.5 },
        { atSec: 1.8, durSec: 0.6, note: 62, gain: 0.5 },
        { atSec: 0.6, durSec: 1.8, note: 57, gain: 0.45 },
        { atSec: 2.4, durSec: 1.8, note: 43, gain: 0.5 },
        { atSec: 2.4, durSec: 0.9, note: 59, gain: 0.45 },
        { atSec: 3.3, durSec: 0.9, note: 62, gain: 0.45 },
        { atSec: 2.4, durSec: 1.8, note: 65, gain: 0.5 },
        { atSec: 4.2, durSec: 3, note: 36, gain: 0.5 },
        { atSec: 4.2, durSec: 1.5, note: 60, gain: 0.45 },
        { atSec: 4.2, durSec: 0.8, note: 67, gain: 0.5 },
        { atSec: 5, durSec: 0.7, note: 65, gain: 0.5 },
        { atSec: 5.7, durSec: 1.5, note: 64, gain: 0.5 },
        { atSec: 5.7, durSec: 1.5, note: 55, gain: 0.45 },
      ],
    },
    vigil: {
      notes: [
        { atSec: 0, durSec: 7.3, note: 45, gain: 0.5 },
        { atSec: 0, durSec: 7.3, note: 52, gain: 0.4 },
        { atSec: 0, durSec: 7.3, note: 60, gain: 0.4 },
        { atSec: 0.6, durSec: 6.7, note: 67, gain: 0.4 },
        { atSec: 3.6, durSec: 3.7, note: 71, gain: 0.4 },
      ],
    },
    longline: {
      notes: [
        { atSec: 0, durSec: 2.6, note: 57, gain: 0.6 },
        { atSec: 2.6, durSec: 2.4, note: 62, gain: 0.55 },
        { atSec: 5, durSec: 2.3, note: 60, gain: 0.55 },
      ],
    },
    pedalline: {
      notes: [
        { atSec: 0, durSec: 2.6, note: 45, gain: 0.65 },
        { atSec: 2.6, durSec: 2.2, note: 43, gain: 0.6 },
        { atSec: 4.8, durSec: 2.5, note: 48, gain: 0.6 },
      ],
    },
    fifthhold: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 38, gain: 0.5 },
        { atSec: 0.8, durSec: 6.4, note: 45, gain: 0.45 },
        { atSec: 2.4, durSec: 4.8, note: 62, gain: 0.35 },
        { atSec: 4.2, durSec: 3, note: 64, gain: 0.35 },
      ],
    },
  },
  directions: [
    {
      id: 'slow-train',
      name: 'Slow train pads',
      category: 'pad',
      rows: `
Sleeper car at four | Slow train | travel=.22 penumbra=.45 tone=0.82 attack=1.8 release=3.4 body=.6 sustain=.9 glow=.1 eyes=.35 parallax=0.6 jag=0.04 decay=7 | glacial | window | Round hills with pines shining softly through them, slow to rise
Milk churns on the stop | Slow train | near=Towers height=.35 repeats=1 attack=.25 sustain=.55 decay=2.2 release=1.2 tone=0.69 ground=.8 company=.1 wind=.08 vibrato=0 parallax=0 jag=0.4 body=0.2 | faintfuzz | tenths | Hollow towers that settle back after their rise, few overtones passing
Fields in pairs | Slow train | far=Hills repeats=2 travel=.32 parallax=.66 height=.75 eyes=.9 company=.6 attack=.8 tone=.72 wind=.1 jag=0 sun=.1 penumbra=0.45 decay=1.8 | ensemble | window | Two rows of hills behind, one gliding and one standing still
Guard's lamp swings | Slow train | travel=.5 parallax=.2 vibrato=.55 height=.7 attack=.6 eyes=1 body=.2 ground=0.55 repeats=3 tone=.78 company=.2 penumbra=0.1 jag=0.18 glow=0.85 decay=4.5 | panned | gather | Pines flickering past a swaying hill, a deep quick waver in every note
Rime on the buffers | Slow train | near=Cliffs repeats=5 jag=0.4 ground=0.6 tone=0.52 attack=1.2 release=4 penumbra=.05 sun=0 eyes=.95 travel=.3 wind=.4 parallax=0.9 glow=0.7 body=0.5 decay=1.2 | brightair | window | Cold stone with a glitter of needles far up
Varnished carriage | Bowed cliffs | body=1 travel=.26 height=.4 attack=.45 sustain=.8 tone=.66 wind=.15 company=.15 ground=.7 eyes=.3 vibrato=.2 parallax=0.1 penumbra=0.05 sun=0 jag=0.32 glow=0.2 decay=12 | board | tenths | A bow on one bright cliff in a deep wooden box
Salt marsh halt | Bowed cliffs | penumbra=.7 height=.75 travel=.34 wind=.6 attack=1.4 release=4.5 tone=0.44 ground=.45 eyes=.85 company=.7 body=.1 sun=0.12 jag=0 glow=0 decay=4.5 | shore | window | Soft edged cliffs and hills in much breath, a whole section
Seven arches | Bowed cliffs | sun=.75 repeats=1 travel=.42 height=.55 attack=.35 sustain=.9 tone=.74 body=.45 company=.5 vibrato=.08 glow=.6 parallax=0.55 penumbra=0.3 jag=0 decay=1.2 | fifthhall | junction | A long shadow hollows the cliffs while low hills roll behind
Coal smoke in wool | Bowed cliffs | tone=.38 penumbra=.4 jag=.6 ground=.85 attack=.9 sustain=1 release=2.6 glow=.8 travel=.2 eyes=.15 company=.4 parallax=0.25 sun=0 body=0 | scooped | window | Dull rough cliffs close to their ground, opening with every swell
Ticket in the hatband | Bowed cliffs | attack=.08 decay=1.4 sustain=.35 release=.9 repeats=4 travel=.46 parallax=0 height=.5 glow=.7 eyes=.5 tone=.7 company=.25 penumbra=0.35 sun=0.2 jag=0.25 body=0.75 | cassette | sixths | Cliffs that speak at once and step back, one row of hills whistling by
Through the cutting | Needle flutter | attack=.5 release=2.2 sustain=.9 near=Hills travel=.7 repeats=2 tone=0.7 ground=.6 jag=.1 company=.5 wind=.2 penumbra=0.04 decay=1.8 | unfolding | window | Needles going past once a second behind one round hill
Poles and wires | Needle flutter | near=Cliffs travel=.78 attack=.9 decay=6 sustain=1 release=2.5 height=.5 repeats=4 ground=0.7 parallax=0 tone=0.42 eyes=.4 penumbra=0.08 glow=0.1 volume=3.5 | sixstage | tenths | A quick flutter high over plain stone, both rows together
Hares running alongside | Climbing swells | travel=.68 repeats=2 parallax=.5 near=Hills attack=.3 release=1.5 height=.8 tone=.66 company=.2 ground=.55 glow=.5 penumbra=0.3 body=0.1 | leaffall | gather | Each note swells with the cliffs that run past it, quick and round
Wheel song | Slow train | far=Cliffs travel=.6 repeats=1 height=.9 vibrato=.3 attack=.4 release=1.6 eyes=.5 ground=.5 company=.7 tone=.7 sun=.4 jag=0 glow=0.6 body=0.6 decay=12 | throb 1.floor=.75 | window | Low cliffs going round and round under a reedy hill
Rattle of the luggage | Needle flutter | travel=.95 near=Towers attack=.12 decay=2.5 sustain=.5 release=1.4 jag=.75 height=.6 eyes=.95 tone=0.88 body=.7 ground=.6 penumbra=0.12 sun=0.26 glow=0.5 | springs | sixths | Towers behind a blur of needles at full pace, rough and wide
Other train leaving | Slow train | far=Hills parallax=1 travel=.48 height=0.75 near=Cliffs attack=.7 repeats=3 ground=0.4 eyes=.75 tone=0.5 sustain=1 company=.1 wind=.05 penumbra=0.45 jag=0.18 glow=0.85 body=0.5 | longplate | window | Hills going both ways at once over little ground
Platform slides away | Slow train | parallax=.9 travel=.4 repeats=1 height=1 penumbra=.3 attack=1.5 release=3.5 tone=0.66 company=.8 vibrato=.2 eyes=.6 body=.8 decay=7 volume=0 near=Towers sun=0.3 | slowdrift | vigil | Low hills stand over the note and part slowly, many players
Points at the junction | Climbing swells | parallax=.95 travel=.45 near=Towers repeats=3 attack=.5 release=2.4 tone=0.6 eyes=1 company=.3 jag=.3 penumbra=0.04 body=0.1 volume=-3 | sides | tenths | Cliffs climb one way and fall the other over hollow towers
Return ticket | Bowed cliffs | far=Pines parallax=1 travel=.55 height=.45 repeats=2 attack=.28 sustain=.75 release=1.8 ground=.6 tone=.64 sun=.5 wind=.5 eyes=1 penumbra=0.35 jag=0.25 decay=1.8 | mirror | window | Breathy reeds of stone with pines passing both ways, wide
Two windows facing | Fifth voices | parallax=.85 travel=.36 near=Cliffs ground=.4 attack=1 height=.7 eyes=1 tone=.68 company=.35 vibrato=0 body=.15 sun=0.16 decay=12 | longrise | gather | Bright stone and two open vowels turning apart
Snowed in at the halt | Haze drone | travel=.08 attack=1.6 release=4 near=Cliffs tone=.42 height=.5 company=.3 wind=.7 repeats=2 ground=.6 eyes=.6 parallax=1 sun=0.2 jag=0.04 body=0.6 | breathroom | window | Hardly moving, soft stone with a wind round the hut
Waiting room stove | Felt keys | attack=.6 sustain=.8 release=2 travel=.15 company=.5 body=.95 tone=.4 height=.45 decay=6 eyes=.4 sun=0 jag=0 | fewsteps | tenths | Warm dull wood, one hill turning very slowly behind it
Brass lamp at the halt | Still organ | near=Cliffs travel=.12 attack=.7 release=2.5 height=.55 tone=0.76 company=.65 eyes=.8 body=.7 wind=.2 repeats=2 parallax=0.8 jag=0.4 | chorale | junction | Almost at rest, brass coloured cliffs and a hill over them
Sunday timetable | Slow train | far=Hills travel=.1 near=Hills repeats=4 height=.65 penumbra=.6 sun=.35 attack=1.1 release=2.8 tone=0.45 company=0 eyes=.2 vibrato=0 wind=0 parallax=0 jag=0 glow=0.5 body=0.75 decay=4.5 | bare | window | One plain player, three rows of hills that hardly move
Chalk on the slate board | Bowed cliffs | far=Pines travel=.16 height=0.6 jag=0.45 wind=.45 attack=.8 release=3 ground=0.6 tone=0.32 eyes=.7 sustain=.9 repeats=1 parallax=0.9 sun=0.26 decay=7 volume=0 | veil | tenths | Dry grain and needles nearly at rest over stone
Inside the long tunnel | Slow train | far=Cliffs tone=.28 ground=1 travel=.34 repeats=1 attack=1.3 sustain=1 release=3.2 penumbra=.35 eyes=.3 wind=.3 body=.5 parallax=0.5 jag=0.32 glow=0.1 | stairwell | junction | Almost all fundamental, dark cliffs climbing far inside it
Bricks going by | Dune bass | attack=.5 decay=4 sustain=.8 release=1.8 tone=0.76 travel=.42 company=.45 eyes=.5 ground=.7 wind=.15 repeats=2 parallax=0.1 sun=0.12 jag=0.36 body=0.2 volume=-8.5 | glacier | tenths | Round hills that swell one after another, rough at the top
Soot and candle ends | Felt keys | near=Towers attack=1 sustain=.9 release=3 tone=.34 travel=.28 ground=.5 company=.4 jag=.5 body=.4 penumbra=0.95 eyes=.8 parallax=0.55 sun=0.16 | darkbox | window | Dim hollow towers with a soft rough hill shining through
Light at the far end | Climbing swells | tone=.45 attack=2 repeats=3 travel=.25 near=Hills ground=.8 company=.4 glow=1 release=3.5 height=.7 wind=.2 body=0 | glowroom | vigil | Dark at first, one slow climb of cliffs brings the light in
Damp in the mortar | Bowed cliffs | near=Pines tone=.36 ground=.9 decay=5 sustain=1 release=6 attack=.9 wind=.55 travel=.24 height=.3 company=.6 body=.9 parallax=0.25 sun=0 jag=0 glow=0.7 | cave | window | Nasal pines pulled down into their ground, damp and slow
Viaduct in three spans | Tower pluck | attack=.8 decay=5 sustain=.85 release=2 repeats=3 far=Hills travel=.36 height=.6 tone=0.54 eyes=.8 company=.5 wind=.12 parallax=0.6 body=0.2 ground=0.6 volume=-5 | openspace | window | Hollow towers, hills rolling between their legs
Ravens under the rail | Tower pluck | far=Pines attack=.35 decay=8 sustain=1 release=1.4 travel=.58 repeats=2 height=.45 ground=.6 sun=.8 tone=0.5 company=.2 vibrato=.3 parallax=1 penumbra=0.1 jag=0.25 body=0.1 | evening | tenths | Reedy hollow towers, pines quick and dark in front of the sky
Iron lattice | Winter bells | attack=.6 decay=6 sustain=.9 release=1.6 jag=.4 travel=.44 body=.5 company=.6 tone=0.56 repeats=4 ground=0.7 sun=0.12 volume=0.5 | jet | window | Open towers with a lattice of needles passing, many players
Pigeon loft in the pier | Tower pluck | far=Hills attack=.2 decay=4 sustain=.7 release=1.1 height=.85 penumbra=.55 repeats=1 travel=.4 tone=0.48 ground=.75 body=.8 wind=.45 eyes=.3 sun=0 | vowelled | junction | Towers with low hills shining through, breathy and wooden
Echo beneath the bridge | Tower pluck | attack=.06 decay=3 sustain=.45 release=1 height=.5 repeats=2 travel=.48 parallax=.9 ground=0.62 eyes=.9 company=.4 tone=0.56 penumbra=0.1 sun=0.16 body=0 | cleanecho | sixths | Hollow and quick to speak, cliffs going both ways behind
Up through larches | Climbing swells | repeats=3 travel=.4 height=.8 near=Pines attack=.8 decay=8 release=6 tone=0.74 ground=.55 company=.45 eyes=.9 jag=0.18 glow=0.2 | commons | window | Nasal wood at the front, a long climb and a drop every few seconds
Switchback at noon | Climbing swells | near=Towers repeats=1 travel=.5 parallax=.67 height=.75 attack=.15 release=1.2 company=0 eyes=.4 tone=.7 body=.6 penumbra=0 jag=0.32 glow=0.6 | triode | tenths | One hollow player carried up and dropped every two seconds
Summit board | Climbing swells | near=Hills repeats=7 travel=.44 height=1 attack=1 release=4 ground=0.58 tone=0.52 company=.8 vibrato=.25 eyes=1 penumbra=0.45 jag=0.4 glow=0 body=0.75 | airytail | gather | A full section under a whistle that climbs and falls
Goods train on the grade | Climbing swells | tone=0.6 jag=.6 repeats=2 travel=.36 ground=.85 near=Cliffs company=.35 wind=.5 attack=.5 release=1.8 eyes=.25 sun=.5 glow=0.6 body=0.6 volume=-5.5 | glacial | junction | Heavy, rough and reedy, every note hauled up by the cliffs
Water for the engine | Climbing swells | near=Towers penumbra=.6 repeats=1 travel=.32 attack=1.2 release=3 height=.85 wind=.6 ground=.6 tone=0.38 eyes=.7 jag=0 glow=0.1 body=0.5 volume=-2.5 | calm | window | Breath and hollow towers filled from below and emptied
Above the cloud floor | High pass train | travel=.4 attack=2.4 release=4.5 ground=0.7 tone=0.6 company=.7 near=Cliffs jag=.1 penumbra=0.12 glow=0.2 body=0.2 decay=1.2 repeats=9 | swellpad | vigil | Very high needles over bright stone, slow and wide
Marmots and wire | High pass train | travel=.66 repeats=8 attack=.4 release=1.4 parallax=.3 near=Towers tone=0.64 ground=.65 eyes=.6 wind=.05 body=0.6 decay=4.5 | chimes | sixths | Hollow towers with a quick whistle of needles over them
Thin air, low gear | High pass train | far=Hills repeats=9 height=.9 travel=.3 ground=0.35 attack=1.8 tone=0.6 body=.6 company=.2 sun=.3 wind=.15 penumbra=0.3 glow=0 decay=1.8 | shallows | gather | Fourteen little hills in a cycle, a pale whistle that barely moves
Glass over the platforms | High pass train | far=Cliffs repeats=5 travel=.46 parallax=.4 near=Towers attack=.9 release=2.8 ground=0.6 penumbra=0 tone=0.86 eyes=1 jag=0 sun=0 body=0.1 decay=1.2 | glasshall | tenths | Sharp towers, bright cliffs climbing behind them, very wide
Snow plough sparks | High pass train | travel=0.64 near=Pines decay=9 release=8 attack=.6 ground=0.7 tone=0.46 jag=0.95 repeats=1 company=0.9 sustain=1 sun=0.26 body=0.5 height=0.85 | crystals | window | Nasal pines, ground down rough, needles passing both ways
Fir forest, third class | Pine strings | attack=.7 travel=.32 far=Hills company=.7 vibrato=.25 wind=.3 tone=0.62 jag=.2 height=.55 eyes=.6 release=7 parallax=0.8 penumbra=0.35 sun=0.2 glow=0.85 body=0 | warm | window | A crowded section on nasal pines, hills rolling behind
Resin on the sill | Pine strings | company=0.4 attack=.25 far=Hills height=.7 repeats=1 ground=.8 tone=0.48 jag=0 release=5 body=.95 eyes=.3 vibrato=.4 parallax=0.1 sun=0.16 glow=0.5 volume=-7.5 | driftshift | tenths | Two or three players on dark pine, low hills close behind
Forest with no birds | Pine strings | far=Pines travel=.28 attack=1.6 release=9 wind=.8 company=.5 ground=0.55 tone=.45 vibrato=0 height=0.5 penumbra=.5 parallax=0.55 sun=0 glow=0.7 body=0.75 volume=0.5 | infog | window | Pines behind pines in a steady wind, no waver at all
Saw mill in the valley | Pine strings | jag=1 travel=.48 company=.9 attack=.4 release=5 tone=0.76 ground=.7 parallax=.8 repeats=3 sun=.2 wind=.15 penumbra=0.04 glow=0.85 | reel | junction | The roughest of pines, a broad section with cliffs turning back
Cones falling one by one | Pine strings | attack=.05 decay=7 sustain=.4 release=4 company=.35 vibrato=.1 jag=.35 travel=.4 height=.5 eyes=1 tone=0.5 penumbra=0.1 glow=0.7 body=0.5 volume=-3.5 | pebble | sixths | Quick nasal notes that settle low, cliffs swelling behind
`,
    },
    {
      id: 'roof-keys',
      name: 'Roof keys',
      category: 'keys',
      rows: `
Slate after a shower | Tower pluck | decay=1.8 release=.7 repeats=1 ground=.7 tone=0.74 height=.5 eyes=.35 travel=.3 body=.3 wind=.06 parallax=0 penumbra=0.05 sun=0.2 jag=0.32 | smallplate | attic | Hollow keys with a low cliff rising slowly in each
Swifts under the eaves | Tower pluck | decay=1 release=.5 far=Pines repeats=3 travel=.62 tone=0.44 ground=0.7 eyes=.9 jag=.3 company=.25 parallax=0.1 penumbra=0.3 sun=0 body=0.75 | hintspring | twohands | Short hollow keys with a quick flicker of needles after each
Lead on the ridge | Tower pluck | far=Hills decay=2.6 sustain=.1 release=.9 sun=.6 penumbra=.5 tone=.42 ground=.8 height=.65 body=.7 company=0 parallax=0.8 jag=0.4 volume=-8.5 | darkspring | attic | Dull towers hollowed by a long shadow, a hill lying over them
Belfry clock workings | Tower pluck | decay=.5 release=.35 repeats=5 height=.75 tone=0.64 ground=0.64 glow=.3 jag=.5 vibrato=0 parallax=.8 eyes=.6 wind=0 penumbra=0.45 sun=0.26 volume=3.5 | tin | hocket | Dry ticking keys, cliffs high over the towers
Pigeons all at once | Tower pluck | attack=.012 decay=3 release=1.6 company=.8 eyes=1 repeats=2 ground=.65 tone=0.54 travel=.4 wind=.35 parallax=0.55 penumbra=0.04 sun=0.12 body=0 | feltair | ostinato | A wide crowd of hollow keys with breath in them
Attic piano, one lamp | Felt keys | decay=3 release=0.4 body=.95 tone=.4 repeats=3 ground=.75 company=.05 wind=.18 eyes=.2 parallax=1 sun=0.16 jag=0.25 near=Towers | booth | attic | Felt on a hollow string, inside much wood
Trunk of letters | Felt keys | penumbra=0.95 height=.55 tone=.36 glow=.95 decay=3 sustain=.05 travel=.18 company=.3 eyes=.55 parallax=0 | dusty | sixths | Very soft keys, dull when played gently, open when struck
Rafters and string | Felt keys | near=Cliffs far=Cliffs repeats=3 height=.45 travel=.42 tone=0.52 decay=2.4 release=.6 ground=.5 jag=.25 eyes=.7 parallax=0.3 sun=0 | shells | twohands | Woody keys, each with a small climb of cliffs in its fall
Blanket over the lid | Felt keys | tone=0.14 attack=.03 decay=5 sustain=.2 ground=.95 body=.5 company=.4 vibrato=.15 wind=.3 repeats=4 parallax=0.9 jag=0 volume=-11.5 | pillow | - | Nearly all ground, a soft late start, the rest under cloth
Mice in the music | Felt keys | decay=.9 release=.3 height=.6 repeats=6 tone=0.58 travel=.55 penumbra=.2 ground=.6 body=.85 eyes=.4 glow=.2 parallax=0.6 sun=0 jag=0.18 volume=1.5 | softbed | hocket | Short felted keys with a small whistle running over them
Warm tiles at six | Dune bass | decay=2.6 sustain=.15 release=.5 tone=0.5 far=Hills repeats=2 ground=.65 company=.3 eyes=.5 glow=.6 height=.45 jag=0 body=0.6 | ampshake | sixths | Round keys of one hill that close as they fall
Terracotta pots | Dune bass | decay=1.2 sustain=0 release=.4 tone=0.62 far=Hills repeats=4 ground=.5 eyes=.4 body=.9 height=.6 jag=.1 parallax=0.25 sun=0.26 | pot | twohands | Round short keys in a wooden body, a hill whistling by
Cat along the gutter | Dune bass | decay=3 sustain=.3 release=.3 tone=.66 far=Cliffs repeats=3 travel=.5 height=.5 ground=.6 eyes=.7 vibrato=.3 parallax=0.2 sun=0.2 body=0.1 | touchwah | ostinato | Supple round keys, bright at the touch, cliffs sliding through
Sheets over the yard | Dune bass | decay=4 sustain=.4 release=1.2 tone=.44 far=Hills height=.7 penumbra=.6 company=.6 eyes=.85 wind=.35 ground=.7 attack=.02 parallax=0.1 sun=0.12 jag=0.04 body=0.2 | cloudtune | - | Airy round keys from a whole row of players
Bread oven chimney | Dune bass | decay=1.6 sustain=.1 release=.35 tone=.38 far=Cliffs repeats=1 ground=.9 body=.65 sun=.3 glow=.8 company=.1 parallax=0 jag=0 | iron | attic | Dark round keys, a low cliff moving under the lid
Copper going green | Bowed cliffs | attack=.005 decay=4.5 sustain=.1 release=1 tone=0.94 glow=0.95 repeats=3 ground=0.8 company=.2 vibrato=0 eyes=.6 wind=.08 parallax=1 penumbra=0 sun=0 jag=0.18 | longplate | attic | Bright struck cliffs that darken over four seconds
Weathercock at noon | Bowed cliffs | attack=.004 decay=1.5 sustain=0 release=.5 tone=0.66 glow=.9 far=Pines repeats=2 travel=.58 jag=.2 ground=0.66 company=0 body=.2 vibrato=0 parallax=0.55 volume=2.5 | limited | hocket | Keen struck stone with needles turning in it
Lantern room | Bowed cliffs | attack=.006 decay=8 sustain=.2 release=2 tone=0.78 height=.8 parallax=.75 travel=.38 ground=.45 eyes=.95 company=.4 vibrato=.05 penumbra=0.35 sun=0.2 jag=0.4 glow=0 body=0.6 | openspace | sixths | Long ringing stone, two hills leading it back and forth
Sun on one window | Bowed cliffs | attack=.004 decay=2.2 sustain=.05 release=.6 tone=0.76 sun=.9 ground=.75 height=.2 travel=.2 company=.1 body=.6 wind=0 vibrato=0 penumbra=0.3 jag=0.05 | woolly | ostinato | Hollow reedy keys struck plainly, nothing much behind them
Tarred ropes | Bowed cliffs | attack=.008 decay=3.4 sustain=.25 release=.5 tone=0.5 jag=.85 penumbra=.35 ground=.85 repeats=1 company=.3 eyes=.25 body=1 vibrato=.1 parallax=0.9 sun=0 glow=0.1 | cupboard | attic | Rough dark stone keys in a full wooden body
Thatch and wasps | Needle flutter | far=Hills attack=.004 decay=5 sustain=.05 release=3 tone=0.54 travel=.4 repeats=2 ground=.65 jag=.2 company=.1 eyes=.4 penumbra=0.5 sun=0.26 glow=0.6 body=0.75 | paper | twohands | Short nasal keys on pines, a hill humming behind
Straw in the gutter | Needle flutter | far=Cliffs attack=.005 decay=9 sustain=.1 release=5 tone=0.4 travel=.36 height=.5 ground=.8 jag=.1 company=.3 eyes=.65 sun=0.16 glow=0.5 body=0.65 | smaller | attic | Thin wooden keys of pine with a climb after the touch
Shingles split by hand | Needle flutter | attack=.004 decay=2.5 sustain=0 release=1.5 tone=0.5 travel=.65 repeats=4 ground=0.72 jag=.8 body=.85 parallax=.2 eyes=.5 company=0 sun=0.12 glow=0.2 volume=1 | strap | hocket | Very short dry keys, rough at the edge
Barn owl's plank | Needle flutter | far=Hills attack=.01 decay=14 sustain=.2 release=8 tone=.4 travel=.2 height=.65 penumbra=.6 ground=.7 jag=0 wind=.5 eyes=.3 body=1 sun=0.2 glow=0.2 | board 1.mix=.55 | attic | Breathy dull pine keys that hold a little
Larder door ajar | Needle flutter | attack=.004 decay=6 sustain=.3 release=2 tone=0.5 sun=.7 travel=.3 repeats=1 far=Cliffs ground=.6 company=.45 eyes=.7 glow=0.7 body=0.5 | bottle | sixths | Nasal hollow keys, half held, low cliffs behind
Skylight in March | Winter bells | near=Cliffs decay=2.8 sustain=.05 release=1 repeats=5 tone=0.76 ground=.6 travel=.46 height=.55 company=.25 parallax=0.25 penumbra=0.08 sun=0.26 eyes=0.35 volume=2 | thinned | ostinato | Bright struck keys, needles flickering very high over them
Ferns of frost | Winter bells | near=Hills decay=2 release=1.2 repeats=8 tone=0.95 ground=0.85 height=.75 travel=.4 eyes=.8 company=.35 jag=.1 parallax=0.8 penumbra=0.12 sun=0 | glassharp | twohands | Round keys with a thin cold whistle, wide
Telescope lens | Felt keys | near=Hills repeats=9 height=.8 decay=2.6 sustain=.1 release=.8 tone=0.7 travel=.24 ground=.55 body=.2 eyes=.5 penumbra=.15 parallax=0.6 sun=0.16 volume=0.5 | smallplate | attic | Plain round keys and one clear whistle fourteen harmonics up
Hail on the dormer | Tower pluck | far=Pines decay=.8 release=.6 repeats=7 travel=.74 height=.6 tone=0.66 ground=.6 jag=.6 eyes=1 company=.1 penumbra=0.1 sun=0 body=0.2 | scatter | hocket | Brief hollow keys shattered by high needles
Star chart | Winter bells | near=Cliffs far=Hills decay=6 sustain=.15 release=2 repeats=6 parallax=.9 tone=0.36 ground=.8 height=.65 travel=.34 company=.5 penumbra=0.75 sun=0.12 | stars | sixths | Long soft keys, hills crossing slowly far above
Chimney reed | Reed evening | attack=.012 decay=4 sustain=.7 release=.2 wind=.2 vibrato=0 tone=0.58 company=.2 height=.35 body=.9 parallax=0 penumbra=0.45 jag=0.25 glow=0.1 volume=-3 | harmonic | sixths | Held reedy keys with every second overtone gone
Harmonium by the sink | Still organ | near=Cliffs sun=.5 travel=.2 attack=.03 release=.25 wind=.45 tone=0.42 height=.4 company=.35 ground=.65 vibrato=.2 parallax=0.6 | kitchen | attic | Breathy reeds held plainly, a hill just moving
Smoke going straight up | Reed evening | far=Cliffs attack=.02 decay=2 sustain=.4 release=.6 sun=.6 travel=.44 height=.55 wind=.7 ground=.5 eyes=.75 vibrato=.1 parallax=0.3 penumbra=0.35 jag=0 glow=0.85 volume=-2.5 | driftgrain | - | Half breath, half reed, with cliffs rising in it
Brass plate by the door | Reed evening | near=Towers attack=.006 decay=1.6 sustain=.5 release=.3 sun=.3 wind=.05 tone=0.8 ground=0.9 repeats=1 height=.3 company=0.45 parallax=0.25 penumbra=0.04 jag=0.25 glow=0.5 | spun | ostinato | Hollow held keys with a firm start, pipes rather than strings
Pump organ upstairs | Still organ | near=Pines travel=.28 attack=.04 decay=9 sustain=.9 release=1.4 tone=0.78 far=Hills height=.7 wind=.35 vibrato=.4 company=.6 body=.8 parallax=0.55 sun=0.3 | losing | sixths | Nasal held keys from a wavering row of reeds
Gutter in full spate | Tower pluck | near=Hills far=Cliffs decay=1.6 release=.7 repeats=4 travel=.66 height=.7 tone=0.42 ground=.65 eyes=.8 glow=.5 penumbra=0.35 sun=0.12 jag=0 body=0 | halfnote | twohands | Round keys with quick cliffs running up through them
Drip on the zinc | Tower pluck | decay=.4 release=.8 far=Hills repeats=6 tone=0.5 ground=.75 height=.5 travel=.3 glow=.95 company=0 eyes=.3 parallax=0.9 jag=0.4 body=0.1 volume=3.5 | pebble | hocket | Tiny hollow keys that shut at once
Downpipe at midnight | Dune bass | near=Towers decay=1.8 sustain=.1 release=1 tone=.4 repeats=2 ground=.75 travel=.5 eyes=.6 company=.2 wind=.25 parallax=0.55 body=0.75 | darkecho | attic | Dim hollow keys, a cliff climbing inside the pipe
Puddle and neon | Needle flutter | near=Hills attack=.005 decay=2.4 sustain=.1 release=1.2 travel=.8 repeats=3 tone=0.76 ground=.75 jag=.1 eyes=.95 company=.4 penumbra=0 glow=0.6 body=0.2 | wobble | ostinato | Round wet keys with a fluttering edge, very wide
Thaw over the porch | Winter bells | near=Hills far=Cliffs decay=1.4 release=.9 repeats=3 travel=.5 height=.65 tone=0.72 ground=.7 company=.1 eyes=.5 glow=.85 penumbra=0.04 sun=0.2 | spiralled | twohands | Short round drops, a cliff climbing in each
Gable, east side | Needle flutter | near=Cliffs attack=.006 decay=3 sustain=.25 release=.8 travel=.5 repeats=2 tone=0.76 ground=.7 body=.6 company=.2 eyes=.8 wind=.2 penumbra=0.3 sun=0.16 volume=1 | sixstage | sixths | Stone keys with pines going past twice a second
Net curtain, open sash | Slow train | attack=.02 decay=3.5 sustain=.35 release=1 travel=.46 repeats=3 tone=0.56 ground=.75 company=.55 wind=.5 eyes=.75 glow=.6 parallax=0.8 penumbra=0.6 body=0.6 | calm | - | Soft round keys and much air, needles drifting by
Moth at the bulb | Needle flutter | near=Towers attack=.004 decay=1.8 sustain=.05 release=.8 travel=.92 repeats=5 tone=0.62 ground=.75 height=.6 jag=.2 eyes=.6 penumbra=0.1 sun=0.26 glow=0 body=0.1 | leaves | attic | Hollow keys round which something flutters very fast
Slatted afternoon | Needle flutter | near=Cliffs attack=.008 decay=2 sustain=.15 release=.5 travel=.6 parallax=1 repeats=1 tone=.44 ground=.6 sun=.4 eyes=1 body=.4 penumbra=0.45 glow=0 volume=-1.5 | stillwater | ostinato | Striped dark keys, low needles crossing both ways
First tram below | Slow train | near=Cliffs attack=.01 decay=5 sustain=.2 release=.7 travel=.7 repeats=2 tone=0.58 ground=.85 jag=0.25 company=.1 wind=.1 sun=0 parallax=0 penumbra=0.35 body=0 | nearshadow | attic | Plain stone keys with a tremble of needles in their ring
Keys under the stairs | Dune bass | decay=1.1 sustain=.2 release=.3 tone=0.62 near=Cliffs repeats=3 height=.4 ground=0.65 body=.7 glow=.7 jag=0.35 | narrow | dune | Low wooden keys, short and rough, a step of cliff in each | bass
Coal hatch | Felt keys | near=Towers decay=1.4 sustain=.1 release=.3 tone=.35 ground=.95 far=Cliffs repeats=1 travel=.35 company=.1 wind=0 eyes=0 parallax=0.1 sun=0 jag=0 | middle | crest | Short low hollow keys with nothing wide about them | bass
Hard hands, soft ears | Felt keys | far=Pines glow=1 tone=.3 decay=2.8 sustain=.1 repeats=4 travel=.52 ground=.5 jag=.5 body=.4 eyes=.9 height=.6 parallax=0.1 sun=0 | bloomfilter | attic | Very dull when touched, full of needles when struck
Evening class | Still organ | attack=.005 decay=2.4 sustain=.3 release=.5 travel=.3 near=Cliffs tone=0.6 height=.6 company=.5 ground=.55 body=.5 repeats=2 vibrato=.08 parallax=1 jag=0.04 volume=1 | halfbow | sixths | Plain struck chords, half held, a broad row of players
Last tenant's upright | Bowed cliffs | attack=.004 decay=2.6 sustain=.1 release=.4 tone=0.36 far=Cliffs repeats=2 height=.3 ground=.7 company=.75 vibrato=0 body=.8 wind=.2 eyes=.5 parallax=0.2 penumbra=0.45 sun=0.12 jag=0.32 glow=0.2 volume=-2 | wornthin | attic | Sour wooden keys, three strings to a note, none in agreement
`,
    },
    {
      id: 'cliff-leads',
      name: 'Cliff leads',
      category: 'wind',
      rows: `
Gull off the ledge | Cliff lead | tone=.8 vibrato=.6 travel=.5 attack=.03 release=.3 ground=.6 height=.45 eyes=.2 glow=0.1 decay=12 volume=1 | openair | edge | A keen single edge with a late waver, cliffs climbing behind
Lead on a string | Cliff lead | vibrato=0 travel=.05 far=Hills height=.2 tone=0.5 attack=.015 sustain=1 company=0 wind=.04 jag=0 eyes=0 body=.15 parallax=0.8 glow=0.5 volume=-2.5 ground=0.62 penumbra=0.12 | bare | edge | A straight sharp tone in the middle, nothing behind it moving
Signal mirror | Cliff lead | repeats=5 travel=.62 parallax=.9 height=.65 tone=0.54 ground=0.66 eyes=.8 vibrato=.3 release=.6 jag=.1 glow=0.7 body=0.5 decay=7 volume=-1 | cleanecho | kite | A bright line with glints that cross from both sides
Frayed climbing rope | Cliff lead | jag=.85 wind=.4 attack=.06 tone=.64 ground=.65 body=.7 vibrato=.45 sustain=.7 travel=.35 parallax=0.5 glow=0.6 decay=4.5 | triode | edge | A rough lead, its edge split into fibres
Ledge at first light | Cliff lead | attack=.25 penumbra=.4 release=1.4 tone=0.8 travel=.28 vibrato=.2 repeats=2 company=.25 eyes=.6 parallax=0 body=0.1 decay=1.8 volume=-2 | airytail | kite | The edge softened, coming slowly and leaving slowly
Goatherd's low reed | Reed evening | sun=.9 tone=0.5 vibrato=.3 attack=.05 release=.35 wind=.35 ground=.75 body=.6 height=.05 travel=.1 jag=0.18 glow=0.85 decay=1.2 volume=-7.5 | woolly | reedline | A dark low reed with hardly a thing behind it
Reed through the hedge | Reed evening | sun=.45 far=Cliffs height=.4 repeats=3 travel=.48 tone=0.86 attack=.03 vibrato=.5 wind=.2 eyes=.5 ground=.5 parallax=0.3 jag=0 glow=0.2 decay=12 | slap | edge | A half hollow reed with a climb inside each long note
Pipe smoke, no wind | Reed evening | sun=1 near=Hills tone=.44 attack=.14 release=.8 vibrato=.65 wind=.6 ground=0.6 company=.1 travel=.3 parallax=0 penumbra=0.4 jag=0.04 decay=7 repeats=5 height=0.45 | darkspring | reedline | Round and smoky, a wide waver on soft breath
Two reeds, one mouth | Reed evening | company=.65 vibrato=.15 sun=.6 tone=0.46 attack=.02 release=.2 wind=.15 ground=.55 jag=.3 travel=.2 eyes=.4 penumbra=0.04 glow=0.6 decay=12 | tubed | edge | Two hollow reeds that disagree by a little
Heron stands up | Reed evening | near=Pines sun=1 tone=0.54 decay=6 sustain=.7 release=1.5 attack=.08 body=1 vibrato=.35 wind=.45 height=.25 parallax=0.1 penumbra=0.3 jag=0.25 glow=0.85 volume=0 | fewsteps | reedline | Grey nasal reed, dry in the throat
Shepherd's pine pipe | Pine strings | company=0 attack=.04 release=1.2 vibrato=.5 wind=.5 jag=.1 far=Hills tone=0.44 height=.2 ground=0.72 eyes=.2 sustain=.9 parallax=0.9 penumbra=0.1 sun=0.26 body=0.8 volume=-0.5 | farecho | edge | One nasal pipe, air round it
Crow's opinion | Pine strings | company=.1 attack=.012 release=.8 vibrato=.1 jag=0.75 tone=0.46 ground=0.7 height=.5 travel=.55 eyes=.3 wind=.2 body=.6 parallax=0.55 penumbra=0.05 sun=0 glow=0.1 | parlour | edge | A rough nasal voice that says it bluntly
Thread through needles | Pine strings | company=.05 far=Pines repeats=2 travel=.4 attack=.02 release=1 tone=0.7 ground=.8 jag=0 vibrato=.25 eyes=.6 height=.45 parallax=0.55 penumbra=0.08 sun=0.2 glow=0.7 body=0.2 volume=-3.5 | clouds | kite | A thin nasal line with needles stitched along it
Old double reed | Pine strings | company=.2 sun=.3 attack=.03 release=.9 vibrato=.6 tone=.66 ground=.5 body=.85 wind=.15 jag=.4 far=Hills travel=.15 height=.15 eyes=.1 parallax=1 penumbra=0.45 glow=0 | forward | reedline | Pinched nasal reed in a wooden bell
Turpentine song | Pine strings | company=.3 attack=.15 release=3 vibrato=.4 repeats=4 travel=.36 tone=0.56 parallax=.8 eyes=.9 height=.6 ground=.65 jag=.2 penumbra=0.04 glow=0.5 volume=-3 | repeats | kite | Nasal and drawn out, cliffs far off turning back
Clay whistle on a sill | Fifth voices | near=Hills ground=.8 height=.3 tone=0.52 attack=.03 release=.5 vibrato=.3 company=0 wind=.3 eyes=.15 body=.4 travel=.2 penumbra=.2 sun=0 jag=0 glow=0 decay=1.8 | room | edge | Round as clay, a low hill rolling slowly in it
Hollow in the hand | Dune bass | far=Hills attack=.05 decay=8 sustain=.9 release=.6 tone=0.54 wind=0.7 vibrato=.4 ground=0.6 height=.4 eyes=.3 repeats=4 parallax=0.6 jag=0 | shell | kite | A plain rounded call with breath in it
Swallow at the beam | Dune bass | far=Cliffs attack=.01 decay=3 sustain=.6 release=.4 tone=0.74 travel=.64 repeats=4 ground=.6 vibrato=.2 eyes=.6 height=.55 parallax=0.1 sun=0.16 jag=0 | ripple | edge | A round lead with quick cliffs darting over it
Balcony whistler | Fifth voices | ground=1 repeats=3 tone=0.36 attack=.02 release=.35 vibrato=0.9 company=0 wind=0.45 height=0.3 eyes=0 travel=.05 jag=0.04 glow=0.2 decay=4.5 | slap | kite | Nearly a plain tone under the breath, whistled with a wide waver
Evening on the dune | Dune bass | attack=.35 decay=10 sustain=1 release=2 tone=0.36 sun=.35 vibrato=.3 ground=.55 far=Hills repeats=3 height=.7 eyes=.8 wind=.2 travel=.32 parallax=0.25 body=0.75 | evening | longline | A slow round line hollowed by a low sun, wide behind
Pipe from the tower | Tower pluck | attack=.02 decay=5 sustain=.85 release=.3 far=Hills tone=0.42 vibrato=.25 ground=.65 wind=0.6 eyes=.3 repeats=4 travel=.25 glow=.3 parallax=0.9 penumbra=0.35 jag=0.4 body=0.5 | cathedral 1.mix=.2 | edge | A hollow pipe with a breathy start
Stopped pipe, cracked | Tower pluck | attack=.015 decay=6 sustain=.8 release=.25 far=Pines jag=.6 sun=.7 tone=0.78 ground=.7 wind=.6 repeats=3 travel=.5 eyes=.4 glow=.4 parallax=0.25 | hintspring | reedline | A hollow pipe with a leak that flickers
Watchman's hour | Tower pluck | attack=.08 decay=8 sustain=.95 release=1 tone=0.4 far=Cliffs repeats=1 travel=.36 vibrato=.1 company=0.15 ground=0.7 body=.5 eyes=0.25 glow=.6 parallax=0.2 penumbra=0.3 sun=0.26 jag=0.18 | backhall | edge | Hollow horn calls that swell as a low cliff comes up
Bamboo at the sluice | Tower pluck | attack=.006 decay=2 sustain=.5 release=.5 tone=0.82 far=Hills wind=.9 vibrato=.55 ground=.8 body=.2 eyes=.2 company=0 height=.2 parallax=0.1 sun=0 jag=0.32 | under | kite | Split breath over a hollow stem, hard at the lip
Keeper of the light | Tower pluck | attack=.5 decay=9 sustain=1 release=2 tone=0.52 repeats=5 parallax=.95 travel=.42 ground=0.7 eyes=1 vibrato=.15 company=.2 height=.7 penumbra=0.05 jag=0 body=0 | circle | longline | Hollow and slow to come round, cliffs turning over it
Fiddle on the headland | Bowed cliffs | company=0 attack=.06 sustain=.85 release=.35 vibrato=.7 wind=.65 body=0.95 tone=0.58 travel=0.34 height=0.45 eyes=.25 parallax=0.8 penumbra=0.1 sun=0.08 jag=0 glow=0.1 decay=1.2 volume=-1.5 repeats=4 ground=0.64 | slowbow | edge | One bow, plenty of hair on the string, a hill high over it | string
Gut string at dusk | Bowed cliffs | company=.05 attack=.12 tone=0.4 ground=.75 body=1 wind=.5 vibrato=.3 release=.7 jag=.2 height=.25 travel=.15 glow=.7 penumbra=0.04 sun=0 decay=7 | board | reedline | A dark bowed string, all box and hair | string
Harmonic near the nut | Bowed cliffs | near=Hills repeats=5 ground=0.64 height=.75 attack=.1 wind=0.5 tone=0.58 vibrato=.15 company=0 travel=.1 eyes=.3 body=.6 penumbra=.1 parallax=0.55 sun=0.16 jag=0.1 glow=0.6 decay=7 volume=-1 | brightbox | kite | A bowed whistle, only half a note under it | string
Saw blade, bent | Bowed cliffs | near=Hills far=Hills vibrato=1 ground=.9 tone=.4 attack=.2 release=1 company=0 wind=.25 travel=.2 body=.1 eyes=.5 penumbra=0.3 jag=0 glow=0.5 decay=1.2 volume=1 | sheen | longline | Almost a plain tone with the widest waver there is | string
Second desk alone | Bowed cliffs | company=.35 attack=.1 vibrato=.5 wind=0.6 tone=0.48 body=.6 travel=.4 far=Pines height=.5 repeats=1 ground=0.75 eyes=.7 release=.8 parallax=1 penumbra=0.1 sun=0.12 jag=0 glow=0.85 decay=12 volume=-0.5 | secondman | edge | A bowed line with pines behind and not quite alone | string
Condor rising | Climbing swells | company=.05 attack=.1 release=.8 repeats=3 travel=.42 tone=0.54 ground=0.72 eyes=.4 vibrato=.35 height=.7 parallax=.5 penumbra=0.45 jag=0.32 glow=0.7 volume=-3 | valley | kite | Each long note is carried up by the cliffs and set down
Surf against basalt | Climbing swells | near=Towers company=.1 attack=.04 release=.5 travel=.62 repeats=2 tone=0.66 ground=0.7 wind=.45 jag=.5 eyes=.6 penumbra=0.35 glow=0 body=0 height=0.8 | breakers | edge | A hollow lead that rears up nearly once a second
Kite line humming | Climbing swells | near=Pines company=0 attack=.08 release=2 travel=.34 repeats=6 decay=8 tone=0.66 ground=.7 height=.8 sun=.2 vibrato=.2 eyes=.3 penumbra=0.3 body=0.75 volume=0.5 | jet | kite | Nasal and taut, one whistle creeping up the string
Cable car swings out | Climbing swells | near=Hills company=.2 attack=.16 release=1.2 travel=.5 repeats=1 tone=0.5 ground=.7 glow=.9 vibrato=.5 height=.85 eyes=.5 penumbra=0.1 jag=0.04 body=0.6 volume=-0.5 | eight | edge | Round and leaning, opened and shut every two seconds
Alarm in the quarry | Climbing swells | near=Cliffs company=0 attack=.01 release=.3 travel=.72 repeats=3 tone=0.44 ground=0.85 parallax=.8 jag=.2 height=0.5 eyes=.2 vibrato=0 penumbra=0 glow=0.5 body=0.2 | slap | edge | Straight calls with cliffs racing up behind them
Whistle over the saddle | High pass train | near=Hills far=Hills attack=.06 release=.8 repeats=7 travel=.18 ground=0.48 tone=0.66 jag=0 eyes=.3 wind=.4 vibrato=.35 height=0.7 penumbra=0.08 body=0.5 decay=4.5 volume=2.5 | fewsteps | kite | A light tone under a thin whistle, eight harmonics up
Tin whistle, wet | High pass train | near=Towers far=Hills attack=.015 release=.4 repeats=4 ground=0.85 tone=0.96 travel=.3 eyes=.2 wind=.3 vibrato=.15 jag=.1 height=.5 sustain=.8 penumbra=0.12 sun=0 glow=0.7 body=0.1 decay=1.8 | watery | edge | A hollow bright whistle, quick at the lip
Marsh bird, unseen | High pass train | near=Hills attack=.02 release=.6 repeats=9 travel=.7 ground=.6 parallax=.5 tone=0.5 eyes=.7 jag=.2 height=.7 vibrato=.1 decay=2 sustain=.5 penumbra=0.35 sun=0.16 glow=0.1 body=0.75 | scatter | kite | Round calls with a trembling needle high above
Kettle on the pass | High pass train | far=Cliffs near=Cliffs attack=.2 release=1 repeats=9 travel=.4 ground=.75 tone=0.4 eyes=.4 jag=.4 wind=.6 height=.9 penumbra=0.04 sun=0.26 glow=0.85 body=0.6 decay=7 | kettle | edge | Steam and stone, a whistle climbing until it drops
Glass reed | High pass train | near=Towers far=Hills attack=.09 release=1.6 repeats=6 travel=.24 ground=0.65 tone=0.48 sun=.5 eyes=.9 wind=.05 vibrato=.25 height=.7 penumbra=.4 body=0.2 decay=1.8 volume=1 jag=0.1 | longplate | kite | A hollow pale reed with one clear overtone gliding
Breath across stone | Wind on stone | attack=.1 release=.8 company=0 ground=.5 tone=0.8 jag=.3 vibrato=.3 eyes=.3 sustain=.8 height=.2 parallax=0.6 sun=0 glow=0.6 body=0.1 decay=1.2 | embers | edge | More air than note, then more note than air
Blown over a keyhole | Wind on stone | near=Hills attack=.04 release=.4 company=0 wind=1 ground=.75 tone=.4 jag=.2 eyes=.1 travel=.1 vibrato=.1 body=.8 parallax=0 glow=0.2 decay=4.5 | nextdoor | reedline | Round and full of breath, small in the dark
Forge with one bellows | Wind on stone | near=Towers attack=.15 release=.6 company=.1 jag=.6 ground=.55 tone=0.76 far=Cliffs travel=.45 repeats=2 vibrato=0 body=.5 eyes=.5 parallax=0.5 sun=0.2 glow=0.85 decay=12 | stack | reedline | Rough hollow breath that swells from underneath
Sand against the tent | Wind on stone | near=Pines attack=.06 release=2 company=.2 wind=.75 jag=1 ground=.6 tone=0.66 travel=.5 far=Pines eyes=.7 vibrato=.2 sun=.4 parallax=0.25 glow=0 body=0 decay=12 | autumn | edge | Dry nasal grit blown along the note
Scarf in the gale | Wind on stone | attack=.3 release=1.5 company=.3 wind=0.6 vibrato=.9 ground=0.7 tone=0.72 far=Pines travel=.4 jag=.1 height=0.5 eyes=.8 parallax=0 sun=0.12 glow=0.6 body=0.5 decay=7 volume=-0.5 repeats=3 | breeze | kite | Air and a wide shaking tone, needles going by
Wire between two farms | Cliff lead | company=.3 ground=0.7 tone=0.5 attack=.01 sustain=1 vibrato=0.05 jag=.2 travel=.3 eyes=.2 height=.3 release=.25 parallax=0.3 glow=0.2 sun=0.15 | narrow | reedline | A taut thin buzz, held straight
Sun on the pylons | Cliff lead | company=.7 vibrato=.2 tone=0.86 repeats=2 ground=.8 attack=.04 release=.5 eyes=.8 travel=.4 far=Hills height=.5 penumbra=.15 parallax=0.1 glow=0.1 decay=1.2 volume=-1.5 | gallop | kite | A broad line of three players tuned well apart
Night bus radio | Cliff lead | tone=0.86 ground=.7 attack=.02 vibrato=.35 sun=.55 far=Hills travel=.2 body=.5 wind=.1 repeats=2 eyes=.1 company=0 parallax=0.55 glow=0.5 decay=1.8 volume=0 | shortwave | edge | A thin hollow lead, steady under its waver
Storm lantern swings | Cliff lead | far=Pines travel=.78 repeats=2 height=.6 attack=.05 vibrato=.8 tone=0.72 ground=.7 parallax=.6 eyes=1 release=.9 glow=0.7 body=0 decay=4.5 | spun | reedline | A wild wide waver with needles flickering round it
Ice axe | Cliff lead | near=Towers attack=.004 decay=1.2 sustain=.4 release=.35 jag=.5 tone=0.8 travel=.46 ground=.7 vibrato=0 sun=.15 eyes=.3 parallax=0.5 glow=0.6 volume=0.5 | dotted | edge | Hollow and chipped, struck and then held
`,
    },
    {
      id: 'dune-basses',
      name: 'Dune basses',
      category: 'bass',
      rows: `
Lee side, cool sand | Dune bass | tone=0.36 decay=1.4 sustain=0.1 far=Hills travel=.22 height=0.7 body=.3 release=.25 glow=.6 repeats=2 parallax=0.9 jag=0 penumbra=0.6 ground=0.8 wind=0.3 | bare | dune | One round hill and another turning slowly on its slope
Singing slip face | Dune bass | tone=.7 repeats=3 travel=.5 height=.75 penumbra=.05 sustain=.6 decay=4 release=.4 eyes=.4 body=.2 ground=.7 sun=0.12 jag=0 | reel | dune | A round floor with a bright cliff sliding down it every two seconds
Camel bells unseen | Dune bass | far=Pines tone=0.56 repeats=2 travel=.45 ground=1 decay=3 sustain=.2 release=.5 eyes=.6 height=.6 jag=.1 sun=0.16 body=0.75 | hintspring | crest | All ground, with a small jingle of needles on top
Barchan at noon | Dune bass | tone=0.8 sun=0.95 sustain=.7 decay=8 attack=0.05 release=.3 travel=.15 far=Hills vibrato=.1 company=.2 body=.4 parallax=0.8 jag=0 volume=-7.5 ground=0.6 | tube | dune | Half hollow under a low sun, plain and steady
Tracks filled by morning | Dune bass | tone=.4 penumbra=.7 wind=.5 attack=.06 decay=1.6 sustain=.25 release=.6 ground=.65 height=.7 eyes=.5 parallax=0 sun=0.2 body=0.2 volume=1 | mist | deep | Soft edged and breathy, the hills shining through each other
Arco in the cellar | Bowed cliffs | tone=0.5 ground=.75 attack=.16 sustain=.9 release=.6 body=.9 wind=.6 company=.1 vibrato=.3 eyes=.2 repeats=1 travel=.2 height=.3 sun=0 jag=0.18 glow=0.7 decay=1.8 | smalldark | deep | A low bow with hair and box
Two double basses | Bowed cliffs | tone=0.6 ground=.6 attack=.1 sustain=.85 company=.55 body=.7 wind=.35 eyes=.6 repeats=2 travel=.34 height=.5 release=.5 parallax=1 penumbra=0.45 sun=0 jag=0.25 decay=7 | hotvalve | dune | Bowed stone, tuned apart, a hill leaning over both
Barge rope groans | Bowed cliffs | tone=0.6 jag=.8 ground=.85 attack=.3 release=1.2 sustain=1 wind=.3 travel=0.34 far=Cliffs repeats=3 height=.6 body=.5 eyes=.3 parallax=0.1 penumbra=0.12 sun=0.26 glow=0.1 | well | deep | Rough and slow, hauled up and let down by the cliffs
Pizzicato under arches | Bowed cliffs | attack=.004 decay=.9 sustain=0 release=.35 tone=0.52 ground=.8 body=1 wind=.1 company=0 vibrato=.05 height=.25 eyes=.2 glow=.5 repeats=1 sun=0.12 volume=1.5 | chamber 1.mix=.28 | crest | A finger on a thick string in a wooden box
Rosin and iron | Bowed cliffs | tone=.72 ground=.55 attack=.02 decay=3 sustain=.5 release=.2 sun=.3 jag=.3 repeats=3 travel=.28 company=.05 eyes=.15 wind=.45 parallax=0.6 penumbra=0.05 | iron | crest | Biting low strings, a little hollow at the top
Bassoon on the sand | Reed evening | tone=0.36 sun=.85 attack=.03 release=.2 ground=.8 body=.8 wind=.25 vibrato=.2 height=.2 sustain=.8 eyes=0 parallax=0.6 penumbra=0.35 jag=0.4 glow=0.85 decay=1.2 | parlour | dune | A dry low reed that speaks at once
Contrabass reed | Reed evening | tone=.4 sun=1 attack=.08 release=.5 ground=.65 wind=.8 vibrato=0 repeats=1 height=.4 travel=.3 company=.15 parallax=1 penumbra=0.04 jag=0 glow=0.5 decay=12 | lowsines | pedalline | Breath and reed at the very bottom
Clarinet in the boiler | Reed evening | near=Towers tone=0.46 sun=.7 attack=.02 decay=3 sustain=.6 release=.4 wind=.2 far=Hills repeats=4 height=.5 travel=.4 body=.3 parallax=0.8 penumbra=0.3 jag=0.18 glow=0 volume=-3 | kettle | crest | Hollow low tubes with a small hill singing higher up
Reed organ pedals | Reed evening | near=Pines tone=0.74 sun=.6 decay=8 sustain=.9 release=1.2 ground=.9 company=.4 vibrato=.05 wind=.1 height=.15 eyes=.3 parallax=0.55 jag=0.04 | pedalpipe | pedalline | Nasal pedals held straight, tuned slightly apart
Foghorn at the bar | Reed evening | near=Cliffs tone=.36 attack=.4 release=1.6 ground=.7 wind=.5 far=Cliffs repeats=1 travel=.36 height=.6 glow=.8 parallax=0.2 penumbra=0.1 jag=0.32 decay=4.5 | shore | deep | A slow horn that opens as the cliff comes up
Upright in the stairwell | Tower pluck | decay=1 release=.4 tone=0.5 ground=.75 repeats=1 far=Hills height=.35 body=.85 eyes=.2 glow=.6 travel=.25 wind=.15 parallax=0.25 sun=0.16 jag=0.32 | stairwell | crest | A hollow plucked bass, wood behind the string
Bucket down the shaft | Tower pluck | decay=.5 release=.3 tone=.42 ground=.95 repeats=2 travel=.4 body=.4 eyes=.1 glow=1 sun=.4 jag=0.25 volume=6 | well | dune | Short hollow drops with a quick shut
Muted on the bridge | Tower pluck | decay=0.5 release=.2 tone=.36 ground=.8 far=Hills repeats=5 body=1 company=0 jag=.4 wind=0.1 eyes=0 penumbra=0.45 sun=0.26 | middle | crest | Damped and woody, gone at once
Slack string, long hall | Tower pluck | decay=3 sustain=.15 release=1.4 tone=0.72 ground=.65 repeats=2 travel=.36 parallax=.8 height=.6 company=.3 eyes=.7 vibrato=.1 penumbra=0.45 sun=0 jag=0.18 body=0.6 | hall | deep | Long hollow strings with cliffs sliding two ways in them
Tower clock's weight | Tower pluck | attack=.01 decay=1.8 sustain=.1 release=.6 tone=0.34 ground=0.9 sun=0.5 far=Pines repeats=1 travel=.5 jag=0.4 eyes=.5 parallax=0.9 penumbra=0 body=0.5 | grit | dune | Iron hollow strokes with a rough tick of needles low down
Boar in the pines | Pine strings | attack=.01 decay=6 sustain=.5 release=1.5 tone=0.62 ground=.8 company=.15 vibrato=0 jag=.7 eyes=.2 height=.4 repeats=1 wind=.2 penumbra=0.08 sun=0 glow=0.2 body=0.1 volume=1.5 | forward | crest | A rough nasal grunt with a low cliff in it
Roots under the path | Pine strings | attack=.04 tone=.36 ground=.95 company=.45 vibrato=.1 wind=.15 far=Hills decay=10 sustain=.8 release=3 jag=.2 eyes=.4 parallax=0 penumbra=0.04 sun=0.2 body=0.5 volume=-8.5 | darksnow | deep | Dark and nasal, hardly opening, tuned apart
Log on the saw | Pine strings | attack=.006 decay=5 sustain=.2 release=1 tone=0.78 ground=.6 far=Pines repeats=3 travel=.6 jag=1 company=0 vibrato=0 eyes=.5 height=.6 parallax=0.1 penumbra=0.05 sun=0.2 body=0.7 volume=-4 | console | crest | Teeth in wood, needles turning fast over a nasal edge
Charcoal heap at dawn | Pine strings | attack=.2 decay=12 release=4 tone=.42 ground=.7 company=.7 wind=.6 vibrato=.2 far=Cliffs repeats=1 travel=.3 height=.6 eyes=.8 penumbra=0.4 sun=0.26 glow=0.7 body=0.75 volume=-4 | padbelow | pedalline | Breath over glowing nasal low strings, many of them
Bark peeled green | Pine strings | attack=.004 decay=3 sustain=0 release=2 tone=0.46 ground=.85 company=.1 far=Hills repeats=2 jag=.15 body=.9 eyes=.3 vibrato=0 height=.3 sun=0.16 glow=0.5 volume=-1.5 | strap | crest | Wet short nasal strokes
Pulse of the quarry | Bowed cliffs | attack=.005 decay=.6 sustain=.1 release=.2 tone=0.72 glow=1 ground=.85 company=0 vibrato=0 repeats=1 eyes=.1 jag=.2 wind=.1 parallax=0 penumbra=0.12 body=0.2 volume=3.5 | limited | crest | Bright at the stroke and shut straight after
Rail joints, slow train | Dune bass | decay=.7 sustain=.1 release=.2 tone=0.46 glow=1 far=Hills repeats=2 ground=.75 company=0.5 jag=.3 eyes=.4 travel=.5 parallax=0.55 body=0.1 | gallop | crest | Round strokes that shut fast, tuned wide
Coke down the chute | Tower pluck | near=Cliffs decay=.8 sustain=.2 release=.2 tone=.44 glow=.95 ground=.8 jag=.9 repeats=2 travel=.55 eyes=.3 body=.6 parallax=0.55 sun=0.12 volume=4.5 | folded | crest | Gravelly short strokes with cliffs tumbling after
Steam hammer over there | Felt keys | near=Cliffs decay=1.1 sustain=0 release=.5 tone=.34 glow=.9 ground=.9 body=.9 repeats=1 far=Cliffs travel=.3 height=.4 company=.1 parallax=0.3 sun=0 jag=0 volume=4 | lowpulse | dune | Thick padded strokes
Foot on the loose board | Felt keys | near=Hills decay=.6 sustain=.05 release=.2 tone=.4 glow=.8 ground=.7 penumbra=.2 repeats=4 height=.5 travel=.6 eyes=.3 body=.8 wind=.3 parallax=0.6 sun=0 jag=0 | board | crest | Round wooden steps with a quick squeak in them
Tide under the dunes | Dune bass | attack=.7 decay=8 sustain=.9 release=1.6 tone=0.56 travel=.34 company=.5 eyes=.5 ground=.8 repeats=1 wind=.3 height=.85 sun=0.16 jag=0 body=0.6 | water | deep | Round swells with a low cliff moving through
Sandbar moves at night | Climbing swells | near=Hills repeats=1 tone=0.36 attack=.3 release=.8 travel=.38 ground=.85 company=.2 eyes=.3 height=.7 penumbra=0.1 jag=0.4 body=0 volume=-14 | floor | deep | The whole bass rears and sinks about every four seconds
Ship comes about | Climbing swells | near=Cliffs repeats=2 tone=0.6 attack=.5 release=1.4 travel=.3 sun=.45 ground=.7 parallax=.7 company=.45 eyes=.6 wind=.4 jag=.1 penumbra=0.3 body=0.5 volume=0 | cellos | deep | Reedy stone swelling slowly, the last row standing
Whale under the keel | Climbing swells | near=Hills repeats=3 tone=0.7 attack=.9 release=3 travel=.26 vibrato=.5 ground=.65 company=.1 height=.9 penumbra=.4 eyes=.8 jag=0.04 glow=0.6 volume=-0.5 | sinking | deep | A long round call that climbs inside and gives way
Bellows below deck | Climbing swells | near=Towers repeats=1 tone=.42 attack=.15 release=.5 travel=.55 wind=.8 ground=.75 company=0 eyes=.2 body=.6 penumbra=0.35 jag=0 glow=0.1 volume=-11 | darkspring | deep | Hollow breath pumped in and out every second and a half
Stone in the stomach | Dune bass | tone=0.1 ground=1 decay=3 sustain=.6 release=.3 far=Hills height=.1 travel=.05 eyes=0 glow=.1 attack=.01 parallax=0.9 volume=-11 | floor | deep | Next to a plain tone, as low as the key goes
Generator two fields off | Still organ | ground=1 tone=0.16 height=.4 travel=.1 repeats=2 attack=.1 release=.4 company=.45 body=.7 jag=.3 eyes=.2 parallax=0.8 | lowpulse | deep | A steady dark hum tuned slightly apart
Sump | Haze drone | attack=.05 release=.6 decay=4 tone=.3 ground=.95 company=.2 wind=.2 eyes=.3 travel=.3 height=.6 sustain=.8 parallax=0.25 sun=0.12 jag=0.25 body=0.75 | smalldark | dune | Dark, with all edges gone
Bedrock hum | Still organ | near=Cliffs ground=1 tone=.32 attack=.02 decay=5 sustain=.4 release=.25 height=.3 sun=.2 travel=.15 body=.2 eyes=.05 parallax=1 jag=0 volume=-3 | suboct | pedalline | Plain dark stone, falling a little after it speaks
Undertaker's bass | Felt keys | near=Towers tone=.24 ground=.9 attack=.02 decay=6 sustain=.5 release=.8 height=.5 travel=.2 repeats=1 company=.35 vibrato=.2 wind=.1 parallax=0.1 sun=0.26 jag=0.32 | blanket | deep | Hollow, dim and unhurried
Stars over the erg | Dune bass | near=Hills far=Pines repeats=5 tone=0.54 ground=1 decay=4 sustain=.5 release=.8 travel=.4 height=.75 eyes=1 jag=.2 parallax=0 sun=0 body=0.6 | octrain | deep | A dark round floor and, very far up, needles wide apart
Beetle on the crest | Dune bass | far=Hills repeats=8 tone=0.72 decay=1.5 sustain=.2 release=.4 ground=.95 travel=.6 height=.9 eyes=.3 penumbra=.1 sun=0 jag=0 | thump | crest | A round floor with a tiny whistle running over it
Broken bottle in sand | Winter bells | near=Hills repeats=6 tone=0.36 ground=1 attack=.005 decay=1.4 release=.4 travel=.5 eyes=.5 company=0 glow=.6 parallax=0.8 sun=0.2 | darkecho | crest | Round low strokes with splinters in their start
Comet over the salt pan | High pass train | near=Hills far=Cliffs ground=1 tone=0.5 attack=.03 release=.8 travel=.36 parallax=.5 repeats=6 height=.9 eyes=.6 wind=.1 sustain=.7 sun=0.12 glow=0 body=0.1 decay=1.8 | spiralled | deep | A dark held floor, one bright cliff climbing far above it
Copper wire in the wall | Needle flutter | near=Hills ground=.95 tone=0.5 repeats=4 travel=.75 decay=3 sustain=.4 release=.4 eyes=.2 jag=.5 attack=.01 sun=0.2 glow=0.2 | narrow | dune | A round floor with a wire that shivers in the middle
Lorry in second gear | Bowed cliffs | tone=0.7 ground=.8 attack=.02 decay=4 sustain=.8 release=.2 company=.3 jag=.5 sun=.2 travel=.45 far=Cliffs repeats=1 eyes=.2 vibrato=0 penumbra=0 glow=0.85 body=0 | fuzzed | crest | Broad rough stone, labouring as low cliffs pass
Amplifier in the dunes | Dune bass | near=Towers tone=0.4 decay=2 sustain=.5 release=.25 ground=.7 travel=.3 repeats=2 sun=.25 body=.3 jag=.2 parallax=0.2 volume=-8.5 | hotvalve | dune | Hollow and round, pushed
Wide as a dry lake | Dune bass | far=Pines tone=0.4 repeats=2 ground=.8 decay=6 sustain=.8 release=.9 company=.9 eyes=1 travel=.36 vibrato=.1 height=.55 attack=.04 parallax=1 sun=0.16 body=0.2 | slowdrift | deep | Many round players, needles low and wide
Radio mast foundations | Still organ | near=Pines tone=0.58 ground=.85 sun=.4 height=.5 attack=.01 decay=3 sustain=.7 release=.6 jag=0.15 travel=.2 far=Cliffs repeats=1 eyes=.4 parallax=0 volume=0.5 | standing | crest | Nasal plain tones with a slow step of cliff
Bass of the oil drums | Tower pluck | attack=.005 decay=.7 release=.5 tone=0.74 ground=.7 repeats=3 far=Hills height=.7 penumbra=.6 travel=.35 body=.5 jag=.3 company=.4 eyes=.6 parallax=0.55 sun=0.26 | halfunder | dune | Hollow drums with a hill in the rim, tuned apart
`,
    },
    {
      id: 'tower-plucks',
      name: 'Tower plucks',
      category: 'plucked',
      rows: `
Harp on the battlements | Tower pluck | decay=1.4 release=1.2 far=Hills repeats=2 ground=.65 tone=0.8 height=.35 eyes=.5 body=.35 wind=.1 travel=.25 penumbra=0.35 jag=0.18 | deckloop | twohands | Hollow harp strings, a hill turning over as they fall
Arrow slits | Tower pluck | decay=.4 release=.25 repeats=2 ground=0.74 tone=0.62 glow=.6 eyes=.9 travel=.46 height=.3 company=0 jag=.2 parallax=0.55 body=0.2 volume=2.5 | smaller | hocket | Narrow bright plucks, gone nearly at once
Spiral stair, barefoot | Tower pluck | decay=.9 release=.8 far=Hills repeats=4 parallax=.9 travel=.44 ground=.7 tone=0.46 height=.6 body=.5 eyes=.7 penumbra=0.6 sun=0 jag=0.04 | spiralled | ostinato | Soft hollow steps with two small hills going round
Bell rope untied | Tower pluck | decay=2.4 release=1.3 repeats=1 ground=0.65 tone=0.56 height=.65 glow=.4 company=.25 eyes=.6 travel=.35 sun=.3 parallax=0.1 penumbra=0.45 jag=0.4 body=0 | undershadow | peal | Long hollow plucks in which a low cliff rises
Mortar dust | Tower pluck | decay=.6 release=.4 far=Pines jag=0.8 wind=0.5 ground=0.65 tone=0.52 height=.5 travel=.6 repeats=3 eyes=.8 body=.3 parallax=0.6 penumbra=0.04 sun=0 volume=2.5 | emptyroom | rain | Dry hollow plucks in a puff of grit
Kite string snaps | Bowed cliffs | attack=.004 decay=.9 sustain=0 release=.6 ground=0.68 tone=0.58 glow=.6 repeats=3 height=.3 company=0 vibrato=0 wind=.2 body=.4 eyes=.3 parallax=0.9 penumbra=0.08 sun=0.26 volume=2 | chamber | rain | Tight bright strings with little behind them
Lute in a boat cabin | Bowed cliffs | attack=.004 decay=1.6 sustain=0 release=.5 ground=.75 tone=0.52 glow=.5 body=1 company=.12 vibrato=.1 repeats=1 eyes=.2 wind=.1 penumbra=0.3 sun=0 jag=0.25 | board | twohands | Gut and wood, a hill leaning in
Dulcimer left outside | Bowed cliffs | attack=.004 decay=2.8 sustain=0 release=1.8 ground=.45 tone=.66 company=.5 jag=.3 vibrato=.05 repeats=2 eyes=.75 body=.6 travel=.2 parallax=0.25 penumbra=0.1 | springs | ostinato | Three wires to a key, weathered apart
Quarry wire at noon | Bowed cliffs | attack=.004 decay=1.2 sustain=0 release=.9 far=Cliffs repeats=5 travel=.55 ground=.7 tone=0.7 jag=.5 height=.6 vibrato=0 company=.05 eyes=.6 parallax=0.5 penumbra=0.12 glow=0.1 body=0.5 volume=2.5 | tiles | hocket | Hard bright wire with cliffs dropping high above
Oud under the fig tree | Bowed cliffs | attack=.005 decay=1.1 sustain=0 release=.35 sun=.5 ground=.8 tone=0.34 body=.85 company=.2 vibrato=.35 wind=.25 far=Hills repeats=1 eyes=.15 parallax=0.1 penumbra=0.04 jag=0.32 glow=0.6 volume=-2 | parlour | twohands | Half hollow strings, low and woody, with a waver
Pine cone on the stove | Needle flutter | attack=.004 decay=2.4 sustain=0 release=1.6 far=Cliffs travel=.3 repeats=2 ground=.65 tone=0.74 jag=.2 company=0 eyes=.2 height=.3 penumbra=0.35 sun=0.16 volume=4 | booth | hocket | Dry nasal ticks that jump
Kindling for one night | Needle flutter | attack=.004 decay=1.2 sustain=0 release=1 travel=.6 repeats=5 ground=0.7 tone=0.54 jag=.7 body=.9 company=0 eyes=.6 height=.6 penumbra=0.1 glow=0 volume=3.5 | bare | rain | The shortest splinters of sound, each a little different
Fence slats and a stick | Needle flutter | attack=.004 decay=3.5 sustain=0 release=2.5 far=Hills repeats=3 sun=.6 ground=.75 tone=0.4 jag=.1 body=.7 eyes=.4 company=.2 travel=.4 penumbra=0.45 | slap | ostinato | Hollow nasal knocks in a row
Crickets in a tin | Needle flutter | attack=.004 decay=4 sustain=.05 release=3 repeats=7 travel=.88 ground=.6 tone=0.58 jag=.3 eyes=1 height=.7 company=.3 parallax=.2 volume=1 | tin | rain | Small nasal plucks with a chirr high above
Larch comb | Needle flutter | attack=.004 decay=8 sustain=0 release=6 far=Cliffs repeats=2 travel=.45 ground=.5 tone=0.76 jag=.4 company=.6 body=.4 eyes=.9 vibrato=.1 penumbra=0.3 sun=0.2 | airwide | twohands | Nasal strings in threes, cliffs rising wide in the fall
Thumbs on iron | Dune bass | attack=.004 decay=.9 sustain=0 release=.7 far=Hills repeats=3 ground=.7 tone=0.76 glow=.7 eyes=.4 body=.6 height=.45 company=.05 jag=0 | smallplate | hocket | Round tines with a hill shining over each
Marimba of wet logs | Dune bass | attack=.005 decay=.5 sustain=0 release=.4 far=Hills repeats=1 ground=.95 tone=.4 glow=.5 body=.95 eyes=.3 wind=.2 travel=.4 parallax=0.8 sun=0 jag=0 | room | ostinato | Round wooden drops with a soft knock in them
Pebbles in a bowl | Dune bass | attack=.004 decay=.4 sustain=0 release=.5 far=Cliffs repeats=6 ground=.8 tone=0.98 travel=.5 eyes=.8 height=.75 glow=.8 parallax=0 sun=0.12 jag=0.04 volume=3 | pebble | rain | Tiny round drops, a bright chip off each
Slides in a projector | Dune bass | attack=.006 decay=1.8 sustain=0 release=1.5 far=Pines repeats=5 travel=0.44 ground=.7 tone=0.72 eyes=.95 penumbra=0.15 company=.35 height=.7 parallax=0 sun=0.26 jag=0 body=0.6 near=Cliffs | leaves | twohands | Bright plucks that flicker as they fade, wide
Rain barrel lid | Dune bass | attack=.004 decay=.7 sustain=.1 release=.9 far=Hills repeats=2 sun=.8 ground=.6 tone=0.46 jag=.3 wind=.4 eyes=.5 body=.4 parallax=0.25 | pot | rain | Hollow round drops with a little breath
Semaphore at dusk | Tower pluck | decay=.7 release=.5 far=Pines repeats=2 travel=.5 ground=.75 tone=0.58 eyes=.4 company=.1 height=.35 parallax=0.1 penumbra=0.04 sun=0.2 jag=0.4 body=0.75 volume=3 | dotted | hocket | Short hollow signals, needles inside
Letters by carrier | Tower pluck | near=Cliffs decay=1.3 release=.9 repeats=3 ground=.6 tone=0.76 travel=.38 eyes=.6 body=.6 glow=.6 parallax=0.1 penumbra=0.08 sun=0 jag=0 volume=4 | wornecho | rain | Bright plucks going out over the roofs
Answer from the mill | Tower pluck | near=Hills decay=1 release=.7 far=Hills repeats=5 parallax=.8 ground=.65 tone=0.4 eyes=.8 height=.6 wind=.2 penumbra=0.3 sun=0.16 jag=0.04 body=0.1 | answered | rain | Round plucks, two small hills crossing in them
Skipped slate | Tower pluck | near=Pines decay=5 release=3 repeats=2 ground=.7 tone=0.74 travel=.35 eyes=.5 jag=.3 height=.3 company=0 parallax=0.3 sun=0.12 body=0 | rings | hocket | Dry nasal plucks thrown flat
Sevenfold gate | Tower pluck | decay=1.6 release=1 repeats=6 travel=.42 ground=.8 tone=0.52 company=.4 eyes=1 height=.8 vibrato=.15 parallax=0.5 sun=0 jag=0.18 | fan | twohands | Dark hollow plucks under a high cliff that climbs
Strings left humming | Tower pluck | far=Hills decay=1.5 sustain=.35 release=3.5 repeats=2 ground=.6 tone=0.78 company=.5 eyes=.8 wind=.3 travel=.35 vibrato=.2 parallax=1 penumbra=0.35 sun=0 jag=0.4 body=0.75 | undertow | gather | A hollow pluck that stays on as a breathing pad | keys
Psaltery in wax | Bowed cliffs | attack=.004 decay=2 sustain=.2 release=3 penumbra=.6 ground=.7 tone=0.5 company=.65 eyes=.7 height=.6 glow=.4 vibrato=.15 body=.5 parallax=0.55 jag=0 volume=-1 | woolhaze | twohands | Soft stone strings with a held glow under them
Sugar cooling | Winter bells | near=Hills decay=1.2 sustain=.15 release=2.5 far=Hills repeats=4 ground=.65 tone=0.66 company=.3 eyes=.6 height=.75 penumbra=.35 parallax=0.6 sun=0.2 | softsag | rain | Round drops that leave a thin held gleam
Cobweb after the pluck | Felt keys | near=Towers attack=.004 decay=.8 sustain=.2 release=4 far=Hills repeats=3 travel=.28 ground=.5 tone=0.46 company=.4 eyes=.9 height=.5 wind=.35 parallax=0.9 sun=0.26 jag=0 volume=1.5 | hanging | gather | A soft hollow touch, then a thread of it held in the air
Boat knocks, water stays | Dune bass | attack=.005 decay=.9 sustain=.3 release=3 near=Cliffs far=Hills repeats=1 ground=.8 tone=0.34 company=.35 eyes=.6 wind=.5 travel=.25 parallax=0.55 jag=0 body=0.6 | shallows | twohands | A dark knock and the soft breath left after it
Startled sparrows | Needle flutter | near=Hills attack=.004 decay=1 sustain=0 release=.8 travel=.82 repeats=4 ground=.7 tone=0.5 jag=.2 eyes=.95 company=.2 parallax=.8 penumbra=0.1 sun=0.12 glow=0.2 body=0.2 volume=0.5 | panned | hocket | Round plucks with wings beating in them
Film in the gate | Needle flutter | near=Towers attack=.004 decay=.7 sustain=0 release=.6 travel=1 repeats=2 ground=.6 tone=0.7 jag=.5 eyes=.5 height=.75 body=.4 glow=0.5 volume=1.5 | platter | ostinato | Hollow plucks, whirring as they go
Shiver of the gate chain | Needle flutter | near=Cliffs attack=.004 decay=1.8 sustain=0 release=1.2 travel=.9 far=Cliffs repeats=3 ground=.65 tone=0.64 parallax=1 eyes=.8 jag=.6 height=.55 penumbra=0.05 sun=0 glow=0.7 body=0.5 volume=1 | shells | rain | Bright links shaken twice a second
Light through spokes | Winter bells | near=Cliffs decay=1.4 sustain=0 release=1 travel=.76 repeats=2 ground=.65 tone=0.4 eyes=.7 sun=0.55 company=.45 height=.5 parallax=0.9 penumbra=0.45 volume=1 | ripple | twohands | Half hollow plucks cut by quick low needles
Humming top | Dune bass | attack=.004 decay=2.2 sustain=.1 release=1.2 near=Towers far=Hills travel=.85 repeats=2 ground=.6 tone=0.68 eyes=.6 vibrato=.35 company=.1 penumbra=.35 sun=0.16 body=0.1 volume=0.5 | wobble | rain | Hollow plucks in which a hill spins fast
Zither by the window | Tower pluck | near=Cliffs company=.8 decay=2 release=1.2 ground=.55 tone=0.52 far=Hills repeats=1 height=.3 eyes=.65 travel=.2 body=.5 penumbra=0.35 sun=0.16 jag=0 | doubled | twohands | Three wires to a note, all a little out
Wedding zither, rainy | Tower pluck | near=Pines company=1 decay=7 release=5 ground=.65 tone=0.86 repeats=3 eyes=1 jag=.2 travel=.34 height=.45 vibrato=.2 parallax=0.55 penumbra=0.1 sun=0 body=0 | rain | ostinato | Nasal wires in threes, sour and wide
Hammered in the square | Tower pluck | company=.7 decay=1.1 release=1.4 ground=0.7 tone=0.62 far=Pines repeats=4 travel=.55 eyes=.7 glow=.3 wind=0.2 height=.3 parallax=0.25 jag=0.32 near=Cliffs | brightbox | ostinato | Bright wires struck hard, three to a key, needles around them
Loose courses | Bowed cliffs | attack=.004 decay=1.4 sustain=0 release=.8 company=.95 ground=.75 tone=0.54 sun=.65 vibrato=.1 far=Cliffs repeats=2 eyes=.9 jag=.15 body=.7 parallax=0.2 penumbra=0.04 glow=0.85 volume=3 | tapefloor | hocket | Hollow strings in wide courses, a step of cliff behind
Felt bars on wires | Felt keys | company=.75 attack=.004 decay=1.6 sustain=0 release=1.2 tone=0.38 ground=0.7 penumbra=0.5 far=Pines repeats=1 travel=.4 eyes=.75 glow=.4 parallax=0.6 sun=0.26 jag=0.04 volume=0 | folded | gather | Soft wires in threes with needles behind the felt
Box of drawers | Tower pluck | body=1 decay=.5 release=.3 far=Hills repeats=1 ground=.8 tone=0.48 eyes=.2 wind=.5 height=.4 glow=.7 travel=.3 parallax=0 penumbra=0.45 sun=0.12 jag=0.18 | darkbox | hocket | Hollow knocks with a hill in the wood
Knuckles on the lid | Dune bass | attack=0.01 decay=0.95 sustain=0 release=0.4 near=Cliffs far=Cliffs repeats=2 body=1 ground=.7 tone=0.5 wind=.6 jag=.5 eyes=.4 glow=0.7 parallax=0.55 sun=0 volume=-1 | strap | crest | Short woody raps on dark stone
Marbles on the stair | Felt keys | near=Hills attack=.004 decay=.45 sustain=0 release=.4 far=Cliffs repeats=4 body=.8 ground=.75 tone=0.74 travel=.46 eyes=.5 penumbra=.1 parallax=0.3 sun=0.2 volume=5 | bottle | rain | Round chips that click and roll a little
Broom straw lute | Needle flutter | attack=.004 decay=6 sustain=0 release=3 body=1 wind=0.6 ground=.75 tone=0.56 far=Hills repeats=1 travel=.3 jag=.5 company=.15 eyes=.3 penumbra=0.3 sun=0.16 | feltair | twohands | Nasal straw and a good deal of air
Ship's biscuit tin | Winter bells | decay=1.2 release=.4 far=Cliffs repeats=3 body=.7 ground=.7 tone=0.76 eyes=.4 jag=0.8 company=.2 travel=.35 parallax=0.5 sun=0 volume=1.5 | musicbox | ostinato | Hollow tinny plucks, rough inside
Giant's harp, low end | Tower pluck | decay=2 release=1.4 near=Hills far=Cliffs repeats=2 ground=.8 tone=0.44 company=.2 eyes=.5 body=.7 travel=.38 height=.5 parallax=0.1 penumbra=0.3 sun=0.26 jag=0 volume=3 | giant 2.lowCut=30 | dune | Deep round strings, a cliff opening in each
Swans pulling wire | Tower pluck | near=Cliffs decay=1.7 release=1.6 repeats=2 far=Pines ground=.6 tone=0.5 travel=.44 eyes=.9 company=.3 wind=.45 height=.4 penumbra=0.35 sun=0.12 jag=0.25 body=0.1 volume=3.5 | softcloud | gather | Breathy strings with needles beating past
Ice in the rigging | Winter bells | decay=.6 release=1.5 repeats=8 travel=.5 ground=.6 tone=.44 eyes=1 jag=.2 height=.7 penumbra=0.1 sun=0 volume=3.5 | crystals | rain | Hollow tips, high needles ringing off them
Rust on the rake | Tower pluck | near=Pines far=Cliffs decay=3 release=2 ground=.7 tone=0.58 jag=.8 repeats=1 travel=.5 sun=0.5 eyes=.3 company=.1 parallax=0 body=0.75 volume=4 | dustbits | hocket | Scraped nasal plucks, half hollow
Paper boat, second fold | Dune bass | attack=.008 decay=1 sustain=.05 release=1.6 far=Hills repeats=2 ground=.65 tone=.42 penumbra=.7 wind=.65 eyes=.8 company=.25 height=.8 parallax=0.1 sun=0.2 jag=0 volume=2 | backwards | gather | Soft round plucks, folded out of air
`,
    },
    {
      id: 'pine-strings',
      name: 'Pine strings',
      category: 'string',
      rows: `
Plantation in rows | Pine strings | tone=.68 jag=.3 attack=.5 release=6 travel=.35 eyes=.7 vibrato=.3 wind=.25 body=.5 height=.3 parallax=0.2 penumbra=0.45 sun=0.26 glow=0.7 | ends | quartet | A dense nasal section, cliffs stirring behind it
Deadfall | Pine strings | tone=.44 ground=.8 jag=.6 company=.7 attack=.9 release=8 far=Hills wind=.6 vibrato=.15 eyes=.5 height=.5 parallax=0.8 penumbra=0.04 sun=0.12 body=0.2 | deepfog | lament | Dark grainy section lying on its ground
Snow slides off a branch | Pine strings | far=Pines tone=0.5 attack=.2 decay=12 sustain=.5 release=5 travel=.55 repeats=4 ground=.55 company=.5 jag=.1 eyes=1 parallax=1 penumbra=0.1 sun=0.16 body=0.5 volume=-3 | majorkeys | quartet | The section leans in and lets go, needles scattering
Stone pine in wind | Pine strings | tone=0.64 wind=0.75 company=.6 vibrato=.6 ground=.5 attack=.6 release=7 travel=.4 sun=0.5 eyes=.85 body=.2 parallax=0.55 jag=0.25 | breeze | window | Nasal, half hollow, nearly as much air as string
Resin amber | Pine strings | tone=0.36 ground=.9 jag=.05 company=.95 attack=.7 vibrato=.4 wind=.1 far=Hills repeats=1 travel=.22 penumbra=.5 eyes=.6 release=6 parallax=0.55 sun=0.2 glow=0.2 body=0.6 | warm | quartet | Broad and dark, low hills glowing through
Quartet, shutters closed | Bowed cliffs | company=.22 wind=.5 vibrato=.35 attack=.12 sustain=.8 release=.5 body=.85 tone=0.66 ground=.6 travel=.24 height=.25 eyes=.45 jag=.1 parallax=0 penumbra=0.45 sun=0 glow=0.1 decay=7 | booth | quartet | Four close bows in a small wooden space
Two violas and dust | Bowed cliffs | company=.3 wind=.7 tone=0.5 ground=.7 jag=.35 attack=.2 release=.9 far=Hills repeats=1 body=.95 vibrato=.2 eyes=.3 sustain=.7 parallax=0.1 penumbra=0.35 sun=0 glow=0 decay=1.2 | dusty | lament | Dry low bows, more hair than tone
Bows near the bridge | Bowed cliffs | company=.2 ground=0.58 tone=0.56 jag=.45 attack=.06 sustain=.9 release=.6 travel=.45 repeats=3 height=.5 vibrato=.1 eyes=.6 wind=.35 parallax=1 penumbra=0.08 sun=0 glow=0.85 body=0 decay=12 | shorthalo | quartet | Glassy, edged bows without vibrato
Sordino in the study | Bowed cliffs | company=.35 tone=.36 ground=.75 penumbra=.4 attack=.25 release=1.2 body=.6 wind=.3 vibrato=.25 eyes=.5 height=.4 glow=.5 parallax=0.25 sun=0.12 jag=0.4 decay=4.5 | shaded | quartet | Muted bows that open a little as they swell
Last desk, long bows | Bowed cliffs | company=.5 attack=.5 sustain=1 release=2 tone=.64 travel=.3 parallax=.66 repeats=2 eyes=.8 vibrato=.45 ground=.5 wind=.2 body=.4 sun=0.26 jag=0 glow=0.6 | leaning | junction | Slow wide bows, one hill moving, one standing
Violas under larch | Slow train | tone=0.82 wind=.6 attack=.4 release=1.2 company=.6 vibrato=.4 height=.35 body=.8 jag=.2 ground=.6 travel=.3 sun=.1 eyes=.6 parallax=0.8 penumbra=0.04 glow=0.5 decay=1.2 | silentkeys | quartet | Round bowed tone with a brush of needles
Gauze over the strings | Slow train | tone=0.4 penumbra=0.95 attack=.8 release=2.4 company=.85 wind=.5 ground=.5 far=Cliffs repeats=1 height=.6 travel=.36 eyes=.8 vibrato=.2 jag=0.04 body=0.5 decay=1.8 | veil | lament | Soft wide bows seen through cloth, cliffs swelling faintly
Walnut and horsehair | Slow train | far=Hills tone=0.76 attack=.14 sustain=.75 release=.6 company=.15 body=1 wind=.75 vibrato=.5 ground=.7 sun=.4 eyes=.3 repeats=1 penumbra=0.12 glow=0 decay=12 | tubed | edge | A round viola, reedy at the edge
Mountain waltz, far off | Slow train | tone=0.82 attack=.1 decay=2 sustain=.5 release=.7 company=.4 wind=.35 repeats=3 travel=.5 vibrato=.35 ground=.55 eyes=.5 height=.5 jag=.3 parallax=0.6 penumbra=0.3 glow=0.7 body=0.75 | nextdoor 1.distance=.8 | sixths | Round bows that step back, needles in their start
Shade of one fir | Slow train | near=Hills far=Pines tone=.4 attack=1.1 sustain=1 release=3 company=.3 wind=.2 vibrato=0 ground=.8 travel=.14 height=.7 eyes=.4 body=.5 penumbra=0.3 | darkhall 1.mix=.22 | window | Plain dark strings with no waver, needles nearly still
Flautando at the pass | Bowed cliffs | near=Hills ground=.5 wind=.85 penumbra=.4 tone=0.4 attack=.5 release=1.8 company=.4 vibrato=.1 height=.3 eyes=.7 travel=.2 body=.3 parallax=0.9 sun=0.16 jag=0 decay=7 | openair | quartet | A light bow, mostly air and a round tone
Harmonics on ice | High pass train | near=Cliffs far=Hills repeats=5 ground=0.6 height=0.65 wind=0.35 attack=.35 release=2 tone=0.4 company=.3 travel=.15 jag=0 eyes=.6 sun=0.2 body=0.2 decay=4.5 volume=-4 vibrato=0 | cathedral | longline | Bowed whistles, light in the note
Bow without rosin | Wind on stone | near=Pines attack=.4 release=6 ground=0.6 tone=0.52 wind=0.55 company=.45 jag=.2 travel=.2 decay=12 vibrato=.1 height=.2 eyes=.7 glow=0.6 body=0.6 | emptyroom | lament | Pale nasal strings, the bow slipping
Ghost of a section | Pine strings | ground=0 height=0.6 far=Hills repeats=3 tone=0.44 attack=.8 release=7 company=.75 vibrato=.3 wind=0.3 travel=.28 eyes=.95 jag=.1 penumbra=0.04 sun=0 glow=0.2 volume=-4 | faraway | window | Overtones of a section with no ground under them
Bow hair on slate | Wind on stone | near=Cliffs ground=0.35 tone=0.5 attack=.15 release=1.2 wind=0.85 jag=0.2 company=.25 travel=.5 body=.8 vibrato=.2 eyes=.5 penumbra=.3 parallax=0.55 sun=0.26 glow=0.85 decay=4.5 | paper | quartet | The bow's hair on stone and hardly any string
Tremolo behind glass | Needle flutter | near=Cliffs attack=.25 sustain=.95 release=1.2 travel=.82 repeats=2 company=.6 wind=.4 tone=0.5 ground=.6 eyes=.7 body=.5 vibrato=.1 sun=0.2 glow=0.1 | behindglass | quartet | Shivering bows with low needles beating fast
Aspen strings | Needle flutter | near=Pines attack=.3 decay=12 sustain=1 release=5 travel=.72 repeats=6 company=.5 tone=0.44 ground=0.7 wind=.3 parallax=.3 eyes=1 jag=.15 sun=0 glow=0.5 body=0.1 | leaves | window | Nasal bows with leaves turning over in them
Moths in the cello | Needle flutter | near=Hills attack=.4 sustain=.9 release=1.6 travel=.92 repeats=2 height=.65 tone=0.52 ground=.8 body=.9 company=.3 wind=.5 eyes=.5 jag=.3 penumbra=0.75 sun=0.12 glow=0.85 decay=7 | vowelled | lament | Round low strings with a fast soft beating inside
Snow on the wire | Needle flutter | near=Cliffs far=Hills attack=.6 sustain=1 release=2.4 travel=.8 repeats=5 height=.7 tone=0.64 ground=.5 company=.7 penumbra=.4 eyes=.9 wind=.15 jag=0 sun=0.16 glow=0.5 body=0.6 | sheen | quartet | Bright strings under a trembling small hill
Trembling ladder | Climbing swells | near=Pines attack=.2 decay=10 release=4 travel=.75 repeats=2 tone=0.66 ground=.6 company=.55 eyes=.8 vibrato=.3 height=.7 jag=.35 wind=.3 penumbra=0.35 glow=0.1 body=0 volume=-0.5 | harmonic | quartet | Nasal strings hauled up and dropped over and over
Crescendo of the ridge | Climbing swells | near=Cliffs repeats=2 attack=1.2 tone=.66 travel=.28 company=.7 vibrato=.35 wind=.35 release=3.5 ground=.6 parallax=.1 eyes=.7 penumbra=0.05 jag=0.32 glow=0.2 | nave | vigil | A section on bright cliffs that takes seven seconds to climb
Wave after wave | Climbing swells | near=Pines repeats=1 attack=.6 decay=12 release=6 tone=0.42 travel=.46 company=.8 wind=.4 ground=.7 eyes=.6 vibrato=.2 jag=.2 body=0.75 | surf | window | Dark nasal strings heaved up by low cliffs
Opening the barn | Climbing swells | near=Hills repeats=4 attack=.4 tone=0.8 travel=.34 company=.4 parallax=.85 wind=.5 release=1.8 ground=.5 body=.8 eyes=.8 glow=.7 penumbra=0.1 jag=0 | bloomfilter | quartet | Round strings opening and closing in two directions
Breath before the tune | Climbing swells | near=Cliffs repeats=3 attack=1.8 sustain=.7 decay=4 tone=0.6 travel=.4 company=.2 wind=.7 release=1.5 ground=0.6 sun=.5 eyes=.4 jag=0.25 body=0.5 | chamber | gather | A few reedy bows, late and breathing
Avalanche fence | Climbing swells | near=Pines repeats=6 attack=.3 decay=14 release=5 tone=0.8 travel=.5 company=.6 jag=.7 ground=.65 parallax=.5 eyes=1 wind=.2 height=.9 penumbra=0.08 glow=0 body=0.2 | longrise | gather | Rough strings, a high climb breaking off every two seconds
Splintered section | Pine strings | jag=1 ground=.5 tone=0.6 attack=.15 decay=8 sustain=.8 release=4 travel=.5 company=.4 wind=.3 vibrato=.2 height=0.7 eyes=.7 parallax=0.2 penumbra=0 glow=0.7 body=0.85 repeats=5 | howls | quartet | Every bow on rough wood, cliffs tearing through
Nails in the plank | Pine strings | far=Pines jag=.8 ground=0.6 tone=0.56 attack=.05 decay=8 sustain=0.3 release=2.5 travel=.62 repeats=4 company=.15 vibrato=0 body=.9 eyes=.4 parallax=0.1 penumbra=0 sun=0 glow=0.6 volume=-2.5 | kettle | ostinato | Hard rough bows with needles rattling
Barbed edge | Bowed cliffs | jag=.95 penumbra=0 sun=.25 ground=.65 tone=0.62 attack=.1 sustain=.9 release=.8 company=.3 travel=.38 wind=.6 repeats=2 vibrato=.1 eyes=.5 parallax=0.8 glow=0.1 body=0.1 decay=12 | grit | lament | Sharp torn strings with much hair in the bow
Old rope strings | Slow train | near=Pines jag=.7 sun=.5 ground=.8 tone=0.4 attack=.2 decay=9 release=3 company=.6 wind=.5 travel=.3 body=1 eyes=.4 vibrato=.3 parallax=1 | wornthin | lament | Hollow hemp strings, frayed and many
Grain of the sleeper | Wind on stone | near=Pines jag=0.5 ground=.8 tone=0.58 attack=.5 decay=10 sustain=.8 release=4 company=.3 wind=0.25 far=Cliffs travel=.4 repeats=3 eyes=.9 body=.7 parallax=0.5 sun=0.12 | longplate | window | Coarse nasal strings with cliffs climbing in them
Cellos at the sawmill | Bowed cliffs | tone=0.46 ground=.8 attack=.2 release=.9 company=.45 wind=.55 body=.85 jag=.3 vibrato=.3 far=Cliffs repeats=1 travel=.4 eyes=.4 height=.5 penumbra=0.45 sun=0.16 decay=1.2 | iron | lament | Low bows, a deep cliff lifting each
Six basses in a tunnel | Pine strings | tone=.38 ground=.95 attack=.35 release=5 company=.6 far=Hills repeats=1 wind=.35 vibrato=.2 jag=.4 body=.7 eyes=.3 height=.55 sun=0.26 | stairwell | deep | Nasal and very low, rough in the bow | bass
Coffin maker's cello | Bowed cliffs | tone=0.64 ground=.7 attack=.1 release=.6 company=0 wind=.6 body=1 vibrato=.55 sun=0.75 height=.3 travel=.24 eyes=.15 jag=.15 parallax=0 glow=0.85 decay=1.8 volume=-1 repeats=4 | darkbox | reedline | One low bow, half hollow
Roots hold the bank | Slow train | far=Cliffs repeats=1 tone=.42 ground=.9 attack=.7 release=2 company=.8 wind=.4 body=.6 travel=.3 height=.8 eyes=.7 vibrato=.1 jag=.1 parallax=0 penumbra=0.35 decay=4.5 | undertow | deep | Wide low strings rising and sinking on one step | bass
Low fiddle, high snow | Bowed cliffs | tone=0.76 ground=.85 repeats=7 height=.8 attack=.3 release=1.6 company=.25 wind=.3 travel=.3 eyes=1 body=.8 vibrato=.2 parallax=.8 sun=0.2 jag=0.18 glow=0 decay=1.8 | octhalo | lament | Low bows with a thin hill whistling far over them
String machine at rest | Slow train | near=Cliffs company=1 attack=.18 sustain=1 release=1.4 tone=0.7 ground=.5 wind=0 vibrato=0 far=Hills height=.3 travel=.3 body=0 eyes=1 jag=0 parallax=0.25 penumbra=0.05 glow=0.2 | ensemble | window | Plain bright waves in wide threes, no air and no box
Ballroom on tape | Bowed cliffs | company=.8 attack=.3 sustain=.9 release=1.6 tone=0.54 ground=.6 vibrato=.65 wind=.1 eyes=.9 body=.3 sun=.15 repeats=1 travel=.3 penumbra=0.3 decay=7 | cassette | junction | A sweet wide section with a deep waver
Matinee curtain | Slow train | near=Cliffs company=.9 attack=.5 sustain=.9 release=2 tone=0.58 vibrato=.5 wind=.2 penumbra=.3 ground=.7 height=.4 travel=.25 eyes=.8 jag=.1 parallax=0.9 glow=0.7 decay=12 | platter | lament | Velvet strings, close together and slow to part
Lift going up, empty | Pine strings | company=1 far=Hills tone=0.72 attack=.6 release=5 wind=.05 vibrato=.2 ground=.6 travel=.2 jag=0 eyes=1 body=.1 repeats=3 height=.4 parallax=0.6 penumbra=0.04 sun=0 glow=0.5 volume=-4.5 | cloudtune | window | Smooth nasal strings, as wide as they go
Roll of film ends | Bowed cliffs | company=.65 near=Pines attack=.2 decay=8 sustain=.7 release=3 tone=0.64 vibrato=.8 ground=.65 wind=.25 travel=.3 eyes=.6 sun=.3 height=.35 jag=0.18 | seatape | quartet | Nasal strings that shake more than they should
Short bows in the attic | Bowed cliffs | attack=.012 decay=.7 sustain=.05 release=.35 company=.4 tone=.64 ground=.6 wind=.5 body=.7 vibrato=0 glow=.6 eyes=.6 repeats=2 parallax=1 sun=0 volume=2 | parlour | hocket | Bows that touch the string and lift
Spring ice, spiccato | Pine strings | attack=.01 decay=2 sustain=0 release=2 company=.5 tone=0.6 vibrato=0 jag=.25 ground=.7 far=Hills eyes=.7 travel=.3 wind=.6 parallax=0.6 penumbra=0.1 sun=0.26 glow=0.6 volume=-1 | brightbox | ostinato | Bouncing nasal bows
Plucked by second desks | Pine strings | attack=.004 decay=3.5 sustain=0 release=3 company=.6 tone=0.4 vibrato=0 jag=.1 ground=.85 far=Cliffs repeats=1 body=.9 eyes=.6 wind=.2 parallax=0.3 penumbra=0.45 sun=0 volume=-2 | afterglow | twohands | A section putting down its bows to pluck | plucked
Bow and then nothing | Bowed cliffs | attack=.08 decay=1.6 sustain=.1 release=1.2 company=.5 tone=0.7 vibrato=.2 ground=.55 wind=.6 repeats=4 travel=.44 eyes=.8 glow=.7 height=.6 parallax=0.1 penumbra=0.04 sun=0 jag=0.32 body=0.5 volume=4.5 | backwards | rain | Accents that die away at once into a small whistle
Echoing pines | Pine strings | attack=.05 decay=4 sustain=.25 release=3 company=.35 tone=0.56 vibrato=.15 ground=.7 far=Cliffs repeats=5 travel=.4 eyes=.9 jag=.3 wind=.35 parallax=0.1 penumbra=0.1 glow=0.85 volume=-1.5 | fifthcloud | sixths | Nasal bows that fall back as cliffs climb high above
`,
    },
    {
      id: 'ridge-voices',
      name: 'Ridge voices',
      category: 'voice',
      rows: `
Choir behind the col | Fifth voices | ground=0.4 travel=.34 attack=.7 release=2 company=.7 tone=0.5 vibrato=.3 eyes=.8 body=.4 height=.85 sun=0.35 jag=0.25 glow=0 decay=1.2 repeats=3 | cathedral | junction | Two rows of hills sing over a little ground
Morning names | Fifth voices | ground=.5 travel=.42 repeats=1 attack=.2 release=.8 company=.3 tone=0.4 wind=.3 eyes=.4 height=.9 parallax=.4 sun=0.2 jag=0 glow=0.2 decay=4.5 | roomcopies | psalm | A close open vowel turning darker and lighter
Voices on either bank | Fifth voices | parallax=1 eyes=1 ground=.2 travel=.45 attack=.5 release=1.8 company=.2 tone=0.72 repeats=3 height=.95 vibrato=.2 sun=0.16 jag=0.4 glow=0.5 decay=12 volume=-1 | sides | psalm | Two vowels pass each other, one for each ear
Sung into a wall | Fifth voices | ground=.6 travel=.26 attack=.3 release=.6 company=.4 tone=.44 penumbra=.5 eyes=.15 body=.9 height=.8 wind=.2 sun=0.26 jag=0.32 glow=0.1 decay=1.8 volume=-2.5 | acrossroom | reedline | Boxy dark vowels that hardly open
Everyone but the basses | Fifth voices | ground=.15 repeats=4 travel=0.4 attack=1.2 release=3 company=.95 tone=0.72 wind=.35 eyes=.9 jag=.15 parallax=0.2 vibrato=.15 sun=0.2 glow=0.6 decay=1.2 height=0.8 | queasy | gather | A broad bright choir with next to no ground under it
Woman at the ford | Fifth voices | company=0 ground=.65 attack=.08 release=.6 vibrato=.55 tone=0.44 travel=.28 repeats=2 height=.65 eyes=.2 wind=.25 body=.5 sun=0 decay=7 volume=-1.5 | darktrail | kite | One voice, a waver that comes late
Herd boy calls | Fifth voices | company=0 ground=.5 attack=.02 release=.3 vibrato=.2 tone=0.82 travel=.5 repeats=3 height=.7 eyes=.3 wind=.1 body=.2 sustain=.8 glow=0.7 decay=1.2 volume=-2 | fifthhop | kite | A high plain call, its vowel sliding open
Song for a cradle | Fifth voices | company=.1 ground=.8 attack=.15 release=1.2 vibrato=.35 tone=.4 travel=.2 repeats=1 height=.6 eyes=.3 wind=.5 penumbra=.6 sun=0 jag=0.04 glow=0.5 decay=4.5 | blanket | edge | A low soft vowel with much breath, barely moving
Last verse, no organ | Fifth voices | near=Cliffs company=0 ground=.55 attack=.12 release=.9 vibrato=.7 tone=0.36 travel=.24 height=.75 sun=.3 eyes=.2 wind=.4 body=.7 glow=0 decay=12 volume=-0.5 far=Cliffs repeats=1 | darkecho | edge | A worn voice, darker than its vowels
Tin roof gospel | Fifth voices | company=.2 ground=.6 attack=.04 release=.4 vibrato=.8 tone=.64 travel=.36 repeats=4 height=.6 jag=0.38 eyes=.5 wind=.2 sun=0.12 glow=0.85 decay=7 | wornecho | kite | A bright shaken voice, rough at the top
Monks under the pass | Fifth voices | ground=.75 repeats=3 travel=.24 attack=.4 release=1.6 company=.6 tone=.42 vibrato=.05 body=.8 eyes=.5 sun=.3 height=.8 glow=0.1 decay=1.8 volume=-0.5 | stairwell | longline | Low even voices with a small vowel moving on top
Herder's low throat | Reed evening | near=Cliffs far=Hills sun=.5 repeats=6 height=.85 travel=.26 ground=.6 attack=.1 release=.5 wind=.2 tone=0.44 vibrato=0 company=.1 eyes=.3 penumbra=0.35 jag=0 decay=4.5 | whistled | deep | A hollow low reed with a whistle sliding along its overtones | drone
Crypt, third psalm | Fifth voices | near=Cliffs ground=.7 repeats=2 travel=.2 attack=.5 release=2.2 company=.75 tone=0.5 wind=.35 body=.6 eyes=.6 penumbra=.4 vibrato=0 jag=0 glow=0.2 decay=1.8 sun=0.55 | monks | lament | Dark straight voices close to their ground
Bell ringers hum | Fifth voices | near=Towers ground=.8 repeats=1 travel=.32 attack=.25 release=1 company=.5 tone=.36 body=.9 eyes=.3 height=.85 wind=.15 vibrato=.1 jag=0.18 glow=0.7 decay=12 | smalldark | reedline | Hollow shut voices, a dark vowel rolling
Well diggers' round | Fifth voices | far=Cliffs ground=.65 repeats=1 travel=.36 attack=.2 release=.8 company=.45 tone=0.48 jag=.2 eyes=.4 body=.7 sun=.2 height=.75 glow=0.6 decay=1.2 volume=-1.5 | answered | reedline | Low voices that heave on each note
Children on the terrace | Fifth voices | repeats=4 ground=0.62 travel=.32 attack=.15 release=.7 company=.55 tone=0.6 vibrato=.1 eyes=.8 body=.1 wind=.3 height=0.65 sun=0.16 jag=0.15 glow=0.85 decay=7 volume=0.5 | summer | peal | Small high vowels, many and not quite together
Choirboys in wet coats | Fifth voices | repeats=5 ground=.55 travel=.22 attack=.3 release=1.5 company=.3 tone=0.78 vibrato=.05 eyes=.5 wind=.2 height=.65 sun=.15 body=.35 glow=0 decay=1.8 | late | junction | Straight clear voices with one thin vowel
Rhyme for a rope game | Fifth voices | repeats=3 ground=.5 travel=.6 attack=.015 decay=1.2 sustain=.4 release=.4 company=.25 tone=0.8 vibrato=0 eyes=.6 wind=.15 height=.8 sun=0 glow=0.5 volume=-2.5 | slap | hocket | Short bright syllables, each with another vowel
Echo at the bathing lake | Fifth voices | repeats=6 ground=.6 travel=.4 attack=.05 release=1 company=.4 tone=0.8 eyes=.9 height=.9 parallax=.3 vibrato=.25 sun=0.26 jag=0.25 glow=0.1 decay=4.5 | cleanecho | peal | Small bright vowels, very wide, rising and sinking
Lost balloon | Fifth voices | repeats=7 ground=0.6 travel=.28 attack=.6 release=2.5 company=.1 tone=0.36 vibrato=.4 eyes=.7 wind=0.3 height=0.65 penumbra=.4 sun=0.2 jag=0 glow=0.2 decay=12 volume=-0.5 | thinair | longline | A pale high voice with a thin whistle over it
Whisper at the grille | Fifth voices | wind=1 ground=.15 attack=.2 release=1 company=.2 tone=0.32 travel=.4 eyes=.6 vibrato=0 body=.5 height=.7 repeats=2 jag=0.32 glow=0.6 decay=7 | booth | psalm | Nearly all breath, vowels shaped out of it
Rumour in the nave | Wind on stone | near=Hills far=Hills height=.9 repeats=3 attack=.5 release=3 ground=0 wind=0.75 tone=0.38 jag=.2 travel=.44 vibrato=0 eyes=1 sun=0.16 glow=0.7 decay=1.2 | nave 1.mix=.22 | gather | Wide whispers that shift from vowel to vowel
Cold breath, two people | Wind on stone | near=Hills far=Hills height=.8 repeats=1 attack=.1 release=.7 ground=.45 company=.4 wind=.75 tone=0.5 jag=.05 travel=.36 parallax=1 eyes=.9 sun=0.12 glow=0.6 decay=1.2 | twoclose | psalm | Soft breathy ahs that cross
Wordless radio play | Fifth voices | wind=.8 near=Pines ground=.5 attack=.06 decay=8 sustain=.8 release=1.4 company=.1 tone=0.6 travel=.5 jag=.3 eyes=.3 height=.75 vibrato=.2 volume=0.5 | shortwave | edge | Nasal breath and quick vowels
Sleeper by the wall | Fifth voices | wind=.95 ground=.6 attack=.9 release=1.6 company=0 tone=.3 travel=.16 repeats=1 eyes=.2 body=.7 penumbra=.7 vibrato=0 height=.5 sun=0 jag=0.25 glow=0 decay=7 | nextdoor | lament | Slow dark breath with a low note inside
Yodel across the gorge | Climbing swells | near=Hills company=.05 attack=.03 release=.4 repeats=2 travel=.58 ground=.65 tone=0.5 vibrato=.1 eyes=.4 height=.85 wind=.1 penumbra=0.45 jag=0.04 glow=0.5 | valley | kite | A round call that breaks upwards every second and a half
Women raking hay | Climbing swells | near=Hills repeats=3 company=.6 attack=.25 release=1 travel=.46 ground=.5 tone=0.7 vibrato=.3 eyes=.8 wind=.35 body=.4 parallax=.5 penumbra=0.3 jag=0.4 glow=0.1 volume=-2 | acrossroom | tenths | Voices that lift together and let their vowel fall
Procession climbs | Climbing swells | near=Cliffs repeats=1 company=.75 attack=.8 release=2.5 travel=.32 ground=.6 tone=0.76 vibrato=.15 eyes=.7 sun=.35 wind=.2 penumbra=0.45 jag=0.18 glow=0.7 | ahs | lament | Reedy voices mounting slowly, step by step
Siren of the weir | Climbing swells | near=Hills repeats=5 company=.3 attack=.5 release=2 travel=.38 ground=0.5 tone=0.48 vibrato=.5 eyes=1 height=0.85 parallax=.9 penumbra=0.3 glow=0.85 | sinking | vigil | Voices that rise on one side as they sink on the other
Asking and asking | Climbing swells | near=Pines repeats=2 company=.15 attack=.1 decay=7 release=2 travel=.64 ground=.6 tone=0.48 vibrato=.2 eyes=.4 wind=.3 height=.8 penumbra=0.1 jag=0 body=0.2 | octcanon | edge | A nasal voice pushed upwards almost once a second
Village band sings | Fifth voices | near=Pines ground=.5 attack=.06 decay=9 sustain=.9 release=1.5 company=0.85 tone=0.74 travel=.34 vibrato=.3 jag=0.38 eyes=.6 height=.7 repeats=2 sun=0.16 glow=0.2 | console | tenths | Open nasal voices, loud and a little rough
Reapers' thirds | Fifth voices | near=Cliffs ground=0.5 attack=.1 decay=4 sustain=.8 release=0.8 company=0.4 tone=0.62 travel=0.5 repeats=4 vibrato=0 eyes=.4 wind=.4 body=.5 height=.6 sun=0.1 jag=0.1 far=Cliffs | shorthalo | sixths | Bright pairs held straight, a vowel climbing above
Widows' lament | Fifth voices | near=Pines ground=.4 attack=.4 decay=12 release=4 company=.4 tone=0.5 travel=.26 vibrato=.85 eyes=.7 wind=.35 height=.75 jag=.15 sun=0 glow=0 | sighs | lament | Nasal voices shaking on every held note
Market cry | Fifth voices | near=Pines ground=0.72 attack=.008 decay=3 sustain=.5 release=.8 company=0 tone=0.56 travel=.55 repeats=4 vibrato=0 eyes=.2 jag=.4 body=.3 height=.6 glow=0.1 volume=1 | openair | hocket | Hard nasal shouts cut short
Snow blind choir | Fifth voices | near=Pines far=Pines ground=0.66 attack=1 decay=10 release=7 company=.8 tone=0.42 travel=0.44 repeats=4 eyes=1 wind=.25 vibrato=.2 sun=0 jag=0.25 volume=-2 height=0.75 | veil | window | Nasal voices with flickering needles, very wide
Talking in their sleep | Fifth voices | travel=.62 ground=.5 repeats=1 attack=.05 release=.5 company=.1 tone=0.36 eyes=.4 wind=.4 parallax=.7 vibrato=0 height=.9 jag=0.18 glow=0.5 decay=1.8 | shutdoor 1.highCut=3000 | psalm | Vowels changing as quickly as speech
Debate in the rookery | Fifth voices | travel=.75 far=Pines near=Cliffs ground=0.7 repeats=2 attack=.02 release=.4 company=.35 tone=0.56 jag=.4 eyes=.9 height=0.65 parallax=.3 glow=0.7 decay=12 volume=-2.5 | flock | hocket | Flickering voices from every branch
Auctioneer, far field | Fifth voices | travel=.85 ground=.65 repeats=2 attack=.01 decay=2 sustain=.6 release=.3 company=0 tone=0.64 eyes=.3 wind=.2 height=.75 vibrato=.1 near=Towers sun=0.26 jag=0.4 glow=0.85 | platform | ostinato | A hollow voice, babbling twice a second
Prayer wheels | Fifth voices | travel=.68 parallax=.95 repeats=3 ground=.5 attack=.6 release=1.8 company=.5 tone=0.76 eyes=.8 vibrato=.1 height=.95 penumbra=.2 sun=0.2 glow=0.6 decay=4.5 volume=-2 | circle | window | Two vowels turned round and round at different speeds
Counting sheep aloud | Fifth voices | travel=.52 near=Hills far=Cliffs repeats=3 ground=.7 attack=.04 decay=1.5 sustain=.5 release=.6 company=.2 tone=0.46 eyes=.5 wind=.3 height=.8 sun=0 | slowdisc | ostinato | Soft syllables that drop at the end
Humming in the kitchen | Fifth voices | tone=.28 ground=.85 travel=.22 attack=.12 release=.8 company=.1 vibrato=.4 wind=.1 body=.8 penumbra=.5 eyes=.2 height=.7 sun=0 jag=0 glow=0.2 decay=12 | parlour | edge | Lips closed, a small darkness moving inside
Crowd before the concert | Fifth voices | tone=.36 ground=.5 travel=.4 attack=.8 release=2.5 company=1 wind=.6 jag=.2 eyes=1 vibrato=.2 height=.8 parallax=.8 sun=0.12 glow=0.85 decay=1.8 | backhall | gather | A wide murmur of very many
Monastery bees | Fifth voices | tone=.34 near=Pines ground=.7 travel=.3 attack=.5 decay=12 release=5 company=.65 jag=.5 wind=.3 eyes=.7 repeats=2 height=.7 vibrato=0 sun=0.26 glow=0.7 volume=-1 | hollowswell | window | Nasal humming, close and furry
Mouth shut, hands full | Dune bass | far=Hills attack=.08 decay=6 sustain=.9 release=.5 tone=.3 ground=.75 travel=.34 vibrato=.3 company=.25 height=.85 repeats=1 wind=.15 eyes=.3 parallax=0.55 sun=0.2 jag=0 body=0.75 | cupboard | reedline | A dark round hum whose vowel turns over
Tune carried home | Fifth voices | tone=.4 ground=.9 travel=.14 repeats=4 attack=.2 release=1.4 company=.2 vibrato=.25 wind=.25 eyes=.6 height=.65 body=.4 jag=0.04 glow=0 decay=7 | pillow | sixths | A plain hum with one thin overtone kept
Cistern song | Fifth voices | near=Towers ground=.7 tone=0.46 travel=.36 repeats=1 attack=.15 release=1.2 company=.3 vibrato=.35 eyes=.5 sun=.3 wind=.2 height=.9 jag=0 glow=0.5 decay=1.2 | well | psalm | Hollow low vowels with water under them
Glass harmonica choir | Fifth voices | near=Towers ground=.55 tone=.4 repeats=4 travel=.28 attack=.4 release=2.5 company=.35 vibrato=.1 eyes=.8 wind=.1 penumbra=.5 height=.75 sun=0.16 jag=0 glow=0.2 decay=4.5 | glassharp | gather | Hollow pale voices that ring
Choir on old film | Fifth voices | near=Cliffs ground=.45 tone=0.76 attack=.5 release=1.4 company=.6 vibrato=.6 travel=.36 eyes=.7 wind=.2 jag=.2 body=.5 decay=1.8 | seatape | tenths | Bright voices with a wide waver, leaning as the reel turns
Shades at the crossing | Fifth voices | near=Cliffs far=Cliffs ground=0.02 tone=.42 repeats=2 attack=1.5 release=4 company=.8 travel=.3 eyes=0.6 wind=.5 penumbra=.6 sun=.6 jag=0.25 decay=12 | darkwater | vigil | Hollow voices with no ground, climbing and gone
Robot learns a hymn | Still organ | near=Cliffs repeats=3 height=.95 ground=.4 tone=0.66 attack=.02 release=.3 travel=.46 parallax=.2 company=0 vibrato=0 body=0 eyes=.2 penumbra=.05 jag=0.04 | glaze | trio | Straight hard vowels opening and closing on time
`,
    },
    {
      id: 'still-organs',
      name: 'Still organs',
      category: 'organ',
      rows: `
Village flue | Still organ | repeats=1 ground=.8 tone=0.7 height=.45 attack=.03 wind=0.3 release=.3 company=.05 body=.3 eyes=.3 near=Towers | room | trio | Plain stopped flutes with a puff of wind
Eight foot and nothing | Still organ | height=.1 ground=1 tone=.36 attack=.05 release=.35 company=0 wind=.1 body=.5 eyes=0 repeats=1 jag=0 | booth | quartet | The roundest pipe, held dead still in the middle
Principal at matins | Still organ | repeats=2 tone=0.6 ground=.65 height=.6 attack=.02 release=.4 company=.2 wind=.1 body=.2 eyes=.6 penumbra=.2 sun=.1 jag=0 near=Cliffs | cathedral | trio | Clear bright pipes, the octave standing firm in them
Wooden flutes, dry loft | Still organ | repeats=3 tone=0.3 ground=.75 height=0.75 body=0.6 wind=0.35 attack=.04 release=.25 company=0.6 eyes=.5 penumbra=.6 jag=0 sun=0 | bare | sixths | Soft wooden pipes in threes, a twelfth inside them
Gemshorn by the door | Still organ | repeats=5 far=Cliffs tone=0.8 ground=.7 height=.4 attack=.08 release=.6 company=.4 wind=.2 eyes=.8 body=.1 | flutestops | junction | Mild horn pipes, a thin bright edge held in each
Bourdon behind oak | Still organ | near=Towers repeats=1 tone=.36 ground=.9 height=.4 attack=.06 release=.5 body=.8 wind=.15 sun=.5 company=.15 eyes=.2 jag=0.32 | faintturn | trio | Dark hollow pipes shut behind wood
Quintadena | Still organ | near=Towers repeats=3 tone=0.64 ground=.5 height=.7 attack=.02 release=.3 body=.2 sun=.8 eyes=.5 wind=.2 company=0 jag=0.18 volume=-3.5 | chamber | hocket | Hollow pipes that let their twelfth through
Pipes of unequal length | Still organ | near=Towers far=Cliffs repeats=2 tone=0.8 ground=.65 height=.65 attack=.015 release=.35 company=.5 jag=.3 eyes=.9 body=.4 volume=-1 | openair | peal | Hollow bright pipes, no two quite agreed
Stopped for the night | Still organ | near=Towers far=Pines repeats=1 tone=.42 ground=.75 height=.6 attack=.2 release=1.5 wind=.5 company=.3 eyes=.7 penumbra=.5 sun=.35 jag=0 | shutdoor 1.highCut=2400 | lament | Hollow pipes breathing low, a few needles among them
Chimney flute lid | Still organ | near=Towers repeats=4 tone=.66 ground=.85 height=.55 attack=.01 decay=1 sustain=.7 release=.25 body=.6 wind=.3 eyes=.3 penumbra=.15 jag=0.4 volume=-3.5 | smallplate | ostinato | Hollow pipes with a ting held above, quick to speak
Krummhorn bench | Reed evening | travel=0 sun=.7 tone=0.56 attack=.012 release=.2 vibrato=0 wind=.1 company=.1 body=.4 ground=0.62 sustain=1 jag=0.6 height=.2 repeats=4 | console | hocket | Buzzing half hollow reeds, straight and dry
Regal in a closet | Reed evening | travel=0 sun=0.35 near=Cliffs tone=.74 ground=.4 attack=.008 release=.2 vibrato=0 wind=.05 jag=.5 body=.7 eyes=.1 height=.35 repeats=3 sustain=1 penumbra=0.08 glow=0.6 | cupboard | trio | Small snarling reeds with little note under them
Low reed, high nave | Reed evening | travel=0 sun=.5 near=Cliffs tone=0.5 ground=.9 attack=.1 release=.8 vibrato=0 wind=.2 company=.35 sustain=1 eyes=.6 height=.5 far=Cliffs repeats=1 penumbra=0.35 jag=0.25 volume=-7.5 | nave 2.lowCut=30 | deep | Broad reed pipes from the bottom of the case
Sunday school reeds | Reed evening | travel=0 near=Towers sun=0.4 tone=0.56 decay=3 sustain=1 release=0.4 ground=.6 vibrato=0.75 wind=0.5 body=.6 height=0.5 eyes=.3 penumbra=0.04 glow=0.1 volume=-3.5 repeats=1 far=Cliffs | midpulse | sixths | Hollow reeds shaken by a tremulant
Trumpet stop, far loft | Reed evening | travel=0 near=Cliffs sun=0.2 tone=.8 ground=.45 attack=.02 release=.4 vibrato=.05 wind=.1 jag=.2 sustain=1 height=.4 repeats=2 eyes=.4 company=.2 | backhall | tenths | Bright narrow reeds at the other end of the church
Mixture in frost | Still organ | repeats=6 far=Hills tone=0.5 ground=0.7 height=.9 penumbra=.1 attack=.01 release=.5 company=.3 eyes=.9 jag=.1 body=.1 near=Cliffs | cathedral 1.mix=.2 | trio | High ranks over narrow pipes, none of them moving
Nine ranks of nothing | Still organ | repeats=9 tone=0.55 ground=0.6 height=0.85 attack=.15 release=1.2 company=.15 eyes=.7 wind=.2 penumbra=.3 sun=.2 jag=0.32 | airytail | gather | A small hill fourteen times over, a whistle with half a note below
Sesquialtera | Still organ | repeats=3 tone=.66 ground=.7 height=.7 sun=.3 attack=.01 release=.3 company=.05 jag=.35 eyes=.4 body=.5 far=Cliffs near=Cliffs | thinned | sixths | A keen reedy solo stop, its twelfth and its third held still
Glass pipes | Still organ | repeats=4 near=Towers far=Cliffs tone=0.55 ground=0.7 height=.9 attack=0.12 release=.9 company=.4 eyes=1 wind=.05 penumbra=.35 body=0 jag=0.18 sun=0.15 | glassblur | peal | Hollow cold pipes, a high edge standing over the note
Zimbel without a star | Still organ | repeats=8 far=Pines tone=0.74 ground=.8 height=.8 attack=.005 decay=2 sustain=.6 release=.4 eyes=.8 jag=.2 company=.1 body=.2 | chimes | ostinato | Plain pipes struck with a high glitter that stands still
Salicional mist | Still organ | near=Cliffs repeats=1 tone=0.64 ground=.5 height=.2 attack=.25 release=1.4 company=.75 wind=.3 eyes=.8 body=.4 penumbra=.3 jag=0.18 | breathes | junction | Stringy narrow pipes, tuned apart so that they beat
Celeste, two doors shut | Still organ | near=Cliffs repeats=2 tone=.4 ground=.7 height=.35 attack=.4 release=2 company=1 eyes=1 wind=.1 body=.3 sun=.2 jag=0.25 volume=-3.5 | swirl | lament | Dark string pipes beating wide
Pine pipe regals | Still organ | near=Pines far=Hills repeats=1 tone=0.74 ground=.6 decay=12 release=2 attack=.03 company=.45 jag=.4 wind=.2 eyes=.5 height=.5 body=.6 | scooped | tenths | Nasal pipes in pairs, dry wood all round
Celeste in the rafters | Still organ | near=Pines repeats=3 tone=0.76 ground=.45 decay=15 release=4 attack=.35 company=.85 vibrato=.35 wind=.35 eyes=.9 height=.7 penumbra=.5 jag=0.32 | liftaway | window | Nasal pipes in detuned threes with a shake
Rosin organ | Still organ | near=Cliffs repeats=1 tone=0.5 ground=0.55 height=0.6 jag=0.95 attack=.06 release=.5 company=.6 wind=.5 eyes=0.25 body=.7 sun=0.45 far=Cliffs | triode | trio | Pipes that rasp as if bowed
Tremulant, slow valve | Still organ | vibrato=.5 tone=0.5 ground=.75 repeats=2 height=.5 attack=.05 release=.5 company=.1 wind=.35 eyes=.4 body=.4 penumbra=.5 jag=0 | ampshake | sixths | Round pipes whose wind shakes and swells
Fairground, shut | Still organ | vibrato=.85 near=Cliffs tone=0.76 ground=.55 repeats=3 height=.5 attack=.015 release=.25 company=.4 sun=.4 jag=.2 eyes=.6 body=.6 | dusty | ostinato | Reedy pipes shaking hard
Bellows boy nods off | Still organ | vibrato=1 tone=.42 ground=0.65 repeats=3 height=.6 attack=.3 release=1 wind=.6 company=.2 eyes=.5 body=.5 near=Towers sun=0.3 | calm | lament | The wind shakes hard under every hollow pipe
Rotor and valves | Still organ | vibrato=.1 near=Hills repeats=3 tone=0.5 ground=.7 height=.6 attack=.006 decay=.6 sustain=.75 release=.2 company=0 jag=.15 eyes=.3 | chorale | sixths | Round pipes with a click, going round in a box
Roller rink, last song | Still organ | vibrato=.3 near=Cliffs repeats=4 tone=0.5 ground=0.75 height=.75 attack=.005 decay=.4 sustain=.8 release=.2 company=.15 eyes=.4 body=.2 jag=0.04 sun=0.3 | spun | ostinato | Percussive reedy tones, every one struck alike
Wind chest leaks | Still organ | travel=.1 wind=.8 tone=0.66 ground=.65 repeats=2 height=.6 attack=.08 release=.6 company=.25 eyes=.7 body=.5 jag=.2 parallax=0.25 | emptyroom | quartet | More leak than pipe, a hill creeping round in it
Sun crosses the organ | Still organ | travel=.2 sun=.9 tone=0.76 ground=.55 repeats=3 height=.75 attack=.12 release=.9 company=.3 eyes=.6 wind=.15 parallax=.66 jag=0.4 | summer | junction | Reed coloured pipes, one hill passing, one standing
Candle by the pipes | Still organ | travel=.24 near=Towers far=Cliffs tone=0.36 ground=.7 repeats=1 height=.8 attack=.2 release=1.2 company=.4 eyes=.8 glow=.6 wind=.2 parallax=0.2 jag=0 volume=-3.5 | tides | tenths | Hollow pipes that swell and shrink as a low cliff goes by
Dust wakes in the swell | Still organ | travel=.16 far=Pines tone=0.56 ground=.6 repeats=3 height=.7 attack=.5 release=2 company=.5 eyes=1 jag=.3 wind=.3 penumbra=.5 parallax=0 | leaves | gather | Soft pipes with needles turning over slowly in them
Two manuals, one tired | Still organ | travel=.28 parallax=1 repeats=3 near=Cliffs tone=0.74 ground=.5 height=.65 attack=.03 release=.5 company=.35 eyes=1 body=.3 jag=0.25 volume=0 | sides | hocket | Stringy pipes, two small hills drifting opposite ways
Portative on the knee | Still organ | repeats=2 near=Hills tone=0.28 ground=0.75 height=0.8 attack=.02 release=.2 wind=0.7 body=1 company=0 eyes=.1 vibrato=.1 penumbra=.25 sun=0 | middle | kite | Small wooden pipes pumped by one hand
Shruti in the corner | Still organ | near=Pines repeats=1 tone=0.4 ground=.7 decay=16 sustain=1 release=3 attack=.5 company=.4 wind=.35 body=.9 eyes=.4 jag=.3 sun=.3 height=.3 | smalldark | fifthhold | Nasal reeds in a wooden box, left sounding | drone
Pedal harmonium, rain | Still organ | near=Cliffs sun=.35 repeats=2 tone=0.44 ground=.6 attack=.1 release=.6 company=.5 wind=.45 body=.8 vibrato=.2 eyes=.5 height=.35 jag=.1 | rain | sixths | Breathy brass reeds in a wooden case
Accordion through a wall | Still organ | near=Cliffs sun=0.28 repeats=1 tone=.64 ground=.5 attack=.03 release=.25 company=.9 wind=.15 body=.5 eyes=.3 jag=.2 height=.3 volume=-3 | nextdoor | sixths | Three reeds to a key, tuned sour and wide
Bandoneon after hours | Still organ | near=Cliffs sun=.6 repeats=2 tone=0.68 ground=.7 attack=.02 decay=2 sustain=.6 release=.2 company=.2 wind=.3 body=.7 eyes=.2 vibrato=.25 glow=.6 jag=0.4 | darkspring | attic | Hollow reeds that lean in and sink
Transistor choirstall | Still organ | near=Hills repeats=2 tone=0.48 ground=0.9 height=0.35 attack=.004 release=.2 company=0 wind=0 body=0 eyes=0 penumbra=.05 sun=.2 jag=0 volume=-3 | octaveup | ostinato | Plain electric tones, no air and no wood
Combo organ, garage | Still organ | near=Cliffs repeats=4 tone=0.54 ground=0.75 height=0.4 attack=.004 release=.2 company=.1 wind=0 body=0 vibrato=.45 eyes=.2 jag=.1 penumbra=.1 sun=0.3 | combo | hocket | Plain reedy electric tones with a quick waver
Percussion tab down | Still organ | near=Hills far=Cliffs repeats=3 tone=0.95 ground=.75 height=.6 attack=.004 decay=.4 sustain=.25 release=.3 glow=.8 company=.05 wind=.05 body=.3 | hotvalve | hocket | Round tones that knock and fall back
Test tone cathedral | Still organ | near=Hills height=0 ground=1 tone=0.08 attack=.06 release=1.2 company=0 wind=0 body=0 eyes=.5 repeats=1 jag=0.04 | shadowswell | gather | Almost sines, one to a key
Organ taken by the wind | Still organ | travel=.3 repeats=2 tone=0.44 ground=.5 height=.7 attack=.6 release=3 company=.6 wind=.65 vibrato=.25 eyes=1 far=Pines penumbra=.4 parallax=0.9 jag=0.18 | shore | window | Pipes and air together, needles passing among them
Flooded crypt | Still organ | near=Towers travel=.14 repeats=2 tone=.4 ground=.8 height=.7 attack=.3 release=2 company=.35 wind=.1 eyes=.7 body=.2 penumbra=.4 jag=0.32 | under | lament | Dim hollow pipes with a hill turning far below
Half the pipes asleep | Still organ | near=Towers far=Pines repeats=6 tone=0.72 ground=.6 height=.75 attack=.08 decay=1.2 sustain=.5 release=.8 eyes=.9 jag=.5 company=.2 wind=.3 volume=-2 | dissolve | quartet | Hollow pipes that give up part of their breath, rough on top
Prelude on cassette | Still organ | near=Hills repeats=2 tone=0.7 ground=.6 height=.65 attack=.02 release=.5 company=.45 wind=.1 eyes=.7 vibrato=.15 body=.6 sun=.25 jag=0 | cassette | trio | Clear wooden pipes, a pair to each key
Moonlight on the pedals | Still organ | near=Hills far=Cliffs travel=.18 repeats=1 tone=.36 ground=.95 height=.7 attack=.1 release=.9 company=.2 body=.5 eyes=.4 wind=.1 jag=0 volume=-1 | pedalpipe | pedalline | Round low pipes, a step rising slowly inside | bass
Last chord, doors open | Still organ | near=Cliffs repeats=2 tone=.66 ground=.6 height=.8 attack=.04 release=2.4 company=.65 sun=.3 wind=.2 eyes=.9 jag=.15 body=.4 | wash | tenths | Every rank at once, bright, reedy and wide
`,
    },
    {
      id: 'haze-drones',
      name: 'Haze drones',
      category: 'drone',
      rows: `
Valley before the mowers | Haze drone | attack=2 tone=0.36 travel=.3 repeats=2 ground=.6 company=.5 wind=.6 eyes=.8 release=4 sun=0.16 jag=0.04 body=0.6 near=Cliffs | darkhall | fifthhold | Three soft rows shining through each other, breath over them
Heat over the tarmac | Haze drone | attack=1.2 tone=0.64 travel=.55 parallax=.9 ground=.5 vibrato=.35 company=.3 wind=.3 repeats=3 jag=.2 eyes=1 sun=0.12 body=0 | wobble | window | Soft rows that shake against each other
Milk in the river | Haze drone | penumbra=1 attack=3 tone=.38 ground=.9 height=.55 company=1 wind=.25 travel=.18 body=.6 eyes=.6 release=6 parallax=0.8 sun=0 jag=0 volume=-3.5 | slowdrift | fifthhold | Every edge gone, dark and very many
Fog bell not rung | Haze drone | near=Towers attack=1.6 tone=.42 travel=.22 repeats=1 ground=.7 wind=.35 company=.4 eyes=.9 release=5 sun=.3 parallax=0.6 jag=0.25 | infog | fifthhold | Hollow towers deep in haze, a low hill over them
Far field burning | Haze drone | far=Cliffs attack=2.4 tone=0.5 travel=.34 repeats=1 ground=.65 jag=.6 wind=.5 company=.6 height=.9 eyes=.7 sun=0.2 body=0.1 | woolhaze | fifthhold | Soft cliffs glowing up every five seconds, rough in their grain
Cellar of the world | Haze drone | attack=1 tone=0.14 ground=1 company=.6 body=.8 travel=.15 wind=.15 near=Cliffs height=.4 eyes=.4 penumbra=.4 parallax=0 jag=0.7 volume=-3.5 | cave | deep | Almost all ground, dark stone rubbing inside it
Generator hall at rest | Still organ | near=Cliffs travel=.06 attack=1.5 release=3 ground=.95 tone=0.52 company=.55 jag=0.35 body=.9 vibrato=.05 eyes=.5 repeats=1 volume=-1.5 far=Cliffs height=0.6 | winterroom 2.lowCut=30 | deep | A straight low hum, tuned apart, its grain showing
Two notes under ice | Dune bass | far=Hills attack=1.8 decay=20 sustain=1 release=6 tone=.4 travel=.2 ground=.9 company=.7 eyes=.8 height=.7 repeats=2 sun=0.26 jag=0 body=0.6 | under | fifthhold | Dark round tones, a hill turning over very slowly
Cut peat, stacked wet | Felt keys | attack=2.5 sustain=1 release=7 decay=12 tone=.28 ground=.85 wind=.7 company=.45 body=1 penumbra=.7 travel=.25 eyes=.5 sun=0 jag=0.32 | deepfog | fifthhold | Dull wood and damp breath, nothing sharp in it
Sluice gate, full moon | Climbing swells | near=Hills attack=1 release=4 repeats=1 tone=.38 ground=.95 travel=.26 company=.3 height=.9 eyes=.4 wind=.4 penumbra=0.3 jag=0 body=0.1 | darkwater | pedalline | A low step of cliff climbing for nine seconds, then down
Pass road, closed | Wind on stone | attack=1.2 wind=0.9 ground=0.05 tone=0.58 jag=.4 travel=.45 height=.2 eyes=1 release=3 company=.3 parallax=0.9 glow=0.5 body=0.5 decay=4.5 | valley 1.mix=.2 | - | Wind with a pitch to it and hardly any note | texture
Grass seed and static | Wind on stone | near=Pines attack=.4 decay=14 sustain=.9 release=5 wind=0.6 jag=0.8 ground=0.5 tone=0.34 far=Pines travel=.6 eyes=.9 repeats=6 sun=0 body=0.2 volume=-0.5 | hintstatic | gather | Dry nasal grit, needles flickering in it | texture
Sand under a door | Wind on stone | near=Towers attack=.8 wind=.85 jag=.9 ground=0.58 tone=0.34 far=Cliffs travel=.4 repeats=2 company=.5 eyes=.7 height=.6 parallax=0.55 sun=0 glow=0.2 body=0.75 decay=1.2 volume=-1 | autumn | - | Hollow grains that swell and drop | texture
Sea cave breathing | Wind on stone | near=Hills attack=2 wind=.9 jag=.15 ground=.5 tone=.36 far=Cliffs repeats=1 travel=.32 height=.9 eyes=.8 release=6 sun=0.26 glow=0.85 body=0 decay=7 | tides | fifthhold | Dark round breath that rises and sinks | texture
Rock face, no rope | Wind on stone | attack=.15 wind=0.35 jag=0.7 ground=0.7 tone=0.5 sun=.4 travel=.2 height=.15 company=.1 eyes=.4 body=.7 penumbra=.1 parallax=1 decay=1.8 far=Cliffs volume=1.5 | longplate | - | A bare rough face, half hollow, all grain | texture
Four strings, all day | Pine strings | attack=.6 far=Hills tone=0.8 ground=.65 company=.3 vibrato=0 jag=.35 travel=.36 repeats=3 sun=.15 release=9 wind=.2 eyes=.5 parallax=0.8 penumbra=0.35 body=0.1 | pedalheld | fifthhold | Nasal open strings, a hill gliding along their overtones
Resin drone, mixed wood | Pine strings | attack=1.4 far=Pines tone=0.36 ground=.8 company=.8 vibrato=.05 jag=.6 travel=.3 repeats=1 release=8 body=.9 eyes=.8 parallax=0.25 penumbra=0.1 volume=-0.5 | ensemble | fifthhold | Many nasal players, low needles turning over
Bees in the gable | Pine strings | attack=.9 tone=.44 ground=.6 company=.7 vibrato=.3 jag=.8 travel=.66 far=Pines repeats=2 wind=.1 eyes=.7 release=6 parallax=0.1 penumbra=0.04 sun=0.2 glow=0.7 body=0.75 volume=-5.5 | water | - | A nasal swarm that trembles in place
Hurdy wheel, slow hand | Pine strings | attack=.2 tone=.64 ground=.5 company=.15 jag=.5 sun=.3 far=Cliffs travel=.44 repeats=2 vibrato=.1 wind=.4 eyes=.3 release=3 body=.8 penumbra=0.12 glow=0.6 | shells | fifthhold | A rough nasal string turned by a wheel, cliffs swelling round
Night in the plantation | Pine strings | attack=2 tone=.34 ground=.75 company=.55 wind=.8 jag=.1 travel=.2 penumbra=.8 height=.6 release=10 eyes=.9 vibrato=0 parallax=0.5 sun=0.12 glow=0.1 volume=-4 | cave 1.mix=.22 | window | Dark pines and slow wind, edges softened
Telegraph over the moor | High pass train | attack=.8 far=Hills repeats=8 ground=0.5 travel=.35 height=0.8 tone=0.5 wind=.3 jag=.05 company=.4 eyes=.8 release=4 sun=0.16 decay=7 | whistled 1.mix=.25 | gather | A pale whistle over the note with overtones stepping out of it
Smell of snow | High pass train | attack=1.5 near=Towers far=Pines repeats=9 ground=0.66 travel=.48 height=.7 tone=0.58 wind=.2 jag=.3 company=.6 eyes=1 release=5 sun=.4 penumbra=0.05 glow=0 decay=4.5 | glinting | window | Hollow and cold, needles at the very top
Thread of daylight | High pass train | attack=.5 near=Hills far=Hills repeats=6 ground=0 travel=.2 height=.9 tone=0.46 wind=.1 company=.1 eyes=.4 vibrato=.15 jag=0 release=3 penumbra=0.45 sun=0.2 glow=0.6 body=0.2 decay=1.2 | thinair | gather | Only overtones, one hill gliding among them
Snow light on ceilings | High pass train | attack=3 near=Cliffs far=Hills repeats=5 ground=0.5 parallax=1 travel=.36 height=.8 tone=0.6 company=.8 eyes=.9 release=6 penumbra=.4 wind=.15 sun=0 glow=0 body=0.6 decay=12 | glasshall | gather | Pale bright stone, two small hills passing both ways
Dog whistle orchard | High pass train | attack=.3 near=Pines far=Hills repeats=7 decay=15 release=6 ground=0.68 travel=.6 height=0.5 tone=0.36 jag=.2 wind=.35 eyes=.7 company=.2 glow=0.2 body=0 | phasing | - | Nasal breath and a small quick whistle | texture
Moon tide on mud flats | Climbing swells | near=Hills attack=2.5 release=5 repeats=2 travel=.22 tone=0.5 ground=.7 company=.5 wind=.6 eyes=.8 height=.8 penumbra=.4 glow=0.1 body=0.5 volume=-2.5 | surf | vigil | One climb lasting fourteen seconds, soft and breathy
Glacier calves at night | Climbing swells | near=Cliffs attack=1.4 release=4 repeats=1 travel=.4 tone=0.46 ground=.8 jag=.5 company=.6 eyes=.6 sun=.2 height=.9 | sinking | fifthhold | Stone that rises for three seconds and falls off
Lungs of the mill | Climbing swells | near=Towers attack=.4 release=1.5 repeats=3 travel=.5 parallax=.1 tone=0.44 ground=.6 wind=.7 company=.2 body=.6 eyes=.4 jag=0.18 glow=0.5 | comesgoes 1.floor=.7 | fifthhold | Hollow breath pushed out every two seconds
Horizon lifts, settles | Climbing swells | near=Cliffs attack=3 release=6 repeats=4 travel=.28 parallax=.85 tone=0.66 ground=0.64 company=.8 eyes=1 vibrato=.1 wind=.3 penumbra=0.12 jag=0.25 glow=0.85 | mufflechoir | vigil | Bright stone with two cliffs climbing opposite ways
Dyke watch | Climbing swells | near=Pines attack=1 decay=18 release=8 repeats=1 travel=.34 tone=.42 ground=.85 jag=.3 company=.4 eyes=.5 body=.7 sun=.3 glow=0.7 | lowcloud | pedalline | Nasal and low, heaved up every five seconds
Cloud of midges | Needle flutter | near=Hills attack=.8 sustain=1 release=2.5 travel=1 repeats=4 tone=0.62 ground=.55 height=.75 company=.5 eyes=1 jag=.3 parallax=.2 penumbra=0.04 glow=0.85 | softcloud | - | A round tone inside a flutter as fast as it goes | texture
Film of rain on slate | Needle flutter | near=Cliffs attack=.5 sustain=.9 release=3 travel=.88 repeats=7 tone=0.4 ground=.5 height=.6 jag=.1 wind=.5 eyes=.9 company=.3 penumbra=0.1 sun=0.12 glow=0.1 body=0.1 decay=1.2 | rain | gather | Breathy stone with high quick needles | texture
Loom with no cloth | Needle flutter | near=Towers attack=.1 sustain=1 release=1.2 travel=.95 far=Cliffs repeats=2 tone=0.7 ground=.65 parallax=.8 body=.6 eyes=.5 company=.15 jag=.4 penumbra=0.3 sun=0.16 glow=0.6 | phasing | fifthhold | Hollow tones shuttled to and fro twice a second | texture
Nerves before snow | Needle flutter | near=Pines attack=1 decay=15 sustain=1 release=6 travel=.8 far=Hills repeats=3 tone=0.46 ground=.7 vibrato=.6 eyes=.8 company=.6 wind=.3 penumbra=0.45 sun=0.26 glow=0.7 body=0.2 | ripple | window | Nasal tones that shiver and waver together | texture
Strip lights warming | Needle flutter | near=Hills far=Hills attack=1.5 sustain=1 release=3 travel=.9 repeats=9 height=.8 tone=0.54 ground=.6 company=.2 jag=.5 eyes=.6 sun=.5 penumbra=0.35 glow=0.5 body=0.6 | ringhalo | - | A hollow tone and a small whistle beating in it | texture
Bagpipe left breathing | Reed evening | attack=.5 sun=.4 near=Cliffs tone=0.68 ground=.5 sustain=1 release=.8 company=.6 vibrato=0 wind=.2 jag=.3 travel=.2 repeats=3 height=.4 eyes=.5 penumbra=0.35 glow=0.2 | wideopen | fifthhold | Straight reeds, tuned apart, a hill along the top
Long reeds of the fen | Reed evening | attack=2 sun=.9 tone=.4 ground=.8 sustain=1 release=4 company=.7 vibrato=.1 wind=.75 travel=.3 height=.35 eyes=.8 parallax=0.55 penumbra=0.3 jag=0 glow=0 | mist | fifthhold | Hollow low reeds in a good deal of breath
Sundial at five | Still organ | near=Cliffs travel=.22 sun=1 attack=1 release=2.5 tone=0.6 ground=.6 company=.3 height=.6 repeats=1 eyes=.7 vibrato=.2 jag=0.4 | notch | junction | The longest shadow hollows it, one low hill crossing
Copper beech, no leaves | Reed evening | near=Towers far=Cliffs attack=1.4 sun=.7 tone=0.4 ground=.6 sustain=1 release=3 company=.45 vibrato=0 wind=.3 travel=.28 repeats=2 height=.75 eyes=.9 penumbra=0.45 jag=0.18 | slowoct | window | Hollow reeds with a cliff rising slowly behind
Drone of the sawyers | Reed evening | near=Pines attack=.3 sun=.55 tone=0.62 decay=16 sustain=1 release=2.5 ground=.7 company=.2 jag=.8 vibrato=0 wind=.15 height=.3 eyes=.3 body=.9 parallax=0 penumbra=0.08 glow=0.6 | stack | fifthhold | Rough nasal reeds, half hollow
Empty grain towers | Tower pluck | far=Hills attack=2 decay=14 sustain=1 release=4 tone=0.72 ground=.6 travel=.24 repeats=2 height=.8 penumbra=.5 company=.5 eyes=.9 wind=.4 parallax=0.55 jag=0.32 body=0 volume=-7 | hanging | window | Hollow towers hazed over, hills going slowly through
Steel masts in a sound | Tower pluck | far=Pines attack=1 decay=10 sustain=1 release=3 tone=0.46 ground=0.68 travel=.5 repeats=3 company=.7 jag=.4 eyes=1 sun=.2 parallax=1 penumbra=0.04 body=0.5 volume=-5.5 | frost | window | Open hollow tones with needles flickering wide
Abandoned exchange | Winter bells | attack=.6 decay=12 sustain=1 release=3 near=Towers far=Cliffs tone=.4 ground=.75 travel=.45 repeats=6 body=.5 company=.3 wind=.3 eyes=.6 parallax=0.1 sun=0 volume=1 | shortwave | fifthhold | Dim hollow lines with a cliff whistling up and down
Bottles along a fence | Tower pluck | far=Hills attack=.3 decay=8 sustain=.8 release=1.4 tone=0.76 ground=.7 wind=.9 travel=.14 repeats=1 company=.35 vibrato=.15 eyes=.7 parallax=0.9 penumbra=0.1 sun=0 jag=0.32 volume=-5.5 | bottle | gather | Hollow necks blown gently | texture
Gasometer at dusk | Tower pluck | far=Cliffs attack=4 decay=20 sustain=1 release=8 tone=.36 ground=.85 travel=.3 repeats=1 height=.7 company=.8 body=.8 eyes=.5 glow=.7 parallax=0.3 penumbra=0.1 jag=0.25 volume=-5 | undertow | fifthhold | Very slow and hollow, a low cliff moving in the tank
Two suns through haze | Haze drone | near=Cliffs attack=5 release=9 parallax=1 travel=.4 tone=0.5 height=.9 ground=.35 repeats=3 company=.6 eyes=1 penumbra=.5 sun=0.26 jag=0 body=0.75 volume=-4 | heldon | vigil | Soft stone, two rows of hills drifting apart both ways
Last of the snow plain | Fifth voices | attack=3.5 release=10 parallax=.75 travel=.24 ground=.4 tone=0.46 company=.9 wind=.5 eyes=.9 near=Cliffs height=.8 vibrato=.1 sun=0.2 glow=0.1 decay=1.8 volume=1 | frozenroom | vigil | Broad slow vowels over very little ground
Afternoon without end | Haze drone | attack=8 release=12 sustain=1 far=Cliffs repeats=3 tone=0.54 travel=.3 ground=.5 company=.4 wind=.4 eyes=.8 height=.7 penumbra=0.5 parallax=0 jag=0 body=0.5 volume=-1.5 | halftime | vigil | Eight seconds to rise, soft hills with cliffs climbing in them
Clock stopped by damp | Felt keys | near=Towers attack=1.5 sustain=.9 decay=20 release=8 repeats=4 tone=.44 travel=.38 ground=.55 penumbra=.6 parallax=.66 company=.5 eyes=.9 sun=0.16 jag=0.18 | octstack | gather | Dim hollow tones, one hill turning and one stuck
Ridges past counting | Bowed cliffs | attack=2 release=6 sustain=1 parallax=.4 travel=.34 repeats=2 height=.9 penumbra=.5 tone=0.8 company=.8 ground=.4 eyes=1 vibrato=.05 wind=.35 sun=0 glow=0.5 body=0.1 | hazypast | gather | Bright stone, and hills over it that cover the note by turns
`,
    },
    {
      id: 'winter-bells',
      name: 'Winter bells',
      category: 'bell',
      rows: `
Sleigh across the lake | Winter bells | decay=1.2 release=1 repeats=5 tone=0.4 ground=.6 travel=.5 company=.35 eyes=.8 height=.55 parallax=0.1 sun=0.12 volume=2.5 | brightair | peal | Hollow bells with quick needles jingling over them
Vesper, three towers | Winter bells | decay=3.5 release=2.6 repeats=2 tone=0.68 ground=.65 far=Hills travel=.36 height=.5 body=.2 eyes=.6 sun=0.2 | hall | - | Hollow bells ringing long, a hill rolling inside each
Iron tongue, cold hand | Winter bells | decay=.9 release=.7 far=Cliffs repeats=3 jag=.5 tone=0.5 ground=0.7 travel=.46 company=.05 wind=.15 eyes=.5 parallax=0 penumbra=0.1 sun=0.12 volume=2 | gated | peal | Short hard strokes, a cliff shot up in each
Bell under snow load | Winter bells | decay=2 release=1.5 repeats=1 far=Hills tone=.32 ground=.85 penumbra=.6 height=.6 wind=.3 body=.4 eyes=.4 parallax=0.6 sun=0.16 | blanket | lowtoll | Dull hollow bells, all the shine packed away
Steeple in two winds | Winter bells | decay=4.5 release=3 repeats=4 parallax=.95 tone=0.48 ground=0.7 travel=.5 eyes=1 company=.4 height=0.5 sun=.3 penumbra=0.45 volume=-0.5 | farecho | - | Long bells with needles crossing from side to side
Snow lantern | Winter bells | near=Hills far=Hills decay=1.6 release=1.4 repeats=3 tone=0.58 ground=.75 travel=.34 height=.6 company=.1 eyes=.5 wind=.12 parallax=0.8 sun=0.26 | faintfuzz | peal | Round bells, a hill glowing in them as they close
Plum stones on glass | Winter bells | near=Hills far=Cliffs decay=.6 release=.8 repeats=6 tone=0.84 ground=.8 travel=.48 company=0 eyes=.4 glow=.8 parallax=0.55 volume=1 | glasspipes | frost | Round small knocks with a bright chip
Handbells in mittens | Winter bells | near=Hills far=Hills decay=2.4 release=1 repeats=2 tone=.4 ground=.7 penumbra=.4 body=.6 company=.45 eyes=.7 glow=.7 sun=.2 parallax=0.25 volume=-9 | lifted | sixths | Soft round bells, paired
Skaters' bell | Winter bells | near=Hills decay=1 release=2 repeats=4 tone=0.7 ground=.65 travel=.7 eyes=1 height=.7 vibrato=.2 parallax=.5 sun=0 volume=4.5 | circle | peal | Round strokes with needles skimming past fast
Oranges in the window | Winter bells | near=Hills far=Hills decay=3.6 release=2.2 repeats=5 tone=0.32 ground=.85 travel=.22 height=.8 company=.25 eyes=.6 vibrato=.1 sun=0 | octhalo | - | Warm round bells with one slow gleam above
Anvil, first frost | Bowed cliffs | attack=.004 decay=1.6 sustain=0 release=1.2 repeats=4 tone=.74 ground=0.62 glow=.5 jag=.35 company=.1 vibrato=0 wind=.05 far=Cliffs eyes=.5 travel=.42 penumbra=0.05 sun=0.26 volume=2 | cavern | peal | Bright stone struck hard, cliffs dropping behind
Carillon of slate | Bowed cliffs | attack=.004 decay=2.6 sustain=0 release=2 repeats=3 tone=0.66 ground=.7 glow=.6 company=.3 vibrato=0 wind=0 body=.1 eyes=.8 far=Pines travel=.5 parallax=0.9 penumbra=0.12 sun=0.2 volume=-0.5 | glowroom | - | Bright bells that darken, needles beating in them
Brass bowl, cold water | Bowed cliffs | attack=.006 decay=5 sustain=0 release=4 far=Hills repeats=2 tone=0.4 ground=.6 sun=.7 company=.5 vibrato=.1 wind=.1 eyes=.9 height=.6 travel=.3 parallax=0.55 penumbra=0.04 jag=0 glow=0.85 body=0 | lowbowls | lowtoll | Half hollow metal with two players a shade apart
Icicles on one gutter | Bowed cliffs | attack=.004 decay=.7 sustain=0 release=.6 far=Hills repeats=7 tone=0.56 ground=0.72 glow=.8 company=0 vibrato=0 wind=.1 height=.8 eyes=.6 penumbra=.1 parallax=0.25 sun=0.16 jag=0.4 body=0.6 volume=6 | stars | frost | Bright tips with a tiny hill ringing in them
Sanctus, one pull | Bowed cliffs | attack=.005 decay=4 sustain=0 release=2.4 far=Cliffs repeats=1 tone=.64 ground=.75 company=.2 vibrato=.05 jag=.2 wind=.1 eyes=.4 travel=.34 height=.7 sun=0 body=0.75 volume=-0.5 | wash | lowtoll | A bright toll in which one low cliff climbs
Frost on reeds | Needle flutter | near=Pines attack=.004 decay=5 sustain=0 release=4 repeats=3 tone=0.6 ground=0.8 travel=.45 company=.2 eyes=.9 jag=.1 penumbra=0.3 sun=0.12 glow=0.2 body=0.2 volume=3.5 height=0.55 | glimmerhall | frost | Very short nasal ticks with needles over them
Crackle of thin ice | Needle flutter | near=Pines far=Cliffs attack=.004 decay=3 sustain=0 release=2.5 repeats=8 tone=0.78 ground=.6 travel=.62 jag=.7 eyes=1 company=0 height=.7 penumbra=0 sun=0 glow=0.7 body=0.1 volume=2.5 | scatter | rain | Dry sharp ticks, each splitting another way
Needles on a drum | Needle flutter | near=Pines far=Hills attack=.004 decay=9 sustain=0 release=6 repeats=2 tone=0.5 ground=.85 travel=.35 jag=.3 body=.8 company=.35 eyes=.4 penumbra=0.5 sun=0.16 | kettle | hocket | Nasal taps with a round hum beneath
Juniper bells | Needle flutter | near=Pines attack=.004 decay=14 sustain=0 release=10 repeats=3 far=Cliffs tone=0.54 ground=.65 company=.6 travel=.38 vibrato=.15 eyes=.8 jag=.15 penumbra=0.35 sun=0.2 volume=3 | gallop | - | Nasal bells in threes, a cliff swelling as they go
Salt thrown on steps | Needle flutter | near=Pines attack=.004 decay=2 sustain=0 release=3 repeats=6 tone=0.64 ground=0.6 travel=.74 jag=.9 wind=.6 eyes=.9 body=.3 penumbra=0.3 sun=0.12 glow=0 volume=2 | crystals | rain | Little bursts of grit and needle
Great bell, no wind | Winter bells | near=Towers far=Hills decay=6 release=4 repeats=1 tone=0.72 ground=.8 travel=.22 company=.15 sun=.4 eyes=.5 height=.5 glow=.5 penumbra=0.04 | cathedral 1.mix=.3 | lowtoll | One hollow toll at a time, a hill turning in it for seconds
Buoy at the bar | Dune bass | near=Towers far=Cliffs attack=.005 decay=2.4 sustain=0 release=2 repeats=2 tone=0.46 ground=.7 travel=.44 vibrato=.3 company=.2 eyes=.7 jag=.3 parallax=0.3 sun=0.26 body=0.5 | shore | lowtoll | Hollow low strokes that shake as they ring
Mine cage signal | Dune bass | far=Cliffs attack=.004 decay=1.2 sustain=0 release=1.6 near=Cliffs repeats=3 tone=0.7 ground=.75 jag=.6 company=.1 sun=.5 eyes=.3 travel=.5 volume=2.5 | darkwell | crest | Low struck stone, half hollow and rough
Temple gong, snow on it | Winter bells | near=Hills far=Cliffs decay=7 release=5 repeats=1 tone=.42 ground=.65 travel=.28 height=.9 company=.6 eyes=.8 attack=.02 parallax=0.5 | bowls | lowtoll | A low round stroke that opens late and slowly
Curfew over the roofs | Winter bells | near=Cliffs far=Hills decay=3 release=2.6 repeats=2 tone=0.42 ground=.8 travel=.3 sun=.8 body=.7 eyes=.3 company=.35 height=.45 wind=.1 parallax=1 volume=-0.5 | acrossroom | lowtoll | Reedy low bells with wood round them
Rims of the good cups | High pass train | near=Hills far=Hills attack=.01 decay=2 sustain=0 release=2 repeats=7 ground=0.74 tone=0.66 travel=.2 height=0.8 wind=.05 eyes=.6 jag=0 penumbra=0.08 sun=0 glow=0.1 body=0.75 | glassharp | frost | Thin round rings, the eighth harmonic singing over the note
Star over the byre | High pass train | near=Towers far=Hills attack=.004 decay=1.8 sustain=0 release=3 repeats=9 ground=0.74 tone=0.46 travel=.3 height=.85 wind=0 eyes=.9 jag=.05 company=.2 sun=0 glow=0.85 volume=1.5 | stars | frost | Hollow points with a small whistle in each
Frozen washing | High pass train | near=Cliffs far=Pines attack=.005 decay=1.4 sustain=0 release=1 repeats=5 ground=0.85 tone=0.95 travel=.56 jag=.5 wind=.2 eyes=.7 company=0 height=.6 sun=0.2 glow=0.5 body=0.2 volume=1.5 | gated | hocket | Stiff bright flaps, needles in their edges
Diamond dust, noon | High pass train | near=Hills far=Pines attack=.004 decay=1 sustain=0 release=2.4 repeats=8 ground=.75 tone=0.74 travel=.65 parallax=.3 eyes=1 jag=.3 wind=0 height=.8 penumbra=0.12 glow=0.7 body=0.6 volume=2.5 | octrain | frost | Round specks with a wide glitter
Breath on cold silver | High pass train | near=Towers far=Hills attack=.03 decay=3 sustain=0 release=3 repeats=4 ground=0.75 tone=0.34 wind=0.5 penumbra=0.9 travel=.25 eyes=.8 company=.3 height=0.5 body=0 volume=1.5 | mist | frost | Soft hollow bells with much air in them
Bell metal, unpolished | Winter bells | far=Cliffs decay=2.2 release=1.8 repeats=2 tone=0.7 jag=.8 ground=.55 travel=.36 company=.25 sun=.15 body=.3 eyes=.6 parallax=0.2 penumbra=0.08 volume=0 | softchime | peal | Hollow rough bells with low cliffs rising
Clock jack's hammer | Winter bells | near=Cliffs decay=.8 release=.5 repeats=2 tone=0.7 ground=.75 travel=.4 body=.9 company=.1 wind=.2 eyes=.3 sun=0.12 volume=2 | ringhalo | hocket | Woody bright strokes on the hour
Gamelan in a barn | Winter bells | near=Hills far=Cliffs decay=1.8 release=1.2 repeats=3 tone=0.4 ground=.6 company=.9 travel=.4 eyes=.9 vibrato=.05 jag=.3 parallax=0.1 penumbra=0.35 sun=0.16 | room 1.mix=.18 | ostinato | Round keys in beating pairs, cliffs stepping after
Prepared for frost | Tower pluck | near=Towers far=Pines decay=.6 release=.9 repeats=2 tone=0.5 ground=.7 jag=1 travel=.55 company=.3 eyes=.5 body=.5 sun=0 | thinglow | hocket | Blunt hollow strokes full of rattling needles
Glass stairs, barefoot | Felt keys | near=Hills far=Hills attack=.005 decay=2 sustain=0 release=1.6 repeats=5 tone=0.5 ground=.6 height=.85 penumbra=0.45 travel=.34 eyes=.7 body=.1 parallax=0 sun=0.26 | glasshaze | peal | Soft round bells with a hill singing five times higher
Teaspoons on a thread | Felt keys | near=Towers far=Hills attack=.004 decay=.9 sustain=0 release=.8 repeats=9 tone=0.64 ground=.7 height=.9 travel=.2 glow=.4 eyes=.5 company=.1 sun=0 volume=-0.5 | tin | ostinato | Small hollow taps with a whistle in the metal
Twelfths in the snow | Felt keys | near=Cliffs far=Hills attack=.005 decay=3.4 sustain=.05 release=3 repeats=3 tone=0.56 ground=0.62 height=.8 penumbra=.3 travel=0.4 company=.4 eyes=.8 body=.2 parallax=0.6 jag=0.18 | openfifth | sixths | Felted bells whose twelfth comes and goes
Lantern glass, warming | Fifth voices | attack=.006 decay=2.8 sustain=0 release=2 ground=.6 repeats=4 tone=0.6 travel=.3 height=.9 company=.3 vibrato=.1 wind=.1 eyes=.7 sun=0.16 volume=-1.5 | oos | peal | Struck vowels that shut as they die
Harmonic ladder | Still organ | attack=.004 decay=2.2 sustain=0 release=1.6 repeats=6 far=Cliffs height=.95 ground=.6 tone=0.6 travel=.12 company=.1 eyes=.6 penumbra=.15 glow=.5 jag=0 volume=1 | fan | peal | Plain struck tones, high cliffs almost standing on them
Nursery, snow outside | Winter bells | near=Hills far=Hills decay=.8 release=.4 repeats=2 tone=0.78 ground=.7 body=.7 company=.05 travel=.25 eyes=.2 glow=.4 parallax=0.8 penumbra=0.45 sun=0.12 volume=2 | musicbox | attic | Small round teeth on a comb | keys
Toy shop after closing | Winter bells | near=Towers far=Hills decay=.5 release=.3 repeats=4 tone=0.69 ground=.6 body=.5 company=.15 travel=.35 eyes=.4 jag=.15 parallax=0.1 penumbra=0.1 sun=0 volume=0.5 | cupboard | ostinato | Short hollow tines | keys
Celesta in felt socks | Felt keys | near=Hills far=Pines attack=.005 decay=1.4 sustain=0 release=.7 repeats=3 tone=0.5 ground=.75 height=.5 travel=.4 company=.1 eyes=.4 body=.5 wind=.2 jag=0.04 | softhammer | sixths | Soft round bars with a brush of needles | keys
Advent calendar | Winter bells | near=Hills far=Hills decay=1.4 release=1.1 repeats=6 tone=0.56 ground=.6 height=.7 travel=.45 company=.5 eyes=.8 glow=.3 parallax=0.55 penumbra=0.35 sun=0 | cassette | twohands | Round bells a little out with each other | keys
Shaken snow dome | Winter bells | near=Hills decay=2 release=1.6 repeats=2 tone=0.66 ground=.7 travel=.9 height=.7 company=.3 eyes=1 vibrato=.4 parallax=0.9 penumbra=0.45 sun=0.26 | shallows | attic | Round keys in a whirl of needles that will not settle | keys
Midnight, all the bells | Winter bells | near=Cliffs far=Cliffs decay=5 release=3 repeats=2 tone=0.54 ground=0.65 travel=.36 company=.8 eyes=1 height=.6 jag=.3 penumbra=0.2 sun=0.2 volume=0.5 | swellpad | peal | Bright bells in crowds, cliffs rising through all of them
Thaw in the bell chamber | Winter bells | far=Hills decay=3 release=1.6 repeats=3 parallax=.8 tone=0.4 ground=.6 wind=.5 company=.35 eyes=.8 travel=.34 penumbra=.4 sun=0.12 | backwards | lowtoll | Breathy hollow bells, one hill turning back in them
Owl answers the bell | Winter bells | near=Hills far=Hills attack=.05 decay=2.6 sustain=.15 release=3 repeats=1 tone=.42 ground=.8 wind=.4 vibrato=.45 eyes=.5 travel=.3 height=.6 penumbra=0.4 sun=0 | octcanon | lowtoll | Round soft strokes that keep a little breath
Bells through shutters | Winter bells | near=Pines far=Hills decay=12 release=9 repeats=4 tone=0.36 ground=.6 sun=.6 travel=.4 company=.5 eyes=.5 body=.4 height=.6 parallax=0.25 penumbra=0.1 | glacier | - | Nasal half hollow bells
Year turns over | Winter bells | near=Towers far=Cliffs decay=8 sustain=.2 release=8 repeats=5 tone=0.4 ground=.55 travel=.4 parallax=.67 company=.6 eyes=1 vibrato=.1 height=.7 | dissolve | lowtoll | Hollow bells that stay, one cliff climbing over them, one still
Whiteout | Winter bells | near=Hills decay=4 release=5 repeats=9 tone=0.36 ground=0.68 travel=.46 wind=0.5 penumbra=.5 company=.5 eyes=1 attack=.04 height=.8 parallax=0.8 volume=0 | mist | frost | Soft round strokes lost in breath and far needles
`,
    },
  ],
}
