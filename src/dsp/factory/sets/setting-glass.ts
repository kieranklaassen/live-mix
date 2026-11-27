import { type InstrumentSet } from './set'

// Laid out by how the glass meets heat: slow clearing, quick keys, warm basses,
// breath, broken pieces, pouring, the fire, brittle plucks, dark voices and the
// cold. Each direction is ten corners of the instrument, five presets to each.

export const SET: InstrumentSet = {
  device: 'setting-glass',
  names: {
    matter: ['Glass', 'Crystal', 'Salt', 'Sugar', 'Obsidian', 'Bronze'],
    strike: ['Drop', 'Rod', 'Tap', 'Pour'],
    when: ['Press', 'Set', 'Release', 'Both'],
    release: ['Quench', 'Anneal', 'Remelt'],
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
      ],
      words: ', dry and opened to the sides',
    },
    narrow: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Narrow' },
        { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 2 } },
      ],
      words: ', dry and narrow, its warmth brought up',
    },
    table: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.22 } }],
      words: ', on a table in a small room',
    },
    chamber: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.16 } }],
      words: ', in a tight chamber',
    },
    stub: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Tight room' }],
      words: ', on a short dull plate',
    },
    shaded: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Shaded' },
        { deviceId: 'spread', preset: 'Soft tilt' },
      ],
      words: ', dry, with its top in the shade',
    },
    door: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Muffled' },
        { deviceId: 'distance', preset: 'Next door', params: { level: 0.6 } },
      ],
      words: ', heard from behind a door',
    },
    floor: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 3 } },
        { deviceId: 'saturator', preset: 'Warm glue' },
      ],
      words: ', dry, with its floor deepened',
    },
    thinned: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Thin' },
        { deviceId: 'stereo-widener', preset: 'Normal' },
      ],
      words: ', dry, thinned to its middle',
    },
    lit: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Bright', params: { presence: 3, air: 5 } },
        { deviceId: 'stereo-detune', preset: 'Faint width' },
      ],
      words: ', dry and lit from above',
    },
    glued: {
      effects: [
        { deviceId: 'saturator', preset: 'Soft tape warmth' },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.1 } },
      ],
      words: ', pressed gently in a small booth',
    },
    reel: {
      effects: [{ deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1 } }],
      words: ', on quarter inch tape, nothing after',
    },
    cassette: {
      effects: [{ deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.2 } }],
      words: ', on a cassette',
    },
    blanket: {
      effects: [
        { deviceId: 'tape', preset: 'Under a blanket' },
        { deviceId: 'stereo-detune', preset: 'Soft halo' },
      ],
      words: ', under a blanket of old tape',
    },
    iron: {
      effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }],
      words: ', through a transformer, close and dry',
    },
    valve: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Triode glow' },
        { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.12 } },
      ],
      words: ', through a warm valve and a short plate',
    },
    edge: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Parallel grit' },
        { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 6000 } },
      ],
      words: ', with grit beside it',
    },
    combo: {
      effects: [{ deviceId: 're-amp', preset: 'Combo in a room' }],
      words: ', from a small loudspeaker in a room',
    },
    pillow: {
      effects: [{ deviceId: 're-amp', preset: 'Pillow speaker', params: { output: 2 } }],
      words: ', from a little speaker under a pillow',
    },
    cupboard: {
      effects: [{ deviceId: 're-amp', preset: 'In the cupboard', params: { room: 0.15 } }],
      words: ', from inside a cupboard',
    },
    board: {
      effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.4 } }],
      words: ', set on a wooden board',
    },
    pipe: {
      effects: [
        { deviceId: 'vessel', preset: 'Glass tube', params: { mix: 0.4 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', inside a glass tube in a small room',
    },
    pot: {
      effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.5 } }],
      words: ', inside a clay pot',
    },
    cistern: {
      effects: [
        { deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.45 } },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', down in a stone cistern',
    },
    tamed: {
      effects: [
        { deviceId: 'tamer', preset: 'Ringing tones', params: { depth: 0.7 } },
        { deviceId: 'spread', preset: 'Wide pad' },
      ],
      words: ', dry and wide, its ringing held down',
    },
    dense: {
      effects: [
        { deviceId: 'ambient-comp', preset: 'Dense pad', params: { makeup: 10 } },
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.2 } },
      ],
      words: ', held dense and near in a small room',
    },
    slap: {
      effects: [{ deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.28 } }],
      words: ', with one short slap of tape',
    },
    doubled: {
      effects: [
        { deviceId: 'stereo-detune', preset: 'Doubled' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', doubled a shade late on either side',
    },
    early: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Sampler' },
        { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.15 } },
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
      effects: [{ deviceId: 'vinyl', preset: 'New pressing', params: { crackle: 0.3 } }],
      words: ', on a fresh record',
    },
    parlour: {
      effects: [
        { deviceId: 'vinyl', preset: 'Parlour 78' },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.16 } },
      ],
      words: ', on an old fast record',
    },
    kitchen: {
      effects: [
        {
          deviceId: 'radio',
          preset: 'Kitchen radio',
          params: { static: 0.08, interference: 0.04 },
        },
      ],
      words: ', from a kitchen radio',
    },
    pane: {
      effects: [
        { deviceId: 'fog', preset: 'Behind glass', params: { mix: 0.75 } },
        { deviceId: 'stereo-widener', preset: 'Wide' },
      ],
      words: ', behind a thick pane',
    },
    blunt: {
      effects: [
        { deviceId: 'fog', preset: 'Short blur', params: { size: 45 } },
        { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.12 } },
      ],
      words: ', with every attack blunted',
    },
    felted: {
      effects: [{ deviceId: 'sift', preset: 'Felt and air' }],
      words: ', with the strikes wrapped in felt',
    },
    struck: {
      effects: [
        { deviceId: 'sift', preset: 'Strikes forward' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', with the strikes brought forward in a room',
    },
    shudder: {
      effects: [
        { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 4.4 } },
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.18 } },
      ],
      words: ', with a harmonic tremolo, close by',
    },
    throb: {
      effects: [
        { deviceId: 'tremolo', preset: 'Amp tremolo', params: { rate: 3.1, depth: 0.7 } },
        { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.15 } },
      ],
      words: ', throbbing in an old amplifier',
    },
    panned: {
      effects: [
        { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.35 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
      ],
      words: ', going slowly from side to side',
    },
    chorale: {
      effects: [
        { deviceId: 'rotary', preset: 'Chorale' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', from a slow turning horn',
    },
    spun: {
      effects: [
        { deviceId: 'rotary', preset: 'Far shimmer' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', from a horn spinning at the far wall',
    },
    flicker: {
      effects: [
        { deviceId: 'band-pulse', preset: 'Six a second' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
      ],
      words: ', with its middle flickering',
    },
    sung: {
      effects: [
        { deviceId: 'late-vibrato', preset: 'Singer', params: { depth: 26 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } },
      ],
      words: ', swaying late in a warm room',
    },
    lowgate: {
      effects: [
        {
          deviceId: 'auto-filter',
          preset: 'Low-pass gate',
          params: { cutoffHz: 420, envAmount: 45, envReleaseMs: 700, resonance: 1 },
        },
      ],
      words: ', through a filter each note opens',
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
      words: ', under a filter slowly opening and closing',
    },
    notch: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Slow notch', params: { lfoRateHz: 0.3 } },
        { deviceId: 'stereo-widener', preset: 'Wide' },
      ],
      words: ', with a notch walking through it',
    },
    wah: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Touch wah', params: { resonance: 2.5, mix: 0.5 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', with each strike saying a vowel',
    },
    phase: {
      effects: [
        { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.2, feedback: 20 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', in a slow swirl of phase',
    },
    comb: {
      effects: [
        {
          deviceId: 'flanger',
          preset: 'Slow sweep',
          params: { rate: 0.18, feedback: 15, mix: 0.4 },
        },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', under a slow sweeping comb',
    },
    ensemble: {
      effects: [
        { deviceId: 'chorus', preset: 'Lush ensemble' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', thickened to an ensemble in a room',
    },
    deepsea: {
      effects: [
        { deviceId: 'chorus', preset: 'Deep sea', params: { feedback: 10, mix: 0.5 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.25 } },
      ],
      words: ', in a deep dark chorus',
    },
    water: {
      effects: [
        { deviceId: 'glimmer', preset: 'Light on water' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
      ],
      words: ', with light moving over it in a hall',
    },
    ripple: {
      effects: [
        { deviceId: 'glimmer', preset: 'Rising ripple', params: { rate: 0.9 } },
        { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.2 } },
      ],
      words: ', rippling upward in a bright chamber',
    },
    current: {
      effects: [
        { deviceId: 'currents', preset: 'Wide tide', params: { rate: 0.22, depth: 0.6 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.25 } },
      ],
      words: ', drifting in slow bands on a plate',
    },
    lungs: {
      effects: [
        {
          deviceId: 'breath',
          preset: 'Calm breath',
          params: { in: 1.4, out: 1.9, hold: 0.2, rest: 0.2, depth: 0.5, air: 0.2 },
        },
        { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
      ],
      words: ', breathing in and out in a hall',
    },
    soft3: {
      effects: [
        { deviceId: 'pulses', preset: 'Soft throb', params: { rate: 2.4 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', in a soft threefold pulse',
    },
    weave: {
      effects: [
        { deviceId: 'pulses', preset: 'Wide weave', params: { rate: 6 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
      ],
      words: ', woven from side to side in quick pulses',
    },
    circle: {
      effects: [
        { deviceId: 'around', preset: 'Slow circle', params: { rate: 0.28 } },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', walking a circle round the head',
    },
    flock: {
      effects: [{ deviceId: 'murmuration', preset: 'Evening flock', params: { mix: 0.5 } }],
      words: ', as a flock round the listener',
    },
    slowing: {
      effects: [
        {
          deviceId: 'winding-down',
          preset: 'Ever slower',
          params: { rate: 3, halving: 6, depth: 0.75 },
        },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', in pulses that keep slowing',
    },
    echo: {
      effects: [{ deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.28 } }],
      words: ', with warm tape repeats',
    },
    dotted: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { time: 520, mix: 0.26 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', with a dotted echo crossing over',
    },
    dark: {
      effects: [
        {
          deviceId: 'analog-delay',
          preset: 'Murky',
          params: { time: 620, feedback: 0.4, mix: 0.34 },
        },
      ],
      words: ', with dull, murky repeats',
    },
    hop: {
      effects: [
        {
          deviceId: 'analog-delay',
          preset: 'Octave hop',
          params: { time: 360, feedback: 0.45, mix: 0.3 },
        },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', with echoes that hop an octave',
    },
    round: {
      effects: [
        {
          deviceId: 'canon',
          preset: 'Round of three',
          params: { gap: 0.8, mix: 0.36, tone: 6000 },
        },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', in a round of three',
    },
    mirror: {
      effects: [
        { deviceId: 'canon', preset: 'Mirror answer', params: { gap: 0.7, mix: 0.4 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
      ],
      words: ', answered by its own mirror',
    },
    unfold: {
      effects: [{ deviceId: 'prism', preset: 'Slow unfolding', params: { time: 1500, mix: 0.4 } }],
      words: ', unfolding colour by colour',
    },
    fan: {
      effects: [
        { deviceId: 'prism', preset: 'Four colours', params: { time: 700, mix: 0.36 } },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', fanned into four colours',
    },
    stars: {
      effects: [
        { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.36 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', with seven scattered echoes',
    },
    near: {
      effects: [{ deviceId: 'constellation', preset: 'Close flicker', params: { mix: 0.4 } }],
      words: ', in a close flicker of echoes',
    },
    stone: {
      effects: [{ deviceId: 'skipping-stone', preset: 'Skipping stone' }],
      words: ', skipping away like a stone',
    },
    ball: {
      effects: [
        { deviceId: 'skipping-stone', preset: 'Ball on glass', params: { mix: 0.32 } },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.12 } },
      ],
      words: ', bouncing like a ball on glass',
    },
    lift2: {
      effects: [
        { deviceId: 'grain-delay', preset: 'Crystals', params: { mix: 0.24 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
      ],
      words: ', with crystals an octave up',
    },
    embers: {
      effects: [
        { deviceId: 'grain-delay', preset: 'Falling embers', params: { mix: 0.32 } },
        { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.2 } },
      ],
      words: ', shedding embers an octave down',
    },
    back: {
      effects: [
        { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { time: 720, mix: 0.4 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', with its echo turned backwards',
    },
    undertow: {
      effects: [
        { deviceId: 'reverse-delay', preset: 'Undertow', params: { time: 1400, mix: 0.34 } },
        { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.2 } },
      ],
      words: ', over a backwards undertow',
    },
    recall: {
      effects: [
        { deviceId: 'echo-memory', preset: 'Flickers', params: { mix: 0.42 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', with flickers of what came before',
    },
    loops: {
      effects: [
        { deviceId: 'orbits', preset: 'Short canon', params: { mix: 0.36 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', in three loops out of step',
    },
    bed: {
      effects: [
        { deviceId: 'micro-looper', preset: 'Reverse bed', params: { length: 1.6, mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', over a soft bed run backwards',
    },
    pile: {
      effects: [{ deviceId: 'tape-loop', preset: 'One second round', params: { mix: 0.4 } }],
      words: ', piled up on a short tape loop',
    },
    cloud: {
      effects: [
        { deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.45 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.15 } },
      ],
      words: ', in a soft cloud of grains',
    },
    rain: {
      effects: [
        { deviceId: 'grain-cloud', preset: 'Octave rain', params: { mix: 0.32 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', under a rain of grains an octave up',
    },
    smear: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Slow smear', params: { mix: 0.55 } }],
      words: ', smeared into slow grains',
    },
    tide: {
      effects: [
        { deviceId: 'grain-cloud', preset: 'Low tide', params: { mix: 0.4 } },
        { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.2 } },
      ],
      words: ', over grains an octave below',
    },
    tiles: {
      effects: [
        { deviceId: 'cascade', preset: 'Glass rain', params: { mix: 0.34 } },
        { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.14 } },
      ],
      words: ', with small loops falling upward',
    },
    glint: {
      effects: [
        { deviceId: 'glints', preset: 'First light', params: { mix: 0.3 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.24 } },
      ],
      words: ', throwing sparks in a hall',
    },
    leaves: {
      effects: [
        { deviceId: 'falling', preset: 'Wilting', params: { mix: 0.45 } },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', with pieces that wilt as they fade',
    },
    mist: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.45 } }],
      words: ', hung in a fine mist',
    },
    whisper: {
      effects: [
        { deviceId: 'spectral-blur', preset: 'Whisper', params: { mix: 0.7 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', turned to a whisper of itself',
    },
    halo: {
      effects: [
        { deviceId: 'spectral-drifter', preset: 'Octave halo', params: { mix: 0.28 } },
        { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.22 } },
      ],
      words: ', with an octave halo in the air',
    },
    strings: {
      effects: [
        {
          deviceId: 'sustainer',
          preset: 'Slow strings',
          params: { attack: 0.8, decay: 4, mix: 0.45 },
        },
      ],
      words: ', held on as slow strings',
    },
    follow: {
      effects: [
        {
          deviceId: 'pad-follower',
          preset: 'String pad',
          params: { rise: 0.4, fall: 2.5, mix: 0.4 },
        },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', with a string pad grown behind it',
    },
    sines: {
      effects: [
        { deviceId: 'sine-shadow', preset: 'Sine shadow', params: { mix: 0.5 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: ', shadowed by pure tones',
    },
    sag: {
      effects: [
        { deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.4 } },
        { deviceId: 'ether-reverb', preset: 'Dark hall', params: { mix: 0.16 } },
      ],
      words: ', its tail sagging like wax',
    },
    rooms: {
      effects: [
        { deviceId: 'generations', preset: 'Into the room', params: { length: 1.1, mix: 0.45 } },
      ],
      words: ', copied over and over through a room',
    },
    slowed: {
      effects: [
        { deviceId: 'stretch', preset: 'Half time haze', params: { mix: 0.45 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', in a haze at half its pace',
    },
    hang: {
      effects: [
        { deviceId: 'common-tones', preset: 'Hanging notes', params: { mix: 0.65 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: ', with the shared tones left hanging',
    },
    organ: {
      effects: [
        { deviceId: 'octaves', preset: 'Organ', params: { up2: 0.15, filter: 4500 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', stacked in octaves like an organ',
    },
    under: {
      effects: [
        { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.6 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: ', with the octave below it',
    },
    flutes: {
      effects: [
        { deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.55 } },
        { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.24 } },
      ],
      words: ', with flute stops joining in',
    },
    above: {
      effects: [
        { deviceId: 'pitch-shifter', preset: 'Shimmer', params: { mix: 0.26 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.22 } },
      ],
      words: ', with a grainy octave above',
    },
    half: {
      effects: [
        { deviceId: 'half-speed', preset: 'Under the mix', params: { mix: 0.42 } },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', over itself at half speed',
    },
    chime: {
      effects: [
        { deviceId: 'warp', preset: 'Soft chime' },
        { deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.18 } },
      ],
      words: ', its tones warped to a chime',
    },
    giant: {
      effects: [
        { deviceId: 'size', preset: 'Larger', params: { size: 0.6 } },
        { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.22 } },
      ],
      words: ', grown to twice its size',
    },
    small: {
      effects: [
        { deviceId: 'size', preset: 'Music box', params: { size: -0.7 } },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.14 } },
      ],
      words: ', shrunk into a little box',
    },
    ringing: {
      effects: [
        { deviceId: 'ring', preset: 'Faint halo', params: { mix: 0.2 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', with a thin ring of sidebands',
    },
    parted: {
      effects: [
        { deviceId: 'freq-shifter', preset: 'Detuned', params: { fine: 2.5 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', parted by a few hertz',
    },
    vowel: {
      effects: [
        { deviceId: 'imprint', preset: 'Open vowel', params: { amount: 0.9 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', shaped by an open vowel',
    },
    whistle: {
      effects: [
        {
          deviceId: 'overtone-singer',
          preset: 'Slow wander',
          params: { root: 2, pace: 0.5, glide: 900, mix: 0.7 },
        },
        { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', with a whistled overtone wandering',
    },
    hall: { effects: [{ deviceId: 'hall-reverb', preset: 'Hall' }], words: ', in a wide hall' },
    shadow: {
      effects: [
        { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.36 } },
        { deviceId: 'ambient-eq', preset: 'Drone' },
      ],
      words: ', in a long dark hall',
    },
    nave: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.38 } }],
      words: ', in a stone nave',
    },
    plate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.36 } }],
      words: ', on a long plate',
    },
    bright: {
      effects: [
        { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.32 } },
        { deviceId: 'chorus', preset: 'Faint air' },
      ],
      words: ', on a bright plate',
    },
    dull: {
      effects: [
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.36 } },
        { deviceId: 'tape', preset: 'Clean transfer', params: { drive: 0.15 } },
      ],
      words: ', on a dark plate',
    },
    valley: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.36 } }],
      words: ', across an open valley',
    },
    cave: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.4 } }],
      words: ', in a dark cave',
    },
    late: {
      effects: [
        { deviceId: 'fdn-reverb', preset: 'Late arrival', params: { mix: 0.36 } },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', in a hall that answers late',
    },
    chapel: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.36 } }],
      words: ', in a chapel that hums along',
    },
    choir: {
      effects: [
        { deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.38 } },
        { deviceId: 'stereo-widener', preset: 'Wide' },
      ],
      words: ', in a hall whose tail sings',
    },
    bloom: {
      effects: [
        {
          deviceId: 'bloom-reverb',
          preset: 'Rising fifths',
          params: { bloom: 0.5, decay: 5, mix: 0.36 },
        },
      ],
      words: ', in a hall that blooms in fifths',
    },
    climb: {
      effects: [
        { deviceId: 'shimmer', preset: 'Rising choir', params: { shimmer: 0.4, mix: 0.32 } },
      ],
      words: ', under a tail that climbs in octaves',
    },
    fifths: {
      effects: [
        { deviceId: 'shimmer', preset: 'Fifths', params: { shimmer: 0.3, mix: 0.34 } },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', under a tail that climbs in fifths',
    },
    springs: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring' }],
      words: ', in three long springs',
    },
    splash: {
      effects: [
        { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.3 } },
        { deviceId: 'analog-drive', preset: 'First hint' },
      ],
      words: ', dripping into two springs',
    },
    open: {
      effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.36 } }],
      words: ', in a huge open space',
    },
    event: {
      effects: [{ deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.4, decay: 9 } }],
      words: ', in a space that swells up after it',
    },
    steps: {
      effects: [
        { deviceId: 'expanse', preset: 'Hard echoes', params: { mix: 0.3 } },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', among hard scattered echoes',
    },
    warmwall: {
      effects: [
        { deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.3 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', in a faint fuzzy warmth',
    },
    glow: {
      effects: [
        { deviceId: 'haze', preset: 'Octave glow', params: { haze: 0.35, decay: 4, mix: 0.32 } },
      ],
      words: ', in a glowing octave haze',
    },
    swarm: {
      effects: [
        { deviceId: 'swarm-reverb', preset: 'Pattering', params: { feedback: 0.45, mix: 0.36 } },
      ],
      words: ', pattering away in a swarm',
    },
    spiral: {
      effects: [{ deviceId: 'spiral', preset: 'Slow ascent', params: { mix: 0.34 } }],
      words: ', on a tail that climbs and never lands',
    },
    sink: {
      effects: [
        { deviceId: 'spiral', preset: 'Slow descent', params: { mix: 0.34 } },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', on a tail that sinks and never lands',
    },
    reverse: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { time: 0.9, mix: 0.4 } }],
      words: ', with its room turned backwards',
    },
    gated: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { time: 0.45, mix: 0.36 } }],
      words: ', in a room that stops dead',
    },
    tidal: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Ripples', params: { time: 0.6, mix: 0.4 } }],
      words: ', in a room that comes in ripples',
    },
    wires: {
      effects: [
        { deviceId: 'sympathetic', preset: 'Piano pedal', params: { decay: 4, mix: 0.42 } },
      ],
      words: ', over strings that ring with it',
    },
    bowls: {
      effects: [
        { deviceId: 'bowls', preset: 'Bowl table', params: { mix: 0.32 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', beside bowls that answer',
    },
    silent: {
      effects: [
        { deviceId: 'silent-keys', preset: 'Short answer', params: { mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', over a silently held chord',
    },
    far: {
      effects: [{ deviceId: 'distance', preset: 'Back of the hall' }],
      words: ', from the back of a hall',
    },
    shore: {
      effects: [
        { deviceId: 'distance', preset: 'Far shore', params: { level: 0.95 } },
        { deviceId: 'ambient-eq', preset: 'Bright', params: { presence: 2, air: 3 } },
      ],
      words: ', from a far shore',
    },
    freeze: {
      effects: [
        { deviceId: 'ether-reverb', preset: 'Soft freeze', params: { mix: 0.3 } },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', with the last of it frozen',
    },
    blueair: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Shining tail', params: { mix: 0.28 } }],
      words: ', in a shining tail',
    },
    drops: {
      effects: [
        { deviceId: 'weather', preset: 'Light rain', params: { voice: 0.25 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', out in a light rain',
    },
    gusts: {
      effects: [
        { deviceId: 'weather', preset: 'Breezy day', params: { voice: 0.2, pace: 2 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', taken up and dropped by gusts',
    },
    shallow: {
      effects: [
        { deviceId: 'underwater', preset: 'Sunlit shallows' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', in sunlit shallows',
    },
    deepw: {
      effects: [
        { deviceId: 'underwater', preset: 'Heavy water', params: { depth: 0.6, bubbles: 0.05 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.18 } },
      ],
      words: ', under heavy water',
    },
    frost: {
      effects: [{ deviceId: 'seasons', preset: 'First frost', params: { turn: 0 } }],
      words: ', on the morning of a first frost',
    },
    summer: {
      effects: [{ deviceId: 'seasons', preset: 'Touch of sun', params: { turn: 0, depth: 0.5 } }],
      words: ', in a touch of sun',
    },
    dust: {
      effects: [
        { deviceId: 'noise-floor', preset: 'Faint hiss', params: { level: -58 } },
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.2 } },
      ],
      words: ', in a small room with a little hiss',
    },
    buzz: {
      effects: [
        { deviceId: 'buzzing-bridge', preset: 'Harp on a bridge', params: { amount: 0.3 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', buzzing on a curved bridge',
    },
    worn: {
      effects: [
        { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.15, wear: 0.4 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', worn down by many plays',
    },
    lossy: {
      effects: [
        { deviceId: 'low-bitrate', preset: 'Watery trace', params: { mix: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', with a watery trace around it',
    },
    slips: {
      effects: [
        { deviceId: 'glitch', preset: 'Gentle stumble', params: { chance: 0.3, time: 300 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', stumbling now and then',
    },
    moved: {
      effects: [
        { deviceId: 'scale-filter', preset: 'Wide and gentle', params: { root: 0, scale: 0 } },
        { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.22 } },
      ],
      words: ', strained through one scale',
    },
    reveal: {
      effects: [
        { deviceId: 'reveal', preset: 'Overtones' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', with what was quiet brought near',
    },
    tails: {
      effects: [
        { deviceId: 'lift', preset: 'Long tails' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', with its tails brought forward',
    },
    bowed: {
      effects: [
        { deviceId: 'swell', preset: 'Bowed', params: { attack: 520 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.26 } },
      ],
      words: ', with every attack faded in, in a hall',
    },
  },
  phrases: {
    rise: {
      notes: [
        { atSec: 0, durSec: 6.8, note: 50, gain: 0.7 },
        { atSec: 0.9, durSec: 5.9, note: 57, gain: 0.6 },
        { atSec: 1.8, durSec: 5, note: 64, gain: 0.55 },
        { atSec: 2.8, durSec: 4, note: 67, gain: 0.5 },
        { atSec: 3.8, durSec: 3.2, note: 74, gain: 0.5 },
      ],
    },
    ninth: {
      notes: [
        { atSec: 0, durSec: 5.4, note: 53, gain: 0.7 },
        { atSec: 0, durSec: 5.4, note: 60, gain: 0.55 },
        { atSec: 0.05, durSec: 5.3, note: 64, gain: 0.5 },
        { atSec: 0.1, durSec: 5.3, note: 67, gain: 0.5 },
        { atSec: 0.15, durSec: 5.2, note: 71, gain: 0.4 },
      ],
    },
    sevenths: {
      notes: [
        { atSec: 0, durSec: 2, note: 57, gain: 0.65 },
        { atSec: 2, durSec: 2, note: 55, gain: 0.6 },
        { atSec: 4, durSec: 2, note: 53, gain: 0.6 },
        { atSec: 6, durSec: 1.3, note: 52, gain: 0.6 },
        { atSec: 0, durSec: 3, note: 65, gain: 0.6 },
        { atSec: 3, durSec: 2, note: 64, gain: 0.55 },
        { atSec: 5, durSec: 1.5, note: 62, gain: 0.55 },
        { atSec: 6.5, durSec: 0.85, note: 60, gain: 0.5 },
      ],
    },
    contrary: {
      notes: [
        { atSec: 0, durSec: 1.3, note: 64, gain: 0.6 },
        { atSec: 1.2, durSec: 1.3, note: 65, gain: 0.6 },
        { atSec: 2.4, durSec: 1.3, note: 67, gain: 0.6 },
        { atSec: 3.6, durSec: 1.3, note: 69, gain: 0.65 },
        { atSec: 4.8, durSec: 2.3, note: 72, gain: 0.6 },
        { atSec: 0, durSec: 1.3, note: 60, gain: 0.5 },
        { atSec: 1.2, durSec: 1.3, note: 57, gain: 0.5 },
        { atSec: 2.4, durSec: 1.3, note: 55, gain: 0.5 },
        { atSec: 3.6, durSec: 1.3, note: 53, gain: 0.5 },
        { atSec: 4.8, durSec: 2.3, note: 48, gain: 0.6 },
      ],
    },
    ostinato: {
      notes: [
        { atSec: 0.0, durSec: 0.6, note: 57, gain: 0.7 },
        { atSec: 0.45, durSec: 0.6, note: 64, gain: 0.45 },
        { atSec: 0.9, durSec: 0.6, note: 69, gain: 0.5 },
        { atSec: 1.35, durSec: 0.6, note: 64, gain: 0.4 },
        { atSec: 1.8, durSec: 0.6, note: 60, gain: 0.6 },
        { atSec: 2.25, durSec: 0.6, note: 64, gain: 0.4 },
        { atSec: 2.7, durSec: 0.6, note: 71, gain: 0.5 },
        { atSec: 3.15, durSec: 0.6, note: 64, gain: 0.4 },
        { atSec: 3.6, durSec: 0.6, note: 57, gain: 0.65 },
        { atSec: 4.05, durSec: 0.6, note: 64, gain: 0.4 },
        { atSec: 4.5, durSec: 0.6, note: 72, gain: 0.5 },
        { atSec: 4.95, durSec: 0.6, note: 64, gain: 0.4 },
        { atSec: 5.4, durSec: 0.6, note: 62, gain: 0.6 },
      ],
    },
    peal: {
      notes: [
        { atSec: 0, durSec: 0.7, note: 84, gain: 0.6 },
        { atSec: 0.9, durSec: 0.6, note: 79, gain: 0.5 },
        { atSec: 1.8, durSec: 0.6, note: 76, gain: 0.55 },
        { atSec: 2.9, durSec: 0.6, note: 81, gain: 0.5 },
        { atSec: 4.2, durSec: 1, note: 88, gain: 0.4 },
        { atSec: 4.4, durSec: 1.4, note: 72, gain: 0.55 },
      ],
    },
    deep: {
      notes: [
        { atSec: 0, durSec: 6.6, note: 38, gain: 0.7 },
        { atSec: 0.6, durSec: 6, note: 45, gain: 0.5 },
      ],
    },
    lowline: {
      notes: [
        { atSec: 0, durSec: 1.5, note: 36, gain: 0.8 },
        { atSec: 1.8, durSec: 1.1, note: 43, gain: 0.6 },
        { atSec: 3.1, durSec: 1.3, note: 41, gain: 0.65 },
        { atSec: 4.6, durSec: 2.6, note: 38, gain: 0.75 },
      ],
    },
    walk: {
      notes: [
        { atSec: 0, durSec: 0.6, note: 33, gain: 0.8 },
        { atSec: 0.75, durSec: 0.5, note: 40, gain: 0.6 },
        { atSec: 1.5, durSec: 0.6, note: 36, gain: 0.7 },
        { atSec: 2.25, durSec: 0.5, note: 38, gain: 0.6 },
        { atSec: 3, durSec: 0.9, note: 43, gain: 0.7 },
        { atSec: 4.1, durSec: 0.5, note: 41, gain: 0.6 },
        { atSec: 4.8, durSec: 2, note: 33, gain: 0.75 },
      ],
    },
    lowsteps: {
      notes: [
        { atSec: 0, durSec: 0.45, note: 38, gain: 0.8 },
        { atSec: 0.6, durSec: 0.4, note: 38, gain: 0.55 },
        { atSec: 1.2, durSec: 0.45, note: 45, gain: 0.6 },
        { atSec: 1.8, durSec: 0.9, note: 43, gain: 0.65 },
        { atSec: 3, durSec: 0.45, note: 36, gain: 0.8 },
        { atSec: 3.6, durSec: 0.4, note: 36, gain: 0.55 },
        { atSec: 4.2, durSec: 0.45, note: 43, gain: 0.6 },
        { atSec: 4.8, durSec: 1.6, note: 41, gain: 0.7 },
      ],
    },
    lowcall: {
      notes: [
        { atSec: 0, durSec: 2.1, note: 31, gain: 0.8 },
        { atSec: 2.4, durSec: 0.8, note: 38, gain: 0.6 },
        { atSec: 3.3, durSec: 0.8, note: 36, gain: 0.6 },
        { atSec: 4.3, durSec: 2.7, note: 33, gain: 0.75 },
      ],
    },
    pedal: {
      notes: [
        { atSec: 0, durSec: 7.1, note: 36, gain: 0.65 },
        { atSec: 0.4, durSec: 2, note: 60, gain: 0.5 },
        { atSec: 0.4, durSec: 2, note: 67, gain: 0.45 },
        { atSec: 2.5, durSec: 2, note: 62, gain: 0.5 },
        { atSec: 2.5, durSec: 2, note: 65, gain: 0.45 },
        { atSec: 4.6, durSec: 2.5, note: 59, gain: 0.5 },
        { atSec: 4.6, durSec: 2.5, note: 64, gain: 0.45 },
      ],
    },
    calls: {
      notes: [
        { atSec: 0, durSec: 0.9, note: 72, gain: 0.65 },
        { atSec: 0.7, durSec: 0.7, note: 76, gain: 0.5 },
        { atSec: 1.8, durSec: 1.4, note: 55, gain: 0.7 },
        { atSec: 3.4, durSec: 0.8, note: 74, gain: 0.6 },
        { atSec: 4.1, durSec: 0.7, note: 79, gain: 0.45 },
        { atSec: 5.1, durSec: 1.8, note: 52, gain: 0.65 },
        { atSec: 5.3, durSec: 1.6, note: 59, gain: 0.5 },
      ],
    },
    one: { notes: [{ atSec: 0, durSec: 6.6, note: 57, gain: 0.7 }] },
    onehigh: { notes: [{ atSec: 0, durSec: 5.8, note: 74, gain: 0.6 }] },
    onelow: { notes: [{ atSec: 0, durSec: 6.6, note: 41, gain: 0.75 }] },
    tenths: {
      notes: [
        { atSec: 0, durSec: 1.8, note: 48, gain: 0.65 },
        { atSec: 0, durSec: 1.8, note: 64, gain: 0.55 },
        { atSec: 1.8, durSec: 1.8, note: 50, gain: 0.6 },
        { atSec: 1.8, durSec: 1.8, note: 65, gain: 0.55 },
        { atSec: 3.6, durSec: 1.8, note: 53, gain: 0.6 },
        { atSec: 3.6, durSec: 1.8, note: 69, gain: 0.55 },
        { atSec: 5.4, durSec: 1.9, note: 52, gain: 0.6 },
        { atSec: 5.4, durSec: 1.9, note: 67, gain: 0.5 },
      ],
    },
    fourths: {
      notes: [
        { atSec: 0, durSec: 5.9, note: 50, gain: 0.65 },
        { atSec: 0, durSec: 5.9, note: 55, gain: 0.5 },
        { atSec: 0.02, durSec: 5.8, note: 60, gain: 0.5 },
        { atSec: 0.04, durSec: 5.8, note: 65, gain: 0.5 },
        { atSec: 0.06, durSec: 5.8, note: 69, gain: 0.45 },
      ],
    },
    tune: {
      notes: [
        { atSec: 0, durSec: 1.4, note: 62, gain: 0.6 },
        { atSec: 1.3, durSec: 0.8, note: 64, gain: 0.5 },
        { atSec: 2, durSec: 1.6, note: 69, gain: 0.65 },
        { atSec: 3.5, durSec: 0.8, note: 67, gain: 0.5 },
        { atSec: 4.2, durSec: 0.9, note: 65, gain: 0.5 },
        { atSec: 5, durSec: 2.2, note: 64, gain: 0.6 },
      ],
    },
    broken: {
      notes: [
        { atSec: 0.0, durSec: 1.5, note: 48, gain: 0.75 },
        { atSec: 0.28, durSec: 1.5, note: 55, gain: 0.73 },
        { atSec: 0.56, durSec: 1.5, note: 60, gain: 0.71 },
        { atSec: 0.84, durSec: 1.5, note: 64, gain: 0.69 },
        { atSec: 1.12, durSec: 1.5, note: 67, gain: 0.67 },
        { atSec: 1.4, durSec: 1.5, note: 72, gain: 0.65 },
        { atSec: 1.68, durSec: 1.5, note: 76, gain: 0.63 },
        { atSec: 1.96, durSec: 1.5, note: 72, gain: 0.61 },
        { atSec: 2.24, durSec: 1.5, note: 67, gain: 0.59 },
        { atSec: 2.52, durSec: 1.5, note: 64, gain: 0.57 },
        { atSec: 3.2, durSec: 2.6, note: 53, gain: 0.65 },
        { atSec: 3.5, durSec: 2.2, note: 60, gain: 0.5 },
        { atSec: 3.8, durSec: 2, note: 69, gain: 0.5 },
      ],
    },
    sparse: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 76, gain: 0.6 },
        { atSec: 1.1, durSec: 0.4, note: 83, gain: 0.45 },
        { atSec: 1.9, durSec: 0.5, note: 71, gain: 0.55 },
        { atSec: 3.3, durSec: 0.4, note: 79, gain: 0.5 },
        { atSec: 3.7, durSec: 0.4, note: 88, gain: 0.35 },
        { atSec: 5.2, durSec: 0.8, note: 74, gain: 0.55 },
      ],
    },
    hocket: {
      notes: [
        { atSec: 0.0, durSec: 0.5, note: 52, gain: 0.65 },
        { atSec: 0.6, durSec: 0.5, note: 71, gain: 0.5 },
        { atSec: 1.2, durSec: 0.5, note: 57, gain: 0.65 },
        { atSec: 1.8, durSec: 0.5, note: 72, gain: 0.5 },
        { atSec: 2.4, durSec: 0.5, note: 55, gain: 0.65 },
        { atSec: 3.0, durSec: 0.5, note: 76, gain: 0.5 },
        { atSec: 3.6, durSec: 0.5, note: 53, gain: 0.65 },
        { atSec: 4.2, durSec: 0.5, note: 74, gain: 0.5 },
        { atSec: 4.8, durSec: 0.5, note: 50, gain: 0.65 },
        { atSec: 5.4, durSec: 0.5, note: 69, gain: 0.5 },
      ],
    },
    lifted: {
      notes: [
        { atSec: 0, durSec: 1.1, note: 50, gain: 0.7 },
        { atSec: 0, durSec: 1.1, note: 57, gain: 0.6 },
        { atSec: 0, durSec: 1.1, note: 65, gain: 0.6 },
        { atSec: 2.6, durSec: 1.2, note: 55, gain: 0.65 },
        { atSec: 2.6, durSec: 1.2, note: 59, gain: 0.55 },
        { atSec: 2.6, durSec: 1.2, note: 62, gain: 0.55 },
        { atSec: 5.2, durSec: 0.8, note: 48, gain: 0.6 },
        { atSec: 5.2, durSec: 0.8, note: 55, gain: 0.5 },
        { atSec: 5.2, durSec: 0.8, note: 64, gain: 0.5 },
      ],
    },
    turn: {
      notes: [
        { atSec: 0, durSec: 3.3, note: 57, gain: 0.65 },
        { atSec: 0, durSec: 3.3, note: 64, gain: 0.5 },
        { atSec: 0, durSec: 3.3, note: 67, gain: 0.45 },
        { atSec: 0, durSec: 3.3, note: 72, gain: 0.5 },
        { atSec: 3.5, durSec: 3.5, note: 50, gain: 0.65 },
        { atSec: 3.5, durSec: 3.5, note: 65, gain: 0.5 },
        { atSec: 3.5, durSec: 3.5, note: 69, gain: 0.45 },
        { atSec: 3.5, durSec: 3.5, note: 72, gain: 0.5 },
      ],
    },
    open: {
      notes: [
        { atSec: 0, durSec: 7.1, note: 38, gain: 0.6 },
        { atSec: 0, durSec: 7.1, note: 45, gain: 0.45 },
        { atSec: 1.2, durSec: 5.9, note: 57, gain: 0.45 },
        { atSec: 2.6, durSec: 4.5, note: 64, gain: 0.4 },
      ],
    },
    again: {
      notes: [
        { atSec: 0, durSec: 0.8, note: 60, gain: 0.65 },
        { atSec: 0.9, durSec: 0.8, note: 60, gain: 0.5 },
        { atSec: 1.8, durSec: 0.8, note: 60, gain: 0.6 },
        { atSec: 2.7, durSec: 0.8, note: 60, gain: 0.45 },
        { atSec: 3.6, durSec: 1.8, note: 60, gain: 0.65 },
        { atSec: 0, durSec: 3.4, note: 53, gain: 0.45 },
        { atSec: 3.6, durSec: 3.2, note: 52, gain: 0.45 },
      ],
    },
    snow: {
      notes: [
        { atSec: 0, durSec: 0.35, note: 91, gain: 0.45 },
        { atSec: 0.5, durSec: 0.35, note: 86, gain: 0.4 },
        { atSec: 1.3, durSec: 0.35, note: 88, gain: 0.45 },
        { atSec: 2.1, durSec: 0.35, note: 83, gain: 0.4 },
        { atSec: 3.1, durSec: 0.4, note: 93, gain: 0.35 },
        { atSec: 3.9, durSec: 0.4, note: 84, gain: 0.45 },
        { atSec: 5, durSec: 0.6, note: 79, gain: 0.5 },
      ],
    },
    stride: {
      notes: [
        { atSec: 0, durSec: 0.9, note: 41, gain: 0.75 },
        { atSec: 0.9, durSec: 0.8, note: 60, gain: 0.5 },
        { atSec: 0.9, durSec: 0.8, note: 64, gain: 0.45 },
        { atSec: 1.8, durSec: 0.9, note: 38, gain: 0.7 },
        { atSec: 2.7, durSec: 0.8, note: 57, gain: 0.5 },
        { atSec: 2.7, durSec: 0.8, note: 65, gain: 0.45 },
        { atSec: 3.6, durSec: 2.6, note: 43, gain: 0.75 },
        { atSec: 4.5, durSec: 1.7, note: 59, gain: 0.5 },
        { atSec: 4.5, durSec: 1.7, note: 62, gain: 0.45 },
      ],
    },
  },
  directions: [
    {
      id: 'crystal-dawn',
      name: 'Crystal dawn',
      category: 'pad',
      rows: `
Window facing east | Crystal dawn | cooling=4.5 edge=.6 breath=.7 bright=.3 order=.75 remelt=.25 every=5 ticks=.6 neighbours=0.2 stretch=0.67 | hall | rise | Crystal clears from its top tone down over four seconds, its octaves drawn out to ninths
Grey before the gulls | Crystal dawn | breath=.9 bright=.12 edge=.8 width=.4 volume=1.5 cooling=16 neighbours=0.45 order=0.75 remelt=0.3 every=2.4 | shadow | ninth | Crystal kept dull and blown, hardly set at all
Dew on the pane | Crystal dawn | cooling=2.2 ticks=.9 edge=.1 blows=.3 turn=1.4 neighbours=0.2 order=0.8 remelt=0.4 every=1.4 bright=.4 | water | sevenths | Crystal sets note by note with a ping for every tone
Lamp left on at six | Crystal dawn | cooling=3 ring=24 blows=.35 turn=.4 neighbours=.8 stretch=-.45 order=0.7 remelt=0.15 every=1.4 volume=4.5 | plate 1.mix=.28 | fourths | Crystal with its overtones drawn close, struck again every two or three seconds
The sill warms first | Crystal dawn | heat=.7 cooling=1.6 bright=.4 breath=.35 release=Remelt tail=5 volume=1.5 neighbours=0.15 order=0.85 stretch=-0.67 remelt=0.25 every=9 | follow | turn | Crystal sets in a second, its octaves pulled in to sevenths, and sinks from below when let go
White heat going | - | heat=1 cooling=3.2 edge=.05 ticks=1 blows=0 breath=.2 ring=12 tail=5 remelt=0 neighbours=0.9 order=0.64 stretch=0.67 volume=-1.5 | chamber | rise | White hot glass, its tones spread wide, sets one clear ping at a time from the top
Comb of small lights | - | heat=.95 cooling=1.8 edge=0 ticks=.85 bright=.75 blows=0 ring=9 width=1 stretch=.25 order=.8 neighbours=0.2 | stars | ninth | Glass pings quickly down its whole row of tones
Blue at the edges | - | heat=.9 cooling=5 edge=.15 bright=.65 breath=.6 blows=.2 turn=.7 remelt=0 tail=6 volume=-1 neighbours=1 order=0.75 width=0.3 | blueair | tenths | Glass bright at the top long before its warm floor has cleared
Seven minutes of light | - | edge=.2 ticks=.6 stretch=.4 breath=.5 blows=.1 remelt=0 ring=16 volume=1.5 heat=.75 cooling=20 neighbours=0.2 | valley | open | Glass with its tones drawn wide clears very slowly
Shutters, slat by slat | - | heat=.85 cooling=2 edge=.02 ticks=.7 strike=Rod blows=.75 turn=2.4 ring=5 remelt=0 order=0.85 volume=-2 | dotted | fourths | An iron rod knocks at each tone of glass as it clears
Fog burning off | - | heat=.85 cooling=2.4 edge=1 ticks=0 breath=.85 strike=Pour remelt=0 bright=.35 rest=0.28 width=0.5 blows=.25 turn=.35 | mist | turn | Glass comes up all together out of moving air
Milk in the glass | Crystal dawn | edge=1 cooling=1.4 ticks=0 breath=.8 blows=0 bright=.1 ring=20 width=.5 neighbours=0.9 order=0.75 rest=0.2 volume=1.5 | blunt | ninth | Crystal gathers without an edge, round and low in tone
Pale field at midday | - | matter=Crystal edge=.9 heat=.6 cooling=3.5 breath=1 blows=0 strike=Pour bright=.6 ticks=.05 remelt=0 tail=8 neighbours=0.15 order=0.85 width=0.3 | open | - | Crystal sings up broadly under a strong breath
Curtain breathing in | - | edge=.85 heat=.75 cooling=1.2 breath=.7 blows=.15 turn=.4 ticks=0 remelt=.5 every=3.2 bright=.3 ring=10 volume=0 neighbours=0.7 order=0.88 width=0.9 | lungs | sevenths | Glass swells up broad and soft and is warmed again
Slow colour on plaster | - | matter=Bronze heat=.8 cooling=3 breath=.9 blows=0 ticks=0 tail=6 volume=4.5 strike=Tap edge=.95 stretch=.35 bright=.6 remelt=.4 every=5 order=.8 ring=12 neighbours=0.8 rest=0.16 | dull | fourths | Wide bronze comes up all together under a strong breath
Larks over the hothouse | Crystal dawn | heat=.6 cooling=.9 ticks=.6 blows=.5 turn=3 ring=8 edge=.2 tail=3 volume=1.5 neighbours=0.2 order=0.75 bright=.5 | glint | peal | Small high crystal sets at once and is struck quickly
Frost leaving the roof | - | matter=Crystal heat=.5 cooling=1.4 bright=.7 strike=Tap blows=.4 turn=1.8 order=.6 ring=12 remelt=0 volume=6 neighbours=0.9 stretch=0.67 | ripple | snow | Loose crystal taps lie scattered at the top of the keys
Kite string humming | - | matter=Glass heat=.7 cooling=.8 stretch=.8 remelt=0 tail=2 volume=1.5 neighbours=0.1 order=0.88 rest=0.16 blows=.4 turn=.35 strike=Drop ring=22 breath=1 bright=.5 | phase | onehigh | One thin high glass sings in the wind, a drop now and then
First tram wires | - | matter=Salt heat=.6 cooling=1 bright=.75 breath=.6 ticks=.5 blows=.3 turn=2 width=.9 remelt=0 volume=4 neighbours=0.1 edge=0.85 | shallow | sparse | Hollow salt glitters high and dies quickly
Swallows under the beam | Cold top | cooling=.7 turn=4 rest=.3 bright=.8 strike=Rod ring=3 volume=-1 neighbours=0.8 order=0.85 | hop | hocket | A rod chatters on the cold top of warm glass
River still dark | Crystal dawn | bright=.4 breath=1 edge=.6 ring=20 volume=6 stretch=-.6 rest=.3 remelt=.4 every=7 order=.7 heat=.75 cooling=30 neighbours=0.9 blows=.3 turn=.3 | cave | deep | A low fifth of crystal pressed close, breathing and never quite clear | drone
Barge with one light | - | heat=.8 cooling=4 bright=.25 blows=.6 turn=.6 strike=Tap ring=9 remelt=0 tail=5 width=.3 volume=1 neighbours=0.45 stretch=-0.67 | echo | pedal | A palm taps deep glass that clears very late, a seventh over each note
Peak above the mountain | - | matter=Bronze heat=1 cooling=5 breath=.5 blows=.3 turn=.35 bright=.4 edge=.4 ring=20 tail=8 volume=-0.5 neighbours=0.2 order=0.88 width=0.8 remelt=.2 every=5 | nave | open | Low bronze whose upper tones show long before its hum
Cellar door at dawn | - | matter=Obsidian heat=.9 breath=.7 blows=.25 turn=.5 remelt=0 tail=3 volume=4.5 neighbours=0.2 edge=0.15 cooling=3 bright=.75 | door | lowline | Dark obsidian moves as warm air under a lid, slow to set | bass
Keel in shallow water | Molten bass | cooling=3 rest=.1 bright=.35 breath=.6 blows=.5 turn=1.1 tail=4 ring=9 heat=.8 neighbours=0 stretch=0.67 | deepw | onelow | A low drop of widened glass clears slowly and is struck on as it does
Only the steeple lit | Cold top | rest=.55 cooling=.8 blows=.4 turn=1.2 breath=.8 bright=.5 release=Anneal volume=-3.5 neighbours=0.8 order=0.64 edge=0.7 | hall 1.mix=.25 | fourths | The top rings hard over glass that is kept soft
Ridge line catching fire | Cold top | matter=Crystal blows=.2 turn=.8 breath=.9 ring=20 tail=6 release=Anneal volume=-3.5 neighbours=0.8 order=0.64 stretch=0.67 edge=0.08 width=1 rest=.42 bright=.15 | climb | ninth | Nothing but a wide crest of crystal is ever set
Snow line | Cold top | rest=.35 heat=.8 cooling=2 blows=.6 turn=1 strike=Drop breath=.4 bright=.4 remelt=0 ring=5 volume=0.5 neighbours=0.9 order=0.85 edge=0.6 | table | tenths | Glass clears to its middle and stops there
Warm hands, cold rim | Cold top | rest=.6 matter=Bronze strike=Tap blows=1 turn=1.5 breath=.3 bright=.8 ticks=.2 volume=5.5 neighbours=0.6 stretch=0.4 edge=0.6 | bowls | sevenths | The rim of warm bronze is tapped and tapped
Half the valley in sun | Cold top | rest=.45 edge=.9 strike=Pour blows=.5 turn=.5 breath=.7 ticks=0 bright=.45 width=1 volume=-0.5 neighbours=0.6 order=0.75 | current | turn | A broad border of half set glass lies under a pour
Bell from the next bay | - | matter=Bronze heat=.75 cooling=2.2 strike=Drop blows=.25 turn=.3 breath=.35 bright=.45 ring=22 remelt=0 tail=9 volume=-2.5 order=.6 stretch=-.2 edge=.1 ticks=.8 | far | ninth | Loose bronze pings clear into a slow bell with a hum beneath
Copper in the rain | - | matter=Bronze heat=.85 cooling=1.2 strike=Rod blows=.7 turn=1.7 breath=.1 order=.7 ring=6 remelt=0 width=.9 when=Set volume=2 neighbours=0.2 | drops | fourths | Loose bronze waits, hardly touched, then is worked on with iron once it has set
Gong before it speaks | - | matter=Bronze heat=1 cooling=3.5 stretch=-.5 strike=Tap blows=.15 turn=.3 breath=.7 edge=.7 bright=.3 remelt=0 tail=7 volume=3 neighbours=0.1 rest=0.28 width=0.8 | giant | open | Bronze with its tones pressed together gathers for seconds
Old sun on brass rails | - | matter=Bronze heat=.5 strike=Pour blows=.6 turn=.45 breath=.6 bright=.6 remelt=.3 every=2 ring=10 when=Set cooling=.9 volume=-5 order=0.85 | chorale | turn | Breath on bronze, poured over each time it is hard
Harbour bell in no haste | - | matter=Bronze heat=.6 cooling=.9 strike=Rod when=Both blows=0 breath=.15 bright=.5 ring=16 remelt=0 tail=10 volume=-1 neighbours=0.6 order=0.75 stretch=-0.3 width=0.3 rest=.14 edge=.1 | late | lifted | Bronze struck as the key goes down and again as it comes up
Breath on cold windows | - | heat=.9 cooling=2.6 breath=1 blows=0 strike=Tap ticks=.1 bright=.5 remelt=0 edge=.5 tail=4 volume=-4.5 when=Release neighbours=0.7 order=0.88 stretch=0.67 | whisper | turn | A hard breath on hot glass, tapped only as it is let go
Reeds before the wind | - | matter=Salt heat=.8 cooling=2 breath=1 blows=0 strike=Tap ticks=0 bright=.2 edge=.6 remelt=0 width=.7 volume=5 neighbours=0.5 order=0.8 rest=0.25 | swarm | sevenths | Salt blown into hollow tones with no grain in them
A hum in the orchard | - | matter=Obsidian cooling=1.5 breath=1 blows=0 strike=Tap edge=.4 remelt=0 tail=3 volume=6 bright=.88 heat=.35 | ensemble | turn | Obsidian hums up dark and close, one mouth to a note | voice
Glasses on a wet tray | - | matter=Crystal heat=.3 cooling=.8 breath=1 blows=0 strike=Tap ticks=0 bright=.15 ring=26 remelt=0 order=1 tail=2 volume=3 neighbours=0.15 rest=0.12 width=0.4 | booth | tenths | Crystal tapped once and rubbed on by the breath, pure and near | organ
Nobody at the bellows | - | heat=1 cooling=1.5 breath=.9 blows=0 strike=Tap remelt=.6 every=1.4 bright=.4 ticks=0 edge=.7 ring=8 volume=2.5 neighbours=0.5 order=0.8 stretch=-0.67 rest=0.25 | bloom | fourths | Breath sings the glass up with a seventh in it, and the fire takes it back
First tide on black sand | - | matter=Obsidian heat=.9 cooling=3 breath=.6 strike=Pour blows=.5 turn=.5 bright=.65 edge=.9 remelt=0 tail=5 volume=3.5 neighbours=0.6 rest=.2 | tidal | rise | Obsidian poured slowly, its vowel coming up broad and dark
Salt road after noon | Salt drone | cooling=2 breath=.6 ticks=.8 blows=.4 turn=.8 strike=Rod bright=.6 volume=-5 stretch=.5 order=.6 remelt=.5 every=3 neighbours=0.1 | steps | fourths | Loose salt clacks and ticks as its odd tones set, heated again every three seconds
Ash with light behind it | - | matter=Obsidian heat=1 cooling=4 order=.5 breath=.8 blows=0 strike=Pour stretch=.9 bright=.9 remelt=.5 every=2 neighbours=0.45 rest=0.12 | glow | ninth | Obsidian drawn as wide as a plate, loose and slow to speak
Sugar frost at breakfast | - | matter=Sugar heat=.9 cooling=2.5 ring=26 breath=.5 ticks=.7 blows=.5 turn=1 bright=.35 strike=Pour remelt=0 tail=4 neighbours=0.1 stretch=0.67 | summer | turn | Wide sugar poured and cracking, ringing on for two seconds
White flats without road | - | matter=Salt edge=.2 breath=.5 ticks=1 blows=0 strike=Pour bright=.5 ring=24 remelt=0 width=1 volume=1 cooling=14 heat=.8 neighbours=0.1 order=0.8 stretch=0.25 rest=0.12 | shore | open | Salt ticks all over as it slowly shrinks
Knocking for the baker | - | heat=.7 cooling=1.4 breath=.1 remelt=0 neighbours=.9 volume=2 strike=Tap when=Both stretch=-.5 ring=1.2 blows=.7 turn=1.6 bright=.25 order=0.8 rest=0.12 | booth | lifted | A dull knuckle raps on pressed glass, and once more as the chord is let go
Feet on the stairs | - | matter=Crystal cooling=2.4 strike=Tap turn=2.6 breath=.2 ring=3 remelt=0 tail=2 neighbours=.9 volume=6 blows=1 heat=.6 bright=.4 width=0.9 | cloud | ostinato | Quick soft taps find more and more of the crystal
Kettle lid | - | heat=.6 cooling=.7 strike=Rod blows=.5 turn=6 bright=.6 breath=.3 ticks=.5 remelt=0 tail=1.5 edge=.2 volume=6 release=Quench ring=.5 neighbours=0.1 stretch=-0.6 | tiles | hocket | A fast rod rattles lightly on quickly set glass | texture
Cart over the bridge | - | matter=Bronze heat=.9 strike=Drop blows=.9 turn=.8 bright=.25 breath=.3 ring=7 remelt=.2 tail=4 volume=-5.5 when=Set cooling=1.2 neighbours=0.1 stretch=0.25 | reverse | sevenths | Heavy drops fall on bronze only once it has come clear
Milk cans at the gate | Waiting chimes | cooling=.8 blows=.8 turn=1.6 matter=Bronze strike=Tap stretch=0 ring=5 volume=0.5 neighbours=0.2 order=0.8 edge=0.5 | spun | fourths | Bronze waits until it has set and is tapped from then on
`,
    },
    {
      id: 'quenched-keys',
      name: 'Quenched keys',
      category: 'keys',
      rows: `
Tongs into the bucket | Quenched keys | ticks=.5 tail=1.6 bright=.7 cooling=.6 heat=.55 volume=2 stretch=0.2 rest=0.24 remelt=0.3 every=2.4 | bare | broken | Glass taps that flash and crack in water as each key lifts
Small clear words | Quenched keys | ring=1.6 tail=.6 bright=.45 ticks=.05 width=.15 volume=6 neighbours=0 stretch=-0.45 | stub | hocket | Crisp tapped glass, put out the moment it is let go
Steam on spectacles | Quenched keys | heat=.8 cooling=1.1 ticks=.35 tail=2.6 release=Quench volume=-0.5 when=Release breath=.8 order=0.68 stretch=0.2 rest=0.2 remelt=0.25 every=5.5 | tiles | lifted | Warm breath in glass, tapped and cracked in water as it is let go
Tap on a long cold pipe | Quenched keys | ring=9 tail=3.5 stretch=.35 bright=.5 strike=Rod neighbours=0.5 order=0.74 blows=0.3 turn=0.6 edge=0.6 | springs | tenths | A rod on stretched glass, left ringing before the water takes it
Put out like candles | Quenched keys | matter=Obsidian ring=3 bright=.8 tail=1 heat=.2 neighbours=0 volume=3 stretch=0.2 rest=0.16 | chapel | tune | Dark obsidian keys snuffed one at a time
Cabinet of small spoons | Quenched keys | matter=Crystal strike=Rod release=Anneal ring=4 bright=.3 tail=3 heat=.1 volume=0 when=Both order=.8 blows=0 neighbours=0 | plate 1.mix=.22 | lifted | An iron rod on cold crystal, octave bright, and again as each key comes up
Clock in the next flat | Quenched keys | matter=Crystal strike=Rod tail=.5 heat=0 width=.2 volume=4.5 release=Quench ring=.4 neighbours=0.15 rest=0.16 remelt=0.5 every=9 blows=0.6 turn=1.8 bright=.3 | slap | ostinato | Dry little crystal keys, over in about a second
Ice in a tall glass | Quenched keys | matter=Crystal strike=Tap release=Quench ring=6 tail=1.2 bright=.75 order=.5 ticks=.6 neighbours=0.7 remelt=0.15 every=0.7 | splash | sparse | Loose crystal knocks and cracks as it is put out
Ring of pantry keys | Quenched keys | matter=Crystal strike=Rod stretch=-.6 ring=5 release=Anneal bright=.4 tail=2.5 heat=.15 volume=-5 neighbours=0.9 order=0.8 rest=0.16 blows=0.8 turn=3.8 | rooms | stride | Crystal drawn close until it clinks like a ring of keys
Feathers, then frost | Quenched keys | matter=Crystal strike=Tap heat=.6 cooling=.5 release=Anneal ring=7 tail=4 bright=.2 breath=.3 volume=6 neighbours=0.7 order=0.8 | ripple | tenths | A palm on warm crystal that turns clear under the hand
Down and up again | Quenched keys | when=Both release=Anneal ring=4 tail=3 bright=.4 heat=.3 blows=0 volume=1 neighbours=0.9 order=0.68 stretch=-0.22 rest=0.24 remelt=0.4 every=1.9 | late | lifted | Each key is struck as it falls and again as it lifts
Two bells per door | Quenched keys | when=Both matter=Bronze strike=Rod release=Anneal ring=5 tail=4 bright=.45 blows=0 neighbours=1 order=0.86 stretch=0.28 remelt=0.4 every=2.4 edge=1 volume=1 | chamber 1.mix=.22 | lifted | Bronze rung at both ends of every note
Answer on the way out | Quenched keys | when=Both matter=Sugar strike=Tap release=Quench ring=14 tail=1.4 bright=.4 ticks=.3 neighbours=0.15 stretch=-0.45 edge=0.6 | pipe | lifted | Sugar snaps down and then snaps once more in water
Hinge and latch | Quenched keys | when=Both matter=Salt strike=Rod release=Quench ring=6 tail=.8 bright=.55 blows=0 volume=2 neighbours=0 order=0.68 stretch=0.4 rest=0.2 remelt=0.25 every=1.4 | board | hocket | Hollow salt clacks as the key goes both ways
Doorbell with no house | Quenched keys | when=Both strike=Drop heat=.7 cooling=.6 release=Remelt tail=3.5 ring=6 blows=.3 turn=2 neighbours=0 rest=0.12 remelt=0.75 every=1 | back | lifted | A drop going down, a drop going up, both sinking away
Tines in a drawer | Quenched keys | matter=Bronze strike=Tap release=Anneal ring=2.2 tail=1.2 bright=.35 heat=.2 stretch=.15 volume=2.5 neighbours=0.2 remelt=0.4 every=0.7 | throb | stride | Muted bronze with its hum an octave under the hand
Suitcase by the stove | Quenched keys | matter=Bronze strike=Tap release=Anneal ring=4 tail=.6 bright=.2 heat=.5 cooling=.8 width=.1 volume=1.5 neighbours=0.6 order=0.86 stretch=-0.45 rest=0.24 remelt=0.2 every=0.7 | valve | tenths | Round bronze keys with a low, soft middle
Gamelan of one person | Quenched keys | matter=Bronze strike=Rod release=Quench ring=8 tail=2 order=.55 bright=.6 heat=0 ticks=0 volume=6 stretch=0.28 rest=0.12 remelt=0.15 every=2.4 | swarm | ostinato | Loosely cast bronze keys struck by iron and damped in water
Seminar room at dusk | Quenched keys | matter=Bronze strike=Drop release=Anneal ring=3 tail=1.5 bright=.6 heat=.4 cooling=.4 volume=2 neighbours=0.15 stretch=0.2 | shudder | broken | Drops on bronze keys that are cool at once
Penny on the rail | Quenched keys | matter=Bronze strike=Rod release=Anneal tail=.5 bright=.75 heat=0 stretch=.6 width=0 volume=6 ring=.5 neighbours=0 order=0.74 rest=0.14 remelt=0.75 every=1.9 | combo 1.output=4 1.room=.15 | hocket | Tiny stretched bronze clinks, dry as a coin
Reed under a thumb | Quenched keys | matter=Salt strike=Tap release=Anneal ring=14 breath=.5 bright=.2 tail=.6 heat=.2 volume=0 neighbours=0.15 stretch=0.2 remelt=0.4 every=5.5 | reel | tune | Hollow salt keys with a little air held in them
Wheat down the chute | Quenched keys | matter=Salt strike=Drop release=Quench ring=10 ticks=1 bright=.5 tail=2 heat=.7 cooling=.8 order=0.8 stretch=-0.3 rest=0.14 remelt=0.6 every=1 | dotted | stride | Salt keys full of grit, cracking as they let go
Chalk on a long board | Quenched keys | matter=Salt strike=Rod release=Anneal ring=4 tail=1 heat=0 ticks=.1 width=.5 volume=5.5 when=Both neighbours=0.1 order=0.68 stretch=-0.45 rest=0.14 remelt=0.25 every=7 blows=0.2 turn=1.8 bright=.4 | struck | hocket | Dry chalky knocks with a hollow note inside, two to each key
Cork taken slowly | Quenched keys | matter=Salt strike=Tap release=Quench ring=24 bright=.05 tail=.9 heat=.3 breath=.2 volume=1 neighbours=0.9 order=0.74 stretch=0.2 remelt=0.3 every=0.7 | pot | stride | Very dark hollow keys, half wood and half air
Marsh light gone | Quenched keys | matter=Salt strike=Drop release=Remelt ring=20 breath=.7 bright=.35 heat=.6 cooling=.7 volume=0.5 when=Release tail=4 rest=0.1 remelt=0.2 every=1.9 | deepsea | lifted | Hollow marsh breath, and a drop that slides off as each key lifts
Felt over lava | Quenched keys | matter=Obsidian strike=Tap release=Anneal ring=4 bright=.45 tail=2 heat=.4 cooling=.5 volume=5.5 neighbours=1 stretch=-0.3 rest=0.2 remelt=0.5 every=7 | felted | tenths | Dark stone keys, slow to speak and soft
Coal scuttle march | Quenched keys | matter=Obsidian strike=Rod release=Quench ring=2.5 bright=.9 tail=.8 heat=0 volume=1 neighbours=0.1 remelt=0.25 every=7 | combo | stride | Obsidian knocked hard, its mouth open
Reading by a black lake | Quenched keys | matter=Obsidian strike=Drop release=Anneal ring=10 bright=.55 tail=5 heat=.5 cooling=.6 breath=.2 volume=2.5 neighbours=0.9 order=0.86 stretch=-0.45 blows=0.45 turn=2.6 | shadow | tenths | Drops into black stone, each with a dim after note
Moth under the shade | Quenched keys | matter=Obsidian strike=Tap release=Remelt ring=6 bright=.7 tail=2 blows=.4 turn=4.5 heat=.3 volume=5.5 rest=0.1 remelt=0.2 every=2.4 | flicker | tune | Obsidian fluttered lightly while a key is down
Ink in three waters | Quenched keys | matter=Obsidian strike=Tap release=Anneal ring=8 bright=.6 order=.4 tail=3 stretch=-.4 heat=.2 volume=3 neighbours=0.6 rest=0.16 | parted | broken | Close, loose obsidian tones that thicken one another
Dots and dashes on ice | Quenched keys | blows=.8 turn=7 strike=Rod ring=1 tail=.6 bright=.5 heat=.2 release=Quench stretch=0.28 remelt=0.6 every=1.9 volume=0.5 | kitchen | again | Fast iron taps for as long as a key is held
Woodpecker in far oaks | Quenched keys | blows=1 turn=8 strike=Tap matter=Sugar ring=10 tail=.8 bright=.5 volume=1.5 release=Quench neighbours=0.15 order=0.68 stretch=-0.3 remelt=0.75 every=9 edge=0.08 | valley | again | Dry sugar hammered eight times a second
Mandolin in the snow | Quenched keys | blows=.9 turn=6 strike=Tap matter=Crystal release=Anneal ring=1.6 tail=1.5 bright=.35 width=.9 neighbours=.8 stretch=-0.45 remelt=0.5 every=1 edge=1 | frost | turn | Crystal trembled under two soft palms
Hail on a tin porch | Quenched keys | blows=.7 turn=5 strike=Rod matter=Bronze release=Quench ring=1.2 tail=.7 bright=.7 heat=.1 neighbours=0 stretch=0.28 rest=0.1 remelt=0.3 every=1.9 | lit | broken | A quick rod on short bronze, wet at the end
Slow trill on thin glass | Quenched keys | blows=.6 turn=2.5 strike=Drop matter=Glass release=Anneal ring=5 tail=2.5 heat=.5 cooling=.8 breath=.2 volume=0.5 when=Set neighbours=0.42 | circle | tenths | Two or three drops to a key, but only once it has come clear
Pipes of blown bottle | Quenched keys | breath=.9 heat=.4 cooling=.3 strike=Tap ring=8 release=Anneal tail=.5 bright=.3 ticks=0 volume=0.5 neighbours=0.1 order=0.8 rest=0.25 remelt=0.15 every=9 | booth | turn | Breath takes the glass over as soon as it is touched | organ
Toy organ in a drawer | Quenched keys | matter=Salt breath=1 heat=.1 strike=Tap ring=20 release=Anneal tail=.4 bright=.15 ticks=0 rest=0.14 remelt=0.15 every=9 | pillow | contrary | Hollow blown keys, small and plain | organ
Hymn behind plaster | Quenched keys | matter=Crystal breath=.9 heat=0 strike=Tap ring=12 release=Anneal tail=1.2 bright=.1 ticks=0 order=1 volume=5 neighbours=0.9 rest=0.12 remelt=0.25 every=9 | door | contrary | Rubbed crystal in a true chord, kept low | organ
Regal in a small shop | Quenched keys | matter=Obsidian breath=1 heat=0 strike=Tap ring=12 release=Anneal tail=.4 bright=.95 ticks=0 volume=5 neighbours=0.45 | glued | sevenths | Open mouthed stone, blown hard and stopped short | organ
Mouth of the bottle | Quenched keys | matter=Glass breath=1 heat=.9 rest=.45 cooling=.4 strike=Tap release=Anneal tail=.8 bright=.4 edge=.6 volume=6 neighbours=0.15 order=0.86 remelt=0.25 every=9 | pane | contrary | Soft glass blown at the top, breathy under every key | wind
Wax fruit in a window | Quenched keys | heat=.8 cooling=1 strike=Drop release=Remelt tail=4 ring=6 bright=.3 volume=2.5 order=0.68 stretch=0.4 edge=0 | sag | tenths | A drop, a short clearing and a long way down
Let it run off the rod | Quenched keys | heat=.6 cooling=.6 strike=Drop release=Remelt tail=7 ring=12 matter=Crystal bright=.35 width=.8 volume=1 when=Release breath=.9 neighbours=0.1 order=0.86 stretch=-0.22 rest=0.2 remelt=0.75 every=1.4 | hall 1.mix=.22 | lifted | A faint breath, then crystal drops whose tones fall off one by one
Shutter let down slowly | Quenched keys | heat=.9 cooling=1.5 strike=Pour release=Remelt tail=2.5 ring=5 bright=.4 breath=.4 neighbours=0.6 order=0.86 stretch=0.4 remelt=0.3 every=3.2 | sweep | turn | Each key is poured and then runs down again
Dripstone | Quenched keys | heat=.7 cooling=.8 strike=Drop matter=Salt release=Remelt tail=5 ring=26 bright=.4 ticks=.4 blows=.2 turn=1 volume=4.5 neighbours=0.7 order=0.86 stretch=-0.45 remelt=0.75 every=5.5 | cistern | sparse | Drops on salt, each bubble heard, each note sinking
Pewter going soft | Quenched keys | heat=.5 cooling=.5 strike=Tap matter=Bronze release=Remelt tail=6 ring=6 bright=.4 order=.7 volume=-2.5 when=Release breath=.7 rest=0.16 remelt=0.15 every=4 edge=0.85 | undertow | lifted | A breath in soft bronze, tapped as it goes and melting from its hum upward
Sprung steel rule | Quenched keys | heat=0 strike=Rod stretch=1 ring=1.4 tail=.7 bright=.35 width=.1 volume=3.5 release=Quench neighbours=0 order=0.8 rest=0.16 remelt=0.6 every=4 | near | ostinato | Overtones stretched as far as they go, twanging and short
Plank marimba | Quenched keys | heat=.2 cooling=.4 strike=Tap stretch=-1 ring=1.8 release=Anneal tail=1 bright=.3 volume=2.5 neighbours=0.15 order=0.8 rest=0.16 remelt=0.2 every=2.4 | table | stride | Overtones pressed flat together, woody and round
Cracked lantern glass | Quenched keys | heat=0 strike=Tap order=.1 ring=5 release=Quench tail=1.5 bright=.5 ticks=.8 volume=1.5 stretch=0.4 | disc | tune | Scattered and missing tones, cracked again in water
All windows at once | Quenched keys | neighbours=1 strike=Rod ring=14 release=Anneal tail=6 bright=.4 heat=.3 width=1 volume=1 order=0.86 stretch=-0.45 edge=0.6 | wires | stride | Each struck key shakes every other that is held
Alone in a big kitchen | Quenched keys | neighbours=0 strike=Drop ring=3 release=Anneal tail=1.5 bright=.6 heat=.6 cooling=.5 width=.3 volume=6 order=0.74 stretch=0.4 rest=0.2 | gated | tune | One wet drop to a key, and nothing around it moves
`,
    },
    {
      id: 'molten-bass',
      name: 'Molten bass',
      category: 'bass',
      rows: `
Furnace under the house | Molten bass | tail=1.2 volume=5.5 matter=Crystal rest=.3 blows=.3 turn=.5 stretch=-.3 bright=.3 order=.8 cooling=20 neighbours=0.15 | shadow 1.mix=.16 | lowline | Low crystal kept too warm to clear, its upper octaves pressed a little close
Thick as honey | Molten bass | matter=Sugar rest=.3 ring=28 bright=.1 tail=1.5 blows=0 edge=.9 cooling=14 heat=.6 neighbours=0.1 remelt=0.4 every=1 | glued | walk | Warm sugar with hardly a tone set, blunt and slow
Bitumen under the crust | Molten bass | matter=Obsidian rest=.25 bright=.45 blows=.5 turn=.9 tail=.6 neighbours=0.5 order=0.72 | floor | lowline | Drops into black stone, dark and close to the ground
Copper in the crucible | Molten bass | matter=Bronze blows=.4 turn=.5 tail=2 volume=-1 cooling=16 neighbours=1 remelt=0.2 every=1 rest=.35 bright=.45 | chamber | again | Molten bronze with its hum an octave under the line
Sand going liquid | Molten bass | matter=Salt rest=.35 breath=.7 ticks=.5 bright=.3 tail=1 ring=10 volume=6 neighbours=0.8 order=0.84 remelt=0.25 every=2.4 | pane | lowline | Hollow salt with the furnace blowing through it
Plain iron stove | - | heat=.2 cooling=.4 strike=Tap blows=0 breath=0 ring=3 bright=.2 tail=.5 width=.1 remelt=0 ticks=0 neighbours=0 volume=-1 | bare | walk | A palm on deep set glass, round and exact
Boots on the jetty | - | heat=.1 strike=Tap blows=0 breath=0 ring=1 bright=.1 width=0 remelt=0 ticks=0 stretch=-.3 when=Both tail=.8 neighbours=0 order=0.84 rest=0.12 volume=-2 | narrow | lowsteps | Short dark thuds with a note in each, heel and then toe
Cello left unbowed | - | heat=0 strike=Rod blows=0 breath=0 ring=3 bright=.12 tail=.6 width=.1 remelt=0 ticks=0 order=0.84 | iron | walk | An iron rod on cold low glass, a knock in front of every note
Cable under tension | - | heat=0 strike=Rod blows=0 breath=0 ring=7 bright=.35 tail=1 stretch=.25 remelt=0 ticks=0 width=.3 volume=1 neighbours=0.1 order=0.88 | edge | lowline | Stretched low tones that twang and hold
Skin of a tank | - | matter=Sugar heat=0 strike=Tap blows=0 breath=0 ring=22 bright=.25 tail=.4 remelt=0 ticks=.1 width=.1 volume=3 release=Quench neighbours=0.7 order=0.72 stretch=-0.3 rest=0.22 | combo | lowsteps | Brittle low plucks with a dry click on each
Bell buoy after dark | - | matter=Bronze heat=0 strike=Tap blows=0 breath=.05 ring=8 bright=.3 tail=3 remelt=0 ticks=0 volume=2 when=Both stretch=0 neighbours=1 order=0.84 | deepw | lowcall | Cold low bronze, its third and fifth hanging in it, rung again at each let go
Two links of a chain | - | matter=Bronze heat=0 strike=Rod breath=0 ring=3 bright=.55 tail=.8 remelt=0 width=.4 volume=5.5 order=.15 stretch=.3 blows=.5 turn=6 | chamber | lowsteps | Scattered bronze clanked low and fast with iron
Gate of the dry dock | - | matter=Bronze heat=.6 cooling=1 strike=Drop blows=.6 turn=.7 ring=14 bright=.2 tail=4 remelt=0 stretch=-.6 when=Both neighbours=0.5 order=0.84 rest=0.16 width=0.3 volume=-1 | nave 1.mix=.24 | onelow | A huge pressed bronze plate let down, and heard again on leaving
Tuned oil drums | - | matter=Bronze heat=.4 cooling=.5 strike=Tap blows=.3 turn=1.5 ring=2 bright=.5 tail=.6 order=.6 remelt=0 volume=1.5 stretch=0.28 rest=0.1 | springs | lowsteps | Round bronze thumps with a wobble in the middle
Down the iron stair | - | matter=Bronze heat=.2 strike=Tap blows=.8 turn=3 bright=.3 tail=.5 remelt=0 breath=0 when=Both volume=2.5 release=Quench ring=.6 stretch=0.2 | pile | lowline | Soft quick steps on muffled bronze, and one more on leaving
Breath of the boiler | - | heat=.9 rest=.3 cooling=1 strike=Tap blows=0 breath=.9 bright=.3 ring=6 tail=.8 remelt=0 edge=.5 volume=1 neighbours=0.6 order=0.86 stretch=0.3 | lungs | onelow | Warm air at the bottom with a note inside it | wind
Pedal pipe in felt shoes | - | matter=Glass heat=0 strike=Tap blows=0 breath=.9 bright=.05 ring=12 tail=.6 ticks=0 remelt=0 order=1 neighbours=0.15 rest=0 | organ | pedal | A soft low pipe that holds as long as the foot does | organ
Cold store hum | - | matter=Salt heat=0 strike=Tap blows=0 breath=.9 bright=.1 ring=24 tail=.7 ticks=0 remelt=0 neighbours=0.7 order=0.88 | valve | pedal | A hollow blown bass with only odd tones in it | organ
Double reed in a barn | - | matter=Obsidian strike=Tap blows=0 breath=1 ring=10 tail=.5 ticks=0 remelt=0 volume=6 heat=.4 cooling=.8 rest=.4 edge=.2 bright=1 neighbours=0.8 width=0.05 | chorale | tune | Dark stone kept half soft and blown until its top buzzes like a reed | wind
Bowed water pipe | - | matter=Bronze cooling=.6 strike=Tap blows=0 breath=1 tail=1.5 ticks=0 remelt=0 volume=-0.5 heat=.1 ring=24 bright=.5 neighbours=0.1 rest=0.16 | dense | onelow | Low bronze bowed by air, its hum under everything | string
Ladle, then the pour | - | strike=Pour heat=.8 cooling=1.2 rest=.2 blows=.4 turn=.4 ring=5 bright=.3 tail=1 remelt=0 breath=.2 | dense | lowline | A stream of deep drops that thickens into a note
Gutter after midnight | - | strike=Pour heat=.5 cooling=.5 blows=.6 turn=.6 ring=3 bright=.4 tail=.8 remelt=0 ticks=.6 matter=Sugar neighbours=0 order=0.78 rest=0.12 edge=1 | pipe | walk | Low sugar spilling and clicking as it goes
Slag over the edge | - | strike=Pour heat=1 cooling=2 blows=.7 turn=.5 ring=8 bright=.2 tail=2 matter=Obsidian remelt=0 edge=.9 volume=0.5 neighbours=0.7 rest=0.16 | cave 1.mix=.3 | onelow | Black stone poured thick over the lip
Tar barrel rolling | - | strike=Pour heat=.6 rest=.4 blows=.9 turn=1 ring=4 bright=.15 tail=1.2 matter=Bronze remelt=0 width=.5 volume=-2 order=0.78 | panned | walk | Heavy drops run round inside molten bronze
Mud in a jar | - | strike=Pour heat=.9 rest=.5 blows=.3 turn=.8 ring=10 bright=.5 tail=1 matter=Salt remelt=0 volume=0 neighbours=0.1 | pot | lowline | Bubbling low salt that never sets
Lowest lamp in the mine | - | heat=.9 strike=Drop blows=.7 turn=1.3 ring=6 bright=.35 tail=1.5 remelt=.5 volume=-9.5 when=Set cooling=.5 every=2.4 neighbours=0.1 width=0.1 | echo | onelow | A drop each time the glass has cleared, between visits to the fire
Mill race at neap tide | - | heat=.6 cooling=.7 strike=Drop blows=.4 turn=.8 ring=5 bright=.25 tail=1 remelt=.9 every=.9 breath=.5 volume=-0.5 neighbours=0.42 stretch=0.2 | soft3 | lowline | Softened and set again nearly once a second
Engine with a cough | - | matter=Obsidian heat=.5 cooling=.4 strike=Tap blows=.9 turn=5 ring=1.2 bright=.6 tail=.4 remelt=.7 every=.5 volume=4.5 release=Quench neighbours=0 order=0.72 rest=0.16 edge=0.6 width=0 | reel | walk | Quick dark strokes that keep going soft
Heart of the ferry | - | matter=Glass heat=.5 cooling=.3 strike=Tap blows=1 turn=1.9 bright=.15 tail=.5 remelt=0 width=0 breath=.1 ring=.5 neighbours=0.2 edge=0.85 | floor 1.low=3 | onelow | Two round beats a second on one deep key
Dredger at slack water | - | matter=Bronze heat=.7 cooling=.6 strike=Tap blows=.3 turn=.6 ring=3 bright=.4 tail=2 remelt=1 every=2.2 breath=.7 volume=4.5 neighbours=0.1 order=0.88 rest=0.18 | dark | pedal | Bronze hauled in and out of the heat under a chord | drone
Lava with a crust | Cold top | matter=Obsidian rest=.35 strike=Drop blows=.5 turn=1 bright=.55 tail=1 breath=.3 volume=1.5 neighbours=0 order=0.88 edge=0.15 width=0 | smear | lowline | Soft below and hard on top, grinding along
Cracks in the black | Cold top | matter=Glass rest=.5 strike=Rod ticks=1 blows=.2 turn=2 bright=.5 tail=.7 edge=.1 volume=4 neighbours=1 order=0.72 width=0.2 | table | walk | Deep soft glass with a brittle crust that ticks
Rust blooming | - | matter=Salt heat=.8 cooling=1.4 ticks=1 strike=Rod blows=.4 turn=1.4 ring=8 bright=.5 tail=1 remelt=0 edge=.05 neighbours=0.5 rest=0.26 width=0.3 | worn | lowline | Low salt that grinds and clicks as it shrinks
Frozen pipes at four | - | matter=Crystal heat=.8 ticks=.8 strike=Tap blows=0 ring=3 bright=.1 tail=1 remelt=0 edge=.1 volume=5 neighbours=0.5 width=0.2 cooling=.9 | door | lowcall | Low crystal, more octave than root, pinging as it sets
Hull settling on ice | - | matter=Glass heat=1 cooling=3 ticks=.9 strike=Drop blows=.1 turn=.3 ring=12 bright=.4 tail=4 remelt=0 edge=0 stretch=.5 order=0.72 | valley 1.mix=.28 | onelow | Wide low tones crack clear one after another
Round and no edges | - | heat=.5 cooling=.5 edge=1 strike=Drop blows=0 breath=.2 ring=3 bright=0 tail=.8 ticks=0 remelt=0 width=.2 volume=-1 stretch=-0.22 rest=0.12 | blunt | lowcall | The darkest glass there is, rounded at both ends
Sub and a drop of water | - | heat=.4 cooling=.4 strike=Drop blows=0 breath=0 ring=2.5 bright=.05 tail=.5 ticks=0 remelt=0 width=0 volume=-0.5 neighbours=0 rest=0.12 | under | walk | One low drop with its bubble, plain and round, soon over
Moss on the wheelhouse | - | matter=Obsidian heat=.3 strike=Tap blows=0 breath=.1 ring=3 bright=.35 tail=.6 remelt=0 ticks=0 volume=6 neighbours=1 stretch=.3 | blanket | lowcall | Mossy low plucks, hardly a top on them
Crate of soft apples | - | matter=Salt heat=.1 strike=Tap blows=0 breath=.1 ring=26 bright=.1 tail=.4 remelt=0 ticks=0 volume=-2 neighbours=0.1 | board | walk | Hollow low knocks, over as the key comes up
Elephant on tiptoe | - | matter=Glass heat=.7 cooling=.8 strike=Tap blows=0 breath=.4 ring=10 bright=.15 remelt=0 neighbours=.9 volume=-1 when=Both tail=2 rest=0.16 | giant | lowline | A heavy soft step going down and a lighter one coming up
Let the hawser go | Let go to ring | cooling=.6 bright=.2 matter=Glass strike=Tap ring=4 tail=2 blows=.2 breath=.5 volume=-2 neighbours=0.8 rest=0.18 | stone | lowline | Air while a key is down, and the note as it is let go
Winch and a long breath | Let go to ring | cooling=.6 matter=Bronze strike=Drop ring=5 tail=2.5 blows=0 breath=.9 when=Both volume=-2 neighbours=0.8 order=0.88 rest=.1 bright=.35 | current | lowsteps | Bronze struck on the way down and up over a drawn breath
Waits for the tide | Waiting chimes | heat=.6 cooling=.5 strike=Tap blows=.9 turn=1.6 stretch=0 bright=.2 ring=3 tail=1.5 width=.2 matter=Glass neighbours=0.2 order=0.84 | dull | lowline | Hushed glass sets first and only then begins to walk
Bell beneath the harbour | Waiting chimes | heat=.5 cooling=.4 strike=Rod blows=.5 turn=1.2 matter=Bronze bright=.2 ring=6 tail=3 width=.3 stretch=-.2 volume=2.5 neighbours=0.42 edge=1 | wires | lowcall | Low bronze is struck when it has gone hard, never before
Melts under the bow | Molten bass | heat=.6 rest=0 cooling=.7 strike=Drop release=Remelt tail=4 ring=8 blows=.2 turn=.8 bright=.3 volume=4 neighbours=0.15 stretch=-0.3 remelt=0.75 every=2.4 | sink | onelow | A low drop that runs down from the bottom when left
Squared off at the end | Molten bass | heat=.1 rest=0 cooling=.3 strike=Rod release=Quench tail=.5 ring=6 blows=0 bright=.3 breath=0 volume=4 neighbours=0.45 order=0.78 | gated | lowsteps | Cold low glass cut off in water, crack and all
Three rooms down | - | matter=Glass heat=.4 cooling=.5 strike=Drop blows=.5 turn=2.2 bright=.2 tail=.8 remelt=0 volume=4.5 ring=.6 neighbours=0.45 order=0.78 rest=0.1 edge=0.85 | pillow | walk | A small dull bass pulse heard through the floor
Frog in the culvert | - | matter=Salt heat=.8 cooling=.4 strike=Drop blows=.6 turn=3.2 ring=6 bright=.3 tail=.6 remelt=.3 every=.8 volume=4.5 rest=0.1 edge=0.08 width=0.1 | wah | walk | Low quick bubbles in hollow salt, warmed every second or so
Lightning without rain | - | matter=Crystal heat=.9 cooling=1.4 strike=Rod blows=.3 turn=.5 ring=16 bright=.05 tail=5 remelt=0 volume=4 neighbours=0.9 edge=0.6 | undertow | onelow | A rod on low crystal that comes clear late and stays
Whale under the pier | - | matter=Obsidian heat=.8 cooling=1.6 strike=Pour blows=0 breath=.8 bright=.5 ring=8 tail=4 release=Remelt remelt=.4 every=3 neighbours=0.8 order=0.88 | tide | onelow | A slow dark call, its vowel rising as it sets | voice
`,
    },
    {
      id: 'salt-drones',
      name: 'Salt drones',
      category: 'drone',
      rows: `
Pans at slack water | Salt drone | remelt=0 every=2 bright=.15 width=.3 ticks=0 volume=-5.5 neighbours=0.45 rest=0.12 | cave 1.mix=.3 | deep | Hollow salt blown steadily and low, nothing moving but the air
Grey salt under cloud | Salt drone | remelt=.7 every=3.5 bright=.45 heat=.9 edge=.8 volume=-2 stretch=-.4 order=.7 rest=.2 blows=0.8 turn=0.25 | mist | open | Crowded salt goes to the fire every few seconds and comes back broad
Brine in the rafters | Salt drone | heat=.9 rest=.35 cooling=2 remelt=0 bright=.7 breath=.8 volume=3 neighbours=0.5 order=0.62 stretch=0.35 | shallow | deep | Only the odd tones at the top are hard, over wet air
Rake across the flats | Salt drone | ticks=1 breath=.5 remelt=.2 blows=.3 turn=.7 strike=Rod bright=.6 ring=20 volume=-4 neighbours=0.1 order=0.62 rest=0.12 | panned | fourths | Salt raked with iron, grain by grain
White noise of noon | Salt drone | heat=1 breath=1 remelt=0 bright=.9 edge=.7 tail=2 volume=-3.5 rest=.95 neighbours=0.7 blows=.5 turn=2 stretch=-.4 | sweep | fourths | Salt so hot that it is nearly all wind, drops hissing in it | texture
Meridian | - | matter=Glass heat=.4 cooling=1 breath=.9 blows=0 strike=Tap ticks=0 remelt=0 ring=14 bright=.35 tail=5 order=1 volume=3 neighbours=0.6 | hall 1.mix=.3 | one | Plain set glass, sung evenly by a strong breath
Two notes of dark water | - | matter=Glass heat=.2 breath=.8 blows=0 strike=Tap ticks=0 remelt=0 ring=20 bright=.05 tail=4 width=.8 neighbours=1 volume=6 order=0.62 rest=.12 | deepsea | deep | The darkest low glass, two keys drawing on one heat
Wire fence in west wind | - | matter=Glass heat=.2 breath=1 blows=0 strike=Tap ticks=0 remelt=0 ring=10 bright=.7 tail=2 stretch=.7 volume=1 neighbours=0.6 order=0.62 | comb | one | Stretched glass whistles where the wind takes it
Floor of the gorge | - | matter=Glass breath=1 blows=0 strike=Pour ticks=.1 remelt=0 bright=.3 edge=1 tail=3 volume=2 cooling=40 heat=.75 neighbours=0.5 stretch=0.67 | whisper | deep | Hardly glass yet: a pitched rush of warm air
Light on a level field | - | matter=Glass heat=.3 breath=.7 blows=.2 turn=.3 strike=Drop ticks=0 remelt=0 ring=26 bright=.45 order=.75 tail=8 stretch=-.3 volume=6 neighbours=0.1 rest=.1 | freeze | open | Close beating tones, with one drop every three seconds
Wet finger till morning | - | matter=Crystal heat=0 breath=.7 blows=0 strike=Tap ticks=0 remelt=0 ring=30 bright=.15 tail=6 order=1 neighbours=0.15 rest=0.14 width=0.3 | nave | fourths | Crystal rubbed without a pause, every octave true | organ
Twelve stems, one thumb | - | matter=Crystal heat=.2 breath=.9 blows=0 strike=Tap ticks=0 remelt=.4 every=2.4 ring=20 bright=.4 tail=3 order=.8 width=1 volume=-0.5 rest=0.14 | sides | ninth | Rubbed crystal, a little out, softened and rubbed again | organ
Satellite over the farm | - | matter=Crystal heat=.6 cooling=2 ticks=0 remelt=0 tail=4 volume=-4 edge=.9 breath=1 neighbours=0.42 order=0.8 stretch=-0.67 when=Press strike=Drop blows=.25 turn=.3 ring=24 rest=.2 bright=.3 | halo 2.mix=.12 | fourths | A thin high edge of crystal over soft glass, with a far drop
Lead in the light | - | matter=Crystal heat=0 breath=.5 strike=Tap ticks=0 remelt=0 ring=24 bright=.3 order=.2 tail=5 neighbours=.8 volume=5 stretch=0.67 rest=.12 blows=.3 turn=.3 | parted | one | Scattered crystal tones slowly beating under the breath, tapped now and then
Aisle of cold bottles | - | matter=Crystal heat=.1 breath=.6 blows=.15 turn=.5 strike=Rod stretch=-.8 ticks=0 remelt=0 ring=28 bright=.5 tail=8 volume=-1 order=.7 | cistern | open | Crystal pressed inward, with a slow iron touch on it
Bell that will not stop | - | matter=Bronze heat=.3 breath=.8 blows=.1 turn=.3 strike=Drop ticks=0 remelt=0 ring=30 bright=.4 tail=10 volume=2.5 neighbours=0.6 order=0.8 | shadow | deep | Bronze that hums on and on under a steady breath
Verdigris on a hinge | - | matter=Bronze heat=.2 breath=1 blows=0 strike=Tap ticks=0 remelt=0 ring=14 bright=.8 order=.35 tail=4 volume=6 neighbours=0.7 | worn | one | Bronze out of true, blown hard and green at the top
Foundry on a Sunday | - | matter=Bronze heat=.9 cooling=3 rest=.3 breath=.7 blows=.2 turn=.4 strike=Pour ticks=.1 remelt=0 bright=.35 tail=6 edge=.6 neighbours=1 volume=0 order=0.8 stretch=-0.5 width=0.3 | valley | deep | Half poured bronze, warm at the bottom and clear on top
Minor third of the gate | - | matter=Bronze heat=0 breath=.6 blows=0 strike=Tap ticks=0 remelt=.6 every=1.6 ring=10 bright=.2 tail=3 volume=2 stretch=0 neighbours=0.7 rest=0.12 | throb | onelow | One low bronze key, its minor third coming and going
Shield wall | - | matter=Bronze heat=.1 breath=.9 blows=.4 turn=.9 strike=Rod stretch=-.7 remelt=0 ring=12 bright=.6 neighbours=1 tail=5 volume=2 | swarm | fourths | A rod moves over a wall of pressed bronze
Cave with its mouth ajar | - | matter=Obsidian heat=.3 breath=1 blows=0 strike=Tap ticks=0 remelt=0 ring=12 bright=.55 tail=3 volume=6 neighbours=0.2 order=0.72 | whistle | onelow | Dark stone sung low on a full breath, its vowel half open | voice
Tanpura of slate | - | matter=Obsidian heat=.2 breath=.3 blows=.8 turn=1.1 strike=Rod ticks=0 remelt=0 ring=16 bright=.8 tail=5 volume=0.5 neighbours=1 rest=.1 | buzz | open | Iron on obsidian, again and again, each key at its own pace | string
Monk on the late bus | - | matter=Obsidian heat=.5 cooling=1.4 breath=1 blows=0 strike=Tap ticks=0 remelt=.3 every=1.1 ring=6 bright=.75 tail=2 edge=.9 volume=6 neighbours=0.42 order=0.76 rest=0.16 width=0.05 | lowgate | onelow | A low vowel that softens about once a second | voice
Lit from the crater | - | matter=Obsidian heat=1 cooling=5 breath=.8 blows=.3 turn=.5 strike=Drop ticks=.5 remelt=0 bright=.9 stretch=.4 tail=5 volume=-0.5 neighbours=0 rest=0.4 edge=0.15 | glow | deep | Wide obsidian tones glow over drops of fire
Well with a lid | - | matter=Obsidian heat=.7 rest=.35 breath=.9 blows=0 strike=Tap ticks=0 ring=8 bright=.4 tail=3 width=.1 volume=3.5 neighbours=0.6 order=0.8 remelt=.4 every=3 stretch=-.4 | pot | deep | Soft black stone hums in a narrow place
Gravel settling | - | matter=Salt heat=.9 cooling=4 breath=.2 strike=Pour ticks=1 ring=28 edge=0 tail=3 width=1 volume=0 bright=.45 neighbours=0.7 blows=.3 turn=1.3 remelt=.3 every=7 stretch=.5 | current | open | Thousands of grains tick over a nearly silent drone | texture
Parked on the ice road | - | matter=Glass heat=.9 cooling=3 breath=.5 blows=0 strike=Tap ticks=.9 remelt=.8 every=3 ring=10 bright=.6 edge=.05 tail=3 volume=3 neighbours=0.5 order=0.74 stretch=0.67 width=0.3 | unfold | onehigh | Glass pings its way down, is warmed, and pings down again
Rust in the hinges | - | matter=Bronze cooling=2.4 blows=0 strike=Tap ticks=1 remelt=.5 every=1.8 ring=4 edge=.1 order=.6 volume=6 breath=.9 heat=.65 bright=.6 neighbours=0.6 width=0.9 rest=.15 | cupboard 1.output=3 | open | Bronze ticking and creaking round a held fifth
Sugar mill idling | - | matter=Sugar heat=.8 cooling=2 breath=.9 blows=.6 turn=3 strike=Tap ticks=.8 ring=30 bright=.4 tail=2 neighbours=0 rest=0.14 width=1 volume=1.5 remelt=.4 every=1.2 stretch=.35 | dust | again | Dry sugar kept sounding by many small taps
Pylon in the drizzle | - | matter=Sugar heat=0 breath=1 blows=1 turn=8 strike=Tap ticks=.3 remelt=0 ring=30 bright=.6 tail=1 width=.4 order=.6 stretch=-.4 neighbours=0.42 rest=.15 | dust | open | A low chord of crowded sugar tapped eight times a second
Door of the fire | - | matter=Glass heat=.8 cooling=.8 breath=.8 blows=0 strike=Pour ticks=.1 remelt=1 every=1.2 ring=10 bright=.4 edge=.5 release=Remelt tail=3 volume=-1 | tidal | open | The whole chord goes soft and clear every second or so
Slow lighthouse | - | matter=Crystal cooling=1.2 ticks=0 every=4.5 edge=.4 tail=5 volume=0.5 heat=.5 neighbours=0.2 rest=0.22 width=0.3 breath=1 ring=26 remelt=.7 blows=.35 turn=.25 strike=Drop bright=.35 | circle | turn | Crystal turned through the heat about every five seconds, touched by a drop
Panting hearth | - | matter=Obsidian heat=.8 cooling=.5 breath=1 blows=0 strike=Tap ticks=0 bright=.5 tail=1.5 volume=6 neighbours=0.15 width=0.3 remelt=.7 every=.9 ring=8 | bed | deep | Stone softened about once a second, a quick dark panting
Bellows boy asleep | - | matter=Bronze blows=0 strike=Tap ticks=0 remelt=.8 every=7 ring=14 bright=.55 tail=6 volume=6 heat=.45 cooling=.8 breath=1 neighbours=0.42 rest=0.12 | late | fourths | Bronze that goes soft about every seven seconds and is back within two
Shift change | - | heat=.5 cooling=.4 breath=.7 ticks=.2 tail=2 width=.8 volume=1 matter=Salt strike=Rod blows=.8 turn=1.3 remelt=.9 every=2.1 bright=.35 ring=14 neighbours=0 rest=0.12 | loops | deep | Iron on hollow salt at one speed and the fire at another
Thin air along the ridge | - | matter=Glass heat=.6 rest=.7 cooling=.5 breath=1 blows=0 strike=Tap ticks=0 remelt=0 bright=.9 edge=.4 tail=3 volume=6 neighbours=0.15 order=0.8 | thinned | fourths | Air near the chord, with a few hard tones at the crest | wind
Draught under a tower | - | matter=Crystal heat=.9 cooling=.6 breath=1 blows=0 strike=Tap ticks=0 remelt=0 bright=.3 edge=1 tail=2 volume=6 rest=.92 neighbours=0.6 stretch=0.3 width=0.9 | gusts | open | A pale wind with crystal somewhere in it | wind
Chimney in a storm | - | matter=Salt heat=.9 rest=.5 cooling=.6 breath=1 blows=0 strike=Tap ticks=0 remelt=.4 every=.9 bright=.4 tail=2 volume=-1 when=Release | gusts | lifted | Hollow wind in a hot tube, with one knock as it is let go | wind
Kites over the estuary | - | matter=Bronze heat=.9 rest=.6 cooling=.6 breath=1 blows=.2 turn=.6 strike=Rod ticks=0 remelt=0 bright=.8 tail=5 volume=5 neighbours=0.8 order=0.74 edge=0.85 | shore | fourths | The rims of hot bronze ring thinly in moving air
Through the keyhole | - | matter=Sugar heat=.7 rest=.4 breath=1 blows=0 strike=Tap ticks=0 remelt=0 ring=30 bright=.2 tail=1.5 width=0 volume=5 neighbours=0.45 order=0.7 edge=0.7 | notch | deep | Narrow, pale and breathy, all of it in the middle | wind
Strung from the beams | - | matter=Glass heat=.1 breath=.2 blows=.9 turn=.8 strike=Rod ticks=.1 remelt=0 ring=24 bright=.35 tail=8 stretch=.1 volume=4 rest=.1 | wires | open | Glass left long to ring, each key knocked every second or so | string
Palm in a slow rain | - | matter=Crystal heat=.3 breath=.3 blows=1 turn=.6 strike=Tap ticks=.2 remelt=0 ring=10 bright=.25 tail=5 order=.6 volume=2.5 neighbours=0.15 rest=0.14 | rain | deep | A palm on loose crystal, over a soft floor of breath
Poured until morning | - | matter=Glass heat=.8 cooling=1.6 breath=.5 blows=1 turn=.5 strike=Pour ticks=.4 ring=12 bright=.5 tail=5 width=1 volume=-1 neighbours=0.15 rest=0.2 remelt=.25 every=7 | smear | rise | Stream after stream of drops on one low chord
Drums under the snow | - | matter=Bronze heat=.5 cooling=.6 breath=.4 blows=1 turn=1.2 strike=Tap ticks=0 remelt=.2 every=2 ring=3 bright=.1 tail=2 when=Set volume=-0.5 neighbours=0.15 order=0.62 width=0.3 | deepw 2.mix=.12 | deep | Muffled bronze that has to set before the beating starts
Oars, both banks | - | matter=Obsidian heat=.6 cooling=.8 breath=.6 blows=.9 turn=.7 strike=Drop ticks=0 remelt=.3 every=1.4 ring=5 bright=.5 tail=3 width=.9 when=Set volume=2 neighbours=0.1 order=0.86 | mirror | open | A dark hum first, then drops left and right as it sets
Cold light on a lathe | Frozen pad | matter=Glass strike=Tap breath=.9 bright=.6 ring=8 tail=3 order=.5 stretch=.3 volume=-1.5 neighbours=0.2 blows=.4 turn=.3 | chorale | rise | Cold loose glass drawn wide and sung hard
Moon through muslin | Crystal dawn | heat=.4 cooling=1.2 breath=.6 blows=0 bright=.05 ring=30 edge=.9 order=.9 neighbours=0 volume=1.5 rest=0.2 remelt=.2 every=4 | pane | ninth | Crystal with its whole top folded away
Two lamps on the moor | Obsidian voices | remelt=0 edge=.3 width=.2 tail=6 volume=-4 stretch=-0.67 rest=0.14 breath=.9 blows=.5 turn=.45 ring=30 strike=Rod bright=.5 | far | deep | Two dark notes alone, touched now and then
Under the weir | Remelting swells | matter=Salt every=.7 remelt=.6 breath=.9 bright=.3 ring=14 volume=-4 neighbours=0.2 order=0.8 | deepw 1.depth=.3 | ninth | Salt churned in and out of the heat more than once a second
Stone in the kettle | Cold top | matter=Salt rest=.2 blows=.3 turn=.4 strike=Drop breath=.9 ticks=.4 bright=.5 remelt=.1 volume=-1 neighbours=0.15 order=0.74 | gated | deep | A hard blown salt drone with a drop into it every few seconds
`,
    },
    {
      id: 'shattered-bells',
      name: 'Shattered bells',
      category: 'bell',
      rows: `
Founder's reject | Shattered bells | order=.3 ring=16 volume=6 stretch=-.3 heat=.7 cooling=1.4 ticks=.5 edge=.1 bright=.18 | nave | calls | Bronze that set a little too soon, its tones pinging clear and slightly sour
Three pieces of a bell | Shattered bells | order=0 ring=6 ticks=.9 width=1 volume=6 stretch=.5 strike=Rod blows=.4 turn=2 remelt=0.3 every=5.5 bright=.35 | chamber | sparse | Wide bronze with most of its tones scattered or gone, struck twice a second
Tower after the fire | Shattered bells | order=.2 heat=.8 cooling=2 ring=20 bright=.4 breath=.4 tail=10 when=Both blows=.2 volume=4 neighbours=0.7 stretch=0.4 edge=0.6 | valley | calls | Scattered bronze that has to clear, tolled again as it is left
Sheep on the wrong hill | Shattered bells | order=.4 ring=2 bright=.5 strike=Tap blows=.5 turn=2.2 tail=1.5 volume=2.5 neighbours=0.7 stretch=-0.45 rest=0.14 remelt=0.75 every=1 | flock | hocket | Short dull bronze, knocked about by the key that holds it
Copper leaves falling | Shattered bells | order=.15 ring=3 ticks=1 heat=.6 cooling=1.2 width=1 tail=3 volume=1 neighbours=0.9 bright=.45 stretch=.5 | leaves | calls | Thin loose bronze ticking on its way to rest
Vase, then the floor | - | matter=Glass order=.1 heat=0 strike=Rod blows=0 breath=0 ticks=.6 remelt=0 tail=3 release=Quench volume=6 ring=10 neighbours=0.7 rest=0.16 bright=.42 | struck 1.attacks=4 | sparse | Broken glass under iron, cracked again at the end
Sea glass in a jar | - | matter=Glass order=.35 heat=.1 strike=Tap breath=0 bright=.4 ticks=.2 remelt=0 tail=2 volume=1.5 stretch=-.35 blows=.4 turn=3 ring=1 neighbours=0.2 rest=0.1 | table | calls | Rounded pieces of glass rattled together, each a bit out of tune
Chandelier let down | - | matter=Glass order=.25 heat=.5 cooling=1 strike=Pour blows=.3 turn=.5 breath=0 ring=10 bright=.75 ticks=.9 remelt=0 tail=6 width=1 neighbours=.8 rest=0.16 | glint | peal | Loose glass poured from a height and slow to come to rest
Window in the cloister | - | matter=Glass heat=.2 strike=Drop breath=.2 ring=14 bright=.35 ticks=.1 remelt=0 tail=7 order=.45 stretch=.35 blows=.3 turn=.5 neighbours=0.5 rest=0.12 | nave 1.mix=.3 | lifted | Drops on uneven old glass, drawn wide and wavering as it rings
Spare bulbs | - | matter=Glass order=.2 heat=0 strike=Tap blows=0 breath=0 ring=1.5 ticks=0 remelt=0 tail=1 volume=6 rest=0.14 bright=.6 | small | snow | Thin bright clinks of something light and hollow
Porch chimes in a calm | Waiting chimes | cooling=1.6 blows=.4 turn=.5 order=.7 bright=.5 volume=1.5 neighbours=0 edge=0.08 | far | fourths | Nothing but warm glass, until each note sets and is struck
They ring when ready | Waiting chimes | cooling=.8 heat=.5 blows=.9 turn=2.2 matter=Crystal stretch=0 bright=.35 ring=14 neighbours=0.15 | bright | ninth | Crystal is struck twice a second from when it is clear
Late for the procession | Waiting chimes | cooling=2 heat=.8 matter=Bronze strike=Tap blows=.5 turn=.7 stretch=0 order=.85 ring=18 volume=5 neighbours=0.2 | late | turn | Bronze sets low in the chord last, and is tapped last
Seeds in a clay whistle | Waiting chimes | cooling=.7 heat=.6 matter=Salt strike=Rod blows=.8 turn=4 ring=26 width=1 volume=-9 neighbours=0.15 edge=0.15 bright=.45 | drops | fourths | Salt waits, then rattles under quick iron
Steps cut in cold rock | Waiting chimes | cooling=1 heat=.8 strike=Drop blows=.8 turn=1.1 matter=Obsidian bright=.8 stretch=.5 ring=16 tail=8 neighbours=0.42 order=0.5 edge=0.08 | stone | rise | Wide obsidian, dropped on once it is hard
Handbell, left hand | - | matter=Crystal heat=0 strike=Rod blows=0 breath=0 ring=14 bright=.35 ticks=0 remelt=0 tail=8 order=1 when=Both volume=-1 neighbours=0.6 rest=0.16 | hall | lifted | A pure octave bell under iron, rung down and rung up
Glass carillon at noon | - | matter=Crystal heat=.1 strike=Rod blows=0 breath=.1 ticks=0 remelt=0 tail=12 neighbours=1 volume=4.5 stretch=.5 order=.6 bright=.28 ring=14 | open | calls | Crystal rung high and clear, each blow setting the others going
Table laid for twelve | - | matter=Crystal heat=0 strike=Tap blows=0 breath=0 ring=4 bright=.25 ticks=0 remelt=0 tail=2 order=.85 width=.8 volume=2 neighbours=0 stretch=-0.6 rest=0.16 | sides | contrary | Soft knuckles on crystal, quite near
Angelus under snow | - | matter=Crystal heat=.6 cooling=.6 strike=Drop blows=.2 turn=.4 breath=.1 ring=18 bright=.1 ticks=0 remelt=0 tail=8 volume=-5.5 when=Set neighbours=0.2 width=0.75 | dull | calls | Muffled crystal, more octave than strike, a drop on each note as it clears
Coin spun on marble | - | matter=Crystal heat=0 strike=Rod blows=.9 turn=7 breath=0 ring=2.5 ticks=0 remelt=0 tail=1.5 volume=3 release=Quench bright=.35 stretch=.6 order=.75 | ball | sparse | Crystal rattled fast by iron while it is held
Plate on a nail | - | matter=Glass heat=0 stretch=.9 strike=Rod blows=0 breath=0 ring=8 bright=.4 ticks=0 remelt=0 tail=5 volume=6 when=Both neighbours=1 order=0.6 rest=0.14 | plate 1.mix=.24 | calls | Overtones drawn far apart, struck once and again on leaving
Saw bent double | - | matter=Glass heat=.3 stretch=.6 cooling=.7 strike=Tap blows=.3 turn=1.5 breath=.6 ring=12 bright=.3 remelt=0 tail=4 volume=-0.5 neighbours=0.15 order=0.88 | sung | tune | Stretched glass that sings on after the hand | string
Triangle in the pit | - | matter=Bronze heat=0 stretch=1 strike=Rod blows=0 breath=0 ring=10 ticks=0 remelt=0 tail=6 volume=6 neighbours=0 rest=0.14 bright=.4 | blueair | peal | Bronze pulled as wide as it goes, high and thin
Ice on the ropes | - | matter=Sugar heat=0 stretch=.8 strike=Tap blows=0 breath=0 ring=30 bright=.6 ticks=.2 remelt=0 tail=3 volume=1.5 neighbours=0.8 width=0.9 | frost | sparse | Stretched brittle clinks, over almost before they start
Sonar, kindly | - | matter=Obsidian heat=.2 stretch=1 strike=Drop blows=0 breath=0 ring=24 bright=.9 ticks=0 remelt=0 tail=9 volume=0 neighbours=1 order=0.76 rest=0.14 width=0.75 | dark | calls | Obsidian drawn very wide, one drop and a long dim note
Gong under a cloth | - | matter=Bronze stretch=-.7 strike=Tap blows=0 breath=.2 ring=12 bright=.3 ticks=0 remelt=0 tail=6 volume=1 when=Set heat=.6 cooling=.8 neighbours=0 order=0.76 | shadow | onelow | Bronze pressed in on itself, struck softly low down once it has set
Tea gong for two guests | - | matter=Bronze heat=0 stretch=-.4 strike=Drop blows=0 breath=0 ring=7 bright=.5 ticks=0 remelt=0 tail=4 order=.8 when=Both volume=-0.5 rest=0.16 | board | lifted | A small pressed bronze, one drop going down and one coming up
Lid of the great pot | - | matter=Bronze heat=.6 cooling=1.2 stretch=-1 strike=Rod blows=.4 turn=.6 breath=.2 ring=9 bright=.6 ticks=0 tail=5 volume=1.5 order=.7 remelt=.5 every=3 rest=0.14 width=0.9 | springs | pedal | All its tones crowded together, iron on bronze that is warmed now and then
Moon gate | - | matter=Glass heat=.2 stretch=-1 strike=Tap blows=0 breath=.1 ring=16 bright=.4 ticks=0 remelt=0 tail=8 width=1 volume=1 order=0.5 rest=0.12 | spiral | calls | Glass pressed to a cluster, beating as it dies
Breaker's yard carol | - | matter=Bronze heat=.1 stretch=-.5 order=.2 strike=Rod blows=0 breath=0 ring=5 bright=.7 ticks=.3 remelt=0 tail=3 volume=6 neighbours=0.5 rest=0.16 | pile | contrary | Crowded and crooked bronze under iron, its ring cut off
Cups of salt | - | matter=Salt heat=0 strike=Rod blows=0 breath=0 ring=30 ticks=0 remelt=0 tail=3 volume=6 when=Both order=.7 neighbours=0.9 rest=0.14 bright=.28 | bowls | calls | Hollow odd toned bells with a dry front, knocked going down and up
Dice in a lantern | - | matter=Salt heat=.5 cooling=.6 order=.3 strike=Rod blows=.6 turn=3 breath=0 ring=10 bright=.7 ticks=.9 remelt=0 tail=1.5 volume=-1 release=Quench | tiles | hocket | Loose salt shaken about with iron
Pebbles with a note | - | matter=Salt heat=0 strike=Tap blows=0 breath=0 ring=18 bright=.25 ticks=0 remelt=0 tail=1 stretch=.4 volume=1.5 neighbours=0.5 rest=0.1 | pot | ostinato | Small hollow knocks, each nearly a pitch | plucked
Barley sugar stars | - | matter=Sugar heat=.1 blows=0 breath=0 ticks=.1 remelt=0 tail=2 volume=6 strike=Tap ring=30 bright=.65 neighbours=0.2 stretch=0.55 rest=0.14 | stars 1.mix=.28 | snow | Bright brittle snaps of sugar, high and small
Cutlery in the dark | - | matter=Sugar heat=.2 breath=0 bright=.5 remelt=0 tail=1 release=Quench neighbours=0.42 stretch=-0.45 rest=0.14 width=1 ticks=.3 ring=30 strike=Tap blows=.8 turn=6 order=.05 volume=-2 | slips | hocket | Scattered brittle rattles under quick taps
Alarm four floors down | - | matter=Bronze heat=0 strike=Rod blows=1 turn=8 breath=0 ring=1.5 bright=.6 ticks=0 remelt=0 tail=1.5 order=.7 volume=6 rest=0.12 | door | again | Small bronze hammered eight times a second
Cable car gong | - | matter=Bronze heat=0 strike=Rod blows=.9 turn=3.2 breath=0 ring=4 bright=.4 ticks=0 remelt=0 tail=3 width=.3 volume=6 neighbours=0.2 order=0.6 stretch=0.25 rest=0.12 | slap | again | Iron on bronze, three quick knocks a second
Pendulum of ice | - | matter=Glass heat=0 strike=Rod blows=.8 breath=0 ring=9 bright=.5 ticks=.1 remelt=0 tail=5 volume=1 order=.5 stretch=.4 turn=.8 neighbours=1 | round | ninth | One stroke a second on each note of loose wide glass, shaking the others
Buoys in a cross sea | - | matter=Bronze heat=.4 strike=Tap blows=.8 turn=.7 breath=.3 ring=11 bright=.45 ticks=0 remelt=.4 every=1.7 tail=5 width=1 when=Set volume=6 neighbours=0.42 order=0.76 stretch=-0.45 | shore | ninth | Each bell tolls at its own pace once it is cold enough
Sleigh with one runner | - | matter=Crystal heat=0 strike=Tap blows=.8 turn=5 breath=0 bright=.8 ticks=0 remelt=0 tail=1 order=.5 width=1 volume=6 ring=.5 stretch=0.55 rest=0.1 | weave | peal | Tiny loose crystal shaken hard, high and bright
Needle of noon | - | matter=Glass heat=0 strike=Rod blows=0 breath=0 ring=20 bright=.2 ticks=0 remelt=0 tail=10 order=1 width=.2 volume=6 neighbours=0.15 rest=0.16 | climb | snow | One thin glass tone at the very top
Stars over the quarry | - | matter=Crystal heat=.3 cooling=.5 strike=Drop blows=0 breath=0 ring=9 bright=.4 ticks=.3 remelt=0 tail=6 order=.9 width=1 volume=5 neighbours=0.45 stretch=0.8 rest=0.16 | event | snow | Small crystal drops that open the air behind them
Icicle over the gutter | - | matter=Glass heat=.4 cooling=.4 strike=Drop blows=.5 turn=2.6 breath=0 ring=2.4 bright=.6 ticks=.4 remelt=0 tail=2 stretch=.3 volume=5 neighbours=0.42 order=0.68 | pipe | sparse | Fast drops on thin cold tones, each gone in two seconds
Birdcage with a clock | - | matter=Bronze heat=0 strike=Tap blows=.6 turn=4 breath=0 ring=3 bright=.9 ticks=0 remelt=0 tail=2 order=.9 volume=6 neighbours=0.7 stretch=-0.3 rest=0.16 | parlour | peal | Little bronze combs tapped over and over
Lark in the mercury | - | matter=Obsidian heat=.2 strike=Rod blows=0 breath=0 ring=14 ticks=0 remelt=0 tail=6 volume=6 neighbours=0 rest=0.14 bright=.6 | hop | calls | High glassy obsidian, small and vowel shaped
Bell into the river | - | matter=Bronze heat=.2 strike=Drop blows=0 breath=.2 ring=14 bright=.4 ticks=0 remelt=0 release=Remelt tail=8 order=0.84 stretch=-0.6 rest=0.1 volume=-2 | deepw 1.depth=.45 | lifted | Bronze that falls tone by tone once it is let go
Wax seal on a chime | - | matter=Crystal strike=Rod blows=0 ring=10 bright=.5 ticks=0 remelt=0 release=Remelt tail=4 volume=-1.5 when=Release neighbours=0.9 rest=0.1 width=0.4 breath=1 heat=.5 | sag | lifted | Crystal struck as it is let go, its lowest octaves sinking first
Drowned at last stroke | - | matter=Bronze strike=Rod blows=0 ring=18 bright=.55 ticks=.8 remelt=0 release=Quench tail=3 volume=1.5 when=Release neighbours=0.1 stretch=-0.6 rest=0.14 width=0.4 breath=1 heat=.35 | gated | lifted | A breath in bronze, struck and put out in a burst of cracks
Warped by the stove | - | matter=Glass heat=.7 cooling=.8 order=.4 strike=Rod blows=.3 turn=.8 breath=.3 ring=7 bright=.5 remelt=.6 every=1.4 tail=4 volume=0.5 neighbours=0 stretch=0.25 | chime | calls | Crooked glass softened a little each second and a half
Shards swept aside | - | matter=Sugar heat=.6 cooling=1 order=0 strike=Pour blows=.4 turn=.7 breath=.1 ring=26 bright=.8 ticks=1 remelt=0 tail=3 width=1 neighbours=0.5 stretch=-0.45 edge=0.08 | back | sparse | Scattered sugar poured out in a bright heap | texture
`,
    },
    {
      id: 'pouring',
      name: 'Pouring textures',
      category: 'texture',
      rows: `
Ladle over the mould | Pouring texture | blows=.6 turn=.35 ticks=.3 bright=.35 ring=10 breath=.15 order=.7 stretch=.2 rest=.15 neighbours=0.9 edge=0.6 volume=-3 | hall 1.mix=.24 | turn | One long stream of glass to a chord, then another
Beads on a tilted tray | Pouring texture | matter=Glass heat=0 blows=1 turn=.6 ticks=.2 bright=.75 ring=1.5 tail=2 breath=0 volume=2 release=Quench neighbours=0 stretch=0.25 | sides | hocket | Cold glass beads run down and stop
Chain of warm rain | Pouring texture | heat=1 cooling=1.4 bright=.4 ring=3 ticks=.4 volume=-1 stretch=.3 turn=1.1 remelt=.9 every=.9 order=.7 strike=Pour neighbours=0.2 | cloud | fourths | Loose poured glass softened every second under the stream
Stair of dark water | Pouring texture | heat=.7 cooling=2.4 turn=.25 bright=.15 ring=16 ticks=.1 width=.4 breath=.4 volume=-0.5 rest=.25 order=.8 neighbours=0 stretch=0.6 | shadow | rise | A slow pour with a soft note under it
Gravel in a crystal bowl | Pouring texture | matter=Crystal order=.3 heat=.2 turn=.7 ring=5 ticks=.7 breath=0 volume=4 neighbours=0.15 stretch=-0.45 rest=0.12 bright=.32 | bowls | sparse | Loose crystal tipped in all at once
Sugar down the chute | Pouring texture | matter=Sugar heat=.3 turn=.8 ticks=.6 ring=24 bright=.6 breath=0 tail=1.5 neighbours=0.1 order=0.86 rest=0.16 | board | broken | Dry bright grains on every key
Salt cellar knocked over | Pouring texture | matter=Salt heat=.2 turn=.6 ticks=1 ring=16 breath=.1 tail=2 order=.6 volume=0.5 neighbours=0.1 stretch=0.25 rest=0.25 bright=.6 | panned | sparse | A dry spill of hollow grains, loosely tuned
Sunbeam on flour sacks | Pouring texture | matter=Salt heat=.9 cooling=1.5 turn=.4 ticks=.3 bright=.25 breath=.6 ring=26 edge=.9 volume=-3.5 neighbours=0.2 rest=0.28 | summer | turn | A soft wide pour of salt with air all through it
Hail, then honey | Pouring texture | matter=Sugar heat=1 cooling=2.5 turn=.4 ticks=.9 bright=.4 ring=30 release=Remelt tail=5 neighbours=0.2 stretch=0.25 rest=0.4 | smear | lifted | Hot sugar clicks while it is held and slides when it is not
Rice on a drumhead | Pouring texture | matter=Sugar heat=0 turn=1.4 blows=1 ticks=0 bright=.3 ring=8 breath=0 tail=.8 width=.3 release=Quench neighbours=1 order=0.65 | throb | stride | Dull dry pours, one on the tail of the next
Snow inside the hothouse | Grains on the floor | matter=Glass turn=3 bright=.5 ring=6 edge=0 volume=-1.5 cooling=18 heat=.6 order=0.45 stretch=-0.45 | mist | ninth | A thin fall of pings over warm glass
Ants in the sugar | Grains on the floor | turn=8 blows=.7 ring=20 bright=.45 breath=0 width=.5 volume=5.5 neighbours=0.15 order=0.86 rest=0.16 | near | hocket | Tiny quick taps on ticking sugar
Frost climbing the pane | Grains on the floor | matter=Crystal cooling=2.5 turn=2 bright=.8 ring=3 blows=.2 volume=4 neighbours=0.2 order=0.45 | blueair | rise | Little high cracks of crystal, closer and closer
Garden of small clicks | Grains on the floor | matter=Salt cooling=3 turn=6 order=.2 neighbours=0.6 stretch=-0.8 rest=0.32 bright=.4 ticks=.8 ring=26 blows=.35 volume=5 breath=.75 | disc | tenths | Salt ticking at random on tones that miss
Beach after the wave | Grains on the floor | matter=Salt cooling=1.6 heat=1 blows=0 breath=.9 strike=Pour ring=20 bright=.4 width=1 rest=0.32 volume=-3.5 | tidal | turn | A wash of wet grains drawn back and back
Loom at half speed | - | heat=.1 strike=Rod blows=.9 turn=5 breath=0 bright=.4 ticks=0 remelt=0 tail=.8 width=1 order=.6 volume=2 ring=.4 | weave | fourths | Iron crossing cold loose glass like a shuttle
Typing pool after six | - | matter=Sugar heat=0 strike=Tap blows=.8 turn=6.5 breath=0 ring=12 bright=.4 ticks=.3 remelt=0 tail=.6 width=.7 order=0.65 rest=0.28 | rooms | ninth | Quick dry keys of sugar, too many for one typist
Rain in a tin cup | - | matter=Salt heat=.2 strike=Tap blows=.9 turn=4 breath=0 ring=14 bright=.35 ticks=.2 remelt=0 tail=.8 neighbours=0.8 order=0.65 stretch=0.6 rest=0.12 width=0.4 | drops | fourths | Small hollow taps counted out, each a little apart
Knitting needles | - | matter=Bronze heat=0 strike=Rod blows=.7 turn=6 breath=0 bright=.8 ticks=0 remelt=0 tail=.5 width=.8 stretch=.7 volume=6 release=Quench ring=.4 rest=0.25 | booth | hocket | Thin stretched bronze clicking very short
Castor wheels on tile | - | matter=Obsidian heat=.1 strike=Rod blows=1 turn=7 breath=.1 ring=1 ticks=0 remelt=0 tail=.6 volume=3.5 neighbours=0.15 rest=0.14 bright=.6 | comb | turn | Black stone rattled along at seven a second
Bubbles through a straw | - | heat=1 cooling=3 rest=.4 strike=Drop blows=1 turn=3 breath=.2 bright=.4 ring=4 ticks=0 remelt=0 tail=1.5 volume=-0.5 neighbours=0.9 stretch=-0.45 | shallow | hocket | Drop after drop into glass that stays hot
Roof of leaves dripping | - | strike=Drop blows=.8 turn=1.6 breath=.1 bright=.5 ring=3 ticks=.2 remelt=0 tail=2 width=1 volume=-7 when=Set heat=.6 cooling=.8 order=0.45 stretch=0.85 | drops | rise | Drops that wait until the glass is cool, each key at a pace of its own
Spring under the floor | - | matter=Obsidian heat=.8 strike=Drop blows=1 turn=2.4 breath=.3 bright=.6 ring=4 ticks=0 remelt=.3 every=1.1 tail=2 volume=2 when=Set cooling=.8 neighbours=0 order=0.55 stretch=-0.3 | cistern | pedal | Dark bubbles that stop whenever the note below goes soft
Pipette | - | matter=Crystal heat=.3 cooling=.4 strike=Drop blows=.6 turn=1 breath=0 bright=.6 ring=1.2 ticks=0 remelt=0 tail=1 width=.2 order=1 when=Both volume=5.5 rest=0.2 | bare | lifted | Drops of crystal, one at each end of a note
Lemonade on the lawn | - | matter=Sugar heat=.6 cooling=1 strike=Drop blows=.9 turn=4 breath=.1 bright=.7 ring=26 ticks=.9 tail=1.5 volume=-1 order=0.86 rest=0.25 remelt=.2 every=1.4 | lift2 | hocket | Fizzing sugar, every bubble a note
Air over hot sand | - | heat=1 breath=.8 blows=0 strike=Tap ticks=0 bright=.5 remelt=0 tail=3 volume=5.5 rest=1 edge=.5 neighbours=0 order=0.72 stretch=0.85 width=0.8 | current | ninth | No glass at all, only tuned moving air
Roaring two fields away | - | heat=1 rest=.6 breath=1 blows=0 strike=Pour ticks=.1 bright=.2 edge=.6 remelt=.4 every=2 tail=4 volume=-2 neighbours=0.15 order=0.45 stretch=0.4 | far | open | The furnace itself, low and distant
Silk through a ring | - | matter=Crystal heat=.8 cooling=1 blows=0 strike=Tap ticks=0 edge=.8 remelt=0 tail=2 volume=-2.5 when=Set breath=1 rest=.28 bright=.7 neighbours=0 order=0.55 stretch=-0.3 width=0.4 | dense 1.makeup=14 | turn | Pale bright air over crystal that comes up broadly
Surf in a bottle | - | matter=Salt heat=.9 rest=.4 breath=1 blows=0 strike=Tap ticks=.2 bright=.6 edge=.7 remelt=1 every=2.2 tail=2 volume=6 order=0.72 stretch=.55 | lossy | fourths | Hollow air heaved up and let fall
Steam laundry | - | matter=Bronze heat=.9 rest=.35 breath=.9 blows=.5 turn=2.2 strike=Tap ticks=.2 bright=.5 edge=.5 remelt=.5 every=.8 tail=1.5 volume=2 neighbours=1 order=0.45 stretch=0.6 width=0.8 | flicker | fourths | Bronze thumps and vents in damp heat
Nails into a bucket | Pouring texture | matter=Bronze heat=0 turn=.6 ticks=.4 bright=.7 ring=2 order=.3 breath=0 tail=1.5 volume=5.5 neighbours=1 stretch=0.85 rest=0.28 | combo | sparse | A handful of crooked little bronze, poured cold
Copper rain chain | Pouring texture | matter=Bronze heat=.6 cooling=.8 turn=.5 ticks=.2 bright=.5 ring=9 breath=.1 tail=5 stretch=.3 when=Set order=0.45 volume=-3 | ripple | rise | Bronze that sets and is poured over, running link to link
Coins for the ferryman | Pouring texture | matter=Bronze heat=.3 cooling=.4 turn=.3 blows=.5 ticks=0 bright=.35 ring=16 tail=8 order=.9 neighbours=0.6 stretch=-0.6 rest=0.22 volume=-2 | embers | calls | A slow handful of bronze that drops away below
Moon on a grain silo | Pouring texture | matter=Bronze heat=.9 cooling=2.2 ticks=.5 ring=5 breath=.4 tail=3 width=1 volume=1.5 turn=1.6 stretch=.5 bright=.5 neighbours=0.45 order=0.8 rest=0.22 | swarm | pedal | Wide metal grains running inside a great round wall
Minted and spilled | Pouring texture | matter=Bronze heat=.1 turn=1.2 blows=1 ticks=.1 breath=0 tail=1 stretch=-.4 volume=6 bright=.75 ring=4 neighbours=0.7 | glint | snow | Bright pressed bronze poured cold again and again
Slow black avalanche | Pouring texture | matter=Obsidian heat=1 cooling=3 bright=.5 ring=6 edge=.9 tail=5 volume=6 rest=0.16 order=.25 ticks=1 turn=.9 breath=.15 stretch=-.8 | cave | open | Black stone slides a long way down a dark slope
Tiles off the old roof | Pouring texture | matter=Obsidian heat=0 turn=.7 ticks=.3 bright=.9 ring=2 breath=0 tail=1.5 volume=1.5 when=Both release=Quench neighbours=0.1 stretch=0.6 | gated | lifted | Cold slabs of stone in a heap, and a second heap after it
Ash sifted through silk | Pouring texture | matter=Obsidian heat=.8 cooling=1 turn=.5 ticks=0 bright=.8 ring=10 breath=.8 edge=1 tail=3 width=.3 volume=-2 neighbours=0.1 rest=0.12 | whisper | turn | Fine black grains with a vowel inside
Magma muttering | Pouring texture | matter=Obsidian heat=.9 rest=.35 turn=.9 blows=1 ticks=.1 bright=.65 breath=.4 tail=2 remelt=0 volume=6 neighbours=0.2 | wah | pedal | Thick slow bubbles that seem to mouth something
Scree at the last light | Pouring texture | matter=Obsidian heat=.5 cooling=.6 turn=.3 ticks=1 bright=.7 ring=20 breath=0 order=.2 tail=6 stretch=0.25 rest=0.32 | parted | rise | Broken stone running down and sorting itself
Lake ice at midnight | - | edge=0 ticks=1 blows=0 strike=Tap breath=.15 bright=.6 ring=14 remelt=0 tail=6 order=.5 volume=3.5 cooling=24 heat=.7 neighbours=0.15 stretch=0.85 width=0.3 | valley | open | Long gaps and sudden pings as the glass shrinks
Engine ticking in a lane | - | matter=Bronze heat=.9 cooling=2.5 edge=.02 ticks=1 blows=0 strike=Tap breath=.05 bright=.5 ring=2.5 remelt=0 tail=2 volume=2 neighbours=0 order=0.45 | table | fourths | Bronze ticks fast and then slower as it cools
Star map read downward | - | matter=Crystal heat=1 cooling=3.5 edge=0 ticks=.9 blows=0 strike=Tap breath=0 bright=.65 ring=12 remelt=0 tail=6 volume=6 stretch=-0.45 width=0.5 | unfold | ninth | Little but the pings of crystal setting, from high to low
Beams in the first frost | - | matter=Obsidian heat=.9 cooling=2 edge=.05 ticks=1 blows=0 strike=Tap breath=.1 bright=.9 ring=8 order=.4 remelt=0 tail=3 volume=4 neighbours=0.8 stretch=-0.45 | frost | fourths | Dark loose pings as black stone shrinks
Popcorn under a lid | - | matter=Sugar heat=1 cooling=1.6 edge=.1 ticks=1 blows=.2 turn=3 strike=Tap breath=0 ring=30 remelt=.6 every=1.2 tail=1.5 width=.4 volume=4 neighbours=0.2 order=0.55 stretch=-0.3 rest=0.12 bright=.35 | cupboard | hocket | Sugar cracks, is warmed and cracks again
Turnstile and tide | - | heat=.6 cooling=.4 strike=Rod blows=.6 turn=1.5 breath=.7 bright=.5 ring=3 remelt=.9 every=.7 ticks=.3 tail=2 when=Set volume=0.5 neighbours=0.42 | loops | turn | An iron beat that waits for the glass, and a fire that will not
Mill with a loose slat | - | matter=Salt heat=.6 cooling=.4 strike=Tap blows=.9 turn=2 breath=.9 bright=.4 ring=12 remelt=.8 every=.5 ticks=.4 tail=1.5 volume=2 neighbours=0.15 stretch=0.6 | gusts | fourths | Hollow salt flaps and goes soft twice a second
Print the evening news | - | matter=Bronze heat=.5 cooling=.3 strike=Rod blows=.8 turn=3 breath=.2 bright=.3 ring=1.5 remelt=.7 every=.65 ticks=.2 tail=1 volume=1 rest=0.28 width=0.3 | pile | fourths | A clatter of iron on bronze that keeps going soft
Millrace, three wheels | - | matter=Crystal heat=.6 cooling=.5 strike=Pour blows=.9 turn=.9 breath=.4 bright=.3 ring=4 remelt=.7 every=1 ticks=.1 tail=3 order=0.45 stretch=-0.45 rest=0.14 edge=0.08 volume=-1 | round | fourths | Crystal poured and melted on a turning wheel
Glassworks signal | Waiting chimes | cooling=.5 heat=.7 blows=1 turn=5 matter=Sugar stretch=0 ring=30 strike=Rod tail=2 neighbours=0 order=0.72 edge=0.08 bright=.5 | recall | fourths | Sugar sets, then chatters under iron five times a second
`,
    },
    {
      id: 'remelting',
      name: 'Remelting swells',
      category: 'pad',
      rows: `
Back through the door | Remelting swells | every=2.4 remelt=.8 edge=.3 ticks=.4 bright=.4 neighbours=0.42 order=0.7 width=0.4 | hall | turn | Glass softens from the bottom every two seconds and pings as it returns
Two swells to a breath | Remelting swells | every=1.1 cooling=.7 breath=1 bright=.2 edge=.9 tail=5 neighbours=0.1 stretch=0.67 | shadow 1.mix=.25 | ninth | Round low swells, about one a second
Colour of hot iron | Remelting swells | every=1.8 remelt=1 cooling=2 bright=.6 strike=Drop blows=.3 turn=.6 volume=2.5 | ensemble | fourths | Heated right through each time, so that only the top has come back
Tide in a water glass | Remelting swells | every=1.5 remelt=.5 ring=14 edge=1 release=Anneal tail=6 width=1 volume=-2.5 neighbours=0.8 stretch=0.67 blows=0.2 turn=0.25 | water | sevenths | Half softened and half returning, with no seam between
Sleeper turning over | Remelting swells | every=3 heat=.4 cooling=1 breath=.5 bright=.3 release=Anneal stretch=-.4 neighbours=1 rest=0.2 volume=-0.5 | dull | turn | Close tones dip into the heat and rise again
Wings against the lamp | Remelting swells | every=.45 cooling=.4 remelt=.7 edge=.4 volume=-2.5 stretch=.3 order=.75 bright=.75 neighbours=0.42 rest=0.12 | shudder | turn | Two flutters a second, light, wide and quick
Shiver in the curtain | Remelting swells | every=.6 cooling=.3 remelt=1 breath=.6 matter=Crystal bright=.3 ring=10 volume=-2.5 neighbours=0.2 order=0.88 stretch=-0.67 | sides | tenths | Narrowed crystal winks in and out almost twice a second
Cartwheel, backlit | Remelting swells | every=.4 cooling=.2 remelt=.9 strike=Tap blows=.3 turn=5 bright=.5 volume=5 neighbours=0.42 rest=0.22 | phase | fourths | Fast soft beats where heat and hand cross
Heat haze on tarmac | Remelting swells | every=.5 cooling=.5 remelt=.5 edge=1 breath=1 bright=.75 rest=.25 volume=-2 order=0.75 stretch=0.67 | comb | ninth | The top shakes over warm glass
Humming in a lift shaft | Remelting swells | every=.7 cooling=.4 remelt=.6 matter=Obsidian bright=.8 ring=6 breath=1 neighbours=0.9 order=0.85 rest=0.32 volume=-0.5 | cistern | turn | Dark obsidian that gulps under its own hum
One tide a page | Remelting swells | every=6 cooling=2.5 remelt=1 ring=20 bright=.4 release=Anneal tail=9 volume=-1 neighbours=0 order=0.8 | open | open | A single melting in six seconds, and a long clearing
Moonset | Remelting swells | every=8 cooling=1.5 remelt=.8 heat=.5 matter=Crystal ring=26 bright=.2 release=Remelt tail=12 neighbours=0.1 order=0.88 turn=3.8 blows=0 | nave | turn | Crystal set early and left to sink at the end
Far shift at the furnace | Remelting swells | every=4 cooling=.8 remelt=1 breath=.9 strike=Pour blows=.4 turn=.3 bright=.5 volume=-3.5 | far | rise | Poured, cleared, and after four seconds poured again
Lamp inside a glacier | Remelting swells | every=10 heat=.9 cooling=4 breath=.8 bright=.5 edge=.5 release=Anneal tail=8 volume=-2.5 neighbours=0.1 order=0.64 stretch=0.67 | frost | open | One slow clearing of widened glass, never quite let finish
Noon to one | Remelting swells | every=5 heat=.2 remelt=.9 cooling=3 breath=.6 strike=Drop ring=12 bright=.5 volume=-4.5 neighbours=0.45 order=0.75 | valley | turn | It begins cold and clear and is warmed only later
Crystal lent and paid | Remelting swells | matter=Crystal every=2 cooling=1.2 ring=18 bright=.45 ticks=.3 release=Anneal tail=7 volume=-2 neighbours=0.15 rest=0.4 width=0.8 blows=.3 turn=.3 | climb | ninth | The low crystal tones are lost, and only the upper ones are given back
Two panes, sliding | Remelting swells | matter=Crystal every=1.3 cooling=.6 order=.5 ring=9 bright=.3 width=1 release=Anneal volume=-3.5 neighbours=0.7 rest=0.22 blows=.3 turn=.3 | parted | sevenths | Beating crystal that slips in and out of true
Mirror breathed on | Remelting swells | matter=Crystal every=3.2 remelt=.6 breath=1 edge=.8 bright=.7 strike=Tap tail=4 volume=3 neighbours=0.9 stretch=-0.67 | blueair | tenths | A bright breath clouds close drawn crystal and it clears again
Snow on the lattice mast | Remelting swells | matter=Crystal every=.9 remelt=.8 stretch=.5 ring=6 heat=.5 volume=-1.5 bright=.55 neighbours=0.42 turn=3.8 blows=0 | lossy | fourths | Wide thin crystal in quick waves
Holding up the sun | Remelting swells | matter=Crystal every=1.6 remelt=.4 strike=Rod heat=.6 bright=.5 release=Anneal volume=-3 rest=.3 edge=.15 turn=2.2 blows=.9 ring=1.5 order=0.64 | fan | rise | Quick iron touches on crystal that is never let go cold
Bronze taking breath | Remelting swells | matter=Bronze every=2.2 cooling=1 ring=12 bright=.4 release=Anneal tail=6 volume=-0.5 order=0.64 rest=0.28 blows=.35 turn=.35 | lungs | ninth | The hum of bronze goes soft and gathers again
Bells in a warm wind | Remelting swells | matter=Bronze every=1.4 cooling=.6 strike=Rod blows=.4 turn=.7 ring=9 bright=.5 neighbours=.8 volume=2 rest=0.2 width=0.4 | gusts | fourths | Bronze struck in the wind, wavering with heat
Slow brass by one lamp | Remelting swells | matter=Bronze every=3 cooling=1.6 breath=1 edge=.9 bright=.25 strike=Tap volume=4 neighbours=0 stretch=0.25 | glow | sevenths | Round low swells of bronze with nothing sharp in them
Gold leaf lifting | Remelting swells | matter=Bronze every=.8 cooling=.5 remelt=.7 bright=.8 order=.7 width=1 heat=.4 volume=-1 neighbours=0.6 rest=0.2 blows=0.3 turn=0.9 | ripple | turn | The thin edge of poured bronze flickers in and out
Old gong at the fire | Remelting swells | matter=Bronze every=1.8 cooling=1.2 stretch=-.6 breath=.6 strike=Drop blows=.3 turn=.4 bright=.4 volume=1 neighbours=0.9 order=0.85 rest=0.28 width=0.75 | springs | open | Pressed bronze dropped on and drawn through heat
Mouths opening in rock | Remelting swells | matter=Obsidian every=1.7 cooling=.8 breath=1 bright=.65 edge=.8 volume=0 rest=0.2 | choir | turn | Stone softens shut and opens to a vowel again | voice
Yawn of the quarry | Remelting swells | matter=Obsidian every=3 cooling=2 breath=.9 bright=.8 edge=1 strike=Tap tail=5 volume=6 neighbours=0.1 order=0.88 rest=0.12 | giant | open | One very wide, very slow vowel | voice
Murmur in the pews | Remelting swells | matter=Obsidian every=.9 cooling=.4 breath=.7 bright=.45 ring=5 width=.7 order=.8 rest=0.14 stretch=0 volume=-4.5 | chapel | contrary | Low quick murmuring with no word in it | voice
Coal that remembers | Remelting swells | matter=Obsidian every=2 cooling=1 bright=.5 strike=Drop blows=.5 turn=.5 ticks=.5 volume=4 neighbours=0.9 rest=0.25 | recall | fourths | Dark drops, each one warmed and heard again
Wet basalt organ | Remelting swells | matter=Obsidian every=1.2 cooling=.5 remelt=.5 breath=1 bright=.95 heat=.3 strike=Tap volume=2 neighbours=0.9 order=0.8 rest=0.16 | shallow | contrary | A bright buzzing stone organ under moving water | organ
Salt on the turn | Remelting swells | matter=Salt every=1.5 ring=20 bright=.35 breath=.9 ticks=.4 order=.65 stretch=-.3 neighbours=0.15 rest=0.16 blows=.4 turn=.4 volume=-4 | bed | ninth | Loose hollow tones sucked away and let come back
Wind through the weir | Remelting swells | matter=Salt every=.7 cooling=.5 breath=1 bright=.6 remelt=.8 width=1 volume=-2.5 neighbours=0.15 order=0.8 | weave | fourths | Hollow gusts of salt, more than one a second
Caramel, not yet dark | Remelting swells | matter=Sugar every=1.4 breath=1 ring=30 bright=.4 blows=.4 turn=2 strike=Pour neighbours=0.2 rest=0.28 width=0.5 volume=-4.5 | warmwall | turn | Sugar poured and warmed until it nearly holds
Marram grass at dusk | Remelting swells | matter=Salt every=2.6 order=.4 breath=.7 bright=.75 ring=26 edge=.5 strike=Tap volume=6 neighbours=0.7 width=0.3 | moved | sevenths | Loose hollow tones lean over and stand up again
Bee glass | Remelting swells | matter=Sugar every=.5 remelt=.6 breath=1 blows=.9 turn=8 bright=.45 ring=30 strike=Tap volume=3.5 neighbours=0.1 order=0.88 | ensemble | tenths | A fast dry buzz that dips twice a second
Anvil in the swell | Remelting swells | strike=Rod blows=.9 turn=1.5 breath=.4 bright=.45 ring=6 ticks=.3 volume=-2 when=Set every=2.6 cooling=.8 neighbours=0 width=0.75 | stone | ninth | Iron that strikes only while the glass is hard, and waits out each visit to the fire
Pulse of a warm wall | Remelting swells | strike=Tap turn=2.2 every=1.6 breath=.5 bright=.15 edge=.4 neighbours=0.45 volume=-2 blows=.7 ring=5 | soft3 | fourths | A palm beats on the glass whether it is hard or melted
Oars and the undertow | Remelting swells | strike=Drop blows=.8 turn=.7 every=1.5 ring=7 bright=.4 breath=.6 ticks=0 volume=1.5 neighbours=0.2 order=0.85 rest=0.12 | undertow | open | Big slow drops into a chord that comes and goes
Glass harp in poor light | Remelting swells | strike=Rod blows=.5 turn=3.5 every=1.2 matter=Crystal ring=4 breath=.3 volume=-2 neighbours=0 rest=0.28 width=0.3 bright=.25 | hop | turn | Quick touches on crystal between two fires
Stoker and bell ringer | Remelting swells | strike=Rod blows=.7 turn=.6 every=.8 matter=Bronze bright=.35 ring=10 breath=.4 volume=6 neighbours=0.42 rest=0.28 width=1 | slowing | sevenths | A slow bell over a fast fire
Wick falling over | Remelting swells | heat=.3 remelt=.2 release=Remelt tail=10 ring=16 bright=.35 breath=.4 strike=Drop volume=-0.5 neighbours=0.45 | sag | lifted | Clear while held, then every tone falls in turn
Let down by ropes | Remelting swells | cooling=.4 remelt=0 release=Remelt tail=14 matter=Bronze strike=Tap ring=20 bright=.45 blows=.2 turn=.8 when=Release heat=.5 volume=-1 neighbours=0.45 order=0.88 rest=0.14 | sink | lifted | Breath in bronze, struck as it goes and lowered hum first
Candle stairs | Remelting swells | heat=.2 remelt=0 release=Remelt tail=6 matter=Crystal strike=Rod ring=12 breath=.2 bright=.5 ticks=.5 when=Both blows=.3 turn=3 volume=-3 width=0.4 rest=.15 | embers | lifted | Crystal struck on leaving too, then a short stair going down
Snowman in April | Remelting swells | heat=.6 cooling=.5 release=Remelt tail=18 every=1 remelt=.4 breath=.8 bright=.3 edge=.7 neighbours=0.2 order=0.75 stretch=-0.67 turn=1.3 width=1 blows=0 | drops | lifted | It takes eighteen seconds to melt and will not be hurried
Sugar in hot tea | Remelting swells | matter=Sugar heat=.2 remelt=0 release=Remelt tail=3 strike=Drop ring=30 breath=.4 bright=.5 ticks=.8 order=0.8 rest=0.2 | rooms 1.mix=.3 | lifted | Sugar drops dissolve as soon as they are left alone
Seven in one bed | Remelting swells | neighbours=1 every=1.6 remelt=.6 breath=.6 bright=.35 heat=1 cooling=1.4 volume=-2.5 | follow | fourths | The keys keep one another warm and set together late
Each to his own stove | Remelting swells | neighbours=0 every=1.9 remelt=.9 breath=.8 bright=.45 width=1 edge=.5 volume=0 order=0.88 stretch=0.67 rest=0.28 | circle | rise | No key shares its heat, and each swells alone with a ninth above it
Frost line in the chord | Remelting swells | every=1.5 remelt=.6 breath=.8 bright=.7 edge=.3 cooling=.8 matter=Bronze rest=.5 stretch=.4 order=.7 neighbours=0 volume=-1.5 | halo | ninth | Only the upper part of the bronze ever sets, and it keeps slipping
Warmest in the middle | Remelting swells | rest=.3 every=2.2 remelt=.4 matter=Bronze neighbours=.8 breath=.7 bright=.5 volume=0 | chorale | turn | Bronze kept soft below and shared across the hand
Light under a lake door | Remelting swells | rest=.6 every=1.1 remelt=.5 matter=Crystal breath=.9 bright=.4 edge=.7 width=.9 volume=2.5 order=0.75 | deepw 1.depth=.35 | tenths | A pale rim of crystal pulses a long way down
`,
    },
    {
      id: 'sugar-plucks',
      name: 'Sugar plucks',
      category: 'plucked',
      rows: `
Snapped at the table | Sugar plucks | ring=6 bright=.35 ticks=.1 heat=.05 width=.2 volume=2 stretch=0.45 | bare | broken | A short snap of sugar with a clear note in it
Toffee hammer | Sugar plucks | strike=Rod ring=24 bright=.55 tail=1 heat=0 volume=-8 release=Quench neighbours=0.15 stretch=0.45 | chamber | stride | Iron on cold sugar, hard and quick
Spun over a spoon | Sugar plucks | ring=30 bright=.75 ticks=.6 order=.6 width=1 tail=3 volume=0 neighbours=0.8 stretch=-0.5 rest=0.14 | lift2 | broken | Fine loose threads of sugar, glinting
Burnt at the rim | Sugar plucks | heat=.5 cooling=.5 ring=16 bright=.1 ticks=.2 tail=2.5 volume=4 neighbours=0.15 order=0.87 stretch=-0.5 rest=0.1 blows=0.8 turn=0.4 | blanket | tune | Dark soft sugar, muffled from the first moment
Brittle, then brittle | Sugar plucks | ring=10 ticks=1 release=Quench tail=1 bright=.5 volume=2.5 neighbours=0.6 rest=0.24 | struck | ostinato | It snaps as it is struck and again as it is let go
Syrup off the fork | Sugar plucks | strike=Drop heat=.5 cooling=.7 ring=28 bright=.3 ticks=0 volume=1.5 neighbours=0.7 order=0.64 rest=0.14 edge=0.85 | glued | tune | Round drops of syrup that are gone by the next one
Raindrop on an awning | Sugar plucks | strike=Drop heat=.2 ring=12 bright=.55 ticks=0 width=.7 volume=4 when=Both neighbours=0.2 order=0.7 stretch=-0.35 rest=0.16 | drops | hocket | Quick taut drops, and one more as each key lifts
Lollipop metronome | Sugar plucks | strike=Drop blows=.6 turn=2 ring=18 bright=.45 heat=.3 volume=0.5 stretch=.5 order=.8 neighbours=0.6 rest=0.14 edge=1 | slap | tenths | A drop that repeats itself while the key is kept
Bead door in a breeze | Sugar plucks | strike=Pour blows=0 ring=26 bright=.65 heat=.1 tail=2 neighbours=0.1 order=0.64 stretch=0.3 width=.55 | sides | broken | Every note is a short run of beads
Dropped stitch | Sugar plucks | strike=Drop heat=.6 cooling=.5 release=Remelt bright=.4 volume=0 order=0.64 stretch=-0.5 tail=2 neighbours=.45 ring=14 | sag | calls | A drop of sugar, and then its tones slipping down
Harp in the hallway | - | heat=.1 strike=Tap blows=0 breath=0 ring=5 bright=.35 ticks=0 remelt=0 tail=3 width=.7 order=0.64 stretch=0.2 | hall 1.mix=.22 | broken | Fingertips on clear glass, left to ring a little
Nylon by an open window | - | cooling=.3 breath=0 ring=2.5 bright=.2 ticks=0 remelt=0 width=.3 strike=Drop heat=.35 release=Remelt tail=2 blows=0 order=.8 stretch=-0.35 volume=-1.5 | board | broken | Round wet plucks that sink as they are let go
Lute by one candle | - | heat=0 strike=Rod blows=0 breath=0 ring=2 bright=.25 ticks=0 remelt=0 tail=1 order=.85 volume=6 neighbours=0.1 stretch=-0.35 rest=0.2 | chapel | tune | Thin plucked glass, its tones not quite together
Zither with snow outside | - | heat=0 strike=Rod blows=0 breath=0 ring=10 bright=.4 ticks=0 remelt=0 tail=8 neighbours=1 width=1 volume=-1.5 stretch=0.2 | wires | broken | Iron plectrum on glass, every key shaking the next
Guitar strung in glass | - | heat=.3 cooling=.4 strike=Drop blows=0 breath=.1 ring=4 bright=.5 ticks=.1 remelt=0 tail=1.5 volume=5 release=Quench neighbours=0.9 stretch=0.3 rest=0.24 edge=1 | combo | stride | Wet plucks, round at the front and short
Celesta under a coat | - | matter=Crystal heat=.1 strike=Tap blows=0 breath=0 ring=1.6 bright=.3 ticks=0 remelt=0 volume=0 when=Both tail=2.4 neighbours=0.15 width=0.8 | felted | broken | Short crystal plucks, octaves and no edge, a fainter one on leaving
Stars on a comb | - | matter=Crystal heat=0 strike=Rod blows=0 breath=0 ring=2.4 ticks=0 remelt=0 tail=2 width=.9 volume=4 order=0.82 stretch=-0.5 rest=0.16 bright=.3 | tiles | broken | Little crystal teeth that ring and are gone
Winter cherries | - | matter=Crystal heat=.5 cooling=.5 strike=Drop blows=0 breath=0 ring=5 bright=.4 ticks=.4 remelt=0 tail=3 volume=6 when=Set neighbours=0.2 order=0.82 stretch=-0.25 edge=0.85 width=0.4 | bright | tenths | Ripe round drops of crystal, each a moment after its key
Fountain, three jets | - | matter=Crystal heat=.2 strike=Pour blows=.3 turn=.6 breath=0 ring=3 bright=.5 ticks=.1 remelt=0 tail=2.5 neighbours=0.8 order=0.7 stretch=-0.35 rest=0.12 width=0.5 | rain | broken | Crystal spilling from every key
Pinned to velvet | - | matter=Crystal heat=0 strike=Tap blows=0 breath=0 bright=.15 ticks=0 remelt=0 tail=.6 order=1 width=.1 ring=.35 neighbours=1 rest=0.1 volume=-1.5 | dense | ostinato | The shortest pure crystal pluck
Thumbs and a gourd | - | matter=Bronze heat=.1 strike=Tap blows=0 breath=0 ring=1.8 bright=.4 ticks=0 remelt=0 tail=1 stretch=.2 volume=1.5 neighbours=1 order=0.76 rest=0.1 width=0.75 | pot | stride | Short bronze tongues under a thumb
Lamellae on the water | - | matter=Bronze heat=0 strike=Tap blows=0 breath=0 ring=3 bright=.55 ticks=.1 remelt=0 tail=2 volume=6 when=Both order=.7 neighbours=0.6 stretch=0.3 rest=0.14 | buzz | hocket | Bronze tongues plucked on both sides of a note
Wound string on a nail | - | heat=.3 cooling=.3 strike=Rod blows=0 breath=0 ticks=0 remelt=0 tail=.8 width=.2 volume=4.5 matter=Obsidian order=.75 when=Both bright=.6 ring=4 neighbours=0.15 stretch=-0.35 rest=0.16 | stub | walk | Dark low strings picked with iron, and once more as each is left
Cimbalom at the well | - | matter=Bronze heat=0 strike=Rod blows=.3 turn=3 breath=0 ring=5 bright=.7 ticks=0 remelt=0 tail=3 volume=4 order=.6 stretch=.25 neighbours=0.15 rest=0.16 | dotted | broken | Bright loose hammered bronze with quick blows between
Kettle strings | - | matter=Bronze heat=.5 cooling=.5 strike=Drop blows=0 breath=.2 ring=6 bright=.35 ticks=0 remelt=0 tail=3 release=Remelt volume=1.5 stretch=0.45 rest=0.2 edge=0.7 | springs | calls | Bronze drops that go limp on release
Pizzicato in the pantry | - | matter=Salt heat=0 strike=Tap blows=0 breath=0 ring=14 bright=.3 ticks=0 remelt=0 tail=.5 width=.3 volume=3 when=Both order=.7 stretch=-.2 rest=0.1 | table | stride | Hollow little plucks with a wooden front and one more on leaving
Bamboo two gardens over | - | matter=Salt heat=0 strike=Tap blows=0 breath=.1 ring=28 bright=.2 ticks=0 remelt=0 tail=1.5 stretch=-.3 volume=2.5 neighbours=0.15 rest=0.16 width=0.8 | far | calls | Hollow knocks from somewhere behind a hedge
Salt harp | - | matter=Salt heat=.1 strike=Rod blows=0 breath=0 ring=30 ticks=.2 remelt=0 tail=3 width=1 neighbours=0.6 rest=0.24 bright=.35 volume=3 | fifths | stride | Odd toned strings, dry at the pick and long after
Crab on the piano lid | - | matter=Salt heat=.2 strike=Rod blows=.3 turn=6 breath=0 ring=10 bright=.5 ticks=.6 remelt=0 tail=.7 order=.4 volume=3 release=Quench neighbours=0.1 stretch=-0.25 rest=0.1 | slips | hocket | Scratchy small plucks that lose their footing
Very small clogs | - | matter=Salt heat=.4 cooling=.3 strike=Drop blows=0 breath=0 ring=8 bright=.15 ticks=0 remelt=0 when=Both tail=.8 volume=3 order=0.82 rest=0.1 edge=0.6 | kitchen | stride | Wet wooden drops going down and up
Gut string after hours | - | matter=Obsidian heat=.1 strike=Tap blows=0 breath=0 ring=4 bright=.65 ticks=0 remelt=0 tail=1.5 volume=3.5 neighbours=0.15 order=0.76 width=0.4 | reel | tune | A dark warm pluck with a vowel in it
Bass side of the oud | - | matter=Obsidian heat=0 strike=Rod blows=0 breath=0 ring=3 bright=.85 ticks=0 remelt=0 tail=1 order=.9 volume=4.5 neighbours=1 stretch=-0.35 rest=0.2 | valve | walk | Black stone strings under an iron pick
Lizard on warm slate | - | matter=Obsidian heat=.2 strike=Tap blows=.4 turn=6 breath=0 ring=2 bright=.9 ticks=0 remelt=0 tail=.8 volume=6 release=Quench neighbours=0.2 order=0.82 stretch=-0.35 rest=0.2 width=0.75 | early | ostinato | Quick dark plucks, grainy at the edges
Crow picks up a nail | - | matter=Obsidian heat=0 strike=Rod blows=0 breath=0 ring=8 ticks=.3 remelt=0 tail=3 stretch=.5 volume=6 when=Both neighbours=0.15 order=0.82 rest=0.24 width=0.75 bright=.75 | wah | calls | Wide obsidian plucked with its mouth half open, on the way down and up
Felt pick, dark harp | - | matter=Obsidian heat=.5 cooling=.4 strike=Tap blows=0 breath=.1 ring=14 bright=.5 ticks=0 remelt=0 tail=5 neighbours=.9 volume=4.5 stretch=-0.25 edge=0.15 | dull | broken | Soft plucks that set the strings beside them going
Koto with a long bridge | - | heat=0 strike=Rod breath=0 bright=.5 ticks=0 remelt=0 tail=2 width=.4 volume=6 stretch=.2 order=.75 blows=.5 turn=5 ring=2 rest=0.2 | chime | tune | Glass strings drawn a little wide, trembled with iron
Rubber and glass | - | heat=.2 stretch=-.6 strike=Tap blows=0 breath=0 ring=2 bright=.35 ticks=0 remelt=0 tail=.8 volume=0.5 neighbours=0.5 rest=0.16 width=0.9 | lowgate | stride | Glass pressed close until it is round and rubbery
Wire egg cutter | - | heat=0 stretch=.8 strike=Rod blows=0 breath=0 ring=3 ticks=0 remelt=0 tail=1 width=.9 order=.7 volume=5.5 bright=.45 neighbours=1 rest=0.16 | small | hocket | Very thin wide plucks under iron, loosely tuned
Loose fifth string | - | matter=Crystal heat=0 stretch=-.5 strike=Rod blows=0 breath=0 ring=3 bright=.3 order=.4 ticks=0 remelt=0 tail=2 volume=6 neighbours=0.9 rest=0.24 | disc | tune | Crystal gone slack and slightly sour
Spring of a lost toy | - | matter=Sugar heat=0 stretch=1 strike=Tap blows=0 breath=0 ring=30 bright=.6 ticks=0 remelt=0 tail=2 order=0.82 rest=0.12 width=0.4 volume=-2 | splash | calls | Sugar stretched into a bright boing
Balcony serenade | - | matter=Sugar heat=.1 strike=Tap blows=1 turn=8 breath=0 ring=22 bright=.4 ticks=0 remelt=0 tail=1 width=.8 order=.6 stretch=-.25 neighbours=0.42 rest=0.1 | flock | turn | Trembling sugar plucks, crowded and quick
Rolled like dice | - | heat=0 strike=Rod blows=.9 turn=6 breath=0 ticks=0 remelt=0 tail=1.2 volume=2 matter=Salt ring=8 neighbours=0.7 order=0.7 stretch=-0.35 bright=.35 | spun | tenths | Iron rolls on short hollow strings
Dulcimer with two sticks | - | matter=Bronze heat=0 strike=Tap blows=.9 turn=4.5 breath=0 ring=3 bright=.5 ticks=0 remelt=0 tail=2 width=1 neighbours=.7 volume=2 stretch=0.45 rest=0.24 | weave | turn | Soft sticks alternating on bronze
Hummingbird feeder | - | heat=.2 strike=Tap blows=.7 turn=8 breath=0 ring=1.2 bright=.6 ticks=0 remelt=0 tail=.8 volume=5.5 matter=Crystal stretch=.6 order=.7 rest=0.14 | flicker | peal | A blur of tiny wide crystal plucks, eight a second
Slow roll at the close | - | matter=Salt heat=.1 strike=Tap blows=.9 turn=3 breath=0 ring=24 bright=.25 ticks=0 remelt=0 tail=1.5 neighbours=0.5 order=0.64 rest=0.1 | pile | fourths | Hollow wooden tremolo, three strokes a second
Catapult | Let go to ring | heat=.2 cooling=.3 strike=Rod matter=Glass ring=4 tail=4 breath=.6 blows=0 bright=.45 volume=0.5 neighbours=0 order=0.87 rest=0.1 | echo | lifted | A held sigh, and the pluck only when the finger goes
String let off the nail | Let go to ring | strike=Tap matter=Bronze ring=5 tail=4 blows=.4 turn=3 bright=.5 when=Release volume=2.5 breath=1 neighbours=0.45 stretch=0.3 rest=0.2 heat=.4 | plate 1.mix=.26 | lifted | Bronze plucked by the leaving hand, a few times over
Both ends of the bow | Sugar plucks | when=Both strike=Rod matter=Crystal ring=3 tail=3 bright=.4 heat=.2 volume=0 order=0.82 stretch=-0.35 | round | lifted | Crystal plucked twice to a note and followed in canon
Bow and spit of rain | Sugar plucks | when=Both strike=Drop ring=28 tail=2 bright=.5 heat=.3 ticks=.3 volume=-1 neighbours=0.6 rest=0.1 | stars | lifted | A drop at each end of the key
Answer from the attic | Sugar plucks | when=Both strike=Tap matter=Obsidian ring=5 tail=3 bright=.75 heat=.2 blows=0 volume=4 neighbours=0 order=0.82 rest=0.2 | dark | lifted | A dark pluck on the way down and another on the way up
`,
    },
    {
      id: 'obsidian-voices',
      name: 'Obsidian voices',
      category: 'voice',
      rows: `
Choir in the quarry | Obsidian voices | edge=.6 bright=.5 breath=.9 remelt=0 tail=4 volume=2 neighbours=0.6 order=0.8 rest=.2 | nave | sevenths | Obsidian poured into a wide dark vowel, many together
Rehearsal in overcoats | Obsidian voices | cooling=1 order=.6 bright=.7 breath=.7 width=1 tail=1.5 volume=0 neighbours=0 | doubled | contrary | Voices not quite agreed on the pitch, close by
Sung with closed lips | Obsidian voices | bright=.2 edge=1 breath=.7 ring=8 strike=Tap neighbours=0.7 order=0.72 rest=0.32 remelt=.35 every=2.4 | pillow | contrary | Hummed low and soft behind closed lips
Ah, then higher | Obsidian voices | cooling=4 heat=.9 bright=.75 edge=.4 remelt=0 strike=Tap breath=.9 volume=6 | climb | rise | The vowel opens over four seconds as the stone sets
Standing in two rows | Obsidian voices | strike=Drop blows=.15 turn=.4 cooling=1.5 width=.9 bright=.55 tail=5 remelt=0 volume=5.5 order=0.76 | current | ninth | A drop starts each voice and a broad hum takes it over
Alone on the gallery | Obsidian voices | strike=Tap cooling=.6 heat=.5 bright=.8 breath=1 remelt=0 tail=1.2 width=.1 volume=6 | sung | tune | One dark bright voice that starts to sway when held
Lullaby with no light | Obsidian voices | strike=Tap cooling=.8 heat=.6 bright=.35 breath=.6 edge=.9 remelt=0 tail=2 volume=6 order=0.8 width=0.15 | warmwall | tune | A low soft voice, every entry rounded off
Caller on the coal field | Obsidian voices | strike=Tap heat=.4 cooling=.5 bright=1 breath=1 edge=.3 remelt=.15 every=.6 tail=2 volume=6 neighbours=0.7 | valley | tune | A hard bright voice with a tremor in it
Through a paper cone | Obsidian voices | strike=Tap heat=.3 cooling=.4 bright=.9 breath=.9 ring=6 remelt=0 tail=.6 width=0 volume=0 release=Quench neighbours=0.7 | kitchen | tune | A small nasal voice, talking more than singing
Someone in the stairwell | Obsidian voices | strike=Drop heat=.6 cooling=.7 bright=.6 breath=.8 remelt=0 tail=3 blows=0 release=Remelt volume=1 order=0.8 rest=0.16 | steps | calls | A call that sinks at the end of each word
Cellar chant | Obsidian voices | strike=Tap cooling=1.2 bright=.55 breath=1 tail=2 ring=10 width=.4 neighbours=.9 volume=6 rest=.25 order=.75 remelt=.3 every=5 | cave | pedal | Low stone voices under a moving pair
Deep breath on one tone | Obsidian voices | heat=.9 cooling=2 bright=.4 breath=1 strike=Tap remelt=.6 every=3 edge=1 volume=6 neighbours=0.2 | whistle | onelow | A very low voice, wide and slow to gather
Giants passing a word | Obsidian voices | strike=Pour heat=.8 cooling=1.4 bright=.7 blows=.6 turn=.4 breath=.6 tail=3 volume=5.5 rest=0.12 | giant | lowline | Huge slow syllables handed down a line
Father in the next room | Obsidian voices | strike=Tap heat=.3 breath=.6 remelt=.3 every=.7 tail=.6 width=0 volume=6 ring=7 bright=.6 neighbours=0.2 order=0.8 | door 2.distance=.5 2.level=1 | lowline | A low talking voice with its words worn away
Bear under the ice | Obsidian voices | rest=.25 heat=.8 bright=.6 breath=.9 strike=Drop blows=.2 turn=.5 remelt=0 tail=3 volume=2 neighbours=0.7 | deepw | onelow | A soft low grumble that never opens all the way
Whisper gallery | Obsidian voices | heat=1 breath=1 bright=.9 strike=Tap remelt=0 tail=2 ticks=.1 volume=6 rest=.85 edge=.4 stretch=.4 order=0.72 | whisper 1.mix=.5 | ninth | All breath, and only the hint of a tone at the very top
Prayers in a cold car | Obsidian voices | heat=.9 rest=.35 breath=.8 bright=.75 remelt=.6 every=.6 strike=Tap tail=1 volume=2.5 | lossy | contrary | Quick breathy murmurs, frozen at the edges
S and sh and hush | - | matter=Salt heat=.9 rest=.6 breath=1 blows=0 strike=Tap ticks=.3 bright=1 remelt=.8 every=.9 edge=.6 tail=1 volume=6 release=Quench order=0.76 width=0.8 | near | fourths | Hissing consonants of hot salt, faintly tuned
Sleeping car | Obsidian voices | heat=.8 rest=.3 breath=.8 bright=.3 remelt=.9 every=2.6 edge=1 strike=Tap volume=3 neighbours=0.2 | lungs | turn | A voice that goes soft and returns about every three seconds
Ghost of the alto | Obsidian voices | heat=.7 rest=.4 cooling=.6 breath=.9 bright=.8 strike=Tap ring=10 tail=6 volume=4.5 neighbours=0.45 remelt=.3 every=1.9 | halo | tenths | Only the upper half of a voice, thin and warm
Children at a fence | Obsidian voices | heat=.3 cooling=.4 bright=.95 breath=.7 stretch=.2 strike=Tap remelt=0 tail=.8 width=.8 volume=5 neighbours=0.9 order=0.84 | vowel 1.shift=5 | tune | Small bright voices, cheerful and a bit wide
Reed and throat | Obsidian voices | bright=1 breath=1 strike=Tap ring=14 tail=.6 edge=.3 volume=1 heat=.5 cooling=.5 remelt=.5 every=.45 order=.8 neighbours=0.5 | combo | contrary | A reedy chest voice, blown as hard as it goes, with a flutter in it
Through clenched teeth | Obsidian voices | heat=.2 bright=.9 breath=1 order=.4 strike=Tap remelt=0 tail=1.5 stretch=.5 rest=0.25 | edge | onehigh | A thin tense vowel with a grain in it
Word cut by a door | Obsidian voices | heat=.5 cooling=.6 bright=.45 breath=.9 edge=.9 release=Quench tail=.8 remelt=.5 every=.7 neighbours=0.7 order=0.76 rest=0.12 volume=-0.5 | gated | lifted | A round vowel stopped by a splash of cracks
Vowel at the waterline | Obsidian voices | heat=.6 cooling=1 bright=.7 breath=.8 remelt=.5 every=1.3 tail=3 neighbours=0 rest=0.16 | shallow | turn | An open mouth dipping under small waves
Women at the long table | - | matter=Crystal heat=.5 cooling=1.2 breath=.9 blows=0 strike=Tap ticks=0 edge=.9 bright=.3 ring=14 tail=3 volume=6 neighbours=0.7 rest=0.14 width=0.9 remelt=.3 every=3.2 | vowel | sevenths | Crystal sung up from one soft tap and given a mouth
Vespers behind glass | - | matter=Crystal cooling=.6 breath=1 blows=0 strike=Tap ticks=0 bright=.2 ring=24 tail=5 order=1 volume=4 heat=.8 rest=.2 remelt=.5 every=4 edge=1 neighbours=1 width=1 | chapel | contrary | Pure octaves that soften and return in two quiet parts
Soprano on thin ice | - | matter=Crystal heat=.6 cooling=.8 breath=1 blows=0 strike=Tap ticks=.2 edge=.4 bright=.6 remelt=.2 every=.5 ring=8 tail=2 volume=6 neighbours=0.15 order=0.88 width=0.05 | blueair | onehigh | One crystal voice, trembling at the top of its reach
Angel with a cold | - | matter=Crystal heat=.7 rest=.4 breath=.8 blows=0 strike=Pour ticks=0 edge=.8 bright=.5 remelt=0 tail=3 order=.7 volume=6 neighbours=1 | pane | turn | A clouded sweet voice that takes a while to arrive
Duet for one finger | - | matter=Crystal heat=.4 cooling=.5 breath=.9 blows=0 strike=Tap ticks=0 order=.3 bright=.3 remelt=0 ring=10 tail=2 volume=6 neighbours=0.9 stretch=0.67 rest=.1 | parted | tune | Each crystal note beats as if two sang it, a ninth over the tune
Boys and empty bottles | - | matter=Salt heat=.5 cooling=.7 breath=1 blows=0 strike=Tap ticks=0 edge=.7 bright=.3 ring=26 tail=1.5 volume=6 width=0.75 stretch=0 remelt=.25 every=.8 | choir 1.mix=.3 | contrary | Hollow fluting voices with no edge on them
Cooing on the sill | - | matter=Salt heat=.6 cooling=.5 breath=.9 blows=0 strike=Drop ticks=0 edge=.8 bright=.1 remelt=.5 every=.5 tail=1 order=0.84 | booth | calls | Low hollow coos, rippling in the throat
Friar in the reeds | - | matter=Salt heat=.4 cooling=.5 breath=1 blows=0 strike=Tap ticks=.2 bright=.7 ring=20 tail=2 width=.2 volume=6 neighbours=0.45 remelt=.3 every=2.6 | chorale | tune | One odd toned voice, between a reed and a man
Salt under the tongue | - | matter=Salt heat=.8 cooling=1.5 breath=.9 blows=0 strike=Pour ticks=.6 edge=1 bright=.5 remelt=0 tail=2 neighbours=0.7 order=0.88 | leaves | sevenths | Dry hollow voices with grain on every word
Owl in the bell loft | - | matter=Salt heat=.7 cooling=.4 breath=1 blows=0 strike=Tap ticks=0 edge=.6 bright=.15 remelt=0 ring=30 tail=1.2 stretch=-.2 volume=6 neighbours=0.5 order=0.76 rest=0.25 width=0.3 | late | calls | Short round hoots of blown salt
Bronze cantor | - | matter=Bronze heat=.6 cooling=.8 breath=1 blows=0 strike=Tap ticks=0 edge=.9 bright=.45 ring=8 tail=2 width=.2 volume=6 neighbours=0.6 remelt=.2 every=4 | vowel | tune | Blown bronze, its hum an octave under the tune | voice
Monks half asleep | - | matter=Bronze heat=.8 cooling=1.5 breath=.9 blows=0 strike=Pour ticks=0 edge=1 bright=.25 remelt=.3 every=2 tail=4 volume=0.5 rest=.3 order=.7 neighbours=0.5 stretch=0 | chapel | pedal | Slow bronze voices that stay soft underneath
Carved mouths | - | matter=Bronze heat=.5 cooling=.6 breath=1 blows=0 strike=Tap ticks=0 order=.4 bright=.7 remelt=0 ring=6 tail=2 volume=5 neighbours=1 | glow | contrary | Loose metal voices with a burning edge
Oracle behind the grille | - | matter=Bronze heat=.9 rest=.35 breath=1 blows=0 strike=Tap ticks=.2 edge=.7 bright=.6 remelt=.4 every=1 tail=3 volume=4 neighbours=0.2 | cistern | tenths | Hot bronze muttering at the bottom of a shaft
Alto made of brass | - | matter=Bronze heat=.3 cooling=.4 breath=1 blows=0 strike=Tap ticks=0 bright=.6 remelt=0 ring=10 tail=1 stretch=-.3 edge=.6 volume=5.5 neighbours=0.1 rest=0.28 | ensemble | contrary | Pressed bronze tones singing in close order
Spelling out the weather | Obsidian voices | remelt=.8 every=.5 cooling=.3 bright=.8 strike=Tap breath=1 tail=.8 volume=5 neighbours=0 order=0.84 rest=0.16 blows=0.3 turn=2.6 | sides | turn | Two open syllables a second on every key
Slow dictation | Obsidian voices | remelt=.9 every=1 cooling=.5 bright=.6 strike=Rod blows=.3 turn=1 breath=.8 order=0.76 rest=0.25 width=0.8 | reel | fourths | A tap and a vowel, a tap and a vowel
Crowd leaving a church | Obsidian voices | cooling=.6 breath=.8 width=1 neighbours=0 strike=Tap order=.35 rest=.3 remelt=.7 every=.6 blows=.7 turn=3.2 edge=.3 bright=.9 matter=Obsidian stretch=0.67 volume=5 | flock | fourths | Many loose mutters at once, each key tapped along at its own pace
Auction in a dream | Obsidian voices | every=.4 cooling=.2 bright=.9 strike=Tap blows=.4 turn=4 breath=.9 tail=.6 volume=6 remelt=.85 heat=.4 release=Quench neighbours=0 order=0.88 rest=0.32 width=0.5 | recall | hocket | Very fast patter with nothing to say
Passed round the table | Obsidian voices | remelt=.6 every=1.5 bright=.65 breath=.7 edge=.5 strike=Pour blows=.4 turn=.5 volume=2 | round | turn | A soft dark phrase, warmed and struck as it goes
Sigh before the name | Let go to ring | matter=Obsidian breath=1 heat=.6 cooling=1 bright=.75 blows=0 tail=6 ring=8 volume=0.5 neighbours=0.9 order=0.84 width=0.8 stretch=0 | hall | lifted | A breath while held, and the name as it is let go
Asked and answered | Obsidian voices | when=Both strike=Drop heat=.6 cooling=.7 bright=.7 breath=.8 remelt=0 tail=4 ring=8 volume=0 neighbours=0 stretch=0 | mirror | lifted | Each voice is started by a drop and ended by one
Waits for the organ | Waiting chimes | matter=Obsidian heat=.8 cooling=1 breath=.9 strike=Drop blows=.2 turn=.5 bright=.7 stretch=0 tail=5 order=.7 rest=.1 neighbours=0.42 | flutes | ninth | A humming choir that is only struck once it is set
Choir on a dead channel | Obsidian voices | bright=.6 breath=.8 cooling=1.2 ring=5 remelt=.3 every=1.8 tail=2 rest=0.2 stretch=0 volume=1.5 | worn | sevenths | Dark singing that softens about every two seconds
Last verse from the hill | Obsidian voices | release=Remelt tail=9 cooling=1.5 bright=.55 breath=.8 ring=14 edge=.5 neighbours=0.15 order=0.84 rest=0.22 volume=2.5 remelt=.25 every=5 | shore | lifted | A dark chord that sinks slowly when it is let go
`,
    },
    {
      id: 'frozen',
      name: 'Frozen and let go',
      category: 'pad',
      rows: `
Pond skaters at rest | Frozen pad | tail=4 neighbours=0 volume=1 strike=Tap stretch=-.35 ring=5 bright=.8 order=.8 turn=1.6 blows=.5 | hang | ninth | Cold bright glass touched lightly again and again
White ceiling at noon | Frozen pad | bright=.1 breath=.9 blows=0 strike=Tap edge=1 ring=30 ticks=0 volume=-4.5 neighbours=0.15 | strings | turn | Cold dark glass tapped once and kept up by breath
Hoar on every wire | Frozen pad | strike=Rod blows=.6 turn=2.2 bright=.75 ring=7 breath=.2 ticks=0 width=1 volume=0 stretch=.5 order=.8 | shaded | fourths | Iron picks at cold bright glass, drawn wide
Match in an ice house | Frozen pad | order=.4 bright=.4 ring=16 blows=.3 turn=.35 breath=.4 volume=-3.5 rest=.55 cooling=3 stretch=.7 neighbours=1 | sines | open | Cold wide glass that set out of true, going soft from below as it is held
Blue shadow on snow | Frozen pad | stretch=-.7 bright=.3 strike=Drop blows=.35 turn=.4 width=.5 volume=-18.5 neighbours=0.2 breath=.8 ring=26 | tails | tenths | Cold glass pressed close, with a drop now and again
Snow globe put down | Frozen pad | matter=Crystal bright=.6 blows=.4 turn=.7 ring=8 ticks=0 breath=.3 tail=5 volume=-4.5 neighbours=0.2 | slowed | rise | Cold crystal flakes that go on settling
Ballroom in dust sheets | Frozen pad | matter=Crystal strike=Tap blows=.7 bright=.2 breath=.5 volume=1.5 order=.5 stretch=.25 turn=3 ring=2.5 when=Both neighbours=0.1 | glaze | lifted | Soft knuckles on loosened cold crystal, and once more as the hand lifts
Aurora over the pass | Frozen pad | matter=Crystal breath=1 blows=0 ring=20 strike=Pour width=1 tail=3 volume=-4 stretch=.3 remelt=.3 every=.9 neighbours=0.2 bright=.35 order=.35 | valley | ninth | Scattered crystal sung so hard that it wavers
Candle in two panes | Frozen pad | matter=Crystal stretch=-.4 blows=.5 bright=.4 volume=-0.5 strike=Rod turn=2.4 ring=4 order=.8 neighbours=0.6 | doubled | sevenths | Cold crystal drawn a little closed, with an iron tap for each flame
Winter count | Frozen pad | matter=Crystal strike=Rod blows=.8 turn=1 bright=.3 ring=18 breath=.1 tail=9 volume=1.5 | event | tenths | One iron stroke a second on cold crystal
Bronze bowl, raked sand | Bronze in the sand | order=.95 blows=.6 turn=.6 bright=.3 neighbours=1 tail=7 volume=-4 when=Set stretch=0.4 cooling=.6 | silent | ninth | Bronze tapped from the moment it is hard, every key stirring the next
Gong behind shut doors | Bronze in the sand | heat=0 strike=Rod blows=.4 turn=.5 ring=20 bright=.45 tail=10 width=.9 volume=6 | half | open | Cold bronze struck by iron about every two seconds
Gong farm | Bronze in the sand | stretch=-.5 heat=.4 cooling=.8 blows=.9 turn=1.4 ring=5 bright=.6 order=.6 volume=0 edge=0.85 | ringing | fourths | A field of small pressed gongs beaten out of step
Frozen bell ropes | Bronze in the sand | heat=0 strike=Tap blows=.8 turn=3 ring=2.5 bright=.25 breath=.1 tail=2 stretch=-0.45 | cassette | stride | Muffled cold bronze shaken three times a second
Copper moon on a pond | Bronze in the sand | heat=.2 strike=Pour blows=.5 turn=.4 ring=14 breath=.8 bright=.7 order=1 neighbours=1 stretch=-0.3 | above | turn | Cold bronze poured over and sung from below
Hands off the glass | Let go to ring | heat=.4 cooling=.5 ring=16 bright=.35 tail=14 blows=0 breath=.4 strike=Drop volume=-4.5 order=0.8 rest=0.16 width=0.75 | open | lifted | Quiet while it is held and long when it is not
Curtain, then the bells | Let go to ring | matter=Bronze strike=Rod breath=.7 blows=.5 turn=1.1 bright=.45 ring=20 tail=12 volume=3 neighbours=0.5 order=0.7 rest=0.28 width=0.4 heat=.5 | late | lifted | Breath during the chord, a peal of bronze after it
Thaw at the gate | Let go to ring | matter=Glass strike=Pour heat=.8 cooling=1 breath=.8 blows=.4 turn=.6 bright=.6 tail=8 order=0.88 rest=0.25 | drops | lifted | Soft air, and a pour of glass when the hand leaves
Everything after | Let go to ring | matter=Crystal strike=Rod blows=.9 turn=2.5 bright=.6 tail=9 volume=0.5 breath=.9 order=0.8 rest=0.22 width=0.8 neighbours=.4 ring=7 heat=.5 | weave | lifted | Air while it is held; iron patters on crystal once the keys are up
Goodbye from the pier | Let go to ring | matter=Obsidian strike=Tap heat=.5 cooling=.6 breath=1 blows=.6 turn=.8 bright=.8 tail=7 ring=8 volume=3 neighbours=0.15 | sag | lifted | A hum while it lasts and slow dark strokes after
Rings in an empty glove | Let go to ring | matter=Sugar strike=Tap breath=1 blows=1 turn=5 ring=30 tail=8 bright=.5 volume=-2.5 neighbours=0.1 rest=0.28 width=0.4 heat=.45 | tiles | lifted | Dry quick sugar taps that begin on release
Keys back on the hook | Let go to ring | when=Both matter=Glass strike=Rod heat=.1 breath=.2 blows=0 ring=4 bright=.4 volume=2.5 release=Quench tail=5 neighbours=0.6 order=0.7 rest=0.22 | stub | lifted | A dry knock when a key is taken and when it is put back
Bow, then the breakage | Let go to ring | matter=Glass strike=Rod heat=.1 breath=1 blows=0 release=Quench tail=3 bright=.6 ticks=.9 order=.6 volume=1 neighbours=0.6 rest=0.22 | reveal | lifted | Sung while held, then struck and cracked in water
Swing bridge opens | Let go to ring | when=Both matter=Bronze strike=Drop heat=.6 cooling=.8 breath=.6 blows=.6 turn=1.5 ring=9 tail=8 stretch=-.3 neighbours=0.9 rest=0.16 volume=-5 | swarm | lifted | Heavy drops on bronze as it is pressed and after it is left
Down the well at last | Let go to ring | matter=Salt strike=Drop heat=.7 cooling=.6 breath=.9 blows=.4 turn=1.6 ring=30 tail=7 bright=.5 volume=-5.5 order=0.75 stretch=0.25 rest=0.16 width=0.8 | cistern | lifted | Hollow air, and the drops when nobody is holding it
Set before supper | Waiting chimes | heat=.9 blows=.6 turn=.9 matter=Glass stretch=0 breath=.6 ring=14 bright=.35 volume=-0.5 cooling=1.6 | plate 1.mix=.3 | turn | Air at first, then each set note is tapped awake with iron
Patience of the bees | Waiting chimes | cooling=1.4 matter=Salt strike=Tap blows=.9 turn=6 breath=.8 bright=.4 ring=26 stretch=0 neighbours=0.2 order=0.88 | summer | fourths | Hollow breath that turns to quick small tapping
Only when it is cold | Waiting chimes | cooling=1 matter=Crystal strike=Drop blows=.9 turn=1.2 stretch=.2 breath=.4 bright=.6 ring=10 edge=.1 neighbours=0 order=0.75 | stars | ninth | Crystal has to be clear before a drop will fall
Night shift to morning | Waiting chimes | strike=Pour turn=.5 stretch=0 breath=.7 bright=.5 edge=.6 tail=8 volume=-10 neighbours=0.42 cooling=.8 heat=.85 blows=.5 | unfold | open | A dull breath first, and poured glass from when it has set
Last bell of the watch | Waiting chimes | cooling=.8 matter=Bronze strike=Rod blows=.3 turn=.3 stretch=-.2 breath=.5 bright=.4 ring=26 tail=12 volume=2 order=0.8 | shadow | tenths | Bronze that waits until it has set for its slow strokes
Doused at dawn | Frozen pad | release=Quench tail=2.5 matter=Glass breath=.8 blows=0 ring=10 bright=.5 ticks=.8 order=1 volume=-8 neighbours=1 | chamber 1.mix=.24 | lifted | A cold sung chord put out in a shower of cracks
Lake lets its ice go | Frozen pad | release=Quench tail=8 matter=Crystal ring=20 bright=.45 blows=.2 turn=.5 volume=0.5 stretch=-.8 order=.6 heat=.4 cooling=8 ticks=1 neighbours=0.7 remelt=0.3 every=1 edge=0.7 | valley | lifted | Crystal pressed close and poured, cracking for a long time after
Fuse and flash | Frozen pad | release=Quench tail=.8 matter=Salt breath=1 ring=26 bright=.6 ticks=.6 strike=Tap blows=0 volume=1.5 neighbours=0.15 stretch=-0.3 remelt=0.75 every=5.5 | reverse | lifted | Hollow breath cut off by a bright dry flash
Put the lanterns out | Frozen pad | release=Quench tail=3 matter=Obsidian breath=.9 blows=0 ring=12 bright=.75 strike=Drop when=Release volume=6 remelt=0.5 every=4 | deepsea | lifted | A low breath in obsidian, quenched with a drop and hardly a hiss
Boiling, then blue | Cooling by the door | heat=1 cooling=.9 release=Quench tail=2 ticks=.7 blows=.8 turn=2 bright=.6 edge=.15 neighbours=0 | struck | lifted | White hot and beaten, clear within a second, then drowned
Violin of the snowfield | Frozen pad | strike=Tap blows=0 breath=1 bright=.45 ring=6 tail=1 ticks=0 width=.2 volume=2 order=.75 remelt=.2 every=.5 heat=.2 cooling=.6 | sung | tune | One cold line held by a full breath, shaking a little | string
Warm hands on cold pipes | Frozen pad | matter=Salt strike=Tap blows=0 breath=.9 bright=.25 ring=30 tail=.8 ticks=0 volume=-3 neighbours=0.1 | organ | contrary | Stopped pipes of hollow salt | organ
Bowed saw on a lake | Frozen pad | stretch=.5 strike=Tap blows=0 breath=1 bright=.3 ring=10 tail=3 ticks=0 order=1 volume=6 | bowed | onehigh | A wide cold tone that fades in and bends nowhere | string
Harmonium on thin ice | Frozen pad | strike=Tap blows=0 breath=.9 ring=12 tail=.6 ticks=0 width=.4 volume=3.5 matter=Crystal heat=.3 cooling=.6 rest=.25 edge=.8 remelt=.3 every=.5 order=.55 bright=.7 neighbours=0.2 | throb | contrary | Crystal reeds, loosely tuned and never steady | organ
Flutes left out at night | Frozen pad | matter=Glass heat=.5 rest=.3 strike=Tap blows=0 breath=1 bright=.4 tail=1.2 ticks=0 edge=.4 volume=5.5 neighbours=0.7 remelt=0.6 every=1.9 stretch=0 | flutes | sevenths | Thin breathy glass, not quite set at the bottom | wind
Cold hands held together | Cooling by the door | neighbours=1 heat=.5 cooling=.7 strike=Rod blows=.5 turn=.7 ring=16 tail=7 bright=.4 width=0.75 remelt=.25 every=4.5 | wires | rise | Each key struck by iron sets the whole chord shaking
Snow off six roofs | Cooling by the door | neighbours=.9 strike=Pour blows=.6 turn=.4 ring=9 bright=.65 width=1 tail=5 volume=-6.5 when=Set heat=.7 order=0.8 stretch=0.67 cooling=.5 breath=.5 remelt=.2 every=3 | cloud | fourths | A pour that waits for each key to set and is felt in all the others
Strangers, one carriage | Cooling by the door | neighbours=0 heat=.9 strike=Drop blows=.5 turn=1 bright=.3 remelt=0 width=1 ring=5 volume=-5 when=Set order=0.85 stretch=0.67 cooling=1.3 breath=.6 | panned | rise | No key warms another: each is struck as it sets, the first well before the last
Crowd at the stove | Cooling by the door | neighbours=1 blows=1 turn=1.5 strike=Tap bright=.5 remelt=.3 every=1.6 edge=.5 when=Set volume=5 stretch=-0.67 width=0.3 heat=.8 cooling=.4 breath=.7 | slowing | ninth | All the heat is shared, and beaten from when it has set
Moved by the same hand | Cooling by the door | neighbours=.8 matter=Bronze heat=.2 strike=Tap blows=.7 turn=.5 ring=20 remelt=0 bright=.6 tail=9 volume=3 order=0.85 stretch=-0.45 rest=.12 | bowls | sevenths | Bronze keys that shake one another at every stroke
Stopped clock on a wall | Frozen pad | breath=.7 blows=0 strike=Drop ring=30 bright=.6 ticks=0 order=.7 tail=12 release=Anneal volume=-2 neighbours=0 rest=0 | freeze | turn | One drop to a note, and then nothing moves
Breath kept in amber | Frozen pad | matter=Sugar strike=Pour blows=1 turn=1 breath=1 ring=30 bright=.4 tail=3 ticks=0 volume=-6.5 neighbours=0.6 stretch=0.67 | smear | turn | Cold sugar poured over and over, each stream running into the next
North of the last house | Frozen pad | matter=Salt strike=Rod blows=.4 turn=.6 breath=.6 ring=30 bright=.6 order=.5 tail=5 ticks=0 volume=3 neighbours=0 remelt=0.2 every=7 | shore | open | Loose hollow salt touched with iron
Polar noon | Frozen pad | matter=Glass breath=.5 blows=.8 turn=4 strike=Tap ring=3 bright=.85 width=1 tail=3 ticks=0 volume=3 stretch=-.5 order=.7 neighbours=0.1 | glint | peal | Bright cold glass, drawn close, tapped fast
Shutters at sundown | Cooling by the door | heat=.7 cooling=1.8 matter=Obsidian breath=.8 blows=.2 turn=.4 bright=.6 release=Remelt tail=12 ring=14 neighbours=0.9 stretch=0.67 remelt=.2 every=6 | tamed | turn | Wide black stone that clears under the key and sinks from below when left
`,
    },
  ],
}
