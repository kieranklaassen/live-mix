import { type InstrumentSet } from './set'

// The set of Returning Wave. A direction is one thing a thrown wave is for: a
// pad that dissolves, a pluck that flickers, a lamp that blinks on a clock. In
// each are ten families of five: a family has its walls, its reading and the
// pace of its return, and its five part in register of tone, in how they start
// and end, and in what the chain is for. A third of it is fairly dry.

export const SET: InstrumentSet = {
  device: 'returning-wave',
  names: {
    walls: ['Box', 'Ring', 'Bowl', 'Two rooms', 'Fading well'],
    reading: ['Density', 'Wave', 'Flow'],
    clock: ['Own', 'By pitch', 'Shared'],
  },
  chains: {
    bare: { effects: [{ deviceId: 'ambient-eq', preset: 'Open' }], words: ', close and dry' },
    warm: { effects: [{ deviceId: 'ambient-eq', preset: 'Warm' }], words: ', dry and warm' },
    shade: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Shaded' }],
      words: ', dry, with the top shaded',
    },
    lit: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Bright', params: { presence: 3, air: 4 } }],
      words: ', dry, with the top lit',
    },
    thin: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 220, highCut: 6000 } },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: ', dry, with the lows cut away',
    },
    deep: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Deep', params: { low: 5 } }],
      words: ', dry, with more floor under it',
    },
    cloth: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 1500 } }],
      words: ', dry, behind a thick cloth',
    },
    scooped: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Hollow' }],
      words: ', dry, hollowed in the middle',
    },
    forward: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Forward' }],
      words: ', dry and well forward',
    },
    open: {
      effects: [{ deviceId: 'spread', preset: 'Wide but safe' }],
      words: ', dry and opened wide',
    },
    middle: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Narrow' },
        { deviceId: 'ambient-eq', preset: 'Keys' },
      ],
      words: ', dry and narrow in the middle',
    },
    glue: {
      effects: [
        { deviceId: 'ambient-comp', preset: 'Glue' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', dry and held even',
    },
    tamed: {
      effects: [
        { deviceId: 'tamer', preset: 'Gentle' },
        { deviceId: 'ambient-eq', preset: 'Open' },
      ],
      words: ', dry, with what rings tamed',
    },
    ends: {
      effects: [
        { deviceId: 'lift', preset: 'Just the ends' },
        { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 9000, air: 0 } },
      ],
      words: ', dry, its quiet ends raised',
    },
    reveal: {
      effects: [{ deviceId: 'reveal', preset: 'Overtones', params: { amount: 0.6 } }],
      words: 'with its inner overtones raised',
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
      effects: [{ deviceId: 'analog-drive', preset: 'Triode glow' }],
      words: 'in the glow of a triode',
    },
    grit: {
      effects: [{ deviceId: 'saturator', preset: 'Soft tape warmth', params: { driveDb: 9 } }],
      words: ', softly saturated',
    },
    folded: {
      effects: [
        { deviceId: 'saturator', preset: 'Folded glass', params: { mix: 0.3 } },
        { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 7000 } },
      ],
      words: 'with a folded glassy edge',
    },
    reel: {
      effects: [{ deviceId: 'tape', preset: 'Quarter inch' }],
      words: 'on quarter inch tape',
    },
    thump: { effects: [{ deviceId: 'tape', preset: 'Warm thump' }], words: 'on tape that thumps' },
    blanket: {
      effects: [{ deviceId: 'tape', preset: 'Under a blanket' }],
      words: 'on tape, under a blanket',
    },
    seasick: {
      effects: [{ deviceId: 'tape', preset: 'Seasick' }],
      words: 'on tape that wavers badly',
    },
    cassette: {
      effects: [{ deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.1 } }],
      words: 'off a worn cassette',
    },
    valve: {
      effects: [{ deviceId: 'patina', preset: 'Hot valve', params: { noise: 0.05, drive: 0.35 } }],
      words: 'through a hot valve',
    },
    record: {
      effects: [
        { deviceId: 'vinyl', preset: 'New pressing', params: { warp: 0.35, crackle: 0.15 } },
      ],
      words: 'off a slightly warped record',
    },
    glaze: {
      effects: [{ deviceId: 'vintage-digital', preset: 'Glaze' }],
      words: 'glazed by an early sampler',
    },
    combo: {
      effects: [
        { deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.15, noise: 0 } },
      ],
      words: 'through a small amplifier in a room',
    },
    pillow: {
      effects: [{ deviceId: 're-amp', preset: 'Pillow speaker', params: { noise: 0 } }],
      words: 'from a speaker under a pillow',
    },
    downhall: {
      effects: [{ deviceId: 're-amp', preset: 'Down the hall', params: { noise: 0 } }],
      words: 'from an amplifier down the hall',
    },
    wood: {
      effects: [{ deviceId: 'vessel', preset: 'Hint of wood', params: { mix: 0.4 } }],
      words: 'in a box of thin wood',
    },
    board: {
      effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.5 } }],
      words: 'on a soundboard',
    },
    bottle: {
      effects: [{ deviceId: 'vessel', preset: 'Blown bottle', params: { mix: 0.55 } }],
      words: 'blown across a bottle',
    },
    tube: { effects: [{ deviceId: 'vessel', preset: 'Glass tube' }], words: 'inside a glass tube' },
    clay: {
      effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.6 } }],
      words: 'inside a clay pot',
    },
    cistern: {
      effects: [{ deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.45, air: 0.15 } }],
      words: 'in a deep cistern',
    },
    tin: {
      effects: [{ deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.4 } }],
      words: 'in a small tin',
    },
    shell: {
      effects: [
        { deviceId: 'vessel', preset: 'Shell to the ear', params: { mix: 0.45, air: 0.5 } },
      ],
      words: 'inside a shell',
    },
    ah: {
      effects: [{ deviceId: 'imprint', preset: 'Open vowel' }],
      words: ', shaped to an open vowel',
    },
    oo: {
      effects: [{ deviceId: 'imprint', preset: 'Round vowel' }],
      words: ', shaped to a round vowel',
    },
    hollow: {
      effects: [{ deviceId: 'imprint', preset: 'Hollow tube', params: { amount: 0.9 } }],
      words: 'with the colour of a hollow tube',
    },
    felted: {
      effects: [{ deviceId: 'sift', preset: 'Soft hammers' }],
      words: 'with every stroke felted',
    },
    airsplit: {
      effects: [{ deviceId: 'sift', preset: 'Wide air' }],
      words: 'with its air spread to the sides',
    },
    strikes: {
      effects: [{ deviceId: 'sift', preset: 'Strikes forward' }],
      words: 'with its strokes pushed forward',
    },
    bowed: {
      effects: [
        { deviceId: 'swell', preset: 'Bowed' },
        { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 1 } },
      ],
      words: 'with each stroke bowed away',
    },
    smaller: {
      effects: [{ deviceId: 'size', preset: 'Smaller', params: { mix: 0.85 } }],
      words: 'in a body made smaller',
    },
    larger: {
      effects: [{ deviceId: 'size', preset: 'Larger', params: { size: 0.55 } }],
      words: 'in a body made larger',
    },
    bridge: {
      effects: [{ deviceId: 'buzzing-bridge', preset: 'Paper edge', params: { amount: 0.2 } }],
      words: 'over a paper edge that buzzes faintly',
    },
    double: {
      effects: [{ deviceId: 'stereo-detune', preset: 'Faint width' }],
      words: ', doubled by a hair',
    },
    twins: {
      effects: [{ deviceId: 'stereo-detune', preset: 'Wider' }],
      words: ', doubled wide to both sides',
    },
    booth: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Small booth' }],
      words: 'in a small booth',
    },
    room: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.2 } }],
      words: 'in a short room',
    },
    chamber: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber' }],
      words: 'in a tight chamber',
    },
    tiles: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.22 } }],
      words: 'in a small tiled room',
    },
    darkroom: {
      effects: [{ deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } }],
      words: 'in a small dark room',
    },
    lightroom: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.22 } }],
      words: 'in a bright chamber',
    },
    gated: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.3 } }],
      words: 'in a room that shuts at once',
    },
    sill: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Texture', params: { lowCut: 110 } },
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.22 } },
      ],
      words: 'in a short room, its rumble cut',
    },
    millrace: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Drone', params: { lowCut: 48 } },
        { deviceId: 'tremolo', preset: 'Sea swell', params: { depth: 0.6 } },
      ],
      words: ', its rumble cut, swelling as the sea does',
    },
    grille: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Drone', params: { lowCut: 45 } },
        { deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.33 } },
      ],
      words: 'in a narrow tunnel, its rumble cut',
    },
    wallwind: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Layer', params: { lowCut: 55 } },
        { deviceId: 'glimmer', preset: 'Slow weather' },
      ],
      words: 'with its rumble cut and slow shade passing over it',
    },
    sway: {
      effects: [{ deviceId: 'tremolo', preset: 'Sea swell', params: { depth: 0.6 } }],
      words: ', swelling as the sea does',
    },
    panned: {
      effects: [{ deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.65 } }],
      words: ', crossing slowly from side to side',
    },
    harmonic: {
      effects: [{ deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { depth: 0.7 } }],
      words: 'with a tremolo between low and high',
    },
    amptrem: {
      effects: [
        { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.45 } },
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.12 } },
      ],
      words: 'under an even tremolo',
    },
    chorale: {
      effects: [{ deviceId: 'rotary', preset: 'Chorale', params: { mix: 0.8 } }],
      words: 'through a slow rotary speaker',
    },
    whirl: {
      effects: [{ deviceId: 'rotary', preset: 'Tremolo', params: { mix: 0.6 } }],
      words: 'through a fast rotary speaker',
    },
    horn: {
      effects: [{ deviceId: 'rotary', preset: 'Across the room' }],
      words: 'through a rotary speaker across a room',
    },
    swirl: {
      effects: [{ deviceId: 'phaser', preset: 'Slow swirl' }],
      words: 'in a slow swirl of phase',
    },
    glacial: {
      effects: [
        { deviceId: 'flanger', preset: 'Glacial drift', params: { mix: 0.35, feedback: 35 } },
      ],
      words: 'with a comb drifting slowly over it',
    },
    negative: {
      effects: [
        {
          deviceId: 'flanger',
          preset: 'Negative hollow',
          params: { mix: 0.35, feedback: -45, rate: 0.12 },
        },
      ],
      words: 'hollowed by a slow moving comb',
    },
    ensemble: {
      effects: [{ deviceId: 'chorus', preset: 'Lush ensemble' }],
      words: ', made an ensemble',
    },
    deepsea: {
      effects: [
        { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.45 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'in a deep slow chorus',
    },
    slowdrift: {
      effects: [{ deviceId: 'chorus', preset: 'Slow drift' }],
      words: ', drifting slowly apart in a chorus',
    },
    currents: {
      effects: [{ deviceId: 'currents', preset: 'Slow water' }],
      words: 'in bands that swell like slow water',
    },
    ripples: {
      effects: [{ deviceId: 'currents', preset: 'Ripples', params: { depth: 0.55 } }],
      words: 'with ripples running through its bands',
    },
    glimmer: {
      effects: [{ deviceId: 'glimmer', preset: 'Light on water' }],
      words: 'with its partials catching the light',
    },
    weathered: {
      effects: [{ deviceId: 'glimmer', preset: 'Slow weather' }],
      words: 'with slow shade passing over its bands',
    },
    flock: {
      effects: [
        { deviceId: 'murmuration', preset: 'Evening flock' },
        { deviceId: 'ambient-eq', preset: 'Open' },
      ],
      words: 'as a small flock round the head',
    },
    breathing: {
      effects: [{ deviceId: 'breath', preset: 'Calm breath', params: { depth: 0.55 } }],
      words: ', breathing in and out',
    },
    throb: {
      effects: [{ deviceId: 'pulses', preset: 'Soft throb' }],
      words: 'in a soft even throb',
    },
    weave: {
      effects: [{ deviceId: 'pulses', preset: 'Wide weave', params: { floor: 0.5 } }],
      words: 'gated on two weaving patterns',
    },
    round: {
      effects: [{ deviceId: 'around', preset: 'Slow circle' }],
      words: ', carried slowly round the head',
    },
    pendulum: {
      effects: [
        { deviceId: 'around', preset: 'Wide pendulum' },
        { deviceId: 'ambient-eq', preset: 'Open' },
      ],
      words: ', swung from ear to ear',
    },
    vibrato: {
      effects: [{ deviceId: 'late-vibrato', preset: 'Singer' }],
      words: 'with a vibrato that comes late',
    },
    glide: {
      effects: [
        {
          deviceId: 'auto-filter',
          preset: 'Glacial low-pass',
          params: { cutoffHz: 900, lfoRateHz: 0.07 },
        },
      ],
      words: 'behind a filter that opens very slowly',
    },
    gate: {
      effects: [{ deviceId: 'auto-filter', preset: 'Low-pass gate', params: { cutoffHz: 550 } }],
      words: 'through a closed low-pass filter',
    },
    notch: {
      effects: [{ deviceId: 'auto-filter', preset: 'Slow notch' }],
      words: 'with a slow notch moving through it',
    },
    wah: {
      effects: [{ deviceId: 'auto-filter', preset: 'Touch wah', params: { resonance: 2.5 } }],
      words: 'through a filter that follows the touch',
    },
    slap: {
      effects: [{ deviceId: 'tape-echo', preset: 'Single slap' }],
      words: 'with one short slap of tape',
    },
    repeats: {
      effects: [{ deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.28 } }],
      words: 'with warm tape repeats',
    },
    dotted: {
      effects: [{ deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.3 } }],
      words: 'with dotted tape echoes',
    },
    heads: {
      effects: [{ deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.32 } }],
      words: 'with three heads of tape echo',
    },
    darktrail: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.32, feedback: 0.6 } },
      ],
      words: 'with a long dark trail of tape',
    },
    thinecho: {
      effects: [{ deviceId: 'tape-echo', preset: 'Thin and fading', params: { mix: 0.3 } }],
      words: 'with thin fading echoes',
    },
    bucket: {
      effects: [{ deviceId: 'analog-delay', preset: 'Dark echo' }],
      words: 'with dark echoes behind it',
    },
    clean: {
      effects: [{ deviceId: 'analog-delay', preset: 'Clean echo', params: { mix: 0.28 } }],
      words: 'with clean quick echoes',
    },
    murky: {
      effects: [{ deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.3, feedback: 0.5 } }],
      words: 'with murky late echoes',
    },
    octhop: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Octave hop', params: { mix: 0.28, feedback: 0.45 } },
      ],
      words: 'with echoes that hop by octaves',
    },
    backwards: {
      effects: [{ deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.4 } }],
      words: 'with slow swells played backwards',
    },
    mirror: {
      effects: [{ deviceId: 'reverse-delay', preset: 'Faint reflection', params: { mix: 0.28 } }],
      words: 'with a faint reflection backwards',
    },
    stone: {
      effects: [{ deviceId: 'skipping-stone', preset: 'Skipping stone', params: { mix: 0.32 } }],
      words: 'with echoes that skip like a pebble',
    },
    slowing: {
      effects: [{ deviceId: 'skipping-stone', preset: 'Slowing bounces', params: { mix: 0.3 } }],
      words: 'with echoes that slow down',
    },
    stars: {
      effects: [{ deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.32 } }],
      words: 'with a few echoes scattered round it',
    },
    farstar: {
      effects: [{ deviceId: 'constellation', preset: 'One far star' }],
      words: 'with one late echo far to the side',
    },
    prism: {
      effects: [{ deviceId: 'prism', preset: 'Low to high' }],
      words: 'unfolding from low to high in echoes',
    },
    fan: {
      effects: [{ deviceId: 'prism', preset: 'Long fan', params: { mix: 0.28 } }],
      words: 'with echoes that fan out by colour',
    },
    crystals: {
      effects: [{ deviceId: 'grain-delay', preset: 'Faint glints' }],
      words: 'with grains of echo glinting above',
    },
    frozen: {
      effects: [
        { deviceId: 'grain-delay', preset: 'Frozen haze', params: { mix: 0.3, feedback: 0.75 } },
      ],
      words: 'in a frozen haze of grains',
    },
    cloud: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.4 } }],
      words: 'in a soft cloud of grains',
    },
    octrain: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Octave rain', params: { mix: 0.3 } }],
      words: 'in a rain of grains an octave up',
    },
    smear: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Slow smear', params: { mix: 0.45 } }],
      words: 'smeared slowly into grains',
    },
    glints: {
      effects: [
        { deviceId: 'glints', preset: 'First light' },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'with sparks an octave or two above',
    },
    dust: {
      effects: [
        { deviceId: 'glints', preset: 'Faint dust' },
        { deviceId: 'ambient-eq', preset: 'Open' },
      ],
      words: 'with a faint dust of sparks',
    },
    cascade: {
      effects: [{ deviceId: 'cascade', preset: 'Glass rain', params: { mix: 0.3 } }],
      words: 'with little loops raining octaves',
    },
    tiles2: {
      effects: [{ deviceId: 'cascade', preset: 'Slow tiles', params: { mix: 0.35 } }],
      words: 'with slow tiles of loops behind',
    },
    orbits: {
      effects: [{ deviceId: 'orbits', preset: 'Slow phasing', params: { mix: 0.32 } }],
      words: 'with loops drifting out of phase',
    },
    memory: {
      effects: [{ deviceId: 'echo-memory', preset: 'Recalling', params: { mix: 0.35 } }],
      words: 'with moments of it drifting back',
    },
    decks: {
      effects: [{ deviceId: 'tape-loop', preset: 'Two decks', params: { mix: 0.35 } }],
      words: 'on a loop between two tape decks',
    },
    onesec: {
      effects: [{ deviceId: 'tape-loop', preset: 'One second round' }],
      words: 'on a one second loop of tape',
    },
    bed: {
      effects: [{ deviceId: 'micro-looper', preset: 'Soft bed', params: { mix: 0.3 } }],
      words: 'with a soft loop of itself under it',
    },
    room2: {
      effects: [{ deviceId: 'generations', preset: 'Slow dissolve', params: { mix: 0.4 } }],
      words: 'dissolving into the tones of a room',
    },
    melt: {
      effects: [{ deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.35 } }],
      words: 'with a tail that sags like wax',
    },
    vapour: {
      effects: [{ deviceId: 'melt', preset: 'Evaporate', params: { mix: 0.3 } }],
      words: 'with a tail that thins into the air',
    },
    leaves: {
      effects: [{ deviceId: 'falling', preset: 'Slow sighs', params: { mix: 0.3 } }],
      words: 'with pieces that fall like leaves',
    },
    shadow: {
      effects: [{ deviceId: 'sine-shadow', preset: 'Sine shadow', params: { mix: 0.4 } }],
      words: 'with a slow shadow of sines',
    },
    octshadow: {
      effects: [{ deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.3 } }],
      words: 'with a halo of sines an octave up',
    },
    lowshadow: {
      effects: [{ deviceId: 'sine-shadow', preset: 'Low shadow', params: { mix: 0.35 } }],
      words: 'with sines an octave under it',
    },
    mist: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.45 } }],
      words: 'in a hanging spectral mist',
    },
    dissolve: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 0.5 } }],
      words: 'dissolving into a slow spectral wash',
    },
    whisper: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Whisper', params: { mix: 0.6 } }],
      words: 'blurred to a whisper',
    },
    catch: {
      effects: [{ deviceId: 'sustainer', preset: 'Thin halo', params: { mix: 0.35 } }],
      words: ', caught and held behind itself',
    },
    follower: {
      effects: [{ deviceId: 'pad-follower', preset: 'Slow swell', params: { mix: 0.35 } }],
      words: 'with a soft string section behind it',
    },
    cellos: {
      effects: [{ deviceId: 'pad-follower', preset: 'Dark cellos', params: { mix: 0.35 } }],
      words: 'with dark low strings growing behind',
    },
    stretched: {
      effects: [{ deviceId: 'stretch', preset: 'Half time haze', params: { mix: 0.35 } }],
      words: 'stretched to a slow cloud behind',
    },
    common: {
      effects: [{ deviceId: 'common-tones', preset: 'Long hold', params: { mix: 0.5 } }],
      words: 'where only held tones hang on',
    },
    drifter: {
      effects: [{ deviceId: 'spectral-drifter', preset: 'Fifth above', params: { mix: 0.3 } }],
      words: 'with its grains drifting to the fifth',
    },
    seasons: {
      effects: [{ deviceId: 'seasons', preset: 'Deep winter' }],
      words: 'in the thin cold of winter',
    },
    summer: {
      effects: [{ deviceId: 'seasons', preset: 'High summer' }],
      words: 'in a warm wide summer air',
    },
    sunk: {
      effects: [{ deviceId: 'underwater', preset: 'Just under' }],
      words: 'just under water',
    },
    deepwater: {
      effects: [
        { deviceId: 'underwater', preset: 'Half in' },
        { deviceId: 'ambient-eq', preset: 'Open' },
      ],
      words: 'half under water',
    },
    rain: {
      effects: [
        { deviceId: 'weather', preset: 'Light rain' },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'out in a light rain',
    },
    hiss: {
      effects: [
        { deviceId: 'noise-floor', preset: 'Faint hiss' },
        { deviceId: 'tape', preset: 'Quarter inch' },
      ],
      words: 'over a floor of tape hiss',
    },
    bowls: {
      effects: [{ deviceId: 'bowls', preset: 'Faint halo' }],
      words: 'with singing bowls that answer',
    },
    ringmod: {
      effects: [{ deviceId: 'ring', preset: 'Faint halo' }],
      words: 'with a faint halo of ring modulation',
    },
    organs: {
      effects: [{ deviceId: 'octaves', preset: 'Organ' }],
      words: 'with its octaves above and below',
    },
    sub: {
      effects: [{ deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6 } }],
      words: 'with an octave under it',
    },
    glassoct: {
      effects: [{ deviceId: 'octaves', preset: 'Glass octaves', params: { up2: 0.3 } }],
      words: 'with glass octaves above',
    },
    flutes: {
      effects: [{ deviceId: 'stops', preset: 'Flute stops' }],
      words: 'with flute stops over it',
    },
    principal: {
      effects: [{ deviceId: 'stops', preset: 'Principal chorus', params: { mix: 0.6 } }],
      words: 'with a principal chorus of stops',
    },
    pedal: {
      effects: [{ deviceId: 'stops', preset: 'Pedal under' }],
      words: 'with a pedal stop under it',
    },
    fifths: {
      effects: [{ deviceId: 'stops', preset: 'Open fifths', params: { mix: 0.45 } }],
      words: 'with open fifths beside it',
    },
    darkhall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall' }],
      words: 'in a long dark hall',
    },
    halo: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Faint halo' }],
      words: 'in a faint halo of hall',
    },
    airtail: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail' }],
      words: 'with a long airy tail',
    },
    undertow: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow' }],
      words: 'over a warm undertow of hall',
    },
    nave: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.4 } }],
      words: 'in a vast nave',
    },
    faraway: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.65 } }],
      words: 'heard from far away',
    },
    valley: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.35 } }],
      words: 'across an open valley',
    },
    cave: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.38 } }],
      words: 'in a dark cave',
    },
    tank: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.25 } }],
      words: 'in a small bright tank',
    },
    gusts: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.42 } }],
      words: 'in a hall that breathes',
    },
    late: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Late arrival', params: { mix: 0.35 } }],
      words: 'with a hall that answers late',
    },
    plate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.28 } }],
      words: 'on a plate',
    },
    longplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
      words: 'on a long plate',
    },
    darkplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.33 } }],
      words: 'on a dark plate',
    },
    space: {
      effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.33 } }],
      words: 'in a wide open space',
    },
    bloom: {
      effects: [{ deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.38 } }],
      words: 'in a space that blooms late',
    },
    lowcath: {
      effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.38 } }],
      words: 'under a low dark vault',
    },
    thinair: {
      effects: [{ deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.32 } }],
      words: 'in thin high air',
    },
    farecho: {
      effects: [{ deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.3 } }],
      words: 'with far loose echoes off the walls',
    },
    tunnel: {
      effects: [{ deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.33 } }],
      words: 'in a narrow tunnel',
    },
    latehall: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Late hall' }],
      words: 'in a hall a long way behind',
    },
    cathedral: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } }],
      words: 'under a cathedral roof',
    },
    shine: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Shining tail' }],
      words: 'with a long shining tail',
    },
    glimhall: {
      effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.28 } }],
      words: 'with a glimmer rising in the hall',
    },
    choirhall: {
      effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.3 } }],
      words: 'with a choir rising in the hall',
    },
    fifthhall: {
      effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { mix: 0.28 } }],
      words: 'with fifths rising in the hall',
    },
    undershim: {
      effects: [{ deviceId: 'shimmer', preset: 'Undertow', params: { mix: 0.3 } }],
      words: 'with octaves sinking in the hall',
    },
    glasshim: {
      effects: [{ deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.25 } }],
      words: 'with a glass shimmer high above',
    },
    glow: {
      effects: [
        { deviceId: 'bloom-reverb', preset: 'Octave halo', params: { mix: 0.28, bloom: 0.6 } },
      ],
      words: 'in a tail that glows upward',
    },
    winter: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.35 } }],
      words: 'in a tail that drifts downward',
    },
    ascent: {
      effects: [{ deviceId: 'spiral', preset: 'Slow ascent', params: { mix: 0.28 } }],
      words: 'in a tail that climbs',
    },
    descent: {
      effects: [{ deviceId: 'spiral', preset: 'Slow descent', params: { mix: 0.3 } }],
      words: 'in a tail that sinks',
    },
    cavern: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.28 } }],
      words: 'in a cavern of small echoes',
    },
    shaft: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Mine shaft', params: { mix: 0.28 } }],
      words: 'down a mine shaft',
    },
    vowels: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.33 } }],
      words: 'in a hall that sings ah',
    },
    monks: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.35 } }],
      words: 'in a hall with low voices in it',
    },
    oobehind: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind' }],
      words: 'with an oo sung behind',
    },
    chapel: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel' }],
      words: 'in a small chapel',
    },
    strings: {
      effects: [{ deviceId: 'sympathetic', preset: 'Short halo', params: { mix: 0.35 } }],
      words: 'with open strings ringing along',
    },
    harpring: {
      effects: [{ deviceId: 'sympathetic', preset: 'Long ring', params: { mix: 0.35 } }],
      words: "with a harp's strings left open",
    },
    spring: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } }],
      words: 'on two springs',
    },
    drip: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.25 } }],
      words: 'on springs that drip',
    },
    bloomed: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.38 } }],
      words: 'in a reverb that swells and fades',
    },
    reversed: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.38 } }],
      words: 'in a reverb that rises backwards',
    },
    wall: {
      effects: [{ deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.4 } }],
      words: 'in a warm fuzzy wall',
    },
    blanketw: {
      effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.25 } }],
      words: 'under a wool blanket of fuzz',
    },
    fog: {
      effects: [{ deviceId: 'fog', preset: 'Soft cloud' }],
      words: 'in a soft fog with no tail',
    },
    veil: {
      effects: [{ deviceId: 'fog', preset: 'Morning mist', params: { mix: 0.6 } }],
      words: 'behind a thin veil',
    },
    deepfog: {
      effects: [{ deviceId: 'fog', preset: 'Deep fog', params: { mix: 0.8 } }],
      words: 'lost in deep fog',
    },
    across: {
      effects: [{ deviceId: 'distance', preset: 'Across the room' }],
      words: 'heard across a room',
    },
    nextdoor: {
      effects: [{ deviceId: 'distance', preset: 'Next door' }],
      words: 'heard from next door',
    },
    farshore: {
      effects: [{ deviceId: 'distance', preset: 'Far shore' }],
      words: 'heard from a far shore',
    },
    echohall: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Short and soft' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
      ],
      words: 'with tape echoes in a hall',
    },
    chorushall: {
      effects: [
        { deviceId: 'chorus', preset: 'Wide chorus', params: { mix: 0.35 } },
        { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.25 } },
      ],
      words: 'in a chorus and a warm hall',
    },
    trempl: {
      effects: [
        { deviceId: 'tremolo', preset: 'Gentle breath', params: { depth: 0.5 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
      ],
      words: 'in a slow tremolo on a plate',
    },
    tapespring: {
      effects: [
        { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.05 } },
        { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.18 } },
      ],
      words: 'on worn tape and springs',
    },
    phasehall: {
      effects: [
        {
          deviceId: 'phaser',
          preset: 'Glacial sweep',
          params: { mix: 0.4, rate: 0.07, feedback: 35 },
        },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
      ],
      words: 'in slow phase, in a hall',
    },
    driveroom: {
      effects: [
        { deviceId: 'analog-drive', preset: 'First hint', params: { drive: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'driven a little in a room',
    },
    sharprev: {
      effects: [
        { deviceId: 'sustainer', preset: 'Wavering choir', params: { mix: 0.3 } },
        { deviceId: 'plate-reverb', preset: 'Faint sheen' },
      ],
      words: 'with a wavering choir held behind',
    },
    halfdown: {
      effects: [
        { deviceId: 'half-speed', preset: 'Thin shadow' },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'with a half-speed shadow under it',
    },
    pitchup: {
      effects: [
        { deviceId: 'pitch-shifter', preset: 'Octave up', params: { mix: 0.22 } },
        { deviceId: 'plate-reverb', preset: 'Small plate' },
      ],
      words: 'with an octave above, on a plate',
    },
    bells2: {
      effects: [
        { deviceId: 'warp', preset: 'Soft chime', params: { mix: 0.45 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
      ],
      words: ', its partials bent to a soft chime',
    },
  },
  phrases: {
    opened: {
      notes: [
        { atSec: 0, durSec: 6.8, note: 50, gain: 0.78 },
        { atSec: 0, durSec: 6.8, note: 57, gain: 0.65 },
        { atSec: 0, durSec: 6.8, note: 65, gain: 0.65 },
        { atSec: 0, durSec: 6.8, note: 72, gain: 0.65 },
        { atSec: 0, durSec: 6.8, note: 76, gain: 0.52 },
      ],
    },
    tides: {
      notes: [
        { atSec: 0, durSec: 3.4, note: 50, gain: 0.78 },
        { atSec: 0, durSec: 3.4, note: 57, gain: 0.65 },
        { atSec: 0, durSec: 3.4, note: 64, gain: 0.65 },
        { atSec: 0, durSec: 3.4, note: 72, gain: 0.65 },
        { atSec: 3.5, durSec: 3.6, note: 43, gain: 0.78 },
        { atSec: 3.5, durSec: 3.6, note: 59, gain: 0.65 },
        { atSec: 3.5, durSec: 3.6, note: 65, gain: 0.65 },
        { atSec: 3.5, durSec: 3.6, note: 69, gain: 0.65 },
      ],
    },
    suspend: {
      notes: [
        { atSec: 0, durSec: 2.3, note: 45, gain: 0.78 },
        { atSec: 0, durSec: 2.3, note: 60, gain: 0.59 },
        { atSec: 0, durSec: 2.3, note: 64, gain: 0.59 },
        { atSec: 0, durSec: 1.2, note: 72, gain: 0.78 },
        { atSec: 1.2, durSec: 2.3, note: 71, gain: 0.65 },
        { atSec: 2.4, durSec: 2.3, note: 50, gain: 0.78 },
        { atSec: 2.4, durSec: 2.3, note: 57, gain: 0.59 },
        { atSec: 2.4, durSec: 2.3, note: 65, gain: 0.59 },
        { atSec: 3.6, durSec: 2.4, note: 69, gain: 0.72 },
        { atSec: 4.8, durSec: 2.4, note: 43, gain: 0.78 },
        { atSec: 4.8, durSec: 2.4, note: 59, gain: 0.59 },
        { atSec: 4.8, durSec: 2.4, note: 62, gain: 0.59 },
        { atSec: 6, durSec: 1.2, note: 67, gain: 0.65 },
      ],
    },
    lines: {
      notes: [
        { atSec: 0, durSec: 1.5, note: 76, gain: 0.78 },
        { atSec: 0, durSec: 3, note: 57, gain: 0.65 },
        { atSec: 1.5, durSec: 1.5, note: 74, gain: 0.65 },
        { atSec: 3, durSec: 1.5, note: 72, gain: 0.72 },
        { atSec: 3, durSec: 1.5, note: 60, gain: 0.65 },
        { atSec: 4.5, durSec: 1, note: 71, gain: 0.65 },
        { atSec: 4.5, durSec: 2.8, note: 62, gain: 0.65 },
        { atSec: 5.5, durSec: 1.8, note: 69, gain: 0.72 },
      ],
    },
    long: { notes: [{ atSec: 0, durSec: 6.9, note: 62, gain: 0.9 }] },
    built: {
      notes: [
        { atSec: 0, durSec: 7.1, note: 57, gain: 0.78 },
        { atSec: 1.1, durSec: 6, note: 64, gain: 0.65 },
        { atSec: 2.2, durSec: 4.9, note: 67, gain: 0.65 },
        { atSec: 3.3, durSec: 3.8, note: 72, gain: 0.65 },
        { atSec: 4.4, durSec: 2.7, note: 74, gain: 0.59 },
      ],
    },
    quartal: {
      notes: [
        { atSec: 0, durSec: 2.3, note: 57, gain: 0.72 },
        { atSec: 0, durSec: 2.3, note: 62, gain: 0.65 },
        { atSec: 0, durSec: 2.3, note: 67, gain: 0.65 },
        { atSec: 0, durSec: 2.3, note: 72, gain: 0.65 },
        { atSec: 2.4, durSec: 2.3, note: 53, gain: 0.72 },
        { atSec: 2.4, durSec: 2.3, note: 62, gain: 0.59 },
        { atSec: 2.4, durSec: 2.3, note: 67, gain: 0.59 },
        { atSec: 2.4, durSec: 2.3, note: 69, gain: 0.65 },
        { atSec: 4.8, durSec: 2.4, note: 55, gain: 0.72 },
        { atSec: 4.8, durSec: 2.4, note: 62, gain: 0.65 },
        { atSec: 4.8, durSec: 2.4, note: 65, gain: 0.59 },
        { atSec: 4.8, durSec: 2.4, note: 72, gain: 0.65 },
      ],
    },
    chorale: {
      notes: [
        { atSec: 0, durSec: 1.8, note: 48, gain: 0.78 },
        { atSec: 0, durSec: 1.8, note: 64, gain: 0.65 },
        { atSec: 0, durSec: 1.8, note: 67, gain: 0.65 },
        { atSec: 0, durSec: 1.8, note: 76, gain: 0.72 },
        { atSec: 1.85, durSec: 1.8, note: 53, gain: 0.78 },
        { atSec: 1.85, durSec: 1.8, note: 60, gain: 0.65 },
        { atSec: 1.85, durSec: 1.8, note: 69, gain: 0.65 },
        { atSec: 1.85, durSec: 1.8, note: 74, gain: 0.65 },
        { atSec: 3.7, durSec: 1.6, note: 55, gain: 0.78 },
        { atSec: 3.7, durSec: 1.6, note: 59, gain: 0.65 },
        { atSec: 3.7, durSec: 0.85, note: 67, gain: 0.65 },
        { atSec: 4.5, durSec: 0.8, note: 65, gain: 0.59 },
        { atSec: 3.7, durSec: 1.6, note: 74, gain: 0.65 },
        { atSec: 5.4, durSec: 2, note: 57, gain: 0.78 },
        { atSec: 5.4, durSec: 2, note: 60, gain: 0.65 },
        { atSec: 5.4, durSec: 2, note: 64, gain: 0.65 },
        { atSec: 5.4, durSec: 2, note: 72, gain: 0.65 },
      ],
    },
    fifth: {
      notes: [
        { atSec: 0, durSec: 7.1, note: 45, gain: 0.78 },
        { atSec: 0.4, durSec: 6.7, note: 52, gain: 0.65 },
        { atSec: 1.4, durSec: 1.8, note: 64, gain: 0.65 },
        { atSec: 3.2, durSec: 1.6, note: 67, gain: 0.65 },
        { atSec: 4.8, durSec: 2.4, note: 62, gain: 0.65 },
      ],
    },
    ground: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 38, gain: 0.78 },
        { atSec: 0.6, durSec: 6.6, note: 45, gain: 0.65 },
        { atSec: 2, durSec: 5.2, note: 57, gain: 0.59 },
        { atSec: 3.6, durSec: 3.6, note: 64, gain: 0.52 },
      ],
    },
    chant: {
      notes: [
        { atSec: 0, durSec: 1.5, note: 62, gain: 0.78 },
        { atSec: 1.4, durSec: 1, note: 64, gain: 0.65 },
        { atSec: 2.3, durSec: 1.6, note: 67, gain: 0.78 },
        { atSec: 3.8, durSec: 1, note: 65, gain: 0.65 },
        { atSec: 4.7, durSec: 1, note: 64, gain: 0.65 },
        { atSec: 5.6, durSec: 1.7, note: 62, gain: 0.72 },
      ],
    },
    response: {
      notes: [
        { atSec: 0, durSec: 2.2, note: 69, gain: 0.78 },
        { atSec: 1.2, durSec: 1.8, note: 72, gain: 0.65 },
        { atSec: 3, durSec: 2, note: 57, gain: 0.72 },
        { atSec: 3, durSec: 2, note: 64, gain: 0.59 },
        { atSec: 5, durSec: 2.2, note: 65, gain: 0.65 },
        { atSec: 5, durSec: 2.2, note: 74, gain: 0.59 },
      ],
    },
    high: {
      notes: [
        { atSec: 0, durSec: 2.5, note: 84, gain: 0.78 },
        { atSec: 1.3, durSec: 2.5, note: 79, gain: 0.65 },
        { atSec: 2.6, durSec: 2.4, note: 88, gain: 0.59 },
        { atSec: 3.7, durSec: 3.2, note: 76, gain: 0.78 },
        { atSec: 5, durSec: 2.2, note: 83, gain: 0.65 },
      ],
    },
    peal: {
      notes: [
        { atSec: 0, durSec: 2, note: 79, gain: 0.85 },
        { atSec: 0.45, durSec: 2, note: 76, gain: 0.72 },
        { atSec: 0.9, durSec: 2, note: 72, gain: 0.72 },
        { atSec: 1.35, durSec: 2, note: 67, gain: 0.72 },
        { atSec: 1.8, durSec: 2.4, note: 62, gain: 0.78 },
        { atSec: 3.8, durSec: 2, note: 77, gain: 0.78 },
        { atSec: 4.25, durSec: 2, note: 72, gain: 0.65 },
        { atSec: 4.7, durSec: 2, note: 69, gain: 0.65 },
        { atSec: 5.15, durSec: 2.1, note: 64, gain: 0.72 },
      ],
    },
    toll: {
      notes: [
        { atSec: 0, durSec: 3.2, note: 50, gain: 0.9 },
        { atSec: 0.8, durSec: 2.6, note: 69, gain: 0.59 },
        { atSec: 3.6, durSec: 3.6, note: 48, gain: 0.9 },
        { atSec: 4.4, durSec: 2.8, note: 67, gain: 0.59 },
        { atSec: 5.2, durSec: 2, note: 76, gain: 0.45 },
      ],
    },
    seeds: {
      notes: [
        { atSec: 0, durSec: 0.4, note: 69, gain: 0.9 },
        { atSec: 0.5, durSec: 0.3, note: 76, gain: 0.65 },
        { atSec: 1.1, durSec: 0.4, note: 72, gain: 0.78 },
        { atSec: 1.5, durSec: 0.8, note: 64, gain: 0.72 },
        { atSec: 2.6, durSec: 0.4, note: 67, gain: 0.85 },
        { atSec: 3, durSec: 0.3, note: 74, gain: 0.65 },
        { atSec: 3.4, durSec: 0.9, note: 71, gain: 0.78 },
        { atSec: 4.7, durSec: 0.4, note: 62, gain: 0.78 },
        { atSec: 5.1, durSec: 0.4, note: 69, gain: 0.72 },
        { atSec: 5.5, durSec: 1.4, note: 65, gain: 0.85 },
      ],
    },
    ostinato: {
      notes: [
        { atSec: 0, durSec: 0.45, note: 57, gain: 0.9 },
        { atSec: 0.5, durSec: 0.45, note: 64, gain: 0.65 },
        { atSec: 1, durSec: 0.45, note: 72, gain: 0.78 },
        { atSec: 1.5, durSec: 0.45, note: 64, gain: 0.59 },
        { atSec: 2, durSec: 0.45, note: 57, gain: 0.85 },
        { atSec: 2.5, durSec: 0.45, note: 65, gain: 0.65 },
        { atSec: 3, durSec: 0.45, note: 71, gain: 0.78 },
        { atSec: 3.5, durSec: 0.45, note: 65, gain: 0.59 },
        { atSec: 4, durSec: 0.45, note: 57, gain: 0.85 },
        { atSec: 4.5, durSec: 0.45, note: 62, gain: 0.65 },
        { atSec: 5, durSec: 0.45, note: 69, gain: 0.78 },
        { atSec: 5.5, durSec: 1.6, note: 64, gain: 0.72 },
      ],
    },
    hocket: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 50, gain: 0.9 },
        { atSec: 0.4, durSec: 0.5, note: 72, gain: 0.65 },
        { atSec: 0.9, durSec: 0.5, note: 57, gain: 0.78 },
        { atSec: 1.2, durSec: 0.5, note: 76, gain: 0.65 },
        { atSec: 1.8, durSec: 0.6, note: 53, gain: 0.9 },
        { atSec: 2.1, durSec: 0.5, note: 74, gain: 0.65 },
        { atSec: 2.8, durSec: 0.5, note: 60, gain: 0.78 },
        { atSec: 3.1, durSec: 0.5, note: 69, gain: 0.65 },
        { atSec: 3.6, durSec: 0.7, note: 55, gain: 0.9 },
        { atSec: 4, durSec: 0.5, note: 71, gain: 0.65 },
        { atSec: 4.5, durSec: 0.6, note: 59, gain: 0.78 },
        { atSec: 4.9, durSec: 0.5, note: 74, gain: 0.59 },
        { atSec: 5.4, durSec: 1.8, note: 48, gain: 0.9 },
        { atSec: 5.8, durSec: 1.4, note: 72, gain: 0.65 },
      ],
    },
    harp: {
      notes: [
        { atSec: 0, durSec: 2.6, note: 48, gain: 0.78 },
        { atSec: 0.18, durSec: 2.5, note: 55, gain: 0.65 },
        { atSec: 0.36, durSec: 2.4, note: 64, gain: 0.65 },
        { atSec: 0.54, durSec: 2.3, note: 67, gain: 0.65 },
        { atSec: 0.72, durSec: 2.2, note: 71, gain: 0.65 },
        { atSec: 0.9, durSec: 2.2, note: 74, gain: 0.65 },
        { atSec: 3.4, durSec: 3.2, note: 45, gain: 0.78 },
        { atSec: 3.58, durSec: 3.1, note: 52, gain: 0.65 },
        { atSec: 3.76, durSec: 3, note: 60, gain: 0.65 },
        { atSec: 3.94, durSec: 2.9, note: 67, gain: 0.65 },
        { atSec: 4.12, durSec: 2.8, note: 71, gain: 0.65 },
        { atSec: 4.3, durSec: 2.7, note: 76, gain: 0.59 },
      ],
    },
    rain: {
      notes: [
        { atSec: 0, durSec: 0.25, note: 81, gain: 0.78 },
        { atSec: 0.7, durSec: 0.25, note: 76, gain: 0.65 },
        { atSec: 1, durSec: 0.25, note: 84, gain: 0.52 },
        { atSec: 1.9, durSec: 0.3, note: 79, gain: 0.78 },
        { atSec: 2.3, durSec: 0.25, note: 72, gain: 0.65 },
        { atSec: 3.3, durSec: 0.25, note: 83, gain: 0.65 },
        { atSec: 3.6, durSec: 0.3, note: 74, gain: 0.72 },
        { atSec: 4.4, durSec: 0.3, note: 77, gain: 0.65 },
        { atSec: 5.1, durSec: 0.25, note: 88, gain: 0.52 },
        { atSec: 5.4, durSec: 0.5, note: 69, gain: 0.78 },
        { atSec: 6.2, durSec: 0.8, note: 76, gain: 0.65 },
      ],
    },
    lowline: {
      notes: [
        { atSec: 0, durSec: 1.2, note: 45, gain: 0.9 },
        { atSec: 1.3, durSec: 0.5, note: 52, gain: 0.72 },
        { atSec: 1.9, durSec: 1.2, note: 50, gain: 0.85 },
        { atSec: 3.2, durSec: 1.5, note: 43, gain: 0.9 },
        { atSec: 4.9, durSec: 0.6, note: 48, gain: 0.78 },
        { atSec: 5.6, durSec: 1.6, note: 45, gain: 0.9 },
      ],
    },
    walk: {
      notes: [
        { atSec: 0, durSec: 0.8, note: 38, gain: 0.9 },
        { atSec: 0.9, durSec: 0.7, note: 45, gain: 0.78 },
        { atSec: 1.7, durSec: 0.8, note: 48, gain: 0.85 },
        { atSec: 2.6, durSec: 0.8, note: 47, gain: 0.78 },
        { atSec: 3.5, durSec: 1, note: 43, gain: 0.9 },
        { atSec: 4.6, durSec: 0.7, note: 50, gain: 0.78 },
        { atSec: 5.4, durSec: 1.8, note: 41, gain: 0.9 },
      ],
    },
    lamps: {
      notes: [
        { atSec: 0, durSec: 7, note: 55, gain: 0.72 },
        { atSec: 0.7, durSec: 6.3, note: 62, gain: 0.65 },
        { atSec: 1.5, durSec: 5.5, note: 71, gain: 0.65 },
        { atSec: 2.4, durSec: 4.6, note: 76, gain: 0.59 },
        { atSec: 3.4, durSec: 3.6, note: 81, gain: 0.52 },
      ],
    },
    steps: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 48, gain: 0.78 },
        { atSec: 0.8, durSec: 2.2, note: 64, gain: 0.6 },
        { atSec: 0.8, durSec: 2.2, note: 67, gain: 0.6 },
        { atSec: 3.2, durSec: 2, note: 65, gain: 0.6 },
        { atSec: 3.2, durSec: 2, note: 69, gain: 0.55 },
        { atSec: 5.4, durSec: 1.9, note: 62, gain: 0.6 },
        { atSec: 5.4, durSec: 1.9, note: 67, gain: 0.55 },
      ],
    },
  },
  directions: [
    {
      id: 'dissolving-pads',
      name: 'Dissolving pads',
      category: 'pad',
      rows: `
Slipway before light | Dissolving pad | return=18 width=.55 throw=.05 place=.3 second=0 tilt=-.5 haze=.4 splash=0 attack=1.4 release=5 ears=.8 blur=0.35 | glide | opened | A wide dark wave that rises slowly and is eighteen seconds on its way
Windless wheat | Dissolving pad | return=7 width=.3 throw=.35 place=.05 second=.1 tilt=.1 body=.1 haze=.1 attack=.4 release=3 anchor=.5 gap=0.6 | bare | tides | Opens clear, blurs to warm haze and stands whole again after seven seconds
Lintel and sill | Dissolving pad | return=10 width=.15 throw=.1 place=.9 tilt=-.15 body=.45 haze=.05 attack=.7 release=1.2 ears=.05 anchor=.2 blur=0.5 leak=.12 | middle | suspend | Thrown from the middle of the box, so its octave stands forward, and let go soon
Quilt over the window | Octave asleep | start=.12 freeze=0 return=24 width=.4 tilt=-.9 body=.05 haze=.6 attack=2.2 release=8 ears=1 volume=4.5 anchor=.04 | backwards | long | A dark haze already dissolved as it comes in, broad and full of breath
Loaves on the rack | Dissolving pad | return=14 width=.25 throw=.5 place=.2 second=.6 gap=.1 tilt=-.3 blur=.7 haze=.3 splash=.5 attack=.2 release=2.5 start=.28 leak=.15 volume=-0.5 | reel | quartal | Two waves close together, their quick movement smeared to one slow warm shape
Shutters thrown open | Dissolving pad | return=5 width=.02 throw=.7 place=.08 second=0 tilt=.35 blur=.05 body=.6 haze=0 splash=.4 attack=.03 release=2 ears=.5 | longplate | tides | Opens as a bright stroke, scatters in a moment and flashes whole at five seconds
Bright at the sill | Dissolving pad | return=9 width=.1 throw=.5 place=.5 tilt=.6 body=.85 haze=.15 splash=.1 attack=.15 release=4 ears=.75 anchor=.05 start=.9 | airtail | opened | A thin clear light of high harmonics that is whole within a second and then loosens
Sheets in the sun | High keys first | clock=Own return=6 width=.2 throw=.45 tilt=.4 body=.4 haze=.45 splash=.6 attack=.08 release=3 second=.4 gap=.6 volume=-2 blur=0.03 | slowdrift | quartal | A stroke of air and a bright wave behind it, whole again every six seconds
Salt on the glass | Dissolving pad | return=3 width=.05 throw=.3 place=.35 tilt=.2 blur=.35 body=1 haze=.2 attack=.05 release=1.5 ears=.9 splash=0 start=.6 | tank | suspend | A small clear body that glitters as the wave comes home every three seconds
Orange on the snow | Glass keys | leak=.14 return=8 width=.15 throw=.2 walls=Box tilt=.15 haze=.3 attack=.3 release=5 ears=.8 second=.3 anchor=.25 volume=-2 gap=0.1 start=.85 | glasshim | lines | A narrow wave that is whole after a second and leaks as it is held, rounder from there
Already underway | Dissolving pad | start=.15 return=11 width=.2 throw=.2 haze=.5 splash=0 attack=1.8 release=4 tilt=-.1 anchor=.2 ears=.7 volume=-0.5 blur=0.65 | currents | opened | Comes in dissolved and lightly airy, its double octave passing as it rises
Halfway across | Frozen twelfth | walls=Box freeze=0 start=.4 return=20 width=.35 throw=.3 place=.6 tilt=-.35 haze=.2 attack=1 release=6 body=.3 anchor=.45 | darkhall | built | Enters shortly before the octave and reaches it as you hold the key
Last third of the way | Dissolving pad | start=.68 return=13 width=.08 throw=.25 place=.15 tilt=.3 haze=.25 splash=0 attack=.6 release=3 body=.7 ears=.95 volume=-1.5 blur=0.3 | thinair | tides | Begins two thirds of the way, hazy and high, and has the return before it
Mist over the weir | Dissolving pad | start=.2 return=30 width=.85 throw=0 second=.8 gap=.9 tilt=0 haze=.85 splash=0 attack=2.6 release=7 ears=.9 blur=.5 volume=4.5 place=0.03 | mist | long | Mostly breath, two wide waves far apart passing slowly through each other
Grey turning to blue | Wind in the wall | reading=Density start=.1 return=16 width=.3 throw=.35 haze=.55 tilt=.2 anchor=.4 attack=1.2 release=2.2 body=.15 volume=5.5 clock=Shared place=0.45 | phasehall | tides | A broad airy middle, all its keys lifting together every eight seconds
Cellar during a dance | Minute drone | return=12 start=.45 width=.8 throw=.1 tilt=-.45 attack=.5 release=3 haze=.1 ears=.4 anchor=.3 blur=.2 second=0.5 gap=0.85 | iron | tides | Two rooms: the octave below first and then the key, changing places slowly
Wall with a door in it | Tunnel bass | leak=0 anchor=.35 return=5 width=.2 throw=.4 tilt=.1 body=.4 haze=.2 attack=.3 release=3 ears=.8 splash=.1 volume=-1.5 | decks | quartal | The wave goes through a wall and back, the octave under each key moving with it
Neighbours at supper | Minute drone | return=20 start=.1 width=.1 throw=.6 second=.5 gap=.7 tilt=.25 body=.65 haze=.15 attack=.9 release=4 anchor=.15 ears=1 volume=0.5 leak=.12 | wall | suspend | Bright stripes in two rooms over a low octave, wide to both sides
Barn with its doors open | Minute drone | return=8 start=.3 width=.45 throw=.25 place=.8 tilt=-.2 haze=.6 attack=1.6 release=6 body=0 anchor=.5 blur=.8 volume=1.5 | tiles2 | long | A large warm body, smeared slow, its low octave leaning in under a breath
Stair between lofts | Dissolving pad | walls=Two_rooms return=3.5 width=.3 throw=.2 second=0 tilt=.4 body=.9 haze=0 splash=0 attack=.12 release=2 anchor=.25 ears=.6 volume=2 start=.5 | swirl | built | A small clear body in two rooms that swaps its octave every few seconds
Hoop of light | Frozen twelfth | freeze=0 start=0 return=8 width=.15 throw=.2 place=.2 tilt=.1 haze=.1 attack=.5 release=4 body=.5 anchor=.45 ears=.5 blur=0.8 volume=4.5 | choirhall | built | A ring that lets its double octave, twelfth and octave stand out one after another
Finger round a cup | Ring bells | leak=.12 width=.3 throw=.1 second=.2 gap=.5 return=16 tilt=.1 body=.6 attack=1.6 release=6 anchor=.9 haze=.2 ears=.7 volume=6 | ensemble | built | A wave going round a ring at leisure over a firm pitch, overtone by overtone
Carousel after closing | Frozen twelfth | freeze=.85 start=.25 return=3 width=.05 throw=.4 tilt=-.1 body=.2 attack=.9 release=3 haze=.4 anchor=.35 ears=.95 volume=4.5 blur=0.1 | chorushall | quartal | A ring that swings to and fro round its double octave
Ring of old coins | Glass keys | leak=.1 return=12 width=.4 throw=.5 place=.6 second=.7 gap=.3 tilt=.2 attack=.25 release=2.5 haze=.15 body=.3 anchor=.2 volume=-0.5 start=.2 | harmonic | tides | Two waves on one ring leave a beating grain in every harmonic
Halo on the moon | Frozen twelfth | freeze=0 start=.4 return=25 width=.2 throw=0 tilt=-.45 haze=.7 attack=2.2 release=9 body=.8 anchor=.3 ears=.8 | glimhall | opened | Breath on a slow ring, the octave coming forward as you hold on
Sleeping on the deck | Breathing organ | return=12 width=.4 tilt=-.3 haze=.4 attack=1 release=5 body=.1 second=0 ears=.8 blur=0.45 volume=-2 start=.17 | follower | opened | A dark wave swinging in a bowl, thin at first and full every four seconds
Crib beside the stove | Breathing organ | return=20 width=.8 throw=.4 tilt=-.6 haze=.2 attack=.6 release=3 body=0 anchor=.5 second=.6 gap=.6 volume=-0.5 leak=.15 | glue | tides | A round low body that swells and thins slowly and dulls as it goes, a second wave across it
Swing in the orchard | Breathing organ | return=6 width=.15 throw=.3 tilt=.5 haze=.1 attack=.3 release=2 body=.8 anchor=.15 ears=.95 place=.4 volume=-0.5 blur=0.35 start=.2 | open | built | Bright and narrow in a bowl, opening at the end of each two second swing
Lung of the house | Breathing organ | return=15 reading=Flow width=.3 throw=.5 tilt=.1 haze=.8 attack=1.5 release=4 anchor=.25 body=.5 second=0 volume=4.5 blur=0.95 | weathered | long | Only what moves in the bowl is heard: breath that stirs with every swing
Bowl of plums | Breathing organ | return=30 width=.25 throw=.6 place=.8 tilt=0 haze=.25 splash=.4 attack=.1 release=6 body=.35 second=.9 gap=.15 ears=.6 start=.16 volume=3 | space | suspend | Two waves side by side in a bowl, a soft puff at the stroke and slow fullness after
Well at noon | Shared shimmer | clock=Own return=10 width=.3 throw=.2 tilt=-.2 haze=.3 attack=.4 release=4 anchor=.5 body=.2 ears=.7 volume=0.5 place=0.2 blur=0.6 leak=.12 | latehall | tides | Sinks away over ten seconds while its low part hurries and its top all but stands
Bucket going down | Going out | leak=0 return=4 haze=.2 tilt=.1 splash=.2 width=.15 throw=.4 attack=.1 release=3 body=.5 anchor=.35 ears=.4 volume=4 place=0.3 second=0.25 gap=0.2 start=.4 | murky | quartal | Each key dips into a well within four seconds and begins to rise again
Moss on the kerbstone | Going out | leak=.14 return=20 haze=.5 tilt=-.5 splash=0 width=.5 attack=2 release=8 body=.1 anchor=.6 ears=.9 second=.5 volume=4.5 place=0.65 blur=0.4 gap=0.45 | cave | long | A dark sinking wave on a firm ground, its breath left behind as it goes down
Echo in a dry well | Shared shimmer | clock=Own return=14 width=.05 throw=.7 tilt=.1 haze=.05 attack=.2 release=2 body=.75 anchor=.5 second=.6 gap=.9 ears=.8 volume=6 place=0.08 blur=0.06 start=.3 | tunnel | built | Bright stripes in a well, sparkling as the low part hurries under a still top
Lantern lowered by rope | Shared shimmer | clock=Own return=7 reading=Wave width=.4 throw=.3 tilt=-.3 haze=.4 attack=.9 release=5 body=.4 anchor=.3 volume=5 place=0.38 start=.5 | descent | opened | Hollow crests that sink into a well and are dim within seven seconds
Reed beds | Hollow pipes | return=12 width=.3 throw=.3 attack=.8 release=4 splash=0 tilt=.1 body=.45 ears=.8 haze=.3 volume=-3.5 blur=0.7 second=0.15 gap=0.9 start=.25 | ripples | opened | The crests of the wave read as a hollow tone, airy and slowly opening
Empty school hall | Hollow pipes | return=6 width=.5 throw=.1 attack=.3 release=2 splash=.2 tilt=-.4 body=.1 anchor=.2 haze=0 second=.6 gap=.4 volume=-3 start=.5 | bloomed | chorale | Plain hollow tones, dark and round, with a slow beat between two waves
Pipes under the floor | Hollow pipes | return=25 walls=Two_rooms width=.4 throw=.2 attack=1.5 release=6 splash=0 tilt=-.2 body=0 anchor=.35 haze=.2 ears=.9 volume=-2.5 blur=0.35 second=0.3 gap=0.05 start=.4 | common | tides | Hollow crests in two rooms, the octave beneath them swelling and giving way
Hollow of the hill | Hollow pipes | return=9 walls=Ring width=.2 throw=.5 place=.3 attack=1 release=5 splash=0 tilt=.3 body=.6 anchor=.5 haze=.15 ears=.6 volume=6 blur=0.28 | cathedral | built | Crests on a ring: a clear hollow tone whose odd harmonics come round by turns
Straw-coloured evening | Hollow pipes | return=40 width=.7 throw=.5 place=.1 attack=.5 release=3 splash=.3 tilt=.1 body=.8 anchor=.15 haze=.5 ears=1 volume=1.5 second=0.45 gap=0.7 start=.15 freeze=.85 | veil | lines | A thin hollow reed of a pad with breath all through it, changing hardly at all
Net curtain in April | Wind in the wall | return=5 width=.4 throw=.4 attack=.7 release=3 tilt=-.4 haze=.4 anchor=.3 body=.2 place=0.25 blur=0.0 | breathing | opened | What moves in the wave, heard as a low breath that stirs and grows still
Snow lifting off a roof | Wind in the wall | return=12 width=.05 throw=.7 attack=1.2 release=6 tilt=.15 haze=.85 anchor=.05 body=.7 ears=.95 volume=1.5 place=0.55 second=0.6 gap=0.55 start=.3 | airsplit | long | High dry air blown off the harmonics, the pitch faint inside it
Wind asks at the door | Wind in the wall | return=3 walls=Two_rooms width=.3 throw=.3 attack=.3 release=2 haze=.5 anchor=.4 body=.6 tilt=.2 ears=.6 volume=2.5 blur=0.15 start=.3 | sill | response | Breath that moves through a wall and back, with a quiet octave under the key
Two breaths on a pane | Wind in the wall | walls=Ring return=2.5 width=.2 throw=.5 attack=.5 release=3 haze=.3 anchor=.35 body=.55 tilt=.2 second=.5 gap=.5 volume=0.5 place=0.75 blur=0.4 start=.4 | mirror | quartal | Moving air on a quick ring, the overtones gathered in it and let go
Ash in the grate | Wind in the wall | walls=Fading_well return=9 width=.5 throw=.2 attack=2 release=7 haze=1 anchor=.2 body=0 tilt=-.6 place=0.02 leak=.2 | dissolve | opened | A dark hush of moving air that sinks and leaves a low glow
Ploughed stripes | Thrown from afar | return=10 width=.5 attack=.6 release=4 tilt=.1 body=.3 haze=.1 splash=0 second=.9 gap=.9 volume=1 start=.15 | glacial | suspend | Two waves thrown from far apart, fine stripes between them in a warm body
Ribbed cloth | Thrown from afar | return=16 width=.2 throw=.3 attack=.2 release=2 tilt=-.5 body=.15 second=.7 gap=.5 haze=.05 blur=.05 ears=.4 leak=.2 | shade | chorale | A dark close grain where the two waves cross, quick and plain
Moire curtain | Thrown from afar | return=7 width=.75 throw=.5 attack=1.1 release=5 tilt=-.1 body=.6 second=1 gap=.25 haze=.35 ears=1 blur=.4 volume=0 start=.1 | twins | opened | Two waves nearly side by side, beating broadly as one passes through the other
Rain on two windows | Thrown from afar | return=2 width=.35 throw=.6 attack=.25 release=3 tilt=.2 body=.75 second=.5 gap=.8 haze=.2 blur=.1 anchor=.5 start=.7 | rain | quartal | Fine bright stripes flickering by as both waves come home every two seconds
Fence against the sky | Twin throw choir | haze=.1 return=14 width=.15 place=.1 second=.8 gap=.6 attack=.9 release=7 tilt=.45 anchor=.04 ears=.5 volume=6 clock=By_pitch start=.5 | valley | built | Clear narrow stripes, each key swelling again in its own time
`,
    },
    {
      id: 'glass-keys',
      name: 'Glass keys',
      category: 'keys',
      rows: `
Window in a bakery | Glass keys | return=14 leak=.38 tilt=.5 body=.8 anchor=.45 release=2.5 splash=.2 volume=-5 | reveal | harp | Clear glass, struck bright, that darkens as it leaks and leaves its own pitch
Tumblers in the drainer | Glass keys | return=3 leak=.7 width=.1 throw=.5 tilt=.2 body=.45 release=.5 blur=0 splash=.4 volume=-5.5 | tiles | seeds | Short wet glass with a splash of air at each stroke, soon down to a plain tone
Frosted pane | Glass keys | width=.35 throw=.1 leak=.2 haze=.5 tilt=-.2 body=.3 splash=0 attack=.06 release=3 volume=0.5 start=.5 freeze=.8 | lightroom | response | Clouded glass that speaks at its octave and breathes as it fades
Spectacles on a shelf | Glass keys | return=24 place=.4 second=.4 gap=.15 leak=.12 tilt=.25 body=1 anchor=.45 release=4 ears=.9 volume=-1.5 start=.333 | glimmer | lines | Fine light glass that speaks at its twelfth, two waves close together, long in going
Draining board | Glass keys | return=5 throw=.6 place=.7 leak=.7 tilt=.1 body=.65 release=.3 anchor=.6 splash=.1 volume=-2.5 | strikes | ostinato | Dry taps of glass that are round and plain a moment after the stroke
Toffee broken on a tray | High keys first | clock=Own width=.02 throw=.65 leak=.6 return=6 tilt=.05 body=.25 splash=.5 release=.6 attack=.02 haze=0 blur=0.03 second=0.2 gap=0.75 start=.333 volume=-6.5 | room | seeds | A hard narrow stroke with a spray of air, quick to lose its edge
Lid of the piano stool | Dissolving pad | leak=.35 attack=.02 release=1 width=.25 throw=.3 return=9 tilt=-.2 body=.1 splash=.1 haze=0 anchor=.6 ears=.3 volume=-10 | warm | chorale | Plain warm keys with a large body, bright for an instant and then round
Marbles in a saucer | Dissolving pad | leak=.25 attack=.02 release=2 width=.05 throw=.4 place=.45 return=1.6 blur=0 tilt=.3 body=.9 splash=.3 haze=.05 second=0.35 gap=0.6 start=.5 volume=-1 | dotted | hocket | Struck keys that glitter through a whole return every second and a half
Enamel jug | Dissolving pad | leak=.45 attack=.02 release=1.5 width=.12 throw=.2 place=1 return=12 tilt=.25 body=.5 splash=0 second=.5 gap=.4 blur=0.1 start=.5 | spring | ostinato | Struck in the middle of the box, so the octave speaks first and the key after
Lace and polish | Dissolving pad | leak=.15 attack=.04 release=5 width=.08 throw=.35 return=18 tilt=.1 body=.6 haze=.2 splash=.4 anchor=.4 ears=1 place=0.33 second=0.1 gap=0.1 | halo | harp | Long struck keys that spread to the sides as they dissolve
Blown ink bottle | Hollow pipes | attack=.02 leak=.4 return=5 width=.2 throw=.5 release=1 tilt=.2 body=.6 splash=.5 anchor=.3 ears=.6 volume=-3.5 blur=0.35 | booth | ostinato | Hollow struck keys with a puff at the front, the edge gone within a second
Unlit lamp chimney | Plucked flicker | leak=.4 return=8 width=.35 throw=.3 tilt=-.2 body=.35 release=2 blur=.3 splash=0 volume=2 place=0.03 second=0.5 gap=0.85 start=.2 | echohall | lines | Hollow rounded keys that set out already loosened, quietly moving
Aquarium tapping | Plucked flicker | walls=Ring leak=.45 return=2.5 throw=.4 tilt=.5 body=.9 release=.7 anchor=.45 splash=.1 volume=5 place=0.45 start=.4 | bells2 | seeds | Hollow small taps on a ring, bright and quick to die away
Clock under a dome | Hollow pipes | walls=Two_rooms attack=.02 leak=.3 return=4 width=.1 throw=.35 release=1.5 tilt=.1 body=.5 splash=.05 anchor=.5 haze=0 volume=-3 blur=0.06 second=0.25 gap=0.2 start=.5 | clean | hocket | Hollow keys that begin on the octave below and step up to the key
Apothecary window | Plucked flicker | walls=Fading_well leak=.22 return=6 width=.05 throw=.6 tilt=0 body=.75 release=3 haze=.2 ears=.8 volume=3 anchor=.45 place=0.2 | ripples | response | Hollow crests in a well, sinking as they leak, with a breath left over
Coin into a fountain | Shared shimmer | clock=Own leak=.4 return=5 width=.05 throw=.4 tilt=.4 body=.8 haze=.05 attack=.02 release=1.5 splash=.5 anchor=.5 ears=.5 volume=-3 blur=0.28 second=0.4 gap=0.45 | stone | peal | Struck and sunk at once, a splash and then a small falling glow | bell
Ice in the tray | Shared shimmer | clock=Own leak=.3 return=2 width=.1 throw=.3 tilt=.6 body=1 haze=0 attack=.02 release=.8 splash=.15 anchor=.35 volume=6 start=.6 | crystals | rain | High brittle keys in a quick well, dipping and coming up as they die
Pebble under clear water | Going out | leak=.25 return=7 haze=.35 tilt=0 splash=.2 width=.2 attack=.03 release=2.5 body=.5 anchor=.5 ears=.8 volume=-3 blur=0.0 second=0.15 gap=0.9 | deepwater | harp | Soft keys that sink a little under their own breath and darken on the way
Candle in a jar | Going out | leak=.18 return=12 haze=.15 tilt=-.15 splash=0 width=.35 throw=.35 attack=.06 release=4 body=.25 anchor=.6 second=.4 gap=.7 volume=-2.5 blur=0.15 | plate | chorale | Warm keys that fade into a well slowly, with a faint grain from a second wave
Skylight after rain | Shared shimmer | clock=Own leak=.2 return=16 width=0 throw=.5 place=.5 tilt=.1 body=.6 haze=.3 attack=.02 release=3 splash=.35 anchor=.55 ears=1 volume=-1.5 second=0.3 gap=0.05 | airtail | built | Narrow and thrown hard into a well, a glare that thins to airy light
Toy harmonium lid | Breathing organ | leak=.3 return=9 attack=.02 release=.6 tilt=.2 body=.6 haze=0 splash=.2 width=.2 anchor=.5 second=0 place=0.3 blur=0.4 start=.2 | combo | chorale | Struck keys in a bowl that swell a second after the stroke and fade as they leak
Horse on rockers | Breathing organ | leak=.4 return=3 attack=.02 release=1 tilt=-.2 body=.2 haze=.05 splash=.3 width=.35 throw=.4 anchor=.35 place=0.65 start=.17 volume=1.5 | thump | ostinato | Dark round keys that rock, full and thin once a second, as they die
Rattled spoons | Breathing organ | leak=.22 return=1.5 attack=.02 release=2 tilt=.6 body=.9 haze=.05 splash=.4 width=.05 throw=.6 anchor=.4 second=.6 gap=.8 place=0.08 blur=0.03 | chamber | peal | Bright struck keys trembling fast between full and thin
Sugar on porcelain | Breathing organ | leak=.5 return=6 attack=.02 release=1.2 tilt=.5 body=.75 splash=.6 width=.1 place=.6 throw=.2 second=.2 haze=.2 blur=0.1 start=.15 volume=1 | whisper | harp | Keys blown through with air at the stroke, a short swing in each
Hammock string | Breathing organ | leak=.12 return=12 attack=.03 release=3.5 tilt=0 body=.4 splash=0 width=.25 throw=.5 place=.3 second=.8 gap=.5 anchor=.25 volume=-2 | trempl | lines | Long struck keys swaying every four seconds with a second wave crossing
Staircase in two voices | Tunnel bass | leak=.25 return=3 width=.15 throw=.4 tilt=.3 body=.6 attack=.02 release=1.2 ears=.7 anchor=.5 splash=.2 volume=-3.5 blur=0.35 start=.5 | repeats | hocket | Struck keys that begin an octave down and change places with it every second or two
Cupboard piano | Tunnel bass | leak=.35 return=8 width=.4 tilt=-.2 body=.35 attack=.02 release=.7 ears=.05 splash=.1 anchor=.4 haze=.1 start=.4 volume=-5.5 | cassette | chorale | Boxy dark keys led by the octave under each, gone soon after they are struck
Key in the other room | Minute drone | leak=.2 return=10 start=0 width=.1 throw=.5 attack=.02 release=2 tilt=.2 body=.8 haze=.05 splash=.4 anchor=.4 blur=.1 ears=.6 second=0.45 gap=0.7 | across | response | Bright struck keys whose low octave comes through the wall as they fade
Double doors | Tunnel bass | leak=.45 return=1.5 width=.05 throw=.6 tilt=.1 body=.5 attack=.02 release=1 ears=.9 anchor=.6 second=.5 gap=.6 volume=-3.5 blur=0.06 | panned | ostinato | Narrow hard keys that flap between a note and its octave below
Stacked ballroom chairs | Minute drone | leak=.1 return=25 start=.3 width=.2 throw=.3 attack=.02 release=5 tilt=0 body=.15 haze=.15 splash=.2 anchor=.5 blur=.3 ears=.8 second=.3 gap=0.55 | sharprev | harp | Long warm keys over a soft octave that swells behind them
Cut-glass chandelier | Thrown from afar | leak=.3 return=9 width=.1 throw=.4 attack=.02 release=2 tilt=.1 body=.7 second=.9 gap=.9 blur=.05 haze=0 anchor=.4 start=.35 | glasshim | harp | Striped glittering keys, two narrow waves struck far apart at once
Beads on a thread | Thrown from afar | leak=.5 return=2 width=.3 throw=.2 attack=.02 release=.8 tilt=.2 body=.4 second=.7 gap=.9 blur=0 splash=.3 start=.5 place=.6 | glints | seeds | Short grained keys, each with a fine roughness that wears off
Combs and paper | Thrown from afar | leak=.4 return=12 width=.2 throw=.1 attack=.02 release=1 tilt=-.2 body=.55 second=1 gap=.7 haze=.2 anchor=.25 reading=Wave start=.15 freeze=.85 | bridge | ostinato | Hollow striped keys with a reedy grain, close to a buzz at the stroke
Two watches ticking | Twin throw choir | leak=.35 haze=.05 return=2 attack=.02 release=1.5 width=.15 gap=.1 splash=.2 tilt=.3 body=.7 ears=.9 blur=0.28 start=.8 volume=1 | orbits | rain | Two near waves struck together and beating fast as they come home
Pearl buttons | Twin throw choir | leak=.28 haze=.1 return=12 attack=.03 release=3 width=.3 place=.1 gap=.35 tilt=.1 body=.5 anchor=.45 splash=.1 clock=By_pitch | double | lines | Rounded keys that swell again in turn, a slow pearly beat in each
Slippers on parquet | Dissolving pad | leak=.5 attack=.05 release=.5 width=.9 throw=.05 return=12 tilt=-.5 body=.1 splash=.2 haze=.1 anchor=.5 ears=.3 blur=0.0 second=0.2 gap=0.75 freeze=.6 | felted | ostinato | Very soft dark keys, a wide wave with hardly a stroke, quickly gone
Coat over the piano | Dissolving pad | leak=.3 attack=.04 release=1.5 width=.85 throw=.1 return=6 tilt=-1 body=.3 splash=0 haze=.05 anchor=.7 freeze=.8 | cloth | chorale | Muffled keys that are nearly all ground, dark from the start
Breath and knuckles | Going out | leak=.35 haze=.6 splash=.7 width=.5 attack=.04 release=2 tilt=-.2 body=.45 return=8 walls=Box anchor=.4 volume=-5 blur=0.15 second=0.35 gap=0.6 | room | response | A breathy stroke and a low soft key under it
Kneeling on the rug | Dissolving pad | walls=Ring leak=.25 attack=.06 release=3 width=.5 throw=.1 return=16 tilt=-.1 body=.2 splash=.1 haze=.25 anchor=.8 ears=.6 blur=0.4 start=.25 volume=2.5 | sway | suspend | Round soft keys on a firm ground, a slow ring of overtones far behind
Milk warming | Dissolving pad | leak=.2 attack=.12 release=4 width=.65 throw=.2 second=.6 gap=.2 return=20 tilt=-.3 body=.5 haze=.4 splash=0 anchor=.35 blur=.5 place=0.38 start=.3 volume=-0.5 | darkroom | quartal | Two wide waves as one slow soft key, a little breath on it
Ladder of lamps | High keys first | return=4 leak=.1 width=.1 throw=.4 tilt=.4 body=.7 release=2 splash=.1 ears=.9 volume=-2 place=0.25 blur=0.03 | farstar | built | Each key lifts again as its wave comes by, the high ones first
Cherries on a scale | High keys first | return=2 leak=.2 width=.3 throw=.2 tilt=.1 body=.4 release=1 splash=.3 anchor=.6 attack=.02 place=0.55 second=0.1 gap=0.1 start=.5 volume=-5.5 | chorale | harp | Keys that bob up again and again, quick above and slow below
Letters through the door | High keys first | reading=Wave return=7 width=.35 throw=.3 tilt=.2 body=.5 release=2.5 splash=.5 anchor=.35 volume=-1 place=.2 blur=0.1 second=.6 gap=.8 | bucket | response | Hollow keys, lifted once more as the wave comes round, weaker each time
Thermometer rising | High keys first | walls=Ring return=14 width=.05 throw=.6 tilt=.2 body=.9 release=4 anchor=.6 haze=.1 ears=1 volume=2.5 place=0.02 blur=0.35 second=0.5 gap=0.85 start=.25 | prism | harp | Clear ring keys that swell one after another from the top down
Swallows on the wire | High keys first | walls=Two_rooms return=5 width=.15 throw=.4 leak=.15 tilt=.2 body=.6 release=1.5 splash=.2 volume=-4.5 | slowing | hocket | Keys with an octave below that come back for a second look, small ones soonest
Switchboard at dusk | Ring bells | leak=.4 release=.8 width=.1 throw=.4 return=7 tilt=.3 body=.35 anchor=.6 splash=.2 ears=.4 volume=-2 blur=0.06 start=.333 freeze=.7 | whirl | ostinato | Bright ringing keys with a firm low middle, cut off when let go
Torch under the covers | Plucked flicker | reading=Density leak=.3 return=10 width=.1 throw=.5 tilt=.85 body=.2 release=1 blur=.1 splash=0 anchor=.5 | triode | chorale | Keys with a large body and an open bright top, warm and near
Zip and buckle | Glass keys | walls=Box reading=Wave leak=.8 return=1.2 throw=.8 tilt=.2 body=1 release=.4 splash=.4 anchor=.5 blur=0 volume=-3.5 start=.3 | glaze | seeds | A hollow buzzing stroke in a small body, over almost at once
Tin roof piano | Plucked flicker | walls=Two_rooms reading=Density leak=.4 return=1.6 width=0 throw=.5 tilt=.5 body=.85 release=.8 splash=.6 | tapespring | hocket | Hard bright keys over a rattling low octave
Radiator and window | Glass keys | walls=Fading_well leak=.15 return=6 width=.2 throw=.4 second=.5 gap=.5 tilt=.35 body=.45 release=3 haze=.35 splash=.1 volume=-4 clock=Shared | amptrem | quartal | Warm bright keys in a well, lifted together every three seconds as they sink
`,
    },
    {
      id: 'breathing-organs',
      name: 'Breathing organs',
      category: 'organ',
      rows: `
Low stop in a side aisle | Breathing organ | return=18 width=.45 tilt=-.4 body=.1 attack=.3 release=1.2 haze=.05 second=0 anchor=.5 ears=.4 place=0.33 blur=0.5 start=.2 leak=.1 | pedal | chorale | A dark stop in a bowl that fills and thins every six seconds
Organ loft in a gale | Breathing organ | return=3 width=.25 throw=.4 tilt=.1 body=.45 attack=.08 release=.6 haze=.3 anchor=.25 volume=-1.5 place=0.03 | gusts | suspend | Full organ tones shaken once a second, as if the wind leaned on the bellows
Choirboy at the pedals | Breathing organ | return=9 width=.15 throw=.1 place=.5 tilt=0 body=.6 attack=.15 release=.4 haze=0 anchor=.7 second=.2 blur=0.28 start=.5 volume=-2.5 | chapel | lines | A clear stop with a firm ground, its upper part opening at each swing
Tuning before mass | Breathing organ | return=30 width=.3 throw=.3 tilt=.25 body=.3 attack=.5 release=2 haze=.1 second=.6 gap=.1 ears=.9 place=0.45 blur=0.65 start=.25 leak=.1 | organs | built | A slow tide in every key, each on a swing of ten seconds
Bellows boy dozing | Breathing organ | return=12 width=.55 throw=.05 tilt=-.2 body=.5 attack=.7 release=1.5 haze=.5 anchor=.6 place=0.2 leak=.15 | blanket | tides | A soft airy stop that sinks and recovers on slow swings
Reed behind a curtain | Breathing organ | return=7 width=.05 throw=.4 tilt=.3 body=.65 attack=.12 release=.6 haze=.05 second=0 anchor=.2 blur=0.0 start=.15 volume=-0.5 | shade | suspend | A narrow reed in a bowl, thin and full by turns, its top held back
Market accordion | Breathing organ | return=2 width=.1 throw=.5 tilt=.5 body=.55 attack=.06 release=.25 haze=.1 second=.5 gap=.3 anchor=.35 volume=0.5 | twins | ostinato | A bright reed with a quick shake and a second wave a little beside it
Sailor on the pier | Breathing organ | return=5 width=.02 throw=.6 tilt=.2 body=.9 attack=.1 release=.4 haze=0 anchor=.05 ears=.3 volume=-0.5 blur=0.15 | combo | chant | A pinched high reed swaying on slow swings
Ox cart and drone pipe | Breathing organ | return=15 width=.08 throw=.7 tilt=.7 body=.4 attack=.2 release=.8 haze=.15 anchor=.5 second=.4 gap=.7 volume=-0.5 blur=0.4 start=.2 leak=.1 | notch | fifth | A coarse bright reed over a steady ground, opening on long swings
Regal on the windowsill | Breathing organ | return=1.4 width=.12 throw=.8 tilt=.35 body=.75 attack=.03 release=.3 haze=.05 splash=.3 anchor=.3 volume=-1.5 place=0.3 | wood | hocket | A small snarling reed with a click of air and a fast pulse in it
Stopped flute at matins | Hollow pipes | return=30 width=.95 throw=0 place=.3 tilt=-.4 body=.2 attack=.08 release=.35 splash=.3 anchor=.3 haze=.05 volume=-2.5 blur=0.03 freeze=.8 | bare | chorale | Nearly a pure hollow tone with a puff of air where each pipe speaks
Quint in the rafters | Hollow pipes | return=14 width=.35 throw=.3 place=.1 tilt=.15 body=.6 attack=.1 release=.5 splash=.15 anchor=.15 haze=.2 ears=.6 volume=2.5 second=0.25 gap=0.2 start=.333 | flutes | lines | Hollow pipes with a twelfth in them, a breath of air round each
Chiff and reply | Hollow pipes | return=9 width=.5 throw=.2 tilt=.05 body=.4 attack=.04 release=.25 splash=.85 anchor=.4 haze=.1 volume=-5 blur=0.1 leak=.12 | chamber | hocket | A hard puff at every key and a hollow pipe after it
Leaves in the pipes | Hollow pipes | return=6 width=.2 throw=.5 tilt=-.3 body=.3 attack=.2 release=1 splash=.4 haze=.75 anchor=.25 volume=1 blur=0.35 second=0.4 gap=0.45 start=.7 | airsplit | quartal | Dark hollow pipes mostly made of wind, shifting a little as the wave moves
Clarinet rank | Hollow pipes | return=20 width=.3 throw=.1 place=.8 tilt=.35 body=.35 attack=.06 release=.4 splash=0 anchor=.35 haze=0 ears=.05 volume=-4 freeze=.95 | middle | lines | A plain reed of odd harmonics, steady and close
Frost in the wood pipes | Hollow pipes | walls=Ring return=10 width=.5 throw=.2 tilt=.1 body=.7 attack=.1 release=.6 splash=.35 anchor=.45 haze=.1 volume=2 blur=0.06 second=0.15 gap=0.9 start=.3 | tiles | suspend | Hollow pipes on a ring, the odd harmonics thinning out and gathering again
Crypt rank | Hollow pipes | walls=Two_rooms return=6 width=.4 throw=.15 tilt=-.3 body=.05 attack=.15 release=.8 splash=.1 anchor=.3 haze=.05 ears=.35 volume=-1 start=.5 | lowcath | steps | Dark hollow pipes over an octave that steps through the wall and back
Organ under a hillside | Hollow pipes | walls=Fading_well return=16 width=.3 throw=.35 tilt=.2 body=.3 attack=.25 release=1.5 splash=.2 anchor=.5 haze=.3 volume=1.5 blur=0.3 second=0.3 gap=0.05 | undershim | fifth | Hollow pipes sinking by degrees into a well, air rising round them
Ferry whistle stop | Hollow pipes | walls=Bowl return=8 width=.25 throw=.4 tilt=.4 body=.85 attack=.07 release=.5 splash=.5 anchor=.2 haze=.2 volume=4 blur=0.28 start=.2 | fifthhall | response | High hollow whistles that open and close on every swing of the bowl
Three pipes on a wheel | Hollow pipes | walls=Ring clock=Shared return=3 width=.3 throw=.4 tilt=.2 body=.5 attack=.05 release=.7 anchor=.5 haze=.05 splash=.2 volume=3.5 second=0.45 gap=0.7 start=.5 | round | opened | Hollow pipes all lifted together by one clock, twice in three seconds
Twelfth and fifteenth | Frozen twelfth | return=10 start=.333 width=.02 throw=.2 tilt=.15 body=.6 attack=.1 release=.5 haze=.05 anchor=.6 ears=.4 blur=0.0 | principal | chorale | A ring halted on its twelfth over a firm ground, as a mixture stop is
Octave stop half drawn | Frozen twelfth | start=.5 return=30 width=.1 tilt=.05 body=.4 attack=.3 release=.8 haze=.1 anchor=.5 freeze=.9 throw=.3 | octhop | lines | A ring held at the octave, its upper harmonics swinging slowly in and out
Glass mixture | Frozen twelfth | start=.25 return=12 width=0 throw=.4 tilt=.4 body=.8 attack=.06 release=.6 haze=0 anchor=.7 freeze=.97 blur=0.15 | thinair | quartal | A ring stopped at its double octave, four waves standing over the ground
Nave in two colours | Frozen twelfth | start=.5 freeze=.8 return=4 width=.15 throw=.1 tilt=-.1 body=.3 attack=.2 release=1 haze=.15 anchor=.4 ears=.85 blur=0.4 | horn | tides | A ring that swings a little way to each side of its octave
Cracked leather bellows | Frozen twelfth | walls=Box start=.333 freeze=.85 return=6 width=.2 tilt=-.2 body=.25 attack=.15 release=.5 haze=.6 anchor=.45 throw=.5 | cassette | suspend | A wheezing stop held near the twelfth, as much air as pipe
Portative at the gate | Breathing organ | splash=.4 return=10 width=.2 attack=.04 release=.2 tilt=.15 body=.75 haze=.15 anchor=.5 place=.3 second=0 ears=.3 volume=-1 blur=0.03 | lightroom | ostinato | Small pipes with a chiff on every key, cut the moment they are let go
Nightingale stop | Breathing organ | splash=.6 return=4 width=.1 throw=.5 attack=.03 release=.5 tilt=.55 body=1 haze=.3 anchor=.2 volume=-3.5 clock=By_pitch | vibrato | rain | Tiny airy pipes that come and go, the smallest quickest | wind
Doorstep hurdy wheel | Shared shimmer | return=1.6 walls=Bowl clock=Own width=.1 throw=.6 attack=.1 release=.3 tilt=.4 body=.5 haze=.1 anchor=.5 splash=.1 ears=.3 volume=-1 blur=0.1 second=0.6 gap=0.55 start=.2 | bridge | fifth | A rough reed on a quick even swing, over its own drone
Penny pipes | Hollow pipes | width=.6 return=5 throw=.4 attack=.03 release=.2 tilt=-.15 body=.7 splash=.3 anchor=.5 haze=.1 ears=.5 volume=-1.5 blur=0.35 | smaller | seeds | Short high pipes with a puff in front of each, hollow as straws
Water organ in a garden | Breathing organ | splash=.25 return=6 width=.3 throw=.2 place=.7 attack=.09 release=1 tilt=-.1 body=.55 haze=.4 anchor=.4 second=.7 gap=.5 volume=-0.5 start=.1 | sunk | built | Bubbling soft pipes, two waves crossing in a bowl
Harmonium on the knee | Breathing organ | walls=Box return=9 width=.2 throw=.5 attack=.18 release=.5 tilt=.4 body=.4 haze=.05 splash=0 anchor=.35 blur=.6 second=.4 place=0.65 start=.35 leak=.12 volume=-2.5 | board | suspend | A close reedy tone, its quick movement smeared and its slow shape left
Untuned vestry | Breathing organ | walls=Box return=4 width=.1 throw=.3 attack=.1 release=.4 tilt=.1 body=.6 haze=.1 anchor=.5 second=1 gap=.05 blur=.3 place=0.08 start=.5 freeze=.5 volume=-2 | double | chorale | Two waves so near each other that the reeds beat slowly
Bellows with a hole | Wind in the wall | walls=Bowl return=5 width=.3 throw=.4 attack=.15 release=.5 haze=.4 anchor=.6 body=.35 tilt=.2 place=0.38 blur=0.06 start=.25 | pillow | tides | Moving air over a firm ground, squeezed and let go in a bowl
Field chapel organ | Thrown from afar | return=9 width=.3 attack=.08 release=.5 tilt=.4 body=.6 haze=.05 anchor=.5 gap=.5 second=.6 volume=-7 leak=.12 start=.4 | valve | chorale | Reedy striped keys, a warm edge on them and a steady ground
Mountain harmonium | Minute drone | return=14 start=.4 width=.25 attack=.25 release=1.5 tilt=.3 body=.6 haze=.2 anchor=.5 ears=.6 blur=.4 second=.5 gap=.4 | cellos | fifth | A nasal reed and its octave below, trading places on slow breaths
Pedal board alone | Tunnel bass | leak=.1 attack=.12 release=.6 return=12 width=.5 throw=.3 tilt=-.3 body=.05 anchor=.5 ears=.5 volume=-2.5 blur=0.28 | bare | steps | Broad pedal tones with an octave under them that leans through the wall
Great and swell | Minute drone | return=6 start=.5 width=.15 throw=.5 attack=.2 release=1 tilt=.45 body=.45 haze=.05 anchor=.35 blur=.15 ears=.75 second=.7 gap=.8 | latehall | chorale | A full bright organ in two rooms, its low octave coming and going every six seconds
Boathouse organ | Tunnel bass | leak=0 attack=.2 release=1 return=3 width=.5 tilt=-.3 body=.4 anchor=.4 ears=.8 haze=.3 second=.3 volume=-1.5 clock=Shared blur=0.0 gap=0.75 start=.35 | deepwater | quartal | A round watery organ, every key lifted at once, twice in three seconds
Thirty-two foot | Minute drone | return=20 start=.5 width=.85 throw=.1 attack=.4 release=2 tilt=-.6 body=0 haze=.05 anchor=.45 ears=.3 blur=.2 | deep | steps | A very dark low stop that begins on the octave below and lets it go
Signal box organ | Tunnel bass | leak=0 reading=Wave attack=.06 release=.4 return=2 width=.3 throw=.5 tilt=.2 body=.6 anchor=.35 ears=.6 volume=2 | heads | ostinato | Hollow pipes in two rooms, flipping an octave down and back
Hymn on the far bank | Breathing organ | return=20 width=.3 throw=.2 tilt=0 attack=.9 release=3 body=.35 haze=.2 anchor=.5 ears=.9 place=0.25 blur=0.8 start=.2 | faraway | tides | Organ swells on long swings, rising slowly and slow to leave
Stained light | Breathing organ | walls=Ring return=15 width=.1 throw=.3 tilt=.35 attack=.4 release=2.5 body=.75 haze=.1 anchor=.45 second=.5 gap=.6 volume=4.5 place=0.55 leak=.1 | choirhall | built | An organ on a ring, where clear overtones stand out one after another
Snowed-in church | Breathing organ | walls=Fading_well return=12 width=.35 throw=.2 tilt=-.2 attack=.5 release=2 body=.3 haze=.35 anchor=.6 volume=4.5 place=0.75 blur=0.45 start=.3 leak=.15 | fog | lines | A soft organ in a well, the top quite still while the bottom sinks
Voluntary at dusk | Breathing organ | return=25 reading=Wave width=.2 throw=.2 tilt=.2 attack=.3 release=1.5 body=.5 haze=.1 second=.3 gap=.4 anchor=.3 ears=.8 volume=3.5 place=0.02 blur=0.95 start=.2 | longplate | lines | A hollow reed in a bowl, swelling and thinning about every eight seconds
Hymns on a night train | Octave asleep | freeze=0 start=0 return=18 width=.4 throw=.3 place=1 tilt=.1 attack=.25 release=1.5 body=.45 haze=.15 blur=.2 anchor=.35 leak=.12 | halo | tides | Thrown from the middle, so the octave leads and the ground stands under it
Principal in the apse | Dissolving pad | return=40 width=.12 throw=.1 place=.25 second=.5 gap=.5 tilt=.2 attack=.08 release=.5 body=.4 haze=0 splash=.1 anchor=.6 blur=.5 volume=-2 freeze=.9 | latehall | lines | A clear firm stop that hardly changes while it is held
Tremulant on | Dissolving pad | return=12 width=.3 throw=.2 second=.9 gap=.15 tilt=.1 attack=.12 release=.6 body=.35 haze=.05 splash=0 anchor=.4 blur=.1 leak=.1 | amptrem | chorale | Two waves close together, rolling, as a tremulant does
Vox under glass | Twin throw choir | haze=.15 return=8 width=.25 attack=.15 release=.6 tilt=.35 body=.7 gap=.4 anchor=.35 blur=0.15 leak=.12 | oo | suspend | A nasal stop of two waves with a vowel in it
Consort of crumhorns | Twin throw choir | haze=0 return=6 width=.05 throw=.4 attack=.07 release=.25 tilt=.3 body=.5 gap=.6 second=.7 anchor=.3 ears=.4 blur=0.4 | forward | lines | Buzzing close reeds that loosen and come together over six seconds
Barn swallow organ | Shared shimmer | walls=Box clock=Own return=2.5 width=.2 throw=.3 attack=.1 release=.7 tilt=.2 body=.65 haze=.1 anchor=.5 splash=.2 second=.6 gap=.5 volume=-0.5 place=0.33 start=.25 | whirl | response | A light quick stop that flutters through its overtones every few seconds
`,
    },
    {
      id: 'ring-bells',
      name: 'Ring bells',
      category: 'bell',
      rows: `
Belfry over a lake | Ring bells | return=7 throw=.3 second=.2 leak=.22 tilt=.4 body=.7 anchor=.55 release=7 splash=.2 volume=-1.5 blur=0.03 | space | peal | Clear bells thrown round a ring, coming home as they die
Noon from two towers | Ring bells | return=3 place=.6 gap=.3 leak=.28 tilt=.25 body=.5 release=4 ears=1 haze=.1 volume=1.5 start=.333 | farstar | peal | Two waves on a ring, struck at their twelfth and whole two seconds after
Dinner bell for pickers | Ring bells | return=12 second=0 throw=.1 leak=.35 tilt=.5 body=1 anchor=.6 release=2 volume=2 blur=0.1 | ends | seeds | One plain bright bell with a firm pitch, narrow and soon round
Sheep on the far slope | Ring bells | return=1.8 width=.2 throw=.4 leak=.4 tilt=-.1 body=.6 anchor=.35 release=1.5 haze=.15 ears=.9 volume=0 blur=0.35 | valley | rain | Dull little bells that flicker as they go out
Ring finger on crystal | Ring bells | return=20 width=.3 throw=.15 leak=.1 tilt=-.1 body=.5 anchor=.3 attack=.12 release=9 second=.3 gap=.2 volume=-2.5 | shine | high | Crystal rubbed rather than struck, a slow beat turning inside it
Sleigh under the eaves | Glass keys | leak=.5 return=2 throw=.7 width=.05 tilt=.1 body=.8 release=.6 splash=.3 anchor=.5 volume=-4.5 | dust | rain | Tiny bells with a splash of air at the stroke, over in a moment
Shop door at four | Glass keys | leak=.42 return=6 throw=.2 second=.6 gap=.9 tilt=.7 body=.85 release=1.2 anchor=.5 splash=.1 volume=3 | tin | seeds | A small bright clank of stripes that clears to a plain note
Chime on one string | High keys first | walls=Ring return=3 leak=.12 width=.1 throw=.4 tilt=.3 body=.6 release=2.5 splash=.05 ears=1 volume=4 attack=.03 anchor=.6 blur=0.06 second=0.35 gap=0.6 | halo | high | High chimes that rise again as their waves come by
Plates struck upstairs | Glass keys | walls=Box leak=.38 return=10 width=.15 throw=.3 place=.1 tilt=.3 body=.7 release=1.5 splash=.15 anchor=.6 start=.4 volume=-5 | glaze | harp | Small struck plates, round and dry, with a little edge on top
Hoarfrost on the rope | Glass keys | leak=.2 return=15 throw=.5 place=.9 tilt=.05 body=.6 haze=.4 release=5 anchor=.6 ears=.9 volume=-1 start=.15 | seasons | high | Thin cold bells with a breath of frost that gathers as they dissolve
Gong at the gate | Tunnel bass | leak=.1 width=.1 throw=.5 return=5 tilt=.1 body=.1 anchor=.5 release=6 ears=.8 haze=.15 splash=.4 attack=.02 volume=-2.5 blur=0.28 | room2 | toll | A low gong with an octave under it that rolls through the wall and back
Half-sunk tide bell | Minute drone | leak=.15 return=8 start=.3 width=.2 throw=.3 attack=.02 release=7 tilt=.2 body=.25 haze=.2 splash=.2 anchor=.4 blur=.1 second=.6 gap=.6 | deepwater | toll | A heavy bell below the water, its low octave swelling after the stroke
Anvil across the square | Tunnel bass | leak=.3 width=0 throw=.8 return=2 tilt=.3 body=.65 anchor=.3 release=2.5 ears=.6 splash=.1 attack=.02 volume=-2.5 blur=0.0 start=.5 | slap | toll | A hard struck bar with a rattle of octaves in it
Hour over wet roofs | Dissolving pad | leak=.15 attack=.02 release=8 width=.05 throw=.5 place=.3 return=6 tilt=0 body=.2 second=.5 gap=.7 anchor=.5 haze=.05 splash=.1 volume=-1.5 blur=0.15 | darkplate | toll | A big low bell in a box, striped at the stroke, long and dark after
Dropped iron lid | Going out | leak=.25 walls=Two_rooms return=3 width=.15 throw=.6 haze=.3 tilt=.1 splash=.5 release=3 attack=.02 body=.4 volume=-3 start=.25 | shaft | toll | A clang and a hush of air, then a low octave walking off | drum
Barefoot to the temple | Hollow pipes | attack=.02 leak=.18 return=8 width=.15 throw=.4 tilt=.3 body=.5 splash=.1 release=6 anchor=.4 ears=.8 haze=.05 volume=-3 blur=0.4 second=0.1 gap=0.1 start=.2 | bowls | toll | Hollow bells of odd harmonics, slow to change and slow to go
Bottles on a fence | Plucked flicker | leak=.3 return=4 width=.2 throw=.6 tilt=.2 body=.8 release=2 splash=.4 anchor=.3 volume=-3 start=.3 | bottle | peal | Hollow glassy strokes blown over at the top
Wooden clapper | Hollow pipes | attack=.02 leak=.5 return=12 width=.3 throw=.5 tilt=.4 body=.7 splash=.2 release=.7 anchor=.5 ears=.05 haze=0 volume=-4.5 blur=0.03 second=0.5 gap=0.85 | wood | hocket | A dry hollow clack that leaves a short plain note
Moon through bamboo | Plucked flicker | walls=Ring leak=.22 return=9 width=.05 throw=.35 tilt=.4 body=.6 release=5 second=.5 gap=.4 anchor=.4 blur=.2 volume=5 start=.333 | memory | high | Hollow ringing tones on a ring, two waves slowly changing places
Lighthouse in a calm | Plucked flicker | walls=Bowl leak=.15 return=5 width=.1 throw=.5 tilt=.3 body=.9 release=4 anchor=.35 splash=.1 ears=.9 volume=1.5 place=0.03 second=0.25 gap=0.2 start=.2 | round | lamps | Hollow bells that open and narrow a little under every two seconds as they fade
Bell down the well | Shared shimmer | clock=Own return=4 leak=.18 width=.05 throw=.4 tilt=.3 body=.6 haze=.1 attack=.02 release=4 anchor=.5 volume=-1.5 place=0.45 blur=0.1 | tunnel | toll | Struck bright, sinking for four seconds, dim at the bottom
Pennies for wishes | Shared shimmer | clock=Own return=1.5 leak=.28 width=.15 throw=.5 tilt=.5 body=.7 haze=0 attack=.02 release=2.5 anchor=.35 splash=.3 volume=4.5 place=0.2 second=0.4 gap=0.45 start=.5 | stone | rain | Small bells bobbing down and up a quick well
Snow in a bell mouth | Going out | leak=.14 return=9 haze=.4 splash=.2 tilt=.1 width=.25 attack=.04 release=6 anchor=.45 body=.75 volume=6 place=0.3 blur=0.35 | deepfog | built | Muted bells, half breath, sinking slowly out of reach
Drowned village | Shared shimmer | clock=Shared return=8 leak=.1 width=.1 throw=.2 tilt=-.2 body=.1 haze=.25 attack=.02 release=9 anchor=.6 second=.6 gap=.3 volume=-2 place=0.65 blur=0.06 | catch | toll | A dark low bell in a well, lifted with the others every four seconds
Knot of tin cans | Shared shimmer | clock=Own reading=Wave return=6 leak=.35 width=.1 throw=.7 tilt=.05 body=.7 haze=0 attack=.02 release=1 splash=.25 anchor=.5 volume=-2.5 place=0.08 start=.3 | ringmod | hocket | Hollow clinks in a well, sour at the edge and quick to fade
Soft stick on bronze | Breathing organ | leak=.1 attack=.06 release=8 return=6 width=.3 throw=.2 tilt=.1 body=.3 anchor=.6 second=.5 gap=.1 haze=.1 blur=0.28 volume=-2 start=.17 | fifths | toll | A round bowl tone that opens a second after the stroke and then narrows every two
Change tipped in a dish | Breathing organ | leak=.3 attack=.02 release=2 return=3 width=.05 throw=.7 tilt=.6 body=.95 anchor=.4 splash=.5 ears=.9 | lightroom | peal | High bright strokes that pulse once a second
Prayer before rain | Breathing organ | leak=.06 attack=.2 release=7 return=10 width=.15 throw=.4 place=.5 tilt=.3 body=.7 anchor=.3 haze=.3 ears=.8 volume=1 blur=0.6 | rain | lamps | A bowl stroked to sing, full and thin by turns every three seconds
Spoons in one tumbler | Breathing organ | leak=.4 attack=.02 release=1 return=1 width=.2 throw=.4 tilt=.2 body=.65 anchor=.5 splash=.2 haze=0 blur=0.0 | clean | seeds | Short bells with a fast shake in each
Cupped in both hands | Breathing organ | reading=Wave leak=.12 attack=.03 release=5 return=14 width=.4 throw=.3 tilt=0 body=.5 anchor=.5 second=.3 gap=.6 place=0.38 volume=-2 start=.2 | clay | built | A soft hollow bowl, opening at the end of each five second swing
Cracked and still rung | Thrown from afar | leak=.2 attack=.02 release=4 return=9 width=.1 throw=.3 tilt=.1 body=.4 second=.8 gap=1 anchor=.4 blur=.05 haze=.05 | scooped | peal | Fine stripes between two waves, a jarring stroke and a clear end
Bells through a lattice | Thrown from afar | leak=.25 attack=.02 release=3 return=2.5 width=.05 throw=.5 tilt=.2 body=.8 second=.5 gap=.6 anchor=.5 blur=0 volume=-0.5 start=.6 | cascade | rain | Narrow striped bells that glitter as both waves come round
Tuning fork choir | Twin throw choir | walls=Ring leak=.12 haze=0 attack=.03 release=8 return=18 width=.9 gap=.05 tilt=-.3 body=.4 anchor=.8 blur=0.15 start=.5 freeze=.7 | shadow | lamps | Almost pure tones, two waves on a ring a hair apart
Cathedral in a thimble | Thrown from afar | walls=Ring leak=.3 attack=.02 release=2.5 return=5 width=.15 throw=.7 tilt=.4 body=1 second=.6 gap=.4 anchor=.35 volume=4 start=.7 | glasshim | high | A very small clear body, two waves thrown round it hard
Peal in the tall grass | Twin throw choir | haze=.2 leak=.2 attack=.02 release=4 return=4 width=.1 throw=.4 place=.2 gap=.8 splash=.4 tilt=.3 body=.6 | leaves | peal | Bright grained bells with grass in the breath around them
Left hand of a carillon | High keys first | walls=Ring return=6 leak=.12 width=.1 throw=.3 tilt=.2 body=.45 release=4 anchor=.55 splash=.1 volume=-5.5 blur=0.4 second=0.15 gap=0.9 start=.5 | latehall | harp | Bells that ring again by themselves, high ones soonest, low ones late
Carillon in a snowstorm | High keys first | walls=Fading_well return=4 leak=.15 haze=.5 width=.2 throw=.4 tilt=.1 body=.8 release=3 splash=.4 volume=-3 anchor=.6 | weathered | peal | Airy bells that lift again and sink with each coming
Quarter past once more | High keys first | reading=Wave walls=Ring return=8 leak=.25 width=.15 throw=.5 tilt=.3 body=.6 release=3 anchor=.5 volume=1 blur=0.03 second=0.3 gap=0.05 start=.333 | repeats | toll | Hollow bells with a second stroke of their own, softer than the first
Bicycle down the lane | High keys first | walls=Bowl return=2 leak=.2 width=.05 throw=.6 tilt=.6 body=1 release=2 splash=.05 anchor=.5 volume=-4.5 attack=.04 blur=0.1 | panned | peal | Small bright rattling rings, quick to come by
Doves leave the tower | High keys first | walls=Two_rooms return=9 leak=.1 width=.2 throw=.4 tilt=.1 body=.35 haze=.2 release=6 anchor=.45 volume=-1.5 second=0.45 gap=0.7 | gusts | peal | Bells with an octave under them, lifting off again one by one
Twelve told slowly | Frozen twelfth | leak=.15 attack=.02 release=7 start=.333 freeze=.95 return=20 haze=.05 tilt=.15 body=.5 anchor=.6 throw=.3 blur=0.35 | cathedral | toll | A bell whose twelfth stands over it unmoved as both die away
Octave struck in ice | Frozen twelfth | leak=.25 attack=.02 release=3 start=.5 freeze=.9 return=8 haze=0 tilt=.2 body=.65 anchor=.35 width=0 throw=.5 splash=.2 | chamber | high | A hard clear bell that sounds as its octave
Spar of quartz | Frozen twelfth | leak=.3 attack=.02 release=2 start=.2 freeze=.93 return=3 haze=.05 tilt=.5 body=1 anchor=.45 width=.05 throw=.6 splash=.1 ears=.9 blur=0.06 | prism | peal | A hard small bell caught at the fifth part of the way, high partials in front
Sun dogs | Frozen twelfth | leak=.05 attack=.05 release=9 start=.25 freeze=.85 return=14 haze=.2 tilt=.3 body=.7 anchor=.3 width=.15 ears=1 blur=0.28 | octshadow | lamps | Ringing double octaves that swing a little and hang long in the air
Wrong side of the harp | Frozen twelfth | walls=Box leak=.2 attack=.03 release=4 start=.4 freeze=.9 return=5 haze=.1 tilt=.1 body=.6 anchor=.5 throw=.4 second=.5 gap=.5 | harmonic | harp | Bells held shortly before their octave, with a grain of a second wave
Breath on a bell | Wind in the wall | walls=Ring attack=.02 leak=.15 release=5 return=3 width=.1 throw=.5 haze=.2 anchor=.5 splash=.4 tilt=.2 volume=-5.5 blur=0.0 start=.4 | lit | high | A splash of air at the stroke, then moving breath and a plain pitch under it
Gauze over the gong | Wind in the wall | walls=Two_rooms attack=.03 leak=.08 release=7 return=6 width=.3 haze=.5 anchor=.6 splash=.5 tilt=-.3 body=.1 start=.5 | veil | toll | A low soft gong of air, with an octave moving under the ground
Feather and triangle | Ring bells | haze=.3 splash=.35 return=6 leak=.3 width=.15 throw=.3 tilt=-.2 body=.8 release=2 anchor=.5 second=0 blur=0.15 volume=-2 | airsplit | rain | High bells with a wide puff of air, soft in the middle
Steam off the kettle | Wind in the wall | walls=Bowl attack=.02 leak=.25 release=2 return=2 width=.05 throw=.7 haze=.7 anchor=.3 splash=.6 tilt=.4 body=.7 volume=-6.5 blur=0.4 start=.15 | drip | seeds | Hissing strokes with a small high note inside, shaken as they go
Ember days bell | Going out | walls=Ring leak=.1 haze=.7 splash=.3 return=10 width=.4 tilt=-.3 release=8 attack=.03 anchor=.7 body=.3 volume=1 place=0.25 second=0.6 gap=0.55 | smear | toll | A dark breathy bell on a slow ring, its pitch firm to the end
`,
    },
    {
      id: 'tunnel-basses',
      name: 'Tunnel basses',
      category: 'bass',
      rows: `
Under the aqueduct | Tunnel bass | return=10 width=.6 throw=.05 anchor=.5 release=.8 ears=.5 body=.1 leak=.05 blur=0.03 start=.4 volume=-4.5 | deep | lowline | Two dark rooms under each key, the lower octave there at once and slow to give way
Cellar hatch | Tunnel bass | return=2.5 width=.3 throw=.4 leak=.35 release=.3 ears=.03 tilt=0 splash=.3 | console | lowline | A short knock and a round note whose octave drops under it at once
Sunday boiler room | Tunnel bass | return=5 width=.2 throw=.3 leak=.08 tilt=-.4 release=1.5 body=.2 anchor=.35 haze=.3 blur=.4 volume=-3 place=0.55 start=.3 | thump | lowline | A warm rumbling pair of rooms, smeared so only the slow lean is left
Canal lock at night | Minute drone | return=14 start=.2 width=.35 throw=.5 attack=.08 release=1.2 tilt=-.2 anchor=.4 haze=.1 ears=.8 second=.5 gap=.3 volume=1.5 place=0.75 | chamber | lowline | A broad low tone already part way through the wall, a slow grain in it
Two flights down | Tunnel bass | return=4 width=.1 throw=.6 leak=.2 tilt=.2 body=.3 release=.6 anchor=.45 ears=.7 volume=-3.5 | spring | toll | A bright front to each low key, and an octave below that arrives after it
Finger and rug | Dissolving pad | leak=.4 attack=.02 release=.3 width=.35 throw=.15 return=8 tilt=-.2 body=.05 haze=0 splash=.1 anchor=.7 ears=0 blur=0.1 | warm | walk | A plain round plucked bass, nearly all ground
Rope over a beam | Dissolving pad | leak=.3 attack=.02 release=.5 width=.1 throw=.5 return=5 tilt=.2 body=.15 haze=0 splash=.2 anchor=.4 ears=.2 | board | walk | A stringy stroke that loses its edge as it leaks, wooden beneath
Barrel of pitch | Dissolving pad | leak=.5 attack=.02 release=.25 width=.5 throw=.3 place=.7 return=12 tilt=.1 body=0 haze=.05 splash=.5 anchor=.6 blur=0.35 second=0.2 gap=0.75 | iron | walk | A thick short thud with a puff at the front
Cold hands on gut | Dissolving pad | leak=.25 attack=.03 release=.7 width=.2 throw=.3 place=.4 return=3 blur=.3 tilt=-.1 body=.4 haze=.15 anchor=.5 second=.4 gap=.2 start=.65 volume=-1.5 | strings | walk | A muted string with a slow beat, light on its feet
Loading dock | Plucked flicker | reading=Density leak=.35 return=2 width=.15 throw=.4 tilt=0 body=.1 release=.4 anchor=.6 blur=0 splash=.15 volume=-5 place=0.02 second=0.35 gap=0.6 | middle | walk | A hard low pluck that flickers whole every second or two as it fades
Bass clarinet in a lift | Hollow pipes | return=14 width=.4 throw=.2 attack=.06 release=.25 tilt=.1 body=.15 splash=.1 anchor=.5 ears=0 volume=-1 blur=0.06 start=.2 freeze=.9 | larger | lowline | A hollow low reed, close and even
Knuckles on a drainpipe | Hollow pipes | return=6 leak=.45 attack=.02 width=.25 throw=.5 release=.3 tilt=.2 body=.25 splash=.4 anchor=.45 volume=-3.5 second=0.1 gap=0.1 | tunnel | walk | A hollow knock with a short dark tail
Empty cello case | Hollow pipes | return=9 leak=.12 attack=.04 width=.2 throw=.3 place=.3 release=1 tilt=-.1 body=.2 splash=0 anchor=.4 ears=.5 second=.4 gap=.5 volume=-2 blur=0.28 start=.3 | bowed | lowline | A hollow woody low tone with two waves crossing in it
Trawler coming about | Hollow pipes | walls=Ring return=8 attack=.15 width=.3 throw=.5 release=.6 tilt=.4 body=.3 splash=0 anchor=.6 haze=.1 volume=0.5 blur=0.0 second=0.5 gap=0.85 start=.25 | farshore | ground | A nasal low horn on a ring, its odd harmonics coming round in turn
Barefoot on square tiles | Plucked flicker | walls=Two_rooms leak=.2 return=3 width=.4 throw=.2 tilt=.1 body=.2 release=.3 anchor=.35 blur=.1 volume=0 start=.5 | glue | lowline | A hollow bass with a lower octave nodding under it
Half ahead on paddles | Breathing organ | return=2 attack=.03 release=.4 width=.3 throw=.3 tilt=0 body=.1 anchor=.35 haze=.1 second=0 ears=.4 blur=0.15 start=.17 volume=-1.5 | valve | walk | A round bass that beats with a soft even paddle in it
Ox on the threshing mat | Breathing organ | return=6 attack=.04 release=.8 width=.15 throw=.4 tilt=.2 body=.2 anchor=.5 leak=.1 haze=0 second=.5 gap=.4 start=.2 | iron | walk | A reedy low tone that opens every two seconds, heavy below
Asleep on the ferry | Breathing organ | return=9 attack=.3 release=1.5 width=.5 throw=.1 tilt=-.3 body=0 anchor=.55 haze=.2 ears=.7 volume=-0.5 blur=0.4 | currents | ground | A dark swell every three seconds, like an engine heard through a bunk
Grinding wheel | Breathing organ | return=1.2 attack=.03 release=.3 width=.08 throw=.7 tilt=.4 body=.25 anchor=.4 haze=.05 leak=.15 blur=0.4 start=.7 | grit | lowline | A coarse bass with a fast grind in it, easing as it leaks
Pump handle | Breathing organ | return=3 attack=.02 release=.3 width=.25 throw=.2 place=.6 tilt=-.1 body=.35 anchor=.45 leak=.3 splash=.5 | spring | walk | A puff and a short low note, squeezed once and let go
Bottom of the quarry | Going out | leak=.1 return=8 haze=.1 splash=.2 tilt=0 body=.05 width=.3 throw=.3 attack=.03 release=1 anchor=.6 ears=.4 volume=-0.5 place=0.33 blur=0.03 | cave | toll | A low note that sinks for as long as you hold it, rocky and dark
Goods lift going down | Shared shimmer | clock=Own return=3 leak=.05 width=.15 throw=.4 tilt=.2 body=.15 haze=.05 attack=.03 release=.5 anchor=.6 ears=.3 volume=2.5 place=0.03 second=0.25 gap=0.2 | gate | lowline | Each low key dips and comes up again over six seconds, kept dark
Snail on the cellar step | Going out | leak=.2 return=16 haze=.3 splash=0 tilt=-.2 body=.2 width=.5 throw=.15 attack=.06 release=.7 anchor=.5 volume=-2 place=0.45 blur=0.1 start=.4 | blanket | walk | A slow soft bass with some breath, half asleep
Generator behind a wall | Shared shimmer | clock=Shared return=3 leak=0 width=.1 throw=.5 tilt=.1 body=.1 haze=.2 attack=.05 release=.4 anchor=.5 ears=.5 volume=5.5 place=0.2 blur=0.35 second=0.4 gap=0.45 | nextdoor | lowline | A low tone that rises every second and a half on one clock
Sinkhole | Shared shimmer | clock=Own reading=Wave return=5 leak=.12 width=.35 throw=.5 tilt=.1 body=.1 haze=.1 attack=.02 release=.8 anchor=.65 splash=.2 volume=-0.5 place=0.3 | descent | toll | Hollow low crests that sink under the stroke and do not come back in time
Crane cable | Ring bells | release=.5 leak=.25 return=3 tilt=.3 body=.2 anchor=.8 width=.05 second=.3 gap=.4 ears=.3 splash=0 volume=1.5 blur=0.06 start=.5 freeze=.85 | thin | walk | A bright wiry low ring over a firm ground
Rails in August | Glass keys | leak=.2 return=6 width=.1 throw=.5 tilt=.8 body=.25 anchor=.75 release=1 splash=.2 ears=.6 volume=-3.5 | reel | walk | Low bright metal with its overtones coming and going round a ring
Tug and barge | Frozen twelfth | freeze=0 start=.45 attack=.1 release=.8 return=4 width=.3 throw=.4 tilt=.1 haze=.05 anchor=.7 body=.1 blur=0.28 | triode | lowline | A ring in a low register, the octave and the twelfth passing over the ground
Guest room bedsprings | Ring bells | release=1.2 leak=.35 return=1.6 tilt=.3 body=.4 anchor=.9 width=.15 throw=.6 second=.6 gap=.2 splash=.3 ears=.5 volume=-2 blur=0.0 start=.333 | tin | walk | A springy low clank that flickers as it goes, solid underneath
Turntable left on | Frozen twelfth | freeze=.7 start=.1 attack=.2 release=1.5 return=3 width=.5 throw=.2 tilt=-.2 haze=.2 anchor=.85 body=.2 ears=.7 | record | ground | A dark low ring swaying gently to and fro over its own ground
Gravel in the mix | Thrown from afar | return=6 width=.2 throw=.4 attack=.03 release=.4 tilt=.2 body=.1 haze=.05 second=.9 gap=.7 anchor=.5 leak=.1 | forward | lowline | A growling bass, two waves in stripes against each other
Bear in the pantry | Thrown from afar | return=3 width=.4 throw=.5 attack=.05 release=.5 tilt=-.3 body=.05 haze=.1 second=1 gap=.3 anchor=.4 ears=.3 start=.2 volume=2.5 | cloth 1.highCut=2600 | walk | A dark growl that beats slowly as the waves pass through each other
Idling outboard | Twin throw choir | haze=0 return=1.5 width=.2 attack=.03 release=.3 gap=.1 second=.8 tilt=.1 body=.1 anchor=.5 ears=.4 volume=0 blur=0.15 | combo | walk | A low putter of two near waves, whole again every second and a half
Ploughshare | Thrown from afar | walls=Two_rooms return=8 width=.25 throw=.6 attack=.04 release=.7 tilt=.35 body=.35 haze=0 second=.6 gap=.5 anchor=.45 leak=.15 start=.5 | driveroom | lowline | A cutting low tone with stripes in it that sets out an octave down
Chain over the side | Twin throw choir | haze=.1 return=12 leak=.3 attack=.02 release=.5 width=.1 throw=.5 gap=.9 second=.6 tilt=.3 body=.3 anchor=.6 splash=.4 | slap | walk | A rattle of fine stripes at the stroke and a plain bass under it
From octave to ground | Octave asleep | freeze=0 start=.5 return=6 attack=.03 release=.5 width=.2 throw=.3 tilt=.1 body=.2 anchor=.5 haze=0 leak=.1 blur=.1 | tamed | walk | Starts on its octave and opens towards the whole wave as you hold it
Ice on the harbour floor | Octave asleep | start=.5 freeze=.95 attack=.08 release=1 width=.3 throw=.2 tilt=0 body=.15 anchor=.8 haze=.1 ears=.4 | sub | walk | A low key held with its octave fixed above it, calm and even
Twelve below zero | Frozen twelfth | walls=Box start=.333 freeze=.97 attack=.03 release=.4 width=.1 throw=.4 tilt=.1 body=.15 anchor=.8 haze=0 leak=.12 volume=-5 blur=0.4 | console | lowline | A firm bass with the twelfth standing in it like a seam
Quarter turn | Frozen twelfth | walls=Box start=.25 freeze=.8 return=4 attack=.02 release=.4 width=.05 throw=.6 tilt=.2 body=.2 anchor=.7 haze=0 leak=.25 blur=0.03 | wah | walk | A plucked low note with a bright double octave in the front of it
Stuck halfway home | Octave asleep | walls=Two_rooms start=.5 freeze=.9 attack=.1 release=.8 width=.4 throw=.1 tilt=-.1 body=.05 anchor=.35 haze=.15 ears=.6 volume=-1 | darkroom | lowline | Held on the far side of the wall, with the lower octave leading
Bowed from below | Dissolving pad | attack=.5 release=1.2 return=9 width=.3 throw=.4 tilt=.1 body=.15 anchor=.45 haze=.15 splash=0 second=.8 gap=.15 volume=0.5 place=.9 blur=0.1 start=.4 | double | ground | A low string tone that swells in half a second, slowly beating
Barge rounds the bend | Minute drone | attack=1 release=2 return=18 start=.1 width=.5 throw=.2 tilt=-.2 anchor=.4 body=0 haze=.2 ears=.9 place=0.08 second=0.15 gap=0.9 | valley | fifth | A very slow dark swell in two rooms
Dredger at dawn | Hollow pipes | attack=.4 release=1 return=7 walls=Two_rooms width=.2 throw=.5 tilt=.2 body=.1 splash=0 anchor=.35 haze=.1 ears=.6 volume=3 blur=0.35 start=.35 | halfdown | lowline | Hollow bowed tones, the octave below groaning up under them
Glacier floor | Minute drone | walls=Box attack=1.4 release=3 return=30 start=.3 width=.15 throw=.3 tilt=-.5 anchor=.6 body=.05 haze=.4 blur=.7 volume=2 ears=.5 place=0.38 second=0.3 gap=0.05 | lowcath | ground | A dark airy low tone that swells slowly and hardly stirs
Weir below the mill | Wind in the wall | walls=Bowl attack=.2 release=1 return=6 width=.4 throw=.3 haze=.4 anchor=.7 body=.1 tilt=-.2 volume=4.5 place=0.25 start=.2 | millrace | ground | A steady low pitch with moving air over it, squeezed every two seconds
Bellows and floorboards | Wind in the wall | attack=.04 release=.4 return=3 width=.2 throw=.5 haze=.3 anchor=.8 body=.15 splash=.5 leak=.15 volume=0 blur=0.06 | wood | walk | A puff, a low plain pitch, and a stir of air that leaves with it
Sack dropped on straw | Going out | leak=.8 walls=Box return=8 haze=.4 splash=.6 tilt=-.4 body=0 width=.85 attack=.02 release=.3 anchor=.8 volume=-5.5 | felted | walk | A soft low thump with straw in it, gone in half a second | drum
Elephant on the bridge | Tunnel bass | leak=.5 return=1.5 width=.3 throw=.6 splash=.6 tilt=-.1 release=.5 anchor=.6 haze=.1 ears=.3 volume=-3.5 blur=0.28 | late | toll | A heavy step with a shudder of octaves under it | drum
Grating over the line | Wind in the wall | walls=Two_rooms attack=.1 release=1.5 return=5 width=.3 throw=.6 haze=.7 anchor=.5 body=.05 tilt=-.4 ears=.8 volume=6 blur=0.0 start=.25 | grille | lowline | Low air rushing through a wall, a thread of pitch in the middle of it
Slow bony dance | Tunnel bass | walls=Bowl leak=.3 attack=.02 return=5 width=.2 throw=.4 tilt=.1 body=.1 release=.5 anchor=.55 splash=.2 second=.4 gap=.6 place=0.55 | tapespring | walk | A dry bony pluck with one swing of the bowl inside it
`,
    },
    {
      id: 'frozen-colours',
      name: 'Frozen colours',
      category: 'pad',
      rows: `
Pond under glass | Frozen twelfth | return=14 width=.25 throw=.2 tilt=-.4 body=.1 attack=1.6 release=7 haze=.2 anchor=.6 ears=.5 blur=0.7 | bloom | opened | A ring stopped where its twelfth stands, dark, warm and still
Third pane from the left | Frozen twelfth | return=5 width=0 throw=.4 tilt=.1 body=.7 attack=.3 release=2 haze=0 anchor=.06 freeze=.96 | glimmer | suspend | A clear narrow twelfth, its fine edges barely moving
Across the salt lake | Frozen twelfth | return=8 width=.4 throw=.5 tilt=.1 body=.9 attack=.8 release=5 haze=.7 anchor=.3 ears=1 volume=5 blur=0.35 leak=.15 | thinair | long | Breath held on a twelfth, spread wide and dry
Amber with a fly in it | Frozen twelfth | walls=Box return=20 width=.15 throw=.1 place=.3 tilt=-.2 body=.4 attack=.5 release=3 haze=.1 anchor=.4 second=.6 gap=.2 blur=0.5 | ensemble | tides | A box stopped at its twelfth with a second wave caught beside the first
Held by the collar | Frozen twelfth | walls=Two_rooms return=12 width=.2 throw=.3 tilt=0 attack=.15 release=1 haze=.15 anchor=.5 body=.3 ears=.3 | tamed | chorale | Two rooms stopped a third of the way, the low octave locked under the key
Octave over the snow | Frozen twelfth | start=.5 return=20 width=.8 tilt=-.6 body=.25 attack=1.1 release=6 haze=.3 anchor=.3 blur=0.65 leak=.1 | darkhall | built | A soft wide wave halted half way, each key a round dark octave
Sun and its mock | Octave asleep | walls=Ring freeze=.97 width=.1 throw=.3 tilt=0 body=.6 attack=.4 release=4 haze=.05 anchor=.8 ears=.6 second=.4 gap=.3 volume=-0.5 | octshadow | lines | A clear octave over its own ground, a second wave leaning on it
Swan with its reflection | Octave asleep | freeze=.9 width=.4 throw=.2 place=.5 tilt=-.1 body=.5 attack=.8 release=3 haze=.1 anchor=.45 ears=.9 blur=.2 leak=.12 | mirror | lamps | A wave held half way from home, the note and its octave side by side
Ceiling of the baths | Octave asleep | walls=Two_rooms freeze=.95 width=.2 throw=.4 tilt=.1 body=.35 attack=.6 release=5 haze=.45 anchor=.3 ears=.8 | gusts | quartal | Two rooms held where the far one sounds, the low octave in front and steam round it
White noise of snow | Octave asleep | freeze=.8 width=.15 throw=.5 return=6 tilt=.3 body=.9 attack=.5 release=4 haze=.9 anchor=.03 blur=.1 volume=5.5 leak=.15 | airsplit | long | More air than tone, a narrow octave flickering slowly inside it
Four panes, one sash | Frozen twelfth | start=.25 return=9 width=.05 throw=.3 tilt=.15 body=.5 attack=.2 release=1.5 haze=.05 anchor=.55 blur=0.3 | lightroom | chorale | A ring in four copies, so the double octave rings over each key
Needle in the ice | Frozen twelfth | start=.25 freeze=.98 return=30 width=0 throw=.1 tilt=.3 body=1 attack=.7 release=6 haze=.1 anchor=.5 ears=.9 volume=6 | glasshim | high | A very high clear overtone that does not move at all
Above the timber line | Frozen twelfth | start=.2 return=16 width=.1 throw=.4 tilt=0 body=.75 attack=1.4 release=7 haze=.4 anchor=.4 freeze=.92 ears=1 volume=0 blur=0.8 leak=.12 | airtail | opened | Held at a fifth of the way, the fifth harmonic thin above a warm ground
Kite caught in a wire | Frozen twelfth | start=.25 walls=Box freeze=.88 return=3 width=.15 throw=.5 place=.15 tilt=.2 body=.6 attack=.1 release=.8 haze=.05 anchor=.35 blur=0.15 | notch | lines | A high overtone tugged a little to each side of the double octave
Quarter moon in frost | Frozen twelfth | start=.75 return=12 width=.3 throw=.2 tilt=-.1 body=.8 attack=.9 release=4 haze=.25 anchor=.3 second=.7 gap=.6 | phasehall | tides | Three quarters of the way home and stopped, two waves in fine stripes
Photograph of a wave | Dissolving pad | freeze=.99 return=12 width=.1 throw=.4 tilt=.1 body=.4 attack=.2 release=2 haze=0 splash=.2 anchor=.3 ears=.5 blur=0.4 second=0.45 gap=0.7 | ends | quartal | The wave as it was thrown, bright and whole, kept exactly there
Sunlight on one brick | Dissolving pad | freeze=.97 return=20 width=.3 throw=.1 place=.4 tilt=-.2 body=.2 attack=.8 release=5 haze=.1 splash=0 anchor=.5 ears=.3 leak=.12 | valve | suspend | A warm whole wave that never leaves, glowing close by
Mirror with no face | Dissolving pad | freeze=.95 return=4 width=0 throw=.7 place=.8 tilt=-.15 body=.7 attack=.05 release=3 haze=.05 splash=.4 anchor=0 ears=.8 volume=-1.5 blur=0.03 second=0.6 gap=0.55 | negative | lines | A hard bright wave held at the moment it was thrown, its octave forward
Museum after lights out | Dissolving pad | freeze=.9 return=8 width=.5 throw=.3 second=.8 gap=.3 tilt=-.4 body=.1 attack=1.2 release=6 haze=.2 splash=0 anchor=.45 blur=0.45 | nave | opened | Two dark whole waves that stand together and stir very slowly
Cut flowers | Dissolving pad | freeze=.85 return=6 width=.2 throw=.5 second=.5 gap=.8 tilt=.2 body=.6 attack=.1 release=1.5 haze=.2 splash=.5 anchor=.35 ears=1 volume=1.5 place=0.75 leak=.2 | swirl | response | Opens bright and striped, then only trembles round where it began
Haze kept in a jar | Dissolving pad | start=.13 freeze=.98 return=12 width=.2 throw=.3 tilt=0 body=.3 attack=.7 release=4 haze=.6 splash=0 anchor=.3 volume=2 place=0.02 blur=0.95 | tube | opened | The wave at its most dissolved, a soft airy cluster of harmonics that stays
Cloud at a standstill | Dissolving pad | start=.09 freeze=.96 return=25 width=.05 throw=.5 tilt=-.3 body=.15 attack=1.8 release=7 haze=.35 splash=0 anchor=.5 ears=.9 volume=4.5 place=0.33 second=0.2 gap=0.75 | cloud | long | A dark crowd of harmonics stopped early on its way
Bees in a wall | Dissolving pad | start=.3 freeze=.93 return=5 width=.1 throw=.6 tilt=.1 body=.5 attack=.4 release=2 haze=.1 splash=0 anchor=.25 second=.8 gap=.5 ears=.6 volume=-1 blur=0.1 leak=.1 | drifter | tides | A close hum of harmonics near the twelfth, two waves grinding slowly
Motes in a projector | Dissolving pad | start=.42 freeze=.95 return=10 width=0 throw=.4 tilt=.35 body=.8 attack=.3 release=3 haze=.5 splash=.2 anchor=.06 ears=1 blur=.1 volume=3.5 second=0.35 gap=0.6 | dust | quartal | A thin bright haze of upper harmonics hanging before the octave
Grey wool, grey sky | Dissolving pad | start=.18 freeze=.9 return=15 width=.85 throw=.1 tilt=-.7 body=.3 attack=2 release=8 haze=.4 splash=0 anchor=.6 blur=.8 volume=0.5 place=0.03 leak=.15 | blanketw | built | A dull warm haze, hardly any edge, held and slowly breathing
Weathercock in a calm | Frozen twelfth | freeze=.8 return=3 start=.333 width=.15 throw=.3 tilt=.1 body=.5 attack=.2 release=2 haze=.1 anchor=.5 ears=.7 blur=0.35 volume=6 | panned | lines | A ring that swings round its twelfth and back again, over and over
Pendulum in a bare hall | Dissolving pad | freeze=.75 start=.5 return=2 width=.2 throw=.2 place=.6 tilt=0 body=.2 attack=.4 release=3 haze=.1 splash=0 anchor=.4 | late | opened | A box swinging to and fro across its octave every few seconds
Hesitating at the door | Dissolving pad | freeze=.8 start=.08 return=2 width=.1 throw=.5 tilt=.2 body=.65 attack=.15 release=1.5 haze=.15 splash=.1 anchor=.3 ears=.5 volume=-0.5 blur=0.06 second=0.1 gap=0.1 | bed | suspend | Never quite leaves: the wave loosens, turns round and comes back
Seesaw under frost | Frozen twelfth | walls=Two_rooms freeze=.6 start=.25 return=2 width=.3 throw=.4 tilt=.1 body=.4 attack=.5 release=3 haze=.2 anchor=.4 blur=0.28 leak=.1 | chorale | quartal | Two rooms with the low octave tipping in and out
Compass needle | Frozen twelfth | reading=Wave freeze=.9 start=.333 return=1.2 width=.1 throw=.3 tilt=.2 body=.6 attack=.3 release=2 haze=.05 anchor=.45 | vibrato | response | Hollow crests on a ring that tremble round one place
Well with a lid of ice | Shared shimmer | clock=Own freeze=.95 return=12 start=.1 width=.2 throw=.4 tilt=.1 haze=.3 attack=.6 release=5 body=.45 anchor=.5 volume=0 place=0.45 blur=0.6 | seasons | built | A well stopped near the top, its breath turned to frost
Stone asleep | Going out | leak=.15 freeze=.97 start=.5 haze=.3 tilt=-.3 body=.05 attack=1 release=6 anchor=.65 width=.4 volume=5 place=0.2 second=0.5 gap=0.85 | cave | ground | A dark low resonance, sunk half way and left there
One blanket for two | Minute drone | freeze=.97 start=0 return=20 width=.15 throw=.3 attack=.6 release=3 haze=.1 tilt=.1 body=.5 blur=.1 | slowdrift | chorale | The wave held in the near room, with only a shade of the octave below
Lamp in the far room | Minute drone | freeze=.97 start=.45 return=20 width=.3 throw=.5 attack=.9 release=4 haze=.2 tilt=.2 body=.65 anchor=.35 ears=.3 volume=2 second=0.25 gap=0.2 leak=.12 | across | tides | Held in the far room, the octave below singing and the key above it
Unrung temple bowl | Breathing organ | freeze=.97 start=.07 return=12 width=.2 throw=.3 tilt=.2 attack=.5 release=3 haze=.3 anchor=.7 body=.4 volume=6 place=0.3 | sway | lamps | A bowl stopped early in its swing, calm and breathy
Hollow hour | Hollow pipes | freeze=.98 start=.2 width=.3 throw=.3 attack=1 release=5 splash=0 tilt=-.2 body=.35 haze=.3 anchor=.3 ears=.4 volume=3.5 blur=0.4 second=0.4 gap=0.45 | undertow | long | Hollow crests caught half dissolved, a still and airy reed
Straw held in the wind | Hollow pipes | freeze=.95 start=.4 walls=Ring width=.1 throw=.3 attack=.4 release=2 splash=0 tilt=.2 body=.7 haze=.45 anchor=.75 ears=1 volume=6 | veil | lines | Bright hollow crests stopped on a ring, with breath round them
Winter organ point | Hollow pipes | freeze=.99 start=0 width=.5 throw=.1 attack=.3 release=1.5 splash=.2 tilt=.1 body=.15 haze=.05 anchor=.5 ears=0 volume=-1 blur=0.7 | glue | ground | Plain hollow tones that hold without a flicker
Blue hour without birds | Hollow pipes | freeze=.8 start=.6 return=6 walls=Two_rooms width=.2 throw=.4 attack=1.3 release=6 splash=0 tilt=-.3 body=.2 haze=.2 anchor=.35 blur=0.0 leak=.15 | undershim | opened | Hollow tones in two rooms, the octave beneath them caught as it turns
Nettle paper | Hollow pipes | freeze=.9 start=.13 return=3 width=.05 throw=.6 attack=.2 release=2.5 splash=.1 tilt=.2 body=.9 haze=.2 anchor=.4 second=.6 gap=.7 volume=3 | bridge | quartal | A thin reedy stripe of sound, nearly still, with a small buzz
Bowed glass rim | Frozen twelfth | start=.5 return=15 width=.1 throw=.3 tilt=.2 body=.8 attack=.45 release=1.5 haze=.15 anchor=.6 splash=.1 blur=0.15 | pitchup | lines | A bowed clear octave that speaks slowly and keeps its colour | string
Viols on one long bow | Dissolving pad | freeze=.92 start=.06 return=8 width=.12 throw=.4 tilt=.1 body=.35 attack=.35 release=.8 haze=.15 splash=0 anchor=.35 second=.4 gap=.1 ears=.5 volume=-1 place=0.65 leak=.15 | board | suspend | A close string tone, held just after its brightest moment | string
Frost on the gut | Frozen twelfth | walls=Box start=.333 freeze=.9 return=5 width=.05 throw=.5 tilt=.15 body=.55 attack=.25 release=1 haze=.35 anchor=.45 blur=0.4 leak=.2 | darkroom | lines | A bowed harmonic at the twelfth with rosin in it | string
Cellos in the cloakroom | Minute drone | freeze=.9 start=0 return=10 width=.2 throw=.4 attack=.5 release=1.5 haze=.1 tilt=0 body=.15 blur=.2 second=.5 gap=.2 ears=.6 anchor=.45 place=0.08 leak=.12 | twins | suspend | Low bowed tones in two rooms, with a slow roll between two waves | string
Rosin and breath | Thrown from afar | freeze=.95 return=8 width=.3 throw=.3 attack=.4 release=1.2 tilt=.1 body=.4 haze=.4 second=.7 gap=.5 anchor=.4 blur=.2 | plate | chorale | A grained bowed tone of two waves, as still as a held bow | string
Breath held in | Wind in the wall | freeze=.75 start=.1 return=3 width=.2 throw=.5 attack=.5 release=2.5 haze=.4 anchor=.25 body=.6 tilt=.15 volume=6 blur=0.03 second=0.15 gap=0.9 leak=.15 walls=Ring | breathing | tides | Air that swings a little way out and back, over a soft pitch
Sleeping dormitory | Wind in the wall | freeze=.4 start=.3 return=5 walls=Bowl width=.4 attack=.8 release=4 haze=.6 anchor=.3 body=.2 tilt=-.4 ears=.9 leak=.15 | farshore | opened | Low air going to and fro in a bowl, as many sleepers do
Ah, kept under ice | Twin throw choir | freeze=.96 start=.1 return=12 width=.3 haze=.4 attack=.8 release=4 tilt=0 gap=.4 anchor=.35 volume=-1 blur=0.35 leak=.1 | ah | opened | Two waves caught as they begin to part, an airy vowel that stays open | voice
Oo from the next valley | Twin throw choir | freeze=.9 start=.4 return=10 width=.8 haze=.5 attack=1.2 release=6 tilt=-.4 body=.3 gap=.7 second=.6 anchor=.5 volume=-2 blur=0.5 | oobehind | tides | A dark round vowel of two waves held before their octave | voice
Choir behind shutters | Twin throw choir | walls=Ring freeze=.97 start=.333 return=16 width=.2 haze=.3 attack=.6 release=3 tilt=.1 body=.6 gap=.2 anchor=.5 volume=0.5 | vowels | chorale | Voices of a ring stopped at the twelfth, a thin high vowel over the ground | voice
`,
    },
    {
      id: 'plucked-flickers',
      name: 'Plucked flickers',
      category: 'plucked',
      rows: `
Grasshopper at noon | Plucked flicker | return=1 throw=.5 leak=.2 tilt=.15 body=.5 release=.9 splash=0 anchor=.5 volume=1.5 place=0.38 attack=.02 | round | ostinato | Hollow plucks that flicker through one whole return a second
Paper knife | Plucked flicker | return=1.4 width=0 throw=.9 leak=.45 tilt=.2 body=.45 release=.3 anchor=.4 ears=.4 volume=2.5 place=0.25 second=0.3 gap=0.05 | strikes | ostinato | A hard narrow hollow pluck, its crests thrown past and back once
Rice on a drum skin | Plucked flicker | return=2 width=.3 throw=.4 leak=.75 tilt=.1 body=.8 release=.25 splash=.5 haze=.2 anchor=.5 volume=-3 place=0.55 start=.4 | gated | rain | Short hollow plucks with a spatter of air
Raffia and reed | Plucked flicker | return=3 width=.2 throw=.2 place=.5 leak=.25 tilt=-.1 body=.4 release=1.5 second=.6 gap=.3 anchor=.35 start=.4 | board | harp | Hollow plucked reeds, two waves changing places as they fade
Cricket in the stairwell | Plucked flicker | return=1.2 throw=.6 leak=.2 tilt=.3 body=1 release=2 ears=1 blur=.1 volume=3.5 place=0.75 start=.7 | farecho | rain | High hollow plucks glinting quickly and fading into the walls
Last apples on the tree | Plucked flicker | reading=Density return=1.5 width=.2 throw=.4 leak=.3 tilt=.1 body=.3 release=1 anchor=.4 volume=-5 second=0.45 gap=0.7 | room | harp | Round plucks that come whole every second and a half
Willow basket | Plucked flicker | reading=Density return=1 width=.4 throw=.2 place=.7 leak=.22 tilt=-.2 body=.2 release=1.5 blur=.2 anchor=.5 haze=.1 volume=-4.5 start=.5 freeze=.5 | warm | ostinato | Dark supple plucks with a soft flutter in them
Copper and thread | Plucked flicker | reading=Density return=2.2 width=.02 throw=.6 leak=.4 tilt=.25 body=.7 release=.7 splash=.3 anchor=.3 volume=-2.5 second=0.6 gap=0.55 | slap | seeds | Metallic plucks that glint again after two seconds if they are still there
Hop pickers | Plucked flicker | reading=Density return=4 width=.15 throw=.3 place=.3 leak=.5 tilt=0 body=.5 release=.4 splash=.05 anchor=.6 second=.5 gap=.5 volume=-4 start=.8 | wood | hocket | Dry lively plucks, a grain at the front and a round stop
Rainwater butt | Plucked flicker | reading=Density return=1.3 width=.3 throw=.5 leak=.28 tilt=.1 body=.1 release=1.2 splash=.4 haze=.2 anchor=.3 volume=-1.5 place=0.02 second=0.2 gap=0.75 | cistern | rain | Wet plucks that shiver, with a drop of air at each
Thumb piano on a porch | Glass keys | leak=.5 return=1.8 width=.2 throw=.4 tilt=.1 body=.35 anchor=.7 release=.5 splash=.1 volume=1 start=.25 freeze=.8 | tin | ostinato | A round tongue of metal on a ring with a small buzz of overtones at the front
Tongues of spring steel | Glass keys | leak=.35 return=1.2 width=.05 throw=.6 tilt=.3 body=.6 anchor=.6 release=1.2 splash=0 ears=.8 volume=-2.5 | chorale | hocket | Springy ring plucks whose overtones wheel round quickly
Needle and gramophone | Glass keys | leak=.45 return=3 width=.1 throw=.3 place=.6 second=.6 gap=.2 tilt=0 body=.8 anchor=.5 release=.6 volume=-4.5 start=.333 freeze=.9 | record | seeds | Small metal plucks with a slow beat, as from a comb of teeth
Ring on a banister | Glass keys | leak=.55 return=6 width=.3 throw=.5 place=.2 tilt=.4 body=.5 anchor=.8 release=.3 splash=.3 volume=-3.5 start=.4 | chamber | walk | A solid low knock with a bright edge, quickly over | bass
Barbed wire harp | Glass keys | leak=.2 return=2.5 width=0 throw=.8 tilt=.1 body=.4 anchor=.5 release=3 splash=.1 second=.4 gap=.7 ears=.9 volume=-4 start=.66 freeze=.8 | spring | harp | Wiry ring plucks, hard at the stroke and long in their overtones
Almonds tipped out | Breathing organ | attack=.02 leak=.45 return=2 width=.1 throw=.5 tilt=.2 body=.85 release=.4 haze=0 splash=.2 anchor=.5 volume=-2.5 blur=0.1 start=.17 | tiles | seeds | Bright plucks that shut and open again before they are done
Skip on the jetty | Breathing organ | attack=.02 leak=.35 return=1 width=.2 throw=.4 tilt=.1 body=.45 release=.7 haze=.1 splash=.3 anchor=.4 ears=.8 volume=-3.5 | stone | ostinato | Plucks with three quick pulses inside each second
Cork on the tide | Breathing organ | attack=.02 leak=.2 return=4 width=.4 throw=.3 place=.4 tilt=-.2 body=.25 release=1.5 haze=.2 anchor=.45 second=.5 gap=.1 blur=0.35 start=.2 | sunk | harp | Soft dark plucks bobbing in a bowl, a little less than once a second
Saddle bells | Breathing organ | attack=.02 leak=.4 return=1.4 width=.02 throw=.8 tilt=.5 body=1 release=.6 haze=0 splash=.1 anchor=.3 volume=3 blur=0.06 start=.15 | clean | hocket | Jingling plucks, high and quickly shaken
Banjo on a raft | Breathing organ | walls=Bowl reading=Wave attack=.02 leak=.5 return=3 width=.05 throw=.6 tilt=.4 body=.4 release=.5 splash=.4 anchor=.35 haze=0 place=0.33 start=.2 volume=0 | glaze | ostinato | A twang of hollow crests in a bowl, snapped off
Stone skipped twice | Shared shimmer | clock=Own attack=.02 leak=.4 return=1 width=.15 throw=.5 tilt=.2 body=.5 release=.5 haze=.05 splash=.3 anchor=.5 ears=.6 volume=-0.5 place=0.03 blur=0.28 | stone 1.mix=0.22 | rain | Plucks that dip and surface in a quick well
Fishbone comb | Shared shimmer | clock=Own reading=Wave attack=.02 leak=.3 return=2 width=.1 throw=.4 tilt=.1 body=.75 release=.8 haze=0 anchor=.45 splash=.1 volume=5 place=0.45 second=0.35 gap=0.6 | prism | seeds | Hollow plucks in a well that fan out as they sink
Damp gut by the stove | Going out | attack=.02 leak=.3 return=5 haze=.15 splash=.2 width=.25 tilt=.1 body=.4 release=1 anchor=.55 throw=.4 volume=0 place=0.2 blur=0.0 start=.4 | reel | harp | Plucked strings that sink into a breath of their own
Peppercorns | Shared shimmer | clock=Own attack=.02 leak=.85 return=3 width=.02 throw=.7 tilt=-.1 body=.85 release=.2 haze=.1 splash=.4 anchor=.5 volume=-4 place=0.3 blur=0.15 second=0.1 gap=0.1 | booth | rain | Very short sharp plucks, all front
Match struck in a cave | Going out | attack=.02 leak=.2 return=8 haze=.5 splash=.8 width=.1 throw=.5 tilt=0 body=.6 release=3 anchor=.4 volume=-2 place=0.65 | cave | response | A long flare of air at each pluck and a low glow under it
Mandolin through a wall | Tunnel bass | leak=.35 return=1.5 width=.1 throw=.5 tilt=.4 body=.7 release=.6 ears=.8 anchor=.3 splash=.2 attack=.02 volume=1 blur=0.4 start=.5 | nextdoor | ostinato | Bright plucks with a quick change of octave in each
Deckchair in a breeze | Tunnel bass | leak=.4 return=3 width=.3 throw=.3 tilt=.1 body=.5 release=.5 ears=.4 anchor=.5 attack=.02 haze=.15 volume=-2 | amptrem | hocket | Slack plucks with a lower octave flapping after them
Line hung in two winds | Minute drone | start=.3 attack=.02 leak=.25 return=2 width=.15 throw=.6 tilt=.2 body=.4 release=2 haze=.1 anchor=.35 blur=.05 second=.6 gap=.6 | chorushall | harp | Plucked wires in two rooms, striped and bouncing between octaves
Gate chain | Tunnel bass | leak=.5 return=1 width=0 throw=.8 tilt=.2 body=.85 release=.4 ears=1 anchor=.45 attack=.02 splash=.5 volume=-4.5 blur=0.03 | onesec | seeds | A rattle of octaves at each pluck, harder with a harder touch
Half-open guitar case | Minute drone | start=0 attack=.02 leak=.3 return=5 width=.35 throw=.3 tilt=0 body=.3 release=1 haze=.05 anchor=.6 blur=.2 ears=.3 second=0.5 gap=0.85 | combo | ostinato | Woody plucks, an octave beneath that leans in after a second
Button on a thread | Dissolving pad | attack=.02 leak=.75 release=.2 return=6 width=.2 throw=.4 tilt=.1 body=.6 haze=0 splash=.1 anchor=.5 place=0.08 blur=0.1 | smaller | ostinato | A clean small stopped pluck with nothing after it
Pizzicato in wool | Dissolving pad | attack=.03 leak=.5 release=.3 return=9 width=.5 throw=.2 tilt=-.3 body=.3 haze=.1 splash=.2 anchor=.6 ears=.3 place=0.38 second=0.25 gap=0.2 start=.3 | darkroom | seeds | Muffled short plucks, warm and soft in front | string
Pizzicato on the landing | Dissolving pad | attack=.03 leak=.4 release=.5 return=4 width=.15 throw=.5 place=.6 tilt=-.1 body=.3 haze=.15 splash=.3 anchor=.45 second=.5 gap=.2 blur=0.35 start=.5 freeze=.7 | chamber | hocket | Plucked strings with a hint of the octave and a slow beat | string
Kneeling harpist | Dissolving pad | attack=.02 leak=.55 release=.4 return=2 width=.1 throw=.3 tilt=.3 body=.8 haze=0 splash=0 anchor=.35 ears=.8 volume=-4.5 place=0.25 blur=0.06 second=0.4 gap=0.45 | repeats | ostinato | Light damped plucks that glint once and stop
Wood block and wire | Plucked flicker | leak=.9 return=3 width=.15 throw=.8 tilt=.35 body=.75 release=.2 splash=.7 anchor=.7 place=0.55 | felted | hocket | A stopped knock of air and wood with a pitch inside
Harp in an empty pool | Dissolving pad | attack=.02 leak=.15 release=4 return=3 width=.12 throw=.4 tilt=.2 body=.5 haze=.1 splash=.1 anchor=.45 ears=.9 blur=0.28 second=0.15 gap=0.9 start=.4 | tank | harp | Long open plucks that gather to a whole every three seconds
Zither on the lawn | Plucked flicker | leak=.12 release=5 return=6 width=.08 throw=.5 tilt=.3 body=.6 anchor=.3 ears=.8 blur=.1 volume=-4 clock=By_pitch start=.5 | harpring | harp | Hollow ringing strings that lift again as they die, the high ones first
Lute left in the rain | Dissolving pad | attack=.02 leak=.22 release=2 return=10 width=.3 throw=.3 place=.2 tilt=0 body=.25 haze=.2 splash=.3 anchor=.5 second=.6 gap=.4 blur=0.0 start=.2 | rain | lines | Warm plucked strings with a soft grain, going slowly out
Dulcimer, snow outside | Ring bells | release=3 leak=.25 return=3 throw=.4 place=.1 second=.3 gap=.5 tilt=.3 body=.55 anchor=.55 splash=.3 volume=-0.5 blur=0.15 | plate | peal | Struck strings round a ring, bright and quick to turn
Long strings over water | Minute drone | start=.4 attack=.02 leak=.1 release=6 return=4 width=.1 throw=.5 tilt=.1 body=.35 haze=.15 anchor=.4 blur=.1 ears=1 second=0.3 gap=0.05 | currents | harp | Low plucked strings in two rooms, ringing on with a moving octave
Two hands on a reed mat | Thrown from afar | attack=.02 leak=.35 release=.8 return=2 width=.2 throw=.4 tilt=.1 body=.5 haze=0 second=.9 gap=.8 anchor=.4 clock=Shared start=.3 | orbits | ostinato | Striped plucks lifted together once a second while they fade
Cat on the zither | Thrown from afar | attack=.02 leak=.25 release=1.5 return=1.2 width=.05 throw=.5 place=.1 tilt=.2 body=.7 second=.7 gap=.5 anchor=.35 blur=0 volume=-1.5 freeze=.3 | cascade | seeds | Nervous striped plucks, scattering fast
Brass tacks | Thrown from afar | attack=.02 leak=.5 release=.3 return=4 width=.1 throw=.7 tilt=.3 body=.6 haze=.05 second=.6 gap=1 anchor=.5 splash=.2 blur=.05 | driveroom | ostinato | Hard plucks with the finest stripes the box can hold
Knitting to the radio | Thrown from afar | reading=Wave attack=.02 leak=.4 release=.6 return=1.6 width=.3 throw=.3 tilt=0 body=.45 second=.8 gap=.4 anchor=.45 start=.35 freeze=.4 volume=0 | cassette | seeds | Hollow plucks with a close knit of two waves
Goldfinch at the thistle | Twin throw choir | walls=Ring haze=.05 attack=.02 leak=.35 release=.7 return=1.4 width=.1 gap=.9 second=.6 splash=.2 tilt=.4 body=.95 anchor=.5 volume=5 start=.6 | octhop | rain | Tiny bright plucks on a ring that flit twice and vanish
Dandelion in seed | Going out | walls=Box attack=.02 leak=.3 haze=.6 splash=.4 return=2 width=.3 tilt=.1 body=.7 release=1.5 anchor=.35 volume=-3.5 blur=0.15 second=0.45 gap=0.7 start=.3 | airsplit | rain | Plucks made of breath, blown apart as they flicker
Moth wings on paper | Wind in the wall | attack=.04 leak=.4 release=.6 return=2 width=.2 throw=.3 haze=.4 anchor=.85 splash=.05 body=.7 tilt=.1 volume=-3.5 | whisper | ostinato | Soft fluttering puffs round a small steady pitch
Threshold of hearing | Dissolving pad | attack=.04 leak=.35 release=1 return=1.5 width=.9 throw=.1 tilt=-.2 body=.6 haze=.4 splash=.2 anchor=.5 blur=.3 second=0.6 gap=0.55 start=.4 volume=0.5 | veil | response | The softest pluck, a wide wave with breath on it
Bare feet on sand | Wind in the wall | walls=Two_rooms attack=.02 leak=.5 release=.4 return=2 width=.4 haze=.3 anchor=.7 splash=.6 body=.2 tilt=-.2 blur=0.03 | shaft | walk | Padded steps of air over a short low pitch | drum
Finger on a lantern | Plucked flicker | walls=Ring leak=.28 return=5 width=.35 throw=.3 tilt=-.2 body=.65 haze=.3 splash=.5 release=1.5 anchor=.5 volume=-2 place=0.75 second=0.2 gap=0.75 start=.333 | glints | harp | Papery hollow plucks on a ring, a puff and a light tone
`,
    },
    {
      id: 'choirs-and-air',
      name: 'Choirs and moving air',
      category: 'voice',
      rows: `
Twelve in a circle | Twin throw choir | return=9 width=.3 place=.2 gap=.1 haze=.3 tilt=.1 attack=.5 release=2 anchor=.5 blur=0.1 start=.3 | chapel | chorale | Two near waves, beating like many voices on one note
Hummed in a sleeping car | Twin throw choir | return=20 width=.9 throw=.05 haze=.15 tilt=-.6 body=.2 attack=.4 release=1.5 gap=.4 anchor=.7 ears=.3 volume=1.5 start=.4 leak=.12 | cloth | chant | A closed hum of two wide waves, dark and near
Novices at a grille | Twin throw choir | return=12 width=.15 haze=.4 tilt=.15 body=.8 second=.6 gap=.35 attack=.5 release=4 anchor=.4 volume=-1 blur=0.35 | glassoct | lines | High light voices, a fine grain where two waves cross
Crowd by the river | Twin throw choir | return=4 width=.2 throw=.4 haze=.7 second=1 gap=.8 attack=.3 release=3 tilt=-.1 ears=1 blur=.1 volume=0.5 start=.65 anchor=.08 leak=.1 | flock | quartal | Many loose voices in one breath, stirring every few seconds
Mouths barely open | Twin throw choir | return=30 width=.5 haze=.5 tilt=-.3 body=.35 attack=1.3 release=6 second=.5 gap=.2 anchor=.3 splash=.2 start=.2 | oo | opened | A round shaded vowel that opens by degrees
Boys in the loft | Frozen twelfth | walls=Ring freeze=.2 start=0 return=10 width=.3 throw=.1 tilt=0 body=.75 attack=.4 release=1.5 haze=.35 anchor=.8 ears=.4 blur=0.06 | vowels | lines | Clear head tones on a ring, their overtones passing far off
Shepherd to shepherd | Frozen twelfth | freeze=.7 start=.2 return=4 width=.15 tilt=.1 body=.5 attack=.25 release=2 haze=.2 anchor=.75 second=.4 gap=.2 volume=6 | farecho | chant | An open calling voice with overtones swaying above it
Women at the well | Shared shimmer | clock=Own return=15 width=.3 throw=.2 tilt=.05 body=.55 haze=.4 attack=.6 release=3 anchor=.7 second=.5 gap=.15 volume=0 blur=0.28 start=.15 | late | suspend | Voices that sink slowly as they hold, two beating side by side
Old men on one tone | Minute drone | return=16 start=.1 width=.35 attack=.7 release=2 haze=.25 tilt=0 body=.3 anchor=.4 blur=.3 ears=.5 second=.4 gap=.1 volume=1.5 freeze=.6 | monks | steps | A low chanted tone and the octave under it, half in the throat
Throat and kettle | Minute drone | return=5 start=.35 width=.1 throw=.4 attack=.3 release=1.5 haze=.1 tilt=.2 body=.4 anchor=.45 blur=.1 second=.6 gap=.5 place=0.02 leak=.15 freeze=.5 | ah | fifth | A rough low voice in two rooms with harmonics picked out above
Choir of empty chairs | Wind in the wall | second=.8 gap=.3 return=12 width=.4 haze=.5 attack=1.2 release=5 anchor=.4 body=.5 tilt=-.2 place=0.33 blur=0.65 start=.25 leak=.1 volume=1.5 | nave | opened | Breath of two waves with a faint choir of pitch in it
Whispered before sleep | Wind in the wall | second=.5 gap=.6 return=4 width=.2 haze=.8 attack=.2 release=1 anchor=.08 body=.65 tilt=.2 ears=.5 volume=4 place=0.03 leak=.2 | booth | response | Close whispers, a pitch just under the breath
All breathe together | Wind in the wall | walls=Bowl return=9 width=.35 throw=.4 haze=.6 attack=.6 release=2.5 anchor=.5 body=.4 tilt=0 second=.4 gap=.2 place=0.45 blur=0.3 start=.15 | chapel | tides | Voices as breath alone, in and out every three seconds
Speaking in church | Wind in the wall | walls=Ring return=4 width=.15 throw=.35 haze=.3 attack=.15 release=.8 anchor=.8 body=.7 tilt=.1 volume=3.5 place=0.2 blur=0.0 second=0.35 gap=0.6 leak=.15 | tiles | chant | Low consonants of air over an even tone, gathering on overtones
Lullaby through a sheet | Wind in the wall | walls=Two_rooms return=10 width=.5 throw=.2 haze=.4 attack=.5 release=2 anchor=.6 body=.45 tilt=-.4 ears=.4 volume=4 | veil | chant | A soft hummed line with air all round it and a hint of the octave below
Vowel in the coal hole | Hollow pipes | second=.8 gap=.2 return=14 width=.4 attack=.35 release=1.5 splash=.1 tilt=-.1 body=.35 haze=.3 anchor=.5 volume=-1.5 blur=0.15 start=.3 | oo | lines | A hollow vowel, two waves of crests in slow beats
Hailed from the bridge | Hollow pipes | second=.6 gap=.7 return=8 width=.15 throw=.4 attack=.15 release=.6 splash=0 tilt=.2 body=.6 haze=.15 anchor=.45 volume=4.5 start=.7 leak=.2 | hollow | chant | A pinched hollow voice, close up and grained
Tenor on a stone stair | Hollow pipes | walls=Ring return=18 width=.35 attack=.4 release=2.5 splash=.2 tilt=.1 body=.7 haze=.25 anchor=.7 ears=.4 volume=6 blur=0.4 second=0.1 gap=0.1 start=.25 | vibrato | chant | A clear hollow high voice, firm under its slow ring of overtones
Two sisters singing | Hollow pipes | walls=Two_rooms second=.7 gap=.1 return=4 width=.3 attack=.3 release=1.5 splash=.1 tilt=0 body=.55 haze=.2 anchor=.4 ears=.8 volume=-1 blur=0.03 start=.5 | double | lines | Hollow voices that cross to the octave below and back
Marsh caller at dusk | Plucked flicker | walls=Bowl leak=0 return=6 width=.2 throw=.4 attack=.3 release=2 tilt=.1 body=.5 haze=.35 anchor=.5 volume=2 place=0.3 second=0.5 gap=0.85 start=.17 | farshore | response | A hollow far call that opens on each slow swing
Flute from the hill | Hollow pipes | return=25 width=.8 throw=.05 attack=.12 release=.6 splash=.5 tilt=-.2 body=.65 haze=.35 anchor=.6 ears=.05 volume=2 blur=0.1 freeze=.6 | valley | chant | A soft breathy flute, nearly one harmonic, with a puff at each note | wind
Whistle cut from bone | Hollow pipes | return=7 width=.5 throw=.3 attack=.06 release=.4 splash=.7 tilt=.2 body=1 haze=.4 anchor=.45 ears=.3 volume=-1 second=0.25 gap=0.2 | chamber | chant | A thin high whistle with a hard puff of air in front | wind
Ocarina of warm clay | Hollow pipes | walls=Bowl return=10 width=.85 throw=.1 attack=.1 release=.4 splash=.4 tilt=-.4 body=.5 haze=.2 anchor=.6 ears=.2 volume=-2 blur=0.35 start=.2 | clay | lines | A round plain whistle that leans a little with each swing | wind
Double reed at the gate | Breathing organ | walls=Box return=10 width=.02 throw=.6 attack=.05 release=.3 tilt=.15 body=.55 haze=.1 splash=.3 anchor=.4 blur=.4 ears=.05 volume=-1 place=0.65 freeze=.9 | reveal | chant | A bright double reed, sharp at the tongue and steady after | wind
Horn from a snowfield | Dissolving pad | return=15 width=.45 throw=.4 attack=.12 release=1 tilt=-.2 body=.25 haze=.1 splash=.1 anchor=.8 ears=.3 volume=-2.5 place=0.08 leak=.15 | lowshadow | response | A round mellow call that dissolves slowly as it is held | wind
Panpipe on the lower lip | Hollow pipes | return=12 width=.4 throw=.2 attack=.03 release=.3 splash=.9 tilt=0 body=.75 haze=.5 anchor=.4 ears=.4 volume=-5 blur=0.06 second=0.4 gap=0.45 leak=.25 | lightroom | seeds | A spit of air and a short hollow pipe, half breath | wind
Wind in the lift shaft | Wind in the wall | return=7 width=.1 throw=.7 haze=.6 attack=.8 release=3 anchor=.06 body=.2 tilt=0 ears=.8 volume=2 | shaft | lamps | A low whistle of moving air, gathering as the wave comes by | wind
Draught at floor level | Wind in the wall | walls=Fading_well return=5 width=.05 throw=.8 haze=.9 attack=.4 release=2 anchor=.35 body=.6 tilt=.1 volume=2 blur=0.28 second=0.15 gap=0.9 start=.6 leak=.15 | airsplit | lines | A thin draught that whines high, sinks and starts again | wind
Breath on a bottle neck | Wind in the wall | reading=Wave return=9 width=.6 throw=.1 haze=.7 attack=.2 release=.8 anchor=.5 body=.4 tilt=-.1 splash=.4 volume=0.5 blur=0.8 leak=.15 | bottle | response | A blown hollow note with most of its tone lost in the air | wind
Wings overhead | Wind in the wall | return=1.5 width=.3 throw=.5 haze=.5 attack=.3 release=2 anchor=.3 body=.5 tilt=-.3 clock=Shared volume=2 place=0.38 second=0.3 gap=0.05 | airsplit | opened | Beats of soft air, every key on one beat | wind
Gale in the belfry | Wind in the wall | walls=Ring return=3 width=.2 throw=.8 haze=.7 attack=.5 release=4 anchor=.05 body=.6 tilt=.1 second=.6 gap=.8 ears=1 volume=0 place=0.25 blur=0.0 start=.8 leak=.1 | gusts | tides | Gusts on a ring that howl through one overtone after another | wind
Hush after the hymn | Going out | leak=.2 haze=.65 splash=.3 return=12 attack=.6 release=8 tilt=-.4 body=.25 anchor=.5 width=.4 second=.2 gap=.3 volume=-4 place=0.55 walls=Two_rooms start=.5 | faraway | suspend | Breath with a low chord fading in it, leaving slowly
Nine candles blown out | Going out | leak=.2 haze=1 splash=.5 return=4 attack=.04 release=3 tilt=-.2 body=.6 anchor=.35 width=.2 volume=-6.5 place=0.75 blur=0.15 | chapel | peal | A long puff on every key and a small sinking tone behind it
Veil lifted once | Going out | walls=Ring leak=0 haze=.6 splash=.1 return=10 attack=1.4 release=6 tilt=.1 body=.7 anchor=.6 width=.15 throw=.3 volume=6 blur=0.45 second=0.45 gap=0.7 | glow | built | Airy voices on a ring, an octave and a twelfth showing through in turn
Prayer wheel voices | High keys first | reading=Density second=.8 gap=.1 haze=.4 return=12 width=.4 attack=.2 release=3 tilt=-.1 body=.5 anchor=.5 splash=.1 volume=-1.5 place=0.02 | round | opened | Voices that swell one at a time, the high ones soonest
Antiphon, left and right | High keys first | haze=.5 second=.5 gap=.5 return=20 width=.3 attack=.3 release=2.5 tilt=.1 body=.65 ears=1 anchor=.45 splash=.2 volume=5.5 blur=0.95 start=.5 | pendulum | quartal | Airy voices that answer again as each wave comes round, weaker every time
Humming in ground fog | Octave asleep | freeze=0 start=.1 return=10 haze=.5 attack=.8 release=4 tilt=-.5 body=.15 anchor=.5 width=.5 second=.6 gap=.15 volume=0.5 clock=Shared | fog | fifth | A low hummed haze that swells every five seconds on one clock
Angel over the stable | Octave asleep | walls=Ring freeze=.85 start=.5 return=4 haze=.35 attack=.7 release=5 tilt=-.1 body=.8 anchor=.6 width=.25 ears=.9 volume=5 | choirhall | chorale | Light octave voices swaying a little over a soft ground
Third row of the choir | Glass keys | leak=.03 attack=.4 release=3 return=14 width=.25 throw=.2 haze=.3 tilt=-.1 body=.65 anchor=.7 splash=.1 second=.6 gap=.1 ears=.9 volume=1 start=.45 | ensemble | suspend | Round glassy voices, two on a ring and very close
Nine monks and a fan | Shared shimmer | walls=Two_rooms clock=Own return=3 haze=.3 attack=.3 release=1 width=.3 tilt=-.1 body=.25 anchor=.45 ears=.5 volume=1 second=0.6 gap=0.55 start=.5 freeze=.45 | throb | steps | Low droned voices that trade octaves behind a slow fan
Sirens at slack water | Thrown from afar | haze=.3 return=14 width=.5 throw=.3 attack=.8 release=4 tilt=.1 body=.6 second=.7 gap=.35 anchor=.5 clock=By_pitch | descent | opened | Two wide waves grained like a far choir, each voice in its own time
Market women far off | Thrown from afar | haze=.5 return=3 width=.2 throw=.5 attack=.15 release=1 tilt=0 body=.7 second=.9 gap=.9 anchor=.35 volume=5 | nextdoor | hocket | Striped bright voices in quick chatter
Humming round a table | Thrown from afar | walls=Ring haze=.2 return=15 width=.4 throw=.2 attack=.5 release=2 tilt=-.2 body=.35 second=.6 gap=.2 anchor=.85 volume=1 start=.4 freeze=.8 | chorushall | chorale | Warm hummed voices on a ring, firm on their own pitch
Choir with its coats on | Thrown from afar | reading=Wave haze=.25 return=8 width=.35 throw=.2 attack=.3 release=1 tilt=0 body=.5 second=.8 gap=.15 anchor=.5 ears=.5 start=.75 leak=.15 | darkroom | chorale | Hollow muffled voices, two waves rolling together
Echo of a vowel | Thrown from afar | haze=.35 return=6 width=.75 throw=.1 attack=.25 release=.8 tilt=-.2 body=.45 second=1 gap=.3 anchor=.5 splash=.2 volume=1 start=.15 leak=.2 | repeats | chant | A short round vowel of two waves, rolling slowly
Voices in the round | Breathing organ | haze=.5 return=12 attack=.7 release=3 tilt=-.1 body=.5 width=.3 anchor=.55 second=.8 gap=.2 volume=0.5 blur=0.6 start=.17 leak=.1 | vowels | built | Soft voices in a bowl, full and thin by turns every four seconds
Under one breath | Breathing organ | haze=.7 return=24 attack=.5 release=4 tilt=-.4 body=.3 width=.5 anchor=.5 splash=.3 second=.3 ears=.4 volume=2 leak=.1 | breathing | long | A single low breath of a voice that swells and sinks very slowly
Refrain on a frozen lake | Frozen twelfth | reading=Wave freeze=.88 start=.5 return=2 width=.2 attack=.5 release=3 haze=.4 tilt=.05 body=.7 anchor=.6 volume=6 blur=0.4 | winter | lines | Hollow high voices that tremble between two colours
Asking and answering | Twin throw choir | walls=Two_rooms return=6 haze=.35 attack=.25 release=1.5 width=.25 throw=.3 gap=.5 tilt=0 body=.55 anchor=.4 volume=2 blur=0.4 start=.4 | heads | response | Two waves through a wall, the voice dropping an octave and coming back
Last voice in the hall | Twin throw choir | walls=Fading_well return=8 haze=.3 attack=.3 release=6 width=.2 gap=.25 tilt=-.1 body=.6 anchor=.55 second=.7 volume=5.5 start=.3 leak=.15 | stretched | chant | Voices that sink into a well, one slow trace left standing
`,
    },
    {
      id: 'minute-drones',
      name: 'Minute drones',
      category: 'drone',
      rows: `
Below the footings | Minute drone | width=.5 throw=.1 return=90 start=.02 tilt=-.1 body=.1 anchor=.8 haze=.1 ears=.5 attack=1.5 blur=.2 place=0.33 | bare | steps | A plain dark ground in two rooms that is a minute and a half in coming back
Pass under the mountain | Minute drone | width=.15 return=35 start=.2 tilt=.2 body=.3 anchor=.5 haze=.2 attack=2 second=.6 gap=.6 blur=.3 | tunnel | ground | Two rooms with a striped bright edge, the low octave slow behind it
House at rest | Minute drone | width=.4 throw=.6 return=20 start=.4 tilt=0 body=.15 anchor=.4 haze=.5 attack=1 release=6 ears=1 volume=0.5 | wood | steps | Begins nearly through the wall, the lower octave leading under a breath
Moonless reservoir | Minute drone | width=.9 throw=.2 return=45 start=.3 tilt=-.85 body=.2 haze=.2 attack=3.5 release=12 anchor=.5 blur=.9 volume=3.5 place=0.03 second=0.2 gap=0.75 leak=.1 | deepwater | long | Almost black water, a wide wave smeared to a slow swell
Goods train on the flat | Minute drone | width=.1 throw=.5 return=8 start=.5 tilt=.1 body=.1 anchor=.35 haze=.3 attack=.8 ears=.7 blur=.6 second=.4 gap=.2 | reel | fifth | A rolling low fifth whose under octave comes round every eight seconds
Dawn on a slow shutter | Dissolving pad | return=40 width=.2 throw=.2 place=.3 tilt=.1 body=.4 attack=3 release=10 haze=.3 splash=0 anchor=.4 ears=.9 blur=0.7 second=0.35 gap=0.6 | space | opened | Takes three seconds to appear and forty to come back, opening all the way
Solder and flux | Dissolving pad | return=25 width=.03 throw=.6 place=.6 tilt=.1 body=.6 attack=.5 release=5 haze=.1 splash=0 anchor=.6 blur=.05 second=.5 gap=.7 start=.7 | iron | fifth | A hot narrow line of harmonics that keeps changing its grain
Wool over a speaker | Dissolving pad | return=60 width=.9 throw=.3 tilt=-.8 body=.25 attack=1.2 release=8 haze=.4 splash=0 anchor=.7 blur=.7 start=.1 volume=-1 second=0.1 gap=0.1 leak=.12 freeze=.8 | cloth | opened | A dull dark haze that hardly seems to move
Standing in the field | Octave asleep | freeze=0 start=.3 return=80 width=.3 throw=.2 place=.5 tilt=.2 body=.8 attack=1 release=6 haze=.2 anchor=.5 ears=.6 blur=.3 | open | lamps | Set out near the twelfth and eighty seconds round, each key in its own place
Breath of an old pump | Dissolving pad | return=10 width=.3 throw=.5 tilt=-.2 body=.05 attack=2 release=4 haze=.6 splash=0 anchor=.5 second=.8 gap=.3 volume=6 place=0.45 start=.35 leak=.1 | breathing | ground | A low airy ground under two beating waves
Fence wire overtones | Frozen twelfth | freeze=0 start=.15 return=30 width=.05 throw=.3 tilt=.1 body=.3 attack=.6 release=6 haze=.1 anchor=.8 volume=4 blur=0.35 | glacial | fifth | A ring over a firm ground, its overtones standing out by turns for half a minute
Planet through a lens | Frozen twelfth | freeze=0 start=.2 return=60 width=.3 throw=.1 tilt=-.1 body=.6 attack=2.5 release=9 haze=.3 anchor=.6 ears=1 volume=6 | glimhall | long | A slow ring setting out from its fifth harmonic, the double octave next
Singing pylon | Ring bells | leak=0 return=45 width=.1 throw=.4 second=.6 gap=.4 tilt=0 body=.5 attack=1.5 release=7 anchor=.8 haze=.2 splash=0 volume=2 blur=0.5 start=.7 | harmonic | ground | Two waves on a slow ring, humming against each other over a steady pitch
Round the crater | Frozen twelfth | freeze=.75 start=.4 return=12 width=.5 throw=.5 tilt=-.4 body=.1 attack=1.8 release=8 haze=.5 anchor=.75 ears=.7 volume=5.5 blur=0.65 | cavern | ground | A dark ring, half breath, coming up on its octave and easing back
Wheel of small lamps | Ring bells | leak=0 return=12 width=.02 throw=.5 second=.3 gap=.7 tilt=.1 body=.8 attack=.9 release=5 anchor=.7 haze=0 volume=6 clock=By_pitch | stars | lamps | Ringing overtones that swell key by key, the high ones soonest
Tide in slow motion | Breathing organ | return=60 width=.4 throw=.2 tilt=-.4 body=.05 attack=1.4 release=8 haze=.3 anchor=.6 second=.4 gap=.2 ears=.9 blur=0.3 start=.25 | undertow | ground | A bowl that needs twenty seconds for a swing, full, then long and thin
Bees under the roof | Breathing organ | return=30 width=.05 throw=.6 tilt=.2 body=.5 attack=.7 release=3 haze=.1 anchor=.4 second=.7 gap=.5 start=.2 | valve | fifth | A close reedy hum of two waves that swells and narrows every ten seconds
Bullfrog pond | Breathing organ | return=4 width=.25 throw=.5 tilt=.1 body=.15 attack=.5 release=2 haze=.2 anchor=.5 second=0 volume=-2 blur=0.03 start=.15 | ripples | ground | Low reedy swells, three in every four seconds
Holding the long breath | Breathing organ | return=90 width=.3 throw=.1 tilt=.1 body=.35 attack=4 release=10 haze=.5 anchor=.4 ears=1 place=.5 volume=5 blur=0.8 | chorushall | long | One enormous slow swing that thins as you listen
Drone for two goats | Breathing organ | reading=Wave return=15 width=.15 throw=.4 tilt=.3 body=.4 attack=.3 release=1.5 haze=.15 anchor=.5 splash=.1 volume=-2 place=0.2 start=.2 | bridge | fifth | A nasal hollow drone, opening on five second swings
Shaft of an old mine | Shared shimmer | clock=Own return=30 width=.2 throw=.6 tilt=.15 body=0 haze=.1 attack=1.5 release=9 anchor=.6 ears=.8 volume=6 place=0.3 blur=0.45 start=.2 leak=.12 | shaft | ground | A ground that sinks for half a minute under a nearly motionless top
Ink in a glass of water | Going out | leak=.15 return=20 haze=.6 splash=0 tilt=-.2 body=.35 attack=2 release=10 anchor=.5 width=.3 second=.6 gap=.4 volume=6 place=0.65 | vapour | long | A breathy tone that spreads and goes down, thinning on the way
Snow burying a road | Going out | leak=.12 return=60 haze=.8 splash=0 tilt=-.5 body=.6 attack=3.8 release=12 anchor=.4 width=.5 ears=1 volume=-3 place=0.08 blur=0.95 | dissolve | opened | Soft air settling over a chord, very slowly lower
Riding light in a calm | Shared shimmer | clock=Own return=6 width=.1 throw=.2 tilt=.1 body=.4 haze=.1 attack=.8 release=4 anchor=.8 ears=.4 volume=6 place=0.38 blur=0.1 second=0.5 gap=0.85 start=.3 | darktrail | ground | A steady pitch with a light on it that sinks and comes back over twelve seconds
Under the crater rim | Shared shimmer | clock=Own walls=Fading_well reading=Wave return=15 width=.2 throw=.6 tilt=.2 body=0 haze=.1 attack=1.2 release=7 anchor=.7 volume=4.5 place=0.25 start=.3 leak=.1 | blanketw | ground | Hollow low crests that hurry at the bottom and stand at the top
Strings of the low house | Hollow pipes | return=30 width=.1 throw=.5 attack=.2 release=4 splash=0 tilt=.1 body=.3 haze=.05 anchor=.5 second=.6 gap=.6 ears=.7 volume=-1 blur=0.35 start=.8 | harpring | fifth | Bright hollow strings under a fifth, their edges turning slowly
Reed in the long grass | Hollow pipes | return=60 width=.4 throw=.2 attack=1 release=5 splash=0 tilt=.2 body=.5 haze=.4 anchor=.35 volume=2 start=.2 | shell | long | A hollow airy reed that takes a minute to turn round once
Hollow log before rain | Hollow pipes | walls=Two_rooms return=4 width=.2 throw=.6 attack=.4 release=1.5 splash=.2 tilt=.1 body=.2 haze=.25 anchor=.4 ears=.5 volume=6 blur=0.06 second=0.25 gap=0.2 start=.4 | wah | steps | A growling hollow low tone that opens through a wall and shuts again
Wire across a gorge | Hollow pipes | walls=Ring return=40 width=.05 throw=.4 attack=1.5 release=8 splash=0 tilt=0 body=.6 haze=.2 anchor=.7 ears=1 volume=3 blur=0.6 start=.3 | nave | ground | A ring of odd harmonics crossing very slowly over a deep pitch
Beam of oak | Hollow pipes | return=90 width=1 throw=0 attack=.6 release=3 splash=0 tilt=-.3 body=.1 haze=.1 anchor=.6 ears=0 volume=-0.5 second=0.4 gap=0.45 freeze=.98 | board | ground | A hollow dark low tone with nothing moving in it
North wall all night | Wind in the wall | return=30 width=.2 throw=.5 attack=2.5 release=8 haze=.7 anchor=.5 body=.4 tilt=-.3 ears=1 volume=-0.5 place=0.55 blur=0.4 start=.25 leak=.1 | wallwind | ground | Wind on a wall for hours, a low pitch buried in it
Aeolian attic | Wind in the wall | walls=Ring return=10 width=.1 throw=.7 attack=1 release=5 haze=.4 anchor=.5 body=.5 tilt=.1 second=.5 gap=.3 volume=6 clock=By_pitch place=0.75 | strings | lamps | Air round a ring, each key finding its overtones at its own pace
Ventilation shaft hymn | Wind in the wall | walls=Two_rooms return=15 width=.4 throw=.3 attack=1.5 release=6 haze=.5 anchor=.6 body=.3 tilt=-.1 blur=.5 volume=3.5 place=0.02 start=.5 | downhall | fifth | A smooth rush through a wall with a low fifth standing in it
Gills | Wind in the wall | walls=Bowl return=6 width=.3 throw=.5 attack=.8 release=3 haze=.6 anchor=.4 body=.55 tilt=-.2 place=0.33 blur=0.28 second=0.15 gap=0.9 start=.2 | sunk | opened | Air drawn in and out of every key, each two seconds
Loess | Wind in the wall | walls=Fading_well return=40 width=.15 throw=.6 attack=1.8 release=9 haze=1 anchor=.5 body=.35 tilt=-.6 place=0.03 leak=.15 volume=1.5 | hiss | ground | Fine dark dust of air that sinks by degrees over a soft ground
Failing lightbulb | Dissolving pad | return=1 width=.2 throw=.4 tilt=.1 body=.3 attack=.5 release=2 haze=.1 splash=0 anchor=.6 blur=.3 ears=.8 volume=0 second=0.3 gap=0.05 start=.4 | glow | fifth | A nervous drone that flickers home once a second over its own ground
Empty escalator | Minute drone | return=1.5 start=0 width=.3 throw=.3 attack=.6 release=2 haze=.2 tilt=-.2 body=.1 blur=.8 anchor=.5 ears=.7 volume=6 freeze=.3 | slowdrift | steps | Quick octave changes smeared to a steady rolling low tone
Sled dogs on pack ice | Glass keys | leak=0 return=1.3 width=.15 throw=.4 attack=.6 release=4 tilt=0 body=.6 anchor=.8 haze=.3 splash=0 blur=.3 volume=0 start=.3 | thinair | opened | Overtones wheeling fast round a ring above an unmoving pitch
Slow beacon | Minute drone | clock=Shared return=6 start=0 width=.2 throw=.4 attack=.3 release=3 haze=.2 tilt=0 body=.4 blur=.2 anchor=.5 | latehall | steps | A low drone lifted every three seconds on one clock for all keys
Mill with three stones | High keys first | return=8 reading=Density width=.4 throw=.3 attack=.5 release=4 tilt=-.3 body=.15 splash=0 anchor=.5 haze=.2 walls=Two_rooms volume=6 place=0.45 second=0.45 gap=0.7 start=.3 | round | steps | Low keys that swell one by one as each wave comes by, slowest at the bottom
Grain of the plank | Thrown from afar | return=40 width=.3 throw=.2 attack=.8 release=5 tilt=0 body=.2 haze=.05 anchor=.6 second=.8 gap=.9 freeze=.85 | board | ground | Fine stripes in a warm low tone, still for a long while
Two engines on calm sea | Thrown from afar | return=8 width=.5 throw=.5 attack=1.2 release=6 tilt=-.3 body=.05 haze=.1 anchor=.5 second=1 gap=.1 volume=3.5 clock=Shared | pendulum | long | Two waves so close that they throb, all lifted every four seconds
Layers in a cliff | Thrown from afar | walls=Two_rooms return=60 width=.2 throw=.5 attack=2 release=10 tilt=-.2 body=.1 haze=.3 anchor=.5 second=.6 gap=.5 volume=1 start=.5 | lowcath | long | A rough low layer over a slower one an octave down
Pine resin | Twin throw choir | return=30 width=.15 haze=.15 attack=1 release=6 tilt=.1 body=.4 gap=.6 second=.5 anchor=.6 blur=0.7 start=.75 leak=.15 volume=-1.5 | melt | fifth | A sticky close tone of two waves, sagging a little as it goes
Herd at the horizon | Twin throw choir | walls=Bowl return=24 width=.5 haze=.5 attack=2.2 release=8 tilt=-.4 body=.2 gap=.4 ears=1 anchor=.5 volume=0 start=.2 | horn | opened | A broad airy hum that fills and thins every eight seconds
One lamp on watch | Frozen twelfth | freeze=.99 start=0 return=20 width=.6 throw=.2 tilt=-.5 body=0 attack=1 release=6 haze=.2 anchor=.9 blur=0.35 | warm | ground | A ring held whole, dark and plain, with a strong ground
Foot of the wall | Minute drone | freeze=.98 start=0 return=30 width=.6 throw=.1 tilt=-.6 body=0 attack=.7 release=3 haze=.05 anchor=.6 ears=.05 blur=.2 | deep | steps | A plain dark low tone held still at the foot of the wall
Frozen waterfall | Octave asleep | freeze=.9 start=.3 return=6 width=.05 throw=.5 tilt=.1 body=.7 attack=1.2 release=8 haze=.4 anchor=.5 ears=1 volume=3 | ascent | long | A tall stack of harmonics near the twelfth, trembling where it stopped
Watching the last ember | Shared shimmer | clock=Own freeze=.9 start=.2 return=10 width=.4 throw=.1 tilt=-.4 body=.25 attack=1.6 release=8 haze=.5 anchor=.7 volume=-1 blur=0.5 leak=.1 | valve | built | A low warm glow held in a well, half air
Noon on the line | Frozen twelfth | freeze=.97 start=.5 walls=Two_rooms return=12 width=.3 throw=.3 tilt=0 body=.3 attack=1.5 release=7 haze=.3 anchor=.35 ears=.6 | summer | opened | Two rooms halted at the half, the octave under each key level with it
`,
    },
    {
      id: 'lamps-and-signals',
      name: 'Lamps and signals',
      category: 'texture',
      rows: `
Harbour lamps, all on | Shared shimmer | return=8 width=.2 throw=.3 tilt=-.1 body=.4 attack=.2 release=3 haze=.2 anchor=.5 ears=.8 volume=-1.5 place=0.2 blur=0.0 start=.3 | halo | opened | All keys brighten together every four seconds, the high ones a little late
Semaphore in fog | Shared shimmer | walls=Ring reading=Wave return=3 width=.1 throw=.4 tilt=.1 body=.6 blur=0 haze=.4 attack=.05 release=1.5 anchor=.6 volume=4 place=0.3 second=0.6 gap=0.55 | fog | lamps | Hollow signals that come forward together every second and a half
Three ships signalling | Shared shimmer | walls=Two_rooms return=4 width=.3 throw=.5 tilt=.1 body=.5 haze=.1 attack=.1 release=2 anchor=.4 splash=.1 volume=0 blur=0.15 start=.5 | farstar | built | Keys lifted every two seconds on one clock, an octave swinging under them
Crossing at sundown | Shared shimmer | walls=Box return=2 width=.05 throw=.4 tilt=.2 body=.8 haze=0 attack=.03 release=.8 anchor=.5 ears=.4 blur=.1 place=0.65 second=0.2 gap=0.75 | clean | opened | A bright blink every second, all keys on one clock
Breath of the meter room | Shared shimmer | walls=Bowl return=12 reading=Flow width=.3 throw=.5 tilt=-.2 body=.3 haze=.6 attack=.6 release=4 anchor=.4 volume=0 place=0.08 start=.25 | nextdoor | opened | Moving air lifted every six seconds for every key at once
Morse on a kettle | Shared shimmer | walls=Ring reading=Wave return=2 width=.02 throw=.6 blur=0 tilt=.2 body=.9 haze=0 attack=.02 release=.4 anchor=.5 leak=.1 splash=.3 volume=2 second=0.35 gap=0.6 | tin | hocket | Hollow clicks and blinks, one a second on one clock
Buoy and buoy | Shared shimmer | walls=Box reading=Wave return=6 width=.4 throw=.3 tilt=-.2 body=.35 blur=.1 haze=.2 attack=.15 release=3 anchor=.6 splash=.4 volume=-3 start=.4 | thinecho | response | Dark hollow tones that nod together every three seconds
Runway at three | Shared shimmer | walls=Ring return=5 width=.15 throw=.5 tilt=.1 body=.7 haze=.1 attack=.1 release=2 anchor=.8 second=.5 gap=.6 volume=2 blur=0.4 | prism | lamps | A ring of lamps lit in order, each flash two or three seconds from the last
Telegraph over tundra | Shared shimmer | walls=Two_rooms reading=Wave return=1.6 width=.2 throw=.4 blur=0 tilt=.1 body=.5 haze=.1 attack=.03 release=.6 anchor=.4 volume=-2 start=.5 | tapespring | ostinato | Hollow double signals with a lower octave, rattled off fast
Turn signal, left | Shared shimmer | walls=Bowl return=3 width=.3 throw=.3 tilt=0 body=.6 haze=.05 attack=.04 release=1 anchor=.5 ears=.3 place=0.38 second=0.1 gap=0.1 | middle | quartal | A soft round blink every second and a half, the swing of a bowl inside it
Fireflies in a ditch | High keys first | return=5 width=.1 throw=.5 tilt=.2 body=.8 haze=.2 attack=.1 release=2 ears=1 splash=.1 anchor=.45 volume=0.5 place=0.25 blur=0.03 start=.67 | stars | lamps | Each key glints again in its own time, the highest fastest
Abacus in a back shop | High keys first | return=1.5 width=.2 throw=.3 tilt=.1 body=.6 haze=0 attack=.02 release=.5 ears=.5 splash=.2 anchor=.6 leak=.1 volume=-4.5 place=0.55 second=0.5 gap=0.85 | booth | opened | Quick beads of sound, high keys rattling past the low ones
Sprinklers at six | High keys first | walls=Bowl return=3 width=.15 throw=.5 tilt=.2 body=.7 haze=.5 attack=.06 release=1.5 splash=.5 anchor=.35 volume=-1.5 place=0.75 blur=0.1 | panned | lamps | Airy spurts from every key, fast above and lazy below
Looms across the street | High keys first | walls=Two_rooms reading=Wave return=2 width=.3 throw=.4 tilt=0 body=.4 haze=.1 attack=.05 release=1 anchor=.4 volume=0.5 blur=0.35 second=0.25 gap=0.2 start=.4 | fan | opened | Hollow shuttling tones, each key at its own rate, octaves in and out
Clocks disagree | High keys first | walls=Ring return=4 width=.05 throw=.4 tilt=.1 body=.5 haze=.05 attack=.02 release=1.5 anchor=.7 splash=.3 second=.4 gap=.5 volume=6 place=0.02 start=.25 | orbits | lamps | Ringing keys that tick over again and again, no two together
Boiling sugar | Dissolving pad | return=1 width=.05 throw=.5 tilt=.1 body=.5 blur=0 haze=.2 attack=.1 release=1 splash=.2 anchor=.45 ears=.9 second=0.4 gap=0.45 start=.5 | frozen | opened | A wave that comes home every second, seething with harmonics between
Sequins | Dissolving pad | return=1.6 width=.15 throw=.4 place=.5 tilt=.3 body=1 blur=.05 haze=.1 attack=.2 release=2.5 splash=0 anchor=.4 ears=1 volume=-4 start=.85 | glints | quartal | High harmonics tumbling past in a small clear body
Static after closedown | Dissolving pad | return=1.2 width=.4 throw=.5 second=.8 gap=.6 tilt=-.1 body=.4 blur=0 haze=.7 attack=.3 release=1.5 splash=.3 anchor=.05 volume=-1 start=.75 leak=.15 freeze=.5 | cassette | tides | Breath and stripes shaken together, quick and grey
Tadpoles | Dissolving pad | return=2 width=.3 throw=.3 place=.8 tilt=-.2 body=.2 blur=.1 haze=.15 attack=.1 release=2 splash=.2 anchor=.5 ears=.7 start=.5 | sunk | quartal | Dark small wriggles of octave and twelfth, round again every two seconds
Neon on the second floor | Dissolving pad | return=1 width=.25 throw=.6 tilt=.1 body=.6 blur=.5 haze=.05 attack=.4 release=3 splash=0 anchor=.4 second=.5 gap=.3 volume=-1 place=0.33 freeze=.4 | twins | suspend | Fast flicker smeared by the ear to a nervous steady glow
Moth at the lampshade | Frozen twelfth | freeze=.88 start=.25 return=1 width=.1 throw=.4 tilt=.1 body=.7 attack=.15 release=1.5 haze=.3 anchor=.6 ears=.8 blur=0.06 volume=6 | round | lamps | A fluttering ring that never gets as far as its twelfth
Beads in a doorway | Dissolving pad | freeze=.88 start=.25 return=1 width=.05 throw=.5 tilt=.15 body=.8 blur=.05 attack=.08 release=2 haze=.1 splash=.3 anchor=.4 volume=-1.5 second=0.15 gap=0.9 | cascade | quartal | Bright harmonics swinging quickly to and fro round the double octave
Puddle by the tram stop | Dissolving pad | freeze=.88 start=.5 return=1.2 width=.4 throw=.2 tilt=-.3 body=.3 blur=.1 attack=.3 release=3 haze=.3 splash=0 anchor=.45 volume=4.5 leak=.12 | deepsea | tides | A dark octave that shivers as if a tram went by
Heat off the tarmac | Dissolving pad | freeze=.8 start=.1 return=2 width=.2 throw=.5 tilt=.2 body=.6 blur=.2 attack=.6 release=4 haze=.6 splash=0 anchor=.05 ears=1 place=0.03 second=0.3 gap=0.05 volume=2 leak=.15 | vapour | opened | Hot thin air wavering round each key
Compass in a storm | Shared shimmer | walls=Ring clock=Shared freeze=.4 return=1.5 width=.1 throw=.5 tilt=.1 body=.5 haze=.15 attack=.1 release=2 anchor=.7 volume=4 place=0.45 | pendulum | opened | All keys on one clock that runs on a little and turns back
Hover at the feeder | Breathing organ | return=1 width=.1 throw=.5 tilt=.4 body=.9 attack=.1 release=1 haze=.2 splash=.2 anchor=.4 ears=1 volume=-0.5 blur=0.28 start=.17 | glimmer | lamps | A bright trembling of three beats to the second
Rotor over the bay | Breathing organ | return=1.5 width=.4 throw=.4 tilt=-.4 body=.1 attack=.4 release=3 haze=.4 anchor=.4 blur=.1 volume=-1.5 start=.15 | faraway | tides | A dark airy beating, two pulses to the second
Wasp in the jam jar | Breathing organ | return=1.2 width=.02 throw=.7 tilt=.2 body=.6 attack=.1 release=.6 haze=.05 anchor=.3 second=.8 gap=.7 ears=.6 volume=-0.5 blur=0.0 | tube | suspend | A fine angry buzz, pulsed and grained
Windmill short of a vane | Breathing organ | reading=Flow return=3 width=.3 throw=.5 attack=.3 release=2 haze=.5 anchor=.5 body=.5 tilt=0 ears=.9 volume=-4 blur=0.15 start=.2 | weave | opened | Air pushed round once a second, a low pitch behind it
Applause through a wall | Breathing organ | return=1 width=.2 throw=.4 place=.6 tilt=.1 body=.6 attack=.2 release=2 haze=.9 anchor=0 splash=.4 volume=3 leak=.15 | nextdoor 1.distance=0.8 | opened | A crowd of small airy beats with hardly any pitch left
Sand down a window | Wind in the wall | return=1.5 width=.05 throw=.6 attack=.3 release=2 haze=.6 anchor=.06 body=.8 tilt=.1 blur=0 place=0.2 volume=3 start=.7 leak=.2 | octrain | lamps | Dry air that flickers upward every second or two
Grass on an overpass | Wind in the wall | walls=Two_rooms return=1.2 width=.2 throw=.5 attack=.2 release=1.5 haze=.4 anchor=.5 body=.4 tilt=0 blur=.1 splash=.3 volume=2 second=0.45 gap=0.7 start=.5 | downhall | quartal | Gusts passing through a wall more than once in two seconds, a low octave in them
Pages turned by wind | Wind in the wall | clock=By_pitch return=6 width=.3 throw=.4 attack=.05 release=1.5 haze=.5 anchor=.45 body=.6 tilt=.1 splash=.5 place=0.3 blur=0.4 | mirror | lamps | Air lifted from each key in its own time, light above and slow beneath
Leaves in a stairwell | Wind in the wall | walls=Ring clock=By_pitch return=5 width=.15 throw=.6 attack=.1 release=3 haze=.3 anchor=.55 body=.5 tilt=0 second=.4 gap=.6 place=0.65 blur=0.03 volume=-3 | cloud | opened | Ringing air, stirred at a different pace on every key
Surf two streets away | Wind in the wall | clock=Shared return=10 width=.4 throw=.5 attack=.8 release=5 haze=.9 anchor=.25 body=.1 tilt=-.4 ears=1 place=0.08 start=.25 leak=.1 | reversed | opened | Dark air that swells for all keys every five seconds, as surf does
Shuffle of cards | Tunnel bass | return=1.3 leak=.05 width=.1 throw=.5 tilt=.2 body=.7 release=1 ears=1 anchor=.35 splash=.4 haze=.1 volume=-2 blur=0.1 start=.5 | dotted | hocket | Quick octave flaps, each with a brush of air in front
Awning in the rain | Minute drone | start=.4 return=1.5 width=.3 throw=.5 attack=.1 release=2 tilt=-.2 body=.3 haze=.4 blur=.05 anchor=.4 splash=.5 leak=.15 | rain | quartal | A wet low flapping between two rooms, with spray on every stroke
Tarpaulin corner adrift | Minute drone | start=.2 return=2.5 width=.5 throw=.3 attack=.3 release=3 tilt=-.4 body=.05 haze=.3 blur=.1 anchor=.35 ears=.8 second=.7 gap=.2 leak=.1 | seasick | tides | A heavy dark flap of octaves and its murmur
Candle in a slotted drum | Tunnel bass | clock=Shared return=2 leak=0 width=.15 throw=.4 tilt=.2 body=.55 release=1.5 ears=.7 anchor=.45 attack=.05 volume=0.5 blur=0.35 start=.5 | octhop | lamps | Lit once a second on one clock, an octave swinging in each flash
Hanging files | Minute drone | reading=Wave start=.5 return=1.2 width=.2 throw=.4 attack=.05 release=1 tilt=.1 body=.6 haze=.05 blur=0 anchor=.4 ears=.9 volume=1 second=0.6 gap=0.55 | stone | ostinato | Hollow tones that clap between octaves about once a second
Gravel thrown at glass | Glass keys | splash=.6 leak=.3 return=2 width=.1 throw=.6 tilt=-.2 body=.75 anchor=.7 release=1 haze=.3 volume=-5.5 | crystals | rain | A full burst of air at every key with a small ringing note in it
Tiny surf on shingle | Going out | walls=Box leak=.1 splash=.6 return=6 width=.3 throw=.4 haze=.7 tilt=-.3 body=.4 release=2.5 attack=.1 anchor=.5 volume=-3 place=0.38 second=0.2 gap=0.75 start=.5 | gated | rain | Long splashes with a tone that dissolves under each
Snare of frost | Plucked flicker | splash=.9 leak=.8 return=1 width=.1 throw=.7 tilt=.1 body=.9 release=.3 anchor=.45 haze=.4 volume=-5.5 place=0.25 start=.3 | lightroom | hocket | Hard bursts of cold air and a hollow flicker behind them | drum
Drawer of cutlery | Ring bells | splash=.5 leak=.35 return=1.2 release=1 throw=.7 width=0 tilt=.1 body=.75 anchor=.5 second=.8 gap=.9 ears=.9 volume=-3.5 blur=0.06 | farecho | hocket | A clash of fine ringing stripes that wheels round quickly
Wet rope in a pulley | Hollow pipes | splash=.6 leak=.2 return=1.5 width=.4 throw=.5 attack=.02 release=1.5 tilt=-.1 body=.4 haze=.5 anchor=.45 volume=-2 | memory | rain | Splashing hollow notes that creak through their overtones
Pollen over the pond | Octave asleep | start=.1 freeze=.2 return=10 width=.1 throw=.4 tilt=.1 body=.8 attack=1 release=6 haze=.8 anchor=.05 ears=1 blur=.1 volume=2 | smear | lamps | Bright dust hanging in the air, the pitch faint inside it
Negative of a forest | Octave asleep | reading=Wave start=.4 freeze=0 return=25 width=.15 throw=.5 tilt=-.1 body=.5 attack=1.2 release=7 haze=.4 anchor=.3 second=.8 gap=.5 blur=.2 volume=2 leak=.1 | negative | opened | Hollow stripes before their octave, turning to breath and back
Coral in half light | Dissolving pad | walls=Ring start=.3 return=5 width=.25 throw=.5 tilt=.1 body=.3 attack=.7 release=5 haze=.25 splash=0 anchor=.5 second=.7 gap=.4 volume=6 clock=By_pitch blur=0.28 ears=.7 | lightroom | opened | Overtones lit and dimmed at another pace on every key
Rust in the gutter | Shared shimmer | clock=Shared start=.3 return=5 width=.05 throw=.5 tilt=.1 body=.5 haze=.4 attack=.3 release=4 anchor=.4 second=1 gap=.8 volume=3 blur=0.0 | folded | tides | A rough striped shimmer that falls away and is lifted on one clock
Thaw on the north side | Frozen twelfth | walls=Bowl freeze=.75 start=.1 return=3 width=.2 throw=.5 tilt=.1 body=.65 attack=.4 release=3 haze=.5 anchor=.5 splash=.2 volume=-4.5 | drip | lamps | Breath and drops, a bowl swinging a short way out and back
`,
    },
  ],
}
