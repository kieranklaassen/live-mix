import { type InstrumentSet } from './set'

// Ten directions, one for each thing the throat is played as, and ten corners in
// each: a count under the voice, a mouth, a way to begin and end, a register. The
// five of a corner differ in what they are and in the room they stand in.

export const SET: InstrumentSet = {
  device: 'undervoice',
  names: { division: ['One', 'Two', 'Three', 'Four', 'Eight', 'Drips', 'Shared'] },
  chains: {
    bare: { effects: [{ deviceId: 'ambient-eq', preset: 'Voice' }], words: ', close and dry' },
    warm: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Warm' },
        { deviceId: 'spread', preset: 'Soft tilt' },
      ],
      words: ', warm and close',
    },
    booth: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Small booth' }],
      words: ', in a small padded booth',
    },
    chamber: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber' }],
      words: ', in a tight chamber',
    },
    deck: {
      effects: [{ deviceId: 'tape', preset: 'Mastering deck', params: { hiss: 0 } }],
      words: ', on a clean tape deck',
    },
    wood: {
      effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.45 } }],
      words: ', inside a wooden box',
    },
    dead: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.2 } }],
      words: ', in a small dead room',
    },
    centre: {
      effects: [
        { deviceId: 'analog-drive', preset: 'First hint' },
        { deviceId: 'spread', preset: 'To the middle' },
      ],
      words: ', all in the middle',
    },
    hollow: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Hollow' },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: ', scooped out in the middle',
    },
    valve: {
      effects: [{ deviceId: 'analog-drive', preset: 'Triode glow' }],
      words: ', through a glowing valve',
    },
    double: {
      effects: [{ deviceId: 'stereo-detune', preset: 'Doubled' }],
      words: ', doubled on both sides',
    },
    felt: {
      effects: [{ deviceId: 'sift', preset: 'Felt and air' }],
      words: ', with its attacks felted',
    },
    even: {
      effects: [
        { deviceId: 'tamer', preset: 'Even' },
        { deviceId: 'ambient-eq', preset: 'Forward' },
      ],
      words: ', evened out and brought near',
    },
    shade: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Shaded' },
        { deviceId: 'spread', preset: 'Wide pad' },
      ],
      words: ', shaded and spread wide',
    },
    thin: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Thin' },
        { deviceId: 'plate-reverb', preset: 'Tight room' },
      ],
      words: ', thinned out in a tight room',
    },
    deep: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Deep' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10 } },
      ],
      words: ', with its lows raised',
    },
    wall: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Muffled' },
        { deviceId: 'distance', preset: 'Next door' },
      ],
      words: ', heard through a wall',
    },
    pillow: {
      effects: [{ deviceId: 're-amp', preset: 'Pillow speaker' }],
      words: ', from a speaker under a pillow',
    },
    slap: {
      effects: [{ deviceId: 'tape-echo', preset: 'Single slap' }],
      words: ', with one quick slap behind it',
    },
    held: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 3 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', held level in a small room',
    },
    pinned: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 12 } },
      ],
      words: ', pressed level and near',
    },
    pinroom: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -9.5, gain: 10 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', pressed level in a plain room',
    },
    pinhall: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 10 } },
        { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.2 } },
      ],
      words: ', pressed level under a thin tail',
    },
    pinslap: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 10 } },
        { deviceId: 'tape-echo', preset: 'Single slap' },
      ],
      words: ', pressed level with a quick slap',
    },
    pinstar: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 10 } },
        { deviceId: 'constellation', preset: 'Faint points' },
      ],
      words: ', pressed level, with faint points of echo',
    },
    firm: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Low warmth' },
        { deviceId: 'spread', preset: 'Firm bass' },
      ],
      words: ', with a warm driven bottom',
    },
    iron: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Iron lows' },
        { deviceId: 'ambient-eq', preset: 'Drone' },
      ],
      words: ', through iron',
    },
    fold: {
      effects: [
        { deviceId: 'saturator', preset: 'Folded glass' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', with a folded edge in a room',
    },
    glaze: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Glaze' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', with an early sampler glaze',
    },
    combo: {
      effects: [{ deviceId: 're-amp', preset: 'Combo in a room' }],
      words: ', from a small amplifier in a room',
    },
    platform: {
      effects: [{ deviceId: 're-amp', preset: 'Station platform' }],
      words: ', from a horn speaker over a platform',
    },
    paper: {
      effects: [
        { deviceId: 'buzzing-bridge', preset: 'Moth wings' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', with paper that buzzes along',
    },
    giant: {
      effects: [
        { deviceId: 'size', preset: 'Giant' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', from a far larger body',
    },
    small: {
      effects: [
        { deviceId: 'size', preset: 'Smaller' },
        { deviceId: 'plate-reverb', preset: 'Small plate' },
      ],
      words: ', from a smaller body on a plate',
    },
    tube: {
      effects: [
        { deviceId: 'imprint', preset: 'Hollow tube' },
        { deviceId: 'chorus', preset: 'Subtle widener' },
      ],
      words: ', through a hollow tube',
    },
    room: { effects: [{ deviceId: 'hall-reverb', preset: 'Room' }], words: ', in a plain room' },
    plate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Small plate' }],
      words: ', on a small plate',
    },
    longplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.28 } }],
      words: ', on a long plate',
    },
    darkplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } }],
      words: ', on a dark plate',
    },
    chapel: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel' }],
      words: ', in a chapel that answers in vowels',
    },
    hall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.28 } }],
      words: ', in a hall',
    },
    cath: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.28 } }],
      words: ', in a cathedral',
    },
    darkhall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.32 } }],
      words: ', in a dark hall',
    },
    airy: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.28 } }],
      words: ', with a thin airy tail',
    },
    valley: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.28 } }],
      words: ', across a valley',
    },
    cave: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.28 } }],
      words: ', in a dark cave',
    },
    bright: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.22 } }],
      words: ', in a bright chamber',
    },
    stair: {
      effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
      words: ', from a stone stairwell',
    },
    shore: {
      effects: [{ deviceId: 'distance', preset: 'Far shore' }],
      words: ', from a far shore',
    },
    back: {
      effects: [{ deviceId: 'distance', preset: 'Back of the hall' }],
      words: ', from the back of a hall',
    },
    cellar: {
      effects: [{ deviceId: 'expanse', preset: 'Small dark room' }],
      words: ', in a small dark cellar',
    },
    tunnel: {
      effects: [{ deviceId: 'expanse', preset: 'Narrow tunnel' }],
      words: ', down a narrow tunnel',
    },
    crypt: {
      effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.3 } }],
      words: ', over a crypt',
    },
    spring: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } }],
      words: ', in a long spring tank',
    },
    slack: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Single slack coil', params: { mix: 0.25 } }],
      words: ', on one slack spring',
    },
    gated: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Gated' }],
      words: ', in a room that stops short',
    },
    rev: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.35 } }],
      words: ', with a tail that rises backwards',
    },
    bloom: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.38 } }],
      words: ', with a tail that swells late',
    },
    cavern: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.28 } }],
      words: ', in a cavern of small echoes',
    },
    shaft: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Mine shaft', params: { mix: 0.3 } }],
      words: ', down a mine shaft',
    },
    tank: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.22 } }],
      words: ', in a bright metal tank',
    },
    oo: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind' }],
      words: ', with a far Oo behind it',
    },
    repeats: {
      effects: [{ deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.28 } }],
      words: ', with warm tape repeats',
    },
    dotted: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.26 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', with echoes in a dotted rhythm',
    },
    darkecho: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.28 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.15 } },
      ],
      words: ', with a dark echo',
    },
    murk: {
      effects: [{ deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.28 } }],
      words: ', with slow murky repeats',
    },
    stone: {
      effects: [{ deviceId: 'skipping-stone', preset: 'Skipping stone', params: { mix: 0.28 } }],
      words: ', with echoes that skip away',
    },
    slowring: {
      effects: [
        { deviceId: 'skipping-stone', preset: 'Slowing bounces', params: { mix: 0.28 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', with echoes that slow down',
    },
    star: {
      effects: [
        { deviceId: 'constellation', preset: 'One far star' },
        { deviceId: 'plate-reverb', preset: 'Faint sheen' },
      ],
      words: ', with one far echo',
    },
    seven: {
      effects: [{ deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.32 } }],
      words: ', with seven scattered echoes',
    },
    round: {
      effects: [{ deviceId: 'canon', preset: 'Round of three', params: { mix: 0.38 } }],
      words: ', sung as a round of three',
    },
    orbit: {
      effects: [{ deviceId: 'orbits', preset: 'Slow phasing', params: { mix: 0.32 } }],
      words: ', in loops that slide apart',
    },
    recall: {
      effects: [{ deviceId: 'echo-memory', preset: 'Recalling', params: { mix: 0.35 } }],
      words: ', with moments that come back later',
    },
    prism: {
      effects: [{ deviceId: 'prism', preset: 'Low to high' }],
      words: ', with echoes that unfold low to high',
    },
    mirror: {
      effects: [{ deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.38 } }],
      words: ', with slow backward swells',
    },
    embers: {
      effects: [{ deviceId: 'grain-delay', preset: 'Falling embers', params: { mix: 0.26 } }],
      words: ', with grains that fall an octave',
    },
    trem: {
      effects: [
        { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.4 } },
        { deviceId: 'spring-reverb', preset: 'Hint of spring' },
      ],
      words: ', in an amplifier tremolo',
    },
    harm: {
      effects: [
        { deviceId: 'tremolo', preset: 'Harmonic shimmer' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', under a harmonic tremolo',
    },
    sea: {
      effects: [
        { deviceId: 'tremolo', preset: 'Sea swell' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
      ],
      words: ', in slow uneven swells in a hall',
    },
    chorale: {
      effects: [{ deviceId: 'rotary', preset: 'Chorale' }],
      words: ', through a slow rotor',
    },
    spin: {
      effects: [
        { deviceId: 'rotary', preset: 'Tremolo' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', through a fast rotor in a room',
    },
    pan: {
      effects: [
        { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.22 } },
        { deviceId: 'plate-reverb', preset: 'Small plate' },
      ],
      words: ', drifting from side to side',
    },
    glacial: {
      effects: [
        {
          deviceId: 'auto-filter',
          preset: 'Glacial low-pass',
          params: { cutoffHz: 900, lfoRateHz: 0.16 },
        },
      ],
      words: ', under a filter that opens and shuts',
    },
    touch: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Soft bloom', params: { driveDb: 3, cutoffHz: 380 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', behind a filter that opens with it',
    },
    notch: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Slow notch' },
        { deviceId: 'spread', preset: 'Open middle' },
      ],
      words: ', with a notch that wanders through',
    },
    swirl: {
      effects: [{ deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.14 } }],
      words: ', in a slow swirl',
    },
    jet: {
      effects: [{ deviceId: 'flanger', preset: 'Slow sweep', params: { rate: 0.12 } }],
      words: ', under a slow sweeping comb',
    },
    lush: {
      effects: [
        { deviceId: 'chorus', preset: 'Lush ensemble' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.15 } },
      ],
      words: ', in a wide ensemble',
    },
    deepsea: {
      effects: [{ deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.45 } }],
      words: ', in a deep slow chorus',
    },
    water: {
      effects: [{ deviceId: 'currents', preset: 'Slow water' }],
      words: ', moving like slow water',
    },
    glim: {
      effects: [
        { deviceId: 'glimmer', preset: 'Light on water' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', with a glimmer through its partials',
    },
    six: {
      effects: [{ deviceId: 'band-pulse', preset: 'Six a second' }],
      words: ', with six pulses a second in its middle',
    },
    throb: {
      effects: [
        { deviceId: 'pulses', preset: 'Soft throb' },
        { deviceId: 'plate-reverb', preset: 'Small plate' },
      ],
      words: ', in a soft throb',
    },
    lungs: {
      effects: [{ deviceId: 'breath', preset: 'Calm breath' }],
      words: ', in long calm breaths',
    },
    circle: {
      effects: [{ deviceId: 'around', preset: 'Slow circle' }],
      words: ', walking slowly round you',
    },
    flock: {
      effects: [{ deviceId: 'murmuration', preset: 'Evening flock' }],
      words: ', in a flock that wheels past',
    },
    slowing: {
      effects: [
        { deviceId: 'winding-down', preset: 'Four slowing' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', with a pulse that keeps slowing',
    },
    vib: {
      effects: [
        { deviceId: 'late-vibrato', preset: 'Singer' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', with a vibrato that comes late',
    },
    reel: {
      effects: [
        { deviceId: 'tape', preset: 'Quarter inch' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', on tape in a small room',
    },
    cassette: {
      effects: [{ deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.25 } }],
      words: ', on a worn cassette',
    },
    record: {
      effects: [
        { deviceId: 'vinyl', preset: 'Dull stylus' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', on a dull old record',
    },
    bulb: {
      effects: [{ deviceId: 'patina', preset: 'Valve bloom' }],
      words: ', through a valve that wavers',
    },
    under: {
      effects: [{ deviceId: 'underwater', preset: 'Under', params: { mix: 0.75 } }],
      words: ', under water',
    },
    shallow: {
      effects: [
        { deviceId: 'underwater', preset: 'Sunlit shallows' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.15 } },
      ],
      words: ', in shallow water',
    },
    veil: {
      effects: [{ deviceId: 'haze', preset: 'Thin veil' }],
      words: ', behind a thin veil of fuzz',
    },
    wool: {
      effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.3 } }],
      words: ', under a woollen blanket of fuzz',
    },
    mist: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.38 } }],
      words: ', in a hanging mist',
    },
    cloud: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.38 } }],
      words: ', in a soft cloud of grains',
    },
    smear: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Slow smear', params: { mix: 0.4 } }],
      words: ', smeared by slow long grains',
    },
    half: {
      effects: [{ deviceId: 'stretch', preset: 'Half time haze', params: { mix: 0.4 } }],
      words: ', with a haze at half its speed',
    },
    bed: {
      effects: [{ deviceId: 'sustainer', preset: 'Slow strings', params: { mix: 0.38 } }],
      words: ', over a slow bed of held strings',
    },
    melt: { effects: [{ deviceId: 'melt', preset: 'Soft sag' }], words: ', with a tail that sags' },
    leaves: {
      effects: [{ deviceId: 'falling', preset: 'Slow sighs', params: { mix: 0.32 } }],
      words: ', with slow sighs that fall away',
    },
    fog: {
      effects: [{ deviceId: 'fog', preset: 'Morning mist' }],
      words: ', in a soft fog with no tail',
    },
    rain: { effects: [{ deviceId: 'weather', preset: 'Light rain' }], words: ', in light rain' },
    surf: { effects: [{ deviceId: 'weather', preset: 'Far shore' }], words: ', beside a far surf' },
    dust: {
      effects: [
        { deviceId: 'glints', preset: 'Faint dust' },
        { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.18 } },
      ],
      words: ', with a faint bright dust above',
    },
    shim: {
      effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.24 } }],
      words: ', under a rising choir',
    },
    below: {
      effects: [{ deviceId: 'shimmer', preset: 'Undertow', params: { mix: 0.28 } }],
      words: ', with a tail that sinks an octave',
    },
    halo: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Octave halo', params: { mix: 0.24 } }],
      words: ', in an octave halo',
    },
    twelve: {
      effects: [
        { deviceId: 'octaves', preset: 'Faint octave', params: { up1: 0.3 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
      ],
      words: ', with a faint octave above',
    },
    sines: {
      effects: [{ deviceId: 'sine-shadow', preset: 'Octave halo', params: { mix: 0.35 } }],
      words: ', with pure tones an octave up',
    },
    stairs: {
      effects: [{ deviceId: 'spiral', preset: 'Slow ascent', params: { mix: 0.28 } }],
      words: ', with a tail that climbs on and on',
    },
    strings: {
      effects: [{ deviceId: 'sympathetic', preset: 'Minor strings', params: { mix: 0.32 } }],
      words: ', over strings that ring with it',
    },
    common: {
      effects: [{ deviceId: 'common-tones', preset: 'Long hold', params: { mix: 0.5 } }],
      words: ', with the shared tones hanging on',
    },
    tiles: {
      effects: [{ deviceId: 'cascade', preset: 'Slow tiles', params: { mix: 0.32 } }],
      words: ', with slow tiles of itself above',
    },
    drift: {
      effects: [{ deviceId: 'freq-shifter', preset: 'Slow drift', params: { mix: 0.4 } }],
      words: ', drifting slowly out of phase',
    },
    slowed: {
      effects: [{ deviceId: 'half-speed', preset: 'Thin shadow', params: { mix: 0.35 } }],
      words: ', with a thin shadow at half speed',
    },
    loop: {
      effects: [{ deviceId: 'micro-looper', preset: 'Soft bed' }],
      words: ', over a loop of its last two seconds',
    },
    bowls: {
      effects: [{ deviceId: 'bowls', preset: 'Minor table', params: { mix: 0.22 } }],
      words: ', with bowls that ring along',
    },
    empty: {
      effects: [
        { deviceId: 'noise-floor', preset: 'Empty room', params: { level: -40 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', in an empty room you can hear',
    },
    cellos: {
      effects: [{ deviceId: 'pad-follower', preset: 'Dark cellos', params: { mix: 0.35 } }],
      words: ', with dark cellos that follow it',
    },
    pot: {
      effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.6 } }],
      words: ', inside a clay pot',
    },
    lifted: {
      effects: [
        { deviceId: 'lift', preset: 'Long tails' },
        { deviceId: 'hall-reverb', preset: 'Tight chamber' },
      ],
      words: ', with its quiet ends raised',
    },
    kept: {
      effects: [
        { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
        { deviceId: 'distance', preset: 'Close mic' },
      ],
      words: ', level and close by',
    },
  },
  phrases: {
    cantus: {
      notes: [
        { atSec: 0, durSec: 1.9, note: 50, gain: 0.6 },
        { atSec: 1.8, durSec: 1.2, note: 53, gain: 0.55 },
        { atSec: 2.9, durSec: 1.2, note: 55, gain: 0.6 },
        { atSec: 4, durSec: 1.2, note: 57, gain: 0.65 },
        { atSec: 5.1, durSec: 2.1, note: 52, gain: 0.5 },
      ],
    },
    tenor: {
      notes: [
        { atSec: 0, durSec: 7, note: 50, gain: 0.6 },
        { atSec: 0.6, durSec: 1.6, note: 57, gain: 0.5 },
        { atSec: 2.1, durSec: 1.1, note: 60, gain: 0.5 },
        { atSec: 3.1, durSec: 1.1, note: 59, gain: 0.5 },
        { atSec: 4.1, durSec: 1.1, note: 55, gain: 0.45 },
        { atSec: 5.1, durSec: 2, note: 57, gain: 0.55 },
      ],
    },
    suspend: {
      notes: [
        { atSec: 0, durSec: 3.4, note: 45, gain: 0.6 },
        { atSec: 0, durSec: 3.4, note: 52, gain: 0.5 },
        { atSec: 0, durSec: 1.9, note: 62, gain: 0.6 },
        { atSec: 1.8, durSec: 5.3, note: 60, gain: 0.5 },
        { atSec: 0, durSec: 5.3, note: 64, gain: 0.5 },
        { atSec: 3.4, durSec: 3.7, note: 41, gain: 0.6 },
        { atSec: 3.4, durSec: 3.7, note: 53, gain: 0.45 },
        { atSec: 5.2, durSec: 1.9, note: 62, gain: 0.45 },
      ],
    },
    floor: {
      notes: [
        { atSec: 0, durSec: 7, note: 38, gain: 0.65 },
        { atSec: 0.2, durSec: 6.8, note: 45, gain: 0.5 },
        { atSec: 1.6, durSec: 5.4, note: 53, gain: 0.35 },
      ],
    },
    lowline: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 38, gain: 0.75 },
        { atSec: 1.7, durSec: 1.1, note: 45, gain: 0.6 },
        { atSec: 2.9, durSec: 1.3, note: 43, gain: 0.65 },
        { atSec: 4.3, durSec: 2.8, note: 38, gain: 0.7 },
      ],
    },
    lowpair: {
      notes: [
        { atSec: 0, durSec: 3.3, note: 36, gain: 0.7 },
        { atSec: 1, durSec: 2.2, note: 52, gain: 0.4 },
        { atSec: 3.4, durSec: 3.6, note: 41, gain: 0.65 },
        { atSec: 4.4, durSec: 2.6, note: 60, gain: 0.35 },
      ],
    },
    walk: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 45, gain: 0.7 },
        { atSec: 0.8, durSec: 0.4, note: 52, gain: 0.5 },
        { atSec: 1.6, durSec: 0.5, note: 43, gain: 0.65 },
        { atSec: 2.4, durSec: 0.4, note: 50, gain: 0.5 },
        { atSec: 3.2, durSec: 0.5, note: 41, gain: 0.7 },
        { atSec: 4, durSec: 0.4, note: 48, gain: 0.5 },
        { atSec: 4.8, durSec: 1.8, note: 38, gain: 0.75 },
      ],
    },
    high: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 81, gain: 0.6 },
        { atSec: 1.2, durSec: 0.5, note: 76, gain: 0.55 },
        { atSec: 2.5, durSec: 0.5, note: 84, gain: 0.5 },
        { atSec: 3.9, durSec: 0.5, note: 79, gain: 0.55 },
        { atSec: 5, durSec: 0.8, note: 74, gain: 0.6 },
      ],
    },
    ripple: {
      notes: [
        { atSec: 0, durSec: 1.5, note: 50, gain: 0.65 },
        { atSec: 0.4, durSec: 1.5, note: 57, gain: 0.55 },
        { atSec: 0.8, durSec: 1.5, note: 64, gain: 0.5 },
        { atSec: 1.2, durSec: 1.5, note: 69, gain: 0.5 },
        { atSec: 1.6, durSec: 1.8, note: 72, gain: 0.55 },
        { atSec: 3.2, durSec: 1.8, note: 48, gain: 0.6 },
        { atSec: 3.6, durSec: 1.8, note: 55, gain: 0.5 },
        { atSec: 4, durSec: 1.8, note: 64, gain: 0.45 },
        { atSec: 4.4, durSec: 2.4, note: 71, gain: 0.5 },
      ],
    },
    call: {
      notes: [
        { atSec: 0, durSec: 0.9, note: 69, gain: 0.6 },
        { atSec: 1, durSec: 0.6, note: 72, gain: 0.55 },
        { atSec: 1.7, durSec: 1.4, note: 67, gain: 0.5 },
        { atSec: 3.6, durSec: 0.9, note: 57, gain: 0.6 },
        { atSec: 4.6, durSec: 0.6, note: 60, gain: 0.5 },
        { atSec: 5.3, durSec: 1.8, note: 55, gain: 0.55 },
      ],
    },
    one: {
      notes: [{ atSec: 0, durSec: 6.6, note: 57, gain: 0.65 }],
    },
    lowone: {
      notes: [{ atSec: 0, durSec: 6.8, note: 43, gain: 0.7 }],
    },
    stack: {
      notes: [
        { atSec: 0, durSec: 7, note: 50, gain: 0.6 },
        { atSec: 1.1, durSec: 5.9, note: 57, gain: 0.5 },
        { atSec: 2.2, durSec: 4.8, note: 64, gain: 0.5 },
        { atSec: 3.3, durSec: 3.7, note: 71, gain: 0.5 },
      ],
    },
    pair: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 64, gain: 0.6 },
        { atSec: 0, durSec: 1.6, note: 60, gain: 0.5 },
        { atSec: 1.5, durSec: 1.6, note: 65, gain: 0.55 },
        { atSec: 1.5, durSec: 1.6, note: 57, gain: 0.55 },
        { atSec: 3, durSec: 1.6, note: 67, gain: 0.6 },
        { atSec: 3, durSec: 1.6, note: 52, gain: 0.55 },
        { atSec: 4.5, durSec: 2.6, note: 69, gain: 0.6 },
        { atSec: 4.5, durSec: 1.2, note: 53, gain: 0.5 },
        { atSec: 5.7, durSec: 1.4, note: 50, gain: 0.55 },
      ],
    },
    nine: {
      notes: [
        { atSec: 0, durSec: 6.6, note: 48, gain: 0.6 },
        { atSec: 0, durSec: 6.6, note: 55, gain: 0.5 },
        { atSec: 0.1, durSec: 6.5, note: 64, gain: 0.5 },
        { atSec: 0.2, durSec: 6.4, note: 71, gain: 0.45 },
        { atSec: 0.3, durSec: 6.3, note: 74, gain: 0.4 },
      ],
    },
    turn: {
      notes: [
        { atSec: 0, durSec: 3.6, note: 53, gain: 0.6 },
        { atSec: 0, durSec: 7, note: 60, gain: 0.45 },
        { atSec: 0, durSec: 3.6, note: 64, gain: 0.5 },
        { atSec: 0, durSec: 3.6, note: 67, gain: 0.5 },
        { atSec: 3.5, durSec: 3.5, note: 50, gain: 0.6 },
        { atSec: 3.5, durSec: 3.5, note: 65, gain: 0.5 },
        { atSec: 3.5, durSec: 3.5, note: 69, gain: 0.5 },
      ],
    },
    ost: {
      notes: [
        { atSec: 0, durSec: 0.35, note: 62, gain: 0.6 },
        { atSec: 0.5, durSec: 0.3, note: 69, gain: 0.5 },
        { atSec: 1, durSec: 0.3, note: 64, gain: 0.5 },
        { atSec: 1.5, durSec: 0.3, note: 69, gain: 0.45 },
        { atSec: 2, durSec: 0.35, note: 62, gain: 0.6 },
        { atSec: 2.5, durSec: 0.3, note: 69, gain: 0.5 },
        { atSec: 3, durSec: 0.3, note: 67, gain: 0.5 },
        { atSec: 3.5, durSec: 0.3, note: 64, gain: 0.45 },
        { atSec: 4, durSec: 0.35, note: 60, gain: 0.6 },
        { atSec: 4.5, durSec: 0.3, note: 67, gain: 0.5 },
        { atSec: 5, durSec: 1.6, note: 62, gain: 0.6 },
      ],
    },
    points: {
      notes: [
        { atSec: 0, durSec: 1.2, note: 74, gain: 0.6 },
        { atSec: 1.1, durSec: 1, note: 69, gain: 0.5 },
        { atSec: 2.4, durSec: 1, note: 81, gain: 0.45 },
        { atSec: 3.3, durSec: 1.4, note: 62, gain: 0.6 },
        { atSec: 4.9, durSec: 1.8, note: 76, gain: 0.5 },
      ],
    },
    bird: {
      notes: [
        { atSec: 0, durSec: 0.25, note: 79, gain: 0.6 },
        { atSec: 0.35, durSec: 0.25, note: 76, gain: 0.5 },
        { atSec: 0.7, durSec: 0.6, note: 81, gain: 0.55 },
        { atSec: 2.6, durSec: 0.25, note: 76, gain: 0.55 },
        { atSec: 2.95, durSec: 0.25, note: 79, gain: 0.5 },
        { atSec: 3.3, durSec: 1, note: 74, gain: 0.5 },
        { atSec: 5.2, durSec: 0.9, note: 72, gain: 0.5 },
      ],
    },
    lament: {
      notes: [
        { atSec: 0, durSec: 7, note: 50, gain: 0.5 },
        { atSec: 0, durSec: 1.7, note: 69, gain: 0.6 },
        { atSec: 1.6, durSec: 1.3, note: 67, gain: 0.5 },
        { atSec: 2.8, durSec: 1.3, note: 65, gain: 0.55 },
        { atSec: 4, durSec: 1.3, note: 64, gain: 0.5 },
        { atSec: 5.2, durSec: 1.8, note: 62, gain: 0.5 },
      ],
    },
    night: {
      notes: [
        { atSec: 0, durSec: 7, note: 36, gain: 0.65 },
        { atSec: 0.4, durSec: 6.6, note: 55, gain: 0.4 },
        { atSec: 1.2, durSec: 5.8, note: 64, gain: 0.4 },
        { atSec: 2.2, durSec: 4.8, note: 71, gain: 0.35 },
        { atSec: 3.4, durSec: 3.6, note: 74, gain: 0.35 },
      ],
    },
    hum: {
      notes: [
        { atSec: 0, durSec: 6.8, note: 60, gain: 0.5 },
        { atSec: 0.2, durSec: 6.6, note: 64, gain: 0.5 },
        { atSec: 0.4, durSec: 6.4, note: 67, gain: 0.45 },
        { atSec: 0.6, durSec: 6.2, note: 71, gain: 0.45 },
      ],
    },
    air: {
      notes: [
        { atSec: 0, durSec: 6.8, note: 72, gain: 0.5 },
        { atSec: 0.5, durSec: 6.3, note: 76, gain: 0.45 },
        { atSec: 1, durSec: 5.8, note: 79, gain: 0.45 },
        { atSec: 1.6, durSec: 5.2, note: 83, gain: 0.4 },
      ],
    },
    knock: {
      notes: [
        { atSec: 0, durSec: 0.25, note: 57, gain: 0.65 },
        { atSec: 0.6, durSec: 0.2, note: 57, gain: 0.5 },
        { atSec: 0.9, durSec: 0.2, note: 64, gain: 0.55 },
        { atSec: 1.8, durSec: 0.25, note: 57, gain: 0.6 },
        { atSec: 2.4, durSec: 0.2, note: 60, gain: 0.5 },
        { atSec: 3.3, durSec: 0.25, note: 55, gain: 0.65 },
        { atSec: 3.9, durSec: 0.2, note: 55, gain: 0.5 },
        { atSec: 4.2, durSec: 0.2, note: 62, gain: 0.55 },
        { atSec: 5.1, durSec: 1.4, note: 52, gain: 0.6 },
      ],
    },
    understep: {
      notes: [
        { atSec: 0, durSec: 2.2, note: 41, gain: 0.7 },
        { atSec: 2.3, durSec: 1.4, note: 36, gain: 0.7 },
        { atSec: 3.8, durSec: 1.2, note: 43, gain: 0.65 },
        { atSec: 5.1, durSec: 2.1, note: 38, gain: 0.7 },
      ],
    },
    lowarch: {
      notes: [
        { atSec: 0, durSec: 1.4, note: 36, gain: 0.7 },
        { atSec: 1.5, durSec: 1.2, note: 43, gain: 0.65 },
        { atSec: 2.8, durSec: 1.3, note: 50, gain: 0.6 },
        { atSec: 4.2, durSec: 1.1, note: 47, gain: 0.6 },
        { atSec: 5.4, durSec: 1.8, note: 43, gain: 0.65 },
      ],
    },
    deepcall: {
      notes: [
        { atSec: 0, durSec: 2.8, note: 31, gain: 0.75 },
        { atSec: 3, durSec: 1.3, note: 38, gain: 0.65 },
        { atSec: 4.4, durSec: 2.6, note: 33, gain: 0.7 },
      ],
    },
    verse: {
      notes: [
        { atSec: 0, durSec: 1.9, note: 50, gain: 0.6 },
        { atSec: 0, durSec: 1.9, note: 57, gain: 0.5 },
        { atSec: 0, durSec: 1.9, note: 65, gain: 0.55 },
        { atSec: 1.9, durSec: 1.8, note: 43, gain: 0.6 },
        { atSec: 1.9, durSec: 1.8, note: 59, gain: 0.5 },
        { atSec: 1.9, durSec: 1.8, note: 67, gain: 0.55 },
        { atSec: 3.7, durSec: 1.8, note: 48, gain: 0.6 },
        { atSec: 3.7, durSec: 3.5, note: 60, gain: 0.5 },
        { atSec: 3.7, durSec: 3.5, note: 64, gain: 0.5 },
        { atSec: 5.5, durSec: 1.7, note: 45, gain: 0.6 },
      ],
    },
    sixths: {
      notes: [
        { atSec: 0, durSec: 1.1, note: 57, gain: 0.55 },
        { atSec: 0, durSec: 1.1, note: 65, gain: 0.6 },
        { atSec: 1.2, durSec: 1.1, note: 59, gain: 0.55 },
        { atSec: 1.2, durSec: 1.1, note: 67, gain: 0.6 },
        { atSec: 2.4, durSec: 1.5, note: 60, gain: 0.55 },
        { atSec: 2.4, durSec: 1.5, note: 69, gain: 0.6 },
        { atSec: 4.1, durSec: 0.9, note: 55, gain: 0.55 },
        { atSec: 4.1, durSec: 0.9, note: 64, gain: 0.6 },
        { atSec: 5.1, durSec: 2, note: 53, gain: 0.55 },
        { atSec: 5.1, durSec: 2, note: 62, gain: 0.6 },
      ],
    },
    descend: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 74, gain: 0.55 },
        { atSec: 0.45, durSec: 1.6, note: 67, gain: 0.55 },
        { atSec: 0.9, durSec: 1.6, note: 64, gain: 0.5 },
        { atSec: 1.35, durSec: 1.6, note: 57, gain: 0.55 },
        { atSec: 1.8, durSec: 1.7, note: 48, gain: 0.6 },
        { atSec: 3.6, durSec: 1.6, note: 72, gain: 0.55 },
        { atSec: 4.05, durSec: 1.6, note: 65, gain: 0.5 },
        { atSec: 4.5, durSec: 1.6, note: 60, gain: 0.5 },
        { atSec: 4.95, durSec: 1.6, note: 53, gain: 0.55 },
        { atSec: 5.4, durSec: 1.8, note: 45, gain: 0.6 },
      ],
    },
    wide: {
      notes: [
        { atSec: 0, durSec: 7, note: 41, gain: 0.6 },
        { atSec: 0.3, durSec: 6.7, note: 60, gain: 0.45 },
        { atSec: 1.4, durSec: 5.6, note: 64, gain: 0.45 },
        { atSec: 2.6, durSec: 4.4, note: 69, gain: 0.45 },
      ],
    },
    bells: {
      notes: [
        { atSec: 0, durSec: 2.4, note: 69, gain: 0.55 },
        { atSec: 0.9, durSec: 2.4, note: 76, gain: 0.5 },
        { atSec: 2.7, durSec: 2.2, note: 72, gain: 0.55 },
        { atSec: 3.6, durSec: 2.2, note: 79, gain: 0.45 },
        { atSec: 5.2, durSec: 1.9, note: 67, gain: 0.55 },
      ],
    },
  },
  directions: [
    {
      id: 'cave-chants',
      name: 'Cave chants',
      category: 'voice',
      rows: `
Torch at the cave mouth | Cave chant | closure=.95 vowel=.55 mouth=.85 release=2.5 ring=.34 throat=1 singers=3 chest=.3 skew=.05 attack=.15 volume=0 | cave | cantus | Three tight bright voices on Eh with an octave under them
Basses under the arch | Cave chant | throat=.64 closure=.6 vowel=.06 mouth=.45 chest=.95 attack=.7 skew=.54 depth=.86 width=.82 roughness=0 breath=.55 pace=.1 | twelve | tenor | Four long dark throats on a covered Oo, an octave below, each breath its own swell
Lamp on wet stone | Cave chant | singers=1 drift=.1 whisper=.35 vowel=.2 ring=.5 width=.3 attack=.25 fade=15 throat=1.32 roughness=.19 volume=-1 | bare | lament | One voice with air in it and an octave under it
Echo off the far wall | Cave chant | closure=.9 vowel=.58 throat=.95 attack=.06 release=.5 fade=8 skew=.32 width=.82 mouth=.82 drift=.68 depth=.9 whisper=.24 roughness=.19 volume=5.5 | star | call | Four hard voices on Eh that start at once and die away
Candle counted down | Cave chant | vowel=.95 mouth=.35 ring=.7 closure=.4 attack=1.5 release=7 width=.75 skew=.3 roughness=0 | mist | suspend | Round soft voices on a half shut Ue, an octave below
Chant that opens a door | Cave chant | second=3 turn=1 pace=.16 closure=.66 vowel=.3 skew=.1 depth=.68 width=.45 ring=.18 | hall | verse | The floor goes from an octave to a twelfth and back
Two counts in one rite | Slow door | second=3 pace=.4 vowel=.5 throat=.78 chest=.8 attack=.5 closure=.7 skew=.3 drift=.18 width=.55 roughness=.05 | common | turn | Voices on Eh that turn from an octave to a twelfth
Under and then nothing | Cave chant | turn=1 second=1 pace=.22 depth=1 vowel=.36 singers=3 release=2 skew=.48 width=.55 roughness=.14 ring=.06 whisper=.06 fade=16 volume=-2 | stair | tenor | An octave below that opens and shuts under three singers
The third count answers | Cave chant | division=Three second=2 turn=1 pace=.55 closure=.74 throat=.88 mouth=.95 skew=.48 depth=.92 width=.45 roughness=0 volume=-1.5 | round | lament | A twelfth below that turns to an octave each two seconds
Late turn in the rite | Cave chant | second=4 turn=.9 pace=.07 vowel=.12 closure=.5 attack=2 release=6 ring=.4 skew=.36 roughness=.05 volume=-2.5 | bed | stack | Slow voices whose floor sinks from one octave to two
Reciting tone | Bronze throat | vowel=.5 closure=.8 throat=.9 attack=.05 release=.35 chest=.6 singers=3 skew=.48 drift=.38 roughness=.17 whisper=.24 fade=10 volume=1.5 | deck | knock | Three voices that speak at once with an octave under them
Psalm at the threshold | Bronze throat | division=Three vowel=.7 closure=.78 throat=1.05 attack=.04 release=.4 singers=2 ring=.2 skew=.48 drift=.18 fade=12 volume=5 | plate | knock | Two bright voices on Eh and Ee over a twelfth below
Words nobody kept | Bronze throat | vowel=.14 mouth=.5 closure=.55 fade=2.2 attack=.02 release=.7 singers=4 roughness=.2 width=.82 chest=.55 volume=3 | room | pair | Four covered voices that start at once and fade in two seconds
Marching in single file | Cave chant | attack=.03 release=.25 fade=1.4 closure=.8 vowel=.45 depth=1 throat=.9 skew=.32 width=.9 ring=.12 mouth=1 drift=.14 volume=6 | cavern | walk | Short hard notes of four voices with an octave under them
Amen cut off short | Cave chant | attack=.1 release=.1 skew=.9 vowel=.3 closure=.75 depth=1 throat=.72 width=.25 roughness=.05 fade=18 mouth=.96 drift=.04 whisper=.3 volume=0 | sea | sixths | Groups that swell dark and are cut, in four long throats
Four men say nothing | Cave chant | mouth=.08 vowel=.1 closure=.45 chest=.85 ring=.35 skew=.02 width=.45 throat=1.05 drift=.68 roughness=.19 fade=11 | bare | wide | A closed hum of four voices over a warm chest
Hum through the nose | Cave chant | mouth=.18 vowel=.8 throat=1.2 closure=.68 singers=2 chest=.2 attack=.3 depth=.98 width=.9 roughness=.05 volume=-1.5 | touch | tenor | Two small throats that hum with hardly any chest
Hum kept in the ribs | Cave chant | mouth=0 chest=1 throat=.7 closure=.25 whisper=0 singers=3 width=.4 attack=.8 skew=.36 depth=.98 roughness=0 fade=15 ring=.06 breath=.55 pace=.1 volume=-16.5 | deep | floor | A shut dark hum of three voices, almost all chest, each breath its own swell | drone
Lips part at the end | Open sky | division=Two mouth=.3 vowel=.2 turn=.9 pace=.12 closure=.5 whisper=.1 chest=.7 skew=.1 depth=.92 roughness=.02 ring=.06 | glacial | hum | Covered voices that open to the plain tone and cover again
Humming past the well | Cave chant | mouth=.22 vowel=.02 ring=.9 closure=.35 attack=.6 release=8 drift=.15 skew=.48 depth=.62 width=.65 | crypt | suspend | A covered hum that rings into a smooth tone, an octave below
Two octaves of ground | Cave chant | division=Four throat=.7 closure=.5 turn=0 depth=.9 attack=.7 skew=.42 width=.55 ring=.6 mouth=.82 chest=.85 fade=11 volume=-3 | cath | lament | Four ringing voices with a pulse two octaves under each
Ducking the lintel | Cave chant | division=Four second=2 turn=.9 pace=.3 vowel=.6 throat=1 closure=.8 skew=.42 width=.55 roughness=.03 fade=14 volume=1.5 | back | stack | Open vowels whose floor rises from two octaves to one
Riverbed at midnight | Cave chant | division=Four roughness=.45 closure=.62 vowel=.26 singers=2 chest=.9 ring=.15 width=.5 skew=.42 throat=.7 drift=.14 depth=1 fade=17 | iron | lowpair | Two rough voices that growl two octaves down
Stone rolled aside | Elephant dusk | breath=0 roughness=.3 vowel=.3 attack=.4 turn=.6 pace=.5 release=2 skew=.3 depth=.68 mouth=.88 ring=.12 drift=.04 whisper=.4 throat=1.05 | shaft | tenor | Rough airy voices that let go of their two octaves by turns
Bottom of the stair well | Sub pedal | closure=.5 singers=3 width=.6 vowel=.3 mouth=.6 attack=.25 release=2 throat=.75 skew=.54 fade=18 volume=-3.5 | stair | floor | Dark voices with a still pedal two octaves under them
Breath against basalt | Cave chant | whisper=.6 closure=.4 vowel=.24 depth=.9 attack=.9 width=.55 skew=.54 roughness=.17 ring=.12 throat=1.05 mouth=.96 fade=10 volume=-2.5 | dead | verse | Four airy voices with an octave in the breath
Breath in a cold nave | Whisper floor | whisper=.8 closure=.6 vowel=.72 chest=.5 singers=3 attack=.5 release=2.5 skew=.1 drift=.52 roughness=.17 division=Three ring=.15 turn=.15 mouth=.85 width=.3 fade=9 volume=2 | cave | tenor | More air than voice on Ee over a twelfth
Whispered office | Whisper floor | vowel=.4 whisper=1 ring=.15 chest=.3 attack=.04 release=.6 fade=5 depth=1 skew=.02 width=.3 volume=-1.5 | pinned | knock | Short whispers on Ah, all air and a little chest
Steam above the choir | Cave chant | whisper=.8 ring=.75 mouth=.9 vowel=.4 closure=.3 attack=1.6 release=6 chest=.4 skew=.48 fade=14 volume=-2 | airy | nine | Air that rings at each key, wide open on Ah
Prayer said into cloth | Cave chant | whisper=.45 mouth=.3 vowel=.15 closure=.3 singers=2 width=.2 release=1.2 skew=.48 depth=.92 ring=.34 drift=.68 volume=3 | pillow | lament | Two covered airy voices, an octave below
Old men by the fire | Cave chant | roughness=.7 closure=.75 throat=.78 vowel=.3 drift=.7 singers=3 skew=.3 width=.82 mouth=.82 whisper=.24 chest=.85 fade=16 breath=.55 pace=.5 | hollow | cantus | Three uneven growling voices that wander, breathing in and out
Cracked and unashamed | Reed calf | throat=.85 division=Two turn=0 fade=11 roughness=.8 closure=.7 singers=1 vowel=.4 attack=.1 release=.8 skew=.36 chest=.52 drift=.42 volume=0 | combo | tenor | One very rough voice with an octave under it
Smoke in four throats | Cave chant | roughness=.5 whisper=.4 closure=.8 vowel=.55 turn=.5 pace=.8 throat=.95 skew=.42 width=.3 ring=.06 fade=9 volume=-0.5 | reel | turn | Smoky rough voices on Eh that turn lightly to the open tone
The eldest begins | Elephant dusk | breath=0 division=Three throat=.66 roughness=.9 vowel=.34 singers=1 attack=.15 chest=.6 release=2.5 depth=.92 drift=.52 width=.4 mouth=.85 fade=22 closure=.88 ring=.05 whisper=.24 skew=.64 volume=-1.5 | cellar | cantus | One very rough long throat on Ah over a twelfth
Growl for a low roof | Cave chant | division=Eight roughness=.6 closure=.65 vowel=.34 throat=.8 depth=.85 singers=2 skew=.1 width=.9 ring=.18 mouth=.96 volume=-3 | bulb | pair | Two voices that flutter eight to a group, rough and near
Jugs at the spring | Cave chant | throat=1.4 chest=.2 closure=.6 vowel=.42 singers=4 attack=.4 turn=.2 depth=.86 width=.25 ring=.4 volume=0.5 | hall | hum | Four small bright throats on Ah with an octave under
Daughters of the house | Cave chant | throat=1.55 vowel=.2 mouth=.6 closure=.45 chest=.3 whisper=.3 release=3 drift=.5 skew=.1 depth=.92 width=.55 roughness=0 ring=.06 volume=2.5 | chapel | hum | Small soft throats on Oh that wander a little
Shadow of high stalls | Open sky | division=Three throat=1.25 whisper=.15 turn=0 closure=.55 attack=.7 release=3 depth=.56 roughness=.17 chest=.25 ring=.12 mouth=.82 skew=.3 fade=17 volume=-0.5 | circle | air | Four high voices with a twelfth under each
Call from the ledge | Reed calf | throat=1.6 roughness=.1 division=Two closure=.72 vowel=.4 fade=9 turn=.3 pace=.5 attack=.08 skew=.28 drift=.38 mouth=.8 chest=.15 | repeats | call | A small hard throat on Ah with an octave below
Sisters in the stairwell | Cave chant | throat=1.3 vowel=.75 mouth=.9 closure=.5 singers=2 attack=.2 ring=.45 chest=.1 depth=.92 roughness=.02 whisper=0 fade=14 breath=.35 pace=.14 volume=3 | stair | pair | Two small throats wide open on Ee, breathing in and out
All breathe at the sign | Breathing together | vowel=.5 closure=.7 pace=.3 throat=1.05 chest=.75 whisper=.15 drift=.38 ring=.34 depth=.9 division=Three second=2 singers=3 volume=-3.5 | cave | turn | Three voices that breathe out on a twelfth and in on an octave
Sleeping novices | Breathing together | pace=.16 closure=.35 vowel=.08 mouth=.5 whisper=.5 release=6 skew=.3 depth=.74 drift=.45 fade=26 width=.65 chest=.1 | slowed | verse | Soft covered voices that breathe slowly as one | pad
Lungs of the hill | Breathing together | division=Four breath=.7 pace=.26 throat=.7 closure=.6 chest=.9 attack=.6 skew=.36 drift=.12 fade=26 roughness=0 | valley | floor | Two octaves of floor that swell and sink with the breath | drone
Sighs between verses | Breathing together | division=Three second=2 pace=.5 vowel=.46 attack=.4 release=2 closure=.55 singers=2 skew=.1 depth=.98 drift=.18 whisper=0 volume=1 | plate | lament | Two voices that sigh from a twelfth to an octave
Panting in the dark | Breathing together | pace=1.6 breath=.6 vowel=.36 closure=.65 singers=3 throat=.76 whisper=.5 attack=.1 release=.8 drift=.45 mouth=.74 roughness=0 fade=9 chest=.7 skew=0 volume=1 | shaft | sixths | Quick breaths of three voices, loud and then airy
Cantor alone | Bronze throat | closure=.64 vowel=.38 mouth=.7 throat=.86 attack=.18 release=1.6 drift=.4 turn=.1 skew=.02 chest=.85 volume=-9.5 | vib | cantus | One clear voice on Ah with an octave under it
A single lit face | Bronze throat | vowel=.24 closure=.48 chest=.7 throat=.8 attack=.3 release=2 width=0 whisper=.08 drift=.06 roughness=0 | centre | lament | One round voice on Oh, an octave below
He leans on the wall | Twelfth under | singers=1 closure=.6 vowel=.32 attack=.12 release=1 width=.2 roughness=.2 skew=.3 mouth=.56 drift=.14 volume=3.5 | booth | cantus | One slightly rough voice a twelfth over its shadow
Taper held upright | Bronze throat | division=Three vowel=.82 throat=1.2 closure=.9 chest=.15 attack=.25 release=3 mouth=1 skew=.28 width=.45 fade=9 whisper=.3 roughness=0 volume=6 | airy | lament | One thin hard voice on Ee, a twelfth over its floor
Nobody joins him | Bronze throat | depth=.5 closure=.4 vowel=.12 mouth=.4 chest=.5 attack=.5 release=3 singers=1 drift=.5 width=.9 roughness=.14 breath=.55 pace=.35 volume=1 | back | lament | One covered voice that breathes, half a floor under it
`,
    },
    {
      id: 'tuned-drips',
      name: 'Tuned drips',
      category: 'plucked',
      rows: `
Cistern by lamplight | Tuned drip | ring=.75 vowel=.52 throat=.85 release=4 chest=.3 mouth=.6 width=.82 drift=.14 singers=2 roughness=.35 skew=.4 depth=.78 whisper=.35 volume=5 | cave | points | Airy uneven drops of two voices on Ah, a few a second
Glass gutter | Tuned drip | ring=.9 vowel=.97 throat=1 closure=.3 mouth=.5 release=6 chest=.52 singers=2 width=.65 drift=.68 fade=10 volume=1.5 | airy | bells | Round ringing drops on Ue from two singers | bell
Drops on slate | Tuned drip | ring=.4 closure=.85 vowel=.55 throat=1.15 release=1 width=.9 chest=.32 roughness=.4 singers=2 depth=.9 mouth=.82 drift=.68 fade=11 volume=-1.5 | chamber | ost | Short hard drops that ring a little on Ah
Leak behind the panel | Tuned drip | ring=.55 mouth=.2 vowel=.1 throat=.7 closure=.4 chest=.6 width=.3 attack=.05 whisper=.25 singers=3 drift=.5 fade=16 | wall | stack | Round covered drops of three voices on Oo, a little airy
Counting the rain barrel | Tuned drip | ring=.7 mouth=.5 vowel=.95 fade=8 release=3 width=1 drift=.4 roughness=.2 volume=2 | stone | points | Half covered uneven drops on Ue that thin out as they go
Ticks in the rafters | Tuned drip | ring=0 closure=.7 skew=0 roughness=.2 throat=1.1 release=.4 mouth=.6 fade=11 volume=0 | bare | knock | Dry ticks with no ring at all, struck and gone
Beetle in the beam | Tuned drip | ring=.08 closure=.95 vowel=.6 roughness=.5 throat=1.4 depth=.95 chest=.15 mouth=.52 | wood | ost | Hard uneven ticks of a small throat on Ah | texture
Twig by twig | Creak piano | division=Drips ring=.15 fade=8 closure=.6 roughness=.6 vowel=.4 release=1 depth=.68 drift=.06 width=.25 mouth=.56 chest=.25 volume=-3.5 | dead | pair | Uneven dry pulses on Oh, each key at its own rate | texture
Engine gone cold | Tuned drip | ring=.2 vowel=.25 throat=.62 closure=.8 roughness=.35 chest=.7 mouth=.8 width=.3 | tube | understep | Slow hard knocks in a very long throat | texture
Fingernail on a gourd | Tuned drip | ring=.28 mouth=.35 vowel=.18 closure=.5 skew=.12 release=.8 fade=3 chest=.32 drift=.55 depth=.62 volume=2.5 | booth | knock | Short covered pulses that stop in three seconds
Four gutters at once | Tuned drip | singers=4 drift=.35 ring=.35 width=.75 vowel=.75 chest=.15 throat=1.3 skew=.35 depth=.75 closure=.65 mouth=.52 roughness=.24 volume=-2.5 | plate | verse | Drops of four small singers on Eh with some voice between
Shower over the yard | Tuned drip | singers=4 drift=.8 ring=.35 closure=.7 vowel=.5 throat=1.3 whisper=.15 mouth=.64 chest=.32 width=.82 depth=.7 | bright | stack | Short bright drops, four to a key and never in step | texture
Thaw from every eave | Tuned drip | singers=3 ring=.85 drift=.6 vowel=.7 mouth=.8 release=5 attack=.4 chest=.25 fade=9 whisper=.24 volume=5 | longplate | wide | Long drops of three singers that swell in and overlap | pad
Beads on many strings | Tuned drip | singers=4 drift=.15 ring=.5 fade=4 closure=.45 vowel=.15 throat=1 width=.55 mouth=.56 chest=.85 volume=2.5 | double | ripple | Round quick drops, four to a key, gone in four seconds
Crowd of small clocks | Tuned drip | singers=4 ring=.12 roughness=.1 closure=.8 vowel=.65 throat=1.6 chest=.05 mouth=.74 drift=.42 depth=.5 | tank | hum | Dry small ticks, four singers on each key | texture
Voice between drops | Tuned drip | turn=1 second=1 pace=.3 ring=.6 vowel=.38 attack=.1 singers=2 release=3 mouth=.76 chest=.52 fade=9 width=.82 throat=1.05 whisper=.3 volume=0 | melt | tenor | Drops that give way to the open voice and come back | voice
Drip that finds its note | Tuned drip | turn=1 second=2 pace=.6 ring=.5 closure=.65 vowel=.28 throat=.85 width=.75 volume=0 | darkplate | pair | Slow drops that turn to a sung octave below
Hesitant tap | Tuned drip | turn=.7 second=8 pace=1.2 ring=.7 vowel=.5 release=2 drift=.42 whisper=.3 chest=.85 volume=2 | repeats | knock | Drops that quicken to a flutter of eight and slow again
Someone hums at the sink | Tuned drip | turn=.5 second=1 pace=.14 ring=.45 mouth=.3 vowel=.08 closure=.4 attack=.3 width=.75 chest=.1 | pillow | tenor | Covered drops with half a hum mixed through | voice
The tap that gave up | Tuned drip | turn=1 second=4 pace=2.2 ring=.55 closure=.75 vowel=.44 throat=1.1 fade=10 drift=.3 volume=1 | spin | stack | Drops and a two octave rattle, changing over twice a second
Bucket on a long rope | Tuned drip | ring=.8 throat=.65 vowel=.05 closure=.35 mouth=.5 release=4 chest=.4 drift=.14 volume=-1 | crypt | lowline | Dark drops that ring low, on Oo in a long throat | bass
Boots on wet boards | Tuned drip | ring=.35 closure=.6 throat=.75 vowel=.3 fade=1.6 release=.5 width=.1 chest=.55 drift=.3 whisper=.3 | firm | walk | Short low drops that die within two seconds | bass
Pump below the stairs | Tuned drip | ring=.6 division=Eight closure=.3 mouth=.3 throat=.68 vowel=.02 release=1 width=0 | deep | understep | A dark pulse of eight under low keys, round and ringing | bass
Barrel tapped twice | Tuned drip | ring=.68 skew=.3 vowel=.2 throat=.8 roughness=.25 fade=5 release=2 singers=2 width=.4 mouth=1 volume=1 | slap | walk | Two singers of low drops, a little uneven | bass
Water under the street | Tuned drip | ring=.9 throat=.6 vowel=.12 mouth=.25 closure=.2 attack=.3 release=8 singers=2 chest=.52 width=.55 roughness=.24 volume=-10 | tunnel | floor | Muted low drops that run together into a hum | drone
Air in the pipe | Tuned drip | whisper=.7 ring=.7 vowel=.35 depth=.9 closure=.3 release=3 mouth=.8 throat=1.2 drift=.42 fade=14 volume=3.5 | throb | bells | Drops made mostly of breath, ringing at the key
Breath on a cold pane | Tuned drip | whisper=0.9 ring=.95 closure=.1 vowel=.97 throat=1.2 release=6 singers=2 depth=0.7 mouth=.88 chest=.52 width=.65 volume=-2 | mist | nine | Puffs of air that ring like thin glass on Ue | bell
Kettle on a low flame | Tuned drip | whisper=.85 ring=.25 vowel=.6 roughness=.5 throat=1.3 release=.8 volume=1.5 | reel | hum | Short uneven puffs of air on Ah, nearly no tone | texture
Seeds blown off a palm | Tuned drip | whisper=.9 ring=.5 skew=.5 singers=3 drift=.5 width=1 vowel=.2 attack=.2 volume=0.5 | flock | stack | Soft even puffs of three singers on Oh | texture
Snorkel | Tuned drip | whisper=.6 ring=.4 mouth=.15 vowel=.05 throat=.8 closure=.45 fade=7 chest=.32 volume=6 | under | one | Covered puffs and drops, slow and dark
Bell hung in a spout | Throat bells | division=Drips ring=1 depth=1 fade=12 vowel=.95 release=8 closure=.2 width=.9 roughness=0 chest=.25 drift=.3 whisper=.25 throat=.8 volume=4 | cath | points | Airy tones at the key's own harmonics, repeated slowly | bell
Icicles at noon | Throat bells | division=Drips ring=.92 throat=1.2 vowel=.72 singers=3 depth=.9 drift=.3 fade=30 closure=.3 width=.55 mouth=.7 chest=.7 volume=0.5 | dust | bells | High drops of three small throats on Eh, long rings | bell
Spoon along the railing | Throat bells | division=Eight ring=.8 depth=1 fade=2 vowel=.4 closure=.95 throat=1.2 release=2 skew=.1 width=.35 volume=0 | pinned | descend | A hard rattle of eight that rings and is gone in two seconds | bell
Wet bronze | Throat bells | division=Drips ring=.85 throat=.75 vowel=.3 closure=.6 fade=5 chest=.6 roughness=.2 depth=.62 width=.55 drift=.68 volume=5 | bowls | points | Dark struck drops on Oh in a long throat | bell
Chain of small cups | Throat bells | division=Drips ring=.7 vowel=.97 mouth=.6 depth=.85 singers=2 fade=30 release=3 turn=.4 second=1 pace=.5 chest=.15 whisper=.24 | tiles | ripple | Round drops on Ue, some plain tone between them | bell
Drops that swell first | Tuned drip | skew=.95 ring=.6 vowel=.3 closure=.6 release=3 mouth=.56 width=.55 drift=.42 roughness=.19 fade=10 volume=3.5 | bloom | bells | Each drop swells dark from nothing and is cut
Gutter run backwards | Tuned drip | skew=.85 ring=.3 closure=.8 vowel=.5 throat=1.2 singers=2 width=1 chest=.58 mouth=1 whisper=.24 volume=1 | rev | call | Pulses that rise and stop, two singers on Ah
Tide in a bottle | Tuned drip | skew=.7 ring=.8 mouth=.4 vowel=.1 closure=.35 attack=.5 release=5 whisper=.2 fade=9 width=.82 drift=.42 depth=.5 chest=.55 volume=0 | pot | lament | Round slow swells with a ring, on a covered Oo | pad
Pump handle at dawn | Tuned drip | skew=1 ring=.1 closure=.7 throat=.8 vowel=.42 roughness=.3 depth=1 mouth=.88 | combo | sixths | Dry swells cut off hard, uneven, in a long throat | texture
Lapping at the hull | Tuned drip | skew=.5 ring=.45 singers=3 drift=.5 vowel=.22 closure=.4 whisper=.3 depth=.8 mouth=.74 chest=.52 | water | turn | Even soft swells of three singers, never together | pad
A voice with a pulse | Tuned drip | depth=.6 ring=.1 vowel=.3 attack=.2 singers=1 closure=.75 release=2 throat=.75 whisper=.5 width=.65 mouth=.6 fade=10 volume=-1.5 | room | tenor | A breathy sung Oh with slow pulses that show through | voice
Ripple on a held note | Tuned drip | depth=.3 ring=.65 closure=.3 vowel=.12 mouth=.5 attack=.8 release=4 singers=3 chest=.15 breath=.35 pace=.18 volume=-1 | lush | wide | Round voices that barely pulse, with a ring, swelling and sinking | pad
Lantern swinging twice | Tuned drip | depth=.6 skew=.6 ring=.2 closure=.6 vowel=.64 throat=1.1 attack=.15 release=1.2 mouth=.8 chest=.32 width=.45 whisper=.3 roughness=.19 | trem | cantus | Voice on Eh that swells in slow groups | voice
Footsteps in a hum | Tuned drip | depth=.7 mouth=.05 ring=.5 chest=.7 throat=.75 closure=.4 attack=.4 drift=.42 fade=11 volume=-1.5 | cellar | lowone | A closed hum with slow steps knocking in it | drone
Half a drop short | Tuned drip | depth=.55 ring=.75 vowel=.45 fade=2.5 closure=.7 release=2 volume=1.5 | darkecho | descend | Plucked tones on Ah, a slow knock inside
Kalimba of throats | Creak piano | division=Drips ring=.8 fade=2 closure=.45 vowel=.24 roughness=.05 release=1.5 depth=.86 drift=.52 width=.35 chest=.32 volume=4 | held | ost | Single round drops that ring two seconds, plucked
Rain pan | Creak piano | division=Drips ring=.7 fade=1.2 closure=.7 vowel=.55 throat=1.4 roughness=.1 singers=2 width=.8 depth=.92 drift=.32 mouth=.82 whisper=0 | spring | bird | Quick bright drops of two singers, over in a second
Pebbles in a deep jar | Creak piano | division=Drips ring=.6 fade=.45 closure=.55 throat=.7 vowel=.1 mouth=.5 release=.5 chest=.7 width=.45 drift=.68 volume=6 | pot | knock | Short dark drops on Oo with some chest
Harp for a leaking roof | Creak piano | division=Drips ring=.95 fade=4.5 closure=.6 vowel=.4 roughness=0 release=4 drift=0 width=.25 mouth=.6 throat=.7 volume=5 | halo | ripple | Clean ringing drops on Oh that last four seconds
Last drop before frost | Creak piano | division=Drips ring=1 fade=7 closure=.3 vowel=.98 throat=1.25 release=8 mouth=.8 roughness=0 depth=.62 drift=.32 width=.82 chest=.32 volume=5 | shim | points | Soft thin drops on Ue with the longest ring | bell
`,
    },
    {
      id: 'twelfths-under',
      name: 'Twelfths under',
      category: 'pad',
      rows: `
Ferry lights going out | Twelfth under | closure=.4 vowel=.3 mouth=.75 attack=.9 release=5 skew=.72 width=.8 ring=.12 whisper=.45 chest=.9 singers=4 depth=.9 | darkhall | suspend | Airy voices whose groups of three swell, over a full chest
Wool over the window | Twelfth under | closure=.18 mouth=.45 vowel=.12 chest=.3 throat=1.1 singers=3 release=6 skew=.28 drift=.06 width=.35 roughness=.14 whisper=.35 ring=.7 depth=.6 fade=11 breath=.35 pace=.24 volume=-2.5 | warm | wide | Round airy voices that ring, half a twelfth under them, in slow breaths
Field before mowing | Twelfth under | closure=.75 vowel=.7 mouth=.75 singers=4 width=1 drift=.9 attack=.9 skew=.48 roughness=.35 throat=1 whisper=0 fade=14 volume=-1.5 | orbit | turn | Four edgy wide voices on Ee that wander over a twelfth
Engines off in harbour | Twelfth under | vowel=.2 ring=.7 closure=.3 attack=2 release=7 whisper=.3 skew=.1 width=.25 mouth=.56 depth=.62 | shore | stack | Airy round voices with a long ring, very slow to rise
Curtain of low sun | Twelfth under | vowel=.95 mouth=.75 closure=.5 attack=.8 release=3 ring=.4 throat=1 width=.82 fade=26 | mist | verse | Voices on Ue, open enough to shine, a twelfth below
Strings never strung | Twelfth under | closure=.7 skew=.5 ring=.15 vowel=.55 attack=.4 singers=3 roughness=.25 depth=.6 drift=.18 width=.82 mouth=.8 fade=26 breath=.45 pace=.24 volume=-1 | lush | verse | Edgy even groups on Eh that sound bowed, in slow breaths | string
Strings tuned in gloves | Twelfth under | closure=.78 vowel=.65 throat=1.15 attack=.12 release=.9 roughness=.35 singers=2 chest=.3 skew=.54 drift=.52 mouth=.94 fade=17 volume=2 | slack | pair | Rough bright tones on Ee that start quickly | string
Viol under the table | Twelfth under | closure=.6 vowel=.45 mouth=.5 throat=.85 attack=.2 release=1.2 singers=1 drift=.4 skew=.4 width=.45 roughness=.05 fade=14 volume=0 | wood | lament | One covered reedy line a twelfth over its floor | string
Long bows in unison | Twelfth under | closure=.55 skew=.6 singers=4 width=1 attack=1.1 release=4 vowel=.6 drift=.4 whisper=.05 | vib | turn | Four wide voices that swell in each group of three | string
Rosin on old wood | Twelfth under | closure=.85 roughness=.5 ring=.3 vowel=.35 throat=.75 attack=.25 release=1.5 depth=1 skew=.02 width=.35 fade=9 volume=-0.5 | cellar | tenor | A rough dark growl with all three pulses bared | string
Pipes of one colour | Twelfth under | drift=0 singers=1 closure=.4 ring=.8 attack=.04 release=.5 vowel=.1 whisper=.05 width=.4 skew=.54 mouth=.6 chest=.25 | chapel | wide | Still round tones that ring, quick to start and stop | organ
Left hand on the reeds | Twelfth under | drift=0 singers=1 closure=.8 ring=.35 attack=.03 release=.3 vowel=.7 chest=.3 depth=1 width=.25 mouth=.56 throat=1.32 whisper=.3 volume=0 | chorale | tenor | Still hard reeds on Ee over a bared twelfth | organ
Positive in the loft | Twelfth under | drift=.05 singers=2 closure=.55 attack=.06 release=.4 vowel=.85 throat=1.3 ring=.6 chest=.2 skew=.3 width=.9 volume=-2 | hall | pair | Small still bright pipes over a twelfth | organ
Bellows half empty | Twelfth under | singers=2 drift=.3 closure=.4 whisper=.5 attack=.15 release=1 vowel=.25 breath=.4 pace=.35 skew=.42 width=.35 roughness=.05 fade=9 volume=-2 | lungs | turn | Breathy pipes whose air comes and goes | organ
Harmonium under a quilt | Twelfth under | singers=3 drift=.2 closure=.65 mouth=.25 vowel=.5 attack=.1 release=.6 chest=.6 ring=.2 skew=.48 roughness=.02 whisper=.24 | cassette | suspend | Covered reeds, three to a key, a twelfth below | organ
Lamp between two rooms | Twelfth under | second=2 turn=1 pace=.2 closure=.45 vowel=.3 skew=.36 width=.55 mouth=.95 roughness=.05 throat=1.32 drift=.68 whisper=0 fade=12 volume=-1 | prism | verse | The floor goes from a twelfth to an octave and back
Quick change of floor | Twelfth under | second=2 turn=.9 pace=1.5 closure=.5 vowel=.5 attack=.2 release=1.5 width=.45 mouth=.5 throat=1.2 drift=.04 roughness=.03 volume=-0.5 | bright | stack | A twelfth and an octave that change three times in two seconds
Second cellar | Twelfth under | second=6 turn=1 pace=.14 closure=.42 vowel=.2 chest=.8 attack=1.2 release=5 skew=.3 width=.8 mouth=.74 roughness=.14 whisper=.35 throat=.75 drift=.14 fade=9 volume=-2 | crypt | wide | A twelfth below that drops to the octave under it
Shiver under the door | Twelfth under | second=8 turn=.8 pace=.4 closure=.6 vowel=.36 depth=.95 ring=.3 skew=.36 width=.35 mouth=.8 drift=.68 volume=0.5 | darkecho | nine | A twelfth that breaks into a slow flutter by turns
Floor that forgets | Open sky | second=3 turn=1 pace=.18 closure=.45 whisper=.15 singers=3 depth=.74 roughness=.14 chest=.1 fade=16 volume=1 | longplate | stack | Open voices that find a twelfth below and lose it
Ember ring | Twelfth under | fade=4 attack=.3 closure=.5 vowel=.4 ring=.5 release=3 skew=.02 drift=.45 mouth=.5 roughness=0 volume=2 | embers | descend | Voices on Ah that glow and fade over four seconds
Pad that leaves the room | Twelfth under | fade=7 attack=.5 closure=.35 vowel=.15 singers=4 width=1 release=4 skew=.42 drift=.18 chest=.25 volume=5 | airy | wide | Four round voices that sink to a little of themselves
Handle let go slowly | Twelfth under | fade=10 attack=.01 closure=.65 vowel=.3 ring=.4 release=2.5 skew=.05 roughness=.14 drift=.14 chest=.85 volume=2.5 | plate | sixths | Quick to speak, then sinking to a held tone over a twelfth | keys
Slow leak of light | Twelfth under | fade=5.5 attack=1.2 closure=.4 vowel=.75 throat=1.2 release=5 mouth=.95 ring=.06 depth=1 whisper=.06 roughness=.19 | dust | nine | Thin voices on Ee that rise slowly and sink again
Afternoon runs out | Twelfth under | fade=5 attack=.08 closure=.3 vowel=.02 ring=.65 release=4 mouth=.6 drift=.06 width=.82 roughness=.17 volume=0.5 | half | ripple | Soft round tones on Oo that die in five seconds | keys
Match in a hangar | Twelfth under | throat=1.5 vowel=.4 closure=.55 chest=.9 singers=2 attack=.6 skew=.48 drift=.45 mouth=.72 roughness=.05 fade=15 whisper=.24 volume=-1 | darkplate | air | Small bright throats over a full chest
Poplar and its shadow | Twelfth under | throat=1.3 vowel=.8 closure=.7 depth=1 chest=.5 attack=1 release=4 singers=4 drift=.45 width=.65 mouth=.88 ring=.18 volume=-2.5 | glim | hum | Four hard thin voices on Ee with the twelfth laid bare
Reedbed after dark | Twelfth under | throat=1.65 vowel=.6 whisper=.35 closure=.4 singers=3 drift=.8 attack=.7 release=5 skew=.54 width=.82 mouth=.6 fade=18 volume=-2.5 | flock | air | Small airy throats that wander far from the key
Sea kept in a shell | Twelfth under | throat=1.2 mouth=.15 vowel=.5 ring=.6 closure=.5 attack=.9 release=4 skew=.42 width=.25 depth=.5 chest=.85 fade=16 volume=-1 | shallow | hum | Nearly shut small throats with a ring
Sparrows over the nave | Twelfth under | throat=1.4 vowel=.3 closure=.6 attack=.3 release=2 turn=.6 pace=2.5 chest=.1 singers=1 skew=.02 drift=.38 width=.35 mouth=.6 fade=18 whisper=.3 roughness=.19 volume=-2 | cath | air | One small voice that flickers off its floor and on
Peat | Twelfth under | throat=.64 vowel=.03 closure=.2 mouth=.35 chest=1 attack=1.8 release=7 singers=2 drift=.06 width=.25 ring=.12 volume=-17.5 | deep | floor | Very long dark throats, hardly a vowel, all chest | drone
Collar turned up | Twelfth under | throat=.7 vowel=.3 closure=.4 chest=.7 whisper=.2 width=.4 attack=.5 release=2 drift=.32 mouth=.74 roughness=.17 ring=.12 | reel | tenor | Dark breathy voices close to the middle
Turnips in the dark | Twelfth under | throat=.68 vowel=.15 closure=.5 roughness=.3 ring=.5 attack=.7 release=3 singers=3 skew=.02 drift=.52 width=.82 fade=18 chest=.25 volume=-2.5 | cellar | wide | Three long rough throats that ring a little
Snow on the stove pipe | Twelfth under | throat=.75 vowel=.25 mouth=.6 closure=.3 depth=.5 attack=1.5 release=5 skew=.02 width=.7 roughness=0 fade=18 ring=.05 whisper=.45 breath=.4 pace=.12 chest=.85 volume=-2 | shade | wide | Dark airy voices with half a twelfth, in slow breaths
Stone under the moss | Twelfth under | throat=.8 vowel=.08 closure=.62 depth=1 ring=.75 chest=.4 attack=1 release=6 skew=.02 drift=.45 width=.9 roughness=.14 volume=-2.5 | crypt | stack | The bare twelfth, ringing under dark Oh voices
Veil over the fifth | Twelfth under | whisper=.6 closure=.25 vowel=.3 attack=1.5 singers=4 width=1 release=6 skew=.42 drift=.38 volume=-0.5 | fog | turn | Four voices, half of them air, over a twelfth
Wind finds the gap | Twelfth under | whisper=.8 ring=.6 vowel=.55 closure=.3 attack=1 release=5 throat=1.1 skew=.42 width=.45 mouth=.6 fade=11 volume=-0.5 | valley | stack | Air on Eh that rings at the key over a twelfth
Curtain, open window | Twelfth under | whisper=.5 vowel=.2 closure=.4 turn=1 pace=.35 second=1 attack=.8 depth=.95 skew=.3 width=.55 ring=.06 fade=17 | pan | nine | Airy voices whose floor is let in and shut out
Dust in the organ | Twelfth under | whisper=.7 closure=.55 vowel=.75 attack=.2 release=1.2 ring=.3 singers=1 drift=.05 skew=.3 width=.35 volume=0.5 | even | suspend | Hissing still pipes on Ee, a twelfth below | organ
Morning has no edges | Twelfth under | whisper=.4 mouth=.95 vowel=.42 closure=.15 singers=4 drift=.7 width=1 attack=2.4 release=8 skew=.42 roughness=0 fade=15 volume=-2.5 | half | wide | Wide open very soft voices that take two seconds to rise
Breathing in threes | Twelfth under | breath=.8 pace=.22 closure=.4 vowel=.3 attack=.6 release=4 singers=3 skew=.1 width=.35 mouth=1 roughness=.19 volume=-2.5 | loop | turn | Three voices that breathe together on a twelfth
Sea wall at slack tide | Twelfth under | breath=.5 pace=.1 closure=.5 vowel=.14 mouth=.6 whisper=.3 attack=1 release=5 drift=.38 width=.45 roughness=.05 chest=.1 skew=0 volume=0 | surf | verse | A slow single breath under soft voices on Oh
Bellows in the next yard | Twelfth under | breath=.35 pace=.6 closure=.7 vowel=.6 attack=.08 release=.4 singers=3 drift=.5 width=.25 mouth=.6 skew=.6 volume=0.5 | wall | pair | Reedy voices that sway with the bellows | organ
Lull between engines | Twelfth under | breath=.9 pace=.4 second=4 closure=.45 vowel=.4 attack=.3 release=2 chest=.8 skew=.1 drift=.45 width=.35 mouth=.8 roughness=.14 fade=9 depth=.5 volume=-2 | sines | nine | Breathes out on a twelfth and in at two octaves down
Pulse of the moored boat | Twelfth under | breath=.6 pace=1.1 closure=.3 vowel=.05 mouth=.4 attack=.5 release=3 drift=.32 throat=1.2 volume=1.5 | deepsea | wide | Covered voices that swell about once a second
Lamp passing upstairs | Twelfth under | vowel=.5 closure=.6 ring=.9 attack=.5 release=6 singers=2 depth=.9 skew=.1 drift=.18 width=.82 throat=.7 fade=12 volume=-2 | stairs | stack | Voices that ring smooth as glass over their floor
Green bottle by the weir | Twelfth under | vowel=.1 ring=1 closure=.2 whisper=.35 attack=.25 release=3 singers=1 drift=.15 skew=.42 width=.35 mouth=.8 throat=.7 chest=.25 volume=-2 | pot | lament | One breathy tone that is nearly all ring | wind
Choir behind the hill | Twelfth under | vowel=.36 singers=4 drift=.9 closure=.5 width=1 attack=1.2 release=5 mouth=.7 fade=18 ring=.34 throat=.78 roughness=.24 volume=-1.5 | back | wide | Four voices that drift wide apart on Ah | voice
Two lamps and a bell | Twelfth under | vowel=.65 closure=.8 fade=6 attack=.01 ring=.85 release=5 mouth=.9 depth=.6 skew=.14 width=.45 volume=-1 | bowls | descend | Hard ringing tones on Ee, struck over a soft twelfth | bell
Under the long bridge | Twelfth under | vowel=.52 skew=1 closure=.5 depth=1 attack=1 release=4 throat=1.15 width=.75 mouth=.95 roughness=0 ring=.75 volume=-2.5 | bloom | turn | Ringing groups of three on Eh that swell and are cut
`,
    },
    {
      id: 'whispering-floors',
      name: 'Whispering floors',
      category: 'texture',
      rows: `
Draught by the skirting | Whisper floor | vowel=.04 mouth=.6 ring=.3 attack=.8 release=4 chest=1 skew=.1 drift=.45 roughness=.17 fade=18 width=.3 closure=.4 | warm | suspend | Dark breath on Oo with a chest floor an octave below | pad
Snow pressing the glass | Whisper floor | vowel=.5 closure=.2 chest=.3 attack=2.2 release=7 singers=4 drift=.38 mouth=.88 roughness=.02 width=.82 depth=.7 skew=0 | mist | wide | Four soft voices of air on Eh, slow to rise | pad
Ah, hardly said | Whisper floor | vowel=.4 mouth=.95 whisper=.85 ring=.6 attack=.9 depth=.6 skew=.48 drift=.52 roughness=.05 fade=16 volume=-1.5 | airy | turn | Wide open air on Ah that rings softly at each key | pad
Linen on a line | Whisper floor | vowel=.95 whisper=.75 turn=1 pace=.3 attack=.7 release=3 ring=.2 width=.55 closure=.66 | fog | stack | Air on a rounded Ue whose floor flaps open and shut | pad
Frost on the inside | Whisper floor | vowel=.66 throat=1.35 whisper=.8 ring=.8 chest=.1 attack=1.4 release=6 skew=.48 drift=.12 roughness=.14 mouth=.82 closure=.4 volume=0.5 | shim | hum | Thin small breath that rings high at each key | pad
Blown across a bottle | Whisper floor | ring=.95 singers=1 vowel=.1 turn=0 attack=.12 release=1.2 whisper=.8 width=.3 closure=.2 skew=.42 mouth=.74 throat=1.2 chest=.1 fade=11 volume=5 | bare | lament | One breathy tone on Oo, nearly all ring | wind
Thumb half off the pipe | Whisper floor | ring=.7 singers=1 vowel=.55 turn=.6 pace=2 attack=.06 release=.6 whisper=.6 closure=.6 throat=1.2 skew=.36 drift=.38 mouth=.5 roughness=.17 fade=26 width=.65 depth=.7 chest=.25 volume=4 | room | call | A small airy reed that flips off its octave twice a second | wind
Flute in a dry valley | Whisper floor | division=One ring=1 singers=1 vowel=.3 attack=.1 release=1.5 whisper=.7 chest=.1 turn=0 closure=.15 width=.45 mouth=1 volume=1 | valley | cantus | One ringing breath with nothing under it | wind
Hiss over the reeds | Whisper floor | ring=.85 singers=1 vowel=.8 turn=0 attack=.05 release=.8 whisper=.9 closure=.7 throat=1.1 roughness=.4 skew=.48 drift=.45 width=.3 depth=.7 volume=6 | repeats | call | A hissing bright pipe on Ee, rough at its edge | wind
Pipes tied in a pair | Whisper floor | division=Three ring=.9 singers=2 vowel=.2 turn=0 attack=.15 release=1 whisper=.65 drift=.5 chest=.4 skew=.42 throat=1.32 roughness=.24 volume=3.5 | stair | pair | Two airy pipes on Oh over a twelfth | wind
Keep it quiet | Whisper floor | attack=.02 fade=2.5 release=0.7 ring=.1 vowel=.6 singers=1 depth=1 skew=0 drift=.12 roughness=0 width=.55 closure=.15 volume=-8.5 | pinned | sixths | Short close whispers on Eh | keys
Secret told again | Whisper floor | attack=.01 fade=2.2 release=.6 ring=.4 vowel=.3 throat=1.2 singers=2 whisper=.85 skew=.28 mouth=.8 roughness=.17 width=.45 drift=.68 volume=3 | mirror | ripple | Quick soft puffs on Ah that ring a little | plucked
Pages by lamplight | Whisper floor | attack=.03 fade=4 release=.5 skew=.9 vowel=0.9 whisper=1 roughness=0.2 chest=.1 depth=0.5 throat=0.75 mouth=.74 width=.75 closure=.28 volume=-8 | pinned | pair | Puffs of air on Ue that swell and stop, from a long throat
Match behind a hand | Whisper floor | attack=.008 fade=2.5 release=.3 whisper=1 vowel=.5 throat=1.5 ring=.2 chest=0 drift=.06 mouth=.56 volume=-10 | pinned | bells | Small hisses of a little throat, gone in a moment | plucked
Felt shoes | Whisper floor | attack=.02 fade=3 release=1 vowel=.02 mouth=.4 throat=.7 chest=1 whisper=.7 ring=.3 skew=0 width=.4 | cellar | walk | Soft dark breath steps with a full chest under them | bass
Asleep in the next bed | Whisper floor | breath=.9 pace=.25 turn=0 vowel=.12 mouth=.5 attack=.4 release=2 singers=1 skew=.42 drift=.06 roughness=.17 width=.55 closure=.66 fade=12 volume=-1.5 | wall | one | One sleeper's slow breath, dark on Oh
Dog by the hearth | Whisper floor | division=Shared breath=.7 pace=.35 turn=0 vowel=.45 whisper=.7 throat=.8 attack=.3 release=1.5 skew=.36 drift=.38 mouth=.95 roughness=.17 chest=.1 closure=.28 fade=11 volume=-5.5 | wood | suspend | A purring breath shared by all keys, in and out
Ward before dawn rounds | Whisper floor | breath=1 pace=.18 singers=4 drift=.9 vowel=.3 whisper=.9 attack=.5 release=4 skew=.42 mouth=.8 roughness=0 width=.75 closure=.75 fade=17 | empty | stack | Four loose sleepers who breathe out full and in thin
Winded on the landing | Whisper floor | breath=.8 pace=1.2 vowel=.4 whisper=.85 attack=.15 release=.7 throat=1.1 singers=1 skew=.02 mouth=.74 roughness=0 drift=.14 closure=.75 volume=-1.5 | stair | pair | One quick tired breath on Ah, about once a second
Bellows beside the bed | Whisper floor | breath=1 pace=.45 second=4 vowel=.05 mouth=.3 whisper=.75 closure=.5 throat=.7 attack=.1 skew=.1 drift=.12 roughness=0 width=.45 volume=0 | tube | understep | Dark breath that drops to two octaves down as it draws in
Wind off the moor | Whisper floor | whisper=1 roughness=.8 vowel=.35 drift=.9 singers=4 depth=.4 attack=1.2 release=5 skew=.54 mouth=.8 closure=.75 fade=14 | drift | turn | Rough loose air on Ah with little floor under it
Gale in the keyhole | Whisper floor | whisper=.95 ring=.85 vowel=.7 throat=1.3 roughness=.6 drift=.7 attack=.6 release=2 chest=.1 skew=.42 mouth=.56 width=.45 closure=.15 volume=2.5 | tunnel | one | A rough whistling small breath that wavers round the key
Sea caves exhaling | Whisper floor | breath=.7 pace=.12 whisper=.9 vowel=.08 throat=.66 chest=1 attack=1 release=6 drift=.32 mouth=.8 width=.65 closure=.4 volume=-10.5 | surf | floor | Long dark breath through a huge throat
Dust behind the shutters | Whisper floor | whisper=1 vowel=.85 roughness=1 ring=0 depth=1 attack=.8 release=2.5 chest=.4 division=Eight mouth=.82 drift=.14 volume=1 | wall | turn | Dry rough air on Ue that flutters in eights
Pines after the gust | Whisper floor | whisper=1 closure=.05 vowel=.58 drift=1 singers=4 attack=4.2 release=8 ring=.5 skew=.3 throat=1.2 mouth=.6 chest=.55 | water | nine | Air on Eh that takes four seconds to arrive | pad
Hush on the top shelf | Whisper floor | vowel=.82 whisper=.9 throat=1.5 depth=.7 attack=.7 release=3 chest=0 singers=3 mouth=.8 roughness=.17 drift=.42 closure=.66 volume=4 | shade | hum | High thin air of three small throats on Ee
Silver paper, unfolded | Whisper floor | vowel=.72 whisper=.8 closure=.8 ring=.5 roughness=.3 throat=1.2 attack=.3 release=2 drift=.12 depth=.7 volume=-1 | fold | stack | Edged air between Eh and Ee, a hard tone in it
Nettles in a breeze | Whisper floor | vowel=.3 whisper=1 division=Eight skew=.9 depth=1 ring=.3 throat=.7 attack=.5 release=2 drift=.32 roughness=.7 width=.8 chest=.55 fade=11 volume=-2 | pan | sixths | Rough dark air that swells in eights
Steam iron on silk | Whisper floor | vowel=.6 whisper=1 ring=.1 attack=.2 release=.8 fade=5 chest=.2 depth=.2 singers=1 drift=.32 mouth=.56 roughness=.14 closure=.15 volume=0.5 | glacial | turn | Plain air on Eh that thins out over five seconds
Salt blown over ice | Whisper floor | vowel=.78 whisper=.7 ring=1 throat=1.6 attack=.15 release=7 closure=.3 chest=0 skew=.3 drift=.18 mouth=.8 volume=6 | dust | high | Faint breath that leaves a long glassy ring | bell
The second choir, gone | Whisper floor | whisper=.75 closure=.5 vowel=.6 singers=4 drift=.6 attack=1 release=5 turn=.5 mouth=.56 roughness=.17 division=Four second=2 pace=.12 throat=1.1 skew=.72 volume=-2 | cath | verse | Four voices, mostly air, whose low floor swells and stops | voice
Vespers out of breath | Whisper floor | whisper=.75 mouth=.3 vowel=.2 singers=3 attack=.5 release=2 fade=7 closure=.4 skew=.54 drift=.52 depth=.7 volume=4 | chapel | wide | Three covered whispering voices that sink as they are held | voice
Faces behind gauze | Whisper floor | whisper=.5 vowel=.45 closure=.3 throat=1.3 singers=4 width=.45 attack=1.3 release=4 division=One depth=.65 drift=.12 mouth=.76 roughness=0 fade=10 | mist | hum | Small airy open voices with no floor under them | voice
Murmur at the partition | Whisper floor | whisper=.55 mouth=.12 vowel=.6 closure=.5 singers=2 attack=.15 release=.8 roughness=.2 skew=.54 drift=.32 width=.82 volume=-1 | wall | pair | Shut airy voices that murmur, a little rough | voice
They talk of rain | Whisper floor | whisper=.65 vowel=.5 turn=1 second=3 pace=1.6 attack=.1 release=1 singers=2 drift=.5 throat=.95 fade=12 width=.82 mouth=.6 roughness=.19 skew=.42 closure=.28 volume=-1 | rain | pair | Two airy voices that flip between an octave and a twelfth | voice
Moth against the lamp | Whisper floor | division=Eight skew=.6 whisper=.85 vowel=.5 depth=0.6 attack=.2 release=1.5 ring=.15 throat=1.3 singers=3 drift=.38 mouth=.6 roughness=0 volume=1.5 | held | one | Soft flutters of air, eight to the group
Wings folded and shaken | Whisper floor | division=Eight whisper=.9 skew=.05 turn=1 second=1 pace=.7 vowel=.3 attack=.15 release=1.2 width=1 drift=.38 roughness=0 closure=.4 | flock | stack | Struck flutters of air that turn to plain breath
Cards riffled slowly | Whisper floor | division=Eight whisper=1 skew=0 ring=0.15 fade=3 attack=.01 release=.4 vowel=.65 chest=.1 depth=0.5 throat=0.8 drift=.52 mouth=.5 roughness=0 volume=-8 | pinned | descend | Dark riffles of air from a long throat, gone in three seconds | plucked
Bees behind the plaster | Whisper floor | division=Shared whisper=.5 closure=.7 vowel=.1 mouth=.4 roughness=.5 attack=.8 release=3 chest=.5 skew=.3 drift=.12 width=.65 throat=.78 volume=-1.5 | pillow | wide | A covered buzz and breath on one shared pulse
Rope on a bollard | Whisper floor | division=Eight second=4 turn=1 pace=.25 whisper=.7 roughness=.7 throat=.75 closure=.6 ring=.1 skew=.3 width=.65 mouth=.82 | iron | lowpair | Creaking breath that turns from eights to fours
Ring around a whisper | Whisper floor | ring=1 vowel=.36 whisper=.95 attack=.5 release=9 chest=.4 depth=.8 drift=.12 mouth=.95 roughness=.14 closure=.15 volume=2 | longplate | points | Breath that leaves each key ringing long | bell
Breath made of glass | Whisper floor | ring=.92 division=One whisper=.9 vowel=.6 closure=.1 attack=.03 fade=4 release=6 throat=1.3 singers=2 depth=.4 mouth=.8 roughness=.17 volume=-4 | pinhall | bells | Puffs that ring four seconds with nothing under them | bell
Struck with a feather | Whisper floor | ring=.8 whisper=.85 attack=.01 fade=3 release=3 vowel=.25 depth=0.3 chest=.6 drift=.12 mouth=.8 width=.82 throat=.7 volume=-6.5 | pinroom | ripple | Soft breathy plucks that ring on Oh | plucked
Bowl of breath | Whisper floor | ring=.9 division=Four whisper=.85 vowel=.15 throat=.8 attack=.2 release=8 turn=0 chest=.5 skew=.36 drift=.45 mouth=.95 fade=16 volume=0 | bowls | lowpair | Breath that rings two octaves down | bell
Whistle behind teeth | Whisper floor | ring=.75 whisper=.95 vowel=0.96 mouth=.3 throat=1.2 attack=.08 release=.7 singers=1 turn=0 drift=.32 roughness=0 width=.82 depth=.5 skew=.42 closure=.75 volume=0 | slap | bird | A covered hissing whistle on Ue | wind
Air below the joists | Whisper floor | division=Four turn=1 throat=.64 vowel=.4 whisper=.3 mouth=.3 chest=1 attack=1 release=5 closure=.7 skew=.02 drift=.12 roughness=0 ring=.8 second=6 pace=.35 | crypt | floor | A ringing floor two octaves down that sinks another fifth | drone
Tide below the pier | Whisper floor | division=Four second=2 turn=1 pace=.15 whisper=.8 vowel=.1 chest=.9 throat=.75 attack=1.5 release=6 skew=.54 mouth=.74 fade=9 width=.55 drift=.14 roughness=.19 closure=.75 volume=3 | lungs | lowone | Low breath that rises from two octaves to one | drone
Boiler room, weekend | Whisper floor | division=Shared whisper=.8 closure=.5 vowel=.28 throat=.6 turn=0 attack=1.2 chest=.8 drift=.1 skew=.02 mouth=.5 fade=22 roughness=0 | deep | floor | A long throat of warm air on one slow pulse | drone
Feet on a warm grating | Whisper floor | division=Eight turn=0 whisper=.75 vowel=.2 throat=.68 roughness=.4 ring=.5 attack=.8 release=4 width=.6 mouth=.95 drift=.42 chest=.7 skew=0 closure=.15 volume=-3 | shaft | lowone | Rough low breath three octaves under the key | drone
Nothing but the room | Whisper floor | depth=0 turn=0 whisper=1 vowel=.18 mouth=.2 ring=.65 chest=.2 attack=3.5 release=6 drift=.45 fade=9 closure=.66 breath=.35 pace=.18 volume=3 | back | one | Covered air and its ring, no floor at all, each breath its own swell | drone
`,
    },
    {
      id: 'ground-pedals',
      name: 'Ground pedals',
      category: 'bass',
      rows: `
Anchor let down | Sub pedal | closure=.3 vowel=.1 mouth=.35 attack=.02 release=.5 chest=.9 skew=.3 depth=.95 width=.3 roughness=.05 division=Shared whisper=.1 ring=.3 volume=-2 | bare | lowline | A closed low purr on one pulse
Keel over gravel | Sub pedal | closure=.5 vowel=.2 throat=.75 attack=.06 release=1.2 width=.4 singers=2 skew=.3 ring=.4 roughness=.4 volume=-13.5 | firm | deepcall | Two rough voices over a firm two octave floor
Plumb bob at rest | Sub pedal | closure=.08 mouth=.15 vowel=0 ring=.7 chest=.5 attack=.015 release=.3 width=0 skew=.28 depth=.56 throat=.66 drift=.3 | centre | walk | A smooth shut hum that rings two octaves down
Ballast taken on | Sub pedal | closure=.6 vowel=.4 mouth=.9 chest=1 attack=.1 release=2 whisper=.1 skew=.54 depth=.92 width=.2 ring=.55 division=Two throat=.6 drift=.3 volume=-11.5 | deep | understep | A wide open low Ah with its weight in the chest
Cellar key | Sub pedal | closure=0.68 vowel=.5 throat=.95 attack=.03 release=.6 ring=.3 skew=.42 depth=.98 width=.3 whisper=.3 roughness=.03 | cellar | lowline | A drier throat on Oh with a tight fold, two octaves down
Thumb on a slack string | Sub pedal | fade=1.5 attack=.008 ring=.45 closure=.4 vowel=.25 release=.4 chest=.6 skew=.1 width=.5 throat=.66 drift=.55 volume=0 | deck | walk | A pluck of two octaves that dies in a second and a half
Bass by the stage door | Sub pedal | fade=2.5 attack=.01 closure=.4 vowel=.5 skew=.05 roughness=0.25 release=.5 ring=.6 mouth=.5 depth=.98 width=.4 division=Three drift=.68 volume=-2 | wood | walk | Plucked ringing low tones on Eh over a twelfth
Dropped in a bucket | Sub pedal | division=Eight fade=.9 attack=.008 ring=.6 closure=.35 release=.3 vowel=.15 depth=.86 width=.1 roughness=.17 drift=.55 whisper=.24 volume=3 | held | walk | Short round thuds three octaves under the key
Soft mallet, floor drum | Sub pedal | fade=.6 attack=.008 closure=.15 mouth=.3 chest=1 release=.8 vowel=0 throat=.7 ring=.2 skew=.28 depth=.56 roughness=.02 volume=-2.5 | room | understep | A dull soft thump, nearly all chest
Tuned step | Sub pedal | division=Two fade=3.5 attack=.01 ring=.75 closure=.45 vowel=.4 release=.8 mouth=.55 depth=.62 width=.2 roughness=.02 drift=.42 volume=2 | darkplate | walk | Ringing plucks on Ah with one octave under them
Brass at the bottom | Bronze throat | division=Two closure=.95 throat=.62 vowel=.6 chest=.7 attack=.05 release=.6 mouth=.9 skew=.04 width=.4 ring=0 drift=.68 depth=.7 roughness=.03 | valve | lowline | A very tight long throat on Eh over one octave
Horn of a slow barge | Bronze throat | division=Three closure=.85 throat=.62 vowel=.32 attack=.15 release=1 ring=.2 depth=1 chest=.6 roughness=.15 mouth=.55 skew=.45 drift=.04 volume=-1.5 | valley | lowarch | A huge tight throat on Ah over a bare twelfth
Tuba in a raincoat | Bronze throat | closure=.55 throat=.66 vowel=.05 mouth=.3 attack=.05 release=.4 chest=.8 fade=9 drift=.12 width=.3 roughness=.02 skew=.42 volume=-0.5 | dead | walk | Covered low brass with an octave below
Bass reed, slow player | Reed calf | throat=.7 roughness=.2 fade=30 turn=0 closure=.75 vowel=.35 attack=.06 release=.5 division=Four chest=.6 skew=.04 depth=.56 width=.3 mouth=.95 volume=-7.5 | reel | deepcall | A hard reedy bass on Oh, two octaves under
Throat of the tunnel | Bronze throat | division=Eight closure=.85 throat=.6 vowel=.4 attack=.1 release=1.2 roughness=.2 width=.4 mouth=1 whisper=.24 depth=.75 ring=.3 volume=-2 | tunnel | deepcall | A hard rattling low voice, eight pulses a group
Growl kept on a chain | Elephant dusk | breath=0 closure=.6 roughness=.8 vowel=.2 attack=.05 release=.6 singers=1 width=.2 throat=.7 skew=.3 depth=.86 drift=.12 | iron | lowline | One rough growl two octaves down, quick and near
Engine under the jetty | Elephant dusk | breath=0 division=Shared roughness=.5 closure=.5 attack=.2 release=1 vowel=.05 throat=.64 singers=2 skew=.54 drift=.38 width=.1 mouth=.82 depth=.9 volume=-6.5 | under | lowpair | A rough muffled throb on one slow pulse
Rust in the low pipe | Elephant dusk | breath=0 turn=0 roughness=1 closure=.8 ring=.5 vowel=.55 throat=.7 attack=.1 release=1.5 singers=1 depth=.86 drift=.32 mouth=.88 | tank | lowone | The roughest low tone, ringing on Ah
Bear turns over | Elephant dusk | breath=.6 pace=.5 roughness=.4 throat=.6 vowel=.1 attack=.2 release=1.5 closure=.45 mouth=.4 skew=.42 depth=.74 drift=.38 volume=-6 | cave | lowpair | A low covered growl that swells each two seconds
Mill wheel, half load | Elephant dusk | breath=0 division=Eight turn=1 second=4 pace=1 roughness=.35 closure=.6 attack=0.2 release=1.6 vowel=.3 throat=.75 skew=.5 drift=.52 width=.4 mouth=.5 fade=30 whisper=.3 depth=.62 volume=-3 | combo | understep | Rough pulses that go from eights to fours and back each second
Rolling low door | Sub pedal | second=2 turn=1 pace=.8 closure=.4 vowel=.2 mouth=.55 singers=2 width=.5 skew=.02 roughness=.14 drift=.42 | throb | understep | A floor that rolls between two octaves and one
Mud under the keel | Sub pedal | division=Two second=5 turn=1 pace=.3 closure=.5 vowel=.35 mouth=.65 attack=.1 skew=.3 depth=.62 width=.3 volume=-4 | hall | lowarch | An octave below that turns to a five pulse growl
Trill in the cellar | Sub pedal | second=3 turn=1 pace=4 closure=.45 vowel=.3 mouth=.6 attack=.02 release=.4 fade=8 skew=.1 depth=.68 roughness=.14 ring=.06 drift=.3 volume=-1.5 | plate | lowline | Two octaves and a twelfth that trade four times a second
Six fathoms | Sub pedal | division=Three second=6 turn=1 pace=.2 closure=.25 chest=.9 attack=.3 release=2 skew=.54 width=.5 roughness=.02 ring=.34 | darkhall | deepcall | A twelfth below that sinks another octave and returns
Lopsided wheel | Sub pedal | division=One second=7 turn=.9 pace=.5 closure=.55 vowel=.4 mouth=.7 attack=.06 release=.8 skew=.02 roughness=.05 whisper=.3 | valve | deepcall | An open low voice that falls into sevens by turns
Pedal board at night | Sub pedal | ring=.8 drift=0 attack=.03 release=.4 closure=.3 vowel=.1 mouth=.5 width=.4 singers=2 throat=1.05 depth=.62 | chapel | lowline | Smooth still pedals, quick to stop | organ
Thirty two foot stop | Sub pedal | division=Eight ring=.9 drift=0 attack=.12 release=.8 closure=.2 vowel=0 chest=.4 throat=.8 | cath | lowpair | A smooth tone with a slow pulse three octaves under | organ
Pedals in a wooden box | Sub pedal | closure=.75 vowel=.45 mouth=.6 attack=.02 release=.25 drift=0 ring=.2 throat=.85 volume=0 | tube | walk | Hard reedy pedals on Oh that start and stop at once | organ
Quiet left foot | Sub pedal | division=Three ring=.6 drift=.05 attack=.02 release=.3 closure=.2 mouth=.25 vowel=.15 chest=.6 skew=.14 depth=.56 roughness=0 throat=1.05 whisper=.24 volume=-1.5 | slap | walk | Covered pedals a twelfth over their floor | organ
Pedals behind shutters | Sub pedal | division=Two closure=.5 mouth=.1 vowel=.5 attack=.2 release=1 ring=.4 singers=3 width=.5 chest=.3 skew=.36 depth=.56 whisper=.24 volume=-3 | touch | lowpair | Shut pedals of three voices, one octave below | organ
Ground before the rain | Sub pedal | attack=2 release=6 closure=.18 vowel=.08 chest=.9 singers=3 width=.8 drift=.3 depth=.98 roughness=.02 fade=9 skew=.64 | darkhall | floor | Three slow dark voices over two octaves of floor | drone
Quarry at rest | Sub pedal | attack=1.5 release=5 division=Eight closure=.4 vowel=.25 throat=.64 mouth=.6 singers=2 width=.7 skew=.1 depth=.56 volume=-3 | cavern | floor | A slow flutter three octaves below two long throats | drone
Iron gate in wind | Sub pedal | attack=1 release=4 second=7 turn=1 pace=.12 closure=.5 vowel=.5 roughness=.3 singers=2 skew=.36 fade=12 whisper=.24 chest=.55 volume=-2 | jet | floor | A low drone that drifts from fours to sevens | drone
Heat under the asphalt | Sub pedal | division=Shared attack=1.5 release=4 closure=.35 vowel=.2 singers=4 width=.65 drift=.4 mouth=.5 depth=.98 throat=.78 whisper=.3 volume=-1 | lush | floor | Four covered voices that throb on one pulse | drone
Horizon held level | Sub pedal | division=Two attack=3.4 release=8 ring=.85 closure=.15 vowel=.3 drift=.1 singers=4 width=.65 throat=1.2 fade=9 | below | lowone | Smooth ringing voices an octave over their floor | drone
Low tide breathing | Sub pedal | breath=.9 pace=.15 attack=.6 release=4 closure=.3 vowel=.15 singers=2 width=.7 roughness=.17 ring=.4 drift=.3 | surf | floor | Two voices over two octaves in one long breath | drone
Swell from another storm | Sub pedal | breath=.5 pace=.4 second=1 attack=.4 release=3 vowel=.45 closure=.45 drift=.8 throat=.7 mouth=.7 depth=.86 roughness=.14 fade=17 volume=-0.5 | deepsea | lowone | A drifting low voice that lifts off its floor as it draws breath | voice
Bellows for a giant | Sub pedal | breath=1 pace=.6 closure=.6 vowel=.3 attack=.15 release=1 whisper=.4 throat=.65 mouth=.6 depth=.86 roughness=.17 drift=.3 skew=.3 | giant | understep | Loud out and thin in, with air in the low throat | drone
Slow rope hauled in | Sub pedal | breath=.7 pace=.25 division=Two second=8 roughness=.4 closure=.55 attack=.3 release=2 vowel=.2 skew=.02 fade=10 chest=.1 volume=3.5 | recall | lowone | An octave below that breaks into eights as it draws breath | drone
Night bus idling | Sub pedal | breath=.3 pace=3 division=Eight closure=.45 vowel=.05 attack=.2 release=.8 mouth=.35 depth=.98 roughness=.02 ring=.06 throat=.7 drift=.14 whisper=.3 chest=.1 volume=1 | wall | lowarch | A dull pulse of eight that shivers three times a second | drone
Tailgate let down | Sub pedal | vowel=.4 mouth=.95 closure=.5 attack=.02 release=.4 ring=.15 chest=.4 depth=.74 volume=0.5 | kept | understep | A wide open Oh with dry pulses two octaves under
Bright boot on gravel | Sub pedal | vowel=.8 mouth=.8 closure=.6 attack=.02 release=.35 chest=.5 throat=.9 depth=1 roughness=.05 skew=.05 singers=2 width=.5 drift=.3 whisper=.3 volume=0 | glaze | walk | A bright low Eh with the pulses laid bare
Word at the bottom stair | Sub pedal | division=Three vowel=.6 mouth=.85 closure=.65 attack=.02 fade=4 release=.5 skew=.28 roughness=.3 ring=.4 whisper=.24 volume=6 | stair | walk | Bright low plucks on Eh that fade over four seconds
Jug with a narrow neck | Sub pedal | vowel=.97 mouth=.4 closure=.75 attack=.04 release=.8 ring=.12 throat=.9 skew=.6 depth=.56 width=.5 roughness=.02 whisper=.3 volume=-4 | notch | lowline | Reedy low groups on Ue that swell in a small mouth
Stairs spoken downward | Sub pedal | division=One vowel=.3 mouth=.7 closure=.7 attack=.02 fade=2 release=.4 throat=.7 chest=.8 width=.5 roughness=.14 whisper=.3 singers=2 drift=.3 skew=.05 volume=2 | darkecho | walk | Two open hard low voices with air in them, over in two seconds
Ink in the water tank | Sub pedal | attack=.3 release=3 skew=.9 closure=.35 vowel=.12 depth=1 mouth=.5 width=.4 drift=.3 | shallow | deepcall | Groups of four that swell dark and close
Pushed from behind | Sub pedal | attack=.06 release=.8 skew=.7 closure=.6 vowel=.28 depth=.9 mouth=.6 division=Eight roughness=0 ring=.4 whisper=.3 | firm | deepcall | Swelling groups of eight that push each low note
Floor only just let in | Sub pedal | depth=.35 closure=.3 vowel=.8 mouth=.5 attack=.1 release=1 width=.6 singers=2 roughness=.02 ring=.8 throat=.8 drift=.14 skew=.42 | plate | lowline | Two ringing voices on Eh with a little of the floor let in
Rests on nothing | Sub pedal | depth=0 closure=.25 vowel=.1 mouth=.5 chest=1 attack=.2 release=2 ring=.6 skew=.42 drift=.3 whisper=.3 | hollow | lowpair | A plain dark low voice on its chest, no floor
Bell sunk in the harbour | Throat bells | division=Four vowel=.2 throat=.7 closure=.55 fade=7 depth=.9 release=5 mouth=.6 chest=.7 width=.35 roughness=.02 | murk | lowpair | A struck dark tone that rings two octaves down | bell
`,
    },
    {
      id: 'creaking-keys',
      name: 'Creaking keys',
      category: 'keys',
      rows: `
One tread of the attic | Creak piano | roughness=.6 closure=.65 ring=.2 vowel=.3 throat=.85 depth=.56 width=.35 chest=.32 volume=3.5 | dead | sixths | Uneven creaks of eight on Ah, gone in three seconds
Hinge with no oil | Creak piano | roughness=.8 closure=.8 ring=.1 vowel=.6 throat=1.2 fade=2 depth=.68 width=.35 volume=6 | wood | pair | Hard rough squeaks on Ee from a small throat
New rope on an old boat | Creak piano | roughness=.5 throat=.66 vowel=.15 chest=.8 fade=5 closure=.45 ring=.3 depth=.74 drift=.12 mouth=.8 | shaft | understep | Slow dark creaks from a long throat and chest
Wicker chair by the fire | Creak piano | roughness=.4 ring=.15 closure=.35 mouth=.4 vowel=.45 singers=3 width=.8 fade=2 throat=1.2 drift=.68 | pinned | descend | Light covered creaks of three voices
Weight on old leather | Creak piano | division=Four roughness=.7 fade=4 closure=.4 vowel=.08 throat=.75 release=.6 ring=.25 width=.45 mouth=.56 drift=.42 | booth | tenor | Dark uneven creaks, two octaves under the key
Felt between the hammers | Creak piano | division=Two closure=.2 mouth=.45 vowel=.15 ring=.5 roughness=0 fade=4 release=1.2 width=.9 whisper=.3 volume=5.5 | felt | ripple | Soft covered tones with an octave below, four seconds long
Piano in a wet church | Creak piano | division=Two closure=.45 vowel=.3 ring=.6 roughness=.05 fade=6 release=3 singers=2 depth=.86 drift=.12 mouth=.56 | cath | descend | Even tones of two voices over an octave, struck and fading
Practice heard passing | Creak piano | division=Three closure=.55 vowel=.4 ring=.4 roughness=.1 fade=3.5 chest=.5 depth=.98 width=.82 mouth=.95 whisper=.3 volume=6 | wall | ripple | Struck tones on Ah over a twelfth
Upright with a cold | Creak piano | division=Four closure=.5 mouth=.55 vowel=.2 ring=.45 roughness=.2 fade=3 drift=.6 singers=2 depth=.86 width=.35 chest=.15 throat=1.05 | cassette | pair | Two unsteady voices struck over two octaves
Parlour after the guests | Creak piano | division=Two closure=.38 vowel=.5 ring=.7 roughness=0 fade=5 release=2 width=.9 throat=1.1 depth=.56 drift=.12 chest=.25 | record | descend | Ringing tones on Eh with an octave beneath
Smoke over the keys | Creak piano | division=Two closure=.6 vowel=.1 ring=.75 roughness=0 fade=7 release=.6 drift=0 skew=.15 width=.65 mouth=.88 chest=.25 | trem | ripple | Smooth still tones on Oo with a soft bark
Tines kept cold | Creak piano | division=Two closure=.7 vowel=.75 ring=.9 roughness=0 fade=5 release=1.5 throat=1.4 chest=.1 depth=.98 mouth=.94 volume=6 | deepsea | sixths | Bright ringing tones on Ee, hardly any chest
Window seat in October | Creak piano | division=One closure=.55 vowel=.35 ring=.8 roughness=0 fade=8 release=.8 mouth=.7 turn=0 depth=.55 drift=.38 width=.45 whisper=.24 | chorale | pair | Open smooth tones on Ah with nothing below
Wooden clavichord | Creak piano | division=Three closure=.8 vowel=.65 ring=.25 roughness=.1 fade=1.2 release=.2 throat=1.3 chest=.1 depth=.62 width=.35 mouth=.88 drift=.04 volume=-3 | pinned | ost | Thin quick bright tones over a twelfth
Wires in a tea chest | Creak piano | division=Four closure=.9 vowel=.5 ring=.35 roughness=.2 fade=1.8 release=.3 throat=1 depth=1 width=.55 chest=.58 mouth=.52 volume=6 | tank | ost | Hard bare twangs two octaves down
Marimba in the mouth | Creak piano | division=Two closure=.25 vowel=.05 mouth=.6 ring=.85 roughness=0 fade=.9 release=.9 depth=.68 drift=.06 width=.45 chest=.52 whisper=.06 volume=3 | pinroom | ost | Round wooden plucks on Oo, over in a second | plucked
Balsa bars | Creak piano | division=One closure=.4 vowel=.3 ring=.7 roughness=0 fade=.35 release=.5 throat=1.2 turn=0 depth=.4 drift=.45 mouth=.76 chest=.32 whisper=.3 volume=0 | pinned | knock | Light short open plucks on Ah | plucked
Temple blocks in a row | Creak piano | division=Eight closure=.5 vowel=.18 mouth=.5 ring=.5 roughness=.05 fade=.4 release=.4 skew=0 depth=.98 drift=.06 width=.45 volume=4.5 | pinroom | ost | Short blocks of eight quick pulses, struck | plucked
Pine cone on slate | Creak piano | closure=.7 vowel=.7 ring=.3 roughness=.5 fade=.7 release=.3 throat=1.5 width=1 singers=2 mouth=.88 drift=.04 depth=1 volume=3 | pinned | bird | Tiny hard rattles of two small throats | plucked
Spoons on a windowsill | Creak piano | division=Three closure=.65 vowel=.85 ring=.6 roughness=.2 fade=1 release=.6 throat=1.2 width=.45 mouth=.82 whisper=.06 chest=.1 volume=2 | pinslap | knock | Bright short plucks on Ee over a twelfth | plucked
Harp in the hayloft | Creak piano | division=Two closure=.5 vowel=.38 ring=.8 fade=2.5 release=3 roughness=0 width=1 drift=.38 mouth=.5 throat=.7 volume=0 | pinhall | descend | Plucks on Ah that ring on after the key | plucked
Lute with tired pegs | Creak piano | division=Three closure=.6 vowel=.3 ring=.7 fade=3.5 release=1 roughness=.1 drift=.7 singers=2 depth=.72 chest=.15 throat=1.32 volume=6 | embers | ost | Two wandering plucks over a twelfth | plucked
Gut and quill | Creak piano | division=Two closure=.75 vowel=.55 ring=.3 fade=1.3 release=.4 chest=.2 skew=0 throat=1.1 depth=.86 mouth=.95 roughness=.24 volume=6 | centre | ost | Dry hard plucks on Eh with an octave below | plucked
Thumb piano, borrowed | Creak piano | division=Eight closure=.3 vowel=.2 ring=.95 fade=2 release=1.4 roughness=.15 mouth=.6 depth=.86 drift=.38 width=.55 chest=.55 volume=0 | pinroom | ost | Ringing plucks on Ah with a short buzz of eight | plucked
Zither left in the rain | Creak piano | division=Four closure=.55 vowel=.6 ring=.9 fade=4 release=4 singers=3 drift=.5 width=.65 roughness=0 depth=.98 mouth=.56 | strings | ripple | Three loose ringing plucks a key, two octaves down | plucked
Lullaby box | Creak piano | division=One closure=.35 vowel=.8 ring=.95 fade=2.2 release=2.5 throat=1.5 chest=0 turn=0 roughness=0 depth=.55 width=.55 mouth=.72 volume=5.5 | small | high | Small clear tones on Ee that ring two seconds | bell
Teacups being counted | Creak piano | division=Two closure=.6 vowel=.95 ring=.9 fade=1.4 release=2 throat=1.3 mouth=.5 roughness=0 drift=.32 width=.82 chest=.52 volume=2 | pinstar | bird | Half covered ringing taps on Ue | bell
Bell of a small lift | Throat bells | fade=1.5 vowel=.7 throat=1.4 release=2.5 ring=.75 singers=1 chest=.58 drift=.04 roughness=.19 skew=.7 closure=.5 mouth=.75 volume=6 | plate | bird | Soft bright chimes on Ee, quick to fade | bell
Glasses at closing time | Throat bells | attack=.15 fade=8 closure=.3 vowel=.3 ring=.95 whisper=.2 singers=2 width=.35 roughness=0 chest=.58 depth=1 | bed | descend | Slow soft ringing tones on Ah with a breath in them
Vespers on wood | Throat bells | division=Two fade=3 closure=.5 vowel=.1 throat=.8 chest=.6 release=3 ring=.8 skew=.1 width=.45 drift=.04 volume=1.5 | slowring | ripple | Dark struck tones on Oo, an octave below
Tremolo in the fingers | Creak piano | division=Two second=1 turn=1 pace=5 closure=.4 vowel=.35 ring=.75 fade=6 roughness=0 depth=.56 drift=.52 mouth=.76 throat=1.25 chest=.2 | room | pair | Tones that shake between octave and open, five times a second
Keys on a turning plate | Creak piano | division=Three second=2 turn=1 pace=2.6 closure=.5 vowel=.45 fade=5 ring=.5 roughness=.05 width=.82 mouth=.5 chest=.25 depth=.5 whisper=.06 volume=6 | pan | descend | A twelfth and an octave that change places quickly
Broken lift music | Creak piano | division=Eight second=2 turn=1 pace=1.4 closure=.6 vowel=.3 fade=8 ring=.3 roughness=.3 drift=.18 width=.9 mouth=.85 chest=.52 throat=.75 singers=2 depth=1 whisper=.3 | glaze | sixths | Creaks of eight that turn to an octave and back
Rocking horse | Creak piano | division=Four second=2 turn=1 pace=.7 roughness=.3 vowel=.25 closure=.45 fade=10 ring=.35 release=.7 depth=.62 width=.4 mouth=.74 whisper=.45 throat=.7 | stone | pair | An airy creak that rocks between two octaves and one
Pendulum with a limp | Creak piano | second=3 turn=1 pace=.9 roughness=.2 vowel=.5 closure=.7 fade=12 ring=.5 depth=.86 throat=1.3 chest=.1 | darkecho | tenor | Eights and a twelfth that swap once a second
Organ with short breath | Creak piano | division=Two attack=.02 fade=9 ring=.6 closure=.6 vowel=.4 drift=0 roughness=0 release=.15 depth=.86 width=.82 mouth=.56 chest=.52 whisper=.24 | spin | pair | Percussive pipes over an octave that sink as they are held | organ
Pipes that answer late | Creak piano | division=Three attack=.3 fade=14 ring=.8 closure=.4 vowel=.15 drift=.05 roughness=0 release=.6 depth=.62 width=.65 mouth=.95 chest=.32 volume=-3.5 | bloom | suspend | Round pipes over a twelfth that swell in a little late | organ
Toy organ running down | Creak piano | division=Four attack=.01 fade=7 closure=.8 vowel=.7 throat=1.4 drift=.9 roughness=.2 release=.2 ring=.3 depth=.62 width=.55 chest=.25 volume=-4 | pillow | sixths | Wavering thin reeds two octaves down | organ
Fairground past the wood | Creak piano | division=Two attack=.01 fade=20 closure=.75 vowel=.55 singers=4 drift=.7 release=.25 roughness=.1 ring=.4 depth=.92 width=.82 mouth=.6 | shore | pair | Four quarrelling reeds on Eh over an octave | organ
Click of the stop knob | Creak piano | division=One attack=.008 fade=12 closure=.9 vowel=.6 ring=.15 release=.1 turn=0 drift=0 roughness=0 throat=1.1 width=.25 mouth=.72 chest=.15 whisper=0 | gated | knock | Open hard reeds, on and off at once | organ
Rubber on the low bars | Creak piano | division=Two throat=.7 closure=.3 vowel=.05 chest=.9 ring=.6 fade=2 release=.8 roughness=0 depth=.74 width=.5 mouth=.82 drift=.42 volume=-6 | deep | walk | Dull dark struck tones full of chest | bass
Bass end of a piano | Creak piano | division=Four throat=.75 closure=.6 vowel=.28 ring=.5 fade=6 release=1 roughness=.1 singers=2 depth=.62 drift=.38 mouth=.56 chest=.55 | darkplate | lowarch | Low struck tones of two voices over two octaves | bass
Crate dragged a yard | Creak piano | throat=.64 closure=.7 roughness=.9 vowel=.4 fade=3 ring=.1 chest=.7 drift=.18 mouth=.56 | iron | walk | Very rough low scrapes of eight pulses | bass
Stumps in a row | Creak piano | division=Drips throat=.65 closure=.4 vowel=.1 ring=.4 fade=1 chest=.6 roughness=.1 drift=.38 width=.2 whisper=0 volume=-12.5 | pinned | walk | Single low thuds in a long throat | bass
Wardrobe door, humming | Creak piano | division=Three throat=.7 mouth=.2 vowel=.3 closure=.45 fade=5 ring=.7 release=1.5 roughness=.2 depth=.98 chest=.65 drift=.42 volume=6 | tube | deepcall | Covered low tones over a twelfth that ring | bass
Haze over the keyboard | Creak piano | division=Two attack=.04 closure=.3 vowel=.4 ring=.65 whisper=.5 fade=6 release=4 singers=4 width=.55 roughness=0 depth=.74 drift=.52 mouth=.95 skew=.3 volume=6 | cloud | ripple | Airy soft tones of four voices over an octave
Played behind the rain | Creak piano | division=Four closure=.35 vowel=.2 ring=.5 whisper=.3 fade=4 release=2 roughness=.15 throat=.85 width=.82 mouth=.95 drift=.42 chest=.1 volume=5 | rain | descend | Soft dark airy tones struck over two octaves
Keys with the lid closed | Creak piano | division=Three closure=.25 mouth=.12 vowel=.4 ring=.6 fade=5 release=1.5 chest=.6 roughness=0 depth=.74 drift=.52 | wool | ripple | Shut dull tones over a twelfth
Memory of a school hall | Creak piano | division=Two closure=.5 vowel=.6 ring=.45 fade=3 release=1 drift=.4 singers=2 roughness=.1 mouth=.88 chest=.32 volume=4.5 | recall | descend | Two voices struck on Eh, an octave below
Reversed on the stair | Creak piano | division=Two attack=.6 fade=3 skew=.9 closure=.6 vowel=.3 ring=.3 release=.4 roughness=0 drift=.45 width=.55 mouth=.8 volume=6 | rev | pair | Slow tones whose pulses swell and stop, over an octave | pad
`,
    },
    {
      id: 'bronze-throats',
      name: 'Bronze throats',
      category: 'voice',
      rows: `
Horn over the pass | Bronze throat | vowel=.3 throat=.8 attack=.2 release=2 closure=.75 chest=.5 skew=.54 drift=.38 fade=22 whisper=.24 volume=2 | murk | call | One tight open voice on Ah with an octave under it | wind
Herald on the left tower | Bronze throat | vowel=.62 throat=1.3 attack=.03 release=.6 closure=.92 depth=.7 chest=.2 skew=.1 drift=.06 roughness=.14 whisper=0 fade=11 volume=2 | bright | call | One hard bright call on Eh, quick to speak | wind
Shawm at the gate | Bronze throat | division=Three vowel=.55 throat=1.15 closure=.95 roughness=.25 attack=.04 release=.4 skew=.04 drift=.52 width=.35 fade=18 volume=4.5 | kept | cantus | A rough hard reed over a twelfth | wind
Horn in a wet street | Bronze throat | mouth=.3 vowel=.15 closure=.7 attack=.1 release=.8 throat=.85 ring=.3 skew=.48 drift=.52 roughness=.03 volume=4.5 | wall | lament | A covered tight tone on Oh | wind
Conch at low water | Bronze throat | division=One vowel=.12 throat=.7 closure=.8 attack=.25 release=1.5 whisper=.3 turn=0 drift=.3 depth=.65 roughness=.05 volume=-1.5 | surf | call | A long throat blown hard and open, air in it | wind
Brass turned to the west | Bronze throat | singers=4 width=1 vowel=.34 closure=.8 throat=.85 attack=.15 release=1.5 drift=.3 skew=.36 fade=14 volume=1 | cloud | verse | Four tight wide voices on Ah over an octave | pad
Chorale for shut doors | Bronze throat | singers=3 width=.8 mouth=.4 vowel=.25 closure=.75 attack=.3 release=2 division=Three skew=.42 roughness=.05 chest=.7 volume=-2.5 | darkhall | wide | Three covered brassy voices over a twelfth
Coppers on the hob | Bronze throat | singers=2 vowel=.7 closure=.88 throat=1.4 attack=.02 release=.3 fade=3 ring=.3 skew=.32 drift=.52 width=.82 whisper=.24 chest=.55 volume=6 | tank | sixths | Two small hard voices that fade in three seconds | keys
Wet banners go by | Bronze throat | singers=4 division=Four vowel=.4 closure=.78 attack=.2 release=2 width=.55 drift=.6 chest=.8 skew=.14 fade=9 breath=.65 pace=.18 volume=-2.5 | cath | turn | Four wandering hard voices over two octaves, breathing in and out
Rails before the train | Bronze throat | singers=3 ring=.7 vowel=.6 closure=.95 attack=1.2 release=4 width=1 skew=0 roughness=.14 mouth=.6 depth=.62 fade=14 volume=-1 | stairs | stack | Three hard voices that swell slowly and ring | pad
All of it bronze | Bronze throat | division=One turn=0 vowel=.47 closure=1 mouth=1 attack=.1 release=1 depth=.4 drift=.45 roughness=0 fade=18 whisper=0 skew=.4 volume=-2 | bare | cantus | The tightest voice, wide open with nothing beneath
Fold against fold | Bronze throat | vowel=.2 closure=1 mouth=.6 depth=1 ring=0 throat=.75 attack=.06 release=.6 skew=.1 drift=.32 fade=26 roughness=.19 chest=.7 | valve | lament | A dry tight low buzz on Oh with its octave bare
Tongue of the bell | Bronze throat | division=Three vowel=.82 closure=1 mouth=.9 ring=.5 throat=1 attack=.05 release=1.5 skew=.14 roughness=0 drift=.42 whisper=.3 volume=6 | notch | lament | The hardest closure on Ee over a twelfth
Nose of a bronze mask | Bronze throat | vowel=.66 closure=.9 mouth=.2 throat=1.35 attack=.08 release=.5 chest=.1 skew=.02 drift=.18 width=.25 roughness=.17 whisper=.24 volume=3 | tube | cantus | A nasal shut small voice, an octave below
Between two shields | Bronze throat | division=Eight vowel=.5 closure=1 depth=.8 throat=.9 attack=.12 release=1 singers=2 width=.75 roughness=.05 volume=1 | cavern | pair | Two hard voices with a rattle of eight
Reeds with no curtain | Bronze throat | drift=0 singers=2 vowel=.55 closure=.82 attack=.03 release=.2 ring=.35 turn=0 width=.82 mouth=.52 whisper=.24 | chapel | suspend | Still hard reeds on Eh, an octave below | organ
Loud stop at noon | Bronze throat | drift=0 singers=3 vowel=.75 throat=1.2 closure=.9 division=Two attack=.02 release=.3 depth=.6 ring=.5 skew=0 whisper=.24 volume=0 | hall | tenor | Still bright pipes on Ee, an octave below half let in | organ
Regal in the nursery | Bronze throat | division=Four drift=0 vowel=.9 mouth=.5 throat=1.5 closure=.85 attack=.02 release=.15 chest=0 turn=0 skew=.1 width=.55 roughness=.02 fade=9 volume=1.5 | booth | pair | Tiny buzzing reeds on Ee over two octaves | organ
Rotor in the loft | Bronze throat | drift=.1 singers=2 vowel=.4 closure=.7 attack=.03 release=.3 ring=.6 division=Three skew=0 width=.25 roughness=.14 chest=.7 fade=16 volume=-2 | spin | verse | Hard ringing reeds on Ah over a twelfth | organ
Bagpipe behind the dune | Bronze throat | drift=.05 singers=1 vowel=.6 throat=1.1 closure=.97 attack=.05 release=.2 roughness=.2 turn=0 depth=1 skew=.32 width=.82 mouth=.96 chest=.25 volume=2.5 | shore | tenor | One rough hard reed with its octave laid bare | organ
Struck on the rim | Throat bells | closure=.65 vowel=.3 fade=7 release=4 ring=.9 chest=.2 depth=.7 whisper=.2 throat=.7 volume=3.5 | longplate | bells | Struck open tones on Ah in a long throat | bell
Gong with a low mouth | Throat bells | division=Two throat=.7 vowel=.25 fade=9 closure=.8 chest=.8 attack=.06 release=6 depth=.7 width=.55 roughness=.14 mouth=.6 | bowls | lowpair | A long dark stroke on Oh over an octave | bell
Anvil wrapped in cloth | Throat bells | division=Three mouth=.35 vowel=.5 closure=.9 fade=1.5 ring=.5 release=1 depth=1 skew=.04 roughness=.17 chest=.15 volume=-4 | pinned | knock | Covered hard strokes over a twelfth, soon gone | bell
Cymbal of small throats | Throat bells | singers=4 drift=.9 vowel=.85 throat=1.6 closure=.95 whisper=.3 fade=8 ring=.6 width=1 depth=.65 volume=2 | glim | nine | Four loose bright throats on Ee, struck with air | bell
Crotales over water | Throat bells | vowel=.97 throat=1.5 ring=1 fade=6 closure=.7 singers=1 drift=0 release=7 width=.82 | shallow | high | Still round chimes on Ue with the longest ring | bell
Dry wheel on old gut | Bronze throat | drift=.2 singers=2 vowel=.5 closure=.85 roughness=.4 attack=.1 release=.6 depth=.8 skew=.5 width=.25 fade=12 mouth=.7 chest=.55 volume=2 | wood | tenor | Rough reedy groups of two in even swells | string
Bow near the bridge | Bronze throat | division=Three vowel=.75 closure=.9 attack=.15 release=1 roughness=.45 whisper=.25 skew=.55 width=.82 depth=.55 throat=1.3 ring=.4 chest=.7 volume=-1 | room | wide | Edgy bowed tones on Ee of a small throat | string
Fiddle in the mine | Bronze throat | vowel=.45 throat=1.25 closure=.8 attack=.12 release=.8 drift=.5 roughness=.2 chest=.2 skew=.3 width=.35 fade=10 volume=-2 | shaft | lament | One wandering edgy line on Ah | string
Wire through a ring | Bronze throat | division=Four vowel=.8 throat=1.3 closure=.95 attack=.6 release=3 ring=.8 singers=2 width=.75 skew=.02 drift=.18 fade=9 volume=2 | jet | stack | Two thin wires on Eh that ring over two octaves | string
Rosin in the low strings | Bronze throat | throat=.68 vowel=.3 closure=.9 roughness=.5 attack=.15 release=1 singers=3 width=.6 chest=.7 mouth=.6 drift=.04 volume=-11.5 | cellar | tenor | Three rough long throats with an octave beneath | string
Sunrise on tin roofs | Bronze throat | attack=2.2 release=6 singers=4 width=1 vowel=.62 closure=.72 ring=.4 whisper=.15 skew=.42 roughness=.14 fade=22 drift=.55 volume=4.5 | shim | wide | Four bright wide voices that take two seconds to rise | pad
Slow metal, opening | Bronze throat | attack=1.5 release=4 mouth=.5 vowel=.35 closure=.85 singers=3 turn=1 pace=.2 second=1 width=.75 roughness=.14 fade=18 throat=.7 | glacial | suspend | Tight covered voices that lose their octave by turns | pad
Furnace left ajar | Bronze throat | attack=.9 release=3 closure=.9 vowel=.15 throat=.64 chest=1 singers=2 roughness=.2 width=.8 drift=.12 mouth=1 volume=-12.5 | crypt | turn | Long tight throats on Oh over a full chest | pad
Gilding in the shade | Bronze throat | attack=1 release=5 division=Three closure=.65 vowel=.95 mouth=.7 ring=.6 singers=4 width=1 skew=.02 drift=.45 roughness=.19 volume=-2.5 | mist | stack | Four ringing voices on Ue over a twelfth | pad
Weathervane at rest | Bronze throat | attack=1.2 release=3 division=One turn=0 closure=.95 vowel=.75 throat=1.2 singers=2 whisper=.1 drift=0.05 volume=1.5 | swirl | hum | Open hard small voices on Ee, quite still | pad
Two bronzes trade | Bronze throat | second=3 turn=1 pace=1 vowel=.45 closure=.8 singers=2 width=.45 drift=.6 skew=.1 roughness=.02 mouth=.5 throat=.85 chest=.7 depth=.5 fade=10 volume=-1.5 | round | sixths | Two hard singers that trade octave and twelfth
Blade turned to the sun | Bronze throat | second=4 turn=1 pace=.3 vowel=.6 closure=.9 attack=.15 release=1.2 width=.35 chest=.15 throat=1.4 ring=.4 mouth=.95 fade=10 volume=6 | harm | stack | A hard small Eh that falls from one octave to two
Siren slowed to a song | Bronze throat | second=1 turn=1 pace=3 vowel=.7 throat=1.2 closure=.85 attack=.1 release=.8 skew=.02 drift=.32 roughness=0 depth=.5 whisper=0 | repeats | cantus | A tight voice whose octave blinks three times a second
Brass losing its way | Bronze throat | division=Eight second=1 turn=1 pace=.5 vowel=.38 closure=.75 attack=.1 release=1.5 singers=4 skew=.48 throat=.75 chest=.8 width=.45 | orbit | pair | Rattles of eight that clear to the open tone and return
Coin spun on a table | Bronze throat | second=7 turn=1 pace=.8 vowel=.65 closure=.8 attack=.04 fade=7 release=1 throat=1.3 drift=.12 width=.35 ring=.6 mouth=1 volume=2 | gated | pair | An octave below that turns to sevens as it sinks | keys
Bronze heard breathing | Bronze throat | breath=.8 pace=.4 closure=.8 vowel=.4 whisper=.3 singers=3 attack=.2 release=1.5 width=.8 skew=.1 drift=.18 roughness=.14 mouth=.7 volume=-1.5 | lungs | verse | Three hard voices that swell out and thin as they draw breath
Horn short of breath | Bronze throat | breath=.6 pace=.9 division=Three closure=.7 vowel=.2 mouth=.5 attack=.08 release=.6 roughness=.4 skew=.54 fade=12 throat=1.2 drift=.42 chest=.7 volume=-2 | combo | cantus | A rough horn over a twelfth that puffs each second | wind
Smith's bellows | Bronze throat | breath=1 pace=.6 closure=.9 vowel=.5 whisper=.6 throat=.75 attack=.1 release=.8 drift=.38 roughness=0 depth=.7 volume=-2.5 | empty | lowpair | Loud hard breath out and thin air in, down low | texture
Stove with four kettles | Bronze throat | breath=.4 pace=.2 singers=4 vowel=.85 closure=.6 whisper=.5 throat=1.4 ring=.7 width=.45 attack=.6 release=3 drift=.38 roughness=0 mouth=.52 depth=.7 fade=12 volume=4.5 | sea | hum | Four steaming small voices on Ee that ring | texture
Swell of the old cinema | Bronze throat | breath=.5 pace=.3 drift=.2 division=Four closure=.65 vowel=.3 singers=3 attack=.25 release=1 ring=.4 skew=.54 roughness=.05 volume=-1.5 | chorale | wide | Three reeds over two octaves that swell and sink | organ
Sand cast, still rough | Bronze throat | roughness=.7 closure=.85 vowel=.75 throat=1.2 attack=.15 release=.7 skew=.72 division=Four ring=.3 depth=1 drift=.55 chest=.55 fade=17 volume=2.5 | fold | tenor | Rough tight groups of four on Eh that swell and are cut
Green on the copper | Bronze throat | roughness=.6 closure=.55 vowel=.9 mouth=.4 singers=2 whisper=.3 attack=.3 release=2 drift=.18 fade=17 | bulb | verse | Two rough airy covered voices on Ue
Bronze under the plough | Bronze throat | division=Four roughness=.9 closure=.85 throat=.65 vowel=.45 attack=.1 release=.8 chest=.6 drift=.06 width=.5 mouth=.52 | iron | understep | The long throat growls, two octaves down | bass
Filings on a drum skin | Bronze throat | division=Eight roughness=.7 closure=.8 vowel=.6 fade=2.5 attack=.01 release=.4 throat=1.2 width=.25 mouth=.96 drift=.42 chest=.25 volume=-4 | pinroom | ripple | Rough rattles of eight that die in two seconds | plucked
Trumpet with a split lip | Reed calf | division=Two roughness=.5 vowel=.64 throat=1.3 turn=.3 closure=.9 mouth=.95 attack=.02 fade=30 depth=.86 chest=.32 drift=.42 | combo | call | A cracked bright voice wide open on Eh | wind
`,
    },
    {
      id: 'monks-and-doors',
      name: 'Monks and doors',
      category: 'voice',
      rows: `
Door on a long hinge | Slow door | pace=.06 closure=.5 vowel=.32 attack=.6 singers=3 skew=.3 depth=.86 drift=.06 width=.35 roughness=.14 ring=.18 whisper=.3 fade=17 | hall | turn | Dark voices whose octave opens and shuts very slowly | pad
Door left on the latch | Slow door | turn=.5 pace=.3 depth=.6 closure=.4 vowel=.12 mouth=.5 roughness=.05 fade=17 throat=1.32 whisper=.24 | warm | suspend | Covered voices whose floor never quite shuts | pad
Draught from both doors | Slow door | pace=.5 singers=2 drift=1 width=1 whisper=.5 vowel=.45 attack=.4 skew=.48 mouth=.88 ring=.4 roughness=.03 chest=.85 fade=10 volume=-1 | pan | turn | Two airy singers who open an octave at different times | pad
Gate with a bright side | Slow door | pace=.25 closure=.85 vowel=.65 throat=1.2 chest=.2 depth=1 attack=.3 release=2 width=.55 mouth=.5 fade=9 whisper=.06 volume=4 | bright | stack | Hard Ee that loses its octave and finds it again | pad
Sun past the shutters | Slow door | pace=.18 mouth=1 vowel=.4 throat=1.1 closure=.35 ring=.7 attack=1.4 release=6 skew=.1 roughness=.14 drift=.42 depth=1 | airy | nine | Wide open ringing voices whose octave comes and goes | pad
Bench of old voices | Two monks | closure=.85 throat=.66 roughness=.55 vowel=.36 attack=.25 skew=.42 depth=.56 ring=.06 division=Three second=4 mouth=.8 width=.82 drift=.68 volume=-2 | room | tenor | Two rough long throats that swap a twelfth and two octaves
Question and floor | Two monks | pace=.45 closure=.7 vowel=.8 throat=1.25 mouth=.8 release=1.5 skew=.54 roughness=0 second=4 singers=3 ring=.12 chest=.3 whisper=.3 volume=-1.5 | chamber | sixths | Three small tight voices on Ee that drop an octave each two seconds
Novice and master | Two monks | drift=.9 throat=.78 vowel=.62 whisper=.4 closure=.45 pace=.18 width=1 roughness=.05 division=Four second=2 depth=.95 singers=2 ring=.1 chest=.25 fade=12 volume=0.5 | valley | lament | Two airy voices wide apart that rise from two octaves down to one
Two brothers hum | Two monks | mouth=.1 closure=.4 pace=.25 chest=.9 ring=.6 attack=.5 skew=.36 depth=.92 width=.4 drift=.68 roughness=0 | cellar | verse | Two shut humming voices over octave and twelfth
Across the choir stalls | Two monks | division=Three second=2 pace=.6 closure=.75 vowel=.6 throat=1 release=2.5 skew=.04 mouth=.94 fade=14 volume=-0.5 | cath | stack | Two clear hard voices that cross between their floors
The octave gives way | Two monks | second=5 pace=.3 closure=.4 vowel=.28 throat=1.2 singers=3 skew=.1 mouth=.8 roughness=0 drift=.2 width=.5 whisper=.35 | darkhall | verse | An airy octave that yields to a growl of five pulses
Crypt under the crypt | Two monks | division=Four second=6 pace=.2 vowel=.15 closure=.5 attack=.9 release=5 mouth=.56 ring=.06 width=.82 drift=.68 whisper=.3 skew=.42 | crypt | wide | A floor two octaves down that sinks another fifth
Shaft with no ladder | Two monks | second=7 pace=.4 closure=.8 vowel=.45 throat=.72 depth=1 release=2 roughness=.14 width=.45 fade=9 volume=-1 | shaft | tenor | Hard voices that fall from an octave into sevens
Rattle that clears | Two monks | division=Eight second=1 pace=.35 closure=.5 vowel=.35 singers=4 width=1 depth=.56 chest=.1 fade=9 volume=0.5 | flock | wide | A wide flutter of eight that clears to the plain voice
Step with a buzz in it | Two monks | division=Three second=5 pace=1.3 closure=.35 vowel=.3 throat=.95 chest=.3 attack=.15 skew=.36 depth=.92 mouth=.82 whisper=.55 ring=.5 width=.6 drift=.3 volume=2.5 | dotted | pair | Airy round voices on Ah that step from a twelfth to a five pulse buzz
Beads strung in a door | Slow door | pace=5.5 vowel=.75 closure=.6 attack=.2 release=1.5 width=1 singers=1 skew=.3 depth=1 drift=.45 mouth=.5 roughness=0 ring=.34 division=Four throat=1.4 chest=.1 volume=-4 | double | stack | Two octaves that blink five times a second on one small throat | texture
Lattice in a breeze | Slow door | second=3 pace=3.5 vowel=.6 closure=.6 ring=.5 attack=.15 release=2 chest=.3 skew=.42 depth=.74 drift=.38 roughness=.14 mouth=1 volume=-1 | glim | pair | Octave and twelfth that flicker three times a second | texture
Fan in the ceiling | Slow door | pace=2 turn=.7 closure=.3 vowel=.1 mouth=.5 attack=.5 whisper=.3 skew=.54 drift=.38 roughness=.05 chest=.25 volume=-2.5 | throb | suspend | Covered soft voices whose octave turns twice a second | pad
Tambour with no skin | Slow door | division=Eight second=2 pace=4.2 closure=.75 vowel=.5 attack=.03 fade=4 release=.8 drift=.18 mouth=.5 roughness=.05 volume=4.5 | gated | knock | Rattles of eight and an octave in quick exchange | plucked
Trill on the sill | Slow door | second=4 pace=6 closure=.65 vowel=.75 throat=1.4 chest=.1 attack=.06 release=.6 singers=1 depth=.62 mouth=.88 fade=22 ring=.06 drift=.04 whisper=0 volume=4.5 | slap | bird | One small bright voice that trills between two floors | wind
Who opens, who shuts | Cat asleep | division=Two breath=.6 pace=.2 second=3 turn=.7 vowel=.3 attack=.6 release=3 skew=.3 depth=.86 width=.55 mouth=.74 roughness=.02 drift=.55 volume=-1.5 | lungs | turn | Voices that breathe out on an octave and in on a twelfth
Bell rope let swing | Two monks | fade=7 attack=.01 pace=.7 closure=.65 ring=.6 release=3 vowel=.38 skew=.28 depth=.98 mouth=.8 roughness=.17 width=.55 volume=1 | bowls | descend | Struck voices that swing between two floors | keys
Corridor of keys | Two monks | fade=3 attack=.01 pace=1.5 closure=.55 ring=.45 release=1 vowel=.25 singers=1 depth=.86 mouth=.6 roughness=.02 width=.75 volume=6 | stair | ripple | Short sung keys that change floor as they fade | keys
Hinge organ | Slow door | fade=15 attack=.02 pace=1.2 closure=.7 ring=.5 drift=0 release=.2 vowel=.55 singers=1 depth=.92 width=.3 mouth=.56 throat=1.05 chest=.85 volume=-12.5 | chorale | sixths | Still reeds on Eh whose octave comes and goes | organ
Latch lifted at dawn | Slow door | fade=5 attack=.05 pace=.45 closure=.5 vowel=.8 throat=1.3 release=3 ring=.75 skew=.42 depth=.56 drift=.18 mouth=.6 roughness=.14 volume=1 | star | bells | Small ringing tones on Ee that lose their octave | bell
Wind tries each door | Slow door | whisper=.9 pace=.4 closure=.2 vowel=.5 second=3 attack=.9 release=5 singers=3 division=One skew=.54 drift=.12 roughness=0 ring=.34 throat=1.32 mouth=.96 fade=11 volume=1 | cavern | stack | Air that goes between no floor and a twelfth | texture
Curtain of breath | Slow door | whisper=.75 pace=.15 division=Four second=2 vowel=.2 attack=1.3 ring=.6 release=6 skew=.3 drift=.12 width=.9 roughness=.17 depth=.62 volume=-1 | smear | nine | Airy voices that rise from two octaves down to one | pad
Draughty refectory | Two monks | whisper=.6 pace=.7 closure=.35 mouth=.5 vowel=.6 attack=.2 singers=4 skew=.36 roughness=.02 ring=.34 volume=1 | tunnel | pair | Four covered airy voices that swap their floors
Half a word each | Two monks | whisper=.5 pace=2.5 vowel=.45 closure=.5 attack=.08 release=.5 throat=1 width=1 depth=.68 ring=.18 mouth=.52 roughness=.03 fade=9 volume=3.5 | mirror | knock | Short airy syllables that flip floors as they sound
Lips at the grille | Two monks | whisper=.7 mouth=.35 pace=1 vowel=.95 closure=.4 throat=1.2 attack=.1 release=1 skew=.54 roughness=.02 ring=.34 width=.3 chest=.1 volume=6 | platform | lament | Small airy covered voices on Ue, turning once a second
Stone moved by song | Two monks | throat=.62 chest=1 closure=.6 pace=.08 vowel=.04 attack=1 release=6 singers=4 skew=.1 depth=.68 mouth=.88 fade=15 width=.65 | giant | floor | Four huge throats on Oo whose floor shifts slowly | drone
Ground that tilts | Slow door | second=5 division=Four pace=.07 closure=.35 vowel=.2 chest=.9 attack=1.5 release=5 drift=.45 width=.35 mouth=.56 roughness=.14 ring=.4 depth=.62 fade=10 volume=4.5 | jet | floor | A drone that leans from fours to fives | drone
Undertow at the weir | Slow door | division=Eight second=4 pace=.2 closure=.4 throat=.7 vowel=.1 attack=1 release=4 skew=.54 depth=.74 drift=.45 mouth=.56 chest=.25 volume=-1.5 | below | lowone | A low flutter that slows to two octaves and back | drone
Monk asleep, monk awake | Two monks | division=Shared second=2 pace=.3 closure=.5 vowel=.15 throat=.65 attack=.6 skew=.54 mouth=.56 fade=12 volume=-1 | wall | lowarch | A shared purr that gives way to a sung octave | drone
Beam over the threshold | Two monks | second=8 pace=.15 closure=.7 ring=.8 vowel=.3 attack=.8 release=5 width=.6 skew=.3 depth=.92 mouth=.56 fade=9 chest=.1 | iron | floor | A ringing octave that breaks slowly into eights | drone
Seen through the hedge | Open sky | second=2 turn=.6 pace=.8 closure=.7 whisper=.2 vowel=.9 throat=.75 chest=.15 ring=.5 singers=2 mouth=.7 width=.82 volume=-0.5 | notch | hum | Two firm ringing voices on Ue with an octave that glances in
Lantern handed across | Open sky | second=3 turn=1 pace=.3 singers=2 drift=.8 closure=.6 vowel=.5 attack=.4 release=2 skew=.02 roughness=.14 chest=.32 width=.82 whisper=.06 volume=0.5 | circle | pair | Two open voices that take turns to find a twelfth
Callers across a field | Open sky | second=4 turn=1 pace=.6 singers=2 width=.45 closure=.75 throat=.85 attack=.12 release=1.2 whisper=.1 skew=.3 roughness=.05 chest=.32 drift=.68 volume=2 | round | call | Two open calls that drop two octaves by turns
Choir with a trapdoor | Open sky | second=8 turn=1 pace=.35 closure=.75 vowel=.65 attack=.8 depth=1 skew=.1 chest=.25 roughness=.3 singers=3 width=.6 drift=.68 whisper=.24 volume=1 | leaves | turn | Three hard open voices that fall into eights and climb out
Low sun through slats | Open sky | second=2 turn=1 pace=1.8 closure=.4 vowel=.6 attack=.7 depth=.9 chest=.2 skew=.36 fade=12 volume=0 | water | wide | Wide voices barred by an octave twice a second | pad
Monks in the bath house | Two monks | attack=.15 release=1 fade=10 vowel=.55 closure=.65 pace=.8 skew=.54 mouth=.76 roughness=.05 ring=.34 width=.55 depth=.9 whisper=.24 volume=-1 | tank | tenor | Two bright voices that sink as they are held
Rain on the cloister | Two monks | ring=.9 closure=.3 pace=.3 vowel=.12 attack=.5 release=7 whisper=.2 skew=.3 roughness=.02 fade=11 volume=1 | rain | stack | Ringing soft voices whose floor turns slowly | pad
Second wind | Slow door | breath=.8 pace=.5 second=3 closure=.6 vowel=.4 attack=.3 release=2 singers=4 skew=.1 drift=.06 width=.82 mouth=.74 roughness=.02 ring=.18 depth=1 volume=-0.5 | back | verse | Four voices, out on an octave, in on a twelfth
Pilgrims on the ridge | Two monks | roughness=.5 singers=4 closure=.7 vowel=.4 pace=.45 throat=.8 drift=1 depth=.74 width=.3 | shore | cantus | Four rough wandering voices with shifting floors
Alms bowl | Two monks | ring=1 fade=8 attack=.02 closure=.4 vowel=.2 release=8 chest=.5 singers=1 mouth=.88 roughness=.05 volume=-0.5 | strings | points | Round struck tones that ring as their floor turns | bell
Door in a bent frame | Slow door | skew=.9 pace=.35 closure=.65 vowel=.25 attack=.4 release=2 depth=1 drift=.12 width=.25 mouth=.56 roughness=.02 ring=.4 | bloom | verse | Pairs of pulses that swell and stop, coming and going
Threshold worn hollow | Slow door | skew=.6 ring=.15 pace=.22 closure=.75 vowel=.5 singers=2 roughness=.25 attack=.2 release=1.5 width=.45 fade=18 chest=.85 | wood | turn | Dry bowed pairs of pulses that come and go | string
Knock, wait, knock | Two monks | division=Drips second=1 pace=.8 ring=.5 closure=.6 vowel=.3 attack=.1 singers=2 skew=.02 mouth=.88 fade=18 drift=.14 roughness=.03 chest=.85 volume=-2 | darkecho | one | Slow knocks that a plain voice answers each second
Door into the mountain | Elephant dusk | breath=0 division=Two second=8 turn=1 pace=.18 roughness=.3 closure=.65 vowel=.2 throat=.7 skew=.48 width=.25 mouth=.8 ring=.4 depth=1 fade=16 | shim | wide | Three large throats whose octave cracks into eights
Nobody at the gate | Slow door | vowel=.02 mouth=.2 whisper=.3 closure=.3 pace=.3 attack=1 release=6 width=.3 ring=.6 skew=.42 depth=.98 throat=.78 | loop | lament | Nearly shut soft voices whose octave fades in and out
`,
    },
    {
      id: 'flutter-and-purr',
      name: 'Flutter and purr',
      category: 'pad',
      rows: `
Beaks across the valley | Woodpecker pad | closure=.8 vowel=.5 throat=.95 attack=.2 release=3 turn=.1 mouth=.88 roughness=.05 fade=9 width=.55 drift=.14 whisper=0 volume=3 | valley | stack | Hard struck flutters of eight on three voices
Larches standing still | Woodpecker pad | closure=.45 vowel=.15 ring=.5 attack=1 release=5 turn=0 drift=.32 chest=.52 width=.75 depth=.7 | leaves | suspend | Round ringing flutters on Oh, slow to rise
Bark beetle weather | Woodpecker pad | throat=1.4 vowel=.75 closure=.6 roughness=.4 chest=.1 turn=.5 pace=.6 skew=.6 | dead | hum | Dry small flutters on Ue that clear by turns | texture
Bird between two trunks | Woodpecker pad | singers=2 drift=.5 second=3 turn=1 pace=.35 closure=.35 vowel=.35 attack=.3 mouth=.74 roughness=.17 chest=.15 width=.3 throat=1.25 depth=.7 skew=.64 ring=.5 volume=3 | pan | sixths | Two small voices that turn from eights to a twelfth
Nest in the gutter | Woodpecker pad | mouth=.3 vowel=.4 closure=.55 ring=.3 skew=.15 whisper=.3 attack=.5 drift=.38 roughness=.14 chest=.25 width=.3 depth=.9 | pillow | turn | Covered airy flutters in three voices
Soft side of the moths | Woodpecker pad | skew=.7 whisper=.6 closure=.3 vowel=.3 ring=.35 depth=.8 attack=.8 drift=.06 mouth=.56 roughness=0 chest=.25 | mist | nine | Airy flutters that swell in every group of eight
Fans of folded paper | Woodpecker pad | skew=.5 closure=.5 vowel=.6 depth=.9 singers=4 attack=.6 release=3 turn=.2 drift=.45 mouth=.88 chest=.52 width=.55 breath=.35 pace=.1 volume=-0.5 | paper | hum | Even flutters of four voices on Ee, swelling and sinking | texture
Wingbeat at eye level | Woodpecker pad | skew=.95 closure=.7 vowel=.2 throat=.75 attack=.25 release=1.5 singers=1 width=.4 drift=.32 mouth=.5 roughness=0 chest=.52 fade=11 whisper=.06 volume=1.5 | chamber | lament | One voice whose eights swell dark and are cut | voice
Swan low over water | Woodpecker pad | skew=.95 whisper=.7 throat=.62 closure=.3 vowel=.1 attack=.5 release=3 chest=.8 drift=.45 mouth=.5 roughness=.14 ring=.4 depth=.9 | shallow | deepcall | Long dark breath that swells in eights over its chest | drone
Feathers in a drawer | Woodpecker pad | skew=.8 depth=.5 closure=.2 vowel=.45 ring=.6 attack=1.2 release=5 turn=0 drift=.38 width=.65 throat=1.05 | veil | wide | Soft voices that tremble at half depth
Cat on warm stone | Cat asleep | breath=.25 closure=.4 vowel=.3 mouth=.5 whisper=.25 chest=.7 skew=.1 drift=.45 width=.82 roughness=0 | warm | verse | A covered purr on one pulse for all keys, barely breathing
Cat in the flour | Cat asleep | whisper=.8 closure=.3 vowel=.55 pace=.4 depth=1 attack=.2 release=2 skew=.3 drift=.52 width=.82 roughness=.05 chest=.1 | fog | turn | A dusty airy purr that swells four times in ten seconds
Basket by the range | Cat asleep | singers=4 drift=.6 pace=.2 breath=.8 closure=.5 vowel=.2 width=1 skew=.3 roughness=.02 chest=.52 depth=.62 fade=17 volume=0 | lush | wide | Four voices purring on one pulse, full and then thin
Rough tongue, old fur | Cat asleep | roughness=1 closure=.8 vowel=.85 breath=.35 singers=1 throat=1.2 ring=.1 skew=0 depth=.62 drift=.06 whisper=.15 pace=.5 volume=-7.5 | booth | pair | One rasping purr between Ah and Ee, dry and bright, with a breath in it | texture
Purr through a door | Cat asleep | mouth=.15 closure=.35 breath=.6 pace=.5 ring=.5 vowel=.1 chest=.6 skew=.36 depth=.92 drift=.52 roughness=.02 volume=-2.5 | wall | wide | A shut ringing purr that swells each two seconds
Calm below the waterline | Cat asleep | breath=0 closure=.6 throat=.62 vowel=.15 singers=3 chest=1 attack=.8 depth=.92 width=.35 ring=.06 mouth=.82 | crypt | floor | Three huge throats on one steady pulse | drone
Ramp of the car ferry | Cat asleep | breath=.3 pace=1.2 closure=.75 throat=.7 vowel=.35 depth=1 roughness=.3 skew=.28 drift=.52 mouth=.88 chest=.65 whisper=0 | deep | lowpair | A hard low throb that surges about once a second | bass
Transformer in the snow | Cat asleep | breath=0 closure=.8 vowel=.6 mouth=.4 ring=.7 drift=0 singers=2 whisper=.1 attack=1.5 depth=.74 width=.35 chest=.52 skew=.3 | empty | nine | A still covered ringing buzz on one pulse | drone
Dynamo behind the fair | Cat asleep | breath=0 division=Shared skew=.6 closure=.5 vowel=.25 singers=2 whisper=.2 attack=.4 ring=.4 throat=1.2 mouth=.6 depth=1 chest=.7 volume=3.5 | platform | turn | A soft even throb in two voices, all keys together
Slow propeller | Cat asleep | breath=.5 pace=.15 skew=.9 closure=.55 vowel=.08 throat=.75 depth=1 attack=.6 drift=.32 width=.45 mouth=.88 chest=.52 whisper=.24 volume=1 | slowing | lowone | Pulses that swell and cut on one slow count | drone
Bees on the ivy | Cat asleep | breath=0 throat=1.3 vowel=.5 closure=.7 singers=4 drift=.8 whisper=.3 chest=.1 skew=.54 depth=.56 width=.25 roughness=.03 | dust | hum | Four small wandering voices that buzz on one pulse | texture
Hive with the lid off | Cat asleep | breath=.4 pace=.7 throat=1.5 vowel=.9 closure=.8 roughness=.3 singers=3 drift=.18 width=.82 mouth=.74 ring=.6 skew=.9 whisper=.15 fade=14 volume=5 | bright | stack | Three small hard voices that swell in each shared pulse and ring | texture
Flies at the window | Cat asleep | breath=0 turn=1 second=1 pace=1.6 throat=1.6 vowel=.65 closure=.75 singers=1 attack=.1 release=.8 skew=.28 chest=.15 mouth=.82 volume=1.5 | glaze | bird | One tiny hard buzz that clears to a tone and back | wind
Crickets of one field | Cat asleep | breath=0 skew=0 ring=.9 throat=1.6 vowel=.85 closure=.5 depth=1 singers=2 chest=0 release=2 fade=17 volume=0.5 | airy | air | Small ringing chirps on Ee, together on one pulse | texture
Frogs after the storm | Cat asleep | breath=.7 pace=.9 ring=.6 skew=.05 vowel=.05 mouth=.5 throat=.9 closure=.55 depth=1 release=1 width=.9 roughness=0 chest=.85 volume=0 | shallow | pair | Round croaks on Oo that ring and swell each second | texture
The herd lies down | Elephant dusk | division=Shared breath=.7 pace=.15 roughness=.25 closure=.5 vowel=.1 mouth=.5 fade=26 drift=.42 volume=-6 | darkhall | floor | Large covered throats on one pulse in long breaths | drone
Calf between two flanks | Elephant dusk | division=Shared breath=.4 pace=.5 throat=.95 roughness=.2 vowel=.45 closure=.45 whisper=.4 attack=.4 skew=.36 depth=.62 width=.25 mouth=.5 ring=.18 drift=.68 volume=-6 | felt | suspend | Warm airy voices that purr and swell each two seconds
Backs against the frost | Elephant dusk | breath=.6 pace=.25 closure=.35 vowel=.3 whisper=.5 roughness=.1 attack=.6 ring=.4 drift=.32 width=.55 mouth=.56 fade=9 volume=-14 | lifted 1.mix=0.5 | turn | Soft breathy voices over two octaves, in slow breaths
They move before rain | Elephant dusk | breath=.2 division=Eight pace=.6 roughness=.5 closure=.6 vowel=.2 throat=.68 singers=4 width=1 skew=.54 depth=.62 drift=.45 mouth=.96 | rain | lowpair | Four rough long throats with a rumble of eight | drone
One of the herd wakes | Elephant dusk | division=Shared breath=.5 second=4 turn=.5 pace=.3 roughness=.4 vowel=.36 closure=.65 attack=.5 drift=0.6 mouth=.8 ring=.18 depth=.7 skew=.42 | common | turn | Three rough voices that breathe and wander off their shared pulse
Flutter keys | Woodpecker pad | fade=4 attack=.01 ring=.5 closure=.55 vowel=.3 singers=1 release=1.2 turn=0 drift=.32 mouth=.56 width=.45 volume=6 | reel | descend | Struck flutters on Ah that ring for four seconds | keys
Purring upright | Cat asleep | breath=0 fade=5 attack=.01 ring=.6 closure=.5 vowel=.2 singers=2 release=1.5 whisper=.1 skew=.1 drift=.32 width=.9 mouth=.56 roughness=.02 chest=.32 throat=1.05 volume=0 | record | ripple | Struck tones that purr together as they die | keys
Light sticks on wire | Woodpecker pad | fade=2 attack=.008 ring=.8 closure=.7 vowel=.6 throat=1.3 release=2 skew=0 chest=.2 roughness=.14 volume=6 | spring | ost | Bright struck rolls of eight in three voices | plucked
Card against the wheel | Cat asleep | breath=0 fade=1.5 attack=.008 closure=.8 vowel=.5 ring=.2 release=.4 depth=1 skew=0 singers=1 drift=.32 mouth=.5 chest=.32 volume=-4.5 | pinroom | ost | Short dry rattles on one pulse | plucked
Marbles in a tin tray | Woodpecker pad | fade=3 attack=.01 ring=.95 closure=.4 vowel=.85 throat=1.5 release=4 width=1 chest=0 drift=.38 mouth=.6 roughness=.14 depth=.7 volume=6 | seven | bells | Small ringing rolls of eight on Ue | bell
Room that slows down | Woodpecker pad | turn=1 second=2 pace=.12 closure=.5 vowel=.35 attack=.8 ring=.25 release=5 drift=.06 mouth=.8 chest=.25 fade=15 volume=2 | slowing | turn | Flutters that go over to an octave and come back
Ripple against the bank | Woodpecker pad | turn=.8 second=4 pace=1 closure=.4 vowel=.12 mouth=.5 attack=.4 ring=.4 width=.3 depth=.62 whisper=.24 skew=.64 | water | verse | Covered flutters that turn to fours each second
Rattan screen | Woodpecker pad | turn=1 second=1 pace=2.4 closure=.65 vowel=.55 singers=4 depth=.9 attack=.15 release=1.5 drift=.12 roughness=.14 fade=18 whisper=0 chest=.1 volume=1.5 | harm | sixths | Flutter and open voice in quick turns, four singers
Hush after the wings | Woodpecker pad | breath=.9 pace=.3 whisper=.5 closure=.4 vowel=.3 attack=.5 release=4 ring=.2 drift=.32 mouth=.82 roughness=.02 depth=.62 fade=9 volume=4 | lungs | wide | Flutters on the way out, thin open air on the way in
Doves in the tower | Woodpecker pad | breath=.6 pace=.7 throat=1.1 vowel=.05 mouth=.6 closure=.35 ring=.7 singers=2 attack=.15 release=1.5 drift=.06 roughness=.17 chest=.32 depth=.9 fade=14 | oo | pair | Soft ringing coos on Oo that swell and flutter | voice
Teeth of the comb | Woodpecker pad | division=Eight ring=0 closure=.95 vowel=.7 throat=1.1 depth=1 singers=1 width=.3 attack=.05 release=.4 drift=.52 roughness=.05 chest=.25 fade=11 volume=5 | tube | cantus | One dry hard buzz of eight between Eh and Ee | wind
Reed in the bellows | Woodpecker pad | closure=.75 vowel=.45 mouth=.5 depth=.6 singers=2 drift=.1 attack=.05 release=.3 ring=.3 width=.82 whisper=0 chest=.7 | cassette | wide | Half deep flutters in two still reeds | organ
Tremulant at half stop | Woodpecker pad | depth=.35 ring=.75 closure=.4 vowel=.3 drift=0 attack=.08 release=.5 singers=3 turn=0 chest=.32 width=.3 | six | suspend | Ringing pipes with a light tremble of eight | organ
Choir with a shiver | Woodpecker pad | depth=.45 closure=.5 vowel=.4 mouth=.9 singers=4 attack=.8 release=4 drift=.5 turn=0 fade=18 whisper=0 skew=.6 | cath | verse | Four wide voices on Eh that shiver lightly | voice
Cold hands on the cello | Woodpecker pad | depth=.7 skew=.4 closure=.7 throat=.72 vowel=.5 singers=1 roughness=.3 attack=.2 release=1 mouth=.5 chest=.32 fade=9 width=.55 volume=4 | cellos | tenor | One rough low line that shakes in eights | string
Wings at a high window | Woodpecker pad | throat=1.65 vowel=.3 closure=.3 whisper=.4 ring=.6 chest=0 attack=1 release=6 drift=.18 mouth=.6 width=.3 depth=.62 skew=.1 volume=4.5 | halo | air | High airy flutters of three small throats
Rope tapping a mast | Woodpecker pad | division=Drips turn=.6 second=1 pace=.2 ring=.4 closure=.5 vowel=.2 attack=.6 drift=.12 mouth=.8 roughness=.05 chest=.25 width=.75 depth=.62 fade=14 | surf | stack | Slow taps of three voices with a plain tone between | texture
Looms on the next floor | Woodpecker pad | division=Four closure=.7 ring=.1 vowel=.15 throat=.7 skew=0 roughness=.2 depth=1 attack=.3 drift=.45 mouth=.8 fade=18 width=.65 | six | verse | Struck dry fours from three long throats
Idling in the orchard | Cat asleep | breath=.2 turn=.8 second=2 pace=.07 closure=.45 vowel=.35 attack=1 ring=.35 release=4 skew=.42 drift=.45 width=.45 roughness=.14 chest=.32 fade=10 volume=-1.5 | drift | nine | A purr that gives way to an octave and returns
Half awake at ten | Cat asleep | breath=.5 pace=.25 ring=.8 closure=.25 vowel=.95 mouth=.6 attack=.8 release=6 skew=.3 depth=.74 drift=.38 width=.25 roughness=0 fade=11 volume=1 | slowed | turn | A soft ringing purr on Ue in slow breaths
`,
    },
    {
      id: 'open-skies',
      name: 'Open skies',
      category: 'voice',
      rows: `
Ah over the plateau | Open sky | closure=.5 turn=0 whisper=.2 attack=2.2 drift=.15 vowel=.4 depth=.55 roughness=.02 fade=14 ring=.85 mouth=1 throat=.75 volume=-1 | valley | wide | Four ringing long throats on Ah with nothing under them
Smoke from the far hut | Open sky | vowel=.02 mouth=.5 closure=.2 turn=0 chest=.6 whisper=.1 release=4 drift=.68 depth=.7 skew=.05 | oo | wide | Four covered voices on Oo, round and plain
Goats along the ridge | Open sky | vowel=.82 throat=1.2 closure=.55 turn=0 whisper=.05 chest=.1 attack=.8 depth=.55 roughness=.17 ring=.18 drift=.55 skew=.55 breath=.35 pace=.1 | airy | hum | Four bright narrow voices on Ee, swelling and sinking
Faces against the sun | Open sky | vowel=.62 closure=.65 turn=0 mouth=1 whisper=0 attack=.5 release=3 depth=.3 roughness=0 chest=.32 fade=15 ring=.12 throat=1.05 drift=.14 skew=.7 volume=-1.5 | longplate | turn | Four wide hard voices on Eh, no air in them
Voice in a blue jar | Open sky | vowel=1 mouth=.6 closure=.35 turn=0 ring=.7 singers=3 attack=1.2 depth=.65 chest=.52 width=.65 skew=.55 | pot | stack | Three ringing voices on a rounded Ue
Soprano at the top stair | Open sky | singers=1 throat=1.35 vowel=.38 closure=.55 attack=.15 release=1.5 whisper=.08 turn=0 chest=.58 width=.65 mouth=.52 skew=.55 fade=10 volume=1 | stair | lament | One small clear voice on Ah
Behind drawn curtains | Open sky | singers=1 throat=.95 vowel=.2 closure=.4 mouth=.3 attack=.2 release=1.2 turn=0 drift=.3 roughness=0 chest=.25 ring=.6 whisper=.5 width=.4 skew=.55 volume=0 | booth | lament | One covered airy voice on Oh that rings
Caulker in the dry dock | Open sky | singers=1 throat=.85 vowel=.45 closure=.75 mouth=.9 attack=.1 release=1 turn=0 whisper=0 depth=1 chest=.52 roughness=.35 drift=.15 width=.3 | shaft | cantus | One firm rough voice between Ah and Eh
Boots in an empty silo | Open sky | singers=1 throat=.66 vowel=.15 closure=.8 chest=1 attack=.2 release=2 turn=0 roughness=.02 width=.5 fade=12 drift=.2 mouth=.6 depth=.7 whisper=0 | tank | understep | One long dark throat with a full chest | bass
Reading by one lamp | Open sky | singers=1 throat=1.65 vowel=.75 closure=.3 chest=0 attack=.5 release=2 turn=0 ring=.75 depth=.55 whisper=.8 mouth=.75 width=.6 volume=1 | vib | lament | One very small voice on Ee, mostly air, that rings
Crowd on the lakeshore | Open sky | drift=1 closure=.75 vowel=.6 roughness=.4 attack=.6 turn=0 release=3 depth=.9 chest=.25 mouth=.65 whisper=.1 throat=.8 skew=.05 | seven | verse | Four hard loose voices on Eh that wander far apart
Unison without a leader | Open sky | drift=0 closure=.75 vowel=.55 whisper=0 attack=.15 turn=0 release=2 ring=.1 depth=.55 fade=16 mouth=.6 throat=.75 width=.4 skew=.55 | even | pair | Four hard voices on Eh, exactly together
Children at the fence | Open sky | throat=1.5 drift=.7 vowel=.6 closure=.6 chest=0 attack=.12 release=.8 turn=0 depth=1 width=.6 ring=.05 whisper=.1 roughness=.24 skew=.4 volume=-1.5 | slap | sixths | Four small bright wandering voices on Eh
Men in the snow hut | Open sky | throat=.68 drift=.15 vowel=.25 closure=.5 chest=.9 attack=.5 turn=0 release=2 depth=.65 roughness=0 fade=22 mouth=.45 width=.4 | dead | tenor | Four long throats on a covered Oh with a full chest
Hired for the evening | Open sky | singers=2 drift=.9 vowel=.12 closure=.9 attack=.15 release=1 turn=0 fade=10 depth=1 chest=.52 ring=0 mouth=.95 width=.5 whisper=.05 roughness=.24 | double | pair | Two tight dry voices on Oh that sink as they hold
Cloud shadow on wheat | Open sky | vowel=.3 mouth=.4 turn=0 closure=.25 attack=3.6 release=8 whisper=.4 ring=.5 roughness=.05 chest=.52 breath=.35 pace=.1 drift=.2 depth=.62 volume=0.5 | swirl | night | Very slow covered voices, airy and ringing, that swell and sink | pad
Blue with no birds in it | Open sky | throat=1.4 vowel=.72 closure=.15 turn=0 attack=2 release=7 whisper=.5 chest=0 depth=.65 roughness=.05 ring=.65 mouth=.6 skew=.7 | shim | air | High soft voices on Ee that ring, half of them air | pad
Long grass at noon | Open sky | vowel=.55 closure=.35 turn=0 attack=1.4 release=5 drift=.8 whisper=.3 ring=.6 singers=3 roughness=.14 throat=.75 width=.7 mouth=.7 chest=.7 | flock | nine | Three ringing voices on Eh that wander | pad
Light through milk | Open sky | vowel=0.06 closure=.1 turn=0 attack=1.8 release=7 whisper=.25 mouth=.7 ring=.85 chest=.15 width=.82 throat=.7 depth=.9 skew=.55 fade=14 | wool | suspend | The softest folds on Oo, ringing smooth | pad
Evening takes the colour | Open sky | vowel=.7 closure=.5 turn=0 attack=.8 fade=7 release=5 ring=.4 roughness=.17 mouth=.55 width=.6 throat=1.2 drift=.2 volume=0.5 | smear | stack | Four small voices between Eh and Ee that sink away | pad
Bell cut from a voice | Throat bells | vowel=.4 ring=.7 closure=.6 fade=3 release=4 whisper=.1 chest=.3 depth=.4 width=.55 roughness=.17 volume=2 | chapel | bells | Struck open tones on Ah that ring | bell
Sky bells, one hand | Throat bells | vowel=.65 throat=1.5 closure=.75 fade=5 singers=3 width=.45 drift=.3 roughness=.14 volume=3.5 | prism | high | Three high bright throats struck on Ee | bell
Bowl kept brim full | Throat bells | vowel=.05 closure=.2 mouth=.6 fade=9 release=9 ring=1 singers=1 depth=.55 width=.65 roughness=.05 chest=.52 drift=.04 skew=.05 | bowls | points | Round soft tones on Oo with a very long ring | bell
Tin chapel, small bell | Throat bells | vowel=.7 mouth=.4 closure=.4 fade=1.2 release=1.5 ring=.55 throat=1.15 whisper=.24 volume=6 | small | bird | Short covered clinks on Ee | bell
Chime that inhales | Throat bells | attack=.4 skew=.8 fade=6 whisper=.5 closure=.4 vowel=.3 release=6 width=.65 chest=.58 mouth=.7 depth=.7 | mirror | bells | Airy tones that swell in and ring away | bell
Keys of thin air | Open sky | attack=.01 fade=3 release=1.2 closure=.35 vowel=.35 ring=.5 turn=0 singers=2 width=.82 | lifted | descend | Soft open tones of two voices, struck and fading | keys
Hymn on bare boards | Open sky | attack=.02 fade=5 release=.8 closure=.55 vowel=.2 ring=.3 turn=0 singers=1 whisper=0 roughness=.14 chest=.32 depth=.7 | wood | pair | Plain open keys on Oh with no air | keys
Warm strings under glass | Open sky | attack=.01 fade=4 release=3 closure=.7 vowel=.75 throat=1.2 ring=.8 turn=0 singers=2 whisper=.1 depth=.65 | strings | ripple | Bright ringing struck tones of two voices | keys
Small mouths on wood | Open sky | attack=.008 fade=.5 release=1 closure=.3 vowel=.1 ring=.75 turn=0 singers=1 whisper=.05 depth=.55 roughness=.02 chest=.15 mouth=.6 drift=.68 skew=.7 volume=1.5 | pinroom | ost | Short round plucks on Oh with a ring | plucked
Syllables on a loom | Open sky | attack=.02 fade=1.4 release=.4 closure=.6 vowel=.5 turn=0 singers=2 whisper=.1 ring=.2 depth=.4 roughness=.05 volume=3 | dotted | ost | Quick plucked syllables of two voices | plucked
Whistled across a field | Open sky | singers=1 ring=1 closure=.05 whisper=.4 vowel=.9 throat=1.4 attack=.1 release=1 turn=0 chest=.58 mouth=.6 depth=.62 fade=16 volume=2.5 | valley | bird | One breathy whistle that is nearly all ring | wind
Ocarina in a coat pocket | Open sky | singers=1 ring=.9 closure=.15 mouth=.3 vowel=.1 whisper=.3 attack=.06 release=.5 turn=0 chest=.3 depth=.9 roughness=.24 skew=.55 | pot | cantus | One covered ringing tone on Oh with air | wind
Alphorn on the far slope | Open sky | singers=1 throat=.72 closure=.7 vowel=.25 attack=.12 release=2 turn=0 whisper=.1 chest=.7 depth=.55 roughness=.17 ring=.4 width=.55 mouth=1 drift=.68 | repeats | call | One long firm throat, calling on Oh | wind
Clarinet made of smoke | Open sky | singers=1 closure=.45 mouth=.45 vowel=.6 whisper=.35 attack=.12 release=.9 turn=0 depth=1 roughness=.17 ring=.4 width=.65 drift=.55 chest=.1 skew=.55 | veil | lament | One covered smoky line on Eh | wind
Kite string in the wind | Open sky | singers=2 ring=.75 closure=.88 vowel=.85 throat=1.5 whisper=.2 drift=.9 attack=.5 turn=0 depth=.55 roughness=0 mouth=1 skew=.05 fade=10 volume=6 | jet | air | Two thin ringing strands on Ee that wander | string
Organ with the sky in it | Open sky | drift=0 singers=3 attack=.05 release=.6 closure=.4 vowel=.4 ring=.8 turn=0 whisper=.1 width=.75 throat=1.05 chest=.55 skew=.7 volume=-10.5 | prism | verse | Still ringing open pipes on Ah | organ
Reeds without a bass | Open sky | drift=.05 singers=2 attack=.03 release=.2 closure=.85 vowel=.65 turn=0 whisper=0 mouth=.6 depth=.9 ring=.06 | chorale | sixths | Hard still reeds on Ee with nothing below | organ
Flue pipes in frost | Open sky | drift=0 singers=1 attack=.08 release=.5 closure=.15 vowel=.08 ring=.95 turn=0 whisper=.5 throat=1.05 mouth=.52 depth=.62 chest=.55 skew=.4 | crypt | tenor | Breathy still pipes on Oo that ring | organ
Glass rims turning | Open sky | drift=.15 singers=2 attack=.3 release=3 closure=.25 vowel=.95 ring=1 turn=0 whisper=.05 roughness=.05 width=.82 mouth=.7 depth=1 volume=-10 | sines | wide | Round gliding tones on Ue, all ring | organ
Viola left outdoors | Open sky | singers=2 closure=.75 vowel=.5 mouth=.5 roughness=.35 attack=.2 release=1 turn=0 whisper=.05 depth=.4 chest=.52 throat=1.32 fade=16 breath=.55 pace=.1 | melt | lament | Two rough covered strings of voice on Eh, breathing in and out | string
Breathing with the tide | Open sky | breath=.8 pace=.15 turn=0 second=1 vowel=.75 closure=.35 release=5 ring=.18 throat=1.3 whisper=.6 mouth=.7 singers=2 width=.75 volume=0 | surf | wide | Small airy voices on Ee in slow breaths
Sighs on a summer bus | Open sky | breath=.9 pace=.8 turn=0 vowel=.34 closure=.45 attack=.15 release=1 singers=1 chest=.25 fade=18 whisper=.7 throat=.75 mouth=.7 width=.4 drift=.55 volume=-5.5 | combo | pair | One tired voice, half of it air, that sighs each second
Drovers at the gate | Open sky | chest=1 throat=.75 closure=.55 vowel=.38 turn=0 attack=.4 release=3 whisper=.1 depth=.4 fade=15 ring=.06 | thin | turn | Four wide long throats on Ah with the chest up
Low guest at the table | Open sky | second=2 turn=.5 pace=.12 vowel=.15 closure=.4 chest=.7 attack=.9 skew=.42 width=.65 drift=.55 roughness=.24 volume=-1.5 | cellos | stack | Open voices on Oh that half find an octave
Sky with one cloud | Open sky | second=8 turn=.4 pace=.25 vowel=.6 closure=.5 attack=.7 ring=.3 skew=.36 chest=.58 width=.3 drift=.68 fade=16 | tiles | hum | Open voices on Eh with a passing flutter of eight
Rough edge of the blue | Open sky | roughness=.7 closure=.7 vowel=.4 turn=0 attack=.3 release=2 whisper=.1 singers=3 chest=.52 throat=1.05 skew=.7 | slack | turn | Three growling open voices on Ah
Hoarse from calling | Open sky | roughness=.85 whisper=.8 closure=.6 vowel=.93 turn=0 attack=.1 release=.8 singers=1 depth=.65 chest=.25 ring=.3 throat=1.15 mouth=.7 width=.5 volume=-1 | combo | call | One hoarse airy voice on Ue
Grain of the old choir | Open sky | roughness=.35 closure=.6 vowel=.25 turn=0 fade=12 attack=.6 release=3 throat=.8 chest=.32 ring=.34 width=.65 depth=.5 | slowring | suspend | Four rough dark voices that sink as they hold
Folds shut in between | Open sky | depth=1 closure=.8 vowel=.3 turn=0 whisper=0 ring=0 attack=.2 release=1 singers=2 roughness=.05 chest=.15 throat=1.32 drift=.14 skew=.05 fade=12 volume=2 | tube | tenor | Two dry tight open voices on Ah
All the stars out | Open sky | attack=4.5 release=10 vowel=.2 closure=.3 turn=0 throat=.8 chest=.8 whisper=.3 ring=.5 depth=.4 fade=14 skew=.7 | stairs | night | Four slow dark voices on Oh that ring | drone
`,
    },
  ],
}
