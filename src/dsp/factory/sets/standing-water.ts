import { type InstrumentSet } from './set'

// The set of Standing Water. A direction is one thing shaken water is played
// as; in each are ten families of five. A family is a figure, a reading and a
// pool of its own with its own way to speak, and its five differ in register,
// in touch and in what their chain is for. Everything in a note is a multiple
// of it or of its half, so an effect that adds pitches adds octaves.

export const SET: InstrumentSet = {
  device: 'standing-water',
  names: {
    pattern: ['Stripes', 'Squares', 'Hexagons', 'Eightfold', 'Free'],
    reading: ['Height', 'Slope', 'Caustic'],
    pool: ['Round', 'Long', 'Sea'],
  },
  // prettier-ignore
  chains: {
    // Near: colour, width, a body, the smallest rooms.
    bare: { effects: [{ deviceId: 'ambient-eq', preset: 'Open' }], words: ', with nothing round it' },
    warm: { effects: [{ deviceId: 'ambient-eq', preset: 'Warm' }], words: ', close and warm' },
    shaded: { effects: [{ deviceId: 'ambient-eq', preset: 'Shaded' }, { deviceId: 'spread', preset: 'Wide but safe' }], words: ', dry, the top shaded' },
    lit: { effects: [{ deviceId: 'ambient-eq', preset: 'Bright' }, { deviceId: 'stereo-widener', preset: 'Gently wide' }], words: ', dry and lit from above' },
    thin: { effects: [{ deviceId: 'ambient-eq', preset: 'Thin' }], words: ', thin and dry' },
    cellar: { effects: [{ deviceId: 'ambient-eq', preset: 'Deep' }, { deviceId: 'spread', preset: 'Firm bass' }], words: ', dry and deep' },
    muffled: { effects: [{ deviceId: 'ambient-eq', preset: 'Muffled' }, { deviceId: 'stereo-widener', preset: 'Narrow' }], words: ', muffled, in the middle' },
    firm: { effects: [{ deviceId: 'spread', preset: 'Firm bass' }, { deviceId: 'ambient-comp', preset: 'Glue' }], words: ', held firm and dry' },
    airy: { effects: [{ deviceId: 'spread', preset: 'Firm and airy' }], words: ', dry and open at the top' },
    mono: { effects: [{ deviceId: 'stereo-widener', preset: 'Mono' }, { deviceId: 'analog-drive', preset: 'First hint' }], words: ', dry, from one point' },
    wide: { effects: [{ deviceId: 'stereo-widener', preset: 'Wide' }, { deviceId: 'ambient-comp', preset: 'Level' }], words: ', dry and very wide' },
    edges: { effects: [{ deviceId: 'spread', preset: 'Hazy edges' }], words: ', dry with hazy edges' },
    even: { effects: [{ deviceId: 'ambient-comp', preset: 'Keys' }], words: ', evened out and dry' },
    tamed: { effects: [{ deviceId: 'ambient-comp', preset: 'Pluck tamer' }, { deviceId: 'spread', preset: 'Open middle' }], words: ', its front held back, dry' },
    mike: { effects: [{ deviceId: 'distance', preset: 'Close mic' }], words: ', right at the microphone' },
    steps: { effects: [{ deviceId: 'distance', preset: 'A few steps back' }], words: ', a few steps away' },
    booth: { effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.22 } }], words: ', in a small booth' },
    chamber: { effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber' }], words: ', in a tight chamber' },
    tiles: { effects: [{ deviceId: 'plate-reverb', preset: 'Tight room' }], words: ', before a short plate' },
    alcove: { effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.28 } }], words: ', in a short alcove' },
    console: { effects: [{ deviceId: 'analog-drive', preset: 'Console' }], words: ', through a console' },
    iron: { effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }, { deviceId: 'spread', preset: 'Firm bass' }], words: ', with iron in the lows' },
    valve: { effects: [{ deviceId: 'saturator', preset: 'Tube preamp' }, { deviceId: 'ambient-eq', preset: 'Shaded' }], words: ', through a warm valve' },
    reel: { effects: [{ deviceId: 'tape', preset: 'Quarter inch' }], words: ', on quarter inch tape' },
    blanket: { effects: [{ deviceId: 'tape', preset: 'Under a blanket' }], words: ', on tape under a blanket' },
    thick: { effects: [{ deviceId: 'stereo-detune', preset: 'Thickener' }], words: ', thickened and dry' },
    pillow: { effects: [{ deviceId: 're-amp', preset: 'Pillow speaker' }], words: ', from a pillow speaker' },
    cupboard: { effects: [{ deviceId: 're-amp', preset: 'In the cupboard' }], words: ', in a cupboard' },
    felted: { effects: [{ deviceId: 'sift', preset: 'Soft hammers' }], words: ', its strike softened, dry' },
    wood: { effects: [{ deviceId: 'vessel', preset: 'Hint of wood' }], words: ', in a thin wooden body' },
    clay: { effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.4 } }], words: ', inside a clay pot' },
    tube: { effects: [{ deviceId: 'vessel', preset: 'Glass tube', params: { mix: 0.35 } }, { deviceId: 'stereo-widener', preset: 'Gently wide' }], words: ', down a glass tube' },
    pipe: { effects: [{ deviceId: 'vessel', preset: 'Inside a pipe', params: { mix: 0.35 } }], words: ', inside a pipe' },
    vowel: { effects: [{ deviceId: 'imprint', preset: 'Faint vowel' }], words: ', with a faint vowel on it' },
    giant: { effects: [{ deviceId: 'size', preset: 'A shade larger' }, { deviceId: 'ambient-eq', preset: 'Warm' }], words: ', its body a size larger' },
    tiny: { effects: [{ deviceId: 'size', preset: 'Smaller' }, { deviceId: 'spread', preset: 'Open middle' }], words: ', its body made smaller' },
    // Worn and driven.
    combo: { effects: [{ deviceId: 're-amp', preset: 'Combo in a room' }], words: ', from a small amplifier' },
    bedside: { effects: [{ deviceId: 're-amp', preset: 'Bedside radio' }], words: ', from a bedside radio' },
    downhall: { effects: [{ deviceId: 're-amp', preset: 'Down the hall' }], words: ', from a speaker down the hall' },
    triode: { effects: [{ deviceId: 'analog-drive', preset: 'Triode glow' }, { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } }], words: ', glowing a little' },
    cassette: { effects: [{ deviceId: 'patina', preset: 'Worn cassette' }], words: ', on a worn cassette' },
    hotvalve: { effects: [{ deviceId: 'patina', preset: 'Hot valve' }, { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } }], words: ', through a hot valve' },
    record: { effects: [{ deviceId: 'vinyl', preset: 'Dull stylus' }, { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } }], words: ', off a dull record' },
    pressing: { effects: [{ deviceId: 'vinyl', preset: 'New pressing' }], words: ', on a new pressing' },
    wornout: { effects: [{ deviceId: 'tape', preset: 'Worn thin' }, { deviceId: 'hall-reverb', preset: 'Room' }], words: ', worn thin on tape' },
    driftape: { effects: [{ deviceId: 'tape', preset: 'Drifting chorus' }, { deviceId: 'spread', preset: 'Wide pad' }], words: ', drifting on two tapes' },
    glaze: { effects: [{ deviceId: 'vintage-digital', preset: 'Glaze' }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', glazed by a sampler' },
    stream: { effects: [{ deviceId: 'low-bitrate', preset: 'Watery trace' }, { deviceId: 'spread', preset: 'Hazy edges' }], words: ', with a watery trace' },
    hiss: { effects: [{ deviceId: 'noise-floor', preset: 'Faint hiss' }, { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } }], words: ', in faint hiss' },
    transistor: { effects: [{ deviceId: 'radio', preset: 'Clean transistor', params: { mix: 0.6 } }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', from a small radio' },
    bathtub: { effects: [{ deviceId: 'underwater', preset: 'Bathtub' }], words: ', heard from a bathtub' },
    shallows: { effects: [{ deviceId: 'underwater', preset: 'Sunlit shallows' }], words: ', seen in sunlit shallows' },
    toe: { effects: [{ deviceId: 'underwater', preset: 'A toe in' }, { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } }], words: ', half wet' },
    drips: { effects: [{ deviceId: 'weather', preset: 'Slow drips', params: { voice: 0.25 } }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', with slow drips about' },
    rain: { effects: [{ deviceId: 'weather', preset: 'Light rain', params: { voice: 0.25 } }], words: ', in light rain' },
    surf: { effects: [{ deviceId: 'weather', preset: 'Slow surf', params: { voice: 0.25 } }, { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } }], words: ', in slow surf' },
    // Movement.
    chorale: { effects: [{ deviceId: 'rotary', preset: 'Chorale', params: { mix: 0.7 } }], words: ', behind slow horns' },
    drum: { effects: [{ deviceId: 'rotary', preset: 'Dark drum' }, { deviceId: 'hall-reverb', preset: 'Room' }], words: ', on a dark turning drum' },
    trem: { effects: [{ deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.4 } }, { deviceId: 'spring-reverb', preset: 'Hint of spring' }], words: ', pulsing before a spring' },
    harmtrem: { effects: [{ deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { depth: 0.6 } }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', swaying dark to bright' },
    panned: { effects: [{ deviceId: 'tremolo', preset: 'Slow pan' }], words: ', dry, side to side' },
    swells: { effects: [{ deviceId: 'tremolo', preset: 'Sea swell', params: { depth: 0.55 } }], words: ', rolling unevenly, dry' },
    chorus: { effects: [{ deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } }], words: ', in a slow chorus' },
    ensemble: { effects: [{ deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.4 } }, { deviceId: 'hall-reverb', preset: 'Room' }], words: ', in a deep ensemble' },
    vibrato: { effects: [{ deviceId: 'late-vibrato', preset: 'Slow bow' }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', with a late sway' },
    swirl: { effects: [{ deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } }], words: ', in a slow phaser' },
    glacial: { effects: [{ deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.4 } }, { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.22 } }], words: ', swept very slowly' },
    jet: { effects: [{ deviceId: 'flanger', preset: 'Gentle sweep', params: { mix: 0.35 } }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', gently flanged' },
    lowpass: { effects: [{ deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { mix: 0.8 } }], words: ', under a slow filter' },
    wah: { effects: [{ deviceId: 'auto-filter', preset: 'Touch wah', params: { mix: 0.5 } }, { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.16 } }], words: ', each touch opening a filter' },
    notch: { effects: [{ deviceId: 'auto-filter', preset: 'Slow notch' }, { deviceId: 'hall-reverb', preset: 'Faint halo' }], words: ', a slow notch going through' },
    current: { effects: [{ deviceId: 'currents', preset: 'Slow water' }, { deviceId: 'hall-reverb', preset: 'Room' }], words: ', moved band by band' },
    ripples: { effects: [{ deviceId: 'currents', preset: 'Ripples' }], words: ', rippling in bands' },
    onwater: { effects: [{ deviceId: 'glimmer', preset: 'Light on water' }, { deviceId: 'ether-reverb', preset: 'Faint air' }], words: ', each tone flickering' },
    twinkle: { effects: [{ deviceId: 'glimmer', preset: 'Sudden glints' }, { deviceId: 'hall-reverb', preset: 'Faint halo' }], words: ', tones catching the light' },
    throb: { effects: [{ deviceId: 'pulses', preset: 'Soft throb' }], words: ', softly throbbing' },
    sides: { effects: [{ deviceId: 'pulses', preset: 'Left then right' }, { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.18 } }], words: ', gated left then right' },
    sigh: { effects: [{ deviceId: 'breath', preset: 'Calm breath', params: { air: 0.1 } }, { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.22 } }], words: ', breathing in and out' },
    wander: { effects: [{ deviceId: 'around', preset: 'Slow wander' }], words: ', wandering round the head' },
    eight: { effects: [{ deviceId: 'around', preset: 'Slow eight' }, { deviceId: 'ether-reverb', preset: 'Faint air' }], words: ', on a slow eight round you' },
    flock: { effects: [{ deviceId: 'murmuration', preset: 'Evening flock', params: { mix: 0.4 } }], words: ', in a loose flock' },
    bowed: { effects: [{ deviceId: 'swell', preset: 'Soft pick' }, { deviceId: 'hall-reverb', preset: 'Faint halo' }], words: ', with the front taken off' },
    lowpulse: { effects: [{ deviceId: 'band-pulse', preset: 'Slow low pulse' }], words: ', its middle pulsing slowly' },
    easing: { effects: [{ deviceId: 'winding-down', preset: 'Soft losing pace' }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', with a pulse that slows' },
    // Echoes.
    darkecho: { effects: [{ deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.28 } }], words: ', with dark echoes' },
    clean: { effects: [{ deviceId: 'analog-delay', preset: 'Clean echo', params: { mix: 0.25 } }], words: ', with clean echoes' },
    slap: { effects: [{ deviceId: 'analog-delay', preset: 'Slapback', params: { mix: 0.3 } }], words: ', with one slap behind' },
    warmecho: { effects: [{ deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.28 } }], words: ', with warm tape repeats' },
    heads: { effects: [{ deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } }, { deviceId: 'plate-reverb', preset: 'Small plate' }], words: ', answered by three heads' },
    trail: { effects: [{ deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.3 } }], words: ', leaving a long dark trail' },
    dotted: { effects: [{ deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.28 } }], words: ', with dotted echoes' },
    stars: { effects: [{ deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.32 } }], words: ', in seven scattered echoes' },
    darkfield: { effects: [{ deviceId: 'constellation', preset: 'Dark field', params: { mix: 0.4 } }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', in a dark field of echoes' },
    shadow: { effects: [{ deviceId: 'canon', preset: 'Octave shadow' }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', followed at the octave' },
    pebble: { effects: [{ deviceId: 'skipping-stone', preset: 'Soft pebble' }], words: ', with echoes skipping off' },
    slowing: { effects: [{ deviceId: 'skipping-stone', preset: 'Slowing bounces' }, { deviceId: 'hall-reverb', preset: 'Faint halo' }], words: ', with echoes that slow down' },
    fan: { effects: [{ deviceId: 'prism', preset: 'Low to high', params: { mix: 0.4 } }], words: ', unfolding low to high' },
    mirror: { effects: [{ deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.35 } }], words: ', with backward swells' },
    moons: { effects: [{ deviceId: 'orbits', preset: 'Two voices', params: { mix: 0.35 } }, { deviceId: 'ether-reverb', preset: 'Faint air' }], words: ', over two unequal loops' },
    recall: { effects: [{ deviceId: 'echo-memory', preset: 'Recalling', params: { mix: 0.32 } }], words: ', with moments coming back' },
    loop: { effects: [{ deviceId: 'tape-loop', preset: 'Slow fade', params: { mix: 0.28 } }], words: ', over a fading tape loop' },
    grains: { effects: [{ deviceId: 'grain-delay', preset: 'Plain repeat' }, { deviceId: 'hall-reverb', preset: 'Faint halo' }], words: ', with grainy repeats' },
    stack: { effects: [{ deviceId: 'cascade', preset: 'Octave stack', params: { mix: 0.3 } }], words: ', stacked up in octaves' },
    sparks: { effects: [{ deviceId: 'glints', preset: 'First light' }, { deviceId: 'ether-reverb', preset: 'Faint air' }], words: ', throwing off small sparks' },
    // Rooms, plates and halls.
    parlour: { effects: [{ deviceId: 'ether-reverb', preset: 'Room' }, { deviceId: 'ambient-eq', preset: 'Warm' }], words: ', in a warm room' },
    darkroom: { effects: [{ deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } }], words: ', in a small dark room' },
    plate: { effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.28 } }], words: ', on a plate' },
    darkplate: { effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.35 } }], words: ', on a dark plate' },
    brightplate: { effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.24 } }], words: ', on a bright plate' },
    springs: { effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.28 } }], words: ', before long springs' },
    pressed: { effects: [{ deviceId: 'fet-limiter', preset: 'Light touch' }, { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } }], words: ', pressed down in a hall' },
    hall: { effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }], words: ', in a hall' },
    nave: { effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } }], words: ', in a stone nave' },
    darkhall: { effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.35 } }], words: ', in a dark hall' },
    brighthall: { effects: [{ deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.25 } }], words: ', in a bright hall' },
    airtail: { effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } }], words: ', under an airy tail' },
    valley: { effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }], words: ', across an open valley' },
    cave: { effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.35 } }], words: ', deep in a dark cave' },
    breathing: { effects: [{ deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.4 } }], words: ', in a hall that breathes' },
    open: { effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } }], words: ', in a wide open space' },
    lowvault: { effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.3 } }], words: ', under a low vault' },
    swelling: { effects: [{ deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.35 } }], words: ', in a space that swells' },
    latehall: { effects: [{ deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.32 } }], words: ', in a hall that comes late' },
    stairs: { effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }], words: ', in a stone stairwell' },
    farshore: { effects: [{ deviceId: 'distance', preset: 'Far shore' }], words: ', heard from a far shore' },
    well: { effects: [{ deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.3 } }], words: ', down a dark well' },
    bloom: { effects: [{ deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.35 } }], words: ', with a tail that blooms' },
    sucked: { effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.32 } }], words: ', with a tail run backwards' },
    // Clouds, halos, octaves and what stays.
    cloud: { effects: [{ deviceId: 'fog', preset: 'Soft cloud' }], words: ', in a soft cloud' },
    mist: { effects: [{ deviceId: 'fog', preset: 'Morning mist' }, { deviceId: 'hall-reverb', preset: 'Faint halo' }], words: ', in morning mist' },
    bank: { effects: [{ deviceId: 'fog', preset: 'Dark bank' }, { deviceId: 'spread', preset: 'Hazy edges' }], words: ', behind a dark bank of fog' },
    haze: { effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.4 } }], words: ', in a hanging spectral mist' },
    blurred: { effects: [{ deviceId: 'spectral-blur', preset: 'Faint haze' }, { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.18 } }], words: ', smeared a little' },
    graincloud: { effects: [{ deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.35 } }], words: ', in a cloud of grains' },
    glow: { effects: [{ deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.35 } }], words: ', in a faint warm glow' },
    melt: { effects: [{ deviceId: 'melt', preset: 'Slow melt', params: { mix: 0.35 } }], words: ', with a tail that sags' },
    stretched: { effects: [{ deviceId: 'stretch', preset: 'Faint halo' }], words: ', trailing a stretched halo' },
    held: { effects: [{ deviceId: 'sustainer', preset: 'Thin halo' }], words: ', with a thin halo held on' },
    sines: { effects: [{ deviceId: 'sine-shadow', preset: 'Nearly dry' }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', with sines lingering after' },
    follower: { effects: [{ deviceId: 'pad-follower', preset: 'Barely there' }], words: ', with strings barely behind' },
    bowls: { effects: [{ deviceId: 'bowls', preset: 'Faint halo' }], words: ', waking a table of bowls' },
    strings: { effects: [{ deviceId: 'sympathetic', preset: 'Short halo', params: { root: 2, mode: 1 } }], words: ', waking a few strings' },
    shimmer: { effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.3 } }], words: ', with a faint halo above' },
    under: { effects: [{ deviceId: 'shimmer', preset: 'Undertow', params: { mix: 0.3 } }], words: ', with an octave under its tail' },
    oo: { effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.3 } }], words: ', with a wordless oo behind' },
    voices: { effects: [{ deviceId: 'vowel-reverb', preset: 'Faint voices' }], words: ', with faint voices in the tail' },
    octave: { effects: [{ deviceId: 'octaves', preset: 'Faint octave' }, { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } }], words: ', a faint octave beside it' },
    pedal: { effects: [{ deviceId: 'stops', preset: 'Pedal under' }], words: ', with an organ pedal under' },
    flutestop: { effects: [{ deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.5 } }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', with flute stops on it' },
    halfspeed: { effects: [{ deviceId: 'half-speed', preset: 'Under the mix' }], words: ', with half speed beneath' },
    bed: { effects: [{ deviceId: 'micro-looper', preset: 'Faint bed' }], words: ', over a faint looped bed' },
    afterimage: { effects: [{ deviceId: 'generations', preset: 'Faint afterimage' }], words: ', leaving an afterimage' },
    tails: { effects: [{ deviceId: 'lift', preset: 'Long tails' }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', its tail brought up' },
    overtones: { effects: [{ deviceId: 'reveal', preset: 'Overtones' }, { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } }], words: ', its overtones drawn out' },
    evening: { effects: [{ deviceId: 'seasons', preset: 'Long evening' }], words: ', in a long dim evening' },
    frost: { effects: [{ deviceId: 'seasons', preset: 'First frost' }], words: ', in a first frost' },
    frozen: { effects: [{ deviceId: 'spectral-blur', preset: 'Long clean hold', params: { mix: 0.35 } }], words: ', its tones held on behind' },
  },
  // prettier-ignore
  phrases: {
    // A ninth, then the dominant over a bass that falls a fifth; the third is held across.
    shore: { notes: [{ atSec: 0, durSec: 3.6, note: 50, gain: 0.6 }, { atSec: 0, durSec: 3.6, note: 57, gain: 0.5 }, { atSec: 0, durSec: 7.2, note: 65, gain: 0.5 }, { atSec: 0, durSec: 3.6, note: 76, gain: 0.45 }, { atSec: 3.6, durSec: 3.6, note: 43, gain: 0.6 }, { atSec: 3.6, durSec: 3.6, note: 59, gain: 0.45 }, { atSec: 3.6, durSec: 3.6, note: 74, gain: 0.45 }] },
    // A minor ninth let in from below, one key after another, all held.
    gather: { notes: [{ atSec: 0, durSec: 7.2, note: 45, gain: 0.6 }, { atSec: 0.6, durSec: 6.6, note: 52, gain: 0.5 }, { atSec: 1.3, durSec: 5.9, note: 60, gain: 0.5 }, { atSec: 2, durSec: 5.2, note: 67, gain: 0.5 }, { atSec: 2.8, durSec: 4.4, note: 71, gain: 0.45 }, { atSec: 3.6, durSec: 3.6, note: 76, gain: 0.4 }] },
    // The bass ties over and gives way: ninths that open to tenths, under one still tone.
    ties: { notes: [{ atSec: 0, durSec: 2.7, note: 50, gain: 0.6 }, { atSec: 2.7, durSec: 1.8, note: 48, gain: 0.6 }, { atSec: 4.5, durSec: 1.5, note: 47, gain: 0.6 }, { atSec: 6, durSec: 1.3, note: 45, gain: 0.6 }, { atSec: 0, durSec: 1.8, note: 65, gain: 0.55 }, { atSec: 1.8, durSec: 1.8, note: 64, gain: 0.5 }, { atSec: 3.6, durSec: 1.8, note: 62, gain: 0.5 }, { atSec: 5.4, durSec: 1.9, note: 60, gain: 0.5 }, { atSec: 0, durSec: 7.3, note: 69, gain: 0.35 }] },
    // Three chords that share their top note.
    plain: { notes: [{ atSec: 0, durSec: 2.4, note: 48, gain: 0.55 }, { atSec: 0, durSec: 2.4, note: 55, gain: 0.45 }, { atSec: 0, durSec: 2.4, note: 64, gain: 0.45 }, { atSec: 0, durSec: 7.2, note: 71, gain: 0.45 }, { atSec: 2.4, durSec: 2.4, note: 45, gain: 0.55 }, { atSec: 2.4, durSec: 2.4, note: 60, gain: 0.45 }, { atSec: 2.4, durSec: 2.4, note: 64, gain: 0.45 }, { atSec: 4.8, durSec: 2.4, note: 41, gain: 0.6 }, { atSec: 4.8, durSec: 2.4, note: 57, gain: 0.45 }, { atSec: 4.8, durSec: 2.4, note: 64, gain: 0.45 }] },
    // A low fifth, and late an octave over it.
    fifth: { notes: [{ atSec: 0, durSec: 7.3, note: 38, gain: 0.65 }, { atSec: 0.4, durSec: 6.9, note: 45, gain: 0.5 }, { atSec: 3.4, durSec: 3.9, note: 62, gain: 0.35 }] },
    // One low note and, when it has grown, its fifth.
    deep: { notes: [{ atSec: 0, durSec: 7.2, note: 36, gain: 0.75 }, { atSec: 3, durSec: 4.2, note: 43, gain: 0.5 }] },
    // Two very low notes, each alone.
    abyss: { notes: [{ atSec: 0, durSec: 3.4, note: 33, gain: 0.8 }, { atSec: 3.6, durSec: 3.7, note: 28, gain: 0.85 }] },
    // A bass that steps, leaps an octave and falls.
    stride: { notes: [{ atSec: 0, durSec: 0.7, note: 38, gain: 0.75 }, { atSec: 1, durSec: 0.4, note: 38, gain: 0.45 }, { atSec: 1.6, durSec: 0.6, note: 50, gain: 0.6 }, { atSec: 2.4, durSec: 0.9, note: 43, gain: 0.65 }, { atSec: 3.4, durSec: 0.5, note: 41, gain: 0.6 }, { atSec: 4, durSec: 0.9, note: 36, gain: 0.75 }, { atSec: 5.1, durSec: 0.4, note: 48, gain: 0.5 }, { atSec: 5.6, durSec: 1.7, note: 33, gain: 0.75 }] },
    // Four steps down to the dominant and home.
    ground: { notes: [{ atSec: 0, durSec: 1.5, note: 45, gain: 0.7 }, { atSec: 1.5, durSec: 1.5, note: 43, gain: 0.65 }, { atSec: 3, durSec: 1.5, note: 41, gain: 0.7 }, { atSec: 4.5, durSec: 1.2, note: 40, gain: 0.65 }, { atSec: 5.7, durSec: 1.6, note: 33, gain: 0.75 }] },
    // A low figure that comes round, with a hole in it.
    mill: { notes: [{ atSec: 0, durSec: 0.35, note: 40, gain: 0.75 }, { atSec: 0.6, durSec: 0.35, note: 47, gain: 0.55 }, { atSec: 1.2, durSec: 0.6, note: 43, gain: 0.65 }, { atSec: 2.4, durSec: 0.35, note: 40, gain: 0.7 }, { atSec: 3, durSec: 0.35, note: 47, gain: 0.5 }, { atSec: 3.6, durSec: 0.6, note: 45, gain: 0.65 }, { atSec: 4.8, durSec: 0.35, note: 40, gain: 0.7 }, { atSec: 5.4, durSec: 1.9, note: 36, gain: 0.75 }] },
    // Broken tenths over a bass that goes down in thirds.
    tenths: { notes: [{ atSec: 0, durSec: 1.9, note: 48, gain: 0.6 }, { atSec: 0.3, durSec: 1.6, note: 64, gain: 0.5 }, { atSec: 0.6, durSec: 1.4, note: 71, gain: 0.45 }, { atSec: 0.9, durSec: 1.3, note: 67, gain: 0.4 }, { atSec: 1.3, durSec: 1, note: 74, gain: 0.5 }, { atSec: 2.4, durSec: 1.9, note: 45, gain: 0.6 }, { atSec: 2.7, durSec: 1.6, note: 60, gain: 0.5 }, { atSec: 3, durSec: 1.4, note: 64, gain: 0.45 }, { atSec: 3.3, durSec: 1.3, note: 71, gain: 0.45 }, { atSec: 3.7, durSec: 1, note: 72, gain: 0.5 }, { atSec: 4.8, durSec: 2.5, note: 41, gain: 0.6 }, { atSec: 5.1, durSec: 2.2, note: 57, gain: 0.5 }, { atSec: 5.4, durSec: 1.9, note: 64, gain: 0.45 }, { atSec: 5.7, durSec: 1.6, note: 72, gain: 0.45 }, { atSec: 6.1, durSec: 1.2, note: 76, gain: 0.5 }] },
    // Short chords off the beat, led by step.
    hands: { notes: [{ atSec: 0, durSec: 0.5, note: 57, gain: 0.5 }, { atSec: 0, durSec: 0.5, note: 64, gain: 0.5 }, { atSec: 0, durSec: 0.5, note: 72, gain: 0.55 }, { atSec: 1, durSec: 0.35, note: 57, gain: 0.4 }, { atSec: 1, durSec: 0.35, note: 65, gain: 0.4 }, { atSec: 1, durSec: 0.35, note: 72, gain: 0.45 }, { atSec: 2.2, durSec: 0.8, note: 55, gain: 0.5 }, { atSec: 2.2, durSec: 0.8, note: 62, gain: 0.5 }, { atSec: 2.2, durSec: 0.8, note: 71, gain: 0.55 }, { atSec: 3.6, durSec: 0.4, note: 52, gain: 0.5 }, { atSec: 3.6, durSec: 0.4, note: 60, gain: 0.45 }, { atSec: 3.6, durSec: 0.4, note: 67, gain: 0.5 }, { atSec: 4.4, durSec: 0.4, note: 53, gain: 0.4 }, { atSec: 4.4, durSec: 0.4, note: 60, gain: 0.4 }, { atSec: 4.4, durSec: 0.4, note: 69, gain: 0.45 }, { atSec: 5.4, durSec: 1.7, note: 57, gain: 0.55 }, { atSec: 5.4, durSec: 1.7, note: 60, gain: 0.45 }, { atSec: 5.4, durSec: 1.7, note: 67, gain: 0.45 }, { atSec: 5.4, durSec: 1.7, note: 76, gain: 0.45 }] },
    // Two hands that answer, the second the first turned over.
    invention: { notes: [{ atSec: 0, durSec: 0.4, note: 69, gain: 0.6 }, { atSec: 0.4, durSec: 0.4, note: 71, gain: 0.5 }, { atSec: 0.8, durSec: 0.8, note: 72, gain: 0.6 }, { atSec: 1.6, durSec: 0.4, note: 57, gain: 0.55 }, { atSec: 2, durSec: 0.4, note: 55, gain: 0.5 }, { atSec: 2.4, durSec: 0.8, note: 53, gain: 0.6 }, { atSec: 2.4, durSec: 0.8, note: 69, gain: 0.45 }, { atSec: 3.2, durSec: 0.4, note: 67, gain: 0.55 }, { atSec: 3.6, durSec: 0.4, note: 69, gain: 0.5 }, { atSec: 4, durSec: 0.8, note: 71, gain: 0.6 }, { atSec: 4, durSec: 0.8, note: 55, gain: 0.45 }, { atSec: 4.8, durSec: 0.4, note: 60, gain: 0.55 }, { atSec: 5.2, durSec: 0.4, note: 59, gain: 0.5 }, { atSec: 5.6, durSec: 1.6, note: 57, gain: 0.6 }, { atSec: 5.6, durSec: 1.6, note: 72, gain: 0.5 }] },
    // One line that climbs a sixth, turns and comes back.
    arch: { notes: [{ atSec: 0, durSec: 1.8, note: 62, gain: 0.6 }, { atSec: 1.8, durSec: 0.8, note: 64, gain: 0.55 }, { atSec: 2.6, durSec: 0.8, note: 67, gain: 0.6 }, { atSec: 3.4, durSec: 1.6, note: 71, gain: 0.7 }, { atSec: 5, durSec: 0.7, note: 69, gain: 0.55 }, { atSec: 5.7, durSec: 1.6, note: 64, gain: 0.55 }] },
    // Two lines in contrary motion that close on an octave.
    two: { notes: [{ atSec: 0, durSec: 1.6, note: 62, gain: 0.55 }, { atSec: 0, durSec: 1.6, note: 77, gain: 0.5 }, { atSec: 1.6, durSec: 1.2, note: 64, gain: 0.5 }, { atSec: 1.6, durSec: 1.2, note: 76, gain: 0.5 }, { atSec: 2.8, durSec: 1.2, note: 65, gain: 0.5 }, { atSec: 2.8, durSec: 1.2, note: 74, gain: 0.5 }, { atSec: 4, durSec: 0.8, note: 67, gain: 0.5 }, { atSec: 4, durSec: 0.8, note: 71, gain: 0.5 }, { atSec: 4.8, durSec: 2.4, note: 60, gain: 0.55 }, { atSec: 4.8, durSec: 2.4, note: 72, gain: 0.5 }] },
    // A call in the treble, and its answer a tenth under.
    call: { notes: [{ atSec: 0, durSec: 0.6, note: 72, gain: 0.65 }, { atSec: 0.6, durSec: 0.5, note: 74, gain: 0.55 }, { atSec: 1.1, durSec: 1.5, note: 79, gain: 0.65 }, { atSec: 2.9, durSec: 0.6, note: 60, gain: 0.5 }, { atSec: 3.5, durSec: 0.5, note: 62, gain: 0.45 }, { atSec: 4, durSec: 1.4, note: 64, gain: 0.55 }, { atSec: 5.6, durSec: 1.7, note: 72, gain: 0.5 }] },
    // Bells far apart, high up.
    wharf: { notes: [{ atSec: 0, durSec: 0.5, note: 84, gain: 0.6 }, { atSec: 1.1, durSec: 0.5, note: 79, gain: 0.5 }, { atSec: 2, durSec: 0.5, note: 88, gain: 0.5 }, { atSec: 3.3, durSec: 0.5, note: 86, gain: 0.5 }, { atSec: 4.2, durSec: 0.6, note: 81, gain: 0.5 }, { atSec: 5.5, durSec: 0.8, note: 91, gain: 0.4 }] },
    // Bells that come down in thirds over two low ones.
    chimes: { notes: [{ atSec: 0, durSec: 0.5, note: 79, gain: 0.55 }, { atSec: 0.6, durSec: 0.5, note: 76, gain: 0.5 }, { atSec: 1.2, durSec: 0.5, note: 72, gain: 0.5 }, { atSec: 1.2, durSec: 1.5, note: 48, gain: 0.55 }, { atSec: 2.4, durSec: 0.5, note: 81, gain: 0.55 }, { atSec: 3, durSec: 0.5, note: 77, gain: 0.5 }, { atSec: 3.6, durSec: 0.5, note: 74, gain: 0.5 }, { atSec: 3.6, durSec: 1.5, note: 45, gain: 0.55 }, { atSec: 5, durSec: 0.6, note: 76, gain: 0.55 }, { atSec: 5.8, durSec: 1.2, note: 67, gain: 0.5 }] },
    // One bell, its fifth, and the first again an octave down.
    toll: { notes: [{ atSec: 0, durSec: 0.8, note: 50, gain: 0.75 }, { atSec: 2, durSec: 0.8, note: 57, gain: 0.6 }, { atSec: 3.8, durSec: 1.4, note: 38, gain: 0.75 }] },
    // Single drops, no two waits alike.
    drips: { notes: [{ atSec: 0, durSec: 0.15, note: 74, gain: 0.65 }, { atSec: 0.5, durSec: 0.15, note: 81, gain: 0.5 }, { atSec: 1.4, durSec: 0.15, note: 67, gain: 0.6 }, { atSec: 1.7, durSec: 0.15, note: 79, gain: 0.45 }, { atSec: 2.8, durSec: 0.15, note: 62, gain: 0.6 }, { atSec: 3.3, durSec: 0.15, note: 76, gain: 0.5 }, { atSec: 3.5, durSec: 0.15, note: 83, gain: 0.4 }, { atSec: 4.6, durSec: 0.15, note: 69, gain: 0.6 }, { atSec: 5.6, durSec: 0.4, note: 57, gain: 0.6 }, { atSec: 6, durSec: 0.4, note: 72, gain: 0.45 }] },
    // A slow broken chord with a tune on its top.
    lute: { notes: [{ atSec: 0, durSec: 0.5, note: 50, gain: 0.65 }, { atSec: 0.3, durSec: 0.5, note: 57, gain: 0.5 }, { atSec: 0.6, durSec: 0.5, note: 65, gain: 0.5 }, { atSec: 0.9, durSec: 0.9, note: 74, gain: 0.65 }, { atSec: 1.8, durSec: 0.5, note: 50, gain: 0.55 }, { atSec: 2.1, durSec: 0.5, note: 57, gain: 0.45 }, { atSec: 2.4, durSec: 0.9, note: 72, gain: 0.6 }, { atSec: 3.3, durSec: 0.5, note: 43, gain: 0.65 }, { atSec: 3.6, durSec: 0.5, note: 59, gain: 0.5 }, { atSec: 3.9, durSec: 0.5, note: 65, gain: 0.45 }, { atSec: 4.2, durSec: 0.9, note: 71, gain: 0.6 }, { atSec: 5.1, durSec: 0.5, note: 48, gain: 0.6 }, { atSec: 5.4, durSec: 0.5, note: 55, gain: 0.5 }, { atSec: 5.7, durSec: 0.5, note: 64, gain: 0.45 }, { atSec: 6, durSec: 1.2, note: 67, gain: 0.6 }] },
    // One long note in the middle.
    lone: { notes: [{ atSec: 0, durSec: 6.9, note: 57, gain: 0.65 }] },
    // One long note high up, and late its fourth below.
    star: { notes: [{ atSec: 0, durSec: 6.8, note: 76, gain: 0.55 }, { atSec: 3.4, durSec: 3.4, note: 71, gain: 0.4 }] },
    // A slow low chant on four notes.
    chant: { notes: [{ atSec: 0, durSec: 1.6, note: 50, gain: 0.65 }, { atSec: 1.6, durSec: 0.8, note: 52, gain: 0.55 }, { atSec: 2.4, durSec: 1.6, note: 53, gain: 0.6 }, { atSec: 4, durSec: 0.8, note: 52, gain: 0.5 }, { atSec: 4.8, durSec: 2.5, note: 48, gain: 0.65 }] },
  },
  directions: [
    {
      id: 'pool-pads',
      name: 'Pool pads',
      category: 'pad',
      rows: `
Lido before opening | Pool pad | circle=.08 depth=.06 lag=1.4 splash=.08 calm=4 drift=.1 foam=0 shake=.7 threshold=.4 stray=.1 layers=0 unrest=0 below=.6 volume=-4 | hall | shore | A tiny circle of hexagons, all but a pure tone, a faint octave under it
Noon on the tiles | Pool pad | circle=.85 depth=.7 layers=.5 drift=1.6 stray=.7 splash=.35 stone=.12 shake=.45 threshold=.15 volume=-1 | airy | plain | Wide hexagons in hard light, flickering, a small sharp drop first
Changing room wall | Pool pad | thickness=.7 depth=.5 circle=.5 stray=.1 unrest=.1 calm=1.2 splash=.2 width=.2 shake=.45 threshold=.05 layers=.05 stone=.15 volume=-1 | booth | hands | Thick hexagons that hold still, dull and narrow, soon gone
Lane rope shadows | Pool pad | depth=.9 circle=.35 drift=.5 layers=0 foam=.05 lag=.8 splash=.15 calm=2 shake=.8 threshold=.1 stray=.9 unrest=.05 stone=.2 volume=0 | shaded | ties | Deep light from a narrow circle, bright lines that bend and no fine ripples
Chlorine morning | Pool pad | layers=.95 thickness=.02 circle=.3 depth=.25 foam=.3 drift=.8 splash=.25 stone=.05 shake=.5 threshold=0 below=.2 volume=-2 | plate | gather | Thin water with all its fine ripples riding on it, a little air
Swell with no wind | Pool pad | pool=Sea lag=3 splash=0 depth=.3 circle=.5 stray=.5 drift=.06 calm=7 unrest=.15 shake=.5 threshold=.25 below=.25 volume=-3 | open | gather | Hexagons on the open sea, dark, rolling in without a sound at the front
Buoy line at dawn | Pool pad | pool=Sea reading=Caustic depth=.8 layers=.8 foam=.4 lag=1 splash=.3 stone=.6 width=1 shake=.7 threshold=.35 volume=2.5 | stairs | shore | Light on a wide sea, surging, with foam and a dull stone under
Tanker asleep | Pool pad | pool=Sea below=.9 thickness=.7 circle=.4 lag=2 splash=.05 stray=.3 width=.5 calm=5 shake=.45 threshold=.1 layers=.1 volume=-3 | darkroom | fifth | Thick sea hexagons with the octave under them, slow and heavy
Sea through a letterbox | Pool pad | pool=Sea reading=Slope depth=.5 circle=.7 foam=.5 lag=.8 unrest=.5 width=.1 calm=2 stone=.7 | bedside | plain | A leaning sea, thin in the lows, its surge heard narrow
Ferry deck, hood up | Pool pad | pool=Sea reading=Height depth=.6 foam=1 unrest=.6 drift=.4 lag=1.2 calm=3 splash=.1 shake=.75 threshold=.35 stray=.05 width=.85 volume=2 | surf | shore | Tall soft sea waves with breath thick on them
Weighing scale | Pool pad | pattern=Squares lag=1.2 depth=.35 circle=.6 drift=.02 splash=.1 calm=3 below=.15 shake=.7 threshold=.4 width=1 volume=-1 | hall 1.mix=0.22 | gather | Two crossed waves that trade places every two seconds, hollow and full by turns
Revolving door in rain | Pool pad | pattern=Squares reading=Height circle=.9 depth=.8 drift=.8 foam=.2 thickness=.15 calm=2 shake=.95 threshold=.15 stray=.6 stone=.05 volume=0 | brightplate | plain | Squares read by height on a wide circle, turning and bright
Courtyard from above | Pool pad | pattern=Squares pool=Sea depth=.5 circle=.5 layers=.4 lag=2 drift=.15 calm=6 splash=.04 width=.9 stray=.75 unrest=.65 volume=1.5 | valley | shore | Square figures let out on the sea, each surge another shape
Fold of a tablecloth | Pool pad | pattern=Squares reading=Slope circle=.4 depth=.2 thickness=.5 unrest=.05 stray=.1 drift=.04 calm=1.5 shake=1 threshold=.25 layers=.1 width=.4 stone=.05 volume=0 | thick | ties | Leaning squares, nearly all octave, that tip slowly, their edge kept off
Lantern slides | Alternate squares | drift=.9 circle=.6 depth=.55 lag=1 splash=.05 below=.5 calm=2.5 width=.8 shake=.5 threshold=0 volume=1 | onwater | shore | Squares of light that change over, the octave under them awake
Dark milk | Oil drone | lag=1.1 circle=.3 depth=.25 below=0 splash=.12 stone=.6 calm=3 drift=.25 shake=.45 threshold=.05 layers=.1 width=.15 volume=-2.5 | glow | plain | Thick round hexagons by height, hardly an overtone, rising over two seconds
Felt over the lake | Pool pad | reading=Height circle=.6 depth=.1 thickness=.9 lag=.7 splash=.3 stone=.9 calm=2 foam=.1 stray=.3 shake=.95 threshold=.15 layers=0 unrest=.45 width=.05 below=.35 volume=-0.5 | cloud | ties | A boulder in thick water, then a round dull chord behind it
Wax in a basin | Pool pad | reading=Caustic depth=.9 circle=.7 thickness=.5 lag=1.6 unrest=.5 drift=.08 splash=.05 shake=1 threshold=.3 width=.75 below=.3 layers=.1 volume=-4.5 | melt | gather | Thick water that bends hard light, rough at the core and slow to move
Grandmother's bath | Oil drone | lag=.5 circle=.15 depth=.5 below=.3 drift=1.2 stray=.8 calm=1.5 foam=.35 shake=.45 threshold=0 volume=-3.5 | bathtub | hands | Warm oil that wavers about quickly under a breath of air
Underwater lamp | Pool pad | reading=Height circle=.95 depth=.45 thickness=.4 layers=.6 below=.75 lag=2.2 calm=5 splash=.1 width=.9 shake=.7 threshold=0 stray=.15 unrest=.65 volume=-2.5 | darkhall | shore | Tall wide hexagons with finer ripples above and the octave below
Corridor of one wave | Pool pad | pattern=Stripes circle=.9 depth=.4 lag=1 splash=.06 drift=.15 calm=3 layers=0 unrest=.1 width=.35 reading=Slope shake=.95 threshold=.1 thickness=.2 stray=.1 volume=2 | darkplate | ties | One leaning wave left standing, hollow, odd overtones only
Blinds half down | Pool pad | pattern=Stripes reading=Caustic depth=1 circle=1 drift=2 stray=.8 lag=.6 calm=2 thickness=.1 shake=1 threshold=.2 stone=.05 layers=.7 volume=-1.5 | lit | plain | Stripes in hard light, wide, flickering twice a second
Empty swimming hall | Pool pad | pattern=Stripes reading=Height circle=.35 depth=.5 foam=.9 lag=2 splash=.4 stone=.9 calm=6 shake=.4 threshold=.05 stray=.05 layers=0 unrest=.15 volume=-1.5 | nave | shore | A plain note with much air on it, after one far low stone
Parish hall heating | Pool pad | pattern=Stripes reading=Slope circle=.75 depth=.4 thickness=.5 unrest=0 stray=0 lag=.4 calm=.6 splash=.05 shake=1 threshold=.15 layers=0 width=.35 volume=2.5 | flutestop | hands | Leaning stripes that hold quite still, hollow as a stopped pipe | organ
Weir after dark | Pool pad | pattern=Stripes pool=Sea depth=.6 circle=.4 lag=2.6 layers=.7 foam=.25 splash=.02 calm=7 drift=.3 shake=.9 threshold=.4 unrest=.05 width=.85 below=.3 volume=-1 | mirror | gather | One wave travelling on across the sea, round and surging
Reed bed at four | Pool pad | reading=Slope circle=.5 depth=.35 lag=.8 splash=.08 calm=1.5 drift=.4 thickness=.4 shake=.5 threshold=.15 stray=.6 below=.1 volume=1 | ensemble | shore | Hexagons read by their slope, a thin reedy chord made wide | string
Rosin dust | Pool pad | reading=Slope circle=.75 depth=.15 unrest=.4 stray=.5 drift=1.5 lag=.5 foam=.15 calm=.8 splash=.05 shake=.85 threshold=.15 volume=0 | parlour | ties | Leaning hexagons that waver a little, all edge and no low | string
Steam off wet slate | Pool pad | reading=Slope depth=.8 circle=.3 foam=.7 lag=1.5 splash=.15 stone=.4 calm=4 width=.8 shake=.5 threshold=.25 layers=.15 unrest=.15 volume=4 | wide | gather | Slopes folded past the edge and blown through with air
Hurdy wheel far off | Pool pad | reading=Slope pattern=Stripes circle=.6 depth=.5 lag=.6 unrest=.6 drift=.7 splash=.04 calm=1 below=.4 layers=0 width=.15 volume=-3 | farshore | fifth | A hollow leaning wave that will not keep still, its octave beneath | drone
Sun on a wet dog | Pool pad | reading=Slope layers=.9 circle=.2 depth=.55 thickness=.1 drift=3 stray=.9 lag=.3 splash=.4 stone=.2 shake=1 threshold=.3 unrest=.45 width=.85 volume=-0.5 | shallows | plain | Fine leaning ripples, shaken quickly
Idle moorings | Pool pad | pattern=Free unrest=.2 drift=.12 lag=1.5 depth=.35 circle=.4 splash=.05 calm=4 stray=.2 shake=.4 threshold=0 layers=0 below=.2 volume=-1 | latehall | gather | Six waves barely at odds, thick and thin at the pace of a breath
Market under awnings | Pool pad | pattern=Free reading=Caustic depth=.6 circle=.8 unrest=.5 drift=.5 foam=.1 lag=.6 calm=1.5 splash=.2 shake=.5 threshold=.1 below=.2 volume=1 | tiles | hands | Free waves in bright light, busy inside, with a drop at each key
Barges nudging | Pool pad | pattern=Free reading=Height circle=.5 depth=.5 below=.8 thickness=.5 unrest=.7 drift=.2 lag=1 calm=2 shake=.4 threshold=.1 stray=.9 layers=.45 stone=.85 volume=-0.5 | pedal | fifth | Free waves in thick water, shouldering each other over an octave below
Paper boats adrift | Quarrelling swells | reading=Height unrest=.4 circle=.25 depth=.2 foam=.15 lag=1 drift=.2 calm=3 thickness=.2 below=.3 volume=0.5 | moons | plain | A small circle over six waves, light and round, each taking a turn
Tarpaulin in a breeze | Quarrelling swells | reading=Slope unrest=.6 depth=.3 circle=.6 foam=.5 lag=.7 drift=1 calm=1.5 width=.4 volume=1 | notch | ties | Six leaning waves with wind on them, thin and restless
Canal under a bridge | Pool pad | pool=Long circle=.35 depth=.3 thickness=.6 lag=1 splash=.1 calm=2.5 drift=.25 shake=.8 threshold=.15 stray=.2 layers=.1 unrest=.8 width=.05 below=.15 volume=0 | stairs 1.room=0.6 | shore | Hexagons squeezed into a channel, hollow, tipping from end to end
Throat of the dock | Throat of water | pattern=Hexagons lag=1.2 splash=.05 depth=.3 foam=.15 calm=3 thickness=.5 drift=.2 shake=.7 threshold=0 | oo | gather | A wet vowel that leans across a narrow channel and back
Lock gates closing | Pool pad | pool=Long reading=Height pattern=Stripes depth=.6 circle=.8 thickness=.5 lag=1.8 splash=.4 stone=1 below=.5 shake=.8 threshold=.25 layers=.1 volume=1.5 | cave | fifth | A boulder in a lock, and a hollow tone that stands up after it
Storm drain choir | Pool pad | pool=Long reading=Height circle=.5 depth=.4 foam=.9 unrest=.5 lag=1.3 thickness=.45 calm=3 splash=.06 shake=.85 threshold=0 stray=.2 width=.85 volume=-1.5 | voices | plain | Hexagons in a channel, one vowel with breath all over it
Tin gutter evening | Pool pad | pool=Long pattern=Free depth=.45 circle=.3 thickness=.7 unrest=.5 lag=.7 calm=1.2 splash=.25 stone=.3 width=.9 shake=.75 threshold=.1 stray=.2 layers=.1 volume=5 | cupboard | plain | Free waves down a gutter, nasal, pushing from side to side
Cathedral car park | Pool pad | below=.9 circle=.55 depth=.5 lag=1.5 thickness=.45 splash=.12 stone=.8 calm=4 stray=.4 shake=.85 threshold=.25 layers=.1 volume=-2 | lowvault | shore | Hexagons with a full octave under them, late to arrive
Half past the hour | Alternate squares | pool=Sea below=.8 lag=1.8 drift=.4 depth=.4 circle=.4 splash=.1 calm=5 width=.9 shake=.9 threshold=.1 volume=0 | under | gather | Squares on a sea that stand on their own lower octave
Bread oven glow | Late bass | pattern=Hexagons reading=Caustic lag=1 splash=.05 depth=.2 circle=.3 width=.7 calm=2.5 foam=.1 thickness=.6 shake=.9 threshold=.4 layers=.45 unrest=.05 volume=-4 | blanket | plain | Thick light with the octave below it, dim and near
Two floors down | Pool pad | below=.85 pattern=Squares reading=Height circle=.7 depth=.65 thickness=.5 lag=.8 drift=.5 calm=2 splash=.2 stone=.7 shake=.9 threshold=.05 stray=.15 layers=.5 unrest=.45 width=.15 volume=-1 | downhall | ties | Tall squares that swap over, an octave under them
Roots in a pond | Pool pad | below=1 pattern=Stripes depth=.4 circle=.25 lag=2.4 thickness=.3 splash=.04 calm=6 unrest=.5 layers=.5 width=1 shake=.95 threshold=.05 volume=2.5 | sigh | fifth | A round wave and its lower octave, both rising for two seconds | drone
Slab into the lido | Pool pad | splash=1 stone=.55 lag=2.4 shake=.5 threshold=.15 calm=3 circle=.4 depth=.35 stray=.5 layers=.45 volume=-4.5 | alcove | shore | A hard throw first, a dip, and the hexagons long after it
Pebbles into silk | Pool pad | splash=.8 stone=.1 thickness=.5 lag=1 circle=.25 depth=.25 foam=.05 calm=2 stray=.2 shake=.8 threshold=.1 width=.85 volume=-4.5 | felted | plain | Small pebbles, each opening a soft chord of hexagons
Cargo over the side | Pool pad | splash=.9 stone=.75 foam=.6 lag=.5 depth=.5 circle=.6 layers=.6 calm=3 width=1 shake=.4 threshold=.1 volume=-1 | pressed | hands | A heavy splash that turns straight into wide foaming light
Cup set down | Light on the floor | splash=.7 stone=.35 drift=.3 depth=.4 circle=.35 stray=.3 lag=.15 calm=1 thickness=.4 layers=0 shake=1 threshold=.85 volume=-1.5 | even | hands | A drop and a plain chord at once, soft keys leaving the drop alone | keys
Lamp swings on a hook | Light on the floor | splash=.1 drift=1.1 depth=.6 circle=.5 stray=1 unrest=.6 lag=1.4 calm=4 layers=.4 thickness=.25 shake=.75 threshold=.1 volume=3.5 | swirl | shore | Deep light read far off the middle, overtones coming and going
`,
    },
    {
      id: 'late-basses',
      name: 'Late basses',
      category: 'bass',
      rows: `
Cellar door ajar | Late bass | lag=.9 splash=.6 stone=.7 calm=.5 circle=.35 depth=.35 thickness=.5 shake=.9 threshold=.05 | cellar | ground | A dull knock, then a round bass, then the octave under it
Porter at the wharf | Late bass | lag=.3 below=.75 circle=.2 depth=.2 splash=.2 stone=1 calm=.3 width=0 foam=0 shake=1 threshold=.4 layers=0 volume=-3.5 | mono | stride | Nearly a pure tone and most of a lower octave, quick and plain
Coal barge | Late bass | lag=3.6 depth=.8 circle=.7 below=.7 thickness=.3 calm=1.2 unrest=.5 drift=.4 shake=.95 threshold=0 layers=.75 volume=-5 | iron | deep | Steep stripes that take two seconds to stand up, rough at the core
Underpass at midnight | Late bass | pattern=Hexagons reading=Caustic lag=.6 below=.6 depth=.3 circle=.3 calm=.7 splash=.3 stone=.6 shake=.45 threshold=0 volume=2 | downhall | stride | Hexagons of light with the octave under, dim at the edges
Freight through fog | Late bass | below=.9 lag=1 foam=.6 circle=.6 depth=.4 stray=.5 drift=.2 calm=1.5 width=.6 shake=.85 threshold=0 layers=.1 volume=3.5 | bank | ground | A full bass with breath over it and half its pitch beneath
Slack low string | Stripe flute | reading=Height circle=.04 depth=.03 foam=0 splash=.45 stone=.5 lag=.15 calm=.35 thickness=.6 width=0 shake=1 threshold=.3 volume=1 | even | mill | A round plain bass, a soft drop at the front and little else
Rubber hour | Pool pad | reading=Height circle=.3 depth=.4 thickness=.8 lag=.2 splash=.5 stone=.85 calm=.4 stray=.1 width=.1 layers=0 shake=1 threshold=.1 unrest=.8 volume=-1.5 | console | stride | Thick hexagons by height, rounded off, with a boulder behind the beat
Deep end at closing | Pool pad | reading=Height circle=.15 depth=.1 thickness=.95 lag=.7 splash=.15 stone=1 calm=1.5 width=0 foam=0 unrest=.1 shake=.75 threshold=.4 stray=.2 layers=.1 volume=-1 | chamber | abyss | Oil at rest, the lowest overtones only
Felt soled | Ripple keys | reading=Height circle=.25 depth=.3 thickness=.7 splash=.35 stone=.7 calm=.3 layers=.1 shake=.6 volume=0 | blanket | mill | A bass that speaks at once and is gone at once, dull and round
Anchor in soft mud | Pool pad | reading=Height circle=.55 depth=.65 thickness=.7 lag=.5 splash=.7 stone=1 below=.5 calm=.8 width=.2 shake=.45 threshold=.05 stray=.5 unrest=.05 volume=0.5 | darkroom | ground | A heavy thud, then tall thick hexagons with a little of the octave under
Tugboat horn | Canal reeds | depth=.6 circle=.8 below=.12 lag=.7 calm=.9 splash=.1 stone=.9 width=.2 shake=.9 threshold=.1 pattern=Hexagons unrest=.05 stray=.1 thickness=.2 volume=-0.5 | iron | ground | Leaning hexagons that swell into a low horn, a little octave under
Bassoon in the boathouse | Canal reeds | depth=.7 circle=.5 foam=.5 below=.25 thickness=.5 lag=.4 unrest=.4 drift=.8 calm=.6 stone=.85 pattern=Hexagons volume=0 | parlour | stride | A buzzing hollow lean with breath in it, the octave half awake | wind
Zip of a tent | Canal reeds | pattern=Hexagons depth=.9 circle=.6 below=.5 lag=.15 splash=.55 stone=.4 calm=.25 thickness=.4 shake=.85 threshold=.3 volume=5 | tiles | mill | Slopes folded right over, buzzing short notes with a wet front
Bow on a hawser | Canal reeds | pattern=Free depth=.3 circle=.7 unrest=.6 drift=.4 below=.8 lag=1.2 splash=.05 calm=1.2 width=.4 shake=.55 threshold=0 volume=0 | wood | deep | Six leaning waves drawn slowly, an octave under them | string
Wasp in a drainpipe | Canal reeds | pattern=Squares depth=.5 circle=.45 thickness=.6 below=.3 lag=.2 drift=2.5 calm=.4 splash=.4 stone=.6 shake=1 threshold=.4 volume=3 | pipe | stride | Square slopes that flutter, with some lower octave for weight
Cellar skylight | Pool pad | reading=Caustic circle=.6 depth=.6 lag=.3 splash=.4 stone=.6 thickness=.1 calm=.6 layers=.6 below=.2 width=.5 shake=.7 threshold=.3 unrest=.8 volume=2.5 | airy | stride | Bright hexagons over a low root, all their finer ripples on
Headlamps in a ford | Light on the floor | below=.5 stone=.8 splash=.5 circle=.4 depth=.5 drift=1.4 thickness=.3 calm=.8 width=.4 volume=1 | shaded | ground | Deep light that flickers over a bass and the octave under it
Hoist and chain | Alternate squares | stone=.7 below=.8 circle=.5 depth=.6 lag=.4 splash=.7 calm=.5 thickness=.2 drift=.8 shake=.7 threshold=.05 layers=.85 width=.75 volume=-3.5 | hotvalve | mill | A hard knock, then bright squares that change hands over a low octave
Sodium street | Eightfold shimmer | below=.9 thickness=.5 circle=.2 depth=.2 lag=.6 stone=.8 splash=.3 drift=.4 calm=.8 width=.3 shake=1 threshold=.1 unrest=.15 volume=3 | darkplate | deep | A dark root, half of it below, and a glint three octaves over
Flint under tyres | Boulder | pool=Round shake=.6 threshold=.2 splash=.6 lag=.25 below=.5 calm=.6 depth=.75 thickness=.2 stone=.7 stray=.75 volume=6 | triode | stride | A boulder and bright free waves over the lower octave, rough and quick
Pit prop | Pin pluck | stone=.8 splash=1 thickness=.5 below=0 calm=.4 reading=Height circle=.4 stray=.5 volume=0.5 | bare | mill | Only a splash: a big stone, its low drop and no figure behind it
Dropped sandbag | Pin pluck | stone=.8 splash=.9 thickness=.75 calm=.25 foam=.2 width=.2 reading=Height layers=.6 volume=1 | firm | stride | A boulder into thick water, short and low, with a puff of spray
Plucked cable stay | Pin pluck | stone=.6 splash=.8 thickness=.1 calm=1.2 shake=.3 threshold=.2 lag=.3 pattern=Stripes circle=.5 depth=.4 reading=Height stray=.9 layers=.7 volume=0.5 | slap | ground | A stone in thin water, then a faint thin ring | plucked
Boots on a pontoon | Boulder | pool=Round shake=.15 threshold=.5 splash=.85 stone=.75 below=0 thickness=.6 calm=.35 width=.3 stray=.05 volume=2 | springs 1.mix=0.18 | mill | Heavy stones, hardly any figure, each soon swallowed
Full well bucket | Dripping cave | stone=.9 splash=1 calm=1.5 shake=.4 threshold=.25 circle=.3 thickness=.3 below=.5 width=.4 stray=.9 layers=0 volume=-1 | well | ground | A great stone, its slow rolling drop, and a low tone left rocking
Tar kettle | Oil drone | lag=.5 below=.8 calm=.6 splash=.5 stone=.9 circle=.5 depth=.6 width=.2 stray=.3 shake=.55 threshold=.3 layers=.5 volume=-2.5 | valve | ground | Oil with half its pitch beneath, quick for oil, steep in its crests
Treacle off a spoon | Oil drone | lag=1.4 below=.3 calm=1 depth=.3 circle=.9 thickness=.8 drift=.4 stray=.8 width=.4 shake=.85 threshold=.1 layers=0 | reel | deep | Thick and wide, its few overtones turning over each other
Engine grease | Oil drone | reading=Caustic lag=.4 below=.6 depth=.7 circle=.6 calm=.4 thickness=.85 splash=.5 stone=.7 shake=.5 threshold=.25 layers=0 volume=3.5 | combo | stride | Deep light through oil, dull and dense, an octave under
Black rope | Oil drone | pattern=Stripes lag=.8 below=1 depth=.4 circle=.4 calm=1.5 drift=.15 unrest=.2 width=0 shake=1 threshold=0 volume=0 | thick | fifth | Smooth oil, its lower octave lying far down under it
Fan in the engine room | Oil drone | pattern=Free lag=.7 below=.5 depth=.5 circle=.6 foam=.5 unrest=.9 drift=1.8 calm=.8 thickness=.6 shake=.8 threshold=.1 layers=.6 width=.05 volume=1 | lowpulse | fifth | Free waves in thick water, fluttering and breathing low down
Two pumps | Alternate squares | reading=Height lag=.3 below=.7 stone=.8 splash=.4 circle=.4 depth=.5 drift=.06 calm=.5 thickness=.45 width=.2 shake=.9 threshold=.25 layers=0 unrest=.45 volume=-1.5 | iron | ground | Squares that rise and sink in turn about once a second, an octave under
Kneading trough | Alternate squares | reading=Height pool=Sea lag=.8 below=.5 circle=.6 depth=.7 drift=.6 calm=1.2 foam=.1 thickness=.5 shake=.95 threshold=.35 layers=.1 unrest=.05 volume=-1 | cellar 1.low=2 | deep | Broad squares on a sea, swelling and giving way
Slow escalator | Alternate squares | lag=.6 drift=.02 below=.6 circle=.25 depth=.15 thickness=.6 splash=.15 stone=1 calm=1 shake=.7 threshold=.3 layers=.6 volume=2.5 | chorus | fifth | Dim squares that change over every two seconds, the octave under them
Printing house | Alternate squares | drift=5 circle=.5 depth=.4 below=.6 lag=.2 stone=.5 splash=.6 calm=.3 thickness=.35 width=.4 volume=4.5 | dotted | mill | Squares that swap several times a second, with a wet click
Cattle grid | Alternate squares | reading=Slope drift=3.5 circle=.7 depth=.35 below=.8 thickness=.5 lag=.3 stone=.8 splash=.5 calm=.4 unrest=.65 width=.75 volume=6 | wah | stride | Leaning squares that shudder over their own lower octave
Quarrel in the boiler | Quarrelling swells | below=.8 lag=.5 circle=.4 thickness=.4 drift=.5 foam=.1 splash=.35 stone=.9 calm=.8 width=.3 depth=.4 layers=.75 volume=-4.5 | hotvalve | ground | Six waves in turn over half the pitch, never the same twice
Bear at the back door | Quarrelling swells | reading=Slope below=.7 lag=.3 circle=.8 depth=.5 foam=.4 thickness=.5 drift=1.2 splash=.5 stone=.8 calm=.4 layers=.1 volume=3 | combo | stride | Growling slopes with breath, six waves at odds, the octave under
Undertow on gravel | Quarrelling swells | reading=Height pool=Sea below=.8 lag=1.5 foam=.4 calm=2 thickness=.5 depth=.25 drift=.3 width=.6 layers=0 circle=.5 volume=2.5 | breathing | deep | Free waves on a sea, low, surging, an octave and some foam
Bilge air | Quarrelling swells | reading=Height lag=1 circle=.2 depth=.2 foam=1 below=.6 unrest=.5 calm=1.5 thickness=.6 drift=.2 volume=5.5 | hiss | deep | A low octave moving under heavy breath
Table legs overhead | Quarrelling swells | pool=Long below=.9 lag=.4 thickness=.7 circle=.5 depth=.3 splash=.7 stone=1 foam=0 calm=.5 volume=5 | cupboard | mill | Knocks in a channel, a shifting hollow bass and its octave
Drowsy bullfrog | Throat of water | below=.8 stone=.9 splash=.4 circle=.4 depth=.3 foam=.1 lag=.3 calm=.4 thickness=.5 shake=1 threshold=.4 layers=.15 unrest=.15 volume=4 | clay | mill | A wet vowel low down, half the pitch under it, short
Mouth of the culvert | Throat of water | below=.6 reading=Height circle=.7 depth=.6 lag=.8 thickness=.5 calm=1.5 splash=.3 stone=1 shake=.9 threshold=.5 volume=6 | stairs | ground | A hollow channel tone that tips, with a boulder at the front
Old man on the ferry | Throat of water | pattern=Hexagons below=.3 circle=.35 depth=.25 foam=.4 lag=.5 thickness=.65 calm=.6 drift=.8 layers=.45 volume=4 | vowel | chant | A low muttered vowel, breathy, an octave half awake beneath | voice
One pipe speaking | Throat of water | reading=Height circle=.3 depth=.4 foam=.25 lag=.25 unrest=0 stray=.1 drift=.1 thickness=.6 calm=.5 below=.3 splash=.1 shake=.7 threshold=.3 layers=.45 volume=4 | tube | ground | A channel tone held still, a little chiff of water | organ
Cough in the sluice | Boulder | below=.4 splash=1 shake=.5 threshold=.2 lag=.3 thickness=.5 calm=.6 foam=.6 depth=.4 circle=.3 stray=.05 stone=.85 volume=6 | transistor | stride | A heavy splash in a narrow pool, then foam and a little low octave
Swell under the pier | Grey sea | below=.7 lag=1.2 foam=.3 calm=2 circle=.3 stone=1 splash=.4 drift=.3 width=.4 thickness=.4 layers=.1 volume=2 | hall 1.mix=0.2 | deep | Dark free waves that surge, an octave under the sea
Moored in a ria | Grey sea | pattern=Stripes below=.9 lag=.8 foam=.15 calm=1.2 splash=.3 circle=.5 depth=.5 thickness=.5 width=.2 stray=.3 volume=0 | darkhall 1.mix=0.22 | ground | A round wave and its octave, surging every three seconds
Road of whales | Grey sea | pattern=Hexagons below=1 lag=2.2 foam=.4 calm=4 thickness=.6 depth=.3 circle=.6 stone=1 shake=.95 threshold=.05 volume=1.5 | open | deep | Slow sea hexagons, an octave far under them, wide and very low | drone
Sandbank, spring tide | Grey sea | reading=Caustic pattern=Squares below=.6 lag=.6 foam=.1 splash=.5 stone=.8 calm=1 depth=.5 drift=.8 circle=.4 width=.5 layers=.1 volume=2 | glow | stride | Squares of dull light on the sea, with weight below
Hull against the piles | Grey sea | splash=.9 stone=.85 lag=.5 foam=.5 below=.2 calm=.8 depth=.7 circle=.5 width=.5 unrest=.4 volume=3.5 | trail | mill | A thud, then a surge of tall foaming waves
`,
    },
    {
      id: 'ripple-keys',
      name: 'Ripple keys',
      category: 'keys',
      rows: `
Quick wet fingers | Ripple keys | circle=.15 depth=.2 layers=.9 splash=.5 stone=.15 calm=.9 thickness=.1 stray=.05 volume=-2 | lit | tenths | Small hexagons with all their ripples, answering at once
Kitchen upright | Ripple keys | thickness=.55 circle=.5 depth=.6 layers=.3 splash=.4 stone=.45 calm=.35 width=.3 drift=.2 stray=.05 volume=-0.5 | wood | hands | Duller hexagons, steady, with a soft knock to each key
Slate and chalk | Ripple keys | shake=.3 splash=1 stone=.2 calm=.25 circle=.6 depth=.5 foam=.4 thickness=.3 stray=.15 unrest=.15 volume=1 | bare | invention | Mostly splash and spray, a short bright figure under it
Basement flat doorbell | Ripple keys | calm=2.5 splash=.3 stone=.1 shake=.7 circle=.4 depth=.3 layers=.5 drift=1.5 unrest=.2 stray=.2 below=.15 volume=1 | darkfield | tenths | Ripples that ring on for two seconds, flickering a little
Sunday piano lid | Ripple keys | shake=1 thickness=.75 circle=.25 depth=.25 splash=.6 stone=.55 calm=.8 stray=.1 layers=.1 threshold=.85 volume=-3.5 | felted | tenths | Thick and round, a low drop to every key and the note only under firm ones
Rhumba in the kitchen | Ripple keys | pattern=Stripes reading=Slope circle=.8 depth=.4 splash=.5 stone=.35 calm=.3 thickness=.2 layers=0 unrest=.1 stray=.1 drift=.2 volume=-0.5 | trem | hands | Hollow short keys, a wooden drop on each
Clarinet buttons | Ripple keys | pattern=Hexagons reading=Slope circle=.4 depth=.45 splash=.2 stone=.2 calm=.5 unrest=.1 foam=.2 stray=.05 layers=0 drift=.1 volume=1 | alcove | invention | Small leaning hexagons, hollow and firm, with a breath of air | organ
Deckchair canvas | Ripple keys | pattern=Stripes reading=Caustic circle=.9 depth=1 layers=.6 splash=.35 stone=.1 calm=1 thickness=.15 stray=.3 unrest=.2 shake=.7 volume=1 | chorus | hands | One bright wave in hard light, finer stripes above it
Hotel lift chime | Ripple keys | pattern=Stripes reading=Height circle=.05 depth=.04 splash=.7 stone=.25 calm=1.5 thickness=.2 unrest=0 volume=-1 | vibrato | tenths | All but a pure tone, with a clear drop on top of it
Damp vestry bellows | Canal reeds | depth=.2 circle=.6 foam=.5 lag=.15 calm=.3 splash=.05 thickness=.5 drift=.3 width=.4 layers=.6 shake=.8 volume=0 | parlour | hands | Leaning stripes with bellows air, reedy and even | organ
Chequered oilcloth | Alternate squares | lag=.15 splash=.6 stone=.2 calm=.5 circle=.3 depth=.2 drift=1 threshold=0 volume=4 | tiles | invention | Plain squares, quick to speak, trading places as they ring
Telegraph office | Alternate squares | lag=.15 drift=4.5 splash=.45 stone=.1 calm=.25 circle=.5 depth=.5 layers=.5 thickness=.25 shake=.55 threshold=0 unrest=.05 volume=3.5 | tamed | invention | A sharp wet tick, and squares that swap too fast to follow
Marquetry box | Alternate squares | reading=Height lag=.15 splash=.4 stone=.4 calm=.6 circle=.75 depth=.7 thickness=.35 drift=.5 width=.5 shake=.75 threshold=0 volume=-1 | even | tenths | Squares by height, tall crests, warm and a little rough
Chess in the rain | Alternate squares | reading=Slope lag=.15 splash=.5 stone=.15 calm=.7 circle=.3 depth=.15 thickness=.4 layers=.2 below=0 unrest=.15 width=.75 volume=0.5 | rain | hands | Thin leaning squares, bright at the front
Tram bell at five | Alternate squares | splash=.4 stone=.06 calm=2.5 circle=.6 depth=.3 layers=.45 thickness=.18 lag=.2 drift=.8 shake=.8 threshold=0 unrest=.45 width=.75 volume=-0.5 | clean | tenths | Squares in thin water with a pin at each key, ringing on | bell
Worn barrel piano | Ripple keys | pattern=Free reading=Height circle=.5 depth=.5 splash=.6 stone=.3 unrest=.8 calm=.4 drift=2 thickness=.3 below=.3 volume=2 | wornout | hands | Free waves, each key a little other than the last
Harpsichord in a leak | Ripple keys | pattern=Stripes reading=Slope circle=1 depth=.75 splash=.35 stone=.1 calm=.4 thickness=.05 layers=.9 width=.5 stray=.8 volume=1.5 | chamber | invention | Leaning stripes with every fine ripple, wiry and quick, a pin on top
Rag rug | Ripple keys | pattern=Free circle=.3 depth=.3 splash=.3 stone=.6 calm=.8 foam=.3 unrest=.5 thickness=.5 stray=.05 below=.35 volume=-3.5 | pillow | tenths | Soft free waves under a little foam, no two alike
Toolbox in the sun | Ripple keys | pattern=Free circle=.8 depth=.7 splash=.9 stone=.25 calm=.3 thickness=.2 foam=.05 drift=1 stray=.5 volume=2 | slap | hands | A hard splash and a bright jumble of waves, quickly over
Accordion on the jetty | Ripple keys | pattern=Hexagons reading=Slope circle=.4 depth=.3 foam=.3 splash=.1 calm=.35 unrest=.9 drift=1.5 shake=.8 width=.6 stray=.2 layers=0 volume=2.5 | ensemble | hands | Leaning hexagons pulled in and out, with air | organ
Vibes left outdoors | Ripple keys | pattern=Eightfold circle=.3 depth=.15 layers=.2 splash=.4 stone=.3 calm=1.8 thickness=.35 drift=.9 shake=.6 stray=.9 unrest=.05 below=.25 volume=0 | trem 1.rate=3.2 | tenths | A round note with a far glint of eight waves over it
Crystal radio keys | Ripple keys | pattern=Eightfold circle=.1 depth=.5 layers=.6 splash=.2 stone=.05 calm=.6 thickness=.2 drift=2 stray=.2 unrest=.65 volume=6 | transistor | invention | Very high overtones, small and sharp, over a thin root
Rime on the keyboard | Ripple keys | pattern=Eightfold reading=Height circle=.6 depth=.6 splash=.5 stone=.1 calm=.9 thickness=.05 layers=.4 stray=.5 unrest=.65 volume=-2 | frost | tenths | Eight waves by height, cold and bright, a pin at each key
Spoons in a drawer | Ripple keys | pattern=Eightfold circle=.5 depth=.3 splash=.8 stone=.15 calm=.3 thickness=.3 drift=3 unrest=.6 stray=.2 volume=2.5 | booth | hands | Tinkling eightfold ripples behind a wet click
Night shift celesta | Ripple keys | pattern=Eightfold reading=Height circle=.2 depth=.3 splash=.3 stone=.2 calm=1.2 thickness=.45 foam=0 stray=.1 shake=.7 unrest=0 volume=0 | plate | tenths | Plain and small, a trace of glass far above
Flooded stage piano | Pool pad | lag=.15 threshold=0 circle=.35 depth=.45 splash=.5 stone=.3 calm=.8 thickness=.4 drift=.4 below=.15 stray=.05 layers=.6 unrest=.8 volume=3.5 | harmtrem | hands | A wet knock and a warm chord of hexagons at once
Bar room, chairs up | Pool pad | lag=.15 threshold=.8 reading=Slope circle=.85 depth=.5 splash=.35 stone=.5 calm=.5 thickness=.25 width=.3 stray=.15 layers=.3 unrest=.65 pattern=Stripes below=.35 shake=1 | valve | hands | Steep leaning stripes over a little octave, growling when played hard
Hat on the hallstand | Pool pad | lag=.2 threshold=.05 circle=.2 depth=.3 splash=.65 stone=.5 calm=1.5 thickness=.6 unrest=.1 stray=.2 layers=.05 width=1 below=.7 volume=-2.5 | panned | tenths | A low drop and a round note over its octave, level
Half lit lounge | Pool pad | lag=.25 threshold=0 shake=.45 circle=.5 depth=.2 splash=.25 stone=.7 calm=1 foam=.1 stray=.6 drift=.7 layers=0 unrest=.45 below=.25 volume=-4 | chorale | hands | Soft light that moves about, no edge to the front
Failing motel sign | Pool pad | lag=.15 threshold=0 circle=.8 depth=.85 splash=.2 stone=.2 calm=.5 drift=4 stray=.8 thickness=.2 layers=.1 below=.15 volume=0 | cassette | hands | Hard light that flickers four times a second
Cloth over the strings | Ripple keys | reading=Height shake=.5 circle=.1 depth=.06 thickness=.95 splash=.55 stone=.4 calm=.2 layers=0 width=.2 unrest=.8 below=.35 volume=2 | mike | invention | Oil under the fingers and half its pitch with it, short and blunt
Left hand in slippers | Ripple keys | reading=Height circle=.6 depth=.5 thickness=.5 below=.6 splash=.3 stone=.7 calm=.6 stray=.5 volume=2 | firm | ground | Tall ripples with the octave below, for the left hand | bass
Clay tablets | Ripple keys | reading=Height circle=.3 depth=.8 thickness=.6 splash=.75 stone=.5 calm=.3 foam=.15 pattern=Squares stray=.6 unrest=.65 volume=-0.5 | clay | hands | Squares in thick water, knocked rather than played
Church hall, half tuned | Ripple keys | reading=Height pattern=Hexagons circle=.9 depth=.3 thickness=.4 splash=.4 stone=.35 calm=1.2 unrest=.7 drift=.6 stray=.7 below=.35 volume=-0.5 | latehall 1.mix=0.2 | tenths | Wide tall hexagons whose overtones wander off and return
Warm hands, cold tea | Pool pad | reading=Height lag=.2 threshold=0 circle=.2 depth=.4 thickness=.5 foam=.25 splash=.2 stone=.3 calm=.9 stray=.75 unrest=.65 below=.3 volume=-2 | reel | tenths | A soft round key with breath around it
Sea on a toy piano | Ripple keys | pool=Sea circle=.4 depth=.4 splash=.6 stone=.1 calm=1.2 layers=.5 foam=.1 thickness=.2 stray=.15 volume=0.5 | tiny | invention | Pins on the open sea, a surge running under the tune
Ferry lounge keys | Ripple keys | pool=Sea reading=Height circle=.5 depth=.5 splash=.4 stone=.5 calm=.8 drift=.4 unrest=.4 width=.9 stray=.2 below=.35 volume=2 | eight | tenths | Dark keys that come and go with the swell
Spray on the windscreen | Ripple keys | pool=Sea splash=.9 stone=.3 foam=.7 calm=.5 depth=.6 circle=.7 thickness=.15 width=1 stray=.15 unrest=.8 volume=0.5 | wide | hands | Splash and foam at each touch, a wide wet chord
Low notes over mud | Ripple keys | pool=Sea pattern=Stripes below=.4 circle=.4 depth=.5 splash=.5 stone=.6 calm=1.5 thickness=.4 unrest=.65 volume=2 | darkplate | chant | A round tone on the tide with some octave beneath
Shingle hymn | Ripple keys | pool=Sea pattern=Squares circle=.3 depth=.3 splash=.35 stone=.2 calm=2 layers=.3 foam=.8 drift=.5 stray=.05 unrest=.65 below=.2 | tails | hands | Squares on the sea under much hiss, rising and falling
Pipes in the wall | Ripple keys | pool=Long circle=.4 depth=.4 thickness=.5 splash=.6 stone=.35 calm=.5 layers=.3 below=.15 volume=0 | pipe | hands | A narrow hollow knock with a vowel after it
Parrot at the piano | Ripple keys | pool=Long reading=Slope pattern=Hexagons circle=.5 depth=.4 thickness=.6 splash=.3 stone=.2 calm=.4 drift=1.5 below=.1 volume=4 | vowel 1.amount=0.8 | invention | Leaning hexagons down a channel, nasal and wet
Duck pond ragtime | Ripple keys | pool=Long pattern=Stripes reading=Slope circle=.6 depth=.5 thickness=.5 splash=.5 stone=.4 calm=.3 unrest=.4 volume=0 | record | hands | Nasal stripes, short, with a wet flap at the front
Flue and damper | Ripple keys | pool=Long reading=Height pattern=Free circle=.5 depth=.4 foam=.4 thickness=.6 splash=.25 stone=.7 calm=.7 stray=.6 unrest=.8 below=.4 volume=0 | hiss | tenths | Free waves in a flue, breath and a dull knock
Talking drum lesson | Throat of water | lag=.15 threshold=0 splash=.7 stone=.5 calm=.35 circle=.75 depth=.3 foam=.25 thickness=.5 layers=.1 volume=1 | tamed | invention | Each key says a short wet vowel | plucked
Ladder of puddles | Ripple keys | shake=.4 splash=.8 stone=.2 circle=.2 calm=1.5 depth=.4 layers=.5 drift=.6 thickness=.15 stray=.05 unrest=.05 volume=0 | pebble | invention | Clear drops and a thin ripple after each
Towpath windows lit | Ripple keys | circle=.35 depth=.55 splash=.3 stone=.15 calm=1 layers=.4 below=.3 thickness=.35 unrest=.05 volume=0 | warmecho | hands | Warm bright keys with a little octave under
Sewing by the window | Light on the floor | threshold=0 lag=.15 splash=.55 stone=.1 calm=.6 depth=.5 circle=.3 drift=2 thickness=.2 volume=1.5 | stars | invention | Stitches of light, a pin at each and a quick flicker
Loud second hand | Mercury bells | stone=.15 calm=.5 thickness=.3 circle=.4 layers=.4 splash=.75 volume=6 | loop | tenths | Only the splash, a small drop and a short thin ring
Starlings on the roof | Eightfold shimmer | lag=.2 threshold=0 splash=.6 stone=.1 calm=1.5 drift=1.2 circle=.15 depth=.25 thickness=.3 foam=.15 unrest=.05 volume=-0.5 | shadow | tenths | A pin, a round note, and eight waves twinkling high over it
`,
    },
    {
      id: 'stripe-flutes',
      name: 'Stripe flutes',
      category: 'wind',
      rows: `
Shepherd past the hedge | Stripe flute | circle=.06 depth=.05 foam=.4 drift=.6 calm=.6 lag=.2 thickness=.3 shake=.75 threshold=.4 volume=3 | valley | arch | One wave on a small circle, plain, with a thread of breath
Fen path in grey light | Stripe flute | foam=1 circle=.2 splash=.05 lag=1.4 calm=1.2 drift=.3 shake=1 threshold=.25 volume=5 | mist | two | Breath first and a plain note rising slowly inside it
Oiled wooden flute | Stripe flute | foam=.25 thickness=.7 circle=.35 depth=.35 drift=.8 calm=.4 splash=.15 stone=.4 shake=.85 threshold=0 below=.2 volume=2 | wood | arch | Round and dark, a soft start, the top swallowed
Balcony scales | Stripe flute | foam=.5 drift=3 unrest=.5 stray=.4 circle=.3 lag=.15 calm=.35 shake=.55 threshold=.3 volume=1.5 | alcove | invention | A quick flutter on a round note, breath at every tongue
Recorder by the stove | Stripe flute | foam=.15 thickness=.05 circle=.5 depth=.15 layers=.9 splash=.2 stone=.05 shake=.7 threshold=.4 reading=Slope volume=1.5 | lit | two | Thin water, one leaning wave, fine ripples over it and hardly any air
Bamboo at the well | Stripe flute | foam=.7 depth=.4 circle=.9 splash=.4 stone=.2 lag=.2 calm=.8 unrest=.4 drift=.5 shake=.8 threshold=0 reading=Slope volume=5 | well | call | A spit of water, then a hollow note that bends with the breath
Temple steps in drizzle | Stripe flute | foam=.6 depth=1 circle=.95 lag=2 drift=.2 unrest=.6 calm=2 stray=.2 shake=.6 threshold=.1 thickness=.1 below=.3 volume=3.5 | rain | arch | Slow to speak, steep in its crests, a note that swells and sinks
Split reed | Stripe flute | reading=Slope foam=.5 depth=.4 circle=.75 thickness=.35 lag=.2 calm=.4 drift=1 shake=.85 unrest=.1 volume=5 | mike | call | One wave leaning over, an edge and a breath and no low
Ocarina in a coat | Stripe flute | pattern=Hexagons foam=.65 circle=.2 depth=.2 thickness=.8 calm=.5 splash=.2 stone=.5 reading=Caustic volume=1 | giant | two | Hexagons so small they are nearly one tone, with warm breath
Goat bell and pipe | Stripe flute | foam=.4 splash=.7 stone=.08 thickness=.1 circle=.25 calm=1.5 lag=.2 shake=.5 threshold=0 volume=3 | darkecho | call | A pin of a splash on top of every blown note
Lift shaft panpipes | Stripe flute | pool=Long foam=.6 thickness=.5 circle=.3 depth=.3 lag=.15 calm=.5 splash=.35 stone=.25 shake=.95 threshold=.05 below=.3 volume=5.5 | stairs | invention | Chuffs down a channel, each with a small knock
Blown across a hose | Stripe flute | pool=Long reading=Slope foam=1 circle=.4 depth=.2 thickness=.6 drift=.5 calm=.6 shake=.95 threshold=0 volume=6 | hiss | chant | A channel thick with breath, with a nasal core
Nose flute in drought | Throat of water | pattern=Stripes foam=.7 circle=.3 depth=.15 thickness=.6 lag=.3 calm=.5 drift=.8 splash=.1 shake=.5 threshold=.15 layers=0 volume=3 | bedside | arch | A soft vowel with air round it, narrow and sliding
Bottle bank at dusk | Throat of water | pattern=Hexagons reading=Height circle=.35 depth=.2 foam=.8 lag=.2 splash=.5 stone=.15 thickness=.4 calm=.4 shake=.4 threshold=0 volume=0.5 | parlour | hands | Blown channels in short chords, each with a wet start
Tin whistle on a pier | Canal reeds | pool=Round circle=.75 depth=.35 foam=.35 drift=2 lag=.15 calm=.35 thickness=.25 shake=.45 threshold=.1 unrest=.1 volume=3 | surf | call | A leaning wave, thin and quick, with the wind on it
Bass flute by the window | Stripe flute | reading=Caustic below=1 foam=.6 circle=.8 depth=.8 lag=.4 thickness=.4 calm=.8 splash=.15 stone=.7 shake=.95 threshold=.1 volume=2.5 | warm | chant | A low breath over its own octave, dark and round
Contrabass flute in snow | Stripe flute | below=1 foam=1 circle=.3 depth=.5 lag=.8 thickness=.5 calm=1.5 drift=.4 shake=.95 threshold=0 volume=3.5 | frost | ground | A low round tone, its octave waking under it, much of it breath | bass
Foghorn up the channel | Stripe flute | below=.6 foam=.3 circle=.6 depth=.6 lag=1 calm=2 splash=0 thickness=.4 unrest=.3 shake=.8 threshold=.3 volume=5 | farshore | toll | A round low call that takes a second to stand
Draughts under a door | Stripe flute | foam=1 circle=.5 depth=.6 unrest=.8 drift=1.2 stray=.6 lag=.6 calm=1 thickness=.5 shake=1 threshold=.05 volume=6 | wander | chant | As much breath as tone, wavering in and out
Low whistle in a barn | Stripe flute | circle=.75 depth=.2 foam=.2 thickness=.15 drift=.7 calm=.7 below=.6 stray=.3 shake=1 threshold=.5 reading=Height unrest=.1 pattern=Hexagons volume=2.5 | hall | chant | Low and round over its octave, a little edge to it and some air
Two flutes sharing air | Stripe flute | foam=.45 circle=.35 depth=.3 stray=.7 width=1 drift=.5 calm=.9 shake=.85 threshold=.05 pattern=Hexagons below=.15 volume=0 | thick | two | A round note heard differently in each ear
Consort in the orchard | Stripe flute | foam=.3 circle=.75 depth=.35 thickness=.4 calm=.6 unrest=.4 drift=.6 width=.5 shake=.95 threshold=.3 reading=Slope below=.2 volume=1.5 | ensemble | hands | Chords of hollow pipes that will not quite settle
Organ of reeds and rain | Canal reeds | circle=.5 depth=.3 foam=.5 lag=.3 calm=.5 thickness=.35 width=.7 stone=.85 below=.3 volume=1.5 | drips | hands | Leaning stripes in chords, breath and a soft buzz | organ
Four stopped pipes | Stripe flute | foam=.2 circle=.35 depth=.3 thickness=.5 unrest=0 stray=0 drift=.02 lag=.15 calm=.3 splash=.15 stone=.15 shake=.5 threshold=.25 pattern=Hexagons reading=Slope below=.1 volume=-1 | flutestop | ties | Small leaning hexagons, hollow and perfectly steady, with a tick of chiff | organ
Breath of a bellows boy | Stripe flute | foam=1 circle=.8 depth=.35 thickness=.6 lag=1.6 calm=.9 unrest=.3 drift=.15 reading=Slope below=.2 shake=.85 threshold=.1 volume=2.5 | sigh | shore | Wide hollow chords, full of wind, filling slowly | organ
Kite string hum | Stripe flute | foam=.3 pool=Sea circle=.3 depth=.3 lag=.8 drift=.3 calm=3 stray=.5 below=.3 volume=3.5 | eight | star | One wave on the open sea, a hum that surges with a little air
Dune grass at noon | Grey sea | pattern=Stripes foam=.9 circle=.3 depth=.3 lag=.8 stone=.2 splash=.05 calm=2 thickness=.2 drift=.5 layers=.5 below=.3 volume=6 | airtail | arch | A sea breath with one plain tone inside it
Conch at the headland | Stripe flute | pool=Sea reading=Height foam=.5 circle=.7 depth=.7 lag=.6 below=.7 thickness=.35 calm=2 shake=.8 threshold=.15 volume=1.5 | latehall | toll | A wide low tone with surf in it, the octave half awake
Sail loft dozing | Stripe flute | pool=Sea foam=.75 circle=.15 depth=.1 lag=1.5 unrest=.6 calm=4 thickness=.3 width=.8 shake=.5 threshold=0 below=.4 volume=1 | haze | lone | Nearly a pure tone under slow breath that comes in waves
Seal off the slipway | Stripe flute | pool=Sea reading=Slope foam=.6 circle=.5 depth=.35 lag=.4 drift=.8 calm=1.2 unrest=.5 thickness=.4 shake=.95 threshold=0 volume=2 | shallows | call | A leaning call with foam, rising and falling by itself
Eightfold piccolo | Eightfold shimmer | reading=Caustic circle=.3 depth=.35 lag=.15 foam=.4 calm=.6 drift=.8 splash=.2 stone=.1 thickness=.4 layers=.1 shake=.5 threshold=.1 volume=5 | chamber | wharf | Very high eightfold ripples on a small plain tone, with breath
Whistled through teeth | Stripe flute | pattern=Eightfold circle=.3 depth=.3 foam=.7 thickness=.4 drift=1.5 calm=.5 shake=.7 threshold=.1 reading=Caustic volume=3 | bare | arch | A breathy note with a glint far above it
Wren in a gutter | Stripe flute | circle=.4 depth=.3 foam=.2 drift=5 unrest=.9 stray=.8 lag=.15 calm=.3 splash=.3 stone=.05 thickness=.15 shake=.4 threshold=0 volume=5.5 | grains | wharf | High, trembling five times a second, a wet peck at the start
Ice whistle | Stripe flute | pattern=Squares circle=.2 depth=.15 foam=.5 thickness=.2 drift=.6 calm=1.5 lag=.3 shake=.9 threshold=.05 volume=2 | shimmer | star | Two crossed waves, breath and a plain tone that tips between them
Blackbird on the aerial | Stripe flute | foam=.15 circle=.4 depth=.5 drift=1.8 stray=.3 splash=.5 stone=.12 lag=.15 calm=.25 shake=.9 threshold=.05 reading=Caustic pattern=Hexagons volume=1.5 | slap | call | Quick hollow calls that start with a drop and wobble
Evening raga on a reed | Canal reeds | pattern=Stripes circle=.9 depth=.4 foam=.25 lag=.4 drift=.4 calm=.6 stray=.5 unrest=.3 shake=.9 threshold=0 stone=.5 volume=5 | vibrato | arch | A hollow reed, its overtones sliding
Cor anglais after rain | Canal reeds | pattern=Hexagons circle=.6 depth=.4 foam=.1 thickness=.4 lag=.35 calm=.8 drift=.3 width=.3 shake=.95 threshold=.25 below=.1 volume=5 | tiles | arch | Leaning hexagons, nasal and warm, with very little air
Bagpipe two hills off | Canal reeds | pattern=Hexagons circle=.9 depth=.8 foam=.1 lag=.3 unrest=0 drift=.02 calm=.4 thickness=.25 shake=.55 threshold=.15 stone=.6 stray=.05 below=.2 volume=1 | farshore | two | Leaning hexagons in a hard buzz, held level
Pump room clarinet | Stripe flute | foam=.1 circle=.9 depth=.42 thickness=.3 lag=.2 calm=.5 drift=.3 splash=.05 shake=.95 threshold=0 reading=Slope unrest=.1 stray=.1 volume=-1 | console | arch | Hollow, dark at the bottom, odd overtones and hardly any breath
Oboe as the tide turns | Canal reeds | pool=Sea circle=.5 depth=.5 foam=.3 lag=.4 drift=.5 calm=1 stray=.4 shake=.75 threshold=.5 stone=.15 volume=-0.5 | brighthall | two | A reed that leans on the swell, each surge opening it
Slow reed | Canal reeds | depth=.2 circle=.35 lag=2 calm=3 foam=.2 drift=.1 unrest=.5 thickness=.45 shake=.95 threshold=.25 stone=.15 below=.2 volume=1.5 | darkhall | lone | A leaning wave that takes two seconds, soft at the edge
Ney in a dry well | Stripe flute | foam=.85 circle=.75 depth=.35 lag=.6 stray=.6 drift=.4 thickness=.25 calm=1.5 splash=.1 shake=1 threshold=.4 reading=Slope volume=6 | cave | arch | Breath first, a hollow tone inside it that wanders
Soapstone flute | Stripe flute | circle=.75 depth=.15 foam=.35 thickness=.6 splash=.5 stone=.6 lag=.3 calm=1 pattern=Hexagons volume=0.5 | lowvault | call | A low drop at each note, then a dull round tone
Held for the night bus | Stripe flute | shake=1 lag=3 foam=.3 circle=.5 depth=.3 calm=4 drift=.2 stray=.5 width=.5 below=.4 volume=4 | breathing | lone | A round note that grows for three seconds and stays
Smoke rings | Stripe flute | foam=.55 circle=.2 lag=.8 unrest=.8 drift=.8 calm=1.5 thickness=.5 depth=.2 shake=.9 threshold=.35 below=.25 volume=2 | stretched | two | Soft round puffs that swell unevenly
Flute and its shadow | Stripe flute | foam=.6 circle=.4 depth=.15 below=.35 calm=.6 lag=.2 drift=.9 shake=.55 threshold=.3 pattern=Hexagons reading=Slope volume=4 | shadow | call | A breathy hollow note, some octave under it
Across three courtyards | Stripe flute | foam=.35 circle=1 depth=.4 thickness=.35 calm=.8 splash=.2 stone=.2 shake=.95 threshold=.1 reading=Slope volume=2.5 | clean | call | Plain and hollow, a light drop at the start
Choirboy with a hosepipe | Throat of water | pattern=Squares circle=.15 depth=.1 foam=.4 thickness=.75 lag=.25 calm=.6 below=.1 shake=.8 threshold=0 unrest=.45 stone=.5 volume=6 | pipe | chant | Dull squares in a channel, half voice and half pipe | voice
Wind over nine jars | Stripe flute | pattern=Free foam=.8 circle=.25 depth=.2 unrest=.7 drift=.4 lag=.5 calm=1.2 thickness=.4 shake=.85 threshold=0 below=.35 volume=-1 | clay | gather | Free waves under much breath, each key blown differently | texture
Midsummer sash | Stripe flute | foam=.3 circle=.6 depth=.25 layers=.5 drift=.7 stray=.5 calm=1 width=.6 lag=.25 reading=Slope volume=-0.5 | sparks | two | Light and leaning, with fine ripples and a little wind
`,
    },
    {
      id: 'mercury-bells',
      name: 'Mercury bells',
      category: 'bell',
      rows: `
Pins in a saucer | Mercury bells | splash=.6 stone=.05 calm=2 circle=.5 layers=.5 thickness=.15 volume=6 | shaded | chimes | The smallest pins, a short high ring and a few beads
Dentist's window | Mercury bells | stone=.12 circle=.8 depth=.45 calm=3 thickness=.2 foam=.05 layers=.5 volume=4 | tiles | chimes | Wide hard squares in thin water, bright and wiry
Shaken thermometer | Mercury bells | splash=1 stone=.18 thickness=.3 unrest=.6 drift=2 stray=.6 calm=4 layers=.55 volume=6 | glaze | wharf | Beads that scatter for seconds over a trembling ring
Typist at the spa | Mercury bells | thickness=.4 calm=.6 stone=.08 circle=.4 depth=.3 layers=.3 volume=6 | even | invention | Short dry pins, quickly swallowed
Silver in a sink | Mercury bells | splash=.8 stone=.25 circle=.4 depth=.5 calm=5 width=1 drift=.8 thickness=.12 layers=.2 pattern=Hexagons shake=.45 threshold=.2 lag=.15 volume=3.5 | brightplate | chimes | Small stones on clear hexagons, wide apart, ringing long
Ballroom of one spoon | Mercury bells | shake=.5 threshold=.2 lag=.3 circle=.3 depth=.3 splash=.5 stone=.1 calm=4 drift=.5 below=.2 volume=4 | hall | chimes | A pin, and then the squares rise and hold behind it
Wet rim of a wine glass | Mercury bells | shake=.6 threshold=.2 lag=1.2 splash=.3 stone=.05 circle=.2 depth=.2 layers=.4 calm=6 thickness=.15 below=.25 volume=2.5 | bowls | star | A faint pin, then a glassy swell that stays as long as the key
Clock with no hands | Mercury bells | shake=.45 threshold=.2 lag=.2 drift=1 circle=.5 depth=.4 layers=.2 splash=.6 stone=.3 calm=2.5 below=.3 volume=4 | pebble | chimes | Squares that tip to and fro after a light stone
Snow globe | Mercury bells | pattern=Eightfold circle=.2 depth=.2 layers=.4 splash=.5 stone=.04 calm=4 thickness=.2 shake=.45 threshold=.15 lag=.5 below=.3 volume=6 | frost | wharf | Eight waves that shimmer up after a pin
Crate of empties | Alternate squares | thickness=.25 layers=.4 splash=.6 stone=.15 lag=.15 calm=3 drift=1.4 circle=.5 depth=.5 shake=.7 threshold=.25 volume=4 | trem | chimes | Bottles in a crate: a drop and a bright square that wobbles
Bell under moss | Mercury bells | pattern=Hexagons stone=.6 splash=.9 thickness=.5 circle=.4 depth=.4 calm=6 layers=.2 volume=2.5 | cave | toll | A heavy stone on hexagons, low, dull, rolling slowly
Harbour bell becalmed | Mercury bells | pattern=Hexagons stone=.45 shake=.4 threshold=.2 lag=.3 circle=.6 depth=.5 calm=5 below=.5 layers=.5 volume=3 | farshore | toll | A stone, a ring of hexagons and a low octave that comes after
Cast iron bath | Mercury bells | pattern=Hexagons reading=Height stone=.7 splash=1 thickness=.3 circle=.5 depth=.7 calm=3 below=.2 shake=.35 threshold=.2 lag=.2 volume=2 | bathtub | toll | A knock, low and round, and the bath rings
Gong beyond the rice | Boulder | pool=Round splash=.8 calm=9 thickness=.1 circle=.6 depth=.5 below=.3 drift=.3 stray=.6 layers=.1 volume=2 | darkhall | toll | A boulder, then free waves that beat against each other for long
Meridian bell | Mercury bells | pattern=Free stone=.5 splash=.7 shake=.5 threshold=.2 lag=.4 circle=.4 depth=.4 calm=6 unrest=.5 drift=.3 layers=.4 below=.4 volume=5 | fan | chimes | A stone, then six waves ringing in and out of step
Butter dish lid | Mercury bells | reading=Height circle=.6 depth=.5 splash=.7 stone=.15 calm=3 thickness=.1 volume=5.5 | plate | chimes | Round drops and a smooth ring, no hard light in it
Glockenspiel in a puddle | Mercury bells | reading=Height circle=.8 depth=.8 splash=.6 stone=.06 calm=1.5 layers=.6 shake=.3 threshold=.15 lag=.15 volume=3.5 | booth | invention | Pins and steep bright crests, short
Marimba of rainwater | Dripping cave | stone=.5 splash=.9 calm=.8 thickness=.45 circle=.3 depth=.4 width=.6 stray=.6 volume=2 | wood | tenths | A round low drop for every key and almost no ring | plucked
Muted lead crystal | Dripping cave | stone=.2 splash=.6 calm=3 shake=.5 threshold=.25 lag=.3 circle=.4 depth=.5 layers=.6 thickness=.2 below=.35 volume=3.5 | shaded | chimes | Small stones and a soft square ring by height
Bells in a drained pool | Dripping cave | stone=.35 splash=1 calm=8 unrest=.7 drift=.6 circle=.5 foam=.2 pool=Sea layers=.45 volume=4 | stairs | wharf | Drops that fall back for seconds, the ring surging as it goes
Bicycle through a flood | Mercury bells | reading=Slope circle=.5 depth=.3 splash=.8 stone=.12 calm=1.2 thickness=.3 volume=6 | alcove | chimes | A pin and a thin leaning ring, all edge
Cowbells over the river | Mercury bells | reading=Slope pattern=Hexagons circle=.6 depth=.5 stone=.35 splash=.7 calm=1.5 shake=.4 threshold=.2 lag=.15 thickness=.3 volume=1.5 | valley | chimes | A knock and a clank of leaning hexagons
Tin lid rain | Mercury bells | reading=Slope pattern=Free circle=.8 depth=.6 stone=.1 splash=.9 calm=.8 unrest=.8 thickness=.25 volume=6 | drips | drips | Pins on a leaning jumble, short and clattering
Spinning wheel hub | Mercury bells | reading=Slope pattern=Stripes circle=.7 depth=.4 stone=.3 splash=.6 shake=.5 threshold=.2 lag=.5 calm=4 drift=1.2 below=.4 volume=-1 | chorale | chimes | A stone and then one leaning wave that hums
Needle on the pond | Mercury bells | reading=Slope pattern=Eightfold circle=.15 depth=.15 stone=.02 splash=.7 calm=2.5 thickness=.45 layers=.2 volume=6 | airtail | wharf | Needles, with a thin glint so high it is nearly air
Oyster shell chimes | Mercury bells | pattern=Stripes circle=.6 depth=.4 splash=.7 stone=.08 calm=4 thickness=.05 volume=1.5 | onwater | chimes | Pins on one wave, a plain ring
Reed bells | Mercury bells | pattern=Stripes reading=Slope circle=.9 depth=.4 splash=.5 stone=.2 shake=.55 threshold=.2 lag=.2 calm=2 foam=.5 thickness=.2 layers=0 volume=2 | darkecho | chimes | A drop, then a hollow tone with some air on it
Sunken music box | Mercury bells | pattern=Stripes reading=Height circle=.3 depth=.3 splash=.8 stone=.1 calm=.9 thickness=.25 layers=.1 volume=4 | tiny | tenths | Small and round, each pin soon over
Chimes at low water | Mercury bells | pattern=Stripes pool=Sea circle=.5 depth=.5 splash=.6 stone=.3 shake=.5 threshold=.2 lag=.6 calm=7 foam=.1 below=.35 volume=3.5 | moons | wharf | A stone, and one wave that rides out on the sea
First lesson on rims | Mercury bells | pattern=Stripes shake=.7 threshold=.1 lag=.8 splash=.15 stone=.05 circle=.5 depth=.6 calm=3 drift=4 layers=.3 thickness=.2 unrest=.9 stray=.8 volume=1.5 | chamber | star | A rubbed rim: hardly a pin, then a plain tone that shakes
Pebble on a frozen lake | Pin pluck | stone=.1 splash=1 thickness=.2 calm=4 circle=.9 layers=.5 unrest=.4 stray=.9 volume=4 | sucked | wharf | A pin in clear water, with beads and a wide glassy ring
Watchmaker's bench | Pin pluck | stone=.02 splash=.6 thickness=.6 calm=.3 reading=Height circle=.2 volume=6 | mike | drips | Ticks: a pin, its short high drop, nothing after
Triangle behind curtains | Pin pluck | pattern=Eightfold stone=.02 splash=.5 thickness=.1 calm=3 circle=.4 depth=.3 layers=.5 stray=.9 volume=6 | muffled | wharf | A pin and an eightfold ring
Anvil on a raft | Pin pluck | pattern=Squares stone=.4 splash=1 thickness=.15 calm=2 circle=.7 depth=.8 shake=.4 threshold=.2 lag=.15 stray=.75 layers=.5 volume=4 | triode | toll | A hard stone and bright clanging squares
Sleigh gone by | Pin pluck | pattern=Free stone=.05 splash=1 thickness=.12 calm=1.5 circle=.6 unrest=1 drift=4 foam=.2 stray=.15 volume=5 | sparks | chimes | Pins that shiver quickly, a breath of spray with each
Bells along a channel | Mercury bells | pool=Long pattern=Hexagons stone=.3 splash=.7 thickness=.5 circle=.3 depth=.3 calm=3 layers=.1 volume=1 | pipe | chimes | A knock in a channel, nasal, with a hollow tail
Cistern drops | Dripping cave | pool=Long stone=.4 splash=.9 calm=5 thickness=.4 circle=.3 stray=.2 layers=.15 volume=5 | cave 1.mix=0.25 | drips | Drops in a narrow channel, from side to side
Bells of the waterworks | Boulder | splash=.6 stone=.3 thickness=.5 calm=4 circle=.3 depth=.4 below=.2 foam=.1 stray=.2 layers=.05 volume=6 | springs | chimes | A stone in a channel and free waves that hum after
Struck copper pipe | Boulder | pattern=Stripes splash=.9 stone=.5 thickness=.4 calm=3 below=.6 shake=.5 threshold=.25 lag=.3 depth=.4 stray=.2 volume=-1 | iron | toll | A blow on a channel, hollow, with an octave coming up under
Stacked pewter | Mercury bells | pool=Long reading=Height pattern=Squares stone=.5 splash=.8 thickness=.5 circle=.4 depth=.5 calm=2 shake=.35 threshold=.2 lag=.2 volume=-1.5 | hotvalve | toll | Dull squares knocked in a channel, dark and clangy
Ship's bells aft | Mercury bells | pool=Sea stone=.2 splash=.8 calm=8 circle=.5 layers=.6 width=1 volume=4 | open | wharf | Small stones over a dark sea, each ring surging as it leaves
Fishing floats | Mercury bells | pool=Sea pattern=Hexagons stone=.5 splash=.6 shake=.5 threshold=.2 lag=.35 calm=5 thickness=.2 drift=.5 below=.2 volume=1 | swells | chimes | Dull stones, then sea hexagons that bob up after them
Buoy with a cracked bell | Mercury bells | pool=Sea pattern=Free stone=.35 splash=.9 shake=.45 threshold=.2 lag=.3 calm=4 unrest=.9 depth=.6 foam=.3 volume=6 | surf | toll | A clank and six waves out of step, with foam
Trawl of lights | Light on the floor | shake=.35 threshold=.2 splash=.8 stone=.12 calm=6 drift=1.4 circle=.5 depth=.5 thickness=.1 layers=.5 volume=2.5 | recall | chimes | A pin and a deep light that flickers as it dies
Lighthouse keeper's egg | Light on the floor | pool=Sea splash=.5 stone=.3 thickness=.3 calm=4 depth=.6 circle=.3 drift=.6 lag=.5 shake=.85 threshold=.25 below=.15 volume=1.5 | slowing | chimes | A drop, then bent light that comes round with the surge
Fifth floor wind chime | Eightfold shimmer | shake=.3 threshold=.2 splash=.85 stone=.06 lag=.3 calm=3 circle=.3 drift=1.4 unrest=.7 thickness=.3 volume=6 | wander | wharf | A pin, and eight crossing waves that twinkle out
Second advent candle | Eightfold shimmer | reading=Caustic splash=.5 stone=.15 lag=.2 calm=3.5 circle=.3 depth=.45 thickness=.35 drift=.5 threshold=.1 volume=3 | voices | chimes | A soft drop and a glint far above it
Star maps in a cold car | Eightfold shimmer | splash=.4 stone=.02 lag=1 calm=8 circle=.1 depth=.15 layers=.3 drift=.3 thickness=.35 stray=.4 shake=.5 threshold=.15 below=.5 volume=-1.5 | frozen | star | A needle, then a plain tone under a slow high glitter
Rain on the telescope | Eightfold shimmer | reading=Caustic shake=.75 threshold=.15 splash=.6 stone=.08 calm=1.5 circle=.2 depth=.25 thickness=.5 drift=3 unrest=.55 lag=.3 volume=6 | harmtrem | chimes | Pins, with a short quick glint after each
Last bell at school | Light on the floor | pattern=Squares splash=.6 stone=.2 lag=.2 calm=2 drift=2.4 circle=.4 depth=.35 thickness=.2 threshold=.05 below=.5 volume=3.5 | stars | chimes | A stone and bright squares that flicker, trading places
`,
    },
    {
      id: 'oil-drones',
      name: 'Oil drones',
      category: 'drone',
      rows: `
Sump light | Oil drone | lag=2.5 circle=.35 depth=.4 below=.2 calm=5 drift=.1 shake=.95 threshold=0 layers=.05 volume=-2 | bare | fifth | Round hexagons in oil, rising for two seconds, full in the middle
Diesel on a still dock | Oil drone | lag=1.5 circle=.9 depth=.9 below=.85 unrest=.8 stray=.8 drift=.2 calm=6 shake=.5 threshold=.1 layers=0 | iron | fifth | Smooth wide oil, turning over slowly, the octave beneath
Warm beeswax | Oil drone | thickness=.75 circle=.5 depth=.2 below=0 foam=.15 lag=3 drift=.4 stray=.3 layers=0 width=.75 | blanket | gather | Dull and warm with a little air, no octave under it
Asphalt lake | Oil drone | thickness=1 circle=1 depth=.5 below=1 drift=.03 unrest=.05 calm=12 lag=3 shake=.9 threshold=.3 stray=.1 volume=0.5 | lowvault | abyss | As thick as it goes, wide, the lower octave far under, hardly moving
Chandler's back room | Oil drone | lag=.8 circle=.2 depth=.7 below=.3 drift=1 stray=.6 calm=3 splash=.3 stone=.6 width=.35 volume=1 | parlour | lone | A soft knock, then a round tone over a little octave that wavers
Amber lit from under | Oil drone | reading=Caustic circle=.5 depth=.5 below=.3 lag=2 drift=.15 calm=7 width=.85 volume=-1.5 | glow | fifth | Light through oil, dim, with an octave under half awake
Gold leaf in the dark | Oil drone | reading=Caustic thickness=.6 circle=.8 depth=.8 layers=.5 lag=2.5 stray=.8 drift=.5 calm=8 shake=.7 threshold=.15 volume=0 | nave | fifth | Wide lines of light in thick water over its octave, bright edges, sliding
Honey facing north | Oil drone | reading=Caustic thickness=.85 circle=.25 depth=.3 below=0 lag=1.2 unrest=.2 shake=.9 threshold=0 layers=.1 volume=0.5 | vowel | lone | A small circle in honey, one steady tone with a soft light on it
Resin and flies | Oil drone | reading=Caustic circle=.6 depth=1 thickness=.7 drift=2.5 stray=.5 unrest=.7 lag=1 calm=3 shake=.9 threshold=.25 width=.75 volume=3 | onwater | star | Deep light in resin over its octave, quick inside
Furnace slot | Oil drone | reading=Caustic pattern=Squares circle=.7 depth=.7 below=.7 thickness=.6 lag=1.5 drift=.4 shake=.5 threshold=.25 layers=.6 width=1 | hotvalve | deep | Glowing squares over a low octave, opening and closing
Mill race all night | Oil drone | reading=Slope circle=.5 depth=.4 thickness=.5 below=.5 lag=1.5 foam=.3 drift=.6 shake=.95 threshold=.05 width=.4 | console | fifth | Slopes of thick water, a buzzing edge with breath and weight under
Saw pit at rest | Oil drone | reading=Slope circle=.3 depth=.8 thickness=.7 below=.8 lag=2.5 unrest=.6 drift=.1 shake=.55 threshold=.1 layers=.1 width=.35 volume=3.5 | cupboard | abyss | Folded slopes, dark, grinding slowly over the octave
Viol bowed for an hour | Oil drone | reading=Slope pattern=Stripes circle=.6 depth=.2 thickness=.45 below=.3 lag=1.2 drift=.8 stray=.6 calm=3 shake=.4 threshold=.15 volume=-2.5 | wood | fifth | One leaning wave, hollow, its edge catching and slipping | string
Hornets in a hedge | Oil drone | reading=Slope pattern=Free circle=.9 depth=.5 thickness=.45 below=.2 unrest=.9 drift=3 lag=.8 foam=.1 layers=.15 volume=5.5 | shaded | star | Six leaning waves that jostle, quick and thin
Crank turned slowly | Canal reeds | below=.7 lag=1.5 calm=4 circle=.7 depth=.5 unrest=.5 drift=.35 thickness=.5 foam=.1 splash=.05 shake=.85 threshold=.15 volume=-1.5 | lowpulse | fifth | Leaning stripes over their own lower octave, reedy
Pipe under a full moon | Oil drone | pattern=Stripes circle=.4 depth=.3 below=0 thickness=.4 lag=2 drift=.08 calm=8 shake=.5 threshold=.05 volume=-0.5 | hall | lone | A round tone by itself, very slow to change
Disused railway tunnel | Oil drone | pattern=Stripes circle=.7 depth=.8 below=.4 thickness=.55 foam=.3 lag=3 stray=.7 layers=.75 volume=1.5 | cave | fifth | A wide hollow tone with air in it, rising for three seconds
Didgeridoo in a culvert | Oil drone | pattern=Stripes pool=Long circle=.6 depth=.7 below=.6 thickness=.5 unrest=.8 drift=1.2 lag=.6 splash=.2 shake=.4 threshold=.1 width=.75 volume=0.5 | pipe | deep | A hollow channel tone, buzzing at its crests, its vowel moving
Two hollow trees | Oil drone | pattern=Stripes reading=Caustic circle=.3 depth=.6 below=.9 thickness=.8 lag=1.8 width=.8 drift=.2 shake=.4 threshold=0 layers=.1 volume=0.5 | wide | fifth | Striped light, dark and round, nearly as much octave as note
Organ pump left on | Stripe flute | below=1 lag=1.5 calm=5 foam=.2 circle=.4 depth=.5 unrest=0 drift=.05 thickness=.6 splash=0 shake=.9 threshold=0 volume=2.5 | flutestop | fifth | A plain tone held as level as it goes, its octave far under | organ
Tidal gate | Oil drone | pattern=Squares circle=.5 depth=.5 below=.6 thickness=.6 drift=.02 lag=2 calm=6 shake=.8 threshold=.1 layers=.45 volume=0.5 | darkplate | fifth | Squares that tip one way for a second and then the other
Pendulum in syrup | Oil drone | pattern=Squares reading=Height circle=.8 depth=.6 below=.3 drift=.05 lag=1 thickness=.7 calm=4 shake=.7 threshold=.1 width=.85 volume=0 | muffled | lone | Thick squares, swinging from full to hollow about once a second
Breathing floor | Oil drone | pattern=Squares pool=Sea circle=.4 depth=.4 below=.95 drift=.02 lag=2.5 foam=.2 thickness=.5 shake=.9 threshold=.05 layers=0 width=.05 volume=5.5 | breathing | deep | Dark squares on a sea, two slow tides over a deep octave
Turbine hall on Sunday | Alternate squares | reading=Slope lag=2 below=.6 thickness=.6 calm=6 drift=.06 splash=0 circle=.5 depth=.4 layers=.1 unrest=.15 volume=-0.5 | latehall | fifth | Leaning squares over an octave, a thin hum that comes and goes every second
Laundry at night | Alternate squares | lag=1.2 below=.4 drift=3 calm=3 thickness=.55 circle=.7 depth=.5 splash=.05 foam=.2 shake=.85 threshold=.15 layers=.45 width=.85 volume=6 | toe | lone | Squares of light that shudder, churning, with some air
Ceiling of a grotto | Eightfold shimmer | lag=2 thickness=.5 below=.5 circle=.2 depth=.3 drift=.15 calm=9 layers=.2 shake=.7 threshold=.25 unrest=.8 stone=.5 volume=-1 | airtail | fifth | A low root and, far above, a slow glint of eight waves
Salt mine chandelier | Eightfold shimmer | lag=2.5 thickness=.3 below=.8 circle=.4 depth=.4 drift=.5 calm=10 foam=.1 shake=.5 threshold=0 stone=.15 volume=1.5 | shimmer | deep | Deep octave at the bottom, crystals at the top, little between
Hoar frost on the line | Oil drone | pattern=Eightfold reading=Caustic circle=.1 depth=.5 thickness=.45 below=.2 drift=1.5 lag=1 shake=.55 threshold=.05 width=.35 volume=2.5 | frost | lone | A plain tone with one high band of light trembling on it
Jar over a flame | Oil drone | pattern=Eightfold reading=Height circle=.5 depth=.6 thickness=.7 below=.1 lag=1.5 foam=.2 drift=.25 shake=.85 threshold=.1 layers=0 width=.05 volume=3 | tube | star | Eight waves in thick water, smooth, with breath
Aurora over moorings | Eightfold shimmer | pool=Sea lag=3 thickness=.35 below=.9 circle=.3 depth=.4 drift=.1 calm=12 width=1 stone=.6 volume=2 | swelling | fifth | Eight waves out on the sea, very slow, a trace of the octave under
Six people humming | Oil drone | pattern=Free circle=.4 depth=.3 below=.3 thickness=.6 unrest=.5 drift=.3 lag=1.5 foam=.1 shake=1 threshold=.35 layers=.5 width=1 volume=-0.5 | chamber | fifth | Six waves in thick water, each coming forward in its turn
Herd in fog | Quarrelling swells | reading=Height thickness=.7 below=.5 lag=2 drift=.2 calm=6 foam=.4 circle=.2 depth=.3 layers=0 volume=4 | bank | abyss | Low free waves, slow, each swelling out of the rest
Argument upstairs | Quarrelling swells | reading=Slope thickness=.6 below=.4 lag=1 drift=1.5 circle=.5 foam=.1 calm=3 depth=.5 layers=0 volume=1 | downhall | fifth | Leaning waves at odds, rising over each other, the octave below
Glacier tongue | Quarrelling swells | unrest=.15 thickness=.8 below=.6 lag=2 drift=.04 calm=12 circle=.9 depth=.8 foam=0 splash=0 layers=.45 stray=.2 volume=1 | darkhall | fifth | Wide deep light in oil over its octave, changing over many seconds
Ants under bark | Quarrelling swells | thickness=.5 circle=.3 depth=.9 drift=5 unrest=.7 lag=1 foam=.15 calm=2 below=.1 volume=5 | twinkle | lone | Deep light on a small circle, all of it in quick movement
Night crossing | Grey sea | lag=1.5 below=.8 foam=.5 thickness=.5 circle=.6 depth=.7 drift=.2 splash=.2 calm=6 volume=-1.5 | throb | fifth | Tall free waves with foam, rolling over a full low octave
Kelp line | Grey sea | pattern=Hexagons foam=.2 lag=2 below=.75 thickness=.7 circle=.4 depth=.4 drift=.1 calm=8 layers=.1 volume=-1 | current | fifth | Thick hexagons on the sea, dark, surging over an octave
Breakwater lamp | Grey sea | reading=Caustic pattern=Stripes foam=.1 lag=1.5 below=.2 circle=.6 depth=.6 drift=.3 calm=6 thickness=.4 layers=0 volume=-2.5 | drum | lone | A plain light that comes round with the swell
Lead line paid out | Grey sea | foam=0 lag=2.5 below=1 thickness=.9 circle=.2 depth=.2 unrest=.2 stray=.2 width=.3 layers=.05 volume=-8 | cellar | deep | Plain, half its pitch at full, surging every three seconds
Ice floe at anchor | Grey sea | pattern=Squares foam=.35 lag=2 thickness=.1 circle=.7 depth=.6 layers=.6 drift=.4 calm=9 below=.1 volume=6 | glacial | star | Squares on a cold sea, grainy, rising and sinking
Air through a lock | Throat of water | lag=2 below=.5 foam=.6 thickness=.5 calm=6 drift=.15 circle=.4 depth=.4 splash=0 shake=.75 threshold=.05 volume=3.5 | hiss | fifth | A channel of breath and vowel, tipping from side to side
Monk at the far sink | Throat of water | reading=Height below=.7 lag=1 foam=.2 thickness=.5 calm=3 drift=.6 circle=.5 depth=.5 layers=.1 volume=2.5 | oo | chant | A narrow dark vowel over half its pitch | voice
Boiler flue singing | Oil drone | pool=Long circle=.6 depth=.4 below=.3 thickness=.55 lag=2 foam=.1 drift=.2 shake=.95 threshold=0 layers=.15 volume=6 | stairs | lone | Hexagons in a flue, hollow, with one vowel standing out
Thaw on a zinc roof | Oil drone | pool=Long pattern=Free circle=.3 depth=.5 below=.5 thickness=.7 unrest=.7 lag=2 drift=.5 splash=.3 stone=.3 shake=.45 threshold=.15 volume=3.5 | drips | fifth | Free waves in a gutter, nasal, shifting, a drop at the front
Pavement grate | Oil drone | pool=Long pattern=Stripes reading=Slope circle=.4 depth=.5 below=.9 thickness=.6 foam=.7 lag=1.5 shake=.75 threshold=.5 volume=1.5 | combo | deep | Breath up a channel over a big low octave
Air over the reservoir | Stripe flute | foam=1 lag=2 circle=.3 depth=.2 calm=8 drift=.1 stray=.5 thickness=.4 unrest=.5 splash=0 shake=.55 threshold=.15 volume=0.5 | haze | star | Air with one plain tone inside it, slow
High wire in light wind | Pool pad | thickness=.3 lag=1.8 circle=.15 depth=.4 foam=.3 calm=6 drift=.08 splash=0 unrest=.05 shake=1 threshold=.3 stray=.1 below=.3 volume=-1 | flock | star | A small circle of hexagons, steady, over its octave, a little wind on it
Mist in the pines | Oil drone | thickness=.5 foam=.9 circle=.5 depth=.4 below=.2 lag=2.5 unrest=.6 stray=.7 drift=.2 width=1 layers=0 volume=0 | mist | gather | Breath that follows a soft chord of hexagons
Tuning before dawn | Oil drone | thickness=.6 pattern=Hexagons circle=.4 depth=.5 below=.3 lag=1.4 drift=.7 stray=.9 unrest=.4 foam=.05 shake=.85 threshold=.35 layers=0 volume=-3.5 | strings | gather | Round hexagons whose overtones wander off and come back
Seams of coal | Late bass | reading=Caustic lag=2.5 below=1 circle=.8 depth=.4 thickness=.6 calm=7 drift=.1 splash=0 stray=.7 shake=1 threshold=0 layers=0 volume=-2 | darkhall | fifth | Dull light with its lower octave far under, very slow to rise
`,
    },
    {
      id: 'eightfold-shimmers',
      name: 'Eightfold shimmers',
      category: 'pad',
      rows: `
First ice on the reeds | Eightfold shimmer | circle=.15 depth=.2 layers=.2 drift=.5 lag=1.2 thickness=.35 shake=.8 threshold=.15 unrest=.15 stone=.5 below=.35 volume=-3.5 | airtail | shore | A soft plain chord over a trace of its octave, one fine glint far above
Aquarium after hours | Eightfold shimmer | circle=.5 depth=.5 layers=.4 drift=1 stray=.9 lag=1 calm=4 thickness=.25 shake=.4 threshold=.1 unrest=.15 stone=.5 below=.2 volume=-2 | shallows | gather | Eight waves read far off the middle, bright bands sliding
Sequin by sequin | Eightfold shimmer | drift=4.5 unrest=.8 circle=.3 depth=.3 layers=.3 thickness=.3 lag=.6 volume=-0.5 | twinkle | plain | Very quick and uneven, each key sparkling by itself
Smoked glass | Eightfold shimmer | circle=.8 depth=.15 layers=.1 drift=.04 thickness=.5 stray=.05 lag=.8 calm=3 shake=.9 threshold=0 stone=.85 unrest=0 below=.9 volume=-2.5 | shaded | ties | Wide and shallow, dull for eight waves, its octave under, hardly moving
Lay-by under stars | Eightfold shimmer | layers=1 circle=.2 depth=.4 drift=.8 lag=2 calm=8 thickness=.2 width=1 shake=.75 threshold=0 unrest=.65 below=.3 volume=-1.5 | open | gather | All the finer ripples at once, a wide dust of overtones
Moth against a lampshade | Eightfold shimmer | reading=Height circle=.4 depth=.5 drift=3.5 unrest=.6 lag=.4 calm=2 thickness=.3 shake=.95 threshold=.15 stone=.7 below=.3 volume=-3.5 | pillow | plain | Eight waves by height, round, beating against the note
Porcelain on a shelf | Eightfold shimmer | reading=Caustic circle=.12 depth=.4 drift=.3 stray=.2 lag=.6 calm=2 thickness=.5 splash=.3 stone=.1 shake=.85 threshold=.1 unrest=.05 volume=-1 | booth | hands | A tick, then a smooth tone and a glint far over it
Lace curtain in sun | Eightfold shimmer | reading=Height circle=.8 depth=.7 layers=.5 drift=1.2 lag=1 thickness=.3 foam=.15 shake=.5 threshold=.25 unrest=.65 stone=.05 below=.2 volume=-0.5 | ripples | shore | Tall fine crests on a wide circle, light passing through
Silver birches | Eightfold shimmer | reading=Height circle=1 depth=1 drift=.6 stray=.5 lag=1.4 thickness=.4 calm=5 shake=.9 threshold=.1 unrest=.45 stone=.05 layers=.5 volume=0.5 | swirl | gather | Crests drawn steep, a thin light over a round tone
Breath on a pane | Eightfold shimmer | reading=Height foam=1 circle=.3 depth=.3 drift=.4 lag=1.5 thickness=.5 calm=4 shake=.7 threshold=.35 stone=.7 below=.3 volume=-2 | chamber | shore | Breath thick on a plain note, a fine edge to it
Midges above the weir | Eightfold shimmer | reading=Slope circle=.3 depth=.3 drift=5 thickness=.55 layers=.2 lag=.5 calm=1.5 shake=.75 threshold=.1 unrest=.65 volume=-1.5 | edges | plain | Leaning eightfold waves in a quick thin cloud
Cicadas over the valley | Eightfold shimmer | reading=Slope circle=.35 depth=.5 drift=2 unrest=.9 thickness=.6 layers=.1 lag=1.5 foam=.2 shake=.85 threshold=.35 volume=-4 | farshore | gather | Leaning waves that pulse at random, dry and high | texture
Scoured sky | Eightfold shimmer | reading=Slope circle=.3 depth=.6 thickness=.6 drift=.6 lag=1 foam=.8 calm=3 layers=.1 shake=.55 threshold=.1 volume=0 | haze | star | A thin leaning glint with much air | texture
Distant harmonics | Eightfold shimmer | reading=Slope circle=.2 depth=.1 thickness=.5 drift=.8 lag=.8 calm=2 stray=.4 layers=.05 shake=.7 threshold=.05 volume=2.5 | ensemble | ties | Eight shallow slopes, a pale bowed edge | string
Strings by lantern light | Eightfold shimmer | reading=Slope circle=.75 depth=.15 thickness=.65 below=.35 drift=1.4 lag=1.2 layers=.4 shake=.7 threshold=.35 volume=0.5 | chorus | shore | Leaning waves with an octave under them, like two sections
Harrow under starlight | Eightfold shimmer | below=.8 circle=.3 depth=.4 lag=1.5 drift=.3 thickness=.3 calm=5 shake=.85 threshold=0 unrest=.15 volume=-2.5 | lowvault | shore | A full octave beneath and eight waves on top, wide apart
Taproot and stars | Eightfold shimmer | below=1 reading=Height circle=.5 depth=.5 lag=2.5 drift=.6 thickness=.4 stone=.8 splash=.3 shake=.95 threshold=.1 unrest=.65 volume=-2.5 | bowls | gather | A far low stone, the octave below, the glint last
Doubled harbour lights | Eightfold shimmer | below=.5 circle=.6 depth=.6 drift=1.8 stray=.6 lag=.7 thickness=.2 calm=3 volume=0.5 | stars | plain | Bright bands that move over a lower octave
Cellist in an ice cave | Eightfold shimmer | below=.9 reading=Slope circle=.25 depth=.2 lag=1.2 thickness=.6 drift=.4 layers=.1 foam=.15 unrest=.15 stone=.15 volume=2.5 | cave | chant | A low bowed edge, the octave under it, a cold shine | string
Deep freeze hum | Eightfold shimmer | below=.7 thickness=.7 circle=.1 depth=.6 drift=.02 lag=1 calm=2 unrest=0 width=.2 shake=.7 threshold=.05 stone=.05 stray=.05 volume=-2 | mono | lone | A plain hum, octave under, the glint held very still | drone
Comet going under | Eightfold shimmer | pool=Sea circle=.6 depth=.3 drift=.4 lag=2.5 calm=10 thickness=.2 stray=.8 shake=.95 threshold=.1 unrest=.65 stone=.15 reading=Slope below=.3 volume=-0.5 | sucked | gather | Eight waves out to sea, leaning, each surge a little brighter
Plankton in the wake | Eightfold shimmer | pool=Sea reading=Caustic circle=.7 depth=.7 layers=.7 drift=2.5 foam=.3 lag=.8 thickness=.1 shake=.5 threshold=.1 stone=.2 volume=1 | surf | plain | Light in the swell, all small ripples, with foam
Salt pan at dusk | Eightfold shimmer | pool=Sea reading=Height circle=.6 depth=.6 drift=.2 lag=1.5 thickness=.3 calm=6 foam=.1 shake=.45 threshold=.05 unrest=.65 stone=.6 below=.3 volume=-1 | evening | shore | Broad dim crests that swell and leave slowly
Moon path | Eightfold shimmer | pool=Sea circle=.2 depth=.3 drift=1 lag=1.2 calm=5 splash=.4 stone=.3 thickness=.25 shake=.85 threshold=.1 below=.15 volume=4.5 | latehall | star | A drop, and one high tone that goes up and down with the tide
Nets hauled at night | Eightfold shimmer | pool=Sea reading=Slope circle=.3 depth=.3 foam=.6 drift=.7 lag=.8 thickness=.45 unrest=.6 layers=.2 shake=1 threshold=.1 stone=.7 below=.15 volume=2 | hiss | fifth | Leaning waves and spray, up and down | texture
Kingfisher gone | Eightfold shimmer | splash=.9 stone=.08 lag=.5 circle=.3 depth=.3 drift=1.5 calm=3 thickness=.15 shake=.95 threshold=.4 unrest=.45 volume=0.5 | mirror | hands | A hard bright drop and the eight waves behind it
Ice in a long drink | Eightfold shimmer | splash=.7 stone=.2 lag=.2 threshold=.8 circle=.5 depth=.4 calm=1.5 drift=2.2 thickness=.2 unrest=.05 shake=1 below=.3 volume=0.5 | clean | hands | A clink, and under firm keys a quick glitter at once | keys
Meteor counting | Eightfold shimmer | splash=1 stone=.03 shake=.3 threshold=.15 lag=1.5 circle=.2 depth=.2 calm=6 thickness=.2 drift=.6 volume=6 | trail | star | A needle, and long after it a faint eightfold ring | bell
Fountain turned low | Eightfold shimmer | splash=.8 stone=.3 foam=.5 lag=.4 circle=.4 depth=.5 drift=1.6 calm=2 thickness=.25 unrest=.5 shake=.55 threshold=.05 below=.15 volume=0 | alcove | plain | Spray at each key and a trembling high sheen
Coin into a wish well | Eightfold shimmer | splash=.9 stone=.45 lag=1 circle=.25 depth=.25 calm=5 thickness=.35 drift=.5 unrest=.55 volume=3 | well | star | A round drop, a pause, and the shimmer far up
Sleet at the skylight | Eightfold shimmer | circle=.6 depth=.35 layers=.5 thickness=.18 drift=3 lag=.3 calm=1.5 splash=.3 stone=.05 shake=1 threshold=.25 unrest=.8 volume=1.5 | rain | hands | Thin cold ripples in quick bursts
Prism on a string | Eightfold shimmer | circle=.45 depth=.75 drift=.4 stray=1 lag=.8 calm=3 thickness=.2 layers=.2 shake=1 threshold=.5 unrest=.45 stone=.05 volume=3.5 | eight | ties | Deep light swung far off the middle, colours in turn
Copper beech in wind | Eightfold shimmer | pattern=Free layers=.8 circle=.6 depth=.4 drift=2 unrest=.8 lag=.8 thickness=.3 shake=.9 threshold=.1 below=.4 volume=1 | sigh | shore | Six waves and all their ripples, rustling
Tinsel in a draught | Eightfold shimmer | circle=.9 depth=.6 layers=.5 thickness=.3 drift=1.3 foam=.2 lag=.6 calm=2 shake=.55 threshold=.25 unrest=.8 stone=.05 volume=4.5 | jet | plain | As wide as eight waves go, brittle, with a little breath
Slow mirror ball | Alternate squares | pattern=Eightfold lag=1 drift=.7 circle=.35 depth=.4 below=.3 calm=4 thickness=.3 stray=.8 shake=.85 threshold=0 layers=.1 unrest=.05 width=.4 volume=-3 | chorale | shore | Spots of light going round over a lower octave
Milk opal | Pool pad | pattern=Eightfold thickness=.6 circle=.2 depth=.55 lag=1.2 drift=.4 foam=.1 layers=0 calm=4 shake=.95 threshold=.35 unrest=.15 stone=.5 below=.15 volume=-2 | cloud | gather | Clouded eightfold light, soft, without its finest ripples
Blue enamel cup | Pool pad | pattern=Eightfold reading=Height thickness=.85 circle=.4 depth=.4 lag=1 calm=3 layers=.1 shake=.5 threshold=.1 unrest=.55 width=.85 stone=.5 below=.3 volume=-2.5 | blanket | ties | So thick that only a ghost of the eight waves is left
Green on old copper | Pool pad | pattern=Eightfold thickness=.5 circle=.7 depth=.3 below=.4 lag=1.8 drift=.15 unrest=.6 shake=.95 threshold=.3 width=1 volume=-2 | melt | shore | Dull green light, an octave half awake below
Greenhouse at midnight | Pool pad | pattern=Eightfold thickness=.4 circle=.3 depth=.6 foam=.45 lag=1.4 drift=.3 stray=.6 calm=5 shake=.4 threshold=0 layers=.15 width=1 stone=.6 below=.35 volume=1 | drips | gather | Warm damp air over eight slow waves
Divers at first light | Pool pad | pattern=Eightfold reading=Height thickness=.4 circle=.6 depth=.3 splash=.5 stone=.5 lag=1 calm=4 drift=.8 shake=.8 threshold=0 layers=0 unrest=.05 volume=-2.5 | bloom | plain | A round stone, then a smooth plain chord
Cold rink organ | Canal reeds | pattern=Eightfold circle=.1 depth=.3 thickness=.5 lag=.2 calm=.4 drift=.04 foam=0 layers=.1 shake=.7 threshold=.25 stone=.6 stray=.05 unrest=0 volume=-1.5 | drum | hands | Leaning tones with a cold rim, steady | organ
Choir of wet fingers | Mercury bells | pattern=Eightfold shake=.7 threshold=.1 lag=1.2 splash=.05 circle=.15 depth=.2 layers=.3 calm=4 thickness=.3 drift=.9 volume=-3 | voices | shore | No drop at all, a rubbed high ring that swells
Snowmelt on a string | Pin pluck | pattern=Eightfold shake=.5 threshold=.15 lag=.15 splash=.5 stone=.15 circle=.3 depth=.3 calm=1 thickness=.4 stray=.6 layers=0 below=.3 volume=3.5 | dotted | lute | A pluck with a short glint after it | plucked
Glassblower's lung | Stripe flute | pattern=Eightfold circle=.35 depth=.5 foam=.9 lag=.6 drift=1 thickness=.5 calm=1.5 shake=1 threshold=.25 reading=Caustic volume=4 | tube | arch | Breath with a brittle tone in it | wind
Vowels of the glacier | Throat of water | pattern=Eightfold reading=Height circle=.2 depth=.2 thickness=.75 lag=1.2 calm=3 foam=.2 layers=0 drift=.3 shake=.8 threshold=.1 stone=.85 volume=-1.5 | oo | shore | Eight waves in a channel, thick, a bright thin vowel | voice
Orrery | Light on the floor | pattern=Eightfold drift=.25 circle=.3 depth=.6 lag=1.5 calm=6 stray=.7 thickness=.2 shake=.5 threshold=0 below=.3 volume=0.5 | moons | gather | Deep light on slow orbits, overtones that rise and set
Switchboard at night | Light on the floor | pattern=Eightfold drift=5 circle=.15 depth=.4 lag=.2 calm=.6 thickness=.3 splash=.2 stone=.05 shake=.95 threshold=.3 volume=2.5 | sides | invention | Small pins and a nervous high flicker | keys
Snow falling upward | Eightfold shimmer | circle=.25 depth=.25 drift=.9 lag=2 calm=7 foam=.25 thickness=.3 unrest=.5 stone=.6 below=.35 volume=-1 | graincloud | shore | Soft chords with slow white light over them
Dust in a projector | Eightfold shimmer | circle=.35 depth=.35 drift=1.2 lag=.6 calm=2.5 thickness=.45 layers=.5 stray=.5 width=.3 shake=.55 threshold=.25 volume=-3 | pressing | plain | Narrow, flickering gently, worn at the top
Locked orchid house | Eightfold shimmer | shake=.9 unrest=.3 circle=.4 depth=.2 drift=.35 lag=1 calm=5 thickness=.45 foam=.15 stone=.05 below=.25 volume=-1.5 | swelling | ties | Shallow and full, the glint always there and never loud
`,
    },
    {
      id: 'quarrelling-swells',
      name: 'Quarrelling swells',
      category: 'pad',
      rows: `
Six at one table | Quarrelling swells | circle=.4 depth=.3 drift=.4 lag=1.2 unrest=.6 foam=.1 below=.3 volume=-1 | bare | shore | Six waves that take the chord from each other over a trace of its octave
Cloakroom rumours | Quarrelling swells | drift=2 circle=.3 depth=.5 unrest=.8 lag=.6 calm=1.5 width=.3 layers=.1 volume=1.5 | cupboard | plain | Quick murmuring waves, narrow, never two alike
Weather coming over | Quarrelling swells | drift=.15 circle=.8 depth=.6 unrest=1 lag=2.5 foam=.4 calm=6 below=.5 volume=1.5 | open | gather | Slow wide waves with wind on them, each key darkening in turn
Rooks in the elms | Quarrelling swells | depth=.9 circle=.6 layers=.6 drift=1.2 lag=.6 thickness=.2 calm=1.5 volume=3 | downhall | hands | Hard bright light, six waves all talking
Feud in pastel | Quarrelling swells | circle=.06 depth=.05 thickness=.6 drift=.6 unrest=.7 lag=1 foam=0 stray=.3 volume=1.5 | chorus | ties | Free waves on so small a circle that they only tint the note
Offstage orchestra | Quarrelling swells | reading=Height circle=.7 depth=.6 drift=.3 lag=1.6 calm=3 thickness=.3 below=.45 volume=0 | latehall | gather | Tall free waves, dark, swelling out of step
Brass behind a wall | Quarrelling swells | reading=Height circle=.5 depth=.9 thickness=.5 lag=1.2 unrest=.5 drift=.2 foam=0 below=.2 layers=.6 volume=-3.5 | muffled | plain | Steep crests, blunt, rising like slow breath into horns | wind
Wool market | Quarrelling swells | reading=Height circle=.4 depth=.2 thickness=.8 unrest=.9 drift=.5 lag=.8 foam=.2 calm=2 layers=.1 below=.4 volume=-2.5 | giant | shore | Thick soft waves, jostling, all low overtones
Lead in the curtains | Quarrelling swells | reading=Height below=.8 circle=.3 depth=.5 lag=1.5 drift=.25 unrest=.7 foam=.1 splash=.15 stone=.9 volume=-1.5 | darkroom | fifth | Free waves hung over their own lower octave
Dancers change partners | Quarrelling swells | reading=Height circle=.9 depth=.4 layers=.5 drift=.9 lag=.7 calm=2 foam=.1 below=.2 volume=4.5 | ensemble | ties | Wide free waves with finer ripples, turning about
Violas at odds | Quarrelling swells | reading=Slope circle=.6 depth=.25 thickness=.4 drift=.5 lag=.8 foam=.1 calm=1.5 volume=-0.5 | parlour | shore | Six leaning waves, each its own bow | string
Committee of strings | Quarrelling swells | reading=Slope circle=.85 depth=.7 unrest=1 drift=1.5 lag=.5 thickness=.35 foam=.05 volume=-2.5 | chamber | plain | Leaning waves, edgy, coming forward one by one | string
Bowed wire fence | Quarrelling swells | reading=Slope circle=.8 depth=.6 drift=.2 lag=2 thickness=.3 foam=.3 calm=4 unrest=.8 layers=.15 volume=1.5 | valley | fifth | Slow thin slopes with wind, wide folds, nothing low | string
Cellos under blankets | Quarrelling swells | reading=Slope below=.7 circle=.85 depth=.4 thickness=.6 lag=1 drift=.2 foam=0 calm=2 volume=2 | blanket | chant | Leaning waves over half their pitch, bowed and dull | string
Crowd of small fiddles | Quarrelling swells | reading=Slope circle=.5 depth=.35 layers=.5 drift=2.5 unrest=.7 lag=.3 calm=.8 thickness=.3 width=.6 volume=1.5 | thick | hands | Many thin edges in quick motion | string
Biggest wave of nine | Quarrelling swells | pool=Sea circle=.6 depth=.6 drift=.4 lag=2 foam=.5 calm=5 splash=.2 stone=1 below=.15 volume=1.5 | breathing | gather | Free waves on the sea, foaming, each surge another of the six
Skerries | Quarrelling swells | pool=Sea reading=Height circle=.4 depth=.7 foam=.3 unrest=.9 drift=.8 lag=1 calm=3 below=.35 volume=-0.5 | surf | shore | Tall dark waves that break unevenly
Sea fret lifting | Quarrelling swells | pool=Sea circle=.25 depth=.25 foam=.8 drift=.2 lag=2.5 calm=7 unrest=.5 thickness=.3 layers=0 below=.4 volume=1 | lowpass | gather | As much breath as tone, the chord showing through in places
Two tides in a strait | Quarrelling swells | pool=Sea below=.6 circle=.5 depth=.5 drift=.6 unrest=.8 lag=1.2 foam=.2 calm=4 volume=5 | swells | fifth | Waves that travel against each other over a low octave
Gulls on the turn | Quarrelling swells | pool=Sea reading=Slope circle=.7 depth=.4 drift=1.8 foam=.3 lag=.6 calm=2 thickness=.35 volume=3.5 | flock | call | Leaning calls on a swell, restless, no two the same | voice
Condemned house pipes | Quarrelling swells | pool=Long thickness=.6 circle=.75 depth=.75 drift=.4 lag=1 foam=.1 calm=2 below=.15 volume=0 | pipe | ties | Free waves in a channel, hollow, the vowel going round the keys
Council chamber row | Quarrelling swells | pool=Long reading=Slope thickness=.6 circle=.5 depth=.3 unrest=1 drift=1.2 lag=.5 foam=.2 layers=.45 volume=5 | stairs | hands | Wet syllables thrown from side to side | voice
Choir down the adit | Quarrelling swells | pool=Long reading=Height thickness=.55 circle=.6 depth=.4 lag=1.5 foam=.9 drift=.3 calm=4 layers=0 below=.3 volume=-1.5 | cave | shore | Sung with much breath, each voice swelling in turn | voice
Pressure in the mains | Quarrelling swells | pool=Long below=.8 thickness=.7 circle=.3 depth=.6 drift=.7 lag=.8 splash=.4 stone=.9 volume=1 | iron | fifth | A knock, a nasal strain, and half the pitch heaving under it
Draught horses at rest | Quarrelling swells | pool=Long reading=Height foam=.8 thickness=.6 drift=.3 lag=1 unrest=.7 circle=.3 depth=.3 below=.3 layers=.45 volume=6 | sigh | chant | Low breath in a channel with a tone inside it | texture
Squares with a grudge | Quarrelling swells | pattern=Squares unrest=1 circle=.5 depth=.5 drift=1 lag=.8 foam=0 calm=2 layers=.5 below=.3 volume=1 | tiles | plain | Two waves only, each trying to put the other down
Hospital swing doors | Quarrelling swells | pattern=Squares reading=Height unrest=.8 circle=.7 depth=.4 drift=.4 lag=1.2 thickness=.5 layers=0 below=.4 volume=1 | lowpulse | ties | Crossed waves that push open and fall shut
Rivals on a seesaw | Quarrelling swells | pattern=Squares reading=Slope unrest=.9 circle=.3 depth=.3 drift=1.5 lag=.5 thickness=.55 foam=.15 layers=.1 volume=0 | panned | hands | Leaning squares that tip over and back
Tarp and scaffold | Quarrelling swells | pattern=Squares pool=Sea unrest=1 circle=.4 depth=.6 drift=.6 lag=1.5 foam=.5 layers=.4 below=.35 volume=-1.5 | rain | gather | Squares flapping on a sea, with spray
Tennis by night | Alternate squares | unrest=1 drift=.6 circle=.5 depth=.6 lag=.4 splash=.6 stone=.25 below=0 calm=1.5 shake=.95 threshold=.05 layers=.45 volume=2.5 | slap | invention | A knock to each side and squares that swap after it | keys
Tired oars | Quarrelling swells | pattern=Hexagons unrest=.9 drift=.3 circle=.5 depth=.4 lag=1.5 foam=.15 thickness=.4 calm=4 layers=.1 below=.4 volume=-1.5 | glow | shore | Three waves that sag and lift, uneven, warm
Beehive in thunder | Quarrelling swells | pattern=Hexagons unrest=1 drift=3 circle=.8 depth=.8 lag=.5 thickness=.15 layers=.5 below=.2 volume=3 | easing | plain | Wide hexagons shaking hard and bright, all at once
Sisters at one mirror | Quarrelling swells | pattern=Hexagons reading=Height unrest=.7 drift=.5 circle=.3 depth=.5 lag=.8 thickness=.45 below=.3 volume=-0.5 | vibrato | ties | Three waves by height, each stepping up as another steps back
Tide pool gossip | Quarrelling swells | pattern=Hexagons unrest=.8 drift=1.6 circle=.5 depth=.5 layers=.7 lag=.4 splash=.4 stone=.15 calm=1.5 foam=.05 below=.3 volume=-1.5 | shallows | hands | Pebbles and small uneven figures with fine ripples | keys
Grain under wind | Quarrelling swells | pattern=Hexagons reading=Slope unrest=1 drift=.7 circle=.6 depth=.3 foam=.5 lag=1.2 thickness=.35 volume=-2.5 | ripples | gather | Leaning hexagons with much air, bending together
Uphill all the way | Quarrelling swells | shake=1 lag=6 circle=.6 depth=.5 drift=.3 foam=.2 calm=6 splash=0 layers=.6 below=.3 volume=1 | swelling | gather | Free waves shaken as hard as they go, four seconds in the rising
Storm door opening | Quarrelling swells | shake=1 lag=2 foam=.9 circle=.5 depth=.45 unrest=1 drift=.8 calm=3 thickness=.2 layers=.5 below=.4 volume=0.5 | pressed | fifth | A rush of foam with a chord inside, up in a second | texture
Leaving the tunnel | Quarrelling swells | shake=.95 lag=2.5 depth=.8 circle=.9 thickness=.1 layers=.4 drift=.5 calm=4 foam=.1 below=.3 volume=5.5 | jet | shore | Wide bright light that arrives slowly and keeps shifting
Crane against cloud | Quarrelling swells | shake=.5 threshold=.2 lag=6 circle=.75 depth=.65 foam=.3 calm=8 drift=.1 thickness=.3 layers=.6 below=.2 reading=Height volume=5 | stretched | gather | Very slow free waves, grey, with a breath ahead of the tone
Before the curtain | Quarrelling swells | reading=Height shake=.8 lag=3 circle=.5 depth=.7 below=.5 thickness=.4 calm=2 drift=.4 foam=.1 layers=.1 volume=1.5 | follower | fifth | A dark rise of tall waves, half the pitch coming last
Dam in spring | Quarrelling swells | splash=.7 stone=1 foam=.5 lag=.4 circle=.5 depth=.4 drift=1 calm=4 width=1 layers=0 shake=.95 threshold=.1 thickness=.35 below=.35 volume=-3 | pressed | fifth | A boulder and a wall of foaming free waves | texture
Gravel lorry | Boulder | pool=Round foam=.6 unrest=1 splash=.7 stone=.6 shake=.7 threshold=.15 lag=.2 drift=2.5 calm=1.5 stray=.5 volume=5.5 | combo | mill | A heavy spray and rough quick waves | drum
Bath emptying | Quarrelling swells | splash=.6 stone=.5 drift=3.5 unrest=.9 circle=.4 depth=.5 foam=.4 lag=.15 calm=2 stray=1 layers=0 volume=6 | bathtub | drips | Gulping waves that turn faster than they can settle | texture
Surf on corrugated iron | Boulder | pool=Sea foam=.9 splash=.5 stone=.8 shake=.7 threshold=.15 unrest=.8 lag=.6 depth=.8 circle=.8 calm=3 below=.2 stray=.05 volume=4 | wornout | fifth | Wide waves and spray, rising and draining | texture
Thunder in a rowing boat | Boulder | below=.6 thickness=.5 splash=.35 foam=.5 shake=.8 threshold=.2 lag=.3 calm=6 drift=.4 depth=.5 stray=.75 volume=1.5 | pressed | toll | A dull boulder in a narrow pool and half the pitch rolling under, with spray | texture
Squabble on the stairs | Quarrelling swells | lag=.15 threshold=0 splash=.4 stone=.3 drift=3 calm=.4 circle=.5 depth=.5 foam=.05 thickness=.3 layers=.1 volume=2.5 | chamber | invention | Short keys, each caught at another moment of the quarrel | keys
Rusty fairground organ | Quarrelling swells | reading=Slope lag=.15 threshold=0 drift=2 calm=.3 circle=.5 depth=.3 foam=.15 unrest=.9 thickness=.3 layers=0 pattern=Hexagons volume=0.5 | transistor | hands | Leaning hexagons, uneven, quick to start and stop | organ
Kitchen radio failing | Quarrelling swells | reading=Height lag=.3 drift=.8 circle=.7 depth=.8 unrest=1 foam=.3 calm=.8 thickness=.45 width=.2 below=.25 volume=-2.5 | bedside | plain | Steep waves that crackle with breath and sink without warning
Washing line in April | Quarrelling swells | lag=.5 drift=.9 circle=.35 depth=.35 foam=.35 calm=1.5 unrest=.6 thickness=.2 layers=.4 volume=3 | driftape | two | Light free waves with wind in them, flapping | wind
Last guests leaving | Quarrelling swells | lag=.8 calm=10 circle=.4 depth=.3 drift=.3 unrest=.5 foam=.1 thickness=.5 stray=.4 layers=.05 below=.4 volume=-0.5 | evening | plain | Soft free waves that go on for seconds after each chord
`,
    },
    {
      id: 'pin-plucks',
      name: 'Pin plucks',
      category: 'plucked',
      rows: `
Needle through linen | Pin pluck | stone=.02 splash=.7 calm=.3 circle=.3 depth=.3 thickness=.45 layers=.6 volume=4.5 | bare | lute | The thinnest pins, a high drop and a short bright ring
Wire wool in rain | Pin pluck | stone=.08 splash=.9 thickness=.05 calm=1.2 layers=.8 circle=.6 volume=2 | tiles | lute | Pins in thin water with every fine ripple, wiry
Comb and tissue | Pin pluck | stone=.05 splash=.6 foam=.6 calm=.4 thickness=.3 circle=.7 depth=.6 stray=.6 layers=.5 volume=5 | thin | tenths | Pins with a puff of air on each
Sparrow feet on tin | Pin pluck | stone=.1 splash=1 thickness=.6 calm=.15 unrest=.5 reading=Height stray=.5 volume=6 | drips | drips | Dry pecks, over as soon as they land
Icicles along a barn | Pin pluck | stone=.03 splash=.8 thickness=0 calm=3 circle=.9 depth=.7 width=1 stray=.75 layers=0 volume=1.5 | brighthall | lute | Pins on the clearest water, wide apart, ringing
Calabash and gut | Pin pluck | reading=Height stone=.3 thickness=.6 splash=.8 shake=.5 threshold=.15 lag=.15 circle=.8 depth=.2 calm=.7 stray=.05 layers=.1 below=.1 foam=.35 volume=0.5 | clay | lute | Pebbles in thick water and a round tone with a puff of air
Porch in the evening | Pin pluck | reading=Slope stone=.35 thickness=.4 splash=.6 shake=.5 threshold=.15 lag=.2 circle=.8 depth=.35 calm=.8 pattern=Stripes below=.15 volume=0 | wood | lute | A pebble, then a hollow tone that stays a moment
Nylon by the fire | Pin pluck | reading=Height stone=.4 thickness=.7 splash=.5 shake=.5 threshold=.1 lag=.15 circle=.06 depth=.05 calm=.6 layers=0 stray=.5 below=.35 volume=-1.5 | mike | tenths | Soft, round, hardly a knock to it
Thumb on a tea chest | Pin pluck | reading=Height stone=.7 thickness=.6 splash=.8 shake=.4 threshold=.15 lag=.15 circle=.3 depth=.5 calm=.3 below=.4 layers=0 volume=-0.5 | console | mill | A heavy pebble and a low round note | bass
Taut fishing line | Pin pluck | reading=Height stone=.25 thickness=.2 splash=.7 shake=1 threshold=.85 lag=.15 circle=.8 depth=.8 calm=.5 stray=.15 layers=.6 pattern=Squares drift=.03 volume=0.5 | slap | lute | A small hard stone, and steep crossed crests when the key is firm
Cane in the current | Pin pluck | pattern=Stripes stone=.2 splash=.6 shake=.5 threshold=.1 lag=.2 circle=.9 depth=.4 calm=1 thickness=.2 stray=.2 layers=0 reading=Slope volume=0 | hall | lute | A small stone and one hollow wave
Bamboo in a row | Pin pluck | pattern=Stripes reading=Slope stone=.4 splash=.8 shake=.5 threshold=.15 lag=.15 circle=.75 depth=.3 calm=.3 thickness=.5 foam=.1 stray=.15 layers=.1 volume=-2.5 | pipe | tenths | Hollow tubes knocked, short and woody
Lamellae on a box | Pin pluck | pattern=Stripes reading=Caustic stone=.3 splash=.7 shake=.5 threshold=.1 lag=.15 circle=.9 depth=.9 calm=.7 drift=1.5 thickness=.25 stray=.5 layers=.5 volume=0.5 | trem 1.rate=2.5 | invention | Thumbed tongues that shake lightly as they ring
Slapped bass clarinet | Pin pluck | pattern=Stripes reading=Height stone=.5 splash=.7 shake=.5 threshold=.15 lag=.15 circle=.7 depth=.7 calm=.25 below=.9 thickness=.4 stray=.2 layers=.45 volume=1.5 | firm | mill | A slap, a hollow note, the octave under it | bass
Zither on a window sill | Pin pluck | pattern=Stripes reading=Caustic stone=.1 splash=.5 shake=.6 threshold=.1 lag=.15 circle=.7 depth=.6 calm=1.5 layers=.5 thickness=.15 volume=1 | lit | lute | Pins and hard striped light, ringing on
Koi rising | Pin pluck | shake=.5 threshold=.1 lag=.15 stone=.15 splash=.6 circle=.4 depth=.5 calm=.8 thickness=.3 drift=.8 layers=.7 below=.15 reading=Slope volume=1.5 | shallows | lute | A drop and a quick leaning hexagon over a little octave that bends as it goes
Terrace harp | Pin pluck | shake=.6 threshold=.1 lag=.25 stone=.12 splash=.4 circle=.25 depth=.3 calm=2 thickness=.25 layers=.4 below=.2 volume=-1 | sines | tenths | A light pin, and hexagons that ring for two seconds
Jam jar mallet | Pin pluck | shake=1 threshold=.9 lag=.15 stone=.55 splash=.7 circle=.5 depth=.6 calm=.4 thickness=.5 stray=.6 volume=1 | tamed | invention | A round low drop, and bright hexagons under hard keys, quickly damped
Paper in the strings | Pin pluck | shake=.5 threshold=.1 lag=.15 stone=.1 splash=.5 circle=.7 depth=.9 calm=.6 thickness=.35 foam=.45 stray=.6 layers=.75 volume=2.5 | cassette | lute | Buzzing light after a pin, some air in it
Harps in two rooms | Pin pluck | shake=.5 threshold=.1 lag=.2 stone=.2 splash=.5 circle=.4 depth=.35 calm=1.5 stray=.8 width=1 drift=.5 volume=-1.5 | bed | tenths | Wide wandering hexagons behind a small stone
Dice on slate | Pin pluck | pattern=Squares stone=.15 splash=.9 thickness=.3 calm=.3 circle=.6 depth=.6 stray=.6 volume=6 | alcove | drips | Clicks with a hard square ring, very short
Dulcimer under a tree | Pin pluck | pattern=Squares shake=.5 threshold=.1 lag=.15 stone=.12 splash=.6 circle=.4 depth=.3 calm=1.2 drift=1.2 thickness=.25 stray=.2 layers=0 below=.25 volume=5 | plate | lute | Struck wires: a pin, and squares that waver
Back desk pizzicato | Pin pluck | pattern=Squares reading=Height stone=.35 splash=.6 shake=.4 threshold=.1 lag=.15 circle=.5 depth=.4 calm=.2 thickness=.5 stray=.75 layers=0 below=.4 volume=4 | steps | hands | Dull short plucks with a round middle | string
Beads on an abacus | Alternate squares | shake=.45 threshold=.1 splash=.55 stone=.2 thickness=.5 calm=.25 drift=4 circle=.5 depth=.4 below=0 layers=.4 unrest=.05 width=.85 volume=3.5 | tamed | invention | Beads: a click, a trace of square, and done
Lattice of wires | Alternate squares | reading=Slope lag=.15 splash=.4 stone=.05 circle=.5 depth=.3 calm=1 thickness=.3 drift=2 layers=.3 below=0 shake=.95 threshold=.3 unrest=.45 width=.15 volume=1.5 | chorus | tenths | Leaning squares, thin, a pin at each
Lute in the wash house | Pin pluck | reading=Slope pattern=Stripes shake=.5 threshold=.1 lag=.15 stone=.2 splash=.4 circle=.85 depth=.5 calm=.5 thickness=.35 stray=.9 layers=.45 volume=1 | octave | lute | A leaning wave plucked, nasal and quick
Quills at low tide | Pin pluck | reading=Slope pattern=Free shake=.6 threshold=.1 lag=.15 stone=.05 splash=.4 circle=.7 depth=.3 calm=.4 thickness=.3 drift=3 volume=1 | chamber | invention | Six leaning waves with a pin, wiry | keys
Banjo on the pontoon | Pin pluck | reading=Slope pattern=Hexagons shake=.6 threshold=.1 lag=.15 stone=.3 splash=.6 circle=.4 depth=.6 calm=.2 thickness=.3 stray=.15 volume=-1.5 | springs | lute | A knock and a short twang of slopes
Sarangi plucked once | Pin pluck | reading=Slope pattern=Hexagons shake=.6 threshold=.1 lag=.3 stone=.15 splash=.3 circle=.8 depth=.4 calm=2.5 drift=.8 stray=.6 thickness=.3 below=.15 volume=-1.5 | strings | call | A light pin and a leaning tone that slides on
Spider's morse | Pin pluck | reading=Slope pattern=Squares stone=.03 splash=.8 thickness=.2 calm=.6 circle=.3 depth=.5 unrest=.6 drift=3 stray=.2 volume=6 | grains | drips | Threads: pins with a thin fluttering edge
Rain on small bells | Pin pluck | pattern=Eightfold stone=.06 splash=.7 thickness=.2 calm=1 circle=.3 depth=.3 layers=.4 volume=5 | rain | drips | Pins with a trace of eightfold ring
Frost cracking | Pin pluck | pattern=Eightfold reading=Height stone=.1 splash=1 thickness=.1 calm=.3 circle=.7 depth=.7 foam=.2 stray=.15 volume=4 | frost | drips | Sharp cracks, a breath of spray, hardly a tone
Celesta with gloves | Pin pluck | pattern=Eightfold reading=Height shake=.6 threshold=.1 lag=.15 stone=.2 splash=.4 circle=.15 depth=.2 calm=1 thickness=.55 stray=.2 below=.6 volume=-2 | felted | tenths | Soft plain keys with hardly an overtone, the octave under | keys
Plucked night sky | Pin pluck | pattern=Eightfold shake=.6 threshold=.1 lag=.6 stone=.05 splash=.6 circle=.2 depth=.35 calm=5 thickness=.3 drift=1 layers=.3 stray=.9 below=.3 volume=2 | stack | lute | A pin, then a high shimmer that stays in the air
Tines in a cold hand | Pin pluck | pattern=Eightfold shake=.5 threshold=.1 lag=.15 stone=.3 splash=.5 circle=.1 depth=.4 calm=.7 thickness=.4 below=.3 stray=.2 volume=6 | harmtrem | hands | A round knock, a plain note and a spark | keys
Water butt drum | Pin pluck | stone=.9 splash=1 thickness=.3 calm=.8 reading=Height circle=.2 layers=.75 volume=0.5 | well | mill | One great drop to each key, low and rolling | drum
Wet skin, dry stick | Pin pluck | stone=.6 splash=1 thickness=.75 calm=.2 foam=.5 reading=Height stray=.05 volume=6 | combo | mill | A thump with a slap of spray, very short | drum
Boulders by moonlight | Boulder | shake=.1 threshold=.6 pool=Round below=0 splash=1 calm=3 thickness=0 stray=.6 stone=.85 volume=2 | darkhall | toll | Boulders alone, their long low drops rising as they close | drum
Barrel and bung | Dripping cave | stone=.75 splash=.8 calm=.4 thickness=.5 width=.3 foam=.3 pool=Long stray=.6 layers=.15 volume=5 | cupboard | mill | Hollow low knocks from side to side | drum
Cave floor | Dripping cave | stone=.45 splash=1 calm=.8 unrest=.8 thickness=.2 stray=.05 volume=4.5 | dotted | drips | Middling stones that answer each other | drum
Guitar down a drain | Pin pluck | pool=Long shake=.6 threshold=.1 lag=.15 stone=.3 splash=.5 circle=.4 depth=.4 calm=.6 thickness=.55 stray=.75 layers=.15 below=.15 volume=0 | bedside | lute | A nasal channel plucked, tipping sideways as it rings
Canoe on the rocks | Pin pluck | pool=Long stone=.65 splash=.9 thickness=.5 shake=.4 threshold=.15 lag=.2 pattern=Stripes circle=.5 depth=.5 calm=.7 below=.5 stray=.5 volume=4.5 | stairs | mill | A hull knocked: hollow, with an octave under | bass
Wet mouth harp | Throat of water | threshold=0 lag=.15 splash=.4 stone=.1 circle=.7 depth=.6 drift=2 calm=.4 foam=.05 thickness=.5 unrest=.45 volume=6 | wah | lute | Twangs that change vowel as they ring
Harp on the groyne | Pin pluck | pool=Sea shake=.6 threshold=.1 lag=.2 stone=.15 splash=.6 circle=.4 depth=.4 calm=2 thickness=.2 foam=.1 stray=.9 layers=.05 below=.4 volume=-0.5 | surf | lute | Plucked on the tide, louder and softer with it
Sinking lantern | Pin pluck | pool=Sea pattern=Stripes stone=.5 splash=.8 shake=.5 threshold=.15 lag=1 circle=.3 depth=.4 calm=4 thickness=.4 stray=.5 layers=.05 below=.4 volume=0.5 | melt | arch | A dull stone, and a round sea tone that comes after
Pluck and patience | Pin pluck | shake=.7 threshold=.15 lag=1.5 stone=.1 splash=.9 circle=.4 depth=.4 calm=3 thickness=.2 below=.35 volume=3 | mirror | star | A pin, a breath of nothing, and then the figure swells
Bell pull | Pin pluck | pattern=Squares shake=.5 threshold=.15 lag=.5 stone=.25 splash=.8 circle=.3 depth=.3 calm=4 thickness=.2 drift=.03 stray=.75 below=.35 volume=4 | afterimage | call | A small stone and slow squares behind it
Coins for the ferry | Pin pluck | stone=.12 splash=1 thickness=.1 calm=2 unrest=.7 circle=.5 width=1 layers=.4 stray=.9 volume=2 | held | drips | Bright drops whose beads keep falling
Kora in the stairwell | Pin pluck | pattern=Hexagons reading=Height shake=.5 threshold=.1 lag=.15 stone=.2 splash=.6 circle=.5 depth=.5 calm=1.2 thickness=.3 layers=.3 below=.3 volume=3.5 | heads | lute | Round plucked hexagons, a light stone on each
Six strings, one wet | Pin pluck | pattern=Free shake=.5 threshold=.1 lag=.15 stone=.25 splash=.6 circle=.5 depth=.4 calm=.8 unrest=.6 thickness=.35 drift=1 stray=.2 layers=.75 below=.3 volume=3.5 | warmecho | lute | Free waves, so each pluck has another colour
`,
    },
    {
      id: 'throats-of-water',
      name: 'Throats of water',
      category: 'voice',
      rows: `
Singer in the spillway | Throat of water | circle=.4 depth=.35 foam=.15 thickness=.4 lag=.4 drift=.3 shake=.8 threshold=.05 unrest=.45 stone=.6 volume=2.5 | bare | arch | Stripes leaning in a channel, one vowel that slides a little
Wide open vowel | Throat of water | circle=.9 depth=.7 drift=.6 stray=.8 foam=.2 thickness=.45 lag=.6 calm=2 layers=.45 stone=.85 below=.15 volume=6 | stairs | call | A wide channel, its vowel opening and closing as it wanders
Humming with a mouthful | Throat of water | circle=.25 depth=.2 thickness=.8 foam=.1 lag=.5 drift=.4 calm=.8 width=.2 shake=.5 threshold=.1 layers=0 unrest=.1 stone=.85 below=.2 volume=3.5 | muffled | chant | A shut vowel in thick water, narrow and plain
Yodel under the weir | Throat of water | circle=.6 depth=.5 drift=2.5 unrest=.6 foam=.2 thickness=.45 lag=.2 splash=.35 stone=.2 shake=.9 threshold=.3 layers=0 volume=4.5 | valley | call | A voice that breaks between two vowels, a splash on each
Operatic pipework | Throat of water | circle=.9 depth=.55 unrest=.1 stray=.1 drift=.2 thickness=.5 shake=.9 lag=1.2 foam=.05 layers=.1 splash=.03 volume=4 | hall | arch | A firm channel vowel, slow to rise and then held
Chapter house hum | Throat of water | pattern=Hexagons reading=Height circle=.4 depth=.3 foam=.2 thickness=.6 lag=1.2 calm=3 splash=.03 shake=.8 threshold=.5 unrest=0 below=.4 volume=-1 | nave | shore | Hexagons hummed in a channel, dark and even
Lullaby through a wall | Throat of water | pattern=Hexagons reading=Height circle=.2 depth=.15 thickness=.7 foam=.35 lag=.8 drift=.2 calm=2 shake=1 threshold=.4 stone=.2 below=.3 volume=2.5 | cupboard | ties | A small soft hum with breath on it
Altos in wool | Throat of water | pattern=Hexagons circle=.5 depth=.3 foam=.25 thickness=.6 lag=.9 drift=.5 stray=.6 shake=.8 threshold=.1 layers=.45 unrest=.65 below=.1 volume=-0.5 | blurred | shore | Leaning hexagons, a reedy ah made of many
Rehearsal, half of them | Throat of water | pattern=Hexagons reading=Caustic circle=.3 depth=.3 foam=.15 thickness=.65 lag=1 unrest=.6 drift=.4 shake=.75 threshold=.35 layers=.15 stone=.15 below=.15 | chamber | plain | A bright narrow vowel, voices coming in unevenly
Vespers, doors open | Throat of water | pattern=Hexagons reading=Height circle=.7 depth=.5 foam=.3 thickness=.45 lag=1.8 stray=.7 drift=.15 calm=5 width=.8 layers=.05 stone=.7 below=.4 volume=-3 | latehall | gather | A wide slow hum that takes two seconds, opening from inside
Square mouths | Throat of water | pattern=Squares circle=.4 depth=.3 thickness=.7 foam=.2 lag=.6 drift=1 shake=1 threshold=.35 stone=.15 below=.1 volume=4 | vowel | chant | Crossed waves in a channel that say two vowels by turns
Ventriloquist's lake | Throat of water | pattern=Squares reading=Height circle=.6 depth=.5 thickness=.6 drift=.4 foam=.1 lag=.8 unrest=.5 calm=1.5 shake=.7 threshold=.05 layers=.15 below=.25 volume=1 | panned | arch | A hollow vowel that is now in front and now behind
Question with no mark | Throat of water | pattern=Squares circle=.2 depth=.2 thickness=.75 drift=2 foam=.3 lag=.2 splash=.3 stone=.4 calm=.5 shake=.45 threshold=.15 layers=.05 unrest=.45 volume=6 | alcove | call | Short dull syllables that tip upward
Waulking song | Throat of water | pattern=Squares reading=Caustic circle=.5 depth=.4 thickness=.7 drift=1.5 lag=.25 foam=.1 splash=.5 stone=.7 calm=.5 shake=.85 threshold=.15 unrest=.45 volume=3.5 | tiles | hands | A thump and a nasal chord at each beat
Two throats in one | Throat of water | pattern=Squares below=.7 reading=Height circle=.4 depth=.5 thickness=.6 drift=.3 lag=1 foam=.1 calm=2 shake=.75 threshold=.25 unrest=.45 volume=2.5 | overtones | chant | Squares over their lower octave, one growling and one clear
Waiting room murmurs | Throat of water | pattern=Free circle=.4 depth=.25 unrest=.8 drift=.8 foam=.4 thickness=.6 lag=.6 shake=.75 threshold=0 layers=.1 stone=.6 below=.15 volume=2 | downhall | plain | Six soft voices that never say the same thing at once
Auction in fog | Throat of water | pattern=Free circle=.6 depth=.5 unrest=.9 drift=3 thickness=.6 lag=.2 foam=.2 calm=.5 shake=.95 threshold=.1 stone=.2 volume=6 | bank | hands | Quick wet syllables, jostling
Pumping house ghosts | Throat of water | pattern=Free reading=Height circle=.5 depth=.4 unrest=.7 drift=.2 foam=.5 thickness=.5 lag=2 calm=6 shake=.8 threshold=0 layers=.15 stone=.15 below=.4 volume=1 | swelling | gather | Slow hollow breath that gathers into voices
Mutter on the bench | Throat of water | pattern=Free reading=Height circle=.25 depth=.3 unrest=.6 drift=.5 thickness=.8 below=.4 lag=.5 foam=.1 calm=1 shake=1 threshold=.25 layers=.15 stone=.15 volume=4 | reel | chant | Thick low mutter, an octave half awake
Congress of frogs | Throat of water | pattern=Free circle=.7 depth=.6 unrest=1 drift=4 thickness=.6 lag=.15 splash=.6 stone=.3 calm=.3 foam=0 volume=6 | drips | drips | Croaks: a plop and a nasal burst, each its own | texture
Vowel on the tiles | Throat of water | pool=Round circle=.85 depth=.4 foam=.2 lag=.4 calm=1 thickness=.3 shake=.9 threshold=.25 layers=0 unrest=.15 stone=.6 volume=4 | tiles | arch | A leaning stripe in a round pool, open and hollow
Countertenor in January | Throat of water | pool=Round circle=.75 depth=.3 foam=.3 drift=.8 unrest=.2 thickness=.4 lag=.5 calm=1.2 shake=.45 threshold=0 stone=.85 layers=0 volume=1.5 | brighthall | arch | A thin lean with breath, high in itself
Keening across the bay | Throat of water | pool=Round pattern=Hexagons circle=.6 depth=.3 drift=1 stray=.8 unrest=.7 foam=.25 lag=.4 calm=2 shake=.9 threshold=0 stone=.05 below=.1 volume=3 | farshore | call | Leaning hexagons that slide and break
Nasal and proud | Throat of water | pool=Round circle=.7 depth=.55 foam=.05 drift=.3 thickness=.3 lag=.2 calm=.5 splash=.1 shake=.7 threshold=.15 layers=.1 unrest=.2 pattern=Hexagons volume=-5 | hotvalve | arch | Folded slopes of hexagons, hard in the nose
Sung ovation | Throat of water | pool=Round pattern=Free circle=.4 depth=.3 foam=.5 unrest=.7 drift=1.2 lag=.5 calm=1.5 thickness=.35 shake=.85 threshold=.5 below=.15 volume=0 | flock | hands | Six leaning voices and much breath, all a little late
Whispered into tiles | Throat of water | foam=1 circle=.3 depth=.2 thickness=.5 lag=.5 drift=.5 calm=1.5 shake=.45 threshold=0 layers=.15 stone=.5 volume=4.5 | haze | arch | Breath first, a vowel only just in it
Secret in a shell | Throat of water | foam=.9 reading=Height pattern=Hexagons circle=.5 depth=.3 thickness=.4 lag=.8 drift=.3 unrest=.5 calm=2 layers=0 below=.35 volume=3 | tube | lone | Air that hums inside a narrow space
Sleepers in a dormitory | Throat of water | foam=.8 pattern=Free reading=Height drift=.15 unrest=.8 lag=1.5 circle=.3 depth=.2 thickness=.6 calm=4 shake=.4 threshold=0 stone=.05 below=.4 volume=3.5 | sigh | shore | Slow breath, each sleeper rising and sinking alone | texture
Steam said something | Throat of water | foam=.9 circle=.6 depth=.5 drift=2 splash=.5 stone=.2 lag=.2 calm=.6 thickness=.35 shake=.45 threshold=.15 unrest=.65 volume=6 | hiss | call | A hiss with a quick vowel turning in it
Candles blown out | Throat of water | foam=1 pattern=Squares thickness=.7 lag=.2 calm=.3 splash=.2 stone=.15 circle=.4 depth=.3 drift=1.5 shake=.55 threshold=.25 layers=.15 unrest=.45 volume=5.5 | bowed | hands | Puffs of air that leave a trace of pitch
Basses on a stone floor | Throat of water | below=.9 reading=Height circle=.4 depth=.4 foam=.15 thickness=.55 lag=.8 drift=.2 calm=2 splash=.05 unrest=.05 volume=4.5 | lowvault | chant | A low hollow vowel with its octave at full
Two note throat song | Throat of water | below=.6 circle=.8 depth=.6 drift=.5 stray=.7 thickness=.45 lag=.5 foam=.05 shake=.5 threshold=.25 layers=.45 stone=.05 volume=0.5 | overtones 2.mix=0.08 | fifth | Half the pitch as a floor, a whistling vowel moving over it
Den in deep winter | Throat of water | below=1 pattern=Free circle=.5 depth=.4 foam=.5 drift=.2 unrest=.8 thickness=.7 lag=1 calm=2 shake=.8 threshold=.05 stone=.15 volume=1.5 | drum | fifth | Low snores of free waves, breath and octave | bass
Father on the stairs | Throat of water | below=.8 pattern=Squares circle=.3 depth=.3 thickness=.75 lag=.3 drift=.8 stone=.9 splash=.4 calm=.6 layers=0 volume=6 | darkplate | stride | A heavy foot, a dull vowel and its octave at each note | bass
Ferryman's chorus | Throat of water | below=.5 pattern=Hexagons reading=Height circle=.5 depth=.6 thickness=.5 foam=.2 lag=1.2 drift=.3 calm=3 shake=.85 threshold=.1 unrest=.15 stone=.85 volume=3.5 | under | ground | Dark hummed hexagons, an octave waking late
Treble in a tiled hall | Throat of water | reading=Height circle=.12 depth=.1 foam=.25 thickness=.35 lag=.4 drift=.6 calm=1.5 shake=.95 threshold=.3 layers=.45 unrest=.15 stone=.05 volume=3 | brightplate | star | A channel read on a tiny circle, clear and thin
Small descant | Throat of water | reading=Caustic circle=.2 depth=.2 thickness=.6 foam=.1 drift=1.5 lag=.2 calm=.8 shake=.45 threshold=.05 stone=.7 volume=3 | shimmer | call | Small, bright, quick to move
Narrow soprano | Throat of water | reading=Caustic pattern=Hexagons circle=.3 depth=.5 thickness=.6 foam=.05 lag=.7 drift=.4 stray=.3 calm=2 shake=.8 threshold=.4 layers=.15 unrest=.65 stone=.6 volume=1 | fan | star | A hard narrow vowel that hangs
Child under a bridge | Throat of water | reading=Height pattern=Squares circle=.3 depth=.25 thickness=.5 lag=.2 splash=.4 stone=.2 calm=.8 foam=.2 shake=.95 threshold=.1 layers=0 unrest=.65 volume=4.5 | clean | call | A small hollow call, a pebble with each
Angels in the cistern | Throat of water | reading=Slope circle=.4 depth=.4 foam=.4 thickness=.5 lag=1.2 drift=.2 unrest=.5 calm=7 width=.9 shake=.45 threshold=0 layers=.45 stone=.7 volume=-5 | frozen | gather | Slow narrow vowels with some breath, high and wide
Off season sirens | Throat of water | pool=Sea circle=.5 depth=.4 foam=.3 drift=.4 stray=.8 lag=1 calm=4 thickness=.3 shake=.8 threshold=0 layers=0 below=.15 volume=3 | swells | two | Leaning voices on the tide, drawn out
Choir on a lightship | Throat of water | pool=Sea pattern=Hexagons reading=Height circle=.6 depth=.5 foam=.6 lag=1.5 thickness=.4 calm=5 drift=.2 unrest=.05 stone=.6 below=.4 volume=-1.5 | open | shore | Dark hummed hexagons that come and go every three seconds
Shanty after midnight | Throat of water | pool=Sea pattern=Free circle=.4 depth=.5 foam=.2 below=.5 drift=.6 lag=.4 calm=1 thickness=.45 unrest=.7 layers=.1 stone=.05 volume=2.5 | record | ground | Rough leaning voices on a swell, some octave under
Names called from a raft | Throat of water | pool=Sea pattern=Squares circle=.5 depth=.35 foam=.3 drift=1.2 lag=.3 splash=.4 stone=.5 calm=1.5 shake=.7 threshold=.05 below=.2 volume=3 | halfspeed | call | Short far voices, a dull splash at each
Mist that sings | Throat of water | pool=Sea reading=Height circle=.3 depth=.25 foam=.8 lag=2 drift=.1 calm=8 stray=.6 unrest=.5 width=1 shake=.4 threshold=.15 layers=.1 stone=.6 below=.35 volume=3 | mist | gather | Foam and a plain tone inside, surging slowly | pad
Mynah learns a word | Throat of water | circle=.5 depth=.6 drift=5 unrest=.4 lag=.15 splash=.3 stone=.1 calm=.25 thickness=.5 foam=0 shake=.85 threshold=.25 layers=.15 volume=4 | tiny | invention | Quick nasal syllables, high in the mouth
Drain says goodnight | Throat of water | circle=.8 depth=.8 drift=1.5 splash=.8 stone=.7 lag=.2 calm=1.2 thickness=.5 foam=.1 stray=1 shake=.95 threshold=.3 layers=.45 volume=2.5 | bathtub | drips | A gulp and a vowel that goes down the pipe | texture
Newsreader next door | Throat of water | circle=.35 depth=.3 drift=3 unrest=.8 stray=.6 thickness=.65 lag=.2 foam=.15 calm=.4 shake=.9 threshold=.3 layers=.45 stone=.2 volume=1.5 | stream | hands | Quick uneven talk with no words to it
Baby and kettle | Throat of water | reading=Caustic pattern=Stripes circle=.4 depth=.4 foam=.4 drift=1.8 thickness=.6 lag=.3 splash=.2 stone=.05 calm=.8 shake=.45 threshold=0 layers=.1 unrest=.45 volume=5.5 | parlour | call | A bright cry with steam round it
Same tune, other mouth | Throat of water | reading=Slope pattern=Stripes circle=.55 depth=.25 lag=.25 calm=.7 foam=.2 drift=.4 thickness=.5 shake=.55 threshold=.05 stone=.5 volume=5.5 | shadow | arch | A plain leaning vowel, quick to answer
`,
    },
  ],
}
