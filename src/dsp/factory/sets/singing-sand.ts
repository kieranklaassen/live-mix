import { type InstrumentSet } from './set'

// Laid out along the way of the sand, from a slope that sings one note to
// loose grains that only patter, with the keys, bells, basses and organs that
// can be had on the way. Each direction is ten corners of five presets.

export const SET: InstrumentSet = {
  device: 'singing-sand',
  names: {
    pulse: ['Round', 'Flint', 'Squeak', 'Wet', 'Glassy'],
    surge: ['Waves', 'Slips', 'Aftershocks'],
  },
  chains: {
    bare: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Open', params: { clear: 0.2 } }],
      words: ', close and dry',
    },
    shade: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Shaded' }],
      words: ', dry, with its top in shade',
    },
    warmth: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Warm' },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: ', dry and warm',
    },
    thinned: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Thin' },
        { deviceId: 'stereo-widener', preset: 'Normal' },
      ],
      words: ', dry and thinned out',
    },
    hollowed: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Hollow' },
        { deviceId: 'stereo-detune', preset: 'Faint width' },
      ],
      words: ', hollowed out and close',
    },
    narrow: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Narrow' },
        { deviceId: 'tamer', preset: 'Gentle' },
      ],
      words: ', dry and narrow',
    },
    wide: {
      effects: [
        { deviceId: 'spread', preset: 'Wide pad' },
        { deviceId: 'tamer', preset: 'Gentle' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: ', dry and wide',
    },
    airy: {
      effects: [
        { deviceId: 'spread', preset: 'Air only' },
        { deviceId: 'ambient-eq', preset: 'Bright', params: { presence: 1.5, air: 4 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: ', dry, with air at the sides',
    },
    booth: {
      effects: [
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.16 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'in a small booth',
    },
    room: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.22 } }],
      words: 'in a small room',
    },
    chamber: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } }],
      words: 'in a tight chamber',
    },
    stub: {
      effects: [
        { deviceId: 'plate-reverb', preset: 'Tight room' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'with a short plate',
    },
    wall: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 8 } },
      ],
      words: ', close and held level',
    },
    cell: {
      effects: [
        { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.16 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 8 } },
      ],
      words: 'in a stone cell',
    },
    forward: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Forward', params: { presence: 2 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 8 } },
      ],
      words: ', dry and brought forward',
    },
    soft: {
      effects: [
        { deviceId: 'saturator', preset: 'Soft tape warmth' },
        { deviceId: 'ambient-eq', preset: 'Shaded' },
      ],
      words: ', dry and softly driven',
    },
    iron: {
      effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }],
      words: 'through an iron transformer',
    },
    weight: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Tape weight' },
        { deviceId: 'ambient-eq', preset: 'Open' },
      ],
      words: 'with the weight of tape',
    },
    valve: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Triode glow' },
        { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.12 } },
      ],
      words: 'through a warm valve',
    },
    grit: {
      effects: [
        { deviceId: 'saturator', preset: 'Bass grit', params: { mix: 0.5 } },
        { deviceId: 'ambient-eq', preset: 'Shaded' },
      ],
      words: 'with a little grit',
    },
    depth: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Console' },
        { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 4 } },
      ],
      words: 'with its lows deepened',
    },
    reel: {
      effects: [{ deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1 } }],
      words: 'on quarter inch tape',
    },
    cassette: {
      effects: [
        { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.15 } },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'on a cassette',
    },
    blanket: {
      effects: [
        { deviceId: 'tape', preset: 'Under a blanket' },
        { deviceId: 'stereo-detune', preset: 'Soft halo' },
      ],
      words: 'under a blanket of tape',
    },
    combo: {
      effects: [{ deviceId: 're-amp', preset: 'Combo in a room' }],
      words: 'from a small amplifier',
    },
    pillow: {
      effects: [{ deviceId: 're-amp', preset: 'Pillow speaker', params: { output: 2 } }],
      words: 'from under a pillow',
    },
    cupboard: {
      effects: [{ deviceId: 're-amp', preset: 'In the cupboard', params: { room: 0.15 } }],
      words: 'from inside a cupboard',
    },
    downhall: {
      effects: [{ deviceId: 're-amp', preset: 'Down the hall' }],
      words: 'from a speaker down the hall',
    },
    board: {
      effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.4 } }],
      words: 'on a wooden board',
    },
    pot: {
      effects: [
        { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.5 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'inside a clay pot',
    },
    bottle: {
      effects: [
        { deviceId: 'vessel', preset: 'Blown bottle', params: { mix: 0.4 } },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.12 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'inside a bottle',
    },
    skin: {
      effects: [
        { deviceId: 'vessel', preset: 'Drum head', params: { mix: 0.4 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 5 } },
      ],
      words: 'on a drum skin',
    },
    shell: {
      effects: [
        { deviceId: 'vessel', preset: 'Shell to the ear', params: { mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'inside a shell',
    },
    pipe: {
      effects: [
        { deviceId: 'vessel', preset: 'Inside a pipe', params: { mix: 0.4 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: 'inside a pipe',
    },
    early: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Sampler' },
        { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.14 } },
      ],
      words: 'in an early sampler',
    },
    glaze: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Glaze' },
        { deviceId: 'chorus', preset: 'Faint air', params: { mix: 0.3 } },
      ],
      words: 'under a digital glaze',
    },
    slap: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.28 } },
        { deviceId: 'ambient-eq', preset: 'Open' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'with one slap of tape',
    },
    doubled: {
      effects: [
        { deviceId: 'stereo-detune', preset: 'Doubled' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', doubled at either side',
    },
    felt: {
      effects: [
        { deviceId: 'sift', preset: 'Felt and air' },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.12 } },
      ],
      words: ', wrapped in felt',
    },
    strikes: {
      effects: [
        { deviceId: 'sift', preset: 'Strikes forward' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 6 } },
      ],
      words: 'with the strikes forward',
    },
    tones: {
      effects: [
        { deviceId: 'sift', preset: 'Tones only' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'with only its tones let by',
    },
    pane: {
      effects: [
        { deviceId: 'fog', preset: 'Behind glass', params: { mix: 0.75 } },
        { deviceId: 'stereo-widener', preset: 'Wide' },
      ],
      words: 'behind a pane',
    },
    blunt: {
      effects: [
        { deviceId: 'fog', preset: 'Short blur', params: { size: 45 } },
        { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.12 } },
      ],
      words: 'with every edge blunted',
    },
    harmonic: {
      effects: [
        { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 4.2 } },
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.18 } },
      ],
      words: 'with a harmonic tremolo',
    },
    throb: {
      effects: [
        { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 3.1, depth: 0.7 } },
        { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.15 } },
      ],
      words: 'in a throbbing amplifier',
    },
    panned: {
      effects: [
        { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.35 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'going from side to side',
    },
    chorale: {
      effects: [
        { deviceId: 'rotary', preset: 'Chorale' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: 'through a slow horn',
    },
    whirl: {
      effects: [
        { deviceId: 'rotary', preset: 'Tremolo', params: { drive: 0.15 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'through a fast horn',
    },
    farhorn: {
      effects: [
        { deviceId: 'rotary', preset: 'Far shimmer' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'from a horn across the hall',
    },
    ensemble: {
      effects: [
        { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: 'in a slow ensemble',
    },
    deepsea: {
      effects: [
        { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.5 } },
        { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.22 } },
      ],
      words: ', swaying in a dark room',
    },
    swirl: {
      effects: [
        { deviceId: 'phaser', preset: 'Slow swirl' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'with a slow swirl',
    },
    endlessfall: {
      effects: [
        { deviceId: 'phaser', preset: 'Endless fall', params: { mix: 0.45 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
      ],
      words: ', sinking without end',
    },
    comb: {
      effects: [
        { deviceId: 'flanger', preset: 'Glacial drift', params: { mix: 0.45 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'with a comb sliding through',
    },
    notch: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Slow notch', params: { lfoRateHz: 0.3 } },
        { deviceId: 'stereo-widener', preset: 'Wide' },
      ],
      words: 'with a notch walking by',
    },
    sweep: {
      effects: [
        {
          deviceId: 'auto-filter',
          preset: 'Glacial low-pass',
          params: { cutoffHz: 900, lfoRateHz: 0.14 },
        },
        { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.2 } },
      ],
      words: 'under a slow filter',
    },
    lowgate: {
      effects: [
        {
          deviceId: 'auto-filter',
          preset: 'Low-pass gate',
          params: { cutoffHz: 420, envAmount: 45, envReleaseMs: 700, resonance: 1 },
        },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.1 } },
      ],
      words: 'through a gate that shuts',
    },
    wah: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Touch wah', params: { resonance: 2.5, mix: 0.5 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 6 } },
      ],
      words: 'with a vowel at each touch',
    },
    lungs: {
      effects: [
        { deviceId: 'breath', preset: 'Calm breath' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
      ],
      words: ', breathing in a hall',
    },
    water: {
      effects: [
        { deviceId: 'currents', preset: 'Slow water' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.22 } },
      ],
      words: 'in slow currents',
    },
    light: {
      effects: [
        { deviceId: 'glimmer', preset: 'Light on water' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: ', lit like water',
    },
    circle: {
      effects: [
        { deviceId: 'around', preset: 'Slow circle' },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', circling the listener',
    },
    sung: {
      effects: [
        { deviceId: 'late-vibrato', preset: 'Singer', params: { depth: 26 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } },
      ],
      words: ', swaying late in a room',
    },
    flock: {
      effects: [
        { deviceId: 'murmuration', preset: 'Slow drift' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'as a drifting flock',
    },
    repeats: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.32 } },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: 'with warm tape echoes',
    },
    heads: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.32 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.12 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'with echoes from three heads',
    },
    longtrail: {
      effects: [{ deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.34 } }],
      words: 'with a long dark echo',
    },
    darkecho: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.32 } },
        { deviceId: 'ambient-eq', preset: 'Open' },
      ],
      words: 'with a dark echo',
    },
    hops: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Octave hop', params: { mix: 0.3 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'with echoes that hop octaves',
    },
    mirror: {
      effects: [
        { deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.4 } },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: 'with backwards swells',
    },
    faintmirror: {
      effects: [
        { deviceId: 'reverse-delay', preset: 'Rising glass', params: { mix: 0.28 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.15 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'with backwards glass',
    },
    fan: {
      effects: [
        { deviceId: 'prism', preset: 'Low to high', params: { mix: 0.35 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', fanned from low to high',
    },
    stars: {
      effects: [
        { deviceId: 'constellation', preset: 'Slowing spiral', params: { mix: 0.36 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'with scattered echoes',
    },
    stone: {
      effects: [
        { deviceId: 'skipping-stone', preset: 'Skipping stone' },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'with echoes that skip',
    },
    embers: {
      effects: [
        { deviceId: 'grain-delay', preset: 'Falling embers', params: { mix: 0.34 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'with embers falling after',
    },
    rising: {
      effects: [
        { deviceId: 'grain-delay', preset: 'Rising fifths', params: { mix: 0.28 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'with fifths rising after',
    },
    decks: {
      effects: [
        { deviceId: 'tape-loop', preset: 'Slow fade', params: { mix: 0.4 } },
        { deviceId: 'ambient-eq', preset: 'Shaded' },
      ],
      words: 'on a fading loop of tape',
    },
    moons: {
      effects: [
        { deviceId: 'orbits', preset: 'Slow phasing', params: { mix: 0.36 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.15 } },
      ],
      words: 'in slow turning loops',
    },
    memory: {
      effects: [
        { deviceId: 'echo-memory', preset: 'Recalling' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'with half heard memories',
    },
    steps: {
      effects: [
        { deviceId: 'cascade', preset: 'Slow tiles', params: { mix: 0.35 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: 'with slow tiles of itself',
    },
    bed: {
      effects: [
        { deviceId: 'micro-looper', preset: 'Soft bed', params: { mix: 0.3 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'over a soft loop of itself',
    },
    hall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.34 } }],
      words: 'in a hall',
    },
    undertow: {
      effects: [
        { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.32 } },
        { deviceId: 'ambient-eq', preset: 'Warm' },
      ],
      words: 'over a warm undertow',
    },
    nave: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.36 } }],
      words: 'in a vast nave',
    },
    darkhall: {
      effects: [
        { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.38 } },
        { deviceId: 'stereo-widener', preset: 'Wide' },
      ],
      words: 'in a dark hall',
    },
    tail: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.32 } }],
      words: 'with an airy tail',
    },
    cathedral: {
      effects: [
        { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.36 } },
        { deviceId: 'chorus', preset: 'Subtle widener', params: { mix: 0.25 } },
      ],
      words: 'in a cathedral',
    },
    longplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.36 } }],
      words: 'on a long plate',
    },
    brightplate: {
      effects: [
        { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.3 } },
        { deviceId: 'ambient-eq', preset: 'Open' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'on a bright plate',
    },
    haze: {
      effects: [
        { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.6 } },
        { deviceId: 'ambient-eq', preset: 'Distant' },
      ],
      words: 'in a distant haze',
    },
    spring: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.3 } }],
      words: 'in a spring tank',
    },
    drip: {
      effects: [
        { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.35 } },
        { deviceId: 'tremolo', preset: 'Gentle breath' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'in a dripping spring',
    },
    cave: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.38 } }],
      words: 'in a dark cave',
    },
    valley: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.36 } }],
      words: 'over an open valley',
    },
    slowswell: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Slow swell', params: { mix: 0.45 } }],
      words: 'in a space that swells',
    },
    open: {
      effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } }],
      words: 'in open space',
    },
    horizon: {
      effects: [
        { deviceId: 'expanse', preset: 'Event horizon', params: { mix: 0.36 } },
        { deviceId: 'ambient-eq', preset: 'Shaded' },
      ],
      words: 'at the edge of hearing',
    },
    crypt: {
      effects: [
        { deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.4 } },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: 'in a low crypt',
    },
    tunnel: {
      effects: [{ deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.36 } }],
      words: 'in a narrow tunnel',
    },
    thinair: {
      effects: [{ deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.35 } }],
      words: 'in thin air',
    },
    farechoes: {
      effects: [
        { deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.36 } },
        { deviceId: 'stereo-detune', preset: 'Soft halo' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'with far off echoes',
    },
    latehall: {
      effects: [
        { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.3 } },
        { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.05 } },
      ],
      words: 'in a late hall',
    },
    infinite: {
      effects: [
        { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { mix: 0.28 } },
        { deviceId: 'analog-drive', preset: 'Warm glue' },
      ],
      words: 'before an endless dark',
    },
    backwards: {
      effects: [
        { deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.4 } },
        { deviceId: 'ambient-eq', preset: 'Open' },
      ],
      words: 'with reverb backwards',
    },
    opening: {
      effects: [
        { deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.45 } },
        { deviceId: 'stereo-widener', preset: 'Wide' },
      ],
      words: 'in a hall that opens',
    },
    gated: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.36 } }],
      words: 'in a hall cut short',
    },
    choir: {
      effects: [
        { deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.3 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'under a rising choir',
    },
    fifths: {
      effects: [
        { deviceId: 'shimmer', preset: 'Fifths', params: { mix: 0.3 } },
        { deviceId: 'ambient-eq', preset: 'Shaded' },
      ],
      words: 'with fifths in the tail',
    },
    glasstail: {
      effects: [
        { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.28 } },
        { deviceId: 'stereo-detune', preset: 'Faint width' },
      ],
      words: 'with a glassy tail',
    },
    under: {
      effects: [{ deviceId: 'shimmer', preset: 'Undertow', params: { mix: 0.32 } }],
      words: 'with octaves sinking below',
    },
    ah: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.34 } }],
      words: 'in a hall that sings ah',
    },
    monks: {
      effects: [
        { deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.36 } },
        { deviceId: 'ambient-eq', preset: 'Warm' },
      ],
      words: 'among low monks',
    },
    oo: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.36 } }],
      words: 'with an oo behind',
    },
    whispers: {
      effects: [
        { deviceId: 'vowel-reverb', preset: 'Whispering', params: { mix: 0.34 } },
        { deviceId: 'stereo-widener', preset: 'Wide' },
      ],
      words: 'in a whispering hall',
    },
    winter: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Winter drift', params: { mix: 0.38 } }],
      words: 'in a winter drift',
    },
    halo: {
      effects: [
        { deviceId: 'bloom-reverb', preset: 'Octave halo', params: { mix: 0.32 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 6 } },
      ],
      words: 'in an octave halo',
    },
    shaft: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Mine shaft', params: { mix: 0.34 } }],
      words: 'down a mine shaft',
    },
    patter: {
      effects: [
        { deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.3 } },
        { deviceId: 'ambient-eq', preset: 'Layer' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'in a pattering cave',
    },
    descent: {
      effects: [{ deviceId: 'spiral', preset: 'Slow descent', params: { mix: 0.34 } }],
      words: ', its tail forever sinking',
    },
    ascent: {
      effects: [{ deviceId: 'spiral', preset: 'Rising hall', params: { mix: 0.34 } }],
      words: ', its tail forever rising',
    },
    glow: {
      effects: [{ deviceId: 'haze', preset: 'Glowing wall', params: { mix: 0.34 } }],
      words: 'against a glowing wall',
    },
    wool: {
      effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.35 } }],
      words: 'in a wool blanket',
    },
    backrow: {
      effects: [
        { deviceId: 'distance', preset: 'Back of the hall' },
        { deviceId: 'stereo-widener', preset: 'Wide' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'at the back of the hall',
    },
    shore: {
      effects: [
        { deviceId: 'distance', preset: 'Far shore', params: { level: 0.85 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 3 } },
      ],
      words: 'from a far shore',
    },
    stairwell: {
      effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
      words: 'in a stone stairwell',
    },
    nextdoor: {
      effects: [
        { deviceId: 'distance', preset: 'Next door', params: { level: 0.85 } },
        { deviceId: 'tape', preset: 'Clean transfer' },
      ],
      words: 'from next door',
    },
    strings: {
      effects: [
        { deviceId: 'sympathetic', preset: 'Minor strings', params: { root: 9, mix: 0.4 } },
      ],
      words: 'with strings that answer',
    },
    openkeys: {
      effects: [
        { deviceId: 'silent-keys', preset: 'Open fifth and bass', params: { mix: 0.45 } },
        { deviceId: 'ambient-eq', preset: 'Open' },
      ],
      words: 'over an open silent chord',
    },
    bowltable: {
      effects: [
        { deviceId: 'bowls', preset: 'Faint halo', params: { mix: 0.22 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'beside a table of bowls',
    },
    lowbowls: {
      effects: [
        { deviceId: 'bowls', preset: 'Low fifths', params: { mix: 0.34 } },
        { deviceId: 'ambient-eq', preset: 'Warm' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'with bowls ringing low',
    },
    cloud: {
      effects: [
        { deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.45 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: 'in a soft cloud of itself',
    },
    mist: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.45 } }],
      words: 'in hanging mist',
    },
    longhold: {
      effects: [
        { deviceId: 'spectral-blur', preset: 'Long clean hold', params: { mix: 0.3 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: 'held on as a faint chord',
    },
    pedal: {
      effects: [
        { deviceId: 'sustainer', preset: 'Sustain pedal', params: { mix: 0.42 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', caught and held',
    },
    stacked: {
      effects: [
        { deviceId: 'sustainer', preset: 'Dark bed', params: { mix: 0.45 } },
        { deviceId: 'stereo-detune', preset: 'Soft halo' },
      ],
      words: 'over a dark held bed',
    },
    melting: {
      effects: [
        { deviceId: 'melt', preset: 'Slow melt' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: 'with a melting tail',
    },
    evaporate: {
      effects: [
        { deviceId: 'melt', preset: 'Evaporate' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', going up as vapour',
    },
    leaves: {
      effects: [
        { deviceId: 'falling', preset: 'Falling leaves', params: { mix: 0.34 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: 'with leaves of it falling',
    },
    glints: {
      effects: [
        { deviceId: 'glints', preset: 'Slow stars', params: { mix: 0.28 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'with a few glints above',
    },
    overspray: {
      effects: [
        { deviceId: 'glints', preset: 'Overtone spray', params: { mix: 0.26 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'with a spray of overtones',
    },
    shadow: {
      effects: [
        { deviceId: 'stretch', preset: 'Near shadow', params: { mix: 0.4 } },
        { deviceId: 'ambient-eq', preset: 'Shaded' },
      ],
      words: 'with a slow shadow behind',
    },
    passes: {
      effects: [{ deviceId: 'generations', preset: 'Into the room', params: { mix: 0.42 } }],
      words: ', taped over and over',
    },
    surf: {
      effects: [
        { deviceId: 'weather', preset: 'Slow surf', params: { exposure: 0.45 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: 'behind a slow surf',
    },
    breeze: {
      effects: [
        { deviceId: 'weather', preset: 'Breezy day', params: { exposure: 0.5 } },
        { deviceId: 'fdn-reverb', preset: 'Thin veil' },
      ],
      words: 'on a breezy day',
    },
    overcast: {
      effects: [
        { deviceId: 'weather', preset: 'Overcast' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: 'under passing cloud',
    },
    sunk: {
      effects: [
        { deviceId: 'underwater', preset: 'Just under' },
        { deviceId: 'chorus', preset: 'Faint air' },
      ],
      words: 'just under water',
    },
    bathtub: {
      effects: [
        { deviceId: 'underwater', preset: 'Bathtub' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: 'in a full bath',
    },
    record: {
      effects: [
        { deviceId: 'vinyl', preset: 'New pressing', params: { crackle: 0.3 } },
        { deviceId: 'ambient-eq', preset: 'Open' },
      ],
      words: 'on a new record',
    },
    parlour: {
      effects: [
        { deviceId: 'vinyl', preset: 'Parlour 78' },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.14 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'on an old fast record',
    },
    worn: {
      effects: [
        { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.15 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: 'on a worn cassette',
    },
    floor: {
      effects: [
        { deviceId: 'noise-floor', preset: 'Breathing tape', params: { level: -54 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'over breathing tape',
    },
    glassy: {
      effects: [
        { deviceId: 'low-bitrate', preset: 'Watery trace', params: { mix: 0.4 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.15 } },
      ],
      words: 'with a watery trace',
    },
    half: {
      effects: [
        { deviceId: 'half-speed', preset: 'Under the mix' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', itself at half speed under',
    },
    padfifth: {
      effects: [
        { deviceId: 'pitch-shifter', preset: 'Pad fifth', params: { mix: 0.3 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: 'with a fifth above',
    },
    octaves: {
      effects: [
        { deviceId: 'octaves', preset: 'Slow halo' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'in a halo of octaves',
    },
    stops: {
      effects: [
        { deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.6 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'under flute stops',
    },
    openstops: {
      effects: [
        { deviceId: 'stops', preset: 'Open fifths', params: { mix: 0.5 } },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'with organ fifths added',
    },
    throat: {
      effects: [
        { deviceId: 'overtone-singer', preset: 'Slow wander', params: { mix: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', an overtone wandering',
    },
    vowel: {
      effects: [
        { deviceId: 'imprint', preset: 'Round vowel', params: { amount: 0.8 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: 'through a round vowel',
    },
    tube: {
      effects: [
        { deviceId: 'imprint', preset: 'Hollow tube', params: { amount: 0.8 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
      ],
      words: 'through a hollow tube',
    },
    ringed: {
      effects: [
        { deviceId: 'ring', preset: 'Pad shimmer', params: { mix: 0.22 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'with a metal shimmer',
    },
    still: {
      effects: [
        { deviceId: 'freq-shifter', preset: 'Still water', params: { mix: 0.35 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: ', slowly out of true',
    },
    chime: {
      effects: [
        { deviceId: 'warp', preset: 'Soft chime', params: { mix: 0.5 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 6 } },
      ],
      words: 'bent towards a chime',
    },
    sines: {
      effects: [
        { deviceId: 'sine-shadow', preset: 'Long linger', params: { mix: 0.4 } },
        { deviceId: 'ambient-eq', preset: 'Open' },
      ],
      words: 'with sines lingering',
    },
    follower: {
      effects: [
        { deviceId: 'pad-follower', preset: 'Slow swell', params: { mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: 'with strings behind it',
    },
    shells: {
      effects: [
        { deviceId: 'buzzing-bridge', preset: 'Three shells', params: { mix: 0.4 } },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.12 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'with shells that buzz',
    },
    leafhall: {
      effects: [
        { deviceId: 'seasons', preset: 'Leaf fall' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: 'in an autumn air',
    },
    common: {
      effects: [
        { deviceId: 'common-tones', preset: 'Long hold', params: { mix: 0.5 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: 'with the common tones kept',
    },
    tuned: {
      effects: [
        { deviceId: 'scale-filter', preset: 'Lean to the key' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', leaned into the key',
    },
    giant: {
      effects: [
        { deviceId: 'size', preset: 'Larger' },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'in a larger body',
    },
    minute: {
      effects: [
        { deviceId: 'size', preset: 'Smaller' },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'in a smaller body',
    },
    lifted: {
      effects: [
        { deviceId: 'lift', preset: 'Long tails', params: { threshold: -30, amount: 0.5 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
      ],
      words: 'with the tails brought up',
    },
    drifter: {
      effects: [
        { deviceId: 'spectral-drifter', preset: 'Octave halo', params: { mix: 0.24 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
      ],
      words: 'in a drifting octave halo',
    },
    kettle: {
      effects: [
        { deviceId: 'vessel', preset: 'Kettle', params: { mix: 0.3 } },
        { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 5, depth: 0.4 } },
      ],
      words: 'inside a kettle that trembles',
    },
    kitchen: {
      effects: [
        {
          deviceId: 'radio',
          preset: 'Kitchen radio',
          params: { static: 0.08, interference: 0.04 },
        },
      ],
      words: 'from a kitchen radio',
    },
    around4: {
      effects: [
        { deviceId: 'around', preset: 'Wide pendulum' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', swung wide from ear to ear',
    },
    orbit: {
      effects: [
        { deviceId: 'orbits', preset: 'Pulse pair', params: { mix: 0.3 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: 'over a pair of slow loops',
    },
    cistern: {
      effects: [
        { deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.4 } },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: 'down a cistern',
    },
  },
  phrases: {
    tied: {
      notes: [
        { atSec: 0, durSec: 3.5, note: 50, gain: 0.84 },
        { atSec: 0, durSec: 3.5, note: 57, gain: 0.7 },
        { atSec: 0, durSec: 7.2, note: 64, gain: 0.7 },
        { atSec: 0, durSec: 3.5, note: 72, gain: 0.63 },
        { atSec: 3.5, durSec: 3.7, note: 52, gain: 0.84 },
        { atSec: 3.5, durSec: 3.7, note: 55, gain: 0.7 },
        { atSec: 3.5, durSec: 3.7, note: 71, gain: 0.63 },
      ],
    },
    chain: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 45, gain: 0.77 },
        { atSec: 0, durSec: 7.2, note: 52, gain: 0.56 },
        { atSec: 0, durSec: 2.4, note: 72, gain: 0.84 },
        { atSec: 0, durSec: 1.3, note: 64, gain: 0.7 },
        { atSec: 1.3, durSec: 2.3, note: 62, gain: 0.7 },
        { atSec: 2.4, durSec: 2.2, note: 71, gain: 0.77 },
        { atSec: 3.6, durSec: 3.6, note: 60, gain: 0.7 },
        { atSec: 4.6, durSec: 2.6, note: 69, gain: 0.77 },
      ],
    },
    entries: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 48, gain: 0.84 },
        { atSec: 0.9, durSec: 6.3, note: 55, gain: 0.7 },
        { atSec: 1.9, durSec: 5.3, note: 64, gain: 0.7 },
        { atSec: 3, durSec: 4.2, note: 71, gain: 0.63 },
        { atSec: 4.4, durSec: 2.8, note: 74, gain: 0.56 },
      ],
    },
    fifths: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 38, gain: 0.9 },
        { atSec: 0, durSec: 7.2, note: 45, gain: 0.7 },
        { atSec: 2.6, durSec: 4.4, note: 64, gain: 0.49 },
      ],
    },
    deep: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 31, gain: 0.9 },
        { atSec: 0, durSec: 7.2, note: 43, gain: 0.7 },
        { atSec: 1.8, durSec: 5.4, note: 62, gain: 0.49 },
      ],
    },
    open: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 45, gain: 0.77 },
        { atSec: 0, durSec: 7.2, note: 52, gain: 0.7 },
        { atSec: 1.4, durSec: 5.8, note: 59, gain: 0.56 },
        { atSec: 3.2, durSec: 4, note: 69, gain: 0.49 },
      ],
    },
    sway: {
      notes: [
        { atSec: 0, durSec: 3.6, note: 41, gain: 0.84 },
        { atSec: 0, durSec: 7.2, note: 48, gain: 0.7 },
        { atSec: 0, durSec: 7.2, note: 64, gain: 0.63 },
        { atSec: 3.6, durSec: 3.6, note: 40, gain: 0.84 },
        { atSec: 1.6, durSec: 2, note: 69, gain: 0.56 },
        { atSec: 3.6, durSec: 3.6, note: 67, gain: 0.56 },
      ],
    },
    walk: {
      notes: [
        { atSec: 0, durSec: 1.1, note: 38, gain: 0.9 },
        { atSec: 1.5, durSec: 1, note: 33, gain: 0.9 },
        { atSec: 2.8, durSec: 0.5, note: 36, gain: 0.84 },
        { atSec: 3.4, durSec: 0.5, note: 38, gain: 0.9 },
        { atSec: 4, durSec: 1, note: 41, gain: 0.9 },
        { atSec: 5.2, durSec: 2, note: 40, gain: 0.9 },
      ],
    },
    sink: {
      notes: [
        { atSec: 0, durSec: 2.2, note: 31, gain: 0.9 },
        { atSec: 2.4, durSec: 1.2, note: 40, gain: 0.84 },
        { atSec: 3.7, durSec: 0.8, note: 38, gain: 0.84 },
        { atSec: 4.6, durSec: 2.6, note: 33, gain: 0.9 },
      ],
    },
    ground: {
      notes: [
        { atSec: 0, durSec: 0.45, note: 33, gain: 0.9 },
        { atSec: 0.75, durSec: 0.4, note: 33, gain: 0.77 },
        { atSec: 1.5, durSec: 0.4, note: 40, gain: 0.84 },
        { atSec: 2.25, durSec: 0.4, note: 33, gain: 0.9 },
        { atSec: 3, durSec: 0.6, note: 45, gain: 0.77 },
        { atSec: 3.75, durSec: 0.4, note: 43, gain: 0.77 },
        { atSec: 4.5, durSec: 0.4, note: 40, gain: 0.84 },
        { atSec: 5.25, durSec: 1.9, note: 36, gain: 0.9 },
      ],
    },
    tenths: {
      notes: [
        { atSec: 0, durSec: 3.3, note: 33, gain: 0.9 },
        { atSec: 0, durSec: 3.3, note: 52, gain: 0.56 },
        { atSec: 0.8, durSec: 2.5, note: 60, gain: 0.49 },
        { atSec: 3.5, durSec: 3.6, note: 29, gain: 0.9 },
        { atSec: 3.5, durSec: 3.6, note: 53, gain: 0.56 },
        { atSec: 4.3, durSec: 2.8, note: 60, gain: 0.49 },
      ],
    },
    pulse: {
      notes: [
        { atSec: 0, durSec: 0.18, note: 36, gain: 0.9 },
        { atSec: 0.9, durSec: 0.18, note: 36, gain: 0.84 },
        { atSec: 1.35, durSec: 0.18, note: 43, gain: 0.7 },
        { atSec: 1.8, durSec: 0.18, note: 36, gain: 0.9 },
        { atSec: 2.7, durSec: 0.18, note: 31, gain: 0.9 },
        { atSec: 3.6, durSec: 0.18, note: 36, gain: 0.9 },
        { atSec: 4.05, durSec: 0.18, note: 43, gain: 0.63 },
        { atSec: 4.5, durSec: 0.18, note: 48, gain: 0.7 },
        { atSec: 5.4, durSec: 0.3, note: 36, gain: 0.9 },
        { atSec: 6.3, durSec: 0.3, note: 31, gain: 0.9 },
      ],
    },
    answer: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 64, gain: 0.9 },
        { atSec: 0.5, durSec: 0.5, note: 69, gain: 0.84 },
        { atSec: 1, durSec: 1.2, note: 71, gain: 0.9 },
        { atSec: 2.4, durSec: 0.5, note: 60, gain: 0.7 },
        { atSec: 2.9, durSec: 0.5, note: 57, gain: 0.7 },
        { atSec: 3.4, durSec: 1.2, note: 55, gain: 0.77 },
        { atSec: 4.8, durSec: 0.4, note: 64, gain: 0.7 },
        { atSec: 5.2, durSec: 0.4, note: 67, gain: 0.77 },
        { atSec: 5.6, durSec: 1.6, note: 72, gain: 0.84 },
        { atSec: 5.6, durSec: 1.6, note: 52, gain: 0.56 },
      ],
    },
    twovoice: {
      notes: [
        { atSec: 0, durSec: 1.3, note: 53, gain: 0.77 },
        { atSec: 0, durSec: 1.3, note: 69, gain: 0.84 },
        { atSec: 1.4, durSec: 1.3, note: 55, gain: 0.77 },
        { atSec: 1.4, durSec: 1.3, note: 71, gain: 0.84 },
        { atSec: 2.8, durSec: 1.3, note: 52, gain: 0.77 },
        { atSec: 2.8, durSec: 1.3, note: 72, gain: 0.84 },
        { atSec: 4.2, durSec: 1.3, note: 50, gain: 0.77 },
        { atSec: 4.2, durSec: 1.3, note: 74, gain: 0.84 },
        { atSec: 5.6, durSec: 1.6, note: 45, gain: 0.84 },
        { atSec: 5.6, durSec: 1.6, note: 72, gain: 0.77 },
      ],
    },
    broken: {
      notes: [
        { atSec: 0, durSec: 2.4, note: 48, gain: 0.84 },
        { atSec: 0.45, durSec: 2, note: 55, gain: 0.77 },
        { atSec: 0.9, durSec: 2, note: 64, gain: 0.77 },
        { atSec: 1.35, durSec: 2.4, note: 71, gain: 0.7 },
        { atSec: 1.8, durSec: 2.6, note: 74, gain: 0.7 },
        { atSec: 4, durSec: 3.2, note: 45, gain: 0.84 },
        { atSec: 4.4, durSec: 2.8, note: 57, gain: 0.7 },
        { atSec: 4.8, durSec: 2.4, note: 64, gain: 0.7 },
        { atSec: 5.2, durSec: 2, note: 72, gain: 0.7 },
      ],
    },
    steps: {
      notes: [
        { atSec: 0, durSec: 0.2, note: 69, gain: 0.9 },
        { atSec: 0.6, durSec: 0.2, note: 72, gain: 0.84 },
        { atSec: 1.2, durSec: 0.2, note: 76, gain: 0.9 },
        { atSec: 1.5, durSec: 0.2, note: 74, gain: 0.7 },
        { atSec: 2.4, durSec: 0.2, note: 67, gain: 0.9 },
        { atSec: 3, durSec: 0.2, note: 71, gain: 0.84 },
        { atSec: 3.6, durSec: 0.2, note: 74, gain: 0.84 },
        { atSec: 3.9, durSec: 0.2, note: 72, gain: 0.7 },
        { atSec: 4.8, durSec: 0.2, note: 64, gain: 0.9 },
        { atSec: 5.1, durSec: 0.2, note: 67, gain: 0.7 },
        { atSec: 5.7, durSec: 0.6, note: 69, gain: 0.9 },
      ],
    },
    tolls: {
      notes: [
        { atSec: 0, durSec: 0.6, note: 81, gain: 0.84 },
        { atSec: 1.1, durSec: 0.6, note: 76, gain: 0.77 },
        { atSec: 2.2, durSec: 0.6, note: 74, gain: 0.77 },
        { atSec: 3.5, durSec: 0.6, note: 83, gain: 0.7 },
        { atSec: 4.7, durSec: 0.6, note: 79, gain: 0.7 },
        { atSec: 5.9, durSec: 0.8, note: 72, gain: 0.84 },
      ],
    },
    changes: {
      notes: [
        { atSec: 0, durSec: 0.35, note: 84, gain: 0.77 },
        { atSec: 0.45, durSec: 0.35, note: 81, gain: 0.7 },
        { atSec: 0.9, durSec: 0.35, note: 79, gain: 0.7 },
        { atSec: 1.35, durSec: 0.35, note: 76, gain: 0.77 },
        { atSec: 2, durSec: 0.35, note: 81, gain: 0.7 },
        { atSec: 2.45, durSec: 0.35, note: 84, gain: 0.77 },
        { atSec: 2.9, durSec: 0.35, note: 76, gain: 0.7 },
        { atSec: 3.35, durSec: 0.35, note: 79, gain: 0.7 },
        { atSec: 4, durSec: 0.35, note: 81, gain: 0.77 },
        { atSec: 4.45, durSec: 0.35, note: 76, gain: 0.7 },
        { atSec: 4.9, durSec: 0.35, note: 84, gain: 0.7 },
        { atSec: 5.35, durSec: 0.9, note: 79, gain: 0.77 },
      ],
    },
    highones: {
      notes: [
        { atSec: 0, durSec: 1, note: 88, gain: 0.7 },
        { atSec: 2.2, durSec: 1, note: 83, gain: 0.63 },
        { atSec: 4.6, durSec: 1.2, note: 91, gain: 0.56 },
        { atSec: 4.6, durSec: 1.2, note: 79, gain: 0.56 },
      ],
    },
    lowbell: {
      notes: [
        { atSec: 0, durSec: 1, note: 50, gain: 0.9 },
        { atSec: 1.6, durSec: 1, note: 57, gain: 0.77 },
        { atSec: 3, durSec: 1.2, note: 48, gain: 0.9 },
        { atSec: 4.8, durSec: 1.6, note: 52, gain: 0.84 },
        { atSec: 4.8, durSec: 1.6, note: 64, gain: 0.49 },
      ],
    },
    chant: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 50, gain: 0.56 },
        { atSec: 0, durSec: 1.2, note: 62, gain: 0.84 },
        { atSec: 1.2, durSec: 0.8, note: 64, gain: 0.77 },
        { atSec: 2, durSec: 1.4, note: 65, gain: 0.84 },
        { atSec: 3.4, durSec: 0.8, note: 64, gain: 0.77 },
        { atSec: 4.2, durSec: 0.8, note: 62, gain: 0.7 },
        { atSec: 5, durSec: 0.8, note: 60, gain: 0.77 },
        { atSec: 5.8, durSec: 1.4, note: 62, gain: 0.84 },
      ],
    },
    duet: {
      notes: [
        { atSec: 0, durSec: 1.9, note: 53, gain: 0.77 },
        { atSec: 1.9, durSec: 1.8, note: 52, gain: 0.7 },
        { atSec: 3.7, durSec: 1.8, note: 50, gain: 0.77 },
        { atSec: 5.5, durSec: 1.8, note: 48, gain: 0.77 },
        { atSec: 0, durSec: 2.6, note: 69, gain: 0.77 },
        { atSec: 2.6, durSec: 1.8, note: 67, gain: 0.7 },
        { atSec: 4.4, durSec: 1.8, note: 65, gain: 0.7 },
        { atSec: 6.2, durSec: 1.1, note: 64, gain: 0.77 },
      ],
    },
    longone: {
      notes: [{ atSec: 0, durSec: 6.8, note: 57, gain: 0.9 }],
    },
    chorale: {
      notes: [
        { atSec: 0, durSec: 1.75, note: 48, gain: 0.77 },
        { atSec: 0, durSec: 1.75, note: 55, gain: 0.63 },
        { atSec: 0, durSec: 1.75, note: 64, gain: 0.63 },
        { atSec: 0, durSec: 1.75, note: 72, gain: 0.7 },
        { atSec: 1.8, durSec: 1.75, note: 45, gain: 0.77 },
        { atSec: 1.8, durSec: 1.75, note: 57, gain: 0.63 },
        { atSec: 1.8, durSec: 1.75, note: 64, gain: 0.63 },
        { atSec: 1.8, durSec: 1.75, note: 72, gain: 0.7 },
        { atSec: 3.6, durSec: 1.75, note: 50, gain: 0.77 },
        { atSec: 3.6, durSec: 1.75, note: 57, gain: 0.63 },
        { atSec: 3.6, durSec: 1.75, note: 65, gain: 0.63 },
        { atSec: 3.6, durSec: 1.75, note: 74, gain: 0.7 },
        { atSec: 5.4, durSec: 1.8, note: 43, gain: 0.77 },
        { atSec: 5.4, durSec: 1.8, note: 59, gain: 0.63 },
        { atSec: 5.4, durSec: 1.8, note: 62, gain: 0.63 },
        { atSec: 5.4, durSec: 1.8, note: 74, gain: 0.7 },
      ],
    },
    pedalpoint: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 36, gain: 0.84 },
        { atSec: 0, durSec: 1.7, note: 64, gain: 0.63 },
        { atSec: 0, durSec: 1.7, note: 72, gain: 0.7 },
        { atSec: 1.8, durSec: 1.7, note: 65, gain: 0.63 },
        { atSec: 1.8, durSec: 1.7, note: 74, gain: 0.7 },
        { atSec: 3.6, durSec: 1.7, note: 67, gain: 0.63 },
        { atSec: 3.6, durSec: 1.7, note: 76, gain: 0.7 },
        { atSec: 5.4, durSec: 1.8, note: 64, gain: 0.63 },
        { atSec: 5.4, durSec: 1.8, note: 72, gain: 0.7 },
      ],
    },
    wheel: {
      notes: [
        { atSec: 0, durSec: 0.25, note: 57, gain: 0.9 },
        { atSec: 0.4, durSec: 0.25, note: 64, gain: 0.77 },
        { atSec: 0.8, durSec: 0.25, note: 69, gain: 0.77 },
        { atSec: 1.2, durSec: 0.25, note: 72, gain: 0.84 },
        { atSec: 1.6, durSec: 0.25, note: 71, gain: 0.77 },
        { atSec: 2, durSec: 0.25, note: 64, gain: 0.7 },
        { atSec: 2.4, durSec: 0.25, note: 53, gain: 0.9 },
        { atSec: 2.8, durSec: 0.25, note: 62, gain: 0.77 },
        { atSec: 3.2, durSec: 0.25, note: 69, gain: 0.77 },
        { atSec: 3.6, durSec: 0.25, note: 74, gain: 0.84 },
        { atSec: 4, durSec: 0.25, note: 72, gain: 0.77 },
        { atSec: 4.4, durSec: 0.25, note: 65, gain: 0.7 },
        { atSec: 4.8, durSec: 0.25, note: 52, gain: 0.9 },
        { atSec: 5.2, durSec: 0.25, note: 60, gain: 0.77 },
        { atSec: 5.6, durSec: 0.9, note: 67, gain: 0.84 },
      ],
    },
    spread: {
      notes: [
        { atSec: 0, durSec: 3, note: 52, gain: 0.77 },
        { atSec: 0.07, durSec: 2.9, note: 59, gain: 0.7 },
        { atSec: 0.14, durSec: 2.8, note: 64, gain: 0.7 },
        { atSec: 0.21, durSec: 2.7, note: 67, gain: 0.7 },
        { atSec: 0.28, durSec: 2.6, note: 74, gain: 0.77 },
        { atSec: 3.4, durSec: 3, note: 50, gain: 0.77 },
        { atSec: 3.47, durSec: 2.9, note: 60, gain: 0.7 },
        { atSec: 3.54, durSec: 2.8, note: 65, gain: 0.7 },
        { atSec: 3.61, durSec: 2.7, note: 69, gain: 0.7 },
        { atSec: 3.68, durSec: 2.6, note: 74, gain: 0.77 },
      ],
    },
    far: {
      notes: [
        { atSec: 0, durSec: 6.6, note: 79, gain: 0.7 },
        { atSec: 2.4, durSec: 4.4, note: 72, gain: 0.56 },
      ],
    },
    three: {
      notes: [
        { atSec: 0, durSec: 3.6, note: 48, gain: 0.84 },
        { atSec: 2, durSec: 3.4, note: 60, gain: 0.7 },
        { atSec: 4, durSec: 3.2, note: 67, gain: 0.63 },
      ],
    },
    peals: {
      notes: [
        { atSec: 0, durSec: 0.4, note: 67, gain: 0.84 },
        { atSec: 0.5, durSec: 0.4, note: 72, gain: 0.77 },
        { atSec: 1, durSec: 0.4, note: 64, gain: 0.77 },
        { atSec: 1.5, durSec: 0.4, note: 69, gain: 0.84 },
        { atSec: 2.2, durSec: 0.4, note: 71, gain: 0.77 },
        { atSec: 2.7, durSec: 0.4, note: 67, gain: 0.7 },
        { atSec: 3.2, durSec: 0.4, note: 62, gain: 0.77 },
        { atSec: 3.9, durSec: 0.9, note: 64, gain: 0.84 },
        { atSec: 5.2, durSec: 0.4, note: 72, gain: 0.77 },
        { atSec: 5.7, durSec: 1.2, note: 67, gain: 0.84 },
      ],
    },
    knell: {
      notes: [
        { atSec: 0, durSec: 0.8, note: 69, gain: 0.9 },
        { atSec: 1.3, durSec: 0.8, note: 64, gain: 0.77 },
        { atSec: 2.6, durSec: 0.8, note: 62, gain: 0.84 },
        { atSec: 3.9, durSec: 0.8, note: 71, gain: 0.77 },
        { atSec: 5.2, durSec: 1.4, note: 67, gain: 0.84 },
        { atSec: 5.2, durSec: 1.4, note: 60, gain: 0.56 },
      ],
    },
    lament: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 45, gain: 0.77 },
        { atSec: 0, durSec: 7.2, note: 52, gain: 0.63 },
        { atSec: 0, durSec: 2.4, note: 64, gain: 0.56 },
        { atSec: 2.4, durSec: 2.2, note: 62, gain: 0.56 },
        { atSec: 4.6, durSec: 2.6, note: 60, gain: 0.63 },
      ],
    },
    veil: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 41, gain: 0.77 },
        { atSec: 0, durSec: 7.2, note: 60, gain: 0.56 },
        { atSec: 0, durSec: 7.2, note: 69, gain: 0.63 },
        { atSec: 0, durSec: 3.6, note: 64, gain: 0.63 },
        { atSec: 3.6, durSec: 3.6, note: 62, gain: 0.63 },
      ],
    },
  },
  directions: [
    {
      id: 'dune-pads',
      name: 'Dune pads',
      category: 'pad',
      rows: `
Camel bells far off | Dune pad | lockstep=.9 onset=1.2 pace=.28 slope=.6 front=.9 layerOrder=4 layer=.6 grain=.5 width=1 spread=6 run=14 grit=.18 volume=2.5 | hall | entries | A clear hum a wave walks up every few seconds, its fourth harmonic ringing
Caravan at first light | Dune pad | lockstep=.7 onset=.8 pace=.55 slope=.8 front=1 bury=.35 boom=.3 dry=.4 layerOrder=8 spread=0 run=1.2 volume=-2 | undertow | tied | Steep waves that cross the chord from low to high, loose sand running with them
Warm flank | Dune pad | lockstep=.96 grit=.05 spread=4 slope=.15 pace=.07 onset=1.6 layer=.7 layerOrder=2 boom=.3 dry=.05 width=.5 front=.2 run=1.2 | warmth | veil | Nearly every grain in step, smooth and even, its octave sung by the layer
Sand over slate | Dune pad | lockstep=.55 grit=.6 spread=30 dry=.6 slope=.3 pace=.35 onset=.5 grain=.6 width=1 front=0 layerOrder=5 run=2 | thinned | tied | A rough hum half out of step with a steady hiss of dry sand over it
Ridge at noon | Dune pad | grain=.85 bury=0 lockstep=.88 layer=.3 layerOrder=6 slope=.5 pace=.3 onset=.7 dry=.15 spread=32 grit=.45 volume=0.5 | open | entries | Fine bright sand on an open ridge, hardly buried, rising and falling slowly
Under the blankets | Night crossing | bury=.95 boom=.6 onset=2 pace=.2 slope=.5 layerOrder=1 layer=.4 grit=.1 width=.85 | bare | open | A pad from deep under the surface, almost only its ground and a boom
Well of the oasis | Night crossing | bury=.6 slope=1 pace=.22 front=.4 onset=1.4 layerOrder=5 layer=.75 dry=.2 lockstep=.9 width=.5 spread=6 grit=.2 | cave | open | Buried deep until a surge goes by and lifts the lid off a singing fifth harmonic
Moon through canvas | Night crossing | bury=.5 cluster=3 slope=.6 pace=.15 onset=1.8 grain=.5 boom=.2 layer=.3 width=.9 front=.4 grit=.15 volume=3 | deepsea | tied | A covered hum in three groups with a pale twelfth over each key
Last tent | Night crossing | pulse=Wet bury=.45 boom=.1 onset=1.2 pace=.3 slope=.4 dry=.15 layerOrder=4 width=.35 grit=.45 | latehall | tied | Hollow wet grains under a layer of sand, swelling a little and sinking again
Dog asleep by embers | Night crossing | bury=.68 boom=.8 lockstep=1 grit=.03 spread=2 slope=.2 pace=.4 onset=.9 layer=.2 flow=.8 width=.35 run=2 | soft | entries | A dark round pad wholly in step with a strong boom an octave down
Shadows lean together | Dune pad | cluster=2 grain=.55 lockstep=.94 onset=1 layer=.3 layerOrder=6 slope=.35 pace=.2 bury=.1 width=.6 spread=0 run=6 volume=1 | ensemble | tied | Grains in two groups, so every key carries its octave
Parallel footprints | Dune pad | cluster=2 pulse=Glassy lockstep=.7 spread=55 onset=.9 bury=.3 layerOrder=8 layer=.5 slope=.3 front=.2 run=14 grit=.15 volume=3 | panned | entries | Ground glass in two groups, a double octave that beats where grains stay loose
Rider falling behind | Dune pad | cluster=3 lockstep=.8 grain=.35 onset=1.5 slump=5 layer=.65 layerOrder=3 pace=.18 slope=.65 boom=.25 front=0 run=3 volume=-2 | longplate | open | Three groups that raise the twelfth over a dark coarse hum, swelling slowly
Horizon in layers | Dune pad | cluster=5 grain=.3 lockstep=.95 bury=.35 onset=1.1 layer=0 slope=.4 pace=.5 front=.2 boom=.4 width=.8 spread=28 run=3 grit=.08 volume=2 | thinair | tied | Five groups lift a soft high third over the chord, all keys surging as one
Tracks down to the sea | Dune pad | cluster=6 grain=.25 lockstep=.9 bury=.5 onset=.6 spread=20 dry=.35 slope=.25 boom=.35 pace=.12 layerOrder=1 grit=.1 volume=4 | circle | open | Six groups under sand, a high fifth that shines over a low boom
Greenhouse at dusk | Glass drift | cluster=1 lockstep=.9 onset=1.1 spread=10 layer=.3 layerOrder=4 slope=.35 pace=.3 bury=.2 front=.3 run=6 volume=1.5 | water | tied | Ground glass nearly all in step, a clear pale pad
Bottle bank by daylight | Glass drift | cluster=3 lockstep=.5 spread=70 onset=.6 grit=.5 dry=.5 bury=.15 slope=.2 front=.8 pace=.55 run=1.2 | wide | chain | Glass grains spread far off the note, shimmering in three groups with hiss between
Frost inside the pane | Glass drift | cluster=1 grain=.2 lockstep=.97 grit=.03 onset=2 layer=1 layerOrder=9 slope=.5 pace=.16 dry=0 run=1.2 | glasstail | tied | Coarse dull glass with a thin ninth harmonic whistling out as it swells
Lamp room stairs | Glass drift | cluster=2 surge=Aftershocks slope=.5 pace=.5 onset=.4 lockstep=.85 spread=15 slump=4 layer=.2 width=1 front=.4 run=14 | stairwell | tied | A glass pad shaken by one shock and weaker ones after it, its double octave ringing
Salt on the railings | Glass drift | cluster=1 grain=.5 lockstep=.9 spread=20 bury=.1 layer=.85 layerOrder=9 pace=1.3 slope=.5 front=1 onset=.03 surge=Slips volume=2 | brightplate | sway | Bright glass that breaks into quick slips, a ninth harmonic flying off each | texture
Reeds in brown water | Wet hollow | lockstep=.95 grit=.1 layerOrder=5 layer=.4 onset=.8 slope=.15 boom=.2 dry=.1 front=0 pace=.12 spread=20 run=1.2 volume=-3.5 | bathtub | tied | Wet hollow grains all but in step, odd harmonics only, soft and reedy
Mud between the stones | Wet hollow | lockstep=.5 grit=.7 spread=40 dry=.7 onset=.5 grain=.6 slope=.5 pace=.8 layer=.3 front=1 layerOrder=1 run=2 volume=-1 | shade | entries | Wet sand that pops and rasps, half a note and half a bubbling floor
Hot spring | Wet hollow | lockstep=.7 grain=.75 dry=.5 slope=.8 pace=.6 front=.9 layerOrder=2 layer=.75 onset=.3 width=.9 run=3 grit=.22 | drip | sway | Bubbling wet grains in steep waves with a strong octave ringing
Canal under the bridge | Wet hollow | cluster=2 grain=.3 bury=.4 boom=.4 onset=1.5 slope=.35 pace=.2 layer=.2 width=.85 front=.1 layerOrder=2 run=3 grit=.22 | shaft | fifths | Dark wet sand in octaves, slow and covered, with a boom beneath
Floating lanterns | Wet hollow | grain=.5 layer=.9 layerOrder=3 lockstep=.9 onset=1 slope=.6 pace=.25 front=1 dry=.05 bury=0 width=.5 spread=8 run=14 volume=-0.5 | light | open | A hollow hum whose twelfth is sung strongly and drifts from key to key
Gulls turn together | Slips on the ridge | pulse=Round onset=.6 pace=.5 slope=.6 front=.7 grain=.5 lockstep=.85 layerOrder=4 slump=2 spread=24 volume=-2.5 | cloud | tied | A round pad in which a bright slip runs up the chord every two seconds
Sun between curtains | Slips on the ridge | pulse=Glassy onset=.9 pace=.35 slope=.45 front=.2 grain=.4 bury=.3 width=1 slump=3 grit=.15 volume=3.5 | opening | entries | Glass that flares all at once every three seconds and falls back
Folding chairs | Slips on the ridge | pulse=Flint onset=.4 pace=1 slope=.5 front=1 bury=.4 grain=.35 boom=.3 cluster=2 width=.9 spread=6 grit=.15 volume=2 | throb | chain | Flint in octaves, half covered, slipping once a second from low to high
Sails coming about | Slips on the ridge | pulse=Wet onset=.5 pace=.7 slope=.7 front=.6 lockstep=.8 layer=.6 layerOrder=3 dry=.4 width=.85 spread=6 volume=1.5 | breeze | sway | Wet grains that let go in sudden slips with a spray at each
Windmill in four parts | Slips on the ridge | pulse=Round cluster=4 grain=.3 onset=.7 pace=.6 slope=.4 bury=.35 layer=.2 boom=.2 front=.9 spread=24 volume=6 | farhorn | open | Four groups raise two octaves over a dark pad, turned over by slow slips
Low sun on gut | Dune pad | pulse=Flint grain=.25 grit=.45 lockstep=.9 onset=.45 slope=.1 layer=.55 layerOrder=2 bury=.4 dry=.1 run=8 width=.5 spread=32 volume=0.5 | room | duet | Coarse flint drawn like a bow, a rasp on every note and its octave ringing | string
Rosin and grit | Dune pad | pulse=Flint grain=.45 grit=.65 lockstep=.8 spread=20 onset=.3 slope=.15 bury=.3 dry=.35 layer=.3 slump=.8 width=.35 front=0 pace=.55 run=1.2 | board | chain | Rough flint with loose dust over it, a bowed chord from close to the strings | string
Crank and wheel | Dune pad | pulse=Flint cluster=2 grain=.3 grit=.5 lockstep=.95 onset=.12 pace=4.5 slope=.35 front=0 bury=.25 slump=.5 flow=1 width=.35 layerOrder=1 spread=8 | shells | fifths | A wheel of flint in octaves, trembling fast and evenly as if cranked | string
Attic viols | Dune pad | pulse=Round grain=.7 grit=.4 lockstep=.9 spread=10 onset=.6 slope=.25 pace=.25 bury=.35 layer=.7 layerOrder=5 boom=0 slump=1.2 width=.5 front=.3 run=1.2 volume=0.5 | follower | duet | Fine round sand with a little rasp, its fifth harmonic singing like gut | string
Bass bar | Dune pad | pulse=Flint grain=.15 grit=.3 lockstep=.97 onset=.5 boom=.6 bury=.5 layer=.4 layerOrder=3 slope=.2 dry=0 run=10 width=.5 pace=.12 spread=20 | strings | sway | Dark flint bowed low with a boom under each key | string
Gap in the dunes | Whistling crest | layerOrder=6 layer=.9 dry=.7 lockstep=.6 onset=.5 slope=.6 pace=.3 slump=2 grain=.6 width=.35 front=.2 spread=20 run=2 grit=.1 volume=0 | whispers | duet | Wind over a gap: a whistled sixth harmonic in a bed of blown sand | wind
Flute from a reed bed | Whistling crest | pulse=Wet layerOrder=3 layer=.7 dry=.35 lockstep=.92 onset=.2 slope=.2 pace=.5 grain=.4 bury=.1 slump=.6 width=.2 run=9 grit=.4 volume=-1 | pipe | duet | A hollow breathy pipe, its twelfth ringing and sand blowing across | wind
Dust devil | Whistling crest | layerOrder=9 layer=1 dry=.7 bury=.3 lockstep=.4 spread=50 pace=1.4 slope=.8 front=1 onset=.5 width=1 run=2 grit=.2 volume=3 | circle 1.rate=.45 | open | A thin whistle that turns fast in a cloud of loose sand | wind
Panpipes of clay | Whistling crest | pulse=Round grain=.2 layerOrder=2 layer=.85 dry=.5 lockstep=.95 onset=.09 slope=0 bury=.3 slump=.4 run=2 flow=.5 width=.35 spread=8 grit=.08 volume=0 | pot | duet | Short dark breaths with a strong octave, plain and even | wind
Keyhole wind | Whistling crest | pulse=Squeak grain=.1 layerOrder=7 layer=.8 dry=.6 lockstep=.7 onset=1.4 slope=.5 pace=.2 bury=.4 slump=3 width=.2 front=.9 spread=3 run=14 grit=.38 volume=-1.5 | haze 1.mix=.4 | open | Low creaking sand with a whistle over it, a draught that comes and goes | wind
Looms in the next street | Running pulse | pace=2.2 slope=.6 front=.6 onset=.5 cluster=1 grain=.4 layer=.4 layerOrder=4 slump=2 bury=.2 width=1 spread=20 grit=.45 volume=-1 | nextdoor | tied | A round pad beating twice a second, the beat running up the keys
Heart of the generator | Running pulse | pulse=Wet pace=5 slope=.5 front=0 onset=.8 boom=.5 bury=.45 layer=.3 cluster=1 grain=.35 slump=1.5 width=.35 spread=32 grit=.38 | pillow | sway | Dark wet grains that tremble five times a second, all keys at once, with a boom
Signal mirrors | Running pulse | pulse=Glassy pace=3 slope=.7 front=1 onset=.3 cluster=2 grain=.5 bury=.05 width=1 slump=1.8 layer=.2 spread=32 grit=.22 volume=2 | stars | open | Glass two octaves up that flashes three times a second from side to side
Sewing by lamplight | Running pulse | pulse=Flint pace=7 slope=.45 front=.4 onset=.6 cluster=1 grain=.2 bury=.5 layer=.5 layerOrder=3 slump=1 width=.6 grit=.18 | valve | chain | Covered flint in a quick fine tremble, seven to the second
Slow fairground wheel | Running pulse | pace=1.1 slope=.75 front=.5 onset=.7 cluster=3 grain=.3 layer=.15 boom=.35 slump=3 bury=.25 width=.5 spread=3 grit=.1 volume=2 | swirl | entries | Three groups and their twelfths turning once a second over a low boom
Heat above the road | Dune pad | cluster=4 grain=.35 lockstep=.6 spread=55 dry=.2 onset=1.5 layer=.2 slope=.2 pace=.12 width=1 boom=0 front=1 layerOrder=1 run=9 grit=.45 volume=0.5 | thinair 1.mix=.25 | tied | Four loose groups whose high octaves waver wide of the note
Milk of the moon | Dune pad | lockstep=1 grit=0 spread=0 grain=.15 layer=0 layerOrder=2 slope=0 dry=0 boom=.15 onset=3.6 width=.4 bury=.1 run=1.2 | octaves | fifths | Smooth coarse sand with nothing loose in it, a soft plain tone that fades in
Thistle pad | Dune pad | pulse=Squeak grain=.25 lockstep=.9 grit=.2 onset=.9 bury=.45 layer=.35 layerOrder=2 slope=.3 pace=.35 boom=.25 front=0 spread=3 run=6 volume=-1.5 | ah | sway | Muffled squeaking sand, a nasal pad that opens as each wave goes by
Evening prayer mats | Dune pad | lockstep=.35 spread=40 grit=.8 onset=1.2 grain=.35 bury=.3 layer=.95 layerOrder=1 slope=.5 pace=.2 dry=.4 front=.2 run=14 | monks | veil | A rough breath of sand with each key's own ground rung out of it
Empty quarter | Dune pad | lockstep=.2 spread=80 grit=.35 onset=2 grain=.3 bury=.2 layer=.7 layerOrder=3 slope=.7 pace=.25 dry=.5 width=1 flow=.9 front=.4 | horizon | open | Hardly a note at all, a wide pale hum that gathers with the waves and goes
`,
    },
    {
      id: 'bass-slopes',
      name: 'Bass slopes',
      category: 'bass',
      rows: `
Barefoot on clay | Bass slope | onset=.01 run=.9 flow=.25 slump=.25 bury=.4 boom=.3 layerOrder=3 layer=.3 width=.4 volume=5 | bare | walk | A round bass with a soft front that settles quickly to a quarter of itself
Cellar door | Bass slope | pulse=Flint surge=Slips slope=.6 pace=.9 front=0 onset=.03 run=3 flow=.7 slump=.8 bury=.5 boom=.5 layerOrder=4 layer=.7 grit=.5 spread=30 grain=.12 width=0 volume=-4 | depth | sink | A dragging flint bass that gives way about once a second, two octaves in its hum
Goat track | Bass slope | grain=.7 bury=.25 boom=.15 onset=.006 run=.5 flow=.15 slump=.2 layerOrder=5 layer=.55 width=.2 volume=6 | reel | ground | A short round pluck with a nasal fifth harmonic, up in the hand
Slow ox | Bass slope | onset=.25 run=6 flow=.9 slump=1 bury=.55 boom=.9 lockstep=1 slope=.3 pace=.5 layer=.2 width=.1 front=.9 volume=-13.5 | weight | tenths | A heavy round bass that leans in late and swells every two seconds
Loose boards | Bass slope | grit=.6 lockstep=.7 spread=35 dry=.4 bury=.3 boom=.35 run=1.2 flow=.3 onset=.012 volume=1 | combo | walk | A rough bass half out of step that rasps and throws up loose sand
Knuckles on stone | Flint plucks | grain=.2 run=1.1 flow=.1 bury=.35 boom=.45 layerOrder=2 layer=.4 slump=.3 | cell | ground | Coarse flint struck hard, a knock and then a dark round body
Pick and shale | Flint plucks | grain=.5 run=1.6 flow=.2 bury=.2 boom=.25 grit=.45 dry=.35 slump=.4 layer=.3 layerOrder=5 spread=24 volume=4.5 | stub | walk | A picked flint bass with grit in its front and a bright edge
Iron gate dragging | Flint plucks | cluster=2 grain=.3 run=2.4 flow=.3 bury=.3 boom=.6 slump=.6 layerOrder=4 layer=.5 width=.3 spread=32 | iron | sink | Flint in octaves over a boom, a clanging bass that rings two seconds
Quarry cart | Flint plucks | grain=.35 onset=.04 run=5 flow=.6 bury=.5 boom=.5 grit=.55 slope=.4 pace=2.6 slump=.5 width=.1 front=.8 layerOrder=8 spread=28 | grit | sink | A long flint growl that trembles and grinds as it is held
Stone in a shoe | Flint plucks | grain=.65 run=.3 flow=0 bury=.1 boom=.2 slump=.15 layer=.15 dry=.1 lockstep=.97 width=.1 layerOrder=8 spread=20 volume=6 | slap 3.gain=5.5 | pulse | A very short clicking bass, all front
Mason with a string | Wet hollow | onset=.006 run=1.2 flow=.15 slump=.5 bury=.4 boom=.4 layerOrder=2 layer=.3 dry=.1 slope=0 lockstep=.95 width=.1 spread=8 grit=.4 volume=3.5 | board | walk | A hollow plucked bass, wooden and round, gone in a second
Frog in the drain | Wet hollow | onset=.01 run=.6 flow=.1 slump=.3 grain=.65 boom=.2 layerOrder=3 layer=.7 dry=.4 slope=0 volume=6 | wah | ground | A popping wet bass with a hollow twelfth at every note
Ferry engine | Wet hollow | onset=.1 run=8 flow=1 slump=.8 bury=.5 boom=.8 pace=5.5 slope=.5 front=0 layer=.3 dry=.1 width=.1 layerOrder=9 spread=0 volume=-3 | narrow | sink | A wet hollow bass chugging five times a second over a boom
Low tide tube | Wet hollow | onset=.05 run=4 flow=.6 slump=.8 cluster=1 grain=.35 boom=.3 layerOrder=5 layer=.8 bury=.2 width=.5 front=0 pace=.12 spread=32 grit=.4 volume=-1.5 | tube | tenths | A hollow bass with a strong fifth harmonic, like a long clay pipe
Peat and rope | Wet hollow | onset=.02 run=2 flow=.4 slump=.4 lockstep=.6 grit=.5 spread=25 dry=.6 boom=.35 bury=.3 layer=.2 width=.3 front=.8 pace=.55 layerOrder=9 volume=1 | worn | walk | A soft wet bass that bubbles and comes apart as it settles
Green glass below | Glass drift | cluster=1 onset=.008 run=1.5 flow=.2 slump=.4 lockstep=.97 grit=.05 spread=3 bury=.5 boom=.5 layer=.3 layerOrder=4 slope=0 width=.5 volume=5.5 | lowgate | walk | A struck glass bass, bell-like on top and round under it
Ice road | Glass drift | cluster=1 onset=.3 run=10 flow=1 slump=1 lockstep=.9 bury=.35 boom=.6 layer=.6 layerOrder=6 slope=.4 pace=.3 grain=.35 width=.5 front=.9 | descent | fifths | A slow cold bass of glass with a thin sixth harmonic over a deep boom
Jar on the cello | Glass drift | cluster=1 onset=.02 run=.8 flow=.3 slump=.3 lockstep=.85 spread=12 bury=.55 boom=.3 layer=.2 slope=0 grain=.3 width=.3 volume=3 | valve | ground | A muffled glass bass, quick and rounded, its double octave as strong as the note
Broken lens | Glass drift | cluster=1 onset=.015 run=3 flow=.5 slump=.6 lockstep=.5 spread=60 grit=.5 bury=.4 boom=.45 dry=.3 layer=0 pace=.7 | cassette | sink | A glass bass whose grains wander wide of the note and hiss
Lighthouse footing | Glass drift | cluster=3 onset=.05 run=6 flow=.8 slump=.7 lockstep=1 grit=0 bury=.65 boom=.8 layer=.3 slope=.2 pace=.25 | crypt 1.mix=.28 | tenths | Covered glass in three groups, a fifth glinting two octaves over a boom
Seal on the slipway | Squeaking keys | grain=.3 onset=.02 run=2 flow=.5 slump=.4 bury=.25 boom=.2 layer=.7 layerOrder=5 lockstep=.75 dry=.1 width=.2 grit=.45 spread=40 | bare | sink | A barking nasal moan that wavers round its note with a fifth harmonic in the throat
Rubber soles | Squeaking keys | grain=.2 onset=.006 run=.5 flow=.05 slump=.2 bury=.3 boom=.4 lockstep=.95 dry=.15 layer=.2 width=.2 layerOrder=9 | wall | pulse | Short low squeaks with a boom under each
Old hinge down low | Squeaking keys | grain=0 onset=.12 run=3 flow=.7 slump=.6 bury=.35 boom=.4 grit=.6 lockstep=.75 slope=.5 pace=3.4 layer=.5 layerOrder=4 front=0 spread=28 | cupboard | sink | A groaning creak that wobbles three times a second
Throat of the hull | Squeaking keys | grain=.15 cluster=2 onset=.2 run=6 flow=.9 slump=.8 bury=.4 boom=.6 layer=.6 layerOrder=3 slope=.35 pace=.4 width=.4 front=.1 grit=.45 | vowel | tenths | A low squeak drawn out into a throaty vowel, swelling slowly
Bowed saddle | Squeaking keys | grain=.12 onset=.35 run=10 flow=1 slump=.6 bury=.45 boom=.3 grit=.45 spread=18 layer=.3 layerOrder=1 slope=.15 front=.8 | strings 1.mix=.25 | walk | A leathery bowed bass with a rasp and a slow front
Ballast | Locked drone | onset=.3 slump=.8 cluster=1 boom=.9 bury=.6 layerOrder=1 layer=.5 slope=.1 grain=.2 | bare | fifths | Every grain locked on a low smooth tone, with the boom under it
Monastery floor | Locked drone | onset=1 slump=2 cluster=3 grain=.3 boom=.6 bury=.45 layer=.3 pace=.2 slope=.4 width=.4 | monks 1.mix=.28 | deep | Three locked groups, a low twelfth swelling slowly from the ground
Hum of the dam | Locked drone | onset=.5 slump=1.5 cluster=4 grain=.25 boom=.7 bury=.3 pace=1.6 slope=.5 front=.2 layerOrder=8 layer=.4 | undertow 1.mix=.22 | sink | Four groups hum two octaves up over a boom, throbbing and even
Elephant path | Locked drone | onset=.15 slump=.6 cluster=2 boom=.5 bury=.75 grit=.15 layer=.7 layerOrder=2 slope=.2 front=.9 pace=.35 | blanket | tenths | Dark locked octaves, almost all felt and little heard
Stones just touching | Locked drone | onset=.08 slump=.5 cluster=1 spread=45 lockstep=.8 boom=.4 bury=.4 grain=.35 layer=.4 layerOrder=3 slope=.1 volume=4 pulse=Wet dry=.3 | doubled | walk | A wide restless hollow bass that beats slowly around its note
Pump by the canal | Running pulse | pace=4 onset=.02 slump=.3 cluster=1 boom=.5 bury=.45 grain=.35 front=0 layer=.3 layerOrder=2 | soft | sink | A round bass that pumps four times a second while it is held
Paddle steamer | Running pulse | pulse=Wet pace=2.4 slope=1 onset=.03 slump=.5 cluster=1 boom=.6 bury=.3 grain=.3 front=0 layer=.2 width=.3 spread=32 volume=-3.5 | leafhall | sink | Wet slaps that come round twice a second with a boom in each
Belt and pulley | Running pulse | pulse=Flint pace=6.5 slope=.6 onset=.015 slump=.25 cluster=1 grain=.25 bury=.4 boom=.3 grit=.4 layer=.2 front=0 width=.4 spread=0 | grit | walk | A fast flint flutter, rough and dark, six to the second
Wing over the marsh | Running pulse | pulse=Round pace=3 slope=.8 onset=.1 slump=.8 cluster=2 grain=.25 bury=.5 boom=.7 layer=.2 layerOrder=1 width=.2 front=.8 volume=-1.5 | notch | tenths | Dark octaves beating three times a second over a boom, narrow and deep
Night train sleeper | Running pulse | pulse=Squeak pace=3.6 slope=.5 onset=.02 slump=.4 cluster=1 grain=.1 bury=.55 boom=.6 grit=.2 front=0 width=.4 spread=8 volume=-8.5 | pillow | sink | A muffled creak that rocks evenly over a low boom
Cliff fall | Aftershocks | pace=.6 onset=.02 boom=.7 bury=.3 grain=.2 dry=.6 slump=1.5 layer=.2 layerOrder=1 front=.2 width=.1 spread=0 volume=-6.5 | valley 1.mix=.22 | fifths | One deep shock at each low note and weaker ones after, with sand running
Furniture upstairs | Aftershocks | pace=2 slope=.5 onset=.03 boom=.5 bury=.6 run=2 flow=.3 slump=.5 grain=.3 dry=.15 width=.5 front=.9 layerOrder=5 spread=0 volume=-1 | nextdoor | walk | A covered bass that bumps and bumps again, less each time
Ledge gives way | Slips on the ridge | pace=1.2 onset=.02 boom=.5 bury=.4 grain=.25 slump=.6 cluster=1 front=0 layer=.3 spread=28 | forward 2.gain=3 | sink | A flint bass that breaks loose with a bright slip once a second
Rope through the block | Slips on the ridge | pulse=Round pace=3 slope=.5 onset=.02 run=3 flow=.6 boom=.4 bury=.35 grain=.3 slump=.4 layer=.5 front=0 width=.5 spread=24 grit=.4 volume=6 | comb | ground | A round bass with a quick slip three times a second like a rope running out
Thunder behind hills | Aftershocks | pulse=Wet pace=.4 slope=.9 onset=.06 boom=.9 bury=.7 grain=.1 dry=.3 slump=3 layer=0 width=.3 front=.3 spread=0 volume=2 | haze 1.mix=.4 | deep | Low wet shocks rolling off into rarer ones, all boom | texture
Pedal in the loft | Cluster organ | grain=.3 bury=.5 boom=.7 onset=.06 slump=.35 cluster=1 layer=.1 width=.2 spread=8 | stops | sink | An even organ pedal, round and locked, with a boom below
Reed box | Cluster organ | pulse=Flint cluster=3 grain=.15 bury=.25 boom=.1 onset=.04 grit=.5 slump=.2 layer=.6 layerOrder=6 width=.5 spread=45 lockstep=.8 | chamber | walk | A buzzing flint reed whose ranks pull against each other, a twelfth in its teeth
Bourdon by the stove | Cluster organ | pulse=Wet cluster=1 grain=.35 bury=.3 boom=.5 onset=.09 slump=.4 layer=.3 layerOrder=1 dry=.45 width=.3 spread=6 volume=-8 | hollowed | fifths | A stopped hollow pedal, only odd harmonics, with breath around it
Quint under the hill | Cluster organ | cluster=3 grain=.25 bury=.6 boom=.9 onset=.1 slump=.5 layer=.2 width=.4 layerOrder=1 volume=-8.5 | undertow 1.mix=.2 | tenths | Three groups under sand, a soft twelfth over a very full boom
Harmonium under ice | Cluster organ | pulse=Glassy cluster=1 grain=.25 bury=.4 boom=.2 onset=.4 slump=1.2 slope=.4 pace=1.1 width=.2 front=.9 layerOrder=6 spread=0 layer=.8 | booth | sink | A slow bass of glass whose sixth harmonic swells about once a second
Post in wet sand | Bass slope | pulse=Wet onset=.004 run=.16 flow=0 slump=.2 bury=.5 boom=.8 dry=.1 layer=0 slope=0 volume=-0.5 | cell 2.gain=9 | pulse | One low wet thump to a key, dead at once | drum
Boot on hollow ground | Bass slope | onset=.004 run=.3 flow=0 slump=.3 bury=.65 boom=1 layer=.6 layerOrder=1 lockstep=1 slope=0 volume=2 width=0 | skin | pulse | A round low drum, all boom, a third of a second long | drum
Slate on slate | Bass slope | pulse=Flint onset=.004 run=.2 flow=0 slump=.4 bury=.45 boom=.8 grain=.1 dry=.5 slope=0 cluster=1 width=.4 volume=-0.5 layer=0 | cell 2.gain=18 | pulse | A short crack of coarse flint with a spray of sand and a thump | drum
Coal down the chute | Bass slope | pulse=Round surge=Slips pace=2 slope=.6 onset=.004 run=.7 flow=.05 slump=.8 boom=.7 bury=.35 dry=.9 grain=.2 grit=.5 | strikes 2.gain=8 | pulse | A dull thump and a run of loose ticking sand after it | drum
Cairn | Bass slope | pulse=Glassy onset=.004 run=.9 flow=.3 slump=.6 bury=.25 boom=.5 grain=.4 slope=.7 layer=.5 layerOrder=4 width=.5 volume=-3.5 surge=Aftershocks pace=4 front=.3 dry=.3 | skin 2.gain=7 | pulse | A glass tom that clicks on for a moment like stones settling | drum
`,
    },
    {
      id: 'squeaking-keys',
      name: 'Squeaking keys',
      category: 'keys',
      rows: `
Tin whistle yard | Squeaking keys | grain=.7 run=.9 flow=.3 slump=.6 layer=.8 layerOrder=2 dry=.5 lockstep=.7 spread=30 bury=.3 | wall | steps | Breathy chirps that hang a moment, an octave whistling in them
Socks on parquet | Squeaking keys | grain=.25 run=.8 flow=.1 slump=.4 bury=.3 dry=.1 layer=.5 layerOrder=3 boom=.15 spread=0 grit=.18 | cell | answer | Low soft squeaks with a twelfth, like a floor under a sliding foot
Finger on wet glass | Squeaking keys | onset=.06 grain=.45 run=1.4 flow=.3 slump=.6 grit=.1 layer=.7 layerOrder=5 dry=.1 width=.5 | glasstail | twovoice | High squeaks rubbed on rather than struck, with a fifth harmonic in them
Door of the toy shop | Squeaking keys | grain=.4 cluster=1 run=.25 flow=0 slump=.2 grit=.5 dry=.5 bury=.3 width=.6 layerOrder=9 spread=6 volume=2.5 | forward 1.presence=0 2.gain=13 | answer | Tiny dry creaks, a quarter second each, with a puff of sand
Balloon animals | Squeaking keys | grain=.42 bury=.25 onset=.02 run=.7 flow=.2 slump=.25 lockstep=.6 grit=.7 spread=30 layer=.2 width=.4 layerOrder=6 volume=6 | glassy | answer | Rough rubbery squeaks that jump about the note
Chair by the piano | Squeaking keys | grain=.05 run=2.5 flow=.1 slump=.8 bury=.4 boom=.2 layer=.4 layerOrder=2 lockstep=.92 dry=.05 spread=6 grit=.08 volume=4.5 | warmth | twovoice | A soft nasal key with a low creak in it that dies over two seconds
Saddle soap | Squeaking keys | grain=.1 run=4 flow=.15 slump=1.2 bury=.55 boom=.3 layer=.3 layerOrder=1 spread=8 width=.4 grit=.22 | valve | broken | Muffled creaks over a boom, a mellow key with a slow decay
Rocking on the porch | Squeaking keys | grain=.15 run=3 flow=.5 slump=.6 slope=.5 pace=2.8 front=.3 bury=.3 boom=.1 layer=.35 width=.4 layerOrder=5 grit=.38 volume=6 | harmonic | answer | A creaking key that rocks nearly three times a second
Velvet ropes | Squeaking keys | grain=.2 onset=.03 run=5 flow=.3 slump=1 bury=.5 spread=26 lockstep=.8 layer=.6 layerOrder=4 width=.5 grit=.08 volume=5 | ensemble | twovoice | Covered squeaks that beat with themselves, two octaves ringing softly
Dressing room mirror | Squeaking keys | grain=.3 run=1.8 flow=.15 slump=1.5 bury=.2 width=1 layer=.8 layerOrder=6 dry=.45 boom=0 grit=.15 volume=6 | repeats | broken | A nasal key with a bright sixth harmonic and a short rustle after it
Cloth on the hammers | Dune pad | onset=.006 run=1.4 flow=.08 slump=.4 bury=.35 grain=.4 slope=0 dry=.1 layer=.3 lockstep=.95 boom=.2 layerOrder=5 spread=3 volume=6 | felt | twovoice | A soft round key, struck and left, with a little boom
Upright in the barn | Dune pad | onset=.004 run=2.2 flow=.05 slump=.3 grain=.6 bury=.15 slope=0 dry=.3 grit=.4 spread=20 layer=.2 layerOrder=4 volume=5.5 | worn | broken | Brighter round keys a little out of true, dusty in front
August practice room | Dune pad | onset=.01 run=3.5 flow=.1 slump=.6 grain=.3 bury=.2 cluster=2 slope=0 dry=.05 layer=.5 layerOrder=5 boom=.1 width=.85 spread=8 grit=.45 volume=6 | minute | answer | Round keys in octaves with a fifth harmonic held long
Lid half open | Dune pad | onset=.015 run=1.8 flow=.2 slump=2 bury=.5 slope=.3 pace=.6 dry=.2 layer=.7 layerOrder=2 boom=.4 width=.85 front=.1 spread=24 grit=.15 volume=4.5 | longplate | broken | A dark round key that stays on as a low hum and swells behind the next
Pianos back to back | Dune pad | onset=.004 run=1 flow=.12 slump=.5 grain=.5 spread=48 lockstep=.75 slope=0 bury=.1 layer=.35 width=1 boom=0 layerOrder=2 grit=.1 volume=4.5 | half | twovoice | A short round key beating wide of the note like two that do not agree
Bamboo floor | Wet hollow | onset=.004 run=.5 flow=0 slump=.4 lockstep=.96 slope=0 dry=.1 layer=.3 layerOrder=3 bury=.1 boom=.1 spread=20 grit=.1 volume=-1.5 | wall | steps | Dry hollow knocks with a twelfth over each, like struck bamboo
Gourd and water | Wet hollow | onset=.006 run=.9 flow=.05 slump=.6 grain=.6 slope=0 dry=.5 layer=.6 layerOrder=2 lockstep=.8 width=.25 spread=8 grit=.22 volume=4 | pot | answer | Hollow keys that pop and gurgle under a round octave
Coconut halves | Wet hollow | onset=.004 run=.1 flow=0 slump=.2 grain=.75 slope=0 layer=.2 dry=.2 bury=.05 cluster=2 lockstep=.95 width=.5 layerOrder=2 spread=8 grit=.45 volume=-5.5 | cell 2.gain=16.5 | steps | Small hollow clicks in octaves, gone as soon as they come
Drowned celeste | Wet hollow | onset=.008 run=2.4 flow=.1 slump=1.5 grain=.3 slope=.3 pace=1.6 layer=.8 layerOrder=8 bury=.1 dry=.1 width=.85 front=.3 spread=20 volume=4.5 | sunk | broken | Dull hollow keys with a small high whistle in each
Clay stairs | Wet hollow | onset=.02 run=1.4 flow=.3 slump=.5 grain=.45 slope=0 cluster=3 bury=.35 boom=.25 layer=.15 dry=.15 layerOrder=9 spread=28 volume=2.5 | stairwell | twovoice | Round hollow keys in three groups with a low boom
Teaspoon code | Glass beach bells | run=.7 flow=.05 slump=.3 grain=.3 layer=0 bury=.2 dry=.05 cluster=1 boom=.1 width=.85 | wall | steps | Short glass keys, the note plain and a small tick over it
Top deck of the last bus | Glass beach bells | run=2 flow=.15 slump=.6 grain=.15 bury=.35 boom=.25 layer=.4 layerOrder=2 spread=14 lockstep=.9 | chorale | twovoice | Mellow glass tines, nearly all their own note, turning slowly
Jug full of splinters | Glass beach bells | onset=.008 run=1.2 flow=.1 slump=1 grain=.6 dry=.4 grit=.4 lockstep=.75 layer=.6 layerOrder=6 width=.25 volume=6 | brightplate | answer | Clinking glass keys with loose sharp sand about them
Fluorescent kitchen | Glass beach bells | cluster=2 onset=.02 run=4 flow=.4 slump=.4 slope=.4 pace=5 front=0 layer=.2 grain=.3 bury=.15 width=.4 | kettle | answer | Glass two octaves up with an even tremble five times a second
Lens cloth | Glass beach bells | onset=.04 run=3 flow=.2 slump=.8 grain=.2 bury=.55 layer=.7 layerOrder=5 spread=22 boom=.15 width=.5 volume=6 | pane | twovoice | Veiled glass keys, slow in front, a double octave behind the note
Chalk rhythm | Flint plucks | grain=.45 run=.45 flow=.1 slump=.2 bury=.3 layer=.6 layerOrder=6 grit=.5 dry=.3 spread=6 lockstep=.8 volume=1 | wall 1.gain=13 | answer | Tight bright flint keys with a chalky scrape in them
Stone harpsichord | Flint plucks | grain=.5 run=2.5 flow=.05 slump=.15 bury=.1 layer=.2 cluster=2 grit=.06 width=.85 layerOrder=2 spread=20 volume=5.5 | gated | twovoice | Plucked flint in octaves that rings on and stops with the key
Slate and stylus | Flint plucks | grain=.2 onset=.012 run=1.5 flow=.3 slump=.4 bury=.35 boom=.25 layer=.6 layerOrder=4 spread=6 volume=6 | reel | answer | Rounded flint keys with two octaves in their middle
Matchbox organ | Flint plucks | grain=.3 onset=.03 run=8 flow=.8 slump=.25 bury=.3 grit=.4 layer=.3 slope=.25 pace=4 front=0 layerOrder=8 | combo | answer | A small buzzing reed of flint that shakes a little as it is held
Penknife | Flint plucks | grain=.32 run=.35 flow=0 slump=.2 cluster=3 bury=.3 layer=.5 layerOrder=3 dry=.3 width=.6 spread=6 volume=6 | drip 3.gain=3.5 | steps | Thin hard clicks in three groups, high and quick
Mice behind the skirting | Squeaking keys | cluster=2 grain=.12 run=.6 flow=.08 slump=.3 dry=.1 layer=.15 bury=.35 width=.6 layerOrder=8 grit=.38 volume=6 | stub 2.gain=6.5 | answer | Tiny squeaks well above the key, light and quick
Swing in the park | Squeaking keys | cluster=3 grain=.2 onset=.03 run=1.6 flow=.3 slump=.7 slope=.5 pace=1.4 bury=.2 layer=.3 front=.1 layerOrder=6 volume=6 | panned | answer | Three groups creaking to and fro, a fifth two octaves up on top
Oboe made of leather | Squeaking keys | grain=.3 onset=.07 run=10 flow=.9 slump=.3 lockstep=.96 grit=.1 bury=.15 slope=.2 pace=4.8 front=0 layer=.2 boom=.1 width=.35 layerOrder=5 spread=3 | sung | duet | A held nasal reed with a faint quick waver | wind
Cork and bottle | Squeaking keys | cluster=2 grain=.15 onset=.01 run=.5 flow=.15 slump=.5 bury=.35 boom=.35 dry=.3 layer=.6 layerOrder=1 width=.6 spread=6 grit=.22 volume=6 | bottle 3.gain=3.5 | answer | Low squeaks with the ground note rung and a pop of sand
Fiddle for a doll | Squeaking keys | cluster=4 grain=.18 onset=.12 run=6 flow=.7 slump=.5 grit=.45 bury=.5 layer=.25 width=.5 layerOrder=8 spread=28 | board | twovoice | Four groups two octaves up, scratchy and bowed, very small | string
Rope in the yard | Squeaking keys | surge=Slips slope=.5 pace=3 run=3 flow=.5 slump=.4 grain=.3 front=.5 bury=.2 dry=.2 width=.85 layerOrder=6 volume=6 | heads | answer | A squeak and then quick slips of it, three a second while the key is down
Marbles down the hall | Squeaking keys | pulse=Glassy surge=Aftershocks slope=.6 pace=1.6 run=4 flow=.6 slump=.8 grain=.4 front=.9 onset=.005 width=1 layerOrder=5 spread=3 grit=.45 | cell 2.gain=3 | broken | A glass key that bounces, each bounce weaker and later
Typing upstairs | Squeaking keys | pulse=Flint surge=Aftershocks slope=.8 pace=3 run=2 flow=.3 slump=.3 grain=.3 bury=.3 dry=.1 width=.4 front=.2 layerOrder=2 spread=32 grit=.38 volume=-1.5 | blunt | answer | Flint keys that stutter fast and then thin out
Cat on the keys | Squeaking keys | pulse=Wet surge=Slips slope=.7 pace=2 run=2.5 flow=.4 slump=.5 grain=.5 front=1 dry=.4 layerOrder=8 grit=.1 | moons | spread | Wet pops that slip from the low key to the high one twice a second
Loose shutter | Squeaking keys | pulse=Round surge=Aftershocks slope=.5 pace=.9 run=5 flow=.6 slump=1.2 grain=.5 boom=.4 bury=.25 layer=.6 layerOrder=4 width=1 spread=0 grit=.12 | darkecho | answer | A round key, a deep knock with it and a few softer ones behind
Harmonica in a coat | Squeaking keys | grain=.2 onset=.05 run=20 flow=1 slump=.2 cluster=2 bury=.3 grit=.25 slope=.25 pace=3.2 front=.4 layerOrder=8 spread=32 | cupboard | spread | Held squeaks high over the key, covered, with a soft beat across the chord | organ
Dry pump organ | Squeaking keys | pulse=Flint grain=.3 onset=.09 run=20 flow=1 slump=.25 lockstep=.6 grit=.5 dry=.5 bury=.35 layer=.2 layerOrder=2 spread=32 volume=-3 | room | chorale | A wheezing reed of flint with a lot of air in it | organ
Ghost of a melodica | Squeaking keys | grain=.35 onset=.15 run=8 flow=.7 slump=1 lockstep=.5 spread=35 bury=.3 layer=.9 layerOrder=2 dry=.3 | haze | duet | A thin nasal tone half dissolved, its octave ringing through | wind
Kazoo behind glass | Squeaking keys | pulse=Round grain=.75 onset=.03 run=20 flow=1 slump=.2 grit=.7 lockstep=.75 bury=.4 slope=.15 pace=6 layer=.3 width=0 front=.8 layerOrder=7 spread=8 | pane | duet | A fine round buzz with a rasp on it, muffled | wind
Choirboy on a ladder | Squeaking keys | grain=.45 onset=.2 run=8 flow=.8 slump=1.5 lockstep=.9 bury=.3 layer=.6 layerOrder=3 slope=.3 pace=.5 boom=.1 width=.4 | ah | duet | A drawn out squeak, rounded off, that swells every two seconds | voice
Keys under snow | Dune pad | onset=.01 run=1.6 flow=.1 slump=1.2 lockstep=.3 spread=50 grain=.5 slope=0 bury=.4 layer=.8 layerOrder=3 dry=.3 grit=.18 volume=5.5 | blanket | broken | Soft keys of loose sand that leave only their twelfth behind
Rust on the pedal | Dune pad | pulse=Flint onset=.005 run=1 flow=.15 slump=.6 lockstep=.5 grit=.8 grain=.35 slope=0 bury=.25 dry=.5 boom=.2 width=.25 layerOrder=6 spread=32 volume=6 | early | answer | Coarse grinding keys, all edge at first and then grit
Moth box | Dune pad | pulse=Wet onset=.01 run=.8 flow=.2 slump=.8 lockstep=.4 grain=.8 slope=0 dry=.8 layer=.5 layerOrder=6 bury=.05 spread=20 volume=6 | tones 3.gain=3.5 | steps | Fluttering wet keys with more patter than note
Ink on blotting paper | Dune pad | pulse=Round onset=.03 run=1.2 flow=.25 slump=3 lockstep=.65 grit=.3 spread=28 grain=.35 slope=.2 pace=.8 bury=.3 dry=.4 width=.4 layerOrder=4 volume=0.5 | mist | twovoice | A soft key that spreads into hiss as it is let go and takes long to stop
Radio left on low | Dune pad | pulse=Squeak onset=.02 run=2.5 flow=.35 slump=.6 lockstep=.45 grit=.6 grain=.2 slope=0 bury=.3 dry=.7 layer=.3 width=.25 layerOrder=9 spread=0 | pillow | answer | Nasal half noisy keys with sand like static over them
`,
    },
    {
      id: 'glass-beach-bells',
      name: 'Glass beach bells',
      category: 'bell',
      rows: `
Tide pool at noon | Glass beach bells | run=2.6 grain=.2 layer=.4 layerOrder=1 dry=.35 slump=3 bury=0 width=1 volume=6 grit=.4 lockstep=.7 spread=45 | brightplate 3.gain=3.5 | knell | Loose glass that shivers round its own note as it falls, a hiss in each strike
Harbour glass | Glass beach bells | run=5 grain=.2 layer=.3 layerOrder=2 dry=.05 bury=.2 boom=.2 slump=4 | pedal | lowbell | Rounded glass bells, mostly their own note, with a long even fall
Bead curtain | Glass beach bells | run=.9 grain=.6 layer=.9 layerOrder=7 dry=.3 slump=1 width=1 volume=6 | panned 3.gain=11.5 | changes | Quick bright glass with a high seventh harmonic and a little sand
Chandelier in the dark | Glass beach bells | run=8 grain=.45 layer=.6 layerOrder=9 spread=20 lockstep=.8 slump=5 bury=.1 width=.4 volume=6 | longplate 1.mix=.28 | highones | Long glass bells that waver, a whistle in the ninth harmonic
Lemonade stand | Glass beach bells | run=1.2 grain=.5 layer=.15 cluster=2 dry=.1 slump=.8 bury=.1 boom=.1 volume=6 | stub 2.gain=11 | peals | Short bright glass two octaves over the key, struck clean
Buoy off the bar | Glass beach bells | run=4 grain=.15 bury=.4 boom=.6 layer=.7 layerOrder=3 slope=.4 pace=.6 slump=4 width=.4 front=.4 | surf | lowbell | A dark bell with a boom under it that a slow wave sways
Drowned steeple | Glass beach bells | run=6 grain=.1 bury=.55 boom=.5 cluster=3 layer=.3 slump=6 spread=16 lockstep=.85 | sunk | lowbell | Deep covered bells in three groups, a double octave ringing softly
Gate of the shrine | Glass beach bells | pulse=Round run=7 grain=.5 cluster=3 boom=.7 layer=.8 layerOrder=5 slump=6 bury=.1 spread=10 width=1 | cave 1.mix=.3 | lowbell | A round gong in three groups over a full boom, its fifth harmonic singing
Anchor chain | Glass beach bells | pulse=Flint run=3.5 grain=.2 boom=.4 bury=.3 layer=.6 layerOrder=4 grit=.4 slump=3 volume=5.5 | shaft | lowbell | A rough low bell of coarse flint with a boom and a scrape on it
Village across water | Glass beach bells | run=3 grain=.25 bury=.5 boom=.35 cluster=2 layer=.4 layerOrder=6 slump=5 width=.4 volume=6 | shore | lowbell | Muffled bells rung low, their voice two octaves over the key
Temple block in rain | Glass beach bells | pulse=Wet run=.5 slump=.6 layer=.5 layerOrder=2 grain=.4 dry=.2 bury=.1 width=.6 volume=6 | patter 3.gain=4 | changes | Hollow knocks with an octave, half a second each
Log on the riverbed | Glass beach bells | pulse=Wet run=1 slump=1 layer=.3 layerOrder=1 grain=.25 boom=.4 bury=.3 cluster=1 width=1 | board | lowbell | A deep hollow knock with a short round body
Water drums far off | Glass beach bells | pulse=Wet run=1.6 slump=2 layer=.8 layerOrder=5 grain=.6 dry=.4 grit=.3 volume=5.5 | leaves | tolls | Gurgling bells with a fifth harmonic and a splash of wet sand
Cup under the tap | Glass beach bells | pulse=Wet run=2.6 slump=1.4 cluster=2 layer=.7 layerOrder=8 grain=.45 slope=.35 pace=2.2 width=.5 | bathtub | changes | Hollow bells with a twelfth in them that wobble twice a second
Snail shells on string | Glass beach bells | pulse=Wet run=2.2 slump=2 cluster=5 layer=.3 grain=.3 bury=.2 dry=.1 width=1 volume=6 layerOrder=5 lockstep=.92 | stone | peals | Hollow bells in five groups, a high third over each
Anvil in the orchard | Glass beach bells | pulse=Flint run=1.4 slump=1 grain=.4 layer=.5 layerOrder=5 grit=.1 bury=.2 volume=3.5 boom=.3 spread=24 | cell 2.gain=10.5 | knell | Bright struck flint with a metal fifth harmonic
Rails under frost | Glass beach bells | pulse=Flint run=4 slump=3 grain=.3 cluster=2 layer=.4 layerOrder=7 bury=.55 spread=18 width=.5 volume=6 | darkhall | knell | Flint in octaves that rings long with a seventh harmonic on top
Tack hammer | Glass beach bells | pulse=Flint run=.5 slump=.5 grain=.18 cluster=3 layer=.3 bury=.35 dry=.25 width=.4 | forward 2.gain=10 | peals | Tiny hard bells in three groups, quick and dry
Scythe on whetstone | Glass beach bells | pulse=Flint run=2 slump=2 onset=.03 grain=.3 grit=.6 lockstep=.8 dry=.5 layer=.4 layerOrder=8 bury=.4 width=.6 volume=0.5 | ringed 3.gain=7 | knell | Scraped flint with a hiss and a thin eighth harmonic
Cowbells over the pass | Glass beach bells | pulse=Flint run=2.4 slump=2 grain=.15 bury=.45 boom=.2 layer=.9 layerOrder=3 width=.5 volume=6 | backrow 3.gain=6.5 | knell | Dull flint bells, all twelfth and no edge
Singing bowl of sand | Glass beach bells | pulse=Round onset=.03 run=9 slump=6 grain=.35 layer=.95 layerOrder=4 spread=12 lockstep=.9 width=.6 | bare | lowbell | A round bowl struck softly, two octaves singing over it for a long time
Copper and felt | Glass beach bells | pulse=Round run=3 slump=3 grain=.55 layer=.6 layerOrder=6 bury=.2 boom=.25 volume=6 onset=.03 spread=20 grit=.2 | lowbowls 3.gain=3 | tolls | Round bells with a sixth harmonic and a soft front
Drips in a stone basin | Glass beach bells | pulse=Round run=1.5 slump=2 grain=.4 layer=.9 layerOrder=8 slope=.3 pace=3.4 bury=.05 dry=0 width=.6 front=.9 volume=6 | light 3.gain=5 | changes | Smooth round bells with a thin whistle that flutters
Moon gong | Glass beach bells | pulse=Round onset=.12 run=12 slump=8 grain=.3 cluster=5 boom=.5 layer=.4 layerOrder=5 bury=.2 slope=.35 pace=.3 width=.4 | nave 1.mix=.28 | lowbell | Five groups raise a high third over a gong that sways after it is struck
Clock in the pantry | Glass beach bells | pulse=Round run=1 slump=.8 grain=.6 cluster=4 layer=.2 bury=.15 boom=.3 width=1 volume=6 | stub 2.gain=9 | tolls | A short round chime in four groups, two octaves up
Bottles on the sill | Glass beach bells | cluster=6 run=2 slump=2 grain=.2 bury=.15 layer=.2 boom=.2 width=.6 volume=6 | chime | peals | Glass in six groups, a high fifth over each bell
Ladder of ice | Glass beach bells | cluster=4 run=4 slump=3 grain=.15 spread=14 lockstep=.9 layer=.4 layerOrder=8 bury=.1 width=.6 volume=6 | glasstail | knell | Glass in four groups, clear and high with a long fall
Star over the well | Glass beach bells | cluster=3 run=3 slump=5 grain=.3 bury=.3 layer=.7 layerOrder=3 boom=.35 dry=.05 volume=6 | halo | highones | Three groups of glass, round below and bright two octaves up
Icicles under the eave | Glass beach bells | cluster=5 run=.8 slump=.8 grain=.3 bury=0 layer=.1 dry=.2 width=1 volume=6 | hops 3.gain=10 | peals | Short glass in five groups, sharp and glittering two octaves up
Frozen carillon | Glass beach bells | cluster=2 run=6 slump=6 grain=.4 layer=.5 layerOrder=5 spread=30 lockstep=.75 grit=.2 bury=.35 volume=6 | cathedral | lowbell | Long glass bells two octaves up, beating where the grains will not settle
Bounced off the jetty | Glass beach bells | surge=Aftershocks slope=.6 pace=1.4 flow=.4 run=3 grain=.35 slump=2 front=.5 width=.6 | decks | tolls | A glass bell that strikes itself again, fainter each time
Coins on the counter | Glass beach bells | surge=Aftershocks slope=.8 pace=4 flow=.2 run=1.6 grain=.7 slump=.8 layer=.7 layerOrder=6 bury=0 width=1 | wall | changes | Fine glass that rattles to rest in a quick run of small strikes
Signal bell in fog | Glass beach bells | surge=Slips slope=.6 pace=2 flow=.6 run=4 grain=.2 slump=3 bury=.35 boom=.3 front=.3 width=.6 | haze | lowbell | A dark bell struck twice a second for as long as the key is down
Wind at the windowsill | Glass beach bells | surge=Slips slope=.5 pace=3.2 flow=.5 run=6 grain=.45 slump=4 front=1 cluster=2 layer=.3 width=.4 | flock | spread | Glass two octaves over the chord, slips running along it three times a second
Ticks after the bell | Glass beach bells | pulse=Flint surge=Aftershocks slope=.5 pace=2.4 flow=.5 run=2 grain=.45 slump=1.5 dry=.6 layer=.8 layerOrder=4 width=.4 front=.9 volume=-2 | spring | tolls | Flint bells followed by thinning ticks and knocks
Finger round the rim | Glass beach bells | onset=.6 run=10 flow=.7 slump=3 grain=.25 layer=.7 layerOrder=2 spread=10 slope=.2 pace=.7 width=.5 volume=-3 | sines | veil | Glass rubbed into sound rather than struck, one clear note | pad
Slow frost | Glass beach bells | onset=1.2 run=12 flow=.5 slump=6 grain=.4 cluster=3 bury=.3 layer=.3 layerOrder=9 width=1 | winter | entries | Three groups of glass that grow slowly into a high clear chord | pad
Cymbal bowed on a porch | Glass beach bells | pulse=Flint onset=.5 run=6 flow=.5 slump=4 grain=.35 grit=.5 lockstep=.75 spread=30 layer=.6 layerOrder=7 bury=.45 volume=6 | farhorn | duet | Bowed flint, rough and wide, with a seventh harmonic coming through | string
Breath on crystal | Glass beach bells | onset=.35 run=5 flow=.2 slump=4 grain=.4 bury=.2 dry=.6 lockstep=.7 spread=18 layer=.9 layerOrder=5 width=.4 | thinair 1.mix=.26 | tolls | Glass that begins as a hiss and clears into a fifth harmonic
Halo of the lamp | Glass beach bells | pulse=Round onset=.9 run=8 flow=.4 slump=5 grain=.6 cluster=4 layer=.3 slope=.3 pace=.4 bury=.15 width=.6 front=1 | choir | entries | A round glow two octaves up that comes in late and sways | pad
Lopsided music box | Glass beach bells | pulse=Round run=.7 slump=.5 grain=.75 bury=.36 layer=.7 layerOrder=5 dry=0 width=.5 volume=6 | parlour 3.gain=6.5 | peals | Small plucked bells with a fifth harmonic
Tongs and saucer | Glass beach bells | run=.45 slump=.4 grain=.25 layer=.6 layerOrder=4 dry=0 bury=.1 boom=0 width=.5 volume=6 | booth 2.gain=8 | changes | Very short glass, two octaves ringing in it
Doll house doorbell | Glass beach bells | pulse=Squeak run=1 slump=.7 grain=.35 cluster=2 layer=.5 layerOrder=2 bury=.36 dry=0 width=.6 volume=6 | stub 2.gain=4 | tolls | A small nasal chime in octaves
Thimble choir | Glass beach bells | run=1.3 slump=1.2 grain=.3 cluster=4 layer=.2 bury=.3 boom=.15 dry=.05 volume=6 | bed 3.gain=11.5 | peals | Rounded little bells in four groups, two octaves up
Watch just wound | Glass beach bells | pulse=Flint run=.3 slump=.3 grain=.5 cluster=2 layer=.5 layerOrder=6 bury=.45 dry=.1 width=.5 volume=6 | memory 3.gain=13 | lowbell | Ticking flint bells with a sixth harmonic
Wind chimes at four | Glass beach bells | run=2.2 slump=3 grain=.55 spread=60 lockstep=.5 grit=.3 dry=.5 width=1 layer=.4 layerOrder=3 volume=6 | breeze | changes | Loose glass tubes that will not agree on their note, with dry sand between
Hail on cold frames | Glass beach bells | run=1 slump=2 grain=.55 bury=.25 spread=35 lockstep=.35 grit=.6 dry=.9 layer=.6 layerOrder=6 volume=6 | cell 2.gain=12 | changes | Glass hits in a rattle of loose grains, a thin overtone left over
Shells in a pocket | Glass beach bells | pulse=Wet run=1.2 slump=1.5 grain=.5 spread=50 lockstep=.45 grit=.4 dry=.7 layer=.3 bury=.15 volume=4.5 | shell | changes | Hollow clattering bells, more rattle than tone
Broken barometer | Glass beach bells | run=3.5 slump=3 grain=.3 spread=85 lockstep=.65 grit=.1 cluster=2 layer=.5 layerOrder=5 bury=.1 volume=6 | still 3.gain=4 | tolls | Glass two octaves up with grains that slide slowly wide of the note
Last light on tin | Glass beach bells | pulse=Round run=4 slump=4 grain=.4 spread=40 lockstep=.55 dry=.4 layer=1 layerOrder=7 bury=.2 width=1 volume=6 | glints 3.gain=5.5 | highones | A dull round strike out of which a thin seventh harmonic goes on singing
`,
    },
    {
      id: 'dissolving-voices',
      name: 'Dissolving voices',
      category: 'voice',
      rows: `
Choir of the dry lake | Dissolving voices | cluster=1 lockstep=.55 layer=.8 layerOrder=3 onset=.7 grain=.4 slope=.4 pace=.3 bury=.15 width=.85 front=1 run=1.2 | ah | tied | Half gathered grains with a ringing twelfth, a choir that never quite closes
Breath before the hymn | Dissolving voices | cluster=1 lockstep=.3 dry=.7 onset=1.2 layer=.9 layerOrder=4 pace=.25 slope=.9 grain=.45 width=.85 front=.2 run=3 | melting | entries | More breath than tone, two octaves singing out of it as each wave passes
Shoulder to shoulder | Dissolving voices | cluster=1 lockstep=.7 layer=.5 layerOrder=2 onset=.35 spread=45 slope=.2 bury=.25 boom=.2 grain=.35 slump=2 front=.4 pace=.18 run=9 volume=-2 width=.5 | room | chain | A close choir, wide of the note and warm, with its octave
Names said at once | Dissolving voices | cluster=1 lockstep=.45 grit=.75 grain=.5 layer=.7 layerOrder=5 onset=.5 spread=60 slope=.5 pace=.8 front=1 width=.3 run=1.2 | stacked | sway | Rough voices all a little apart, a fifth harmonic wandering among them
Evensong next door | Dissolving voices | cluster=1 lockstep=.65 bury=.6 boom=.3 layer=.4 layerOrder=3 onset=1 pace=.2 grain=.4 slump=6 width=.3 front=0 run=9 | nextdoor | veil | Covered voices that open a little when the wave comes
Boy at the window | Dissolving voices | cluster=1 lockstep=.93 grit=.1 spread=12 onset=.15 layer=.6 layerOrder=4 slope=.2 pace=.6 grain=.5 bury=.15 slump=1 run=2 volume=-0.5 | sung | duet | A single clear voice, two octaves ringing above it
Hoarse cantor | Dissolving voices | cluster=1 lockstep=.75 grit=.8 onset=.12 layer=.7 layerOrder=3 grain=.4 spread=20 slope=.3 pace=1.2 bury=.2 slump=.8 width=.9 front=.4 run=9 volume=-0.5 | longtrail | chant | A grainy solo voice with a rasp on every note and a twelfth in its throat
Wordless lullaby | Dissolving voices | cluster=1 lockstep=.88 onset=.4 layer=.3 layerOrder=2 grain=.3 slope=.35 pace=.5 bury=.35 spread=10 boom=.15 slump=2 width=.3 front=.3 | warmth | duet | A soft humming voice, rounded and near, that swells every two seconds
Woman at the well | Dissolving voices | cluster=2 lockstep=.85 onset=.25 layer=.5 layerOrder=3 grain=.3 spread=24 slope=.4 pace=.4 bury=.2 slump=3 front=.4 volume=1.5 | backwards | chant | One voice and its octave that loosens between the waves
Call across the wadi | Dissolving voices | cluster=1 lockstep=.9 onset=.06 run=1.5 flow=.3 layer=.8 layerOrder=5 grain=.6 slope=.15 bury=.1 slump=4 width=.55 front=.8 pace=.7 volume=2.5 | farechoes | answer | A short call that opens at once and leaves its fifth harmonic behind
Hollow nuns | Dissolving voices | pulse=Wet cluster=1 lockstep=.7 onset=.8 layer=.5 layerOrder=3 grain=.4 slope=.3 pace=.3 spread=20 width=.3 front=.4 | oo | veil | Hollow odd voices, round and closed, gently swelling
Underwater aria | Dissolving voices | pulse=Wet cluster=1 lockstep=.8 onset=.3 layer=.9 layerOrder=7 grain=.5 slope=.5 pace=.7 spread=14 front=.3 run=1.2 volume=-1 | sunk | duet | A wet hollow solo with a thin seventh harmonic
Throat and pebble | Dissolving voices | pulse=Wet cluster=1 lockstep=.5 grit=.6 dry=.6 onset=.2 layer=.4 layerOrder=1 boom=.4 grain=.5 slope=.4 pace=1 front=.2 run=14 volume=-0.5 | booth | chant | A gargling low voice with wet pops in it
Owl congregation | Dissolving voices | pulse=Wet cluster=2 lockstep=.9 onset=.18 run=1.4 flow=.4 layer=.3 grain=.3 slope=.2 bury=.3 boom=.2 slump=1.2 width=.85 front=.2 pace=.9 volume=0.5 | evaporate | answer | Short hollow hoots with a twelfth that sink back as they are held
Two in a doorway | Dissolving voices | pulse=Wet cluster=1 lockstep=.6 onset=.5 layer=.7 layerOrder=5 grain=.35 spread=70 slope=.25 width=1 bury=.2 front=.2 pace=.7 volume=1 | deepsea | duet | Hollow voices that beat far off the note, left against right
Nasal saints | Dissolving voices | pulse=Squeak cluster=1 lockstep=.75 grain=.25 onset=.5 layer=.4 layerOrder=2 slope=.35 pace=.35 bury=.3 spread=22 width=.55 front=.1 run=9 | padfifth | chain | Thin nasal voices close together, a double octave on top
Market criers | Dissolving voices | pulse=Squeak cluster=1 lockstep=.8 grain=.4 onset=.05 run=2 flow=.5 grit=.5 slope=.6 pace=1.6 layer=.3 bury=.15 slump=.8 volume=3.5 | valley 1.mix=.2 | answer | Bright hard voices that start at once and break as they hold
Marionettes sing | Dissolving voices | pulse=Squeak cluster=2 lockstep=.9 grain=.45 onset=.1 layer=.2 slope=.3 pace=5 front=0 bury=.25 slump=.5 spread=10 run=6 volume=3 | parlour | duet | Small shrill voices high over the key with a fast shake
Grandmother's consonants | Dissolving voices | pulse=Squeak cluster=1 lockstep=.4 grain=.15 dry=.6 onset=.3 layer=.8 layerOrder=4 bury=.35 spread=40 pace=.5 width=.85 run=9 volume=0.5 | whispers | chant | A low creaking voice, half whisper, two octaves standing in it
Sopranos share a scarf | Dissolving voices | pulse=Squeak cluster=3 lockstep=.85 grain=.2 onset=.3 layer=.5 layerOrder=3 spread=16 slope=.25 pace=.6 bury=.25 run=9 volume=5.5 | ensemble | duet | Three groups with a nasal twelfth over each note
Back row of the loft | Dissolving voices | cluster=3 lockstep=.6 layer=.4 layerOrder=6 onset=.9 grain=.35 spread=28 slope=.5 pace=.22 bury=.2 width=.4 run=1.2 | cathedral | tied | Three loose groups, twelfths over the chord, gathering slowly
Angels on scaffolding | Dissolving voices | cluster=5 lockstep=.75 grain=.2 onset=1.1 layer=.2 spread=18 slope=.3 pace=.35 bury=.25 boom=.2 width=.3 front=.2 run=1.2 volume=-1.5 | choir | veil | Five groups, a soft high third over every voice
Descant in dust | Dissolving voices | cluster=4 lockstep=.5 grain=.25 onset=.5 dry=.6 layer=.3 layerOrder=4 slope=.4 pace=.4 bury=.3 width=.9 run=14 volume=-1.5 | tail | chant | Two octaves above the note in a drift of sand
Crowd at the lectern | Dissolving voices | cluster=6 lockstep=.8 grain=.15 onset=.35 layer=.3 bury=.35 boom=.4 spread=12 slope=.25 slump=2 width=.55 front=.3 pace=.7 run=14 volume=-0.5 | chamber | duet | Six groups over a boom, the fifth two octaves up like a reed
Girls on facing stairs | Dissolving voices | cluster=2 lockstep=.65 grain=.5 onset=.6 layer=.7 layerOrder=5 spread=35 slope=.6 pace=.3 front=1 width=1 run=2 volume=1.5 | light | tied | Octaves that loosen and lock again from one side to the other
Nothing but air | Dissolving voices | cluster=1 lockstep=.1 dry=.9 grain=.55 onset=.6 layer=.95 layerOrder=3 spread=60 slope=.3 bury=.15 front=0 pace=.7 run=6 volume=2 | shell | longone | A hiss with a twelfth faintly blown into it
Wind says your name | Dissolving voices | cluster=1 lockstep=.25 dry=.6 grain=.6 onset=.4 layer=1 layerOrder=5 slope=.8 pace=.6 front=1 run=3 volume=0.5 | vowel | chant | Blown sand that sings its fifth harmonic as each gust comes
Rumour | Dissolving voices | cluster=2 lockstep=.2 grit=.9 dry=.5 grain=.4 onset=.2 layer=.6 layerOrder=2 slope=.7 pace=2.2 spread=50 width=.55 front=.9 run=1.2 volume=-2.5 | panned | spread | Quick rough murmurs in octaves, twice a second
Confession at the ear | Dissolving voices | pulse=Squeak cluster=1 lockstep=.3 dry=.8 grain=.3 onset=.12 run=1.2 flow=.3 layer=.7 layerOrder=3 bury=.3 width=0 slump=.6 front=0 pace=.12 | narrow | chant | A close whisper with hardly a voice behind it
Sleepers on the train | Dissolving voices | cluster=1 lockstep=.35 dry=.5 bury=.55 onset=1.4 layer=.5 layerOrder=1 slope=.8 pace=.28 boom=.4 slump=5 run=2 volume=0 | lungs | open | Deep slow breaths with a low hum inside
Basses at the back | Dissolving voices | cluster=1 lockstep=.8 bury=.5 boom=.7 grain=.35 onset=.4 layer=.6 layerOrder=2 slope=.25 pace=.4 spread=14 width=.55 front=.2 | monks | chant | Dark low voices with a boom an octave under
Stone monks | Dissolving voices | pulse=Flint cluster=1 lockstep=.7 grain=.2 grit=.5 bury=.45 boom=.5 onset=.5 layer=.7 layerOrder=5 slope=.3 width=.3 front=.3 pace=.9 volume=-2 | crypt | fifths | Grinding low throats with a fifth harmonic held above
Psalm for one floor | Dissolving voices | cluster=1 lockstep=.95 bury=.65 boom=1 grain=.3 onset=.8 layer=.4 layerOrder=3 slope=.2 spread=6 slump=4 width=.55 front=.4 pace=.12 run=2 | undertow | sway | Locked covered voices on a very full boom
Overtone shepherd | Dissolving voices | cluster=1 lockstep=.85 grain=.45 grit=.35 onset=.2 layer=1 layerOrder=9 boom=.4 bury=.15 slope=.5 pace=.8 spread=8 front=.1 run=2 volume=2.5 | openkeys | longone | A rough low throat and one whistle on its ninth harmonic
Crypt on a weekday | Dissolving voices | cluster=2 lockstep=.6 bury=.5 boom=.4 onset=1.2 layer=.3 layerOrder=4 grain=.3 slope=.6 pace=.2 spread=30 slump=7 width=.9 run=1.2 volume=-1.5 | darkhall | fifths | Dark octaves that fall to a murmur between slow waves
Syllables | Dissolving voices | surge=Slips cluster=1 lockstep=.75 slope=.5 pace=2 onset=.2 layer=.7 layerOrder=3 grain=.4 bury=.25 slump=1 spread=20 front=.2 volume=3.5 | vowel | duet | A voice that says two bright syllables a second
Amen going round | Dissolving voices | surge=Aftershocks cluster=1 lockstep=.7 slope=.6 pace=.9 onset=.3 layer=.6 layerOrder=4 grain=.5 bury=.2 slump=4 front=.8 width=.9 run=14 | nave 1.mix=.28 | tied | Voices struck together once and then again and again, more and more apart
Auctioneer in a dream | Dissolving voices | surge=Slips pulse=Squeak cluster=1 lockstep=.8 slope=.4 pace=4.5 front=.6 onset=.08 layer=.4 grain=.25 bury=.3 slump=.6 width=.85 volume=0 | combo | spread | Quick nasal babble across the chord
Laughter at the gate | Dissolving voices | surge=Aftershocks pulse=Wet cluster=1 lockstep=.75 slope=.7 pace=2.4 onset=.06 layer=.5 layerOrder=2 grain=.45 run=3 flow=.6 slump=.8 width=.3 front=.1 | chamber | answer | Hollow voices that shake in a burst and die down
Roll call | Dissolving voices | surge=Slips cluster=3 lockstep=.65 slope=.6 pace=1.2 front=1 onset=.15 layer=.3 grain=.3 bury=.2 slump=1.5 width=.3 run=9 | strikes | tied | Three groups called one after another up the chord
Glass congregation | Dissolving voices | pulse=Glassy cluster=1 lockstep=.6 onset=.9 layer=.6 layerOrder=3 grain=.35 spread=35 slope=.4 pace=.3 width=.3 front=.2 run=6 | glasstail | veil | Ground glass held loosely in step, a pale choir with a double octave
Choir in the freezer | Dissolving voices | pulse=Glassy cluster=2 lockstep=.35 onset=.5 layer=.8 layerOrder=6 grain=.3 dry=.4 spread=60 bury=.1 slope=.3 width=.55 front=0 pace=.9 run=6 | winter | tied | Cold loose glass with a sixth harmonic and a thin hiss
Seraph with a cold | Dissolving voices | pulse=Glassy cluster=1 lockstep=.85 onset=.25 layer=.4 layerOrder=2 grain=.2 bury=.3 spread=14 slope=.3 pace=4.6 front=0 slump=1.2 width=.9 volume=0 | sung | duet | A muted glass voice with a quick even shake
Windows that hum | Dissolving voices | pulse=Glassy cluster=3 lockstep=.75 onset=1.4 layer=.3 grain=.15 bury=.35 boom=.4 spread=20 slope=.6 pace=.4 front=1 run=1.2 volume=-0.5 | lungs | tied | Covered glass in three groups that breathes in slow waves over a boom
Candle smoke rising | Dissolving voices | pulse=Glassy cluster=4 lockstep=.5 onset=.7 layer=.2 grain=.2 spread=26 slope=.5 pace=.5 bury=.2 dry=.1 width=.85 front=0 volume=-2 | ascent | entries | Four loose glass groups two octaves over the line
Photograph of a choir | Dissolving voices | cluster=1 lockstep=.6 layer=.5 layerOrder=3 onset=.3 grain=.35 bury=.4 grit=.3 slope=.25 pace=.6 slump=1.5 boom=.1 width=.9 front=.8 run=9 | record | chain | A small faded choir, covered and a little rough
Children behind hedges | Dissolving voices | pulse=Round cluster=2 lockstep=.75 grain=.65 onset=.12 layer=.6 layerOrder=4 run=2 flow=.4 slope=.3 pace=1 bury=.1 slump=1.2 front=.1 volume=6 | backrow | answer | Light bright voices in octaves that start quickly and thin out
Flint evangelist | Dissolving voices | pulse=Flint cluster=1 lockstep=.65 grain=.4 grit=.7 onset=.2 layer=.9 layerOrder=3 slope=.4 pace=.9 bury=.25 slump=1 front=.2 run=1.2 volume=0 | valve | chant | A hard grinding voice bent into a twelfth
Choir of one harp | Dissolving voices | cluster=1 lockstep=.5 onset=.02 run=1.6 flow=.2 layer=.95 layerOrder=4 grain=.5 spread=30 slope=.2 bury=.15 slump=5 front=.1 pace=.9 volume=3.5 | strings | broken | Plucked breaths that leave two octaves singing as they go | plucked
Salt pillar | Dissolving voices | cluster=1 lockstep=1 grit=.02 spread=0 grain=.25 onset=2 layer=.5 layerOrder=5 slope=.15 pace=.06 bury=.3 boom=.3 slump=9 width=.55 front=.1 run=14 volume=-1 | longhold | longone | One still voice with all its grains in step and a fifth harmonic
`,
    },
    {
      id: 'aftershocks',
      name: 'Aftershocks',
      category: 'texture',
      rows: `
Valley floor settles | Aftershocks | pace=.35 boom=.6 bury=.5 slope=.9 layer=.2 layerOrder=1 grain=.25 dry=.6 front=.8 spread=3 grit=.15 volume=-7 | valley | fifths | One heavy covered shock and long gaps between the ones that follow
Dayshift far below | Aftershocks | pace=1.1 boom=.8 bury=.6 slope=.5 dry=.1 layer=.5 layerOrder=2 lockstep=.95 front=.3 width=1 spread=24 volume=-5 | shaft | fifths | Round shocks from far down, nearly no loose sand, a boom in each
Someone moves the sky | Aftershocks | pace=.5 boom=.4 bury=.1 slope=1 grain=.6 layer=.8 layerOrder=4 front=1 width=1 dry=.2 spread=8 grit=.15 volume=-16 | infinite | open | Wide steep shocks that leave two octaves ringing while they wait
Wardrobe on the stairs | Aftershocks | pace=2 boom=.5 bury=.45 slope=.6 run=3 flow=.5 slump=1 dry=.3 front=.5 layer=.3 layerOrder=5 spread=32 grit=.45 volume=1.5 | stairwell | sink | Dull bumps that come in a quick run and thin out
Table of the giants | Aftershocks | pace=.8 boom=1 bury=.3 slope=.4 lockstep=1 grit=.05 grain=.2 layer=.6 layerOrder=3 dry=0 front=.3 spread=8 volume=-6.5 | giant | fifths | Smooth locked shocks, all boom and twelfth
Scree | Aftershocks | pulse=Flint pace=1.4 dry=.7 grit=.6 grain=.45 bury=.15 boom=.1 lockstep=.7 layer=.2 front=0 layerOrder=5 volume=-3 | valley 1.mix=.24 | three | Rough flint that breaks and patters down the slope
Knapping floor | Aftershocks | pulse=Flint pace=3 dry=.2 grit=.2 grain=.6 bury=.05 boom=0 slope=.5 layer=.6 layerOrder=6 slump=1 width=.35 volume=-1.5 | cell 2.gain=2 | three | Hard quick chips with a sixth harmonic in each
Train over loose points | Aftershocks | pulse=Flint pace=4.5 dry=.3 grain=.2 bury=.5 boom=.5 slope=.6 layer=.3 front=.3 layerOrder=4 grit=.4 volume=1.5 | tunnel | sink | A dark fast clatter over a boom that slows and starts again
Frost in the wall | Aftershocks | pulse=Flint pace=.6 dry=.15 cluster=3 grain=.4 bury=.2 slope=.8 layer=.4 layerOrder=8 front=1 volume=-6 | stone | open | Single sharp cracks in three groups with silence kept between
Gunpowder tea | Aftershocks | pulse=Flint pace=1.8 dry=.9 grit=.4 lockstep=.4 grain=.35 bury=.3 layer=.9 layerOrder=3 boom=.2 spread=32 volume=-0.5 | pot | three | Pattering grit shaken in bursts, its twelfth rung out of the noise
Mud volcano | Aftershocks | pulse=Wet pace=1.2 dry=.5 grain=.4 bury=.1 boom=.2 slope=.8 layer=.5 layerOrder=2 width=.5 front=1 spread=32 grit=.15 volume=-2.5 | slowswell | three | Wet bursts that open and pop, an octave hollow in them
Kettle before it sings | Aftershocks | pulse=Wet pace=4 dry=.6 grain=.65 bury=.05 slope=.5 layer=.7 layerOrder=5 boom=0 lockstep=.7 front=0 spread=24 grit=.2 volume=3.5 | glaze | far | Fine bubbling that comes in quick runs with a fifth harmonic
Harbour mud at night | Aftershocks | pulse=Wet pace=.5 dry=.4 grain=.2 bury=.55 boom=.6 slope=.7 layer=.2 slump=6 width=.6 front=.8 layerOrder=1 spread=8 grit=.15 volume=-6.5 | sunk | fifths | Slow dark gulps over a boom
Otters | Aftershocks | pulse=Wet pace=2.6 dry=.3 cluster=2 grain=.5 bury=.15 slope=.9 front=1 layer=.4 layerOrder=7 run=4 flow=.6 spread=28 volume=-3.5 | drip | spread | Hollow splashes with a twelfth that chase through the chord
Drain in the courtyard | Aftershocks | pulse=Wet pace=.9 dry=.8 lockstep=.5 grit=.5 grain=.7 bury=.2 spread=40 layer=.9 layerOrder=1 front=0 volume=-4 | shell | longone | Gurgling loose water with only its ground note left
Lake ice in March | Aftershocks | pulse=Glassy pace=.7 grain=.25 bury=.2 boom=.4 slope=.9 layer=.6 layerOrder=5 slump=5 dry=.15 front=.1 spread=24 grit=.4 | nave 1.mix=.34 | open | Slow glass cracks over a boom, running far and ringing long
Wine glasses in a lorry | Aftershocks | pulse=Glassy pace=5 grain=.4 bury=.1 slope=.4 dry=.1 layer=.3 front=.2 boom=0 cluster=2 width=.5 layerOrder=8 spread=24 volume=-1 | wide | tied | A cupboard of glass two octaves up that rattles in bursts
Windscreen | Aftershocks | pulse=Glassy pace=1.5 grain=.7 bury=0 slope=.7 dry=.8 grit=.5 lockstep=.5 spread=35 layer=.4 width=1 front=.1 layerOrder=5 volume=1.5 | patter | three | Fine loose glass scattered in shocks, mostly sparkle and grit
Prism on the sill | Aftershocks | pulse=Glassy pace=.4 grain=.3 bury=.3 slope=.5 layer=.9 layerOrder=9 dry=.05 front=1 width=1 cluster=3 spread=6 grit=.4 volume=-4 | fan | entries | Three groups of glass, lifted now and then, a whistle kept after
Cold conservatory | Aftershocks | pulse=Glassy pace=2.2 grain=.15 bury=.45 slope=.8 dry=.4 layer=.2 boom=.2 run=5 flow=.4 width=.9 front=0 layerOrder=2 spread=6 volume=0.5 | floor | far | Muffled glass ticks that settle into rarer ones
Timber through the night | Aftershocks | pulse=Squeak pace=.5 grain=.1 bury=.3 boom=.3 slope=.7 grit=.5 layer=.4 layerOrder=2 front=.4 spread=0 volume=-6.5 | board | fifths | Slow deep creaks, each with a bump
Rigging in a swell | Aftershocks | pulse=Squeak pace=1.1 grain=.2 bury=.15 boom=.1 slope=.6 spread=30 front=1 layer=.5 layerOrder=5 width=.8 volume=-5.5 | surf | sway | Creaking ropes that answer each other across the keys
Bats above the choir | Aftershocks | pulse=Squeak pace=3.5 grain=.55 bury=.15 boom=0 slope=.6 dry=.2 cluster=2 layer=.2 slump=1 layerOrder=1 spread=20 grit=.15 volume=6 | backrow 3.gain=4 | far | Quick high squeaks in a scatter, nasal and light
Leather and a horse gate | Aftershocks | pulse=Squeak pace=.8 grain=0 bury=.5 boom=.5 slope=.8 dry=.5 layer=.7 layerOrder=3 lockstep=.6 spread=28 volume=-6 | breeze | longone | Dark rubbed creaks in loose sand, nasal and slow
Accordion on a slope | Aftershocks | pulse=Squeak pace=2 grain=.25 bury=.4 slope=.4 lockstep=.9 layer=.3 front=.6 dry=.05 boom=.2 width=.35 layerOrder=7 spread=20 grit=.15 volume=-2 | ensemble | tied | A held nasal chord knocked about by shocks that space out
Ridge breaks at dawn | Slips on the ridge | pace=.6 slope=.8 grain=.45 pulse=Round layer=.6 layerOrder=5 front=1 slump=3 bury=.1 spread=28 grit=.4 | hall | tied | Sudden bright slips that run over the keys every second or two
Cards shuffled in rain | Slips on the ridge | pace=3.4 slope=.6 grain=.4 cluster=2 dry=.45 front=.7 bury=.36 layer=.2 lockstep=.75 width=.85 grit=.15 volume=1 | room | spread | Quick flint slips in octaves that shuffle like a deck
Shutters along a street | Slips on the ridge | pace=1 slope=1 grain=.2 bury=.4 boom=.4 pulse=Flint front=1 layer=.4 layerOrder=3 dry=.2 width=.9 spread=32 grit=.4 | heads | tied | Dark slams one key after another, once a second
Foil balloon | Slips on the ridge | pulse=Squeak pace=1.7 slope=.5 grain=.3 front=.4 bury=.15 dry=.1 layer=.5 layerOrder=6 slump=1.5 spread=32 grit=.4 volume=0.5 | glaze | sway | Squeaks that jump bright and fall back nearly twice a second
Fish turn in the net | Slips on the ridge | pulse=Wet pace=2.4 slope=.7 grain=.45 front=1 width=1 dry=.35 layer=.6 layerOrder=4 bury=.1 spread=24 grit=.38 volume=3.5 | water | open | Wet slips flung to the sides, hollow in between
Loom of forty shafts | Running pulse | surge=Aftershocks pace=6 slope=.7 cluster=1 grain=.4 layer=.4 layerOrder=3 front=1 bury=.2 slump=1 width=.85 volume=0.5 | room | spread | A fast clatter of round grains that thins out and begins again
Engine cooling down | Running pulse | surge=Aftershocks pulse=Flint pace=2.8 slope=.5 cluster=2 grain=.3 dry=.3 boom=.3 bury=.4 slump=1.5 layer=.2 volume=3.5 | combo | sink | Ticking flint in octaves that spaces itself out
Flags on two hills | Running pulse | surge=Slips pace=5.5 slope=.5 cluster=1 grain=.45 front=.2 layer=.7 layerOrder=8 bury=.1 slump=.8 spread=0 volume=3.5 | steps | wheel | Bright slips over five times a second with a whistle in them
Stars through branches | Running pulse | pulse=Glassy pace=8 slope=.8 cluster=3 grain=.25 front=1 layer=.2 bury=.1 slump=2 width=1 grit=.4 volume=6 | tail | far | Glass in three groups flickering eight times a second
Second hand of the sea | Running pulse | pace=.9 slope=1 cluster=1 grain=.5 dry=.8 front=0 lockstep=.7 layer=.3 layerOrder=2 bury=.15 slump=2 onset=.3 width=.8 spread=8 | surf | fifths | One steep wave a second, sand hissing in each
Tremor under the stairs | Aftershocks | cluster=5 pace=1 grain=.35 bury=.35 boom=.4 slope=.6 layer=.3 dry=.15 front=.4 layerOrder=5 grit=.38 volume=-3.5 | under | fifths | Shocks of five groups, a high third over each boom
Landslip into the lake | Aftershocks | cluster=2 pace=.7 grain=.4 bury=.1 slope=1 front=1 dry=.5 layer=.7 layerOrder=6 boom=.1 slump=6 width=.85 spread=0 grit=.1 volume=-7 | darkhall | open | Octaves that break away steeply and slide with loose sand
Quake in the organ loft | Aftershocks | cluster=3 pace=1.6 grain=.5 bury=.2 slope=.35 lockstep=.97 grit=.1 dry=.05 boom=.3 layer=.15 front=.4 width=1 layerOrder=1 spread=2 volume=-2 | cathedral | chorale | Three locked groups like pipes that shudder and recover | organ
Fracture in the skylight | Aftershocks | cluster=6 pulse=Glassy pace=2.2 grain=.1 bury=.15 slope=.8 layer=.3 dry=.3 boom=.2 front=1 width=1 layerOrder=6 spread=8 grit=.22 volume=1.5 | stars | open | Six groups of glass that crack high and scatter
Lamps left swinging | Aftershocks | cluster=4 pulse=Flint pace=.9 grain=.15 bury=.3 slope=.7 layer=.5 layerOrder=8 boom=.2 dry=.2 run=8 flow=.7 grit=.2 volume=-6 | ringed | tied | Four flint groups two octaves up, shaken and slow to settle
Sand down a staircase | Aftershocks | dry=1 lockstep=.3 pace=1.3 spread=60 grain=.6 bury=.1 boom=0 grit=.7 layer=.4 width=.5 front=.4 layerOrder=7 volume=0 | stairwell | longone | Loose ticking sand that pours in bursts, its note hardly there
Hourly avalanche | Aftershocks | dry=.8 lockstep=.5 pace=.3 slope=1 grain=.45 bury=.2 boom=.5 spread=40 slump=8 width=1 front=.4 layerOrder=7 grit=.4 | horizon | fifths | One great fall of loose grains and a long quiet slide behind it
Salt shaker choir | Aftershocks | dry=.65 lockstep=.6 pace=3 slope=.8 grain=.8 bury=0 boom=0 layer=.8 layerOrder=7 front=.5 width=.9 spread=4 volume=2 | airy | far | Fine dry shakes with a seventh harmonic drawn from them
Visitors on the gravel | Aftershocks | pulse=Flint dry=1 lockstep=.2 pace=2.4 slope=.6 grain=.3 bury=.25 grit=.9 layer=0 boom=.2 front=.4 layerOrder=9 spread=6 volume=-7 | cassette 3.gain=6.5 | longone | Crunching gravel in steps that come slower and slower
Wet shingle | Aftershocks | pulse=Wet dry=1 lockstep=.35 pace=.6 slope=.9 grain=.5 bury=.15 layer=.5 layerOrder=3 spread=70 boom=.1 volume=-3.5 | surf | three | Shingle dragged and dropped, wet and loose, with a hollow twelfth
Dust after the cart | Aftershocks | onset=1.2 pace=.6 slope=.5 dry=.5 grain=.5 lockstep=.8 layer=.4 bury=.2 slump=5 width=.6 front=.4 layerOrder=5 grit=.1 volume=-1.5 | breeze | entries | A slow hum that shocks break into, sand hanging after each
Tremor in the strings | Aftershocks | onset=.5 pace=4 slope=.35 pulse=Flint grain=.2 grit=.4 bury=.35 layer=.6 layerOrder=2 dry=.1 boom=.1 slump=1.5 width=.5 front=0 spread=28 volume=-3 | strings | duet | Bowed flint with a shiver that comes and dies away | string
Lorry through a dream | Aftershocks | onset=2 pace=.25 slope=.8 bury=.6 boom=.8 grain=.3 dry=.2 layer=.5 layerOrder=1 slump=7 width=1 spread=24 grit=.45 volume=6 | pillow 1.output=5 | open | A buried hum that rare shocks lift and let down again
Borealis out of tune | Aftershocks | onset=.8 pace=1.2 slope=.6 pulse=Glassy cluster=2 spread=70 lockstep=.6 grain=.35 bury=.1 layer=.3 front=1 slump=5 width=.8 layerOrder=8 volume=6 | drifter | open | Glass far from its note, thrown up in sheets
Weights on long wires | Aftershocks | onset=.03 pace=1.8 slope=.4 run=2 flow=.2 slump=3 pulse=Round lockstep=1 grit=.05 spread=2 layer=.8 layerOrder=4 bury=.05 dry=0 front=.9 volume=3.5 | moons | wheel | Smooth plucks, each with a few soft echoes of its own | plucked
`,
    },
    {
      id: 'locked-drones',
      name: 'Locked drones',
      category: 'drone',
      rows: `
Floor of the world | Locked drone | cluster=1 bury=.6 boom=.9 grain=.2 layer=.3 layerOrder=1 onset=1 slope=.1 dry=0 width=.3 | bare | deep | A smooth dark tone and the whole slope moving an octave under it
Standing stone at dusk | Locked drone | cluster=1 bury=.3 boom=.5 grain=.4 layer=.5 layerOrder=2 onset=1.5 slope=.3 pace=.2 dry=.1 width=.6 front=.3 | undertow | fifths | A round locked drone with its octave, swelling once in five seconds
Cistern stair | Locked drone | cluster=1 bury=.45 boom=.6 grain=.3 layer=.9 layerOrder=3 onset=2 slope=.2 pace=.3 | crypt | open | Every grain in step and a strong twelfth rung from them
Pylon in light wind | Locked drone | cluster=1 bury=.1 boom=.2 grain=.7 grit=.15 layer=.4 layerOrder=4 onset=.6 slope=.35 pace=.6 front=.3 | airy | lament | A bright plain hum that a slow wave makes brighter
Earth lamp | Locked drone | cluster=1 bury=.8 boom=1 grain=.35 layer=.6 layerOrder=2 onset=.8 slope=.5 pace=.5 spread=10 width=.85 front=.9 | soft | deep | A buried drone, all boom, its lid lifted every two seconds
String left singing | Locked drone | layer=.9 layerOrder=3 boom=.1 grain=.6 onset=.3 slope=.2 pace=.7 dry=.05 bury=.1 width=.9 front=.2 | strings 1.mix=.3 | lament | Locked octaves with a twelfth that rings like a drone string
Seventh rung | Locked drone | layer=1 layerOrder=7 boom=.3 grain=.5 onset=1.2 slope=.4 pace=.3 front=1 | glow | fifths | Octaves and a natural seventh whistled high above, coming and going
Wave with a thin crest | Locked drone | layer=.65 layerOrder=9 boom=.5 grain=.65 onset=2 slope=.5 pace=.4 bury=.2 width=.8 front=.2 | longplate | deep | Low octaves with a thin ninth harmonic lit by each wave
Inside the mountain | Locked drone | layer=.8 layerOrder=5 boom=.7 grain=.4 bury=.35 onset=1 slope=.15 pace=.15 | fifths | fifths | Dark octaves with a soft high third inside them
Loom of two threads | Locked drone | cluster=2 layer=.5 layerOrder=6 grain=.8 bury=0 boom=.1 onset=.5 slope=.3 pace=1.2 front=.8 grit=.2 volume=6 | swirl | lament | Bright fine octaves with a sixth harmonic, gently rocked
Pipes on the far bank | Locked drone | pulse=Flint cluster=1 grain=.3 grit=.25 bury=.3 boom=.2 onset=.2 layer=.4 layerOrder=3 slope=.1 slump=1 width=1 | chamber | lament | A steady flint reed with a twelfth in its edge
Unhurried grindstone | Locked drone | pulse=Flint cluster=1 grain=.2 grit=.6 bury=.45 boom=.5 onset=.6 layer=.3 slope=.45 pace=.8 lockstep=.9 width=.5 front=1 | iron | lament | Dark flint that grinds round nearly once a second over a boom
Wasp in a winter jar | Locked drone | pulse=Flint cluster=2 grain=.45 grit=.1 bury=.5 boom=0 onset=.4 layer=.7 layerOrder=5 slope=.2 pace=2 width=.35 volume=2.5 | bottle | longone | Muffled flint octaves buzzing softly with a fifth harmonic
Border pipe on the march | Locked drone | pulse=Flint cluster=3 grain=.25 bury=.35 boom=.6 onset=.12 layer=.2 slope=.5 pace=2.5 front=0 slump=.8 | depth | lament | Three flint groups beating in time over a boom
Telegraph pole | Locked drone | pulse=Flint cluster=1 grain=.6 grit=.35 bury=.2 boom=.3 onset=1.4 layer=1 layerOrder=8 slope=.35 pace=.35 lockstep=.85 width=1 front=.8 volume=3.5 | sweep | open | A wiry flint hum with an eighth harmonic singing along it
Hollow log at sundown | Locked drone | pulse=Wet cluster=1 grain=.3 boom=.5 bury=.2 onset=.25 layer=.6 layerOrder=3 slope=.4 pace=1.4 dry=.2 width=1 front=.2 | pipe | lament | A hollow low pipe whose twelfth opens and shuts
Humming bog | Locked drone | pulse=Wet cluster=1 grain=.5 boom=.2 bury=.1 onset=1.8 layer=.4 layerOrder=3 slope=.6 pace=.3 dry=.5 lockstep=.85 width=1 front=1 | open | deep | Wet hollow sand that bubbles around a held tone
Shell breathing slowly | Locked drone | pulse=Wet cluster=2 grain=.4 boom=.4 bury=.3 onset=.8 layer=.9 layerOrder=7 slope=.7 pace=.25 width=.35 front=.2 | shell | fifths | A hollow shell tone that takes a breath every four seconds
Boat under the pier | Locked drone | pulse=Wet cluster=1 grain=.15 boom=.8 bury=.5 onset=1 layer=.3 layerOrder=2 slope=.3 pace=.6 dry=.3 slump=4 width=.85 front=.2 volume=-8.5 | bathtub | deep | A very dark hollow drone over a boom with water under it
Jug of river tones | Locked drone | pulse=Wet cluster=3 grain=.6 boom=.2 bury=.15 onset=.3 layer=.3 slope=.2 pace=.9 slump=2 front=.2 dry=.4 | pot | lament | Three hollow groups, a clear twelfth with breath around it
Glass harp left alone | Locked drone | pulse=Glassy cluster=1 grain=.25 boom=.1 bury=.15 onset=.8 layer=.4 layerOrder=2 slope=.2 pace=.4 width=.5 | hall 1.mix=.28 | lament | A pure steady glass tone with a faint double octave
Cold store | Locked drone | pulse=Glassy cluster=2 grain=.15 boom=.5 bury=.4 onset=1.4 layer=.8 layerOrder=6 slope=.4 pace=.2 width=.85 front=0 | darkhall | fifths | Dull glass over a boom, its double octave swelling
Refrigerator heaven | Locked drone | pulse=Glassy cluster=3 grain=.35 boom=.3 bury=.5 onset=.6 layer=.2 slope=.35 pace=1.5 front=0 spread=12 volume=6 | nextdoor | longone | Muffled glass in three groups with a slow electric throb
Salt lake at zenith | Locked drone | pulse=Glassy cluster=1 grain=.7 boom=0 bury=.15 onset=2.2 layer=.6 layerOrder=6 slope=.5 pace=.15 width=1 front=1 volume=1 | thinair | open | Fine glass, wide and very bright, that grows for two seconds and keeps swelling
Aquarium at closing | Locked drone | pulse=Glassy cluster=4 grain=.2 boom=.4 bury=.25 onset=1 layer=.3 layerOrder=4 slope=.3 pace=.5 lockstep=.9 spread=20 width=.8 volume=0.5 | deepsea | sway | Four glass groups two octaves up, wavering slightly, over a boom
Gate with no wall | Locked drone | cluster=3 grain=.45 boom=.5 bury=.3 onset=.5 layer=.3 layerOrder=6 slope=.15 pace=.2 slump=3 front=.9 volume=0.5 | common | lament | Three locked groups and their twelfth, plain and close
Herd over the plain | Locked drone | cluster=5 grain=.35 boom=.6 bury=.25 onset=1.2 layer=.2 slope=.3 pace=.35 width=.35 front=.8 | tail | deep | Five groups lift a third two octaves up from a deep boom
Nothing above the ridge | Locked drone | cluster=6 grain=.3 boom=.3 bury=.5 onset=2 layer=.4 slope=.4 pace=.25 width=.5 front=.3 pulse=Flint | nave 1.mix=.3 | fifths | Six covered flint groups with a fifth that swells two octaves above
Four corners | Locked drone | cluster=4 grain=.5 boom=.2 bury=.1 onset=.4 layer=.6 layerOrder=4 slope=.25 pace=.8 front=1 width=1 volume=4.5 | around4 | lament | Four groups, two octaves over each key, moved from side to side by the waves
Organ of the glacier | Locked drone | cluster=3 grain=.25 boom=.9 bury=.55 onset=1.6 layer=.5 layerOrder=9 slope=.5 pace=.12 slump=9 volume=-9 | nave 1.mix=.34 | deep | Three groups that gather slowly over a huge boom
Ferries idling | Locked drone | cluster=1 spread=60 lockstep=.75 grit=.1 boom=.4 bury=.35 onset=.8 layer=.3 slope=.1 width=.85 volume=0.5 pulse=Flint grain=.2 | wide | lament | Dark flint well off the note that beats slowly round it
Disputed border | Locked drone | cluster=2 spread=85 lockstep=.7 grit=.05 boom=.1 grain=.5 onset=.6 layer=.5 layerOrder=3 slope=.2 pace=.5 width=1 front=0 volume=0.5 | endlessfall | open | Smooth octaves spread wide, beating without hurry
Compass in a snowfield | Locked drone | pulse=Squeak cluster=1 spread=35 lockstep=.8 grain=.1 bury=.4 boom=.5 onset=1 layer=.4 layerOrder=2 slope=.3 front=.3 pace=.25 | iron | fifths | A nasal dark drone that wavers about its pitch
Bees in the chimney | Locked drone | pulse=Round cluster=1 spread=45 lockstep=.6 grit=.5 grain=.7 bury=.3 boom=.1 onset=.5 layer=.6 layerOrder=4 slope=.15 width=.6 front=.2 pace=.25 | cupboard | longone | A fine restless swarm round the note with two octaves in it
Sagging wire | Locked drone | pulse=Flint cluster=1 spread=70 lockstep=.8 grit=.15 grain=.35 bury=.3 boom=.3 onset=.3 layer=.8 layerOrder=6 slope=.1 width=.5 volume=1.5 | doubled | lament | Flint that swims round its pitch, a sixth harmonic ringing out
Sleeping dragon | Night crossing | onset=.8 pace=.3 slope=1 bury=.8 boom=.7 lockstep=.95 layer=.5 layerOrder=3 cluster=1 dry=.2 width=.6 front=.8 grit=.1 | cave | deep | A buried drone that heaves once every three seconds
Bellows of the ward | Night crossing | pulse=Flint onset=.5 pace=.5 slope=.7 bury=.5 boom=.5 grain=.25 front=0 layer=.2 dry=.3 width=.35 grit=.45 | cupboard | lament | Covered flint that opens and closes every two seconds
Slow semaphore | Night crossing | cluster=1 onset=.6 pace=.7 slope=.6 bury=.4 boom=.3 front=1 layer=.9 layerOrder=8 grain=.3 width=1 grit=.4 volume=3 pulse=Flint | panned | lament | Covered flint whose eighth harmonic flashes one key after the other
Orchard fan | Night crossing | onset=.3 pace=3.2 slope=.45 bury=.45 boom=.3 front=.5 layer=.5 layerOrder=4 grain=.4 lockstep=.9 width=.5 spread=24 | blanket | sway | A round hum fanned three times a second
Night watch lamp | Night crossing | pulse=Glassy onset=1.4 pace=.4 slope=.8 bury=.5 boom=.5 cluster=3 grain=.3 layer=.2 dry=.1 spread=8 grit=.45 | horizon | fifths | Three glass groups, covered, that flash and go dark
Wind in the stairwell | Locked drone | lockstep=.45 dry=.7 grit=.4 cluster=1 boom=.3 onset=1 layer=1 layerOrder=3 slope=.5 pace=.3 bury=.2 | shaft | fifths | Blown sand around a half locked tone, its twelfth sung
Sea fret | Locked drone | lockstep=.3 dry=.9 grain=.3 spread=50 cluster=1 boom=.2 onset=.8 layer=.6 layerOrder=2 slope=.7 pace=.22 bury=.35 width=1 front=.1 | surf | open | More hiss than tone, coming in slow banks with an octave in it
Radiator before dawn | Locked drone | pulse=Wet lockstep=.6 dry=.7 grit=.3 cluster=1 grain=.45 boom=.3 onset=.4 layer=.7 layerOrder=5 slope=.2 bury=.3 front=.8 pace=.35 | reel | longone | Knocking wet sand and a fifth harmonic over a low hum
Oven wall still warm | Locked drone | pulse=Flint lockstep=.5 dry=.4 grit=.7 cluster=1 grain=.2 boom=.6 onset=1.2 layer=.8 layerOrder=1 slope=.3 bury=.5 pace=.35 volume=3.5 | haze | fifths | A rough ember of a drone, its ground rung hard over a boom
Moor under ticking sky | Locked drone | lockstep=.55 dry=1 grain=.55 cluster=2 boom=.2 onset=.5 layer=.9 layerOrder=6 slope=.4 pace=.5 bury=.15 width=.6 front=1 | breeze | lament | A sixth harmonic sung behind a curtain of single ticking grains
Bowed plough | Locked drone | pulse=Flint cluster=3 grain=.45 grit=.7 bury=.2 boom=.05 onset=.25 layer=.8 layerOrder=6 slope=.5 pace=.6 lockstep=.75 slump=1 width=.9 front=1 spread=40 | strings | lament | Rough flint bowed hard, three groups and a sixth harmonic that strains at each wave | string
Violone and rain | Locked drone | pulse=Squeak cluster=1 grain=.08 grit=.35 bury=.45 boom=.5 onset=.5 layer=.5 layerOrder=3 slope=.2 dry=.6 lockstep=.88 slump=3 width=.5 front=.9 pace=.15 | overcast | sway | A creaking low string with loose sand falling on it | string
Struck and left | Locked drone | onset=.01 run=9 flow=.1 cluster=1 boom=.6 bury=.2 layer=.9 layerOrder=5 slope=0 grain=.5 dry=.05 | lowbowls | fifths | A locked hum struck like a bell that takes nine seconds to run out | bell
Gong on temple steps | Locked drone | pulse=Round onset=.02 run=12 flow=.2 cluster=3 boom=.9 bury=.3 layer=.6 layerOrder=7 slope=.3 pace=.8 spread=10 lockstep=.9 width=.6 front=.9 | cave 1.mix=.28 | deep | A gong in three groups that shivers as it fades to a low hum | bell
Tuning the dark | Locked drone | pulse=Squeak cluster=2 grain=.2 grit=.1 bury=.5 boom=.2 onset=1.5 layer=.9 layerOrder=8 slope=.35 pace=.3 width=.85 front=.4 volume=-0.5 | throat | open | A muffled nasal tone two octaves up, an eighth harmonic rising and sinking
`,
    },
    {
      id: 'cluster-organs',
      name: 'Cluster organs',
      category: 'organ',
      rows: `
Sunday by the window | Cluster organ | cluster=1 grain=.5 boom=.15 bury=.2 layer=0 layerOrder=2 onset=.05 width=.2 spread=0 | chamber | chorale | A single plain rank, round and even
Ranks of clay pipes | Cluster organ | cluster=2 grain=.35 boom=.3 bury=.25 layer=.3 layerOrder=4 onset=.06 slump=.5 width=.2 spread=32 | openstops | pedalpoint | Dark octaves with two octaves ringing faintly above
Mixture by noon light | Cluster organ | cluster=3 grain=.95 boom=.1 bury=0 layer=.4 layerOrder=6 onset=.02 dry=.3 spread=20 volume=3.5 | brightplate | chorale | Bright fine twelfths with a sharp edge and a little wind
Rank up in the gallery | Cluster organ | cluster=5 grain=.4 boom=.4 bury=.3 layer=0 onset=.08 spread=12 width=.9 volume=1.5 | backrow | chorale | Five groups that put a high third over a low boom
Choir stop and dust | Cluster organ | cluster=4 grain=.3 boom=.2 bury=.2 dry=.3 lockstep=.85 spread=30 layer=.2 slump=.8 width=.6 layerOrder=8 | tail | tied | Four loose groups, two octaves up, in a thread of sand
Stopped flute in frost | Cluster organ | pulse=Wet cluster=1 grain=.4 boom=.1 bury=.15 layer=.3 onset=.05 dry=.5 layerOrder=5 spread=20 | bare | twovoice | A hollow stopped flute with its breath left in
Chimney flute | Cluster organ | pulse=Wet cluster=1 grain=.55 boom=.1 layer=.7 layerOrder=5 onset=.04 bury=.05 slump=.4 width=.6 volume=-3 | lifted | duet | A hollow pipe with a fifth harmonic let out at the top
Bird organ | Cluster organ | pulse=Wet cluster=2 grain=.7 boom=0 layer=.4 onset=.015 slope=.3 pace=6.5 front=.8 dry=.15 slump=.2 width=.9 layerOrder=8 spread=20 volume=3 | stub | steps | Small hollow pipes that warble quickly
Gedackt in the rain | Cluster organ | pulse=Wet cluster=1 grain=.25 boom=.4 bury=.3 layer=.2 layerOrder=1 dry=.6 onset=.08 slump=.8 width=.2 spread=8 | overcast | chorale | A dark hollow stop with wet pattering sand
Organ of the upper pool | Cluster organ | pulse=Wet cluster=3 grain=.4 boom=.2 layer=.5 layerOrder=9 lockstep=.8 slope=.25 pace=1.5 slump=1.5 front=.2 spread=6 | water | pedalpoint | Three hollow groups that ripple, with a thin whistle over them
Rusty trumpet rank | Cluster organ | pulse=Flint cluster=1 grain=.75 boom=.2 bury=0 grit=.2 layer=.2 onset=.02 layerOrder=2 spread=0 volume=1.5 | cathedral 1.mix=.26 | chorale | A hard bright reed of flint
Crumhorn closet | Cluster organ | pulse=Flint cluster=1 grain=.35 boom=0 bury=.35 layer=.6 layerOrder=3 onset=.03 slump=.1 width=.35 | shade | twovoice | A nasal covered reed with a twelfth, cut off short
Bombarde at the door | Cluster organ | pulse=Flint cluster=2 grain=.25 boom=.7 bury=.25 grit=.25 layer=.2 onset=.05 slump=.6 width=.35 layerOrder=2 spread=6 | valve | fifths | Flint octaves over a heavy boom
Cracked vox humana | Cluster organ | pulse=Flint cluster=1 grain=.3 boom=.1 bury=.3 layer=.8 layerOrder=4 slope=.4 pace=5.5 front=0 lockstep=.85 grit=.4 width=.6 spread=28 | vowel | chorale | A grainy reed two octaves strong that shakes and nearly speaks
Musette on the stairs | Cluster organ | pulse=Flint cluster=3 grain=.25 boom=.05 bury=.5 spread=40 lockstep=.8 layer=.3 onset=.04 width=.2 layerOrder=3 volume=4.5 | stairwell | wheel | Three flint groups out of tune with each other, reedy and lively
Glass positive | Cluster organ | pulse=Glassy cluster=1 grain=.3 boom=.1 bury=.1 layer=.2 onset=.03 slump=.6 width=.5 | chamber | chorale | A small clear organ of ground glass
Nitrate light | Cluster organ | pulse=Glassy cluster=2 grain=.2 boom=.2 bury=.3 layer=.5 layerOrder=5 onset=.1 slope=.2 pace=4 front=.5 slump=1.2 width=.6 spread=28 | worn | chorale | Veiled glass two octaves up that flickers four times a second
Organ on the frozen pond | Cluster organ | pulse=Glassy cluster=3 grain=.35 boom=.4 bury=.15 layer=.15 onset=.02 slope=.35 pace=6 front=0 slump=.3 width=.6 layerOrder=6 spread=24 volume=1.5 | spring | wheel | Glass pipes high over a boom with a quick shake
Celestial stop | Cluster organ | pulse=Glassy cluster=1 grain=.5 spread=50 lockstep=.75 boom=0 layer=.3 layerOrder=2 onset=.25 slump=1.5 width=1 | glasstail | tied | Fine glass out of tune with itself, wide and slow to speak
Organ in the greenhouse | Cluster organ | pulse=Glassy cluster=4 grain=.15 boom=.5 bury=.25 layer=.4 layerOrder=8 onset=.15 slump=2 width=.9 | longplate | pedalpoint | Four dull glass groups two octaves over a boom
Full works alone | Cluster organ | cluster=2 grain=.65 boom=.9 bury=.1 layer=.7 layerOrder=3 onset=.04 slump=.7 grit=.2 | nave 1.mix=.3 | chorale | Wide octaves with a twelfth over the deepest boom
Thirty-two foot dark | Cluster organ | cluster=1 grain=.2 boom=1 bury=.65 layer=.5 layerOrder=1 onset=.12 slump=1 width=.6 spread=20 | crypt | fifths | Covered pedals, almost only the boom and the ground
Gravel bellows | Cluster organ | cluster=3 grain=.35 boom=.8 bury=.35 dry=.5 grit=.5 lockstep=.85 slope=.3 pace=.7 layer=.2 width=.9 layerOrder=1 | grit | pedalpoint | Rough twelfths over a boom, leaning with the bellows
Cathedral left unlocked | Cluster organ | cluster=6 grain=.3 boom=.6 bury=.35 layer=.3 onset=.1 slump=2 slope=.15 pace=.4 width=.6 layerOrder=6 spread=6 | cathedral | chorale | Six groups, a high fifth over every key and a boom below
Ship's chapel | Cluster organ | cluster=2 grain=.45 boom=.5 bury=.4 layer=.4 layerOrder=2 slope=.5 pace=.25 front=.4 slump=.8 | downhall | tied | Covered octaves that heave like a deck every four seconds
Full tremulant | Cluster organ | cluster=1 grain=.6 boom=.2 slope=.45 pace=6 front=0 layer=.3 layerOrder=4 bury=.15 width=.9 spread=32 volume=2 | room | duet | A round rank with a deep tremulant at six a second
Matinee on the pier | Cluster organ | cluster=2 grain=.5 boom=.5 bury=.2 slope=.35 pace=5 front=.3 layer=.6 layerOrder=5 slump=.5 spread=32 | whirl | spread | Round octaves in a wide shake over a boom
Last roundabout turn | Cluster organ | cluster=3 grain=.4 boom=.1 slope=.6 pace=3.2 front=1 layer=.2 dry=.15 slump=.4 width=.9 layerOrder=1 spread=6 volume=0 pulse=Wet | chorale | wheel | Hollow twelfths with a beat that runs up the keys three times a second
Swing boats in mist | Cluster organ | pulse=Squeak cluster=2 grain=.25 slope=.4 pace=4.4 front=.6 bury=.4 layer=.3 boom=.15 slump=.8 width=.2 layerOrder=4 spread=3 volume=6 | haze | wheel | Nasal covered pipes two octaves up that shake from a long way off
Skating in the dark | Cluster organ | cluster=1 grain=.6 boom=.2 bury=.55 slope=.7 pace=2 front=.7 layer=.7 slump=1 width=.5 spread=24 pulse=Glassy layerOrder=4 | farhorn | pedalpoint | Covered glass two octaves up, a pulse crossing the keys twice a second
Regal in a suitcase | Cluster organ | pulse=Squeak cluster=1 grain=.3 boom=.05 bury=.15 grit=.25 layer=.2 slump=.08 width=0 layerOrder=6 spread=0 volume=1.5 | bare | twovoice | A short nasal reed, small and close
Goat beard reed | Cluster organ | pulse=Squeak cluster=5 grain=.3 boom=.4 bury=.35 grit=.6 layer=.5 layerOrder=5 onset=.09 slump=.5 spread=40 lockstep=.75 | pipe | fifths | A low bearded reed, five groups rasping a third two octaves up
Concertina by lamplight | Cluster organ | pulse=Squeak cluster=2 grain=.15 spread=28 lockstep=.85 boom=.05 bury=.45 onset=.05 slope=.2 pace=1.1 slump=.25 layerOrder=8 | kitchen | spread | Nasal reeds beating gently, squeezed once a second
Bandoneon by the sink | Cluster organ | pulse=Squeak cluster=3 grain=.15 boom=.2 bury=.2 grit=.3 onset=.07 layer=.4 slump=.3 slope=.3 pace=.5 width=.9 front=.2 layerOrder=6 spread=20 | reel | duet | Three reedy groups with a hard fifth two octaves up, swelling and biting
Puppet requiem | Cluster organ | pulse=Squeak cluster=4 grain=.2 boom=.3 bury=.35 layer=.2 onset=.03 slump=.6 width=.9 layerOrder=8 spread=28 volume=3.5 | minute | chorale | Tiny nasal pipes high over a boom, close and quick to speak
Chiff and nothing | Cluster organ | cluster=1 grain=.4 dry=.7 onset=.12 run=2 flow=.4 layer=.5 layerOrder=3 bury=.2 grit=.3 width=.35 spread=0 | board | twovoice | A pipe that coughs sand first and then speaks softly
Mice in the bellows | Cluster organ | cluster=2 grain=.5 dry=.9 lockstep=.7 grit=.6 bury=.25 layer=.3 onset=.06 slump=.6 width=.35 layerOrder=6 | worn | chorale | Octaves wheezing through a patter of loose grains
Last pipe standing | Cluster organ | pulse=Flint cluster=1 grain=.2 dry=.4 lockstep=.6 spread=40 grit=.5 bury=.35 layer=.9 layerOrder=3 onset=.1 width=.35 | wool | chant | An old cracked pipe, mostly twelfth and wind
Vestry heater | Cluster organ | pulse=Wet cluster=2 grain=.3 dry=.5 lockstep=.75 spread=20 boom=.4 bury=.4 onset=.15 slump=1.2 layer=.3 width=.35 layerOrder=1 volume=-8.5 | passes | chorale | Hollow octaves that bubble and wheeze under a lid
Organ without a roof | Cluster organ | cluster=3 grain=.5 dry=.6 lockstep=.65 spread=35 slope=.5 pace=.35 front=1 layer=.3 layerOrder=9 slump=3 width=.2 | surf | tied | Twelfths that the waves loosen and lock, with sand blowing in
Percussion tab | Cluster organ | cluster=3 grain=.5 run=.35 flow=.15 onset=.004 slump=.2 boom=.3 layer=.2 width=.6 layerOrder=1 spread=28 volume=6 | chorale | spread | A hard knock of three groups and a quiet pipe behind it
Brass nails in the keys | Cluster organ | cluster=2 grain=.8 run=1 flow=.3 onset=.006 slump=.3 boom=.2 layer=.3 layerOrder=2 bury=.1 spread=50 lockstep=.7 dry=.4 | wall | wheel | Bright fine octaves struck a little sour, settling fast in a scatter of sand
Hymn on marbles | Cluster organ | pulse=Glassy cluster=2 grain=.3 run=1.6 flow=.4 onset=.004 slump=.8 bury=.15 boom=.15 layerOrder=6 spread=0 volume=5 | stub | chorale | Glass two octaves up with a bright front that sinks to a hum | keys
Pizzicato pedals | Cluster organ | cluster=1 grain=.35 run=.5 flow=.05 onset=.005 slump=.25 boom=.6 bury=.35 layer=.3 layerOrder=2 width=.3 spread=24 volume=2 | cell 2.gain=5 | ground | Short round pedal knocks with a boom | bass
Reed and hammer | Cluster organ | pulse=Flint cluster=3 grain=.25 run=2.5 flow=.5 onset=.004 slump=.4 grit=.15 bury=.2 layer=.4 layerOrder=6 spread=20 volume=5.5 | drip | wheel | Three flint groups struck hard and held half as loud | keys
Slow foot on the swell | Cluster organ | cluster=2 grain=.5 onset=1.4 slump=2 slope=.5 pace=.2 bury=.4 boom=.4 layer=.4 layerOrder=3 front=.3 width=.5 | hall | tied | Octaves behind shutters that open once in five seconds
Rise of the lofts | Cluster organ | cluster=3 grain=.4 onset=.8 slump=3 surge=Slips slope=.4 pace=.8 front=1 bury=.25 boom=.3 layer=.3 layerOrder=1 spread=24 volume=6 | opening | entries | Twelfths that jump brighter rank by rank
Cipher at midnight | Cluster organ | cluster=1 grain=.3 onset=.4 slump=8 lockstep=.9 bury=.35 boom=.2 layer=.95 layerOrder=7 slope=.3 pace=.6 width=.6 front=1 spread=2 volume=1.5 | memory | answer | A pipe that will not stop after the key, a seventh harmonic in it
Organist asleep | Cluster organ | cluster=5 grain=.15 onset=.6 slump=4 surge=Aftershocks slope=.4 pace=.5 boom=.5 bury=.45 layer=.35 dry=.1 width=.6 front=.3 layerOrder=5 spread=28 | darkhall | chorale | Covered thirds and a boom, jolted and nodding off again
Snowed in at dawn mass | Cluster organ | pulse=Glassy cluster=1 grain=.2 onset=1 slump=5 lockstep=.85 spread=22 bury=.5 boom=.3 layer=.6 layerOrder=4 slope=.3 pace=.3 front=.1 | winter | tied | A muffled glass rank with two octaves glowing in it
`,
    },
    {
      id: 'flint-plucks',
      name: 'Flint plucks',
      category: 'plucked',
      rows: `
Spark gap | Flint plucks | grain=.75 run=.5 bury=.32 layer=.7 layerOrder=4 dry=.5 grit=.5 slump=.4 lockstep=.65 volume=1 | wall 1.gain=13 | wheel | A hard bright spit of flint, two octaves struck out of the noise
Guitar of slate | Flint plucks | grain=.22 run=3 layer=.75 layerOrder=5 grit=.1 slump=1.5 bury=.3 boom=.35 spread=35 lockstep=.78 | chamber | spread | Slack slate strings with a fifth harmonic, wavering as they ring
Thorn fence | Flint plucks | grain=.7 run=.8 grit=.35 dry=.35 bury=0 layer=.2 slump=.4 spread=25 layerOrder=1 | forward 2.gain=10 | wheel | Sharp scratchy plucks with a spray of sand at each
Sunlit steel comb | Flint plucks | grain=.55 run=3 layer=.7 layerOrder=7 grit=.04 slump=2 bury=.1 volume=5.5 | drip | broken | Bright plucks in which a seventh harmonic stays on
Struck flag | Flint plucks | grain=.25 run=.4 bury=.2 layer=.6 layerOrder=3 boom=.3 slump=.3 dry=.05 spread=3 volume=6 | slap 3.gain=6.5 | wheel | Tight dry plucks with a twelfth and a low knock
Lute under arches | Flint plucks | grain=.2 run=2.5 bury=.35 boom=.3 layer=.4 layerOrder=3 slump=1.2 | hall | spread | Dark soft flint with a twelfth and a boom behind it
Oud in a blue room | Flint plucks | grain=.28 run=1.4 bury=.3 boom=.45 layer=.5 layerOrder=2 grit=.5 spread=18 slump=.6 width=.45 volume=5.5 | board | answer | Dark plucks with a rough front and a deep wooden octave
Bass string of the harp | Flint plucks | grain=.15 run=5 bury=.4 boom=.6 layer=.7 layerOrder=4 slump=3 grit=.05 spread=24 | undertow | broken | Coarse flint left to ring for five seconds over a boom
Barefoot on tar | Flint plucks | grain=.1 run=.7 bury=.5 boom=.5 layer=.3 grit=.4 slump=.5 lockstep=.8 width=.4 layerOrder=8 spread=8 volume=3.5 | pillow | ground | Blunt gritty thuds with a low note in them | bass
Undamped cimbalom | Flint plucks | grain=.3 run=4 bury=.2 layer=.5 layerOrder=5 spread=40 lockstep=.75 slump=4 volume=5.5 | spring | wheel | Struck flint strings out of tune with each other, ringing over
Gut and rain | Flint plucks | pulse=Round grain=.55 run=1.4 bury=.2 dry=.5 layer=.4 layerOrder=3 boom=.1 width=.3 volume=6 | patter | broken | Round gut plucks with loose sand falling after
Porch light strings | Flint plucks | pulse=Round grain=.5 run=2 bury=.25 dry=.05 layer=.5 layerOrder=2 boom=.2 slump=.5 grit=.05 width=1 spread=8 volume=3.5 | warmth | spread | Smooth round plucks with a warm octave
Koto over sand | Flint plucks | pulse=Round grain=.75 run=1.6 bury=.05 layer=.6 layerOrder=5 spread=20 grit=.2 slump=1 dry=.3 volume=6 | brightplate 3.gain=4.5 | answer | Bright tight plucks, a fifth harmonic and a little wavering
Cigar box rubber band | Flint plucks | pulse=Round grain=.65 run=.4 bury=.15 grit=.5 layer=.3 boom=.15 lockstep=.75 slump=.2 dry=.1 width=1 layerOrder=6 spread=24 volume=6 | pot 2.gain=8.5 | steps | Short twanging plucks with a buzz in them
Dulcimer of dew | Flint plucks | pulse=Round grain=.6 run=1 bury=.2 cluster=2 layer=.5 layerOrder=8 slump=1.5 dry=0 spread=32 volume=6 | glints 3.gain=9.5 | peals | Octave plucks with a tiny eighth harmonic like a drop on each
Thumb on cedar | Flint plucks | pulse=Round grain=.2 run=1.3 bury=.4 layer=.9 layerOrder=2 dry=.1 slump=.4 width=.85 spread=35 grit=.45 boom=.4 lockstep=.75 | wall | wheel | Muffled thumbed plucks that waver, an octave ringing in the wood
Rain gourd harp | Flint plucks | pulse=Wet grain=.55 run=1.4 layer=.7 layerOrder=3 dry=.6 slump=1.5 boom=.1 width=1 volume=6 | hops | answer | Hollow plucks with wet ticking round them
Log raft | Flint plucks | pulse=Wet grain=.2 run=1.2 bury=.35 boom=.6 layer=.3 layerOrder=1 dry=0 width=.2 | depth | ground | Low hollow knocks of wood with a boom | bass
Cave pearls | Flint plucks | pulse=Wet grain=.65 run=.35 cluster=3 bury=0 layer=.5 layerOrder=6 dry=.2 slump=.8 width=.55 spread=8 volume=6 | farechoes 3.gain=5.5 | changes | Tiny hollow drops in three groups
Sunken kalimba | Flint plucks | pulse=Wet grain=.4 run=2.2 cluster=2 layer=.8 layerOrder=7 slope=.3 pace=1.2 slump=1.2 bury=.2 front=.3 volume=6 | deepsea | broken | Hollow tines with a twelfth that sway as they ring
Harp of windows | Flint plucks | pulse=Glassy grain=.3 run=2.6 bury=.1 layer=.3 layerOrder=2 slump=1 dry=.05 width=.45 spread=4 volume=4.5 | longplate | spread | Plucked glass, clear and even
Zither of dusty glass | Flint plucks | pulse=Glassy grain=.5 run=2 bury=.32 spread=30 lockstep=.8 dry=.4 layer=.4 layerOrder=9 slump=.8 width=.45 volume=6 cluster=3 | whirl 3.gain=6.5 | wheel | Glass plucks in three groups that beat a little, with a spray of fine sand
Arrow through a lamp | Flint plucks | pulse=Glassy grain=.7 run=.4 bury=0 layer=.2 boom=.2 slump=.3 cluster=2 layerOrder=2 volume=6 | stars 3.gain=11.5 | peals | Very short bright glass, a double octave and gone
Cellar icicles | Flint plucks | pulse=Glassy grain=.15 run=3.4 bury=.4 boom=.5 layer=.7 layerOrder=3 slump=2 width=1 spread=28 volume=6 | shaft | tolls | Muted glass plucks over a boom with a long dull ring
Abacus in heaven | Flint plucks | pulse=Glassy grain=.35 run=.8 cluster=4 bury=.3 layer=.2 slump=1.5 dry=.1 layerOrder=8 spread=45 volume=6 lockstep=.75 | faintmirror 3.gain=11 | peals | Small glass plucks in four groups, two octaves up and shivering
Pizzicato on leather | Flint plucks | pulse=Squeak grain=.2 run=.6 bury=.3 boom=.25 layer=.4 layerOrder=2 slump=.2 grit=.2 width=.35 spread=28 volume=6 | booth 2.gain=5.5 | steps | Dry nasal plucks with a twelfth, close to the bridge
Cricket guitar | Flint plucks | pulse=Squeak grain=.45 run=.3 bury=.1 cluster=2 layer=.2 slump=.2 dry=.2 width=.85 layerOrder=2 volume=6 | overspray 3.gain=12 | wheel | Tiny chirped plucks high over the key
Banjo of bark | Flint plucks | pulse=Squeak grain=.35 run=1 bury=.1 layer=.7 layerOrder=4 grit=.4 slump=.3 lockstep=.85 width=.55 spread=6 | skin 2.gain=8 | wheel | Twanging nasal plucks with two octaves and a rasp
Creak of the pier | Flint plucks | pulse=Squeak grain=.05 run=1.6 bury=.45 boom=.5 layer=.3 slump=1 spread=20 layerOrder=7 volume=6 | darkecho | answer | Low creaky plucks, half wood and half rope
Mandolin mosquito | Flint plucks | pulse=Squeak grain=.4 run=2.5 flow=.3 surge=Slips slope=.4 pace=7 front=0 bury=.2 slump=.3 cluster=2 layerOrder=8 volume=6 | stub | duet | A nasal pluck far above the key, again and again, seven times a second
Sparks off the wheel | Flint plucks | cluster=3 grain=.25 run=2.4 bury=.15 layer=.3 slump=.6 layerOrder=3 spread=32 volume=2 surge=Aftershocks slope=.6 pace=4 front=.3 flow=.3 | heads 3.gain=3 | wheel | Flint in three groups, a twelfth leaping out and then a stutter of sparks
Blackthorn | Flint plucks | cluster=5 grain=.2 run=1.8 bury=.2 boom=.3 layer=.2 slump=1 width=.55 layerOrder=5 volume=6 | darkhall | broken | Five groups pluck a high third over a boom
Taut wire | Flint plucks | cluster=2 grain=.65 run=.6 bury=.05 grit=.2 layer=.6 layerOrder=5 slump=.3 spread=15 width=.55 volume=6 | swirl 3.gain=10.5 | wheel | Thin wiry octaves with a fifth harmonic
Pins and needles | Flint plucks | cluster=6 grain=.2 run=.5 bury=.1 layer=.4 slump=.5 dry=.15 boom=.2 width=1 layerOrder=6 spread=3 volume=6 | embers 3.gain=12 | changes | Six groups prick a fifth two octaves over the key
Flints knocked together | Flint plucks | cluster=4 grain=.15 run=3 bury=.3 boom=.35 layer=.6 layerOrder=4 slump=1.5 grit=.05 width=.45 | doubled | spread | Coarse flint in four groups, two octaves up and ringing
Woodpecker in a far oak | Flint plucks | surge=Aftershocks slope=.7 pace=5 front=.5 flow=.3 run=1.5 grain=.4 bury=.2 slump=.4 layerOrder=9 volume=5 | backrow | answer | A pluck that rattles on quickly and spaces out
Stone skimmed | Flint plucks | surge=Aftershocks slope=.6 pace=2 flow=.4 run=3 grain=.6 pulse=Glassy slump=1 layer=.5 layerOrder=4 front=1 spread=8 | stone | tolls | Glass plucks that hop after themselves, fainter
Sewing the sail | Flint plucks | surge=Slips slope=.6 pace=4 flow=.5 run=4 grain=.3 bury=.3 slump=.3 front=.4 layer=.3 width=.55 layerOrder=7 spread=6 volume=2.5 | room | duet | Dark plucks restruck four times a second while held
Frets of an icy road | Flint plucks | surge=Slips slope=.5 pace=2.5 flow=.6 run=5 grain=.45 cluster=2 front=1 slump=1 bury=.1 layerOrder=4 spread=32 | shadow | spread | Octave plucks that keep slipping up the chord
Tide clock | Flint plucks | surge=Slips pulse=Wet slope=.7 pace=1.5 flow=.6 run=6 grain=.4 slump=1.2 layer=.6 layerOrder=3 boom=.2 front=.8 width=.85 spread=20 | orbit | open | Hollow ticks from key to key, three every two seconds
Scattered seed | Flint plucks | dry=.8 lockstep=.5 grit=.6 grain=.35 run=1.2 bury=.3 spread=40 slump=1 width=.55 layerOrder=4 volume=-6 | airy 2.air=0 2.presence=0 3.gain=13 | wheel | Plucks that burst into loose ticking grains
Broom on the step | Flint plucks | dry=.7 lockstep=.3 grit=.8 grain=.25 run=.4 bury=.42 layer=.8 layerOrder=3 slump=.5 onset=.03 spread=3 | cell | steps | Short brushed strokes with a twelfth hardly there
Salt on a hot stone | Flint plucks | pulse=Round dry=1 lockstep=.6 grain=.4 run=1.4 bury=.4 layer=.5 layerOrder=6 spread=30 slump=1.5 volume=-2 | wide 3.gain=12.5 | peals | Small plucks that fizz and tick as they go
Beans in a drum | Flint plucks | pulse=Wet dry=.9 lockstep=.6 grain=.2 run=.35 bury=.35 boom=.6 slump=.6 layer=.2 layerOrder=7 spread=3 | skin 2.gain=9 | pulse | Low hollow hits with a rattle inside | drum
Rattle of reeds | Flint plucks | pulse=Squeak dry=.8 lockstep=.45 grit=.5 grain=.3 run=.5 bury=.15 slump=.7 spread=50 width=.85 volume=6 | shells 3.gain=7.5 | wheel | Nasal dry plucks, loose and clattering
Plucked into the well | Flint plucks | grain=.4 run=1 bury=.15 layer=.95 layerOrder=5 slump=5 boom=.1 dry=.05 width=.85 spread=28 volume=6 | cistern 3.gain=8 | answer | A hard pluck and a fifth harmonic that rings down a shaft
Harp left on a hill | Flint plucks | pulse=Round grain=.6 run=2.4 slump=6 layer=.9 layerOrder=3 slope=.4 pace=.8 spread=12 width=.55 | breeze | spread | Round plucks whose twelfth goes on in the wind after the key
Letters to the moon | Flint plucks | pulse=Glassy grain=.4 run=1.6 slump=4 layer=.6 layerOrder=8 bury=.1 width=1 spread=14 volume=6 | choir 2.gain=3 | broken | Wide glass plucks with a whistle that lasts
Answering flint | Flint plucks | grain=.3 run=1.4 slump=3 layer=.7 layerOrder=6 bury=.25 boom=.2 cluster=2 width=.55 volume=6 | rising 3.gain=3.5 | answer | Plucks with a sixth harmonic held long
Slow hands in the cold | Flint plucks | pulse=Round grain=.45 onset=.06 run=3.5 flow=.1 slump=3 layer=.6 layerOrder=4 bury=.35 boom=.3 lockstep=.85 spread=22 width=.85 volume=5.5 | mirror | broken | Soft late plucks, dark and beating, two octaves in them
`,
    },
    {
      id: 'far-rain',
      name: 'Far rain',
      category: 'texture',
      rows: `
Rain on canvas | Far rain | grain=.35 bury=.4 layer=.3 layerOrder=2 onset=.8 slope=.2 lockstep=.15 width=.85 front=.3 pace=.28 run=14 volume=-1 | room | longone | Dull patter on cloth with an octave barely sounding in it
Rain on slate | Far rain | pulse=Flint grain=.6 bury=.05 layer=.2 onset=.6 slope=.5 pace=.7 lockstep=.1 front=.1 layerOrder=2 run=6 volume=-2 | stub | three | Hard bright rain in gusts every second or two
Bucket under the leak | Far rain | pulse=Wet grain=.5 bury=.15 layer=.6 layerOrder=1 onset=.4 slope=.3 lockstep=.25 slump=2 front=.3 pace=.9 run=6 volume=4 | pot | three | Wet drops into something hollow, the key's own note in it
Wet chapel bell | Far rain | pulse=Glassy grain=.7 bury=0 layer=.85 layerOrder=4 onset=.7 slope=.2 lockstep=.3 spread=40 front=.4 pace=.55 run=2 volume=3.5 | bowltable | open | Glassy rain that keeps two octaves ringing
Fingers on the tent | Far rain | pulse=Squeak grain=.2 bury=.35 layer=.5 layerOrder=3 onset=.3 slope=.6 pace=1.5 boom=.2 lockstep=.3 front=.1 run=1.2 volume=-5 | skin 2.gain=3 | three | Tight nasal patter that comes in rolls
Drops find a tune | Far rain | dry=.9 layer=1 layerOrder=5 onset=.5 grain=.6 slope=.4 pace=.5 lockstep=.15 bury=.1 run=6 volume=1.5 | tuned | open | Loose grains with a strong fifth harmonic sung through them
Gutter over the yard | Far rain | dry=.8 layer=1 layerOrder=3 onset=.3 grain=.45 slope=.7 pace=1.1 lockstep=.2 bury=.3 slump=2 width=.9 run=2 volume=3.5 | pipe | three | Rain down a pipe, its twelfth louder with every gust
Whistling umbrella | Far rain | dry=.7 layer=1 layerOrder=8 onset=.9 grain=.9 slope=.5 pace=.3 lockstep=.3 bury=.25 run=14 volume=2.5 | panned | open | Light rain with a thin eighth harmonic that comes and goes
Wires after the shower | Far rain | dry=.85 layer=.9 layerOrder=2 onset=.6 grain=.3 slope=.15 lockstep=.4 spread=50 bury=.25 slump=3 pace=.9 run=1.2 volume=-4 | strings | chain | Soft grains that lean on the octave of every key
Tin roof in a cloudburst | Far rain | pulse=Flint dry=.9 layer=.95 layerOrder=5 onset=.4 grain=.5 slope=.4 pace=2 lockstep=.2 bury=.1 width=.5 front=.3 run=3 volume=-3 | cell 2.gain=2 | three | Hard rain with a fifth harmonic ticking out of it
Squall line | Far rain | surge=Waves slope=1 pace=.35 front=1 grain=.7 onset=.6 bury=.1 lockstep=.1 layer=.3 slump=4 width=.8 layerOrder=9 run=6 volume=-1 | circle | open | Steep gusts that cross from low keys to high, hiss and all
Bursts against glass | Far rain | pulse=Glassy surge=Slips slope=.8 pace=1.3 front=.6 grain=.5 onset=.2 lockstep=.2 layer=.4 layerOrder=6 slump=2 run=1.2 volume=2.5 | pane | three | Sudden handfuls of fine drops, more than one a second
Tail of the storm | Far rain | surge=Aftershocks slope=.8 pace=.5 grain=.4 onset=.4 bury=.3 boom=.4 lockstep=.35 layer=.2 slump=7 width=.35 front=1 layerOrder=4 volume=-2 | valley 1.mix=.28 | fifths | One heavy burst and weaker ones, with a low tone far under it
Sprinkler at dawn | Far rain | surge=Waves slope=.9 pace=3 front=1 grain=.95 onset=.3 bury=.25 lockstep=.1 layer=.3 layerOrder=7 run=3 volume=1.5 | wide | three | Fine spray that sweeps from side to side three times a second
Wipers on a side street | Far rain | surge=Slips pulse=Squeak slope=.5 pace=.9 front=0 grain=.1 onset=.3 bury=.45 lockstep=.35 layer=.3 slump=1.5 width=.5 layerOrder=9 run=6 volume=-4 | reel | longone | A nasal wipe about once a second in steady patter
Drops in the grotto | Far rain | pulse=Wet dry=.6 grain=.6 lockstep=.5 onset=.1 run=1.2 flow=.2 spread=40 layer=.7 layerOrder=5 slump=3 bury=.05 width=.8 pace=.18 volume=5.5 | cave | three | Wet plops with a hollow fifth harmonic that sink into drips
Melting gutter | Far rain | pulse=Wet dry=1 grain=.75 lockstep=.2 onset=.4 bury=0 layer=.3 slope=.5 pace=2.4 slump=3 front=.2 layerOrder=9 run=1.2 volume=2 | drip | far | Bright quick dripping that bubbles up and slackens
Stalactite clock | Far rain | pulse=Wet dry=.5 grain=.5 lockstep=.7 onset=.05 surge=Slips slope=.7 pace=1 flow=.5 run=6 spread=20 layer=.8 layerOrder=3 bury=.1 width=.5 front=.3 volume=5.5 | stairwell | three | Hollow drops once a second with a twelfth in each
Marsh at two | Far rain | pulse=Wet dry=.8 grain=.25 lockstep=.35 onset=1 bury=.4 boom=.3 layer=.5 layerOrder=2 slope=.3 width=.85 front=.3 run=3 volume=-0.5 | sunk | fifths | Slow dark bubbles over a low boom
Sponge diver | Far rain | pulse=Wet dry=.9 grain=.4 lockstep=.1 onset=.6 bury=.55 layer=.9 layerOrder=7 slope=.8 pace=.4 width=.6 front=0 run=14 | bathtub | longone | Muffled wet noise and a seventh harmonic when the surge lifts it
Choir behind the rain | Far rain | pulse=Wet lockstep=.65 dry=.8 grain=.35 onset=.9 layer=.6 layerOrder=1 spread=20 slope=.3 pace=.5 bury=.4 boom=.4 width=.6 front=.2 run=14 volume=-4 | oo | tied | A low hollow choir half formed behind falling sand | voice
Piano by an open window | Far rain | lockstep=.85 dry=.8 grain=.5 onset=.01 run=1.6 flow=.12 spread=12 grit=.3 layer=.3 slope=0 bury=.25 slump=2 layerOrder=4 volume=1.5 | room | broken | Soft round keys with rain that stays on behind them | keys
Organ on a wet street | Far rain | lockstep=.9 dry=.9 cluster=3 grain=.4 onset=.15 spread=10 grit=.2 layer=.2 bury=.3 boom=.3 slump=2 slope=.15 pace=.18 layerOrder=3 run=3 volume=-1 | downhall | chorale | Three clear groups with a twelfth under a full patter | organ
Cello in a doorway | Far rain | pulse=Flint lockstep=.8 dry=.7 grain=.2 onset=.4 grit=.5 spread=16 bury=.4 boom=.3 layer=.5 layerOrder=2 slump=2 width=.2 front=.1 pace=.7 run=1.2 volume=-2.5 | nextdoor | duet | Rough low flint, bowed, with ticking sand over it | string
Harp on the last tram | Far rain | pulse=Glassy lockstep=.8 dry=.9 grain=.4 onset=.005 run=1.2 flow=.1 spread=20 grit=.2 layer=.4 layerOrder=4 slump=4 bury=.1 width=.85 front=.1 pace=.9 volume=6 | longplate | spread | Glass plucks that leave a long trail of drops | plucked
Surf from the dunes | Far rain | grain=.2 dry=.6 bury=.35 slope=.9 pace=.3 front=.3 onset=.5 lockstep=.15 layer=.2 layerOrder=1 boom=.2 volume=-4 | surf | fifths | Coarse slow breakers with a low tone rolling in them
Wind on the salt flat | Far rain | grain=.55 dry=.45 bury=.2 slope=.7 pace=.22 onset=.9 lockstep=.2 layer=.95 layerOrder=6 spread=55 width=.5 front=.2 run=2 volume=-3 | thinair | open | Dry wind with a sixth harmonic rising and falling in it | wind
Pines before snow | Far rain | grain=.3 dry=.4 bury=.5 slope=.5 pace=.4 onset=1.4 lockstep=.25 layer=.7 layerOrder=4 width=.8 front=1 run=6 volume=-3 | hall | open | A dark soft rushing with two octaves half heard
Caravan of air | Far rain | pulse=Flint grain=.25 dry=.5 bury=.4 slope=.8 pace=.6 front=1 onset=.7 lockstep=.3 layer=.6 layerOrder=5 boom=.3 volume=1 | backrow | sway | Low rough wind that passes key by key over a boom
Nothing on the line | Far rain | pulse=Squeak grain=.6 dry=.4 bury=.15 slope=.2 onset=.3 lockstep=.15 grit=1 layer=.4 layerOrder=2 slump=1 pace=.7 width=0 | kitchen | longone | Narrow rough noise with a hint of pitch, like a set between stations
Sandstorm at the pane | Far rain | grain=1 dry=.6 grit=1 bury=0 slope=.6 pace=.8 front=1 onset=.4 lockstep=0 layer=.3 layerOrder=8 run=9 volume=-1.5 | pane | open | The finest sand at full roughness, flung across in waves
Glass dust | Far rain | pulse=Glassy grain=.6 dry=.5 grit=.6 bury=.3 slope=.3 onset=.6 lockstep=.3 spread=90 layer=.2 front=.1 pace=.7 run=14 volume=2.5 | airy | far | Bright ground glass, wide apart and glittering softly
Sieve | Far rain | pulse=Flint grain=.4 dry=.9 grit=.9 bury=.2 surge=Slips slope=.5 pace=2.8 onset=.15 lockstep=.1 layer=.5 layerOrder=3 slump=1 width=1 front=.3 run=9 volume=-1.5 | combo | three | Grit shaken nearly three times a second with a twelfth in the frame
Desk of a mapmaker | Far rain | pulse=Squeak grain=.35 dry=.7 grit=.7 bury=.25 slope=.4 pace=.5 onset=.4 lockstep=.3 layer=.3 layerOrder=4 slump=1.5 width=.6 front=0 run=14 volume=-1 | booth | longone | Rubbed papery noise, close, with nasal scraps of a note
Hundred small brooms | Far rain | pulse=Flint grain=.15 dry=.5 grit=1 bury=.35 slope=1 pace=2 front=.5 onset=.2 lockstep=.1 layer=0 slump=.8 width=.9 run=9 volume=0 | worn | three | Low scouring strokes, two a second
Pouring two valleys on | Far rain | bury=.85 dry=.8 grain=.5 onset=1.2 layer=.5 layerOrder=1 lockstep=.3 slope=.4 pace=.3 boom=.4 front=.1 run=14 volume=6 | haze | fifths | Almost only a low murmur left of it, with a boom
Ward at four a.m. | Far rain | bury=.55 dry=.5 grain=.4 onset=1 layer=.6 layerOrder=3 lockstep=.6 spread=30 cluster=2 slope=.25 boom=.3 width=.85 front=.3 pace=.7 run=9 volume=-2.5 | lungs | veil | Covered octaves half in step with soft sand breathing over them
Weather on old film | Far rain | bury=.35 dry=.9 grain=.6 onset=.5 layer=.4 layerOrder=5 lockstep=.2 slope=.1 slump=3 grit=.5 width=.5 run=3 | record | tied | Even patter a little covered, with a fifth harmonic in the chord
Asleep under the eaves | Far rain | bury=.45 dry=1 grain=.7 onset=.4 slump=9 layer=.3 lockstep=.35 spread=45 boom=.3 slope=.6 pace=.5 width=.85 front=1 layerOrder=7 run=3 volume=-5 | mist | answer | Ticking grains that linger for seconds after the key
Lighthouse in rain | Far rain | pulse=Glassy bury=.3 dry=.8 grain=.3 onset=.8 cluster=3 lockstep=.6 spread=30 slope=.9 pace=.4 front=0 layer=.3 boom=.3 width=.35 layerOrder=3 run=14 volume=-4.5 | horizon | open | Three glass groups that sweep up out of the patter and sink again
Patter for two hands | Far rain | onset=.004 run=.3 flow=.02 slump=.8 dry=1 grain=.5 lockstep=.4 spread=30 bury=.1 layer=.5 layerOrder=3 width=.55 front=.1 pace=.7 volume=1 | cell 2.gain=14 | wheel | Short splashes of sand, each with a trace of its twelfth | plucked
Seeds on a snare | Far rain | pulse=Flint onset=.004 run=.25 flow=0 slump=.4 dry=1 grain=.35 lockstep=.2 boom=.3 bury=.35 layer=0 width=.4 layerOrder=6 volume=0 | cell 2.gain=21.5 | pulse | Tiny bursts of grit, dry and quick | drum
Puddle marimba | Far rain | pulse=Wet onset=.004 run=.7 flow=0 slump=2 dry=.7 grain=.45 lockstep=.85 spread=8 grit=.2 layer=.6 layerOrder=2 bury=.1 width=.25 front=.2 pace=.12 volume=6 | stone | changes | Hollow struck notes that splash | keys
Maracas for moths | Far rain | onset=.02 run=.22 flow=0 slump=.5 dry=1 grain=.9 lockstep=.1 bury=.2 layer=.7 layerOrder=4 front=1 pace=.9 volume=-1 | forward 2.gain=18 | wheel | Little shakes of very fine sand with a high overtone | drum
Necklace gives way | Far rain | pulse=Glassy surge=Aftershocks slope=.8 pace=3 onset=.006 run=2 flow=.2 slump=1.5 dry=.9 grain=.5 lockstep=.6 layer=.4 layerOrder=5 width=.3 front=.4 volume=-0.5 | wide | answer | Glass beads that spill, bounce and come to rest | plucked
Downpour on a deep road | Far rain | boom=.8 lockstep=.75 dry=.8 grain=.3 bury=.45 onset=.5 spread=15 layer=.3 layerOrder=1 grit=.3 slope=.3 width=.5 front=.4 pace=.9 run=14 | undertow | deep | A low tone mostly in step and its boom with patter on top | drone
Monsoon harmonium | Far rain | cluster=2 pulse=Flint lockstep=.75 dry=1 grain=.25 bury=.35 onset=.15 spread=20 grit=.4 layer=.5 layerOrder=3 slump=1 front=.8 pace=.18 run=1.2 volume=-4.5 | valve | chorale | Flint octaves, reedy and covered, in full rain | organ
Fifth of drizzle | Far rain | cluster=6 lockstep=.6 dry=.7 grain=.15 bury=.15 onset=.8 spread=30 layer=.3 slope=.4 pace=.4 width=.35 front=.1 layerOrder=6 run=1.2 | tail | veil | Six loose groups, a high fifth glowing in the drizzle | pad
Hail over the nursery | Far rain | cluster=5 pulse=Glassy lockstep=.5 dry=.9 grain=.2 bury=.05 onset=.02 run=3 flow=.5 surge=Aftershocks slope=.6 pace=1.8 layer=.2 slump=2 front=0 layerOrder=1 volume=3.5 | patter | three | Five groups of glass struck by bursts of hail
Ash after the eclipse | Far rain | cluster=4 lockstep=.45 dry=.6 grain=.2 bury=.5 onset=1.4 spread=60 layer=.8 layerOrder=8 slope=.7 pace=.25 boom=.2 grit=.4 front=.1 volume=0 | winter | open | Four loose groups under a lid, an eighth harmonic drifting through | pad
`,
    },
  ],
}
