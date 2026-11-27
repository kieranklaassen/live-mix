import { type InstrumentSet } from './set'

// Ten things the clocks do (learn one time, answer from two sides, speak once
// under a key, hang as tubes, glow under the hand), each in ten corners of five:
// a corner keeps an escapement, a wall or a gong and walks far in the rest.

const fx = (deviceId: string, preset: string, params?: Record<string, number>) => ({
  deviceId,
  preset,
  ...(params && { params }),
})

export const SET: InstrumentSet = {
  device: 'clock-room',
  names: {
    escapement: ['Verge', 'Anchor', 'Deadbeat', 'Chime hammer', 'Rub only'],
    wall: ['In step', 'Opposed', 'Splayed', 'Chain'],
    gong: ['Coil', 'Straight rod', 'Cup', 'Tube', 'Nested'],
    case: ['Oak', 'Marble', 'Iron', 'Glass dome'],
  },
  chains: {
    bare: { effects: [fx('ambient-eq', 'Keys')], words: ', close and dry' },
    wood: {
      effects: [fx('ambient-eq', 'Warm'), fx('analog-drive', 'First hint')],
      words: ', dry, its wood brought up',
    },
    shade: {
      effects: [fx('ambient-eq', 'Shaded'), fx('spread', 'Soft tilt')],
      words: ', dry, the top in shade',
    },
    open: {
      effects: [fx('spread', 'Wide pad'), fx('ambient-eq', 'Layer')],
      words: ', dry and opened wide',
    },
    point: {
      effects: [fx('stereo-widener', 'Mono'), fx('ambient-eq', 'Voice')],
      words: ', dry, from one point',
    },
    even: {
      effects: [fx('ambient-comp', 'Keys'), fx('tamer', 'Gentle')],
      words: ', dry and held even',
    },
    desk: {
      effects: [fx('analog-drive', 'Console'), fx('ambient-comp', 'Pluck tamer')],
      words: ', dry through an old desk',
    },
    triode: {
      effects: [fx('analog-drive', 'Triode glow'), fx('ambient-eq', 'Layer')],
      words: ', dry through a warm valve',
    },
    heavy: { effects: [fx('analog-drive', 'Iron lows')], words: ', dry through heavy iron' },
    taped: { effects: [fx('tape', 'Warm thump')], words: ', dry on warm tape' },
    reel: {
      effects: [fx('patina', 'Quarter inch reel'), fx('stereo-detune', 'Faint width')],
      words: ', dry on an old reel',
    },
    doubled: { effects: [fx('stereo-detune', 'Doubled')], words: ', doubled and dry' },
    airy: {
      effects: [fx('chorus', 'Faint air'), fx('ambient-eq', 'Voice')],
      words: ', in a thin dry chorus',
    },
    vibed: { effects: [fx('phaser', 'Slow swirl')], words: ', under a slow dry phaser' },
    swept: {
      effects: [fx('flanger', 'Gentle sweep', { mix: 0.3 })],
      words: ', swept by a slow flanger',
    },
    shiver: {
      effects: [fx('tremolo', 'Harmonic shimmer')],
      words: ', with a dry shiver of tremolo',
    },
    swayed: { effects: [fx('tremolo', 'Slow pan')], words: ', dry, panned slowly' },
    chorale: { effects: [fx('rotary', 'Chorale')], words: ', dry in a slow rotary cabinet' },
    whirl: {
      effects: [fx('rotary', 'Tremolo', { mix: 0.8 }), fx('ambient-eq', 'Layer')],
      words: ', in a fast rotary cabinet',
    },
    glinting: { effects: [fx('glimmer', 'Light on water')], words: ', dry, its partials glinting' },
    drift: {
      effects: [fx('currents', 'Gentle drift'), fx('spread', 'Firm bass')],
      words: ', dry, its bands drifting',
    },
    wooden: {
      effects: [fx('vessel', 'Wooden body', { mix: 0.55 })],
      words: ', inside a wooden body',
    },
    tin: {
      effects: [fx('vessel', 'Small tin', { mix: 0.35 }), fx('ambient-eq', 'Warm')],
      words: ', inside a small tin',
    },
    boxed: {
      effects: [fx('imprint', 'Dark box', { amount: 0.7 })],
      words: ', with the colour of a dark box',
    },
    larger: {
      effects: [fx('size', 'Larger'), fx('ambient-eq', 'Open')],
      words: ', its body made larger',
    },
    smaller: {
      effects: [fx('size', 'Smaller'), fx('spread', 'Open middle')],
      words: ', its body made smaller',
    },
    sampled: {
      effects: [fx('vintage-digital', 'Glaze'), fx('ambient-eq', 'Warm')],
      words: ", in an early sampler's grain",
    },
    bowing: { effects: [fx('late-vibrato', 'Slow bow')], words: ', with a late slow vibrato' },
    turning: {
      effects: [fx('around', 'Barely moving')],
      words: ', dry, hardly turning round the head',
    },
    bodyup: {
      effects: [fx('ambient-eq', 'Deep', { low: 6 }), fx('saturator', 'Warm glue')],
      words: ', dry, its floor raised',
    },
    forward: {
      effects: [fx('ambient-eq', 'Forward'), fx('ambient-comp', 'Level')],
      words: ', dry and pushed forward',
    },
    felted: { effects: [fx('sift', 'Soft hammers')], words: ', dry, its blows softened' },
    hollowed: {
      effects: [fx('ambient-eq', 'Hollow'), fx('stereo-detune', 'Soft halo', { mix: 0.2 })],
      words: ', dry, hollowed in the middle',
    },
    opening: {
      effects: [fx('auto-filter', 'Glacial low-pass')],
      words: ', under a slow dark filter',
    },
    gated: {
      effects: [
        fx('auto-filter', 'Low-pass gate', { cutoffHz: 300, envAmount: 75, envReleaseMs: 500 }),
      ],
      words: ', through a filter that shuts after each note',
    },
    warmed: {
      effects: [fx('saturator', 'Soft tape warmth'), fx('spread', 'Tight shimmer')],
      words: ', dry and gently driven',
    },
    booth: {
      effects: [fx('ether-reverb', 'Small booth', { mix: 0.16 })],
      words: ', in a small booth',
    },
    chamber: {
      effects: [fx('hall-reverb', 'Tight chamber', { mix: 0.2 })],
      words: ', in a tight chamber',
    },
    carpet: {
      effects: [
        fx('fdn-reverb', 'Short ambience', { mix: 0.25 }),
        fx('ambient-eq', 'Warm', { low: 2 }),
      ],
      words: ', in a carpeted room',
    },
    kitchen: {
      effects: [fx('plate-reverb', 'Tight room', { mix: 0.2 })],
      words: ', on a short plate',
    },
    springy: { effects: [fx('spring-reverb', 'Hint of spring')], words: ', with a hint of spring' },
    amp: {
      effects: [
        fx('re-amp', 'Combo in a room'),
        fx('spring-reverb', 'Dark amp spring', { mix: 0.15 }),
      ],
      words: ', through a small amplifier',
    },
    bedside: { effects: [fx('re-amp', 'Bedside radio')], words: ', from a radio by the bed' },
    across: { effects: [fx('distance', 'Across the room')], words: ', from across the room' },
    nextdoor: { effects: [fx('distance', 'Next door')], words: ', from the house next door' },
    cellar: {
      effects: [fx('expanse', 'Small dark room', { mix: 0.25 })],
      words: ', in a small dark cellar',
    },
    shut: {
      effects: [fx('shaped-reverb', 'Gated', { mix: 0.3 })],
      words: ', in a room that stops dead',
    },
    stairs: { effects: [fx('distance', 'Stone stairwell')], words: ', down a stone stairwell' },
    slap: {
      effects: [fx('tape-echo', 'Single slap', { mix: 0.22 }), fx('ambient-eq', 'Layer')],
      words: ', with one quick slap of tape',
    },
    hall: { effects: [fx('hall-reverb', 'Hall', { mix: 0.28 })], words: ', in a hall' },
    nave: { effects: [fx('hall-reverb', 'Vast nave', { mix: 0.28 })], words: ', in a vast nave' },
    darkhall: {
      effects: [fx('ambient-eq', 'Shaded'), fx('hall-reverb', 'Dark hall', { mix: 0.35 })],
      words: ', in a dark hall',
    },
    longplate: {
      effects: [fx('plate-reverb', 'Long plate', { mix: 0.3 })],
      words: ', on a long plate',
    },
    smallplate: {
      effects: [fx('chorus', 'Subtle widener'), fx('plate-reverb', 'Small plate', { mix: 0.28 })],
      words: ', chorused, on a small plate',
    },
    valley: {
      effects: [fx('fdn-reverb', 'Open valley', { mix: 0.3 })],
      words: ', across an open valley',
    },
    cave: { effects: [fx('fdn-reverb', 'Dark cave', { mix: 0.28 })], words: ', in a dark cave' },
    chapel: {
      effects: [fx('vowel-reverb', 'Chapel', { mix: 0.35 })],
      words: ', in a chapel that half sings',
    },
    monks: {
      effects: [fx('vowel-reverb', 'Low monks', { mix: 0.35 })],
      words: ', with low voices behind',
    },
    space: {
      effects: [fx('expanse', 'Open space', { mix: 0.3 })],
      words: ', in a wide open space',
    },
    thinair: { effects: [fx('expanse', 'Thin air', { mix: 0.35 })], words: ', in thin high air' },
    lowcath: {
      effects: [fx('expanse', 'Low cathedral', { mix: 0.3 })],
      words: ', over a low cathedral rumble',
    },
    latehall: {
      effects: [fx('ether-reverb', 'Late hall', { mix: 0.3 })],
      words: ', in a hall that answers late',
    },
    longdark: {
      effects: [fx('bloom-reverb', 'Long dark', { mix: 0.3 })],
      words: ', with a long dark bloom',
    },
    winter: {
      effects: [
        fx('spectral-drifter', 'Winter drift', { mix: 0.3 }),
        fx('plate-reverb', 'Dark plate', { mix: 0.15 }),
      ],
      words: ', drifting off in a cold wind',
    },
    glimmering: {
      effects: [fx('shimmer', 'Faint glimmer')],
      words: ', with a faint shimmer above',
    },
    loft: {
      effects: [fx('shimmer', 'Organ loft', { mix: 0.28 })],
      words: ', with an organ loft above',
    },
    ascent: {
      effects: [fx('spiral', 'Slow ascent', { mix: 0.3 })],
      words: ', its tail slowly climbing',
    },
    descent: {
      effects: [fx('spiral', 'Slow descent', { mix: 0.3 })],
      words: ', its tail slowly sinking',
    },
    cavern: {
      effects: [fx('swarm-reverb', 'Pattering', { mix: 0.28 })],
      words: ', in a cave of small echoes',
    },
    backward: {
      effects: [fx('shaped-reverb', 'Reverse', { mix: 0.35 })],
      words: ', with a room that runs backwards',
    },
    tiderev: {
      effects: [fx('shaped-reverb', 'Slow tide', { mix: 0.35 })],
      words: ', in a room that swells and ebbs',
    },
    mist: {
      effects: [fx('fog', 'Morning mist', { mix: 0.7 })],
      words: ', blurred by morning mist',
    },
    bank: {
      effects: [fx('fog', 'Dark bank', { mix: 0.6 }), fx('hall-reverb', 'Faint halo')],
      words: ', behind a dark bank of fog',
    },
    wall: { effects: [fx('haze', 'Faint warmth')], words: ', in a faint warm haze' },
    shore: { effects: [fx('distance', 'Far shore')], words: ', from a far shore' },
    fogged: { effects: [fx('distance', 'Through fog')], words: ', heard through fog' },
    flock: {
      effects: [
        fx('murmuration', 'Evening flock', { mix: 0.35 }),
        fx('hall-reverb', 'Room', { mix: 0.2 }),
      ],
      words: ', circling like an evening flock',
    },
    heads: {
      effects: [fx('tape-echo', 'Two head gallop', { mix: 0.25 })],
      words: ', repeated by two tape heads',
    },
    dotted: {
      effects: [fx('tape-echo', 'Dotted bounce', { mix: 0.25 }), fx('plate-reverb', 'Faint sheen')],
      words: ', with dotted echoes',
    },
    worn: {
      effects: [fx('tape-echo', 'Worn tape', { mix: 0.26 })],
      words: ', with worn and wobbling echoes',
    },
    trail: {
      effects: [fx('tape-echo', 'Long dark trail', { mix: 0.28 })],
      words: ', with a long dark trail of echoes',
    },
    bucket: {
      effects: [fx('analog-delay', 'Dark echo', { mix: 0.25 })],
      words: ', with dark echoes',
    },
    chorecho: {
      effects: [fx('analog-delay', 'Chorused', { mix: 0.28 }), fx('ether-reverb', 'Faint air')],
      words: ', with chorused echoes',
    },
    hop: {
      effects: [fx('analog-delay', 'Fifth hop', { mix: 0.22 })],
      words: ', with echoes that hop in fifths',
    },
    mirror: {
      effects: [fx('reverse-delay', 'Slow swells', { mix: 0.3 })],
      words: ', with slow backward swells',
    },
    stone: {
      effects: [fx('skipping-stone', 'Soft pebble', { mix: 0.3 })],
      words: ', skipping away over water',
    },
    bounces: {
      effects: [fx('skipping-stone', 'Slowing bounces', { mix: 0.28 })],
      words: ', with bounces that slow down',
    },
    stars: {
      effects: [fx('constellation', 'Scattered seven', { mix: 0.3 })],
      words: ', with seven scattered echoes',
    },
    points: {
      effects: [
        fx('constellation', 'Faint points'),
        fx('plate-reverb', 'Distant haze', { mix: 0.15 }),
      ],
      words: ', with faint far echoes',
    },
    round: { effects: [fx('canon', 'Faint answer')], words: ', with one faint answer behind' },
    phasing: {
      effects: [fx('orbits', 'Slow phasing', { mix: 0.3 })],
      words: ', in loops that slip apart',
    },
    recall: {
      effects: [fx('echo-memory', 'Far back', { mix: 0.35 })],
      words: ', with moments of it drifting back',
    },
    prismed: {
      effects: [fx('prism', 'Low to high', { mix: 0.35 })],
      words: ', its echoes rising low to high',
    },
    tapes: {
      effects: [fx('tape-loop', 'Slow fade', { mix: 0.35 })],
      words: ', on a slowly fading tape loop',
    },
    softbed: {
      effects: [fx('micro-looper', 'Soft bed', { mix: 0.35 }), fx('spread', 'Wide top')],
      words: ', over a soft loop of itself',
    },
    embers: {
      effects: [fx('grain-delay', 'Falling embers', { mix: 0.25 })],
      words: ', with grains that fall like embers',
    },
    grains: {
      effects: [fx('grain-cloud', 'Slow smear', { mix: 0.3 })],
      words: ', with a slow smear of grains',
    },
    octrain: {
      effects: [fx('grain-cloud', 'Octave rain', { mix: 0.22 }), fx('fdn-reverb', 'Thin veil')],
      words: ', under a rain of octave grains',
    },
    blurred: {
      effects: [fx('spectral-blur', 'Faint haze', { mix: 0.4 })],
      words: ', in a faint spectral haze',
    },
    water: {
      effects: [fx('spectral-blur', 'Dark water', { mix: 0.35 })],
      words: ', over dark spectral water',
    },
    shadowed: {
      effects: [fx('stretch', 'Near shadow', { mix: 0.35 })],
      words: ', with a stretched shadow behind',
    },
    melting: {
      effects: [fx('melt', 'Soft sag', { mix: 0.35 })],
      words: ', its tail sagging softly',
    },
    leaves: {
      effects: [fx('falling', 'Slow sighs', { mix: 0.3 })],
      words: ', falling away in sighs',
    },
    tiles: {
      effects: [fx('cascade', 'Glass rain', { mix: 0.22 }), fx('hall-reverb', 'Faint halo')],
      words: ', with a glassy cascade',
    },
    sparks: {
      effects: [
        fx('glints', 'Slow stars', { mix: 0.25 }),
        fx('plate-reverb', 'Small plate', { mix: 0.18 }),
      ],
      words: ', with slow sparks above',
    },
    sines: {
      effects: [fx('sine-shadow', 'Low shadow', { mix: 0.35 })],
      words: ', with a low shadow of sines',
    },
    bowed: {
      effects: [fx('swell', 'Bowed'), fx('hall-reverb', 'Airy tail', { mix: 0.25 })],
      words: ', each note faded in, in an airy hall',
    },
    common: {
      effects: [
        fx('common-tones', 'Light touch'),
        fx('plate-reverb', 'Medium plate', { mix: 0.2 }),
      ],
      words: ', its shared tones held on',
    },
    rooms: {
      effects: [fx('generations', 'Single return', { mix: 0.4 })],
      words: ', played back once into a room',
    },
    pedalled: {
      effects: [fx('sympathetic', 'Piano pedal', { mix: 0.3 })],
      words: ', waking strings tuned in C',
    },
    silent: {
      effects: [fx('silent-keys', 'Open fifth and bass', { mix: 0.35 })],
      words: ', waking silent strings',
    },
    bowl: { effects: [fx('bowls', 'Faint halo')], words: ', with a halo of bowls' },
    octaved: {
      effects: [fx('octaves', 'Faint octave'), fx('ether-reverb', 'Cathedral', { mix: 0.22 })],
      words: ', with faint octaves, in a cathedral',
    },
    pipes: {
      effects: [fx('stops', 'Nearly dry'), fx('hall-reverb', 'Hall', { mix: 0.22 })],
      words: ', with organ stops beside it, in a hall',
    },
    subbed: {
      effects: [fx('octaves', 'Sub octave', { sub1: 0.3 }), fx('ambient-eq', 'Open')],
      words: ', dry, with an octave under it',
    },
    slowdrift: {
      effects: [fx('freq-shifter', 'Slow drift', { mix: 0.35 })],
      words: ', beating slowly',
    },
    ringed: {
      effects: [fx('ring', 'Faint halo'), fx('ether-reverb', 'Room', { mix: 0.15 })],
      words: ', with a ring-modulated halo',
    },
    glassbar: {
      effects: [fx('warp', 'Soft chime', { mix: 0.4 }), fx('fdn-reverb', 'Room', { mix: 0.15 })],
      words: ', its partials stretched a little',
    },
    sunk: { effects: [fx('underwater', 'Just under')], words: ', just under water' },
    weathered: {
      effects: [fx('weather', 'Breezy day', { voice: 0.2 })],
      words: ', out in a breeze',
    },
    rain: { effects: [fx('weather', 'Light rain', { voice: 0.3 })], words: ', in light rain' },
    night: {
      effects: [fx('radio', 'Clean transistor'), fx('noise-floor', 'Faint hiss')],
      words: ', from a small transistor set',
    },
    dusty: {
      effects: [fx('vinyl', 'New pressing'), fx('hall-reverb', 'Room', { mix: 0.15 })],
      words: ', off a record, in a room',
    },
    cassette: { effects: [fx('patina', 'Worn cassette')], words: ', on a worn cassette' },
    seaside: { effects: [fx('seasons', 'Touch of sun')], words: ', in the first sun of spring' },
    frost: { effects: [fx('seasons', 'First frost', { mix: 0.7 })], words: ', in a first frost' },
    lasting: {
      effects: [fx('sustainer', 'Thin halo', { mix: 0.35 })],
      words: ', with a thin held halo',
    },
    section: {
      effects: [fx('pad-follower', 'Barely there'), fx('hall-reverb', 'Room', { mix: 0.2 })],
      words: ', a faint pad following it',
    },
    asleep: {
      effects: [fx('breath', 'Calm breath'), fx('hall-reverb', 'Warm undertow', { mix: 0.2 })],
      words: ', opening and closing like calm breath',
    },
    ripple: {
      effects: [fx('pulses', 'Faint ripple'), fx('plate-reverb', 'Small plate', { mix: 0.18 })],
      words: ', rippled by soft gates',
    },
    slowing: {
      effects: [fx('winding-down', 'Soft losing pace'), fx('spread', 'Wide but safe')],
      words: ', under a pulse that loses pace',
    },
    eight: {
      effects: [fx('band-pulse', 'Four a second'), fx('ether-reverb', 'Room', { mix: 0.15 })],
      words: ', its middle pulsed four times a second',
    },
    brought: {
      effects: [fx('lift', 'Just the ends'), fx('ambient-eq', 'Keys')],
      words: ', dry, its ends brought up',
    },
    revealed: {
      effects: [fx('reveal', 'Gentle opening'), fx('hall-reverb', 'Room', { mix: 0.15 })],
      words: ', its overtones drawn out',
    },
    singing: {
      effects: [
        fx('overtone-singer', 'Faint melody'),
        fx('plate-reverb', 'Dark plate', { mix: 0.2 }),
      ],
      words: ', a faint melody whistled in its overtones',
    },
    tuned: {
      effects: [fx('scale-filter', 'Lean to the key'), fx('hall-reverb', 'Room', { mix: 0.2 })],
      words: ', leaning into the key',
    },
    fuzzed: {
      effects: [fx('haze', 'Small room fuzz', { mix: 0.25 }), fx('ambient-eq', 'Distant')],
      words: ', with a little fuzz in a small room',
    },
    crackle: {
      effects: [fx('noise-floor', 'Old record'), fx('ambient-eq', 'Warm')],
      words: ', under the crackle of an old record',
    },
    brass: {
      effects: [
        fx('buzzing-bridge', 'Paper edge', { amount: 0.15 }),
        fx('ether-reverb', 'Room', { mix: 0.15 }),
      ],
      words: ', with a papery buzz',
    },
    near: {
      effects: [
        fx('ambient-limiter', 'Wall only', { ceiling: -11, gain: 7 }),
        fx('ambient-eq', 'Layer'),
      ],
      words: ', close, its quiet end drawn up',
    },
    nearroom: {
      effects: [
        fx('ether-reverb', 'Small booth', { mix: 0.16 }),
        fx('ambient-limiter', 'Wall only', { ceiling: -11, gain: 6 }),
      ],
      words: ', held close in a small booth',
    },
    nearplate: {
      effects: [
        fx('plate-reverb', 'Small plate', { mix: 0.22 }),
        fx('ambient-limiter', 'Wall only', { ceiling: -11, gain: 7 }),
      ],
      words: ', held close, on a small plate',
    },
    nearecho: {
      effects: [
        fx('tape-echo', 'Two head gallop', { mix: 0.22 }),
        fx('ambient-limiter', 'Wall only', { ceiling: -11, gain: 7 }),
      ],
      words: ', held close, between two tape heads',
    },
    nearhall: {
      effects: [
        fx('hall-reverb', 'Bright hall', { mix: 0.25 }),
        fx('ambient-limiter', 'Wall only', { ceiling: -11, gain: 7 }),
      ],
      words: ', brought near in a bright hall',
    },
    neardrive: {
      effects: [
        fx('saturator', 'Warm glue'),
        fx('ambient-limiter', 'Wall only', { ceiling: -11, gain: 9 }),
      ],
      words: ', driven a little and held close',
    },
    nearbit: {
      effects: [
        fx('vintage-digital', 'Glaze'),
        fx('ambient-limiter', 'Wall only', { ceiling: -11, gain: 8 }),
      ],
      words: ', grainy and held close',
    },
    rainnear: {
      effects: [
        fx('weather', 'Light rain', { voice: 0.3 }),
        fx('ambient-limiter', 'Wall only', { ceiling: -11, gain: 7 }),
      ],
      words: ', in light rain, held close',
    },
  },
  phrases: {
    gather: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 50, gain: 0.6 },
        { atSec: 0.8, durSec: 6.4, note: 57, gain: 0.55 },
        { atSec: 1.6, durSec: 5.6, note: 60, gain: 0.55 },
        { atSec: 2.4, durSec: 4.8, note: 65, gain: 0.55 },
        { atSec: 3.2, durSec: 4, note: 76, gain: 0.5 },
      ],
    },
    wide: {
      notes: [
        { atSec: 0, durSec: 7, note: 43, gain: 0.6 },
        { atSec: 0.08, durSec: 6.9, note: 50, gain: 0.5 },
        { atSec: 0.16, durSec: 6.8, note: 59, gain: 0.55 },
        { atSec: 0.24, durSec: 6.7, note: 64, gain: 0.5 },
        { atSec: 0.32, durSec: 6.6, note: 69, gain: 0.5 },
      ],
    },
    quiet: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 45, gain: 0.45 },
        { atSec: 0.3, durSec: 6.9, note: 52, gain: 0.4 },
        { atSec: 0.6, durSec: 6.6, note: 60, gain: 0.4 },
        { atSec: 0.9, durSec: 6.3, note: 67, gain: 0.4 },
        { atSec: 1.2, durSec: 6, note: 71, gain: 0.4 },
      ],
    },
    handover: {
      notes: [
        { atSec: 0, durSec: 3.5, note: 41, gain: 0.6 },
        { atSec: 0, durSec: 3.5, note: 57, gain: 0.5 },
        { atSec: 0, durSec: 3.5, note: 60, gain: 0.5 },
        { atSec: 0, durSec: 3.5, note: 64, gain: 0.55 },
        { atSec: 3.6, durSec: 3.6, note: 43, gain: 0.6 },
        { atSec: 3.6, durSec: 3.6, note: 55, gain: 0.5 },
        { atSec: 3.6, durSec: 3.6, note: 59, gain: 0.5 },
        { atSec: 3.6, durSec: 3.6, note: 62, gain: 0.5 },
        { atSec: 3.6, durSec: 3.6, note: 69, gain: 0.5 },
      ],
    },
    hanging: {
      notes: [
        { atSec: 0, durSec: 6.8, note: 43, gain: 0.6 },
        { atSec: 0, durSec: 6.8, note: 62, gain: 0.5 },
        { atSec: 0.02, durSec: 6.7, note: 67, gain: 0.5 },
        { atSec: 0, durSec: 2.4, note: 60, gain: 0.5 },
        { atSec: 2.4, durSec: 4.4, note: 59, gain: 0.5 },
        { atSec: 1.2, durSec: 1.8, note: 76, gain: 0.55 },
        { atSec: 3, durSec: 3.8, note: 74, gain: 0.55 },
      ],
    },
    fifths: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 36, gain: 0.6 },
        { atSec: 0.7, durSec: 6.5, note: 43, gain: 0.5 },
        { atSec: 1.4, durSec: 5.8, note: 50, gain: 0.5 },
        { atSec: 2.1, durSec: 5.1, note: 57, gain: 0.5 },
        { atSec: 2.8, durSec: 4.4, note: 64, gain: 0.5 },
      ],
    },
    six: {
      notes: [
        { atSec: 0, durSec: 7, note: 43, gain: 0.83 },
        { atSec: 0.1, durSec: 6.9, note: 50, gain: 0.76 },
        { atSec: 0.2, durSec: 6.8, note: 57, gain: 0.76 },
        { atSec: 0.3, durSec: 6.7, note: 62, gain: 0.76 },
        { atSec: 0.4, durSec: 6.6, note: 64, gain: 0.76 },
        { atSec: 0.5, durSec: 6.5, note: 71, gain: 0.76 },
      ],
    },
    ladder: {
      notes: [
        { atSec: 0, durSec: 7, note: 48, gain: 0.83 },
        { atSec: 0, durSec: 7, note: 55, gain: 0.69 },
        { atSec: 0, durSec: 7, note: 62, gain: 0.76 },
        { atSec: 0, durSec: 7, note: 65, gain: 0.76 },
        { atSec: 0, durSec: 7, note: 72, gain: 0.76 },
      ],
    },
    pair: {
      notes: [
        { atSec: 0, durSec: 7, note: 57, gain: 0.9 },
        { atSec: 0.05, durSec: 6.9, note: 64, gain: 0.83 },
      ],
    },
    trio: {
      notes: [
        { atSec: 0, durSec: 3.3, note: 52, gain: 0.83 },
        { atSec: 0.1, durSec: 3.2, note: 60, gain: 0.76 },
        { atSec: 0.2, durSec: 3.1, note: 67, gain: 0.76 },
        { atSec: 3.5, durSec: 3.7, note: 50, gain: 0.83 },
        { atSec: 3.6, durSec: 3.6, note: 57, gain: 0.76 },
        { atSec: 3.7, durSec: 3.5, note: 65, gain: 0.76 },
      ],
    },
    four: {
      notes: [
        { atSec: 0, durSec: 7, note: 53, gain: 0.83 },
        { atSec: 0.12, durSec: 6.8, note: 60, gain: 0.69 },
        { atSec: 0.24, durSec: 6.7, note: 64, gain: 0.69 },
        { atSec: 3.2, durSec: 3.8, note: 69, gain: 0.76 },
      ],
    },
    answer: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 69, gain: 0.9 },
        { atSec: 0.5, durSec: 1.4, note: 72, gain: 0.83 },
        { atSec: 2, durSec: 0.5, note: 64, gain: 0.83 },
        { atSec: 2.5, durSec: 1.6, note: 62, gain: 0.76 },
        { atSec: 4, durSec: 0.5, note: 67, gain: 0.9 },
        { atSec: 4.5, durSec: 0.6, note: 65, gain: 0.76 },
        { atSec: 5.2, durSec: 2, note: 57, gain: 0.76 },
      ],
    },
    tune: {
      notes: [
        { atSec: 0, durSec: 3, note: 48, gain: 0.69 },
        { atSec: 0, durSec: 0.8, note: 67, gain: 0.83 },
        { atSec: 0.9, durSec: 0.5, note: 69, gain: 0.76 },
        { atSec: 1.5, durSec: 1.4, note: 72, gain: 0.9 },
        { atSec: 3, durSec: 3.6, note: 53, gain: 0.69 },
        { atSec: 3, durSec: 0.8, note: 69, gain: 0.83 },
        { atSec: 3.9, durSec: 0.5, note: 67, gain: 0.69 },
        { atSec: 4.5, durSec: 0.8, note: 65, gain: 0.76 },
        { atSec: 5.4, durSec: 1.8, note: 64, gain: 0.83 },
      ],
    },
    hymn: {
      notes: [
        { atSec: 0, durSec: 1.7, note: 50, gain: 0.83 },
        { atSec: 0, durSec: 1.7, note: 69, gain: 0.83 },
        { atSec: 1.75, durSec: 1.7, note: 53, gain: 0.76 },
        { atSec: 1.75, durSec: 1.7, note: 74, gain: 0.83 },
        { atSec: 3.5, durSec: 1.7, note: 52, gain: 0.76 },
        { atSec: 3.5, durSec: 1.7, note: 72, gain: 0.76 },
        { atSec: 5.25, durSec: 2, note: 50, gain: 0.83 },
        { atSec: 5.25, durSec: 2, note: 74, gain: 0.76 },
      ],
    },
    waltz: {
      notes: [
        { atSec: 0, durSec: 0.9, note: 45, gain: 0.76 },
        { atSec: 0.6, durSec: 0.5, note: 60, gain: 0.55 },
        { atSec: 1.1, durSec: 0.5, note: 64, gain: 0.55 },
        { atSec: 1.6, durSec: 0.9, note: 69, gain: 0.83 },
        { atSec: 1.75, durSec: 0.9, note: 43, gain: 0.69 },
        { atSec: 2.3, durSec: 0.5, note: 59, gain: 0.55 },
        { atSec: 2.8, durSec: 0.5, note: 62, gain: 0.55 },
        { atSec: 3.4, durSec: 0.9, note: 67, gain: 0.83 },
        { atSec: 3.5, durSec: 0.9, note: 41, gain: 0.76 },
        { atSec: 4.1, durSec: 0.5, note: 57, gain: 0.55 },
        { atSec: 4.6, durSec: 0.5, note: 60, gain: 0.55 },
        { atSec: 5.2, durSec: 2, note: 64, gain: 0.83 },
        { atSec: 5.2, durSec: 2, note: 48, gain: 0.69 },
      ],
    },
    close: {
      notes: [
        { atSec: 0, durSec: 0.35, note: 64, gain: 0.83 },
        { atSec: 0.6, durSec: 0.35, note: 67, gain: 0.69 },
        { atSec: 1.2, durSec: 0.8, note: 71, gain: 0.83 },
        { atSec: 2.2, durSec: 0.35, note: 69, gain: 0.69 },
        { atSec: 2.8, durSec: 0.35, note: 64, gain: 0.69 },
        { atSec: 3.4, durSec: 1, note: 62, gain: 0.83 },
        { atSec: 4.6, durSec: 0.35, note: 60, gain: 0.69 },
        { atSec: 5.2, durSec: 1.6, note: 59, gain: 0.76 },
        { atSec: 5.2, durSec: 1.6, note: 52, gain: 0.69 },
      ],
    },
    peal: {
      notes: [
        { atSec: 0, durSec: 1, note: 79, gain: 0.83 },
        { atSec: 0.6, durSec: 1, note: 76, gain: 0.76 },
        { atSec: 1.2, durSec: 1, note: 74, gain: 0.76 },
        { atSec: 1.8, durSec: 1, note: 72, gain: 0.76 },
        { atSec: 2.4, durSec: 1, note: 69, gain: 0.76 },
        { atSec: 3, durSec: 2, note: 67, gain: 0.83 },
        { atSec: 4, durSec: 1, note: 74, gain: 0.69 },
        { atSec: 4.6, durSec: 1, note: 72, gain: 0.69 },
        { atSec: 5.2, durSec: 2, note: 64, gain: 0.83 },
      ],
    },
    strokes: {
      notes: [
        { atSec: 0, durSec: 2, note: 57, gain: 0.9 },
        { atSec: 2.3, durSec: 2, note: 57, gain: 0.9 },
        { atSec: 4.6, durSec: 2.6, note: 57, gain: 0.83 },
      ],
    },
    tower: {
      notes: [
        { atSec: 0, durSec: 3, note: 60, gain: 0.9 },
        { atSec: 1.5, durSec: 2, note: 67, gain: 0.76 },
        { atSec: 3, durSec: 3, note: 65, gain: 0.83 },
        { atSec: 4.5, durSec: 2.6, note: 72, gain: 0.76 },
      ],
    },
    high: {
      notes: [
        { atSec: 0, durSec: 2, note: 76, gain: 0.55 },
        { atSec: 1.4, durSec: 2, note: 83, gain: 0.5 },
        { atSec: 2.9, durSec: 2, note: 81, gain: 0.5 },
        { atSec: 4.4, durSec: 2.8, note: 88, gain: 0.45 },
      ],
    },
    crystal: {
      notes: [
        { atSec: 0, durSec: 0.6, note: 84, gain: 0.69 },
        { atSec: 0.5, durSec: 0.6, note: 79, gain: 0.69 },
        { atSec: 1, durSec: 0.6, note: 88, gain: 0.62 },
        { atSec: 2.2, durSec: 0.6, note: 81, gain: 0.69 },
        { atSec: 2.7, durSec: 0.6, note: 76, gain: 0.69 },
        { atSec: 3.6, durSec: 1.2, note: 86, gain: 0.62 },
        { atSec: 5, durSec: 2, note: 83, gain: 0.62 },
      ],
    },
    figure: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 57, gain: 0.83 },
        { atSec: 0.5, durSec: 0.5, note: 64, gain: 0.69 },
        { atSec: 1, durSec: 0.5, note: 60, gain: 0.69 },
        { atSec: 1.5, durSec: 0.5, note: 62, gain: 0.69 },
        { atSec: 2, durSec: 0.5, note: 57, gain: 0.83 },
        { atSec: 2.5, durSec: 0.5, note: 67, gain: 0.76 },
        { atSec: 3, durSec: 0.5, note: 60, gain: 0.69 },
        { atSec: 3.5, durSec: 0.5, note: 64, gain: 0.69 },
        { atSec: 4, durSec: 0.5, note: 53, gain: 0.83 },
        { atSec: 4.5, durSec: 0.5, note: 60, gain: 0.69 },
        { atSec: 5, durSec: 0.5, note: 62, gain: 0.69 },
        { atSec: 5.5, durSec: 1.6, note: 69, gain: 0.76 },
      ],
    },
    thrown: {
      notes: [
        { atSec: 0, durSec: 0.2, note: 72, gain: 0.9 },
        { atSec: 0.3, durSec: 0.2, note: 67, gain: 0.69 },
        { atSec: 0.6, durSec: 0.2, note: 76, gain: 0.76 },
        { atSec: 1.6, durSec: 0.2, note: 74, gain: 0.83 },
        { atSec: 1.9, durSec: 0.2, note: 69, gain: 0.69 },
        { atSec: 2.2, durSec: 0.2, note: 65, gain: 0.69 },
        { atSec: 3.4, durSec: 0.2, note: 64, gain: 0.83 },
        { atSec: 3.7, durSec: 0.2, note: 71, gain: 0.69 },
        { atSec: 4, durSec: 0.2, note: 79, gain: 0.69 },
        { atSec: 5.2, durSec: 0.4, note: 72, gain: 0.83 },
      ],
    },
    tossed: {
      notes: [
        { atSec: 0, durSec: 0.2, note: 62, gain: 0.9 },
        { atSec: 0.35, durSec: 0.2, note: 57, gain: 0.69 },
        { atSec: 0.7, durSec: 0.25, note: 65, gain: 0.76 },
        { atSec: 1.7, durSec: 0.2, note: 64, gain: 0.83 },
        { atSec: 2.05, durSec: 0.2, note: 60, gain: 0.69 },
        { atSec: 2.4, durSec: 0.25, note: 55, gain: 0.69 },
        { atSec: 3.5, durSec: 0.2, note: 53, gain: 0.83 },
        { atSec: 3.85, durSec: 0.2, note: 60, gain: 0.69 },
        { atSec: 4.2, durSec: 0.25, note: 69, gain: 0.69 },
        { atSec: 5.4, durSec: 0.6, note: 62, gain: 0.83 },
      ],
    },
    chimes: {
      notes: [
        { atSec: 0, durSec: 1.2, note: 55, gain: 0.8 },
        { atSec: 0.8, durSec: 1.2, note: 62, gain: 0.7 },
        { atSec: 1.6, durSec: 1.2, note: 59, gain: 0.7 },
        { atSec: 2.4, durSec: 1.6, note: 67, gain: 0.75 },
        { atSec: 3.6, durSec: 1.2, note: 64, gain: 0.75 },
        { atSec: 4.4, durSec: 1.2, note: 57, gain: 0.7 },
        { atSec: 5.2, durSec: 2, note: 60, gain: 0.8 },
      ],
    },
    low: {
      notes: [
        { atSec: 0, durSec: 2.2, note: 38, gain: 0.9 },
        { atSec: 2.4, durSec: 1.1, note: 45, gain: 0.9 },
        { atSec: 3.7, durSec: 1.1, note: 43, gain: 0.9 },
        { atSec: 5, durSec: 2.2, note: 36, gain: 0.9 },
      ],
    },
    deep: {
      notes: [
        { atSec: 0, durSec: 3.2, note: 29, gain: 0.75 },
        { atSec: 3.4, durSec: 3.8, note: 36, gain: 0.7 },
      ],
    },
    walk: {
      notes: [
        { atSec: 0, durSec: 0.9, note: 33, gain: 0.9 },
        { atSec: 1, durSec: 0.9, note: 40, gain: 0.9 },
        { atSec: 2, durSec: 0.9, note: 41, gain: 0.9 },
        { atSec: 3, durSec: 0.9, note: 43, gain: 0.9 },
        { atSec: 4, durSec: 0.9, note: 45, gain: 0.9 },
        { atSec: 5, durSec: 2, note: 38, gain: 0.9 },
      ],
    },
    pedal: {
      notes: [
        { atSec: 0, durSec: 7, note: 38, gain: 0.7 },
        { atSec: 0, durSec: 7, note: 45, gain: 0.5 },
        { atSec: 1.5, durSec: 1.4, note: 65, gain: 0.5 },
        { atSec: 3, durSec: 1.4, note: 64, gain: 0.5 },
        { atSec: 4.5, durSec: 2.6, note: 62, gain: 0.5 },
      ],
    },
    stump: {
      notes: [
        { atSec: 0, durSec: 0.4, note: 36, gain: 0.9 },
        { atSec: 0.75, durSec: 0.3, note: 36, gain: 0.76 },
        { atSec: 1.5, durSec: 0.6, note: 43, gain: 0.9 },
        { atSec: 3, durSec: 0.4, note: 41, gain: 0.9 },
        { atSec: 3.75, durSec: 0.3, note: 41, gain: 0.76 },
        { atSec: 4.5, durSec: 0.6, note: 38, gain: 0.9 },
        { atSec: 5.6, durSec: 1.6, note: 31, gain: 0.9 },
      ],
    },
    drone: {
      notes: [
        { atSec: 0, durSec: 7.3, note: 38, gain: 0.65 },
        { atSec: 0.1, durSec: 7.2, note: 45, gain: 0.5 },
        { atSec: 0.2, durSec: 7.1, note: 50, gain: 0.5 },
        { atSec: 1.5, durSec: 5.8, note: 57, gain: 0.45 },
        { atSec: 3, durSec: 4.3, note: 64, gain: 0.45 },
      ],
    },
    single: {
      notes: [{ atSec: 0, durSec: 6.8, note: 57, gain: 0.65 }],
    },
    middle: {
      notes: [
        { atSec: 0, durSec: 7, note: 55, gain: 0.6 },
        { atSec: 2, durSec: 5, note: 62, gain: 0.5 },
      ],
    },
    lone: {
      notes: [
        { atSec: 0, durSec: 3.2, note: 74, gain: 0.55 },
        { atSec: 3.4, durSec: 3.8, note: 69, gain: 0.55 },
      ],
    },
    sigh: {
      notes: [
        { atSec: 0, durSec: 2.4, note: 41, gain: 0.55 },
        { atSec: 0, durSec: 2.4, note: 57, gain: 0.5 },
        { atSec: 0, durSec: 2.4, note: 60, gain: 0.5 },
        { atSec: 0, durSec: 2.4, note: 64, gain: 0.6 },
        { atSec: 2.45, durSec: 2.4, note: 43, gain: 0.5 },
        { atSec: 2.45, durSec: 2.4, note: 55, gain: 0.5 },
        { atSec: 2.45, durSec: 2.4, note: 59, gain: 0.5 },
        { atSec: 2.45, durSec: 2.4, note: 62, gain: 0.6 },
        { atSec: 4.9, durSec: 2.4, note: 40, gain: 0.55 },
        { atSec: 4.9, durSec: 2.4, note: 55, gain: 0.5 },
        { atSec: 4.9, durSec: 2.4, note: 60, gain: 0.5 },
        { atSec: 4.9, durSec: 2.4, note: 64, gain: 0.55 },
      ],
    },
    calls: {
      notes: [
        { atSec: 0, durSec: 2.3, note: 62, gain: 0.83 },
        { atSec: 0.2, durSec: 2.1, note: 69, gain: 0.69 },
        { atSec: 2.5, durSec: 2.3, note: 64, gain: 0.83 },
        { atSec: 2.7, durSec: 2.1, note: 67, gain: 0.69 },
        { atSec: 5, durSec: 2.3, note: 60, gain: 0.83 },
        { atSec: 5.2, durSec: 2.1, note: 64, gain: 0.69 },
      ],
    },
    shop: {
      notes: [
        { atSec: 0, durSec: 7, note: 60, gain: 0.83 },
        { atSec: 0.2, durSec: 6.8, note: 67, gain: 0.69 },
        { atSec: 0.5, durSec: 6.5, note: 74, gain: 0.69 },
        { atSec: 1.1, durSec: 5.9, note: 76, gain: 0.69 },
        { atSec: 1.6, durSec: 5.4, note: 83, gain: 0.62 },
      ],
    },
    murmur: {
      notes: [
        { atSec: 0, durSec: 7, note: 64, gain: 0.69 },
        { atSec: 0.4, durSec: 6.6, note: 67, gain: 0.62 },
        { atSec: 0.8, durSec: 6.2, note: 69, gain: 0.62 },
        { atSec: 1.2, durSec: 5.8, note: 74, gain: 0.62 },
      ],
    },
  },
  directions: [
    {
      id: 'learning-walls',
      name: 'Learning walls',
      category: 'pad',
      rows: `
First night on one wall | Long wall | beat=.35 learn=.55 hammer=.2 glow=.8 bloom=.7 decay=18 swing=.65 unlike=0.45 width=0.8 true=0.95 tick=0.13 second=.8 interval=7 case=Marble volume=-7 | hall | gather | Nested coils and fifths in marble learn one slow swing
Seven at my aunt's | Long wall | gong=Coil beat=.6 strikes=.8 learn=.9 glow=.35 bloom=.3 decay=6 width=.6 case=Marble unlike=0.05 tick=0.13 runDown=.17 volume=0.5 | carpet | six | Coils in marble that soon strike as one
Wool behind the dial | Long wall | gong=Straight_rod hammer=.05 beat=.5 strikes=.3 glow=.9 bloom=.2 decay=7 second=.7 interval=7 hush=.3 unlike=0.2 true=0.87 runDown=.12 volume=-4.5 | shade | handover | Rods under wool, hardly struck, glowing with a fifth
Landing at two | Long wall | gong=Tube beat=.25 strikes=.9 hammer=.15 glow=.5 bloom=.9 case=Iron decay=16 swing=.4 unlike=0.05 width=0.75 true=1 tick=0.1 runDown=.13 volume=-6.5 | stairs | wide | Dull iron tubes that toll together and bloom late
Nobody winds it now | Long wall | gong=Cup beat=.4 strikes=.6 hammer=.1 glow=.6 runDown=.6 decay=10 interval=-12 second=.8 tick=.1 true=0.87 volume=1 | dusty | gather | Cups and a low octave that slow and soften as they are held
Rain on the workshop | Felt roll | beat=3 strikes=.5 learn=.6 unlike=.5 gong=Straight_rod hammer=.3 glow=.2 second=.5 interval=12 true=0.87 tick=0.17 case=Marble decay=4 runDown=.17 volume=6 | open | gather | Soft hammers rolling quickly on marble rods, half in step
Moth at the dial | Felt roll | gong=Coil beat=3.2 hammer=.2 strikes=.9 bloom=.8 decay=3 case=Marble second=.3 interval=5 glow=.1 width=.7 true=0.89 tick=0.15 runDown=.13 volume=-1 | chamber | hanging | A soft coil roll in marble with a fourth above
Wheels at rest | Felt roll | gong=Nested beat=2.2 learn=.9 unlike=.1 strikes=.4 glow=.8 bloom=.6 decay=12 swing=.6 interval=7 true=0.87 case=Iron volume=-6.5 | longplate | wide | Nested iron and fifths that pulse together twice a second
A field of pendulums | Felt roll | gong=Tube beat=3.6 learn=0 unlike=1 hammer=.15 case=Iron strikes=.5 glow=.3 decay=8 interval=-12 runDown=.14 | space | six | Iron tubes in a felt roll that never meets
Warm hands, cold brass | Felt roll | gong=Cup beat=5 hammer=.04 strikes=1 decay=5 case=Oak bloom=.2 interval=-5 second=.9 glow=.15 swing=.5 width=0.8 true=0.87 tick=0.17 runDown=.23 volume=-0.5 | taped | handover | Cups in oak rolled with the softest felt, a fourth under each
Held by the escapement | Night hall | gong=Nested beat=.5 strikes=.8 hammer=.35 decay=9 bloom=.5 glow=.6 case=Oak swing=.4 interval=0 unlike=0.45 true=0.93 tick=0.14 volume=-4 | valley | hanging | One braked blow on nested coils each two seconds
Between four strokes | Night hall | gong=Coil beat=1 strikes=1 hammer=.1 decay=4 glow=1 bloom=.2 learn=1 interval=12 second=.4 unlike=0.05 true=0.95 tick=0.14 volume=0.5 | latehall | sigh | Felt coils that beat as one each second over a glow
Lamp left for the late | Night hall | gong=Straight_rod beat=.3 strikes=.6 hammer=.25 decay=14 glow=.9 case=Marble bloom=.7 interval=7 hush=.3 unlike=0.5 runDown=.21 volume=1.5 | wall | gather | Clear rods and fifths, one braked stroke, then a long rub
Slow blue hallway | Night hall | gong=Cup beat=.4 decay=18 bloom=.95 glow=.2 hammer=.3 case=Oak interval=-12 second=.9 swing=.7 unlike=0.2 true=0.87 runDown=.18 volume=-3 | vibed | wide | Cups and low octaves that bloom after each braked blow
As the weight comes down | Night hall | gong=Tube case=Iron beat=.6 strikes=.9 decay=7 hammer=.5 glow=.15 bloom=.4 interval=-12 width=.5 unlike=0.1 true=0.87 tick=0.11 runDown=.11 volume=-2 | darkhall | handover | Iron tubes struck hard and braked as one
Leaves against the case | Wound once | beat=1.6 strikes=.6 runDown=0 gong=Nested hammer=.2 glow=.7 tick=0.12 decay=8 learn=.8 volume=1 | mist | gather | Light uneven knocks on nested coils over a steady rub
A hundred small keys | Wound once | beat=2.4 runDown=0 gong=Straight_rod hammer=.4 glow=.5 tick=0.12 decay=12 case=Glass_dome strikes=.5 bloom=.6 volume=5 | thinair | hanging | Verge knocks on rods in a dome, thin and never even
Attic in the afternoon | Wound once | beat=1 runDown=.55 gong=Cup hammer=.3 glow=.4 tick=.1 case=Oak strikes=1 decay=14 interval=12 second=.7 true=0.87 volume=6 | worn | quiet | Light knocks on cups and octaves that slow as the spring is spent
Snow on the sill | Wound once | beat=.7 runDown=.17 gong=Tube hammer=.1 glow=.9 tick=0 strikes=.4 decay=10 swing=.6 case=Glass_dome interval=12 second=.6 true=0.97 volume=2 | blurred | gather | Glass tubes rubbed and barely knocked
Coat over the chair | Wound once | beat=3 runDown=.11 gong=Coil hammer=.05 glow=.8 tick=0.11 strikes=.7 case=Marble decay=4 width=1 interval=7 second=.5 true=0.97 volume=4.5 | drift | handover | Quick muffled knocks on coils with fifths beside them
Swing shared by five | Splayed arpeggio | gong=Nested escapement=Anchor beat=.4 hammer=.2 glow=.7 bloom=.7 decay=10 strikes=.6 interval=0 swing=.5 width=0.75 tick=0.17 | glimmering | gather | Nested coils share one slow swing out evenly
Every window in turn | Splayed arpeggio | escapement=Anchor gong=Cup case=Glass_dome beat=.7 hammer=.3 glow=.4 decay=12 strikes=.8 interval=-12 second=.6 unlike=.2 tick=0.13 runDown=0.4 volume=3 | nave | fifths | Domed cups strike in turn round the wall, octaves below, running slowly down
Where light goes next | Splayed arpeggio | escapement=Rub_only gong=Tube beat=.35 glow=.8 swing=.9 hammer=.3 decay=9 bloom=.5 case=Marble interval=12 true=0.97 runDown=0.45 volume=4 | turning | ladder | Rubbed tubes in marble pass their swells round, tiring slowly
Four sleepers breathing | Splayed arpeggio | escapement=Rub_only gong=Coil beat=.5 glow=.4 swing=1 hammer=.1 decay=3 strikes=.2 case=Oak interval=-12 second=.8 width=.6 true=0.88 volume=6 | wood | sigh | Dull coils rubbed, each swelling in its own quarter
Slow game of catch | Splayed arpeggio | gong=Straight_rod escapement=Deadbeat beat=.5 hammer=.1 glow=.5 decay=7 strikes=.7 case=Iron interval=7 bloom=.4 width=0.8 true=0.89 tick=0.11 runDown=.18 volume=0.5 | smallplate | gather | Braked felt on iron rods, one after another
Up the long staircase | Passed along | gong=Nested beat=.8 hammer=.25 glow=.6 decay=9 bloom=.7 case=Oak swing=.5 strikes=.6 width=.8 true=0.88 runDown=0.5 | hall 1.mix=.35 | six | A soft wave climbs the nested coils from low to high, slower the longer it is held
Wave along the shelf | Passed along | gong=Straight_rod beat=2.4 hammer=.3 glow=.4 decay=5 case=Marble strikes=.7 swing=.9 width=0.75 bloom=.3 true=0.95 runDown=.13 volume=3 | chorale | six | Rods in marble, a quick wave up the chord
Tide under the stairs | Passed along | escapement=Rub_only gong=Coil beat=.6 glow=.9 swing=1 hammer=.2 case=Iron decay=6 bloom=.5 interval=-12 true=0.89 volume=4 | lowcath | drone | Rubbed iron coils swell from the low key to the high
Palm over palm | Passed along | gong=Cup beat=1.2 hammer=.15 glow=.3 case=Oak decay=14 strikes=.8 swing=.5 interval=12 second=.7 tick=0.14 true=0.95 runDown=.16 volume=0 | mirror | ladder | Cups in oak pass the stroke upwards, octaves over them
Lights down the platform | Passed along | gong=Tube beat=.9 hammer=.35 glow=.5 case=Glass_dome decay=9 strikes=.5 bloom=.8 interval=7 second=.6 true=0.88 runDown=.16 volume=2.5 | fogged | gather | Domed tubes brighten in order from low to high
Warm before the stroke | Rubbed drone | escapement=Anchor gong=Nested beat=.3 strikes=.5 glow=.8 learn=.8 unlike=.3 hammer=.3 bloom=.4 interval=12 decay=9 width=0.8 true=0.89 tick=0.1 runDown=.18 | chapel | handover | Nested coils rubbed and struck in step, octaves on top
The caretaker's round | Rubbed drone | escapement=Anchor gong=Straight_rod beat=.7 strikes=.7 glow=.7 learn=.9 hammer=.15 case=Oak interval=7 second=.6 decay=6 swing=.3 true=0.88 tick=0.11 runDown=.14 | sines | hanging | Soft rods and fifths rubbed between strokes in step
Breath on the glass | Rubbed drone | gong=Tube case=Glass_dome beat=.6 glow=.5 hammer=.4 learn=.7 interval=12 bloom=.2 decay=8 strikes=.6 swing=.5 true=0.89 runDown=.19 volume=1.5 | asleep | wide | Domed tubes rubbed by hand, with octaves above
Copper under cloth | Rubbed drone | gong=Cup case=Marble beat=.5 glow=.6 hammer=.1 learn=.9 unlike=.1 interval=-12 decay=14 bloom=.5 swing=.4 width=0.75 true=1 volume=4.5 | reel | sigh | Cups rubbed in marble with an octave underneath
Low fire in the grate | Rubbed drone | gong=Coil case=Oak beat=.8 glow=1 hammer=.15 learn=.6 unlike=.4 bloom=.2 interval=0 decay=4 swing=.5 hush=.3 true=0.89 runDown=.14 | crackle | wide | Coils rubbed hard, warm, pulsing as they learn
Strangers for a minute | Long wall | gong=Coil learn=.1 unlike=1 beat=.7 hammer=.3 strikes=.7 glow=.5 decay=8 case=Oak width=0.8 tick=0.11 runDown=.15 volume=-3.5 | phasing | six | Unlike coils that drift through each other and do not learn
An hour apart | Long wall | gong=Straight_rod learn=.2 unlike=.9 beat=1.1 hammer=.2 strikes=.9 glow=.4 case=Marble decay=7 bloom=.2 interval=-5 second=.6 true=0.95 tick=0.15 runDown=.15 volume=1.5 | doubled | gather | Rods in marble, each in its own time, a fourth under
Slow to make friends | Long wall | gong=Tube learn=.4 unlike=.8 beat=.5 hammer=.25 case=Oak decay=12 glow=.3 interval=-12 second=.7 true=0.88 tick=0.1 runDown=.11 volume=0 | flock | fifths | Tubes in oak that strain toward one swing
Two rooms, one draught | Long wall | learn=.3 unlike=.7 beat=.9 gong=Cup case=Iron hammer=.15 glow=.6 decay=10 swing=.7 bloom=.4 width=.5 true=0.89 tick=0.14 runDown=.2 volume=3.5 | bowed | hanging | Cups in iron that nearly agree
The stubborn one | Long wall | learn=.5 unlike=1 beat=1.6 strikes=.6 hammer=.35 glow=.5 bloom=.8 case=Glass_dome decay=9 interval=12 second=.5 true=0.89 tick=0.11 runDown=.21 volume=-6 | chorecho | gather | Domed nested gongs that pull and never quite meet
Hoar on the skylight | Glass morning | wall=In_step beat=1 glow=1 hammer=.8 swing=.8 interval=19 second=.5 decay=10 unlike=0.2 runDown=.18 volume=1.5 | points | quiet | Glass tubes rubbed in step with a twelfth above
A dome for each star | Glass morning | escapement=Anchor wall=In_step gong=Cup beat=.5 strikes=.7 glow=.3 hammer=.4 interval=7 decay=20 unlike=0.05 width=0.75 true=0.97 tick=0.14 runDown=.12 volume=1.5 | stars | gather | Cups in domes struck together, fifths between
Milk in the saucer | Glass morning | wall=Splayed gong=Nested beat=.6 glow=.7 hammer=.2 swing=.6 interval=12 decay=6 hush=.3 unlike=0.05 width=0.8 true=0.89 runDown=.13 volume=5 | felted | handover | Nested glass rubbed softly, swelling in turn
High shelf, clean cloth | Glass morning | escapement=Deadbeat wall=In_step gong=Straight_rod beat=.7 strikes=.5 hammer=.6 glow=.5 bloom=.3 interval=12 decay=14 true=0.87 tick=0.17 runDown=.23 volume=2.5 | ascent | ladder | Domed rods with a light braked stroke in step
Winter sun at noon | Glass morning | wall=Chain gong=Coil beat=.8 glow=.8 hammer=.7 swing=.8 interval=0 bloom=.8 decay=7 case=Marble unlike=0.15 true=0.87 runDown=.15 volume=5 | sparks | fifths | Coils rubbed bright in marble, the swells climbing
Below the cellar clock | Coil bass | escapement=Anchor gong=Nested beat=.3 strikes=.6 glow=.6 hammer=.08 decay=8 bloom=.4 hush=.2 width=.5 interval=7 unlike=0.05 true=0.89 tick=0.13 runDown=.17 | cave | handover | Nested coils under thick felt with fifths, in step
Old oak holding heat | Coil bass | gong=Straight_rod beat=.5 strikes=.4 glow=.8 hammer=.12 decay=5 interval=-12 second=.8 hush=.3 width=.6 swing=.4 true=0.87 tick=0.11 runDown=.21 volume=-10.5 | bodyup | handover | Dark rods in oak and a low octave, rubbed and rocked
Under the coal store | Coil bass | gong=Tube case=Iron beat=.4 strikes=.5 glow=.5 hammer=.1 decay=10 hush=.2 swing=.6 width=.4 bloom=.3 unlike=0.15 true=0.88 runDown=0.35 | water | drone | Iron tubes under felt, an octave lower again, slower the longer it is held
The floor remembers | Coil bass | escapement=Deadbeat gong=Coil beat=.25 strikes=.9 glow=.4 hammer=.2 decay=9 hush=.15 bloom=.8 interval=-7 width=.6 unlike=0.5 true=0.88 tick=0.1 | rooms | wide | Coils braked every four seconds with a fifth below
Lamplight, door ajar | Coil bass | escapement=Rub_only gong=Cup case=Oak beat=.45 glow=.6 hammer=.1 decay=8 swing=.8 hush=.3 width=.7 bloom=.1 interval=0 true=0.93 runDown=.15 volume=2.5 | lasting | sigh | Cups rubbed dark in oak, rising and sinking together
`,
    },
    {
      id: 'opposed-pairs',
      name: 'Opposed pairs',
      category: 'bell',
      rows: `
Left shoe, right shoe | Two parties | beat=1.5 hammer=.35 decay=2.2 case=Oak second=.1 unlike=0.1 runDown=0.5 volume=-3.5 | bare | four | Rods in oak walk left and right, one clean blow each, slower each time | plucked
Opposite doors | Two parties | beat=.9 strikes=1 hammer=.7 decay=6 hush=.2 interval=12 second=.6 unlike=0.5 true=0.88 runDown=.15 volume=1.5 | hall | four | Hard rods and octaves strike from two sides in marble
Street between windows | Two parties | beat=.6 case=Iron hammer=.45 decay=5 swing=.8 bloom=.6 width=.6 unlike=0.4 true=0.8 runDown=.25 | heads | ladder | Iron rods answer across the street, each clang braked
Table tennis at night | Two parties | beat=2.4 strikes=.8 hammer=.6 decay=1.2 tick=.35 hush=.6 runDown=.14 volume=4 | shut | pair | Quick dry rods tossed from side to side, ticking | plucked
Twins in separate beds | Two parties | beat=.45 hammer=.15 decay=9 bloom=.5 glow=.3 case=Oak interval=7 second=.5 unlike=0.2 true=0.8 volume=2.5 | smallplate | handover | Felt on rods with fifths, two sides taking slow turns
Courtyard from both ends | Night hall | wall=Opposed gong=Coil beat=.4 learn=.9 decay=10 hammer=.5 glow=.1 interval=0 hush=.2 unlike=0.4 tick=0.1 runDown=.34 volume=-4 | stone | trio | Braked coils call from one side and the other
Ferry and landing stage | Night hall | wall=Opposed escapement=Anchor gong=Coil case=Iron beat=.6 learn=1 decay=8 hammer=.3 bloom=.5 interval=-12 unlike=0.2 tick=0.12 volume=0 | shore | fifths | Iron coils and low octaves answer over a slow swing
Neighbours who nod | Night hall | wall=Opposed escapement=Anchor gong=Coil case=Marble beat=1 strikes=.5 hammer=.7 decay=4 glow=0 interval=12 second=.5 unlike=0.4 true=0.74 tick=0.1 runDown=.14 volume=-0.5 | chamber | pair | Bright coils in marble nod left, then right
Lamps on either hand | Long wall | wall=Opposed gong=Coil case=Oak beat=.7 learn=1 strikes=.8 hammer=.35 decay=7 glow=.3 swing=.8 unlike=0.45 true=0.8 tick=0.17 runDown=.31 volume=-2.5 | swayed | four | Coils in oak that rise on one side as the other sinks
Long marriage | Long wall | wall=Opposed gong=Coil escapement=Deadbeat beat=.3 strikes=.9 learn=.8 unlike=.1 hammer=.2 decay=12 glow=.4 width=1 tick=0.17 volume=-0.5 | darkhall | handover | Felt coils, two parties, one stroke in three seconds
Saucer and cup | Two parties | escapement=Anchor gong=Cup beat=.8 hammer=.4 decay=10 case=Oak interval=12 second=.6 unlike=0.1 true=0.76 runDown=.22 | springy | pair | Cups in oak struck on one side and then the other
The quarrel of spoons | Two parties | escapement=Verge gong=Cup beat=1.6 hammer=.75 decay=8 tick=.2 unlike=.5 case=Marble true=0.8 volume=6 | nearplate 2.gain=13 | trio | Uneven hard knocks on marble cups from two parties
Evening bowls | Two parties | gong=Cup beat=.35 hammer=.1 decay=20 hush=.1 bloom=.7 case=Oak interval=-12 second=.8 unlike=0.2 true=1 runDown=.21 | bowl | wide | Felt on cups and low octaves, left and right by turns
Sugar over the counter | Two parties | gong=Cup case=Glass_dome beat=2 strikes=.7 hammer=.5 decay=12 interval=19 second=.4 swing=.2 true=0.88 runDown=0.45 volume=6 | tiles | ladder | Small domed cups handed over quickly, twelfths on top, slower each time
Two deer at the gate | Two parties | escapement=Rub_only gong=Cup beat=.5 glow=.6 hammer=.2 decay=14 swing=1 case=Oak strikes=.4 unlike=0.5 true=0.89 runDown=.12 volume=6 | leaves | calls | Rubbed cups that lift and lower on alternate sides | pad
Two steeples | Tube bells | wall=Opposed escapement=Deadbeat beat=.5 strikes=.9 learn=1 hammer=.7 decay=12 case=Marble unlike=0.1 true=0.76 tick=0.1 runDown=.23 volume=-0.5 | nave | tower | Hard tubes toll from two towers, octaves under them
Argument of the hours | Tube bells | wall=Opposed escapement=Anchor case=Iron beat=.7 strikes=.8 learn=.9 hammer=.6 decay=9 interval=7 second=.5 true=0.8 tick=0.12 runDown=.21 | dotted | handover | Iron tubes and their fifths contradict each other
Town gate and chapel | Tube bells | wall=Opposed escapement=Deadbeat case=Oak beat=.4 strikes=1 hammer=.35 decay=16 bloom=.6 true=0.7 runDown=.28 volume=-7 | chapel | pair | Tubes in oak, gate first, then chapel, each blow braked
Pier in two weathers | Tube bells | wall=Opposed escapement=Anchor case=Glass_dome beat=.9 strikes=.6 hammer=.8 decay=14 interval=12 second=.4 unlike=0.4 tick=0.11 runDown=.37 volume=3.5 | weathered | four | Glass tubes struck hard on alternate sides
Curfew, both banks | Tube bells | wall=Opposed escapement=Deadbeat gong=Tube beat=.3 strikes=.8 hammer=.2 decay=18 bloom=.9 glow=.4 interval=-12 second=.9 runDown=.25 | trail | fifths | Felt tubes bloom late from one bank, then the other
Hasp and staple | Raw iron | wall=Opposed learn=1 unlike=0 beat=1.2 gong=Straight_rod true=.4 hammer=.5 decay=3 bloom=.2 interval=0 tick=0.15 runDown=.17 volume=4.5 | desk | four | Iron rods half out of true, struck from two sides
Yard at shift change | Raw iron | wall=Opposed learn=.9 beat=.6 gong=Nested true=.6 hammer=.6 decay=6 interval=-12 second=.6 case=Iron tick=0.11 runDown=.29 volume=1.5 | cavern | fifths | Iron coils clang in two parties, each blow braked
Both ends of the bridge | Raw iron | wall=Opposed escapement=Anchor learn=.8 unlike=.3 beat=.5 gong=Tube true=.6 hammer=.4 decay=24 hush=.2 interval=-5 tick=0.1 case=Marble runDown=.18 volume=-6.5 | valley | wide | Marble tubes a little bent, fourths below, swing against each other
Kettle and stove | Raw iron | wall=Opposed escapement=Verge learn=.7 beat=1.8 gong=Cup true=.7 hammer=.6 decay=9 case=Marble bloom=.3 interval=5 volume=6 | neardrive 2.gain=11 | trio | Cups knocked unevenly, a fourth above, side to side
Anvils, politely | Raw iron | wall=Opposed learn=1 unlike=.1 beat=.8 gong=Coil true=.3 hammer=.9 decay=2.5 bloom=0 interval=12 second=.4 tick=0.17 runDown=.14 volume=6 | taped | pair | Brass on raw iron coils, short and alternate | plucked
Rain from two gutters | Tick texture | wall=Opposed learn=.9 beat=2 gong=Straight_rod decay=2.5 tick=.2 hammer=.5 glow=0 interval=12 runDown=.25 volume=6 | rainnear | shop | Light knocks on marble rods dripping from both sides | texture
Two typists | Tick texture | wall=Opposed learn=1 unlike=.1 beat=3 gong=Coil decay=2 tick=.35 hammer=.7 case=Oak interval=7 second=.4 glow=0 true=0.84 runDown=.25 volume=-4 | nearbit 2.gain=6 | ladder | Quick dry coils and ticks in strict turns | texture
Finches at the feeder | Tick texture | wall=Opposed learn=.6 beat=1.2 gong=Cup case=Glass_dome decay=8 tick=.15 hammer=.4 interval=-5 glow=.2 true=0.75 volume=6 | nearplate | calls | Domed cups chirp and answer, never quite even | texture
The knitting sisters | Tick texture | wall=Opposed escapement=Anchor learn=1 unlike=.2 beat=1.4 gong=Straight_rod case=Oak decay=1.6 tick=.4 hammer=.2 interval=5 true=0.8 runDown=.18 | wooden | pair | Felt on short rods with fourths, needle for needle | plucked
Pebbles between boots | Tick texture | wall=Opposed escapement=Deadbeat learn=1 unlike=0 beat=1 gong=Tube hammer=.4 interval=-12 strikes=1 tick=.12 decay=7 runDown=.15 volume=-1 | near 1.gain=4 | four | Braked marble tubes kicked from one side to the other
Asked a fourth below | Parlour keys | wall=Opposed escapement=Anchor strikes=.9 learn=1 beat=1 interval=-5 second=1 hammer=.4 decay=5 width=1 unlike=0.15 true=0.86 runDown=.35 volume=-4 | carpet | trio | Coils that ask above and answer a fourth below | keys
Handed over the hedge | Parlour keys | wall=Opposed escapement=Anchor strikes=.8 learn=.9 beat=.75 gong=Straight_rod interval=7 second=1 hammer=.3 decay=7 glow=.2 width=.8 true=0.97 runDown=.37 volume=1 | slap | pair | Soft rods replying a fifth up from the other side | keys
Seventh of the house | Parlour keys | wall=Opposed escapement=Anchor strikes=.7 learn=.9 beat=.6 gong=Tube interval=10 second=.8 hammer=.4 decay=8 hush=.3 case=Oak unlike=0.1 true=0.86 runDown=.27 volume=-0.5 | worn | four | Oak tubes that answer with a minor seventh above | keys
Ninth before the hour | Parlour keys | wall=Opposed escapement=Anchor strikes=.8 learn=.8 beat=.5 gong=Cup interval=14 second=.9 hammer=.2 decay=12 hush=.2 case=Oak true=0.88 tick=0.14 runDown=.35 volume=5 | points | pair | Cups under felt with a ninth that comes a half swing later
Two octaves apart | Parlour keys | wall=Opposed escapement=Anchor strikes=1 learn=1 beat=1.4 gong=Nested interval=24 second=.7 hammer=.5 decay=6 case=Marble unlike=0.15 true=0.82 tick=0.14 runDown=.25 volume=0.5 | doubled | trio | Nested coils and, across the room, two octaves up | plucked
Letter and reply | Cup plucks | wall=Opposed strikes=.9 beat=1 gong=Coil case=Oak hammer=.4 decay=5 second=.8 interval=0 unlike=0.1 true=0.97 tick=0.14 runDown=.2 volume=3.5 | reel | answer | Coils in oak whose answer comes from the other rod | keys
Change on the counter | Cup plucks | wall=Opposed strikes=1 beat=3.5 gong=Straight_rod case=Marble decay=3 hammer=.5 second=.5 interval=12 unlike=0.55 volume=6 | felted | tossed | Marble rods doubled at once by a quick second blow | plucked
Porch light, hall light | Cup plucks | wall=Opposed strikes=.8 beat=.5 gong=Tube case=Oak hammer=.35 decay=10 second=.8 interval=12 swing=.4 unlike=0.45 true=0.76 tick=0.12 | chorale | calls | Tubes in oak answered an octave up after a second
Spoons in honey | Cup plucks | wall=Opposed strikes=.7 beat=1.2 gong=Nested case=Oak hammer=.12 decay=6 second=.9 interval=-7 bloom=.4 glow=.3 unlike=0.2 tick=0.14 runDown=.11 | warmed | handover | Nested felt, replying a fifth below | keys
Third house on the left | Cup plucks | wall=Opposed strikes=1 beat=.8 gong=Cup case=Marble hammer=.5 decay=24 second=.7 interval=4 true=0.8 unlike=0.75 tick=0.13 hush=.1 runDown=.18 volume=6 | mirror | pair | Marble cups answered by a third above
Lanterns on the quay | Glass morning | wall=Opposed escapement=Anchor gong=Cup beat=.4 strikes=.6 learn=.9 hammer=.5 glow=.8 decay=18 swing=.8 unlike=0.5 runDown=.32 volume=2 | fogged | calls | Glass cups glow and strike on alternate sides
Aviary after hours | Glass morning | wall=Opposed escapement=Verge gong=Tube beat=1.1 strikes=.7 learn=.8 hammer=.6 glow=.3 decay=6 interval=12 tick=.1 true=0.76 runDown=.15 volume=3.5 | glimmering | ladder | Light knocks on glass tubes from two perches
Crystal set, two ears | Glass morning | wall=Opposed escapement=Deadbeat gong=Straight_rod beat=1.8 strikes=.9 learn=1 hammer=.8 glow=0 decay=5 interval=0 swing=.2 runDown=.18 volume=6 | swept | pair | Domed rods, hard and clean, in either ear by turns
Sash and counterweight | Glass morning | wall=Opposed escapement=Anchor gong=Nested beat=.6 strikes=.7 learn=1 hammer=.3 glow=.5 decay=8 interval=-12 second=.9 unlike=0.15 true=0.8 runDown=.14 | hollowed | gather | Nested glass that rises on the left as it sinks right | pad
Ice on both ponds | Glass morning | wall=Opposed escapement=Deadbeat gong=Coil beat=.5 strikes=.8 learn=.9 hammer=.9 glow=.1 decay=9 bloom=.8 interval=7 true=0.95 tick=0.13 runDown=0.45 volume=3 | backward | four | Domed coils struck with brass, their tops coming late, slower each time
Man and wooden horse | Splayed arpeggio | wall=Opposed learn=.9 gong=Coil case=Oak beat=1.6 decay=2 hammer=.15 second=.2 interval=-12 tick=.1 true=0.74 runDown=.37 | wood | stump | Felt coils trot in oak, close and short | plucked
Seesaw, late summer | Splayed arpeggio | wall=Opposed escapement=Anchor gong=Straight_rod beat=.8 strikes=.8 decay=6 hammer=.3 glow=.4 swing=.9 interval=5 case=Oak tick=0.17 runDown=.21 | seaside | ladder | Rods that tip from side to side with a fourth above
Pair of wells | Splayed arpeggio | wall=Opposed gong=Nested beat=.45 decay=10 hammer=.25 bloom=.8 glow=.2 interval=-12 second=.7 case=Iron true=0.78 tick=0.14 runDown=.29 volume=2.5 | cave | fifths | Iron coils braked in turn, each blow rising late
Draughts by the window | Splayed arpeggio | wall=Opposed learn=1 gong=Cup case=Marble beat=1.1 decay=7 hammer=.45 interval=0 tick=.1 runDown=.31 volume=6 | nearroom 2.gain=10 | trio | Marble cups set down one side, then the other | keys
The tide clerk | Splayed arpeggio | wall=Opposed escapement=Anchor gong=Tube case=Marble beat=.35 strikes=.7 decay=20 hammer=.5 glow=.5 interval=7 bloom=.5 runDown=.25 volume=1 | tapes | hanging | Marble tubes and fifths, ledger left and ledger right
`,
    },
    {
      id: 'parlour-keys',
      name: 'Parlour keys',
      category: 'keys',
      rows: `
Tea at the long table | Parlour keys | hammer=.4 decay=5 second=.55 escapement=Deadbeat unlike=0.75 true=0.93 tick=0.11 volume=-4 | carpet | tune | Coils and octaves struck once by each key in oak
Practice room, half past | Parlour keys | gong=Straight_rod hammer=.55 decay=3 hush=.75 case=Marble second=.3 unlike=0.45 volume=5 | chamber | waltz | Clear marble rods, stopped as each key is let go
Sunday gloves | Parlour keys | hammer=.08 decay=8 hush=.5 second=.6 interval=0 bloom=.5 escapement=Anchor unlike=0 tick=0.13 volume=-0.5 | felted | hymn | Coils under soft felt, two alike on each key
The piano tuner's child | Parlour keys | gong=Nested hammer=.35 decay=5 interval=12 second=.7 true=.72 tick=.1 unlike=0.5 escapement=Anchor hush=.4 bloom=.6 case=Iron volume=1 | reel | close | Nested iron and its octaves, tuned only nearly right
Dust sheet folded back | Parlour keys | gong=Cup hammer=.3 decay=10 hush=.4 case=Oak interval=-12 second=.7 escapement=Anchor unlike=0.45 volume=-2.5 | dusty | tune | Cups in oak with the octave below under every key
Back room, felt down | Parlour keys | gong=Straight_rod hammer=.03 decay=4 interval=-12 second=.5 case=Oak glow=.1 escapement=Anchor unlike=0.85 tick=0.1 | wood | handover | The softest felt on rods, an octave underneath
Bone and brass | Parlour keys | hammer=.95 case=Marble second=.6 bloom=0 hush=.8 decay=5 unlike=0.1 true=0.93 tick=0.15 volume=6 | nearroom 2.gain=12 | close | Bare brass on marble coils, short and bright
Iron frame upright | Parlour keys | gong=Coil case=Iron hammer=.5 decay=3 interval=12 second=.4 hush=.7 unlike=0.75 true=0.84 tick=0.14 volume=2.5 | amp | waltz | Coils that clang in an iron frame, stopped at key up
Under the glass lid | Parlour keys | gong=Straight_rod case=Glass_dome hammer=.45 decay=5 interval=0 second=.5 escapement=Anchor unlike=0.5 volume=0 | glinting | tune | Rods in a glass dome with a unison beating slowly
Cedar drawer | Parlour keys | gong=Tube case=Oak hammer=.2 decay=4 interval=-12 second=.8 width=.2 escapement=Deadbeat unlike=0.45 tick=0.1 volume=-4 | boxed | hymn | Felt tubes and low octaves shut in oak, nearly mono
Once more from the hall | Parlour keys | gong=Straight_rod beat=.9 strikes=.8 hammer=.35 interval=12 second=.7 decay=5 hush=.4 unlike=0.85 true=0.95 tick=0.11 volume=1.5 | hall | tune | Rods answered by the octave a half second late
Said twice, softly | Parlour keys | gong=Cup beat=1.6 strikes=.6 hammer=.12 interval=-5 second=.8 decay=12 unlike=0.1 true=0.88 tick=0.14 case=Marble volume=5.5 | slap | waltz | Felt on marble cups, each key repeated quickly a fourth down
Echo in the pantry | Parlour keys | gong=Nested beat=2.5 strikes=1 hammer=.5 case=Marble interval=7 second=.6 decay=3 unlike=0.85 runDown=.13 volume=6 | kitchen | close | Nested marble, a fifth snapping back at once
Grandmother repeats it | Parlour keys | gong=Cup beat=1.1 strikes=.7 hammer=.3 case=Oak interval=-12 second=.9 decay=5 unlike=0 tick=0.1 hush=.3 volume=6 | recall | tune | Cups that say each key again an octave lower
Reply from upstairs | Parlour keys | gong=Tube beat=.45 strikes=.9 hammer=.4 case=Glass_dome interval=-12 second=.8 decay=8 hush=.2 unlike=0.1 true=0.84 tick=0.14 volume=1 | night | calls | Domed tubes that reply over a second later
Stair carpet waltz | Felt roll | escapement=Chime_hammer hammer=.15 decay=5 glow=.2 hush=.5 interval=12 second=.4 width=0.75 volume=-3 | shade | waltz | Rods under felt, an octave a moment behind each key
Lace on the music stand | Felt roll | escapement=Anchor gong=Nested case=Glass_dome hammer=.3 decay=6 glow=.5 hush=.3 interval=19 second=.3 strikes=0 width=0.75 true=0.86 tick=0.14 volume=-1.5 | airy | hymn | Nested glass and a twelfth, faintly rubbed while held
Candle on the lid | Felt roll | escapement=Anchor gong=Cup case=Oak hammer=.1 decay=12 glow=.6 hush=.4 interval=0 second=.6 bloom=.2 strikes=0 width=0.45 tick=0.17 volume=2.5 | monks | handover | Cups under felt that keep glowing under the hand
Slow hands after supper | Felt roll | escapement=Anchor gong=Coil case=Oak hammer=.18 decay=7 glow=.5 hush=.5 bloom=.8 interval=7 second=.4 strikes=0 width=0.75 true=0.86 tick=0.11 volume=-1.5 | wall | tune | Coils whose upper tones and fifth rise late
Wet umbrella stand | Felt roll | escapement=Chime_hammer gong=Tube case=Iron hammer=.2 decay=9 glow=.1 hush=.4 interval=-12 second=.6 width=0.65 runDown=.12 volume=1.5 | stairs | waltz | Muffled iron tubes, the octave below close behind
Deacon's harmonium lid | Cup plucks | gong=Nested case=Oak hammer=.4 decay=7 second=.6 interval=12 glow=.85 bloom=.5 hush=.4 escapement=Anchor strikes=0 unlike=0.2 true=0.93 tick=0.15 volume=-10.5 | pipes | hymn | Nested coils held by a fine rub under each key
Marbles on the stairs | Cup plucks | gong=Straight_rod case=Marble hammer=.8 decay=4 hush=.5 strikes=0 second=.4 interval=24 escapement=Verge unlike=0.75 tick=0.12 volume=6 | stone | close | Hard short rods with a glint two octaves above
Snowglobe music lesson | Cup plucks | gong=Cup hammer=.5 decay=9 strikes=0 interval=12 second=.4 bloom=.4 escapement=Deadbeat unlike=0.65 volume=6 | sparks | tune | Cups in a dome and their octaves, struck by the key alone
The blue guest room | Cup plucks | gong=Tube case=Oak hammer=.25 decay=12 hush=.3 strikes=0 second=.5 interval=7 escapement=Anchor unlike=0.1 tick=0.15 | phasing | calls | Oak tubes with a soft fifth, left to ring
Thin soup, thick carpet | Cup plucks | gong=Coil case=Marble hammer=.3 decay=4 hush=.7 strikes=0 second=.4 interval=19 width=.3 escapement=Verge unlike=0.55 true=0.95 tick=0.11 volume=6 | nearroom 2.gain=10 | waltz | Short marble coils with a trace of the twelfth
Ticket window, closed | Splayed arpeggio | escapement=Chime_hammer learn=0 hammer=.5 decay=3 case=Marble interval=0 tick=.2 swing=0 width=0.45 runDown=.19 volume=3 | bedside | close | Plain marble rods and a small tick under held keys
Choir boy's toy | Splayed arpeggio | escapement=Anchor gong=Cup case=Marble decay=6 hammer=.45 interval=12 second=.5 glow=.5 bloom=.3 strikes=0 width=0.55 tick=0.12 volume=-1 | nearhall | hymn | Marble cups in octaves, gently rubbed
First snow rehearsal | Splayed arpeggio | escapement=Chime_hammer gong=Nested case=Marble decay=8 hammer=.6 interval=5 second=.3 bloom=.7 hush=.3 width=0.45 volume=2.5 | thinair | handover | Nested marble, a fourth half a second behind, its wash late
Kite over the roofs | Splayed arpeggio | escapement=Chime_hammer gong=Tube case=Glass_dome decay=5 hammer=.3 interval=-5 second=.5 hush=.6 width=0.55 true=0.88 tick=0.15 runDown=.19 volume=1.5 | stars | calls | Glass tubes, a fourth lower close behind, thin and quickly let go
House plans in pencil | Splayed arpeggio | escapement=Chime_hammer gong=Coil case=Glass_dome decay=4 hammer=.2 interval=-12 second=.5 swing=.4 hush=.5 beat=2 width=0.75 runDown=.15 volume=5 | smaller | tune | Coils in a dome, lean, a faint low octave answering
Brushed by the sleeve | Two parties | escapement=Rub_only gong=Straight_rod beat=1 glow=.3 strikes=0 decay=3 hammer=.4 case=Oak swing=.2 hush=.6 unlike=0.45 true=0.84 volume=6 | bowing | hymn | Rods rubbed softly and struck by a light hand
Organ of spoons | Two parties | escapement=Rub_only gong=Cup case=Marble beat=2 glow=.7 strikes=0 decay=8 hammer=.5 swing=.1 interval=12 second=.7 unlike=0.4 true=0.88 volume=5 | whirl | handover | Marble cups rubbed steadily in octaves | organ
Reading by the stove | Two parties | escapement=Rub_only gong=Coil case=Oak beat=.4 glow=.4 strikes=0 decay=2 hammer=.15 swing=.4 second=.6 interval=-12 volume=6 | fuzzed | sigh | Coils rubbed low and warm, octaves beneath | organ
Window-seat organ | Two parties | escapement=Rub_only gong=Nested case=Glass_dome beat=.8 glow=.5 strikes=0 decay=4 hammer=.6 swing=.2 interval=7 second=.5 unlike=0.1 volume=6 | loft | hymn | Nested glass rubbed with fifths, clear at the top | organ
Bench by the bellows | Two parties | escapement=Rub_only gong=Tube case=Iron beat=.5 glow=.6 strikes=.3 decay=5 hammer=.2 swing=.3 interval=12 second=.6 true=0.88 volume=3 | nextdoor | sigh | Iron tubes rubbed in octaves, a dull reed-like hum | organ
Quick brown clock | Two parties | escapement=Deadbeat beat=2 strikes=.6 hammer=.5 decay=1.8 wall=In_step learn=1 gong=Coil case=Oak tick=.15 unlike=0.4 width=0.55 volume=4.5 | triode | trio | Short oak coils repeated twice a second while held
Winder's typewriter | Wound once | escapement=Deadbeat beat=3.4 runDown=.5 strikes=.9 gong=Straight_rod case=Marble hammer=.7 decay=3.5 tick=.5 true=0.88 volume=2 | sampled | hymn | Dry rods and ticks that repeat and run down
Metal fern | Wound once | beat=1.6 runDown=.8 strikes=.8 gong=Nested case=Glass_dome hammer=.4 decay=7 tick=.1 interval=-12 second=.8 true=0.84 volume=6 | melting | tune | Nested glass knocked unevenly until the spring is spent
Telegram from upstairs | Wound once | escapement=Anchor beat=2.8 runDown=.7 gong=Cup case=Oak hammer=.4 decay=6 tick=.2 hush=.4 volume=-2.5 | gated | trio | Cups in oak tapped to and fro, soon slowing
Key turned twice | Wound once | escapement=Deadbeat beat=1.2 runDown=.9 strikes=1 gong=Coil case=Oak hammer=.35 decay=5 tick=.3 interval=-12 second=.4 true=0.88 volume=-0.5 | taped | tune | Coils that repeat twice or so and stop, ticking
Painted metal bird | Raw iron | escapement=Anchor true=.5 gong=Straight_rod decay=4 bloom=.2 hammer=.6 hush=.5 interval=0 case=Marble strikes=0 volume=6 | rooms | waltz | Rods bent half out of true, beating at the unison
Salt-stained keys | Raw iron | escapement=Chime_hammer true=.3 gong=Coil decay=5 hammer=.4 hush=.4 bloom=.4 case=Oak interval=12 second=.4 tick=0.12 runDown=.16 | cassette | tune | Raw coils in oak, their tones a little off
Glasshouse keyboard | Raw iron | escapement=Deadbeat true=.8 gong=Tube case=Glass_dome decay=12 hammer=.6 hush=.3 interval=-5 second=.5 strikes=0 | glassbar | hymn | Domed tubes with fourths below, slightly bent
Scullery piano | Raw iron | escapement=Deadbeat true=.6 gong=Cup case=Marble decay=6 hammer=.5 hush=.6 bloom=.1 interval=-12 second=.6 strikes=0 tick=0.17 volume=6 | nearroom 2.gain=10 | close | Marble cups loosely tuned with octaves below
Boiler house hymn | Raw iron | escapement=Anchor true=.7 gong=Nested case=Iron decay=8 hammer=.3 hush=.4 interval=-12 second=.5 bloom=.6 strikes=0 | across | hymn | Iron nested coils rising late over low octaves
Moonlit draughtboard | Glass morning | escapement=Chime_hammer gong=Straight_rod strikes=.5 beat=2.4 hammer=.4 glow=.2 decay=9 interval=12 hush=.4 unlike=0.75 width=0.45 true=1 tick=0.13 volume=1.5 | bucket | close | Domed rods, each key answered by an octave
Opal button box | Glass morning | escapement=Anchor gong=Cup strikes=0 hammer=.5 glow=0 decay=18 interval=0 second=.4 hush=.5 bloom=.2 unlike=0.55 width=0.45 tick=0.13 volume=0.5 | prismed | waltz | Glass cups, two almost alike on each key
Paper lampshade | Glass morning | escapement=Anchor gong=Nested strikes=0 case=Oak hammer=.12 glow=.5 decay=5 interval=12 second=.6 hush=.5 unlike=0.55 width=0.75 tick=0.11 volume=1.5 | shadowed | sigh | Nested felt in oak with octaves, barely rubbed
Reading room, lamps down | Night hall | escapement=Anchor strikes=0 gong=Straight_rod hammer=.2 decay=10 glow=.2 case=Oak hush=.5 interval=12 second=.4 bloom=.3 unlike=0.1 tick=0.11 volume=1 | latehall | tune | Rods under felt with faint octaves, long in the ear
Chapel room upright | Night hall | escapement=Chime_hammer strikes=.4 gong=Coil beat=1 hammer=.5 decay=6 glow=0 hush=.5 interval=0 second=.5 unlike=0.5 runDown=.12 volume=-1.5 | loft | hymn | Coils in oak that beat at the unison, answered once
`,
    },
    {
      id: 'hanging-tubes',
      name: 'Hanging tubes',
      category: 'bell',
      rows: `
Stairwell at noon | Tube bells | hammer=.7 beat=.5 decay=20 second=.8 strikes=.8 hush=.05 unlike=0 true=0.8 tick=0.1 runDown=.15 volume=6 | stairs | tower | Hanging tubes in marble with a low octave, answered once
Sexton's wool gloves | Tube bells | hammer=.15 strikes=0 decay=16 case=Oak interval=0 second=.4 bloom=.3 unlike=0.85 tick=0.1 volume=-6 | chapel | strokes | Tubes under wool in oak, one stroke to a key
Gilded ladder | Tube bells | hammer=.9 strikes=0 decay=10 interval=12 second=.7 hush=.2 bloom=0 escapement=Deadbeat unlike=0.45 volume=2 | nearhall | peal | Brass on marble tubes with octaves above
Nine o'clock, snow | Tube bells | case=Iron hammer=.55 decay=24 strikes=.4 beat=.3 interval=7 second=.4 bloom=.6 unlike=0.45 tick=0.15 runDown=.12 | frost | calls | Iron tubes that bloom late, a faint fifth after them
Boat bell in dry dock | Tube bells | case=Iron hammer=.6 decay=6 hush=.3 interval=-12 second=.5 strikes=.5 beat=.8 unlike=0.2 true=0.85 tick=0.13 runDown=.14 volume=6 | nearplate 2.gain=6 | strokes | Iron tubes that clang, answered once by the octave below
Third carillon key | Splayed arpeggio | gong=Tube case=Marble beat=.7 decay=9 hammer=.6 interval=0 hush=.2 width=0.6 runDown=.26 volume=6 | dotted | ladder | Braked tubes share the swing out, plain unisons
Rings let go in order | Passed along | gong=Tube case=Marble beat=1.2 hammer=.5 decay=10 interval=12 bloom=.4 tick=0.11 runDown=.17 volume=-0.5 | valley | six | Tubes passed from low to high, octaves with them
Bell ropes in the dark | Long wall | gong=Tube escapement=Deadbeat beat=.5 strikes=.9 hammer=.5 decay=14 glow=.2 unlike=0.1 width=0.5 true=0.8 tick=0.11 volume=-7 | darkhall | gather | Tubes braked together every two seconds
Scattered villages | Splayed arpeggio | gong=Tube escapement=Anchor beat=.35 unlike=.9 learn=.3 hammer=.4 decay=16 case=Oak interval=7 width=0.6 tick=0.12 runDown=0.3 | shore | fifths | Oak tubes and fifths, each keeping its own hour, slower each time
Round of five ringers | Splayed arpeggio | gong=Tube escapement=Anchor beat=1.5 decay=5 hammer=.75 case=Marble interval=0 second=.2 strikes=.8 width=0.6 true=0.74 tick=0.12 volume=6 | nearroom 2.gain=4 | ladder | Quick hard tubes in an even round
Tubes behind the organ | Night hall | beat=.4 strikes=.5 hammer=.5 decay=10 glow=1 bloom=.4 interval=12 unlike=0.1 tick=0.11 runDown=0.45 volume=-1.5 | pipes | wide | Tubes struck every few seconds over a held glow, slower each time
Frost bells | Night hall | case=Glass_dome hammer=.6 beat=.3 glow=.1 interval=-12 second=.7 decay=18 bloom=.2 unlike=0.2 tick=0.12 runDown=.37 volume=2.5 | glimmering | tower | Clear blows on domed tubes with a low octave
Undertaker's hallway | Night hall | case=Iron hammer=.1 beat=.2 interval=-12 second=.9 decay=24 bloom=.5 volume=-4 | cave | middle | Iron under felt, an octave lower too, five seconds a stroke
Sleepwalker's gallery | Night hall | case=Oak escapement=Anchor beat=.5 hammer=.2 glow=.6 decay=12 interval=5 second=.6 bloom=.8 swing=.8 tick=0.11 runDown=.25 volume=-4 | backward | handover | Soft tubes and fourths swing to and fro
All hours at once | Night hall | learn=0 unlike=1 beat=.7 hammer=.45 decay=9 interval=0 glow=.1 strikes=.8 case=Marble tick=0.12 runDown=.15 volume=0 | cavern | six | Marble tubes that never agree on the hour
Chimes in the pear tree | Glass morning | escapement=Verge beat=.6 strikes=.6 gong=Tube case=Oak hammer=.5 decay=8 interval=12 tick=0.12 learn=.2 unlike=.9 width=0.75 true=0.85 volume=1.5 | weathered | shop | Light uneven knocks on oak tubes and octaves
Wind, then no wind | Glass morning | escapement=Verge beat=1.4 runDown=.6 strikes=.8 case=Glass_dome hammer=.6 decay=10 interval=7 unlike=0.45 width=0.6 true=0.76 tick=0.15 volume=6 | space | quiet | Domed tubes knocked by a breeze that soon drops
Railing in the sun | Glass morning | escapement=Anchor beat=2.2 strikes=.4 case=Marble hammer=.7 decay=3 glow=0 interval=0 swing=.2 width=0.5 true=0.74 volume=6 | glassbar | ladder | Thin marble tubes ringing quickly in even shares
Silver paper | Glass morning | escapement=Anchor strikes=0 case=Glass_dome hammer=.85 decay=5 glow=.1 interval=24 second=.3 bloom=0 unlike=0.55 width=0.6 tick=0.13 volume=6 | tiles | chimes | Brass on glass tubes with a glint two octaves up
Greenhouse in the wind | Glass morning | escapement=Anchor wall=Opposed beat=.9 strikes=.5 hammer=.45 glow=.4 decay=12 interval=-12 second=.7 unlike=0.5 true=0.76 tick=0.1 runDown=.21 volume=2.5 | leaves | lone | Glass tubes that sway over low octaves
One rod, one room | Tube bells | gong=Straight_rod strikes=0 hammer=.5 decay=9 case=Oak second=.2 interval=0 hush=.2 unlike=0.65 | bare | peal | A clear rod in oak struck once, nothing added
School corridor | Tube bells | gong=Straight_rod strikes=.8 beat=3 hammer=.55 decay=6 case=Iron interval=7 second=.6 unlike=0 true=0.88 tick=0.11 volume=0 | kitchen | answer | Firm iron rods, a fifth in a quick second blow
Stair rods, lamp below | Tube bells | gong=Straight_rod case=Iron hammer=.4 decay=20 strikes=.3 beat=.4 interval=7 second=.5 bloom=.6 unlike=0.5 tick=0.17 runDown=.18 | nave | tower | Iron rods and fifths ringing on, answered softly
Rods under the stage | Tube bells | gong=Straight_rod case=Oak hammer=.1 decay=12 strikes=0 interval=-12 second=.9 bloom=.2 escapement=Anchor unlike=0.2 true=0.8 volume=-6 | lowcath | strokes | Felt on oak rods with strong low octaves
Glass rods in a case | Tube bells | gong=Straight_rod case=Glass_dome hammer=.4 decay=14 strikes=.5 beat=1 interval=-12 second=.7 unlike=0.85 tick=0.1 volume=6 | points | tower | Domed rods, a low octave answering after half a second
Cracked and loved | Raw iron | gong=Tube case=Oak true=.5 hammer=.75 decay=10 escapement=Anchor strikes=0 interval=0 bloom=.3 tick=0.15 volume=-2 | reel | peal | Tubes in oak out of true, beating
Foundry sample | Raw iron | gong=Tube true=.2 hammer=.7 decay=8 escapement=Chime_hammer strikes=.5 beat=.6 interval=-12 second=.5 bloom=.6 runDown=.17 | heavy | strokes | Raw iron tubes with dark low octaves, answered once
Temple on the far bank | Raw iron | gong=Tube true=.4 hammer=.3 decay=20 escapement=Anchor beat=.25 bloom=.9 interval=-5 second=.6 tick=0.12 volume=-8.5 | shore | fifths | Half-true iron tubes that toll slowly and bloom
Cattle on the slope | Raw iron | gong=Cup true=.5 case=Oak hammer=.4 escapement=Verge beat=.7 learn=.1 bloom=.2 interval=5 decay=14 tick=0.11 volume=6 | valley | shop | Uneven knocks on loose cups in oak
Thaw on the bell frame | Raw iron | gong=Tube true=.75 case=Glass_dome hammer=.5 decay=12 escapement=Deadbeat beat=.5 interval=12 second=.5 learn=.8 tick=0.11 runDown=.26 volume=3.5 | winter | gather | Domed tubes a little bent, struck in step
Bell with a glow | Rubbed drone | escapement=Anchor gong=Tube hammer=.6 strikes=0 glow=.9 bloom=.8 interval=0 decay=20 case=Marble width=0.75 true=0.97 tick=0.13 volume=-1.5 | softbed | tower | Marble tubes struck by the key, then rubbed on
Halo of the hour | Rubbed drone | escapement=Anchor gong=Nested hammer=.5 strikes=0 beat=.5 glow=.7 interval=12 decay=16 width=0.75 true=0.85 tick=0.13 volume=-6.5 | lasting | calls | Nested coils struck once and kept alight with octaves
Cup and ball | Cup plucks | case=Iron hammer=.35 decay=16 strikes=.6 beat=1.3 interval=7 second=.5 unlike=0.45 true=0.76 tick=0.15 runDown=.14 volume=0.5 | bounces | answer | Cups in iron with fifths, answered a breath later
Deep cups | Cup plucks | case=Iron hammer=.2 decay=24 strikes=0 interval=-12 second=.8 bloom=.7 hush=.1 escapement=Anchor unlike=0 tick=0.11 volume=-1.5 | bowl | strokes | Iron cups under felt, octave below, rising late
Cot beside the window | Cup plucks | gong=Nested hammer=.4 decay=10 strikes=0 interval=-5 second=.6 hush=.2 escapement=Deadbeat unlike=0.85 true=0.8 volume=1 | round | tune | Nested glass and a fourth below, one soft blow a key
Midsummer tower | Splayed arpeggio | gong=Nested beat=.5 hammer=.7 decay=12 case=Marble interval=-12 second=.6 strikes=.8 width=0.6 true=0.78 tick=0.11 volume=5.5 | hall | fifths | Nested marble braked in an even round, octaves under
Coils in the campanile | Splayed arpeggio | gong=Coil beat=.8 escapement=Anchor hammer=.55 decay=14 case=Iron interval=12 hush=.15 width=0.75 true=0.93 tick=0.11 runDown=0.5 volume=0 | cavern | gather | Iron coils ring to and fro around the wall, slower each time
Weathercock | Splayed arpeggio | gong=Cup beat=1.1 escapement=Verge hammer=.6 decay=12 case=Marble learn=.8 interval=12 glow=0 width=0.85 true=0.76 tick=0.14 volume=3.5 | nearecho 2.gain=9 | ladder | Marble cups knocked lightly and unevenly in turn
Harvest supper peal | Splayed arpeggio | gong=Straight_rod beat=2.2 escapement=Deadbeat hammer=.6 decay=7 case=Oak interval=0 strikes=.9 width=0.6 true=0.8 tick=0.15 volume=3 | wooden | ladder | Oak rods in a brisk even peal while the chord is held
Round the clock face | Splayed arpeggio | gong=Tube beat=.25 escapement=Deadbeat hammer=.35 decay=18 case=Oak glow=.3 bloom=.7 interval=7 width=0.5 true=0.7 tick=0.1 | phasing | gather | Soft oak tubes, one turn round the wall in four seconds
Coil behind the altar | Night hall | gong=Coil case=Iron hammer=.6 decay=16 beat=.35 glow=.1 bloom=.6 interval=0 hush=.1 true=0.8 tick=0.15 volume=0 | monks | fifths | Iron coils braked together every three seconds
Deep well clock | Night hall | gong=Nested case=Oak hammer=.5 decay=20 escapement=Chime_hammer strikes=.6 beat=.4 glow=.1 interval=-12 unlike=0.5 true=0.8 tick=0.17 runDown=.13 volume=-3 | trail | tower | Nested coils in oak with octaves below, answered once
Salt-white tower | Night hall | gong=Straight_rod case=Marble hammer=.6 decay=16 escapement=Anchor strikes=0 glow=0 bloom=.3 interval=-12 second=.6 unlike=0.65 tick=0.11 volume=6 | valley | tower | Marble rods hard struck and left ringing
Quarter to the sea | Night hall | gong=Cup case=Glass_dome hammer=.35 decay=26 escapement=Anchor beat=.3 glow=.2 interval=-5 second=.7 unlike=0.2 tick=0.12 volume=-1.5 | mirror | calls | Domed cups and fourths below in a slow swing
Dusk with swifts | Night hall | gong=Nested case=Marble hammer=.25 decay=12 escapement=Deadbeat beat=.6 glow=.3 interval=7 second=.6 true=.8 runDown=0.35 volume=-1.5 | ascent | gather | Marble nested coils with fifths, braked in step, slower by the stroke
Dinner chime | Tube bells | case=Oak hammer=.6 strikes=0 decay=3 hush=.5 interval=0 second=.5 width=.3 unlike=0 | point | peal | Short oak tubes stilled soon after the key
Toy tower | Tube bells | case=Iron hammer=.8 strikes=.9 beat=4 decay=3 interval=12 second=.5 hush=.4 unlike=0.1 true=0.85 tick=0.14 volume=6 | nearroom 2.gain=11 | peal | Tiny bright iron tubes with a very quick second blow
Lean-to in the rain | Tube bells | true=.7 case=Glass_dome hammer=.35 strikes=.7 beat=.6 decay=9 interval=1 second=.25 bloom=.5 unlike=0.75 runDown=.18 | vibed | calls | Domed tubes, a faint answer a semitone up that grates softly
Under the cloche | Tube bells | case=Glass_dome hammer=.3 strikes=0 decay=26 interval=-12 second=.7 bloom=.7 hush=.1 glow=.3 escapement=Anchor unlike=0.1 true=0.8 tick=0.14 | thinair | calls | Soft domed tubes over low octaves, ringing on
Last tram, first bell | Tube bells | case=Iron hammer=.35 strikes=.8 beat=.7 escapement=Anchor learn=.9 decay=10 interval=-7 second=.6 bloom=.4 unlike=0.15 true=0.7 tick=0.11 runDown=.2 | rooms | handover | Iron tubes in step with fifths underneath
`,
    },
    {
      id: 'rubbed-drones',
      name: 'Rubbed drones',
      category: 'drone',
      rows: `
Slow finger, marble rim | Rubbed drone | gong=Cup case=Marble hammer=.2 glow=.7 interval=12 decay=14 swing=.3 beat=.35 bloom=.4 width=0.7 true=0.85 | bare | single | Marble cups rubbed round and round with octaves
Wet thumb, dry room | Rubbed drone | gong=Cup case=Glass_dome hammer=.6 glow=.8 interval=7 decay=20 bloom=.6 swing=.2 true=0.82 runDown=0.35 volume=3 | open | middle | Domed cups rubbed bright with fifths, fading as the springs run down
Nearly asleep upstairs | Rubbed drone | gong=Cup case=Oak hammer=.05 glow=.5 interval=-12 decay=12 bloom=.3 swing=.9 beat=.3 true=0.78 volume=5.5 | asleep | drone | Cups in oak barely rubbed, low octaves swelling
Moon over the quarry | Rubbed drone | gong=Cup case=Iron hammer=.35 glow=1 interval=0 decay=18 bloom=.6 unlike=.9 swing=.45 beat=.4 width=0.6 true=0.85 | water | fifths | Iron cups rubbed hard, upper tones flaring
Circle on the lake | Rubbed drone | gong=Cup case=Oak hammer=.4 glow=.6 interval=5 second=.6 swing=1 beat=.5 wall=Splayed learn=.7 runDown=0.35 volume=6 | flock | drone | Cups and fourths whose swells pass round the wall, fading as the springs run down
Long iron wire | Rubbed drone | gong=Coil case=Iron hammer=.3 glow=.8 interval=-12 bloom=.5 swing=.4 true=0.88 runDown=0.3 volume=-10.5 | heavy | pedal | Iron coils rubbed over a low octave, fading as the springs run down
Coil in the hearth | Rubbed drone | gong=Coil case=Oak hammer=.15 glow=1 interval=0 decay=4 bloom=.2 swing=.5 second=.5 | fuzzed | drone | Coils rubbed in warm oak, close unisons
Wasps behind the plaster | Rubbed drone | gong=Coil case=Marble hammer=.8 glow=.9 interval=7 bloom=1 swing=.6 decay=8 width=0.7 volume=2 | nextdoor | middle | Coils rubbed with brass, fifths flaring one by one
Grey before rain | Rubbed drone | gong=Coil case=Glass_dome hammer=.5 glow=.6 interval=12 swing=.5 beat=.3 decay=10 bloom=.5 width=0.8 volume=1 | rain | drone | Domed coils and octaves on a slow swell
Inner spring | Rubbed drone | gong=Coil case=Oak hammer=.4 glow=.7 interval=-5 true=.6 bloom=.6 swing=.3 unlike=.2 width=0.8 runDown=0.5 volume=0.5 | chorale | drone | Coils a little out of true with a fourth beneath, fading as the springs run down
Draught through the rods | Rubbed drone | gong=Straight_rod case=Marble hammer=.5 glow=.8 interval=12 decay=9 swing=.7 bloom=.4 true=0.82 | weathered | drone | Marble rods rubbed high and low, rising and falling
Underfloor pipe | Rubbed drone | gong=Straight_rod case=Iron hammer=.1 glow=.6 interval=-12 decay=14 swing=.3 second=1 bloom=.4 beat=.4 | lowcath | drone | Iron rods rubbed dull with strong low octaves
Three bows, one string | Rubbed drone | gong=Straight_rod case=Oak hammer=.3 glow=.9 interval=7 decay=6 bloom=.5 swing=.5 wall=Chain learn=.8 true=0.82 volume=6 | bowing | handover | Oak rods and fifths, the pressure moving upward
Sun on the weathervane | Rubbed drone | gong=Straight_rod case=Glass_dome hammer=.8 glow=.7 interval=19 decay=12 bloom=.7 second=.5 true=0.82 volume=0 | glinting | middle | Domed rods rubbed bright, twelfths above
Lintel | Rubbed drone | gong=Straight_rod case=Oak hammer=.2 glow=.4 interval=0 swing=.2 beat=.4 decay=10 unlike=1 second=.7 | doubled | wide | Plain oak rods, two almost alike, hardly moving
Upper corridor light | Rubbed drone | gong=Tube case=Marble hammer=.4 glow=.7 interval=12 bloom=.5 decay=12 beat=.4 swing=.45 width=0.8 true=0.85 volume=1 | chapel | wide | Marble tubes and octaves rubbed for as long as held
Unlit flue | Rubbed drone | gong=Tube case=Iron hammer=.2 glow=.8 interval=-12 bloom=.4 swing=.9 beat=.25 true=0.85 volume=-1 | stairs | drone | Iron tubes and low octaves swelling every four seconds
Reeds in a glass | Rubbed drone | gong=Tube case=Glass_dome hammer=.7 glow=.5 interval=7 swing=.5 decay=10 hush=.4 width=0.7 volume=0 | loft | middle | Glass tubes rubbed with fifths, clear and thin
Milk before the light | Rubbed drone | gong=Tube case=Oak hammer=.08 glow=.9 interval=0 bloom=.2 decay=8 swing=.4 width=0.6 | mist | handover | Oak tubes rubbed with felt, smooth unisons
Half an octave of sky | Rubbed drone | gong=Tube case=Marble hammer=.5 glow=.6 interval=5 wall=Opposed learn=.9 swing=1 beat=.4 true=0.82 volume=6 | chorecho | fifths | Tubes and fourths that swell on opposite sides
Great wheel, full train | Rubbed drone | gong=Nested case=Marble beat=.5 hammer=.35 glow=.8 interval=0 swing=1 learn=.9 unlike=.1 wall=In_step true=0.88 volume=3 | taped | fifths | Nested coils pulse together once every two seconds
Archive, lower level | Rubbed drone | gong=Nested case=Iron hammer=.12 glow=.7 interval=-12 bloom=.4 decay=20 swing=.4 beat=.35 width=0.8 true=0.85 volume=1.5 | cave | drone | Dark nested iron, the upper tones late
Noon in the conservatory | Rubbed drone | gong=Nested case=Glass_dome hammer=.7 glow=.8 interval=12 bloom=.6 swing=.4 true=0.82 | seaside | wide | Nested glass rubbed bright with octaves
Cloud counter | Rubbed drone | gong=Nested case=Oak hammer=.2 glow=.6 interval=7 bloom=1 swing=.6 beat=.2 wall=Splayed learn=1 width=0.7 true=0.88 volume=3 | grains | gather | Nested oak that flares part by part round the wall
Rust and patience | Rubbed drone | gong=Nested case=Iron true=.3 hammer=.4 glow=.7 interval=-7 second=.6 bloom=.5 decay=16 swing=.45 beat=.5 width=0.8 | rooms | drone | Raw iron rubbed with a fifth beneath
Hands that never strike | Breathing voices | gong=Nested beat=.4 hammer=.3 glow=.7 swing=.6 case=Marble interval=-12 decay=8 unlike=0.5 true=0.85 volume=6 | backward | sigh | Nested marble rubbed, two sides rising by turns
Wide and unhurried | Breathing voices | gong=Tube beat=.15 hammer=.2 glow=.6 decay=14 case=Oak interval=12 width=1 unlike=0.1 true=0.85 volume=0.5 | space | drone | Oak tubes and octaves on a seven-second swell
Sand in the case | Breathing voices | gong=Straight_rod beat=.8 hammer=.5 glow=.9 swing=.4 case=Marble interval=7 bloom=.8 unlike=0.1 true=0.82 volume=2 | sunk | handover | Marble rods and fifths rubbed, an edge of air on them
Tidal lock | Breathing voices | gong=Cup beat=.25 hammer=.15 glow=.5 case=Iron interval=-5 decay=18 second=.8 volume=6 | tiderev | drone | Iron cups and fourths below swell from side to side
Fan in the far window | Breathing voices | beat=1.6 gong=Coil swing=.9 interval=0 decay=4 case=Iron hammer=.3 glow=1 unlike=0.1 true=0.78 volume=6 | eight | handover | Iron coils rubbed in quick alternating pulses
Last bus, engine on | Coil bass | escapement=Rub_only beat=.6 strikes=0 gong=Coil glow=.8 hammer=.15 swing=.6 decay=6 case=Iron unlike=0.15 | desk | deep | Iron coils rubbed low, an octave lower under them
Cellar hum | Coil bass | escapement=Rub_only beat=.2 strikes=0 gong=Nested glow=.6 hammer=.1 swing=.4 decay=10 bloom=.4 unlike=0.45 true=0.78 volume=-0.5 | cellar | pedal | Nested coils rubbed in oak, low octaves, narrow
Basement waterwheel | Coil bass | escapement=Rub_only beat=1.1 strikes=.5 gong=Straight_rod glow=.7 hammer=.25 swing=1 decay=5 case=Marble width=.5 unlike=0.45 volume=6 | bucket | pedal | Marble rods rubbed and turned over each second
Barge at its rope | Coil bass | escapement=Rub_only beat=.3 strikes=.2 gong=Tube glow=.9 hammer=.2 decay=12 case=Iron interval=-12 second=1 unlike=0.15 | darkhall | deep | Low iron tubes rubbed with their octave below
Cathedral heating | Coil bass | escapement=Rub_only beat=.25 strikes=0 gong=Cup glow=.7 hammer=.3 decay=20 interval=7 case=Oak hush=.2 swing=.75 unlike=0.45 true=0.85 | nave | drone | Oak cups and fifths rubbed on one long slow swell
Sunrise through amber | Glass morning | gong=Cup hammer=.4 glow=.5 wall=Chain beat=.6 interval=-12 second=.8 decay=14 unlike=0.4 true=0.82 volume=2.5 | ascent | gather | Glass cups and low octaves rubbed, brightness rising
Glass harp, slow rain | Glass morning | gong=Cup hammer=.5 glow=.8 swing=.3 interval=0 decay=20 case=Glass_dome unlike=0.4 width=0.6 volume=-2 | rain | handover | Domed cups rubbed with a second almost alike
Gauze at the skylight | Glass morning | gong=Straight_rod hammer=.8 glow=1 bloom=.9 swing=.4 interval=-12 decay=6 unlike=0.4 width=0.8 true=0.82 | blurred | middle | Domed rods over octaves rubbed with brass, airy
Prismatic hour | Glass morning | gong=Nested hammer=.6 glow=.7 bloom=1 swing=.7 beat=.3 interval=7 unlike=0.45 width=0.7 true=0.82 runDown=0.4 volume=2.5 | prismed | fifths | Nested glass and fifths flaring tone by tone, fading as the springs run down
Thin as a page | Glass morning | gong=Coil hammer=.4 glow=.4 swing=.2 decay=6 interval=-12 second=.4 width=0.6 true=0.85 volume=3 | revealed | middle | Domed coils rubbed lightly, an octave beneath
Slack mainspring | Rubbed drone | gong=Coil case=Oak hammer=.3 interval=-12 decay=8 swing=.6 beat=.6 runDown=.5 glow=1 true=0.85 volume=6 | worn | drone | Rubbed coils that slow and fade as the spring goes
Dusk on the weights | Rubbed drone | gong=Tube case=Oak hammer=.25 glow=.7 runDown=.7 interval=7 decay=12 bloom=.5 volume=6 | descent | wide | Tubes and fifths rubbed softer until they stop
Wind dies at the door | Rubbed drone | gong=Straight_rod case=Glass_dome hammer=.5 interval=12 decay=10 beat=.8 runDown=.6 glow=1 swing=.6 width=0.8 true=0.88 volume=6 | melting | fifths | Domed rods, a rub that slows and is spent
Last of the lamp oil | Rubbed drone | gong=Cup case=Marble hammer=.3 interval=0 decay=16 bloom=.6 runDown=.6 glow=.9 true=0.88 volume=6 | singing | middle | Marble cups whose rub runs down under the hand
Heat leaving stone | Rubbed drone | gong=Nested case=Marble interval=-12 decay=20 bloom=.3 runDown=.65 glow=1 hammer=.35 beat=.5 swing=.4 true=0.88 volume=6 | longdark | gather | Nested marble rubbed, then left to ring out
Struck into singing | Long wall | beat=.15 strikes=.2 gong=Tube glow=1 hammer=.3 bloom=.6 case=Marble interval=12 second=.6 unlike=0.5 true=0.85 volume=-3 | shadowed | single | Marble tubes touched now and then, rubbed on and on
Low choir of springs | Long wall | beat=.2 strikes=.1 gong=Coil glow=1 hammer=.15 bloom=.3 case=Oak interval=-12 second=.9 decay=5 unlike=0.15 width=0.8 volume=-2 | monks | gather | Oak coils and low octaves glowing, scarcely struck
Iron afternoon | Long wall | beat=.3 strikes=.3 gong=Nested case=Iron glow=.9 hammer=.4 true=.7 bloom=.9 interval=-5 second=.6 width=0.8 volume=-6 | embers | fifths | Iron nested coils, bent a little, rubbed over slow strikes
Everything is turning | Long wall | escapement=Rub_only beat=2 strikes=.4 gong=Straight_rod glow=.8 learn=0 unlike=1 swing=1 hammer=.3 case=Marble interval=7 second=.7 volume=6 | turning | fifths | Rods and fifths that pulse each at its own quick rate
Snow light | Long wall | escapement=Rub_only gong=Cup case=Glass_dome glow=.6 hammer=.3 swing=.4 learn=1 unlike=0 beat=.3 interval=12 second=.5 decay=20 width=0.7 volume=-1 | glimmering | quiet | Domed cups rubbed exactly in step with octaves
`,
    },
    {
      id: 'cups-under-glass',
      name: 'Cups under glass',
      category: 'plucked',
      rows: `
Thimble on the pane | Cup plucks | hammer=.4 strikes=0 decay=4 hush=.5 second=.5 escapement=Deadbeat interval=-12 unlike=0.65 true=0.78 tick=0.15 volume=5 | bare | tossed | Small domed cups and low octaves, tapped once and stilled
Sugar spoon, quick | Cup plucks | hammer=.75 strikes=.6 beat=4 interval=-5 second=.6 case=Marble decay=8 hush=.3 unlike=0.1 true=0.85 tick=0.12 runDown=.16 volume=6 | nearplate 2.gain=18 | thrown | Hard marble cups with a quick double a fourth down
Dew in a spoon | Cup plucks | hammer=.45 strikes=0 decay=26 hush=.15 bloom=.4 interval=0 second=.7 escapement=Anchor unlike=0.1 case=Marble volume=0.5 | thinair | chimes | Cups in marble, two beating slowly together
Cork and glass | Cup plucks | hammer=.1 strikes=0 decay=5 case=Oak hush=.6 interval=-12 second=.6 escapement=Deadbeat unlike=0.5 true=0.76 tick=0.13 volume=3.5 | wood | close | Cups in oak under felt, short with a low octave
Little iron cups | Cup plucks | case=Iron hammer=.5 strikes=.7 beat=3.4 decay=6 interval=7 second=.4 hush=.4 unlike=0.65 true=0.8 tick=0.12 runDown=.15 volume=6 | springy | thrown | Iron cups that clang with fifths, answered at once
Cordial on the lawn | Cup plucks | hammer=.4 strikes=.7 beat=1 decay=12 interval=12 second=.5 case=Oak unlike=0.65 tick=0.15 runDown=.2 volume=3 | seaside | tune | Oak cups, every key answered an octave up | keys
Cup passed at table | Passed along | gong=Cup escapement=Anchor beat=2 case=Marble hammer=.4 decay=7 interval=0 strikes=.8 true=0.88 runDown=.16 volume=2.5 | chamber | ladder | Marble cups struck to and fro, low to high
Dolls at breakfast | Passed along | gong=Cup escapement=Verge beat=1.2 case=Oak hammer=.5 decay=6 interval=12 tick=.2 width=.5 runDown=.38 volume=2 | smaller | close | Cups in oak knocked lightly, a tick between
Icicles on the dome | Passed along | gong=Cup escapement=Deadbeat beat=1.5 case=Glass_dome hammer=.6 decay=10 interval=-12 second=.3 bloom=.2 true=0.78 runDown=.13 volume=6 | nearecho 2.gain=6 | six | Domed cups in a climbing wave over low octaves
Saucer stack | Passed along | gong=Cup escapement=Chime_hammer strikes=.5 beat=3 case=Iron hammer=.35 decay=4 interval=-5 second=.6 true=0.85 volume=5 | slap | thrown | Iron cups and fourths below, shadowed by a second blow
Rim and base | Felt roll | escapement=Anchor gong=Cup strikes=0 hammer=.15 decay=14 case=Glass_dome interval=-12 second=.8 glow=0 width=0.5 true=0.82 tick=0.17 volume=1 | vibed | peal | Domed cups under felt with strong low octaves
Trill on best glasses | Felt roll | gong=Cup beat=5 hammer=.3 strikes=.6 case=Glass_dome decay=8 glow=0 interval=0 true=0.85 tick=0.11 volume=-1 | swayed | pair | Domed cups trilled by felt, two a breath apart on each key
Hummingbird case | Felt roll | gong=Cup beat=4.4 hammer=.6 case=Marble interval=12 glow=.1 tick=0.14 learn=0 decay=5 strikes=.8 width=0.7 true=0.78 runDown=.29 volume=6 | shiver | trio | Quick marble cups in an unmatched flutter
Cups for a lullaby | Felt roll | gong=Cup beat=1.5 hammer=.08 strikes=.5 case=Oak decay=12 interval=7 second=.5 glow=.3 learn=.8 width=0.85 true=0.88 tick=0.14 runDown=.32 volume=2.5 | asleep | handover | Felt on oak cups and fifths rocking together
Hail on the cold frame | Felt roll | gong=Cup escapement=Verge beat=3.2 hammer=.65 strikes=.7 case=Glass_dome decay=5 interval=-12 glow=0 learn=0 volume=6 | nearhall 2.gain=10 | six | Uneven taps on domed cups, octaves under them | texture
Three rods in a jar | Cup plucks | gong=Straight_rod hammer=.5 strikes=0 decay=8 interval=-12 second=.7 hush=.3 escapement=Deadbeat unlike=0 tick=0.1 volume=2 | doubled | tossed | Clear rods in a dome, a low octave with each
Quill | Cup plucks | gong=Straight_rod case=Oak hammer=.5 strikes=0 decay=1.5 hush=.8 bloom=0 unlike=0.85 | desk | close | Short oak rods with nothing after them
Rain in the light well | Cup plucks | gong=Straight_rod hammer=.6 strikes=.8 beat=3.4 decay=5 interval=-12 second=.6 unlike=0.1 true=0.85 tick=0.15 runDown=.19 volume=6 | chorecho | tossed | Domed rods, an octave lower falling in behind
Stitching by the window | Cup plucks | gong=Straight_rod case=Marble hammer=.4 strikes=.5 beat=1.6 decay=3 interval=5 second=.5 hush=.5 unlike=0.85 tick=0.14 runDown=.18 volume=6 | gated 1.cutoffHz=900 | figure | Marble rods and fourths, each stitch pulled twice
Salt pot, iron lid | Cup plucks | gong=Straight_rod case=Iron hammer=.3 strikes=0 decay=6 interval=-12 second=.6 hush=.5 escapement=Deadbeat true=0.8 tick=0.11 | heavy | walk | Iron rods with octaves beneath, round and short
Glass nesting eggs | Cup plucks | gong=Nested hammer=.3 strikes=.3 decay=7 bloom=.4 interval=-12 second=.6 beat=1.2 unlike=0.75 true=0.78 tick=0.1 runDown=.2 volume=2.5 | common | calls | Nested coils in a dome, a late wash and a low answer
Clasp | Cup plucks | gong=Nested case=Marble hammer=.6 strikes=.4 beat=3 decay=1.6 interval=-5 second=.4 hush=.7 unlike=0.75 true=0.85 tick=0.12 runDown=.16 volume=6 | nearbit 2.gain=9 | close | Short marble clusters with a quick fourth behind
Beads in the doorway | Cup plucks | gong=Nested case=Glass_dome hammer=.35 strikes=.9 beat=5 decay=5 interval=-12 second=.7 bloom=.1 unlike=0.45 true=0.78 tick=0.15 runDown=.12 volume=1.5 | octrain | tossed | Nested glass and low octaves in a fast double
Jam jar of keys | Cup plucks | gong=Nested case=Iron hammer=.45 strikes=0 decay=3 true=.7 interval=0 second=.6 hush=.5 unlike=0.55 tick=0.17 volume=6 | nearplate | thrown | Iron coils a little out of true, shaken once
Pinned butterfly | Cup plucks | gong=Nested hammer=.25 strikes=.5 beat=.7 decay=9 interval=-12 second=.8 bloom=.8 hush=.2 unlike=0.5 true=0.85 tick=0.13 | mirror | calls | Soft nested glass, answered once and fading backward
Spring in a tumbler | Cup plucks | gong=Coil hammer=.6 strikes=0 decay=5 interval=0 second=.4 hush=.4 unlike=0.85 volume=6 | even | close | Coils plucked under glass, lean and clear
Thumb on the coil | Cup plucks | gong=Coil case=Oak hammer=.25 strikes=0 decay=1.2 hush=.9 interval=0 second=.2 unlike=0.65 true=0.88 volume=3 | felted | figure | Damped oak coils, hardly any ring
Peel of a lemon | Cup plucks | gong=Coil case=Marble hammer=.95 strikes=.6 beat=3.2 decay=4 interval=12 second=.5 bloom=.3 unlike=0 true=0.76 tick=0.11 runDown=.11 volume=6 | nearecho | thrown | Coils struck by brass in marble, octave behind
Copper wire garden | Cup plucks | gong=Coil case=Iron hammer=.4 strikes=0 decay=8 interval=7 second=.5 bloom=.5 hush=.3 escapement=Anchor unlike=0.55 true=0.85 tick=0.15 volume=-5 | phasing | answer | Iron coils and fifths left to circle
Half a glass of water | Cup plucks | gong=Coil hammer=.35 strikes=.7 beat=.9 decay=7 interval=-5 second=.8 bloom=.2 unlike=0.2 true=0.78 tick=0.17 runDown=.13 volume=6 | sunk | calls | Domed coils that answer a fourth below
Teaspoon chandelier | Glass morning | escapement=Deadbeat gong=Tube strikes=0 glow=0 hammer=.6 decay=6 interval=-12 hush=.3 unlike=0.2 width=0.85 tick=0.15 volume=0.5 | tiles | chimes | Glass tubes struck cleanly over low octaves
Heel on the glass floor | Glass morning | escapement=Chime_hammer gong=Cup strikes=.4 beat=3 glow=0 hammer=.5 decay=4 interval=-5 hush=.6 unlike=0.5 width=0.85 true=0.82 tick=0.11 runDown=.17 volume=6 | shut | tossed | Short domed cups, each heel and toe
Barometer falling | Glass morning | escapement=Chime_hammer gong=Straight_rod strikes=.6 beat=1.2 glow=.2 hammer=.3 decay=10 interval=-12 hush=.3 unlike=0.65 width=0.6 true=0.88 runDown=.14 volume=6 | leaves | lone | Domed rods answered an octave below
Tray of lenses | Glass morning | escapement=Anchor gong=Nested strikes=0 glow=.1 hammer=.5 decay=3 bloom=.2 interval=-12 second=.6 unlike=0.1 width=0.7 tick=0.15 volume=6 | prismed | tossed | Nested glass, hard and clear, an octave under each
Fountain under ice | Glass morning | escapement=Verge gong=Cup beat=1.8 strikes=.5 glow=.1 hammer=.45 decay=20 interval=-12 wall=Splayed unlike=0.2 width=0.7 true=0.85 volume=0.5 | stone | six | Glass cups dripping evenly round the wall
Marble stair, bare feet | Two parties | wall=In_step escapement=Chime_hammer gong=Cup strikes=0 hammer=.25 case=Marble decay=9 hush=.2 unlike=0.15 width=0.8 true=0.82 volume=4 | booth | figure | Marble cups lightly felted, single and round
Sums in the schoolroom | Two parties | wall=Splayed escapement=Deadbeat gong=Cup beat=2.8 hammer=.6 decay=3 learn=1 tick=.3 unlike=0.05 width=0.8 volume=3.5 | sampled | ladder | Marble cups counted out in even shares, with ticks
Wishing coin | Two parties | wall=Chain escapement=Chime_hammer gong=Cup strikes=.7 beat=.8 hammer=.45 decay=12 interval=12 second=.6 unlike=0.5 width=0.5 runDown=.13 volume=6 | bounces | peal | Cups in marble whose octave answers late
Bracelet on the basin | Two parties | wall=In_step escapement=Anchor gong=Cup beat=2 strikes=.5 hammer=.75 decay=2 learn=.2 unlike=.9 case=Iron width=0.7 true=0.85 runDown=.33 volume=3.5 | amp | trio | Iron cups jingling, no two together
Windowsill menagerie | Two parties | wall=Splayed escapement=Verge gong=Cup beat=.8 strikes=.6 hammer=.4 decay=8 case=Glass_dome tick=.1 interval=-7 second=.7 unlike=0.2 width=0.85 true=0.88 runDown=0.4 volume=6 | nearplate | six | Domed cups padded at lightly, in turns, winding down
Bent teaspoons | Raw iron | escapement=Chime_hammer gong=Cup true=.3 case=Oak hammer=.5 decay=5 interval=0 hush=.4 bloom=.2 tick=0.14 runDown=.12 volume=2 | cassette 1.output=6 | thrown | Oak cups bent away from true
Copper kettle lids | Raw iron | escapement=Chime_hammer gong=Cup true=.5 case=Iron hammer=.6 decay=7 interval=-12 strikes=.4 beat=1.4 bloom=.4 tick=0.14 runDown=.16 volume=5.5 | rooms | answer | Iron cups with loose low octaves, answered
Broken set | Raw iron | escapement=Verge gong=Cup true=.15 case=Marble hammer=.7 decay=8 interval=5 second=.4 hush=.6 strikes=0 tick=0.1 volume=5 | lasting | close | Raw marble cups with a fourth, soon stilled
Antique fair at opening | Raw iron | escapement=Anchor gong=Cup true=.8 case=Glass_dome hammer=.5 beat=1.2 strikes=.6 decay=10 interval=12 bloom=.5 tick=0.13 runDown=.11 volume=4 | dusty | gather | Domed cups not quite true, struck to and fro
Enamel mugs | Raw iron | escapement=Deadbeat gong=Cup true=.6 case=Oak hammer=.35 beat=1.5 strikes=.8 decay=4 interval=7 second=.5 learn=.9 tick=0.17 runDown=.25 | carpet | trio | Dull oak cups braked in step with fifths
Cup held to the ear | Cup plucks | case=Iron hammer=.2 strikes=0 glow=.6 decay=9 second=.7 interval=12 hush=.4 escapement=Anchor unlike=0.75 true=0.88 volume=-1.5 | shadowed | calls | Felted iron cups and octaves that hum on while held | keys
Warm finger, cold cup | Cup plucks | case=Glass_dome hammer=.5 strikes=0 glow=.9 decay=12 interval=-12 second=.7 swing=.6 beat=.5 escapement=Anchor unlike=0.5 true=0.78 tick=0.11 volume=2 | glinting | calls | Domed cups struck, then rubbed on a slow swing, octaves below
Silver thaw | Cup plucks | case=Glass_dome hammer=.7 strikes=.3 beat=1 decay=20 interval=-12 second=.8 bloom=.9 hush=.1 unlike=0.2 true=0.85 tick=0.13 runDown=.15 volume=6 | frost | calls | Brass on glass cups, tops late, a low octave answering | bell
Baptism spoon | Cup plucks | case=Marble hammer=.4 strikes=0 decay=16 interval=-12 second=.7 bloom=.5 hush=.2 escapement=Anchor unlike=0.1 true=0.85 tick=0.15 volume=0.5 | chapel | peal | Marble cups and low octaves let ring | bell
Orchard glasses | Cup plucks | case=Glass_dome hammer=.35 strikes=.8 beat=1.3 decay=10 interval=7 second=.8 hush=.2 unlike=0.2 true=0.85 tick=0.12 runDown=.18 volume=6 | round | answer | Domed cups answered by their fifths
`,
    },
    {
      id: 'low-cases',
      name: 'Low cases',
      category: 'bass',
      rows: `
Pendulum in the hall | Coil bass | beat=.5 strikes=.6 case=Iron interval=7 second=.5 hammer=.15 unlike=0.1 true=0.82 volume=0.5 | bare | low | Soft blows on a low iron coil and its fifth, swinging slowly
Velvet weight | Coil bass | strikes=0 hammer=.05 glow=.4 decay=4 second=.3 hush=.6 interval=12 unlike=0.65 true=0.85 volume=-1 | shade | deep | One felted coil, warm, softly rubbed while held
Boots below stairs | Coil bass | escapement=Deadbeat beat=1.4 strikes=.7 hammer=.3 decay=1.2 hush=.6 case=Marble true=0.82 volume=6 | near 1.gain=8 | low | Short marble coils, braked once a second
Oak beam | Coil bass | gong=Nested hammer=.4 decay=5 bloom=.3 interval=12 strikes=0 width=.3 unlike=0.2 volume=-9 | wood | low | Nested coils in oak, plain and close
Barrel on the stones | Coil bass | gong=Nested case=Marble hammer=.25 strikes=.5 beat=2 decay=3 interval=12 second=.6 unlike=0.1 bloom=.4 runDown=.16 volume=0.5 | desk | walk | Nested coils that roll to and fro with an upper octave
Case of the great clock | Coil bass | gong=Straight_rod decay=6 hammer=.2 strikes=.4 beat=.4 interval=7 hush=.4 unlike=0.2 true=0.82 volume=-1 | hall 1.mix=.18 | deep | Low oak rods and their fifth, a slow swing
Lead on a cord | Coil bass | gong=Straight_rod case=Marble decay=2 hammer=.5 strikes=0 interval=0 second=.2 bloom=0 hush=.7 unlike=0.75 volume=6 | point | walk | Plain marble rods, short and dead centre
Iron rail, night freight | Coil bass | gong=Straight_rod case=Iron decay=4 hammer=.4 strikes=.6 beat=1.4 interval=7 second=.4 width=.4 true=0.85 runDown=.2 volume=-1 | amp | low | Iron rods and fifths swung one, then the other
Muffled piston | Coil bass | gong=Straight_rod decay=1.5 hammer=.05 escapement=Deadbeat beat=2 strikes=1 interval=0 second=.9 unlike=0.2 true=0.85 volume=3.5 | gated | walk | Felt on rods, two dull braked strokes a second
Rod in the lift shaft | Coil bass | gong=Straight_rod case=Glass_dome decay=9 hammer=.6 strikes=0 interval=-12 second=.8 hush=.2 width=.5 unlike=0 true=0.85 volume=-0.5 | cavern | low | Domed low rods with an octave under, ringing on
Cup under floorboards | Coil bass | gong=Cup case=Iron decay=6 hammer=.25 strikes=0 interval=-12 second=.7 unlike=0.45 true=0.85 volume=1 | taped | low | Low cups in iron, warbling over an octave below
Font | Coil bass | gong=Cup decay=12 hammer=.3 strikes=.4 beat=.35 hush=.25 interval=0 case=Oak unlike=0.1 volume=6 | chapel | deep | Low oak cups swung very slowly
Iron pot | Coil bass | gong=Cup case=Iron decay=3 hammer=.4 strikes=0 interval=5 second=.3 hush=.6 width=.3 unlike=0.1 true=0.82 volume=6 | tin | stump | Low iron cups with a fourth, soon stopped
Millpond | Coil bass | gong=Cup escapement=Rub_only glow=.6 swing=.7 beat=.3 decay=10 hammer=.1 interval=-12 hush=.3 unlike=0.1 true=0.88 volume=-0.5 | bank | pedal | Low cups rubbed, rising and sinking
Dredger's bell | Coil bass | gong=Cup escapement=Deadbeat beat=.5 strikes=.8 case=Iron true=.6 decay=8 hammer=.5 interval=-5 second=.5 unlike=0.45 volume=6 | shore | low | Iron cups half true, braked every two seconds
Drainpipe, long rain | Coil bass | gong=Tube case=Iron decay=4 hammer=.2 strikes=.4 beat=1.6 interval=-12 width=.4 unlike=0.4 true=0.85 runDown=.22 volume=-0.5 | bucket | walk | Low iron tubes rocking over their octave
Organ pipe laid flat | Coil bass | gong=Tube escapement=Rub_only glow=.5 decay=3 hammer=.2 swing=.2 interval=0 second=.6 hush=.6 unlike=0.2 | pipes | pedal | Low oak tubes rubbed evenly, two alike
Water main | Coil bass | gong=Tube case=Oak decay=8 hammer=.08 strikes=0 interval=-12 second=1 bloom=.5 unlike=0.45 | water | low | Felted tubes with a full octave underneath
Pulley and shaft | Coil bass | gong=Tube case=Marble decay=2 hammer=.6 escapement=Chime_hammer strikes=.6 beat=2.4 interval=12 second=.3 unlike=0.55 true=0.82 runDown=.17 volume=6 | near | stump | Marble tubes, one blow with a quick octave answer
Trench | Coil bass | gong=Tube case=Iron decay=14 hammer=.3 escapement=Deadbeat beat=.25 strikes=.9 interval=-7 second=.6 hush=.15 bloom=.7 | darkhall | deep | Iron tubes and fifths below, one stroke in four seconds
Deeper in the trunk | Coil bass | gong=Nested case=Iron decay=6 hammer=.1 glow=.4 bloom=.6 interval=-12 strikes=.3 unlike=0.5 true=0.82 runDown=.22 volume=-0.5 | cave | low | Iron coils within coils, felted, washing in late
Sofa springs | Coil bass | gong=Nested decay=1.4 hammer=.5 strikes=0 true=.5 interval=12 second=.6 hush=.8 unlike=0.55 volume=-0.5 | boxed | low | Loose nested coils in oak, short
Vault key | Coil bass | gong=Nested case=Marble decay=5 hammer=.45 escapement=Anchor beat=.7 strikes=.5 interval=-5 second=.6 bloom=.4 true=0.88 runDown=.2 volume=4.5 | rooms | low | Marble coils and fourths below, swung to and fro
Thunder kept in a trunk | Coil bass | gong=Nested case=Iron escapement=Rub_only glow=.8 swing=.9 beat=.2 hammer=.2 decay=12 bloom=.9 hush=.2 unlike=0.45 true=0.88 volume=6 | lowcath | deep | Nested iron rubbed low, swelling every five seconds
Stove door | Coil bass | gong=Nested case=Iron escapement=Chime_hammer strikes=.5 beat=3 decay=2.5 hammer=.6 interval=0 bloom=.2 hush=.6 unlike=0 runDown=.16 volume=5.5 | fuzzed | stump | Iron coils clanged and doubled at once
Rolled under the bed | Felt roll | gong=Coil beat=4 strikes=.6 decay=2 glow=.2 interval=0 second=.7 width=.4 hush=.5 true=0.82 runDown=.15 | bodyup | low | Coils rolled quickly by felt, deep and close
Cart across planks | Felt roll | gong=Straight_rod beat=3 hammer=.2 decay=2.6 case=Iron interval=7 glow=.1 hush=.5 width=.5 true=0.82 unlike=.35 swing=.6 | heavy | walk | Iron rods rumbling three times a second
Boat engine at the quay | Felt roll | gong=Straight_rod beat=2.4 learn=1 unlike=0 hammer=.3 decay=3 interval=-5 glow=.3 width=.3 true=0.85 bloom=.2 volume=-2.5 | nextdoor | pedal | Oak rods and fourths below beating in step like a slow motor
Sleeping bear | Felt roll | gong=Tube beat=1 hammer=.04 strikes=.4 glow=.8 decay=5 swing=.9 interval=-12 width=.5 true=0.88 runDown=.23 volume=-0.5 | asleep | deep | Oak tubes rubbed and rocked by felt, octaves low
Far drums of the tide | Felt roll | gong=Cup beat=5 hammer=.1 strikes=.8 runDown=.7 decay=6 case=Iron interval=-12 hush=.2 width=0.2 true=0.82 volume=0.5 | fogged | deep | Iron cups rolled by felt until the spring gives out
Root of the tower | Night hall | beat=.3 strikes=.6 decay=12 case=Oak interval=-12 width=.4 glow=.2 true=0.85 runDown=.14 volume=-3 | nave | deep | Oak tubes over their octave, braked blows far apart
Belfry floor | Night hall | gong=Straight_rod case=Iron beat=.5 strikes=.8 decay=8 hammer=.4 interval=-12 glow=.1 width=.3 bloom=.5 unlike=0.5 true=0.85 runDown=.17 volume=2 | stairs | low | Iron rods and low octaves, one braked blow
Tunnel mouth | Night hall | gong=Nested case=Marble beat=.4 strikes=.5 decay=10 hammer=.2 glow=.5 interval=0 width=.5 unlike=0.45 runDown=.18 volume=6 | shadowed | pedal | Nested marble with a low glow between blows
Deep cistern | Night hall | gong=Cup case=Oak escapement=Chime_hammer strikes=.7 beat=.6 decay=16 hammer=.2 glow=.1 interval=-12 unlike=0.2 true=0.88 runDown=.14 volume=-3 | trail | deep | Low oak cups answered an octave under
Sea wall | Night hall | gong=Coil case=Iron escapement=Anchor beat=.35 strikes=.7 decay=9 hammer=.3 glow=.3 interval=-7 swing=.8 unlike=0.45 runDown=.23 volume=-3 | tiderev | low | Iron coils that swing over fifths below
Thumb in a felt glove | Parlour keys | gong=Coil hammer=.15 decay=1.6 hush=.8 interval=0 second=.4 width=.1 escapement=Deadbeat unlike=0.45 volume=4.5 | bare | walk | Short coils under felt, two alike on each key
Double door | Parlour keys | gong=Nested hammer=.4 decay=3 hush=.6 interval=12 second=.7 width=.3 case=Marble escapement=Anchor unlike=0.1 true=0.85 volume=5.5 | doubled | stump | Nested marble coils with octaves above
Cellist's chair | Parlour keys | escapement=Rub_only gong=Coil glow=.4 hammer=.3 decay=2 hush=.7 interval=0 second=.5 swing=.2 beat=.5 unlike=0.2 volume=2.5 | bowing | low | Low coils rubbed plainly, a little rough | string
Marble plinth | Parlour keys | gong=Straight_rod case=Marble hammer=.6 decay=3.5 interval=-12 second=.6 hush=.7 width=.2 escapement=Deadbeat unlike=0.45 volume=6 | even | walk | Marble rods and octaves below, clean and short
Radiator at six | Parlour keys | gong=Tube case=Iron hammer=.35 strikes=.5 beat=2.2 decay=3 interval=0 hush=.6 true=.8 width=.3 unlike=0.85 volume=5 | bedside | stump | Iron tubes knocking once more after each key
Old mainspring | Wound once | gong=Coil beat=2 runDown=.6 decay=3 interval=-12 second=.6 hammer=.2 tick=.1 width=.4 volume=6 | worn | deep | Low coils over octaves that slow as they unwind
Mill gears | Wound once | escapement=Deadbeat beat=1.5 runDown=0 gong=Nested case=Iron hammer=.4 decay=2 tick=.4 interval=0 width=.4 volume=-0.5 | drift | pedal | Nested iron braked and ticking, steady
Heavy latch | Wound once | escapement=Chime_hammer strikes=.8 beat=4 runDown=.13 gong=Tube case=Marble hammer=.5 decay=1.5 tick=.2 interval=-12 second=.5 true=0.85 volume=6 | shut | stump | Marble tubes with low octaves in a quick double knock
Counting sacks | Wound once | escapement=Anchor beat=1.2 runDown=.6 gong=Cup case=Oak hammer=.1 decay=4 tick=.15 interval=-12 second=.8 true=0.85 volume=2.5 | wooden | pedal | Oak cups under felt, to and fro, slowly tiring
Corn down the chute | Wound once | escapement=Verge beat=1.8 runDown=.3 gong=Straight_rod case=Oak hammer=.2 decay=5 glow=.3 tick=.2 interval=-12 second=.6 true=0.82 volume=2.5 | softbed | pedal | Light uneven knocks on low rods and octaves
Cellar steps, a candle | Long wall | gong=Coil beat=.6 hammer=.25 strikes=.6 glow=.4 decay=4 interval=7 second=.7 width=.3 hush=.4 true=0.82 runDown=.18 volume=-1.5 | cellar | pedal | Soft coils and fifths, swinging in step
Under the bandstand | Long wall | gong=Straight_rod escapement=Anchor strikes=0 hammer=.2 glow=.95 decay=5 case=Oak interval=12 second=.4 width=.4 hush=.5 unlike=0.45 true=0.88 volume=-7.5 | warmed | walk | Low rods with octaves above, rubbed faintly
Ballast and bilge | Long wall | gong=Tube wall=Chain beat=.8 hammer=.15 strikes=.5 glow=.6 case=Iron interval=-12 second=.8 decay=8 width=.4 true=0.88 runDown=.14 volume=-5 | subbed | pedal | Iron tubes over octaves, dark at the bottom of the wall
Two-ton hush | Long wall | gong=Nested escapement=Deadbeat beat=.3 strikes=.4 hammer=.05 glow=.5 decay=10 case=Marble interval=12 width=.5 unlike=0.15 runDown=.17 volume=0.5 | sines | low | Nested marble, felt, a braked stroke now and then
Quiet engine of winter | Long wall | escapement=Rub_only gong=Cup beat=1 strikes=.2 swing=.9 decay=6 interval=-12 second=.6 width=.5 case=Oak glow=1 hammer=.35 unlike=0.45 volume=6 | larger | pedal | Oak cups rubbed over octaves, one breath a second
`,
    },
    {
      id: 'shared-swings',
      name: 'Shared swings',
      category: 'plucked',
      rows: `
Five on a bench | Splayed arpeggio | beat=.7 hammer=.4 interval=0 second=.2 decay=5 case=Oak width=0.6 true=0.88 tick=0.14 volume=0 | hall 1.mix=.2 | ladder | Oak rods share one swing evenly among the held keys
Carousel at half speed | Splayed arpeggio | beat=.35 gong=Nested hammer=.3 decay=9 bloom=.6 glow=.3 interval=7 width=0.7 true=0.74 tick=0.17 volume=0.5 | valley | gather | Nested coils turn slowly, each key in its own place
Bobbins and pins | Splayed arpeggio | beat=2.6 hammer=.7 decay=1.2 case=Marble second=.1 tick=.25 width=0.6 true=0.82 volume=2 | bare | ladder | Short marble rods, a fast even figure, ticking
Hot chestnuts | Splayed arpeggio | beat=1.8 gong=Coil case=Iron hammer=.5 decay=2 interval=5 second=.4 width=.5 true=0.88 runDown=0.3 volume=3 | amp | six | Iron coils tossed quickly round the chord with fourths, winding down
Glass roundabout | Splayed arpeggio | beat=1.2 gong=Tube case=Glass_dome hammer=.6 decay=6 interval=-12 second=.7 width=0.6 true=0.8 tick=0.15 volume=2.5 | glimmering | ladder | Domed tubes over octaves in an even turn
Weaving shed | Splayed arpeggio | escapement=Anchor beat=1.1 gong=Coil case=Oak hammer=.25 decay=3 interval=-12 second=.5 tick=.15 width=0.7 runDown=.23 | chorale | ladder | Oak coils to and fro, the shares interleaving
Beads told twice | Splayed arpeggio | escapement=Anchor beat=.5 gong=Cup case=Oak hammer=.2 decay=14 interval=0 second=.5 width=0.7 true=0.76 tick=0.17 runDown=.34 volume=2 | chapel | gather | Soft cups in oak, every bead twice round
Sewing machine upstairs | Splayed arpeggio | escapement=Anchor beat=2.8 gong=Straight_rod case=Marble hammer=.5 decay=1.5 tick=.3 interval=12 second=.3 width=0.7 true=0.8 volume=6 | nextdoor | six | Quick marble rods with ticks, woven even
Shingle in the backwash | Splayed arpeggio | escapement=Anchor beat=1.6 gong=Nested case=Marble hammer=.35 decay=4 interval=-5 second=.5 learn=.7 unlike=.5 width=0.5 true=0.85 tick=0.15 volume=1.5 | stone | six | Nested marble, shares not quite even, fourths below
Spokes of an umbrella | Splayed arpeggio | escapement=Anchor beat=.9 gong=Tube case=Oak hammer=.15 decay=8 glow=.4 interval=7 second=.6 width=0.85 true=0.8 tick=0.15 runDown=0.3 volume=4.5 | smallplate | gather | Felted oak tubes and fifths opening in turn, winding down
Gnats over the pond | Splayed arpeggio | escapement=Verge beat=1.4 gong=Cup case=Glass_dome hammer=.5 decay=6 interval=-12 learn=.8 second=.6 width=0.8 true=0.75 volume=6 | nearhall | six | Light uneven taps on domed cups, shared round | texture
Knock at a hollow tree | Splayed arpeggio | escapement=Verge beat=.8 gong=Straight_rod case=Oak hammer=.7 decay=3 interval=0 second=.4 width=0.5 tick=0.1 runDown=0.3 volume=6 | bounces | six | Verge taps on oak rods, each key its own moment, slowly tiring
Bicycle in the rain | Splayed arpeggio | escapement=Verge beat=2 gong=Coil case=Marble hammer=.4 decay=2 tick=.4 interval=7 second=.3 true=0.75 runDown=.14 volume=5.5 | rainnear 2.gain=5 | ladder | Quick knocked coils and ticks turning over | texture
Nutcracker shelf | Splayed arpeggio | escapement=Verge beat=1 gong=Nested case=Iron hammer=.6 decay=2.5 true=.8 interval=12 second=.3 width=0.6 tick=0.13 volume=6 | cellar | six | Dry knocks on iron nests, loosely even
Hottest hour | Splayed arpeggio | escapement=Verge beat=3 gong=Tube case=Glass_dome hammer=.3 decay=4 glow=.4 interval=0 learn=.6 true=0.76 runDown=.34 volume=6 | drift | gather | Domed tubes fluttered softly, a thin shimmering haze | texture
Bucket chain | Passed along | beat=1 gong=Coil case=Oak hammer=.4 decay=4 glow=.2 true=0.85 runDown=.15 | wood | ladder | Oak coils hand each swing from low key to high
Gossip up the stairs | Passed along | beat=2 gong=Straight_rod case=Iron hammer=.55 decay=3 interval=12 second=.4 swing=.5 runDown=0.35 volume=3.5 | stairs | six | Iron rods, a quick wave climbing every second swing, slowly tiring
Sunrise along a fence | Passed along | beat=.6 gong=Nested case=Marble hammer=.35 decay=10 bloom=.8 glow=.4 runDown=0.4 volume=0.5 | ascent | gather | Nested marble, a long wave that brightens as it climbs, slowly tiring
Dominoes in honey | Passed along | beat=.9 gong=Tube case=Oak hammer=.15 decay=6 interval=-12 second=.7 runDown=0.45 | warmed | fifths | Felt tubes over octaves fall upwards, one by one, slowly tiring
Fish ladder | Passed along | beat=1.4 gong=Cup case=Glass_dome hammer=.4 decay=9 interval=7 second=.5 runDown=.19 volume=1.5 | sunk | ladder | Domed cups and fifths leap up the chord
Relay, last runner | Passed along | escapement=Deadbeat beat=1.8 gong=Straight_rod case=Marble hammer=.6 decay=2 strikes=1 interval=0 second=.3 tick=0.15 runDown=.33 volume=2.5 | heads | ladder | Braked marble rods passed up in a clean quick line
Cable car | Passed along | escapement=Deadbeat beat=.8 gong=Tube case=Iron hammer=.5 decay=7 interval=12 bloom=.3 runDown=.12 volume=2 | trail | six | Iron tubes and octaves, each blow stopped for the next
Candles lit from one | Passed along | escapement=Deadbeat beat=.5 gong=Coil case=Oak hammer=.2 decay=8 glow=.5 bloom=.5 interval=0 true=0.87 runDown=.23 volume=5 | chorecho | gather | Soft oak coils lit in order over a small glow | pad
Footbridge | Passed along | escapement=Deadbeat beat=1.2 gong=Nested case=Oak hammer=.3 decay=3 interval=7 second=.6 width=0.85 true=0.78 runDown=.18 volume=0 | booth | six | Nested oak and its fifths, braked step by step
Ice breaking upriver | Passed along | escapement=Deadbeat beat=1 gong=Cup case=Marble hammer=.8 decay=10 interval=19 second=.4 bloom=.6 true=0.78 runDown=.33 volume=3 | cavern | ladder | Hard marble cups and twelfths crack upwards
Gutter, pipe, barrel | Passed along | escapement=Verge beat=.8 gong=Tube case=Marble hammer=.4 decay=5 interval=12 second=.4 true=0.82 volume=0.5 | bucket | ladder | Uneven drips on marble tubes, higher each time
Ants on the ladder | Passed along | escapement=Verge beat=1.6 gong=Straight_rod case=Glass_dome hammer=.6 decay=4 tick=.2 interval=0 second=.3 runDown=.15 volume=6 | points | six | Small domed knocks climbing with a tick
Hens going up to roost | Passed along | escapement=Verge beat=1.1 gong=Cup case=Oak hammer=.35 decay=4 unlike=.6 learn=.6 interval=-5 true=0.88 runDown=0.5 second=.6 volume=1 | wooden | ladder | Oak cups and fourths below rumbling three times a second
Match along a rail | Passed along | escapement=Verge beat=2.2 gong=Straight_rod case=Iron hammer=.8 decay=2 swing=.9 interval=0 second=.2 true=0.8 runDown=0.5 volume=3.5 | desk | fifths | Bright scratchy knocks run up iron rods, winding down
Vine on the drainpipe | Passed along | escapement=Verge beat=.6 gong=Nested case=Marble hammer=.25 decay=8 glow=.5 bloom=.7 interval=12 true=0.85 runDown=.35 volume=6 | shadowed | gather | Nested marble rubbed, with soft knocks rising
Staircase of water | Glass morning | escapement=Anchor beat=.7 strikes=.7 gong=Tube case=Marble hammer=.4 glow=.3 wall=Chain learn=1 interval=0 decay=6 swing=.9 unlike=0.15 width=0.8 true=0.85 tick=0.15 runDown=.16 volume=4 | stone | six | Marble tubes pour each swing from low to high
Violets at dusk | Glass morning | escapement=Deadbeat beat=.9 strikes=.8 gong=Nested case=Oak hammer=.15 glow=.5 wall=Splayed learn=1 interval=7 decay=5 unlike=0.1 width=0.7 true=0.82 tick=0.13 runDown=.36 volume=3 | bowing | ladder | Felt on nested oak, shared round with fifths
Small constellations | Glass morning | escapement=Deadbeat beat=.6 strikes=.9 gong=Cup hammer=.4 glow=.1 wall=Splayed learn=1 unlike=0 interval=12 second=.5 decay=16 width=0.7 true=0.76 tick=0.17 volume=1 | stars | six | Domed cups and octaves in an even turn
Geese over the weir | Glass morning | escapement=Anchor beat=.45 strikes=.6 gong=Straight_rod case=Oak hammer=.25 glow=.6 wall=Chain interval=-12 second=.8 decay=9 unlike=0.1 true=0.88 tick=0.12 runDown=.36 | flock | six | Oak rods over octaves in a long climbing wave
Harp in the larder | Glass morning | escapement=Deadbeat beat=1.5 strikes=.8 gong=Straight_rod hammer=.5 glow=0 wall=Chain learn=1 interval=12 decay=3 case=Iron bloom=.1 unlike=0.05 width=0.8 true=0.88 runDown=0.35 volume=5 | shut | ladder | Iron rods with octaves in a brisk climb, winding down
Morning rounds | Night hall | wall=Splayed beat=.5 gong=Straight_rod decay=8 hammer=.4 case=Oak interval=12 second=.4 unlike=0.4 runDown=.31 volume=-2 | carpet | gather | Braked rods in oak, octaves, one key at a time | keys
Watch on the headland | Night hall | wall=Splayed escapement=Anchor beat=.3 gong=Coil case=Iron decay=14 hammer=.4 bloom=.7 interval=0 unlike=0.05 true=0.8 tick=0.14 runDown=0.4 volume=-4 | shore | fifths | Iron coils take long turns round the wall, running down | bell
Brass planets | Night hall | wall=Splayed escapement=Anchor beat=.7 learn=.8 gong=Nested decay=6 hammer=.5 glow=.2 interval=12 second=.4 case=Marble unlike=0.1 true=0.8 tick=0.12 | turning | gather | Marble nests on even courses with octaves above
Lamps out by floors | Night hall | wall=Chain beat=.8 gong=Tube case=Glass_dome decay=8 hammer=.5 glow=.2 interval=0 learn=1 true=0.8 tick=0.11 runDown=.24 volume=-1 | descent | six | Domed tubes braked in a climbing order
Dormitory whisper | Night hall | wall=Chain escapement=Anchor beat=1.2 gong=Straight_rod decay=5 hammer=.1 glow=.3 interval=0 learn=1 case=Oak true=0.82 tick=0.14 runDown=.34 volume=-2 | mist | ladder | Felt rods that pass a quick soft wave upward
Loosely taken turns | Splayed arpeggio | learn=.25 unlike=.8 gong=Straight_rod beat=1.1 decay=5 case=Oak hammer=.4 width=0.6 tick=0.15 volume=1 | phasing | gather | Rods in oak that only lean toward even shares
Crowded shelf | Splayed arpeggio | learn=.5 unlike=1 gong=Coil escapement=Anchor beat=1.7 case=Marble hammer=.6 decay=3 interval=7 second=.4 width=0.7 true=0.7 runDown=.3 volume=2.5 | tapes | six | Unlike marble coils that strain to share the swing
Wrong by a candle | Splayed arpeggio | learn=.35 unlike=.6 gong=Nested beat=.8 case=Oak hammer=.2 decay=8 glow=.4 interval=0 width=0.75 true=0.88 tick=0.11 volume=1 | softbed | gather | Felt nests that drift in and out of even turns | pad
Chain with a weak link | Passed along | learn=.3 unlike=1 beat=1.3 gong=Tube case=Oak hammer=.5 decay=5 interval=7 second=.5 true=0.74 runDown=0.3 | recall | six | Oak tubes and fifths in an order that keeps slipping, winding down
Across stepping stones | Passed along | learn=.6 unlike=.8 beat=1 gong=Coil case=Marble hammer=.45 decay=5 interval=-12 second=.5 true=0.78 runDown=0.6 volume=5 | leaves | fifths | Marble coils that hesitate on their way up, winding down
Fair day, winding down | Splayed arpeggio | runDown=.7 beat=1.6 gong=Tube case=Marble hammer=.6 decay=4 tick=.15 width=0.5 true=0.82 volume=6 | melting | ladder | An even round of marble tubes that tires and stops
Toy train under the sofa | Splayed arpeggio | runDown=.5 escapement=Anchor beat=2.4 gong=Straight_rod case=Oak hammer=.35 decay=1.5 tick=.4 interval=0 width=0.8 true=0.85 | bedside | six | Short rods and ticks, round and round and slower
Ladder of frost | Passed along | runDown=.6 beat=1.2 gong=Cup case=Glass_dome hammer=.7 decay=12 interval=12 second=.5 true=0.8 volume=1.5 | frost | ladder | Domed cups and octaves climb until they are spent
Story told to the end | Passed along | runDown=.8 escapement=Deadbeat beat=.8 gong=Nested case=Oak hammer=.25 decay=7 glow=.4 bloom=.5 true=0.78 volume=4 | round | gather | Soft nested blows handed up fewer and fewer times
Gate nobody latched | Splayed arpeggio | runDown=.9 escapement=Deadbeat beat=1 gong=Coil case=Iron hammer=.4 decay=6 interval=-12 second=.5 swing=.6 width=0.7 true=0.85 tick=0.14 volume=2.5 | latehall | six | Iron coils over octaves share a few last swings
`,
    },
    {
      id: 'ticking-rooms',
      name: 'Ticking rooms',
      category: 'texture',
      rows: `
Shop before it opens | Tick texture | gong=Coil decay=2 hammer=.4 tick=.5 learn=.1 case=Oak interval=7 second=.5 width=0.8 true=0.75 runDown=.35 volume=1 | carpet | shop | Light knocks on oak coils among unmatched ticks
Watch under a pillow | Tick texture | gong=Straight_rod decay=4 hammer=.45 beat=1.5 strikes=.8 tick=.3 case=Iron interval=-12 second=.6 width=0.7 wall=In_step learn=.9 unlike=.1 runDown=.34 volume=0 | shade | six | Small iron ticks in step, dull rods behind them
Watchmaker's lamp | Tick texture | gong=Tube decay=2 beat=2 tick=.5 case=Iron hammer=.2 learn=.6 interval=-12 second=.7 width=0.8 runDown=.15 volume=-3 | chamber | shop | Tuned ticks over thin tubes in iron, octaves below
Spiders in the movement | Tick texture | gong=Nested decay=.8 beat=4.5 strikes=.6 tick=.35 hammer=.12 learn=0 unlike=1 case=Iron interval=-12 second=.9 true=0.88 runDown=.16 volume=-7 | point | six | Fast unmatched knocks on short nests in iron
Grasshopper in the dome | Tick texture | gong=Cup case=Glass_dome decay=3 beat=3 tick=.15 hammer=.6 wall=In_step learn=.9 interval=12 width=0.65 true=0.88 runDown=0.5 volume=6 | near 1.gain=11 | quiet | Domed cups and ticks that find one quick pulse, slower and slower
Heavy escape wheel | Tick texture | escapement=Deadbeat gong=Nested case=Iron decay=1.5 beat=1 strikes=.9 tick=.9 hammer=.4 wall=In_step learn=1 interval=-12 width=0.8 runDown=.16 | heavy | six | Iron nests and loud ticks in one firm beat
Metal insects at work | Tick texture | escapement=Deadbeat gong=Straight_rod case=Iron decay=2 beat=2.4 tick=.22 hammer=.55 wall=Splayed learn=1 unlike=.1 interval=0 width=0.8 | desk | ladder | Braked iron rods and ticks in an even pattern
Wooden hen clock | Tick texture | escapement=Deadbeat gong=Coil case=Oak decay=1.2 beat=1.2 tick=.4 hammer=.2 wall=In_step learn=.9 interval=-12 second=.5 width=0.7 volume=-1.5 | wooden | tune | Felt coils and wooden ticks, steady as they agree
Deadline | Tick texture | escapement=Deadbeat gong=Tube case=Marble beat=1.6 hammer=.5 wall=Opposed learn=1 interval=7 second=.4 tick=.35 strikes=1 decay=4 true=0.75 runDown=.32 volume=-3.5 | nearroom 2.gain=6 | four | Marble tubes and ticks on alternate sides, braked
Frosted turnstile | Tick texture | escapement=Deadbeat gong=Cup case=Glass_dome decay=4 beat=.8 hammer=.5 wall=Chain learn=1 interval=-5 tick=.3 width=0.8 true=0.8 runDown=.23 volume=6 | nearecho | ladder | Domed cups in a climbing order, a tick for each
Swaying lantern clock | Tick texture | escapement=Anchor gong=Nested case=Oak decay=5 beat=.7 tick=.3 hammer=.3 wall=In_step learn=.8 glow=.3 interval=0 width=0.5 true=0.88 runDown=.32 | chorale | gather | Nested oak swung to and fro, ticks between
Attic full of movements | Tick texture | escapement=Anchor gong=Straight_rod case=Oak decay=3 beat=1.3 tick=.3 learn=0 unlike=1 hammer=.4 interval=12 second=.4 width=0.8 true=0.8 runDown=.28 | dusty | shop | Oak rods, each clock at a rate of its own
Typing pool at four | Tick texture | escapement=Anchor gong=Coil case=Marble decay=1.6 beat=4 tick=.35 learn=.2 hammer=.6 interval=0 second=.6 true=0.8 runDown=.36 volume=4.5 | weathered | six | Very quick marble coils and ticks, never together
Tick of the tall one | Tick texture | escapement=Anchor gong=Tube case=Oak decay=6 beat=.5 tick=1 hammer=.2 wall=In_step interval=-12 second=.6 width=0.8 true=0.88 volume=0.5 | stairs | pair | Slow loud ticks with felted tubes below
Beetle on the dial | Tick texture | escapement=Anchor gong=Cup case=Iron beat=2.2 hammer=.35 wall=Splayed learn=.8 interval=-5 second=.6 tick=.3 decay=5 width=0.65 true=0.84 runDown=.38 volume=-1.5 | smaller | six | Little iron cups with ticks round the wall
Ticks alone, nearly | Tick texture | escapement=Anchor strikes=0 gong=Coil case=Marble decay=.8 beat=1 tick=1 hammer=.2 learn=.8 wall=Opposed interval=-12 true=0.75 volume=0 | nearroom | six | One short strike a key, then only the clockwork
Pocketful of seconds | Tick texture | escapement=Anchor strikes=0 gong=Straight_rod case=Glass_dome beat=2 wall=Splayed learn=1 tick=.25 decay=6 hammer=.35 interval=-12 second=.6 width=0.8 true=0.88 volume=-0.5 | ripple | six | Domed rods struck once over shared small ticks
Waiting room radiator | Tick texture | escapement=Chime_hammer strikes=.5 beat=1.5 gong=Nested case=Iron decay=3 tick=.7 hammer=.3 interval=-12 second=.5 width=0.7 runDown=.13 | nextdoor | calls | Iron nests answered once among iron ticks
Metronome in the orchard | Tick texture | escapement=Chime_hammer strikes=0 gong=Cup case=Oak beat=1.2 wall=In_step learn=1 tick=.35 decay=14 hammer=.4 glow=.2 true=0.8 volume=4 | seaside | hymn | Oak cups over ticks that learn one beat
Sleeping by the meter | Tick texture | escapement=Chime_hammer strikes=0 gong=Tube case=Iron decay=5 beat=.8 tick=.8 hammer=.15 runDown=.6 true=0.8 volume=-5 | slowing | handover | Felted iron tubes while a loud wheel runs slower
Moths round the movement | Tick texture | escapement=Rub_only gong=Straight_rod case=Oak decay=3 beat=2.5 tick=.3 glow=.6 hammer=.3 swing=.9 interval=12 runDown=.14 volume=4.5 | drift | murmur | Rods rubbed in quick small swells with ticks inside
Tuned dust | Tick texture | escapement=Rub_only gong=Cup case=Glass_dome decay=5 beat=1.5 tick=.5 glow=.4 hammer=.5 swing=.5 learn=0 unlike=1 interval=-12 width=0.65 true=0.84 volume=3 | octrain | murmur | Rubbed domed cups, scattered high ticks
Dining car at night | Tick texture | escapement=Rub_only gong=Nested case=Iron decay=4 beat=1 tick=.6 glow=.7 hammer=.2 swing=.8 wall=In_step learn=.9 interval=-12 width=0.8 true=0.7 runDown=.14 volume=-6.5 | bucket | wide | Nested iron rubbed in one pulse with iron ticks
Pulse of the greenhouse | Tick texture | escapement=Rub_only gong=Tube case=Glass_dome decay=6 beat=.8 tick=.35 glow=.5 hammer=.4 swing=1 wall=Splayed learn=.9 width=0.7 true=0.75 runDown=0.4 volume=6 | asleep | gather | Glass tubes swell in turn, ticking as they pass, running down
Clockwork under snow | Tick texture | escapement=Rub_only gong=Coil case=Oak decay=3 beat=.6 tick=.6 glow=.5 hammer=.1 swing=.7 wall=Opposed interval=0 true=0.88 runDown=.18 volume=0.5 | bank | murmur | Dull rubbed coils from two sides over soft ticks
Sand clock | Wound once | gong=Straight_rod case=Marble beat=4.5 strikes=.5 runDown=.62 decay=1 hammer=.3 tick=.2 interval=7 volume=6 | nearbit | gather | Fast marble grains of sound that thin as they run out
Wind-up birds | Wound once | gong=Tube case=Glass_dome beat=3 runDown=.6 decay=3 hammer=.6 tick=.2 interval=12 second=.4 true=0.84 volume=2 | hop | ladder | Domed tubes chirp quickly and run down
Snoring mainspring | Wound once | escapement=Anchor gong=Coil case=Oak beat=1 runDown=.4 decay=4 glow=.5 hammer=.1 tick=.3 swing=.9 interval=-12 true=0.8 volume=0 | cassette | gather | Felt coils over octaves wheeze to and fro, slowing
Scatter of pins | Wound once | gong=Cup case=Marble beat=5 runDown=.9 strikes=1 decay=2 hammer=.6 tick=.1 interval=-12 second=.6 true=0.8 volume=6 | nearecho 2.gain=16 | tossed | A quick burst of marble cups that spends itself at once
Let go of the reel | Wound once | escapement=Deadbeat gong=Nested case=Iron beat=3.5 runDown=.7 strikes=.9 decay=2 hammer=.5 tick=.4 learn=.9 true=0.84 volume=-2.5 | worn | six | Iron nests braked quickly, slowing down together
Mechanical pond | Wound once | runDown=0 gong=Cup case=Oak beat=1.8 decay=6 hammer=.2 tick=.2 learn=.9 glow=.2 interval=5 true=0.84 volume=3 | sunk | murmur | Uneven felt on oak cups, ticks and fourths
Factory seen from a hill | Wound once | runDown=.12 gong=Nested case=Iron beat=2.2 strikes=.7 decay=4 hammer=.4 tick=.3 learn=0 unlike=.9 true=0.75 volume=4 | fogged | six | Iron nests knocked at many rates
Leaves in the letterbox | Wound once | runDown=0.6 gong=Straight_rod case=Oak beat=1.2 tick=.15 learn=.2 interval=0 strikes=1 decay=5 hammer=.25 volume=6 | grains | quiet | Soft irregular knocks on oak rods, slower and slower
Bright idle fingers | Wound once | runDown=0 gong=Tube case=Marble beat=2.6 strikes=.6 decay=3 hammer=.8 tick=.1 wall=Chain learn=1 interval=12 second=.3 true=0.88 volume=6 | prismed | ladder | Drummed marble tubes running up the chord
Slow thaw, many gutters | Wound once | runDown=0 gong=Coil case=Glass_dome beat=.9 strikes=.8 decay=5 hammer=.3 tick=.3 wall=Splayed learn=.5 interval=-12 second=.6 true=0.88 volume=3.5 | rain | shop | Domed coils drip in uneven shares over low octaves
Iron rain | Raw iron | escapement=Verge beat=1.5 true=.4 decay=3 gong=Straight_rod strikes=.6 hammer=.6 bloom=.2 tick=.2 unlike=1 interval=0 volume=6 | cavern | shop | Raw iron rods knocked lightly and unevenly
Scrap in the wind | Raw iron | escapement=Verge beat=.8 true=.2 decay=6 gong=Nested strikes=.5 hammer=.3 bloom=.6 glow=.6 interval=5 second=.4 runDown=.15 volume=3.5 | weathered | quiet | Untrue nested iron, loose knocks over a faint rub
Robot aviary | Raw iron | escapement=Verge beat=2.4 true=.6 decay=1.5 gong=Cup case=Glass_dome strikes=.7 hammer=.5 bloom=0 tick=.3 interval=-12 second=.4 runDown=.18 volume=4 | nearbit 2.gain=10 | ladder | Domed cups half true, quick with ticks
Tin village | Raw iron | escapement=Anchor beat=2 true=.5 decay=2 gong=Tube case=Marble strikes=.7 hammer=.5 bloom=.1 learn=0 unlike=1 interval=7 second=.3 runDown=0.45 | crackle | six | Loose marble tubes, every house its own time, running down
Broken movement | Raw iron | escapement=Deadbeat beat=1.3 true=.3 decay=4 gong=Coil case=Oak strikes=.9 hammer=.4 bloom=.5 learn=.1 interval=-5 second=.5 tick=.4 runDown=0.6 | glassbar | six | Raw oak coils braked out of time with ticks, slower and slower
Felt rain on the roof | Felt roll | learn=0 unlike=1 beat=4 decay=2 strikes=.6 case=Oak interval=0 tick=.1 runDown=.12 volume=0 | felted | murmur | Rods patted by felt at as many rates as keys
Tongues of small fires | Felt roll | gong=Nested beat=3 decay=1 glow=.6 hammer=.2 strikes=.8 case=Marble interval=7 second=.5 learn=0 width=0.5 true=0.75 runDown=.23 volume=2 | lasting | murmur | Short marble nests flickering over a rub
Dragonfly case | Felt roll | gong=Tube case=Glass_dome beat=5 hammer=.4 strikes=.4 decay=3 glow=.2 wall=Opposed learn=1 interval=12 true=0.84 runDown=.33 volume=1.5 | swayed | calls | Domed tubes beating fast, half on each side
Purring in the bookcase | Felt roll | gong=Coil beat=5 hammer=.02 strikes=1 decay=1.5 glow=.2 case=Oak interval=-12 second=.8 learn=.9 unlike=.1 width=0.7 true=0.7 volume=0.5 | taped | quiet | Felt coils over octaves in a fast even purr
Slates in a tremor | Felt roll | gong=Straight_rod beat=2.6 hammer=.5 strikes=.8 decay=1.2 glow=0 case=Marble interval=1 second=.2 unlike=1 learn=0 true=0.8 runDown=0.6 volume=5.5 | rooms | shop | Dry marble rods shaking at different rates, slower and slower
Constellation clock | Splayed arpeggio | escapement=Verge gong=Cup case=Oak beat=.5 decay=10 hammer=.4 interval=12 second=.3 glow=.2 tick=.25 width=0.7 true=0.88 volume=6 | nearhall 2.gain=8 | gather | Taps on oak cups and octaves with ticks, turning slowly round
Crickets keeping order | Splayed arpeggio | escapement=Verge gong=Tube case=Glass_dome beat=1.9 tick=.5 hammer=.4 interval=-12 second=.7 decay=2 width=0.5 volume=2 | nearplate 2.gain=5 | six | Short domed chirps with ticks in even shares
Paper folding machine | Passed along | escapement=Deadbeat gong=Coil case=Oak beat=2.8 tick=.6 decay=2.5 hammer=.5 interval=0 glow=0 true=0.8 runDown=.26 volume=-1 | gated | ladder | Coils in oak and ticks run up in order
Moving stairs, late | Passed along | escapement=Verge gong=Nested case=Iron beat=1 tick=.5 decay=3 hammer=.2 runDown=.58 glow=.4 interval=-12 second=.5 true=0.84 volume=0.5 | descent | six | Rubbed iron nests, knocks and ticks climbing, slowing
Disused signal box | Night hall | escapement=Verge beat=.18 gong=Straight_rod case=Iron tick=.4 decay=8 hammer=.5 glow=.2 interval=0 learn=.2 unlike=.8 volume=2.5 | shore | shop | Iron rods in slow uneven knocks, ticks between them
`,
    },
    {
      id: 'breathing-walls',
      name: 'Breathing walls',
      category: 'voice',
      rows: `
Sleepers on one wall | Breathing voices | beat=.3 hammer=.3 glow=.45 decay=6 interval=-12 unlike=0.4 true=0.93 volume=6 | chapel | sigh | Rubbed coils in oak, one side breathing in as the other lets go
Drawn before speaking | Breathing voices | beat=.5 hammer=.7 glow=.3 second=.3 case=Marble decay=2 hush=.5 unlike=0.1 true=0.88 volume=6 | bare | calls | Rubbed marble coils, short and open like a drawn breath
Low conversation | Breathing voices | gong=Coil beat=.4 hammer=.15 glow=.7 interval=-12 second=.9 case=Oak width=.6 unlike=0.45 runDown=.12 volume=6 | nextdoor | handover | Dark coils over octaves, murmuring by turns
Open mouths, no sound | Breathing voices | gong=Coil case=Glass_dome beat=.2 hammer=.5 glow=.8 interval=7 decay=6 unlike=0.2 true=0.86 | forward | murmur | Domed coils and fifths, hollow, on a five-second breath
Singer behind the screen | Breathing voices | gong=Coil case=Iron hammer=.35 glow=.4 beat=.6 interval=5 second=.5 swing=.6 width=.4 runDown=.2 volume=6 | monks | lone | Rubbed iron coils with fourths, half covered
Sighs of five aunts | Breathing voices | wall=Splayed gong=Nested beat=.35 learn=1 hammer=.3 glow=.6 case=Oak decay=7 unlike=0.1 width=0.6 volume=3.5 | leaves | gather | Nested oak whose breaths come one after another
Chain of yawns | Breathing voices | wall=Chain gong=Coil beat=.5 learn=1 hammer=.4 glow=.7 case=Marble decay=4 unlike=0.1 width=0.8 true=1 volume=3.5 | backward | six | Rubbed coils, each breath passed up from the low key
All in one breath | Breathing voices | wall=In_step gong=Straight_rod beat=.4 learn=1 hammer=.3 glow=.8 case=Oak decay=8 unlike=0.1 true=1 runDown=.16 volume=3 | asleep | handover | Rubbed rods that fill and empty together over a low hum
Unsure chorus | Breathing voices | wall=In_step learn=.1 unlike=1 gong=Tube beat=.4 hammer=.25 glow=.6 case=Oak decay=8 true=0.88 runDown=.15 volume=5 | flock | hymn | Rubbed oak tubes, each breathing in its own time
Quick small breaths | Breathing voices | wall=Opposed beat=2 gong=Cup hammer=.3 decay=6 glow=1 swing=.5 unlike=0.15 runDown=.19 volume=6 | ripple | calls | Rubbed cups panting softly on alternate sides
Humming with closed lips | Rubbed drone | gong=Coil case=Oak hammer=.05 glow=.5 interval=0 swing=.2 beat=.4 decay=3 hush=.4 bloom=.1 width=0.7 volume=1.5 | boxed | tune | Coils rubbed with felt, round and nearly steady
Mother in the next room | Rubbed drone | gong=Coil case=Oak hammer=.2 glow=.6 interval=12 second=.4 swing=.4 beat=.3 decay=4 width=0.8 volume=-0.5 | bedside | hymn | Warm rubbed coils with a faint octave
Hum of the choirmaster | Rubbed drone | gong=Straight_rod case=Oak hammer=.15 glow=.4 interval=-12 second=.6 beat=.3 decay=5 hush=.4 width=0.6 volume=6 | even | hymn | Rubbed oak rods with octaves under them
Ah without the choir | Rubbed drone | gong=Nested case=Oak hammer=.35 glow=.7 interval=0 bloom=.3 swing=.5 decay=7 volume=3 | pedalled | sigh | Nested oak rubbed wide and warm
Nun at the grille | Rubbed drone | gong=Tube case=Marble hammer=.3 glow=.5 interval=0 second=.3 swing=.3 beat=.5 decay=8 hush=.3 width=0.6 volume=2 | cavern | lone | A marble tube rubbed thin and straight
Boys up in the loft | Glass morning | case=Marble hammer=.4 glow=.6 interval=0 second=.4 wall=Opposed learn=.9 swing=.8 decay=5 unlike=0.4 runDown=.17 volume=6 | nave | handover | Rubbed marble tubes, two sides by turns
High through glass | Glass morning | gong=Coil hammer=.4 glow=.6 interval=12 swing=.6 beat=.3 decay=4 unlike=0.5 true=0.86 volume=1 | glimmering | calls | Domed coils rubbed with octaves, light and far up
Descant in the attic | Glass morning | gong=Straight_rod case=Oak hammer=.5 glow=.5 interval=12 second=.8 beat=.6 wall=In_step decay=5 unlike=0.1 true=0.86 volume=4.5 | dusty | lone | Rubbed oak rods with bright octaves
Cold breath, warm scarf | Glass morning | gong=Nested case=Oak hammer=.15 glow=.8 interval=7 beat=.4 wall=Chain decay=6 unlike=0.2 true=0.84 runDown=.12 volume=-1 | brought | gather | Soft nested oak and fifths, filling upward
Glassblower's lungs | Glass morning | gong=Cup beat=.6 hammer=.3 glow=.7 interval=0 swing=.6 wall=In_step learn=1 decay=12 unlike=0.05 true=0.93 runDown=.18 volume=0.5 | opening | wide | Domed cups that fill and empty together
Voice in the metal | Raw iron | escapement=Rub_only true=.5 beat=.3 glow=.6 hammer=.4 gong=Coil decay=6 bloom=.4 interval=0 second=.5 volume=3.5 | ringed | calls | Raw iron coils rubbed, a little sour and near
Throat of the furnace | Raw iron | escapement=Rub_only true=.7 beat=.2 glow=.9 hammer=.2 gong=Nested decay=10 interval=-12 second=.8 swing=.9 volume=2.5 | lowcath | drone | Dark iron nests over octaves, swelling slowly | drone
Bent lullaby | Raw iron | escapement=Rub_only true=.8 beat=.5 glow=.5 hammer=.15 gong=Cup case=Oak decay=8 interval=0 second=.5 bloom=.2 volume=5 | recall | tune | Oak cups rubbed soft, not perfectly true
Old woman humming | Raw iron | escapement=Rub_only true=.6 beat=.7 glow=.4 hammer=.25 gong=Straight_rod case=Oak decay=4 interval=0 second=.3 bloom=.2 hush=.4 volume=6 | cassette | hymn | Rubbed oak rods a shade off, close and plain
Wind says a name | Raw iron | escapement=Rub_only true=.85 beat=.4 glow=.9 hammer=.7 gong=Tube case=Glass_dome decay=6 bloom=.9 interval=7 second=.5 | weathered | murmur | Domed tubes rubbed hard, tops flaring
Spoken once, then held | Long wall | escapement=Anchor strikes=0 gong=Coil hammer=.35 glow=.7 swing=.4 decay=5 case=Oak unlike=0 width=0.8 volume=-4 | lasting | calls | Oak coils struck by the key and then kept humming
Consonant and vowel | Long wall | escapement=Anchor strikes=0 gong=Tube hammer=.6 glow=.8 swing=.3 decay=4 case=Marble hush=.4 unlike=0.55 width=0.7 volume=-3 | chorecho | calls | A clear knock on marble tubes, then a rub
Answer in kind | Long wall | escapement=Anchor strikes=.7 beat=.7 gong=Nested hammer=.3 glow=.95 case=Oak decay=7 wall=Opposed interval=-12 second=.7 true=1 runDown=.12 volume=-8 | round | trio | Oak nests over octaves that speak, hum and speak again
Reader and benches | Long wall | escapement=Deadbeat wall=Opposed beat=.35 strikes=.7 learn=1 gong=Coil hammer=.3 glow=.8 case=Oak decay=5 unlike=0.5 runDown=.22 volume=3 | pipes | handover | Oak coils rubbed, a soft braked word from either side
Grace before supper | Long wall | escapement=Anchor wall=Chain beat=.5 strikes=.4 learn=1 gong=Straight_rod hammer=.2 glow=.8 case=Oak interval=12 second=.3 decay=6 unlike=0.2 width=0.6 runDown=.23 volume=-3 | octaved | sigh | Soft rods rubbed, the words passed up the table
Vowel of the kettle | Breathing voices | gong=Tube case=Iron beat=1.2 hammer=.75 glow=.7 interval=-5 decay=3 swing=.3 unlike=0.2 true=0.86 bloom=.75 volume=0.5 | vibed | calls | Iron tubes and fourths below rubbed bright, breathing quickly
Whispering rods | Breathing voices | gong=Straight_rod case=Marble beat=.6 hammer=.75 glow=.8 decay=2 interval=0 bloom=.6 unlike=0.45 true=0.86 runDown=.11 volume=0.5 | bowing | murmur | Marble rods rubbed with bare brass, all air and edge
Cups in their sleep | Breathing voices | gong=Cup case=Marble beat=.2 decay=10 interval=-5 glow=.8 second=.9 hammer=.2 unlike=0.4 volume=6 | silent | calls | Felt on marble cups with fourths under, very slow
Bellows under ash | Breathing voices | gong=Nested case=Iron beat=.35 hammer=.5 glow=.9 decay=8 bloom=.8 interval=-12 unlike=0.4 true=0.84 volume=6 | tuned | fifths | Iron nests rubbed over octaves, parts coming and going
Chest of drawers sings | Breathing voices | gong=Straight_rod case=Oak beat=.45 hammer=.2 glow=.5 decay=4 interval=7 second=.7 hush=.5 true=1 runDown=.15 volume=6 | larger | sigh | Oak rods and fifths rubbed warm, side and side
Violin left in the rain | Rubbed drone | gong=Straight_rod case=Oak hammer=.6 glow=.6 interval=0 second=.3 swing=.5 beat=.6 decay=3 hush=.4 bloom=.5 true=0.86 runDown=.16 volume=2.5 | sunk | tune | Rubbed oak rods, bright and a little wet | string
Bow hair, no rosin | Rubbed drone | gong=Straight_rod case=Marble hammer=.8 glow=.7 interval=7 second=.2 swing=.4 beat=.8 decay=2 hush=.6 width=0.5 true=0.86 bloom=.3 volume=0 | swept | calls | Marble rods and fifths rubbed bright, short of breath | string
Cello through a door | Rubbed drone | gong=Coil case=Oak hammer=.3 glow=.6 interval=-12 second=.5 swing=.4 beat=.4 decay=3 hush=.5 width=0.5 true=0.86 volume=6 | across | low | Rubbed oak coils over octaves, low and smooth | string
Second desk, muted | Rubbed drone | gong=Nested case=Marble hammer=.2 glow=.8 interval=0 swing=.5 beat=.5 wall=Opposed learn=.9 decay=4 hush=.5 true=0.86 runDown=.11 volume=6 | section | handover | Nested marble rubbed softly from two sides | string
Hurdle of wires | Rubbed drone | gong=Coil case=Marble hammer=.7 glow=.8 interval=7 second=.6 swing=.3 beat=1 decay=3 bloom=.6 width=0.6 true=0.82 volume=-0.5 | brass | handover | Marble coils and fifths rubbed with brass | string
Flute at the far gate | Glass morning | gong=Straight_rod case=Marble hammer=.2 glow=.4 interval=12 second=.2 swing=.4 beat=.7 decay=2 hush=.6 unlike=0.1 width=0.6 true=0.8 volume=6 | shore | tune | Soft marble rods rubbed alone, small and round | wind
Bottles on the fence | Glass morning | gong=Tube case=Oak hammer=.1 glow=.5 interval=0 second=.4 swing=.7 beat=.4 wall=Opposed decay=3 hush=.5 true=0.86 runDown=.2 volume=6 | wooden | calls | Oak tubes rubbed with felt, one side blown and then the other | wind
Reed bed in March | Glass morning | gong=Coil case=Iron hammer=.6 glow=.7 interval=5 second=.4 swing=.8 beat=.9 wall=Chain decay=3 width=.5 unlike=0.5 true=0.86 runDown=.13 volume=3 | seaside | murmur | Iron coils rubbed bright, gusts rising through the chord | wind
Pipes of ice | Glass morning | gong=Tube hammer=.5 glow=.3 interval=12 second=.5 swing=.3 beat=1.2 decay=2 hush=.6 unlike=0.45 width=0.5 true=0.86 volume=6 | prismed | peal | Short domed tubes rubbed with octaves | wind
Foghorn, small hours | Glass morning | gong=Nested case=Iron hammer=.15 glow=.8 interval=-12 second=.9 swing=.8 beat=.2 decay=8 unlike=0.1 width=0.5 true=0.8 volume=6 | fogged | deep | Dark iron nests over octaves, one long breath | wind
Last of the spring | Breathing voices | gong=Coil hammer=.35 case=Oak beat=.6 decay=4 interval=7 second=.5 runDown=.62 glow=1 true=0.88 volume=6 | melting | wide | Rubbed coils and fifths whose breaths come slower and stop
Talked to sleep | Breathing voices | runDown=.5 gong=Tube hammer=.2 glow=.7 case=Oak beat=.7 decay=7 tick=.15 unlike=0.4 true=0.84 volume=4.5 | tapes | handover | Oak tubes rubbed with a quiet tick, tiring
Half-remembered vowel | Breathing voices | gong=Nested hammer=.4 beat=.5 decay=5 wall=Splayed runDown=.62 glow=1 case=Marble unlike=0.15 width=0.7 true=0.86 volume=6 | slowdrift | gather | Marble nests that breathe in turn until they are spent
Out of the same mouth | Breathing voices | learn=0 unlike=0 beat=.3 wall=In_step gong=Cup case=Oak hammer=.2 glow=.8 interval=12 second=.6 decay=9 true=0.86 volume=2.5 | mirror | middle | Oak cups rubbed with octaves, each swelling after its key
Curtain at the sash | Breathing voices | wall=Chain learn=.7 unlike=.5 gong=Straight_rod case=Glass_dome beat=1 hammer=.35 glow=.6 interval=-12 second=.8 decay=7 width=0.6 true=0.97 swing=.7 volume=5 | bank | drone | Domed rods over octaves, the swell moving up and not quite even
`,
    },
  ],
}
