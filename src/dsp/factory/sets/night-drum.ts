import { type Phrase } from '../types'
import { type InstrumentSet } from './set'

// Ten directions, one for each thing a drum of this kind is played as, and ten corners
// in each: a hand, a body under the skin, a way to begin, a register. The five of a
// corner differ in the skin and in the second drum behind it, and each has its own place.

/** A phrase from `start length key gain`, one note after another. */
const notes = (text: string): Phrase => ({
  notes: text.split(', ').map((note) => {
    const [atSec, durSec, key, gain] = note.split(' ').map(Number)
    return { atSec, durSec, note: key, gain }
  }),
})

export const SET: InstrumentSet = {
  device: 'night-drum',
  names: {
    hand: ['Finger', 'Thumb', 'Palm', 'Stick', 'Brush', 'Rub', 'Hum'],
    cavity: ['Shallow', 'Pot', 'Kettle', 'Tube', 'None'],
  },
  chains: {
    bare: { effects: [{ deviceId: 'ambient-eq', preset: 'Open' }], words: ', dry and close' },
    warm: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Warm' },
        { deviceId: 'spread', preset: 'Soft tilt' },
      ],
      words: ', warm and near',
    },
    shade: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Shaded' }],
      words: ', with the top shaded off',
    },
    forward: {
      effects: [
        { deviceId: 'tamer', preset: 'Gentle' },
        { deviceId: 'ambient-eq', preset: 'Forward' },
      ],
      words: ', evened out and brought forward',
    },
    thin: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Thin' },
        { deviceId: 'plate-reverb', preset: 'Tight room' },
      ],
      words: ', thinned in a tight room',
    },
    deep: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Deep' },
        { deviceId: 'spread', preset: 'Firm bass' },
      ],
      words: ', with firm deep lows',
    },
    hollow: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Hollow' },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: ', scooped hollow and a little wide',
    },
    middle: {
      effects: [
        { deviceId: 'analog-drive', preset: 'First hint' },
        { deviceId: 'spread', preset: 'To the middle' },
      ],
      words: ', all in the middle',
    },
    booth: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Small booth' }],
      words: ', in a padded booth',
    },
    dead: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.2 } }],
      words: ', in a small dead room',
    },
    chamber: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber' }],
      words: ', in a tight chamber',
    },
    room: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } }],
      words: ', in a plain room',
    },
    smallplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Small plate' }],
      words: ', on a small plate',
    },
    box: {
      effects: [{ deviceId: 'expanse', preset: 'Small box', params: { mix: 0.28 } }],
      words: ', in a small hard box',
    },
    deck: {
      effects: [{ deviceId: 'tape', preset: 'Mastering deck', params: { hiss: 0 } }],
      words: ', on a clean tape deck',
    },
    thump: {
      effects: [{ deviceId: 'tape', preset: 'Warm thump', params: { hiss: 0.05 } }],
      words: ', on thick warm tape',
    },
    cassette: {
      effects: [{ deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.1 } }],
      words: ', on a four-track cassette',
    },
    iron: { effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }], words: ', through iron' },
    triode: {
      effects: [{ deviceId: 'analog-drive', preset: 'Triode glow' }],
      words: ', through a glowing valve',
    },
    firm: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Low warmth' },
        { deviceId: 'spread', preset: 'Firm bass' },
      ],
      words: ', with a warm driven bottom',
    },
    crunch: {
      effects: [
        { deviceId: 'saturator', preset: 'Drum bus crunch' },
        { deviceId: 'ambient-eq', preset: 'Warm' },
      ],
      words: ', pressed into a little crunch',
    },
    fold: {
      effects: [
        { deviceId: 'saturator', preset: 'Folded glass' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', with a folded edge in a plain room',
    },
    reel: {
      effects: [{ deviceId: 'patina', preset: 'Quarter inch reel', params: { noise: 0.1 } }],
      words: ', on quarter-inch reel',
    },
    valve: {
      effects: [{ deviceId: 'patina', preset: 'Hot valve', params: { noise: 0.1 } }],
      words: ', through a hot old valve',
    },
    glaze: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Glaze' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', with a grainy digital glaze in a room',
    },
    wood: {
      effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.4 } }],
      words: ', inside a wooden box',
    },
    clay: {
      effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.6 } }],
      words: ', inside a clay pot',
    },
    cistern: {
      effects: [{ deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.4 } }],
      words: ', down in a cistern',
    },
    tin: {
      effects: [{ deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.4 } }],
      words: ', inside a small tin',
    },
    combo: {
      effects: [{ deviceId: 're-amp', preset: 'Combo in a room', params: { noise: 0 } }],
      words: ', from an amplifier in a room',
    },
    cupboard: {
      effects: [{ deviceId: 're-amp', preset: 'In the cupboard', params: { noise: 0 } }],
      words: ', from a speaker in a cupboard',
    },
    pillow: {
      effects: [{ deviceId: 're-amp', preset: 'Pillow speaker', params: { noise: 0 } }],
      words: ', from a speaker under a pillow',
    },
    felt: {
      effects: [{ deviceId: 'sift', preset: 'Soft hammers' }],
      words: ', with the strokes softened',
    },
    airy: {
      effects: [
        { deviceId: 'sift', preset: 'Wide air' },
        { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.12 } },
      ],
      words: ', with the air spread wide',
    },
    strikes: {
      effects: [{ deviceId: 'sift', preset: 'Strikes forward' }],
      words: ', with the strokes pushed forward',
    },
    after: {
      effects: [{ deviceId: 'sift', preset: 'Strike just after' }],
      words: ', with every stroke heard just after',
    },
    doubled: {
      effects: [{ deviceId: 'stereo-detune', preset: 'Doubled' }],
      words: ', doubled on both sides',
    },
    halo: {
      effects: [
        { deviceId: 'stereo-detune', preset: 'Soft halo' },
        { deviceId: 'ether-reverb', preset: 'Faint air' },
      ],
      words: ', with a soft detuned halo',
    },
    slap: {
      effects: [{ deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.25 } }],
      words: ', with one quick slap behind it',
    },
    sustain: {
      effects: [
        { deviceId: 'ambient-comp', preset: 'Long sustain' },
        { deviceId: 'ambient-eq', preset: 'Shaded' },
      ],
      words: ', with the ring drawn out',
    },
    tamed: {
      effects: [
        { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
        { deviceId: 'ambient-eq', preset: 'Warm' },
      ],
      words: ', held down and near',
    },
    ends: {
      effects: [
        { deviceId: 'lift', preset: 'Just the ends' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', with the quiet ends lifted in a room',
    },
    overt: {
      effects: [{ deviceId: 'reveal', preset: 'Overtones' }],
      words: ', with the overtones turned up',
    },
    warmbody: {
      effects: [
        { deviceId: 'reveal', preset: 'Warm body' },
        { deviceId: 'tape', preset: 'Clean transfer', params: { hiss: 0 } },
      ],
      words: ', with the body turned up',
    },
    openvowel: {
      effects: [
        { deviceId: 'imprint', preset: 'Open vowel' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', shaped by an open vowel',
    },
    roundvowel: {
      effects: [
        { deviceId: 'imprint', preset: 'Round vowel' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.15 } },
      ],
      words: ', shaped by a round vowel',
    },
    tube: {
      effects: [
        { deviceId: 'imprint', preset: 'Hollow tube' },
        { deviceId: 'chorus', preset: 'Subtle widener', params: { mix: 0.25 } },
      ],
      words: ', through a hollow tube',
    },
    giant: {
      effects: [
        { deviceId: 'size', preset: 'Giant' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', from a far larger body',
    },
    smaller: {
      effects: [
        { deviceId: 'size', preset: 'Smaller' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
      ],
      words: ', from a smaller body on a plate',
    },
    breathing: {
      effects: [
        { deviceId: 'size', preset: 'Breathing' },
        { deviceId: 'hall-reverb', preset: 'Tight chamber' },
      ],
      words: ', in a body that grows and shrinks',
    },
    limit: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 8 } },
      ],
      words: ', pressed level and near',
    },
    limitroom: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10, gain: 7 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', pressed level in a small room',
    },
    hall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.28 } }],
      words: ', in a wide hall',
    },
    cath: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.3 } }],
      words: ', in a cathedral',
    },
    darkhall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.32 } }],
      words: ', in a dark hall',
    },
    thintail: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.28 } }],
      words: ', under a thin airy tail',
    },
    undertow: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.28 } }],
      words: ', over a warm low tail',
    },
    nave: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.34 } }],
      words: ', far down a vast nave',
    },
    far: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Distant' },
        { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.55 } },
      ],
      words: ', from very far away',
    },
    longplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.28 } }],
      words: ', on a long plate',
    },
    darkplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } }],
      words: ', on a dark plate',
    },
    brightplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.22 } }],
      words: ', on a bright plate',
    },
    bright: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Bright chamber', params: { mix: 0.22 } }],
      words: ', in a bright chamber',
    },
    late: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.28 } }],
      words: ', in a hall that answers late',
    },
    valley: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.26 } }],
      words: ', across a valley',
    },
    cave: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.28 } }],
      words: ', in a dark cave',
    },
    tank: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.2 } }],
      words: ', in a small bright tank',
    },
    latefdn: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Late arrival', params: { mix: 0.3 } }],
      words: ', with a room that arrives late',
    },
    breathroom: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.32 } }],
      words: ', in a room that breathes',
    },
    crypt: {
      effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.3 } }],
      words: ', over a crypt',
    },
    tunnel: {
      effects: [{ deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.3 } }],
      words: ', down a narrow tunnel',
    },
    farecho: {
      effects: [{ deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.28 } }],
      words: ', with far hard echoes',
    },
    quickswell: {
      effects: [{ deviceId: 'expanse', preset: 'Quick swell', params: { mix: 0.32 } }],
      words: ', in a space that swells up after it',
    },
    spring: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.22 } }],
      words: ', in a two-spring tank',
    },
    slack: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Single slack coil', params: { mix: 0.26 } }],
      words: ', on one slack spring',
    },
    cavern: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.26 } }],
      words: ', in a cavern of small echoes',
    },
    shaft: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Mine shaft', params: { mix: 0.3 } }],
      words: ', down a mine shaft',
    },
    gated: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.34 } }],
      words: ', in a room that stops short',
    },
    rev: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.36 } }],
      words: ', with a tail that rises backwards',
    },
    bloom: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.36 } }],
      words: ', with a tail that swells late',
    },
    ripples: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Ripples', params: { mix: 0.36 } }],
      words: ', with a rippling tail',
    },
    humming: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Humming', params: { mix: 0.28 } }],
      words: ', with low humming in the room',
    },
    monks: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.3 } }],
      words: ", under low men's vowels",
    },
    oo: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind' }],
      words: ', with a far Oo behind it',
    },
    chapel: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel' }],
      words: ', in a chapel that answers in vowels',
    },
    longdark: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.32 } }],
      words: ', with octaves sinking in a long dark tail',
    },
    faintglow: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Faint glow' }],
      words: ', with a faint glow a fifth up',
    },
    shim: {
      effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer' }],
      words: ', with a faint octave shimmer',
    },
    lowshadow: {
      effects: [{ deviceId: 'shimmer', preset: 'Low shadow', params: { mix: 0.28 } }],
      words: ', with an octave sinking under its tail',
    },
    spiral: {
      effects: [{ deviceId: 'spiral', preset: 'Small room rise', params: { mix: 0.24 } }],
      words: ', in a small room that climbs',
    },
    fuzzroom: {
      effects: [{ deviceId: 'haze', preset: 'Faint warmth' }],
      words: ', in a faintly fuzzy room',
    },
    wool: {
      effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.35 } }],
      words: ', under a wool blanket of haze',
    },
    bowlhalo: {
      effects: [{ deviceId: 'bowls', preset: 'Faint halo' }],
      words: ', with singing bowls answering faintly',
    },
    lowbowls: {
      effects: [{ deviceId: 'bowls', preset: 'Low fifths', params: { mix: 0.28, strike: 0.2 } }],
      words: ', with low bowls in fifths',
    },
    strings: {
      effects: [{ deviceId: 'sympathetic', preset: 'Minor strings', params: { mix: 0.3 } }],
      words: ', waking strings in A minor',
    },
    follow: {
      effects: [{ deviceId: 'sympathetic', preset: 'Follow the tune', params: { mix: 0.34 } }],
      words: ', waking strings that learn its notes',
    },
    silent: {
      effects: [{ deviceId: 'silent-keys', preset: 'Minor seven held', params: { mix: 0.35 } }],
      words: ', waking a silent minor seventh',
    },
    repeats: {
      effects: [{ deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.26 } }],
      words: ', with warm tape repeats',
    },
    dotted: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.26 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', with echoes in a dotted rhythm',
    },
    trail: {
      effects: [{ deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.26 } }],
      words: ', with a long dark trail of echo',
    },
    gallop: {
      effects: [{ deviceId: 'tape-echo', preset: 'Two head gallop', params: { mix: 0.26 } }],
      words: ', with a two-head gallop',
    },
    darkecho: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.26 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', with a dark echo on a plate',
    },
    murk: {
      effects: [{ deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.28 } }],
      words: ', with slow murky repeats',
    },
    octhop: {
      effects: [{ deviceId: 'analog-delay', preset: 'Octave hop', params: { mix: 0.24 } }],
      words: ', with echoes that hop by octaves',
    },
    stone: {
      effects: [{ deviceId: 'skipping-stone', preset: 'Skipping stone', params: { mix: 0.28 } }],
      words: ', with echoes that skip away',
    },
    slowring: {
      effects: [
        { deviceId: 'skipping-stone', preset: 'Slowing bounces', params: { mix: 0.26 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', with echoes that slow down',
    },
    lake: {
      effects: [{ deviceId: 'skipping-stone', preset: 'Rain on the lake', params: { mix: 0.26 } }],
      words: ', with echoes like drops on a lake',
    },
    star: {
      effects: [
        { deviceId: 'constellation', preset: 'One far star', params: { mix: 0.3 } },
        { deviceId: 'plate-reverb', preset: 'Faint sheen' },
      ],
      words: ', with one far echo',
    },
    seven: {
      effects: [{ deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.3 } }],
      words: ', with seven scattered echoes',
    },
    points: {
      effects: [{ deviceId: 'constellation', preset: 'Faint points' }],
      words: ', with faint points of echo',
    },
    canon: {
      effects: [{ deviceId: 'canon', preset: 'Faint answer' }],
      words: ', with a faint second player after it',
    },
    shadow: {
      effects: [{ deviceId: 'canon', preset: 'Octave shadow', params: { mix: 0.28 } }],
      words: ', followed an octave below',
    },
    orbit: {
      effects: [{ deviceId: 'orbits', preset: 'Slow phasing', params: { mix: 0.3 } }],
      words: ', in loops that slide apart',
    },
    pair: {
      effects: [{ deviceId: 'orbits', preset: 'Pulse pair', params: { mix: 0.28 } }],
      words: ', in a pair of pulsing loops',
    },
    recall: {
      effects: [{ deviceId: 'echo-memory', preset: 'Recalling', params: { mix: 0.32 } }],
      words: ', with moments that come back later',
    },
    prism: {
      effects: [{ deviceId: 'prism', preset: 'Low to high', params: { mix: 0.26 } }],
      words: ', with echoes that unfold low to high',
    },
    mirror: {
      effects: [{ deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.36 } }],
      words: ', with slow backward swells',
    },
    reflect: {
      effects: [
        { deviceId: 'reverse-delay', preset: 'Faint reflection' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', with a faint backward reflection',
    },
    grains: {
      effects: [{ deviceId: 'grain-delay', preset: 'Plain repeat', params: { mix: 0.26 } }],
      words: ', with plain grainy repeats',
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
      words: ', under a harmonic tremolo in a room',
    },
    sea: {
      effects: [
        { deviceId: 'tremolo', preset: 'Sea swell' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', in uneven slow swells',
    },
    pan: {
      effects: [
        { deviceId: 'tremolo', preset: 'Slow pan' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', drifting from side to side',
    },
    rotor: {
      effects: [{ deviceId: 'rotary', preset: 'Chorale' }],
      words: ', through a slow rotor',
    },
    drumrotor: {
      effects: [{ deviceId: 'rotary', preset: 'Dark drum' }],
      words: ', through a dark turning drum',
    },
    chorus: {
      effects: [
        { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.4 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', under a slow chorus on a plate',
    },
    ensemble: {
      effects: [{ deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.45 } }],
      words: ', in a deep ensemble',
    },
    phase: {
      effects: [
        { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', in a slow phaser swirl',
    },
    lowpass: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', under a low-pass that moves like ice',
    },
    lpg: {
      effects: [{ deviceId: 'auto-filter', preset: 'Low-pass gate' }],
      words: ', under a dark low-pass',
    },
    softbloom: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Soft bloom' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', through a filter that opens softly',
    },
    notch: {
      effects: [{ deviceId: 'auto-filter', preset: 'Slow notch' }],
      words: ', with a slow notch moving through it',
    },
    currents: {
      effects: [
        { deviceId: 'currents', preset: 'Slow water' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', moved by slow water',
    },
    ripple: {
      effects: [
        { deviceId: 'currents', preset: 'Ripples' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', in quick ripples',
    },
    glimmer: {
      effects: [
        { deviceId: 'glimmer', preset: 'Light on water' },
        { deviceId: 'plate-reverb', preset: 'Faint sheen' },
      ],
      words: ', every partial catching the light',
    },
    flock: {
      effects: [{ deviceId: 'murmuration', preset: 'Evening flock' }],
      words: ', in a flock at evening',
    },
    two: {
      effects: [{ deviceId: 'murmuration', preset: 'Two close by' }],
      words: ', with two more players close by',
    },
    circle: {
      effects: [
        { deviceId: 'around', preset: 'Slow circle' },
        { deviceId: 'ether-reverb', preset: 'Faint air' },
      ],
      words: ', going slowly round the head',
    },
    sway: {
      effects: [{ deviceId: 'around', preset: 'Gentle sway' }],
      words: ', swaying gently round the head',
    },
    breath: {
      effects: [
        { deviceId: 'breath', preset: 'Calm breath' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', in slow calm breaths',
    },
    asleep: {
      effects: [
        { deviceId: 'breath', preset: 'Asleep' },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.18 } },
      ],
      words: ', in the breath of someone asleep',
    },
    throb: {
      effects: [
        { deviceId: 'pulses', preset: 'Soft throb' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', in a soft throb',
    },
    bandpulse: {
      effects: [{ deviceId: 'band-pulse', preset: 'Slow low pulse' }],
      words: ', the low middle pulsing slowly',
    },
    latevib: {
      effects: [
        { deviceId: 'late-vibrato', preset: 'Late vibrato' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
      ],
      words: ', with a vibrato that comes late',
    },
    slowbow: {
      effects: [
        { deviceId: 'late-vibrato', preset: 'Slow bow' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', swaying as a slow bow does',
    },
    bowed: {
      effects: [
        { deviceId: 'swell', preset: 'Bowed' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', with every attack taken away',
    },
    losing: {
      effects: [
        { deviceId: 'winding-down', preset: 'Soft losing pace' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', a pulse in it forever losing pace',
    },
    pressing: {
      effects: [{ deviceId: 'vinyl', preset: 'New pressing' }],
      words: ', on a newly pressed record',
    },
    dust: {
      effects: [
        { deviceId: 'glints', preset: 'Faint dust' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', with faint dust of octaves',
    },
    steprain: {
      effects: [{ deviceId: 'weather', preset: 'Light rain' }],
      words: ', with a light rain on it',
    },
    breeze: {
      effects: [{ deviceId: 'weather', preset: 'Breezy day' }],
      words: ', outdoors on a breezy day',
    },
    surf: {
      effects: [{ deviceId: 'weather', preset: 'Slow surf' }],
      words: ', with slow surf washing through',
    },
    shallows: {
      effects: [{ deviceId: 'underwater', preset: 'Sunlit shallows' }],
      words: ', in sunlit shallows',
    },
    toe: {
      effects: [
        { deviceId: 'underwater', preset: 'A toe in' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', with a toe in the water',
    },
    glass: {
      effects: [
        { deviceId: 'low-bitrate', preset: 'Behind glass' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', behind glass',
    },
    grain: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.36 } }],
      words: ', in a soft cloud of grains',
    },
    lowtide: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Low tide', params: { mix: 0.34 } }],
      words: ', with grains an octave under',
    },
    mist: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.4 } }],
      words: ', hanging in a mist',
    },
    blurred: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Softened attacks' }],
      words: ', with the attacks dissolved',
    },
    sines: {
      effects: [{ deviceId: 'sine-shadow', preset: 'Sine shadow', params: { mix: 0.34 } }],
      words: ', with a sine shadow after it',
    },
    linger: {
      effects: [
        { deviceId: 'sine-shadow', preset: 'Long linger', params: { mix: 0.3 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', with sines that linger',
    },
    leaves: {
      effects: [{ deviceId: 'falling', preset: 'Falling leaves', params: { mix: 0.26 } }],
      words: ', with leaves falling off it',
    },
    sag: { effects: [{ deviceId: 'melt', preset: 'Soft sag' }], words: ', with a tail that sags' },
    gen: {
      effects: [{ deviceId: 'generations', preset: 'Into the room', params: { mix: 0.34 } }],
      words: ', dissolving into the room',
    },
    fog: {
      effects: [{ deviceId: 'fog', preset: 'Soft cloud', params: { mix: 0.6 } }],
      words: ', blurred into a soft cloud',
    },
    veil: {
      effects: [
        { deviceId: 'fog', preset: 'Thin veil' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', behind a thin veil',
    },
    stretched: {
      effects: [{ deviceId: 'stretch', preset: 'Faint halo' }],
      words: ', with a faint stretched halo',
    },
    pedal: {
      effects: [{ deviceId: 'sustainer', preset: 'Sustain pedal', params: { mix: 0.34 } }],
      words: ', held by a sustain pedal',
    },
    thinhalo: {
      effects: [
        { deviceId: 'sustainer', preset: 'Thin halo' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', with a thin held halo',
    },
    section: {
      effects: [{ deviceId: 'pad-follower', preset: 'Barely there' }],
      words: ', with a faint string section after it',
    },
    singer: {
      effects: [
        { deviceId: 'overtone-singer', preset: 'Faint melody' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', with a faint whistle picked out of it',
    },
    shift: {
      effects: [{ deviceId: 'freq-shifter', preset: 'Slow drift', params: { mix: 0.36 } }],
      words: ', drifting slowly out of phase',
    },
    octave: {
      effects: [
        { deviceId: 'octaves', preset: 'Faint octave' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', with a faint octave added',
    },
    sub: {
      effects: [{ deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.35 } }],
      words: ', over a sub octave',
    },
    stop: {
      effects: [{ deviceId: 'stops', preset: 'Pedal under', params: { mix: 0.45 } }],
      words: ', with a pedal stop under it',
    },
    halfspeed: {
      effects: [{ deviceId: 'half-speed', preset: 'Under the mix' }],
      words: ', over the same at half speed',
    },
    common: {
      effects: [
        { deviceId: 'common-tones', preset: 'Hanging notes' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', keeping mostly what hangs on',
    },
    leaf: {
      effects: [{ deviceId: 'seasons', preset: 'Leaf fall' }],
      words: ', in a crumbling autumn',
    },
    winter: {
      effects: [{ deviceId: 'seasons', preset: 'Deep winter' }],
      words: ', in a deep winter',
    },
    shore: {
      effects: [{ deviceId: 'distance', preset: 'Far shore' }],
      words: ', from a far shore',
    },
    stairs: {
      effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
      words: ', from a stone stairwell',
    },
    across: {
      effects: [{ deviceId: 'distance', preset: 'Across the room' }],
      words: ', from across the room',
    },
    throughfog: {
      effects: [{ deviceId: 'distance', preset: 'Through fog' }],
      words: ', through fog',
    },
    nextdoor: {
      effects: [{ deviceId: 'distance', preset: 'Next door' }],
      words: ', from next door',
    },
    slips: {
      effects: [
        { deviceId: 'glitch', preset: 'Rare slips' },
        { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.05 } },
      ],
      words: ', with rare slips of the tape',
    },
    loopbed: {
      effects: [
        { deviceId: 'micro-looper', preset: 'Faint bed' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', over a faint bed of itself',
    },
    afterimage: {
      effects: [{ deviceId: 'tape-loop', preset: 'Faint afterimage' }],
      words: ', over a faint loop of tape',
    },
    static: {
      effects: [{ deviceId: 'radio', preset: 'Hint of static' }],
      words: ', with a hint of radio static',
    },
  },
  phrases: {
    veil: notes(
      '0 3.2 50 0.7, 0 3.2 57 0.5, 0.2 3 65 0.55, 0.4 2.8 72 0.5, 3.4 3.6 45 0.65, 3.4 3.6 59 0.5, 3.5 3.5 64 0.5, 3.6 3.4 67 0.5',
    ),
    lean: notes(
      '0 6.8 50 0.7, 0.2 6.6 57 0.5, 0 2.4 67 0.55, 2.4 2.2 65 0.5, 4.6 2.3 64 0.5, 0.8 2.9 74 0.5, 3.8 3.1 72 0.5',
    ),
    tide: notes(
      '0 2.2 41 0.7, 0 2.2 57 0.5, 0 2.2 64 0.5, 0.1 2.1 72 0.5, 2.3 2.2 43 0.7, 2.3 2.2 59 0.5, 2.3 2.2 62 0.5, 2.4 2.1 71 0.5, 4.6 2.6 45 0.7, 4.6 2.6 60 0.5, 4.6 2.6 62 0.5, 4.7 2.5 67 0.5',
    ),
    lone: notes('0 6.6 50 0.75, 2.6 4 69 0.45'),
    song: notes('0 1.8 62 0.7, 1.8 1 65 0.6, 2.8 1.4 64 0.65, 4.2 0.9 60 0.55, 5.1 2.1 57 0.65'),
    duet: notes(
      '0 2 69 0.65, 2 1 67 0.55, 3 1 65 0.55, 4 1.2 64 0.6, 5.2 2 62 0.6, 0 2 53 0.65, 2 1 52 0.55, 3 1 50 0.55, 4 1.2 57 0.6, 5.2 2 50 0.65',
    ),
    hymn: notes(
      '0 1.6 50 0.65, 0 1.6 57 0.5, 0 1.6 65 0.5, 0 1.6 74 0.6, 1.7 1.6 52 0.65, 1.7 1.6 55 0.5, 1.7 1.6 67 0.5, 1.7 1.6 72 0.6, 3.4 1.6 45 0.65, 3.4 1.6 57 0.5, 3.4 1.6 64 0.5, 3.4 1.6 72 0.55, 5.1 2.2 50 0.7, 5.1 2.2 57 0.5, 5.1 2.2 65 0.5, 5.1 2.2 69 0.55',
    ),
    open: notes('0 6.8 43 0.65, 0.5 6.3 55 0.55, 1 5.8 60 0.5, 1.5 5.3 65 0.5, 2.2 4.6 74 0.45'),
    murmur: notes(
      '0 1.3 57 0.65, 1.5 0.5 57 0.5, 2.1 1.6 60 0.65, 3.8 0.6 59 0.55, 4.5 2.7 55 0.65',
    ),
    cry: notes('0 2.2 69 0.65, 2.2 1.2 76 0.55, 3.4 1 74 0.6, 4.4 0.8 72 0.55, 5.2 2.1 69 0.65'),
    call: notes('0 1.5 38 0.85, 1.7 0.5 45 0.5, 2.3 1.6 43 0.7, 4.2 2.6 36 0.85'),
    walk: notes(
      '0 0.7 38 0.85, 0.9 0.7 41 0.65, 1.8 0.7 43 0.7, 2.7 0.7 45 0.65, 3.6 0.7 43 0.75, 4.5 0.7 40 0.65, 5.4 1.8 38 0.8',
    ),
    heart: notes(
      '0 0.25 38 0.9, 0.35 0.9 38 0.5, 1.7 0.25 38 0.85, 2.05 0.9 38 0.5, 3.4 0.25 36 0.9, 3.75 0.9 36 0.5, 5.1 0.25 41 0.85, 5.45 1.6 41 0.5',
    ),
    ask: notes('0 1.2 41 0.85, 1.3 0.6 40 0.6, 2 2 38 0.8, 4.2 0.7 45 0.65, 5 2.2 43 0.8'),
    pedals: notes('0 3.4 38 0.8, 3.5 3.6 45 0.75'),
    below: notes('0 2.2 50 0.8, 2.4 0.9 48 0.6, 3.4 3.6 45 0.75'),
    tread: notes(
      '0 0.7 50 0.8, 0.9 0.7 48 0.65, 1.8 0.7 45 0.75, 2.7 0.7 47 0.65, 3.6 0.7 48 0.7, 4.5 0.7 52 0.65, 5.4 1.8 50 0.8',
    ),
    ground: notes('0 6.9 38 0.75, 0 3.4 45 0.6, 3.4 3.5 48 0.6, 0.6 2.8 57 0.5, 3.4 3.5 55 0.5'),
    pillar: notes('0 6.9 36 0.75, 0.3 6.6 43 0.6, 2 2.2 60 0.45, 4.3 2.5 62 0.45'),
    hold: notes('0 6.8 45 0.7, 0.5 6.3 52 0.55, 3 3.6 64 0.4'),
    mist: notes('0 6.7 48 0.65, 0.8 5.9 60 0.5, 1.6 5.1 62 0.45, 2.4 4.3 67 0.45'),
    bells: notes(
      '0 0.6 74 0.7, 1.1 0.6 81 0.5, 1.9 0.6 79 0.55, 2.6 0.9 76 0.6, 3.8 1 69 0.7, 4.4 0.8 84 0.4',
    ),
    peal: notes(
      '0 0.4 81 0.6, 0.7 0.4 79 0.6, 1.4 0.4 76 0.6, 2.1 0.4 72 0.65, 2.8 1 69 0.7, 2.8 1 57 0.65, 4.2 0.9 74 0.6, 4.2 0.9 65 0.55, 5.5 1.2 62 0.7, 5.5 1.2 50 0.75',
    ),
    toll: notes('0 1.6 50 0.85, 2.2 1.6 57 0.7, 4.4 1.8 53 0.75, 4.4 1.8 69 0.5'),
    figure: notes(
      '0 0.3 62 0.85, 0.4 0.3 69 0.6, 0.8 0.3 65 0.6, 1.2 0.3 72 0.65, 1.6 0.3 60 0.8, 2 0.3 67 0.6, 2.4 0.3 64 0.6, 2.8 0.3 72 0.65, 3.2 0.3 57 0.85, 3.6 0.3 65 0.6, 4 0.3 69 0.6, 4.4 0.3 76 0.65, 4.8 0.3 60 0.8, 5.2 0.3 64 0.6, 5.6 0.3 69 0.6, 6 0.9 62 0.75',
    ),
    hands: notes(
      '0 0.3 45 0.9, 0.5 0.2 57 0.6, 0.75 0.2 60 0.5, 1.25 0.2 57 0.6, 1.5 0.3 52 0.8, 2 0.2 64 0.55, 2.75 0.2 57 0.6, 3 0.3 45 0.9, 3.5 0.2 60 0.6, 3.75 0.2 62 0.5, 4.25 0.2 57 0.6, 4.5 0.3 50 0.8, 5 0.2 65 0.55, 5.75 0.2 60 0.5, 6 1 45 0.85',
    ),
    drops: notes(
      '0 0.3 69 0.75, 0.9 0.3 72 0.6, 1.4 0.3 65 0.6, 2.6 0.3 76 0.65, 3 0.3 60 0.6, 4.3 0.3 74 0.65, 4.6 0.3 57 0.7, 5.9 0.9 67 0.65',
    ),
    waltz: notes(
      '0 0.9 50 0.8, 0.5 0.3 65 0.5, 1 0.3 69 0.5, 1.5 0.9 52 0.75, 2 0.3 64 0.5, 2.5 0.3 67 0.5, 3 0.9 53 0.8, 3.5 0.3 69 0.5, 4 0.3 72 0.55, 4.5 1.2 57 0.75, 5 0.3 64 0.5, 5.5 0.3 72 0.5, 6 1.2 62 0.65',
    ),
    rain: notes(
      '0 0.2 76 0.6, 0.35 0.2 69 0.5, 0.9 0.2 72 0.6, 1.5 0.2 81 0.4, 1.65 0.2 74 0.55, 2.4 0.2 69 0.65, 2.75 0.2 65 0.5, 3.5 0.2 77 0.5, 3.9 0.2 72 0.6, 4 0.2 64 0.5, 4.8 0.2 79 0.45, 5.1 0.2 69 0.6, 5.9 0.2 74 0.55, 6.1 0.6 62 0.65',
    ),
    storm: notes('0 2.2 43 0.85, 1.8 2.2 50 0.7, 3.6 3.4 57 0.65, 4.8 2.3 45 0.85'),
  },
  directions: [
    {
      id: 'fingertip-pads',
      name: 'Fingertip pads',
      category: 'pad',
      rows: `
Lamp by the well | Fingertip pad | roll=9 scatter=.15 swell=1.2 ring=6 touch=.25 place=.2 cavity=Kettle cavityTune=-5 skin=.08 width=.85 load=.8 | hall | veil | Dull thick skins over large kettles, rolled near the middle into a still round chord
Seven small windows | Fingertip pad | cavity=Shallow cavityTune=7 roll=12 swell=.9 touch=.7 skin=.8 place=.9 ring=3 grain=.15 width=0.8 offCentre=.5 bend=-.6 fall=.8 volume=4.5 | brightplate | lean | Fingertips at the rim of tight frames, light and open, the overtones beating in pairs
Bread and smoke | Fingertip pad | cavityTune=-10 roll=13 scatter=.6 load=.75 grain=.5 ring=1.5 otherSkin=0 swell=.5 thread=.45 bend=-1 fall=.4 offCentre=.35 volume=0 | warm | tide | Restless fingers on wide low pots, short in the ring, a thread and the hands kept in
Skins on the harbour | Fingertip pad | otherSkin=.9 otherTune=-12 roll=10 swell=1.6 ring=8 place=.1 touch=.35 damp=0 offCentre=0 width=1 | undertow 1.mix=.2 1.lowDecay=5 | hymn | Rolled skins that stand quite still, each with a second skin sounding an octave below
Palms under the quilt | Fingertip pad | hand=Palm roll=20 damp=.85 ring=12 swell=.6 cavity=Kettle touch=.3 grain=.2 otherSkin=.5 otherTune=7 scatter=.2 width=.9 bend=3 fall=.5 offCentre=.5 volume=0.5 | pillow | hymn | Soft palms padding on damped kettles with a fifth in each key, close as cloth
Counting sheep slowly | Rain on hide | roll=2.5 scatter=.1 ring=2.5 grain=.2 cavity=Pot touch=.3 swell=.2 bend=1 otherSkin=.6 otherTune=19 offCentre=.1 volume=3 | dotted | open | Fingers that tap a steady slow count on round pots, a twelfth answering each tap
Dew on the gate | Rain on hide | roll=3.5 scatter=.5 ring=4 grain=.1 cavity=Shallow cavityTune=10 skin=.95 place=.95 touch=.8 swell=.4 volume=2.5 | lake | veil | Small bright taps at the very rim of frames, sparse and ringing
Knocks down the lane | Rain on hide | roll=5 scatter=.2 ring=1 grain=.4 cavity=Tube cavityTune=-6 damp=.4 touch=.45 width=.3 offCentre=0 volume=2 | slap | tide | Hollow knocks going round on low tubes, damped and even
Late train far off | Rain on hide | roll=7 scatter=.05 ring=.8 grain=.3 cavity=Kettle load=.6 place=.3 swell=1 bend=0 thread=.4 offCentre=.05 | lowpass | lean | Quick even fingers on half loaded kettles, a soft engine with a thread on it
Thumbs do sums | Fingertip pad | hand=Thumb roll=12 scatter=0 ring=5 swell=.3 place=.6 bend=3 fall=.4 cavityTune=5 otherSkin=0 load=.65 offCentre=0 width=.4 thread=.45 | pair | open | Thumbs falling two a second on small pots, each note sinking a little into a buzz
Hummingbird chord | Frame of sticks | hand=Finger roll=20 scatter=.5 thread=0 touch=.85 skin=1 cavityTune=12 ring=1.2 swell=.8 grain=.3 bend=-1.5 fall=1.2 offCentre=.45 volume=2 | thintail | lean | Fingers trembling as fast as they can on thin frames, all flutter and light
Mosquito net | Frame of sticks | roll=20 thread=.6 scatter=.7 cavity=None place=.8 ring=.6 skin=.6 touch=.4 width=1 bend=-.6 fall=.8 offCentre=.35 volume=6 | glass | mist | Dry sticks whirring on bodiless skins with gut threads lying across them | texture
Cicadas in the eaves | Frame of sticks | roll=14 thread=0 cavity=Tube cavityTune=6 load=1 touch=.35 ring=6 swell=1.4 scatter=.15 offCentre=.6 volume=3 | blurred | hymn | Soft sticks in a long roll on tubes, nasal and even, pairs of overtones beating
Copper in the sun | Frame of sticks | cavity=Kettle cavityTune=16 thread=0 ring=8 skin=.9 place=.75 roll=11 swell=1 load=1 grain=.05 bend=-1 fall=.4 offCentre=.5 volume=4 | glimmer | veil | Small kettles under a stick roll, high and bell bright, blended to one surface
Wicker and bone | Frame of sticks | cavity=Pot cavityTune=9 roll=9 scatter=.35 thread=.55 ring=1 damp=.35 touch=.55 swell=.4 place=.25 load=.7 bend=3 fall=.5 offCentre=.08 volume=5 | wood | tide | Sticks pattering on little pots with a thread across them, dry and knocking
Many slow elbows | Slow palm | hand=Thumb roll=20 swell=2 bend=0 ring=12 place=.05 skin=0 cavity=Kettle otherTune=-5 otherSkin=.7 width=.9 damp=.2 | crypt | open | Thumbs at the dead centre of dull kettles with a fourth below, darkness with a pitch
Clay oven | Slow palm | hand=Thumb roll=16 swell=.8 cavityTune=-14 ring=4 touch=.7 bend=2.5 fall=1.5 otherSkin=0 grain=.5 width=.3 offCentre=.7 thread=.5 volume=-1.5 | clay | tide | Firm thumbs on very large pots, warm and hollow, each key sagging into tune with a buzz
Moth at the shutter | Slow palm | roll=20 scatter=.9 ring=3 cavity=Shallow grain=.8 touch=.65 bend=0 swell=.5 otherSkin=.2 place=.8 load=.75 offCentre=0 thread=.95 volume=3.5 | throughfog | mist | Palms brushing at the rim of frames without a pulse, more skin and gut than note | texture
Cart over planks | Slow palm | roll=13 scatter=.25 ring=12 cavity=Tube swell=.2 grain=.6 touch=.5 bend=5 fall=.25 otherTune=0 thread=.95 width=.75 load=.8 volume=-3 | gallop | hymn | Palms rolling unevenly on tubes, every fall a bump that bends to its note and rattles
Grain store | Slow palm | roll=17 scatter=.05 ring=9 cavity=Pot cavityTune=3 load=1 bend=0 grain=.05 swell=1.2 otherTune=24 otherSkin=.8 skin=.8 width=.85 offCentre=.1 volume=1 | silent | lean | Even palms on pots, dry of slap, with second skins two octaves up taking up the ring
Paper walls | Dry hand keys | roll=10 scatter=.4 swell=1 ring=12 damp=0 grain=.2 bend=0 touch=.45 width=0.75 offCentre=.35 volume=6 | across | veil | Fingers rolling on skins with no body, thin and wide and faintly breathing
Tent at noon | Dry hand keys | hand=Thumb roll=20 swell=1.2 ring=12 damp=0 skin=.9 touch=.8 place=.9 width=.5 bend=0 thread=.4 volume=2 | shade | hymn | Thumbs on stretched skins with no body, at the rim, lean and papery with a thread astir
Nobody in the room | Dry hand keys | hand=Brush roll=3 swell=2 ring=12 damp=0 grain=.15 scatter=.3 otherSkin=.9 otherTune=12 offCentre=.5 volume=2.5 | breathroom | open | Brushes circling slowly on bodiless skins, with only an octave skin to fill them
String under dust | Dry hand keys | roll=15 scatter=.1 swell=.6 ring=5 damp=0 load=1 skin=1 touch=.9 place=.35 offCentre=0 width=.2 bend=0 volume=4 | chorus | tide | A hard fast roll on loaded skins with no body at all, close to a bowed string | string
Flour on the drumhead | Dry hand keys | roll=18 scatter=1 swell=1.5 ring=2 damp=.1 grain=.9 skin=.3 bend=0 load=.85 volume=6 | airy | mist | Fingertips loose in time on dead skins with no body, a cloud of small dry touches | texture
Tunnels of reed | Fingertip pad | cavity=Tube cavityTune=-12 roll=12 swell=1.5 load=1 touch=.5 ring=5 place=.4 skin=.7 otherSkin=0 width=1 offCentre=.1 volume=0 | chapel | hymn | Long low tubes under a steady roll, held on a closed vowel
Open mouths | Fingertip pad | cavity=Tube cavityTune=14 roll=16 swell=.7 load=1 touch=.75 ring=2.5 place=.55 scatter=.2 otherSkin=.4 otherTune=12 width=.9 offCentre=0 | oo | veil | Short tubes pulled high into a wide bright vowel, rolled quick and even
Reed left in the rain | Fingertip pad | cavity=Tube hand=Brush roll=3 swell=1.8 ring=7 cavityTune=2 scatter=.2 grain=.25 skin=.5 width=.15 load=.65 bend=-1.2 fall=.6 volume=2 | section | lean | Brushes turning on tubes, between a breath and a pipe | wind
Cellar vowels | Fingertip pad | cavity=Tube cavityTune=-18 hand=Thumb roll=20 swell=1 ring=10 otherSkin=1 otherTune=5 place=.2 touch=.55 width=.4 bend=-.6 fall=.8 offCentre=0 thread=.85 | humming | tide | Thumbs on the longest tubes, fourths answering as loudly, a low buzzing talk with no words
Boat horn choir | Fingertip pad | cavity=Tube roll=20 scatter=0 swell=.4 ring=3 cavityTune=-3 load=1 skin=1 touch=1 place=.3 offCentre=0 grain=0 width=.3 | darkhall | hymn | The hardest even roll on tubes, every stroke in step, until it holds like a horn | organ
Willow over water | Brushed night | roll=2 swell=1.4 scatter=.2 ring=4 grain=.3 cavity=Kettle otherTune=12 skin=.4 cavityTune=4 width=.75 bend=-1 fall=.3 volume=4.5 | currents | lean | Brushes turning slowly over kettles, soft in the middle and slow to stop
Swept floors | Brushed night | roll=9 swell=.5 scatter=.3 ring=1.5 grain=.8 cavity=Pot otherSkin=0 touch=.5 place=.7 width=.85 bend=-.5 fall=.2 offCentre=.45 volume=5 | halfspeed | tide | Brush strokes nearly once a second on pots, dusty, with a chord swept along in them
Silk over a bowl | Brushed night | roll=5 swell=2.5 scatter=.3 ring=12 grain=.05 cavity=Kettle cavityTune=12 load=1 otherTune=19 otherSkin=.8 skin=.8 bend=-1.6 fall=.6 offCentre=0 volume=3 | bowlhalo | open | Bristles turning slowly on small kettles, nearly pure, with a twelfth in bloom above
Snow against glass | Brushed night | roll=14 swell=.8 scatter=.9 ring=2 grain=1 cavity=Shallow cavityTune=14 otherSkin=.1 touch=.9 skin=.9 width=1 load=.78 bend=-.7 fall=.12 volume=4.5 | winter | mist | Hissing scattered bristles on small frames, cold and bright with little tone | texture
Reeds at low tide | Brushed night | roll=5 swell=1.2 scatter=.5 ring=9 cavity=Tube cavityTune=-8 otherTune=-12 otherSkin=.7 place=.2 touch=.2 grain=.35 width=.5 load=.82 bend=-1.2 fall=.3 offCentre=.5 volume=3.5 | surf | hold | Soft brushes over low tubes with an octave below, swaying and grey | drone
Out of nothing | Fingertip pad | swell=5 roll=14 ring=12 scatter=.8 offCentre=1 load=.8 cavity=Kettle skin=.7 width=0.85 damp=0 bend=3 fall=.5 volume=3.5 | nave | lone | A roll that takes five seconds to come, every overtone split and drifting
Fifth of evening | Paired skins | otherTune=7 roll=14 swell=2.5 ring=10 cavity=Kettle touch=.6 place=.8 offCentre=.1 grain=0 bend=-1.5 fall=1.2 volume=-1.5 | longplate | veil | Kettles that rise over two seconds with their own fifth, smooth and tall
Grass after heat | Paired skins | otherTune=5 otherSkin=.6 roll=6 swell=1.5 ring=3 cavity=Shallow skin=.05 touch=.05 scatter=.7 bend=-.6 fall=.8 damp=.35 volume=6 | breeze | tide | Soft dull fingers on frames with a fourth in them, uneven as wind on grass
Moth between lamps | Paired skins | otherTune=1 otherSkin=.5 roll=12 swell=1 ring=5 load=1 cavityTune=6 offCentre=.9 width=.9 bend=-1 fall=.4 thread=.8 volume=4.5 | harm | lean | Small pots with a second skin a semitone off, shivering between the two, gut fluttering
Tall grey doors | Paired skins | otherTune=24 otherSkin=1 hand=Stick roll=13 swell=2 ring=7 cavity=Pot cavityTune=-9 touch=.3 skin=.9 bend=3 fall=.5 volume=2.5 | common | hymn | Soft sticks on large pots, two octaves of sympathy standing over each key
Counting the streetlamps | Kettle bells | roll=8 swell=1 scatter=.3 ring=6 touch=.4 cavityTune=6 otherSkin=.5 otherTune=12 bend=-1.5 fall=1.2 thread=.6 volume=0.5 | star | veil | A light stick roll on threaded kettles that never quite settles, with octaves behind
Thaw on the roof | Plucked skin | roll=6 scatter=.6 swell=.4 ring=3 touch=.6 cavity=Pot cavityTune=12 bend=1 offCentre=.4 width=1 volume=3.5 | seven | open | Nail-light fingers on tiny pots at the rim, dripping into a chord
Warm iron gate | Speaking bass | roll=15 swell=.7 bend=0 scatter=.3 ring=9 cavity=Shallow cavityTune=-12 damp=0 touch=.9 width=1 skin=.9 load=.75 thread=.65 | iron | hymn | Firm thumbs at work on wide low frames with loose gut, driven a little
Over the garden wall | Singing rim | hand=Finger roll=13 scatter=.4 swell=1.5 grain=.2 ring=7 place=1 offCentre=1 cavityTune=-9 cavity=Shallow width=.9 bend=-.6 fall=.8 damp=.5 volume=5 | far | lean | Fingertips on the very edge of frames, the clear thin modes beating
Crowd in slippers | Bare thunder | hand=Finger load=.5 roll=12 scatter=1 swell=.8 bend=0 ring=1.5 grain=.7 otherTune=12 cavity=Pot offCentre=.5 width=.4 volume=6 | grain | tide | Loose fingertips on half loaded pots, a murmuring crowd of them around each key
Fogged pane | Kettle bells | hand=Finger swell=.6 ring=12 touch=.3 cavityTune=0 place=.2 otherSkin=.6 otherTune=12 scatter=.4 skin=.5 damp=.1 volume=-3.5 | breath | lean | A few loose fingertips to a key on wide kettles, their landing hidden, left to sink away
Let the chord settle | Talking drum | swell=.3 bend=-2 fall=1.6 ring=12 damp=0 load=1 cavityTune=4 touch=.6 otherSkin=.7 otherTune=12 width=.75 offCentre=.08 volume=-6 | slowbow | hymn | One thumb to a key on tubes, the chord swelling as it climbs the last step into tune
Stones left in a ring | Fingertip pad | hand=Stick roll=0 scatter=0 swell=.12 ring=12 load=.65 cavityTune=-5 skin=.8 touch=.35 damp=0 otherSkin=.5 otherTune=5 offCentre=.7 thread=.65 | pedal | veil | Soft single sticks on half gathered pots, gut loose on them, a fourth taking up the ring
Ash and ember | Paired skins | roll=0 swell=1.1 ring=12 otherTune=-12 cavity=None skin=.9 touch=.8 place=.6 damp=0 volume=-3.5 | fuzzroom | tide | Bodiless skins struck once and faded in, and under each an octave skin that stays
Asking the dark | Slow palm | roll=0 swell=.4 ring=12 bend=9 fall=2.5 cavity=Kettle otherSkin=1 otherTune=0 place=.3 touch=.6 grain=.1 width=.85 offCentre=.05 volume=-3 | bowed | open | Single palms on kettles whose notes lean far over and take seconds to stand up straight
`,
    },
    {
      id: 'speaking-basses',
      name: 'Speaking basses',
      category: 'bass',
      rows: `
Says it once | Speaking bass | bend=7 fall=.25 ring=7 cavityTune=-7 damp=.45 otherSkin=0 grain=.2 touch=.9 skin=.3 width=.05 thread=.35 load=.8 offCentre=.45 volume=0 | bare | ask | A hard thumb on a large pot, starting well above the key and dropping onto it with a buzz
Word from the cellar | Speaking bass | bend=2.5 fall=.5 cavity=Kettle ring=12 touch=.4 place=.2 cavityTune=-8 otherSkin=.4 otherTune=12 load=.75 thread=.7 volume=0 | murk | call | Dark thumbs on large threaded kettles, sagging slowly into tune, with an octave skin after
Uncle clears his throat | Speaking bass | bend=12 fall=.06 cavity=Tube ring=3 touch=.9 cavityTune=5 grain=.7 damp=.5 load=.7 offCentre=.35 thread=.75 volume=-3 | combo | heart | A hard thumb on a short tube, diving a long way in an instant, skin and gut in the voice
Rumour from upstairs | Speaking bass | bend=3 fall=.1 cavity=Shallow ring=9 place=.8 skin=.95 touch=.85 width=.6 cavityTune=-14 offCentre=.05 volume=2.5 | stairs | walk | Thumbs near the rim of wide frames, lean and clear, a quick dip on every note
Full stop | Speaking bass | bend=8 fall=.03 cavity=Tube ring=4 damp=.8 skin=.05 touch=.6 load=.5 grain=.6 cavityTune=-10 volume=1 | dead | heart | A thumb on a dull low tube that is damped at once, a click with a pitch inside
Where is the road | Talking drum | bend=-7 fall=.3 ring=8 damp=.3 cavityTune=-6 otherSkin=.4 touch=.95 place=.75 otherTune=19 width=0 load=.85 offCentre=.08 thread=.75 volume=-6 | reel | tread | Thumbs near the rim of threaded tubes that begin far below and slide up like a question
Elder at the fire | Talking drum | bend=-5 fall=.9 cavity=Pot cavityTune=-9 touch=.6 otherTune=-12 otherSkin=.6 width=.1 load=.65 offCentre=.7 thread=.5 volume=-4 | giant | below | Slow soft thumbs on large threaded pots that climb for a second, with an octave under them
Frog on the step | Talking drum | bend=-7 fall=.05 cavity=Pot cavityTune=8 ring=3 damp=.4 touch=1 grain=.4 load=.78 thread=.75 volume=1.5 | slap | walk | Small threaded pots struck hard, each gulping up into its note at once
Rising water table | Talking drum | hand=Palm bend=-3 fall=2 cavity=Kettle ring=12 swell=.15 touch=.9 otherSkin=.9 otherTune=0 skin=.8 width=.2 load=.82 offCentre=.05 thread=.6 volume=-5 | latefdn | pedals | Palms on kettles with a loose thread, the note still rising when the second skin comes in
Asked about the rain | Talking drum | hand=Finger bend=-4 fall=.15 cavity=Shallow cavityTune=-10 scatter=.5 skin=.8 ring=6 width=.15 load=.75 offCentre=.45 damp=.15 thread=.55 volume=-2.5 | lake | ask | Loose fingertips that fall one after another on low frames, tug upward and rattle
Flat hands on a sack | Slow palm | roll=0 bend=2.5 fall=.05 ring=6 damp=.65 grain=.5 cavity=Pot cavityTune=-12 otherSkin=0 load=.7 width=.3 thread=.75 volume=-3 | crunch | heart | Palms dropped flat on large pots, more weight than note, short, with a thread under the hand
Heel on the boards | Slow palm | roll=0 bend=5 fall=.08 ring=12 cavity=Tube cavityTune=-4 touch=.8 grain=.8 otherSkin=.3 otherTune=12 thread=.85 load=.6 width=0 offCentre=.35 volume=-4.5 | wood | walk | Palms slapped on tubes, broad and hollow, the note behind the slap and a thread behind both
Barrel going round | Slow palm | roll=0 bend=0 ring=12 cavity=Kettle grain=.05 place=.1 skin=.8 touch=.5 otherSkin=.8 otherTune=12 damp=0 load=.7 offCentre=.5 thread=.9 | drumrotor | below | Palms on threaded kettles without any slap, hollow lows with an octave over them
Bolt of wet cloth | Slow palm | roll=0 bend=7 fall=.3 ring=12 cavity=Shallow skin=1 place=.9 grain=.3 otherSkin=.5 otherTune=19 width=.1 load=.85 thread=.55 | slack | call | Palms slapped at the rim of frames, bending down through a thread, a twelfth left hanging
Behind the barn | Slow palm | roll=0 bend=-2 fall=.2 ring=8 cavity=None grain=.9 touch=.35 load=.5 width=.6 otherSkin=.4 otherTune=7 offCentre=.08 volume=0 | nextdoor | call | Palms on half loaded skins with no body, a dull smack and a fifth that follows
Wrist on the skin | Speaking bass | hand=Finger bend=.5 fall=.05 ring=2 touch=.1 place=0 skin=.2 cavity=Pot damp=.8 cavityTune=-6 otherSkin=0 load=.65 offCentre=.7 volume=2.5 | tamed | heart | Soft fingertips near the middle of dull pots, round and very short
Small of the back | Speaking bass | hand=Finger bend=1.5 fall=.1 ring=12 touch=.55 cavity=Kettle damp=0 skin=.35 otherSkin=.3 otherTune=7 swell=.03 | warm | walk | Fingers on kettles, long and even, with a fifth close under the surface
Nine in the evening | Speaking bass | hand=Finger bend=3 ring=1.2 touch=.8 cavity=Tube cavityTune=10 damp=.75 skin=.9 place=.45 fall=.04 offCentre=.05 volume=2 | deck | walk | Firm fingers on short tubes, stopped quickly, a nasal bass with the edge left on
Warm side of the bed | Speaking bass | hand=Finger bend=-1 fall=.6 ring=8 touch=.03 cavity=Tube cavityTune=-14 load=1 place=.3 swell=.08 damp=.1 offCentre=.1 volume=-2 | octave | pedals | Barely touched long tubes, an even low tone that eases up into tune
Tar and rope | Speaking bass | hand=Finger scatter=.8 bend=4 fall=.15 ring=5 touch=.5 cavity=Pot grain=.9 thread=.75 load=.8 roll=9 volume=-3 | cassette | call | Loose fingers rolling on pots, with a rope of thread on the skin
Fence wire at dusk | Kettle bells | cavity=Shallow cavityTune=-12 ring=9 touch=.85 place=.85 bend=.5 fall=.05 offCentre=0 load=1 damp=.1 thread=.4 | triode | walk | Sticks near the rim of wide frames, a wiry bass whose harmonics all stay, gut on the skin
Chain locker | Kettle bells | cavity=Tube cavityTune=-10 ring=12 touch=.6 place=.4 load=.75 offCentre=.8 grain=.4 otherSkin=.5 otherTune=12 thread=.4 bend=-.8 fall=.05 | iron | call | Sticks on long threaded tubes, overtones split in pairs, slow heavy beating
Short ladder | Kettle bells | cavity=Pot cavityTune=-2 ring=1 touch=.5 place=.2 damp=.75 skin=.6 bend=2.5 fall=.03 grain=.5 load=.7 volume=3.5 | box | walk | Sticks on damped pots, quick and knocking, one clean low note to a blow
Quarry bell | Kettle bells | cavityTune=-12 ring=12 touch=.4 load=.5 place=.5 offCentre=.6 bend=-1 fall=.8 otherSkin=.5 otherTune=7 damp=.2 thread=.65 volume=-3 | cave | toll | Sticks on huge half loaded kettles with gut across, a low sour toll with a fifth in it | bell
Loft over the stable | Kettle bells | cavity=None ring=6 touch=.35 place=.3 load=1 offCentre=.1 damp=.3 skin=1 otherSkin=.9 otherTune=0 bend=2.5 fall=.03 | hollow | ask | Soft sticks on skins with no body, a twin skin filling the bottom
Hum in the beam | Hummed voice | cavity=Pot cavityTune=-8 swell=.06 touch=.5 roll=0 scatter=.1 ring=1.5 width=.2 grain=.1 load=.78 volume=-4.5 | middle | walk | A low hum set straight into wide pots, steady and round with a quick start
Ice house at noon | Hummed voice | cavity=Shallow cavityTune=-18 swell=.3 touch=.9 scatter=.1 skin=.9 grain=.4 thread=.85 width=.5 load=.82 bend=-1.6 fall=.6 offCentre=.35 roll=15 ring=1 volume=6 | cupboard | pedals | A buzzing hum shaken fast against low frames with a thread touching, all overtones | drone
Monk with a cold | Hummed voice | cavity=Tube cavityTune=-4 swell=.12 touch=1 place=.2 bend=3 fall=.2 scatter=.4 grain=.5 thread=.6 load=.75 offCentre=.5 roll=9 volume=-3 | monks | call | A hard nasal hum into tubes that dips into every note and wobbles
Furnace room | Hummed voice | cavity=Kettle swell=.5 touch=.4 roll=6 scatter=.2 otherSkin=.8 otherTune=12 ring=5 grain=.2 width=.2 load=.7 bend=-.7 fall=.12 thread=.7 volume=2 | shaft | below | A dark hum shaking three times a second over threaded kettles, an octave skin glowing above
Bee in a jug | Hummed voice | cavity=Pot cavityTune=12 swell=.03 touch=.7 roll=18 scatter=.1 load=.8 ring=.6 grain=.6 width=.15 bend=-1.2 fall=.3 offCentre=.08 thread=.4 volume=0 | clay | ask | A hum chattering fast into small threaded pots, short and buzzing
Door on its hinge | Rubbed moan | swell=.2 bend=-9 fall=.4 cavity=Pot cavityTune=-8 ring=2 touch=.6 place=.4 scatter=.2 width=.3 offCentre=0 roll=9 volume=2 | room | ask | A finger dragged to and fro on pots that groan up a long way to the key
Hull against the quay | Rubbed moan | swell=.6 bend=2.5 fall=1 cavity=Kettle ring=12 touch=.5 place=.2 cavityTune=-10 otherSkin=.8 otherTune=-12 grain=.1 width=0 volume=4 | shore | below | Soft rubbing at the middle of large kettles, leaning down into tune over an octave skin
Ox in the lane | Rubbed moan | swell=.1 bend=5 fall=.3 cavity=Tube cavityTune=-12 touch=.8 place=.5 ring=4 load=1 scatter=.1 grain=.5 offCentre=0 volume=0 | murk | call | Long tubes rubbed hard, lowing from above down to the note
Zip in the canvas | Rubbed moan | swell=.02 bend=0 cavity=Shallow roll=14 touch=.9 ring=.6 grain=.8 place=.9 skin=.9 scatter=.3 width=.1 offCentre=.45 volume=4.5 | thin | walk | A finger chattering once a second at the rim of frames, dry and rasping
Wet thumb on slate | Rubbed moan | swell=.35 bend=-2 fall=.2 cavity=None touch=.45 ring=8 load=1 skin=.7 grain=.3 otherSkin=1 otherTune=12 width=.2 volume=0 | halo | ground | Skins with no body rubbed slowly, an octave skin humming along
Convoy at two | Fingertip pad | roll=18 swell=.15 ring=1 cavityTune=-7 scatter=.2 touch=.6 place=.3 grain=.3 bend=0 width=.3 offCentre=0 | deep | call | Fast even fingers on low pots, a bass with a motor in it
Slow paddle wheel | Fingertip pad | hand=Thumb roll=20 swell=.05 ring=2 cavity=Kettle bend=6 fall=.2 scatter=.1 touch=.6 otherSkin=.3 otherTune=0 thread=.4 width=.15 load=.85 offCentre=.5 volume=-0.5 | trail | pedals | Thumbs coming round three times a second on threaded kettles, each one ducking in pitch
Cart tracks in gravel | Fingertip pad | hand=Stick roll=16 swell=.1 ring=.8 cavity=Tube cavityTune=-6 scatter=.6 touch=.4 grain=.6 width=.5 load=.55 bend=3 fall=.5 thread=.75 volume=3 | glaze | walk | Sticks crowding on threaded tubes, rough and short, the note under a grind
Night ferry engine | Fingertip pad | roll=14 swell=.4 ring=5 cavity=Kettle cavityTune=-14 otherSkin=1 otherTune=7 touch=.55 scatter=.05 load=1 width=.3 offCentre=.1 thread=.55 volume=-3 | bandpulse | call | A still roll on the largest kettles, a fifth as loud as the key and a rattle in the plates
Row of bollards | Fingertip pad | hand=Palm roll=20 swell=.02 ring=12 cavity=Pot scatter=0 bend=3 fall=.1 grain=.4 otherSkin=.2 load=.6 width=0 offCentre=.7 thread=.85 volume=-2 | dotted | pillar | Palms dropping in strict time on threaded pots, each fall leaning into tune
Floor of the lake | Kettle bells | hand=Finger cavityTune=-10 ring=12 touch=.4 place=.05 skin=.5 bend=0 swell=.1 load=1 offCentre=0 otherSkin=0 thread=.3 volume=-2 | sub | call | Fingertips at the centre of the largest kettles, a soft low tone and very long
Moon over the dyke | Kettle bells | hand=Thumb cavityTune=2 ring=12 touch=.75 place=.6 skin=.8 bend=1 fall=1.5 otherSkin=.6 otherTune=24 offCentre=.5 load=.65 damp=.35 thread=.75 volume=-3 | thintail | call | Thumbs out from the middle of kettles, buzzing as they open, a far skin two octaves up
Timber keel | Bare thunder | hand=Thumb load=1 roll=0 scatter=0 swell=.04 bend=2.5 fall=.3 cavity=Tube grain=.3 otherTune=-12 otherSkin=.9 offCentre=0 touch=.7 thread=.75 | firm | tread | Thumbs on threaded tubes with an octave skin below, broad and heavy
Thunder kept in a jar | Bare thunder | hand=Finger load=.35 roll=0 scatter=.2 swell=.02 bend=10 fall=.15 cavity=Pot cavityTune=6 ring=4 otherSkin=0 grain=.4 width=.1 damp=.5 thread=.4 volume=2 | gated | heart | Fingers on lightly loaded pots, a sour bass that drops in pitch, buzzes and is gone
Lidless kettle | Plucked skin | cavity=Kettle cavityTune=4 ring=7 bend=3 fall=.2 touch=.6 place=.5 otherSkin=.5 otherTune=7 skin=.6 width=.2 load=.78 offCentre=0 thread=.4 volume=0 | darkecho | ask | Fingers on middling kettles, a soft dip at each start, a fifth and a fine buzz held after it
Gut line on a tube | Plucked skin | cavity=Tube cavityTune=-8 ring=8 thread=.4 touch=.8 bend=1 fall=.05 place=.6 otherSkin=0 damp=.1 width=.15 load=.82 offCentre=.45 | reel | walk | Tubes flicked hard with a gut thread on the skin, which buzzes while the note is loud
Loose tooth | Plucked skin | hand=Thumb cavity=Pot cavityTune=-4 ring=5 thread=.8 touch=.6 bend=4 fall=.15 damp=.2 place=.4 width=.3 load=.75 roll=14 | valve | ask | Thumbs twice a second on pots with the thread close, every note rattling as it falls
Radio in the shed | Speaking bass | hand=Stick thread=.8 cavity=None ring=10 touch=.4 bend=0 damp=.2 skin=.9 otherSkin=.4 otherTune=12 width=.4 load=.7 offCentre=.35 | pillow | walk | Sticks on threaded skins with no body, thin and wiry, an octave humming behind
Paper in the spokes | Thread drone | hand=Finger roll=10 swell=.05 ring=1.5 thread=.6 cavity=Pot cavityTune=4 otherSkin=0 scatter=.1 touch=.7 width=0 load=.85 bend=-1.5 fall=1.2 offCentre=.5 volume=3.5 | tin | call | A finger roll on small threaded pots, a bass that flaps
Bus at the terminus | Thread drone | swell=.4 thread=.5 cavity=Kettle cavityTune=-3 touch=.75 roll=4 scatter=.3 ring=3 otherTune=0 width=.1 load=.65 bend=-.5 fall=.12 damp=.15 volume=3 | losing | call | A firm hum on kettles with a thread half on, trembling slowly
`,
    },
    {
      id: 'rubbed-moans',
      name: 'Rubbed moans',
      category: 'voice',
      rows: `
Goats called home | Rubbed moan | bend=-7 fall=.5 swell=.4 cavityTune=2 ring=4 touch=.3 scatter=.2 otherSkin=0 skin=.35 offCentre=.05 width=.05 volume=3 | valley | cry | A finger drawn over tubes that sweeps up into every note and stays there, plain
Pacing the landing | Rubbed moan | bend=3 fall=1.8 swell=1 cavityTune=-9 touch=.3 scatter=.8 place=.3 otherSkin=.4 otherTune=12 width=.3 offCentre=.08 volume=5 | hall | murmur | Dark rubbed tubes that lean down to the note for seconds and waver when they get there
Old dog dreaming | Rubbed moan | bend=-2 fall=.15 swell=.15 cavityTune=-16 ring=2 grain=.95 touch=.45 scatter=.6 roll=16 volume=5 | booth | murmur | Dry rubs on very long tubes, one after another, half breath, close by
Sung through a fence | Rubbed moan | bend=0 swell=.7 cavityTune=10 touch=.8 load=1 skin=.9 scatter=.1 grain=.05 width=.1 offCentre=0 volume=3 | shadow | song | Small tubes rubbed firmly, nasal and dead straight
First word of the day | Rubbed moan | bend=-12 fall=1.2 swell=.8 cavityTune=5 ring=9 otherSkin=.7 otherTune=7 place=.8 width=.45 offCentre=0 volume=2.5 | oo | duet | Tubes that begin far under the note and climb for a second, with a fifth kept in the far skin
Rim of the moon | Singing rim | roll=6 swell=2 place=.95 cavityTune=14 skin=1 otherSkin=.5 otherTune=19 scatter=.05 width=1 volume=2 | bowlhalo | lean | Fingers circling small kettles every two seconds, high, a twelfth with each | pad
Wineglass from below | Singing rim | roll=10 swell=.8 cavityTune=-4 place=.7 touch=.3 offCentre=.1 load=.95 otherSkin=0 grain=.2 width=.9 bend=-1.6 fall=.3 volume=6 | smallplate | cry | Kettles rubbed softly round near the rim, hollow, a swell to each turn
Slow skater | Singing rim | roll=12 swell=1.2 cavityTune=4 scatter=.4 offCentre=.8 ring=12 width=1 otherSkin=.3 otherTune=7 load=.78 volume=-9 | limitroom 1.gain=16 | duet | Kettles circled once a second, the tone leaning out and in, pairs beating
Milk in a blue jug | Singing rim | roll=0 swell=1.5 cavityTune=0 place=.5 touch=0 skin=.05 bend=1 fall=.6 otherSkin=.8 otherTune=12 width=.9 load=.8 volume=0.5 | warmbody | hymn | The gentlest rubbing on dull kettles with an octave skin, white and soft | pad
Aurora on tin | Singing rim | roll=5 swell=3 cavity=Shallow cavityTune=16 place=1 skin=1 touch=.7 width=0.7 offCentre=.5 load=.75 bend=-.7 fall=.2 volume=5 | spiral | mist | Rims of the smallest frames rubbed in slow turns, a thin high shine | texture
Ground giving way | Rubbed moan | cavity=Pot cavityTune=-14 bend=-5 fall=3 swell=1.5 touch=.5 ring=10 otherTune=-12 otherSkin=.9 width=.2 offCentre=.45 volume=4.5 | cave | below | Huge pots rubbed until they groan, climbing for three seconds over an octave below | bass
Bear in the bracken | Rubbed moan | cavity=Pot cavityTune=-6 bend=4 fall=.2 swell=.1 touch=.75 grain=.7 ring=3 scatter=.7 load=.6 roll=9 place=.8 otherSkin=.5 otherTune=7 width=.15 volume=3 | shade | murmur | Rough rubs on wide pots, turning every second and a half, that drop a little and grumble
Potter's wheel | Rubbed moan | cavity=Pot roll=10 scatter=.1 swell=.5 bend=0 touch=.35 load=1 cavityTune=4 grain=.15 otherSkin=.2 offCentre=.35 volume=6 | circle | song | A wet finger on turning pots, the tone coming round nearly once a second
Yawn at the window | Rubbed moan | cavity=Pot cavityTune=12 bend=-9 fall=.7 swell=.3 touch=.2 skin=.2 ring=5 scatter=.2 width=.05 offCentre=.5 volume=1.5 | roundvowel | cry | Small dull pots that yawn up into the note with hardly any overtone
Two in one blanket | Rubbed moan | cavity=Pot cavityTune=0 swell=.9 bend=1 fall=.3 otherSkin=1 otherTune=5 offCentre=.7 place=.6 touch=.55 width=.3 volume=3.5 | asleep | duet | Pots rubbed warm with a far skin a fourth up, as loud as the near one, beating quietly
Gull over the weir | Rubbed moan | cavity=Shallow cavityTune=9 bend=5 fall=.25 swell=.2 touch=.6 place=.8 skin=.7 ring=3 width=.45 offCentre=.08 volume=5.5 | breeze | cry | Frames rubbed at the edge, a thin cry that falls onto its note
Chalk on a warm wall | Rubbed moan | cavity=Shallow cavityTune=-8 bend=0 swell=.4 grain=1 touch=.5 ring=1 skin=.3 otherSkin=0 load=.6 width=.95 offCentre=.7 roll=18 volume=6 | cassette 1.output=2 | murmur | Dry fingers scrubbing dull frames, as much scrape as note | texture
Cloth fiddle | Rubbed moan | cavity=Shallow cavityTune=2 bend=-1 fall=.1 swell=.12 load=1 touch=.65 place=.35 ring=2 offCentre=0 scatter=.1 volume=2 | latevib | song | Loaded frames rubbed evenly, every harmonic in line, like a rough small bow | string
Kite line aloft | Rubbed moan | cavity=Shallow cavityTune=18 bend=-3 fall=2 swell=1.5 place=.8 touch=.4 ring=10 otherSkin=.6 otherTune=24 width=1 offCentre=0 volume=6 | breath | lone | The smallest frames, rubbed lightly until a line of high tone holds and wanders up | wind
Field of wires | Rubbed moan | cavity=Shallow cavityTune=-14 roll=7 scatter=.9 swell=1 thread=1 offCentre=1 width=1 ring=8 touch=.35 skin=.35 volume=1 | limitroom 1.gain=13 | mist | Big frames rubbed unevenly with gut on the skin, buzzing and never still | texture
Thread of breath | Dry hand keys | hand=Rub swell=.8 grain=.3 touch=.3 ring=12 damp=0 bend=-2 fall=.3 load=1 place=.4 width=.3 volume=5 | stairs | song | A finger on a skin with nothing under it, thin and near as breath
Bowstring at rest | Dry hand keys | hand=Rub swell=.25 grain=.15 touch=.4 ring=6 damp=0 bend=0 load=1 skin=.6 place=.6 offCentre=.05 volume=1.5 | doubled | duet | Bodiless skins rubbed firmly, bright and even, like a bow drawn level | string
Lint | Dry hand keys | hand=Rub swell=1.4 grain=.9 touch=.04 ring=3 damp=.2 skin=.1 scatter=.9 bend=0 roll=3 load=.7 offCentre=.45 | veil | mist | The palest rub on dull bare skins, mostly skin noise with a note caught in it | texture
Door to the attic | Dry hand keys | hand=Rub swell=.1 bend=-12 fall=.3 touch=.4 ring=5 damp=.3 load=.7 otherSkin=.5 otherTune=-12 volume=2.5 | latefdn | cry | Skins with no body that squeak up from far below, an octave skin under to steady them
Dune grass at dusk | Dry hand keys | hand=Brush roll=6 swell=.9 ring=9 damp=0 grain=.5 bend=0 place=.9 skin=.8 width=0.8 otherSkin=.7 otherTune=7 load=.85 offCentre=.35 volume=2.5 | surf | hold | Bristles on bodiless skins with fifths behind them, dry and leaning | wind
Slow saw in the yard | Rubbed moan | roll=16 scatter=.2 swell=.3 cavity=Pot bend=2.5 fall=.1 touch=.6 ring=1 place=.5 grain=.4 width=.25 offCentre=.5 volume=4.5 | drumrotor | duet | Pots sawn at a little more than once a second, the note dipping with each stroke | string
Oars in the dark | Rubbed moan | roll=20 scatter=0 swell=1 cavity=Kettle bend=-4 fall=.3 touch=.45 ring=4 load=1 width=.4 volume=5.5 | losing | hymn | Kettles rubbed in strict turns, a tone that bows to itself again and again | pad
Crickets in the thatch | Rubbed moan | roll=20 scatter=.6 swell=.2 cavity=Shallow cavityTune=15 touch=.4 ring=1 skin=.5 grain=.3 offCentre=.1 volume=1.5 | limit 1.gain=15 | drops | Small frames chirped with a finger, dry and scattered | texture
Cradle on its runners | Rubbed moan | roll=8 scatter=.05 swell=.6 cavity=Tube cavityTune=-5 bend=-1 fall=.5 otherSkin=.8 otherTune=0 touch=.25 width=.9 offCentre=.7 volume=6 | sea | song | Tubes rubbed to and fro with a twin skin behind, rocking
Sandpaper waltz | Rubbed moan | roll=14 scatter=.3 swell=.05 cavity=None touch=.7 grain=.9 ring=2 load=.5 place=.7 width=1 volume=2.5 | pressing | waltz | Dry circling on half loaded skins with no body, scratchy and light | texture
Glacier lip | Rubbed moan | swell=5 cavity=Kettle cavityTune=-12 ring=12 touch=.4 scatter=.9 offCentre=1 load=.7 otherSkin=.9 otherTune=-12 width=1 volume=6 | nave | hold | Enormous kettles rubbed so slowly that they take five seconds to groan | drone
Lanterns on the canal | Rubbed moan | swell=2 cavity=Tube cavityTune=7 ring=8 bend=-1 fall=2 touch=.5 scatter=.4 otherSkin=.6 otherTune=12 load=1 width=.75 offCentre=0 roll=4 volume=2.5 | glimmer | veil | Tubes coming up over two seconds in slow turns, octaves alight in the far skins | pad
Pass the salt | Rubbed moan | swell=1.8 cavity=Pot cavityTune=-3 touch=.65 place=.2 bend=2.5 fall=2.5 scatter=.2 otherSkin=.5 otherTune=7 skin=.8 volume=-0.5 | rotor | tide | Pots swelling with a fifth inside, each sinking slowly from a little above | pad
Curtain before the act | Rubbed moan | swell=3 cavity=Kettle cavityTune=6 touch=.02 place=.1 skin=0 bend=0 ring=6 scatter=.3 otherSkin=.2 width=.85 offCentre=.45 volume=0.5 | wool | open | Dull kettles rubbed at the centre with no hurry, a soft dark choir | pad
Wind in a bass flute | Rubbed moan | swell=1.2 cavity=Tube cavityTune=-18 touch=.55 grain=.45 bend=0 scatter=.1 ring=12 load=0.8 place=.35 otherSkin=0 width=.15 offCentre=.35 volume=5.5 | tube | murmur | The longest tubes rubbed steadily, hollow with a breath on top | wind
Gut on the bridge | Rubbed moan | thread=1 swell=.3 cavity=Tube bend=-2 fall=.15 touch=.3 ring=3 load=1 scatter=.15 skin=.3 width=.4 volume=2.5 | reel | song | Tubes rubbed with a thread touching the skin, a faint buzz along the top of the tone | string
Shutter in a gale | Rubbed moan | thread=.8 swell=.1 cavity=Pot cavityTune=14 bend=3 fall=.3 touch=.5 ring=1 place=.8 width=.8 offCentre=.5 roll=15 volume=6 | cupboard | murmur | Small pots with the thread lying close, every rub a rattle | texture
Moored boats talking | Rubbed moan | thread=.6 swell=1.2 cavity=Kettle cavityTune=-7 bend=-6 fall=1 touch=.35 otherSkin=.6 otherTune=-5 scatter=.8 offCentre=.08 roll=6 volume=5.5 | toe | hold | Kettles that groan up through a loose thread, a fourth beneath answering | drone
Loom in the back room | Rubbed moan | thread=1 roll=18 swell=.2 cavity=Pot touch=.2 grain=.6 ring=4 scatter=.1 otherSkin=.9 otherTune=12 skin=.2 load=.7 width=.95 volume=6 | loopbed | figure | Threaded pots worked to and fro in time, an octave clacking along | texture
Bone and catgut | Rubbed moan | thread=1 swell=.7 cavity=Kettle cavityTune=-3 bend=0 touch=.2 load=.6 skin=.25 grain=.2 ring=6 width=.85 offCentre=0 volume=0.5 | forward | duet | Kettles rubbed softly with the thread pulled tight, a groan with a snarl on it | string
Two sides of a door | Paired skins | hand=Rub roll=7 swell=.8 otherTune=7 cavity=Tube cavityTune=3 touch=.5 bend=-3 fall=.4 scatter=.2 load=.65 volume=1.5 | stone | duet | Tubes rubbed by turns on one skin while a fifth comes back from the other
Answer in the well | Paired skins | hand=Rub roll=8 swell=.5 otherTune=-12 cavity=Pot cavityTune=-10 touch=.7 bend=4 fall=.6 place=.3 load=.78 volume=5 | cistern | murmur | Low pots groaning over and over, and an octave below them something larger
Three at the rail | Paired skins | hand=Rub roll=4 swell=1.2 otherTune=12 cavity=Kettle cavityTune=8 touch=.6 offCentre=.6 load=1 bend=-1.2 fall=.6 volume=5.5 | follow | song | Small kettles rubbed with octave skins that follow a moment after
Cat on the piano lid | Paired skins | hand=Rub roll=0 swell=.15 otherTune=3.5 cavity=Shallow cavityTune=-5 bend=-8 fall=.2 touch=.4 skin=.4 load=.82 volume=6 | reflect | cry | Frames that slur up quickly past a second skin tuned between the notes
Ferns unrolling | Paired skins | hand=Brush roll=3 swell=1.5 otherTune=19 cavity=Kettle cavityTune=-2 grain=.1 touch=.4 bend=-5 fall=1.5 volume=6 | mist | lean | Brushes pressed on kettles, the notes uncurling upward and a twelfth in leaf behind | pad
Grey back surfacing | Bare thunder | hand=Rub load=.3 roll=0 swell=1.2 bend=-10 fall=1.5 cavity=Kettle cavityTune=-8 otherSkin=.5 touch=.5 grain=.2 width=.15 volume=6 | shallows | cry | Lightly loaded kettles rubbed up out of the deep, the overtones off the harmonics
Seal on the sandbank | Bare thunder | hand=Rub load=.5 roll=18 swell=.2 bend=6 fall=.5 cavity=Tube cavityTune=-2 touch=.7 scatter=.3 otherSkin=0 grain=.4 ring=5 width=.05 volume=6 | shore | murmur | Half loaded tubes barking down into pitch and then again, faster than once a second
Ice talking at night | Bare thunder | hand=Rub load=0 roll=9 swell=.6 bend=12 fall=2 cavity=Shallow cavityTune=-2 scatter=.6 ring=12 touch=.15 otherTune=24 grain=.1 offCentre=.4 place=.3 skin=.3 volume=6 | cave | cry | Bare frames rubbed by turns, cold clashing tones that slide down for seconds | texture
Bruised plum | Bare thunder | hand=Rub load=.65 roll=2 swell=2 bend=0 cavity=Pot cavityTune=-4 offCentre=.7 touch=.3 otherTune=7 otherSkin=.4 ring=6 scatter=.4 grain=.15 width=1 volume=5.5 | sines | tide | Pots not quite loaded, rubbed softly into a chord that is sore at the edges | pad
Far side of the barn | Bare thunder | hand=Rub load=.8 roll=11 swell=.8 bend=-2 fall=.2 cavity=None offCentre=.2 otherTune=0 otherSkin=1 touch=.55 damp=.2 width=.3 volume=6 | nextdoor | song | Bodiless skins rubbed once round a second, with a twin skin heard through them
`,
    },
    {
      id: 'hummed-voices',
      name: 'Hummed voices',
      category: 'voice',
      rows: `
Mouth kept shut | Hummed voice | cavityTune=-7 touch=.6 swell=.4 ring=1 skin=.3 otherSkin=0 scatter=.2 place=.3 width=.1 bend=-3 fall=.25 load=.75 cavity=Tube volume=-4.5 | warm | hymn | A hum into low tubes, scooped up to each note, closed and nasal
Ah of the bakers | Hummed voice | cavityTune=8 touch=.85 swell=.6 ring=3 skin=.8 place=.5 grain=.15 otherSkin=.3 otherTune=12 width=.45 load=.7 bend=-2 fall=.12 offCentre=0 roll=4 volume=5 | chapel | veil | Bright hums in small pots, pulsed and opened to a wide vowel, octaves behind them
Cold morning choir | Hummed voice | cavityTune=15 touch=.6 swell=1 ring=6 skin=.9 place=.8 scatter=.3 grain=.75 width=0.75 offCentre=.4 cavity=Shallow load=.85 bend=-1 fall=.3 volume=2 | thintail | lean | Small frames hummed high in the mouth, thin and spread apart, half of it breath
Boy at the pump | Hummed voice | cavityTune=10 touch=.7 swell=.08 ring=.5 scatter=.1 grain=.2 damp=.6 otherSkin=0 width=.2 cavity=Shallow skin=.3 load=.7 bend=-1.5 fall=.06 volume=0.5 | limit 1.gain=14 | murmur | Short quick hums on small damped frames, each with a catch at the front
Nan at the sink | Hummed voice | cavityTune=-4 touch=.65 swell=.3 ring=2 scatter=.9 bend=-1 fall=.15 grain=.5 offCentre=.6 width=.1 load=.65 thread=.45 volume=1.5 | cassette | song | A wandering hum in threaded pots that scoops into each note, water and breath in it
Reed in the nose | Hummed voice | cavity=Tube cavityTune=3 touch=1 swell=.15 ring=1 load=1 place=.5 scatter=.1 grain=.1 skin=.9 width=.85 offCentre=.1 thread=.9 volume=-3 | forward | duet | A hard hum in threaded tubes, as nasal and steady as a reed | wind
Gallery of statues | Hummed voice | cavity=Tube cavityTune=-10 touch=.45 swell=1.2 ring=8 place=.2 otherSkin=.5 otherTune=7 scatter=.4 roll=7 bend=-2 fall=.4 width=.9 load=.78 volume=-2.5 | cath | hymn | Long tubes hummed in a slow shake, fifths in the far skins, tall and grave
Quarrel next door | Hummed voice | cavity=Tube cavityTune=8 touch=.8 swell=.05 bend=5 fall=.25 roll=8 scatter=.8 grain=.4 load=.82 offCentre=.35 thread=.9 volume=6 | nextdoor | murmur | Short threaded tubes hummed sharply, falling and shaking, words nearly made out
Lower the lamp | Hummed voice | cavity=Tube cavityTune=-18 touch=.25 swell=2 ring=5 skin=.2 otherSkin=.7 otherTune=-12 grain=.2 width=.9 bend=-.5 fall=.2 offCentre=.5 roll=3 volume=3 | pillow | tide | The longest tubes hummed in slow soft waves, an octave under, shaded almost out | pad
Full bag of air | Hummed voice | cavity=Tube cavityTune=-1 touch=.9 swell=.6 thread=0 load=.95 scatter=.05 otherSkin=.9 otherTune=-12 ring=10 width=.35 volume=-4 | singer | hold | A firm hum in tubes over an octave skin, as level as can be held | drone
Under the snow bank | Hummed voice | cavity=Kettle cavityTune=-8 touch=.2 swell=1.5 ring=10 place=.2 skin=.3 scatter=.6 grain=.1 thread=.3 load=.7 width=.4 bend=-1.6 fall=.6 offCentre=.08 roll=3 volume=0.5 | wool | veil | Soft hums in large kettles in slow waves, round and far down | pad
Vespers for two | Hummed voice | cavity=Kettle cavityTune=6 touch=.6 swell=.8 ring=6 place=.5 otherSkin=.7 otherTune=7 load=1 scatter=.2 offCentre=.5 width=.15 bend=-.7 fall=.12 volume=-3.5 | nave | duet | Kettles hummed clear with a fifth standing in each, slow to clear the air
Sung behind the wall | Hummed voice | cavity=Kettle cavityTune=0 touch=.4 swell=.5 bend=2.5 fall=.8 ring=2 scatter=.15 grain=.3 load=.75 roll=8 thread=.35 volume=-0.5 | stairs | song | Low kettle hums that sink gently onto every note and tremble there, faintly buzzing
Barge under the bridge | Hummed voice | cavity=Kettle cavityTune=-15 touch=.8 swell=.3 ring=12 place=.1 otherSkin=.9 otherTune=12 thread=.45 roll=0 width=.15 load=.7 bend=-1.2 fall=.3 offCentre=.7 volume=-1 | undertow | pedals | The largest kettles hummed hard at the centre, dark with a buzz and an octave over it | bass
Tin angels | Hummed voice | cavity=Kettle cavityTune=16 touch=.75 swell=1 ring=7 place=.9 skin=1 scatter=.4 offCentre=.5 otherSkin=.4 otherTune=19 width=.05 load=.85 bend=-2 fall=.2 roll=6 volume=3.5 | bowlhalo | lean | Small kettles hummed in a shake at the rim, high and beating with twelfths above
Tissue on a frame | Hummed voice | cavity=Shallow cavityTune=6 touch=.7 swell=.04 thread=1 ring=.8 grain=.3 skin=.8 scatter=.1 width=.15 load=.65 bend=-1 fall=.6 volume=-4.5 | valve | drops | A bright hum on small frames with a thread touching, paper on a comb | wind
Through cupped hands | Hummed voice | cavity=Shallow cavityTune=-12 touch=.65 swell=.4 grain=.7 ring=3 place=.3 skin=.4 otherSkin=0 width=.3 load=.78 bend=-.5 fall=.12 offCentre=0 roll=10 damp=.05 volume=6 | openvowel | murmur | Fluttered hums on low frames with the voice itself left in, open and breathy
Glass in the sash | Hummed voice | cavity=Shallow cavityTune=14 touch=.7 swell=.7 ring=5 skin=1 place=.9 scatter=.5 otherSkin=.6 otherTune=24 width=1 load=.82 bend=-1.6 fall=.3 offCentre=.45 roll=13 volume=0 | limitroom 1.gain=13 | mist | Small frames that tremble to a hum, only the top of the tone left | texture
Ghost in the snare | Hummed voice | cavity=None thread=1 touch=.5 swell=.5 ring=4 grain=.6 skin=.6 scatter=.6 otherSkin=.3 otherTune=12 width=.45 load=.75 bend=-.7 fall=.2 volume=-5 | reflect | song | Bodiless threaded skins set off by a voice, a rustle with a tune in it
Humming on the stair | Hummed voice | cavity=Tube touch=.75 swell=.2 ring=10 load=1 grain=.25 place=.6 otherSkin=.8 otherTune=-12 width=.7 bend=-1.2 fall=.6 offCentre=.35 cavityTune=-15 roll=5 thread=0 volume=2 | doubled | duet | Slowly pulsing bright hums in long tubes, an octave under thickening them
Cold hands, warm song | Hummed voice | roll=10 swell=.6 touch=.55 cavityTune=-9 scatter=.15 ring=.8 grain=.35 otherSkin=.7 otherTune=12 width=.9 load=.7 bend=-2 fall=.12 offCentre=.5 thread=.5 volume=3.5 | hall | song | A hum in wide threaded pots and their octaves, shivering five times a second
Old woman laughing | Hummed voice | roll=20 swell=.05 touch=.8 cavity=Tube cavityTune=6 bend=4 fall=.4 ring=.5 scatter=.5 grain=.5 width=.15 load=.85 volume=6 | slap | drops | Short quick hums in tubes, shaken fast and falling
Tremble of the reservoir | Hummed voice | roll=6 swell=2 touch=.35 cavity=Kettle cavityTune=-5 scatter=.1 ring=1.5 otherSkin=.6 otherTune=-12 offCentre=.1 volume=2.5 | currents | hold | Kettles hummed in an even shake with an octave below | drone
Bleating at the ford | Hummed voice | roll=14 swell=.1 touch=1 cavity=Pot cavityTune=10 load=.9 scatter=.2 ring=.4 bend=-3 fall=.2 width=.05 offCentre=.7 thread=.7 volume=3 | valley | cry | Hard shaking hums in small threaded pots that jump up to the note
Motor under the floor | Hummed voice | roll=17 swell=.4 touch=.45 cavity=Shallow cavityTune=-16 scatter=0 ring=.6 skin=.5 otherSkin=.5 otherTune=-5 width=.9 load=.65 volume=6 | limitroom 1.gain=14 | ground | Frames hummed in a fast strict shake, a fourth below, like something running | drone
Breath before speech | Hummed voice | grain=1 touch=.3 swell=1 ring=3 cavity=Pot cavityTune=-7 load=.8 skin=.3 scatter=.7 place=.6 width=.3 bend=-1 fall=.3 offCentre=0 thread=.85 volume=0.5 | airy | veil | As much voice as skin, a breathy hum in wide threaded pots not yet a word
Ring of soft air | Hummed voice | grain=.9 touch=.15 swell=.8 ring=6 cavity=Tube cavityTune=12 skin=.2 scatter=.4 place=.3 otherSkin=.5 otherTune=12 width=.85 load=.78 bend=-.5 fall=.2 offCentre=.45 roll=4 volume=-4.5 | mist | lone | Soft air sung in waves through short tubes, the vowel left open | wind
Tired bellows | Hummed voice | grain=.8 roll=3 swell=1.2 touch=.6 cavity=Shallow ring=1 scatter=1 cavityTune=-4 thread=0 bend=-1.6 fall=.6 volume=0.5 | breath | hymn | Frames hummed unevenly with much of the voice, wheezing in and out | organ
Wind at the keyhole | Hummed voice | grain=.6 touch=.9 swell=1.5 ring=12 cavity=None place=1 skin=1 scatter=1 otherSkin=.2 otherTune=19 width=.15 load=.82 bend=-.7 fall=.12 offCentre=.35 volume=3 | shift | cry | Bodiless skins hummed at the very rim, a wandering whistle of overtones | wind
Straw in the pillow | Hummed voice | grain=.7 touch=.4 swell=.25 ring=.6 cavity=Kettle damp=.95 cavityTune=9 skin=.4 scatter=.3 thread=.7 width=.45 load=.75 bend=-1.2 fall=.3 offCentre=.5 roll=7 volume=0.5 | shade | murmur | Shaken muffled hums in damped kettles, rough with breath and a loose thread
Sun through linen | Hummed voice | swell=2.6 touch=.5 cavityTune=5 ring=6 otherSkin=.5 otherTune=12 scatter=.4 place=.6 width=0.85 roll=3 thread=.7 load=.8 bend=-2 fall=.2 volume=-2 | longplate | veil | Pots that hum themselves awake over three seconds in slow waves, octaves opening | pad
Iceberg with a candle | Hummed voice | swell=2.5 touch=.7 cavity=Kettle cavityTune=12 ring=12 offCentre=1 load=.85 scatter=.8 otherSkin=.8 otherTune=24 skin=.9 width=.75 bend=-1 fall=.6 volume=-2.5 | winter | open | Small kettles hummed up slowly, pairs split wide apart, cold two-octave skins above | pad
North side of the stone | Hummed voice | swell=4 touch=.05 cavity=Pot cavityTune=-16 ring=4 skin=.02 place=.1 scatter=.2 grain=.05 otherSkin=.3 otherTune=5 load=.85 bend=-.5 fall=.12 offCentre=.08 thread=.35 volume=0.5 | darkhall | hold | Hardly any overtone, a low slow hum in the widest pots, a trace of a fourth and a stir of gut | drone
Golden rule of bees | Hummed voice | swell=1.8 touch=.8 cavity=Tube cavityTune=4 ring=3 thread=.8 scatter=.6 otherSkin=.6 otherTune=7 load=1 width=.85 bend=-1.6 fall=.3 volume=3.5 | ensemble | tide | Tubes hummed loosely, fifths inside and a buzz over the top | pad
Tall grass breathing | Hummed voice | swell=3 roll=1.5 touch=.6 cavity=Shallow cavityTune=2 ring=6 scatter=.9 grain=.4 place=.7 width=1 load=.8 offCentre=0 volume=-8 | limitroom 1.gain=12 | open | Frames hummed in slow uneven waves, dry and wide | pad
Sigh of the sofa | Hummed voice | bend=6 fall=1.2 swell=.2 touch=.4 cavityTune=-6 ring=3 grain=.3 scatter=.2 width=.9 load=.78 offCentre=0 thread=.4 volume=-1 | roundvowel | cry | Every hum begins high in the pot and lets itself down, gut rattling as it goes
Who left the gate | Hummed voice | bend=-9 fall=.5 swell=.1 touch=.75 cavity=Tube cavityTune=-5 ring=4 scatter=.1 otherSkin=.2 width=.15 load=.82 roll=5 volume=6 | dotted | song | Tubes hummed upward from far below and shaken, asking
Counterweight sinking | Hummed voice | bend=12 fall=3 swell=.5 touch=.55 cavity=Kettle ring=5 cavityTune=3 scatter=.3 otherSkin=.6 otherTune=0 width=1 offCentre=.45 volume=-4.5 | lowshadow | open | Kettle hums that start far above the key and sink to it for seconds | pad
Cuckoo in the stairwell | Hummed voice | bend=3 fall=.05 swell=.02 touch=.5 cavity=Pot cavityTune=17 ring=1 damp=.7 scatter=0 grain=.1 place=.95 skin=.9 load=.75 width=.3 offCentre=.35 volume=6 | farecho | drops | Tiny pots hummed short, each with a quick chirp at the front | plucked
Elastic evening | Hummed voice | bend=-5 fall=2.5 swell=1 touch=.6 cavity=Shallow cavityTune=-7 ring=8 scatter=.5 otherSkin=.9 otherTune=-12 width=1 volume=5.5 | sag | tide | Frames hummed over octave skins, notes that stretch upward for two seconds | pad
Organum at the ferry | Paired skins | hand=Hum roll=0 otherTune=7 swell=.5 touch=.6 cavityTune=-5 ring=3 offCentre=0 load=1 bend=-.7 fall=.2 volume=-2.5 | crypt | hymn | Pots hummed with a fifth as strong as the note, parallel and stern | organ
Candle and its shadow | Paired skins | hand=Hum roll=0 otherTune=-12 swell=.9 touch=.3 cavity=Tube cavityTune=2 scatter=.3 grain=.1 thread=.85 load=.75 bend=-1.2 fall=.6 damp=.2 volume=0.5 | latevib | duet | Soft tube hums with a thread, and an octave down the far skin saying the same
Three floors up | Paired skins | hand=Hum roll=5 otherTune=19 swell=1.2 touch=.75 cavity=Kettle cavityTune=-3 scatter=.2 place=.7 skin=.8 load=.8 bend=-2 fall=.12 volume=-0.5 | shim | veil | Kettles hummed with a slow shake and a twelfth ringing as loudly above | pad
Brothers on the bridge | Paired skins | hand=Hum roll=0 otherTune=5 swell=.15 touch=.85 cavity=Shallow cavityTune=-10 load=1 ring=2 scatter=.15 grain=.2 thread=.6 bend=-1 fall=.3 volume=2.5 | shadow | duet | Frames hummed firmly in fourths, quick and open-throated
What the hall kept | Paired skins | hand=Hum roll=8 otherTune=24 swell=.7 touch=.2 cavity=Pot cavityTune=9 ring=12 scatter=.6 grain=.3 load=.85 bend=-.5 fall=.2 volume=2 | recall | song | Gently shaking small pots, with skins two octaves above that go on after
Bare throat | Bare thunder | hand=Hum load=.2 roll=9 swell=.6 cavity=Pot cavityTune=2 bend=0 touch=.6 grain=.3 offCentre=.3 otherSkin=.2 scatter=.3 ring=4 width=.05 damp=.35 volume=6 | dead | murmur | A shaking hum on almost unloaded skins, its overtones off the note like a voice breaking
Station in a storm | Bare thunder | hand=Hum load=.4 roll=10 swell=1.5 cavity=Tube cavityTune=-8 bend=-3 fall=1 touch=.5 grain=.5 thread=1 width=.3 volume=6 | static | cry | Half loaded tubes shaken by an unsteady hum and a thread, weather in the voice
Fish under ice | Bare thunder | hand=Hum load=0 roll=7 swell=1 cavity=Kettle cavityTune=17 bend=2.5 fall=.5 touch=.4 grain=.1 offCentre=1 otherTune=7 ring=12 place=.95 damp=.5 volume=6 | sines | mist | Bare kettles hummed in a soft shake, a sour glassy chord inside each note | texture
Bell with a throat | Bare thunder | hand=Hum load=.55 roll=0 swell=.1 cavity=Shallow cavityTune=8 bend=0 touch=.9 grain=.1 offCentre=.15 otherTune=12 ring=8 skin=1 scatter=.1 width=.45 volume=-1 | bright | cry | Half loaded frames hummed hard, part bell and part voice
Crowd after the match | Bare thunder | hand=Hum load=.7 roll=4 swell=.8 cavity=Pot cavityTune=-10 bend=3 fall=.8 touch=.55 grain=.9 scatter=1 otherTune=-5 width=1 damp=.15 thread=.6 volume=1.5 | breathroom | tide | Wide threaded pots hummed loosely with much breath, falling into notes not quite in tune | texture
`,
    },
    {
      id: 'kettle-bells',
      name: 'Kettle bells',
      category: 'bell',
      rows: `
Frost on the kettle drum | Kettle bells | cavityTune=18 ring=12 touch=.5 skin=.6 place=.75 offCentre=1 grain=.05 load=.6 hand=Finger damp=0 otherSkin=.7 otherTune=24 bend=3 fall=.04 volume=-0.5 | bright | bells | Fingertips toward the rim of the smallest kettles, each overtone split, frost far above
Copper pans on hooks | Kettle bells | cavityTune=8 ring=2 touch=.6 damp=.6 place=.5 offCentre=.6 otherSkin=.4 otherTune=7 grain=.4 bend=-4 fall=.1 scatter=.5 load=.65 thread=.55 volume=2 | box | rain | Half stopped threaded kettles tapped in a loose handful, hopping up, with a fifth
Noon over the square | Kettle bells | cavityTune=2 ring=12 touch=.45 place=.3 load=.8 offCentre=.8 damp=0 otherSkin=.7 otherTune=12 thread=.35 bend=-.4 fall=.08 volume=-3.5 | lowbowls | toll | Soft sticks on wide threaded kettles, long, with slow beating in every overtone
Small change | Kettle bells | cavityTune=14 ring=.6 touch=.7 skin=.8 place=.95 scatter=.4 grain=.5 width=.9 load=.7 bend=-.8 fall=.05 damp=.2 volume=3.5 | dust | drops | Hard sticks at the rim, several taps to a key, short and bright
Anvil made of fog | Kettle bells | cavityTune=-12 ring=8 touch=.05 skin=.1 place=.15 swell=.12 offCentre=.3 load=.5 damp=.2 bend=2.5 fall=.03 volume=-2.5 | fog | peal | Muffled sticks on big half loaded kettles with the front of the stroke rubbed away
Snowfall on copper | Kettle bells | hand=Finger cavityTune=10 ring=2.5 touch=.4 place=.9 skin=.85 offCentre=.5 scatter=.6 damp=.5 load=.65 otherSkin=.5 otherTune=19 volume=0 | shim | bells | Loose fingertips at the rim of half stopped kettles, light falls with a twelfth
Felt and bronze | Kettle bells | hand=Finger cavityTune=5 ring=4 touch=.05 place=.2 skin=.4 otherSkin=.5 otherTune=12 grain=.02 bend=-.6 fall=.2 roll=6 scatter=.1 | chamber | peal | The softest fingers, six touches a second near the middle of kettles, with an octave
Pearl in a dish | Kettle bells | hand=Finger cavityTune=13 ring=1.5 touch=.9 place=.9 damp=.15 skin=1 grain=.3 width=.2 load=.78 volume=2 | thinhalo | rain | Firm fingertips at the rim of small kettles, short and bright as a dropped bead
Temple at low water | Kettle bells | hand=Finger cavityTune=-10 ring=12 touch=.55 place=.45 damp=0 bend=1 fall=1 otherSkin=.8 otherTune=-12 load=.7 thread=.45 volume=-4 | lowbowls | toll | Fingers on large threaded kettles, the note easing down for a second over an octave skin
Doorbell of the snail | Kettle bells | hand=Finger cavityTune=3 ring=3 touch=.6 place=.8 scatter=.7 load=.85 offCentre=.4 bend=3 fall=.04 damp=.35 thread=.45 volume=0.5 | slowring | bells | Loose fingers on threaded kettles, several to a key and each landing on its own
Submerged gong | Kettle bells | hand=Thumb cavityTune=-12 ring=12 touch=.6 place=.15 load=.6 offCentre=.9 bend=1.5 fall=2 damp=0 thread=.45 volume=-4 | shallows | toll | Thumbs at the centre of huge kettles not fully loaded, sinking in pitch, gut stirring
Brass at arm's length | Kettle bells | hand=Thumb cavityTune=12 ring=8 touch=.9 place=.75 skin=.9 otherSkin=.3 otherTune=24 roll=0 offCentre=.7 load=.82 bend=-.4 fall=.08 damp=.5 volume=-0.5 | roundvowel | peal | Hard thumbs on small kettles, darker than sticks, with a spark two octaves up
Bowl on a cushion | Kettle bells | hand=Thumb cavityTune=6 ring=5 touch=.3 place=.35 skin=.6 damp=.1 swell=.03 otherSkin=.6 otherTune=7 offCentre=.1 load=.75 bend=-.8 fall=.05 thread=.4 volume=-1 | bowlhalo | bells | Soft thumbs on middling kettles, round, a fifth and a faint buzz standing up behind each
Slow bronze door | Kettle bells | hand=Palm cavityTune=0 ring=12 touch=.5 place=.4 grain=.2 damp=0 skin=1 otherSkin=.9 otherTune=0 offCentre=.6 load=.7 bend=2.5 fall=.03 | bloom | toll | Palms on kettles with a twin skin that keeps the ring the hand has stopped
Two nuns and a bucket | Kettle bells | hand=Palm cavityTune=15 ring=12 touch=.9 place=.8 grain=.7 otherSkin=.6 otherTune=7 skin=.9 thread=.5 load=.6 bend=-.6 fall=.2 | tank | rain | Palms slapped on small threaded kettles, a splash and then a fifth
Church with no roof | Kettle bells | load=0 cavityTune=6 ring=9 touch=.6 place=.6 offCentre=.3 damp=0 otherSkin=.3 otherTune=-12 thread=.3 bend=3 fall=.04 | nave | peal | Bare skins on kettles under the stick, clashing overtones like a cast bell
Ship's clock ashore | Kettle bells | load=.4 cavityTune=12 ring=3 touch=.7 place=.5 skin=.9 offCentre=0 roll=2.2 volume=1.5 | wood | bells | Half gathered kettles struck nearly three times a second, tart and even
Crooked carillon | Kettle bells | load=.5 cavityTune=-4 ring=6 touch=.8 place=.9 offCentre=1 otherSkin=.5 otherTune=19 bend=-2 fall=.3 thread=.75 damp=.15 roll=4 volume=-4.5 | sines | peal | Sticks five to the second at the rim of half loaded threaded kettles, every pair quarrelling
Cracked glaze | Kettle bells | load=.2 cavityTune=17 ring=1 touch=.95 place=.35 damp=.2 grain=.3 skin=.7 bend=-.4 fall=.08 thread=.5 volume=2.5 | glaze | rain | Nearly bare small kettles struck hard, a short sour ping with a crack of gut in it
Iron leaf | Kettle bells | load=.75 cavityTune=-9 ring=4 touch=.35 place=.1 bend=-.5 fall=.6 offCentre=.5 skin=.5 thread=.35 volume=1 | leaves | bells | Soft sticks near the middle of large kettles just short of tuned, the pitch lifting a hair as it rings
Ice along the rail | Frame of sticks | roll=0 thread=0 swell=.01 load=.75 cavityTune=1 ring=4 touch=.25 skin=.3 place=.5 scatter=0 bend=-.8 fall=.05 offCentre=.5 volume=1.5 | chamber | bells | Frames struck softly, thin glassy chimes with little body
Spoon on the fence | Frame of sticks | roll=0 thread=.7 swell=.01 load=.6 cavityTune=2 ring=1.5 touch=.3 skin=.3 place=.25 scatter=.2 damp=.55 bend=2.5 fall=.03 offCentre=.08 volume=-0.5 | slap | rain | Half stopped frames tapped near the middle with a spoon, a thread buzzing under it
Triangle in a drawer | Frame of sticks | roll=0 thread=0 swell=.01 cavity=None load=.8 ring=12 touch=.5 skin=.55 place=.4 damp=.9 scatter=0 width=.2 bend=-.6 fall=.2 volume=5.5 | cupboard | drops | Sticks on muffled skins with no body, pinched and dry
Lantern glass cooling | Frame of sticks | roll=3 thread=0 swell=.01 cavity=None load=0.75 ring=8 touch=.1 skin=.35 place=.4 otherSkin=.9 otherTune=24 scatter=.4 damp=0 bend=3 fall=.04 offCentre=.7 volume=1.5 | linger | bells | Sticks ticking softly on bodiless skins lit by second skins two octaves up
Cutlery at midnight | Frame of sticks | roll=0 thread=.55 swell=.01 load=.5 cavityTune=5 ring=1.5 touch=.15 skin=.3 place=.4 scatter=.6 offCentre=.7 width=0.7 volume=0 | lake | rain | Half loaded frames struck loosely, taps scattering to each key and a thread chattering
Glass pipes by the door | Kettle bells | cavity=Tube cavityTune=12 ring=6 touch=.6 place=.5 load=1 skin=.9 offCentre=.1 otherSkin=.4 otherTune=12 bend=-.4 fall=.08 thread=.55 volume=-3.5 | linger | peal | Sticks on short threaded tubes, hollow ringing pipes with an octave inside
Bamboo in the river | Kettle bells | cavity=Tube cavityTune=8 ring=1.5 touch=.2 place=.6 damp=.3 skin=.3 grain=.3 bend=2.5 fall=.04 load=.5 thread=.75 hand=Thumb volume=0 | limit 1.gain=11 | rain | Short woody knocks on threaded tubes, each with a quick drop | plucked
Organ pipe falling | Kettle bells | cavity=Tube cavityTune=-8 ring=12 touch=.7 place=.6 bend=5 fall=1.5 offCentre=.4 skin=1 load=.85 thread=.4 volume=-2 | shaft | toll | Sticks on long tubes whose ringing slides down for a second and more, buzzing as it goes
Milk bottles at five | Kettle bells | cavity=Tube cavityTune=9 ring=2 touch=.15 place=.5 load=.7 grain=.2 scatter=.3 skin=.2 bend=-.8 fall=.05 thread=.55 volume=-1 | deck | rain | Short threaded tubes struck loosely, clinking vowels
Vowel chime | Kettle bells | hand=Finger cavity=Tube cavityTune=7 ring=9 touch=.75 place=.4 load=0.85 otherSkin=.6 otherTune=7 damp=0 bend=2.5 fall=.03 roll=2.5 thread=.8 volume=0 | oo | bells | Fingertips two or three times a second on tubes, a nasal bell with a fifth and gut in it
Cave with one drip | Kettle bells | cavity=Pot cavityTune=14 ring=3 touch=.3 place=.4 bend=-4 fall=.05 grain=.1 skin=.4 load=.75 thread=.4 volume=1.5 | cave | drops | Sticks on tiny pots whose notes hop up as they land, like water, with a fizz of gut
Cowbells on clay | Kettle bells | cavity=Pot cavityTune=5 ring=1 touch=.35 place=.5 load=.6 damp=.2 offCentre=.4 grain=.4 skin=.4 bend=-.6 fall=.2 thread=.55 volume=3 | clay | rain | Small half loaded pots struck near the middle, clanking and short, a rattle inside
Bare feet on marble | Kettle bells | hand=Finger cavity=Pot cavityTune=11 ring=5 touch=.8 place=.85 skin=.95 otherSkin=.5 otherTune=19 bend=3 fall=.04 volume=-2 | faintglow | peal | Fingers at the rim of small pots, clear, with a twelfth that follows
Round stone, round pool | Kettle bells | hand=Thumb cavity=Pot cavityTune=5 ring=9 touch=.5 place=.2 bend=3 fall=.15 load=1 otherSkin=.3 otherTune=12 volume=-2.5 | gen | toll | Thumbs near the middle of pots, one deep plop that settles into a long round note
Porcelain thunder | Kettle bells | hand=Palm cavity=Pot cavityTune=16 ring=9 touch=1 place=.6 load=.55 skin=1 grain=.4 otherSkin=.7 otherTune=12 damp=0 bend=-.4 fall=.08 | gated | peal | Palms on the tiniest pots, a bright crack and an octave held after it
Sister bells | Paired skins | roll=0 hand=Stick swell=.01 otherTune=24 cavity=Kettle cavityTune=8 ring=7 touch=.6 place=.6 offCentre=.2 load=.65 bend=-.8 fall=.05 volume=-3 | late | bells | Kettles whose far skins ring two octaves up, as strong as the stroke
Bell that lost a third | Paired skins | roll=0 hand=Stick swell=.01 otherTune=3 cavity=Kettle cavityTune=13 ring=9 touch=.5 place=.75 otherSkin=.7 load=.78 bend=2.5 fall=.03 thread=.55 | pressing | peal | Small kettles with a minor third hanging in the second skin, gut humming between
Mast in a small wind | Paired skins | roll=0 hand=Finger swell=.01 otherTune=19 cavity=Shallow cavityTune=6 ring=8 touch=.3 skin=.35 place=.55 thread=.75 bend=-.6 fall=.2 damp=.2 volume=-2 | two | bells | Frames flicked clearly with a thread across, twelfths taking up what the frame lets go
Seventh at the window | Paired skins | roll=0 hand=Stick swell=.01 otherTune=10 cavity=None cavityTune=7 ring=4 touch=.75 otherSkin=.8 offCentre=.6 place=.2 damp=.4 bend=3 fall=.04 volume=1.5 | harm | toll | Sticks on skins with no body, stopped, with a minor seventh in the far skin
Octaves under glass | Paired skins | roll=0 hand=Thumb swell=.02 otherTune=-12 cavity=Kettle cavityTune=17 ring=12 touch=.85 skin=.9 place=.7 load=.7 bend=-1 fall=.4 thread=.45 | glass | peal | Thumbs on small threaded kettles, and an octave down a slow second ring
Tower in a wind | Kettle bells | roll=5 swell=.02 scatter=.8 cavityTune=6 ring=8 touch=.55 place=.5 offCentre=.6 thread=.4 load=.6 volume=1 | losing | toll | Threaded kettles struck again and again without a steady beat while the key is held
Sleigh on the far bank | Kettle bells | roll=14 swell=.05 scatter=.3 cavityTune=11 ring=.8 touch=.25 place=1 thread=.7 skin=.45 load=.6 bend=-1 fall=.4 damp=.35 volume=4 | loopbed | bells | Threaded kettles in a fast light roll at the rim, a shake of small metal | texture
Bronze engine | Kettle bells | roll=9 swell=.15 scatter=0 cavityTune=1 ring=3 touch=.4 place=.35 load=.85 volume=-3 | drumrotor | peal | Kettles in a strict even roll, round, humming with the stick
After the curfew | Kettle bells | hand=Thumb roll=10 swell=.02 scatter=.1 cavityTune=14 ring=9 touch=.7 bend=2.5 fall=.5 otherSkin=.4 otherTune=24 load=.82 volume=-3 | trail | toll | Thumbs striking small kettles three times in two seconds while the key is down
Telegraph from the ice | Kettle bells | hand=Finger roll=17 swell=.01 scatter=.9 cavityTune=18 ring=1 touch=1 place=.9 damp=.2 skin=.9 load=.7 bend=3 fall=.5 volume=4 | points | drops | Nervous fingers tapping at small kettles, short glassy signals
Bell dipped in a bucket | Kettle bells | bend=9 fall=.8 cavityTune=10 ring=8 touch=.4 place=.5 offCentre=.3 otherSkin=.8 otherTune=-12 hand=Finger cavity=Shallow load=.8 volume=1.5 | ripples | bells | Frames whose notes are dipped from far above as they ring, over an octave skin that stays
Gong learning to walk | Kettle bells | bend=-8 fall=1.2 cavityTune=-9 ring=12 touch=.35 place=.6 load=.65 offCentre=.7 damp=0 cavity=Shallow skin=.5 thread=.4 volume=-1.5 | pan | toll | Half loaded threaded frames that slide up over a second into a wide beating ring
Thread through the bell | Kettle bells | thread=.7 cavityTune=4 ring=1.2 touch=.6 place=.6 offCentre=.2 load=0.7 otherSkin=.3 otherTune=12 bend=2.5 fall=.03 volume=-4 | spring | peal | Kettles with a gut thread resting on them, a short ring with a fine sizzle
Hand on the bell | Kettle bells | hand=Rub swell=.3 cavityTune=15 ring=12 touch=.3 place=.6 skin=.55 otherSkin=.35 otherTune=24 load=1 bend=-.5 fall=.12 volume=3 | canon | cry | Small kettles made to ring by a rubbing finger and never struck | voice
Breath of the bell | Kettle bells | hand=Hum swell=.12 cavityTune=9 ring=4 touch=.9 place=.8 skin=1 otherSkin=.6 otherTune=19 offCentre=.4 load=0.8 bend=-1.6 fall=.3 roll=9 volume=-1.5 | longplate | peal | A shaking hum that sets small kettles and their twelfths ringing on by themselves | voice
`,
    },
    {
      id: 'dry-hand-keys',
      name: 'Dry hand keys',
      category: 'keys',
      rows: `
Oilcloth and bread | Dry hand keys | ring=12 damp=.4 touch=.45 grain=.3 place=.3 bend=2.5 fall=.04 skin=.6 load=.6 offCentre=.6 thread=.5 width=.2 volume=0 | bare | figure | Fingers on skins with no body, stopped early, a thread and a beat in every note
Knuckles on the tray | Dry hand keys | ring=3 damp=.95 touch=.9 grain=.9 place=.6 bend=3 fall=.03 skin=.9 load=.8 offCentre=0 volume=3.5 | box | hands | Hard damped taps on bodiless skins, more knuckle than note
Pencil case | Dry hand keys | ring=6 damp=.45 touch=.6 grain=.2 place=.9 skin=.5 scatter=0 width=.3 bend=-1.5 hand=Thumb thread=.6 load=.7 volume=6 | silent | figure | Thumbs at the rim of threaded skins with no body, thin and rattling
Letters on the mat | Dry hand keys | ring=12 damp=.05 touch=.3 grain=.1 place=.15 skin=.3 otherSkin=.5 otherTune=0 scatter=.3 load=.8 offCentre=.45 volume=-10 | sustain | waltz | Soft fingers near the middle of skins with no body, a twin skin for warmth
Whispered argument | Dry hand keys | hand=Palm ring=12 damp=.2 touch=.7 grain=.8 place=.7 skin=.8 width=1 bend=2.5 load=.4 offCentre=.35 | slap | hands | Palms brushing skins with no body, all slap and air with a pitch just behind | drum
Plum stones | Dry hand keys | cavity=Pot cavityTune=6 ring=4 damp=.3 touch=.6 grain=.2 place=.4 load=1 bend=3 fall=.04 thread=.65 volume=-3.5 | ends | figure | Firm fingers on small threaded pots, hollow, quick and in tune
Upright in the passage | Dry hand keys | hand=Thumb cavity=Pot cavityTune=-4 ring=7 damp=.1 touch=.75 grain=.15 place=.2 load=.8 bend=.3 otherSkin=.4 otherTune=12 skin=.85 offCentre=.5 thread=.45 | cassette | - | Thumbs on pots with the octave skin open, a little worn and a little rattly
Mitten piano | Dry hand keys | hand=Thumb cavity=Pot cavityTune=2 ring=12 damp=.05 touch=.05 grain=.05 place=.25 skin=.02 bend=0 load=.75 offCentre=.5 | pillow | hymn | Thumbs in wool on pots, dull, long and quiet
Dried beans in a bowl | Dry hand keys | cavity=Pot cavityTune=13 ring=1 damp=.5 touch=.85 grain=.4 scatter=.5 load=.85 place=.7 thread=.75 roll=7 volume=4 | limitroom 1.gain=10 | rain | Loose fingers on the smallest threaded pots, spilling taps while a key is down
Walnut halves | Dry hand keys | hand=Stick cavity=Pot cavityTune=4 ring=3 damp=.5 touch=.35 grain=.1 place=.3 skin=.5 bend=0 load=0.75 offCentre=.08 thread=.45 volume=-3 | ends | figure | Soft sticks on damped pots with a thread across, dull wooden bars
Tambour of the courier | Plucked skin | ring=3 touch=.6 place=.6 cavityTune=-6 bend=1 damp=.2 grain=.5 otherSkin=0 skin=.7 width=.4 offCentre=0 volume=0 | chamber | hands | Fingers on broad frames, open and dry, the hand clearly heard
Porch rail | Plucked skin | hand=Thumb ring=6 touch=.9 place=.7 cavityTune=-2 bend=0 damp=.1 skin=.9 load=1 otherTune=12 otherSkin=.4 thread=.55 width=.2 | combo | figure | Hard thumbs on threaded frames, plain strong keys with a buzz
Skating on one leg | Plucked skin | hand=Stick ring=1.5 touch=.6 place=.15 cavityTune=4 bend=0 damp=.4 load=.95 grain=.1 offCentre=.1 cavity=None skin=.35 width=.1 thread=.35 volume=0 | forward | waltz | Sticks near the middle of damped skins with no body, light, narrow and quick
Tea on the veranda | Plucked skin | ring=8 touch=.35 place=.4 cavityTune=-10 bend=.5 skin=.6 otherSkin=.6 otherTune=7 grain=.15 damp=.05 width=.8 load=.7 offCentre=0 thread=.5 | halo | waltz | Gentle fingers on low threaded frames with fifths in the far skin
Sun on a pocket watch | Plucked skin | ring=2 touch=.45 place=.65 cavityTune=10 skin=.35 otherTune=24 otherSkin=.5 damp=.1 bend=0 grain=.1 load=.6 scatter=.35 width=.8 thread=.6 volume=2 | brightplate | figure | Small frames flicked loosely toward the rim, a gut thread and two octaves of light | plucked
Clavier in the attic | Dry hand keys | cavity=Tube cavityTune=8 ring=5 damp=.35 touch=.6 place=.35 load=0.85 skin=.7 grain=.1 bend=0 offCentre=.1 | reel | figure | Firm fingers on short tubes, nasal and plucky, stopped cleanly
Talking shoe leather | Dry hand keys | hand=Thumb cavity=Tube cavityTune=-5 ring=6 damp=.3 touch=.7 bend=-4 fall=.06 grain=.4 otherSkin=.2 load=.85 offCentre=.35 thread=.55 | warmbody | hands | Thumbs on tubes that jump up to each note like speech, a buzz in the voice
Tin whistle keys | Dry hand keys | hand=Stick cavity=Tube cavityTune=4 ring=1.2 damp=.2 touch=.1 place=.3 skin=.25 load=.9 grain=.15 thread=.55 volume=0.5 | smaller | rain | Sticks on tiny threaded tubes, small bright and hollow
Hollow tree, two wrens | Dry hand keys | cavity=Tube cavityTune=-12 ring=8 damp=.15 touch=.5 place=.2 scatter=.4 otherSkin=.6 otherTune=12 bend=1.5 fall=.1 load=.65 offCentre=.5 | two | waltz | Loose fingers on long tubes with an octave skin, hollow and unhurried
Postcard from the canal | Dry hand keys | hand=Palm cavity=Tube cavityTune=3 ring=12 damp=0 touch=.6 grain=.35 otherSkin=.9 otherTune=0 place=.5 load=.78 offCentre=.08 volume=-7.5 | recall | - | Palms on tubes that stop at once, a twin skin ringing on in their place
Lamplit keys | Dry hand keys | cavity=Kettle cavityTune=7 ring=5 damp=.1 touch=.5 place=.35 load=1 bend=0 grain=.1 otherSkin=.3 otherTune=12 | trem | hymn | Round finger strokes on kettles, smooth as an old electric keyboard
Tines under snow | Dry hand keys | cavity=Kettle cavityTune=15 ring=3 damp=.2 touch=.7 place=.6 skin=.9 bend=0 offCentre=.3 volume=2 | ensemble | figure | Small kettles fingered clean, each note a short bell in a crowd
Late shift at the desk | Dry hand keys | hand=Thumb cavity=Kettle cavityTune=0 ring=9 damp=.1 touch=.45 place=.3 otherSkin=.5 otherTune=7 bend=.5 fall=.3 load=.82 offCentre=.7 thread=.45 | shade | waltz | Dark thumbs on kettles with a fifth standing over each and a soft rattle under it
Lobby after closing | Dry hand keys | hand=Stick cavity=Kettle cavityTune=4 ring=2.5 damp=.15 touch=.3 place=.25 load=1 bend=0 grain=.05 thread=.4 | steprain | - | Softly struck kettles, round and short, gut astir after each
Lamp in the next room | Dry hand keys | cavity=Kettle cavityTune=-7 ring=12 damp=0 touch=.8 place=.8 skin=.8 offCentre=.8 otherSkin=.6 otherTune=19 load=.75 | pan | hymn | Firm fingers out at the rim of large kettles, slow beating and far twelfths
Market at ten | Slow palm | roll=0 ring=8 damp=.3 grain=.6 cavity=Pot cavityTune=3 touch=.7 bend=3 fall=.08 otherSkin=0 place=.5 thread=.5 load=.6 width=.3 offCentre=0 volume=0 | strikes | hands | Palms slapped on threaded pots, full in the hand and short | drum
Hand drying on clay | Slow palm | roll=0 ring=12 damp=0 grain=.15 cavity=Pot cavityTune=-14 touch=.6 bend=6 fall=.2 otherSkin=.3 thread=.5 width=.5 load=.7 volume=-2 | clay | toll | Palms on the largest pots with a thread across, each note bowing as it lands
Caravan rehearsal | Slow palm | roll=0 ring=6 scatter=.4 grain=.4 cavity=Shallow cavityTune=-4 touch=.6 bend=2 fall=.1 skin=.8 place=.8 thread=.45 load=.6 offCentre=.45 | tamed | hands | Loose palms at the rim of frames, several to a stroke | drum
Cork floor | Slow palm | roll=0 ring=12 damp=.95 grain=.1 cavity=Kettle cavityTune=8 touch=.05 bend=0 otherSkin=.6 otherTune=12 skin=.1 width=.4 load=.85 offCentre=.35 thread=.6 volume=-2.5 | pillow | figure | Muffled palms on threaded kettles, hardly a slap, with octaves over them
Prayer flags | Slow palm | roll=0 ring=12 grain=.9 cavity=None touch=.9 bend=-3 fall=.1 skin=1 otherSkin=.7 otherTune=7 width=0.8 load=.6 | breeze | hands | Crisp palms on skins with no body, fifths flapping after them | drum
Rosewood afternoon | Kettle bells | cavity=Pot cavityTune=0 ring=2.5 touch=.4 place=.15 load=.85 skin=.4 damp=.2 offCentre=0 bend=-.4 fall=.08 volume=-2 | deck | figure | Soft sticks in the middle of pots, warm bars with the overtones kept back
Pine cones | Kettle bells | cavity=None ring=5 touch=.1 place=.4 load=.5 skin=.2 damp=.5 grain=.3 width=.7 volume=6 | limit 1.gain=11 | rain | Soft damped sticks on half loaded skins with no body, short and splintery
Ladder of slate | Kettle bells | cavity=Shallow cavityTune=3 ring=2 touch=.15 place=.5 load=.85 damp=.4 skin=.35 bend=-.8 fall=.05 thread=.55 volume=-0.5 | silent | figure | Soft sticks on threaded frames half stopped, dry stone keys
Ivory and breath | Kettle bells | cavity=Tube cavityTune=-2 ring=4 touch=.3 place=.4 load=1 skin=.7 damp=.1 otherSkin=.4 otherTune=12 grain=.4 bend=2.5 fall=.03 thread=.55 volume=-2 | airy | waltz | Soft sticks on tubes, a hollow tone with the stick's own puff and a shiver of gut
Boxes within boxes | Kettle bells | cavity=Pot cavityTune=10 ring=.6 touch=.8 place=.6 load=.7 damp=.8 skin=.9 bend=2 fall=.02 thread=.6 volume=6 | after | hands | Small pots knocked hard with a stick, each a click, a rattle and a note shut in it | drum
Broom and bucket | Brushed night | swell=.02 roll=9 ring=3 grain=.5 cavity=Pot cavityTune=4 otherSkin=.2 touch=.6 damp=.2 width=.2 load=.65 place=0 volume=-10.5 | limitroom 1.gain=16 | waltz | Short dabs of a brush on pots, soft at both ends
Hush on the upbeat | Brushed night | swell=.01 roll=12 ring=1 grain=.9 scatter=.2 cavity=Shallow touch=.8 otherSkin=0 place=.8 skin=.8 width=.45 load=.78 bend=-1 fall=.3 offCentre=.5 volume=3.5 | dotted | hands | Brush strokes pressed on frames, crisp breath with a pitch in it | drum
Moss organ | Brushed night | swell=.05 roll=16 ring=6 grain=.1 cavity=Kettle cavityTune=6 load=1 touch=.5 otherTune=12 otherSkin=.6 scatter=.1 skin=.7 bend=-.5 fall=.2 volume=6 | rotor | hymn | Brushes turning once or twice a second on kettles, keys that puff like a small organ | organ
Pressing the linen | Brushed night | swell=.03 roll=7 ring=4 grain=.3 cavity=Tube cavityTune=10 touch=.9 otherSkin=.3 otherTune=19 scatter=.1 width=.8 load=.82 volume=-11.5 | limitroom 1.gain=14 | waltz | Bristles on short tubes, hollow puffs with a twelfth inside
Sawdust ballroom | Brushed night | swell=.04 roll=7 ring=9 grain=.7 cavity=None touch=.5 otherSkin=.8 otherTune=0 scatter=.4 damp=.1 width=.5 load=.75 bend=-1.6 fall=.6 volume=1.5 | pressing | waltz | Brushes on skins with no body in a rough circle, a twin skin keeping the tune
Tuned rain barrels | Talking drum | hand=Finger bend=6 fall=.1 cavity=Tube cavityTune=-8 ring=5 damp=.2 touch=.7 scatter=0 otherSkin=0 place=.8 load=.7 thread=.45 width=1 volume=2.5 | gated | hands | Fingers at the rim of long tubes, every key a fast drop onto its note, with a rattle | drum
Heel of the left hand | Talking drum | bend=5 fall=.4 cavity=Shallow cavityTune=-7 ring=10 touch=.8 damp=.1 otherSkin=.2 scatter=0 place=.2 skin=.3 width=.4 load=.7 thread=.45 volume=-4.5 | dead | toll | Thumbs pressed into low threaded frames, each note gliding down as the thumb lets go
Castanets in a drawer | Plucked skin | ring=2 bend=0 touch=.6 place=.75 cavity=Pot cavityTune=15 load=1 offCentre=.5 damp=.1 grain=.3 skin=.5 thread=.55 | limit 1.gain=8 | figure | Fingertips on the smallest threaded pots toward the rim, high, dry and exact
Stamping parcels | Talking drum | bend=12 fall=.02 cavity=None ring=8 touch=.6 damp=.8 grain=.5 scatter=0 skin=.5 load=.5 width=.15 volume=-1.5 | middle | hands | Thumbs on damped skins with no body, a thump that is gone as it lands | drum
Sliding panel | Talking drum | hand=Stick bend=-6 fall=.2 cavity=Shallow cavityTune=4 ring=4 touch=.2 damp=.1 scatter=0 skin=.5 width=.2 load=.85 thread=.5 volume=-3 | grains | figure | Soft sticks on threaded frames that slide up into tune
Harmonium of hides | Fingertip pad | roll=20 scatter=0 swell=.02 ring=1.5 cavity=Pot cavityTune=-2 touch=.8 place=.4 bend=0 load=1 grain=.05 otherSkin=.3 width=.95 | octave | hymn | The fastest even roll, speaking at once, held like a reed keyboard | organ
Stenographer | Fingertip pad | roll=13 scatter=.7 swell=.01 ring=.4 cavity=Shallow cavityTune=8 touch=.5 place=.7 grain=.6 damp=.3 load=.7 width=.8 bend=-.6 fall=.8 thread=.95 volume=4 | slips | figure | Dry rapid fingertips on small threaded frames, typing for as long as a key is down | texture
Pantry clock | Fingertip pad | roll=4 scatter=0 swell=.01 ring=1 cavity=Kettle cavityTune=11 touch=.6 place=.6 otherTune=19 grain=.2 skin=.8 load=.65 bend=-1 fall=.4 thread=.5 volume=0 | pair | hymn | Small kettles ticking four to the second under every held key, a wire touching
Elbow on the keys | Paired skins | roll=0 swell=.01 otherTune=2 hand=Thumb cavity=Pot cavityTune=5 ring=4 damp=.2 touch=.6 load=.78 bend=-.6 fall=.2 thread=.8 volume=-2 | lpg | toll | Thumbs on threaded pots whose second skin is a tone sharp, a rub in every note
Music stand rattle | Plucked skin | thread=.8 ring=3 touch=.6 place=.4 cavity=Pot cavityTune=-5 damp=.2 bend=1 otherTune=7 otherSkin=.3 grain=.4 width=.8 load=.82 | iron | figure | Pots fingered dry with a gut thread across the skin, buzzing on the loud notes
`,
    },
    {
      id: 'paired-skins',
      name: 'Paired skins',
      category: 'pad',
      rows: `
Sump of the old colliery | Paired skins | otherTune=-12 hand=Thumb roll=12 swell=1.5 ring=12 cavity=Tube cavityTune=-14 touch=.55 place=.2 offCentre=0 bend=3 load=.75 thread=.4 volume=-2.5 | crypt 1.mix=.2 | tide | Thumbs two a second on long threaded tubes, and an octave beneath each key a skin that fills the floor
Twice the height | Paired skins | otherTune=-12 roll=13 swell=.6 ring=3 cavity=Shallow cavityTune=6 touch=.8 place=.9 skin=.9 bend=-1.5 fall=1.2 volume=1.5 | longplate | lean | Bright fingers at the rim of frames while the octave below stays soft
Stream beneath ice | Paired skins | otherTune=-12 otherSkin=.8 hand=Hum roll=3 swell=1.8 cavity=Shallow cavityTune=4 touch=.25 ring=8 scatter=.6 grain=.3 bend=-.5 fall=.12 volume=0 | winter | open | A thin hum on frames in slow waves, over the octave skin like water heard below
Tallow and tar | Paired skins | otherTune=-12 otherSkin=.6 hand=Brush roll=3 swell=1 cavity=Pot cavityTune=-12 ring=6 grain=.5 skin=.3 load=.75 bend=-1.6 fall=.3 volume=1.5 | thump | hold | Wide pots brushed over octave skins, heavy and slow | drone
Slow goods lift | Paired skins | otherTune=-12 hand=Stick roll=15 swell=.8 cavity=Tube cavityTune=8 touch=.5 ring=2 scatter=.3 offCentre=.2 load=.8 bend=3 fall=.5 volume=6 | sway | hymn | A stick roll on short tubes, nasal above and an octave wide below
Door on one hinge | Paired skins | otherTune=7 roll=11 swell=.4 ring=7 cavity=Pot cavityTune=5 touch=.6 offCentre=0 grain=.3 scatter=.2 load=1 bend=-1 fall=.6 damp=.5 volume=-2.5 | hall | veil | Small pots under the fingers with their fifths as loud, clean and upright
Windmill in a fen | Paired skins | otherTune=7 hand=Palm roll=16 swell=.3 ring=12 cavity=Kettle cavityTune=-4 touch=.4 grain=.3 scatter=0 thread=0.75 bend=-1.5 fall=1.2 | breathroom | open | Palms turning on kettles about three and a half times a second, fifths going round
Green glass floats | Paired skins | otherTune=7 otherSkin=.7 hand=Rub roll=5 swell=1.2 cavity=Kettle cavityTune=14 touch=.5 ring=9 place=.9 scatter=.3 bend=-2 fall=.12 volume=1.5 | shallows | lean | Small kettles rubbed at the rim in slow turns, fifths in the far skins
Pilgrim's shoes | Paired skins | otherTune=7 hand=Thumb roll=14 swell=.1 ring=5 cavity=Tube cavityTune=-7 touch=.7 bend=3 fall=.3 scatter=.1 offCentre=.4 volume=-3 | repeats | tide | Thumbs walking about two a second on long tubes, each step sinking into a bare fifth
Husk of the sun | Paired skins | otherTune=7 otherSkin=.9 roll=18 swell=1 ring=1 cavity=None touch=.5 skin=.4 grain=.6 scatter=.8 load=.6 bend=-1 fall=.4 damp=.15 volume=6 | airy | mist | A dry patter on bodiless skins with nothing but fifths to hold it | texture
Fourth chair | Paired skins | otherTune=5 otherSkin=.9 roll=9 swell=.8 ring=6 cavity=Kettle cavityTune=2 touch=.5 place=.5 offCentre=.7 scatter=.4 load=.7 thread=.35 bend=3 fall=.5 volume=0.5 | chorus | hymn | Kettles rolled in an uneven hand, a fourth in each and the overtones beating
Half a brass band | Paired skins | otherTune=4 otherSkin=.8 hand=Hum roll=12 swell=.2 cavity=Tube cavityTune=1 touch=.95 load=1 ring=3 scatter=.05 thread=.55 bend=-1.6 fall=.6 damp=.1 volume=6 | rotor | duet | Hard fluttered hums in threaded tubes with a major third in the far skin | organ
Sixths over stubble | Paired skins | otherTune=9 otherSkin=.8 roll=12 swell=1.4 ring=8 cavity=Shallow cavityTune=-8 touch=.35 skin=.6 offCentre=.5 bend=-.6 fall=.8 thread=.85 volume=1 | valley | lean | Low frames under soft fingers, gut across them like stubble, sixths lying above
Rope bridge in fourths | Paired skins | otherTune=-5 hand=Stick roll=11 swell=.5 cavity=Pot cavityTune=2 touch=.4 ring=4 scatter=.15 bend=-1 fall=.4 damp=.35 thread=.95 volume=1.5 | gallop | open | A soft stick roll on threaded pots, and a fourth under every key
Light on the third floor | Paired skins | otherTune=3 otherSkin=.6 roll=15 swell=1.8 ring=9 cavity=Tube cavityTune=4 touch=.5 place=.3 grain=.05 load=.95 bend=3 fall=.5 volume=-1.5 | glimmer | veil | Tubes rolled into a glow with minor thirds inside
Same face twice | Paired skins | otherTune=.3 roll=10 swell=1 ring=8 cavity=Pot cavityTune=-2 touch=.5 offCentre=.1 scatter=.2 load=.8 place=.2 bend=-1.5 fall=1.2 damp=.5 volume=-2.5 | doubled | hymn | Two skins a third of a semitone apart on pots, beating slowly through a roll
Twins in a pram | Paired skins | otherTune=0 hand=Thumb roll=10 swell=.2 ring=8 cavity=Shallow cavityTune=8 touch=.8 place=.7 skin=.8 scatter=.4 bend=1 volume=0.5 | circle | lean | Thumbs on small frames with twin skins behind them, close and slightly out of step
Heat on the road | Paired skins | otherTune=-.5 otherSkin=.9 hand=Brush roll=2 swell=1.4 cavity=Shallow cavityTune=0 ring=9 touch=.6 grain=.3 offCentre=.9 load=.85 bend=-.5 fall=.12 volume=6 | notch | mist | Brushed frames wavering against skins tuned just flat | texture
Clocks that disagree | Paired skins | otherTune=.15 otherSkin=.9 hand=Stick roll=6 swell=.05 cavity=Kettle cavityTune=11 ring=4 touch=.5 scatter=0 offCentre=0 load=.75 bend=-1 fall=.4 volume=-2 | pair | bells | Small kettles struck steadily seven or eight times a second, twin skins beating behind | bell
Mirror in a lift | Paired skins | otherTune=0 hand=Hum roll=6 swell=.7 cavity=Pot cavityTune=7 ring=5 touch=.25 scatter=.1 grain=.1 thread=.9 load=.65 bend=-.7 fall=.2 damp=.15 skin=.3 volume=0.5 | mirror | duet | Small pots humming to their own twins in a slow shake, a thread on each | voice
Where the snow begins | Paired skins | otherTune=24 roll=16 swell=1.6 ring=9 cavity=Kettle cavityTune=8 touch=.25 skin=.9 place=.4 scatter=.6 bend=-1.5 fall=1.2 volume=0 | thinhalo | veil | Kettles rolled softly with a pale line two octaves over every key
Lark above plough | Paired skins | otherTune=19 hand=Palm roll=18 swell=.5 ring=12 cavity=Pot cavityTune=-10 touch=.5 grain=.2 scatter=.3 bend=-.6 fall=.8 | late | tide | Palms low on large pots, and a twelfth above, far lighter than the hand
Beacons up the coast | Paired skins | otherTune=12 roll=3 swell=.1 ring=9 cavity=Tube cavityTune=10 touch=.7 scatter=.6 place=.6 offCentre=.1 bend=-1 fall=.4 volume=-3.5 | seven | open | Fingers tapping small tubes three to the second, octaves lighting one by one
Tide mark on a post | Paired skins | otherTune=12 otherSkin=.9 hand=Rub roll=0 swell=2 cavity=Pot cavityTune=-5 touch=.05 ring=8 place=.2 skin=.08 load=.78 bend=-.5 fall=.2 volume=6 | asleep | hold | Dull pots rubbed so lightly that the octave skin is most of what is left | drone
Straight up at noon | Paired skins | otherTune=24 hand=Hum roll=0 swell=.8 cavity=Kettle cavityTune=-10 touch=.4 ring=10 place=.1 scatter=.1 load=.8 bend=-1.6 fall=.6 volume=-1.5 | brightplate | hymn | Dark kettles hummed from below, and nothing between them and the skins two octaves up
Crow on a wire fence | Paired skins | otherTune=2 otherSkin=.7 roll=14 swell=.7 ring=4 cavity=Shallow cavityTune=-3 touch=.6 offCentre=.6 scatter=.5 thread=0.75 load=.7 bend=-.6 fall=.8 damp=.2 volume=6 | stairs | lean | Threaded frames under the fingers with a tone above each, thin and grey
Sevenths left outside | Paired skins | otherTune=10 otherSkin=.8 hand=Thumb roll=18 swell=1.2 ring=9 cavity=Pot cavityTune=-7 touch=.5 bend=-1 fall=.4 thread=.9 volume=0.5 | darkplate | tide | Thumbs on wide threaded pots, a minor seventh lying over each, dim and patient
Ninth wave before dark | Paired skins | otherTune=14 otherSkin=.8 roll=5 swell=1.8 ring=6 cavity=Tube cavityTune=-6 touch=.3 scatter=.4 skin=.5 hand=Stick load=.8 bend=3 fall=.5 volume=1.5 | nave | open | Soft sticks six to the second on long tubes, a ninth in each one
Key to another house | Paired skins | otherTune=6 otherSkin=.6 hand=Stick roll=18 swell=1 ring=3 cavity=Tube cavityTune=-4 touch=.3 offCentre=.4 load=.75 thread=.6 volume=6 | phase | mist | Soft sticks on tubes with a tritone in the far skin, uneasy and still, a faint sizzle over it | texture
Below the second step | Paired skins | otherTune=-2 otherSkin=.9 hand=Rub roll=6 swell=.9 cavity=Shallow cavityTune=6 touch=.6 ring=4 bend=2 fall=.5 load=.7 skin=.3 volume=6 | undertow | murmur | Frames rubbed in slow turns, each with a tone below that will not agree | voice
Moths on the choir loft | Paired skins | otherTune=12 hand=Brush roll=9 swell=.6 cavity=Tube cavityTune=13 ring=3 touch=.7 grain=.6 scatter=.5 load=.85 bend=-1 fall=.6 volume=3 | oo | veil | Brushes circling on small tubes, a breathy vowel with its octave | voice
Cloth over the mangle | Paired skins | otherTune=7 otherSkin=.5 hand=Brush roll=14 swell=.3 cavity=Shallow cavityTune=-12 ring=2 grain=.8 touch=.4 skin=.4 load=.65 bend=-.5 fall=.12 volume=4.5 | losing | hymn | Dull frames brushed more than once a second, fifths woven in | texture
Sealed envelope | Paired skins | otherTune=12 otherSkin=.4 hand=Hum roll=0 swell=1.4 cavity=Kettle damp=1 touch=.05 ring=1 cavityTune=4 grain=.2 bend=-1.6 fall=.3 thread=.3 volume=0.5 | lowtide | veil | Damped kettles hummed behind closed lips, the octave skin barely open, a thread astir
Two winds in the grass | Paired skins | otherTune=5 otherSkin=1 hand=Brush roll=9 swell=2 cavity=None ring=12 grain=.4 scatter=.9 width=1 bend=-.7 fall=.2 volume=6 | lowtide | open | Skins with no body brushed unevenly, fourths coming and going with the air
Amber with a fly | Paired skins | otherTune=19 otherSkin=.7 hand=Hum roll=7 swell=.5 cavity=Pot cavityTune=10 touch=.9 ring=3 thread=.85 load=.78 bend=-1.2 fall=.6 volume=1.5 | throb | duet | Bright shaking hums on small pots, twelfths, and a thread that buzzes | voice
Afterwards the valley | Paired skins | roll=0 hand=Finger swell=.01 otherTune=-12 cavity=Pot cavityTune=9 ring=10 touch=.8 damp=.75 place=.6 load=.82 bend=-.6 fall=.2 volume=-2.5 | valley | toll | Small pots struck and stopped, the octave skins going on alone below | keys
Changed my mind | Paired skins | roll=0 hand=Thumb swell=.02 otherTune=5 cavity=Kettle cavityTune=3 ring=12 touch=.6 bend=4 fall=.6 load=.75 thread=.6 | softbloom | - | Thumbs on threaded kettles, the note falling while a fourth comes up behind it | keys
Coin on two drums | Paired skins | roll=0 hand=Stick swell=.01 otherTune=12 cavity=Shallow cavityTune=-2 ring=3 touch=.5 place=.4 damp=.2 skin=.5 load=.7 bend=3 fall=.04 thread=.8 volume=-3.5 | after | figure | Sticks on threaded frames, dry on this side and an octave higher on the other | plucked
Hand on both doors | Paired skins | roll=0 hand=Palm swell=.01 otherTune=0 cavity=Pot cavityTune=-5 ring=12 grain=.3 touch=.5 damp=.3 bend=2 fall=.1 load=.85 thread=.8 volume=-13.5 | deep | call | Palms on threaded pots, where the hand stops one skin and not its twin | bass
Swans landing | Paired skins | roll=0 hand=Finger swell=.2 scatter=.8 otherTune=7 cavity=Shallow cavityTune=11 ring=8 touch=.5 load=.65 damp=.35 volume=-2 | lake | peal | Loose fingertips on small frames, fifths spreading after each | bell
Bonfire seen from a hill | Paired skins | cavity=None otherTune=12 roll=12 swell=.9 ring=12 touch=.4 damp=.1 skin=.7 grain=.2 width=.4 bend=3 fall=.5 volume=0 | hollow | hymn | Fingers on skins with no body, as much octave as note, with nothing under either
Kite frame | Paired skins | cavity=None otherTune=19 hand=Stick roll=10 swell=.3 ring=5 touch=.7 place=.8 scatter=.2 skin=1 bend=-1.5 fall=1.2 damp=.5 volume=-3.5 | blurred | lean | Sticks trilling on bodiless skins, thin, with twelfths stretched over them
Draughty cloister | Paired skins | cavity=None otherTune=-5 hand=Hum roll=0 swell=1 ring=6 touch=.6 scatter=.7 grain=.5 load=.78 bend=-.7 fall=.12 volume=0 | far 2.mix=.4 | open | Skins with no body hummed, a fourth below each, all air and distance | voice
Tarpaulin | Paired skins | cavity=None otherTune=-12 hand=Palm roll=15 swell=.2 ring=12 grain=.8 touch=.7 scatter=.5 damp=0 load=.5 bend=-1 fall=.4 | dead | storm | Palms flapping on skins with no body, an octave down the only weight they have | drum
Feather on a wire | Paired skins | cavity=None otherTune=24 otherSkin=.35 hand=Rub roll=0 swell=.5 ring=12 touch=.12 grain=.1 load=0.8 scatter=.2 width=.8 skin=.25 bend=-2 fall=.2 volume=6 | faintglow | cry | A thin rub on skins with no body, and two octaves above it a hair of light | string
Depth arriving late | Paired skins | otherTune=-5 otherSkin=.9 hand=Thumb roll=0 swell=.03 ring=12 cavity=Tube cavityTune=-10 touch=.5 bend=1 damp=0 load=.82 thread=.55 | trail | pedals | Thumbs on long threaded tubes, a fourth below arriving when the stroke has gone | bass
Barge and horse | Paired skins | otherTune=12 otherSkin=.8 hand=Palm roll=12 swell=.02 ring=12 cavity=Kettle cavityTune=-12 grain=.4 bend=5 fall=.2 scatter=.2 thread=.5 load=.8 | dotted | pillar | Palms plodding on huge threaded kettles, octave skins towed after | bass
Lock filling | Paired skins | otherTune=7 otherSkin=1 hand=Hum roll=2 swell=3 ring=8 cavity=Pot cavityTune=-16 touch=.5 bend=-4 fall=2.5 scatter=.3 load=.75 damp=.15 thread=.55 volume=1 | currents | hold | Wide threaded pots hummed up slowly, pitch and fifth rising together to the mark | drone
Two moons on flat sea | Paired skins | otherTune=-12 otherSkin=1 roll=20 swell=2.5 ring=12 cavity=Kettle cavityTune=0 touch=.2 place=0 skin=.25 scatter=0 load=.8 bend=-1.5 fall=1.2 volume=-2 | darkhall | lone | Fingers blurred together at the centre of dull kettles, a tone and its octave and no more
Load shared by strangers | Paired skins | otherTune=8 otherSkin=.9 load=.15 hand=Stick roll=5 swell=1 ring=5 cavity=Tube cavityTune=8 offCentre=.5 touch=.3 place=.85 bend=-.6 fall=.8 damp=.2 volume=0 | ripples | mist | Nearly bare short tubes under soft sticks, a minor sixth in the far skin, crowded and cool | texture
`,
    },
    {
      id: 'bare-thunder',
      name: 'Bare thunder',
      category: 'texture',
      rows: `
Weather one county off | Bare thunder | roll=20 swell=2.5 scatter=.9 cavityTune=-14 touch=.3 bend=2 fall=2 place=.2 otherSkin=.8 width=.95 volume=6 | far | storm | Palms on the largest bare kettles, a rumble that gathers and turns over
Barrels down the ramp | Bare thunder | roll=20 swell=.2 scatter=.6 cavity=Tube cavityTune=-6 touch=.8 grain=.9 bend=1 ring=6 otherSkin=.3 width=.3 volume=-3 | shaft | storm | Palms tumbling on bare tubes, knocking against each other | drum
Ox hide in the wind | Bare thunder | roll=12 swell=.6 scatter=1 cavity=Shallow cavityTune=-10 touch=.6 grain=.8 bend=3 fall=.3 width=0.75 otherTune=-5 thread=.95 | halfspeed | mist | Palms flapping on wide bare frames with no beat to them, a thread slapping along
Cellar door in the wind | Bare thunder | roll=6 swell=.05 scatter=.4 cavity=Pot cavityTune=-12 touch=.5 grain=.4 bend=6 fall=.4 damp=.4 otherSkin=.9 otherTune=5 width=.45 thread=.95 volume=-6 | nextdoor | storm | Bare threaded pots thumped now and then by a palm, each blow sagging in pitch | drum
Hail in a ballroom | Bare thunder | roll=20 swell=.4 scatter=.8 cavity=None touch=.7 grain=.6 bend=0 place=.9 ring=3 otherSkin=.2 otherTune=19 width=1 volume=6 | latefdn | mist | Crisp palms all over bodiless skins, all clatter
Oak coming down | Bare thunder | roll=0 swell=.01 scatter=.3 bend=9 fall=.8 ring=12 cavityTune=-6 grain=.4 otherSkin=.5 width=1 thread=.55 | valley | toll | One heavy palm on a bare kettle, falling as it rings out, gut buzzing after it | drum
Gate that will not shut | Bare thunder | roll=0 swell=.01 scatter=.8 bend=4 fall=.05 ring=5 cavity=Tube cavityTune=2 grain=.8 touch=.8 otherSkin=0 width=.15 volume=-4 | gated | hands | Palms in a loose handful on bare tubes, hard and cut short | drum
Drum of the first hill | Bare thunder | roll=0 hand=Thumb swell=.01 scatter=0 bend=12 fall=.3 ring=10 cavity=Pot cavityTune=-10 load=.15 otherSkin=.3 otherTune=7 damp=.35 volume=-1 | giant | hands | Thumbs on nearly bare pots, a deep drop with a fifth and sour overtones behind | drum
Sledge on frozen ground | Bare thunder | roll=3 hand=Stick swell=.01 scatter=.1 bend=2 fall=.1 ring=2 cavity=Shallow cavityTune=-4 damp=.3 touch=.5 grain=.5 otherSkin=.1 width=.3 thread=.75 volume=-2 | fold | hands | Sticks on bare damped frames, nearly four blows a second, flat and hard, snares on | drum
Lid dropped in the dark | Bare thunder | roll=0 hand=Finger swell=.01 scatter=1 bend=7 fall=.15 ring=7 cavity=Shallow cavityTune=2 load=.25 grain=.7 damp=.3 thread=0.7 width=.45 | cistern | hands | Whole handfuls of fingers dropped on nearly bare frames with a thread loose | drum
Starlings under tiles | Bare thunder | hand=Finger roll=18 swell=.1 scatter=1 cavity=Shallow cavityTune=14 touch=.5 ring=.6 bend=2 fall=.05 grain=.5 otherSkin=.1 skin=.4 width=1 thread=.75 volume=6 | limitroom 1.gain=12 | rain | Quick fingertips on tiny bare frames, chattering without a tune over loose gut
Rain finds the attic | Bare thunder | hand=Finger roll=5 swell=.02 scatter=1 cavity=Pot cavityTune=10 touch=.7 ring=2 bend=4 fall=.08 grain=.2 load=.2 offCentre=.3 width=.8 damp=.5 thread=.55 volume=5 | grain | rain | Single drops on small nearly bare pots, each with a little dip and a tick of gut
Ants across parchment | Bare thunder | hand=Finger roll=20 swell=.6 scatter=.9 cavity=None touch=.3 ring=.5 bend=0 grain=1 otherSkin=0 width=0.85 skin=.3 volume=6 | glass | hold | The lightest patter on bodiless skins, dry and everywhere
Pigeons leave the square | Bare thunder | hand=Finger roll=15 swell=.3 scatter=.7 cavity=Tube cavityTune=8 touch=.5 ring=1.5 bend=7 fall=.2 grain=.6 otherTune=7 width=.95 damp=.15 thread=.95 volume=1 | farecho | mist | Fingers drumming on bare threaded tubes, every key dropping at the start, wings in a courtyard
Cold water in a hot pan | Bare thunder | hand=Finger roll=20 swell=.05 scatter=.5 cavity=Kettle cavityTune=18 touch=.7 ring=1 bend=-3 fall=.1 grain=.4 skin=1 otherSkin=.3 otherTune=24 width=1 thread=.6 volume=1 | ripple | rain | Hard fast fingers on the smallest bare kettles, each key spitting upward through a thread
Sheet iron at dawn | Bare thunder | hand=Stick roll=16 swell=2 scatter=.4 cavity=Shallow cavityTune=4 touch=.4 ring=10 bend=0 skin=.8 grain=.1 otherTune=12 width=.8 thread=.6 volume=0 | common | hold | A soft stick roll on taut bare threaded frames, a sheet of clashing tone
Scrapyard angels | Bare thunder | hand=Stick roll=9 swell=.8 scatter=.8 cavity=Kettle cavityTune=13 touch=.6 ring=8 bend=0 place=.9 load=.2 otherSkin=.4 otherTune=19 width=.95 thread=.6 volume=2 | nave | mist | Sticks scattered over the rims of small nearly bare kettles, all bells and no tune, a thread astir
Tramlines in rain | Bare thunder | hand=Stick roll=20 swell=.4 scatter=.1 cavity=Tube cavityTune=-10 touch=.3 ring=3 bend=1 fall=1 otherSkin=.5 otherTune=-12 thread=.75 | lowpass | hold | A fast soft stick roll on long bare tubes, gut grinding under it | drone
Forge with the fire out | Bare thunder | hand=Stick roll=3 swell=.02 scatter=.6 cavity=Pot cavityTune=-5 touch=.5 ring=12 bend=1 fall=.5 damp=0 otherSkin=.8 otherTune=-12 grain=.3 width=1 thread=.55 volume=-3 | cavern | hold | Sticks falling on bare pots a few times a second, ringing into each other, a thread astir
Broken umbrella | Bare thunder | hand=Stick roll=14 swell=.1 scatter=.9 cavity=None touch=.45 ring=1 thread=1 bend=0 grain=.7 otherSkin=.2 skin=.4 width=.8 damp=.2 volume=6 | slips | rain | Sticks on bodiless skins with loose threads, wiry and wet
Shingle beach | Bare thunder | hand=Brush roll=4 swell=2 scatter=.8 cavity=Shallow cavityTune=2 touch=.7 grain=.9 ring=6 bend=0 otherSkin=.2 width=1 volume=6 | surf | hold | Brushes drawn over bare frames, a wash with stones in it
Lungs of the old house | Bare thunder | hand=Brush roll=8 swell=.8 scatter=.2 cavity=Tube cavityTune=-14 touch=.3 grain=.4 ring=10 bend=0 otherSkin=.7 width=.05 volume=3.5 | breath | hold | Brushes turning on the longest bare tubes, air being moved from one place to another | drone
Barley field, no moon | Bare thunder | hand=Brush roll=2 swell=1.5 scatter=1 cavity=Kettle cavityTune=-3 touch=.2 grain=.3 ring=12 bend=0 load=.35 otherTune=7 otherSkin=.6 volume=6 | throughfog | open | Slow bristles on lightly loaded kettles, dark and shifting, fifths half heard
Wings in a chimney | Bare thunder | hand=Brush roll=20 swell=.2 scatter=.6 cavity=Pot cavityTune=6 touch=.6 grain=.7 ring=3 bend=0 otherSkin=0 damp=.05 width=.95 volume=6 | stairs | mist | Brushes beating nearly twice a second in bare pots, soft and trapped
Frost heave | Bare thunder | hand=Brush roll=0 swell=1 scatter=.5 cavity=None touch=.9 grain=.5 ring=12 bend=-6 fall=2 otherSkin=.8 otherTune=-12 skin=1 width=1 volume=1 | winter | hold | Bristles pressed on bare bodiless skins, creeping up in pitch, an octave skin groaning
Ship's timber talking | Bare thunder | hand=Rub roll=3 swell=.5 scatter=.8 cavity=Tube cavityTune=-9 touch=.6 bend=-5 fall=.8 ring=6 grain=.5 otherSkin=.5 width=.8 volume=6 | toe | murmur | Bare tubes rubbed slowly until they creak up into the note
Glass harp gone wrong | Bare thunder | hand=Rub roll=0 swell=1.5 scatter=.3 cavity=Tube cavityTune=13 touch=.3 bend=0 ring=12 place=1 skin=1 otherSkin=.4 otherTune=12 load=.15 width=.9 volume=1 | spiral | lean | Short nearly bare tubes rubbed at the rim, high tones that do not agree | pad
Plough in stony ground | Bare thunder | hand=Rub roll=13 swell=.2 scatter=.6 cavity=Shallow cavityTune=-8 touch=.6 bend=3 fall=.2 ring=2 grain=1 otherSkin=.2 volume=6 | dead | hold | A hard finger scraping over bare frames about once a second
Balloon on the ceiling | Bare thunder | hand=Rub roll=0 swell=.15 scatter=.2 cavity=Pot cavityTune=12 touch=.7 bend=10 fall=1.5 ring=4 load=.4 grain=.2 otherSkin=0 width=.9 volume=6 | breathing | drops | Squeaks on small half loaded pots, sliding down for as long as they are held | voice
Seabed shifting | Bare thunder | hand=Rub roll=1 swell=3 scatter=.4 cavity=Kettle cavityTune=-18 touch=.5 bend=-2 fall=3 ring=12 load=.1 otherSkin=1 otherTune=7 width=.5 volume=1 | undertow | hold | The largest kettles, nearly bare, rubbed into motion over three seconds | drone
Power line in fog | Bare thunder | hand=Hum roll=0 swell=1 scatter=.2 cavity=Shallow cavityTune=-12 touch=.8 bend=0 ring=8 thread=.9 otherSkin=.6 grain=.2 width=.35 volume=6 | limitroom 1.gain=13 | ground | Bare frames hummed hard with a thread touching, a wide buzzing cluster | drone
Cathedral of cans | Bare thunder | hand=Hum roll=4 swell=1.5 scatter=.5 cavity=Tube cavityTune=10 touch=.6 bend=0 ring=12 otherSkin=.5 otherTune=19 load=.2 width=0.7 damp=.35 volume=5 | cath | open | Short nearly bare tubes hummed in slow pulses, a hollow tinny choir | voice
Fever before morning | Bare thunder | hand=Hum roll=11 swell=.6 scatter=.05 cavity=Kettle cavityTune=-6 touch=.4 bend=0 ring=3 offCentre=.5 load=.3 thread=.4 volume=0 | bandpulse | murmur | Lightly loaded threaded kettles hummed in a steady shake, with a soft false chord above | drone
Guard at the far end | Bare thunder | hand=Hum roll=5 swell=.2 scatter=.6 cavity=Pot cavityTune=8 touch=1 bend=4 fall=.6 ring=2 grain=.8 load=.25 otherSkin=0 width=.15 damp=.5 volume=1 | tunnel | cry | A hard hum into nearly bare pots, dropping at each start like a voice on a bad line | voice
Magnet on a string | Bare thunder | hand=Hum roll=3 swell=2 scatter=1 cavity=None touch=.5 bend=2 fall=2 ring=12 place=.8 otherSkin=1 otherTune=5 load=.1 width=.95 volume=6 | breathing | hold | Bodiless skins hummed in waves, fourths swinging in and out behind
Roots letting go | Bare thunder | hand=Thumb roll=20 swell=.8 scatter=.3 cavity=Pot cavityTune=-16 touch=.8 bend=5 fall=.5 ring=8 load=.1 otherSkin=.6 otherTune=7 width=.3 damp=.15 thread=.9 volume=-8.5 | deep | call | Thumbs on the widest threaded pots, nearly bare, thudding three times a second over a fifth | bass
Boiler at rest | Bare thunder | hand=Thumb roll=20 swell=1.5 scatter=.7 cavity=Kettle cavityTune=-2 touch=.7 bend=0 ring=12 damp=.3 load=.4 otherTune=0 thread=.5 width=0 volume=-2.5 | giant | call | Thumbs padding on half loaded damped kettles, warm and muffled, a thread stirring | bass
Earth through a wall | Bare thunder | hand=Thumb roll=0 swell=.1 scatter=0 cavity=Tube cavityTune=-16 touch=.65 bend=3 fall=1 ring=12 load=.2 otherSkin=.9 otherTune=12 skin=.6 volume=-3 | nextdoor | below | Soft thumbs on the longest nearly bare tubes, an octave skin swelling over the fall | bass
Mule train | Bare thunder | hand=Thumb roll=9 swell=.02 scatter=.5 cavity=Shallow cavityTune=-10 touch=.9 bend=2 fall=.1 ring=4 load=.3 grain=.6 otherSkin=.2 otherTune=7 thread=.5 width=1 volume=0.5 | dotted | call | Hard thumbs on big lightly loaded frames, an uneven clop with a fifth in it | drum
Belly of the tanker | Bare thunder | hand=Palm roll=8 swell=.03 scatter=.2 cavity=Kettle cavityTune=-18 touch=.4 bend=10 fall=1.5 ring=12 grain=.2 load=.1 otherSkin=1 otherTune=7 width=.15 | cave | storm | Slow palms on the hugest kettles, each note leaning down onto its key | drum
Flooded quarry | Bare thunder | load=.45 hand=Finger roll=13 swell=2 scatter=.3 offCentre=.2 bend=0 ring=10 touch=.35 cavityTune=5 otherTune=12 otherSkin=.4 thread=0.6 width=.4 volume=-1 | darkplate | veil | Half loaded kettles under soft fingers, a chord with a grey edge | pad
Rust spreading | Bare thunder | load=.3 hand=Stick roll=12 swell=3 scatter=.6 offCentre=1 bend=0 ring=12 touch=.2 cavity=Shallow cavityTune=8 otherSkin=.5 otherTune=5 thread=.95 width=.75 damp=.2 volume=3 | gen | open | Lightly loaded threaded frames under the softest sticks, every overtone split | pad
Rails humming early | Bare thunder | load=.6 hand=Rub roll=20 swell=.6 scatter=.1 offCentre=.4 bend=0 ring=4 touch=.15 cavity=Kettle thread=1 otherSkin=.3 skin=.3 otherTune=12 volume=6 | losing | ground | Half gathered kettles rubbed in quick strict turns with a thread humming on top | drone
Slag heap still warm | Bare thunder | load=.5 hand=Hum roll=0 swell=1.2 scatter=.4 offCentre=.8 bend=-1 fall=1 ring=10 touch=.5 cavity=Pot cavityTune=-6 otherTune=7 otherSkin=.7 width=.05 damp=.35 volume=-2 | fuzzroom | duet | Half loaded wide pots hummed, beating slowly, with fifths to lean on | voice
Two weathers at once | Bare thunder | load=.35 hand=Finger roll=7 swell=.6 scatter=.5 offCentre=.6 bend=-2 fall=.4 ring=6 touch=.7 cavity=Tube cavityTune=3 otherSkin=1 otherTune=12 width=.85 volume=-3.5 | stretched | tide | Lightly loaded tubes tapped unevenly, and over them octave skins in tune | pad
Chute opening | Bare thunder | hand=Palm roll=20 swell=5 scatter=.2 cavity=Pot cavityTune=2 touch=.7 bend=0 ring=10 grain=.8 otherTune=0 width=1 volume=-3 | rev | lone | Palms on bare pots coming from silence over five seconds, every slap audible
Meltwater under the road | Bare thunder | hand=Finger roll=20 swell=4 scatter=.6 cavity=Kettle cavityTune=0 touch=.6 bend=0 ring=12 load=.15 otherSkin=.8 otherTune=-5 width=.8 thread=.6 volume=1 | cavern | hold | Nearly bare kettles with a thread on them, rolled up slowly until they roar softly
Lightning far out | Bare thunder | hand=Stick roll=1 swell=.01 scatter=1 cavity=None touch=.9 bend=12 fall=.1 ring=5 grain=.4 otherSkin=1 damp=.5 volume=-1.5 | quickswell | lone | One stick stroke a second or so on bare skins, each a crack
No tracks in the sand | Bare thunder | hand=Brush roll=1 swell=2.5 scatter=.9 cavity=Shallow cavityTune=12 touch=.4 grain=.6 bend=0 ring=10 load=.2 otherSkin=.6 otherTune=24 width=.95 volume=6 | limitroom 1.gain=13 | lone | Small frames, nearly bare, brushed so slowly that the air moves first
Sandstorm from a roof | Bare thunder | hand=Brush roll=17 swell=2.5 scatter=.7 cavity=Pot cavityTune=-8 touch=.9 grain=1 bend=0 ring=3 otherSkin=.3 otherTune=-12 width=1 volume=6 | shift | hold | Brushes hissing over bare pots in fast uneven turns, thick and dry
`,
    },
    {
      id: 'thread-drones',
      name: 'Thread drones',
      category: 'drone',
      rows: `
Wire in the wheat | Thread drone | cavity=Pot thread=.8 touch=.45 swell=1 otherTune=12 otherSkin=.4 place=.6 cavityTune=3 scatter=.3 skin=.35 width=.9 load=.85 bend=-1.6 fall=.3 volume=-3.5 | hall | ground | A hum in small pots with gut on the skin, overtones buzzing along the top
One pipe still speaking | Thread drone | cavity=Pot thread=.4 touch=.4 swell=1.5 otherTune=-12 cavityTune=-10 grain=.1 scatter=.2 width=.4 bend=-.7 fall=.2 damp=.15 volume=-3.5 | stop | hold | Dark hums on wide pots over an octave, a thread lying on them | organ
Sound of the pylon | Thread drone | cavity=Shallow thread=1 touch=.85 swell=.6 otherTune=7 cavityTune=-6 ring=12 scatter=.05 width=0.8 load=.8 bend=-1.2 fall=.6 volume=2 | notch | hold | Frames hummed with the thread pulled tight, a wide hard buzz on a fifth
Nest behind the plaster | Thread drone | cavity=Kettle thread=.9 touch=.6 swell=2 otherTune=12 cavityTune=8 grain=.6 scatter=1 width=.05 load=.78 bend=-2 fall=.12 roll=11 volume=4.5 | nextdoor | hold | Small kettles hummed unevenly and shaken, the thread rattling in the voice
Hair on the string | Thread drone | cavity=None thread=.95 touch=.2 swell=.8 otherSkin=.9 otherTune=0 grain=.2 scatter=.1 ring=10 skin=.2 load=.8 bend=-1 fall=.3 volume=-2 | doubled | ground | Bodiless threaded skins hummed steadily with twin skins behind | string
Larder under the moon | Thread drone | roll=12 thread=.7 cavity=Pot touch=.5 swell=.5 otherSkin=.3 ring=1 cavityTune=-5 scatter=.05 width=.5 volume=3 | cupboard | hold | A fast even shake of a hum on pots, the thread clattering in step
Engine two fields away | Thread drone | roll=20 thread=.5 cavity=Kettle touch=.35 swell=1 ring=1.5 cavityTune=-12 scatter=.2 otherTune=0 width=.1 load=.75 bend=-.5 fall=.2 volume=-0.5 | shore | pedals | Large kettles hummed ten times a second with a soft flap of thread | bass
Pulse of the substation | Thread drone | roll=4 thread=.65 cavity=Tube touch=.8 swell=.8 ring=2 scatter=0 otherTune=7 cavityTune=-8 load=.7 volume=5.5 | throb | pillar | Tubes hummed in slow strict waves, fifths and a buzz riding them
Loose pane in the hall | Thread drone | roll=8 thread=1 cavity=Shallow touch=.4 swell=.3 ring=1 scatter=.9 cavityTune=5 grain=.4 otherSkin=.2 width=1 load=.85 volume=3.5 | limitroom 1.gain=13 | murmur | Frames shaken by an unsteady hum, the whole thread rattling | texture
Generator in the snow | Thread drone | roll=16 thread=1 cavity=None touch=.15 swell=1.5 ring=2 scatter=.3 otherSkin=1 grain=.5 skin=.2 otherTune=12 width=.35 load=.65 bend=-1.6 fall=.6 volume=1.5 | winter | hold | Skins with no body shaking quickly under a thread, octave skins above, small and cold
Gut across the well | Thread drone | hand=Finger roll=12 thread=.6 swell=1.5 cavity=Pot ring=6 touch=.5 cavityTune=-8 grain=.2 scatter=.3 width=.9 load=.78 bend=-.6 fall=.8 volume=-3 | cistern | hold | Fingers rolling on wide threaded pots, the buzz rising with the roll
March heard in sleep | Thread drone | hand=Stick roll=16 thread=.8 swell=2 cavity=Shallow ring=2 touch=.4 otherSkin=.3 otherTune=7 scatter=.1 cavityTune=-10 width=.8 load=.82 bend=-1 fall=.4 volume=6 | far | hold | A soft snare roll on big frames, with low fifths in it | texture
Corn husks | Thread drone | hand=Palm roll=14 thread=.9 swell=.6 cavity=Pot ring=12 touch=.6 grain=.5 scatter=.6 otherTune=12 load=.6 place=.85 bend=3 fall=.5 volume=-3 | shade | ground | Palms rolling at the rim of threaded pots, papery, with octaves held behind
Seeds shaken for rain | Thread drone | hand=Finger roll=6 thread=1 swell=.3 cavity=Tube ring=3 touch=.7 scatter=.8 otherSkin=.8 otherTune=-12 cavityTune=6 width=.05 load=.75 bend=-1.5 fall=1.2 volume=-0.5 | spring | open | Scattered fingers on tubes with the thread lying flat, each touch a rattle
Rope and rigging | Thread drone | hand=Thumb roll=15 thread=0.7 swell=.8 cavity=Tube ring=12 touch=.8 bend=2 fall=.4 cavityTune=-12 scatter=.2 otherTune=0 width=.5 load=.7 volume=-2.5 | sway | pillar | Thumbs on long threaded tubes twice a second and more, creaking as they give
Bow of horsehair | Thread drone | hand=Rub thread=1 swell=1.2 cavity=Pot touch=.2 ring=8 otherTune=-12 load=.6 cavityTune=-4 scatter=.15 skin=.2 width=.25 bend=-.5 fall=.12 volume=0.5 | slowbow | hold | A soft rubbed note on pots with a thread pressed on it, close to a bowed low string | string
Rusted gate at night | Thread drone | hand=Rub thread=1 swell=.4 cavity=Tube bend=-8 fall=1 touch=.25 otherSkin=.2 scatter=.6 cavityTune=-6 skin=.3 width=.95 load=.85 roll=10 volume=5.5 | stairs | cry | Tubes rubbed to and fro until they creak upward, the thread grating | texture
Wheel with a gut string | Thread drone | hand=Rub roll=9 thread=1 swell=.6 cavity=Pot touch=.25 otherTune=7 otherSkin=.8 load=1 scatter=.05 cavityTune=8 skin=.35 volume=1 | singer | ground | Pots rubbed by a turning finger, a fifth and a buzz held steady under any tune | string
Cradle by the stove | Thread drone | hand=Rub thread=1 swell=2 cavity=Kettle touch=.2 otherTune=12 cavityTune=10 ring=12 scatter=.4 place=.8 skin=.3 width=1 load=.8 bend=-1.6 fall=.3 roll=7 volume=0.5 | bowlhalo | lean | Small kettles rocked under a light finger, a thread at the loudest, octaves behind | pad
Slow tearing of linen | Thread drone | hand=Rub thread=1 swell=1.5 cavity=Pot touch=.15 grain=.6 roll=5 otherSkin=.3 otherTune=0 scatter=.8 skin=.3 width=1 load=.78 bend=-.7 fall=.2 volume=3.5 | dead | hold | A soft finger dragged round pots under a tight thread, half of it grit | texture
Straw bale choir | Thread drone | hand=Brush thread=1 roll=3 swell=1.2 cavity=Pot touch=.15 otherTune=12 ring=8 cavityTune=4 grain=.4 skin=.25 load=.7 width=.3 bend=-1.2 fall=.6 volume=3 | monks | tide | Brushes on threaded pots, rough straw around a soft chord | voice
Snares left on | Thread drone | hand=Brush thread=1 roll=12 swell=.4 cavity=Shallow touch=.4 ring=2 otherSkin=.1 grain=.6 scatter=.3 cavityTune=2 skin=.35 width=.8 bend=-2 fall=.12 volume=1.5 | deck | hymn | Brush turns just over one a second on frames with the thread left close | texture
Dry river in wind | Thread drone | hand=Brush thread=1 roll=5 swell=2.5 cavity=Kettle touch=.2 otherTune=-12 cavityTune=-16 scatter=.9 grain=.3 skin=.25 load=.82 bend=-1 fall=.3 otherSkin=1 volume=3 | limitroom 1.gain=11 | hold | The largest kettles brushed slowly, a faint buzz passing over them | wind
Wool over nails | Thread drone | hand=Brush thread=1 roll=6 swell=1.8 cavity=Kettle touch=.15 otherTune=7 otherSkin=.9 cavityTune=-5 ring=10 scatter=.1 skin=.15 width=.35 load=.75 bend=-.5 fall=.2 volume=5.5 | halo | hold | Bristles turning slowly on dull kettles, the thread muttering under a fifth
Ivy on a tin roof | Thread drone | hand=Brush thread=1 roll=6 swell=.8 cavity=None touch=.15 otherTune=24 otherSkin=.7 grain=.35 width=1 scatter=.7 skin=.3 load=.7 bend=-1.6 fall=.6 volume=5 | steprain | mist | Threaded skins with no body, brushed softly, high skins glinting | texture
Ground bass of one note | Thread drone | thread=.35 swell=.4 cavity=Shallow touch=.6 otherTune=12 cavityTune=-16 ring=3 scatter=0 load=.8 grain=.05 width=.2 | middle | below | A plain hum on the widest frames and an octave above, the thread a mere edge | bass
Low tide bell rope | Thread drone | thread=.6 hand=Thumb roll=8 swell=.1 cavity=Kettle touch=.6 bend=4 fall=.8 ring=12 cavityTune=-10 otherTune=7 width=.15 load=.85 volume=-2.5 | trail | pedals | Thumbs pulling at large kettles a little over once a second, sagging, threads astir | bass
Earth loop | Thread drone | thread=.8 swell=.2 cavity=Tube touch=1 otherSkin=0 cavityTune=-18 ring=1 scatter=.05 grain=.3 load=.95 bend=-.7 fall=.12 roll=19 | iron | pillar | The hardest fluttering hum in the longest tubes, a buzz with a dark middle | bass
Hay cart on a dry axle | Thread drone | thread=1 hand=Rub roll=14 swell=.3 cavity=Pot bend=-3 fall=.3 touch=.3 cavityTune=-12 otherSkin=.4 otherTune=7 scatter=.2 skin=.3 width=.3 load=.65 volume=0.5 | leaf | call | Low pots rubbed round a little over once a second, squeaking up through the thread | bass
Roots humming to roots | Thread drone | thread=.4 swell=3 cavity=Kettle touch=.35 otherTune=12 otherSkin=1 cavityTune=-18 ring=12 scatter=.3 width=0 load=.78 volume=3 | longdark | call | The largest kettles hummed awake over three seconds, an octave skin above, hardly a buzz | bass
Sitting with the drone | Thread drone | hand=Finger roll=2.5 thread=.75 swell=.05 cavity=Tube touch=.8 ring=12 otherTune=12 otherSkin=.7 bend=1 fall=.2 damp=0 load=1 scatter=.1 place=.7 skin=.4 width=.9 | strings | hold | Unhurried plucks of the finger on tubes, long and fizzing, octave skins kept ringing
Grains in the sandglass | Thread drone | hand=Stick roll=1 thread=.5 swell=.02 cavity=Kettle touch=.5 ring=12 otherTune=19 damp=0 scatter=.5 cavityTune=6 grain=.1 width=.8 load=.82 bend=-1 fall=.4 volume=0 | star | open | A stick on threaded kettles a little over once a second, each ring buzzing out to nothing | bell
Harvest supper far off | Thread drone | hand=Finger roll=9 thread=.5 swell=.3 cavity=Shallow touch=.6 ring=5 otherTune=7 scatter=.6 cavityTune=-3 skin=.8 load=.75 bend=3 fall=.5 volume=1 | across | waltz | Frames under busy fingers with a fifth and a rattle, a party in another barn
Gourd on a string | Thread drone | hand=Thumb roll=0 thread=.7 swell=.01 cavity=Pot touch=.7 ring=9 bend=3 fall=.2 damp=.1 otherSkin=.4 otherTune=12 cavityTune=5 scatter=0 width=.95 load=.7 volume=-13 | sustain | call | Single thumbs on threaded pots, a round note that buzzes as it opens | plucked
Scythe song | Thread drone | hand=Brush roll=9 thread=1 swell=.15 cavity=Tube touch=.2 ring=3 bend=-4 fall=.3 otherTune=12 scatter=.1 cavityTune=8 skin=.3 width=.45 load=.85 volume=4.5 | dotted | song | Short threaded tubes swept nearly once a second, each swing climbing into its note | voice
Steam from the kettle | Thread drone | cavity=Kettle thread=.55 touch=.7 swell=.6 cavityTune=0 otherTune=12 otherSkin=.8 scatter=.2 load=1 grain=.15 ring=4 width=.9 bend=-1 fall=.6 volume=-2 | chapel | duet | Kettles hummed clear with octaves, the thread a bright rim on the voice | voice
Wire between two throats | Paired skins | hand=Hum roll=0 thread=1 otherTune=7 swell=.5 cavity=Tube touch=.6 cavityTune=-3 scatter=.3 volume=3.5 | forward | duet | Tubes hummed firmly with equal fifths, the wire across both | voice
Fly in the lampshade | Hummed voice | thread=1 cavity=None cavityTune=18 touch=.25 swell=.1 scatter=1 ring=1 grain=.4 bend=3 fall=.1 place=.9 load=.5 volume=-3 | limit 1.gain=12 | rain | Short buzzing hums on half loaded skins with no body, dropping as they start | texture
Sermon through a hedge | Hummed voice | thread=.5 cavity=Pot cavityTune=4 touch=.7 swell=.2 bend=-2 fall=.2 roll=7 scatter=.7 grain=.5 width=.15 load=.65 volume=5.5 | static | murmur | Shaky hums in small pots behind a thread, climbing into each word | voice
Choir of combs | Hummed voice | thread=1 cavity=Tube cavityTune=11 touch=.5 swell=.4 load=1 scatter=.3 otherSkin=.5 otherTune=12 width=0.75 skin=.4 bend=-.5 fall=.12 roll=10 volume=1 | stop | hymn | Shaken hums in short tubes with paper on every mouth | organ
Needle at the run-out | Thread drone | thread=.65 hand=Finger roll=5 swell=.8 load=.5 cavity=Pot touch=.6 ring=1 scatter=.3 otherTune=0 cavityTune=3 width=.95 bend=-1 fall=.4 volume=1 | pressing | hold | Half loaded pots tapped round and round with a thread on them, after the tune is over | texture
Marsh under the moon | Thread drone | thread=.4 load=.6 swell=2 cavity=Kettle touch=.5 offCentre=.9 otherTune=-12 scatter=.9 ring=12 cavityTune=4 width=.9 bend=-.7 fall=.2 volume=-3 | currents | open | Not quite loaded kettles hummed loosely, pairs beating, octaves below | pad
Cable worn through | Thread drone | thread=1 load=.3 swell=.5 cavity=Tube touch=.6 roll=6 scatter=.4 otherSkin=.3 otherTune=1 ring=2 bend=-1.2 fall=.6 volume=6 | static | hold | Lightly loaded tubes in a sour shaking hum, the thread hard on
Thorns along the lane | Thread drone | thread=1 load=0 hand=Rub swell=1 cavity=Shallow touch=.12 bend=-3 fall=1.5 otherTune=5 scatter=.5 cavityTune=-10 skin=.2 width=1 roll=12 volume=6 | reflect | mist | Bare frames rubbed under a thread, scratchy tones that rise and catch | texture
Iron bed in a stone room | Thread drone | thread=.6 load=.4 hand=Stick roll=7 swell=.4 cavity=None touch=.4 otherSkin=.9 otherTune=-12 scatter=.5 skin=.9 width=.8 bend=-.6 fall=.8 volume=-2 | tank | hold | Sticks rattling on bodiless threaded skins, half loaded, octave skins groaning beneath | texture
Stairwell of reeds | Thread drone | thread=.85 hand=Finger roll=19 scatter=0 swell=1 cavity=Tube touch=.5 load=1 otherTune=12 ring=3 cavityTune=5 otherSkin=.5 width=.95 volume=-1 | stairs | hymn | A fast strict roll on threaded tubes, nearly a reed, with its octave | organ
Smoke from a candle | Thread drone | thread=.75 swell=3 cavity=Pot touch=.15 otherTune=19 otherSkin=.8 cavityTune=10 scatter=.6 grain=.5 width=.85 load=.78 bend=-1 fall=.3 roll=3 volume=-0.5 | mist | lone | A soft breathy hum waving in small pots, a twelfth above, the thread just stirring | wind
Barge horns at the bend | Thread drone | thread=.8 swell=.1 cavity=Tube bend=-5 fall=.5 touch=.9 otherTune=12 cavityTune=-4 ring=3 scatter=.05 load=1 volume=-3 | farecho | call | A hard low hum in tubes that heaves up into each note, buzzing | bass
Threads of rain | Thread drone | thread=.5 hand=Finger roll=10 scatter=1 swell=.6 cavity=Shallow touch=.4 ring=4 otherTune=12 otherSkin=.6 cavityTune=12 width=1 load=.8 bend=3 fall=.5 volume=4 | afterimage | veil | Loose soft fingers on small threaded frames, a fine rustle round a chord | pad
Last light on wire | Thread drone | thread=1 hand=Rub swell=4 cavity=Shallow touch=.15 otherTune=24 otherSkin=.6 cavityTune=10 place=.8 ring=12 scatter=.3 skin=.4 width=.4 bend=-1.6 fall=.6 volume=1.5 | thintail | lone | Small threaded frames rubbed near the rim, four seconds in coming, skins two octaves up | pad
`,
    },
    {
      id: 'plucked-skins',
      name: 'Plucked skins',
      category: 'plucked',
      rows: `
Nail on a tight frame | Plucked skin | ring=2 touch=.45 place=.7 cavityTune=-5 skin=.5 bend=3 fall=.02 grain=.1 otherSkin=0 width=.2 damp=.2 load=.8 thread=.5 volume=2 | bare | figure | Damped threaded frames flicked with the nail, short and bright, with a quick chirp
Lemon tree in a pot | Plucked skin | ring=4 touch=.65 place=.15 cavityTune=-4 skin=.5 bend=2.5 otherTune=19 otherSkin=.4 load=1 fall=.06 width=.45 volume=-1.5 | chamber | waltz | Open frames plucked near the middle, sweet and plain, with a twelfth behind
Washing line | Plucked skin | ring=8 touch=.8 place=.75 cavityTune=-12 skin=.95 bend=2 fall=.15 width=0.85 offCentre=.5 load=.75 thread=.55 volume=0.5 | two | - | Big tight frames plucked and left swinging, overtones in slow pairs, gut across them
Sand on the fingerboard | Plucked skin | ring=1 touch=.45 place=.5 cavityTune=2 skin=.5 grain=.9 damp=.7 scatter=.3 otherSkin=0 load=.6 width=.1 thread=.75 volume=3 | cassette | rain | Damped frames fingered loosely over a thread, gritty and quick to stop
White pebble | Plucked skin | ring=1.5 touch=.5 place=.3 cavityTune=12 skin=.7 load=1 offCentre=0 bend=-.5 otherSkin=0 grain=.05 fall=.04 width=.3 volume=0 | dotted | figure | Small frames plucked near the middle, clean and round
Lute in a cloister | Plucked skin | cavity=Tube cavityTune=-3 ring=7 touch=.8 place=.6 load=1 bend=.5 damp=.1 otherSkin=.3 otherTune=12 offCentre=.05 width=.4 volume=0 | stairs | duet | Tubes plucked firmly, a nasal string with a hollow behind it | string
Banjo on the boat | Plucked skin | cavity=Tube cavityTune=8 ring=1.2 touch=.6 place=.8 skin=.5 bend=1.5 fall=.03 damp=.2 otherSkin=0 thread=.85 width=.8 load=.7 volume=2.5 | wood | figure | Short threaded tubes flicked at the rim, twanging and gone
Fig leaves | Plucked skin | cavity=Tube cavityTune=2 ring=4 touch=.4 place=.35 load=1 bend=-1.5 fall=.1 otherSkin=.6 otherTune=7 grain=.15 thread=.4 | spring | waltz | Softly plucked threaded tubes with fifths, each note leaning up into place
Small hands in reeds | Plucked skin | cavity=Tube cavityTune=14 ring=3 touch=.3 place=.5 scatter=.5 bend=2 fall=.05 otherTune=24 otherSkin=.3 skin=.4 width=.95 load=.85 thread=.6 volume=0 | stone | drops | Loose fingers on tiny threaded tubes, a few touches to a key
Zither on a shelf | Plucked skin | cavity=Tube cavityTune=-10 ring=12 touch=.9 place=.75 load=.95 offCentre=.4 damp=0 bend=0 otherSkin=.5 otherTune=19 width=.85 volume=-1 | longplate | toll | Long tubes plucked bright and left to ring, twelfths along the shelf | string
Pizzicato in the larder | Plucked skin | cavity=Pot cavityTune=-2 ring=1.5 touch=.5 place=.35 bend=1 fall=.04 damp=.3 load=0.75 otherSkin=0 width=.45 volume=1.5 | dead | figure | Damped pots plucked short, plain and woody
Apricot stones | Plucked skin | cavity=Pot cavityTune=10 ring=.8 touch=.8 place=.6 bend=3 fall=.03 skin=.6 grain=.3 thread=.5 load=.6 width=.1 volume=4.5 | limit 1.gain=10 | rain | Small threaded pots flicked quickly, each with a gulp at the front
Mandola with one course | Plucked skin | cavity=Pot cavityTune=4 ring=3 touch=.75 place=.9 bend=.5 load=.7 offCentre=1 otherSkin=.5 otherTune=12 skin=.6 thread=.5 volume=0.5 | reel | waltz | Threaded pots plucked bright with the overtones in beating pairs, as courses of strings do | string
Drip under the bridge | Plucked skin | cavity=Pot cavityTune=15 ring=3 touch=.75 place=.8 bend=-5 fall=.04 otherSkin=.9 otherTune=19 skin=.6 width=.3 load=.65 thread=.95 volume=-1 | cave | drops | The smallest pots plucked so that every note jumps up as it lands, with a spit of thread
Olive press | Plucked skin | cavity=Pot cavityTune=-12 ring=4 touch=.7 place=.2 bend=4 fall=.2 damp=.1 grain=.5 otherSkin=.2 thread=.45 load=.75 width=.1 | thump | ask | Large pots plucked at the centre, heavy drops for low keys | bass
Harp in the boiler room | Plucked skin | cavity=Kettle cavityTune=4 ring=8 touch=.6 place=.5 bend=0 load=1 damp=0 otherSkin=.4 otherTune=12 width=.25 volume=-1.5 | bowed | veil | Kettles left open, long and smooth, octaves behind | string
Copper strings at dusk | Plucked skin | cavity=Kettle cavityTune=14 ring=2.5 touch=.65 place=.8 bend=.5 skin=1 offCentre=.4 otherSkin=.2 load=.55 damp=.4 thread=.45 width=.8 volume=4 | chorus | figure | Small threaded kettles flicked at the rim and half stopped, fine metal under the nails
Lamp oil and lavender | Plucked skin | cavity=Kettle cavityTune=-5 ring=5 touch=.25 place=.25 bend=0 skin=.4 otherSkin=.6 otherTune=7 offCentre=0 load=.78 | wool | waltz | Soft plucks at the middle of kettles, all roundness, a fifth in each
Stars in a puddle | Plucked skin | cavity=Kettle cavityTune=18 ring=2 touch=.8 place=.95 scatter=.4 bend=-2 fall=.06 otherTune=24 otherSkin=.5 skin=1 width=.95 load=.82 roll=3.5 thread=.6 volume=0 | points | drops | Tiny threaded kettles touched at the rim again and again, glinting two octaves up
Hammock | Plucked skin | cavity=Kettle cavityTune=1 ring=10 touch=.5 place=.6 bend=3 fall=1 offCentre=.2 damp=0 otherSkin=.3 otherTune=0 width=.45 load=.75 | pan | - | Kettles plucked so that each note swings down for a second
Thumb on spring steel | Dry hand keys | hand=Thumb ring=8 damp=.1 touch=.85 place=.7 load=1 skin=.9 grain=.2 bend=0 volume=6 | hollow | figure | Hard thumbs on skins with no body, thin tongues of tone
Tongues of tin | Dry hand keys | ring=12 damp=0 touch=.6 place=.5 load=.6 skin=.8 bend=.5 fall=.05 offCentre=.5 otherSkin=.5 otherTune=24 | bowlhalo 1.mix=.22 | drops | Skins with no body plucked open and left beating, two octaves chiming with them
Bird bones | Dry hand keys | ring=2 damp=.2 touch=.35 place=.65 load=.7 skin=.4 bend=2 fall=.02 grain=.05 width=1 roll=5 scatter=.5 offCentre=1 volume=6 | limit 1.gain=9 | drops | Bodiless skins flicked over and over toward the edge, brittle and not quite in order
Cricket on the sill | Dry hand keys | ring=1 damp=.1 touch=.45 place=.6 load=.9 scatter=.7 bend=4 fall=.02 grain=.4 skin=.45 roll=8 volume=6 | limit 1.gain=13 | drops | Scattered nails on short skins with no body, chirping while a key is down
Rope swing | Dry hand keys | ring=12 damp=.05 touch=.5 place=.35 load=.8 bend=-2 fall=.25 otherSkin=.9 otherTune=-12 skin=.7 | slap | song | Plucked skins with no body that swing up into tune over octave skins
Thumb on a slow river | Speaking bass | bend=1 fall=.2 ring=12 damp=.1 cavity=Shallow cavityTune=-8 touch=.85 place=.6 otherSkin=.4 otherTune=12 width=.6 thread=.4 load=.8 volume=5 | lpg | song | Thumbs drawn off low frames, full and unforced, an octave ringing on | string
Oud maker's bench | Speaking bass | bend=3 fall=.08 ring=5 damp=.2 cavity=Pot cavityTune=2 touch=.95 load=1 grain=.35 otherSkin=0 skin=.8 thread=.45 volume=1.5 | fold | ask | Hard thumbs on pots, a dark plucked string with a catch and a buzz at the start
One finger in the cellar | Speaking bass | hand=Finger bend=.5 fall=.1 ring=9 damp=.15 cavity=Tube cavityTune=-9 touch=.75 load=1 place=.5 thread=.85 volume=-1.5 | wood | walk | Firm fingers on long threaded tubes, woody and low | bass
Stone in the keelson | Speaking bass | bend=6 fall=.1 ring=3 damp=.4 cavity=Kettle cavityTune=-3 touch=.8 grain=.5 otherSkin=.3 otherTune=0 load=.85 thread=.6 | lpg | heart | Thumbs flicked on damped threaded kettles, each a short low knock that drops | bass
Cord under the floor | Speaking bass | bend=-3 fall=.12 ring=8 damp=.1 cavity=Tube cavityTune=4 touch=.7 thread=.6 otherSkin=.4 otherTune=7 load=.65 | triode | call | Thumbs on tubes that slide up and buzz, with a fifth in the far skin | bass
Hammers on gut | Kettle bells | cavity=Shallow cavityTune=-6 ring=6 touch=.3 place=.85 load=.65 offCentre=.6 damp=.05 otherSkin=.4 otherTune=12 thread=.5 skin=.5 volume=0.5 | brightplate | figure | Soft sticks toward the rim of low threaded frames, doubled overtones shimmering | string
Salt on a tight string | Kettle bells | cavity=Tube cavityTune=2 ring=4 touch=.15 place=.6 load=.95 skin=.25 damp=.1 grain=.3 bend=-.6 fall=.2 thread=.6 volume=2 | seven | drops | Soft sticks near the rim of threaded tubes, small dry points
Slate and silk | Kettle bells | cavity=Pot cavityTune=7 ring=5 touch=.25 place=.5 load=1 skin=.4 offCentre=.3 otherSkin=.6 otherTune=19 bend=3 fall=.04 volume=-3 | felt | waltz | Padded sticks on small dull pots, twelfths folding in behind each note
Wire over a bridge | Kettle bells | cavity=None ring=9 touch=.12 place=.5 load=1 skin=.3 bend=1 fall=.03 thread=.65 damp=.1 volume=-1 | room | figure | Sticks on bodiless skins with a thread lying on them, thin struck wire
Seven sparks | Kettle bells | roll=0 cavity=Shallow cavityTune=9 ring=3 touch=.2 place=.65 scatter=.6 load=.6 otherTune=19 otherSkin=.5 skin=.35 bend=-.4 fall=.08 thread=.55 volume=0 | prism | drops | Light sticks on small threaded frames, sparks in a loose handful
Bent by the wind | Plucked skin | bend=-7 fall=.3 ring=6 cavity=Shallow cavityTune=-8 touch=.8 place=.7 damp=.1 otherSkin=.2 thread=.5 load=.8 width=.4 volume=0.5 | breeze | song | Frames plucked low and pulled up to the note by a slow finger | string
Down the window | Plucked skin | bend=9 fall=.5 ring=8 cavity=Tube cavityTune=5 touch=.5 place=.5 otherSkin=.3 otherTune=12 skin=.45 width=.85 volume=3 | slowbow | cry | Tubes plucked above the note, the pitch running down for half a second | string
Loosened peg | Plucked skin | bend=4 fall=2.5 ring=12 cavity=Pot cavityTune=-3 touch=.7 place=.6 damp=0 load=1 otherSkin=.4 otherTune=0 thread=.4 | sag | duet | Pots plucked while the note sinks slowly against an unmoving twin
Garden hose | Plucked skin | bend=-12 fall=.06 ring=2 cavity=Kettle cavityTune=9 touch=.9 place=.5 skin=.6 thread=.4 width=.1 load=.78 volume=0 | octhop | drops | Kettles flicked from far below, each a quick upward spurt
Elastic and card | Plucked skin | bend=12 fall=.04 ring=1.5 cavity=None touch=.7 place=.85 thread=.95 damp=.3 grain=.5 load=.6 width=.3 volume=-1 | tin | hands | Threaded skins with no body, snapped so that they dive and buzz | drum
Buzzing lute | Plucked skin | thread=.4 cavity=Pot cavityTune=3 ring=7 touch=.9 place=.75 load=1 bend=1 otherSkin=.5 otherTune=12 width=.25 | overt | waltz | Pots plucked hard under a thread, the buzz fading before the note does | string
Wasps in the fruit | Plucked skin | thread=.9 cavity=Tube cavityTune=11 ring=3 touch=.3 place=.5 bend=2 fall=.05 otherSkin=.2 scatter=.2 skin=.3 width=.3 load=.82 volume=1 | shift | rain | Short threaded tubes, every pluck a rattle
Gut under the fingers | Plucked skin | thread=.6 cavity=Shallow cavityTune=-2 ring=5 touch=.6 place=.65 load=1 skin=.8 otherTune=7 otherSkin=.7 bend=.3 | latevib | duet | Threaded frames with a fifth in the far skin, fingered plainly | string
Lute gone out of tune | Plucked skin | otherTune=.4 otherSkin=.9 cavity=Tube cavityTune=-1 ring=6 touch=.75 place=.6 load=1 bend=0 offCentre=.3 width=0.7 thread=.6 | flock | waltz | Plucked threaded tubes whose second skins are just sharp, a slow sour beat | string
Moonlit abacus | Plucked skin | otherTune=24 otherSkin=.8 cavity=Pot cavityTune=12 ring=2 touch=.5 place=.2 bend=0 skin=.5 damp=.6 load=.7 width=.8 roll=6 volume=-1 | reflect | figure | Small soft pots counted six to the second, a bead of light two octaves over each
Tremolo at the gate | Plucked skin | roll=15 scatter=.2 swell=.02 ring=1.5 cavity=Pot cavityTune=6 touch=.9 place=.75 load=1 bend=0 otherTune=12 otherSkin=.3 width=.4 volume=4 | halo | song | A quick even tremolo of nails on small pots, sung as one line | string
Crickets at the hammer | Plucked skin | roll=11 scatter=.6 swell=.01 ring=2 cavity=Shallow cavityTune=6 touch=.2 place=.65 damp=.1 skin=.4 thread=.75 width=.95 load=.75 volume=1.5 | orbit | drops | Small threaded frames flicked over and over while a key is down, unevenly
Asleep in the bandstand | Plucked skin | roll=8 scatter=.4 swell=.3 ring=4 cavity=Tube cavityTune=1 touch=.4 place=.5 load=1 otherTune=12 otherSkin=.5 volume=4 | trem | song | A drowsy tremolo of soft fingers on tubes with octaves behind | string
Breath plucked short | Hummed voice | swell=.01 touch=1 cavity=Shallow cavityTune=3 ring=6 damp=.3 bend=3 fall=.05 grain=.3 scatter=.1 otherSkin=.5 otherTune=12 width=.05 load=.7 volume=-0.5 | pair | figure | Hums cut to the length of a pluck on frames, a little bend at the front of each | voice
Squeak and gone | Rubbed moan | swell=.01 touch=.5 cavity=Pot cavityTune=9 ring=5 bend=-6 fall=.08 load=0.7 grain=.3 place=.7 scatter=.1 width=.45 volume=6 | mirror | rain | Fingers dragged for an instant over small pots, short upward squeaks
`,
    },
  ],
}
