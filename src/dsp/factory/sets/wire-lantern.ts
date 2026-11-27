import { type InstrumentSet } from './set'

// The set of Wire Lantern. A direction is one way of playing wire on a solid;
// in each are ten families of five. A family is one corner of the instrument
// (a solid, what wakes it, where it is touched, how it dies), and its five
// differ in register, in movement and in what their chain is for.

export const SET: InstrumentSet = {
  device: 'wire-lantern',
  names: {
    solid: ['Ring', 'Tetrahedron', 'Octahedron', 'Cube', 'Prism', 'Web'],
    exciter: ['Finger', 'Hammer', 'Bow', 'Breath'],
  },
  chains: {
    // Near: colour, width and the smallest rooms.
    bare: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Open' }],
      words: ', with nothing round it',
    },
    warm: { effects: [{ deviceId: 'ambient-eq', preset: 'Warm' }], words: ', close and warm' },
    shaded: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Shaded' }],
      words: ', dry and a little shaded',
    },
    thin: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Thin' },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: ', thinned out and dry',
    },
    floor: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Deep' }],
      words: ', dry, with its floor lifted',
    },
    scooped: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Hollow' },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: ', dry and scooped in the middle',
    },
    forward: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Forward' }],
      words: ', dry and forward',
    },
    wide: { effects: [{ deviceId: 'stereo-widener', preset: 'Wide' }], words: ', dry and wide' },
    middle: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Narrow' },
        { deviceId: 'ambient-comp', preset: 'Glue', params: { mix: 0.7 } },
      ],
      words: ', dry and down the middle',
    },
    airy: {
      effects: [{ deviceId: 'spread', preset: 'Firm and airy' }],
      words: ', firm below and open above',
    },
    firm: {
      effects: [
        { deviceId: 'spread', preset: 'Firm bass' },
        { deviceId: 'ambient-comp', preset: 'Glue' },
      ],
      words: ', held firm and dry',
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
      effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } }],
      words: 'in a tight chamber',
    },
    short: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.3 } }],
      words: 'with a short air behind it',
    },
    tile: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.25 } }],
      words: 'in a tiled room',
    },
    felt: {
      effects: [{ deviceId: 'sift', preset: 'Felt and air' }],
      words: 'with felt laid over each onset',
    },
    strikes: {
      effects: [{ deviceId: 'sift', preset: 'Strikes forward' }],
      words: ', its onsets pushed forward',
    },
    double: {
      effects: [{ deviceId: 'stereo-detune', preset: 'Soft halo' }],
      words: ', doubled a few cents apart',
    },
    thick: {
      effects: [
        { deviceId: 'stereo-detune', preset: 'Thickener' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', thickened and close',
    },
    lifted: {
      effects: [{ deviceId: 'lift', preset: 'Long tails', params: { amount: 0.5 } }],
      words: 'with its tails brought up',
    },
    overtones: {
      effects: [{ deviceId: 'reveal', preset: 'Overtones' }],
      words: 'with its overtones brought up',
    },
    tamed: {
      effects: [
        { deviceId: 'tamer', preset: 'Ringing tones' },
        { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
      ],
      words: ', its loudest tones held down',
    },
    // Bodies it is played inside.
    wood: {
      effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.45 } }],
      words: 'in a wooden body',
    },
    jar: {
      effects: [{ deviceId: 'vessel', preset: 'Glass tube', params: { mix: 0.4 } }],
      words: 'down a glass tube',
    },
    pot: {
      effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.5 } }],
      words: 'in a clay pot',
    },
    tin: {
      effects: [{ deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.45 } }],
      words: 'in a small tin',
    },
    seashell: {
      effects: [{ deviceId: 'vessel', preset: 'Shell to the ear', params: { mix: 0.5 } }],
      words: 'as if in a sea shell',
    },
    darkbox: { effects: [{ deviceId: 'imprint', preset: 'Dark box' }], words: 'in a dark box' },
    vowel: {
      effects: [
        { deviceId: 'imprint', preset: 'Round vowel', params: { amount: 0.8 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', shaped to a round vowel',
    },
    smaller: {
      effects: [{ deviceId: 'size', preset: 'Smaller' }],
      words: 'in a body made smaller',
    },
    larger: { effects: [{ deviceId: 'size', preset: 'Giant' }], words: 'in a giant body' },
    // Drive, loudspeakers and the wear of a medium.
    console: {
      effects: [{ deviceId: 'analog-drive', preset: 'Console' }],
      words: ', pushed gently through a desk',
    },
    triode: {
      effects: [{ deviceId: 'analog-drive', preset: 'Triode glow' }],
      words: ', glowing in a valve',
    },
    iron: {
      effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }],
      words: ', weighted through iron',
    },
    grit: {
      effects: [
        { deviceId: 'saturator', preset: 'Tube preamp', params: { mix: 0.5 } },
        { deviceId: 'ambient-eq', preset: 'Shaded' },
      ],
      words: ', driven with the top rubbed off',
    },
    folded: {
      effects: [
        { deviceId: 'saturator', preset: 'Folded glass', params: { mix: 0.35 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
      ],
      words: ', folded over on a small plate',
    },
    combo: {
      effects: [{ deviceId: 're-amp', preset: 'Combo in a room' }],
      words: 'from a small amplifier',
    },
    pillow: {
      effects: [{ deviceId: 're-amp', preset: 'Pillow speaker' }],
      words: 'from under a pillow',
    },
    platform: {
      effects: [{ deviceId: 're-amp', preset: 'Station platform' }],
      words: 'from a horn along a platform',
    },
    reel: {
      effects: [{ deviceId: 'tape', preset: 'Quarter inch' }],
      words: 'on a steady reel of tape',
    },
    worn: {
      effects: [
        { deviceId: 'tape', preset: 'Worn thin' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'on tape worn thin',
    },
    seasick: { effects: [{ deviceId: 'tape', preset: 'Seasick' }], words: 'on tape that sways' },
    cassette: {
      effects: [{ deviceId: 'patina', preset: 'Worn cassette' }],
      words: 'on a worn cassette',
    },
    kitchen: {
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
    parlour: {
      effects: [{ deviceId: 'vinyl', preset: 'Parlour 78', params: { mix: 0.8 } }],
      words: 'off an old shellac disc',
    },
    glaze: {
      effects: [{ deviceId: 'vintage-digital', preset: 'Glaze' }],
      words: 'under a twelve bit glaze',
    },
    crumbs: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Dusty', params: { mix: 0.7 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.22 } },
      ],
      words: ', crumbling on a dark plate',
    },
    night: {
      effects: [{ deviceId: 'radio', preset: 'Night shortwave', params: { mix: 0.6 } }],
      words: 'through a night-time radio',
    },
    stream: {
      effects: [{ deviceId: 'low-bitrate', preset: 'Behind glass', params: { mix: 0.7 } }],
      words: ', swirling as if behind a pane',
    },
    buzz: {
      effects: [{ deviceId: 'buzzing-bridge', preset: 'Harp on a bridge', params: { mix: 0.45 } }],
      words: 'over a bridge that buzzes',
    },
    shells: {
      effects: [
        { deviceId: 'buzzing-bridge', preset: 'Three shells', params: { mix: 0.4 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'with loose shells that rattle',
    },
    paper: {
      effects: [{ deviceId: 'buzzing-bridge', preset: 'Paper edge', params: { mix: 0.4 } }],
      words: 'against an edge of paper',
    },
    howl: {
      effects: [{ deviceId: 'howl', preset: 'Faint sustain' }],
      words: ', held up by faint feedback',
    },
    hiss: {
      effects: [
        { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -52 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.22 } },
      ],
      words: 'over a floor of hiss',
    },
    // Movement.
    drift: { effects: [{ deviceId: 'chorus', preset: 'Slow drift' }], words: 'in a slow chorus' },
    ensemble: {
      effects: [
        { deviceId: 'chorus', preset: 'Lush ensemble' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', spread to an ensemble',
    },
    swirl: {
      effects: [{ deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.45 } }],
      words: 'in a slow swirl',
    },
    cloudphase: {
      effects: [
        { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { mix: 0.4 } },
        { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.22 } },
      ],
      words: 'in clouded phases',
    },
    comb: {
      effects: [{ deviceId: 'flanger', preset: 'Glacial drift' }],
      words: 'through a comb that hardly moves',
    },
    harmonic: {
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
    pan: {
      effects: [{ deviceId: 'tremolo', preset: 'Side to side' }],
      words: 'from one side to the other',
    },
    swell: {
      effects: [
        { deviceId: 'tremolo', preset: 'Sea swell' },
        { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.25 } },
      ],
      words: 'on a long sea swell',
    },
    chorale: {
      effects: [{ deviceId: 'rotary', preset: 'Chorale' }],
      words: 'through a slow rotating horn',
    },
    spinning: {
      effects: [
        { deviceId: 'rotary', preset: 'Soft blend', params: { speed: 1 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
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
    twinkle: {
      effects: [
        { deviceId: 'glimmer', preset: 'Fast shimmer' },
        { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.2 } },
      ],
      words: ', all its tones twinkling',
    },
    throb: { effects: [{ deviceId: 'pulses', preset: 'Soft throb' }], words: 'in a soft throb' },
    weave: {
      effects: [
        { deviceId: 'pulses', preset: 'Wide weave' },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', woven in two pulses',
    },
    bandbeat: {
      effects: [{ deviceId: 'band-pulse', preset: 'Four a second' }],
      words: 'with its middle beating in fours',
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
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', swung from side to side',
    },
    flock: {
      effects: [{ deviceId: 'murmuration', preset: 'Evening flock' }],
      words: 'in a flock of its own voices',
    },
    vibrato: {
      effects: [
        { deviceId: 'late-vibrato', preset: 'Slow bow' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } },
      ],
      words: 'with a sway that comes late',
    },
    gatefilter: {
      effects: [
        {
          deviceId: 'auto-filter',
          preset: 'Low-pass gate',
          params: { cutoffHz: 350, envAmount: 60, envReleaseMs: 900 },
        },
      ],
      words: 'through a filter that shuts as it fades',
    },
    glacialfilter: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
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
    // Echoes, in time and loose.
    dotted: {
      effects: [{ deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.28 } }],
      words: 'in dotted tape echoes',
    },
    trail: {
      effects: [{ deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.3 } }],
      words: 'with a long dark trail of echo',
    },
    heads: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.28 } },
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
        { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.3 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'with dark echoes',
    },
    hops: {
      effects: [{ deviceId: 'analog-delay', preset: 'Fifth hop', params: { mix: 0.3 } }],
      words: ', its echoes hopping by fifths',
    },
    stars: {
      effects: [{ deviceId: 'constellation', preset: 'Scattered seven' }],
      words: ', scattered in seven loose echoes',
    },
    stone: {
      effects: [{ deviceId: 'skipping-stone', preset: 'Skipping stone' }],
      words: ', skipping off like a stone',
    },
    pebble: {
      effects: [
        { deviceId: 'skipping-stone', preset: 'Slowing bounces' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
      ],
      words: 'with bounces that slow down',
    },
    canon: {
      effects: [
        { deviceId: 'canon', preset: 'Faint answer' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', answered in a faint canon',
    },
    fan: {
      effects: [{ deviceId: 'prism', preset: 'Low to high' }],
      words: ', each echo fanned low to high',
    },
    crystals: {
      effects: [{ deviceId: 'grain-delay', preset: 'Crystals', params: { mix: 0.25 } }],
      words: 'throwing crystals an octave up',
    },
    embers: {
      effects: [
        { deviceId: 'grain-delay', preset: 'Falling embers', params: { mix: 0.28 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
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
    room: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.25 } }],
      words: 'in an ordinary room',
    },
    plate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
      words: 'on a long plate',
    },
    sheen: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.28 } }],
      words: 'on a bright plate',
    },
    spring: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.28 } }],
      words: 'into two springs',
    },
    slack: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Slack and strange', params: { mix: 0.32 } }],
      words: 'into slack springs',
    },
    hall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
      words: 'in a hall',
    },
    darkhall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.34 } }],
      words: 'in a dark hall',
    },
    nave: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.32 } }],
      words: 'in a vast nave',
    },
    far: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.6 } }],
      words: 'from far away',
    },
    cave: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.35 } }],
      words: 'in a dark cave',
    },
    valley: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.35 } }],
      words: 'across an open valley',
    },
    slowhall: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.4 } }],
      words: 'in a hall that breathes',
    },
    open: {
      effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } }],
      words: 'in a wide open space',
    },
    crypt: {
      effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.35 } }],
      words: 'under a low stone roof',
    },
    tunnel: {
      effects: [{ deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.38 } }],
      words: 'along a narrow tunnel',
    },
    cavern: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.32 } }],
      words: 'in a cavern of small echoes',
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
    gated: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.35 } }],
      words: 'in a room that stops short',
    },
    rising: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Long rise', params: { mix: 0.4 } }],
      words: 'into a tail that rises',
    },
    fog: { effects: [{ deviceId: 'fog', preset: 'Morning mist' }], words: ', blurred in mist' },
    frozen: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Soft freeze', params: { mix: 0.35 } }],
      words: 'into a tail half frozen',
    },
    // Halls that sing, climb and answer.
    shimmer: {
      effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer' }],
      words: 'under a faint octave shimmer',
    },
    fifths: {
      effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { mix: 0.35 } }],
      words: ', fifths rising behind it',
    },
    undertow: {
      effects: [{ deviceId: 'shimmer', preset: 'Undertow', params: { mix: 0.35 } }],
      words: ', its tail sinking by octaves',
    },
    bloom: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Faint glow' }],
      words: 'in a tail that slowly glows',
    },
    winter: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Winter drift', params: { mix: 0.35 } }],
      words: 'in a cold drifting tail',
    },
    ascent: {
      effects: [{ deviceId: 'spiral', preset: 'Slow ascent', params: { mix: 0.35 } }],
      words: 'in a tail that always climbs',
    },
    choirhall: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.32 } }],
      words: ', a hall singing ah behind',
    },
    monks: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.35 } }],
      words: ', low voices in the hall',
    },
    haze: {
      effects: [{ deviceId: 'haze', preset: 'Thin veil' }],
      words: 'behind a thin glowing haze',
    },
    strings: {
      effects: [{ deviceId: 'sympathetic', preset: 'Long ring', params: { mix: 0.35 } }],
      words: 'with other strings ringing along',
    },
    keysheld: {
      effects: [{ deviceId: 'silent-keys', preset: 'Open fifth and bass', params: { mix: 0.4 } }],
      words: 'over a fifth held down in silence',
    },
    bowls: {
      effects: [{ deviceId: 'bowls', preset: 'Low fifths', params: { root: 2, mix: 0.3 } }],
      words: 'beside bowls tuned in fifths',
    },
    // Clouds, freezes and second voices.
    cloud: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.4 } }],
      words: 'in a soft cloud of grains',
    },
    shards: {
      effects: [
        { deviceId: 'grain-cloud', preset: 'Glass shards', params: { mix: 0.35 } },
        { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.22 } },
      ],
      words: 'with grains like broken glass',
    },
    blur: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist' }],
      words: ', smeared to a hanging mist',
    },
    glasshalo: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.4 } }],
      words: 'with a smear of glass round it',
    },
    scatter: {
      effects: [{ deviceId: 'spectral-drifter', preset: 'Scatter', params: { mix: 0.35 } }],
      words: ', shifted pieces drifting off',
    },
    marbles: {
      effects: [{ deviceId: 'cascade', preset: 'Dropped marbles', params: { mix: 0.35 } }],
      words: ', its pieces spilling like marbles',
    },
    stack: {
      effects: [
        { deviceId: 'cascade', preset: 'Octave stack', params: { mix: 0.32 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.18 } },
      ],
      words: ', its loops stacked in octaves',
    },
    sparks: {
      effects: [{ deviceId: 'glints', preset: 'First light' }],
      words: 'with sparks above it',
    },
    leaves: {
      effects: [{ deviceId: 'falling', preset: 'Falling leaves' }],
      words: ', pieces of it falling like leaves',
    },
    wax: {
      effects: [{ deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.35 } }],
      words: 'with a tail that sags like wax',
    },
    stretched: {
      effects: [{ deviceId: 'stretch', preset: 'Slow cloud', params: { mix: 0.4 } }],
      words: ', stretched into a slow cloud',
    },
    held: {
      effects: [{ deviceId: 'sustainer', preset: 'Thin halo' }],
      words: 'with a thin held halo',
    },
    shadow: {
      effects: [{ deviceId: 'sine-shadow', preset: 'Long linger', params: { mix: 0.4 } }],
      words: 'with pure tones lingering after',
    },
    padbehind: {
      effects: [{ deviceId: 'pad-follower', preset: 'Dark cellos', params: { mix: 0.35 } }],
      words: 'with a dark pad behind',
    },
    dissolve: {
      effects: [{ deviceId: 'generations', preset: 'Slow dissolve', params: { mix: 0.4 } }],
      words: 'dissolving into its own room',
    },
    halved: {
      effects: [{ deviceId: 'half-speed', preset: 'Smooth octave', params: { mix: 0.4 } }],
      words: 'over itself at half speed',
    },
    suboctave: {
      effects: [{ deviceId: 'octaves', preset: 'Sub octave' }],
      words: 'with an octave added below',
    },
    pipes: {
      effects: [
        { deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: 'with flute stops drawn behind it',
    },
    shifted: {
      effects: [{ deviceId: 'freq-shifter', preset: 'Still water', params: { mix: 0.45 } }],
      words: ', its tones beating slowly',
    },
    ringed: {
      effects: [
        { deviceId: 'ring', preset: 'Fifth halo', params: { mix: 0.25 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: 'with a metal halo from a ring of fifths',
    },
    warped: {
      effects: [{ deviceId: 'warp', preset: 'Soft chime', params: { mix: 0.5 } }],
      words: ', half of it bent to a chime',
    },
    whistled: {
      effects: [
        { deviceId: 'overtone-singer', preset: 'Faint melody' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', a whistled overtone moving over it',
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
      effects: [{ deviceId: 'underwater', preset: 'Just under', params: { mix: 0.8 } }],
      words: 'just under water',
    },
    frost: {
      effects: [{ deviceId: 'seasons', preset: 'First frost', params: { mix: 0.7 } }],
      words: 'in the first frost',
    },
    common: {
      effects: [
        { deviceId: 'common-tones', preset: 'Light touch' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', the tones it keeps hanging on',
    },
  },
  phrases: {
    lamp: {
      notes: [
        { atSec: 0, durSec: 3.8, note: 50, gain: 0.7 },
        { atSec: 0, durSec: 7, note: 64, gain: 0.5 },
        { atSec: 0, durSec: 7, note: 67, gain: 0.5 },
        { atSec: 0, durSec: 3.8, note: 57, gain: 0.6 },
        { atSec: 3.7, durSec: 3.4, note: 45, gain: 0.7 },
        { atSec: 3.7, durSec: 3.4, note: 60, gain: 0.6 },
      ],
    },
    quartal: {
      notes: [
        { atSec: 0, durSec: 7, note: 50, gain: 0.7 },
        { atSec: 0.8, durSec: 6.2, note: 55, gain: 0.6 },
        { atSec: 1.6, durSec: 5.4, note: 60, gain: 0.6 },
        { atSec: 2.4, durSec: 4.6, note: 65, gain: 0.5 },
        { atSec: 3.6, durSec: 3.4, note: 69, gain: 0.5 },
      ],
    },
    suspended: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 50, gain: 0.7 },
        { atSec: 0, durSec: 7.2, note: 57, gain: 0.5 },
        { atSec: 0, durSec: 2.5, note: 67, gain: 0.6 },
        { atSec: 1.2, durSec: 3.3, note: 72, gain: 0.5 },
        { atSec: 2.4, durSec: 4.8, note: 65, gain: 0.6 },
        { atSec: 4.4, durSec: 2.8, note: 71, gain: 0.6 },
      ],
    },
    tenths: {
      notes: [
        { atSec: 0, durSec: 3.6, note: 41, gain: 0.7 },
        { atSec: 0, durSec: 3.6, note: 60, gain: 0.6 },
        { atSec: 0, durSec: 3.6, note: 69, gain: 0.6 },
        { atSec: 3.5, durSec: 3.7, note: 43, gain: 0.7 },
        { atSec: 3.5, durSec: 3.7, note: 64, gain: 0.6 },
        { atSec: 3.5, durSec: 3.7, note: 71, gain: 0.5 },
      ],
    },
    single: { notes: [{ atSec: 0, durSec: 6.6, note: 57, gain: 0.8 }] },
    singlelow: {
      notes: [
        { atSec: 0, durSec: 6.8, note: 38, gain: 0.8 },
        { atSec: 3.2, durSec: 3.4, note: 50, gain: 0.4 },
      ],
    },
    ground: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 38, gain: 0.8 },
        { atSec: 0, durSec: 7.2, note: 45, gain: 0.6 },
        { atSec: 1.6, durSec: 3, note: 69, gain: 0.5 },
        { atSec: 4.3, durSec: 2.8, note: 64, gain: 0.5 },
      ],
    },
    stone: {
      notes: [
        { atSec: 0, durSec: 7, note: 36, gain: 0.8 },
        { atSec: 0.6, durSec: 6.4, note: 43, gain: 0.6 },
        { atSec: 2.2, durSec: 4.8, note: 60, gain: 0.5 },
        { atSec: 4, durSec: 3, note: 62, gain: 0.4 },
      ],
    },
    rise: {
      notes: [
        { atSec: 0, durSec: 5.6, note: 45, gain: 0.8 },
        { atSec: 0.45, durSec: 5, note: 52, gain: 0.6 },
        { atSec: 0.9, durSec: 4.6, note: 57, gain: 0.6 },
        { atSec: 1.35, durSec: 4.2, note: 64, gain: 0.6 },
        { atSec: 1.8, durSec: 3.8, note: 69, gain: 0.6 },
        { atSec: 2.25, durSec: 2, note: 76, gain: 0.6 },
        { atSec: 4.1, durSec: 2.6, note: 72, gain: 0.7 },
      ],
    },
    fall: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 79, gain: 0.7 },
        { atSec: 0.5, durSec: 1.6, note: 74, gain: 0.6 },
        { atSec: 1, durSec: 1.6, note: 69, gain: 0.6 },
        { atSec: 1.5, durSec: 1.8, note: 67, gain: 0.6 },
        { atSec: 2, durSec: 2, note: 62, gain: 0.6 },
        { atSec: 2.5, durSec: 3.4, note: 57, gain: 0.6 },
        { atSec: 3.4, durSec: 3.2, note: 50, gain: 0.8 },
        { atSec: 4.6, durSec: 2.2, note: 65, gain: 0.5 },
      ],
    },
    rocking: {
      notes: [
        { atSec: 0.0, durSec: 0.9, note: 57, gain: 0.7 },
        { atSec: 0.42, durSec: 0.9, note: 64, gain: 0.5 },
        { atSec: 0.84, durSec: 0.9, note: 60, gain: 0.5 },
        { atSec: 1.26, durSec: 0.9, note: 64, gain: 0.5 },
        { atSec: 1.68, durSec: 0.9, note: 55, gain: 0.7 },
        { atSec: 2.1, durSec: 0.9, note: 64, gain: 0.5 },
        { atSec: 2.52, durSec: 0.9, note: 60, gain: 0.5 },
        { atSec: 2.94, durSec: 0.9, note: 62, gain: 0.5 },
        { atSec: 3.36, durSec: 0.9, note: 53, gain: 0.7 },
        { atSec: 3.78, durSec: 0.9, note: 62, gain: 0.5 },
        { atSec: 4.2, durSec: 0.9, note: 57, gain: 0.5 },
        { atSec: 4.62, durSec: 0.9, note: 60, gain: 0.5 },
        { atSec: 5.04, durSec: 0.9, note: 50, gain: 0.8 },
        { atSec: 5.46, durSec: 0.9, note: 57, gain: 0.5 },
        { atSec: 5.9, durSec: 1.4, note: 65, gain: 0.6 },
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
    contrary: {
      notes: [
        { atSec: 0, durSec: 1.7, note: 50, gain: 0.7 },
        { atSec: 0, durSec: 1.7, note: 65, gain: 0.6 },
        { atSec: 1.7, durSec: 1.7, note: 48, gain: 0.7 },
        { atSec: 1.7, durSec: 1.7, note: 67, gain: 0.6 },
        { atSec: 3.4, durSec: 1.7, note: 47, gain: 0.7 },
        { atSec: 3.4, durSec: 1.7, note: 69, gain: 0.6 },
        { atSec: 5.1, durSec: 2, note: 45, gain: 0.7 },
        { atSec: 5.1, durSec: 2, note: 72, gain: 0.6 },
      ],
    },
    answer: {
      notes: [
        { atSec: 0, durSec: 0.9, note: 62, gain: 0.7 },
        { atSec: 0.4, durSec: 0.9, note: 65, gain: 0.6 },
        { atSec: 0.8, durSec: 1.6, note: 69, gain: 0.7 },
        { atSec: 2.6, durSec: 0.9, note: 74, gain: 0.6 },
        { atSec: 3, durSec: 0.9, note: 72, gain: 0.5 },
        { atSec: 3.4, durSec: 1.8, note: 67, gain: 0.6 },
        { atSec: 5, durSec: 2.2, note: 50, gain: 0.7 },
      ],
    },
    line: {
      notes: [
        { atSec: 0, durSec: 1.9, note: 62, gain: 0.7 },
        { atSec: 1.8, durSec: 1, note: 64, gain: 0.6 },
        { atSec: 2.7, durSec: 1.8, note: 67, gain: 0.8 },
        { atSec: 4.4, durSec: 1, note: 65, gain: 0.6 },
        { atSec: 5.3, durSec: 1.9, note: 62, gain: 0.7 },
      ],
    },
    lowline: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 38, gain: 0.8 },
        { atSec: 1.8, durSec: 0.8, note: 45, gain: 0.6 },
        { atSec: 2.8, durSec: 1, note: 41, gain: 0.7 },
        { atSec: 4, durSec: 2.9, note: 36, gain: 0.8 },
      ],
    },
    walk: {
      notes: [
        { atSec: 0, durSec: 0.9, note: 33, gain: 0.8 },
        { atSec: 1, durSec: 0.7, note: 40, gain: 0.6 },
        { atSec: 1.8, durSec: 0.7, note: 45, gain: 0.6 },
        { atSec: 2.6, durSec: 0.7, note: 43, gain: 0.7 },
        { atSec: 3.5, durSec: 2.8, note: 38, gain: 0.8 },
      ],
    },
    tenor: {
      notes: [
        { atSec: 0, durSec: 3.3, note: 36, gain: 0.8 },
        { atSec: 0.9, durSec: 2.4, note: 52, gain: 0.5 },
        { atSec: 3.5, durSec: 3.4, note: 41, gain: 0.8 },
        { atSec: 4.4, durSec: 2.4, note: 57, gain: 0.5 },
      ],
    },
    stars: {
      notes: [
        { atSec: 0, durSec: 0.4, note: 88, gain: 0.6 },
        { atSec: 0.9, durSec: 0.4, note: 83, gain: 0.5 },
        { atSec: 1.4, durSec: 0.4, note: 91, gain: 0.5 },
        { atSec: 2.9, durSec: 0.4, note: 86, gain: 0.6 },
        { atSec: 3.7, durSec: 0.4, note: 79, gain: 0.6 },
        { atSec: 5, durSec: 0.6, note: 84, gain: 0.5 },
      ],
    },
    grace: {
      notes: [
        { atSec: 0, durSec: 0.15, note: 71, gain: 0.5 },
        { atSec: 0.14, durSec: 1.2, note: 72, gain: 0.7 },
        { atSec: 1.2, durSec: 0.15, note: 67, gain: 0.5 },
        { atSec: 1.34, durSec: 1.2, note: 69, gain: 0.7 },
        { atSec: 2.4, durSec: 0.15, note: 62, gain: 0.5 },
        { atSec: 2.54, durSec: 2, note: 64, gain: 0.7 },
        { atSec: 2.54, durSec: 2, note: 57, gain: 0.6 },
        { atSec: 4.4, durSec: 0.15, note: 74, gain: 0.5 },
        { atSec: 4.54, durSec: 2.2, note: 76, gain: 0.6 },
        { atSec: 4.54, durSec: 2.2, note: 53, gain: 0.6 },
      ],
    },
    chorale: {
      notes: [
        { atSec: 0, durSec: 2.2, note: 53, gain: 0.7 },
        { atSec: 0, durSec: 2.2, note: 60, gain: 0.5 },
        { atSec: 0, durSec: 2.2, note: 64, gain: 0.5 },
        { atSec: 0, durSec: 2.2, note: 69, gain: 0.6 },
        { atSec: 2.3, durSec: 2.2, note: 52, gain: 0.7 },
        { atSec: 2.3, durSec: 2.2, note: 60, gain: 0.5 },
        { atSec: 2.3, durSec: 2.2, note: 62, gain: 0.5 },
        { atSec: 2.3, durSec: 2.2, note: 67, gain: 0.6 },
        { atSec: 4.6, durSec: 2.5, note: 50, gain: 0.7 },
        { atSec: 4.6, durSec: 2.5, note: 57, gain: 0.5 },
        { atSec: 4.6, durSec: 2.5, note: 65, gain: 0.5 },
        { atSec: 4.6, durSec: 2.5, note: 69, gain: 0.6 },
      ],
    },
    hymn: {
      notes: [
        { atSec: 0, durSec: 2.4, note: 48, gain: 0.7 },
        { atSec: 0, durSec: 2.4, note: 55, gain: 0.5 },
        { atSec: 0, durSec: 2.4, note: 64, gain: 0.5 },
        { atSec: 0, durSec: 4.8, note: 72, gain: 0.5 },
        { atSec: 2.4, durSec: 2.4, note: 45, gain: 0.7 },
        { atSec: 2.4, durSec: 2.4, note: 57, gain: 0.5 },
        { atSec: 2.4, durSec: 2.4, note: 64, gain: 0.5 },
        { atSec: 4.8, durSec: 2.4, note: 43, gain: 0.7 },
        { atSec: 4.8, durSec: 2.4, note: 59, gain: 0.5 },
        { atSec: 4.8, durSec: 2.4, note: 65, gain: 0.5 },
        { atSec: 4.8, durSec: 2.4, note: 74, gain: 0.5 },
      ],
    },
    knock: {
      notes: [
        { atSec: 0.0, durSec: 0.2, note: 62, gain: 0.8 },
        { atSec: 0.36, durSec: 0.2, note: 57, gain: 0.5 },
        { atSec: 0.72, durSec: 0.2, note: 62, gain: 0.5 },
        { atSec: 1.08, durSec: 0.2, note: 69, gain: 0.7 },
        { atSec: 1.44, durSec: 0.2, note: 62, gain: 0.5 },
        { atSec: 1.8, durSec: 0.2, note: 57, gain: 0.5 },
        { atSec: 2.16, durSec: 0.2, note: 64, gain: 0.7 },
        { atSec: 2.52, durSec: 0.2, note: 57, gain: 0.4 },
        { atSec: 2.88, durSec: 0.2, note: 62, gain: 0.8 },
        { atSec: 3.24, durSec: 0.2, note: 57, gain: 0.5 },
        { atSec: 3.6, durSec: 0.2, note: 62, gain: 0.5 },
        { atSec: 3.96, durSec: 0.2, note: 72, gain: 0.7 },
        { atSec: 4.32, durSec: 0.2, note: 62, gain: 0.5 },
        { atSec: 4.68, durSec: 0.2, note: 55, gain: 0.6 },
        { atSec: 5.4, durSec: 1.2, note: 50, gain: 0.8 },
      ],
    },
    sixths: {
      notes: [
        { atSec: 0, durSec: 1.8, note: 57, gain: 0.6 },
        { atSec: 0, durSec: 1.8, note: 65, gain: 0.6 },
        { atSec: 1.8, durSec: 1.8, note: 59, gain: 0.6 },
        { atSec: 1.8, durSec: 1.8, note: 67, gain: 0.6 },
        { atSec: 3.6, durSec: 1.8, note: 60, gain: 0.6 },
        { atSec: 3.6, durSec: 1.8, note: 69, gain: 0.6 },
        { atSec: 5.4, durSec: 1.8, note: 62, gain: 0.7 },
        { atSec: 5.4, durSec: 1.8, note: 65, gain: 0.6 },
      ],
    },
    fifths: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 50, gain: 0.7 },
        { atSec: 0, durSec: 7.2, note: 57, gain: 0.6 },
        { atSec: 0, durSec: 7.2, note: 64, gain: 0.6 },
        { atSec: 0.6, durSec: 6.6, note: 71, gain: 0.5 },
      ],
    },
    waltz: {
      notes: [
        { atSec: 0, durSec: 1.3, note: 50, gain: 0.7 },
        { atSec: 0, durSec: 1.4, note: 69, gain: 0.6 },
        { atSec: 0.5, durSec: 0.4, note: 57, gain: 0.4 },
        { atSec: 0.5, durSec: 0.4, note: 65, gain: 0.4 },
        { atSec: 1, durSec: 0.4, note: 57, gain: 0.4 },
        { atSec: 1, durSec: 0.4, note: 65, gain: 0.4 },
        { atSec: 1.5, durSec: 1.3, note: 43, gain: 0.7 },
        { atSec: 1.5, durSec: 0.9, note: 71, gain: 0.6 },
        { atSec: 2, durSec: 0.4, note: 59, gain: 0.4 },
        { atSec: 2, durSec: 0.4, note: 65, gain: 0.4 },
        { atSec: 2.5, durSec: 0.4, note: 59, gain: 0.4 },
        { atSec: 2.5, durSec: 0.5, note: 69, gain: 0.5 },
        { atSec: 3, durSec: 1.3, note: 48, gain: 0.7 },
        { atSec: 3, durSec: 1.4, note: 67, gain: 0.6 },
        { atSec: 3.5, durSec: 0.4, note: 55, gain: 0.4 },
        { atSec: 3.5, durSec: 0.4, note: 64, gain: 0.4 },
        { atSec: 4, durSec: 0.4, note: 55, gain: 0.4 },
        { atSec: 4, durSec: 0.4, note: 64, gain: 0.4 },
        { atSec: 4.5, durSec: 2.2, note: 45, gain: 0.7 },
        { atSec: 4.5, durSec: 2.6, note: 72, gain: 0.6 },
        { atSec: 5, durSec: 0.4, note: 57, gain: 0.4 },
        { atSec: 5, durSec: 0.4, note: 64, gain: 0.4 },
        { atSec: 5.5, durSec: 1.5, note: 57, gain: 0.4 },
        { atSec: 5.5, durSec: 1.5, note: 64, gain: 0.4 },
      ],
    },
  },
  directions: [
    {
      id: 'open-harps',
      name: 'Open harps',
      category: 'plucked',
      rows: `
Window over the weir | Octahedron harp | pluck=.55 edge=2 hardness=.3 decay=30 turn=.05 width=.8 ear=.5 touch=0 shell=0 volume=-1 | hall | rise | Fingers on plain wire, round and open, every note holding its own fourth
Wicks trimmed at six | Octahedron harp | pluck=.2 edge=5 hardness=.6 contact=.3 ear=.5 release=1.5 turn=.03 volume=1 | dotted | answer | Firm fingers near a corner of a knotted edge, a little skin showing
Salt on the sill | Octahedron harp | pluck=.75 edge=6 hardness=.45 wire=.9 sympathy=.1 shell=.1 ear=0 touch=0 turn=.15 volume=-0.5 | bare | rocking | Bare hard steel played near the middle of the sixth edge
Boathouse ladder | Octahedron harp | edge=3 hardness=.5 shell=.9 ear=.8 decay=12 release=.8 sympathy=.05 cornerLoss=.45 touch=.2 volume=-2.5 | wood | contrary | A knotted edge plucked in a deep case and heard from its dark face
Six rungs up | Octahedron harp | true=.9 pluck=.9 edge=4 hardness=.75 ear=.35 turn=.02 release=5 volume=-1.5 | plate | fall | Nearly pure fourths and octaves, plucked hard in the middle of an edge
Tarred rope | Octahedron harp | wire=.05 hardness=.25 pluck=.7 shade=.3 decay=14 release=1 sympathy=0 ear=1 touch=0 shell=.1 | warm | lowline | Soft gut plucked round and dark with nothing ringing along | bass
Peat and iron | Octahedron harp | wire=.2 hardness=.5 pluck=.25 shell=.7 contact=.5 decay=9 width=.2 sympathy=.1 ear=.3 cornerLoss=.38 touch=0 | iron | tenor | Gut pulled nearer a corner, a good deal of finger in a deep case | bass
Barge at the lock | Octahedron harp | wire=.3 edge=4 pluck=.95 hardness=.15 shade=.45 sympathy=.5 release=6 turn=.03 cornerLoss=0 swell=0.3 volume=0.5 | crypt | stone | Low gut played softly mid-edge under a shade, its frame ringing after
Oxen at dusk | Octahedron harp | wire=.1 edge=2 ear=.9 hardness=.4 decay=24 touch=.25 release=2 sympathy=.2 cornerLoss=.5 turn=.02 volume=-0.5 | darkecho | walk | A dull gut string heard from its dark face with a light hand on one corner | bass
Cellar staves | Octahedron harp | wire=.4 pluck=.1 hardness=.35 shade=.25 cornerLoss=.6 decay=7 width=.35 ear=.4 volume=-2 | combo | ground | Half-soft wire plucked at a corner that leaks, brown and quick to go
Frost on the fence | Octahedron harp | pluck=.03 hardness=.75 wire=1 shade=.1 ear=0 decay=20 release=2 turn=.1 volume=1 | sheen | rise | The wiry end of a steel edge, snapped hard and shining
Magpie wire | Octahedron harp | pluck=.06 edge=5 hardness=.8 contact=.6 decay=6 release=.4 sympathy=0 shell=.5 ear=.35 cornerLoss=.3 shade=.16 volume=-3.5 | slap | knock | Short hard snaps close to a corner, half nail and half wire
Needle and thread | Octahedron harp | pluck=.1 edge=3 hardness=.7 wire=.85 true=.2 shade=0 decay=34 release=7 ear=.6 touch=0 shell=0 volume=1.5 | crystals | toll | Thin wire close to a corner, left uneven so its tones beat as they ring
Tin weathercock | Octahedron harp | pluck=.15 hardness=.8 wire=.7 shell=1 edge=6 decay=10 turn=.8 width=1 cornerLoss=.65 volume=-2 | tin | grace | Nails at the thin end of an edge, the case pushed full and turning
Gulls off the wire | Octahedron harp | pluck=.08 edge=2 hardness=.65 sympathy=.6 swell=.12 release=9 shade=.03 ear=0 turn=.13 volume=6 | stars | stars | High wiry plucks with their front rounded off and a halo behind
Slow gates | Octahedron harp | swell=.9 hardness=.75 pluck=.1 release=6 turn=.06 sympathy=.5 ear=.55 touch=0 wire=.9 volume=2.5 | valley | quartal | Steel plucked by its corner that fades up through a second, its onset never heard | pad
Milk light | Octahedron harp | swell=1.6 hardness=.2 wire=.5 shade=.25 ear=.7 decay=34 release=10 touch=0 turn=.11 volume=-0.5 | fog | suspended | Soft wire opening over a second and a half, pale and dark-faced | pad
Curtain drawn back | Octahedron harp | swell=.5 edge=4 hardness=.6 turn=.4 width=1 release=4 shade=.02 cornerLoss=.35 touch=0 shell=.05 volume=0.5 | swirl | lamp | A bright turning wire, open after half a second, no finger heard | pad
Bowl of still water | Octahedron harp | swell=2.8 hardness=.35 true=.95 pluck=.85 decay=40 release=14 turn=.02 sympathy=.8 ear=.45 cornerLoss=0 touch=0 | shadow | fifths | Pure slow wire that takes three seconds to rise and hardly turns | pad
Breath drawn back in | Octahedron harp | swell=.3 hardness=.75 cornerLoss=.5 edge=5 release=3 turn=.2 contact=.6 ear=.1 volume=1.5 | backwards | answer | Hard plucks with their fronts drawn in, leaking at every corner
Three-legged stool | Octahedron harp | solid=Tetrahedron hardness=.45 pluck=.35 decay=18 release=1.5 sympathy=.2 ear=.35 touch=0 shell=.2 volume=1.5 | booth | rocking | A tetrahedron plucked plainly: few tones and wide between
Pyramid of oranges | Octahedron harp | solid=Tetrahedron true=.95 hardness=.6 pluck=.8 edge=3 sympathy=.55 release=6 ear=.5 cornerLoss=.05 touch=0 volume=-3.5 | nave | fall | A tetrahedron bent to pure intervals, round and long
Crooked gable | Octahedron harp | solid=Tetrahedron true=.05 hardness=.7 edge=6 pluck=.2 wire=.8 release=3 decay=26 turn=.015 volume=1 | harmonic | chorale | The uneven tones of a tetrahedron, plucked hard and left beating
Kite in the pines | Octahedron harp | solid=Tetrahedron turn=1.2 width=1 hardness=.5 ear=.4 decay=22 wire=.75 volume=1 | circle | rise | A tetrahedron spinning past the ears at more than one turn a second
Pocket sundial | Octahedron harp | solid=Tetrahedron hardness=.3 contact=.45 wire=.3 shell=.8 decay=5 release=.3 sympathy=0 turn=.02 ear=.35 cornerLoss=.4 volume=4 | mike | knock | Small, half-gut plucks in a full case, over almost at once
Ice house door | Octahedron harp | solid=Cube hardness=.55 pluck=.45 edge=2 true=.6 decay=20 release=4 ear=.55 turn=.12 | chamber | contrary | A cube plucked by fingers, hollow and nearly alone with its first tone
Chest of drawers | Octahedron harp | solid=Cube hardness=.8 edge=5 pluck=.12 true=.1 shell=.75 decay=12 release=1.2 ear=0 cornerLoss=.38 volume=-1.5 | reel | grace | A cube snapped near a corner in a full case, crooked and wooden
Greenhouse at noon | Octahedron harp | solid=Prism hardness=.4 pluck=.6 edge=4 wire=.8 shade=0 turn=.15 release=3 cornerLoss=.1 touch=0 shell=.15 volume=5 | flock | fall | A prism in clear steel, plucked lightly along the middle
Oar and rowlock | Octahedron harp | solid=Prism hardness=.6 pluck=.25 true=.2 contact=.4 decay=9 wire=.45 sympathy=.1 ear=.4 cornerLoss=.65 volume=0.5 | worn | rocking | Uneven half-soft prism wire with the pull of the finger in it
Balcony of reeds | Octahedron harp | solid=Cube swell=.2 hardness=.65 edge=6 ear=.55 turn=.5 width=.9 release=5 sympathy=.6 cornerLoss=.55 volume=1 | drift | sixths | A cube whose plucks come up softly and turn every two seconds
Sieve of rivers | Octahedron harp | cornerLoss=1 hardness=.5 pluck=.5 edge=2 decay=30 release=5 ear=.05 touch=0 shell=.15 volume=-1 | plate 1.mix=0.2 | rise | Corners that leak everything, so only the tones on the loops are left
Hollow in the hedge | Octahedron harp | cornerLoss=.75 hardness=.3 pluck=.85 edge=3 wire=.7 sympathy=.4 turn=.3 ear=.4 volume=2 | room | sixths | Round plucks that lose their corners fast and go on as a loop
Dew pond | Octahedron harp | cornerLoss=.9 hardness=.65 wire=.9 edge=6 decay=40 release=12 shade=.04 touch=0 shell=.1 turn=.18 volume=1.5 | glimmer | toll | Bright leaking wire, a spark and then one long bare loop
Mill race | Octahedron harp | cornerLoss=.6 hardness=.75 contact=.35 decay=8 turn=.6 edge=4 release=.7 sympathy=0 touch=0 volume=1.5 | heads | rocking | Hard quick plucks with leaking corners, turning as they go
Net mender | Octahedron harp | cornerLoss=.85 hardness=.45 touch=.3 pluck=.3 shell=.6 decay=16 release=2 ear=.45 volume=-2 | embers | answer | One corner touched and the others leaking: little but the loops
Bells under the bay | Octahedron harp | sympathy=1 hardness=.35 release=14 decay=36 shade=.1 turn=.04 ear=.3 solid=Cube true=.2 wire=.85 edge=4 volume=5 | cave | toll | A quiet pluck on a steel cube, and the wires of the keys before it standing up behind
Company of strings | Octahedron harp | sympathy=.85 hardness=.5 wire=.8 edge=5 release=8 contact=.05 width=1 ear=0 touch=0 shell=.05 | glasshalo | chorale | The halo of the frame as loud as the pluck, steel and wide
Aunt in the attic | Octahedron harp | sympathy=.7 hardness=.25 wire=.35 shell=.8 decay=18 release=6 ear=.7 cornerLoss=.05 touch=0 volume=2 | parlour | hymn | Soft darkened wire in a full case, its frame humming along
Row of open doors | Octahedron harp | sympathy=.9 solid=Tetrahedron hardness=.7 pluck=.15 release=16 turn=.12 ear=.3 touch=0 wire=.9 volume=-1 | fifths | quartal | A steel tetrahedron whose own wires ring on as fifths after each key
Echo of the quay | Octahedron harp | sympathy=1 hardness=.7 pluck=.15 decay=4 release=10 edge=3 contact=.2 ear=.35 cornerLoss=0 volume=1 | tide | grace | Short hard plucks gone at once, their halo left standing
Carousel in March | Octahedron harp | turn=1 width=1 hardness=.7 ear=.3 edge=5 release=2.5 wire=.35 pluck=.15 volume=2.5 | pendulum | waltz | A half-gut octahedron going round once a second, pulled near its corner
Sequin lamp | Octahedron harp | turn=2 width=.8 hardness=.65 wire=.85 shade=0 pluck=.3 decay=16 cornerLoss=.45 shell=0 volume=0 | twinkle | rise | Two turns a second on bright wire, every chord glittering
Fairground put away | Octahedron harp | turn=.3 width=1 hardness=.4 ear=.6 pluck=.7 edge=4 decay=34 release=7 sympathy=.5 cornerLoss=.4 touch=0 shell=0 volume=-2 | bloom | fall | Round plucks that swing from bright to dark three times in ten seconds
Whirligig | Octahedron harp | turn=1.5 solid=Prism hardness=.55 contact=.25 decay=7 release=.6 sympathy=0 wire=.7 cornerLoss=.5 touch=.25 volume=0.5 | shells | knock | A prism spinning fast under short plucks
Barn owl turning | Octahedron harp | turn=.6 width=.9 hardness=.25 wire=.25 shade=.35 edge=5 release=4 cornerLoss=.65 volume=3.5 | stairwell | answer | Dull gut turning a little over once in two seconds
Folded linen | Octahedron harp | decay=3 release=.25 hardness=.4 contact=.4 wire=.45 sympathy=0 shell=.6 pluck=.3 touch=0 ear=.4 volume=-1.5 | felt | contrary | A small dry pluck like a lute, gone three seconds after the finger
Crumbs for sparrows | Octahedron harp | decay=.9 release=.2 hardness=.6 pluck=.2 contact=.12 edge=2 sympathy=.3 shade=0 ear=.55 touch=0 volume=1 | marbles | rocking | Plucks under a second long, crisp and small
Walnut shell | Octahedron harp | decay=2 release=.15 hardness=.3 wire=.15 shell=1 pluck=.8 shade=.2 sympathy=0 cornerLoss=.45 touch=.28 volume=0 | pot | knock | Gut in the fullest case, round and stopped quickly
Copper saucepan | Octahedron harp | decay=4 release=.5 hardness=.8 edge=6 shell=.85 true=.15 wire=.65 contact=.2 sympathy=.15 ear=0 cornerLoss=.38 touch=0 volume=0.5 | canon | grace | Hard and uneven, a bright knock of wire with a case round it
Ink drying | Octahedron harp | decay=6 release=.4 hardness=.2 pluck=.95 wire=.6 shade=.15 turn=.02 sympathy=.05 contact=.05 ear=.5 cornerLoss=.1 swell=0.16 volume=0.5 | nextdoor | sixths | Soft plucks mid-edge, plain and still, dying in a few seconds
`,
    },
    {
      id: 'handmade-bells',
      name: 'Handmade bells',
      category: 'bell',
      rows: `
Bell of the last house | Cube bells | edge=5 pluck=.3 hardness=.6 true=.1 sympathy=.2 release=16 ear=.4 shell=.2 turn=.18 volume=-1 | nave 1.mix=0.22 | toll | A hammer on a cube of steel, its tones uneven and slow to part
Foundry apprentice | Cube bells | hardness=1 edge=1 contact=.5 decay=18 shell=.8 release=6 sympathy=.05 ear=.05 touch=0 volume=0 | strikes | answer | A cube struck as hard as it goes, the knock of the head left in
Whitewashed tower | Cube bells | true=.35 hardness=.5 edge=2 pluck=.6 shade=.15 decay=40 release=20 turn=.02 touch=0 volume=0.5 | valley | toll | Half-tuned cube struck in the middle of an edge, long and nearly still
Bell for the goats | Cube bells | decay=6 release=1.5 hardness=.7 edge=6 pluck=.2 ear=.9 wire=.55 sympathy=.1 cornerLoss=.4 volume=2.5 | outdoors | knock | A cube heard from its dark face, clanking and soon quiet
Cracked and kept | Cube bells | true=0 edge=4 hardness=.9 shell=.95 cornerLoss=.5 decay=14 release=4 turn=.25 ear=.1 volume=2 | crumbs | grace | A cube as if cracked, in a nearly full case, its corners leaking
Tongs and sugar lumps | Cube bells | decay=1.6 release=.5 hardness=.85 pluck=.05 contact=.15 sympathy=0 wire=1 ear=.1 volume=-2.5 | bare | grace | Tiny bright taps on a cube, over in a second and a half
Jug of cracked ice | Cube bells | solid=Prism decay=4 release=1 hardness=.5 pluck=.4 true=.4 shade=.14 sympathy=.1 turn=.4 cornerLoss=.3 touch=0 shell=.15 wire=.65 volume=2.5 | marbles 1.mix=0.22 | stars | A prism tapped crisply, clear and short, turning a little
Pin in the hinge | Cube bells | solid=Octahedron decay=6 release=.6 hardness=.7 pluck=0 edge=2 true=.5 wire=.7 sympathy=.15 cornerLoss=.2 touch=.1 shell=0 shade=.14 volume=-3.5 | jar | rocking | The very end of an edge struck firmly, a bright pin of sound
Thimble on the rail | Cube bells | solid=Tetrahedron decay=2 release=.4 hardness=.5 contact=.6 shell=.7 sympathy=0 edge=5 ear=0 cornerLoss=.38 shade=.15 volume=1 | spring | knock | Small tetrahedron taps with more knock than note
Cat's collar | Cube bells | solid=Web decay=4 release=1.2 hardness=.55 contact=.1 pluck=.15 turn=1.1 width=1 sympathy=.1 cornerLoss=.4 shade=.15 volume=-2.5 | pan | rocking | A web struck near a corner, jingling as it spins
Fog station | Far bells | decay=30 release=10 hardness=.2 edge=3 pluck=.7 sympathy=.5 shade=.55 ear=.85 touch=0 volume=3 | fog | toll | A soft hammer on a tetrahedron behind a heavy shade
Over two valleys | Far bells | true=.6 hardness=.45 shade=.3 sympathy=.4 edge=2 ear=.6 turn=.03 cornerLoss=0 touch=0 | far 1.mix=0.4 | fall | Tetrahedron bells bent halfway to pure, dark-faced and slow
Anchor at evening | Far bells | edge=5 pluck=.9 hardness=.15 wire=.3 shade=.5 release=8 decay=20 sympathy=.2 cornerLoss=.5 turn=.03 | undertow | ground | A gut tetrahedron struck softly in the middle of a knotted edge | bass
Pilgrim's staff | Far bells | hardness=.6 shade=.2 sympathy=1 contact=.35 release=12 true=.9 turn=.15 ear=.45 cornerLoss=0 touch=0 | strings | hymn | Nearly pure tetrahedron bells with every wire of the frame answering
Moth at the glass | Far bells | swell=.35 hardness=.35 shade=.35 sympathy=.7 turn=.5 edge=4 release=6 volume=0.5 | glimmer | hymn | Tetrahedron bells with their strike drawn in to a third of a second
Gong in the reeds | Cube bells | solid=Web hardness=.35 pluck=.7 shade=.35 decay=24 wire=.5 sympathy=.25 edge=2 contact=.1 ear=.75 turn=.13 volume=-2.5 | floor | stone | A web struck softly and low, a dark gong heard close to
Temple drainpipe | Cube bells | solid=Web hardness=.55 edge=4 cornerLoss=.55 shell=.6 decay=12 release=3 sympathy=.1 ear=.05 touch=0 | tunnel | ground | A leaking web struck low, its corners gone before its loops
Bronze door pulled to | Cube bells | solid=Web hardness=.45 true=.5 pluck=.9 shade=.5 decay=34 release=14 sympathy=.6 cornerLoss=.1 touch=0 turn=.15 volume=3 | crypt | tenor | A dark web half tuned, struck mid-edge over its own long halo | bass
Neglected gong | Cube bells | solid=Web hardness=.65 contact=.2 wire=.35 edge=6 shell=.9 decay=8 release=2 turn=.6 sympathy=0 cornerLoss=.45 volume=-0.5 | buzz | ground | A dull web in a deep case, struck hard and turning
Wide copper pan | Cube bells | solid=Web hardness=.3 swell=.15 width=1 turn=.12 edge=5 sympathy=.4 release=9 shade=.28 ear=.35 cornerLoss=.35 volume=5.5 | cavern | toll | A web struck softly with its front rounded, as wide as it goes
Chandelier lowered | Cube bells | solid=Prism hardness=.6 true=.2 edge=2 pluck=.25 decay=26 release=9 turn=.2 sympathy=.35 ear=0 volume=4.5 | shards | fall | A prism of uneven steel struck brightly, turning as it comes down
Paperweight | Cube bells | solid=Prism hardness=.4 true=.75 edge=1 pluck=.8 shade=.1 decay=20 release=5 sympathy=.2 wire=.65 ear=.35 cornerLoss=0 touch=0 turn=.12 volume=2 | plate | sixths | A prism near its pure intervals, round and weighted
Colours on the floor | Cube bells | solid=Prism hardness=.5 true=.5 edge=5 ear=.7 turn=.7 width=1 release=6 decay=16 cornerLoss=.65 touch=0 shade=.15 volume=0 | fan | rise | A prism turning quickly past the ears under a firm hammer
Stair of spoons | Cube bells | solid=Prism hardness=.8 true=0 edge=6 decay=7 release=1.5 contact=.12 sympathy=0 shell=.5 ear=.35 cornerLoss=.38 volume=2.5 | stone | rocking | A prism left quite untuned, clattering and short
Half a rainbow | Cube bells | solid=Prism hardness=.5 swell=.6 true=.6 release=14 sympathy=.8 turn=.08 edge=4 shade=.06 ear=0 volume=2.5 | shimmer | hymn | A prism struck behind a slow front, with a halo that outlives it | pad
Half past harvest | Cube bells | solid=Octahedron true=.85 hardness=.55 edge=3 decay=22 release=7 sympathy=.3 pluck=.5 wire=.7 ear=.3 touch=0 volume=2 | room | toll | Octahedron bells close to pure, each with a fourth inside it
Ferry bell, low tide | Cube bells | solid=Octahedron true=.4 hardness=.6 edge=4 shell=.75 decay=30 release=12 turn=.05 pluck=.2 ear=0 touch=0 shade=.14 volume=0.5 | slowhall | answer | A struck octahedron half tuned, its deep case ringing long
Change of the watch | Cube bells | solid=Octahedron true=.15 hardness=.7 edge=6 decay=16 release=4 contact=.4 sympathy=.1 ear=.5 cornerLoss=.4 shade=.14 volume=-0.5 | darkecho | fall | An untuned octahedron hit hard, more clang than note
Doorbell on a thread | Cube bells | solid=Octahedron true=1 hardness=.35 edge=2 decay=9 release=2 shade=.2 wire=.5 sympathy=.05 pluck=.7 ear=.35 cornerLoss=.5 touch=0 volume=-1.5 | pillow | knock | A soft hammer on a fully tuned octahedron, small and mild
Evening bell, unseen | Cube bells | solid=Octahedron true=.7 hardness=.45 sympathy=1 release=18 decay=38 shade=.3 turn=.1 edge=5 ear=.65 cornerLoss=.05 volume=2.5 | bowls | toll | Dark octahedron bells with the halo of the frame before them
Porcelain row | Ring koto | exciter=Hammer hardness=.5 decay=6 release=2 wire=.85 shade=.18 shell=.2 pluck=.2 ear=.05 solid=Tetrahedron true=.9 volume=1.5 | sheen | rocking | A tetrahedron struck by a small hammer, short and near to pure | keys
Snowdrop steps | Ring koto | exciter=Hammer hardness=.35 decay=20 release=5 wire=.7 pluck=.8 sympathy=.5 edge=4 true=1 ear=.4 cornerLoss=.1 shade=.24 volume=4 | glasshalo | stars | A ring hit softly mid-edge, pure and hollow
Nursery at six | Ring koto | exciter=Hammer hardness=.5 decay=5 release=.6 pluck=.5 edge=2 wire=.6 shell=.7 sympathy=0 cornerLoss=.55 solid=Cube volume=-0.5 | parlour | grace | A small struck cube, short, in a full case | keys
Ship's glasses | Ring koto | exciter=Hammer hardness=.55 true=.1 decay=30 release=10 edge=6 wire=.8 sympathy=.3 shade=.18 turn=.3 volume=4 | shifted | toll | A struck ring left untuned, its octaves beating as it rings
Ring on a string | Ring koto | exciter=Hammer hardness=.45 cornerLoss=.5 decay=26 edge=3 ear=.6 release=6 turn=.15 contact=.1 volume=0.5 | trail | chorale | A ring struck once, leaking as it rings, heard from its dark side
Singing rim | Cube bells | exciter=Bow hardness=.5 swell=.4 release=8 sympathy=.5 edge=2 contact=.2 true=.2 ear=.1 turn=.11 | lifted | suspended | A bow drawn on a bell of a cube until it sings | pad
Wet finger, thin glass | Cube bells | exciter=Bow hardness=.25 swell=.8 release=4 edge=4 contact=.4 true=.6 turn=.15 shade=0 ear=0 touch=0 shell=.2 volume=1.5 | vibrato | line | A soft bow on a cube's edge, high and glassy with a rasp on it | string
Bell drawn by a thread | Cube bells | exciter=Bow solid=Web hardness=.5 swell=1.2 release=10 contact=.1 pluck=.5 turn=.3 sympathy=.3 cornerLoss=.05 touch=0 shade=.18 volume=3.5 | swirl | single | A web bowed slowly until its tones come up one by one | texture
Organ of bottles | Cube bells | exciter=Breath hardness=.35 swell=.2 release=2 contact=.3 shell=.8 edge=1 shade=.15 true=.4 ear=.45 turn=.015 volume=-2.5 | pipes | hymn | A breath over a cube in a deep case, hollow as bottles | organ
Bell heard in sleep | Cube bells | exciter=Breath solid=Tetrahedron hardness=.5 swell=.7 release=12 sympathy=.9 contact=.15 shade=.3 true=.3 ear=.95 cornerLoss=.1 turn=.02 | halved | quartal | A breath through a tetrahedron that never quite strikes | pad
One loop round | Loops alone | hardness=.2 edge=2 decay=30 release=12 turn=.1 pluck=.7 contact=0 ear=.55 touch=0 shade=.25 volume=1 | tile | chorale | Only the loops of an octahedron, struck and left, its corners let go
Cartwheel hub | Loops alone | solid=Cube hardness=.6 cornerLoss=.6 edge=1 decay=12 release=2 shell=.8 shade=.3 volume=0.5 | gated | knock | Loops of a cube in a deep case, struck hard and short
Garland over the gate | Loops alone | solid=Prism hardness=.5 turn=1 width=1 cornerLoss=1 edge=5 sympathy=.5 shade=.03 volume=1.5 | twinkle | chorale | Loops of a prism once round every second, all corners leaking
Wreath on the door | Loops alone | solid=Tetrahedron hardness=.25 cornerLoss=.9 edge=6 pluck=.9 shade=.35 turn=.05 release=9 ear=.6 touch=0 volume=1 | wax | chorale | Soft loops of a tetrahedron under a shade, round and dim
Loop of thrown rope | Loops alone | solid=Web hardness=.7 cornerLoss=.7 edge=3 decay=18 turn=.8 contact=.3 sympathy=0 release=3 volume=-0.5 | orbit | grace | Loops of a web, struck and swinging from bright to dark
Night clerk | Cube bells | touch=.35 decay=8 release=1 hardness=.6 edge=2 contact=.2 sympathy=.1 ear=.35 | console | knock | A struck cube with one corner held, a bell told to hush | keys
Latch and bell | Cube bells | solid=Octahedron touch=.6 hardness=.6 decay=12 release=.8 edge=5 true=.5 contact=.35 sympathy=.4 shell=.7 ear=.05 shade=.18 volume=1 | booth | answer | One corner held hard: a knock, a short bell and some halo
Glove over bronze | Cube bells | solid=Web touch=.3 hardness=.25 decay=10 release=1.5 shade=.4 pluck=.8 sympathy=.2 edge=4 cornerLoss=.65 volume=-2 | darkbox | ground | A web struck softly low with one corner covered
Toy from the fair | Cube bells | solid=Prism touch=.3 hardness=.6 decay=9 release=1.6 true=.1 pluck=.2 sympathy=0 edge=3 contact=.15 ear=.4 cornerLoss=.2 shell=.05 shade=.3 volume=-1 | smaller | grace | A prism tapped firmly near a held corner, pinched and small
Hush of the belfry | Cube bells | solid=Tetrahedron touch=.5 hardness=.4 decay=26 release=8 sympathy=.8 shade=.2 true=.7 edge=2 ear=.5 cornerLoss=0 volume=0 | monks | hymn | A touched tetrahedron, its note damped and its halo let ring
`,
    },
    {
      id: 'turning-pads',
      name: 'Turning pads',
      category: 'pad',
      rows: `
Hour before the ferry | Turning pad | turn=.05 swell=2.4 hardness=.35 edge=2 ear=.5 release=8 shade=.15 touch=0 volume=-1 | hall | lamp | A bowed octahedron that comes up over two seconds and turns very slowly
Dome of the station | Turning pad | turn=.2 hardness=.55 pluck=.7 true=.9 shell=.7 release=3 sympathy=.3 ear=.35 cornerLoss=.05 touch=0 volume=1 | ensemble | suspended | Bowed nearly pure in a deep case, turning once in five seconds
Shuttle and beam | Turning pad | swell=.5 turn=.7 edge=5 hardness=.4 contact=.45 width=1 release=2.5 touch=0 volume=4.5 | harmonic | chorale | A bow with its hair left in, turning quickly from face to face | string
Linen on the line | Turning pad | swell=3.5 hardness=.15 ear=.8 shade=.3 decay=24 release=12 turn=.12 cornerLoss=.6 touch=0 volume=0.5 | fog | fifths | A soft bow on the dark face of the octahedron, long in coming
Courtyard at eleven | Turning pad | hardness=.7 edge=3 pluck=.2 shade=.02 true=.3 swell=1 release=4 turn=.1 ear=.1 cornerLoss=0 shell=.1 volume=-1.5 | airy | quartal | A firm bright bow with the tones left a little uneven, beating
Prism on the landing | Turning pad | solid=Prism hardness=.3 swell=1.8 turn=.15 edge=2 release=6 true=.7 ear=.45 touch=0 volume=-2 | plate | hymn | A softly bowed prism, tuned most of the way and slow to turn
Stained cloth | Turning pad | solid=Prism hardness=.6 true=.1 swell=.8 ear=.6 sympathy=.2 release=3 shell=.8 touch=0 volume=2.5 | swirl | sixths | A prism bowed hard in a full case with its intervals left crooked
Snow light inside | Turning pad | solid=Prism hardness=.2 shade=0 edge=4 wire=.9 swell=2.8 contact=.05 release=9 turn=.04 cornerLoss=.4 touch=0 shell=0 | shimmer | suspended | Pale steel prism, bowed so softly that little but the note is there
Keeper's round | Turning pad | solid=Prism turn=.5 width=1 edge=6 pluck=.15 hardness=.5 swell=1.2 release=4 touch=0 volume=1.5 | pendulum | lamp | A bowed prism sweeping past the ears once in two seconds
Green bottle window | Turning pad | solid=Prism cornerLoss=.8 hardness=.45 swell=2 shade=.25 sympathy=.6 release=10 decay=30 volume=-2 | currents | tenths | Only the loops of a prism under the bow, dim and soft-edged
Tangle of wool | Turning pad | solid=Web hardness=.5 swell=1.2 shade=.3 turn=.7 release=7 true=.8 edge=5 ear=.7 touch=0 volume=-1.5 | warm | quartal | A web under an even bow, tuned nearly pure, shaded and turning
Sea mist rolling in | Turning pad | solid=Web hardness=.5 true=.2 swell=3.2 width=1 sympathy=.5 edge=5 release=10 contact=.3 cornerLoss=0 touch=0 volume=-0.5 | blur | stone | Uneven web tones that rise together over three seconds
Hornets in the eaves | Turning pad | solid=Web hardness=.6 true=0 swell=.6 pluck=.2 turn=.4 release=2 shade=.22 sympathy=.1 touch=.22 volume=0 | stream | chorale | A web bowed hard and untuned, a close humming cluster
Silver filings | Turning pad | solid=Web hardness=.4 cornerLoss=.6 wire=1 shade=0 turn=.9 swell=1.5 release=5 edge=6 touch=0 shell=.2 volume=-0.5 | glimmer | suspended | Steel web with leaking corners, turning fast and lightly
Bread oven, banked | Turning pad | solid=Web wire=.1 hardness=.35 shell=.9 shade=.4 swell=1.4 release=4 edge=3 decay=8 volume=1.5 | monks | hymn | A web of gut in a full case, bowed dark and quick to settle
Well with stars in it | Turning pad | solid=Cube hardness=.25 swell=2.6 edge=2 release=8 true=.8 turn=.06 shade=.05 ear=.4 touch=0 volume=-1.5 | choirhall | lamp | A cube bowed softly, hollow and close to one tone
Empty aquarium | Turning pad | solid=Cube hardness=.5 edge=5 true=.2 swell=1.2 width=1 turn=.25 sympathy=.2 release=5 ear=.5 cornerLoss=.1 touch=0 volume=0.5 | diver | sixths | A cube of uneven tones bowed evenly, wide and turning
Tall white cupboard | Turning pad | solid=Cube hardness=.65 shell=1 pluck=.1 swell=.7 ear=.3 release=2 sympathy=0 contact=.1 cornerLoss=.5 touch=.25 | thick | chorale | A cube bowed near a corner in the fullest case, close and boxed
Marble hallway | Turning pad | solid=Cube hardness=.35 sympathy=1 swell=3.8 release=15 turn=.01 edge=4 decay=34 ear=.3 touch=0 volume=-11.5 | open | fifths | A cube bowed so slowly that its halo arrives with it
Drum of the cistern | Turning pad | solid=Ring exciter=Breath hardness=.4 swell=1 shade=.35 edge=6 release=4 shell=.75 contact=.5 cornerLoss=.6 volume=0.5 | cavern | stone | A breath through a shaded ring, as much air as tone
Field of barley | Turning pad | exciter=Breath hardness=.3 contact=.55 swell=1.6 turn=.3 width=1 release=5 sympathy=.2 touch=0 volume=-0.5 | wind | tenths | A breath through the octahedron, airy and leaning from side to side
Tall grass, late | Turning pad | exciter=Breath hardness=.75 contact=.25 edge=3 true=.8 swell=2.2 shade=.2 release=8 decay=26 cornerLoss=.1 touch=0 pluck=.12 wire=.85 volume=-1 | drift | lamp | A clear breath led by its open intervals
Sleeper in the top bunk | Turning pad | exciter=Breath hardness=.15 contact=.7 shade=.45 swell=1.1 release=3 turn=.04 ear=.6 sympathy=.1 touch=0 volume=0 | breathing | tenths | Low soft breath on a shaded wire, close to a sigh | voice
Weathervane choir | Turning pad | exciter=Breath solid=Prism hardness=.6 shell=.9 swell=1.8 turn=.4 edge=2 release=6 wire=.8 cornerLoss=.4 touch=0 | vowel | suspended | A hard breath through a prism in a full case, turning steadily | voice
Kettle on low | Turning pad | exciter=Breath solid=Web hardness=.7 contact=.4 true=.1 swell=2.8 release=7 cornerLoss=.5 edge=4 volume=1 | scatter | quartal | Untuned web blown hard, its corners letting steam out
Corner after corner | Slow corners | swell=1.4 turn=.45 edge=2 hardness=.7 release=5 sympathy=.4 touch=0 wire=.95 pluck=.1 shell=.6 volume=-2.5 | tide | suspended | A bright tetrahedron plucked by its corner with the onset hidden, turning as it swells
Evening shutters | Slow corners | swell=3 edge=4 shade=.3 hardness=.6 release=12 true=.8 wire=.5 ear=.55 touch=0 | rising | lamp | A tetrahedron fading up for three seconds behind a shade
Arcade in a downpour | Slow corners | solid=Cube swell=2 hardness=.7 edge=6 turn=.6 width=1 shade=0 release=6 cornerLoss=.05 touch=0 | rain | rise | A cube plucked behind a slow front, hard and turning
Banked snow | Slow corners | solid=Octahedron swell=5 hardness=.3 decay=40 release=16 true=.95 turn=.01 ear=0 touch=0 | frost | fifths | An octahedron that takes almost five seconds to be there at all
Steam off the yard | Slow corners | solid=Web swell=1 hardness=.4 cornerLoss=.4 edge=5 release=3 sympathy=.2 turn=.2 ear=.1 shell=.05 volume=1.5 | stretched | tenths | A plucked web that blooms over a second and starts to thin at once
Harbour with no moon | Turning pad | shade=.65 hardness=.5 swell=2 edge=3 release=7 turn=.08 sympathy=.4 ear=.95 touch=0 volume=1 | padbehind | stone | A bowed octahedron so shaded that only its lower tones pass
Coal barge sleeping | Turning pad | solid=Tetrahedron shade=.75 hardness=.65 swell=1.5 wire=.3 release=4 width=.4 ear=.7 cornerLoss=.5 touch=0 | iron | ground | A dark tetrahedron under a firm bow, narrow and heavy
Cloakroom curtain | Turning pad | solid=Ring shade=.5 hardness=.35 swell=2.2 wire=.4 shell=.6 release=5 turn=.15 cornerLoss=0 touch=0 volume=-2 | chorale | lamp | A ring bowed evenly in plain harmonics under a cloth
Mole's afternoon | Turning pad | solid=Prism shade=.95 hardness=.8 swell=1 edge=5 release=3 sympathy=0 pluck=.6 cornerLoss=.35 touch=0 | floor | tenths | A prism bowed hard under nearly the whole shade
Under the pier at noon | Turning pad | solid=Cube shade=.55 exciter=Breath hardness=.7 contact=.35 swell=1.8 release=6 turn=.5 width=1 volume=-1 | notch | lamp | A dark cube blown hard, its tones crossing as it turns
Brass at sunrise | Turning pad | hardness=.95 shade=0 wire=.9 swell=1.6 shell=.4 edge=2 release=3.5 turn=.1 sympathy=.2 ear=.35 touch=0 | triode | suspended | A bow pressed as hard as it goes on bright steel
Sunlit scaffolding | Turning pad | solid=Tetrahedron hardness=.85 pluck=.08 wire=1 shade=.02 swell=.9 ear=.1 release=5 cornerLoss=.05 touch=0 volume=0 | sheen | quartal | A tetrahedron bowed at the corner, all its upper tones out
Procession of mirrors | Turning pad | solid=Ring hardness=.9 pluck=.3 true=.6 swell=2.2 turn=.35 edge=4 release=6 width=1 cornerLoss=.05 touch=0 volume=-1 | flock | lamp | A ring under a hard bow, a full row of harmonics turning
Copper beech | Turning pad | solid=Octahedron hardness=.8 wire=.35 shell=.85 swell=1.2 edge=6 release=4 contact=.35 touch=0 volume=0.5 | reel | chorale | A hard bow on half-soft wire in a full case, reddish and grained | string
Hundred windows | Turning pad | solid=Prism hardness=1 true=.8 shade=.04 swell=3 sympathy=.7 release=12 edge=3 cornerLoss=.05 volume=0.5 | fifths | fifths | A prism bowed hard and tuned, its wires ringing along
Swifts round the eaves | Turning pad | turn=2 width=1 hardness=.45 swell=.9 edge=2 release=3 sympathy=.1 touch=0 | short | lamp | A bowed octahedron at two turns a second, glittering in place
Moths in procession | Turning pad | solid=Prism turn=1.4 width=.8 hardness=.6 swell=1.6 shade=.1 edge=5 release=5 cornerLoss=.6 touch=0 volume=2 | cloudphase | tenths | A prism flickering past the ears under the bow
Spun sugar | Turning pad | solid=Tetrahedron turn=1.7 wire=1 shade=0 hardness=.3 swell=2.4 release=9 pluck=.1 touch=0 | sparks | suspended | Thin steel tetrahedron in a fast fine spin
Roundabout in fog | Turning pad | exciter=Breath turn=1 width=1 contact=.5 hardness=.45 swell=1.3 shade=.3 release=4 edge=4 cornerLoss=.4 touch=0 shell=0 volume=1 | outdoors | quartal | A breath going round once a second behind a thin shade
Reel of wire | Turning pad | solid=Ring turn=1.2 hardness=.7 swell=.5 edge=3 true=.2 release=1.5 width=.9 sympathy=0 volume=-1.5 | spinning | sixths | A bowed ring of beating octaves, round faster than once a second | string
Halo over the roof | Turning pad | sympathy=1 hardness=.2 swell=2 release=18 decay=40 edge=3 turn=.1 ear=.55 touch=0 solid=Prism | strings | hymn | A faint bow on a prism and then the whole frame ringing behind it
Congregation of one | Turning pad | sympathy=.9 exciter=Breath hardness=.35 swell=.8 release=14 contact=.2 shell=.7 touch=0 | keysheld | suspended | A breath in a deep case, outlived by the wires it wakes
Return of the geese | Turning pad | solid=Tetrahedron sympathy=.8 hardness=.55 swell=1.2 release=10 turn=.45 width=1 edge=6 cornerLoss=.35 touch=0 | ascent | lamp | A turning tetrahedron whose halo trails far behind it
Window that stays lit | Turning pad | solid=Cube exciter=Finger sympathy=1 swell=1.5 hardness=.5 release=20 decay=36 edge=4 touch=0 volume=-11 | held | fifths | A cube fading up into a halo that stays when it has gone
Lake with two moons | Turning pad | solid=Octahedron exciter=Hammer sympathy=.85 swell=2.8 hardness=.6 release=16 true=1 turn=.06 ear=.3 cornerLoss=0 volume=3 | winter | quartal | Pure struck wire without its strike, half of it halo
`,
    },
    {
      id: 'rings',
      name: 'Rings, plucked and bowed',
      category: 'string',
      rows: `
Persimmon tree | Ring koto | decay=12 pluck=.12 hardness=.75 edge=2 shade=.05 release=2 ear=.35 wire=.8 shell=.75 contact=.3 volume=2.5 | room | fall | A ring plucked firmly by a corner, steely and quick in a full case | plucked
Mats in the sun | Ring koto | pluck=.5 hardness=.3 true=1 shell=.3 decay=18 release=.8 wire=.4 ear=.4 cornerLoss=.1 volume=4 | bed | rocking | A soft ring plucked midway, pure and quickly let go | plucked
Third step of the gate | Ring koto | edge=4 hardness=.6 contact=.35 wire=.65 decay=30 release=3 sympathy=.1 ear=.5 turn=.02 volume=4 | stone | answer | A knotted edge of the ring with some nail on it, left to ring | plucked
Raked gravel | Ring koto | edge=6 pluck=.1 hardness=.45 shade=0 wire=.75 release=2.5 turn=.2 ear=.05 volume=4 | heads | grace | Thin ring wire close to a corner, turning a little as it rings | plucked
Sliding paper door | Ring koto | shell=.9 hardness=.2 pluck=.7 decay=10 release=.5 contact=.4 shade=.3 ear=.7 cornerLoss=.5 volume=3 | felt | contrary | Soft plucks of a ring in a full wooden case, closed quickly | plucked
Gut on a gourd | Ring koto | wire=.1 hardness=.35 shell=.85 decay=8 release=.5 sympathy=0 pluck=.6 ear=.75 volume=2 | pot | knock | A ring of gut in a round case, dark and quick | plucked
Catgut evening | Ring koto | wire=.2 pluck=.85 edge=3 hardness=.5 decay=28 release=4 shade=.3 turn=.04 ear=1 volume=2 | trail | lowline | Half-dark gut plucked mid-edge, heard long after | plucked
Shepherd's pouch | Ring koto | wire=.05 hardness=.7 contact=.6 decay=5 release=.3 edge=5 shell=.6 width=.3 cornerLoss=.55 volume=-4.5 | grit | walk | Dull gut pulled hard, as much skin as tone, narrow and low | bass
Bent willow | Ring koto | wire=.3 true=.2 swell=.15 hardness=.4 release=3 turn=.5 edge=2 decay=22 cornerLoss=.65 volume=3.5 | worn | line | Uneven gut with a soft front, swaying as it turns | plucked
Smokehouse beam | Ring koto | wire=.15 hardness=.25 shade=.5 pluck=.95 decay=14 ear=.9 sympathy=.4 release=5 cornerLoss=.45 volume=3 | darkbox | hymn | The darkest face of a gut ring, plucked softly mid-edge | plucked
Cold tap at dawn | Ring koto | wire=1 pluck=.12 hardness=.4 shade=.34 shell=.3 decay=36 release=5 ear=0 turn=.03 volume=5.5 | overtones | toll | Steel ring plucked by a corner, thin and close | plucked
Freewheel downhill | Ring koto | wire=.9 hardness=.6 turn=1.3 width=1 edge=3 pluck=.3 decay=20 shade=.12 volume=0.5 | pan 1.depth=0.5 | rocking | Bright spinning ring, its harmonics flicking by | plucked
Wire to the coastguard | Ring koto | wire=.95 hardness=.6 true=0 edge=6 sympathy=.7 release=10 decay=40 shade=.1 volume=6 | valley | rise | A long steel ring left uneven, its frame answering | plucked
Sparks off the tram | Ring koto | wire=.8 hardness=.45 contact=.25 decay=6 release=.6 pluck=.4 sympathy=0 shade=.2 ear=.4 cornerLoss=.2 true=.1 turn=1.4 edge=5 exciter=Hammer volume=-0.5 | spring | grace | A steel ring tapped and spun, uneven and gone in six seconds | bell
Barbed and shining | Ring koto | wire=.85 cornerLoss=.42 hardness=.55 edge=5 pluck=.4 release=5 ear=.3 shell=.7 contact=.05 shade=.08 decay=36 turn=.12 volume=1 | swirl | rocking | A steel ring that leaks a little at each corner, bright then hollow | plucked
First bow of morning | Bowed ring | swell=.3 hardness=.6 shade=.06 release=1.5 edge=2 wire=.6 turn=.25 ear=.5 touch=0 shell=.15 pluck=.15 volume=1 | room | line | A ring bowed near a corner, its plain harmonics opening at once
Alto by the stove | Bowed ring | shade=.45 shell=.8 hardness=.4 pluck=.7 contact=.25 release=.9 ear=.6 touch=.28 volume=2 | vibrato | line | A darkened ring under the bow in a full case, warm in the middle
Open string, empty barn | Bowed ring | hardness=.6 pluck=.3 wire=.7 shade=.1 contact=.5 edge=3 release=2 sympathy=.4 cornerLoss=.1 touch=0 | darkhall | suspended | A firm bow with its hair heard on an open ring
Two at one desk | Bowed ring | true=.5 turn=.3 width=1 hardness=.5 swell=.2 release=1.2 edge=5 cornerLoss=0 touch=0 volume=2 | double | sixths | Two faces of a ring bowed evenly and held wide
Winter coat on | Bowed ring | hardness=.15 shade=.5 wire=.3 ear=.8 swell=.6 release=2.5 sympathy=.2 cornerLoss=.5 | warm | chorale | A soft bow on the dark face of the ring, muffled up
Rosin on the cuff | Bowed ring | contact=.8 hardness=.7 shade=.34 pluck=.15 swell=.05 release=.4 wire=.65 ear=.45 touch=.2 volume=4.5 | mike | line | More hair than usual on the ring, a dry close bow
Saw and plank | Bowed ring | contact=.95 hardness=.9 true=.1 edge=6 shade=.18 release=.6 turn=.4 shell=.9 cornerLoss=0 touch=0 volume=1.5 | record | answer | A rough pressed bow in a full case, uneven and rasping
Cat asleep on the cello | Bowed ring | hardness=.25 contact=.5 shade=.6 wire=.2 release=1.5 pluck=.8 width=.4 volume=6 | pillow 1.output=8 | lowline | Low soft bowing on gut, half hair and half hum | bass
Chair pulled closer | Bowed ring | hardness=.45 swell=.08 touch=.35 edge=4 release=.7 shade=.25 shell=.7 ear=.55 cornerLoss=.1 volume=2.5 | booth | answer | A bowed ring with one corner touched, veiled and near
Winded by the stairs | Bowed ring | contact=.6 swell=.4 hardness=.3 decay=6 release=1 cornerLoss=.6 turn=.15 ear=.65 volume=6 | comb | line | A hairy bow on a leaking ring, quick to bloom and settle
Section at the back | Bowed ring | hardness=.55 swell=.9 release=3 width=1 turn=.2 sympathy=.5 edge=2 shade=.25 ear=.4 touch=0 volume=1.5 | ensemble | lamp | A ring bowed as a section would be, each key most of a second in coming
Cathedral workmen | Bowed ring | swell=1.6 hardness=.5 sympathy=.8 release=9 decay=36 shade=.2 wire=.7 ear=.55 touch=0 | nave | hymn | Long bows on a ring with the frame humming above
Slow train strings | Bowed ring | swell=.7 hardness=.35 true=.3 edge=6 turn=.6 release=3.5 contact=.2 cornerLoss=.6 touch=0 | seasick | tenths | Ring tones a little out with each other, swaying
Gutter running in thaw | Bowed ring | swell=2.2 hardness=.2 wire=.9 shade=.1 release=6 pluck=.2 ear=.3 touch=0 | glasshalo | suspended | Thin steel ring drawn very lightly, two seconds in coming | pad
Moss over stone | Bowed ring | swell=3.2 shade=.65 hardness=.6 release=10 edge=3 shell=.5 sympathy=.6 ear=.55 cornerLoss=.5 volume=2.5 | undertow | stone | A dark ring under a slow firm bow with low tones sinking after | drone
Barn dance, second set | Bowed ring | solid=Octahedron hardness=.4 contact=.45 release=.8 edge=5 shade=.28 pluck=.25 ear=.3 touch=0 volume=3 | slap | line | An octahedron bowed like a small fiddle, fourth and octave inside
Four corners bowed | Bowed ring | solid=Tetrahedron hardness=.45 swell=.2 true=.7 release=2 edge=2 sympathy=.3 ear=.85 cornerLoss=.1 touch=0 volume=1 | hall | sixths | A tetrahedron under an even bow, wide gaps between its tones
Boxwood viol | Bowed ring | solid=Cube shell=1 hardness=.3 release=1 contact=.3 pluck=.5 wire=.1 shade=.5 | wood | contrary | A cube of gut bowed softly in the fullest case, boxy and grave
Fiddler at the window | Bowed ring | solid=Prism hardness=.65 swell=.15 turn=.25 true=.5 release=1.6 shade=.1 ear=0 cornerLoss=.4 touch=0 volume=1.5 | amptrem 1.depth=0.3 | answer | A prism bowed firmly, half tuned, turning once in four seconds
Nest of strings | Bowed ring | solid=Web hardness=.4 swell=.4 true=.9 release=2.5 shade=.3 cornerLoss=.3 ear=.95 volume=0 | flock | chorale | A web bowed softly, many close strings as one
Ring at the well | Ring koto | swell=.6 hardness=.5 release=5 turn=.1 edge=2 decay=40 sympathy=.5 ear=.45 volume=3.5 | swell | tenths | A plucked ring with its front drawn off, harmonic and calm | pad
Kite string, let out | Ring koto | swell=.25 hardness=.6 pluck=.15 wire=.8 release=4 turn=.3 cornerLoss=.38 volume=3.5 | dotted | rise | Bright ring plucks with a soft start and a thin tail | plucked
Wool-gathering | Ring koto | swell=1.1 wire=.25 shade=.35 hardness=.4 release=7 ear=.7 shell=.7 cornerLoss=.05 turn=.18 volume=3 | recall | hymn | Gut ring notes that arrive a second late and dull | pad
Slack tide harp | Ring koto | swell=.4 cornerLoss=.6 hardness=.45 turn=.7 release=3 edge=4 width=1 volume=2.5 | weave | sixths | Leaking ring plucks that swell and swing | plucked
After the arrow | Ring koto | swell=1.8 hardness=.75 true=.9 pluck=.3 release=12 sympathy=.9 decay=34 ear=.35 cornerLoss=.35 volume=6 | ascent | hymn | Firm ring plucks heard only as they ring, with their halo | pad
Hand flat on wire | Ring koto | touch=.5 hardness=.6 decay=8 release=.4 shell=.7 contact=.3 edge=2 ear=.5 volume=-1.5 | console | knock | A ring damped by a hand at one corner, plucky and dry | plucked
Cicada at the screen | Ring koto | touch=.18 hardness=.45 pluck=.12 wire=.75 decay=20 release=4 shade=.2 ear=0 cornerLoss=.2 turn=.8 contact=.05 width=.5 sympathy=.4 volume=2.5 | tamed | rocking | A touched ring plucked by the corner, reedy and swinging round | plucked
Beads on a wire | Ring koto | touch=.7 hardness=.75 decay=20 release=.6 edge=4 sympathy=.5 pluck=.4 volume=5 | stars | knock | A ring held hard by one finger, more tick than tone, its halo after | plucked
Mended harness | Ring koto | touch=.25 wire=.35 hardness=.4 edge=3 decay=16 release=1.5 shade=.25 true=.5 ear=.3 cornerLoss=.65 volume=1.5 | reel | contrary | Half-soft ring wire with a light finger on it | plucked
Broom against the wall | Ring koto | touch=.3 exciter=Hammer hardness=.45 contact=.1 decay=14 release=.8 wire=.4 sympathy=.2 ear=.55 cornerLoss=.4 volume=-0.5 | short | tenor | A damped ring struck by a padded head, a thud with a note in it | bass
Under the arch, two bows | Bowed ring | hardness=.7 wire=.8 shade=.05 edge=4 pluck=.4 release=1.2 turn=.12 true=.6 ear=.35 touch=0 shell=.1 volume=0.5 | stairwell | sixths | A bright steel ring bowed firmly, in two parts
Ferryman hums along | Bowed ring | exciter=Breath hardness=.4 contact=.3 swell=.25 shade=.3 release=1.2 shell=.9 ear=.6 touch=.22 | vowel | line | A ring blown in a full case, close to a hum | voice
Pipes of the old pump | Bowed ring | exciter=Breath hardness=.65 contact=.2 shade=.1 release=.5 edge=3 true=1 pluck=.35 cornerLoss=.5 | pipes 1.mix=0.35 | hymn | A ring blown hard and in tune, like a short rank of pipes | organ
Reed bed at low water | Bowed ring | exciter=Breath hardness=.8 contact=.5 wire=.9 release=.8 touch=.3 shade=.15 swell=.1 ear=.35 volume=2.5 | drift | line | A touched ring blown hard, reedy with air round it | wind
Letter read aloud | Bowed ring | hardness=.4 swell=.15 edge=6 ear=.6 shade=.35 release=1 contact=.4 sympathy=.1 cornerLoss=0 | nextdoor | answer | A plain bowed ring, its dark side turned to the listener
`,
    },
    {
      id: 'blown-corners',
      name: 'Blown corners',
      category: 'wind',
      rows: `
Keyhole draught | Corner whisper | hardness=.25 contact=.9 swell=.3 edge=2 shade=.25 release=1 turn=.05 ear=.5 touch=.22 shell=0 volume=4 | wide | line | A thin breath through a tetrahedron, nearly all air
Snow against the pane | Corner whisper | contact=1 shade=.15 swell=1.2 release=4 turn=.2 wire=.9 edge=4 ear=.45 cornerLoss=.1 touch=0 shell=.2 volume=1.5 | hall | single | As much air as the wire takes, bright and turning slowly | texture
Two tones in the flue | Corner whisper | hardness=.45 contact=.4 true=.9 release=1.5 ear=.5 shade=.2 pluck=.6 cornerLoss=.05 touch=0 turn=.015 volume=-1 | chamber | sixths | A tetrahedron blown firmly, pure tones standing over the air
Nurse on the night ward | Corner whisper | shade=.55 hardness=.2 swell=.8 release=3 shell=.7 sympathy=.1 width=.5 ear=.55 cornerLoss=.35 touch=0 turn=.15 volume=-1.5 | breathing | tenths | A dark hushed breath in a deep case | voice
Draught in three rooms | Corner whisper | turn=.7 hardness=.4 edge=6 contact=.65 swell=.6 release=2.5 true=.1 cornerLoss=.05 volume=4.5 | circle | answer | Breath on uneven wires, moving from ear to ear as it turns
Reed on the far bank | Corner whisper | solid=Octahedron hardness=.6 contact=.35 swell=.12 release=.8 shade=.1 edge=2 ear=.4 turn=.11 volume=2.5 | stairwell | line | An octahedron blown firmly, a reed with its fourth inside
Goatherd, noon | Corner whisper | solid=Octahedron hardness=.4 contact=.55 swell=.08 release=.5 ear=.4 pluck=.2 width=.5 turn=.13 volume=3.5 | valley | answer | A breathy octahedron, quick to speak and to stop
Cut bamboo | Corner whisper | solid=Octahedron hardness=.75 contact=.5 swell=.05 wire=.35 shell=.8 release=.6 decay=6 shade=.2 cornerLoss=.4 touch=0 volume=0 | wood | grace | A hard puff on half-soft wire, its own case full and hollow
Oboe left outdoors | Corner whisper | solid=Octahedron hardness=.95 contact=.2 wire=.85 touch=.3 swell=.1 release=.7 shade=.05 ear=.05 cornerLoss=0 turn=.13 volume=1.5 | drift | line | A touched octahedron blown as hard as it will go, nasal and even
Evening over allotments | Corner whisper | solid=Octahedron true=1 hardness=.3 contact=.45 swell=1 release=6 sympathy=.6 edge=5 ear=1 cornerLoss=.1 turn=.02 | darkhall | suspended | Pure open intervals on a slow breath, the frame humming after
Nine cut reeds | Corner whisper | solid=Ring hardness=.35 contact=.5 swell=.07 release=.5 edge=2 shade=.2 sympathy=0 ear=.5 touch=0 shell=0 volume=3.5 | booth | grace | Short puffs on a ring, plain as pipes
Milk bottle on a wall | Corner whisper | solid=Ring hardness=.2 contact=.7 swell=.15 release=.8 wire=.3 shade=.3 ear=.8 pluck=.9 cornerLoss=.6 touch=.28 turn=.18 volume=3.5 | jar | answer | Breath over the dark face of a ring, hollow and low
Steam whistle, small | Corner whisper | solid=Ring hardness=.8 contact=.6 swell=.2 edge=3 wire=1 shade=0 release=1.2 pluck=.1 shell=0 turn=.12 | platform | line | A hard bright breath on steel, hissing as it speaks
Choirboy's scarf | Corner whisper | solid=Ring hardness=.5 contact=.3 swell=.5 shell=.95 release=2 shade=.25 true=.8 ear=.4 cornerLoss=.05 touch=.25 volume=-1 | choirhall | hymn | A ring blown in the fullest case, its hollows near to vowels | voice
Windharp on the dyke | Corner whisper | solid=Ring hardness=.55 swell=2 release=8 turn=.4 true=.2 sympathy=.7 width=.8 cornerLoss=0 volume=1.5 | wind | quartal | A ring the wind finds, its harmonics sliding by as it turns | pad
Attic pigeons | Corner whisper | solid=Cube hardness=.3 contact=.6 swell=.2 release=1 shell=.8 edge=2 shade=.35 ear=.75 touch=.2 turn=.11 volume=2 | darkbox | answer | A cube blown gently in a full case, cooing and dark
Organ with one pipe | Corner whisper | solid=Cube hardness=.5 contact=.3 swell=.1 release=.9 true=.7 edge=5 shade=.15 sympathy=.1 ear=.35 cornerLoss=.1 touch=0 shell=.55 | pipes | chorale | A cube blown evenly, steady and hollow | organ
Breath on cold glass | Corner whisper | solid=Cube hardness=.15 contact=.75 swell=1.4 release=4 wire=.9 shade=.1 turn=.1 cornerLoss=.1 touch=0 volume=0 | fog | suspended | A faint breath over a steel cube, the tone coming up behind it | pad
Cloister, after rain | Corner whisper | solid=Prism hardness=.65 contact=.4 swell=.7 release=5 sympathy=.8 edge=6 true=.3 ear=.7 cornerLoss=.05 touch=0 shell=.15 turn=.015 | nave | hymn | An uneven prism blown clear, its frame answering late
Bellows boy | Corner whisper | solid=Cube hardness=.85 contact=.85 swell=.05 decay=4 release=.3 touch=.2 pluck=.2 ear=.85 cornerLoss=.4 volume=2 | gated | knock | Short hard gusts on a cube, all push and little ring
Rainbow in the spray | Corner whisper | solid=Prism hardness=.4 contact=.6 swell=.5 turn=.9 edge=2 release=3 shade=.1 touch=.22 | twinkle | rise | Breath on a prism spinning nearly once a second
Windows breathed on | Corner whisper | solid=Prism hardness=.25 contact=.45 swell=1.6 edge=4 release=7 true=.8 sympathy=.5 ear=.65 cornerLoss=0 touch=0 turn=.15 | cloud | hymn | A soft long breath through a prism, close to its pure intervals | pad
Lip of the jar | Corner whisper | solid=Web hardness=.7 contact=.3 swell=.1 pluck=.8 release=.8 shell=.6 ear=.6 shade=.2 touch=.28 volume=2.5 | pot | answer | A web blown across its middle, round and near
Crooked flute | Corner whisper | solid=Prism hardness=.5 contact=.5 swell=.08 true=0 edge=5 release=.6 turn=.15 ear=1 cornerLoss=.35 volume=1 | vibrato | line | An untuned prism blown like a flute, its octave sour
Choir of the lift shaft | Corner whisper | solid=Prism hardness=.6 contact=.25 swell=.9 shell=1 release=4 shade=.3 width=.7 ear=.85 turn=.03 | monks | quartal | A prism sung through the fullest case, dim and wordless | voice
Grass between thumbs | Corner whisper | solid=Web hardness=.9 contact=.55 swell=.05 release=.4 pluck=.1 wire=.7 shade=.22 ear=0 touch=.2 volume=2.5 | short | grace | A web blown hard near a corner, buzzing like a blade of grass
Surf in the curtains | Corner whisper | solid=Web hardness=.3 contact=.95 swell=2 release=6 turn=.15 edge=2 shade=.3 ear=.6 touch=0 volume=3 | tide | stone | Slow air through a web, rising and drawing back | texture
Every leaf at once | Corner whisper | solid=Web hardness=.5 contact=.6 cornerLoss=.7 turn=.5 swell=.4 release=2.5 edge=4 volume=4.5 | scatter | sixths | A rustling web whose corners leak, loops under the leaves | texture
Cooling engine | Corner whisper | solid=Web hardness=.65 contact=.4 true=.1 shade=.5 swell=.6 release=3 decay=10 shell=.7 ear=.65 touch=.25 | tunnel | ground | A dark web blown untuned in a deep case | drone
Choir in a hive | Corner whisper | solid=Web true=1 hardness=.4 contact=.3 swell=1.1 sympathy=.7 release=5 edge=6 shade=.2 ear=.45 cornerLoss=.5 turn=.12 volume=-2 | vowel | chorale | A web tuned to open intervals and hummed into being | voice
Inside the bell mouth | Hollow choir | swell=1.5 edge=2 hardness=.7 release=4 turn=.1 sympathy=.5 ear=.35 touch=0 solid=Cube true=.25 contact=.2 wire=.95 volume=-2.5 | choirhall | lamp | A cube breathed through the fullest case, uneven as a bell and slow to open | voice
Vespers, back row | Hollow choir | shade=.45 hardness=.6 contact=.2 release=2 swell=.5 ear=.6 cornerLoss=.05 touch=0 volume=-3 | monks | hymn | A clear dark breath on the ring, its case all hollows | voice
Children on the stairs | Hollow choir | solid=Octahedron hardness=.7 contact=.25 swell=.3 release=1.5 shade=.02 edge=4 ear=0 volume=3.5 | stairwell | sixths | A bright octahedron sung through a full case | voice
Answer from the gallery | Hollow choir | solid=Tetrahedron hardness=.4 swell=.7 true=.95 release=3 turn=.2 edge=3 ear=.05 cornerLoss=0 touch=0 | canon | answer | A pure tetrahedron breathed through the fullest case | voice
Launderette at ten | Hollow choir | solid=Cube swell=.4 hardness=.5 contact=.5 shade=.4 release=1.2 decay=10 width=.4 ear=.95 volume=-0.5 | kitchen | chorale | A cube hummed close and narrow through the fullest case | voice
Feather over wire | Corner whisper | hardness=0 contact=.85 swell=.6 shade=.1 sympathy=.5 release=5 edge=5 ear=.3 turn=.015 volume=1 | glasshalo | single | The lightest breath there is on a tetrahedron, its wires waking after | texture
Ash swept to one side | Corner whisper | hardness=.1 contact=1 shade=.5 swell=1 decay=4 release=1.5 wire=.2 cornerLoss=.5 ear=.7 touch=0 turn=.18 volume=2 | hiss | tenths | Dulled gut blown with hardly a note to it, mostly air | texture
Whisper of ladders | Corner whisper | hardness=.3 contact=.8 swell=.4 release=2 edge=3 pluck=.1 turn=.3 cornerLoss=.6 touch=0 shell=.05 | orbit | rise | Airy steps on a tetrahedron, thin at the corner
Secret down the wire | Corner whisper | hardness=.5 contact=.75 swell=.1 release=.6 shell=.9 touch=.4 width=.3 sympathy=0 ear=.75 turn=.11 volume=5.5 | night | answer | A breath on a touched wire in a full case, half a voice | voice
Confessional | Corner whisper | hardness=.2 contact=.65 shade=.6 swell=.5 release=1 shell=.85 width=.2 ear=.9 cornerLoss=.35 turn=.02 volume=-0.5 | nextdoor | line | A murmur on the dark face of a tetrahedron, narrow and close | voice
Thermals | Corner whisper | swell=3 hardness=.5 turn=.5 width=1 release=9 edge=2 sympathy=.6 contact=.5 touch=0 solid=Prism | ascent | quartal | A breath that climbs for three seconds through a turning frame | pad
Passing lorry, asleep | Corner whisper | swell=2.2 shade=.6 hardness=.75 release=6 wire=.4 edge=6 contact=.5 ear=.55 cornerLoss=.05 touch=0 turn=.13 | undertow | ground | A hard dark breath, slow to arrive and slow to go | drone
Balloon over the estate | Corner whisper | solid=Octahedron swell=1.8 hardness=.6 turn=1.1 release=7 contact=.35 true=.7 shade=.2 touch=0 | flock | lamp | An octahedron blown as it wheels once a second | pad
Long exhale | Corner whisper | swell=.2 hardness=.4 release=14 sympathy=.9 decay=34 shade=.25 edge=4 contact=.6 ear=.55 cornerLoss=.6 touch=0 volume=-2.5 | open | tenths | A breath that leaves a tetrahedron's whole frame ringing
Crossing the moor | Corner whisper | solid=Cube swell=2.6 hardness=.45 contact=.7 release=5 turn=.25 shade=.4 true=.4 ear=.95 width=.6 volume=3 | outdoors | stone | Wind over a shaded cube, two or three seconds in coming | texture
Goodnight through a wall | Corner whisper | solid=Ring hardness=.45 contact=.25 swell=.2 shade=.5 release=1.5 shell=.6 sympathy=.2 ear=.7 touch=0 turn=.15 volume=-1 | pillow | line | A mild shaded breath on the ring, plain and low | voice
Tea urn | Corner whisper | exciter=Breath solid=Prism contact=1 hardness=.5 swell=.4 release=1.5 shade=.3 edge=3 ear=.6 touch=0 volume=4 | tin | sixths | Hiss and little tone, a firm breath on a prism | texture
Gnat over the lamp | Corner whisper | solid=Tetrahedron hardness=1 contact=.2 wire=1 pluck=.05 swell=.15 shade=0 release=.8 sympathy=.1 cornerLoss=.4 touch=.28 turn=.03 volume=-0.5 | howl | grace | The hardest thinnest breath on steel, close to a whistle
Sails being taken in | Corner whisper | solid=Prism hardness=.55 contact=.8 swell=.3 cornerLoss=.6 turn=.6 release=2 decay=8 volume=0 | backwards | fall | Gusts through a leaking prism as it turns
Nobody at the piano | Corner whisper | exciter=Finger contact=1 hardness=.3 swell=.05 decay=3 release=.6 shade=.2 edge=2 ear=.3 cornerLoss=.55 volume=2.5 | felt | knock | Fingertips brushing a tetrahedron, more skin than wire | plucked
`,
    },
    {
      id: 'low-wires',
      name: 'Low wires',
      category: 'bass',
      rows: `
Footing of the bridge | Dark cube bass | edge=2 pluck=.5 decay=14 release=1 shade=.4 ear=.5 wire=.15 hardness=.6 contact=.4 volume=-3.5 | firm | lowline | A gut cube pulled by a firm finger, round and dark, nearly one tone
Keel laid down | Dark cube bass | hardness=.6 contact=.35 shade=.35 decay=6 release=.3 edge=3 wire=.4 ear=.65 cornerLoss=.45 touch=.22 volume=-3.5 | console | walk | A firm finger on a half-soft cube, stopped quickly
Coal through the hatch | Dark cube bass | hardness=.8 contact=.6 shell=.9 decay=4 release=.2 pluck=.3 edge=5 cornerLoss=.5 touch=.25 volume=2.5 | combo | walk | A cube pulled hard in a full case, more thump than note
Moored two abreast | Dark cube bass | sympathy=.5 decay=24 release=5 shade=.55 true=.9 turn=.1 width=.5 ear=.55 cornerLoss=.05 touch=0 solid=Prism volume=5 | darkhall | stone | A pure dark prism left to ring over its own frame
Undercroft | Dark cube bass | hardness=.15 shade=.65 wire=.2 decay=12 release=1.2 shell=.4 ear=.9 cornerLoss=.55 volume=6 | pillow 1.output=9 | - | A very soft finger on a gut cube under a thick shade
Bulrush | Dark cube bass | solid=Ring wire=.25 hardness=.5 shade=.3 pluck=.6 decay=10 release=.6 contact=.15 ear=1 touch=0 width=0 exciter=Hammer volume=2 | bare | lowline | A ring of soft wire struck midway, plain and even
Ox hide and wire | Dark cube bass | solid=Ring wire=.05 hardness=.65 contact=.35 shade=.4 shell=.8 release=.25 decay=12 ear=.75 cornerLoss=.4 touch=.2 volume=2.5 | tamed | walk | Gut pulled by a thick finger, skin first and then a short dark ring
Fretless at low tide | Dark cube bass | solid=Ring swell=.12 hardness=.35 wire=.5 shade=.35 decay=20 release=.8 ear=.6 pluck=.8 turn=.18 volume=5 | drift | tenor | A ring plucked with its front smoothed, rounded all over
Post driven in clay | Dark cube bass | solid=Ring hardness=.65 pluck=.15 wire=.35 shade=.2 decay=14 release=.5 touch=.2 shell=.7 contact=.05 ear=.55 cornerLoss=.65 width=0 volume=-2.5 | pot | walk | A touched ring pulled hard, stubby and dry
Pedal of the old loom | Dark cube bass | solid=Ring exciter=Hammer hardness=.3 wire=.4 shade=.45 decay=16 release=1.5 edge=4 ear=.85 cornerLoss=.38 volume=1 | reel | - | A padded hammer on a ring, rounded off and even
Grandfather's ladder | Dark cube bass | solid=Octahedron hardness=.4 shade=.4 pluck=.6 decay=12 release=.8 true=.8 width=.3 ear=.6 touch=.2 exciter=Hammer volume=-2 | wood | tenor | An octahedron struck low, the fourth and octave inside each note
Double doors, low | Dark cube bass | solid=Octahedron hardness=.6 shade=.25 pluck=.1 edge=2 decay=18 release=1.5 wire=.5 sympathy=.2 ear=.5 cornerLoss=0 touch=0 true=.1 volume=0 | room | lowline | An octahedron left uneven and pulled near its corner, full and open
Ballast stones | Dark cube bass | solid=Octahedron shell=.95 hardness=.5 contact=.4 shade=.5 decay=9 release=.5 wire=.3 ear=.8 cornerLoss=.5 touch=.25 volume=0.5 | larger | stone | Dark wire in the fullest case, heard from its back
Weights for a clock | Dark cube bass | solid=Octahedron touch=.45 hardness=.7 shade=.3 decay=14 release=.5 edge=3 contact=.3 ear=.55 cornerLoss=.45 | slap | walk | An octahedron touched at one corner, knocked low and short
Heavy curtain cord | Dark cube bass | solid=Octahedron hardness=.2 shade=.7 decay=30 release=3 wire=.6 sympathy=.4 turn=.2 pluck=1 ear=.95 cornerLoss=.55 volume=2 | trail | singlelow | A very soft low pluck under the shade, swaying as it turns
Bow on the hawser | Bowed ring | shade=.45 hardness=.55 wire=.35 width=.2 release=.6 contact=.5 edge=2 ear=.7 volume=1 | console | lowline | A ring bowed low with a firm hand and plenty of hair | bass
Bear in the orchard | Bowed ring | shade=.6 hardness=.35 swell=.35 width=.3 release=1 shell=.9 ear=.7 touch=.22 solid=Cube volume=-1 | darkbox | tenor | A low soft bow on a cube in a full case, dark and narrow | bass
Barges passing slow | Bowed ring | shade=.5 swell=.9 hardness=.45 release=2.5 sympathy=.3 edge=5 decay=26 cornerLoss=.1 touch=0 shell=.5 | darkhall | stone | Long low bows, almost a second in coming up | bass
Rough-hewn | Bowed ring | shade=.25 hardness=.85 contact=.75 true=.3 width=.25 release=.4 pluck=.2 ear=.4 cornerLoss=0 solid=Octahedron | triode | walk | A pressed bow on a low octahedron, grained and a little uneven | bass
Sleepwalker's bow | Bowed ring | shade=.4 swell=.2 hardness=.25 turn=.3 wire=.9 release=1.5 pluck=.7 width=.5 cornerLoss=.5 solid=Tetrahedron true=.1 volume=0.5 | vibrato | lowline | A light low bow on a steel tetrahedron, dark and left beating | bass
Anvil wrapped in felt | Dark cube bass | exciter=Hammer hardness=.25 shade=.4 decay=6 release=.6 pluck=.7 shell=1 edge=3 true=.1 ear=.5 touch=.28 | slack | walk | A soft hammer on a cube in the fullest case, a low round thud
Boiler at the far end | Dark cube bass | exciter=Hammer solid=Web hardness=.3 shade=.75 decay=12 release=2 pluck=.9 edge=2 contact=.08 true=.7 ear=1 cornerLoss=.38 volume=4.5 | tunnel | stone | A web struck low and soft, a dull gong under everything
Stamping mill | Dark cube bass | exciter=Hammer solid=Tetrahedron hardness=.6 shade=.35 decay=5 release=.3 shell=.9 contact=.45 wire=.3 cornerLoss=.65 touch=.22 volume=1 | gated | walk | Tetrahedron blows in a full case, dry and blunt
Copper's beat | Dark cube bass | exciter=Hammer solid=Prism hardness=.35 shade=.45 decay=7 release=.4 edge=4 wire=.35 true=.6 ear=.75 cornerLoss=.5 touch=.25 volume=3 | darkecho | - | A prism tapped low under a shade, warm and stubby
Backstage, one bulb | Dark cube bass | exciter=Hammer solid=Ring hardness=.55 shade=.3 decay=22 release=.5 pluck=.2 wire=.55 edge=3 sympathy=.15 ear=.65 turn=.03 volume=5.5 | nextdoor | tenor | A ring struck low, like one string of a piano
Pump house pipe | Bowed ring | exciter=Breath shade=.55 hardness=.5 contact=.25 swell=.1 release=.4 width=0 pluck=.6 ear=.85 touch=0 shell=.1 volume=0.5 | bare | lowline | A ring blown low and steady, a plain dark pipe | bass
Marsh bandsman | Bowed ring | exciter=Breath shade=.5 hardness=.75 contact=.15 swell=.15 release=.6 shell=.85 wire=.4 edge=2 ear=.95 touch=0 | fog | tenor | A hard low breath in a full case, brassy at the back | bass
Foghorn, resting | Bowed ring | exciter=Breath solid=Cube shade=.6 hardness=.4 contact=.4 swell=.5 release=2 ear=.6 cornerLoss=.35 volume=1 | outdoors | singlelow | A cube blown low and soft, half air | bass
Organ loft, left foot | Bowed ring | exciter=Breath solid=Prism shade=.35 hardness=.6 contact=.1 swell=.25 release=1.5 true=.9 sympathy=.3 width=.4 ear=.55 touch=0 shell=.1 | hall | stone | A low prism blown clear, close to its pure intervals | organ
Draught horse | Bowed ring | exciter=Breath solid=Tetrahedron shade=.4 hardness=.9 contact=.6 swell=.08 release=.3 wire=.3 decay=6 ear=.85 cornerLoss=.1 shell=.48 | grit | walk | A tetrahedron blown hard and low, all push and grain | bass
Tide under the floor | Dark cube bass | swell=.7 shade=.5 hardness=.5 decay=26 release=3 sympathy=.2 turn=.15 ear=1 volume=-0.5 | swell 1.depth=0.4 | singlelow | A cube plucked low with its front hidden, rising and ebbing
Slow lorry at night | Dark cube bass | swell=.35 solid=Ring shade=.6 hardness=.6 wire=.4 release=1.2 decay=16 edge=2 ear=.7 cornerLoss=.4 volume=-2 | iron | lowline | A shaded ring that leans into each note over a third of a second
Earth turning over | Dark cube bass | solid=Tetrahedron swell=1.4 shade=.55 hardness=.35 decay=34 release=6 sympathy=.5 true=.9 touch=0 volume=1.5 | crypt | stone | A low tetrahedron that takes more than a second to arrive
Heron, unimpressed | Dark cube bass | solid=Tetrahedron exciter=Breath swell=.2 hardness=.6 shade=.6 contact=.3 release=.5 touch=.3 pluck=.2 ear=.75 cornerLoss=.05 turn=.02 wire=.3 volume=-1.5 | seashell | lowline | A touched tetrahedron blown low, half gut, dark with a little air
Submerged steeple | Dark cube bass | exciter=Hammer swell=.5 hardness=.5 shade=.45 decay=30 release=8 true=.2 sympathy=.4 ear=.65 cornerLoss=.1 turn=.11 | diver | ground | An uneven cube struck low, its blow swallowed by a slow front
Iron bedstead | Dark cube bass | hardness=.7 pluck=.25 wire=.85 shade=.2 decay=12 release=.6 edge=4 true=.1 ear=.45 touch=.2 volume=-1.5 | folded | walk | A steel cube pulled hard and left untuned, clanking low
Van full of amplifiers | Dark cube bass | solid=Ring hardness=.75 pluck=.1 wire=.8 shade=.15 decay=10 release=.3 contact=.3 ear=.35 cornerLoss=.45 touch=.28 volume=-2 | spring | walk | Hard steel ring near the corner, a wiry low growl
Ungreased axle | Dark cube bass | solid=Octahedron hardness=.8 wire=.65 shade=.25 cornerLoss=.6 decay=8 release=.5 edge=6 touch=.25 | buzz | lowline | Hard low plucks with leaking corners, metal and dust
Cable drum | Dark cube bass | solid=Prism hardness=.65 wire=.75 shade=.3 true=.3 decay=14 release=.8 turn=.5 pluck=.5 width=.4 cornerLoss=.38 touch=0 volume=0 | throb | tenor | A crooked prism of steel plucked low, turning over
Idle crane | Dark cube bass | solid=Tetrahedron hardness=.55 wire=.9 shade=.3 decay=24 release=2 edge=2 sympathy=.2 ear=.6 turn=.15 volume=-3.5 | cassette | ground | Low steel tetrahedron, few tones and far apart
Mule on cobbles | Prism marimba | shade=.35 hardness=.25 decay=5 release=.4 edge=2 true=.7 sympathy=0 width=0 ear=.65 touch=.22 volume=5.5 | mike | walk | Padded hammer on a gut prism, low and wooden | bass
Root cellar | Prism marimba | shade=.5 hardness=.2 decay=14 release=1.5 ear=.8 edge=4 pluck=.6 cornerLoss=.65 touch=0 volume=4 | stairwell | lowline | Prism bars of gut struck softly in the dark | bass
Loom weights | Loops alone | solid=Cube shade=.45 hardness=.5 decay=9 release=.8 wire=.4 edge=1 turn=.1 width=0 touch=.28 volume=-1.5 | booth | walk | Loops of a cube struck low, hollow and short | bass
Nine fathoms | Loops alone | shade=.5 hardness=.4 decay=36 release=10 cornerLoss=1 pluck=.9 turn=.06 sympathy=.4 ear=.6 touch=0 shell=0 volume=2.5 | undertow | singlelow | The bare loops of an octahedron struck once, very low | bass
Elephant, kneeling | Muted lantern | shade=.4 wire=.2 hardness=.45 decay=8 release=.6 width=.3 sympathy=.1 edge=2 ear=.7 cornerLoss=.4 solid=Cube exciter=Hammer volume=-2 | larger 1.size=0.6 | tenor | A gut cube struck with a corner held, low and blunt | bass
Great wheel stopped | Tetra drone | shade=.5 swell=.6 release=3 hardness=.4 sympathy=.5 width=.4 edge=3 ear=.95 touch=.2 | slowhall | ground | A dark tetrahedron bowed low, with half its frame awake | bass
Mountain leaning in | Tetra drone | solid=Octahedron shade=.6 swell=1.2 release=5 sympathy=.6 hardness=.5 turn=.1 ear=.75 touch=0 volume=-0.5 | cave | stone | A shaded octahedron bowed low, one second in coming | bass
Hull against the ice | Tetra drone | solid=Web exciter=Breath shade=.55 swell=.8 release=3 hardness=.6 true=.4 sympathy=.2 contact=.3 cornerLoss=.6 touch=0 shell=.65 volume=0 | winter | singlelow | A dark web breathed low, groaning a little | bass
Two miles of cable | Tetra drone | solid=Ring exciter=Finger swell=.1 hardness=.5 shade=.4 release=8 sympathy=.8 decay=34 wire=.5 ear=.85 touch=0 volume=5.5 | valley | lowline | A low ring plucked over a frame that rings far along | bass
Deep end, lights off | Tetra drone | solid=Cube exciter=Finger swell=.3 hardness=.35 shade=.8 release=4 sympathy=.4 decay=20 pluck=.8 ear=.55 cornerLoss=.05 | chorale | tenor | A cube eased in under a heavy shade, nearly a pure low tone | bass
`,
    },
    {
      id: 'web-and-dust',
      name: 'Web and dust',
      category: 'texture',
      rows: `
Dust lit from the side | Web dust | edge=2 hardness=.2 decay=14 turn=.1 release=4 shade=.1 ear=.45 touch=0 wire=.95 true=.9 volume=2 | sparks | quartal | Soft fingers on steel web tuned nearly pure, a rustle first and the tone behind
Spider at her books | Web dust | pluck=.1 hardness=.6 contact=.5 edge=4 decay=8 release=1.2 sympathy=.1 ear=.35 touch=.28 volume=1 | bare | grace | Quick fingers near a corner of the web, dry and exact
Hayloft in August | Web dust | shade=.4 wire=.25 true=.8 hardness=.25 decay=18 shell=.8 release=5 volume=3 | record | tenths | A web of gut in a deep case, dusty and warm
Beaded curtain | Web dust | turn=.9 hardness=.7 contact=.6 edge=5 release=2 shade=.14 wire=.85 touch=0 shell=.2 volume=0 | marbles 1.mix=0.2 | rise | Steel web swung round nearly once a second by hard fingers
Thistledown | Web dust | hardness=.15 contact=.35 edge=3 shade=.2 sympathy=.7 release=12 decay=30 turn=.04 ear=.55 volume=4.5 | shimmer | toll | The softest fingers on a web, the frame lighting up after
Jumper over the head | Web dust | exciter=Breath hardness=.4 contact=.95 swell=.3 release=2 shade=.15 turn=.3 volume=1.5 | stream | single | A breath that rubs more than it sings, over a web
Rain two fields off | Web dust | exciter=Breath hardness=.6 contact=.8 swell=1.8 cornerLoss=.8 release=6 shade=.35 edge=2 ear=1 touch=0 volume=0.5 | rain | stone | A leaking web under a steady wind, coming up for two seconds
Gas mantle | Web dust | exciter=Breath hardness=.3 contact=.6 swell=.6 true=.9 release=3 edge=6 shade=.3 turn=.05 touch=0 volume=2 | breathing | suspended | A low even hiss with pure tones standing in it
Swarm over clover | Web dust | exciter=Breath hardness=.75 contact=.4 swell=.9 true=.1 turn=.7 release=3 pluck=.3 shade=.1 touch=0 volume=0.5 | flock 1.mix=0.5 | sixths | A hard breath on an untuned web, humming and turning
Old workings | Web dust | exciter=Breath hardness=.5 contact=.7 swell=1.2 shade=.6 decay=10 release=4 shell=.9 edge=4 ear=.85 volume=2 | tunnel | ground | Dark air through a web in a full case | drone
Nobody bowing | Web dust | exciter=Bow hardness=.35 contact=.6 swell=1 turn=.25 release=4 edge=2 sympathy=.6 ear=.4 touch=0 volume=1 | wind | quartal | A web bowed lightly, its tones sliding by as it turns | pad
Cobweb harmonium | Web dust | exciter=Bow hardness=.5 contact=.3 swell=.4 true=1 shell=.85 release=1.5 cornerLoss=.1 ear=.5 touch=0 volume=1.5 | parlour | hymn | A web tuned to open intervals under an even bow, wheezing a little | organ
Furnace door | Web dust | exciter=Bow hardness=.8 contact=.5 swell=.7 true=.1 shade=.4 release=2.5 edge=6 turn=.12 touch=.2 shell=.7 volume=0.5 | grit | ground | A dark web bowed hard and left uneven, close to a growl | drone
Skein unwinding | Web dust | exciter=Bow hardness=.25 contact=.4 swell=2.4 release=9 turn=.6 edge=5 shade=.08 wire=.9 touch=0 volume=2.5 | scatter | suspended | Fine steel web under a slow bow, turning as it opens | pad
Scaffolds in a gale | Web dust | exciter=Bow hardness=.5 contact=.85 swell=.3 cornerLoss=.7 release=2 pluck=.15 true=.3 ear=.3 solid=Prism shade=.3 volume=6 | outdoors 1.level=1 | sixths | A prism bowed roughly with its corners leaking
Gravel under tyres | Web dust | exciter=Hammer hardness=.5 contact=.25 decay=1.2 release=.3 sympathy=0 pluck=.7 turn=.5 touch=.22 volume=0 | shells | knock | A web tapped short, half rattle and half pitch
Hail, then sun | Web dust | exciter=Hammer hardness=.35 contact=.1 decay=3 release=1 wire=.65 shade=.15 edge=3 sympathy=.2 ear=0 volume=5.5 | crystals | toll | Light taps on a clear web, scattering as they go | bell
Cargo shifting | Web dust | exciter=Hammer hardness=.35 contact=.3 decay=5 shade=.5 shell=1 wire=.2 release=.6 touch=.25 volume=1.5 | cavern | stone | A gut web struck softly in the fullest case, low and loose
Sleet on canvas | Web dust | exciter=Hammer hardness=.25 decay=8 swell=.25 turn=1 release=3 edge=5 true=.2 contact=.2 touch=0 volume=2 | stars | fall | Soft blows on a web with their front rubbed off, spinning
Broken bannister | Web dust | exciter=Hammer hardness=.55 decay=12 cornerLoss=1 edge=6 release=2 contact=.15 shell=.7 pluck=.4 ear=.4 volume=-0.5 | crumbs | answer | A web struck and emptied through its corners
Corners giving way | Web dust | solid=Octahedron cornerLoss=1 contact=.6 hardness=.5 release=3 edge=2 turn=.4 shade=.1 volume=1 | leaves | rise | An octahedron that leaks all it can, loops left in the dust
Sand through a cube | Web dust | solid=Cube cornerLoss=.9 contact=.9 hardness=.35 decay=10 edge=5 release=4 ear=.45 touch=0 volume=5.5 | hiss | sixths | Skin and leaking corners on a cube, falling away from each key
Prism losing colour | Web dust | solid=Prism cornerLoss=.8 hardness=.6 contact=.45 turn=.6 decay=16 shade=.2 release=5 volume=4.5 | wax | fall | A prism whose corner tones go first and leave a grey loop
Tent pegs | Web dust | solid=Tetrahedron cornerLoss=.7 hardness=.75 contact=.7 decay=4 release=.5 edge=4 sympathy=0 ear=.35 touch=.28 shell=.05 volume=0.5 | gated | knock | Leaking tetrahedron plucked hard, thin and tight | plucked
Ring of damp | Web dust | solid=Ring cornerLoss=1 hardness=.3 contact=.5 shade=.45 wire=.2 decay=9 release=2 ear=.75 volume=0.5 | blur 1.mix=0.3 | tenths | A dull ring leaking from the first moment, hardly there
Fingerprints on a lens | Web dust | solid=Octahedron contact=1 hardness=.15 pluck=.9 decay=6 release=2 cornerLoss=.2 shade=.2 edge=3 ear=.5 volume=-2 | glimmer | rocking | Mostly skin on an octahedron, a rub with a note under it
Wingbeats, indoors | Web dust | solid=Tetrahedron contact=.95 hardness=.3 decay=2 release=.4 turn=1.4 cornerLoss=0 sympathy=.1 touch=.22 volume=2 | pan | rocking | Fluttering skin on a tetrahedron, quick and small
Pages turned in bed | Web dust | solid=Ring contact=.6 hardness=.4 decay=5 release=1 wire=.3 shade=.3 sympathy=.4 cornerLoss=0 touch=.25 volume=3 | felt | sixths | Fingertips on a ring of gut, a good deal of skin and a short dull tone
Unwashed bow | Web dust | solid=Cube exciter=Bow contact=1 hardness=.4 swell=.2 release=1 shade=.15 cornerLoss=.4 ear=.3 volume=5 | paper | line | Hair dragged on a cube with the tone held back
Frosted bulb | Web dust | solid=Cube exciter=Breath contact=.9 hardness=.2 swell=.5 release=3 cornerLoss=.1 shade=.05 edge=2 ear=.1 shell=0 volume=0 | frost | single | A bright hush on a cube, barely pitched
Peas into a colander | Web dust | solid=Tetrahedron decay=1.2 release=.3 hardness=.5 contact=.2 sympathy=.35 edge=2 pluck=.2 shade=0 ear=.55 touch=.2 wire=.3 volume=2 | pebble | rocking | A very short half-gut tetrahedron, hardly more than fronts | plucked
Typists' room | Web dust | solid=Cube decay=.5 release=.1 hardness=.8 contact=.6 sympathy=0 pluck=.15 shell=.8 wire=.4 ear=.3 touch=.28 volume=2.5 | tile | knock | Clicks of a cube with a full case, each half a second long | plucked
Knitting by the radio | Web dust | solid=Ring decay=10 release=.4 hardness=.42 contact=.12 sympathy=.4 wire=.7 turn=.8 touch=0 shell=.15 volume=6 | night 1.mix=0.4 | rocking | Tiny wiry ring plucks ticking over | plucked
Ants carrying sugar | Web dust | solid=Tetrahedron decay=.2 release=.3 hardness=.9 contact=.2 sympathy=.4 wire=1 shade=0 ear=.35 touch=0 shell=.2 volume=-1.5 | fan | grace | Pinpricks of steel tetrahedron with a little halo after them | plucked
Seeds in a gourd | Web dust | decay=.6 release=.3 hardness=.4 contact=.7 shell=1 wire=.15 sympathy=0 edge=6 ear=.55 volume=0.5 | pot | grace | Dry web of gut in the fullest case, shaken more than played
Fog made of wire | Web dust | swell=1.6 hardness=.4 contact=.3 true=.8 release=8 turn=.12 edge=2 ear=.35 touch=0 volume=0.5 | fog | hymn | A plucked web that only ever fades in, near to pure | pad
Galaxy in a jar | Web dust | swell=2.6 hardness=.7 wire=1 shade=0 turn=.4 release=12 edge=4 decay=36 touch=0 shell=0 volume=0 | glasshalo | fifths | Steel web opening over two and a half seconds | pad
Breakers, heard inland | Web dust | swell=.8 cornerLoss=.9 shade=.4 hardness=.6 release=3 contact=.6 edge=5 touch=0 volume=4.5 | tide | stone | Each key a wave that rises for a second and drains away again
Cloud in the tea glass | Web dust | solid=Prism swell=3.4 hardness=.45 true=.4 release=10 turn=.2 shade=.15 ear=.5 touch=0 volume=6 | stretched | fifths | A prism that clouds up over three seconds | pad
Spilt ink | Web dust | solid=Cube swell=1.2 shade=.5 true=0 hardness=.65 release=6 cornerLoss=.6 turn=.7 | diver | lamp | Dark uneven cube, spreading slowly and turning | pad
Afterglow of filings | Web dust | sympathy=1 decay=3 release=14 hardness=.6 edge=3 contact=.5 turn=.08 ear=.4 volume=1 | open | grace | Short web plucks, and the wires of the frame standing after them
Dust, then voices | Web dust | sympathy=.9 exciter=Breath swell=.4 hardness=.2 contact=.9 release=10 decay=34 ear=.45 solid=Octahedron volume=0 | monks | suspended | Air first on an octahedron, and the frame singing after it | voice
Overgrown bell | Web dust | sympathy=.8 exciter=Hammer hardness=.2 shade=.35 release=12 decay=26 true=.5 edge=2 touch=0 volume=2.5 | bowls | toll | A furred blow on a web and a long halo of fifths | bell
Wool caught on wire | Web dust | sympathy=.7 solid=Ring wire=.35 hardness=.3 contact=.25 release=7 pluck=.3 ear=.4 touch=0 volume=5 | dissolve | contrary | Soft ring plucks with some skin in them, their halo lingering
Far off, a fairground | Web dust | sympathy=.95 solid=Prism turn=1.2 hardness=.3 release=8 decay=12 contact=.2 exciter=Hammer volume=5 | far | waltz | A struck prism going round fast in its own halo, heard across fields
Swept-up tinsel | Web dust | turn=2 width=1 hardness=.5 wire=1 shade=.15 decay=10 release=2 edge=2 touch=0 shell=.15 exciter=Hammer contact=.15 volume=1.5 | twinkle | rise | Two turns a second on clear struck web, hardly a moment still
Kaleidoscope, broken | Web dust | solid=Prism turn=1.6 true=0 hardness=.7 cornerLoss=.5 release=3 edge=4 contact=.35 volume=5 | shards | fall | An untuned prism thrown round, its pieces crossing
Flicker book | Web dust | solid=Octahedron turn=1.8 hardness=.55 decay=5 release=.5 pluck=.2 contact=.3 sympathy=0 touch=.2 volume=0 | bandbeat | rocking | An octahedron flickering by at nearly two turns a second | plucked
Ceiling fan, summer | Web dust | solid=Tetrahedron exciter=Bow turn=2 hardness=.3 contact=.5 swell=.8 release=3 shade=.25 touch=0 volume=1 | slowing | tenths | A tetrahedron bowed softly and turning twice a second | pad
Wheel of sparrows | Web dust | exciter=Breath turn=1.3 hardness=.85 contact=.5 swell=.15 release=1 shade=.16 pluck=.1 solid=Tetrahedron volume=4.5 | circle | grace | Hard bright puffs on a tetrahedron, wheeling round the head
`,
    },
    {
      id: 'glass-keys',
      name: 'Glass keys',
      category: 'keys',
      rows: `
Ticket office upright | Glass keys | hardness=.4 edge=2 decay=26 release=.8 shell=.6 contact=.2 wire=.6 ear=.45 touch=0 turn=.12 volume=0 | room | chorale | A prism under a medium hammer in a case, plain and upright
Kitchen before anyone | Glass keys | hardness=.15 pluck=.7 release=1 shade=.15 turn=.04 sympathy=.2 ear=.3 cornerLoss=.5 touch=0 shell=.7 solid=Prism wire=.2 contact=.35 volume=2.5 | shaded | sixths | A very soft hammer on a gut prism, round and half asleep
Tiles after mopping | Glass keys | hardness=.55 true=1 edge=3 wire=.9 shade=0 decay=14 release=.4 touch=0 volume=4.5 | sheen | rocking | A prism tuned fully pure, hit brightly and cut short
Reading lamp, left on | Glass keys | true=.4 decay=30 release=2.5 sympathy=.5 pluck=.4 shade=.2 turn=.12 ear=.5 volume=-1 | chorale | hymn | Half-tuned prism keys that go on ringing under the hand
Conservatory blinds | Glass keys | turn=.6 width=1 hardness=.75 edge=5 ear=.5 release=1.5 cornerLoss=.55 shell=.05 wire=.35 true=.2 volume=3 | pendulum | rise | Crooked half-gut prism keys passing from bright to dark as they turn
Sexton at practice | Ring koto | exciter=Hammer hardness=.4 wire=.55 decay=24 release=.5 contact=.2 edge=2 shade=.2 ear=.35 turn=.015 volume=3.5 | crypt | contrary | A ring struck like a plain string, even from end to end
Reception after lunch | Ring koto | exciter=Hammer hardness=.5 wire=.75 decay=16 release=.6 pluck=.15 true=.4 turn=.2 shade=.16 ear=.05 cornerLoss=.45 volume=0.5 | heads | waltz | Ring keys hit firmly, their harmonics a little sour
Lesson on a Tuesday | Ring koto | exciter=Hammer hardness=.3 pluck=.6 decay=12 release=.3 shell=.8 sympathy=.1 contact=.35 cornerLoss=.55 volume=1.5 | booth | grace | Small ring keys in a full case with the knock of the action
Lullaby, lid shut | Ring koto | exciter=Hammer hardness=.2 shade=.45 wire=.35 decay=20 release=1 edge=3 ear=.7 cornerLoss=.38 turn=.13 swell=0.16 volume=2 | pillow | hymn | Darkened ring keys, gut and felt
Player gone, pedal down | Ring koto | exciter=Hammer hardness=.5 sympathy=.9 release=9 decay=34 edge=6 wire=.65 shade=.1 ear=.55 cornerLoss=0 turn=.13 | strings | fall | Ring keys with the whole frame left undamped
Dusk on the parade | Glass keys | solid=Cube hardness=.3 true=.6 release=.8 shade=.1 wire=.6 edge=2 ear=.45 touch=0 shell=.48 volume=-1.5 | amptrem | chorale | Cube keys struck softly, hollow and bell-like
Night bus keys | Glass keys | solid=Cube hardness=.45 pluck=.8 decay=12 release=.5 contact=.15 edge=4 shell=.5 ear=0 cornerLoss=.4 volume=-2 | drift | sixths | A cube under a medium hammer, one tone with a glint on it
Milk float | Glass keys | solid=Cube hardness=.6 true=.2 decay=8 release=.4 edge=5 wire=.8 turn=.3 cornerLoss=.45 volume=-1.5 | cassette | rocking | Uneven cube keys, clinking as they go
Velvet rope keys | Glass keys | solid=Cube hardness=.2 shade=.4 wire=.4 release=1.2 decay=18 ear=.6 sympathy=.15 cornerLoss=.5 touch=0 shell=.1 swell=0.18 | warm | hymn | A dark cube barely struck, all low middle
Ice rink organist | Glass keys | solid=Cube hardness=.5 turn=1.1 width=1 release=1 sympathy=.3 edge=6 exciter=Breath swell=.1 contact=.2 cornerLoss=0 volume=-2 | spinning | answer | Cube keys blown evenly, turning once a second, wide and cold | organ
Open fifths on foot | Glass keys | solid=Octahedron hardness=.35 true=.9 release=1 edge=2 pluck=.9 decay=20 ear=.1 turn=.15 wire=.35 shade=.3 volume=0 | short | contrary | Half-gut octahedron keys, a fourth and an octave folded in each
Clockmaker's parlour | Glass keys | solid=Octahedron hardness=.6 true=.3 decay=10 release=.5 edge=4 shell=.75 contact=.3 ear=0 cornerLoss=.65 touch=0 volume=0.5 | parlour | grace | Firm octahedron keys in a full case, half in tune
Toll house jangle | Glass keys | solid=Web hardness=.5 pluck=.25 wire=.85 decay=24 release=2 sympathy=.3 shade=.14 edge=3 turn=.015 volume=0 | shells | rise | Web keys hit firmly by the corner, a bright jangle
Handkerchief on a wire | Glass keys | solid=Octahedron touch=.35 hardness=.4 release=.6 decay=14 shade=.15 sympathy=.25 edge=5 ear=.4 cornerLoss=.5 volume=-1.5 | felt | rocking | Octahedron keys with one corner covered, soft in front
Hymns from memory | Glass keys | solid=Octahedron hardness=.25 sympathy=.6 release=4 decay=32 shade=.25 turn=.02 wire=.5 ear=.5 cornerLoss=.45 shell=.65 volume=-1.5 | monks | hymn | Slow soft octahedron keys ringing into one another
Wine bar, shutters down | Glass keys | solid=Tetrahedron hardness=.4 true=.7 release=.8 edge=2 shade=.15 decay=16 ear=.55 touch=0 volume=-2 | platform | sixths | Tetrahedron keys, few tones and an open sound
Weighing house | Glass keys | solid=Tetrahedron hardness=.55 shell=.9 contact=.3 decay=9 release=.4 edge=5 wire=.4 ear=.3 cornerLoss=.65 touch=.22 volume=1.5 | darkbox | knock | Half-soft tetrahedron keys, blunt and boxy
Glove on the counter | Glass keys | solid=Tetrahedron hardness=.2 pluck=.9 release=1.5 sympathy=.4 turn=.3 wire=.35 touch=0 shell=0 shade=.25 volume=-2.5 | shadow | fall | Half-gut tetrahedron keys pressed very lightly mid-edge
Cold front coming | Glass keys | solid=Tetrahedron true=.1 hardness=.65 edge=6 decay=26 release=2 turn=.25 shade=0 ear=.1 touch=0 volume=-1 | shifted | answer | Tetrahedron keys left in their own tuning, clear and strange
Marble steps, running | Glass keys | solid=Tetrahedron hardness=.6 pluck=.2 decay=6 release=.3 contact=.12 sympathy=0 wire=.75 ear=0 cornerLoss=.4 shade=.18 volume=-1 | slap | rocking | Quick tetrahedron keys near the corner, firmly struck
Clavichord by candle | Glass keys | exciter=Finger solid=Ring hardness=.55 decay=10 release=.3 touch=.2 wire=.7 pluck=.12 contact=.25 ear=.35 shell=.55 volume=2 | mike | grace | A touched ring under the fingers, tiny and close
Brisk little stairs | Glass keys | exciter=Finger solid=Ring hardness=.65 pluck=.2 decay=14 release=.4 shell=.6 wire=.85 shade=.12 edge=2 ear=.35 cornerLoss=.38 volume=4 | tile | rocking | Ring keys plucked firmly, brisk and bright
Gloved fingers | Glass keys | exciter=Finger solid=Octahedron hardness=.25 decay=22 release=.8 shade=.25 pluck=.85 wire=.45 edge=4 cornerLoss=.55 turn=.12 volume=-2 | warped | contrary | Octahedron keys pulled softly mid-edge
Thin reeds, cut short | Glass keys | exciter=Breath solid=Ring hardness=.85 contact=.15 wire=.9 shell=.5 release=.25 swell=.06 ear=0 touch=0 | tin | hymn | Ring keys blown hard and cut at once, thin and reedy | organ
Cabinet organ, two stops | Glass keys | exciter=Breath solid=Octahedron true=1 hardness=.5 contact=.2 release=.35 swell=.08 shade=.15 ear=.3 cornerLoss=.1 turn=.18 | pipes | chorale | Octahedron keys blown evenly in pure intervals | organ
Accordion two doors down | Glass keys | exciter=Breath solid=Prism hardness=.7 true=.3 contact=.3 release=.3 swell=.1 turn=.5 shell=.7 volume=-2.5 | seasick | sixths | Crooked prism keys on a steady breath, turning as they sound | organ
Glass reeds at prayer | Glass keys | exciter=Breath solid=Cube hardness=.4 contact=.25 release=1.2 swell=.3 true=.9 shade=.35 sympathy=.4 ear=1 cornerLoss=.1 touch=0 shell=.5 | darkhall | hymn | Cube keys breathed softly, pure and dark | organ
Tired little bows | Glass keys | exciter=Bow hardness=.35 swell=.15 release=.6 contact=.4 shade=.2 edge=3 turn=.11 | reel | suspended | Prism keys drawn by a small bow each, hair and all | string
Rubbed rims | Glass keys | exciter=Bow solid=Cube hardness=.2 swell=.35 release=1.5 wire=.9 shade=0 true=.8 pluck=.6 ear=.05 cornerLoss=.4 touch=0 shell=0 turn=.03 volume=0.5 | glasshalo | sixths | Cube keys rubbed until they ring, clear and slow | pad
Wheel under the lid | Glass keys | exciter=Bow solid=Ring hardness=.6 swell=.05 release=.2 contact=.6 shell=.8 touch=.2 ear=.1 volume=-2 | cassette | contrary | Ring keys against a turning rim, nasal and woody | string
Keys underwater | Glass keys | swell=.3 hardness=.35 shade=.3 release=2 sympathy=.4 edge=2 turn=.3 volume=0.5 | diver | chorale | Prism keys with their fronts softened, sunk and swaying
Inhale, then the chord | Glass keys | swell=.7 solid=Cube hardness=.5 release=3 decay=26 true=.3 edge=3 ear=.05 touch=0 turn=.02 volume=-2 | backwards | chorale | Uneven cube keys that open after the hand has gone down | pad
Half-remembered waltz | Glass keys | swell=.18 solid=Ring hardness=.4 decay=12 release=.8 wire=.5 turn=.4 true=.5 cornerLoss=.45 touch=.28 shell=.55 volume=0.5 | worn | waltz | Ring keys with a blurred start, swimming a little in three
Rime on the aerial | Glass keys | swell=1 solid=Web hardness=.3 release=5 sympathy=.6 true=.9 shade=.1 edge=5 ear=0 cornerLoss=0 touch=0 turn=.18 volume=3 | bloom | hymn | Web keys that come up through a second, near to pure | pad
Slow lift, mirrored | Glass keys | swell=.4 solid=Tetrahedron hardness=.6 turn=.9 width=1 release=2.5 edge=4 volume=-0.5 | fan | tenths | Tetrahedron keys easing in while they spin | pad
Doll's house piano | Glass keys | decay=2 release=.2 hardness=.5 pluck=.2 shell=.9 sympathy=0 edge=3 contact=.2 ear=0 touch=0 volume=-1.5 | smaller | grace | Short prism keys with a full boxy case
Abacus | Glass keys | solid=Ring decay=8 release=.15 hardness=.25 sympathy=0 contact=.04 wire=.6 edge=2 shade=.1 ear=.35 cornerLoss=.3 volume=2 | strikes | knock | Clicked ring keys, small and soon over
Wind-up sparrow | Glass keys | solid=Octahedron decay=6 release=1 hardness=.5 pluck=.15 wire=.8 shade=.18 turn=.2 sympathy=.1 cornerLoss=.38 volume=-2 | glaze | answer | Little octahedron keys near the corner, quick and bright | bell
Dominoes | Glass keys | solid=Cube decay=1.4 release=.2 hardness=.4 shell=.95 contact=.4 wire=.3 sympathy=0 ear=.55 cornerLoss=.5 touch=.22 volume=0 | pot | knock | Cube keys of gut in the fullest case, knocked over one by one
Pocket change | Glass keys | solid=Prism decay=2.5 release=.5 hardness=.45 true=.3 contact=.08 edge=4 turn=.7 sympathy=0 cornerLoss=.4 wire=.35 volume=3 | scooped | grace | Small half-gut prism keys, chinking and short
Cellar bar, late set | Glass keys | hardness=.3 shade=.5 wire=.3 decay=14 release=.6 width=.3 ear=.8 volume=6 | combo 1.output=4 | tenor | Prism keys from the dark side, low and narrow
Felted twice over | Glass keys | solid=Ring hardness=0 shade=.3 wire=.4 decay=18 release=.8 pluck=.5 contact=.1 ear=.55 cornerLoss=.55 touch=0 shell=.5 volume=5.5 | thick | sixths | Ring keys under the softest hammer there is
Grey piano, grey sea | Glass keys | solid=Octahedron hardness=.3 shade=.55 decay=30 release=2 ear=.9 sympathy=.2 edge=6 cornerLoss=.65 turn=.12 swell=0.2 volume=0 | fog | contrary | Octahedron keys heard from the darkest face
Shop shut for winter | Glass keys | solid=Web shade=.4 hardness=.2 true=1 decay=10 release=1 wire=.25 shell=.7 ear=.65 touch=0 volume=1.5 | hiss | chorale | Web keys of gut, pure and dull in their case
Keys on a brass hook | Glass keys | solid=Tetrahedron shade=.45 hardness=.5 decay=8 release=.5 touch=.15 contact=.35 edge=2 width=.4 ear=.6 cornerLoss=.5 shell=.48 volume=2 | nextdoor | answer | Dark tetrahedron keys, knuckly and near
`,
    },
    {
      id: 'frame-drones',
      name: 'Drones in the frame',
      category: 'drone',
      rows: `
Floor of the observatory | Tetra drone | swell=1.8 turn=.1 hardness=.75 release=6 edge=2 shade=.3 ear=.9 touch=0 wire=.85 pluck=.12 solid=Prism volume=-0.5 | cavern | ground | A prism bowed firmly, from its dark face, over every wire of its frame
Four winds at rest | Tetra drone | sympathy=.6 hardness=.75 edge=4 swell=1 turn=.2 release=4 pluck=.2 ear=.05 cornerLoss=.5 touch=0 | airy | stone | A hard bow near the corner of a tetrahedron, half its frame awake
Prayer wheel hub | Tetra drone | true=1 hardness=.6 swell=2 turn=.5 width=1 shade=.25 release=10 touch=0 shell=.7 exciter=Breath contact=.25 edge=4 solid=Cube | bowls | quartal | A cube wholly in tune, blown firmly as it goes round
Frontier post | Tetra drone | true=.1 hardness=.85 sympathy=.4 swell=1.4 edge=6 release=5 wire=.8 ear=0 cornerLoss=.05 touch=0 volume=3 | comb | ground | A tetrahedron bowed hard and left to its own tuning
Tallow and rope | Tetra drone | wire=.1 shade=.5 hardness=.55 swell=1.2 release=5 shell=.8 sympathy=.7 ear=.95 volume=-1 | larger | stone | Dark gut tetrahedron, bowed and deeply hollow
Lake without a ripple | Tetra drone | solid=Octahedron swell=2.2 hardness=.35 turn=.01 sympathy=.7 edge=2 release=8 ear=.45 touch=0 shell=.65 volume=-3.5 | keysheld | fifths | A bowed octahedron, its fourth and octave perfectly still
Bronze age morning | Tetra drone | solid=Octahedron hardness=.9 swell=1.2 sympathy=.5 shade=.02 edge=5 release=5 true=.7 ear=0 cornerLoss=.05 touch=0 volume=-0.5 | howl | ground | An octahedron under a pressed bow, all its tones standing up
Straw on a stable floor | Tetra drone | solid=Octahedron contact=.6 hardness=.4 swell=.8 wire=.35 release=3 sympathy=.3 cornerLoss=.5 touch=0 volume=-0.5 | reel | suspended | A half-soft octahedron under a hairy, unhurried bow
Slow tug upriver | Tetra drone | solid=Octahedron shade=.4 swell=1.6 cornerLoss=.7 turn=.3 release=7 decay=20 hardness=.5 touch=0 shell=.7 volume=-0.5 | currents | ground | The loops of a shaded octahedron under a steady bow
Above the tree line | Tetra drone | solid=Octahedron width=1 hardness=.75 swell=3 release=14 pluck=.1 edge=3 turn=.12 ear=.4 cornerLoss=.35 true=.95 wire=.85 volume=3 | valley | fifths | A wide bright octahedron, nearly pure, that takes three seconds to stand
Weaver's long string | Tetra drone | solid=Ring hardness=.85 swell=.8 sympathy=.6 turn=.08 release=4 edge=2 ear=.5 touch=0 shell=.15 pluck=.12 wire=.85 volume=-1 | buzz | ground | A hard-bowed steel ring, a plain row of harmonics and its halo
Harmonics going by | Tetra drone | solid=Ring hardness=.35 swell=1.8 turn=.7 pluck=.15 release=6 wire=.9 sympathy=.4 cornerLoss=0 touch=0 shell=.05 volume=-2.5 | whistled | stone | A steel ring whose harmonics pass one by one as it turns
Beeswax | Tetra drone | solid=Ring shade=.45 hardness=.3 swell=1.4 wire=.3 release=5 shell=.7 true=1 cornerLoss=0 touch=0 volume=-2.5 | padbehind | hymn | A soft dark ring, even and in tune
Quarry at knocking-off | Tetra drone | solid=Ring hardness=.9 edge=5 true=.2 swell=.6 release=3 contact=.5 sympathy=.3 ear=.1 cornerLoss=.6 | grit | ground | A ring under a hard rasping bow, its octaves beating
String across the valley | Tetra drone | solid=Ring exciter=Finger swell=.3 hardness=.5 release=16 decay=40 sympathy=.9 pluck=.3 ear=.3 shell=.48 volume=6 | open | ground | Single ring plucks holding up a frame that rings for miles
Vault of the glassworks | Tetra drone | solid=Cube hardness=.75 swell=2 sympathy=.8 edge=3 release=8 shade=.1 ear=.4 touch=0 true=.1 volume=-2.5 | crypt | stone | A cube bowed firmly and left uneven, hollow and broad over its own ringing wires
Power house, humming | Tetra drone | solid=Cube hardness=.8 true=0 swell=1 shade=.3 sympathy=.2 release=3 edge=5 turn=.15 ear=.7 touch=0 | shifted | ground | An untuned cube bowed hard, beating with itself
Sluice gear turning | Tetra drone | solid=Prism hardness=.75 swell=.9 true=.95 release=4 turn=.35 edge=5 sympathy=.5 cornerLoss=0 touch=0 shell=.5 volume=2 | cloudphase | suspended | A firmly bowed prism drawn to pure intervals, wheeling slowly
Salt lake, white sky | Tetra drone | solid=Prism hardness=.2 wire=1 shade=0 swell=3.2 release=12 edge=4 contact=.05 ear=.35 touch=0 | frost | fifths | A thin pale prism, bowed as lightly as it will speak
Smoke in the rafters | Tetra drone | solid=Prism shade=.55 swell=2.4 hardness=.6 turn=.4 cornerLoss=.6 release=6 sympathy=.3 | glacialfilter | stone | A dark leaking prism curling round slowly
Engine room of the moon | Tetra drone | solid=Web hardness=.6 swell=1.8 true=.3 shade=.3 release=6 sympathy=.3 edge=2 ear=.75 touch=0 shell=.55 volume=-1 | tunnel | ground | A bowed web, uneven and close, a machine a long way down
Chimney full of bees | Tetra drone | solid=Web hardness=.6 swell=.7 true=.1 wire=.8 release=2.5 sympathy=.1 turn=.6 cornerLoss=.4 shade=.5 shell=.9 pluck=.8 edge=6 volume=5.5 | ensemble | single | A dark web bowed firmly in a full case, buzzing as it turns
Wheatfield transformer | Tetra drone | solid=Web true=1 hardness=.4 swell=1.4 edge=4 shade=.2 release=5 sympathy=.6 cornerLoss=.1 touch=0 volume=0.5 | bandbeat | quartal | A web bent to open intervals, steady and wide
Slow rust | Tetra drone | solid=Web hardness=.5 cornerLoss=1 swell=2.6 shell=.9 decay=12 release=8 sympathy=.2 ear=.35 touch=0 volume=-1.5 | dissolve | ground | A web in a full case with every corner leaking
Flittermouse | Tetra drone | solid=Web shade=.7 hardness=.7 swell=1.2 wire=.4 release=4 edge=6 sympathy=.4 ear=1 volume=5.5 | haze | singlelow | A dark web under the bow, closer to a hum than a tone
Pylons at first sun | Tetra drone | exciter=Breath hardness=.75 swell=1.2 shade=.05 release=5 edge=2 sympathy=.6 ear=.05 touch=0 shell=.1 | fifths 1.mix=0.25 | stone | A bright hard breath on a tetrahedron, its frame alight
Long horn of the valley | Tetra drone | exciter=Breath solid=Ring hardness=.9 swell=.5 release=3 pluck=.4 shade=.1 sympathy=.4 ear=0 touch=0 shell=.65 | far | ground | A ring blown hard and long
Shepherds' reply | Tetra drone | exciter=Breath solid=Cube hardness=.55 contact=.4 swell=.4 turn=.25 release=6 true=.9 cornerLoss=.1 touch=0 volume=-1.5 | canon | answer | A cube blown in tune, turning toward and away | wind
Harmonium with stuck key | Tetra drone | exciter=Breath solid=Prism hardness=.4 swell=1.6 wire=.95 shade=0 release=9 edge=5 ear=.1 touch=0 shell=.2 | twinkle | suspended | A prism on a long thin breath that will not stop | organ
Goatskin and drone | Tetra drone | exciter=Breath solid=Cube hardness=.95 contact=.3 swell=.3 true=.3 release=1 touch=.2 shell=.8 ear=0 cornerLoss=.05 | combo | ground | A touched cube blown as hard as it goes, nasal and steady
Lungs of the cathedral | Tetra drone | exciter=Breath shade=.5 hardness=.45 contact=.5 swell=2.4 release=10 shell=.9 ear=.55 touch=0 volume=-1.5 | nave | stone | A dark wide breath through a tetrahedron in a deep case
Cloud on the summit | Tetra drone | exciter=Breath solid=Octahedron shade=.4 hardness=.25 contact=.7 swell=3 release=12 turn=.03 ear=.65 cornerLoss=.4 touch=0 | blur | quartal | An airy octahedron, dim and slow, hardly a pitch at first
Coast with its eyes shut | Tetra drone | exciter=Breath solid=Web shade=.45 hardness=.4 contact=.8 swell=1.8 release=7 cornerLoss=.5 touch=0 volume=5 | swell | tenths | Dark air in a leaking web, a swell that does not break | texture
Submarine choir | Tetra drone | exciter=Breath solid=Ring shade=.5 hardness=.6 shell=1 swell=1.2 release=5 edge=3 contact=.2 ear=.6 cornerLoss=.6 touch=0 | diver | hymn | A dark ring sung through the fullest case | voice
Moth-eaten flag | Tetra drone | exciter=Breath solid=Prism hardness=.5 contact=.9 swell=1.4 shade=.3 turn=.8 release=4 true=.2 volume=2.5 | hiss | suspended | A fraying breath on an untuned prism, flapping as it turns | texture
Rails after the train | Tetra drone | exciter=Finger swell=.8 hardness=.6 release=18 decay=40 wire=.9 shade=.05 edge=2 ear=.35 touch=0 shell=0 volume=-3 | frozen | rise | Plucks with no front on steel, and the rails singing on
Bell that never struck | Tetra drone | exciter=Hammer solid=Cube swell=2.2 hardness=.7 true=.2 release=16 sympathy=.8 decay=36 ear=.05 touch=0 | slowhall | stone | A struck cube with its strike taken away, beating as it rises
Pond under the pond | Tetra drone | exciter=Finger solid=Octahedron swell=3.4 shade=.4 hardness=.4 release=14 turn=.08 decay=36 cornerLoss=.35 touch=0 volume=-2 | halved | fifths | Deep octahedron plucks that surface after three seconds
Gong hung in water | Tetra drone | exciter=Hammer solid=Web swell=1.2 hardness=.5 release=12 sympathy=.5 shade=.35 true=.4 ear=.7 touch=0 shell=.55 volume=1 | wax | ground | A web struck low behind a slow front
Candle in each corner | Tetra drone | exciter=Finger solid=Prism swell=1.6 hardness=.5 true=.9 release=12 edge=5 turn=.2 sympathy=.9 ear=.5 cornerLoss=.5 volume=-0.5 | held | hymn | Prism plucks fading up into their halo, nearly in tune
Merry-go-round, unmanned | Tetra drone | turn=1.2 width=1 swell=1 hardness=.5 sympathy=.4 edge=3 release=4 touch=0 | chorale | tenths | A tetrahedron going round faster than once a second
Solstice and back | Tetra drone | solid=Octahedron turn=.9 width=.9 hardness=.7 shade=.1 swell=2 release=8 cornerLoss=.05 touch=0 shell=.1 volume=-3 | tide | stone | An octahedron drone swinging from bright to dark each second
Fireflies over bog | Tetra drone | solid=Prism turn=2 hardness=.5 wire=1 shade=.05 swell=2.6 release=9 sympathy=.5 touch=0 | glimmer | quartal | A bowed prism flickering at two turns a second over its halo
Dervish, very slowly | Tetra drone | solid=Ring turn=.35 width=1 ear=.5 hardness=.8 swell=1.2 release=5 edge=4 cornerLoss=.1 touch=0 volume=5.5 | circle | suspended | A hard-bowed ring turning once in three seconds
Carding machine | Tetra drone | solid=Web turn=1.5 hardness=.65 contact=.5 swell=.5 release=2 sympathy=.1 shade=.2 volume=4.5 | slowing | single | A web going round fast under a rough bow | texture
Border radio | Tetra drone | hardness=.7 shade=.2 swell=.6 release=2 touch=.3 sympathy=.5 edge=2 ear=.45 volume=2.5 | night | ground | A touched tetrahedron bowed hard, thin and far down the dial
Iron kettle, iron lid | Tetra drone | solid=Cube shell=1 contact=.5 hardness=.6 swell=.4 release=1.5 wire=.4 sympathy=.2 ear=.9 touch=.2 volume=-2.5 | tin | ground | A cube bowed roughly, heard from its dark face
Tunnel under the fair | Tetra drone | solid=Prism shade=.35 hardness=.75 swell=1 true=.15 release=4 edge=6 sympathy=.3 cornerLoss=.1 touch=0 shell=.48 volume=-2 | notch | tenths | A crooked prism bowed firmly, a hollow passing through it
Hermit's one chord | Tetra drone | touch=.45 sympathy=1 hardness=.5 swell=.8 release=12 edge=4 turn=.12 ear=.55 | ringed | quartal | A damped tetrahedron, its halo standing well before the bow
Threshing floor, night | Tetra drone | solid=Octahedron touch=.2 contact=.7 hardness=.85 swell=.5 release=2 shade=.3 wire=.3 ear=.95 cornerLoss=.35 volume=3.5 | folded | ground | A rough bow on touched gut, dry and grainy
`,
    },
    {
      id: 'muted-corners',
      name: 'Muted corners',
      category: 'plucked',
      rows: `
Clothes peg harp | Muted lantern | touch=.35 edge=2 hardness=.45 release=.8 sympathy=.2 shell=.5 turn=.15 ear=0 volume=-4.5 | forward | rocking | An octahedron with a light peg on one corner, short and clear
Cork on a string | Muted lantern | touch=.6 hardness=.35 contact=.4 decay=10 sympathy=.1 wire=.4 release=.2 ear=.55 cornerLoss=.38 volume=-1 | middle | knock | Half-gut wire stopped hard by one finger, round and dry
Counting beans | Muted lantern | touch=.9 hardness=.7 pluck=.2 sympathy=.3 edge=5 decay=24 width=1 turn=.13 volume=2 | pebble | knock | A corner pressed nearly still, more tick than tone
Starling alights | Muted lantern | touch=.25 hardness=.6 edge=6 wire=.95 shade=0 release=2 decay=30 turn=.3 volume=0 | stars | grace | A light touch on bright steel, most of its tones left to ring
Leather and dew | Muted lantern | touch=.5 hardness=.2 shade=.3 pluck=.9 sympathy=.4 release=1 ear=.7 cornerLoss=.45 volume=-2 | gatefilter | contrary | Soft plucks mid-edge with a corner held, dark and damp
Walking past railings | Muted lantern | solid=Ring touch=.4 hardness=.65 pluck=.15 decay=14 sympathy=.2 ear=.35 volume=1 | dotted | rocking | A ring stopped at a corner and plucked hard, running along
Wooden spoon, wire rack | Muted lantern | solid=Ring touch=.55 wire=.25 hardness=.4 contact=.5 release=.3 shell=1 sympathy=0 ear=.4 cornerLoss=.4 volume=1.5 | mike | knock | Muted gut ring in the fullest case, kitchen-dry
Net curtain morning | Muted lantern | solid=Ring touch=.2 hardness=.3 edge=4 decay=26 release=2.5 shade=.05 turn=.08 volume=6 | crystals 1.mix=0.18 | fall | A barely touched ring, its harmonics thinned and shining
Nails in a jam jar | Muted lantern | solid=Ring touch=.65 hardness=.62 wire=1 pluck=.1 decay=20 release=1.2 edge=2 contact=.1 ear=.1 turn=.11 volume=1 | jar | grace | Hard steel at the corner of a stopped ring, glassy ticks
Palm laid on the ring | Muted lantern | solid=Ring touch=.55 hardness=.5 shade=.2 sympathy=.8 release=3 edge=6 contact=.08 ear=.35 cornerLoss=.1 volume=4 | embers | rise | A ring all but silenced, its halo louder than its string
Four matchsticks | Muted lantern | solid=Tetrahedron touch=.45 hardness=.5 decay=8 release=.3 sympathy=.1 edge=2 ear=.45 volume=0 | tile | knock | A tetrahedron with one corner held, brisk and small
Pulley and bucket | Muted lantern | solid=Tetrahedron touch=.3 hardness=.75 wire=.8 edge=5 release=1.2 turn=.6 sympathy=.2 cornerLoss=.55 volume=0 | hops | grace | Touched steel tetrahedron swinging as it is pulled
Guy rope slackened | Muted lantern | solid=Tetrahedron touch=.55 hardness=.3 shade=.35 wire=.3 pluck=.8 release=.6 sympathy=.5 cornerLoss=.45 volume=2 | recall | sixths | A damped gut tetrahedron, soft under a shade
Trellis | Muted lantern | solid=Tetrahedron touch=.2 true=.1 hardness=.6 edge=6 decay=22 release=1.8 shell=.4 ear=.5 turn=.15 volume=4.5 | harmonic | fall | Lightly held and left untuned, its tones beating
Bolt and washer | Muted lantern | solid=Tetrahedron touch=.7 hardness=.65 contact=.5 decay=12 pluck=.1 sympathy=0 ear=0 cornerLoss=.4 shade=.22 volume=-0.5 | slap | knock | A tetrahedron pressed hard at the corner, blunt metal
Metronome, felt foot | Muted lantern | exciter=Hammer solid=Cube touch=.4 hardness=.4 decay=6 release=.4 sympathy=.2 ear=.3 volume=-1.5 | strikes | rocking | A muted cube under a hammer, hollow and even | keys
Slate roof, first drops | Muted lantern | exciter=Hammer solid=Prism touch=.3 hardness=.55 edge=5 decay=5 sympathy=.3 contact=.1 ear=.35 cornerLoss=.38 volume=1 | stone | grace | A touched prism tapped here and there | bell
Little door, little bird | Muted lantern | exciter=Hammer solid=Ring touch=.5 hardness=.65 wire=.45 shell=.95 release=.5 edge=2 cornerLoss=.5 volume=2 | wood | answer | A stopped ring struck in a full case, hollow as a little door | keys
Latch of the hen house | Muted lantern | exciter=Hammer solid=Octahedron touch=.65 hardness=.8 decay=9 contact=.35 sympathy=.15 edge=4 ear=0 cornerLoss=.65 volume=-0.5 | shells | knock | An octahedron held hard and struck hard, all knock | keys
Stitched by hand | Muted lantern | exciter=Hammer solid=Tetrahedron touch=.25 hardness=.2 release=1 edge=6 shade=.05 sympathy=.4 ear=.4 cornerLoss=.55 wire=1 pluck=.9 volume=1 | double | sixths | Soft blows on a lightly held steel tetrahedron | keys
Bars of driftwood | Prism marimba | hardness=.5 edge=2 release=.5 shade=.1 decay=6 sympathy=.05 ear=.3 touch=.25 wire=.05 cornerLoss=.6 pluck=.3 true=.2 volume=-2 | bare | rocking | Crooked bars of gut prism under a firm head, dry and woody | keys
Jetty at noon | Prism marimba | hardness=.45 wire=.35 shade=.05 pluck=.5 decay=8 turn=.4 release=1.5 width=1 cornerLoss=.5 touch=.2 volume=1.5 | pan 1.depth=0.6 | rise | Prism bars struck with a firmer head, turning as they ring | keys
Hollow log, two players | Prism marimba | solid=Cube shell=1 hardness=.2 decay=5 edge=4 release=.4 contact=.45 cornerLoss=.65 touch=.25 volume=-1 | orbit | knock | A cube of gut in the fullest case, struck like a log | keys
Canoe tied to a root | Prism marimba | solid=Tetrahedron hardness=.25 shade=.3 decay=14 edge=3 release=2 true=.9 ear=.85 cornerLoss=.05 touch=0 volume=0.5 | amptrem | sixths | Soft pure tetrahedron bars, wooden and slow | keys
Rain gauge | Prism marimba | solid=Octahedron wire=.3 hardness=.5 shade=0 decay=4 release=.6 pluck=.3 sympathy=.3 ear=.5 cornerLoss=.45 volume=2.5 | loop | rocking | Octahedron bars of half gut, light and quick | keys
Boots in the porch | Muted lantern | wire=.15 shade=.35 touch=.4 hardness=.4 decay=7 sympathy=0 width=.3 release=.3 ear=.95 volume=-3.5 | floor | walk | A muted gut octahedron pulled low | bass
Turf cutter | Muted lantern | solid=Ring wire=.2 touch=.3 hardness=.6 shade=.3 pluck=.6 sympathy=.1 contact=.2 ear=.85 cornerLoss=.4 volume=1.5 | suboctave 1.sub1=0.5 | lowline | A touched gut ring pulled low and thick | bass
Sack barrow | Muted lantern | solid=Prism touch=.35 hardness=.55 shade=.45 decay=9 sympathy=.1 width=.2 edge=5 pluck=.6 cornerLoss=.55 volume=2.5 | combo | walk | A prism held at one corner, low, blunt and quick | bass
Rope through a block | Muted lantern | solid=Tetrahedron touch=.2 wire=.35 shade=.4 hardness=.5 release=1 sympathy=.3 width=.5 ear=.65 cornerLoss=.38 volume=1.5 | stairwell | tenor | Low damped tetrahedron, half gut, slow to leave | bass
Badger under the shed | Muted lantern | exciter=Hammer wire=.3 touch=.5 shade=.5 hardness=.35 decay=8 contact=.3 sympathy=.2 ear=.75 cornerLoss=.65 volume=0.5 | darkbox | stone | A muted octahedron struck softly and low | bass
Drowned orchard | Muted lantern | sympathy=1 touch=.85 release=10 decay=34 shade=.2 hardness=.4 ear=.45 volume=6 | cave | fall | A plucked corner that gives nothing but its halo
Wires remember | Muted lantern | sympathy=.9 solid=Cube touch=.45 hardness=.6 release=14 edge=5 turn=.1 ear=.55 cornerLoss=0 volume=0.5 | common | toll | A damped cube, and the frame holding what was played
Fence posts singing | Muted lantern | sympathy=.85 solid=Tetrahedron touch=.7 hardness=.3 release=8 shade=.1 contact=.1 volume=3 | choirhall | hymn | A stopped tetrahedron plucked softly under a tall halo
Aviary at feeding time | Muted lantern | sympathy=.8 solid=Prism touch=.3 hardness=.8 turn=.9 release=6 edge=2 shade=0 cornerLoss=0 volume=6 | scatter | fall | Touched prism plucked hard, its bright halo wheeling
Gate that swings true | Muted lantern | sympathy=.75 solid=Tetrahedron touch=.5 true=1 release=12 hardness=.5 shade=.15 ear=.45 volume=1 | fifths 1.mix=0.22 | quartal | A muted tetrahedron with pure fifths left in the air
Two postmen | Muted lantern | touch=.4 edge=4 hardness=.8 sympathy=.1 release=.5 turn=.5 width=1 solid=Cube pluck=.1 volume=1.5 | canon 1.mix=0.35 | answer | Muted cube plucks near a corner, hard and hollow
Pigeon post | Muted lantern | solid=Prism touch=.35 hardness=.5 decay=9 edge=6 sympathy=.2 release=.8 ear=.4 cornerLoss=.5 volume=2 | backwards | rocking | A prism held at a corner and plucked evenly
Two stations away | Muted lantern | touch=.5 wire=.5 hardness=.45 shade=.25 sympathy=.2 release=1.5 pluck=.6 cornerLoss=.55 volume=0 | trail | knock | Muted octahedron plucks, warm and a long way off
Ladder in the rain | Muted lantern | solid=Cube touch=.3 hardness=.7 pluck=.15 wire=.85 sympathy=.1 shade=.02 ear=.35 cornerLoss=.38 volume=-5.5 | stack | rise | A touched steel cube plucked by its corner
Nine pins | Muted lantern | solid=Web touch=.4 hardness=.4 decay=6 contact=.4 sympathy=.1 true=.7 ear=.35 cornerLoss=0 volume=-0.5 | darkecho | rocking | Muted web plucks, tuned nearly pure, scuffed and short
Wool over wires | Muted lantern | swell=.2 touch=.3 hardness=.4 release=2 shade=.2 sympathy=.5 decay=26 ear=.5 turn=.015 volume=0 | weave | tenths | A lightly touched octahedron with its front taken off
Frost flowers opening | Muted lantern | swell=.6 touch=.2 solid=Prism hardness=.6 release=5 wire=1 shade=0 turn=.3 sympathy=.8 cornerLoss=.5 volume=0.5 | glasshalo | suspended | Touched steel prism opening over half a second | pad
Lantern carried past | Muted lantern | exciter=Bow swell=.2 touch=.35 hardness=.5 contact=.3 release=1.2 turn=.4 volume=6 | steps | line | A bowed octahedron with one corner covered, veiled | string
Crank and catgut | Muted lantern | exciter=Bow solid=Ring touch=.25 hardness=.75 contact=.6 swell=.05 release=.3 pluck=.2 ear=0 cornerLoss=.6 turn=.02 shade=.25 volume=1.5 | paper | line | A touched ring under a hard bow, nasal and rough | string
Reed and thumb | Muted lantern | exciter=Breath solid=Ring touch=.45 hardness=.7 contact=.35 swell=.08 release=.5 pluck=.7 ear=.1 turn=.03 volume=2.5 | thin | answer | A stopped ring blown hard, small and reedy | wind
Bottle bank at dawn | Muted lantern | exciter=Breath solid=Cube touch=.4 hardness=.5 contact=.6 swell=.15 release=1 shell=1 ear=.55 volume=2 | pot | grace | A held cube blown with plenty of air, hollow | wind
Paper lantern, out | - | touch=.55 solid=Octahedron decay=3 release=.3 hardness=.3 contact=.5 shade=.3 sympathy=.1 ear=.6 cornerLoss=.4 volume=-1 | fog | sixths | Soft damped plucks that go out as soon as they are lit
Umbrella ribs | - | solid=Tetrahedron touch=.3 hardness=.7 pluck=.08 decay=5 release=.4 wire=.8 turn=1.5 width=1 cornerLoss=.45 volume=1 | twinkle | rise | Touched tetrahedron spinning fast under hard fingers
Sundial at midnight | - | solid=Cube touch=.15 hardness=.35 pluck=.75 sympathy=.6 release=6 shade=.35 edge=3 ear=.7 volume=0.5 | padbehind | toll | A cube with the lightest finger on it, dark and long
Egg timer | - | solid=Ring exciter=Hammer touch=.45 decay=18 release=.8 hardness=.45 contact=.08 edge=3 pluck=.3 wire=.6 ear=.05 cornerLoss=.2 shade=.3 volume=2 | smaller | knock | A stopped ring tapped lightly, tiny and exact | keys
`,
    },
  ],
}
