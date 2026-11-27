import { type InstrumentSet } from './set'

// The set of Deep Roots. A direction is one thing the roots are grown for: to
// hold up a pad, to ring under glass, to answer a pluck, to be the bass itself.
// In each are ten families of five: a family has one leaf, one soil or one way
// of meeting, and its five differ in how far and how soon the roots come, in
// how long they last and in what the chain is for. A third of it is fairly dry,
// for the bass is the instrument's own and a room can take it away.

export const SET: InstrumentSet = {
  device: 'deep-roots',
  names: {
    leaf: ['Sine', 'Reed', 'Glass', 'Breath', 'Pluck'],
    soil: ['Clay', 'Sand', 'Peat', 'Chalk', 'Stone'],
  },
  chains: {
    bare: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Open' }],
      words: ', with nothing round it',
    },
    warm: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Warm' }],
      words: ', close and warm',
    },
    shaded: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Shaded' }],
      words: ', dry, with the top shaded',
    },
    thin: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 160 } },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: ', thin and dry',
    },
    deep: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Deep', params: { low: 5 } }],
      words: ', dry, with more floor under it',
    },
    cloth: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 1500 } }],
      words: ', dry, behind a cloth',
    },
    bright: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Bright', params: { presence: 4, air: 5 } }],
      words: ', dry and bright',
    },
    hollow: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Hollow' }],
      words: ', dry and hollow in the middle',
    },
    forward: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Forward', params: { low: -3 } }],
      words: ', dry and forward',
    },
    wide: {
      effects: [{ deviceId: 'spread', preset: 'Wide but safe' }],
      words: ', dry and opened wide',
    },
    middle: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Narrow' },
        { deviceId: 'ambient-eq', preset: 'Keys' },
      ],
      words: ', dry, narrow, in the middle',
    },
    booth: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.16 } }],
      words: 'in a small booth',
    },
    room: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.16 } }],
      words: 'in a short room',
    },
    chamber: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.16 } }],
      words: 'in a tight chamber',
    },
    tiled: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.18 } }],
      words: 'in a small tiled room',
    },
    reel: {
      effects: [{ deviceId: 'tape', preset: 'Quarter inch' }],
      words: 'on quarter inch tape',
    },
    thump: {
      effects: [{ deviceId: 'tape', preset: 'Warm thump' }],
      words: 'on tape that thumps',
    },
    blanket: {
      effects: [{ deviceId: 'tape', preset: 'Under a blanket' }],
      words: 'on tape, under a blanket',
    },
    console: {
      effects: [{ deviceId: 'analog-drive', preset: 'Console' }],
      words: 'through a warm console',
    },
    iron: {
      effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }],
      words: 'through iron that thickens the lows',
    },
    valve: {
      effects: [{ deviceId: 'patina', preset: 'Hot valve', params: { drive: 0.3, noise: 0.05 } }],
      words: 'through a warm valve',
    },
    glue: {
      effects: [
        { deviceId: 'ambient-comp', preset: 'Glue' },
        { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 2 } },
      ],
      words: ', held evenly and close',
    },
    tamed: {
      effects: [
        { deviceId: 'tamer', preset: 'Gentle' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', dry, with what rings tamed',
    },
    double: {
      effects: [{ deviceId: 'stereo-detune', preset: 'Faint width' }],
      words: ', doubled by a hair',
    },
    doubled: {
      effects: [
        { deviceId: 'stereo-detune', preset: 'Doubled', params: { mix: 0.3 } },
        { deviceId: 'ambient-eq', preset: 'Shaded' },
      ],
      words: ', dry and doubled',
    },
    combo: {
      effects: [
        { deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.15, room: 0.2 } },
      ],
      words: 'through a small amplifier',
    },
    stack: {
      effects: [{ deviceId: 're-amp', preset: 'Warm stack', params: { drive: 0.2, room: 0.15 } }],
      words: 'through a warm loudspeaker',
    },
    pillow: {
      effects: [{ deviceId: 're-amp', preset: 'Pillow speaker' }],
      words: 'through a speaker under a pillow',
    },
    wood: {
      effects: [{ deviceId: 'vessel', preset: 'Hint of wood' }],
      words: 'in a box of thin wood',
    },
    board: {
      effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.45 } }],
      words: 'on a soundboard',
    },
    pot: {
      effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.5 } }],
      words: 'inside a clay pot',
    },
    pipe: {
      effects: [{ deviceId: 'vessel', preset: 'Inside a pipe', params: { mix: 0.45 } }],
      words: 'inside an open pipe',
    },
    cistern: {
      effects: [{ deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.4, air: 0.1 } }],
      words: 'in a deep cistern',
    },
    skin: {
      effects: [{ deviceId: 'vessel', preset: 'Drum head', params: { mix: 0.45 } }],
      words: 'under a drum head',
    },
    oval: {
      effects: [{ deviceId: 'imprint', preset: 'Round vowel', params: { amount: 0.6 } }],
      words: ', shaped to a round vowel',
    },
    boxed: {
      effects: [{ deviceId: 'imprint', preset: 'Dark box', params: { amount: 0.6 } }],
      words: ', with the colour of a dark box',
    },
    felted: {
      effects: [{ deviceId: 'sift', preset: 'Soft hammers' }],
      words: 'with every stroke felted',
    },
    tones: {
      effects: [
        { deviceId: 'sift', preset: 'Tones only', params: { air: -12 } },
        { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 1 } },
      ],
      words: 'with its attacks sifted out',
    },
    reveal: {
      effects: [
        { deviceId: 'reveal', preset: 'Gentle opening' },
        { deviceId: 'ambient-eq', preset: 'Open' },
      ],
      words: 'with its quiet overtones raised',
    },
    grit: {
      effects: [{ deviceId: 'saturator', preset: 'Soft tape warmth', params: { driveDb: 9 } }],
      words: ', softly saturated',
    },
    limiter: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
        { deviceId: 'ambient-eq', preset: 'Keys' },
      ],
      words: ', close, loud and level',
    },
    smaller: {
      effects: [{ deviceId: 'size', preset: 'Smaller', params: { mix: 0.8 } }],
      words: 'in a body made smaller',
    },
    giant: {
      effects: [{ deviceId: 'size', preset: 'Larger', params: { size: 0.6 } }],
      words: 'in a body made larger',
    },
    buzz: {
      effects: [{ deviceId: 'buzzing-bridge', preset: 'Harp on a bridge', params: { mix: 0.4 } }],
      words: 'over a bridge that buzzes',
    },
    sway: {
      effects: [{ deviceId: 'tremolo', preset: 'Sea swell', params: { depth: 0.5 } }],
      words: ', swelling as the sea does',
    },
    harmonic: {
      effects: [{ deviceId: 'tremolo', preset: 'Harmonic shimmer' }],
      words: 'with a tremolo between low and high',
    },
    panned: {
      effects: [{ deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.6 } }],
      words: ', crossing slowly from side to side',
    },
    amptrem: {
      effects: [
        { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.4 } },
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.12 } },
      ],
      words: "with an amplifier's tremolo",
    },
    chorale: {
      effects: [{ deviceId: 'rotary', preset: 'Chorale', params: { mix: 0.7 } }],
      words: 'through a slow rotary speaker',
    },
    whirl: {
      effects: [{ deviceId: 'rotary', preset: 'Tremolo', params: { mix: 0.6 } }],
      words: 'through a fast rotary speaker',
    },
    swirl: {
      effects: [{ deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } }],
      words: 'in a slow swirl of phase',
    },
    glacial: {
      effects: [{ deviceId: 'flanger', preset: 'Glacial drift', params: { mix: 0.35 } }],
      words: 'with a comb drifting slowly over it',
    },
    ensemble: {
      effects: [{ deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.4 } }],
      words: ', made an ensemble',
    },
    drift: {
      effects: [
        { deviceId: 'chorus', preset: 'Slow drift' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: 'with a slow chorus in a room',
    },
    latevib: {
      effects: [{ deviceId: 'late-vibrato', preset: 'Late vibrato', params: { depth: 16 } }],
      words: 'with a vibrato that waits',
    },
    currents: {
      effects: [{ deviceId: 'currents', preset: 'Slow water' }],
      words: ', its bands moving as slow water',
    },
    tide: {
      effects: [
        { deviceId: 'currents', preset: 'Wide tide' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.16 } },
      ],
      words: 'on a wide tide before a plate',
    },
    glimmer: {
      effects: [{ deviceId: 'glimmer', preset: 'Light on water' }],
      words: 'with light moving on it',
    },
    lungs: {
      effects: [
        { deviceId: 'breath', preset: 'Calm breath' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', breathing in and out in a room',
    },
    ripple: {
      effects: [
        { deviceId: 'pulses', preset: 'Faint ripple' },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: 'with a faint ripple in a room',
    },
    lowpulse: {
      effects: [{ deviceId: 'band-pulse', preset: 'Slow low pulse', params: { depth: 0.5 } }],
      words: 'with a slow pulse in its low middle',
    },
    glacier: {
      effects: [{ deviceId: 'auto-filter', preset: 'Glacial low-pass' }],
      words: 'under a filter that opens by inches',
    },
    gatelow: {
      effects: [{ deviceId: 'auto-filter', preset: 'Low-pass gate' }],
      words: ', each note closing as it fades',
    },
    losing: {
      effects: [{ deviceId: 'winding-down', preset: 'Losing pace', params: { depth: 0.55 } }],
      words: 'with a pulse that keeps slowing',
    },
    circle: {
      effects: [{ deviceId: 'around', preset: 'Slow circle' }],
      words: ', going round in a slow circle',
    },
    swing: {
      effects: [
        { deviceId: 'around', preset: 'Wide pendulum' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: ', swinging wide in a room',
    },
    flock: {
      effects: [{ deviceId: 'murmuration', preset: 'Evening flock', params: { mix: 0.35 } }],
      words: 'in a small flock of itself',
    },
    bowed: {
      effects: [
        { deviceId: 'swell', preset: 'Bowed' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'with its attacks drawn as by a bow',
    },
    repeats: {
      effects: [{ deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.25 } }],
      words: 'with warm tape repeats',
    },
    darktrail: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.25, feedback: 0.6 } },
      ],
      words: 'with a long dark trail of echoes',
    },
    bounce: {
      effects: [{ deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.26 } }],
      words: 'with dotted echoes to both sides',
    },
    slap: {
      effects: [{ deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.28 } }],
      words: 'with a single tape slap',
    },
    halo: {
      effects: [{ deviceId: 'analog-delay', preset: 'Faint halo' }],
      words: 'with a faint halo of echo',
    },
    murky: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.28 } },
        { deviceId: 'ambient-eq', preset: 'Shaded' },
      ],
      words: 'with murky echoes',
    },
    hop: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Fifth hop', params: { mix: 0.22, feedback: 0.35 } },
      ],
      words: 'with echoes that hop by fifths',
    },
    stone: {
      effects: [{ deviceId: 'skipping-stone', preset: 'Skipping stone', params: { mix: 0.3 } }],
      words: 'with echoes skipping like a stone',
    },
    slowing: {
      effects: [{ deviceId: 'skipping-stone', preset: 'Slowing bounces', params: { mix: 0.28 } }],
      words: 'with bounces that slow down',
    },
    stars: {
      effects: [
        { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.3 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: 'with seven scattered echoes',
    },
    spiralstars: {
      effects: [{ deviceId: 'constellation', preset: 'Slowing spiral', params: { mix: 0.28 } }],
      words: 'with a slowing spiral of echoes',
    },
    prism: {
      effects: [{ deviceId: 'prism', preset: 'Slow unfolding', params: { mix: 0.3 } }],
      words: ', unfolding from low to high',
    },
    answer: {
      effects: [
        { deviceId: 'canon', preset: 'Faint answer' },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: 'with a faint answer in a room',
    },
    crystals: {
      effects: [{ deviceId: 'grain-delay', preset: 'Faint glints' }],
      words: 'with faint glints above it',
    },
    mirror: {
      effects: [
        { deviceId: 'reverse-delay', preset: 'Faint reflection' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.14 } },
      ],
      words: 'with a faint backward reflection',
    },
    recall: {
      effects: [
        { deviceId: 'echo-memory', preset: 'Faint recall' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: 'with moments that drift back',
    },
    loop: {
      effects: [{ deviceId: 'tape-loop', preset: 'Slow fade', params: { mix: 0.35 } }],
      words: 'on a tape loop that fades',
    },
    orbits: {
      effects: [{ deviceId: 'orbits', preset: 'Faint trace' }],
      words: 'with two faint loops turning',
    },
    bed: {
      effects: [
        { deviceId: 'micro-looper', preset: 'Faint bed' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: 'over a faint loop of itself',
    },
    hall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.26 } }],
      words: 'in a hall',
    },
    cathedral: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.28 } }],
      words: 'in a cathedral',
    },
    darkhall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.28 } }],
      words: 'in a dark hall',
    },
    faraway: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.5 } }],
      words: 'from far down a hall',
    },
    undertow: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.24 } }],
      words: 'over a warm undertow',
    },
    plate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.24 } }],
      words: 'on a long plate',
    },
    brightplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.22 } }],
      words: 'on a bright plate',
    },
    springs: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.22 } }],
      words: 'in a tank of springs',
    },
    slack: {
      effects: [
        { deviceId: 'spring-reverb', preset: 'Slack and strange', params: { mix: 0.2 } },
        { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 1 } },
      ],
      words: 'in slack springs',
    },
    valley: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.26 } }],
      words: 'in an open valley',
    },
    cave: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.26 } }],
      words: 'in a dark cave',
    },
    bathe: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.28 } }],
      words: 'in a space that breathes',
    },
    latehall: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.25 } }],
      words: 'in a hall that answers late',
    },
    space: {
      effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.28 } }],
      words: 'in a wide open space',
    },
    lowcath: {
      effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.3 } }],
      words: 'in a vast low cathedral',
    },
    tunnel: {
      effects: [{ deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.28 } }],
      words: 'in a narrow tunnel',
    },
    thinair: {
      effects: [{ deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.26 } }],
      words: 'under thin high air',
    },
    monks: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.25 } }],
      words: ', answered by low voices',
    },
    ahs: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.25 } }],
      words: 'with a choir in its tail',
    },
    glow: {
      effects: [
        { deviceId: 'bloom-reverb', preset: 'Faint glow' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: 'with a tail that blooms faintly',
    },
    glimmerup: {
      effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer' }],
      words: 'with a glimmer an octave up',
    },
    fifths: {
      effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { mix: 0.2, decay: 5 } }],
      words: 'with fifths rising in its tail',
    },
    lift: {
      effects: [{ deviceId: 'spiral', preset: 'Faint lift' }],
      words: 'in a tail that climbs',
    },
    sinking: {
      effects: [{ deviceId: 'spiral', preset: 'Slow descent', params: { mix: 0.24, decay: 5 } }],
      words: 'in a tail that sinks',
    },
    cavern: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.24 } }],
      words: 'in a cavern of echoes',
    },
    across: {
      effects: [{ deviceId: 'distance', preset: 'Across the room' }],
      words: 'from across the room',
    },
    farshore: {
      effects: [{ deviceId: 'distance', preset: 'Far shore', params: { level: 0.9 } }],
      words: 'from a far shore',
    },
    fog: {
      effects: [{ deviceId: 'fog', preset: 'Soft cloud', params: { mix: 0.7 } }],
      words: 'in a soft cloud of fog',
    },
    veil: {
      effects: [
        { deviceId: 'fog', preset: 'Thin veil' },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.16 } },
      ],
      words: 'behind a thin veil',
    },
    haze: {
      effects: [{ deviceId: 'haze', preset: 'Faint warmth' }],
      words: 'in a faint warm haze',
    },
    ghostly: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Ghost', params: { mix: 0.28 } }],
      words: 'with a ghost of each note after it',
    },
    reversed: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.25 } }],
      words: 'with rooms that rise backwards',
    },
    strings: {
      effects: [{ deviceId: 'sympathetic', preset: 'Minor strings', params: { mix: 0.28 } }],
      words: 'with strings that ring along',
    },
    bowls: {
      effects: [{ deviceId: 'bowls', preset: 'Faint halo' }],
      words: 'with bowls that hum along',
    },
    silent: {
      effects: [{ deviceId: 'silent-keys', preset: 'Short answer', params: { mix: 0.3 } }],
      words: 'waking silent strings',
    },
    cloud: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.3 } }],
      words: 'in a soft cloud of grains',
    },
    smear: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Slow smear', params: { mix: 0.35 } }],
      words: ', smeared slowly into grains',
    },
    mist: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.35 } }],
      words: 'in a hanging mist',
    },
    darkwater: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.35 } }],
      words: 'dissolved in dark water',
    },
    freeze: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Soft freeze', params: { mix: 0.22 } }],
      words: 'with a room that half freezes',
    },
    held: {
      effects: [{ deviceId: 'sustainer', preset: 'Brief afterglow', params: { mix: 0.35 } }],
      words: 'with a brief held afterglow',
    },
    shadow: {
      effects: [{ deviceId: 'sine-shadow', preset: 'Long linger', params: { mix: 0.3 } }],
      words: 'with sine shadows that linger',
    },
    common: {
      effects: [{ deviceId: 'common-tones', preset: 'Light touch' }],
      words: ', what is shared hanging on',
    },
    afterimage: {
      effects: [{ deviceId: 'generations', preset: 'Faint afterimage' }],
      words: 'with a faint afterimage',
    },
    near: {
      effects: [{ deviceId: 'stretch', preset: 'Near shadow', params: { mix: 0.3 } }],
      words: 'with a slow shadow close behind',
    },
    sparkle: {
      effects: [{ deviceId: 'cascade', preset: 'Faint halo' }],
      words: 'with small loops of it above',
    },
    sighs: {
      effects: [{ deviceId: 'falling', preset: 'Slow sighs', params: { mix: 0.25 } }],
      words: 'with pieces of it sighing down',
    },
    sag: {
      effects: [{ deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.35 } }],
      words: 'with a tail that sags softly',
    },
    dust: {
      effects: [{ deviceId: 'glints', preset: 'Faint dust' }],
      words: 'with a dust of bright sparks',
    },
    shallows: {
      effects: [{ deviceId: 'underwater', preset: 'Sunlit shallows' }],
      words: 'in sunlit shallows',
    },
    below: {
      effects: [{ deviceId: 'underwater', preset: 'Under', params: { depth: 0.4, bubbles: 0.15 } }],
      words: 'heard under water',
    },
    rain: {
      effects: [
        { deviceId: 'weather', preset: 'Light rain', params: { exposure: 0.4, voice: 0.25 } },
      ],
      words: 'in light rain',
    },
    wind: {
      effects: [
        { deviceId: 'weather', preset: 'Breezy day', params: { exposure: 0.45, voice: 0.2 } },
      ],
      words: 'on a breezy day',
    },
    leaves: {
      effects: [{ deviceId: 'seasons', preset: 'Dry leaves', params: { turn: 0, mix: 0.7 } }],
      words: 'among dry leaves',
    },
    record: {
      effects: [
        { deviceId: 'vinyl', preset: 'Charity shop find', params: { crackle: 0.2, pops: 0 } },
      ],
      words: 'on an old record',
    },
    kitchen: {
      effects: [
        {
          deviceId: 'radio',
          preset: 'Kitchen radio',
          params: { static: 0.1, fading: 0.2, mix: 0.8 },
        },
      ],
      words: 'on a kitchen radio',
    },
    cassette: {
      effects: [{ deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.1 } }],
      words: 'on a worn cassette',
    },
    hiss: {
      effects: [
        { deviceId: 'noise-floor', preset: 'Faint hiss' },
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.15 } },
      ],
      words: 'with a faint hiss in a room',
    },
    section: {
      effects: [{ deviceId: 'pad-follower', preset: 'Barely there', params: { mix: 0.25 } }],
      words: 'with a soft section behind',
    },
    whistle: {
      effects: [
        { deviceId: 'overtone-singer', preset: 'Faint melody' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'with a faint overtone melody',
    },
    pipes: {
      effects: [{ deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.5 } }],
      words: 'with flute pipes over it',
    },
    octave: {
      effects: [
        { deviceId: 'octaves', preset: 'Faint octave' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.16 } },
      ],
      words: 'with a faint octave over it',
    },
    rising: {
      effects: [
        { deviceId: 'spectral-drifter', preset: 'Octave halo', params: { mix: 0.25 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: 'with a drifting octave halo',
    },
    half: {
      effects: [{ deviceId: 'half-speed', preset: 'Thin shadow' }],
      words: 'with a thin shadow at half speed',
    },
    sampler: {
      effects: [{ deviceId: 'vintage-digital', preset: 'Glaze' }],
      words: "through an early sampler's glaze",
    },
    watery: {
      effects: [{ deviceId: 'low-bitrate', preset: 'Watery trace' }],
      words: 'with a watery trace of itself',
    },
    chime: {
      effects: [
        { deviceId: 'warp', preset: 'Soft chime', params: { mix: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', bent towards a chime',
    },
    shifted: {
      effects: [
        { deviceId: 'freq-shifter', preset: 'Slow drift', params: { mix: 0.3 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: 'with a slow drift of beats',
    },
    key: {
      effects: [{ deviceId: 'scale-filter', preset: 'Lean to the key', params: { mix: 0.6 } }],
      words: ', leaning to the key',
    },
    ring: {
      effects: [
        { deviceId: 'ring', preset: 'Faint halo' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: 'with a faint ring of bell tone',
    },
    sustain: {
      effects: [{ deviceId: 'howl', preset: 'Faint sustain', params: { mix: 0.35 } }],
      words: 'with a faint bloom of feedback',
    },
    worn: {
      effects: [
        { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.1 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: 'on tape worn thin',
    },
    seasick: {
      effects: [{ deviceId: 'tape-echo', preset: 'Wobbly double', params: { mix: 0.35 } }],
      words: 'with a wobbling double',
    },
  },
  phrases: {
    cellar: {
      notes: [
        { atSec: 0, durSec: 3.3, note: 62, gain: 0.65 },
        { atSec: 0, durSec: 3.3, note: 69, gain: 0.55 },
        { atSec: 0, durSec: 3.3, note: 77, gain: 0.55 },
        { atSec: 3.4, durSec: 3.3, note: 60, gain: 0.65 },
        { atSec: 3.4, durSec: 3.3, note: 69, gain: 0.55 },
        { atSec: 3.4, durSec: 3.3, note: 76, gain: 0.5 },
      ],
    },
    suspend: {
      notes: [
        { atSec: 0, durSec: 2, note: 55, gain: 0.6 },
        { atSec: 0, durSec: 2, note: 62, gain: 0.55 },
        { atSec: 0, durSec: 1, note: 72, gain: 0.65 },
        { atSec: 1, durSec: 1, note: 71, gain: 0.5 },
        { atSec: 2.1, durSec: 2.4, note: 48, gain: 0.6 },
        { atSec: 2.1, durSec: 2.4, note: 64, gain: 0.55 },
        { atSec: 2.1, durSec: 1.1, note: 71, gain: 0.6 },
        { atSec: 3.2, durSec: 1.3, note: 72, gain: 0.5 },
        { atSec: 4.6, durSec: 2.6, note: 53, gain: 0.65 },
        { atSec: 4.6, durSec: 1.2, note: 64, gain: 0.55 },
        { atSec: 5.8, durSec: 1.4, note: 65, gain: 0.5 },
        { atSec: 4.6, durSec: 2.6, note: 69, gain: 0.5 },
      ],
    },
    built: {
      notes: [
        { atSec: 0, durSec: 7, note: 69, gain: 0.65 },
        { atSec: 1, durSec: 6, note: 76, gain: 0.55 },
        { atSec: 2, durSec: 5, note: 65, gain: 0.6 },
        { atSec: 3.1, durSec: 3.9, note: 62, gain: 0.6 },
        { atSec: 4.4, durSec: 2.6, note: 72, gain: 0.45 },
      ],
    },
    call: {
      notes: [
        { atSec: 0, durSec: 0.9, note: 76, gain: 0.7 },
        { atSec: 1, durSec: 1.4, note: 72, gain: 0.6 },
        { atSec: 2.8, durSec: 2.2, note: 57, gain: 0.55 },
        { atSec: 2.8, durSec: 2.2, note: 64, gain: 0.45 },
        { atSec: 5.1, durSec: 0.8, note: 74, gain: 0.6 },
        { atSec: 5.9, durSec: 1.4, note: 71, gain: 0.5 },
      ],
    },
    ostinato: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 69, gain: 0.7 },
        { atSec: 0.6, durSec: 0.5, note: 64, gain: 0.5 },
        { atSec: 1.2, durSec: 0.5, note: 72, gain: 0.6 },
        { atSec: 1.8, durSec: 0.5, note: 64, gain: 0.45 },
        { atSec: 2.4, durSec: 0.5, note: 69, gain: 0.65 },
        { atSec: 3, durSec: 0.5, note: 65, gain: 0.5 },
        { atSec: 3.6, durSec: 0.5, note: 72, gain: 0.6 },
        { atSec: 4.2, durSec: 0.5, note: 65, gain: 0.45 },
        { atSec: 4.8, durSec: 0.5, note: 67, gain: 0.65 },
        { atSec: 5.4, durSec: 0.5, note: 62, gain: 0.5 },
        { atSec: 6, durSec: 1.2, note: 71, gain: 0.6 },
      ],
    },
    single: {
      notes: [{ atSec: 0, durSec: 6.6, note: 67, gain: 0.7 }],
    },
    lone: {
      notes: [
        { atSec: 0, durSec: 2.6, note: 72, gain: 0.7 },
        { atSec: 3.4, durSec: 3.4, note: 69, gain: 0.6 },
      ],
    },
    lines: {
      notes: [
        { atSec: 0, durSec: 2.2, note: 76, gain: 0.55 },
        { atSec: 0, durSec: 1.1, note: 67, gain: 0.6 },
        { atSec: 1.1, durSec: 1.1, note: 69, gain: 0.55 },
        { atSec: 2.2, durSec: 1.1, note: 74, gain: 0.55 },
        { atSec: 2.2, durSec: 2.2, note: 65, gain: 0.6 },
        { atSec: 3.3, durSec: 1.1, note: 72, gain: 0.55 },
        { atSec: 4.4, durSec: 1.2, note: 71, gain: 0.5 },
        { atSec: 4.4, durSec: 1.2, note: 62, gain: 0.6 },
        { atSec: 5.6, durSec: 1.5, note: 64, gain: 0.6 },
        { atSec: 5.6, durSec: 1.5, note: 72, gain: 0.55 },
      ],
    },
    fifth: {
      notes: [
        { atSec: 0, durSec: 7, note: 50, gain: 0.6 },
        { atSec: 0.4, durSec: 6.6, note: 57, gain: 0.5 },
        { atSec: 1.4, durSec: 1.7, note: 64, gain: 0.5 },
        { atSec: 3.2, durSec: 1.5, note: 65, gain: 0.55 },
        { atSec: 4.8, durSec: 2.2, note: 62, gain: 0.5 },
      ],
    },
    lowline: {
      notes: [
        { atSec: 0, durSec: 1.1, note: 45, gain: 0.75 },
        { atSec: 1.3, durSec: 0.5, note: 52, gain: 0.55 },
        { atSec: 1.9, durSec: 1.1, note: 50, gain: 0.65 },
        { atSec: 3.2, durSec: 1.6, note: 43, gain: 0.75 },
        { atSec: 5, durSec: 0.6, note: 48, gain: 0.6 },
        { atSec: 5.7, durSec: 1.6, note: 45, gain: 0.7 },
      ],
    },
    pedal: {
      notes: [
        { atSec: 0, durSec: 6.8, note: 36, gain: 0.65 },
        { atSec: 0.5, durSec: 6.3, note: 48, gain: 0.5 },
        { atSec: 1.4, durSec: 2.2, note: 55, gain: 0.5 },
        { atSec: 3.7, durSec: 1.4, note: 57, gain: 0.5 },
        { atSec: 5.2, durSec: 2, note: 55, gain: 0.5 },
      ],
    },
    finger: {
      notes: [
        { atSec: 0, durSec: 1, note: 62, gain: 0.8 },
        { atSec: 1.2, durSec: 0.5, note: 62, gain: 0.55 },
        { atSec: 1.8, durSec: 1, note: 69, gain: 0.65 },
        { atSec: 3, durSec: 0.6, note: 67, gain: 0.6 },
        { atSec: 3.7, durSec: 1.1, note: 65, gain: 0.7 },
        { atSec: 5, durSec: 2, note: 60, gain: 0.75 },
      ],
    },
    walk: {
      notes: [
        { atSec: 0, durSec: 0.55, note: 60, gain: 0.75 },
        { atSec: 0.7, durSec: 0.55, note: 64, gain: 0.6 },
        { atSec: 1.4, durSec: 0.55, note: 67, gain: 0.65 },
        { atSec: 2.1, durSec: 0.9, note: 69, gain: 0.7 },
        { atSec: 3.2, durSec: 0.55, note: 65, gain: 0.7 },
        { atSec: 3.9, durSec: 0.55, note: 62, gain: 0.6 },
        { atSec: 4.6, durSec: 0.55, note: 59, gain: 0.6 },
        { atSec: 5.3, durSec: 1.8, note: 60, gain: 0.75 },
      ],
    },
    offbeat: {
      notes: [
        { atSec: 0, durSec: 0.35, note: 65, gain: 0.8 },
        { atSec: 0.5, durSec: 0.25, note: 65, gain: 0.5 },
        { atSec: 1.25, durSec: 0.6, note: 72, gain: 0.65 },
        { atSec: 2.25, durSec: 0.35, note: 64, gain: 0.7 },
        { atSec: 3, durSec: 0.35, note: 62, gain: 0.75 },
        { atSec: 3.5, durSec: 0.25, note: 62, gain: 0.5 },
        { atSec: 4.25, durSec: 0.7, note: 69, gain: 0.65 },
        { atSec: 5.3, durSec: 1.6, note: 57, gain: 0.75 },
      ],
    },
    high: {
      notes: [
        { atSec: 0, durSec: 0.6, note: 81, gain: 0.65 },
        { atSec: 1.1, durSec: 0.6, note: 76, gain: 0.55 },
        { atSec: 2.2, durSec: 0.6, note: 84, gain: 0.5 },
        { atSec: 3.6, durSec: 0.6, note: 79, gain: 0.6 },
        { atSec: 5, durSec: 1, note: 72, gain: 0.6 },
      ],
    },
    peal: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 84, gain: 0.6 },
        { atSec: 0.5, durSec: 0.5, note: 79, gain: 0.55 },
        { atSec: 1, durSec: 0.5, note: 76, gain: 0.55 },
        { atSec: 1.5, durSec: 0.7, note: 72, gain: 0.6 },
        { atSec: 3, durSec: 0.5, note: 83, gain: 0.55 },
        { atSec: 3.5, durSec: 0.5, note: 79, gain: 0.5 },
        { atSec: 4, durSec: 0.5, note: 74, gain: 0.55 },
        { atSec: 4.5, durSec: 1.4, note: 67, gain: 0.6 },
      ],
    },
    pairs: {
      notes: [
        { atSec: 0, durSec: 1.8, note: 72, gain: 0.6 },
        { atSec: 0, durSec: 1.8, note: 76, gain: 0.55 },
        { atSec: 2, durSec: 1.8, note: 71, gain: 0.55 },
        { atSec: 2, durSec: 1.8, note: 74, gain: 0.55 },
        { atSec: 4, durSec: 2.8, note: 69, gain: 0.6 },
        { atSec: 4, durSec: 2.8, note: 72, gain: 0.5 },
      ],
    },
    sixths: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 64, gain: 0.65 },
        { atSec: 0, durSec: 1.6, note: 72, gain: 0.5 },
        { atSec: 1.8, durSec: 1.6, note: 65, gain: 0.6 },
        { atSec: 1.8, durSec: 1.6, note: 74, gain: 0.5 },
        { atSec: 3.6, durSec: 1.2, note: 67, gain: 0.6 },
        { atSec: 3.6, durSec: 1.2, note: 76, gain: 0.55 },
        { atSec: 5, durSec: 2.2, note: 62, gain: 0.65 },
        { atSec: 5, durSec: 2.2, note: 71, gain: 0.45 },
      ],
    },
    organum: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 57, gain: 0.65 },
        { atSec: 0, durSec: 1.6, note: 64, gain: 0.5 },
        { atSec: 1.7, durSec: 1.6, note: 60, gain: 0.6 },
        { atSec: 1.7, durSec: 1.6, note: 67, gain: 0.5 },
        { atSec: 3.4, durSec: 1.2, note: 62, gain: 0.55 },
        { atSec: 3.4, durSec: 1.2, note: 69, gain: 0.45 },
        { atSec: 4.8, durSec: 2.4, note: 57, gain: 0.65 },
        { atSec: 4.8, durSec: 2.4, note: 64, gain: 0.5 },
        { atSec: 4.8, durSec: 2.4, note: 69, gain: 0.4 },
      ],
    },
    chorale: {
      notes: [
        { atSec: 0, durSec: 2.2, note: 53, gain: 0.6 },
        { atSec: 0, durSec: 2.2, note: 60, gain: 0.5 },
        { atSec: 0, durSec: 2.2, note: 69, gain: 0.5 },
        { atSec: 0, durSec: 2.2, note: 77, gain: 0.45 },
        { atSec: 2.4, durSec: 2, note: 55, gain: 0.6 },
        { atSec: 2.4, durSec: 2, note: 59, gain: 0.5 },
        { atSec: 2.4, durSec: 2, note: 67, gain: 0.45 },
        { atSec: 2.4, durSec: 2, note: 74, gain: 0.5 },
        { atSec: 4.6, durSec: 2.5, note: 48, gain: 0.65 },
        { atSec: 4.6, durSec: 2.5, note: 60, gain: 0.5 },
        { atSec: 4.6, durSec: 2.5, note: 67, gain: 0.45 },
        { atSec: 4.6, durSec: 2.5, note: 76, gain: 0.5 },
      ],
    },
    throb: {
      notes: [
        { atSec: 0, durSec: 3.4, note: 57, gain: 0.7 },
        { atSec: 0, durSec: 3.4, note: 64, gain: 0.6 },
        { atSec: 0, durSec: 3.4, note: 72, gain: 0.55 },
        { atSec: 3.6, durSec: 3.4, note: 53, gain: 0.7 },
        { atSec: 3.6, durSec: 3.4, note: 64, gain: 0.55 },
        { atSec: 3.6, durSec: 3.4, note: 72, gain: 0.5 },
      ],
    },
    tides: {
      notes: [
        { atSec: 0, durSec: 4, note: 60, gain: 0.6 },
        { atSec: 0.8, durSec: 3.6, note: 67, gain: 0.5 },
        { atSec: 1.6, durSec: 3, note: 74, gain: 0.5 },
        { atSec: 3.8, durSec: 3.4, note: 57, gain: 0.6 },
        { atSec: 4.4, durSec: 2.8, note: 65, gain: 0.5 },
        { atSec: 5, durSec: 2.2, note: 72, gain: 0.5 },
      ],
    },
    lamp: {
      notes: [
        { atSec: 0, durSec: 1.4, note: 74, gain: 0.6 },
        { atSec: 2.2, durSec: 1.2, note: 69, gain: 0.55 },
        { atSec: 4.4, durSec: 2, note: 65, gain: 0.6 },
      ],
    },
    seeds: {
      notes: [
        { atSec: 0, durSec: 0.25, note: 60, gain: 0.7 },
        { atSec: 0.35, durSec: 0.25, note: 67, gain: 0.55 },
        { atSec: 0.7, durSec: 0.25, note: 72, gain: 0.6 },
        { atSec: 1.05, durSec: 0.25, note: 76, gain: 0.5 },
        { atSec: 1.75, durSec: 0.25, note: 57, gain: 0.7 },
        { atSec: 2.1, durSec: 0.25, note: 64, gain: 0.55 },
        { atSec: 2.45, durSec: 0.25, note: 72, gain: 0.6 },
        { atSec: 2.8, durSec: 0.25, note: 74, gain: 0.5 },
        { atSec: 3.5, durSec: 0.25, note: 53, gain: 0.7 },
        { atSec: 3.85, durSec: 0.25, note: 65, gain: 0.55 },
        { atSec: 4.2, durSec: 0.25, note: 69, gain: 0.6 },
        { atSec: 4.55, durSec: 0.25, note: 72, gain: 0.5 },
        { atSec: 5.4, durSec: 0.8, note: 55, gain: 0.65 },
        { atSec: 5.4, durSec: 0.8, note: 71, gain: 0.5 },
      ],
    },
    hocket: {
      notes: [
        { atSec: 0, durSec: 0.3, note: 76, gain: 0.65 },
        { atSec: 0.4, durSec: 0.3, note: 64, gain: 0.6 },
        { atSec: 0.8, durSec: 0.3, note: 74, gain: 0.6 },
        { atSec: 1.2, durSec: 0.3, note: 65, gain: 0.55 },
        { atSec: 1.6, durSec: 0.3, note: 72, gain: 0.65 },
        { atSec: 2.4, durSec: 0.3, note: 62, gain: 0.6 },
        { atSec: 2.8, durSec: 0.3, note: 77, gain: 0.6 },
        { atSec: 3.2, durSec: 0.3, note: 60, gain: 0.6 },
        { atSec: 3.6, durSec: 0.3, note: 76, gain: 0.55 },
        { atSec: 4.4, durSec: 0.3, note: 59, gain: 0.6 },
        { atSec: 4.8, durSec: 0.3, note: 74, gain: 0.6 },
        { atSec: 5.2, durSec: 1.2, note: 60, gain: 0.65 },
        { atSec: 5.2, durSec: 1.2, note: 72, gain: 0.5 },
      ],
    },
    deeps: {
      notes: [
        { atSec: 0, durSec: 2.4, note: 43, gain: 0.7 },
        { atSec: 2.6, durSec: 1.6, note: 50, gain: 0.65 },
        { atSec: 4.4, durSec: 2.6, note: 48, gain: 0.7 },
      ],
    },
    stand: {
      notes: [
        { atSec: 0, durSec: 7.1, note: 62, gain: 0.65 },
        { atSec: 0, durSec: 7.1, note: 69, gain: 0.55 },
        { atSec: 0, durSec: 7.1, note: 77, gain: 0.5 },
      ],
    },
    still: {
      notes: [
        { atSec: 0, durSec: 3.3, note: 74, gain: 0.7 },
        { atSec: 3.6, durSec: 3.6, note: 69, gain: 0.65 },
      ],
    },
    stride: {
      notes: [
        { atSec: 0, durSec: 0.7, note: 57, gain: 0.75 },
        { atSec: 0.9, durSec: 0.7, note: 52, gain: 0.6 },
        { atSec: 1.8, durSec: 0.7, note: 48, gain: 0.7 },
        { atSec: 2.7, durSec: 0.7, note: 50, gain: 0.6 },
        { atSec: 3.6, durSec: 0.7, note: 53, gain: 0.75 },
        { atSec: 4.5, durSec: 0.7, note: 47, gain: 0.65 },
        { atSec: 5.4, durSec: 1.8, note: 48, gain: 0.75 },
      ],
    },
    skank: {
      notes: [
        { atSec: 0, durSec: 0.35, note: 50, gain: 0.8 },
        { atSec: 0.5, durSec: 0.25, note: 50, gain: 0.5 },
        { atSec: 1.25, durSec: 0.6, note: 57, gain: 0.65 },
        { atSec: 2.25, durSec: 0.35, note: 48, gain: 0.7 },
        { atSec: 3, durSec: 0.35, note: 53, gain: 0.75 },
        { atSec: 3.5, durSec: 0.25, note: 53, gain: 0.5 },
        { atSec: 4.25, durSec: 0.7, note: 60, gain: 0.65 },
        { atSec: 5.3, durSec: 1.7, note: 45, gain: 0.75 },
      ],
    },
    moor: {
      notes: [
        { atSec: 0, durSec: 7, note: 45, gain: 0.6 },
        { atSec: 0.4, durSec: 6.6, note: 52, gain: 0.5 },
        { atSec: 1.4, durSec: 1.7, note: 60, gain: 0.5 },
        { atSec: 3.2, durSec: 1.5, note: 62, gain: 0.55 },
        { atSec: 4.8, durSec: 2.2, note: 60, gain: 0.5 },
      ],
    },
    meadow: {
      notes: [
        { atSec: 0, durSec: 7, note: 48, gain: 0.6 },
        { atSec: 0.4, durSec: 6.6, note: 55, gain: 0.5 },
        { atSec: 1.4, durSec: 1.7, note: 64, gain: 0.5 },
        { atSec: 3.2, durSec: 1.5, note: 62, gain: 0.5 },
        { atSec: 4.8, durSec: 2.2, note: 64, gain: 0.5 },
      ],
    },
    upland: {
      notes: [
        { atSec: 0, durSec: 7, note: 53, gain: 0.6 },
        { atSec: 0.4, durSec: 6.6, note: 60, gain: 0.5 },
        { atSec: 1.2, durSec: 2, note: 69, gain: 0.5 },
        { atSec: 3.3, durSec: 1.6, note: 67, gain: 0.5 },
        { atSec: 5, durSec: 2, note: 69, gain: 0.5 },
      ],
    },
    slowtwo: {
      notes: [
        { atSec: 0, durSec: 3.5, note: 57, gain: 0.6 },
        { atSec: 0, durSec: 3.5, note: 64, gain: 0.5 },
        { atSec: 0, durSec: 3.5, note: 72, gain: 0.5 },
        { atSec: 3.6, durSec: 3.5, note: 50, gain: 0.65 },
        { atSec: 3.6, durSec: 3.5, note: 65, gain: 0.5 },
        { atSec: 3.6, durSec: 3.5, note: 69, gain: 0.5 },
      ],
    },
  },
  directions: [
    {
      id: 'rooted-pads',
      name: 'Rooted pads',
      category: 'pad',
      rows: `
Hearth and floorboards | Rooted pad | leafTone=0.3 balance=0.7 attack=0.4 release=2.5 growth=0.25 rootTone=0.35 series=0.2 reach=2.2 width=0.5 | warm | cellar | Round tones with a clay bass that is there almost at once, plain and even
Bread rising | Rooted pad | leafTone=0.2 balance=0.55 attack=2.4 release=5 growth=1.6 rootTone=0.6 branching=0.9 sway=0.6 width=0.6 decay=24 fit=1 | room | - | A chord that swells for two seconds while clay roots come up under it one by one
Ploughed evening | Rooted pad | leafTone=0.6 balance=0.5 attack=0.9 release=3.5 series=0.45 reach=1.4 meeting=-1 rootTone=0.5 width=1 tolerance=160 decay=12 | drift | suspend | Open tones over short clay roots an octave or so below, the shared ones leaning in
Loam and lamplight | Rooted pad | leafTone=0.12 balance=0.86 attack=0.7 release=6 series=0.1 reach=3.2 floor=40 growth=0.5 rootTone=0.06 decay=5 volume=-1 stagger=0.3 | darkhall | slowtwo | Nearly all bass: dark clay down three octaves under a chord that barely shows
Moss in the gutter | Rooted pad | leafTone=0.85 balance=0.15 attack=0.25 release=1.6 reach=1.1 branching=0.2 rootTone=0.3 sway=0.1 width=0.1 fit=1 | shaded | lines | A bright plain chord whose only root is one soft octave of clay
Flail and floor | Rooted pad | leaf=Reed leafTone=0.35 balance=0.55 attack=0.5 release=2.2 series=0.5 meeting=-1 tolerance=130 branching=0.9 growth=0.2 rootTone=0.5 stagger=0.2 floor=48 | tamed | chorale | Reeds whose roots are drawn towards one pitch, key after key, and stand there firm
Oxen at the gate | Rooted pad | leaf=Reed leafTone=0.15 balance=0.75 attack=0.8 release=4 series=0.3 meeting=-1 tolerance=100 soil=Peat rootTone=0.6 floor=34 width=0.4 growth=0.15 decay=7 stagger=0.12 volume=3 | across | cellar | Muffled reeds over thick peat that gathers under each chord
Parish meadow | Rooted pad | leaf=Reed leafTone=0.55 balance=0.42 attack=0.8 release=3 series=0.66 meeting=-1 tolerance=90 reach=3 branching=1 rootTone=0.65 sway=0.5 decay=18 fit=1 | chorale | chorale | Bright reeds with every division below them gathered on one shared clay root
Rope and timber | Rooted pad | leaf=Reed leafTone=0.25 balance=0.66 attack=0.15 release=0.8 series=0.33 meeting=-1 soil=Stone rootTone=0.25 reach=2.6 width=0.3 sway=0.05 tolerance=110 floor=52 | wood | suspend | Short reeds, quickly gone, over a stone root that the keys hold together
Wool on the scales | Rooted pad | leaf=Reed leafTone=0.1 balance=0.6 attack=3 release=8 series=0.4 meeting=-1 tolerance=180 growth=0.8 rootTone=0.35 sway=0.8 width=0.95 | undertow | tides | Dim reeds that open slowly, their shared roots slow to gather
Dunes after midnight | Breath elders | soil=Sand balance=0.85 leafTone=0.5 attack=0.4 release=3 rootTone=0.4 reach=2.4 growth=0.4 meeting=0.3 width=1 grain=0.15 decay=9 fit=1 stagger=0.25 | wide | - | Breath above streaming sand with only a thread of pitch running under it
Salt on the window | Breath elders | soil=Sand balance=0.55 leafTone=0.5 attack=0.15 release=1.5 rootTone=0.7 reach=1.3 branching=0.3 growth=0.3 sway=0.9 tolerance=16 | thinair | pairs | Breath and hissing sand close below it, restless
Linen in the wind | Breath elders | soil=Clay balance=0.8 leafTone=0.1 attack=0.25 release=2 rootTone=0.5 reach=1.2 meeting=0 growth=0.15 sway=1 width=1 branching=0.2 series=0 decay=8 volume=0 | wind | lines | Breathy tones blown about over one soft clay octave that soon lets go
Cold flour | Breath elders | soil=Chalk balance=0.62 leafTone=0.2 attack=0.6 release=5 rootTone=0.5 growth=0.5 decay=12 series=0.5 meeting=0 volume=-3 | veil | - | Low breath under which chalk bars are struck one after another, softly
Barn door ajar | Breath elders | soil=Sand balance=0.82 leafTone=0.1 attack=0.2 release=1.2 rootTone=0.15 series=0 reach=3 floor=42 meeting=0.8 volume=-4 growth=0.4 width=0.2 stagger=0.15 | board | cellar | Sand roots far below, dull and near, with only a trace of breath on top
Boundary stones | Stone choir | leaf=Sine leafTone=0.3 balance=0.6 attack=0.7 release=4 meeting=0.4 series=0.2 rootTone=0.4 reach=2.4 floor=42 stagger=1.2 | reveal | stand | Plain tones on hard singing stone, an octave and two below
Quarry at first snow | Stone choir | leaf=Sine leafTone=0.6 balance=0.45 attack=0.8 release=7 meeting=-0.3 series=0.5 rootTone=0.55 reach=1.6 width=1 sway=0.8 growth=0.4 tolerance=16 fit=1 floor=56 stagger=0.4 | cathedral | slowtwo | Clear tones over bright stone that shines as it drifts
Slate in the rain | Stone choir | leaf=Sine leafTone=0.15 balance=0.8 attack=0.3 release=1.4 meeting=0.7 series=0 branching=0.2 rootTone=0.2 reach=2 sway=0.1 width=0.5 volume=3.5 growth=0.15 decay=3 | tiled | suspend | A short dull chord on one slate root for each bass it finds
Flint and milk | Stone choir | leaf=Sine leafTone=0.9 balance=0.25 attack=2.5 release=3 meeting=0 rootTone=0.95 growth=1.2 branching=1 reach=2.8 floor=55 volume=-1 stagger=0.6 | swirl | stand | Soft bright tones first, then row on row of hard stone overtones
Milestone | Stone choir | leaf=Sine leafTone=0.05 balance=0.95 attack=0.5 release=10 meeting=1 series=0.3 rootTone=0.7 reach=3.4 floor=40 width=0.2 growth=0.3 decay=30 fit=1 | lowcath | chorale | Only stone, very deep: the bass of the chord with hardly a chord above it
Turf stacks | Peat drone | leaf=Sine balance=0.55 attack=0.5 release=3 series=0.33 reach=2 branching=0.4 meeting=0.4 rootTone=0.5 leafTone=0.45 floor=42 growth=0.2 decay=20 stagger=0.6 | warm | cellar | A mild chord with dark peat thick underneath, close to the ear
Otter water | Peat drone | leaf=Sine balance=0.7 attack=0.3 release=2 series=0.1 reach=1.5 branching=0.6 meeting=-1 rootTone=0.8 leafTone=0.2 floor=60 sway=1 width=0.9 growth=0.15 tolerance=100 decay=12 | currents | - | Peat roots near the keys, leaning on each other and bubbling
Reedbed in fog | Peat drone | leaf=Reed leafTone=0.45 balance=0.5 attack=1.2 release=6 series=0.5 reach=2.6 meeting=0.6 rootTone=0.3 growth=0.4 width=0.8 decay=16 fit=1 | fog | tides | Faint reeds blurred over slow peat that takes its time to come up
Bog oak chest | Peat drone | leaf=Sine leafTone=0.6 balance=0.82 attack=0.15 release=0.9 series=0 reach=2.4 branching=0.1 growth=0.1 meeting=1 rootTone=0.2 width=0 sway=0.3 decay=9 | boxed | suspend | A plain short tone with a thick peat bass that is quick to speak
Nettle tea | Peat drone | leaf=Glass leafTone=0.3 balance=0.45 attack=0.3 release=5 series=0.33 reach=1.8 meeting=0.2 rootTone=0.6 decay=10 growth=0.3 sway=0.6 floor=62 stagger=0.18 | halo | pairs | Rubbed glass thinning out above warm peat that rings for some seconds
Empty chairs | Parents vanish | growth=0.2 attack=0.2 release=1.5 reach=1.6 branching=0.1 rootTone=0.5 sway=0.2 width=0.2 fit=1 floor=68 | bare | pairs | No keys heard, only a round clay tone for each difference between them
Conversation below | Parents vanish | growth=0.15 release=5 attack=0.2 reach=2.4 series=0.4 branching=0.6 rootTone=0.7 soil=Peat sway=0.9 volume=-8 floor=50 decay=20 | farshore | built | Differences alone, in thick peat, moving whenever a key joins
Staircase of two | Parents vanish | soil=Stone growth=0.4 release=3 reach=1 series=0.6 branching=0.6 rootTone=0.35 fit=0.4 width=1 stagger=0.3 decay=16 floor=76 | panned | sixths | Silent keys whose differences sing in stone, not quite fitted to the chord
Hand under the cloth | Parents vanish | soil=Sand growth=0.2 attack=0.25 release=2 reach=1.8 series=0.2 rootTone=0.65 tolerance=200 branching=0.4 volume=6 decay=26 fit=1 floor=48 stagger=0.33 | glimmer | pairs | Only differences, as threads of sand with streams of hiss above them
Nobody at home | Parents vanish | soil=Chalk growth=0.1 attack=0.05 release=8 reach=2.8 series=0.5 branching=1 rootTone=0.5 decay=20 floor=55 sway=0.4 | across | lines | Chalk struck at the differences of the keys while the keys keep quiet
Greenhouse at dawn | Glass canopy | attack=5 leafTone=0.4 balance=0.5 decay=40 release=7 growth=0.5 meeting=0.6 rootTone=0.45 reach=2.4 sway=0.7 floor=52 stagger=0.12 | glow | slowtwo | Softly rubbed glass that fades while its clay roots are still swelling
Window above a yard | Glass canopy | attack=0.6 leafTone=0.2 balance=0.3 decay=20 release=3 soil=Sand series=0.3 rootTone=0.3 reach=1.5 width=0.6 stagger=0.25 fit=1 | harmonic | cellar | Dull glass with a little sand close below, throbbing gently
Melting icicles | Sand under glass | attack=0.3 leafTone=0.7 balance=0.35 soil=Stone rootTone=0.25 reach=1.8 decay=8 release=4 growth=0.15 meeting=-0.3 tolerance=30 | sag | tides | Bright glass with faint stone under it that dies before the glass does
Chandelier store | Sand under glass | attack=2 leafTone=0.6 balance=0.5 soil=Peat rootTone=0.55 reach=3 growth=0.6 release=9 floor=44 meeting=0.8 stagger=0.3 | common | slowtwo | Glass thinning out over a peat bass that arrives late and hums on
Panes | Sand under glass | leafTone=0.5 balance=0.2 soil=Clay rootTone=0.2 reach=1.2 branching=0.1 growth=0.15 release=1.2 sway=0.15 width=1 attack=2 fit=1 floor=56 | chamber | lines | Wide plain glass, nearly rootless, cut off soon after the hand
Lanterns on a wire | Rooted pad | leafTone=0.8 balance=0.22 attack=0.6 release=2.5 reach=2.4 growth=0.3 branching=0.3 meeting=1 rootTone=0.4 floor=38 width=1 volume=-2 decay=14 | ensemble | chorale | A full clear chord, with a soft difference bass that only just carries it
Sunday in the square | Ghost organ | balance=0.4 leafTone=0.6 attack=0.3 release=1.2 reach=2.2 soil=Clay rootTone=0.5 meeting=0.8 sway=0.4 growth=0.4 decay=8 stagger=0.1 | whirl | - | Reeds turning fast, a round clay bass far under them | organ
Orchard rows | Rooted pad | leaf=Reed leafTone=0.5 balance=0.45 attack=0.8 release=4 series=0.1 reach=2 meeting=0.5 soil=Peat rootTone=0.3 sway=0.6 width=0.9 growth=0.2 decay=14 fit=1 floor=62 | tide | sixths | Reeds coming and going over a dim floor of peat
Courtyard voices | Rooted pad | leaf=Breath leafTone=0.6 balance=0.4 attack=0.15 release=1.8 series=0.33 reach=1.9 soil=Stone rootTone=0.5 sway=0.7 width=1 branching=0.8 | ripple | pairs | Air and breath, with a thin octave and twelfth of stone inside it
Lamp oil | Rooted pad | leafTone=0.95 balance=0.5 attack=0.1 release=0.6 series=0.2 reach=2.2 branching=0.4 growth=0.1 sway=0 width=0 rootTone=0.25 soil=Peat pulse=0.15 | valve | lines | A still, bright, narrow tone with a small root of peat pulsing slowly
Roots before frost | Late foundation | leaf=Sine leafTone=0.5 balance=0.6 growth=0.6 stagger=1 meeting=-0.3 series=0.4 branching=1 soil=Clay rootTone=0.4 release=5 volume=-6.5 attack=0.4 floor=48 tolerance=24 fit=1 | hall | stand | The keys send their clay roots down one after the other, a second apart
Ladder through a hatch | Late foundation | leaf=Sine leafTone=0.2 balance=0.8 growth=0.8 stagger=0.2 meeting=0 series=0.2 branching=1 soil=Chalk rootTone=0.5 attack=0.4 decay=14 floor=45 | cistern | stand | Chalk is struck on each octave on the way down, a second to the step
Slow procession down | Late foundation | leaf=Breath leafTone=0.25 balance=0.75 growth=0.6 stagger=0.6 meeting=0.4 series=0.33 soil=Peat rootTone=0.75 attack=0.25 width=0.9 volume=-8 | monks | slowtwo | Breath, then peat that gets deeper for as long as the chord is held
Rain finding the well | Late foundation | leaf=Reed leafTone=0.3 balance=0.4 growth=0.6 stagger=1 meeting=-1 series=0.5 branching=0.8 soil=Sand rootTone=0.35 attack=0.3 tolerance=90 decay=5 fit=1 | stars | stand | Reeds first; far apart in time, sand roots gather onto one
Tree in winter | Late foundation | leaf=Sine leafTone=0.3 balance=0.7 growth=1.6 stagger=0 meeting=0.2 series=0 branching=1 soil=Stone rootTone=0.6 attack=0.8 release=12 width=1 floor=36 | valley | single | Bare octaves of stone, well over a second to reach each one
Chalk hills | Odd undergrowth | leaf=Sine leafTone=0.4 balance=0.6 soil=Chalk rootTone=0.4 meeting=0 growth=0.3 decay=10 attack=0.2 release=4 floor=60 stagger=0.3 fit=1 | brightplate | sixths | Odd divisions struck in chalk under a plain chord
Northern light switch | Odd undergrowth | leaf=Breath leafTone=0.2 balance=0.75 soil=Stone rootTone=0.6 attack=0.5 release=5 stagger=0 growth=0.4 floor=45 width=1 decay=9 tolerance=12 fit=1 meeting=-0.4 | thinair | slowtwo | Breath with odd stone roots, pale and a little foreign to the chord
Ghost acre | Odd undergrowth | leaf=Glass leafTone=0.5 balance=0.55 soil=Sand rootTone=0.5 attack=0.3 release=6 growth=0.25 decay=18 meeting=-1 fit=1 tolerance=100 width=0.9 volume=0.5 stagger=0.2 floor=68 | veil | pairs | Glass over odd roots in sand, drawn together into tune
Weathered fence | Odd undergrowth | leaf=Reed leafTone=0.4 balance=0.45 soil=Clay rootTone=0.45 attack=0.1 release=0.7 growth=0.05 stagger=0 floor=80 sway=0.1 width=0.4 reach=2 decay=7 tolerance=110 | cassette | lines | Short reeds and their odd clay roots, a little crooked
Half a moon | Odd undergrowth | leaf=Sine leafTone=0.7 balance=0.55 soil=Peat rootTone=0.7 attack=1.2 release=8 growth=0.4 meeting=0.5 floor=48 series=0.9 fit=1 stagger=0.5 | section | slowtwo | Pale tones opening slowly above odd roots steeped in peat
`,
    },
    {
      id: 'glass-canopies',
      name: 'Glass canopies',
      category: 'keys',
      rows: `
Breakfast by the lake | Glass canopy | leafTone=0.5 balance=0.35 release=2.5 reach=1.2 branching=0.1 growth=0.12 rootTone=0.25 decay=5 sway=0.2 width=0.3 | bare | - | Clear struck glass with one clay octave under each note, soon gone
Under the pear tree | Glass canopy | leafTone=0.35 balance=0.6 release=4 reach=2.4 branching=0.8 growth=0.5 rootTone=0.5 decay=14 series=0.33 meeting=-1 tolerance=110 floor=76 | room | chorale | Soft glass over a family of clay roots that lean onto each other
Blue tiles | Glass canopy | leafTone=0.45 balance=0.45 release=1 reach=1.8 growth=0.06 rootTone=0.6 decay=3 floor=80 sway=0.05 width=0.35 grain=0.3 | tiled | seeds | Glass cut short, its clay root kept above the low notes and slightly broken
Swimming under leaves | Glass canopy | leafTone=0.15 balance=0.5 release=8 reach=3.4 growth=0.5 rootTone=0.2 decay=30 floor=40 sway=0.9 attack=0.3 | hall | still | Dim glass, and long after each note a clay bass three octaves down
Porcelain stairs | Glass canopy | leafTone=0.65 balance=0.45 release=3 reach=2.6 branching=1 growth=0.22 stagger=0.1 rootTone=0.75 decay=4 series=0.5 meeting=0 | booth | ostinato | Glass with every division stepping down below it in clipped clay
Beach glass | Sand under glass | leafTone=0.4 balance=0.7 release=2 reach=1.3 growth=0.05 rootTone=0.55 decay=7 width=0.5 sway=0.2 | bright | seeds | Rounded glass on a low hiss of sand that rings on a little
Egg timer shelf | Sand under glass | leafTone=0.7 balance=0.75 release=4 reach=2.8 growth=0.9 rootTone=0.6 decay=10 meeting=-1 tolerance=140 series=0.5 | chamber | chorale | Glass above; below it many sand roots run together into a shared thread
Tide behind shutters | Sand under glass | leafTone=0.55 balance=0.4 release=6 reach=2 growth=0.4 rootTone=0.6 decay=22 sway=1 width=1 floor=48 | currents | tides | Glass with hissing sand that comes forward and sinks back by itself
Salt cellar | Sand under glass | leafTone=0.2 balance=0.65 release=0.8 reach=1.6 branching=0.1 growth=0.04 rootTone=0.35 decay=1.4 width=0.3 sway=0 grain=0.6 | booth | hocket | Small dull glass, each note with a pinch of dry sand under it
Footprints filling up | Sand under glass | leafTone=0.6 balance=0.55 release=5 reach=3.4 branching=0.5 growth=0.6 rootTone=0.4 decay=26 floor=40 series=0.2 | repeats | still | Glass first, then slow sand finding its way to the lowest note it can
School bell corridor | Chalk bells | leafTone=0.45 balance=0.75 release=3 reach=1.4 branching=0.3 growth=0.05 stagger=0 rootTone=0.2 decay=6 series=0 floor=90 | slap | ostinato | Glass and chalk struck together, an octave apart
Counting the stairs | Chalk bells | leafTone=0.4 balance=0.7 release=4 reach=3 branching=1 growth=0.4 stagger=0.1 rootTone=0.4 decay=12 series=0 floor=40 width=0.5 | tunnel | lone | Glass, then chalk on each octave below it, the steps clearly told
White quarry | Chalk bells | leafTone=0.7 balance=0.6 release=8 reach=2.2 branching=0.8 growth=0.1 stagger=0.3 rootTone=0.65 decay=30 series=0.66 sway=0.5 width=1 floor=52 | brightplate | pairs | Bright glass, with showers of ringing chalk just after it
Cup and saucer | Chalk bells | leafTone=0.25 balance=0.4 release=0.7 reach=1.6 branching=0 growth=0.02 stagger=0 rootTone=0.6 decay=4 series=0.33 width=0.2 sway=0 | middle | seeds | A small glass tap with one chalk knock ringing under it
Row of dominoes | Chalk bells | leafTone=0.5 balance=0.8 release=2 reach=2.6 branching=0.6 growth=0.06 stagger=0.05 rootTone=0.3 decay=3 series=1 meeting=-0.2 floor=55 tolerance=8 | stone | hocket | Odd divisions falling in short chalk strokes after a glass one
Cloister keys | Glass canopy | soil=Stone leafTone=0.45 balance=0.5 release=3 reach=1.8 branching=0.5 growth=0.3 rootTone=0.3 decay=9 meeting=0.2 width=0.7 | latehall | chorale | Glass strokes with a stone octave singing under them
Frost on the bell rope | Glass canopy | soil=Stone leafTone=0.55 balance=0.7 release=6 reach=2.4 branching=1 growth=0.4 rootTone=0.6 decay=24 series=0.33 meeting=0 sway=0.8 | cathedral | pairs | Glass whose stone roots brighten slowly and go on ringing
Marble counter | Glass canopy | soil=Stone leafTone=0.3 balance=0.62 release=0.9 reach=1.2 branching=0.2 growth=0.05 rootTone=0.5 decay=2 sway=0.1 width=0.4 | forward | hocket | Short glass and hard stone an octave down, both damped by the hand
Stone water clock | Glass canopy | soil=Stone leafTone=0.6 balance=0.75 release=4 reach=2.8 branching=0.7 growth=0.4 rootTone=0.2 decay=12 pulse=0.35 meeting=-0.4 floor=50 volume=2 tolerance=5 | cavern | lone | Struck glass, and stone under it that counts a slow pulse for each root
Statue garden | Glass canopy | soil=Stone leafTone=0.2 balance=0.45 release=7 reach=3.4 branching=0.1 growth=0.5 rootTone=0.6 decay=34 meeting=0.9 floor=40 volume=1.5 | farshore | lone | Muted glass and, late, one low stone tone that stays
Glasshouse stove | Glass canopy | soil=Peat leafTone=0.3 balance=0.6 release=2 reach=1.6 branching=0.2 growth=0.1 rootTone=0.75 decay=6 sway=0.2 width=0.6 stagger=0.4 volume=-8 | glue | - | Glass notes warmed from below by a short thick peat octave
Amber in the bog | Glass canopy | soil=Peat leafTone=0.25 balance=0.7 release=6 reach=2.4 branching=0.8 growth=0.5 rootTone=0.8 decay=20 series=0.4 meeting=-0.9 sway=0.8 volume=-7.5 tolerance=150 | darkwater | chorale | Soft glass sinking into peat whose roots share one slow tone
Marsh lantern | Glass canopy | soil=Peat leafTone=0.45 balance=0.5 release=3 reach=2 branching=0.3 growth=0.25 rootTone=0.3 decay=10 series=0.1 meeting=0.5 width=1 | glimmer | lamp | Glass with a dark patch of peat drifting under the notes
Well cover | Glass canopy | soil=Peat leafTone=0.35 balance=0.82 release=4 reach=3.2 branching=0 growth=0.3 rootTone=0.2 decay=14 meeting=1 floor=40 width=0.3 volume=-4 series=0.66 | pot | lone | A little glass on top of a very deep peat bass
Toad in the teapot | Glass canopy | soil=Peat leafTone=0.6 balance=0.6 release=1.2 reach=1.2 branching=0.5 growth=0.03 rootTone=1 decay=2.5 sway=1 floor=70 | seasick | hocket | Glass plinks with bubbling peat close beneath, all of it short
Two fingers and a bass | Glass canopy | meeting=1 leafTone=0.3 balance=0.7 release=2 reach=2.2 branching=0 growth=0.15 rootTone=0.65 decay=8 floor=40 | warm | pairs | Glass pairs; the difference between them is a clay bass
Third guest | Glass canopy | meeting=0.8 soil=Stone leafTone=0.4 balance=0.65 release=3 reach=1.6 branching=0.4 growth=0.4 rootTone=0.5 decay=12 series=0.4 fit=1 volume=5.5 floor=56 | drift | sixths | Glass, and from each pair of notes a stone tone that joins in between
Balance of the house | Glass canopy | meeting=0.6 soil=Chalk leafTone=0.55 balance=0.75 release=5 reach=2.4 branching=0.7 growth=0.1 rootTone=0.6 decay=16 series=0.6 stagger=0.25 volume=-10 floor=62 | springs | lines | Glass whose differences are struck in chalk a moment after the keys
Green apples | True differences | leaf=Glass leafTone=0.5 balance=0.6 attack=0.1 release=3 reach=1 branching=0.3 rootTone=0.4 decay=8 fit=0 growth=0.1 floor=68 volume=-1 | reel | pairs | Glass over true, unfitted differences, a little sour on the thirds
Sugar glass | True differences | leaf=Glass leafTone=0.65 balance=0.35 attack=0.05 release=2 reach=2 branching=0.6 soil=Sand rootTone=0.35 decay=5 fit=1 series=0.5 growth=0.2 floor=76 | dust | sixths | Brittle glass with differences in fine sand running beneath
Icing on the sill | Glass canopy | leafTone=0.6 balance=0.5 release=1.4 reach=2.4 rootTone=0.3 decay=3 sway=0.1 width=0.9 volume=-1.5 soil=Chalk growth=0.03 floor=60 pulse=0 branching=0.9 series=1 | booth | seeds | Hard little glass notes with crumbs of odd chalk divisions on each
Swallows on the pane | Glass canopy | leafTone=0.4 balance=0.25 release=3 attack=0.2 reach=1.8 rootTone=0.4 decay=8 sway=0.7 width=1 growth=0.12 pulse=0.7 | answer | hocket | Light glass, a small root fluttering far behind it
Snow owl | Glass canopy | leafTone=0.05 balance=0.08 release=6 attack=5 reach=2.4 rootTone=0.3 decay=20 growth=0.5 sway=0.6 volume=1 | space | still | Glass with no edge, nearly a whistle, and a trace of bass
Crown of the tree | Glass canopy | leafTone=0.3 balance=0.5 release=2.2 attack=0.05 reach=1.4 rootTone=0.5 decay=6 meeting=-1 series=0.4 width=0.8 growth=0.2 soil=Stone tolerance=180 floor=48 | octave | - | Soft glass keys, a thin shared stone root holding them
Kitchen in March | Glass canopy | leafTone=0.15 balance=0.05 release=0.5 attack=0.05 reach=1.2 rootTone=0.3 decay=2 sway=0 width=0 growth=0.1 floor=52 | kitchen | ostinato | Short still glass, hardly any root
Felt and ferns | Rooted pad | leaf=Pluck leafTone=0.05 balance=0.4 release=0.9 reach=1.6 growth=0.12 rootTone=0.3 decay=5 meeting=0.3 sway=0.1 floor=56 | felted | - | Plucked strings with the edge taken off, a clay tone rounding each one
Front room piano | Rooted pad | leaf=Pluck leafTone=0.3 balance=0.55 release=0.6 reach=1.2 branching=0.4 growth=0.05 rootTone=0.55 decay=7 series=0.1 width=0.4 | board | chorale | Plucked keys with a full clay octave behind every one
Harmonium practice | Ghost organ | leafTone=0.3 balance=0.3 attack=0.1 release=0.3 reach=1.2 soil=Clay rootTone=0.3 meeting=-1 series=0.2 tolerance=180 | valve | ostinato | Plain reeds under the fingers, a small shared clay root
Electric orchard | Rooted pad | leaf=Sine leafTone=0.6 balance=0.35 attack=0.05 release=0.5 decay=4 reach=1.2 growth=0.02 rootTone=0.8 meeting=0 branching=0.3 sway=0.15 soil=Stone | amptrem | - | Bell-like tones with a quick stone octave, trembling
Pantry clavier | Rooted pad | leaf=Pluck leafTone=0.75 balance=0.65 release=0.5 soil=Stone rootTone=0.3 reach=2 growth=0.04 decay=3 meeting=0.6 floor=44 width=0.4 | tunnel | seeds | Bright plucked keys, each with a stone bass two octaves under it
Glass metronome | Glass canopy | pulse=0.6 leafTone=0.5 balance=0.7 release=3 reach=2 branching=0.6 growth=0.1 rootTone=0.6 decay=10 series=0.33 meeting=0 soil=Clay floor=62 | bare | - | Struck glass over clay roots that pulse quickly, each at its own rate
Shaken tray | Sand under glass | grain=0.8 leafTone=0.25 balance=0.8 release=3 reach=1 growth=0.1 rootTone=0.5 decay=4 soil=Chalk width=1 volume=-7.5 floor=110 | wide | pairs | Glass with chalk pebbles rattling under each note
Beads on a stone floor | Glass canopy | grain=0.6 soil=Stone leafTone=0.4 balance=0.7 release=4 reach=2.4 growth=0.2 rootTone=0.35 decay=12 branching=0.8 | room | lamp | Glass, and below it stone broken half into falling pebbles
Wading birds | Sand under glass | pulse=0.45 leafTone=0.35 balance=0.6 release=4 reach=2.6 growth=0.2 rootTone=0.4 decay=18 soil=Peat floor=60 sway=0.6 | panned | tides | Soft glass and peat that pulses as if something walked in it
Frozen fountain | Glass canopy | grain=0.7 soil=Sand leafTone=0.5 balance=0.6 release=6 reach=1.4 growth=0.3 rootTone=0.6 decay=24 sway=0.4 width=1 volume=3.5 attack=0.4 floor=68 | freeze | lamp | Clear glass over sand and scattered grains
Letters from the coast | Glass canopy | leafTone=0.4 balance=0.65 release=3 reach=2 growth=0.4 rootTone=0.5 decay=12 meeting=0.6 sway=0.4 | darktrail | still | Glass that leaves room after each note, a clay bass rising into it
Greenhouse arithmetic | Glass canopy | leafTone=0.8 balance=0.55 release=0.8 reach=1.4 growth=0.06 rootTone=0.6 decay=3 soil=Chalk meeting=0 series=0.66 branching=0.9 floor=130 | bounce | hocket | Short bright glass with a handful of small chalk ticks below
Window cleaner | Sand under glass | leafTone=0.25 balance=0.6 release=1.5 reach=1.2 growth=0.2 rootTone=0.7 decay=4 soil=Sand width=0.8 meeting=-0.4 tolerance=5 | prism | ostinato | Glass keys and a wipe of sand an octave down
Comet watchers | Glass canopy | leafTone=0.5 balance=0.5 release=5 reach=3.4 growth=0.3 rootTone=0.7 decay=20 soil=Stone floor=40 width=1 volume=-5.5 sway=0.9 | spiralstars | still | Glass left alone, a stone root finding its way down far below
Ferry lights | Sand under glass | leafTone=0.15 balance=0.6 release=4 reach=2.4 growth=0.25 rootTone=0.2 decay=12 soil=Peat meeting=0.7 attack=0.15 sway=1 | recall | - | Dull glass on warm peat, each chord with its own bass
`,
    },
    {
      id: 'plucked-seeds',
      name: 'Plucked seeds',
      category: 'plucked',
      rows: `
Pea pods | Pizzicato seeds | leafTone=0.3 balance=0.35 release=0.4 reach=1.2 branching=0.1 growth=0.03 decay=0.8 rootTone=0.25 sway=0 width=0.1 | bare | seeds | Short plucked notes with a dab of clay an octave below
Acorns on a tin roof | Pizzicato seeds | leafTone=0.6 balance=0.75 release=0.5 reach=1.6 soil=Chalk rootTone=0.5 decay=1.2 growth=0.02 floor=100 width=0.8 volume=0 | chamber | hocket | Hard plucks and a chalk tick with every one
Beans in a jar | Pizzicato seeds | leafTone=0.15 balance=0.6 release=0.6 reach=1.4 grain=0.85 soil=Chalk rootTone=0.4 decay=2 branching=0.7 width=0.5 | pot | seeds | Dull plucks with a rattle of chalk grains below
Threading a needle | Pizzicato seeds | leafTone=0.8 balance=0.35 release=2.4 reach=1.2 branching=0 rootTone=0.6 decay=2 width=0.2 sway=0.05 volume=0.5 soil=Sand growth=0.03 floor=76 | thin | ostinato | Wiry plucked strings, each pulling a thread of sand
Sack of walnuts | Pizzicato seeds | leafTone=0.2 balance=0.75 release=0.8 reach=2.2 branching=0.6 series=0.33 soil=Peat rootTone=0.6 decay=1.6 floor=45 growth=0.05 | skin | walk | Plucks that are mostly a thud of peat an octave and more down
Lute by the stove | Pizzicato seeds | leafTone=0.4 balance=0.45 release=2.5 reach=2 branching=0.4 growth=0.08 decay=6 rootTone=0.4 meeting=-0.6 sway=0.7 volume=-9.5 tolerance=16 series=0.5 | warm | - | Plucked strings with a round clay bass that rings as long as they do
Ladder in the cherries | Pizzicato seeds | leafTone=0.3 balance=0.55 release=3 reach=2.6 branching=0.9 growth=0.3 decay=4 rootTone=0.45 series=0.45 meeting=0 width=0.8 soil=Chalk stagger=0.15 floor=48 | room | - | Each plucked string lets a ladder of chalk steps down
Silver birch | Pizzicato seeds | leafTone=0.7 balance=0.3 release=4 reach=1.6 soil=Sand growth=0.1 decay=5 rootTone=0.5 width=1 sway=0.5 floor=52 | plate | ostinato | Bright strings plucked over a light rush of sand
Old olive | Pizzicato seeds | leafTone=0.1 balance=0.65 release=3 reach=2.4 soil=Stone growth=0.15 decay=10 rootTone=0.3 meeting=0.5 floor=40 width=0.4 | darkhall | walk | Muffled plucks and a low stone bass that stays behind them
Vine on the wall | Pizzicato seeds | leafTone=0.3 balance=0.8 release=2 reach=1.8 soil=Peat growth=0.06 decay=4 rootTone=0.75 meeting=-1 tolerance=90 series=0.4 volume=-11 | chorale | - | Plucked strings on peat roots that gather into one slow tone
Seed in the furrow | Pizzicato seeds | leafTone=0.35 balance=0.6 release=4 reach=2.8 growth=0.45 branching=0.2 decay=12 rootTone=0.4 meeting=0.6 series=0 sway=0.4 volume=-2 | farshore | still | A pluck, a wait, then a deep clay root
Germinating | Pizzicato seeds | leafTone=0.5 balance=0.7 release=5 reach=2.4 growth=0.5 stagger=0.15 branching=1 series=0.5 decay=14 rootTone=0.55 meeting=0 floor=56 | valley | - | Plucks out of which clay roots keep growing after the string has gone
Bulbs in November | Pizzicato seeds | leafTone=0.15 balance=0.7 release=6 reach=3.4 growth=0.5 branching=0.4 soil=Peat decay=20 rootTone=0.5 floor=40 sway=0.7 | cave | still | Soft plucks, then peat that comes up from very far down
Second thoughts | Pizzicato seeds | leafTone=0.4 balance=0.5 release=3 reach=1.4 growth=0.4 branching=0.1 soil=Stone decay=6 rootTone=0.5 meeting=0.2 width=0.7 | double | still | Plucked strings, each followed by the same note in stone an octave lower
Delayed post | Pizzicato seeds | leafTone=0.7 balance=0.55 release=3 reach=2 growth=0.4 stagger=0.7 soil=Chalk branching=0.7 decay=10 rootTone=0.4 meeting=0 floor=60 | latehall | tides | Plucks whose chalk roots are struck late, one key after another
Fountain steps | Pizzicato seeds | leafTone=0.85 balance=0.25 release=5 reach=1.6 branching=0.3 growth=0.1 decay=10 rootTone=0.3 width=1 sway=0.3 attack=0.1 stagger=0.2 soil=Peat floor=62 | hall | built | Wide bright plucked strings left to ring over faint peat
Rain harp | Pizzicato seeds | leafTone=0.75 balance=0.5 release=4 reach=2.4 soil=Stone growth=0.12 decay=8 rootTone=0.4 width=1 meeting=0.4 floor=68 | stars | ostinato | Clear plucks with only a thin line of stone beneath
Curtain of beads | Pizzicato seeds | leafTone=0.7 balance=0.6 release=2.5 reach=1.4 soil=Chalk growth=0.05 decay=3 rootTone=0.5 series=0.66 branching=0.8 width=1 floor=76 grain=0.5 | sparkle | seeds | Glinting plucks with loose grains of chalk hanging from them
Summer staircase | Pizzicato seeds | leafTone=0.4 balance=0.4 release=3.5 reach=2 meeting=1 growth=0.2 decay=8 rootTone=0.45 width=0.9 sway=0.3 | prism | pairs | Plucked pairs and the clay bass that their difference makes
Tall grass | Pizzicato seeds | leafTone=0.65 balance=0.3 release=3 attack=0.4 reach=1.8 soil=Sand growth=0.2 decay=4 rootTone=0.35 width=1 sway=0.8 floor=48 | wind | - | Softened plucks in wide thin sand
Sash window cord | One-finger bass | leaf=Pluck leafTone=0.35 balance=0.8 release=0.6 reach=2.4 growth=0.04 decay=7 rootTone=0.6 meeting=0.5 width=0 volume=-1.5 | bare | finger | A plucked key with a round clay bass two octaves below it | bass
Barrel maker | One-finger bass | leaf=Pluck leafTone=0.2 balance=0.8 release=0.5 reach=1.6 soil=Stone growth=0.03 decay=1.2 rootTone=0.5 meeting=0.2 floor=50 width=0 | wood | stride | Plucked stone notes, low and knocking, damped at once | bass
Rope bridge | One-finger bass | leaf=Pluck leafTone=0.6 balance=0.7 release=1.5 reach=2.4 soil=Peat growth=0.05 decay=5 rootTone=0.7 meeting=0 branching=0.3 width=0.4 sway=0.4 volume=-4 | iron | lowline | A plucked string with loose thick peat swinging under it | bass
Weight on a string | One-finger bass | leaf=Pluck leafTone=0.5 balance=0.75 release=0.9 reach=3 soil=Clay growth=0.04 decay=6 rootTone=0.3 meeting=1 floor=40 volume=-7 | limiter | offbeat | A short pluck high up, its clay root falling straight to the floor | bass
Cart on cobbles | One-finger bass | leaf=Pluck leafTone=0.3 balance=0.65 release=0.7 reach=1.2 soil=Chalk growth=0.02 decay=1 rootTone=0.5 series=0.33 branching=0.5 meeting=0 floor=60 width=0.5 | tiled | stride | Low plucks with chalk knocking an octave under them | bass
Grasshopper | Pizzicato seeds | leafTone=0.7 balance=0.75 release=0.5 reach=1.9 soil=Sand growth=0.02 decay=0.9 rootTone=0.55 series=0.33 width=0.6 sway=0.1 grain=0.2 volume=3 | slap | hocket | Dry plucks with a scratch of bright sand close below
Odd socks | Pizzicato seeds | leafTone=0.45 balance=0.6 release=1.5 reach=2.8 series=1 branching=0.9 growth=0.1 decay=4 rootTone=0.4 meeting=0 soil=Clay floor=50 | combo | seeds | Plucks with odd divisions under them in clay, slightly out of step with the key
Leaning orchard | Pizzicato seeds | leafTone=0.5 balance=0.65 release=2.5 reach=2.4 series=0.95 branching=0.7 soil=Stone growth=0.2 decay=8 rootTone=0.6 meeting=-0.3 tolerance=40 fit=0.5 floor=52 | springs | - | Plucked strings over odd stone roots left a little out of tune
Thistle | Pizzicato seeds | leafTone=0.6 balance=0.5 release=1 reach=2.8 series=0.66 branching=1 soil=Chalk growth=0.15 stagger=0.08 decay=2 rootTone=0.7 width=0.9 floor=56 | crystals | ostinato | Prickly plucks with a spray of chalk on every division
Magpie's drawer | Pizzicato seeds | leafTone=0.6 balance=0.75 release=2 reach=2 series=0.8 branching=1 grain=0.7 soil=Chalk decay=6 rootTone=0.65 width=1 floor=62 | glimmerup | seeds | Plucks that spill bright chalk pebbles of every size
Spoons on the table | Pizzicato seeds | leaf=Sine leafTone=0.15 attack=0.05 balance=0.8 release=0.4 reach=2.4 growth=0.02 decay=0.7 rootTone=0.7 soil=Stone sway=0 width=0.2 pulse=0 volume=1.5 | board | hocket | Round short tones tapped out over hard stone
Thumb and gourd | Pizzicato seeds | leafTone=0.12 balance=0.7 release=1 reach=1.4 growth=0.03 decay=1.6 rootTone=0.65 soil=Clay branching=0.3 width=0.3 | buzz | ostinato | Dull plucked tongues and a warm clay octave
Bamboo fence | Pizzicato seeds | leafTone=0.35 balance=0.7 release=0.6 reach=1.8 soil=Chalk growth=0.03 decay=0.9 rootTone=0.25 series=0 floor=70 sway=0.1 | pipe | seeds | Hollow knocks: a pluck, and dull chalk an octave down
Saddle bag | Pizzicato seeds | leafTone=0.05 balance=0.8 release=0.5 reach=1.2 soil=Peat growth=0.06 decay=1 rootTone=0.3 width=0 sway=0.2 volume=-4 floor=68 | blanket | - | The softest pluck, over a short soft thump of peat
Slate marimba | Pizzicato seeds | leaf=Sine leafTone=0.3 attack=0.05 balance=0.7 release=1.2 reach=1.6 soil=Stone growth=0.02 decay=3 rootTone=0.3 branching=0.2 meeting=0 volume=2 | chamber | ostinato | Clean short tones and stone bars sounding an octave below
Four friends in a boat | Pizzicato seeds | leafTone=0.45 balance=0.7 release=2 reach=2.6 meeting=-1 tolerance=130 series=0.5 branching=0.8 growth=0.15 decay=6 rootTone=0.5 | glue | chorale | Plucked chords whose clay roots are all drawn onto one shared bass
Tug of war | Pizzicato seeds | leafTone=0.55 balance=0.75 release=3 reach=2 meeting=-1 tolerance=90 series=0.4 branching=0.6 soil=Stone growth=0.1 decay=8 rootTone=0.45 volume=1 floor=76 | across | sixths | Plucked sixths and stone roots that pull at each other, then agree
Market scales | Pizzicato seeds | leafTone=0.3 balance=0.8 release=1.8 reach=2.2 meeting=0.9 fit=1 branching=0.5 soil=Clay growth=0.06 decay=4 rootTone=0.7 floor=38 | thump | pairs | Plucked pairs weighed by a strong clay bass that is their difference
Sparrow bath | Pizzicato seeds | leafTone=0.8 balance=0.6 release=1.2 reach=1 meeting=0.7 fit=1 soil=Sand growth=0.08 decay=2 rootTone=0.6 series=0.5 branching=0.6 floor=48 | rain | hocket | Light plucks and the differences between them as splashes of sand
Two wells | Pizzicato seeds | leafTone=0.25 balance=0.65 release=4 reach=3 meeting=0.4 branching=0.3 soil=Peat growth=0.15 decay=12 rootTone=0.4 floor=42 | slack | call | Plucks high and low, each with a slow peat bass of its own
Sewing circle | Pizzicato seeds | pulse=0.6 leafTone=0.6 balance=0.65 release=1.6 reach=1.6 soil=Clay decay=5 rootTone=0.8 branching=0.5 series=0.33 meeting=0 floor=52 | middle | - | Plucked notes whose clay roots go on pulsing like quick stitches
Water wheel | Pizzicato seeds | pulse=0.5 leafTone=0.5 balance=0.6 release=3 reach=2 soil=Sand decay=10 rootTone=0.5 branching=0.6 growth=0.1 width=0.9 floor=56 | panned | - | Plucks that set wheels of sand turning at different rates
Cooper's yard | Pizzicato seeds | pulse=0.35 leafTone=0.3 balance=0.75 release=2 reach=2.4 soil=Chalk decay=20 rootTone=0.4 branching=0.8 growth=0.05 meeting=0 floor=55 | tunnel | tides | Plucked notes, then chalk that knocks on in a slow pulse
Fireflies answer | Pizzicato seeds | pulse=0.85 leafTone=0.65 balance=0.5 release=2.5 reach=1.2 soil=Stone decay=6 rootTone=0.35 branching=0.3 series=0.1 sway=0.4 | veil | lamp | Plucks followed by a fast flicker of stone
Donkey path | Pizzicato seeds | pulse=0.2 leafTone=0.2 balance=0.7 release=3 reach=2.6 soil=Peat decay=14 rootTone=0.6 branching=0.4 floor=42 meeting=-0.5 growth=0.12 tolerance=30 | half | walk | Dull plucks above peat that steps along slowly in a pulse
Boats of newspaper | Pizzicato seeds | leafTone=0.2 balance=0.6 release=2.5 reach=1.6 growth=0.04 decay=2.5 rootTone=0.5 meeting=0.2 sway=0.8 width=0.9 soil=Sand floor=62 | murky | seeds | Plain soft plucks with a small damp root of sand
Skimming flat stones | Pizzicato seeds | leafTone=0.3 balance=0.7 release=0.8 reach=2.4 growth=0.04 decay=4 soil=Stone rootTone=0.7 branching=0.2 width=0.5 volume=0.5 | stone | lamp | Short plucks with hard stone under them
Attic banjo | Pizzicato seeds | leafTone=0.8 balance=0.65 release=0.7 reach=1.2 growth=0.03 decay=1 soil=Peat rootTone=0.5 width=0.3 sway=0.1 floor=68 | record | ostinato | Twanging plucks with a short dab of peat
Looking for keys | Pizzicato seeds | leafTone=0.4 balance=0.5 release=1.5 reach=2 growth=0.2 decay=4 soil=Chalk rootTone=0.35 stagger=0.2 series=0.33 meeting=0 floor=76 | gatelow | seeds | Plucks with chalk strokes dropping after them
Homeward scooter | Pizzicato seeds | leafTone=0.7 balance=0.8 release=0.5 reach=1.6 growth=0.02 decay=1 soil=Clay rootTone=0.9 width=0.4 meeting=0.5 floor=60 volume=2 | sampler | hocket | Tight plucks and a bright buzzing clay octave
`,
    },
    {
      id: 'one-finger-basses',
      name: 'One-finger basses',
      category: 'bass',
      rows: `
Under the stairwell | One-finger bass | leafTone=0.05 balance=0.95 release=0.4 reach=2 rootTone=0.04 decay=30 meeting=1 sway=0 volume=-4 width=0 | bare | finger | A plain deep tone two octaves under the key, almost a pure sine
Oak keel | One-finger bass | leafTone=0.1 balance=0.8 release=0.8 attack=0.12 reach=2.6 rootTone=0.75 growth=0.15 decay=22 meeting=0.4 floor=42 sway=0.1 volume=-11 | deep | lowline | A steady low clay tone with its overtones showing, the key only a shade on top
Submarine nap | One-finger bass | leafTone=0.3 balance=0.9 attack=0.3 release=2 reach=3.4 rootTone=0.08 growth=0.2 floor=40 decay=40 sway=0.4 series=0.66 volume=-4.5 | below | lone | A dark swell of clay as low as it will go
Anchor rope | One-finger bass | leafTone=0.2 balance=0.85 release=0.3 reach=1.6 rootTone=0.6 growth=0.03 decay=2.5 meeting=0 floor=50 width=0 sway=0.05 | glue | stride | A firm short bass in clay, an octave under each key
Doorstep | One-finger bass | leafTone=0.15 balance=0.7 release=0.5 reach=1.2 rootTone=0.1 decay=5 meeting=-0.3 branching=0.2 floor=45 width=0.25 volume=-4.5 tolerance=40 | warm | skank | Key and clay octave as one round note
Tractor idling | One-finger bass | leaf=Reed leafTone=0.3 balance=0.7 release=0.5 reach=2 rootTone=0.8 decay=20 growth=0.05 meeting=0.5 sway=0.3 volume=-7 floor=45 pulse=0.5 | valve | lowline | A dim reed over a full clay bass that chugs in pulses
Bass clarinet case | One-finger bass | leaf=Reed leafTone=0.1 balance=0.65 attack=0.2 release=0.6 reach=2 rootTone=0.4 decay=40 branching=0.1 meeting=0 soil=Peat sway=0.35 volume=-3.5 growth=0.06 | room | finger | A hollow soft reed with a peat bass joined to it
Barge answering back | One-finger bass | leaf=Reed leafTone=0.2 balance=0.8 attack=0.3 release=1.5 reach=2.4 rootTone=0.8 soil=Stone growth=0.2 floor=42 decay=40 width=0.4 volume=-6.5 | farshore | deeps | A reed and a hard stone bass, broad and slow to open
Goose on the canal | One-finger bass | leaf=Reed leafTone=0.8 balance=0.55 release=0.35 reach=1.6 rootTone=0.5 soil=Peat decay=8 growth=0.04 width=0.3 volume=-8.5 | forward | skank | A nasal reed with thick peat right below it
Zip of the tent | One-finger bass | leaf=Reed leafTone=0.45 balance=0.75 attack=0.05 release=0.25 reach=2 rootTone=0.75 decay=1.5 growth=0.02 floor=55 sway=0 | bare | walk | Very short: a bright reed with a buzzing clay bass snapped off
Millrace floor | One-finger bass | soil=Stone balance=0.85 rootTone=0.35 release=0.7 reach=2 decay=10 growth=0.05 meeting=0.6 leafTone=0.2 width=0.3 volume=-5.5 | console | finger | A lean stone bass with a hard edge of overtones
Crypt door | One-finger bass | soil=Stone balance=0.95 rootTone=0.06 attack=0.3 release=2.5 reach=3 decay=40 growth=0.06 floor=44 meeting=1 sway=0.5 volume=-6 series=0.66 | cave | finger | Dark stone as low as it will go, slow to open and slow to close
Granite counter | One-finger bass | soil=Stone balance=0.75 rootTone=0.6 release=0.4 reach=1.2 decay=3 growth=0.02 branching=0.2 meeting=0 floor=48 width=0.5 | chamber | stride | Short bright stone an octave under the hand
Bridge pier | One-finger bass | soil=Stone balance=0.8 rootTone=0.5 release=1.2 reach=2.6 decay=40 growth=0.1 meeting=-1 branching=0.5 series=0.33 tolerance=120 floor=42 volume=-5.5 width=0.3 | stack | pedal | Stone roots of every note standing on one shared pitch
Tuning a cathedral | One-finger bass | soil=Stone leaf=Sine leafTone=0.35 balance=0.55 rootTone=0.35 attack=0.6 release=4 reach=2.6 decay=40 growth=0.3 meeting=0.3 width=0.7 sway=0.6 volume=-5.5 | swirl | meadow | Plain tones and the stone below them turning slowly
Sleeping bull | One-finger bass | soil=Peat balance=0.9 rootTone=0.3 attack=0.2 release=1 reach=2 decay=14 meeting=0.7 growth=0.06 sway=0.7 volume=-9.5 floor=48 | warm | finger | Thick dark peat that shifts a little while it is held
Wet rope | One-finger bass | soil=Peat balance=0.8 rootTone=0.7 release=0.6 reach=1.4 decay=4 growth=0.04 meeting=0 floor=50 width=0.2 sway=1 volume=-5.5 | skin | skank | Peat close under the key, short and bubbling
Rainwater tank | One-finger bass | soil=Peat balance=0.95 rootTone=0.5 attack=0.4 release=3 reach=2.8 decay=26 growth=0.1 branching=0.4 floor=44 meeting=0.3 volume=-8 | cistern | pedal | A slow broad peat bass rising under long keys
Molasses | One-finger bass | soil=Peat leaf=Breath leafTone=0.2 balance=0.7 rootTone=0.4 attack=0.05 release=1.5 reach=1.8 decay=8 growth=0.06 meeting=0.5 width=0.4 volume=-7 floor=45 | shaded | lowline | A breath on the front of each note, then slow thick peat
Old sofa | One-finger bass | soil=Peat leaf=Pluck leafTone=0.1 balance=0.78 rootTone=0.2 release=0.8 reach=2 decay=6 growth=0.05 meeting=0 branching=0.1 sway=0.1 floor=42 volume=-6.5 width=0 | blanket | stride | A muffled pluck sinking into soft peat
Desert engine | One-finger bass | soil=Sand balance=0.9 rootTone=0.35 release=0.8 reach=2 decay=20 growth=0.06 meeting=0.4 width=0.8 sway=0.5 | wide | finger | A low thread of pitch with sand streaming round it
Ballast sacks | One-finger bass | soil=Sand balance=0.8 rootTone=0.6 release=0.4 reach=1.6 decay=3 growth=0.03 meeting=0 floor=45 width=0 leafTone=0.2 volume=-4.5 | limiter | stride | Short sandy thuds under a plain tone
Breathing hull | One-finger bass | leaf=Breath leafTone=0.25 balance=0.6 attack=0.1 release=1.5 soil=Clay rootTone=0.3 reach=2.2 decay=40 growth=0.1 meeting=0.8 sway=0.8 volume=-9.5 | lungs | deeps | Breath above a clay bass that comes in with it
Gutter wind | One-finger bass | leaf=Breath leafTone=0.4 balance=0.75 attack=0.06 release=1 soil=Sand rootTone=0.4 reach=2.8 decay=40 growth=0.15 floor=44 width=0.9 sway=0.9 volume=-7 | wind | lowline | Breath and sand with a very low thread below
Coal chute | One-finger bass | soil=Sand balance=0.95 rootTone=0.4 release=1.5 reach=2.4 grain=0.6 decay=10 growth=0.04 meeting=0.2 floor=38 width=0.6 | tunnel | offbeat | Bass broken into tumbling grains of sand
Night bus | One-finger bass | pulse=0.75 balance=0.9 rootTone=0.5 release=0.8 reach=2 decay=40 meeting=0 growth=0.04 branching=0.2 floor=44 | warm | pedal | A clay bass that pulses steadily while the key is down
Stamp mill | One-finger bass | pulse=0.8 soil=Chalk balance=0.95 rootTone=0.4 release=0.5 reach=1.6 decay=40 meeting=0 growth=0.02 branching=0.4 floor=50 volume=-8.5 | forward | upland | Quick pulses of chalk knocking under the key
Pumping house | One-finger bass | pulse=0.4 soil=Peat balance=0.9 rootTone=0.7 release=1.5 reach=2.4 decay=40 meeting=0.5 growth=0.1 floor=44 sway=0.5 | iron | deeps | Slow heavy pulses of peat, each swelling and letting go
Paddle boat at rest | One-finger bass | pulse=0.5 soil=Sand balance=0.85 rootTone=0.5 release=1.2 reach=2.2 decay=40 meeting=0 branching=0.5 series=0.33 width=0.9 leafTone=0.4 volume=-2.5 floor=52 | panned | pedal | Sand that beats in two rates at once beneath a plain key
Heart of the tree | One-finger bass | pulse=0.25 soil=Clay balance=0.95 rootTone=0.08 attack=0.2 release=2.5 reach=3 decay=40 meeting=0.8 growth=0.08 floor=40 series=0.66 | boxed | finger | One very low clay pulse at a time, more felt than counted
Third finger free | One-finger bass | meeting=1 balance=0.6 release=0.8 reach=2.6 branching=0 rootTone=0.5 decay=20 fit=1 growth=0.06 leafTone=0.6 soil=Peat | bare | pairs | Play two high keys: their difference is a thick peat bass
Argument in thirds | True differences | balance=0.7 attack=0.1 release=1 fit=0 reach=2.4 branching=0.2 soil=Clay rootTone=0.7 growth=0.05 leafTone=0.3 width=0.4 decay=30 floor=56 | combo | sixths | Pairs of keys with true differences in clay, left unfitted
Bass from the choir | Parents vanish | soil=Peat balance=0.9 attack=0.1 release=2 reach=2 branching=0 rootTone=0.4 growth=0.1 floor=44 width=0.3 volume=-10 | monks | chorale | One deep peat tone, the difference that bears the chord best
Iron under silk | Parents vanish | soil=Stone balance=0.75 leafTone=0.6 attack=0.2 release=1.2 reach=2.8 branching=0.2 rootTone=0.3 growth=0.1 floor=45 | ensemble | pairs | Soft high pairs over a lean stone bass made of their differences
Crossbeam | Parents vanish | soil=Chalk leaf=Reed leafTone=0.1 balance=0.8 attack=0.1 release=0.5 reach=2 branching=0.1 rootTone=0.6 growth=0.04 floor=36 width=0 decay=8 | console | organum | Quiet reeds whose differences are a chalk bass, struck with every chord
Bass arrives by boat | One-finger bass | growth=0.6 balance=0.85 attack=0.1 release=3 reach=2 rootTone=0.4 decay=40 meeting=0.5 leafTone=0.4 width=0.4 volume=-1.5 | hall | still | The key alone at first, then over a second and more its clay bass
Lift going down | One-finger bass | growth=0.35 branching=1 balance=0.9 release=2 reach=3.2 rootTone=0.5 decay=20 meeting=0 floor=40 series=0 leafTone=0.3 volume=-4.5 | tunnel | still | One clay octave after another, down to the lowest floor
Roots in gravel | One-finger bass | growth=0.15 branching=0.6 grain=0.4 soil=Chalk balance=0.9 release=2 reach=2.6 rootTone=0.5 decay=20 meeting=0 floor=40 volume=-5 width=0.7 sway=0.9 | across | finger | Chalk and gravel working their way down below one key
Snowmelt sump | One-finger bass | growth=0.1 soil=Peat balance=0.8 leaf=Glass leafTone=0.4 release=4 reach=2.4 rootTone=0.6 decay=30 meeting=0.6 sway=0.8 floor=44 volume=-15 | darkwater | lowline | A dull glass stroke, peat filling up slowly under it
Dumb waiter | One-finger bass | growth=0.08 soil=Sand balance=0.75 leaf=Reed leafTone=0.2 attack=0.1 release=0.8 reach=2 rootTone=0.6 stagger=0 decay=20 branching=0.3 meeting=-0.4 volume=-3.5 tolerance=16 | valve | walk | Small reeds; a sand bass follows each note a moment behind
Contrabass shed | Rooted pad | leaf=Reed leafTone=0.05 balance=0.6 attack=0.5 release=0.8 reach=1 floor=28 branching=0.1 rootTone=0.6 soil=Stone sway=0.7 width=0.2 growth=0.12 | board | deeps | Low dim reeds with their stone octave just under, as if bowed
Tidal mud | Peat drone | balance=0.8 attack=0.2 release=2 reach=1.4 floor=40 branching=0.3 rootTone=0.6 meeting=-0.5 width=0.4 growth=0.12 tolerance=30 | undertow | deeps | Low keys and lower peat, moving like something half asleep
Hull on sand | Rooted pad | leaf=Pluck leafTone=0.2 balance=0.7 release=0.7 reach=1.2 floor=30 soil=Sand rootTone=0.6 decay=3 width=0.3 growth=0.05 | bare | lowline | Low plucked strings on a scrape of sand
Coal lighter | Rooted pad | leaf=Sine leafTone=0.5 balance=0.6 attack=0.1 release=0.6 reach=1 floor=40 soil=Stone rootTone=0.5 width=0.2 growth=0.1 meeting=-0.5 pulse=0.55 tolerance=20 | stack | deeps | Low tones braced by stone that pulses under them
Giants walking home | Rooted pad | leaf=Glass leafTone=0.2 balance=0.6 release=3 reach=1.2 floor=40 soil=Chalk rootTone=0.35 decay=14 series=0 meeting=0 growth=0.1 | valley | deeps | Low rubbed glass and a chalk octave struck below
Fuse board | One-finger bass | leafTone=0.6 balance=0.8 release=0.3 reach=1.6 rootTone=0.95 decay=3 growth=0.02 soil=Clay meeting=0 floor=50 width=0 volume=-4 | grit | skank | A tight bright clay bass
Garage in winter | One-finger bass | leaf=Reed leafTone=0.3 balance=0.8 release=0.6 reach=2 rootTone=0.6 decay=10 soil=Stone growth=0.04 floor=40 width=0.3 volume=-5.5 | combo | walk | A reed and stone bass with a hard middle
Tin bath | One-finger bass | leaf=Pluck leafTone=0.5 balance=0.7 release=0.8 reach=1.6 rootTone=0.5 decay=4 soil=Sand growth=0.03 width=0.5 volume=-2.5 | springs | skank | A bright pluck and a gritty bass of sand
Lazy tune | One-finger bass | leafTone=0.5 balance=0.85 attack=0.2 release=1.2 reach=2 rootTone=0.7 decay=40 soil=Peat meeting=0.8 growth=0.08 sway=0.2 volume=-6.5 | latevib | finger | A singing peat bass under one finger
Tape splice bass | One-finger bass | leafTone=0.15 balance=0.75 release=0.5 reach=1.6 rootTone=0.6 decay=5 soil=Stone meeting=0.4 growth=0.03 floor=36 leaf=Reed width=0 volume=-6 | thump | stride | A dim reed and round stone notes pushed hard
`,
    },
    {
      id: 'chalk-bells',
      name: 'Chalk bells',
      category: 'bell',
      rows: `
Wedding across the field | Chalk bells | leaf=Sine leafTone=0.3 balance=0.8 release=6 reach=2.4 growth=0.2 stagger=0 rootTone=0.45 decay=24 series=0.5 branching=1 meeting=-0.2 tolerance=24 | across | - | A chalk peal under every key, each division a bell of its own
Bell ringers' supper | Chalk bells | leaf=Sine leafTone=0.5 balance=0.7 release=4 reach=1.9 growth=0.08 stagger=0.2 rootTone=0.6 decay=16 series=0.33 branching=0.7 width=0.6 floor=62 | glue | peal | Bright chalk on halves and thirds, tumbling out close together
Ice on the tower | Chalk bells | leaf=Glass leafTone=0.55 balance=0.75 release=9 reach=2 growth=0.12 rootTone=0.6 decay=36 series=0.66 sway=0.5 volume=-6.5 floor=68 | cathedral | high | High clear chalk and glass, ringing long
Midnight in the valley | Chalk bells | leaf=Sine leafTone=0.2 balance=0.95 release=8 reach=3.4 growth=0.5 stagger=0 rootTone=0.4 decay=9 series=0 branching=1 floor=40 | valley | lone | Bare octaves of chalk struck downward, half a second apart
Crooked steeple | Odd undergrowth | soil=Chalk leaf=Sine leafTone=0.4 balance=0.85 attack=0.1 release=5 reach=2.8 growth=0.14 stagger=0.1 rootTone=0.6 decay=20 meeting=0 floor=55 fit=1 | latehall | peal | Odd divisions pealing in chalk, none of them an octave
Thimble bells | Chalk bells | leafTone=0.35 balance=0.4 release=2 reach=1 branching=0 growth=0.02 stagger=0 rootTone=0.5 decay=7 series=0 floor=150 width=0.5 | bare | high | Tiny glass bells with one chalk octave
Sugar bowl lid | Chalk bells | leafTone=0.55 balance=0.6 release=1 reach=1.4 branching=0.4 growth=0.03 stagger=0 rootTone=0.55 decay=1.6 series=0.33 floor=100 sway=0 volume=-4 | chamber | hocket | Glass and chalk, damped almost at once
Snow in the streetlamp | Chalk bells | leafTone=0.4 balance=0.5 release=5 reach=1.6 branching=0.9 growth=0.3 stagger=0.15 rootTone=0.3 decay=12 series=0.66 width=1 sway=0.6 floor=76 | crystals | lamp | Soft glass with small chalk flakes coming down after it
Dressing table | Glass canopy | soil=Chalk leafTone=0.15 balance=0.55 release=3 reach=1.2 branching=0.2 growth=0.12 rootTone=0.6 decay=8 meeting=0.3 width=0.7 fit=1 floor=48 stagger=0.33 | chamber | - | Soft glass bells, a light chalk stroke inside each
Pond in January | Glass canopy | soil=Chalk leafTone=0.25 balance=0.65 release=7 reach=2.6 branching=0.5 growth=0.45 rootTone=0.45 decay=26 meeting=0 series=0.33 volume=6 | freeze | lamp | Dim glass, with chalk cracking slowly downward beneath it
Wooden gate in the wind | Chalk bells | leaf=Sine leafTone=0.1 balance=0.95 release=0.8 reach=2.2 branching=0.6 growth=0.04 stagger=0 rootTone=0.1 decay=1.5 series=0 width=0.1 sway=0.1 | wood | hocket | Dull chalk knocks an octave or two below the keys, quickly stopped | texture
Corks in a drawer | Chalk bells | leaf=Sine leafTone=0.05 balance=0.85 release=0.5 reach=1.2 branching=0 growth=0.02 stagger=0 rootTone=0.2 decay=0.8 series=0.33 floor=80 volume=3.5 width=0.1 | pot | ostinato | Short round chalk taps with hardly a ring | plucked
Roof beams settling | Chalk bells | leaf=Breath leafTone=0.3 balance=0.9 attack=0.1 release=2 reach=3 branching=0.8 growth=0.3 stagger=0.4 rootTone=0.15 decay=3 series=0.66 floor=42 | boxed | tides | Dry chalk creaks and knocks, one after another | texture
Tubular morning | Chalk bells | leaf=Sine leafTone=0.6 balance=0.7 release=5 reach=1.2 branching=0.4 growth=0.02 stagger=0 rootTone=0.35 decay=14 series=0 meeting=0 width=0.6 | hall | chorale | Long even bells: a clear tone with chalk struck on its octave
Mortar and pestle | Chalk bells | leaf=Pluck leafTone=0.1 balance=0.8 release=0.6 reach=1.6 branching=0.5 growth=0.05 stagger=0.06 rootTone=0.3 decay=1.2 series=0.5 floor=60 | skin | ostinato | Dull plucks and blunt chalk ground together | plucked
Singing boulder | Glass canopy | soil=Stone leafTone=0.2 balance=0.8 release=8 reach=2 branching=0.4 growth=0.1 rootTone=0.5 decay=30 meeting=-0.3 sway=0.6 volume=3 tolerance=8 floor=52 | cavern | lone | A stone bell that keeps singing after the stroke
Lithophone in the rain | Glass canopy | soil=Stone leaf=Pluck leafTone=0.3 balance=0.7 release=1.5 reach=1.2 branching=0.2 growth=0.02 rootTone=0.4 decay=3 meeting=0 width=0.6 floor=56 | rain | peal | Plucked strokes on ringing stone bars
Shrine step | Glass canopy | soil=Stone leafTone=0.5 balance=0.6 release=5 reach=3 branching=0.3 growth=0.3 rootTone=0.25 decay=20 meeting=0.8 floor=45 fit=1 | bowls | lamp | Glass strokes and a low stone tone under each
Quartz | Glass canopy | soil=Stone leafTone=0.65 balance=0.6 release=4 reach=2.6 branching=0.8 growth=0.1 rootTone=0.65 decay=10 series=0.5 meeting=0 width=1 floor=62 stagger=0.12 | glimmerup | pairs | Glass on bright stone, every division shining
Milk churn | Glass canopy | soil=Stone leaf=Sine leafTone=0.15 attack=0.05 balance=0.75 release=2 reach=2.4 branching=0.5 growth=0.12 rootTone=0.4 decay=12 meeting=0.2 width=0.3 | cistern | ostinato | Round strokes with two stone octaves ringing out of them
Hail on the bell | Chalk bells | grain=0.6 leafTone=0.4 balance=0.8 release=4 reach=1.8 growth=0.05 stagger=0 rootTone=0.5 decay=14 branching=0.8 floor=68 | brightplate | peal | Chalk bells pelted with their own broken pebbles
Broken string of pearls | Chalk bells | grain=0.8 leafTone=0.55 balance=0.5 release=5 reach=2.4 growth=0.1 rootTone=0.5 decay=20 series=0.66 width=1 volume=-7 floor=76 | stars | high | Glass, then a spill of chalk pebbles bouncing off
Gravel in the font | Chalk bells | grain=0.4 leaf=Sine leafTone=0.3 balance=0.9 release=6 reach=2.6 growth=0.3 stagger=0.2 rootTone=0.4 decay=24 series=0.33 floor=45 volume=-9 | darkhall | lone | Low chalk strokes trailing gravel behind them
Rice in a glass | Sand under glass | grain=0.8 leafTone=0.35 balance=0.9 release=1.2 reach=1.2 growth=0.03 rootTone=0.45 decay=2 width=0.5 sway=0.1 floor=120 fit=1 volume=3 | booth | hocket | Glass taps and a scatter of fine grains of sand
Coins down a well | Chalk bells | grain=0.25 leafTone=0.5 balance=0.8 release=4 reach=3.4 branching=1 growth=0.35 stagger=0.3 rootTone=0.8 decay=16 series=1 floor=50 | tunnel | pairs | Odd chalk divisions dropping deep, some as scattered grains
Clockmaker's wall | Chalk bells | pulse=0.55 leaf=Sine leafTone=0.3 balance=0.9 release=2 reach=1.8 branching=0.8 growth=0.04 stagger=0 rootTone=0.5 decay=20 series=0.33 volume=-6 floor=48 | panned | chorale | Chalk ticking: every division beats at a rate of its own
Crossing bell | Chalk bells | pulse=0.75 leafTone=0.25 balance=0.8 release=2 reach=1.2 branching=0.3 growth=0.02 stagger=0 rootTone=0.55 decay=30 series=0 meeting=0 width=0.4 floor=52 | kitchen | pairs | Two quick pulses of chalk that go in and out of step
Temple drip | Chalk bells | pulse=0.3 leafTone=0.6 balance=0.75 release=6 reach=2.4 branching=0.4 growth=0.1 stagger=0.3 rootTone=0.4 decay=24 series=0.33 width=1 volume=-7 | cave | lamp | Glass, then chalk dripping in slow pulses far back
Knitting by the fire | Glass canopy | pulse=0.9 soil=Chalk leafTone=0.2 balance=0.7 release=1 reach=1.6 branching=0.5 growth=0.03 rootTone=0.3 decay=12 meeting=0 series=0.5 floor=56 volume=-8 | warm | - | Soft glass and a quick dry patter of chalk pulses | keys
Chain over the bow | Chalk bells | pulse=0.42 leaf=Reed leafTone=0.2 balance=0.85 attack=0.1 release=3 reach=2.8 branching=0.6 growth=0.1 stagger=0.5 rootTone=0.6 decay=40 series=0.66 floor=50 | farshore | tides | Chalk links turning over in pulses under a thin reed
Cow bells at milking | Glass canopy | soil=Clay leafTone=0.3 balance=0.7 release=2 reach=1.9 branching=0.3 growth=0.03 rootTone=0.65 decay=3 meeting=0 width=0.8 series=0.66 volume=0.5 | hollow | peal | Short glass strokes with hard bright clay an octave down
Flowerpot carillon | Glass canopy | soil=Clay leaf=Pluck leafTone=0.5 balance=0.65 release=1.4 reach=1.6 branching=0.6 growth=0.03 rootTone=0.6 decay=2.4 meeting=0 series=0.33 width=1 floor=62 | spiralstars | peal | Struck clay pots, plucked and quickly dead
Evening vespers bell | Glass canopy | soil=Clay leafTone=0.1 balance=0.75 release=9 reach=2.8 branching=0.6 growth=0.2 rootTone=0.35 decay=34 meeting=-0.4 floor=42 sway=0.5 tolerance=12 fit=1 | undertow | lone | A dull large bell of clay, long in going
Toy on a string | Glass canopy | soil=Clay leafTone=0.55 balance=0.7 release=0.7 reach=1.4 branching=0.1 growth=0.04 rootTone=0.8 decay=1.2 meeting=0 floor=110 sway=0 width=0.2 volume=1 | smaller | ostinato | Little bright glass notes with a bump of clay
Ships' bells at anchor | Glass canopy | soil=Clay leaf=Glass leafTone=0.6 balance=0.6 attack=0.1 release=6 reach=1.8 branching=1 growth=0.15 stagger=0.4 rootTone=0.5 decay=18 series=0.5 meeting=0 volume=3.5 floor=68 | swing | tides | Glass bells over clay roots that each start in turn
Rain stick | Sand under glass | leafTone=0.3 balance=0.85 release=3 reach=2 branching=1 growth=0.15 stagger=0.05 rootTone=0.5 decay=6 series=0.66 meeting=0 width=1 floor=76 | wide | peal | Soft glass strokes lost in streams of sand running down | texture
Sleigh in thaw | Sand under glass | leafTone=0.6 balance=0.55 release=1 reach=1 branching=0.5 growth=0.02 rootTone=0.7 decay=2 series=0.33 meeting=0 floor=160 pulse=0.95 grain=0.5 | thin | ostinato | Glass and a jingle of sand in the fastest pulses, short
Dune chimes | Sand under glass | leafTone=0.3 balance=0.75 release=7 reach=1.6 branching=0.3 growth=0.2 rootTone=0.6 decay=24 meeting=0.4 sway=0.8 floor=48 pulse=0.3 volume=4.5 | chime | pairs | Glass strokes over sand that breathes in slow pulses
Sugar snow | Sand under glass | leafTone=0.3 balance=0.7 release=3 reach=1.2 branching=0.8 growth=0.15 grain=0.7 rootTone=0.45 decay=5 soil=Sand width=1 fit=1 floor=52 stagger=0.25 volume=4 | rising | pairs | Light glass with fine falling grains of sand
Vault swinging shut | Sand under glass | leafTone=0.15 balance=0.8 release=5 reach=2.8 branching=0.2 growth=0.3 rootTone=0.3 decay=14 meeting=0.9 floor=44 width=0.4 | lowcath | lamp | Nearly no glass, a long dull wash of sand over a low thread | texture
Gong in the bog | Glass canopy | soil=Peat leafTone=0.3 balance=0.9 release=10 reach=2.4 branching=0.8 growth=0.08 rootTone=0.8 decay=24 meeting=-1 series=0.5 sway=0.7 tolerance=110 | cathedral | lone | A slow gong of peat, its roots pulled into one shared pitch
Sunken church | Glass canopy | soil=Peat leafTone=0.55 balance=0.75 release=8 reach=3.2 branching=0.5 growth=0.2 rootTone=0.6 decay=34 meeting=0.4 floor=44 fit=1 | below | lamp | Glass strokes and deep peat that takes its time
Tea ceremony | Glass canopy | soil=Peat leafTone=0.4 balance=0.55 release=4 reach=1.2 branching=0.2 growth=0.1 rootTone=0.4 decay=9 meeting=0 width=0.5 sway=0.4 | silent | lamp | A rubbed glass tone with a dark peat octave under it
Iron pot lid | Glass canopy | soil=Peat leaf=Pluck leafTone=0.55 balance=0.6 release=2 reach=1.8 branching=0.9 growth=0.04 rootTone=0.7 decay=4 series=0.66 meeting=0 width=0.7 floor=56 | ring | hocket | Hard plucks and murky beating peat | plucked
Low tide marker | Glass canopy | soil=Peat leaf=Sine attack=0.05 leafTone=0.5 balance=0.8 release=5 reach=2 branching=0.4 growth=0.06 rootTone=0.5 decay=16 meeting=0.6 sway=1 fit=1 floor=62 | shifted | call | A round stroke, then thick peat wavering as it dies
Bell from two keys | Chalk bells | meeting=1 leaf=Sine leafTone=0.4 balance=0.8 release=4 reach=2 branching=0.3 growth=0.05 stagger=0 rootTone=0.5 decay=16 fit=1 series=0 floor=68 | bare | pairs | Chalk struck where the difference of two keys lies, in tune with them
Unlevel shelf | Chalk bells | meeting=0.8 fit=0 leaf=Sine leafTone=0.35 balance=0.75 release=4 reach=2 branching=0.6 growth=0.06 rootTone=0.6 decay=5 series=0.5 stagger=0.1 width=0.3 floor=76 volume=2 | drift | sixths | Chalk struck on true differences, left where the numbers put it
Chalk shadow play | Parents vanish | soil=Chalk attack=0.1 release=5 reach=1.6 series=0.66 branching=0.9 growth=0.2 rootTone=0.5 decay=20 sway=0.2 width=1 volume=1 fit=1 floor=48 | mirror | pairs | Only differences, struck in chalk, the keys unheard
Glass argument | Chalk bells | meeting=0.5 leafTone=0.5 balance=0.65 release=3 reach=1 branching=1 growth=0.1 stagger=0.1 rootTone=0.4 decay=8 series=0.3 fit=0.6 tolerance=40 floor=52 | key | sixths | Glass strokes and dull chalk that half agrees with them
Bell under the floor | Chalk bells | meeting=0.9 leaf=Sine leafTone=0.2 balance=0.9 release=6 reach=3 branching=0.1 growth=0.3 stagger=0 rootTone=0.3 decay=30 series=0.2 floor=42 width=0.4 volume=-8 | veil | chorale | The lowest chalk bell each chord can bear, a moment after it
`,
    },
    {
      id: 'peat-drones',
      name: 'Peat drones',
      category: 'drone',
      rows: `
Tarn without wind | Peat drone | balance=1 attack=0.8 release=20 reach=3 growth=0.15 rootTone=0.2 meeting=-0.3 floor=44 sway=0.6 width=0.4 tolerance=16 fit=1 | bare | fifth | Nothing but dark peat, low and even
Turf fire | Peat drone | balance=0.9 attack=0.5 release=5 reach=2.8 growth=0.2 rootTone=0.75 series=0.6 branching=0.8 meeting=0 sway=1 width=0.8 volume=-12.5 floor=42 | warm | throb | Peat with all its divisions, glowing and shifting
Drowned road | Peat drone | balance=0.8 attack=0.8 release=12 reach=2.6 growth=0.4 series=0.2 branching=0.6 rootTone=0.45 meeting=0.5 leafTone=0.3 floor=44 volume=-0.5 sway=0 width=0.2 decay=18 | below | pedal | A slow tone and slow peat, both half covered
Heather roots | Peat drone | balance=0.7 attack=0.8 release=6 reach=1.4 growth=0.15 rootTone=0.6 leafTone=0.5 series=0.33 branching=0.5 meeting=-1 tolerance=140 width=0.7 floor=50 fit=1 | room | meadow | Soft tones with peat close below, drawn onto shared pitches
Cattle in mist | Peat drone | leaf=Reed leafTone=0.15 balance=0.75 attack=1 release=8 reach=2.8 growth=0.3 rootTone=0.35 meeting=0.3 series=0.4 sway=0.8 floor=45 | fog | pedal | Low reeds you can hardly tell from the peat they stand in
Earth lodge | Peat drone | soil=Clay balance=0.85 attack=1.2 release=5 reach=2.4 rootTone=0.5 series=0.5 branching=0.8 growth=0.3 meeting=-1 floor=45 decay=24 tolerance=180 | giant | moor | A round clay drone on roots the keys have in common
Plain at noon | Peat drone | soil=Clay leaf=Sine leafTone=0.6 balance=0.5 attack=0.6 release=3 reach=1.2 rootTone=0.3 branching=0.3 series=0.1 meeting=0 sway=0.2 width=0.3 growth=0.3 | valve | single | An open tone and its clay octave, quite still
Valley of kettles | Peat drone | soil=Clay balance=0.95 attack=0.8 release=9 reach=3.6 rootTone=0.7 branching=1 series=0 meeting=0.6 growth=0.3 floor=40 width=0.6 volume=-1 | valley | upland | Clay in every octave down to the lowest there is
Brick oven | Peat drone | soil=Clay leaf=Reed leafTone=0.2 balance=0.6 attack=0.8 release=4 reach=3 rootTone=0.6 series=0.66 branching=1 meeting=-1 tolerance=180 sway=0.5 growth=0.2 decay=30 floor=56 stagger=0.1 volume=-11.5 | stack | organum | Reeds over a crowd of clay roots all leaning to one
Fields from a train | Peat drone | soil=Clay leaf=Breath leafTone=0.5 balance=0.65 attack=0.4 release=4 reach=2.2 rootTone=0.4 series=0.33 meeting=0.4 sway=1 width=1 growth=0.4 fit=1 | circle | single | Breath and round clay passing slowly by
Empty nave | Stone choir | leaf=Reed leafTone=0.2 balance=0.8 attack=1 release=8 reach=2.8 growth=0.4 rootTone=0.04 floor=42 meeting=-0.4 series=0.4 width=0.6 tolerance=16 | cathedral | upland | Hollow stone under a faint reed
Power station chapel | Stone choir | leaf=Sine leafTone=0.3 balance=0.95 attack=0.6 release=4 reach=3 rootTone=0.5 series=0.66 branching=1 meeting=0 sway=0.3 floor=60 decay=18 growth=0.2 | warm | throb | A hard hum of stone on all divisions
Mouth of the glacier | Stone choir | leaf=Breath leafTone=0.3 balance=0.85 attack=0.4 release=14 reach=3.2 growth=0.4 rootTone=0.05 floor=44 meeting=0.6 sway=0.9 fit=1 | glacier | pedal | Cold breath on dark stone that hardly moves
Bees in the belfry | Stone choir | leaf=Reed leafTone=0.6 balance=0.55 attack=0.5 release=3 reach=1.2 rootTone=0.6 series=0.33 branching=0.5 meeting=-0.2 tolerance=12 fit=0.3 sway=0.7 growth=0.15 floor=62 | sustain | organum | Reeds and stone close together, buzzing warmly
Menhir at dusk | Stone choir | leaf=Sine leafTone=0.15 balance=1 attack=0.8 release=6 reach=2 rootTone=0.35 series=0 branching=0.3 meeting=0.8 growth=0.3 width=0.3 decay=24 | console | moor | One stone octave below each key and the key itself left out
Wind over the bar | Peat drone | soil=Sand balance=0.9 attack=0.5 release=6 reach=2.4 rootTone=0.3 series=0.5 branching=1 meeting=0 sway=1 width=1 growth=0.2 floor=68 | wind | single | Sand streaming on threads of pitch, up and down with the weather
Furnace at shift end | Peat drone | soil=Sand balance=0.95 attack=0.5 release=3 reach=3 rootTone=0.45 series=0.33 branching=0.6 meeting=-0.6 floor=44 width=0.6 sway=0.4 growth=0.2 tolerance=5 | reel | fifth | A steady roar of sand with a low thread in the middle
Sleeping snow | Peat drone | soil=Sand leaf=Sine leafTone=0.4 balance=0.55 attack=1.5 release=9 reach=1.6 rootTone=0.2 growth=0.6 meeting=0.5 branching=0.3 sway=0.6 decay=30 floor=76 | veil | single | A plain soft tone, and sand no louder than falling snow
Radio in the dunes | Peat drone | soil=Sand leaf=Reed leafTone=0.4 balance=0.6 attack=0.4 release=3 reach=2 rootTone=0.45 series=1 branching=0.8 meeting=0 width=0.5 growth=0.2 floor=48 stagger=0.1 | kitchen | organum | Thin reeds over odd roots in hissing sand
Sea through a wall | Peat drone | soil=Sand leaf=Breath leafTone=0.2 balance=0.75 attack=0.5 release=7 reach=2.8 rootTone=0.35 series=0.1 meeting=-0.8 sway=1 width=0.9 growth=0.25 floor=46 tolerance=5 | sway | meadow | Breath and dull sand behind it, in long waves
Slow hammers | Peat drone | soil=Chalk pulse=0.3 balance=0.95 attack=0.3 release=4 reach=2.4 rootTone=0.4 series=0.33 branching=0.8 meeting=0 growth=0.2 floor=45 width=0.9 | cave | fifth | Chalk struck over and over in slow pulses, no two roots together
Forty looms | Peat drone | soil=Chalk pulse=0.65 balance=0.9 attack=0.5 release=3 reach=2.2 rootTone=0.3 series=0.66 branching=1 meeting=0 growth=0.1 leafTone=0.3 floor=52 | pillow | throb | A dull busy pattern of chalk pulses that never quite repeats
Idling ferry | Peat drone | soil=Peat pulse=0.6 balance=0.95 attack=0.3 release=5 reach=2.6 rootTone=0.6 series=0.2 branching=0.5 meeting=0.3 floor=45 width=0.5 growth=0.1 | iron | meadow | Peat throbbing in quick pulses under long keys
Breathing hill | Peat drone | soil=Clay pulse=0.3 balance=0.9 attack=0.4 release=8 reach=2.8 rootTone=0.45 series=0.33 branching=0.7 meeting=-0.4 floor=45 width=0.7 growth=0.25 tolerance=40 | bathe | moor | Clay that rises and falls in slow pulses
Generator under snow | Peat drone | soil=Stone pulse=0.8 balance=0.9 attack=0.4 release=3 reach=2.2 rootTone=0.3 series=0.4 branching=0.6 meeting=0 floor=44 width=0.5 volume=-2.5 growth=0.15 sway=0 | cloth | upland | Fast pulses of stone run together into a low flutter
Two tugs | True differences | soil=Peat leafTone=0.3 balance=0.8 attack=0.4 release=6 reach=1.4 growth=0.1 branching=0.3 tolerance=60 fit=0 rootTone=0.5 sway=0.5 volume=-2.5 floor=56 | lowpulse | sixths | Unfitted differences in thick peat, rubbing on each other
Telegraph wire | True differences | soil=Stone leaf=Sine leafTone=0.2 balance=0.75 attack=0.8 release=4 reach=1 growth=0.2 branching=0.8 series=0.6 rootTone=0.5 fit=1 width=1 decay=30 floor=62 stagger=0.18 | thinair | sixths | A thin singing of differences in stone
Low meeting | Parents vanish | soil=Peat attack=0.5 release=8 reach=2.8 growth=0.12 rootTone=0.6 branching=0.3 series=0.2 floor=44 width=0.4 volume=-6 fit=1 | darkhall | chorale | The keys left out; only the deep peat where they meet by difference
Council of elders | Parents vanish | soil=Clay leaf=Breath leafTone=0.3 balance=0.75 attack=0.3 release=5 reach=1.6 growth=0.12 branching=1 series=0.6 rootTone=0.6 sway=0.8 floor=68 | monks | chorale | A little breath over many clay differences that shift together
Undersong | Parents vanish | soil=Sand leaf=Sine leafTone=0.5 balance=0.7 attack=0.5 release=4 reach=2.2 growth=0.2 branching=0.5 series=0.4 rootTone=0.45 decay=18 | orbits | upland | A soft tone with sandy differences humming under it
Landslip | Peat drone | soil=Peat grain=0.85 balance=0.95 attack=0.3 release=5 reach=2.6 rootTone=0.7 series=0.5 branching=1 meeting=0 width=0.9 floor=46 growth=0.12 | valley | fifth | A drone of peat that crumbles and goes on crumbling
Mill grinding | Peat drone | soil=Stone grain=0.75 balance=0.95 attack=0.3 release=3 reach=2 rootTone=0.35 series=0.33 branching=0.8 meeting=-0.4 floor=45 width=0.6 growth=0.15 tolerance=30 | boxed | meadow | Stone ground into heavy slow gravel
Fat in the pan | Peat drone | soil=Sand grain=0.9 balance=0.9 attack=0.1 release=2 reach=1.4 rootTone=0.45 series=0.66 branching=1 meeting=0 width=1 growth=0.1 decay=20 floor=76 stagger=0.33 volume=-3 | bare | throb | Sand falling as crackling grains with hardly any line left
Barnacles | Peat drone | soil=Clay grain=0.35 balance=0.85 attack=0.6 release=6 reach=2.2 rootTone=0.6 series=0.4 branching=0.7 meeting=0.3 width=0.8 growth=0.25 fit=1 floor=48 | shallows | upland | Clay tones studded with small bright grains
Peat cutters | Peat drone | soil=Peat grain=0.2 leaf=Reed leafTone=0.2 balance=0.7 attack=0.6 release=6 reach=3 rootTone=0.5 meeting=-0.6 growth=0.2 floor=42 tolerance=16 | leaves | pedal | Dim reeds, peat coming away under them in soft grains
Lark above the moor | Peat drone | leaf=Glass leafTone=0.3 balance=0.4 attack=1 release=6 reach=1.4 floor=80 rootTone=0.5 branching=0.5 meeting=-0.3 decay=30 width=1 volume=-1.5 tolerance=30 growth=0.1 | thinair | tides | High glass with warm peat kept well up, nothing low
Fence wire in wind | Stone choir | leaf=Sine leafTone=0.55 balance=0.5 attack=0.6 release=4 reach=1 floor=120 rootTone=0.4 branching=0.2 meeting=0 sway=0.8 width=1 volume=-5.5 growth=0.25 | swirl | tides | Thin tones and one stone octave, nothing low
Cup rims | Peat drone | soil=Clay leaf=Glass leafTone=0.2 balance=0.5 attack=3 release=8 reach=1.8 floor=70 rootTone=0.3 branching=0.6 series=0.33 decay=40 meeting=0.4 volume=-2.5 growth=0.25 | bowls | slowtwo | Glass rims rubbed over soft clay
Summer insects | Peat drone | soil=Sand leaf=Reed leafTone=0.45 balance=0.5 attack=0.6 release=4 reach=1.2 floor=110 rootTone=0.5 branching=0.8 pulse=0.9 sway=0.6 width=1 growth=0.2 tolerance=20 | flock | tides | Reeds and sand that flickers in fast pulses, all of it kept high
Star over the barn | Peat drone | soil=Stone leaf=Sine leafTone=0.3 balance=0.45 attack=1 release=18 reach=2 floor=90 rootTone=0.5 branching=0.3 meeting=0.6 growth=1 fit=1 | lift | single | A calm tone with a slender stone root finding it late
Five strings at rest | Peat drone | leaf=Pluck leafTone=0.7 balance=0.5 release=6 reach=1.6 growth=0.15 soil=Clay rootTone=0.6 decay=14 series=0.2 branching=0.6 meeting=-0.4 stagger=0.4 width=0.5 tolerance=8 floor=52 | strings | fifth | Strings plucked once and left, humming down on clay
Bellows and feet | Peat drone | leaf=Reed leafTone=0.5 balance=0.5 attack=0.4 release=1.5 soil=Clay rootTone=0.5 reach=1.2 branching=0.4 series=0 meeting=0 sway=0.4 width=0.4 decay=24 growth=0.15 | lungs | meadow | A plain reed drone with a clay octave
Handle and wheel | Peat drone | leaf=Reed leafTone=0.5 balance=0.45 attack=0.2 release=0.8 soil=Stone rootTone=0.35 reach=1.2 branching=0.3 series=0.33 meeting=0 pulse=0.5 width=0.3 growth=0.2 | buzz | fifth | Nasal reeds and stone that beats unevenly under them
Organ left on | Peat drone | leaf=Sine leafTone=0.6 balance=0.4 attack=0.15 release=1 soil=Stone rootTone=0.5 reach=2.6 branching=0.8 series=0.33 meeting=0.2 sway=0.1 width=0.6 growth=0.15 floor=42 | sway | throb | Bright even tones with octaves and twelfths of stone below
Shoreline hum | Peat drone | leaf=Breath leafTone=0.35 balance=0.75 attack=0.4 release=5 soil=Peat rootTone=0.8 reach=1.8 branching=0.4 meeting=0.5 sway=1 width=1 growth=0.2 decay=30 series=0.66 | ensemble | single | Clear breath, thick peat moving under it
Asleep in the hold | Peat drone | balance=0.9 attack=1 release=10 reach=2.4 rootTone=0.5 growth=0.3 soil=Clay series=0.33 meeting=-1 leafTone=0.2 width=0.8 floor=46 tolerance=90 fit=1 | mist | pedal | Slow clay roots drawn to one shared pitch, hanging
Rust | Peat drone | soil=Stone balance=0.85 attack=0.5 release=6 reach=2.2 rootTone=0.6 series=0.5 branching=0.6 meeting=0.4 leafTone=0.5 growth=0.2 floor=56 | worn | moor | A stone drone with its edges rubbed down
Moth at the lamp | Peat drone | soil=Sand leaf=Glass leafTone=0.5 balance=0.45 release=6 reach=2 rootTone=0.5 decay=30 attack=0.6 meeting=0 sway=1 floor=62 growth=0.15 | glimmer | upland | Glass that throbs above fluttering sand
Cloud shadow | Peat drone | balance=0.75 attack=1.2 release=9 leaf=Sine leafTone=0.5 reach=3 soil=Peat rootTone=0.3 growth=0.25 meeting=0.8 floor=42 volume=-9 fit=1 stagger=0.8 series=0.2 | tide | stand | A soft tone, and very low peat crossing under it
Long way to the sea | Peat drone | soil=Clay leaf=Reed leafTone=0.3 balance=0.55 attack=1 release=12 reach=2.6 rootTone=0.4 growth=0.4 stagger=0.6 series=0.4 branching=0.8 meeting=0 floor=44 tolerance=160 | near | slowtwo | Quiet reeds whose clay roots set out one key at a time
`,
    },
    {
      id: 'falling-gravel',
      name: 'Falling gravel',
      category: 'texture',
      rows: `
Cliff path giving way | Falling gravel | grain=0.9 balance=0.9 attack=0.15 release=3 reach=3.4 rootTone=0.5 series=0.66 floor=40 growth=0.3 stagger=0.4 width=1 leafTone=0.2 fit=1 decay=12 | valley | tides | Chalk pebbles dropping further and further down under a breath
Hail on the greenhouse | Falling gravel | grain=0.8 balance=0.8 reach=1 rootTone=0.4 series=0.33 branching=1 floor=150 growth=0.05 stagger=0 release=1.5 sway=0.2 attack=0.1 decay=16 fit=1 | brightplate | pairs | Chalk pebbles falling thick and high, a breath behind
Pockets full of shells | Falling gravel | grain=0.7 leaf=Sine leafTone=0.2 balance=0.75 attack=0.2 reach=1.6 rootTone=0.6 series=0.33 branching=0.5 release=2 decay=14 width=0.6 fit=1 floor=68 | bare | tides | Plain tones and a steady rattle of chalk shells
Sea cave at low water | Falling gravel | grain=1 balance=0.7 leafTone=0.6 attack=0.4 reach=2.4 rootTone=0.4 series=0.5 sway=0.9 release=6 width=0.9 volume=-12 fit=1 | cavern | - | Wide breath, with chalk pebbles alone below it
Boots on the drive | Falling gravel | grain=0.55 balance=0.85 reach=2.2 rootTone=0.25 series=0.2 branching=0.6 meeting=0.6 floor=50 release=2 width=0.5 attack=0.05 growth=0.06 leafTone=0.2 fit=1 | across | walk | Dull chalk gravel crunching two octaves under each step
Grain silo | Falling gravel | soil=Sand grain=0.95 balance=0.95 attack=0.15 reach=2.6 rootTone=0.4 series=0.66 release=4 width=0.8 floor=45 growth=0.2 decay=20 fit=1 | cistern | - | Sand pouring in grains, no line of pitch left whole
Sugar on the drum | Falling gravel | soil=Sand grain=0.8 leaf=Sine leafTone=0.1 balance=0.8 attack=0.1 reach=1.2 rootTone=0.4 branching=0.4 series=0.1 release=1 floor=100 width=0.5 volume=0.5 growth=0.04 stagger=0 decay=26 fit=1 | skin | hocket | Short grains of sand bouncing close under the keys
Frost on wires | Falling gravel | soil=Sand grain=0.5 leaf=Glass leafTone=0.7 balance=0.35 attack=0.1 reach=1.4 rootTone=0.4 series=0.4 release=5 decay=20 width=1 floor=90 volume=-2 fit=1 | thinair | lamp | Brittle glass with thin sand cracking and hissing round it
Leaves in a courtyard | Falling gravel | soil=Sand grain=0.65 leafTone=0.5 balance=0.65 attack=0.3 reach=1.8 rootTone=0.35 series=0.33 sway=1 release=3 decay=14 floor=76 fit=1 | leaves | single | Breath, and soft sand scattered in small gusts
Static of the stars | Falling gravel | soil=Sand grain=0.3 leaf=Sine leafTone=0.6 balance=0.6 attack=1 reach=2 rootTone=0.6 series=0.5 meeting=-0.6 tolerance=16 release=7 width=1 floor=48 fit=1 | space | built | Clear tones on sand that crackles with the finest grains
Dry wall builder | Falling gravel | soil=Stone grain=0.85 leaf=Sine leafTone=0.2 balance=0.95 attack=0.1 reach=2.2 rootTone=0.3 series=0.2 branching=0.8 release=1.5 floor=50 width=0.5 stagger=0.1 fit=1 | chamber | chorale | Heavy dull blocks of stone gravel set down one by one
Scree at sunrise | Falling gravel | soil=Stone grain=0.7 balance=0.75 leafTone=0.4 reach=2.8 rootTone=0.55 series=0.6 release=5 growth=0.3 width=1 attack=0.2 floor=52 fit=1 | hall | tides | Ringing stone pebbles over a breath, still falling after the hand lifts
Ice breaking up | Falling gravel | soil=Stone grain=0.9 leaf=Glass leafTone=0.45 balance=0.75 attack=0.1 reach=1.6 rootTone=0.4 branching=1 series=0.33 release=6 decay=24 volume=0.5 floor=56 fit=1 | glacial | - | Glass, then hard stone coming apart in grains
Rockpool | Falling gravel | soil=Stone grain=0.75 leaf=Glass leafTone=0.5 balance=0.6 attack=0.4 reach=1.4 rootTone=0.5 meeting=0.5 branching=0.4 series=0.1 release=3 floor=70 width=0.7 fit=1 volume=-1 | shallows | pairs | Rubbed glass and stone that glitters with small grains
Temple ruins | Falling gravel | soil=Stone grain=0.6 leaf=Reed leafTone=0.15 balance=0.8 attack=0.5 reach=3.2 rootTone=0.4 series=0.4 meeting=-0.5 release=8 floor=44 width=0.8 growth=0.3 tolerance=24 fit=1 | cathedral | pedal | Dim reeds over deep stone, half of it gone to rubble
Mud springs | Falling gravel | soil=Peat grain=0.9 balance=0.95 attack=0.2 reach=2.4 rootTone=0.8 series=0.4 branching=0.8 release=3 floor=48 width=0.7 sway=1 volume=-6 decay=8 fit=1 | warm | throb | Thick bubbles of peat, each a short dark grain
Frogs at a distance | Falling gravel | soil=Peat grain=0.75 leaf=Reed leafTone=0.3 balance=0.6 attack=0.3 reach=1.2 rootTone=0.7 series=0.33 branching=0.6 release=2 floor=80 width=1 growth=0.08 decay=5 fit=1 | farshore | pairs | Little reeds and croaking grains of peat near the keys
Porridge | Falling gravel | soil=Peat grain=0.6 leaf=Sine leafTone=0.05 balance=0.8 attack=0.1 reach=2 rootTone=0.4 series=0.1 branching=0.3 meeting=0.6 release=1.5 width=0.3 sway=0.8 volume=-5.5 growth=0.04 stagger=0 fit=1 | pot | slowtwo | Slow soft bubbles: dull peat in grains, with a round tone inside
River under the hill | Falling gravel | soil=Peat grain=0.5 balance=0.8 leafTone=0.3 attack=0.2 reach=3 rootTone=0.6 series=0.5 meeting=-0.4 release=8 floor=46 growth=0.2 decay=7 tolerance=16 fit=1 | cave | moor | Breath and deep peat tumbling slowly, grain over grain
Compost in spring | Falling gravel | soil=Peat grain=0.35 leaf=Breath leafTone=0.3 balance=0.7 attack=0.15 reach=3 rootTone=0.7 series=0.66 branching=1 release=4 sway=1 growth=0.15 floor=62 fit=1 | pillow | single | Warm breath, peat stirring in soft grains on all divisions
Marbles in a box | Falling gravel | soil=Clay grain=0.95 leaf=Sine leafTone=0.3 balance=0.9 attack=0.1 reach=1.6 rootTone=0.5 series=0.33 branching=0.8 release=1.5 floor=80 width=0.8 volume=5 growth=0.03 stagger=0 decay=9 fit=1 | wood | throb | Round clay pebbles rolling about under short tones
Raindrops on pots | Falling gravel | soil=Clay grain=1 leaf=Pluck leafTone=0.4 balance=0.8 attack=0.05 reach=2.8 rootTone=0.4 series=0.66 branching=1 release=3 decay=20 floor=90 width=1 volume=0.5 fit=1 | rain | lamp | A pluck, then separate clay drops on every division, falling freely
Landing on moss | Falling gravel | soil=Clay grain=0.7 balance=0.8 leafTone=0.25 attack=0.3 reach=2 rootTone=0.5 series=0.2 branching=0.5 meeting=0.7 release=5 width=0.7 growth=0.25 fit=1 decay=12 | cloud | built | Breath, and rounded clay grains landing low beneath
Popcorn moon | Falling gravel | soil=Clay grain=0.85 leaf=Glass leafTone=0.4 balance=0.7 reach=1.8 rootTone=0.6 series=0.5 branching=0.9 attack=0.05 release=3 decay=10 width=1 floor=70 volume=0 fit=1 | stone | pairs | Glass notes, clay grains jumping brightly from them
Brickyard | Falling gravel | soil=Clay grain=0.55 leaf=Reed leafTone=0.3 balance=0.8 attack=0.3 reach=2.6 rootTone=0.7 series=0.4 meeting=-1 tolerance=150 release=2 floor=40 width=0.2 fit=1 | combo | chorale | Reeds on shared clay roots, rough with grains
Wind chime in gravel | Falling gravel | grain=0.9 leaf=Glass leafTone=0.5 balance=0.6 attack=0.05 reach=2 rootTone=0.5 series=0.5 release=6 decay=22 meeting=0 fit=1 | glimmer | pairs | Glass, with chalk pebbles running on long under each stroke
Sack race | Falling gravel | grain=0.8 leaf=Pluck leafTone=0.3 balance=0.8 attack=0.05 reach=2.2 rootTone=0.5 branching=0.6 series=0.2 release=1 decay=2 floor=60 width=0.4 volume=-9.5 growth=0.04 fit=1 | forward | seeds | Plucks and a short burst of chalk gravel
Roof shedding snow | Falling gravel | soil=Sand grain=0.6 leaf=Pluck leafTone=0.6 balance=0.75 attack=0.05 reach=2.8 rootTone=0.5 growth=0.2 release=5 decay=12 series=0.4 width=0.9 volume=0.5 floor=68 fit=1 | ghostly | call | A pluck lets a small slide of falling sand go
Doorway of beads | Falling gravel | grain=0.5 leaf=Pluck leafTone=0.65 balance=0.5 attack=0.05 reach=1.2 rootTone=0.5 series=0.66 branching=1 release=2 decay=6 floor=120 width=1 fit=1 | panned | ostinato | Plucks in a swinging scatter of small bright chalk
Mosaic floor | Falling gravel | soil=Stone grain=0.8 leaf=Glass leafTone=0.3 balance=0.65 attack=0.05 reach=2.2 rootTone=0.4 series=0.1 branching=0.3 release=2 decay=5 floor=70 width=0.7 volume=1.5 fit=1 | tiled | pairs | Glass and stone chips, laid out in short grains
Goods train | Falling gravel | pulse=0.65 grain=0.5 balance=0.95 attack=0.2 reach=2.4 rootTone=0.6 series=0.33 branching=0.8 stagger=0 growth=0.06 release=2 floor=42 width=0.7 fit=1 | tunnel | throb | Chalk gravel shaken in heavy quick pulses
Sieve and shovel | Falling gravel | pulse=0.45 soil=Sand grain=0.7 balance=0.9 attack=0.1 reach=1.8 rootTone=0.5 series=0.33 branching=0.6 stagger=0 release=1.5 width=1 volume=4 floor=76 fit=1 | wide | pairs | Sand grains thrown in pulses from side to side
Rolling stones uphill | Falling gravel | pulse=0.3 soil=Stone grain=0.6 leaf=Reed leafTone=0.2 balance=0.85 attack=0.5 reach=2.6 rootTone=0.4 series=0.4 release=4 floor=44 width=0.6 fit=1 | darkhall | pedal | Stone rolling in slow pulses, grains coming off it
Typewriter upstairs | Falling gravel | pulse=0.85 grain=0.4 leaf=Sine leafTone=0.2 balance=0.85 attack=0.1 reach=2.2 rootTone=0.4 series=0.66 branching=1 stagger=0 growth=0.04 release=1 floor=90 width=0.5 fit=1 volume=-12 | boxed | chorale | Dry taps of chalk in fast pulses, some of them broken
Rain easing off | Falling gravel | pulse=0.2 soil=Clay grain=0.75 balance=0.7 leafTone=0.3 attack=0.25 reach=2 rootTone=0.5 series=0.5 branching=0.9 release=6 width=1 floor=60 growth=0.15 fit=1 | losing | single | Breath over clay grains that come in slow pulses
Foreign coins | Falling gravel | series=1 grain=0.8 leaf=Sine leafTone=0.4 balance=0.85 attack=0.1 reach=2.8 rootTone=0.6 meeting=0 branching=1 release=4 floor=70 decay=20 stagger=0.2 fit=1 | springs | built | Odd divisions in chalk pebbles under a clear tone
Unmarked stairs | Falling gravel | series=0.95 soil=Stone grain=0.6 balance=0.8 leafTone=0.2 reach=3.4 rootTone=0.5 meeting=-0.3 tolerance=10 fit=0 growth=0.3 stagger=0.2 release=5 attack=0.15 floor=48 | latehall | tides | Odd stone divisions crumbling on the way down, left out of tune
Dice on a map | Falling gravel | meeting=1 grain=0.9 soil=Chalk leaf=Sine leafTone=0.3 balance=0.8 attack=0.1 reach=1.6 rootTone=0.5 series=0.6 fit=1 branching=0.8 release=3 floor=60 stagger=0.1 decay=16 | spiralstars | sixths | Chalk pebbles on the differences of the chord
Two radios in a shed | Falling gravel | meeting=0.8 fit=0 soil=Sand grain=0.5 leaf=Reed leafTone=0.4 balance=0.6 attack=0.5 reach=1 rootTone=0.6 series=0.4 release=3 width=0.8 decay=20 floor=52 | cassette | pairs | Thin reeds, with true differences crackling in grains of sand
Thaw | Falling gravel | meeting=0.5 soil=Peat grain=0.4 leaf=Glass leafTone=0.4 balance=0.65 attack=0.2 reach=2.4 rootTone=0.5 growth=0.4 release=6 decay=30 fit=1 tolerance=40 volume=3 floor=56 | sag | tides | Glass over peat that loosens into soft grains as it comes up
One pebble at a time | Falling gravel | grain=1 leaf=Sine leafTone=0.1 balance=0.95 attack=0.05 reach=1.9 branching=0 series=0 meeting=0.2 rootTone=0.6 release=4 decay=30 floor=60 width=0.4 fit=1 | stars | single | A single chalk root left as lone falling pebbles
Wooden counting frame | Falling gravel | soil=Clay grain=0.9 leaf=Sine leafTone=0.2 balance=0.85 attack=0.05 reach=1.2 branching=0.1 series=0.2 meeting=0 rootTone=0.6 release=2 decay=20 floor=100 width=0.6 stagger=0 volume=-0.5 fit=1 | slap | chorale | Small round clay grains clicking across a chord
Waiting for rain | Falling gravel | grain=0.95 balance=0.45 leafTone=0.3 attack=0.5 reach=1.8 branching=0.2 series=0.3 rootTone=0.7 release=6 decay=20 width=1 fit=1 | slowing | single | Slow breath with a few chalk drops falling
Crumbs | Falling gravel | soil=Chalk grain=0.8 leaf=Breath leafTone=0.1 balance=0.7 attack=0.05 reach=2.2 branching=0.5 series=0 rootTone=0.3 release=1 decay=3 floor=90 width=0.3 stagger=0 growth=0.03 fit=1 | bare | seeds | Hardly any breath and a few dry crumbs of chalk
Ticking garden | Falling gravel | soil=Chalk grain=0.6 leaf=Sine leafTone=0.3 balance=0.7 attack=0.3 reach=1 branching=0.5 series=0.5 rootTone=0.55 floor=140 meeting=0 release=2 width=1 decay=40 fit=1 | orbits | pairs | Gentle tones and chalk clicks scattered wide
Breath on a mirror | Falling gravel | grain=0 soil=Sand leafTone=0.1 balance=0.2 attack=0.3 reach=1.4 rootTone=0.3 series=0.3 sway=1 release=3 width=1 decay=26 fit=1 | haze | single | Nearly all breath, with a grey shade of sand below
Dust in the beam | Falling gravel | grain=0.2 soil=Sand balance=0.8 leafTone=0.2 attack=0.4 reach=1.6 rootTone=0.45 series=0.66 pulse=0.95 release=2 floor=90 width=0.6 volume=0.5 fit=1 | record | pairs | Sand flickering in the fastest pulses, lightly rough
Aurora of slate | Falling gravel | grain=0.15 soil=Stone leafTone=0.15 balance=0.75 attack=0.6 reach=2.2 rootTone=0.8 series=0.5 meeting=-0.9 tolerance=90 sway=1 release=9 width=1 growth=0.4 floor=62 fit=1 | currents | built | Breath on bright stone, every division drawn towards one place
Fog over the weir | Falling gravel | grain=0.6 soil=Peat leafTone=0.15 balance=0.8 attack=0.4 reach=2.8 rootTone=0.4 series=0.33 meeting=0.5 sway=0.9 release=7 floor=44 growth=0.3 decay=14 fit=1 volume=0 | fog | pedal | Dim wide breath, and peat moving in soft grains far beneath
Meadow of small bells | Falling gravel | grain=0.3 soil=Chalk leaf=Glass leafTone=0.4 balance=0.75 attack=0.1 reach=1.6 rootTone=0.5 series=0.66 branching=1 stagger=0.8 growth=0.2 release=7 decay=30 floor=68 fit=1 | smear | tides | Glass and chalk bells, one key after another, a few of them broken
`,
    },
    {
      id: 'breath-elders',
      name: 'Breath elders',
      category: 'voice',
      rows: `
Grandmothers by the well | Breath elders | leafTone=0.35 balance=0.45 attack=0.3 release=3 reach=1.6 growth=0.25 series=0.4 meeting=-1 tolerance=90 rootTone=0.6 sway=0.5 width=0.6 volume=-8 floor=76 stagger=0.12 | tones | chorale | Close breathing tones on peat that they all share
Vigil | Breath elders | leafTone=0.05 balance=0.8 attack=0.6 release=9 reach=2.4 growth=0.35 meeting=-1 rootTone=0.4 floor=44 sway=0.8 volume=-7.5 decay=8 tolerance=90 | cathedral | tides | Very soft breath, and peat roots that gather under it over some seconds
Hum of the kitchen | Breath elders | leaf=Sine leafTone=0.4 balance=0.5 attack=0.5 release=2 reach=1.2 branching=0.3 rootTone=0.7 meeting=0.3 sway=0.4 width=0.4 growth=0.15 decay=5 fit=1 | oval | lines | Hummed plain tones, a thick peat octave below
Old men on a bench | Breath elders | leaf=Reed leafTone=0.1 balance=0.7 attack=0.3 release=2 reach=1.8 rootTone=0.6 meeting=-0.4 series=0.2 floor=45 width=0.5 volume=-2 growth=0.12 decay=7 tolerance=30 | pillow | organum | Husky reeds and grumbling peat
Winter lullaby | Breath elders | leafTone=0.5 balance=0.5 attack=0.3 release=4 reach=2 branching=0.2 rootTone=0.3 meeting=0.7 growth=0.4 sway=0.6 volume=-8 stagger=0 leaf=Sine | shadow | slowtwo | Soft plain voices and a faint peat bass that fits them
Monks of slate | Stone choir | leafTone=0.4 balance=0.65 attack=0.4 release=5 reach=2.4 growth=0.3 rootTone=0.5 meeting=-0.6 series=0.4 floor=42 volume=-6 tolerance=24 fit=1 | monks | organum | Breath on singing stone, the roots an octave and more below
Choir in a quarry | Stone choir | leafTone=0.45 balance=0.8 attack=0.25 release=4 reach=1.2 branching=0.6 rootTone=0.75 meeting=0 series=0.33 width=1 growth=0.3 decay=9 floor=48 stagger=0 volume=-1 | cavern | chorale | Breath and bright stone, every voice with its own root
Humming statues | Stone choir | leaf=Sine leafTone=0.2 balance=0.8 attack=0.5 release=6 reach=1.6 branching=0.2 rootTone=0.35 meeting=0.4 sway=0.7 width=0.5 volume=4 growth=0.4 decay=12 | room | lines | A closed hum: plain tones over hollow stone
Wind through the arches | Stone choir | leafTone=0.65 balance=0.25 attack=0.2 release=5 reach=2 rootTone=0.4 series=0.1 meeting=0.6 sway=1 width=1 growth=0.4 volume=-7 fit=1 | wind | suspend | Mostly air, with a stone floor far back in it
Stone throats | Stone choir | leaf=Reed leafTone=0.35 balance=0.7 attack=0.4 release=2 reach=1.4 rootTone=0.65 meeting=-1 tolerance=180 series=0.5 branching=1 sway=0.3 growth=0.3 floor=52 | oval | chorale | Reeds and stone closing on one shared root
Evensong | Breath elders | soil=Clay leafTone=0.05 balance=0.75 attack=0.3 release=4 reach=1.8 growth=0.25 rootTone=0.2 meeting=-0.3 series=0.33 width=0.8 decay=16 tolerance=5 stagger=0.15 volume=-2 | hall | chorale | Breathy voices with warm clay lower parts
Round table | Breath elders | soil=Clay leaf=Sine leafTone=0.6 balance=0.5 attack=0.4 release=1.5 reach=1.2 branching=0.4 rootTone=0.5 meeting=0 sway=0.5 width=0.7 growth=0.15 decay=20 | ensemble | lines | Open-voiced tones, each doubled in clay an octave down
Shepherds calling | Breath elders | soil=Clay leaf=Reed leafTone=0.4 balance=0.3 attack=0.2 release=2 reach=2.2 rootTone=0.4 meeting=0.8 growth=0.2 sway=0.4 decay=26 | valley | call | Reed voices calling, a clay bass arriving after them
Whispered names | Breath elders | soil=Clay leafTone=0.5 balance=0.4 attack=0.05 release=1 reach=1.6 branching=0.2 rootTone=0.6 meeting=0.2 sway=0.8 width=1 volume=-6 growth=0.06 decay=14 floor=56 | chamber | hocket | Short whispers of breath with a shade of clay tone
Basses of the choir | Breath elders | soil=Clay leaf=Breath leafTone=0.15 balance=0.8 attack=0.06 release=3 reach=2 series=0 branching=0.5 rootTone=0.8 meeting=1 floor=44 width=0.3 volume=-3.5 growth=0.15 fit=1 stagger=0.18 | ahs | organum | Nearly all clay: the low parts that each chord asks for
Ghosts in the linen | Breath elders | soil=Sand leafTone=0.55 balance=0.65 attack=0.2 release=6 reach=2 rootTone=0.75 series=0.5 meeting=-0.5 sway=0.9 width=1 growth=0.2 tolerance=12 floor=62 | ghostly | suspend | Breath and hissing sand with a thin voice in the middle
Sleepers | Breath elders | soil=Sand leafTone=0.1 balance=0.8 attack=0.25 release=5 reach=2.8 rootTone=0.6 series=0 meeting=0.5 sway=1 floor=44 volume=-3 growth=0.2 pulse=0.2 stagger=0.33 | lungs | sixths | Breath and low sand that comes and goes in slow pulses, as even as sleep
Crowd behind glass doors | Breath elders | soil=Sand leafTone=0.3 balance=0.75 attack=0.15 release=2 reach=2.8 rootTone=0.55 series=0.66 branching=1 meeting=0 grain=0.3 width=0.8 volume=-5 growth=0.15 decay=8 floor=68 | watery | chorale | Breath and a murmur of rough sand on every division
Choir under snow | Breath elders | soil=Sand leaf=Sine leafTone=0.3 balance=0.5 attack=0.6 release=7 reach=1.6 rootTone=0.5 branching=0.4 meeting=0.4 sway=0.6 width=1 growth=0.3 decay=5 floor=76 | fifths | lines | Pure hushed tones with a thin hiss of sand about them
Reading aloud | Breath elders | soil=Sand leaf=Reed leafTone=0.25 balance=0.4 attack=0.1 release=0.6 reach=1.6 rootTone=0.5 branching=0.3 meeting=0 sway=0.5 width=0.3 volume=0 growth=0.1 floor=48 | across | call | Short muttered reeds with a rustle of sand
Flute in the reeds | Breath elders | leafTone=0.25 balance=0.1 attack=0.08 release=0.8 reach=1.2 branching=0.1 rootTone=0.4 soil=Peat meeting=0.2 sway=0.4 width=0.4 growth=0.15 decay=7 | latevib | lines | A breathy flute-like line, peat only a shadow under it | wind
Conch from the dunes | Breath elders | leaf=Reed leafTone=0.45 balance=0.6 attack=0.3 release=2 reach=1.2 soil=Stone rootTone=0.8 meeting=0 branching=0.2 sway=0.4 width=0.3 volume=0.5 growth=0.15 | farshore | call | A reed and its bright stone octave, blown broad and held | wind
Bottle choir | Breath elders | leafTone=0.1 balance=0.25 attack=0.06 release=1 reach=1.6 soil=Clay rootTone=0.2 branching=0.2 meeting=0.4 sway=0.3 width=0.8 volume=-2.5 growth=0.06 decay=9 | pipe | hocket | Blown tones, short and hollow, with faint clay | wind
Alpine horn at noon | Breath elders | leaf=Reed leafTone=0.05 balance=0.5 attack=0.4 release=3 reach=1 branching=0.1 soil=Clay rootTone=0.55 meeting=0.3 sway=0 width=0.2 growth=0.15 decay=12 | valley | lone | A mellow reed with a clay octave, clear across the snow | wind
Fog at the lighthouse | Breath elders | leaf=Reed leafTone=0.5 balance=0.7 attack=0.3 release=4 reach=2.4 soil=Stone rootTone=0.6 meeting=0.9 branching=0.1 floor=42 width=0.3 sway=0.3 volume=0 growth=0.3 | farshore | single | One hard reed and a stone bass two octaves below it | wind
Voices between | Parents vanish | leaf=Breath leafTone=0.4 balance=0.7 attack=0.2 release=4 reach=1.4 soil=Clay rootTone=0.6 growth=0.15 series=0.4 branching=0.6 sway=0.7 width=0.8 decay=16 floor=52 | bare | sixths | A trace of breath, and the differences humming in clay between the notes
Unseen third | Parents vanish | leaf=Sine leafTone=0.2 balance=0.65 attack=0.4 release=3 reach=1.2 soil=Stone rootTone=0.8 growth=0.15 series=0.2 branching=0.1 width=0.6 fit=1 floor=56 | swirl | pairs | Two calm tones and a third stone one that is their difference
Sour hymn | True differences | leaf=Breath leafTone=0.3 balance=0.6 attack=0.25 release=3 reach=1.4 fit=0 soil=Peat rootTone=0.3 branching=0.8 series=0.3 sway=0.5 growth=0.15 width=0.3 decay=20 floor=62 volume=-9 | chorale | chorale | Breath voices on unfitted differences in thick peat
Mothers and daughters | True differences | leaf=Reed leafTone=0.2 balance=0.5 attack=0.4 release=2 reach=1.6 fit=1 soil=Clay rootTone=0.4 branching=0.6 series=0.5 tolerance=200 width=0.9 growth=0.15 stagger=0.12 | double | sixths | Soft reeds in pairs with clay differences singing below
Kneeling | Parents vanish | leaf=Breath leafTone=0.2 balance=0.8 attack=0.25 release=8 reach=2.8 soil=Peat rootTone=0.5 growth=0.12 branching=0.2 series=0.3 floor=44 sway=0.8 volume=-7.5 fit=1 | lowcath | chorale | A very deep peat voice, the difference each chord needs, and little else
Procession entering | Breath elders | growth=0.5 stagger=0.5 leafTone=0.4 balance=0.55 attack=0.3 release=6 reach=2.4 soil=Stone rootTone=0.4 meeting=-0.3 series=0.4 branching=0.8 tolerance=12 | latehall | tides | Breath first; stone voices enter lower and lower, key by key
Taking turns to breathe | Breath elders | stagger=1.5 growth=0.4 leafTone=0.15 balance=0.75 attack=0.3 release=4 reach=1.8 soil=Clay rootTone=0.65 meeting=0 sway=0.9 floor=68 | panned | stand | Breath whose clay answers set out one long moment apart
Roots of a hymn | Breath elders | growth=0.6 leaf=Reed leafTone=0.1 balance=0.6 attack=0.8 release=8 reach=3.2 soil=Peat rootTone=0.5 meeting=-1 series=0.33 floor=40 tolerance=90 fit=1 stagger=1.2 | undertow | stand | Plain soft reeds, and for some seconds their shared peat roots settling
Late bass singer | Breath elders | growth=0.5 leafTone=0.35 balance=0.6 attack=0.2 release=4 reach=2.2 soil=Clay series=0 branching=0 rootTone=0.6 meeting=1 width=0.4 floor=44 volume=0 | across | tides | Breath alone, then one clay bass comes in well after it
Chalk drawn saints | Breath elders | growth=0.15 stagger=0.3 leafTone=0.3 balance=0.8 attack=0.3 release=7 reach=2.4 soil=Chalk rootTone=0.45 series=0 meeting=0 decay=24 floor=50 volume=-2.5 | recall | - | Breath, with chalk bells going down one by one beneath it
Trembling candles | Breath elders | pulse=0.75 leaf=Sine leafTone=0.4 balance=0.55 attack=0.5 release=3 reach=1.2 soil=Clay rootTone=0.4 meeting=0 branching=0.5 series=0.2 width=0.8 growth=0.1 | glimmer | sixths | Plain voices whose clay octaves tremble in fast pulses
Rowers' song | Breath elders | pulse=0.35 leafTone=0.4 balance=0.75 attack=0.2 release=3 reach=2 soil=Peat rootTone=0.7 meeting=-1 series=0.33 branching=0.6 floor=42 volume=-6 growth=0.15 tolerance=180 stagger=0.25 | shallows | organum | Breath above peat that pulls in slow steady pulses
Goat bells and breath | Breath elders | pulse=0.5 leafTone=0.3 balance=0.7 attack=0.2 release=3 reach=1.6 soil=Chalk rootTone=0.5 decay=40 meeting=0 series=0.5 branching=0.8 width=1 growth=0.1 | farshore | sixths | Wide breath, a scatter of chalk pulses below
Teeth chattering | Breath elders | pulse=0.95 leaf=Reed leafTone=0.3 balance=0.6 attack=0.2 release=1 reach=1.4 soil=Stone rootTone=0.4 meeting=0 branching=0.5 width=0.5 floor=80 volume=-2 growth=0.05 | booth | hocket | Short reeds over stone that flutters in the fastest pulses | texture
Tide of sighs | Breath elders | pulse=0.1 leafTone=0.3 balance=0.7 attack=0.4 release=5 reach=2.4 soil=Sand rootTone=0.4 meeting=0.3 series=0.4 sway=1 width=1 growth=0.3 | sighs | single | Breath, and sand that rises and falls in long slow pulses
Voices in the gravel | Breath elders | grain=0.8 leafTone=0.25 balance=0.8 attack=0.2 release=4 reach=2 soil=Stone rootTone=0.5 series=0.4 branching=0.8 width=0.9 volume=-3.5 growth=0.2 decay=26 tolerance=5 floor=76 stagger=0.1 | room | chorale | Breath and broken stone, rough as old throats
Moth choir | Breath elders | grain=0.95 leaf=Glass leafTone=0.3 balance=0.7 attack=0.4 release=5 reach=1.2 soil=Sand rootTone=0.5 decay=30 floor=110 width=1 growth=0.1 tolerance=40 fit=1 volume=1 | dust | pairs | Rubbed glass, with small wings of sand grains round it | texture
Crackling prayer | Breath elders | grain=0.45 leaf=Reed leafTone=0.2 balance=0.5 attack=0.5 release=2 reach=2.4 soil=Chalk rootTone=0.6 meeting=-0.4 decay=30 width=0.6 growth=0.2 tolerance=5 stagger=0.1 | kitchen | chorale | Low reeds, worn, with chalk grains going off inside them
Elder tree in hail | Breath elders | grain=0.95 leafTone=0.35 balance=0.8 attack=0.2 release=3 reach=1.6 soil=Clay rootTone=0.55 series=0.66 branching=1 floor=80 width=1 growth=0.15 decay=14 tolerance=20 volume=-0.5 | rain | suspend | Breath and bouncing clay grains
Ashes | Breath elders | grain=0.35 leafTone=0.15 balance=0.8 attack=0.3 release=8 reach=2.6 soil=Peat rootTone=0.4 series=0.5 floor=44 sway=0.9 width=0.7 volume=-8.5 growth=0.25 tolerance=8 fit=1 stagger=0.18 | mist | organum | Low breath on peat that falls apart in soft grains
Heard through a vent | Stone choir | leafTone=0.25 balance=0.55 attack=0.1 release=2 reach=1.8 rootTone=0.5 meeting=0 soil=Peat width=0.2 sway=0.4 growth=0.15 decay=8 floor=48 | tunnel | lines | Narrow breath over a dull peat second voice
Recording of a feast | Breath elders | leafTone=0.3 balance=0.5 attack=0.2 release=1.2 reach=2 soil=Clay rootTone=0.6 series=0.5 branching=0.8 meeting=-0.2 growth=0.15 decay=5 tolerance=16 floor=52 stagger=0 | record | chorale | Breathy voices crowding on clay
Two at the sink | Breath elders | leaf=Sine leafTone=0.1 balance=0.65 attack=0.5 release=2.5 reach=2.4 soil=Stone rootTone=0.5 branching=0.2 meeting=0.8 sway=0.5 growth=0.2 fit=1 | flock | pairs | Two plain voices with a small stone bass below them
Angels' stairwell | Stone choir | leaf=Glass leafTone=0.3 balance=0.5 attack=0.3 release=6 reach=1.6 rootTone=0.4 floor=90 decay=30 meeting=0.2 width=1 | rising | tides | Rubbed glass and high stone, nothing kept low | pad
Lost congregation | Stone choir | leafTone=0.1 balance=0.8 attack=0.4 release=10 reach=2.8 rootTone=0.3 meeting=-1 tolerance=160 series=0.5 branching=1 floor=42 growth=0.4 | faraway | organum | Breath over deep stone roots drawn together
`,
    },
    {
      id: 'pulsing-roots',
      name: 'Pulsing roots',
      category: 'pad',
      rows: `
Orchard of clocks | Root pulse | pulse=0.45 balance=0.85 attack=0.8 release=3 reach=2.2 rootTone=0.5 series=0.5 branching=1 meeting=0 growth=0.3 width=1 decay=22 floor=56 stagger=0.12 | bare | - | A held chord as many clay pulses, each root at its own rate
Slow machinery | Root pulse | pulse=0.15 balance=0.9 attack=0.5 release=5 reach=3.2 rootTone=0.6 series=0.33 branching=0.7 meeting=-0.4 floor=46 sway=0.5 growth=0.2 tolerance=30 | hall | moor | Deep clay whose roots pulse once in a long while
Rail joints | Root pulse | pulse=0.65 balance=0.8 attack=0.2 release=1.5 reach=1.6 rootTone=0.8 series=0 branching=0.4 meeting=0 width=0.1 floor=60 | console | throb | Clay octaves in a quick even pulse
Walking in step | Root pulse | pulse=0.5 leaf=Reed leafTone=0.3 balance=0.6 attack=0.3 release=2 reach=2.6 rootTone=0.7 series=0.45 branching=0.3 meeting=-0.9 tolerance=40 width=0.6 volume=-8.5 growth=0.1 fit=1 floor=62 | valve | throb | Reeds over one shared clay pulse that the whole chord keeps
Lighthouse keepers | Root pulse | pulse=0.3 leafTone=0.6 balance=0.55 attack=0.6 release=7 reach=2.4 rootTone=0.45 series=0.4 meeting=0.7 branching=0.6 width=0.9 stagger=0.25 | swing | - | Open tones, under them a difference bass in slow clay pulses
Crickets and cart | Root pulse | soil=Sand pulse=0.8 balance=0.75 leafTone=0.4 attack=0.3 release=2 reach=1.4 rootTone=0.45 series=0.5 branching=0.8 meeting=0 floor=90 width=1 volume=1.5 | wide | sixths | Fast sand pulses all round a plain chord | texture
Scythes | Root pulse | soil=Sand pulse=0.4 balance=0.85 attack=0.3 release=3 reach=2 rootTone=0.5 series=0.2 branching=0.5 meeting=0 floor=50 width=0.8 stagger=0.15 | room | throb | Swings of sand, two roots to a key, in slow pulses | texture
Surf on shingle | Root pulse | soil=Sand pulse=0.35 leaf=Breath leafTone=0.3 balance=0.85 attack=0.2 release=6 reach=2.6 rootTone=0.7 meeting=0.4 sway=0.8 width=1 growth=0.2 floor=68 volume=-2 | valley | meadow | Breath, and sand that breaks in long pulses
Broom on the stairs | Root pulse | soil=Sand pulse=0.6 leaf=Sine leafTone=0.1 balance=0.95 attack=0.1 release=1 reach=1.2 rootTone=0.4 series=0 branching=0 meeting=0 width=0 stagger=0 | tiled | throb | A dull sweep of sand an octave down, again and again in pulses | texture
Snare of reeds | Root pulse | soil=Sand pulse=0.7 leaf=Reed leafTone=0.5 balance=0.55 attack=0.2 release=1.5 reach=1.6 rootTone=0.6 series=0.33 meeting=-0.5 width=0.6 tolerance=8 fit=1 floor=76 | combo | organum | Nasal reeds with rattling sand pulses
Stonecutters | Root pulse | soil=Stone pulse=0.55 balance=0.9 attack=0.2 release=2 reach=1.8 rootTone=0.5 series=0.33 branching=0.6 meeting=0 floor=55 width=0.7 | chamber | throb | Hard stone roots in quick pulses like many small blows | texture
Cathedral engine | Root pulse | soil=Stone pulse=0.25 leaf=Sine leafTone=0.5 balance=0.8 attack=0.8 release=8 reach=2.8 rootTone=0.5 series=0.5 branching=0.9 meeting=-0.3 width=0.9 tolerance=16 | cathedral | - | Slow overlapping pulses of bright stone
Signal from the ridge | Root pulse | soil=Stone pulse=0.75 balance=0.65 leafTone=0.6 attack=0.4 release=3 reach=1.2 rootTone=0.3 series=0 branching=0.3 meeting=0 floor=110 | hop | pairs | A calm chord and one stone octave in fast pulses
Iron staircase | Root pulse | soil=Stone pulse=0.4 leaf=Pluck leafTone=0.5 balance=0.75 attack=0.05 release=3 reach=2.2 rootTone=0.6 series=0.66 branching=1 growth=0.2 meeting=0 width=1 volume=3 floor=48 | tunnel | built | Plucks that set off a clatter of stone pulses going down | plucked
Turbine hall | Root pulse | soil=Stone pulse=0.9 leaf=Reed leafTone=0.2 balance=0.6 attack=0.4 release=4 reach=2 rootTone=0.4 meeting=0.6 series=0.3 width=0.5 growth=0.2 floor=52 | drift | chorale | Soft reeds on stone that flutters in pulses too fast to count | organ
Something in the marsh | Root pulse | soil=Peat pulse=0.35 balance=0.9 attack=0.5 release=4 reach=2.4 rootTone=0.6 series=0.33 branching=0.6 meeting=0 floor=40 sway=0.8 | below | throb | Peat in slow pulses, surfacing here and there
Cows breathing | Root pulse | soil=Peat pulse=0.3 leaf=Breath leafTone=0.3 balance=0.7 attack=0.2 release=5 reach=2 rootTone=0.6 series=0.2 meeting=-1 tolerance=160 width=0.6 volume=-11.5 growth=0.15 | warm | moor | Breath over peat roots that share one slow pulse
Dough kneaded | Root pulse | soil=Peat pulse=0.5 leaf=Sine leafTone=0.2 balance=0.8 attack=0.2 release=1.5 reach=1.2 rootTone=0.7 branching=0.3 series=0 meeting=0 width=0.4 volume=-7 | glue | throb | Dark soft pulses of peat an octave under the chord
Outboard motor | Root pulse | soil=Peat pulse=0.85 leaf=Sine leafTone=0.5 balance=0.7 attack=0.2 release=1 reach=1.8 rootTone=0.7 series=0.5 branching=0.8 meeting=0 floor=60 width=0.6 stagger=0.18 | shallows | sixths | Thick peat purring in very fast pulses
Deep freight | Root pulse | soil=Peat pulse=0.6 leaf=Glass leafTone=0.4 balance=0.8 attack=0.1 release=5 reach=3.2 rootTone=0.5 meeting=0.8 branching=0.2 floor=46 decay=20 volume=2 | farshore | chorale | Glass at the top, and at the very bottom a pulsing peat bass
Rain on slates | Root pulse | soil=Chalk pulse=0.7 balance=0.85 leafTone=0.2 attack=0.2 release=2 reach=2.6 rootTone=0.4 series=0.66 branching=1 meeting=0 floor=90 width=1 volume=-8 | rain | throb | Chalk pattering in quick pulses over the whole chord | texture
Clock shop after hours | Root pulse | soil=Chalk pulse=0.5 leaf=Glass leafTone=0.5 balance=0.7 attack=0.05 release=3 reach=1.8 rootTone=0.6 series=0.33 branching=0.6 meeting=0 width=0.9 decay=40 floor=56 | booth | chorale | Glass, then chalk clocks, every pulse at a rate of its own | keys
Blacksmith next door | Root pulse | soil=Chalk pulse=0.4 leaf=Sine leafTone=0.4 balance=0.8 attack=0.2 release=3 reach=2.4 rootTone=0.4 series=0 branching=0.3 meeting=0 floor=45 width=0.1 stagger=0.33 | across | throb | Heavy dull chalk pulses, two octaves down | texture
Abandoned loom | Root pulse | soil=Chalk pulse=0.6 leaf=Reed leafTone=0.15 balance=0.75 attack=0.4 release=2 reach=2.6 rootTone=0.5 series=1 branching=0.9 meeting=0 floor=60 decay=7 | cassette | organum | Odd divisions beating in chalk under muffled reeds | texture
Shaken gourd at noon | Root pulse | soil=Chalk pulse=0.9 grain=0.5 balance=0.8 leafTone=0.2 attack=0.2 release=1 reach=1.2 rootTone=0.5 series=0.4 branching=0.8 meeting=0 width=1 volume=-7 floor=62 stagger=0.12 | panned | sixths | A fast shaking of chalk pulses, half of them broken to grains | texture
Code to nobody | Root pulse | pulse=0.95 leaf=Pluck leafTone=0.4 balance=0.65 attack=0.05 release=1 reach=2.4 rootTone=0.65 series=0 branching=0.2 decay=9 meeting=0 width=0.4 soil=Stone | slap | ostinato | Plucked keys, each leaving a short flutter of stone two octaves down | keys
Table tennis | Root pulse | pulse=0.8 leaf=Pluck leafTone=0.3 balance=0.75 attack=0.05 release=0.6 reach=1.2 rootTone=0.4 series=0.33 soil=Chalk decay=10 branching=0.5 meeting=0 width=0.8 floor=68 | stone | hocket | Plucks and bouncing chalk pulses, quickly over | plucked
Heartbeats in clay | Root pulse | pulse=0.45 leaf=Sine leafTone=0.1 balance=0.9 attack=0.1 release=2 reach=2 rootTone=0.35 series=0 branching=0 meeting=1 floor=40 width=0 | bare | finger | One clay bass, two octaves down, in steady pulses | bass
Copper pans | Root pulse | pulse=0.75 leaf=Glass leafTone=0.2 balance=0.8 attack=0.05 release=2 reach=1.4 rootTone=0.5 soil=Stone branching=0.6 decay=12 meeting=0 width=0.9 floor=76 volume=1 | springs | seeds | Glass and ringing stone pulses | keys
Dripping eaves | Root pulse | pulse=0.35 leaf=Pluck leafTone=0.2 balance=0.7 attack=0.05 release=4 reach=1.8 rootTone=0.3 soil=Chalk series=0.5 branching=0.8 decay=30 floor=80 meeting=0 width=1 | stars | lamp | A soft pluck, and for a while after it slow chalk pulses | plucked
Subway grate | Root pulse | pulse=0.4 balance=0.95 leafTone=0.1 attack=0.1 release=1 reach=1 rootTone=0.2 floor=34 branching=0.3 series=0 meeting=0 width=0 | iron | pedal | Low clay in even pulses for as long as a key is held | bass
Tide wheel | Root pulse | pulse=0.3 soil=Peat balance=0.9 attack=0.2 release=2 reach=1.2 rootTone=0.5 floor=40 branching=0.4 meeting=-0.5 width=0.4 leafTone=0.4 tolerance=5 | undertow | deeps | Very low peat turning over in slow pulses | bass
Boot room | Root pulse | pulse=0.65 soil=Sand balance=0.9 attack=0.1 release=0.6 reach=1.6 rootTone=0.3 floor=40 branching=0.2 series=0.33 meeting=0 width=0.1 volume=3.5 | forward | stride | Short dry pulses of sand below each key | bass
Winch | Root pulse | pulse=0.75 soil=Stone leaf=Reed leafTone=0.3 balance=0.8 attack=0.1 release=0.8 reach=2 rootTone=0.4 floor=44 branching=0.2 meeting=0.7 width=0.2 volume=-8 sway=0.9 | limiter | pedal | A reed, and a stone bass winding in quick pulses | bass
Elephants at the river | Root pulse | pulse=0.22 balance=0.95 soil=Clay leafTone=0.2 attack=0.2 release=3 reach=2.6 rootTone=0.7 floor=44 branching=0.1 meeting=1 width=0.3 volume=2 | across | pedal | A big round clay bass that takes one slow step after another in pulses | bass
Asthmatic organ | Root pulse | pulse=0.75 leaf=Reed leafTone=0.25 balance=0.65 attack=0.2 release=1 reach=1.2 soil=Clay rootTone=0.4 series=0.33 meeting=0 branching=0.5 sway=0.4 volume=-3.5 floor=48 | hollow | chorale | Plain reeds whose clay pipes pulse unevenly | organ
Hum and flutter | Root pulse | pulse=0.8 leaf=Breath leafTone=0.3 balance=0.75 attack=0.15 release=2 reach=1.4 soil=Clay rootTone=0.6 branching=0.5 meeting=-0.4 width=0.8 growth=0.1 tolerance=30 fit=1 floor=52 stagger=0.25 volume=2 | ahs | sixths | Breath with clay tones that flutter in fast pulses | voice
Couchette | Root pulse | pulse=0.5 leaf=Breath leafTone=0.3 balance=0.75 attack=0.3 release=3 reach=2.2 soil=Peat rootTone=0.5 series=0.33 meeting=0 floor=45 width=0.6 volume=6 growth=0.15 | pillow 1.output=5 | - | Dull breath and the pulses of peat under the floor | drone
Oars and whistle | Root pulse | pulse=0.25 leaf=Breath leafTone=0.45 balance=0.8 attack=0.1 release=2 reach=1.8 soil=Sand rootTone=0.7 branching=0.5 meeting=0 width=1 volume=1.5 | whistle | lines | Breath lines, slow sand pulses beside them | wind
Pump organ in a barn | Root pulse | pulse=0.12 leaf=Reed leafTone=0.6 balance=0.5 attack=0.5 release=2 reach=2 soil=Stone rootTone=0.3 series=0 meeting=0.5 branching=0.4 sway=0.5 volume=-7.5 | board | chorale | Reeds on slow swells of stone, long pulses with air between | organ
Agreement | Root pulse | pulse=0.55 balance=0.85 soil=Clay attack=0.5 release=3 reach=2.4 rootTone=0.6 series=0.4 branching=0.8 meeting=-1 tolerance=90 floor=40 | middle | throb | All roots drawn together onto shared clay pulses
Cross rhythm in thirds | Root pulse | pulse=0.6 meeting=0.8 fit=0.2 leaf=Sine leafTone=0.5 balance=0.8 attack=0.2 release=2 reach=1.4 soil=Chalk rootTone=0.5 series=0.5 branching=0.8 width=0.9 volume=-7.5 floor=56 | wide | sixths | Differences struck in chalk pulses, loosely fitted, three rates against each other | texture
Tuned to the engine | Root pulse | pulse=0.7 meeting=0.9 fit=1 soil=Peat balance=0.8 leafTone=0.5 attack=0.4 release=3 reach=1.8 rootTone=0.7 series=0.2 branching=0.3 floor=38 volume=2 stagger=0.1 | reel | pairs | Pairs of keys and the peat pulse of their difference
Neighbours' clocks | Root pulse | pulse=0.48 meeting=-0.5 fit=0 tolerance=20 soil=Chalk leaf=Sine leafTone=0.3 balance=0.8 attack=0.1 release=3 reach=2 rootTone=0.4 series=0.5 branching=1 width=0.8 floor=62 volume=-7.5 | mirror | throb | Chalk pulses that almost share one beat and never do | texture
Patient fault | Root pulse | pulse=0.38 meeting=0.6 fit=0.5 tolerance=12 leaf=Glass soil=Stone leafTone=0.4 balance=0.65 attack=0.1 release=6 reach=1.6 rootTone=0.6 series=0.4 decay=30 volume=2 | bathe | tides | Glass over stone differences that pulse slowly and lean out of tune
Factory waking | Root pulse | pulse=0.5 growth=1 stagger=0.5 balance=0.85 attack=0.4 release=4 reach=2.8 soil=Clay rootTone=0.6 series=0.33 branching=1 meeting=0 floor=38 | doubled | tides | One pulse after another joins as clay roots grow down
Pilgrims on gravel | Root pulse | pulse=0.4 grain=0.7 soil=Chalk balance=0.85 attack=0.3 release=3 reach=2 rootTone=0.4 series=0.33 branching=0.6 meeting=0 width=0.8 volume=-8.5 stagger=0.2 | valley | throb | Chalk gravel crunching in slow pulses | texture
Rice fields | Root pulse | pulse=0.85 grain=0.3 soil=Sand leafTone=0.3 balance=0.6 attack=0.8 release=4 reach=1.2 rootTone=0.55 series=0.66 branching=1 floor=120 width=1 | flock | throb | A mild chord in a field of fast sand pulses with grains in them | texture
Double shift | Root pulse | pulse=0.28 growth=0.6 soil=Stone balance=0.8 leafTone=0.2 attack=0.6 release=7 reach=3 rootTone=0.6 series=0 branching=1 meeting=0 floor=36 volume=-3 stagger=0.7 | held | stand | Stone octaves arriving over some seconds, each in a slow pulse
Dancing bear | Root pulse | pulse=0.33 grain=0.4 soil=Peat leaf=Reed leafTone=0.2 balance=0.8 attack=0.3 release=2 reach=2 rootTone=0.7 series=0.1 branching=0.3 meeting=0.4 floor=45 | skin | organum | Small reeds and heavy peat pulses, rough with grains
`,
    },
    {
      id: 'late-foundations',
      name: 'Late foundations',
      category: 'organ',
      rows: `
Foundation trench | Late foundation | leafTone=0.4 balance=0.55 attack=0.3 release=3 reach=2.8 growth=0.9 stagger=0 soil=Stone rootTone=0.5 meeting=0.6 branching=0.4 floor=42 | bare | built | Plain reeds; within three seconds stone stands under them
Chapel rebuilt | Late foundation | leafTone=0.6 balance=0.5 attack=0.8 release=5 reach=2 growth=0.5 stagger=0.15 rootTone=0.4 series=0.33 meeting=-0.9 branching=0.8 width=0.9 tolerance=90 floor=68 | cathedral | slowtwo | Bright reeds and, later, stone roots that gather on one
Buttress | Late foundation | leafTone=0.1 balance=0.8 attack=0.6 release=4 reach=3.4 growth=0.6 rootTone=0.55 meeting=1 branching=0.2 floor=40 stagger=0 width=0.4 | lowcath | throb | Dim reeds carried by one very deep hard stone bass
Stone laid in frost | Late foundation | leaf=Sine leafTone=0.05 balance=0.7 attack=0.8 release=8 reach=1.6 growth=0.5 rootTone=0.75 meeting=0.3 branching=0.5 series=0.4 sway=0.7 | thinair | slowtwo | Cool tones, with bright stone slow to follow
Keeping the arch | Late foundation | leafTone=0.55 balance=0.65 attack=0.2 release=1.2 reach=1.2 growth=0.4 stagger=0.2 rootTone=0.8 series=0.1 meeting=0 width=0.3 floor=60 | chamber | lines | Short reeds, and a stone octave just behind every one
Pump handle hymn | Ghost organ | leafTone=0.3 balance=0.55 attack=0.25 release=1 reach=2.2 soil=Clay rootTone=0.45 meeting=1 branching=0.3 sway=0.2 width=0.5 growth=0.5 volume=-10 decay=9 | valve | chorale | Simple reeds with a round clay bass that each chord brings along
Toy organ in the hall | Ghost organ | leafTone=0.8 balance=0.5 attack=0.05 release=0.3 reach=1 soil=Stone rootTone=0.7 meeting=-0.3 growth=0.05 width=0.3 sway=0 tolerance=5 leaf=Sine | hall | ostinato | Thin even tones, a bright chip of stone under them
Sunlit chapel | Ghost organ | leafTone=0.7 balance=0.5 attack=0.05 release=0.5 reach=2 rootTone=0.55 meeting=0 series=0.33 branching=0.8 width=0.9 floor=55 decay=12 | brightplate | suspend | Bright reeds over ranks of hard stone
Stopped pipes | Ghost organ | leaf=Sine leafTone=0.1 balance=0.5 attack=0.12 release=0.5 reach=1.9 soil=Peat rootTone=0.5 branching=0.5 series=0.2 meeting=0 sway=0.1 growth=0.08 decay=16 | pipe | lines | Hollow plain tones with a peat octave and twelfth below
Ghost at the manual | Ghost organ | leafTone=0.2 balance=0.75 attack=0.1 release=0.8 reach=2.2 soil=Peat rootTone=0.5 meeting=1 branching=0.1 growth=0.12 floor=42 | veil | - | Weak reeds whose difference stands out as a thick peat bass
Pedal board in clay | Ghost organ | leaf=Sine leafTone=0.35 balance=0.7 attack=0.1 release=0.6 reach=2.4 soil=Clay rootTone=0.6 series=0.33 branching=0.7 meeting=0.4 floor=42 width=0.3 | console | pedal | Even tones, clay pedal notes far below
Barn theatre organ | Ghost organ | leaf=Sine leafTone=0.7 balance=0.5 attack=0.06 release=0.5 reach=1.9 soil=Clay rootTone=0.5 series=0.33 branching=0.8 meeting=0 width=1 volume=-12 decay=20 | whirl | - | Full bright tones with clay on octaves and twelfths, spinning
Grandfather's positive | Ghost organ | leafTone=0.35 balance=0.6 attack=0.15 release=0.7 reach=2.8 soil=Clay rootTone=0.6 series=0.66 branching=1 meeting=-1 tolerance=90 | wood | chorale | Reeds with a shared mixture of clay roots below
Clay whistle organ | Ghost organ | leaf=Breath leafTone=0.3 balance=0.6 attack=0.1 release=0.6 reach=2.4 soil=Clay rootTone=0.5 series=0.2 branching=0.4 meeting=0.3 sway=0.5 width=0.7 growth=0.15 decay=26 | pipes | lines | Breathy pipes, a low clay rank speaking after them
Vestry practice | Ghost organ | leaf=Sine leafTone=0.2 balance=0.6 attack=0.2 release=0.9 reach=2 soil=Clay rootTone=0.3 meeting=-1 tolerance=70 growth=0.3 series=0.4 floor=76 | shaded | suspend | Quiet flutes whose clay roots are drawn together chord by chord
Peat burner's organ | Late foundation | soil=Peat leafTone=0.45 balance=0.6 attack=0.4 release=3 reach=2 growth=0.2 rootTone=0.7 meeting=0 series=0.33 branching=0.6 stagger=0 floor=45 decay=14 | warm | chorale | Reeds warmed by a low rank of dark peat
Crypt organ | Late foundation | soil=Peat leafTone=0.15 balance=0.85 attack=0.5 release=7 reach=3.2 growth=0.4 rootTone=0.4 meeting=0.8 branching=0.2 floor=44 volume=-4 decay=8 stagger=0 | cave | throb | Far down reeds, farther down a peat bass that arrives last
Organ in the rushes | Late foundation | soil=Peat leaf=Breath leafTone=0.3 balance=0.5 attack=0.2 release=3 reach=1.6 growth=0.15 rootTone=0.6 meeting=0.4 stagger=0.2 sway=0.8 width=1 floor=48 | shallows | sixths | Breath pipes standing in soft thick peat
Old bellows | Late foundation | soil=Peat leafTone=0.1 balance=0.75 attack=0.3 release=1 reach=1.2 growth=0.2 rootTone=0.5 pulse=0.25 meeting=0 series=0 branching=0.2 stagger=0 width=0.4 | lungs | organum | Reeds whose peat octave wheezes in slow pulses
Dusk bells and bog | Late foundation | soil=Peat leaf=Glass leafTone=0.5 balance=0.6 attack=0.1 release=7 reach=2.6 growth=0.4 rootTone=0.5 meeting=0.5 decay=36 stagger=0 fit=1 floor=52 | bowls | still | Glass struck now; warm peat a good while later | bell
Wind chest leaking | Late foundation | soil=Sand leafTone=0.4 balance=0.5 attack=0.2 release=1.2 reach=1.6 growth=0.3 rootTone=0.6 meeting=0 series=0.33 branching=0.5 stagger=0 sway=0.6 decay=5 | hiss | chorale | Reeds and the leak of sand round their lower pipes
Chalk cliff organ | Late foundation | soil=Chalk leafTone=0.3 balance=0.6 attack=0.2 release=4 reach=2.6 growth=0.5 stagger=0.3 rootTone=0.4 series=0.4 branching=1 meeting=0 floor=50 | valley | - | Reeds held while chalk strokes step down under them
Paper rolls | Late foundation | soil=Sand leaf=Sine leafTone=0.7 balance=0.4 attack=0.1 release=0.6 reach=1.2 growth=0.1 rootTone=0.4 branching=0.3 series=0 meeting=0 stagger=0 width=0.6 decay=7 floor=56 | record | ostinato | Neat bright tones with a dry rustle of sand
Frost in the pipes | Late foundation | soil=Sand leaf=Breath leafTone=0.1 balance=0.6 attack=0.1 release=5 reach=2 growth=0.25 rootTone=0.3 series=0.5 meeting=-1 width=1 tolerance=55 floor=62 stagger=0.1 | fifths | suspend | Cold breath, hissing sand roots drawn to shared tones
Sandglass fugue | Late foundation | soil=Sand leafTone=0.5 balance=0.6 attack=0.15 release=1 reach=2.4 growth=0.4 stagger=0.3 rootTone=0.4 meeting=-1 tolerance=90 series=0.4 floor=68 | answer | lines | Clear reeds, sand roots entering one key after the other
Cornerstone | Late foundation | leaf=Sine leafTone=0.3 balance=0.75 attack=0.3 release=9 reach=3 growth=0.8 stagger=0 soil=Clay rootTone=0.6 meeting=0.9 branching=0 floor=40 volume=-4.5 fit=1 | space | single | A tone alone, and after some seconds one huge clay root | pad
Surveyors at dawn | Late foundation | leaf=Glass leafTone=0.35 balance=0.5 attack=0.2 release=8 reach=2 growth=0.8 stagger=0.6 soil=Stone rootTone=0.5 meeting=0 series=0.4 decay=40 volume=1 | farshore | stand | Glass first; far later, stone that grows out from under each key | pad
Settling of the house | Late foundation | leaf=Reed leafTone=0.2 balance=0.6 attack=1 release=6 reach=2.8 growth=3.5 branching=1 soil=Chalk rootTone=0.3 decay=20 meeting=-0.3 series=0.5 stagger=0 tolerance=24 | boxed | stand | Dim reeds and, now and again, a deep knock of chalk | pad
Groundwater | Late foundation | leaf=Breath leafTone=0.4 balance=0.6 attack=0.25 release=10 reach=3.4 growth=0.4 soil=Peat rootTone=0.5 meeting=0.6 floor=46 sway=0.9 stagger=0 volume=-10.5 fit=1 | darkwater | moor | Breath, with low peat rising until it fills the floor | pad
Scaffold coming down | Late foundation | leaf=Pluck leafTone=0.5 balance=0.65 attack=0.05 release=6 reach=2.4 growth=0.6 stagger=0.3 soil=Stone rootTone=0.4 decay=24 series=0.33 meeting=0 width=1 | cavern | built | Plucks, and slow stone roots one by one after them | plucked
Choir stalls filling | Late foundation | stagger=1 growth=0.5 leafTone=0.3 balance=0.5 attack=0.6 release=4 reach=1.8 soil=Clay rootTone=0.5 series=0.33 meeting=0 branching=0.6 width=1 volume=-8.5 decay=9 floor=76 | room | stand | Reeds; their clay roots take their places a second apart
Rope of keys | Late foundation | stagger=2.4 growth=0.4 leaf=Sine leafTone=0.5 balance=0.6 attack=0.3 release=5 reach=2.2 soil=Stone rootTone=0.4 meeting=-0.2 series=0.4 volume=-9.5 tolerance=40 floor=48 | latehall | stand | Plain chords, each key's stone root more than two seconds behind the last
Tables carried in | Late foundation | stagger=0.9 growth=0.1 leaf=Reed leafTone=0.4 balance=0.65 attack=0.1 release=2 reach=1.6 soil=Chalk rootTone=0.35 decay=6 branching=0.4 meeting=0 series=0.2 floor=52 | board | throb | Reeds, then blunt chalk strokes, key after key
Guests leaving | Late foundation | stagger=0.4 growth=0.15 leaf=Glass leafTone=0.2 balance=0.75 attack=0.1 release=5 reach=1.4 soil=Peat rootTone=0.75 decay=14 meeting=0 width=0.9 volume=0.5 | bed | slowtwo | Glass chords and peat that follows a key at a time, then fades | keys
Three steps to the altar | Late foundation | stagger=0.4 growth=0.15 leaf=Breath leafTone=0.25 balance=0.7 attack=0.25 release=6 reach=2.6 soil=Clay rootTone=0.7 series=0 meeting=0.4 floor=44 fit=1 | monks | chorale | Breath, and clay steps down under each voice of the chord | voice
Resultant bass | Ghost organ | meeting=1 fit=1 leafTone=0.5 balance=0.75 attack=0.15 release=0.8 reach=2.4 soil=Clay rootTone=0.4 branching=0 floor=42 width=0.3 decay=12 | deep | organum | Fifths on mild reeds, the clay bass made from their difference
Organ at the fair | True differences | leaf=Reed leafTone=0.6 balance=0.5 attack=0.06 release=0.5 reach=1.2 soil=Clay rootTone=0.6 fit=0 branching=0.4 growth=0.06 width=0.8 decay=16 floor=56 stagger=0.18 | chorale | sixths | Bright reeds with true, unfitted clay differences, out on purpose
Ear tones | True differences | leaf=Sine leafTone=0.1 balance=0.55 attack=0.2 release=1 reach=1 soil=Stone rootTone=0.45 fit=0.5 tolerance=150 branching=0.2 growth=0.1 floor=62 | bare | pairs | High plain pairs and a thin stone difference that buzzes between them
Organ pit | Parents vanish | leaf=Reed leafTone=0.2 balance=0.8 attack=0.2 release=1 reach=2.2 soil=Peat rootTone=0.6 branching=0.2 growth=0.08 series=0.2 floor=44 decay=20 stagger=0.33 volume=0 | pillow | chorale | Hardly a reed, mostly peat differences from under the floor
Glass organ | Ghost organ | leaf=Glass leafTone=0.3 balance=0.5 attack=0.2 release=3 reach=1.6 soil=Clay rootTone=0.5 meeting=0.7 branching=0.6 decay=40 series=0.3 width=0.9 floor=68 | bowed | chorale | Rubbed glass, its clay differences tuned to the chord
Ruined nave | Late foundation | grain=0.85 soil=Stone leafTone=0.2 balance=0.75 attack=0.8 release=7 reach=2.8 growth=0.4 rootTone=0.75 series=0.33 meeting=-0.4 stagger=0 floor=40 tolerance=20 | cathedral | throb | Faint reeds over stone coming away in slow rubble and grains
Loose tiles | Odd undergrowth | leaf=Reed leafTone=0.5 balance=0.75 attack=0.15 release=1 reach=2 growth=0.3 stagger=0.2 soil=Stone rootTone=0.7 floor=60 meeting=0 width=0.6 fit=1 volume=-1 | tiled | lines | Reeds above odd stone roots, a moment late, like uneven tiles
House on a slope | Odd undergrowth | leaf=Sine leafTone=0.1 balance=0.8 attack=0.6 release=5 reach=3 growth=0.5 soil=Stone rootTone=0.5 meeting=-0.4 fit=0 tolerance=14 series=0.9 volume=-1 | swirl | slowtwo | Plain chords, and odd stone roots below that stay a little sour
Sinking pillar | Late foundation | grain=0.6 soil=Peat leaf=Sine leafTone=0.3 balance=0.7 attack=0.4 release=6 reach=3.4 growth=0.4 rootTone=0.6 meeting=0.7 branching=0.3 floor=44 volume=-7 stagger=0.1 | sinking | throb | A dark tone and lower peat, crumbling a little as it settles
Plaster dust | Late foundation | grain=0.8 soil=Chalk leafTone=0.4 balance=0.5 attack=0.2 release=2 reach=1.8 growth=0.5 rootTone=0.6 series=0.4 branching=0.7 stagger=0 decay=40 width=1 floor=76 | afterimage | organum | Steady reeds with a late fine fall of chalk pebbles
Organ across the fields | Late foundation | leafTone=0.15 balance=0.6 attack=0.4 release=3 reach=3 growth=0.4 stagger=0 soil=Stone rootTone=0.4 meeting=0 width=0.7 series=0 decay=26 | faraway | chorale | Dim reeds and bare octaves of stone
Melted candelabra | Late foundation | leaf=Glass leafTone=0.2 balance=0.75 attack=0.2 release=5 reach=1.8 growth=0.5 soil=Clay rootTone=0.5 decay=30 meeting=-0.3 stagger=0 tolerance=12 floor=48 volume=1 | sag | suspend | Glass over clay, all of it soft at the edges
Film of the old church | Ghost organ | leafTone=0.3 balance=0.6 attack=0.2 release=0.8 reach=1.2 soil=Peat rootTone=0.75 meeting=0.5 growth=0.12 sway=0.5 width=0.5 volume=-9 decay=14 | worn | chorale | Reeds and a plain peat bass
Long corridor of reeds | Late foundation | leafTone=0.45 balance=0.3 attack=0.2 release=8 reach=1.4 growth=0.3 soil=Sand rootTone=0.5 meeting=0.2 stagger=0.1 width=0.8 sway=0.9 decay=8 | reversed | sixths | Gentle reeds with a trace of sand underneath
Weather vane | Late foundation | leaf=Sine leafTone=0.5 balance=0.4 attack=0.5 release=4 reach=2 growth=0.4 soil=Stone rootTone=0.5 meeting=0 series=0.2 sway=1 stagger=0 | loop | sixths | Clear tones that turn slowly, a stone octave below
`,
    },
  ],
}
