import { type InstrumentSet } from './set'

// Laid out by what the brush is played as: held wet, written as keys, dotted, drawn low,
// stamped, dipped again, left dry, shaken, swept, and set on stone. Each direction is ten
// corners of the instrument (a brush, a paper, a landing, a register), five to a corner.

export const SET: InstrumentSet = {
  device: 'dry-brush',
  names: {
    script: ['Level', 'Dot', 'Rising hook', 'Falling sweep', 'Trembling', 'Seal'],
    brush: ['Hair', 'Reed pen', 'Broad edge', 'Feather', 'Finger'],
    paper: ['Silk', 'Rice', 'Rough', 'Stone'],
  },
  chains: {
    bare: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Open', params: { clear: 0.2 } }],
      words: ', close and dry',
    },
    blotter: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Muffled' },
        { deviceId: 'stereo-widener', preset: 'Narrow' },
      ],
      words: ', dry, as if under a blotter',
    },
    lamplit: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 2 } },
        { deviceId: 'stereo-detune', preset: 'Faint width' },
      ],
      words: ', close and warm as a lamp',
    },
    daylight: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Bright', params: { air: 3, presence: 1 } },
        { deviceId: 'spread', preset: 'Air only' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1 } },
      ],
      words: ', dry, the air opened to the sides',
    },
    sides: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Wide' },
        { deviceId: 'tamer', preset: 'Gentle' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1 } },
      ],
      words: ', dry and set far apart',
    },
    middle: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Narrow' },
        { deviceId: 'ambient-comp', preset: 'Glue' },
      ],
      words: ', close and in the middle',
    },
    wallup: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 8 } },
      ],
      words: ', held right up front',
    },
    booth: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.16 } }],
      words: ', in a small booth',
    },
    corner: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Keys' },
        { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } },
      ],
      words: ', in the corner of a room',
    },
    desk: {
      effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.45 } }],
      words: ', on a wooden desk',
    },
    inkpot: {
      effects: [{ deviceId: 'vessel', preset: 'Blown bottle', params: { mix: 0.5, air: 0.15 } }],
      words: ', inside an ink bottle',
    },
    waterpot: {
      effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.5 } }],
      words: ', inside a clay water pot',
    },
    kettle: {
      effects: [{ deviceId: 'vessel', preset: 'Kettle', params: { mix: 0.4 } }],
      words: ', down in a kettle',
    },
    tube: {
      effects: [
        { deviceId: 'vessel', preset: 'Glass tube', params: { mix: 0.4 } },
        { deviceId: 'tamer', preset: 'Ringing tones' },
      ],
      words: ', in a tube of glass',
    },
    shell: {
      effects: [
        { deviceId: 'vessel', preset: 'Shell to the ear', params: { mix: 0.45, air: 0.1 } },
      ],
      words: ', held to the ear in a shell',
    },
    tin: {
      effects: [
        { deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.35 } },
        { deviceId: 'ambient-eq', preset: 'Warm' },
      ],
      words: ', in a small tin box',
    },
    reel: {
      effects: [{ deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1 } }],
      words: ', on quarter inch tape',
    },
    cassette: {
      effects: [
        { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.15, wow: 0.5 } },
      ],
      words: ', on a worn cassette',
    },
    blanket: {
      effects: [
        { deviceId: 'tape', preset: 'Under a blanket', params: { hiss: 0.05 } },
        { deviceId: 'stereo-detune', preset: 'Soft halo' },
      ],
      words: ', under a blanket of old tape',
    },
    oxide: {
      effects: [
        { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.15 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1 } },
      ],
      words: ', on crumbling tape',
    },
    wobble: {
      effects: [{ deviceId: 'tape', preset: 'Drifting chorus', params: { mix: 0.6 } }],
      words: ', swaying on a warped reel',
    },
    valve: {
      effects: [{ deviceId: 'analog-drive', preset: 'Triode glow' }],
      words: ', through a warm valve',
    },
    iron: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Iron lows' },
        { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 2 } },
      ],
      words: ', through heavy iron',
    },
    grit: {
      effects: [{ deviceId: 'analog-drive', preset: 'Parallel grit', params: { highCut: 7000 } }],
      words: ', with a little grit alongside',
    },
    console: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Console', params: { drive: 0.5 } },
        { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.12 } },
      ],
      words: ', leaned into a mixing desk',
    },
    fuzz: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { mix: 0.4 } },
        { deviceId: 'ambient-eq', preset: 'Shaded' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1 } },
      ],
      words: ', the edges gone to soft fuzz',
    },
    soften: {
      effects: [
        { deviceId: 'saturator', preset: 'Soft tape warmth' },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: ', softly saturated',
    },
    combo: {
      effects: [{ deviceId: 're-amp', preset: 'Combo in a room', params: { noise: 0 } }],
      words: ', from a loudspeaker in a room',
    },
    pillow: {
      effects: [{ deviceId: 're-amp', preset: 'Pillow speaker', params: { noise: 0, output: 2 } }],
      words: ', from a speaker under a pillow',
    },
    cupboard: {
      effects: [
        { deviceId: 're-amp', preset: 'In the cupboard', params: { noise: 0, room: 0.15 } },
      ],
      words: ', from inside a cupboard',
    },
    bedside: {
      effects: [
        { deviceId: 're-amp', preset: 'Bedside radio', params: { noise: 0 } },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.1 } },
      ],
      words: ', from a bedside radio',
    },
    platform: {
      effects: [
        { deviceId: 're-amp', preset: 'Station platform', params: { noise: 0, room: 0.35 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1 } },
      ],
      words: ', from a station loudspeaker',
    },
    sampler: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Sampler' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1 } },
      ],
      words: ', kept on an early sampler',
    },
    disc: {
      effects: [
        { deviceId: 'vinyl', preset: 'New pressing', params: { crackle: 0.2 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1 } },
      ],
      words: ', on a fresh record',
    },
    parlour: {
      effects: [
        { deviceId: 'vinyl', preset: 'Parlour 78', params: { crackle: 0.2, surface: 0.15 } },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.12 } },
      ],
      words: ', on an old fast record',
    },
    platter: {
      effects: [{ deviceId: 'vinyl', preset: 'Warped', params: { crackle: 0.15, surface: 0.1 } }],
      words: ', on a slow warped record',
    },
    farstation: {
      effects: [
        { deviceId: 'radio', preset: 'Far station', params: { static: 0.12, interference: 0.05 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', from a station far off',
    },
    hotvalve: {
      effects: [{ deviceId: 'patina', preset: 'Hot valve', params: { noise: 0.08 } }],
      words: ', on an old valve machine',
    },
    dusty: {
      effects: [
        { deviceId: 'patina', preset: 'Dusty record', params: { noise: 0.15 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', out of a dusty attic',
    },
    paperbuzz: {
      effects: [{ deviceId: 'buzzing-bridge', preset: 'Paper edge', params: { mix: 0.5 } }],
      words: ', a loose sheet buzzing along',
    },
    grazed: {
      effects: [
        { deviceId: 'buzzing-bridge', preset: 'Open bridge', params: { amount: 0.45, mix: 0.45 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1 } },
      ],
      words: ', grazing a curved bridge',
    },
    skinbuzz: {
      effects: [
        { deviceId: 'buzzing-bridge', preset: 'Tight skin', params: { mix: 0.4 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.1 } },
      ],
      words: ', with a thin skin buzzing along',
    },
    chorused: {
      effects: [{ deviceId: 'chorus', preset: 'Classic chorus', params: { mix: 0.4 } }],
      words: ', gently chorused',
    },
    ensemble: {
      effects: [
        { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.5 } },
        { deviceId: 'spread', preset: 'Wide pad' },
      ],
      words: ', swollen to an ensemble',
    },
    gentletrem: {
      effects: [{ deviceId: 'tremolo', preset: 'Gentle breath' }],
      words: ', breathing slowly in level',
    },
    shimtrem: {
      effects: [
        { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { depth: 0.6 } },
        { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.18 } },
      ],
      words: ', lows and highs swaying in turn',
    },
    amptrem: {
      effects: [
        { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.6 } },
        { deviceId: 're-amp', preset: 'Just the valves', params: { noise: 0 } },
      ],
      words: ", through an amplifier's tremolo",
    },
    chorale: {
      effects: [{ deviceId: 'rotary', preset: 'Chorale' }],
      words: ', on slowly turning speakers',
    },
    farrotor: {
      effects: [
        { deviceId: 'rotary', preset: 'Far shimmer' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', turning far across a room',
    },
    swirl: {
      effects: [{ deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.45 } }],
      words: ', in a slow swirl',
    },
    glacier: {
      effects: [{ deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.5 } }],
      words: ', under a sweep slow as ice',
    },
    flange: {
      effects: [{ deviceId: 'flanger', preset: 'Glacial drift', params: { mix: 0.4 } }],
      words: ', with a slow drift all through',
    },
    standcomb: {
      effects: [
        { deviceId: 'flanger', preset: 'Standing comb', params: { mix: 0.3 } },
        { deviceId: 'tamer', preset: 'Ringing tones' },
      ],
      words: ', ringing like a row of pipes',
    },
    lapping: {
      effects: [{ deviceId: 'glimmer', preset: 'Light on water' }],
      words: ', each band lit in turn like water',
    },
    twinkle: {
      effects: [
        { deviceId: 'glimmer', preset: 'Wide twinkle' },
        { deviceId: 'hall-reverb', preset: 'Faint halo', params: { mix: 0.18 } },
      ],
      words: ', twinkling at the edges',
    },
    longsigh: {
      effects: [
        { deviceId: 'breath', preset: 'Long slow sigh', params: { air: 0.2 } },
        { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.2 } },
      ],
      words: ', in one long sigh after another',
    },
    quietpulse: {
      effects: [
        { deviceId: 'band-pulse', preset: 'Slow low pulse' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', the middle pulsing slowly',
    },
    throb: { effects: [{ deviceId: 'pulses', preset: 'Soft throb' }], words: ', in a soft throb' },
    leftright: {
      effects: [
        { deviceId: 'pulses', preset: 'Left then right' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1 } },
      ],
      words: ', pulsing left, then right',
    },
    singer: {
      effects: [{ deviceId: 'late-vibrato', preset: 'Singer', params: { depth: 20 } }],
      words: ', swaying late like a singer',
    },
    slowbow: {
      effects: [
        { deviceId: 'late-vibrato', preset: 'Slow bow' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', with the late sway of a bow',
    },
    smaller: {
      effects: [{ deviceId: 'size', preset: 'Smaller' }],
      words: ', in a body made smaller',
    },
    giant: {
      effects: [
        { deviceId: 'size', preset: 'Giant', params: { mix: 0.7 } },
        { deviceId: 'ambient-eq', preset: 'Deep' },
      ],
      words: ', in the body of a giant',
    },
    fifthbeside: {
      effects: [
        { deviceId: 'size', preset: 'Fifth beside', params: { mix: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', with the fifth alongside',
    },
    chimed: {
      effects: [{ deviceId: 'warp', preset: 'Soft chime', params: { mix: 0.8 } }],
      words: ', the partials stretched to a chime',
    },
    glassbar: {
      effects: [
        { deviceId: 'warp', preset: 'Glass bar', params: { mix: 0.7 } },
        { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.16 } },
      ],
      words: ', the partials bent like a glass bar',
    },
    gonged: {
      effects: [
        { deviceId: 'warp', preset: 'Sunken gong', params: { mix: 0.7 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
      ],
      words: ', sunk to a gong',
    },
    ringhalo: {
      effects: [{ deviceId: 'ring', preset: 'Faint halo' }],
      words: ', in the halo of a tuned ring',
    },
    ringslow: {
      effects: [
        { deviceId: 'ring', preset: 'Slow pulse', params: { mix: 0.4 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', beating on its root',
    },
    suboct: {
      effects: [{ deviceId: 'octaves', preset: 'Sub octave' }],
      words: ', with the octave underneath',
    },
    flutes: {
      effects: [{ deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.55 } }],
      words: ', pulling out flute stops',
    },
    oldpipes: {
      effects: [
        { deviceId: 'stops', preset: 'Old pipes', params: { mix: 0.45 } },
        { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.2 } },
      ],
      words: ', with old pipes behind',
    },
    tubevowel: {
      effects: [{ deviceId: 'imprint', preset: 'Hollow tube', params: { amount: 0.8 } }],
      words: ', coloured by a hollow tube',
    },
    darkbox: {
      effects: [
        { deviceId: 'imprint', preset: 'Dark box' },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.14 } },
      ],
      words: ', coloured by a dark box',
    },
    hairline: {
      effects: [
        { deviceId: 'scale-filter', preset: 'Open fifths', params: { depth: 18, mix: 0.7 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.16 } },
      ],
      words: ', thinned to a hairline chord',
    },
    onewhistle: {
      effects: [
        { deviceId: 'overtone-singer', preset: 'One held note', params: { root: 0, mix: 0.6 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.18 } },
      ],
      words: ', one held partial whistling',
    },
    soft: {
      effects: [{ deviceId: 'fog', preset: 'Soft cloud', params: { mix: 0.6 } }],
      words: ', blurred to a soft cloud',
    },
    mist: {
      effects: [{ deviceId: 'fog', preset: 'Morning mist', params: { mix: 0.5 } }],
      words: ', behind a morning mist',
    },
    glassfog: {
      effects: [
        { deviceId: 'fog', preset: 'Behind glass', params: { mix: 0.6 } },
        { deviceId: 'stereo-detune', preset: 'Faint width' },
      ],
      words: ', blurred behind glass',
    },
    under: {
      effects: [{ deviceId: 'underwater', preset: 'Just under', params: { bubbles: 0.1 } }],
      words: ', just under the water',
    },
    bath: {
      effects: [
        { deviceId: 'underwater', preset: 'Bathtub', params: { bubbles: 0.15, mix: 0.8 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: ', in a bath of water',
    },
    lightrain: {
      effects: [
        { deviceId: 'weather', preset: 'Light rain', params: { voice: 0.2 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1 } },
      ],
      words: ', out in light rain',
    },
    breezy: {
      effects: [
        { deviceId: 'weather', preset: 'Breezy day', params: { voice: 0.2 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1 } },
      ],
      words: ', out on a breezy day',
    },
    frost: {
      effects: [{ deviceId: 'seasons', preset: 'First frost', params: { turn: 0 } }],
      words: ', under a first frost',
    },
    sun: {
      effects: [{ deviceId: 'seasons', preset: 'Touch of sun', params: { turn: 0 } }],
      words: ', with a touch of sun',
    },
    slap: {
      effects: [{ deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.28 } }],
      words: ', with one short slap of tape',
    },
    repeats: {
      effects: [{ deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.3 } }],
      words: ', with warm repeats behind',
    },
    dotted: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.3, feedback: 0.35 } },
      ],
      words: ', with a dotted echo',
    },
    heads: {
      effects: [{ deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } }],
      words: ', through three tape heads',
    },
    darktrail: {
      effects: [{ deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.32 } }],
      words: ', trailing off in dark echoes',
    },
    bucket: {
      effects: [{ deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.32 } }],
      words: ', with dull echoes after',
    },
    cleanecho: {
      effects: [
        {
          deviceId: 'analog-delay',
          preset: 'Clean echo',
          params: { time: 450, feedback: 0.1, mix: 0.3 },
        },
      ],
      words: ', said once more, plainly',
    },
    fifthhop: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Fifth hop', params: { mix: 0.28, feedback: 0.35 } },
      ],
      words: ', the echo hopping to the fifth',
    },
    fallecho: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Falling tape', params: { mix: 0.3 } },
        { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.14 } },
      ],
      words: ', the echo sagging as it goes',
    },
    skips: {
      effects: [{ deviceId: 'skipping-stone', preset: 'Skipping stone', params: { mix: 0.32 } }],
      words: ', skipping away over water',
    },
    slowskips: {
      effects: [
        { deviceId: 'skipping-stone', preset: 'Slowing bounces', params: { mix: 0.32 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.12 } },
      ],
      words: ', the echoes slowing as they land',
    },
    deepwater: {
      effects: [{ deviceId: 'skipping-stone', preset: 'Deep water', params: { mix: 0.35 } }],
      words: ', sinking in deep water',
    },
    stars: {
      effects: [{ deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.34 } }],
      words: ', scattered in seven echoes',
    },
    points: {
      effects: [
        { deviceId: 'constellation', preset: 'Faint points', params: { mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.16 } },
      ],
      words: ', with faint points of echo',
    },
    ladder: {
      effects: [
        { deviceId: 'constellation', preset: 'Bent ladder', params: { mix: 0.32 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1 } },
      ],
      words: ', echoes on a bent ladder',
    },
    prism: {
      effects: [{ deviceId: 'prism', preset: 'Low to high', params: { mix: 0.35 } }],
      words: ', unfolding from low to high',
    },
    backwards: {
      effects: [{ deviceId: 'reverse-delay', preset: 'Backwards echo', params: { mix: 0.32 } }],
      words: ', answered backwards',
    },
    swells: {
      effects: [
        { deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.35 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.16 } },
      ],
      words: ', the past swelling up behind',
    },
    answer: {
      effects: [{ deviceId: 'canon', preset: 'Faint answer', params: { mix: 0.4 } }],
      words: ', faintly answered in canon',
    },
    recall: {
      effects: [{ deviceId: 'echo-memory', preset: 'Faint recall', params: { mix: 0.4 } }],
      words: ', remembered faintly later',
    },
    twoloops: {
      effects: [
        { deviceId: 'orbits', preset: 'Two voices', params: { mix: 0.32 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.12 } },
      ],
      words: ', turning in two loops',
    },
    crystals: {
      effects: [
        { deviceId: 'grain-delay', preset: 'Crystals', params: { mix: 0.25, feedback: 0.3 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1 } },
      ],
      words: ', throwing up crystals',
    },
    embers: {
      effects: [{ deviceId: 'grain-delay', preset: 'Falling embers', params: { mix: 0.3 } }],
      words: ', shedding falling embers',
    },
    softbed: {
      effects: [{ deviceId: 'micro-looper', preset: 'Soft bed', params: { mix: 0.4 } }],
      words: ', on a soft bed of the same notes',
    },
    cloud: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.45 } }],
      words: ', broken into a soft cloud',
    },
    veil: {
      effects: [
        { deviceId: 'grain-cloud', preset: 'Thin veil', params: { mix: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.16 } },
      ],
      words: ', with a veil of grains',
    },
    glassrain: {
      effects: [{ deviceId: 'cascade', preset: 'Glass rain', params: { mix: 0.3 } }],
      words: ', raining glass',
    },
    leaf: {
      effects: [{ deviceId: 'falling', preset: 'Falling leaves', params: { mix: 0.35 } }],
      words: ', dropping away like leaves',
    },
    sighs: {
      effects: [
        { deviceId: 'falling', preset: 'Slow sighs', params: { mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.16 } },
      ],
      words: ', with slow sighs falling away',
    },
    firstlight: {
      effects: [{ deviceId: 'glints', preset: 'First light', params: { mix: 0.3 } }],
      words: ', catching first light',
    },
    slowstars: {
      effects: [
        { deviceId: 'glints', preset: 'Slow stars', params: { mix: 0.35 } },
        { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.2 } },
      ],
      words: ', with slow stars above',
    },
    hanging: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.5 } }],
      words: ', hanging as a mist',
    },
    haze: {
      effects: [
        { deviceId: 'spectral-blur', preset: 'Faint haze', params: { mix: 0.5 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', in a faint haze',
    },
    glasshalo: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.4 } }],
      words: ', in a halo of glass',
    },
    darkwater: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.5 } }],
      words: ', dissolving in dark water',
    },
    slowcloud: {
      effects: [{ deviceId: 'stretch', preset: 'Slow cloud', params: { mix: 0.4 } }],
      words: ', stretched to a slow cloud behind',
    },
    shadow: {
      effects: [{ deviceId: 'sine-shadow', preset: 'Sine shadow', params: { mix: 0.4 } }],
      words: ', shadowed by pure tones',
    },
    lowshadow: {
      effects: [
        { deviceId: 'sine-shadow', preset: 'Low shadow', params: { mix: 0.35 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.16 } },
      ],
      words: ', over a low shadow of pure tones',
    },
    thinhalo: {
      effects: [{ deviceId: 'sustainer', preset: 'Thin halo', params: { mix: 0.4 } }],
      words: ', held on as a thin halo',
    },
    strpad: {
      effects: [{ deviceId: 'pad-follower', preset: 'String pad', params: { mix: 0.4 } }],
      words: ', a string pad growing behind',
    },
    cellos: {
      effects: [
        { deviceId: 'pad-follower', preset: 'Dark cellos', params: { mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', dark strings growing beneath',
    },
    halfspeed: {
      effects: [{ deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.35 } }],
      words: ', half as fast underneath',
    },
    wintry: {
      effects: [
        { deviceId: 'spectral-drifter', preset: 'Winter drift' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.16 } },
      ],
      words: ', drifting into winter',
    },
    sagging: {
      effects: [{ deviceId: 'melt', preset: 'Candle wax', params: { mix: 0.4 } }],
      words: ', sagging like candle wax',
    },
    softsag: {
      effects: [
        { deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.16 } },
      ],
      words: ', sagging softly with age',
    },
    evaporate: {
      effects: [{ deviceId: 'melt', preset: 'Evaporate', params: { mix: 0.4 } }],
      words: ', evaporating upwards',
    },
    afterimage: {
      effects: [{ deviceId: 'generations', preset: 'Faint afterimage', params: { mix: 0.4 } }],
      words: ', leaving a faint afterimage',
    },
    room: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.24 } }],
      words: ', in a plain room',
    },
    chamber: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.24 } }],
      words: ', in a bright chamber',
    },
    late: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.28 } }],
      words: ', with a hall that answers late',
    },
    splate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.24 } }],
      words: ', on a small plate',
    },
    plate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.28 } }],
      words: ', on a long plate',
    },
    dplate: {
      effects: [
        { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.05 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.28 } },
      ],
      words: ', on a dark plate, slightly worn',
    },
    hall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
      words: ', in a hall',
    },
    darkhall: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Shaded' },
        { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.32 } },
      ],
      words: ', in a dark hall',
    },
    cathedral: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.32 } }],
      words: ', in a cathedral',
    },
    nave: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.34 } }],
      words: ', down a vast nave',
    },
    tunnel: {
      effects: [{ deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.28 } }],
      words: ', along a narrow tunnel',
    },
    openair: {
      effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.34 } }],
      words: ', in a wide open space',
    },
    lowdome: {
      effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.32 } }],
      words: ', under a low dome',
    },
    cellar: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Narrow cellar', params: { mix: 0.32 } }],
      words: ', in a narrow cellar',
    },
    glow: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Faint glow', params: { mix: 0.34 } }],
      words: ', in a faint glow',
    },
    fallfifth: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Falling fifths', params: { mix: 0.28 } }],
      words: ', the tail falling in fifths',
    },
    glimmer: {
      effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.32 } }],
      words: ', with a faint glimmer above',
    },
    choirup: {
      effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.26 } }],
      words: ', the tail rising to a choir',
    },
    organloft: {
      effects: [{ deviceId: 'shimmer', preset: 'Organ loft', params: { mix: 0.26 } }],
      words: ', up in an organ loft',
    },
    undertow: {
      effects: [{ deviceId: 'shimmer', preset: 'Undertow', params: { mix: 0.26 } }],
      words: ', pulled down by an octave of tail',
    },
    ahs: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.3 } }],
      words: ', in a hall that sings ah',
    },
    oos: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.32 } }],
      words: ', with a hall humming behind',
    },
    monks: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.28 } }],
      words: ', in a vault that hums low',
    },
    whispers: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Whispering', params: { mix: 0.28 } }],
      words: ', in a hall that whispers',
    },
    spring: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.26 } }],
      words: ', through a spring',
    },
    slack: {
      effects: [
        { deviceId: 'spring-reverb', preset: 'Slack and strange', params: { mix: 0.26 } },
        { deviceId: 'ambient-eq', preset: 'Warm' },
      ],
      words: ', through a slack spring',
    },
    gated: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.3 } }],
      words: ', in a room cut short',
    },
    cavern: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.3 } }],
      words: ', in a cavern of short echoes',
    },
    mine: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Mine shaft', params: { mix: 0.3 } }],
      words: ', down a mine shaft',
    },
    deepbelow: {
      effects: [{ deviceId: 'spiral', preset: 'Slow descent', params: { mix: 0.3 } }],
      words: ', the tail sinking slowly',
    },
    darkstrings: {
      effects: [
        { deviceId: 'silent-keys', preset: 'Dark strings', params: { mix: 0.35 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1 } },
      ],
      words: ', waking dark strings',
    },
    sympath: {
      effects: [{ deviceId: 'sympathetic', preset: 'Open triad', params: { mix: 0.35 } }],
      words: ', others ringing in sympathy',
    },
    pedal: {
      effects: [
        { deviceId: 'sympathetic', preset: 'Piano pedal', params: { mix: 0.35 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: ', with a pedal held down',
    },
    wool: {
      effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.35 } }],
      words: ', wrapped in wool',
    },
    across: {
      effects: [{ deviceId: 'distance', preset: 'Across the room' }],
      words: ', across the room',
    },
    backhall: {
      effects: [{ deviceId: 'distance', preset: 'Back of the hall', params: { level: 0.5 } }],
      words: ', from the back of the hall',
    },
    farshore: {
      effects: [{ deviceId: 'distance', preset: 'Far shore', params: { level: 0.4 } }],
      words: ', from a far shore',
    },
    nextdoor: {
      effects: [{ deviceId: 'distance', preset: 'Next door', params: { level: 0.5 } }],
      words: ', from next door',
    },
    circle: {
      effects: [{ deviceId: 'around', preset: 'Slow circle' }],
      words: ', circling slowly round you',
    },
    pendulum: {
      effects: [
        { deviceId: 'around', preset: 'Wide pendulum' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', swinging wide like a pendulum',
    },
    twobirds: {
      effects: [{ deviceId: 'murmuration', preset: 'Two close by' }],
      words: ', with two others close by',
    },
    bowlhalo: {
      effects: [{ deviceId: 'bowls', preset: 'Faint halo', params: { mix: 0.35 } }],
      words: ', with metal bowls awake nearby',
    },
    lowbowls: {
      effects: [{ deviceId: 'bowls', preset: 'Low fifths', params: { mix: 0.3 } }],
      words: ', over low bowls in fifths',
    },
    valley: {
      effects: [
        { deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 1 } },
      ],
      words: ', over an open valley',
    },
    breathverb: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.3 } }],
      words: ', in a hall that breathes',
    },
    cave: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } }],
      words: ', in a dark cave',
    },
    latearrive: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Late arrival', params: { mix: 0.34 } }],
      words: ', the room arriving late',
    },
    gatelp: {
      effects: [{ deviceId: 'auto-filter', preset: 'Low-pass gate' }],
      words: ', closing as each note dies',
    },
    dubsweep: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Dub sweep', params: { mix: 0.6 } },
        { deviceId: 'tape-echo', preset: 'Faint trace', params: { mix: 0.25 } },
      ],
      words: ', swept slowly by a filter',
    },
    sitting: {
      effects: [{ deviceId: 'sympathetic', preset: 'Centre drone', params: { mix: 0.3 } }],
      words: ', over a sitting drone of strings',
    },
    pedalpipe: {
      effects: [
        { deviceId: 'stops', preset: 'Pedal under', params: { mix: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.18 } },
      ],
      words: ', over a pedal pipe',
    },
    icefilter: {
      effects: [{ deviceId: 'auto-filter', preset: 'Glacial low-pass' }],
      words: ', under a filter that moves like ice',
    },
    frozen: {
      effects: [
        { deviceId: 'sustainer', preset: 'Frozen moment', params: { mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.16 } },
      ],
      words: ', one moment frozen',
    },
    drifter: {
      effects: [
        { deviceId: 'spectral-drifter', preset: 'Fifth above' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.16 } },
      ],
      words: ', the tail drifting up in fifths',
    },
    losing: {
      effects: [{ deviceId: 'winding-down', preset: 'Soft losing pace' }],
      words: ', the pulse always losing pace',
    },
    onceasec: {
      effects: [{ deviceId: 'band-pulse', preset: 'One a second' }],
      words: ', the middle pulsing once a second',
    },
    flock: {
      effects: [
        { deviceId: 'murmuration', preset: 'Evening flock', params: { mix: 0.45 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.16 } },
      ],
      words: ', gone up as a flock at evening',
    },
    topad: {
      effects: [
        { deviceId: 'swell', preset: 'Piano to pad' },
        { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.25 } },
      ],
      words: ', each stroke drawn into a pad',
    },
    felted: {
      effects: [{ deviceId: 'sift', preset: 'Felt and air' }],
      words: ', the strikes felted and the air spread',
    },
    heldstrings: {
      effects: [{ deviceId: 'silent-keys', preset: 'Open fifth and bass', params: { mix: 0.35 } }],
      words: ', waking strings held underneath',
    },
    loop: {
      effects: [
        { deviceId: 'tape-loop', preset: 'Slow fade', params: { mix: 0.35, feedback: 0.6 } },
      ],
      words: ', laid on a slow loop of tape',
    },
    tiles: {
      effects: [
        { deviceId: 'cascade', preset: 'Slow tiles', params: { mix: 0.3 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', tiled in slow octaves',
    },
    hightrails: {
      effects: [
        { deviceId: 'grain-delay', preset: 'Faint glints', params: { mix: 0.35 } },
        { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.16 } },
      ],
      words: ', faint glints trailing',
    },
    lowtide: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Low tide', params: { mix: 0.35 } }],
      words: ', with a low tide of grains',
    },
    choirgrain: {
      effects: [
        { deviceId: 'grain-cloud', preset: 'Choir of fifths', params: { mix: 0.3 } },
        { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.18 } },
      ],
      words: ', in grains a fifth apart',
    },
    revverb: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.3 } }],
      words: ', in a room that swells backwards',
    },
    longspring: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.26 } }],
      words: ', down three long springs',
    },
    faintlift: {
      effects: [{ deviceId: 'spiral', preset: 'Faint lift', params: { mix: 0.34 } }],
      words: ', the tail slowly lifting',
    },
    notch: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Slow notch' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', a slow notch passing through',
    },
    barber: {
      effects: [
        { deviceId: 'freq-shifter', preset: 'Barber pole', params: { mix: 0.3 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.15 } },
      ],
      words: ', climbing a slow spiral',
    },
    whistled: {
      effects: [
        { deviceId: 'overtone-singer', preset: 'Slow wander', params: { root: 0, mix: 0.7 } },
      ],
      words: ', a whistle wandering in the partials',
    },
    thump: { effects: [{ deviceId: 'tape', preset: 'Warm thump' }], words: ', thick on slow tape' },
    tails: { effects: [{ deviceId: 'lift', preset: 'Long tails' }], words: ', the tails lifted' },
    octcanon: {
      effects: [
        { deviceId: 'canon', preset: 'Octave shadow', params: { mix: 0.35 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', shadowed an octave off',
    },
    slowtide: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Slow tide', params: { mix: 0.32 } }],
      words: ', in a tail with slow tides',
    },
    quickswell: {
      effects: [{ deviceId: 'expanse', preset: 'Quick swell', params: { mix: 0.34 } }],
      words: ', with a space that swells in',
    },
    hollow: {
      effects: [{ deviceId: 'chorus', preset: 'Hollow swell', params: { mix: 0.45 } }],
      words: ', through a hollow slow comb',
    },
    folded: {
      effects: [
        { deviceId: 'saturator', preset: 'Folded glass', params: { driveDb: 6, mix: 0.35 } },
        { deviceId: 'ambient-eq', preset: 'Shaded' },
      ],
      words: ', the peaks folded over',
    },
    slowpan: {
      effects: [{ deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.75 } }],
      words: ', crossing slowly from side to side',
    },
    onewheel: {
      effects: [
        { deviceId: 'currents', preset: 'One slow wheel', params: { depth: 0.7 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.18 } },
      ],
      words: ', wheeling slowly round',
    },
    endlessfall: {
      effects: [
        { deviceId: 'phaser', preset: 'Endless fall', params: { mix: 0.4 } },
        { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { mix: 0.15 } },
      ],
      words: ', the colours falling without end',
    },
    keyed: {
      effects: [{ deviceId: 'scale-filter', preset: 'Wide and gentle' }],
      words: ', sifted to the notes of the key',
    },
    nearshadow: {
      effects: [
        { deviceId: 'stretch', preset: 'Near shadow', params: { mix: 0.4 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', with a stretched shadow nearby',
    },
    revbed: {
      effects: [
        { deviceId: 'micro-looper', preset: 'Reverse bed', params: { mix: 0.4 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.16 } },
      ],
      words: ', on a bed of the same notes reversed',
    },
    faintwarm: {
      effects: [{ deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.35 } }],
      words: ', melting into a warm wall',
    },
  },
  phrases: {
    wash: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 48, gain: 0.55 },
        { atSec: 0, durSec: 7.2, note: 55, gain: 0.45 },
        { atSec: 0.8, durSec: 6.4, note: 64, gain: 0.5 },
        { atSec: 1.8, durSec: 5.4, note: 71, gain: 0.45 },
        { atSec: 3.2, durSec: 4, note: 74, gain: 0.45 },
      ],
    },
    suspend: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 50, gain: 0.5 },
        { atSec: 0, durSec: 7.2, note: 62, gain: 0.5 },
        { atSec: 0.3, durSec: 2.9, note: 67, gain: 0.55 },
        { atSec: 3.2, durSec: 3.9, note: 65, gain: 0.5 },
        { atSec: 4, durSec: 3.3, note: 69, gain: 0.45 },
      ],
    },
    turnto: {
      notes: [
        { atSec: 0, durSec: 3.5, note: 45, gain: 0.55 },
        { atSec: 0, durSec: 3.5, note: 60, gain: 0.45 },
        { atSec: 0.3, durSec: 3.2, note: 64, gain: 0.45 },
        { atSec: 0.6, durSec: 2.9, note: 67, gain: 0.5 },
        { atSec: 3.7, durSec: 3.6, note: 41, gain: 0.55 },
        { atSec: 3.7, durSec: 3.6, note: 60, gain: 0.45 },
        { atSec: 3.9, durSec: 3.4, note: 64, gain: 0.45 },
        { atSec: 4.2, durSec: 3.1, note: 69, gain: 0.5 },
      ],
    },
    highwash: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 60, gain: 0.45 },
        { atSec: 0.5, durSec: 6.7, note: 67, gain: 0.45 },
        { atSec: 1.5, durSec: 5.7, note: 76, gain: 0.45 },
        { atSec: 3, durSec: 4.2, note: 79, gain: 0.4 },
        { atSec: 4.5, durSec: 2.7, note: 83, gain: 0.35 },
      ],
    },
    letters: {
      notes: [
        { atSec: 0, durSec: 3.4, note: 48, gain: 0.5 },
        { atSec: 0, durSec: 0.8, note: 72, gain: 0.7 },
        { atSec: 0.9, durSec: 0.9, note: 71, gain: 0.55 },
        { atSec: 1.8, durSec: 1.8, note: 67, gain: 0.6 },
        { atSec: 3.7, durSec: 3.4, note: 45, gain: 0.5 },
        { atSec: 3.7, durSec: 1, note: 69, gain: 0.65 },
        { atSec: 4.7, durSec: 0.8, note: 72, gain: 0.55 },
        { atSec: 5.6, durSec: 1.7, note: 64, gain: 0.6 },
      ],
    },
    reply: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 64, gain: 0.7 },
        { atSec: 0.55, durSec: 0.5, note: 67, gain: 0.6 },
        { atSec: 1.1, durSec: 1.2, note: 71, gain: 0.7 },
        { atSec: 2.4, durSec: 1.6, note: 57, gain: 0.5 },
        { atSec: 2.4, durSec: 1.6, note: 62, gain: 0.45 },
        { atSec: 4, durSec: 0.5, note: 62, gain: 0.7 },
        { atSec: 4.55, durSec: 0.5, note: 65, gain: 0.6 },
        { atSec: 5.1, durSec: 1.2, note: 69, gain: 0.65 },
        { atSec: 6, durSec: 1.4, note: 53, gain: 0.5 },
        { atSec: 6, durSec: 1.4, note: 60, gain: 0.45 },
      ],
    },
    ostin: {
      notes: [
        { atSec: 0, durSec: 0.45, note: 57, gain: 0.65 },
        { atSec: 0.5, durSec: 0.45, note: 64, gain: 0.5 },
        { atSec: 1, durSec: 0.45, note: 60, gain: 0.6 },
        { atSec: 1.5, durSec: 0.45, note: 67, gain: 0.5 },
        { atSec: 2, durSec: 0.45, note: 57, gain: 0.65 },
        { atSec: 2.5, durSec: 0.45, note: 64, gain: 0.5 },
        { atSec: 3, durSec: 0.45, note: 62, gain: 0.6 },
        { atSec: 3.5, durSec: 0.45, note: 69, gain: 0.5 },
        { atSec: 4, durSec: 0.45, note: 55, gain: 0.65 },
        { atSec: 4.5, durSec: 0.45, note: 62, gain: 0.5 },
        { atSec: 5, durSec: 0.45, note: 59, gain: 0.6 },
        { atSec: 5.5, durSec: 1.8, note: 67, gain: 0.55 },
      ],
    },
    dabs: {
      notes: [
        { atSec: 0, durSec: 0.2, note: 69, gain: 0.75 },
        { atSec: 0.9, durSec: 0.2, note: 64, gain: 0.6 },
        { atSec: 1.5, durSec: 0.2, note: 76, gain: 0.55 },
        { atSec: 2.7, durSec: 0.2, note: 57, gain: 0.75 },
        { atSec: 3.3, durSec: 0.2, note: 72, gain: 0.6 },
        { atSec: 4.6, durSec: 0.2, note: 67, gain: 0.65 },
        { atSec: 5.1, durSec: 0.2, note: 60, gain: 0.6 },
        { atSec: 6.2, durSec: 0.6, note: 50, gain: 0.7 },
      ],
    },
    rain: {
      notes: [
        { atSec: 0, durSec: 0.12, note: 81, gain: 0.55 },
        { atSec: 0.35, durSec: 0.12, note: 76, gain: 0.5 },
        { atSec: 0.5, durSec: 0.12, note: 72, gain: 0.6 },
        { atSec: 1.1, durSec: 0.12, note: 79, gain: 0.5 },
        { atSec: 1.75, durSec: 0.12, note: 74, gain: 0.55 },
        { atSec: 1.9, durSec: 0.12, note: 67, gain: 0.6 },
        { atSec: 2.6, durSec: 0.12, note: 84, gain: 0.45 },
        { atSec: 3, durSec: 0.12, note: 72, gain: 0.6 },
        { atSec: 3.7, durSec: 0.12, note: 69, gain: 0.55 },
        { atSec: 3.95, durSec: 0.12, note: 76, gain: 0.5 },
        { atSec: 4.8, durSec: 0.12, note: 64, gain: 0.65 },
        { atSec: 5.2, durSec: 0.12, note: 79, gain: 0.45 },
        { atSec: 6, durSec: 0.4, note: 60, gain: 0.65 },
      ],
    },
    fallarp: {
      notes: [
        { atSec: 0, durSec: 1.2, note: 76, gain: 0.7 },
        { atSec: 0.4, durSec: 1.2, note: 71, gain: 0.6 },
        { atSec: 0.8, durSec: 1.2, note: 67, gain: 0.6 },
        { atSec: 1.2, durSec: 1.2, note: 64, gain: 0.6 },
        { atSec: 1.6, durSec: 2, note: 48, gain: 0.65 },
        { atSec: 3.6, durSec: 1.2, note: 74, gain: 0.7 },
        { atSec: 4, durSec: 1.2, note: 69, gain: 0.6 },
        { atSec: 4.4, durSec: 1.2, note: 65, gain: 0.6 },
        { atSec: 4.8, durSec: 1.2, note: 60, gain: 0.6 },
        { atSec: 5.2, durSec: 2, note: 41, gain: 0.65 },
      ],
    },
    lowline: {
      notes: [
        { atSec: 0, durSec: 1.5, note: 36, gain: 0.7 },
        { atSec: 1.6, durSec: 1, note: 43, gain: 0.6 },
        { atSec: 2.7, durSec: 1.4, note: 41, gain: 0.65 },
        { atSec: 4.2, durSec: 1, note: 38, gain: 0.6 },
        { atSec: 5.3, durSec: 1.9, note: 36, gain: 0.7 },
      ],
    },
    lowpulse: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 33, gain: 0.75 },
        { atSec: 0.9, durSec: 0.3, note: 33, gain: 0.55 },
        { atSec: 1.8, durSec: 0.5, note: 40, gain: 0.65 },
        { atSec: 2.7, durSec: 0.3, note: 45, gain: 0.55 },
        { atSec: 3.6, durSec: 0.5, note: 31, gain: 0.75 },
        { atSec: 4.5, durSec: 0.3, note: 31, gain: 0.55 },
        { atSec: 5.4, durSec: 0.5, note: 38, gain: 0.65 },
        { atSec: 6.3, durSec: 0.9, note: 43, gain: 0.6 },
      ],
    },
    lowlong: {
      notes: [
        { atSec: 0, durSec: 3.5, note: 43, gain: 0.7 },
        { atSec: 1.2, durSec: 2.3, note: 55, gain: 0.45 },
        { atSec: 3.7, durSec: 3.5, note: 48, gain: 0.7 },
        { atSec: 5, durSec: 2.2, note: 55, gain: 0.45 },
      ],
    },
    lowwalk: {
      notes: [
        { atSec: 0, durSec: 0.8, note: 45, gain: 0.7 },
        { atSec: 0.9, durSec: 0.8, note: 48, gain: 0.6 },
        { atSec: 1.8, durSec: 0.8, note: 50, gain: 0.65 },
        { atSec: 2.7, durSec: 0.8, note: 47, gain: 0.6 },
        { atSec: 3.6, durSec: 1.4, note: 43, gain: 0.75 },
        { atSec: 5.2, durSec: 0.6, note: 45, gain: 0.6 },
        { atSec: 5.9, durSec: 1.4, note: 48, gain: 0.7 },
      ],
    },
    toll: {
      notes: [
        { atSec: 0, durSec: 2.4, note: 60, gain: 0.7 },
        { atSec: 2.4, durSec: 2.2, note: 67, gain: 0.55 },
        { atSec: 2.4, durSec: 2.2, note: 50, gain: 0.55 },
        { atSec: 4.8, durSec: 2.4, note: 64, gain: 0.6 },
        { atSec: 4.8, durSec: 2.4, note: 57, gain: 0.45 },
      ],
    },
    highbells: {
      notes: [
        { atSec: 0, durSec: 0.6, note: 84, gain: 0.5 },
        { atSec: 0.7, durSec: 0.6, note: 79, gain: 0.55 },
        { atSec: 1.5, durSec: 0.6, note: 88, gain: 0.45 },
        { atSec: 2.9, durSec: 0.6, note: 83, gain: 0.5 },
        { atSec: 3.6, durSec: 0.6, note: 76, gain: 0.55 },
        { atSec: 4.4, durSec: 0.6, note: 81, gain: 0.5 },
        { atSec: 5.8, durSec: 1, note: 72, gain: 0.6 },
      ],
    },
    change: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 76, gain: 0.6 },
        { atSec: 0.55, durSec: 0.5, note: 74, gain: 0.55 },
        { atSec: 1.1, durSec: 0.5, note: 72, gain: 0.6 },
        { atSec: 1.65, durSec: 0.5, note: 71, gain: 0.55 },
        { atSec: 2.2, durSec: 0.9, note: 67, gain: 0.65 },
        { atSec: 3.6, durSec: 0.5, note: 74, gain: 0.6 },
        { atSec: 4.15, durSec: 0.5, note: 76, gain: 0.55 },
        { atSec: 4.7, durSec: 0.5, note: 71, gain: 0.6 },
        { atSec: 5.25, durSec: 0.5, note: 72, gain: 0.55 },
        { atSec: 5.8, durSec: 1.2, note: 64, gain: 0.65 },
      ],
    },
    fifth: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 36, gain: 0.6 },
        { atSec: 0.6, durSec: 6.6, note: 43, gain: 0.5 },
        { atSec: 2.2, durSec: 5, note: 55, gain: 0.4 },
        { atSec: 4, durSec: 3.2, note: 62, gain: 0.35 },
      ],
    },
    openfifth: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 45, gain: 0.55 },
        { atSec: 0.5, durSec: 6.7, note: 52, gain: 0.5 },
        { atSec: 2.5, durSec: 4.7, note: 64, gain: 0.4 },
        { atSec: 4.6, durSec: 2.6, note: 71, gain: 0.35 },
      ],
    },
    onenote: { notes: [{ atSec: 0, durSec: 7.2, note: 50, gain: 0.65 }] },
    field: {
      notes: [
        { atSec: 0, durSec: 2.8, note: 53, gain: 0.6 },
        { atSec: 1.6, durSec: 2.8, note: 67, gain: 0.5 },
        { atSec: 3.2, durSec: 3, note: 60, gain: 0.55 },
        { atSec: 5, durSec: 2.3, note: 74, gain: 0.45 },
      ],
    },
    song: {
      notes: [
        { atSec: 0, durSec: 1.3, note: 64, gain: 0.65 },
        { atSec: 1.35, durSec: 0.6, note: 65, gain: 0.55 },
        { atSec: 2, durSec: 1.6, note: 67, gain: 0.65 },
        { atSec: 3.7, durSec: 0.7, note: 64, gain: 0.6 },
        { atSec: 4.4, durSec: 0.9, note: 60, gain: 0.55 },
        { atSec: 5.3, durSec: 1.9, note: 62, gain: 0.65 },
      ],
    },
    duet: {
      notes: [
        { atSec: 0, durSec: 2.3, note: 57, gain: 0.5 },
        { atSec: 0, durSec: 2.3, note: 72, gain: 0.55 },
        { atSec: 2.4, durSec: 2.3, note: 59, gain: 0.5 },
        { atSec: 2.4, durSec: 2.3, note: 67, gain: 0.55 },
        { atSec: 4.8, durSec: 2.4, note: 60, gain: 0.5 },
        { atSec: 4.8, durSec: 2.4, note: 64, gain: 0.55 },
      ],
    },
    choir: {
      notes: [
        { atSec: 0, durSec: 2.3, note: 48, gain: 0.5 },
        { atSec: 0, durSec: 2.3, note: 55, gain: 0.45 },
        { atSec: 0, durSec: 2.3, note: 64, gain: 0.5 },
        { atSec: 0, durSec: 2.3, note: 72, gain: 0.5 },
        { atSec: 2.4, durSec: 2.2, note: 41, gain: 0.5 },
        { atSec: 2.4, durSec: 2.2, note: 57, gain: 0.4 },
        { atSec: 2.4, durSec: 2.2, note: 65, gain: 0.45 },
        { atSec: 2.4, durSec: 2.2, note: 72, gain: 0.5 },
        { atSec: 4.7, durSec: 2.6, note: 43, gain: 0.5 },
        { atSec: 4.7, durSec: 2.6, note: 55, gain: 0.4 },
        { atSec: 4.7, durSec: 2.6, note: 62, gain: 0.45 },
        { atSec: 4.7, durSec: 2.6, note: 71, gain: 0.5 },
      ],
    },
  },
  directions: [
    {
      id: 'wet-pads',
      name: 'Wet pads',
      category: 'pad',
      rows: `
First wet light          | Wet level pad     | ink=.85 attack=.6 release=3 shade=.75 spread=8 redip=0.12 tailLean=-15 pressure=0.66 | hall | wash | A full hair brush drawn wide and wet over silk
Hand resting on silk     | -                 | ink=.7 pressure=.08 shade=.3 attack=1.5 release=4 width=1 volume=-1.5 dryness=.1 tail=.8 spread=12 redip=0.15 tailLean=-30 | veil | suspend | A light touch of dark ink on silk that opens slowly
Filled at the spring     | -                 | redip=.55 ink=.4 dryness=.6 attack=.9 release=2 spread=20 volume=-2.5 speed=.6 grain=0.55 tailLean=-90 | swells | turnto | Hair strokes on silk that run dry and are filled again
Scroll rolled out wide   | Wet level pad     | spread=34 width=1 pressure=.85 attack=.4 shade=.65 release=2 volume=0 redip=.35 ink=.7 dryness=0.5 tailLean=-70 | ensemble | choir | A hair brush pressed open, its hairs far out of tune
Lamp at the writing desk | -                 | pressure=.4 shade=.04 string=0 bleed=.1 release=.7 attack=.3 width=.5 volume=-4 tail=.1 grain=.05 dryness=0.05 tailLean=-50 | lamplit | wash | Very dark ink pressed lightly on silk, with hardly a stain
Round thumb of water     | Rice paper dots   | script=Level attack=.8 release=2.5 ink=.9 bleed=.5 spread=22 shade=.35 volume=-8.5 pressure=.95 string=.55 speed=.7 grain=.1 redip=0.25 | darkhall | suspend | A wet finger pressed on rice paper over a string, round and low in colour
Skin of milk             | -                 | brush=Finger paper=Silk pressure=.1 shade=.7 attack=2.2 release=5 string=0 spread=14 volume=-3.5 grain=0 tail=.8 tailLean=-90 lean=40 redip=0.2 | glassfog | highwash | A fingertip hardly touching silk, pale and slow
Print that will not dry  | -                 | brush=Finger paper=Rice ink=1 bleed=1 soak=14 attack=.5 release=.6 shade=0.8 volume=-13.5 redip=.5 spread=26 speed=1 dryness=0 tailLean=-30 pressure=.9 string=0.1 | bare | turnto | A soaked fingertip on rice, wetted again, whose stain outweighs the stroke
Warm palm on paper       | -                 | brush=Finger paper=Rough pressure=.9 grain=.5 attack=.35 shade=.4 ink=.8 dryness=.1 width=0.3 volume=-3.5 redip=0.15 tailLean=-40 | soften | choir | A finger pressed hard on rough paper, its tooth heard in it
Rim of the water bowl    | Glass rim line    | attack=1.4 spread=14 release=4 speed=.5 volume=-4.5 redip=.2 string=0 pressure=.6 dryness=0 | lowbowls | highwash | A wet finger drawn round stone until it sings
House painter at dusk    | Broad edge bass   | attack=.7 release=2.5 ink=.8 shade=.6 width=.9 bleed=.5 tail=.5 lean=0 volume=-3 dryness=.6 string=.1 redip=0.4 tailLean=-40 | across | wash | A broad edge dragged wet over silk, thick and low
Wall washed in umber     | -                 | brush=Broad_edge paper=Rough pressure=.75 attack=1.2 release=3 grain=.6 ink=.9 spread=12 redip=.3 tail=.7 dryness=0.1 lean=20 | wool | choir | A broad edge on rough paper, loaded and grainy
Slow cart of hay         | -                 | brush=Broad_edge paper=Rice shade=.2 attack=.5 bleed=.8 soak=8 release=1.5 volume=-6 redip=0.15 lean=0 | lowshadow | turnto | A broad edge in dark ink on rice, sinking in
Plank by plank           | -                 | brush=Broad_edge paper=Silk string=.6 speed=.6 attack=.25 pressure=.6 release=1.2 spread=3 volume=-2 dryness=.1 width=.4 redip=0.5 tailLean=-40 | desk | choir | A broad edge rubbing the string under the silk as it goes
Whitewashed corridor     | -                 | brush=Broad_edge paper=Stone pressure=.3 shade=.85 attack=1 release=4 ink=.7 volume=0 redip=0.15 tailLean=-50 | tunnel | suspend | A broad edge lightly held on stone in pale ink
Down of the owl          | Feather sweeps    | script=Level lean=0 tailLean=0 attack=1.2 release=3 speed=.3 volume=-2 dryness=.1 spread=18 grain=.1 redip=.2 pressure=0.35 | nave | wash | Feathers laid level on silk, half of each a breath
Under the eiderdown      | -                 | brush=Feather paper=Rice pressure=.6 shade=.3 attack=.8 grain=.1 bleed=.7 release=2 volume=-3 dryness=0.15 tailLean=-15 redip=0.3 | pillow | choir | A soft feather on rice paper, close and dark
Curtain in the draught   | -                 | brush=Feather paper=Silk speed=0.85 grain=.35 attack=1.5 ink=.5 width=1 release=3 volume=-5 tail=.7 dryness=0.55 redip=0.5 shade=0.2 | slowcloud | suspend | A feather moved quickly over silk, its rubbing a wind
Grey goose at rest       | -                 | brush=Feather paper=Rough ink=.9 pressure=.9 attack=.6 shade=.6 spread=26 release=2 volume=-8 redip=.45 string=.1 grain=0.12 tailLean=-70 | valley | turnto | A wet feather pressed wide on rough paper
Meadow after the fire    | -                 | brush=Feather paper=Stone attack=2 release=6 ink=.6 bleed=.9 soak=9 shade=.9 volume=-0.5 pressure=.1 tail=1 tailLean=500 redip=.3 spread=24 lean=-60 | slowtide | highwash | A pale feather on stone with a deep stain, its last hairs floating up
Reeds standing in water  | -                 | brush=Reed_pen paper=Rice attack=.6 release=1.6 shade=.3 pressure=.5 ink=.9 bleed=.5 volume=-2 dryness=0 redip=0.25 | organloft | choir | A reed pen held on rice paper, hollow and mild | organ
Chapel of rushes         | -                 | brush=Reed_pen paper=Silk attack=.15 release=.6 ink=1 dryness=0 shade=.35 spread=2 bleed=.2 volume=-3 grain=0 tail=0 lean=15 pressure=0.75 | oldpipes | choir | A full reed pen held on silk, plain as a pipe | organ
Marsh light              | -                 | brush=Reed_pen paper=Rough attack=1.5 release=3 dryness=.5 spread=18 shade=.25 grain=.4 volume=6 redip=0.2 tailLean=-50 | swirl | suspend | A reed pen on rough paper in dark ink, its hairs apart
Windows along the canal  | -                 | brush=Reed_pen paper=Stone pressure=.25 attack=.9 release=3 shade=.5 lean=0 volume=1 dryness=.1 spread=14 redip=.25 grain=0.46 tailLean=-40 | glimmer | wash | A reed pen held lightly on stone, hollow and ringing
Smoke from the reed hut  | -                 | brush=Reed_pen paper=Rice speed=.7 attack=.4 bleed=1 soak=6 string=.1 shade=.4 volume=-0.5 dryness=0.5 tailLean=-15 redip=0.35 | cloud | turnto | A reed pen run quickly over rice that drinks most of it
Strings under the sheet  | Stroked strings   | attack=.5 release=2 spread=9 volume=-2 redip=0.12 tailLean=-50 | plate | suspend | A hair brush rubbing the strings under silk | string
Four bows on rice        | Stroked strings   | paper=Rice attack=.9 speed=.35 shade=.4 ink=.9 release=2.5 bleed=.7 volume=-9 spread=16 pressure=.8 redip=.2 tail=0.75 lean=-45 | slowbow | choir | Strings rubbed slowly through rice paper, soft and dark | string
Paste under the nails    | Stroked strings   | paper=Rough pressure=1 grain=.45 attack=.15 release=.5 width=.4 volume=-4 redip=0.15 tailLean=-50 ink=.3 dryness=.9 string=1 spread=24 shade=.35 | grazed | choir | Strings rubbed hard through rough paper, near at hand | string
Finger on a wet string   | -                 | brush=Finger string=.95 paper=Silk speed=.7 attack=.8 release=1.4 shade=.6 lean=-10 volume=1.5 dryness=0 redip=0.15 | thinhalo | wash | A finger stroking the string until little else is heard | string
Feathered bows           | -                 | brush=Feather string=.75 paper=Stone speed=.5 attack=1.4 release=3.5 bleed=.6 spread=12 volume=-1.5 redip=.3 dryness=.6 grain=0.06 tailLean=-30 pressure=0.62 shade=.35 | ahs | suspend | Feathers stroking strings over stone | string
Sun over the ridge       | Hooks on silk     | speed=.1 attack=.6 release=3 volume=-1 ink=1 spread=14 grain=.1 width=0.5 redip=0.2 | sun | wash | Hair strokes that start thin and swell to a hook
Swell under the quay     | Hooks on silk     | brush=Broad_edge speed=.06 pressure=.8 shade=.35 lean=-40 tailLean=0 volume=-5 redip=.2 dryness=.1 grain=0.06 width=0.3 | undertow | choir | A broad edge on silk that swells slowly from nothing
Cloud caught on a peak   | Hooks on silk     | brush=Feather paper=Rice speed=.2 bleed=.8 attack=.8 lean=0 width=1 volume=1 dryness=0.2 redip=0.4 | drifter | suspend | Feathers on rice that rise to a soft hook
Swing over the river     | Hooks on silk     | brush=Finger paper=Stone speed=.6 lean=-300 spread=22 tailLean=0 shade=.7 volume=2.5 pressure=.95 grain=.4 dryness=0.2 redip=0.15 | pendulum | highwash | A finger on stone that slides up from a third below as it swells
Sail filling             | Hooks on silk     | brush=Reed_pen speed=.12 shade=.35 attack=.4 release=1.2 lean=-25 tailLean=0 volume=-5 string=.5 spread=22 pressure=1 redip=.3 dryness=.6 grain=.4 width=0.75 | valve | turnto | A reed pen on silk that swells slowly and is dipped as it goes
Stain left overnight     | Ink soaking in    | soak=12 release=2 attack=.4 pressure=1 shade=.35 spread=24 grain=0.04 tailLean=-40 | hanging | turnto | Dark broad seals on rice that the paper drinks until only stain is left
Tea through the cloth    | Ink soaking in    | script=Level brush=Hair ink=.9 attack=1 soak=7 shade=.4 volume=-18.5 redip=0.3 tailLean=-40 | bath | wash | Hair strokes on rice soaking slowly through
Under the last coat      | Ink soaking in    | script=Falling_sweep brush=Finger paper=Rough soak=10 speed=.3 ink=.8 shade=.5 volume=-1 grain=0.06 tailLean=-40 redip=0.2 | softsag | suspend | Finger sweeps on rough paper that fade into their own stain
Ghost of a letter        | Ink soaking in    | brush=Reed_pen paper=Silk attack=.1 soak=16 ink=1 shade=.45 release=3 volume=3 grain=0.14 width=0.5 | recall | turnto | Reed pen seals on silk, each leaving its stain to sound on
Slow grey lichen         | Ink soaking in    | script=Level brush=Feather paper=Stone attack=2 soak=18 ink=.6 shade=.7 spread=20 volume=-4 dryness=0.7 redip=0.5 | darkwater | highwash | A feather held on stone while its stain spreads
Crowd behind the screen  | -                 | spread=52 width=1 attack=1 release=3 pressure=1 ink=.9 shade=.25 bleed=.9 volume=-1 script=Trembling speed=.3 dryness=0.15 redip=0.12 | oos | choir | Hairs a quarter tone apart on silk, thick, dark and slowly shaking
Two dozen candles        | -                 | brush=Finger spread=45 paper=Rice attack=.6 shade=.8 release=2 bleed=.2 volume=-1 redip=.3 pressure=.2 grain=.1 dryness=0.05 tailLean=-15 | glow | highwash | Fingertips on rice set far out of tune with each other
Frayed ribbon            | -                 | brush=Broad_edge spread=40 paper=Silk dryness=.7 ink=.4 attack=.3 release=1.6 width=1 volume=2.5 grain=.5 tail=.8 tailLean=-30 lean=-45 pressure=0.66 redip=0.12 | chorused | turnto | A frayed broad edge on silk, its hairs drifting apart as they dry
Procession in white      | -                 | brush=Reed_pen spread=38 paper=Rice ink=1 dryness=.1 attack=1.6 release=4 shade=.6 volume=-3.5 redip=0.5 tailLean=-30 | slowcloud | suspend | Reed pens on rice, many and far out of tune
Wool unspun              | -                 | brush=Feather spread=60 paper=Rough attack=.9 pressure=.5 shade=.3 release=3 grain=.35 volume=-1.5 redip=0.3 lean=15 | nearshadow | wash | Feathers on rough paper, every hair on a pitch of its own
Needle held to the lamp  | -                 | pressure=0 shade=.9 attack=1.2 release=3 spread=1 string=0 bleed=.2 volume=4 grain=0 tail=1 dryness=0.2 lean=20 | late | highwash | The tip of one hair on silk, thin and pure
Pale edge of evening     | -                 | brush=Broad_edge pressure=.1 shade=1 attack=1.8 release=5 paper=Silk grain=.05 tail=.8 volume=-3 redip=.2 dryness=0 tailLean=-40 lean=0 | evaporate | highwash | The corner of a broad edge on silk in the palest ink
Frost line on glass      | Glass rim line    | pressure=0 brush=Hair shade=.95 attack=1.6 release=5 volume=-3 spread=0 redip=0.25 | frost | highwash | A single hair drawn round stone in pale ink
Reading by snow          | -                 | brush=Feather pressure=.1 shade=.3 paper=Silk attack=1 ink=1 release=2 bleed=.1 width=.3 volume=-2 grain=.05 redip=0.12 tailLean=-30 | daylight | wash | The tip of a feather on silk, light and near
Salt in the air          | -                 | brush=Reed_pen pressure=.08 paper=Stone shade=.45 attack=2.4 release=6 bleed=.8 soak=12 volume=0.5 tail=.8 tailLean=-60 dryness=0.65 lean=20 redip=0.15 | glasshalo | highwash | A reed pen barely on stone that fades into a long stain
`,
    },
    {
      id: 'reed-pen',
      name: 'Reed pen keys',
      category: 'keys',
      rows: `
Quill by the window      | Reed pen keys     | string=.4 shade=.3 release=.25 width=.4 volume=-1 grain=.4 tail=.1 dryness=0.55 pressure=0.25 | bare | letters | Short hollow letters of a reed pen on silk
Copyist's hour           | Reed pen keys     | paper=Silk speed=.35 ink=.5 pressure=1 release=.8 bleed=.1 volume=-1.5 soak=0.8 dryness=.1 spread=11 tailLean=-50 | booth | reply | Firm short strokes of a pen, hardly staining the silk
Split nib                | Reed pen keys     | spread=24 pressure=.9 string=.2 release=.6 width=1 shade=.45 volume=1 grain=.05 tailLean=-70 | splate | ostin | A pen pressed until it splits, both halves out of tune
Letters kept in a drawer | Reed pen keys     | bleed=.9 soak=5 string=.25 shade=.2 release=1.5 volume=2.5 dryness=0.7 tailLean=-90 pressure=0.3 | softbed | letters | Dark letters whose stain sounds on after the pen has gone
Comma and breath         | Reed pen keys     | speed=.08 ink=.35 dryness=.7 tail=.7 release=2 string=.3 volume=-0.5 grain=0.04 tailLean=-90 | revverb | reply | Slow dots of a pen that runs dry within each one
Schoolroom slate         | Reed pen keys     | paper=Rough grain=.8 string=1 shade=.85 release=.2 ink=.75 volume=2 spread=14 pressure=1 tail=0.15 | splate | letters | A hard scratching nib on rough paper, the string well up
Chalk on the barn door   | Reed pen keys     | paper=Rough brush=Broad_edge grain=.7 shade=.45 string=.5 release=.4 volume=-3 width=0.4 spread=9 tailLean=-50 | combo | reply | Short strokes of a broad edge on rough paper
Tally in charcoal        | Reed pen keys     | paper=Rough brush=Hair grain=.7 dryness=.9 ink=.3 string=.3 release=.35 volume=0 soak=1 spread=9 pressure=0.75 shade=.25 | valve | ostin | Dry hair dots on rough paper, more scratch than tone
Ledger in the rain       | Caught hairs      | script=Dot attack=.005 speed=.4 string=.6 release=.4 redip=.6 volume=-2.5 spread=11 width=0.75 pressure=0.62 | lightrain | ostin | Reed pen dots on rough paper, wetted again by each new key
Splinters for the stove  | Reed pen keys     | paper=Rough brush=Feather string=.9 shade=.35 volume=0.5 release=.5 speed=.3 grain=.6 spread=14 tailLean=-20 | disc 2.gain=11 | letters | A feather's edge on rough paper that snaps the string
Felt under the hammer    | Reed pen keys     | paper=Rice brush=Finger shade=.25 string=.2 release=.5 attack=.015 volume=-2 spread=12 bleed=.75 soak=4 pressure=.85 grain=0 dryness=0.25 tailLean=-40 | reel | letters | Fingertip keys on rice paper, dull and near, their stain just behind
Slippers on the stair    | Reed pen keys     | paper=Rice brush=Hair shade=.35 string=.3 attack=.03 release=.7 bleed=.5 volume=-2.5 pressure=.25 spread=12 grain=0.12 tailLean=-50 | room | reply | Soft hair dots on rice paper
Envelope under the door  | Reed pen keys     | paper=Rice speed=.15 shade=.3 string=.45 release=1.2 bleed=.7 soak=3 volume=2.5 dryness=0.05 tailLean=-40 | repeats | letters | A reed pen on rice paper, each letter soaking in
Cotton gloves            | Reed pen keys     | paper=Rice brush=Broad_edge attack=.02 shade=.3 string=.2 pressure=.4 ink=.9 release=.9 volume=-4.5 grain=0 tail=.8 dryness=0.2 tailLean=-90 | faintwarm | turnto | Padded keys of a broad edge on rice
Dust cover off a stool   | Reed pen keys     | paper=Rice brush=Feather attack=.012 string=.55 shade=.6 grain=.1 release=.6 speed=.4 volume=4.5 tail=0.85 tailLean=-90 | haze | letters | Airy keys of a feather on rice with the string showing through
Nib on marble            | Reed pen keys     | paper=Stone string=.4 shade=.4 release=1.6 tail=.6 volume=1 grain=0.46 tailLean=-30 pressure=0.3 | chamber | letters | A reed pen tapped on stone, each key ringing a little
Cold kitchen tiles       | Reed pen keys     | paper=Stone brush=Finger string=.6 release=.5 shade=.55 speed=.45 width=.3 volume=-0.5 tail=0.85 tailLean=-20 | corner | reply | Knuckle keys on stone, short and bare
Sundial at noon          | Stone marks       | script=Seal brush=Reed_pen release=2.5 shade=.35 lean=0 tailLean=0 volume=-1.5 | bucket | ostin | Seals of a reed pen on stone, each one dying slowly
Two pebbles              | Stone marks       | brush=Hair pressure=.7 string=.3 release=1.2 tail=.4 lean=0 tailLean=-80 shade=.75 volume=-0.5 grain=.1 dryness=0.55 | slowskips | reply | Bright hair dots on stone
Lid of the stove         | Stone marks       | brush=Feather string=.15 grain=.2 release=3 shade=.3 lean=0 tailLean=0 volume=0.5 pressure=.95 spread=18 | kettle | letters | Dark feather dots pressed on stone that ring on
Spinet under a sheet     | Reed pen keys     | string=1 shade=.75 release=.2 bleed=.05 width=.3 speed=.1 volume=-2.5 grain=0.06 pressure=0.7 | sampler | reply | Nearly all plucked string, bright, with a scrap of pen before it
Harp behind the curtain  | Reed pen keys     | string=.95 brush=Finger shade=.4 release=3 tail=.8 bleed=.3 volume=1 grain=0 spread=10 dryness=0.7 tailLean=-15 | hall | fallarp | Strings plucked by a fingertip and left to ring
Baling wire              | Reed pen keys     | string=.9 paper=Stone brush=Broad_edge pressure=.9 shade=.8 release=.6 volume=-1 spread=9 tailLean=-30 | slack | letters | Strings struck through stone with a broad edge
Lute under the arm       | Reed pen keys     | string=.85 paper=Rice brush=Hair shade=.5 release=.9 bleed=.2 lean=-15 volume=1 grain=0 tailLean=-40 | desk | reply | Strings plucked softly through rice paper
Zither on the knees      | Stroked strings   | script=Dot attack=.004 speed=.1 release=2 paper=Silk bleed=.6 soak=6 spread=14 shade=.7 volume=2.5 pressure=.9 tail=0.75 tailLean=-90 | sympath | fallarp | Strings plucked through silk with a wide stain behind them
Practice before supper   | Feather sweeps    | brush=Reed_pen lean=0 tailLean=0 attack=.006 speed=.3 release=.8 shade=.4 string=.4 volume=-0.5 grain=.1 pressure=.8 width=0.4 | amptrem | turnto | Held reed keys on silk that land hard and thin away
Dark old upright         | Feather sweeps    | brush=Finger paper=Rice lean=0 tailLean=0 attack=.005 speed=.12 release=.5 shade=.35 string=.5 bleed=.3 volume=-5.5 grain=0.06 width=0.6 | console | duet | Keys that fall from a round start, a fingertip on rice
Glass harmonium          | Feather sweeps    | brush=Hair paper=Stone lean=0 tailLean=0 attack=.008 speed=.06 release=1.5 shade=.9 string=.15 volume=-1.5 spread=20 redip=.35 pressure=.2 grain=0.1 | shimtrem | turnto | Long falling hair strokes on stone, pale and ringing, dipped as they thin
Sunday in the back room  | Feather sweeps    | brush=Broad_edge lean=0 tailLean=0 attack=.005 speed=.4 release=.3 pressure=.8 string=.3 width=.5 volume=-5 dryness=0.1 | chorale | turnto | Thick keys of a broad edge that quickly thin
Papery piano             | Feather sweeps    | brush=Hair paper=Rough lean=0 tailLean=0 attack=.004 speed=.2 string=.65 grain=.5 release=.6 bleed=.15 volume=-6.5 dryness=0.5 pressure=0.62 | platter | duet | Hair keys on rough paper, the string bright at the front
Wax on the envelope      | Seals on stone    | brush=Reed_pen paper=Silk release=.6 tail=.3 string=.5 shade=.35 speed=.7 volume=-2.5 dryness=0.5 width=0.4 | heads | reply | Quick stamps of a reed pen on silk
Rubber stamp             | Seals on stone    | brush=Finger paper=Rough release=.3 tail=.1 speed=.8 string=.4 width=.3 volume=1.5 soak=0.9 grain=0.04 pressure=0.75 | gated | ostin | Blunt stamps of a finger on rough paper
Post office at closing   | Seals on stone    | brush=Broad_edge paper=Rice release=.9 tail=.5 speed=.3 ink=.9 shade=.75 volume=-2.5 lean=-40 grain=.5 pressure=.8 spread=24 bleed=.1 string=.6 | dplate | letters | Heavy wet stamps of a broad edge on rice
Two signatures           | Seals on stone    | brush=Hair paper=Silk release=1.4 redip=.4 spread=16 shade=.7 string=.3 width=.8 volume=-1 dryness=0.65 tailLean=-90 | leftright | ostin | Hair stamps on silk that freshen one another
Stamped tin              | Seals on stone    | brush=Feather paper=Stone release=1 tail=.4 speed=.6 string=.7 shade=.6 volume=5 spread=7 width=0.7 | tin | reply | Feather stamps on stone, string and air in equal parts
Harmonium with a leak    | Caught hairs      | paper=Silk attack=.04 release=.3 dryness=.2 grain=.5 speed=.6 redip=0 string=.1 shade=.4 volume=-4.5 tail=0.05 pressure=0.7 | bedside | choir | A full reed pen held on silk, airy and even | organ
Half-drawn stop          | -                 | brush=Reed_pen attack=.05 release=.06 ink=1 dryness=0 bleed=0 string=0 shade=.25 pressure=.4 volume=-0.5 tail=0 grain=0 lean=-8 | flutes | turnto | A wet reed pen held plainly with no stain and no string | organ
Barrel organ up the road | -                 | brush=Reed_pen paper=Stone attack=.02 release=.08 ink=.8 shade=.4 pressure=.8 bleed=.1 speed=.2 volume=2 grain=.05 tail=0 lean=40 | farrotor | ostin | Reed pen keys held on stone, even and firm | organ
Squeezed at the knee     | Hooks on silk     | brush=Reed_pen paper=Rough speed=.5 attack=.03 release=.25 lean=-20 tailLean=0 bleed=.1 shade=.5 redip=0.4 | hotvalve | duet | Reed strokes on rough paper, each one pushed to a small swell | organ
Pipes in the stairwell   | -                 | brush=Finger paper=Silk attack=.03 release=.4 ink=1 dryness=0 bleed=.15 string=0 shade=.3 spread=2 volume=-3 tail=.1 grain=.05 lean=0 pressure=0.35 | latearrive | duet | A wet finger held on silk, plain as a flute pipe | organ
Counting beads at six    | Rice paper dots   | brush=Finger paper=Silk speed=0 release=1.2 string=.15 shade=.8 lean=0 ink=.9 volume=-3 tail=0 dryness=0.05 pressure=0.45 | twoloops | ostin | Round pale finger dots on silk
Copper lamp              | Rice paper dots   | brush=Hair paper=Silk speed=.2 release=2.5 tail=.9 string=.1 lean=0 spread=10 shade=.6 volume=-2.5 grain=0.55 tailLean=-90 | tiles | turnto | Hair dots on silk whose heart lasts long
Warm ivory               | Rice paper dots   | brush=Broad_edge paper=Silk release=1.8 tail=.7 string=.35 lean=0 shade=.5 pressure=.3 volume=0 grain=.05 tailLean=-60 | fallecho | letters | Light dots of a broad edge on silk with long tails
Milk bottles             | Rice paper dots   | brush=Finger paper=Stone speed=.15 release=1 string=0 lean=0 shade=.5 ink=1 bleed=.3 volume=-5 spread=11 tailLean=-30 | inkpot | reply | Finger dots on stone with no string in them
Wings on a lampshade     | Rice paper dots   | brush=Feather paper=Silk speed=.1 release=1.5 string=.25 lean=0 grain=.4 tail=.8 width=1 volume=-0.5 pressure=.15 shade=.8 spread=20 bleed=.3 dryness=0.1 | crystals 2.gain=4 | ostin | Light feather dots on silk, slow and wide, with long thin tails
Pen that slips           | Reed pen keys     | lean=-200 release=.6 string=.3 shade=.45 attack=.02 volume=-1 dryness=0.6 tailLean=-15 | slap | letters | Pen strokes that slip up a whole tone into the note
Bent tine                | Reed pen keys     | brush=Hair paper=Stone lean=100 tailLean=-100 release=1.2 tail=.8 string=.5 shade=.6 volume=-2 grain=0.04 pressure=0.35 | spring | reply | Hair on stone, entering sharp and leaving flat
Question marks           | Reed pen keys     | brush=Finger paper=Rice tailLean=500 release=1.8 tail=.9 string=.3 shade=.6 volume=-5 dryness=0.55 pressure=0.4 | fifthhop | reply | Finger dots on rice whose tails turn up by a fourth
Ink run down the sleeve  | Reed pen keys     | paper=Silk tailLean=-700 release=2.5 tail=1 bleed=.6 soak=4 shade=.5 volume=0.5 dryness=0.7 pressure=0.4 | sagging | letters | Reed pen dots whose last hairs slide down a fifth
Whistle at the keyhole   | Reed pen keys     | brush=Feather paper=Rough lean=1200 tailLean=300 release=1 attack=.03 grain=.5 string=.4 shade=.5 volume=-6 spread=14 pressure=0.66 | dubsweep | ostin | Feather keys on rough paper that drop in from an octave above
`,
    },
    {
      id: 'dots',
      name: 'Dot plucks',
      category: 'plucked',
      rows: `
Raindrop on a sleeve     | Rice paper dots   | speed=.45 release=.3 bleed=.3 string=.2 volume=0 grain=0.12 pressure=0.4 | bare | dabs | Round finger dots on rice paper, small and plain
Dew counted slowly       | Rice paper dots   | paper=Silk speed=.1 ink=.9 release=1 shade=.4 bleed=.4 soak=2 volume=-2.5 dryness=0.25 pressure=0.45 | points | dabs | Slow fingertip dots on silk, round and wet
Blackberry juice         | Rice paper dots   | ink=1 pressure=.9 shade=.3 string=.15 bleed=.95 soak=6 release=.5 volume=-5.5 grain=0 tail=.8 tailLean=-20 | deepwater | fallarp | Soaked dark dots that leave a long stain in the rice
Buttons in a jar         | Rice paper dots   | paper=Stone speed=.7 shade=.7 string=.5 release=.25 width=1 volume=2 grain=0.42 pressure=0.25 | tube | rain | Very short finger dots on stone
Thumb piano left out     | Rice paper dots   | paper=Rough string=.65 speed=.2 grain=.6 shade=.4 release=.6 lean=-70 volume=3 spread=7 tailLean=-40 | skinbuzz | ostin | Finger dots on rough paper with the string and the grain in them
Hair's breadth           | Rain of dabs      | redip=0 speed=.7 pressure=.1 string=.6 spread=2 release=.3 shade=.4 paper=Silk bleed=.1 volume=1 grain=0.34 lean=40 | daylight 3.gain=6 | rain | Single hairs touched to silk, thin and quick
Sparrow tracks           | Rain of dabs      | redip=.2 paper=Silk spread=12 string=.3 release=.6 shade=.4 speed=.6 volume=-1.5 width=.5 grain=0.55 tailLean=-30 | slap | dabs | Small hair dots on silk, a little ragged
Pollen on the sill       | Rain of dabs      | redip=0 paper=Rough ink=.25 dryness=.8 grain=.5 string=.15 release=.8 volume=-3 tail=0.95 tailLean=-90 shade=.5 | breezy 2.gain=6 | rain | Nearly dry hair dots on rough paper, mostly dust
Blossom coming down      | Rain of dabs      | paper=Silk redip=0 spread=8 tail=.9 release=2 tailLean=-200 string=.2 shade=.7 volume=1 grain=0.1 lean=30 | leaf | fallarp | Hair dots on silk with long tails that sink a tone
Silk thread pulled       | Rain of dabs      | redip=0 paper=Silk string=.9 spread=4 speed=.2 release=1.4 bleed=.2 shade=.65 volume=4.5 dryness=0.7 tailLean=-40 | answer | dabs | Hair dots that are mostly the string under the silk
Shower over slates       | Rain of dabs      | paper=Stone redip=.9 spread=18 release=1 shade=.6 volume=4.5 grain=0 tailLean=-40 | prism | rain | Hair dabs on stone, each wetting the ones beside it
Gutter music             | Rain of dabs      | brush=Finger redip=.7 paper=Stone string=.5 speed=.3 spread=6 release=.6 volume=1 pressure=.95 shade=.35 ink=.9 grain=0.06 lean=-45 | mine | rain | Finger dabs on stone, wet and quick to ring
Roof of leaves           | Rain of dabs      | brush=Feather redip=.6 paper=Rice spread=30 release=.7 grain=.4 volume=2.5 shade=.5 tail=0.75 width=0.6 | lightrain 2.gain=7 | rain | Feather dabs on rice, more patter than pitch
Puddle in lamplight      | Rain of dabs      | brush=Broad_edge redip=1 paper=Silk ink=.9 spread=10 release=1.2 shade=.4 bleed=.7 volume=-2.5 grain=0.12 tailLean=-20 | lapping | dabs | Broad wet dabs on silk that refill each other
Drizzle on the glass     | Rain of dabs      | brush=Reed_pen redip=.8 paper=Silk spread=15 release=.3 shade=.15 speed=.6 string=.2 volume=0.5 grain=0.46 width=0.3 pressure=.4 | stars | rain | Small hollow dabs of a reed pen, dipped with every key
Breath on a fern         | Rice paper dots   | brush=Feather attack=.05 speed=.1 grain=.15 release=1.5 string=.1 shade=.5 lean=0 volume=4.5 spread=7 tailLean=-50 | points | dabs | Feather touches on rice, barely pitched at first
Plume in a hatband       | Rice paper dots   | brush=Feather paper=Silk string=.8 speed=.3 release=.7 shade=.3 lean=-30 volume=5.5 grain=.1 dryness=0.2 pressure=0.62 | ladder 2.gain=6 | reply | Feather dots on silk over a clear plucked string
Seed heads               | Rice paper dots   | brush=Feather paper=Rough ink=.3 dryness=.9 grain=.6 release=.4 shade=.35 volume=6 tailLean=-20 pressure=.8 string=.5 speed=.15 | fuzz 3.gain=12 | rain | Dry feather flicks on rough paper over a string
Powder from a moth       | Rice paper dots   | brush=Feather paper=Stone pressure=0.08 release=3 tail=1 shade=0.9 string=0 volume=4 spread=2 tailLean=-300 dryness=0.65 grain=0.5 attack=0.04 | firstlight | dabs | Faint feather touches on stone whose thin tails sink a third
Wren in the thatch       | Rice paper dots   | brush=Feather paper=Rice lean=400 speed=.5 release=.4 string=.3 shade=.6 redip=.5 volume=6 grain=0.12 tailLean=-40 pressure=0.4 | nextdoor 1.level=1 | ostin | Feather dots that drop from a third above
Wooden letters           | Stone marks       | paper=Silk release=.5 tail=.3 lean=0 tailLean=0 shade=.35 speed=.4 volume=-0.5 dryness=0.7 | darkbox | reply | Flat short dots of a broad edge on silk
Paving stones            | Stone marks       | string=.2 pressure=.8 shade=.3 release=.6 tail=.2 lean=0 volume=-1.5 spread=14 | cellar | dabs | Blunt dots of a broad edge on stone, dark and short
Wet boot on planks       | Stone marks       | paper=Rice ink=1 bleed=.6 soak=2.5 release=.8 lean=-500 tailLean=0 string=.65 pressure=.9 spread=14 | deepwater | dabs | Broad wet dots on rice that slide up a fourth, string and all
Crate of apples          | Stone marks       | paper=Rough grain=.7 string=.45 release=.4 tail=.4 shade=.5 lean=0 tailLean=0 volume=-1 dryness=0.25 | loop | ostin | Broad dots on rough paper
Garden gate swinging     | Stone marks       | brush=Broad_edge script=Seal paper=Silk release=1.2 speed=.8 string=.5 shade=.6 tailLean=-60 volume=-1 spread=14 | cleanecho | reply | Quick seals of a broad edge on silk that sag as they go
Catgut and rosin         | Stroked strings   | script=Dot attack=.004 string=1 paper=Silk release=.6 bleed=.05 speed=.2 shade=.55 volume=-4.5 tail=0.75 tailLean=-90 | wallup | reply | Plucked string and almost nothing else
Nylon at midnight        | Stroked strings   | script=Dot attack=.008 string=.95 paper=Rice brush=Finger release=1.5 shade=.3 bleed=.2 volume=6 tail=0.65 lean=30 | corner | fallarp | Dark strings plucked by a fingertip through rice
Wire fence in frost      | Stroked strings   | script=Dot attack=.004 string=.9 paper=Stone brush=Reed_pen release=2.5 shade=.55 spread=14 volume=-0.5 grain=.05 tail=0.65 lean=20 pressure=.85 | glassrain | fallarp | Bright strings plucked by a reed pen over stone
Cigar box                | Stroked strings   | script=Dot attack=.004 string=.85 paper=Rough brush=Broad_edge release=.35 grain=.6 shade=.5 volume=1 tail=0.05 lean=15 | tin | ostin | Short strings plucked through rough paper
Koto in the next garden  | Stroked strings   | script=Dot attack=.004 string=.9 paper=Silk brush=Hair lean=-160 release=2 tailLean=80 tail=.7 shade=.7 volume=6 spread=11 | farstation | fallarp | Strings plucked through silk, bent up into the note
Bead let go              | Rice paper dots   | speed=.05 release=4 tail=1 bleed=.4 shade=.6 string=.1 lean=0 volume=-22 grain=0 tailLean=-40 spread=11 pressure=0.4 | tails | dabs | Finger dots on rice whose heart goes on long after
Lantern lit and left     | Rice paper dots   | brush=Hair paper=Silk release=6 tail=1 bleed=.8 soak=12 spread=14 shade=.65 lean=0 volume=0.5 dryness=0.6 tailLean=-50 pressure=0.4 | hanging | dabs | Hair dots on silk with a tail and a stain that outlast them
Footprints filling       | Rice paper dots   | brush=Broad_edge release=3 tail=.8 bleed=1 soak=8 shade=.4 ink=.8 pressure=.2 spread=16 dryness=0.25 tailLean=-50 | undertow | fallarp | Broad dots on rice that are soon only stain
Snail's silver           | Rice paper dots   | brush=Finger paper=Silk release=5 tail=1 tailLean=-400 bleed=.2 shade=.75 speed=.2 volume=-1.5 spread=9 pressure=0.4 | fallfifth | dabs | Finger dots on silk whose long tails slide down a third
Comet drawn by a child   | Rice paper dots   | brush=Reed_pen paper=Stone release=4 tail=1 tailLean=700 bleed=.3 shade=.35 string=.3 volume=0 spread=24 pressure=.8 | evaporate | dabs | Reed pen dots on stone with tails that climb a fifth
Plum into the basket     | Rice paper dots   | lean=700 attack=.03 release=.7 string=.2 shade=.4 speed=.2 bleed=.3 volume=-2.5 dryness=0.05 tailLean=-70 | mist | dabs | Finger dots that fall a fifth into the note
Frog off the bank        | Rice paper dots   | lean=-900 attack=.02 release=.3 paper=Silk string=.1 speed=.5 shade=.5 ink=1 volume=-4 spread=14 pressure=0.3 | skips | ostin | Wet finger dots that leap up into the note
Boards in the wind       | Rice paper dots   | brush=Reed_pen paper=Rough lean=-500 attack=.02 grain=.8 release=.4 shade=.25 volume=1.5 spread=14 tailLean=-90 | grit | ostin | Reed pen dots on rough paper that hop up a fourth
Sleigh at the turn       | Rice paper dots   | brush=Hair paper=Stone lean=300 tailLean=-300 attack=.02 release=1.4 spread=9 shade=.7 volume=0 dryness=0.6 pressure=0.45 | pedal | fallarp | Hair dots on stone that swoop in and sag away
Rubber ball on the lawn  | Rice paper dots   | brush=Broad_edge paper=Silk lean=-300 tailLean=-500 attack=.015 release=.6 tail=.6 shade=.5 volume=-2 spread=9 pressure=0.7 | dotted | reply | Broad dots on silk that bend up, then drop away
Confetti                 | Rain of dabs      | redip=.3 spread=55 paper=Silk release=.5 speed=.6 shade=.35 string=.1 volume=0 pressure=.3 dryness=0.5 lean=10 | sides 3.gain=7 | rain | Hair dabs on silk, their hairs flung wide of the note
Gravel from a shoe       | Rain of dabs      | redip=0 brush=Broad_edge paper=Stone spread=48 release=.4 grain=.7 string=.3 shade=.5 volume=0.5 width=0.6 tailLean=-30 | gatelp | rain | Broad dots on stone, rough and out of tune with themselves
Spilled sequins          | Rain of dabs      | redip=.3 brush=Finger paper=Stone spread=52 release=1.2 shade=.9 string=.1 width=1 volume=0 pressure=.3 dryness=0.1 tailLean=-70 | twinkle | rain | Pale finger dabs on stone that beat against themselves
Torn lace                | Rain of dabs      | redip=.5 brush=Feather paper=Silk spread=58 dryness=.6 release=1 string=.25 shade=.35 volume=6 pressure=.95 ink=.7 lean=-200 grain=0.14 tailLean=-15 | sides 3.gain=10 | dabs | Feather dabs on silk, frayed and wide, bent up and dabbed again when held
Market at opening        | Rain of dabs      | redip=.6 brush=Reed_pen paper=Rough spread=36 release=.5 grain=.4 string=.5 shade=.5 volume=0.5 dryness=0.65 tailLean=-20 | recall | ostin | Reed pen dabs on rough paper, many and out of step
Last of the ink          | Rice paper dots   | brush=Hair paper=Rough ink=.05 dryness=1 grain=.35 string=.5 release=.5 shade=.3 volume=6 spread=9 pressure=0.66 | oxide 3.gain=4 | reply | Dry hair dots on rough paper, the string showing through
Straw broom              | Rice paper dots   | brush=Broad_edge paper=Rough ink=0 dryness=1 grain=1 string=.2 release=.2 speed=.7 volume=-2 soak=0.8 tail=0.05 pressure=0.62 | sampler 2.gain=7 | ostin | A broad edge with no ink in it, flicked at rough paper
Crumbs on the tablecloth | Rice paper dots   | brush=Finger paper=Rice ink=.08 dryness=.7 grain=.4 string=.35 release=.4 lean=0 shade=.8 volume=-1 pressure=.3 tail=0.1 tailLean=-50 | pillow | rain | Dry fingertips on rice paper, light and close
Match struck and failed  | Rice paper dots   | brush=Reed_pen paper=Rough ink=.1 dryness=.95 grain=0.6 speed=.8 string=.85 release=.15 volume=5 shade=0.1 pressure=0.1 tail=0 | booth | rain | Scratches of a dry pen with a short string inside
Bones of a leaf          | Rice paper dots   | brush=Feather paper=Stone ink=0 dryness=.8 string=.75 grain=.3 release=1.5 shade=.4 volume=6 spread=7 pressure=0.7 | valley 2.gain=9 | fallarp | A dry feather on stone, the string ringing under it
`,
    },
    {
      id: 'broad-bass',
      name: 'Broad bass',
      category: 'bass',
      rows: `
Weight of the whole arm  | Broad edge bass   | ink=.8 pressure=.9 release=.4 shade=.5 volume=2.5 spread=24 string=.75 lean=0 grain=.6 paper=Rough dryness=.7 | thump | lowwalk | A broad edge pressed flat on rough paper, dragging over a low string
Door of the coal hole    | Broad edge bass   | shade=.15 release=.15 width=.05 string=.4 volume=-5.5 spread=14 | iron | lowwalk | Short dark strokes of a broad edge, in the middle
Barge tied up            | Broad edge bass   | paper=Rice attack=.15 release=.8 bleed=.6 soak=2 ink=.9 shade=.3 volume=-5.5 pressure=.5 dryness=.1 redip=0.5 tailLean=-40 | darkhall | lowlong | Soft broad strokes soaking into rice
Shovel on the hearth     | Broad edge bass   | paper=Rough grain=.7 pressure=1 dryness=.4 release=.3 shade=.5 volume=-3 spread=20 | grit | lowwalk | A broad edge scraped over rough paper
Stone lintel             | Broad edge bass   | paper=Stone pressure=.6 release=.7 string=.3 shade=.3 lean=0 volume=2 spread=10 tailLean=-70 | booth | lowwalk | A broad edge on stone, its weight ringing a little
Pond beneath the ice     | Broad edge bass   | attack=.8 release=2 ink=.9 width=.5 bleed=.5 soak=4 shade=.25 lean=0 volume=-1.5 redip=0.25 tailLean=-70 | glacier | lowlong | A broad edge held long and dark on silk
Goods train uphill       | Broad edge bass   | attack=.4 redip=.5 ink=.35 dryness=.6 release=1 spread=8 volume=-1 grain=0.08 | tunnel | lowlong | Long broad strokes that run dry and are dipped again
Plough in wet clay       | Broad edge bass   | paper=Rough attack=.5 grain=.9 ink=1 pressure=.85 release=1.2 volume=2 redip=0.12 tailLean=-15 | waterpot | lowlong | A wet broad edge dragged long over rough paper
Harbour wall at night    | Broad edge bass   | attack=1 release=3 spread=16 width=.8 shade=.5 bleed=.3 tail=.5 volume=-1.5 redip=0.5 tailLean=-15 | farshore 1.level=.9 | lowlong | Broad edges held wide and slightly out of tune
Dynamo under the dam     | Broad edge bass   | paper=Stone attack=.3 speed=.7 release=1.5 shade=.6 spread=3 lean=0 volume=-4 redip=0.3 tailLean=-90 | lowdome | lowlong | A broad edge drawn quickly over stone until it hums
Thumb on the table       | Rice paper dots   | string=.5 shade=.4 speed=.15 lean=0 release=.3 bleed=.1 volume=2 grain=0.04 pressure=0.62 | desk | lowpulse | Low fingertip dots with the string in them
Bullfrog                 | Rice paper dots   | lean=-250 attack=.02 ink=1 shade=.3 release=.4 string=.1 speed=.2 volume=-0.5 dryness=0.2 tailLean=-15 pressure=0.3 | bath | lowpulse | Low wet finger dots that slide up into the note
Heart under the coat     | Rice paper dots   | paper=Silk attack=.03 shade=0 speed=.3 string=0 bleed=.2 lean=0 release=.5 pressure=.2 volume=-1 grain=0 tail=0.65 | onceasec | lowpulse | Round dark finger dots with no string at all
Sandbag                  | Rice paper dots   | paper=Rough shade=.2 grain=.5 string=.2 release=.2 lean=-60 pressure=.8 volume=3 spread=14 | blotter | lowline | Dull finger dots on rough paper
Low bell of the buoy     | Rice paper dots   | paper=Stone release=4 tail=1 shade=.5 speed=.1 string=.3 lean=0 volume=2.5 grain=0.1 pressure=0.45 | across | lowline | Low finger dots on stone with long tails
Bass without its case    | Stroked strings   | script=Dot attack=.005 string=.95 brush=Finger paper=Silk shade=.3 release=.8 bleed=.1 width=.2 volume=2.5 spread=9 tailLean=-20 | corner | lowwalk | A low string plucked by a fingertip
Slack gut                | Stroked strings   | script=Dot attack=.01 string=.9 brush=Hair paper=Rice shade=.2 release=1.4 bleed=.4 lean=-50 volume=6 tail=0.65 | pillow | lowwalk | Slack low strings plucked through rice
Cello left on the stairs | Stroked strings   | attack=.12 speed=.5 shade=.4 pressure=.7 release=.6 bleed=.3 width=.4 volume=1.5 redip=0.3 tailLean=-40 | darkhall | lowline | Low strings rubbed by a hair brush through silk
Bridge cable             | Stroked strings   | paper=Stone brush=Broad_edge attack=.02 string=.9 pressure=.9 release=1.2 shade=.6 volume=1 spread=15 width=.3 tail=0.85 tailLean=-30 | plate | lowwalk | Low strings rubbed and struck through stone
Bow with too much rosin  | Stroked strings   | paper=Rough brush=Reed_pen attack=.06 speed=.75 grain=.6 dryness=.4 release=.4 shade=.5 volume=0 redip=0.4 tailLean=-15 | fuzz | lowwalk | Low strings rubbed roughly by a reed pen
Engine under the floor   | Caught hairs      | attack=.02 release=.2 speed=.4 shade=0.12 redip=0 string=.2 width=.3 dryness=.5 volume=0 tail=0 lean=15 grain=0.6 | console | lowpulse | A reed pen on rough paper, low and snarling
Bassoon in the reeds     | -                 | brush=Reed_pen paper=Silk attack=.03 release=.25 shade=.2 ink=1 bleed=.1 string=.1 pressure=.6 width=.3 volume=-1.5 dryness=0.1 lean=-45 | middle | lowwalk | A full reed pen held low on silk, hollow and plain
Fog on the shipping lane | -                 | brush=Reed_pen paper=Stone attack=.25 release=1.5 shade=.35 pressure=.8 ink=1 dryness=0 volume=4 spread=15 grain=.4 redip=0.2 tailLean=-50 | farshore 1.level=.9 | lowline | A reed pen held low on stone
Contrabass clarinet case | -                 | brush=Reed_pen paper=Rice script=Falling_sweep attack=.03 speed=.2 shade=.25 release=.6 bleed=.5 lean=-20 volume=-1.5 grain=0.34 tailLean=-40 | valve | lowline | Reed strokes on rice that start full and thin, low and hollow
Gravel barge             | -                 | brush=Reed_pen paper=Rough attack=.01 release=.3 dryness=.8 ink=.4 grain=.6 spread=20 shade=0.05 volume=4.5 tail=0.05 lean=10 | cassette | lowpulse | A drying reed pen dragged low over rough paper
Tide at the piles        | Hooks on silk     | brush=Broad_edge speed=.15 attack=.2 release=.8 lean=0 tailLean=0 shade=.25 width=.4 volume=1.5 redip=0.2 | slowtide | lowlong | Low broad strokes that swell to a hook
Lorry on the hill        | Hooks on silk     | brush=Broad_edge paper=Rough speed=.7 attack=.05 release=.4 lean=-120 tailLean=-200 grain=.5 shade=.4 width=.4 volume=6 redip=0.5 | combo | lowlong | Broad strokes on rough paper that pull up to the note and drop
Bear turning over        | Hooks on silk     | brush=Finger paper=Rice speed=.25 attack=.1 release=.7 lean=-700 tailLean=0 shade=.2 bleed=.7 width=.5 volume=0.5 pressure=1 spread=18 string=.5 redip=0.25 | fallfifth | lowlong | Low finger strokes on rice that heave up a fifth as they swell
Accordion bellows        | Hooks on silk     | brush=Reed_pen speed=.5 attack=.03 release=.3 lean=0 tailLean=0 shade=.35 width=.3 spread=12 volume=6 dryness=0.2 redip=0.2 | chorused | lowwalk | Low reed strokes on silk, each pushed to a quick swell
Rope taking the strain   | Hooks on silk     | brush=Hair paper=Silk string=.7 speed=.2 attack=.1 release=.6 lean=-30 tailLean=0 shade=.4 volume=3.5 redip=0.25 | grazed | lowline | Hair strokes that swell against a rubbed low string
Felled oak               | Feather sweeps    | brush=Broad_edge lean=0 tailLean=0 attack=.005 speed=.3 release=.6 shade=.35 pressure=.8 bleed=.2 width=.3 volume=-2 dryness=0.25 | mine | lowwalk | Low broad strokes that land heavily and thin away
Heavy curtain            | Feather sweeps    | brush=Finger paper=Rice lean=0 tailLean=0 attack=.02 speed=.15 release=1 shade=.2 width=.4 bleed=.6 volume=-1.5 spread=20 pressure=0.62 | darktrail | lowline | Low finger sweeps on rice that start full and fade
Sack off a shoulder      | Feather sweeps    | brush=Broad_edge paper=Rough lean=300 tailLean=-200 attack=.02 speed=.5 release=.5 grain=.6 shade=.4 width=.3 volume=4 pressure=0.7 | combo | lowwalk | Broad sweeps on rough paper that fall from a third above
Anchor paid out          | Feather sweeps    | brush=Hair paper=Stone lean=120 tailLean=-500 attack=.01 speed=.2 release=1.8 shade=.5 tail=.9 volume=1.5 spread=17 pressure=0.45 | deepbelow | lowline | Hair sweeps on stone whose tails drop a fourth
Elephant at the gate     | Feather sweeps    | brush=Reed_pen paper=Rough lean=150 tailLean=-80 attack=.03 speed=.1 release=.8 shade=.3 pressure=.9 width=.3 volume=-3 redip=0.3 | giant | lowlong | Low reed sweeps on rough paper, heavy at the front
Lead door closing        | Seals on stone    | brush=Broad_edge shade=.3 release=1.5 tail=.5 width=.4 string=.2 volume=0 spread=7 pressure=0.7 | cellar | lowwalk | Low seals of a broad edge on stone
Millstone                | Seals on stone    | brush=Finger paper=Stone shade=.25 release=2.5 speed=.2 spread=14 string=.1 pressure=.8 volume=-2 grain=0.1 width=0 | lowdome | lowlong | Low finger seals on stone with a slow ring
Kick of the mule         | Seals on stone    | brush=Finger paper=Silk shade=.25 release=.25 tail=.1 lean=350 speed=.8 width=.1 string=.3 volume=-3 spread=15 pressure=0.3 | suboct | lowwalk | Short finger stamps on silk that drop into the note
Pile driver over the bay | Seals on stone    | brush=Broad_edge paper=Rough grain=.6 shade=.4 release=.5 tail=.2 speed=.6 width=.4 volume=6 dryness=0.15 tailLean=-15 | backhall 1.level=.9 | lowwalk | Blunt stamps of a broad edge on rough paper
Cask being filled        | Seals on stone    | brush=Hair paper=Rice shade=.25 release=1 bleed=.8 soak=2.5 ink=1 string=.1 dryness=0.05 tailLean=-70 | inkpot | lowline | Wet hair seals on rice, low and soon soaked in
Black peat water         | Ink soaking in    | brush=Finger shade=.3 attack=.05 soak=3 release=.8 width=.5 dryness=0.1 tailLean=-30 | blanket | lowlong | Finger seals on rice that turn to a low soft stain
Water under the field    | Ink soaking in    | script=Level brush=Finger paper=Silk shade=.03 attack=.2 bleed=.8 soak=5 ink=.8 width=.6 volume=-15 tail=.8 dryness=0.2 redip=0.5 | darkwater | lowline | A finger held low in very dim ink while its stain spreads round it
Seam of clay             | Ink soaking in    | brush=Broad_edge paper=Stone attack=.02 soak=8 shade=.4 release=2 width=.7 spread=8 tailLean=-15 volume=0 | lowbowls | lowlong | Broad seals on stone that leave a low slow stain
Roots of the fig         | Ink soaking in    | script=Level brush=Reed_pen paper=Rice shade=.2 attack=.1 soak=4 bleed=.9 ink=.7 width=.5 volume=1.5 spread=14 string=.4 grain=.4 pressure=.85 dryness=0.7 redip=0.3 | lowshadow | lowwalk | A dark reed pen on rice, half stroke and half stain
Cistern lid              | Ink soaking in    | script=Dot brush=Hair paper=Rice attack=.01 shade=.4 soak=6 speed=.3 string=.5 width=.4 volume=5.5 tail=.8 dryness=0.6 tailLean=-90 | cave | lowline | Low hair dots on rice that leave a wide stain
Plain timber             | -                 | brush=Finger paper=Silk attack=.02 release=.2 ink=1 dryness=0 shade=.2 string=.15 bleed=0 pressure=.5 width=.1 grain=0.08 lean=-8 | soften | lowwalk | A wet finger held low on silk, plain and round
Lowest rank of pipes     | -                 | brush=Finger paper=Silk attack=.1 release=.6 ink=1 shade=.4 string=0 bleed=.1 spread=1 width=.4 volume=-3.5 tail=0 grain=0 redip=0.25 lean=30 pressure=0.7 | pedalpipe | lowlong | A round finger held low with no string in it | organ
Old tow rope             | -                 | brush=Broad_edge paper=Silk attack=.02 release=.3 spread=42 width=.7 pressure=.8 shade=.5 dryness=.5 volume=-2.5 tail=0.05 lean=-8 | cavern | lowwalk | A frayed broad edge held low, its hairs far apart
Mole                     | -                 | brush=Feather paper=Rice attack=.02 release=.4 shade=.25 string=.6 grain=.5 pressure=.8 ink=.9 width=.4 volume=1 spread=17 tailLean=-70 | cupboard | lowwalk | A feather on rice, low and soft over its string
Thunder behind a wall    | -                 | brush=Hair paper=Rough script=Trembling attack=.2 release=1.5 shade=.2 pressure=.9 speed=.7 grain=.6 ink=.9 volume=6 redip=0.25 tailLean=-40 | nextdoor 1.level=.9 | lowline | A hair brush shaking low on rough paper
`,
    },
    {
      id: 'seals',
      name: 'Seal bells',
      category: 'bell',
      rows: `
Vermilion on slate       | Seals on stone    | string=.6 shade=.4 release=4 spread=12 volume=-3.5 pressure=1 bleed=.7 soak=12 tail=1 grain=0.06 tailLean=-90 | hall | toll | Hair seals pressed hard on stone, beating, a string in each
Pale handbell            | Seals on stone    | pressure=.1 shade=.9 string=.05 release=2 tail=.6 volume=-1 spread=7 grain=0.06 | daylight | change | Light hair seals on stone, pale and near
Bell rope, untouched     | Seals on stone    | speed=.15 ink=1 attack=.03 release=6 shade=.45 bleed=.6 soak=10 volume=-3.5 dryness=.1 tail=1 grain=0.12 tailLean=-15 | cathedral | toll | Slow wet seals on stone with a wide stain
Goat on the far slope    | Seals on stone    | speed=.9 string=.5 release=.5 tail=.3 shade=.75 spread=14 width=1 volume=6 grain=.4 tailLean=-90 dryness=0.55 pressure=0.4 | farshore 1.level=.9 | change | Quick hair seals on stone, a little cracked
Shop door                | Seals on stone    | release=1 string=.35 shade=.8 lean=60 tail=.4 speed=.7 width=.4 volume=-1 grain=0.08 pressure=0.35 | corner | change | Small hair seals on stone that enter a shade sharp
Basin carried level      | Seals on stone    | brush=Finger string=0 shade=.5 ink=1 release=5 volume=-6 pressure=.95 spread=12 bleed=.6 soak=3 tail=.5 grain=0.08 | lowbowls | toll | Wet finger seals on stone, round and full
Flicked wine glass       | Seals on stone    | brush=Finger string=.55 pressure=.3 shade=.8 release=3 spread=1 speed=.7 volume=-3 grain=.4 dryness=0.2 tailLean=-70 | glasshalo | highbells | Light fingertip seals on stone in pale ink
Dairy floor              | Seals on stone    | brush=Finger speed=.25 shade=.35 release=2.5 bleed=.7 soak=4 attack=.02 volume=-1 dryness=0.05 tailLean=-50 | splate | change | Soft finger seals on stone, the stain coming up behind
Spoon on the saucer      | Seals on stone    | brush=Finger string=.6 speed=.9 release=.4 tail=.1 shade=.65 width=.3 volume=1 pressure=.4 spread=6 grain=0.08 tailLean=-50 | bare | change | Very short finger seals on stone with a plucked edge
Moon in the horse trough | Seals on stone    | brush=Finger redip=.5 release=4 spread=30 shade=.4 tailLean=-60 volume=-5.5 lean=-200 speed=.2 grain=0.06 width=0.3 | under | toll | Finger seals on stone that waver up into place and sag slightly
Gamelan by the gate      | Seals on stone    | brush=Reed_pen shade=.6 release=2.5 spread=24 string=.6 volume=-2 tail=1 grain=.4 width=0.8 tailLean=-20 | ringhalo | change | Reed pen seals on stone, stringy and beating
Clapper of horn          | Seals on stone    | brush=Reed_pen release=.7 tail=.3 string=.5 shade=.5 speed=.8 width=.4 volume=0 grain=0.08 pressure=0.45 | kettle | change | Short hollow reed seals on stone
Iron triangle            | Seals on stone    | brush=Reed_pen pressure=.2 shade=.65 release=5 tail=1 string=.15 volume=3.5 grain=.05 width=0.75 tailLean=-40 | shimtrem | highbells | Light reed seals on stone, thin and long
Anvil at dusk            | Seals on stone    | brush=Reed_pen pressure=.9 paper=Stone shade=.6 release=1.5 string=.2 grain=.5 volume=-5.5 spread=17 tailLean=-30 | spring | toll | Hard reed seals on stone, bright and full
Chapel of one window     | Seals on stone    | brush=Reed_pen speed=.2 attack=.02 release=7 bleed=.7 soak=8 shade=.3 volume=-2 spread=8 tailLean=-15 | oos | toll | Slow dark reed seals on stone with a deep stain
Temple gong in fog       | Seals on stone    | brush=Broad_edge shade=.4 release=6 spread=16 volume=1.5 speed=.1 pressure=1 redip=.15 bleed=.7 grain=0 tailLean=-70 string=.5 | gonged | toll | Broad seals on stone, wide and slow, struck again if held
Dock signal              | Seals on stone    | brush=Broad_edge string=.4 release=2 speed=.7 shade=.6 pressure=.8 volume=1.5 spread=10 width=0.8 | farshore 1.level=.9 | toll | Firm broad seals on stone with a wire in them
Cracked tower bell       | Seals on stone    | brush=Broad_edge spread=32 release=4 shade=.55 grain=.4 tail=1 volume=-4 dryness=0.15 width=0.4 pressure=0.8 | platform | toll | Broad seals on stone, cracked and beating
Tray of copper           | Seals on stone    | brush=Broad_edge pressure=.3 shade=.8 release=3 speed=.4 string=.1 width=1 volume=-1 grain=0.12 tailLean=-50 | slowstars | change | Light broad seals on stone in pale ink
Gate of the dyeworks     | Seals on stone    | brush=Broad_edge speed=.3 release=8 bleed=.5 soak=14 shade=.75 tailLean=-200 volume=-0.5 spread=28 width=0.8 pressure=0.75 string=.6 | mine | toll | Broad seals on stone whose tails sink by a tone
Snow off the bell frame  | Seals on stone    | brush=Feather release=3 shade=.4 string=.2 volume=3.5 speed=.9 bleed=.9 soak=9 spread=26 lean=150 grain=0.1 tailLean=-90 | mist | change | Feather seals on stone that drop into a soft wide stain
Stick along thin ice     | Seals on stone    | brush=Feather pressure=.2 shade=.55 release=5 tail=1 grain=.4 string=.05 volume=1 dryness=0.5 width=0.4 | whispers | highbells | Faint feather seals on stone
Wind chime of quills     | Seals on stone    | brush=Feather string=.7 release=2 redip=.4 speed=.7 shade=.45 spread=12 volume=6 grain=.05 dryness=0.5 tailLean=-90 | breezy | highbells | Feather seals with a plucked string in each
Ash on the altar         | Seals on stone    | brush=Feather paper=Rough grain=.6 release=2.5 string=.4 shade=.55 tail=.9 volume=-2.5 spread=14 pressure=0.7 | dplate | toll | Feather seals on rough paper, grey and grainy
Owl's hour               | Seals on stone    | brush=Feather paper=Silk attack=.05 release=4 speed=.2 shade=.5 bleed=.7 soak=5 volume=2 dryness=0.1 tailLean=-70 | swells | toll | Slow soft feather seals on silk
Muffled for mourning     | Seals on stone    | paper=Rice shade=.4 release=2 string=.2 bleed=.5 volume=-4 pressure=.3 spread=8 grain=0.06 tailLean=-50 | pillow | toll | Hair seals on rice paper, muffled
Snowed-in belfry         | Seals on stone    | paper=Rice brush=Finger shade=.75 release=3 bleed=1 soak=7 ink=1 string=0 spread=17 tail=1 pressure=.2 grain=0.04 tailLean=-90 | soft | toll | Soaked light finger seals on rice with no edge at all
Tap on a paper lantern   | Seals on stone    | paper=Rice brush=Broad_edge shade=.6 release=1.2 speed=.7 string=.5 width=.6 volume=1.5 spread=15 tailLean=-15 pressure=0.8 | shell | change | Broad seals on rice with a string behind the paper
Felt chimes              | Seals on stone    | paper=Rice brush=Hair attack=.03 shade=.8 release=1.5 spread=10 string=.4 volume=1 dryness=0.15 tailLean=-20 | felted | highbells | Soft pale hair seals on rice
Weight of bronze         | Seals on stone    | paper=Rice brush=Reed_pen shade=.25 release=4 pressure=.9 string=.4 bleed=.6 volume=-1 spread=10 dryness=0.55 | lowdome | toll | Heavy dark reed seals on rice
Silk cord chime          | Seals on stone    | paper=Silk shade=.55 release=3 string=.4 tail=.9 volume=1.5 dryness=0.2 pressure=0.66 | plate | highbells | Hair seals on silk, clear, with a string in them
Tines of a comb          | Seals on stone    | paper=Rice brush=Reed_pen string=.8 release=.8 speed=.6 shade=.45 width=.2 volume=4 tail=.1 spread=17 tailLean=-90 | booth | change | Reed seals on rice paper that pluck the string beneath
Cup and thimble          | Seals on stone    | paper=Silk brush=Finger release=1 shade=.9 pressure=.1 string=.25 ink=.9 speed=.5 volume=2 grain=0 tailLean=-20 spread=20 | octcanon | highbells | Pale light finger seals on silk
Carillon rehearsal       | Seals on stone    | paper=Silk brush=Broad_edge release=2.5 string=.2 shade=.65 redip=.3 spread=5 volume=0.5 grain=.05 tail=1 dryness=0 width=0.3 | latearrive | change | Broad seals on silk, each freshening the last
Ring of keys             | Seals on stone    | paper=Silk brush=Feather string=.9 release=1.5 shade=.4 spread=24 speed=.8 volume=6 grain=.05 width=0.6 tailLean=-70 | grazed 2.gain=6 | highbells | Feather seals on silk with the string ringing in each
Chandelier, one drop     | Seals on stone    | brush=Finger shade=.85 release=2.5 string=.1 speed=.8 volume=0 pressure=.2 spread=14 redip=.2 lean=-60 dryness=0 tailLean=-90 | glassbar | change | Light finger seals on stone, pale and slightly apart, struck again if held
Clock with one tooth     | Seals on stone    | paper=Silk brush=Hair release=.9 shade=.7 tail=.5 string=.5 speed=.6 volume=1 spread=20 tailLean=-30 | chimed | change | Short hair seals on silk
Bell inside a bell       | Seals on stone    | brush=Broad_edge release=3.5 shade=.5 string=0 spread=28 pressure=.9 volume=0.5 speed=.15 bleed=.7 soak=8 tailLean=-90 dryness=0.05 | ringslow | toll | Broad seals on stone, heavy and slow over a deep stain
Propped piano lid        | Seals on stone    | brush=Reed_pen string=.85 release=3 shade=.6 paper=Rough volume=-1 grain=0.5 tailLean=-40 pressure=0.7 | pedal | change | Reed seals on rough paper that pluck the string hard
Weathercock turning      | Seals on stone    | brush=Hair release=4 shade=.55 redip=.45 spread=20 string=.1 volume=-0.5 lean=-300 ink=.4 dryness=0.65 width=0.5 | onewheel | toll | Hair seals on stone that rise a third, struck again while they are held
Lift between floors      | Seals on stone    | lean=-400 attack=.02 release=2 tailLean=0 shade=.85 speed=.5 volume=4 spread=15 pressure=.25 string=.6 grain=0.14 | tunnel | change | Light hair seals on stone that rise a third into the note
Plumb bob let down       | Seals on stone    | brush=Finger lean=1000 attack=.015 release=2.5 tail=.9 shade=.8 volume=-1 string=.6 grain=.4 pressure=1 dryness=0.65 tailLean=-30 spread=18 | skips | change | Finger seals on stone that drop nearly an octave into place
Church left behind       | Seals on stone    | brush=Broad_edge release=5 tail=1 shade=.8 volume=0.5 tailLean=-1200 speed=.9 spread=20 string=.55 paper=Rough grain=.5 width=0.3 pressure=0.75 | sagging | toll | Broad seals on rough paper whose tails slide down an octave
Kite bell                | Seals on stone    | brush=Reed_pen tailLean=600 release=4 tail=1 shade=.6 paper=Silk string=.4 volume=-1 dryness=0.7 pressure=0.35 | faintlift | change | Reed seals on silk whose tails float upwards
Toy on a wire            | Seals on stone    | paper=Silk brush=Hair lean=200 tailLean=-200 release=2 shade=.9 string=.3 speed=.8 volume=-1.5 grain=.05 pressure=.3 spread=17 | slack | change | Hair seals on silk that arrive sharp and leave flat
Row of icicles           | Stone marks       | brush=Hair release=1.5 lean=0 tailLean=0 pressure=.3 shade=.65 speed=.6 volume=2.5 | ladder | highbells | Thin hair dots on stone
Bicycle in the lane      | Stone marks       | brush=Reed_pen redip=.7 release=.8 lean=0 tailLean=0 speed=.7 shade=.5 volume=4.5 spread=24 pressure=.2 string=.2 grain=.1 | circle | highbells | Reed dots on stone, quick and wet
Star counted twice       | Stone marks       | brush=Finger release=6 tail=1 lean=0 tailLean=0 shade=.75 string=0 bleed=.5 soak=9 volume=-0.5 | slowstars | highbells | Finger dots on stone, plain and long
Tongs for the sugar      | Rain of dabs      | paper=Stone redip=.3 brush=Finger speed=.8 release=.3 shade=.8 string=.4 spread=4 width=.5 volume=-6 grain=0.42 lean=40 pressure=0.35 | wallup | highbells | Tiny finger dabs on stone
Music box on ice         | Rain of dabs      | paper=Stone redip=0 brush=Reed_pen speed=.5 release=.9 string=.7 spread=12 volume=5 shade=.45 grain=.05 dryness=0.55 tailLean=-30 | parlour | highbells | Reed dots on stone with the string plucked clearly
`,
    },
    {
      id: 'redipped',
      name: 'Redipped drones',
      category: 'drone',
      rows: `
Kept wet all night       | Redipped drone    | redip=.5 ink=.8 dryness=.15 shade=.4 pressure=.95 spread=20 speed=.6 string=.45 grain=0.1 tailLean=-30 | dplate | fifth | A hair brush pressed on silk and kept wet, low in colour and thick
Every other breath       | Redipped drone    | redip=.22 ink=.35 dryness=.8 speed=.5 volume=1 grain=0.5 width=0.75 | longsigh | openfifth | A hair stroke that thins to skips before each new dip
Dip, drag, dip           | Redipped drone    | redip=.75 ink=.3 speed=.6 pressure=1 spread=4 release=1.5 shade=.25 volume=1 width=0.45 dryness=.85 string=0 grain=0.38 tailLean=-90 | losing | onenote | A stroke dipped again and again, each splash heard
Long vigil               | Redipped drone    | attack=2.6 release=10 redip=.12 bleed=1 soak=18 shade=.35 volume=-6 pressure=.25 grain=0.1 tailLean=-50 | nave | fifth | A hair stroke so slow that its stain leads it
Wheel of a water mill    | Redipped drone    | redip=1 ink=.2 speed=.8 dryness=.6 string=.5 width=.6 release=1 shade=0.15 grain=0.42 lean=0 pressure=.9 bleed=0.3 spread=20 | loop | openfifth | A quick short-lived stroke dipped almost without pause
Quarry without the men   | Redipped drone    | brush=Broad_edge paper=Rough redip=.4 grain=.6 shade=.3 ink=.7 volume=-2.5 width=0.4 tailLean=-40 | icefilter | openfifth | A broad edge on rough paper, refilled now and then
Hull against the fenders | Redipped drone    | brush=Broad_edge pressure=.9 redip=.6 spread=16 shade=.4 attack=.8 bleed=.4 dryness=.1 string=.45 grain=0 tailLean=-70 | wobble | openfifth | A broad edge pressed on silk, kept wet and out of tune
Cellar of barrels        | Redipped drone    | brush=Broad_edge paper=Rice redip=.3 shade=.15 bleed=1 soak=20 attack=1.2 volume=-5 pressure=.9 grain=0.42 width=0.3 | monks | openfifth | A dark broad edge on rice that mostly soaks in
Slow saw                 | Redipped drone    | brush=Broad_edge paper=Silk redip=.85 ink=.4 dryness=.9 speed=.7 string=.4 release=1.2 volume=0 width=0.5 tailLean=-40 pressure=0.7 | grit | onenote | A broad edge that tears and is wetted every moment
Scaffold in the mist     | Redipped drone    | brush=Broad_edge pressure=.15 shade=.85 redip=.35 attack=1.8 paper=Stone width=1 volume=1.5 grain=0.06 tailLean=-70 | mist | openfifth | A light broad edge on stone, pale and refilled
Bagpipe in a drawer      | Caught hairs      | redip=.6 ink=.8 dryness=.2 paper=Silk attack=.3 release=1 grain=.3 speed=.4 volume=-3 width=0.4 lean=20 | cupboard | openfifth | A reed pen held wet on silk, hollow and steady
Reed cutter's rest       | Redipped drone    | brush=Reed_pen redip=.4 paper=Rice shade=.25 spread=12 attack=1 volume=-0.5 grain=0.14 tailLean=-20 pressure=0.35 | twoloops | fifth | A reed pen on rice, dark, dipped every few breaths
Nest under the gutter    | Caught hairs      | redip=.9 ink=.3 dryness=1 speed=1 spread=30 attack=.8 release=2 volume=6 tail=0.65 tailLean=-70 shade=.2 | farstation | onenote | A dry reed pen on rough paper, buzzing and wetted fast
Organ pump left running  | Redipped drone    | brush=Reed_pen paper=Stone redip=.55 shade=.45 ink=1 dryness=0 attack=.4 release=.8 bleed=.2 spread=2 volume=1 grain=0.06 width=0.4 pressure=0.66 | organloft | fifth | A full reed pen on stone, plain and unbroken | organ
Canes in a slow wind     | Redipped drone    | brush=Reed_pen redip=.28 paper=Rough dryness=.7 pressure=.3 shade=.5 attack=2 width=.6 volume=1 tail=.9 grain=0.42 lean=15 | whistled | openfifth | A light reed pen on rough paper that fails and is filled
Folded swan's wing       | Redipped drone    | brush=Feather redip=.3 paper=Silk ink=.7 shade=.2 attack=1.5 grain=.3 volume=-2.5 pressure=1 string=.5 width=0.3 lean=0 | hall | openfifth | A dark feather pressed on silk over a string, refilled in slow breaths
Bellows of the forge     | Redipped drone    | brush=Feather redip=.6 paper=Rough speed=.9 grain=.5 pressure=.8 shade=.15 attack=.6 volume=-2 width=0.6 tailLean=-90 string=.5 | breathverb | fifth | A feather rubbed fast on rough paper, dipped as it goes
Milkweed                 | Redipped drone    | brush=Feather redip=.3 paper=Rice pressure=.05 shade=.6 bleed=.9 soak=8 spread=28 volume=-1.5 grain=.05 tailLean=-70 lean=40 | veil | openfifth | A pale feather on rice, its hairs far apart
Steam under the lid      | Redipped drone    | brush=Feather redip=.9 paper=Stone ink=.3 shade=.4 speed=.5 attack=.8 release=2 string=.3 volume=1.5 grain=.05 width=0.8 tailLean=-15 | kettle | onenote | A feather on stone, wetted quickly over and over
Dark of the barn         | Redipped drone    | brush=Feather redip=.4 paper=Silk shade=0 pressure=.9 attack=1 string=.5 bleed=.5 volume=-2.5 tail=1 grain=0.12 tailLean=-70 | lowshadow | openfifth | A feather in very dark ink with the string under it
Cup of still water       | Redipped drone    | brush=Finger redip=.5 ink=1 dryness=0 spread=0 shade=.5 string=0 attack=1.4 volume=-10 grain=0 width=0.7 lean=-8 pressure=0.45 | bare | openfifth | A wet finger on silk, round and unbroken
Honey off the spoon      | Redipped drone    | brush=Finger paper=Rice redip=.35 shade=.3 bleed=.8 soak=6 spread=10 attack=.8 volume=-10 grain=0.08 width=0.4 | undertow | fifth | A finger on rice, slow and thick
Pulse in the wrist       | Redipped drone    | brush=Finger redip=.8 ink=.15 dryness=.4 paper=Silk shade=.6 speed=.4 attack=.5 release=1.5 volume=-0.5 grain=0.08 tailLean=-30 | quietpulse | onenote | A finger on silk that dries and is wetted in turn
Leather apron            | Redipped drone    | brush=Finger paper=Rough redip=.5 grain=.8 pressure=.9 shade=.4 attack=.6 string=.2 volume=-10.5 width=0.6 tailLean=-20 | wallup | fifth | A finger pressed on rough paper, its rub always there
Ring round the moon      | Glass rim line    | redip=.3 ink=.7 spread=30 attack=.9 release=6 speed=.1 volume=2 script=Trembling shade=.95 pressure=.2 tail=0.95 | glow | openfifth | Pale fingers round a stone rim, wavering slowly and wetted as they go
Crank, strings, resin    | Stroked strings   | redip=.6 ink=.5 speed=1 attack=.4 pressure=.8 paper=Rough release=1 volume=-3.5 spread=20 shade=.85 grain=.5 tail=0.55 tailLean=-40 | paperbuzz | fifth | Strings rubbed through rough paper by a refilled brush | string
Sleep of the cellist     | Stroked strings   | redip=.3 speed=.3 shade=.3 attack=.8 release=3 paper=Rice bleed=.6 tail=.9 spread=14 tailLean=-20 | cellos | fifth | A hair brush rubbing slowly through rice, dim and drowsy | string
Copper and cold air      | Stroked strings   | redip=.45 paper=Stone shade=.85 attack=1 speed=.5 pressure=.3 spread=10 release=3 volume=0 tail=0.65 tailLean=-70 | chamber | openfifth | Strings rubbed over stone in pale ink | string
Combed by the fire       | Stroked strings   | redip=.5 string=.6 attack=2.2 spread=22 width=1 release=4 bleed=.5 volume=-2 tail=.9 tailLean=-90 lean=15 | strpad | openfifth | Hairs and strings together, wide and slow | string
Tambura in plain cloth   | Stroked strings   | script=Seal redip=.7 attack=.03 string=.95 paper=Silk release=4 bleed=.7 soak=6 shade=.7 volume=-5 spread=15 tailLean=-30 | sitting | openfifth | Stamped awake under silk and left to sound, more string than hair | string
Standing stone, noon     | Glass rim line    | brush=Broad_edge redip=.4 speed=.5 shade=.45 attack=1.2 pressure=.7 volume=-2.5 tail=0.95 | lowdome | openfifth | A broad edge drawn round stone, thick and ringing
Menhir hum               | Redipped drone    | brush=Hair paper=Stone redip=.45 shade=.2 spread=15 attack=2.4 speed=.6 ink=.8 volume=-3.5 pressure=.95 string=.5 grain=0.12 tailLean=-70 | onewhistle | fifth | A hair brush pressed on stone in dark ink until it hums
Wet slate roof           | Glass rim line    | brush=Reed_pen redip=.6 shade=.35 attack=.8 grain=.4 spread=6 release=2 volume=-3 tail=0.75 tailLean=-20 | tube | openfifth | A reed pen drawn over wet stone
Cold from the crevasse   | Glass rim line    | brush=Feather redip=.35 pressure=.8 grain=.35 shade=.35 attack=2 ink=.6 volume=-2 release=10 tail=.9 spread=20 tailLean=-50 | wintry | fifth | A feather drawn over stone, airy and cold
Plate wiped clean        | Glass rim line    | redip=.7 ink=.25 dryness=.8 attack=1 spread=4 release=1.5 speed=1 volume=-4.5 grain=.5 tailLean=-30 | standcomb | openfifth | A quick finger on stone that squeaks dry and is wetted
Bog oak                  | Ink soaking in    | script=Level redip=.65 brush=Hair shade=.35 attack=.7 soak=15 volume=-9.5 pressure=.95 spread=30 string=.45 grain=0.55 tailLean=-90 | hanging | fifth | A hair brush pressed on rice, often dipped, under a stain that keeps growing
Reservoir                | Ink soaking in    | script=Level redip=.25 brush=Finger paper=Silk shade=.5 attack=2 soak=10 spread=14 volume=-12 pressure=.2 dryness=0.25 tailLean=-20 | darkwater | fifth | A finger on silk, its stain as wide as a lake
Watermark                | Ink soaking in    | script=Falling_sweep redip=.3 brush=Reed_pen paper=Rice shade=.35 attack=.3 soak=20 speed=.1 volume=6 grain=0.04 lean=-45 | frozen | openfifth | Reed sweeps on rice that leave their mark behind
Carpet underlay          | Ink soaking in    | script=Level redip=.6 brush=Feather paper=Rough shade=.3 attack=.8 soak=6 spread=34 volume=5.5 grain=0.08 width=0.4 | wool | fifth | A feather on rough paper, all of it blurred
Silt settling            | Ink soaking in    | script=Level redip=.5 brush=Broad_edge paper=Stone shade=.6 attack=1 soak=9 bleed=.85 ink=.7 volume=-0.5 dryness=0.5 lean=40 | softsag | openfifth | A broad edge on stone, sinking into its stain
Loom in the next room    | Redipped drone    | script=Trembling redip=.5 speed=.6 ink=.6 spread=6 attack=.6 release=2 shade=.55 volume=6 grain=0.1 width=0.5 | nextdoor | fifth | A trembling hair stroke, steadily refilled
Sewing past midnight     | Redipped drone    | script=Trembling redip=.8 speed=.95 brush=Reed_pen ink=.4 attack=.4 release=1 shade=.2 volume=0.5 grain=0.55 width=0.7 | cassette | onenote | A reed pen shaking fast, always dipped
Boat knocking            | Redipped drone    | script=Trembling redip=.4 speed=.15 brush=Broad_edge shade=.35 attack=.8 paper=Rough volume=6 grain=0.5 pressure=0.66 | backhall 1.level=.8 | openfifth | A broad edge rocking slowly on rough paper
Candle that will not die | Redipped drone    | script=Trembling redip=.6 speed=.4 brush=Finger shade=.75 attack=1.2 ink=.5 spread=16 volume=1 grain=0.06 lean=-45 bleed=1 | thinhalo | openfifth | A pale trembling finger on silk
Sail cloth in light air  | Redipped drone    | script=Trembling redip=.35 speed=.3 brush=Feather paper=Silk attack=1.5 shade=.3 grain=.25 volume=-1.5 width=0.75 lean=10 | openair | openfifth | A feather trembling slowly, filled and emptied
Empty well               | Redipped drone    | ink=.02 redip=0 dryness=.8 paper=Stone attack=1.5 shade=.35 pressure=.8 volume=1.5 string=.5 grain=.6 width=0.8 tailLean=-40 | mine | fifth | A hair brush with no ink on stone and a string beneath
Scree on the move        | Dry field         | brush=Broad_edge redip=.2 attack=2 shade=.35 release=5 string=.2 volume=1.5 spread=8 tailLean=-40 | cavern | openfifth | A nearly dry broad edge dragged over rough paper
Hemp and tar             | Dry field         | brush=Hair redip=.5 ink=.2 string=.6 speed=.5 attack=1 shade=.25 paper=Rough volume=1.5 spread=8 tailLean=-70 | oxide | fifth | A drying hair brush and a rubbed string on rough paper
Last hour of the fast    | Dry field         | brush=Finger paper=Rice redip=.15 ink=.1 attack=1.6 grain=.4 shade=.75 string=.5 pressure=.15 tail=0.95 tailLean=-50 | whispers | openfifth | A dry finger laid lightly on rice paper over a string
Husks                    | Dry field         | brush=Reed_pen redip=.3 ink=.1 paper=Silk spread=44 grain=.6 attack=.8 shade=.35 speed=.6 volume=4 pressure=.1 string=.6 tail=0.75 tailLean=-15 | whispers | openfifth | A dry reed pen barely on silk, its hairs apart over a string
`,
    },
    {
      id: 'dry-paper',
      name: 'Dry textures',
      category: 'texture',
      rows: `
Broom in the courtyard   | Dry field         | ink=0 speed=.6 attack=.3 release=1 bleed=.2 volume=6 shade=.05 pressure=.4 grain=.3 spread=14 width=0.5 | blotter | field | A feather with no ink swept softly over rough paper
Fur and small bones      | Dry field         | pressure=.3 grain=.7 shade=0.2 attack=.6 release=2 spread=20 width=.6 volume=-0.5 tail=0.65 lean=20 | lamplit | field | A light dry feather on rough paper, mostly tooth
Low stable lamp          | Dry field         | paper=Rice ink=.15 grain=.6 attack=1.2 shade=.15 bleed=.9 soak=6 volume=1 string=.6 pressure=.2 tail=0.85 width=0.75 | lamplit | onenote | A light dry feather on rice paper over a string, with a soft stain
Wings behind the ceiling | Dry field         | script=Trembling speed=.7 attack=.2 release=.8 shade=0.1 volume=4 tail=0.65 lean=10 grain=0.5 string=0.35 | across | field | A dry feather fluttering over rough paper
Snow against the door    | Dry field         | paper=Silk ink=.1 shade=.25 attack=2 release=5 width=1 grain=.2 volume=5 pressure=.3 spread=17 lean=0 | nearshadow | openfifth | A dry feather laid lightly on silk, soft and slow
Dragged over gravel      | Dry field         | brush=Hair ink=.05 grain=.6 speed=.8 attack=.2 release=1 shade=.2 volume=4 spread=7 | valve | onenote | A dry hair brush dragged quickly over rough paper
Lint on the needle       | Dry field         | brush=Hair paper=Silk ink=.1 dryness=1 spread=40 attack=.5 shade=.4 volume=1 string=.6 pressure=.2 tail=0.85 | disc | field | Dry hairs on silk over a string, each on a pitch of its own
Moss under bark          | Dry field         | brush=Hair paper=Rice ink=.2 dryness=.7 attack=1 shade=.2 bleed=0.4 soak=12 volume=4 spread=14 lean=-45 string=0.8 pressure=.2 | lowtide | openfifth | A dry hair brush on rice in dark ink, rubbing a string
Horsehair sofa           | Dry field         | brush=Hair string=.5 grain=.5 attack=.1 release=.6 pressure=.9 shade=.35 volume=2.5 spread=17 lean=0 | combo | field | A dry hair brush pressed on rough paper over a string
Ashes raked              | Dry field         | brush=Hair script=Falling_sweep speed=.3 attack=.05 release=3 grain=.6 lean=0 volume=4 tail=0.85 shade=.25 | mine | field | Dry hair sweeps that land hard and crumble
Bark rubbing             | Caught hairs      | ink=.1 attack=.2 release=1.2 shade=.25 redip=0 grain=1 volume=6 spread=14 lean=-60 | desk | field | A dry reed pen rubbed over rough paper
Cricket in the wall      | Caught hairs      | ink=.15 script=Trembling speed=.9 attack=.1 release=.4 paper=Silk shade=0.08 redip=0 volume=6 tail=0.05 lean=-8 grain=0.3 string=0.25 | nextdoor 1.level=.9 | field | A dry reed pen shivering on silk
Thorn and wool           | Caught hairs      | ink=.3 redip=.5 dryness=1 spread=26 attack=.6 release=2 shade=.2 volume=2.5 tail=0.55 lean=30 | embers | openfifth | A reed pen that catches, is dipped, and catches again
Rushes trodden           | Caught hairs      | ink=.05 paper=Rice bleed=.8 soak=5 attack=.4 release=2.5 shade=.3 redip=0 volume=-1 spread=15 lean=40 | darkwater | field | A dry reed pen on rice that blurs where it treads
Telegraph wires          | Caught hairs      | ink=.2 string=.8 attack=.8 release=3 paper=Stone redip=0 shade=.4 grain=.6 volume=-6.5 tail=0.95 width=0.4 | longspring | openfifth | A dry reed pen on stone over a singing wire
Sleigh runner            | Dry field         | brush=Broad_edge paper=Stone ink=.1 speed=.9 attack=.4 shade=.5 release=2 volume=-2.5 spread=14 lean=15 | flange | field | A dry broad edge run fast over stone
Folded sandpaper         | Dry field         | brush=Broad_edge grain=1 pressure=.9 attack=.1 release=.4 shade=.6 width=.5 spread=8 lean=0 | wallup | field | A dry broad edge pressed on rough paper
Loft boards              | Dry field         | brush=Broad_edge paper=Rice ink=.1 attack=1.5 bleed=.7 soak=8 shade=.25 release=4 volume=-5 tail=0.75 lean=0 | lowtide | openfifth | A dry broad edge on rice, dark and slow
Matting rolled up        | Dry field         | brush=Broad_edge script=Rising_hook speed=.2 attack=.2 release=1 grain=.8 lean=0 shade=.4 volume=6 spread=8 width=0.75 | dusty | field | Dry broad strokes on rough paper that swell and stop
Peeling paint            | Dry field         | brush=Broad_edge paper=Silk ink=.2 dryness=1 spread=48 attack=.3 shade=.7 redip=.4 volume=1.5 tail=0.95 lean=30 | keyed | field | A frayed broad edge on silk, splitting and redipped
Dry lips                 | Dry field         | brush=Finger paper=Silk ink=.05 dryness=.8 attack=.5 shade=.6 grain=.4 release=1.5 volume=1 spread=12 width=0.3 | middle | field | A dry finger on silk, half hush and half tone
Palm on a wall           | Dry field         | brush=Finger paper=Rough ink=.1 pressure=.9 attack=.2 release=.6 shade=.3 grain=.9 volume=5.5 spread=20 lean=15 | across | field | A dry finger pressed along rough paper
Squeak of chalk dust     | Dry field         | brush=Finger paper=Stone ink=.1 speed=.9 attack=.6 shade=.6 release=3 grain=.3 volume=-3.5 spread=15 tail=0.55 lean=0 | hairline | openfifth | A dry finger on stone, pale and singing
Counting the pages       | Dry field         | brush=Finger paper=Rice script=Dot ink=.05 attack=.01 grain=.8 release=.4 speed=.3 volume=5.5 spread=7 lean=-45 | twoloops | rain | Dry fingertips tapping rice paper
Candle wax scraped       | Dry field         | brush=Finger paper=Stone script=Falling_sweep ink=.15 speed=.4 attack=.1 lean=300 release=2 shade=.6 volume=0 width=0.6 | sagging | field | Dry finger sweeps on stone that slide down from a third above
Wood smoke on linen      | Dry field         | script=Rising_hook speed=.08 attack=1 release=4 lean=0 shade=.2 bleed=.9 soak=10 volume=1.5 tail=0.65 | hanging | openfifth | A dry feather that rises slowly out of rough paper
Cave mouth at dawn       | Dry field         | paper=Stone shade=.35 attack=1.2 release=4 grain=.4 bleed=.8 soak=7 volume=1.5 spread=20 width=0.75 | glassfog | openfifth | A dry feather on stone with its stain behind it
Steam from a dye vat     | Dry field         | paper=Silk ink=.2 spread=58 attack=.7 release=6 bleed=1 soak=14 shade=.3 volume=1 tail=0.85 | cloud | openfifth | A feather on silk, every hair astray and soaking in
Fog on the weir          | Dry field         | brush=Broad_edge paper=Silk ink=.15 attack=2.4 release=6 bleed=.9 soak=16 shade=.3 speed=.7 volume=-2 spread=15 lean=-8 | nave | openfifth | A dry broad edge on silk and a slow stain
Mould on old music       | Dry field         | brush=Reed_pen paper=Rice ink=.1 attack=1 bleed=1 shade=.4 volume=4 soak=9 release=3 tail=0.55 lean=15 | afterimage | openfifth | A dry reed pen on rice whose stain outlives it
Pebbles poured           | Rain of dabs      | ink=.1 dryness=.9 paper=Stone redip=0 grain=.5 spread=30 speed=.7 release=.4 string=.1 volume=3.5 tail=0 width=0.75 pressure=0.25 shade=0.22 | stars | rain | Dry hair dabs on stone
Hail on a tent           | Rain of dabs      | ink=.05 brush=Broad_edge paper=Rough redip=0 grain=1 string=.1 shade=.6 volume=-2.5 release=.5 speed=.6 dryness=0 width=0.5 | dubsweep | rain | Dry broad dabs on rough paper, hard and short
Ants on the paste        | Rain of dabs      | brush=Feather paper=Rice redip=0 grain=.6 string=0 shade=.5 volume=6 release=.7 speed=.4 ink=.2 dryness=0.55 lean=30 | crystals 2.gain=8 | rain | Tiny dry feather dabs on rice
Grain in a paper bag     | Rain of dabs      | ink=.1 brush=Reed_pen paper=Rough redip=.3 grain=.6 release=.5 string=.3 spread=22 volume=0 tail=0.85 lean=-60 shade=.35 | shell | rain | Dry reed dabs on rough paper, a little wetter each time
Fingernails, waiting     | Rain of dabs      | ink=.2 brush=Finger paper=Rough redip=0 grain=.7 speed=.8 release=.15 string=.25 spread=5 volume=-6.5 tail=0.15 lean=15 shade=.5 | ladder 2.gain=6 | rain | Dry finger dabs on rough paper, very short
Nest from the chimney    | Dry field         | string=.7 attack=.3 release=1.5 shade=.35 grain=.4 ink=.1 volume=0.5 spread=14 width=0.8 | grazed | field | A dry feather that rubs the string under rough paper | string
Fiddle in the hayloft    | Dry field         | brush=Hair string=.85 attack=.4 speed=.6 release=1 shade=.5 grain=.5 ink=.15 volume=-2 spread=17 | cassette | field | A dry hair brush scraping its string | string
Rope round a post        | Dry field         | brush=Broad_edge string=.75 attack=.6 paper=Rough speed=.7 pressure=.9 release=1.5 shade=.35 volume=3.5 width=0.3 tail=0.85 lean=-8 | soften | lowlong | A dry broad edge and a low rubbed string | bass
Harp with dust in it     | Dry field         | brush=Feather script=Dot attack=.005 shade=.6 speed=.3 volume=6 release=4 grain=.3 string=.75 ink=.3 spread=7 | darkstrings 2.gain=12 | fallarp | Dry feather dots that leave only what they pluck | plucked
Gentle wire brush        | Dry field         | brush=Reed_pen string=.6 script=Seal attack=.02 release=1 paper=Stone grain=.8 shade=.6 volume=-0.5 spread=14 lean=10 | spring | change | Dry reed stamps on stone with wire in them | bell
Veil pulled aside        | Dry field         | brush=Feather paper=Silk script=Falling_sweep speed=.2 attack=.2 release=3 lean=500 tailLean=-300 shade=.2 volume=6 grain=.35 tail=0.75 | sighs | field | Dry feather sweeps on silk that glide in from a fourth above
Sleeve across the desk   | Dry field         | brush=Broad_edge paper=Rice script=Falling_sweep speed=.6 attack=.1 lean=-200 release=.8 grain=.6 shade=.5 volume=2.5 tail=0.55 width=0.8 spread=30 string=.5 bleed=.2 | reel | field | Dry broad sweeps on rice that slide up into place
Blown out                | Dry field         | brush=Feather paper=Rough script=Seal release=10 grain=.5 tailLean=-1000 tail=1 shade=.6 attack=.3 string=0 volume=6 bleed=.9 ink=.2 pressure=.95 spread=20 lean=-60 | valley 2.gain=7 | field | Dry feather stamps whose last hairs fall away
Fence in the headlights  | Dry field         | brush=Reed_pen script=Trembling speed=.3 paper=Rough attack=.2 spread=14 release=1 shade=.3 ink=.2 volume=6 grain=.5 tail=0.55 lean=0 bleed=1 | leftright 3.gain=6 | openfifth | A dry reed pen shaking slowly on rough paper
Sparks off a wheel       | Dry field         | brush=Finger paper=Stone script=Rising_hook speed=.5 ink=.15 attack=.05 lean=-600 release=1.5 shade=.8 volume=1 spread=14 width=0.75 | firstlight | field | Dry finger strokes on stone that fly up into the note
Static on a pullover     | Dry field         | redip=.8 ink=.1 speed=.9 attack=.4 shade=0.1 spread=26 release=1 volume=1.5 tail=0.75 width=0.5 grain=0.35 string=0.1 | dusty | onenote | A dry feather wetted over and over, never for long
Tap left dripping        | Dry field         | brush=Hair paper=Stone redip=.95 ink=.05 speed=1 attack=.8 shade=.5 string=.1 release=2 volume=-3 grain=1 tail=0.55 lean=0 | bath | onenote | A dry hair brush rubbed fast on stone, refilled drop by drop
Pages in the wind        | Dry field         | brush=Hair paper=Silk redip=.4 ink=.2 dryness=.9 attack=.6 width=1 speed=.4 shade=.35 volume=0.5 script=Falling_sweep tail=0.85 lean=0 | shadow | openfifth | Hair strokes on silk that land, skip, fail and are dipped
Cart track in summer     | Dry field         | brush=Broad_edge redip=.7 ink=.15 speed=.3 attack=.4 grain=.8 shade=.35 release=1.5 volume=2 spread=8 lean=10 | wobble | lowlong | A dry broad edge on rough paper, wetted at every rut | bass
Beehive in winter        | Dry field         | brush=Reed_pen paper=Rice redip=.5 ink=.2 attack=1.2 speed=.4 shade=.3 bleed=.5 spread=10 volume=6 width=.6 tail=.8 lean=-8 | revbed | fifth | A dry reed pen on rice, filled a little at a time
`,
    },
    {
      id: 'trembling',
      name: 'Trembling voices',
      category: 'voice',
      rows: `
Clear line, shaking hand | Trembling voices  | speed=.4 shade=.6 bleed=.3 spread=5 release=.8 volume=2.5 width=.2 grain=.05 redip=0.12 | bare | song | A round finger trembling on silk, near and clear
Old cantor               | Trembling voices  | shade=.3 pressure=.9 speed=.15 attack=.25 bleed=.4 lean=-60 release=1.6 volume=4.5 spread=4 width=.4 tailLean=-150 redip=0.25 | monks | song | A dark finger pressed hard on silk, shaking slowly and sagging at the end
Sisters at the sink      | Trembling voices  | spread=34 speed=.55 attack=.4 width=1 lean=-40 volume=1 redip=0.5 tailLean=-40 | twobirds | duet | A finger trembling on silk, its hairs set well apart
Sung into the elbow      | Trembling voices  | paper=Rice shade=.35 attack=.35 bleed=.8 soak=3 release=1.2 volume=1.5 redip=0.25 tailLean=-90 | blanket | song | A finger trembling on rice, muffled and warm
Pale treble              | Trembling voices  | pressure=.2 shade=1 speed=.65 attack=.8 lean=0 release=2.5 volume=3.5 spread=3 grain=0 dryness=0.15 redip=0.2 | ahs | duet | A fingertip trembling lightly on silk in pale ink
First lesson, winter     | Trembling voices  | brush=Hair shade=.4 speed=.6 attack=.25 release=.7 bleed=.2 string=.3 lean=-20 volume=0.5 width=.4 redip=0.15 | room | song | A hair brush trembling on silk with some string | string
Grass in both hands      | Trembling voices  | brush=Hair paper=Rough speed=.8 grain=.4 dryness=.6 ink=.5 attack=.1 release=.5 volume=-7 shade=.45 tail=0.85 tailLean=-15 | breezy 2.gain=6 | duet | A drying hair brush shaken fast on rough paper | texture
Choir in the crypt       | Trembling voices  | brush=Hair paper=Stone speed=.2 attack=1.2 release=4 spread=9 shade=.5 volume=-0.5 dryness=0.5 redip=0.12 | oos | choir | Hair strokes on stone, trembling slowly
Nervous reader           | Trembling voices  | brush=Hair speed=1 pressure=.4 attack=.08 release=.4 lean=0 shade=.5 bleed=.15 width=.4 redip=0.2 tailLean=-15 | pillow | reply | Light hair strokes on silk that shake very fast
Humming at the stove     | Trembling voices  | brush=Hair paper=Rice speed=.1 shade=.2 attack=.6 bleed=.6 release=1.5 pressure=.6 volume=2 grain=0.5 redip=0.15 | darkbox | song | A hair brush on rice, low in colour and hardly trembling
Row of white surplices   | Trembling voices  | brush=Feather speed=.45 attack=.7 release=2 grain=.1 shade=.45 pressure=.5 redip=0.3 tailLean=-90 volume=0.5 bleed=1 soak=8 | cathedral | choir | Feathers trembling on silk, as much air as tone
Whisper through the wall | Trembling voices  | brush=Feather paper=Rice speed=.7 shade=.35 pressure=.8 attack=.2 release=.6 ink=.4 grain=.4 volume=2.5 dryness=0.55 redip=0.25 | nextdoor 1.level=1 | song | A feather shaking quickly on rice
Shudder of old bellows   | Trembling voices  | brush=Feather paper=Rough speed=.15 grain=.6 attack=1 release=3 bleed=1 volume=-2 shade=.4 redip=0.25 width=0.5 soak=8 | cave | suspend | A feather on rough paper in slow shudders | texture
Jug with no lid          | Trembling voices  | brush=Feather paper=Stone speed=.35 pressure=.3 attack=.3 shade=.5 release=1.2 string=.15 volume=6 redip=0.25 width=0.8 | chamber | song | A light feather trembling on stone | wind
Moths at the screen      | Trembling voices  | brush=Feather speed=.95 dryness=.7 attack=.15 width=1 release=1 volume=0 shade=.15 ink=.8 pressure=.4 grain=.1 redip=0.3 tailLean=-15 | points | duet | A feather fluttering as fast as it can on silk | texture
Oboe behind the hedge    | Trembling voices  | brush=Reed_pen shade=.35 speed=.5 attack=.15 release=.5 bleed=.3 lean=-30 volume=2.5 dryness=0.5 tailLean=-70 redip=0.45 | corner | song | A reed pen trembling on silk, hollow and close | wind
Geese at evening         | Trembling voices  | brush=Reed_pen paper=Rough speed=.6 lean=-250 attack=.12 release=.6 grain=.4 shade=.5 volume=2.5 redip=0.5 tailLean=-40 | farshore 1.level=1 | reply | Reed strokes on rough paper that bend up and shake | wind
Clay whistles            | Trembling voices  | brush=Reed_pen paper=Stone speed=.75 pressure=.2 shade=.7 attack=.08 release=1 lean=80 tailLean=-80 volume=5.5 redip=0.25 spread=3 | waterpot | reply | Light reed strokes on stone, quick and a little sour | wind
Shepherd's double pipe   | Trembling voices  | brush=Reed_pen paper=Rice spread=22 speed=.35 attack=.3 release=1 shade=.25 ink=1 volume=2 redip=0.12 tailLean=-30 | fifthbeside | duet | A reed pen trembling on rice in dark ink | wind
Caller on the roof       | Trembling voices  | brush=Reed_pen speed=.25 lean=-400 tailLean=-200 attack=.6 release=1.5 tail=.7 shade=.4 bleed=.5 volume=3.5 redip=0.4 | late | song | Reed strokes on silk that rise a third, waver and fall
Giants humming           | Trembling voices  | brush=Broad_edge speed=.2 shade=.3 attack=.8 release=2.5 spread=8 lean=-50 volume=-2 dryness=0.5 redip=0.5 bleed=1 soak=8 string=.3 | monks | choir | Broad strokes on silk, rocking slowly
Men at the capstan       | Trembling voices  | brush=Broad_edge paper=Rough speed=.5 pressure=.9 attack=.15 release=.5 grain=.5 shade=.5 volume=-3 redip=0.5 tailLean=-30 | console | choir | Broad strokes shaken on rough paper
Crowd in the tunnel      | Trembling voices  | brush=Broad_edge paper=Stone spread=44 speed=.4 attack=1 release=4 shade=.6 width=1 volume=0.5 dryness=0.25 redip=0.2 | cavern | choir | Broad strokes on stone, wide and shaking
Baritone in wool         | Trembling voices  | brush=Broad_edge paper=Rice speed=.35 shade=.15 attack=.3 bleed=.7 release=1 pressure=.5 string=.2 volume=0.5 dryness=0.55 redip=0.12 | wool | song | A dark broad edge trembling on rice
Street of open windows   | Trembling voices  | brush=Broad_edge pressure=.15 shade=.9 speed=.65 attack=.5 release=2 lean=0 paper=Silk volume=3 spread=22 tailLean=-150 redip=0.5 | hollow | duet | The corner of a broad edge trembling on silk
Goodbye at the gate      | Trembling voices  | tailLean=-400 tail=.9 release=2 speed=.4 attack=.3 shade=.65 lean=-40 bleed=.4 volume=1.5 dryness=0 redip=0.15 | softsag | song | Finger voices on silk that fall a third as they leave
Swooping soprano         | Trembling voices  | lean=-1200 attack=.35 speed=.7 shade=.8 release=1.5 spread=4 pressure=.5 tailLean=0 volume=0.5 dryness=0.2 redip=0.5 | glimmer | duet | Voices that sweep up an octave into the note
Yawn                     | Trembling voices  | lean=600 tailLean=-900 tail=.8 speed=.15 attack=1 release=3 brush=Finger paper=Rice shade=.5 volume=-2.5 redip=.15 dryness=.1 grain=0.34 | halfspeed | suspend | Slow finger strokes on rice that slide down at both ends
Call across the quarry   | Trembling voices  | brush=Hair paper=Stone lean=-500 attack=.15 speed=.5 release=2 tail=.8 shade=.7 string=.15 volume=0.5 redip=0.12 tailLean=-30 | heads | reply | Hair strokes on stone that leap up a fourth
Laugh on the stairs      | Trembling voices  | speed=.85 lean=300 tailLean=300 release=.8 attack=.06 brush=Finger paper=Stone shade=.7 bleed=.2 volume=-1.5 dryness=0.15 redip=0.2 | afterimage | ostin | Quick finger strokes on stone that shake and turn up
Dipped between the words | Trembling voices  | redip=.6 ink=.3 dryness=.6 speed=.5 attack=.2 release=.6 shade=.6 volume=1.5 grain=0.06 tailLean=-40 | reel | song | Trembling finger strokes that run short and are dipped
Wind caught again        | Trembling voices  | redip=.35 brush=Feather ink=.4 speed=.35 attack=.8 release=2 paper=Silk dryness=.5 grain=.1 shade=.4 bleed=1 volume=2.5 | breathverb | suspend | Trembling feathers that empty and fill
Sobs in the kitchen      | Trembling voices  | redip=.9 ink=.2 speed=.6 brush=Hair dryness=.8 attack=.1 release=.6 shade=.5 paper=Rice volume=6 grain=0.06 tailLean=-50 | bedside | song | Short trembling hair strokes on rice, dipped in gulps
Choir taking turns       | Trembling voices  | redip=.5 spread=18 ink=.35 speed=.3 brush=Finger paper=Rough attack=1 release=3 width=1 tail=0.95 bleed=1 soak=7 volume=-2 | choirgrain | choir | Fingers on rough paper, each running dry in turn
Ferryman's low call      | Trembling voices  | redip=.7 brush=Reed_pen ink=.4 speed=.2 paper=Rice shade=.3 attack=.5 release=1 grain=.4 volume=6 dryness=0.6 tailLean=-40 | tubevowel | song | A reed pen on rice, refilled as it trembles
Murmur under plaster     | Trembling voices  | bleed=1 soak=8 ink=.6 speed=.4 attack=.8 release=1 paper=Rice shade=.4 volume=-2.5 spread=24 pressure=.4 dryness=0.2 redip=0.2 | hanging | choir | Finger voices on rice that are mostly stain
Faces in the steam       | Trembling voices  | bleed=1 soak=14 brush=Feather paper=Rice speed=.6 attack=1.5 release=2 shade=.6 volume=2 dryness=0 redip=0.5 string=.3 | cloud | suspend | Feather voices soaking into rice
Water on the frescoes    | Trembling voices  | bleed=.95 soak=11 brush=Broad_edge paper=Rough speed=.3 attack=.5 shade=.35 release=2 ink=1 volume=-12 spread=28 pressure=1 redip=0.5 width=0.8 | darkwater | duet | Broad wet voices on rough paper, blurred by their stain
Letter read by candle    | Trembling voices  | bleed=.9 soak=5 brush=Hair paper=Silk speed=.45 attack=.3 release=.8 string=.2 shade=.75 volume=4.5 grain=0 width=0.75 redip=0.25 | embers | song | Hair voices on silk with a stain close behind them
Name said in sleep       | Trembling voices  | bleed=.8 soak=16 brush=Reed_pen paper=Stone speed=.3 attack=.7 release=3 pressure=.3 shade=.4 volume=6 redip=0.15 tailLean=-20 | recall | duet | Light reed voices on stone that linger as a stain
Singing saw              | Glass rim line    | script=Trembling speed=.55 lean=-400 spread=1 attack=.4 release=1.5 volume=1.5 pressure=.15 shade=.95 string=.3 dryness=0.25 | singer | song | A finger trembling round stone, thin and gliding
Greenhouse choir         | Glass rim line    | script=Trembling speed=.25 spread=16 attack=1 release=4 shade=.9 volume=-1 redip=.4 pressure=.7 tail=0.55 | glasshalo | duet | Fingers trembling round stone rims, slightly apart
Mermaid in the pipes     | Glass rim line    | script=Trembling speed=.4 brush=Hair lean=-300 tailLean=-300 attack=.5 release=2 shade=.5 volume=2.5 dryness=0.1 redip=0.4 | bath | song | A hair drawn trembling round stone, sliding in and out
Theatre of dolls         | Glass rim line    | script=Trembling speed=.8 brush=Reed_pen pressure=.2 attack=.1 release=.6 string=.2 bleed=.2 volume=2.5 width=.3 tail=0 redip=0.4 tailLean=-20 shade=.4 | smaller | reply | Tiny reed voices shaking on stone
Window facing north      | Glass rim line    | script=Trembling speed=.12 brush=Feather attack=1.6 release=5 bleed=.8 soak=10 volume=1 redip=.2 dryness=0.2 | openair | highwash | Feathers going slowly round cold stone | pad
Wordless and near        | Stroked strings   | script=Trembling brush=Finger paper=Silk speed=.35 string=.7 shade=.4 attack=.3 release=.9 volume=6 redip=0.4 tailLean=-30 | oos | song | A finger shaking on a string until it seems to speak
Half-empty rehearsal     | Stroked strings   | script=Trembling paper=Rough speed=.45 string=.8 grain=.5 attack=.12 release=.5 shade=.5 volume=-1 redip=0.15 lean=15 | disc | duet | Strings rubbed with a shaking hand on rough paper | string
Back desk of the violas  | Stroked strings   | script=Trembling paper=Silk speed=.95 attack=.15 release=.8 spread=12 shade=0.25 pressure=.7 volume=5 redip=0.2 lean=40 | backhall | choir | Hair and strings in a fast tremor on silk | string
Hymn through a door      | Trembling voices  | script=Falling_sweep speed=.12 attack=.3 release=2 brush=Finger paper=Rice lean=0 spread=26 shade=.7 redip=.3 grain=0 tailLean=-90 | ahs 1.mix=.45 | choir | Finger voices on rice that start full, sink away and are filled again
Lullaby for a calf       | Hooks on silk     | brush=Finger paper=Silk speed=.5 lean=-100 tailLean=0 attack=.25 release=1.2 shade=.75 volume=3 pressure=.3 spread=18 string=.3 redip=0.3 | gentletrem | song | Finger voices on silk that swell towards their ends
`,
    },
    {
      id: 'sweeps',
      name: 'Feather sweeps',
      category: 'string',
      rows: `
Feather off the roof     | Feather sweeps    | speed=.25 release=1.5 bleed=.3 volume=-4 dryness=.6 string=.5 spread=15 shade=.3 grain=.1 width=0.7 pressure=0.75 | hall | fallarp | Feather strokes on silk that land from above over a string and thin
Gull past the window     | Feather sweeps    | lean=700 speed=.5 attack=.15 release=1 shade=.5 tailLean=-400 volume=6 redip=0.3 pressure=0.35 | farshore 1.level=.8 | reply | Quick feathers that swoop down a fifth and away
Quilt thrown over        | Feather sweeps    | lean=60 tailLean=0 speed=.05 attack=.4 release=5 paper=Rice bleed=.8 soak=10 shade=.4 volume=0 grain=0 pressure=0.35 | soft | suspend | Feathers on rice that take long to thin | pad
Fletcher's bench         | Feather sweeps    | paper=Rough grain=.5 speed=.6 attack=.03 release=.5 string=.5 tail=.4 shade=.4 volume=-6.5 redip=0.4 pressure=0.7 | desk | reply | Feathers flicked across rough paper over a string
Egret on the mud         | Feather sweeps    | paper=Stone spread=30 speed=.2 attack=.1 release=4 shade=.45 pressure=.6 volume=-1.5 grain=.1 dryness=0.6 redip=0.5 string=.6 tailLean=300 | glow | duet | Broad fans of feather on stone over a string, falling into place and lifting off
Last bow of the evening  | Feather sweeps    | brush=Hair lean=40 tailLean=0 speed=.3 attack=.05 release=.8 string=.5 shade=.5 volume=-1 redip=0.25 pressure=0.62 | room | duet | Hair sweeps on silk with the string beneath
Willow stroke            | Feather sweeps    | brush=Hair paper=Rice lean=200 speed=.15 attack=.1 release=2.5 shade=.4 bleed=.7 tailLean=-100 volume=-2 dryness=.1 spread=14 redip=0.15 pressure=0.45 | repeats | duet | Hair sweeps on rice, bending down into the note
Whip of wet hair         | Feather sweeps    | brush=Hair lean=-700 speed=.8 attack=.04 release=.4 ink=1 shade=.7 tailLean=0 tail=.3 volume=-1 redip=0.4 pressure=0.35 | slap | reply | Fast wet hair strokes that snap up a fifth
River seen from above    | Feather sweeps    | brush=Hair paper=Stone lean=0 tailLean=-250 speed=0 attack=.2 release=6 spread=12 shade=.6 volume=-2.5 tail=.95 redip=0.12 pressure=0.45 | openair | suspend | Very slow hair sweeps on stone that sag at the end | pad
Page torn out            | Feather sweeps    | brush=Hair paper=Rough dryness=.9 ink=.3 lean=150 speed=.4 attack=.02 grain=.5 release=.8 volume=-7.5 shade=.25 width=0.6 pressure=0.66 | grit | duet | Hair sweeps on rough paper that run dry as they go
Viola put to bed         | Feather sweeps    | brush=Finger lean=-60 tailLean=-60 speed=.2 attack=.12 string=.6 shade=.35 release=1.2 paper=Silk volume=0 redip=0.2 pressure=0.62 | corner | duet | Finger sweeps on silk over a dark string
Arc of a thrown stone    | Feather sweeps    | brush=Finger lean=-500 tailLean=-1000 speed=.4 attack=.08 release=1.8 tail=1 shade=.6 volume=-1 dryness=0.1 redip=0.15 | deepwater | reply | Finger strokes that rise a fourth and fall much further
Slide of the trombone    | Feather sweeps    | brush=Finger paper=Rough lean=-300 speed=.35 attack=.12 pressure=.9 release=.6 shade=.45 tailLean=0 volume=-5 width=0.3 dryness=0.2 redip=0.12 | valve | song | Finger sweeps on rough paper, smeared up by a third | wind
Breath let out           | Feather sweeps    | brush=Finger paper=Rice lean=0 tailLean=-50 speed=.1 attack=.5 release=3 bleed=.7 shade=.3 spread=16 volume=-1.5 grain=.05 redip=0.5 width=0.7 | longsigh | suspend | Soft finger sweeps on rice, each fading as it goes | pad
Toboggan run             | Feather sweeps    | brush=Finger paper=Stone lean=1000 speed=.3 attack=.3 release=2.5 spread=2 shade=.8 tailLean=0 volume=-0.5 redip=.2 dryness=0.55 width=0.4 | shimtrem | fallarp | Finger sweeps on stone that glide down into the note
Scythe                   | Feather sweeps    | brush=Broad_edge lean=120 tailLean=-120 speed=.55 attack=.02 release=.5 shade=.5 pressure=1 volume=-7 spread=15 grain=.5 string=.5 dryness=0.15 width=0.25 | iron | lowwalk | Hard broad sweeps on silk over a string, full at first and soon thin | bass
Swathe of barley         | Feather sweeps    | brush=Broad_edge paper=Rough lean=0 tailLean=0 speed=.2 attack=.1 release=1.5 spread=20 grain=.5 volume=-6.5 width=.7 dryness=0.15 redip=0.3 | hall | choir | Broad sweeps on rough paper, wide and ragged | pad
Shutter off its hook     | Feather sweeps    | brush=Broad_edge paper=Rough lean=-150 tailLean=200 speed=.15 attack=.25 release=2 bleed=.3 shade=.7 volume=-9 grain=.6 pressure=.9 redip=0.5 | fallecho | duet | Broad sweeps on rough paper that lean up at both ends
Awning wound down        | Feather sweeps    | brush=Broad_edge paper=Stone lean=500 tailLean=-500 speed=.1 attack=.15 release=3 shade=.6 tail=.9 volume=-1 grain=.4 redip=.2 dryness=0.65 pressure=0.8 | fallfifth | fallarp | Broad sweeps on stone that come down a fourth and go on down
Fresh shop sign          | Feather sweeps    | brush=Broad_edge lean=-200 tailLean=-400 speed=.3 attack=.06 ink=1 bleed=.2 release=.6 shade=.4 volume=-3 grain=.1 redip=0.12 width=0.4 | combo | song | Wet broad sweeps on silk that bend up in and drop a third
Reed in the current      | Feather sweeps    | brush=Reed_pen lean=80 tailLean=-80 speed=.25 attack=.1 release=1.5 shade=.35 volume=0.5 dryness=0.5 width=0.6 redip=0.3 | notch | duet | Reed sweeps on silk, hollow and thinning | wind
Scrawl                   | Feather sweeps    | brush=Reed_pen paper=Rough lean=-350 speed=.7 attack=.02 release=.3 grain=.7 shade=.35 tailLean=350 volume=-4.5 dryness=0.65 pressure=0.75 | paperbuzz | ostin | Quick reed scrawls on rough paper that bend up throughout
Evening ferry horn       | Feather sweeps    | brush=Reed_pen paper=Stone lean=-40 tailLean=-300 speed=.08 attack=.3 release=3 ink=1 shade=.3 volume=-0.5 dryness=.1 spread=14 redip=0.5 pressure=0.75 | latearrive | turnto | Reed sweeps on stone, full and then far | wind
Clarinet into a pillow   | Feather sweeps    | brush=Reed_pen paper=Rice lean=-20 tailLean=0 speed=.2 attack=.12 release=.8 shade=.2 bleed=.5 volume=1 redip=0.12 pressure=0.4 | tubevowel | song | Dark reed sweeps on rice | wind
Swifts over the square   | Feather sweeps    | brush=Reed_pen lean=1200 tailLean=1200 speed=.5 attack=.1 release=1.5 pressure=.2 shade=.4 tail=.9 volume=4.5 redip=0.3 | flock | change | Light reed strokes that drop an octave and rise again
Coat held out            | Hooks on silk     | lean=0 tailLean=0 speed=.4 attack=.08 release=.8 string=.3 shade=.5 volume=-2 width=.4 redip=0.2 | booth | duet | Hair strokes on silk that swell to a firm end
Tide mark rising         | Hooks on silk     | speed=.05 attack=.8 bleed=.8 soak=7 paper=Rice shade=.65 release=3 volume=-6 redip=0.25 width=0.8 string=.45 pressure=1 | darkhall | suspend | Slow hair strokes on rice that swell into their stain | pad
Suspension bridge        | Hooks on silk     | string=.75 paper=Stone speed=.45 attack=.2 lean=-30 release=1.2 shade=.7 volume=-6 dryness=0.25 redip=0.15 | sympath | duet | Hair strokes that swell along strings over stone
Question, then another   | Hooks on silk     | speed=.6 lean=-150 tailLean=700 tail=.9 release=1.4 attack=.06 shade=.7 volume=0.5 redip=0.5 width=0.3 | cleanecho | reply | Short hair hooks that end by turning up a fifth
Thistle by the road      | Hooks on silk     | paper=Rough ink=.2 dryness=.9 speed=.3 grain=.4 attack=.1 lean=0 release=.8 volume=5 width=.5 shade=.35 | across | duet | Hair strokes on rough paper, dry until the last of them
Thermal over the hill    | Hooks on silk     | brush=Feather speed=.12 attack=.6 lean=-100 release=2.5 grain=.1 volume=-3 spread=20 shade=.45 redip=0.2 | quickswell | suspend | Feathers on silk that come up out of breath | pad
Kite in a lull           | Hooks on silk     | brush=Feather paper=Rough speed=.4 lean=-600 tailLean=400 attack=.2 release=1.5 shade=.7 volume=-9.5 redip=0.12 | barber | reply | Feather strokes on rough paper that bend up in and up again out
Trumpet of grass         | Hooks on silk     | brush=Reed_pen paper=Silk speed=.35 lean=-80 attack=.06 release=.5 shade=.35 pressure=.8 tailLean=0 volume=0 grain=.05 redip=0.4 | cathedral | song | Reed strokes on silk that push to a firm end | wind
Ram's horn               | Hooks on silk     | brush=Reed_pen paper=Stone speed=.18 lean=-500 attack=.2 release=2 shade=.4 tailLean=-100 volume=-1 dryness=0.05 redip=0.2 | valley | turnto | Reed strokes on stone that bend up a fourth and swell | wind
Thumb along the gut      | Hooks on silk     | brush=Finger speed=.6 string=.8 paper=Silk lean=-20 tailLean=0 attack=.2 release=1 shade=.45 volume=5.5 dryness=0.05 redip=0.3 | slowbow | song | Finger strokes that swell along a rubbed string
Red lacquer door         | Hooks on silk     | brush=Broad_edge speed=.3 shade=.7 pressure=.9 attack=.1 lean=-25 tailLean=0 release=.8 volume=-2 dryness=0.25 redip=0.12 | folded | choir | Broad strokes on silk that open to a wide end
Root pulled slowly       | Hooks on silk     | brush=Broad_edge paper=Rough speed=.1 attack=.3 lean=-300 release=1.5 grain=.6 dryness=.6 tailLean=0 volume=6 pressure=.9 redip=0.12 width=0 | grazed | lowwalk | Low broad strokes on rough paper, dragged up a third | bass
Bubble leaving the bed   | Hooks on silk     | brush=Finger paper=Stone speed=.5 lean=-900 tailLean=900 attack=.1 release=1.2 shade=.6 tail=.9 volume=-3.5 redip=0.25 | under | reply | Finger strokes on stone that rise in and rise away
Handkerchief             | Hooks on silk     | brush=Finger paper=Rice speed=.2 spread=46 attack=.4 lean=0 tailLean=-500 release=2 shade=.85 volume=-3.5 pressure=.2 redip=.4 grain=.05 dryness=0.15 | faintwarm | suspend | Light pale finger strokes on rice that swell wide of the note and sink at the end | pad
Crane over stubble       | Hooks on silk     | brush=Hair paper=Rough speed=.5 lean=-200 tailLean=-400 attack=.3 release=2.5 spread=14 tail=.8 volume=-3.5 redip=0.25 | farrotor | song | Hair strokes on rough paper that rise, swell and fall off
Rope skipped in a yard   | Feather sweeps    | lean=-500 speed=.6 attack=.05 release=1 shade=.6 tailLean=0 volume=-8 spread=18 paper=Rough grain=.4 tail=.15 redip=0.4 pressure=0.7 | backwards | reply | Quick feathers on rough paper that leap up a fourth
Round of brooms          | Feather sweeps    | brush=Hair paper=Rough lean=0 tailLean=0 speed=.45 attack=.02 release=.5 grain=.6 string=.4 volume=-4 spread=7 pressure=0.66 redip=0.3 | answer | ostin | Hair sweeps on rough paper, short and rustling | texture
Three tall windows       | Feather sweeps    | brush=Broad_edge paper=Silk lean=-80 tailLean=80 speed=.4 attack=.05 release=.9 shade=.6 bleed=.2 volume=-2 dryness=.1 grain=0.34 pressure=0.7 | slowpan | reply | Broad sweeps on silk that fade quickly
Leaves let go            | Feather sweeps    | paper=Rice lean=150 tailLean=-600 speed=.2 release=3 tail=1 shade=.65 spread=10 volume=-2 dryness=0.7 redip=0.4 pressure=0.25 | sighs | fallarp | Feathers on rice whose ends keep sinking
Dust falling in a beam   | Feather sweeps    | paper=Silk ink=.1 dryness=.8 grain=.1 lean=100 speed=.15 release=3 shade=.1 tailLean=0 volume=6 spread=34 string=.5 bleed=.8 width=0.7 pressure=0.8 | firstlight | highwash | Nearly dry feathers on silk over a string, thinning at once | texture
Sluice in spring         | Feather sweeps    | redip=.6 brush=Hair ink=.4 lean=0 tailLean=0 speed=.5 attack=.04 release=1 shade=.6 volume=-2.5 dryness=0.5 pressure=0.4 | cassette | duet | Hair sweeps that are dipped as soon as they thin
Waves on shingle         | Feather sweeps    | redip=.3 brush=Feather paper=Rough ink=.4 speed=.3 attack=.5 release=3 grain=.5 lean=0 volume=-3.5 shade=.25 dryness=0.6 width=0.75 | slowtide | suspend | Feather sweeps on rough paper, filled and spent | texture
Rowers, long stroke      | Feather sweeps    | redip=.8 brush=Broad_edge paper=Rice ink=.5 speed=.6 attack=.1 release=1 shade=.4 lean=-50 volume=-3 spread=20 pressure=0.66 | throb | choir | Broad sweeps on rice, dipped again like oars
Line of reeds, dipped    | Feather sweeps    | redip=.45 brush=Reed_pen paper=Silk ink=.4 speed=.35 attack=.1 release=1.2 shade=.4 spread=10 lean=0 volume=3.5 grain=.4 width=0.75 pressure=0.3 | leftright | duet | Reed sweeps on silk that thin and are filled | wind
Mother of pearl          | Feather sweeps    | redip=.5 brush=Finger paper=Stone ink=.6 speed=.2 attack=.3 release=4 spread=18 shade=.85 lean=0 volume=3.5 grain=0.12 pressure=0.25 | topad | highwash | Finger sweeps on stone, renewed and shining | pad
`,
    },
    {
      id: 'stone',
      name: 'Stone marks',
      category: 'plucked',
      rows: `
Carver's first mark      | Stone marks       | pressure=.6 release=2 tailLean=0 lean=0 shade=.45 volume=1 dryness=.1 grain=.4 spread=11 | bare | dabs | Broad dots on stone that ring and fade
Doorstep in the sun      | Stone marks       | speed=.1 ink=1 release=3 string=.6 shade=.25 bleed=.5 soak=3 lean=0 volume=-3.5 redip=.5 spread=14 | sun | dabs | Slow wet dots of a broad edge on stone, struck again if held
Masons' lunch            | Stone marks       | speed=.6 string=.8 release=.6 tail=.3 shade=.6 grain=.7 lean=-20 volume=3.5 spread=11 | desk | ostin | Short broad dots on stone, the string well forward
Cliff answering          | Stone marks       | pressure=.9 release=4 shade=.7 lean=0 tailLean=-90 string=.4 volume=-3.5 dryness=0.7 | darktrail | reply | Hard broad dots on stone, bright and long
Threshold worn down      | Stone marks       | ink=.15 dryness=.7 release=1.5 shade=.4 string=.3 lean=0 spread=10 volume=3.5 | dplate | dabs | Dry broad dots on stone, dull at the edges
Cobbler's small hammer   | Stone marks       | brush=Reed_pen pressure=.3 release=1 shade=.4 string=.8 lean=100 tailLean=0 volume=0 dryness=0.25 spread=20 | booth | ostin | Light reed dots on stone over a string, each entering sharp
Flint under a heel       | Stone marks       | brush=Reed_pen pressure=.9 speed=.8 release=.3 tail=.1 string=.5 shade=.3 lean=0 volume=-4 grain=.8 dryness=0.65 | grit | ostin | Short hard reed dots on stone
Hollow step              | Stone marks       | brush=Reed_pen speed=.15 release=2.5 shade=.2 string=.1 bleed=.7 lean=-40 tailLean=0 volume=-3 spread=14 pressure=.9 | mine | dabs | Dark slow reed dots on stone
Rails in the sun         | Stone marks       | brush=Reed_pen string=.9 release=3 shade=.75 spread=16 lean=0 tailLean=100 volume=-0.5 grain=.1 | longspring | fallarp | Reed dots on stone with a bright wide string
Latch in the rain        | Stone marks       | brush=Reed_pen redip=.6 release=1.4 speed=.5 shade=.4 lean=200 tailLean=-200 volume=-1.5 spread=9 | bath | reply | Reed dots on stone that bend in and out
Knuckle on wet glass     | Stone marks       | brush=Finger speed=.4 release=1.5 string=0 shade=.6 ink=1 lean=0 tailLean=0 volume=-3 dryness=0.1 | tube | change | Wet finger dots on stone with no string in them | bell
Skimmed over the pond    | Stone marks       | brush=Finger speed=.6 release=.6 string=.2 shade=.5 lean=100 tailLean=0 bleed=.3 volume=-2.5 | skips | reply | Small finger dots on stone
Water clock              | Stone marks       | brush=Finger redip=.8 speed=.3 release=1 string=.1 shade=.75 width=1 lean=-60 volume=-1.5 spread=9 | tiles | rain | Wet finger dots on stone that renew each other
Bowl of river stones     | Stone marks       | brush=Finger pressure=.8 spread=22 release=3 string=.1 shade=.5 bleed=.5 soak=6 lean=0 volume=-3 | bowlhalo | change | Finger dots on stone, beating slowly | bell
Thumb on cold iron       | Stone marks       | brush=Finger string=.7 shade=.3 release=.7 tail=.4 speed=.2 lean=-30 volume=0 | iron | lowwalk | Low finger dots on stone, dark with string | bass
Eyelash on a mirror      | Stone marks       | brush=Hair pressure=0 release=2.5 shade=.6 string=.1 lean=0 tailLean=0 volume=-1.5 | hightrails | rain | Single hairs touched to stone
Dulcimer left in snow    | Stone marks       | brush=Hair string=.9 release=2 shade=.6 speed=.2 lean=0 tailLean=0 bleed=.3 volume=2 spread=11 | valley | fallarp | Hair dots on stone over plucked strings
Church mouse             | Stone marks       | brush=Hair speed=.9 release=.4 tail=.1 shade=.5 string=.2 lean=0 width=.3 volume=0.5 | cathedral | ostin | Very short hair dots on stone
Steps in steady rain     | Stone marks       | brush=Hair redip=.5 spread=14 release=1.2 speed=.5 shade=.4 string=.2 lean=0 volume=-0.5 grain=.2 | lightrain | rain | Hair dots on stone, each wetting the rest
Marbles on parquet       | Stone marks       | brush=Hair lean=-700 tailLean=0 attack=.015 release=.8 speed=.4 shade=.6 volume=4.5 spread=11 | slowskips | dabs | Hair dots on stone that leap up a fifth
Moss on the sundial      | Stone marks       | brush=Feather speed=.2 release=2 shade=.3 grain=.05 lean=0 tailLean=0 bleed=.6 volume=3.5 spread=12 dryness=0.1 | haze | dabs | Soft feather dots on stone
Snow off a statue        | Stone marks       | brush=Feather pressure=.2 release=5 tail=1 shade=.6 string=.15 tailLean=-500 volume=0 script=Falling_sweep speed=.4 spread=18 grain=.1 | softsag | fallarp | Light feather sweeps on stone whose ends sink a fourth
Dove on the parapet      | Stone marks       | brush=Feather attack=.04 speed=.1 release=1 lean=-500 shade=.7 string=.05 bleed=.3 volume=1.5 pressure=.9 spread=20 | oos | reply | Feather dots on stone that coo up a fourth into the note
Web strung with quartz   | Stone marks       | brush=Feather string=.8 spread=28 release=3 shade=.35 lean=0 tailLean=0 volume=6 dryness=0.5 | glassrain | rain | Feather dots and wide-set strings on stone
Quill on gravestone      | Stone marks       | brush=Feather ink=.1 dryness=.9 grain=.6 release=.8 string=.5 shade=.35 lean=0 volume=2 spread=7 | heldstrings | reply | Dry feather dots on stone, plucking as they land
Last glass on the table  | Glass rim line    | attack=.25 release=1.2 spread=0 speed=.6 shade=.5 volume=0 width=.2 tail=.1 grain=0 dryness=0.25 | bare | song | A finger drawn quickly round stone, plain and steady | wind
Storm in a goblet        | Glass rim line    | speed=1 pressure=.8 grain=.35 attack=.5 release=2 shade=.6 volume=-10.5 redip=.7 spread=24 lean=300 tail=0.55 | nave | suspend | A finger pressed hard and fast round stone, entering from a third above | pad
Six glasses              | Glass rim line    | spread=34 attack=1 release=3 shade=.9 width=1 bleed=.7 soak=8 volume=-4.5 redip=.5 speed=.2 pressure=.2 tail=0.65 | chamber | highwash | Light wet fingers round stone rims, slow and apart | pad
Down the old well        | Glass rim line    | shade=.15 attack=.9 release=3 speed=.5 pressure=1 bleed=.6 volume=-4 lean=-300 redip=.4 tail=0.85 | lowdome | turnto | A finger pressed round stone in dark ink, leaning up into the note | pad
Ring of light            | Glass rim line    | script=Rising_hook speed=.45 lean=-60 attack=.3 release=2 shade=.95 volume=1 pressure=.2 spread=14 dryness=0 redip=0.4 | choirup | duet | Pale finger strokes on stone that swell as they go round | pad
Edge of the basin        | Glass rim line    | brush=Hair speed=.5 pressure=.25 attack=.5 release=1.5 shade=.8 string=.85 volume=-2.5 spread=17 grain=.4 redip=.5 | latearrive | duet | A hair brush drawn lightly round stone over a bright string | string
Bone flute               | Glass rim line    | brush=Reed_pen attack=.08 release=.5 shade=.35 speed=.3 bleed=.2 pressure=.5 volume=0 redip=0.4 tailLean=-30 | corner | song | A reed pen held on stone, hollow and cool | wind
Panpipe of basalt        | Glass rim line    | brush=Reed_pen script=Falling_sweep attack=.02 release=.7 speed=.4 shade=.5 bleed=.15 volume=-1 tail=0.85 | inkpot | reply | Reed strokes on stone that start full and thin | wind
Wind over the quarry     | Glass rim line    | brush=Feather attack=1.2 release=4 grain=.6 speed=.9 shade=.5 pressure=.8 volume=6 dryness=0.2 redip=0.2 | farshore | suspend | A feather drawn fast over stone | wind
Slab pushed aside        | Glass rim line    | brush=Broad_edge attack=.6 release=2 grain=.6 speed=.4 shade=.4 spread=16 ink=.6 volume=1.5 redip=.3 dryness=0 tailLean=-40 | cave | lowlong | A broad edge dragged low over stone | bass
Half an inscription      | Seals on stone    | brush=Reed_pen ink=.15 dryness=.8 release=1.5 string=.4 shade=.5 bleed=.2 volume=0.5 spread=14 tailLean=-30 | oxide | change | Dry reed stamps on stone, breaking up as they ring | bell
Keystone set             | Seals on stone    | brush=Broad_edge string=.5 release=1 shade=.4 pressure=.9 bleed=.1 width=.4 volume=-1 tail=0 grain=.1 spread=15 tailLean=-50 | console | lowwalk | Heavy broad stamps on stone, low and short | bass
Runes under lichen       | Seals on stone    | brush=Feather ink=.9 release=2.5 bleed=.9 soak=12 shade=.4 string=.3 volume=0.5 spread=12 tailLean=-20 | darkwater | change | Feather stamps on stone that go over into stain | bell
Pestle in the mortar     | Seals on stone    | brush=Finger attack=.06 speed=.75 release=.5 string=.3 shade=.35 grain=1 tail=.1 width=.3 volume=-2 script=Trembling pressure=.9 paper=Stone redip=0.2 | waterpot | reply | A finger ground round and round on stone, rough and blunt | texture
Prism on a windowsill    | Seals on stone    | brush=Hair spread=10 release=4 shade=1 string=.1 pressure=.5 redip=.3 volume=-1 dryness=0.65 tailLean=-20 | prism | change | Pale hair stamps on stone, long and wide | bell
Nave with no chairs      | Feather sweeps    | paper=Stone brush=Broad_edge lean=0 tailLean=0 speed=.1 attack=.04 release=3 shade=.2 pressure=1 volume=-1.5 string=.6 dryness=0.2 | nave | turnto | Dark broad sweeps on stone over a string that land full and thin slowly | keys
Piano carved of slate    | Feather sweeps    | paper=Stone brush=Finger lean=0 tailLean=0 speed=.25 attack=.004 release=.5 string=.55 shade=.5 bleed=.2 volume=0.5 grain=0.38 pressure=0.45 | splate | letters | Finger keys on stone that fall away evenly | keys
Harpsichord of ice       | Feather sweeps    | paper=Stone brush=Reed_pen lean=0 tailLean=0 speed=.4 attack=.004 release=.25 string=.75 shade=.55 bleed=.1 volume=0.5 grain=0 tail=0 spread=17 pressure=0.7 | plate | ostin | Bright reed keys on stone with a plucked edge | keys
Very small waterfall     | Feather sweeps    | paper=Stone brush=Hair lean=1200 tailLean=-400 speed=.35 attack=.1 release=2 shade=.7 spread=10 volume=-1.5 redip=0.12 width=0.8 pressure=0.3 | endlessfall | fallarp | Hair sweeps on stone that fall an octave into the note | string
Bar after the rush       | Feather sweeps    | paper=Stone brush=Finger lean=0 tailLean=0 speed=.15 attack=.006 release=.9 shade=.3 string=.15 pressure=.8 volume=-2 dryness=0.2 width=0.6 | amptrem | turnto | Round finger keys on stone, dark and slowly thinning | keys
Geology                  | Ink soaking in    | paper=Stone script=Level brush=Broad_edge attack=2 soak=20 shade=.3 release=4 ink=.8 volume=1 spread=15 redip=.15 dryness=0 tailLean=-50 | halfspeed | openfifth | A broad edge held on stone under a vast slow stain | drone
White salt pan           | Ink soaking in    | paper=Stone script=Level brush=Hair attack=.9 soak=12 shade=.95 release=5 pressure=.1 spread=44 volume=-0.5 speed=.1 string=0 redip=0.15 width=0.5 | shadow | highwash | Pale hairs on stone above their own stain | pad
Veins in the marble      | Ink soaking in    | paper=Stone script=Dot brush=Reed_pen attack=.01 soak=8 shade=.5 release=1 speed=.3 ink=.9 volume=3 dryness=0.05 width=0.7 | thinhalo | dabs | Reed dots on stone that leave thin lines of stain | plucked
Breathing cliff          | Ink soaking in    | paper=Stone script=Trembling brush=Feather speed=.12 attack=1 soak=10 shade=.5 release=3 redip=.3 volume=2 spread=8 tailLean=-40 | breathverb | suspend | A trembling feather on stone, refilled and blurred | texture
Cave painting            | Ink soaking in    | paper=Stone script=Rising_hook brush=Finger speed=.55 attack=.15 soak=9 shade=.6 release=2 lean=-200 volume=-0.5 redip=0.15 tailLean=-70 bleed=.9 ink=1 pressure=.9 | cavern | song | Finger strokes on stone that swell and leave their stain | voice
`,
    },
  ],
}
