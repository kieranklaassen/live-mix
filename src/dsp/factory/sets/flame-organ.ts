import { type InstrumentSet } from './set'

// Each direction is ten corners of the instrument, five presets to a corner: a tube
// and a fuel, where the flame stands and how late it answers (so which harmonic sings),
// how it is lit and how it goes out. A third of the chains are dry or one small room;
// the rest are there for what the sound does, and no chain has two long reverbs.

export const SET: InstrumentSet = {
  device: 'flame-organ',
  names: {
    tube: ['Open', 'Half closed', 'Flared', 'Narrow', 'Double'],
    fuel: ['Gas', 'Candle', 'Spirit', 'Coal'],
  },
  chains: {
    // Dry and close.
    bare: { effects: [{ deviceId: 'ambient-eq', preset: 'Open' }], words: ', dry and close' },
    warmdry: { effects: [{ deviceId: 'ambient-eq', preset: 'Warm' }], words: ', warm and dry' },
    shaded: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Shaded' }],
      words: ', dry, its top shaded',
    },
    thinned: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Thin' }],
      words: ', dry and thinned below',
    },
    deepdry: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Deep' },
        { deviceId: 'spread', preset: 'Firm bass' },
      ],
      words: ', deep and dry',
    },
    wide: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', dry and wide',
    },
    airy: {
      effects: [{ deviceId: 'spread', preset: 'Firm and airy' }],
      words: ', firm below and open above',
    },
    hazyedge: {
      effects: [{ deviceId: 'spread', preset: 'Hazy edges' }],
      words: ', dry with hazy edges',
    },
    glued: {
      effects: [
        { deviceId: 'ambient-comp', preset: 'Glue' },
        { deviceId: 'ambient-eq', preset: 'Keys' },
      ],
      words: ', held together and dry',
    },
    long_hold: {
      effects: [{ deviceId: 'ambient-comp', preset: 'Long sustain' }],
      words: ', dry, its tail held up',
    },
    mike: {
      effects: [{ deviceId: 'distance', preset: 'Close mic' }],
      words: ', right at the microphone',
    },
    steps: {
      effects: [{ deviceId: 'distance', preset: 'A few steps back' }],
      words: ', a few steps away',
    },
    booth: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.25 } }],
      words: 'in a small booth',
    },
    chamber: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.24 } }],
      words: 'in a tight chamber',
    },
    shortair: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.3 } }],
      words: 'with a short air behind it',
    },
    tiles: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.24 } }],
      words: 'in a tiled room',
    },
    parlour: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.22 } }],
      words: 'in an ordinary room',
    },
    double: {
      effects: [{ deviceId: 'stereo-detune', preset: 'Soft halo' }],
      words: ', doubled a few cents apart',
    },
    thick: {
      effects: [
        { deviceId: 'stereo-detune', preset: 'Thickener' },
        { deviceId: 'ambient-eq', preset: 'Warm' },
      ],
      words: ', thickened and close',
    },
    tails: {
      effects: [
        { deviceId: 'lift', preset: 'Long tails', params: { amount: 0.5 } },
        { deviceId: 'ether-reverb', preset: 'Faint air' },
      ],
      words: 'with its tails brought up',
    },
    breathy: {
      effects: [{ deviceId: 'reveal', preset: 'Breath' }],
      words: 'with its breath brought up',
    },
    warmbody: {
      effects: [{ deviceId: 'reveal', preset: 'Warm body' }],
      words: 'with its body brought forward',
    },
    puffs: {
      effects: [{ deviceId: 'sift', preset: 'Soft puffs' }],
      words: ', its onsets softened to puffs',
    },
    strikes: {
      effects: [{ deviceId: 'sift', preset: 'Strikes forward' }],
      words: ', its onsets pushed forward',
    },
    feltair: {
      effects: [
        { deviceId: 'sift', preset: 'Felt and air' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.15 } },
      ],
      words: 'with felt laid over its onsets',
    },
    bowed: {
      effects: [
        { deviceId: 'swell', preset: 'Bowed' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', each note drawn in as by a bow',
    },
    // Bodies it is played inside.
    pipe: {
      effects: [{ deviceId: 'vessel', preset: 'Inside a pipe', params: { mix: 0.45 } }],
      words: 'inside a longer pipe',
    },
    bottle: {
      effects: [{ deviceId: 'vessel', preset: 'Blown bottle', params: { mix: 0.5 } }],
      words: 'blown across a bottle',
    },
    cistern: {
      effects: [{ deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.45 } }],
      words: 'in a cistern',
    },
    kettle: {
      effects: [{ deviceId: 'vessel', preset: 'Kettle', params: { mix: 0.45 } }],
      words: 'in a kettle',
    },
    clay: {
      effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.5 } }],
      words: 'in a clay pot',
    },
    woodbox: {
      effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.45 } }],
      words: 'in a wooden body',
    },
    shell: {
      effects: [
        { deviceId: 'vessel', preset: 'Whispering shell', params: { mix: 0.4 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.15 } },
      ],
      words: 'in a whispering shell',
    },
    roundvowel: {
      effects: [
        { deviceId: 'imprint', preset: 'Round vowel', params: { amount: 0.8 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', shaped to a round vowel',
    },
    openvowel: {
      effects: [
        { deviceId: 'imprint', preset: 'Open vowel', params: { amount: 0.8 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: ', shaped to an open vowel',
    },
    hollow: {
      effects: [{ deviceId: 'imprint', preset: 'Hollow tube', params: { amount: 0.8 } }],
      words: ', shaped by a hollow tube',
    },
    giant: {
      effects: [
        { deviceId: 'size', preset: 'Giant' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'in a giant body',
    },
    smaller: {
      effects: [{ deviceId: 'size', preset: 'Smaller' }],
      words: 'in a body made smaller',
    },
    // Drive, loudspeakers and the wear of a medium.
    valve: {
      effects: [{ deviceId: 'analog-drive', preset: 'Triode glow' }],
      words: ', glowing in a valve',
    },
    iron: {
      effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }],
      words: ', weighted through iron',
    },
    tapeweight: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Tape weight' },
        { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.12 } },
      ],
      words: 'with the weight of tape',
    },
    melted: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Iron melt', params: { mix: 0.6 } },
        { deviceId: 'ambient-eq', preset: 'Shaded' },
      ],
      words: ', driven until the iron softens',
    },
    preamp: {
      effects: [
        { deviceId: 'saturator', preset: 'Tube preamp', params: { mix: 0.5 } },
        { deviceId: 'ambient-eq', preset: 'Shaded' },
      ],
      words: ', driven with the top rubbed off',
    },
    folded: {
      effects: [
        { deviceId: 'saturator', preset: 'Folded glass', params: { mix: 0.3 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
      ],
      words: ', folded over a small plate',
    },
    combo: {
      effects: [{ deviceId: 're-amp', preset: 'Combo in a room' }],
      words: 'from a small amplifier',
    },
    pillow: {
      effects: [{ deviceId: 're-amp', preset: 'Pillow speaker' }],
      words: 'from under a pillow',
    },
    downhall: {
      effects: [{ deviceId: 're-amp', preset: 'Down the hall' }],
      words: 'from a speaker down the hall',
    },
    cupboard: {
      effects: [{ deviceId: 're-amp', preset: 'In the cupboard' }],
      words: 'from inside a cupboard',
    },
    reel: {
      effects: [{ deviceId: 'tape', preset: 'Quarter inch' }],
      words: 'on a steady reel of tape',
    },
    thump: {
      effects: [{ deviceId: 'tape', preset: 'Warm thump' }],
      words: 'on tape with a warm thump',
    },
    seasick: {
      effects: [{ deviceId: 'tape', preset: 'Seasick', params: { mix: 0.8 } }],
      words: 'on tape that sways',
    },
    wornreel: {
      effects: [
        { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: 'on worn tape',
    },
    cassette: {
      effects: [{ deviceId: 'patina', preset: 'Worn cassette' }],
      words: 'on a worn cassette',
    },
    shelf: {
      effects: [
        { deviceId: 'patina', preset: 'Kitchen radio' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'from a radio in the kitchen',
    },
    record: {
      effects: [{ deviceId: 'vinyl', preset: 'Slow platter' }],
      words: 'on a record that turns unevenly',
    },
    glaze: {
      effects: [{ deviceId: 'vintage-digital', preset: 'Glaze' }],
      words: 'under a twelve bit glaze',
    },
    dusty: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Dusty', params: { mix: 0.6 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
      ],
      words: ', crumbling a little at the edges',
    },
    nightradio: {
      effects: [{ deviceId: 'radio', preset: 'Night shortwave', params: { mix: 0.55 } }],
      words: 'through a night-time radio',
    },
    pane: {
      effects: [{ deviceId: 'low-bitrate', preset: 'Behind glass', params: { mix: 0.65 } }],
      words: ', swirling as if behind a pane',
    },
    papery: {
      effects: [{ deviceId: 'buzzing-bridge', preset: 'Paper edge', params: { mix: 0.35 } }],
      words: 'against an edge of paper',
    },
    shells: {
      effects: [
        { deviceId: 'buzzing-bridge', preset: 'Three shells', params: { mix: 0.35 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: 'with loose shells that rattle',
    },
    feedback: {
      effects: [{ deviceId: 'howl', preset: 'Faint sustain' }],
      words: ', held up by faint feedback',
    },
    dustbed: {
      effects: [
        { deviceId: 'noise-floor', preset: 'Old record', params: { level: -50 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: 'over the crackle of an old record',
    },
    hiss: {
      effects: [
        { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -52 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'over a floor of tape hiss',
    },
    // Movement.
    slowchorus: {
      effects: [{ deviceId: 'chorus', preset: 'Slow drift' }],
      words: 'in a slow chorus',
    },
    ensemble: {
      effects: [
        { deviceId: 'chorus', preset: 'Lush ensemble' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', spread to an ensemble',
    },
    swirl: {
      effects: [{ deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.45 } }],
      words: 'in a slow swirl',
    },
    glacial: {
      effects: [
        { deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.5 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: 'under a sweep as slow as ice',
    },
    comb: {
      effects: [{ deviceId: 'flanger', preset: 'Glacial drift', params: { mix: 0.4 } }],
      words: 'through a comb that hardly moves',
    },
    trading: {
      effects: [{ deviceId: 'tremolo', preset: 'Harmonic shimmer' }],
      words: ', its bright and dark halves trading',
    },
    amptrem: {
      effects: [
        { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.5 } },
        { deviceId: 'spring-reverb', preset: 'Hint of spring' },
      ],
      words: 'under a steady tremolo',
    },
    swellsea: {
      effects: [
        { deviceId: 'tremolo', preset: 'Sea swell' },
        { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.22 } },
      ],
      words: 'on a long sea swell',
    },
    rotor: {
      effects: [{ deviceId: 'rotary', preset: 'Chorale' }],
      words: 'through a slow rotating horn',
    },
    fastrotor: {
      effects: [
        { deviceId: 'rotary', preset: 'Soft blend', params: { speed: 1 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'through a fast rotating horn',
    },
    currents: {
      effects: [{ deviceId: 'currents', preset: 'Slow water' }],
      words: ', its bands drifting like water',
    },
    tide: {
      effects: [
        { deviceId: 'currents', preset: 'Wide tide' },
        { deviceId: 'fdn-reverb', preset: 'Thin veil' },
      ],
      words: 'on a wide tide',
    },
    glimmer: {
      effects: [{ deviceId: 'glimmer', preset: 'Light on water' }],
      words: 'glinting tone by tone',
    },
    throb: { effects: [{ deviceId: 'pulses', preset: 'Soft throb' }], words: 'in a soft throb' },
    weave: {
      effects: [
        { deviceId: 'pulses', preset: 'Wide weave' },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', woven in two pulses',
    },
    midbeat: {
      effects: [{ deviceId: 'band-pulse', preset: 'Three a second' }],
      words: 'with its middle beating in threes',
    },
    breathing: {
      effects: [{ deviceId: 'breath', preset: 'Calm breath', params: { depth: 0.35 } }],
      words: ', opening and closing like a breath',
    },
    circle: {
      effects: [{ deviceId: 'around', preset: 'Slow circle' }],
      words: ', carried round the listener',
    },
    pendulum: {
      effects: [
        { deviceId: 'around', preset: 'Wide pendulum' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', swung from side to side',
    },
    flock: {
      effects: [{ deviceId: 'murmuration', preset: 'Evening flock' }],
      words: 'in a flock of its own voices',
    },
    latesway: {
      effects: [
        { deviceId: 'late-vibrato', preset: 'Slow bow' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'with a sway that comes late',
    },
    singer: {
      effects: [
        { deviceId: 'late-vibrato', preset: 'Singer' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: "with a singer's late vibrato",
    },
    shutting: {
      effects: [
        {
          deviceId: 'auto-filter',
          preset: 'Low-pass gate',
          params: { cutoffHz: 400, envAmount: 60, envReleaseMs: 900 },
        },
      ],
      words: 'through a filter that shuts as it fades',
    },
    icefilter: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: 'under a filter as slow as ice',
    },
    notch: {
      effects: [{ deviceId: 'auto-filter', preset: 'Slow notch' }],
      words: 'with a notch moving through it',
    },
    slowing: {
      effects: [{ deviceId: 'winding-down', preset: 'Four slowing', params: { depth: 0.5 } }],
      words: 'in pulses that seem to slow',
    },
    earbeat: {
      effects: [{ deviceId: 'ear-shift', preset: 'One, wide band' }],
      words: ', a slow beat between the ears',
    },
    // Echoes, in time and loose.
    dotted: {
      effects: [{ deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.26 } }],
      words: 'in dotted tape echoes',
    },
    trail: {
      effects: [{ deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.28 } }],
      words: 'with a long dark trail of echo',
    },
    heads: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.26 } },
        { deviceId: 'plate-reverb', preset: 'Faint sheen' },
      ],
      words: 'answered by three tape heads',
    },
    slap: {
      effects: [{ deviceId: 'analog-delay', preset: 'Slapback' }],
      words: 'with one quick slap',
    },
    darkecho: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.28 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'with dark echoes',
    },
    hops: {
      effects: [{ deviceId: 'analog-delay', preset: 'Octave hop', params: { mix: 0.28 } }],
      words: ', its echoes hopping by octaves',
    },
    stars: {
      effects: [{ deviceId: 'constellation', preset: 'Scattered seven' }],
      words: ', scattered in seven loose echoes',
    },
    bounces: {
      effects: [
        { deviceId: 'skipping-stone', preset: 'Slowing bounces' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: 'with bounces that slow down',
    },
    skips: {
      effects: [{ deviceId: 'skipping-stone', preset: 'Skipping stone' }],
      words: ', skipping off like a stone',
    },
    canon: {
      effects: [
        { deviceId: 'canon', preset: 'Faint answer' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.18 } },
      ],
      words: ', answered in a faint canon',
    },
    fan: {
      effects: [{ deviceId: 'prism', preset: 'Low to high' }],
      words: ', each echo fanned low to high',
    },
    sparkup: {
      effects: [{ deviceId: 'grain-delay', preset: 'Crystals', params: { mix: 0.24 } }],
      words: 'throwing pieces an octave up',
    },
    sinking: {
      effects: [
        { deviceId: 'grain-delay', preset: 'Falling embers', params: { mix: 0.26 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', its echoes falling like embers',
    },
    backwards: {
      effects: [{ deviceId: 'reverse-delay', preset: 'Backwards echo', params: { mix: 0.35 } }],
      words: ', its echoes played backwards',
    },
    recall: {
      effects: [{ deviceId: 'echo-memory', preset: 'Recalling' }],
      words: ', remembered a moment later',
    },
    orbit: {
      effects: [{ deviceId: 'orbits', preset: 'Two voices', params: { mix: 0.35 } }],
      words: 'in two loops that drift apart',
    },
    loop: {
      effects: [{ deviceId: 'tape-loop', preset: 'Slow fade', params: { mix: 0.4 } }],
      words: 'laid over a worn loop',
    },
    bed: {
      effects: [{ deviceId: 'micro-looper', preset: 'Soft bed' }],
      words: 'over a bed of itself',
    },
    // Plates, springs, rooms and halls.
    plate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.28 } }],
      words: 'on a long plate',
    },
    darkplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.28 } }],
      words: 'on a dark plate',
    },
    sheen: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.26 } }],
      words: 'on a bright plate',
    },
    springs: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.26 } }],
      words: 'into two springs',
    },
    slack: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Slack and strange', params: { mix: 0.3 } }],
      words: 'into slack springs',
    },
    hall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.28 } }],
      words: 'in a hall',
    },
    darkhall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.32 } }],
      words: 'in a dark hall',
    },
    nave: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.3 } }],
      words: 'in a vast nave',
    },
    far: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.58 } }],
      words: 'from far away',
    },
    cave: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.32 } }],
      words: 'in a dark cave',
    },
    valley: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.32 } }],
      words: 'across an open valley',
    },
    breathhall: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.38 } }],
      words: 'in a hall that breathes',
    },
    openspace: {
      effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.32 } }],
      words: 'in a wide open space',
    },
    crypt: {
      effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.34 } }],
      words: 'under a low stone roof',
    },
    tunnel: {
      effects: [{ deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.36 } }],
      words: 'along a narrow tunnel',
    },
    cavern: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.3 } }],
      words: 'in a cavern of small echoes',
    },
    shaft: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Mine shaft', params: { mix: 0.3 } }],
      words: 'down a mine shaft',
    },
    stairwell: {
      effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
      words: 'down a stone stairwell',
    },
    nextdoor: {
      effects: [{ deviceId: 'distance', preset: 'Next door' }],
      words: 'through the wall from next door',
    },
    outdoors: {
      effects: [{ deviceId: 'distance', preset: 'Open air' }],
      words: 'out in the open air',
    },
    shore: { effects: [{ deviceId: 'distance', preset: 'Far shore' }], words: 'from a far shore' },
    gated: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.32 } }],
      words: 'in a room that stops short',
    },
    rising: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Long rise', params: { mix: 0.36 } }],
      words: 'into a tail that rises',
    },
    mist: { effects: [{ deviceId: 'fog', preset: 'Morning mist' }], words: ', blurred in mist' },
    noattack: {
      effects: [
        { deviceId: 'fog', preset: 'No attack' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.18 } },
      ],
      words: 'with every onset blurred away',
    },
    frozen: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Soft freeze', params: { mix: 0.32 } }],
      words: 'into a tail half frozen',
    },
    // Halls that sing, climb and answer.
    faintshim: {
      effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer' }],
      words: 'under a faint octave shimmer',
    },
    fifthshim: {
      effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { mix: 0.32 } }],
      words: ', fifths rising behind it',
    },
    undertow: {
      effects: [{ deviceId: 'shimmer', preset: 'Undertow', params: { mix: 0.34 } }],
      words: ', its tail sinking by octaves',
    },
    glow: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Faint glow' }],
      words: 'in a tail that slowly glows',
    },
    winter: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Winter drift', params: { mix: 0.32 } }],
      words: 'in a cold drifting tail',
    },
    ascent: {
      effects: [{ deviceId: 'spiral', preset: 'Slow ascent', params: { mix: 0.32 } }],
      words: 'in a tail that always climbs',
    },
    descent: {
      effects: [{ deviceId: 'spiral', preset: 'Slow descent', params: { mix: 0.32 } }],
      words: 'in a tail that always sinks',
    },
    choirhall: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.3 } }],
      words: ', a hall singing ah behind',
    },
    monks: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.34 } }],
      words: ', low voices in the hall',
    },
    oohall: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.34 } }],
      words: ', a dark oo behind it',
    },
    hazewall: {
      effects: [{ deviceId: 'haze', preset: 'Thin veil' }],
      words: 'behind a thin glowing haze',
    },
    wool: {
      effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.35 } }],
      words: 'under a wool blanket of fuzz',
    },
    strings: {
      effects: [{ deviceId: 'sympathetic', preset: 'Long ring', params: { mix: 0.32 } }],
      words: 'with strings ringing along',
    },
    keysheld: {
      effects: [{ deviceId: 'silent-keys', preset: 'Open fifth and bass', params: { mix: 0.38 } }],
      words: 'over a fifth held down in silence',
    },
    bowls: {
      effects: [{ deviceId: 'bowls', preset: 'Low fifths', params: { root: 2, mix: 0.28 } }],
      words: 'beside bowls tuned in fifths',
    },
    // Clouds, freezes and second voices.
    cloud: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.38 } }],
      words: 'in a soft cloud of grains',
    },
    smear: {
      effects: [
        { deviceId: 'grain-cloud', preset: 'Slow smear', params: { mix: 0.4 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.18 } },
      ],
      words: 'in a slow smear of grains',
    },
    shards: {
      effects: [
        { deviceId: 'grain-cloud', preset: 'Glass shards', params: { mix: 0.32 } },
        { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.2 } },
      ],
      words: 'with grains like broken glass',
    },
    hanging: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist' }],
      words: ', smeared to a hanging mist',
    },
    glasshalo: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.38 } }],
      words: 'with a smear of glass round it',
    },
    drifting: {
      effects: [{ deviceId: 'spectral-drifter', preset: 'Scatter', params: { mix: 0.32 } }],
      words: ', shifted pieces drifting off',
    },
    marbles: {
      effects: [{ deviceId: 'cascade', preset: 'Dropped marbles', params: { mix: 0.32 } }],
      words: ', its pieces spilling like marbles',
    },
    stack: {
      effects: [
        { deviceId: 'cascade', preset: 'Octave stack', params: { mix: 0.3 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.16 } },
      ],
      words: ', its loops stacked in octaves',
    },
    sparks: {
      effects: [{ deviceId: 'glints', preset: 'First light' }],
      words: 'with sparks above it',
    },
    dustlight: {
      effects: [
        { deviceId: 'glints', preset: 'Faint dust' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: 'with a faint dust of sparks',
    },
    leaves: {
      effects: [{ deviceId: 'falling', preset: 'Falling leaves' }],
      words: ', pieces of it falling like leaves',
    },
    risingmist: {
      effects: [{ deviceId: 'falling', preset: 'Rising mist' }],
      words: ', pieces of it rising like mist',
    },
    wax: {
      effects: [{ deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.34 } }],
      words: 'with a tail that sags like wax',
    },
    stretched: {
      effects: [{ deviceId: 'stretch', preset: 'Slow cloud', params: { mix: 0.38 } }],
      words: ', stretched into a slow cloud',
    },
    halo: {
      effects: [{ deviceId: 'sustainer', preset: 'Thin halo' }],
      words: 'with a thin held halo',
    },
    lingering: {
      effects: [{ deviceId: 'sine-shadow', preset: 'Long linger', params: { mix: 0.38 } }],
      words: 'with pure tones lingering after',
    },
    cellos: {
      effects: [{ deviceId: 'pad-follower', preset: 'Dark cellos', params: { mix: 0.34 } }],
      words: 'with a dark pad behind',
    },
    dissolve: {
      effects: [{ deviceId: 'generations', preset: 'Slow dissolve', params: { mix: 0.38 } }],
      words: 'dissolving into its own room',
    },
    halved: {
      effects: [{ deviceId: 'half-speed', preset: 'Smooth octave', params: { mix: 0.36 } }],
      words: 'over itself at half speed',
    },
    subbed: {
      effects: [{ deviceId: 'octaves', preset: 'Sub octave' }],
      words: 'with an octave added below',
    },
    pipes: {
      effects: [
        { deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.45 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.18 } },
      ],
      words: 'with flute stops drawn behind it',
    },
    beating: {
      effects: [{ deviceId: 'freq-shifter', preset: 'Still water', params: { mix: 0.42 } }],
      words: ', its tones beating slowly',
    },
    fifthring: {
      effects: [
        { deviceId: 'ring', preset: 'Fifth halo', params: { mix: 0.22 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.18 } },
      ],
      words: 'with a metal halo of fifths',
    },
    chimed: {
      effects: [{ deviceId: 'warp', preset: 'Soft chime', params: { mix: 0.45 } }],
      words: ', half of it bent to a chime',
    },
    whistled: {
      effects: [
        { deviceId: 'overtone-singer', preset: 'Faint melody' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.18 } },
      ],
      words: ', a whistled overtone moving over it',
    },
    common: {
      effects: [
        { deviceId: 'common-tones', preset: 'Light touch' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.18 } },
      ],
      words: ', the tones it keeps hanging on',
    },
    padfifth: {
      effects: [
        { deviceId: 'pitch-shifter', preset: 'Pad fifth', params: { mix: 0.28 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'with a fifth shifted up behind it',
    },
    rain: {
      effects: [{ deviceId: 'weather', preset: 'Light rain', params: { voice: 0.3 } }],
      words: 'out in light rain',
    },
    wind: {
      effects: [{ deviceId: 'weather', preset: 'Breezy day', params: { voice: 0.3 } }],
      words: 'on a breezy day',
    },
    diver: {
      effects: [{ deviceId: 'underwater', preset: 'Just under', params: { mix: 0.75 } }],
      words: 'just under water',
    },
    frost: {
      effects: [{ deviceId: 'seasons', preset: 'First frost', params: { mix: 0.65 } }],
      words: 'in the first frost',
    },
    evening: {
      effects: [{ deviceId: 'seasons', preset: 'Long evening', params: { mix: 0.6 } }],
      words: 'in a long summer evening',
    },
  },
  phrases: {
    lamps: {
      notes: [
        { atSec: 0, durSec: 3.6, note: 50, gain: 0.7 },
        { atSec: 0, durSec: 7.2, note: 57, gain: 0.5 },
        { atSec: 0, durSec: 7.2, note: 65, gain: 0.55 },
        { atSec: 0, durSec: 3.6, note: 72, gain: 0.55 },
        { atSec: 0, durSec: 3.6, note: 76, gain: 0.45 },
        { atSec: 3.6, durSec: 3.6, note: 43, gain: 0.7 },
        { atSec: 3.6, durSec: 3.6, note: 71, gain: 0.5 },
        { atSec: 3.6, durSec: 3.6, note: 74, gain: 0.45 },
      ],
    },
    still: {
      notes: [
        { atSec: 0, durSec: 7.3, note: 38, gain: 0.7 },
        { atSec: 0, durSec: 7.3, note: 57, gain: 0.55 },
        { atSec: 0, durSec: 7.3, note: 60, gain: 0.5 },
        { atSec: 0, durSec: 7.3, note: 64, gain: 0.5 },
        { atSec: 0, durSec: 7.3, note: 67, gain: 0.45 },
      ],
    },
    suspend: {
      notes: [
        { atSec: 0, durSec: 7.3, note: 50, gain: 0.65 },
        { atSec: 0, durSec: 7.3, note: 57, gain: 0.5 },
        { atSec: 0, durSec: 2.4, note: 67, gain: 0.6 },
        { atSec: 1.2, durSec: 2.4, note: 72, gain: 0.5 },
        { atSec: 2.4, durSec: 2.4, note: 65, gain: 0.6 },
        { atSec: 3.6, durSec: 3.7, note: 71, gain: 0.5 },
        { atSec: 4.8, durSec: 2.5, note: 64, gain: 0.6 },
      ],
    },
    tenths: {
      notes: [
        { atSec: 0, durSec: 2.4, note: 41, gain: 0.7 },
        { atSec: 0, durSec: 2.4, note: 57, gain: 0.5 },
        { atSec: 0, durSec: 2.4, note: 64, gain: 0.5 },
        { atSec: 0, durSec: 2.4, note: 72, gain: 0.55 },
        { atSec: 2.4, durSec: 2.3, note: 43, gain: 0.7 },
        { atSec: 2.4, durSec: 2.3, note: 59, gain: 0.5 },
        { atSec: 2.4, durSec: 2.3, note: 62, gain: 0.5 },
        { atSec: 2.4, durSec: 2.3, note: 67, gain: 0.5 },
        { atSec: 4.7, durSec: 2.6, note: 45, gain: 0.7 },
        { atSec: 4.7, durSec: 2.6, note: 60, gain: 0.5 },
        { atSec: 4.7, durSec: 2.6, note: 65, gain: 0.5 },
        { atSec: 4.7, durSec: 2.6, note: 72, gain: 0.55 },
      ],
    },
    gather: {
      notes: [
        { atSec: 0, durSec: 7.3, note: 45, gain: 0.65 },
        { atSec: 0.9, durSec: 6.4, note: 52, gain: 0.5 },
        { atSec: 1.8, durSec: 5.5, note: 60, gain: 0.5 },
        { atSec: 2.7, durSec: 4.6, note: 67, gain: 0.5 },
        { atSec: 3.8, durSec: 3.5, note: 71, gain: 0.5 },
      ],
    },
    chorale: {
      notes: [
        { atSec: 0, durSec: 1.8, note: 45, gain: 0.65 },
        { atSec: 0, durSec: 3.6, note: 60, gain: 0.5 },
        { atSec: 0, durSec: 1.8, note: 64, gain: 0.5 },
        { atSec: 0, durSec: 3.6, note: 69, gain: 0.6 },
        { atSec: 1.8, durSec: 1.8, note: 41, gain: 0.65 },
        { atSec: 1.8, durSec: 1.8, note: 65, gain: 0.5 },
        { atSec: 3.6, durSec: 1.7, note: 43, gain: 0.65 },
        { atSec: 3.6, durSec: 1.7, note: 59, gain: 0.5 },
        { atSec: 3.6, durSec: 1.7, note: 62, gain: 0.5 },
        { atSec: 3.6, durSec: 1.7, note: 71, gain: 0.6 },
        { atSec: 5.3, durSec: 2, note: 48, gain: 0.65 },
        { atSec: 5.3, durSec: 2, note: 55, gain: 0.5 },
        { atSec: 5.3, durSec: 2, note: 64, gain: 0.5 },
        { atSec: 5.3, durSec: 2, note: 72, gain: 0.6 },
      ],
    },
    lowchoir: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 43, gain: 0.65 },
        { atSec: 0, durSec: 7.2, note: 50, gain: 0.5 },
        { atSec: 0, durSec: 3.6, note: 59, gain: 0.55 },
        { atSec: 0, durSec: 3.6, note: 64, gain: 0.5 },
        { atSec: 3.6, durSec: 3.6, note: 57, gain: 0.55 },
        { atSec: 3.6, durSec: 3.6, note: 60, gain: 0.5 },
      ],
    },
    single: { notes: [{ atSec: 0, durSec: 6.8, note: 57, gain: 0.75 }] },
    onehigh: {
      notes: [
        { atSec: 0, durSec: 4, note: 74, gain: 0.65 },
        { atSec: 4.2, durSec: 3, note: 69, gain: 0.55 },
      ],
    },
    song: {
      notes: [
        { atSec: 0, durSec: 1, note: 69, gain: 0.6 },
        { atSec: 1, durSec: 0.8, note: 72, gain: 0.65 },
        { atSec: 1.8, durSec: 0.7, note: 71, gain: 0.55 },
        { atSec: 2.5, durSec: 1.5, note: 67, gain: 0.65 },
        { atSec: 4.2, durSec: 0.9, note: 69, gain: 0.55 },
        { atSec: 5.1, durSec: 2.1, note: 64, gain: 0.65 },
      ],
    },
    shepherd: {
      notes: [
        { atSec: 0, durSec: 0.7, note: 62, gain: 0.6 },
        { atSec: 0.7, durSec: 0.5, note: 65, gain: 0.55 },
        { atSec: 1.2, durSec: 1.7, note: 69, gain: 0.7 },
        { atSec: 3.1, durSec: 0.4, note: 71, gain: 0.5 },
        { atSec: 3.5, durSec: 0.4, note: 72, gain: 0.5 },
        { atSec: 3.9, durSec: 1.2, note: 74, gain: 0.65 },
        { atSec: 5.2, durSec: 2, note: 69, gain: 0.6 },
      ],
    },
    duet: {
      notes: [
        { atSec: 0, durSec: 1.7, note: 65, gain: 0.5 },
        { atSec: 0, durSec: 1.7, note: 69, gain: 0.65 },
        { atSec: 1.7, durSec: 1.7, note: 62, gain: 0.5 },
        { atSec: 1.7, durSec: 1.7, note: 71, gain: 0.65 },
        { atSec: 3.4, durSec: 1.7, note: 60, gain: 0.5 },
        { atSec: 3.4, durSec: 1.7, note: 72, gain: 0.65 },
        { atSec: 5.1, durSec: 2.1, note: 57, gain: 0.5 },
        { atSec: 5.1, durSec: 2.1, note: 76, gain: 0.65 },
      ],
    },
    call: {
      notes: [
        { atSec: 0, durSec: 0.9, note: 62, gain: 0.65 },
        { atSec: 0.9, durSec: 1.5, note: 69, gain: 0.65 },
        { atSec: 1.6, durSec: 0.9, note: 74, gain: 0.45 },
        { atSec: 2.5, durSec: 1.6, note: 72, gain: 0.5 },
        { atSec: 4, durSec: 0.8, note: 65, gain: 0.6 },
        { atSec: 4.8, durSec: 2.3, note: 64, gain: 0.65 },
        { atSec: 5.6, durSec: 1.6, note: 71, gain: 0.4 },
      ],
    },
    highline: {
      notes: [
        { atSec: 0, durSec: 1.2, note: 81, gain: 0.55 },
        { atSec: 1.2, durSec: 1.4, note: 79, gain: 0.5 },
        { atSec: 2.6, durSec: 0.9, note: 76, gain: 0.55 },
        { atSec: 3.5, durSec: 1.8, note: 77, gain: 0.55 },
        { atSec: 5.5, durSec: 1.7, note: 72, gain: 0.5 },
      ],
    },
    ostinato: {
      notes: [
        { atSec: 0, durSec: 0.8, note: 57, gain: 0.6 },
        { atSec: 0.45, durSec: 0.8, note: 64, gain: 0.5 },
        { atSec: 0.9, durSec: 0.8, note: 60, gain: 0.5 },
        { atSec: 1.35, durSec: 0.8, note: 67, gain: 0.5 },
        { atSec: 1.8, durSec: 0.8, note: 57, gain: 0.6 },
        { atSec: 2.25, durSec: 0.8, note: 64, gain: 0.5 },
        { atSec: 2.7, durSec: 0.8, note: 60, gain: 0.5 },
        { atSec: 3.15, durSec: 0.8, note: 69, gain: 0.5 },
        { atSec: 3.6, durSec: 0.8, note: 55, gain: 0.6 },
        { atSec: 4.05, durSec: 0.8, note: 62, gain: 0.5 },
        { atSec: 4.5, durSec: 0.8, note: 59, gain: 0.5 },
        { atSec: 4.95, durSec: 0.8, note: 67, gain: 0.5 },
        { atSec: 5.4, durSec: 1.8, note: 53, gain: 0.65 },
        { atSec: 5.4, durSec: 1.8, note: 60, gain: 0.5 },
        { atSec: 5.4, durSec: 1.8, note: 69, gain: 0.5 },
      ],
    },
    rolled: {
      notes: [
        { atSec: 0, durSec: 2.6, note: 45, gain: 0.7 },
        { atSec: 0.12, durSec: 2.5, note: 52, gain: 0.55 },
        { atSec: 0.24, durSec: 2.4, note: 60, gain: 0.55 },
        { atSec: 0.36, durSec: 2.3, note: 67, gain: 0.55 },
        { atSec: 3, durSec: 3, note: 41, gain: 0.7 },
        { atSec: 3.12, durSec: 2.9, note: 57, gain: 0.55 },
        { atSec: 3.24, durSec: 2.8, note: 64, gain: 0.55 },
        { atSec: 3.36, durSec: 2.7, note: 67, gain: 0.5 },
      ],
    },
    taps: {
      notes: [
        { atSec: 0, durSec: 0.3, note: 69, gain: 0.7 },
        { atSec: 0.6, durSec: 0.3, note: 76, gain: 0.6 },
        { atSec: 1.2, durSec: 0.3, note: 72, gain: 0.6 },
        { atSec: 2.1, durSec: 0.3, note: 67, gain: 0.7 },
        { atSec: 2.7, durSec: 0.3, note: 74, gain: 0.6 },
        { atSec: 3.6, durSec: 0.3, note: 65, gain: 0.7 },
        { atSec: 3.9, durSec: 0.3, note: 69, gain: 0.55 },
        { atSec: 4.2, durSec: 1.4, note: 76, gain: 0.65 },
      ],
    },
    matches: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 50, gain: 0.75 },
        { atSec: 0.4, durSec: 0.3, note: 62, gain: 0.55 },
        { atSec: 0.8, durSec: 0.3, note: 69, gain: 0.6 },
        { atSec: 1.6, durSec: 0.5, note: 48, gain: 0.75 },
        { atSec: 2, durSec: 0.3, note: 60, gain: 0.55 },
        { atSec: 2.4, durSec: 0.3, note: 67, gain: 0.6 },
        { atSec: 3.2, durSec: 0.5, note: 45, gain: 0.75 },
        { atSec: 3.6, durSec: 0.3, note: 64, gain: 0.55 },
        { atSec: 4, durSec: 0.3, note: 72, gain: 0.6 },
        { atSec: 4.8, durSec: 1.6, note: 53, gain: 0.75 },
        { atSec: 4.8, durSec: 1.6, note: 69, gain: 0.5 },
      ],
    },
    toll: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 76, gain: 0.7 },
        { atSec: 1.1, durSec: 0.5, note: 69, gain: 0.7 },
        { atSec: 2.5, durSec: 0.5, note: 74, gain: 0.6 },
        { atSec: 3.2, durSec: 0.5, note: 67, gain: 0.6 },
        { atSec: 4.7, durSec: 0.6, note: 72, gain: 0.7 },
      ],
    },
    carillon: {
      notes: [
        { atSec: 0, durSec: 0.4, note: 84, gain: 0.55 },
        { atSec: 0.5, durSec: 0.4, note: 79, gain: 0.6 },
        { atSec: 1, durSec: 0.4, note: 81, gain: 0.55 },
        { atSec: 1.5, durSec: 0.4, note: 76, gain: 0.6 },
        { atSec: 2.4, durSec: 0.4, note: 84, gain: 0.5 },
        { atSec: 2.9, durSec: 0.4, note: 77, gain: 0.6 },
        { atSec: 3.4, durSec: 0.4, note: 79, gain: 0.55 },
        { atSec: 3.9, durSec: 1.2, note: 72, gain: 0.65 },
        { atSec: 3.9, durSec: 1.2, note: 64, gain: 0.5 },
      ],
    },
    peal: {
      notes: [
        { atSec: 0, durSec: 1.5, note: 64, gain: 0.65 },
        { atSec: 1, durSec: 1.5, note: 71, gain: 0.6 },
        { atSec: 2, durSec: 1.5, note: 69, gain: 0.6 },
        { atSec: 3.2, durSec: 2, note: 60, gain: 0.65 },
        { atSec: 4.2, durSec: 2, note: 76, gain: 0.5 },
      ],
    },
    walk: {
      notes: [
        { atSec: 0, durSec: 1.3, note: 38, gain: 0.75 },
        { atSec: 1.5, durSec: 1, note: 33, gain: 0.7 },
        { atSec: 2.7, durSec: 0.8, note: 36, gain: 0.7 },
        { atSec: 3.6, durSec: 1.2, note: 31, gain: 0.75 },
        { atSec: 5, durSec: 2.2, note: 38, gain: 0.75 },
      ],
    },
    pulse: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 38, gain: 0.75 },
        { atSec: 0.75, durSec: 0.3, note: 38, gain: 0.55 },
        { atSec: 1.5, durSec: 0.5, note: 45, gain: 0.65 },
        { atSec: 2.25, durSec: 0.5, note: 43, gain: 0.65 },
        { atSec: 3, durSec: 0.5, note: 36, gain: 0.75 },
        { atSec: 3.75, durSec: 0.3, note: 36, gain: 0.55 },
        { atSec: 4.5, durSec: 0.5, note: 43, gain: 0.65 },
        { atSec: 5.25, durSec: 1.8, note: 33, gain: 0.75 },
      ],
    },
    stride: {
      notes: [
        { atSec: 0, durSec: 1.3, note: 50, gain: 0.75 },
        { atSec: 1.5, durSec: 1, note: 45, gain: 0.7 },
        { atSec: 2.7, durSec: 0.8, note: 48, gain: 0.7 },
        { atSec: 3.6, durSec: 1.2, note: 43, gain: 0.75 },
        { atSec: 5, durSec: 2.2, note: 50, gain: 0.75 },
      ],
    },
    tread: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 50, gain: 0.75 },
        { atSec: 0.75, durSec: 0.3, note: 50, gain: 0.55 },
        { atSec: 1.5, durSec: 0.5, note: 57, gain: 0.65 },
        { atSec: 2.25, durSec: 0.5, note: 55, gain: 0.65 },
        { atSec: 3, durSec: 0.5, note: 48, gain: 0.75 },
        { atSec: 3.75, durSec: 0.3, note: 48, gain: 0.55 },
        { atSec: 4.5, durSec: 0.5, note: 55, gain: 0.65 },
        { atSec: 5.25, durSec: 1.8, note: 45, gain: 0.75 },
      ],
    },
    mooring: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 43, gain: 0.75 },
        { atSec: 1.6, durSec: 5.6, note: 50, gain: 0.5 },
        { atSec: 3.6, durSec: 3.4, note: 67, gain: 0.4 },
      ],
    },
    basin: {
      notes: [
        { atSec: 0, durSec: 7.3, note: 45, gain: 0.75 },
        { atSec: 1.2, durSec: 6, note: 57, gain: 0.5 },
        { atSec: 2.6, durSec: 4.6, note: 64, gain: 0.45 },
        { atSec: 4.2, durSec: 3, note: 72, gain: 0.4 },
      ],
    },
    widebass: {
      notes: [
        { atSec: 0, durSec: 2.3, note: 38, gain: 0.7 },
        { atSec: 0, durSec: 2.3, note: 65, gain: 0.4 },
        { atSec: 2.4, durSec: 2.3, note: 36, gain: 0.7 },
        { atSec: 2.4, durSec: 2.3, note: 64, gain: 0.4 },
        { atSec: 4.8, durSec: 2.5, note: 33, gain: 0.75 },
        { atSec: 4.8, durSec: 2.5, note: 60, gain: 0.4 },
      ],
    },
    pedal: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 36, gain: 0.75 },
        { atSec: 1.6, durSec: 5.6, note: 43, gain: 0.5 },
        { atSec: 3.6, durSec: 3.4, note: 60, gain: 0.4 },
      ],
    },
    ground: {
      notes: [
        { atSec: 0, durSec: 7.3, note: 38, gain: 0.75 },
        { atSec: 0, durSec: 7.3, note: 45, gain: 0.55 },
        { atSec: 1.6, durSec: 2.8, note: 69, gain: 0.45 },
        { atSec: 4.3, durSec: 2.9, note: 64, gain: 0.45 },
      ],
    },
    deep: {
      notes: [
        { atSec: 0, durSec: 7.3, note: 33, gain: 0.75 },
        { atSec: 1.2, durSec: 6, note: 45, gain: 0.5 },
        { atSec: 2.6, durSec: 4.6, note: 52, gain: 0.45 },
        { atSec: 4.2, durSec: 3, note: 60, gain: 0.4 },
      ],
    },
    fifths: {
      notes: [
        { atSec: 0, durSec: 7.3, note: 50, gain: 0.65 },
        { atSec: 0, durSec: 7.3, note: 57, gain: 0.55 },
        { atSec: 2.4, durSec: 4.8, note: 64, gain: 0.5 },
        { atSec: 4.4, durSec: 2.8, note: 71, gain: 0.4 },
      ],
    },
  },
  directions: [
    {
      id: 'warm-flame-pads',
      name: 'Warm flame pads',
      category: 'pad',
      rows: `
Lamplighter's round | Warm flame pad | mouth=0.35 tube=Narrow catch=1.2 embers=3 lift=0 secondFlame=0.35 between=0.2 draught=0.07 flicker=0.1 roar=0.2 glass=0.2 width=0.49 lag=0.43 place=0.28 | hall | gather | Narrow gas flames caught slowly, two to a key and locked to one clear tone
Unhurried supper | Warm flame pad | burn=17 flame=0.2 catch=0.7 mouth=0.35 lift=0.15 roar=0.1 width=0.4 draught=0.03 flicker=0.01 glass=0.01 secondFlame=0.16 between=0.14 lag=0.23 place=0.17 volume=0.5 | parlour | tenths | Low gas flames burning small, almost a pure tone, half covered and near
Windows across the bay | - | flame=0.65 catch=2.2 embers=5 mouth=0.7 draught=0.45 lift=0.25 width=1 flicker=0.03 roar=0.25 glass=0 secondFlame=0.19 between=0.75 lag=0.39 place=0.14 volume=-1.5 | valley | gather | Tall gas flames in open tubes, wide and bright, leaning slowly in the air
Velvet rope | - | place=0.3 flame=0.5 catch=0.9 mouth=0.2 flicker=0.1 secondFlame=0.5 between=0.35 draught=0.15 roar=0.03 glass=0.24 width=0.47 lift=0.16 lag=0.29 | darkplate | suspend | Covered gas flames set high in open tubes, dark and slightly doubled
Pilot lights | - | flame=0.12 lag=0.3 catch=1.6 roar=0.05 mouth=0.8 lift=0.3 secondFlame=0 embers=4 draught=0.09 flicker=0.09 glass=0.2 width=0.59 | faintshim | still | Pilot flames barely burning, single and clear, some lifting by themselves
Arches at low tide | Warm flame pad | tube=Half_closed flame=0.5 catch=1 mouth=0.5 embers=2.5 draught=0.35 flicker=0.17 roar=0.16 glass=0.19 width=0.5 secondFlame=0.25 between=0.73 lift=0.15 lag=0.15 place=0.27 | crypt | lamps | Gas in half closed tubes, a round hollow chord with no shine on it
Cloth over the lantern | - | burn=18 tube=Half_closed place=0.28 mouth=0.03 catch=0.8 flicker=0.4 roar=0.05 secondFlame=0 draught=0.29 width=0.76 lift=0.14 lag=0.29 | pillow | chorale | Muffled gas in half closed tubes, flickering faintly, only its lowest tone left
Reedbed at noon | - | tube=Half_closed flame=0.85 place=0.08 mouth=0.75 catch=0.5 lift=0.1 secondFlame=0.4 between=0.5 width=0.8 draught=0.26 flicker=0.22 roar=0.12 glass=0.18 lag=0.31 | slowchorus | tenths | Tall gas flames low in half closed tubes, reedy odd harmonics slipping in pairs
Kindly uncle | - | tube=Half_closed fuel=Candle flame=0.6 mouth=0.8 catch=0.6 roar=0.2 embers=1.2 draught=0.01 flicker=0.09 glass=0.21 width=0.52 secondFlame=0.27 between=0.43 lift=0.17 lag=0.24 place=0.21 | woodbox | chorale | Candles in half closed tubes with the mouth wide open, a mild woody chord
Quarry lake | - | tube=Half_closed flame=0.4 lag=0.12 place=0.36 catch=2.8 embers=7 draught=0.6 lift=0.2 mouth=0.55 flicker=0.13 roar=0.06 glass=0.14 width=0.64 secondFlame=0.2 between=0.02 | cave | still | Hollow gas tones that take three seconds to swell and lean with a slow draught
Boiler room hymn | Warm flame pad | tube=Double flame=0.7 catch=0.5 mouth=0.45 roar=0.35 embers=1.2 draught=0.3 flicker=0.39 glass=0.2 width=0.74 secondFlame=0.28 between=0.51 lift=0.16 lag=0.14 place=0.26 | chamber | chorale | Double tubes of gas, an octave deep, the burners rushing underneath
Cathedral mice | - | tube=Double flame=0.15 place=0.35 catch=1.3 mouth=0.6 lift=0.1 roar=0.05 embers=5 secondFlame=0.7 between=0 draught=0 flicker=0.01 glass=0.12 width=0.52 lag=0.25 volume=-12 | nave | gather | Small gas flames in double tubes, locked in twos, deep below and quiet above
Harbour before light | - | tube=Double flame=0.45 mouth=0.18 catch=1.8 draught=0.7 secondFlame=0.3 embers=6 flicker=0.3 roar=0.11 glass=0.07 width=0.88 between=0.32 lift=0.17 lag=0.25 place=0.24 volume=-10 | shore | lowchoir | Covered double tubes that gather slowly and lean with a heavy draught
Woollen octave | Slow weather | secondFlame=0.25 catch=0.8 embers=2 fuel=Candle mouth=0.75 draught=0.2 flicker=0.2 glass=0.14 width=0.83 between=0.67 lift=0.12 lag=0.4 place=0.17 volume=-5 | wool | tenths | Candles in double tubes, soft in both octaves and slow to speak
Standing in the doorway | - | tube=Double fuel=Spirit flame=0.3 mouth=0.1 catch=0.9 roar=0.08 secondFlame=0.3 between=0.48 draught=0.14 flicker=0.3 glass=0.06 width=1 lift=0.19 lag=0.31 place=0.16 | steps | suspend | Covered spirit flames in double tubes, two to a key and slowly beating
Beeswax and linen | Candle flute | burn=20 flame=0.5 catch=0.7 secondFlame=0.3 between=0.3 mouth=0.9 lift=0 embers=2.5 width=0.6 draught=0.04 flicker=0.06 glass=0.08 lag=0.28 place=0.36 volume=6 | plate | chorale | Candles in narrow tubes, soft and nearly pure, two flames slipping gently
Fogged up windows | Candle flute | flame=0.3 roar=0.6 catch=1 embers=3 mouth=0.7 flicker=0.5 lift=0.2 width=0.8 draught=0.23 lag=0.11 place=0.36 volume=-1.5 | mist | lamps | Narrow candles with the rush of their breath around them, flickering
Third landing | - | tube=Narrow flame=0.55 lag=0.28 catch=1.4 mouth=0.65 secondFlame=0.7 between=0.4 lift=0 draught=0.15 flicker=0 roar=0.03 glass=0.14 width=0.53 volume=-2 | stairwell | gather | Gas in narrow tubes, two flames each, pure tones that slip against each other
Lace and lamp oil | - | tube=Narrow flame=0.35 place=0.4 catch=0.6 mouth=0.9 lift=0.45 roar=0.12 embers=3.5 width=1 draught=0.13 flicker=0.18 glass=0.14 secondFlame=0.26 between=0.06 lag=0.3 | glimmer | suspend | Narrow tubes open at the mouth, thin gas tones lifting in and out
Snow settling overhead | - | tube=Narrow fuel=Spirit flame=0.22 mouth=0.45 catch=2 embers=8 draught=0.1 flicker=0 lift=0 secondFlame=0.25 roar=0.09 glass=0.09 width=0.78 between=0.17 lag=0.4 place=0.23 volume=-2 | frozen | still | Small spirit flames in narrow tubes, pure and steady, slow to swell
Paper windbreak | - | tube=Flared flame=0.35 mouth=0.4 catch=1.2 roar=0.12 lift=0.1 embers=3 secondFlame=0.5 between=0.25 draught=0.01 flicker=0.22 glass=0.21 width=0.77 lag=0.4 place=0.23 volume=-0.5 | warmdry | lamps | Gas in flared tubes, thin below and bright, kept soft by a small flame
Vents in a pavement | Roaring drone | roar=0.6 catch=1 flame=0.4 mouth=0.35 draught=0.55 embers=2.5 flicker=0.21 glass=0.15 width=0.46 secondFlame=0.06 between=0.26 lift=0.17 lag=0.22 place=0.23 volume=1.5 | outdoors | suspend | Flared gas with more rush than tone, leaning like air over a grating
Pale brass morning | - | tube=Flared flame=0.6 place=0.32 mouth=0.3 catch=0.8 lift=0 flicker=0.15 secondFlame=0.35 between=0.15 draught=0.01 roar=0.17 glass=0.22 width=0.56 lag=0.15 volume=-0.5 | hall 1.mix=0.22 | tenths | Flared tubes with tall gas flames half covered, a pale brass chord, locked
Gauze curtain | - | tube=Flared fuel=Candle flame=0.5 mouth=0.5 catch=1.5 roar=0.3 lift=0.25 embers=4 draught=0.4 width=0.9 flicker=0.25 glass=0.21 secondFlame=0.08 between=0.67 lag=0.38 place=0.11 volume=-10 | cloud | gather | Candles in flared tubes, airy and faint below, leaning in a light draught
Sparrows in the eaves | - | tube=Flared lag=0.1 place=0.12 flame=0.3 catch=0.6 mouth=0.45 lift=0.5 flicker=0.4 secondFlame=0 draught=0.25 roar=0.01 width=0.98 | glow | suspend | Flared tubes whose flames answer early, thin tones flickering and lifting
Upstairs from here | - | lag=0.12 place=0.1 draught=0.04 flame=0.3 catch=1.3 lift=0 mouth=0.5 secondFlame=0 flicker=0.07 roar=0.08 glass=0.01 width=0.68 volume=0 | plate 1.mix=0.22 | lowchoir | Gas placed low in open tubes so that every key sings its octave, clear and mild
Second spring | - | lag=0.385 place=0.4 draught=0.03 flame=0.5 catch=0.8 lift=0 mouth=0.6 roar=0.1 embers=3 tube=Narrow flicker=0.24 glass=0.04 width=0.4 secondFlame=0.2 between=0.42 volume=5.5 | swirl | lowchoir | Late flames high in narrow tubes, the whole chord an octave up
Twelve bells of air | - | lag=0.07 place=0.445 draught=0.03 flame=0.4 tube=Half_closed catch=1.1 lift=0 mouth=0.65 embers=4 flicker=0.17 roar=0.2 glass=0.09 width=0.55 secondFlame=0.26 between=0.64 | openspace | lowchoir | Half closed tubes that sing a twelfth above the key, hollow and high
Ladders to the attic | - | lag=0.15 place=0.04 draught=0.35 flame=0.45 tube=Double catch=1.5 lift=0 mouth=0.5 embers=3 flicker=0.24 roar=0.3 glass=0.01 width=0.72 secondFlame=0 volume=-1.5 | ensemble | lamps | Double tubes, one singing an octave over the key and one an octave under it
Thin place | - | lag=0.43 place=0.06 draught=0.02 fuel=Spirit flame=0.18 tube=Narrow catch=2 lift=0 mouth=0.3 embers=6 flicker=0.21 roar=0.05 glass=0.08 width=0.9 secondFlame=0.28 between=0.03 volume=-1.5 | winter | lowchoir | Spirit flames in narrow tubes singing the twelfth, thin and far above the keys
Changeable forecast | Slow weather | secondFlame=0.15 flicker=0.2 tube=Open fuel=Gas catch=1.2 embers=4 mouth=0.5 lift=0.2 draught=0.9 glass=0.13 width=0.83 between=0.58 lag=0.14 place=0.35 volume=-3 | wide | still | Gas in open tubes in a strong draught, colour and strength leaning together
Long curtains in a storm | - | draught=1 flame=0.35 catch=0.8 mouth=0.35 tube=Half_closed flicker=0.1 secondFlame=0.5 between=0.6 roar=0.22 glass=0.23 width=0.66 lift=0.11 lag=0.31 place=0.12 | breathhall | lamps | Half closed tubes in the hardest draught, two flames beating as they lean
Gulls inland | Slow weather | secondFlame=0.15 tube=Narrow draught=0.8 flicker=0.2 lift=0.42 catch=1.4 mouth=0.6 roar=0.3 glass=0.21 width=0.7 between=0.63 lag=0.22 place=0.23 volume=-5.5 | tide | still | Narrow candles lifting and sinking in a draught, high and restless
Uncertain flame | Guttering candles | flicker=0.8 catch=0.6 secondFlame=0.3 mouth=0.6 embers=3 draught=0.19 roar=0.04 glass=0.04 width=0.43 between=0.21 lift=0.1 lag=0.34 place=0.13 volume=-1 | evening | suspend | Candles in open tubes that gutter to a thread and take hold again
Wheat in wind | - | tube=Flared draught=0.75 flame=0.45 mouth=0.4 catch=0.9 roar=0.4 lift=0.1 flicker=0.3 glass=0.16 width=0.43 secondFlame=0.16 between=0.34 lag=0.31 place=0.18 | currents | gather | Flared gas leaning over and back, its rush moving with the tone
Congregation | Furnace choir | burn=20 tube=Open catch=0.9 mouth=0.5 between=0.42 secondFlame=0.9 embers=2.5 draught=0.15 flicker=0.14 glass=0.14 width=0.63 lift=0.13 lag=0.29 place=0.17 volume=0.5 | common | chorale | Two full gas flames to every key, slipping enough to sound like many
Porridge and steam | - | tube=Double secondFlame=0.36 between=0.5 flame=0.5 mouth=0.4 catch=0.6 roar=0.2 draught=0.36 flicker=0.2 glass=0.19 width=0.95 lift=0.17 lag=0.33 place=0.19 volume=-11 | thick | tenths | Double tubes with two equal flames, broad and low, beating slowly
Ferris wheel lights | - | secondFlame=0.8 between=0.75 flame=0.25 catch=0.7 mouth=0.75 lift=0.3 width=1 tube=Narrow draught=0.28 flicker=0.22 roar=0.3 glass=0.04 lag=0.3 place=0.21 | circle | lamps | Pairs of narrow gas flames beating at the sides, some keys lifting
Slow dancers | Beating pair | tube=Half_closed between=0.44 catch=1.4 mouth=0.5 flame=0.5 embers=3 draught=0.02 flicker=0.14 roar=0.27 glass=0.12 width=0.98 lag=0.27 place=0.2 | rotor | still | Half closed pairs so close to locking that they slip once a second
Blankets in a row | - | secondFlame=0.6 between=0.05 tube=Half_closed fuel=Candle mouth=0.95 catch=1.1 lift=0 flicker=0.3 flame=0.75 draught=0.09 roar=0.15 glass=0.03 width=0.71 lag=0.22 place=0.35 | halo | chorale | Candle pairs locked in half closed tubes, opened wide, one plain soft tone
Rosin and spirit | Hollow reed | catch=0.6 embers=1.5 mouth=0.2 flame=0.5 secondFlame=0.5 between=0.4 width=0.7 draught=0.18 flicker=0.13 roar=0.14 glass=0.14 lift=0.13 lag=0.3 place=0.34 volume=-3.5 | bowed | suspend | Covered spirit flames in half closed tubes, a dark and grainy reed choir
Amber varnish | - | burn=22 fuel=Spirit flame=0.45 mouth=0.08 catch=0.9 tube=Open secondFlame=0.4 between=0.48 roar=0.05 draught=0.34 flicker=0.36 glass=0.1 width=0.95 lift=0.18 lag=0.26 place=0.34 volume=-2 | amptrem | tenths | Spirit in open tubes with the mouth shut, a viol colour beating slowly
Horsehair | - | fuel=Spirit flame=0.75 mouth=0.15 catch=0.5 place=0.3 lift=0 tube=Open flicker=0.15 embers=0.8 width=0.5 draught=0.02 roar=0.18 secondFlame=0.18 between=0.04 lag=0.33 | woodbox 1.mix=0.35 | chorale | Tall spirit flames kept covered, grainy and even like bowed low strings
Blue hour on the canal | - | fuel=Spirit tube=Double flame=0.2 mouth=0.25 catch=1.8 embers=5 lift=0.2 draught=0.5 roar=0.05 flicker=0.25 glass=0.19 width=0.81 secondFlame=0.2 between=0.38 lag=0.13 place=0.33 | icefilter | still | Small spirit flames in double tubes, clear and leaning, opening as they swell
Slate roof | - | fuel=Spirit tube=Narrow flame=0.6 mouth=0.2 catch=1.1 lift=0.1 secondFlame=0.33 between=0.42 roar=0.25 embers=3 draught=0.16 flicker=0.11 glass=0.15 width=0.57 lag=0.32 place=0.27 volume=0.5 | glacial | gather | Narrow spirit flames, covered, two to a key, clear and slipping
Peat and plum | - | fuel=Coal flame=0.4 roar=0.1 mouth=0.35 catch=0.8 flicker=0.2 secondFlame=0.4 between=0.3 draught=0.14 glass=0.22 width=0.96 lift=0.1 lag=0.12 place=0.36 | valve | tenths | Coal burning low in open tubes, dark and a little rough, with a slow swell
Miners' supper | Coal bass | tube=Double catch=0.7 burn=22 embers=1.5 flame=0.4 mouth=0.4 roar=0.2 width=0.7 secondFlame=0.4 draught=0.16 flicker=0.11 glass=0.09 between=0.26 lag=0.26 place=0.13 volume=-9.5 | tapeweight | chorale | Double tubes over coal, a thick dark chord with grit under it
Smoke lying in a valley | - | fuel=Coal tube=Narrow roar=0.45 flame=0.35 catch=1.6 mouth=0.6 lift=0.12 embers=4 draught=0.5 flicker=0.33 glass=0.01 width=0.84 secondFlame=0 lag=0.36 place=0.2 | mist | lamps | Narrow coal tubes, a soft tone in a low rush of smoke that leans about
Charred oak | - | fuel=Coal tube=Half_closed flame=0.65 place=0.32 mouth=0.25 catch=1 roar=0.15 burn=14 embers=2 draught=0.33 flicker=0.29 glass=0.15 width=0.8 secondFlame=0.07 between=0.35 lift=0.13 lag=0.27 volume=0 | cellos | suspend | Half closed coal, covered, thinning as its fuel runs low over the chord
Goose down | - | catch=6 embers=10 flame=0.35 mouth=0.45 flicker=0.1 secondFlame=0.5 between=0.3 fuel=Spirit tube=Half_closed draught=0.34 roar=0.06 glass=0.13 width=0.56 lift=0.13 lag=0.19 place=0.24 | darkhall | still | Spirit in half closed tubes lit very slowly, swelling through the whole chord
`,
    },
    {
      id: 'candle-flutes',
      name: 'Candle flutes',
      category: 'wind',
      rows: `
Goatherd's afternoon | Candle flute | flicker=0.2 roar=0.5 catch=0.1 mouth=0.75 embers=0.4 lift=0.14 draught=0.1 glass=0.16 width=0.2 lag=0.2 place=0.19 | outdoors | song | A candle in a narrow tube, quick to speak, mild, with no edge on it
Under the stair window | Candle flute | roar=0.1 flicker=0.1 catch=0.25 mouth=0.9 embers=1.2 lift=0 width=0.1 draught=0.09 glass=0.2 lag=0.06 place=0.31 volume=-3 | mike | song | A narrow candle flute with little breath, its mouth wide, plain and centred
Thread through a needle | Candle flute | flame=0.15 roar=0.05 catch=0.4 mouth=0.7 embers=2 lift=0 flicker=0.15 draught=0.15 glass=0.13 width=0.65 lag=0.36 place=0.12 volume=-3 | latesway | onehigh | The smallest candle flame, a thin pure flute that takes its time
Whistled blade of grass | Candle flute | burn=15 flame=0.95 roar=0.75 flicker=0.5 catch=0.06 mouth=1 embers=0.2 place=0.3 draught=0.22 glass=0.01 width=0.22 lag=0.3 | papery | call | A tall candle that flickers in a rush of air, buzzing at the edges
Sleeping by the weir | Candle flute | catch=0.9 embers=3.5 roar=0.55 draught=0.6 mouth=0.6 width=0.9 lift=0.17 flicker=0 glass=0.22 lag=0.12 place=0.25 volume=-3 | trail | duet | Narrow candle flutes that swell slowly and lean in an idle draught
Clay bird | Candle flute | burn=16 tube=Half_closed roar=0.2 catch=0.08 flicker=0.1 mouth=0.8 embers=0.3 lift=0.16 draught=0.29 glass=0.17 width=0.17 lag=0.23 place=0.19 volume=-3 | clay | shepherd | A candle in a half closed tube, round as a small clay whistle and quick
Cupped hands | Candle flute | tube=Half_closed flame=0.3 mouth=0.45 catch=0.3 roar=0.3 lift=0.19 embers=0.8 draught=0.36 flicker=0.2 glass=0.2 width=0.33 lag=0.28 place=0.2 | bare | single | A half closed candle tube, half covered, one soft hollow note
Owl in the rafters | Candle flute | burn=20 tube=Half_closed flame=0.7 place=0.34 mouth=0.8 catch=0.45 lift=0.42 flicker=0.3 embers=2 width=0.6 draught=0.28 lag=0.32 volume=1 | cistern | call | Half closed candles, hollow notes that keep breaking up to the twelfth
Ferrymen trading calls | Candle flute | tube=Half_closed secondFlame=0.8 between=0.8 catch=0.2 mouth=0.85 lift=0.11 flicker=0.15 width=0.8 draught=0.39 glass=0.11 lag=0.37 place=0.21 volume=1 | pendulum | duet | Pairs of candles in half closed tubes, hollow and beating quickly
Stone jar on the sill | Candle flute | burn=18 tube=Half_closed roar=0.4 flame=0.55 mouth=0.7 catch=0.15 lift=0.35 embers=0.5 draught=0.34 flicker=0.01 glass=0.22 width=0.09 lag=0.08 place=0.31 volume=-2.5 | bottle | song | A half closed candle pipe, dull and round, lifting off its note at times as if
Boxwood and breath | Candle flute | burn=19 tube=Open flame=0.6 catch=0.12 mouth=0.8 roar=0.3 lift=0.16 embers=0.5 flicker=0.2 draught=0.26 glass=0.24 width=0.1 lag=0.07 place=0.31 | woodbox | song | A candle in an open tube, a broad mellow flute with a short flutter first
Courting on the hill | Candle flute | burn=18 tube=Open flame=0.4 secondFlame=0.6 between=0.45 catch=0.3 mouth=0.85 lift=0.15 width=0.7 embers=1.5 draught=0.39 flicker=0.28 glass=0.17 lag=0.2 place=0.29 volume=-2 | canon | duet | Two candles in open tubes, slipping a little against each other
Boy at the gate | Candle flute | tube=Open flame=0.9 place=0.07 lag=0.25 catch=0.05 mouth=0.75 roar=0.15 lift=0.15 embers=0.25 draught=0.09 flicker=0.22 glass=0.16 width=0.76 | slap | shepherd | A tall candle low in an open tube, eager and slightly bright
Letters in a drawer | Candle flute | tube=Open flame=0.35 mouth=0.5 catch=0.5 roar=0.4 flicker=0.42 lift=0.12 burn=10 embers=1 draught=0.4 glass=0.19 width=0.35 lag=0.28 place=0.29 volume=5 | wornreel | onehigh | A dulled candle in an open tube that flickers and burns away
Moss on the north side | Candle flute | tube=Open flame=0.5 place=0.36 catch=1.1 mouth=0.65 embers=4 lift=0.1 draught=0.5 width=0.8 flicker=0.02 glass=0.21 lag=0.16 | darkhall | single | Open candle tubes fed from high up, slow and soft, leaning a little
Tin lunchbox whistle | Candle flute | fuel=Spirit flame=0.2 catch=0.05 mouth=0.4 roar=0.12 lift=0.19 flicker=0.1 embers=0.2 draught=0.39 glass=0.07 width=0.15 lag=0.15 place=0.34 | tiles | shepherd | A small spirit flame in a narrow tube, quick and clear as a tin whistle
Ice fishing | Candle flute | fuel=Spirit flame=0.1 catch=0.4 mouth=0.3 roar=0.35 lift=0.11 embers=2.5 draught=0.2 flicker=0.34 glass=0.08 width=0.25 lag=0.1 place=0.26 volume=-1 | valley 1.mix=0.24 | highline | Narrow spirit tones, small and cold, with a thin rush of air at each
Porcelain flute | Candle flute | burn=20 fuel=Spirit flame=0.35 glass=0.5 catch=0.03 mouth=0.35 roar=0.05 lift=0.18 embers=1 width=0.5 draught=0.11 flicker=0.33 lag=0.3 place=0.19 | sheen | song | A spirit flute in narrow glass, each note begun with a small clear tap
Swift over the yard | Candle flute | fuel=Spirit flame=0.5 mouth=0.5 catch=0.07 lift=0.7 flicker=0.3 embers=0.5 roar=0.1 draught=0.37 glass=0.06 width=0.07 lag=0.23 place=0.3 | dotted | call | A narrow spirit pipe that lifts away from its own note almost at once
Mountain rescue | Candle flute | burn=14 roar=0.1 fuel=Spirit flame=0.6 secondFlame=0.41 between=0.95 mouth=0.2 catch=0.1 lift=0.12 width=1 embers=0.8 draught=0.38 flicker=0.08 glass=0.11 lag=0.3 place=0.23 volume=-1.5 | shore | onehigh | Two narrow spirit flames far apart, beating fast and clear
Liquorice stick | Hollow reed | burn=22 flame=0.5 mouth=0.4 catch=0.08 embers=0.3 roar=0.05 width=0.2 draught=0.24 flicker=0.1 glass=0.05 lag=0.14 place=0.36 volume=-4.5 | parlour | song | Spirit in a half closed tube, a dark round reed that speaks at once
Split cane | Hollow reed | burn=18 flame=1 mouth=0.7 place=0.1 catch=0.05 roar=0.2 flicker=0.2 embers=0.1 draught=0.4 glass=0.05 width=0.21 lag=0.23 volume=-2.5 | combo | call | A tall spirit flame low in a half closed tube, a reed with a hard edge
Duck pond sermon | Hollow reed | flame=0.7 tube=Narrow mouth=0.35 place=0.38 catch=0.12 flicker=0.6 embers=0.5 draught=0.04 roar=0.02 glass=0.15 width=0.37 lag=0.3 volume=-7 | cupboard | duet | A narrow spirit flame set high that flickers, small and a little comical
Evening reeds | Hollow reed | flame=0.35 mouth=0.3 secondFlame=0.6 between=0.42 catch=0.5 embers=1.8 roar=0.1 width=0.6 draught=0.36 flicker=0.31 glass=0.23 lag=0.34 place=0.25 | long_hold | duet | Spirit pairs in half closed tubes, covered and slipping, two low reeds
Snake in a basket | Hollow reed | tube=Open flame=0.85 mouth=0.35 place=0.12 lag=0.24 catch=0.07 draught=0.45 embers=0.4 flicker=0.19 roar=0.24 glass=0.1 width=0.79 volume=3 | strings | shepherd | Spirit low in an open tube, a nasal reed that leans in a draught
Cut reeds in a row | Candle flute | fuel=Gas flame=0.35 roar=0.3 catch=0.05 mouth=0.6 embers=0.25 lift=0.16 flicker=0.1 draught=0.1 glass=0.01 width=0.71 lag=0.39 place=0.16 volume=-3.5 | shortair | ostinato | Narrow gas pipes with a puff on each note, brief and level
Ginger beer bottle | Candle flute | fuel=Coal tube=Half_closed flame=0.3 roar=0.9 catch=0.04 mouth=0.6 embers=0.3 lift=0.12 burn=2.5 draught=0.33 flicker=0.15 glass=0.09 width=0.14 lag=0.18 place=0.22 volume=2.5 | booth | ostinato | A half closed coal pipe, short notes each with a rush of breath, burnt away in two seconds
Gondola in fog | Candle flute | fuel=Gas tube=Open flame=0.5 roar=0.2 catch=0.35 mouth=0.4 embers=1.5 lift=0.1 secondFlame=0.4 between=0.2 width=0.6 draught=0.03 flicker=0.09 glass=0.12 lag=0.28 place=0.1 | mist 1.mix=0.5 | song | Covered gas flames in open tubes, locked in twos, a mellow low flute
Paper boats | Candle flute | burn=22 fuel=Gas flame=0.6 place=0.4 roar=0.15 catch=0.2 mouth=0.75 embers=1.2 lift=0.55 draught=0.3 flicker=0.04 glass=0.17 width=0.58 lag=0.25 | skips | highline | Gas flames high in narrow tubes, light tones that lift and settle again
Kettle with no lid | Candle flute | burn=21 fuel=Gas tube=Flared flame=0.5 roar=0.65 catch=0.15 mouth=0.35 embers=0.4 flicker=0.5 lift=0.14 draught=0.17 width=0.78 lag=0.32 place=0.1 volume=2 | kettle | call | Flared gas with a hot rush over a small flickering tone
Overblown on purpose | Candle flute | burn=21 lag=0.385 place=0.43 draught=0.03 fuel=Gas tube=Open flame=0.5 catch=0.12 mouth=0.55 roar=0.4 lift=0 embers=0.4 flicker=0.15 glass=0.12 width=0.49 volume=-2.5 | hops | song | A late gas flame high in an open tube, overblown to the octave with a rush of air
Birdcage in a window | Candle flute | burn=21 lag=0.14 place=0.06 draught=0.04 fuel=Spirit flame=0.3 catch=0.04 mouth=0.35 roar=0.08 lift=0 flicker=0.01 glass=0.05 width=0.29 volume=-16 | sparks | shepherd | Spirit low in a narrow tube, singing only the octave, small and quick
High meadow | Candle flute | lag=0.08 place=0.445 draught=0.03 tube=Half_closed flame=0.5 catch=0.25 mouth=0.95 roar=0.3 lift=0 embers=1.5 flicker=0.34 glass=0.09 width=0.66 volume=-3 | fifthshim | song | A half closed candle pipe that speaks its twelfth, hollow and far up
Wind in the twelfths | Candle flute | lag=0.42 place=0.05 draught=0.03 tube=Flared fuel=Gas flame=0.35 catch=0.3 mouth=0.4 roar=0.3 lift=0 flicker=0.1 glass=0.2 width=0.63 volume=-3 | far | duet | Flared gas tubes blown up to the twelfth, thin and windy
Far end of the flute | Candle flute | roar=0.1 lag=0.44 place=0.18 draught=0.08 fuel=Spirit tube=Narrow flame=0.4 catch=0.2 mouth=0.3 lift=0 embers=2 flicker=0.09 glass=0.11 width=0.37 volume=6 | darkecho | single | A narrow spirit flame that takes the fourth harmonic, two octaves over its key
Father and son | Candle flute | burn=14 tube=Double flame=0.5 catch=0.15 mouth=0.85 roar=0.2 lift=0 embers=0.6 width=0.6 draught=0.14 flicker=0.17 glass=0.08 lag=0.12 place=0.26 volume=-2.5 | double | song | Candles in double tubes, a flute with another an octave under it
Bass recorder lesson | Candle flute | tube=Double fuel=Gas flame=0.25 place=0.35 catch=0.1 mouth=0.45 roar=0.15 lift=0 embers=0.3 draught=0.03 flicker=0.06 glass=0.18 width=0.48 lag=0.34 volume=-12 | chamber | duet | Double tubes over small gas flames, low wooden tones in plain octaves
Horn across the dock | Candle flute | tube=Double fuel=Spirit flame=0.7 mouth=0.12 catch=0.6 lift=0.17 roar=0.1 embers=2 secondFlame=0.3 between=0.2 draught=0.13 flicker=0.27 glass=0.18 width=0.58 lag=0.25 place=0.24 | nextdoor | single | Spirit in double tubes with the mouth nearly shut, one long low horn
Two mouths one tune | Candle flute | burn=22 tube=Double secondFlame=0.3 between=0.65 flame=0.6 mouth=0.8 catch=0.3 lift=0 flicker=0.2 width=0.75 embers=1 draught=0.38 glass=0.1 lag=0.22 place=0.15 volume=1 | heads | song | Double candle tubes with two equal flames, octaves that beat side to side
Lowland mist pipe | Candle flute | tube=Double roar=0.8 flame=0.4 mouth=0.6 catch=0.7 lift=0.25 embers=2.5 flicker=0.5 draught=0.23 width=0.53 lag=0.07 place=0.34 volume=-6 | breathhall | duet | Double candle pipes flickering in their own breath, an octave apart
Alpine post | Candle flute | tube=Flared fuel=Gas flame=0.8 place=0.28 mouth=0.3 catch=0.1 roar=0.1 lift=0.18 embers=0.5 flicker=0.1 draught=0.04 glass=0.19 width=0.41 lag=0.41 volume=0 | valley | call | A tall gas flame in a flared tube, a short bright horn call
Parade two streets away | Locked horns | flame=0.6 mouth=0.3 secondFlame=0.6 between=0.1 catch=0.08 embers=0.25 draught=0.09 flicker=0.06 roar=0.06 glass=0.23 width=0.51 lag=0.18 place=0.3 | downhall | song | Flared gas pairs locked hard together, covered brass with a quick start
Muted cornet | Locked horns | burn=19 fuel=Candle flame=0.9 mouth=0.75 secondFlame=0 catch=0.12 embers=0.3 roar=0.15 draught=0.21 flicker=0.4 glass=0.17 width=0.27 lag=0.11 place=0.23 | pillow | shepherd | A tall candle in a flared tube, soft brass with its low end gone
Foghorn's daughter | Locked horns | fuel=Coal flame=0.55 mouth=0.45 catch=0.35 roar=0.2 embers=1.2 secondFlame=0.3 between=0.42 width=0.6 draught=0.26 flicker=0.21 glass=0.04 lag=0.23 place=0.26 | shaft | single | Flared coal, a rough throaty horn with a second flame slipping behind it
Silver thimble horn | Locked horns | burn=17 fuel=Spirit flame=0.12 mouth=0.15 secondFlame=0 catch=0.06 embers=0.4 place=0.35 draught=0.2 flicker=0.17 roar=0.06 glass=0.22 width=0.42 lag=0.28 volume=3 | smaller | shepherd | A tiny spirit flame in a flared tube, nearly shut, a toy horn
Lark in two minds | Octave lifter | fuel=Candle tube=Narrow catch=0.2 mouth=0.85 lift=0.5 flame=0.4 embers=1 roar=0.2 draught=0.24 flicker=0.09 glass=0.21 width=0.68 secondFlame=0.02 between=0.18 lag=0.1 place=0.27 volume=-2.5 | stars | onehigh | A narrow candle flute that lifts to its octave and sinks back of itself
Last match held close | Guttering candles | flame=0.3 tube=Narrow flicker=0.55 catch=0.15 lift=0.17 secondFlame=0 embers=0.6 burn=11 mouth=0.9 width=0.3 draught=0.37 roar=0.27 glass=0.02 lag=0.13 place=0.35 volume=6 | breathy | single | One narrow candle that gutters and sinks to a thread before it burns out
Charcoal burner's pipe | Dying embers | tube=Narrow flicker=0.4 burn=40 catch=0.15 flame=0.6 roar=0.35 lift=0.14 embers=0.7 mouth=0.7 draught=0.37 glass=0.14 width=0.6 secondFlame=0.17 between=0.65 lag=0.17 place=0.28 | shells | shepherd | Coal in a narrow tube, a smoky pipe with a crackle in its breath
Lifted kite | High harmonic | fuel=Candle mouth=1 catch=0.4 lift=1 roar=0.3 secondFlame=0 embers=1.5 draught=0.07 flicker=0.36 glass=0.1 width=0.24 volume=-11.5 | wind | shepherd | Narrow candles that live on the lifted octave, light and high
Organ grinder's monkey | Hollow reed | burn=10 tube=Double flame=0.4 mouth=0.3 catch=0.04 embers=0.2 place=0.3 secondFlame=0.5 between=0.7 draught=0.12 flicker=0.26 roar=0.33 glass=0.24 width=0.68 lag=0.09 volume=-4.5 | fastrotor | ostinato | Spirit in double tubes, two flames beating, short reedy notes at two heights | organ
`,
    },
    {
      id: 'coal-basses',
      name: 'Coal basses',
      category: 'bass',
      rows: `
Coal hole with no lid | Coal bass | flame=0.85 mouth=0.65 roar=0.5 flicker=0.35 burn=19 catch=0.05 embers=0.2 draught=0.14 glass=0.17 width=0.02 lag=0.13 place=0.1 volume=-10 | bare | walk | Coal in half closed tubes with the mouth open, round below and loose with roar
Turf and iron | Coal bass | flame=1 mouth=0.55 place=0.4 burn=4 roar=0.4 embers=0.3 draught=0.09 flicker=0.39 glass=0.02 width=0.2 lag=0.41 | iron | pulse | A tall coal flame high in a half closed tube, rough and gone in four seconds
Pumping out the pit | Coal bass | roar=0.65 flicker=0.5 burn=40 catch=0.12 flame=0.6 mouth=0.4 embers=0.6 draught=0.37 width=0.34 lag=0.14 place=0.36 volume=-9 | giant | pedal | Half closed coal that flickers under its own roar, a low labouring tone
Stove on a slow morning | Coal bass | catch=0.7 embers=2 burn=22 flame=0.4 mouth=0.3 secondFlame=0.4 between=0.42 draught=0.22 flicker=0.03 roar=0.09 glass=0.23 width=0.11 lag=0.17 place=0.12 volume=-0.5 | shaded | widebass | Half closed coal that swells slowly, two flames slipping deep under the hand
Ash pan | Coal bass | burn=1.2 catch=0.03 embers=0.2 flame=0.7 mouth=0.6 glass=0.3 roar=0.2 draught=0.37 flicker=0.27 width=0.63 lag=0.13 place=0.35 volume=3 | tiles | pulse | Coal lit in an instant with a tap of glass, a knock that dies in a second | plucked
Bulldog on the step | Coal bass | tube=Open flame=0.65 mouth=0.3 burn=18 catch=0.04 roar=0.2 embers=0.25 draught=0.14 flicker=0.02 glass=0.07 width=0.39 lag=0.17 place=0.13 volume=-9 | preamp | walk | Coal in open tubes, every harmonic in it, short and gruff
Towpath engine | Coal bass | tube=Open flame=0.9 mouth=0.4 burn=40 flicker=0.35 secondFlame=0.6 between=0.7 embers=0.4 draught=0.33 roar=0.08 glass=0.24 width=0.03 lag=0.18 place=0.13 volume=-8 | reel | pulse | Two coal flames in open tubes beating low like an engine that idles
Turnips in the cellar | Coal bass | tube=Open flame=0.3 place=0.35 mouth=0.2 burn=10 catch=0.15 embers=1 roar=0.1 draught=0.36 flicker=0.13 glass=0.08 width=0.33 lag=0.29 | cistern | widebass | Covered coal burning low in open tubes, dark, thinning as it burns down
Gravel drive | Coal bass | tube=Open roar=0.8 flame=0.5 mouth=0.55 flicker=0.6 burn=22 embers=0.5 catch=0.1 draught=0.11 width=0.07 lag=0.25 place=0.14 volume=-15.5 | tapeweight | walk | Open coal tubes with a crunching roar around a low flickering note
Tar barrel | Coal bass | tube=Open flame=0.8 lag=0.3 place=0.3 mouth=0.25 catch=0.3 burn=40 embers=1.5 width=0.5 draught=0.05 flicker=0.2 roar=0.14 glass=0.19 | melted | pedal | Tall coal kept covered in open tubes, thick and slow off the mark
Foundations | Coal bass | tube=Double flame=0.5 mouth=0.3 burn=40 catch=0.1 embers=0.6 roar=0.15 draught=0.08 flicker=0.02 glass=0.01 width=0.37 lag=0.42 place=0.32 volume=-7.5 | airy | stride | Coal in double tubes with an octave under every note, dark and plain
Freight on the up line | Coal bass | tube=Double flame=0.85 mouth=0.45 roar=0.5 burn=19 flicker=0.3 secondFlame=0.32 between=0.5 catch=0.2 draught=0.23 glass=0.04 width=0.15 lag=0.41 place=0.2 volume=-4.5 | darkecho | tread | Double coal tubes rumbling through, two flames pulling at each other
Hull | Coal bass | tube=Double flame=0.35 place=0.4 mouth=0.2 catch=0.5 burn=40 embers=2.5 draught=0.5 flicker=0.19 roar=0.14 glass=0.08 width=0.39 lag=0.29 volume=-9 | pipe | mooring | Covered coal in double tubes that swells and leans like water on plates
Grandfather's cough | Coal bass | tube=Double flame=0.7 burn=2 catch=0.04 embers=0.25 roar=0.6 flicker=0.3 mouth=0.5 draught=0.29 glass=0.08 width=0.26 lag=0.33 place=0.32 volume=2 | cupboard | pulse | Short coal notes in double tubes, rough with roar and burnt out in two seconds
Under the weighbridge | Coal bass | tube=Double flame=1 mouth=0.04 burn=15 catch=0.08 embers=0.8 lag=0.15 draught=0.25 flicker=0.13 roar=0.14 glass=0.01 width=0.3 volume=-14 | deepdry | stride | The tallest coal flame in double tubes with the mouth shut, all weight
Father in his socks | Warm flame pad | fuel=Gas burn=13 tube=Flared flame=0.2 mouth=0.3 catch=0.2 embers=0.35 lift=0.02 secondFlame=0 width=0 roar=0.05 draught=0.21 flicker=0.03 glass=0.04 lag=0.22 place=0.28 volume=-3 | glued | walk | Small gas flames in flared tubes, a low bass with a thin edge, kept in the middle
Ruled line | Warm flame pad | tube=Narrow flame=0.1 mouth=0.3 catch=0.04 embers=0.3 lift=0 secondFlame=0 width=0 roar=0 glass=0 draught=0 flicker=0 lag=0.19 place=0.17 volume=-17.5 | glued | pulse | Gas in a narrow tube, a bare even tone with nothing on it at all
Gasometer | Warm flame pad | tube=Half_closed flame=0.9 place=0.08 mouth=0.4 catch=0.15 embers=1 lift=0 secondFlame=0.8 between=0.1 width=0.3 roar=0.3 draught=0.05 flicker=0.06 glass=0.18 lag=0.2 volume=-11 | giant | widebass | Tall gas pairs locked low in half closed tubes, a big round hollow bass
Barges coming alongside | Warm flame pad | tube=Double flame=0.75 mouth=0.28 catch=1.2 embers=3 lift=0.15 secondFlame=0.6 between=0.3 draught=0.5 roar=0.3 flicker=0.13 glass=0.11 width=0.22 lag=0.12 place=0.31 | crypt 1.mix=0.24 | mooring | Tall gas in double tubes that swells and leans, two flames slipping
Elastic waistband | Warm flame pad | flame=0.5 mouth=0.25 catch=0.04 burn=3 embers=0.3 lift=0.13 secondFlame=0 width=0.15 place=0.3 draught=0.04 flicker=0.04 roar=0.04 glass=0.05 lag=0.17 | shutting | pulse | Covered gas in open tubes, quick and rubbery, burning away in three seconds
Contrabass clarinet | Hollow reed | burn=11 flame=0.4 mouth=0.5 place=0.36 catch=0.25 embers=1.2 width=0.15 roar=0.2 secondFlame=0.6 between=0.55 draught=0.2 flicker=0.02 glass=0.17 lag=0.35 volume=-3.5 | parlour | walk | Spirit pairs in half closed tubes played low, a dark reed and a slow beat
Grumbling landlord | Hollow reed | burn=16 flame=1 mouth=0.2 place=0.12 flicker=0.75 catch=0.05 embers=0.2 roar=0.85 draught=0.21 glass=0.1 width=0.13 lag=0.16 volume=-1.5 | melted | pulse | The tallest spirit flame in a half closed tube, covered, a low reed that flickers and roars
Night watch bassoon | Hollow reed | burn=7 tube=Open flame=0.55 mouth=0.25 place=0.3 catch=0.12 embers=0.4 width=0.2 draught=0.32 flicker=0.21 roar=0.16 glass=0.08 lag=0.3 volume=-9.5 | chamber | walk | Covered spirit in open tubes, a nasal reed kept in a low register
Mole's lantern | Hollow reed | burn=21 flame=0.25 mouth=0.15 catch=0.3 embers=1.5 secondFlame=0.4 between=0.45 width=0.4 draught=0.3 flicker=0.32 roar=0.07 glass=0.12 lag=0.33 place=0.31 volume=-2.5 | nextdoor | widebass | Small covered spirit flames in half closed tubes, slipping in twos, very dark
Rosined cable | Hollow reed | tube=Open flame=0.9 mouth=0.2 lag=0.16 place=0.25 catch=0.4 embers=0.8 draught=0.4 flicker=0.22 roar=0.01 glass=0.04 width=0.19 volume=0.5 | bowed | pedal | Tall spirit kept covered in open tubes, grainy and leaning in a draught
Idling lorry | Coal bass | fuel=Spirit tube=Double flame=0.9 mouth=0.2 burn=19 secondFlame=0.39 between=0.9 catch=0.08 draught=0.11 flicker=0.33 roar=0.15 glass=0.15 width=0.22 lag=0.24 place=0.36 volume=-7.5 | valve | pulse | Two spirit flames in double tubes beating hard, a low growl
Mill wheel at low water | Coal bass | fuel=Spirit tube=Double flame=0.4 mouth=0.15 burn=40 roar=0.6 catch=0.3 embers=1.2 draught=0.6 flicker=0.34 glass=0.13 width=0.06 lag=0.37 place=0.21 volume=-9 | darkplate | pedal | Spirit in double tubes with a rush that leans and returns over a low note
Anvil room | Coal bass | fuel=Spirit tube=Double flame=0.6 mouth=0.4 burn=3 catch=0.03 embers=0.3 glass=0.6 draught=0.3 flicker=0.37 roar=0.18 width=0.18 lag=0.28 place=0.17 | springs | pulse | Double spirit tubes struck at once, glass on top, gone in three seconds
Deep reed stop | Coal bass | fuel=Spirit tube=Double flame=0.7 mouth=0.3 burn=40 place=0.36 embers=0.3 roar=0 flicker=0 draught=0.07 glass=0.11 width=0.39 lag=0.21 volume=2.5 | pipes | stride | Tall spirit in double tubes, steady as an organ reed an octave down | organ
Keel and current | Coal bass | fuel=Spirit tube=Double flame=0.2 mouth=0.1 burn=16 catch=0.8 embers=2.5 secondFlame=0.5 between=0.6 draught=0.19 flicker=0.19 roar=0.07 glass=0.18 width=0.04 lag=0.22 place=0.31 volume=-3 | seasick | widebass | Small spirit flames in double tubes, covered, beating slowly underneath
Thumb on gut | Spirit pluck | tube=Half_closed flame=0.5 mouth=0.3 burn=2 embers=0.4 draught=0.15 flicker=0.04 roar=0.04 glass=0.13 width=0.61 lag=0.39 place=0.15 | woodbox | pulse | Spirit plucked in a half closed tube, dark and gone in two seconds | plucked
Plucked by the stove | Spirit pluck | tube=Open flame=0.4 mouth=0.2 burn=2.5 embers=0.3 fuel=Gas draught=0.02 flicker=0.25 roar=0.12 glass=0.07 width=0.59 lag=0.29 place=0.27 | glaze | walk | Gas lit at once in open tubes, covered, a plucked low note that burns away | plucked
Rubber mallet | Spirit pluck | tube=Double fuel=Gas flame=0.3 mouth=0.25 burn=1.2 embers=0.5 roar=0.05 draught=0.29 flicker=0.37 glass=0.18 width=0.21 lag=0.31 place=0.29 volume=3 | tiles | tread | Double gas tubes struck softly, an octave deep and gone in a second | plucked
Slack rope | Spirit pluck | tube=Open flame=0.75 mouth=0.28 burn=5 embers=0.8 secondFlame=0.6 between=0.8 width=0.5 draught=0.28 flicker=0.31 roar=0.15 glass=0.04 lag=0.39 place=0.19 volume=-8.5 | slap | walk | Two spirit flames plucked in open tubes, beating as they burn down | plucked
Cork and candle | Spirit pluck | tube=Half_closed fuel=Candle flame=0.8 mouth=0.8 burn=3 embers=0.4 catch=0.03 draught=0.17 flicker=0.26 roar=0.17 glass=0.03 width=0.84 lag=0.38 place=0.2 | booth | pulse | Candles lit in an instant in half closed tubes, a soft plucked thud | plucked
Counterweight and chain | Coal bass | fuel=Gas tube=Half_closed flame=0.45 catch=1.5 burn=40 embers=5 mouth=0.2 roar=0.1 width=0.5 draught=0.3 flicker=0.38 glass=0.15 lag=0.26 place=0.12 volume=-8.5 | halved | gather | Covered gas in half closed tubes, one slow low swell after another
Tide under the pier | Slow weather | secondFlame=0.2 flicker=0.15 tube=Double mouth=0.5 catch=1 embers=4 draught=0.8 lift=0.12 fuel=Gas flame=0.4 glass=0.03 width=0.15 between=0.29 lag=0.15 place=0.28 volume=-6 | swellsea | mooring | Gas in double tubes leaning on a strong draught, low and rising and falling
Long shadow | Furnace choir | fuel=Coal catch=1 mouth=0.3 embers=3 lift=0 secondFlame=0.5 between=0.05 draught=0.3 flicker=0.12 glass=0.14 width=0.25 lag=0.21 place=0.29 | darkhall | mooring | Double coal tubes locked in pairs, a slow dark bass with a long end
Sleeping quarry | Slow weather | secondFlame=0.15 flicker=0.25 tube=Half_closed fuel=Coal catch=0.8 embers=5 roar=0.85 lift=0.1 mouth=0.5 draught=0.4 glass=0.21 width=0.24 between=0.18 lag=0.2 place=0.34 volume=-7 | cave | deep | Coal in half closed tubes, a low tone with a dull rush in it, swelling from below
Bell buoy chain | Warm flame pad | tube=Half_closed fuel=Spirit glass=0.7 flame=0.2 mouth=0.25 catch=0.9 embers=6 lift=0.19 draught=0.4 flicker=0.32 roar=0.32 width=0.28 secondFlame=0.11 between=0.19 lag=0.34 place=0.14 | keysheld | deep | A clink of glass, then spirit in half closed tubes swelling slowly under it
Tallow drum | Candle flute | tube=Half_closed flame=0.9 mouth=0.9 catch=0.05 burn=1 embers=0.3 roar=0.2 width=0.2 lift=0.18 draught=0.18 flicker=0.32 glass=0 lag=0.37 place=0.17 volume=5.5 | strikes | pulse | Candles in half closed tubes, short round thumps with no edge at all | plucked
Candle in a well | Candle flute | burn=20 tube=Double flame=0.6 mouth=0.75 catch=0.2 embers=1 lift=0 flicker=0.2 width=0.2 roar=0.2 draught=0.03 glass=0.23 lag=0.17 place=0.21 volume=-3 | cistern | stride | Candles in double tubes, a soft low flute with its octave under it
Pillow bass | Candle flute | burn=7 tube=Open flame=0.6 mouth=0.85 catch=0.06 embers=0.3 lift=0.11 flicker=0.05 roar=0.05 draught=0.05 width=0 glass=0.21 lag=0.11 place=0.18 volume=1 | pillow | pulse | A candle in an open tube, a very soft round bass kept in the middle
Wax and weight | Candle flute | burn=17 tube=Open flame=1 mouth=0.65 catch=0.1 place=0.18 embers=0.5 lift=0.13 secondFlame=0.36 between=0.35 draught=0.07 flicker=0.01 glass=0.18 width=0.12 lag=0.19 volume=-3.5 | subbed | tenths | Tall candles in open tubes, two to a key, slipping, broad and dull
Dormouse | Candle flute | tube=Double fuel=Candle flame=0.2 mouth=0.85 burn=2.5 catch=0.06 embers=0.4 roar=0.4 lift=0.11 draught=0.25 flicker=0.35 glass=0.24 width=0.31 lag=0.26 place=0.18 volume=-1.5 | cassette | stride | Tiny candles in double tubes, breathy low notes that burn out soon
Tuba on the pier | Locked horns | flame=0.8 mouth=0.25 catch=0.1 embers=0.35 width=0.2 tube=Open draught=0.08 flicker=0.02 roar=0.17 glass=0.16 lag=0.13 place=0.19 volume=-9.5 | thump | walk | Gas pairs locked in open tubes, covered, short broad notes like low brass
Ophicleide weather | Locked horns | fuel=Spirit tube=Half_closed flame=0.5 mouth=0.3 secondFlame=0.5 catch=0.15 embers=0.5 draught=0.03 flicker=0.01 roar=0.05 glass=0.2 width=0.09 lag=0.44 place=0.31 volume=-11 | hall 1.mix=0.16 | widebass | Spirit pairs locked in half closed tubes, a reedy hollow low horn
Grate and poker | Locked horns | fuel=Coal flame=0.9 mouth=0.4 catch=0.06 burn=8 roar=0.5 flicker=0.4 tube=Half_closed draught=0.04 width=0.01 lag=0.27 place=0.34 volume=-7.5 | dusty | pulse | Locked coal pairs in half closed tubes, flickering, a hot rough bass
Thunder two valleys off | Roaring drone | tube=Double fuel=Coal catch=0.4 mouth=0.25 flame=0.6 roar=0.7 embers=2.5 draught=0.4 flicker=0.5 glass=0.11 width=0.36 secondFlame=0.23 between=0.69 lag=0.38 place=0.24 | valley | pedal | Coal in double tubes, more roar than note, a low rumble that flickers
Submarine pinging | Warm flame pad | burn=21 tube=Narrow fuel=Spirit flame=0.3 mouth=0.25 catch=0.05 embers=0.8 lift=0.14 secondFlame=0.5 between=0.6 width=0.6 glass=0.3 draught=0.03 flicker=0.2 roar=0.02 lag=0.37 place=0.28 volume=-10 | hops 1.mix=0.2 | walk | Narrow spirit tones played low with a chink of glass, two flames beating
`,
    },
    {
      id: 'beating-pairs',
      name: 'Beating pairs',
      category: 'string',
      rows: `
Tuning fork shop | Beating pair | secondFlame=0.32 between=0.5 flame=0.15 catch=0.2 embers=3 mouth=0.8 roar=0 draught=0.1 flicker=0.03 glass=0.19 width=0.64 lag=0.21 place=0.15 volume=0.5 | bare | fifths | Two thin gas flames in narrow tubes, pure tones beating about twice a second
Sleepers on the line | Beating pair | secondFlame=0.38 between=1 flame=0.4 catch=0.3 embers=0.8 mouth=0.6 width=0.6 draught=0 flicker=0.14 roar=0.18 glass=0.06 lag=0.31 place=0.32 volume=-4 | amptrem | lamps | Narrow pairs as far apart as they go, beating in a quick flutter
Two moons rising | Beating pair | secondFlame=0.32 between=0.7 flame=0.25 catch=2.2 embers=6 mouth=0.5 draught=0.3 width=1 flicker=0.31 roar=0.03 lag=0.22 place=0.1 | earbeat | still | Narrow gas pairs that swell very slowly and beat at the edges of hearing
Water boatmen in June | Beating pair | secondFlame=0.37 between=0.62 flame=0.35 catch=0.06 burn=5 embers=1 mouth=0.9 draught=0.06 flicker=0.04 roar=0.06 glass=0.07 width=0.26 lag=0.23 place=0.16 volume=4.5 | skips | ostinato | Narrow pairs lit at once, pure and beating, burnt out in five seconds | plucked
Same note in two rooms | Beating pair | burn=18 secondFlame=0.34 between=0.42 flame=0.6 catch=0.7 mouth=0.45 roar=0.4 embers=2 draught=0.22 flicker=0.16 glass=0.19 width=0.32 lag=0.25 place=0.15 volume=2 | parlour | duet | Narrow flames just past the point of locking, with a rush of air over the beats
Brothers at the oar | Beating pair | burn=17 secondFlame=0.72 tube=Open fuel=Candle between=0.55 flame=0.6 catch=0.5 mouth=0.85 embers=1.5 draught=0.16 flicker=0.16 roar=0.34 width=0.67 lag=0.35 place=0.23 volume=0.5 | double | tenths | Candle pairs in open tubes, soft strings pulling slowly against each other
Squeezebox next door | Beating pair | burn=15 tube=Open flame=0.7 between=0.75 catch=0.1 mouth=0.5 embers=0.4 secondFlame=0.8 draught=0.27 flicker=0.06 roar=0.19 glass=0.11 width=0.31 lag=0.39 place=0.12 volume=-4 | nextdoor | chorale | Two bright gas flames in open tubes, beating like wet reeds | organ
Sheets out to dry | Beating pair | secondFlame=0.4 tube=Open flame=0.2 between=0.42 catch=0.9 mouth=0.75 embers=3 draught=0.6 flicker=0.35 roar=0.17 glass=0.06 width=0.84 lag=0.2 place=0.31 volume=-4 | currents | gather | Small gas flames in open tubes, slipping and leaning in a draught
Tram wires | Beating pair | burn=20 secondFlame=0.45 tube=Open flame=0.5 lag=0.12 place=0.36 between=0.9 catch=0.4 mouth=0.8 roar=0.3 draught=0.15 flicker=0.18 glass=0.17 width=0.63 volume=-4.5 | springs | suspend | Open gas pairs with an early answer, bright and beating fast over their own air | string
Footbridge in a gale | Beating pair | burn=14 tube=Open flame=0.9 between=0.48 secondFlame=0.6 catch=0.25 mouth=0.3 embers=1 flicker=0.3 draught=0.29 roar=0 glass=0 width=0.69 lag=0.36 place=0.2 | wornreel | tenths | Tall covered gas pairs in open tubes, swaying between slip and beat
Spoons on the knee | Beating pair | secondFlame=0.77 tube=Half_closed flame=0.55 between=0.6 catch=0.04 burn=3 embers=0.4 mouth=0.6 draught=0.29 flicker=0.25 roar=0.14 glass=0.02 width=0.33 lag=0.21 place=0.29 volume=0.5 | woodbox | matches | Half closed pairs struck and burning down in three seconds, beating as they go | plucked
Monks folding sheets | Beating pair | secondFlame=0.67 tube=Half_closed between=0.52 flame=0.35 catch=1.2 embers=4 mouth=0.45 draught=0.03 flicker=0.1 roar=0.1 glass=0.15 width=0.98 lag=0.1 place=0.16 volume=-4 | dissolve | lowchoir | Half closed gas pairs, hollow low fifths that beat once or twice a second | voice
Pigeons under the arch | Beating pair | burn=15 secondFlame=0.83 tube=Half_closed fuel=Candle between=0.95 flame=0.8 catch=0.2 mouth=0.9 embers=0.7 draught=0.28 flicker=0.29 roar=0.1 glass=0.14 width=0.18 lag=0.08 place=0.31 volume=0 | stairwell | call | Hollow candle pairs beating in a soft fast coo | wind
Carpenter's level | Beating pair | burn=22 secondFlame=0.53 tube=Half_closed flame=0.75 between=0.4 place=0.08 catch=0.35 mouth=0.65 width=0.4 draught=0.38 flicker=0.02 roar=0.12 lag=0.21 volume=-3 | thick | suspend | Tall gas low in half closed tubes, round hollow tones on the edge of locking
Oars in weed | Beating pair | burn=17 secondFlame=0.74 tube=Half_closed fuel=Coal between=0.65 flame=0.5 catch=0.6 mouth=0.4 roar=0.65 embers=2 draught=0.05 flicker=0.1 glass=0.17 width=0.68 lag=0.38 place=0.36 volume=0.5 | preamp | tenths | Coal pairs in half closed tubes, a rough hollow beat with a low rush | texture
Cellos at the back | Beating pair | burn=20 secondFlame=0.68 tube=Double flame=0.5 between=0.5 catch=0.6 mouth=0.35 embers=1.6 draught=0.39 flicker=0.08 roar=0.07 width=0.57 lift=0.17 lag=0.18 place=0.36 volume=-4.5 | hiss | tenths | Double gas tubes in pairs, broad low strings that beat slowly apart
Ferry engine from above | Beating pair | secondFlame=0.67 tube=Double flame=0.8 between=0.8 catch=0.3 mouth=0.3 roar=0.35 embers=0.8 draught=0.3 flicker=0.31 glass=0.17 width=0.47 lag=0.36 place=0.26 | iron | fifths | Tall gas pairs in double tubes, a deep throb under a covered tone | drone
Slow handshake | Beating pair | burn=18 secondFlame=0.61 tube=Double fuel=Candle between=0.46 flame=0.4 catch=1.4 mouth=0.8 embers=3.5 draught=0.08 flicker=0.23 roar=0.26 glass=0.13 width=0.82 lag=0.24 place=0.32 volume=6 | wool | lamps | Candle pairs in double tubes, slow to swell and slower to beat
Contrary cellists | Beating pair | burn=10 secondFlame=0.3 tube=Double fuel=Spirit flame=0.35 between=0.7 catch=0.5 mouth=0.12 embers=1.2 draught=0.03 flicker=0.12 roar=0.16 width=0.37 lag=0.43 place=0.29 volume=-4.5 | bowed | suspend | Covered spirit pairs in double tubes, dark strings beating against one another
Underpass | Beating pair | secondFlame=0.81 tube=Double between=1 flame=0.25 catch=0.15 mouth=0.6 embers=2 width=1 draught=0.15 flicker=0.1 roar=0.23 lag=0.4 place=0.21 | tunnel | mooring | Double tubes with flames far apart, low tones fluttering from wall to wall | bass
Telegraph poles | Beating pair | secondFlame=0.87 tube=Flared flame=0.25 between=0.6 catch=0.5 mouth=0.85 embers=1.2 draught=0.01 flicker=0.1 roar=0.09 width=0.72 lag=0.42 place=0.3 volume=2 | comb | suspend | Flared gas pairs, thin bright strings with an even slow beat
Wasps in the marquee | Beating pair | fuel=Spirit burn=8 tube=Flared flame=0.45 between=1 catch=0.2 mouth=0.15 embers=0.5 secondFlame=0.7 draught=0.1 flicker=0.12 roar=0.02 glass=0.02 width=0.6 lag=0.18 place=0.34 volume=5 | outdoors | duet | Small spirit pairs in flared tubes, beating in a flutter, thin and insistent
Gold thread | Beating pair | secondFlame=0.4 tube=Flared fuel=Candle between=0.5 flame=0.5 catch=1 mouth=0.7 embers=3 roar=0.2 draught=0.33 flicker=0.02 width=0.92 lag=0.42 place=0.19 volume=-4.5 | plate | gather | Candle pairs in flared tubes, a fine high string tone beating at leisure
Wire and frost | Beating pair | burn=13 secondFlame=0.37 tube=Flared fuel=Spirit flame=0.1 between=0.66 catch=0.7 mouth=0.1 embers=2.5 draught=0.34 flicker=0.28 roar=0.04 glass=0.02 width=0.43 lag=0.33 place=0.24 volume=6 | frost | suspend | The smallest spirit pairs in flared tubes, nearly shut, beating like thin wire
Accordion ghosts | Beating pair | burn=20 secondFlame=0.62 tube=Flared fuel=Coal flame=0.4 between=0.8 catch=0.9 mouth=0.4 roar=0.3 embers=2 flicker=0.4 draught=0.31 glass=0 width=0.51 lag=0.11 place=0.27 volume=-4.5 | dusty | lamps | Flared coal pairs that flicker, beating in a throaty haze | texture
Fiddle in the pantry | Beating pair | burn=9 fuel=Spirit tube=Open flame=0.6 between=0.45 catch=0.15 mouth=0.22 embers=0.4 secondFlame=0.34 draught=0.36 flicker=0.36 roar=0.13 width=0.97 lag=0.33 place=0.13 volume=5 | cupboard | shepherd | Covered spirit pairs in open tubes, a small string tone slipping as it plays
Viols by candlelight | Beating pair | burn=12 secondFlame=0.72 fuel=Spirit tube=Half_closed flame=0.3 between=0.5 catch=0.45 mouth=0.3 embers=1 draught=0.38 flicker=0.09 roar=0.18 width=0.9 lag=0.32 place=0.17 volume=0 | chamber | chorale | Spirit pairs in half closed tubes, reedy old strings beating gently
Nettle soup | Beating pair | secondFlame=0.3 fuel=Spirit flame=0.6 between=0.72 catch=0.2 mouth=0.45 embers=0.6 tube=Narrow flicker=0.3 draught=0.34 roar=0.11 glass=0.22 width=0.56 lag=0.28 place=0.27 volume=-3.5 | glued | duet | Narrow spirit pairs half open, clear and beating
Sawtooth ridge | Beating pair | burn=15 secondFlame=0.35 fuel=Spirit tube=Open flame=1 between=0.55 catch=0.3 mouth=0.12 place=0.28 embers=1 draught=0.11 flicker=0.19 roar=0.17 glass=0.19 width=0.99 lag=0.4 volume=-3 | swirl | tenths | The tallest spirit flames, covered, slipping against each other in open tubes
Goose quills | Beating pair | secondFlame=0.39 fuel=Spirit tube=Open flame=0.45 between=0.85 catch=0.03 burn=2.5 embers=0.5 mouth=0.3 draught=0.05 flicker=0.05 roar=0.12 glass=0.23 width=0.75 lag=0.1 place=0.26 volume=-4.5 | canon | matches | Spirit pairs plucked in open tubes, beating briefly and burning away | plucked
Church heating | Beating pair | secondFlame=0.74 tube=Open flame=0.45 between=0.12 catch=0.8 mouth=0.55 embers=2 draught=0.02 flicker=0.12 roar=0.23 glass=0.02 width=0.77 lag=0.16 place=0.31 volume=-3.5 | hall | lamps | Two gas flames locked to one tone, wide and still with no beat at all | pad
Married forty years | Beating pair | secondFlame=0.71 tube=Half_closed flame=0.6 between=0 catch=0.4 mouth=0.8 embers=1 width=0.5 draught=0.05 flicker=0.07 roar=0.28 glass=0.09 lag=0.4 place=0.31 volume=-4.5 | trading | chorale | Gas pairs locked as close as they stand in half closed tubes, one hollow voice
Nearly agreed | Beating pair | secondFlame=0.33 flame=0.5 between=0.42 catch=0.6 mouth=0.5 embers=2.5 draught=0.3 flicker=0.32 roar=0.08 glass=0.06 width=0.8 lag=0.12 place=0.28 volume=-4.5 | latesway | gather | Narrow gas pairs that slip apart and fall back into step
Rails meeting | Beating pair | tube=Flared flame=0.8 between=0.18 catch=0.3 mouth=0.3 secondFlame=0.9 embers=0.8 draught=0.08 flicker=0.08 roar=0.09 width=0.76 lag=0.24 place=0.34 volume=2 | hall 1.mix=0.18 | suspend | Flared gas pairs locked into a single broad bright string
Yoke | Beating pair | secondFlame=0.90 tube=Double fuel=Coal between=0.22 flame=0.6 catch=0.7 mouth=0.35 roar=0.2 embers=2 draught=0.07 flicker=0 glass=0.01 width=0.47 lag=0.22 place=0.15 volume=-4 | giant | fifths | Coal pairs locked in double tubes, one dark rough mass | drone
Octave twins | Beating pair | secondFlame=0.80 lag=0.12 place=0.09 draught=0.02 tube=Open flame=0.3 between=0.6 catch=0.6 mouth=0.9 flicker=0.04 roar=0.1 glass=0.19 width=0.45 volume=-4.5 | slowchorus | lowchoir | Open gas pairs placed low, one flame at the octave and the other on the key
Twelfths in frost | Beating pair | secondFlame=0.51 lag=0.07 place=0.445 draught=0.02 tube=Half_closed flame=0.35 between=0.7 catch=0.8 mouth=0.8 embers=4 flicker=0.32 roar=0.21 glass=0.21 width=0.37 volume=-2.5 | winter | lowchoir | Half closed pairs in which the first flame sings a twelfth over the second
High wire act | Beating pair | burn=13 secondFlame=0.3 lag=0.15 place=0.04 draught=0.02 tube=Double flame=0.2 between=0.8 catch=0.3 mouth=0.7 embers=2 flicker=0.15 roar=0.33 glass=0.15 width=0.74 volume=-2.5 | warmbody 1.output=4 | call | Double pairs with a late flame, sounding above and below the key at once
Seams of light | Beating pair | secondFlame=0.4 lag=0.44 place=0.18 draught=0.04 fuel=Spirit flame=0.2 between=0.55 catch=0.9 mouth=0.25 embers=4 flicker=0.23 roar=0.13 glass=0.12 width=0.87 volume=-1 | glasshalo | lowchoir | Spirit pairs in narrow tubes, the first flame up on the fourth harmonic
Ladder of fifths | Beating pair | secondFlame=0.8 lag=0.43 place=0.08 draught=0.1 tube=Flared flame=0.3 between=0.62 catch=0.7 mouth=0.4 embers=3 flicker=0.24 roar=0.07 glass=0.03 width=0.51 volume=-4.5 | fifthshim | fifths | Flared pairs, one flame on the twelfth and one on the octave, fifths rising behind it
Mandolin weather | Beating pair | secondFlame=0.57 tube=Open flame=0.5 between=0.9 catch=0.03 burn=1.8 embers=0.6 mouth=0.5 glass=0.4 draught=0.4 flicker=0.15 roar=0.03 width=0.18 lag=0.17 place=0.26 volume=1 | dotted | ostinato | Gas pairs struck with a little glass in open tubes, beating and soon gone | plucked
Musical saw bench | Beating pair | burn=17 secondFlame=0.33 flame=0.3 between=0.88 catch=0.8 mouth=0.8 embers=2.5 draught=0.5 flicker=0.2 roar=0.21 glass=0.03 width=0.35 lag=0.32 place=0.16 volume=6 | latesway 1.depth=40 | song | Narrow gas pairs that swell late, beating fast and leaning | voice
Clockmaker's fan | Beating pair | secondFlame=0.72 tube=Half_closed flame=0.2 between=0.97 catch=0.03 burn=4 embers=0.7 mouth=0.75 glass=0.6 draught=0.24 flicker=0.17 roar=0.04 width=0.87 lag=0.31 place=0.14 volume=-1 | weave | taps | Half closed pairs tapped on their glass, fluttering as they burn down | keys
Dulcimer at the well | Beating pair | secondFlame=0.36 tube=Narrow fuel=Spirit glass=0.8 flame=0.15 between=0.6 catch=0.03 burn=9 embers=2 mouth=0.35 draught=0.05 flicker=0.18 roar=0.18 width=0.84 lag=0.07 place=0.26 | shaft | peal | Glass struck first, then narrow spirit pairs beating as they burn out | bell
Harpist's left hand | Beating pair | secondFlame=0.3 tube=Double flame=0.35 between=0.65 catch=0.03 burn=4 embers=1.2 mouth=0.45 draught=0.39 flicker=0.02 roar=0.02 width=0.8 lag=0.34 place=0.14 | tapeweight | rolled | Double gas pairs lit at once, low strings that beat and burn down | plucked
Moths at the globe | Beating pair | burn=14 secondFlame=0.5 fuel=Candle flame=0.85 between=0.75 flicker=0.9 catch=0.7 mouth=1 embers=2 roar=0.4 draught=0.06 glass=0.18 width=0.66 lag=0.17 place=0.28 volume=6 | stars | suspend | Narrow candle pairs that gutter and beat out of step with a rush of breath | texture
Riding at anchor | Beating pair | secondFlame=0.61 tube=Open fuel=Coal flame=0.45 between=0.58 flicker=0.5 catch=1 mouth=0.35 roar=0.5 embers=3 draught=0 width=0.4 lag=0.19 place=0.16 | loop | ground | Coal pairs in open tubes, flickering and beating low in their own roar | drone
Weathervane quarrel | Beating pair | secondFlame=0.45 tube=Half_closed between=0.7 draught=1 flame=0.4 catch=0.5 mouth=0.7 embers=2 flicker=0.18 roar=0.17 glass=0.09 width=0.92 lag=0.06 place=0.27 | tide | lamps | Half closed gas pairs thrown about by the draught, beating all the while | pad
Gears of the funicular | Beating pair | secondFlame=0.42 lift=0.45 flame=0.45 between=0.55 catch=0.6 mouth=0.75 embers=3 tube=Open draught=0.27 flicker=0.05 roar=0.07 glass=0.1 width=0.6 lag=0.08 place=0.25 volume=-4 | ascent | gather | Open gas pairs that beat and lift to their octave by turns | pad
Waltzing home drunk | Beating pair | burn=13 secondFlame=0.39 tube=Flared fuel=Candle between=0.68 flame=0.7 flicker=0.7 catch=0.4 mouth=0.6 embers=1.2 draught=0.31 roar=0.23 glass=0.05 width=0.53 lag=0.08 place=0.36 volume=-3.5 | seasick | tenths | Flared candles that flicker and beat unevenly, two to a key | string
`,
    },
    {
      id: 'octave-lifters',
      name: 'Octave lifters',
      category: 'pad',
      rows: `
Lanterns let go | Octave lifter | lift=0.5 catch=1.2 flame=0.4 embers=5 mouth=0.7 draught=0.15 flicker=0.3 roar=0.05 glass=0.21 width=0.51 secondFlame=0.12 between=0.05 lag=0.1 place=0.36 | valley | gather | Gas in open tubes, each key rising to its octave and sinking again
Bread under a cloth | Octave lifter | lift=0.3 flame=0.5 catch=0.6 mouth=0.3 embers=1.5 secondFlame=0.5 between=0.2 draught=0.09 flicker=0.1 roar=0.12 glass=0.06 width=0.62 lag=0.19 place=0.3 | warmdry | tenths | Covered gas, two flames locked, a note now and then lifting an octave
Kites over the allotment | Octave lifter | lift=0.62 flame=0.75 catch=0.4 mouth=0.75 draught=0.6 embers=2 width=1 flicker=0.06 roar=0.07 glass=0.16 secondFlame=0.16 between=0.69 lag=0.24 place=0.3 | wind | lamps | Tall gas flames leaning in a draught, most keys lifting to the octave
Staircase of steam | Octave lifter | lift=0.45 roar=0.6 flame=0.5 catch=0.9 mouth=0.5 flicker=0.4 embers=2.5 draught=0.06 width=0.62 secondFlame=0.06 between=0.22 lag=0.36 place=0.19 | breathhall | suspend | Open gas with a flickering rush, keys lifting through the steam
Choirboys yawning | Octave lifter | lift=0.4 fuel=Candle flame=0.6 catch=0.8 mouth=0.95 embers=2 secondFlame=0.3 draught=0.38 flicker=0.26 roar=0.2 glass=0.06 width=0.59 between=0.4 lag=0.41 place=0.19 | roundvowel | chorale | Candles in open tubes, soft keys that lift to the octave and drop back | voice
Trapdoor to the twelfth | Octave lifter | tube=Half_closed lift=0.5 flame=0.45 catch=0.7 mouth=0.75 embers=3 draught=0.24 flicker=0.05 roar=0.2 glass=0.01 width=0.45 secondFlame=0.14 between=0.01 lag=0.33 place=0.21 | rising | gather | Half closed gas that lets go of its note and lifts to the twelfth
Will o' the wisps | Octave lifter | burn=18 tube=Half_closed fuel=Candle lift=0.6 flicker=0.6 catch=1.4 mouth=1 embers=4 draught=0.4 roar=0.27 width=0.62 secondFlame=0.28 between=0.45 lag=0.39 place=0.24 volume=2.5 | stars | still | Half closed candles flickering up to their twelfths and down again | texture
Hollow hill | Octave lifter | tube=Half_closed lift=0.19 flame=0.7 catch=1 mouth=0.45 embers=5 place=0.3 draught=0.01 flicker=0.29 roar=0.28 glass=0.18 width=0.73 secondFlame=0.15 between=0.21 lag=0.16 | cave | suspend | Half closed gas, low and round, with a rare faint lift to the twelfth
Steep terraces | Octave lifter | burn=18 tube=Half_closed fuel=Spirit lift=0.55 flame=0.35 catch=0.4 mouth=0.35 embers=1.5 roar=0.1 draught=0.2 flicker=0.26 glass=0.15 width=0.75 secondFlame=0.22 between=0.46 lag=0.11 place=0.35 volume=0.5 | darkecho | duet | Spirit reeds in half closed tubes, each lifting a twelfth and coming home | wind
Well and bucket | Octave lifter | burn=15 tube=Half_closed lift=0.8 flame=0.3 catch=0.3 mouth=0.8 embers=2 secondFlame=0 draught=0.13 flicker=0.02 roar=0.01 glass=0.06 width=0.78 lag=0.35 place=0.29 volume=5 | shaft | call | Small gas flames that start low in half closed tubes and lift to the twelfth | voice
Thistle seed at dusk | Octave lifter | tube=Narrow lift=0.6 flame=0.25 catch=0.5 mouth=0.6 embers=3.5 roar=0.02 width=1 draught=0.11 flicker=0.18 glass=0.11 secondFlame=0.07 between=0.71 lag=0.24 place=0.21 volume=5 | faintshim | call | Narrow gas tubes, thin tones lifting and drifting down | voice
Slow elevator | Octave lifter | tube=Narrow lift=0.42 flame=0.5 catch=2 mouth=0.6 embers=6 draught=0.1 flicker=0.12 roar=0.03 glass=0.06 width=0.87 secondFlame=0.06 between=0.37 lag=0.14 place=0.29 | fan | still | Narrow gas that swells slowly and goes up an octave a key at a time
Dragonfly pond | Octave lifter | burn=22 tube=Narrow fuel=Spirit lift=0.5 flame=0.3 catch=0.1 mouth=0.3 embers=0.8 flicker=0.5 draught=0.22 roar=0.08 width=0.1 secondFlame=0.11 between=0.31 lag=0.27 place=0.29 | glimmer | ostinato | Narrow spirit tones, quick and flickering, most of them lifting before they end | plucked
Fledglings | Octave lifter | tube=Narrow fuel=Candle lift=0.7 flame=0.4 catch=0.3 mouth=0.95 roar=0.2 embers=1 secondFlame=0.6 between=0.7 draught=0.21 flicker=0.1 glass=0.07 width=0.48 lag=0.37 place=0.3 | evening | suspend | Narrow candle pairs, lifted and beating, light and wide awake
Ladder against the moon | Octave lifter | tube=Narrow lift=0.24 flame=0.65 catch=0.7 mouth=0.5 secondFlame=0.8 between=0.4 embers=4 draught=0.34 flicker=0.04 roar=0.02 glass=0.1 width=0.89 lag=0.23 place=0.11 volume=-8.5 | glow | gather | Tall narrow gas pairs that slip, and once in a while lift
Two storeys of light | Octave lifter | tube=Double lift=0.5 flame=0.4 catch=0.8 mouth=0.55 embers=3 draught=0.32 flicker=0.23 roar=0.34 glass=0.04 width=0.65 secondFlame=0.12 between=0.52 lag=0.19 place=0.24 | plate | lamps | Double gas tubes, the upper pipe lifting while the octave below stays
Heavy curtain rising | Octave lifter | tube=Double lift=0.65 flame=0.75 catch=1.6 mouth=0.35 embers=4 secondFlame=0.5 between=0.3 draught=0.07 flicker=0.04 roar=0.17 glass=0.2 width=0.94 lag=0.28 place=0.12 | smear | still | Tall covered gas in double tubes, swelling, then lifting off its foundation
Submerged spire | Octave lifter | tube=Double fuel=Candle lift=0.45 flame=0.5 catch=0.6 mouth=0.8 embers=5 draught=0.3 flicker=0.08 roar=0.29 glass=0.05 width=0.85 secondFlame=0.27 between=0.08 lag=0.29 place=0.16 | diver | lamps | Candles in double tubes lifting and settling, the low pipe steady below
Grandstand at dusk | Octave lifter | burn=22 tube=Double fuel=Spirit lift=0.4 flame=0.25 mouth=0.15 catch=0.9 embers=2.5 draught=0.33 flicker=0.33 roar=0 width=0.61 secondFlame=0.27 between=0.54 lag=0.21 place=0.3 volume=2.5 | ensemble | tenths | Covered spirit in double tubes, strings whose upper half lifts and returns | string
Tower crane | Octave lifter | tube=Double lift=0.75 flame=0.5 catch=0.5 mouth=0.5 roar=0.4 embers=2 width=0.9 draught=0.21 flicker=0.11 glass=0.11 secondFlame=0.2 between=0.62 lag=0.16 place=0.25 | slowing | fifths | Double tubes with the rush of gas, almost every key up on its octave | drone
Horns on the balcony | Octave lifter | tube=Flared lift=0.5 flame=0.55 catch=0.6 mouth=0.35 embers=1.5 secondFlame=0.3 draught=0.08 flicker=0.4 roar=0.07 glass=0.08 width=0.31 between=0.56 lag=0.27 place=0.31 | hall 1.mix=0.2 | suspend | Flared gas horns, covered, that break to the octave and settle | wind
Swifts at nine o'clock | Octave lifter | burn=17 tube=Flared lift=0.7 flame=0.3 catch=0.3 mouth=0.45 flicker=0.5 embers=1 draught=0.22 roar=0.13 width=0.85 secondFlame=0.18 between=0.73 lag=0.21 place=0.11 volume=0 | drifting | call | Small flared flames flickering up to the octave almost as soon as they sound | texture
Parchment sky | Octave lifter | tube=Open fuel=Candle lift=0.3 flame=0.7 catch=1.4 mouth=0.9 embers=4 roar=0.3 draught=0.34 flicker=0.05 glass=0.07 width=0.69 secondFlame=0.1 between=0.24 lag=0.26 place=0.19 volume=-9 | hanging | suspend | Open candles, clear tones that lift and sink again one by one
Blown open shutters | Octave lifter | burn=16 tube=Flared lift=0.55 draught=0.9 flame=0.5 catch=0.7 mouth=0.35 roar=0.5 embers=2 flicker=0.03 width=0.97 secondFlame=0.08 between=0.42 lag=0.23 place=0.27 volume=-0.5 | wind | lamps | Flared gas in a hard draught, roaring and lifting as the gusts lean on it | texture
Geese taking turns | Octave lifter | tube=Flared fuel=Coal lift=0.4 flame=0.4 catch=0.5 mouth=0.45 roar=0.25 embers=1.2 draught=0.06 flicker=0.36 glass=0.05 width=0.06 secondFlame=0 lag=0.44 place=0.3 volume=-1 | shore | duet | Flared coal, hoarse horns of which one lifts as the other stays | wind
Top floor only | High harmonic | fuel=Gas flame=0.3 catch=0.8 mouth=0.5 embers=3 roar=0.1 width=0.6 draught=0.18 flicker=0.01 glass=0.01 between=0.28 volume=-9 | chamber | lowchoir | Narrow gas tubes that live on their octave from the first breath
Frost on the aerial | High harmonic | tube=Open lag=0.21 place=0.17 lift=1 flame=0.2 catch=1.4 mouth=0.45 embers=5 draught=0.32 flicker=0.29 roar=0.1 glass=0.13 width=0.67 between=0.16 | nightradio | lamps | Open tubes lifted for good, only the octaves left, small and distant
Seven o'clock starlings | High harmonic | burn=18 tube=Half_closed lift=0.95 catch=0.2 mouth=0.8 flicker=0.6 flame=0.5 embers=1.5 draught=0.09 roar=0.21 width=0.71 between=0.38 volume=1 | leaves | ostinato | Half closed tubes living on their twelfths, flickering and quick | texture
Attic choir | High harmonic | tube=Double lift=0.9 lag=0.25 place=0.3 flame=0.6 catch=1 mouth=0.6 embers=3 draught=0.3 flicker=0.34 roar=0.05 glass=0.22 width=0.85 between=0.54 | choirhall | chorale | Double tubes split wide, the upper pipe lifted an octave and the lower one down | voice
Whistling past the gate | High harmonic | fuel=Spirit lift=0.85 flame=0.15 mouth=0.3 catch=0.25 embers=0.8 roar=0.15 secondFlame=0 draught=0.32 flicker=0.16 glass=0.12 width=0.73 | tiles | shepherd | Spirit in narrow tubes, whistling on the lifted octave with little body | wind
Porch swing | Octave lifter | lift=0.15 flame=0.4 catch=0.35 mouth=0.6 embers=1.2 secondFlame=0.7 between=0.6 draught=0.18 flicker=0.01 roar=0.13 glass=0.22 width=0.59 lag=0.15 place=0.32 | reel | tenths | Open gas pairs beating, with hardly a hint of the octave above
Wet paint | Octave lifter | burn=15 lift=0.2 fuel=Spirit flame=0.35 mouth=0.12 catch=0.6 embers=1.5 draught=0.27 flicker=0.24 roar=0.06 width=0.31 secondFlame=0 lag=0.38 place=0.17 volume=6 | glacial | tenths | Covered spirit in open tubes, a string tone with the faintest lift in it | string
Once in an evening | Octave lifter | tube=Narrow lift=0.22 flame=0.15 catch=1.5 mouth=0.9 embers=6 draught=0.05 flicker=0.07 roar=0.11 glass=0.14 width=0.88 secondFlame=0.22 between=0.12 lag=0.26 place=0.26 volume=0 | recall | onehigh | A narrow gas tone, very pure, that may just lift and fall back
Old lift shaft | Octave lifter | lift=0.28 fuel=Coal tube=Half_closed flame=0.6 catch=0.7 mouth=0.45 roar=0.2 embers=2.5 draught=0.35 flicker=0.08 glass=0.15 width=0.37 secondFlame=0.09 between=0.51 lag=0.43 place=0.12 | shaft | fifths | Half closed coal, dark and dull, reaching for its twelfth and failing | drone
Cushions | Octave lifter | burn=21 lift=0.18 fuel=Candle tube=Double flame=0.3 catch=0.5 mouth=0.85 embers=1 roar=0.1 width=0.3 draught=0.23 flicker=0.06 glass=0.12 secondFlame=0.17 between=0.64 lag=0.41 place=0.2 | feltair | rolled | Small candles in double tubes, padded and near, hardly lifting | keys
Spring-loaded | Octave lifter | lift=0.9 catch=0.03 burn=3 embers=0.6 flame=0.5 mouth=0.6 glass=0.3 draught=0.1 flicker=0.23 roar=0.06 width=0.39 secondFlame=0.24 between=0.33 lag=0.35 place=0.15 volume=1 | slap | matches | Open gas struck with a tap of glass, jumping to the octave and burning away | plucked
Pebbles up a chimney | Octave lifter | tube=Half_closed lift=1 catch=0.04 burn=4 embers=0.5 flame=0.35 mouth=0.8 draught=0.26 flicker=0.06 roar=0.3 glass=0.03 width=0.36 secondFlame=0 lag=0.2 place=0.36 volume=5 | bounces | taps | Half closed gas plucked and lifted to the twelfth, gone in four seconds | plucked
Popping corn | Octave lifter | fuel=Spirit tube=Narrow lift=1 catch=0.06 burn=2.5 embers=0.3 flame=0.4 mouth=0.45 draught=0.17 flicker=0.09 roar=0.07 glass=0.14 width=0.87 secondFlame=0.1 between=0.37 lag=0.37 place=0.22 volume=1.5 | hops | matches | Spirit struck in narrow tubes, lifted before it dies in two seconds | plucked
Rising damp bells | Octave lifter | tube=Narrow glass=0.8 lift=0.6 catch=0.3 flame=0.3 mouth=0.6 embers=4 burn=15 draught=0.27 flicker=0.05 roar=0.19 width=0.91 secondFlame=0 lag=0.06 place=0.3 volume=3.5 | risingmist | toll | Narrow glass rung first, a gas tone after it that lifts as the ring goes | bell
Trampoline at midnight | Octave lifter | tube=Double lift=0.7 catch=0.04 burn=4 embers=0.8 flame=0.6 mouth=0.45 glass=0.2 draught=0 flicker=0.07 roar=0.13 width=0.84 secondFlame=0.13 between=0.74 lag=0.41 place=0.2 | stack | ostinato | Double tubes struck low, the upper pipe lifting as the fuel burns down | keys
Geyser field | Octave lifter | burn=18 roar=0.8 lift=0.55 flicker=0.5 catch=1.5 flame=0.6 mouth=0.5 embers=3 tube=Flared draught=0.03 glass=0.07 width=0.47 secondFlame=0.29 between=0.51 lag=0.12 place=0.28 volume=-7 | cavern | still | Flared gas more roar than tone, its octaves lifting and dropping | texture
Cinders going up | Octave lifter | burn=21 fuel=Coal lift=0.6 flicker=0.7 roar=0.5 catch=0.8 flame=0.35 mouth=0.6 embers=3 draught=0.24 width=0.91 secondFlame=0 lag=0.11 place=0.28 volume=0 | sparks | single | Open coal flickering and crackling, its tone lifting off the grate | texture
Wing mirrors | Octave lifter | burn=12 lift=0.5 secondFlame=1 between=0.9 tube=Flared flame=0.35 catch=0.4 mouth=0.4 embers=1.5 width=1 draught=0.11 flicker=0.28 roar=0.04 glass=0.14 lag=0.31 place=0.31 volume=4.5 | pendulum | suspend | Flared pairs, wide, beating fast and lifting at different moments | texture
Balloon over vineyards | Octave lifter | lift=0.45 roar=0.45 catch=3 flame=0.5 mouth=0.4 embers=8 tube=Double fuel=Gas flicker=0.1 draught=0.34 glass=0.23 width=0.44 secondFlame=0.09 between=0.21 lag=0.09 place=0.33 | openspace | still | Double gas with a long slow burner's rush, swelling and lifting calmly
Overtaking on the hill | Octave lifter | burn=9 lift=0.65 tube=Open fuel=Gas flame=0.95 catch=0.2 mouth=0.3 embers=0.8 flicker=0.2 lag=0.25 draught=0.37 roar=0.15 glass=0.1 width=0.49 secondFlame=0.04 between=0.15 volume=-1.5 | throb | chorale | Tall covered gas in open tubes, full chords breaking up to the octave | organ
Wind harp on a gable | Octave lifter | lag=0.33 place=0.42 lift=0.4 draught=0.5 flame=0.35 catch=1 mouth=0.55 embers=4 flicker=0.03 roar=0.28 glass=0.06 width=0.42 secondFlame=0.21 between=0.66 | strings | gather | Late flames high in open tubes, moving between octave and key in a draught | string
Ghost of the fifth | Octave lifter | tube=Half_closed lag=0.09 place=0.42 draught=0.3 lift=0.5 flame=0.4 catch=0.8 mouth=0.7 embers=3 flicker=0.14 roar=0.29 glass=0.02 width=0.64 secondFlame=0.24 between=0.61 | padfifth | lowchoir | Half closed gas that keeps finding its twelfth, high over a low chord | voice
Shadow across barley | Slow weather | secondFlame=0.2 tube=Open lift=0.55 catch=1.2 embers=4 mouth=0.75 draught=0.6 flicker=0.3 glass=0.16 width=0.91 between=0.7 lag=0.29 place=0.23 volume=-5.5 | currents | lamps | Open candles leaning as one, lifting here and there like a field in wind | pad
Little ladders | Octave lifter | tube=Narrow fuel=Gas lift=0.5 flame=0.2 catch=0.06 burn=6 embers=1.5 mouth=0.75 glass=0.4 draught=0.15 flicker=0.1 roar=0.08 width=0.4 secondFlame=0.14 between=0.23 lag=0.32 place=0.26 volume=1.5 | marbles | peal | Narrow gas tapped on glass, thin tones that lift as they burn down | bell
Homing pigeons | Octave lifter | burn=15 fuel=Candle tube=Half_closed lift=0.45 flame=0.75 catch=0.25 mouth=0.9 embers=0.7 roar=0.3 draught=0.13 flicker=0.26 glass=0.13 width=0.39 secondFlame=0.17 between=0.65 lag=0.19 place=0.11 volume=0 | backwards | duet | Half closed candles, soft coos that lift to the twelfth and come back | wind
`,
    },
    {
      id: 'roaring-drones',
      name: 'Roaring drones',
      category: 'drone',
      rows: `
Blast gate | Roaring drone | flame=0.95 mouth=0.35 catch=1.2 roar=0.7 draught=0.3 embers=3 flicker=0.03 glass=0.03 width=0.42 secondFlame=0.04 between=0.21 lag=0.28 place=0.32 | hall 1.mix=0.2 | ground | Flared gas at full height under half a lid, a steady bright wall of rushing air
Hot air balloon basket | Roaring drone | flame=0.5 roar=1 mouth=0.25 catch=0.8 burn=9 embers=2 draught=0.08 flicker=0.38 glass=0.09 width=0.86 secondFlame=0 lag=0.19 place=0.31 volume=1 | outdoors | fifths | Flared gas at its loudest rush, a thin tone inside it, burning down | texture
Solar wind | Roaring drone | flame=0.3 roar=0.6 mouth=0.25 draught=0.9 width=0.75 catch=2 lift=0.1 flicker=0.09 glass=0.1 secondFlame=0.03 between=0 lag=0.38 place=0.2 volume=-3 | tide | fifths | Small flared flames in a hard draught, bright air leaning to and fro
Sheet metal sky | Roaring drone | fuel=Spirit flame=0.35 roar=0.4 mouth=0.06 catch=1.5 embers=4 draught=0.4 flicker=0.11 glass=0.21 width=0.92 secondFlame=0.03 between=0.23 lag=0.15 place=0.28 volume=-5.5 | glacial | deep | Spirit in flared tubes nearly shut, a metallic edge with a rush behind
Horn section asleep | Roaring drone | roar=0.35 flame=0.6 place=0.35 mouth=0.3 secondFlame=0.7 between=0.2 catch=1.8 draught=0.2 flicker=0.04 glass=0.1 width=0.42 lag=0.3 volume=0.5 | darkhall | ground | Flared gas pairs locked together, a covered brass drone with little weight below
Engine room, idle | Roaring drone | tube=Double fuel=Coal roar=0.5 flame=0.6 mouth=0.3 catch=0.9 secondFlame=0.6 between=0.7 draught=0.15 flicker=0.01 glass=0.21 width=0.56 lag=0.19 place=0.28 | iron | pedal | Coal pairs in double tubes beating low in a steady roar
Slow shelf of rock | Roaring drone | tube=Double fuel=Coal roar=0.3 flame=0.35 mouth=0.2 catch=2.5 draught=0.8 embers=8 flicker=0.04 glass=0.03 width=0.76 secondFlame=0.08 between=0.45 lag=0.14 place=0.33 | crypt | basin | Covered coal in double tubes, very slow to swell, leaning heavily
Tunnel boring | Roaring drone | tube=Flared fuel=Coal roar=0.9 flame=1 mouth=0.45 flicker=0.5 catch=0.6 draught=0.01 width=0.6 secondFlame=0.09 between=0.29 lag=0.42 place=0.1 volume=-10 | tunnel | pedal | Tall coal roaring in flared tubes, grinding and flickering as it goes
Cellar under cellar | Roaring drone | tube=Double fuel=Gas roar=0.25 flame=0.2 place=0.38 mouth=0.18 catch=1 draught=0.2 flicker=0.39 glass=0.05 width=0.45 secondFlame=0.18 between=0.71 lift=0.16 lag=0.25 volume=-12 | cistern | basin | Small covered gas in double tubes, a dark hum an octave under the key
Ship's plates | Roaring drone | tube=Double fuel=Spirit roar=0.3 flame=0.5 mouth=0.12 catch=1.2 secondFlame=0.43 between=0.6 embers=4 draught=0.04 flicker=0.01 glass=0.09 width=0.65 lag=0.2 place=0.18 volume=-9 | strings | ground | Covered spirit pairs in double tubes, beating like a hull that sings
Bagpiper's uncle | Hollow reed | flame=0.9 mouth=0.3 catch=0.4 embers=0.8 secondFlame=0.41 between=0.45 roar=0.3 draught=0.17 flicker=0.02 glass=0.03 width=0.89 lag=0.1 place=0.24 volume=-5 | hollow | fifths | Tall spirit pairs in half closed tubes, a reed drone slipping against itself
Harmonium left on | Hollow reed | tube=Open flame=0.5 mouth=0.2 catch=0.6 embers=1.2 secondFlame=0.6 between=0.5 width=0.6 draught=0.16 flicker=0.29 roar=0.04 glass=0.24 lag=0.41 place=0.21 volume=-4.5 | woodbox | ground | Covered spirit pairs in open tubes, a free reed drone that beats slowly | organ
Shruti box in a kitchen | Hollow reed | flame=0.4 mouth=0.35 catch=0.8 draught=0.6 embers=1.5 roar=0.2 width=0.4 flicker=0.34 glass=0.2 lag=0.13 place=0.3 | breathing | fifths | Spirit in half closed tubes leaning in and out like bellows
Wire fence humming | Hollow reed | tube=Narrow flame=0.7 mouth=0.25 catch=1 secondFlame=0.37 between=0.75 embers=3 draught=0.3 flicker=0.12 roar=0.16 glass=0.16 width=0.3 lag=0.17 place=0.26 volume=-4.5 | feedback | fifths | Tall narrow spirit pairs, a keen hum that beats and drifts
Chanter and drones | Hollow reed | tube=Double flame=0.6 mouth=0.22 catch=0.5 embers=0.6 flicker=0.1 draught=0.04 roar=0.04 glass=0.13 width=0.75 lag=0.21 place=0.36 volume=0 | parlour | ground | Spirit in double tubes, a reed with its octave below, plain and near
Grotto | Warm flame pad | tube=Half_closed flame=0.35 mouth=0.3 catch=1.4 embers=5 draught=0.5 flicker=0.37 roar=0.03 glass=0.01 width=0.95 secondFlame=0 lift=0.13 lag=0.24 place=0.12 | cave | deep | Half closed gas, covered, a hollow low drone leaning in slow air
Monks on the ferry | Warm flame pad | tube=Half_closed fuel=Candle flame=0.7 mouth=0.9 catch=1 secondFlame=0.39 between=0.42 embers=3 draught=0.02 flicker=0.26 glass=0.17 width=0.82 lift=0.11 lag=0.44 place=0.29 | monks | ground | Candle pairs in half closed tubes, hollow and slipping, hardly voiced | voice
Inside the grain store | Warm flame pad | tube=Half_closed flame=0.85 place=0.36 mouth=0.45 catch=0.8 roar=0.2 embers=2.5 draught=0.18 flicker=0.07 glass=0.13 width=0.35 secondFlame=0 lift=0.14 lag=0.32 | giant | pedal | Tall gas high in half closed tubes, a broad hollow drone, all but unmoving
Harbour iced over | Warm flame pad | tube=Half_closed fuel=Spirit flame=0.15 mouth=0.3 catch=1.8 lift=0.29 embers=7 draught=0.38 flicker=0.05 roar=0.05 glass=0.16 width=0.85 secondFlame=0.06 between=0.4 lag=0.16 place=0.3 | winter | deep | Small spirit flames in half closed tubes, lifting to the twelfth now and then
Mortar and lime | Warm flame pad | tube=Half_closed fuel=Coal flame=0.4 mouth=0.35 catch=1.2 roar=0.7 flicker=0.4 embers=3 draught=0.35 width=0.51 secondFlame=0.25 between=0.53 lift=0.17 lag=0.24 place=0.36 | dusty | deep | Half closed coal flickering in a low roar, grey and grainy
Hay standing uncut | - | flame=0.3 catch=1.5 mouth=0.6 lift=0.4 draught=0.1 secondFlame=0.3 between=0.5 embers=5 flicker=0.27 roar=0.15 glass=0.21 width=0.8 lag=0.23 place=0.31 | whistled | fifths | Open gas, small flames that lift one after another over the fifth
Long distance call | - | flame=0.6 lag=0.28 mouth=0.35 catch=0.9 roar=0.15 secondFlame=0.9 between=0.48 embers=3 draught=0.11 flicker=0.36 glass=0.03 width=0.93 lift=0.15 | swirl | ground | Two covered gas flames in open tubes, a warm drone slipping and pulling
Gasworks lullaby | - | flame=0.45 roar=0.85 mouth=0.4 catch=1.6 lift=0.1 flicker=0.4 embers=4 draught=0.1 width=0.84 secondFlame=0 lag=0.28 place=0.34 | breathhall | fifths | Open gas flickering, with a soft rush beside the tone it carries
Tin roof, midday | - | flame=0.95 place=0.05 lag=0.24 mouth=0.45 catch=0.7 lift=0 draught=0.2 embers=2 flicker=0.09 roar=0.33 glass=0.2 width=0.79 secondFlame=0.24 between=0.12 | comb | ground | Tall gas low in open tubes, all edge and overtones, standing nearly still
Sodium light | - | flame=0.1 catch=2 mouth=0.75 lift=0 flicker=0.05 draught=0.05 roar=0.05 secondFlame=0.35 between=0.4 embers=6 tube=Narrow glass=0.06 width=0.53 lag=0.32 place=0.27 volume=-1 | earbeat | fifths | Thin narrow gas pairs, two pure tones on the edge of locking
Aurora camp | - | lag=0.385 place=0.42 draught=0.35 flame=0.35 tube=Open catch=1.5 mouth=0.65 embers=6 flicker=0 roar=0.24 glass=0.02 width=0.64 secondFlame=0.16 between=0.6 | ascent | deep | Late flames high in open tubes, going between the octave and the twelfth
Cold front | - | lag=0.08 place=0.44 draught=0.25 tube=Half_closed flame=0.5 roar=0.25 catch=1.2 mouth=0.75 lift=0 flicker=0.27 glass=0.04 width=0.33 secondFlame=0.04 between=0.15 | far | deep | Half closed tubes on the twelfth, cold and thin, high over low keys
Overtone well | - | lag=0.17 place=0.44 draught=0.5 fuel=Spirit tube=Open flame=0.4 mouth=0.2 catch=1 lift=0 embers=4 flicker=0.15 roar=0.13 glass=0.15 width=0.71 secondFlame=0.11 between=0.35 | beating | pedal | Spirit high in open tubes, stepping up to a high harmonic as the draught leans
Fifteenth floor | - | lag=0.44 place=0.18 draught=0.06 fuel=Spirit tube=Narrow flame=0.25 mouth=0.3 catch=1.6 lift=0 secondFlame=0.4 between=0.5 embers=5 flicker=0.39 roar=0.14 glass=0.05 width=0.62 volume=4.5 | glasshalo 1.mix=0.15 | pedal | Narrow spirit, its first flame two octaves up and a second one far below it
Pylons walking | - | lag=0.12 place=0.08 draught=0.6 tube=Flared fuel=Gas flame=0.3 mouth=0.45 catch=1 lift=0 embers=3 flicker=0.07 roar=0.24 glass=0.1 width=0.38 secondFlame=0.18 between=0.59 | notch | ground | Flared gas between its octave and its twelfth as a draught leans on it
Gap under the door | Slow weather | fuel=Gas draught=1 flame=0.3 roar=0.8 mouth=0.8 catch=1.2 glass=0.16 width=0.96 between=0.47 lift=0.18 lag=0.27 place=0.31 volume=-2.5 | nextdoor | deep | Gas pairs in double tubes in the hardest draught, a rush that comes and goes
Beehive in the wall | Slow weather | tube=Half_closed flicker=0.3 secondFlame=1 between=0.9 mouth=0.8 catch=0.9 draught=0.3 glass=0.12 width=0.49 lift=0.14 lag=0.29 place=0.23 volume=-6 | pipe | fifths | Candle pairs in half closed tubes, beating, a soft hum behind plaster
Dawn on the peat bog | Slow weather | secondFlame=0.1 fuel=Coal tube=Open draught=0.55 mouth=0.3 catch=1.5 roar=0.3 flicker=0.4 width=0.67 between=0.28 lift=0.14 lag=0.29 place=0.27 volume=-7.5 | mist | ground | Open coal, covered and leaning, flickering lower than it sounds
Wool before weaving | Slow weather | secondFlame=0.7 tube=Open mouth=0.85 flicker=0.15 roar=0.2 draught=0.5 between=0.42 catch=1.8 glass=0.22 width=0.73 lift=0.16 lag=0.26 place=0.36 volume=-3 | wool | fifths | Candle pairs in open tubes, slipping, leaning, all soft overtones
Sleeping volcano | Slow weather | fuel=Coal tube=Open roar=1 draught=0.7 flicker=0.9 mouth=0.2 catch=1 secondFlame=1 between=0.9 embers=5 width=0.89 lift=0.12 lag=0.15 place=0.31 | slack | pedal | Open coal pairs, covered, roaring low and beating as they gutter and lean
Chimney choir | Furnace choir | tube=Flared fuel=Candle roar=0.5 mouth=0.75 flame=0.6 catch=1.2 lift=0.2 draught=0.06 flicker=0.05 glass=0.09 width=0.91 lag=0.17 place=0.24 | oohall | fifths | Candle pairs in flared tubes, breathy and locked loosely, a rush of soft air | voice
Pit pony | Furnace choir | fuel=Coal flame=0.45 mouth=0.3 between=0.6 catch=0.8 roar=0.25 draught=0.2 flicker=0.07 glass=0.23 width=0.53 lift=0.19 lag=0.42 place=0.3 volume=-2.5 | combo | ground | Coal pairs in double tubes, dark and beating, close and a little pushed
Vats | Furnace choir | secondFlame=0.32 fuel=Spirit flame=0.3 mouth=0.28 between=0.45 catch=1 roar=0.9 draught=0.35 embers=4 flicker=0.35 glass=0.18 width=0.98 lift=0.11 lag=0.19 place=0.16 | pipe | pedal | Spirit pairs nearly shut in double tubes, slipping in a rush of vapour
Great wheel turning | Furnace choir | secondFlame=0.41 flame=0.75 mouth=0.4 between=0.5 catch=1.4 draught=0.8 roar=0.3 flicker=0.38 glass=0.14 width=0.69 lift=0.13 lag=0.3 place=0.11 volume=-13.5 | rotor | fifths | Tall gas pairs in double tubes, leaning slowly round and beating
Sediment | Furnace choir | secondFlame=0.6 fuel=Candle flame=0.4 mouth=0.7 between=0.1 catch=2.2 roar=0.15 embers=7 lift=0 draught=0.04 flicker=0.04 glass=0.2 width=0.58 lag=0.29 place=0.18 volume=-1 | descent | basin | Candle pairs in double tubes, soft and slow, settling
Radiator at night | Dying embers | burn=40 tube=Half_closed flicker=0.5 roar=0.25 catch=0.8 mouth=0.4 draught=0.2 glass=0.15 width=0.83 secondFlame=0.16 between=0.17 lift=0.18 lag=0.27 place=0.28 | cupboard | deep | Half closed coal, a low dull hum that flickers and ticks
Oil drum fire | Dying embers | burn=18 roar=0.85 flame=0.7 catch=0.5 mouth=0.55 flicker=0.7 draught=0.02 width=0.51 secondFlame=0.23 between=0.33 lift=0.19 lag=0.07 place=0.25 volume=0.5 | outdoors | fifths | Open coal roaring and flickering hard, crackle before tone | texture
Coke ovens | Dying embers | tube=Double burn=40 roar=0.6 flame=0.85 mouth=0.35 flicker=0.35 catch=1.2 draught=0.6 width=0.61 secondFlame=0.26 between=0.2 lift=0.11 lag=0.12 place=0.25 | melted | ground | Tall coal in double tubes, roaring and leaning, thick and hot
Smouldering thatch | Dying embers | tube=Flared burn=16 roar=0.12 flame=0.35 mouth=0.28 catch=1.5 flicker=0.6 draught=0.3 glass=0.22 width=0.61 secondFlame=0.13 between=0.07 lift=0.15 lag=0.12 place=0.25 volume=2.5 | hanging | fifths | Flared coal, a thin throaty smoulder that flickers and sinks | texture
Cinder path, late | Dying embers | tube=Narrow burn=30 roar=0.35 flame=0.5 mouth=0.6 catch=1 secondFlame=0.6 between=0.7 draught=0.27 glass=0.12 width=0.33 lift=0.18 lag=0.42 place=0.17 | cassette | fifths | Narrow coal pairs, smoky tones that beat and flicker over the fifth
Substation hum | - | tube=Double fuel=Spirit flame=0.8 mouth=0.3 catch=0.4 draught=0.05 flicker=0 roar=0 secondFlame=0.45 between=0.85 embers=1 glass=0.09 width=0.99 lift=0.1 lag=0.21 place=0.17 | bare | fifths | Tall spirit pairs in double tubes, the mouth half shut, beating evenly
Lorry on the ice | - | tube=Narrow fuel=Spirit flame=0.3 mouth=0.25 catch=1.8 lift=0.5 draught=0.2 embers=8 width=1 flicker=0.04 roar=0.02 glass=0.19 secondFlame=0.19 between=0.56 lag=0.25 place=0.34 volume=0 | frozen | deep | Thin spirit flames in narrow tubes, lifting and sinking on their own
Power cut, candles out | - | fuel=Candle tube=Double flame=0.5 mouth=0.9 catch=0.8 burn=10 flicker=0.6 embers=4 draught=0.07 roar=0.16 glass=0.16 width=0.7 secondFlame=0.14 between=0.59 lift=0.15 lag=0.44 place=0.32 volume=-1 | tails | ground | Candles in double tubes that flicker, thin and burn out over the low fifth
Two rivers meeting | - | tube=Half_closed flame=0.55 secondFlame=1 between=0.55 draught=0.5 mouth=0.55 catch=1.2 width=1 flicker=0.12 roar=0.22 glass=0.22 lift=0.11 lag=0.34 place=0.27 | midbeat | pedal | Half closed gas pairs that slip and lean, two hollow tones turning about
Sunday traffic | - | tube=Open fuel=Coal roar=0.6 flame=0.3 mouth=0.3 catch=1 draught=0.7 width=0.9 embers=4 flicker=0.19 glass=0.09 secondFlame=0.12 between=0.19 lift=0.12 lag=0.25 place=0.31 | shelf | fifths | Coal low in open tubes, more roar than note, leaning and passing by
`,
    },
    {
      id: 'glass-taps',
      name: 'Glass taps',
      category: 'keys',
      rows: `
Jam jar piano | Glass tap keys | flame=0.2 mouth=0.75 burn=3 embers=0.6 draught=0.02 flicker=0.32 roar=0.06 width=0.64 between=0.27 lag=0.18 place=0.24 volume=-5.5 | bare | ostinato | Half closed tubes tapped as they light, clear glass over a small hollow tone that burns away
Pharmacy shelves | Glass tap keys | glass=0.6 tube=Narrow fuel=Spirit burn=2 mouth=0.4 embers=0.4 flame=0.15 draught=0.03 flicker=0.35 roar=0.11 width=0.41 between=0.68 lag=0.29 place=0.1 volume=-5.5 | shell | taps | Narrow spirit tubes, a small tap of glass and a thin tone, gone in two seconds
Chimes in a fruit bowl | Glass tap keys | glass=1 burn=8 embers=3 mouth=0.8 flame=0.15 secondFlame=0 draught=0.31 flicker=0.3 roar=0.1 width=0.36 lag=0.38 place=0.11 volume=-4.5 | sheen | peal | Half closed tubes rung hard, their glass humming on over a faint flame
Doorbell in the rain | Glass tap keys | tube=Open flame=0.45 glass=0.7 burn=5 mouth=0.6 secondFlame=0.3 between=0.6 draught=0.12 flicker=0.14 roar=0.31 width=0.6 lag=0.09 place=0.36 volume=-4.5 | springs | call | Open gas pairs tapped on their glass, a chime with a beating tone dying beneath
Optician's tray | Glass tap keys | glass=0.5 flame=0.1 fuel=Candle burn=1.5 embers=0.3 mouth=1 width=0.2 draught=0.08 flicker=0.02 roar=0.13 between=0.42 lag=0.35 place=0.32 volume=1 | mike | taps | A light tap of glass and the smallest candle, over at once and very near
Letter opener | Spirit pluck | catch=0.06 flame=0.5 burn=5 mouth=0.22 embers=0.4 tube=Open glass=0.04 draught=0.35 flicker=0.37 roar=0.22 width=0.68 lag=0.35 place=0.2 volume=1 | folded | matches | Spirit plucked in open tubes, neat, and fading soon after | plucked
Harpsichord in a shed | Spirit pluck | catch=0.06 tube=Open flame=0.9 burn=4 mouth=0.3 place=0.1 embers=0.25 draught=0.12 flicker=0.09 roar=0.33 glass=0.02 width=0.44 volume=-1 | woodbox | rolled | Tall spirit low in open tubes, plucked, buzzing and bright as it burns down | keys
Banjo on the step | Spirit pluck | tube=Half_closed flame=0.8 burn=1 mouth=0.6 embers=0.3 place=0.08 draught=0.17 flicker=0 roar=0.34 glass=0.12 width=0.24 lag=0.35 volume=1 | shells | ostinato | Spirit plucked in half closed tubes, dry and snappy, gone in a second | plucked
Zinc counter | Spirit pluck | flame=0.4 burn=4 mouth=0.18 glass=0.5 secondFlame=0.7 between=0.9 draught=0.35 flicker=0.12 roar=0.07 width=0.62 lag=0.1 place=0.25 | slap | taps | Flared spirit pairs struck with a tap of glass, beating tinnily as they burn down
Keys behind a curtain | Spirit pluck | tube=Open flame=0.3 burn=3.5 mouth=0.12 embers=0.3 flicker=0.3 draught=0.13 roar=0.03 glass=0.05 width=0.26 lag=0.37 place=0.25 volume=-2 | booth | chorale | Covered spirit plucked in open tubes, close and quiet, burning down quickly | keys
Nursery xylophone | Glass tap keys | tube=Open flame=0.7 glass=0.15 burn=0.8 embers=0.3 mouth=0.85 fuel=Gas draught=0.37 flicker=0.06 roar=0.09 width=0.15 between=0.63 lag=0.21 place=0.3 volume=6 | thinned | ostinato | Open gas lit in an instant and out in under a second, a light wooden knock | plucked
Marimba at the spa | Glass tap keys | tube=Half_closed flame=0.4 glass=0.2 burn=2 embers=0.8 mouth=0.4 place=0.32 draught=0.26 flicker=0.11 roar=0.02 width=0.88 between=0.13 lag=0.28 volume=2 | hall 1.mix=0.2 | ostinato | Covered gas struck in half closed tubes, round and gone in two seconds
Two coconut shells | Glass tap keys | tube=Half_closed fuel=Candle flame=0.9 glass=0.1 burn=0.5 embers=0.35 mouth=0.95 draught=0.35 flicker=0.06 roar=0.26 width=0.15 between=0.45 lag=0.3 place=0.32 volume=6 | clay | matches | Candles struck in half closed tubes, soft dull knocks that die at once | plucked
Log drum on the beach | Glass tap keys | tube=Half_closed fuel=Coal flame=0.7 glass=0.1 burn=1 embers=0.3 mouth=0.5 roar=0.3 draught=0.17 flicker=0.09 width=0.7 between=0.08 lag=0.3 place=0.28 volume=6 | outdoors | matches | Coal struck in half closed tubes, short low wooden thuds with grit | plucked
Balafon under the mango | Glass tap keys | tube=Half_closed flame=0.65 glass=0.3 burn=1.5 embers=0.4 mouth=0.65 secondFlame=0.6 between=0.8 draught=0.08 flicker=0.32 roar=0.08 width=0.69 lag=0.2 place=0.31 volume=4 | papery | ostinato | Half closed pairs tapped on the glass, buzzing and beating, soon burnt out
Upright, lid closed | Warm flame pad | catch=0.04 burn=6 embers=0.4 flame=0.4 mouth=0.2 lift=0.1 secondFlame=0.2 roar=0.05 draught=0.19 flicker=0.07 glass=0.21 width=0.22 between=0.56 lag=0.08 place=0.27 volume=1 | parlour | rolled | Covered gas lit at once in open tubes, a felted key that burns down in six seconds | keys
Reading lamp | Warm flame pad | tube=Narrow catch=0.05 burn=5 embers=0.6 flame=0.3 mouth=0.5 lift=0 secondFlame=0 draught=0.07 flicker=0.11 roar=0.11 glass=0.1 width=0.58 lag=0.08 place=0.23 volume=-1.5 | feltair | chorale | Narrow gas lit at once, a soft pure key that thins as its fuel goes | keys
Piano in a brownout | Warm flame pad | tube=Narrow glass=0.35 catch=0.03 burn=7 embers=0.5 flame=0.5 mouth=0.6 lift=0.18 secondFlame=0.3 between=0.5 draught=0.16 flicker=0.19 roar=0.3 width=0.67 lag=0.22 place=0.27 volume=0.5 | amptrem | rolled | Narrow gas with a tap of glass, bell in front and round behind, fading | keys
Toast rack | Warm flame pad | tube=Flared catch=0.03 burn=2 embers=0.3 flame=0.5 mouth=0.35 lift=0.16 roar=0.1 secondFlame=0 draught=0.11 flicker=0.01 glass=0.23 width=0.72 lag=0.39 place=0.22 | combo | matches | Flared gas lit at once, a thin bright key that burns away in two seconds | keys
Organ with no bellows | Warm flame pad | tube=Double catch=0.04 burn=10 embers=0.25 flame=0.5 mouth=0.4 lift=0 secondFlame=0.5 between=0.15 draught=0.01 flicker=0.02 roar=0.11 glass=0.23 width=0.76 lag=0.09 place=0.28 | glued | chorale | Double gas pairs lit at once, a full organ chord running out | organ
Hearthside kalimba | Glass tap keys | tube=Narrow flame=0.35 glass=0.3 burn=1.5 embers=0.8 mouth=0.5 draught=0.2 flicker=0.16 roar=0.05 width=0.72 between=0.14 lag=0.25 place=0.14 volume=0 | woodbox | ostinato | Narrow gas struck with a small tap of glass, gone in a second or two | plucked
Music box in the sun | Glass tap keys | tube=Narrow glass=0.55 flame=0.1 burn=2.2 embers=0.5 mouth=0.5 lag=0.385 place=0.4 draught=0.03 flicker=0.06 roar=0.04 width=0.44 between=0.72 volume=-8 | smaller | carillon | Narrow glass tapped, with a brief thin flame at the octave | bell
Thimbles on a tray | Glass tap keys | glass=0.3 burn=0.4 embers=0.25 flame=0.3 mouth=0.85 tube=Open draught=0.27 flicker=0.18 roar=0.14 width=0.44 between=0.37 lag=0.34 place=0.22 volume=4 | shortair | taps | Open gas and a tap of glass, over so soon that only the ring is left | plucked
Pizzicato in wax | Glass tap keys | tube=Double fuel=Candle glass=0.1 burn=1.2 embers=0.4 flame=0.7 mouth=0.85 draught=0.35 flicker=0.25 roar=0.15 width=0.29 between=0.11 lag=0.43 place=0.28 volume=0 | gated | matches | Candles struck in double tubes, soft low plucks that die within a second | plucked
Nylon evening | Glass tap keys | tube=Open glass=0.1 burn=5 embers=0.6 flame=0.35 mouth=0.35 place=0.28 draught=0.02 flicker=0.06 roar=0.1 width=0.36 between=0.01 lag=0.15 volume=-2 | reel | rolled | Covered gas plucked in open tubes, warm and plain, burning down under the hand | plucked
Lit in a draughty hall | Glass tap keys | tube=Open flame=0.4 glass=0.4 burn=9 embers=2 draught=0.8 mouth=0.6 flicker=0.03 roar=0.32 width=0.81 between=0.44 lag=0.24 place=0.28 volume=-0.5 | stairwell | peal | Open gas tapped alight and left to lean in a draught until it burns out
Scullery clock | Glass tap keys | glass=0.75 burn=1.2 embers=0.4 flame=0.3 mouth=0.65 fuel=Spirit tube=Half_closed draught=0.24 flicker=0.13 roar=0.24 width=0.23 between=0.33 lag=0.38 place=0.31 volume=-4 | dotted | taps | Half closed spirit with a hard tap of glass, reedy for a moment and gone
Muffled fire alarm | Glass tap keys | tube=Narrow fuel=Spirit glass=0.8 burn=3 embers=0.5 flame=0.5 mouth=0.3 secondFlame=0.3 between=1 draught=0.27 flicker=0.21 roar=0.09 width=0.27 lag=0.21 place=0.31 | pillow | call | Narrow spirit pairs struck with their glass, beating as fast as they can
Spilled beads | Glass tap keys | fuel=Spirit tube=Half_closed glass=0.35 burn=0.8 embers=0.4 flame=0.2 mouth=0.85 lift=0.1 draught=0.1 flicker=0.16 roar=0.08 width=0.54 between=0.34 lag=0.17 place=0.36 volume=0.5 | bounces | matches | Half closed spirit tapped on glass, brief hollow tones scattering as they go out
Waiter with a tray | Glass tap keys | glass=0.9 tube=Flared flame=0.2 burn=2 mouth=0.45 embers=0.8 draught=0.24 flicker=0.25 roar=0.05 width=0.47 between=0.55 lag=0.31 place=0.13 volume=-1 | fifthring | ostinato | Flared tubes struck on their glass, a chime with a thin reed under it
Goblet half full | Glass tap keys | glass=0.95 tube=Narrow flame=0.3 catch=0.6 burn=20 embers=4 mouth=0.7 secondFlame=0.4 between=0.4 draught=0.02 flicker=0.19 roar=0.27 width=0.4 lag=0.19 place=0.2 volume=-4.5 | glasshalo | peal | Narrow tubes rung, then a gas tone that swells up inside the ring | bell
Slow dawn on glass | Glass tap keys | glass=0.8 catch=1.2 flame=0.5 burn=20 embers=3 mouth=0.5 tube=Open fuel=Candle draught=0.19 flicker=0.12 roar=0.29 width=0.74 between=0.73 lag=0.16 place=0.29 volume=1 | plate | gather | A ring of glass, and after it an open candle tone that swells slowly
Platform announcement | Glass tap keys | glass=0.7 catch=0.8 tube=Flared flame=0.4 burn=8 mouth=0.4 embers=1.5 draught=0.19 flicker=0.08 roar=0.25 width=0.44 between=0.06 lag=0.32 place=0.14 volume=1 | downhall | call | Glass first, then a flared gas tone that swells late and burns down
Answering machine | Glass tap keys | glass=0.5 catch=0.4 tube=Half_closed fuel=Spirit flame=0.5 burn=6 embers=0.8 mouth=0.35 draught=0.14 flicker=0.26 roar=0.32 width=0.33 between=0.17 lag=0.28 place=0.18 volume=-1.5 | cassette | shepherd | A tap of glass answered by a half closed spirit reed that burns down
Two guests arriving | Glass tap keys | glass=0.6 catch=0.5 tube=Double flame=0.4 burn=12 embers=2 mouth=0.4 secondFlame=0.6 between=0.7 draught=0.1 flicker=0.33 roar=0.19 width=0.31 lag=0.22 place=0.11 volume=-3.5 | lingering | rolled | Glass tapped, then double gas pairs that swell and beat an octave below
Tablecloth, then silver | Spirit pluck | tube=Double flame=0.5 burn=3 mouth=0.2 embers=0.6 glass=0.6 draught=0.32 flicker=0.38 roar=0.31 width=0.75 lag=0.28 place=0.19 volume=-6.5 | tapeweight | ostinato | Double spirit plucked low, with a ring of glass on top, burning down | keys
Garden gate latch | Spirit pluck | tube=Narrow fuel=Candle flame=0.7 burn=1 mouth=0.9 embers=0.5 roar=0.12 draught=0.06 flicker=0.27 glass=0.07 width=0.78 lag=0.18 place=0.12 volume=-2 | puffs | ostinato | Candles lit in an instant in narrow tubes, light plucks that die away | plucked
Zither on the windowsill | Spirit pluck | tube=Open flame=0.6 burn=6 mouth=0.35 secondFlame=0.6 between=0.7 embers=2 draught=0.18 flicker=0.14 roar=0.27 glass=0.23 width=0.89 lag=0.24 place=0.24 | strings | rolled | Two spirit flames plucked in open tubes, beating and slow to burn out | plucked
Rubber band box | Spirit pluck | fuel=Gas tube=Half_closed flame=1 burn=1.2 mouth=0.5 embers=0.3 place=0.06 draught=0.12 flicker=0.21 roar=0.33 glass=0 width=0.82 lag=0.21 volume=-1 | hollow | matches | Tall gas low in half closed tubes, a nasal pluck gone in a second | plucked
Guitar with two strings | Spirit pluck | fuel=Coal tube=Open flame=0.6 burn=3 mouth=0.45 embers=0.5 roar=0.2 draught=0.32 flicker=0.27 glass=0.05 width=0.47 lag=0.19 place=0.28 | valve | matches | Open coal lit at once, a rough dark pluck that burns down in three seconds | plucked
Hotel lobby at tea time | Warm flame pad | tube=Half_closed catch=0.05 burn=8 embers=0.6 flame=0.3 mouth=0.6 lift=0.13 glass=0.3 secondFlame=0.4 between=0.6 draught=0.05 flicker=0.38 roar=0.23 width=0.52 lag=0.29 place=0.15 volume=-2 | latesway 1.depth=15 | chorale | Half closed gas pairs tapped and beating softly, keys that fade by themselves | keys
Iced tea | Glass tap keys | glass=0.85 tube=Half_closed flame=0.12 burn=2.5 embers=1 mouth=0.3 fuel=Spirit draught=0.13 flicker=0.11 roar=0.12 width=0.74 between=0.46 lag=0.33 place=0.31 volume=-5.5 | dustlight | carillon | Spirit in half closed tubes under a bright ring of glass, cool and brief | bell
Squash on the lawn | Glass tap keys | tube=Narrow fuel=Gas lift=0.6 glass=0.65 burn=3 embers=0.8 flame=0.25 mouth=0.75 draught=0.09 flicker=0.03 roar=0.11 width=0.79 between=0.26 lag=0.4 place=0.26 volume=-1 | sparkup | ostinato | Narrow glass tapped, its thin tone lifting as it burns down
Broken chandelier | Glass tap keys | glass=1 tube=Open flame=0 burn=5 embers=2.5 mouth=0.5 width=1 draught=0.22 flicker=0.24 roar=0.11 between=0.31 lag=0.4 place=0.17 volume=-5.5 | shards | taps | Open tubes rung as hard as they go, almost no flame, ringing in every corner as it burns away | bell
Stove door then kettle | Glass tap keys | glass=0.9 fuel=Coal tube=Half_closed roar=0.5 flame=0.5 burn=5 embers=0.6 mouth=0.5 draught=0.25 flicker=0.04 width=0.38 between=0.53 lag=0.27 place=0.17 volume=-4.5 | kettle | matches | A hard ring of glass and a half closed coal flame that roars and burns down
Study for left thumb | Warm flame pad | tube=Double fuel=Candle catch=0.05 burn=4 embers=0.5 flame=0.5 mouth=0.8 lift=0.15 roar=0.1 secondFlame=0 draught=0.39 flicker=0.06 glass=0.1 width=0.55 lag=0.23 place=0.23 | fastrotor | rolled | Candles in double tubes, lit at once, warm dull keys burning down in four seconds | keys
Paperweights | Glass tap keys | glass=0.35 tube=Half_closed flame=0.25 place=0.4 burn=2 embers=1.5 mouth=0.2 draught=0.32 flicker=0.19 roar=0.1 width=0.5 between=0.68 lag=0.11 volume=-2.5 | hanging | rolled | Covered half closed gas with a dull tap of glass, small, heavy and soon out
Shop bell, shop empty | Glass tap keys | glass=0.95 tube=Half_closed lag=0.08 place=0.445 draught=0.03 burn=3 flame=0.4 mouth=0.8 embers=1 flicker=0.3 roar=0.29 width=1 between=0.66 volume=-1.5 | far 1.mix=0.4 | toll | Glass struck, a hollow tone singing its twelfth, both soon gone | bell
Letters by pigeon | Spirit pluck | catch=0.06 tube=Narrow flame=0.3 burn=1.6 embers=0.2 mouth=0.35 lag=0.44 place=0.18 draught=0.05 flicker=0.4 roar=0.05 glass=0.23 width=0.55 volume=-2.5 | hops 1.mix=0.2 | taps | Spirit plucked in narrow tubes at the fourth harmonic, a tick of pitch | plucked
Sunlight on cutlery | Glass tap keys | glass=0.7 tube=Open fuel=Spirit flame=0.2 burn=4 embers=1 mouth=0.3 secondFlame=0.4 between=0.8 draught=0.08 flicker=0.2 roar=0.08 width=0.82 lag=0.14 place=0.29 volume=-4.5 | glimmer | ostinato | Open spirit pairs tapped bright on their glass, beating under a half shut mouth
`,
    },
    {
      id: 'dying-embers',
      name: 'Dying embers',
      category: 'texture',
      rows: `
Ash settling | Dying embers | burn=5 flame=0.2 roar=0.3 mouth=0.5 draught=0.19 width=0.43 secondFlame=0.07 between=0.49 lift=0.11 lag=0.16 place=0.11 volume=3.5 | wornreel | single | Open coal, low and flickering, that crackles a little and burns out in five seconds
Banked for the night | Dying embers | burn=20 flicker=0.5 roar=0.65 mouth=0.3 catch=1 embers=6 draught=0.29 width=0.57 secondFlame=0.21 between=0.54 lag=0.3 place=0.11 | hall 1.mix=0.2 | fifths | Covered coal roaring softly as it thins, flickering under a low fifth | drone
Pop of a wet log | Dying embers | burn=2 flicker=1 roar=0.7 catch=0.04 embers=1 mouth=0.75 flame=0.5 draught=0.28 width=0.8 secondFlame=0.24 between=0.11 lag=0.14 place=0.32 volume=0.5 | parlour | matches | Coal lit at once, crackling and roaring as it burns out, pitch almost by the way
Half an hour of sleet | Dying embers | flicker=1 roar=0.9 flame=0.15 mouth=0.7 burn=14 embers=2 draught=0 width=0.72 secondFlame=0.21 between=0.52 lag=0.09 place=0.28 | stars | still | Coal with the flame nearly gone, its roar flickering and crackling, notes behind it
Poker laid down | Dying embers | tube=Half_closed burn=12 flame=0.65 flicker=0.4 secondFlame=0.8 between=0.75 catch=0.2 draught=0.38 width=0.5 lag=0.43 place=0.12 volume=0.5 | cistern | peal | Two coal flames beating roughly in half closed tubes, flickering and burning down
Briquettes | Dying embers | roar=0.22 tube=Half_closed burn=6 flame=0.4 flicker=0.6 catch=0.1 mouth=0.6 embers=1.5 draught=0.28 glass=0.03 width=0.34 secondFlame=0.13 between=0.14 lag=0.43 place=0.21 | bare | rolled | Half closed coal, dark hollow notes that flicker and burn down | keys
Fog in the shunting yard | Dying embers | tube=Half_closed burn=15 roar=0.7 draught=0.7 mouth=0.4 catch=0.8 width=0.97 secondFlame=0.18 between=0.57 lag=0.36 place=0.11 | trail | lamps | Half closed coal guttering and roaring, leaning in a draught, thinning as it goes
Toffee apple night | Dying embers | roar=0.28 tube=Half_closed burn=10 flame=0.8 flicker=0.5 mouth=0.75 lift=0.5 embers=2 draught=0.05 glass=0.03 width=0.7 secondFlame=0.15 between=0.25 lag=0.36 place=0.37 | heads | call | Tall half closed coal that flickers, reaches up a twelfth and burns down | wind
Slag heap moonlight | Dying embers | tube=Half_closed flame=0.25 burn=21 catch=2 flicker=0.7 roar=0.2 embers=8 draught=0.09 width=0.57 secondFlame=0.04 between=0.03 lift=0.15 lag=0.33 place=0.21 volume=2.5 | winter | still | Half closed coal, very low, caught slowly and flickering
Cut-out switch | Dying embers | tube=Half_closed burn=1 catch=0.03 flicker=0.9 roar=0.4 embers=0.4 flame=0.7 draught=0.33 glass=0.18 width=0.65 secondFlame=0.13 between=0.11 lag=0.07 place=0.35 volume=6 | dusty | ostinato | Half closed coal lit in an instant, a crackling stub of a note that dies in a second | plucked
Nave roof burning low | Dying embers | tube=Double burn=18 flame=0.5 roar=0.5 secondFlame=0.6 between=0.4 catch=1.2 embers=6 draught=0.1 width=0.63 lag=0.43 place=0.13 | nave | lamps | Coal pairs in double tubes, deep and flickering, thinning over the chord
Men talking by a brazier | Dying embers | tube=Double burn=9 flicker=0.7 roar=0.35 mouth=0.6 catch=0.3 draught=0.08 glass=0.18 width=0.77 secondFlame=0.09 between=0.58 lag=0.34 place=0.28 volume=1 | nextdoor | chorale | Double coal tubes that flicker and burn down in nine seconds
Volcanic sand | Dying embers | tube=Double flame=0.12 roar=0.95 burn=40 draught=0.8 mouth=0.9 width=0.81 secondFlame=0.12 between=0.3 lag=0.08 place=0.31 volume=-11 | cloud | deep | Double coal in a hard draught, an open rush like sand sliding, the note buried in it | drone
Coal scuttle kalimba | Dying embers | tube=Double burn=1.5 catch=0.03 flicker=0.3 roar=0.2 flame=0.5 embers=0.6 glass=0.4 draught=0.17 width=0.42 secondFlame=0.05 between=0.23 lag=0.13 place=0.2 volume=2.5 | sinking | ostinato | Double coal struck with a chink of glass, short low notes that burn out | plucked
Half asleep by it | Dying embers | tube=Double flame=0.15 burn=12 flicker=0.45 mouth=0.25 roar=0.15 catch=0.7 embers=4 draught=0.39 width=0.79 secondFlame=0.25 between=0.61 lift=0.16 lag=0.44 place=0.18 | warmbody | tenths | The smallest coal flames in double tubes, covered and flickering, warm below | pad
Cigarette ends | Dying embers | tube=Narrow burn=3 flame=0.4 catch=0.1 roar=0.5 mouth=0.7 embers=1 draught=0.02 glass=0.06 width=0.52 secondFlame=0 lag=0.08 place=0.32 volume=6 | slap | taps | Narrow coal, thin notes with a rush and a crackle, gone in three seconds | plucked
Snow falling on ash | Dying embers | tube=Narrow burn=14 flame=0.2 flicker=1 roar=0.6 mouth=0.8 embers=5 draught=0.37 glass=0.09 width=0.93 secondFlame=0 lag=0.35 place=0.24 volume=2.5 | leaves | gather | Narrow coal that gutters under a soft roar, the tone all but lost
Wick trimmed short | Dying embers | catch=0.12 tube=Narrow fuel=Candle burn=9 flicker=0.6 roar=0.2 mouth=0.9 flame=0.25 draught=0.28 glass=0.16 width=0.12 secondFlame=0.08 between=0.05 lag=0.15 place=0.35 volume=-3.5 | breathy 1.output=6 | onehigh | A narrow candle that flickers and burns out early | wind
Lamp room, pit head | Dying embers | tube=Narrow burn=17 secondFlame=0.4 between=0.6 flicker=0.5 catch=0.8 roar=0.3 mouth=0.6 draught=0.35 width=0.69 lag=0.41 place=0.2 volume=1.5 | throb | suspend | Narrow coal pairs beating in smoke, flickering all the time
Tar roof in August | Dying embers | tube=Narrow flame=0.9 burn=7 flicker=0.8 lift=0.6 roar=0.4 mouth=0.55 draught=0.23 glass=0.07 width=0.43 secondFlame=0.08 between=0.12 lag=0.43 place=0.2 volume=1.5 | drifting | duet | Tall narrow coal that gutters and lifts as it burns down
Rust on the flue | Dying embers | tube=Flared burn=9 flame=0.3 roar=0.4 flicker=0.7 mouth=0.45 draught=0.04 width=0.45 secondFlame=0.05 between=0.05 lag=0.13 place=0.28 volume=2 | springs | shepherd | Flared coal, hoarse and thin, flickering and burning down | wind
Scrap yard bonfire | Dying embers | tube=Flared burn=14 flame=0.8 roar=0.8 mouth=0.35 flicker=0.9 draught=0.01 width=0.74 secondFlame=0.21 between=0.04 lag=0.39 place=0.21 volume=2.5 | outdoors | suspend | Tall flared coal, roaring, guttering and crackling under a half shut mouth
Paper lantern alight | Dying embers | tube=Flared fuel=Candle burn=5 flame=0.6 flicker=0.9 mouth=0.6 roar=0.4 draught=0.23 glass=0.22 width=0.78 secondFlame=0.11 between=0.3 lag=0.33 place=0.31 | risingmist | gather | Flared candles that gutter and burn away, their breath drifting up
Wire brush | Dying embers | tube=Flared burn=1.5 catch=0.04 roar=0.6 flame=0.4 flicker=0.25 embers=0.5 mouth=0.4 draught=0.17 glass=0.15 width=0.28 secondFlame=0.14 between=0.43 lag=0.38 place=0.34 volume=-1 | canon | matches | Flared coal lit at once, a scratch of roar with a thin note in it, soon burnt out | plucked
Distress flare | Dying embers | tube=Flared fuel=Spirit burn=6 flame=0.5 flicker=0.8 mouth=0.2 roar=0.4 lift=0.4 draught=0.23 glass=0.11 width=0.9 secondFlame=0.23 between=0.1 lag=0.33 place=0.14 volume=6 | shore | onehigh | Flared spirit that flickers, lifts and burns down, a thin rushing light
Candle end in a saucer | Guttering candles | flame=0.25 burn=8 flicker=0.65 secondFlame=0 catch=0.3 mouth=0.9 roar=0.2 draught=0.06 glass=0.05 width=0.49 lift=0.16 lag=0.39 place=0.33 volume=6 | breathy 1.output=5 | single | One open candle that gutters, sinks and burns out in eight seconds
Vigil in the small hours | Guttering candles | catch=0.5 burn=25 flicker=0.5 secondFlame=0.5 between=0.15 tube=Half_closed lift=0 mouth=1 draught=0.02 roar=0.21 width=0.94 lag=0.37 place=0.16 | chamber | chorale | Candle pairs locked in half closed tubes, flickering as they burn low | voice
Birthday cake by a door | Guttering candles | draught=0.9 catch=0.1 burn=3 embers=1 tube=Narrow lift=0.14 mouth=0.95 roar=0.22 glass=0 width=0.53 between=0.27 lag=0.18 place=0.31 volume=4 | dustlight | carillon | Narrow candles that flicker in a draught and go out in three seconds | bell
Windowsill in a storm | Guttering candles | draught=1 tube=Double roar=0.6 catch=0.8 lift=0.2 mouth=0.85 burn=15 width=0.84 between=0.08 lag=0.13 place=0.29 volume=-6.5 | rain | lamps | Double candle pairs guttering and leaning in the hardest draught
Votive rack | Guttering candles | secondFlame=1 between=0.9 flicker=0.8 burn=10 catch=0.2 mouth=1 lift=0.15 draught=0.19 roar=0.15 width=0.87 lag=0.22 place=0.27 volume=0.5 | glimmer | gather | Candle pairs in open tubes, beating and guttering, burning down together
Gas meter running out | Warm flame pad | burn=3.5 catch=0.1 flicker=0.5 embers=1 roar=0.35 flame=0.6 draught=0.35 glass=0.13 width=0.56 secondFlame=0.03 between=0.09 lift=0.14 lag=0.2 place=0.24 volume=1 | combo | chorale | Open gas that flickers with a rush and burns out in three seconds | organ
Burner turned down | Warm flame pad | burn=8 catch=0.5 flame=0.9 mouth=0.45 flicker=0.6 tube=Half_closed draught=0.36 roar=0.25 glass=0.2 width=0.58 secondFlame=0.28 between=0.48 lift=0.1 lag=0.35 place=0.23 volume=6 | glacial | lamps | Tall half closed gas that flickers and burns down through the chord
Street lamp failing | Warm flame pad | tube=Narrow burn=5 flicker=1 catch=0.3 mouth=0.4 lift=0.5 secondFlame=0.4 between=0.7 draught=0.27 roar=0.31 glass=0.16 width=0.92 lag=0.38 place=0.16 volume=6 | wax | gather | Narrow gas pairs that gutter, lift and beat as they burn out
Boiler cooling | Warm flame pad | tube=Double burn=10 flicker=0.4 glass=0.4 catch=0.3 roar=0.4 mouth=0.35 embers=5 draught=0.01 width=0.95 secondFlame=0.05 between=0.5 lift=0.17 lag=0.23 place=0.22 | pipe | peal | Double gas with a knock of glass, flickering as it burns down
Curtain of blue flame | Warm flame pad | tube=Flared burn=7 flicker=0.55 flame=0.4 roar=0.55 mouth=0.4 lift=0.35 embers=4 draught=0.03 width=0.41 secondFlame=0.03 between=0.22 lag=0.15 place=0.16 volume=4 | tide | suspend | Flared gas flickering and lifting in its own rush, burning down
Methylated blue | Warm flame pad | fuel=Spirit burn=4 flicker=0.9 mouth=0.2 catch=0.2 embers=1 flame=0.6 draught=0.06 roar=0.09 glass=0.02 width=0.44 secondFlame=0.29 between=0.36 lift=0.13 lag=0.23 place=0.21 volume=4 | backwards | duet | Covered open spirit that gutters wildly and burns out in four seconds
Pudding set alight | Warm flame pad | fuel=Spirit tube=Narrow burn=6 flicker=0.7 flame=0.3 mouth=0.28 catch=0.1 lift=0.2 roar=0.04 draught=0.01 glass=0.01 width=0.83 secondFlame=0.24 between=0.07 lag=0.43 place=0.29 volume=-1.5 | sparks | rolled | Narrow spirit that flickers and runs, clear notes burning away
Chemistry lesson | Warm flame pad | fuel=Spirit tube=Half_closed burn=8 flicker=0.8 flame=0.5 mouth=0.35 lift=0.5 glass=0.4 catch=0.06 draught=0.19 roar=0.29 width=0.43 secondFlame=0.02 between=0.38 lag=0.08 place=0.24 | recall | call | Half closed spirit, a chink of glass, then a reed that flickers and lifts as it dies | wind
Lighthouse on low oil | Slow weather | fuel=Spirit tube=Double flicker=0.9 mouth=0.12 burn=16 catch=1 draught=0.5 width=0.66 between=0.74 lift=0.18 lag=0.36 place=0.17 volume=-4 | pendulum | lamps | Double spirit pairs, nearly shut, guttering and leaning as they burn low
Wind in a spent match | Slow weather | lift=0.1 secondFlame=0.1 fuel=Spirit tube=Flared flicker=0.6 burn=4 flame=0.1 mouth=0.15 roar=0.4 catch=0.15 draught=0.26 width=0.61 between=0.17 lag=0.12 place=0.34 volume=6 | wind | shepherd | The tiniest flared spirit flame, flickering in a rush of air, soon burnt out | wind
Embers after the chord | - | embers=11 catch=0.2 burn=5 flame=0.4 mouth=0.6 flicker=0.35 fuel=Gas draught=0.31 roar=0.16 width=0.93 secondFlame=0.21 between=0.09 lift=0.19 lag=0.41 place=0.22 volume=3.5 | bed | rolled | Open gas let go and left to linger long after the keys, flickering as it thins | pad
Long goodbye at the gate | - | fuel=Candle embers=12 catch=0.4 burn=12 tube=Narrow mouth=0.9 flicker=0.5 lift=0.2 draught=0.23 roar=0.15 glass=0.03 width=0.55 secondFlame=0.26 between=0.1 lag=0.21 place=0.16 volume=6 | loop | onehigh | Narrow candles that flicker and linger for seconds after each key | wind
Smoke ring | - | fuel=Coal tube=Half_closed embers=9 burn=5 catch=0.3 roar=0.6 mouth=0.6 flicker=0.4 draught=0.16 glass=0.17 width=0.54 secondFlame=0.28 between=0.71 lift=0.1 lag=0.34 place=0.26 volume=6 | orbit | call | Half closed coal that burns down fast and trails a low roar behind every key
Towers cooling, dusk | - | fuel=Coal tube=Double embers=10 catch=1.5 burn=10 flame=0.5 mouth=0.3 draught=0.6 flicker=0.28 roar=0.07 glass=0.13 width=0.48 secondFlame=0.12 between=0.13 lift=0.11 lag=0.27 place=0.12 volume=2 | descent | lamps | Double coal, covered, slow to swell and slow to die, leaning in warm air
Tracks of a sparkler | - | lift=0.1 fuel=Spirit tube=Open embers=6 burn=2.5 catch=0.04 flame=0.35 mouth=0.35 flicker=0.8 roar=0.3 draught=0.1 glass=0.2 width=0.5 secondFlame=0.06 between=0.49 lag=0.33 place=0.31 volume=0.5 | stretched | taps | Open spirit that is lit at once, gutters and burns down, trailing a long thin end | plucked
Dust of the hearthstone | Dying embers | flame=0.05 burn=16 roar=0.4 flicker=0.9 mouth=0.8 lift=0.1 width=1 draught=0.16 glass=0.07 secondFlame=0.15 between=0.63 lag=0.25 place=0.34 volume=0.5 | dustbed | single | Open coal with almost no flame, its ticking and flicker spread to both sides
Film of an old fire | Dying embers | burn=15 flicker=0.75 flame=0.45 roar=0.4 catch=0.6 mouth=0.55 lift=0.3 draught=0.14 width=0.74 secondFlame=0.07 between=0.6 lag=0.15 place=0.24 volume=-1.5 | record | tenths | Open coal flickering and crackling, notes lifting now and then out of it
Oven door left ajar | Dying embers | burn=11 tube=Double fuel=Gas flicker=0.8 roar=0.75 flame=0.6 mouth=0.5 draught=0.22 width=0.6 secondFlame=0.25 between=0.01 lag=0.32 place=0.26 | hazewall | suspend | Double gas guttering and roaring, deep heat that comes and goes as it burns down
Warm bricks | Dying embers | fuel=Candle tube=Half_closed burn=30 flicker=0.4 flame=0.6 mouth=0.9 catch=1 embers=5 roar=0.2 draught=0.31 width=0.42 secondFlame=0.25 between=0.16 lift=0.18 lag=0.3 place=0.19 | darkplate | lowchoir | Half closed candles, barely flickering, a soft hollow warmth slow to die | pad
Sparks off the last tram | Dying embers | tube=Open fuel=Spirit burn=3 flicker=0.9 roar=0.5 catch=0.1 flame=0.4 mouth=0.3 embers=1.5 draught=0.12 width=0.56 secondFlame=0.11 between=0.39 lag=0.08 place=0.25 volume=4.5 | shards | duet | Open spirit guttering and rushing, notes that burn out in three seconds
`,
    },
    {
      id: 'furnace-choirs',
      name: 'Furnace choirs',
      category: 'voice',
      rows: `
Vestry rehearsal | Furnace choir | burn=15 secondFlame=0.74 flame=0.4 mouth=0.45 catch=0.5 roar=0.15 embers=1.5 draught=0.2 flicker=0.36 glass=0.16 width=0.65 lift=0.13 lag=0.4 place=0.21 volume=-0.5 | hazyedge | chorale | Double gas pairs, close and covered, a small low choir slipping into tune
Men of the valley | Furnace choir | secondFlame=0.38 flame=0.9 mouth=0.4 catch=0.8 between=0.4 roar=0.25 embers=2.5 draught=0.12 flicker=0.07 glass=0.04 width=0.43 lift=0.14 lag=0.31 place=0.19 | noattack | lowchoir | Tall gas pairs in double tubes, a broad low choir slipping slightly
Basilica steps | Furnace choir | secondFlame=0.8 lift=0.12 flame=0.3 catch=2 mouth=0.55 between=0 embers=6 draught=0.3 flicker=0.09 glass=0.19 width=0.46 lag=0.42 place=0.21 | nave | still | Small double gas pairs locked together, swelling slowly from deep down
Refectory hum | Furnace choir | secondFlame=0.89 fuel=Candle flame=0.6 mouth=0.75 catch=0.4 roar=0.1 draught=0.1 embers=1 flicker=0.03 glass=0.18 width=0.52 lift=0.12 lag=0.1 place=0.26 | warmdry | chorale | Candle pairs in double tubes, a closed mouth hum in two octaves
Carol by the boiler | Furnace choir | secondFlame=0.68 flame=0.7 roar=0.65 mouth=0.6 catch=0.6 between=0.5 lift=0.2 draught=0.06 flicker=0.1 glass=0.23 width=0.49 lag=0.16 place=0.2 | cavern | chorale | Double gas pairs singing through the rush of their own burners
Tenors only | Furnace choir | burn=22 secondFlame=0.35 tube=Half_closed flame=0.6 mouth=0.6 catch=0.5 between=0.4 embers=1.5 roar=0.2 draught=0.25 flicker=0.16 glass=0.13 width=0.72 lift=0.15 lag=0.09 place=0.18 volume=2 | roundvowel | duet | Half closed gas pairs, hollow tenor voices slipping a little apart
Cistercians | Furnace choir | secondFlame=0.53 tube=Half_closed flame=0.35 mouth=0.4 catch=1.2 between=0.1 roar=0.1 lift=0 embers=5 draught=0.01 flicker=0.07 glass=0.02 width=0.71 lag=0.2 place=0.27 | crypt | lowchoir | Half closed gas pairs locked in unison, plain and hollow
Crowd in a stone yard | Furnace choir | secondFlame=0.77 tube=Half_closed fuel=Coal flame=0.6 mouth=0.6 between=0.7 roar=0.5 catch=0.7 draught=0.04 flicker=0.28 glass=0.07 width=0.75 lift=0.15 lag=0.2 place=0.23 volume=-4 | stairwell | tenths | Half closed coal pairs beating in a low roar, voices with grit in them
Ventriloquist | Furnace choir | secondFlame=0.90 tube=Half_closed fuel=Spirit flame=0.3 mouth=0.25 catch=0.15 between=0.2 lift=0 embers=0.5 width=0.2 draught=0.05 flicker=0.05 glass=0.09 lag=0.1 place=0.23 volume=-1 | openvowel | shepherd | Covered spirit pairs locked in half closed tubes, one small nasal voice
Foundling choir | Furnace choir | secondFlame=0.96 tube=Half_closed fuel=Candle lag=0.07 place=0.445 draught=0.04 flame=0.6 mouth=1 catch=0.6 lift=0 flicker=0.03 glass=0.05 width=0.34 between=0.48 | oohall | lowchoir | Half closed candles in which one flame sings the twelfth over the other, small and high
Women hauling water | Furnace choir | secondFlame=0.34 tube=Open flame=0.4 mouth=0.5 catch=0.4 between=0.45 roar=0.2 lift=0 embers=1.5 draught=0.08 flicker=0.1 glass=0.02 width=0.34 lag=0.12 place=0.31 volume=-0.5 | singer | duet | Open gas pairs slipping gently, two plain voices close to each other
Humming past midnight | Furnace choir | burn=17 secondFlame=0.8 tube=Open fuel=Candle flame=0.45 mouth=0.6 catch=0.7 between=0.42 lift=0.15 roar=0.2 draught=0.2 flicker=0.37 glass=0.11 width=0.59 lag=0.21 place=0.21 volume=-0.5 | monks | tenths | Candle pairs in open tubes, soft hums that slip and hardly stir
Sirens a long way inland | Furnace choir | secondFlame=0.69 tube=Open flame=0.3 mouth=0.8 catch=1 between=0.55 lift=0.6 draught=0.4 embers=4 flicker=0.39 glass=0.16 width=0.55 lag=0.18 place=0.34 | valley | gather | Open gas pairs leaning and lifting to the octave, high calls carried
Wordless counting | Furnace choir | secondFlame=0.45 tube=Open flame=0.75 mouth=0.35 catch=0.12 between=0.2 roar=0.1 lift=0 embers=0.5 draught=0.06 flicker=0.07 glass=0.1 width=0.4 lag=0.23 place=0.1 | chamber | ostinato | Covered gas pairs locked in open tubes, short clear syllables
Consonants in winter | Furnace choir | secondFlame=0.41 tube=Open fuel=Spirit flame=0.5 mouth=0.24 catch=0.25 between=0.5 roar=0.75 embers=1 draught=0.21 flicker=0.05 glass=0.02 width=0.51 lift=0.12 lag=0.23 place=0.37 volume=-2.5 | pane | chorale | Covered spirit pairs in open tubes, slipping, with a hiss of breath on each note
Sopranos behind glass | Furnace choir | secondFlame=0.61 tube=Narrow flame=0.4 mouth=0.75 catch=0.8 between=0.5 lift=0.2 roar=0.15 glass=0.3 embers=3 draught=0.03 flicker=0.11 width=0.88 lag=0.14 place=0.32 volume=-1.5 | latesway | lowchoir | Narrow gas pairs beating slowly apart, pure high voices and a ring of glass
Boy on the balcony | Furnace choir | burn=22 tube=Narrow secondFlame=0 flame=0.3 mouth=0.6 catch=0.3 lift=0 roar=0.03 draught=0.1 embers=1.5 flicker=0.02 glass=0.02 width=0.92 lag=0.11 place=0.22 volume=0.5 | singer | song | A single narrow gas flame, a pure treble alone
Nuns on a stairway | Furnace choir | secondFlame=0.58 roar=0.2 tube=Narrow fuel=Candle flame=0.5 mouth=0.95 catch=1 between=0.2 lift=0 embers=4 flicker=0.3 draught=0.06 glass=0.04 width=0.77 lag=0.41 place=0.33 volume=-2.5 | choirhall | duet | Candle pairs locked in narrow tubes, quiet pure voices slow to begin
Glass harmonists | Furnace choir | burn=16 secondFlame=0.35 tube=Narrow fuel=Spirit flame=0.2 mouth=0.35 catch=1.4 between=0.65 embers=5 roar=0.05 draught=0.12 flicker=0.22 glass=0.14 width=0.47 lift=0.12 lag=0.27 place=0.21 volume=-3 | openspace | suspend | Narrow spirit pairs that swell and beat, clear voices with no breath
Throat and then whistle | Furnace choir | secondFlame=0.93 tube=Narrow lift=0.36 flame=0.6 mouth=0.6 catch=0.5 between=0.4 draught=0.2 roar=0.2 flicker=0.27 glass=0.04 width=0.38 lag=0.09 place=0.26 volume=-1 | whistled | fifths | Narrow gas pairs of which some lift to the octave over a held fifth
Bellows at the wedding | Furnace choir | secondFlame=0.69 tube=Flared flame=0.5 mouth=0.35 catch=0.7 between=0.25 roar=0.35 lift=0 draught=0 flicker=0.1 glass=0.18 width=0.79 lag=0.26 place=0.14 volume=-3 | openvowel | suspend | Flared gas pairs nearly locked, an open brassy choir with air in it
Town criers | Furnace choir | burn=19 secondFlame=0.59 tube=Flared flame=0.8 mouth=0.3 catch=0.15 between=0.6 roar=0.15 embers=0.6 draught=0.09 flicker=0.33 glass=0.05 width=0.4 lift=0.14 lag=0.15 place=0.2 volume=-1 | outdoors | call | Tall flared gas pairs, calling and beating, quick off the mark
Round a whispering dome | Furnace choir | secondFlame=0.99 tube=Flared fuel=Candle flame=0.35 mouth=0.55 roar=0.75 catch=1 between=0.5 lift=0.1 embers=4 draught=0.11 flicker=0.22 glass=0.11 width=0.87 lag=0.36 place=0.29 | circle | gather | Candle pairs in flared tubes, more whispered breath than voice, all rush
Auctioneer | Furnace choir | secondFlame=0.3 tube=Flared fuel=Spirit flame=0.25 mouth=0.12 catch=0.05 between=0.45 roar=0.1 embers=0.25 draught=0.26 flicker=0.23 glass=0.08 width=0.93 lift=0.11 lag=0.17 place=0.23 volume=1.5 | hollow | ostinato | Flared spirit pairs, nearly shut, slipping, quick nasal syllables
Miners' gala | Furnace choir | secondFlame=0.8 tube=Flared fuel=Coal flame=0.55 mouth=0.45 catch=0.6 between=0.55 roar=0.3 flicker=0.35 draught=0.29 width=0.63 lift=0.14 lag=0.13 place=0.29 volume=-1 | trail | duet | Flared coal pairs, hoarse voices in a crowd, slipping and flickering
Underground river choir | Furnace choir | burn=20 secondFlame=0.92 draught=0.9 flame=0.5 mouth=0.45 catch=1 between=0.4 embers=4 flicker=0.28 glass=0.23 width=0.74 lift=0.18 lag=0.16 place=0.32 volume=-0.5 | currents | lamps | Double gas pairs in a strong draught, the choir leaning from vowel to vowel
Wind over organ pipes | Furnace choir | secondFlame=0.59 tube=Open draught=0.8 roar=0.7 flame=0.35 mouth=0.55 catch=0.8 lift=0.15 flicker=0.01 glass=0.07 width=0.66 lag=0.38 place=0.18 volume=-3.5 | breathhall | gather | Open gas pairs leaning, a rush of wind through half sung notes
Field of sleepers | Furnace choir | secondFlame=0.70 fuel=Candle draught=0.7 flicker=0.5 mouth=0.75 catch=1.6 embers=6 lift=0.2 width=0.84 lag=0.41 place=0.18 | breathing | lowchoir | Double candle pairs leaning and flickering, a wide slow murmur of voices
Penitents going uphill | Furnace choir | secondFlame=0.50 fuel=Coal draught=0.5 flicker=0.4 flame=0.5 mouth=0.35 catch=0.9 roar=0.3 width=0.67 lift=0.16 lag=0.42 place=0.13 | darkhall | lowchoir | Double coal pairs, covered, a low chant that flickers and leans
Vespers in a gale | Furnace choir | secondFlame=0.65 tube=Narrow draught=1 flame=0.5 mouth=0.45 catch=0.6 between=0.6 roar=0.3 lift=0.2 flicker=0.11 glass=0.08 width=0.71 lag=0.3 place=0.16 | wind | tenths | Narrow gas pairs thrown about by the draught, beating, with a rush behind
Bees in the choir stalls | Furnace choir | secondFlame=0.4 fuel=Spirit flame=0.6 mouth=0.12 between=0.85 catch=0.6 roar=0.05 embers=2 draught=0.28 flicker=0.11 width=0.9 lift=0.18 lag=0.22 place=0.19 | ensemble | lowchoir | Double spirit pairs, nearly shut, beating fast, a murmuring reedy choir
Barber's four | Furnace choir | secondFlame=0.56 fuel=Spirit tube=Half_closed flame=0.45 mouth=0.3 between=0.05 catch=0.1 lift=0 embers=0.4 roar=0.05 draught=0.06 flicker=0.11 glass=0.24 width=0.8 lag=0.14 place=0.33 | double | chorale | Spirit pairs locked in half closed tubes, four close voices in tune
Old believers | Furnace choir | secondFlame=0.41 fuel=Spirit flame=0.2 mouth=0.15 between=0.5 catch=1.5 embers=5 draught=0.2 flicker=0.36 glass=0.19 width=0.87 lift=0.13 lag=0.09 place=0.26 volume=-3 | strings | fifths | Small double spirit pairs beating slowly, grave reedy voices | drone
Puppet opera | Furnace choir | burn=20 secondFlame=0.42 roar=0.08 fuel=Spirit tube=Narrow flame=0.5 mouth=0.28 between=0.95 catch=0.15 lift=0.4 embers=0.5 draught=0.09 flicker=0.06 glass=0.04 width=0.58 lag=0.08 place=0.27 volume=-7.5 | smaller | duet | Narrow spirit pairs in a wide fast beat, lifting, tiny voices with big manners
Gas mask lullaby | Furnace choir | secondFlame=0.91 fuel=Spirit tube=Open flame=0.35 mouth=0.02 between=0.25 catch=0.5 roar=0.2 embers=1.2 draught=0.24 flicker=0 glass=0.11 width=0.5 lift=0.12 lag=0.41 place=0.26 volume=1 | cupboard | song | Open spirit with the mouth shut, a muffled voice and its double
Back row of the gods | Furnace choir | secondFlame=1 between=0.6 flame=0.35 mouth=0.75 catch=1.2 lift=0.4 width=1 embers=5 draught=0.2 flicker=0.29 glass=0 lag=0.2 place=0.23 | faintshim | gather | Double gas pairs spread wide, beating and lifting, two octaves of soft light
Stairwell gospel | Furnace choir | burn=17 tube=Open secondFlame=0.35 between=0.4 flame=0.85 mouth=0.5 catch=0.2 roar=0.15 embers=0.8 draught=0.05 flicker=0 glass=0.17 width=0.6 lift=0.17 lag=0.18 place=0.21 volume=-1.5 | rotor | chorale | Tall open gas pairs slipping together, a full choir quick to speak | organ
Everyone on one note | Furnace choir | secondFlame=1 between=0.55 tube=Open fuel=Candle flame=0.8 mouth=0.95 catch=0.6 draught=0.2 flicker=0.2 glass=0.07 width=0.95 lift=0.12 lag=0.26 place=0.34 volume=-2.5 | flock | single | Candle pairs in open tubes, beating softly, one note held by a crowd
Harvest supper | Furnace choir | burn=17 tube=Half_closed secondFlame=1 between=0.5 fuel=Candle flame=0.9 mouth=0.95 catch=0.35 embers=1.2 draught=0.22 flicker=0.13 glass=0.04 width=0.32 lift=0.15 lag=0.12 place=0.36 | valve | chorale | Tall candle pairs in half closed tubes, beating slowly, hearty and hollow
Choir of two | Furnace choir | burn=15 secondFlame=1 between=0.7 tube=Narrow fuel=Candle flame=0.4 mouth=0.9 catch=0.5 width=1 draught=0.13 flicker=0.07 glass=0.19 lift=0.17 lag=0.11 place=0.23 volume=5.5 | pendulum | duet | Narrow candle pairs, one at each side, beating where they meet
Cantor, then the rest | Glass tap keys | glass=0.5 tube=Double catch=0.7 burn=21 embers=3 flame=0.5 mouth=0.5 secondFlame=0.7 between=0.3 draught=0.07 flicker=0.18 roar=0.2 width=0.39 lag=0.09 place=0.31 volume=3 | canon | song | A tap of glass, then double gas pairs that swell into a slipping choir
Abbot's handbell | Glass tap keys | glass=0.75 tube=Half_closed catch=1 burn=40 embers=4 flame=0.5 mouth=0.55 secondFlame=0.6 between=0.1 draught=0.08 flicker=0.05 roar=0.05 width=0.97 lag=0.31 place=0.36 | monks | fifths | Glass struck once a note, then locked half closed pairs rising underneath
Psalm in a cold hall | High harmonic | tube=Half_closed flame=0.4 catch=0.8 mouth=0.75 embers=3 secondFlame=0.5 between=0.4 draught=0.1 flicker=0.15 roar=0.26 glass=0.17 width=0.54 | hall | lowchoir | Half closed gas lifted for good, a choir that lives on its twelfths
Descant practice | High harmonic | secondFlame=0.94 tube=Double lag=0.21 place=0.17 lift=0.6 flame=0.5 mouth=0.5 catch=0.4 embers=1.5 draught=0.31 flicker=0 roar=0.21 glass=0.08 width=0.56 between=0.02 | fifthshim | duet | Double gas whose upper pipe keeps lifting to a descant over the low one
Angels on the ceiling | High harmonic | burn=21 fuel=Candle tube=Open lift=0.85 flame=0.6 mouth=0.95 catch=1.4 embers=5 secondFlame=0.5 between=0.5 draught=0.33 flicker=0.25 roar=0.22 glass=0.06 width=0.61 | glow | lamps | Open candle pairs lifted an octave, soft and high overhead
Prison hymn | Locked horns | secondFlame=0.98 tube=Half_closed fuel=Coal flame=0.6 catch=0.5 mouth=0.5 embers=1.2 roar=0.7 draught=0.05 flicker=0.04 glass=0.01 width=0.82 lag=0.14 place=0.27 volume=-8.5 | tapeweight | chorale | Coal pairs locked in half closed tubes, a rough unison with a low roar
Band on the corner | Locked horns | secondFlame=0.54 tube=Open fuel=Gas flame=0.65 catch=0.3 mouth=0.45 embers=0.6 between=0.15 draught=0.06 flicker=0.03 roar=0.25 glass=0.08 width=0.99 lag=0.43 place=0.26 | downhall | chorale | Gas pairs locked in open tubes, plain chords between brass and voice
Torches over the pass | Locked horns | secondFlame=0.91 tube=Double fuel=Coal flame=0.7 catch=0.9 mouth=0.35 embers=3 flicker=0.5 draught=0.5 roar=0.18 width=0.45 lag=0.36 place=0.26 volume=-8.5 | valley | fifths | Locked coal pairs in double tubes, flickering and leaning as they pass
Stone angels | Slow weather | secondFlame=0.54 flicker=0.2 fuel=Gas tube=Half_closed catch=1.5 flame=0.4 mouth=0.55 between=0.1 draught=0.4 lift=0.3 roar=0.15 glass=0.12 width=0.3 lag=0.2 place=0.15 volume=-16.5 | halo | still | Half closed gas pairs, locked, leaning, a few lifting off into the stone
Ghosts of the mill girls | Guttering candles | burn=16 secondFlame=0.48 tube=Narrow flicker=0.6 catch=0.9 lift=0.35 mouth=0.95 embers=4 draught=0.04 roar=0.17 glass=0.22 width=0.44 lag=0.41 place=0.29 volume=6 | far | suspend | Narrow candle pairs that flicker and lift a little, faint voices beating slowly
`,
    },
    {
      id: 'blue-bells',
      name: 'Blue bells',
      category: 'bell',
      rows: `
Gatehouse at noon | Blue bell | burn=16 secondFlame=0.35 embers=6 mouth=0.5 between=0.4 draught=0.18 flicker=0.3 roar=0.13 width=0.31 lag=0.34 place=0.15 volume=-9.5 | hall | toll | Glass struck in narrow tubes, a thin spirit pair slipping under each ring
Village across fields | Blue bell | burn=12 flame=0.1 mouth=0.3 embers=8 secondFlame=0.3 width=1 draught=0.13 flicker=0.14 roar=0.13 between=0.5 lag=0.21 place=0.33 volume=-7 | valley | peal | Narrow glass rung softly covered, hardly any flame behind it, spread wide
Bells from a rowing boat | Blue bell | burn=9 secondFlame=0.56 mouth=0.25 embers=4 draught=0.6 between=0.7 flicker=0.31 roar=0.14 width=0.86 lag=0.24 place=0.31 volume=-10 | tide | carillon | Covered narrow glass ringing over spirit pairs that beat and lean
Second hand shop chime | Blue bell | mouth=0.75 burn=4 embers=1 flame=0.35 secondFlame=0 draught=0.05 flicker=0.21 roar=0.15 width=0.8 lag=0.25 place=0.3 volume=-8.5 | tiles | taps | Bright narrow glass over a clear spirit tone that burns out in four seconds
Angelus, wet cobbles | Blue bell | burn=15 between=0.6 secondFlame=0.5 glass=0.7 flame=0.35 catch=1 embers=5 mouth=0.35 draught=0.08 flicker=0.12 roar=0.16 width=0.83 lag=0.24 place=0.16 volume=-4 | nave | peal | Narrow glass, then a spirit pair that swells and beats beneath the ring
Deep glass | Blue bell | burn=15 secondFlame=0.36 tube=Double mouth=0.4 flame=0.3 embers=7 between=0.5 draught=0.21 flicker=0 roar=0.17 width=0.93 lag=0.35 place=0.21 volume=-8 | crypt | peal | Glass struck over double spirit tubes, a bell with a pair of low reeds beating in it
Harbour with engines off | Blue bell | between=0.69 secondFlame=0.69 tube=Double fuel=Gas flame=0.5 glass=0.8 mouth=0.45 burn=12 draught=0.21 flicker=0.3 roar=0.06 width=0.59 lag=0.4 place=0.23 volume=-4.5 | darkhall | fifths | Struck glass and double gas pairs beating an octave under it, burning down
Bronze gone to candle | Blue bell | burn=14 between=0.49 secondFlame=0.66 tube=Double fuel=Candle flame=0.6 glass=0.6 mouth=0.9 embers=4 catch=0.3 draught=0.15 flicker=0.08 roar=0.26 width=0.57 lag=0.07 place=0.26 volume=-3 | bowls | peal | A soft ring of glass over candle pairs beating low in double tubes
Salt mine chimes | Blue bell | between=0.56 secondFlame=0.53 tube=Double fuel=Coal flame=0.4 glass=0.9 mouth=0.5 burn=8 roar=0.4 draught=0.12 flicker=0.39 width=0.73 lag=0.07 place=0.22 volume=-3.5 | shaft | toll | Glass struck over coal pairs in double tubes, a rough low roar dying under the ring
Lead type dropped | Blue bell | secondFlame=0.62 tube=Double glass=0.5 flame=0.7 mouth=0.25 burn=2 embers=1 between=0.9 draught=0.07 flicker=0.24 roar=0.03 width=0.82 lag=0.26 place=0.21 volume=-8.5 | springs | matches | Dull glass over double spirit pairs that beat hard and burn away
Hollow ware | Blue bell | burn=14 secondFlame=0.59 tube=Half_closed flame=0.35 mouth=0.5 embers=4 between=0.5 draught=0.39 flicker=0 roar=0.14 width=0.47 lag=0.36 place=0.11 volume=-6 | plate | peal | Half closed glass, a ring with a hollow reed pair beating slowly in it
Cowbells in cloud | Blue bell | between=0.69 secondFlame=0.35 tube=Half_closed fuel=Gas flame=0.5 glass=0.7 mouth=0.6 burn=3 embers=1.5 draught=0.38 flicker=0.14 roar=0.09 width=0.37 lag=0.39 place=0.29 volume=-2.5 | mist | carillon | Half closed gas pairs, a hollow clank of glass that beats and dies away
Temple after rain | Blue bell | burn=16 between=0.56 secondFlame=0.47 tube=Half_closed fuel=Candle flame=0.8 glass=0.6 mouth=0.9 embers=6 catch=0.5 draught=0.25 flicker=0.01 roar=0.05 width=0.54 lag=0.32 place=0.31 volume=-1 | rain | peal | Half closed glass, then soft candle pairs swelling and beating inside the ring
Pot lids in a courtyard | Blue bell | tube=Half_closed flame=0.6 glass=0.8 mouth=0.75 burn=1.5 embers=0.6 secondFlame=0.8 between=0.95 draught=0.32 flicker=0.05 roar=0.16 width=0.95 lag=0.07 place=0.24 volume=-4 | stairwell | taps | Half closed glass clanked over spirit pairs that beat fast and burn away
Twelfths on a triangle | Blue bell | burn=10 tube=Half_closed lag=0.08 place=0.445 draught=0.03 glass=0.75 fuel=Gas flame=0.45 mouth=0.7 secondFlame=0 flicker=0.34 roar=0.19 width=0.62 volume=0.5 | stars | toll | Half closed glass struck over a gas tone that sings its twelfth
Distant ice cream van | Blue bell | between=0.78 secondFlame=0.36 tube=Open fuel=Gas flame=0.3 glass=0.8 mouth=0.65 burn=4 embers=1.5 draught=0.33 flicker=0.04 roar=0.32 width=0.5 lag=0.3 place=0.31 volume=-6 | shore | carillon | Open gas pairs tapped on their glass, a chime that beats and burns down
Sun on greenhouse panes | Blue bell | burn=10 between=0.62 secondFlame=0.69 tube=Open flame=0.15 mouth=0.45 embers=6 draught=0.4 lift=0.4 flicker=0.23 roar=0.11 width=0.76 lag=0.38 place=0.2 volume=-6 | glimmer | gather | Open glass over tiny spirit pairs that lift and lean after the ring
Flicked lamp glass | Blue bell | tube=Open fuel=Candle flame=0.5 glass=0.9 mouth=1 burn=6 embers=2 secondFlame=0 draught=0.2 flicker=0.17 roar=0.19 width=0.97 lag=0.26 place=0.21 volume=-6.5 | parlour | taps | Open glass flicked hard over one soft candle that burns down in six seconds
Pocket watch repeater | Blue bell | secondFlame=0.6 tube=Open fuel=Spirit flame=0.25 glass=0.6 mouth=0.3 burn=1 embers=0.5 between=0.8 draught=0.04 flicker=0.08 roar=0.32 width=0.68 lag=0.23 place=0.2 volume=-1 | smaller | ostinato | Open spirit pairs tapped on glass, a tiny bright chime gone in a second
Bells that forget | Blue bell | between=0.49 secondFlame=0.63 tube=Open fuel=Coal flame=0.3 glass=0.7 mouth=0.6 flicker=0.7 embers=4 burn=10 draught=0.26 width=0.71 lag=0.16 place=0.2 volume=-1.5 | recall | peal | Open glass over coal pairs that beat, flicker and crackle as they burn out
Tinsel | Blue bell | tube=Flared flame=0.1 mouth=0.2 burn=3 embers=1.5 secondFlame=0 draught=0.26 flicker=0.08 roar=0.08 width=0.59 lag=0.08 place=0.26 volume=-1 | sheen | carillon | Flared glass with the thinnest spirit edge on it, soon burnt out
Sleigh over the ridge | Blue bell | secondFlame=0.47 tube=Flared fuel=Gas flame=0.3 mouth=0.45 burn=2 embers=1 between=0.9 draught=0.07 flicker=0.22 roar=0.11 width=0.65 lag=0.18 place=0.28 volume=-2 | far 1.mix=0.45 | ostinato | Flared glass and beating gas pairs, a bright jingle that dies quickly
Frosted tongue of a bell | Blue bell | burn=18 between=0.50 secondFlame=0.34 tube=Flared fuel=Candle flame=0.4 glass=0.8 mouth=0.5 embers=5 roar=0.4 draught=0.09 flicker=0.01 width=0.56 lag=0.1 place=0.33 volume=-4 | frost | toll | Flared glass over candle pairs, beating, with a soft rush of breath after
Signal box | Blue bell | tube=Flared flame=0.4 glass=0.6 mouth=0.2 burn=1 embers=0.4 secondFlame=0.3 between=0.1 draught=0.01 flicker=0.11 roar=0.08 width=0.49 lag=0.2 place=0.32 volume=-1 | combo | call | Flared spirit locked in pairs, a hard little bell code of glass and reed
Weather station mast | Blue bell | burn=10 secondFlame=0.59 tube=Flared fuel=Coal flame=0.25 glass=0.9 mouth=0.5 draught=0.7 roar=0.6 embers=3 flicker=0.01 width=0.79 between=0.32 lag=0.34 place=0.18 volume=0.5 | wind | toll | Flared glass ringing in a rush of coal smoke that leans with the draught | texture
Octave of frost | Blue bell | burn=12 lag=0.385 place=0.43 draught=0.03 glass=0.85 flame=0.3 fuel=Gas mouth=0.65 embers=5 secondFlame=0 flicker=0.07 roar=0.01 width=0.89 volume=-5.5 | winter | toll | Narrow glass over a single gas tone that sings its octave, thin and cold
High bell, low door | Blue bell | burn=12 lag=0.44 place=0.18 draught=0.05 flame=0.3 mouth=0.35 embers=6 secondFlame=0 flicker=0.34 roar=0.1 width=0.67 volume=-8 | openspace | onehigh | Narrow glass over a spirit tone two octaves up, on the fourth harmonic
Needle on a goblet | Blue bell | glass=0.6 lag=0.42 place=0.08 draught=0.02 flame=0.25 mouth=0.45 burn=8 secondFlame=0 embers=4 flicker=0.28 roar=0.08 width=0.78 volume=-16 | glasshalo | peal | Narrow tubes over a spirit tone on its twelfth, fine as a needle
Bells in fifths of light | Blue bell | burn=12 lag=0.42 place=0.05 draught=0.03 tube=Open fuel=Gas flame=0.3 mouth=0.6 secondFlame=0 embers=4 flicker=0.31 roar=0.12 width=0.81 volume=-5 | fifthshim | toll | Open glass struck over gas that sings the twelfth above each key
Two bells from one rope | Blue bell | burn=9 lag=0.15 place=0.04 draught=0.03 tube=Double fuel=Gas flame=0.35 mouth=0.6 secondFlame=0.2 between=0.2 flicker=0.01 roar=0.23 width=0.33 volume=-5 | undertow | peal | Double glass rung over gas, high and low pipes sounding at once
Rung, then breathing | Blue bell | between=0.77 secondFlame=0.33 glass=0.8 catch=1.5 fuel=Candle tube=Narrow flame=0.6 mouth=0.9 embers=6 burn=20 draught=0.06 flicker=0.35 roar=0.03 width=0.69 lag=0.16 place=0.28 volume=-2 | breathing | fifths | Narrow glass first, and after a second a candle pair swelling where it rang | pad
Bell becomes flute | Blue bell | burn=16 glass=0.65 catch=0.8 fuel=Gas flame=0.45 place=0.17 mouth=0.6 secondFlame=0 embers=2 draught=0.02 flicker=0.08 roar=0.05 width=0.29 lag=0.13 volume=-0.5 | plate 1.mix=0.2 | song | A ring of narrow glass that turns into a pure gas flute as it dies | wind
Struck once, sung after | Blue bell | secondFlame=0.3 glass=0.9 catch=1 tube=Half_closed fuel=Gas flame=0.5 mouth=0.5 embers=5 place=0.2 between=0.3 draught=0.25 flicker=0.16 roar=0.16 width=0.69 lag=0.27 volume=-4 | choirhall | fifths | Half closed glass struck, then a hollow gas pair that swells and slips | voice
Inside the tower clock | Blue bell | burn=22 secondFlame=0.33 glass=0.75 catch=2 tube=Double fuel=Gas flame=0.55 mouth=0.4 embers=8 between=0.35 draught=0.03 flicker=0.05 roar=0.28 width=0.82 lag=0.42 place=0.2 volume=-0.5 | crypt | still | Glass, and beneath it double gas pairs that slip and swell through the chord | pad
Matin glass | Blue bell | secondFlame=0.5 glass=0.6 catch=0.5 fuel=Spirit tube=Open flame=0.3 mouth=0.2 embers=3 between=0.45 draught=0.15 flicker=0.18 roar=0.12 width=0.95 lag=0.23 place=0.16 volume=3 | ensemble | gather | A light ring of covered glass, then spirit pairs slipping like strings | string
Crystal set | Blue bell | between=0.85 secondFlame=0.32 tube=Narrow glass=0.9 flame=0.15 mouth=0.5 flicker=0.7 embers=2 burn=12 draught=0.07 roar=0.31 width=0.66 lag=0.25 place=0.35 volume=-5 | nightradio | toll | Narrow glass rung over spirit pairs that beat and flicker faintly
Bells under still water | Blue bell | burn=14 between=0.46 secondFlame=0.59 mouth=0.2 flame=0.3 embers=7 draught=0.5 tube=Half_closed flicker=0.08 roar=0.08 width=0.43 lag=0.23 place=0.22 volume=-6.5 | diver | peal | Covered half closed glass over spirit pairs beating slowly and leaning
Chimes for a slow lift | Blue bell | burn=15 lift=0.6 flame=0.25 mouth=0.55 catch=0.4 embers=5 place=0.2 secondFlame=0 fuel=Gas draught=0.01 flicker=0.03 roar=0.26 width=0.51 lag=0.38 volume=0 | ascent | toll | Narrow glass over gas tones that lift to the octave as the ring dies
Carillon in fog | Blue bell | between=0.56 secondFlame=0.48 glass=0.7 mouth=0.3 embers=9 flame=0.2 fuel=Gas tube=Open draught=0.16 flicker=0.31 roar=0.12 width=0.72 lag=0.11 place=0.27 volume=-4 | hanging | carillon | Covered open glass ringing over small gas pairs, beating long after
Clapper wrapped in felt | Blue bell | between=0.85 secondFlame=0.29 glass=0.55 mouth=0.15 flame=0.4 tube=Open fuel=Gas burn=7 embers=3 place=0.25 draught=0.14 flicker=0.13 roar=0.01 width=0.32 lag=0.22 volume=-3.5 | feltair | peal | Muffled open glass over a round gas pair that beats and burns down
Teacups, earthquake | Blue bell | glass=1 flame=0.08 burn=1 embers=0.6 mouth=0.9 secondFlame=0.8 between=1 draught=0.29 flicker=0.02 roar=0.13 width=0.35 lag=0.18 place=0.32 volume=-7.5 | marbles | taps | Narrow glass rattled bright, its tiny spirit pairs fluttering and out in a second
Beads and a small wheel | Blue bell | glass=0.7 tube=Narrow fuel=Candle flame=0.4 mouth=0.9 burn=5 embers=2 secondFlame=0.7 between=0.75 draught=0.18 flicker=0.37 roar=0.14 width=0.88 lag=0.39 place=0.17 volume=-3.5 | fastrotor | ostinato | Narrow glass and soft candle pairs that beat and burn down as they turn
Mercury beads | Blue bell | between=0.83 secondFlame=0.45 glass=0.6 burn=2 embers=1 flame=0.3 mouth=0.55 lift=0.5 place=0.2 draught=0.18 flicker=0.17 roar=0.08 width=0.52 lag=0.19 volume=-3.5 | skips | taps | Narrow spirit pairs tapped on glass, lifting and gone in two seconds | plucked
Wind chime, no wind | Blue bell | burn=22 glass=0.8 flame=0 embers=3 mouth=0.65 draught=0 secondFlame=0 width=1 tube=Half_closed flicker=0.02 roar=0.02 lag=0.07 place=0.2 volume=-6.5 | outdoors | taps | Half closed glass with barely a flame in it, hanging still at both sides
Gamelan in the attic | Blue bell | glass=0.9 tube=Half_closed flame=0.5 mouth=0.45 between=0.85 secondFlame=1 burn=6 embers=2 draught=0.01 flicker=0.38 roar=0.1 width=0.98 lag=0.34 place=0.31 volume=-4.5 | chimed | ostinato | Half closed glass over spirit pairs beating hard, a small warped metal band
Glass for a dry mouth | Glass tap keys | glass=1 tube=Narrow fuel=Candle flame=0.2 burn=20 embers=4 mouth=1 secondFlame=0 draught=0.36 flicker=0.35 roar=0.25 width=0.37 lag=0.06 place=0.24 | bare | toll | Narrow glass rung, with one faint candle humming underneath
Altar steps | Glass tap keys | glass=0.95 tube=Double flame=0.3 burn=9 embers=6 mouth=0.6 secondFlame=0.5 between=0.15 draught=0.04 flicker=0.04 roar=0.24 width=0.45 lag=0.13 place=0.3 volume=-6 | nave | toll | Glass over double gas pairs, each bell leaving a low tone as it burns down
Marble lobby lift doors | Glass tap keys | secondFlame=0.27 glass=0.8 tube=Open fuel=Gas flame=0.2 burn=5 embers=3 mouth=0.75 lift=0.8 draught=0.36 flicker=0.24 roar=0.09 width=0.91 between=0.62 lag=0.27 place=0.14 volume=-1 | openspace 1.mix=0.22 | call | Open glass and a small gas tone lifted to its octave, burning down
Meteor count | Glass tap keys | glass=0.9 tube=Narrow fuel=Spirit flame=0.15 burn=6 embers=2 mouth=0.45 secondFlame=0.38 between=0.5 draught=0.31 flicker=0.15 roar=0.1 width=0.61 lag=0.35 place=0.14 | descent | toll | Narrow glass over spirit pairs beating slowly as they burn out
Evening stained window | Blue bell | between=0.47 secondFlame=0.45 glass=0.85 tube=Open fuel=Gas flame=0.6 mouth=0.45 catch=0.3 burn=40 embers=5 place=0.3 width=1 draught=0.31 flicker=0.38 roar=0.21 lag=0.11 volume=-6 | evening | gather | Open glass and tall gas pairs held on after it, beating warm and wide | organ
`,
    },
  ],
}
