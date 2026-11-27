import { type InstrumentSet } from './set'

// Laid out by what is left behind: each direction is a kind of looking (a lamp, a stroke, a voice,
// a bass, a blink) in ten corners of five, and the corner says which opposite follows it, how soon
// and how far off. The phrases leave rests, for the opposite is heard where the note is not.

export const SET: InstrumentSet = {
  device: 'closed-eyes',
  names: {
    source: ['Lamp', 'Reed', 'Bowl', 'Vowel', 'Struck', 'String'],
    opposite: ['Even', 'Mirror', 'Sides', 'Rough', 'Breath', 'Below'],
    memory: ['Note', 'Octave', 'Chord'],
    safe: ['Stay', 'Move'],
  },
  chains: {
    bare: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Open', params: { clear: 0.25 } }],
      words: ', close and dry',
    },
    keyed: { effects: [{ deviceId: 'ambient-eq', preset: 'Keys' }], words: ', dry and plain' },
    shaded: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Shaded' }],
      words: ', dry, the top in shade',
    },
    warm: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Warm' },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: ', dry and warm',
    },
    thinned: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 160, highCut: 6500 } }],
      words: ', dry and thinned out',
    },
    brightened: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Bright', params: { presence: 3, air: 4 } },
        { deviceId: 'tamer', preset: 'Gentle' },
      ],
      words: ', dry and bright',
    },
    deepened: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 5 } },
        { deviceId: 'analog-drive', preset: 'First hint' },
      ],
      words: ', dry and deep',
    },
    muffled: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 1800 } }],
      words: ', muffled by a blanket',
    },
    sidelit: {
      effects: [{ deviceId: 'spread', preset: 'Air only' }],
      words: ', dry, the air out at the sides',
    },
    wide: {
      effects: [
        { deviceId: 'spread', preset: 'Wide pad' },
        { deviceId: 'tamer', preset: 'Gentle' },
      ],
      words: ', dry and wide',
    },
    hazy: {
      effects: [
        { deviceId: 'spread', preset: 'Hazy edges' },
        { deviceId: 'ambient-eq', preset: 'Distant', params: { presence: -3, air: -4 } },
      ],
      words: ', dry with hazy edges',
    },
    narrow: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Narrow' },
        { deviceId: 'ambient-eq', preset: 'Open' },
      ],
      words: ', dry and narrow',
    },
    mono: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Mono' },
        { deviceId: 'tape', preset: 'Warm thump' },
      ],
      words: ', down the middle on warm tape',
    },
    doubled: {
      effects: [{ deviceId: 'stereo-detune', preset: 'Doubled', params: { mix: 0.32 } }],
      words: ', doubled at both sides',
    },
    halo: {
      effects: [{ deviceId: 'stereo-detune', preset: 'Soft halo' }],
      words: ', in a soft halo of detune',
    },
    desk: {
      effects: [{ deviceId: 'analog-drive', preset: 'Console', params: { output: -2 } }],
      words: ', through a mixing desk',
    },
    iron: {
      effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }],
      words: ', through heavy iron',
    },
    valve: {
      effects: [
        { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 7, mix: 0.6 } },
        { deviceId: 'ambient-eq', preset: 'Keys' },
      ],
      words: ', through a warm valve',
    },
    bite: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Bite', params: { mix: 0.45 } },
        { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 5200 } },
      ],
      words: ', with a bitten edge',
    },
    fold: {
      effects: [
        { deviceId: 'saturator', preset: 'Folded glass', params: { mix: 0.22 } },
        { deviceId: 'ambient-eq', preset: 'Keys' },
      ],
      words: ', with a folded glassy edge',
    },
    reel: { effects: [{ deviceId: 'tape', preset: 'Quarter inch' }], words: ', on open reel tape' },
    cassette: {
      effects: [{ deviceId: 'tape', preset: 'Cassette four-track' }],
      words: ', on a soft cassette',
    },
    worn: {
      effects: [{ deviceId: 'tape', preset: 'Worn thin', params: { age: 0.6, hiss: 0.2 } }],
      words: ', on tape worn thin',
    },
    booth: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Small booth' }],
      words: ', in a small booth',
    },
    chamber: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber' }],
      words: ', in a tight chamber',
    },
    room: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience' }],
      words: ', in a small room',
    },
    parlour: {
      effects: [
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
        { deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.1 } },
      ],
      words: ', in a parlour, on tape',
    },
    stub: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Tight room' }],
      words: ', with a short plate',
    },
    boards: {
      effects: [{ deviceId: 'vessel', preset: 'Hint of wood', params: { mix: 0.35 } }],
      words: ', on a wooden board',
    },
    tube: {
      effects: [{ deviceId: 'vessel', preset: 'Glass tube', params: { mix: 0.35 } }],
      words: ', down a glass tube',
    },
    jar: {
      effects: [
        { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.45 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', inside a clay pot',
    },
    held: {
      effects: [
        { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 6 } },
      ],
      words: ', close and held level',
    },
    forward: {
      effects: [
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 6 } },
      ],
      words: ', dry and held forward',
    },
    glue: {
      effects: [
        { deviceId: 'ambient-comp', preset: 'Glue' },
        { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 1.5, air: -2 } },
      ],
      words: ', dry and drawn together',
    },
    combo: {
      effects: [{ deviceId: 're-amp', preset: 'Combo in a room', params: { noise: 0.02 } }],
      words: ', through a small amplifier',
    },
    pillow: {
      effects: [{ deviceId: 're-amp', preset: 'Pillow speaker', params: { noise: 0 } }],
      words: ', from a speaker under a pillow',
    },
    bedside: {
      effects: [{ deviceId: 're-amp', preset: 'Bedside radio', params: { noise: 0.03 } }],
      words: ', from a bedside speaker',
    },
    tails: {
      effects: [
        { deviceId: 'lift', preset: 'Long tails', params: { limit: 12 } },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 0 } },
      ],
      words: ', dry, the tails drawn up',
    },
    faintup: {
      effects: [{ deviceId: 'reveal', preset: 'Overtones', params: { amount: 0.6, range: 15 } }],
      words: ', with the faint partials drawn out',
    },
    felted: {
      effects: [{ deviceId: 'sift', preset: 'Soft hammers' }],
      words: ', the onsets felted over',
    },
    eased: {
      effects: [
        { deviceId: 'swell', preset: 'Soft pick' },
        { deviceId: 'ambient-eq', preset: 'Open' },
      ],
      words: ', dry, the edges eased',
    },
    amptrem: {
      effects: [
        { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.45 } },
        { deviceId: 'spring-reverb', preset: 'Hint of spring' },
      ],
      words: ", with an amplifier's tremolo and spring",
    },
    harmtrem: {
      effects: [{ deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { depth: 0.6 } }],
      words: ', under a harmonic tremolo',
    },
    swelltrem: {
      effects: [
        { deviceId: 'tremolo', preset: 'Sea swell', params: { depth: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', rising and sinking like swell',
    },
    panned: {
      effects: [
        { deviceId: 'tremolo', preset: 'Slow pan', params: { depth: 0.6 } },
        { deviceId: 'plate-reverb', preset: 'Faint sheen' },
      ],
      words: ', crossing slowly from side to side',
    },
    rotor: {
      effects: [{ deviceId: 'rotary', preset: 'Chorale' }],
      words: ', through a slow rotor',
    },
    fastrotor: {
      effects: [
        { deviceId: 'rotary', preset: 'Tremolo', params: { mix: 0.6 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', through a fast rotor',
    },
    drum: {
      effects: [{ deviceId: 'rotary', preset: 'Dark drum' }],
      words: ', through a slow dark drum',
    },
    chorus: {
      effects: [{ deviceId: 'chorus', preset: 'Slow drift' }],
      words: ', in a slow chorus',
    },
    ensemble: {
      effects: [
        { deviceId: 'chorus', preset: 'Lush ensemble' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', in a lush ensemble',
    },
    hollowed: {
      effects: [
        { deviceId: 'chorus', preset: 'Hollow swell', params: { mix: 0.4 } },
        { deviceId: 'ambient-eq', preset: 'Open' },
      ],
      words: ', in a hollow slow chorus',
    },
    swirl: {
      effects: [{ deviceId: 'phaser', preset: 'Slow swirl' }],
      words: ', through a slow phaser',
    },
    glacier: {
      effects: [
        { deviceId: 'phaser', preset: 'Glacial sweep', params: { feedback: 40 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', under a glacial sweep',
    },
    flange: {
      effects: [{ deviceId: 'flanger', preset: 'Gentle sweep', params: { mix: 0.35 } }],
      words: ', through a gentle flanger',
    },
    waters: {
      effects: [{ deviceId: 'currents', preset: 'Slow water' }],
      words: ', in bands that move like slow water',
    },
    ripples: {
      effects: [
        { deviceId: 'currents', preset: 'Ripples', params: { depth: 0.55 } },
        { deviceId: 'plate-reverb', preset: 'Faint sheen' },
      ],
      words: ', in small ripples',
    },
    glimmer: {
      effects: [{ deviceId: 'glimmer', preset: 'Light on water' }],
      words: ', the partials glimmering in turn',
    },
    weathers: {
      effects: [
        { deviceId: 'glimmer', preset: 'Slow weather' },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', broad parts clouding over',
    },
    vibrato: {
      effects: [
        { deviceId: 'late-vibrato', preset: 'Slow bow' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', with a late vibrato, in a room',
    },
    circle: {
      effects: [{ deviceId: 'around', preset: 'Slow circle', params: { radius: 0.7 } }],
      words: ', circling slowly round the head',
    },
    sway: {
      effects: [
        { deviceId: 'around', preset: 'Gentle sway' },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', swaying before you in a room',
    },
    lungs: {
      effects: [{ deviceId: 'breath', preset: 'Calm breath' }],
      words: ', breathing slowly in and out',
    },
    opening: {
      effects: [
        { deviceId: 'breath', preset: 'Opening wide' },
        { deviceId: 'ambient-eq', preset: 'Open' },
      ],
      words: ', opening wide with each breath',
    },
    throb: {
      effects: [{ deviceId: 'pulses', preset: 'Soft throb' }],
      words: ', in a soft even throb',
    },
    answering: {
      effects: [
        { deviceId: 'pulses', preset: 'Left then right' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', thrown left, then right',
    },
    bandpulse: {
      effects: [
        { deviceId: 'band-pulse', preset: 'Four a second', params: { depth: 0.6 } },
        { deviceId: 'ambient-eq', preset: 'Open' },
      ],
      words: ', the middle pulsing four to the second',
    },
    gatefilter: {
      effects: [
        {
          deviceId: 'auto-filter',
          preset: 'Low-pass gate',
          params: { cutoffHz: 650, envAmount: 45, envReleaseMs: 500 },
        },
      ],
      words: ', through a filter that opens to touch',
    },
    notch: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Slow notch' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', a notch wandering through',
    },
    flock: {
      effects: [{ deviceId: 'murmuration', preset: 'Two close by' }],
      words: ', two others close by',
    },
    shiftdrift: {
      effects: [{ deviceId: 'freq-shifter', preset: 'Moving beat', params: { mix: 0.4 } }],
      words: ', beating slowly across the stereo',
    },
    losing: {
      effects: [
        { deviceId: 'winding-down', preset: 'Losing pace', params: { depth: 0.55 } },
        { deviceId: 'ether-reverb', preset: 'Faint air' },
      ],
      words: ', in a pulse that loses pace',
    },
    repeats: {
      effects: [{ deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.28 } }],
      words: ', with warm tape repeats',
    },
    dotted: {
      effects: [{ deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.26 } }],
      words: ', with a dotted echo',
    },
    slap: {
      effects: [{ deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.28 } }],
      words: ', with a single tape slap',
    },
    threeheads: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.26 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', through three tape heads',
    },
    darktrail: {
      effects: [{ deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.26 } }],
      words: ', with a long dark trail of echo',
    },
    darkecho: {
      effects: [{ deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.26 } }],
      words: ', with dark soft echoes',
    },
    stones: {
      effects: [{ deviceId: 'skipping-stone', preset: 'Skipping stone', params: { mix: 0.28 } }],
      words: ', in echoes closing like a skipped stone',
    },
    slowing: {
      effects: [
        { deviceId: 'skipping-stone', preset: 'Slowing bounces', params: { mix: 0.26 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', in echoes that slow as they go',
    },
    stars: {
      effects: [{ deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.28 } }],
      words: ', scattered in seven echoes',
    },
    farstar: {
      effects: [
        { deviceId: 'constellation', preset: 'One far star', params: { mix: 0.28 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', with one far echo',
    },
    prism: {
      effects: [{ deviceId: 'prism', preset: 'Slow unfolding', params: { time: 1600, mix: 0.3 } }],
      words: ', unfolding from low to high',
    },
    highfirst: {
      effects: [{ deviceId: 'prism', preset: 'High to low', params: { mix: 0.3 } }],
      words: ', the echoes falling from high to low',
    },
    canon: {
      effects: [
        { deviceId: 'canon', preset: 'Faint answer', params: { mix: 0.28 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', answered in kind a moment later',
    },
    backwards: {
      effects: [{ deviceId: 'reverse-delay', preset: 'Backwards echo', params: { mix: 0.3 } }],
      words: ', with backwards echoes',
    },
    darkback: {
      effects: [{ deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.32 } }],
      words: ', with slow backward swells',
    },
    phasing: {
      effects: [{ deviceId: 'orbits', preset: 'Slow phasing', params: { mix: 0.26 } }],
      words: ', in loops that drift out of step',
    },
    recall: {
      effects: [{ deviceId: 'echo-memory', preset: 'Hazy past', params: { mix: 0.32 } }],
      words: ', with hazy recollections of before',
    },
    tiles: {
      effects: [{ deviceId: 'cascade', preset: 'Slow tiles', params: { mix: 0.22 } }],
      words: ', in slow stacked octaves',
    },
    glints2: {
      effects: [
        { deviceId: 'grain-delay', preset: 'Faint glints', params: { mix: 0.16 } },
        { deviceId: 'ether-reverb', preset: 'Faint air' },
      ],
      words: ', with faint high glints after',
    },
    embers: {
      effects: [{ deviceId: 'grain-delay', preset: 'Falling embers', params: { mix: 0.22 } }],
      words: ', with embers falling an octave below',
    },
    bed: {
      effects: [{ deviceId: 'micro-looper', preset: 'Soft bed', params: { mix: 0.22 } }],
      words: ', over a soft looped bed',
    },
    hall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.26 } }],
      words: ', in a hall',
    },
    darkhall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.28 } }],
      words: ', in a dark hall',
    },
    cathedral: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.28 } }],
      words: ', in a cathedral',
    },
    chapel: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.26 } }],
      words: ', in a small singing chapel',
    },
    nave: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.25 } }],
      words: ', in a vast nave',
    },
    faraway: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.5 } }],
      words: ', from far away',
    },
    undertow: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.28 } }],
      words: ', over a warm undertow of hall',
    },
    plate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.24 } }],
      words: ', on a plate',
    },
    longplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.28 } }],
      words: ', on a long plate',
    },
    darkplate: {
      effects: [
        { deviceId: 'tape', preset: 'Under a blanket', params: { hiss: 0.05 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.26 } },
      ],
      words: ', on a dark plate, under a blanket',
    },
    brightair: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.26 } }],
      words: ', in bright air',
    },
    cave: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.3 } }],
      words: ', in a dark cave',
    },
    valley: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.28 } }],
      words: ', across an open valley',
    },
    late: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Late arrival', params: { mix: 0.28 } }],
      words: ', with a room that answers late',
    },
    openspace: {
      effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.28 } }],
      words: ', in a wide open space',
    },
    thinair: {
      effects: [{ deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.26 } }],
      words: ', in thin high air',
    },
    quickswell: {
      effects: [{ deviceId: 'expanse', preset: 'Quick swell', params: { mix: 0.32 } }],
      words: ', with a swell of room after each note',
    },
    smalldark: {
      effects: [{ deviceId: 'expanse', preset: 'Small dark room' }],
      words: ', in a small dark room',
    },
    glimshim: {
      effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.2 } }],
      words: ', with a faint octave glimmer over all',
    },
    bloomtail: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Faint glow', params: { mix: 0.24 } }],
      words: ', with fifths opening in the tail',
    },
    choirtail: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.3 } }],
      words: ', with a tail that sings ah',
    },
    ootail: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.28 } }],
      words: ', with an oo behind',
    },
    ghostrev: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Ghost', params: { mix: 0.32 } }],
      words: ', with a reversed ghost of room',
    },
    gated: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.3 } }],
      words: ', in a room that shuts',
    },
    spring: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.22 } }],
      words: ', through a spring tank',
    },
    swarm: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.26 } }],
      words: ', in a cavern of small echoes',
    },
    lifted: {
      effects: [{ deviceId: 'spiral', preset: 'Slow ascent', params: { mix: 0.22, decay: 5 } }],
      words: ', with a tail that climbs and climbs',
    },
    haze: {
      effects: [{ deviceId: 'haze', preset: 'Thin veil', params: { mix: 0.28 } }],
      words: ', in a fuzzed veil of room',
    },
    stairwell: {
      effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
      words: ', from across a stone stairwell',
    },
    nextdoor: {
      effects: [
        { deviceId: 'distance', preset: 'Next door' },
        { deviceId: 'ambient-limiter', preset: 'Wall only', params: { ceiling: -10.5, gain: 2 } },
      ],
      words: ', from the next room',
    },
    shore: {
      effects: [{ deviceId: 'distance', preset: 'Far shore', params: { distance: 0.8 } }],
      words: ', from a far shore',
    },
    strings: {
      effects: [
        { deviceId: 'sympathetic', preset: 'Piano pedal', params: { mix: 0.26 } },
        { deviceId: 'tamer', preset: 'Gentle' },
      ],
      words: ', with undamped strings ringing along',
    },
    bowltable: {
      effects: [{ deviceId: 'bowls', preset: 'Bowl table', params: { mix: 0.2, strike: 0.35 } }],
      words: ', with tuned metal bowls humming along',
    },
    cloud: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.3 } }],
      words: ', in a soft cloud of grains',
    },
    smear: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Slow smear', params: { mix: 0.35 } }],
      words: ', smeared into long grains',
    },
    mist: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.35 } }],
      words: ', in hanging mist',
    },
    sustain: {
      effects: [
        { deviceId: 'spectral-blur', preset: 'Clean sustain', params: { mix: 0.35 } },
        { deviceId: 'spread', preset: 'Soft tilt' },
      ],
      words: ', with each tone hung in the air',
    },
    fog: {
      effects: [{ deviceId: 'fog', preset: 'Soft cloud', params: { mix: 0.6 } }],
      words: ', blurred by a short fog',
    },
    melt: {
      effects: [{ deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.32 } }],
      words: ', with a tail that sags and darkens',
    },
    evaporate: {
      effects: [{ deviceId: 'melt', preset: 'Evaporate', params: { mix: 0.26 } }],
      words: ', with a tail that evaporates upward',
    },
    leaves: {
      effects: [{ deviceId: 'falling', preset: 'Slow sighs', params: { mix: 0.26 } }],
      words: ', with slow sighs falling off',
    },
    worngen: {
      effects: [{ deviceId: 'generations', preset: 'Faint afterimage', params: { mix: 0.28 } }],
      words: ', worn into the room on each pass',
    },
    dust: {
      effects: [{ deviceId: 'glints', preset: 'Faint dust', params: { mix: 0.16 } }],
      words: ', with a faint dust of sparks',
    },
    common: {
      effects: [{ deviceId: 'common-tones', preset: 'Hanging notes', params: { mix: 0.5 } }],
      words: ', what two notes share hanging on',
    },
    padbehind: {
      effects: [{ deviceId: 'pad-follower', preset: 'Slow swell', params: { mix: 0.28 } }],
      words: ', with a string pad swelling behind',
    },
    sines: {
      effects: [{ deviceId: 'sine-shadow', preset: 'Nearly dry', params: { mix: 0.3 } }],
      words: ', with pure tones lingering after',
    },
    slowcloud: {
      effects: [{ deviceId: 'stretch', preset: 'Slow cloud', params: { mix: 0.3 } }],
      words: ', trailed by a slow cloud',
    },
    under: {
      effects: [{ deviceId: 'underwater', preset: 'Just under' }],
      words: ', just under water',
    },
    shallows: {
      effects: [
        { deviceId: 'underwater', preset: 'Sunlit shallows' },
        { deviceId: 'chorus', preset: 'Faint air' },
      ],
      words: ', in sunlit shallows',
    },
    breeze: {
      effects: [{ deviceId: 'weather', preset: 'Breezy day', params: { voice: 0.25 } }],
      words: ', out in a breeze',
    },
    clouds: {
      effects: [
        { deviceId: 'weather', preset: 'Passing clouds', params: { voice: 0.15, exposure: 0.7 } },
      ],
      words: ', while clouds pass over',
    },
    rain: {
      effects: [
        { deviceId: 'weather', preset: 'Light rain', params: { voice: 0.3 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', out in light rain',
    },
    record: {
      effects: [{ deviceId: 'vinyl', preset: 'New pressing' }],
      words: ', on a clean record',
    },
    oldrecord: {
      effects: [{ deviceId: 'vinyl', preset: 'Dull stylus', params: { wear: 0.5 } }],
      words: ', on an old dull record',
    },
    warped: {
      effects: [{ deviceId: 'vinyl', preset: 'Warped', params: { warp: 0.55, crackle: 0.15 } }],
      words: ', on a warped record',
    },
    transistor: {
      effects: [{ deviceId: 'radio', preset: 'Clean transistor' }],
      words: ', on a pocket radio',
    },
    kitchen: {
      effects: [
        { deviceId: 'radio', preset: 'Kitchen radio', params: { mix: 0.8, interference: 0.04 } },
      ],
      words: ', on a kitchen radio',
    },
    glaze: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Glaze', params: { mix: 0.7 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: ', glazed by an early sampler',
    },
    watery: {
      effects: [{ deviceId: 'low-bitrate', preset: 'Watery trace' }],
      words: ', with a watery trace',
    },
    hiss: {
      effects: [
        { deviceId: 'noise-floor', preset: 'Faint hiss' },
        { deviceId: 'tape', preset: 'Clean transfer' },
      ],
      words: ', with tape hiss beneath',
    },
    frost: {
      effects: [
        { deviceId: 'seasons', preset: 'First frost', params: { depth: 0.6, space: 0.45 } },
      ],
      words: ', in the first frost',
    },
    midsummer: {
      effects: [{ deviceId: 'seasons', preset: 'Touch of sun' }],
      words: ', with a touch of summer',
    },
    ringhalo: {
      effects: [{ deviceId: 'ring', preset: 'Faint halo' }],
      words: ', with a faint ringing halo',
    },
    vowelpress: {
      effects: [{ deviceId: 'imprint', preset: 'Faint vowel' }],
      words: ', pressed through a round vowel',
    },
    hollowbox: {
      effects: [{ deviceId: 'imprint', preset: 'Hollow tube', params: { mix: 0.6 } }],
      words: ', pressed through a hollow tube',
    },
    chime: {
      effects: [{ deviceId: 'warp', preset: 'Soft chime', params: { mix: 0.35 } }],
      words: ', stretched a little toward a chime',
    },
    smallbody: {
      effects: [
        { deviceId: 'size', preset: 'Smaller', params: { mix: 0.6 } },
        { deviceId: 'ether-reverb', preset: 'Small booth' },
      ],
      words: ', in a smaller body',
    },
    largebody: {
      effects: [{ deviceId: 'size', preset: 'Larger', params: { mix: 0.6 } }],
      words: ', in a larger body',
    },
    flutes: {
      effects: [{ deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.35 } }],
      words: ', with flute stops drawn',
    },
    sustainring: {
      effects: [{ deviceId: 'howl', preset: 'Faint sustain' }],
      words: ', held on by faint feedback',
    },
    afterglow: {
      effects: [{ deviceId: 'sustainer', preset: 'Thin halo', params: { mix: 0.25 } }],
      words: ', with a thin halo held after',
    },
    shadowhalf: {
      effects: [{ deviceId: 'half-speed', preset: 'Thin shadow', params: { mix: 0.22 } }],
      words: ', with a thin slowed shadow an octave down',
    },
    answerkeys: {
      effects: [
        { deviceId: 'silent-keys', preset: 'Open fifth and bass', params: { mix: 0.3, output: 0 } },
      ],
      words: ', waking silent strings on A',
    },
    whistle: {
      effects: [
        { deviceId: 'overtone-singer', preset: 'Faint melody', params: { mix: 0.22 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', with a faint overtone melody',
    },
    keyfilter: {
      effects: [
        { deviceId: 'scale-filter', preset: 'Lean to the key' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.15 } },
      ],
      words: ', leaning on the white keys',
    },
    drifter: {
      effects: [
        { deviceId: 'spectral-drifter', preset: 'Octave halo', params: { mix: 0.16 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', with an octave halo drifting over',
    },
  },
  phrases: {
    // Two ninth chords with the eyes closed between them.
    lookaway: {
      notes: [
        { atSec: 0, durSec: 2.4, note: 50, gain: 0.6 },
        { atSec: 0, durSec: 2.4, note: 57, gain: 0.5 },
        { atSec: 0, durSec: 2.4, note: 65, gain: 0.5 },
        { atSec: 0.1, durSec: 2.3, note: 76, gain: 0.5 },
        { atSec: 3.8, durSec: 2.6, note: 48, gain: 0.6 },
        { atSec: 3.8, durSec: 2.6, note: 59, gain: 0.5 },
        { atSec: 3.8, durSec: 2.6, note: 64, gain: 0.5 },
        { atSec: 3.9, durSec: 2.5, note: 74, gain: 0.45 },
      ],
    },
    // Over a still fifth a fourth leans, gives way, and the top follows it down.
    leaning: {
      notes: [
        { atSec: 0, durSec: 6.4, note: 45, gain: 0.6 },
        { atSec: 0, durSec: 6.4, note: 52, gain: 0.5 },
        { atSec: 0, durSec: 2.6, note: 62, gain: 0.55 },
        { atSec: 2.6, durSec: 3.8, note: 60, gain: 0.5 },
        { atSec: 0, durSec: 4.2, note: 69, gain: 0.5 },
        { atSec: 4.2, durSec: 2.2, note: 67, gain: 0.45 },
      ],
    },
    // One note, and what it leaves.
    onetone: { notes: [{ atSec: 0, durSec: 3.8, note: 62, gain: 0.75 }] },
    // A line that comes down by steps and a fourth, with rests.
    sinking: {
      notes: [
        { atSec: 0, durSec: 0.9, note: 76, gain: 0.7 },
        { atSec: 1.2, durSec: 0.7, note: 74, gain: 0.6 },
        { atSec: 2, durSec: 1.6, note: 72, gain: 0.65 },
        { atSec: 4.1, durSec: 0.7, note: 67, gain: 0.6 },
        { atSec: 4.9, durSec: 2.2, note: 69, gain: 0.6 },
      ],
    },
    // Low calls, high answers.
    calls: {
      notes: [
        { atSec: 0, durSec: 0.9, note: 57, gain: 0.7 },
        { atSec: 0.5, durSec: 1, note: 64, gain: 0.6 },
        { atSec: 1.9, durSec: 1, note: 76, gain: 0.55 },
        { atSec: 2.9, durSec: 1.1, note: 74, gain: 0.55 },
        { atSec: 4.2, durSec: 0.9, note: 55, gain: 0.7 },
        { atSec: 4.7, durSec: 1, note: 62, gain: 0.6 },
        { atSec: 5.9, durSec: 1.4, note: 72, gain: 0.55 },
      ],
    },
    // A broken figure over a bass that steps down, its inner voice held and then giving way.
    turning: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 57, gain: 0.7 },
        { atSec: 0.42, durSec: 0.4, note: 64, gain: 0.5 },
        { atSec: 0.84, durSec: 0.4, note: 72, gain: 0.55 },
        { atSec: 1.26, durSec: 0.4, note: 64, gain: 0.45 },
        { atSec: 1.68, durSec: 0.5, note: 55, gain: 0.7 },
        { atSec: 2.1, durSec: 0.4, note: 64, gain: 0.5 },
        { atSec: 2.52, durSec: 0.4, note: 71, gain: 0.55 },
        { atSec: 2.94, durSec: 0.4, note: 64, gain: 0.45 },
        { atSec: 3.36, durSec: 0.5, note: 53, gain: 0.7 },
        { atSec: 3.78, durSec: 0.4, note: 62, gain: 0.5 },
        { atSec: 4.2, durSec: 0.4, note: 69, gain: 0.55 },
        { atSec: 4.62, durSec: 0.4, note: 62, gain: 0.45 },
        { atSec: 5.04, durSec: 2, note: 52, gain: 0.65 },
        { atSec: 5.46, durSec: 1.6, note: 59, gain: 0.5 },
        { atSec: 5.88, durSec: 1.2, note: 67, gain: 0.5 },
      ],
    },
    // Low notes, each with room to be missed.
    lowsteps: {
      notes: [
        { atSec: 0, durSec: 1.2, note: 45, gain: 0.8 },
        { atSec: 1.7, durSec: 0.9, note: 40, gain: 0.75 },
        { atSec: 2.9, durSec: 1.1, note: 41, gain: 0.75 },
        { atSec: 4.4, durSec: 0.7, note: 48, gain: 0.65 },
        { atSec: 5.4, durSec: 1.8, note: 43, gain: 0.75 },
      ],
    },
    // A bass that walks and then rests on the fifth below.
    lowwalk: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 36, gain: 0.8 },
        { atSec: 0.7, durSec: 0.4, note: 43, gain: 0.65 },
        { atSec: 1.3, durSec: 0.8, note: 45, gain: 0.7 },
        { atSec: 2.6, durSec: 0.5, note: 41, gain: 0.75 },
        { atSec: 3.3, durSec: 0.5, note: 43, gain: 0.65 },
        { atSec: 4.1, durSec: 1.3, note: 36, gain: 0.8 },
        { atSec: 5.7, durSec: 1.6, note: 31, gain: 0.75 },
      ],
    },
    // Two long low notes.
    lowlong: {
      notes: [
        { atSec: 0, durSec: 3.1, note: 33, gain: 0.8 },
        { atSec: 3.8, durSec: 3.2, note: 29, gain: 0.75 },
      ],
    },
    // Open low pairs, the two parting and closing.
    lowfifths: {
      notes: [
        { atSec: 0, durSec: 1.9, note: 36, gain: 0.7 },
        { atSec: 0, durSec: 1.9, note: 43, gain: 0.55 },
        { atSec: 2.5, durSec: 1.9, note: 33, gain: 0.7 },
        { atSec: 2.5, durSec: 1.9, note: 48, gain: 0.5 },
        { atSec: 5, durSec: 2.2, note: 38, gain: 0.7 },
        { atSec: 5, durSec: 2.2, note: 45, gain: 0.55 },
      ],
    },
    // High strokes, unevenly spaced.
    highpeal: {
      notes: [
        { atSec: 0, durSec: 0.3, note: 84, gain: 0.6 },
        { atSec: 0.9, durSec: 0.3, note: 79, gain: 0.65 },
        { atSec: 1.9, durSec: 0.3, note: 88, gain: 0.5 },
        { atSec: 3.1, durSec: 0.4, note: 81, gain: 0.6 },
        { atSec: 4.4, durSec: 0.4, note: 76, gain: 0.65 },
        { atSec: 5.2, durSec: 0.5, note: 86, gain: 0.5 },
      ],
    },
    // Struck in pairs, sixths and tenths that close on an octave.
    pairs: {
      notes: [
        { atSec: 0, durSec: 0.6, note: 60, gain: 0.65 },
        { atSec: 0, durSec: 0.6, note: 76, gain: 0.5 },
        { atSec: 1.5, durSec: 0.6, note: 65, gain: 0.65 },
        { atSec: 1.5, durSec: 0.6, note: 74, gain: 0.5 },
        { atSec: 3, durSec: 0.6, note: 62, gain: 0.65 },
        { atSec: 3, durSec: 0.6, note: 77, gain: 0.5 },
        { atSec: 4.6, durSec: 1.4, note: 57, gain: 0.65 },
        { atSec: 4.6, durSec: 1.4, note: 69, gain: 0.5 },
        { atSec: 4.6, durSec: 1.4, note: 72, gain: 0.45 },
      ],
    },
    // A low fifth with two notes laid on it.
    fifthdrone: {
      notes: [
        { atSec: 0, durSec: 6.8, note: 38, gain: 0.65 },
        { atSec: 0.1, durSec: 6.7, note: 45, gain: 0.55 },
        { atSec: 1.5, durSec: 5.2, note: 57, gain: 0.5 },
        { atSec: 3, durSec: 3.8, note: 64, gain: 0.45 },
      ],
    },
    // A wide drone whose top climbs by step.
    widedrone: {
      notes: [
        { atSec: 0, durSec: 6.9, note: 43, gain: 0.65 },
        { atSec: 0.2, durSec: 6.7, note: 50, gain: 0.55 },
        { atSec: 1, durSec: 1.9, note: 67, gain: 0.45 },
        { atSec: 2.9, durSec: 1.8, note: 69, gain: 0.45 },
        { atSec: 4.7, durSec: 2.3, note: 71, gain: 0.45 },
      ],
    },
    // Two voices in contrary motion.
    twovoices: {
      notes: [
        { atSec: 0, durSec: 1.4, note: 72, gain: 0.65 },
        { atSec: 1.5, durSec: 1.2, note: 71, gain: 0.6 },
        { atSec: 2.9, durSec: 1.1, note: 69, gain: 0.6 },
        { atSec: 4.2, durSec: 1, note: 67, gain: 0.6 },
        { atSec: 5.4, durSec: 1.9, note: 69, gain: 0.6 },
        { atSec: 0, durSec: 1.4, note: 57, gain: 0.65 },
        { atSec: 1.5, durSec: 1.2, note: 62, gain: 0.6 },
        { atSec: 2.9, durSec: 1.1, note: 65, gain: 0.6 },
        { atSec: 4.2, durSec: 1, note: 64, gain: 0.6 },
        { atSec: 5.4, durSec: 1.9, note: 57, gain: 0.65 },
      ],
    },
    // The same chord four times, its top giving way at the last.
    again: {
      notes: [
        { atSec: 0, durSec: 1, note: 52, gain: 0.6 },
        { atSec: 0, durSec: 1, note: 60, gain: 0.5 },
        { atSec: 0, durSec: 1, note: 67, gain: 0.5 },
        { atSec: 0, durSec: 1, note: 72, gain: 0.5 },
        { atSec: 1.7, durSec: 1, note: 52, gain: 0.6 },
        { atSec: 1.7, durSec: 1, note: 60, gain: 0.5 },
        { atSec: 1.7, durSec: 1, note: 67, gain: 0.5 },
        { atSec: 1.7, durSec: 1, note: 72, gain: 0.5 },
        { atSec: 3.4, durSec: 1, note: 52, gain: 0.6 },
        { atSec: 3.4, durSec: 1, note: 60, gain: 0.5 },
        { atSec: 3.4, durSec: 1, note: 67, gain: 0.5 },
        { atSec: 3.4, durSec: 1, note: 72, gain: 0.5 },
        { atSec: 5.1, durSec: 1.8, note: 52, gain: 0.6 },
        { atSec: 5.1, durSec: 1.8, note: 59, gain: 0.5 },
        { atSec: 5.1, durSec: 1.8, note: 67, gain: 0.5 },
        { atSec: 5.1, durSec: 1.8, note: 71, gain: 0.5 },
      ],
    },
    // One key asked again and again, then another.
    samekey: {
      notes: [
        { atSec: 0, durSec: 1.1, note: 62, gain: 0.7 },
        { atSec: 1.5, durSec: 1.1, note: 62, gain: 0.7 },
        { atSec: 3, durSec: 1.1, note: 62, gain: 0.7 },
        { atSec: 4.5, durSec: 1, note: 62, gain: 0.65 },
        { atSec: 5.8, durSec: 1.4, note: 69, gain: 0.6 },
      ],
    },
    // Three rolled chords under two hands, the upper one moving as little as it can.
    hands: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 45, gain: 0.7 },
        { atSec: 0.12, durSec: 1.5, note: 60, gain: 0.55 },
        { atSec: 0.22, durSec: 1.4, note: 64, gain: 0.5 },
        { atSec: 0.34, durSec: 1.3, note: 67, gain: 0.5 },
        { atSec: 2.2, durSec: 1.6, note: 41, gain: 0.7 },
        { atSec: 2.32, durSec: 1.5, note: 60, gain: 0.55 },
        { atSec: 2.42, durSec: 1.4, note: 64, gain: 0.5 },
        { atSec: 2.54, durSec: 1.3, note: 69, gain: 0.5 },
        { atSec: 4.4, durSec: 2.2, note: 48, gain: 0.7 },
        { atSec: 4.52, durSec: 2.1, note: 59, gain: 0.55 },
        { atSec: 4.64, durSec: 2, note: 64, gain: 0.5 },
        { atSec: 4.78, durSec: 1.9, note: 67, gain: 0.5 },
      ],
    },
    // A slow climb and two notes that look back.
    climb: {
      notes: [
        { atSec: 0, durSec: 1.5, note: 50, gain: 0.7 },
        { atSec: 0.45, durSec: 1.4, note: 57, gain: 0.6 },
        { atSec: 0.9, durSec: 1.3, note: 62, gain: 0.6 },
        { atSec: 1.35, durSec: 1.2, note: 65, gain: 0.55 },
        { atSec: 1.8, durSec: 1.1, note: 69, gain: 0.55 },
        { atSec: 2.25, durSec: 1.2, note: 76, gain: 0.55 },
        { atSec: 3.9, durSec: 0.5, note: 72, gain: 0.6 },
        { atSec: 4.7, durSec: 2, note: 69, gain: 0.6 },
      ],
    },
    // A line for one voice, joined.
    sung: {
      notes: [
        { atSec: 0, durSec: 1.4, note: 64, gain: 0.65 },
        { atSec: 1.4, durSec: 0.9, note: 67, gain: 0.6 },
        { atSec: 2.3, durSec: 1.7, note: 69, gain: 0.65 },
        { atSec: 4.1, durSec: 0.7, note: 67, gain: 0.6 },
        { atSec: 4.8, durSec: 2.3, note: 62, gain: 0.65 },
      ],
    },
    // Four voices over a bass that falls.
    fourparts: {
      notes: [
        { atSec: 0, durSec: 2.3, note: 48, gain: 0.65 },
        { atSec: 0, durSec: 2.3, note: 55, gain: 0.5 },
        { atSec: 0, durSec: 2.3, note: 64, gain: 0.5 },
        { atSec: 0, durSec: 4.6, note: 72, gain: 0.5 },
        { atSec: 2.4, durSec: 2.2, note: 45, gain: 0.65 },
        { atSec: 2.4, durSec: 2.2, note: 60, gain: 0.5 },
        { atSec: 2.4, durSec: 2.2, note: 65, gain: 0.5 },
        { atSec: 4.7, durSec: 2.4, note: 43, gain: 0.65 },
        { atSec: 4.7, durSec: 2.4, note: 62, gain: 0.5 },
        { atSec: 4.7, durSec: 2.4, note: 67, gain: 0.5 },
        { atSec: 4.7, durSec: 2.4, note: 71, gain: 0.5 },
      ],
    },
    // Long notes that overlap, each a fourth or more from the last.
    overlaps: {
      notes: [
        { atSec: 0, durSec: 3.4, note: 50, gain: 0.65 },
        { atSec: 1.2, durSec: 3.4, note: 64, gain: 0.55 },
        { atSec: 2.6, durSec: 3.2, note: 69, gain: 0.5 },
        { atSec: 4, durSec: 3.2, note: 60, gain: 0.55 },
      ],
    },
    // One slow thread, high.
    thread: {
      notes: [
        { atSec: 0, durSec: 2.1, note: 81, gain: 0.6 },
        { atSec: 2.5, durSec: 1.7, note: 79, gain: 0.55 },
        { atSec: 4.6, durSec: 2.2, note: 84, gain: 0.55 },
      ],
    },
    // Short notes with long silences.
    drops: {
      notes: [
        { atSec: 0, durSec: 0.25, note: 69, gain: 0.75 },
        { atSec: 1.3, durSec: 0.25, note: 62, gain: 0.7 },
        { atSec: 1.7, durSec: 0.2, note: 74, gain: 0.55 },
        { atSec: 3.4, durSec: 0.25, note: 65, gain: 0.7 },
        { atSec: 4.7, durSec: 0.25, note: 57, gain: 0.75 },
        { atSec: 5.1, durSec: 0.2, note: 72, gain: 0.55 },
      ],
    },
  },
  directions: [
    {
      id: 'amber-then-blue',
      name: 'Amber then blue',
      category: 'pad',
      rows: `
Amber at the sill | Amber then blue | attack=.3 form=.05 colour=.25 tire=.5 depth=.8 length=16 rise=1.2 edge=.2 width=.7 seep=.5 drift=.8 after=0.55 recover=2.2 | sway | lookaway | A hollow amber lamp that soon fades into a soft octave, the two drifting
Blue after supper | Amber then blue | attack=.4 form=.18 colour=.6 tire=.6 depth=.9 length=26 rise=1.6 edge=.85 seep=0 release=.3 volume=0.5 safe=Stay after=0.48 | bare | onetone | A hollow lamp that pales within a second; its clear octave comes late and stays
Two coats of varnish | Amber then blue | attack=2.2 release=3.5 tire=5 seep=.8 after=.5 drift=.75 form=.2 safe=Stay recover=12 | chorus | leaning | A slow lamp with its octave showing through all the while, both adrift
Wick turned low | Amber then blue | colour=.05 form=0 attack=1 air=.5 tire=1 after=.95 edge=.1 width=.25 length=9 | reel | sinking | A dark hollow wick with hiss round it and a round dark octave behind it
Stained stair window | Amber then blue | colour=.9 form=.3 attack=.2 depth=.3 length=8 rise=.08 edge=.95 width=1 tire=.5 recover=12 | brightair | fourparts | A bright lamp in full light, and a sharp octave at once when the keys go
Lit from both ends | Opposite light | opposite=Sides form=.85 colour=.5 attack=.8 tire=1 depth=.7 length=9 rise=.5 edge=.35 drift=.6 width=1 recover=6 | wide | lookaway | A lamp in octaves that empties in the middle and leaves two trembling sides
Corridor of lamps | - | opposite=Sides form=.95 colour=.15 attack=1.8 release=3 seep=.65 after=.85 edge=.05 tire=3 width=.9 volume=-9.5 recover=20 | darkhall | leaning | Dark lamps in octaves, slow both ways, dim trembling sides showing through
The far window shakes | - | opposite=Sides form=.7 colour=.8 attack=.04 release=.2 tire=.25 depth=.95 rise=.04 length=3.5 edge=.75 seep=.1 volume=2.5 recover=1.2 after=0.86 | stub | calls | A quick bright lamp, pale at once, whose shaking sides flash as it stops | keys
Moth and its double | - | opposite=Mirror form=.3 colour=.4 air=.65 drift=1 seep=.6 after=.75 length=14 edge=.7 attack=.6 blink=.35 blinkRate=5 volume=-1.5 recover=10 | hazy | onetone | A lamp under fluttering lids, its mirror beating on the other side of the pane | texture
Shade drawn aside | - | opposite=Sides form=.9 colour=.35 attack=3 release=.5 tire=6 depth=1 rise=3 length=20 edge=.45 seep=0 after=1 volume=-2 recover=18 | farstar | overlaps | A lamp in octaves that takes three seconds to open and leaves slow shaking sides
Wall behind the stove | - | source=Reed opposite=Even form=.2 colour=.3 attack=.9 tire=1.8 depth=.6 length=15 rise=.7 edge=.3 air=.2 | glue | lookaway | Hollow reeds that soften as they are held and leave even, rounder octaves
Harmonium at dusk | - | source=Reed opposite=Even form=.65 colour=.5 attack=.3 release=.5 tire=2 depth=.35 length=6 rise=.3 edge=.5 air=.35 seep=.3 drift=.2 after=0.6 | keyfilter | fourparts | Full breathy reeds with a thread of their octave coming through as they hold | organ
Reeds behind a screen | - | source=Reed opposite=Even form=.45 colour=.1 attack=4.5 release=10 tire=5 depth=.9 length=24 rise=6 edge=.2 drift=.6 memory=Chord recover=18 volume=-1 | undertow | overlaps | Dark reeds that tire as a whole chord and turn over into slow low-lit octaves
Brass rail in sun | - | source=Reed opposite=Even form=.95 colour=.75 attack=.15 tire=.6 depth=.8 length=5 rise=.1 edge=.8 after=.9 width=.9 volume=0.5 | plate | calls | Bright nasal reeds that thin in a moment and leave sharp octaves ringing
Door off the latch | - | source=Reed opposite=Even form=.3 colour=.6 attack=.5 tire=1.2 seep=.9 depth=1 after=.6 length=10 rise=.5 edge=.65 drift=.9 recover=8 | waters | leaning | Reeds that give way under the hand to their own octaves, loose in pitch
Green flash at sunset | - | form=.4 colour=.1 attack=1.2 tire=2 depth=.5 length=20 rise=.3 edge=.8 seep=.05 width=.8 volume=-1.5 safe=Stay recover=6 | openspace | onetone | A dark lamp, low and calm, whose mirror is a bell high over it
Lamp and its planet | - | form=.15 colour=.3 attack=.6 tire=.8 length=30 rise=1.4 edge=.2 drift=.8 after=1 release=1.5 recover=8 | sustain | fifthdrone | A hollow lamp, and a far slow mirror that rises over it from across the keyboard | drone
Counterlight | - | form=.65 colour=.7 attack=.08 release=.2 tire=.3 depth=.9 length=7 rise=.05 edge=.6 seep=.2 safe=Stay recover=6 | room | twovoices | A quick full lamp, gone at once, and its mirror standing on the far side | keys
Sun through eyelids | - | form=.55 colour=.35 attack=2.5 release=2 tire=1.5 seep=1 depth=.95 after=.6 length=14 edge=.35 rise=.8 drift=.5 recover=8 | weathers | leaning | A warm lamp that gives itself up to its mirror while the keys are still down
Pale side of the moon | - | form=.3 colour=.5 attack=.4 tire=.4 depth=1 recover=15 memory=Octave length=12 edge=.15 after=.8 width=.4 safe=Stay | darkecho | again | A lamp that comes back paler each time, a warm mirror already in it
Cellar under the light | - | opposite=Below form=.5 colour=.65 attack=.7 tire=1.2 depth=.6 length=12 rise=.8 edge=.35 seep=.1 after=1 volume=-12.5 | warm | lookaway | A full bright lamp, and when it goes a hollow octave below takes the floor
Stopped pipe at noon | - | opposite=Below form=.8 colour=.85 attack=.03 release=.2 tire=.35 depth=.8 length=5 rise=.15 edge=.6 recover=0.5 | chamber | calls | A quick bright octave lamp that drops to a hollow pipe an octave below | organ
Lantern on a long rope | - | opposite=Below form=.1 colour=.45 attack=1.6 release=1 tire=3 depth=.9 length=30 rise=3 edge=.1 after=.95 drift=.7 recover=9 | cave | overlaps | A hollow lamp let down slowly: the octave below rises three seconds late
Below the parquet | - | opposite=Below form=.35 colour=.2 attack=.9 seep=.85 after=.8 tire=2 length=9 edge=.7 air=.3 width=.2 memory=Chord | boards | leaning | A dark lamp with its lower octave pushing up from the floor, close and narrow
Candle over deep water | - | opposite=Below form=.25 colour=.95 air=.4 attack=.3 tire=.5 depth=.95 length=18 rise=.6 edge=.25 drift=1 width=1 recover=8 | waters | thread | A bright high candle that thins fast over a wide dark pipe below
Rim of the evening | - | source=Bowl opposite=Even form=.3 colour=.35 attack=.8 release=1 tire=2 depth=.6 length=14 rise=1 edge=.5 recover=8 | plate | lookaway | Rubbed bowls that turn slowly and leave a still, hollow octave above them
Copper going dark | - | source=Bowl opposite=Even form=.7 colour=.7 attack=.25 release=.3 tire=.7 depth=.95 length=8 rise=.3 edge=.1 seep=.1 air=.4 volume=0.5 | spring | sinking | Bright rims, rubbed hard, that fade early into a round dark octave
Rain on the skylight | - | source=Bowl opposite=Even form=.85 colour=.2 attack=0.9 release=3 tire=6 seep=.7 length=24 rise=.4 edge=.75 drift=.8 recover=15 after=0.4 | rain | overlaps | Soft dark bowls with a clear octave shining through them as they tire
Dish of embers | - | source=Bowl opposite=Even form=.9 colour=.45 attack=.4 release=.5 tire=1.2 depth=.8 after=1 length=5 rise=.06 edge=.4 width=1 air=.55 | embers | onetone | A wide bowl with bow noise on its rim, its octaves coming up like sparks | texture
The plate stops turning | - | source=Bowl opposite=Even form=.5 colour=.55 attack=.1 release=.15 tire=.4 depth=.7 length=3 rise=.05 edge=.65 drift=0 width=.45 volume=-16.5 after=0.55 | tails | twovoices | Bowls that start and stop short, with a plain still octave after each | keys
Wire in the window | - | source=String opposite=Even form=0 colour=.8 air=.15 tire=1 depth=.2 length=9 rise=.5 edge=.5 seep=.3 release=1.2 volume=-3 after=.45 recover=12 | hall 1.mix=0.18 | fourparts | Long bright wires that ring nearly whole and leave an octave of glow | string
Blue thread in the hem | - | source=String opposite=Even form=.2 colour=.9 attack=.15 air=.05 tire=.4 depth=.9 seep=.8 after=.9 length=12 edge=.75 drift=.6 recover=0.5 | ensemble | climb | Bright strings eased in, giving way to sharp loose octaves under the hand | string
Harp in a dark shop | - | source=String opposite=Even form=.6 colour=.2 air=.3 tire=1.5 depth=.6 length=7 rise=.3 edge=.2 release=.4 width=.5 recover=6 | felted | hands | Round dark strings, let go into a rounder octave above | plucked
Old blue curtains | - | source=String opposite=Even form=.35 colour=.45 attack=.6 tire=2.5 depth=1 release=3 length=30 rise=2.2 edge=.35 after=1 drift=.9 recover=9 | faraway | leaning | Softened strings whose octave swells two seconds late and floats on | string
Fence wire at sundown | - | source=String opposite=Even form=.08 colour=.3 air=.6 tire=.25 depth=1 recover=12 memory=Chord length=9 edge=.6 seep=.5 after=0.5 | combo | again | Wiry strings that tire together and come back as little more than octaves | string
Mouth of the hour | - | source=Vowel opposite=Even form=.3 colour=.4 attack=.6 release=.4 tire=1.5 depth=.6 length=10 rise=.8 edge=.45 air=.2 recover=3.4 | ootail | fourparts | Voices on oh that soften as they hold and leave an octave without a mouth | voice
A hum, then higher | - | source=Vowel opposite=Even form=.02 colour=.25 attack=.3 release=.2 tire=.5 depth=.9 length=7 rise=.3 edge=.8 seep=.1 drift=.2 volume=-0.5 recover=11 after=0.48 | room | sung | A closed oo, gone pale under each note, and a clear octave when it ends | voice
Nuns in blue light | - | source=Vowel opposite=Even form=.5 colour=.6 attack=1.5 release=2.5 tire=5 seep=.6 length=22 rise=1.2 edge=.3 drift=.6 width=.9 recover=12 | choirtail | leaning | A slow open ah with even, wordless octaves widening through it | voice
Bright word swallowed | - | source=Vowel opposite=Even form=.95 colour=.7 attack=.15 tire=.4 depth=.8 length=5 rise=.1 edge=.2 release=.2 after=.95 volume=-1 recover=14 | slap | calls | A quick bright ee cut off by a round dark octave of itself | voice
What the choir saw | - | source=Vowel opposite=Even form=.7 colour=.5 attack=2.5 tire=3 depth=1 air=.5 seep=.9 after=.7 length=16 edge=.9 drift=.4 volume=-0.5 recover=15 | glimmer | overlaps | An airy eh that wears through to glassy octaves long before it ends | voice
Pale chord returning | Remembered texture | source=Lamp opposite=Even form=.4 colour=.4 attack=.4 tire=.4 recover=20 depth=.8 seep=.5 length=10 edge=.5 after=0.6 | late | again | A lamp that remembers the whole chord and comes back paler, its octave ahead of it
Slats at the blue hour | Slow eclipse | opposite=Even form=.25 colour=.1 seep=.4 edge=.6 rise=1.5 length=24 depth=.9 attack=2.5 tire=3 volume=-1.5 recover=12 after=0.4 | mist | onetone | A dim lamp blooming slowly in hiss, and behind it one bright octave
Lamplighter's rounds | Blinking pulse | form=.3 colour=.45 blink=.6 blinkRate=.5 attack=.5 length=9 edge=.4 depth=.5 drift=.4 | reel | leaning | A lamp whose lids come down every two seconds and show even tones behind
Sunlit pipes | - | opposite=Even form=.75 colour=.55 attack=.02 release=.15 tire=10 depth=0 length=2.5 rise=.06 edge=.7 air=.3 seep=.35 drift=.1 after=.4 recover=1 | keyed | twovoices | A lamp played like pipes, quick and even, never tiring, short octaves after it | organ
Afterimage of a chapel | - | opposite=Even form=.9 colour=.3 attack=.1 release=.8 tire=1 depth=.6 length=20 rise=.5 edge=.55 seep=.15 width=1 volume=-11 recover=2.4 | nave | fourparts | Octave lamps, quick to light, that leave even higher ones in the roof | organ
Two ambers and a rust | Torn curtain | source=Lamp form=.35 colour=.3 attack=.9 tire=1 length=8 edge=.35 seep=.3 after=.8 volume=-9.5 | haze | lookaway | A brown lamp whose edges come away in torn bands when it is let go
Paint still wet | Torn curtain | form=.4 colour=.35 opposite=Even attack=.2 release=1.5 tire=.8 rise=.8 length=12 edge=.75 drift=1 depth=.9 recover=6 | hollowed | climb | Reeds that run at once, their octaves sliding apart in pitch as they dry
Breathed-on pane | - | opposite=Breath form=.15 colour=.45 attack=.8 tire=.8 depth=.7 length=9 rise=.6 edge=.35 after=.6 air=.15 recover=2.2 | sidelit | lookaway | A hollow lamp, then nothing but breath in waves where it stood
Snow light after dusk | - | opposite=Breath form=.7 colour=.2 attack=1.6 release=2 tire=3 seep=.6 length=16 rise=2 edge=.85 drift=.7 width=.95 recover=9 | frost | overlaps | A dark octave lamp over which a bright windy breath slowly comes up
Smoke from the wick | - | opposite=Breath form=.5 colour=.75 attack=.1 release=.2 tire=.3 depth=1 length=4 rise=.1 edge=.15 air=.4 after=1 recover=1.2 | slap | drops | Short bright lamps snuffed out one by one, each with a dark sigh of breath | keys
`,
    },
    {
      id: 'struck-after-bells',
      name: 'Struck after-bells',
      category: 'bell',
      rows: `
Answer from the ridge | Struck after-bells | form=.56 colour=.45 tire=.5 depth=.7 rise=.8 length=20 edge=.4 after=.85 recover=6 | padbehind | pairs | Low bells answered high and high ones low, from across the keyboard
Quarter past nothing | Struck after-bells | form=.42 colour=.2 air=.4 rise=2.5 length=30 edge=.25 seep=0 release=.5 after=1 width=.8 volume=-10.5 recover=6 | darkhall | drops | Dull bells, and a second and a half later a slow mirror of each
Doorplate in full sun | Struck after-bells | form=.58 colour=.9 tire=.3 depth=.95 rise=.04 length=10 edge=.85 seep=.4 air=.2 recover=11 after=0.48 volume=1 | brightair | highpeal | Bright bells that thin at once into a glinting mirror of themselves
Bell under the pillow | Struck after-bells | form=.5 colour=.3 attack=.3 air=0 tire=2 depth=.4 length=14 rise=.8 edge=.1 width=.2 release=3 after=0.5 volume=-9 | pillow | pairs | Softened round bells whose mirror is only a dark warmth
Feast on the far bank | Struck after-bells | form=.46 colour=.6 tire=.8 depth=.6 rise=.2 length=40 edge=.55 drift=.9 seep=.6 width=1 volume=-10.5 safe=Stay recover=6 | shore | climb | Open bells with their mirror wandering through them for half a minute
Spoon on the table | Wooden shadow | opposite=Mirror colour=.55 form=0 length=8 rise=.08 edge=.6 air=.6 after=.95 tire=.2 depth=.7 volume=-1 recover=8 | booth | drops | Dry wood, knocked, and the small bell of its mirror where no one struck | plucked
Clogs in a courtyard | Wooden shadow | opposite=Even form=.1 colour=.3 air=.8 length=5 rise=.04 edge=.35 tire=.12 seep=.1 release=.2 recover=14 | slowing | turning | Wooden bars with a hard mallet and a round octave hopping after each | plucked
Ladder against the sky | Wooden shadow | opposite=Mirror form=.05 colour=.75 tire=.3 depth=.6 length=14 rise=.6 edge=.85 seep=.3 drift=.6 width=.9 air=.25 safe=Stay after=.5 recover=7 volume=3.5 | stars | climb | Bright wooden bars that are gone at once and a glinting mirror that outlasts them
Dew on the gatepost | Wooden shadow | opposite=Sides form=.06 colour=.5 length=9 rise=.1 edge=.4 after=.7 drift=.5 width=1 air=.3 recover=14 volume=-1 | room | calls | A wooden knock that leaves two trembling sides in the wet air
Mallet wrapped in wool | Wooden shadow | opposite=Even form=.22 colour=.1 air=.15 attack=.4 tire=1.5 depth=.1 length=12 rise=.9 edge=.2 release=1.5 after=.5 recover=3.4 | darkplate | pairs | Dark bars struck with wool, an octave coming up slowly behind
Stem on a stone floor | Struck after-bells | opposite=Below form=.95 colour=.75 air=.05 rise=.9 length=14 edge=.35 after=1 depth=.6 seep=0 release=.5 recover=2.4 | highfirst | highpeal | Thin glass struck high over a hollow octave below that arrives late
Icicles in the thaw | Struck after-bells | opposite=Below form=1 colour=.95 tire=.15 depth=1 rise=.1 length=6 edge=.6 air=0 drift=.1 recover=0.8 | frost | calls | Very bright glass that sinks at once into a short pipe under it
Chandelier on a rope | Struck after-bells | opposite=Below form=.88 colour=.5 rise=3.5 length=32 edge=.15 after=.95 drift=.8 release=2 width=1 volume=-11 safe=Stay recover=1.8 | nave | pairs | Glass left to ring, while two seconds behind it the floor comes up beneath
Paperweight on letters | Glass flutter | opposite=Below blink=0 form=.8 colour=.3 air=.2 tire=2 depth=.3 seep=.7 edge=.5 length=4 width=.3 volume=-7 | mono | sinking | Heavy dark glass with its lower octave in it from the first moment | keys
Vials on a tray | Glass flutter | opposite=Below blink=0 form=.97 colour=.6 tire=.4 depth=.8 seep=.2 rise=.3 length=10 edge=.75 air=.5 drift=.4 recover=1.2 after=0.55 volume=2 | chime | calls | Small glass with a hard tap on it and a reedy hollow pipe below | plucked
Torn peal | Struck after-bells | opposite=Rough form=.66 colour=.75 tire=1 depth=.5 rise=.2 length=12 edge=.1 after=.6 width=1 recover=11 | swarm | pairs | Bright bells left to ring, soft torn bands coming off them as they fade
Bell in a sandstorm | Struck after-bells | opposite=Rough form=.4 colour=.8 air=.7 seep=.85 rise=.06 length=16 edge=.95 after=.9 drift=.9 recover=8 | breeze | drops | A bright bell with grit on it, lost under rough hissing bands at once | texture
A forgotten fog signal | Struck after-bells | opposite=Breath form=.48 colour=.35 rise=1.2 length=14 edge=.2 after=1 depth=.9 tire=.8 release=.3 recover=8 | fog | pairs | Muted bells that turn into a dark breath which comes and goes
Sheep beyond the wall | Struck after-bells | opposite=Breath form=.34 colour=.65 tire=.35 depth=.9 rise=.1 length=5 edge=.4 air=.5 seep=.5 width=.8 volume=2 after=.6 attack=.4 | clouds | drops | Short clanking bars, half wood, half bell, in a thin wind
Struck and sighed | Struck after-bells | opposite=Breath form=.62 colour=.4 rise=.3 length=3 edge=.5 after=.8 air=.3 drift=.2 width=.4 volume=1.5 recover=11 | lungs | sinking | A bell for each note and one short sigh of breath after it | keys
Wineglass quarrel | Glass flutter | blink=0 form=.97 colour=.6 tire=2 depth=.25 rise=.4 length=7 edge=.4 drift=.8 air=.1 after=.45 release=2 | shiftdrift | pairs | Glass struck clean and left to ring, faint trembling sides leaning apart in pitch
Beads on a doorway | Glass flutter | blink=0 form=.75 colour=.75 tire=.12 depth=1 rise=.04 length=4 edge=.4 seep=.1 air=.4 volume=2 after=.55 recover=0.8 | tiles | turning | Half-glass strokes, very short, and a bright shaking flash to the sides | plucked
Aspen leaves in glass | Glass flutter | blinkRate=11 blink=.5 form=1 colour=.4 tire=.8 depth=.5 length=16 edge=.3 rise=.2 seep=.6 after=.6 recover=2 | sidelit | onetone | Glass under a fast flutter of lids, its sides shaking like leaves
Sun skipping the lake | Glass flutter | blink=0 form=.85 colour=.2 attack=.15 rise=1.5 length=28 edge=0 after=.8 seep=0 release=1 volume=-6.5 recover=1.8 | shallows | pairs | Dim glass, and long after it slow trembling sides, low in the light
Windows in the tram | Glass flutter | blink=.9 blinkRate=3 form=.82 colour=.65 tire=.4 length=6 edge=.5 seep=.2 drift=.2 width=.8 recover=7 after=0.5 volume=3.5 | glaze | climb | Glass chopped by lids three times a second, sides quaking in the gaps
Planks over a culvert | Wooden shadow | opposite=Below form=.02 colour=.35 length=6 rise=.06 edge=.3 after=.9 tire=.3 air=.5 width=.4 recover=11 | boards | lowsteps | Low wooden bars and, under each, a hollow pipe that stays | bass
Slow canoe | Wooden shadow | opposite=Below form=.15 colour=.2 attack=.2 length=18 rise=.8 edge=.55 after=.42 seep=.4 drift=.5 air=.2 release=1.5 volume=-6.5 depth=.25 recover=2 | darkecho | lowsteps | Dark bars struck low, a pipe an octave under them rising as they die | bass
Bamboo after monsoon | Wooden shadow | opposite=Below form=.12 colour=.7 tire=.2 depth=.8 length=8 rise=.3 edge=.7 air=.7 width=.8 | rain | drops | Bright wooden strokes over a buzzing hollow pipe an octave below | plucked
Boot on a stair | Wooden shadow | form=0 colour=.15 air=.9 length=2 rise=.04 edge=.4 after=.7 tire=.1 depth=.6 recover=1.2 | gated | lowwalk | Dead wooden thuds with a short rough scuff after each | bass
Old pump handle | Wooden shadow | form=.2 colour=.6 memory=Octave tire=.1 depth=.9 recover=3 length=7 rise=.2 edge=.7 seep=.5 drift=.6 | kitchen | samekey | A wooden stroke that wears out as it is repeated, leaving ragged bands | texture
Vesper stones | Struck after-bells | opposite=Even form=.5 colour=.4 rise=.6 length=24 edge=.5 after=.8 tire=1 seep=.1 safe=Stay recover=11 | cathedral | pairs | Plain bells that hand over to a still octave, like an organ left on
Moon in a tin cup | Struck after-bells | opposite=Even form=.68 colour=.85 air=.35 tire=.15 depth=.95 rise=.05 length=5 edge=.9 width=.3 recover=0.5 after=0.6 | bedside | calls | A thin bright bell that turns at once into one sharp even tone
Toll without a rope | Struck after-bells | opposite=Even form=.44 colour=.15 attack=.6 rise=5 length=36 edge=.3 seep=0 release=10 drift=.4 volume=-9 | faraway | lowfifths | A low bell with no stroke to it; three seconds on, its even octave | drone
Music through a hatch | Struck after-bells | opposite=Even form=.6 colour=.55 air=.1 tire=.4 depth=.8 rise=.2 length=3 edge=.6 seep=.7 width=.5 recover=10 after=0.4 volume=1 | transistor | climb | Small bells with their octave already in them, and little after | plucked
Anvil at some distance | Struck after-bells | opposite=Even form=.38 colour=.75 air=.6 rise=.4 length=12 edge=.2 release=2 depth=.5 recover=1.2 after=0.4 volume=1.5 | late | drops | Hard half-wooden bells that leave a round octave in the air
Bells behind eyelids | Glass flutter | form=.5 opposite=Mirror blink=.75 blinkRate=1.5 colour=.5 length=14 edge=.4 tire=.5 air=.1 recover=1.8 | tiles | climb | Bells under closing lids, each blink showing their mirror across the keys
Lighthouse carillon | Struck after-bells | opposite=Even blink=1 blinkRate=.6 colour=.6 form=.55 length=10 edge=.7 rise=.1 seep=.2 recover=11 | openspace | pairs | Bells cut off by slow lids that show a clean octave behind
Firefly jars | Glass flutter | opposite=Even form=.98 blink=.6 blinkRate=4.5 colour=.6 length=5 edge=.7 seep=.3 air=0 volume=1 recover=2.2 after=0.55 | dust | pairs | Tiny glass that flickers under its lids with a bright octave | texture
Film over a clock | Glass flutter | opposite=Rough form=.5 blink=.8 blinkRate=2 colour=.35 length=6 edge=.3 air=.5 tire=.6 recover=1.2 after=0.84 | oldrecord | drops | Dull bells with lids over them twice a second, torn bands in the dark
Eye of the storm bell | Struck after-bells | opposite=Breath blink=.9 blinkRate=.3 colour=.5 form=.45 length=20 edge=.1 seep=0 after=1 | cave | lowfifths | Low bells; each time the slow lids close a wind is in their place | drone
Bell that forgets | Struck after-bells | memory=Note tire=.25 depth=1 recover=16 form=.42 colour=.15 length=10 edge=.1 seep=.3 after=.65 volume=0.5 release=1 | plate | samekey | A dull bell that gives less at every stroke and shows more of its dark mirror
Roomful of old strokes | Struck after-bells | opposite=Rough memory=Chord tire=.6 depth=.95 recover=20 form=.6 colour=.45 length=14 edge=.15 seep=.6 rise=.8 | worngen | again | Bells that remember the whole chord and come back as worn, rough bands | texture
Every octave is tired | Struck after-bells | opposite=Below memory=Octave tire=.4 depth=.9 recover=8 form=.7 colour=.6 length=9 edge=.4 seep=.4 volume=-16 after=0.9 | tails | samekey | Glassy bells that tire in every octave at once, with the pipe below left over
Brighter the first time | Struck after-bells | opposite=Sides memory=Chord tire=.2 depth=.8 recover=6 form=.42 colour=.7 rise=.1 length=4 edge=.3 seep=.2 volume=-1 after=.5 | chime | again | Bells bright the first time and then mostly their shaking sides
Nobody remembers noon | Struck after-bells | opposite=Even memory=Chord tire=1 depth=1 recover=20 form=.3 colour=.25 attack=.3 length=18 seep=.8 edge=.7 after=0.64 | mist | again | Soft bars, half bell, that the whole chord wears down to a pale octave
Iron gong in the reeds | Struck after-bells | opposite=Breath form=.56 colour=.1 attack=.5 air=.1 release=8 rise=1 length=20 edge=.1 after=.9 drift=.7 | drum | lowfifths | A soft low bell, rung long, with a dark windy breath rising out of it | drone
Steps of the temple | Struck after-bells | opposite=Below form=.5 colour=.3 air=.5 tire=2 depth=.5 length=26 rise=1 edge=.2 seep=.3 release=4 volume=-12.5 after=0.55 | shore 1.distance=0.6 | lowsteps | A slow bell for each step, and the octave below it filling the court
Twice-cut crystal | Glass flutter | opposite=Mirror blink=0 form=.9 colour=.7 tire=.3 depth=.7 length=18 rise=.2 edge=.8 seep=.5 drift=.3 air=.05 safe=Stay | drifter | highpeal | Cut glass with a low warm mirror that keeps its own pitch under it
Doorbell no one hears | Struck after-bells | opposite=Mirror form=.64 colour=.6 air=.3 tire=.1 depth=.9 rise=.7 length=6 edge=.5 release=.2 seep=0 width=.7 recover=2.4 | nextdoor | drops | A bell that is gone in a moment, and its mirror some while after
Sleigh over the bridge | Glass flutter | opposite=Rough blink=.4 blinkRate=8 form=.7 colour=.85 length=3 edge=.8 air=.6 tire=.2 seep=.6 recover=7 | brightened | turning | Bright glassy strokes under fast lids, a rough jingle of bands in them | plucked
`,
    },
    {
      id: 'vowel-ghost',
      name: 'Vowel ghost',
      category: 'voice',
      rows: `
Voice parted in two | Vowel ghost | form=.32 colour=.6 attack=.15 tire=.5 depth=.8 length=16 rise=.6 edge=.35 after=.9 drift=.4 memory=Chord seep=.4 recover=11 | hall | fourparts | Voices on oh, soon tired, parting into two trembling sides as they hold
Name called twice | Vowel ghost | attack=.08 release=.2 form=.3 colour=.7 tire=.35 depth=.8 rise=.08 length=4 edge=.6 air=.15 volume=1.5 recover=0.5 after=0.6 | farstar | calls | A quick oh, and where it was two quavering sides for a moment
Twins at the altar rail | Vowel ghost | form=.18 colour=.25 attack=1.4 release=3 seep=.7 after=.6 drift=.8 length=20 edge=.15 tire=4 recover=12 | chapel | leaning | Dark voices with their own shaking sides beside them from the start
Aunts in the hallway | Vowel ghost | form=.4 colour=.55 air=.5 attack=.3 tire=.8 seep=.3 edge=.5 memory=Chord recover=8 width=.6 volume=-2 | stairwell | again | Breathy voices that tire together, until mostly their trembling sides are left
Cold air choir | Vowel ghost | form=.34 colour=.85 attack=2.2 tire=6 depth=1 rise=1.6 length=30 edge=.8 seep=.1 drift=1 volume=1 safe=Stay recover=18 after=0.86 | thinair | overlaps | A bright slow oh whose thin sides come up three seconds late and shiver
Hum at the crib | - | source=Vowel opposite=Breath form=0 colour=.2 attack=.4 air=.1 tire=1.5 depth=.5 length=8 rise=.5 edge=.2 after=.8 width=.3 recover=3.4 | sustain | sung | A closed oo, close by, with a dark breath after every phrase
Who breathes here | - | source=Vowel opposite=Breath form=.1 colour=.5 attack=.9 air=.6 seep=.9 depth=.95 tire=.8 length=14 rise=.6 edge=.5 drift=.6 volume=-1.5 recover=1.8 | lungs | onetone | An oo full of air that empties into breath while the key is still down
Last word, then wind | - | source=Vowel opposite=Breath form=.05 colour=.75 attack=.12 release=.2 tire=.4 depth=.9 after=1 length=5 rise=.1 edge=.9 air=.2 volume=1.5 | gated | drops | Short bright oos, each blown away by a hard bright wind
Far side of the bed | - | source=Vowel opposite=Breath form=.14 colour=.1 attack=2 release=2.5 tire=3 depth=.6 length=22 rise=2 edge=.1 drift=.3 memory=Octave recover=12 | muffled | leaning | A drowsy oo, half under covers, then slow dark breath
Sighing partition | - | source=Vowel opposite=Breath form=.22 colour=.35 attack=.5 tire=1 blink=.7 blinkRate=.35 length=7 edge=.6 air=.35 after=.9 | darkback | leaning | Voices that lids cover every three seconds, a sigh of breath in their place
Crypt under the choir | Choir looking down | attack=.8 tire=1.5 rise=.6 form=.5 colour=.4 depth=.6 after=.8 length=12 edge=.4 recover=3.4 | nave | fourparts | An open ah, and under it, as it goes, a hollow octave below
Singer and the cello | Choir looking down | attack=.3 form=.6 colour=.65 tire=.8 depth=.8 rise=.3 release=.4 length=6 edge=.7 seep=.1 width=.4 drift=.2 volume=0.5 recover=6 | vibrato | sung | A clear voice on ah that sinks at each end to a reedy octave below
Looking down the shaft | Choir looking down | form=.45 colour=.15 attack=2.5 tire=5 depth=1 rise=3.5 length=36 seep=.1 edge=.1 after=1 drift=.9 volume=4.5 recover=9 | cave | overlaps | Dark voices that sink slowly; very late the floor rises beneath them
Men at the well | Choir looking down | form=.35 colour=.3 attack=.4 air=.25 seep=.85 after=.7 tire=.7 length=8 edge=.55 width=.5 | chamber | lowsteps | Low voices that their octave below joins almost as they speak
Feet of the angels | Choir looking down | form=.55 colour=.9 attack=.15 release=.2 tire=.25 depth=.9 rise=.1 length=4 edge=.25 seep=0 volume=4 recover=10 | quickswell | calls | Short bright ahs that drop into a round dark octave below
Torn hymn sheet | - | source=Vowel opposite=Rough form=.9 colour=.5 attack=.5 tire=1 depth=.7 length=8 rise=.4 edge=.35 after=.8 air=.2 | plate | fourparts | A thin ee that leaves torn bands hanging where the hymn was
Grit in the throat | - | source=Vowel opposite=Rough form=.8 colour=.75 attack=.1 seep=.7 tire=.4 depth=.5 length=4 edge=.8 rise=.05 after=.6 drift=.2 width=.4 recover=6 | desk | sung | A hard bright voice between eh and ee, rough bands in it throughout
Wool over the mouth | - | source=Vowel opposite=Rough form=.96 colour=.1 attack=.9 air=.4 tire=2 length=16 rise=1.2 edge=.05 after=.95 drift=.7 release=2 | darkplate | leaning | A dull ee that unravels into dark, soft, ragged wool
Crowd after the speech | - | source=Vowel opposite=Rough form=.7 colour=.4 attack=.2 air=.7 tire=.3 depth=1 length=14 rise=.2 edge=.5 after=0.76 memory=Chord recover=12 | smear | again | Breathy voices swallowed at once by a torn murmur of many | texture
Radio saint | - | source=Vowel opposite=Rough form=1 colour=.95 attack=.3 air=.3 tire=.7 depth=.8 length=5 rise=.1 edge=.65 blink=.4 blinkRate=6 volume=0.5 | kitchen | onetone | A piercing ee, fluttering under lids, with rough static behind it | texture
Girl across the valley | - | source=Vowel opposite=Mirror form=.72 colour=.5 attack=.4 tire=1 depth=.6 length=14 rise=.5 edge=.4 after=.9 volume=-1 recover=6 | padbehind | sung | One voice on eh, answered from the other side of the keyboard
Star above the chant | - | source=Vowel opposite=Mirror form=.6 colour=.2 attack=.6 tire=1.5 depth=.7 length=24 rise=1.2 edge=.6 seep=.2 air=.15 recover=8 after=0.4 | answerkeys | lowsteps | Low dark voices whose mirror is a small bell high in the vault
Vowel and its coin | - | source=Vowel opposite=Mirror form=.65 colour=.8 attack=.05 release=.2 tire=.2 depth=.9 length=6 rise=.04 edge=.8 seep=0 safe=Stay width=.8 volume=3 recover=0.8 after=0.86 | brightair 1.mix=.2 | calls | Short bright ehs that each turn over to show their mirror
Evening roll call | - | source=Vowel opposite=Mirror form=.5 colour=.35 attack=.2 release=.6 tire=.6 depth=1 recover=16 memory=Note length=9 rise=.2 edge=.2 seep=.4 volume=1 after=0.64 | late | samekey | One voice asked again and again, answering more and more from its mirror
Sky seen from a pew | - | source=Vowel opposite=Mirror form=.55 colour=.45 attack=2.8 release=3 tire=4 depth=.9 seep=.75 length=32 rise=2 edge=.1 drift=.9 width=1 recover=20 | lifted | leaning | A slow ah with a soft mirror opening inside it as it tires
Boys at the lectern | - | source=Vowel opposite=Even form=.45 colour=.6 attack=.2 release=.4 air=.1 tire=.9 depth=.6 length=7 rise=.2 edge=.6 drift=0 after=0.55 | bed 1.mix=.16 | twovoices | Clear young voices, quick to speak, with a plain octave after each
Bees in the cloister | - | source=Vowel opposite=Even form=.28 colour=.95 attack=.6 tire=1.2 seep=.9 depth=.8 after=.8 length=10 edge=.95 drift=1 width=1 volume=0 recover=6 | ensemble | leaning | Bright voices worn through by a loose buzzing octave
Lullaby with lights off | - | source=Vowel opposite=Even form=.08 colour=.05 attack=.7 release=1 tire=2.5 depth=.4 length=18 rise=1.5 edge=.2 air=.3 blink=.5 blinkRate=.6 recover=12 after=0.64 | halo | sung | A dark oo under slow lids, its octave glowing each time they close
Throat of a swan | - | source=Vowel opposite=Even form=.85 colour=.4 attack=.15 tire=.3 depth=1 length=3 rise=.06 edge=.1 after=.9 release=.2 memory=Octave volume=1.5 recover=7 | hollowbox | sinking | A nasal eh that gives out in a breath and leaves a round octave | wind
Cherub with a cold | - | source=Vowel opposite=Even form=.75 colour=.3 attack=1.2 air=.85 tire=2 depth=.7 length=12 rise=.8 edge=.4 seep=.4 width=.06 | mono | overlaps | An eh that is mostly air, narrow and near, with its octave behind
Whisper to whisper | - | source=Vowel opposite=Sides form=.6 colour=.3 air=.65 attack=.3 tire=.7 depth=.9 length=6 rise=.3 edge=.5 after=.5 width=1 | sidelit | calls | More whisper than voice, passing to its own shaking sides
Gallery of murmurs | - | source=Vowel opposite=Breath form=.48 colour=.3 air=.9 attack=1 release=2 tire=1.5 depth=.8 seep=.5 length=12 edge=.3 drift=.8 | watery | leaning | Ahs rubbed down to air, with a slow breath under the whispering | texture
Secret in the stairs | - | source=Vowel opposite=Below form=.3 colour=.7 air=.75 attack=.1 release=.3 tire=.5 depth=.7 length=8 rise=.4 edge=.2 width=.3 volume=0 recover=6 | stairwell | drops | A whispered oh, and a dark octave below it walking off
Grille between us | - | source=Vowel opposite=Rough form=.15 colour=.45 air=.65 attack=.4 tire=1 depth=.9 length=10 rise=.8 edge=.2 seep=.2 width=.9 recover=11 | booth | sinking | A breathy oo that leaves soft frayed bands to left and right
Frost on a hymn | - | source=Vowel opposite=Mirror form=.9 colour=.65 air=.7 attack=1.6 tire=3 depth=.5 length=20 rise=1 edge=.6 drift=.5 recover=12 after=0.6 | frost | overlaps | Hissing ees over which a glinting mirror slowly settles
Monks before rain | - | source=Vowel opposite=Below form=.1 colour=.35 attack=.5 release=.6 tire=2 depth=.5 length=9 rise=.5 edge=.5 seep=.3 air=.1 volume=-2 after=0.5 | choirtail 1.mix=.24 | lowsteps | Low oos that step, with an octave below them resting on the stone
Basso in the cistern | - | source=Vowel opposite=Even form=.35 colour=.5 attack=.2 release=.3 tire=.6 depth=.9 length=12 rise=.4 edge=.7 seep=.05 width=.4 volume=3 recover=8 after=0.4 | swarm | lowsteps | A low round voice that leaves a hard clear octave in the tank
Throat song in the dark | - | source=Vowel opposite=Mirror form=.4 colour=.8 attack=.3 tire=.4 depth=.8 seep=.8 length=8 edge=.4 rise=.2 after=.9 drift=.2 volume=-1 recover=1.8 | whistle | lowlong | A low bright voice that thins while a mirror whistles high over it
Choir under the ice | - | source=Vowel opposite=Sides form=.2 colour=.2 attack=1.8 release=4 tire=4 depth=.7 length=24 rise=1.5 edge=.25 drift=.7 seep=.4 safe=Stay recover=12 after=0.6 volume=-2 | under | lowfifths | Low voices, slow and far down, their trembling sides dim beside them | drone
Old men's table | - | source=Vowel opposite=Rough form=.55 colour=.3 attack=.15 release=.2 tire=.8 depth=.1 length=3 rise=.1 edge=.3 air=.3 after=.45 recover=.5 | parlour | lowwalk | Low gruff ahs with a short torn rumble after each
Winking choirboy | Blinking pulse | source=Vowel opposite=Mirror form=.5 colour=.55 blinkRate=1 blink=.95 length=7 edge=.6 air=.15 recover=1.8 | chapel | fourparts | An ah shut off by lids once a second, with a mirror in each gap
Stammer of light | Blinking pulse | source=Vowel opposite=Even form=.65 colour=.7 blinkRate=6.5 blink=.8 length=4 edge=.4 depth=.6 tire=.4 volume=2.5 recover=11 | answering | sung | A voice cut into syllables by quick lids, octaves between
Slow nodding | Blinking pulse | source=Vowel opposite=Below form=.25 colour=.25 blinkRate=.2 blink=1 attack=.8 length=14 edge=.2 seep=.1 drift=.5 release=2 recover=2 after=0.64 | darkhall | leaning | Voices that nod off every five seconds into an octave below
Flicker at compline | Blinking pulse | source=Vowel opposite=Sides form=.35 colour=.45 blinkRate=3.5 blink=.5 air=.5 length=10 edge=.5 seep=.4 recover=2.4 | glimmer | overlaps | A breathy oh that flutters under its lids, shaking sides between
Crying behind a window | Blinking pulse | source=Vowel opposite=Rough form=.8 colour=.6 blinkRate=1.8 blink=.85 length=5 edge=.6 air=.25 tire=.5 depth=.8 volume=-2 recover=1.8 | rain | sinking | An eh behind beating lids, with rough wet bands when they close
Everyone who sang here | Remembered texture | source=Vowel opposite=Breath form=.5 colour=.4 attack=.8 tire=1 depth=.9 length=14 rise=.8 edge=.3 seep=.5 air=.3 after=0.6 volume=-1.5 | faraway | again | An ah that remembers the whole chord, each time with more breath than voice
Choir of one photograph | Remembered texture | source=Vowel opposite=Sides form=.3 colour=.5 attack=.2 tire=.3 depth=.85 recover=14 length=8 rise=.2 edge=.25 seep=.3 volume=1 after=.6 | record | again | Voices that tire together in an instant and come back as trembling sides
Answers wear out | Remembered texture | source=Vowel opposite=Even form=.6 colour=.3 memory=Octave attack=.1 tire=.5 depth=1 recover=10 length=5 rise=.1 seep=.2 width=.5 release=.2 volume=-1.5 | smallbody | samekey | A voice that fails in every octave, its even shadow standing in for it
Psalm without words | Remembered texture | source=Vowel opposite=Below form=.42 colour=.6 attack=1 tire=3 depth=.7 recover=6 seep=.6 length=18 edge=.6 rise=1 safe=Stay after=0.64 | common | leaning | Voices that tire together over a hollow octave below that will not follow them
Names on a wall | Remembered texture | source=Vowel opposite=Mirror form=.75 colour=.25 attack=.4 air=.5 tire=.8 depth=.9 recover=20 length=24 edge=.3 seep=.35 rise=.6 after=0.6 volume=-1 | recall | again | Faint ehs that remember the whole chord and fade into its mirror
`,
    },
    {
      id: 'tiring-bass',
      name: 'Tiring bass',
      category: 'bass',
      rows: `
Coalman's accordion | Tiring bass | form=.35 colour=.25 tire=.4 depth=.8 after=.6 length=4 rise=.1 air=.2 volume=-5 | narrow | lowwalk | A low reed that pales as it is pressed, its mirror faint and high above
Barge engine at the lock | Tiring bass | form=.15 colour=.45 tire=.25 depth=1 recover=2.5 length=2 edge=.7 after=.8 width=.05 | iron | lowsteps | A hollow reed that dies in a quarter second and leaves a glinting bell far up
Ferry at four o'clock | Tiring bass | form=.6 colour=.6 attack=.25 release=.8 tire=2 depth=.5 length=14 rise=1 drift=.5 width=.7 volume=1.5 | valley | lowlong | A broad low reed with a late high mirror, as a harbour might answer it
Foot on the swell pedal | Tiring bass | form=.5 colour=.1 attack=5 tire=4 depth=.6 seep=.6 after=.7 length=9 edge=.2 | chorus | lowfifths | Dark reeds that swell, with a small high mirror already showing | organ
Nail in a floorboard | Tiring bass | form=.9 colour=.5 tire=.12 depth=.9 after=.9 length=1.5 rise=.04 edge=.5 release=.15 air=0 | bite | lowwalk | A short nasal low reed, and a brief high glint where it was driven in
Round as a millstone | - | opposite=Even form=.05 colour=.1 attack=.03 release=.25 tire=1 depth=.15 length=2.5 rise=.08 edge=.2 after=.7 width=0 air=.05 volume=-14 recover=.4 | deepened | lowwalk | A round dark lamp, low and plain, with a short even octave on each release
Moon under the hull | - | opposite=Even form=.12 colour=.3 attack=.15 release=1.5 tire=2.5 seep=.4 length=12 edge=.35 drift=.4 width=.4 air=.1 volume=-11 recover=20 after=0.55 | darkecho | lowsteps | A low hollow lamp that glides into its own soft octave
Cellar bulb | - | opposite=Even form=.3 colour=.55 attack=.01 release=.2 tire=.3 depth=.8 length=5 rise=.2 edge=.75 seep=.1 recover=10 after=0.48 | largebody | lowwalk | A bright low bulb that fades quickly, with a sharp octave after it
Glow through tar | - | opposite=Even form=.8 colour=.2 attack=.5 release=.5 tire=1.5 depth=.6 seep=.8 length=7 edge=.5 drift=.8 width=.6 volume=-10.5 recover=3.4 | swirl | lowlong | A slow low lamp in octaves, with loose even tones glowing through it
Furnace seen asleep | - | opposite=Even form=.6 colour=.4 attack=1.5 release=2 tire=6 depth=.9 length=20 rise=2 edge=.15 air=.5 recover=9 | undertow | lowfifths | A low lamp with hiss on it, slow to warm and slower to leave its octave | drone
Upright in the dark | Keys that leave | form=.5 colour=.3 air=.4 tire=1 length=4 rise=.3 edge=.2 release=.25 after=.6 width=.05 recover=2.4 | booth | lowsteps | A plucked low string and, when the finger lifts, a hollow octave below
Gut and a low beam | Keys that leave | form=.25 colour=.6 attack=.08 air=.15 tire=.4 depth=.9 length=10 rise=.6 edge=.5 seep=.4 volume=-5 after=.4 | chamber | lowsteps | A long low string that thins early over a pipe beneath it
Thumb on the low one | Keys that leave | opposite=Even form=.9 colour=.2 air=.6 tire=.2 depth=.7 length=2 rise=.06 edge=.3 seep=.5 release=.15 volume=-13 recover=0.5 after=0.55 | forward | lowwalk | A short thumbed string, all body, with a quick round octave inside it
Cable across the gorge | Keys that leave | opposite=Rough form=0 colour=.8 air=.3 tire=1.5 depth=.5 length=8 rise=.2 edge=.15 release=2 width=.9 after=.55 recover=8 | openspace | lowlong | A wiry low string left to ring, with torn bands humming along after it
Rubber-soled walk | Keys that leave | opposite=Breath form=.75 colour=.15 air=.8 tire=.5 length=3 rise=.1 edge=.1 after=.5 width=.3 release=.2 volume=-2 | pillow | lowwalk | A dull plucked string with a puff of dark breath under each step
Gravel in the hopper | Tiring bass | opposite=Rough form=.7 colour=.35 tire=.6 depth=.6 after=0.53 length=3 edge=.3 seep=.4 rise=.06 | desk | lowwalk | A full low reed with rough gravel running under it
Awning in a low wind | Tiring bass | opposite=Rough form=.4 colour=.3 attack=.4 release=.6 tire=1.5 length=10 edge=.2 after=.5 drift=.7 width=.8 volume=-6.5 | waters | lowlong | A dark reed giving way to soft torn bands that flap and pass
Saw in wet timber | Tiring bass | opposite=Rough form=.95 colour=.7 tire=.2 depth=.95 after=.8 length=2.5 edge=.8 seep=.8 volume=-10.5 | gatefilter | lowsteps | A rasping low reed, almost at once a ragged band of itself
Dredger at night | Tiring bass | opposite=Rough form=.2 colour=.5 attack=.8 tire=3 depth=.8 seep=.6 length=14 edge=.55 drift=1 memory=Chord volume=-10.5 | answerkeys | lowfifths | Hollow low reeds dragging rough bands up from the bottom | drone
Muffled footfall | Tiring bass | opposite=Rough source=Lamp form=0 colour=.1 tire=.1 depth=.5 after=.5 length=1.2 rise=.04 edge=0 release=.2 volume=-8 | mono | lowwalk | A stub of dark lamp with a soft frayed thud behind it
Pipe under the pipe | - | opposite=Below form=.1 colour=.35 attack=.05 release=.3 tire=.8 depth=.5 length=3 rise=.3 edge=.5 after=.8 width=0 volume=-11 | warm | lowsteps | A plain low lamp whose hollow octave below comes as it goes
Down the lift shaft | - | opposite=Below form=.2 colour=.7 attack=.02 release=.15 tire=.3 depth=.9 length=6 rise=.6 edge=.2 seep=0 after=.6 | late | lowsteps | A clear low lamp snapped off, then the floor below it half a second on
Tide against pilings | - | opposite=Below form=.4 colour=.15 attack=.6 release=1.5 tire=2 seep=.8 depth=.8 length=12 edge=.5 drift=.9 air=.3 volume=-11.5 after=.5 | waters | lowsteps | A slow dark lamp rocking with the octave under it | drone
Lights in the deep end | - | opposite=Below form=.85 colour=.5 attack=.15 tire=1.2 depth=.6 seep=.3 length=9 edge=.75 width=.6 recover=8 after=0.86 | shallows | lowsteps | A low lamp in octaves over a hard-edged pipe another octave down
Landlord's step | - | opposite=Below form=0 colour=.05 attack=.01 release=.2 tire=.15 depth=.1 length=1.5 rise=.05 edge=.1 after=1 air=0 volume=-12.5 width=0 recover=.3 | muffled | lowsteps | A lamp of hardly more than its first partial, and the thud below it
Log drum in river mist | Wooden shadow | opposite=Breath form=.08 colour=.3 tire=.2 length=5 rise=.2 edge=.2 air=.3 after=.8 recover=14 | mist | lowwalk | Low wooden bars, each with a dark breath that drifts off it
Cork out of the cellar | Wooden shadow | opposite=Breath form=0 colour=.7 tire=.1 depth=.8 length=1.5 rise=.04 edge=.8 air=.6 volume=0 recover=0.8 | held | lowwalk | A hard wooden knock and a quick bright puff of breath
Hollow oak | Wooden shadow | opposite=Sides form=.14 colour=.15 tire=2 depth=.05 length=14 rise=2 edge=.3 drift=.6 width=.9 air=.35 attack=.2 after=.5 | boards | lowsteps | A dark low bar of wood; after it two trembling sides, as of something within
Bell left in silt | Wooden shadow | opposite=Even form=.45 colour=.1 attack=.2 release=3 tire=1 length=18 rise=1 edge=.4 seep=.3 air=.1 recover=2.4 | under | lowlong | A muffled bell, very low, and an octave that rises slowly off it | bell
Stamp of the press | Wooden shadow | opposite=Mirror form=.2 colour=.6 tire=.2 depth=1 length=3 rise=.04 edge=.6 air=.45 after=.75 recover=1.6 volume=-1.5 attack=.12 | slap | lowwalk | Low struck bars, stamped flat, with a small bright mirror high up
Wheel with a loose hub | - | source=Bowl opposite=Sides form=.35 colour=.3 attack=.1 release=.15 tire=.8 depth=.6 length=4 edge=.4 drift=.7 width=.8 air=.2 volume=-10 | fastrotor 1.mix=.4 | lowsteps | A low rubbed bowl that wobbles, and its shaking sides when it stops
Boiler and its gauge | - | source=Bowl opposite=Mirror form=.6 colour=.55 attack=.04 release=.15 tire=.4 depth=.9 length=6 rise=.2 edge=.6 air=.5 recover=7 | boards 1.mix=.5 | lowwalk | A low bowl, grating on its rim, with a high needle of a mirror
Grindstone stopping | - | source=Bowl opposite=Rough form=.5 colour=.4 attack=.2 release=.2 tire=.3 depth=1 recover=1 length=5 rise=.1 edge=.5 after=.9 air=.6 | notch | lowsteps | A low rim that grinds down into rough bands under each key
Looking into the cave | - | source=Bowl opposite=Breath form=.15 colour=.15 attack=.6 release=.5 tire=2 seep=.5 length=14 edge=.3 drift=.4 width=.6 | cave | lowlong | A low dark bowl with a breath going in and out behind it | drone
Copper still | - | source=Bowl opposite=Below form=.8 colour=.65 attack=.06 release=.2 tire=.6 depth=.5 length=8 rise=.4 edge=.6 seep=.2 width=.4 recover=8 after=0.5 | hollowbox | lowsteps | Bright low bowls over a hollow pipe in the floor below
Sleeper by sleeper | Blinking pulse | source=Reed opposite=Rough form=.5 colour=.3 blinkRate=4 blink=.9 attack=.02 length=2 edge=.4 width=.3 tire=.5 recover=1.8 | faintup | lowsteps | A low reed cut by lids four times a second, a rough band in each cut
Pump in a wet field | Blinking pulse | opposite=Below form=.15 colour=.2 blinkRate=1.4 blink=1 attack=.05 length=5 edge=.3 width=.2 volume=-12 | warm | lowsteps | A low lamp with heavy lids; each time they close, the octave below
Rotor beyond the hills | Blinking pulse | source=Reed opposite=Breath form=.3 colour=.25 blinkRate=9 blink=.8 attack=.2 length=4 edge=.4 width=.8 volume=0 | shore | lowlong | A low reed under beating lids, breath in the gaps
Idling under sodium | Blinking pulse | source=String opposite=Even form=.15 colour=.45 blinkRate=2.2 blink=.6 air=.3 length=3 edge=.5 tire=1.5 width=.4 recover=3.4 | throb | lowsteps | Low wiry strings dimmed by lids, an octave between the beats
Half-shut furnace door | Blinking pulse | form=.9 colour=.35 opposite=Sides blinkRate=.4 blink=.95 attack=.3 length=8 edge=.35 seep=.1 release=1 recover=2.4 | combo | lowlong | A low octave lamp that slow lids shut to show two trembling sides
Ladder giving way | Tiring bass | memory=Octave opposite=Even form=.4 colour=.4 tire=.3 depth=1 recover=6 length=5 edge=.6 seep=.3 after=.8 volume=-7.5 | plate 1.mix=.14 | lowwalk | A reed that tires in all its octaves and leaves even tones to carry the line
Worn heel | Tiring bass | memory=Note source=String opposite=Rough form=.55 colour=.35 tire=.2 depth=.95 recover=9 length=3 edge=.25 air=.4 | keyed | lowwalk | A plucked string that wears thin where it is trodden, rough cloth under it
Bridge closed to lorries | Tiring bass | memory=Chord source=Bowl opposite=Below form=.3 colour=.4 tire=1 depth=.8 recover=12 length=10 seep=.5 release=.3 | darkhall 1.mix=.18 | lowsteps | Low bowls that tire together and sink to the octave below
Fourth night shift | Tiring bass | memory=Octave opposite=Breath form=.65 colour=.5 tire=.5 depth=.9 recover=15 length=4 rise=.3 edge=.5 after=.9 | worn | lowwalk | A low reed more tired at each return, with more breath than tone by the end
Tenant of every floor | Tiring bass | memory=Octave source=Lamp opposite=Mirror form=.25 colour=.5 tire=.4 depth=1 recover=10 length=8 seep=.4 edge=.4 width=.5 | repeats | lowwalk | A low lamp that tires in every octave while its mirror takes over high up
Bishop's cough | - | source=Vowel opposite=Rough form=.45 colour=.4 attack=.02 release=.15 tire=.3 depth=.8 length=1.5 rise=.05 edge=.2 air=.4 after=.8 width=.05 recover=0.8 | chamber | lowwalk | A short low ah and a rough scrape of bands after it
Pedal with a tongue | - | source=Vowel opposite=Below form=.85 colour=.3 attack=.1 release=.2 tire=1.5 depth=.5 length=6 edge=.7 seep=.3 width=.3 recover=3.4 | vowelpress | lowsteps | A low eh, steady as a pedal, with a reedy pipe an octave below | organ
Sleeping ox | - | source=Vowel opposite=Breath form=.05 colour=.1 attack=.5 release=.6 tire=1 depth=.7 length=6 rise=.5 edge=.1 air=.5 blink=.4 blinkRate=.35 width=.1 recover=2.4 | pillow 1.distance=.1 | lowlong | A low oo, very dark, with slow breath each time the lids sink
Great stop in a hurry | - | source=Reed opposite=Even form=.6 colour=.35 attack=.01 release=.15 tire=8 depth=0 length=2 rise=.08 edge=.55 seep=.15 air=.1 width=.5 after=.45 recover=.5 | room | lowwalk | Full low reeds that never tire, with short even octaves in the rests | organ
Double shadow | - | source=Reed opposite=Sides form=.55 colour=.35 attack=.08 release=.4 tire=.7 depth=.8 length=6 rise=.3 edge=.2 seep=.3 drift=1 width=1 safe=Stay after=.4 volume=3.5 | ensemble | lowlong | A low reed whose two sides shake apart to left and right
`,
    },
    {
      id: 'blinking-pulse',
      name: 'Blinking pulse',
      category: 'pad',
      rows: `
Red light, empty street | Blinking pulse | blinkRate=2 blink=.95 form=.5 colour=.45 tire=1 length=5 edge=.5 attack=.2 recover=2.2 | plate | lookaway | A full lamp that lids shut twice a second to a clean octave
Neon with a fault | Blinking pulse | blinkRate=5.5 blink=.7 form=.95 colour=.85 tire=.4 length=3 edge=.95 air=.35 drift=.3 volume=-0.5 recover=0.5 | glaze | calls | A bright octave lamp under nervous lids, sharp even tones in the gaps
Semaphore at sundown | Blinking pulse | blinkRate=1 blink=1 form=.2 colour=.3 release=1.5 length=12 edge=.3 seep=.1 drift=.5 safe=Stay recover=12 after=0.4 | valley | leaning | A hollow lamp covered once a second, its soft octave lifted each time
Cinema, third row | Blinking pulse | blinkRate=3 blink=.25 form=.7 colour=.2 attack=.6 tire=3 length=8 edge=.7 seep=.35 width=1 recover=20 after=0.5 | hiss | overlaps | A dark lamp seen through shallow lids, three to the second, octaves above
Signal across the bay | Blinking pulse | blinkRate=1.6 blink=.85 form=.05 colour=.7 tire=.6 depth=.7 length=14 edge=.85 width=.4 rise=.1 volume=-1 | farstar | onetone | A hollow lamp blinked in code, and a bright octave between the signs
Short lids of midnight | Blinking pulse | opposite=Mirror blinkRate=.15 blink=1 form=.4 colour=.35 attack=.8 length=14 edge=.4 drift=.5 seep=.1 release=2 recover=12 | hall | overlaps | A lamp that closes about every seven seconds and opens on its mirror
Dawn counted slowly | Blinking pulse | opposite=Below blinkRate=.12 blink=1 form=.6 colour=.6 attack=2 tire=3 length=20 edge=.25 depth=.7 recover=18 | openspace | leaning | A lamp whose one slow blink in eight seconds shows the octave below
A blind turned slowly | Blinking pulse | opposite=Sides blinkRate=.25 blink=.9 form=.8 colour=.5 attack=.5 length=10 edge=.5 width=1 drift=.6 recover=12 | panned | leaning | A lamp in octaves, shut every four seconds to its shaking sides
Tide by the hour | Blinking pulse | opposite=Breath blinkRate=.3 blink=1 form=.3 colour=.25 attack=.6 release=2.5 length=9 edge=.4 after=1 volume=-10.5 recover=12 | midsummer | lookaway | A soft lamp that gives place every three seconds to a wash of breath
Half asleep on the train | Blinking pulse | source=Reed opposite=Below blinkRate=.35 blink=.8 form=.4 colour=.2 attack=.8 length=8 edge=.3 drift=.4 release=1 recover=8 | losing | leaning | Dark reeds nodding under lids, a hollow pipe below them when they close
Dragonfly lamp | Blinking pulse | blinkRate=11 blink=.6 form=.55 colour=.6 attack=.3 tire=1.5 length=6 edge=.6 width=1 volume=-0.5 | hazy | onetone | A lamp under lids so quick they buzz, octaves caught between them | texture
Heat over the road | Blinking pulse | opposite=Sides blinkRate=8 blink=.2 form=.15 colour=.3 attack=3 seep=.6 length=12 edge=.2 drift=1 release=2 source=Reed after=.6 recover=8 | shiftdrift | leaning | Hollow reeds in a fast flutter of shallow lids, trembling sides all about them
Wing against the bulb | Blinking pulse | source=String opposite=Mirror blinkRate=9.5 blink=.8 form=.2 colour=.7 air=.5 length=7 edge=.7 tire=.6 recover=8 after=0.48 volume=-1.5 | spring | climb | Wiry strings fluttered by fast lids, their mirror glinting through | string
Old projector | Blinking pulse | source=Lamp opposite=Rough blinkRate=12 blink=.75 form=.4 colour=.4 attack=.1 air=.6 length=3 edge=.5 | oldrecord | sinking | A lamp through the fastest lids, with torn bands like scratched film | texture
Leaves across a lamp | Blinking pulse | source=Bowl opposite=Even blinkRate=7 blink=.5 form=.4 colour=.5 attack=.5 length=9 edge=.8 drift=.6 air=.3 release=.5 recover=6 | ripples | overlaps | Rubbed bowls dappled by quick lids, a bright octave coming through
Treadle organ | Blinking pulse | source=Reed blinkRate=2.4 blink=.6 form=.6 colour=.4 attack=.05 length=3 edge=.4 tire=4 depth=.08 seep=.2 air=.4 release=.2 after=.5 recover=.8 | parlour | fourparts | Full reeds pumped by lids, with an even octave on every stroke | organ
Passing carriages | Blinking pulse | source=Reed opposite=Sides blinkRate=4.8 blink=.85 form=.8 colour=.6 attack=.15 length=4 edge=.5 width=1 volume=-4 | forward | twovoices | Bright reeds cut by quick lids, trembling sides flung to each ear
Mill race and wheel | Blinking pulse | source=Reed opposite=Breath blinkRate=1.5 blink=.9 form=.3 colour=.5 air=.6 length=5 edge=.5 tire=.8 | waters | lookaway | Breathy reeds turned under by lids, and wet breath between the turns
Split seam | Blinking pulse | source=Reed opposite=Even blinkRate=.8 blink=.75 form=.15 colour=.1 attack=.4 air=.9 length=8 edge=.2 release=1.5 drift=.3 | jar | leaning | Hollow dark reeds and much air, lids closing like folds on an octave
Sunday at the factory | Blinking pulse | source=Reed opposite=Rough blinkRate=3.2 blink=1 form=.95 colour=.35 attack=.02 length=2 edge=.3 tire=.3 depth=.8 recover=1.2 | bandpulse | calls | Nasal reeds stamped by lids, rough bands between them, wholly mechanical | keys
Guitar behind a fan | Blinking pulse | source=String opposite=Even blinkRate=4 blink=.3 form=.15 colour=.5 air=.2 tire=1.5 length=5 edge=.4 release=.8 recover=8 | amptrem 1.depth=.2 | hands | Long wiry strings chopped softly by lids, octaves in the blades | string
Harp on a carousel | Blinking pulse | source=String opposite=Mirror blinkRate=1.3 blink=.7 form=.5 colour=.6 air=.15 length=10 edge=.5 tire=.8 drift=.3 safe=Stay recover=8 after=0.86 | rotor | climb | Round strings with lids over them, the mirror showing at each turn | plucked
Passing the picket fence | Blinking pulse | source=String opposite=Below blinkRate=6 blink=.9 form=.35 colour=.8 attack=.06 length=3 edge=.6 tire=.5 volume=2.5 | dotted | sinking | Bright plucks sliced by quick lids over a buzzing pipe below | plucked
Rain on and off | Blinking pulse | source=String opposite=Breath blinkRate=.6 blink=.85 form=.7 colour=.4 air=.5 length=6 edge=.6 after=.9 recover=2 | rain | hands | Damped strings; every second or two lids close them over in breath | plucked
Loom song | Blinking pulse | source=String opposite=Rough blinkRate=2.8 blink=.8 form=.05 colour=.35 air=.7 length=3 edge=.2 tire=2 width=.7 volume=-2 recover=8 | boards | turning | Wiry strings under working lids, with soft frayed bands between | string
Prayer wheel | Blinking pulse | source=Bowl opposite=Mirror blinkRate=.7 blink=.8 form=.3 colour=.4 attack=.6 length=14 edge=.5 release=.8 drift=.4 recover=8 | bowltable | fifthdrone | Rubbed bowls that lids put out at every turn, a high mirror in place | drone
Moon between carriages | Blinking pulse | source=Bowl opposite=Sides blinkRate=2.6 blink=.95 form=.6 colour=.6 attack=.2 length=5 edge=.4 width=1 release=.3 recover=2.2 after=0.6 | circle | leaning | Bowls that lids cut clean, trembling sides thrown wide in the gaps
Cymbal of water | Blinking pulse | source=Bowl opposite=Rough blinkRate=1.1 blink=.7 form=.9 colour=.9 attack=.3 air=.8 length=12 edge=.1 drift=.7 release=1 | thinair | overlaps | Bright rims, hissing, that lids turn over into soft rough bands | texture
Bowl on a train table | Blinking pulse | source=Bowl opposite=Below blinkRate=5 blink=.25 form=.15 colour=.25 attack=.15 length=6 edge=.6 tire=2 release=.4 after=0.64 | desk | sinking | A dark bowl rattled by shallow lids, its octave below knocking | keys
Rope into the well | Blinking pulse | source=Bowl opposite=Breath blinkRate=.4 blink=1 form=.45 colour=.15 attack=.4 length=10 edge=.2 after=1 release=1.5 volume=-10 recover=12 | cave | widedrone | Dark bowls let down under slow lids into a low breath, and drawn up | drone
Glass eyelids | Glass flutter | blinkRate=2 blink=.9 form=.9 opposite=Even colour=.5 length=8 edge=.5 seep=.2 tire=.6 recover=2.4 | longplate 1.mix=.2 | climb | Struck glass shut off by lids twice a second, an octave flashing in each blink | bell
Coins in the fountain | Glass flutter | blinkRate=6.5 blink=.8 form=.7 opposite=Mirror colour=.8 length=5 edge=.7 seep=.1 air=.3 drift=.2 recover=11 | glints2 | highpeal | Bright half-glass strokes, flicked by lids against a low warm mirror | bell
Heart under a bell jar | Glass flutter | blinkRate=1 blink=1 form=.5 opposite=Rough colour=.2 length=6 edge=.15 seep=.3 air=.5 width=.5 drift=0 recover=2.4 | jar | onetone | A dull bell under heavy lids, with a soft rough thud once a second | bell
Pigeon at the shutter | Wooden shadow | blink=.9 blinkRate=3.6 opposite=Breath form=.3 colour=.65 tire=.5 length=4 edge=.15 after=.6 volume=-2 | fog | pairs | Bright bars under quick lids, and a soft fluttered breath left for each | plucked
Hail, then quiet | Glass flutter | blinkRate=12 blink=1 form=1 opposite=Breath colour=.85 length=2 edge=.3 seep=.5 air=.5 tire=.15 volume=3.5 after=.45 recover=7 depth=.4 | brightair 1.mix=.16 | calls | Hard glass rattled by the fastest lids in a hiss of breath | texture
Playing with one eye | Blinking pulse | opposite=Mirror blinkRate=2.2 blink=.6 form=.45 colour=.55 attack=.02 release=.2 length=4 edge=.5 tire=.4 recover=1.8 | slap | twovoices | Quick lamp keys; the mirror leans in whenever the lids close | keys
Lesson by power cut | Blinking pulse | source=String opposite=Mirror blinkRate=.9 blink=1 form=.4 colour=.4 air=.2 release=.3 length=7 edge=.3 tire=1 safe=Stay recover=6 | nextdoor | hands | Round strings lost to each blink, where only their mirror is lit | keys
Keyed in the dark | Blinking pulse | opposite=Below blinkRate=4.4 blink=.95 form=.3 colour=.75 attack=.02 release=.2 length=2 edge=.7 tire=.3 depth=.8 width=.4 recover=0.5 | combo | calls | A bright lamp keyed by quick lids, a short pipe below in the spaces | keys
Turning the pages | Blinking pulse | source=Struck opposite=Breath blinkRate=1.1 blink=.8 form=.5 colour=.2 air=.4 length=6 edge=.5 tire=.5 after=.6 recover=1.2 | doubled | hands | Soft bells under slow lids, each close of them a page's breath | keys
Toy theatre | Blinking pulse | source=Struck opposite=Mirror blinkRate=3 blink=.9 form=.75 colour=.65 air=.1 length=3 edge=.6 tire=.2 depth=.8 width=.6 volume=-1.5 recover=8 after=0.4 | transistor | - | Small glassy bells under busy lids, a mirror popping up behind each | keys
Wind turbine | Blinking pulse | opposite=Breath blinkRate=.9 blink=1 form=.15 colour=.2 attack=.4 length=8 edge=.6 after=1 air=.4 width=.9 volume=-11 recover=12 | breeze | widedrone | A dark hollow lamp swept by lids, and a wide breath on every blade | drone
Snow glare | Blinking pulse | opposite=Breath blinkRate=5 blink=.7 form=.5 colour=.9 attack=1 length=12 edge=.75 seep=.6 drift=.7 after=.5 | frost | overlaps | A glaring lamp under flickering lids, a bright hiss of breath throughout | texture
Short-winded bellows | Blinking pulse | source=Reed opposite=Breath blinkRate=.5 blink=1 form=.5 colour=.35 attack=.3 air=1 length=5 edge=.3 after=.9 release=1 recover=12 | smalldark | leaning | Reeds with as much air as tone, closed by lids upon breath alone
Curtain and sea wind | Blinking pulse | source=Vowel opposite=Breath blinkRate=.22 blink=.9 form=.2 colour=.5 attack=1.5 length=14 edge=.7 drift=.6 release=2 volume=-2 recover=8 after=0.6 | shore | overlaps | A round oh that lids cover slowly with a sea of bright breath | voice
Night ward machine | Blinking pulse | source=Bowl opposite=Breath blinkRate=.28 blink=1 form=.25 colour=.3 attack=.5 tire=4 length=7 edge=.15 after=.9 release=.5 recover=15 | lungs | fifthdrone | A bowl and a dark breath, changing places every three and a half seconds | drone
Searchlight on cloud | Blinking pulse | opposite=Rough blinkRate=.5 blink=.9 form=.6 colour=.4 attack=.5 length=9 edge=.3 drift=.5 width=1 | clouds | leaning | A lamp that sweeps past on slow lids and lights torn bands behind
Welding next door | Blinking pulse | opposite=Rough blinkRate=7.5 blink=.85 form=.9 colour=.8 attack=.04 length=3 edge=.9 air=.3 tire=.3 recover=14 | nextdoor | calls | A hard bright lamp under jumping lids, rough sparking bands between | texture
Relay room | Blinking pulse | source=Struck opposite=Rough blinkRate=4 blink=1 form=.05 colour=.6 air=.6 length=2 edge=.4 tire=.2 memory=Chord recover=4 volume=-0.5 | gated | turning | Dry wood clicking under lids, a torn buzz of contacts in each gap | plucked
Wet glass of a night bus | Blinking pulse | opposite=Rough blinkRate=1.4 blink=.6 form=.25 colour=.2 attack=.8 length=14 edge=.1 seep=.5 drift=.9 release=2 safe=Stay after=0.48 | darktrail | overlaps | A dim lamp passed over by lids, soft ragged bands smearing on
Reel with no sound | Blinking pulse | source=Reed opposite=Rough blinkRate=2.5 blink=.75 form=.05 colour=.5 attack=.1 length=5 edge=.6 tire=.6 depth=.9 width=.4 memory=Octave recover=6 | record | sinking | Hollow reeds flickering under lids with torn edges to every frame | keys
`,
    },
    {
      id: 'bowl-drone',
      name: 'Bowl drone',
      category: 'drone',
      rows: `
Bronze hour | Bowl drone | form=.3 colour=.35 attack=1.2 tire=6 depth=.7 length=20 rise=1.5 seep=.3 edge=.3 recover=12 | undertow | fifthdrone | Rubbed bowls, slow and even, with a hollow octave below coming up through them
Three rims by one finger | Bowl drone | form=.5 colour=.6 attack=.5 tire=3 depth=.5 seep=.6 length=14 edge=.65 air=.5 release=1 recover=15 | jar | widedrone | Bowls with the finger audible on the rim, a reedy pipe below each
Weight of the roof | Bowl drone | form=.1 colour=.1 attack=1 tire=5 depth=.9 seep=.6 after=0.68 length=32 rise=2 drift=.9 air=.1 volume=-5 recover=15 | darkhall | fifthdrone | Very dark bowls that sink in time into the octave below them
Unstruck bell metal | Bowl drone | form=.8 colour=.7 attack=.8 tire=2 depth=.8 length=18 edge=.15 seep=.15 width=.9 release=2 recover=8 | strings | leaning | Bright wide bowls over a plain dark pipe an octave below
Iron lid on a millpond | Bowl drone | form=.02 colour=.35 attack=.5 tire=4 drift=0 seep=.45 length=7 edge=.95 width=.2 air=.4 after=.9 recover=15 | darkplate | fifthdrone | Still narrow bowls, plain as a hum, over a buzzing octave like grit under a lid
Ring about the moon | - | source=Bowl opposite=Mirror form=.4 colour=.4 attack=.8 tire=3 depth=.7 seep=.5 length=24 rise=1 edge=.4 drift=.4 safe=Stay recover=18 | valley | fifthdrone | Low bowls with a thin bell of mirror standing high over them
The lake above the lake | - | source=Bowl opposite=Mirror form=.2 colour=.6 attack=1 release=2 tire=8 depth=1 seep=.9 after=.7 length=16 edge=.2 drift=.8 width=1 recover=12 | circle | widedrone | Bowls and their mirror from across the keyboard, changing places
Needle of frost | - | source=Bowl opposite=Mirror form=.7 colour=.2 attack=.5 release=.5 tire=1.5 depth=.5 length=12 rise=.3 edge=.95 seep=.3 safe=Stay width=.95 recover=10 after=0.86 | thinair | lowfifths | Wide dull bowls pricked by a sharp high mirror
Mountain that looks back | - | source=Bowl opposite=Mirror form=.3 colour=.3 attack=.8 release=5 tire=15 depth=.8 length=40 rise=1.7 edge=.5 after=1 drift=.6 safe=Stay volume=-7 recover=12 | nave | overlaps | Slow bowls whose mirror comes four seconds late, and for a long while
Bright water tower | - | source=Bowl opposite=Mirror form=.9 colour=.85 attack=.3 release=.4 tire=.8 depth=.9 seep=.2 length=9 edge=.6 air=.2 safe=Stay volume=0 recover=2.2 | tube | leaning | Shrill rims that tire early, a mirror across the keys holding on in the metal
Hive at evening | - | source=Reed opposite=Rough form=.3 colour=.2 attack=1 tire=5 depth=.6 seep=.55 length=14 edge=.25 drift=.6 air=.2 recover=20 | worngen | fifthdrone | Dark reeds, long held, with torn bands humming inside them
Two fields burning | - | source=Reed opposite=Rough form=.6 colour=.75 attack=4.5 release=9 tire=2 depth=.9 seep=.85 after=.6 length=22 edge=.9 drift=.9 width=1 volume=-6.5 recover=6 | clouds | widedrone | Full bright reeds that give way to wide hissing bands, flaring and sinking
Pylons in fog | - | source=Reed opposite=Rough form=.95 colour=.3 attack=.6 release=.8 tire=8 depth=.4 seep=.3 length=7 edge=.85 drift=.2 width=.5 recover=20 after=0.6 volume=-1.5 | notch | lowlong | A nasal low reed with a raw electric band on it
Where the river was | - | source=Bowl opposite=Rough form=.6 colour=.45 attack=1 release=1 tire=3 depth=.95 seep=.7 length=16 edge=.1 air=.7 drift=.7 recover=18 | hazy | fifthdrone | Bowls worn away to soft ragged bands like stones rolled over
Sleeping generator | - | opposite=Rough form=.1 colour=.15 attack=.8 tire=4 depth=.5 seep=.6 length=10 edge=.4 drift=.5 memory=Chord width=.6 volume=-10.5 recover=9 | warm | lowfifths | Hollow lamps, low, that tire together into a frayed hum
Lamp in the tower | - | opposite=Even form=.2 colour=.25 attack=1.5 release=2 tire=6 depth=.8 seep=.7 length=20 edge=.6 drift=.4 recover=15 after=0.4 | cathedral | fifthdrone | A dim lamp, held and held, turning by degrees into its own octave
Fluorescent chapel | - | opposite=Even form=.95 colour=.6 attack=.4 release=.5 tire=2 depth=.4 seep=.5 length=6 edge=.9 drift=0 air=.5 width=.4 | hiss | widedrone | An octave lamp with a hard bright octave and hiss on top of it | organ
Oil and water lamp | - | opposite=Even form=.4 colour=.4 attack=2.5 release=9 tire=3 depth=1 seep=1 after=.6 length=28 edge=.3 drift=1 width=1 recover=16 | hollowed | leaning | A lamp that goes out under the hand, its loose octaves floating over it
Street under snow | - | opposite=Even form=.05 colour=.5 attack=1 release=1.5 tire=10 depth=.6 seep=.25 length=12 rise=2 edge=.15 air=.3 recover=12 after=0.55 | faraway | fifthdrone | A hollow lamp, its round octave late behind it
Pilot flame | - | opposite=Even form=.6 colour=.05 attack=.6 release=.8 tire=1 depth=.95 seep=.8 after=.9 length=9 edge=.5 drift=.3 width=.15 | sines | onetone | A lamp so dark that before long only its small blue octave burns
Breathing stone | - | source=Bowl opposite=Breath form=.25 colour=.3 attack=1.2 tire=3 depth=.8 seep=.7 length=14 edge=.2 release=1 drift=.5 after=0.55 recover=18 volume=-1 | lungs | fifthdrone | Dark bowls with a low breath moving through them in waves
Sand ridge by night | - | source=Bowl opposite=Breath form=.75 colour=.55 attack=.8 release=2 tire=6 depth=.7 seep=.9 after=.9 length=24 edge=.75 drift=.8 width=1 volume=-12 recover=18 | breeze | widedrone | Bright bowls half covered by a wide hissing wind
Turbine hall run down | - | source=Reed opposite=Breath form=.2 colour=.15 attack=5 release=1.5 tire=4 depth=1 seep=.6 length=18 edge=.4 drift=.4 air=.6 recover=18 | openspace | lowfifths | Hollow reeds running down into a long dry breath
Asleep upstairs | - | opposite=Breath form=.8 colour=.1 attack=1 release=1 tire=2 depth=.4 seep=.5 length=10 edge=.02 air=.45 memory=Octave width=.5 recover=4 after=0.64 | darkhall | fifthdrone | A low dark lamp, and over it a slow breath that comes and goes
Salt wind in the wires | - | source=String opposite=Breath form=0 colour=.75 attack=.6 release=2 tire=2.5 depth=.5 seep=.8 after=.45 length=24 edge=.75 drift=.6 air=.3 recover=10 volume=1 | keyfilter | widedrone | Long wiry strings that stay, and a thin high wind threaded through them
Oo of the ravine | - | source=Vowel opposite=Below form=0 colour=.2 attack=1.5 tire=5 depth=.6 seep=.5 length=20 rise=1.5 edge=.3 drift=.4 recover=20 after=0.6 | cave | fifthdrone | A closed oo, very low and slow, with the octave below joining it
Vowel of the dam | - | source=Vowel opposite=Even form=.5 colour=.35 attack=1 release=2 tire=4 depth=.8 seep=.8 length=14 edge=.6 drift=.9 width=1 recover=15 | chorus 1.mix=.35 | widedrone | An open ah, held back like water, its octaves spilling loose over the top | voice
Chant left running | - | source=Vowel opposite=Mirror form=.3 colour=.45 attack=.4 release=.8 tire=8 depth=.5 seep=.4 length=16 edge=.5 air=.2 memory=Chord recover=20 | cathedral 1.mix=.2 | lowfifths | Round low voices that tire together, a thin mirror lit above them | voice
Ee through a wall | - | source=Vowel opposite=Sides form=.95 colour=.3 attack=1.2 release=1 tire=3 depth=.7 seep=.6 length=12 edge=.2 drift=.6 recover=20 after=0.86 | nextdoor | fifthdrone | A dulled ee whose trembling sides come round both ends of the wall
Overtone kitchen | - | source=Vowel opposite=Even form=.65 colour=.7 attack=.5 release=.6 tire=2 depth=.9 seep=.6 length=8 edge=.8 blink=.4 blinkRate=.5 air=.1 volume=-1.5 | whistle | onetone | A clear voice on eh, nodding under lids, sharp octaves whistling through
Humming gate | - | source=Bowl opposite=Sides form=.35 colour=.4 attack=.6 tire=3 depth=.6 seep=.5 length=12 edge=.4 drift=.4 release=.8 safe=Stay recover=15 | shiftdrift | fifthdrone | Bowls with their shaking sides swung out left and right
Cloister of glass | - | source=Bowl opposite=Sides form=.85 colour=.8 attack=0.8 release=2 tire=2 depth=.8 seep=.8 length=20 edge=.6 drift=.9 width=1 safe=Stay after=0.55 recover=12 volume=-2 | longplate | widedrone | Thin bright rims, walked round by their own trembling sides
Reed in a bell tower | - | source=Reed opposite=Sides form=.4 colour=.3 attack=.3 release=.4 tire=2 depth=.1 seep=.45 length=6 edge=.7 drift=.2 air=.3 after=.45 recover=2 | glue | fifthdrone | A plain hollow reed and two quavering threads out at its sides
Far shore engines | - | source=Reed opposite=Sides form=.8 colour=.15 attack=5 release=12 tire=6 depth=.9 seep=.6 length=24 edge=.1 after=.9 drift=.7 recover=20 | shore | lowfifths | Dark heavy reeds that empty slowly into shaking sides
Veil of the sun | - | opposite=Sides form=.5 colour=.5 attack=3.5 release=8 tire=4 depth=.95 seep=.95 length=30 edge=.5 drift=1 width=1 memory=Chord volume=-4.5 after=0.55 recover=12 | mist | leaning | Lamps that tire together and are replaced, while held, by trembling light | pad
Rim first | Bowl drone | opposite=Even attack=.1 release=.4 tire=1 depth=.9 form=.65 colour=.45 length=9 rise=.3 edge=.5 air=.3 seep=.1 volume=-1.5 recover=2.2 after=0.55 | sway | leaning | A quick warm rim that thins early and leaves one clear octave
Copper lullaby | Bowl drone | opposite=Even attack=1 form=.15 colour=.2 tire=5 depth=.5 seep=.5 length=16 rise=1 edge=.35 drift=.3 width=.5 air=.15 recover=12 | ootail | overlaps | Dark soft bowls with their octave rising slowly through them
Windless brass sky | Bowl drone | opposite=Even attack=1.2 form=1 colour=.9 tire=4 depth=1 seep=.9 after=.7 length=30 edge=.8 drift=.6 width=1 recover=9 | afterglow | widedrone | The brightest rims, slowly unlit, with sharp even tones in their place
Urn under rain | Bowl drone | opposite=Even attack=.6 form=.45 colour=.35 tire=2 depth=.7 seep=.35 length=8 rise=.2 edge=.2 release=.6 air=.6 after=0.6 | rain | fifthdrone | A grating bowl that leaves a round octave on every change
Planet in a dish | Bowl drone | opposite=Even attack=.9 form=.55 colour=.5 tire=12 depth=.08 seep=.6 length=40 rise=2.5 edge=.6 drift=1 release=6 recover=9 | lifted | overlaps | Bowls that hardly tire at all, and a drifting octave that takes six seconds to rise
Deep shelf | Slow eclipse | form=.1 colour=.2 attack=1.5 tire=4 depth=.8 length=20 edge=.3 air=.2 seep=.4 rise=2 recover=9 | under | lowfifths | A low hollow lamp, and a slow dark breath over it
Aurora with the sound on | Slow eclipse | source=Bowl opposite=Sides form=.6 colour=.6 attack=1 seep=.8 edge=.7 drift=1 tire=2 rise=1.5 length=26 volume=1 recover=10 after=0.64 | glacier | overlaps | Wide bowls dimming behind trembling bright sides | pad
Minute before snow | Slow eclipse | source=Reed opposite=Below form=.25 colour=.3 attack=5 tire=3 seep=.6 edge=.5 air=.4 depth=.8 release=2 rise=2 volume=-18 after=.5 recover=20 | tails | widedrone | Hollow reeds losing ground to the octave below, with much air
Dark side of a kettle | Slow eclipse | source=Bowl opposite=Mirror form=.4 colour=.35 attack=1 air=.5 tire=2 seep=.6 edge=.6 rise=1 length=14 release=1 after=0.48 | drum | widedrone | Bowls that hiss as they sound, a small high mirror like steam
Sun down a mine | Slow eclipse | opposite=Below form=.7 colour=.4 attack=1.2 tire=3 depth=1 seep=.85 edge=.2 rise=2.5 length=32 memory=Chord after=.6 recover=12 | stairwell | leaning | Octave lamps lowered together until only the pipe beneath is left
Nine chimneys | Torn curtain | form=.5 colour=.4 attack=1 tire=6 depth=.5 seep=.5 length=12 edge=.5 drift=.3 width=.6 after=.8 volume=-9.5 recover=9 | flutes | fifthdrone | Reeds like a row of pipes, with ragged smoke on every one | organ
Border station hum | Torn curtain | source=Lamp form=.75 colour=.25 attack=.8 tire=3 seep=.7 depth=.7 length=9 edge=.7 drift=0 width=.4 recover=15 | transistor | fifthdrone | An octave lamp crossed by a rough band that hardly moves
Storm lantern hung low | Torn curtain | source=Bowl form=.3 colour=.5 attack=.4 tire=1.5 seep=.6 depth=.8 length=14 edge=.35 drift=.9 release=.8 | swelltrem | lowlong | A low bowl swinging in and out of soft torn bands
Wire across the dam | Torn curtain | source=String form=0 colour=.4 attack=1 tire=2 seep=.75 depth=.8 length=18 edge=.15 release=3 air=.2 recover=12 | sustainring | widedrone | Long low wires with soft frayed bands rising along them | string
Shut engine room | Torn curtain | form=.1 colour=.1 attack=.3 tire=10 depth=.1 seep=.4 length=5 edge=.6 drift=.05 memory=Octave width=0 after=.5 recover=18 | muffled | lowfifths | Hollow low reeds and a raw band of noise, both behind steel
`,
    },
    {
      id: 'breath-after',
      name: 'Breath after',
      category: 'wind',
      rows: `
Exhaled glow | Breath after | form=.9 colour=.65 attack=.5 release=.6 tire=1 depth=.6 length=8 rise=.5 edge=.1 drift=.4 | plate | lookaway | A bright lamp for as long as it is held, then a long dark exhalation of breath | pad
Window opened at last | Breath after | form=.2 colour=.75 attack=.15 tire=.4 depth=.9 length=14 rise=.2 edge=.6 after=.5 width=1 recover=1.2 | brightair | fourparts | A bright lamp, dulled at once, and fresh wind all across the room | pad
Night air off warm stone | Breath after | form=.6 colour=.35 attack=1.5 release=2 tire=3 seep=.5 length=18 edge=.15 drift=.7 recover=15 after=0.86 volume=-11 | darkhall | leaning | A slow warm lamp with dark air moving under it, more as it tires | pad
Candles and the draught | Breath after | form=.75 colour=.5 attack=.06 tire=.25 depth=1 recover=8 length=5 rise=.1 edge=.3 memory=Chord volume=-6.5 after=.55 | parlour | again | Octave lamps, quick to light, that tire together into a gusting breath | keys
Muslin in and out | Breath after | form=.5 colour=.8 attack=.8 tire=.6 seep=.95 depth=.8 length=10 edge=.4 blink=.5 blinkRate=.4 after=.55 recover=2.2 | opening | overlaps | A bright lamp with a breath inside it that swells whenever the lids fall | pad
Reed in the hedge | - | source=Reed opposite=Breath form=.1 colour=.5 attack=.06 release=.2 air=.4 tire=.8 depth=.5 length=3 rise=.2 edge=.6 drift=.2 | room | sinking | A hollow piping reed with a short gust of wind at the end of each note
Oboe player's window | - | source=Reed opposite=Breath form=.75 colour=.4 attack=.12 release=.3 air=.2 tire=1.5 depth=.4 length=6 rise=.5 edge=.3 seep=.1 width=.4 volume=-1.5 recover=3.4 | vibrato | sung | A nasal singing reed, and the breath let go behind it
Cold hands on a pipe | - | source=Reed opposite=Breath form=.25 colour=.2 attack=.2 release=.5 air=.7 tire=2 depth=.6 length=10 rise=.8 edge=.2 seep=.3 volume=-1 after=0.64 | stairwell | lowsteps | A low breathy reed losing warmth, with a dark sigh on the stairs
Mouth organ at the halt | - | source=Reed opposite=Breath form=.55 colour=.7 attack=.04 release=.25 air=.5 tire=.5 depth=.8 length=4 rise=.1 edge=.7 blink=.35 blinkRate=4.5 recover=1.8 | smallbody | hands | Full bright reeds fluttered under a hand's lids, wind between chords
Shepherd out of breath | - | source=Reed opposite=Breath form=.9 colour=.3 attack=.3 release=.8 air=.9 tire=1 depth=.9 length=12 edge=.5 after=.9 drift=.6 recover=2.4 | hollowbox | twovoices | A dull nasal reed half choked with air, and wind where it fails
Flute without a floor | - | opposite=Sides form=.05 colour=.4 air=.7 attack=.1 release=.3 tire=1 depth=.5 length=5 edge=.6 rise=.3 width=1 recover=11 | halo | thread | A hollow lamp with much breath on it, like a pipe; shivering sides after
Bottle on a ledge | - | opposite=Breath form=0 colour=.2 air=.9 attack=.08 release=.2 tire=.4 depth=.7 length=3 rise=.06 edge=.2 after=.9 recover=8 | jar | drops | A hollow dark lamp, blown more than sung, and one dull breath after
Birdless morning | - | opposite=Mirror form=.15 colour=.55 air=.55 attack=.2 release=.5 tire=.6 depth=.8 length=12 rise=.8 edge=.3 safe=Stay | valley | calls | A breathy hollow lamp whose mirror answers from the other end
Whistle on a tin roof | - | opposite=Even form=.3 colour=.8 air=.45 attack=.03 release=.15 tire=.3 depth=.6 length=2.5 rise=.05 edge=.8 seep=.2 drift=.15 volume=-1.5 recover=11 | rain | thread | A clear bright lamp, tongued like a whistle, with a sharp octave chirp after
Panpipe at siesta | - | opposite=Breath form=.1 colour=.35 air=1 attack=.15 release=.4 tire=1.2 depth=.5 length=8 edge=.4 drift=.5 width=.8 | shallows | sinking | A hollow lamp all but hidden in its own air, then that breath by itself
Strings to straw | Breath after | source=String form=.1 colour=.6 attack=.1 air=.3 tire=.6 depth=.8 length=9 rise=.5 edge=.5 after=.9 release=.4 recover=2.2 | ensemble | fourparts | Long wiry strings that thin as they ring and end in a dry wind | string
Grass on the fretboard | Breath after | source=String form=.5 colour=.35 air=.8 tire=.3 depth=.9 length=5 rise=.1 edge=.4 seep=.4 after=.5 recover=0.5 | combo | hands | Plucked strings with a lot of finger, going to windy grass at once | plucked
Aeolian afternoon | Breath after | source=String form=0 colour=.85 attack=.5 release=3 tire=1.5 depth=1 seep=.9 length=24 edge=.4 drift=1 safe=Stay | shore | overlaps | Wires that swell and vanish inside the wind that plays them | string
Hemp and canvas | Breath after | source=String form=.8 colour=.15 air=.5 tire=.8 depth=.5 length=12 rise=1 edge=.1 after=.9 width=.4 recover=8 | worn | hands | Short dark strings, and sailcloth breath filling slowly behind | plucked
Fiddles from outside | Breath after | source=String form=.25 colour=.5 attack=.3 air=.1 release=1.5 tire=2 depth=.6 length=16 edge=.85 rise=.8 blink=.3 blinkRate=6 recover=6 after=0.55 | nextdoor | leaning | Eased strings in a small flutter of lids, the street's bright wind after | string
Chimes lose their tongue | Breath after | source=Struck form=.6 colour=.7 air=.2 tire=.3 depth=.4 length=5 rise=.3 edge=0 release=2 volume=3.5 drift=0 after=.5 recover=1.2 | stars | highpeal | Bright small bells, each turned to one low dark breath as it fades | bell
Wooden flute case | Breath after | source=Struck form=.05 colour=.5 air=.8 tire=.15 length=3 rise=.04 edge=.3 after=1 release=.2 volume=-2 recover=10 | boards | turning | A knock on wood and the breath that was inside it | plucked
Glass blower's bench | Breath after | source=Struck form=.95 colour=.45 attack=.2 air=.1 tire=.6 depth=.6 length=12 rise=.8 edge=.5 seep=.3 after=.55 recover=1.2 | tube | pairs | Softened glass, then the blower's breath drawn slowly through | bell
Bell rope let slip | Breath after | source=Struck form=.48 colour=.25 attack=.1 air=.4 release=2.5 tire=1.5 length=20 rise=1.6 edge=.2 drift=.6 | cathedral | lowsteps | A round low bell, and long after the stroke a dark breath down the tower | bell
Leaves among the keys | Breath after | source=Struck form=.2 colour=.8 air=.7 tire=1.5 depth=.35 length=11 rise=.5 edge=.55 seep=.1 width=.5 release=.5 recover=8 after=0.86 | dust | hands | Brittle bars left to ring, and a rustle of wind once the hand is gone | keys
Priest with no voice | Breath after | source=Vowel form=.35 colour=.5 attack=.3 air=.5 tire=.6 depth=1 length=7 rise=.3 edge=.4 after=.9 recover=10 memory=Octave | chapel | samekey | An oh that has less voice at each return and more breath | voice
Breath between hymns | Breath after | source=Vowel form=.6 colour=.6 attack=.6 air=.15 tire=2 depth=.4 length=5 rise=.5 edge=.5 release=.5 seep=0 | nave 1.mix=.2 | fourparts | Clear open ahs with one shared breath when they stop | voice
Nurse by the ward fan | Breath after | source=Vowel form=.02 colour=.2 attack=.4 air=.3 tire=1.5 seep=.8 length=10 edge=.3 drift=.2 width=.4 | hiss | sung | A low oo with a breath of air turning slowly under it | voice
Ghost of an alto | Breath after | source=Vowel form=.75 colour=.35 attack=1.2 air=.5 tire=.8 depth=.95 length=16 edge=.25 rise=1.2 drift=.8 width=1 volume=-0.5 recover=8 after=0.6 | ghostrev | overlaps | An eh mostly made of air, and a wide breath where she was | voice
Names said to the wind | Breath after | source=Vowel form=.94 colour=.5 attack=.05 air=.25 tire=.2 depth=.8 length=3 rise=.05 edge=.3 release=.15 volume=0 after=.45 recover=1.2 | slap | calls | Short voices nearly on ee, each whipped off by wind | voice
Shawm on the rampart | - | source=Reed opposite=Below form=.85 colour=.55 attack=.05 release=.2 air=.25 tire=.6 depth=.7 length=3 rise=.08 edge=.6 after=.6 volume=-1.5 | valley 1.mix=.2 | calls | A loud nasal reed, with a buzzing pipe under the end of every call
Cracked drone pipe | - | source=Reed opposite=Rough form=.4 colour=.45 attack=.2 release=.5 seep=.6 tire=2 depth=.6 length=8 edge=.75 drift=.4 air=.3 volume=-12 | glue | lowfifths | Low reeds with a ragged split edge in them all along | drone
Foghorn gone hoarse | - | source=Reed opposite=Rough form=.2 colour=.15 attack=.4 release=1 tire=3 depth=.8 length=12 rise=.8 edge=.1 after=.9 air=.5 recover=20 | shore 1.distance=.6 | lowlong | A hollow low reed and its soft ragged rumble rolling off | bass
Kazoo procession | - | source=Reed opposite=Rough form=1 colour=.5 attack=.02 release=.15 tire=.25 depth=.9 seep=.8 length=2.5 edge=.6 width=.8 recover=10 | kitchen | turning | Comical thin reeds that buzz away into rough paper bands | keys
Grass held in two thumbs | - | source=Reed opposite=Rough form=.35 colour=.45 attack=.04 release=.2 air=.3 tire=.4 depth=.8 length=5 edge=.3 drift=.8 blink=.4 blinkRate=10 after=.55 recover=11 volume=-1.5 | brightened | thread | A shrill reed fluttering under lids between two ragged edges
All windows, one gust | Remembered texture | source=Lamp opposite=Breath form=.2 colour=.75 attack=.6 tire=.8 recover=14 depth=.8 length=12 rise=.4 edge=.1 seep=.4 after=.5 | smear | again | Lamps that tire together: the whole chord comes back as more wind than light | pad
Sails at the mooring | Remembered texture | source=Reed opposite=Breath form=.35 colour=.4 attack=1 tire=2 recover=8 depth=.7 length=10 edge=.3 air=.4 release=1 | waters | fourparts | Reeds that remember the whole chord and sag into flapping breath | pad
Last bowl by the door | Remembered texture | opposite=Breath form=.45 colour=.5 attack=.4 release=.3 tire=1.5 recover=6 depth=.8 length=14 edge=.5 seep=.3 air=.3 after=.6 | breeze | leaning | Bowls that tire together while a night wind comes in past them | pad
Shelf of seashells | Remembered texture | source=Struck opposite=Breath form=.95 colour=.65 tire=1 recover=14 depth=.6 length=16 rise=.6 edge=.6 memory=Octave width=1 after=.5 seep=.2 volume=1 | shallows | pairs | Thin glass that tires in every octave, with the same bright sea breath in all of them | bell
Everyone sighs at once | Remembered texture | source=Vowel opposite=Breath form=.25 colour=.6 attack=.2 release=.2 tire=.3 recover=5 depth=1 length=5 rise=.1 edge=.2 seep=.1 drift=.3 | doubled | again | Voices that tire together, and one big dark sigh of breath after each chord | voice
Felt over a warm breath | Breath after | source=Struck form=.3 colour=.2 attack=.15 air=.4 tire=.4 length=4 rise=.25 edge=.1 after=.8 release=.4 drift=0 width=.3 recover=1.6 | felted | hands | Soft struck bars, each let out on a warm low breath | keys
Typist in the attic | Breath after | source=String form=.95 colour=.5 air=.6 tire=.12 depth=.9 length=1.5 rise=.04 edge=.5 release=.15 volume=1.5 after=.55 recover=1.2 | thinned | calls | Tight damped strings with a puff of air after every key | keys
A breath in the rests | Breath after | form=.8 colour=.55 attack=.02 release=.15 tire=.5 depth=.6 length=2.5 rise=.06 edge=.35 after=.75 air=.3 volume=-10 | chamber | twovoices | An octave lamp, crisp as keys, and a breath in every rest | keys
Pneumatic tube office | Breath after | source=Lamp form=.4 colour=.6 attack=.01 release=.15 tire=.15 depth=1 length=3 rise=.04 edge=.5 seep=.7 blink=.6 blinkRate=3 after=.5 recover=1.6 volume=-1.5 | tube | turning | A bright clipped lamp under lids, sucked each time into a hiss of air | keys
Unheated organ loft | Breath after | source=Reed form=.3 colour=.5 attack=.03 release=.2 tire=6 depth=.05 length=3 rise=.15 edge=.35 air=.6 seep=.2 after=.5 recover=.6 | cathedral 1.mix=.18 | fourparts | Hollow reeds that hardly tire, with the bellows' breath around them | organ
Nothing but weather | Slow eclipse | form=.5 colour=.4 attack=.7 tire=.8 seep=1 depth=1 after=.85 length=24 edge=.3 drift=.9 width=1 rise=.5 volume=-14 recover=2.2 | clouds | onetone | A lamp seen for a second, and then only the wind that took it | texture
Air from the crypt | Slow eclipse | source=Bowl form=.15 colour=.2 attack=.8 tire=1.5 seep=.8 after=.95 length=20 edge=0 rise=1.5 air=.1 | cave | lowfifths | A dark bowl swallowed by the lowest, blackest breath | drone
Steam and porcelain | Slow eclipse | source=Bowl form=.9 colour=.8 attack=.3 release=.4 tire=.6 seep=.5 length=8 edge=.55 rise=.3 drift=.3 after=.5 recover=2.2 | evaporate | leaning | A bright thin rim that goes up in a hiss of breath | texture
Sleet on the line | Slow eclipse | source=String form=.8 colour=.4 attack=.02 tire=.8 seep=.7 length=6 edge=.3 air=.3 rise=.2 release=.5 after=.5 recover=1.2 volume=-1 depth=.75 | stones | drops | Short plucked wires, half lost in a cold wind soon after they speak | plucked
Tall grass overexposed | Slow eclipse | form=.3 colour=.6 attack=3 release=9 tire=4 seep=.5 length=40 edge=.45 drift=1 air=.4 rise=3 recover=9 | slowcloud | overlaps | A lamp that takes three seconds to bloom, blurred by breath that stays and stays | pad
`,
    },
    {
      id: 'keys-that-leave',
      name: 'Keys that leave',
      category: 'keys',
      rows: `
Coat still on the chair | Keys that leave | form=.12 colour=.7 tire=1.5 rise=.9 length=16 edge=.15 air=.05 release=.8 opposite=Even attack=.03 after=.6 recover=3.4 | parlour | hands | Long clear strings and, once the hand lifts, a round octave that stays like warmth
Warm seat by the window | Keys that leave | form=.6 colour=.25 attack=.06 tire=.8 rise=1.2 length=12 edge=.15 after=.9 drift=.5 recover=2.4 | darkecho | climb | Soft round strings; a second after each one the pipe under it arrives
Plaster and wire | Keys that leave | form=.05 colour=.8 air=.5 tire=.5 depth=.8 rise=.1 length=4 edge=.7 release=.2 width=.8 volume=-2.5 recover=1.2 after=0.64 | thinned | twovoices | Bright wiry strings, cut short, over a buzzing octave below
Grandmother's upright | Keys that leave | form=.2 colour=.35 air=.4 tire=1.5 depth=.08 seep=.3 length=3 edge=.5 drift=.6 release=.6 after=.4 recover=1.5 | worn | hands | Long strings a little adrift, with their lower octave faintly in them
Below the lid | Keys that leave | form=.75 colour=.6 tire=.2 depth=.95 rise=.06 length=16 seep=.6 edge=.4 after=.8 memory=Chord recover=1.6 | cave | again | Short strings that tire together and leave the floor humming beneath
Lamp under the fingers | Opposite light | form=.35 colour=.45 attack=.02 release=.3 tire=.6 depth=.5 length=5 rise=.15 edge=.4 width=.5 recover=1.8 | amptrem | hands | A lamp played by touch, round and quick, and its mirror after it
Hotel lobby before dawn | Opposite light | form=.2 colour=.3 attack=.03 release=.8 tire=1.5 length=9 rise=.5 edge=.2 drift=.5 air=.1 volume=-11 recover=3.4 after=0.6 | rotor | climb | A hollow lamp under soft fingers, with a slow warm mirror behind
Counter without a clerk | Opposite light | form=.9 colour=.8 attack=.01 release=.15 tire=.2 depth=.9 length=8 rise=.04 edge=.8 seep=0 safe=Stay recover=10 after=0.48 volume=0 | room | calls | A snap of bright lamp and a glint of mirror left on the counter
Light in the piano shop | Opposite light | form=.5 colour=.6 attack=.015 release=.5 tire=.3 depth=.7 seep=.6 length=12 edge=.3 width=.9 after=.8 recover=1.2 | chorus 1.mix=.35 | hands | A bright lamp at a touch, that melts straight into its mirror under the finger
Drawer of old keys | Opposite light | form=.65 colour=.15 attack=.05 release=.2 tire=.5 depth=.4 length=4 rise=.08 edge=.6 recover=1 air=.35 after=.85 | cassette | drops | A dim lamp, short and plain, its small bright mirror rattling after
Far hills under felt | Struck after-bells | form=.25 colour=.15 attack=.1 air=.3 tire=.4 length=14 rise=.6 edge=.3 release=.6 depth=.5 recover=1.6 | valley | hands | Soft struck bars and, across the keyboard, a slow distant mirror
Toy on the stairs | Struck after-bells | form=.7 colour=.6 air=.2 tire=.2 depth=.9 opposite=Even length=2 rise=.04 edge=.6 release=.2 width=.3 recover=0.8 after=0.48 volume=0 | bedside | climb | Small glassy bells, tight and near, each with a quick octave chirp
Keys of ivory soap | Struck after-bells | form=.35 colour=.4 opposite=Below tire=.5 length=7 rise=.2 edge=.2 after=.8 release=.4 air=.1 drift=.1 | halo | climb | Smooth struck bars, half bell, over a clean hollow octave below
Marimba behind glass | Wooden shadow | opposite=Mirror form=.02 colour=.5 tire=.3 depth=.6 length=10 rise=.3 edge=.5 seep=.4 air=.3 width=.8 volume=0 recover=1.6 | glimmer | turning | Wooden bars, and a mirror of bells that shimmers on the other pane
Cups put away | Wooden shadow | opposite=Sides form=.3 colour=.7 tire=.15 length=4 rise=.1 edge=.7 air=.5 after=.8 drift=.4 width=1 volume=-1.5 recover=7 | booth | hands | Bright struck bars with a shiver of crockery out to the sides
The empty piano chair | Keys that leave | opposite=Sides form=.2 colour=.5 tire=1 depth=.12 length=4 rise=.2 edge=.25 width=1 drift=.3 after=.4 recover=2.4 | sidelit | twovoices | Plucked strings that keep their ring in the middle, faint trembling sides where hands were
Dust cover lifted | Keys that leave | opposite=Sides form=.5 colour=.2 attack=.2 tire=.4 depth=.9 seep=.7 length=12 edge=.2 drift=.8 release=1 recover=10 | oldrecord | hands | Dull strings emptying into shaking sides, as if still under a sheet
Prism over the keys | Keys that leave | opposite=Sides form=0 colour=.75 air=.05 tire=.3 depth=.7 length=9 rise=.5 edge=.25 after=.6 width=1 release=.8 recover=14 volume=-1 | prism | climb | Bright wires whose thin shaking sides spread like colours off a prism
Nervous accompanist | Keys that leave | opposite=Sides form=.85 colour=.4 tire=.15 depth=.8 length=2 rise=.04 edge=.3 seep=.3 blink=.4 blinkRate=7 air=.35 volume=3 after=.5 recover=0.8 | chamber | sinking | Short damped strings in a flutter of lids, quaking a little at both sides
Both banks of the river | Keys that leave | opposite=Sides form=.15 colour=.4 attack=.04 tire=2.5 rise=1.5 length=24 edge=.3 drift=.6 after=1 release=1.5 safe=Stay recover=15 | longplate | climb | Long strings, then much later their trembling sides, one on each bank
Station harmonium | Tiring bass | opposite=Below form=.55 colour=.35 tire=2 depth=.12 length=5 rise=.3 edge=.5 seep=.2 air=.3 release=.3 width=.6 volume=-6 after=.4 recover=1 | combo | hands | Full reeds under the fingers, and a pipe an octave below when they rise | organ
Squeeze, hold, let go | Tiring bass | opposite=Breath form=.4 colour=.6 tire=.5 depth=.7 length=4 rise=.15 edge=.6 after=.9 air=.4 release=.2 width=.5 | parlour | fourparts | Breathy reeds that fade as they are squeezed and let go in a puff of wind | organ
Reed keys in mourning | Tiring bass | opposite=Even form=.2 colour=.15 attack=.06 tire=1 depth=.6 length=12 rise=.8 edge=.3 drift=.3 release=.5 width=.7 volume=-8 | darkhall | again | Dark hollow reeds, played slowly, whose octave only comes afterwards | organ
Carousel in winter | Tiring bass | opposite=Sides form=.8 colour=.6 tire=.4 depth=.6 length=6 edge=.45 seep=.4 drift=.6 width=1 air=.05 volume=1.5 attack=.06 | fastrotor | turning | Bright reed keys with trembling sides, turning though nobody rides | organ
Half a squeezebox | Tiring bass | opposite=Mirror form=.65 colour=.35 tire=.3 depth=.9 recover=6 length=7 rise=.2 edge=.4 memory=Chord air=.5 width=.6 | pillow | again | Reeds that tire as a whole chord and come back with more mirror than breath
Tine and tide | Struck after-bells | opposite=Below form=.52 colour=.2 attack=.02 air=.15 tire=.8 depth=.4 length=8 rise=.4 edge=.4 release=.4 drift=.2 safe=Stay recover=2 after=0.64 | harmtrem | hands | Soft low-lit bells under the hand, and a hollow octave below in the gaps
Glass keys by the stove | Struck after-bells | opposite=Breath form=.85 colour=.35 tire=.4 depth=.6 length=5 rise=.2 edge=.1 air=.1 release=.3 after=.8 recover=10 | glue | climb | Rounded glass, each stroke followed by a small dark breath
Aquarium piano | Struck after-bells | opposite=Even form=.45 colour=.3 attack=.08 tire=1.2 depth=.5 length=10 rise=.4 edge=.5 release=.8 drift=.7 recover=2.8 | under | hands | Bell-like keys, softened, with slow octaves rising off them like air
Busy switchboard | Struck after-bells | opposite=Rough form=.6 colour=.75 tire=.15 depth=.9 length=2 rise=.04 edge=.5 release=.15 seep=.3 air=.3 width=.6 | glaze | pairs | Clipped bright bells with a torn crackle on every line
Dusty glass keys | Struck after-bells | form=.9 colour=.5 air=.2 tire=.5 length=9 rise=.3 edge=.2 after=.7 release=.6 depth=.4 width=.5 recover=1.2 | reel | pairs | Light struck glass and a soft mirror of it across the keys, on the attic boards
Mended music | - | opposite=Rough form=.45 colour=.5 attack=.015 release=.2 tire=.5 depth=.6 length=3 rise=.06 edge=.35 air=.2 after=.8 recover=1.2 | cassette | hands | A quick full lamp and a torn strip of sound after every chord
Static on the sleeves | - | opposite=Rough form=.15 colour=.75 attack=.01 release=.15 tire=.2 depth=.8 seep=.7 length=5 edge=.95 drift=.4 width=1 recover=14 | doubled | calls | A hollow bright lamp, crackling into rough bands under the finger
Toaster orange | - | opposite=Rough form=.8 colour=.3 attack=.1 release=.5 tire=1.5 length=9 rise=.5 edge=.15 drift=.6 memory=Octave recover=8 after=0.6 | valve | climb | Warm octave lamps with a soft ragged glow left in the wires
Fax from the sea | - | opposite=Rough form=.6 colour=.9 attack=.01 release=.15 tire=.1 depth=1 length=1.5 rise=.04 edge=.7 blink=.5 blinkRate=9 recover=11 after=0.48 volume=-0.5 | kitchen | - | A chattering bright lamp, all lids, with brief rough bands between
Burnt edge of a letter | - | opposite=Rough form=0 colour=.4 attack=.04 release=.8 tire=.8 depth=.5 length=14 rise=1 edge=.25 after=.9 drift=.9 volume=-10 recover=2.4 | late | hands | A hollow lamp touched gently, and a frayed edge that curls up after
Third time of asking | Keys that leave | memory=Note opposite=Mirror form=.4 colour=.55 tire=.25 depth=1 recover=12 length=6 edge=.5 seep=.3 air=.1 volume=0 | narrow | samekey | A string key that grows pale when asked again, its mirror answering instead
Family at table | Keys that leave | memory=Chord opposite=Even form=.3 colour=.4 tire=.6 depth=.8 recover=8 length=5 rise=.2 edge=.4 seep=.2 after=0.5 volume=-1 | faintup | again | Strings that tire together; at each helping more octave and less string
The same stair again | Keys that leave | source=Lamp memory=Octave opposite=Below attack=.02 form=.5 colour=.5 tire=.3 depth=.9 recover=10 length=8 seep=.3 volume=-1.5 | stairwell | calls | A quick lamp that tires in all octaves and steps down to the one below
Ninth hour of rehearsal | Keys that leave | source=Reed memory=Chord opposite=Rough attack=.03 form=.5 colour=.5 tire=.5 depth=1 recover=20 length=4 edge=.2 release=.2 after=0.9 volume=-10.5 | nextdoor | again | Reed keys worn out by the whole chord until only frayed bands come | organ
Forgetful landlady | Keys that leave | source=Struck memory=Octave opposite=Breath form=.4 colour=.5 tire=.3 depth=.9 recover=5 length=3 edge=.3 rise=.1 seep=.2 air=.3 volume=4 after=.5 | felted | samekey | Struck bars losing the thread in every octave, sighing a little breath
Piano on the floor above | Keys that leave | opposite=Mirror form=.15 colour=.5 tire=1 rise=.3 length=10 edge=.4 after=.8 release=.5 safe=Stay recover=11 | nextdoor 1.distance=.5 | hands | Long strings, and their mirror played back from the far side of the house
Chalk and slate keys | Keys that leave | opposite=Breath form=.65 colour=.5 air=.9 tire=.4 length=2 rise=.05 edge=.6 release=.15 depth=.6 width=.3 recover=7 after=0.86 | mono | turning | Dry damped strings, all finger noise and a dusty breath
Parcel of harp keys | Keys that leave | opposite=Even form=.45 colour=.75 attack=.02 tire=.5 depth=.6 length=18 rise=.8 edge=.75 drift=.7 release=2 after=.95 recover=1.2 | drifter | climb | Clear ringing strings that turn over into high even octaves
Amplifier left warm | Keys that leave | opposite=Rough form=.25 colour=.3 air=.2 tire=2 depth=.4 length=5 rise=.2 edge=.1 release=.4 seep=.2 | combo | hands | Plain long strings with a soft torn hum behind, as of a loose speaker
Moonrise at the keys | Keys that leave | opposite=Mirror source=Lamp form=.25 colour=.35 attack=.05 release=1.5 tire=1 length=26 rise=1.6 edge=.4 drift=.6 after=1 air=.1 safe=Stay width=.9 recover=2.4 | openspace | pairs | Hollow lamp keys, and slowly, from the far side of them, a wide mirror
Bowls by the yard | - | source=Bowl opposite=Even form=.4 colour=.5 attack=.01 release=.15 tire=.5 depth=.8 length=5 rise=.2 edge=.4 air=.3 width=.6 recover=2.4 after=0.55 | chamber | climb | Rubbed bowls spoken quickly, like keys, with an octave after each
Cut-glass carillon keys | - | source=Bowl opposite=Mirror form=.9 colour=.75 attack=.01 release=.2 tire=.3 depth=.9 length=8 rise=.1 edge=.6 air=.1 width=1 recover=6 | brightair | twovoices | Bright rims, touched rather than rubbed, and their mirror across the keyboard
Muttered over the keys | - | source=Vowel opposite=Breath form=.4 colour=.5 attack=.01 release=.15 air=.5 tire=.3 depth=.8 length=2.5 rise=.06 edge=.3 after=.55 | eased | twovoices | A whispered oh at each key and a short breath as it lifts
Clipped choirboys | - | source=Vowel opposite=Below form=.6 colour=.8 attack=.01 release=.15 air=.1 tire=.2 depth=.9 length=4 rise=.1 edge=.5 seep=.3 blink=.3 blinkRate=5 volume=1 recover=14 | slap | hands | Clipped voices on eh with busy lids, over a little pipe below | voice
Both hands full of oh | - | source=Vowel opposite=Even form=.22 colour=.3 attack=.04 release=.3 tire=1.2 depth=.5 length=7 rise=.3 edge=.7 drift=.3 width=.8 recover=2.4 after=0.55 | plate | hands | Round voices on oh, rolled like chords, a pure octave after each | voice
`,
    },
    {
      id: 'remembered-texture',
      name: 'Remembered texture',
      category: 'texture',
      rows: `
Palimpsest | Remembered texture | form=.6 colour=.5 attack=.8 tire=1.5 depth=.9 recover=14 length=14 edge=.35 seep=.55 release=1 | mist | again | Bowls that remember the whole chord; torn bands of it show through the next
Wallpaper under paint | Remembered texture | form=.3 colour=.25 attack=1 tire=4 seep=.8 length=24 edge=.05 drift=.5 width=.7 after=.9 | hazy | leaning | Dark slow bowls worn through together to soft rough bands
Scraped copper sheet | Remembered texture | form=.95 colour=.8 attack=.3 tire=.5 depth=1 recover=8 length=7 rise=.2 edge=.8 air=.6 release=.3 | ringhalo | overlaps | Bright rims that tire together, scraped down to hissing rough bands
Beach after the crowd | Remembered texture | form=.45 colour=.4 attack=.6 seep=.4 length=18 edge=.2 air=.8 drift=.9 memory=Octave rise=2 | shore | overlaps | Bowls with sand on the rim, and long ragged bands when all have gone
Refolded map | Remembered texture | form=.8 colour=.2 attack=.5 tire=.8 depth=.7 length=9 edge=.5 drift=.2 width=.4 recover=5 seep=.3 | record | again | Dull bowls that turn as they sound, with rough bands along the folds
Haunted seating plan | Remembered texture | source=Lamp opposite=Sides form=.75 colour=.45 attack=.3 tire=.5 depth=.55 recover=5 length=10 rise=.3 edge=.3 seep=.4 release=.5 after=.5 volume=-1.5 | phasing | again | Lamps that tire together, trembling sides left in every seat
Halo of a streetlamp | Remembered texture | source=Lamp opposite=Sides form=.2 colour=.2 attack=1.8 tire=2 seep=.9 length=18 edge=.25 drift=1 width=1 release=3 safe=Stay after=0.4 volume=2.5 | fog | overlaps | A dim lamp lost in its own wide trembling sides | pad
Snow on every channel | Remembered texture | source=Lamp opposite=Sides form=.95 colour=.6 attack=.1 tire=.3 depth=1 seep=.7 length=6 edge=.25 blink=.5 blinkRate=8 release=.3 volume=1 after=.55 | watery | onetone | An octave lamp under flickering lids, gone to a snow of shaking sides
Two suns, one set | Remembered texture | source=Lamp opposite=Sides form=.35 colour=.6 attack=.6 tire=6 depth=.6 recover=3 length=30 rise=2.5 edge=.15 seep=.2 after=0.68 safe=Stay | valley | leaning | Clear lamps that tire slowly together, then soft shaking sides half a minute long | pad
Reading by lightning | Remembered texture | source=Lamp opposite=Sides form=.75 colour=.65 attack=.02 tire=.15 depth=.9 recover=4 length=3 rise=.04 edge=.2 seep=.1 release=.15 drift=.3 volume=0 after=.5 | gated | calls | Flashes of bright lamp and, for an instant, shaking sides to all of it | keys
The memory room | Remembered texture | source=String opposite=Mirror form=.2 colour=.5 attack=.02 tire=.6 recover=10 depth=.9 length=12 rise=.3 edge=.5 seep=.4 release=.8 air=.2 after=0.5 volume=-0.5 | common | climb | Strings that tire together while their mirror gathers across the keys | plucked
Back of the needlework | Remembered texture | source=String opposite=Mirror form=.65 colour=.6 attack=.02 tire=.2 depth=.8 length=5 rise=.06 edge=.45 drift=.3 release=.2 memory=Octave safe=Stay volume=0 after=.6 | stars | turning | Short bright strings with a stitch of mirror on the other face of each | plucked
Zither in a drained pool | Remembered texture | source=String opposite=Mirror form=0 colour=.35 attack=.2 tire=2 seep=.75 length=20 edge=.2 drift=.7 release=3 width=1 safe=Stay after=0.96 volume=-11.5 | swarm | hands | Long wires that give way together to a wide slow mirror | string
One thread of a cobweb | Remembered texture | source=String opposite=Mirror form=.4 colour=.9 attack=.8 tire=.4 recover=20 depth=1 length=16 edge=.9 air=.05 drift=.5 seep=.2 volume=6 after=0.4 | glimmer | thread | Bright strings without an onset, a glinting mirror when the thread is let go | string
Orchard wires at frost | Remembered texture | source=String opposite=Mirror form=.1 colour=.2 attack=.05 tire=1 recover=6 depth=.7 length=28 rise=1.5 edge=.6 air=.6 seep=.1 release=.5 after=0.86 | faraway | drops | Dull plucked wires, and a long frosted mirror settling over all of them | plucked
Rain on every surface | Remembered texture | source=Struck opposite=Even form=.7 colour=.6 attack=.02 tire=.2 depth=.8 length=4 rise=.05 edge=.6 seep=.5 drift=.4 air=.5 release=.2 after=0.6 volume=0 | stones | turning | Small glassy strokes that tire together, a plink of octave from each | plucked
Broken clock museum | Remembered texture | source=Struck opposite=Rough form=.4 colour=.7 attack=.01 tire=.3 depth=.9 recover=9 length=6 edge=.3 blink=.6 blinkRate=2 air=.4 | backwards | calls | Struck bars under ticking lids, with torn bands running the wrong way | plucked
Attic of small bells | Remembered texture | source=Struck opposite=Below form=.85 colour=.4 attack=.1 tire=.8 recover=15 length=18 rise=1 edge=.2 seep=.3 release=1 width=1 after=0.55 | cloud | pairs | Dim glass bells that remember the whole chord over the hollow octave below | bell
Pebbles poured out | Remembered texture | source=Struck opposite=Breath form=.1 colour=.8 attack=.01 tire=.1 depth=1 length=3 rise=.04 edge=.5 seep=.8 air=.5 memory=Octave release=.15 volume=0.5 after=.6 | highfirst | turning | Dry wooden ticks in a rush of breath | plucked
Sleigh tracks in slush | Remembered texture | source=Struck opposite=Sides form=.75 colour=.3 attack=.4 tire=.6 recover=20 depth=.95 length=14 edge=.05 drift=.9 seep=.2 release=2 volume=0 after=.45 | melt | pairs | Softened bells tiring together into loose shaking sides | bell
Accordion left in rain | Remembered texture | source=Reed opposite=Even form=.5 colour=.4 attack=.3 tire=.6 depth=.95 recover=10 length=8 rise=.3 edge=.4 seep=.4 drift=.8 release=.4 | warped | again | Reeds that the whole chord wears out, their octaves swollen and drifting | keys
Census of crickets | Remembered texture | source=Reed opposite=Sides form=1 colour=.6 attack=.1 tire=1 depth=.6 seep=.9 length=10 edge=.6 drift=.8 blink=.4 blinkRate=11 width=1 volume=0.5 after=0.5 | sidelit | onetone | Thin reeds under buzzing lids, with trembling sides like insects
Barn doors in a storm | Remembered texture | source=Reed opposite=Rough form=.15 colour=.1 attack=4 tire=2 seep=.7 length=20 edge=.05 drift=1 air=.4 release=9 volume=-12 after=.6 | clouds | lowfifths | Hollow dark reeds and slow ragged bands, banging softly a long way off | drone
Four mouth harps asleep | Remembered texture | source=Reed opposite=Below form=.7 colour=.5 attack=.6 tire=3 depth=.8 recover=4 seep=.5 length=12 edge=.7 air=.5 release=1 | hollowed | fourparts | Full reeds, tiring together, sunk into buzzing pipes beneath | pad
Flypaper | Remembered texture | source=Reed opposite=Mirror form=.85 colour=.6 attack=.04 tire=.15 depth=.9 recover=18 length=14 seep=.6 edge=.15 safe=Stay drift=.6 release=.2 volume=-2 after=.95 | worngen | drops | Thin reeds that stick in a mirror which will not move with the chord | texture
Sailcloth in a gale | Remembered texture | source=String opposite=Rough form=.15 colour=.6 attack=1.2 tire=2 depth=1 recover=12 length=14 edge=.25 seep=.5 release=2.5 drift=.5 after=.9 volume=-10.5 | breeze | hands | Wires eased in and overtaken by soft torn bands that flap, all tiring together | string
Dust in the harp | Remembered texture | source=String opposite=Breath form=.7 colour=.2 attack=.02 tire=.3 depth=.8 length=14 rise=1 edge=.1 air=.7 memory=Octave width=.5 after=0.64 | oldrecord | climb | Dull plucked strings with a dark breath like dust let out of the box | plucked
Power lines over corn | Remembered texture | source=String opposite=Rough form=0 colour=.7 attack=1.2 tire=1.5 seep=.8 length=16 edge=.55 drift=.7 release=2.5 air=.1 volume=-0.5 | flange | overlaps | Wires eased in and, through them, the rough band of the power lines | string
Through the bead curtain | Remembered texture | source=String opposite=Sides form=.9 colour=.55 attack=.01 tire=.1 depth=.9 length=5 rise=.05 edge=.2 seep=.4 blink=.3 blinkRate=6 air=.3 volume=3.5 after=.45 | dust | turning | Tight little plucks under quick lids, a shiver of beads to both sides | plucked
Snare of threads | Remembered texture | source=String opposite=Below form=.3 colour=.5 attack=.06 tire=.5 recover=16 depth=.95 length=20 rise=.6 edge=.6 seep=.5 drift=.4 volume=-2 after=0.86 | slowcloud | samekey | A string plucked till it pales, over a reedy octave below that gathers | texture
The other light alone | Opposite light | attack=1 form=.4 colour=.4 tire=.3 depth=1 seep=1 after=.8 length=20 edge=.4 drift=.7 memory=Chord recover=10 volume=-10.5 | weathers | leaning | A lamp so soon gone that the mirror is all there is | pad
Dusk without its lamp | Opposite light | opposite=Even attack=.6 form=.3 colour=.15 tire=.15 depth=1 seep=1 after=.7 length=14 edge=.2 drift=.4 memory=Octave air=.4 recover=2.2 | haze | overlaps | A lamp put out at once, and only a round, low-lit octave | pad
Strip of torn poster | Opposite light | opposite=Rough attack=.1 form=.6 colour=.5 tire=.1 depth=1 seep=1 after=.7 length=8 edge=.65 drift=.5 memory=Chord recover=6 width=.9 | ripples 1.depth=.8 | calls | A lamp gone in an instant, and wide torn bands in its stead
Outline of a wind | Opposite light | opposite=Breath attack=.4 form=.5 colour=.3 tire=.2 depth=1 seep=1 after=.9 length=12 edge=.35 drift=.9 memory=Chord blink=.4 blinkRate=.3 volume=-9.5 recover=2.2 | shallows | widedrone | Hardly any lamp, slow lids, and a breath shaped to the chord
Cellar answers first | Opposite light | opposite=Below attack=.2 form=.7 colour=.6 tire=.12 depth=1 seep=1 after=.7 length=16 edge=.7 drift=.3 memory=Chord width=.3 recover=1.2 | tube | fourparts | A lamp that fails as it speaks; reedy pipes an octave below go on | organ
Swarm leaving the lamp | - | opposite=Sides form=.4 colour=.5 attack=.5 tire=.4 depth=.9 seep=.6 drift=1 length=9 edge=.15 width=1 blink=.6 blinkRate=4 memory=Octave volume=1 after=.55 | flock | onetone | A lamp under beating lids while its shaking sides fly off in company
Geese, long after | - | source=Reed opposite=Sides form=.6 colour=.5 attack=.15 release=.4 tire=.8 depth=.6 drift=.9 length=20 rise=1.5 edge=.3 after=.9 width=1 memory=Chord volume=-8 recover=11 | leaves | calls | Calling reeds, then far trembling sides going over in their own time | wind
Held for the camera | - | source=Bowl opposite=Breath form=.5 colour=.5 attack=.4 release=.3 tire=.6 depth=1 seep=.6 drift=.6 length=6 edge=.25 memory=Chord recover=20 after=.6 | lungs | again | Bowls fixed for twenty seconds in each other's tiredness, a light wind over them
Choir in the static | - | source=Vowel opposite=Rough form=.55 colour=.6 attack=.3 release=.5 tire=.5 depth=.9 seep=.5 drift=.5 length=9 edge=.8 memory=Chord recover=8 air=.3 | transistor | fourparts | Open ahs that tire together into rough hissing bands | voice
Murmur of tin roofs | - | source=Struck opposite=Rough form=.25 colour=.5 air=.6 tire=.6 depth=.8 seep=.4 drift=.3 length=5 edge=.85 memory=Octave recover=6 width=1 volume=-3 after=0.96 | rain | drops | Struck bars, half lost under hard, hissing, rough bands
First page of guests | - | source=Struck opposite=Mirror form=.5 colour=.4 air=.2 tire=.4 depth=.9 recover=20 length=12 rise=.4 edge=.3 memory=Chord release=.5 | booth | again | Bells that write down the whole chord and come back as its mirror, close and dry | bell
Debt collected slowly | - | source=Lamp opposite=Below form=.5 colour=.4 attack=.02 release=.2 tire=.5 depth=.85 recover=18 length=8 edge=.4 memory=Chord seep=.2 | desk | again | Lamp keys paid out of the whole chord, more octave below at each return | keys
Four looks at one face | - | source=Vowel opposite=Mirror form=.45 colour=.35 attack=.2 release=.2 tire=.4 depth=1 recover=14 length=6 rise=.15 edge=.35 memory=Chord safe=Stay volume=-1 | bare | again | An ah seen four times, each time less of it and more of its mirror | voice
Habit | - | source=Reed opposite=Even form=.35 colour=.55 attack=.04 release=.2 tire=.2 depth=.8 recover=3 length=2.5 rise=.06 edge=.6 memory=Note air=.2 | keyed | samekey | A hollow reed that dulls when repeated and is mostly octave by the fourth time | keys
What the hand forgot | - | source=String opposite=Mirror form=.15 colour=.4 tire=1.5 depth=.7 recover=10 length=16 rise=.8 edge=.2 memory=Chord seep=.3 release=1.5 width=.7 volume=-2 after=.65 safe=Stay | wide | again | Plucked wires that the whole chord tires slowly, their soft mirror left standing | plucked
Silt remembers rain | Slow eclipse | source=Bowl opposite=Rough form=.08 colour=.1 attack=.7 tire=4 length=10 seep=.7 edge=0 memory=Chord recover=12 rise=1 after=.6 | under | lowfifths | Very dark low bowls that remember the whole chord as a soft torn bed | drone
Undersea cable | Slow eclipse | source=Reed opposite=Below form=.1 colour=.2 attack=.8 tire=3 seep=.5 length=14 edge=.7 memory=Octave drift=.3 air=.1 rise=.5 depth=.7 recover=18 after=0.6 | shadowhalf | lowsteps | A hollow low reed tired in every octave, a reedy drone below it | bass
Once-lit coal seam | Slow eclipse | opposite=Mirror form=.1 colour=.1 attack=.5 tire=.6 length=30 seep=.3 edge=.3 memory=Chord recover=6 rise=1.2 release=1 volume=-1.5 after=.55 | cave | lowsteps | Black low lamps, tiring together, with a far seam of mirror above | bass
Both mouths of a tunnel | Slow eclipse | opposite=Sides form=.3 colour=.3 attack=1 tire=1.2 length=16 seep=.6 edge=.3 memory=Chord release=1.5 rise=.6 width=1 after=0.55 volume=0.5 | darkback | lowlong | A low lamp with its dim trembling sides at either mouth of the tunnel | drone
House settling | Slow eclipse | source=Struck opposite=Rough form=.04 colour=.25 attack=.04 tire=.4 length=12 seep=.5 edge=.2 memory=Chord recover=20 rise=.8 air=.5 release=1 after=0.55 volume=-1.5 | boards | lowwalk | Low dull wood and, as the bars tire together, the creak of soft torn bands | bass
`,
    },
    {
      id: 'pluck-and-shade',
      name: 'Pluck and shade',
      category: 'plucked',
      rows: `
Shade of the pear tree | Pluck and shade | form=.8 colour=.4 tire=.25 length=5 rise=.06 seep=.5 edge=.3 air=.2 recover=1.6 after=0.55 volume=0 | slap | sinking | A hollow damped pluck that gives way to its own round octave
Noon, no shade | Pluck and shade | form=.5 colour=.85 tire=.12 depth=1 length=2.5 edge=.8 seep=.7 width=.9 air=.35 recover=7 after=0.86 | bare | turning | A bright dry pluck that is all sharp octave a moment later
Awning let down | Pluck and shade | form=.95 colour=.15 attack=.06 tire=.5 depth=.6 length=10 rise=.5 edge=.15 seep=.3 drift=.4 after=0.55 volume=-0.5 | darkecho | climb | A dull soft pluck under a slow round octave
Two thirds sunlight | Pluck and shade | form=.65 colour=.6 tire=.4 length=7 rise=.2 edge=.55 seep=.4 release=.6 width=.8 drift=.5 volume=-1.5 recover=1.6 | chorus | hands | A clear plucked string, half of it octave by the time it fades
Spun parasol | Pluck and shade | form=.75 colour=.5 tire=.15 length=4 seep=.8 edge=.6 blink=.5 blinkRate=5.5 drift=.3 volume=1 recover=2.4 | fastrotor | pairs | A hollow pluck under spinning lids, octaves between the ribs
Zinc gutter | Pluck and shade | opposite=Rough form=.1 colour=.5 air=.5 tire=.12 length=5 seep=.9 edge=.1 after=.9 width=.3 volume=-14 recover=8 | chamber | - | A wiry pluck dissolved at once in soft torn bands
Twine off the spool | Pluck and shade | opposite=Rough form=.85 colour=.15 air=.8 tire=.12 length=1.2 rise=.06 seep=.5 edge=.15 memory=Note after=.55 release=.15 recover=2.4 volume=-3 | parlour | drops | A dull thumbed pluck and a soft frayed inch of thread after it
Electric fence at dusk | Pluck and shade | opposite=Rough form=0 colour=.95 air=.1 tire=.15 depth=1 length=1.5 seep=.8 edge=.95 width=1 recover=0.8 | fold | turning | A very bright wire, shorted at once into a rough buzz
Burr on the sleeve | Pluck and shade | opposite=Rough form=.45 colour=.5 attack=.02 tire=.8 depth=.5 length=6 rise=.3 edge=.35 seep=.3 drift=.6 | combo | hands | Plain plucked strings with a ragged hum that clings on
Scratched negative | Pluck and shade | opposite=Rough form=.6 colour=.6 tire=.25 length=4 edge=.7 blink=.5 blinkRate=3 seep=.4 air=.4 volume=0 recover=0.5 after=0.84 | oldrecord | calls | Plucks under flickering lids, with rough scratches in the dark parts
Skater and the pond | Pluck and shade | opposite=Mirror form=.3 colour=.6 tire=.4 length=8 rise=.2 seep=.3 edge=.4 after=.9 memory=Note recover=1.2 | bed | twovoices | A clean plucked string, and its mirror gliding on the far side
A mile of kite string | Pluck and shade | opposite=Mirror form=0 colour=.4 tire=1.5 depth=.5 length=20 rise=1 seep=.1 edge=.5 release=2.5 drift=.5 safe=Stay volume=-1.5 | valley | climb | Long wires, low at first, with a mirror far up that comes a second late
Sky in a well bucket | Pluck and shade | opposite=Mirror form=.55 colour=.25 attack=.03 tire=.2 length=14 rise=.6 seep=.5 edge=.6 width=.8 volume=0 after=.6 recover=1.6 | late | calls | A dark pluck, and a small bright mirror brought up after it
Lizard on white wall | Pluck and shade | opposite=Mirror form=.85 colour=.55 air=.2 tire=.1 depth=1 length=3 seep=.6 edge=.25 safe=Stay width=.4 volume=2 after=.5 recover=10 | stub | hands | A quick tight pluck, gone, and its mirror holding quite still
Guitar seen in a spoon | Pluck and shade | opposite=Mirror form=.4 colour=.5 tire=.6 length=6 rise=.1 seep=.7 edge=.2 drift=.8 air=.2 release=.5 volume=-0.5 recover=6 | hollowed | hands | Round strings bent into their own warm mirror, the two a little apart
Thumbs on iron leaves | Wooden shadow | opposite=Even form=.3 colour=.35 air=.25 tire=.3 length=4 rise=.08 edge=.5 release=.5 seep=.1 recover=0.5 | boards | turning | Struck bars like thumbed iron, with a light octave after each
Gourd with a secret | Wooden shadow | opposite=Below form=.16 colour=.5 air=.5 tire=.2 length=5 rise=.1 edge=.5 seep=.4 recover=0.8 | jar | turning | A wooden stroke in a gourd, the hollow octave below it answering
Pips in a dry pod | Wooden shadow | opposite=Mirror form=0 colour=.9 air=.7 tire=.1 depth=1 length=2 edge=.8 after=.9 release=.15 volume=-1 recover=0.5 | dotted | calls | Dry wooden ticks and a tiny mirror, high or low, to every one
Low gate on one hinge | Wooden shadow | opposite=Sides form=.2 colour=.3 air=.4 tire=.4 length=8 rise=.3 edge=.15 after=.6 drift=.7 width=1 recover=1.2 | slowing | drops | A plain wooden bar swung open on its trembling sides
Bamboo water clock | Wooden shadow | opposite=Breath form=.08 colour=.5 air=.4 tire=.15 length=6 rise=.2 edge=.25 after=.7 blink=.3 blinkRate=.8 volume=-0.5 recover=2.4 | shallows | drops | Wooden knocks, slow lids between them, and a wash of breath
Light snapped off | - | opposite=Mirror form=.5 colour=.65 attack=.01 release=.15 tire=.1 depth=1 length=5 rise=.04 edge=.4 seep=.5 volume=-1 after=.6 recover=0.5 | repeats | turning | A lamp that is only a click of light, then its mirror
Spent match | - | opposite=Breath form=.7 colour=.85 attack=.01 release=.15 tire=.12 depth=1 length=2 rise=.04 edge=.5 seep=.6 air=.6 after=.9 volume=-0.5 recover=1.2 | booth | drops | A bright flick of lamp and the breath that blew it out
Switch in the hall | - | opposite=Below form=.3 colour=.5 attack=.01 release=.2 tire=.15 depth=.95 length=3 rise=.05 edge=.4 seep=.4 width=.3 recover=7 | glue | climb | A short hollow lamp that drops to a soft pipe an octave below
Paper lantern on a cord | - | opposite=Even form=.1 colour=.4 attack=.01 release=.3 tire=.2 depth=.9 length=6 rise=.1 edge=.3 seep=.6 drift=.5 recover=7 | halo | climb | A hollow lamp plucked into light, fading to a loose low-lit octave
Sparks off a tram wire | - | opposite=Sides form=.9 colour=.65 attack=.01 release=.15 tire=.08 depth=1 length=2.5 rise=.04 edge=.25 seep=.7 width=1 volume=-1 after=.5 recover=0.8 | glints2 | calls | A bright octave lamp spat out to two shaking sides
Reed warbler's nest | Pluck and shade | opposite=Breath form=.5 colour=.5 air=.5 tire=.2 length=4 rise=.1 seep=.6 edge=.35 after=.6 recover=7 volume=-1 | quickswell | turning | Plucked strings whose ring is taken over by a light wind
Moth along the wire | Pluck and shade | opposite=Sides form=.2 colour=.45 air=.1 tire=.4 length=6 rise=.1 seep=.4 edge=.2 drift=.7 width=1 memory=Note volume=-1 after=.5 recover=1.6 | ripples | climb | Long fine wires with trembling sides like wings against them
One feather loose | Pluck and shade | opposite=Breath form=.9 colour=.1 attack=.1 air=.5 tire=.6 length=8 rise=.5 seep=.3 edge=0 width=.3 recover=1.8 | pillow | hands | The dullest of plucked strings and a warm dark breath | keys
Gulls over rigging | Pluck and shade | opposite=Sides form=.6 colour=.7 tire=.12 depth=1 length=5 seep=.3 edge=.35 air=.3 blink=.4 blinkRate=2 width=1 volume=5.5 after=.6 recover=14 | shore 1.distance=.6 | calls | Bright plucks under beating lids, their sides crying and shaking
Sand through a lute | Pluck and shade | opposite=Breath form=.35 colour=.4 air=.75 tire=.3 length=12 rise=.3 seep=.7 edge=.5 drift=.4 memory=Chord recover=8 after=.5 | worn | hands | Scratched strings tiring together into a sandy wind
Round of four buckets | Pluck and shade | opposite=Below form=.4 colour=.55 tire=.25 length=3 seep=.3 edge=.5 rise=.06 memory=Note width=.4 volume=4 recover=0.8 | canon | sinking | Plucked strings in a round, each with a short pipe below
Stepping on both stones | Pluck and shade | opposite=Even form=.3 colour=.7 tire=.6 length=5 seep=.15 edge=.3 air=.3 release=.15 volume=1 depth=.5 rise=.3 after=0.55 | threeheads | turning | Dry bright plucks that ring a little, a round octave hopping in after
Left-handed clockmaker | Pluck and shade | opposite=Mirror form=.7 colour=.4 tire=.15 length=3 seep=.5 edge=.5 blink=.7 blinkRate=4 memory=Note volume=1.5 recover=1.8 | answering | pairs | Short plucks under ticking lids, the mirror on every offbeat
Ball down the spiral | Pluck and shade | opposite=Sides form=.8 colour=.6 tire=.1 depth=1 length=3 rise=.04 seep=.5 edge=.2 air=.4 volume=2 after=.5 | stones | drops | A tight plucked string that bounces off, sides shaking with each landing
Letters out of order | Pluck and shade | opposite=Rough form=.15 colour=.5 air=.3 tire=.3 length=5 rise=.1 edge=.4 seep=.6 drift=.5 recover=1.6 | bed | calls | Wiry plucks, every one torn at the edge
Thumb on a cellar door | Pluck and shade | opposite=Below form=.75 colour=.3 air=.35 tire=.3 length=3 rise=.1 seep=.3 edge=.3 width=0 release=.2 recover=2.4 | mono | lowsteps | A thumbed low string with a round pipe under it, short | bass
Third plank of a bridge | Pluck and shade | opposite=Even form=.2 colour=.5 air=.2 tire=.6 length=6 rise=.3 seep=.2 edge=.5 drift=.5 release=.8 memory=Note after=0.55 volume=-1.5 | room | lowsteps | Low long plucks that sway a little, with an octave after the step | bass
Cord of a heavy curtain | Pluck and shade | opposite=Breath form=.6 colour=.2 attack=.04 air=.6 tire=.25 length=5 rise=.2 seep=.4 edge=.2 width=.4 recover=1.2 | shaded | lowwalk | A low soft pluck and the breath of cloth falling to | bass
Slack mooring line | Pluck and shade | opposite=Sides form=.05 colour=.35 tire=1 length=8 rise=.3 seep=.5 edge=.2 drift=1 release=1.5 width=.9 memory=Note | waters | lowlong | A low wire, let go slack, its trembling sides lapping | bass
Nail keg | Pluck and shade | opposite=Rough form=.9 colour=.7 air=.8 tire=.1 depth=1 length=1.2 rise=.04 edge=.8 seep=.4 width=.05 release=.15 recover=14 | iron | lowwalk | A hard low pluck, dead at once, with a rattle of rough bands | bass
Reed plucked green | Pluck and shade | source=Reed form=.3 colour=.6 tire=.1 depth=1 length=3 seep=.5 edge=.5 air=.3 memory=Note volume=-1 recover=1.2 after=0.5 | stub | - | A hollow reed cut so short it plucks, its octave standing after it
One button of many | Pluck and shade | source=Reed opposite=Mirror form=.75 colour=.45 tire=.12 depth=1 length=5 rise=.06 seep=.3 edge=.6 air=.2 release=.15 recover=0.5 after=0.6 | bedside | turning | A dab of nasal reed and a small clear mirror of it | keys
Syllable with a tail | Pluck and shade | source=Vowel opposite=Even form=.5 colour=.6 tire=.12 depth=1 length=3 seep=.4 edge=.6 air=.2 release=.15 volume=1 recover=8 after=0.64 | repeats 1.mix=.2 | twovoices | One short ah for each key and an octave for its tail | voice
Goat bells almost speak | Pluck and shade | source=Vowel opposite=Mirror form=.85 colour=.6 tire=.1 depth=1 length=6 rise=.05 seep=.5 edge=.5 air=.1 width=.9 volume=1 after=.6 recover=10 | valley 1.mix=.2 | calls | Clipped bright voices on eh, a low mirror or a high one ringing after | voice
A rim only tapped | Pluck and shade | source=Bowl opposite=Below form=.5 colour=.6 tire=.15 depth=1 length=8 rise=.1 seep=.4 edge=.4 air=.2 | darkplate 2.mix=.18 | pairs | A bowl touched for an instant; the hollow octave below rings instead | bell
Harp of cut glass | Pluck and shade | source=Struck opposite=Even form=.92 colour=.6 tire=.2 length=6 rise=.1 seep=.3 edge=.4 air=.05 memory=Note recover=0.5 after=0.6 | bloomtail | climb | Bright struck glass, small and quick, under a soft even octave
Frost on fine wire | Pluck and shade | form=.05 colour=.8 attack=.04 air=.1 tire=.8 depth=.6 length=16 rise=.6 seep=.2 edge=.8 release=2 memory=Note volume=-10.5 | glimshim 1.mix=.28 | climb | Long bright wires that let a clear high octave form over them
Lute with no one by | Pluck and shade | opposite=Below form=.45 colour=.35 air=.3 tire=1 depth=.5 length=10 rise=.6 seep=.1 edge=.3 release=.6 memory=Note recover=6 after=1 volume=-11 | leaves | hands | Plain plucked strings and, as each is left, a dark pipe below
Sunshower | Pluck and shade | opposite=Mirror form=.6 colour=.9 tire=.15 length=10 rise=.1 seep=.5 edge=.7 drift=.4 width=1 air=.2 release=.4 safe=Stay recover=1.2 after=0.6 volume=-1.5 | brightair | highpeal | High bright plucks with a low warmth of mirror shining through the rain
Peel in one ribbon | Pluck and shade | opposite=Even form=.35 colour=.6 tire=.3 length=12 rise=.3 seep=.6 edge=.45 drift=1 width=1 release=1 memory=Note safe=Stay recover=0.5 | lifted | hands | Ringing strings whose octaves unwind from them and curl upward
`,
    },
  ],
}
