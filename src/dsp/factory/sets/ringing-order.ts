import { type InstrumentSet } from './set'

// Laid out by who rings and how far one ringer reaches into the next: from rows
// that melt to rows told one by one. Each direction is ten corners of the
// instrument, five presets to each, and the five part by order, series and room.

export const SET: InstrumentSet = {
  device: 'ringing-order',
  names: {
    method: ['Rounds', 'Hunt', 'Treble', 'Dodge', 'Contrary', 'Long'],
    voice: ['Bell', 'Reed', 'Glass', 'Plucked', 'Breath', 'Hum'],
    series: ['Low', 'Odd', 'Fifths', 'High', 'Chord tones'],
    tower: ['Together', 'Canon', 'Opposed', 'In turn'],
  },
  chains: {
    // Dry and close.
    bare: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Open', params: { clear: 0.2 } }],
      words: ', close and dry',
    },
    booth: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.16 } }],
      words: ', in a small dull booth',
    },
    sides: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Wide' },
        { deviceId: 'tamer', preset: 'Gentle' },
      ],
      words: ', dry and opened to the sides',
    },
    narrow: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Narrow' },
        { deviceId: 'ambient-eq', preset: 'Warm' },
      ],
      words: ', dry, narrow and warm',
    },
    table: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.22 } }],
      words: ', in a short room',
    },
    chamber: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } }],
      words: ', in a tight chamber',
    },
    stub: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Tight room' }],
      words: ', on a short dull plate',
    },
    shade: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Shaded' },
        { deviceId: 'spread', preset: 'Soft tilt' },
      ],
      words: ', dry with its top in the shade',
    },
    lit: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Bright', params: { presence: 1.5, air: 3 } },
        { deviceId: 'spread', preset: 'Hazy edges' },
      ],
      words: ', dry and lit from above',
    },
    muffled: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Muffled' }],
      words: ', dry and muffled',
    },
    thinned: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Thin', params: { highCut: 6000 } },
        { deviceId: 'stereo-widener', preset: 'Normal' },
      ],
      words: ', dry, with its floor taken away',
    },
    floor: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 6 } },
        { deviceId: 'saturator', preset: 'Warm glue' },
      ],
      words: ', dry, with its floor deepened',
    },
    firm: {
      effects: [
        { deviceId: 'ambient-comp', preset: 'Glue' },
        { deviceId: 'spread', preset: 'Firm and airy' },
      ],
      words: ', levelled, firm in the middle',
    },
    tamed: {
      effects: [
        { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', its blows evened, in a plain room',
    },
    edges: {
      effects: [{ deviceId: 'stereo-detune', preset: 'Soft halo' }],
      words: ', dry with a soft double',
    },
    doubled: {
      effects: [
        { deviceId: 'stereo-detune', preset: 'Doubled' },
        { deviceId: 'ambient-eq', preset: 'Keys' },
      ],
      words: ', dry and widely doubled',
    },
    wideends: {
      effects: [{ deviceId: 'spread', preset: 'Wide ends' }],
      words: ', dry, wide at both ends',
    },
    reel: {
      effects: [{ deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.08 } }],
      words: ', on quarter inch tape',
    },
    cassette: {
      effects: [{ deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.15 } }],
      words: ', on a four track cassette',
    },
    blanket: {
      effects: [{ deviceId: 'tape', preset: 'Under a blanket' }],
      words: ', under a blanket of tape',
    },
    oldreel: {
      effects: [
        { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.2, wobble: 0.3 } },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.12 } },
      ],
      words: ', on a worn cassette in a booth',
    },
    iron: {
      effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }],
      words: ', dry through warm iron',
    },
    valve: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Triode glow' },
        { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.14 } },
      ],
      words: ', through a valve and a short plate',
    },
    grit: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Parallel grit', params: { highCut: 6000 } },
        { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 6000 } },
      ],
      words: ', with soft grit beside it',
    },
    fuzz: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Dark fuzz' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', through dark fuzz in a room',
    },
    tube: {
      effects: [{ deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 9 } }],
      words: ', dry through a driven tube',
    },
    combo: {
      effects: [{ deviceId: 're-amp', preset: 'Combo in a room', params: { noise: 0 } }],
      words: ', from an amplifier in a room',
    },
    pillow: {
      effects: [{ deviceId: 're-amp', preset: 'Pillow speaker', params: { output: 2, noise: 0 } }],
      words: ', from a speaker under a pillow',
    },
    stack: {
      effects: [
        { deviceId: 're-amp', preset: 'Warm stack', params: { noise: 0 } },
        { deviceId: 'spread', preset: 'Wide pad' },
      ],
      words: ', from a warm wall of speakers',
    },
    wood: {
      effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.45 } }],
      words: ', inside a wooden body',
    },
    pot: {
      effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.6 } }],
      words: ', inside a clay pot',
    },
    cistern: {
      effects: [{ deviceId: 'vessel', preset: 'Cistern', params: { air: 0, mix: 0.5 } }],
      words: ', down in a cistern',
    },
    tubed: {
      effects: [
        { deviceId: 'imprint', preset: 'Hollow tube', params: { amount: 0.9 } },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.12 } },
      ],
      words: ', pressed into a hollow tube',
    },
    vowel: {
      effects: [
        { deviceId: 'imprint', preset: 'Round vowel' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', shaped to a round vowel',
    },
    box: {
      effects: [{ deviceId: 'imprint', preset: 'Dark box', params: { replace: 0.3 } }],
      words: ', in a dark box',
    },
    disc: {
      effects: [
        { deviceId: 'vinyl', preset: 'New pressing', params: { surface: 0.2, crackle: 0.18 } },
      ],
      words: ', on a freshly pressed record',
    },
    parlour: {
      effects: [
        { deviceId: 'vinyl', preset: 'Dull stylus' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', under a dull stylus in a room',
    },
    sampler: {
      effects: [{ deviceId: 'patina', preset: 'Early sampler', params: { noise: 0.05 } }],
      words: ', in an early sampler',
    },
    glaze: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Glaze' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', under a twelve bit glaze',
    },
    little: {
      effects: [
        { deviceId: 'size', preset: 'Smaller' },
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.16 } },
      ],
      words: ', in a smaller body',
    },
    larger: {
      effects: [
        { deviceId: 'size', preset: 'Larger' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', in a larger body',
    },
    paper: {
      effects: [{ deviceId: 'buzzing-bridge', preset: 'Paper edge' }],
      words: ', dry with a paper edge',
    },
    bridge: {
      effects: [
        {
          deviceId: 'buzzing-bridge',
          preset: 'Harp on a bridge',
          params: { mix: 0.6, tone: 5000 },
        },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', on a faintly buzzing bridge',
    },
    pick: {
      effects: [
        { deviceId: 'swell', preset: 'Soft pick' },
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.18 } },
      ],
      words: ', each touch a little eased',
    },
    bowed: {
      effects: [
        { deviceId: 'swell', preset: 'Slow attack' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', each touch faded in',
    },
    felt: {
      effects: [{ deviceId: 'sift', preset: 'Felt and air' }],
      words: ', with felt over every blow',
    },
    hammers: {
      effects: [
        { deviceId: 'sift', preset: 'Soft hammers' },
        { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.16 } },
      ],
      words: ', its blows softened, in a chamber',
    },
    // What moves.
    chorale: {
      effects: [{ deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.1 } }],
      words: ', through slow rotors',
    },
    rotor: {
      effects: [{ deviceId: 'rotary', preset: 'Across the room' }],
      words: ', through rotors across the room',
    },
    quickrotor: {
      effects: [{ deviceId: 'rotary', preset: 'Tremolo', params: { drive: 0.08, hornDepth: 0.4 } }],
      words: ', through quick rotors',
    },
    ensemble: {
      effects: [{ deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.4 } }],
      words: ', in a lush ensemble',
    },
    drift: {
      effects: [
        { deviceId: 'chorus', preset: 'Slow drift' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', in a slow drifting chorus',
    },
    deepsea: {
      effects: [
        { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.2 } },
      ],
      words: ', deep in a slow chorus and a dark hall',
    },
    swirl: {
      effects: [
        { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.42 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', in a slow swirl',
    },
    glacier: {
      effects: [
        {
          deviceId: 'flanger',
          preset: 'Glacial drift',
          params: { rate: 0.08, feedback: 25, mix: 0.36 },
        },
      ],
      words: ', in a slow comb that drifts',
    },
    notch: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Slow notch' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
      ],
      words: ', a slow notch passing through',
    },
    sweep: {
      effects: [
        {
          deviceId: 'auto-filter',
          preset: 'Glacial low-pass',
          params: { lfoRateHz: 0.12, driveDb: 0 },
        },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', under a slow low pass in a hall',
    },
    touchgate: {
      effects: [
        {
          deviceId: 'auto-filter',
          preset: 'Low-pass gate',
          params: { envAmount: 70, envReleaseMs: 900, resonance: 0.8 },
        },
      ],
      words: ', a filter opened by each touch',
    },
    highpass: {
      effects: [
        {
          deviceId: 'auto-filter',
          preset: 'Falling high-pass',
          params: { lfoRateHz: 0.25, resonance: 1 },
        },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: ', thinned in slow falls on a plate',
    },
    pan: {
      effects: [{ deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.3 } }],
      words: ', passing slowly from side to side',
    },
    harmtrem: {
      effects: [
        { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { depth: 0.6 } },
        { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.18 } },
      ],
      words: ', shimmering in a chamber',
    },
    amptrem: {
      effects: [
        { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.4, rate: 3.6 } },
        { deviceId: 'spring-reverb', preset: 'Hint of spring' },
      ],
      words: ', with a tremolo and a hint of spring',
    },
    tiltone: {
      effects: [{ deviceId: 'tremolo', preset: 'Tilting tone' }],
      words: ', tilting between low and high',
    },
    water: {
      effects: [{ deviceId: 'currents', preset: 'Slow water', params: { rate: 0.16 } }],
      words: ', its bands moving like water',
    },
    breaking: {
      effects: [
        { deviceId: 'currents', preset: 'Breaking waves', params: { depth: 0.6 } },
        { deviceId: 'fdn-reverb', preset: 'Thin veil' },
      ],
      words: ', its bands swelling like waves',
    },
    lights: {
      effects: [
        { deviceId: 'glimmer', preset: 'Light on water' },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', glimmering in a faint halo',
    },
    ripple: {
      effects: [{ deviceId: 'glimmer', preset: 'Rising ripple' }],
      words: ', a slow ripple rising through it',
    },
    circle: {
      effects: [{ deviceId: 'around', preset: 'Slow circle' }],
      words: ', turning slowly round the head',
    },
    sway: {
      effects: [
        { deviceId: 'around', preset: 'Wide pendulum' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', swinging wide in a room',
    },
    flock: {
      effects: [{ deviceId: 'murmuration', preset: 'Evening flock', params: { mix: 0.36 } }],
      words: ', with a flock of it overhead',
    },
    pair: {
      effects: [
        { deviceId: 'murmuration', preset: 'Two close by' },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.12 } },
      ],
      words: ', with two more of it close by',
    },
    calm: {
      effects: [
        {
          deviceId: 'breath',
          preset: 'Calm breath',
          params: { air: 0.08, in: 1.6, out: 2.4, rest: 0.3 },
        },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.18 } },
      ],
      words: ', opened and closed like a calm breath',
    },
    throb: { effects: [{ deviceId: 'pulses', preset: 'Soft throb' }], words: ', softly throbbing' },
    leftright: {
      effects: [{ deviceId: 'pulses', preset: 'Left then right' }],
      words: ', pulsed left and then right',
    },
    weave: {
      effects: [
        { deviceId: 'pulses', preset: 'Wide weave', params: { rate: 5 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', through two gates that weave',
    },
    lowpulse: {
      effects: [{ deviceId: 'band-pulse', preset: 'Slow low pulse' }],
      words: ', only its lows pulsing',
    },
    midpulse: {
      effects: [
        { deviceId: 'band-pulse', preset: 'Three a second', params: { depth: 0.55 } },
        { deviceId: 'stereo-detune', preset: 'Soft halo' },
      ],
      words: ', its middle pulsing softly',
    },
    latesway: {
      effects: [
        { deviceId: 'late-vibrato', preset: 'Slow bow' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', swaying late like a bowed note',
    },
    stillwater: {
      effects: [{ deviceId: 'freq-shifter', preset: 'Still water' }],
      words: ', phasing as slowly as still water',
    },
    losing: {
      effects: [{ deviceId: 'winding-down', preset: 'Soft losing pace', params: { rate: 2 } }],
      words: ', under pulses that lose pace',
    },
    // Rooms, halls and what stands far away.
    hall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.28 } }],
      words: ', in a hall',
    },
    nave: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } }],
      words: ', under a long nave',
    },
    darkhall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.3 } }],
      words: ', in a dark hall',
    },
    brighthall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.24 } }],
      words: ', in a bright hall',
    },
    undertow: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.28 } }],
      words: ', over a warm low tail',
    },
    plate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.24 } }],
      words: ', on a plate',
    },
    longplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.28 } }],
      words: ', on a long plate',
    },
    darkplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.28 } }],
      words: ', on a dark plate',
    },
    valley: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.28 } }],
      words: ', across an open valley',
    },
    cave: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } }],
      words: ', in a dark cave',
    },
    tank: {
      effects: [
        { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.2, decay: 3 } },
      ],
      words: ', in a small bright tank',
    },
    late: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Late arrival', params: { mix: 0.28 } }],
      words: ', its room arriving late',
    },
    open: {
      effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.3 } }],
      words: ', in a wide open space',
    },
    lowcath: {
      effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.32, decay: 14 } }],
      words: ', over a deep dark tail',
    },
    thinair: {
      effects: [{ deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.32 } }],
      words: ', in high thin air',
    },
    chill: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.26 } }],
      words: ', in a bright bare chamber',
    },
    springs: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.26 } }],
      words: ', on two springs',
    },
    longspring: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.28 } }],
      words: ', on long springs',
    },
    slack: {
      effects: [
        {
          deviceId: 'spring-reverb',
          preset: 'Single slack coil',
          params: { mix: 0.28, drip: 0.6 },
        },
      ],
      words: ', on one slack coil',
    },
    choir: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.3 } }],
      words: ', in a room that sings ah',
    },
    ooh: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.3 } }],
      words: ', with a soft oo behind',
    },
    monks: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.3 } }],
      words: ', before low far voices',
    },
    chapel: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel' }],
      words: ', in a small chapel',
    },
    cavern: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.28 } }],
      words: ', in a cavern of short echoes',
    },
    patter: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.28 } }],
      words: ', its echoes pattering',
    },
    shaft: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Mine shaft', params: { mix: 0.26 } }],
      words: ', down a narrow shaft',
    },
    backroom: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.34 } }],
      words: ', a room rising backwards behind',
    },
    gated: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.34 } }],
      words: ', in a room that stops short',
    },
    swellroom: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.36 } }],
      words: ', its room swelling after it',
    },
    bloom: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Octave halo', params: { mix: 0.26 } }],
      words: ', octaves opening in the tail',
    },
    stillroom: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Still room' }],
      words: ', in a still room',
    },
    glimmerhall: {
      effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.22 } }],
      words: ', a faint octave glimmer above',
    },
    sinking: {
      effects: [{ deviceId: 'shimmer', preset: 'Undertow', params: { mix: 0.22, decay: 7 } }],
      words: ', its tail sinking an octave',
    },
    stair: {
      effects: [{ deviceId: 'spiral', preset: 'Slow ascent', params: { mix: 0.26 } }],
      words: ', on a tail that slowly climbs',
    },
    descent: {
      effects: [{ deviceId: 'spiral', preset: 'Slow descent', params: { mix: 0.26, decay: 6 } }],
      words: ', on a tail that slowly sinks',
    },
    haze: {
      effects: [{ deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.28 } }],
      words: ', in a warm haze',
    },
    wall: {
      effects: [{ deviceId: 'haze', preset: 'Glowing wall', params: { mix: 0.28, decay: 4 } }],
      words: ', before a glowing wall',
    },
    bowls: {
      effects: [{ deviceId: 'bowls', preset: 'Faint halo', params: { mix: 0.22 } }],
      words: ', waking a few tuned bowls',
    },
    strings: {
      effects: [{ deviceId: 'sympathetic', preset: 'Follow the tune', params: { mix: 0.34 } }],
      words: ', strings ringing along',
    },
    silent: {
      effects: [{ deviceId: 'silent-keys', preset: 'Triad under staccato', params: { mix: 0.4 } }],
      words: ', waking a silent triad',
    },
    shore: {
      effects: [{ deviceId: 'distance', preset: 'Far shore' }],
      words: ', from a far shore',
    },
    stone: {
      effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
      words: ', down a stone stairwell',
    },
    nextdoor: {
      effects: [{ deviceId: 'distance', preset: 'Next door' }],
      words: ', heard from next door',
    },
    steps: {
      effects: [{ deviceId: 'distance', preset: 'A few steps back' }],
      words: ', a few steps back',
    },
    fogbound: {
      effects: [{ deviceId: 'distance', preset: 'Through fog' }],
      words: ', heard through fog',
    },
    outside: {
      effects: [{ deviceId: 'distance', preset: 'Open air' }],
      words: ', out in the open air',
    },
    // Echoes.
    darkecho: {
      effects: [{ deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.28 } }],
      words: ', with dark echoes',
    },
    slap: {
      effects: [{ deviceId: 'analog-delay', preset: 'Slapback' }],
      words: ', with one close slap',
    },
    murky: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.28, feedback: 0.45 } },
      ],
      words: ', its echoes late and murky',
    },
    tapewarm: {
      effects: [{ deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.28 } }],
      words: ', with warm tape repeats',
    },
    heads: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.28 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.12 } },
      ],
      words: ', over three tape heads',
    },
    trail: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.3, feedback: 0.55 } },
      ],
      words: ', a long dark trail behind',
    },
    dotted: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.28, feedback: 0.4 } },
      ],
      words: ', echoes limping side to side',
    },
    glintecho: {
      effects: [
        { deviceId: 'grain-delay', preset: 'Faint glints', params: { mix: 0.13 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', faint high glints after it',
    },
    subecho: {
      effects: [{ deviceId: 'grain-delay', preset: 'Sub shadow', params: { mix: 0.28 } }],
      words: ', a shadow an octave under it',
    },
    swells: {
      effects: [{ deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.34 } }],
      words: ', swelling back in reverse',
    },
    reflection: {
      effects: [
        { deviceId: 'reverse-delay', preset: 'Faint reflection', params: { mix: 0.24 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', a faint reflection behind',
    },
    unfold: {
      effects: [{ deviceId: 'prism', preset: 'Low to high', params: { mix: 0.34 } }],
      words: ', unfolding again from low to high',
    },
    fold: {
      effects: [{ deviceId: 'prism', preset: 'High to low', params: { mix: 0.34 } }],
      words: ', folding again from high to low',
    },
    points: {
      effects: [{ deviceId: 'constellation', preset: 'Faint points', params: { mix: 0.26 } }],
      words: ', echoed as scattered points',
    },
    slowing: {
      effects: [{ deviceId: 'constellation', preset: 'Slowing spiral', params: { mix: 0.3 } }],
      words: ', its echoes slowing down',
    },
    nightsky: {
      effects: [
        { deviceId: 'constellation', preset: 'Dark field', params: { mix: 0.34, again: 0.4 } },
      ],
      words: ', under a dark field of echoes',
    },
    pebble: {
      effects: [{ deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.28 } }],
      words: ', echoes skipping like a pebble',
    },
    rings: {
      effects: [{ deviceId: 'skipping-stone', preset: 'Wide rings', params: { mix: 0.3 } }],
      words: ', echoes in widening rings',
    },
    answered: {
      effects: [{ deviceId: 'canon', preset: 'Faint answer', params: { mix: 0.3 } }],
      words: ', answered a moment later',
    },
    procession: {
      effects: [{ deviceId: 'canon', preset: 'Slow procession', params: { gap: 1.2, mix: 0.36 } }],
      words: ', followed by a slow procession',
    },
    lowshadow: {
      effects: [{ deviceId: 'canon', preset: 'Octave shadow', params: { mix: 0.34 } }],
      words: ', followed an octave below',
    },
    phasing: {
      effects: [{ deviceId: 'orbits', preset: 'Short canon', params: { mix: 0.3 } }],
      words: ', loops drifting apart behind',
    },
    recall: {
      effects: [{ deviceId: 'echo-memory', preset: 'Recalling', params: { mix: 0.3 } }],
      words: ', half remembered after',
    },
    looped: {
      effects: [{ deviceId: 'tape-loop', preset: 'Slow fade', params: { mix: 0.34 } }],
      words: ', on a loop that slowly fades',
    },
    backloop: {
      effects: [
        { deviceId: 'micro-looper', preset: 'Slow reverse', params: { mix: 0.3, length: 1.6 } },
      ],
      words: ', over a slow bed in reverse',
    },
    softbed: {
      effects: [{ deviceId: 'micro-looper', preset: 'Soft bed' }],
      words: ', on a soft bed of itself',
    },
    // What is made of the sound.
    cloud: {
      effects: [{ deviceId: 'fog', preset: 'Soft cloud', params: { mix: 0.6 } }],
      words: ', blurred into a soft cloud',
    },
    darkbank: {
      effects: [{ deviceId: 'fog', preset: 'Dark bank', params: { mix: 0.6 } }],
      words: ', in a dark bank of fog',
    },
    upglow: {
      effects: [
        { deviceId: 'fog', preset: 'Upper glow', params: { mix: 0.36 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', a glow over its upper half',
    },
    grains: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.4 } }],
      words: ', in a soft cloud of grains',
    },
    rain: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Octave rain', params: { mix: 0.22 } }],
      words: ', raining grains an octave up',
    },
    lowtide: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Low tide', params: { mix: 0.34 } }],
      words: ', over slow grains an octave down',
    },
    mist: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.42 } }],
      words: ', hanging in a mist',
    },
    darkwater: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.45 } }],
      words: ', over dark still water',
    },
    glasshalo: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.34 } }],
      words: ', inside a glass halo',
    },
    frozen: {
      effects: [{ deviceId: 'sustainer', preset: 'Frozen moment', params: { mix: 0.42 } }],
      words: ', its last moment held frozen',
    },
    thinhalo: {
      effects: [{ deviceId: 'sustainer', preset: 'Thin halo', params: { mix: 0.3 } }],
      words: ', a thin halo holding on',
    },
    sag: {
      effects: [{ deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.34 } }],
      words: ', its tail softly sagging',
    },
    vapour: {
      effects: [{ deviceId: 'melt', preset: 'Evaporate', params: { mix: 0.32 } }],
      words: ', its tail lifting into vapour',
    },
    leaves: {
      effects: [{ deviceId: 'falling', preset: 'Falling leaves', params: { mix: 0.26 } }],
      words: ', small pieces falling from it',
    },
    sighs: {
      effects: [
        { deviceId: 'falling', preset: 'Slow sighs', params: { mix: 0.3 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', slow sighs coming off it',
    },
    firstlight: {
      effects: [
        { deviceId: 'glints', preset: 'First light' },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', throwing off bright sparks',
    },
    slowstars: {
      effects: [{ deviceId: 'glints', preset: 'Slow stars' }],
      words: ', slow stars two octaves up',
    },
    stackup: {
      effects: [{ deviceId: 'cascade', preset: 'Octave stack', params: { mix: 0.26 } }],
      words: ', a cascade of octaves after',
    },
    stackdown: {
      effects: [{ deviceId: 'cascade', preset: 'Undertow', params: { mix: 0.32 } }],
      words: ', loops sinking backwards below',
    },
    afterimage: {
      effects: [{ deviceId: 'generations', preset: 'Faint afterimage', params: { mix: 0.3 } }],
      words: ', leaving a faint afterimage',
    },
    sinehalo: {
      effects: [{ deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.3 } }],
      words: ', a halo of pure tones above',
    },
    linger: {
      effects: [
        { deviceId: 'sine-shadow', preset: 'Long linger', params: { mix: 0.36, release: 6 } },
      ],
      words: ', pure tones lingering after',
    },
    padfollow: {
      effects: [
        { deviceId: 'pad-follower', preset: 'Barely there', params: { mix: 0.3, rise: 1 } },
      ],
      words: ', a pad hardly there behind',
    },
    cellos: {
      effects: [
        { deviceId: 'pad-follower', preset: 'Dark cellos', params: { mix: 0.34, rise: 0.8 } },
      ],
      words: ', dark strings swelling in behind',
    },
    frost: {
      effects: [{ deviceId: 'seasons', preset: 'First frost' }],
      words: ', thin and dry with frost',
    },
    evening: {
      effects: [{ deviceId: 'seasons', preset: 'Long evening', params: { mix: 0.7 } }],
      words: ', warm and dim as a long evening',
    },
    summer: {
      effects: [{ deviceId: 'seasons', preset: 'High summer', params: { mix: 0.7 } }],
      words: ', wide and warm as summer',
    },
    hanging: {
      effects: [{ deviceId: 'common-tones', preset: 'Hanging notes' }],
      words: ', shared tones left hanging',
    },
    tails: {
      effects: [
        { deviceId: 'lift', preset: 'Long tails' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', its long ends brought up',
    },
    reveal: {
      effects: [
        { deviceId: 'reveal', preset: 'Overtones', params: { amount: 0.4 } },
        { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 7000 } },
      ],
      words: ', its hidden overtones brought out',
    },
    flutes: {
      effects: [{ deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.5 } }],
      words: ', doubled by soft flute pipes',
    },
    pedal: {
      effects: [{ deviceId: 'stops', preset: 'Pedal under', params: { mix: 0.5 } }],
      words: ', with a pedal pipe under it',
    },
    subbed: {
      effects: [{ deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6 } }],
      words: ', doubled an octave below',
    },
    highglass: {
      effects: [
        { deviceId: 'octaves', preset: 'Glass octaves', params: { up1: 0.22, up2: 0.08 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', thin octaves above it',
    },
    halfspeed: {
      effects: [{ deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.36 } }],
      words: ', half as fast underneath',
    },
    chime: {
      effects: [
        { deviceId: 'warp', preset: 'Soft chime', params: { mix: 0.4 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', its spacing bent a little to metal',
    },
    shallows: {
      effects: [{ deviceId: 'underwater', preset: 'Sunlit shallows', params: { bubbles: 0.08 } }],
      words: ', in sunlit shallow water',
    },
    sunken: {
      effects: [
        { deviceId: 'underwater', preset: 'Just under', params: { bubbles: 0.05 } },
        { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.18 } },
      ],
      words: ', just under the surface',
    },
    transistor: {
      effects: [
        { deviceId: 'radio', preset: 'Clean transistor' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', from a small radio in a room',
    },
    partials: {
      effects: [{ deviceId: 'low-bitrate', preset: 'Watery trace', params: { mix: 0.4 } }],
      words: ', with a watery trace',
    },
    octavehalo: {
      effects: [{ deviceId: 'spectral-drifter', preset: 'Octave halo', params: { mix: 0.12 } }],
      words: ', reversed grains an octave up',
    },
    slowshadow: {
      effects: [{ deviceId: 'stretch', preset: 'Near shadow' }],
      words: ', a stretched shadow close behind',
    },
    slips: {
      effects: [
        { deviceId: 'glitch', preset: 'Rare slips' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', slipping now and then',
    },
    metalring: {
      effects: [
        { deviceId: 'ring', preset: 'Fifth halo', params: { mix: 0.12 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', with a thin ring of metal round it',
    },
    dubble: {
      effects: [{ deviceId: 'pitch-shifter', preset: 'Doubler' }],
      words: ', doubled a few cents apart',
    },
    clouds: {
      effects: [{ deviceId: 'weather', preset: 'Passing clouds', params: { voice: 0.05 } }],
      words: ', clouds passing over it',
    },
    surf: {
      effects: [{ deviceId: 'weather', preset: 'Slow surf', params: { voice: 0.12, force: 0.5 } }],
      words: ', washed by slow surf',
    },
    room: {
      effects: [
        { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -46 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', in the air of an empty room',
    },
  },
  phrases: {
    suspend: {
      notes: [
        { atSec: 0, durSec: 2.4, note: 50, gain: 0.6 },
        { atSec: 0, durSec: 2.4, note: 65, gain: 0.5 },
        { atSec: 0, durSec: 2.4, note: 69, gain: 0.5 },
        { atSec: 0, durSec: 4.2, note: 72, gain: 0.6 },
        { atSec: 2.4, durSec: 4.4, note: 43, gain: 0.6 },
        { atSec: 2.4, durSec: 4.4, note: 62, gain: 0.5 },
        { atSec: 2.4, durSec: 4.4, note: 67, gain: 0.5 },
        { atSec: 4.2, durSec: 2.6, note: 71, gain: 0.55 },
      ],
    },
    wide: {
      notes: [
        { atSec: 0, durSec: 6.6, note: 41, gain: 0.6 },
        { atSec: 0.1, durSec: 6.5, note: 48, gain: 0.5 },
        { atSec: 0.2, durSec: 6.4, note: 57, gain: 0.55 },
        { atSec: 0.3, durSec: 6.3, note: 64, gain: 0.5 },
        { atSec: 0.4, durSec: 6.2, note: 67, gain: 0.45 },
      ],
    },
    threeabove: {
      notes: [
        { atSec: 0, durSec: 6.8, note: 38, gain: 0.6 },
        { atSec: 0, durSec: 2.2, note: 65, gain: 0.5 },
        { atSec: 0, durSec: 2.2, note: 69, gain: 0.5 },
        { atSec: 2.2, durSec: 2.2, note: 64, gain: 0.5 },
        { atSec: 2.2, durSec: 2.2, note: 67, gain: 0.5 },
        { atSec: 4.4, durSec: 2.4, note: 62, gain: 0.5 },
        { atSec: 4.4, durSec: 2.4, note: 69, gain: 0.5 },
      ],
    },
    single: { notes: [{ atSec: 0, durSec: 6.4, note: 57, gain: 0.75 }] },
    wedge: {
      notes: [
        { atSec: 0, durSec: 1.5, note: 69, gain: 0.6 },
        { atSec: 1.5, durSec: 1.5, note: 67, gain: 0.6 },
        { atSec: 3, durSec: 1.5, note: 65, gain: 0.6 },
        { atSec: 4.5, durSec: 2.3, note: 64, gain: 0.6 },
        { atSec: 0, durSec: 1.5, note: 50, gain: 0.6 },
        { atSec: 1.5, durSec: 1.5, note: 52, gain: 0.6 },
        { atSec: 3, durSec: 1.5, note: 57, gain: 0.55 },
        { atSec: 4.5, durSec: 2.3, note: 60, gain: 0.5 },
      ],
    },
    overdrone: {
      notes: [
        { atSec: 0, durSec: 6.8, note: 50, gain: 0.6 },
        { atSec: 0.2, durSec: 1.7, note: 76, gain: 0.5 },
        { atSec: 1.9, durSec: 1.1, note: 74, gain: 0.5 },
        { atSec: 3, durSec: 1.5, note: 72, gain: 0.5 },
        { atSec: 4.5, durSec: 0.8, note: 71, gain: 0.45 },
        { atSec: 5.3, durSec: 1.5, note: 69, gain: 0.5 },
      ],
    },
    broken: {
      notes: [
        { atSec: 0, durSec: 2.2, note: 45, gain: 0.6 },
        { atSec: 0.45, durSec: 1.8, note: 57, gain: 0.5 },
        { atSec: 0.9, durSec: 1.6, note: 64, gain: 0.55 },
        { atSec: 1.35, durSec: 1.5, note: 67, gain: 0.5 },
        { atSec: 1.8, durSec: 1.4, note: 72, gain: 0.6 },
        { atSec: 3.4, durSec: 2.4, note: 43, gain: 0.6 },
        { atSec: 3.85, durSec: 2, note: 59, gain: 0.5 },
        { atSec: 4.3, durSec: 1.8, note: 62, gain: 0.55 },
        { atSec: 4.75, durSec: 1.6, note: 69, gain: 0.5 },
      ],
    },
    inner: {
      notes: [
        { atSec: 0, durSec: 6.4, note: 57, gain: 0.6 },
        { atSec: 0, durSec: 6.4, note: 64, gain: 0.5 },
        { atSec: 0, durSec: 6.4, note: 72, gain: 0.5 },
        { atSec: 0, durSec: 3.2, note: 67, gain: 0.45 },
        { atSec: 3.2, durSec: 3.2, note: 69, gain: 0.45 },
      ],
    },
    ostinato: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 57, gain: 0.65 },
        { atSec: 0.6, durSec: 0.5, note: 64, gain: 0.5 },
        { atSec: 1.2, durSec: 0.5, note: 62, gain: 0.55 },
        { atSec: 1.8, durSec: 0.5, note: 67, gain: 0.5 },
        { atSec: 2.4, durSec: 0.5, note: 57, gain: 0.6 },
        { atSec: 3, durSec: 0.5, note: 64, gain: 0.5 },
        { atSec: 3.6, durSec: 0.5, note: 62, gain: 0.55 },
        { atSec: 4.2, durSec: 0.5, note: 69, gain: 0.5 },
        { atSec: 4.8, durSec: 1.6, note: 64, gain: 0.55 },
        { atSec: 4.8, durSec: 1.6, note: 57, gain: 0.5 },
      ],
    },
    touches: {
      notes: [
        { atSec: 0, durSec: 0.15, note: 62, gain: 0.75 },
        { atSec: 0.8, durSec: 0.15, note: 69, gain: 0.6 },
        { atSec: 1.6, durSec: 0.15, note: 65, gain: 0.65 },
        { atSec: 2.4, durSec: 0.15, note: 74, gain: 0.55 },
        { atSec: 3.6, durSec: 0.15, note: 60, gain: 0.7 },
        { atSec: 4.2, durSec: 0.15, note: 67, gain: 0.6 },
        { atSec: 4.8, durSec: 0.15, note: 76, gain: 0.5 },
      ],
    },
    chorale: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 48, gain: 0.6 },
        { atSec: 0, durSec: 1.6, note: 60, gain: 0.5 },
        { atSec: 0, durSec: 1.6, note: 64, gain: 0.5 },
        { atSec: 0, durSec: 1.6, note: 67, gain: 0.55 },
        { atSec: 1.7, durSec: 1.5, note: 53, gain: 0.6 },
        { atSec: 1.7, durSec: 1.5, note: 60, gain: 0.5 },
        { atSec: 1.7, durSec: 1.5, note: 65, gain: 0.5 },
        { atSec: 1.7, durSec: 1.5, note: 69, gain: 0.55 },
        { atSec: 3.3, durSec: 2.8, note: 45, gain: 0.6 },
        { atSec: 3.3, durSec: 2.8, note: 60, gain: 0.5 },
        { atSec: 3.3, durSec: 2.8, note: 64, gain: 0.5 },
        { atSec: 3.3, durSec: 2.8, note: 72, gain: 0.55 },
      ],
    },
    rising: {
      notes: [
        { atSec: 0, durSec: 6, note: 45, gain: 0.6 },
        { atSec: 0.7, durSec: 5.3, note: 52, gain: 0.55 },
        { atSec: 1.4, durSec: 4.6, note: 60, gain: 0.5 },
        { atSec: 2.1, durSec: 3.9, note: 64, gain: 0.5 },
        { atSec: 2.8, durSec: 3.2, note: 71, gain: 0.5 },
        { atSec: 3.5, durSec: 2.5, note: 76, gain: 0.5 },
      ],
    },
    lowline: {
      notes: [
        { atSec: 0, durSec: 1.5, note: 38, gain: 0.7 },
        { atSec: 1.7, durSec: 1.1, note: 36, gain: 0.65 },
        { atSec: 2.9, durSec: 1.1, note: 41, gain: 0.65 },
        { atSec: 4.1, durSec: 0.9, note: 40, gain: 0.6 },
        { atSec: 5.1, durSec: 1.7, note: 33, gain: 0.7 },
      ],
    },
    walkdown: {
      notes: [
        { atSec: 0, durSec: 0.8, note: 52, gain: 0.65 },
        { atSec: 0.9, durSec: 0.8, note: 50, gain: 0.6 },
        { atSec: 1.8, durSec: 0.8, note: 48, gain: 0.65 },
        { atSec: 2.7, durSec: 0.8, note: 47, gain: 0.6 },
        { atSec: 3.6, durSec: 1.2, note: 45, gain: 0.7 },
        { atSec: 5, durSec: 1.8, note: 40, gain: 0.7 },
      ],
    },
    lowheld: {
      notes: [
        { atSec: 0, durSec: 3.2, note: 31, gain: 0.7 },
        { atSec: 3.4, durSec: 3.3, note: 36, gain: 0.7 },
      ],
    },
    lowpair: {
      notes: [
        { atSec: 0, durSec: 3.2, note: 36, gain: 0.7 },
        { atSec: 0.8, durSec: 2.4, note: 55, gain: 0.4 },
        { atSec: 3.4, durSec: 3.2, note: 29, gain: 0.7 },
        { atSec: 4.2, durSec: 2.4, note: 57, gain: 0.4 },
      ],
    },
    fifths: {
      notes: [
        { atSec: 0, durSec: 6.9, note: 43, gain: 0.65 },
        { atSec: 0.8, durSec: 6.1, note: 50, gain: 0.55 },
        { atSec: 2, durSec: 4.9, note: 57, gain: 0.5 },
        { atSec: 3.4, durSec: 3.5, note: 64, gain: 0.45 },
      ],
    },
    pedal: {
      notes: [
        { atSec: 0, durSec: 6.9, note: 40, gain: 0.7 },
        { atSec: 1.4, durSec: 5.5, note: 59, gain: 0.45 },
        { atSec: 3.6, durSec: 3.2, note: 67, gain: 0.4 },
      ],
    },
    ground: {
      notes: [
        { atSec: 0, durSec: 6.9, note: 45, gain: 0.7 },
        { atSec: 0, durSec: 6.9, note: 57, gain: 0.45 },
      ],
    },
    highbells: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 84, gain: 0.6 },
        { atSec: 1, durSec: 0.5, note: 79, gain: 0.6 },
        { atSec: 1.9, durSec: 0.5, note: 76, gain: 0.55 },
        { atSec: 2.8, durSec: 0.5, note: 81, gain: 0.5 },
        { atSec: 4, durSec: 1, note: 72, gain: 0.6 },
      ],
    },
    tolling: {
      notes: [
        { atSec: 0, durSec: 1.2, note: 50, gain: 0.7 },
        { atSec: 1.4, durSec: 1.2, note: 50, gain: 0.55 },
        { atSec: 1.4, durSec: 1, note: 65, gain: 0.45 },
        { atSec: 2.8, durSec: 1.2, note: 50, gain: 0.65 },
        { atSec: 2.8, durSec: 1, note: 69, gain: 0.45 },
        { atSec: 4.2, durSec: 1.8, note: 50, gain: 0.6 },
        { atSec: 4.2, durSec: 1.8, note: 64, gain: 0.5 },
      ],
    },
    knell: {
      notes: [
        { atSec: 0, durSec: 0.6, note: 48, gain: 0.75 },
        { atSec: 2.2, durSec: 0.6, note: 55, gain: 0.6 },
        { atSec: 4.4, durSec: 1.2, note: 41, gain: 0.7 },
      ],
    },
    openfour: {
      notes: [
        { atSec: 0, durSec: 5.6, note: 45, gain: 0.6 },
        { atSec: 0, durSec: 5.6, note: 57, gain: 0.5 },
        { atSec: 0, durSec: 5.6, note: 64, gain: 0.5 },
        { atSec: 0, durSec: 5.6, note: 72, gain: 0.5 },
      ],
    },
    imitate: {
      notes: [
        { atSec: 0, durSec: 0.9, note: 74, gain: 0.6 },
        { atSec: 1, durSec: 0.9, note: 72, gain: 0.55 },
        { atSec: 2, durSec: 1.4, note: 69, gain: 0.6 },
        { atSec: 1.5, durSec: 0.9, note: 62, gain: 0.6 },
        { atSec: 2.5, durSec: 0.9, note: 60, gain: 0.55 },
        { atSec: 3.5, durSec: 1.6, note: 57, gain: 0.6 },
        { atSec: 5.1, durSec: 1.5, note: 50, gain: 0.6 },
        { atSec: 5.1, durSec: 1.5, note: 65, gain: 0.5 },
      ],
    },
  },
  directions: [
    {
      id: 'fused-pads',
      name: 'Fused pads',
      category: 'pad',
      rows: `
Thaw on the belfry | Melted row | row=4 attack=1.1 ringers=8 tilt=-3 cover=0.5 beat=1.1 release=5 weight=0.2 muffle=0 gap=0.15 swing=0.05 series=Fifths method=Rounds volume=-8 | hall | suspend | Melted fifths of bells that fall softly over a round low tone, opening over a second
Copper evening | Melted row | method=Contrary row=8 attack=2.2 body=0.6 tilt=-7 place=1 release=9 crossing=0.1 weight=-0.55 muffle=0.25 swing=0 beat=0.15 volume=-4.5 | darkplate | wide | Cast metal that swells for two seconds, one line climbing while another sinks
Snow on the weathercock | Melted row | series=Odd row=3.5 attack=0.6 ringers=6 tilt=-3 cover=0.6 beat=1.6 body=0.2 muffle=0 weight=0.35 swing=0.3 volume=-7.5 | bloom | openfour | Hollow odd overtones of bells over a full ground, wavering gently
Ferryman's lamp | Melted row | series=Fifths row=10 attack=1.6 ringers=5 tilt=-6 cover=0.2 crossing=0.9 release=12 weight=-0.7 muffle=0.2 gap=0.2 beat=0.7 | water | rising | Five bells in stacked fifths that hand one place from key to key in long rows
Bread oven cooling | Melted row | method=Treble row=2.2 attack=0.35 tilt=-8 body=0.15 cover=0.55 muffle=0.5 gap=0.06 swing=0.4 beat=0.1 crossing=0.2 weight=0.15 | narrow | chorale | Dull round bells, the highest leading each row and the low ones leaning after it
Pond skin | Melted row | voice=Glass row=4 attack=0.25 ringers=8 tilt=-5 cover=0.5 release=5 body=0.3 weight=0.1 muffle=0 beat=0.05 gap=0.12 crossing=0.15 volume=-10 | stillwater | wide | Rubbed glass that takes a second to speak and then trades its eight overtones
Vinery at noon | Melted row | voice=Glass series=Odd method=Contrary row=6 attack=0.4 tilt=-1 cover=0.35 place=1 beat=2.2 body=0.85 muffle=0 swing=0 weight=-0.5 volume=-2.5 | lights | suspend | Bright odd glass in two crossing lines, wide apart and slow to open
Milk in the window | Melted row | voice=Glass series=Fifths method=Rounds row=3 attack=0.1 ringers=5 cover=0.7 tilt=-8 crossing=0.2 release=3 beat=1.6 gap=0.25 weight=0.4 muffle=0.3 volume=-7 | ensemble | threeabove | A round glass tone with five fifths above it that roll down softly every row
Lens grinder | Melted row | voice=Glass series=High method=Dodge row=5 attack=0.3 ringers=6 cover=0.75 tilt=-6 place=0.9 beat=0.2 release=7 swing=0.6 muffle=0.22 weight=-0.45 volume=-4.5 | shade | rising | A steady glass ground with pairs of distant overtones trembling far above
Cold tea at dawn | Melted row | voice=Glass method=Long row=7 attack=0.16 ringers=4 tilt=-9 cover=0.25 body=0.1 beat=2.4 release=8 weight=0.3 swing=0 muffle=0.05 gap=0.3 crossing=0.1 | cassette | rising | Four quiet glasses, two to a row, each wavering twice a second as it fades
Sleepers in the loft | Slow hum | series=Chord_tones row=4 attack=0.35 ringers=8 cover=0.1 crossing=0.5 body=0.5 release=5 beat=1.2 weight=-0.6 gap=0.34 muffle=0 swing=0 | choir | inner | Hummed tones borrowed from every key held, passing from mouth to mouth
Cloister washday | Slow hum | method=Hunt row=3 attack=0.22 tilt=-2 body=0.8 cover=0.15 ringers=8 place=1 release=3 weight=0.3 swing=0.2 muffle=0.05 beat=0.2 crossing=0.6 volume=-3 | table | chorale | An open hum whose eight voices hunt through each other across the whole width
Culvert song | Slow hum | method=Contrary series=Fifths row=9 attack=0.9 tilt=-8 cover=0.5 release=12 crossing=0.8 muffle=0.3 beat=0.3 weight=0.5 swing=0 volume=-4 | lowcath | inner | Dark hummed fifths that cross in the middle of rows nine seconds long
Wool merchants | Slow hum | series=Odd method=Rounds row=2 attack=0.12 tilt=-5 body=0.35 gap=0.35 cover=0.4 release=2.2 weight=0.55 beat=2.2 muffle=0.4 swing=0.5 crossing=0.15 volume=-6.5 | blanket | suspend | Woolly odd hums that roll from the top and rest before they roll again
Boat songs from below | Slow hum | method=Dodge row=6 attack=0.5 ringers=5 tilt=-4 beat=1.5 cover=0.6 body=0.6 place=0.6 muffle=0.25 gap=0.15 weight=-0.6 swing=0.3 crossing=0.8 volume=-6.5 | latesway | inner | Closed mouths in pairs, trembling neighbour against neighbour over a low ground
Curtains all day | Moving air | tower=Together method=Hunt series=Low row=3.5 attack=0.5 cover=0.5 tilt=-6 body=0.3 ringers=8 overlap=0.95 weight=0.25 beat=0 muffle=0.3 swing=0 gap=0.2 place=0.45 volume=-9.5 | haze | wide | Soft bands of breath over a plain low tone, taking a second and more to fill
Salt wind inland | Moving air | series=Odd row=7 attack=0.8 cover=0.35 tilt=-4 tower=Opposed place=1 overlap=1 release=6 beat=2 muffle=0 weight=-0.6 swing=0.3 gap=0.3 volume=0.5 | clouds | rising | Odd bands of air that lean from one side to the other in seven second rows
Attic with owls | Moving air | series=Chord_tones method=Contrary tower=Together row=5 attack=0.3 cover=0.2 tilt=-3 body=0.7 crossing=0.8 swing=0 beat=0.2 weight=0.35 muffle=0 volume=-1 | nave | suspend | Breath tuned to the keys that are held, crossing over and under itself
Cloth over a mirror | Moving air | voice=Breath series=High method=Rounds tower=Together row=4 attack=0.4 cover=0.8 tilt=-7 ringers=5 release=3 muffle=0.35 gap=0.35 weight=0.6 beat=1.6 crossing=0.4 volume=-1 | mist | openfour | High thin air that falls in rolls above a strong steady tone
Sigh of the bellows | Moving air | series=Low method=Treble tower=Together row=2.5 attack=0.2 cover=0.6 gap=0.4 body=0.9 bite=0.6 weight=0.5 release=2 swing=0.4 beat=0 muffle=0.2 crossing=0.3 | chamber | chorale | Full breath led from the top, with a pause after every row as bellows have
Harmonium by the sea | Reeds round a chord | series=Low method=Hunt row=3 attack=0.06 cover=0.5 tilt=-5 body=0.45 ringers=7 overlap=1 beat=2.6 weight=0.1 gap=0 muffle=0.22 crossing=0.45 volume=-4 | drift | chorale | Fused reeds over a full low tone, changing neighbours without a seam
Varnish and candles | Reeds round a chord | series=Odd method=Contrary row=8 attack=0.4 cover=0.3 tilt=-7 ringers=6 release=6 overlap=1 place=0.4 weight=-0.6 swing=0.25 beat=0.15 muffle=0.3 gap=0.18 volume=3.5 | chapel | wide | Dark odd reeds that blow in over two seconds, one line rising as one falls
Reed cutters rest | Reeds round a chord | series=Fifths row=5 attack=0.12 cover=0.15 tilt=-4 overlap=0.97 crossing=0.95 ringers=5 muffle=0.6 swing=0 beat=1.8 weight=0.35 gap=0.25 volume=-4 | swellroom | rising | Open fifths on reeds, every second row in leather and each place held by one key
Concertina in a blizzard | Reeds round a chord | series=Low method=Dodge row=4 attack=0.04 beat=4 cover=0.4 tilt=-6 ringers=4 overlap=0.95 release=1.2 weight=0.3 muffle=0 swing=0.3 crossing=0.2 volume=-1.5 | outside | suspend | Four reeds shivering four times a second as they change places in pairs
Lit organ loft | Reeds round a chord | series=High method=Rounds row=6 attack=0.2 cover=0.85 tilt=-5 ringers=8 overlap=1 release=4 body=0.8 muffle=0.2 weight=-0.5 beat=0.2 gap=0.3 crossing=0.3 | glimmerhall | openfour | A firm reed ground under a slow fall of far overtones
Mandolins asleep | Hollow loom | method=Dodge overlap=1 swing=0 row=1.2 ringers=6 tilt=-5 cover=0.3 release=4 beat=2.4 weight=0.4 muffle=0.3 gap=0.4 volume=-3 | breaking | wide | Strings plucked so often by pairs of neighbours that they fuse to a tremor
Harp under the floor | Hollow loom | method=Hunt overlap=1 row=3 ringers=8 tilt=-8 cover=0.5 swing=0.2 body=0.3 release=6 attack=0.4 weight=0.35 muffle=0.5 beat=2.6 crossing=0.25 | darkhall | suspend | Soft plucked rows melted together over a covering tone, dark and slow to fade
Spider on the sill | Hollow loom | series=Odd method=Contrary overlap=0.98 row=5 ringers=7 tilt=-8 cover=0.62 swing=0 place=1 bite=0 attack=1.5 beat=0.1 gap=0.28 weight=0 muffle=0.05 crossing=0.15 body=0.64 volume=-5.5 | glasshalo | wide | Odd plucked overtones with no touch at all, crossing from side to side | string
Rope and tallow | Hollow loom | series=Fifths method=Rounds overlap=1 row=2 ringers=5 tilt=-6 cover=0.25 swing=0.6 weight=0.5 release=3 beat=3.2 muffle=0.25 gap=0 volume=-6 | reel | rising | Fifths on gut that fall in a heavy roll every two seconds and never part
Nets drying | Hollow loom | series=Chord_tones method=Hunt overlap=1 row=1.6 ringers=8 tilt=-4 cover=0.05 crossing=0.9 swing=0.3 release=5 bite=0.05 weight=0.15 beat=2 muffle=0 gap=0 volume=-4 | longplate | rising | Plucked tones of the whole chord woven through every key, no seam to hear
Ringers dozing | Melted row | tower=Canon row=6 attack=0.7 place=1 cover=0.2 tilt=-5 ringers=6 release=7 muffle=0.35 beat=0.8 swing=0.3 weight=0.2 crossing=0.15 volume=-8.5 | sides | suspend | Each key its own slow row of bells behind the last, every second one upside down
Mill with two wheels | Reeds round a chord | series=Low tower=Canon method=Contrary row=4 attack=0.1 cover=0.2 overlap=1 tilt=-6 place=1 ringers=6 beat=0.1 gap=0.2 swing=0.35 weight=-0.55 crossing=0.3 muffle=0 volume=-1 | circle | wide | Reeds in canon at four different paces, each key on a side of its own
Echo of a nursery | Melted row | voice=Glass tower=Canon series=Fifths method=Hunt row=3 attack=0.08 cover=0.3 place=1 ringers=5 tilt=-5 release=4 weight=0.5 muffle=0.3 swing=0.25 beat=0 gap=0.06 volume=-4 | chill | rising | Glass fifths that follow each other from key to key, mirrored left and right
Choir on two ships | Slow hum | tower=Canon method=Hunt row=5 attack=0.3 place=1 crossing=0.2 tilt=-4 ringers=7 cover=0.2 release=6 beat=1.4 swing=0 muffle=0.25 gap=0.34 weight=0.1 volume=-3.5 | harmtrem | suspend | Hummed rows in canon, some twice as slow, far to the left and the right
Passing in the corridor | Moving air | tower=Canon series=Low method=Treble row=2.8 attack=0.25 cover=0.4 overlap=0.95 tilt=-5 ringers=6 body=0.4 beat=0.4 weight=0.4 muffle=0.28 gap=0.3 crossing=0.45 volume=-8 | pan | threeabove | Breath that leads from the top in one key and answers from below in the next
Swing bridge | Melted row | tower=Opposed row=3 attack=0.5 place=1 cover=0.3 weight=0.3 tilt=-5 ringers=7 release=4 swing=0.4 muffle=0 beat=2 gap=0.1 crossing=0.2 | hall | openfour | Melted bells that sway, one half of the chord forward while the other waits
Saloon doors | Melted row | voice=Reed tower=Opposed series=Odd method=Rounds row=1.4 attack=0.05 cover=0.45 place=0.9 overlap=0.97 tilt=-6 release=1.5 swing=0.2 beat=2.8 weight=0.5 muffle=0.05 gap=0.2 crossing=0.1 volume=-0.5 | touchgate | suspend | Odd reeds that swing from side to side in short rows over a steady tone
Tide clock ashore | Slow hum | tower=Opposed method=Hunt row=2.4 attack=0.15 place=1 cover=0.35 weight=-0.6 swing=0.4 tilt=-5 release=3 beat=0.2 muffle=0.3 gap=0.4 crossing=0.6 volume=-0.5 | darkbank | inner | Hums that grow towards the end of each row, first one side and then the other
Window seat | Melted row | voice=Glass tower=Opposed method=Contrary row=4.5 attack=0.2 place=1 cover=0.6 tilt=-7 ringers=8 beat=0.9 weight=0.3 swing=0.3 muffle=0.2 gap=0.28 crossing=0.15 volume=-5.5 | edges | chorale | Round glass, close by, leaning from one key to its neighbour and back
Lovers on a roof | Hollow loom | tower=Opposed method=Rounds overlap=1 row=1 swing=0 cover=0.3 tilt=-5 ringers=6 place=1 crossing=0.4 release=2.5 beat=3.2 muffle=0.35 weight=0.45 gap=0 volume=-1 | slowing | threeabove | Soft plucked rolls, a second each, that answer from the far side
First planes over | Melted row | series=High row=5 attack=1.2 tilt=-2.5 cover=0.85 ringers=8 place=1 beat=0.2 body=0.1 release=6 muffle=0 weight=-0.5 swing=0 crossing=0.2 bite=0 volume=-7.5 | sinehalo | wide | Only distant overtones of bells above a firm low tone, spread to the edges
Needle of ice | Melted row | voice=Glass series=Odd method=Long row=4 attack=0.1 tilt=-2 cover=0.59 ringers=7 beat=0.1 release=10 muffle=0.3 gap=0.4 weight=0.2 volume=-2 | bare | suspend | Single odd glass tones far above the key, two to a row, over a plain ground
Radio mast at dusk | Reeds round a chord | series=High method=Treble row=3.2 attack=0.1 tilt=-3.5 cover=0.86 ringers=5 overlap=0.98 beat=3 release=3 gap=0.18 muffle=0 weight=0.5 swing=0.4 crossing=0.2 volume=-9 | transistor | suspend | Thin high reeds with a shiver in them, the top one leading each row
Frost on wool | Moving air | series=Odd tower=Together method=Dodge row=6 attack=0.5 tilt=-6 cover=0.6 ringers=8 overlap=1 bite=0 release=5 beat=2.6 weight=0.4 muffle=0.3 gap=0.06 swing=0.5 volume=-0.5 | frost | wide | Odd breath trembling in pairs over a tone that stays
Silver in a drawer | Hollow loom | series=High method=Contrary overlap=1 row=3 swing=0.35 tilt=-4 cover=0.87 ringers=6 bite=0.02 place=0.6 release=4 weight=0.5 beat=0 muffle=0.2 gap=0.25 volume=-4.5 | booth | rising | Far overtones plucked so softly that they only gleam above the key
Barge of slate | Melted row | row=7 attack=0.9 tilt=-10 cover=0.9 ringers=4 muffle=0.8 body=0.1 place=0 release=3 weight=0.4 swing=0.2 beat=0 crossing=0.35 | pillow | wide | A heavy covering tone with four leathered bells moving under their breath
Root cellar door | Slow hum | method=Rounds row=3.5 attack=0.2 tilt=-10 cover=0.8 ringers=3 gap=0.6 body=0.2 place=0 release=2 beat=0.7 muffle=0.4 weight=0.5 swing=0 volume=-21 | floor | suspend | Three low hums over a thick ground that swell, sink and wait
Moss on the bell | Melted row | series=Fifths method=Hunt row=2 attack=0.15 tilt=-9 cover=0.65 muffle=1 ringers=5 beat=0.1 bite=0.2 weight=0.5 swing=0.4 gap=0.3 place=0.3 | felt | chorale | Bells in full leather, hardly more than a warm ground with fifths turning in it
Black tea and rain | Reeds round a chord | series=Low method=Dodge row=5 attack=0.15 tilt=-9 cover=0.75 ringers=4 overlap=1 body=0.2 release=2.5 beat=1.5 swing=0.3 muffle=0.5 gap=0.34 crossing=0.2 | sinking | threeabove | Reeds almost closed, their low pairs trembling against a deep steady tone
Last coals | Melted row | voice=Plucked method=Treble row=4 attack=3 tilt=-9 cover=0.7 ringers=6 bite=0 body=0.1 weight=-0.8 release=8 muffle=0.2 swing=0.4 beat=2.6 place=0.35 | evening | wide | Strings faded in over a second, each row growing from a faint lead to its low end | string
`,
    },
    {
      id: 'plain-keys',
      name: 'Plain keys',
      category: 'keys',
      rows: `
Tumblers on a tray | Plain glass keys | row=0.6 ringers=6 overlap=0.4 bite=0.7 tilt=-4 release=0.5 weight=0.3 beat=0 muffle=0 swing=0 volume=-5 | bare | broken | Small glass struck and gone, six overtones hunting through half a second
Rinsed jam jars | Plain glass keys | method=Rounds row=1.1 ringers=4 overlap=0.7 cover=0.5 tilt=-8 release=1.6 gap=0 weight=0.5 muffle=0.3 beat=2.2 swing=0.25 volume=-1 | chamber | broken | Round glass keys with a soft fall of four overtones behind each touch
Chandelier shop | Plain glass keys | series=Odd method=Contrary row=0.9 ringers=8 overlap=0.25 tilt=-5.5 place=1 beat=1.6 release=2.4 muffle=0 weight=-0.5 crossing=0.1 cover=0.62 bite=0.28 body=0.32 volume=0.5 | lit | ostinato | Odd glass that sparkles from both edges to the middle as the key is struck
Eyeglasses on paper | Plain glass keys | series=Fifths method=Treble row=1.4 ringers=5 overlap=0.6 cover=0.2 bite=0.35 release=1.2 swing=0.5 beat=0.1 muffle=0.2 weight=0.2 gap=0 volume=1 | notch | touches | Glass fifths led by the highest, with the low ones answering in the half row
Damp fingertips | Plain glass keys | method=Dodge row=1.6 attack=0.02 ringers=4 overlap=0.8 bite=0.1 cover=0.6 beat=1.6 release=3 weight=0.1 muffle=0 gap=0.05 crossing=0.6 volume=-5.5 | ensemble | chorale | Glass that speaks a little late and trembles between two neighbours
Doorbell in a garden | Evening peal | row=0.7 ringers=5 overlap=0.5 gap=0.3 bite=0.5 tilt=-5 release=0.8 cover=0.15 beat=0.7 muffle=0 swing=0.5 weight=0.35 volume=-2 | pick | imitate | Plain small bells, five overtones in a quick row and then a rest
Trinket piano | Evening peal | method=Rounds series=Odd row=1 ringers=6 overlap=0.55 body=0.6 tilt=-6 release=0.84 weight=0.7 cover=0.35 bite=0.15 beat=0.1 muffle=0.25 gap=0.42 crossing=0.15 volume=6 | little | ostinato | Odd bells in a fast falling roll, every step of it as firm as the last
Coins in a fountain | Evening peal | method=Contrary row=1.8 ringers=8 overlap=0.6 bite=0.44 tilt=-5.5 place=1 release=3.5 cover=0.26 body=0.57 gap=0.25 muffle=0 beat=0.2 weight=0.2 crossing=0.1 volume=1.5 | tank | touches | Quick bells from a hard hand, two lines crossing through each touch
Handbells in gloves | Evening peal | series=Fifths method=Hunt row=1.2 ringers=4 overlap=0.7 muffle=0.5 bite=0.1 tilt=-7 release=1.8 beat=0.2 gap=0.3 weight=0.4 swing=0.4 crossing=0.6 | hall 1.mix=0.16 | broken | Four bells in fifths to a key, every second row in leather
Sewing box lid | Evening peal | method=Dodge series=Low row=0.8 ringers=3 overlap=0.35 swing=0.6 cover=0.45 tilt=-8 release=0.4 body=0.2 beat=0 muffle=0.4 weight=0.5 gap=0.05 place=0.1 | felt | ostinato | Three low bells, two of them swapping fast, over a firm little ground
Lute with no case | Plucked canon | tower=Together series=Low method=Rounds row=0.9 ringers=6 overlap=0.6 bite=0.5 release=0.7 cover=0.2 tilt=-3 weight=0.5 muffle=0 beat=1 swing=0.3 gap=0 volume=6 | bare | broken | A quick downward strum of near overtones under each key, soon damped by the hand
Kitchen harpsichord | Plucked canon | tower=Together series=Low method=Hunt row=0.5 ringers=8 overlap=0.6 bite=0.48 body=0.9 tilt=0 release=0.42 cover=0.3 beat=0 muffle=0 gap=0 weight=0.15 swing=0 place=0.5 volume=-1.5 | wood | ostinato | Bright strings lightly plucked, eight of them running inside half a second
Guest room clavichord | Plucked canon | tower=Together series=Odd method=Treble row=1.3 ringers=5 overlap=0.8 bite=0.12 tilt=-5 beat=2 release=1.26 cover=0.45 muffle=0.3 gap=0.3 swing=0.4 weight=0.3 volume=2.5 | parlour | wedge | Small hollow strings that shake a little, the top one first in every row
Cane and quill | Plucked canon | tower=Together series=Fifths method=Contrary row=1.6 ringers=7 overlap=0.9 bite=0.36 tilt=-4 place=0.8 release=2.52 cover=0.15 beat=3.2 muffle=0 weight=0.45 swing=0.2 gap=0.36 volume=-1 | springs | touches | Quilled fifths that close from both ends to the middle
Rubber bands on a tin | Plucked canon | tower=Together series=Low method=Dodge row=0.7 ringers=3 overlap=0.75 bite=0.1 body=0.15 tilt=-9 release=0.5 cover=0.5 beat=0.1 weight=0.3 swing=0.5 muffle=0.25 gap=0.1 place=0.2 | narrow | wedge | Round soft plucks on three low strings, the neighbours trading places quickly
Toy reed organ | Covered bass | ringers=6 row=1 overlap=0.5 cover=0.5 tilt=-1 body=0.85 release=0.2 place=0.6 method=Hunt series=Odd beat=2.4 gap=0.3 muffle=0 weight=0.2 volume=-7 | combo | chorale | Nasal reed keys that chatter through six odd overtones and stop with the hand
Schoolroom harmonica | Covered bass | series=Odd ringers=5 row=1.8 overlap=0.7 cover=0.67 tilt=-8.5 beat=3 release=0.35 bite=0.6 method=Treble gap=0.25 muffle=0.05 weight=0.4 swing=0.3 volume=-2.5 | pick | wedge | Odd reeds with a quick shake and plenty of air at the front of each note
Station bandoneon | Covered bass | series=Fifths ringers=7 method=Contrary row=2.4 overlap=0.75 cover=0.3 tilt=-5 body=0.8 release=0.5 place=1 beat=4 gap=0 weight=-0.5 muffle=0 swing=0.25 volume=-8 | grit | broken | Open fifths on shaking reeds, crossing in the middle of rows over two seconds long
Feet on the pump | Covered bass | series=Fifths ringers=4 method=Rounds row=0.6 gap=0.7 overlap=0.6 cover=0.6 tilt=-4 release=0.3 weight=0.6 muffle=0.45 beat=1.8 swing=0.6 volume=-2.5 | pillow | ostinato | Fifths on dull reeds that puff at the head of each short row and rest
Melodica upstairs | Covered bass | series=Chord_tones ringers=8 method=Hunt row=1.4 overlap=0.65 cover=0.35 tilt=-3 attack=0.01 release=0.6 bite=0.4 muffle=0.22 swing=0 beat=0.05 gap=0 weight=0 crossing=0.8 volume=-6.5 | nextdoor | chorale | Reed keys that sing the notes of their neighbours in short even rows
Supper on the landing | One after another | tower=Together method=Rounds row=1.5 ringers=4 overlap=0.6 cover=0.6 tilt=-7 bite=0.3 release=1 attack=0.003 beat=1.6 muffle=0.25 weight=0.4 swing=0.2 volume=-6 | chorale | broken | Round hummed keys with a soft falling roll of four overtones under each touch
Slippers on marble | One after another | tower=Together method=Hunt series=Odd row=0.9 ringers=5 overlap=0.5 cover=0.45 tilt=-5 body=0.7 release=0.8 attack=0.003 beat=0.1 muffle=0 gap=0.28 weight=0.2 crossing=0.15 place=0.15 volume=-6.5 | glaze | broken | Short hummed notes with odd ones moving quickly inside, close by
Lobby at half past four | One after another | tower=Together method=Treble series=Fifths row=2 ringers=6 overlap=0.7 cover=0.5 tilt=-4 beat=1.2 release=1.6 attack=0.005 muffle=0.2 gap=0.42 swing=0.35 weight=0.1 crossing=0.5 volume=-5 | amptrem | wedge | Hummed keys with a fifth that leads each row and wavers as it goes
Wardrobe with a lamp | One after another | tower=Together method=Dodge series=Odd row=1 ringers=5 overlap=0.65 cover=0.4 tilt=-5 body=0.6 release=0.6 attack=0.01 beat=2.4 gap=0.05 muffle=0.3 swing=0.4 volume=1 | blanket | touches | Hollow hummed keys in which two neighbours trade fast and waver, soft at the edges
Ferry terminal piano | One after another | tower=Together method=Contrary series=Chord_tones row=1.6 ringers=8 overlap=0.6 cover=0.4 tilt=-3 release=1.2 attack=0.004 place=0.9 body=0.75 beat=0.2 muffle=0 gap=0.3 weight=-0.6 crossing=0.7 volume=-6.5 | cassette | ostinato | Open hums of the notes held, crossing in each touch from left and right
Warm filament | Evening peal | voice=Glass cover=0.65 ringers=5 row=2 overlap=0.5 tilt=-3 bite=0.3 release=0.9 attack=0.003 place=0.4 series=Fifths beat=1.8 gap=0.25 muffle=0 weight=0.2 | valve | broken | A plain tone under the hand with five glass fifths wavering over it
Brass lamps lit | Evening peal | cover=0.8 ringers=5 row=1.4 overlap=0.4 tilt=-6 bite=0.55 release=1.2 body=0.7 attack=0.003 gap=0.5 beat=0 muffle=0.25 weight=0.35 swing=0.4 | quickrotor | chorale | Bells flicker over a firm covering tone at the start of every row
Parish hall upright | Evening peal | voice=Plucked cover=0.95 ringers=6 row=1.2 overlap=0.6 tilt=-4 bite=0.4 release=0.8 method=Rounds attack=0.003 beat=1.3 muffle=0.2 weight=0.4 swing=0.5 gap=0 volume=-2.5 | larger | wedge | A full steady tone with a plucked roll on top of every row
Rain on the record shop | Evening peal | voice=Hum cover=0.7 series=High ringers=7 row=1.6 overlap=0.45 tilt=-2 release=1.4 attack=0.003 place=1 gap=0.3 muffle=0 weight=-0.5 beat=0.1 swing=0 volume=-1.5 | disc | broken | A soft hum of far overtones flickering high above a plain covered key
Lantern on a hook | Evening peal | voice=Breath cover=0.92 ringers=4 row=2.2 overlap=0.6 tilt=-5 bite=0.32 release=0.98 attack=0.003 method=Hunt series=Odd gap=0.36 beat=3 weight=0.2 muffle=0.3 swing=0 body=0.39 volume=2.5 | swirl | touches | A covered key with hollow puffs of breath that walk over it, one by one
Felt over the hammers | Leather and stone | series=Low method=Rounds row=1.2 ringers=5 cover=0.5 tilt=-7 release=0.8 bite=0.15 overlap=0.7 beat=0.1 gap=0.1 swing=0.3 crossing=0.15 volume=-1.5 | booth | broken | Leathered bells in a soft roll, short and low under the fingers
Library after closing | Leather and stone | series=Odd method=Hunt row=0.8 ringers=6 cover=0.3 tilt=-4 release=0.6 bite=0.4 overlap=0.6 muffle=0.75 beat=0 gap=0.14 weight=0 swing=0.05 crossing=0.6 volume=4 | doubled | ostinato | Dull odd taps in an even walk, one row and then the next in thicker leather
Mittens | Leather and stone | voice=Plucked series=Low method=Contrary row=1 ringers=8 cover=0.4 tilt=-4 release=0.5 bite=0.3 muffle=1 overlap=0.8 swing=0.3 gap=0.25 beat=2 weight=0.2 volume=6 | wood | imitate | Strings under leather, plucked from both ends and damped at once
Snowed in | Leather and stone | voice=Glass series=Fifths method=Treble row=1.6 ringers=5 cover=0.6 tilt=-8 release=1.5 muffle=0.8 overlap=0.75 beat=0.2 gap=0.4 swing=0.25 crossing=0.15 volume=-6 | muffled | chorale | Glass behind leather, the top fifth leading softly over a round tone
Apothecary scales | Leather and stone | voice=Bell series=Low method=Dodge row=1.4 ringers=4 cover=0.25 tilt=-2 release=2.8 muffle=0.6 bite=0.48 overlap=0.6 weight=0.2 beat=0.7 gap=0.28 swing=0.15 crossing=0.1 volume=-7 | metalring | touches | A bright pair swaps over a muffled one, with a light tick to every blow
Porcelain hour | High treble | method=Rounds row=1.2 ringers=5 overlap=0.4 cover=0.6 tilt=-5 release=0.7 bite=0.5 attack=0.003 muffle=0 gap=0.3 weight=0.4 beat=0.1 swing=0.3 volume=1 | slowshadow | ostinato | Very high glass that falls in a quick roll over a plain soft key
Icicles on a gutter | High treble | voice=Bell method=Contrary row=0.8 ringers=8 overlap=0.25 cover=0.62 tilt=-4 release=1.4 bite=0.23 place=1 attack=0.003 beat=1 muffle=0 gap=0.25 weight=-0.5 crossing=0.1 body=0.32 volume=0 | firstlight | touches | Far bell overtones struck short from both sides over a clear low note
Flute cane drying | High treble | voice=Hum series=Odd method=Hunt row=1.5 ringers=6 overlap=0.6 cover=0.4 tilt=-1 release=0.5 attack=0.005 bite=0.5 muffle=0.2 beat=0.9 weight=0.2 swing=0.4 gap=0 | tubed | wedge | Odd hollow hums with their upper ones let forward, stopped with the key
Abacus in the sun | High treble | voice=Plucked series=Odd method=Dodge row=1.1 ringers=7 overlap=0.7 cover=0.2 tilt=-3.5 release=0.84 attack=0.003 bite=0.2 beat=0 muffle=0.3 gap=0.42 weight=0.3 swing=0.25 crossing=0.15 body=0.32 volume=-1.5 | weave | ostinato | Odd plucked overtones that tick to and fro like beads, thin and quick
Switchboard lights | High treble | voice=Reed series=High method=Long row=1 ringers=5 overlap=0.5 cover=0.88 tilt=-6 release=0.4 attack=0.003 bite=0.06 beat=2.5 gap=0.4 weight=0 muffle=0 swing=0 body=0.19 | sampler | wedge | Tiny far reeds, two to a row, blink over a steady covered key
Rumour in the choir | Plain glass keys | series=Chord_tones tower=In_turn row=0.7 ringers=8 overlap=0.6 cover=0.4 tilt=-5 release=1.4 weight=0.4 muffle=0 beat=0.1 swing=0.2 crossing=0.6 volume=-7 | fold | broken | Glass keys that take turns at singing the whole chord, seven tenths of a second each
Whose turn is it | Evening peal | series=Chord_tones tower=In_turn method=Contrary row=0.9 ringers=6 overlap=0.7 cover=0.3 tilt=-6 release=2 place=1 beat=0.8 muffle=0.3 gap=0 weight=-0.5 swing=0.3 | sides | chorale | Bells that pass the tones of the chord from key to key, crossing as they go
Typists in step | Plucked canon | series=Low row=0.6 ringers=4 overlap=0.8 cover=0.35 tilt=-5 release=0.7 bite=0.42 place=1 method=Hunt beat=1.3 muffle=0.2 gap=0.05 weight=0.3 swing=0.45 volume=0.5 | stub | ostinato | Plain strings in canon, each key a row behind the last and some twice as slow
Heels on a spiral stair | Plain glass keys | tower=Canon series=Fifths method=Rounds row=1.1 ringers=6 overlap=0.7 place=1 tilt=-4 release=1.8 cover=0.2 beat=0.4 muffle=0 weight=0.5 swing=0.25 crossing=0.15 volume=0.5 | dotted | broken | Glass fifths, the next key always behind and upside down, left and right
Round the table | One after another | series=Chord_tones row=0.8 ringers=6 overlap=0.5 cover=0.5 tilt=-4 release=0.8 attack=0.003 method=Treble muffle=0.25 gap=0.3 beat=1.6 weight=0.5 swing=0 volume=-7.5 | firm | wedge | Hummed keys that speak one after another, each led by its highest borrowed tone
Fogged spectacles | Plain glass keys | voice=Breath method=Hunt row=0.9 ringers=5 overlap=0.6 cover=0.55 tilt=-5 bite=0.36 release=0.7 body=0.4 weight=0.3 beat=2 muffle=0.2 swing=0.35 gap=0.1 volume=-2 | tapewarm | touches | Puffs of breath on a soft ground, five of them walking through each key
Blown bottle caps | Plain glass keys | voice=Breath series=Odd method=Rounds row=0.6 ringers=4 overlap=0.5 cover=0.34 tilt=-4.5 bite=0.54 release=0.42 gap=0.4 beat=0.05 muffle=0.4 weight=0.6 swing=0.5 volume=6 | gated | broken | Short odd breaths that puff and fall, almost without a tone
Long summer holidays | Evening peal | voice=Glass row=3 ringers=7 overlap=0.85 cover=0.4 tilt=-5 release=7 bite=0.2 attack=0.01 crossing=0.15 beat=2.2 muffle=0.2 gap=0.2 weight=0.1 volume=-3 | summer | broken | Glass keys that ring on for seconds and go on exchanging places as they fade
Unlocked pedal | Evening peal | row=2.2 ringers=8 overlap=0.8 cover=0.35 tilt=-6 release=9 bite=0.35 body=0.5 crossing=0.9 method=Hunt beat=0.2 muffle=0 gap=0 weight=0.4 swing=0.2 | strings | rising | Bells left to ring, each new key taking the places of the ones before
Garden path at noon | Evening peal | voice=Plucked series=Chord_tones row=1.4 ringers=6 overlap=0.95 cover=0.2 tilt=-4 release=5 bite=0.25 method=Rounds beat=2 muffle=0.22 weight=0.3 gap=0.3 swing=0.5 volume=-4.5 | dubble | broken | Plucked keys that answer each touch with a soft roll of every tone held
`,
    },
    {
      id: 'canon-plucks',
      name: 'Canon plucks',
      category: 'plucked',
      rows: `
Goatherd's harp | Plucked canon | row=1.2 ringers=6 tilt=-3 release=2 cover=0.1 weight=0.4 muffle=0.2 beat=3.2 gap=0.36 volume=0 | table | rising | Plucked fifths that fall in a roll, each key behind the last and in its own time
Wires over a vineyard | Plucked canon | method=Hunt row=2 ringers=8 overlap=0.85 body=0.7 bite=0.5 tilt=-1.5 release=3.5 muffle=0 beat=2 weight=0.15 gap=0 swing=0 cover=0.17 volume=1 | sides | openfour | Bright fifths on wire that hunt up and down in canon, eight to a key
Barrel hoops | Plucked canon | method=Contrary row=0.9 ringers=5 overlap=0.97 bite=0.24 tilt=-5 cover=0.35 release=2.4 beat=0.1 weight=-0.6 muffle=0.3 swing=0.4 volume=-4 | tubed | broken | Fifths from both ends of each row that ring into one another, key after key
Shepherd crossing a ford | Plucked canon | method=Treble row=2.6 ringers=7 weight=0.4 beat=2.6 release=4 tilt=-4 gap=0.1 swing=0.3 muffle=0.05 crossing=0.5 | pebble | imitate | A high plucked fifth leads each row, the low ones answer in other keys' time
Ropes against masts | Plucked canon | method=Dodge row=1.8 ringers=4 overlap=0.9 bite=0.2 tilt=-6 cover=0.3 release=2.5 gap=0.28 beat=0.1 muffle=0.35 weight=0.3 volume=-6.5 | highpass | openfour | Two strings knocking to and fro in each key, no two of the keys in step
Cellars at harvest | Plucked canon | series=Low row=2.4 ringers=5 tilt=-8 cover=0.35 body=0.3 release=3 muffle=0.3 gap=0.3 beat=3.2 weight=0.5 crossing=0.4 volume=-3 | cellos | rising | Dark near overtones rolled slowly, a row behind from key to key
Gut and rosewood | Plucked canon | series=Low method=Hunt row=1 ringers=6 tilt=-5 overlap=0.75 bite=0.3 release=1 cover=0.2 beat=0.9 weight=0.2 muffle=0.2 gap=0 swing=0 volume=-4.5 | wood | broken | Warm strings walking evenly through their overtones, in canon
Old man with a theorbo | Plucked canon | series=Low method=Contrary row=3.2 ringers=8 tilt=-6 body=0.6 release=6 swing=0.3 cover=0.15 beat=1.4 weight=-0.5 gap=0.2 muffle=0.25 | lowshadow | suspend | Long low strings that cross in the middle of three second rows
Weavers at a window | Plucked canon | series=Low method=Dodge row=1.4 ringers=6 overlap=0.92 swing=0.8 tilt=-3 release=2 crossing=0.7 muffle=0.25 gap=0 beat=0.1 weight=0.2 volume=-2 | edges | ostinato | A pair of strings always crossing, leaning on the first of each half row
Loose floorboards | Plucked canon | series=Low method=Treble row=0.7 ringers=3 overlap=0.92 muffle=0.3 bite=0.15 tilt=-4 release=0.84 cover=0.6 beat=0 gap=0.3 weight=0.5 swing=0.5 volume=-2 | stub | touches | Three strings a key, one alone and two together, soft and knocking
Snow lantern koto | Plucked canon | series=Odd row=1.7 ringers=5 bite=0.7 tilt=-2 beat=0.4 release=2.6 cover=0.1 weight=0.45 gap=0.25 muffle=0 crossing=0.6 volume=3 | springs | rising | Hollow odd strings with a hard nail, rolling down behind one another
Cracked willow | Plucked canon | series=Odd method=Hunt row=0.8 ringers=7 overlap=0.8 body=0.8 tilt=-5.5 release=1.12 place=0.6 bite=0.21 cover=0.19 beat=0.05 weight=0 muffle=0 gap=0.15 swing=0 volume=1.5 | paper | ostinato | Odd overtones in quick even steps, dry and a little rough
Cane in two gardens | Plucked canon | series=Odd method=Contrary row=2.2 ringers=8 overlap=0.9 tilt=-2.5 bite=0.3 release=3 place=1 beat=3.2 muffle=0.2 gap=0.1 weight=-0.5 crossing=0.45 cover=0.14 volume=-4.5 | grains | imitate | Odd strings close on the middle from left and right, key after key
Abandoned swing | Plucked canon | series=Odd method=Dodge row=2.8 ringers=4 overlap=0.95 beat=3 tilt=-6 release=4 cover=0.25 gap=0.25 weight=0.3 muffle=0.3 swing=0.6 volume=0 | glacier | threeabove | Two hollow strings swing against each other for a whole row, shivering
Mended fishing line | Plucked canon | series=Odd method=Treble row=1.1 ringers=6 weight=-0.6 tilt=-4.5 bite=0.22 release=2.1 cover=0.31 overlap=0.97 gap=0.42 beat=2 muffle=0.22 swing=0.3 body=0.39 volume=1.5 | glintecho | imitate | Odd strings whose rows grow from a thin high lead to a heavy low end
Letters under the door | Plucked canon | series=Low method=Treble row=1.5 ringers=8 tilt=0 release=1.6 cover=0.2 bite=0.45 muffle=0 gap=0.05 beat=0.7 weight=0.3 swing=0.2 volume=0 | slap | broken | A bright top string alone and then the low ones together, passed round the keys
Ladder in an orchard | Plucked canon | series=Fifths method=Treble row=3 ringers=5 tilt=-3 overlap=0.95 release=5 swing=0.6 muffle=0.3 gap=0.3 beat=2.6 weight=0.3 volume=-5.5 | longplate | rising | Plucked fifths led slowly by one alone, each key at a pace of its own
Harness bells unhung | Plucked canon | voice=Bell method=Treble row=1.3 ringers=6 overlap=0.6 bite=0.5 tilt=-5 release=2 cover=0.1 beat=2 gap=0.3 muffle=0 weight=0.2 volume=-1.5 | chill | imitate | Little bells, not strings: one leads alone and the rest of its fifths fall in | bell
Pigeons on the sill | Plucked canon | series=Low method=Treble row=0.6 ringers=5 overlap=0.8 muffle=0.6 tilt=-7 release=0.9 bite=0.2 cover=0.3 beat=0.25 gap=0.2 weight=0.4 swing=0.5 volume=-4.5 | felt | ostinato | Soft dull plucks that coo to and fro in rows shorter than a second
Cartwheel in a stream | Plucked canon | series=Chord_tones method=Treble row=2 ringers=7 tilt=-4 release=3 crossing=0.8 cover=0.05 beat=2 gap=0 muffle=0.2 weight=0.1 volume=-11.5 | unfold | inner | Plucked tones of the chord, the lead alone and first in every key's own row
Two looms and a cat | Hollow loom | tower=Canon method=Contrary row=1.5 swing=0.9 ringers=7 tilt=-5 release=2 bite=0.2 beat=0.1 muffle=0 gap=0.3 crossing=0.3 volume=0 | firm | openfour | Strings gathered into two broad strokes a row, every key out of step
Cobbler at his last | Hollow loom | tower=Canon method=Hunt row=0.7 overlap=0.8 ringers=5 bite=0.6 tilt=-6 release=0.5 cover=0.3 swing=0.5 beat=2.6 muffle=0.45 gap=0.25 crossing=0.1 volume=-3.5 | narrow | ostinato | Tapped short strings with a lilt, one key always behind another
Silk on a drum | Hollow loom | tower=Canon series=Fifths method=Rounds row=2.6 swing=0.4 ringers=6 tilt=-2 release=4 body=0.5 bite=0.05 weight=0.3 gap=0.36 beat=2 muffle=0.2 crossing=0.35 volume=-0.5 | drift | rising | Silky fifths with hardly a touch, rolled in a slow canon
Shuttle and weft | Hollow loom | tower=Canon series=Odd method=Hunt row=1.1 overlap=0.9 ringers=8 tilt=-1 swing=0.2 release=1.5 place=1 beat=0.05 muffle=0 gap=0 weight=0.2 crossing=0.1 volume=2.5 | leftright | ostinato | Eight odd strings running through each key, the keys thrown wide apart
Looms stopped for lunch | Hollow loom | tower=Canon method=Long row=1.6 swing=0.3 ringers=6 tilt=-4 release=3 gap=0.5 bite=0.3 beat=1 muffle=0.2 weight=0.2 crossing=0.4 | patter | touches | Two plucks to a row and then a rest, scattered over the keys
Glazier with a hammer | Plain glass keys | tower=Canon row=1.6 ringers=6 overlap=0.5 place=1 release=2 cover=0.15 tilt=-3 weight=0.3 muffle=0.05 beat=1.6 swing=0.3 volume=-0.5 | stackdown | imitate | Struck glass in canon, each key walking its own row behind the first | bell
Goldfinch at the wire | Plain glass keys | tower=Canon method=Rounds series=Odd row=0.8 ringers=5 overlap=0.2 bite=0.44 release=0.9 cover=0.29 tilt=-4.5 muffle=0 beat=0.4 gap=0.35 weight=0.4 body=0.32 volume=6 | bare | imitate | Quick odd glass that falls away at each touch and comes back in another key | bell
Dew on the fence | Dodging lights | row=1.1 ringers=8 tilt=-4 bite=0.4 body=0.5 release=2.5 overlap=0.5 muffle=0.2 gap=0.1 weight=0.3 swing=0.4 volume=-5 | points | rising | Odd bells that flicker in pairs, key behind key | bell
Pewter thimbles | Dodging lights | method=Rounds series=Low row=0.7 ringers=4 overlap=0.4 bite=0.7 release=0.7 cover=0.2 gap=0.3 muffle=0.3 beat=0.2 weight=0.5 volume=3 | little | broken | Small dry bells in a short roll, following one another like thimbles on a table | bell
Skylight in the rain | High treble | voice=Plucked tower=Canon method=Hunt series=High row=1 ringers=7 overlap=0.8 cover=0.71 tilt=-5.5 release=1.8 bite=0.22 beat=1.4 muffle=0 gap=0 weight=-0.5 swing=0 body=0.32 volume=4.5 | rain | wide | Very high strings ticking over plain low notes, every key in other time
Borrowed mandolin | Plucked canon | series=Chord_tones method=Dodge row=1.2 ringers=8 overlap=0.95 tilt=-3 bite=0.5 release=2 weight=0.15 muffle=0 beat=2.5 gap=0 swing=0 | valve | rising | Pairs of chord tones plucked to and fro, so fast that every key trembles
Wedding one village over | Plucked canon | series=Chord_tones method=Rounds row=0.9 ringers=6 body=0.8 bite=0.6 tilt=-2 release=1.5 place=1 gap=0.28 beat=0.2 muffle=0.3 weight=0.4 swing=0.45 volume=-2 | nextdoor | openfour | Strummed tones of the whole chord, every key a row late and a side apart
Sugar for the horses | Plucked canon | series=Chord_tones method=Hunt row=1.8 ringers=5 overlap=0.8 tilt=-7 cover=0.3 release=2.5 crossing=0.9 swing=0.35 muffle=0.35 beat=0.1 weight=0.25 gap=0.42 | reel | chorale | Round soft plucks that give every key the notes of the others, one by one
Folded paper fleet | Plucked canon | series=Chord_tones method=Contrary row=2.4 ringers=8 tilt=-5 overlap=0.9 release=3.5 beat=0.9 cover=0.1 gap=0.05 muffle=0.05 weight=-0.55 swing=0.2 crossing=0.6 | rings | suspend | Chord tones plucked from both ends, meeting in the middle of every key's row
Tickets and change | Plucked canon | series=Chord_tones method=Long row=1 ringers=7 overlap=0.7 tilt=-3 bite=0.6 release=1.2 cover=0.15 beat=1 muffle=0.2 weight=0 gap=0.35 swing=0.3 volume=0.5 | tamed | ostinato | Single plucks of chord tones, two to a row, traded over the keys
Pizzicato under snow | Plucked canon | series=Low muffle=0.8 row=1.4 ringers=5 tilt=-6 cover=0.3 release=1 bite=0.4 gap=0.3 beat=0.1 weight=0.3 swing=0.3 volume=-1 | muffled | broken | Strings stopped by leather, rolled short and dull in canon
Horses in the mews | Plucked canon | series=Low method=Hunt muffle=1 row=0.5 ringers=4 overlap=0.9 bite=0.54 tilt=-5 cover=0.25 release=0.56 beat=0 weight=0.4 swing=0.6 gap=0 volume=4 | box | ostinato | Knocks more than notes: four damped strings trotting through half second rows
Garden by touch | Plucked canon | muffle=0.5 method=Contrary row=2 ringers=6 tilt=-4 release=2.4 weight=0.3 cover=0.2 beat=2 swing=0.25 gap=0.3 crossing=0.3 volume=-5 | reflection | imitate | Open fifths and their muffled echo by turns, crossing in every row
Tailor's dummy | Plucked canon | series=Odd muffle=0.7 method=Rounds row=0.9 gap=0.6 ringers=7 tilt=-2 release=1.12 bite=0.3 overlap=0.97 cover=0.1 beat=0.25 weight=0.3 swing=0.3 crossing=0.45 volume=4.5 | pot | touches | Odd strings under cloth that roll down, stop and wait for their turn
Cork in a bottle | Plucked canon | series=Fifths muffle=0.9 method=Treble row=1.2 ringers=3 tilt=-8 cover=0.4 release=0.7 bite=0.6 beat=2.6 weight=0.5 swing=0.4 gap=0.4 volume=-5 | cistern | broken | Three thick plucks a key, damped, with one fifth popping out alone
Chess in the park | Quarter hour | voice=Plucked tower=Canon series=Fifths row=1.4 bite=0.4 cover=0.15 ringers=5 release=3 tilt=-4 muffle=0.2 gap=0.3 weight=0.2 swing=0 beat=1 volume=-2 | steps | openfour | One plucked fifth and then another, each key thinking in its own time
Postman on the hill | Quarter hour | voice=Plucked tower=Canon series=Odd row=0.7 overlap=0.8 cover=0.35 bite=0.28 ringers=8 release=2 tilt=-3 muffle=0 beat=0.9 weight=-0.4 gap=0.36 swing=0.3 volume=0.5 | darkecho | imitate | Single odd plucks stepping quickly from key to key
Evening over the locks | Quarter hour | voice=Plucked tower=Canon series=Low row=2.6 overlap=0.9 cover=0.25 bite=0.15 ringers=6 tilt=-7 body=0.3 muffle=0.3 gap=0.1 beat=2 weight=0.15 crossing=0.15 volume=-21 | tails | rising | Slow lone strings, dark and long, that take many rows to come round
Star chart on the table | Quarter hour | voice=Plucked tower=Canon series=High row=1.2 cover=0.76 ringers=8 bite=0.3 release=4 tilt=-4.5 overlap=0.9 beat=0.1 muffle=0 gap=0 weight=0.1 swing=0 volume=3.5 | nightsky | inner | Far high plucks, two a row, over the plain notes held below
Waiting for the kettle | Quarter hour | voice=Plucked tower=Canon series=Chord_tones row=1.8 cover=0.1 ringers=7 bite=0.25 release=2 tilt=-5 beat=2.2 muffle=0.22 gap=0.25 weight=0.1 crossing=0.6 volume=-6 | murky | chorale | Lone chord tones that shiver as they ring, one key and then its neighbour
Gate in the long grass | Plucked canon | row=4.5 ringers=8 tilt=-5 weight=0.8 release=8 cover=0.1 body=0.6 beat=1.4 muffle=0.2 gap=0.28 swing=0.3 volume=-6.5 | backroom | suspend | Great slow rolls of fifths, as full at the top as at the bottom, in canon
Afternoon with a map | Plucked canon | series=Low method=Contrary row=5.5 ringers=7 overlap=0.95 tilt=-4 release=7 attack=0.6 bite=0.05 beat=2.2 muffle=0 gap=0 weight=-0.6 swing=0.2 volume=-5.5 | softbed | wide | Strings without an edge that climb and sink at once over five seconds | string
Kites from a bridge | Plucked canon | series=Fifths method=Hunt row=3.6 ringers=8 tilt=3 overlap=0.85 release=5 cover=0.2 bite=0.2 place=1 beat=1.5 muffle=0.05 gap=0.42 weight=0.3 volume=-1.5 | stackup | rising | High fifths let forward, hunting slowly through a canon of keys
Nightwatch in slippers | Plucked canon | series=Low method=Rounds row=3 gap=0.9 ringers=4 tilt=-9 cover=0.5 release=2 muffle=0.4 weight=0.3 beat=0.4 swing=0.25 crossing=0.4 volume=-6 | shaft | threeabove | Low soft rolls with a rest as long as themselves, round and dark
Swallows gone | Plucked canon | series=Odd method=Hunt row=6 ringers=6 overlap=0.9 tilt=-3 release=9 crossing=0.5 cover=0.05 beat=0.1 muffle=0.3 gap=0.1 weight=0.2 swing=0 volume=-1 | vapour | openfour | Sparse odd strings a second apart, every key in a slower or a quicker time
`,
    },
    {
      id: 'covered-bass',
      name: 'Covered bass',
      category: 'bass',
      rows: `
Barge engine idling | Covered bass | row=0.6 ringers=4 overlap=0.6 cover=0.8 tilt=-6 release=0.4 body=0.5 beat=2.8 muffle=0 weight=0.2 gap=0 place=0.1 swing=0 volume=-8.5 | bare | lowline | A reed bass with a quick low flutter of four ringers in every half second
Bass clarinet alley | Covered bass | series=Odd ringers=5 row=3 cover=0.5 tilt=-6 body=0.8 bite=0.4 release=0.5 beat=0.7 muffle=0.25 weight=0.3 gap=0.4 swing=0.3 volume=-5.5 | wideends | lowline | Odd low reeds, hollow and full, changing neighbours over a covered ground
Tugboat rope | Covered bass | method=Rounds ringers=3 row=1.5 cover=0.6 tilt=-8 weight=0.7 body=0.7 release=0.3 overlap=0.7 beat=2 muffle=0 gap=0.25 swing=0.5 place=0.1 volume=-5 | grit | lowline | A rough reed bass that rolls through its three ringers and stops for breath
Undertaker's harmonium | Covered bass | series=Fifths method=Contrary ringers=6 row=4 cover=0.7 tilt=-5 release=1.2 attack=0.05 beat=1.8 muffle=0.3 gap=0.15 weight=-0.5 volume=-6.5 | darkhall | lowpair | Low reeds in fifths that cross once in four seconds over a held tone
Diesel through fog | Covered bass | method=Dodge ringers=3 row=2 cover=0.65 tilt=-10 beat=5 body=0.3 release=0.6 overlap=0.9 muffle=0.2 weight=0.4 gap=0 swing=0.4 place=0 volume=-6.5 | stack | lowheld | Two low reeds trading quickly with a rough beat, dark as oil
Bass in the hallway | Covered bass | voice=Plucked method=Rounds ringers=5 row=1.8 cover=0.6 bite=0.4 tilt=-6 body=0.4 release=0.5 overlap=0.8 beat=0.1 muffle=0 weight=0.3 swing=0.2 gap=0.28 volume=-5 | stub | lowline | A plucked bass over a firm ground, each touch a soft roll of low strings
Slack bass string | Covered bass | voice=Plucked method=Hunt ringers=4 row=2.6 cover=0.35 bite=0.2 tilt=-8 beat=1.2 release=1.5 overlap=0.9 muffle=0.35 weight=0.15 gap=0.2 swing=0 | narrow | lowline | A loose dark string whose four overtones trade slowly as it shakes
Knuckles on the bass | Covered bass | voice=Plucked method=Treble series=Odd ringers=6 row=0.8 cover=0.75 bite=0.25 tilt=-2 body=0.8 release=0.35 overlap=0.92 beat=0 muffle=0 weight=0.5 swing=0.45 gap=0.06 volume=0 | wood | lowline | A quick pluck with odd strings knocking behind it, dry and near
Washtub and wire | Covered bass | voice=Plucked series=Fifths method=Contrary ringers=5 row=1.2 cover=0.45 bite=0.3 tilt=-5 release=0.98 overlap=0.95 swing=0.6 beat=1 muffle=0.2 weight=0.3 gap=0 volume=-1.5 | combo | lowline | A plucked low fifth that thumps in two strokes to each row
Theorbo in a well | Covered bass | voice=Plucked series=Low method=Contrary ringers=8 row=4 cover=0.3 bite=0.15 tilt=-5 release=4 overlap=0.95 beat=3.2 muffle=0.05 weight=-0.5 gap=0.34 swing=0.2 volume=-4 | cistern | lowheld | Long low strings, rising and sinking at once inside each held note
Mouth of the estuary | Slow hum | method=Hunt ringers=4 row=2.5 cover=0.85 tilt=-9 release=0.8 attack=0.02 body=0.3 bite=0 beat=0.1 muffle=0 weight=0.4 gap=0.15 place=0 volume=-20 | floor | walkdown | A deep hummed bass, an octave under the key, nearly all of it ground
Monk on the stair | Slow hum | method=Rounds ringers=6 row=1.6 cover=0.6 tilt=-4 release=0.6 attack=0.015 body=0.9 gap=0.3 beat=1.3 muffle=0.2 weight=0.4 swing=0.3 place=0.4 volume=-4 | stone | walkdown | A low hum that falls through six voices and takes a breath
Grey swell past the buoy | Slow hum | series=Fifths method=Contrary ringers=5 row=5 cover=0.6 tilt=-1 release=4 attack=0.2 beat=0.8 muffle=0.3 weight=-0.55 gap=0.18 swing=0 volume=-6 | lowcath | walkdown | Deep hums in fifths that bend across one another over five seconds
Double doors closing | Slow hum | series=Odd method=Treble ringers=5 row=1 cover=0.8 tilt=-7 release=0.4 attack=0.01 body=0.5 bite=0.5 beat=0.8 muffle=0.2 gap=0.2 weight=0.5 swing=0.4 place=0.3 volume=-5 | midpulse | walkdown | A thick hum with an odd voice that speaks first in every second
Bears in the orchard | Slow hum | method=Dodge ringers=3 row=1.4 cover=0.7 tilt=-8 release=0.5 attack=0.02 body=0.6 beat=2.5 muffle=0.5 gap=0.4 weight=0.3 swing=0.5 place=0.2 volume=1.5 | pillow | walkdown | A growling low hum, two voices changing places under a heavy tone
Anchor bell | Evening peal | ringers=4 row=2.2 cover=0.6 tilt=-8 bite=0.4 body=0.3 release=2 overlap=0.7 place=0.3 beat=0.1 gap=0.28 muffle=0.25 weight=0.3 volume=-5.5 | steps | lowpair | A low bell over its covering tone, three more of them taking turns above
Cannon metal | Evening peal | method=Rounds series=Fifths ringers=5 row=1.4 cover=0.45 tilt=-6 bite=0.6 body=0.6 release=1.2 overlap=0.6 weight=0.6 beat=0.2 gap=0.3 muffle=0 swing=0.3 place=0.3 | iron | lowline | Heavy low bells in fifths that roll down hard and die
Foundry after hours | Evening peal | method=Contrary series=Odd ringers=7 row=3.5 cover=0.5 tilt=-5 bite=0.2 body=0.5 release=5 overlap=0.85 beat=0.3 muffle=0.2 gap=0.12 weight=-0.6 swing=0.2 crossing=0.15 volume=-4 | descent | lowheld | Odd metal over a deep tone, two lines of it crossing slowly
Manhole in the rain | Evening peal | method=Dodge series=Odd ringers=3 row=0.9 cover=0.7 tilt=-7 bite=0.7 body=0.55 release=0.6 overlap=0.5 beat=2 gap=0.06 muffle=0 weight=0.4 swing=0.3 place=0.4 | chill | lowline | A short ringing bass, two odd bells of it knocking to and fro
Great wheel of the mill | Evening peal | method=Treble series=Low ringers=6 row=4.5 cover=0.75 tilt=-9 bite=0.1 body=0.2 release=3 gap=0.3 overlap=0.8 beat=1.4 muffle=0.3 weight=0.3 swing=0.4 place=0.3 | rotor | lowheld | A slow covered bass where one high bell leads and the low ones follow round
Deep end of the pool | Plain glass keys | ringers=4 cover=0.95 tilt=-10 row=2 overlap=0.7 release=0.8 bite=0.1 body=0.02 beat=0 muffle=0.2 weight=0.2 gap=0 swing=0 place=0.15 | bare | lowline | Almost a plain low tone, with four glass overtones hardly lit above it
Cellar jars in line | Plain glass keys | series=Odd method=Rounds ringers=6 cover=0.7 tilt=-5 row=0.8 overlap=0.5 release=0.5 bite=0.5 beat=0.1 muffle=0 gap=0.3 weight=0.4 swing=0.3 volume=-5.5 | tube | lowline | A round bass with a short rattle of odd glass at each touch
Moon over a reservoir | Plain glass keys | series=Fifths method=Hunt ringers=8 cover=0.8 tilt=-3 row=4 overlap=0.9 release=4 attack=0.02 place=0.9 beat=1 muffle=0.2 gap=0.1 weight=0.2 crossing=0.15 | linger | lowpair | A pure low tone and, wide above it, glass fifths that keep exchanging
Bottle bank basement | Plain glass keys | series=High method=Dodge ringers=5 cover=0.9 tilt=-4 row=1.2 overlap=0.6 release=0.6 bite=0.3 place=1 beat=0.1 muffle=0 gap=0.3 weight=0.3 swing=0.4 volume=-6.5 | booth | lowline | Two far glass overtones flicker over a steady plain bass
Night ferry lights | Plain glass keys | series=Low method=Contrary ringers=7 cover=0.6 tilt=-2 row=3 overlap=0.8 release=2.5 beat=1.5 attack=0.01 muffle=0.05 gap=0 weight=-0.5 swing=0.2 volume=-5 | swellroom | lowheld | A low tone lit by a full set of crossing glass overtones that waver
Wind in the flue | Moving air | tower=Together series=Low method=Hunt ringers=5 row=2.4 cover=0.8 tilt=-8 release=0.8 attack=0.02 body=0.3 overlap=0.8 beat=0.7 muffle=0.25 gap=0.34 weight=0.2 swing=0 place=0.4 volume=-4.5 | halfspeed | lowline | A low tone with breath moving through it, band by band
Jug band at noon | Moving air | tower=Together series=Odd method=Rounds ringers=4 row=0.7 cover=0.6 tilt=-5 release=0.42 attack=0.005 bite=0.54 body=0.6 overlap=0.6 beat=3.4 muffle=0.3 weight=0.4 gap=0.3 swing=0.4 place=0.5 volume=-1 | pot | lowline | A puffed bass: odd breaths on a short low ground, blown across a lip
Train under the hill | Moving air | tower=Opposed series=Fifths method=Contrary row=3 cover=0.65 tilt=-6 release=3 attack=0.1 ringers=6 overlap=0.95 beat=0.05 muffle=0.2 gap=0.18 weight=-0.4 swing=0.2 volume=-4.5 | lowtide | lowheld | Low air in fifths that leans from side to side over a covered note
Long pipe weather | Moving air | tower=Together series=Low method=Dodge ringers=3 row=1.8 cover=0.7 tilt=-7 release=0.5 attack=0.01 body=0.9 beat=3 overlap=0.9 gap=0 muffle=0.05 weight=0.3 swing=0.3 place=0.3 | vowel | lowheld | Breath and tone trading between two low places, with a quick waver
Ballast in the hold | Moving air | tower=Together series=High method=Long ringers=8 row=1.5 cover=1 tilt=-5 release=0.7 attack=0.01 bite=0.2 overlap=0.7 beat=2 muffle=0 gap=0.3 weight=0 swing=0 volume=0 | sides | lowline | As much covering tone as there is, with single breaths far above it
Coffin maker | Leather and stone | series=Fifths method=Hunt ringers=3 row=2.4 cover=0.4 tilt=-4 release=0.5 bite=0.5 overlap=0.7 gap=0.5 swing=0.6 beat=0.1 volume=-15.5 | fuzz | walkdown | Three leathered bells in fifths, walked through slowly with a rest after
Boots on a boardwalk | Leather and stone | voice=Plucked series=Low method=Hunt ringers=3 row=0.6 cover=0.6 tilt=-6 release=0.3 bite=0.8 muffle=1 overlap=0.8 beat=0.25 gap=0.4 swing=0.6 weight=0.6 volume=-1.5 | table | lowline | Damped strings that trot in threes under a dull tick
Turf house | Leather and stone | voice=Hum series=Odd method=Treble ringers=5 row=2.4 cover=0.45 tilt=-4 release=1 bite=0.2 muffle=0.6 attack=0.02 overlap=0.8 body=0.8 gap=0.25 beat=0.8 swing=0.3 place=0.3 volume=-3.5 | muffled | walkdown | Odd hums under leather, one voice leading and the rest half heard
Kneeling drum | Leather and stone | voice=Bell series=Odd method=Dodge ringers=4 row=1 cover=0.5 tilt=-9 release=0.4 bite=1 muffle=1 overlap=0.5 weight=0.8 gap=0 swing=0.2 beat=0 place=0.2 volume=-6.5 | hammers | lowline | A thud with a low tone in it, heavy on the first blow of each second
Felt boots | Leather and stone | voice=Reed series=Fifths method=Contrary ringers=5 row=3 cover=0.8 tilt=-7 release=0.6 bite=0.1 muffle=0.6 overlap=0.9 attack=0.01 beat=3.4 gap=0.28 weight=-0.4 swing=0.2 volume=-7.5 | blanket | lowpair | Low reeds in fifths with leather on the back strokes, soft underfoot
Open fifth ploughing | Covered bass | series=Fifths method=Hunt ringers=4 row=2 cover=0.6 tilt=-3 body=0.6 release=0.5 place=0.6 beat=0.9 muffle=0.2 gap=0.15 weight=0.2 swing=0 volume=-8 | pedal | walkdown | A reed bass in stacked fifths, the octave below and the fifth above by turns
Two fathoms | Covered bass | voice=Hum series=Fifths method=Long ringers=5 row=1.6 cover=0.7 tilt=-6 release=1 attack=0.015 bite=0.2 beat=1 muffle=0.22 gap=0 weight=0.1 swing=0.3 place=0.1 volume=-4.5 | reel | walkdown | A hummed ground where one deep fifth speaks and then another
Oxen on the ford | Covered bass | voice=Bell series=Fifths method=Dodge ringers=4 row=3 cover=0.55 tilt=-7 release=2 beat=0.2 overlap=0.75 bite=0.3 muffle=0.3 gap=0.06 weight=0.4 swing=0.2 volume=-14 | larger | walkdown | Low bell fifths in slow pairs over a tone that does not move
Standing stones | Covered bass | voice=Bell series=Fifths method=Contrary ringers=8 row=6 cover=0.5 tilt=-3 release=6 attack=0.05 overlap=0.95 place=0.8 muffle=0.35 beat=0.8 gap=0.12 weight=-0.5 swing=0 volume=-7.5 | undertow | lowheld | Bell fifths above a deep ground, crossing once in a row of nearly seven seconds
Salt mine lift | Covered bass | voice=Plucked series=Fifths method=Treble ringers=5 row=1.4 cover=0.5 tilt=-4 release=0.8 overlap=0.85 bite=0.5 weight=-0.5 beat=0.4 muffle=0 gap=0.34 swing=0.3 volume=-7.5 | subbed | walkdown | Plucked fifths that grow from a light lead to a heavy low string
Heart under wool | Covered bass | voice=Bell tower=Opposed method=Rounds ringers=3 row=0.7 cover=0.6 tilt=-9 release=0.5 overlap=0.5 place=1 bite=0.2 gap=0.2 swing=1 beat=0 muffle=0.3 weight=0.2 | narrow | lowheld | A soft low double knock that answers itself under a held tone
Slow freight at night | Covered bass | voice=Reed tower=Opposed method=Hunt ringers=5 row=0.4 cover=0.7 tilt=-7 release=0.3 overlap=0.7 place=0.8 gap=0.5 beat=3.4 muffle=0 weight=0.3 swing=0.3 series=Odd body=0.75 volume=-9 | lowpulse | lowheld | A hollow reed bass that rattles over four tenths of a second, side and other side
Pump house | Covered bass | voice=Plucked tower=Opposed method=Dodge ringers=4 row=1 cover=0.45 tilt=-7 release=0.4 overlap=0.8 place=0.7 bite=0.4 swing=0.7 beat=0.1 muffle=0.2 gap=0.4 weight=0.4 | throb | lowheld | Two low strings pumping in a lilt, now from the left and now the right
Moth at the speaker | Covered bass | voice=Glass tower=Opposed series=Odd method=Long ringers=6 row=0.5 cover=0.85 tilt=-5 release=0.6 overlap=0.6 place=1 beat=1.6 muffle=0.05 gap=0.28 weight=0.1 swing=0 volume=-4 | tiltone | lowline | A round bass with one odd glass note flitting from side to side above it
Sleeper train bunk | Covered bass | voice=Hum tower=Opposed method=Contrary ringers=6 row=1.3 cover=0.65 tilt=-7 release=0.8 attack=0.01 overlap=0.8 place=0.9 beat=0.1 muffle=0.2 gap=0 weight=-0.5 swing=0.3 volume=-7 | chorale | walkdown | A hummed bass that rocks between two sides a little slower than a heart
Ice shelf calving | Covered bass | voice=Bell method=Hunt ringers=8 row=9 cover=0.7 tilt=-6 release=10 attack=0.15 overlap=1 body=0.6 crossing=0.8 muffle=0 gap=0 beat=0.3 weight=0.1 swing=0.2 volume=-9 | valley | lowheld | A low tone in which eight bells change places over nine seconds
Wine in the dark | Covered bass | voice=Plucked method=Hunt ringers=6 row=3 cover=0.5 tilt=-9 release=3 overlap=1 bite=0.02 attack=1 body=0.2 beat=1.4 muffle=0.25 weight=0.1 gap=0.15 swing=0 place=0 | evening | lowheld | Strings plucked without an edge until they are one soft low ground
Smouldering peat | Covered bass | voice=Breath method=Hunt ringers=6 row=6 cover=0.75 tilt=-9 release=5 attack=0.15 overlap=1 body=0.2 series=Low beat=3 muffle=0.2 gap=0.06 weight=0.3 swing=0.2 volume=-3.5 | darkbank | lowheld | Low breath that smoulders round a covered tone for as long as it is held
Cathedral crypt pipes | Covered bass | voice=Reed method=Rounds series=Low ringers=7 row=7 cover=0.8 tilt=-6 release=4 attack=0.06 overlap=1 body=0.5 beat=1.3 muffle=0.2 gap=0.1 weight=0.3 swing=0.25 place=0.5 volume=-8.5 | monks | lowheld | A great low reed whose ranks roll down from the top and start again
Last tram to the depot | Covered bass | voice=Glass method=Dodge ringers=4 row=4 cover=0.9 tilt=-8 release=2 attack=0.02 overlap=0.9 beat=0.5 body=0.15 muffle=0 gap=0.25 weight=0.3 swing=0.3 place=0.1 volume=-8 | trail | lowline | A glassy bass over a plain tone, trembling softly between two overtones
`,
    },
    {
      id: 'half-muffled',
      name: 'Half muffled bells',
      category: 'bell',
      rows: `
Sexton with a cold | Half muffled bells | row=1.8 ringers=6 gap=0.4 tilt=-6 release=3 weight=0.3 swing=0.3 beat=0.5 crossing=0.15 volume=1 | table | tolling | A falling peal, one row open and the next in leather, with a rest between
First frost service | Half muffled bells | row=3 ringers=8 tilt=-3 body=0.7 bite=0.6 release=6 gap=0.1 weight=0.1 beat=0.2 swing=0 crossing=0.1 volume=-4.5 | brighthall | knell | Eight bright bells down the row and then their dull echo, three seconds each
Short funeral | Half muffled bells | row=0.9 ringers=4 tilt=-8 weight=0.6 release=1.2 gap=0.7 body=0.25 swing=0.5 beat=0.25 crossing=0.5 place=0.35 volume=0.5 | stub | tolling | Four low bells that tumble, stop, and tumble again in leather
Ivy on the rope | Half muffled bells | row=2.4 ringers=5 muffle=0.22 tilt=-5 beat=2 release=4 cover=0.35 weight=0.4 swing=0.2 gap=0.15 volume=6 | swirl | touches | A peal only a little dulled, each bell wavering twice a second
Bells under tarpaulin | Half muffled bells | row=1.4 ringers=7 muffle=0.8 bite=0.8 tilt=-4 release=2 cover=0.2 beat=0.3 weight=0.5 swing=0.25 volume=4 | muffled | highbells | A roll of seven under heavy leather, the clappers heard more than the metal
Slate roof morning | Half muffled bells | series=Fifths row=2 ringers=6 tilt=-4 gap=0.1 release=4 cover=0.2 weight=0.5 beat=2 swing=0.2 volume=1 | slack | knell | Fifths that roll down open and come back muffled, row about
Harbour chapel wedding | Half muffled bells | series=Fifths method=Hunt row=2.8 ringers=8 overlap=0.85 tilt=-2 release=5 gap=0 weight=0.1 beat=0.2 swing=0 place=1 volume=0 | outside | tolling | Bright fifths in an even walk, every second row of it under leather
Angel missing a wing | Half muffled bells | series=Fifths method=Contrary row=5 ringers=5 overlap=0.9 tilt=-7 bite=0.2 release=9 beat=0.3 weight=-0.6 swing=0.3 gap=0.12 crossing=0.5 volume=-4.5 | stillroom | knell | Slow dark fifths that cross, loud and then dull, five seconds to a row
Bell metal in the creek | Half muffled bells | series=Fifths method=Dodge row=1.5 ringers=4 tilt=-5 overlap=0.6 release=2 crossing=0.8 weight=0.35 beat=0.1 swing=0.5 volume=-9 | shallows | touches | Two bells out of stacked fifths knock to and fro, the next pair in leather
Vestry key | Half muffled bells | series=Fifths method=Treble row=1.2 ringers=7 muffle=0.6 tilt=-4.5 release=2.1 bite=0.32 overlap=0.6 cover=0.27 swing=0.4 beat=0.8 weight=0.2 gap=0.5 body=0.39 volume=2.5 | subecho | highbells | A clear high fifth, and the low ones stumbling after it half covered
Tinker's cart | Half muffled bells | series=Odd row=1 ringers=7 tilt=-9.5 release=1.4 bite=0.7 gap=0.28 overlap=0.6 weight=0.4 beat=0.1 swing=0.35 crossing=0.15 cover=0.4 volume=-1.5 | grit | tolling | Odd clangs in a short roll, open and then dull, rough as tin
Weathered carillon | Half muffled bells | series=Odd method=Hunt row=2.6 ringers=8 overlap=0.8 tilt=-6 beat=3 release=5 gap=0 weight=0.2 swing=0 crossing=0.6 volume=-1 | oldreel | tolling | Odd bells in a long even row that shake with age, half of them in leather
Gate of the old mint | Half muffled bells | series=Odd method=Contrary row=1.6 ringers=6 overlap=0.8 tilt=-2 body=0.6 bite=0.3 release=4.2 place=1 cover=0.15 weight=-0.5 beat=0.3 swing=0.2 volume=-2 | metalring | knell | Bright odd metal from left and right, meeting, then the same in cloth
Ship breakers yard | Half muffled bells | series=Odd method=Dodge row=2 ringers=3 muffle=0.65 tilt=-4 bite=0.9 release=4 weight=0.5 overlap=0.7 swing=0.4 beat=0.5 gap=0.45 crossing=0.1 | shaft | knell | Three odd plates of metal struck in turn, hard ones and wrapped ones
Salt on iron | Half muffled bells | series=Odd method=Treble row=3.4 ringers=5 muffle=0.4 tilt=-9.5 release=6 cover=0.49 overlap=0.75 weight=0.3 beat=1.5 swing=0.3 bite=0.25 body=0.32 volume=4 | stone | touches | An odd bell calls from the top, two low ones answer through leather
Six in the ringing room | Half muffled bells | series=Low method=Hunt row=2 ringers=6 overlap=0.7 tilt=-5 gap=0.42 release=3 body=0.5 weight=0 swing=0 beat=0.4 crossing=0.2 volume=2 | chime | highbells | Six bells change places one by one, a clear row and a covered row
Evening practice | Half muffled bells | series=Low method=Hunt row=1.2 ringers=8 overlap=0.5 tilt=-4 bite=0.6 release=1.6 gap=0.3 beat=0.1 weight=0.2 swing=0 place=1 volume=-1.5 | hammers | tolling | Eight quick bells in even order, with a breath after every row
Learning the ropes | Half muffled bells | series=Low method=Hunt row=4 ringers=4 overlap=0.6 tilt=-6 bite=0.3 release=4 gap=0.5 swing=0.8 weight=0.4 beat=2 crossing=0.15 volume=-1 | steps | knell | Four bells unevenly, in two slow strokes a row with a long wait after
Moon on the louvres | Half muffled bells | series=Low method=Hunt row=3 ringers=7 overlap=0.95 tilt=-3 bite=0.1 release=8 cover=0.2 weight=-0.5 beat=0.4 swing=0 gap=0.05 crossing=0.7 volume=-5.5 | glimmerhall | imitate | Soft bells that overlap a whole row, open and leathered ones mixed together
Ringers go home | Half muffled bells | series=Low method=Hunt row=0.6 ringers=5 overlap=0.5 tilt=-8 release=1.12 cover=0.45 bite=0.24 weight=0.3 swing=0.4 beat=0 crossing=0.5 volume=0 | looped | touches | Five short bells in quick order over a low ground, every other row dull
Deacon on the stairs | Half muffled bells | method=Treble row=2 ringers=8 overlap=0.7 tilt=-2 bite=0.5 release=3 muffle=0.5 beat=0.4 weight=0.2 swing=0.5 volume=-1 | backroom | tolling | The highest bell alone, then four low ones gathered, then both in leather
Lamb bells at night | Half muffled bells | method=Treble series=Low row=1 ringers=4 overlap=0.6 tilt=-4 release=1.4 place=1 bite=0.24 cover=0.15 weight=0.4 beat=1.4 gap=0.3 swing=0.3 volume=5.5 | flock | highbells | One small bell leads and two answer, the pair of rows bright and dull
Queen of the belfry | Half muffled bells | method=Treble series=High row=2.4 ringers=6 overlap=0.7 tilt=-2 cover=0.5 release=5 body=0.3 weight=0.3 beat=0.2 swing=0.15 crossing=0.15 volume=-4.5 | octavehalo | knell | A very high bell leads over a steady low tone, every second row covered
Message from upriver | Half muffled bells | method=Treble series=Low row=3 ringers=5 overlap=0.8 tilt=-6 weight=-0.7 release=4 muffle=0.7 swing=0.3 beat=0.8 gap=0.36 crossing=0.6 volume=-3 | fogbound | tolling | A faint high call that grows into heavy low bells, all of it in some leather
Goose at the gate | Half muffled bells | method=Treble series=Odd voice=Reed row=1.2 ringers=5 overlap=0.5 tilt=-10 release=0.5 attack=0.003 bite=0.5 beat=3 weight=0.4 swing=0.5 cover=0.55 volume=5.5 | combo | touches | Reeds, not bells: a nasal call and two low answers, open and then muted | wind
Two ropes crossed | Half muffled bells | method=Contrary row=1.6 ringers=6 tilt=-7 overlap=0.7 release=2.5 gap=0.1 place=1 weight=-0.5 beat=0.3 swing=0 cover=0.22 bite=0.34 body=0.39 volume=5 | reflection | highbells | Bells that climb on one side and sink on the other, open and then wrapped
Spiral in the tower | Half muffled bells | method=Contrary row=4 ringers=8 tilt=-4 overlap=0.88 release=8 crossing=0.9 bite=0.2 weight=-0.3 gap=0.1 beat=1.4 swing=0.2 volume=-8 | stair | openfour | Two lines of bells through each other in four seconds, half of them dull
Wringing hands | Half muffled bells | method=Dodge row=1.2 ringers=5 tilt=-6 overlap=0.5 swing=0.6 release=1.6 bite=0.4 weight=0.5 beat=0.7 gap=0.28 volume=-2 | felt | touches | Two bells that keep changing places with a lean on each half row
Widow at the window | Half muffled bells | method=Dodge row=3.6 ringers=6 tilt=-8 overlap=0.85 beat=0.1 release=6 cover=0.35 muffle=0.6 weight=0.2 gap=0.14 swing=0.2 volume=-4.5 | darkplate | tolling | Slow low pairs that swap for three seconds, wrapped for the next three
Rooks over the nave | Half muffled bells | method=Contrary series=Odd row=0.8 ringers=7 tilt=-7.5 overlap=0.7 release=2 bite=0.18 muffle=0.45 cover=0.55 weight=0.2 beat=2 swing=0.4 crossing=0.15 body=0.32 volume=-1 | patter | tolling | Scattered odd bells from both ends of a short row, clattering then muffled
Handbells in church hats | Half muffled bells | row=1.1 ringers=3 tilt=-5 overlap=0.5 release=1.8 bite=0.3 body=0.2 beat=0.1 weight=0.4 swing=0 place=0.3 volume=0 | bare | highbells | Three small round bells down the row, one round plain and one in gloves
Cot in the vestry | Half muffled bells | row=2.2 ringers=4 tilt=-9 overlap=0.7 release=3 body=0.1 beat=0.2 cover=0.5 bite=0.1 weight=0.5 gap=0.42 swing=0.2 volume=-6.5 | cassette | touches | Very round soft bells in a slow fall over a covering tone
Crystal in mourning | Half muffled bells | voice=Glass row=1.8 ringers=6 tilt=-8 overlap=0.6 release=3 attack=0.003 bite=0.5 weight=0.4 beat=0 swing=0.25 crossing=0.15 cover=0.39 volume=-2 | reveal | tolling | Struck glass in a falling roll, clear in one row and behind cloth in the next
Windscreen stars | Half muffled bells | voice=Glass series=Odd method=Hunt row=0.9 ringers=8 overlap=0.25 tilt=-8 attack=0.003 release=1.2 bite=0.39 beat=0.2 weight=0 swing=0 gap=0.15 cover=0.57 body=0.32 volume=1.5 | pebble | touches | Odd glass ticking evenly across the width, open rows and dull ones
Tall glasses wrapped | Half muffled bells | voice=Glass series=Fifths method=Contrary row=3 ringers=5 overlap=0.85 tilt=-6 attack=0.02 release=5 muffle=0.7 weight=-0.55 beat=1.6 swing=0.2 gap=0.05 volume=6 | drift | knell | Glass fifths in paper that cross slowly and leave a thin ring
Candle under a jar | Half muffled bells | voice=Glass series=Low method=Treble row=2 ringers=4 overlap=0.7 tilt=-7 cover=0.6 release=2 attack=0.005 beat=0.2 weight=0.3 swing=0.35 crossing=0.5 volume=-2 | linger | tolling | Soft glass led by its top, dulled every second row, on a plain low tone
Mountain pass at four | Half muffled bells | row=2.6 ringers=7 tilt=-6 overlap=0.8 release=6 bite=0.3 gap=0.4 weight=0.5 beat=0.8 swing=0.2 volume=0 | shore | tolling | A long falling peal, open and half muffled, the rows well apart
Bells across the polder | Half muffled bells | method=Hunt series=Fifths row=3.2 ringers=6 tilt=-5 overlap=0.85 release=7 beat=0.7 weight=0.1 swing=0 gap=0.15 crossing=0.6 volume=-4.5 | valley | knell | Wavering fifths in even order, every other row of them in leather
Neighbour's clock | Half muffled bells | row=0.7 ringers=5 tilt=-7 overlap=0.5 release=0.9 bite=0.6 gap=1 beat=0.3 weight=0.5 swing=0.3 volume=4 | nextdoor | tolling | A small quick peal and a rest as long, first bare and then in cloth
Last bus by the abbey | Half muffled bells | method=Treble row=1.5 ringers=6 tilt=-4 overlap=0.7 release=3.5 muffle=0.3 weight=0.4 bite=0.27 cover=0.15 beat=1 swing=0.35 gap=0.3 volume=-5 | pan | knell | A led peal with only a little leather on its back rows, loudest at its head
Village under the lake | Half muffled bells | method=Contrary series=Low row=2.4 ringers=5 tilt=-9 overlap=0.8 release=5 muffle=0.6 cover=0.3 beat=0.2 weight=-0.5 swing=0.2 gap=0.36 volume=-0.5 | sunken | threeabove | Low bells in two crossing lines, thick with leather
Choirboys in the tower | Half muffled bells | series=Chord_tones row=1.6 ringers=8 tilt=-4 overlap=0.7 release=3 crossing=0.6 bite=0.4 weight=0.4 beat=2 swing=0.2 gap=0.1 volume=-3.5 | silent | chorale | A falling roll of all the tones held, open and then in leather
Grandmother's bracelets | Half muffled bells | series=Chord_tones method=Hunt tower=Canon row=0.9 ringers=6 tilt=-3 overlap=0.5 release=1.4 place=1 beat=0.3 weight=0.3 swing=0.35 crossing=0.6 volume=-5 | little | openfour | Small bells trading the tones of the chord in canon, half of the rows wrapped
Seven villages | Half muffled bells | tower=In_turn row=1 ringers=7 tilt=-5 overlap=0.6 release=3 gap=0.1 place=0.9 weight=0.5 beat=1.4 swing=0.2 crossing=0.15 volume=6 | open | inner | One key peals and then the next, each first in the clear and then muffled
Answer from the convent | Half muffled bells | tower=Opposed row=1.4 ringers=6 tilt=-4 overlap=0.7 release=3 weight=0.4 place=1 beat=0.2 swing=0.3 gap=0.28 volume=0.5 | answered | suspend | Peals from two sides in alternation, bare and wrapped by turns
Baker's dozen rung | Half muffled bells | tower=Canon method=Contrary series=Fifths row=2 ringers=6 tilt=-5 overlap=0.75 release=4 bite=0.3 weight=-0.6 beat=0.8 swing=0.25 gap=0.2 volume=-4.5 | unfold | imitate | Crossing fifths in canon, every second row a soft shadow of the first
Peal for the snowplough | Half muffled bells | row=0.45 ringers=8 tilt=-5 overlap=0.7 release=1.4 bite=0.3 gap=0 cover=0.2 beat=0.1 weight=0.4 swing=0.3 volume=6 | firm | highbells | Eight bells tumbling twice a second, every other fall of them dull
Hour without wind | Half muffled bells | method=Long row=3 ringers=7 tilt=-3 overlap=0.85 release=9 bite=0.3 muffle=0.5 gap=0.15 series=Fifths beat=1 swing=0 volume=-2.5 | bowls | knell | A lone bell of the fifths and a lone muffled one, seconds apart, over many rows
Prayer wheel in rain | Half muffled bells | method=Hunt voice=Plucked row=1.4 ringers=6 tilt=-3 overlap=0.85 release=2 bite=0.6 muffle=0.5 weight=0.3 beat=2 swing=0 gap=0.2 volume=-5.5 | wood | touches | Strings rung like bells in even rows, plain and then stopped with cloth | plucked
Bellows and bronze | Half muffled bells | method=Rounds voice=Hum row=2.2 ringers=6 tilt=-4 overlap=0.8 release=4 attack=0.01 bite=0.5 muffle=0.45 weight=0.4 beat=0.3 swing=0.2 crossing=0.6 volume=-2.5 | choir | tolling | A peal that is hummed, falling open and then through closed lips | voice
`,
    },
    {
      id: 'slow-hums',
      name: 'Slow hum drones',
      category: 'drone',
      rows: `
Cows before milking | Slow hum | row=4 ringers=5 attack=0.3 tilt=-5 cover=0.5 release=4 beat=0.7 muffle=0 weight=0.2 gap=0.15 place=0.3 | bare | ground | A low hum in which one closed mouth after another leans forward
Nine miles of snow | Slow hum | row=12 ringers=8 attack=0.6 tilt=-2 body=0.8 cover=0.15 release=14 beat=1 muffle=0.05 weight=-0.2 swing=0 volume=-6.5 | nave | inner | An open hum whose eight voices come forward once in a great while
Engine room chapel | Slow hum | method=Hunt row=3 ringers=4 attack=0.12 tilt=-8 cover=0.75 body=0.3 release=2 beat=1.6 muffle=0.25 weight=0.3 gap=0.4 swing=0.3 place=0.2 | iron | pedal | A thick hum with four voices changing neighbours, slowly beating
Dog by the stove | Slow hum | method=Rounds row=2.4 gap=0.8 ringers=3 attack=0.15 tilt=-9 cover=0.4 release=1.5 beat=0.1 muffle=0.3 weight=0.5 swing=0.2 | blanket | ground | Three low hums that swell in, fall away and rest, like sleep
Pine wood after dark | Slow hum | method=Contrary series=Odd row=7 ringers=7 attack=0.4 tilt=-4 cover=0.3 body=0.6 release=8 place=1 beat=1.5 muffle=0.2 weight=-0.6 swing=0.2 crossing=0.15 volume=-6 | cellos | rising | Odd hums that bend through each other, wide and slow to arrive
Cattle grid at dusk | Slow hum | series=Fifths method=Hunt row=5 ringers=5 attack=0.25 tilt=-2 cover=0.4 release=5 crossing=0.9 beat=0.2 muffle=0 weight=0.1 gap=0.14 volume=-7 | water | inner | Hummed fifths handed from key to key in five second rows
Well of the house | Slow hum | series=Fifths method=Contrary row=9 ringers=8 attack=0.6 tilt=-3 cover=0 release=10 beat=0.8 muffle=0.2 weight=-0.5 swing=0 volume=-0.5 | lowcath | inner | Stacked fifths of closed mouths, rising as they sink, no ground under them
Borrowed note | Slow hum | series=Chord_tones method=Hunt row=2 ringers=8 attack=0.2 tilt=1 body=0.8 cover=0.1 release=4 place=1 beat=0.1 muffle=0 weight=0.3 gap=0.28 crossing=0.8 volume=-3.5 | hanging | inner | Each key hums the tones of the others and gives them back
Pews at night | Slow hum | series=Chord_tones method=Treble row=6 ringers=6 attack=0.3 tilt=-4 cover=0.55 release=6 weight=-0.5 beat=2.2 muffle=0.25 gap=0.2 swing=0.3 crossing=0.6 volume=-5.5 | sighs | inner | Chord tones hummed from a faint high lead down to a full low close
Silt in the bay | Slow hum | series=Chord_tones method=Dodge row=8 ringers=4 attack=0.6 tilt=-9 cover=0.7 release=9 muffle=0.4 beat=2 weight=0.3 swing=0.2 gap=0.1 place=0.3 volume=-19 | darkwater | inner | Two dark borrowed tones trembling for eight seconds over a heavy ground
Harmonium left running | Covered bass | row=6 ringers=6 cover=0.6 tilt=-6 release=3 overlap=0.95 place=0.6 attack=0.08 beat=1.4 muffle=0.2 weight=0.1 gap=0 swing=0 crossing=0.15 volume=-4.5 | table | ground | A steady reed ground with six blown overtones slowly changing guard
Wasps in the eaves | Covered bass | series=Odd method=Dodge row=4 ringers=5 cover=0.45 tilt=-4 beat=5 body=0.7 release=2 overlap=0.95 attack=0.05 muffle=0 weight=0.3 swing=0.3 gap=0 place=0.5 volume=-5 | box | ground | Odd reeds buzzing in pairs, beating fast against each other
Pipes two hills off | Covered bass | series=Fifths method=Contrary row=8 ringers=7 cover=0.7 tilt=-3 body=0.9 release=3 overlap=1 attack=0.1 beat=2.8 muffle=0.05 weight=-0.5 gap=0.2 swing=0 volume=-7.5 | outside | fifths | Distant reed fifths over a firm ground, crossing once in eight seconds
Weaver's lamp oil | Covered bass | series=Low method=Rounds row=3 gap=0.4 ringers=8 cover=0.35 tilt=-5 release=4 overlap=0.9 attack=0.06 beat=0.1 muffle=0.3 weight=0.5 swing=0.2 volume=-2.5 | phasing | pedal | Reeds that roll down over the held note and pause before the next fall
Cloister heating pipe | Covered bass | series=High method=Long row=5 ringers=6 cover=0.85 tilt=-4 release=3 overlap=1 attack=0.1 body=0.4 beat=3 muffle=0 weight=0.1 gap=0.06 swing=0 volume=-4.5 | tubed | ground | A reed ground with single thin overtones singing far above it
Wet rim at midnight | Melted row | voice=Glass row=6 ringers=6 attack=0.2 cover=0.3 tilt=-4 release=8 series=Fifths beat=1.4 muffle=0.2 weight=0.2 gap=0.14 crossing=0.15 volume=-6 | swirl | fifths | Rubbed glass in six fifths that exchange places and never stop
Planetarium ceiling | Melted row | voice=Glass series=Odd method=Contrary row=12 ringers=8 attack=0.5 cover=0.45 tilt=-3.5 place=1 release=12 beat=0.1 muffle=0 weight=-0.5 swing=0.2 crossing=0.3 bite=0 body=0.22 volume=-5 | glasshalo | pedal | Bright odd glass moving in two lines over a twelve second row
Sink full of bowls | Melted row | voice=Glass series=Fifths method=Dodge row=3.5 ringers=4 attack=0.08 cover=0.6 tilt=-7 beat=0.1 release=5 muffle=0.25 weight=0.3 swing=0.5 crossing=0.15 volume=-6.5 | midpulse | ground | Two glass fifths that rub against each other over a plain low tone
Streetlamp hum in March | Melted row | voice=Glass series=High method=Hunt row=5 ringers=5 attack=0.2 cover=0.9 tilt=-5 beat=2.4 release=4 muffle=0 weight=0.1 gap=0.34 swing=0 crossing=0.3 volume=-7.5 | lights | ground | A strong low tone with thin far glass shivering above
Road across the ice | Melted row | voice=Glass method=Long row=9 ringers=7 attack=0.35 cover=0.5 tilt=-6 release=14 crossing=0.8 beat=0.9 muffle=0.2 weight=0.2 gap=0.2 swing=0 | frost | fifths | One glass and then another, nine seconds a row, on a round ground
Bells in the bedrock | Melted row | row=9 ringers=5 attack=0.9 cover=0.6 tilt=-8 body=0.2 release=10 beat=2 muffle=0.3 weight=0.4 gap=0.15 swing=0.2 | cave | pedal | Dark bells melted into a ground that turns over in nine seconds
Gong left swinging | Melted row | series=Odd method=Hunt row=4 ringers=8 attack=0.25 cover=0.3 tilt=-5 beat=1.8 body=0.6 release=8 bite=0.15 muffle=0 weight=0.2 swing=0 gap=0 crossing=0.1 volume=-5 | descent | ground | Odd metal that rings without end and beats twice a second
Bronze under sand | Melted row | series=Fifths method=Rounds row=6 ringers=6 attack=0.5 cover=0.45 tilt=-4 muffle=0.7 release=6 beat=0.1 weight=0.4 gap=0.2 swing=0.4 volume=-6.5 | afterimage | fifths | Muffled bronze fifths that fall slowly and start again
Coins in the altar | Melted row | series=High method=Dodge row=8 ringers=7 attack=0.6 cover=0.8 tilt=-2 beat=2.2 release=7 muffle=0.2 weight=0.3 swing=0.2 | cloud | pedal | Far bell overtones in trembling pairs above a firm low note
Halo of the gasworks | Melted row | method=Contrary row=14 ringers=8 attack=2.5 cover=0.2 tilt=-5 body=0.5 release=14 place=1 series=Odd beat=0.7 muffle=0 weight=-0.5 swing=0 volume=1 | undertow | fifths | Odd bells that take seconds to open, crossing once in a fourteen second row
Barn with one door open | Moving air | tower=Together series=Low method=Hunt row=5 ringers=6 cover=0.6 tilt=-6 attack=0.3 release=5 overlap=0.95 beat=0.1 muffle=0.25 weight=0.2 gap=0.4 swing=0 volume=-4 | room | ground | Soft low air moving through a note that stays
Desert road at night | Moving air | series=Fifths tower=Opposed row=9 ringers=7 cover=0.3 tilt=-5 attack=0.6 release=9 overlap=1 place=1 beat=1.8 muffle=0 weight=-0.5 gap=0.28 swing=0.2 volume=-1.5 | clouds | fifths | Air in fifths that crosses slowly from one side to the other
Lungs of the cave | Moving air | tower=Together series=Low method=Rounds row=4 gap=0.5 ringers=4 cover=0.5 tilt=-8 attack=0.25 release=3 body=0.6 beat=0.25 muffle=0.2 weight=0.4 swing=0.3 volume=-2 | lowtide | pedal | Breath that fills from the top down, empties, and waits half a row
Chimney in a gale | Moving air | tower=Together series=Odd method=Dodge row=6 ringers=5 cover=0.4 tilt=-2 attack=0.3 release=4 overlap=1 body=0.8 beat=3.5 muffle=0 weight=0.3 gap=0 swing=0.3 volume=-4 | sweep | ground | Odd bands of wind trading places, bright at their edges
Field behind the mast | Moving air | tower=Together series=High method=Contrary row=7 ringers=8 cover=0.92 tilt=-7.5 attack=0.5 release=6 overlap=1 beat=0.1 muffle=0.3 weight=-0.5 gap=0.2 swing=0 volume=-5.5 | shade | pedal | A strong covered tone with thin high air sliding over itself
Four strings all night | Plucked canon | tower=Together series=Low row=2.2 ringers=4 overlap=0.95 tilt=-4 cover=0.3 release=6 bite=0.3 method=Hunt beat=2 muffle=0 weight=0.1 gap=0 swing=0 volume=-6 | bridge | ground | Four plucked overtones going round and round over a low steady tone
Wheel on gravel | Plucked canon | tower=Together series=Fifths method=Dodge row=1.4 ringers=5 overlap=1 tilt=-6 cover=0.5 release=3 bite=0.1 beat=2 muffle=0.3 weight=0.3 gap=0 swing=0 volume=-15.5 | wood | fifths | Strings plucked so fast in pairs that they roll like a wheel
Hammock in the heat | Plucked canon | series=Low method=Contrary row=5 ringers=7 overlap=1 tilt=-5 cover=0.25 release=8 attack=1 bite=0.02 beat=0.9 muffle=0.2 weight=-0.5 gap=0.06 swing=0.25 volume=1.5 | deepsea | pedal | Plucked lines with their edges gone, rising and falling in canon
Cricket wires | Plucked canon | tower=Together series=Odd method=Rounds row=0.9 ringers=8 overlap=0.9 tilt=-2 cover=0.55 release=2 bite=0.5 gap=0.3 beat=2.6 muffle=0 weight=0.4 swing=0.3 crossing=0.4 volume=0 | reel | ground | Odd strings flicked down again and again over a covered low note
Temple steps in rain | Plucked canon | tower=Together series=Chord_tones method=Hunt row=3 ringers=8 overlap=0.95 tilt=-3 cover=0.2 release=5 beat=1.2 muffle=0.2 weight=0.2 gap=0.34 swing=0 crossing=0.7 | strings | fifths | A slow walk through plucked tones of the drone's own chord
Lone plane over fields | High treble | voice=Hum method=Long row=4 ringers=6 cover=0.85 tilt=-2 overlap=1 attack=0.1 release=5 beat=0.1 muffle=0 weight=0.1 gap=0.3 swing=0 | bare | ground | A plain low tone with lone far hums passing over it
Northern window | High treble | method=Hunt row=7 ringers=8 cover=0.82 tilt=-3 overlap=1 attack=0.3 release=8 place=1 beat=0.2 muffle=0.25 weight=0.2 gap=0.15 swing=0.3 crossing=0.15 | thinhalo | fifths | Eight distant glass overtones drift across a round drone
Kettle in another room | High treble | voice=Reed method=Dodge row=5 ringers=5 cover=0.75 tilt=-5 overlap=1 attack=0.1 release=3 beat=3 muffle=0 weight=0.3 gap=0.4 swing=0.4 | nextdoor | pedal | Thin reeds far above the key, shaking in pairs over a firm ground
Dust in the projector | High treble | voice=Breath method=Contrary row=3 ringers=6 cover=0.92 tilt=-8.5 overlap=0.95 attack=0.08 release=3 body=0.3 beat=1.6 muffle=0.2 weight=-0.5 gap=0.28 swing=0 | disc | ground | High breath crossing and crossing above a steady covered note
Power line in frost | High treble | voice=Bell method=Rounds row=6 ringers=7 cover=0.65 tilt=0 overlap=0.95 attack=0.2 release=6 body=0.1 beat=2 muffle=0 weight=0.5 gap=0.2 crossing=0.15 | rotor | fifths | Far bell overtones that slide down in slow falls above the drone
Two pumps out of step | Slow hum | tower=Opposed method=Hunt row=0.9 ringers=4 attack=0.05 tilt=-4 cover=0.45 overlap=0.9 place=1 release=1 series=Fifths body=0.75 beat=0.4 muffle=0.3 weight=0.3 gap=0.12 swing=0.3 | narrow | inner | Low hummed fifths that lean left and right by turns, about once a second
Oars at low water | Slow hum | tower=Opposed method=Rounds row=2.6 ringers=6 attack=0.12 tilt=-5 cover=0.3 overlap=0.95 place=1 release=3 weight=0.6 beat=1.2 muffle=0.2 gap=0.06 swing=0.3 volume=-3 | shore | rising | Hums pulled first on one side and then on the other, heavy at the stroke
Ventilator in the museum | Moving air | tower=Opposed series=Low method=Hunt row=0.8 ringers=5 cover=0.55 tilt=-7 attack=0.03 release=1 overlap=0.9 place=0.8 beat=0.1 muffle=0.3 weight=0.3 gap=0.34 swing=0.2 volume=-2.5 | losing | ground | Low air that beats softly from side to side over a covered tone
Wheelhouse in a swell | Covered bass | tower=Opposed method=Contrary row=3.4 ringers=6 cover=0.4 tilt=-4 overlap=0.95 attack=0.06 release=2 place=1 series=Odd beat=2.6 muffle=0 weight=-0.5 gap=0.12 swing=0.2 volume=4.5 | sway | fifths | Odd reed lines that rock across the width as the sides change
Turbine hall at dawn | Melted row | voice=Hum tower=In_turn series=Odd method=Contrary row=2 ringers=7 cover=0.4 tilt=-4 attack=0.1 release=3 body=0.7 beat=0.8 muffle=0 weight=0.2 gap=0.4 swing=0.2 crossing=0.15 volume=-3 | stack | rising | Keys that hum in turn, odd lines crossing inside each of them
Glacier with no name | Melted row | voice=Hum method=Hunt series=Odd row=14 ringers=8 attack=0.6 cover=0.3 tilt=-5 release=14 muffle=0.2 beat=0.7 weight=0.2 swing=0 crossing=0.3 volume=-10.5 | mist | ground | Odd hums that take minutes to change all their places
Peat over bronze | Melted row | method=Dodge row=10 ringers=3 attack=0.7 cover=0.85 tilt=-10 muffle=0.9 body=0.1 release=5 beat=0 weight=0.4 gap=0.28 swing=0.4 place=0.1 volume=-17.5 | muffled | ground | Almost nothing but a ground, with three wrapped bells turning under it
Oldest tree | Melted row | voice=Reed method=Long row=11 ringers=5 attack=0.3 cover=0.7 tilt=-8 release=6 body=0.2 bite=0.2 beat=1.1 muffle=0.3 weight=0.1 gap=0.12 swing=0 place=0.3 | evening | pedal | Low reeds that take turns by the half minute over a deep firm note
Long shift at the mill | Melted row | voice=Plucked method=Hunt row=2 ringers=8 attack=2 cover=0.5 tilt=-3 release=7 bite=0 swing=0.5 series=Odd beat=2 muffle=0 weight=-0.5 gap=0.06 crossing=0.15 volume=-2 | haze | ground | Odd strings with no edge, eight of them swelling one after another
Stillness in the silo | Melted row | voice=Breath series=Fifths method=Long row=8 ringers=4 attack=0.6 cover=0.65 tilt=-8 release=7 body=0.2 beat=0.05 muffle=0.2 weight=0.2 gap=0.3 swing=0 | cistern | fifths | Two bands of breath a row over a covered tone, with long bare gaps
`,
    },
    {
      id: 'breath-textures',
      name: 'Breath textures',
      category: 'texture',
      rows: `
Sheets on the line | Moving air | tower=Together series=Low row=3 ringers=6 overlap=0.8 tilt=-4 body=0.4 release=2.5 beat=0.05 muffle=0.2 weight=0.1 gap=0.15 swing=0 place=0.5 volume=-5 | bare | single | Soft bands of breath that change neighbours in three second rows, plainly told
Reeds at the pond edge | Moving air | tower=Together series=Low method=Contrary row=5 ringers=8 tilt=-6 attack=0.4 cover=0.3 release=5 beat=1.4 muffle=0 weight=-0.5 gap=0.34 swing=0.2 crossing=0.35 volume=-2.5 | shallows | openfour | Low breath in two lines that pass through each other, slow to rise
Sail going slack | Moving air | tower=Together series=Low method=Rounds row=2.2 gap=0.7 ringers=5 tilt=-5 attack=0.15 bite=0.4 release=1.5 beat=0.1 muffle=0.3 weight=0.5 swing=0.3 volume=1 | table | overdrone | Breath that falls through five bands, goes slack and fills again
Fur coat in the hall | Moving air | tower=Together series=Low method=Dodge row=4 ringers=4 tilt=-10 attack=0.2 cover=0.6 body=0.15 release=3 beat=2 muffle=0.25 weight=0.3 gap=0 swing=0.3 place=0.1 | muffled | wide | Dark close air trembling between two low places over a warm tone
Open page | Moving air | tower=Together series=Low method=Treble row=1.8 ringers=8 tilt=-3 bite=0.39 body=0.57 cover=0.27 release=1.2 beat=0.25 muffle=0 weight=0.3 gap=0.2 swing=0.3 volume=-2.5 | lit | imitate | A bright breath on top leads every row and the low ones turn the page
Small engine of feathers | Moving air | tower=Together series=Low row=0.5 ringers=5 overlap=0.6 tilt=-3 attack=0.005 bite=0.36 release=0.7 cover=0.19 beat=4.4 muffle=0.2 weight=0.2 gap=0.2 swing=0 volume=-0.5 | glaze | touches | Quick puffs, five to half a second, that fade soon after the key
Someone blowing on soup | Moving air | tower=Together series=Low method=Rounds row=1.2 gap=0.8 overlap=0.7 ringers=3 tilt=-7 attack=0.03 cover=0.4 release=0.56 bite=0.12 beat=0 muffle=0.35 weight=0.4 swing=0.2 place=0.15 volume=6 | booth | touches | Three low puffs close up, a pause, and three again
Valves letting off steam | Moving air | tower=Together series=Fifths method=Contrary row=0.7 overlap=0.3 ringers=7 tilt=-7 attack=0.004 bite=0.3 body=0.7 release=0.6 beat=3 muffle=0 weight=-0.5 gap=0.3 swing=0.4 cover=0.6 volume=1.5 | gated | imitate | Short fifths of breath that puff from both edges and shut off
Moths in the lampshade | Moving air | tower=Together series=Low method=Dodge row=0.9 overlap=0.6 ringers=6 tilt=-2.5 attack=0.01 cover=0.24 beat=4 release=0.8 muffle=0.2 weight=0.1 gap=0.4 swing=0.2 volume=-7.5 | paper | single | Fluttering breath, neighbour against neighbour, dry and light
Typing with gloves on | Moving air | tower=Together series=Fifths method=Long row=0.6 overlap=0.62 ringers=8 tilt=-5 attack=0.003 bite=0.54 cover=0.5 release=0.8 beat=0.1 muffle=0.3 weight=0 gap=0 swing=0.3 crossing=0.4 volume=6 | stub | touches | Single soft puffs at irregular heights, about three in a second
Ridge at first light | Moving air | tower=Together row=4 ringers=5 overlap=0.95 tilt=-4 attack=0.3 cover=0.05 release=6 place=1 beat=3.4 muffle=0 weight=0.2 gap=0.28 swing=0 crossing=0.3 volume=-2.5 | valley | rising | Wind in stacked fifths, nothing under it, moving from edge to edge
Telegraph poles inland | Moving air | tower=Together method=Rounds row=6 ringers=8 overlap=0.9 tilt=-3 attack=0.5 body=0.74 cover=0.26 release=5 beat=0.1 muffle=0.05 weight=0.4 gap=0.3 swing=0 bite=0.15 volume=1.5 | longspring | single | High and low fifths of air that slide down once in six seconds
Cornfield from above | Moving air | tower=Together method=Contrary row=2.5 ringers=7 overlap=0.85 tilt=-7 attack=0.1 cover=0.2 muffle=0.6 release=3 beat=2 weight=-0.5 gap=0.2 swing=0.2 volume=-1.5 | darkhall | wide | Dark fifths of breath, every second crossing under a cloth
Gulls against wind | Moving air | tower=Together method=Treble row=1.4 ringers=6 overlap=0.8 tilt=-5.5 attack=0.04 body=0.5 cover=0.78 release=2.1 bite=0.12 beat=4 muffle=0 weight=0.4 gap=0.25 swing=0.4 volume=0.5 | highpass | imitate | A thin high fifth of air cries first, the low ones follow in the half row
Gravel drive at night | Moving air | tower=Together method=Dodge row=1 ringers=4 overlap=0.8 tilt=-6.5 attack=0.01 bite=0.8 cover=0.48 swing=0.8 release=0.9 beat=0.1 muffle=0.2 weight=0.3 gap=0 | grit | single | Breathy fifths that crunch to and fro with a lean on every half row
Keyhole in October | Moving air | tower=Together series=Odd row=3 ringers=5 overlap=0.85 tilt=-2 attack=0.15 cover=0.1 body=0.3 release=2 beat=4.4 muffle=0 weight=0.2 gap=0.2 swing=0 crossing=0.3 volume=-1 | notch | overdrone | Odd narrow bands of wind, hollow as a tube, trading one by one
Whistle in the fence | Moving air | tower=Together series=Odd method=Treble row=4 ringers=8 overlap=0.97 tilt=-3.5 attack=0.1 cover=0.76 beat=2 release=4.2 bite=0.12 muffle=0.25 weight=0.3 gap=0 swing=0.2 volume=-3 | pan | single | The top of an odd series whistles first and the low ones answer, wavering
Stalks under ice | Moving air | tower=Together series=Odd method=Rounds row=1.5 ringers=6 overlap=0.7 tilt=-5 attack=0.02 bite=0.38 gap=0.4 release=1.2 beat=0.1 muffle=0.3 weight=0.4 swing=0.25 cover=0.46 body=0.44 volume=6 | frost | touches | Odd breath that drops in a quick roll and then holds still
Bottles on the parapet | Moving air | tower=Together series=Odd method=Contrary row=2 ringers=4 overlap=0.8 tilt=-7.5 attack=0.04 cover=0.6 release=1 beat=1.8 muffle=0 weight=-0.5 gap=0.15 swing=0.3 place=0.4 volume=-3.5 | cistern | chorale | Four hollow blown tones over a round one, crossing every two seconds | wind
Draught through a piano | Moving air | tower=Together series=Odd method=Dodge row=5 ringers=7 overlap=0.95 tilt=-5 attack=0.3 cover=0.05 release=6 crossing=0.9 beat=2.4 muffle=0.2 weight=0.2 gap=0.06 swing=0.4 volume=1.5 | strings | threeabove | Odd air trembling in pairs, each key making way for the last
Upper sky | Moving air | tower=Together series=High row=5 ringers=8 overlap=0.95 tilt=-8 attack=0.5 cover=0.89 release=6 place=1 beat=0.1 muffle=0 weight=0.2 gap=0 swing=0.2 crossing=0.35 volume=-0.5 | sinehalo | wide | Only distant air above a plain soft tone, spread as wide as it goes
Spray over the mole | Moving air | tower=Together series=High method=Rounds row=2 gap=0.5 ringers=6 overlap=0.7 tilt=-6 attack=0.05 bite=0.33 cover=0.54 release=2 beat=3.4 muffle=0.2 weight=0.5 swing=0.2 body=0.37 volume=6 | surf | openfour | High breath that bursts at the head of each row and falls
Silk being cut | Moving air | tower=Together series=High method=Contrary row=0.8 ringers=5 overlap=0.5 tilt=-7.5 attack=0.005 bite=0.7 cover=0.78 release=0.6 beat=0.05 muffle=0 weight=-0.5 gap=0.34 swing=0.3 volume=1.5 | shade | imitate | Short high hisses from both sides over a firm quiet tone
Radio before the news | Moving air | tower=Together series=High method=Long row=3 ringers=7 overlap=0.9 tilt=-10 attack=0.1 cover=0.92 beat=5 release=2 muffle=0.22 weight=0.1 gap=0.3 swing=0 volume=2 | transistor | single | Lone bands of far air with a fast shiver over a held note
Sand against the door | Moving air | tower=Together series=High method=Dodge row=1.6 ringers=4 overlap=0.85 tilt=-7.5 attack=0.02 cover=0.39 weight=-0.8 release=1.8 beat=2.4 muffle=0.25 gap=0 swing=0.2 place=0.5 | box | wide | High air rubbing back and forth, growing to the end of each row
Secrets down the pew | Moving air | tower=In_turn series=Low method=Treble row=1.2 overlap=0.7 ringers=6 tilt=-2 attack=0.02 bite=0.6 release=1.5 beat=0.7 muffle=0 weight=0.3 gap=0.12 swing=0.3 volume=-6 | chapel | openfour | Whispers handed from key to key, each one led from above
Dormitory past ten | Moving air | tower=In_turn series=Low method=Rounds row=2 overlap=0.9 ringers=5 tilt=-7 attack=0.12 cover=0.3 release=3 beat=0.1 muffle=0.3 weight=0.4 gap=0.4 swing=0.2 | darkwater | wide | Sleeping breath, one key and then the next, low and soft
Relay of lamplighters | Moving air | tower=In_turn method=Contrary row=0.8 overlap=0.7 ringers=7 tilt=-6 attack=0.02 cover=0.27 release=2 place=1 beat=4.4 muffle=0.2 weight=-0.5 gap=0 swing=0.3 crossing=0.4 volume=0 | rings | suspend | Fifths of air that pass round the keys eight tenths of a second apart
Pass the parcel | Moving air | tower=In_turn series=Chord_tones method=Hunt row=1.5 overlap=0.8 ringers=8 tilt=-3 attack=0.04 cover=0.2 release=1.8 beat=0.25 muffle=0.05 weight=0.2 gap=0.28 swing=0 crossing=0.7 volume=-5 | pair | chorale | Each key in turn breathes out the tones of the rest
Vestibule gossip | Moving air | tower=In_turn series=Odd method=Dodge row=0.6 overlap=0.5 ringers=4 tilt=-10 attack=0.005 bite=0.24 cover=0.72 release=0.6 beat=2 muffle=0 weight=0.3 gap=0.15 swing=0.4 body=0.24 volume=-0.5 | patter | inner | Quick hollow chatter that goes from key to key in odd breaths
Starlings over the pier | Moving air | series=Low row=2 ringers=8 overlap=0.8 tilt=-3 attack=0.06 release=3 cover=0.1 crossing=0.3 beat=3.4 muffle=0.2 weight=0.2 gap=0.06 swing=0.2 volume=-2.5 | flock | rising | Breath in canon, every key on a path of its own behind the last
Geese changing lead | Moving air | series=Fifths method=Treble row=3 ringers=6 overlap=0.9 tilt=-4 attack=0.1 release=4 weight=0.4 beat=0.1 muffle=0.3 gap=0.34 swing=0.3 crossing=0.3 volume=-4.5 | procession | imitate | Canon of fifths in air, the leader loud and the rest falling away
Rings of pipe smoke | Moving air | series=Low method=Contrary row=1.3 ringers=5 overlap=0.75 tilt=-6 attack=0.03 release=1.5 cover=0.35 beat=1.5 muffle=0 weight=-0.5 gap=0.2 swing=0.2 volume=-1.5 | circle | openfour | Round breaths in canon that close from both ends, some keys twice as slow
Blind alley breeze | Moving air | series=Odd method=Rounds row=4.5 ringers=7 overlap=0.95 tilt=-5 attack=0.4 release=6 beat=2.8 muffle=0.25 weight=0.3 gap=0.4 swing=0 crossing=0.35 volume=0 | late | threeabove | Odd bands that slide down in every key at a pace of its own
Snow off the branches | Moving air | series=High method=Hunt row=1.6 ringers=6 overlap=0.7 tilt=-8.5 attack=0.02 release=2 cover=0.8 bite=0.22 beat=0.1 muffle=0 weight=0.1 gap=0.28 swing=0.3 body=0.44 volume=1.5 | leaves | suspend | Light high breath in canon over soft low tones
Room full of sleepers | Moving air | tower=Together series=Chord_tones row=4 ringers=8 overlap=0.95 tilt=-4 attack=0.3 release=5 cover=0.1 beat=1.8 muffle=0.2 weight=0.2 gap=0 swing=0 crossing=0.6 volume=-4 | calm | suspend | Air tuned to every key held, exchanged without a seam
Curtains at vespers | Moving air | tower=Together series=Chord_tones method=Contrary row=7 ringers=6 overlap=1 tilt=-6 attack=0.5 release=7 body=0.8 beat=0.4 muffle=0.05 weight=-0.5 gap=0.12 swing=0.2 crossing=0.3 volume=-3 | wall | wide | Full breath on the chord's own tones, crossing in seven second rows
Rumour of an orchestra | Moving air | tower=Together series=Chord_tones method=Rounds row=2.5 ringers=7 overlap=0.85 tilt=-1 attack=0.08 bite=0.5 release=2.5 beat=2 muffle=0.3 weight=0.4 gap=0.2 swing=0.3 volume=0.5 | padfollow | chorale | Chord tones of air that roll down from the brightest, again and again
Flute made of fog | Moving air | series=Chord_tones method=Treble row=2 ringers=5 overlap=0.85 tilt=-3 attack=0.04 cover=0.4 release=2 tower=Together beat=5 muffle=0 weight=0.3 gap=0.06 swing=0.4 place=0.3 volume=-2 | cloud | overdrone | A breathy lead over a clear soft tone, its notes lent by the other keys | wind
Pan pipes in a drawer | Moving air | tower=Together series=Chord_tones method=Dodge row=1.2 ringers=4 overlap=0.6 tilt=-5 attack=0.005 bite=0.9 cover=0.3 release=0.5 beat=0.1 muffle=0.2 weight=0.2 gap=0.34 swing=0.3 place=0.4 volume=-17 | wood | chorale | Puffed chord tones that flicker between two neighbours, close and woody | wind
Wind through a comb | Moving air | voice=Reed tower=Together series=Odd method=Hunt row=0.9 ringers=8 overlap=0.3 tilt=-4 attack=0.004 bite=0.8 body=0.8 release=0.6 cover=0.1 beat=2 muffle=0 weight=0.2 gap=0.15 swing=0.2 volume=-1 | partials | single | Odd reeds full of air that chatter through eight places in a second
Bees in the wall | Moving air | voice=Hum tower=Canon series=Odd method=Dodge row=1.6 ringers=6 overlap=0.9 tilt=-3 beat=6 attack=0.02 release=2 cover=0.1 muffle=0.2 weight=0.2 gap=0 swing=0.2 volume=-3 | box | inner | Hummed odd tones with a fast shiver, each key trembling in its own time
Pollen in a sunbeam | Dodging lights | series=High row=0.5 ringers=8 overlap=0.4 cover=0.6 tilt=-5.5 bite=0.2 body=0.15 release=2 tower=Canon beat=0.7 muffle=0 gap=0.15 weight=0.2 swing=0.4 volume=-5.5 | lights | openfour | Tiny distant bells, hardly struck, that never fall together
Sleet on a skylight | Hollow loom | series=Fifths method=Dodge swing=0 row=0.6 overlap=0.8 ringers=8 tilt=-2 bite=0.13 release=1.4 cover=0.3 tower=Canon beat=2.6 muffle=0.2 weight=0.2 gap=0 body=0.51 volume=-6 | rain | wide | Plucked fifths in a constant dry patter, every key in another time
Glasshouse in hail | Plain glass keys | series=High tower=Canon method=Contrary row=0.45 ringers=8 overlap=0.1 tilt=-7 cover=0.58 bite=0.24 release=1.5 place=1 beat=0.1 muffle=0 weight=-0.5 swing=0.3 body=0.19 volume=1 | glintecho | openfour | Far glass struck short and fast from both sides, over a soft ground
Sardines turning | Melted row | voice=Glass beat=6 series=Odd method=Hunt row=2 ringers=8 attack=0.03 tilt=-3.5 place=1 cover=0.18 release=4 muffle=0.2 weight=0.2 swing=0 crossing=0.15 volume=-4 | ripple | wide | Odd glass with a quick shiver in it that turns all at once
Rust in the gutters | Half muffled bells | series=Odd method=Dodge row=0.5 ringers=5 overlap=0.2 gap=0.3 muffle=0.9 bite=1 tilt=-3 release=0.6 beat=0.2 weight=0.4 swing=0.5 crossing=0.15 | fuzz | single | Scraped little blows, all leather and clapper, two places at a time
Leaf mould | Leather and stone | voice=Breath series=Fifths method=Rounds row=3 ringers=6 muffle=1 bite=0.5 tilt=-7 attack=0.1 cover=0.35 overlap=0.9 release=3 beat=0.1 gap=0.2 swing=0.2 crossing=0.6 volume=0.5 | darkbank | rising | Breath under leather, dark fifths that roll over and lie still
Hands in dry rice | Leather and stone | voice=Plucked series=Odd method=Hunt row=0.35 ringers=8 muffle=1 bite=0.3 tilt=0 cover=0.4 overlap=0.92 release=0.8 beat=3.2 gap=0 weight=0.2 swing=0.05 volume=-2 | bare | single | Damped plucks by the dozen each second, more patter than pitch
Northern lights on tin | Melted row | voice=Reed series=High method=Contrary beat=3.5 row=3 ringers=8 attack=0.06 tilt=-10 place=1 cover=0.7 release=4 muffle=0 gap=0.4 weight=-0.5 swing=0.2 crossing=0.15 volume=-3.5 | upglow | wide | Thin far reeds that shiver and cross over a steady tone
`,
    },
    {
      id: 'reed-voices',
      name: 'Reed voices',
      category: 'voice',
      rows: `
Four men in a doorway | Reeds round a chord | ringers=4 row=3 tilt=-6 body=0.45 attack=0.05 cover=0.2 release=1.5 beat=0.1 muffle=0.2 weight=0.1 gap=0 swing=0 place=0.5 | table | chorale | Four reeds to a key that sing the chord's own tones and swap neighbours
Wedding band at rest | Reeds round a chord | method=Contrary row=2.2 tilt=-2 body=0.8 attack=0.02 bite=0.4 release=0.9 place=1 beat=1.4 muffle=0 weight=-0.5 gap=0.28 swing=0.3 crossing=0.5 | doubled | wedge | Bright reeds crossing through the tones of the chord, close and bold
Sheep fold litany | Reeds round a chord | method=Rounds row=5 gap=0.3 tilt=-5 attack=0.2 cover=0.3 release=4 weight=0.5 beat=0.1 muffle=0.3 swing=0.2 volume=-3 | hall | suspend | Reeds that fall through the whole chord, wait, and fall through it again
Salt handed round | Reeds round a chord | method=Dodge row=3.5 ringers=6 tilt=-4 beat=2 attack=0.04 crossing=0.9 release=2 muffle=0.05 weight=0.2 gap=0.15 swing=0.2 | chamber | chorale | Two borrowed tones always trading in each key, wavering as they cross
Old vows | Reeds round a chord | method=Treble row=4 ringers=7 tilt=-8 cover=0.4 attack=0.1 release=3 body=0.3 beat=3.4 muffle=0.3 weight=0.4 gap=0.06 swing=0.3 | chapel | chorale | A chord tone sung from the top of each row and answered low, dark reeds
Boys on the gallery | One after another | tower=Together series=Chord_tones method=Hunt row=2.4 ringers=8 tilt=-1 overlap=0.9 attack=0.05 body=0.9 release=1.8 beat=0.1 muffle=0 weight=0.2 gap=0 swing=0 crossing=0.6 volume=-8 | bloom | overdrone | Open bright hums that hand the notes of the chord along
Barbers on a Sunday | One after another | tower=Together series=Chord_tones method=Contrary row=1.5 ringers=4 tilt=-5 overlap=0.75 attack=0.03 body=0.6 release=0.6 bite=0.3 beat=1 muffle=0.2 weight=-0.5 gap=0.34 swing=0.2 place=0.3 | booth | chorale | Four hummed parts that cross each other in close quarters, quick to stop
Psalm from the ferry | One after another | tower=Together series=Fifths method=Treble row=4 ringers=6 tilt=-3 overlap=0.95 attack=0.12 body=0.7 release=4 cover=0.2 beat=0.4 muffle=0.22 weight=0.3 gap=0.15 swing=0.3 volume=-9 | stillroom | inner | Hummed fifths led from above, the deep ones closing every row
Lullaby in the kitchen | One after another | tower=Together series=Low method=Dodge row=3 ringers=3 tilt=-9 overlap=0.9 attack=0.08 body=0.2 cover=0.5 release=1.5 beat=0.8 muffle=0.25 weight=0.3 gap=0.4 swing=0.4 place=0 volume=-7 | pillow | wedge | A small round hum rocking between two notes, half asleep
Jugs at the village pump | One after another | tower=Canon series=Chord_tones method=Hunt row=2 ringers=6 tilt=-4 overlap=0.8 attack=0.04 body=0.7 release=2 place=1 beat=0.2 muffle=0 weight=0.2 gap=0.28 swing=0.2 crossing=0.15 volume=-7 | patter | imitate | Hums in canon, each key singing the others' notes a row behind
Boat horn far in | Covered bass | series=Fifths ringers=5 row=2.4 cover=0.4 tilt=-3 attack=0.08 overlap=0.85 release=1.2 body=0.5 method=Long beat=3.4 muffle=0.2 weight=0.1 gap=0.15 swing=0 volume=-3.5 | steps | single | A lone soft reed whose fifths lean forward one by one | wind
Pastor's oboe | Covered bass | series=Odd method=Treble ringers=6 row=3 cover=0.3 tilt=-2 attack=0.03 overlap=0.85 release=0.6 body=0.8 beat=0.2 muffle=0 weight=0.3 gap=0.06 swing=0.3 crossing=0.1 place=0.15 volume=0.5 | latesway | overdrone | A nasal odd reed with its highest voice leading every row | wind
Duduk by the fire | Covered bass | series=Low method=Rounds ringers=4 row=2.6 cover=0.6 tilt=-8 attack=0.06 overlap=0.9 release=1.5 bite=0.5 beat=1.1 muffle=0.25 weight=0.4 gap=0.34 swing=0.2 volume=-5 | haze | overdrone | A warm breathy reed on a firm tone, its overtones falling softly each row | wind
Kazoo at the parade | Covered bass | series=Odd method=Dodge ringers=5 row=0.8 cover=0.49 tilt=-2 attack=0.004 overlap=0.7 release=0.25 body=0.87 bite=0.33 beat=3 muffle=0 weight=0.3 gap=0.2 swing=0.5 place=0.05 volume=-1.5 | paper | imitate | Buzzing odd reeds that flap between neighbours, dry and cheeky | wind
Shawm on a roof | Covered bass | series=Fifths method=Contrary ringers=6 row=1.8 cover=0.5 tilt=1.5 attack=0.01 overlap=0.8 release=0.5 body=0.9 beat=2.8 muffle=0 weight=-0.4 gap=0.4 swing=0.2 volume=-2 | outside | overdrone | A strong reed over bright crossing fifths, meant to be heard streets off | wind
Auction in the barn | Reeds round a chord | series=Odd method=Hunt row=1.2 overlap=0.3 tilt=-4.5 attack=0.004 bite=0.52 release=0.5 cover=0.24 beat=0.1 muffle=0 weight=0.2 gap=0.28 swing=0.25 crossing=0.3 body=0.54 volume=0 | midpulse | wedge | Chattering odd reeds that stop short and change places twice a breath
Crows reading aloud | Reeds round a chord | series=Odd method=Rounds row=0.9 gap=0.5 overlap=0.6 tilt=-4 attack=0.003 weight=0.8 release=0.4 ringers=5 beat=1.8 muffle=0.05 swing=0.3 crossing=0.2 volume=5 | slap | imitate | Odd reeds that caw down a short row all at once, and pause
Nuns on bicycles | Reeds round a chord | series=Fifths method=Contrary row=3.2 overlap=0.9 tilt=-4 attack=0.08 cover=0.35 release=2 beat=1.5 muffle=0.2 weight=-0.5 gap=0.15 swing=0.2 volume=1.5 | quickrotor | threeabove | Reed fifths that glide through each other, spun by a fast rotor
Throat of the valley | Reeds round a chord | series=Odd method=Long row=2 overlap=0.95 tilt=-3.5 attack=0.06 cover=0.6 release=1.5 body=0.74 ringers=8 beat=0.1 muffle=0 weight=0.1 gap=0.1 swing=0 crossing=0.15 bite=0.19 volume=-1 | vowel | single | Single odd overtones sung out of a steady reed, two to a row
Gossips at the pump | Reeds round a chord | series=Low tower=In_turn method=Dodge row=0.9 overlap=0.8 tilt=-4 attack=0.01 release=0.9 bite=0.4 ringers=5 beat=3.4 muffle=0.2 weight=0.3 gap=0.06 swing=0.4 | stub | chorale | Reeds that speak one after another, each in two quick neighbouring notes
Vowels in plaster | Slow hum | series=Low method=Hunt row=2 ringers=6 attack=0.04 overlap=0.85 tilt=-3 body=0.9 cover=0.3 release=1 beat=0.1 muffle=0 weight=0.2 gap=0.34 swing=0 crossing=0.15 volume=-7.5 | vowel | chorale | Open hums that shift their overtones like a mouth half opening
Stairs below the choir | Slow hum | series=Chord_tones method=Rounds row=3 ringers=7 attack=0.06 overlap=0.9 tilt=-4 body=0.6 cover=0.15 release=2 beat=1 muffle=0.2 weight=0.4 gap=0.14 swing=0.2 volume=0 | choir 1.mix=0.4 | inner | Hummed chord tones that descend once every row
Bass row of a choir | Slow hum | series=Low method=Contrary row=4 ringers=5 attack=0.1 overlap=0.95 tilt=-8 body=0.4 cover=0.6 release=1.6 beat=0.1 muffle=0.2 weight=-0.5 gap=0.4 swing=0.2 place=0.3 volume=-6 | pedal | lowpair | Low closed mouths, one part rising as another sinks
Hush before amen | Slow hum | series=Chord_tones method=Dodge row=5 ringers=8 attack=0.3 tilt=-6 body=0.25 cover=0.2 release=6 crossing=1 beat=0.8 muffle=0.3 weight=0.2 gap=0.28 swing=0.3 volume=-1.5 | ooh | inner | Quiet hummed tones swapping in pairs, each giving way to the last one rung
Mothers calling home | Slow hum | series=Low method=Treble row=1.6 ringers=6 attack=0.03 overlap=0.8 tilt=2.5 body=0.8 cover=0.2 release=1.2 bite=0.4 beat=0.2 muffle=0 weight=0.3 gap=0.3 swing=0.4 volume=-2.5 | answered | imitate | A high hummed call and its low reply inside every note
Village organ at noon | Reeds round a chord | series=Low method=Hunt row=2.4 ringers=8 overlap=0.95 tilt=-4 attack=0.006 cover=0.55 release=0.4 bite=0.2 beat=3.4 muffle=0 weight=0 gap=0 swing=0 crossing=0.2 | chapel | chorale | Reed ranks that swap under the hand, speaking at once and stopping clean | organ
Regal in a cupboard | Reeds round a chord | series=Odd method=Rounds row=1 ringers=6 overlap=0.8 tilt=-1 attack=0.003 cover=0.3 release=0.2 body=1 beat=0.1 muffle=0 weight=0.2 gap=0.25 swing=0.3 crossing=0.15 place=0.3 volume=1 | booth | wedge | A snarling little organ of odd reeds, rolling down at every row | organ
Shutters in the loft | Reeds round a chord | series=Fifths method=Contrary row=5 ringers=7 overlap=1 tilt=-7 attack=0.12 cover=0.5 release=2 muffle=0.5 beat=2.8 weight=-0.5 gap=0.12 swing=0.2 | swellroom | suspend | Reed fifths behind closed shutters, one line up and one line down | organ
Carousel in fog | Reeds round a chord | series=Low method=Treble row=1.4 ringers=7 overlap=0.8 tilt=-2 attack=0.005 cover=0.4 release=0.5 swing=0.7 gap=0.2 beat=2.4 muffle=0.05 weight=0.4 crossing=0.15 volume=2.5 | fogbound | ostinato | Reeds in an uneven lilt, the piping top before the lower ones | organ
Positive with one stop | Reeds round a chord | series=Low method=Dodge row=2.8 ringers=3 overlap=0.95 tilt=-6 attack=0.008 cover=0.7 release=0.5 beat=1 muffle=0.2 weight=0.2 gap=0 swing=0 place=0.2 | flutes | chorale | A plain covered reed with two stops trading quietly under it | organ
Whispered kyrie | Moving air | tower=Together series=Chord_tones method=Contrary row=3 ringers=6 cover=0.35 tilt=-3 attack=0.06 body=0.5 release=2 beat=0.7 muffle=0.2 weight=-0.5 gap=0.06 swing=0 crossing=0.5 | monks | suspend | Half sung breath on the tones of the chord, parts crossing
Voice before waking | Moving air | tower=Together series=Low method=Rounds row=2.5 ringers=4 cover=0.6 tilt=-7 attack=0.08 body=0.3 release=1.6 beat=1.5 muffle=0.3 weight=0.4 gap=0.34 swing=0.2 place=0.4 volume=-4.5 | upglow | single | A soft tone with breath sinking through it, nearly a word
Crowd behind the wall | Moving air | tower=Canon series=Chord_tones method=Hunt row=1.4 ringers=8 cover=0.15 tilt=-4 attack=0.02 overlap=0.8 release=1.5 beat=0.1 muffle=0 weight=0.2 gap=0.1 swing=0.3 crossing=0.35 volume=-2 | nextdoor | inner | Airy voices in canon, each busy with the others' notes
Silver breath | Moving air | tower=Together series=Fifths method=Treble row=2 ringers=7 cover=0.92 tilt=-3.5 attack=0.03 body=0.4 overlap=0.85 release=1.2 beat=2 muffle=0 weight=0.3 gap=0.2 swing=0.3 volume=0.5 | plate | overdrone | A high edge of air leads a plain tone, fifths below it | wind
Hum in the snow tunnel | Moving air | voice=Hum tower=Opposed series=Low method=Hunt row=2 ringers=5 cover=0.3 tilt=-5 attack=0.05 overlap=0.9 release=2 body=0.5 beat=1.6 muffle=0.2 weight=0.2 gap=0.4 swing=0.2 crossing=0.35 | linger | inner | Voices that answer across a passage, half of the keys and then the rest
Motet for one hand | Reeds round a chord | tower=Canon method=Hunt row=2 ringers=6 tilt=-4 attack=0.02 overlap=0.85 release=1.2 place=1 beat=0.25 muffle=0 weight=0.2 gap=0 swing=0 crossing=0.35 volume=1.5 | longplate | imitate | Every key a part of its own in canon, sung on reeds with chord tones
Round for lamplighters | Slow hum | tower=Canon series=Chord_tones method=Rounds row=1.6 ringers=5 attack=0.03 overlap=0.8 tilt=-3 body=0.6 release=1.5 cover=0.1 beat=1 muffle=0.22 weight=0.5 gap=0.28 swing=0.3 volume=3 | late | imitate | A hummed round: each key comes in behind the last, some at half the pace
Vigil in shifts | Reeds round a chord | tower=In_turn method=Contrary row=2.5 ringers=7 tilt=-6 attack=0.08 overlap=0.95 release=3 cover=0.2 beat=2.4 muffle=0.05 weight=-0.5 gap=0.12 swing=0.2 volume=-12.5 | wall | threeabove | One key of reeds wakes as another sleeps, two lines crossing in each
Schoolyard echo | Slow hum | tower=In_turn series=Fifths method=Rounds row=0.8 ringers=5 attack=0.01 overlap=0.7 tilt=-2 body=0.9 release=0.8 bite=0.5 beat=0.9 muffle=0 weight=0.4 gap=0.06 swing=0.2 crossing=0.15 volume=-1 | tapewarm | inner | Short hummed falls in fifths that go from key to key
Choirs at odds | Reeds round a chord | tower=Opposed series=Low method=Treble row=1.8 ringers=6 tilt=-3 attack=0.02 overlap=0.85 release=1 weight=0.5 place=1 beat=3.4 muffle=0.2 gap=0.34 swing=0.4 crossing=0.3 volume=-12.5 | sides | openfour | Reeds in two camps that call from the top and reply from below by turns
Highest pane | High treble | voice=Hum series=Chord_tones method=Hunt row=3 ringers=8 cover=0.2 tilt=4 overlap=0.9 attack=0.06 release=2.5 beat=1.3 muffle=0 weight=0.2 gap=0 swing=0 | thinair | inner | Light hums, their upper ones brought forward, trading the chord
Kestrel over the school | High treble | voice=Hum series=High method=Treble row=2.4 ringers=5 cover=0.55 tilt=-2 overlap=0.9 attack=0.04 release=2 beat=3 muffle=0.2 weight=0.3 gap=0.2 swing=0.3 | glimmerhall | overdrone | A quick shiver of distant hums above a plain sung note
Glass novices | High treble | voice=Glass series=Chord_tones method=Contrary row=3.5 ringers=6 cover=0.35 tilt=-2 overlap=0.95 attack=0.06 release=3 body=0.5 beat=0.1 muffle=0 weight=-0.5 gap=0.4 swing=0.2 crossing=0.6 | ooh | chorale | Glass that sings the tones held, one part up while another comes down
Soprano through a wall | High treble | voice=Reed series=Fifths method=Long row=1.6 ringers=6 cover=0.45 tilt=1 overlap=0.9 attack=0.02 release=1 beat=1.8 body=0.6 muffle=0 weight=0.1 gap=0.28 swing=0 | shade | overdrone | A wavering reed with lone fifths flaring out of it by turns
Angels on the bus | High treble | voice=Breath series=Chord_tones method=Dodge row=1.2 ringers=8 cover=0.4 tilt=0 overlap=0.85 attack=0.02 release=1.4 beat=2.4 muffle=0.2 weight=0.2 gap=0 swing=0.3 | firstlight | suspend | Breathy chord tones that flutter in pairs above a steady note
Penitents uphill | Leather and stone | voice=Reed series=Chord_tones method=Hunt row=3 ringers=6 muffle=0.7 cover=0.35 tilt=-6 attack=0.04 overlap=0.95 release=2 bite=0.2 beat=2.8 gap=0.15 weight=0.2 swing=0 crossing=0.6 volume=-5.5 | sinking | suspend | Muffled reeds that carry the chord's tones between them, step by step
Choir under felt | Leather and stone | voice=Hum series=Chord_tones method=Contrary row=4 ringers=8 muffle=0.5 cover=0.2 tilt=-4 attack=0.08 overlap=0.95 release=3 bite=0.2 weight=0 beat=0.1 gap=0.2 swing=0.2 crossing=0.6 volume=-6 | bowed | inner | Hummed parts crossing, every second row sung through cloth
Amen next valley | Leather and stone | voice=Reed series=Fifths method=Rounds row=4.5 ringers=5 muffle=0.4 cover=0.5 tilt=-5 attack=0.1 overlap=0.95 release=5 weight=0.7 beat=1.8 gap=0.06 swing=0.2 | shore | chorale | Reed fifths in a long fall, no step of it louder than the last
Prompter's box | Leather and stone | voice=Breath series=Chord_tones method=Treble row=1.5 ringers=5 muffle=0.6 cover=0.5 tilt=-3 attack=0.02 overlap=0.8 release=0.8 bite=0.7 beat=0.7 gap=0.34 swing=0.4 crossing=0.5 volume=-5.5 | box | wedge | Whispered leads and half covered answers on the notes of the chord
Snow on the choir loft | Leather and stone | voice=Hum series=Odd method=Dodge row=6 ringers=7 muffle=0.8 cover=0.3 tilt=-7 attack=0.2 overlap=1 release=7 bite=0.1 weight=-0.5 beat=2.2 gap=0.12 swing=0.2 crossing=0.15 volume=-6.5 | mist | suspend | Odd hums wrapped thick, stirring in pairs for six seconds at a time
`,
    },
    {
      id: 'opposed-pulses',
      name: 'Opposed pulses',
      category: 'plucked',
      rows: `
Rope in the playground | Answering sides | row=0.5 ringers=4 tilt=-4 release=1.12 bite=0.36 overlap=0.97 cover=0.25 beat=3.2 muffle=0 swing=0.2 gap=0 crossing=0.15 volume=-1.5 | bare | wide | Quick plucked rolls thrown from side to side, half a second each
Washing line in wind | Answering sides | series=Fifths method=Hunt row=1.1 ringers=7 overlap=0.9 tilt=-2 release=2 swing=0 beat=0.25 muffle=0.2 weight=0.2 gap=0.15 volume=-7 | sides | rising | Plucked fifths in an even run on the left and then on the right
Two carpenters | Answering sides | series=Odd method=Dodge row=0.8 ringers=5 overlap=0.9 bite=0.48 tilt=-5 release=0.84 cover=0.15 beat=0.1 muffle=0.05 weight=0.4 gap=0.42 volume=-4.5 | wood | threeabove | Firm odd plucks knocking in pairs, two benches by turns
Crossing guards | Answering sides | method=Contrary row=0.6 ringers=6 tilt=-6 release=1 weight=0 swing=0 beat=2.6 muffle=0.2 gap=0.05 place=0.6 volume=-2 | stub | rising | Strings from both ends of the row at once, half the chord and then the other half
Balcony to balcony | Answering sides | series=Chord_tones method=Treble row=1.3 ringers=6 tilt=-3 release=1.8 bite=0.3 crossing=0.8 beat=1 muffle=0.22 weight=0.3 swing=0.3 gap=0.3 | tapewarm | openfour | A high plucked call and low reply on the notes of the chord, from two sides
Bells across a square | Answering sides | voice=Bell row=0.9 ringers=5 overlap=0.6 tilt=-5 bite=0.5 release=1.8 cover=0.1 beat=0.2 muffle=0.2 swing=0.3 gap=0.12 weight=0.4 volume=1 | silent | suspend | Bells that tumble on one side and then the other, about a second apart | bell
Goats on two hills | Answering sides | voice=Bell series=Odd method=Hunt row=0.5 ringers=6 overlap=0.45 tilt=-3 bite=0.42 release=1.12 weight=0.2 cover=0.25 beat=1.4 muffle=0 gap=0.36 swing=0.15 crossing=0.1 volume=-0.5 | chime | wide | Dry odd bells in hurried rows, hill and other hill | bell
Trams at the junction | Answering sides | voice=Bell series=Fifths method=Dodge row=1.4 ringers=4 overlap=0.6 tilt=-4 bite=0.6 release=2.5 swing=0.8 gap=0.1 beat=0.2 muffle=0.3 crossing=0.15 volume=-7.5 | dotted | openfour | Two bells out of stacked fifths that clang with a lean, left side then right | bell
Sleigh passing sleigh | Answering sides | voice=Bell series=High method=Rounds row=0.7 ringers=8 overlap=0.5 tilt=-2 cover=0.5 bite=0.3 release=1.5 beat=0.8 muffle=0 swing=0.2 weight=0.3 gap=0.28 volume=2 | pan | inner | Distant high bells in falling showers over a soft note, side by side | bell
Duel of teaspoons | Answering sides | voice=Bell method=Contrary row=0.35 ringers=5 overlap=0.25 tilt=-3.5 bite=0.26 release=0.7 cover=0.44 series=Odd beat=0.4 muffle=0 weight=-0.4 swing=0.3 gap=0.15 body=0.32 volume=-3 | tamed | chorale | Tiny odd bells crossing three times a second, first your keys and then mine | bell
Signal lamps | Answering sides | voice=Reed row=0.6 ringers=5 overlap=0.7 attack=0.003 tilt=-1 bite=0.2 release=0.4 cover=0.3 swing=0 series=Odd body=0.85 beat=3.4 muffle=0 weight=0.2 gap=0.42 volume=1 | chorale | wide | Bright odd reeds that blink from side to side, a fall of five to every blink | organ
Bellows in two hands | Answering sides | voice=Reed series=Fifths method=Hunt row=1.2 ringers=7 overlap=0.85 attack=0.01 tilt=-4 release=0.8 weight=-0.5 beat=1.1 muffle=0.2 swing=0.3 gap=0.05 volume=-2.5 | combo | threeabove | Reeds in fifths that swell to the end of each row, pulled one way then the other | organ
Semaphore | Answering sides | voice=Reed series=Odd method=Long row=0.4 ringers=8 overlap=0.5 attack=0.003 tilt=-3 bite=0.5 release=0.3 cover=0.2 beat=0.7 muffle=0 weight=0 swing=0 gap=0.3 crossing=0.6 volume=-1.5 | transistor | openfour | Single odd reeds at quick intervals from either side | organ
Dancers changing arms | Answering sides | voice=Reed series=Chord_tones method=Contrary row=0.9 ringers=6 overlap=0.8 attack=0.005 tilt=-2 release=0.6 swing=0.9 cover=0.15 beat=2.4 muffle=0.2 weight=0.4 gap=0 crossing=0.6 volume=-7.5 | quickrotor | overdrone | Chord tones on reeds in two broad steps a row, partner and partner | organ
Frogs at either bank | Answering sides | voice=Reed series=Fifths method=Dodge row=1.6 ringers=3 overlap=0.8 attack=0.004 tilt=-7 bite=0.6 release=0.5 gap=0.3 beat=0.2 muffle=0.4 weight=0.3 crossing=0.15 volume=-4.5 | shallows | imitate | Reedy croaks between two low notes, near bank then far bank | texture
Cut glass metronome | Answering sides | voice=Glass row=0.5 ringers=6 overlap=0.5 attack=0.003 tilt=-5.5 bite=0.33 release=0.8 swing=0 cover=0.15 beat=0.1 muffle=0 weight=0.4 crossing=0.15 body=0.32 volume=2.5 | chill | rising | Falling glass twice a second, left and right in strict time | keys
Tide tables | Answering sides | voice=Glass series=Fifths method=Contrary row=1.8 ringers=8 overlap=0.9 attack=0.01 tilt=-5 bite=0.2 release=3 weight=-0.5 beat=0.9 muffle=0.2 swing=0.25 gap=0.36 cover=0.33 volume=-5 | water | wide | Glass fifths that close on the middle, one half of the chord at a time | keys
Windows opposite | Answering sides | voice=Glass series=High method=Treble row=0.8 ringers=5 overlap=0.6 attack=0.003 cover=0.6 tilt=-3 release=1.2 bite=0.4 beat=0.1 muffle=0.05 weight=0.3 gap=0.1 swing=0.35 volume=-4 | sinehalo | openfour | High glass flashing on one side and on the other, over plain soft keys | keys
Mirror corridor | Answering sides | voice=Glass series=Odd method=Hunt row=0.7 ringers=7 overlap=0.7 attack=0.003 tilt=-2.5 release=1.5 beat=2 cover=0.17 muffle=0 weight=0.2 swing=0.1 gap=0.1 crossing=0.6 volume=-4.5 | rings | rising | Bright odd glass running across each side in turn, wavering | keys
Night bus rail | Answering sides | voice=Glass method=Dodge row=1 ringers=3 overlap=0.7 attack=0.004 cover=0.6 tilt=-9 release=0.7 bite=0.2 place=0.5 beat=2.2 muffle=0.3 weight=0.4 gap=0.28 swing=0.6 | lowpulse | chorale | Round covered keys with a soft rattle of two low glasses by turns | keys
Hearts in two houses | Answering sides | voice=Hum row=0.9 ringers=4 overlap=0.7 attack=0.005 tilt=-8 cover=0.4 release=0.8 bite=0.3 swing=1 beat=0.1 muffle=0.2 weight=0.4 gap=0.42 place=0.6 volume=-7.5 | narrow | walkdown | A low hummed double beat that answers itself from the other side | bass
Rowing in the dark | Answering sides | voice=Hum series=Fifths method=Contrary row=2 ringers=6 overlap=0.9 attack=0.03 tilt=-5 release=2 weight=0.8 swing=0.6 beat=1 muffle=0.2 gap=0.05 volume=-3 | heads | inner | Hums in heavy strokes of fifths, one oar and then the other | pad
Pavement vents | Answering sides | voice=Hum series=Odd method=Hunt row=0.5 ringers=5 overlap=0.6 attack=0.003 tilt=-4 bite=0.7 release=0.5 cover=0.15 beat=0.9 muffle=0 weight=0.3 swing=0.2 gap=0.3 volume=0 | touchgate | inner | Short odd hums that huff along each side in quick rows | texture
Seesaw at dusk | Answering sides | voice=Hum series=Chord_tones method=Rounds row=1.4 ringers=7 overlap=0.85 attack=0.01 tilt=-1 release=1.6 crossing=0.9 weight=-0.4 beat=0.8 muffle=0.3 swing=0.2 gap=0.36 | harmtrem | inner | Borrowed tones hummed in falls that tip from side to side | voice
Generator behind a tent | Answering sides | voice=Hum method=Dodge row=0.7 ringers=3 overlap=0.8 attack=0.003 tilt=-6 beat=4 cover=0.5 release=0.4 body=0.7 muffle=0.2 weight=0.4 swing=0.3 gap=0.1 place=0.5 | lowpulse | walkdown | A rough low hum trading between two notes with a fast beat in it | bass
Bellboys whistling | Answering sides | voice=Breath row=0.6 ringers=6 overlap=0.6 attack=0.003 tilt=-3.5 bite=0.44 release=0.5 cover=0.35 series=Fifths beat=0.1 muffle=0 weight=0.4 swing=0.3 gap=0.28 body=0.32 volume=3.5 | booth | openfour | Puffed fifths thrown across a room and back | texture
Steam and crank | Answering sides | voice=Breath series=Odd method=Hunt row=0.8 ringers=5 overlap=0.6 attack=0.004 tilt=-5 bite=0.6 release=0.56 swing=1 cover=0.25 beat=3.4 muffle=0.2 weight=0.5 gap=0.1 volume=-1 | weave | wide | Odd breath in two hard strokes a row, piston and piston | texture
Whisper tennis | Answering sides | voice=Breath series=Low method=Treble row=1 ringers=7 overlap=0.75 attack=0.01 tilt=-1 release=1 weight=0.3 cover=0.1 beat=0.1 muffle=0 swing=0.2 gap=0.42 crossing=0.15 volume=-8.5 | grains | suspend | A whispered high stroke and its low return, over the net and back | texture
Trains breathing | Answering sides | voice=Breath series=Low method=Rounds row=2.4 ringers=8 overlap=0.9 attack=0.06 tilt=-7 release=2 cover=0.4 gap=0.3 beat=2.8 muffle=0.3 weight=0.4 swing=0.25 volume=-2 | cavern | wide | Low breath that rolls down on one track, rests, and rolls down on the other | texture
Feathers and scales | Answering sides | voice=Breath series=Chord_tones method=Contrary row=1.5 ringers=6 overlap=0.85 attack=0.02 tilt=-3 release=1.5 beat=4.4 cover=0.2 muffle=0.2 weight=-0.5 swing=0.3 gap=0.05 crossing=0.6 volume=-6.5 | vapour | inner | Soft air on the tones of the chord, weighed on two pans | texture
Carpet beaters | Answering sides | muffle=1 voice=Bell row=0.7 ringers=3 overlap=0.5 tilt=-9 bite=1 release=0.5 cover=0.35 weight=0.8 beat=0.1 swing=0.6 gap=0.3 place=0.6 volume=3 | hammers | tolling | Thuds with a low tone in them that answer from left and right | drum
Stable doors at night | Answering sides | muffle=0.9 method=Dodge row=0.6 ringers=4 overlap=0.7 tilt=-6 bite=0.9 release=0.4 cover=0.3 beat=0 weight=0.3 swing=0.3 gap=0.36 volume=-8 | box | wide | Damped strings that knock to and fro, stall by stall | drum
Typesetters at lunch | Answering sides | muffle=1 series=Low method=Contrary row=0.4 ringers=6 overlap=0.8 tilt=2 bite=0.3 release=0.7 cover=0.5 beat=0.1 weight=-0.4 swing=0.2 gap=0.1 volume=2 | thinned | wide | Quick small taps in mirrored pairs, one case and the next | drum
Gourds on a beam | Answering sides | muffle=0.7 series=Fifths voice=Bell method=Hunt row=0.9 ringers=5 overlap=0.6 tilt=-5 bite=0.6 release=1 cover=0.2 beat=1.4 weight=0.3 swing=0.4 gap=0.1 place=0.5 volume=-4 | pot | openfour | Muffled knocks in fifths along one half of the beam and then the other | drum
Rain on two drums | Answering sides | muffle=0.8 series=Low voice=Plucked method=Long row=0.5 ringers=8 overlap=0.97 tilt=-7 bite=0.28 release=1.4 cover=0.4 beat=0.1 weight=0.1 swing=0 gap=0.28 volume=-6 | cistern | overdrone | Single damped drops, now left and now right, none in the same place | drum
Porters with a trunk | Answering sides | series=Low swing=1 row=1 ringers=6 tilt=-4 release=1.4 bite=0.4 weight=0.3 beat=1.4 muffle=0.2 gap=0.1 volume=-2.5 | springs | threeabove | Strings gathered in two strums a row, porter and porter
Guitars on a porch | Answering sides | series=Chord_tones swing=1 method=Contrary row=1.6 ringers=8 overlap=0.95 tilt=-3 release=2.5 bite=0.3 cover=0.1 beat=2 muffle=0 weight=0.3 gap=0.42 crossing=0.6 volume=-5 | room | rising | Broad strums of the chord's own tones from one chair and then the other
Limping clockmaker | Answering sides | series=Odd swing=0.7 method=Treble row=0.7 ringers=5 overlap=0.9 tilt=-2 release=1.26 bite=0.42 gap=0.05 cover=0.25 beat=0.9 muffle=0.2 weight=0.4 crossing=0.15 volume=-6 | slap | ostinato | Odd strings with a catch in the step, high first, side after side
Loose shutters | Answering sides | series=Fifths swing=0.9 method=Hunt row=2 ringers=4 overlap=0.9 tilt=-6 release=2 cover=0.3 muffle=0.4 beat=1.3 weight=0.4 gap=0.14 crossing=0.15 | slack | rising | Heavy fifths that bang twice a row, every second one through cloth
Hats in the air | Answering sides | series=High swing=0.8 method=Rounds row=1.2 ringers=7 overlap=0.85 tilt=2.8 cover=0.4 release=1.8 bite=0.35 beat=0.1 muffle=0 weight=0.3 gap=0.3 volume=6 | stackup | wide | High strings tossed up in handfuls over soft low notes
Lanterns down a canal | Answering sides | tower=In_turn voice=Bell row=0.6 ringers=5 overlap=0.6 tilt=-5 release=1.6 bite=0.4 beat=1.4 muffle=0.2 weight=0.3 swing=0.2 gap=0.1 crossing=0.15 volume=5 | phasing | openfour | Bells that light up one key after another, each a short falling row | bell
Four at cards | Answering sides | tower=In_turn method=Hunt row=0.45 ringers=4 overlap=0.9 tilt=-4 release=0.98 bite=0.36 cover=0.2 beat=0.4 muffle=0 weight=0.4 swing=0.3 gap=0.36 volume=-3.5 | table | threeabove | Quick plucks dealt from key to key around the table
Passing buckets | Answering sides | tower=In_turn voice=Hum series=Fifths method=Rounds row=0.7 ringers=6 overlap=0.75 attack=0.004 tilt=-5 release=1 bite=0.5 beat=0.8 muffle=0.25 weight=0.3 swing=0.2 gap=0 volume=1.5 | darkplate | inner | Hummed fifths that go down the line of keys, seven tenths of a second each | voice
Relay in the arcade | Answering sides | tower=In_turn voice=Glass series=Chord_tones method=Treble row=0.5 ringers=8 overlap=0.7 attack=0.003 tilt=-2 release=1.68 bite=0.3 cover=0.25 beat=0.1 muffle=0 weight=0.2 swing=0.3 gap=0.1 crossing=0.6 volume=-4 | leftright | suspend | Glass that hands the chord from key to key, each turn led from the top | keys
Sentries at four gates | Answering sides | tower=In_turn voice=Reed series=Low method=Contrary row=1 ringers=6 overlap=0.8 attack=0.005 tilt=-4 release=0.6 cover=0.3 beat=1.1 muffle=0.05 weight=-0.5 swing=0.2 gap=0.28 volume=0.5 | stone | openfour | Reeds that call the watch one after another, crossing in each call | wind
Locks filling by turns | Answering sides | row=4 voice=Plucked method=Hunt series=Low ringers=8 overlap=0.97 tilt=-5 release=5 swing=0.2 weight=-0.6 beat=3.2 muffle=0.2 gap=0.12 crossing=0.6 | undertow | wide | Long plucked rows that grow on one side, then four seconds on the other
Pendulum in the crypt | Answering sides | row=2.4 gap=0.9 voice=Bell series=Fifths ringers=5 overlap=0.85 tilt=-7 release=5 weight=0.3 bite=0.2 beat=0.2 muffle=0.3 swing=0.3 volume=-2 | stackdown | wide | Dark bells that fall to the left, wait, and fall to the right | bell
Two lighthouses | Answering sides | row=3.2 gap=0.4 voice=Glass series=Odd method=Contrary ringers=6 overlap=0.9 attack=0.04 tilt=-5 release=4 cover=0.43 beat=0.7 muffle=0 weight=-0.5 swing=0.2 crossing=0.15 volume=2 | fogbound | wide | Odd glass that brightens on one shore and then on the other | pad
Change of shift | Answering sides | row=1.5 gap=1.1 voice=Reed method=Rounds series=Low ringers=8 overlap=0.8 attack=0.01 tilt=-5 release=1.2 weight=0.3 cover=0.25 beat=0.25 muffle=0.2 swing=0.2 volume=-4 | shaft | threeabove | Reeds that fall together and clear the floor before the other side begins | organ
Breath and answer | Answering sides | row=2.8 gap=0.6 voice=Breath method=Treble series=Fifths ringers=6 overlap=0.9 attack=0.08 tilt=-4 release=3 cover=0.2 beat=2 muffle=0 weight=0.3 swing=0.3 volume=-5 | breaking | inner | A long phrase of air, a rest, and the other half of the chord replies | pad
`,
    },
    {
      id: 'quarter-hours',
      name: 'Quarter hours',
      category: 'bell',
      rows: `
Quarter to nothing | Quarter hour | row=2 ringers=5 cover=0.2 tilt=-5 bite=0.5 release=5 beat=0.3 muffle=0.2 gap=0.15 weight=0.2 swing=0 volume=-4.5 | slack | tolling | A bell and then another, a second apart, five to a key and never in a tune
Clock over the stables | Quarter hour | series=Fifths row=1 ringers=6 tilt=-6 body=0.3 release=3 cover=0.15 beat=0.1 muffle=0 gap=0 swing=0.3 crossing=0.15 volume=-1.5 | outside | highbells | Fifths struck singly at half second steps, round and plain
Town hall in fog | Quarter hour | series=Odd row=3 ringers=8 overlap=0.9 tilt=-5 bite=0.2 beat=1.6 release=12 muffle=0.3 gap=0.12 weight=-0.4 swing=0 volume=-5 | fogbound | knell | Odd bells that beat as they ring, one every second and a half
Mantelpiece | Quarter hour | row=0.7 ringers=7 overlap=0.5 tilt=-5.5 bite=0.45 release=1.2 cover=0.3 beat=0.2 muffle=0 gap=0.2 weight=0.3 place=0.2 body=0.44 volume=3 | booth | touches | A small quick clock, three overtones to the second, close at hand
Station at midnight | Quarter hour | row=4 ringers=4 overlap=0.95 tilt=-6 body=0.2 bite=0.3 release=10 cover=0.4 series=Fifths beat=1 muffle=0.2 gap=0 weight=-0.3 swing=0.2 | nave | tolling | Four dark bells in fifths that take turns two seconds apart over a soft ground
Egg timer turned | Quarter hour | voice=Glass row=2.4 ringers=6 attack=0.003 tilt=-7.5 bite=0.22 release=5 cover=0.5 beat=0.05 muffle=0 gap=0.25 weight=0.2 swing=0 body=0.37 volume=0.5 | highglass | tolling | Single glasses that speak slowly, wide apart, over a round tone
Frozen orchard | Quarter hour | voice=Glass series=Odd row=1.2 ringers=8 attack=0.003 tilt=-7.5 bite=0.39 release=3 overlap=0.6 place=1 beat=2.2 muffle=0 gap=0.42 swing=0.2 crossing=0.15 cover=0.54 body=0.37 volume=4 | octavehalo | touches | Odd glass dripping from branch to branch across the whole width
Museum case | Quarter hour | voice=Glass series=Fifths row=3.2 ringers=5 attack=0.03 tilt=-6 bite=0.1 release=8 cover=0.5 overlap=0.95 beat=0.2 muffle=0.2 gap=0.05 swing=0 weight=0.1 volume=-9 | lights | openfour | Soft glass fifths behind a plain tone, one at a time and slow to go
Gutter in a thaw | Quarter hour | voice=Glass series=High row=0.8 ringers=6 attack=0.003 tilt=-4.5 cover=0.57 release=1.6 overlap=0.25 bite=0.28 beat=0.9 muffle=0.05 gap=0.15 weight=0.4 swing=0.3 body=0.37 volume=-1 | rain | suspend | High glass drops over soft low keys, never two alike in a row
Optician at closing | Quarter hour | voice=Glass series=Chord_tones row=1.6 ringers=7 attack=0.005 tilt=-5 beat=0.2 release=4 cover=0.15 crossing=0.9 muffle=0 gap=0 weight=0.1 swing=0 volume=-3 | bare | chorale | Still glass that tries each tone of the chord in turn
Lone harpist tuning | Quarter hour | voice=Plucked row=1.8 ringers=8 tilt=-3 bite=0.4 release=4 cover=0.15 overlap=0.9 beat=2 muffle=0 gap=0.3 weight=0.2 swing=0.15 volume=-8.5 | wideends | rising | One string and then another, wide apart, as if being tuned | plucked
Rosewood clock | Quarter hour | voice=Plucked series=Odd row=0.9 ringers=5 tilt=-6.5 bite=0.28 release=2.4 cover=0.54 overlap=0.9 beat=0.1 muffle=0.25 gap=0.36 weight=0.4 swing=0.4 place=0.2 volume=0.5 | wood | touches | Odd strings ticking in twos inside a wooden case | plucked
Crane at the window | Quarter hour | voice=Plucked series=Fifths row=3.6 ringers=6 tilt=-2 bite=0.5 release=7 overlap=0.95 cover=0.05 beat=2.6 muffle=0.2 gap=0 weight=-0.3 swing=0 volume=-7.5 | longspring | rising | Open fifths plucked once in two seconds and left to ring bare | plucked
Meter running | Quarter hour | voice=Plucked series=Low row=0.45 ringers=7 tilt=-6 bite=0.3 release=0.7 overlap=0.7 cover=0.45 muffle=0.5 beat=0.1 gap=0.1 weight=0.3 swing=0.5 place=0.3 volume=2 | stub | ostinato | Quick single plucks that count in no fixed order, every other row damped | plucked
Monday marketplace | Quarter hour | voice=Plucked series=Chord_tones row=1.3 ringers=8 tilt=-4 bite=0.35 release=2 tower=In_turn cover=0.1 overlap=0.9 beat=3.2 muffle=0.05 gap=0 weight=0.2 swing=0.3 crossing=0.6 volume=-5.5 | heads | openfour | Chord tones plucked by one key at a time, round and round | plucked
Sundial in cloud | Quarter hour | voice=Hum row=3 ringers=6 attack=0.04 tilt=-3 bite=0.3 release=5 cover=0.25 overlap=0.95 series=Odd body=0.75 beat=1.2 muffle=0.2 gap=0.4 weight=0.1 swing=0 volume=-6 | evening | wedge | Odd hummed overtones that come forward singly, with slow gaps between | pad
Caretaker's round | Quarter hour | voice=Hum series=Odd row=1.4 ringers=5 attack=0.005 tilt=-3 bite=0.5 release=1.4 cover=0.2 overlap=0.8 beat=0.1 muffle=0 gap=0.25 weight=0.3 swing=0.2 volume=2.5 | lowshadow | touches | Short hollow hums let out one by one along a passage | keys
Prayers by the hour | Quarter hour | voice=Hum series=Chord_tones row=2.2 ringers=8 attack=0.02 tilt=-2 release=3 overlap=0.9 body=0.8 beat=1.6 muffle=0.2 gap=0.28 weight=-0.4 swing=0 crossing=0.6 volume=-9 | monks | inner | An open hum on one tone of the chord, then another, always unhurried | voice
Ferry horn schedule | Quarter hour | voice=Reed row=2 ringers=4 attack=0.02 tilt=-7 release=1.2 cover=0.4 overlap=0.9 bite=0.3 beat=0.2 muffle=0.3 gap=0.1 weight=0.2 swing=0.2 volume=-6.5 | shore | wedge | Low reeds that sound by turns, a second each, over a covered tone | wind
Squeezebox at the lock | Quarter hour | voice=Reed series=Fifths row=1.1 ringers=7 attack=0.005 tilt=-4 release=0.8 overlap=0.8 beat=3 cover=0.2 muffle=0 gap=0 weight=0.3 swing=0.3 volume=-2 | tiltone | chorale | Shivering reeds, two to each second, stepping about in fifths | organ
Bell for the deaf mule | Quarter hour | row=1.2 muffle=0.7 ringers=5 tilt=-6 bite=0.7 release=2 cover=0.25 beat=0.2 gap=0.25 weight=0.4 swing=0.2 place=0.4 volume=-5.5 | parlour | knell | Wrapped bells struck singly, all clapper and low ring
Second hour under snow | Quarter hour | row=2.6 muffle=1 series=Fifths ringers=6 tilt=-7 bite=0.4 release=6 cover=0.4 overlap=0.9 beat=2 gap=0.1 weight=-0.4 swing=0 volume=-6 | muffled | tolling | Fifths in full leather, more than a second between blows
Behind the confessional | Quarter hour | row=1.6 muffle=0.5 series=Odd ringers=7 tilt=-7.5 bite=0.15 release=3 overlap=0.7 beat=0.2 gap=0.42 weight=0.3 swing=0.2 crossing=0.15 cover=0.22 body=0.24 volume=3 | box | touches | Odd bells one by one, a bare pair and then a covered pair
Cloth round the hammer | Quarter hour | voice=Glass row=2 muffle=0.8 ringers=4 attack=0.003 tilt=-8 release=3 cover=0.5 bite=0.2 beat=0 gap=0.12 weight=0.4 swing=0.2 volume=-1 | blanket | tolling | Dull glass a second apart over a warm steady tone
Hospital corridor clock | Quarter hour | voice=Plucked row=1 muffle=0.9 series=Low ringers=6 tilt=-5 bite=0.32 release=1.6 cover=0.45 overlap=0.97 beat=3.2 gap=0 weight=0.2 swing=0.4 place=0.4 volume=-0.5 | shaft | touches | Stopped strings that tick along the wall in changing pairs | plucked
Quarter chime descending | Quarter hour | method=Rounds row=3 gap=0.8 ringers=5 tilt=-6 bite=0.4 weight=0.3 release=6 overlap=0.8 beat=0.3 muffle=0.2 swing=0.2 crossing=0.15 volume=-1 | brighthall | knell | Five bells fall in a roll, then nothing for longer than the fall
Guildhall at the hour | Quarter hour | method=Rounds series=Fifths row=4 gap=0.2 ringers=8 tilt=-4 bite=0.6 release=9 overlap=0.85 beat=0.8 muffle=0 weight=-0.5 swing=0.2 volume=-17 | tails | tolling | A great roll of stacked fifths once in nearly five seconds
Cuckoo asleep | Quarter hour | method=Treble series=Odd row=1.4 gap=0.5 ringers=4 tilt=-6 bite=0.07 release=2.1 cover=0.52 overlap=0.7 beat=0.9 muffle=0.2 weight=0.4 swing=0.4 body=0.37 volume=-5 | little | touches | One odd high note, two low ones after it, and a pause
Regulator | Quarter hour | method=Dodge row=1 ringers=3 tilt=-6 bite=0.36 release=1.4 overlap=0.5 cover=0.35 swing=0 beat=0.2 muffle=0.3 gap=0 weight=0.2 place=0.3 volume=-7.5 | tamed | touches | Two small bells in strict exchange, sixteen strokes to a second
Striking thirteen | Quarter hour | method=Hunt series=Chord_tones row=2.4 gap=0.4 ringers=8 tilt=-5 bite=0.5 release=5 overlap=0.7 beat=1 muffle=0 weight=0.2 swing=0 crossing=0.6 | silent | chorale | Chord tones struck evenly up and down, with a rest before the next round
Both banks at noon | Quarter hour | tower=Opposed row=1.6 ringers=6 tilt=-5 bite=0.5 release=4 place=1 beat=2 muffle=0.2 gap=0.05 weight=0.3 swing=0 volume=-5.5 | reflection | openfour | Bells one by one from this side of the river and then from that
Tick of four watches | Quarter hour | tower=In_turn row=0.5 ringers=8 tilt=-4.5 bite=0.33 release=1.2 overlap=0.3 cover=0.2 beat=0.2 muffle=0 gap=0.3 weight=0.4 swing=0.3 body=0.37 volume=6 | pair | suspend | Tiny bells, two from each key before the next takes over
Observatory stairs | Quarter hour | tower=Canon series=Fifths row=2.2 ringers=7 tilt=-4 bite=0.3 release=7 place=1 overlap=0.9 muffle=0.05 gap=0.1 beat=0.2 weight=-0.4 swing=0.2 volume=-6 | stair | rising | Single fifths in canon, each key counting in its own time
Night porter's keys | Quarter hour | tower=Opposed voice=Glass series=Odd row=0.7 ringers=5 attack=0.003 tilt=-10 release=1.2 overlap=0.25 bite=0.33 beat=0.4 muffle=0 gap=0.36 weight=0.3 swing=0.3 cover=0.47 body=0.37 volume=-2 | pebble | inner | Odd glass flicked singly from left and right | keys
Committee of clocks | Quarter hour | tower=In_turn series=Chord_tones row=1.2 ringers=6 tilt=-5 bite=0.4 release=3 crossing=0.8 cover=0.15 beat=0.8 muffle=0.2 gap=0.1 weight=0.2 swing=0.2 volume=-1 | unfold | openfour | One key at a time rings two notes of the chord, and the next objects
High water mark | Quarter hour | series=High row=1.8 ringers=7 cover=0.74 tilt=-5 bite=0.08 release=5 beat=0.2 muffle=0 gap=0.28 weight=0.1 swing=0 crossing=0.15 body=0.24 volume=-3 | firstlight | wide | Far bells by ones and twos above soft held keys
Aerial on the chapel | Quarter hour | series=High voice=Reed row=1.2 ringers=5 attack=0.01 cover=0.7 tilt=-5.5 release=1 overlap=0.8 beat=2.5 muffle=0.2 gap=0.3 weight=0.2 swing=0.2 volume=-2.5 | transistor | wedge | Lone thin reeds far over a covered tone, like a signal between hours | texture
Snowflake ledger | Quarter hour | series=High row=0.4 ringers=8 cover=0.57 tilt=-6.5 bite=0.08 release=2.5 body=0.1 overlap=0.6 beat=0.1 muffle=0 gap=0 weight=0.3 swing=0.3 crossing=0.15 volume=-1 | glintecho | wide | Pinpoint bells five to the second, each at another height
Weather balloon | Quarter hour | series=Fifths voice=Hum row=3.5 ringers=8 attack=0.05 cover=0.4 tilt=1 release=5 overlap=0.95 beat=1.6 muffle=0.2 gap=0.42 weight=-0.4 swing=0 volume=-5.5 | upglow | single | Hummed fifths that drift up singly from a plain note | texture
Comet over the pier | Quarter hour | series=High voice=Plucked row=1 ringers=6 cover=0.81 tilt=-3 bite=0.09 release=2 overlap=0.85 tower=Canon beat=0.1 muffle=0 gap=0.05 weight=0.2 swing=0.25 body=0.24 volume=3 | slowstars | openfour | High plucks like falling specks, each key out of time with the next | plucked
Sighing escapement | Quarter hour | voice=Breath row=1.5 ringers=5 attack=0.01 tilt=-5.5 bite=0.6 release=1.2 cover=0.39 overlap=0.8 beat=2 muffle=0.25 gap=0.3 weight=0.3 swing=0.2 place=0.4 volume=-8.5 | room | single | A breath and another breath, at heights that do not repeat for rows | texture
Library of drafts | Quarter hour | voice=Breath series=Fifths row=3 ringers=7 attack=0.08 tilt=-3 release=4 cover=0.15 overlap=0.95 place=1 beat=0.1 muffle=0 gap=0 weight=-0.4 swing=0 volume=-3 | backloop | openfour | Bands of air in fifths drawn from the shelves one by one | texture
Bellringer's dream | Quarter hour | row=6 ringers=8 overlap=1 tilt=-4 attack=0.6 bite=0 release=14 crossing=0.7 body=0.3 beat=0.25 muffle=0.2 gap=0.36 swing=0 volume=-7 | swells | overdrone | Bells without an edge that come up singly and ring on long after | pad
Cabin under the tide | Quarter hour | row=3.4 ringers=5 overlap=0.95 tilt=-5 body=0.2 release=8 beat=0.3 cover=0.5 muffle=0.3 gap=0.12 weight=0.2 swing=0.2 place=0.4 series=Odd volume=-8 | sunken | knell | Odd dark bells nearly two seconds apart, unhurried
Postcards in order | Quarter hour | row=1.4 series=Chord_tones ringers=7 tilt=-4 bite=0.3 release=4 cover=0.2 beat=0.2 muffle=0.2 gap=0 weight=0.3 swing=0.2 crossing=0.6 volume=-7.5 | recall | chorale | Bells that read out the tones of the chord one by one
Hands stopped at three | Quarter hour | row=5 gap=0.5 ringers=3 tilt=-6 body=0.6 bite=0.5 release=10 beat=0.3 muffle=0.05 weight=0.2 swing=0 volume=-3 | frozen | knell | Three bells only, two to a row, with long still gaps between
Gearwheels in honey | Quarter hour | method=Contrary row=4.5 series=Fifths ringers=6 tilt=-6 overlap=0.92 bite=0.1 release=8 cover=0.3 beat=0.7 muffle=0.2 gap=0 weight=-0.5 swing=0.25 volume=-6 | sag | inner | Slow fifths that mesh in the middle of each row and part again
Sparrows on the minute | Quarter hour | row=0.6 series=Odd ringers=8 tilt=-10 bite=0.08 release=1.6 overlap=0.3 place=1 cover=0.75 beat=0.1 muffle=0 gap=0.1 weight=0.4 swing=0.4 body=0.24 volume=-1 | slips | tolling | Quick odd bells that hop from place to place, dry and brief
Rain in a measure | Quarter hour | voice=Glass row=1 series=Low ringers=8 attack=0.003 tilt=-5 bite=0.5 release=2 overlap=0.6 beat=0.9 cover=0.1 muffle=0 gap=0.1 weight=0.2 swing=0.2 place=0.3 volume=2 | pot | touches | Struck glass drop by drop, eight heights in an order of its own | keys
Year's last quarter | Quarter hour | row=2.8 series=Low ringers=7 tilt=-3 body=0.8 bite=0.7 release=11 overlap=0.9 place=1 beat=0.2 muffle=0.2 gap=0.28 weight=-0.3 swing=0 | open | knell | Full bright bells, one and then one, with all the time there is
`,
    },
  ],
}
