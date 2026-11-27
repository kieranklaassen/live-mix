import { type InstrumentSet } from './set'

// The set of Bent Blade. A direction is one thing the blade is played as; in
// each are ten families of five. A family is one place in the steel (how deep
// it is bent, what touches it, what the second bend is and how the note goes
// there), and its five differ in register, in movement and in their chain.

export const SET: InstrumentSet = {
  device: 'bent-blade',
  names: {
    exciter: ['Bow', 'Mallet', 'Thumb', 'Breath'],
    secondWell: ['None', 'Twin', 'Fifth', 'Octave'],
    glideLaw: ['Straight', 'Nearest', 'From one'],
  },
  chains: {
    // Near: colour, width and the smallest rooms.
    bare: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Open', params: { clear: 0.2 } }],
      words: ', bare and close',
    },
    warm: { effects: [{ deviceId: 'ambient-eq', preset: 'Warm' }], words: ', close and warm' },
    shade: { effects: [{ deviceId: 'ambient-eq', preset: 'Shaded' }], words: ', dry and shaded' },
    thin: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Thin' },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: ', thinned out and dry',
    },
    floor: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Deep', params: { low: 6 } }],
      words: ', dry, with its floor raised',
    },
    hollow: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Hollow' }],
      words: ', dry and hollowed out',
    },
    front: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Forward' }],
      words: ', dry and well forward',
    },
    lit: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Bright', params: { presence: 4, air: 5 } }],
      words: ', dry and lit from above',
    },
    wide: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Wide' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', dry and wide',
    },
    middle: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Narrow' },
        { deviceId: 'ambient-comp', preset: 'Glue' },
      ],
      words: ', dry and down the middle',
    },
    airy: {
      effects: [{ deviceId: 'spread', preset: 'Firm and airy' }],
      words: ', firm below and wide above',
    },
    firm: {
      effects: [
        { deviceId: 'spread', preset: 'Firm bass' },
        { deviceId: 'ambient-comp', preset: 'Keys' },
      ],
      words: ', its low end held firm and dry',
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
    room: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } }],
      words: 'in a plain room',
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
      words: ', its onsets felted over',
    },
    double: {
      effects: [{ deviceId: 'stereo-detune', preset: 'Soft halo' }],
      words: ', doubled a few cents apart',
    },
    // Bodies.
    wood: {
      effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.5 } }],
      words: 'in a wooden body',
    },
    tin: {
      effects: [{ deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.45 } }],
      words: 'in a small tin',
    },
    pot: {
      effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.5 } }],
      words: 'in a clay pot',
    },
    shell: {
      effects: [{ deviceId: 'vessel', preset: 'Shell to the ear', params: { mix: 0.5 } }],
      words: 'as if in a sea shell',
    },
    cistern: {
      effects: [
        { deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.45 } },
        { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.2 } },
      ],
      words: 'down in a cistern',
    },
    box: { effects: [{ deviceId: 'imprint', preset: 'Dark box' }], words: 'in a dark box' },
    vowel: {
      effects: [
        { deviceId: 'imprint', preset: 'Open vowel', params: { amount: 0.8 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', shaped to an open vowel',
    },
    round: {
      effects: [
        { deviceId: 'imprint', preset: 'Round vowel', params: { amount: 0.9 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
      ],
      words: ', rounded to a closed vowel',
    },
    little: { effects: [{ deviceId: 'size', preset: 'Smaller' }], words: 'in a body made smaller' },
    // Drive, loudspeakers and the wear of a medium.
    desk: {
      effects: [{ deviceId: 'analog-drive', preset: 'Console' }],
      words: ', pushed gently through a desk',
    },
    valve: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Triode glow' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
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
    fuzz: {
      effects: [{ deviceId: 'haze', preset: 'Small room fuzz', params: { mix: 0.3 } }],
      words: 'in a small fuzzed room',
    },
    combo: {
      effects: [{ deviceId: 're-amp', preset: 'Combo in a room' }],
      words: 'from a small amplifier',
    },
    pillow: {
      effects: [{ deviceId: 're-amp', preset: 'Pillow speaker' }],
      words: 'from under a pillow',
    },
    corridor: {
      effects: [{ deviceId: 're-amp', preset: 'Down the hall' }],
      words: 'from a speaker down the hall',
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
    sway: { effects: [{ deviceId: 'tape', preset: 'Seasick' }], words: 'on tape that sways' },
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
    platter: {
      effects: [{ deviceId: 'vinyl', preset: 'Slow platter' }],
      words: 'on a record that turns unevenly',
    },
    shellac: {
      effects: [{ deviceId: 'vinyl', preset: 'Parlour 78', params: { mix: 0.8 } }],
      words: 'off an old shellac disc',
    },
    crumbs: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Dusty', params: { mix: 0.6 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.22 } },
      ],
      words: ', crumbling on a dark plate',
    },
    night: {
      effects: [{ deviceId: 'radio', preset: 'Night shortwave', params: { mix: 0.6 } }],
      words: 'through a night-time radio',
    },
    pane: {
      effects: [{ deviceId: 'low-bitrate', preset: 'Behind glass', params: { mix: 0.7 } }],
      words: ', swirling as if behind a pane',
    },
    hiss: {
      effects: [
        { deviceId: 'noise-floor', preset: 'Breathing tape', params: { level: -46 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'with tape hiss in its pauses',
    },
    bridge: {
      effects: [{ deviceId: 'buzzing-bridge', preset: 'Harp on a bridge', params: { mix: 0.45 } }],
      words: 'over a bridge that buzzes',
    },
    shells: {
      effects: [
        { deviceId: 'buzzing-bridge', preset: 'Three shells', params: { mix: 0.35 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'with loose shells that rattle',
    },
    // Movement.
    amptrem: {
      effects: [
        { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.45 } },
        { deviceId: 'spring-reverb', preset: 'Hint of spring' },
      ],
      words: "with an amplifier's tremolo",
    },
    tilt: {
      effects: [
        { deviceId: 'tremolo', preset: 'Harmonic shimmer' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
      ],
      words: 'with a tremolo that tilts its tone',
    },
    sidetoside: {
      effects: [
        { deviceId: 'tremolo', preset: 'Slow pan' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: 'wandering from side to side',
    },
    chorale: {
      effects: [{ deviceId: 'rotary', preset: 'Chorale' }],
      words: 'through a slow rotating horn',
    },
    spin: {
      effects: [
        { deviceId: 'rotary', preset: 'Tremolo', params: { mix: 0.8 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'through a fast rotating horn',
    },
    ensemble: {
      effects: [{ deviceId: 'chorus', preset: 'Lush ensemble' }],
      words: 'through a wide ensemble',
    },
    deepsea: {
      effects: [
        { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: 'through a deep slow chorus',
    },
    swirl: {
      effects: [
        { deviceId: 'phaser', preset: 'Slow swirl' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: 'through a slow phaser',
    },
    comb: {
      effects: [{ deviceId: 'flanger', preset: 'Standing comb' }],
      words: 'through a standing comb',
    },
    sweep: {
      effects: [
        { deviceId: 'flanger', preset: 'Slow sweep' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', swept by a slow flange',
    },
    icefilter: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { cutoffHz: 900 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
      ],
      words: 'under a low-pass that moves like ice',
    },
    notch: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Slow notch' },
        { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.2 } },
      ],
      words: 'with a notch moving slowly through',
    },
    pulsed: {
      effects: [
        { deviceId: 'band-pulse', preset: 'Three a second' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
      ],
      words: ', its middle pulsed three times a second',
    },
    throb: {
      effects: [
        { deviceId: 'pulses', preset: 'Soft throb' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
      ],
      words: ', throbbing softly',
    },
    lungs: {
      effects: [
        { deviceId: 'breath', preset: 'Calm breath' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
      ],
      words: ', rising and falling like a breath',
    },
    water: {
      effects: [
        { deviceId: 'currents', preset: 'Slow water', params: { rate: 0.2 } },
        { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', its bands drifting like slow water',
    },
    glimmer: {
      effects: [
        { deviceId: 'glimmer', preset: 'Light on water' },
        { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.22 } },
      ],
      words: ', its partials catching the light',
    },
    circle: {
      effects: [
        { deviceId: 'around', preset: 'Slow circle' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', circling slowly round the head',
    },
    // Echoes.
    warmecho: {
      effects: [{ deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.3 } }],
      words: 'with warm tape echoes',
    },
    slap: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Single slap' },
        { deviceId: 'spring-reverb', preset: 'Hint of spring' },
      ],
      words: 'with one slap of tape',
    },
    darkecho: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.3 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'with dark echoes behind',
    },
    murky: {
      effects: [{ deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.35 } }],
      words: 'with murky late echoes',
    },
    stars: {
      effects: [
        { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.35 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: 'with echoes scattered like stars',
    },
    stone: {
      effects: [{ deviceId: 'skipping-stone', preset: 'Skipping stone' }],
      words: 'with echoes skipping off over water',
    },
    bounce: {
      effects: [
        { deviceId: 'skipping-stone', preset: 'Slowing bounces' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
      ],
      words: 'with echoes that slow as they go',
    },
    answer: {
      effects: [
        { deviceId: 'canon', preset: 'Faint answer', params: { mix: 0.35 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', answered once from the side',
    },
    canonlow: {
      effects: [
        { deviceId: 'canon', preset: 'Octave shadow', params: { gap: 0.8, mix: 0.35 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: 'with an answer an octave below',
    },
    backward: {
      effects: [
        { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { mix: 0.35 } },
        { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.18 } },
      ],
      words: 'with backward echoes',
    },
    recall: {
      effects: [
        { deviceId: 'echo-memory', preset: 'Flickers', params: { mix: 0.38 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: 'with moments of it coming back',
    },
    orbit: {
      effects: [
        { deviceId: 'orbits', preset: 'Short canon', params: { mix: 0.35 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.18 } },
      ],
      words: 'over loops that drift apart',
    },
    loop: {
      effects: [
        { deviceId: 'tape-loop', preset: 'One second round', params: { mix: 0.4 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.18 } },
      ],
      words: 'over a short loop of tape',
    },
    crystal: {
      effects: [
        { deviceId: 'grain-delay', preset: 'Crystals', params: { mix: 0.3 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: 'with grains an octave up',
    },
    // Clouds, freezes and pitch.
    cloud: {
      effects: [
        { deviceId: 'grain-cloud', preset: 'Soft cloud' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: 'in a cloud of small grains',
    },
    tide: {
      effects: [
        { deviceId: 'grain-cloud', preset: 'Low tide', params: { mix: 0.4 } },
        { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: 'over a low tide of grains',
    },
    mist: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.45 } }],
      words: ', hanging in a mist',
    },
    darkwater: {
      effects: [
        { deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.2 } },
      ],
      words: ', dissolved in dark water',
    },
    frozen: {
      effects: [
        { deviceId: 'sustainer', preset: 'Dark bed', params: { mix: 0.4, attack: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: 'over a bed that holds it frozen',
    },
    fog: {
      effects: [
        { deviceId: 'fog', preset: 'Soft cloud', params: { mix: 0.7 } },
        { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.18 } },
      ],
      words: ', its edges blurred to fog',
    },
    suboct: {
      effects: [
        { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.5 } },
        { deviceId: 'ambient-comp', preset: 'Glue' },
      ],
      words: 'with the octave below it',
    },
    flutes: {
      effects: [
        { deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: 'with flute stops drawn',
    },
    split: {
      effects: [{ deviceId: 'freq-shifter', preset: 'Split sky', params: { mix: 0.35 } }],
      words: ', split a few hertz left and right',
    },
    bent: {
      effects: [
        { deviceId: 'warp', preset: 'Thin glow' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
      ],
      words: ', its partials pulled a little apart',
    },
    sparks: {
      effects: [
        { deviceId: 'glints', preset: 'First light' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: 'with bright sparks thrown off',
    },
    halftime: {
      effects: [
        { deviceId: 'stretch', preset: 'Half time haze', params: { mix: 0.4 } },
        { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.18 } },
      ],
      words: 'with a half-time haze behind',
    },
    frost: {
      effects: [{ deviceId: 'seasons', preset: 'First frost' }],
      words: 'under a first frost',
    },
    summer: {
      effects: [{ deviceId: 'seasons', preset: 'High summer', params: { depth: 0.7 } }],
      words: 'in a high summer haze',
    },
    breeze: {
      effects: [
        { deviceId: 'weather', preset: 'Breezy day', params: { exposure: 0.45, voice: 0.25 } },
      ],
      words: 'out in a breeze',
    },
    rain: {
      effects: [
        { deviceId: 'weather', preset: 'Light rain', params: { exposure: 0.35, voice: 0.35 } },
        { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.18 } },
      ],
      words: 'out in light rain',
    },
    surf: {
      effects: [
        { deviceId: 'weather', preset: 'Slow surf', params: { exposure: 0.35, voice: 0.35 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: 'beside slow surf',
    },
    shallows: {
      effects: [
        { deviceId: 'underwater', preset: 'Just under' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', just under the water',
    },
    sympathy: {
      effects: [{ deviceId: 'sympathetic', preset: 'Minor strings', params: { mix: 0.35 } }],
      words: 'with strings ringing in sympathy',
    },
    bowls: {
      effects: [{ deviceId: 'bowls', preset: 'Low fifths', params: { mix: 0.3 } }],
      words: 'among low singing bowls',
    },
    whistle: {
      effects: [
        { deviceId: 'overtone-singer', preset: 'Faint melody', params: { mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: 'with a whistled overtone over it',
    },
    bowed: {
      effects: [
        { deviceId: 'swell', preset: 'Bowed', params: { attack: 300 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } },
      ],
      words: ', each blow faded in like a bow',
    },
    // Rooms, halls and what is past them.
    hall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.32 } }],
      words: 'in a hall',
    },
    cathedral: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.36 } }],
      words: 'in a cathedral',
    },
    darkhall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.36 } }],
      words: 'in a dark hall',
    },
    undertow: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.34 } }],
      words: 'over a long warm undertow',
    },
    farhall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.65 } }],
      words: ', far off in a hall',
    },
    plate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.32 } }],
      words: 'on a medium plate',
    },
    longplate: {
      effects: [
        { deviceId: 'chorus', preset: 'Faint air' },
        { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.34 } },
      ],
      words: 'on a long plate',
    },
    brightplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.32 } }],
      words: 'on a bright plate',
    },
    valley: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.34 } }],
      words: 'over an open valley',
    },
    cave: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.38 } }],
      words: 'in a dark cave',
    },
    tank: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.28 } }],
      words: 'in a small bright tank',
    },
    space: {
      effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } }],
      words: 'in a wide open space',
    },
    lowvault: {
      effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.4 } }],
      words: 'under a low vault',
    },
    bloomspace: {
      effects: [{ deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.4 } }],
      words: 'in a space that swells in late',
    },
    shining: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Shining tail', params: { mix: 0.22 } }],
      words: 'with a shining tail',
    },
    springs: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.28 } }],
      words: 'on two springs',
    },
    drips: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.3 } }],
      words: 'on springs that drip',
    },
    cavern: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.35 } }],
      words: 'in a cavern of small echoes',
    },
    pipeverb: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Metal pipe', params: { mix: 0.25 } }],
      words: 'down a metal pipe',
    },
    gated: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.35 } }],
      words: 'in a room cut short',
    },
    rising: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.4 } }],
      words: 'with a tail that swells behind',
    },
    stairs: {
      effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
      words: 'down a stone stairwell',
    },
    shore: {
      effects: [{ deviceId: 'distance', preset: 'Far shore', params: { level: 1, room: 0.85 } }],
      words: 'from a far shore',
    },
    field: {
      effects: [
        { deviceId: 'distance', preset: 'Open air' },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'across open air',
    },
    choirverb: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.38 } }],
      words: ', answered by a wordless choir',
    },
    monks: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.38 } }],
      words: 'over a low murmur of monks',
    },
    climb: {
      effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.3 } }],
      words: 'in a tail that climbs by octaves',
    },
    fifthclimb: {
      effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { mix: 0.32 } }],
      words: 'in a tail that climbs by fifths',
    },
    sink: {
      effects: [{ deviceId: 'shimmer', preset: 'Undertow', params: { mix: 0.33 } }],
      words: 'in a tail that sinks by octaves',
    },
    blooming: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Wide summer', params: { mix: 0.38 } }],
      words: 'in a tail that slowly blooms',
    },
    ascent: {
      effects: [{ deviceId: 'spiral', preset: 'Slow ascent', params: { mix: 0.34 } }],
      words: 'in a tail that climbs without end',
    },
    descent: {
      effects: [{ deviceId: 'spiral', preset: 'Slow descent', params: { mix: 0.34 } }],
      words: 'in a tail that sinks without end',
    },
  },
  phrases: {
    aria: {
      notes: [
        { atSec: 0, durSec: 1.8, note: 69, gain: 0.6 },
        { atSec: 1.8, durSec: 1.2, note: 72, gain: 0.55 },
        { atSec: 3, durSec: 0.8, note: 71, gain: 0.5 },
        { atSec: 3.8, durSec: 1.6, note: 76, gain: 0.65 },
        { atSec: 5.4, durSec: 1.9, note: 74, gain: 0.55 },
      ],
    },
    duet: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 64, gain: 0.55 },
        { atSec: 0, durSec: 2.4, note: 72, gain: 0.6 },
        { atSec: 1.6, durSec: 1.6, note: 62, gain: 0.5 },
        { atSec: 2.4, durSec: 1.6, note: 71, gain: 0.55 },
        { atSec: 3.2, durSec: 1.6, note: 60, gain: 0.5 },
        { atSec: 4, durSec: 1.6, note: 69, gain: 0.55 },
        { atSec: 4.8, durSec: 1.2, note: 59, gain: 0.5 },
        { atSec: 5.6, durSec: 1.7, note: 67, gain: 0.55 },
        { atSec: 6, durSec: 1.3, note: 60, gain: 0.5 },
      ],
    },
    choir: {
      notes: [
        { atSec: 0, durSec: 3.6, note: 45, gain: 0.5 },
        { atSec: 0, durSec: 3.6, note: 71, gain: 0.5 },
        { atSec: 0, durSec: 7.2, note: 57, gain: 0.5 },
        { atSec: 0, durSec: 7.2, note: 60, gain: 0.45 },
        { atSec: 0, durSec: 7.2, note: 64, gain: 0.5 },
        { atSec: 3.6, durSec: 3.6, note: 41, gain: 0.5 },
        { atSec: 3.6, durSec: 3.6, note: 69, gain: 0.5 },
      ],
    },
    cadence: {
      notes: [
        { atSec: 0, durSec: 1.8, note: 67, gain: 0.5 },
        { atSec: 0, durSec: 3.4, note: 50, gain: 0.55 },
        { atSec: 0, durSec: 3.4, note: 69, gain: 0.5 },
        { atSec: 0, durSec: 5.2, note: 62, gain: 0.45 },
        { atSec: 1.8, durSec: 3.4, note: 65, gain: 0.45 },
        { atSec: 3.4, durSec: 1.8, note: 43, gain: 0.55 },
        { atSec: 3.4, durSec: 1.8, note: 59, gain: 0.45 },
        { atSec: 3.4, durSec: 3.8, note: 67, gain: 0.45 },
        { atSec: 5.2, durSec: 2, note: 48, gain: 0.55 },
        { atSec: 5.2, durSec: 2, note: 60, gain: 0.45 },
        { atSec: 5.2, durSec: 2, note: 64, gain: 0.5 },
      ],
    },
    tide: {
      notes: [
        { atSec: 0, durSec: 6.8, note: 50, gain: 0.55 },
        { atSec: 0, durSec: 6.8, note: 57, gain: 0.45 },
        { atSec: 0, durSec: 6.8, note: 64, gain: 0.5 },
        { atSec: 0, durSec: 6.8, note: 72, gain: 0.5 },
      ],
    },
    stair: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 43, gain: 0.5 },
        { atSec: 1, durSec: 6.2, note: 50, gain: 0.45 },
        { atSec: 2, durSec: 5.2, note: 59, gain: 0.45 },
        { atSec: 3, durSec: 4.2, note: 64, gain: 0.5 },
        { atSec: 4, durSec: 3.2, note: 69, gain: 0.5 },
      ],
    },
    swells: {
      notes: [
        { atSec: 0, durSec: 3.8, note: 48, gain: 0.5 },
        { atSec: 0, durSec: 3.8, note: 67, gain: 0.45 },
        { atSec: 0.4, durSec: 3.4, note: 76, gain: 0.5 },
        { atSec: 3.2, durSec: 4, note: 53, gain: 0.5 },
        { atSec: 3.2, durSec: 4, note: 60, gain: 0.45 },
        { atSec: 3.6, durSec: 3.6, note: 69, gain: 0.5 },
      ],
    },
    organum: {
      notes: [
        { atSec: 0, durSec: 1.8, note: 57, gain: 0.5 },
        { atSec: 0, durSec: 3, note: 69, gain: 0.4 },
        { atSec: 0, durSec: 7.2, note: 50, gain: 0.5 },
        { atSec: 1.8, durSec: 1.2, note: 60, gain: 0.5 },
        { atSec: 3, durSec: 1.2, note: 62, gain: 0.5 },
        { atSec: 3, durSec: 2.4, note: 67, gain: 0.4 },
        { atSec: 4.2, durSec: 1.2, note: 64, gain: 0.55 },
        { atSec: 5.4, durSec: 1.8, note: 62, gain: 0.5 },
        { atSec: 5.4, durSec: 1.8, note: 65, gain: 0.4 },
      ],
    },
    hymn: {
      notes: [
        { atSec: 0, durSec: 1.8, note: 45, gain: 0.5 },
        { atSec: 0, durSec: 1.8, note: 64, gain: 0.45 },
        { atSec: 0, durSec: 1.8, note: 72, gain: 0.55 },
        { atSec: 0, durSec: 5.4, note: 60, gain: 0.45 },
        { atSec: 1.8, durSec: 1.8, note: 41, gain: 0.5 },
        { atSec: 1.8, durSec: 1.8, note: 65, gain: 0.45 },
        { atSec: 1.8, durSec: 1.8, note: 69, gain: 0.5 },
        { atSec: 3.6, durSec: 1.8, note: 48, gain: 0.5 },
        { atSec: 3.6, durSec: 1.8, note: 64, gain: 0.45 },
        { atSec: 3.6, durSec: 3.6, note: 67, gain: 0.5 },
        { atSec: 5.4, durSec: 1.8, note: 43, gain: 0.5 },
        { atSec: 5.4, durSec: 1.8, note: 59, gain: 0.45 },
        { atSec: 5.4, durSec: 1.8, note: 62, gain: 0.45 },
      ],
    },
    lament: {
      notes: [
        { atSec: 0, durSec: 1.5, note: 72, gain: 0.6 },
        { atSec: 0, durSec: 7.2, note: 57, gain: 0.4 },
        { atSec: 1.5, durSec: 1.5, note: 71, gain: 0.55 },
        { atSec: 3, durSec: 1.5, note: 69, gain: 0.55 },
        { atSec: 4.5, durSec: 1.2, note: 67, gain: 0.5 },
        { atSec: 5.7, durSec: 1.5, note: 64, gain: 0.5 },
      ],
    },
    cantor: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 50, gain: 0.6 },
        { atSec: 1.6, durSec: 1, note: 53, gain: 0.55 },
        { atSec: 2.6, durSec: 1, note: 52, gain: 0.55 },
        { atSec: 3.6, durSec: 1.6, note: 45, gain: 0.6 },
        { atSec: 5.2, durSec: 2, note: 48, gain: 0.6 },
      ],
    },
    lonely: {
      notes: [{ atSec: 0, durSec: 6.8, note: 62, gain: 0.6 }],
    },
    moons: {
      notes: [
        { atSec: 0, durSec: 2, note: 57, gain: 0.6 },
        { atSec: 0.9, durSec: 2, note: 72, gain: 0.5 },
        { atSec: 1.8, durSec: 2, note: 64, gain: 0.5 },
        { atSec: 2.7, durSec: 2, note: 79, gain: 0.45 },
        { atSec: 3.8, durSec: 2, note: 52, gain: 0.6 },
        { atSec: 4.6, durSec: 2, note: 71, gain: 0.5 },
        { atSec: 5.4, durSec: 1.9, note: 67, gain: 0.45 },
      ],
    },
    high: {
      notes: [
        { atSec: 0, durSec: 0.8, note: 76, gain: 0.55 },
        { atSec: 0.7, durSec: 0.8, note: 83, gain: 0.45 },
        { atSec: 1.4, durSec: 0.8, note: 79, gain: 0.5 },
        { atSec: 2.4, durSec: 1, note: 88, gain: 0.4 },
        { atSec: 3.6, durSec: 0.8, note: 84, gain: 0.45 },
        { atSec: 4.4, durSec: 0.8, note: 81, gain: 0.5 },
        { atSec: 5.4, durSec: 1.6, note: 76, gain: 0.5 },
      ],
    },
    drops: {
      notes: [
        { atSec: 0, durSec: 0.3, note: 72, gain: 0.6 },
        { atSec: 0.5, durSec: 0.3, note: 79, gain: 0.5 },
        { atSec: 1.5, durSec: 0.3, note: 76, gain: 0.55 },
        { atSec: 1.9, durSec: 0.3, note: 84, gain: 0.4 },
        { atSec: 3, durSec: 0.3, note: 74, gain: 0.55 },
        { atSec: 3.4, durSec: 0.3, note: 81, gain: 0.45 },
        { atSec: 4.6, durSec: 0.3, note: 71, gain: 0.55 },
        { atSec: 5.6, durSec: 0.5, note: 76, gain: 0.5 },
      ],
    },
    ostinato: {
      notes: [
        { atSec: 0, durSec: 0.8, note: 57, gain: 0.6 },
        { atSec: 0.4, durSec: 0.6, note: 64, gain: 0.45 },
        { atSec: 0.8, durSec: 0.6, note: 69, gain: 0.5 },
        { atSec: 1.2, durSec: 0.6, note: 72, gain: 0.45 },
        { atSec: 1.6, durSec: 0.6, note: 71, gain: 0.5 },
        { atSec: 2, durSec: 0.6, note: 64, gain: 0.45 },
        { atSec: 2.4, durSec: 0.8, note: 55, gain: 0.6 },
        { atSec: 2.8, durSec: 0.6, note: 62, gain: 0.45 },
        { atSec: 3.2, durSec: 0.6, note: 67, gain: 0.5 },
        { atSec: 3.6, durSec: 0.6, note: 71, gain: 0.45 },
        { atSec: 4, durSec: 0.6, note: 69, gain: 0.5 },
        { atSec: 4.4, durSec: 0.6, note: 62, gain: 0.45 },
        { atSec: 4.8, durSec: 1.8, note: 53, gain: 0.6 },
        { atSec: 5.2, durSec: 1.6, note: 60, gain: 0.45 },
        { atSec: 5.6, durSec: 1.4, note: 64, gain: 0.5 },
        { atSec: 6, durSec: 1.2, note: 69, gain: 0.45 },
      ],
    },
    ninths: {
      notes: [
        { atSec: 0, durSec: 2.4, note: 48, gain: 0.6 },
        { atSec: 0.5, durSec: 2, note: 55, gain: 0.5 },
        { atSec: 1, durSec: 1.8, note: 64, gain: 0.5 },
        { atSec: 1.5, durSec: 1.5, note: 74, gain: 0.55 },
        { atSec: 2.2, durSec: 1, note: 71, gain: 0.45 },
        { atSec: 3.2, durSec: 3.6, note: 45, gain: 0.6 },
        { atSec: 3.7, durSec: 3.2, note: 52, gain: 0.5 },
        { atSec: 4.2, durSec: 2.8, note: 60, gain: 0.5 },
        { atSec: 4.7, durSec: 2.4, note: 71, gain: 0.55 },
        { atSec: 5.4, durSec: 1.8, note: 67, gain: 0.45 },
      ],
    },
    answer: {
      notes: [
        { atSec: 0, durSec: 0.6, note: 69, gain: 0.6 },
        { atSec: 0.7, durSec: 0.6, note: 72, gain: 0.55 },
        { atSec: 1.4, durSec: 1.1, note: 71, gain: 0.6 },
        { atSec: 2.8, durSec: 0.6, note: 62, gain: 0.55 },
        { atSec: 3.5, durSec: 0.6, note: 65, gain: 0.5 },
        { atSec: 4.2, durSec: 1.1, note: 64, gain: 0.55 },
        { atSec: 5.5, durSec: 1.7, note: 57, gain: 0.5 },
        { atSec: 5.5, durSec: 1.7, note: 69, gain: 0.45 },
      ],
    },
    knock: {
      notes: [
        { atSec: 0, durSec: 0.25, note: 62, gain: 0.65 },
        { atSec: 0.36, durSec: 0.25, note: 62, gain: 0.45 },
        { atSec: 0.72, durSec: 0.4, note: 69, gain: 0.6 },
        { atSec: 1.6, durSec: 0.25, note: 65, gain: 0.5 },
        { atSec: 2.2, durSec: 0.4, note: 60, gain: 0.6 },
        { atSec: 3.2, durSec: 0.25, note: 62, gain: 0.65 },
        { atSec: 3.56, durSec: 0.25, note: 62, gain: 0.45 },
        { atSec: 3.92, durSec: 0.4, note: 72, gain: 0.55 },
        { atSec: 4.8, durSec: 0.25, note: 67, gain: 0.5 },
        { atSec: 5.4, durSec: 1.2, note: 50, gain: 0.6 },
      ],
    },
    sighs: {
      notes: [
        { atSec: 0, durSec: 1.1, note: 76, gain: 0.6 },
        { atSec: 1.1, durSec: 1, note: 74, gain: 0.45 },
        { atSec: 2.5, durSec: 1.1, note: 72, gain: 0.6 },
        { atSec: 3.6, durSec: 1, note: 71, gain: 0.45 },
        { atSec: 5, durSec: 1.1, note: 69, gain: 0.6 },
        { atSec: 6.1, durSec: 1.2, note: 67, gain: 0.45 },
      ],
    },
    walk: {
      notes: [
        { atSec: 0, durSec: 1, note: 38, gain: 0.65 },
        { atSec: 1.1, durSec: 0.7, note: 45, gain: 0.55 },
        { atSec: 1.9, durSec: 0.9, note: 43, gain: 0.55 },
        { atSec: 2.9, durSec: 1.2, note: 41, gain: 0.6 },
        { atSec: 4.2, durSec: 1, note: 36, gain: 0.65 },
        { atSec: 5.3, durSec: 1.9, note: 33, gain: 0.65 },
      ],
    },
    slides: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 33, gain: 0.65 },
        { atSec: 1.6, durSec: 1.3, note: 40, gain: 0.6 },
        { atSec: 3, durSec: 0.9, note: 38, gain: 0.55 },
        { atSec: 4, durSec: 1.3, note: 36, gain: 0.6 },
        { atSec: 5.4, durSec: 1.8, note: 31, gain: 0.65 },
      ],
    },
    pedal: {
      notes: [
        { atSec: 0, durSec: 3.4, note: 36, gain: 0.6 },
        { atSec: 1.6, durSec: 1.6, note: 43, gain: 0.45 },
        { atSec: 3.6, durSec: 3.6, note: 31, gain: 0.6 },
        { atSec: 5, durSec: 2.2, note: 43, gain: 0.45 },
      ],
    },
    sill: {
      notes: [
        { atSec: 0, durSec: 3.2, note: 45, gain: 0.6 },
        { atSec: 1.6, durSec: 1.8, note: 52, gain: 0.45 },
        { atSec: 3.4, durSec: 1.8, note: 48, gain: 0.55 },
        { atSec: 5.2, durSec: 2, note: 43, gain: 0.6 },
      ],
    },
    ground: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 38, gain: 0.55 },
        { atSec: 0, durSec: 7.2, note: 45, gain: 0.45 },
        { atSec: 0.8, durSec: 6.4, note: 57, gain: 0.4 },
      ],
    },
    deep: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 36, gain: 0.55 },
        { atSec: 2, durSec: 5.2, note: 43, gain: 0.45 },
        { atSec: 3.6, durSec: 3.6, note: 52, gain: 0.4 },
        { atSec: 4.8, durSec: 2.4, note: 62, gain: 0.4 },
      ],
    },
    lean: {
      notes: [
        { atSec: 0, durSec: 2.4, note: 64, gain: 0.5 },
        { atSec: 0, durSec: 7.2, note: 57, gain: 0.5 },
        { atSec: 2.4, durSec: 2.2, note: 65, gain: 0.5 },
        { atSec: 4.6, durSec: 2.6, note: 64, gain: 0.5 },
      ],
    },
  },
  directions: [
    {
      id: 'steel-soprano',
      name: 'Steel soprano',
      category: 'voice',
      rows: `
Voice on a silver pin | Steel soprano | rate=6.2 glide=.18 edge=.1 pressure=.05 rasp=.05 width=.3 wander=.15 volume=1 | mike | aria | A thin pure bowed voice, shaken just over six times a second
She warms up early | Steel soprano | tremble=.35 rate=4 swell=.8 edge=.5 wander=.9 rasp=.45 pressure=.5 bend=.6 | room | aria | A bowed voice with rosin in it and unsteady hands
Canal window | Steel soprano | bend=1 leak=.08 damp=.1 rate=5 edge=.35 wellWidth=.1 wander=.2 width=1 | plate 1.mix=0.22 | aria | One deep bend whose notes ring on over each other
Washing-up song | Steel soprano | tremble=.12 rate=5.4 glide=.08 edge=.6 pressure=.35 leak=.55 damp=.8 wander=.65 width=.15 volume=2 | tile | answer | A bowed voice almost without shake, let go at each note's end
First note of the day | - | secondWell=None tremble=.6 rate=5.8 swell=1.4 edge=.2 bend=.7 steel=0 glide=.25 width=.4 | hall 1.mix=0.22 | lonely | One long note that starts quiet and soon takes on its shake
Pantry alto | Steel soprano | edge=.05 pressure=.3 rate=4.8 tremble=.55 bend=.6 leak=.4 wander=.1 width=.25 | warm | lament | A dark bowed voice shaken a little under five times a second
Velvet behind the door | Steel soprano | edge=.02 pressure=.45 wellWidth=.6 rate=3.4 tremble=.45 swell=.35 wander=.2 | shade | duet | Two dark voices bowed close to each other, the steel kept out
Mezzo by lamplight | Steel soprano | edge=.4 bend=.45 wellWidth=.75 concord=.6 rate=5.2 pressure=.5 swell=.12 wander=.7 | booth | answer | A reedy middle voice from a half-bent blade
Half a song in the rain | Steel soprano | edge=.15 rate=3.8 tremble=.5 rasp=.5 leak=.5 glide=.5 wander=.85 | rain | lament | A grainy dark voice that slides half a second into each note
Contralto of the mill | Steel soprano | secondWell=Octave farWell=.7 tunnel=.5 edge=.2 rate=4.5 tremble=.4 wander=.2 volume=0 | chamber | cantor | A bowed voice whose second bend answers an octave below
Crypt basso | Steel soprano | edge=.35 pressure=.55 rate=3 tremble=.4 bend=.9 width=.4 wander=.65 | cathedral | cantor | A low bowed voice, full and slowly shaken
Boatman ducking | Steel soprano | edge=.55 pressure=.7 rate=3.6 tremble=.3 glide=.6 bend=.5 rasp=.3 wander=.75 | stairs | cantor | A low firm voice that slides from note to note
Old man hums the ground | Steel soprano | edge=0 pressure=.15 rasp=.25 tremble=.25 rate=3.2 wellWidth=.4 wander=1 volume=0.5 | round | cantor | A low hum of bowed steel with the lips shut, never quite steady
Night watchman humming | Steel soprano | secondWell=Twin farWell=1 tunnel=1.4 edge=.25 tremble=.3 rate=3.6 swell=.5 width=.5 bend=.6 rasp=.6 pressure=.5 | darkecho | cantor | A rough low voice passed to its twin and back more than once a second
Baritone two floors up | Steel soprano | edge=.7 pressure=.4 bend=.22 leak=.5 wellWidth=.2 rate=5 tremble=.5 steel=.5 wander=.1 volume=0 | slap | cantor | A bright low voice from a shallow bend, some plain steel in it
Long way down to E | Steel soprano | glide=1.2 tremble=.25 rate=3.2 edge=.25 swell=.3 pressure=.6 wellWidth=.7 bend=.7 wander=.1 | darkhall 1.mix=0.28 | lament | A firm reedy voice that takes more than a second over every slide
Swoop of the swallow | Steel soprano | glide=.7 tremble=.2 edge=.5 bend=.95 wellWidth=.05 leak=.15 wander=.2 volume=0 | hall 1.mix=0.25 | aria | A clear voice that slides and hardly shakes
Glass while it is soft | Steel soprano | glide=.9 glideLaw=Nearest rate=6.5 tremble=.55 edge=.7 pressure=.1 bend=1 wander=.6 | shining | aria | A bright light-bowed voice easing late into every pitch
Crying without words | Steel soprano | glide=1 wander=1 rate=4 tremble=.85 edge=.35 rasp=.45 pressure=.4 | steps | sighs | A wide-shaken voice with grain in it, every sigh a long slide
Ribbon pulled through | Steel soprano | glide=.5 tremble=0 wander=.1 edge=.3 concord=1 swell=.15 leak=.35 width=1 volume=1 | backward | answer | A voice with no shake at all, only slides
Four humming at table | Steel soprano | glideLaw=Nearest edge=0 pressure=.1 swell=.7 rate=3 tremble=.4 steel=0 wander=.15 | wood | choir | Closed lips in four voices, dark and even
Hum through the wall | Steel soprano | glideLaw=From_one edge=.08 pressure=.25 swell=1 tremble=.3 leak=.45 width=.2 rate=2.6 wander=.75 glide=.45 | pillow | cadence | Dark bowed voices on a slow cadence, each chord parting from one note
Lullaby for an engine | Steel soprano | glideLaw=Nearest glide=.2 edge=.12 rate=2.2 tremble=.65 swell=.4 bend=.65 width=.75 wander=.15 | lungs | lean | Dark voices rocked about twice a second
Choir with lips closed | Steel soprano | glideLaw=Nearest secondWell=Twin farWell=.9 tunnel=.4 edge=.05 swell=1.2 pressure=.2 tremble=.3 rate=4.8 volume=1 | monks | choir | A hummed chord, each voice trading with a twin
Warm breath on the pane | Steel soprano | exciter=Breath glideLaw=Nearest edge=.1 rasp=.3 swell=.5 pressure=.3 wander=.85 rate=4.4 tremble=.4 volume=-2 | felt | cadence | Voices half hummed and half blown, dark
Sisters on one bench | Steel soprano | glideLaw=Nearest rate=5.5 tremble=.45 edge=.6 pressure=.12 swell=.25 wellWidth=.08 wander=.2 | room 1.mix=0.2 | duet | Two clear hollow voices in a chain of held sevenths
Argument on the stairs | Steel soprano | glideLaw=Nearest secondWell=Twin tunnel=2.2 farWell=.95 edge=.55 tremble=.3 bend=.5 pressure=.65 rasp=.5 width=.95 rate=6.4 | chamber | duet | Two firm grainy voices, each split in two and beating
Letters read together | Steel soprano | glideLaw=Nearest exciter=Breath edge=.4 rasp=.5 tremble=.3 swell=.2 wander=.7 volume=3 | mike | duet | Two whispered voices with more air than tone
Parallel harbour lamps | Steel soprano | glideLaw=Nearest wellWidth=.02 concord=1 edge=.75 bend=.6 rate=6.8 tremble=.4 wander=.15 volume=0 | sidetoside | duet | Two hollow bright voices with a quick small shake
Cousins at the well | Steel soprano | glideLaw=Nearest bend=.3 leak=.6 edge=.35 pressure=.65 rasp=.6 damp=.8 wellWidth=.8 tremble=.45 rate=3.8 wander=.9 | bridge | duet | Two rough country voices, let go at once
The house on its feet | Steel soprano | pressure=.8 edge=.6 tremble=.95 rate=6.4 swell=.1 bend=.8 rasp=.2 wander=.1 | hall | aria | A voice pressed hard and shaken as far as it goes
Foundry soprano | Steel soprano | pressure=.95 edge=.75 steel=.6 rate=5 tremble=.5 bend=.5 rasp=.4 width=.75 wander=.65 volume=-10.5 | plate | aria | A hard-pressed bright voice with plain steel ringing round it
Throat of brass leaf | Steel soprano | pressure=.7 edge=.45 wellWidth=.9 concord=.3 bend=.75 rate=6 wander=.1 | valve | sighs | Crowded upper notes make a nasal, pressed voice
Gallery salute | Steel soprano | pressure=.6 edge=.65 tremble=.15 leak=.5 swell=.05 glide=.1 wellWidth=.15 wander=0 width=1 | brightplate | answer | Quick firm calls that barely shake
Quarry shout | Steel soprano | pressure=1 edge=.4 bend=.25 rasp=.7 leak=.65 tremble=.4 rate=4.8 wander=.8 | gated | answer | A rough open shout from a shallow bend
Slow tears on tin | Steel soprano | rate=1.1 tremble=.8 edge=.3 swell=.6 glide=.5 secondWell=Twin farWell=0 tunnel=.8 wander=.2 | tank | lament | A voice that bends and goes out about once a second
Cradle that still rocks | Steel soprano | glideLaw=Nearest rate=.6 tremble=1 edge=.2 swell=.8 pressure=.3 wander=.1 | water | lean | A voice tipped slowly to both sides of its note
Mourner taking her time | Steel soprano | rate=2 tremble=.6 wander=1 edge=.5 rasp=.55 leak=.4 | cave | lament | A grainy lament with a slow wide shake and unsteady hands
Graveside swaying | Steel soprano | rate=1.6 tremble=.7 secondWell=Octave tunnel=.2 farWell=.9 edge=.25 wander=.7 volume=-8 | undertow | lament | A slow-shaken voice with a deep one that comes and goes below
Ebb of an old sorrow | Steel soprano | rate=2.6 tremble=.75 edge=.1 bend=1 leak=.05 damp=0 swell=.45 | descent | sighs | Dark sighs that ring on into one another
Choir out of one mouth | Opening from one | secondWell=None tremble=.55 rate=6.2 glide=.8 edge=.35 bend=.85 swell=.6 width=.85 wander=.15 | choirverb | choir | Voices that open out of a single note over three seconds
Steel girls at vespers | Steel soprano | glideLaw=Nearest edge=.55 swell=.9 tremble=.5 bend=.9 width=1 steel=.35 wellWidth=.65 concord=.9 pressure=.12 | cathedral 1.mix=0.3 | hymn | A clear crowded choir in four plain chords, set wide
Sixteen candles singing | Steel soprano | glideLaw=Nearest wellWidth=.8 concord=1 edge=.8 pressure=.05 swell=1.6 rate=4.6 wander=.15 | climb | tide | A bright crowded chord bowed very lightly
Chapel without a roof | Steel soprano | glideLaw=Straight exciter=Breath edge=.55 rasp=.4 wander=1 swell=.9 rate=3.2 glide=.2 volume=0.5 | field | cadence | A choir of blown steel that comes in gusts
Boys in the cold nave | Steel soprano | glideLaw=Nearest tremble=.05 edge=.65 bend=1 concord=1 wellWidth=.05 swell=.5 leak=.3 wander=.1 | farhall | hymn | A straight hollow choir with no shake to speak of
Aria down the wire | Steel soprano | pressure=.65 edge=.55 rate=6.6 bend=.55 wellWidth=.8 concord=.7 wander=.15 tremble=.45 | night | aria | A firm nasal voice with a quick shake
The diva, worn smooth | Steel soprano | pressure=.55 tremble=.85 rate=6 glide=.5 edge=.5 wander=.65 | shellac | aria | A wide-shaken voice that slides from note to note
Next farm's song | Steel soprano | rate=4.6 tremble=.4 edge=.45 wander=.6 leak=.45 pressure=.65 rasp=.6 bend=.4 | shore | sighs | A rough bowed voice with an easy shake
Kitchen singer | Steel soprano | edge=.35 pressure=.6 rate=5.4 tremble=.5 swell=.08 wellWidth=.85 concord=.3 wander=.7 | kitchen | lament | A quick-speaking nasal voice
Voice that split in two | Steel soprano | glideLaw=Nearest secondWell=Twin tunnel=6 farWell=.4 tremble=.2 edge=.5 width=.3 | split | lonely | One voice shivering between two bends almost seven times a second
`,
    },
    {
      id: 'twin-ghosts',
      name: 'Twin ghosts',
      category: 'pad',
      rows: `
Tide under two doors | Twin ghosts | tunnel=.14 leak=.15 edge=.15 swell=2.5 farWell=1 rate=.2 tremble=.5 wander=.7 volume=3 | valley | tide | Bowed steel that leaves for its twin and takes six seconds to come back
Somebody in the next bed | Twin ghosts | tunnel=.25 farWell=1 edge=.35 swell=.9 width=.9 damp=.5 pressure=.4 rasp=.55 bend=.6 rate=.3 tremble=.4 wander=.8 volume=-6 | room | lean | A quiet grainy bowed tone and its twin, changing sides every second or two
Mirrors across a hallway | Twin ghosts | tunnel=.16 wellWidth=.05 concord=1 edge=.4 swell=1.4 pressure=.3 rate=.15 tremble=.6 farWell=1 | longplate | stair | Hollow bowed tones that pass slowly between two bends
A moth tries the lamps | Twin ghosts | tunnel=.5 edge=.5 steel=0 pressure=.05 bend=.9 leak=.1 rate=7.5 tremble=.2 wander=.7 volume=-6 | sidetoside | swells | A light pure pad that changes bends every second or so
The house keeps count | Twin ghosts | tunnel=.1 bend=.3 leak=.55 pressure=.5 swell=1 edge=.3 damp=.6 rate=.5 tremble=.45 wander=.15 farWell=.6 | steps | hymn | Plain chords from a shallow bend, passing slowly to a twin
Fog talks to itself | Twin ghosts | exciter=Breath rasp=.7 edge=.3 swell=1.6 tunnel=.2 rate=.25 tremble=.5 wander=.65 farWell=.7 volume=-8 | fog | tide | Blown steel, much of it air, drifting over to its twin
Sea fret on the slip | Twin ghosts | exciter=Breath rasp=.45 wander=1 edge=.55 tunnel=.35 swell=2 rate=.4 volume=-8 | surf | lean | Blown twins that come in gusts
Curtain and its shadow | Twin ghosts | exciter=Breath rasp=.15 edge=.1 pressure=.5 tunnel=.12 swell=.8 bend=.8 rate=.6 wander=.15 farWell=.6 volume=-1.5 | darkhall | cadence | Dark round blown chords, with little air in them
Dust lifted off a sheet | Twin ghosts | exciter=Breath rasp=1 edge=.8 leak=.6 tunnel=.8 swell=.5 steel=.2 width=.95 rate=8.5 tremble=.4 farWell=.5 volume=-6.5 | airy | swells | Mostly air, thin and bright, with two bends under it
Sleep talk in the attic | Twin ghosts | exciter=Breath rasp=.5 edge=.45 wellWidth=.85 concord=.4 tunnel=.15 swell=1.2 rate=1.4 tremble=.5 farWell=1 glideLaw=Straight glide=.5 volume=-8 | vowel | choir | Crowded blown chords that go over to a twin and return
Somewhere else by turns | Twin ghosts | farWell=0 tunnel=.18 swell=1 edge=.4 steel=.2 tremble=.1 rate=7 wander=.15 volume=0 | hall | tide | With its twin kept silent, every note goes away and comes back
Lights of a slow train | Twin ghosts | farWell=0 tunnel=.8 swell=.6 edge=.6 bend=.8 rate=2 wander=.1 volume=0 | reel | stair | Notes that dim and return nearly once a second, higher ones sooner
Nodding by the stove | Twin ghosts | farWell=.1 tunnel=.35 edge=.05 pressure=.35 swell=1.2 rasp=.3 rate=.5 tremble=.5 | warm | cadence | Dark bowed chords that sink away and come round again
Blink of a far beacon | Twin ghosts | farWell=0 tunnel=1.6 pressure=.4 edge=.5 swell=.8 wellWidth=.1 tremble=0 wander=0 volume=-6.5 | shore | lonely | One bowed note that goes out and comes back over and over
Holes in the wool | Twin ghosts | farWell=.15 tunnel=3.5 swell=1.8 edge=.3 wellWidth=.7 leak=.4 rate=.15 tremble=.6 volume=0 | halftime | swells | A bowed pad that flickers three and four times a second
Frosted panes | Twin ghosts | edge=.75 steel=.7 pressure=.05 swell=2 tunnel=.14 bend=.8 rate=6.5 wander=.75 glideLaw=Straight glide=.9 volume=-7.5 | frost | tide | Bright bowed twins that leave one after another, and shimmering plain steel
Glass house at midnight | Twin ghosts | edge=1 steel=.3 concord=1 wellWidth=.05 pressure=0 swell=1.5 leak=.15 rate=7.5 tremble=.15 wander=.1 farWell=.7 | glimmer | lean | A very bright hollow pad, bowed as lightly as can be
Moonlit fence | Twin ghosts | edge=.5 steel=.95 rasp=.5 tunnel=.4 swell=.8 leak=.4 pressure=.3 width=.8 rate=.35 wander=.8 | field | swells | Grainy bowing that wakes a lot of loose steel between twins
Bottles full of sun | Twin ghosts | edge=.8 steel=.1 wellWidth=.5 tunnel=.6 pressure=.2 bend=.6 swell=1 rate=.2 tremble=.5 glideLaw=From_one glide=.4 volume=-6 | lit | hymn | Bright chords that part from one note and shift between two bends
Larch needles | Twin ghosts | edge=.7 steel=.5 pressure=.6 rasp=.35 tunnel=2 swell=.4 damp=.7 rate=6 tremble=.2 wander=.2 volume=-7.5 | bridge | organum | Firm bright bowing with a beat of two bends in it
Down the coal hole | Twin ghosts | edge=0 pressure=.4 bend=.35 steel=0 swell=.8 tunnel=.2 leak=.5 rate=.3 tremble=.45 farWell=.6 | box | choir | Dark low-bent twins with the top shut off
Far end of the tunnel | Twin ghosts | edge=.02 rasp=.05 bend=.9 steel=0 swell=2.2 tunnel=.08 leak=.1 tremble=.1 wander=.15 volume=2 | cave | tide | Almost pure dark tones that hand over very slowly
Horses breathing in dark | Twin ghosts | edge=.12 rasp=.8 pressure=.55 wander=.9 swell=1 tunnel=.3 rate=.7 | wood | stair | Dark grainy bowing that wavers in its pressure
Top deck, the last bus | Twin ghosts | edge=.15 pressure=.7 tunnel=1.2 swell=.6 wellWidth=.9 concord=.6 rate=.9 tremble=.4 volume=-6 | chorale | cadence | Pressed dark chords with a slow beat of twins
Quarry pool at rest | Twin ghosts | edge=.08 tunnel=.05 swell=3 concord=1 pressure=.1 wander=0 tremble=0 glideLaw=Straight glide=.6 volume=-3.5 | darkwater | swells | A still dark pad whose notes slide off in turn, nothing shaking in it
Curtained crowd | Twin ghosts | wellWidth=.95 concord=0 bend=1 edge=.5 tunnel=.3 swell=1.2 rate=.1 tremble=.5 farWell=1 wander=.65 volume=-7 | corridor | tide | Every note crowded with others close above it, twice over
Chimney bees | Crowded curve | secondWell=Twin farWell=.8 tunnel=.9 edge=.45 pressure=.35 swell=.7 width=.9 rate=9 tremble=.3 wander=.15 volume=-6.5 | valve | lean | A close swarm of trapped notes traded between two bends
Choirs that disagree | Crowded curve | secondWell=Twin farWell=1 tunnel=.15 edge=.3 concord=.25 width=1 rate=.4 tremble=.5 volume=-3 | cathedral 1.mix=0.3 | cadence | Crowded dark chords answered from a twin bend
Gable ravens | Crowded curve | secondWell=Twin farWell=.6 tunnel=2.5 edge=.65 steel=.4 rasp=.4 swell=.5 rate=2.6 wander=.8 width=0.9 | stairs | stair | Rough crowded tones beating between two bends
Warm rain on a tin roof | Crowded curve | secondWell=Twin farWell=.9 tunnel=.4 exciter=Breath rasp=.35 edge=.4 swell=1 rate=.5 volume=-9 | rain | swells | Crowded notes blown softly between two bends
Candle dropped in snow | Twin ghosts | exciter=Mallet swell=1.5 edge=.3 tunnel=.4 leak=.1 damp=.1 pressure=.2 rate=.2 tremble=.5 volume=2 | bloomspace | tide | Struck so softly that the blow is gone, then handed to and fro
Piano left in the rain | Twin ghosts | exciter=Mallet swell=.1 edge=.4 tunnel=1 leak=.3 damp=.3 rasp=.5 rate=2 tremble=.5 farWell=.6 volume=-4.5 | worn | ninths | Soft mallets on twin bends that trade once a second | keys
Shed harp | Twin ghosts | exciter=Thumb swell=.4 edge=.5 tunnel=.6 leak=.12 damp=0 steel=.3 rate=.5 tremble=.5 width=.75 wander=0 volume=-8 | bowed | stair | Thumbed steel left ringing between two bends
Branch sheds its snow | Twin ghosts | exciter=Mallet swell=.6 edge=.15 bend=1 tunnel=.2 leak=.05 damp=0 steel=0 rasp=.5 wellWidth=.7 concord=.5 rate=.3 tremble=.4 volume=-1 | frozen | swells | Felted crowded strokes, dimly lit, that ring and change bends
Lanterns lowered in | Twin ghosts | exciter=Mallet swell=2.2 edge=.65 pressure=.4 tunnel=.8 leak=.15 wellWidth=.6 rate=6.5 tremble=.25 volume=-6 | climb | tide | Very slow soft blows whose ring passes between twins
Below the car deck | Twin ghosts | secondWell=Octave tunnel=.2 edge=.2 swell=1.4 width=.7 rate=.12 tremble=.7 glideLaw=From_one glide=.5 volume=-9 | lowvault | tide | Bowed chords that part from one note and sink to an octave below
Elder brother's shadow | Twin ghosts | secondWell=Octave farWell=.5 tunnel=.6 edge=.45 swell=.7 pressure=.5 rate=1 tremble=.4 volume=-8 | undertow | lean | A firm bowed pad with a softer octave below it, trading places
Drowned chancel | Twin ghosts | secondWell=Octave exciter=Breath rasp=.25 edge=.2 tunnel=.3 swell=1.5 bend=.9 rate=.3 tremble=.5 wander=.7 volume=-3.5 | shallows | choir | Blown chords passing down an octave and back
Elm roots | Twin ghosts | secondWell=Octave tunnel=1.5 edge=.1 bend=.5 leak=.4 pressure=.55 swell=.9 rate=.4 wander=.15 volume=-4.5 | chamber | organum | Dark pressed bowing that throbs against its octave
Dusk comes off the roof | Twin ghosts | secondWell=Octave tunnel=.08 edge=.6 steel=.6 swell=2.2 pressure=.15 rate=.1 tremble=.6 volume=-1.5 | sink | swells | Bright bowing that gives way to the octave below, slowly
Door opens on a choir | Opening from one | tunnel=.15 farWell=.9 edge=.35 glide=.9 swell=1.2 wellWidth=.75 concord=.9 pressure=.35 bend=.85 rate=.3 wander=.7 | hall | tide | A crowded chord that opens out of one note while twin bends trade it
Cold fingers fan out | Opening from one | exciter=Breath rasp=.4 edge=.6 tunnel=.5 glide=.7 swell=.8 rate=6.5 tremble=.25 wander=.15 volume=-3.5 | steps | stair | Blown notes that each unfold from the one before
Hands unclasped | Opening from one | edge=.1 pressure=.5 tunnel=1 glide=1.1 bend=.8 swell=.5 rate=1.4 volume=-0.5 | ensemble | cadence | Dark voices that part slowly from one note and beat against their twins
Petals off one stem | Opening from one | edge=.75 concord=1 wellWidth=.1 tunnel=.3 glide=.5 pressure=.05 swell=1.5 rate=.5 tremble=.4 farWell=.5 | fifthclimb | swells | Bright hollow tones that spread from one note
Ink meets water | Opening from one | exciter=Mallet swell=.8 edge=.45 tunnel=.4 leak=.1 damp=.1 glide=.8 width=.45 rate=.2 tremble=.6 wander=.05 volume=-8 | mist | tide | Soft blows that all begin on one note and spread to a chord
Shiver at the threshold | Twin ghosts | tunnel=7 farWell=.4 edge=.35 tremble=.1 swell=1.5 leak=.2 bend=.5 pressure=.55 wellWidth=.08 wander=.1 | double | lean | A firm hollow pad that shivers about eight times a second between twins
Pendulum in a dry well | Twin ghosts | tremble=.9 rate=.4 tunnel=.2 edge=.4 swell=1 bend=.7 wander=.15 | circle | swells | Bowed twins tipped slowly sharp and flat while they trade
Wintering bees | Twin ghosts | tremble=.5 rate=8 tunnel=.3 edge=.5 pressure=.35 wellWidth=.8 swell=1 wander=.1 volume=-3.5 | throb | choir | A close chord shaken eight times a second
Old coats dancing | Twin ghosts | tremble=.6 rate=1.2 tunnel=1.2 edge=.25 swell=.5 wander=.8 | platter | hymn | Twins that sway and trade a little more than once a second
Who is it at the pane | Twin ghosts | tremble=.8 rate=6 tunnel=.5 farWell=.7 edge=.6 rasp=.5 swell=.4 damp=.5 volume=3 | tilt | organum | Grainy shaken bowing that passes between two bends
`,
    },
    {
      id: 'mallet-moons',
      name: 'Mallet moons',
      category: 'bell',
      rows: `
Moonrise on the slipway | Mallet moons | tunnel=.25 leak=.12 edge=.15 bend=.95 tremble=.5 rate=.2 farWell=.6 wellWidth=.65 concord=1 wander=0 | valley | moons | Soft mallets on a deep crowded bend, the long ring handed slowly to its twin
Milk in a black bowl | Mallet moons | edge=.05 pressure=.1 swell=.3 leak=.18 tunnel=.6 steel=0 rate=.4 tremble=.3 wander=.1 farWell=.4 volume=-3.5 | warm | moons | Round dark strokes, almost only the note
A moon and its pond | Mallet moons | tunnel=.8 farWell=1 width=.85 edge=.3 leak=.15 tremble=0 volume=-3.5 | wide | moons | Deep strokes whose ring crosses from bend to bend once a second
Halo before the snow | Mallet moons | edge=.5 pressure=.15 leak=.08 damp=0 wellWidth=.1 concord=1 tunnel=.35 width=.8 rate=7 tremble=.2 farWell=.5 wander=.05 volume=-11.5 | shining | moons | Hollow octaves ring above each soft blow
Clock face without hands | Mallet moons | farWell=0 tunnel=.4 leak=.14 edge=.55 pressure=.4 swell=.03 wellWidth=.02 concord=1 rate=.3 | hall 1.mix=0.22 | moons | Struck hollow notes that go out and return, their twin unheard
Great gong of the marsh | Mallet moons | secondWell=Octave tunnel=.3 edge=.3 leak=.1 pressure=.5 wellWidth=.75 concord=.2 rate=.15 tremble=.5 glide=.5 glideLaw=Straight volume=-4 | cave | sill | Low crowded blows that slide in, whose ring sinks an octave and comes back
Below the bell of night | Mallet moons | pressure=.4 secondWell=Octave tunnel=.1 edge=.65 leak=.12 bend=1 steel=.3 farWell=1 rate=.3 tremble=.3 wellWidth=.04 concord=1 wander=0 volume=2.5 | undertow | sill | Deep long hollow strokes with an octave rising slowly under them
Anchor on a chain | Mallet moons | edge=.1 pressure=.65 swell=.02 leak=.35 damp=.5 secondWell=None | iron | walk | Firm low mallet notes with a round body | bass
Cellar drum and ladle | Mallet moons | leak=.7 damp=.7 edge=.2 pressure=.5 secondWell=Octave tunnel=2 swell=.01 farWell=1 wander=.1 width=.15 volume=0 | pot | sill | Short low strokes with their octave knocking under them
Tide gauge reading low | Mallet moons | wellWidth=.75 concord=.3 edge=.45 leak=.15 tunnel=.8 pressure=.35 farWell=.5 rate=.5 tremble=.3 | lowvault | deep | Low crowded strokes that trade between twins
Pearls let fall on slate | Mallet moons | edge=.5 leak=.45 pressure=.3 swell=.01 tunnel=.7 wellWidth=.75 concord=1 farWell=.4 width=.95 rate=7 volume=-3 | plate | high | Small high strokes, each a cluster, clear and short-lived
Stars in a water butt | Mallet moons | edge=.25 leak=.1 damp=0 tunnel=1.8 bend=.9 farWell=.5 wellWidth=.1 concord=1 rate=.5 tremble=.3 volume=-2 | stars | high | High hollow notes that beat three times a second
Moonstruck spoon | Mallet moons | secondWell=None edge=.6 pressure=.5 swell=.005 leak=.2 steel=.3 width=.45 rate=8 tremble=.3 wander=.1 volume=-3 | tile | high | A quick bright blow on one deep bend
Porch icicle | Mallet moons | secondWell=None wellWidth=0 concord=1 edge=.7 pressure=.05 leak=.12 damp=.05 rate=.6 tremble=.3 wander=.15 volume=2.5 | brightplate | high | High hollow tones struck lightly and left to ring
Seven sparrows of tin | Mallet moons | leak=.55 damp=.8 edge=.45 tunnel=4 farWell=.3 swell=.01 rate=9 tremble=.4 | tin | drops | Little dry strokes with a flutter in them
Felt shoes on the stairs | Mallet moons | swell=.1 leak=.45 damp=.75 edge=.12 secondWell=None tremble=0 rasp=.6 width=.35 wander=.05 | felt | ninths | Padded mallets, stopped when the key is let go | keys
Piano of soft iron | Mallet moons | swell=.04 leak=.35 damp=.65 edge=.4 pressure=.45 secondWell=None concord=1 wellWidth=.06 bend=.65 rasp=.1 wander=.1 volume=-5 | chamber | ninths | Rounded blows with a hollow octave above, damped by hand | keys
Schoolroom in August | Mallet moons | swell=.02 leak=.5 damp=.6 edge=.3 rasp=.6 tunnel=.8 rate=6.5 tremble=.3 farWell=.5 | reel | ostinato | Felted middling strokes with a little grain | keys
Sunday in the parlour | Mallet moons | secondWell=Twin tunnel=3 farWell=.5 leak=.4 damp=.7 edge=.25 rate=.3 tremble=.3 wander=.1 | amptrem | ninths | Soft keys of steel that beat three times a second | keys
Flannel keys | Mallet moons | swell=.25 leak=.4 damp=.5 edge=.02 pressure=.4 bend=.6 rate=.3 tremble=.3 farWell=.5 volume=-4 | shade | ostinato | Very dark muffled strokes | keys
Cork in a dry basin | Mallet moons | leak=.9 damp=.7 edge=.45 pressure=.25 swell=.01 steel=.2 wellWidth=.8 concord=.5 bend=.6 volume=0 | bare | ostinato | Short light knocks with a cluster in each and barely a ring | keys
Rosewood in disguise | Mallet moons | leak=.8 bend=.4 secondWell=None wellWidth=.2 concord=1 edge=.5 swell=.006 damp=.4 width=.7 pressure=.6 tremble=.4 rate=8 wander=0 volume=-1.5 | wood | answer | Dry barred strokes with one clear overtone | keys
The cask sounds empty | Mallet moons | leak=1 pressure=.8 bend=.5 edge=.3 rasp=.7 swell=.004 damp=1 volume=-3 | middle | knock | Very short hard knocks with a grain of felt | keys
Small steps in gravel | Mallet moons | leak=.75 rasp=.9 edge=.5 steel=.5 tunnel=6 swell=.02 damp=.6 | short | ostinato | Grainy short strokes with a rattle of two bends | keys
Wooden spoons at dusk | Mallet moons | leak=.65 edge=.08 pressure=.6 wellWidth=.6 secondWell=None swell=.015 damp=.5 rate=3 wander=.1 width=0.1 volume=-4.5 | darkecho | answer | Dark short knocks in the middle of the keys | keys
Disc with too many suns | Crowded curve | exciter=Mallet edge=.4 leak=.2 damp=.2 swell=.03 rate=.2 tremble=.5 volume=-2 | plate 1.mix=0.25 | moons | Crowded unevenly tuned overtones struck all at once
Rattled saucers | Crowded curve | exciter=Mallet secondWell=Twin tunnel=2.2 edge=.6 leak=.35 damp=.3 swell=.008 rate=7 width=1 volume=-9 | room | drops | Bright clustered strokes that beat between twins
Hung pot lids | Crowded curve | exciter=Mallet edge=.75 steel=.5 leak=.5 damp=.4 pressure=.6 swell=.004 rate=9 tremble=.5 volume=-3 | gated | knock | Hard bright clusters with a clang of plain steel | keys
Kettles in close harmony | Crowded curve | exciter=Mallet concord=1 edge=.5 leak=.1 damp=.1 swell=.2 secondWell=Twin tunnel=.2 farWell=.6 rate=.3 tremble=.5 glideLaw=From_one glide=.12 volume=-9.5 | cathedral 1.mix=0.3 | moons | Close tuned overtones, each stroke bent out of the last, between two bends
The lead moon | Crowded curve | exciter=Mallet secondWell=Octave tunnel=.4 edge=.15 leak=.12 damp=.1 swell=.1 rate=.15 tremble=.6 volume=-2 | darkhall | sill | Dark low clusters that pass an octave down and back
Fifth moon of the year | Mallet moons | secondWell=Fifth tunnel=.4 edge=.3 leak=.15 concord=1 width=.4 rate=.5 tremble=.3 farWell=.6 wander=.05 volume=-9 | hall 1.mix=0.28 | moons | A fifth wakes above each stroke and a low tone under it
Harvest in the bell loft | Mallet moons | secondWell=Fifth tunnel=1.5 edge=.55 pressure=.5 leak=.2 swell=.02 rate=6 tremble=.3 farWell=.5 volume=-10 | stairs | moons | Firm strokes that ring back and forth across a fifth
Heads or tails | Mallet moons | secondWell=Fifth farWell=.4 tunnel=3 leak=.4 damp=.5 edge=.4 rate=8 tremble=.4 volume=-9 | spin | answer | Short strokes with a fifth fluttering in them
Organ pipes at the dump | Mallet moons | secondWell=Fifth swell=.8 edge=.2 leak=.1 tunnel=.2 rate=.2 tremble=.4 farWell=1 wander=0 volume=-8 | fifthclimb | swells | Blows so soft they swell, then a slow fifth above | pad
Keel compass | Mallet moons | secondWell=Fifth tunnel=.15 edge=.65 wellWidth=.1 leak=.1 damp=.05 farWell=.95 rate=.2 tremble=.4 volume=-5.5 | bowls | sill | Low bright strokes under which a deeper tone gathers slowly
Moon seen from a canoe | Mallet moons | tremble=.8 rate=.7 tunnel=.4 leak=.12 edge=.25 wander=.15 glide=.5 width=1 | water | moons | Long strokes that tip slowly sharp and flat
Wet glass, round finger | Mallet moons | tremble=.6 rate=7 tunnel=.8 edge=.55 leak=.15 swell=.2 secondWell=None concord=1 wellWidth=.02 pressure=.1 wander=.05 volume=-2 | glimmer | moons | Soft hollow strokes shaken seven times a second, slower to settle
Ripples reach the reeds | Mallet moons | tremble=.4 rate=2.4 wander=1 edge=.2 leak=.2 tunnel=1 volume=-4.5 | stone | drops | Round high strokes that waver as they die
Third buoy out | Mallet moons | tremble=1 rate=.3 edge=.5 pressure=.5 leak=.15 secondWell=None wander=.8 volume=-3 | circle | moons | Clear strokes bent far and slowly by the knee
Tilted tray of mercury | Mallet moons | tremble=.5 rate=3.2 wellWidth=.8 edge=.35 tunnel=.3 leak=.18 width=1 farWell=.5 volume=-5 | swirl | ninths | Crowded soft strokes with a steady sway
Anvil wrapped in silk | Mallet moons | pressure=.85 edge=.6 swell=.02 leak=.15 bend=.9 steel=.4 wander=.1 farWell=.3 rate=7 | plate 1.mix=0.22 | moons | Hard bright blows on a deep bend, rung long
Noon on the weathercock | Mallet moons | pressure=.5 edge=.5 steel=.2 swell=.006 leak=.25 tunnel=2 farWell=.4 rate=.7 | lit | drops | Plain bright strokes that beat more than three times a second
Cold tongs | Mallet moons | pressure=1 edge=.65 bend=.6 rasp=.5 leak=.5 damp=.5 steel=.6 swell=.003 wellWidth=.85 concord=0 farWell=.5 | corridor | knock | Hard dry clustered blows with a good deal of plain steel | keys
Cold copper sun | Mallet moons | secondWell=None pressure=.6 edge=.7 wellWidth=.4 concord=.4 leak=.18 swell=.01 rate=.5 tremble=.4 volume=-4 | hollow | moons | A bright metal stroke with overtones a little out of true
Bell for the night ferry | Mallet moons | pressure=.75 edge=.45 wellWidth=.65 concord=.1 leak=.08 damp=0 tunnel=.2 farWell=.6 rate=.15 tremble=.5 volume=-16 | shore | sill | A hard stroke on a blade whose overtones are its own
Moon behind wet cloth | Mallet moons | swell=.6 edge=.2 leak=.15 tunnel=.25 damp=.1 secondWell=Octave farWell=.5 rate=.4 wander=0 | darkwater | moons | Slow soft dark blows with their octave gathering under them
Half asleep on deck | Mallet moons | swell=1 edge=.4 leak=.1 tunnel=.3 bend=1 damp=0 wellWidth=.65 concord=.9 tremble=.6 rate=.5 farWell=.5 | bowed | tide | Crowded blows as slow as a bow, the ring between two bends | pad
Memory of a doorbell | Mallet moons | edge=.5 leak=.3 damp=.3 pressure=.4 swell=.02 secondWell=Fifth tunnel=4 farWell=.6 | recall | answer | Plain clear strokes with a quick flutter of the fifth
Lamp across the valley | Mallet moons | edge=.45 leak=.2 tunnel=.9 pressure=.2 swell=.1 width=.5 wellWidth=.02 concord=1 tremble=.7 rate=.9 glideLaw=Straight glide=.25 volume=-14.5 | farhall | moons | Soft hollow strokes that slide in, sway and trade bends once a second
Dream of a brass band | Mallet moons | secondWell=Fifth swell=.4 edge=.5 leak=.2 tunnel=.7 rate=1.5 tremble=.4 farWell=.95 volume=-9 | platter | swells | Soft-struck fifths that swell and turn | pad
`,
    },
    {
      id: 'sliding-bass',
      name: 'Sliding bass',
      category: 'bass',
      rows: `
Plough horse on the rein | Sliding bass | glide=.12 edge=.45 leak=.55 pressure=.8 wellWidth=.65 concord=.5 rasp=.55 bend=.5 volume=-5 | bare | walk | A firm grainy bow with a quick slide into each low note
Ferry rope taking weight | Sliding bass | glide=.22 edge=.15 pressure=.6 damp=.6 leak=.4 swell=.05 bend=.85 wellWidth=.02 rasp=.1 tremble=.3 rate=1.5 volume=-4.5 | firm | slides | A dark firm bow that slides for a quarter of a second
Doorman in winter boots | Sliding bass | glide=.05 edge=.45 wellWidth=.5 bend=.5 leak=.6 damp=1 volume=-5 | chamber | walk | A square dry low note, stopped at once
Tractor up the lane | Sliding bass | glide=.15 pressure=.9 edge=.55 rasp=.45 bend=.45 wander=.4 rate=7 tremble=.4 volume=-2.5 | combo | slides | A hard bow with a bright grainy edge and a quick shake
Socks on cellar steps | Sliding bass | glide=.18 edge=.02 pressure=.35 swell=.12 bend=.6 steel=0 wander=.5 volume=-1.5 | shade | walk | A soft dark bow sliding quickly
River finding its bed | Sliding bass | glide=.9 edge=.25 pressure=.5 bend=.7 leak=.3 tremble=.3 rate=4 | warm | slides | A bow that takes most of a second to reach each low note
Barge nudging the lock | Sliding bass | glide=1.4 edge=.1 bend=.8 leak=.2 damp=.3 swell=.3 pressure=.4 rate=.3 tremble=.4 volume=-5.5 | hall 1.mix=0.2 | slides | Slow dark slides that ring on behind
Tar runs in the heat | Sliding bass | glide=.6 edge=.4 pressure=.65 wander=.7 rate=2 tremble=.5 width=0 | sway | walk | Slides with a slow wide shake in them
Underpass after eleven | Sliding bass | glide=.5 glideLaw=Nearest edge=.5 wellWidth=.3 leak=.4 swell=.08 wander=.7 rate=3 tremble=.3 volume=-6 | darkecho | walk | A low bow easing late into every pitch
Long haul after dark | Sliding bass | glide=.75 edge=.2 tremble=0 wander=0 bend=.95 leak=.1 damp=.4 swell=.4 rasp=.08 | valve | slides | A pure low tone that does nothing but slide
Rosined mooring | Rosin and rust | secondWell=None glide=.2 glideLaw=Straight edge=.35 swell=.03 rate=6 volume=-13.5 | grit | walk | A rough rosined bow on a shallow bend
Saw through green oak | Rosin and rust | secondWell=None glide=.1 pressure=1 edge=.6 damp=.8 leak=.5 rate=3 | room | slides | The hardest bowing, half note and half grain
Hull first into dry dock | Rosin and rust | glide=.4 glideLaw=Straight steel=.8 edge=.3 tunnel=.2 swell=.2 farWell=.5 rate=.5 | stairs | pedal | Rough low bowing with much plain steel waking round it
North wind at the gate | Rosin and rust | exciter=Breath glide=.3 edge=.2 wander=1 swell=.3 farWell=.4 rate=.3 | cave | pedal | Low blown steel in gusts, coarse and dark
Goats know the path | Rosin and rust | secondWell=None pressure=.6 rasp=.6 edge=.1 bend=.55 wellWidth=.8 glide=.15 rate=2.5 | bridge | walk | A coarse dark bow with crowded overtones
Father and son digging | Sliding bass | secondWell=Octave tunnel=.4 farWell=.7 edge=.3 bend=.6 volume=-0.5 | chamber | sill | A bowed low note that hands itself to the octave under it
Cellar under the cellar | Sliding bass | secondWell=Octave tunnel=.15 farWell=1 edge=.15 swell=.3 pressure=.5 width=.1 volume=6 | lowvault | sill | A slow dark bow with its octave rising below
Miner answers the rope | Sliding bass | secondWell=Octave tunnel=1.6 farWell=.6 edge=.45 leak=.4 glide=.2 volume=1.5 | gated | slides | A firm bow that throbs against its octave
Orchard mole | Sliding bass | secondWell=Octave tunnel=3 farWell=.5 edge=.05 pressure=.3 glide=.1 volume=2.5 | floor | walk | A dark low flutter of two octaves
Lift cables singing | Sliding bass | secondWell=Octave tunnel=.25 edge=.6 steel=.5 rasp=.3 bend=.7 glide=.8 farWell=.5 volume=-1 | stone | slides | Bright low slides that sink an octave and return
Twin engines at idle | Sliding bass | secondWell=Twin tunnel=1.1 farWell=1 edge=.5 glide=.15 leak=.4 rasp=.55 width=.75 pressure=.6 volume=-4.5 | middle | pedal | A gritty low note that beats against its twin once a second or slower
Oxen share a yoke | Sliding bass | secondWell=Twin tunnel=4 farWell=.5 edge=.2 pressure=.6 bend=.5 swell=.04 wellWidth=.6 | iron | walk | A dark bow with a flutter of two bends in it
The pier has a pulse | Sliding bass | secondWell=Twin tunnel=2 farWell=0 edge=.4 swell=.06 leak=.3 damp=.6 | throb | pedal | Low notes that go out and come back a little more than once a second
Chain ferry at half tide | Sliding bass | secondWell=Twin tunnel=.6 farWell=1 edge=.5 rasp=.5 glide=.5 width=.8 volume=2 | wide | slides | A grainy bow passing between two sides of a blade
Cattle grid at speed | Sliding bass | secondWell=Twin tunnel=9 farWell=.4 edge=.35 pressure=.7 glide=.1 leak=.5 volume=-4 | desk | walk | A low note split into a fast shiver
Thumb on the last wire | Deep thumb | secondWell=None leak=.3 edge=.35 damp=.6 pressure=.5 width=.2 rate=7 tremble=.15 wander=.1 volume=-2 | mike | walk | A plain deep thumb pluck that rings for its length
Boot heel on the boards | Deep thumb | secondWell=None leak=.75 edge=.2 damp=.8 pressure=1 swell=.003 wellWidth=.02 steel=.55 tremble=0 volume=-2 | wood | walk | A short hard low pluck with a knock of steel and hardly a ring
Elastic round the world | Deep thumb | secondWell=None bend=.9 leak=.1 damp=.2 edge=.5 glide=.12 glideLaw=Straight tremble=.7 rate=2.5 | slap | slides | A long low pluck that slides into place and wobbles
Grandfather's one string | Deep thumb | leak=.35 tunnel=.8 edge=.1 damp=.7 rasp=.7 farWell=.5 rate=6 wander=.05 volume=2 | cassette | walk | A fleshy dark pluck with the octave below it trading in
Rope left slack | Deep thumb | secondWell=Twin tunnel=3 farWell=.6 leak=.2 edge=.6 wellWidth=.7 concord=.4 rate=.5 volume=-11.5 | spin | pedal | A crowded low pluck that beats twice a second
Mallet on the keel beam | Mallet moons | secondWell=None edge=.4 leak=.4 damp=.6 pressure=.5 swell=.02 glide=.05 wellWidth=.8 concord=.4 bend=.9 wander=.1 | warm | walk | A firm low mallet note with a cluster over it, damped by hand
Pile driver at low tide | Mallet moons | secondWell=None pressure=.95 edge=.5 leak=.5 steel=.6 bend=.5 swell=.004 damp=.5 wellWidth=.8 concord=.1 wander=0 volume=2 | corridor | slides | Hard low blows with steel in them
The mill's slow heart | Mallet moons | secondWell=Octave tunnel=1.2 edge=.25 leak=.3 damp=.5 pressure=.4 swell=.03 volume=6 | deepsea | sill | Low soft thuds whose octave answers under them
Wool bale dropped twice | Mallet moons | secondWell=None edge=0 leak=.6 damp=.7 pressure=.35 swell=.15 volume=-3.5 | tide 1.mix=0.3 | sill | Very dark padded low strokes
Long low bell for fog | Mallet moons | secondWell=Twin tunnel=.5 edge=.6 leak=.12 damp=.15 pressure=.5 swell=.03 width=.3 wellWidth=.65 concord=.1 rate=.2 | murky | pedal | Long low strokes, a little sour, passing between twins
Tuba made of guttering | Breath on steel | secondWell=None glide=.1 rasp=.3 edge=.15 pressure=.7 swell=.06 bend=.6 wander=.1 rate=3 tremble=.15 volume=0.5 | box | walk | A hard-blown low note, round and dark
Boots on the bellows | Breath on steel | secondWell=None glide=.2 rasp=.7 edge=.3 pressure=.75 swell=.1 leak=.6 damp=.8 wellWidth=.9 volume=-5 | booth | walk | Short low reedy puffs with a good deal of air
Wind through a culvert | Breath on steel | secondWell=Octave tunnel=.4 glide=.6 rasp=.5 edge=.2 swell=.5 wander=.8 farWell=.5 rate=.2 tremble=.5 volume=-6 | cistern | sill | Low gusts that sink to their octave and return
Headland conch | Breath on steel | secondWell=None glide=.5 glideLaw=Straight rasp=.2 edge=.5 bend=.8 pressure=.6 swell=.25 wander=.15 rate=3.4 volume=0.5 | shell | slides | A full blown low tone sliding from pitch to pitch
Boiler cupboard | Breath on steel | secondWell=Twin tunnel=1.5 rasp=.8 edge=.3 steel=.2 swell=.2 pressure=.3 farWell=.5 rate=7 volume=-3.5 | hiss | pedal | More air than note, with a beat of twins at the bottom
Flagstones humming | Still line drone | secondWell=None edge=.1 swell=.5 pressure=.3 bend=.9 glide=.2 leak=.3 volume=-4 | cathedral 1.mix=0.25 | pedal | A still dark low bow with nothing shaking in it
Sleeper under the line | Still line drone | secondWell=None edge=0 swell=.2 pressure=.6 leak=.5 bend=.5 steel=0 damp=.6 volume=-7 | suboct | sill | A plain dark bowed note on a half-bent blade
Paper boat | Still line drone | secondWell=None edge=.45 pressure=.05 swell=.35 bend=1 wellWidth=.05 leak=.1 volume=-0.5 | shallows | slides | A light pure low tone with a hollow octave over it
Clock weight | Still line drone | secondWell=Twin tunnel=.3 edge=.2 pressure=.5 swell=.15 leak=.4 damp=.5 glide=.1 width=.15 farWell=1 volume=-4 | pulsed | pedal | A dark low note trading slowly with a twin
Basalt from yesterday | Still line drone | edge=.3 tunnel=.1 swell=1 rasp=.3 pressure=.55 steel=.3 glide=.3 farWell=.35 volume=-1 | valley 1.mix=0.25 | deep | Slow low bowing over a hint of its octave below
Boiler fifths | Fifth choir | edge=.25 tunnel=1.6 swell=.08 glide=.15 pressure=.5 damp=.7 rate=2 volume=-5 | fuzz | walk | A low bow with a fifth that comes and goes above it
The crane leans out | Fifth choir | edge=.5 tunnel=.7 swell=.4 glide=.7 glideLaw=Straight bend=.7 leak=.25 rate=.5 volume=-1.5 | sweep | slides | Low slides that lean slowly into their fifth
Bulls across a hedge | Fifth choir | exciter=Thumb edge=.4 tunnel=2 swell=.003 leak=.3 damp=.6 glide=.01 farWell=.6 rate=7 volume=-9.5 | platter | walk | A low pluck that beats between a note and its fifth
Organ under the rails | Fifth choir | edge=.15 tunnel=.8 swell=.2 pressure=.7 leak=.4 wellWidth=.5 glide=.05 rate=.5 farWell=1 volume=-5 | flutes | pedal | A dark pressed low note with a fifth moving in it
Chapel with a big door | Fifth choir | exciter=Mallet edge=.2 tunnel=.6 swell=.03 leak=.2 damp=.3 glide=.01 farWell=1 rate=.3 wander=.05 volume=-9 | monks | pedal | Soft low strokes from which a fifth rises
`,
    },
    {
      id: 'clang-keys',
      name: 'Clang keys',
      category: 'keys',
      rows: `
Smithy with a wide door | Clang keys | edge=.6 leak=.55 damp=.4 pressure=.9 wellWidth=.75 rasp=.75 rate=.5 wander=.1 width=0.2 volume=-4.5 | tile | knock | Hard gritty blows on nearly straight steel
Scaffold poles in frost | Clang keys | edge=.78 pressure=.6 leak=.3 damp=.2 bend=.1 rasp=.2 rate=7 width=1 volume=-3 | lit | knock | Bright ringing blows with little note in them
Dustbin lid in the alley | Clang keys | edge=.22 leak=.75 damp=.8 pressure=1 swell=.003 width=.4 rate=3 | slap | knock | A dull hard clang cut off by the hand
Blacksmith at prayer | Clang keys | edge=.5 pressure=.4 leak=.2 damp=.1 bend=.15 steel=.8 rate=.3 tremble=.5 volume=4.5 | stairs 1.level=0.85 | moons | Rung steel whose note comes up out of the clang
Bolt cutter arpeggio | Clang keys | edge=.7 leak=.9 damp=.6 steel=.7 pressure=.7 swell=.004 bend=.3 width=0.3 volume=0 | middle | ostinato | Very short bright clangs
Marimba of rail ends | Clang keys | bend=.35 concord=1 steel=.4 edge=.35 leak=.5 pressure=.5 wellWidth=.1 tremble=.1 rate=2 | wood | ostinato | Short tuned bars with a hollow octave and a touch of clang
Xylophone in the hangar | Clang keys | bend=.3 concord=1 steel=.5 edge=.65 leak=.6 pressure=.8 swell=.003 tremble=0 width=0.15 | corridor | ostinato | Hard bright bars, quick to die
Vibraphone of sheet tin | Clang keys | bend=.4 concord=1 steel=.35 edge=.5 leak=.15 damp=.5 swell=.03 pressure=.4 tremble=.5 rate=6.5 | chorale | ninths | Tuned bars that ring for as long as the key is down
Glockenspiel for giants | Clang keys | bend=.45 concord=.9 steel=.6 edge=.85 leak=.2 damp=.1 rate=8 | brightplate | drops | High bright bars that go on ringing
Lullaby on a fire escape | Clang keys | bend=.5 concord=1 steel=.4 edge=.2 leak=.35 swell=.08 pressure=.3 rate=.6 tremble=.5 | drips | ninths | Softly struck dark bars tuned to open intervals
Gloved anvil | Clang keys | swell=.15 edge=.5 pressure=.3 leak=.4 rate=2 volume=-0.5 | felt | ninths | Softened blows on shallow steel
Pan scourer at midnight | Clang keys | swell=.4 edge=.5 steel=.8 rasp=.6 pressure=.2 leak=.35 width=.75 rate=.2 tremble=.5 volume=-4 | chamber | tide | Slow brushed blows with a grainy steel edge | pad
Corrugated snow | Clang keys | swell=.25 edge=.3 steel=.9 leak=.3 damp=.2 bend=.2 rate=.15 tremble=.5 volume=-4.5 | darkhall | moons | Muffled strokes on loose shallow steel
Blanketed bells | Clang keys | swell=.1 edge=.15 bend=.45 pressure=.5 leak=.25 damp=.3 rate=.5 | pillow | ninths | Dull dark blows on a half-bent blade
Padlock in a wool sock | Clang keys | swell=.05 edge=.25 leak=.7 damp=.8 steel=.6 pressure=.6 rate=1.2 width=.1 volume=2.5 | pot | ostinato | Short dark knocks with the clang held in
Hacksaw plucked gently | Clang keys | exciter=Thumb edge=.8 leak=.45 damp=.6 pressure=.35 wellWidth=.9 rate=8 volume=-3 | mike | ostinato | A light thumb on plain steel, twangy, short and bright | plucked
Ruler over the desk edge | Clang keys | exciter=Thumb edge=.35 bend=.15 leak=.65 damp=.3 pressure=.9 steel=.5 tremble=.6 rate=8 width=0.35 volume=3 | booth | answer | A thumb snap that quivers eight times a second | plucked
Cheese grater serenade | Clang keys | exciter=Thumb edge=.5 steel=.7 rasp=.9 leak=.4 pressure=.4 concord=.5 rate=9 tremble=.5 wellWidth=.1 volume=0 | chamber | answer | Bright grainy snaps of a thumbnail | plucked
Tongue of an old latch | Clang keys | exciter=Thumb edge=.2 bend=.5 wellWidth=.7 leak=.4 damp=.5 steel=.4 rate=3 width=0.25 volume=-3 | tin | answer | A dull sprung twang with crowded overtones | plucked
Zither without strings | Clang keys | exciter=Thumb edge=.65 bend=.3 concord=1 leak=.2 damp=.1 steel=.6 rate=.4 | sympathy | ninths | Ringing thumbed plates drawn into tune | plucked
Toy forge on the carpet | Clang keys | edge=.7 leak=.7 wellWidth=.9 steel=.6 swell=.006 bend=.2 width=.75 rate=7 volume=2 | little | drops | Small tight clangs
Thimbles down the stairs | Clang keys | edge=.55 leak=.85 damp=.7 pressure=.3 bend=.3 swell=.004 rasp=.1 rate=9 volume=6 | bounce | drops | Tiny light ticks of steel with a pitch in them
Birdcage in a draught | Clang keys | edge=.75 pressure=.25 steel=.8 leak=.3 damp=0 swell=.02 rate=.8 tremble=.6 volume=3.5 | tank | high | Thin glittering taps high up | bell
Biscuit tin music | Clang keys | bend=.4 edge=.4 steel=.5 leak=.5 concord=.7 wellWidth=.05 rate=6 | tin | high | Small plain strokes, half note and half lid
Pins in a glass ashtray | Clang keys | edge=.42 steel=.8 leak=.6 pressure=.15 swell=.003 wellWidth=.6 rate=7.5 width=0.1 volume=3.5 | shells | knock | Light quick taps with a dust of steel on top
Hubcap and bow | Clang keys | exciter=Bow swell=.03 edge=.33 damp=.8 pressure=.6 rasp=.6 rate=6.5 tremble=.15 wander=.8 | room | answer | Short rough bow strokes on almost straight steel | string
Skate lines | Clang keys | exciter=Bow swell=.15 edge=.38 damp=.6 pressure=.3 steel=.6 glide=.08 wander=.1 tremble=.1 volume=-4.5 | longplate | answer | Thin scraped tones with a hiss of plain steel | string
Hinge with an opinion | Clang keys | exciter=Bow swell=.05 edge=.28 damp=.85 bend=.2 glide=.2 glideLaw=Straight wander=.8 rate=3 | spin | knock | Short dark squeaks that slide into pitch | string
Violin of barbed wire | Clang keys | exciter=Bow swell=.08 edge=.38 bend=.3 rasp=.9 pressure=.8 damp=.5 tremble=.4 rate=5.5 wander=.75 | valve | lament | A coarse shaken bow on shallow steel | string
Steel fiddle at a wake | Clang keys | exciter=Bow swell=.04 edge=.45 bend=.4 concord=.8 rasp=.4 damp=.7 steel=.4 width=.3 | shellac | lament | A nasal bowed voice, quick to start and stop | string
Plates hung from a nail | Clang keys | secondWell=Twin tunnel=3 farWell=.5 edge=.5 leak=.35 bend=.25 rate=9 volume=-3 | wide | ninths | Clanging blows that beat between two sides
Old bathhouse gate | Clang keys | secondWell=Twin tunnel=.8 farWell=1 edge=.6 leak=.2 damp=.2 bend=.4 steel=.6 rate=.2 tremble=.5 width=0.85 | cistern | moons | Ringing blows that trade between bends
Forty spoons on a string | Clang keys | secondWell=Twin tunnel=10 farWell=.5 edge=.6 leak=.4 bend=.3 pressure=.4 rate=.6 volume=-1 | glimmer | answer | Bright taps that shiver more than ten times a second
Printing press upstairs | Clang keys | secondWell=Twin tunnel=5 farWell=.4 edge=.3 leak=.7 damp=.8 pressure=.8 wellWidth=.7 rate=2 volume=0 | pulsed | ostinato | Dull hard blows with a flutter in them
Skeleton of a piano | Clang keys | secondWell=Twin tunnel=1.6 farWell=.6 bend=.5 concord=.6 edge=.4 leak=.3 damp=.6 steel=.5 rate=1 | platter | ninths | Half-bent steel keys that beat slowly
Furnace door ajar | Clang keys | secondWell=Octave tunnel=.6 edge=.3 leak=.3 bend=.3 pressure=.8 steel=.7 farWell=.5 rate=.5 volume=4 | cave | sill | Low clanging blows with an octave rolling under them | bell
Buoy made of girders | Clang keys | secondWell=Octave tunnel=1.5 edge=.55 leak=.2 damp=.1 bend=.2 farWell=1 rate=.3 tremble=.6 volume=-4 | surf | sill | Clangs whose lower octave swings back and forth | bell
Temple of spare parts | Clang keys | secondWell=Fifth tunnel=1 edge=.45 leak=.25 bend=.35 concord=.6 steel=.6 farWell=.6 rate=2.5 volume=-6 | gated | moons | Clangs with a fifth moving inside them | bell
Cathedral of oil drums | Clang keys | secondWell=Fifth tunnel=.4 edge=.65 leak=.15 damp=.1 bend=.4 pressure=.5 width=.8 farWell=1 rate=.15 tremble=.6 volume=-4 | cathedral | moons | Long ringing steel from which a fifth grows | bell
Boiler suit and buttons | Clang keys | secondWell=Fifth tunnel=4 edge=.5 leak=.55 damp=.6 bend=.3 farWell=.5 rate=6 volume=-9 | desk | ninths | Short clanged keys with a fluttering fifth
Every hinge rusted | Rosin and rust | exciter=Mallet swell=.01 leak=.4 damp=.4 secondWell=None edge=.25 rate=6 | warm | ninths | Grainy dark blows on a shallow bend
Wreck at low water | Rosin and rust | exciter=Mallet swell=.03 leak=.2 damp=.1 edge=.25 steel=.8 tunnel=.6 farWell=.6 rate=.2 tremble=.5 glideLaw=Straight glide=.4 | undertow | pedal | Low rusty blows that slide, long in dying | bell
Loose nails in the barn | Rosin and rust | exciter=Thumb swell=.003 leak=.6 damp=.7 edge=.5 secondWell=None rate=7 width=0.2 volume=-1 | shells | knock | Rough thumbed knocks
Chains drawn over oak | Rosin and rust | exciter=Mallet swell=.2 leak=.35 edge=.3 steel=1 rasp=1 pressure=.4 farWell=.5 rate=1 width=0.95 | backward | moons | Brushed coarse strokes full of plain steel
Red dust rising | Rosin and rust | exciter=Mallet swell=.005 leak=.8 damp=.6 edge=.45 bend=.3 secondWell=None pressure=.6 rate=2.4 width=0.3 volume=0.5 | crumbs | ostinato | Short grainy knocks
Shipyard across the bay | Clang keys | edge=.5 leak=.25 damp=.2 pressure=.8 bend=.2 secondWell=Octave tunnel=.9 farWell=.6 rate=.4 volume=-4 | shore | knock | Hard blows over a lower octave that comes and goes
Storm mast | Clang keys | edge=.7 leak=.35 swell=.05 bend=.15 rasp=.6 pressure=.6 rate=.7 tremble=.6 wander=1 width=0.15 volume=-2 | breeze | answer | Struck masts of plain steel
A yard dreams of trains | Clang keys | edge=.45 bend=.3 leak=.2 swell=.1 damp=.1 width=.45 secondWell=Fifth tunnel=.6 farWell=.95 rate=.3 volume=-4 | cloud | moons | Soft clangs left to ring, a fifth waking in each
Cutlery in no hurry | Clang keys | edge=.65 bend=.4 leak=.4 pressure=.5 damp=.4 concord=1 wellWidth=.04 rate=8 volume=-8.5 | halftime | drops | Bright tuned knocks with a hollow ring
Shift ends at the works | Clang keys | edge=.55 bend=.35 wellWidth=.4 leak=.5 damp=.3 swell=.02 steel=.6 pressure=1 rate=2.5 volume=0.5 | night | knock | Hard plain steel keys, quick to die
`,
    },
    {
      id: 'still-line',
      name: 'Still line drones',
      category: 'drone',
      rows: `
Nothing on the horizon | Still line drone | edge=.5 tunnel=.05 leak=.12 swell=4 wellWidth=.02 pressure=.2 bend=.9 steel=.1 farWell=1 volume=-2.5 | valley | ground | A dead still hollow line that sinks to its octave very slowly
Plumb line drops | Still line drone | tunnel=.2 pressure=.2 edge=.55 steel=.2 bend=.8 swell=.6 farWell=.6 volume=-0.5 | cistern | tide | Light clear bowing with its octave coming up below
Surveyor's red string | Still line drone | wander=0 rasp=0 edge=.3 farWell=.5 tunnel=.3 swell=.8 damp=.6 | middle | lean | A line with no waver at all, passing down an octave and back
Frozen dike at four | Still line drone | edge=.5 steel=.8 swell=2 tunnel=.08 farWell=.9 leak=.1 pressure=.1 | frost | tide | Thin bowing over shimmering steel and a slow octave
Long shadow of a pole | Still line drone | edge=.05 pressure=.6 tunnel=.2 swell=1.2 bend=.5 steel=0 farWell=.5 volume=0.5 | warm | sill | Dark firm low bowing with an octave under it
A candle in still air | Still line drone | secondWell=None edge=.15 pressure=.05 bend=1 swell=2 rasp=0 leak=.1 volume=1 | hall 1.mix=0.2 | lonely | A single pure note that does not move
Field transformer | Still line drone | secondWell=None edge=.6 pressure=.7 wellWidth=.8 concord=.8 swell=.4 rasp=.2 width=0 glideLaw=Straight | desk | ground | A firm electric hum of crowded tones
Wheel of a sewing room | Still line drone | secondWell=None edge=.4 rasp=.45 pressure=.5 swell=.6 wander=.65 damp=.6 | combo | lean | A grainy middle hum that wavers a little
Hum of the empty school | Still line drone | secondWell=None edge=0 pressure=.35 bend=.7 swell=.7 leak=.35 width=.1 | pillow | cadence | A dull dark hum on a slow cadence
Refrigerator at prayer | Still line drone | secondWell=None edge=.25 pressure=.8 wellWidth=.5 rate=6 tremble=.1 swell=.3 | kitchen | ground | A pressed low hum with the smallest shake in it
Wire drawn through light | Still line drone | secondWell=None edge=.9 pressure=0 concord=1 wellWidth=.1 swell=4.5 bend=.9 volume=-2 | shining | tide | A bright thin line bowed as lightly as it can be
White cloud edge | Still line drone | secondWell=Twin tunnel=.1 edge=.8 pressure=.1 steel=.6 swell=2.4 leak=.15 farWell=.5 width=1 volume=-0.5 | glimmer | stair | Bright lines and shimmering steel in two slow bends
The needle climbs | Still line drone | secondWell=None edge=.7 bend=.6 wellWidth=0 rasp=.05 swell=1 steel=.1 pressure=.15 glideLaw=Straight glide=4 volume=0.5 | notch | lonely | A hollow bright tone that takes four seconds to climb to its pitch
Sky stretched on a frame | Still line drone | secondWell=Fifth tunnel=.08 edge=.85 pressure=.05 swell=3 farWell=.95 wellWidth=.9 volume=-5 | climb | tide | Bright light crowded bowing that leans very slowly to its fifth
Aluminium afternoon | Still line drone | secondWell=None edge=.75 steel=.9 pressure=.4 rasp=.4 swell=1 concord=.6 wander=.75 volume=0.5 | wide | swells | Bright grainy bowing with much plain steel awake in it
Fifth that never closes | Still line drone | secondWell=Fifth tunnel=.06 edge=.4 swell=1.6 pressure=.4 bend=.8 width=.1 farWell=1 glideLaw=Nearest glide=.7 | space | ground | A still line that takes many seconds to find its fifth
Poles along the lane | Still line drone | secondWell=Fifth tunnel=.3 farWell=1 edge=.2 swell=1 width=1 steel=.1 volume=-6 | sidetoside | lean | A dark tone and its fifth, exchanging sides
Abbey with the roof off | Still line drone | secondWell=Fifth tunnel=.3 edge=.6 swell=2 rasp=.3 steel=.5 wander=.7 volume=-2.5 | field | tide | Clear fifths rising slowly out of a held chord
Weather vane at rest | Still line drone | secondWell=Fifth tunnel=1 edge=.3 pressure=.6 swell=.5 leak=.4 damp=.5 farWell=.95 volume=0.5 | steps | deep | A firm low tone in which a fifth comes and goes every two seconds
Barrel and crank | Still line drone | secondWell=Fifth tunnel=.5 edge=.55 rasp=.7 pressure=.75 wander=.65 swell=.3 farWell=.5 volume=-8 | bridge | organum | A rough pressed wheel of a tone with its fifth turning over
Engines all night long | Still line drone | secondWell=Twin tunnel=.7 farWell=.9 edge=.2 pressure=.5 swell=1 volume=-5 | chorale | ground | Dark low twins trading every second or two
Slow beat under the ice | Still line drone | secondWell=Twin tunnel=.2 farWell=.5 edge=.35 bend=.9 swell=2 volume=-5 | shallows | tide | Still tones that beat against their twins at rest
Where two fences cross | Still line drone | secondWell=Twin tunnel=3 farWell=.6 edge=.5 swell=1.2 wellWidth=.4 width=.95 pressure=.65 bend=.55 volume=-5 | comb | lean | Firm lines that beat three or four times a second
Standing wave in a bath | Still line drone | secondWell=Twin tunnel=1.2 farWell=.2 edge=.1 swell=.9 leak=.3 wellWidth=.8 volume=-3 | cistern | deep | A dark crowded tone that dims and returns once a second
Window that hums at dawn | Still line drone | secondWell=Twin tunnel=8 farWell=.3 edge=.6 pressure=.1 swell=2 steel=.3 width=.7 volume=-4 | airy | stair | Light lines split into a quick even shiver
Vent on the north side | Still line drone | exciter=Breath secondWell=None rasp=.8 edge=.35 swell=1 pressure=.3 volume=2.5 | corridor | ground | A steady draught with a note inside it
Bottle on a sea wall | Still line drone | exciter=Breath secondWell=None rasp=.15 edge=.05 pressure=.4 bend=.9 swell=1.6 width=.3 volume=5 | pot | lonely | A round dark blown note held still
Lungs of the lighthouse | Still line drone | exciter=Breath tunnel=.1 rasp=.4 edge=.25 wander=.75 swell=2 farWell=.5 volume=3.5 | lungs | deep | Slow blown low notes that sink to their octave
Pines before the weather | Still line drone | exciter=Breath secondWell=Twin tunnel=.2 rasp=1 edge=.5 wander=.8 steel=.4 swell=1.5 farWell=.5 volume=-12 | breeze | tide | Mostly moving air with two faint bends in it
Organ with the wind on | Still line drone | exciter=Breath secondWell=Fifth tunnel=.15 rasp=.25 edge=.4 wellWidth=.1 swell=.8 farWell=.6 volume=1 | flutes | organum | Blown still tones that find their fifth | organ
Swarm kept in a drawer | Crowded curve | edge=.35 pressure=.5 tremble=0 wander=.15 swell=1 width=.2 | box | ground | A thick close cluster over each low note
Shelf of unpaired bells | Crowded curve | exciter=Mallet leak=.03 damp=0 edge=.5 swell=.5 tremble=0 volume=-8 | farhall | deep | Crowded overtones struck once and left ringing
Traffic heard as a chord | Crowded curve | concord=1 edge=.5 pressure=.3 tremble=0 swell=2 secondWell=Twin tunnel=.1 farWell=.5 glideLaw=Straight glide=1.2 width=0.9 volume=-4 | undertow | tide | Crowded tuned tones that slide off one by one between two bends
Strip light on the third | Crowded curve | edge=.9 pressure=.05 tremble=0 swell=.5 bend=.8 concord=.4 width=.4 wander=0 volume=3.5 | thin | lonely | A bright thin cluster that stays where it is
Wall of old radiators | Crowded curve | exciter=Breath rasp=.3 edge=.45 tremble=0 wander=.8 swell=1.5 volume=1 | reel | stair | Blown clusters building one on another
Rust has its own hour | Rosin and rust | secondWell=None tremble=0 edge=.25 swell=1.5 wander=.9 | cave | ground | A dark slow grind with a pitch inside it
Ship's flank | Rosin and rust | secondWell=Octave tunnel=.15 tremble=0 edge=.2 swell=2 steel=.9 farWell=.5 volume=-13 | stairs | sill | Rough low bowing and loose steel with an octave under it
The millstone starts | Rosin and rust | tremble=.4 rate=.5 edge=.1 pressure=1 swell=1 tunnel=.1 farWell=.5 | iron | deep | Heavy dark bowing, tipped slowly up and down
Headlamp gravel | Rosin and rust | secondWell=Twin tremble=0 edge=.45 rasp=1 pressure=.6 tunnel=.4 swell=.8 farWell=.6 volume=-3.5 | crumbs | lean | A gritty scrape on a shallow bend
Old saw in a cold shed | Rosin and rust | secondWell=None tremble=.1 rate=5 bend=.9 edge=.5 pressure=.5 rasp=.75 concord=1 swell=.6 wellWidth=.05 | shellac | lonely | A grainy hollow tone with the slightest shake
Temple floor after rain | Still line drone | exciter=Mallet leak=.02 damp=0 edge=.3 swell=.2 tunnel=.05 farWell=.5 volume=0.5 | bowls | deep | Single strokes that ring with almost no loss, their octave below
Gong that forgot to stop | Still line drone | exciter=Mallet secondWell=Twin leak=.01 damp=0 edge=.5 bend=1 swell=.5 tunnel=.1 steel=.3 farWell=1 glideLaw=From_one glide=.6 width=1 volume=-8 | cathedral 1.mix=0.28 | tide | Soft strokes that open from one note and ring on between twins
Sand settles | Still line drone | exciter=Thumb secondWell=Twin leak=.04 damp=0 edge=.6 swell=.5 tunnel=.5 rasp=.8 width=.5 farWell=.5 volume=-8 | bowed | stair | Thumbed tones that ring and trade, one on another
Iron lake at evening | Still line drone | exciter=Mallet secondWell=Fifth leak=.03 damp=0 edge=.2 swell=1 tunnel=.2 farWell=1 volume=-8 | ascent | ground | Slow soft blows whose fifth wakes over several seconds
Bowl meets stone | Still line drone | exciter=Mallet secondWell=None leak=.05 damp=0 edge=.65 pressure=.4 wellWidth=.6 steel=.4 swell=.05 bend=.9 volume=-8 | shore | lean | Clear strokes on one deep bend, left alone
Line under a moving sky | Still line drone | secondWell=None edge=.6 pressure=.4 swell=1 bend=.7 wellWidth=.9 concord=.95 glideLaw=Straight glide=1.6 | icefilter | tide | A clear still chord that climbs key by key out of its lowest note
Rails before morning | Still line drone | secondWell=Twin tunnel=.15 edge=.65 rasp=.3 swell=2.5 pressure=.3 farWell=.5 volume=-0.5 | sweep | ground | Bright rails of tone in two slow bends
Marsh wing | Still line drone | secondWell=None edge=.5 wellWidth=.6 swell=1.5 pressure=.25 leak=.2 tremble=.5 rate=.15 volume=0.5 | swirl | lean | A held line with crowded tones above, tipped slowly up and down
Bucketful of night | Still line drone | edge=.45 tunnel=.1 swell=.6 pressure=.15 bend=.95 farWell=.6 glideLaw=From_one glide=.9 volume=-2 | stars | tide | A still bowed chord, slow to leave its lowest note, an octave deep
Chord left on ice | Still line drone | secondWell=Twin tunnel=.2 edge=.45 swell=.8 concord=1 farWell=.5 wellWidth=.02 volume=-9 | frozen | swells | A still hollow bowed pad in two bends
`,
    },
    {
      id: 'fifth-choirs',
      name: 'Fifth choirs',
      category: 'voice',
      rows: `
Noonday stalls | Fifth choir | tunnel=.45 edge=.6 swell=.8 pressure=.4 tremble=.3 rate=5 wellWidth=.85 concord=.9 farWell=.7 | cathedral 1.mix=0.3 | choir | Bright crowded voices with a fifth coming and going above
Clerestory at dawn | Fifth choir | tunnel=.2 edge=.9 swell=1.8 pressure=.05 steel=.1 bend=.8 width=.85 rate=.2 tremble=.5 farWell=1 volume=-5.5 | shining | swells | Very bright light voices that reach slowly for their fifth
Twelve at the screen | Fifth choir | tunnel=.9 edge=.45 swell=.5 pressure=.5 leak=.5 damp=.7 tremble=.2 wander=.1 farWell=.6 rate=6 | room | hymn | Firm voices on a hymn, the fifth swinging every second and a half
White linen procession | Fifth choir | tunnel=.3 edge=.7 swell=1 wellWidth=.02 rasp=.15 wander=.1 farWell=1 tremble=.1 | hall | organum | Steady hollow voices that lean well into the upper bend
Psalm through a grille | Fifth choir | tunnel=.6 edge=.65 rasp=.5 pressure=.6 steel=.5 swell=.3 wander=.75 farWell=.6 rate=6.2 | brightplate | cadence | Pressed voices with a shimmer of plain steel
Cowls in a dark row | Fifth choir | edge=.05 tunnel=.6 pressure=.4 swell=.8 bend=.7 tremble=.15 rate=.3 volume=-1 | monks | cantor | A dark low voice with its fifth glowing in it
Vault under the vault | Fifth choir | edge=.15 tunnel=.12 farWell=1 swell=1.6 leak=.15 damp=.1 rate=.15 tremble=.6 glideLaw=Straight glide=.5 | lowvault | choir | Dark voices that leave their note in turn, and the low tone they make
Novices after the rain | Fifth choir | edge=.2 tunnel=.8 pressure=.15 rate=3.2 tremble=.5 swell=.6 wander=.8 | rain | hymn | Soft dark voices, not quite steady
Bass side of the choir | Fifth choir | edge=.3 tunnel=.9 pressure=.75 swell=.25 wellWidth=.6 bend=.4 leak=.5 farWell=.6 rate=6 wander=.1 | chamber | cantor | A pressed low voice from a half-bent blade
Men around one lamp | Fifth choir | edge=.02 exciter=Breath rasp=.3 tunnel=.6 swell=.4 pressure=.5 rate=2 wander=.75 volume=2.5 | cave | cantor | A dark blown low voice with a fifth folded in
Handbells in fifths | Fifth choir | exciter=Mallet edge=.6 tunnel=1.2 leak=.25 damp=.4 swell=.01 glide=.01 pressure=.5 width=.75 farWell=.6 rate=8 volume=-8 | plate | drops | Clear blows that ring between a note and its fifth | bell
Carillon half asleep | Fifth choir | exciter=Mallet edge=.4 tunnel=.4 leak=.12 damp=.1 swell=.1 glide=.01 rate=.3 tremble=.6 farWell=.6 volume=-8 | stairs | moons | Soft blows from which a fifth and a low tone rise | bell
Iron stars falling | Fifth choir | exciter=Mallet edge=.75 steel=.6 bend=.4 tunnel=2 leak=.35 swell=.005 glide=.01 pressure=.7 rate=7 farWell=.95 volume=-8 | gated | answer | Hard clanging blows with a fifth beating in them | bell
Tubes above the altar | Fifth choir | exciter=Mallet edge=.5 wellWidth=.65 concord=.3 tunnel=.2 leak=.1 damp=0 glide=.01 swell=.02 rate=.2 farWell=1 volume=-8 | valley | pedal | Low tubular strokes, long and a little sour | bell
Beads told in pairs | Fifth choir | exciter=Thumb edge=.4 tunnel=.8 leak=.3 damp=.5 swell=.003 glide=.01 farWell=.6 rate=6 volume=-5 | darkecho | answer | Plucks that swing once between a note and its fifth | plucked
Chest of small pipes | Fifth choir | swell=.04 tunnel=.3 edge=.4 pressure=.3 tremble=0 wander=.1 damp=.8 leak=.5 glide=.02 farWell=.6 | chamber | hymn | Plain still tones that speak at once, with a fifth in them | organ
Quint stop half drawn | Fifth choir | exciter=Breath swell=.06 tunnel=.3 edge=.3 rasp=.3 tremble=0 damp=.8 glide=.02 wellWidth=0 farWell=1 volume=-4 | flutes | hymn | Blown pipes with a hollow fifth | organ
Reed organ on boards | Fifth choir | swell=.1 edge=.65 pressure=.8 rasp=.4 wellWidth=.8 concord=.8 tunnel=.6 damp=.7 tremble=.2 rate=6 glide=.02 farWell=.5 wander=.1 | wood | cadence | Pressed reedy tones, each with a fifth that swells | organ
Reed chest on the beach | Fifth choir | swell=.2 edge=.5 pressure=.6 rate=3 tremble=.35 tunnel=1.5 damp=.6 glide=.02 farWell=.6 | surf | cadence | Reedy tones that sway and turn over once a second | organ
A small organ, locked | Fifth choir | swell=.03 edge=.8 pressure=.1 tunnel=.1 tremble=0 bend=.9 leak=.4 damp=.9 glide=.02 steel=0 width=.3 farWell=1 | box | organum | Bright pipes of steel, shut in, their fifth arriving late | organ
Flutes in open order | Fifth choir | exciter=Breath rasp=.15 edge=.65 tunnel=.5 swell=.3 pressure=.2 wellWidth=.02 rate=6 volume=1 | hall 1.mix=0.22 | duet | Two hollow blown lines, each with a fifth passing through | wind
The north wind climbs | Fifth choir | exciter=Breath rasp=.8 edge=.6 wander=1 tunnel=.3 swell=.4 rate=.5 glideLaw=Straight glide=6 volume=-7 | field | lonely | Gusts that climb a fourth in six seconds, a fifth blowing in and out | wind
Panpipe made of a fence | Fifth choir | exciter=Breath rasp=.6 edge=.2 tunnel=.9 swell=.08 leak=.5 damp=.8 glide=.05 pressure=.6 farWell=.6 wander=.1 bend=.35 volume=6 | tile | sighs | Short dark puffs with a fifth swinging in them | wind
Choir of lampposts | Fifth choir | exciter=Breath rasp=.15 edge=.7 tunnel=.2 swell=1.4 bend=.9 concord=1 rate=.3 wander=.1 glideLaw=From_one glide=.5 volume=1 | choirverb | choir | Blown bright chords that part from one note, smooth, with their fifths
Steam hymn | Fifth choir | exciter=Breath rasp=.9 edge=.8 steel=.4 tunnel=1.4 swell=.4 leak=.6 farWell=.5 rate=2 volume=-3 | pipeverb | cadence | Hissing chords with a fifth turning about once a second under the air
Trill of the weathervane | Fifth choir | tunnel=7 farWell=.6 edge=.5 swell=.5 tremble=0 wellWidth=.75 width=.95 | double | lean | A fast even flutter between a crowded note and its fifth
Telegraph of two bells | Fifth choir | tunnel=4 farWell=.9 edge=.65 pressure=.4 swell=.1 damp=.6 leak=.4 rate=2 | slap | answer | Calls that alternate three times a second with their fifth
Sewing machine madrigal | Fifth choir | tunnel=10 farWell=.5 edge=.3 pressure=.3 swell=.3 bend=.8 rate=9 tremble=.2 wander=.1 volume=1.5 | ensemble | duet | Two voices with a shiver of fifths in them
Waterwheel in fifths | Fifth choir | tunnel=2 farWell=1 edge=.4 swell=.8 width=1 tremble=0 leak=.3 | wide | tide | A chord that turns over more than once a second between two bends
Parchment moth | Fifth choir | exciter=Breath tunnel=5 farWell=.7 rasp=.5 edge=.35 swell=.6 rate=7 wander=.8 volume=-1 | shell | stair | Breath that flickers between notes and fifths
Arms of a candelabrum | Opening from one | secondWell=Fifth tunnel=.4 edge=.5 glide=.7 swell=.8 concord=1 farWell=.6 rate=.3 volume=-6 | hall | tide | One note that opens into a chord of fifths
Fan vault drawn by hand | Opening from one | secondWell=Fifth tunnel=.2 edge=.75 glide=1.3 swell=1.4 pressure=.1 rate=.15 tremble=.6 volume=-6 | climb | swells | Bright lines that part from one note and lean to their fifths
River delta from a plane | Opening from one | secondWell=Fifth tunnel=.8 edge=.2 glide=.5 pressure=.5 swell=.5 bend=.8 rate=1.2 farWell=.5 volume=-5 | water | cadence | Dark chords that spread from a note, fifths moving in them
Lily pads coming apart | Opening from one | secondWell=Fifth exciter=Breath tunnel=.3 edge=.35 rasp=.3 glide=.6 rate=.5 farWell=1 volume=-6 | fog | stair | Blown notes, each leaving the last and finding a fifth
Five throats open | Opening from one | secondWell=Fifth tunnel=1.5 edge=.6 glide=.35 tremble=.6 rate=6 pressure=.5 farWell=.6 volume=-8 | vowel | choir | Shaken voices that part from one note in a second and a half
Choir at two fathoms | Fifth choir | farWell=1 tunnel=.25 edge=.2 swell=1 bend=.95 leak=.1 wellWidth=.05 rate=.2 tremble=.5 | undertow | deep | Low tones with a deeper one that their fifth makes under them | drone
Undercroft at full voice | Fifth choir | farWell=1 tunnel=.6 edge=.5 pressure=.75 swell=.4 damp=.6 bend=.45 rate=6 wander=.15 rasp=.6 | shallows | pedal | Full grainy low voices, a fifth over and a tone under | bass
Ship's company below | Fifth choir | farWell=.9 tunnel=2 edge=.1 pressure=.7 rasp=.5 swell=.3 wander=.7 width=.8 rate=2.5 | reel | cantor | A rough dark low voice that rolls once a second
Earth under the chancel | Fifth choir | farWell=1 tunnel=.2 edge=0 swell=2.2 steel=0 pressure=.3 rate=.2 volume=-12.5 | darkwater | ground | Dark low tones that take five seconds to find their fifth | drone
Foundation stone singing | Fifth choir | farWell=.5 tunnel=.4 edge=.5 steel=.7 pressure=.45 swell=.6 bend=.6 rate=2 volume=-0.5 | cavern | organum | Clear voices with plain steel ringing round them
Choir from another scale | Fifth choir | wellWidth=.7 concord=0 tunnel=.4 edge=.6 swell=.8 bend=.8 rate=6 farWell=.6 volume=3 | swirl | hymn | Crowded untuned overtones over plain chords in fifths
Organ loft bees | Fifth choir | wellWidth=.95 concord=.5 tunnel=.7 edge=.5 pressure=.5 bend=.9 rasp=.4 rate=9 wander=.1 | fuzz | lean | A thick close buzz with a fifth moving inside it
Reed with a split in it | Fifth choir | wellWidth=.5 concord=.1 tunnel=3 edge=.55 rasp=.6 pressure=.7 swell=.3 bend=.3 rate=3 farWell=.6 volume=-0.5 | split | sighs | Rough short-bend sighs that beat against their fifths
Far gate crowding | Fifth choir | wellWidth=.85 concord=.2 exciter=Breath tunnel=.3 rasp=.6 edge=.4 swell=1.2 farWell=1 rate=.4 wander=.8 glideLaw=From_one glide=.4 volume=-12 | farhall | stair | Blown clusters that pass to a fifth and back
Bronze leaf with a bite | Fifth choir | wellWidth=.6 concord=0 exciter=Mallet tunnel=.6 leak=.2 damp=.2 edge=.6 glide=.01 swell=.02 rate=.3 tremble=.6 farWell=.5 volume=-8 | hollow | moons | Struck overtones left in their own places, with a fifth | bell
Pulpit solo | Fifth choir | tremble=.5 rate=5.6 tunnel=.35 edge=.4 glide=.3 glideLaw=Straight swell=.2 wander=.15 | hall 1.mix=0.25 | aria | One shaken voice with a fifth that comes and goes
Cantor and his echo | Fifth choir | tremble=.2 rate=3 tunnel=.6 edge=.55 glide=.15 swell=.12 pressure=.5 damp=.7 width=.45 farWell=.6 volume=-0.5 | canonlow | answer | A firm voice with a moving fifth
Pilgrims on the causeway | Fifth choir | tunnel=.4 edge=.3 swell=.6 leak=.35 pressure=.35 exciter=Breath rasp=.45 glideLaw=Straight glide=.2 | shore | hymn | A plain blown hymn in slow fifths
Votive lights, door open | Fifth choir | tunnel=.3 edge=.6 swell=1 wander=1 pressure=.15 rasp=.4 rate=6.6 | stars | swells | Light unsteady chords in fifths
Choir pressed in wax | Fifth choir | tunnel=.4 edge=.5 swell=.4 pressure=.7 wellWidth=.8 rate=1 tremble=.5 | platter | cadence | Full crowded voices with a slow fifth and a slow sway
`,
    },
    {
      id: 'thumb-plucks',
      name: 'Thumb plucks',
      category: 'plucked',
      rows: `
Tea tray scratches | Thumb plucks | leak=.6 edge=.75 wellWidth=.4 damp=.6 pressure=.6 rasp=.75 wander=.1 width=0.35 | bare | ostinato | Short bright scratchy plucks, close enough to touch
Tongue against tin | Thumb plucks | leak=.75 edge=.3 bend=.12 pressure=.8 damp=.9 steel=.85 | middle | knock | Hard dull plucks with plain steel in them, gone at once
Pocket full of springs | Thumb plucks | leak=.5 edge=.7 wellWidth=.8 concord=.5 steel=.5 pressure=.4 tremble=.3 rate=9 width=0.25 | little | ostinato | Small bright plucks with crowded overtones
Letter opener on a ledge | Thumb plucks | leak=.45 edge=.45 wellWidth=.1 concord=1 bend=.6 steel=.1 wander=0 tremble=.15 rate=2 volume=-0.5 | steps | answer | Plain clear plucks with a hollow octave
Gate latch counting | Thumb plucks | leak=1 edge=.4 pressure=1 rasp=.7 steel=.6 damp=.5 width=0.1 volume=3.5 | tile | knock | The shortest hard snaps, with skin and steel in them
Harp with a steel neck | Thumb plucks | leak=.12 damp=.2 bend=.9 edge=.4 wellWidth=.3 pressure=.3 width=.7 rate=.2 tremble=.3 wander=.7 volume=-1 | plate 1.mix=0.22 | ninths | Deep plucks that ring through one another
Hammock of long wires | Thumb plucks | leak=.06 damp=0 bend=1 edge=.2 steel=0 pressure=.5 tremble=.4 rate=.4 | hall | moons | Dark ringing plucks that are never stopped
Dew along the cable | Thumb plucks | leak=.15 damp=.1 edge=.62 wellWidth=.05 concord=1 pressure=.15 bend=.8 tremble=.3 rate=7.5 wander=.15 volume=3 | brightplate | drops | Light glassy plucks with long hollow rings
Lyre in the boathouse | Thumb plucks | leak=.2 damp=.4 edge=.5 rasp=.5 bend=.7 concord=1 wander=.1 | wood | ninths | Open ringing plucks with skin in the touch
Psaltery for one thumb | Thumb plucks | leak=.18 damp=.3 edge=.6 steel=.7 pressure=.4 bend=.6 tremble=.15 rate=6.5 | sympathy 1.mix=0.25 | ostinato | Bright plucks that wake the plain steel
Pluck in a cold larder | Deep thumb | leak=.25 tunnel=.5 edge=.55 damp=.3 wellWidth=.02 concord=1 pressure=.6 width=0.85 | room | moons | Full hollow plucks whose sound sinks to the octave and comes back
Root cellar lullaby | Deep thumb | leak=.3 tunnel=.3 edge=.05 pressure=.25 swell=.05 damp=.5 farWell=.5 rate=.5 | warm | ninths | Soft dark plucks, an octave gathering under them
Drowned lute | Deep thumb | leak=.2 tunnel=1.2 edge=.5 wellWidth=.6 damp=.4 rasp=.6 pressure=.6 farWell=1 rate=2 | shallows | ostinato | Grainy plucks that swing between two octaves
Small hands, long wires | Deep thumb | leak=.12 tunnel=2.5 farWell=.5 edge=.6 pressure=.6 damp=.2 rate=6.5 | floor | answer | Firm bright plucks with a throb of the octave below
Plucked on the stairs | Deep thumb | leak=.35 tunnel=.15 edge=.4 steel=.6 damp=.5 rasp=.4 pressure=.7 width=.2 farWell=1 rate=3 volume=6 | stairs | pedal | Hard low plucks with steel ringing in them | bass
A thumb at either end | Thumb plucks | secondWell=Twin tunnel=1.5 farWell=.9 leak=.25 damp=.4 edge=.45 width=.9 tremble=.2 rate=1 | wide | ostinato | Plucks that jump to a twin and back
Pear tree strung twice | Thumb plucks | secondWell=Twin tunnel=4 farWell=.6 leak=.3 edge=.55 damp=.5 wander=.1 volume=-10 | chamber | ninths | Plucked doubles that beat four times a second
Mirror in a thicket | Thumb plucks | secondWell=Twin tunnel=.4 farWell=1 leak=.12 damp=.1 edge=.35 tremble=.4 rate=.2 glideLaw=From_one glide=.1 volume=-10 | orbit | moons | Long plucks that cross slowly to the other bend
Cicadas at the fence | Thumb plucks | secondWell=Twin tunnel=11 farWell=.5 leak=.2 edge=.7 pressure=.3 damp=.3 volume=-10.5 | airy | drops | Bright plucks that shiver faster than can be counted
Loose change in a dish | Thumb plucks | secondWell=Twin tunnel=2.2 farWell=.3 leak=.5 steel=.7 edge=.6 wellWidth=.8 volume=-1 | crystal | drops | Short jangling plucks with a beat in them
Razor quill | Thumb plucks | edge=.9 pressure=.7 leak=.3 damp=.6 bend=.85 rasp=.1 wander=.1 width=0.2 | front | ostinato | Very bright hard plucks from a deep clean bend
Harpsichord of shears | Thumb plucks | edge=.9 pressure=.8 leak=.5 damp=1 concord=1 wellWidth=.3 rasp=.1 wander=0 | chamber 1.mix=0.2 | hymn | Very bright hard even plucks, damped by the key
Lightning on a fork | Thumb plucks | edge=.75 pressure=.9 leak=.5 steel=.9 bend=.3 damp=.4 tremble=.5 rate=9 width=0.3 | gated | answer | Sharp snaps full of steel
Guitar left in frost | Thumb plucks | edge=.75 pressure=.2 leak=.2 damp=.3 bend=.8 wellWidth=.5 width=.4 tremble=.2 rate=7 | frost | ninths | Light bright plucks that ring
Nail, wire and daylight | Thumb plucks | edge=.7 pressure=.6 leak=.4 wellWidth=.1 concord=.2 tremble=.3 rate=6.5 width=0.15 | desk | answer | Bright plucks a little out of true, with a quiver
Flesh of the thumb | Thumb plucks | edge=.02 swell=.05 pressure=.3 leak=.4 steel=0 damp=.6 rasp=.6 | mike | ninths | The softest dark plucks, skin on steel
Warm wire in mittens | Thumb plucks | edge=.15 swell=.2 rasp=.8 leak=.3 damp=.4 pressure=.4 tremble=.3 rate=.8 width=0.35 | felt | ostinato | Slow soft touches with a fuzz of skin
Pillow talk in plucks | Thumb plucks | edge=.1 swell=.1 bend=.8 leak=.2 damp=.5 steel=.1 tremble=.6 rate=3 | pillow | answer | Dark rounded plucks with a wobble
Moss over the machine | Thumb plucks | edge=.2 swell=.4 leak=.15 damp=.1 bend=.9 pressure=.5 rate=.3 tremble=.4 | darkhall | tide | Plucks so slow they arrive like breath, then ring | pad
Cat crosses the keys | Thumb plucks | edge=.05 swell=.02 leak=.7 damp=.4 pressure=.5 bend=.6 volume=-1 | shade | drops | Small dull padded notes
Cigar box tongues | Thumb plucks | wellWidth=.9 concord=.2 leak=.3 edge=.5 damp=.2 bend=.7 rate=8 tremble=.3 | tin | drops | Crowded metal tongues, uneven in their overtones
Gourd with nine tines | Thumb plucks | wellWidth=.7 concord=.6 leak=.45 edge=.3 damp=.4 rasp=.5 pressure=.6 | shells | ostinato | Plucked tines over a dry shell
Rake left on the lawn | Thumb plucks | wellWidth=1 concord=0 leak=.6 edge=.6 steel=.6 bend=.9 width=.5 volume=.5 | short | answer | Clustered plucks that clash and stop
Combs of seven sizes | Thumb plucks | wellWidth=.8 concord=0 leak=.2 edge=.4 damp=.2 bend=1 swell=.01 tremble=.4 rate=.3 volume=0 | comb | moons | Deep crowded plucks with overtones of their own
Jaw of a steel fish | Thumb plucks | wellWidth=.6 concord=.3 leak=.35 edge=.6 tremble=.8 rate=3.5 damp=.5 width=0.25 | round | knock | Twanging plucks pulled about by the knee
Plucked in open fifths | Thumb plucks | secondWell=Fifth tunnel=.6 leak=.2 damp=.3 edge=.45 concord=1 farWell=.6 tremble=.2 rate=3 | hall 1.mix=0.22 | ninths | Plucks from which a fifth and a low tone come up
Quartet of clotheslines | Thumb plucks | secondWell=Fifth tunnel=2 leak=.35 edge=.6 damp=.6 pressure=.6 farWell=1 | cassette | ostinato | Firm plucks that rock between a note and its fifth
Ladder leaning on a bell | Thumb plucks | secondWell=Fifth tunnel=.25 leak=.1 damp=.1 edge=.3 bend=.9 farWell=1 tremble=.3 rate=.15 width=0.95 | fifthclimb | moons | Slow ringing plucks, the fifth arriving after the note
Shepherd's other string | Thumb plucks | secondWell=Fifth tunnel=5 farWell=.5 leak=.4 edge=.5 rasp=.5 | bridge | ninths | Fluttering plucks of a note and its fifth
Orchard wire at sundown | Thumb plucks | secondWell=Fifth tunnel=1 leak=.5 edge=.2 swell=.02 damp=.5 steel=0 farWell=.5 volume=2 | summer | drops | Dark short plucks with a fifth turning over
Coat hanger wah | Thumb plucks | tremble=1 rate=2.2 leak=.2 damp=.3 edge=.5 bend=.8 width=0.1 | spin | answer | Plucks bent and opened twice a second by the knee
Quiver in the arrow | Thumb plucks | tremble=.7 rate=8.5 leak=.25 edge=.6 pressure=.5 damp=.3 width=.75 | slap | drops | Plucks that quiver fast and then come to rest
Slow nod of a bough | Thumb plucks | tremble=.9 rate=.7 leak=.1 damp=.1 edge=.3 wellWidth=.4 wander=.1 glideLaw=Straight glide=.2 | swirl | ninths | Long plucks that tip slowly off their pitch and back
Slide from the next fret | Thumb plucks | glide=.3 glideLaw=Straight leak=.2 damp=.4 edge=.5 tremble=.3 rate=6 wellWidth=.08 | amptrem | aria | Hollow plucks that slide to each note from the last
Nerves before the dance | Thumb plucks | tremble=.5 rate=6.5 wander=1 leak=.4 edge=.4 rasp=.6 steel=.5 width=0.2 volume=0 | pulsed | ostinato | Jittery plucks with loose steel in them
Pebbles and their rings | Thumb plucks | leak=.3 edge=.45 damp=.4 bend=.7 secondWell=Octave tunnel=2 farWell=.6 | stone | drops | Plucks with the octave below bobbing under them
Counting sheep in tin | Thumb plucks | leak=.4 edge=.25 damp=.6 wellWidth=.85 pressure=.4 rasp=.75 bend=.85 | warmecho | knock | Dull crowded plucks with skin in them
Swallows leave in pairs | Thumb plucks | leak=.25 edge=.65 damp=.3 secondWell=Twin tunnel=.8 farWell=.5 | stars | drops | Bright plucks that change bends as they ring
Loom with a loose thread | Thumb plucks | leak=.45 edge=.5 damp=.5 rasp=.6 concord=1 tremble=.4 rate=7 wellWidth=.08 volume=-1.5 | loop | ostinato | Even grainy plucks with a hollow octave over them
Ice over the wires | Thumb plucks | leak=.15 edge=.35 damp=.1 bend=1 wellWidth=.2 tremble=.5 rate=.3 | darkwater | moons | Deep clear plucks
`,
    },
    {
      id: 'breath-on-steel',
      name: 'Breath on steel',
      category: 'wind',
      rows: `
Flute cut from steel | Breath on steel | secondWell=None rasp=.25 edge=.35 bend=.8 swell=.12 glide=.08 steel=.1 width=.3 rate=6 wander=.1 volume=4 | room | aria | A clear blown line with a little air round it
Shepherd at the pass | Breath on steel | secondWell=None rasp=.45 edge=.5 tremble=.4 rate=6 swell=.2 glide=.2 wander=.15 wellWidth=.02 volume=5 | valley | sighs | Hollow blown calls with a light shake
Furnace piper | Breath on steel | secondWell=None rasp=.35 edge=.2 pressure=.7 swell=.15 glide=.12 concord=1 steel=0 rate=3.4 wander=.15 volume=-4.5 | valve | lament | A warm low-lit flute, blown hard
One finger of daylight | Breath on steel | secondWell=None rasp=.15 edge=.6 bend=1 swell=.35 leak=.15 wellWidth=.2 glide=.05 wander=.1 tremble=.1 volume=6 | shining | answer | A clean bright blown tone
Reed cutter's whistle | Breath on steel | secondWell=None rasp=.6 edge=.5 pressure=.5 swell=.06 leak=.6 damp=.8 glide=.03 wellWidth=.9 concord=.6 bend=.8 rate=7 volume=4 | tile | answer | Quick breathy nasal calls, stopped short
Across the well mouth | Breath on steel | secondWell=None rasp=.4 edge=.02 pressure=.6 swell=.4 bend=.6 wellWidth=.1 steel=0 rate=1 wander=.7 volume=2 | cistern | cantor | A dark low tone with wind at its mouth
Foggy drain pipe | Breath on steel | secondWell=None rasp=.7 edge=.1 pressure=.4 swell=.7 bend=.4 leak=.5 rate=.6 wander=.8 volume=2.5 | fog | cantor | A dull breathy low tone
Bassoon of cold iron | Breath on steel | secondWell=None rasp=.2 edge=.3 pressure=.85 wellWidth=.7 swell=.08 glide=.03 damp=.8 wander=.1 rate=6 volume=2.5 | chamber | cantor | A reedy firm low tone with crowded overtones
Gale down the chimney | Breath on steel | rasp=.6 edge=.15 wander=1 tunnel=.4 swell=.4 steel=.3 bend=.6 farWell=.5 rate=.3 volume=-2 | cave | cantor | A dark blown line that comes and goes in gusts
Great recorder, rusted | Breath on steel | secondWell=None rasp=.25 edge=.45 pressure=.35 bend=.95 swell=.2 leak=.2 wellWidth=.3 width=.8 wander=0 tremble=.1 volume=6 | shell | cantor | A clear low blown tone with an even breath
Tube whisper | Breath on steel | secondWell=None rasp=1 edge=.5 pressure=.15 swell=.3 steel=0 bend=.5 wellWidth=.85 rate=7 volume=0.5 | mike | duet | Nearly all air, two notes just audible inside it
Secret through a keyhole | Breath on steel | secondWell=None rasp=.9 edge=.5 pressure=.05 swell=.2 leak=.6 damp=.8 steel=.2 wander=1 rate=8 volume=2.5 | thin | sighs | Thin bright air with a trace of pitch
Drapes drawn by a draft | Breath on steel | rasp=.95 edge=.3 swell=1.2 tunnel=.4 wander=.8 steel=.1 farWell=.5 rate=.2 tremble=.5 glideLaw=Straight glide=.9 volume=-6 | lungs | tide | Soft air in which the notes of a chord slide off one by one | pad
Asleep by the shore | Breath on steel | rasp=.8 edge=.15 swell=1.6 wander=1 tunnel=.15 leak=.5 farWell=.5 rate=.3 tremble=.6 | surf | lean | Dark gusting air and two notes | texture
Page turned in church | Breath on steel | secondWell=None rasp=.85 edge=.6 swell=.02 leak=.8 damp=.9 steel=.7 pressure=.5 wander=.1 volume=-2.5 | cathedral 1.mix=0.3 | answer | Short puffs of air with a flick of steel
Ocarina of folded tin | Breath on steel | secondWell=None rasp=.3 edge=.15 pressure=.5 swell=.04 leak=.5 damp=.8 glide=.02 bend=.6 tremble=.1 wellWidth=.02 volume=2 | pot | ostinato | Small round hollow puffs, softly spoken
Row of tuned bottles | Breath on steel | secondWell=None rasp=.8 edge=.05 swell=.03 pressure=.4 leak=.6 damp=.7 glide=.01 concord=1 bend=.3 volume=-2.5 | short | hymn | Dull short blown chords, half of them air
Penny whistle on a roof | Breath on steel | secondWell=None rasp=.2 edge=.5 pressure=.3 swell=.02 damp=1 glide=.02 bend=.9 steel=.1 wander=.1 rate=6.5 wellWidth=.1 volume=6 | slap | high | High quick clear whistles, let go at once
Kettle that knows a tune | Breath on steel | secondWell=None rasp=.55 edge=.55 swell=.1 glide=.35 glideLaw=Straight tremble=.5 rate=6.5 width=.45 wander=.1 volume=0 | tin | answer | Shaken whistles that slide between notes
Small pipes at the inn | Breath on steel | secondWell=None rasp=.2 edge=.65 pressure=.6 wellWidth=.9 concord=.7 swell=.02 damp=.6 glide=.02 tremble=.05 wander=0 volume=1 | wood | organum | Nasal crowded pipes over a held one
Iron tree owl | Breath on steel | secondWell=None wellWidth=0 edge=.25 rasp=.3 pressure=.4 swell=.15 glide=.25 bend=.7 rate=3 volume=6 | stairs | sighs | Hollow hoots that ease into pitch
Whistle for a lost dog | Breath on steel | secondWell=None wellWidth=.02 edge=.55 rasp=.15 swell=.06 glide=.5 glideLaw=Straight bend=.9 pressure=.55 rate=7 wander=.1 volume=6 | field | answer | A firm hollow whistle with long slides
Moon through a colander | Breath on steel | secondWell=Twin wellWidth=.05 tunnel=.8 edge=.5 rasp=.35 swell=.6 concord=1 farWell=.5 rate=.5 volume=-1.5 | glimmer | swells | Hollow blown notes trading between bends once a second | pad
Overtones off a ridge | Breath on steel | secondWell=None wellWidth=.1 edge=.6 wander=.9 rasp=.25 swell=.5 bend=1 pressure=.4 rate=.2 tremble=.5 glideLaw=Straight glide=3 volume=1 | whistle | lonely | A slow climb of three seconds, jumping from overtone to overtone
Stair rods in the wind | Breath on steel | wellWidth=.15 edge=.6 steel=.9 rasp=.5 wander=.6 tunnel=.3 swell=.4 leak=.3 farWell=.5 rate=.8 | cavern | stair | Hollow gusts over ringing plain steel
Gutter reeds | Breath on steel | secondWell=None wellWidth=.85 concord=.1 rasp=.5 edge=.45 pressure=.6 swell=.2 rate=6.2 wander=.7 volume=-4.5 | bridge | lament | A sour crowded reed, half air
Goose on the ice | Breath on steel | secondWell=None wellWidth=.7 concord=.4 pressure=.9 edge=.5 rasp=.3 swell=.03 damp=.7 glide=.1 wander=.1 rate=7 volume=3 | corridor | answer | Hard reedy calls
Regiment of hair combs | Breath on steel | secondWell=None wellWidth=1 concord=.6 pressure=.7 edge=.35 rasp=.2 swell=.05 damp=.6 width=.95 tremble=.1 wander=.15 volume=-0.5 | fuzz | hymn | A buzzing close chord of crowded tones
Coat over an accordion | Breath on steel | secondWell=Twin tunnel=3 farWell=.5 wellWidth=.6 rasp=.25 edge=.3 pressure=.6 swell=.1 damp=.6 wander=.1 rate=6 volume=0.5 | cassette | cadence | Close reeds that beat three times a second | organ
Marsh birds, first light | Breath on steel | secondWell=None wellWidth=.8 concord=0 edge=.33 rasp=.45 swell=.06 tremble=.7 rate=7 glide=.3 volume=6 | rain | drops | Quick shaken reedy cries
Both sides of the wind | Breath on steel | secondWell=Twin tunnel=.25 farWell=1 rasp=.4 edge=.4 swell=.8 width=.85 rate=.2 tremble=.4 volume=2.5 | wide | lean | Blown tones that cross slowly from left to right
Sail that fills twice | Breath on steel | secondWell=Twin tunnel=.6 farWell=0 rasp=.5 edge=.5 swell=.6 wander=.5 wellWidth=.85 concord=.5 rate=.4 volume=-2 | water | swells | Crowded blown chords that empty and fill again | pad
Louvre flutter | Breath on steel | secondWell=Twin tunnel=7 farWell=.5 rasp=.6 edge=.65 swell=.3 pressure=.5 wellWidth=.02 rate=2.5 volume=-2 | airy | organum | Breathy hollow tones shivering between two bends
Haunted bellows | Breath on steel | secondWell=Twin tunnel=1.4 farWell=.5 rasp=.3 edge=.1 pressure=.5 swell=.5 bend=.9 steel=0 rate=.5 glideLaw=From_one glide=.35 volume=1.5 | deepsea | cadence | Dark blown chords that part from one note with a slow beat | pad
Breathed lantern glass | Breath on steel | secondWell=Twin tunnel=.15 rasp=.2 edge=.8 swell=1 pressure=.2 concord=1 leak=.2 farWell=1 rate=7 tremble=.15 volume=-5 | longplate | tide | Bright glassy wind in two slow bends | pad
Horn over the estuary | Breath on steel | secondWell=Fifth tunnel=.4 rasp=.2 edge=.4 pressure=.7 swell=.25 bend=.8 farWell=.6 wander=.15 volume=5 | hall | cantor | A full blown horn with a fifth moving in it
Fife over a held note | Breath on steel | secondWell=Fifth tunnel=.2 rasp=.4 edge=.65 swell=.15 glide=.05 pressure=.4 width=.7 farWell=1 rate=6 volume=-2 | shore | organum | Thin pipes that find their fifth over a held note
Foghorn gone soft | Breath on steel | secondWell=Octave tunnel=.3 rasp=.35 edge=.1 pressure=.8 swell=.4 farWell=.9 rate=.4 volume=3.5 | undertow | sill | Dark blown low notes that fall to their octave | bass
Wind under the floor | Breath on steel | secondWell=Octave tunnel=.15 rasp=.7 edge=.25 swell=.6 wander=.7 steel=.4 farWell=.5 rate=.2 tremble=.5 volume=-4 | lowvault | sill | Breathy low tones with an octave moving under them | drone
Pipes of the paper mill | Breath on steel | secondWell=Fifth tunnel=1.5 rasp=.7 edge=.55 pressure=.5 swell=.1 damp=.7 farWell=.5 bend=.4 rate=3 volume=-0.5 | pipeverb | ostinato | Puffed fifths that turn over about once a second
Scaffold gale | Breath on steel | wander=1 edge=.42 steel=1 rasp=.7 bend=.2 swell=.8 tunnel=.5 concord=0 farWell=.5 rate=.4 tremble=.6 | cave | lonely | Strong gusts through loose steel, the pitch half lost | texture
Breeze on a drying line | Breath on steel | secondWell=None wander=.9 edge=.45 steel=.3 rasp=.5 bend=.9 swell=1 pressure=.1 rate=1.5 volume=-4 | breeze | stair | Light gusts that touch one note and another | texture
Sandblown hull | Breath on steel | wander=.7 edge=.4 steel=.6 rasp=1 bend=.3 swell=.5 leak=.6 farWell=.5 rate=.3 volume=-7 | hiss | lonely | Dry gusts with a note under the grain | texture
Moor with a wire fence | Breath on steel | wander=1 edge=.2 steel=.6 rasp=.8 bend=.4 swell=1.4 tunnel=.1 secondWell=Octave farWell=.6 rate=.15 tremble=.6 volume=-5.5 | field | ground | Dark gusting wind and a low hum of wire | texture
Door that never shuts | Breath on steel | secondWell=None wander=.8 tremble=.6 rate=.8 rasp=.6 edge=.5 swell=.5 wellWidth=.4 volume=-7 | gated | lean | Wind that leans on its note once a second | texture
Unopened air mail | Breath on steel | rasp=.4 edge=.5 swell=.7 tunnel=.5 pressure=.3 width=.8 secondWell=Fifth farWell=.6 rate=.3 volume=2.5 | night | swells | Soft blown chords with a fifth waking in them | pad
Breath kept in a jar | Breath on steel | secondWell=None rasp=.45 edge=.35 swell=.5 bend=.8 glideLaw=Straight glide=.4 wander=.15 volume=2.5 | frozen | duet | Two blown lines that slide into each other
Cloud over the aerodrome | Breath on steel | rasp=.3 edge=.65 swell=1 tunnel=.2 bend=.9 farWell=.6 glideLaw=From_one glide=.4 rate=.5 width=0.9 | cloud | stair | Clear blown notes, each leaving the last | pad
Sigh from the lift shaft | Breath on steel | secondWell=None rasp=.7 edge=.28 glide=.8 glideLaw=Straight swell=.3 wander=.9 volume=-3 | backward | sighs | Breathy sighs that slide
Smoke signals | Breath on steel | secondWell=None rasp=.5 edge=.3 swell=.08 damp=.7 leak=.5 glide=.05 rate=3 volume=4.5 | answer | answer | Soft puffed calls
`,
    },
    {
      id: 'wavering-bells',
      name: 'Wavering bells',
      category: 'bell',
      rows: `
Shiver of the tram wire | Wavering bells | tunnel=6 edge=.45 pressure=.6 leak=.3 wellWidth=.3 concord=1 rate=8 steel=.05 bend=.5 volume=-4.5 | chamber | answer | Clear tuned blows that shiver seven times a second
Cold spoon in the spine | Wavering bells | tunnel=12 farWell=.6 edge=.55 leak=.2 swell=.01 bend=1 rate=9 tremble=.15 wellWidth=.5 | plate 1.mix=0.25 | moons | A strike split so fast that it buzzes softly
Glass lift going up | Wavering bells | tunnel=8 edge=.5 leak=.12 pressure=.2 wellWidth=.3 concord=.8 rate=.3 tremble=.5 | shining | ninths | Light strokes with a quick even shake
Fountain teeth | Wavering bells | tunnel=7 edge=.65 steel=.6 leak=.5 damp=.3 pressure=.6 rate=9 | lit | ostinato | Short brilliant strokes full of steel and shiver
Hail on the bandstand | Wavering bells | tunnel=9 farWell=.8 edge=.35 leak=.4 damp=.4 swell=.012 pressure=.5 width=.65 rate=7 wander=.1 volume=-5.5 | wide | answer | Quick dry strokes shaking from side to side
Bell ropes tied in pairs | Wavering bells | tunnel=.8 farWell=.8 edge=.35 leak=.2 steel=.1 concord=.9 wellWidth=.3 rate=.5 tremble=.5 | hall 1.mix=0.25 | moons | Bells that swing once a second between two bends
Slow handshake of bells | Wavering bells | tunnel=.5 farWell=.9 edge=.65 leak=.12 pressure=.4 wellWidth=.75 concord=.6 rate=.3 width=1 volume=-13.5 | longplate | moons | Bright crowded strokes whose ring goes over and comes back in two seconds
Towers facing each other | Wavering bells | tunnel=.25 farWell=1 edge=.4 leak=.08 width=1 bend=1 swell=.05 rate=.15 tremble=.5 | valley | answer | Long bells heard first on one side and then on the other
Worn gear of the clock | Wavering bells | tunnel=2 farWell=.4 edge=.3 leak=.4 damp=.4 rasp=.5 rate=2 | cassette | knock | Middling dull bells with a limp twice a second
Wake of a small bell | Wavering bells | tunnel=.8 farWell=0 edge=.55 leak=.15 rate=1 | orbit | drops | Strokes that fade, return and fade, the twin unheard
Chime over a shop door | Wavering bells | secondWell=None edge=.8 leak=.35 damp=.1 pressure=.4 swell=.006 wellWidth=.2 rate=7 volume=-1 | room | high | Small bright chimes from a single bend
Ankle bells | Wavering bells | tunnel=5 edge=.5 leak=.7 damp=.3 steel=.8 swell=.003 pressure=.3 rate=9 tremble=.5 volume=1 | shells | drops | Tiny dry jingles
Star on the spire | Wavering bells | tunnel=3 farWell=.5 edge=.33 leak=.1 wellWidth=0 concord=1 pressure=.2 rate=.8 volume=-4.5 | brightplate | high | High hollow bells beating four or five times a second
Sleigh in a far valley | Wavering bells | tunnel=6 farWell=.7 edge=.3 leak=.45 steel=.5 width=.4 rate=8 tremble=.6 volume=-3.5 | field | drops | Shaking little bells
Crystal set fading | Wavering bells | tunnel=1.5 farWell=.6 edge=.45 leak=.25 pressure=.6 concord=.6 rate=2.5 | kitchen | answer | Hard little bells that beat
Great bell of the river | Wavering bells | secondWell=Octave tunnel=.6 edge=.65 leak=.1 pressure=.6 concord=.8 wellWidth=.3 farWell=.7 rate=.3 tremble=.5 volume=-3 | undertow | sill | Low bells with an octave swinging beneath them
Bourdon of the old dam | Wavering bells | secondWell=Octave tunnel=.2 edge=.2 leak=.06 pressure=.75 swell=.04 steel=.6 farWell=.6 rate=.15 tremble=.4 volume=-3 | cathedral | deep | A heavy low bell that sinks slowly to its octave
Sunk bell at slack tide | Wavering bells | secondWell=Octave tunnel=1.5 edge=.15 leak=.2 damp=.2 bend=.6 rate=.4 volume=0.5 | shallows | sill | Dark low bells that throb against their octave
Iron pot on the green | Wavering bells | secondWell=Octave tunnel=3 farWell=.6 edge=.28 leak=.45 damp=.4 pressure=.7 bend=.5 rate=7 | gated | knock | Hard dull bells with a flutter of the octave
Mooring ring at night | Wavering bells | edge=.6 tunnel=.4 leak=.25 wellWidth=.5 concord=.1 pressure=.6 rate=.6 volume=-4.5 | stairs | pedal | Low bells with overtones of their own
Cracked but still hung | Wavering bells | concord=0 wellWidth=.6 tunnel=2.5 edge=.6 rasp=.8 leak=.3 damp=.2 rate=6 | shellac | moons | Sour grainy bells that beat unevenly
Foundry scrap | Wavering bells | concord=0 wellWidth=.8 edge=.7 steel=.9 bend=.4 leak=.35 pressure=.7 rate=.4 tremble=.6 width=0.85 volume=-5.5 | cavern | moons | Clustered clanging bells
Plate with odd screws | Crowded curve | exciter=Mallet secondWell=Twin tunnel=4 edge=.7 leak=.25 damp=.1 swell=.01 width=.5 rate=3 glide=.01 volume=-12 | desk | drops | Crowded bright overtones that flutter as they ring
Alarm bell under glass | Wavering bells | concord=.1 wellWidth=.9 tunnel=10 edge=.65 pressure=.8 leak=.4 damp=.4 rate=9 wander=.1 | pane | ostinato | Close jarring bells, shaken fast
Bells from a bent rail | Wavering bells | concord=0 wellWidth=.3 tunnel=.7 edge=.45 leak=.15 bend=.7 tremble=.4 rate=3 wander=.1 width=0.95 | bent | moons | Untuned bells that sway three times a second
Glass tuned with water | Wavering bells | concord=1 wellWidth=.1 edge=.4 tunnel=1.5 pressure=.2 leak=.12 steel=0 rate=.2 tremble=.5 volume=-5.5 | glimmer | moons | Clear tuned bells with a slow beat and no clang
Plain bells for a fast | Wavering bells | concord=1 secondWell=None edge=.3 leak=.25 damp=.5 tremble=0 steel=.05 swell=.03 volume=-3.5 | steps | hymn | Plain tuned strokes with nothing moving in them
Bells ironed flat | Wavering bells | concord=1 wellWidth=.4 edge=.55 tunnel=.15 farWell=.6 leak=.2 tremble=0 | combo | ninths | Tuned bells that hand over once and slowly
Carol by lantern | Wavering bells | concord=1 wellWidth=.2 edge=.65 tunnel=4 farWell=.4 leak=.18 damp=.3 rate=6.5 | sparks | hymn | Tuned chords with a quick soft shimmer
Dial of a summer clock | Wavering bells | concord=1 edge=.5 tunnel=.9 leak=.3 damp=.4 pressure=.6 bend=.8 rate=.5 | summer | ostinato | Firm tuned strokes that swing once a second
Bells under fresh snow | Wavering bells | swell=.3 edge=.3 tunnel=2 leak=.12 pressure=.2 steel=0 wellWidth=.65 concord=.8 rate=.3 width=0.9 volume=-5.5 | darkhall | moons | Muffled crowded strokes that beat twice a second as they ring
Veil over the carillon | Wavering bells | swell=.8 edge=.6 tunnel=5 leak=.08 bend=1 width=.9 rate=7 volume=-5 | bowed | swells | Slow blows opening into a fast shiver | pad
Chime two rooms away | Wavering bells | swell=.15 edge=.15 tunnel=1 leak=.25 damp=.2 rate=2 | pillow | answer | Dull soft bells trading once a second
Breath before the bell | Wavering bells | swell=1.5 edge=.7 tunnel=.6 leak=.1 pressure=.3 concord=1 wellWidth=.85 rate=.2 tremble=.6 width=1 volume=-2.5 | rising | tide | Very slow blows that swell into bright crowded ringing | pad
Bell rope in soft hands | Wavering bells | swell=.06 edge=.4 rasp=.6 tunnel=.35 leak=.2 damp=.15 pressure=.15 rate=.4 tremble=.5 volume=-4 | warmecho | moons | Gentle felted strokes passing slowly to a twin
Stone bridge fifths | Wavering bells | secondWell=Fifth tunnel=1.2 edge=.5 leak=.15 concord=1 wellWidth=.3 farWell=.7 rate=.6 volume=-9.5 | cathedral 1.mix=0.28 | moons | Bells that swing between a note and its fifth
Chapel clock hammers | Wavering bells | secondWell=Fifth tunnel=6 farWell=.5 edge=.65 leak=.3 damp=.2 rate=8 volume=-5 | springs | answer | Bright strokes in which a fifth flutters
Angelus for ironmongers | Wavering bells | secondWell=Fifth tunnel=.5 edge=.35 leak=.1 pressure=.6 wellWidth=.4 farWell=.7 rate=.2 volume=-9.5 | monks | pedal | Low firm bells whose fifth comes after them
Quarter past the fifth | Wavering bells | secondWell=Fifth tunnel=3 edge=.8 steel=.5 leak=.25 pressure=.7 concord=.3 rate=6 volume=-0.5 | tank | drops | Hard bright bells and a fast beat with the fifth
Bells at a small wedding | Wavering bells | secondWell=Fifth tunnel=.7 edge=.6 leak=.2 damp=.3 swell=.05 bend=.8 rate=1 farWell=.6 width=0.85 volume=-4 | double | hymn | Softly struck chords in which fifths come and go
Cold hands on wet glass | Shivering steel | edge=.5 tunnel=5 swell=1 leak=.2 pressure=.4 width=.7 wander=.15 bend=.9 wellWidth=.02 volume=1.5 | plate | lean | Hollow bowed tones shivering six times a second | pad
Rim and finger | Shivering steel | tunnel=3 farWell=.6 edge=.3 swell=.6 concord=1 wellWidth=.2 steel=.2 tremble=.2 rate=.3 volume=1.5 | wide | duet | Bowed bells of steel that beat like two glasses | string
Aurora over tin roofs | Shivering steel | tunnel=12 edge=.8 steel=.9 swell=5 wander=.9 pressure=.15 glideLaw=From_one glide=.6 width=0.95 volume=-9.5 | blooming | tide | A chord that spreads from one note, all plain steel and bowed shiver | pad
Barn bells, bowed | Shivering steel | tunnel=2 farWell=.8 edge=.55 swell=.2 pressure=.5 rasp=.5 damp=.6 wander=.1 | wood | answer | Grainy bowed tones that beat twice a second | string
Ice floes meeting | Shivering steel | exciter=Mallet tunnel=8 edge=.6 leak=.08 damp=.1 swell=.1 pressure=.3 wellWidth=.6 rate=.2 tremble=.4 volume=-9 | frost | swells | Crowded struck tones with a long cold shiver
Bells on a moving train | Wavering bells | tunnel=3 edge=.5 leak=.3 damp=.3 tremble=.6 rate=5 | chorale | ostinato | Strokes with a beat and a shake at once
Thumbed bells of a toy | Wavering bells | exciter=Thumb tunnel=4 edge=.2 leak=.25 damp=.3 swell=.003 rate=9 volume=-6 | little | answer | Plucked little bells that flutter
Evensong on both bends | Two bends | exciter=Mallet tunnel=1.6 leak=.2 damp=.1 swell=.03 glide=.01 wellWidth=.8 concord=.95 rate=.5 farWell=1 volume=-10 | choirverb | moons | Crowded tuned strokes traded twice a second
Clock tower lost in fog | Two bends | exciter=Mallet secondWell=Twin tunnel=.4 edge=.25 leak=.12 swell=.1 glide=.01 pressure=.6 rate=.15 farWell=.6 volume=-10 | shore | pedal | Dark firm strokes, slow to change bends
Echo of a bicycle bell | Two bends | exciter=Thumb tunnel=9 farWell=.6 edge=.45 leak=.3 swell=.003 glide=.01 wellWidth=.1 bend=.9 width=.75 rate=7 | bounce | answer | Flutters of plucked steel with a hollow ring
`,
    },
  ],
}
