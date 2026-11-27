import { type InstrumentSet } from './set'

// The set of Spun Wire. A direction is one thing a wheel of wires does: sing,
// run down, climb its overtones, slap, hold a floor, chime, breathe, count in
// gears, weave or simply pluck. In each are ten families of five: a family is
// one corner of the wheel, and its five differ in how it turns, in what it is
// made of and in what the chain is for.

export const SET: InstrumentSet = {
  device: 'spun-wire',
  names: {
    tuning: ['Unison', 'Octaves', 'Overtones', 'Fan'],
    gesture: ['Driven', 'Thrown', 'One turn', 'Rocked'],
    plucker: ['Feather', 'Card', 'Nail', 'Air'],
    hub: ['Steel', 'Wood', 'Skin'],
  },
  chains: {
    // Near and dry.
    bare: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Open' }],
      words: ', with nothing round it',
    },
    warm: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Warm', params: { low: 2.5 } }],
      words: ', close and warm',
    },
    shaded: { effects: [{ deviceId: 'ambient-eq', preset: 'Shaded' }], words: ', dry and shaded' },
    thin: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Thin' },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: ', thin and dry',
    },
    floor: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Deep', params: { low: 6 } }],
      words: ', with its floor lifted',
    },
    cloth: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Muffled' }],
      words: ', as if under a cloth',
    },
    scooped: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Hollow' },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: ', dry and scooped in the middle',
    },
    forward: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Forward' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', dry and forward',
    },
    wide: {
      effects: [
        { deviceId: 'spread', preset: 'Wide but safe' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', dry and wide',
    },
    airy: {
      effects: [
        { deviceId: 'spread', preset: 'Firm and airy' },
        { deviceId: 'ambient-eq', preset: 'Keys' },
      ],
      words: ', firm below and open above',
    },
    centre: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Narrow' },
        { deviceId: 'ambient-comp', preset: 'Glue' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', dry and down the middle',
    },
    mike: {
      effects: [{ deviceId: 'distance', preset: 'Close mic' }],
      words: ', right at the microphone',
    },
    booth: {
      effects: [
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.22 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', in a small booth',
    },
    room: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } }],
      words: ', in a plain room',
    },
    slaproom: {
      effects: [
        { deviceId: 'ether-reverb', preset: 'Slap room', params: { mix: 0.2 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', with one slap off a wall',
    },
    walls: {
      effects: [
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.24 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', between near walls',
    },
    plank: {
      effects: [
        { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.45 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', on a wooden board',
    },
    hint: {
      effects: [
        { deviceId: 'analog-drive', preset: 'First hint' },
        { deviceId: 'ambient-comp', preset: 'Keys' },
      ],
      words: ', dry with a hint of drive',
    },
    iron: {
      effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }],
      words: ', pushed through iron',
    },
    triode: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Triode glow' },
        { deviceId: 'ether-reverb', preset: 'Faint air', params: { mix: 0.1 } },
      ],
      words: ', glowing a little, nearly dry',
    },
    deck: {
      effects: [
        { deviceId: 'tape', preset: 'Mastering deck' },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', on clean tape',
    },
    valve: {
      effects: [{ deviceId: 'patina', preset: 'Hot valve', params: { noise: 0.05, wobble: 0.15 } }],
      words: ', through a warm valve',
    },
    double: {
      effects: [{ deviceId: 'stereo-detune', preset: 'Doubled' }],
      words: ', doubled and dry',
    },
    halo: {
      effects: [
        { deviceId: 'stereo-detune', preset: 'Soft halo' },
        { deviceId: 'tamer', preset: 'Gentle' },
      ],
      words: ', dry with a soft double',
    },
    held: {
      effects: [
        { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 8 } },
      ],
      words: ', held even and dry',
    },
    wall: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 6 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: ', up close in a little room',
    },
    tin: {
      effects: [
        { deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.4 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', in a small tin',
    },
    pot: {
      effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.45 } }],
      words: ', in a clay pot',
    },
    // Rooms and halls.
    chamber: {
      effects: [
        { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.26 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', in a tight chamber',
    },
    hall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
      words: ', in a hall',
    },
    darkhall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.32 } }],
      words: ', in a dark hall',
    },
    brighthall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.26 } }],
      words: ', in a bright hall',
    },
    cathedral: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.32 } }],
      words: ', high in a cathedral',
    },
    plate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.26 } }],
      words: ', with a plate ringing behind',
    },
    longplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.32 } }],
      words: ', with a long plate behind',
    },
    spring: {
      effects: [
        { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.26 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', in a spring tank',
    },
    slack: {
      effects: [
        { deviceId: 'spring-reverb', preset: 'Slack and strange', params: { mix: 0.3 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', in a slack old spring',
    },
    cave: {
      effects: [
        { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.32 } },
        { deviceId: 'ambient-eq', preset: 'Layer' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', in a dark cave',
    },
    valley: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
      words: ', across an open valley',
    },
    breathing: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.35 } }],
      words: ', in a hall that breathes',
    },
    expanse: {
      effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.34 } }],
      words: ', in a wide open space',
    },
    lowvault: {
      effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.3 } }],
      words: ', in a low vault',
    },
    tunnel: {
      effects: [{ deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.3 } }],
      words: ', down a narrow tunnel',
    },
    swarm: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.3 } }],
      words: ', among pattering echoes',
    },
    choir: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.36 } }],
      words: ', with a hall that sings ah',
    },
    monks: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.36 } }],
      words: ', with a low sung tail',
    },
    rise: {
      effects: [{ deviceId: 'spiral', preset: 'Slow ascent', params: { mix: 0.3 } }],
      words: ', under a slowly climbing tail',
    },
    backwards: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.35 } }],
      words: ', with tails that run backwards',
    },
    gated: {
      effects: [
        { deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.35 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', in a hall cut short',
    },
    farshore: {
      effects: [
        { deviceId: 'distance', preset: 'Far shore' },
        { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.2 } },
      ],
      words: ', on a far shore',
    },
    steps: {
      effects: [
        { deviceId: 'distance', preset: 'A few steps back' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.15 } },
      ],
      words: ', a few steps back',
    },
    nextdoor: {
      effects: [{ deviceId: 'distance', preset: 'Next door' }],
      words: ', heard from next door',
    },
    // Tape and other media.
    reel: {
      effects: [
        { deviceId: 'tape', preset: 'Quarter inch' },
        { deviceId: 'hall-reverb', preset: 'Faint halo', params: { mix: 0.15 } },
      ],
      words: ', on a quarter inch reel',
    },
    worn: {
      effects: [
        { deviceId: 'tape', preset: 'Worn thin', params: { hiss: 0.3 } },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.2 } },
      ],
      words: ', on tape worn thin',
    },
    cassette: {
      effects: [
        { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.25 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', on a worn cassette',
    },
    drift: {
      effects: [
        { deviceId: 'tape', preset: 'Drifting chorus' },
        { deviceId: 'plate-reverb', preset: 'Faint sheen' },
      ],
      words: ', on drifting tape',
    },
    record: {
      effects: [
        { deviceId: 'vinyl', preset: 'Dust and scratches', params: { crackle: 0.25 } },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.15 } },
      ],
      words: ', off a dusty record',
    },
    sampler: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Glaze' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', glazed by an early sampler',
    },
    wireless: {
      effects: [{ deviceId: 'radio', preset: 'Kitchen radio', params: { static: 0.1 } }],
      words: ', from a kitchen wireless',
    },
    bedside: {
      effects: [{ deviceId: 're-amp', preset: 'Bedside radio' }],
      words: ', from a bedside speaker',
    },
    combo: {
      effects: [{ deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.35 } }],
      words: ', from an amplifier in a room',
    },
    // Echoes.
    slap: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Slapback' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', with one quick slap',
    },
    dark: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.28 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', with dark echoes',
    },
    hop: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Fifth hop', params: { mix: 0.26 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', with echoes that hop to the fifth',
    },
    tape3: {
      effects: [{ deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } }],
      words: ', with three tape heads behind',
    },
    dotted: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.28 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', with dotted tape echoes',
    },
    clean: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Clean and steady', params: { mix: 0.28 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', with clean steady echoes',
    },
    stars: {
      effects: [
        { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.34 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', with seven scattered echoes',
    },
    stone: {
      effects: [
        { deviceId: 'skipping-stone', preset: 'Skipping stone', params: { mix: 0.34 } },
        { deviceId: 'plate-reverb', preset: 'Faint sheen' },
      ],
      words: ', with echoes like a skipped stone',
    },
    prism: {
      effects: [{ deviceId: 'prism', preset: 'Low to high', params: { mix: 0.34 } }],
      words: ', its low end echoed first',
    },
    canon: {
      effects: [
        { deviceId: 'canon', preset: 'Faint answer', params: { mix: 0.32 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', answered by itself',
    },
    reverse: {
      effects: [
        { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { mix: 0.34 } },
        { deviceId: 'plate-reverb', preset: 'Faint sheen' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', with backward echoes',
    },
    memory: {
      effects: [
        { deviceId: 'echo-memory', preset: 'Recalling', params: { mix: 0.36 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', with half-remembered moments drifting back',
    },
    loops: {
      effects: [
        { deviceId: 'orbits', preset: 'Slow phasing', params: { mix: 0.32 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', in loops that slip apart',
    },
    tapeloop: {
      effects: [
        { deviceId: 'tape-loop', preset: 'One second round', params: { mix: 0.4 } },
        { deviceId: 'tape', preset: 'Clean transfer' },
      ],
      words: ', round a short loop of tape',
    },
    graindelay: {
      effects: [
        { deviceId: 'grain-delay', preset: 'Crystals', params: { mix: 0.24 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', with crystals echoing an octave up',
    },
    // Movement.
    lowpass: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', under a slow low-pass',
    },
    touch: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Touch wah', params: { mix: 0.7 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', with a filter that opens to the touch',
    },
    phaser: {
      effects: [
        { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', through a slow swirl',
    },
    flanger: {
      effects: [
        { deviceId: 'flanger', preset: 'Slow sweep', params: { mix: 0.4 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', under a slow jet sweep',
    },
    chorus: {
      effects: [
        { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.45 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', in a lush ensemble',
    },
    currents: {
      effects: [
        { deviceId: 'currents', preset: 'Slow water' },
        { deviceId: 'hall-reverb', preset: 'Faint halo', params: { mix: 0.2 } },
      ],
      words: ', its bands drifting like water',
    },
    glimmer: {
      effects: [
        { deviceId: 'glimmer', preset: 'Light on water' },
        { deviceId: 'plate-reverb', preset: 'Faint sheen' },
      ],
      words: ', with light moving over it',
    },
    tremolo: {
      effects: [
        { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.45 } },
        { deviceId: 'spring-reverb', preset: 'Hint of spring' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', with a soft amp tremolo',
    },
    shiver: {
      effects: [
        { deviceId: 'tremolo', preset: 'Harmonic shimmer' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', with a harmonic shiver',
    },
    rotary: {
      effects: [
        { deviceId: 'rotary', preset: 'Chorale' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', through a slow rotary horn',
    },
    around: {
      effects: [
        { deviceId: 'around', preset: 'Slow circle' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', circling the head',
    },
    breath: {
      effects: [
        { deviceId: 'breath', preset: 'Calm breath', params: { depth: 0.55 } },
        { deviceId: 'plate-reverb', preset: 'Faint sheen' },
      ],
      words: ', opened and closed by slow breath',
    },
    pulses: {
      effects: [
        { deviceId: 'pulses', preset: 'Slow drift' },
        { deviceId: 'hall-reverb', preset: 'Faint halo', params: { mix: 0.2 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', through two drifting gates',
    },
    flock: {
      effects: [
        { deviceId: 'murmuration', preset: 'Evening flock', params: { mix: 0.45 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', as a flock overhead',
    },
    vibrato: {
      effects: [
        { deviceId: 'late-vibrato', preset: 'Singer' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
      ],
      words: ', swaying once it is held',
    },
    // Drive.
    haze: {
      effects: [
        { deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.3 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: ', in a warm haze',
    },
    glow: {
      effects: [{ deviceId: 'haze', preset: 'Octave glow', params: { mix: 0.3 } }],
      words: ', with a glowing wall behind',
    },
    howl: {
      effects: [
        { deviceId: 'howl', preset: 'Faint sustain' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', fed back a little',
    },
    bridge: {
      effects: [
        { deviceId: 'buzzing-bridge', preset: 'Harp on a bridge' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', over a buzzing bridge',
    },
    fuzz: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { mix: 0.6 } },
        { deviceId: 'spring-reverb', preset: 'Hint of spring' },
      ],
      words: ', through dark fuzz',
    },
    fold: {
      effects: [
        { deviceId: 'saturator', preset: 'Folded glass', params: { mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', folded over on itself',
    },
    // Grain and spectrum.
    cloud: {
      effects: [
        { deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.45 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', in a soft cloud of grains',
    },
    blur: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.5 } }],
      words: ', in a hanging mist',
    },
    fog: {
      effects: [
        { deviceId: 'fog', preset: 'Soft cloud', params: { mix: 0.8 } },
        { deviceId: 'plate-reverb', preset: 'Faint sheen' },
      ],
      words: ', blurred into soft fog',
    },
    cascade: {
      effects: [
        { deviceId: 'cascade', preset: 'Glass rain', params: { mix: 0.32 } },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', with a rain of small repeats',
    },
    glints: {
      effects: [
        { deviceId: 'glints', preset: 'Slow stars' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
      ],
      words: ', with slow sparks above',
    },
    falling: {
      effects: [
        { deviceId: 'falling', preset: 'Falling leaves', params: { mix: 0.36 } },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', with falling leaves of it',
    },
    stretch: {
      effects: [
        { deviceId: 'stretch', preset: 'Half time haze' },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', trailing a half-time haze',
    },
    sines: {
      effects: [
        { deviceId: 'sine-shadow', preset: 'Sine shadow', params: { mix: 0.4 } },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', with a shadow of pure tones',
    },
    sift: {
      effects: [
        { deviceId: 'sift', preset: 'Soft hammers' },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', its attacks softened',
    },
    bowed: {
      effects: [
        { deviceId: 'swell', preset: 'Bowed', params: { attack: 300 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
      ],
      words: ', each note faded in',
    },
    // Pitch.
    shimmer: {
      effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.28 } }],
      words: ', under a rising shimmer',
    },
    fifths: {
      effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { mix: 0.26 } }],
      words: ', with fifths climbing behind',
    },
    bloom: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Faint glow' }],
      words: ', with a faint blooming tail',
    },
    suboct: {
      effects: [
        { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.5 } },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', with an octave under it',
    },
    twelve: {
      effects: [
        { deviceId: 'octaves', preset: 'Twelve string', params: { up1: 0.4 } },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', doubled an octave up',
    },
    pipes: {
      effects: [
        { deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.45 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', with flute pipes behind',
    },
    warp: {
      effects: [
        { deviceId: 'warp', preset: 'Soft chime' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
      ],
      words: ', its overtones bent',
    },
    melt: {
      effects: [
        { deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.4 } },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', with tails that sag',
    },
    halftime: {
      effects: [
        { deviceId: 'half-speed', preset: 'Under the mix' },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', over its own half speed',
    },
    // Held and frozen.
    sustain: {
      effects: [
        { deviceId: 'sustainer', preset: 'Slow strings', params: { mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', above a slow held bed',
    },
    bed: {
      effects: [
        { deviceId: 'micro-looper', preset: 'Soft bed', params: { mix: 0.35 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', over a soft loop of itself',
    },
    strings: {
      effects: [
        { deviceId: 'pad-follower', preset: 'Slow swell', params: { mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', with strings swelling behind',
    },
    // Resonance and weather.
    sympathy: {
      effects: [
        { deviceId: 'sympathetic', preset: 'Open triad', params: { mix: 0.36 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', with open strings ringing along',
    },
    bowls: {
      effects: [
        { deviceId: 'bowls', preset: 'Faint halo', params: { mix: 0.32 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', with bowls answering',
    },
    keysunder: {
      effects: [{ deviceId: 'silent-keys', preset: 'Minor seven held', params: { mix: 0.4 } }],
      words: ', over a chord held in silence',
    },
    generations: {
      effects: [{ deviceId: 'generations', preset: 'Faint afterimage', params: { mix: 0.3 } }],
      words: ', fading through a room',
    },
    vowel: {
      effects: [
        { deviceId: 'imprint', preset: 'Open vowel' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', shaped to an open vowel',
    },
    overtone: {
      effects: [
        { deviceId: 'overtone-singer', preset: 'Overtone melody', params: { root: 0, mix: 0.6 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', with overtones picked out in turn',
    },
    rain: {
      effects: [
        { deviceId: 'weather', preset: 'Light rain', params: { voice: 0.3 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 5 } },
      ],
      words: ', in light rain',
    },
    water: {
      effects: [
        { deviceId: 'underwater', preset: 'Just under', params: { bubbles: 0.1 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.15 } },
      ],
      words: ', just under water',
    },
    hiss: {
      effects: [
        { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -50 } },
        { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', over a floor of tape hiss',
    },
    season: {
      effects: [{ deviceId: 'seasons', preset: 'High summer', params: { mix: 0.7 } }],
      words: ', warm as a long summer',
    },
    hollowpipe: {
      effects: [
        { deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.45 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', in a stone cistern',
    },
    shell: {
      effects: [
        { deviceId: 'vessel', preset: 'Shell to the ear', params: { mix: 0.4 } },
        { deviceId: 'plate-reverb', preset: 'Faint sheen' },
      ],
      words: ', heard in a shell',
    },
  },
  phrases: {
    veil: {
      notes: [
        { atSec: 0, durSec: 5.6, note: 45, gain: 0.84 },
        { atSec: 0.2, durSec: 5.4, note: 52, gain: 0.72 },
        { atSec: 0.5, durSec: 5.1, note: 60, gain: 0.72 },
        { atSec: 0.9, durSec: 4.7, note: 64, gain: 0.6 },
        { atSec: 1.4, durSec: 4.2, note: 71, gain: 0.54 },
      ],
    },
    lean: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 43, gain: 0.78 },
        { atSec: 0, durSec: 7.2, note: 62, gain: 0.66 },
        { atSec: 0, durSec: 7.2, note: 67, gain: 0.6 },
        { atSec: 0, durSec: 3.5, note: 60, gain: 0.72 },
        { atSec: 3.5, durSec: 3.7, note: 59, gain: 0.66 },
      ],
    },
    ferry: {
      notes: [
        { atSec: 0, durSec: 3.6, note: 45, gain: 0.84 },
        { atSec: 0, durSec: 7.2, note: 57, gain: 0.72 },
        { atSec: 0, durSec: 7.2, note: 60, gain: 0.66 },
        { atSec: 0, durSec: 7.2, note: 64, gain: 0.6 },
        { atSec: 3.6, durSec: 3.6, note: 41, gain: 0.78 },
      ],
    },
    hymn: {
      notes: [
        { atSec: 0, durSec: 1.9, note: 48, gain: 0.78 },
        { atSec: 0, durSec: 1.9, note: 55, gain: 0.66 },
        { atSec: 0, durSec: 1.9, note: 64, gain: 0.6 },
        { atSec: 0, durSec: 5.5, note: 72, gain: 0.66 },
        { atSec: 1.9, durSec: 1.8, note: 45, gain: 0.78 },
        { atSec: 1.9, durSec: 3.6, note: 57, gain: 0.66 },
        { atSec: 1.9, durSec: 1.8, note: 64, gain: 0.6 },
        { atSec: 3.7, durSec: 1.8, note: 41, gain: 0.78 },
        { atSec: 3.7, durSec: 1.8, note: 65, gain: 0.6 },
        { atSec: 5.5, durSec: 1.8, note: 43, gain: 0.78 },
        { atSec: 5.5, durSec: 1.8, note: 55, gain: 0.6 },
        { atSec: 5.5, durSec: 1.8, note: 62, gain: 0.6 },
        { atSec: 5.5, durSec: 1.8, note: 71, gain: 0.6 },
      ],
    },
    quartal: {
      notes: [
        { atSec: 0, durSec: 6.5, note: 50, gain: 0.78 },
        { atSec: 0, durSec: 6.5, note: 57, gain: 0.66 },
        { atSec: 0.3, durSec: 6.2, note: 60, gain: 0.6 },
        { atSec: 0.3, durSec: 6.2, note: 67, gain: 0.6 },
        { atSec: 2.6, durSec: 3.9, note: 74, gain: 0.6 },
      ],
    },
    turn: {
      notes: [
        { atSec: 0, durSec: 1.1, note: 62, gain: 0.9 },
        { atSec: 0.8, durSec: 1.1, note: 69, gain: 0.78 },
        { atSec: 1.6, durSec: 1.6, note: 72, gain: 0.72 },
        { atSec: 2.8, durSec: 1, note: 65, gain: 0.78 },
        { atSec: 3.5, durSec: 1.4, note: 76, gain: 0.66 },
        { atSec: 4.9, durSec: 2.2, note: 74, gain: 0.72 },
        { atSec: 4.9, durSec: 2.2, note: 57, gain: 0.72 },
      ],
    },
    ostinato: {
      notes: [
        { atSec: 0, durSec: 0.6, note: 57, gain: 0.9 },
        { atSec: 0.6, durSec: 0.6, note: 64, gain: 0.72 },
        { atSec: 1.2, durSec: 0.6, note: 60, gain: 0.72 },
        { atSec: 1.8, durSec: 0.6, note: 67, gain: 0.78 },
        { atSec: 2.4, durSec: 0.6, note: 57, gain: 0.84 },
        { atSec: 3, durSec: 0.6, note: 64, gain: 0.66 },
        { atSec: 3.6, durSec: 0.6, note: 62, gain: 0.72 },
        { atSec: 4.2, durSec: 0.6, note: 65, gain: 0.72 },
        { atSec: 4.8, durSec: 2.2, note: 57, gain: 0.78 },
        { atSec: 4.8, durSec: 2.2, note: 64, gain: 0.6 },
        { atSec: 4.8, durSec: 2.2, note: 71, gain: 0.6 },
      ],
    },
    call: {
      notes: [
        { atSec: 0, durSec: 0.7, note: 64, gain: 0.9 },
        { atSec: 0.7, durSec: 1.6, note: 67, gain: 0.84 },
        { atSec: 2.6, durSec: 0.7, note: 60, gain: 0.72 },
        { atSec: 3.3, durSec: 1.6, note: 62, gain: 0.72 },
        { atSec: 5, durSec: 2.1, note: 48, gain: 0.84 },
        { atSec: 5.4, durSec: 1.7, note: 64, gain: 0.6 },
      ],
    },
    two: {
      notes: [
        { atSec: 0, durSec: 2, note: 57, gain: 0.84 },
        { atSec: 0, durSec: 2, note: 72, gain: 0.78 },
        { atSec: 2, durSec: 1, note: 71, gain: 0.72 },
        { atSec: 2, durSec: 2, note: 55, gain: 0.78 },
        { atSec: 3, durSec: 1, note: 74, gain: 0.78 },
        { atSec: 4, durSec: 1.2, note: 53, gain: 0.78 },
        { atSec: 4, durSec: 1.2, note: 74, gain: 0.72 },
        { atSec: 5.2, durSec: 2, note: 52, gain: 0.78 },
        { atSec: 5.2, durSec: 2, note: 72, gain: 0.72 },
      ],
    },
    letgo: {
      notes: [
        { atSec: 0, durSec: 0.35, note: 60, gain: 0.9 },
        { atSec: 2.4, durSec: 0.35, note: 67, gain: 0.84 },
        { atSec: 4.8, durSec: 0.35, note: 64, gain: 0.78 },
      ],
    },
    gears: {
      notes: [
        { atSec: 0, durSec: 6.8, note: 48, gain: 0.84 },
        { atSec: 0, durSec: 6.8, note: 55, gain: 0.72 },
        { atSec: 0.1, durSec: 6.7, note: 64, gain: 0.66 },
        { atSec: 0.1, durSec: 6.7, note: 71, gain: 0.6 },
      ],
    },
    cogs: {
      notes: [
        { atSec: 0, durSec: 7, note: 45, gain: 0.84 },
        { atSec: 1.4, durSec: 5.6, note: 57, gain: 0.72 },
        { atSec: 2.8, durSec: 4.2, note: 64, gain: 0.66 },
        { atSec: 4.2, durSec: 2.8, note: 72, gain: 0.6 },
      ],
    },
    strum: {
      notes: [
        { atSec: 0, durSec: 3, note: 40, gain: 0.84 },
        { atSec: 0.03, durSec: 3, note: 52, gain: 0.72 },
        { atSec: 0.06, durSec: 3, note: 59, gain: 0.72 },
        { atSec: 0.09, durSec: 3, note: 64, gain: 0.66 },
        { atSec: 0.12, durSec: 3, note: 67, gain: 0.6 },
        { atSec: 3.5, durSec: 3.5, note: 45, gain: 0.84 },
        { atSec: 3.53, durSec: 3.5, note: 52, gain: 0.72 },
        { atSec: 3.56, durSec: 3.5, note: 57, gain: 0.72 },
        { atSec: 3.59, durSec: 3.5, note: 60, gain: 0.66 },
        { atSec: 3.62, durSec: 3.5, note: 64, gain: 0.6 },
      ],
    },
    walk: {
      notes: [
        { atSec: 0, durSec: 1.2, note: 48, gain: 0.84 },
        { atSec: 0, durSec: 1.2, note: 64, gain: 0.72 },
        { atSec: 1.2, durSec: 1.2, note: 55, gain: 0.78 },
        { atSec: 1.2, durSec: 1.2, note: 62, gain: 0.66 },
        { atSec: 2.4, durSec: 1.2, note: 57, gain: 0.78 },
        { atSec: 2.4, durSec: 1.2, note: 60, gain: 0.66 },
        { atSec: 3.6, durSec: 1.2, note: 53, gain: 0.78 },
        { atSec: 3.6, durSec: 1.2, note: 69, gain: 0.72 },
        { atSec: 4.8, durSec: 2.2, note: 48, gain: 0.84 },
        { atSec: 4.8, durSec: 2.2, note: 67, gain: 0.66 },
      ],
    },
    floor: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 38, gain: 0.9 },
        { atSec: 1.8, durSec: 0.9, note: 45, gain: 0.78 },
        { atSec: 2.9, durSec: 1.7, note: 36, gain: 0.9 },
        { atSec: 4.8, durSec: 0.6, note: 43, gain: 0.78 },
        { atSec: 5.5, durSec: 1.8, note: 33, gain: 0.9 },
      ],
    },
    pulse: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 33, gain: 0.9 },
        { atSec: 0.9, durSec: 0.5, note: 33, gain: 0.72 },
        { atSec: 1.8, durSec: 0.5, note: 33, gain: 0.84 },
        { atSec: 2.7, durSec: 0.7, note: 40, gain: 0.84 },
        { atSec: 3.6, durSec: 1.6, note: 29, gain: 0.9 },
        { atSec: 5.4, durSec: 1.8, note: 36, gain: 0.9 },
      ],
    },
    deep: {
      notes: [
        { atSec: 0, durSec: 3.3, note: 28, gain: 0.9 },
        { atSec: 3.5, durSec: 3.6, note: 33, gain: 0.9 },
      ],
    },
    chimes: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 84, gain: 0.78 },
        { atSec: 1, durSec: 0.5, note: 79, gain: 0.72 },
        { atSec: 2, durSec: 0.8, note: 88, gain: 0.6 },
        { atSec: 3.4, durSec: 0.6, note: 76, gain: 0.72 },
        { atSec: 4.5, durSec: 1.5, note: 83, gain: 0.66 },
      ],
    },
    dusk: {
      notes: [
        { atSec: 0, durSec: 0.6, note: 64, gain: 0.84 },
        { atSec: 0.9, durSec: 0.5, note: 71, gain: 0.72 },
        { atSec: 1.8, durSec: 0.9, note: 74, gain: 0.66 },
        { atSec: 3.2, durSec: 0.6, note: 67, gain: 0.72 },
        { atSec: 4.4, durSec: 1.8, note: 60, gain: 0.78 },
        { atSec: 4.4, durSec: 1.8, note: 72, gain: 0.6 },
      ],
    },
    peal: {
      notes: [
        { atSec: 0, durSec: 0.4, note: 86, gain: 0.72 },
        { atSec: 0.5, durSec: 0.4, note: 83, gain: 0.66 },
        { atSec: 1, durSec: 0.4, note: 81, gain: 0.66 },
        { atSec: 1.5, durSec: 0.4, note: 79, gain: 0.66 },
        { atSec: 2, durSec: 0.4, note: 76, gain: 0.66 },
        { atSec: 2.5, durSec: 1.2, note: 72, gain: 0.72 },
        { atSec: 4.2, durSec: 0.5, note: 74, gain: 0.6 },
        { atSec: 4.2, durSec: 1.5, note: 81, gain: 0.6 },
      ],
    },
    under: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 33, gain: 0.84 },
        { atSec: 0, durSec: 7.2, note: 45, gain: 0.72 },
        { atSec: 0.8, durSec: 6.4, note: 52, gain: 0.6 },
        { atSec: 2.6, durSec: 4.6, note: 60, gain: 0.6 },
        { atSec: 4.4, durSec: 2.8, note: 64, gain: 0.54 },
      ],
    },
    fifth: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 36, gain: 0.84 },
        { atSec: 0, durSec: 7.2, note: 43, gain: 0.72 },
        { atSec: 2.4, durSec: 4.8, note: 55, gain: 0.6 },
      ],
    },
    sing: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 48, gain: 0.72 },
        { atSec: 0, durSec: 7.2, note: 55, gain: 0.6 },
        { atSec: 0, durSec: 2, note: 64, gain: 0.78 },
        { atSec: 2, durSec: 1, note: 65, gain: 0.72 },
        { atSec: 3, durSec: 2, note: 67, gain: 0.78 },
        { atSec: 5, durSec: 2.2, note: 62, gain: 0.72 },
      ],
    },
    lone: { notes: [{ atSec: 0, durSec: 6.8, note: 62, gain: 0.9 }] },
    scatter: {
      notes: [
        { atSec: 0, durSec: 1.5, note: 50, gain: 0.84 },
        { atSec: 1.2, durSec: 1.2, note: 71, gain: 0.66 },
        { atSec: 2.1, durSec: 1.4, note: 64, gain: 0.72 },
        { atSec: 3.3, durSec: 1.2, note: 79, gain: 0.6 },
        { atSec: 4.1, durSec: 1.6, note: 57, gain: 0.78 },
        { atSec: 5.2, durSec: 2, note: 74, gain: 0.6 },
      ],
    },
  },
  directions: [
    {
      id: 'feather-wheels',
      name: 'Feather wheels',
      category: 'pad',
      rows: `
Mill at first light       | Feather wheel | rise=1.4 ring=5 damp=.5 edge=.3 volume=-7 strung=5 spin=9 melt=2.5 point=.42 gauge=.3 beat=0 rim=.9 wobble=.1 | hall | veil | Five like wires turned slowly past a blunt feather, hollow and exactly in tune
Grain in the loft         | Feather wheel | rise=.5 damp=.1 release=2 volume=-8.5 gauge=.4 beat=4.2 wobble=.9 hub=Wood spin=7 melt=2.2 edge=.85 strung=5 | warm | ferry | Five stiff like wires on a wheel far out of true, keen and beating fast
Barley going over         | Feather wheel | spin=50 melt=3 lacing=.9 ring=14 rim=.2 edge=.7 volume=-2.5 hub=Steel point=.5 gauge=0 | brighthall | lean | Tightly laced wires on steel sung straight from the wire, open and hollow
Dust on the beam          | Feather wheel | strung=3 rise=3.5 coast=2 ring=2.2 point=.07 edge=.25 width=.3 beat=.3 volume=-14.5 gauge=.04 | booth | hymn | Three wires touched near the end, coming up slowly and fairly narrow
Weathercock at rest       | Feather wheel | spin=14 melt=2.5 hub=Steel damp=.6 rim=.9 gauge=.35 beat=.1 volume=-2 point=.27 | currents | quartal | Stiff wires on steel turned slowly and smoothly, metal in the tone
Glass over the stairs     | Wire glass | plucker=Feather spin=30 melt=5 point=.5 beat=1.1 rise=2.5 edge=.45 volume=3 gauge=.24 | plate | veil | Octaves of steel touched at the middle, hollow and clear
Window above the weir     | Wire glass | plucker=Feather melt=4 strung=3 wobble=.8 rim=.15 damp=.45 ring=4 spin=9 volume=6 width=.9 | phaser | quartal | Three octave wires turned slowly, each coming forward as it passes
Ice on the mill race      | Wire glass | spin=60 melt=3 damp=0.2 edge=0.14 point=.06 ring=16 rise=5 width=1 volume=-4 gauge=.04 | farshore | lean | Glassy octaves rubbed by a nail, thin and bright, five seconds coming
Morning on the locks      | - | spin=36 melt=8 hub=Steel gauge=.45 beat=2 rise=1 edge=.2 rim=.5 lacing=.7 volume=4.5 width=1 point=.26 | chorus | ferry | Laced octaves of stiff wire on steel, round and beating
Pale sun on copper        | Wire glass | plucker=Feather hub=Wood tuning=Octaves strung=5 edge=.8 point=.12 coast=12 release=9 rise=.3 gauge=0 volume=-13.5 | reel | hymn | Five octave wires on wood under a keen feather, warm and quick to speak
Long fields of fence      | Heavy wheel | hub=Wood gauge=0 spin=40 melt=6 rise=2 edge=.4 wobble=.25 beat=.4 volume=-4.5 | valley | quartal | A fan of fifths sung smoothly on wood with nothing stiff in it
Wind along the cables     | Air drone | plucker=Feather rise=1.2 hub=Steel rim=.6 damp=.35 ring=8 edge=.4 gauge=.5 spin=9 melt=3 point=.12 beat=2.2 width=1 | airy | veil | A stiff fan on steel touched near the end and turned slowly, beating
Aqueduct in June          | Woven voices | tuning=Fan lacing=.3 spin=22 rise=3 point=.25 beat=1.2 rim=.5 damp=.15 volume=-4 gauge=.32 | expanse | lean | Fifths above and below each key, rubbed on wood and beating lightly
Four walls of hay         | Heavy wheel | hub=Wood strung=4 spin=12 melt=3 rise=.6 wobble=.9 ring=3 damp=.4 edge=.3 gauge=.1 volume=0 point=.27 | room | ferry | Four wires of a fan on a crooked wheel that swells once each turn
Last swifts               | Heavy wheel | hub=Steel gauge=.2 spin=55 melt=10 rise=1.5 edge=.2 damp=.5 width=1 coast=3 lacing=.8 volume=-0.5 point=.23 | glimmer | hymn | Fifths rubbed fast on steel, dark on top and as wide as it goes
Cart coming home          | - | spin=20 melt=7 rise=8 tuning=Unison hub=Wood ring=3 edge=.5 beat=.7 volume=-9 gauge=.04 point=.15 | deck | veil | Plucks that quicken for seconds until they close into one tone
Draw the thread out       | - | spin=45 melt=14 rise=10 tuning=Octaves gear=1 wobble=0 damp=.4 release=6 volume=-4 gauge=.32 width=.6 beat=.8 | longplate | lean | All wheels alike, octaves plucked slowly and drawn together into a line
Spinning to a hush        | - | spin=28 melt=9 rise=5 tuning=Fan strung=4 hub=Steel point=.4 edge=.25 lacing=0 volume=6 gauge=0 width=.9 | tape3 | ferry | Four fan wires on steel that begin as single notes and end as a hush
Before the kettle sings   | - | spin=30 melt=12 rise=6 tuning=Overtones hub=Wood damp=.6 edge=.3 ring=2 rim=.9 volume=2 gauge=.24 width=.45 point=.12 beat=1.3 | mike | quartal | Overtones plucked in turn, gathering slowly into a hum on wood
The loom warms up         | - | spin=16 melt=5 rise=4 tuning=Unison strung=2 gauge=.3 beat=3 point=.1 width=.5 volume=-4 | rotary | veil | Two stiff wires drawn up to a tone that beats quickly
Threshing floor by moon | Heavy wheel | tuning=Unison spin=34 rise=2 edge=.6 gauge=0 wobble=.2 rim=.6 ring=12 point=.34 | darkhall | lean | Like wires on a skin, round and low, with a boom beneath them
Felted turbine            | Skin bass | damp=0.4 strung=6 tuning=Octaves spin=40 melt=8 rise=1.5 coast=5 release=3 point=.2 width=.8 rim=.3 volume=-9.5 gauge=0 | cloth | hymn | Octaves on a skin that stops them soon, rubbed soft and close
Peat smoke rising         | Heavy wheel | melt=4 rise=3.5 rim=.8 edge=.9 wobble=.5 width=1 volume=-2.5 strung=3 spin=7 gauge=.45 beat=2.4 point=.3 | fog | quartal | A keen feather on three stiff fan wires over a skin, booming slowly
Warm side of the barn     | Skin bass | tuning=Unison strung=4 spin=26 melt=5 rise=.8 coast=3 release=4 rim=.25 edge=.75 beat=1.4 width=.7 volume=-8 | chorus 2.mix=0.1 | ferry | Four like wires on a skin, thick and beating
Drum left out all night   | Heavy wheel | tuning=Overtones edge=.85 rim=.4 gauge=0 ring=18 volume=-8 gesture=Rocked strung=3 spin=9 melt=2.5 rise=1.2 coast=8 | lowvault | veil | Three overtones rocked slowly over a skin, the note itself to the front
Rain on a slack wire      | - | spin=15 melt=15 tuning=Unison ring=3 wobble=.5 edge=.45 hub=Wood rise=.2 volume=-13.5 strung=3 point=.4 gauge=.35 beat=3.6 width=1 | walls | ferry | Half plucked and half rubbed, three stiff wires beating fast on wood
Shiver of the reeds       | - | spin=24 melt=26 tuning=Octaves hub=Steel ring=8 damp=.5 edge=.35 rise=.5 strung=4 volume=1.5 gauge=.24 point=.26 beat=1.3 | shiver | lean | Four octave wires on steel plucked just too fast to count
Hummingbird weather       | - | spin=40 melt=40 tuning=Fan ring=1.5 wobble=.1 gear=1 rise=.1 rim=.4 volume=-5.5 plucker=Nail edge=.15 point=.12 beat=.1 | wide | veil | A fan flickering forty times a second under a nail, every wheel in step
Swarm by the lime tree    | - | spin=20 melt=34 tuning=Overtones ring=5 damp=.55 edge=.3 hub=Wood wobble=.9 rise=1.5 lacing=.6 volume=-3.5 gauge=.04 width=.9 point=.3 beat=1.8 | hall 1.mix=0.2 | quartal | Laced overtones hurried round a crooked wheel, blurred by their ring
Trembling aspens          | - | spin=30 melt=22 tuning=Octaves ring=.6 hub=Wood edge=.55 point=.3 rise=.3 release=1 strung=3 volume=-10 gauge=.24 width=.45 beat=.8 | tremolo | hymn | Three octave wires in a fast flutter, each soon gone
Hammock between pines     | Rocking cradle | spin=30 melt=8 tuning=Unison ring=6 rise=.8 edge=.4 volume=-3 gauge=.24 point=.14 beat=1.3 | breathing | lean | Like wires rubbed forward and back, swelling at each swing
Boat tied to a ring       | Rocking cradle | spin=18 melt=4 tuning=Fan hub=Steel ring=3 rim=.7 damp=.4 lacing=.6 volume=3.5 point=.27 beat=.1 | water | ferry | A fan of fifths on steel rocked gently to either side
Porch swing at nine       | Rocking cradle | spin=45 melt=12 ring=2.5 rise=2 coast=12 point=.45 edge=.3 beat=1 volume=6 gauge=.04 | season | veil | Hollow octaves on wood swung wide and slowly let go
Nets on the sea wall      | Rocking cradle | spin=12 melt=3 tuning=Overtones ring=4 damp=.6 edge=.2 hub=Wood rim=.8 volume=6 gauge=.32 beat=.8 | around | quartal | Overtones swayed to and fro, blunt and wooden
Lullaby for a lathe       | Rocking cradle | spin=60 melt=20 tuning=Unison strung=2 gauge=.5 beat=2 ring=9 width=.4 volume=-8 point=.34 | loops | hymn | Two stiff wires in long swings, plucked at the turn and sung between
Thin light in the hall    | Woven voices | lacing=0 strung=1 point=.05 spin=30 rise=.6 edge=.75 damp=.05 rim=.3 volume=-16 width=.45 | brighthall 1.mix=0.2 | quartal | One wire touched at its very end, reedy and narrow in tone
Needle in the rafters     | Woven voices | strung=2 point=.06 tuning=Octaves hub=Steel edge=.6 beat=.2 damp=.3 rise=2 volume=-12.5 gauge=.04 width=.45 wobble=.25 | thin | lean | Two nasal octave wires on steel, slow to arrive
Pencil line at dusk       | Feather wheel | strung=1 point=.15 edge=.9 hub=Wood ring=1 rim=.5 melt=5 rise=.1 wobble=.6 volume=-10.5 gauge=.06 | deck | hymn | A single wire drawn by a keen feather, plain as a line
Sedge in a ditch          | Feather wheel | strung=3 tuning=Fan point=.05 edge=.5 damp=.2 lacing=.3 spin=15 melt=3 volume=-0.5 rim=0 gauge=0 | nextdoor | ferry | Three fan wires touched at the end, all string and no wood
One candle, long room     | Feather wheel | strung=2 point=.5 edge=.2 damp=0.95 ring=12 beat=.05 rise=4 wobble=0 volume=-2.5 gauge=.08 | cathedral | veil | Two like wires at their middle, almost a pure tone, rising slowly
Frost on the pylons       | Wire glass | tuning=Overtones spin=40 melt=8 damp=0.6 edge=0.12 ring=5 rise=2.5 strung=4 rim=.2 volume=1 gauge=.04 | plate | lean | Nailed overtones rubbed fast and soft, a cold halo of fifths and thirds
Blue hour at the dam      | Wire glass | tuning=Unison strung=4 spin=24 melt=5 edge=.35 point=.2 damp=.35 hub=Wood rise=1 beat=1.5 volume=-4 gauge=.04 width=.6 | blur | ferry | Four like wires brushed by a nail on wood, fine and beating
Tracks under snow         | Wire glass | tuning=Fan spin=52 melt=6 edge=0.18 damp=.6 rise=3.5 gauge=.2 coast=12 release=8 volume=6 width=.9 | shimmer | veil | A fan under a blunt nail, pale and smooth
Streetcar at a bend       | Wire glass | gesture=Rocked spin=36 melt=9 point=.1 edge=0.2 damp=0.45 rise=.4 ring=3 volume=6 gauge=.24 | flanger | quartal | Octaves nailed on steel, rocked back and forth with a thin edge
Sea behind the dune       | Puffed reeds | hub=Wood tuning=Octaves spin=40 melt=5 rise=1.5 rim=.4 strung=6 edge=.3 release=4 coast=4 gear=0 volume=3.5 point=.14 | farshore | lean | Air turned quickly round octave wires, breath with a note inside
Bell metal barely moving | Feather wheel | gauge=.8 hub=Steel spin=32 melt=6 edge=.5 rise=2 ring=14 beat=.4 rim=.7 volume=-4 point=.12 | cathedral 1.mix=0.25 | lean | Heavy bars sung rather than struck, their overtones stretched on steel
Empty weighbridge         | Heavy wheel | hub=Steel gauge=.65 spin=20 melt=5 rise=1.5 damp=.4 edge=.4 strung=3 wobble=.4 volume=3.5 point=.3 | generations | ferry | Three thick wires of a fan on steel, bent overtones humming
Anvil wrapped in wool     | Feather wheel | gauge=1 hub=Wood damp=0.9 edge=.35 rise=.5 ring=6 volume=-5.5 tuning=Fan strung=4 spin=9 melt=2.5 wobble=.7 point=.15 | darkhall | veil | Fifths of the heaviest wire on wood, turned slowly, dark and bar-like
Tin roof, slow thaw       | Feather wheel | width=0.4 gauge=.55 tuning=Fan hub=Steel strung=5 spin=48 melt=20 rise=3 edge=.2 damp=.2 beat=2.2 volume=3 | melt | quartal | Five stiff fan wires on steel, plucks that thaw into a wavering chord
Moon over the gasworks    | Heavy wheel | gauge=.9 tuning=Unison hub=Steel spin=10 melt=3 rise=.4 ring=20 rim=.5 edge=.3 damp=.5 beat=3 width=1 volume=-3 point=.26 | bowls | hymn | Like bars turned slowly, beating against each other on steel
`,
    },
    {
      id: 'last-turns',
      name: 'Last turns',
      category: 'texture',
      rows: `
Until the hub is still    | Last turns | coast=18 damp=.5 edge=.4 beat=.3 release=6 volume=-1.5 tuning=Overtones strung=3 hub=Wood gauge=.3 ring=7 point=.35 rim=.8 spin=5 width=1 | hall | letgo | Three overtones on wood thrown once, the plucks slower and slower for long
Counting the dark         | Last turns | spin=3 coast=20 rim=.6 ring=8 release=12 volume=0 tuning=Fan strung=3 plucker=Nail gauge=.5 edge=.1 beat=.4 width=.6 | bare | letgo | Three stiff fan wires picked by a nail about three times a second, then less
Wheel without a pin | Last turns | spin=14 coast=6 wobble=1 gauge=.3 damp=.2 point=.3 release=2 width=1 volume=0 beat=1 | room | scatter | A stiff wheel far out of true, thrown and stumbling
Pedals left spinning      | Last turns | spin=22 coast=8 ring=1 edge=.7 point=.1 release=1.5 volume=-16 rim=.04 width=.35 beat=1.8 | slap | turn | Quick thin ticks of wire that run on and slow when the key is down | plucked
Every turn an echo        | Last turns | spin=8 coast=12 strung=1 lacing=.9 ring=14 damp=.6 release=9 gauge=0.4 volume=-8 width=.5 point=.27 | stars | lone | One wire plucked over and over, each time later and softer
Ratchet in the shed       | Last turns | hub=Wood spin=10 ring=.35 coast=5 tuning=Octaves edge=.65 rim=.7 release=.5 volume=0 gauge=.05 point=.3 beat=1.3 | walls | letgo | Dry octave ticks on wood that slow like a ratchet let go | plucked
Dice in a wooden bowl     | Last turns | hub=Wood spin=18 ring=.2 coast=3 tuning=Fan wobble=.8 rim=.9 release=.3 edge=.5 volume=2.5 gauge=.34 width=.35 point=.15 | plank 2.gain=9 | scatter | A short rattle of fan wires, uneven and quickly over | plucked
Clock nobody winds        | Last turns | width=0 hub=Wood spin=2.5 ring=.8 coast=20 tuning=Unison strung=1 point=.08 release=2 wobble=0 volume=-9.5 | deck | lone | A single short wire ticking on wood, slowing over many seconds
Beads along a string      | Last turns | hub=Wood spin=6 ring=.6 coast=9 tuning=Overtones damp=.2 release=1 edge=.4 rim=.2 volume=-2.5 gauge=.2 width=.5 point=.26 beat=.8 | clean | turn | Short overtone plucks in a row, each one a step up or down | plucked
Crickets winding down     | Last turns | hub=Wood spin=40 melt=40 ring=.15 coast=6 tuning=Octaves strung=3 point=.4 release=.6 edge=.8 volume=6 gauge=.36 width=.6 | farshore | letgo | Very short plucks, a chirring of octaves that thins to single clicks
Shower on a trellis       | Last turns | tuning=Fan spin=34 coast=5 ring=5 edge=.35 hub=Steel rim=.5 release=5 damp=.45 volume=-1.5 gauge=.22 width=.5 beat=.1 | brighthall | scatter | A shower of fifths on steel that thins out to drops
Seeds from a pod          | Last turns | tuning=Fan spin=24 coast=2.5 hub=Wood ring=2 edge=.3 strung=5 release=3 wobble=.5 volume=1.5 width=.5 point=.34 beat=1.8 | cascade | letgo | Five fan wires scattered quickly on wood, gone in two seconds | plucked
Sparks off the stone      | Last turns | tuning=Fan plucker=Nail spin=48 coast=7 ring=2 edge=.15 rim=.4 width=1 gauge=.2 volume=6 point=.1 strung=5 beat=.8 damp=.65 | glints | letgo | A nail across five fan wires of steel near the end, fast at first and then one by one
Handful of gravel         | Last turns | tuning=Fan hub=Skin spin=20 coast=4 ring=6 edge=.9 rim=.3 release=2 gauge=.4 wobble=.9 volume=-3.5 point=.27 | centre | scatter | Fan wires over a skin, knocked unevenly and dull
Umbrella shaken out       | Last turns | tuning=Fan spin=60 melt=40 coast=3 ring=3 hub=Wood point=.06 edge=.6 rim=.15 release=4 volume=-10 gauge=.05 width=.35 beat=1.3 | spring | turn | A quick thin flurry of fifths at each key, then a few late drops | plucked
Song that falls apart     | Last turns | spin=40 melt=8 coast=10 ring=3 hub=Wood rim=.6 tuning=Unison edge=.5 beat=.9 volume=-1 width=.6 point=.15 | memory 3.gain=0 | lone | Like wires that sing at first and come apart into plucks as they slow
Thread pulled loose       | Last turns | spin=30 melt=6 coast=5 tuning=Octaves hub=Steel ring=2.5 edge=.3 strung=4 damp=.3 volume=3.5 gauge=.28 beat=.8 | tape3 | letgo | An octave tone on steel unravelling into four wires
From hum to drip          | Last turns | spin=50 melt=14 coast=14 ring=1.2 rim=.4 edge=.55 wobble=.4 volume=-4.5 gauge=.24 width=.9 point=.26 tuning=Octaves strung=5 hub=Steel | currents | ferry | A hum of five octave wires on steel that breaks into dry plucks, slower all the time
Bright before supper      | Last turns | spin=24 melt=5 coast=3.5 tuning=Overtones hub=Wood damp=.5 ring=1.5 edge=.35 release=2 volume=-1 gauge=.05 width=.5 point=.12 beat=1.3 | rotary | turn | Overtones that start as a tone and are single notes three seconds on
Lantern swung and set     | Last turns | spin=55 melt=10 coast=7 plucker=Nail edge=.15 damp=.35 ring=6 strung=3 beat=1.5 volume=5.5 gauge=.22 width=1 point=.3 | longplate | quartal | Three nailed wires, sung then counted out on steel
Coin on the counter       | Last turns | plucker=Nail tuning=Octaves gauge=.6 spin=16 coast=5 ring=5 release=4 volume=-5 width=.4 point=.34 beat=.8 damp=.7 edge=.08 | chamber | dusk | Thick octave wires nailed on steel, ringing round and round to rest | bell
Teeth of a tiny comb      | Last turns | plucker=Nail tuning=Octaves strung=4 gauge=.35 spin=7 coast=9 ring=3 point=.4 rim=.2 volume=-3 width=1 damp=.65 edge=.1 | tin | dusk | Four small stiff wires picked in turn, slowing like a spring | bell
Keyhole music             | Last turns | plucker=Nail tuning=Overtones strung=5 spin=4 coast=14 ring=6 gauge=.2 release=7 volume=-2.5 width=.9 point=.27 beat=1.3 damp=.8 edge=.05 | nextdoor | call | Nailed overtones one after the other, unhurried and slowing | bell
Broken carousel           | Last turns | width=0.5 plucker=Nail spin=11 coast=4 wobble=1 gauge=.5 edge=.2 hub=Wood ring=4 volume=6 beat=4.5 tuning=Fan point=.23 | worn | peal | Fifths out of true nailed on wood, beating and sagging to a stop| bell
Sugar in the pan          | Last turns | plucker=Nail tuning=Fan strung=6 spin=30 coast=2 ring=.8 edge=.2 damp=.1 rim=.8 release=1 volume=6 beat=1.8 | fog | scatter | A dry crackle of nailed fifths on steel, over in two seconds
Gone on without us        | Spun wire | spin=10 melt=30 coast=20 rise=.05 ring=3 release=10 tuning=Unison hub=Steel damp=.4 gauge=.36 width=1 volume=-4.5 | valley | letgo | Like wires on steel that run on long after the key is up
After the last stop       | Spun wire | spin=6 melt=40 coast=12 rise=.05 ring=1.5 release=6 hub=Wood edge=.4 gear=1 tuning=Fan volume=-5 gauge=.05 width=.6 point=.26 beat=1.3 | dark | letgo | A fan on wood whose plucks go on slowing when you let go
Left on the hook          | Spun wire | spin=18 melt=24 coast=8 rise=.1 tuning=Octaves strung=3 ring=6 release=8 damp=.6 rim=.9 volume=-13.5 gauge=.22 point=.12 beat=.1 | loops | strum | Three octave wires, quick while held and slower on their own
The gate still swings     | Rocking cradle | spin=8 melt=40 coast=16 ring=3 tuning=Fan release=8 wobble=.3 volume=1.5 point=.3 beat=1.8 | breathing | letgo | A fan rocked while held, swinging less and less once let go
Who turned the handle     | Spun wire | spin=26 melt=8 coast=15 rise=.4 plucker=Card ring=10 release=9 hub=Steel tuning=Overtones volume=-2.5 gauge=.28 width=.5 point=.15 beat=.8 damp=.8 edge=.12 | memory | letgo | Carded overtones on steel that coast for a long while after the key
Fortune wheel at dusk     | Card in the wheel | gesture=Thrown spin=20 coast=7 tuning=Unison strung=1 ring=4 edge=.4 wobble=0 rim=.8 gauge=.05 width=.25 point=.14 volume=-5.5 | room | letgo | A card against one wire, flapping fast and then slap by slap
Pages in a draught        | Card in the wheel | gesture=Thrown spin=30 coast=4 tuning=Octaves hub=Wood ring=2 edge=.2 rim=.3 release=2 volume=-1 gauge=.22 point=.27 beat=.1 | wide | scatter | Soft slaps over four octaves that slow in a few seconds
Deck shuffled once        | Card in the wheel | gesture=Thrown spin=60 melt=40 coast=2.5 tuning=Overtones ring=6 hub=Steel gear=0 volume=1 width=1 point=.23 beat=1.8 damp=.65 edge=.18 | stone | call | A flurry of carded overtones on steel at each key | plucked
Sails of a toy mill       | Card in the wheel | gesture=Thrown spin=8 coast=12 hub=Skin ring=20 edge=.7 rim=.5 wobble=.4 release=3 volume=0.5 gauge=.28 beat=.8 | centre | letgo | Cards slapping a fan over a skin, slower with each turn
Slats in a squall         | Card in the wheel | gesture=Thrown spin=14 coast=9 gauge=.5 hub=Steel ring=12 edge=0.5 wobble=.9 strung=4 beat=2 volume=6 width=.6 point=.34 | slack | scatter | Four stiff wires slapped by a card, uneven and rattling off
Barrel down the stairs    | Last turns | hub=Skin tuning=Unison spin=9 coast=6 ring=12 edge=.85 rim=.5 strung=3 release=1 volume=-6.5 width=.3 point=.26 beat=1 | hollowpipe | floor | Three like wires knocked on a skin, rolling slower and slower | bass
Heavy door, long latch    | Last turns | hub=Skin tuning=Octaves spin=5 coast=10 ring=8 edge=0.6 rim=.7 point=.1 gauge=.3 release=4 volume=-6 width=.15 beat=1.8 | darkhall | deep | Stiff octaves thudding on a skin with ever longer gaps | bass
Footfalls in felt         | Last turns | hub=Skin tuning=Fan strung=2 spin=3 coast=16 ring=6 edge=0.75 rim=.4 release=1.5 width=.3 volume=6 gauge=.22 point=.3 beat=.8 | mike | floor | Two wires a fifth apart on a skin, soft and widely spaced | bass
Thunder goes inland       | Last turns | hub=Skin tuning=Unison spin=24 coast=9 ring=20 edge=.95 rim=.6 lacing=.8 beat=1.5 release=5 volume=-23.5 gauge=.3 width=.3 point=.15 | cave | deep | Laced wires rolled fast on a skin, dying off in slower thuds | drum
Train beyond the ridge    | Last turns | hub=Wood tuning=Octaves spin=12 coast=20 ring=.5 edge=.3 rim=1 damp=.5 release=3 wobble=.2 width=1 volume=5 beat=1.3 | nextdoor | floor | Short dull octave knocks, steady at first and slowly falling back | drum
Swing with no child       | Rocking cradle | spin=5 melt=40 coast=20 ring=6 tuning=Unison hub=Steel damp=.5 release=12 gear=1 volume=-0.5 point=.27 beat=1.8 | plate | letgo | Like wires rocked slowly on steel, the arc smaller each time
Plumb line settling       | Rocking cradle | spin=12 melt=30 coast=8 ring=2.5 tuning=Overtones hub=Wood edge=.35 release=5 strung=4 volume=-3 gauge=.28 point=.23 beat=.8 | sines | letgo | Four overtones crossed back and forth until the swing dies
Buoy after the wake       | Rocking cradle | spin=20 melt=40 coast=6 ring=8 plucker=Nail edge=.2 hub=Steel damp=.4 tuning=Fan rim=.5 release=6 volume=6 gauge=.36 | water | scatter | Nailed fifths on steel, flung to each side and settling
Nodding grass             | Rocking cradle | spin=3 melt=40 coast=10 ring=1.6 tuning=Octaves strung=2 edge=0.5 point=0.12 release=2 volume=-5.5 gauge=.05 beat=1.3 | airy | call | Two short wires nodded to and fro, small and dry | plucked
Rope over the beam        | Rocking cradle | spin=15 melt=40 coast=12 hub=Skin ring=20 edge=.8 tuning=Octaves rim=.35 gauge=.2 release=4 volume=-6.5 point=.14 beat=.1 | tunnel | floor | Octave wires on a skin swung heavily to either side
Breath after running      | Last turns | plucker=Air spin=6 coast=8 ring=4 rim=.4 release=3 volume=0 tuning=Octaves strung=4 hub=Steel edge=.5 point=.4 gauge=.28 width=.9 beat=.8 | booth | letgo | Puffs of air on four octaves, quick and then long apart
Bellows put down          | Last turns | plucker=Air hub=Steel tuning=Fan spin=12 coast=10 ring=8 edge=.5 rim=.6 damp=.5 release=6 wobble=.6 volume=3 gauge=.36 width=.5 point=.3 | cathedral | letgo | Air in gusts round a steel fan, fading as the wheel slows
Last bar of the chime     | Last turns | gauge=.9 tuning=Octaves strung=4 spin=3 coast=15 ring=18 edge=.4 release=10 rim=.6 volume=-5.5 width=.9 point=.15 beat=1.3 damp=.55 | cathedral 1.mix=0.24 | chimes | Four bars struck in turn by a soft feather, ever later | bell
Pipes cooling at night    | Last turns | gauge=1 tuning=Fan hub=Wood spin=9 coast=7 ring=3 edge=.6 wobble=.7 release=2 point=.3 volume=4 width=.6 beat=.1 | generations | scatter | Thick fan wires on wood that tick irregularly and slow down
Swept into a corner       | Last turns | gauge=.7 tuning=Overtones spin=36 coast=6 ring=10 edge=.3 release=7 rim=.3 lacing=.7 width=1 volume=-6 point=.26 beat=1.8 damp=.75 | blur | letgo | Laced heavy overtones that rush, scatter and come to rest
`,
    },
    {
      id: 'overtone-fans',
      name: 'Overtone fans',
      category: 'plucked',
      rows: `
Ladder to the hayloft     | Overtone ladder | spin=3 melt=40 rise=.05 rim=.3 damp=.4 volume=-6.5 plucker=Feather hub=Wood gear=1 gauge=.4 ring=1.8 point=.36 width=.5 | hall | gears | Each key steps slowly up its own overtones on wood, every step short
Stair of small lamps      | Overtone ladder | spin=5 melt=40 gear=2 strung=5 ring=8 edge=.35 point=.3 release=5 volume=-5 gauge=.05 width=.9 | plate | cogs | Five overtones a key, every key geared a little faster than the last
Odd steps only            | Overtone ladder | spin=2 strung=3 ring=10 lacing=0 rim=.7 damp=.5 wobble=0 release=8 volume=-3.5 gauge=.34 point=.34 | bare | lone | Three overtones counted two to the second on steel and left to ring
Geese over the estuary    | Overtone ladder | spin=6.5 hub=Wood wobble=.8 lacing=.7 ring=2 edge=.4 width=1 volume=-6.5 point=.14 | farshore | gears | Laced overtones on wood in uneven flight
Well rope going down      | Overtone ladder | spin=4 melt=40 hub=Wood strung=4 gauge=.35 ring=2.5 point=.1 rim=.8 gear=4 volume=-4 width=1 | hollowpipe | cogs | Four stiff overtones on wood, the higher keys turning slower
Fan snapped open          | Strummed fan | tuning=Overtones spin=24 edge=.3 damp=.5 ring=6 plucker=Feather gear=0 gauge=.05 beat=1.3 | room | strum | Each key flicks through six overtones and leaves them ringing on steel
Peacock on the wall       | Strummed fan | strung=3 tuning=Overtones spin=14 damp=0.65 rim=0.45 edge=0.1 release=6 point=.4 gauge=.2 width=.35 beat=.1 | glimmer | call | A nail drawn once across three hollow overtones on steel
Venetian blind            | Strummed fan | tuning=Overtones hub=Wood spin=40 ring=3 edge=.2 damp=.5 strung=5 release=1 lacing=.6 volume=-5 gauge=.26 width=.9 beat=1.8 | scooped | walk | Five overtones nailed on wood, quick and damped at once | keys
Cards held close          | Strummed fan | tuning=Overtones plucker=Card spin=18 ring=14 edge=.25 damp=.3 release=2 gauge=.15 volume=-5.5 width=.5 beat=.8 | booth | ostinato | A card drawn once over the overtones of each key
Palm along a railing      | Strummed fan | tuning=Overtones plucker=Feather spin=7 hub=Wood rise=.4 ring=7 damp=.45 edge=.7 release=7 gauge=.24 width=.9 | valley | strum | A slow hand over six overtones on wood, speeding up as it goes
Two notes of a horn       | Overtone ladder | width=0.3 strung=2 spin=40 melt=5 hub=Wood rim=.7 ring=4 edge=.4 gear=0 rise=.3 wobble=.1 volume=-12 gauge=0 | plank | hymn | The note and its twelfth rubbed into one plain stop | organ
Chapel with no bellows    | Overtone ladder | strung=3 damp=.5 edge=.3 ring=6 rise=1 rim=.4 volume=-1.5 hub=Steel spin=12 melt=3 point=.4 beat=2.8 gear=3 wobble=.5 gauge=0 width=.4 | cathedral | hymn | Note, twelfth and high third turned slowly and beating, quicker on the upper keys| organ
Pipe behind plaster | Overtone ladder | strung=2 spin=28 melt=6 hub=Skin ring=14 edge=.9 rim=.4 lacing=.5 rise=.2 volume=-5.5 gauge=.24 point=.14 | pipes | ferry | Two partials over a skin, round and pipe-like | organ
Street organ, far corner  | Overtone ladder | width=0.3 strung=4 spin=22 melt=4 edge=.5 damp=.3 rim=.9 wobble=.7 rise=.1 ring=2 beat=2 volume=-4.5 gauge=.02 point=.27 | nextdoor | walk | Four overtones on steel turned by an uneven handle | organ
Hum of the choir stall    | Overtone ladder | strung=3 spin=50 melt=3 hub=Wood damp=.6 edge=.2 point=.4 ring=10 rise=2.5 coast=8 release=5 volume=1 gauge=.2 | rise | lean | Three overtones rubbed blunt at the middle, slow to fill | organ
Seventh on the sill       | Overtone ladder | strung=4 spin=26 melt=6 damp=.55 edge=.3 ring=5 rise=1.4 hub=Wood rim=.5 gear=0 volume=0 gauge=.04 point=.15 | chorus | veil | Overtones to the natural seventh, sung low and warm on wood | pad
Hedge at blackbird time   | Overtone ladder | width=0.4 strung=4 spin=9 melt=9 damp=.5 ring=3 hub=Wood edge=.45 lacing=.8 rise=.2 volume=-7 gauge=0 | hall 1.mix=0.2 | two | Four laced overtones, part plucked and part sung, on wood | string
Haze over the orchard     | Overtone ladder | spin=32 melt=6 damp=0.75 edge=.25 rise=3 ring=8 hub=Steel rim=.2 beat=1.6 width=1 volume=-0.5 point=.3 gauge=.25 strung=5 | haze | quartal | Five overtones rubbed soft and wide, beating as they swell| pad
Lamp oil and brass        | Overtone ladder | strung=5 spin=18 melt=3 damp=.4 edge=.2 ring=3 rise=.8 rim=1 gauge=.1 gear=1 volume=-2.5 width=.45 point=.12 | drift | ferry | Five overtones turned smoothly, heard through a steel rim | pad
Comet, third night        | Overtone ladder | spin=44 melt=10 rise=7 damp=.5 edge=.3 coast=12 release=9 hub=Wood point=.35 volume=-1.5 width=1 | longplate | quartal | Overtones plucked apart at first and drawn together for seconds | pad
Gap in the hedge    | Air drone | tuning=Overtones strung=3 spin=18 melt=4 rise=.4 damp=.2 edge=.6 rim=.2 ring=6 coast=2 release=2 gauge=.24 width=1 point=.34 | room | sing | Breath on three overtones, a thin whistle over the note | wind
Bottles on a line         | Air drone | point=0.4 tuning=Overtones strung=2 spin=4 melt=40 rise=.05 edge=.2 ring=3 hub=Wood release=1 wobble=.6 gauge=0 width=.45 | pot | turn | Puffs across two partials, round and hollow | wind
Draught in the organ      | Puffed reeds | tuning=Overtones hub=Wood spin=30 melt=5 rise=.6 strung=5 edge=.3 rim=.5 release=3 gear=0 volume=2 gauge=.24 width=.3 point=.27 | breathing | veil | Air moving quickly over five overtones on wood | wind
Samphire and wind         | Air drone | tuning=Overtones spin=10 melt=3 rise=2 damp=.5 edge=.1 ring=5 hub=Wood rim=.7 lacing=.8 point=.1 gauge=.3 volume=1.5 | valley | sing | Laced overtones breathed on over wood, high partials coming and going| wind
Kite string at noon       | Air drone | tuning=Overtones gesture=Rocked strung=4 spin=24 melt=6 rise=.3 edge=.4 hub=Wood beat=2 volume=6 rim=.03 gauge=.05 | around | lone | Air rocked over four overtones, rising at each swing | wind
Patience on a tray        | Card in the wheel | tuning=Overtones gesture=One_turn spin=50 strung=3 ring=12 edge=.3 gear=0 release=1 rim=.4 volume=-1 gauge=.2 width=.45 | booth | walk | Three overtones slapped all but together, damped when let go | keys
Wicker and wire           | Card in the wheel | tuning=Overtones spin=10 strung=4 ring=5 hub=Wood edge=.2 rim=.8 wobble=.2 coast=1 damp=.3 gauge=.05 point=.26 beat=1.3 | centre | gears | Soft slaps climbing four overtones on wood, ten to the second | plucked
Letter through a slot     | Card in the wheel | tuning=Overtones gesture=One_turn spin=20 strung=2 hub=Steel ring=18 edge=.4 release=3 gauge=.3 volume=0.5 point=.12 beat=.1 | dark | call | Two stiff partials slapped one after the other on steel | keys
Cane chair by a fan       | Card in the wheel | tuning=Overtones spin=24 melt=12 hub=Steel ring=8 edge=.15 damp=.5 rim=.3 gear=3 rise=.5 volume=3.5 width=.9 point=.3 beat=1.8 | walls | cogs | A card buzzing softly round overtones, the higher keys far faster | texture
Museum of small doors     | Card in the wheel | tuning=Overtones gesture=Thrown spin=12 coast=3 hub=Skin ring=20 edge=.6 rim=.4 release=1 volume=-4.5 gauge=.2 width=1 point=.15 beat=.8 | memory 3.gain=9 | scatter | Overtones tapped on a skin by a card, a few to a key | plucked
Glass rods                | Wire glass | tuning=Overtones gesture=One_turn spin=30 edge=0.06 release=5 volume=4 hub=Wood gauge=.3 rim=.9 ring=5 damp=.9 point=.3 | brighthall | dusk | A fine nail once across six overtones far from the end, quickly run on wood| bell
Icicles on the eaves      | Wire glass | tuning=Overtones spin=4 melt=40 ring=9 point=.5 gauge=.15 wobble=.5 volume=-1.5 damp=.9 edge=.05 strung=3 | stars | dusk | Nailed overtones at the middle of the wire, dripping unevenly | bell
Cut crystal               | Wire glass | tuning=Overtones gesture=One_turn spin=12 strung=3 gauge=.5 ring=14 release=8 hub=Wood volume=4 width=1 damp=.7 edge=.08 | plate | dusk | Three stiff overtones nailed in a row on wood | bell
Bow across a saw          | Wire glass | tuning=Overtones strung=2 spin=48 melt=5 damp=.5 rise=.8 edge=.2 wobble=.6 ring=8 beat=2.5 volume=0 gauge=0 width=.5 | vibrato | sing | Two nailed partials rubbed into a wavering line | string
Frosted pane, first sun   | Wire glass | tuning=Overtones spin=20 melt=6 damp=.55 edge=.3 rise=4 ring=5 hub=Wood point=.15 lacing=.9 gauge=0 volume=-4.5 | glow | lean | Laced overtones brushed by a nail on wood, slow to warm | pad
Basement transformer      | Overtone ladder | width=0.35 spin=30 melt=4 hub=Skin ring=20 edge=.95 rim=.7 rise=2 gear=0 coast=8 release=5 volume=-7.5 gauge=.22 point=.26 | floor | under | Overtones held under a skin, a hum with a low body | drone
Gravity feed              | Overtone ladder | rise=3 rim=.6 coast=10 volume=-2 strung=5 hub=Skin gear=3 spin=4 melt=2 wobble=1 gauge=.35 edge=.8 ring=20 damp=.2 width=1 point=.12 | lowvault | fifth | Five overtones over a skin on a crooked wheel, the upper keys turning faster| drone
Substation, midnight      | Overtone ladder | spin=55 melt=6 strung=6 rise=4 damp=.4 edge=.5 ring=6 beat=.1 width=1 coast=12 volume=-5 rim=0 gauge=.06 point=.3 | overtone 1.root=9 | under | Six exact overtones rubbed on steel, straight from the wire | drone
Dynamo in the valley      | Overtone ladder | spin=20 melt=14 hub=Steel strung=3 rise=8 ring=7 damp=.5 gauge=.3 lacing=1 edge=.3 volume=1.5 point=.15 | generations | fifth | Three stiff laced overtones that gather for eight seconds | drone
Tar and telegraph         | Overtone ladder | plucker=Nail damp=.6 rise=2 coast=9 release=8 volume=2.5 hub=Skin rim=.8 spin=14 melt=3 gauge=.4 point=.3 beat=3 ring=20 edge=.4 strung=4 width=.9 | reel | under | Four stiff overtones rubbed by a nail over a skin, low, grainy and beating| drone
Clothes line, five pegs   | Strummed fan | plucker=Feather spin=18 ring=5 hub=Wood edge=.45 damp=.2 strung=5 rim=.4 release=3 gauge=.26 beat=1.8 | room 1.mix=0.14 | strum | Five wires of fifths swept once on wood by a feather | string
Hand over hand            | Strummed fan | plucker=Feather spin=9 ring=12 edge=.6 lacing=.6 release=8 point=.1 damp=.3 gear=3 gauge=0 width=.9 beat=.8 | hall 1.mix=0.24 | strum | A fan of laced steel swept slowly, the upper keys much faster | string
Nettle and nail           | Strummed fan | edge=.1 spin=30 gauge=.3 ring=4 hub=Wood damp=.3 release=1.5 point=.07 volume=-4.5 rim=.1 width=.35 | spring | call | Stiff fifths nailed near the end, almost straight from the wire, short and wiry
Loft full of kites        | Strummed fan | plucker=Air spin=8 ring=14 edge=.3 hub=Wood rim=.4 strung=4 release=4 volume=1.5 gauge=.24 width=.45 beat=1.3 | cloud | strum | Four breaths of a fan to each key, one after the other | wind
Downpipes at midnight     | Strummed fan | gauge=.7 plucker=Feather spin=5 rise=.02 ring=10 edge=.5 damp=.35 release=10 width=1 volume=1 beat=.1 | hollowpipe | turn | Heavy fifths on steel dropped slowly, one to a pipe | bell
Overtones in mittens      | Overtone ladder | gesture=One_turn spin=45 hub=Skin ring=20 edge=.9 rim=.6 release=1 damp=.2 volume=-4 gauge=.2 width=.35 point=.12 | cloth | walk | Six overtones at once on a skin, dull and short
Soft shoe                 | Overtone ladder | gesture=One_turn spin=10 hub=Wood ring=.8 edge=.4 damp=.4 strung=4 rim=.9 release=.4 lacing=0 volume=-1.5 gauge=.24 width=1 point=.3 | slap | ostinato | Four muted overtones on wood, stepped quickly and stopped
Moss on the steps         | Overtone ladder | spin=8 melt=40 hub=Wood ring=.5 edge=.5 damp=.6 rim=.4 coast=1 release=.6 wobble=.4 point=.3 volume=-0.5 gauge=.05 width=.5 | sift | gears | Short dark overtones on wood, eight soft steps a second
Damp felt underfoot       | Overtone ladder | gesture=One_turn spin=26 strung=5 ring=1.5 damp=.75 edge=.35 rim=.3 release=2 gauge=.1 hub=Steel volume=-1 width=.9 | water | turn | Five overtones on steel with their tops taken off early
Inside the metronome      | Overtone ladder | gesture=Rocked spin=8 melt=40 ring=.7 hub=Wood damp=.3 edge=.6 rim=.6 coast=1 strung=3 gear=1 volume=-2 point=.26 | tin | cogs | Three dry overtones rocked to and fro, all keys together
`,
    },
    {
      id: 'card-keys',
      name: 'Card keys',
      category: 'keys',
      rows: `
Paper upright             | Card in the wheel | width=0.15 gesture=One_turn strung=1 spin=40 hub=Wood ring=16 edge=.35 point=.14 rim=.5 gear=0 release=.5 volume=2.5 gauge=0 | held 2.gain=13 | walk | One wire a key flicked by a card: a small plain piano of paper
Parlour, lid down         | Card in the wheel | gesture=One_turn tuning=Octaves strung=2 spin=60 ring=20 edge=.2 damp=.4 release=.8 wobble=0 gear=0 volume=3 gauge=.24 width=.6 beat=1.3 | deck | walk | Two octave wires a key flicked by a soft card
Schoolroom keys           | Card in the wheel | gesture=One_turn tuning=Unison strung=3 spin=55 ring=18 beat=2.2 edge=.5 rim=.8 release=.4 gear=0 volume=-0.5 point=.34 | slaproom | call | Three wires to a key, a little out of tune, slapped together on wood
Cardboard clavier         | Card in the wheel | damp=0.35 gesture=One_turn tuning=Octaves strung=4 spin=60 ring=10 edge=0.4 point=0.1 rim=.2 release=.3 gear=0 volume=-3.5 gauge=.26 beat=1.8 | centre 3.gain=9 | ostinato | Four octave wires struck by a card near the end, short and papery
Keys under newspaper      | Card in the wheel | gesture=One_turn tuning=Unison strung=2 spin=30 ring=20 gauge=.3 edge=.15 point=.5 damp=.5 release=2 gear=0 volume=2 beat=.8 | cassette | two | Two stiff wires tapped at the middle by a blunt card, hollow
Postcard from the pier    | Card in the wheel | gesture=One_turn tuning=Octaves strung=3 spin=14 ring=20 hub=Steel edge=.25 damp=.35 release=3 gear=0 volume=-2.5 gauge=.34 point=.3 beat=1.3 | tape3 | call | Three octaves on steel slapped one after another
Echo in a stairwell       | Card in the wheel | gesture=One_turn tuning=Fan strung=2 spin=60 ring=20 hub=Steel edge=.35 rim=.3 release=2 gear=0 volume=5.5 width=.35 point=.15 beat=.1 | clean | two | A fifth to every key, flicked once on steel
Ticket punch              | Card in the wheel | gesture=One_turn tuning=Octaves strung=5 spin=24 ring=3 edge=.5 rim=.9 release=.3 hub=Wood gear=0 damp=.4 volume=-3.5 gauge=.26 width=.9 beat=1.8 | dotted 3.gain=10 | ostinato | Five dry clicks to a key over the octaves
Room above the cinema     | Card in the wheel | gesture=One_turn tuning=Fan strung=4 spin=34 ring=15 edge=.3 point=.35 hub=Wood release=4 gear=0 gauge=.2 volume=5 width=.45 beat=.8 | record | two | Four hollow fan wires flicked quickly on wood
Cloakroom numbers         | Card in the wheel | gesture=One_turn tuning=Unison strung=6 spin=9 ring=12 edge=.4 hub=Steel lacing=.8 release=5 gear=0 beat=1.5 volume=1.5 gauge=.2 width=.6 point=.12 | hop | turn | Six like wires on steel slapped in a row and tied together
Wheel of playing cards    | Card in the wheel | spin=18 tuning=Unison strung=2 hub=Wood ring=12 edge=.5 wobble=.2 gear=0 coast=1 volume=-8.5 gauge=.22 width=.5 beat=1 | walls | gears | Two wires slapped eighteen times a second while a key is held | texture
Flag in a stiff wind      | Card in the wheel | spin=24 tuning=Fan hub=Steel ring=5 edge=.3 wobble=.9 gear=0 rim=.3 coast=4 volume=5 point=.34 | wide | cogs | A fan on steel flapping unevenly and fast | texture
Press room, night shift   | Card in the wheel | width=0.45 spin=8 tuning=Octaves hub=Steel ring=20 edge=.4 wobble=0 gear=1 rim=.8 damp=.3 release=2 volume=-3 gauge=.28 point=.14 beat=.8 | tapeloop | gears | Octaves on steel slapped eight to the second, all keys in step | texture
Sewing machine, upstairs  | Card in the wheel | spin=12 tuning=Octaves strung=2 hub=Wood ring=4 edge=.6 wobble=.1 gear=3 point=.08 rim=.9 gauge=.2 | nextdoor | ostinato | Two octaves stitched by a card, the higher keys running faster
Pigeons startled          | Card in the wheel | spin=30 tuning=Fan strung=5 hub=Wood rise=.05 ring=10 edge=.35 coast=6 release=3 gear=0 damp=.3 volume=-5 gauge=.05 width=.9 point=.23 beat=1.3 | slap | strum | Five fan wires flapped fast on wood, running on after the key | texture
Squeezed reeds            | Card in the wheel | spin=44 melt=5 tuning=Unison strung=3 hub=Wood ring=12 edge=.5 rise=.1 beat=2.5 gear=0 release=.8 gauge=0 point=.15 | hint | hymn | Three wires buzzed by a card into a reedy, beating tone | organ
Concertina on the ferry   | Card in the wheel | width=0.2 spin=40 melt=6 tuning=Octaves strung=2 hub=Wood ring=20 edge=.65 rise=.15 rim=.3 gear=0 point=.08 volume=-8.5 gauge=.24 beat=.8 | deck | hymn | Two octave wires buzzed near the end by a keen card | organ
Comb behind the paper     | Card in the wheel | spin=56 melt=9 tuning=Fan strung=2 hub=Wood ring=8 edge=.3 rise=.4 wobble=.5 gear=0 release=1 volume=4.5 width=.4 point=.26 | bridge | sing | A fifth hummed through a card, papery and unsteady | voice
Harmonium, loose pedal    | Card in the wheel | width=0.5 spin=26 melt=5 tuning=Octaves strung=4 hub=Skin ring=20 edge=.8 rise=.6 rim=.6 gear=0 wobble=.8 gauge=.2 point=.12 beat=1.3 | chorus | ferry | Four octaves buzzed over a skin, swelling with a crooked wheel | organ
Kazoo chorale             | Card in the wheel | width=0.1 spin=60 melt=8 tuning=Unison strung=1 hub=Steel ring=20 edge=.2 rise=.8 rim=.6 gear=0 damp=.4 point=.12 volume=2 gauge=.22 | chamber | hymn | One wire to a key buzzed smoothly on steel | voice
Baking trays stacked      | Card in the wheel | gesture=One_turn tuning=Octaves hub=Steel spin=44 ring=20 rim=.9 release=5 gear=0 volume=1 width=.4 point=.34 beat=.8 damp=.55 edge=.1 gauge=.4 | chamber 2.gain=8 | dusk | Stiff octaves on steel slapped all but together, clattering | bell
Letterbox in the rain     | Card in the wheel | gesture=One_turn tuning=Overtones hub=Steel strung=4 spin=28 ring=20 edge=.15 damp=.5 release=4 gear=0 rim=.15 volume=3 gauge=.2 width=.9 point=.14 | rain | scatter | Four soft overtones on steel slapped in quick order
Filing cabinet            | Card in the wheel | gesture=One_turn tuning=Fan hub=Steel strung=3 spin=12 ring=16 edge=.5 gauge=.35 rim=1 release=1 gear=0 volume=2.5 point=.27 beat=1.3 | gated | call | Three stiff fifths slapped one by one inside a steel rim
Zip fastener              | Card in the wheel | gesture=One_turn tuning=Octaves hub=Steel spin=60 rise=.5 ring=9 point=.05 release=2 gear=0 volume=3.5 width=.6 beat=.1 damp=.65 edge=.12 | reverse 3.gain=9 | call | Six thin octaves on steel run together faster and faster
Biscuit tin lid           | Card in the wheel | gesture=One_turn tuning=Unison hub=Steel strung=1 spin=20 ring=20 gauge=.8 edge=.25 rim=.7 release=6 gear=0 volume=4.5 width=.25 | tin 2.gain=8 | turn | One heavy wire on steel tapped with a card, a dull metal note | bell
Shoebox kalimba           | Card in the wheel | point=0.35 gesture=One_turn tuning=Unison hub=Skin strung=1 spin=40 ring=20 edge=.6 rim=.3 release=1 gear=0 gauge=0.4 volume=0.5 width=.5 | plank 2.gain=17 | turn | One wire over a skin, a round thumbed note | plucked
Drumhead and ruler        | Card in the wheel | gesture=One_turn tuning=Octaves hub=Skin strung=3 spin=50 ring=20 edge=.9 rim=.5 release=.5 gear=0 volume=-3 gauge=.34 width=.6 point=.26 beat=1.3 | slaproom | ostinato | Three octaves over a skin slapped by a keen card, short
Hat on a snare            | Card in the wheel | spin=16 tuning=Fan hub=Skin strung=4 ring=20 edge=.85 rim=.25 coast=1.5 gear=1 wobble=.3 release=1 gauge=.4 width=.3 point=.12 beat=.1 | iron | gears | A fan over a skin slapped sixteen times a second, all keys together | drum
Mallet made of cork       | Card in the wheel | gesture=One_turn tuning=Overtones hub=Skin strung=2 spin=60 ring=20 edge=.5 rim=.4 release=2 gear=0 point=.4 volume=-1.5 gauge=.26 width=.35 beat=1.8 | dark 3.gain=8 | two | Two partials over a skin, knocked softly and hollow
Boots on a hollow stage   | Card in the wheel | width=0.3 gesture=Thrown tuning=Octaves hub=Skin strung=2 spin=7 coast=5 ring=20 edge=.75 rim=.7 release=1.5 gear=0 volume=-3.5 gauge=.22 point=.15 beat=.8 | cave 3.gain=7 | floor | Two octave wires stepped on a skin, each key slowing as it is held | bass
Late applause             | Card in the wheel | damp=0.4 spin=2.5 tuning=Octaves hub=Steel strung=3 ring=20 edge=0.3 wobble=.5 gear=0 coast=2 release=2 volume=0 gauge=.05 point=.14 beat=1.3 | cave 3.gain=8 | gears | Slaps over three octaves, two or three to the second, far apart | texture
Turning a calendar        | Card in the wheel | spin=1.5 tuning=Fan hub=Wood ring=20 edge=.3 wobble=.1 gear=0 release=4 damp=.4 rim=.3 volume=5.5 gauge=.22 width=.9 point=.27 beat=.1 | memory | cogs | Single soft slaps over a fan, about three every two seconds | texture
Flip clock                | Card in the wheel | spin=1 tuning=Octaves hub=Steel strung=4 ring=20 edge=.5 gear=2 wobble=0 release=3 rim=.5 volume=0.5 width=.5 point=.23 beat=1.8 | stone | gears | One slap a second over steel octaves, higher keys a little oftener | texture
Library after hours       | Card in the wheel | spin=4 tuning=Overtones hub=Wood strung=3 ring=20 edge=.2 wobble=.7 gear=0 damp=.6 release=3 volume=-0.5 gauge=.28 width=1 beat=.8 | wall | cogs | Three dark overtones tapped now and then, about four a second | texture
Snow off the awning       | Card in the wheel | spin=3 tuning=Unison hub=Skin strung=2 ring=20 edge=.6 rim=.6 gear=0 wobble=.8 release=2 beat=2 volume=0 gauge=.24 width=.6 point=.34 | farshore | gears | Uneven soft thuds of two wires over a skin | texture
Gearbox of paper          | Card in the wheel | spin=5 gear=3 tuning=Octaves hub=Wood strung=2 ring=12 edge=.5 wobble=0 coast=.5 release=.5 volume=-5.5 gauge=.34 width=1 point=.26 beat=.1 | forward | gears | Keys slapped one, two, three and four to the beat on wood | plucked
Passport hall             | Card in the wheel | spin=6 gear=2 tuning=Unison hub=Wood strung=1 ring=18 edge=.3 wobble=0 release=.8 point=.3 rim=.4 volume=0 width=.5 | around | gears | Single hollow wires stamped three to four to five to six | plucked
Turnstiles                | Card in the wheel | spin=9 gear=4 tuning=Fan hub=Steel strung=3 ring=16 edge=.45 wobble=.2 release=1 rim=.5 damp=.4 volume=4.5 gauge=.2 width=.9 point=.3 beat=.8 | pulses | cogs | A fan on steel, the low key quickest and each higher key slower | plucked
Counting room             | Card in the wheel | spin=3 gear=3 tuning=Octaves hub=Steel strung=6 ring=20 edge=.2 wobble=0 coast=4 release=6 damp=.5 volume=3.5 gauge=.24 point=.15 | loops | cogs | Soft octaves on steel counted in whole numbers against each other | plucked
Mail van, three stops     | Card in the wheel | spin=14 gear=2 tuning=Overtones hub=Wood strung=2 ring=8 edge=.6 wobble=.4 coast=3 release=1 volume=-7.5 gauge=.05 width=.35 beat=1.3 | sampler | ostinato | Two partials rattled quickly on wood, keys in three to four to five | plucked
Cradle of cards           | Card in the wheel | gesture=Rocked spin=10 tuning=Octaves hub=Wood ring=14 edge=.3 strung=4 wobble=.1 gear=0 coast=5 volume=-1 point=.27 beat=1.8 | walls | quartal | Four octaves slapped to and fro on wood | plucked
Page turned both ways     | Card in the wheel | gesture=Rocked spin=5 tuning=Fan hub=Steel ring=20 edge=0.45 damp=.5 gear=1 release=4 rim=0.6 volume=6 gauge=.28 point=.23 beat=.8 | reverse | gears | A fan on steel slapped one way and back again | texture
Doors that flap twice     | Card in the wheel | gesture=Rocked spin=22 tuning=Unison hub=Wood strung=2 ring=6 edge=.6 coast=8 gear=0 beat=3 release=2 volume=-8 gauge=.24 width=.35 | spring | strum | Two beating wires flapped in and out, swinging on after the key | plucked
Moth wings on steel       | Card in the wheel | gesture=Rocked spin=40 melt=8 tuning=Octaves hub=Steel ring=20 edge=0.35 damp=.45 gear=0 rise=.5 release=3 volume=6 gauge=.24 point=.34 beat=1.3 | flock | lean | Octaves on steel buzzed softly to each side and back | pad
Rocking stamp pad         | Card in the wheel | gesture=Rocked spin=8 tuning=Overtones hub=Skin strung=3 ring=20 edge=.8 gear=1 coast=2 rim=.4 volume=-10.5 gauge=.34 point=.14 beat=.1 | slaproom 2.gain=12 | ostinato | Three overtones rocked over a skin, round and dull | plucked
Woodblock rack            | Card in the wheel | gesture=One_turn tuning=Unison hub=Wood strung=1 gauge=.9 spin=40 ring=20 edge=.4 release=1 gear=0 rim=.9 volume=2.5 width=.4 point=.12 | booth 2.gain=8 | turn | A bar of a wire knocked by a card on wood | bell
Marimba of slats          | Card in the wheel | gesture=One_turn tuning=Octaves hub=Wood strung=2 gauge=.6 spin=60 ring=20 edge=.2 release=3 gear=0 damp=.5 rim=.6 volume=5 width=.9 point=.3 | tremolo 3.gain=8 | two | Two heavy octave wires knocked softly, warm and short
Crate of milk bottles     | Card in the wheel | gesture=Thrown gauge=.75 tuning=Fan hub=Steel strung=4 spin=10 coast=3 ring=20 edge=0.6 release=3 gear=0 volume=6 width=.9 point=.15 beat=1.3 | spring | scatter | Four heavy fifths on steel knocked round, slowing in three seconds | bell
Beads on rods             | Card in the wheel | gesture=One_turn gauge=.5 tuning=Overtones hub=Wood spin=16 ring=14 release=.6 gear=0 rim=.3 lacing=.5 volume=-1 width=.9 beat=.1 damp=.45 edge=.12 | stars | peal | Stiff overtones clicked along in a row on wood | plucked
Bars on the workbench | Card in the wheel | gesture=One_turn gauge=1 tuning=Fan hub=Steel strung=5 spin=20 ring=20 edge=0.5 release=8 gear=0 damp=.4 beat=3 volume=6 point=.26 | chamber | call | Five bar-like fifths on steel beating as they ring | bell
`,
    },
    {
      id: 'skin-basses',
      name: 'Skin basses',
      category: 'bass',
      rows: `
Cellar floor              | Skin bass | spin=12 melt=2.5 damp=.4 edge=.4 point=.2 rim=.6 ring=14 width=0 release=.6 volume=-4 gauge=.04 | warm | floor | One wire on a skin held by a steady rub, round and low
Keel under moss           | Skin bass | width=0 spin=30 melt=4 strung=2 beat=.8 edge=.9 rim=.3 ring=18 rise=.4 release=1.5 volume=-22.5 gauge=.28 | darkhall 1.mix=0.16 | deep | Two like wires rubbed on a skin, beating slowly in the lows
Warm engine, night bus    | Skin bass | spin=50 melt=10 edge=.7 point=.4 rim=.8 lacing=.2 rise=.1 wobble=.5 release=.2 ring=20 volume=-3 | triode | floor | A single wire hummed at its middle over a skin, not quite steady
Foundation stones         | Skin bass | spin=20 melt=3 strung=3 tuning=Octaves edge=.5 rim=.9 ring=20 rise=1.2 release=2.5 coast=1 gauge=.38 | centre | deep | Three octaves under a skin, slow to come and mostly boom
Undertow at the pier      | Skin bass | spin=8 melt=2 strung=3 edge=.65 rise=.6 wobble=1 beat=1.8 ring=10 release=1 rim=.4 volume=-20 gauge=.22 | currents | deep | Three like wires on a crooked wheel, swelling once each turn
Thumb on the drum         | Skin bass | width=0.05 gesture=One_turn strung=1 spin=40 ring=12 edge=.7 point=.2 rim=.5 release=.3 lacing=0 volume=-7.5 gauge=.28 | centre | pulse | One wire over a skin plucked by a feather and stopped
Sandbag line              | Skin bass | gesture=One_turn strung=2 spin=60 ring=6 edge=.85 point=.1 rim=.2 release=.15 beat=1 | iron | pulse | Two like wires plucked at once over a skin, very short
Old dancehall floor       | Skin bass | gesture=One_turn strung=2 tuning=Octaves spin=24 ring=20 edge=.6 rim=.7 release=.8 point=.3 volume=-5.5 gauge=.38 | valve | floor | A wire and its octave, one just after the other on a skin
Barrel stave              | Skin bass | gesture=One_turn strung=1 gauge=.45 spin=30 ring=20 edge=.95 point=.07 rim=.35 release=.5 | plank | floor | A stiff wire plucked keenly near the end, over a skin
Door knocker, two taps    | Skin bass | gesture=One_turn strung=2 tuning=Unison spin=5 ring=16 edge=.8 rim=.6 release=1 gauge=.2 volume=-20.5 | slaproom | pulse | Two plucks in quick succession at every key
Slow pulse of the pump    | Skin bass | melt=40 ring=8 rim=.5 release=.4 coast=.3 volume=-19.5 tuning=Octaves strung=2 gauge=.3 spin=5 edge=.8 | floor | deep | A wire and its octave plucked in turn over a skin, five to the second
Rowing in time            | Skin bass | spin=2 melt=40 strung=2 tuning=Fan ring=20 edge=.75 rim=.35 release=.8 wobble=.3 gear=1 volume=-6 gauge=.38 | mike | deep | A wire and its fifth plucked in turn, two to the second
Horses on packed earth    | Skin bass | spin=10 melt=40 strung=3 tuning=Octaves ring=5 edge=.8 rim=.6 wobble=.8 coast=.8 point=.15 volume=-7.5 gauge=.22 | booth | deep | Short octave plucks at a canter, uneven over a skin
Paddle in the shallows | Skin bass | spin=7 melt=20 strung=4 tuning=Fan ring=14 edge=.6 rim=.4 rise=1 coast=2 release=1.5 volume=-10.5 gauge=.04 | dotted | deep | Four fan wires turning up to speed over a skin
Heartbeat through boards  | Skin bass | spin=3 melt=40 strung=1 ring=20 edge=.5 rim=.9 wobble=.2 gauge=.15 release=1 coast=1.5 | cloth | deep | Soft single plucks, three a second, mostly skin
Bass behind the coats | Plain plucked keys | strung=1 spin=40 release=.25 width=.1 volume=1 point=.5 gauge=.35 damp=.6 edge=.8 ring=14 rim=.4 | room | floor | One stiff wire plucked at its middle on wood and stopped with the key
Blanket chest             | Plain plucked keys | beat=.4 ring=3 edge=.35 release=.2 volume=-8.5 tuning=Octaves strung=4 spin=60 damp=.5 rim=1 gauge=.2 point=.14 | warm | pulse | Four octaves struck at once on wood, one of them under the key, short
Boat shed bass            | Plain plucked keys | strung=2 tuning=Octaves ring=14 edge=.6 rim=.4 release=1.2 point=.1 spin=20 volume=-12.5 gauge=.04 | slap | floor | A wire and its octave on wood, ringing on a little
Smooth as a banister      | Plain plucked keys | gesture=Driven strung=1 spin=26 melt=4 ring=5 rise=.15 damp=.4 rim=.7 release=.3 coast=.3 volume=5 hub=Steel point=.32 gauge=.02 edge=.6 | vibrato | floor | A single fine wire on steel, plucked and then held by a rub
Chair leg on stone        | Plain plucked keys | strung=3 tuning=Fan ring=2 edge=.8 gauge=.3 point=.06 rim=.9 release=.4 damp=.2 volume=-18 | walls | pulse | Three stiff fan wires on wood, knocked and gone
Long iron string          | Plain plucked keys | hub=Steel strung=1 ring=20 damp=.3 rim=.4 release=4 volume=-12 gauge=.2 point=.08 edge=.7 | spring | deep | One low wire on steel plucked near the end and left to ring
Pier cable                | Plain plucked keys | hub=Steel strung=3 ring=16 beat=1.8 edge=.55 rim=.7 release=2.5 damp=.15 gauge=.25 spin=14 volume=-5.5 | valley | deep | Three stiff wires on steel struck in a row, beating as they ring
Freight on the bridge     | Plain plucked keys | hub=Steel gesture=Driven strung=2 tuning=Octaves spin=34 melt=6 rise=.8 edge=.6 coast=2 release=1.5 rim=.3 volume=-7.5 gauge=.28 | iron | floor | Two octave wires on steel, rubbed into a hard growl
Copper in the wall        | Plain plucked keys | hub=Steel strung=2 ring=8 edge=.8 point=.06 damp=.1 rim=.2 release=.2 beat=.3 volume=-18.5 | forward | pulse | Two like wires on steel plucked near the end, bright and stopped
Ground floor, old tower   | Plain plucked keys | hub=Steel strung=2 gauge=.7 ring=20 edge=.35 damp=.4 rim=.6 release=6 point=.3 volume=0 | lowvault | deep | Two heavy wires on steel, a low bar-like toll
Dog under the lorry       | Skin bass | hub=Wood tuning=Octaves strung=3 spin=40 melt=5 edge=.7 point=.08 rise=.2 rim=.3 ring=5 release=.5 gauge=.04 | fuzz | floor | Three octave wires rubbed near the end on wood
Tugboat idling            | Skin bass | hub=Wood strung=2 spin=26 melt=18 edge=.6 beat=3 rim=.8 ring=2 release=.4 point=.12 gauge=.28 | combo | deep | Two wires on wood, half plucked and half rubbed, beating hard
Bear asleep               | Skin bass | hub=Skin tuning=Octaves strung=4 spin=60 melt=8 edge=.95 wobble=.6 rise=.8 ring=20 release=1.2 rim=.2 volume=-18 | haze | deep | Four octaves rubbed keenly over a skin, with a slow unevenness
Oil drum, rolled          | Skin bass | hub=Steel gauge=.4 strung=3 spin=18 melt=4 edge=.4 rim=.9 rise=.3 ring=9 damp=.4 beat=1.4 release=1 volume=-6.5 | fold | floor | Three stiff wires turned smoothly inside a steel rim
Tractor two fields off    | Skin bass | hub=Wood tuning=Fan strung=2 spin=32 melt=26 edge=.5 rim=.7 ring=1.2 wobble=.4 release=.8 volume=-9 gauge=.22 | nextdoor | deep | A fifth stuttering on wood, too fast to count
Plinth and lintel         | Skin bass | tuning=Fan strung=2 spin=24 melt=4 edge=.8 rim=.4 ring=20 rise=.5 release=1.5 coast=1 gauge=.28 | hall 1.mix=0.15 | deep | A wire and its fifth rubbed together over a skin
Cloister footing          | Skin bass | hub=Wood tuning=Fan strung=3 spin=16 melt=3 edge=.35 damp=.5 rise=1.5 ring=6 rim=.6 release=3 coast=3 volume=-9 | monks | deep | Three fan wires turned smoothly on wood, slow and open
Bass of the aqueduct      | Skin bass | hub=Steel tuning=Fan strung=2 gesture=One_turn spin=8 edge=.35 ring=18 damp=.4 rim=.5 release=3 volume=-2.5 gauge=.38 | hollowpipe | floor | Root and fifth plucked one after the other on steel
Barge horn far off        | Skin bass | hub=Wood strung=3 tuning=Overtones spin=44 melt=5 edge=.3 damp=0.8 rise=.6 ring=8 rim=.9 release=1 coast=1 volume=-6.5 gauge=.22 | farshore | deep | Three overtones rubbed dark on wood like a low horn
Two stones in a sack      | Skin bass | tuning=Fan strung=4 gesture=One_turn spin=16 edge=.75 ring=10 rim=.4 wobble=.6 release=.6 gauge=.25 | sift | pulse | Four stiff fan wires knocked quickly over a skin
Slap of a wet hand        | Card in the wheel | gesture=One_turn hub=Wood tuning=Unison strung=1 spin=40 ring=20 edge=.6 point=.07 rim=.6 release=.25 gear=0 volume=2 width=.3 | held 2.gain=18 | pulse | A card slapped on one wire, dry and short
Hatch cover               | Card in the wheel | gesture=One_turn hub=Skin ring=20 edge=.75 rim=.8 release=.6 gear=0 volume=-3.5 tuning=Fan strung=4 spin=22 gauge=.4 width=.15 point=.12 beat=1.8 | slap | pulse | Four stiff fan wires over a skin run through by a card, all thud
Ruler off the edge | Card in the wheel | spin=20 melt=8 hub=Wood tuning=Unison strung=2 ring=20 edge=.45 coast=.5 gear=0 release=.4 beat=.6 rise=.05 gauge=.22 width=.35 point=.3 | wall | floor | Two wires buzzed and slapped by a card at once
Conveyor, level two       | Card in the wheel | spin=6 hub=Skin tuning=Fan strung=2 ring=20 edge=.9 gear=1 coast=.4 wobble=0 rim=.4 release=.5 volume=-2.5 gauge=.04 width=.25 point=.15 | tapeloop | deep | A fifth slapped over a skin, six even beats a second
Sacks dropped in order    | Card in the wheel | gesture=One_turn hub=Skin tuning=Overtones strung=3 spin=9 ring=20 edge=.7 gear=0 rim=.5 release=1.5 damp=.4 volume=-4.5 gauge=.28 width=.1 beat=1.3 | cave 3.gain=8 | floor | Three partials over a skin, dropped one after another
Breath through a culvert  | Air drone | hub=Skin strung=2 tuning=Unison spin=26 melt=5 rise=.5 edge=.7 ring=20 rim=.5 release=1 coast=.8 gauge=.38 width=.35 point=.27 volume=-8 | hollowpipe | deep | Air on two like wires over a skin, low and windy
Cave mouth, cold          | Air drone | hub=Wood tuning=Unison melt=6 rise=1.5 ring=10 rim=.8 release=2 volume=-3 plucker=Air strung=1 spin=40 edge=.5 point=.5 damp=.5 gauge=.3 width=.25 | cave | deep | Breath on a single low wire, hollow on wood
Rust on the hinge         | Skin bass | plucker=Nail hub=Wood strung=2 spin=30 melt=6 edge=.1 rise=.3 ring=6 damp=.4 rim=.5 release=.5 beat=1.2 volume=-1.5 gauge=.04 | tape3 | floor | Two wires rubbed by a nail on wood, grainy and low
Rake across a drum        | Skin bass | plucker=Nail hub=Skin tuning=Octaves strung=4 gesture=One_turn spin=20 edge=.5 ring=20 rim=.3 release=.7 volume=-8 gauge=.28 | room 1.mix=0.12 | pulse | A nail drawn across four octaves over a skin
Nail in the sole          | Skin bass | plucker=Nail hub=Steel strung=1 gesture=One_turn edge=.15 ring=8 damp=.4 rim=.3 release=.4 point=.2 gauge=.15 volume=4 | bridge | pulse | One wire on steel picked by a blunt nail and stopped
Rolling stock             | Skin bass | gesture=Thrown strung=2 tuning=Octaves spin=14 melt=6 coast=5 edge=.7 ring=16 rim=.5 release=1.5 gauge=.22 | darkhall | deep | Two octaves thrown over a skin, humming and then counted out
Plumb bob in the cellar   | Skin bass | gesture=Rocked strung=2 tuning=Fan spin=6 melt=20 coast=4 edge=.6 ring=20 rim=.4 release=2 rise=.3 volume=-11 gauge=.04 | loops | deep | Root and fifth rocked slowly over a skin
Winch by the quay         | Skin bass | gear=4 strung=1 spin=6 melt=30 ring=20 edge=.8 rim=.6 hub=Wood damp=.4 coast=1 release=1 point=.1 volume=-19 gauge=.05 | clean | gears | One wire a key on wood, the lowest key plucked most often | plucked
Gong under the stairs     | Skin bass | hub=Steel gauge=.9 strung=3 tuning=Octaves gesture=One_turn spin=40 edge=.3 ring=20 damp=.4 rim=.8 release=8 volume=-7 | cathedral 1.mix=0.22 | deep | Three heavy octaves on steel, a low clang left to ring
Depth marker | Skin bass | hub=Wood gauge=.6 strung=2 spin=1.5 melt=40 edge=.5 ring=9 damp=.3 rim=.5 release=3 coast=8 wobble=.4 | generations | deep | Two bar-like wires on wood plucked slowly, three in two seconds
`,
    },
    {
      id: 'nail-bells',
      name: 'Nail bells',
      category: 'bell',
      rows: `
Six small bells in a row  | Nail bells | spin=8 gauge=.6 ring=12 rim=.4 release=8 width=1 volume=-0.5 point=.23 damp=.8 edge=.08 | hall | dusk | Stiff octaves on steel nailed one after another, from side to side
Bell tent                 | Nail bells | strung=3 spin=40 gauge=.85 ring=20 rim=.8 point=.3 volume=0 width=.55 damp=.8 edge=.06 | cathedral 1.mix=0.22 | dusk | Three heavy octaves struck together and held in a steel rim
Tinsel on a pin           | Nail bells | strung=2 gauge=.4 spin=18 ring=8 rim=.15 release=3 beat=1.5 width=.3 volume=-0.5 point=.34 damp=.7 edge=.05 | tin | dusk | Two thin octave wires nailed on steel, beating quickly
Harness in the snow       | Nail bells | strung=5 spin=32 gauge=.7 ring=3 wobble=.9 release=2 volume=-6 width=.4 damp=.8 edge=.06 point=.12 | walls | ostinato | Five short jingling octaves nailed near the end, unevenly
Ring the kitchen          | Nail bells | strung=4 spin=12 gauge=0.7 edge=0.12 ring=9 rim=1 release=2 lacing=.7 volume=-1 width=1 damp=.85 point=.34 | room | ostinato | Four bar-like octaves with their tops damped, all through the rim
Music in a drawer         | Nail bells | gauge=.45 rim=.3 release=2 point=.14 volume=-6.5 width=.25 hub=Skin tuning=Unison strung=3 spin=12 beat=2.2 ring=20 damp=.3 edge=.3 | booth | two | Three stiff like wires over a skin picked in a row, beating and light| plucked
Globe of paper snow | Nail bells | tuning=Unison strung=2 gauge=.55 beat=2.5 edge=.12 damp=.5 ring=9 rim=.2 release=5 point=.4 volume=0.5 | glimmer | chimes | Two like wires picked softly at their middle, beating
Key on a glass shelf      | Nail bells | tuning=Unison strung=1 ring=14 rim=.5 release=7 width=.2 volume=6 point=.3 damp=.75 gauge=.5 edge=.06 | plate | dusk | One stiff wire picked by a blunt nail far from its end, small and long
Nursery upright | Nail bells | tuning=Unison strung=3 gauge=.35 spin=60 hub=Wood edge=.3 ring=5 rim=.7 release=.5 beat=.9 volume=-3 width=.45 point=.26 | sampler | walk | Three stiff wires to a key picked together on wood and damped | keys
Lantern fish              | Nail bells | tuning=Unison strung=2 gauge=.75 spin=3 edge=.15 ring=16 damp=.6 rim=.3 release=9 lacing=.9 volume=2 width=.55 point=.12 | water | scatter | Two thick laced wires picked a third of a second apart, dark
Chimes on a still day     | Nail bells | tuning=Fan edge=.2 damp=.4 release=9 wobble=.8 volume=5 hub=Wood strung=5 gauge=.5 ring=6 spin=4 width=1 | breathing | scatter | Stiff fifths on wood touched slowly in an uneven row
Scaffold in the fog       | Nail bells | tuning=Fan strung=5 plucker=Feather gauge=.9 spin=15 edge=.5 damp=.3 ring=18 rim=.4 release=6 volume=-1 width=.9 point=.34 | valley | call | Five tube-like wires of a fan struck by a feather
Carillon, east wind       | Nail bells | tuning=Fan strung=3 gauge=1 spin=24 ring=20 rim=.6 beat=.1 release=7 volume=-2 width=.55 point=.14 damp=.8 edge=.1 | farshore | peal | Three of the heaviest wires in fifths, struck in quick order
Fifth bell of the watch   | Nail bells | tuning=Fan strung=2 release=10 volume=4.5 rim=.5 spin=60 plucker=Card edge=.2 point=.4 damp=.5 gauge=.9 beat=.1 ring=20 | chamber 2.gain=7 | chimes | A bar and the fifth over it struck as one by a soft card
Spanner orchestra         | Nail bells | tuning=Fan strung=4 gauge=.6 spin=20 edge=.1 damp=.2 ring=4 rim=.2 release=1.5 point=.5 volume=6 width=.7 | scooped | ostinato | Four hollow fifths picked blunt on steel, short and clear
Felt hammers, high shelf  | Nail bells | plucker=Feather tuning=Unison strung=1 gauge=.7 spin=40 edge=.4 damp=.3 ring=10 rim=.25 release=4 volume=-6 width=.55 point=.15 | halo | chimes | One thick wire a key struck with something soft, plain and round
Clear soup bowls          | Nail bells | plucker=Feather tuning=Octaves edge=.3 damp=.5 hub=Wood release=5 volume=-3.5 strung=3 gauge=.8 spin=4.5 rim=.95 ring=20 beat=2.6 | bowls | two | Three bars an octave apart struck softly on wood, one after the other
Chandelier, dimmed        | Nail bells | plucker=Feather strung=2 spin=60 edge=.6 damp=.35 ring=16 rim=.6 release=1.5 volume=3.5 tuning=Octaves gauge=.6 beat=3.2 point=.36 width=.35 | shiver | walk | Two stiff octaves to a key struck softly on steel and damped with it| keys
Soft iron lullaby         | Nail bells | plucker=Feather tuning=Octaves strung=3 gauge=.6 spin=5 edge=.35 damp=.6 ring=9 rim=.8 release=6 volume=-5.5 width=1 point=.12 | drift | two | Three round octaves on steel dropped slowly one by one
Belfry after frost | Nail bells | plucker=Feather tuning=Octaves gauge=.8 spin=11 edge=.7 damp=.2 ring=20 rim=.5 release=12 lacing=.8 wobble=.6 volume=-4 width=.9 point=.3 | longplate | peal | Laced bars over four octaves under a keen feather, all left to ring
Waterwheel gong           | Nail bells | gesture=Driven spin=1.5 melt=40 gauge=.7 strung=3 ring=14 release=8 volume=-5 width=.4 point=.34 damp=.75 edge=.08 | memory | lone | Three nailed octaves, three strokes every two seconds while held
Barrier coming down| Nail bells | gesture=Driven spin=4 melt=40 tuning=Unison strung=2 beat=4 rim=1 gear=1 width=1 point=.14 damp=.6 edge=.15 ring=8 gauge=.8 volume=6 | nextdoor | lone | Two bars of one pitch struck in turn, four to the second
Pilgrim road, turning     | Nail bells | gesture=Driven spin=7 melt=30 rise=1.5 coast=8 gauge=.55 strung=5 plucker=Feather edge=.4 ring=8 wobble=.5 release=6 volume=-3.5 width=.9 point=.27 | hall 1.mix=0.28 | lone | Five stiff octaves turned by a feather, slowing on when let go
Ice cream, two roads on | Nail bells | gesture=Driven spin=3 gear=3 strung=2 gauge=.4 edge=.2 ring=4 damp=.4 melt=40 rise=.05 rim=.3 release=2 volume=-2 width=.55 point=.23 | cassette | gears | Pairs of small octaves, each higher key counting faster
Sonar for swans           | Nail bells | width=0.05 gesture=Driven spin=.8 melt=40 tuning=Unison strung=1 gauge=.5 edge=.1 ring=18 damp=.7 release=10 rim=.4 volume=1 | hop | lone | One stiff wire touched less than once a second, dark and long
Wet finger, thick glass   | Nail bells | beat=1 width=0.5 gesture=Driven plucker=Feather spin=40 melt=6 gauge=.5 tuning=Unison strung=3 edge=.3 damp=.5 ring=12 rise=1 release=3 volume=-2.5 | plate 1.mix=0.34 | ferry | Three stiff wires rubbed soft on steel, beating a little | pad
Singing bowls at noon     | Nail bells | gesture=Driven plucker=Feather spin=24 melt=4 gauge=.9 tuning=Octaves strung=2 edge=.5 ring=20 beat=1.5 rise=2 damp=.4 volume=-4 point=.26 | bowls | lean | Two bars an octave apart rubbed on steel, slowly beating | pad
Choir of cymbal edges     | Nail bells | point=0.07 strung=3 gesture=Driven spin=50 melt=8 gauge=.75 tuning=Fan edge=.1 damp=.5 ring=6 rise=0.8 rim=.3 release=5 coast=6 volume=2.5 width=.6 | blur | quartal | Three heavy fifths nailed so fast they only shimmer| pad
Grinding lens             | Nail bells | gesture=Driven spin=30 melt=12 gauge=.65 tuning=Unison strung=4 edge=.2 damp=.3 ring=9 wobble=.8 beat=3 hub=Wood rise=.5 volume=5.5 width=.9 point=.3 | phaser | lean | Four thick wires on wood under a nail, ground round and beating | pad
Halo of a struck rail     | Nail bells | plucker=Feather gesture=Thrown spin=50 melt=7 coast=12 gauge=1 tuning=Unison strung=2 edge=.3 ring=20 damp=.5 release=9 volume=-5 width=.5 point=.15 | rise | two | Two heavy bars rubbed at once and left to slow | texture
Ghost of a glockenspiel   | Nail bells | plucker=Air gauge=.6 strung=3 spin=30 edge=.2 ring=20 rim=.4 release=6 tuning=Octaves volume=-3 point=.14 damp=.65 | cloud | dusk | Breath on three stiff octaves, a bell with its stroke removed
Blown dew                 | Nail bells | plucker=Air gauge=.4 tuning=Overtones strung=4 spin=16 edge=.1 damp=.5 ring=12 release=4 hub=Wood rim=.2 volume=0.5 width=1 point=.27 | airy | peal | Four small breaths up the overtones of each key on wood | wind
Censer                    | Nail bells | plucker=Air gesture=Rocked gauge=.8 spin=8 melt=30 strung=5 edge=.3 ring=20 damp=.5 rim=.7 release=9 coast=10 volume=2.5 point=.23 | choir | lone | Breath over bars swung to and fro on steel | texture
Breath on the ice house   | Nail bells | plucker=Air gesture=Driven gauge=.95 spin=26 melt=6 tuning=Fan strung=4 edge=.5 ring=20 rise=2 rim=.5 damp=.4 release=6 volume=1 width=1 | tunnel | quartal | Air held on four heavy fifths, cold and inharmonic | drone
Opened bottle of stars    | Nail bells | plucker=Air gauge=.5 tuning=Octaves spin=60 edge=.15 damp=.3 ring=14 release=3 point=.4 volume=-3 rim=.02 | glints | chimes | A single quick breath over six octave wires | wind
Rosewood bars             | Nail bells | width=0.3 hub=Wood plucker=Feather tuning=Unison strung=1 gauge=.7 spin=40 edge=.6 ring=6 damp=.3 rim=.6 release=2 volume=-4.5 point=.26 | tremolo | two | One bar a key struck softly on wood, warm and short
Bamboo in the yard        | Nail bells | hub=Wood strung=2 spin=16 edge=.4 ring=1.2 damp=.4 rim=.9 release=.6 point=.35 volume=2.5 tuning=Fan gauge=.65 width=.9 | room 1.mix=0.22 | ostinato | Two thick wires a fifth apart clacked on wood, hollow and quickly gone
Xylophone for moths       | Nail bells | hub=Wood tuning=Octaves strung=3 gauge=.8 spin=30 ring=2 rim=.4 release=1 width=1 volume=0 point=.3 damp=.9 edge=.3 | fog | peal | Three short bars an octave apart nailed on wood, dulled
Balafon by the river      | Nail bells | hub=Wood plucker=Feather tuning=Unison strung=2 gauge=.9 spin=60 edge=.9 ring=9 damp=.2 rim=.7 beat=1.2 release=2 volume=-6 point=.15 | bridge | ostinato | Two bars to a key struck keenly on wood, beating a little| keys
Broom handles             | Nail bells | hub=Wood plucker=Feather tuning=Fan strung=4 gauge=1 spin=12 edge=.7 ring=4 damp=.35 rim=1 release=1 volume=-3.5 width=.4 | slap | call | Four wooden bars in fifths struck in order
Pan in the shade          | Nail bells | hub=Skin plucker=Feather tuning=Octaves strung=3 gauge=.4 spin=60 edge=.95 ring=20 rim=.3 release=2 damp=.1 volume=0 width=.55 point=.27 | chorus | two | Three stiff octaves over a skin struck as one, round and tuned
Tongue drum on the lawn   | Nail bells | hub=Skin plucker=Feather tuning=Unison strung=2 gauge=.6 spin=50 edge=.8 ring=20 rim=.4 release=4 beat=.6 point=.3 damp=.1 volume=-2.5 width=.3 | hall 1.mix=0.18 | turn | Two thick wires over a skin, a soft drum with a note | drum
Kettle in copper          | Nail bells | hub=Skin tuning=Octaves gauge=.8 spin=20 edge=.6 ring=20 rim=.6 release=3 damp=.1 strung=4 volume=3 width=.5 | pot | call | Four nailed octaves over a skin in quick order, dark and round| drum
Water butt notes          | Nail bells | hub=Skin plucker=Feather gesture=Driven tuning=Fan strung=5 gauge=.5 spin=4 melt=40 edge=.9 ring=20 rim=.5 wobble=.7 damp=.1 release=2 volume=-1.5 width=1 point=.34 | hollowpipe | scatter | Five stiff fifths dropped unevenly on a skin | plucked
Bead curtain, struck      | Nail bells | hub=Skin tuning=Overtones spin=40 ring=20 rim=.2 release=1.5 volume=2.5 width=.9 point=.14 damp=.75 edge=.15 gauge=.2 | cascade | turn | Six overtones run quickly over a skin by a nail
Chimes on the iron stair | Nail bells | gesture=Rocked spin=8 melt=40 gauge=.7 edge=.2 damp=.4 ring=9 coast=10 release=7 tuning=Fan rim=.3 volume=0.5 point=.12 | dark | lone | Heavy fifths swung to and fro past a nail
Mobile over the cot       | Nail bells | gesture=Rocked plucker=Feather spin=4 melt=40 gauge=.5 strung=4 edge=.4 damp=.5 ring=6 coast=6 release=5 gear=1 volume=-7.5 point=.3 | stars | gears | Four soft octaves rocked slowly, all keys together
Pocket watch, opened      | Nail bells | gesture=Thrown spin=10 melt=40 coast=4 ring=2 rim=.2 release=2 volume=-0.5 tuning=Unison strung=3 beat=3.5 gauge=.5 width=.3 point=.15 damp=.7 edge=.06 | mike | dusk | Three stiff wires of one pitch beating as they tick round, slower until they stop
Sleigh round the corner   | Nail bells | gesture=Thrown gauge=.65 spin=24 melt=40 coast=6 ring=5 wobble=.5 release=4 width=1 volume=3.5 damp=.8 edge=.06 | around | turn | A quick wheel of small bells that slows as it is held
Mended bell               | Nail bells | plucker=Card gauge=.9 tuning=Unison strung=2 edge=.3 ring=20 damp=.3 rim=.5 beat=2 release=6 spin=14 volume=1.5 point=.26 | keysunder | chimes | Two cracked-sounding bars tapped with a card on steel
`,
    },
    {
      id: 'air-drones',
      name: 'Air drones',
      category: 'drone',
      rows: `
Air under the door        | Air drone | tuning=Unison strung=3 spin=34 melt=4 rise=2 rim=.6 damp=0.85 edge=.1 beat=.4 gauge=.24 width=1 point=.23 | shaded | fifth | Soft air on three like wires, dark and close to the ground
Sleeping turbine          | Air drone | tuning=Unison spin=8 melt=2 rise=6 coast=16 hub=Steel ring=20 damp=.5 beat=1.6 release=9 wobble=.5 volume=3 gauge=.05 width=.6 | hall | under | Breath turned slowly over like steel wires, beating as it comes
Lift shaft                | Air drone | width=0.2 tuning=Unison strung=2 spin=50 melt=6 hub=Steel ring=6 edge=.6 rim=.9 rise=1 lacing=.9 damp=.3 volume=-6.5 gauge=.22 | tunnel | fifth | Air on two wires heard through a steel rim, windy and in the middle
Fan in an empty ward      | Air drone | tuning=Unison strung=4 spin=12 melt=12 ring=4 rim=.5 edge=.4 rise=.5 damp=.4 width=1 point=.14 wobble=.65 | currents | lone | Air in quick passes over like wires, rising and falling each turn
Ship asleep at anchor     | Air drone | hub=Wood ring=20 rim=.9 rise=3 width=.4 volume=6 gesture=Rocked tuning=Fan strung=3 spin=8 melt=2 edge=.15 damp=.8 coast=12 gauge=.24 point=.27 | lowvault | under | Three fan wires breathed on as the wheel rocks, woody and low
Masts over the col | Air drone | hub=Steel spin=14 melt=4 ring=20 rim=.2 edge=.4 damp=.3 rise=3 wobble=.8 width=1 volume=6 gauge=.05 point=.3 | valley | fifth | An open fan of steel in moving air, the fifths coming forward by turns
Snow line, no birds       | Air drone | hub=Steel strung=4 spin=40 melt=5 ring=12 edge=.6 damp=.2 rim=.5 beat=2 lacing=.1 volume=0 gauge=.22 width=.9 point=.15 | farshore | under | Four fifths on steel blown steadily, bright at the edges
Stubble field             | Air drone | spin=24 melt=8 ring=3 rim=.8 edge=.2 damp=.6 rise=1.5 coast=3 release=2 volume=2.5 width=.45 | airy | ferry | A fan on wood blown soft and short of breath
Cable car, held           | Air drone | strung=2 spin=18 melt=3 ring=18 lacing=1 edge=.3 rim=.4 rise=5 hub=Steel damp=.6 gauge=.2 volume=6 width=1 point=.26 | glimmer | fifth | Two stiff wires a fifth apart, breathed on and tied fast
Barn doors both open      | Air drone | strung=5 spin=30 melt=5 hub=Wood ring=8 edge=.5 rim=.15 damp=.1 wobble=.6 coast=5 gauge=.3 width=.6 point=.12 | rain | quartal | Five fan wires heard nearly bare in a draught
Ballast tank | Air drone | hub=Skin tuning=Octaves spin=30 melt=5 ring=20 edge=.7 rim=.5 rise=3 damp=.1 gauge=.22 width=.45 | water | under | Octaves over a skin in slow air, deep and shut in
Furnace, doors shut       | Air drone | hub=Skin tuning=Unison spin=44 melt=6 ring=20 edge=.9 rim=.8 rise=1.5 damp=.1 beat=2 lacing=.7 width=1 point=.34 | floor | fifth | Rushing air on like wires over a skin, all low weight
Seal breathing            | Air drone | point=0.35 hub=Skin tuning=Fan strung=3 spin=1.5 melt=40 ring=20 edge=.6 rim=.4 rise=.1 damp=.1 release=3 volume=5 gauge=.24 width=.6 | cave | lone | Single breaths over a skin, three in two seconds, slow and hollow
Peat bog                  | Air drone | hub=Skin tuning=Overtones strung=4 spin=16 melt=4 ring=20 edge=.8 rim=.3 rise=4 coast=12 wobble=.9 damp=.1 gauge=.24 point=.27 | fog | under | Four overtones breathed over a skin by a crooked wheel
Chimney in November       | Air drone | hub=Skin strung=2 tuning=Fan spin=60 melt=10 ring=20 edge=1 rim=.6 rise=.6 damp=.1 coast=2 volume=3 gauge=.05 width=.9 point=.23 | breath | fifth | A fifth over a skin with the hardest edge of air
Last of the larches       | Air drone | tuning=Overtones spin=40 melt=5 edge=.2 damp=.3 ring=10 rise=2 hub=Steel rim=.04 gauge=.3 width=.6 point=.15 | brighthall 1.mix=0.2 | sing | Six overtones on steel under soft air, thin and high
Kettle on the moor        | Air drone | tuning=Overtones ring=6 rise=4 rim=.3 beat=.2 volume=6 hub=Steel spin=44 gauge=.3 melt=12 point=.36 damp=.55 edge=.25 strung=3 | steps | lone | Three whistling overtones on steel that gather over four seconds
Ink in deep water         | Air drone | tuning=Overtones damp=.6 rim=.6 wobble=.4 gesture=Thrown strung=6 hub=Steel gauge=.35 spin=45 melt=8 rise=.3 coast=18 ring=12 lacing=.1 edge=.35 point=.18 width=.9 volume=2.5 | shimmer | lean | A gust round six stiff overtones on steel that slows to separate breaths | texture
Bees in the roof          | Air drone | tuning=Overtones strung=4 spin=30 melt=24 edge=.4 damp=.4 ring=2 hub=Wood rise=.6 rim=.7 beat=3 gauge=.05 width=.45 point=.12 volume=0 | nextdoor | under | Four overtones fluttering in air, rough and woody
Shell grotto              | Air drone | wobble=0.8 tuning=Octaves spin=11 melt=14 edge=.15 damp=.35 ring=16 hub=Steel rim=.5 point=.4 rise=2.5 volume=3 gauge=.22 | shell | lean | Octaves on steel puffed at their middle, hollow and uneven
Whittled flute            | Puffed reeds | width=0.1 strung=1 hub=Wood spin=40 melt=5 rise=.05 ring=3 rim=.5 edge=.1 coast=.3 release=.3 gear=0 wobble=.1 volume=-2.5 gauge=.24 point=.34 | room | sing | Breath on a single wire, quick to speak and quick to stop | wind
Reed cut at noon          | Puffed reeds | width=0.25 strung=2 hub=Wood tuning=Fan spin=30 melt=4 rise=.1 ring=2 edge=.6 rim=.3 release=.4 point=.06 gear=0 damp=.1 gauge=0 | vibrato | sing | A fifth of two reedy wires blown with an edge | wind
Ocarina in the well       | Puffed reeds | strung=1 hub=Skin spin=50 melt=6 rise=.1 ring=20 edge=.3 rim=.6 release=1 gear=0 damp=.1 point=.5 gauge=.24 width=.3 | hollowpipe | turn | One wire over a skin, blown round and hollow | wind
Panpipes out of sight     | Puffed reeds | strung=2 tuning=Octaves hub=Wood spin=24 melt=5 rise=.02 ring=1 edge=.25 rim=.8 release=.2 gear=0 coast=.2 volume=3 point=.23 | farshore | ostinato | Two octave wires with a puff at the front of each note | wind
Steel whistle, dusk       | Puffed reeds | width=0.3 strung=3 tuning=Octaves hub=Steel spin=60 melt=8 rise=.3 ring=5 edge=.2 rim=.4 release=1.5 gear=0 damp=.4 volume=-3 gauge=.05 | dark | sing | Three octaves on steel blown clear and held | wind
Forge between jobs     | Puffed reeds | hub=Wood spin=2 melt=40 tuning=Unison strung=4 ring=6 edge=.4 rim=.6 release=2 gear=0 gauge=.36 width=1 | slap | lone | Two slow puffs a second on like wires, woody | texture
Loft that breathes iron | Puffed reeds | hub=Steel spin=1 melt=40 tuning=Fan strung=6 ring=20 edge=.3 rim=.5 release=5 gear=0 damp=.4 wobble=.7 volume=3 gauge=.05 width=.6 point=.26 | cathedral 1.mix=0.24 | gears | One long breath a second round a fan of steel | texture
Steam yard at six         | Puffed reeds | hub=Wood spin=6 melt=40 tuning=Octaves ring=1.5 edge=.6 rim=.2 gear=3 strung=3 release=.6 coast=3 volume=-12 gauge=.22 point=.12 | loops | gears | Short puffs on three octaves, the higher keys much quicker | texture
Grampus                   | Puffed reeds | hub=Skin spin=3 melt=40 tuning=Fan strung=2 ring=20 edge=.9 rim=.9 gear=0 wobble=1 release=2 rise=1 damp=.1 volume=4 width=.9 point=.3 | expanse | under | Uneven hard breaths over a skin, three a second | texture
Sighs of the pipework     | Puffed reeds | hub=Steel spin=4 melt=40 tuning=Overtones strung=4 ring=9 edge=.15 rim=.7 gear=4 release=4 damp=.5 coast=6 volume=-2.5 gauge=.24 width=.5 point=.15 | melt | cogs | Soft breaths up four overtones, slower on every higher key | texture
Drone of the old handle   | Feather wheel | strung=4 spin=20 melt=3 point=.08 edge=.7 beat=1.2 wobble=.8 rise=.3 rim=.6 ring=5 coast=2 volume=-16 gauge=.05 | bridge | fifth | Four like wires turned by a crooked handle, nasal and beating
Rosin and rope            | Feather wheel | tuning=Fan strung=4 spin=40 melt=5 point=.1 edge=.55 damp=.3 rise=1 rim=.8 lacing=.9 ring=9 volume=-2.5 gauge=.22 | room 1.mix=0.22 | under | Four laced fifths drawn steadily on wood, dark and grainy
Standing hum              | Feather wheel | tuning=Octaves strung=3 spin=55 melt=4 edge=.4 damp=0.8 ring=20 rise=4 beat=.1 wobble=0 lacing=0 volume=-7 gauge=.06 point=.23 | centre | fifth | Three octaves rubbed without a waver, exact and dark
Beating on the hour       | Feather wheel | strung=2 spin=30 melt=5 beat=4 edge=.5 hub=Steel rim=.5 ring=12 damp=.4 rise=2 gauge=.15 volume=-0.5 | hall 1.mix=0.22 | under | Two steel wires far enough apart to beat as long as they are held
Ground of a long song     | Feather wheel | tuning=Fan edge=.25 damp=.5 ring=14 rise=2 coast=14 release=10 hub=Wood gear=1 volume=6 strung=3 spin=6 melt=2 gauge=.2 point=.45 | strings | fifth | Three fan wires turned slowly at one speed for every key, hollow
Nail drawn down the well  | Air drone | plucker=Nail tuning=Unison strung=3 spin=40 melt=5 edge=.1 damp=.5 rise=3 rim=.7 ring=8 beat=1.4 volume=1.5 gauge=.22 width=.45 point=.26 | hollowpipe 1.mix=0.3 | under | Three like wires drawn by a blunt nail on wood
Card held to the wheel   | Card in the wheel | spin=50 melt=7 tuning=Octaves hub=Wood strung=3 ring=20 edge=.25 gear=0 rise=3 coast=6 wobble=.6 release=3 width=1 point=.12 beat=1.8 | fuzz | fifth | Three octaves buzzed by a card, rising over three seconds
Cicada hour               | Air drone | plucker=Nail tuning=Octaves spin=40 edge=.15 damp=.2 ring=1.5 rise=2 rim=.2 point=.06 hub=Wood melt=38 gauge=.4 | wide | under | Octaves nailed forty times a second, swarming
Generator in the trees    | Card in the wheel | spin=34 tuning=Unison hub=Skin strung=4 ring=20 edge=.8 gear=1 rise=1 coast=4 beat=2 release=2 melt=9 gauge=.24 point=.15 | nextdoor | fifth | Four wires over a skin, half slapped and half hummed
Magnetic north            | Air drone | plucker=Nail tuning=Overtones strung=3 spin=55 melt=4 edge=.05 damp=.6 ring=14 rise=5 hub=Steel rim=.6 beat=.2 volume=3 gauge=.05 width=.9 | overtone | fifth | Three exact overtones under the bluntest nail, long in coming
Tide in the boathouse     | Air drone | gesture=Rocked spin=20 melt=4 tuning=Octaves ring=8 edge=.3 rim=.6 rise=1 coast=14 release=8 damp=.5 volume=5 width=.6 point=.27 | breathing | under | Octaves on wood in air that swings in and out
Curtains at an open sash  | Air drone | gesture=Rocked spin=50 melt=10 ring=2 edge=.5 rim=.3 strung=4 wobble=.3 coast=5 volume=4.5 gauge=.4 point=.23 | around | ferry | Four fan wires brushed by air to either side
Punkah                    | Air drone | gesture=Rocked spin=10 melt=3 tuning=Unison hub=Skin ring=20 edge=.6 rim=.7 strung=3 damp=.1 rise=2 gauge=.3 | sustain | fifth | Slow air to and fro on three wires over a skin
Incense, north aisle | Air drone | gesture=Rocked spin=30 melt=5 tuning=Overtones hub=Steel ring=14 edge=.1 damp=.6 rim=.4 coast=10 release=9 volume=6 gauge=.05 point=.34 | choir | lean | Overtones on steel breathed in wide slow swings
Thrown to the gale        | Air drone | gesture=Thrown spin=60 melt=6 coast=16 ring=6 hub=Wood edge=.8 rim=.4 strung=5 damp=.2 volume=-8.5 gauge=.22 width=1 point=.14 | rain | quartal | Five fan wires in one hard gust that slowly drops
Antarctic mast            | Air drone | hub=Steel spin=30 melt=5 ring=20 edge=.3 damp=.5 rim=.5 rise=3 wobble=.7 volume=2.5 tuning=Overtones strung=5 gauge=.9 point=.36 width=.9 | expanse | under | Air on five heavy overtones of steel, bent away from any chord
Hull plates               | Air drone | gauge=1 hub=Steel tuning=Unison strung=2 spin=20 melt=4 ring=20 edge=.5 damp=.3 rim=1 rise=2 beat=2.6 point=.3 | lowvault | fifth | Two bars in moving air, beating inside a steel rim
Palm house in a gale      | Air drone | gauge=.55 hub=Steel tuning=Octaves spin=40 melt=4 ring=14 edge=.15 damp=.6 rim=.3 rise=4 point=.4 width=1 volume=1 | bloom | lean | Stiff octaves in soft air, hollow and very wide
Cold iron stove           | Air drone | gauge=.7 hub=Wood tuning=Unison strung=3 spin=14 melt=14 ring=9 edge=.6 rim=.9 rise=.8 coast=3 damp=.4 volume=-10 width=.6 | walls | under | Three heavy wires on wood, the air coming in ragged passes
Bridge cables at three | Air drone | gauge=.4 hub=Steel tuning=Overtones strung=4 spin=24 melt=3 ring=20 edge=.25 damp=.6 rise=5 lacing=.8 rim=.4 coast=15 release=12 volume=2.5 point=.26 | longplate 1.mix=0.3 | fifth | Four stiff laced overtones that come and go for a long time
`,
    },
    {
      id: 'geared-figures',
      name: 'Geared figures',
      category: 'plucked',
      rows: `
Crossing oars             | Geared arpeggio | tuning=Octaves spin=2 ring=5 edge=.4 rim=.3 strung=4 wobble=0 release=3 volume=-3 gauge=.24 width=.5 | plate | ferry | Four octave wires on steel, the keys of a chord in three to four to five
Orrery in brass       | Geared arpeggio | tuning=Fan spin=1.2 ring=12 edge=.3 damp=.5 release=8 coast=4 lacing=.3 volume=-8.5 gauge=.05 width=.9 | stars | quartal | An open fan plucked very slowly, each key on its own ratio
Wet cobbles, many heels   | Geared arpeggio | tuning=Unison spin=6 hub=Wood ring=1 edge=.5 strung=2 beat=1 release=.5 rim=.8 volume=-10.5 gauge=.34 | walls | cogs | Like wires on wood, dry and quick, in three to four to five
Tandem on the hill        | Geared arpeggio | tuning=Octaves spin=9 ring=2.5 edge=.6 point=.07 strung=3 hub=Wood rim=.2 wobble=.2 coast=3 width=.35 | slap | cogs | Three thin octaves on wood pedalled quickly at several speeds
Lace machine              | Geared arpeggio | tuning=Overtones spin=14 ring=1.2 edge=.3 damp=.5 lacing=1 strung=5 hub=Wood release=1 gear=2 gauge=.2 width=1 | prism | gears | Five laced overtones worked fast on wood, ratio against ratio
Counting on knuckles      | Geared arpeggio | width=0.5 gear=3 tuning=Unison strung=1 spin=1.5 ring=4 hub=Wood edge=.5 rim=.5 wobble=0 release=2 volume=-9 gauge=.05 | bare | gears | Single wires on wood, the keys counting one to two to three to four
Nested cogs               | Geared arpeggio | gear=3 tuning=Octaves strung=3 spin=3 ring=.8 hub=Wood edge=.65 rim=.9 release=.4 lacing=0 volume=-5.5 gauge=.34 | centre | cogs | Three short octaves on wood in whole ratios, clipped as a clock
Spill from a gutter       | Geared arpeggio | gear=3 tuning=Fan spin=2.4 edge=.35 damp=.4 release=6 width=1 volume=-6 hub=Wood strung=4 ring=2.5 point=.36 | valley | veil | Four fan wires on wood trickling faster with every higher key
Abandoned signal box      | Geared arpeggio | gear=3 tuning=Overtones strung=2 spin=4 ring=3 edge=.5 hub=Wood gauge=.3 point=.4 release=2 volume=-7 width=.5 | cassette | cogs | Two hollow stiff partials on wood, each key a multiple of the first
Swallows at the eaves     | Geared arpeggio | gear=3 tuning=Octaves strung=5 spin=5 ring=3 edge=.25 damp=.6 rim=.2 wobble=.6 release=3 volume=-5 gauge=.24 width=.9 | glimmer | lean | Five soft octaves fluttering quicker as the keys go up
High keys drowsy          | Geared arpeggio | gear=4 tuning=Octaves spin=8 ring=6 edge=.45 hub=Wood rim=.6 strung=4 coast=3 release=3 volume=-7.5 gauge=.34 width=1 | room | ferry | Four octaves on wood, the low key running and the high ones slow
Roots run, leaves hang    | Geared arpeggio | gear=4 tuning=Fan spin=14 ring=4 edge=.3 damp=.5 strung=3 hub=Steel release=5 beat=1.2 volume=-1.5 width=.5 | tape3 | cogs | Three beating fan wires on steel, quick below and slow above
Idle hands, quick feet    | Geared arpeggio | gear=4 spin=10 strung=2 rim=.9 release=.6 point=.1 tuning=Octaves hub=Skin ring=14 damp=.2 edge=.85 gauge=.2 width=.9 | forward | cogs | Two octaves over a skin, each higher key slower than the last
Hawk over mown hay        | Geared arpeggio | gear=4 tuning=Overtones spin=5 ring=10 edge=.35 damp=.6 rim=.3 release=9 wobble=.5 strung=6 volume=-5.5 gauge=.02 | hop | veil | Dark overtones on steel, the top key hanging almost still
Low gear uphill           | Geared arpeggio | gear=4 tuning=Octaves hub=Skin spin=20 ring=20 edge=.9 rim=.4 strung=3 damp=.1 release=1 melt=14 gauge=.05 width=.35 | iron | under | Three octaves over a skin, the low key almost a hum
All wheels together       | Geared arpeggio | gear=1 tuning=Fan spin=4 ring=3 edge=.5 hub=Wood rim=.4 strung=5 release=2 wobble=.1 volume=-8 width=.9 | dotted | gears | Five fan wires on wood, every key plucked at the same moment
Parade of lanterns        | Geared arpeggio | gear=1 tuning=Octaves spin=2.5 ring=9 edge=.3 damp=.5 release=7 rise=.6 lacing=.5 volume=-4 gauge=.2 | hall 1.mix=0.22 | hymn | Laced octaves on steel stepping together, two or three a second
Typists before lunch | Geared arpeggio | width=0.3 gear=1 tuning=Overtones spin=10 ring=.5 edge=.6 hub=Wood strung=4 rim=.3 release=.3 damp=.2 volume=-7 gauge=.24 | deck | ostinato | Four very short overtones on wood, all keys together and quick
Shuttle going over | Geared arpeggio | gear=1 tuning=Unison spin=16 ring=2 edge=.4 hub=Wood beat=2.5 strung=6 release=1 lacing=.8 gauge=.05 width=1 | pulses | quartal | Like wires tied fast and beating, plucked sixteen times a second
Rowers at first light     | Geared arpeggio | gear=1 tuning=Fan hub=Skin spin=1.5 ring=20 edge=.8 strung=3 damp=.1 rim=.5 release=3 gauge=.2 volume=-2 width=.5 | farshore | under | Three fan wires over a skin in one slow stroke
Glass gearing             | Geared arpeggio | plucker=Nail gear=2 tuning=Octaves spin=3 ring=8 edge=.15 damp=.4 gauge=.3 release=5 rim=.4 volume=-6.5 width=.35 | brighthall 1.mix=0.2 | lean | Stiff octaves nailed on steel in three to four to five
Music box for a giant     | Geared arpeggio | plucker=Nail gear=3 tuning=Overtones spin=1.6 ring=5 strung=4 point=.3 release=4 volume=-9.5 gauge=.24 width=1 damp=.75 edge=.08 | memory | cogs | Four nailed overtones turned very slowly, higher keys in multiples
Comb and brass pins | Geared arpeggio | plucker=Nail gear=2 tuning=Unison strung=2 spin=5 ring=3 edge=.2 damp=.4 gauge=.4 release=2 hub=Wood volume=-10 width=.5 | tin | gears | Two stiff like wires picked on wood, counting ratios
Hail on the aviary        | Geared arpeggio | plucker=Nail gear=3 tuning=Fan spin=9 ring=1.2 edge=.15 damp=.3 wobble=.9 release=1 width=1 volume=-0.5 gauge=.34 | spring | gears | Short nailed fifths, uneven and faster on every higher key
Silver chain, let down    | Geared arpeggio | plucker=Nail gear=4 tuning=Octaves spin=12 ring=2.5 edge=.1 damp=.5 coast=6 release=5 strung=5 volume=-4.5 | reverse | cogs | Five blunt nailed octaves, quickest at the bottom, running on after
Gathering pace            | Geared arpeggio | gear=2 tuning=Fan spin=12 rise=8 ring=3 edge=.4 hub=Wood coast=6 release=3 strung=4 volume=-4.5 gauge=.24 width=.5 | room | veil | Four fan wires on wood that take eight seconds to come to speed
From a walk to a run      | Geared arpeggio | gear=3 tuning=Octaves spin=7 rise=5 ring=1.5 edge=.5 hub=Wood rim=.8 wobble=.1 release=1 volume=-11.5 gauge=.05 width=.9 | clean | cogs | Dry octaves on wood that set off slowly, high keys far ahead
Old lift, going up        | Geared arpeggio | width=0.5 gear=1 tuning=Overtones spin=18 melt=24 rise=6 ring=4 damp=.5 edge=.3 release=3 volume=-7 gauge=.34 | rotary | gears | Overtones on steel, all keys together, winding slowly up
Starting the mill         | Geared arpeggio | gear=4 tuning=Unison spin=26 melt=20 rise=4 hub=Wood ring=2.5 edge=.55 beat=1 rim=.7 volume=-9 width=.35 | cascade | ferry | Like wires on wood, the low key spinning up first
Reluctant pulley          | Geared arpeggio | gear=2 tuning=Octaves hub=Skin spin=9 rise=3 ring=20 edge=.85 rim=.5 wobble=1 damp=.1 volume=-4.5 gauge=.2 width=1 | pot | cogs | Octaves over a skin, lurching up to three to four to five
Bass walks, treble sings  | Geared arpeggio | gear=3 tuning=Unison spin=8 melt=10 ring=3 hub=Wood edge=.4 beat=.8 rise=.1 release=2 strung=4 volume=-4 gauge=.05 | chorus | gears | Four like wires on wood, plucked in the low key and sung in the high
Half river, half stones   | Geared arpeggio | gear=3 tuning=Octaves spin=10 melt=12 ring=5 edge=.35 damp=.5 rise=.3 release=4 strung=3 volume=-2.5 gauge=.34 width=.35 | currents | lean | Three octaves on steel, stones below and one smooth line above
Feet below, smoke above   | Geared arpeggio | gear=3 tuning=Fan spin=6 melt=7 hub=Wood ring=4 edge=.3 damp=.5 lacing=.7 release=3 volume=-4.5 width=1 | fog | cogs | Laced fifths on wood, a flutter under a held upper tone
Top key melts             | Geared arpeggio | gear=2 tuning=Overtones spin=12 melt=6 ring=2 hub=Wood edge=.4 damp=.4 strung=4 rise=.2 release=2 volume=-12.5 gauge=.2 width=.5 | slack | gears | Four overtones on wood, rougher at the bottom and smooth at the top
Crank and belt            | Geared arpeggio | gear=4 tuning=Octaves spin=30 melt=14 hub=Wood ring=2 edge=.6 rim=.8 strung=3 rise=.1 release=1 volume=-7 gauge=.24 width=.9 | combo | under | Three octaves on wood, sung in the bass and plucked above
Cradles in ratio          | Geared arpeggio | gesture=Rocked gear=2 tuning=Octaves spin=5 ring=4 edge=.4 hub=Wood rim=.5 coast=4 release=3 volume=-1 gauge=.34 | around | gears | Octaves on wood rocked to and fro at three speeds
Metronomes on a shelf     | Geared arpeggio | width=0.3 gesture=Rocked gear=3 tuning=Unison strung=1 spin=4 ring=.7 hub=Wood edge=.7 rim=.8 release=.4 wobble=0 | tin | gears | Single dry wires on wood swinging at one, two, three and four
Boats on loose moorings   | Geared arpeggio | gesture=Rocked gear=4 tuning=Fan spin=9 ring=7 edge=.35 damp=.5 release=6 coast=8 volume=-0.5 gauge=.2 width=.9 | water | veil | A fan on steel swayed quickly below and slowly above
Park after closing        | Geared arpeggio | gesture=Rocked gear=2 tuning=Overtones strung=3 spin=7 ring=3 edge=.45 damp=.4 coast=12 release=5 rim=.3 volume=-11.5 gauge=.24 | dark | gears | Three overtones rocked in ratios, swinging on after the keys
Two hammocks, one breeze  | Geared arpeggio | gesture=Rocked gear=1 tuning=Unison strung=3 spin=14 melt=10 ring=5 hub=Wood beat=1.5 edge=.3 release=4 volume=-1 gauge=.05 width=.35 | shiver | hymn | Three beating wires on wood swung together, half sung
Thumbs in a gourd         | Geared arpeggio | width=0.2 gear=2 tuning=Unison strung=1 gauge=.4 spin=4 hub=Wood ring=4 edge=.6 rim=.7 release=1 point=.12 volume=-6 | pot | ostinato | One stiff wire a key on wood, thumbed in ratios
Bars in a row boat        | Geared arpeggio | gear=3 tuning=Octaves strung=2 gauge=.7 spin=2 ring=7 edge=.5 damp=.4 hub=Wood release=3 volume=-10.5 | tremolo | ferry | Two heavy octaves on wood struck in whole-number time
Pylon harp                | Geared arpeggio | gear=2 tuning=Fan gauge=.25 spin=8 ring=14 edge=.5 damp=.2 lacing=.9 release=9 rim=.15 point=.1 volume=-8.5 width=.35 | longplate | strum | Laced stiff fifths on steel, plucked near the end and left to ring
Bells that share a rope   | Geared arpeggio | gear=2 tuning=Octaves gauge=.85 strung=3 spin=1.8 ring=16 edge=.35 damp=.5 release=9 rim=.6 width=1 | sympathy | gears | Three bars over the octaves tolling in three to four to five | bell
Unequal braces            | Geared arpeggio | gear=4 tuning=Unison gauge=.55 strung=2 beat=3.5 spin=7 ring=5 hub=Steel edge=.4 rim=.8 release=3 volume=-0.5 width=.5 | phaser | cogs | Two thick like wires beating hard, the upper keys slower
Frame drum counting       | Geared arpeggio | width=0.3 gear=3 tuning=Octaves strung=2 hub=Skin spin=2 ring=20 edge=.95 rim=.6 damp=.1 wobble=.2 release=.8 volume=-7.5 gauge=.25 | room 1.mix=0.2 | gears | Two octaves over a skin in whole ratios, round thumps | drum
Breath in three tempi     | Geared arpeggio | plucker=Air gear=2 tuning=Unison strung=3 spin=2 hub=Wood ring=5 edge=.3 rim=.6 release=2 damp=.2 volume=-2 gauge=0 width=.45 | breath | quartal | Puffs on like wires, each key at a pace of its own | wind
Clogs up four flights | Geared arpeggio | gear=2 tuning=Fan strung=2 hub=Wood gauge=.6 spin=5 ring=.6 edge=.8 rim=1 release=.4 damp=.3 volume=-4 width=.4 | plank | ostinato | Two thick fifths knocked short on wood, in ratios | drum
Steam hammers, far shift  | Geared arpeggio | plucker=Air gear=3 hub=Skin tuning=Octaves strung=4 spin=3 ring=20 edge=.8 rim=.7 damp=.1 release=1.5 volume=-3 gauge=.22 width=.6 | generations | gears | Gusts over a skin, the high keys gusting far faster | texture
Weights of a tall clock   | Geared arpeggio | gear=4 plucker=Card tuning=Fan strung=2 hub=Steel spin=5 ring=20 edge=0.55 rim=.6 release=2 damp=.2 volume=2 | slap 2.gain=6 | cogs | Two fan wires on steel tapped by a card, slowest at the top
`,
    },
    {
      id: 'woven-voices',
      name: 'Woven voices',
      category: 'voice',
      rows: `
Choir behind the yew      | Woven voices | melt=5 beat=2.6 edge=.5 rise=1 point=.07 wobble=.2 strung=5 gauge=.2 spin=40 width=.6 | hall | hymn | Like wires tied fast and touched near the end, many nasal voices
Nuns at the far grille    | Woven voices | strung=3 spin=22 melt=4 beat=.8 edge=.25 damp=.5 rise=2 rim=1 gauge=0 width=1 | cathedral | hymn | Three laced wires hummed softly through the wood
Men under the arch        | Woven voices | edge=.6 hub=Skin ring=20 damp=.1 rise=.5 tuning=Octaves strung=4 spin=9 melt=2.5 wobble=.8 rim=.9 point=.3 beat=.6 gauge=.22 volume=-3 | monks | sing | Four octaves laced over a skin, swelling each turn, chesty and low
Round of shepherds        | Woven voices | strung=4 spin=40 melt=8 beat=3.5 edge=.7 point=.1 hub=Steel rim=.3 damp=.4 ring=6 gauge=.05 width=.4 | canon | sing | Four beating wires on steel, bright and open-throated
Congregation of wires     | Woven voices | spin=50 melt=4 beat=5 wobble=.9 ring=8 rise=1.4 width=1 damp=.4 hub=Steel rim=.4 point=.2 edge=.6 gauge=.26 volume=-1 | chorus | hymn | Six wires as far out of tune as they go, a crowd in unison
Closed lips               | Woven voices | point=.5 edge=.3 strung=2 spin=34 melt=5 rim=1 ring=3 beat=.4 damp=0.85 lacing=.6 volume=-6 gauge=0 | warm | sing | Two wires at their middle, a hollow hum with no edge
Hum from the scullery     | Woven voices | width=0 point=.35 edge=.5 strung=1 spin=26 melt=5 rim=.8 ring=1.5 rise=.3 coast=1 release=.6 wobble=.1 volume=-4 gauge=.04 | nextdoor | sing | One wire hummed plainly on wood
Mother tongue             | Woven voices | damp=0.7 point=.25 edge=.35 strung=3 spin=18 melt=3 rim=.6 wobble=.7 ring=5 beat=1 rise=.8 volume=-6 gauge=.05 width=.9 | vowel | sing | Three wires turned unevenly, swelling like speech
Oo through the wall       | Woven voices | point=.45 edge=.15 spin=44 melt=6 hub=Skin ring=20 rim=.3 damp=0.3 rise=1.2 strung=4 gauge=.26 | darkhall | hymn | Four wires over a skin at their middle, all roundness
Tenor in the stairwell    | Woven voices | width=0.15 point=.15 edge=.75 strung=2 spin=30 melt=4 rim=.9 ring=2 beat=.2 rise=.2 release=1 coast=1 | vibrato | sing | Two wires under a keen feather, forward and quick to speak
Trebles at evensong       | Woven voices | tuning=Octaves rise=1.2 rim=.5 strung=3 hub=Steel point=.36 edge=.25 spin=14 melt=3 damp=.35 gauge=0 beat=.3 width=.9 volume=1 | cathedral 1.mix=0.36 | hymn | Three laced octaves on steel touched far from the end, clear and slow
Boy at the lectern        | Woven voices | tuning=Octaves strung=3 spin=50 melt=6 hub=Steel edge=.2 damp=.5 rim=.4 ring=7 rise=.4 wobble=.2 volume=-2.5 gauge=.05 width=.6 | brighthall 1.mix=0.2 | sing | Three octaves on steel, thin and silvery
Glass harmony             | Woven voices | tuning=Octaves strung=5 spin=26 melt=4 point=.4 edge=.3 ring=12 hub=Steel rim=.7 damp=.4 rise=3 volume=2 gauge=.26 | plate | lean | Five laced octaves at their middle, hollow on steel
Descant over frost        | Woven voices | tuning=Octaves strung=3 plucker=Nail edge=.1 spin=44 melt=6 damp=.5 rise=1 ring=6 rim=.4 volume=0 gauge=.02 | shimmer | sing | Three laced octaves brushed by a blunt nail, high and fine
Low lark, high lark       | Woven voices | tuning=Octaves strung=4 spin=20 melt=3 edge=.6 point=.12 rim=.8 wobble=.5 gear=1 rise=.6 volume=-5.5 gauge=0 width=.4 | double | two | Four octaves from below to above each key, reedy on wood
Organum at cockcrow       | Woven voices | tuning=Fan strung=2 spin=34 melt=5 beat=.1 rise=.8 ring=5 damp=.4 volume=4 point=.5 rim=.95 edge=.5 gauge=0 | cathedral 1.mix=0.26 | sing | Each key sung with the fifth above it at the middle of the wire, hollow and exact
Fourths in the crypt      | Woven voices | tuning=Fan strung=3 spin=24 melt=4 edge=.2 damp=.6 ring=14 hub=Skin rim=.2 rise=1.5 beat=.7 volume=-5.5 gauge=.26 | cave | hymn | Fifth above and fourth below over a skin, dark and slow
Torches up the causeway   | Woven voices | tuning=Fan strung=5 spin=40 melt=4 edge=.5 point=.08 wobble=.4 rise=2 hub=Steel damp=.4 rim=.6 volume=-5 | swarm | hymn | Five laced fifths on steel, nasal and wide
Becalmed fifth            | Woven voices | tuning=Fan strung=2 spin=12 melt=2.5 edge=.6 wobble=1 ring=4 rim=.9 coast=6 rise=.5 volume=-4 gauge=0 width=.9 | around | under | A fifth that swells with every turn of a crooked wheel
Hymn on fence wire        | Woven voices | tuning=Fan strung=4 plucker=Nail edge=.15 hub=Wood spin=30 melt=5 damp=.4 ring=3 rise=.6 beat=1.6 volume=-1.5 gauge=.22 width=.6 | wireless | hymn | Four fifths brushed by a nail on wood, small and wiry
Deep in the chest         | Woven voices | width=0.1 hub=Skin strung=3 spin=30 melt=6 edge=.8 ring=20 damp=.1 rim=.7 point=.2 rise=.3 beat=.6 volume=-15 gauge=.26 | centre | sing | Three laced wires over a skin, mostly body
Bull roarer               | Woven voices | hub=Skin gesture=Rocked strung=2 spin=24 melt=5 edge=.95 ring=20 damp=.1 rim=.5 rise=.5 coast=4 volume=-7.5 gauge=.36 | tunnel | lone | Two wires over a skin swung heavily to and fro| texture
Bassi ripieni             | Woven voices | hub=Skin tuning=Octaves strung=4 spin=20 melt=3 edge=.9 ring=20 damp=.1 rim=.3 rise=1 wobble=.6 volume=-13 gauge=.22 width=.5 | hall 1.mix=0.2 | under | Four octaves over a skin, laced into one low section | string
Giant clearing a throat | Woven voices | hub=Skin tuning=Overtones strung=4 spin=40 melt=26 edge=.95 ring=20 damp=.1 rim=.4 wobble=.8 rise=1 volume=-6 gauge=.22 width=.6 | fuzz | lone | Four overtones over a skin, rattling between plucks and tone | texture
Old voices, new year      | Woven voices | hub=Skin plucker=Card tuning=Unison strung=2 spin=44 melt=6 edge=.7 ring=20 damp=.1 rim=.6 rise=.5 gauge=.05 | room | hymn | Two wires over a skin hummed through a card, dry and breathy
Viol consort              | Woven voices | width=0.45 lacing=.5 strung=2 spin=50 melt=3 edge=.7 rise=.25 rim=.7 release=.8 coast=1 damp=.2 volume=-11.5 tuning=Octaves point=.14 gauge=.25 beat=1.5 ring=4 | chamber | two | A wire and its octave drawn keenly on wood, plain bowed lines| string
Second desk               | Woven voices | lacing=.3 strung=3 spin=34 melt=4 edge=.55 point=.13 ring=4 rise=.6 beat=1.5 hub=Steel damp=.4 rim=.5 wobble=.1 volume=-5.5 gauge=.22 | halo | hymn | Three beating wires on steel with a bowed grain | string
Drawn through beeswax     | Woven voices | lacing=.8 strung=4 spin=24 melt=3 edge=.85 rise=3 ring=5 rim=.6 wobble=.3 damp=.3 tuning=Fan hub=Steel point=.06 gauge=.3 beat=2.2 width=.9 volume=-15 | hall 1.mix=0.24 | ferry | Four stiff fan wires drawn slowly near the end, keen and beating| string
Sul tasto                 | Woven voices | lacing=.4 strung=3 spin=40 melt=5 edge=.3 point=.3 damp=0.8 ring=6 rise=1.5 beat=1 rim=.4 width=1 volume=-3.5 gauge=.26 | strings | lean | Three wires brushed far from the end, dark and soft | string
Fiddle over the valley | Woven voices | width=0.1 lacing=0 strung=1 spin=30 melt=3 edge=.9 point=.06 ring=1 rise=.1 rim=.5 damp=.1 release=.4 coast=.5 wobble=.4 volume=-15 gauge=0 | valley | sing | One wire drawn hard near its end | string
Whispers in the gallery   | Woven voices | plucker=Air spin=20 melt=4 edge=.4 ring=2 rim=.5 damp=.3 rise=.6 beat=1.5 wobble=.7 volume=-6 gauge=0 | blur | lone | Laced wires breathed on, nearly all air
Sleepers in one room      | Woven voices | plucker=Air gesture=Rocked spin=14 melt=3 strung=3 hub=Skin edge=.6 ring=20 damp=.1 rise=1 coast=8 rim=.5 volume=-3.5 gauge=.22 | breathing | fifth | Air to and fro on three wires over a skin | drone
Gauze choir               | Woven voices | plucker=Air tuning=Octaves strung=3 spin=44 melt=5 hub=Steel edge=.15 damp=.5 ring=12 rise=1.5 rim=.4 volume=1 gauge=.05 width=.9 | choir | sing | Breath on three laced octaves of steel, soft and high
Psalm into a scarf        | Woven voices | plucker=Air strung=2 tuning=Fan spin=30 melt=5 edge=0.35 damp=0.6 ring=8 rim=.9 rise=.8 beat=.3 volume=3 gauge=.26 width=.6 | cloth | hymn | A fifth breathed through wood, muffled and even
Close to cold glass | Woven voices | plucker=Air strung=1 spin=50 melt=8 edge=.5 ring=6 rise=.2 rim=.3 damp=.1 point=.08 release=1 coast=1 volume=-5 gauge=0 width=.25 | mike | sing | One wire breathed on close by, all edge and air | wind
Rocking the pews          | Woven voices | gesture=Rocked spin=36 melt=6 edge=.4 rise=1 coast=10 beat=1.5 ring=5 point=.2 release=6 volume=-3 gauge=.22 width=.9 | hall 1.mix=0.28 | hymn | Laced wires sung forward and back, every chord leaning twice
Ebb of a lullaby          | Woven voices | gesture=Rocked tuning=Octaves strung=3 melt=4 edge=.3 damp=.5 ring=8 hub=Steel rim=.4 coast=14 release=9 volume=-3.5 gauge=.05 wobble=.05 spin=34 | loops | lean | Three octaves on steel rocked evenly, going on when let go
Crowd at a level tide     | Woven voices | gesture=Rocked tuning=Fan spin=50 melt=9 edge=.5 beat=3 point=.08 ring=3 wobble=.7 rise=.6 width=1 volume=-3 gauge=.26 | flock | hymn | Beating fifths swayed from side to side, nasal and many
Sisters in step           | Woven voices | gesture=Rocked strung=2 spin=12 melt=2.5 edge=.45 ring=4 rise=.4 rim=.7 beat=.8 coast=4 point=.3 volume=-7.5 | dark | sing | Two wires sung in a slow swing
Pendulum requiem          | Woven voices | gesture=Rocked tuning=Overtones strung=4 hub=Wood spin=28 melt=5 edge=.3 damp=.6 ring=7 rise=1.5 coast=12 volume=-3 gauge=0 width=.4 | lowvault | hymn | Four dark overtones swung like a slow bell of voices
Murmurs in a cloister | Woven voices | width=0.3 spin=20 melt=20 edge=.6 ring=.8 point=.09 rise=.1 strung=3 beat=1 rim=.8 wobble=.6 release=1 volume=-16.5 gauge=.05 | walls | sing | Three dry laced wires half plucked and half sung, like muttering
Rosary                    | Woven voices | spin=8 melt=12 edge=.4 ring=2 strung=4 damp=.4 rise=.3 rim=.9 lacing=.7 coast=5 release=3 point=.3 gauge=.26 | monks | hymn | Four wires plucked in quick rounds over a low murmur
Auctioneer, asleep        | Woven voices | spin=30 melt=34 edge=.55 ring=.5 point=.07 strung=2 hub=Wood rise=.5 coast=3 release=.6 wobble=1 gauge=.36 width=.9 volume=-8 | cassette | lone | Two very dry wires chattering on an uneven wheel | texture
Gossip over the wash      | Woven voices | spin=15 melt=14 tuning=Fan strung=3 edge=.5 ring=1 rise=.2 gear=2 point=.12 rim=.7 release=1 volume=-11 gauge=0 width=.9 | slap | sing | Three fan wires babbling on wood, each key at its own pace
Tongues of a bonfire      | Woven voices | spin=44 melt=40 tuning=Octaves strung=4 plucker=Nail edge=.2 ring=1.2 damp=.4 hub=Wood rise=.6 wobble=.8 volume=0.5 gauge=.22 width=1 | stretch | quartal | Octaves nailed on wood too fast to count, crackling on an uneven wheel| texture
Gullet and flute          | Woven voices | width=0.2 tuning=Overtones strung=3 spin=34 melt=4 edge=.7 point=.08 damp=.2 ring=4 rise=.5 rim=.6 beat=.3 gauge=.26 | overtone | sing | Three laced overtones pressed hard, a low note with a whistle over it
Steppe at nightfall       | Woven voices | tuning=Overtones strung=5 spin=24 melt=3 edge=.4 damp=.4 hub=Skin ring=20 rim=.25 rise=1 wobble=.4 volume=-6 gauge=.3 width=.45 | expanse | under | Five overtones over a skin, a throat held open | drone
Reed organ, missing stop  | Woven voices | tuning=Octaves strung=4 plucker=Card hub=Wood spin=56 melt=6 edge=.35 ring=20 rise=.1 rim=.5 beat=.8 coast=.5 release=.5 volume=-4.5 gauge=.2 width=.4 | hint | hymn | Four octaves hummed through a card, breathy and even | organ
Positive in the porch     | Woven voices | tuning=Octaves strung=3 spin=44 melt=3 edge=.5 damp=.4 ring=2 rise=.05 beat=.2 wobble=0 lacing=.2 coast=.5 release=.4 | chamber | hymn | Three steady octaves on wood, quick to speak and quick to stop | organ
Voices off                | Woven voices | tuning=Overtones strung=2 spin=18 melt=3 edge=.3 damp=.5 ring=9 rise=4 hub=Steel rim=.8 coast=12 release=10 volume=4.5 gauge=.05 | steps 2.mix=0.3 | lean | A note and its twelfth laced on steel, slow to come and slow to leave
`,
    },
    {
      id: 'plain-plucks',
      name: 'Plain plucks',
      category: 'plucked',
      rows: `
Small guitar on the step  | Plain plucked keys | strung=1 ring=4 edge=.5 point=.2 rim=.7 damp=.35 release=.25 width=.15 volume=-5 gauge=.24 | room | turn | One wire a key plucked on wood and stopped with it
Nylon and cedar           | Plain plucked keys | strung=1 ring=2.2 edge=.3 point=.32 rim=.9 damp=0.85 release=.15 width=.3 gauge=.04 volume=-2 | warm | two | One soft wire plucked over the middle, dark wood round it
Six at a camp table       | Plain plucked keys | tuning=Octaves ring=8 point=.1 rim=.5 beat=1.4 release=1 width=.6 hub=Steel gauge=.25 spin=34 plucker=Nail strung=4 damp=.6 edge=.15 volume=-7.5 | twelve | strum | Four octaves on steel run together by a nail at each key
Porch, late, no moon      | Plain plucked keys | strung=1 ring=12 edge=.4 point=.45 rim=.3 damp=.5 release=2.5 coast=.2 wobble=.4 width=.2 volume=-1 | reel | call | One wire at its middle, hollow and left to ring a while
Choked with the palm      | Plain plucked keys | strung=2 ring=.5 edge=.65 point=.08 rim=.8 damp=.4 release=.06 width=.25 beat=.3 volume=-12 gauge=.2 | forward | ostinato | Two wires on wood choked with the palm, very short
Hammered wire, open lid   | Plain plucked keys | edge=.6 point=.12 release=4 width=.9 damp=.3 volume=-9.5 beat=4.6 rim=.85 hub=Wood strung=6 gauge=.55 ring=3 | brighthall 1.mix=0.18 | walk | Six stiff like wires on wood struck as one and beating fast
Autumn zither             | Plain plucked keys | hub=Steel strung=3 tuning=Octaves ring=14 edge=.4 damp=.45 lacing=.9 release=7 spin=30 width=.5 volume=-10.5 gauge=.34 | spring | strum | Three laced octaves on steel, plucked in a quick row
Tin trays and honey       | Plain plucked keys | hub=Steel strung=2 gauge=.2 ring=5 edge=.9 rim=.95 damp=.1 release=1.5 beat=1 width=.35 | tin | turn | Two stiffish wires inside a steel rim, bright and sticky
Ring of spare keys        | Plain plucked keys | hub=Steel strung=6 tuning=Fan spin=36 ring=4 edge=.3 damp=.35 release=1 gauge=.12 width=1 volume=-2.5 | bowed | call | Six steel fifths brushed all but at once
Drip on a taut line       | Plain plucked keys | hub=Steel strung=1 ring=18 edge=.2 damp=.7 point=.5 release=9 rim=.15 width=.05 beat=0 volume=-1 gauge=.08 | bed | two | One steel wire plucked bluntly at its middle, almost a sine
Harp at an open window    | Plain plucked keys | strung=2 tuning=Octaves ring=14 edge=.35 point=.3 rim=.5 damp=.4 release=8 spin=20 width=.8 volume=-3 gauge=.34 | hall 1.mix=0.2 | turn | A wire and its octave on wood, round and long
Spool of pale thread      | Plain plucked keys | strung=3 tuning=Octaves plucker=Nail edge=.15 ring=4 damp=.4 rim=.3 release=3 spin=14 width=.7 volume=-1 gauge=.04 | graindelay | call | Three octaves picked in turn by a fine nail on wood
Gloves off by the stove   | Plain plucked keys | strung=1 plucker=Feather hub=Skin ring=20 edge=.95 rim=.15 release=3 damp=.1 point=.2 width=.4 volume=-7 gauge=.22 | darkhall | floor | One wire over a skin, dark and slow to fade | bass
Harp in the flooded hall  | Plain plucked keys | strung=4 tuning=Overtones ring=9 edge=.3 damp=.6 release=6 spin=26 rim=.6 lacing=.7 width=.9 volume=-6 gauge=.24 | water | strum | Four laced overtones a key, plucked as one soft spread
Cobweb, shaken            | Plain plucked keys | strung=5 tuning=Octaves spin=12 rise=.3 ring=3 edge=.2 damp=.5 release=4 wobble=.7 width=1 volume=2 rim=.02 gauge=.05 | falling | scatter | Five faint octaves shaken out unevenly, barely touching wood
Slow turn of the wrist    | Strummed fan | plucker=Feather ring=10 edge=.4 damp=.3 release=8 rim=.5 width=.5 volume=-2.5 strung=6 hub=Steel gauge=.25 point=.12 spin=4.5 beat=1.8 | hall 1.mix=0.22 | strum | Six fan wires on steel strummed so slowly that each is heard| string
Sail ropes on a mast      | Strummed fan | spin=26 hub=Wood gauge=.35 ring=1.5 edge=.25 damp=.2 release=.6 wobble=.8 rim=.9 width=.6 volume=6 beat=.8 | walls | scatter | Stiff fifths nailed quickly on wood, clattering and short
Tuned and left alone      | Strummed fan | plucker=Feather spin=18 hub=Steel strung=3 ring=16 edge=.55 damp=.25 beat=1.6 release=10 width=.9 point=.15 gauge=.04 | halftime | strum | Three beating fan wires on steel left to ring | string
Shutter run down          | Strummed fan | spin=60 rise=.6 hub=Steel ring=2 edge=.15 damp=.5 release=.3 strung=6 rim=.3 point=.08 width=1 volume=-0.5 gauge=.05 beat=1.3 | gated | strum | Six nailed fifths swept faster and faster, stopped with the key
Brushed, not struck       | Strummed fan | plucker=Air spin=26 ring=6 rim=.6 release=2 strung=5 width=.8 volume=-5.5 tuning=Overtones hub=Steel gauge=.2 point=.12 beat=.1 damp=.5 edge=.25 | airy | strum | A quick breath across five overtones on steel| wind
Plectrum box              | Plain plucked keys | plucker=Nail strung=2 tuning=Octaves ring=3 point=.07 rim=.6 release=.06 width=.3 volume=-4.5 gauge=.05 damp=.5 edge=.18 | chamber | ostinato | A wire and its octave picked by a nail and stopped dead | keys
Spinet in the attic       | Plain plucked keys | plucker=Nail strung=1 ring=2 edge=.6 point=.12 damp=.3 rim=.4 release=.1 gauge=.1 width=.2 volume=-8.5 | booth | walk | One thin wire a key picked keenly, quick and small| keys
Virginals by lamplight    | Plain plucked keys | plucker=Nail strung=3 ring=6 edge=.15 damp=.4 beat=1.2 rim=.8 release=.15 volume=-1 tuning=Octaves point=.42 gauge=.05 | room 1.mix=0.22 | two | Three fine octave wires a key picked at the middle by a blunt nail on wood, hollow| keys
Wafer keyboard            | Plain plucked keys | plucker=Nail strung=2 tuning=Fan ring=2.4 point=.05 rim=.2 release=.1 width=.1 volume=-1 damp=.65 edge=.05 | forward | ostinato | A fifth to each key picked at its very end, thin and fairly short| keys
Locked clavichord         | Plain plucked keys | plucker=Nail strung=2 ring=.8 edge=.1 point=.4 damp=0.95 rim=1 release=.3 gesture=Driven spin=20 melt=4 rise=.05 coast=.2 volume=3 gauge=.26 | mike | walk | Two wires on wood picked and then held as a faint dark rub | keys
Pairs of silver           | Plain plucked keys | strung=2 tuning=Octaves hub=Steel ring=9 edge=.5 beat=2 point=.15 damp=.25 release=3 spin=60 width=.7 volume=-4 gauge=.24 | chorus 1.mix=0.3 | strum | Octave pairs on steel plucked together, quick beating in the top
Long neck, low action     | Plain plucked keys | strung=1 hub=Steel gauge=.15 ring=5 edge=.8 rim=.6 release=.8 lacing=0 width=.1 damp=.35 point=.09 | bridge | call | One steel wire plucked near the end with a buzz under it
Silk strings, high        | Plain plucked keys | strung=1 ring=1.4 edge=.6 damp=.5 release=.5 lacing=0 coast=.2 volume=-3.5 rim=0 gauge=0 point=.28 | slaproom | turn | One short fine wire heard quite straight, silky and plain
Earth and gut | Plain plucked keys | strung=2 tuning=Fan ring=3 edge=.45 point=.1 rim=1 damp=.5 release=.6 beat=.2 width=.45 spin=10 volume=1.5 | pot | ostinato | A wire and then its fifth plucked on wood, earthy
Unfretted at dawn         | Plain plucked keys | strung=1 gesture=Driven spin=34 melt=3 rise=.4 ring=2.5 edge=.7 point=.1 damp=.4 rim=.6 release=1 coast=.5 gauge=0 | vibrato | sing | One wire plucked and drawn on into a sung note | string
Pins in a cushion         | Plain plucked keys | strung=1 ring=0.5 point=.14 rim=0.5 release=.1 width=.35 volume=-9.5 plucker=Nail hub=Steel gauge=.3 damp=.5 edge=.15 | clean | ostinato | Very short picks of one stiff wire, little more than a tick
Buttons in a saucer       | Plain plucked keys | strung=3 tuning=Octaves ring=.4 spin=14 edge=.5 rim=.7 release=.2 damp=.3 width=.8 volume=-1.5 gauge=.34 | stone | turn | Three dry octave plucks, one after the other
Wool over the strings     | Plain plucked keys | strung=2 edge=.35 rim=.6 release=.3 beat=.8 width=.2 volume=0 tuning=Octaves point=.5 gauge=.4 ring=1.6 damp=.85 | cloth | two | A stiff wire and its octave with every high overtone taken away
Cork on a table           | Plain plucked keys | strung=1 gauge=.5 ring=.6 edge=.6 damp=.5 rim=.9 release=.2 point=.2 plucker=Feather volume=-1 | dark | ostinato | One thick muted wire on wood, knocked and gone
Tiptoe                    | Plain plucked keys | hub=Skin ring=14 edge=.9 rim=.25 release=.12 damp=.2 width=.1 volume=-3 tuning=Octaves strung=2 gauge=.25 point=.3 | lowpass | ostinato | A wire and its octave over a skin plucked and stopped at once
Garage at sundown         | Plain plucked keys | strung=1 hub=Steel ring=7 edge=.5 damp=.45 rim=.2 point=.12 release=.6 width=.15 gauge=.06 volume=-8 | combo | call | One steel wire, plain and a little dark
Wah from the kerb         | Plain plucked keys | strung=2 hub=Steel ring=4 damp=.2 release=.3 beat=.6 rim=.3 width=.2 volume=3.5 plucker=Nail edge=.3 gauge=.2 point=.14 | touch | ostinato | Two steel wires picked by a nail and choked
Surf hut                  | Plain plucked keys | strung=2 tuning=Octaves ring=3 edge=.6 damp=.3 rim=.5 release=.5 width=.5 volume=-19 gauge=.02 hub=Wood point=.06 beat=2.4 | slack | strum | A fine octave pair on wood, beating, bright and short
Pillow and small speaker | Plain plucked keys | ring=6 edge=.55 damp=.3 rim=.4 release=1 wobble=.5 beat=1 volume=-12 tuning=Octaves strung=2 hub=Steel point=.11 gauge=.02 | bedside | two | A wire and its octave on steel, plucked plainly
Feeding back politely     | Plain plucked keys | strung=1 hub=Steel gesture=Driven spin=50 melt=10 rise=1 ring=10 edge=.6 damp=.4 point=.15 rim=.3 release=2 volume=-6 gauge=.05 | howl | lone | One steel wire plucked and slowly rubbed into a long tone
Three rolled at a time    | Plain plucked keys | strung=3 tuning=Fan spin=8 ring=5 edge=.45 rim=.5 release=2 damp=.3 width=.6 hub=Steel volume=-0.5 | fifths | turn | Root, fifth and fourth below rolled at every key on steel
Rings on every finger     | Plain plucked keys | strung=6 tuning=Octaves spin=9 ring=4 edge=.4 rim=.7 release=1.5 wobble=.3 lacing=.2 width=.9 volume=-5.5 gauge=.2 | dotted | cogs | Each key rolls through six octave wires on wood
Twigs off the branch      | Plain plucked keys | strung=4 tuning=Overtones spin=5 wobble=.9 ring=7 edge=.35 damp=.5 release=5 hub=Steel rim=.2 width=1 volume=-2.5 gauge=.24 | backwards | call | Four overtones a key, broken slowly and unevenly on steel
Rolled shirt cuffs        | Plain plucked keys | strung=5 tuning=Fan spin=20 rise=.5 ring=2 edge=.6 rim=.8 release=.8 point=.08 width=.4 volume=-13 gauge=.05 | slap | walk | Five fan wires rolled on wood, slow at first and quicker
Pass it along the pew     | Plain plucked keys | strung=5 tuning=Unison spin=7 ring=6 beat=3 edge=.5 rim=.4 release=3 lacing=.6 width=1 volume=-5.5 gauge=.34 | warp | two | Five like wires plucked in a row across the field, beating
Banjo in the orchard      | Plain plucked keys | hub=Skin strung=2 ring=20 edge=.85 rim=.12 release=.5 damp=0 point=.07 gauge=.05 width=.3 volume=-18 | room 1.mix=0.14 | ostinato | Two like wires plucked near the end over a skin, dry
Lute under water lilies   | Plain plucked keys | strung=2 ring=5 edge=.4 point=.25 damp=.5 release=4 beat=1.2 rim=.6 lacing=.9 width=.6 volume=-3 gauge=.24 | suboct | turn | Two laced wires on wood, rounded and slow to die
Plucked behind a curtain  | Plain plucked keys | strung=3 ring=3 edge=.25 damp=0.95 rim=.8 release=2 width=.7 tuning=Octaves spin=24 point=.4 volume=3.5 gauge=.05 | hiss | call | Three dull octaves plucked softly on wood
Guitar on the late watch| Plain plucked keys | strung=1 gesture=Thrown spin=6 melt=40 coast=4 ring=3 edge=.5 rim=.5 release=2 point=.2 width=.4 volume=-5 gauge=.34 | hop | turn | One wire repeating itself on wood, slower each time
Old song, wrong room      | Plain plucked keys | strung=3 beat=4 ring=7 edge=.6 rim=.9 damp=.3 release=1 gauge=.12 point=.11 width=.5 volume=-7.5 | record | walk | Three wires to a key, badly out of tune with one another | keys
`,
    },
    // NEXT
  ],
}
