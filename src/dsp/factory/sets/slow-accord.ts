import { type InstrumentSet } from './set'

// The set of Slow Accord. A direction is one way metal comes to agree with a
// chord, or declines to; in each are ten families of five. A family is a metal,
// a goal and a pace of its own, and its five differ in register, in touch and
// in what their chain is for. Effects that add pitches keep to octaves.

export const SET: InstrumentSet = {
  device: 'slow-accord',
  names: {
    material: ['Bar', 'Plate', 'Bell', 'Stretched', 'Squeezed', 'Scattered'],
    goal: ['Chord', 'Own series', 'Octaves', 'Bass series'],
  },
  // prettier-ignore
  chains: {
    // Near: colour, width and the smallest rooms.
    bare: { effects: [{ deviceId: 'ambient-eq', preset: 'Open' }], words: ', with nothing round it' },
    warm: { effects: [{ deviceId: 'ambient-eq', preset: 'Warm' }], words: ', close and warm' },
    shade: { effects: [{ deviceId: 'ambient-eq', preset: 'Shaded' }, { deviceId: 'stereo-widener', preset: 'Gently wide' }], words: ', dry, with the top shaded' },
    hollow: { effects: [{ deviceId: 'ambient-eq', preset: 'Hollow' }, { deviceId: 'spread', preset: 'Wide but safe' }], words: ', dry and scooped' },
    thin: { effects: [{ deviceId: 'ambient-eq', preset: 'Thin' }], words: ', thin and dry' },
    firm: { effects: [{ deviceId: 'spread', preset: 'Firm bass' }, { deviceId: 'ambient-comp', preset: 'Glue' }], words: ', held firm and dry' },
    airy: { effects: [{ deviceId: 'spread', preset: 'Firm and airy' }], words: ', dry and open at the top' },
    centre: { effects: [{ deviceId: 'stereo-widener', preset: 'Narrow' }, { deviceId: 'ambient-comp', preset: 'Keys' }], words: ', dry, in the middle' },
    mike: { effects: [{ deviceId: 'distance', preset: 'Close mic' }], words: ', right at the microphone' },
    steps: { effects: [{ deviceId: 'distance', preset: 'A few steps back' }], words: ', a few steps away' },
    booth: { effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.22 } }], words: ', in a small booth' },
    chamber: { effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber' }], words: ', in a tight chamber' },
    tight: { effects: [{ deviceId: 'plate-reverb', preset: 'Tight room' }], words: ', before a short plate' },
    room: { effects: [{ deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } }], words: ', in a small dark room' },
    parlour: { effects: [{ deviceId: 'ether-reverb', preset: 'Room' }, { deviceId: 'ambient-eq', preset: 'Warm' }], words: ', in a warm room' },
    console: { effects: [{ deviceId: 'analog-drive', preset: 'Console' }], words: ', through a console' },
    iron: { effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }, { deviceId: 'spread', preset: 'Firm bass' }], words: ', with iron in the lows' },
    valve: { effects: [{ deviceId: 'saturator', preset: 'Tube preamp' }, { deviceId: 'ambient-eq', preset: 'Shaded' }], words: ', through a warm valve' },
    reel: { effects: [{ deviceId: 'tape', preset: 'Quarter inch' }], words: ', on quarter inch tape' },
    blanket: { effects: [{ deviceId: 'tape', preset: 'Under a blanket' }], words: ', on tape, as under a blanket' },
    thick: { effects: [{ deviceId: 'stereo-detune', preset: 'Thickener' }], words: ', dry and thickened' },
    halo: { effects: [{ deviceId: 'stereo-detune', preset: 'Soft halo' }, { deviceId: 'ether-reverb', preset: 'Faint air' }], words: ', in a thin halo' },
    felt: { effects: [{ deviceId: 'sift', preset: 'Soft hammers' }], words: ', with the strokes softened, dry' },
    wood: { effects: [{ deviceId: 'vessel', preset: 'Hint of wood' }], words: ', in a thin wooden body' },
    tin: { effects: [{ deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.4 } }, { deviceId: 'ambient-eq', preset: 'Warm' }], words: ', inside a small tin' },
    pillow: { effects: [{ deviceId: 're-amp', preset: 'Pillow speaker' }], words: ', out of a pillow speaker' },
    drawn: { effects: [{ deviceId: 'ambient-comp', preset: 'Raise the quiet' }, { deviceId: 'plate-reverb', preset: 'Small plate' }], words: ', brought up close before a plate' },
    pressed: { effects: [{ deviceId: 'fet-limiter', preset: 'Gentle lift', params: { inputGain: 12 } }, { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } }], words: ', pressed forward in a room' },
    // Worn and driven.
    combo: { effects: [{ deviceId: 're-amp', preset: 'Combo in a room' }], words: ', from a small amplifier in a room' },
    stack: { effects: [{ deviceId: 're-amp', preset: 'Warm stack' }, { deviceId: 'ambient-comp', preset: 'Glue' }], words: ', through a warm amplifier' },
    downhall: { effects: [{ deviceId: 're-amp', preset: 'Down the hall' }], words: ', from a speaker down the hall' },
    triode: { effects: [{ deviceId: 'analog-drive', preset: 'Triode glow' }, { deviceId: 'plate-reverb', preset: 'Small plate' }], words: ', glowing a little before a plate' },
    cassette: { effects: [{ deviceId: 'patina', preset: 'Worn cassette' }], words: ', on a worn cassette' },
    record: { effects: [{ deviceId: 'vinyl', preset: 'Dull stylus' }, { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } }], words: ', off a record in a room' },
    pressing: { effects: [{ deviceId: 'vinyl', preset: 'New pressing' }], words: ', on a new pressing' },
    worn: { effects: [{ deviceId: 'tape', preset: 'Worn thin' }, { deviceId: 'hall-reverb', preset: 'Room' }], words: ', worn thin on tape in a room' },
    drifttape: { effects: [{ deviceId: 'tape', preset: 'Drifting chorus' }, { deviceId: 'spread', preset: 'Wide pad' }], words: ', drifting on two tapes' },
    sampler: { effects: [{ deviceId: 'vintage-digital', preset: 'Glaze' }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', glazed by an old sampler' },
    hiss: { effects: [{ deviceId: 'noise-floor', preset: 'Faint hiss' }, { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.22 } }], words: ', in faint hiss and a dark plate' },
    transistor: { effects: [{ deviceId: 'radio', preset: 'Clean transistor', params: { mix: 0.7 } }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', from a small radio in a room' },
    watery: { effects: [{ deviceId: 'low-bitrate', preset: 'Watery trace' }, { deviceId: 'spread', preset: 'Hazy edges' }], words: ', with a watery trace' },
    // Movement.
    chorale: { effects: [{ deviceId: 'rotary', preset: 'Chorale', params: { mix: 0.7 } }], words: ', behind slow turning horns' },
    turning: { effects: [{ deviceId: 'rotary', preset: 'Dark drum' }, { deviceId: 'hall-reverb', preset: 'Room' }], words: ', on a dark turning drum' },
    amptrem: { effects: [{ deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.4 } }, { deviceId: 'spring-reverb', preset: 'Hint of spring' }], words: ', pulsing before a spring' },
    harmtrem: { effects: [{ deviceId: 'tremolo', preset: 'Harmonic shimmer' }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', swaying from dark to bright' },
    pan: { effects: [{ deviceId: 'tremolo', preset: 'Slow pan' }], words: ', dry, from side to side' },
    chorus: { effects: [{ deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.35 } }], words: ', in a slow chorus' },
    ensemble: { effects: [{ deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.4 } }, { deviceId: 'hall-reverb', preset: 'Room' }], words: ', in a deep ensemble' },
    vibrato: { effects: [{ deviceId: 'late-vibrato', preset: 'Slow bow' }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', with a late sway' },
    swirl: { effects: [{ deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } }, { deviceId: 'plate-reverb', preset: 'Small plate' }], words: ', through a slow phaser' },
    glacial: { effects: [{ deviceId: 'phaser', preset: 'Glacial sweep', params: { mix: 0.4 } }, { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } }], words: ', swept very slowly in a hall' },
    sweep: { effects: [{ deviceId: 'flanger', preset: 'Gentle sweep', params: { mix: 0.35 } }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', gently flanged' },
    lowpass: { effects: [{ deviceId: 'auto-filter', preset: 'Glacial low-pass', params: { mix: 0.8 } }, { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } }], words: ', under a filter that moves slowly' },
    bloomlp: { effects: [{ deviceId: 'auto-filter', preset: 'Soft bloom' }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', opened by the level' },
    notch: { effects: [{ deviceId: 'auto-filter', preset: 'Slow notch' }, { deviceId: 'hall-reverb', preset: 'Faint halo' }], words: ', with a slow notch going through' },
    water: { effects: [{ deviceId: 'currents', preset: 'Slow water' }, { deviceId: 'hall-reverb', preset: 'Room' }], words: ', moving like slow water' },
    ripples: { effects: [{ deviceId: 'currents', preset: 'Ripples' }, { deviceId: 'plate-reverb', preset: 'Faint sheen' }], words: ', rippling band by band' },
    onwater: { effects: [{ deviceId: 'glimmer', preset: 'Light on water' }, { deviceId: 'ether-reverb', preset: 'Faint air' }], words: ', each tone flickering' },
    fallripple: { effects: [{ deviceId: 'glimmer', preset: 'Falling ripple' }, { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.25 } }], words: ', rippling downward in a hall' },
    throb: { effects: [{ deviceId: 'pulses', preset: 'Soft throb' }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', softly throbbing' },
    stitches: { effects: [{ deviceId: 'pulses', preset: 'Loose stitches' }, { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.22 } }], words: ', gated in loose stitches' },
    sigh: { effects: [{ deviceId: 'breath', preset: 'Calm breath', params: { air: 0.1 } }, { deviceId: 'fdn-reverb', preset: 'Room' }], words: ', breathing in and out' },
    wander: { effects: [{ deviceId: 'around', preset: 'Slow wander' }, { deviceId: 'ether-reverb', preset: 'Faint air' }], words: ', wandering round the head' },
    flock: { effects: [{ deviceId: 'murmuration', preset: 'Evening flock', params: { mix: 0.4 } }], words: ', in a loose flock' },
    swell: { effects: [{ deviceId: 'swell', preset: 'Soft pick' }, { deviceId: 'hall-reverb', preset: 'Faint halo' }], words: ', with the front taken off' },
    // Echoes.
    darkecho: { effects: [{ deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.28 } }], words: ', with dark echoes' },
    clean: { effects: [{ deviceId: 'analog-delay', preset: 'Clean echo', params: { mix: 0.25 } }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', with clean echoes in a room' },
    warmecho: { effects: [{ deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.28 } }], words: ', with warm tape repeats' },
    heads: { effects: [{ deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } }, { deviceId: 'plate-reverb', preset: 'Small plate' }], words: ', answered by three tape heads' },
    trail: { effects: [{ deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.3 } }, { deviceId: 'fdn-reverb', preset: 'Thin veil' }], words: ', leaving a long dark trail' },
    stars: { effects: [{ deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.32 } }, { deviceId: 'plate-reverb', preset: 'Faint sheen' }], words: ', in seven scattered echoes' },
    darkfield: { effects: [{ deviceId: 'constellation', preset: 'Dark field', params: { mix: 0.4 } }], words: ', in a dark field of echoes' },
    canon: { effects: [{ deviceId: 'canon', preset: 'Octave shadow' }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', followed at the octave' },
    pebble: { effects: [{ deviceId: 'skipping-stone', preset: 'Soft pebble' }, { deviceId: 'hall-reverb', preset: 'Faint halo' }], words: ', with echoes skipping off' },
    slowing: { effects: [{ deviceId: 'skipping-stone', preset: 'Slowing bounces' }], words: ', with echoes that slow down' },
    fan: { effects: [{ deviceId: 'prism', preset: 'Low to high', params: { mix: 0.4 } }], words: ', unfolding from low to high' },
    mirror: { effects: [{ deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.35 } }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', with backward swells behind' },
    moons: { effects: [{ deviceId: 'orbits', preset: 'Two voices', params: { mix: 0.35 } }, { deviceId: 'ether-reverb', preset: 'Faint air' }], words: ', over two unequal loops' },
    recall: { effects: [{ deviceId: 'echo-memory', preset: 'Recalling', params: { mix: 0.32 } }], words: ', with moments that come back' },
    loop: { effects: [{ deviceId: 'tape-loop', preset: 'Faint afterimage', params: { mix: 0.25 } }, { deviceId: 'tape', preset: 'Clean transfer' }], words: ', over a fading tape loop' },
    graindelay: { effects: [{ deviceId: 'grain-delay', preset: 'Plain repeat' }, { deviceId: 'hall-reverb', preset: 'Faint halo' }], words: ', with grainy repeats' },
    // Rooms, plates and halls.
    plate: { effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.28 } }], words: ', on a plate' },
    darkplate: { effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.35 } }, { deviceId: 'ambient-eq', preset: 'Warm' }], words: ', on a dark plate' },
    spring: { effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.28 } }], words: ', in front of long springs' },
    hall: { effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }], words: ', in a hall' },
    nave: { effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.35 } }], words: ', in a stone nave' },
    undertow: { effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.33 } }], words: ', over a warm undertow' },
    darkhall: { effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.35 } }, { deviceId: 'spread', preset: 'Hazy edges' }], words: ', in a dark hall' },
    brighthall: { effects: [{ deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.25 } }], words: ', in a bright hall' },
    stairs: { effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }], words: ', in a stone stairwell' },
    shore: { effects: [{ deviceId: 'distance', preset: 'Far shore' }, { deviceId: 'ambient-comp', preset: 'Lift' }], words: ', from a far shore' },
    late: { effects: [{ deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.32 } }], words: ', before a late hall' },
    valley: { effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.35 } }], words: ', across an open valley' },
    cave: { effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.35 } }], words: ', in a dark cave' },
    tides: { effects: [{ deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.4 } }], words: ', in a hall that breathes' },
    space: { effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } }], words: ', in a wide open space' },
    thinair: { effects: [{ deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.35 } }], words: ', under thin bright air' },
    crypt: { effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.35 } }, { deviceId: 'spread', preset: 'Firm bass' }], words: ', in a huge low crypt' },
    bloom: { effects: [{ deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.4 } }], words: ', in a room that blooms' },
    reverse: { effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.35 } }], words: ', with a tail that swells' },
    glinting: { effects: [{ deviceId: 'swarm-reverb', preset: 'Glinting', params: { mix: 0.3 } }], words: ', in a glinting cavern' },
    cistern: { effects: [{ deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.45 } }, { deviceId: 'ambient-eq', preset: 'Layer' }], words: ', inside a cistern' },
    haze: { effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.35 } }], words: ', in a woollen haze' },
    choirhall: { effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.35 } }], words: ', in a hall that sings' },
    monks: { effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.35 } }], words: ', before low humming voices' },
    strings: { effects: [{ deviceId: 'sympathetic', preset: 'Follow the tune', params: { mix: 0.35 } }], words: ', waking strings near by' },
    open: { effects: [{ deviceId: 'silent-keys', preset: 'Open fifth and bass', params: { mix: 0.35 } }], words: ', over an open fifth of strings' },
    // Clouds, blur, pitch and dust.
    glimmer: { effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.22 } }], words: ', with octave light far behind' },
    rising: { effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.3 } }, { deviceId: 'ambient-eq', preset: 'Layer' }], words: ', with a tail that climbs' },
    below: { effects: [{ deviceId: 'shimmer', preset: 'Low shadow', params: { mix: 0.25 } }], words: ', with a low shadow' },
    octhalo: { effects: [{ deviceId: 'bloom-reverb', preset: 'Octave halo', params: { mix: 0.3 } }], words: ', in an octave halo' },
    ascent: { effects: [{ deviceId: 'spiral', preset: 'Faint lift', params: { mix: 0.25 } }, { deviceId: 'ether-reverb', preset: 'Faint air' }], words: ', under a faint climbing tail' },
    melt: { effects: [{ deviceId: 'melt', preset: 'Soft sag' }], words: ', with a softly sagging tail' },
    fog: { effects: [{ deviceId: 'fog', preset: 'Soft cloud', params: { mix: 0.5 } }], words: ', blurred to a soft cloud' },
    glass: { effects: [{ deviceId: 'fog', preset: 'Behind glass', params: { mix: 0.6 } }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', as if behind glass' },
    blur: { effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.35 } }], words: ', in hanging mist' },
    darkwater: { effects: [{ deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.45 } }], words: ', smeared into dark water' },
    cloud: { effects: [{ deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.35 } }, { deviceId: 'ether-reverb', preset: 'Faint air' }], words: ', in a cloud of grains' },
    rain: { effects: [{ deviceId: 'grain-cloud', preset: 'Octave rain', params: { mix: 0.3 } }, { deviceId: 'hall-reverb', preset: 'Faint halo' }], words: ', under a rain of octaves' },
    sustain: { effects: [{ deviceId: 'sustainer', preset: 'Thin halo', params: { mix: 0.3 } }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', with the chord held behind' },
    freeze: { effects: [{ deviceId: 'sustainer', preset: 'Frozen moment', params: { mix: 0.35 } }, { deviceId: 'ambient-eq', preset: 'Layer' }], words: ', over a frozen moment' },
    stretch: { effects: [{ deviceId: 'stretch', preset: 'Near shadow' }], words: ', before a stretched shadow' },
    sparks: { effects: [{ deviceId: 'glints', preset: 'First light' }, { deviceId: 'ether-reverb', preset: 'Faint air' }], words: ', with sparks off the top' },
    dust: { effects: [{ deviceId: 'glints', preset: 'Faint dust', params: { mix: 0.18 } }, { deviceId: 'plate-reverb', preset: 'Small plate' }], words: ', in faint bright dust' },
    cascade: { effects: [{ deviceId: 'cascade', preset: 'Sparkle bed', params: { mix: 0.25 } }], words: ', with a sparkling bed' },
    leaves: { effects: [{ deviceId: 'falling', preset: 'Falling leaves', params: { mix: 0.28 } }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', as pieces fall away' },
    dissolve: { effects: [{ deviceId: 'generations', preset: 'Faint afterimage', params: { mix: 0.3 } }], words: ', leaving an afterimage' },
    linger: { effects: [{ deviceId: 'sine-shadow', preset: 'Nearly dry', params: { mix: 0.3 } }, { deviceId: 'ether-reverb', preset: 'Faint air' }], words: ', with pure tones behind' },
    padded: { effects: [{ deviceId: 'pad-follower', preset: 'Barely there', params: { mix: 0.3 } }], words: ', over a faint bed of strings' },
    faintoct: { effects: [{ deviceId: 'octaves', preset: 'Faint octave' }, { deviceId: 'hall-reverb', preset: 'Room' }], words: ', with faint octaves' },
    pipes: { effects: [{ deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.4 } }, { deviceId: 'hall-reverb', preset: 'Room' }], words: ', with flute stops drawn' },
    pedal: { effects: [{ deviceId: 'stops', preset: 'Pedal under', params: { mix: 0.4 } }], words: ', with a pedal under it' },
    hang: { effects: [{ deviceId: 'common-tones', preset: 'Hanging notes', params: { mix: 0.45 } }, { deviceId: 'plate-reverb', preset: 'Small plate' }], words: ', with held tones hanging on' },
    bed: { effects: [{ deviceId: 'micro-looper', preset: 'Soft bed' }], words: ', over a soft loop of the same' },
    under: { effects: [{ deviceId: 'underwater', preset: 'Just under' }], words: ', just under water' },
    wet: { effects: [{ deviceId: 'weather', preset: 'Light rain', params: { mix: 0.6 } }], words: ', out in a light rain' },
    surf: { effects: [{ deviceId: 'weather', preset: 'Far shore', params: { mix: 0.35 } }, { deviceId: 'hall-reverb', preset: 'Faint halo' }], words: ', with surf far away' },
    evening: { effects: [{ deviceId: 'seasons', preset: 'Long evening', params: { mix: 0.5 } }], words: ', in a long evening' },
    frost: { effects: [{ deviceId: 'seasons', preset: 'First frost', params: { mix: 0.5 } }], words: ', in a first frost' },
    vowel: { effects: [{ deviceId: 'imprint', preset: 'Round vowel' }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', shaped by a round vowel' },
    shift: { effects: [{ deviceId: 'freq-shifter', preset: 'Still water' }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', beating like still water' },
    quiet: { effects: [{ deviceId: 'reveal', preset: 'Gentle opening' }, { deviceId: 'ether-reverb', preset: 'Faint air' }], words: ', with the quiet parts lifted' },
    tails: { effects: [{ deviceId: 'lift', preset: 'Long tails' }, { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } }], words: ', with the tails brought up' },
    giant: { effects: [{ deviceId: 'size', preset: 'Larger' }, { deviceId: 'hall-reverb', preset: 'Room' }], words: ', in a larger body' },
    halfspeed: { effects: [{ deviceId: 'half-speed', preset: 'Thin shadow' }, { deviceId: 'ether-reverb', preset: 'Room' }], words: ', over a half speed shadow' },
  },
  // prettier-ignore
  phrases: {
    // Over a still fifth a fourth leans on the third and gives way; a fifth voice last.
    lean: { notes: [{ atSec: 0, durSec: 7.2, note: 50, gain: 0.6 }, { atSec: 0.1, durSec: 7.1, note: 57, gain: 0.5 }, { atSec: 0.2, durSec: 3, note: 67, gain: 0.55 }, { atSec: 3.2, durSec: 4, note: 65, gain: 0.5 }, { atSec: 0.3, durSec: 6.9, note: 72, gain: 0.5 }, { atSec: 4.6, durSec: 2.6, note: 76, gain: 0.4 }] },
    // Sevenths that fall to sixths over a bass going down by step.
    sevenths: { notes: [{ atSec: 0, durSec: 1.5, note: 50, gain: 0.6 }, { atSec: 1.5, durSec: 1.5, note: 48, gain: 0.6 }, { atSec: 3, durSec: 1.5, note: 47, gain: 0.6 }, { atSec: 4.5, durSec: 2.8, note: 45, gain: 0.6 }, { atSec: 0, durSec: 1.5, note: 65, gain: 0.45 }, { atSec: 1.5, durSec: 1.5, note: 64, gain: 0.45 }, { atSec: 3, durSec: 1.5, note: 62, gain: 0.45 }, { atSec: 4.5, durSec: 2.8, note: 60, gain: 0.45 }, { atSec: 0, durSec: 0.8, note: 72, gain: 0.6 }, { atSec: 0.8, durSec: 1.5, note: 71, gain: 0.55 }, { atSec: 2.3, durSec: 1.5, note: 69, gain: 0.55 }, { atSec: 3.8, durSec: 1.5, note: 67, gain: 0.55 }, { atSec: 5.3, durSec: 0.8, note: 65, gain: 0.5 }, { atSec: 6.1, durSec: 1.2, note: 64, gain: 0.5 }] },
    // A question high up, an answer low, the question once more and shorter.
    answer: { notes: [{ atSec: 0, durSec: 0.5, note: 69, gain: 0.6 }, { atSec: 0.5, durSec: 0.5, note: 72, gain: 0.6 }, { atSec: 1, durSec: 1.3, note: 76, gain: 0.7 }, { atSec: 2.5, durSec: 0.6, note: 60, gain: 0.5 }, { atSec: 3.1, durSec: 0.6, note: 57, gain: 0.5 }, { atSec: 3.7, durSec: 1.4, note: 52, gain: 0.6 }, { atSec: 5.2, durSec: 0.5, note: 72, gain: 0.5 }, { atSec: 5.7, durSec: 1.6, note: 74, gain: 0.5 }] },
    // Four notes going round over a held bass that moves once.
    round: { notes: [{ atSec: 0, durSec: 3.6, note: 45, gain: 0.6 }, { atSec: 3.6, durSec: 3.6, note: 41, gain: 0.6 }, { atSec: 0, durSec: 0.5, note: 57, gain: 0.5 }, { atSec: 0.45, durSec: 0.5, note: 64, gain: 0.45 }, { atSec: 0.9, durSec: 0.5, note: 60, gain: 0.4 }, { atSec: 1.35, durSec: 0.5, note: 64, gain: 0.45 }, { atSec: 1.8, durSec: 0.5, note: 57, gain: 0.5 }, { atSec: 2.25, durSec: 0.5, note: 64, gain: 0.45 }, { atSec: 2.7, durSec: 0.5, note: 60, gain: 0.4 }, { atSec: 3.15, durSec: 0.5, note: 64, gain: 0.45 }, { atSec: 3.6, durSec: 0.5, note: 57, gain: 0.5 }, { atSec: 4.05, durSec: 0.5, note: 65, gain: 0.45 }, { atSec: 4.5, durSec: 0.5, note: 60, gain: 0.4 }, { atSec: 4.95, durSec: 0.5, note: 65, gain: 0.45 }, { atSec: 5.4, durSec: 1.9, note: 69, gain: 0.5 }] },
    // One long note in the middle.
    lone: { notes: [{ atSec: 0, durSec: 6.8, note: 62, gain: 0.65 }] },
    // One long low note, its fifth much later, and a third far above them.
    deep: { notes: [{ atSec: 0, durSec: 7.2, note: 40, gain: 0.7 }, { atSec: 2.2, durSec: 5, note: 47, gain: 0.5 }, { atSec: 4.2, durSec: 3, note: 67, gain: 0.35 }] },
    // A bass line by third and by step, with air in it, and a low note to end on.
    walk: { notes: [{ atSec: 0, durSec: 1.2, note: 40, gain: 0.7 }, { atSec: 1.4, durSec: 0.5, note: 47, gain: 0.55 }, { atSec: 2, durSec: 1.1, note: 43, gain: 0.65 }, { atSec: 3.3, durSec: 0.5, note: 45, gain: 0.55 }, { atSec: 3.9, durSec: 1, note: 41, gain: 0.7 }, { atSec: 5.1, durSec: 2.2, note: 33, gain: 0.75 }] },
    // A low figure that comes back, with a rest in the middle of it.
    figure: { notes: [{ atSec: 0, durSec: 0.35, note: 40, gain: 0.75 }, { atSec: 0.45, durSec: 0.35, note: 40, gain: 0.45 }, { atSec: 0.9, durSec: 0.7, note: 47, gain: 0.6 }, { atSec: 2, durSec: 0.35, note: 45, gain: 0.6 }, { atSec: 2.45, durSec: 0.8, note: 43, gain: 0.6 }, { atSec: 3.6, durSec: 0.35, note: 40, gain: 0.75 }, { atSec: 4.05, durSec: 0.35, note: 40, gain: 0.45 }, { atSec: 4.5, durSec: 0.7, note: 47, gain: 0.6 }, { atSec: 5.5, durSec: 1.8, note: 33, gain: 0.7 }] },
    // Two very low notes, each alone.
    floor: { notes: [{ atSec: 0, durSec: 3.2, note: 33, gain: 0.8 }, { atSec: 3.5, durSec: 3.8, note: 31, gain: 0.8 }] },
    // High bells, each held until the next.
    high: { notes: [{ atSec: 0, durSec: 1.1, note: 84, gain: 0.6 }, { atSec: 1.2, durSec: 0.85, note: 79, gain: 0.5 }, { atSec: 2.1, durSec: 1.4, note: 88, gain: 0.5 }, { atSec: 3.6, durSec: 0.85, note: 86, gain: 0.55 }, { atSec: 4.5, durSec: 1.15, note: 81, gain: 0.45 }, { atSec: 5.7, durSec: 1.6, note: 91, gain: 0.35 }] },
    // Rows of a peal, coming down, two bells changing places each time.
    peal: { notes: [{ atSec: 0, durSec: 0.4, note: 76, gain: 0.6 }, { atSec: 0.42, durSec: 0.4, note: 74, gain: 0.5 }, { atSec: 0.84, durSec: 0.4, note: 72, gain: 0.5 }, { atSec: 1.26, durSec: 0.4, note: 71, gain: 0.5 }, { atSec: 1.68, durSec: 0.4, note: 67, gain: 0.55 }, { atSec: 2.52, durSec: 0.4, note: 74, gain: 0.6 }, { atSec: 2.94, durSec: 0.4, note: 76, gain: 0.5 }, { atSec: 3.36, durSec: 0.4, note: 71, gain: 0.5 }, { atSec: 3.78, durSec: 0.4, note: 72, gain: 0.5 }, { atSec: 4.2, durSec: 2.4, note: 67, gain: 0.6 }] },
    // Three sixths in the treble, each left to ring, and one note over the last.
    sixths: { notes: [{ atSec: 0, durSec: 2.3, note: 67, gain: 0.5 }, { atSec: 0, durSec: 2.3, note: 76, gain: 0.5 }, { atSec: 2.4, durSec: 2.3, note: 65, gain: 0.5 }, { atSec: 2.4, durSec: 2.3, note: 74, gain: 0.5 }, { atSec: 4.8, durSec: 2.4, note: 62, gain: 0.5 }, { atSec: 4.8, durSec: 2.4, note: 71, gain: 0.45 }, { atSec: 5.6, durSec: 1.6, note: 79, gain: 0.35 }] },
    // Three chords that share their top note, and a fourth that lets it fall.
    common: { notes: [{ atSec: 0, durSec: 1.8, note: 48, gain: 0.55 }, { atSec: 0, durSec: 1.8, note: 55, gain: 0.45 }, { atSec: 0, durSec: 3.6, note: 64, gain: 0.45 }, { atSec: 0, durSec: 5.4, note: 72, gain: 0.5 }, { atSec: 1.8, durSec: 1.8, note: 45, gain: 0.55 }, { atSec: 1.8, durSec: 3.6, note: 57, gain: 0.45 }, { atSec: 3.6, durSec: 1.8, note: 41, gain: 0.55 }, { atSec: 3.6, durSec: 1.8, note: 65, gain: 0.45 }, { atSec: 5.4, durSec: 1.9, note: 43, gain: 0.55 }, { atSec: 5.4, durSec: 1.9, note: 55, gain: 0.45 }, { atSec: 5.4, durSec: 1.9, note: 62, gain: 0.45 }, { atSec: 5.4, durSec: 1.9, note: 71, gain: 0.5 }] },
    // A wide chord let in from below, one key after another, all held.
    stair: { notes: [{ atSec: 0, durSec: 7.2, note: 41, gain: 0.6 }, { atSec: 0.8, durSec: 6.4, note: 48, gain: 0.5 }, { atSec: 1.6, durSec: 5.6, note: 57, gain: 0.5 }, { atSec: 2.4, durSec: 4.8, note: 64, gain: 0.5 }, { atSec: 3.2, durSec: 4, note: 71, gain: 0.45 }, { atSec: 4, durSec: 3.2, note: 76, gain: 0.4 }] },
    // A line and the same line an octave under it, two seconds later.
    follow: { notes: [{ atSec: 0, durSec: 1, note: 74, gain: 0.6 }, { atSec: 1, durSec: 0.5, note: 72, gain: 0.5 }, { atSec: 1.5, durSec: 0.5, note: 71, gain: 0.5 }, { atSec: 2, durSec: 1.5, note: 69, gain: 0.55 }, { atSec: 3.5, durSec: 0.5, note: 71, gain: 0.5 }, { atSec: 4, durSec: 3, note: 72, gain: 0.5 }, { atSec: 2, durSec: 1, note: 62, gain: 0.6 }, { atSec: 3, durSec: 0.5, note: 60, gain: 0.5 }, { atSec: 3.5, durSec: 0.5, note: 59, gain: 0.5 }, { atSec: 4, durSec: 1.5, note: 57, gain: 0.55 }, { atSec: 5.5, durSec: 0.5, note: 59, gain: 0.45 }, { atSec: 6, durSec: 1.2, note: 60, gain: 0.5 }] },
    // Three voices by step over four harmonies, the lowest falling a fifth to end.
    voices: { notes: [{ atSec: 0, durSec: 3.6, note: 57, gain: 0.5 }, { atSec: 0, durSec: 3.6, note: 60, gain: 0.5 }, { atSec: 0, durSec: 1.8, note: 64, gain: 0.6 }, { atSec: 1.8, durSec: 1.8, note: 65, gain: 0.6 }, { atSec: 3.6, durSec: 1.8, note: 55, gain: 0.5 }, { atSec: 3.6, durSec: 1.8, note: 59, gain: 0.5 }, { atSec: 3.6, durSec: 1.8, note: 65, gain: 0.6 }, { atSec: 5.4, durSec: 1.9, note: 48, gain: 0.5 }, { atSec: 5.4, durSec: 1.9, note: 60, gain: 0.5 }, { atSec: 5.4, durSec: 1.9, note: 64, gain: 0.6 }] },
    // One sung line that leans on its strong beats.
    aria: { notes: [{ atSec: 0, durSec: 1.5, note: 64, gain: 0.6 }, { atSec: 1.5, durSec: 0.75, note: 65, gain: 0.5 }, { atSec: 2.25, durSec: 1.5, note: 69, gain: 0.65 }, { atSec: 3.75, durSec: 0.75, note: 67, gain: 0.55 }, { atSec: 4.5, durSec: 0.75, note: 65, gain: 0.5 }, { atSec: 5.25, durSec: 2, note: 62, gain: 0.55 }] },
    // A rolled chord, let ring, and its top note again by itself.
    roll: { notes: [{ atSec: 0, durSec: 3, note: 50, gain: 0.6 }, { atSec: 0.18, durSec: 2.8, note: 57, gain: 0.55 }, { atSec: 0.36, durSec: 2.6, note: 62, gain: 0.55 }, { atSec: 0.54, durSec: 2.4, note: 64, gain: 0.5 }, { atSec: 0.72, durSec: 2.2, note: 69, gain: 0.5 }, { atSec: 0.9, durSec: 2, note: 74, gain: 0.55 }, { atSec: 3.4, durSec: 0.8, note: 76, gain: 0.5 }, { atSec: 4.3, durSec: 0.8, note: 74, gain: 0.45 }, { atSec: 5.2, durSec: 2, note: 69, gain: 0.5 }, { atSec: 5.2, durSec: 2, note: 53, gain: 0.5 }] },
    // A five note tune with rests, plucked.
    tune: { notes: [{ atSec: 0, durSec: 0.3, note: 67, gain: 0.6 }, { atSec: 0.4, durSec: 0.3, note: 69, gain: 0.5 }, { atSec: 0.8, durSec: 0.6, note: 72, gain: 0.65 }, { atSec: 1.8, durSec: 0.3, note: 69, gain: 0.5 }, { atSec: 2.2, durSec: 0.6, note: 64, gain: 0.55 }, { atSec: 2.2, durSec: 1.2, note: 48, gain: 0.5 }, { atSec: 3.6, durSec: 0.3, note: 67, gain: 0.6 }, { atSec: 4, durSec: 0.3, note: 69, gain: 0.5 }, { atSec: 4.4, durSec: 0.3, note: 74, gain: 0.65 }, { atSec: 4.8, durSec: 0.6, note: 72, gain: 0.55 }, { atSec: 5.6, durSec: 1.6, note: 62, gain: 0.55 }, { atSec: 5.6, durSec: 1.6, note: 45, gain: 0.5 }] },
    // Left hand low, right hand slowly above it.
    hands: { notes: [{ atSec: 0, durSec: 1.6, note: 45, gain: 0.6 }, { atSec: 0.4, durSec: 1.2, note: 52, gain: 0.4 }, { atSec: 0.8, durSec: 1, note: 60, gain: 0.4 }, { atSec: 0, durSec: 1.6, note: 71, gain: 0.55 }, { atSec: 1.8, durSec: 1.6, note: 41, gain: 0.6 }, { atSec: 2.2, durSec: 1.2, note: 53, gain: 0.4 }, { atSec: 2.6, durSec: 1, note: 60, gain: 0.4 }, { atSec: 1.8, durSec: 1.6, note: 69, gain: 0.55 }, { atSec: 3.6, durSec: 1.8, note: 43, gain: 0.6 }, { atSec: 4, durSec: 1.4, note: 52, gain: 0.4 }, { atSec: 4.4, durSec: 1, note: 59, gain: 0.4 }, { atSec: 3.6, durSec: 1.8, note: 67, gain: 0.55 }, { atSec: 5.4, durSec: 1.9, note: 48, gain: 0.55 }, { atSec: 5.4, durSec: 1.9, note: 64, gain: 0.5 }, { atSec: 5.4, durSec: 1.9, note: 55, gain: 0.4 }] },
    // A bass fifth, and seconds that come in over it.
    seconds: { notes: [{ atSec: 0, durSec: 7.2, note: 45, gain: 0.55 }, { atSec: 0, durSec: 7.2, note: 52, gain: 0.45 }, { atSec: 1.5, durSec: 5.7, note: 62, gain: 0.4 }, { atSec: 3, durSec: 4.2, note: 64, gain: 0.4 }, { atSec: 4.5, durSec: 2.7, note: 71, gain: 0.35 }] },
    // A high fifth held, its upper neighbour coming and going.
    neighbour: { notes: [{ atSec: 0, durSec: 7.2, note: 57, gain: 0.5 }, { atSec: 0, durSec: 7.2, note: 64, gain: 0.5 }, { atSec: 0.6, durSec: 2, note: 72, gain: 0.45 }, { atSec: 2.6, durSec: 2, note: 74, gain: 0.45 }, { atSec: 4.6, durSec: 2.6, note: 72, gain: 0.45 }] },
    // Two chords, far apart, each with a bass of its own.
    tworooms: { notes: [{ atSec: 0, durSec: 3.4, note: 50, gain: 0.55 }, { atSec: 0, durSec: 3.4, note: 60, gain: 0.45 }, { atSec: 0, durSec: 3.4, note: 65, gain: 0.45 }, { atSec: 0, durSec: 3.4, note: 76, gain: 0.45 }, { atSec: 3.6, durSec: 3.6, note: 43, gain: 0.55 }, { atSec: 3.6, durSec: 3.6, note: 59, gain: 0.45 }, { atSec: 3.6, durSec: 3.6, note: 65, gain: 0.45 }, { atSec: 3.6, durSec: 3.6, note: 74, gain: 0.45 }] },
    // Eight dry drops, coming down an open scale.
    drops: { notes: [{ atSec: 0, durSec: 0.3, note: 89, gain: 0.5 }, { atSec: 0.7, durSec: 0.3, note: 83, gain: 0.5 }, { atSec: 1.5, durSec: 0.3, note: 81, gain: 0.5 }, { atSec: 2.1, durSec: 0.3, note: 76, gain: 0.55 }, { atSec: 3.2, durSec: 0.3, note: 72, gain: 0.5 }, { atSec: 3.8, durSec: 0.3, note: 71, gain: 0.5 }, { atSec: 4.9, durSec: 0.3, note: 65, gain: 0.55 }, { atSec: 5.8, durSec: 1.4, note: 64, gain: 0.55 }] },
  },
  directions: [
    {
      id: 'bell-to-organ',
      name: 'Bell becomes organ',
      category: 'organ',
      rows: `
Bell ringer's bench | Bell becomes organ | overtones=8 travel=0.5 touch=0.7 ring=5 glow=0.7 tilt=0.15 volume=-2 air=0.2 | nave | lean | A struck church bell settles from the bottom up into a soft organ
Vestry at eight | Bell becomes organ | overtones=5 travel=0.12 attack=0.03 tilt=-0.6 glow=0.95 spread=0.2 leftover=0 manner=-0.3 touch=0.2 | parlour | common | A dull small bell turns within a second into five quiet flue ranks
Loft in January | Bell becomes organ | overtones=13 travel=0.25 touch=0.35 tilt=0.35 air=0.2 glow=0.85 glint=0.3 volume=-1.5 manner=-0.45 swing=0 | chamber | sevenths | A bright bell settles quickly into a cold thin organ with breath on it
Tuner's patience | Bell becomes organ | overtones=10 travel=1.5 order=1 glow=0.6 ring=14 leftover=0.4 touch=0.5 volume=-1 | bare | lone | A bell whose high tones are tuned first, each taking its time
Sexton's hum | Bell becomes organ | overtones=4 travel=1.1 attack=0.2 tilt=-0.9 glow=1 air=0.05 spread=0.4 forward=0.2 volume=-1.5 manner=-0.12 | crypt | deep | The hum of a bell, its note and three tones more, sung and very dark
Ranks of tin | Bell becomes organ | material=Plate goal=Octaves overtones=12 travel=0.2 touch=0.6 tilt=0.2 glow=0.8 manner=-0.3 swing=0 | hall | common | A struck plate leaps onto ranks of octaves, bright and wide
Mirror stops | Bell becomes organ | material=Plate goal=Octaves overtones=5 travel=0.9 attack=0.25 swing=0.6 glow=0.9 tilt=-0.35 touch=0.72 | mirror | neighbour | A plate swells into a few octaves that swing in and go on swaying
Blue pipe case | Bell becomes organ | material=Plate goal=Own_series overtones=17 travel=0.2 order=0.5 glint=0.6 leftover=0.35 touch=0.3 volume=1.5 manner=-0.12 swing=0 air=0.14 | pipes | tworooms | Seventeen chiming plate tones find the key's own series in no order
Iron diapason | Bell becomes organ | material=Plate goal=Own_series overtones=7 travel=0.12 touch=0.8 tilt=-0.35 ring=2 release=0.6 | console | sevenths | A hard struck plate is a plain diapason before the stroke has gone
Organ after rain | Bell becomes organ | material=Plate goal=Chord overtones=9 travel=0.7 air=0.45 attack=0.7 tilt=-0.5 release=5 manner=-0.2 touch=0.4 | valley | lean | A breathy plate swells and finds the tones of the chord in soft ranks
Toy positive | Bell becomes organ | material=Bar overtones=4 travel=0.1 touch=0.45 release=0.4 spread=0.25 glow=0.9 volume=-2 air=0.22 | booth | sevenths | A tapped bar is at once a small stopped pipe
Wooden flutes | Bell becomes organ | material=Bar overtones=3 air=0.35 attack=0.08 tilt=-0.5 glow=1 swing=0.25 volume=1.5 | wood | follow | Three soft overtones and breath, like stopped wood, swaying faintly
Glockenspiel stop | Bell becomes organ | material=Bar overtones=7 travel=0.4 touch=0.75 glint=0.9 tilt=0.3 glow=0.5 forward=0.8 volume=-0.5 manner=-0.12 swing=0 | brighthall | tune | Bars struck hard that chime as each overtone gets to its rank
Schoolroom harmony | Bell becomes organ | material=Bar goal=Octaves overtones=6 leftover=0.6 attack=0.15 glow=0.85 air=0.15 tilt=-0.15 travel=0.3 swing=0.4 | cassette | common | Bar tones go to their octaves and keep a wavering beat
Crossing keeper | Bell becomes organ | material=Bar goal=Chord overtones=10 travel=0.7 manner=-0.6 attack=0.4 release=3 tilt=-0.3 volume=-0.5 swing=0 | amptrem | tworooms | Tones that sink and rise on their way from bar to chord
Reed in the wall | Bell becomes organ | material=Stretched overtones=11 travel=0.3 tilt=0.1 attack=0.05 glow=1 spread=0.3 touch=0.3 manner=-0.2 | valve | sevenths | Stiff wire pulled straight into a narrow reed rank
Wire organ | Bell becomes organ | material=Stretched overtones=15 travel=0.4 order=0.2 touch=0.4 ring=10 glow=0.65 tilt=-0.3 swing=0 | chorale | common | A cloud of stretched wire folds into one long drawn organ tone
Spinet with bellows | Bell becomes organ | material=Stretched overtones=8 attack=0.004 travel=0.2 touch=0.6 glow=0.7 air=0.1 release=0.8 volume=-0.5 manner=-0.12 swing=0.2 bend=0.88 | tight | sevenths | A wiry pluck whose tones are caught and blown
Silver mixture | Bell becomes organ | material=Stretched goal=Octaves overtones=10 travel=0.5 glint=0.4 leftover=0.15 glow=0.9 tilt=-0.5 forward=0.3 swing=0 | plate | neighbour | Wide stretched tones close in to their octaves like a mixture stop
Long reed | Bell becomes organ | material=Stretched goal=Chord overtones=6 attack=0.35 swing=0.4 glow=1 tilt=-0.2 release=4 manner=-0.12 bend=1 volume=-2 | vibrato | aria | A swelling wire tone that leans past the chord and back | voice
Kitchen bellows | Bell becomes organ | material=Squeezed overtones=7 leftover=0.5 attack=0.12 glow=0.95 air=0.12 release=0.5 travel=0.25 swing=0 | room | common | A crowd of close tones opens into a small reed organ that still beats
Two reeds arguing | Bell becomes organ | material=Squeezed overtones=3 leftover=1 travel=0.8 glow=1 tilt=0.9 bend=0.8 | pillow | follow | Three squeezed tones nearly agree and quarrel as fast as they can
Pleated paper lungs | Bell becomes organ | material=Squeezed goal=Octaves overtones=9 attack=0.5 manner=-0.9 travel=1.2 glow=0.9 release=2 forward=0.4 touch=0.3 | sigh | neighbour | Close tones draw apart to octaves and sink between them
Coal dust hymnal | Bell becomes organ | material=Squeezed goal=Bass_series overtones=8 tilt=-0.55 attack=0.1 glow=0.85 travel=0.5 release=1.2 volume=-15 swing=0.25 | record | common | Squeezed tones go to the overtones of a bass under the hands
Accordion asleep | Bell becomes organ | material=Squeezed goal=Chord overtones=9 travel=0.6 attack=0.9 again=-0.5 rest=1.5 tilt=-0.4 release=6 swing=0.35 touch=0.15 | blanket | lean | A slow reedy crowd that goes to the chord and now and then falls back
Draught in the pipes | Bell becomes organ | material=Scattered overtones=9 air=0.75 attack=0.35 tilt=-0.65 travel=0.5 glow=0.9 volume=0.5 manner=-0.3 swing=0.25 | stairs | neighbour | Scattered breath finds the series of each key, like air in pipes
Cipher at night | Bell becomes organ | material=Scattered overtones=5 air=0.3 travel=0.8 order=0 tilt=-0.65 attack=0.6 glow=1 manner=-0.12 swing=0.25 | darkhall | seconds | A few stray tones come in from the bottom and stay
Choir screen | Bell becomes organ | material=Scattered goal=Octaves overtones=14 air=0.5 travel=0.2 glint=0.2 attack=0.8 tilt=-0.5 volume=2.5 manner=-0.2 swing=0.4 | choirhall | voices | Fourteen scattered tones and breath gather into octaves
Moth on the manual | Bell becomes organ | material=Scattered overtones=7 travel=0.15 manner=0.7 again=0.5 rest=0.4 glow=0.6 tilt=-0.6 volume=1.5 swing=0 | hang | lean | Small hopping tones that go on being touched after they have settled
White keys of frost | Bell becomes organ | material=Scattered goal=Chord overtones=11 attack=0.02 touch=0.25 glint=0.8 tilt=-0.1 travel=0.2 glow=0.7 manner=-0.45 swing=0.3 air=0.14 | frost | common | A soft scatter that chimes its way into the chord
Choirmaster's nod | Bell into chord | overtones=7 travel=0.3 glow=0.9 attack=0.06 again=0 tilt=-0.3 leftover=0.1 forward=0 volume=-4.5 order=0.15 air=0.18 touch=0.15 | undertow | voices | A soft bell whose tones all go to the chord and stand still there
Settled before noon | Bell into chord | overtones=12 travel=0.18 order=0 glow=0.75 touch=0.5 again=0 spread=0.95 forward=0.1 volume=-1 swing=0 air=0.22 | late | common | A wide bell that gives each tone of the chord its place from below
Half an evensong | Bell into chord | bend=0.5 overtones=9 glow=0.85 attack=0.1 leftover=0.3 again=0 release=3 volume=-0.5 manner=-0.45 touch=0.3 | swirl | sevenths | A bell that goes half of the way to the chord and stays half bell
Lead and beeswax | Bell into chord | overtones=5 glow=1 attack=0.3 tilt=-0.75 travel=0.4 swing=0.3 again=0 order=0.05 forward=0.2 touch=0.2 | thick | common | Five dark sung tones that swing gently into the chord
Snuffed taper | Bell into chord | overtones=8 travel=0.3 glow=0.6 ring=3 release=0.5 manner=-0.5 again=0 touch=0.4 volume=3.5 order=0.8 forward=0.4 leftover=0 swing=0 air=0.2 | bloomlp | sevenths | A bell tone that breathes as it settles and is gone soon after
Sixteen foot dark | Squeezed bass | material=Bell overtones=6 travel=0.5 glow=0.9 attack=0.05 release=1 tilt=-0.5 volume=-5.5 leftover=0.1 rest=0.25 swing=0 | firm | walk | A low bell that becomes the pedal under an organ | bass
Boots on the pedals | Squeezed bass | material=Bar goal=Own_series overtones=8 attack=0.02 glow=0.85 touch=0.5 tilt=0.2 release=0.35 volume=0.5 forward=0.6 leftover=0.1 rest=2.5 manner=0.3 swing=0 air=0.16 bend=0.85 | chamber | figure | Short pedal notes with a knock at the front | bass
Cellar windchest | Squeezed bass | material=Plate goal=Octaves overtones=7 attack=0.4 air=0.35 glow=0.95 tilt=-0.25 release=2.5 volume=0 spread=0.8 order=0.1 rest=1.5 manner=-0.2 swing=0.45 | cave | deep | A wide low plate fills with wind and comes to rest on octaves | drone
Bourdon for two | Squeezed bass | goal=Bass_series overtones=10 attack=0.8 leftover=0.75 glow=1 spread=0.6 release=3 tilt=0.6 volume=-5 order=0.05 forward=0.1 rest=5 swing=0.35 air=0.12 | open | deep | Close low tones beat against a root below them | drone
Crypt pedalboard | Squeezed bass | material=Scattered goal=Own_series overtones=5 attack=0.06 air=0.15 glow=0.8 tilt=-0.6 travel=0.3 volume=-5.5 order=0.05 forward=0 rest=0.4 swing=0 | darkplate | walk | Stray low tones are soon one plain pedal | bass
Swell box opening | Scattered dawn | material=Bell goal=Own_series overtones=10 attack=3.5 tilt=-0.55 glint=0 travel=0.45 glow=0.95 rest=3 air=0.22 touch=0.15 volume=4 | lowpass | lean | A bell bowed very slowly until it is a whole soft organ
Processional far off | Halo of the bass | material=Bell goal=Own_series attack=0.7 overtones=8 tilt=-0.3 air=0.1 travel=0.4 volume=-3 forward=0.8 | shore | voices | Organ tone that swells out of a bell and is soon in step
Dawn office | Scattered dawn | material=Plate goal=Own_series overtones=9 attack=0.8 air=0.25 tilt=-0.45 glint=0.15 order=0 travel=0.3 rest=2.5 manner=-0.3 swing=0.5 | halo | common | A plate swells from its lowest tone up, with a little breath
Rose light on stone | Never resting pad | goal=Own_series attack=0.7 again=0.3 rest=2.5 tilt=0.1 overtones=12 manner=0 volume=-2 travel=0.5 order=0.6 leftover=0 | brighthall | stair | Bell tones settle into bright ranks and one now and then moves on
Vesper smoke | Never resting pad | goal=Octaves overtones=6 attack=0.9 air=0.4 tilt=-0.6 again=-0.4 rest=1.2 volume=-2 order=0.45 forward=0.1 leftover=0.45 swing=0.25 touch=0.35 | haze | neighbour | Breathy octaves that slip back into metal and return
Cabinet with the lid up | Bell becomes organ | material=Bar goal=Own_series overtones=6 travel=0.07 touch=0.2 leftover=0.1 release=0.3 tilt=0.1 forward=0.1 | turning | hands | A quick clean organ with a tick of bar at its front
Roller rink after hours | Bell becomes organ | material=Stretched goal=Octaves overtones=7 travel=0.08 glow=1 swing=0.5 release=0.6 spread=0.8 volume=-1.5 tilt=-0.5 forward=0.2 air=0.16 touch=0.3 | chorale 1.mix=0.9 | hands | Octave tones that sway in slow time, caught at once
Transistor prayer | Bell becomes organ | material=Squeezed goal=Octaves overtones=4 travel=0.1 tilt=0.35 glow=1 release=0.25 spread=0 leftover=0 air=0.16 touch=0.2 | transistor | sevenths | A thin narrow organ tone, quickly in tune
Fairground in fog | Bell becomes organ | material=Bell goal=Octaves overtones=11 travel=0.3 manner=0.6 again=0.4 rest=0.6 glint=0.5 volume=2 tilt=-0.3 air=0.12 | fog | hands | Bell octaves struck again in small hops as they rest
Dust on the drawbars | Bell becomes organ | material=Plate goal=Own_series overtones=10 travel=0.15 leftover=0.7 tilt=-0.35 attack=0.02 release=0.9 swing=0.4 air=0.12 bend=0.86 | valve | hands | An old organ tone that keeps some of the plate it came from
`,
    },
    {
      id: 'scattered-dawn',
      name: 'Scattered dawn',
      category: 'pad',
      rows: `
Ridge before sunrise | Scattered dawn | overtones=10 attack=1 travel=0.7 order=1 glint=0.5 tilt=-0.75 forward=0.7 rest=1.5 manner=-0.25 swing=0 volume=4.5 | space | lean | High scattered tones find the chord first and the rest come down to meet them
First bus lights | Scattered dawn | overtones=6 attack=0.8 travel=0.4 order=0.85 glint=0.8 tilt=-0.15 ring=9 spread=0.4 leftover=0.35 manner=-0.12 swing=0.35 touch=0.3 bend=1 | halo | stair | Six points of metal chime into place from the top down
Birch trunks | Scattered dawn | overtones=11 attack=1.3 travel=0.35 order=0.9 glint=0 glow=0.95 tilt=-0.8 leftover=0.06 rest=0.4 | valley | seconds | A close stand of pale tones that all lean and then stand upright
Milk van | Scattered dawn | overtones=8 attack=0.5 travel=0.6 order=0.95 touch=0.6 glow=0.5 leftover=0.5 volume=6 tilt=-0.6 manner=0.3 bend=0.82 | drawn | tworooms | A slow scatter that rattles a little on its way to the chord
Geese over the estate | Scattered dawn | attack=1.2 travel=0.8 swing=0.9 forward=0.6 volume=1.5 tilt=-0.95 overtones=7 release=3 order=0.6 glint=0.15 rest=1.2 air=0.2 | shore | neighbour | One tone after another steps out of the cloud, swings past and falls in line
Low meadow | Scattered dawn | overtones=7 attack=1.4 order=0 tilt=-0.8 glint=0.1 travel=1 release=14 rest=6 manner=-0.35 swing=0 touch=0.2 bend=0.82 | undertow | seconds | Dark scattered tones that gather from the bottom, nearly without light
Cattle breath | Scattered dawn | overtones=5 attack=1 order=0.05 tilt=-0.7 air=0.55 travel=0.6 glint=0 leftover=0.4 rest=5 manner=-0.2 | blanket | deep | Warm breath and a few stray tones that come in close
Lock gate | Scattered dawn | overtones=9 order=0 travel=1.2 tilt=-0.5 forward=0.9 glow=0.7 volume=-10.5 attack=1.2 release=4 rest=5 manner=-0.3 swing=0.35 air=0.22 bend=0.88 | darkwater | deep | Tone after tone is let down slowly into a dark chord
Unlit slate roofs | Scattered dawn | overtones=10 attack=0.05 order=0.1 tilt=-0.9 touch=0.8 ring=30 glow=0.6 glint=0 travel=0.6 leftover=0.6 manner=-0.45 bend=0.78 | darkhall | tworooms | Very dark metal, struck under cloth, that gathers from the bottom
Signal box lamp | Scattered dawn | overtones=4 attack=1 order=0 tilt=-0.6 swing=0.6 glow=1 spread=0.2 bend=0.88 | hiss | neighbour | Four dark tones that swing in and go on rocking
Stacked mornings | Scattered dawn | goal=Octaves overtones=9 attack=0.9 travel=0.6 tilt=-0.5 glint=0.3 rest=0.4 manner=-0.25 swing=0 | rising | stair | Scattered tones each find an octave of their key and stay
Bucket and windlass | Scattered dawn | goal=Octaves overtones=5 attack=0.6 travel=0.9 manner=-0.8 tilt=-1 glint=0.1 forward=0.3 leftover=0.3 touch=0.62 bend=0.88 | stairs | lean | Five tones sink, rise again near their octaves, and chime faintly where they stop
Frost on the rails | Scattered dawn | goal=Octaves overtones=14 attack=1 travel=0.3 air=0.15 release=10 tilt=-0.6 volume=-6.5 glint=0.6 rest=0.25 manner=-0.25 | frost | neighbour | Many cold tones snap to octaves with small chimes
Empty granary | Scattered dawn | goal=Octaves overtones=7 leftover=0.8 tilt=-0.6 glow=0.95 air=0.3 attack=1.3 travel=0.6 rest=8 manner=-0.35 swing=0.45 bend=1 | cistern | seconds | Octaves of breath and metal that go on beating for as long as they are held
Clocks out of step | Scattered dawn | goal=Octaves overtones=6 attack=0.02 touch=0.7 travel=0.9 ring=18 glow=0.45 tilt=-0.35 volume=-6.5 leftover=0.1 rest=8 swing=0.4 | late | sixths | Struck scattered tones that fall to octaves, not quite together | bell
River under ice | Scattered dawn | goal=Bass_series overtones=10 attack=1.3 travel=0.8 tilt=-0.4 glint=0.2 air=0.1 rest=3 manner=-0.12 | crypt | seconds | Scattered light draws down toward the overtones of one low tone
Ploughed line | Scattered dawn | goal=Bass_series overtones=6 attack=0.5 travel=0.4 order=0.2 tilt=-0.1 release=3 glint=0.4 volume=-6 forward=0.05 leftover=0.12 rest=0.25 swing=0 | bare | common | A quick pad that always stands on a root below the hands
Tide gauge | Scattered dawn | goal=Bass_series overtones=8 travel=0.6 again=-0.7 rest=1 tilt=-0.3 volume=6 attack=1.6 leftover=0.4 swing=0.45 touch=0.7 | tides | tworooms | A slow pad that rests on its low root and then slips from it
Barge horn upriver | Scattered dawn | goal=Bass_series overtones=4 attack=0.9 swing=0.8 glow=1 tilt=-0.2 glint=0 air=0.2 volume=-11.5 release=1.5 forward=0.8 rest=4 | shore | deep | A few tones like a far horn, swinging home to a bass | wind
Silt | Scattered dawn | goal=Bass_series overtones=17 attack=1.3 order=0.5 leftover=0.9 tilt=-0.8 glow=0.8 volume=-8.5 travel=0.8 release=18 rest=3 manner=-0.12 swing=0 | darkplate | seconds | A thick dark crowd that settles over a root and never clears
Ground mist | Tuned wind | overtones=8 attack=1.2 tilt=-0.65 travel=1.2 forward=0.3 leftover=0.06 manner=-0.25 swing=0.45 bend=0.82 volume=-1 | fog | lean | Tuned wind lies low over the chord
Breath on the window | Tuned wind | overtones=5 attack=0.5 tilt=-0.35 air=0.8 travel=0.4 glow=0.6 release=2 volume=-0.5 forward=0.2 order=0.9 leftover=0 rest=2 swing=0 | bare | voices | Five close breaths that agree at once and are let go lightly | voice
Reed bed | Tuned wind | overtones=10 attack=1 order=0.3 tilt=-0.55 swing=0.7 spread=1 air=0.9 volume=-1.5 forward=0.35 rest=5 bend=0.85 | water | neighbour | A wide bed of winds that sways on its way to the chord
Field full of gauze | Tuned wind | overtones=11 material=Bell goal=Octaves attack=1.4 tilt=-0.4 air=0.7 glint=0.5 volume=1 order=0.7 forward=0.2 leftover=0.45 rest=2 manner=-0.3 swing=0.5 touch=0.15 bend=0.88 | thinair | stair | Bell tones worn to breath that rise nearly to octaves, with faint chimes
Chimney talk | Tuned wind | material=Squeezed overtones=9 attack=0.8 tilt=-0.2 air=0.95 travel=0.8 goal=Own_series order=0.45 rest=0.25 manner=-0.45 swing=0.4 | vowel | tworooms | Close winds open into the series of each key, as a flue does
Yard full of buckets | Scattered dawn | overtones=8 attack=0.01 touch=0.7 travel=0.3 glow=0.4 ring=6 tilt=-0.3 release=2 leftover=0.06 rest=4 manner=0.2 swing=0 | tin | roll | Scattered metal, struck, that agrees before it has rung out | keys
Spoon on a saucer | Scattered dawn | overtones=5 attack=0.006 touch=0.4 travel=0.2 glow=0.25 glint=0.7 release=1.2 spread=0.3 rest=8 swing=0 | booth | tune | Short clear strikes that are in tune by the time they chime | keys
Table laid early | Scattered dawn | overtones=10 attack=0.02 touch=0.3 travel=0.22 order=0.2 glow=0.6 tilt=-0.2 ring=4 leftover=0.1 rest=0.4 swing=0 air=0.12 | strings | hands | Soft plates and spoons that turn to a held chord | keys
Gate latch in dew | Scattered dawn | goal=Own_series overtones=7 attack=0.004 touch=0.55 travel=0.15 glow=0.2 ring=2.5 release=1.5 volume=6 tilt=-0.95 forward=0.3 leftover=0.06 rest=0.4 swing=0 material=Bar glint=0.3 | stars | tune | A small dry latch that is in tune at once | plucked
Cups on their hooks | Scattered dawn | goal=Octaves overtones=7 attack=0.03 touch=0.08 travel=0.5 glow=0.8 glint=0.4 tilt=-0.5 leftover=0.45 rest=0.25 manner=0.25 swing=0.35 | felt | sixths | Dull cups, touched, whose ring straightens into octaves | bell
Sparrows in the gutter | Scattered dawn | manner=0.8 again=0.8 rest=0.3 overtones=9 attack=0.2 travel=0.3 glow=0.5 tilt=-0.7 forward=0.6 order=0.2 leftover=0.45 air=0.22 touch=0.3 bend=0.72 | airy | seconds | Small hopping tones that try one note of the chord and then another | texture
Rook parliament | Scattered dawn | manner=0.6 again=-0.8 rest=0.6 overtones=6 attack=0.5 tilt=-0.7 travel=0.5 touch=0.4 volume=6 leftover=0.7 swing=0.22 bend=0.72 | stairs | seconds | Dark tones hop away to metal and come back arguing | texture
Wren behind glass | Scattered dawn | manner=1 goal=Octaves overtones=11 attack=0.3 travel=0.4 glint=0.2 glow=0.6 volume=5 tilt=-0.4 leftover=0.45 rest=1.2 touch=0.4 | glass | neighbour | Octave tones tapped over and over once they have arrived
Seeds in a tray | Scattered dawn | manner=0.45 again=0.4 rest=0.25 overtones=13 attack=0.1 tilt=-0.5 travel=0.15 spread=1 glint=0.05 leftover=0.4 air=0.16 touch=0.68 bend=0.88 volume=5.5 | dust | lone | A wide patter of small tones, always one on the move | texture
Pigeons on tin | Scattered dawn | manner=0.9 goal=Own_series overtones=6 attack=0.08 tilt=-0.55 travel=0.8 rest=2 again=0.6 release=3 forward=0.3 material=Plate leftover=0.05 touch=0.4 volume=3.5 | wood | follow | A few tones step to their places and peck at them
Hammock at six | Scattered dawn | swing=1 overtones=7 attack=1.2 travel=1 tilt=-0.5 forward=0.4 glint=0.1 volume=6 rest=5 bend=0.85 | drifttape | lean | A loose chord that hangs and sways for as long as it is held
Bell buoy in a calm | Scattered dawn | swing=0.8 overtones=9 attack=0.04 travel=0.6 ring=12 tilt=-0.9 glow=0.75 touch=0.7 volume=2 forward=0.6 leftover=0.35 rest=4 bend=0.72 | pressed | sixths | Struck metal that rocks its way toward the chord | bell
Unhurried weathercock | Scattered dawn | swing=0.7 overtones=8 attack=0.9 travel=1 order=0.5 goal=Octaves tilt=-0.6 volume=-5.5 rest=0.5 bend=0.88 | airy | neighbour | Tones that swing round past their octave and back, high and slow
Ladder against a pear | Scattered dawn | swing=0.9 material=Stretched overtones=6 attack=0.6 travel=0.5 tilt=-0.3 glow=0.9 leftover=0.06 rest=0.5 air=0.2 touch=0.72 | thick | common | Stretched tones that overshoot each chord and settle
Empty rope swing | Scattered dawn | swing=0.6 again=1 rest=1.2 overtones=4 attack=1 glow=1 tilt=-0.4 air=0.2 leftover=0.12 touch=0.68 bend=0.85 | melt | deep | Four tones that keep setting off, swinging in and setting off again
Grey before colour | Scattered dawn | bend=0.45 overtones=9 attack=1.3 leftover=0.5 tilt=-0.5 glint=0 volume=6 rest=0.5 swing=0.2 air=0.14 | drawn | seconds | Scattered tones that go less than half way and wait there
Newsprint sky | Scattered dawn | bend=0.7 attack=0.7 leftover=1 tilt=-0.25 air=0.35 glint=0.1 glow=1 ring=8 overtones=8 volume=-8.5 travel=0.4 order=0.2 rest=4 manner=-0.2 swing=0.25 touch=0.4 | pressed | common | A pale pad, most of the way to agreement and trembling
Overcast all week | Scattered dawn | bend=0.25 overtones=12 attack=2.2 tilt=-0.3 glow=1 leftover=0.3 again=-0.4 volume=6 travel=7 rest=1.5 manner=-0.12 | drawn | lean | A dark field of tones that have barely begun to agree | drone
Rainbow cut short | Scattered dawn | bend=0.6 goal=Octaves overtones=11 attack=0.5 glint=0.6 travel=0.4 tilt=-0.75 forward=0.3 leftover=0.3 rest=2 air=0.22 | onwater | neighbour | Tones stopped on their way to octaves, all a little off
Mill chimney | Scattered dawn | bend=0.8 goal=Own_series overtones=7 attack=0.35 tilt=-0.6 ring=20 glow=0.7 leftover=0.7 travel=0.45 rest=8 manner=-0.2 swing=0.4 air=0.22 touch=0.68 | pedal | common | Stray tones that nearly make a series and keep some soot
Bell meadow opening | Scattered dawn | material=Bell overtones=8 attack=1.4 travel=0.7 order=0.2 tilt=-0.3 glint=0.35 volume=-5 leftover=0.3 rest=0.25 bend=1 | bloom | stair | A bell that swells open and lets its tones drop into the chord
Plate glass sunrise | Scattered dawn | material=Plate overtones=14 attack=1.1 travel=0.4 order=1 tilt=-0.55 glint=0.25 release=9 volume=4 leftover=0.12 rest=5 manner=-0.25 swing=0 | nave | lean | A broad plate brightens, and its highest tones agree first
Ploughshares in the sun | Scattered dawn | material=Squeezed overtones=11 attack=0.9 travel=0.35 tilt=0.6 leftover=0.4 forward=0.6 volume=-1.5 swing=0.45 air=0.12 touch=0.35 | warm | common | A crowded cluster comes slowly apart into a chord
Lark wire | Scattered dawn | material=Stretched goal=Octaves overtones=8 attack=0.8 travel=1.3 glint=0.75 air=0.1 tilt=-0.6 leftover=0.6 rest=2 manner=-0.25 touch=0.62 bend=0.85 | glimmer | neighbour | Stiff chiming wire swells, and its tones come down close to octaves
Sundial | Scattered dawn | material=Bar overtones=5 attack=3.6 travel=6 order=0 glow=1 tilt=-0.1 swing=0.2 leftover=0.05 rest=4 manner=-0.45 | steps | lone | Bar tones swell and turn toward the chord as slowly as a shadow
`,
    },
    {
      id: 'half-bent-keys',
      name: 'Half bent keys',
      category: 'keys',
      rows: `
Attic glockenspiel | Half bent keys | overtones=3 touch=0.7 ring=2 release=0.6 tilt=0.1 glow=0 spread=0.3 volume=3 forward=0.65 leftover=0.12 swing=0.5 | bare | tune | Three hard tones of a bar that lean to the chord and die away
Teaching room nine | Half bent keys | overtones=7 bend=0.35 touch=0.45 glow=0.2 ring=5 tilt=-0.15 leftover=0.4 volume=-0.5 forward=0.1 air=0.14 | parlour | hands | Bars a third of the way to their chord, still a little sour
Balcony after supper | Half bent keys | overtones=4 bend=0.75 touch=0.5 glow=0.45 air=0.1 release=2 tilt=-0.4 volume=2 forward=0.2 order=0.2 manner=0.15 | chorus | hands | Round bars that go most of the way and sound on softly
Split bamboo | Half bent keys | overtones=9 bend=0.5 touch=0.85 ring=1.2 travel=0.1 tilt=-0.25 release=0.4 volume=4 order=0.1 | room | roll | Short knocking bars that bend as they are struck
Saturday piano tuner | Half bent keys | overtones=5 bend=0.6 travel=0.5 forward=0.9 order=1 glow=0.5 touch=0.4 release=2.5 volume=2.5 leftover=0.12 manner=0.2 | mike | hands | You hear each high tone drawn down by hand, then left unfinished
Folded letter | Half bent keys | material=Bell goal=Own_series overtones=5 bend=0.7 touch=0.25 ring=7 glow=0.3 tilt=-0.35 swing=0 | warm | hands | Soft round bell keys that stop a little short of their series
Night desk | Half bent keys | material=Bell overtones=9 bend=0.4 touch=0.4 ring=8 glow=0.15 leftover=0.7 tilt=-0.3 volume=-1 forward=0.4 order=0.75 | amptrem | roll | Beating bell keys, less than half way to the chord
Blue tiled kitchen | Half bent keys | material=Bell goal=Octaves overtones=7 bend=0.55 touch=0.6 ring=3 glint=0.3 release=0.8 volume=1 order=0.6 forward=0.4 leftover=0.06 swing=0 | clean | tune | Clear chiming bells pulled half way to octaves
Third class saloon | Half bent keys | material=Bell overtones=12 bend=0.3 touch=0.7 ring=4 tilt=0.15 glow=0.1 release=1.5 volume=1 forward=0.2 | combo | hands | Bright crooked bell keys played rather hard
Understudy | Half bent keys | material=Bell overtones=4 bend=0.85 attack=0.03 glow=0.6 tilt=-0.55 swing=0.3 release=3 volume=0.5 order=0 leftover=0.05 | vibrato | answer | Dark bell keys that almost sing the chord
Toy with one leg gone | Half bent keys | material=Plate overtones=5 bend=0.4 touch=0.65 ring=1 glow=0 tilt=-0.2 release=0.5 volume=3 order=0.55 swing=0 air=0.14 | tin | tune | Short plates, all bent by the same too little
Canteen trays | Half bent keys | material=Plate goal=Own_series overtones=10 bend=0.65 touch=0.5 ring=2.5 travel=0.3 tilt=-0.4 leftover=0.6 volume=2.5 order=0.45 forward=0.6 air=0.1 | tight | hands | Clattering plates that slide part of the way into tune
Frozen puddles | Half bent keys | material=Plate overtones=14 bend=0.5 touch=0.3 ring=9 glow=0.1 tilt=-0.5 spread=1 release=4 volume=0 order=1 leftover=0.7 swing=0.22 air=0.16 | thinair | roll | Wide thin plates half bent and left to ring
Dinner gong lessons | Half bent keys | material=Plate goal=Bass_series overtones=7 bend=0.6 touch=0.55 ring=5 tilt=-0.6 glow=0.3 release=2 volume=1 order=0.1 swing=0.35 | steps | hands | Dull plates leaning toward the root under the left hand
Photograph of brass | Half bent keys | material=Plate goal=Octaves overtones=8 bend=0.75 attack=0.02 ring=3.5 glow=0.4 air=0.2 tilt=-0.15 volume=0.5 order=0.5 forward=0.35 manner=0.15 swing=0.35 | record | answer | Faded plate keys that nearly come to octaves
Wire under felt | Half bent keys | material=Stretched overtones=6 touch=0.25 ring=6 bend=0.5 tilt=-0.5 glow=0.2 release=1.5 volume=0.5 order=0.15 leftover=0.35 | felt | hands | Soft stiff strings, half straightened
Barrel piano rest day | Half bent keys | material=Stretched overtones=12 touch=0.7 ring=5 bend=0.3 leftover=0.8 tilt=-0.1 release=0.7 volume=0 order=0.4 forward=0.2 swing=0.2 | pressing | tune | A wiry keyboard, out of true, with quick beats in it
Cold harpsichord | Half bent keys | material=Stretched goal=Own_series overtones=10 attack=0.003 touch=0.45 ring=2 bend=0.8 travel=0.08 glow=0.05 release=0.4 volume=2.5 order=0 forward=0.65 leftover=0.35 | chamber | roll | A plucked keyboard whose wires are almost a proper string | plucked
Clavichord by lamp | Half bent keys | material=Stretched goal=Own_series overtones=5 touch=0.35 ring=3 bend=0.65 swing=0.6 glow=0.35 tilt=0 volume=2 air=0.15 order=0 forward=0.4 manner=0.3 | mike | sevenths | A small wire keyboard whose notes tremble under the finger
Bent wheel wire | Half bent keys | material=Stretched goal=Octaves overtones=7 touch=0.6 ring=8 bend=0.45 glint=0.5 tilt=-0.2 release=3 volume=1.5 leftover=0.6 swing=0 | heads | tune | Ringing wires stopped half way to their octaves
Gate left swinging | Half bent keys | material=Squeezed overtones=6 bend=0.5 touch=0.45 ring=4 tilt=0.7 release=0.8 glow=0.15 volume=5 forward=0.2 leftover=0.4 swing=0.25 air=0.12 | console | hands | Crowded tones that open half way and clang a little
Bronze in a drawer | Half bent keys | material=Squeezed goal=Own_series overtones=9 bend=0.7 touch=0.5 ring=7 leftover=0.5 tilt=0 release=2.5 volume=6 order=0.6 forward=0 | darkplate | answer | Close beating bronze that opens toward a plain note
Two lamps and one shade | Half bent keys | material=Squeezed overtones=3 bend=0.6 attack=0.015 glow=0.5 leftover=1 tilt=0.5 release=1.5 volume=1 forward=0.65 manner=0.3 | harmtrem | follow | Three tones so near each other that the note wavers
Screen in a draught | Half bent keys | material=Squeezed goal=Octaves overtones=13 bend=0.4 touch=0.75 ring=9 tilt=0.35 glow=0 release=3 volume=6 forward=0.2 order=0.1 leftover=0.4 | hall | tune | A hard struck cluster, half spread to octaves, left to ring | bell
Hinges oiled with honey | Half bent keys | material=Squeezed overtones=8 bend=0.8 travel=0.45 attack=0.05 glow=0.7 forward=0.8 tilt=-0.35 release=2 leftover=0.1 swing=0.5 | lowpass | hands | Slow sliding keys that draw nearly apart into the chord
Cutlery for one | Half bent keys | material=Scattered overtones=6 bend=0.5 touch=0.5 ring=2 tilt=-0.35 release=0.8 glow=0.1 volume=6 forward=0.4 leftover=0.05 swing=0.25 | parlour | hands | Small scattered clinks, half gathered
Screws between strings | Half bent keys | material=Scattered overtones=10 bend=0.35 touch=0.7 ring=1 tilt=-0.5 release=0.5 air=0.1 spread=0.4 volume=4 forward=0.7 swing=0.3 | centre | roll | Each key has a clang of its own and is hardly in the chord
Snow on the keyboard | Half bent keys | material=Scattered overtones=8 bend=0.65 attack=0.02 ring=5 tilt=-0.45 glow=0.5 air=0.4 release=3 volume=-1.5 order=0.1 forward=0.35 swing=0.25 | fog | answer | Soft breathing keys with a scatter that nearly agrees
Museum of small keys | Half bent keys | material=Scattered goal=Own_series overtones=5 bend=0.75 touch=0.4 ring=3 glint=0.8 release=1 volume=4 tilt=-0.85 forward=0.7 | sampler | tune | Clear small tones that almost reach their own series and chime
Marbles in the piano | Half bent keys | material=Scattered goal=Octaves overtones=12 bend=0.55 manner=0.8 travel=0.3 touch=0.45 tilt=-0.5 glow=0.3 volume=5.5 order=0.1 forward=0.35 leftover=0.45 air=0.14 | pebble | hands | Scattered tones that hop half of the way and roll off
Sunday under blankets | Half bent keys | material=Bell overtones=6 bend=0.6 attack=0.08 touch=0.05 glow=0.75 tilt=-0.65 release=3 air=0.15 order=0.1 leftover=0.1 manner=0.25 swing=0.4 | padded | hands | Very soft dark keys that swell to most of a chord
Rain delay | Half bent keys | material=Bar goal=Own_series overtones=8 bend=0.5 attack=0.04 glow=0.6 leftover=0.6 release=4 tilt=-0.2 volume=2 order=0.4 manner=0.35 swing=0.35 | wet | answer | Slow bars that sound on, wavering, half bent
Lamps along the canal | Half bent keys | material=Plate overtones=4 bend=0.7 attack=0.12 glow=0.85 tilt=-0.5 glint=0.6 release=2.5 volume=-1.5 forward=0.6 order=0.75 leftover=0.12 swing=0 | quiet | sixths | Four plate tones that light up one by one, slightly off
Paper lanterns | Half bent keys | material=Bar goal=Octaves overtones=6 bend=0.8 attack=0.06 air=0.5 glow=0.7 tilt=-0.1 spread=0.9 volume=-1 forward=0.3 order=0.45 leftover=0.4 manner=0.2 | flock | tworooms | Airy keys, nearly octaves, with the stroke taken off
Hotel lobby at four | - | overtones=7 bend=0.55 attack=0.02 again=0 glow=0.7 touch=0.2 tilt=-0.4 release=1.8 leftover=0.45 swing=0 | ensemble | hands | Mellow bell keys that keep half of their metal
Change of mind | Half bent keys | bend=0.9 again=-0.9 rest=0.6 overtones=6 glow=0.7 travel=0.6 release=3 tilt=-0.1 volume=0 leftover=0.35 manner=0.3 air=0.16 | bed | lean | Keys that come almost to the chord and then think better of it
Returning a book | Half bent keys | material=Bell bend=0.7 again=-0.6 rest=1.5 manner=-0.7 overtones=8 glow=0.6 touch=0.35 release=4 volume=0 order=0.7 forward=0.35 swing=0.35 air=0.12 | loop | answer | Bell tones that sink back to where they came from, then return
Wanted and unwanted | Half bent keys | material=Stretched bend=0.6 again=-1 rest=0.3 overtones=9 glow=0.5 travel=0.2 tilt=-0.2 release=2 volume=1 order=0.55 leftover=0.6 manner=0.2 | onwater | tworooms | Wire tones that go to and fro between the chord and not
Passing the salt | Half bent keys | material=Squeezed bend=0.65 again=0.8 rest=0.5 overtones=5 glow=0.8 attack=0.02 travel=0.4 tilt=-0.2 order=0.9 forward=0.4 leftover=0.3 swing=0.25 volume=-1 | pan | hands | Close tones handed from one place in the chord to the next
Second thoughts in tin | Half bent keys | material=Plate bend=0.5 again=0.5 rest=0.9 manner=0.4 overtones=7 glow=0.5 touch=0.5 tilt=-0.45 volume=1 order=0.2 forward=0.2 leftover=0.05 | glinting | answer | Half bent plates that hop on after a moment
Coal scuttle | Squeezed bass | material=Bar bend=0.5 overtones=7 touch=0.7 glow=0.15 ring=2.5 release=0.5 tilt=0.1 volume=1 forward=0.6 order=0.15 rest=3 air=0.16 | valve | figure | Low struck bars, half bent, with a knock | bass
Cable car going down | Squeezed bass | material=Stretched goal=Own_series bend=0.6 overtones=9 touch=0.5 glow=0.4 ring=4 tilt=-0.2 release=1.2 volume=-2.5 forward=0.4 order=0.15 leftover=0.35 manner=0.3 swing=0 | stack | walk | Low slack wire that is pulled most of the way straight | bass
Grandfather's reach | Half bent keys | material=Bell bend=0.45 overtones=10 touch=0.5 ring=12 glow=0.3 tilt=-0.5 release=2.5 leftover=0.3 order=0.2 forward=0.6 manner=0.2 swing=0.35 | giant | walk | Great low bells, less than half persuaded | bell
Treble clef in chalk | Half bent keys | overtones=4 bend=0.55 touch=0.5 ring=3 tilt=-0.4 glint=0.7 air=0.25 release=1.5 volume=6 order=0.45 forward=0.2 leftover=0.45 swing=0 | dust | high | High dry bars with a chalky breath and a spark | bell
Icicle keyboard | Half bent keys | material=Stretched overtones=5 bend=0.5 touch=0.2 ring=2 glint=0.75 glow=0.1 release=2 volume=6 tilt=-0.8 order=0.75 forward=0.7 leftover=0.35 swing=0.2 | stars | high | Thin high wires, half drawn in, with long bright chimes | bell
Knitting machine | Half bent keys | manner=1 bend=0.6 again=0.7 rest=0.25 overtones=6 glow=0.6 travel=0.2 touch=0.3 release=1 volume=3.5 air=0.16 | stitches | lean | Small strokes that go on stitching tones nearly in place
Typist's chord | Half bent keys | material=Stretched manner=0.9 bend=0.75 overtones=5 glow=0.5 touch=0.4 travel=0.5 release=0.6 tilt=-0.3 volume=2 order=1 leftover=0.35 | throb | common | Wire keys that tick in steps toward the chord
Counting house | Half bent keys | material=Plate manner=0.7 goal=Octaves bend=0.4 overtones=9 ring=3 touch=0.45 tilt=-0.4 travel=0.3 volume=6 swing=0.4 | canon | tune | Plate tones counted out in steps, not as far as the octave
Elbows on the lid | Half bent keys | material=Squeezed manner=0.5 goal=Bass_series bend=0.5 overtones=10 touch=0.65 glow=0.35 tilt=-0.1 release=1.5 order=0 leftover=0.35 swing=0.5 | worn | tworooms | Clustered keys leaning on a low root, half way there
Umbrella stand | Half bent keys | material=Scattered manner=-1 bend=0.7 overtones=7 travel=0.4 glow=0.6 touch=0.4 tilt=-0.4 release=2 volume=0.5 order=0.1 leftover=0 | hang | hands | Scattered tones that fade out and come up again nearer the chord
`,
    },
    {
      id: 'squeezed-bass',
      name: 'Squeezed bass',
      category: 'bass',
      rows: `
Under the viaduct | Squeezed bass | overtones=6 travel=0.4 glow=0.8 tilt=-0.5 release=0.8 attack=0.03 volume=-7 order=1 leftover=0.12 rest=0.5 | firm | walk | A close crowd of tones that gathers into one round root
Parking level four | Squeezed bass | overtones=3 glow=0.95 tilt=-0.8 attack=0.06 spread=0 leftover=0 release=0.3 volume=-6 order=0.05 rest=6 | centre | figure | Three dark tones and a root, as plain as can be
Basement skylight | Squeezed bass | overtones=12 travel=0.35 tilt=0.4 glow=0.6 leftover=0.5 spread=0.5 release=1.2 volume=-5.5 again=0.5 order=0.05 forward=0.1 rest=5 manner=0.25 swing=0 | chorus | walk | A bass with a wide restless crown that comes down to its root
Coal hole | Squeezed bass | overtones=8 glow=0.2 ring=1.5 touch=0.8 tilt=0.1 travel=0.12 release=0.25 volume=-2.5 forward=0.35 swing=0 | booth | figure | A short thick stroke that is only root when it ends
Retired foghorn | Squeezed bass | overtones=5 attack=0.35 swing=0.8 glow=1 tilt=0.4 release=1.5 leftover=0.6 volume=-5.5 order=0.1 rest=2.5 | darkecho | floor | A slow horn of close tones that leans, rocks and holds
Pressed velvet | Squeezed bass | goal=Own_series overtones=7 travel=0.2 glow=0.7 tilt=-0.2 release=0.4 air=0.05 order=0 rest=0.4 swing=0 | warm | walk | Squeezed tones open at once into a plain round bass
Oak and rivets | Squeezed bass | goal=Own_series overtones=10 travel=0.15 touch=0.75 glow=0.45 tilt=0.3 ring=2 volume=-7 order=0.4 forward=0.4 leftover=0.5 rest=4 | iron | figure | A hard close cluster that opens to a full reedy bass
Riverboat boiler | Squeezed bass | goal=Own_series overtones=14 attack=0.08 glow=0.9 leftover=0.9 tilt=0.85 release=0.9 volume=-6 order=0.9 forward=0.65 rest=2.5 | stack | walk | Many reeds, opened out, that shudder against each other
Chord in the cellar | Squeezed bass | goal=Chord overtones=9 travel=0.7 glow=0.75 tilt=0.2 forward=0.9 release=1.5 order=0.4 leftover=0.3 rest=8 manner=0.15 air=0.14 volume=-6.5 | room | deep | Tones of a squeezed bass step forward one by one to join the chord
Pneumatic post | Squeezed bass | goal=Octaves overtones=5 travel=0.07 glow=0.6 touch=0.5 tilt=0.25 release=0.3 spread=0.4 volume=-4.5 order=0.05 leftover=0.12 swing=0 | thick | figure | A small push of close tones, then clean octaves
Anvil for the left hand | Squeezed bass | material=Bar goal=Own_series overtones=5 attack=0.003 touch=0.9 glow=0.2 ring=4 tilt=0.2 release=0.4 volume=0 forward=0.2 order=0.2 leftover=0.3 swing=0 bend=0.8 | console | figure | A hard knock of bar and a low note straight after it
Dock ladder | Squeezed bass | material=Bar overtones=8 touch=0.5 glow=0.4 ring=8 tilt=0 release=2 travel=0.5 volume=-2 order=0.9 leftover=0.35 rest=0.5 swing=0 air=0.12 | spring | walk | Low bars that ring on, and the root there at once
Wooden crane | Squeezed bass | material=Bar goal=Octaves overtones=3 attack=0.015 touch=0.3 glow=0.7 tilt=-0.4 release=0.5 volume=-3 order=0.05 forward=0.3 rest=2.5 manner=0.15 swing=0.35 air=0.12 | wood | walk | A soft dull bar with its octaves, like a plucked box
Rope and tackle | Squeezed bass | material=Bar goal=Chord bend=0.7 overtones=6 glow=0.1 ring=3 touch=0.6 swing=0.6 release=0.7 volume=4.5 order=0.7 forward=0.65 leftover=0.45 rest=1.2 | tight | figure | Short bars that swing toward the chord and do not quite get there
Long pier | Squeezed bass | material=Bar attack=0.2 overtones=10 glow=0.85 air=0.2 leftover=0.4 tilt=0.15 release=2.5 volume=-5.5 order=0.1 rest=2 manner=0.3 swing=0 | late | floor | A bar that swells, with breath, over a root
Submarine bell | Squeezed bass | material=Bell goal=Own_series overtones=8 touch=0.55 glow=0.35 ring=14 tilt=-0.2 release=3 volume=-3.5 travel=0.9 rest=4 swing=0 | crypt | floor | A very low bell that straightens slowly while it rings
Ferry at the ramp | Squeezed bass | material=Bell overtones=4 attack=0.02 glow=0.7 tilt=-0.6 release=0.7 travel=0.2 volume=-0.5 forward=0.6 rest=0.25 manner=0.3 swing=0 | stack | walk | A round low bell over a root, soon settled
Rubber and bronze | Squeezed bass | material=Bell goal=Octaves overtones=6 touch=0.3 attack=0.03 glow=0.5 ring=2 release=0.4 tilt=0 volume=-3 order=0.2 forward=0.25 rest=0.4 manner=0.15 swing=0 | felt | figure | A padded bell that ends on octaves
Cathedral undercroft | Squeezed bass | material=Bell goal=Chord overtones=13 travel=0.7 order=0 glow=0.6 ring=20 tilt=-0.4 release=5 volume=-6 rest=0.4 manner=0.25 swing=0.35 bend=1 | nave | deep | A huge low bell that learns the chord from the bottom up | bell
Hum note | Squeezed bass | material=Bell bend=0 overtones=3 glow=0.9 attack=0.1 tilt=-0.7 leftover=0.8 release=1 volume=-7 forward=0.1 rest=0.4 swing=0 air=0.1 | blanket | walk | Only the hum and two tones of an unbent bell, beating
Sheet steel walk | Squeezed bass | material=Plate goal=Own_series overtones=9 touch=0.6 glow=0.5 ring=3 tilt=-0.35 release=0.6 travel=0.15 volume=-1.5 leftover=0.05 rest=0.25 manner=0.2 swing=0 air=0.14 bend=0.86 | combo | walk | A steel sheet that is a bass before its clang has died
Boiler plate drone | Squeezed bass | material=Plate overtones=13 attack=0.6 glow=0.9 tilt=-0.6 ring=20 release=4 spread=0.8 volume=-5 forward=0.15 leftover=0.3 rest=0.4 | cave | floor | A wide low plate that swells and sinks to a root | drone
Trap door | Squeezed bass | material=Plate overtones=5 attack=0.003 touch=0.8 glow=0.05 ring=1.2 tilt=-0.3 travel=0.06 release=0.25 volume=1.5 forward=0.35 leftover=0.3 rest=1.2 | shade | figure | A dull slam of plate that drops to its root and stops
Barn door in wind | Squeezed bass | material=Plate goal=Octaves bend=0.5 overtones=7 glow=0.7 swing=0.9 leftover=0.7 tilt=-0.5 release=1.5 volume=-4 order=1 forward=0.65 rest=5 air=0.14 | melt | walk | Plate tones that swing half way to octaves and creak
Rolling mill | Squeezed bass | material=Plate goal=Chord overtones=16 travel=0.4 again=0.6 rest=0.4 glow=0.6 tilt=-0.6 release=1 volume=-6.5 forward=0.65 air=0.16 bend=0.85 | valve | deep | A heavy plate whose tones keep moving on through the chord
Slack cable | Squeezed bass | material=Stretched goal=Own_series overtones=10 touch=0.5 glow=0.3 ring=4 tilt=-0.1 release=0.6 travel=0.3 volume=1 order=0.2 leftover=0.6 rest=8 manner=0.3 swing=0 bend=0.85 | reel | walk | A slack low wire that tightens most of the way into tune
Double bass in tar | Squeezed bass | material=Stretched goal=Own_series overtones=6 attack=0.03 touch=0.4 glow=0.25 ring=2.5 tilt=-0.5 release=0.5 volume=2 order=0.15 rest=1.5 bend=0.82 | parlour | figure | A dark plucked wire with a short body
Bowed girder | Squeezed bass | material=Stretched goal=Own_series overtones=12 attack=0.4 glow=1 tilt=0 air=0.15 swing=0.3 release=1 volume=-4.5 order=0.1 leftover=0.35 rest=1.5 bend=1 | vibrato | floor | Stiff wire bowed slowly until its overtones line up | string
Pylon foot | Squeezed bass | material=Stretched overtones=8 touch=0.6 glow=0.6 leftover=0.8 tilt=0.2 release=1.5 travel=0.6 volume=6 forward=0 swing=0 | swirl | walk | Humming wire that beats over a deep root
Piano left outside | Squeezed bass | material=Stretched bend=0.4 goal=Octaves overtones=9 touch=0.65 glow=0.1 ring=6 release=1.2 tilt=-0.15 volume=-1.5 order=0.4 forward=0.25 leftover=0.35 rest=6 swing=0.25 | worn | walk | Low strings, badly out, drawn less than half way back | keys
Well with no bottom | Squeezed bass | material=Scattered overtones=6 attack=0.05 touch=0.4 glow=0.6 tilt=-0.7 release=2 volume=-4.5 travel=1 forward=0.65 leftover=0.1 rest=3 swing=0.25 | stairs | floor | Stray low tones that fall slowly to a root
Gravel in the gutter | Squeezed bass | material=Scattered goal=Own_series overtones=11 touch=0.6 glow=0.3 ring=2 tilt=-0.5 release=0.4 air=0.35 volume=1.5 leftover=0.1 swing=0 | hiss | figure | A gritty scatter that turns at once into a bass note
Cat on the stair | Squeezed bass | material=Scattered goal=Octaves overtones=4 attack=0.02 touch=0.2 glow=0.8 tilt=-0.5 release=0.5 glint=0.5 volume=-3.5 leftover=0.05 rest=6 manner=0.3 swing=0 air=0.14 | mike | walk | A soft low note with a faint chime when its octaves arrive
Storm cellar | Squeezed bass | material=Scattered overtones=9 attack=0.7 air=0.8 glow=0.9 tilt=-0.8 release=3 spread=0.6 volume=-5 order=0.1 forward=0.25 rest=0.5 swing=0.25 | darkhall | floor | Low wind that closes in on a root | wind
Barrels rolling | Squeezed bass | material=Scattered goal=Chord manner=0.7 again=0.5 rest=0.5 overtones=7 glow=0.5 tilt=-0.6 touch=0.5 release=0.8 volume=0 order=0.1 swing=0 bend=0.8 | heads | deep | Scattered low tones that hop and roll on through the chord
Inside the sleeper car | Squeezed bass | attack=0.5 overtones=7 glow=0.95 manner=-0.6 again=-0.4 rest=0.8 tilt=-0.1 release=2 volume=-4.5 forward=0.2 order=0.4 | sigh | floor | A low swell whose tones sink back into the crowd and return
Slow hinge | Squeezed bass | goal=Own_series attack=0.25 travel=2 forward=1 overtones=5 glow=0.9 tilt=0.1 release=1.2 volume=-6 order=0.1 leftover=0.3 swing=0.25 | mike | deep | You can follow each overtone the whole way home
Pilot whale | Squeezed bass | material=Bell goal=Chord attack=0.8 swing=1 overtones=6 glow=1 tilt=-0.2 air=0.1 release=4 volume=-7 order=0.1 forward=0.2 leftover=0.05 rest=2 | under | deep | Bell tones that swim past the low chord and back
Bellows room | Squeezed bass | material=Bar attack=0.4 goal=Octaves manner=-1 overtones=8 glow=1 tilt=0.1 release=1 travel=0.6 volume=-4.5 order=0.2 forward=0.6 leftover=0.12 rest=6 swing=0 air=0.14 | tides | floor | Octaves that come and go like bellows over a low bar
Tunnel breathing | Squeezed bass | material=Plate attack=1 goal=Own_series air=0.6 overtones=8 tilt=-0.3 glow=1 release=3 volume=-1 leftover=0.7 rest=0.4 swing=0.25 bend=0.72 | cistern | deep | A slow breathing low note out of a plate | drone
Pulse in the floor | Squeezed bass | manner=1 again=0.9 rest=0.25 travel=0.2 overtones=6 glow=0.7 tilt=0.2 release=0.6 spread=0.5 volume=-7.5 swing=0 air=0.12 | throb | floor | A root with small strokes over it that never stop
Conveyor | Squeezed bass | material=Bar manner=0.8 goal=Octaves again=0.4 rest=0.6 overtones=9 glow=0.5 touch=0.4 release=0.5 tilt=0.3 volume=2.5 order=0.15 forward=0.1 leftover=0.05 | stitches | floor | Low bars whose octaves go on being tapped along the line
Shunting yard | Squeezed bass | material=Plate manner=0.6 goal=Bass_series again=-0.8 rest=0.5 overtones=7 glow=0.6 tilt=-0.5 touch=0.6 volume=-0.5 order=0.2 leftover=0.35 swing=0.25 | slowing | walk | Plate tones that hop to the root and are knocked off it again
Sump pump | Squeezed bass | material=Stretched manner=0.9 goal=Own_series overtones=5 travel=0.25 glow=0.6 release=0.4 tilt=0.1 glint=0.2 volume=3 order=0.4 forward=0.65 leftover=0.45 rest=1.2 swing=0 bend=0.82 | combo | figure | Wire that ticks its way into a low tone
Clay drum tuned late | Squeezed bass | overtones=4 attack=0.003 touch=1 glow=0 ring=0.9 travel=0.05 release=0.25 tilt=-0.4 volume=6 forward=0.5 rest=0.4 swing=0 | chamber | figure | A struck close body that is in tune for a moment and gone | drum
Demijohn | Squeezed bass | goal=Octaves air=0.9 attack=0.12 overtones=5 glow=1 tilt=0.5 release=0.6 volume=-1.5 leftover=0.3 rest=1.5 manner=-0.12 | pillow | walk | Breath over a low neck, opening into octaves | wind
Half a tuba | Squeezed bass | bend=0.55 air=0.25 attack=0.09 overtones=11 glow=0.95 tilt=0.6 release=0.4 swing=0.4 volume=4.5 forward=0.1 leftover=0.35 rest=0.4 manner=0.15 | downhall | figure | A breathy crowd of low tones that half becomes a horn
Earth return | Squeezed bass | material=Bell bend=0.3 overtones=10 glow=0.8 leftover=1 tilt=0.1 attack=0.02 release=0.8 volume=6 forward=0.1 rest=3 manner=0.35 swing=0.4 | harmtrem | walk | A low bell hardly bent, its tones beating as fast as they can
Moss on the weir | Squeezed bass | goal=Bass_series material=Bar bend=0.8 overtones=5 attack=0.15 tilt=-0.9 glow=0.9 release=1.5 air=0.1 volume=-16.5 order=0 rest=2.5 manner=0.25 swing=0 | darkwater | walk | Very dark soft bars, almost on their root
Lead weight | Squeezed bass | material=Bell goal=Bass_series overtones=3 touch=0.65 attack=0.006 glow=0.3 ring=1.5 tilt=-0.9 release=0.3 spread=0.1 volume=-2 order=0.7 forward=0.25 leftover=0.35 rest=0.25 air=0.12 | below | figure | A short blunt bell with nothing but root after it
`,
    },
    {
      id: 'never-resting',
      name: 'Never resting',
      category: 'pad',
      rows: `
Harbour office | Never resting pad | overtones=8 again=1 rest=0.5 travel=0.6 attack=0.5 tilt=-0.3 glow=0.9 leftover=0.4 swing=0 touch=0.68 bend=0.88 | water | lean | Bell tones that never stop changing places in the chord
Slow traffic at dusk | Never resting pad | overtones=5 again=0.9 rest=1.5 travel=1 attack=0.9 tilt=-0.5 glint=0 forward=0.8 order=0.4 leftover=0.05 swing=0.5 air=0.12 touch=0.4 bend=0.72 | undertow | lean | One of five soft tones is always on its way, slowly
Conversation in shade | Never resting pad | overtones=11 again=0.8 rest=0.3 travel=0.4 attack=0.3 glow=0.8 manner=-0.2 tilt=-0.45 order=0.1 forward=0.65 leftover=0.06 swing=0.22 bend=0.88 | parlour | tworooms | Many tones that trade places quickly and quietly
Tenants moving out | Never resting pad | overtones=7 again=1 rest=5 travel=0.8 attack=1.2 order=1 forward=1 tilt=-0.2 volume=-2 leftover=0.1 swing=0.25 bend=0.88 | chamber | neighbour | Now and then one high tone rises out of the pad and goes elsewhere
Corridor with clocks | Never resting pad | overtones=13 again=0.6 rest=0.7 glint=0.7 attack=0.6 travel=0.5 tilt=-0.35 forward=0.25 leftover=0.6 swing=0 air=0.18 touch=0.3 bend=0.82 | glimmer | neighbour | Tones that wander through the chord and chime at each stop
Out with the tide | Never resting pad | material=Plate overtones=10 again=-0.9 rest=0.8 travel=0.5 attack=0.8 tilt=-0.5 glow=0.8 order=0.4 volume=-3 | surf | lean | Plate tones that agree, go back to metal and agree again
Returning swallows | Never resting pad | material=Plate goal=Octaves overtones=7 again=-1 rest=0.4 travel=0.6 attack=0.5 tilt=-0.4 glint=0.4 order=0.2 forward=0.65 leftover=0.3 swing=0.35 air=0.2 touch=0.3 bend=0.88 | ripples | neighbour | Tones that keep leaving for the plate and flying home, nearly to octaves
Forget and remember | Never resting pad | material=Bell goal=Own_series overtones=7 again=-0.7 rest=2 travel=0.6 attack=1 glow=0.9 manner=-0.8 volume=-1.5 order=0.8 leftover=0.12 swing=0.35 touch=0.15 | recall | tworooms | A bell that comes and goes between itself and an organ
Iron in the weather | Never resting pad | material=Plate goal=Bass_series overtones=10 again=-0.8 rest=0.6 travel=0.5 attack=1 tilt=-0.7 leftover=0.6 forward=0.2 bend=0.86 | wet | seconds | Heavy dark plate that settles over a root and rusts back
Unravelled sleeve | Never resting pad | material=Stretched overtones=8 again=-1 rest=1 travel=0.45 attack=0.7 tilt=-0.3 swing=0.5 order=0.9 forward=0.8 leftover=0.6 bend=0.88 volume=3 | drifttape | common | Wire tones pulled toward the chord that spring loose one by one
Lungs of the house | Never resting pad | manner=-1 overtones=6 again=0.8 rest=0.5 travel=0.9 attack=1 tilt=-0.4 air=0.35 order=0.75 swing=0.2 bend=0.82 volume=0.5 | sigh | lean | Each tone sinks out of sight, moves and rises again
Dissolving stair | Never resting pad | manner=-0.9 goal=Octaves overtones=10 again=1 rest=0.3 travel=0.9 attack=0.6 tilt=-0.25 air=0.18 bend=1 | blur | stair | Octaves that fade from one place and come up in another
Ghost in the linen | Never resting pad | manner=-0.8 material=Bar overtones=4 again=0.9 rest=1 travel=0.5 attack=0.7 air=0.6 glow=1 tilt=-0.1 volume=-0.5 order=0.45 forward=0.1 swing=0.35 bend=0.88 | fog | voices | Four breathy tones that go out and come back somewhere near
Cream into coffee | Never resting pad | manner=-0.6 material=Squeezed overtones=9 again=0.6 rest=0.6 travel=0.35 attack=0.4 tilt=0.1 glow=0.9 order=0.45 forward=0.35 leftover=0.1 swing=0 | warm | common | Close tones that melt outward into the chord and stir about in it
Slow blink | Never resting pad | manner=-1 goal=Own_series overtones=3 again=-0.8 rest=1.5 travel=2.4 attack=0.8 tilt=-0.3 glow=1 forward=0.5 air=0.14 | halo | lone | Three overtones that shut and open over a plain note
Midges over water | Never resting pad | manner=0.7 overtones=9 again=1 rest=0.25 travel=0.2 attack=0.15 tilt=-0.5 spread=1 glint=0 volume=0 order=0.7 leftover=0.45 swing=0.25 bend=0.82 | onwater | lone | A cloud of tiny strokes hopping over one note | texture
Switchboard after two | Never resting pad | manner=1 material=Stretched overtones=6 again=1 rest=0.4 travel=0.5 attack=0.05 tilt=-0.4 glow=0.5 release=2 volume=0 order=0.7 forward=0.8 leftover=0.1 swing=0 | fan | tworooms | Stepping tones that plug in and out around the chord
Rain on a skylight | Never resting pad | manner=0.8 material=Scattered overtones=12 again=0.7 rest=0.25 travel=0.3 attack=0.3 tilt=-0.75 air=0.2 volume=-0.5 order=0.2 forward=0.65 leftover=0.3 swing=0.3 touch=0.4 bend=0.88 | wet | seconds | Scattered drops that fall on one tone of the chord and then the next | texture
Bead frame | Never resting pad | manner=1 material=Bar goal=Octaves overtones=5 again=0.8 rest=0.5 travel=0.6 attack=0.02 glow=0.6 release=1.5 tilt=-0.2 volume=1 forward=0.2 leftover=0.4 swing=0 touch=0.35 bend=1 | booth | lone | Dry small bars that keep counting up and down in octaves | texture
Hemp yard | Never resting pad | manner=0.5 material=Plate overtones=8 again=0.9 rest=0.35 travel=0.4 attack=0.4 tilt=-0.6 glow=0.7 volume=2 order=0.7 forward=0.7 leftover=0.3 air=0.12 touch=0.72 bend=0.82 | stitches | seconds | Plate tones that hop along the chord in uneven strokes
Pendulum room | Never resting pad | swing=1 overtones=6 again=0.5 rest=1.2 travel=0.8 attack=0.6 manner=0 tilt=-0.3 order=1 forward=0.4 leftover=0.1 volume=-2 | chamber | lean | Everything that has settled swings, each key at its own rate
Seasick deckhand | Never resting pad | swing=0.9 material=Squeezed overtones=8 again=0.8 rest=0.6 travel=0.4 attack=0.5 tilt=-0.1 leftover=0.6 forward=0.35 air=0.22 | flock | common | A rolling crowd that overshoots wherever it goes
Trapeze before the show | Never resting pad | swing=0.85 goal=Octaves overtones=7 again=1 rest=0.8 travel=0.7 forward=1 attack=0.3 tilt=-0.4 glint=0.5 order=0.75 air=0.18 bend=1 | brighthall | neighbour | One tone after another flies past its octave and is caught
Cradle in the engine | Never resting pad | swing=0.8 material=Bar goal=Own_series overtones=9 again=0.4 rest=0.5 attack=0.8 tilt=-0.2 air=0.15 glow=1 travel=0.4 order=0.3 leftover=0.1 touch=0.3 bend=0.88 volume=2 | turning | voices | A sung pad that rocks gently and goes on moving
Two hammocks | Never resting pad | swing=0.7 material=Bell goal=Bass_series overtones=5 again=-0.6 rest=2 attack=1.2 tilt=-0.5 glow=0.95 order=0.05 forward=0.6 air=0.2 touch=0.72 | pan | seconds | A low pad whose tones swing over the root, leave it and swing back
Weather in the next room | Never resting pad | air=0.8 overtones=9 again=0.9 rest=0.6 travel=1 attack=1.1 tilt=-0.5 glint=0 volume=0.5 forward=0.65 leftover=0.4 touch=0.72 bend=0.85 | steps | lean | Tuned wind that keeps changing its mind about the chord
Draughts below deck | Never resting pad | air=0.7 goal=Bass_series material=Plate overtones=7 again=-0.5 rest=1 attack=0.8 tilt=-0.7 volume=0.5 forward=0.3 leftover=0 swing=0 bend=0.86 | cistern | deep | Dark wind over a root, never quite still
Curtains breathing | Never resting pad | air=0.9 manner=-0.7 material=Scattered overtones=6 again=1 rest=0.5 travel=0.6 attack=0.7 tilt=-0.6 volume=-1.5 order=0 bend=0.72 | bare | voices | Six soft winds that rise and fall as they change places | voice
Papers on a windowsill | Never resting pad | air=0.6 manner=0.6 overtones=11 again=0.8 rest=0.3 travel=0.3 attack=0.2 tilt=-0.4 spread=0.95 volume=-1 forward=0.1 leftover=0.3 bend=0.84 | airy | neighbour | Breath that flutters from tone to tone, close by
Steam before singing | Never resting pad | air=0.5 material=Stretched goal=Own_series overtones=10 again=0.6 rest=0.8 attack=0.9 tilt=-0.35 swing=0.4 travel=0.4 order=0.2 leftover=0.35 bend=0.88 | choirhall | voices | Breathing wire that comes into line and wavers on
Clockwork orchard | Never resting pad | attack=0.01 overtones=7 again=0.9 rest=0.4 travel=0.4 glow=0.6 touch=0.5 release=2.5 tilt=-0.25 volume=-1.5 order=1 leftover=0.05 bend=0.78 | tight | roll | A struck bell whose overtones stroll about the chord afterward | keys
Pennies in the basin | Never resting pad | attack=0.004 material=Plate overtones=9 again=1 rest=0.25 travel=0.25 glow=0.5 touch=0.4 glint=0.8 tilt=-0.5 forward=0.6 order=0.1 leftover=0.35 swing=0.4 bend=0.82 volume=-2 | stars | hands | Struck plates that go on chiming through the chord | keys
Marionette at rehearsal | Never resting pad | attack=0.006 material=Bar overtones=5 again=0.8 rest=0.6 manner=0.4 glow=0.55 release=1.2 touch=0.6 volume=-1 travel=0.35 order=0.8 swing=0.4 air=0.12 bend=0.88 | room | hands | Bars whose overtones jerk from chord tone to chord tone | keys
Gossip at the pump | Never resting pad | attack=0.005 material=Squeezed overtones=6 again=1 rest=0.3 travel=0.2 glow=0.7 tilt=0.1 release=1 order=0.6 forward=0.15 leftover=0.12 air=0.14 | console | hands | Struck close tones, at once all over the chord and never still | keys
Letters never sent | Never resting pad | attack=0.02 material=Stretched overtones=8 again=-0.9 rest=0.7 travel=0.5 glow=0.5 touch=0.3 release=3 tilt=-0.45 volume=1 bend=0.82 | loop | answer | Soft wire keys that come near the chord and drift off it as they are held | keys
Planetarium dust | Never resting pad | goal=Own_series overtones=16 again=0.7 rest=0.4 travel=0.35 attack=0.7 tilt=-0.5 spread=1 glint=0.3 volume=5.5 order=0.7 leftover=0.35 air=0.14 bend=0.84 | dust | lean | A wide crowd of overtones turning over in each key's own series
Treadmill of light | Never resting pad | goal=Own_series material=Plate overtones=12 again=0.9 rest=0.3 travel=0.5 attack=0.4 tilt=-0.55 forward=0.7 order=0.3 leftover=0.3 air=0.2 touch=0.3 bend=0.86 | fallripple | neighbour | Overtones step forward in turn, over and over
Fourth floor humming | Never resting pad | goal=Own_series material=Bar overtones=6 again=0.5 rest=1 travel=0.5 attack=0.5 air=0.1 glow=1 tilt=-0.25 forward=0 volume=0 order=0 leftover=0.06 swing=0 bend=1 | centre | voices | A plain hum whose overtones take turns
Escalator at closing | Never resting pad | goal=Octaves material=Squeezed overtones=8 again=0.9 rest=0.5 travel=0.7 attack=0.5 tilt=0.5 glow=0.9 order=0.5 swing=0.35 air=0.18 | ascent | stair | Close tones that go up and down to octaves without arriving for good
Lighthouse keeper's tea | Never resting pad | goal=Bass_series overtones=9 again=0.7 rest=4 travel=0.6 attack=0.6 tilt=-0.2 glow=0.9 order=0.05 forward=0.1 leftover=0.03 swing=0 | amptrem | lean | Once in a while a tone sweeps round over a steady root
Nervous system | Never resting pad | overtones=19 again=1 rest=0.25 travel=0.1 attack=0.3 tilt=-0.35 spread=1 glint=0.1 glow=0.6 leftover=0.5 air=0.18 bend=0.86 volume=-1.5 | shade | lean | Nineteen tones, all restless, in a pad that shimmers close by
Last one to leave | Never resting pad | overtones=3 again=1 rest=0.3 travel=1 attack=0.8 tilt=-0.4 glow=1 forward=0.9 order=0.9 leftover=0.45 swing=0.35 air=0.22 touch=0.3 bend=0.78 | parlour | neighbour | Three tones, one of which is always getting up to go
Long division | Never resting pad | overtones=14 again=0.5 rest=10 travel=12 attack=1 tilt=-0.5 order=0.5 glow=0.9 volume=-1.5 leftover=0.4 swing=0.4 air=0.18 bend=0.85 | space | neighbour | A broad pad in which one change takes twelve seconds
Parliament of wire | Never resting pad | material=Stretched overtones=17 again=0.8 rest=0.25 travel=0.25 attack=0.5 tilt=-0.75 leftover=0.8 order=0 swing=0.4 touch=0.35 bend=0.82 volume=-0.5 | darkplate | tworooms | A dark house full of wire where no vote is ever final
Undecided bronze | Never resting pad | material=Squeezed goal=Chord overtones=12 again=-1 rest=0.25 travel=0.8 attack=0.4 tilt=0.15 leftover=0.4 volume=6 order=0.3 forward=0.2 swing=0.4 air=0.16 touch=0.7 | swirl | lean | Bronze that is in and out of the chord all the time
Half way to the chord | Never resting pad | bend=0.5 overtones=8 again=0.9 rest=0.6 travel=0.9 attack=0.6 tilt=-0.35 leftover=0.3 volume=4.5 order=1 forward=0.2 | glacial | tworooms | Tones that go half of each way and turn to the next
Unsettled estate | Never resting pad | bend=0.35 material=Plate overtones=10 again=-0.8 rest=1 attack=1.2 tilt=-0.7 glow=0.9 order=0.05 forward=0.15 air=0.22 volume=-2 | darkfield | seconds | A dark plate that starts toward the chord and gives up
Drifting lanes | Never resting pad | bend=0.7 material=Bar goal=Octaves overtones=9 again=0.8 rest=0.4 travel=1.2 attack=0.4 tilt=-0.15 spread=1 volume=-1.5 forward=0.4 swing=0.5 | pan | neighbour | Bar tones that nearly make octaves, always changing lanes
Milky glass lift | Never resting pad | bend=0.8 material=Scattered goal=Own_series overtones=7 again=0.6 rest=0.8 attack=0.9 tilt=-0.6 air=0.4 volume=-2 forward=0.2 leftover=0.1 swing=0.4 | stretch | stair | Pale tones that rise close to the series and shift again
Anchor watch | Never resting pad | bend=0.6 goal=Bass_series material=Bell overtones=6 again=-0.9 rest=0.6 attack=0.5 tilt=-0.3 glow=0.95 order=0.1 forward=0.1 leftover=0.4 air=0.22 touch=0.72 | trail | deep | A low bell that keeps almost coming home to its root
`,
    },
    {
      id: 'stepped-glass',
      name: 'Stepped glass',
      category: 'bell',
      rows: `
Greenhouse stair | Stepped glass | overtones=5 travel=0.5 touch=0.35 glint=0.5 tilt=-0.3 ring=4 volume=2.5 order=0.05 leftover=0.45 swing=0.3 bend=1 | plate | sixths | Wire glass that hops to its octaves in a few soft strokes
Bottle tree | Stepped glass | overtones=9 travel=0.35 forward=1 touch=0.5 ring=6 tilt=-0.4 spread=1 volume=2.5 order=0.6 bend=0.8 | stars | peal | Stiff glass whose tones step out one by one on either side
Chemist's window | Stepped glass | goal=Chord overtones=7 travel=0.7 glint=0.8 touch=0.3 tilt=-0.65 glow=0.7 volume=4 leftover=0.1 swing=0.35 | halo | sixths | Clear tones that step to the chord and stay there with a chime
Broken thermometer | Stepped glass | goal=Own_series overtones=12 travel=0.3 manner=0.8 touch=0.45 release=2 volume=3 tilt=-0.85 order=0.9 leftover=0.06 swing=0.35 bend=0.8 | bare | drops | Small quick steps that run down a thin glass rod
Skylight at noon | Stepped glass | overtones=4 travel=0.9 order=1 glow=0.8 attack=0.03 tilt=-0.6 swing=0.4 volume=2.5 bend=0.88 | brighthall | sixths | Four glass tones that take slow stairs from the top down, and stop on the last but one
Carillon lesson | Stepped glass | material=Bell goal=Chord overtones=8 travel=0.3 touch=0.5 ring=8 tilt=-0.15 glint=0.4 volume=1.5 swing=0.4 air=0.16 | valley | peal | Bell tones climb in steps to the chord while the peal goes on
Post office clock | Stepped glass | material=Bell goal=Octaves overtones=5 travel=0.4 touch=0.65 ring=5 glint=0.2 glow=0.4 tilt=-0.3 volume=1 order=0.75 leftover=0.06 swing=0 | booth | tune | A plain bell whose overtones walk to their octaves
Bell ladder | Stepped glass | material=Bell goal=Own_series overtones=14 travel=0.4 order=0 touch=0.45 tilt=0.1 ring=10 volume=1.5 leftover=0.35 swing=0.35 air=0.16 | hall | sixths | A bell that steps into its own series rung by rung from the bottom
Spring on the shop door | Stepped glass | material=Bell overtones=3 travel=0.2 touch=0.7 ring=1.5 release=0.8 glow=0.1 volume=-2 tilt=-0.2 forward=0.5 order=0.5 | spring | tune | A short shop bell with three steps in it
Noon bell downstairs | Stepped glass | material=Bell goal=Bass_series overtones=9 travel=0.45 touch=0.3 ring=14 glow=0.6 tilt=-0.3 release=6 order=0.05 | stairs | sixths | A soft bell that steps down toward a root
Chopsticks on jars | Stepped glass | material=Bar overtones=5 travel=0.3 touch=0.6 ring=3 glow=0.3 release=1 tilt=-0.1 volume=5 order=0.05 air=0.12 bend=0.84 | booth | drops | Tapped bars whose overtones tap again on their way to octaves
Wooden rain | Stepped glass | material=Bar goal=Chord overtones=8 travel=0.2 manner=0.9 again=0.6 rest=0.3 glow=0.4 tilt=-0.4 volume=1.5 order=0.7 leftover=0.3 air=0.14 bend=0.72 | felt | drops | Small strokes that go on falling after each drop
Puppet theatre bells | Stepped glass | material=Bar goal=Own_series overtones=11 travel=0.2 touch=0.8 ring=5 glint=0.9 tilt=0.2 volume=0.5 order=0.9 leftover=0.45 swing=0 bend=0.85 | tin | tune | Bright struck bars that step up toward their own series, chiming
Stopped metronome | Stepped glass | material=Bar overtones=3 travel=0.9 touch=0.4 ring=7 glow=0.5 swing=0.5 tilt=-0.2 volume=2.5 leftover=0.12 | mike | answer | Three slow ticks between a stroke and its rest
Chalk marks | Stepped glass | material=Bar goal=Octaves overtones=7 travel=0.15 air=0.5 touch=0.5 glow=0.2 ring=2 release=0.6 volume=3 order=0.2 | dust | tune | Dry breathy bars that step quickly home
Brass rain gauge | Stepped glass | material=Plate overtones=9 travel=0.25 touch=0.4 ring=5 tilt=-0.5 glint=0.3 volume=0 order=0.6 leftover=0.3 swing=0.3 bend=0.76 | pebble | drops | Plate drops that hop as they fall
Cymbal in a stairwell | Stepped glass | material=Plate goal=Chord overtones=16 travel=0.2 touch=0.6 ring=12 tilt=-0.65 glow=0.4 volume=2 order=0.05 swing=0.22 air=0.16 | stairs | sixths | A broad soft cymbal whose tones find the chord in small steps
Temple kitchen | Stepped glass | material=Plate goal=Own_series overtones=6 travel=0.6 touch=0.5 ring=9 glow=0.5 tilt=-0.3 leftover=0.5 volume=4.5 | room | answer | A struck pan that steps toward a note and keeps a beat
Sheet of mica | Stepped glass | material=Plate goal=Octaves overtones=12 travel=0.25 touch=0.25 ring=3 tilt=-0.35 air=0.15 release=3 volume=-1.5 order=0.9 swing=0.3 bend=0.8 | bare | high | Flaking plate tones that step lightly toward octaves
Gong on rollers | Stepped glass | material=Plate goal=Bass_series overtones=10 travel=1.5 touch=0.7 ring=20 tilt=-0.7 glow=0.5 order=0.75 air=0.16 volume=-2 | cave | lone | A gong whose tones are trundled step by step to a root
Village of bronze | Stepped glass | material=Squeezed goal=Chord overtones=8 travel=0.5 touch=0.6 ring=7 tilt=0.15 leftover=0.6 swing=0.25 air=0.12 | chamber | peal | Close beating bronze that comes apart in steps into the chord
Pair tuned apart | Stepped glass | material=Squeezed overtones=3 travel=0.8 touch=0.5 ring=10 leftover=1 glow=0.3 tilt=0.8 order=0.1 swing=0 air=0.1 | thick | peal | Two bronzes that should be one, stepping and shimmering
Courtyard orchestra | Stepped glass | material=Squeezed goal=Octaves overtones=12 travel=0.3 touch=0.5 ring=4 tilt=0.5 glint=0.5 leftover=0.3 bend=0.76 | glinting | tune | Bright bronze keys that spread toward octaves in small hops
Incense clock | Stepped glass | material=Squeezed goal=Own_series overtones=6 travel=2 touch=0.35 ring=14 glow=0.5 tilt=-0.1 order=0.2 forward=0.7 leftover=0.1 bend=0.6 | late | lone | A slow bronze that opens one notch at a time
Lacquer tray | Stepped glass | material=Squeezed goal=Bass_series overtones=9 travel=0.6 touch=0.4 ring=5 glow=0.6 tilt=-0.5 release=2 order=0.15 leftover=0.5 swing=0.4 | warm | answer | Dull close metal put down step by step on a root
Porch in a gale | Stepped glass | material=Scattered goal=Chord overtones=7 travel=0.3 touch=0.6 ring=9 tilt=-0.75 again=0.6 rest=0.4 volume=0 leftover=0.45 swing=0 bend=0.88 | wet | drops | Chimes blown about that keep brushing the chord
Keys on a ring | Stepped glass | material=Scattered overtones=10 travel=0.2 touch=0.4 ring=1.5 glow=0.2 release=1 volume=0 tilt=-0.8 order=0.05 bend=0.8 | airy | drops | A bunch of small metal that jingles near its octaves and is put away
Nine chimes in one wind | Stepped glass | material=Scattered goal=Own_series overtones=9 travel=0.4 touch=0.25 ring=12 tilt=-0.95 air=0.35 glow=0.6 volume=1 forward=0.3 order=0.1 | space | sixths | Nine soft chimes with breath on them, stepping into one tone
Ballroom lights down | Stepped glass | material=Scattered overtones=14 travel=0.25 order=1 touch=0.5 tilt=-0.65 glint=0.7 spread=1 volume=1.5 leftover=0.5 air=0.12 | bloom | roll | A wide trembling scatter that is let down to octaves in steps
Needle tin | Stepped glass | material=Scattered goal=Chord overtones=4 travel=0.4 touch=0.7 ring=2.5 volume=-1 glint=0.7 tilt=-0.9 order=1 leftover=0.4 swing=0 bend=0.6 | chamber | tune | Four sharp little tones and the bright chimes they end on
Foundry at rest | Cooling plate | overtones=12 travel=1.4 touch=0.5 ring=25 tilt=-0.35 glow=0.8 leftover=0.05 forward=0.35 swing=0 air=0.1 goal=Octaves | nave | lone | A plate that comes to octaves from the top down and is still by the end
Slag and stars | Cooling plate | overtones=18 travel=0.35 touch=0.9 ring=30 tilt=-0.75 glint=0.6 forward=0.8 manner=0.15 swing=0.35 bend=0.76 | rain | lean | A hard struck dark plate that throws off chimes as it cools
Bell hung in a barn | Cooling plate | material=Bell overtones=10 travel=1.2 touch=0.6 ring=18 tilt=-0.2 glow=0.3 volume=0.5 bend=0.88 | undertow | lone | A great bell left to ring, whose high tones soften first
Kettle lid spun | Cooling plate | material=Squeezed overtones=7 travel=0.6 touch=0.45 ring=9 swing=0.9 tilt=0.9 leftover=0.7 forward=0.2 volume=1.5 | mike | answer | A spun lid that wobbles as its tones come to rest
Railway sleeper bells | Cooling plate | material=Bar overtones=6 travel=0.8 touch=0.6 ring=40 glow=0.3 tilt=-0.1 order=0.8 forward=0.1 swing=0.25 air=0.16 bend=0.6 | wood | sixths | Long ringing bars that let go of their clang slowly
Watchmaker's noon | Ticking tones | overtones=5 travel=0.15 rest=0.3 again=0.8 tilt=-0.4 glint=0.4 volume=3 order=0.75 leftover=0.12 bend=0.72 | mike | high | Tiny strokes that tick from one tone of the chord to another
Crickets in brass | Ticking tones | material=Plate overtones=9 rest=0.25 travel=0.12 tilt=-0.6 spread=1 glow=0.6 volume=4 order=0.45 leftover=0.12 swing=0.35 air=0.22 bend=0.68 | cascade | lone | A field of small plate strokes over a note | texture
Telegraph to nowhere | Ticking tones | material=Stretched goal=Octaves overtones=3 rest=0.5 again=1 travel=0.3 tilt=-0.5 glow=0.6 order=0.6 forward=0.25 leftover=0.5 bend=1 volume=1.5 | transistor | answer | Wire taps in octaves, sent and sent again | texture
Dripping gold | Ticking tones | material=Bell goal=Own_series overtones=7 rest=0.8 again=0.5 release=3 volume=1.5 tilt=-0.75 glint=0.45 order=1 forward=0.4 leftover=0.45 bend=0.76 | cistern | high | Bell drips with a bright chime on the end of some
Loom shed | Ticking tones | material=Squeezed overtones=8 rest=0.25 again=-0.8 travel=0.2 tilt=0 touch=0.5 release=0.7 volume=0.5 order=0.7 forward=0.7 swing=0.35 | stitches | round | Close tones shuttled out to the chord and back | texture
Ice in a tumbler | Stepped glass | manner=0.3 overtones=6 travel=0.35 touch=0.5 ring=1.5 glow=0.1 release=0.9 volume=6 tilt=-0.55 glint=0.3 leftover=0.5 swing=0 bend=0.6 | steps | drops | Short cold drops that slip toward octaves and stop short
Silver thimble | Stepped glass | manner=0 material=Bar goal=Own_series overtones=4 travel=0.1 touch=0.35 glint=0.5 ring=2 tilt=-0.5 volume=3.5 order=0 swing=0 air=0.16 bend=0.8 | halo | high | A small soft tap and a chime well above it
Reading by starlight | Stepped glass | manner=-0.5 material=Bell overtones=6 travel=0.6 touch=0.06 ring=9 glow=0.6 tilt=-0.45 volume=-5.5 order=0.1 leftover=0.12 air=0.12 bend=0.68 | glimmer | high | Very soft bells whose tones fade and come up again nearer to octaves
Prism on a sill | Stepped glass | manner=0.2 goal=Chord overtones=8 travel=0.6 order=0.9 touch=0.4 tilt=-0.5 glint=0.6 spread=1 volume=5.5 bend=0.6 | fan | high | High wire tones that bend toward the chord and spread out
Moth lamp | Stepped glass | manner=0.6 material=Scattered overtones=5 again=1 rest=0.3 travel=0.3 tilt=-0.75 glow=0.7 air=0.3 order=0.15 bend=0.76 | onwater | high | Soft breathing specks that keep knocking at the chord | texture
Deep clock tower | Stepped glass | material=Bell goal=Chord overtones=11 travel=0.3 touch=0.7 ring=20 tilt=-0.35 glow=0.4 release=8 order=0 air=0.1 | crypt | figure | Low bells that step, beat by beat, into what is held
Ship's log | Stepped glass | material=Bar goal=Bass_series overtones=7 travel=0.6 touch=0.5 ring=6 tilt=-0.1 glow=0.5 volume=-1.5 order=0 leftover=0.35 | trail | figure | Low bars with their overtones stepping down to a root
Mountain gong | Stepped glass | material=Plate goal=Own_series overtones=17 attack=0.05 touch=0.6 ring=35 tilt=-0.85 glow=0.6 travel=0.7 leftover=0.6 swing=0.2 | shore | floor | A huge dark gong, struck with a soft beater, stepping into a hum
Quarry at noon | Stepped glass | material=Squeezed overtones=10 attack=0.01 touch=0.95 ring=9 tilt=0.1 glow=0.2 travel=0.4 order=0.05 | slowing | figure | Low struck stone that cracks into octaves in steps
Diver's bell | Stepped glass | material=Bell goal=Octaves bend=0.7 overtones=8 attack=0.04 ring=16 tilt=-0.6 glow=0.6 leftover=0.4 swing=0.22 | under | floor | A low bell not quite brought up to its octaves
`,
    },
    {
      id: 'halo-of-the-bass',
      name: 'Halo of the bass',
      category: 'drone',
      rows: `
Water tower at dusk | Halo of the bass | overtones=10 attack=0.9 travel=0.8 tilt=-0.2 glow=0.85 forward=0.6 release=12 volume=-4 leftover=0.12 rest=2.5 touch=0.3 | space | seconds | A plate swells and hangs its tones over a root that nobody plays
Power station idling | Halo of the bass | overtones=13 attack=1.4 travel=0.6 order=0.5 tilt=-0.65 leftover=0.7 ring=30 rest=3 manner=-0.2 swing=0.3 touch=0.72 volume=-5 | cave | deep | A huge plate that finds its root in no order and goes on beating
Salt flats | Halo of the bass | overtones=6 attack=0.5 travel=1 order=1 tilt=0.1 glow=0.9 air=0.1 spread=1 volume=4.5 forward=0.35 leftover=0.45 rest=3 manner=-0.3 swing=0.3 | airy | lean | A thin wide plate that comes down on its root from far above
Grain elevator | Halo of the bass | overtones=8 attack=0.02 touch=0.95 travel=0.5 glow=0.6 tilt=-0.4 ring=9 release=4 leftover=0.05 rest=5 manner=-0.35 swing=0.22 volume=-4.5 | stack | floor | A heavy struck plate that stays as a hum over a low tone
Aerial on the hill | Halo of the bass | overtones=13 attack=0.8 travel=0.3 tilt=0.3 glint=0.5 spread=0.9 air=0.05 volume=-5 order=0.05 forward=0.2 leftover=0.12 rest=8 | glimmer | neighbour | A bright halo that gets to its root quickly, chiming a little as it does
Bells below the weir | Halo of the bass | material=Bell overtones=9 attack=0.7 travel=1.2 tilt=-0.4 glow=0.9 air=0.1 volume=-5 forward=0.35 rest=0.5 swing=0 touch=0.35 | under | seconds | Bells bowed softly until they stand on one root
Inside of a shell | Halo of the bass | material=Bell overtones=15 attack=1 tilt=0.2 glint=0.6 glow=0.8 travel=0.6 air=0.05 forward=0.3 order=0.1 leftover=0.1 rest=3 manner=-0.2 swing=0 touch=0.4 | octhalo | lean | A bright bell halo with small chimes as it closes on the bass
Vault door | Halo of the bass | material=Bell overtones=5 attack=0.04 touch=0.6 ring=20 glow=0.5 tilt=-0.5 travel=1 rest=0.25 volume=0 | stairs | deep | A thick bell, struck and left, that closes slowly on a root
Light through weed | Halo of the bass | material=Bell overtones=11 attack=1.5 manner=-0.8 travel=0.7 air=0.35 tilt=0.2 volume=-17.5 order=0.1 forward=0.65 rest=4 swing=0 | darkwater | stair | Bell tones that go under and come up again around a root
Hymn board | Halo of the bass | material=Bell overtones=7 attack=0.3 travel=0.4 glow=1 tilt=-0.3 leftover=0.15 release=2.5 air=0 volume=0.5 forward=0 rest=5 swing=0 | parlour | common | A bell soon turned to a plain soft pad on its roots | pad
Barge strings | Halo of the bass | material=Bar overtones=9 attack=0.4 glow=1 tilt=0.2 swing=0.4 leftover=0.4 air=0.1 release=2 forward=0.1 rest=1.5 volume=-2.5 | ensemble | sevenths | Bars bowed into a section that sways over its bass | string
Open cello case | Halo of the bass | material=Bar overtones=6 attack=0.25 glow=0.95 tilt=-0.1 air=0.2 spread=0.4 release=1.5 forward=0.2 leftover=0.12 rest=3 manner=-0.3 touch=0.4 volume=-4 | wood | aria | One bowed bar with its root below | string
Horsehair and frost | Halo of the bass | material=Bar overtones=13 attack=0.8 glow=1 tilt=0.35 air=0.5 leftover=0.5 release=3 volume=-3 forward=0.35 rest=4 manner=-0.45 | frost | voices | Many thin bowed bars, half air, over a cold bass | string
Evening shift viols | Halo of the bass | material=Bar overtones=8 attack=0.25 manner=-0.5 again=0.5 rest=1 glow=0.95 tilt=0 release=2.5 volume=-5.5 forward=0.4 leftover=0.1 swing=0.35 touch=0.35 | room | sevenths | Bowed bars that breathe and change places over their roots | string
Balcony rail | Halo of the bass | material=Bar overtones=4 attack=1.1 swing=0.9 glow=1 tilt=-0.2 air=0 release=4 | pan | lone | Four bowed tones that swing a long way round the root
Fence wire in summer | Halo of the bass | material=Stretched overtones=10 attack=0.6 tilt=-0.2 glow=0.85 leftover=0.5 air=0.1 order=0.1 forward=0.3 rest=5 | thick | seconds | A fence of wire hums itself down onto a low tone
Guy ropes by night | Halo of the bass | material=Stretched overtones=6 attack=1.2 tilt=-0.5 swing=0.7 glow=1 air=0.3 forward=0.4 leftover=0.6 rest=6 manner=-0.35 touch=0.3 volume=-5.5 | tides | deep | A few wires lean past the root and back in the dark
Row of old poles | Halo of the bass | material=Stretched overtones=18 attack=0.9 tilt=-0.55 travel=0.4 order=0 spread=1 glow=0.7 forward=0.3 leftover=0.35 rest=5 swing=0 | valley | lean | A whole row of wires, the lowest first, over one root
Hammered wire altar | Halo of the bass | material=Stretched overtones=8 attack=0.01 touch=0.45 ring=12 glow=0.6 tilt=-0.3 release=5 rest=1.2 manner=0.15 | strings | roll | Struck wire that hangs over its root for a long time | keys
Catenary | Halo of the bass | material=Stretched overtones=12 attack=1.5 forward=1 travel=1 tilt=-0.3 glow=0.9 air=0 volume=-4 leftover=0.7 rest=2.5 swing=0.35 touch=0.68 | bare | stair | Long wires, one after another, sag to their places above the bass
Peat smoke | Halo of the bass | material=Squeezed overtones=8 attack=0.7 tilt=-0.5 leftover=0.6 glow=0.9 air=0.3 forward=0.6 rest=6 | haze | seconds | Close breathy tones that sink to their root and beat there
Crowd before the gates | Halo of the bass | material=Squeezed overtones=15 attack=1 tilt=0.4 travel=0.5 forward=0.8 glow=0.8 volume=-13 order=0.1 rest=0.5 manner=-0.2 swing=0.3 touch=0.35 | darkhall | lean | A dense murmur that parts, voice by voice, around a root
Bees in the loft | Halo of the bass | material=Squeezed overtones=11 attack=0.4 leftover=1 tilt=0.7 glow=0.85 spread=1 air=0.15 volume=-3 rest=4 manner=-0.2 swing=0 | harmtrem | neighbour | A humming crowd that settles on a bass and never stops beating
Lorries on the bridge | Halo of the bass | material=Squeezed overtones=5 attack=0.15 touch=0.7 glow=0.7 tilt=-0.7 ring=15 release=3 forward=0.4 rest=1.5 manner=-0.25 volume=-4.5 | giant | floor | Low clustered iron that trembles down to its root
Stove door ajar | Halo of the bass | material=Squeezed overtones=9 attack=1.3 again=-0.6 rest=1 tilt=-0.2 glow=0.95 air=0.1 forward=0.15 leftover=0.1 swing=0.22 | triode | deep | A warm crowd over a root that now and then loses its footing
Stars on the low road | Halo of the bass | material=Scattered overtones=12 attack=1.2 tilt=-0.6 glint=0.5 spread=1 glow=0.8 volume=-5 release=3 forward=0.4 leftover=0.4 rest=1.5 manner=-0.3 swing=0 touch=0.68 | stars | seconds | Scattered points drawn down, one after another, to a root
Plankton | Halo of the bass | material=Scattered overtones=8 attack=0.6 manner=0.6 again=0.7 rest=0.3 tilt=-0.7 air=0.2 volume=-4 swing=0.3 touch=0.4 | darkfield | lone | Small scattered strokes over a root, hopping between its overtones | texture
Night bus windows | Halo of the bass | material=Scattered overtones=5 attack=0.8 tilt=-0.5 travel=1 swing=0.6 glow=1 air=0.4 volume=-5 forward=0.2 leftover=0.35 rest=0.4 touch=0.3 | trail | lone | Five blurred lights that swing in and hang over a low tone
Attic full of wind | Halo of the bass | material=Scattered overtones=10 attack=1.2 air=0.85 tilt=-0.75 glow=0.9 travel=0.8 volume=0.5 forward=0.35 leftover=0.45 manner=-0.12 | cistern | deep | Scattered wind that is slowly tuned to a root | wind
Rust and starlings | Halo of the bass | material=Scattered overtones=14 attack=0.4 bend=0.6 tilt=-0.8 leftover=0.9 again=0.4 rest=0.5 volume=-3 manner=-0.3 touch=0.4 | graindelay | seconds | A rough scatter that goes most of the way to a root and wavers
Wind in the mast | Halo of the bass | air=0.8 overtones=9 attack=0.9 tilt=-0.35 glow=0.95 travel=0.7 release=5 order=0.1 leftover=0.1 manner=-0.3 swing=0.3 touch=0.68 volume=-5 | bare | deep | A hollow tuned wind over a low tone | wind
Breathing pier | Halo of the bass | air=0.7 material=Bar manner=-1 overtones=7 attack=1 tilt=-0.2 again=0.6 rest=0.5 volume=-4.5 leftover=0.7 swing=0.35 | surf | lone | Breaths that come and go over the root of a bar | wind
Air in the cloisters | Halo of the bass | air=1 material=Bell overtones=12 attack=0.8 tilt=-0.4 glow=1 spread=0.8 volume=-2.5 forward=0.7 leftover=0.7 manner=-0.25 swing=0.5 | nave | voices | Nothing but breath, tuned to a bell's way home | wind
Grass on the sea wall | Halo of the bass | air=0.9 material=Squeezed overtones=14 attack=0.6 tilt=0.2 swing=0.8 leftover=0.6 volume=-4 forward=0.2 rest=6 | flock | seconds | A wide rushing of breath that sways over one low tone | texture
Low whistle at the fence | Halo of the bass | air=0.55 material=Stretched overtones=4 attack=0.35 tilt=-0.1 swing=0.5 glow=1 release=1.5 volume=-2.5 forward=0.4 leftover=0.6 rest=2.5 manner=-0.35 touch=0.35 | vibrato | aria | A breathy wire whistle leaning over its root | wind
Coal seam | Dark bars | overtones=5 tilt=-0.6 glow=0.9 attack=0.3 leftover=0.5 release=4 volume=-6 order=0.4 forward=0.1 | below | deep | Dark bars over a root, beating slowly and very round
Basalt | Dark bars | overtones=8 material=Plate tilt=-0.9 attack=0.6 glow=0.85 spread=0.5 release=6 volume=-5 forward=0.6 air=0.22 | crypt | floor | Plate with all its light taken away, at rest on a root
Treacle light | Dark bars | overtones=3 attack=0.15 swing=0.8 tilt=-0.7 glow=1 release=2 forward=0.35 air=0.16 | drifttape | common | Three dark tones that sway over the bass of each chord | pad
Foundation stone | Dark bars | overtones=4 material=Bell attack=1 tilt=-0.85 leftover=0 glow=1 swing=0 volume=-5 release=15 order=0 manner=-0.35 | bare | floor | A bell so dark that only its root and a hum are heard
Tar barrel choir | Dark bars | overtones=10 goal=Bass_series attack=0.5 air=0.4 tilt=-0.5 touch=0.4 again=0.4 rest=1.5 volume=-5.5 order=0.2 forward=0.3 | monks | deep | Ten dark bars, half breath, that shift about over a low root | voice
Rooted piano | Halo of the bass | material=Bar overtones=7 attack=0.005 touch=0.5 ring=8 glow=0.3 tilt=0 release=1.2 air=0 volume=-0.5 forward=0.1 leftover=0.1 manner=0.15 swing=0 | tight | hands | Bars struck like a piano that ring toward a root | keys
Bronze over brown | Halo of the bass | material=Squeezed overtones=6 attack=0.01 touch=0.45 ring=6 glow=0.5 tilt=-0.2 release=2 forward=0.7 leftover=0.35 rest=0.5 manner=0.3 swing=0.25 | warm | hands | Close bronze keys that melt to brown over a bass | keys
Vapour on the wire | Halo of the bass | material=Scattered overtones=9 attack=0.015 touch=0.3 ring=5 glow=0.6 tilt=-0.6 release=3 air=0.2 volume=-2.5 forward=0.4 leftover=0.5 rest=3 manner=0.25 swing=0.2 | cloud | answer | Soft scattered keys, each with a trail down to its root | keys
Plumb line | Halo of the bass | material=Plate overtones=5 attack=0.008 touch=0.5 order=1 travel=0.5 glow=0.5 tilt=-0.3 ring=7 volume=2.5 leftover=0.3 rest=1.5 manner=0.35 swing=0.2 | mike | answer | A struck plate whose high tones drop straight to a root | keys
Bell cord | Halo of the bass | material=Bell overtones=8 attack=0.005 touch=0.6 ring=10 glow=0.4 forward=0.9 tilt=0 release=5 volume=-5 travel=0.6 leftover=0.4 rest=2 manner=0.2 swing=0.4 | chamber | sixths | A bell pulled slowly toward the tone below it | bell
Nearly the ground | Halo of the bass | bend=0.5 overtones=9 attack=2.2 glow=0.9 tilt=-0.75 leftover=0.4 volume=-6 travel=3 order=0.1 forward=0.4 rest=0.25 manner=-0.45 touch=0.72 | glacial | lone | A plate that gets half way to its root and floats there
Tethered balloon | Halo of the bass | bend=0.7 material=Bell overtones=6 attack=0.6 swing=1 glow=1 tilt=-0.2 volume=-5 leftover=0.3 rest=6 | pan | lone | A bell that nearly comes down to its root, and sways on the line
Undertow ledger | Halo of the bass | again=-1 rest=0.5 material=Bar overtones=11 attack=0.5 travel=0.8 glow=0.9 tilt=0.1 volume=-3.5 order=0.1 leftover=0.45 bend=0.88 | ripples | deep | Bar tones drawn to a root, let go and drawn again
Shifting ballast | Halo of the bass | again=0.9 rest=0.4 overtones=7 attack=0.4 travel=0.6 tilt=-0.5 glow=0.8 forward=0.65 leftover=0.3 manner=-0.35 swing=0 | turning | seconds | Plate tones that never stop changing seats over a low root
Orrery in the cellar | Halo of the bass | again=0.6 rest=2 manner=0.5 material=Squeezed overtones=8 attack=0.7 tilt=0 glint=0.4 volume=-3.5 swing=0.3 | moons | lone | Close tones turn about a root and click on, now and then
`,
    },
    {
      id: 'quick-pluck',
      name: 'Quick pluck',
      category: 'plucked',
      rows: `
Lemon peel | Quick pluck | overtones=5 ring=1.2 touch=0.5 glint=0.3 tilt=0.1 release=0.4 volume=1.5 order=0.8 forward=0.25 swing=0 | bare | tune | A thin bell pluck that snaps to the chord and is gone
Courtyard well | Quick pluck | overtones=8 ring=4 touch=0.6 release=2 spread=1 volume=-1 glint=0.4 tilt=-0.45 forward=0.2 | stairs | roll | Bell plucks that are in tune at once and ring on down the walls
Seven beads | Quick pluck | overtones=7 ring=2 touch=0.35 travel=0.15 release=1 volume=4 glint=0.55 tilt=-0.35 forward=0.2 leftover=0.45 bend=0.76 | pebble | drops | Soft plucks, each with a run of small chimes after it
Short straw | Quick pluck | overtones=3 ring=0.8 touch=0.7 glint=0 tilt=-0.4 release=0.3 spread=0.2 volume=-0.5 order=0.45 leftover=0.1 swing=0 air=0.14 bend=0.68 | centre | tune | Three overtones and a tap, very short
Tangerine street | Quick pluck | goal=Own_series overtones=12 ring=2.5 touch=0.6 glint=0.2 tilt=0.15 release=0.6 volume=2 swing=0 air=0.14 | chorus | hands | A full bell pluck that is all its own series at once
Thumb on a tine | Quick pluck | material=Bar goal=Own_series overtones=4 ring=5 touch=0.4 tilt=-0.2 release=0.8 glint=0.1 volume=0 order=0.1 forward=0.35 leftover=0.06 swing=0 bend=0.6 | wood | round | A thumbed bar, warm and clear, with a click in it
Gourd and nail | Quick pluck | material=Bar overtones=6 ring=3 touch=0.6 air=0.2 tilt=0 release=0.5 leftover=0.7 glint=0 volume=0.5 order=0.75 bend=0.76 | tin | round | Thumbed bars that buzz a little between their tones
Veranda at two | Quick pluck | material=Bar goal=Chord overtones=5 ring=8 touch=0.3 tilt=-0.5 release=2 glint=0.3 order=0.15 leftover=0.1 bend=0.76 | spring | hands | Mellow bars that take the tones of whatever else is held
Barefoot on tiles | Quick pluck | material=Bar goal=Octaves overtones=8 ring=1.5 touch=0.75 tilt=-0.2 release=0.3 glint=0.4 volume=5.5 order=0.45 forward=0.6 swing=0 | tight | round | Hard dry bars, octaves at once
Fruit stall shutters | Quick pluck | material=Bar overtones=10 ring=2 touch=0.9 travel=0.2 tilt=-0.1 release=0.6 glint=0 volume=4 forward=0.4 leftover=0.12 swing=0 bend=1 | combo | tune | Clattering bars that fall into tune a moment late
Tin petals | Quick pluck | material=Plate overtones=6 ring=0.9 touch=0.45 tilt=-0.3 release=0.4 glint=0.3 volume=2 forward=0.4 swing=0 bend=1 | booth | round | Small plates plucked and damped, already in the chord
Moonlit fire escape | Quick pluck | material=Plate goal=Octaves overtones=10 ring=4 touch=0.5 tilt=-0.5 release=3 glint=0.5 order=0.1 swing=0.22 | valley | roll | Plate plucks that turn to octaves and ring on
Silver paper harp | Quick pluck | material=Plate goal=Own_series overtones=14 ring=2 touch=0.3 release=1.5 air=0.1 spread=1 volume=4.5 tilt=-0.65 glint=0.1 order=0.2 leftover=0.4 swing=0.3 bend=0.84 | dust | roll | A crackling plate that is a harp by the time it dies | string
Stick along the railings | Quick pluck | material=Plate overtones=4 ring=1.5 touch=0.7 tilt=-0.4 travel=0.06 release=0.3 glint=0 volume=3 forward=0.2 order=0.6 bend=0.72 | clean | round | Four plate tones, struck hard, repeated
Cake tin guitar | Quick pluck | material=Plate goal=Bass_series overtones=8 ring=3 touch=0.6 tilt=-0.55 release=0.8 glint=0 order=0.45 forward=0.25 leftover=0.3 swing=0 | tin | hands | Flat plate plucks with a root put under them
Gut and silver | Quick pluck | material=Stretched goal=Own_series overtones=9 ring=4 touch=0.4 tilt=-0.35 release=1 glint=0 volume=2.5 forward=0.35 leftover=0.1 swing=0 | mike | hands | A wire straightened at once into a plain warm string | string
Lute in a window seat | Quick pluck | material=Stretched goal=Own_series overtones=6 ring=3 touch=0.5 tilt=-0.5 release=0.7 glow=0.05 air=0.05 volume=-0.5 order=0.15 forward=0.7 | parlour | roll | Short soft strings, their stiffness gone as you hear them | string
Twelve wires at dawn | Quick pluck | material=Stretched overtones=12 ring=8 touch=0.45 tilt=0.2 release=3 leftover=0.8 glint=0.4 volume=-1 order=0.1 forward=0.35 swing=0.35 bend=0.8 | halo | roll | Doubled wires that shimmer into the chord | string
Zither on the ice | Quick pluck | material=Stretched goal=Octaves overtones=7 ring=10 touch=0.5 tilt=-0.4 release=5 glint=0.6 order=1 forward=0.65 leftover=0.6 swing=0.22 | frost | round | Cold wires that find their octaves and stay ringing | string
Mandolin in a drawer | Quick pluck | material=Stretched goal=Own_series overtones=15 ring=1.3 touch=0.7 tilt=0 release=0.3 leftover=0.5 glint=0 volume=3 order=0 forward=0.25 swing=0.22 bend=0.8 | pillow | tune | Brief bright double wires, small and shut in | string
Rubber bands | Quick pluck | material=Squeezed goal=Own_series overtones=5 ring=2 touch=0.6 tilt=-0.1 travel=0.12 release=0.3 glint=0 volume=6 order=0.2 leftover=0.45 swing=0 | bare | round | Close tones that twang open into a note
Bronze dragonfly | Quick pluck | material=Squeezed goal=Octaves overtones=9 ring=3 touch=0.5 tilt=0.3 glint=0.8 release=1 volume=-1.5 order=0.9 forward=0.2 leftover=0.1 swing=0.3 bend=0.9 | stars | tune | Clustered bronze that opens into bright octaves and darts off
Camel bells | Quick pluck | material=Squeezed overtones=7 ring=5 touch=0.6 tilt=0.5 leftover=0.9 glint=0.2 release=1.5 volume=1.5 order=0.2 swing=0 | darkecho | round | Dull close bells that beat as they walk
Sea chest zither | Quick pluck | material=Squeezed goal=Bass_series overtones=6 ring=4 touch=0.45 tilt=-0.3 glint=0 release=1 volume=-0.5 forward=0.35 swing=0 air=0.14 | under | hands | Muffled plucks that open toward a low root
Toy gamelan on a tray | Quick pluck | material=Squeezed goal=Chord overtones=12 ring=2 touch=0.8 tilt=0.2 glint=0.5 release=0.6 bend=0.8 volume=1 order=0.45 forward=0.7 | sampler | tune | Small loud bronze, nearly in the chord
Hail on a drum kit case | Quick pluck | material=Scattered overtones=8 ring=0.8 touch=0.6 tilt=-0.5 travel=0.05 release=0.3 glint=0 volume=3 order=0.45 forward=0.4 swing=0.3 bend=1 | pressed | round | Scattered ticks that are the chord before they are over
Splinter harp | Quick pluck | material=Scattered goal=Own_series overtones=11 ring=3 touch=0.4 tilt=-0.65 release=1.5 spread=1 glint=0.2 volume=4.5 forward=0.7 swing=0 air=0.12 | late | roll | Splinters of sound gathered at once into a string | string
Salt on the strings | Quick pluck | material=Scattered goal=Octaves overtones=5 ring=1.5 touch=0.5 tilt=-0.45 air=0.5 release=0.5 glint=0.3 volume=2 order=0.05 swing=0 | dust | tune | Dry breathy grains with a clear note in each
Sparks in the workshop | Quick pluck | material=Plate ring=2 touch=0.9 travel=0.2 release=1 volume=1 tilt=-0.75 glint=0.4 overtones=10 forward=0.2 order=0.2 bend=0.72 | leaves | drops | Showers of small metal with chimes as they land
Dried peas | Quick pluck | material=Scattered goal=Bass_series overtones=6 ring=1 touch=0.4 tilt=-0.6 release=0.4 glint=0 volume=5.5 order=0.05 | felt | round | Soft pattering plucks that sink to a root
Muted at midnight | Quick pluck | overtones=4 attack=0.015 ring=1.5 touch=0.04 tilt=-0.7 glint=0 release=0.5 volume=-2 forward=0.3 leftover=0.45 bend=0.68 | warm | hands | A very soft dark bell pluck, stopped with the palm
Cotton wool | Quick pluck | material=Bar goal=Octaves overtones=3 attack=0.02 ring=2 touch=0.02 tilt=-0.6 air=0.3 glint=0 release=0.7 volume=1.5 order=0.45 forward=0.1 leftover=0.6 swing=0 bend=0.88 | blanket | round | Bars touched through cloth, half breath
Slippers on the landing | Quick pluck | material=Plate overtones=5 attack=0.012 ring=1 touch=0.2 tilt=-0.7 glint=0.2 release=0.6 volume=5 order=0.2 leftover=0.1 | steps | tune | Padding plates, very soft, in tune as they fall
Blotting paper | Quick pluck | material=Stretched goal=Chord overtones=7 attack=0.025 ring=1.2 touch=0.3 tilt=-0.6 glint=0 release=0.8 air=0.15 volume=5.5 order=0.05 swing=0.2 bend=0.8 | fog | hands | Dulled wire whose stroke soaks away into the chord
Wool mittens | Quick pluck | material=Squeezed goal=Own_series overtones=3 attack=0.02 ring=2.5 touch=0.2 tilt=-0.5 glint=0 release=0.6 leftover=0 volume=1.5 order=0.05 bend=1 | valve | round | Round muffled plucks with hardly any edge
Slide rule | Quick pluck | travel=0.4 forward=1 overtones=4 ring=4 touch=0.5 tilt=-0.5 glint=0 bend=1 release=1.5 volume=6 material=Scattered leftover=0.35 swing=0 air=0.14 | mike | answer | Four overtones a key, each heard sliding a long way into place
Sagging wire dance | Quick pluck | material=Stretched travel=0.35 forward=0.9 goal=Own_series overtones=8 ring=5 touch=0.45 tilt=-0.4 glint=0 release=1 volume=1 order=0.7 bend=0.88 | melt | round | Wire plucks that droop into tune after the finger has left | string
Elastic parlour | Quick pluck | material=Squeezed travel=0.4 swing=1 forward=0.8 overtones=6 ring=7 tilt=0.1 glint=0 release=0.8 volume=1.5 order=0.2 leftover=0.35 bend=0.68 touch=0.75 | pressed | tune | Plucks that spring past their note and come back
Crooked stairs up | Quick pluck | material=Bar travel=0.6 manner=1 goal=Own_series overtones=7 ring=6 touch=0.5 tilt=0 glint=0.2 release=1 volume=2.5 order=0.9 forward=0.75 leftover=0.5 bend=0.68 | heads | answer | Plucked bars whose overtones climb in steps behind the note
Dance half remembered | Quick pluck | material=Bell bend=0.5 travel=0.3 overtones=9 ring=3 touch=0.45 tilt=-0.3 glint=0.3 release=1 leftover=0.5 forward=0.3 | record | hands | Bell plucks that only half remember the chord
Pluck and lamp | Quick pluck | glow=0.6 overtones=6 ring=3 touch=0.5 tilt=-0.3 release=2.5 glint=0.4 travel=0.1 volume=-0.5 order=0.4 forward=0.7 leftover=0.1 bend=1 | glimmer | answer | A pluck that leaves the chord glowing as long as it is held
Harp with a candle | Quick pluck | material=Stretched goal=Own_series glow=0.4 overtones=8 ring=6 touch=0.35 tilt=-0.45 release=3 glint=0.2 order=0 forward=0.6 manner=-0.2 swing=0.35 bend=0.72 | strings | roll | Warm strings that go on shining after the pluck | string
Organ grinder's thumb | Quick pluck | material=Bar goal=Octaves glow=0.8 overtones=5 touch=0.6 tilt=-0.1 release=0.5 glint=0 volume=0.5 order=0.45 | transistor | hands | A thumbed bar that holds on as a small pipe | keys
Pizzicato ghosts | Quick pluck | material=Scattered goal=Chord glow=0.5 air=0.7 overtones=9 attack=0.01 tilt=-0.5 release=2 glint=0.1 volume=-2 order=0.2 forward=0.25 manner=0.2 swing=0 bend=0.88 | reverse | roll | Short breaths, plucked, that leave a chord of air
Rain gutter sitar | Quick pluck | material=Plate goal=Own_series glow=0.5 overtones=13 leftover=0.6 again=0.6 rest=0.4 release=1.5 volume=6 glint=0.1 tilt=-0.65 order=0.45 swing=0.5 air=0.2 bend=0.68 | throb | answer | Plate plucks with a buzzing crown that keeps shifting | string
Low tide ukulele | Quick pluck | material=Stretched overtones=4 ring=2 touch=0.55 tilt=-0.3 release=0.4 glint=0 spread=0.3 volume=3 order=0.4 forward=0 leftover=0 swing=0 | reel | round | Small plain wires, short and friendly
Bass in a bathtub | Quick pluck | material=Bell goal=Own_series overtones=7 ring=4 touch=0.65 tilt=0.1 release=0.5 glint=0 order=0.4 leftover=0.35 bend=0.86 | iron | figure | Low plucked bell with a firm front | bass
Tall tree plucked low | Quick pluck | material=Bar goal=Bass_series overtones=5 ring=6 touch=0.5 tilt=-0.2 release=0.8 glint=0.1 volume=-0.5 forward=0.3 order=0.1 leftover=0.03 swing=0 air=0.1 | thick | walk | Deep plucked wood, its root there at once | bass
Highest shelf | Quick pluck | material=Bar goal=Chord overtones=3 ring=3 touch=0.4 tilt=-0.2 glint=0.7 release=1.5 volume=4 leftover=0.45 air=0.12 bend=0.68 | onwater | high | High small plucks with a chime each | bell
Constellation of pins | Quick pluck | material=Stretched goal=Octaves overtones=6 ring=1.5 touch=0.25 tilt=-0.85 release=2 spread=1 volume=3.5 glint=0.5 swing=0 bend=0.84 | darkfield | high | High soft pricks of wire close to octaves, each with a chime | bell
`,
    },
    {
      id: 'swinging-choir',
      name: 'Swinging choir',
      category: 'voice',
      rows: `
Altos in the back row | Swinging choir | overtones=7 attack=0.35 air=0.3 swing=0.7 tilt=0 travel=0.5 release=1.5 volume=3.5 forward=0.4 order=0.7 leftover=0.45 rest=2.5 bend=1 | chamber | voices | Sung bars that swing to the series of their note and sway there
Choir on a ferry | Swinging choir | overtones=12 attack=0.8 air=0.5 swing=1 tilt=0.25 spread=1 forward=0.6 volume=1.5 travel=0.35 leftover=0.1 rest=0.25 manner=-0.35 bend=0.78 | surf | voices | A wide breathy choir that rolls round every note it takes
Thursday in the hall | Swinging choir | overtones=5 attack=0.25 air=0.2 swing=0.4 leftover=0.5 tilt=-0.1 release=0.8 volume=0.5 forward=0.2 order=1 rest=5 touch=0.35 bend=0.82 | cassette | voices | A few plain voices, not quite together
Psalm by heart | Swinging choir | overtones=5 attack=0.35 air=0.35 swing=0.2 tilt=-0.35 glow=0.95 travel=1.1 order=0.15 leftover=0.4 rest=6 manner=-0.2 bend=0.82 volume=0.5 | nave | aria | Dark sung bars that take over a second to find each note
Snow choir | Swinging choir | overtones=15 attack=1 air=0.65 swing=0.8 tilt=0.4 glint=0.2 release=5 travel=0.45 order=0.4 rest=8 manner=-0.25 bend=0.85 volume=-3 | frost | lean | Many thin cold voices leaning past the note and back
Bell that hums | Swinging choir | material=Bell overtones=6 attack=0.4 air=0.15 swing=0.5 tilt=-0.3 glow=0.9 rest=6 | parlour | voices | A hummed bell whose overtones swing into a close vowel
Nuns at the window | Swinging choir | material=Bell goal=Octaves overtones=8 attack=0.7 air=0.4 swing=0.6 tilt=0 release=4 volume=2 travel=0.4 leftover=0.35 rest=2 bend=1 | stairs | voices | Bell voices that swing up to octaves and hang there
Evensong by one candle | Swinging choir | material=Bell goal=Chord overtones=11 attack=0.5 air=0.3 swing=0.9 tilt=-0.2 forward=0.8 travel=0.45 order=0.75 leftover=0.05 rest=1.2 bend=0.85 | room | tworooms | Bell tones that overshoot the chord one by one and lean back
Mothers of the valley | Swinging choir | material=Bell goal=Bass_series overtones=9 attack=0.9 air=0.45 swing=0.7 tilt=0.1 travel=0.4 order=0.05 leftover=0.35 rest=6 touch=0.3 | valley | voices | Voices from a bell that swing down to one low tone | voice
Alto and foghorn | Swinging choir | material=Bell overtones=4 attack=0.3 air=0.1 swing=0.8 leftover=0.7 glow=1 release=1 order=1 rest=3 bend=0.72 | darkecho | aria | A lone bell voice that beats and sways on long notes
Whispering gallery | Swinging choir | air=1 overtones=8 attack=0.5 swing=0.5 tilt=-0.2 travel=0.4 release=2 volume=1.5 rest=3 touch=0.2 bend=0.82 | glass | voices | All whisper, tuned, going round the note
Prayer for wool | Swinging choir | air=0.85 material=Squeezed overtones=6 attack=0.6 swing=0.7 tilt=0.1 glow=1 rest=1.2 manner=-0.45 touch=0.15 goal=Chord | haze | common | Soft breath that opens from a cluster to a chord
Fog on the choir stalls | Swinging choir | air=0.9 material=Scattered overtones=10 attack=1.1 swing=0.4 tilt=-0.55 release=4 rest=0.25 | fog | lean | Scattered breath that drifts into the series of each key
Breath on a cold bell | Swinging choir | air=0.7 material=Bell goal=Octaves overtones=12 attack=0.3 swing=0.3 tilt=-0.15 spread=0.4 order=0.8 leftover=0.45 manner=-0.2 touch=0.4 bend=1 | centre | aria | A narrow breathy line of octaves
Sighing turnstile | Swinging choir | air=0.75 manner=-1 goal=Chord overtones=7 attack=0.4 swing=0.6 again=0.5 rest=0.8 tilt=-0.1 volume=4.5 order=0.9 leftover=0.3 touch=0.4 bend=0.86 | pan | tworooms | Sighs that sink and rise again on another tone of the chord
One boy comes in late | Swinging choir | overtones=3 attack=0.2 air=0.15 swing=0.6 tilt=-0.2 spread=0 release=0.8 glow=1 forward=0.4 order=0.8 rest=0.4 volume=1.5 | late | aria | One pure narrow voice with three overtones that swing to place
Washerwoman's air | Swinging choir | overtones=6 attack=0.15 air=0.25 swing=0.8 tilt=0.2 spread=0.1 release=0.5 volume=0.5 order=0.5 rest=8 bend=0.85 | pressing | aria | A plain strong voice that scoops up to each note
Last verse alone | Swinging choir | material=Stretched overtones=5 attack=0.3 air=0.35 swing=0.5 tilt=-0.2 spread=0.2 glow=1 release=1.5 order=0.4 leftover=0.45 rest=2.5 manner=-0.2 bend=0.85 | darkplate | aria | One stretched voice that folds itself down to the note
Caller at the weir | Swinging choir | material=Bell overtones=9 attack=0.18 air=0.1 swing=0.9 tilt=0.15 forward=0.9 travel=0.6 release=1 order=0.1 rest=5 bend=0.86 | trail | aria | A calling voice whose overtones step forward, swing and settle
Lullaby on the stairs | Swinging choir | material=Bar goal=Octaves overtones=4 attack=0.2 air=0.4 swing=0.3 tilt=-0.45 spread=0.2 release=1.5 order=0.4 leftover=0.1 rest=1.2 bend=0.82 | warm | aria | A low soft voice, mostly breath and near octaves
Throat and wire | Swinging choir | material=Stretched overtones=13 attack=0.25 air=0.1 swing=0.4 tilt=0.1 leftover=0.4 glow=0.95 bend=0.82 | vowel | aria | Tight wire that becomes a nasal sung series
Tenors in the far pew | Swinging choir | material=Stretched overtones=8 attack=0.5 air=0.3 swing=0.7 tilt=-0.35 travel=0.35 leftover=0.5 rest=1.2 manner=-0.2 touch=0.3 bend=0.85 | shore | voices | Reedy men's voices that lean in to each note
Steam choir | Swinging choir | material=Stretched goal=Chord overtones=10 attack=0.7 air=0.8 swing=0.6 tilt=-0.4 order=0.5 rest=4 manner=-0.12 bend=0.86 | space | tworooms | Hissing wire that turns to voices close to the tones of the chord
Wire kissed by rain | Swinging choir | material=Stretched goal=Octaves overtones=6 attack=0.15 air=0.5 swing=0.9 tilt=-0.65 glint=0.5 rest=0.25 manner=-0.12 touch=0.4 bend=0.72 | wet | sixths | Breathy wire that wags toward its octaves and chimes as it comes in
Kite string vespers | Swinging choir | material=Stretched goal=Bass_series overtones=9 attack=0.6 air=0.4 swing=1 tilt=-0.3 release=3 travel=0.35 order=0.05 leftover=0.7 rest=3 | wander | common | Voices on a long wire, swinging over a low tone
Monastery laundry | Swinging choir | material=Squeezed overtones=8 attack=0.4 air=0.3 swing=0.4 tilt=-0.2 leftover=0.4 release=2 travel=0.4 order=0.05 rest=0.5 manner=-0.3 | monks | common | A close low crowd that opens its mouth onto the note
Miners' rehearsal | Swinging choir | material=Squeezed goal=Bass_series overtones=10 attack=0.5 air=0.2 swing=0.6 tilt=0.4 glow=1 volume=-4.5 travel=0.35 order=0.6 rest=0.5 | downhall | common | Men's voices packed together that swing down to a root
Cloth hall murmur | Swinging choir | material=Squeezed goal=Chord overtones=13 attack=0.8 air=0.55 swing=0.8 tilt=0.5 forward=0.3 volume=-2 travel=0.35 order=0.75 leftover=0.4 rest=0.4 | cloud | tworooms | A murmur so close it has no tune until it finds the chord
Drowsy basses | Swinging choir | material=Squeezed goal=Octaves overtones=5 attack=0.6 air=0.25 swing=0.9 tilt=0.5 glow=1 order=0.2 rest=6 | pedal | deep | Low sleepy voices that rock open to octaves
Quarrel settled | Swinging choir | material=Squeezed overtones=15 attack=0.3 air=0.15 swing=0.5 travel=0.3 leftover=0.1 tilt=0.2 volume=-10.5 order=0.15 touch=0.6 rest=8 manner=-0.25 | warm | voices | A hard close cluster that is quickly sung into agreement
Seraph in the pantry | Swinging choir | material=Scattered goal=Octaves overtones=9 attack=0.8 air=0.35 swing=0.6 tilt=-0.65 glint=0.4 order=0.05 rest=5 bend=1 | rising | lean | High scattered voices that swing to octaves with faint chimes
Sleet chorus | Swinging choir | material=Scattered overtones=13 attack=0.5 air=0.6 swing=0.9 tilt=-0.75 travel=0.3 spread=1 volume=0.5 order=0.2 leftover=0.3 touch=0.68 bend=0.88 | ripples | neighbour | A slanting crowd of small voices blown into tune
Unrehearsed angels | Swinging choir | material=Scattered goal=Chord overtones=6 attack=0.4 air=0.25 swing=0.7 tilt=-0.55 travel=0.9 again=0.4 forward=0.6 order=0.9 rest=5 manner=-0.35 volume=1 | choirhall | stair | Six voices from anywhere that find the chord and miss it again
Children behind a wall | Swinging choir | material=Scattered overtones=4 attack=0.2 air=0.45 swing=1 tilt=-0.7 release=1 order=0.5 leftover=0.1 bend=0.78 | hollow | sixths | Four high voices that wobble before they land
Night sky hummed | Swinging choir | material=Scattered goal=Bass_series overtones=8 attack=1.3 air=0.5 swing=0.4 tilt=-0.8 glow=1 forward=0.2 order=0.05 leftover=0.1 rest=2 touch=0.72 | crypt | seconds | Far scattered humming that comes down to a low tone
Swung lanterns | Swinging choir | goal=Chord overtones=8 attack=0.3 swing=1 forward=1 travel=0.5 air=0.2 tilt=0 order=0.7 leftover=0.3 rest=0.25 | moons | stair | Each tone steps out of the choir, swings wide and joins the chord
Oars in time | Swinging choir | goal=Chord overtones=5 attack=0.2 swing=0.8 travel=0.4 air=0.3 tilt=-0.2 release=2 order=0.2 leftover=0.05 rest=0.25 touch=0.3 bend=0.78 volume=1.5 | thick | round | Five voices that rock over onto the chord
Slow standing ovation | Swinging choir | goal=Chord overtones=17 attack=1.4 swing=0.6 order=0 travel=0.4 air=0.4 tilt=0.3 forward=0.3 leftover=0 rest=2.5 touch=0.2 bend=0.88 volume=-1.5 | bloom | stair | A great choir that gets up row by row from the bottom
Harvest table | Swinging choir | goal=Chord material=Plate overtones=7 attack=0.6 swing=0.7 air=0.5 tilt=-0.5 order=0.5 manner=-0.35 bend=0.88 | pipes | common | Breathy plate voices that lean across to the chord
Choir in a lift | Swinging choir | goal=Chord material=Bell overtones=9 attack=0.2 swing=0.5 travel=0.2 air=0.15 tilt=-0.1 release=0.6 order=0.5 leftover=0 rest=8 | booth | voices | A small close choir that is in tune with whoever joins
Every breath counted | Swinging choir | manner=-0.9 overtones=6 attack=0.7 swing=0.4 again=0.7 rest=0.6 air=0.5 tilt=-0.1 volume=-2 touch=0.35 bend=0.85 | sigh | lean | Voices that sink and rise between one overtone and the next
Shanty dissolving | Swinging choir | manner=-1 material=Bell goal=Chord overtones=10 attack=0.4 again=-0.6 rest=0.5 air=0.3 swing=0.7 travel=0.4 order=0.2 leftover=0.05 touch=0.15 bend=0.72 volume=-5 | dissolve | common | A choir that dissolves back to its bell tone by tone and reforms
Thin morning voices | Swinging choir | manner=-0.7 material=Stretched overtones=7 attack=0.6 again=0.6 rest=1 air=0.55 tilt=-0.35 travel=0.45 bend=0.88 | thinair | voices | Thin voices that fade and rise without ever starting
Choir of kettles | Swinging choir | manner=-0.5 material=Plate goal=Own_series overtones=11 attack=0.6 again=0.8 rest=0.3 air=0.7 tilt=-0.55 volume=-1 order=0.45 leftover=0.06 touch=0.15 bend=0.85 | cistern | neighbour | Steaming plate tones that breathe and change round
Rocking chair alto | Swinging choir | manner=-0.4 overtones=4 attack=0.22 again=-0.5 rest=1.2 swing=1 air=0.2 tilt=-0.2 volume=0 touch=0.2 bend=0.85 | reel | aria | A worn low voice that rocks to its note and off it
Soft syllables | Swinging choir | attack=0.03 overtones=6 travel=0.12 swing=0.4 air=0.25 glow=0.7 tilt=0.3 release=0.4 volume=-1 forward=0.2 order=0 leftover=0.06 rest=2.5 | room | round | Short sung syllables that find their vowel at once
Row of small mouths | Swinging choir | attack=0.02 material=Bell manner=0.8 overtones=5 travel=0.3 air=0.3 glow=0.6 tilt=-0.15 release=0.8 again=0.4 volume=2 order=0.6 leftover=0.45 bend=0.82 | clean | tune | Little sung bells that repeat themselves in small steps
Solfege in the rain | Swinging choir | attack=0.05 material=Stretched overtones=9 travel=0.2 swing=0.6 air=0.4 glow=0.8 tilt=-0.3 release=0.6 order=0.05 rest=5 manner=-0.45 touch=0.68 bend=0.82 | wet | follow | Quick reedy syllables with a scoop at their start
Hocket for two roofs | Swinging choir | attack=0.02 goal=Octaves overtones=8 travel=0.15 swing=0.3 air=0.5 tilt=0.1 release=0.5 spread=1 volume=-0.5 leftover=0.35 rest=1.5 manner=-0.45 bend=0.85 | canon | answer | Short breathy calls, nearly octaves, from either side of a gap
Breath and its echo | Swinging choir | attack=0.015 material=Squeezed goal=Own_series overtones=7 travel=0.1 air=0.7 glow=0.5 tilt=0 release=0.7 forward=0.4 order=0.5 leftover=0.4 rest=1.2 touch=0.3 volume=0 | heads | answer | Panted close breaths that open to a note
`,
    },
    {
      id: 'raw-metal',
      name: 'Raw metal',
      category: 'drone',
      rows: `
Ship breakers' yard | Raw metal drone | overtones=12 attack=1 tilt=-0.5 leftover=0.7 glow=0.8 air=0.05 spread=1 volume=6 manner=-0.7 swing=0.4 forward=0 | stairs | seconds | Unbent plate, wide and hard, that swells and goes on breathing
Sheet in the wind | Raw metal drone | overtones=7 attack=0.6 tilt=-0.3 air=0.4 ring=20 leftover=0.4 glow=0.7 volume=0 forward=0.6 swing=0.35 | wander | lone | A hung plate with breath across it, agreeing with nothing
Propeller in dry dock | Raw metal drone | overtones=17 attack=0.9 tilt=-0.8 leftover=1 release=12 glow=0.9 manner=0.35 forward=0.1 swing=0 volume=-0.5 | cave | floor | Seventeen dark tones of raw plate, beating as fast as they can
Girder harmonics | Raw metal drone | overtones=5 attack=0.3 touch=0.5 tilt=-0.2 leftover=0.2 glow=0.6 release=4 volume=3 swing=0 | thin | deep | Five bare plate tones, held and hardly beating
Press hall after hours | Raw metal drone | overtones=19 attack=0.02 touch=0.8 tilt=-0.45 ring=5 glow=0.4 leftover=0.9 volume=5 air=0.45 release=3 swing=0.2 | darkhall | lone | A struck plate, half hiss, whose nineteen tones beat fast and fade
Cracked tenor | Raw metal drone | material=Bell overtones=8 attack=0.008 touch=0.6 ring=15 glow=0.2 leftover=0.9 tilt=-0.1 volume=0.5 forward=0.35 swing=0 | valley | peal | An untuned bell that beats hard as it rings | bell
Fishing village bell | Raw metal drone | material=Bell overtones=5 attack=0.005 touch=0.5 ring=8 glow=0.05 leftover=0.5 tilt=-0.2 release=5 volume=-2 forward=0.25 swing=0 | surf | answer | One old bell, struck and left as it is | bell
Bowed bell metal | Raw metal drone | material=Bell overtones=12 attack=0.9 glow=1 leftover=0.4 tilt=0.1 air=0.1 swing=0.4 | bare | neighbour | A whole bell bowed, narrow third and all
Two bells on one rope | Raw metal drone | material=Bell overtones=3 attack=0.5 glow=0.9 leftover=1 tilt=-0.4 spread=0.5 forward=0.5 volume=0 | halfspeed | deep | A low hum of raw bell that quivers against itself
Bell in a flooded nave | Raw metal drone | material=Bell overtones=15 attack=0.2 air=0.3 ring=40 glow=0.6 tilt=-0.5 forward=0.1 volume=0 | darkwater | sixths | A bell never bent, breathy and slow to fade
Scaffold poles | Raw metal drone | material=Bar overtones=6 attack=0.004 touch=0.7 ring=12 glow=0 tilt=0 release=3 leftover=0.1 volume=-1 swing=0.2 | room | round | Raw bars, struck, with their clang left in | keys
Leaning tubes | Raw metal drone | material=Bar overtones=9 attack=0.01 touch=0.45 ring=30 glow=0.1 tilt=-0.1 release=8 leftover=0.6 | late | sixths | Long hanging bars that ring untuned for a long time | bell
Railhead at daybreak | Raw metal drone | material=Bar overtones=4 attack=0.8 glow=1 tilt=0.1 air=0.2 leftover=0.3 volume=-16.5 | tails | lone | A few bar tones bowed thin, far from any chord
Forks in a jar | Raw metal drone | material=Bar overtones=13 attack=0.003 touch=0.7 ring=1.5 glow=0 tilt=-0.2 release=1 spread=1 volume=3 air=0.4 forward=0.1 | tin | drops | Bright raw bars, rough with breath, that clash and stop | plucked
Iron stair in the rain | Raw metal drone | material=Bar overtones=7 attack=0.006 touch=0.35 ring=6 glow=0.2 air=0.3 tilt=-0.3 release=2 volume=0.5 forward=0.5 | wet | tune | Soft strokes on bare bars with some breath on them | keys
Slack telegraph | Raw metal drone | material=Stretched overtones=10 attack=0.9 tilt=-0.3 glow=0.9 leftover=0.5 air=0.1 volume=2.5 swing=0 | linger | seconds | Stiff wire left as wide as it was drawn, humming
Electric fence | Raw metal drone | material=Stretched overtones=6 attack=0.004 touch=0.6 ring=4 glow=0.1 tilt=-0.1 release=0.8 leftover=0.8 volume=4 forward=0.6 | clean | round | Twangs of raw wire with a quick beat | plucked
Gutted piano frame | Raw metal drone | material=Stretched overtones=15 attack=0.02 touch=0.5 ring=25 glow=0.3 tilt=-0.6 release=9 forward=0.5 swing=0 | nave | hands | A dark bed of stretched strings that no one tunes | keys
Bridge cables in frost | Raw metal drone | material=Stretched overtones=4 attack=1.1 tilt=-0.5 glow=0.8 swing=0.6 spread=1 volume=3.5 manner=-0.5 forward=0.1 | frost | neighbour | Four long wires that swell without bending and sway in the cold
Bow on a cheese wire | Raw metal drone | material=Stretched overtones=4 attack=0.25 tilt=0.1 glow=1 air=0.5 release=1.5 leftover=0.2 volume=6 forward=0.2 swing=0.3 | sweep | aria | A thin rough wire, bowed, all air and edge | string
Gong nobody owns | Raw metal drone | material=Squeezed overtones=11 attack=0.03 touch=0.7 ring=20 glow=0.3 tilt=0.1 leftover=0.7 volume=1 forward=0.4 swing=0.2 | steps | floor | A close raw gong that shudders for as long as it lasts | bell
Bronze fog | Raw metal drone | material=Squeezed overtones=14 attack=1.4 tilt=0.5 glow=1 leftover=0.6 air=0.4 release=16 swing=0.4 | blur | deep | A thick cluster, bowed, that never parts
Cluster under glass | Raw metal drone | material=Squeezed overtones=8 attack=0.5 tilt=0.85 glow=0.9 leftover=1 spread=0.9 volume=-1 forward=0.6 | glass | neighbour | Close tones that flicker against each other, brightly
Swarm in the belfry | Raw metal drone | material=Squeezed overtones=19 attack=0.8 tilt=0.2 glow=0.8 swing=0.7 leftover=0.9 | notch | lean | Nineteen tones crowded round each note, swaying
Pot lids at prayer | Raw metal drone | material=Squeezed overtones=5 attack=0.005 touch=0.55 ring=7 glow=0.1 tilt=-0.1 release=2 volume=6 forward=0.1 | tight | peal | Small close lids, struck, that keep their quarrel | bell
Meteor iron | Raw metal drone | material=Scattered overtones=8 attack=2.5 tilt=-0.65 glow=0.9 leftover=0.1 volume=1 release=16 spread=0.6 forward=0.35 | shade | lean | Tones from nowhere over each note, held as they fell
Static on the moor | Raw metal drone | material=Scattered overtones=16 attack=1 tilt=-0.8 air=0.7 glow=0.8 spread=1 volume=0.5 forward=0.1 swing=0.45 | leaves | deep | A dark scatter of breath and metal that is left alone | texture
Dropped toolbox | Raw metal drone | material=Scattered overtones=12 attack=0.003 touch=0.75 ring=2 glow=0 tilt=-0.95 release=0.7 volume=1 forward=0.65 swing=0.35 | pressed | round | Each key a different clank, gone quickly | texture
Broken star map | Raw metal drone | material=Scattered overtones=5 attack=0.01 touch=0.4 ring=18 glow=0.2 tilt=-0.95 release=6 volume=1.5 forward=0.6 swing=0.22 | stars | sixths | High unbent points that ring where they like | bell
Glass forest | Raw metal drone | material=Scattered overtones=10 tilt=-0.7 glow=1 swing=0.8 air=0.2 attack=4.5 release=14 volume=-2 | shift | lean | Strange tones over each key that swell and sway together | pad
Rumour of a chord | Raw metal drone | bend=0.15 overtones=10 attack=1 tilt=-0.5 again=0.5 rest=1 travel=15 volume=-1 order=0.05 forward=0.25 swing=0 | glacial | tworooms | Plate that has only just heard of the chord
Leaning a little | Raw metal drone | bend=0.25 material=Bell overtones=7 travel=1.5 attack=0.4 glow=0.9 tilt=-0.2 swing=0.5 order=0.7 | swell | neighbour | A bell that leans a quarter of the way and swings there
Iron listening | Raw metal drone | bend=0.3 material=Bar goal=Own_series overtones=9 attack=0.7 glow=0.95 tilt=0 leftover=0.5 volume=2.5 travel=1.5 order=0.45 forward=0.2 swing=0 | warmecho | lone | A bowed bar that is drawn a third of the way to its series | string
Persuaded by rain | Raw metal drone | bend=0.35 material=Stretched goal=Octaves overtones=11 travel=0.8 attack=0.5 tilt=-0.4 leftover=0.3 order=0.8 forward=0.7 manner=-0.2 swing=0.4 | evening | stair | Wire that gives way by a third, and not a step more
Hesitating bronze | Raw metal drone | bend=0.2 material=Squeezed goal=Chord overtones=9 travel=0.8 attack=0.8 tilt=0.4 again=-0.6 rest=1 order=0.05 forward=0.65 swing=0.25 | sustain | neighbour | A cluster that sets out for the chord and returns
In and out of fog | In and out of metal | overtones=8 travel=1 rest=0.8 attack=0.6 tilt=-0.3 air=0.3 release=3 leftover=0.5 swing=0 bend=1 | fog | neighbour | Octaves that sink back to bell metal and surface again | pad
Submerged road | In and out of metal | material=Plate goal=Bass_series overtones=9 travel=1 attack=1 tilt=-0.5 again=-1 rest=0.3 order=0.1 swing=0.35 air=0.18 | under | seconds | A plate that comes and goes over a root with each slow breath
Lifted anchor | In and out of metal | material=Bar overtones=4 travel=0.7 attack=0.3 tilt=0 forward=1 rest=1.5 glow=1 leftover=0.4 swing=0.3 bend=1 | moons | lone | Four bar tones that rise to octaves and go down again
Lunar mechanics | In and out of metal | material=Stretched goal=Chord overtones=10 travel=0.6 attack=0.8 tilt=-0.5 rest=0.4 glint=0.4 order=0.45 bend=1 | freeze | stair | Wire that waxes to the chord and wanes to wire
Swing door | In and out of metal | material=Squeezed goal=Own_series overtones=7 travel=0.35 attack=0.2 tilt=0.1 rest=0.5 again=-1 release=1.5 order=0.2 leftover=0.06 swing=0.2 air=0.2 volume=-6 | pan | common | Close tones that go round between clash and consonance
Empty pipeline | Raw metal drone | material=Bar overtones=11 air=0.8 attack=0.9 tilt=-0.2 glow=1 spread=0.7 volume=6 forward=0.7 swing=0.5 | cistern | deep | Hollow wind with the pitch of bars in it, unbent | wind
Vent on the roof | Raw metal drone | overtones=6 air=1 attack=0.8 tilt=-0.35 leftover=0.3 glow=0.9 volume=-1.5 | thick | lone | Breath at the pitches of a plate and nothing else | wind
Weathered weather vane | Raw metal drone | material=Stretched overtones=7 air=0.6 attack=0.5 tilt=-0.4 swing=1 glow=0.9 again=0 volume=2.5 | airy | seconds | Wire and wind that swing round a note | texture
Quiet alarm | Raw metal drone | material=Bell overtones=4 manner=1 bend=0.1 again=0.9 rest=0.3 travel=0.3 attack=0.05 glow=0.7 tilt=-0.3 volume=0.5 order=0.2 forward=0.25 swing=0 | throb | lone | A few bell tones tapped lightly where they stand | texture
Old radio mast | Raw metal drone | overtones=10 air=0.35 attack=0.6 tilt=-0.1 leftover=0.8 glow=0.8 spread=0.2 swing=0 | transistor | neighbour | A narrow raw plate, half hiss and beating
Keel | Dark bars | bend=0 material=Plate overtones=8 attack=0.7 tilt=-0.75 leftover=0.6 glow=0.9 release=5 volume=-4.5 | crypt | floor | A dark unbent plate, very low and wide
Banked furnace | Dark bars | bend=0 material=Squeezed overtones=6 attack=0.4 tilt=-0.4 leftover=0.9 glow=1 air=0.2 volume=-4.5 forward=0.5 | watery | floor | A glowing low cluster that trembles and stays | bass
Cooling tower psalm | Cooling plate | bend=0.3 material=Bell overtones=13 touch=0.5 ring=35 glow=0.5 tilt=-0.35 leftover=0.7 volume=0.5 travel=0.8 forward=0.35 manner=0.3 air=0.1 | sparks | sixths | A long bell that cools by a third of the way to the chord | bell
After the anvil | Cooling plate | bend=0.2 material=Bar overtones=8 touch=0.9 ring=45 glow=0.1 tilt=-0.1 order=0.5 travel=1 forward=0.5 | spring | answer | A hard struck bar whose ring hardly changes as it dies | keys
Sheet metal evening | Cooling plate | bend=0.4 overtones=10 attack=0.05 touch=0.3 ring=50 glow=0.6 tilt=-0.7 travel=0.7 manner=-0.35 swing=0 | faintoct | lean | A soft dark plate that takes an age to come half way | pad
`,
    },
  ],
}
