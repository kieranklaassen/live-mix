import { type InstrumentSet } from './set'

// Each direction is ten corners of five presets. A corner is a company of people (how many, with
// what body, at which end of the chord) and the way it gets to a note; inside one, the five differ
// by how they begin, breathe and end, and by where they are heard from.

export const SET: InstrumentSet = {
  device: 'walking-voices',
  names: {
    body: ['Open', 'Hum', 'Hollow', 'Whistle', 'Reed', 'Strings'],
    path: ['Slide', 'Steps', 'Turn', 'Leap', 'Late'],
  },
  chains: {
    plain: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Open', params: { clear: 0.2 } }],
      words: ', dry and close',
    },
    near: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Voice' },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: ', dry and a little wide',
    },
    warmed: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Warm' },
        { deviceId: 'saturator', preset: 'Warm glue' },
      ],
      words: ', dry, its low middle warmed',
    },
    shaded: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Shaded' },
        { deviceId: 'spread', preset: 'Soft tilt' },
      ],
      words: ', dry, the top in shade',
    },
    bright: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Bright', params: { presence: 4, air: 5 } },
        { deviceId: 'tamer', preset: 'Gentle' },
      ],
      words: ', dry, with the light let in',
    },
    centre: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Mono' },
        { deviceId: 'ambient-eq', preset: 'Keys' },
      ],
      words: ', dry, all from one spot',
    },
    narrow: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Narrow' },
        { deviceId: 'analog-drive', preset: 'First hint' },
      ],
      words: ', dry and narrow',
    },
    broad: {
      effects: [
        { deviceId: 'spread', preset: 'Wide pad' },
        { deviceId: 'tamer', preset: 'Gentle' },
      ],
      words: ', dry and opened very wide',
    },
    firm: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 6 } },
        { deviceId: 'spread', preset: 'Firm bass' },
      ],
      words: ', dry, on a firm deep floor',
    },
    thin: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Thin', params: { lowCut: 220 } },
        { deviceId: 'spread', preset: 'Air only' },
      ],
      words: ', dry, thinned to its middle',
    },
    scooped: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Hollow', params: { air: 2 } },
        { deviceId: 'stereo-detune', preset: 'Faint width' },
      ],
      words: ', dry, scooped in the middle',
    },
    pressed: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Forward' },
        { deviceId: 'ambient-comp', preset: 'Dense pad', params: { makeup: 6 } },
      ],
      words: ', dry and pressed forward',
    },
    muffled: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Muffled', params: { highCut: 1500 } }],
      words: ', dry, as if under a coat',
    },
    doubled: {
      effects: [
        { deviceId: 'stereo-detune', preset: 'Doubled' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', dry, each note doubled a little late',
    },
    booth: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.18 } }],
      words: 'in a small booth',
    },
    chamber: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.2 } }],
      words: 'in a tight chamber',
    },
    parlour: {
      effects: [
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.26 } },
        { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 2 } },
      ],
      words: 'in a carpeted parlour',
    },
    stub: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.24 } }],
      words: 'on a short dull plate',
    },
    valve: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Triode glow' },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.1 } },
      ],
      words: 'through a warm valve',
    },
    iron: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Iron lows' },
        { deviceId: 'spread', preset: 'Firm bass' },
      ],
      words: ', driven into iron, dry',
    },
    tube: {
      effects: [
        { deviceId: 'saturator', preset: 'Tube preamp', params: { driveDb: 8, outputDb: -4 } },
        { deviceId: 'plate-reverb', preset: 'Tight room', params: { mix: 0.12 } },
      ],
      words: 'leaning on a tube',
    },
    folded: {
      effects: [
        { deviceId: 'saturator', preset: 'Folded glass', params: { mix: 0.3 } },
        { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 5000 } },
      ],
      words: ', with a folded edge beside it',
    },
    reel: {
      effects: [{ deviceId: 'tape', preset: 'Quarter inch', params: { hiss: 0.08 } }],
      words: 'on quarter inch tape',
    },
    cassette: {
      effects: [
        { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.12 } },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: 'on a worn cassette',
    },
    combo: {
      effects: [{ deviceId: 're-amp', preset: 'Combo in a room', params: { noise: 0 } }],
      words: 'through a small amplifier in a room',
    },
    pillow: {
      effects: [
        { deviceId: 're-amp', preset: 'Pillow speaker', params: { noise: 0 } },
        { deviceId: 'ambient-eq', preset: 'Warm' },
      ],
      words: 'from a speaker under a pillow',
    },
    wood: {
      effects: [
        { deviceId: 'vessel', preset: 'Hint of wood', params: { mix: 0.45 } },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: 'inside a wooden box',
    },
    pipe: {
      effects: [
        { deviceId: 'vessel', preset: 'Inside a pipe', params: { mix: 0.4 } },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.12 } },
      ],
      words: 'down a length of pipe',
    },
    clay: {
      effects: [
        { deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.14 } },
      ],
      words: 'inside a clay pot',
    },
    glasstube: {
      effects: [
        { deviceId: 'vessel', preset: 'Glass tube', params: { mix: 0.35 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
      ],
      words: 'in a tube of glass',
    },
    tiny: {
      effects: [
        { deviceId: 'size', preset: 'Smaller' },
        { deviceId: 'ambient-eq', preset: 'Keys' },
      ],
      words: ', made small, dry',
    },
    giant: {
      effects: [
        { deviceId: 'size', preset: 'Larger', params: { size: 0.6 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'with a body twice its size',
    },
    mouth: {
      effects: [
        { deviceId: 'imprint', preset: 'Faint vowel' },
        { deviceId: 'spread', preset: 'Soft tilt' },
      ],
      words: 'with a round mouth laid over it, dry',
    },
    darkbox: {
      effects: [
        { deviceId: 'imprint', preset: 'Dark box', params: { replace: 0.4 } },
        { deviceId: 'stereo-detune', preset: 'Faint width' },
      ],
      words: 'shut in a dark box',
    },
    swaying: {
      effects: [
        { deviceId: 'late-vibrato', preset: 'Singer' },
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.18 } },
      ],
      words: 'that sways once it is held',
    },
    shaker: {
      effects: [
        { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { depth: 0.7 } },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.12 } },
      ],
      words: 'with a shimmer from top to bottom',
    },
    throb: {
      effects: [
        { deviceId: 'tremolo', preset: 'Amp tremolo', params: { depth: 0.5, rate: 3.2 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
      ],
      words: 'under a steady tremolo',
    },
    rotor: {
      effects: [
        { deviceId: 'rotary', preset: 'Chorale' },
        { deviceId: 'ambient-eq', preset: 'Warm' },
      ],
      words: 'through a slowly turning horn',
    },
    rotorfast: {
      effects: [
        { deviceId: 'rotary', preset: 'Tremolo', params: { hornDepth: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: 'through a fast turning horn',
    },
    opening: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Soft bloom', params: { driveDb: 2, cutoffHz: 350 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
      ],
      words: 'through a filter that opens to it',
    },
    notch: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Slow notch' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'with a slow notch passing through',
    },
    gatefilter: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Low-pass gate', params: { cutoffHz: 700 } },
        { deviceId: 'stereo-detune', preset: 'Soft halo' },
      ],
      words: 'through a closed filter, dry',
    },
    lofilter: {
      effects: [
        {
          deviceId: 'auto-filter',
          preset: 'Glacial low-pass',
          params: { cutoffHz: 1100, driveDb: 0 },
        },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'behind a filter that barely moves',
    },
    chorused: {
      effects: [
        { deviceId: 'chorus', preset: 'Subtle widener' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: 'doubled by a light chorus',
    },
    ensemble: {
      effects: [
        { deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: 'thickened by a chorus, in a hall',
    },
    swirl: {
      effects: [
        { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.4 } },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.22 } },
      ],
      words: 'with a slow swirl, on a plate',
    },
    jet: {
      effects: [
        { deviceId: 'flanger', preset: 'Gentle sweep', params: { mix: 0.35 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'with a gentle sweep through it',
    },
    slap: {
      effects: [
        { deviceId: 'ether-reverb', preset: 'Slap room', params: { mix: 0.26 } },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: 'with one slap off a far wall',
    },
    slapback: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Slapback' },
        { deviceId: 'ambient-eq', preset: 'Keys' },
      ],
      words: 'with one quick echo, dry',
    },
    room: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.24 } }],
      words: 'in a plain room',
    },
    stairwell: {
      effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
      words: 'down a stone stairwell',
    },
    wall: {
      effects: [
        { deviceId: 'distance', preset: 'Next door' },
        { deviceId: 'ambient-eq', preset: 'Warm', params: { low: 2, body: 2 } },
      ],
      words: 'heard through a wall',
    },
    steps: {
      effects: [
        { deviceId: 'distance', preset: 'A few steps back' },
        { deviceId: 'spread', preset: 'Firm and airy' },
      ],
      words: 'from a few steps back',
    },
    openair: {
      effects: [{ deviceId: 'distance', preset: 'Open air' }],
      words: 'out in the open air',
    },
    hallend: {
      effects: [{ deviceId: 'distance', preset: 'Back of the hall' }],
      words: 'from the back of a hall',
    },
    chapel: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.3 } }],
      words: 'in a small chapel',
    },
    spring: {
      effects: [
        { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.16 } },
        { deviceId: 'ambient-eq', preset: 'Keys' },
      ],
      words: 'with a trace of spring',
    },
    coils: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.26 } }],
      words: 'on three long springs',
    },
    gated: {
      effects: [
        { deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.34 } },
        { deviceId: 'spread', preset: 'Firm bass' },
      ],
      words: 'in a room that stops dead',
    },
    tank: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.22 } }],
      words: 'in a bright metal tank',
    },
    brightplate: {
      effects: [
        { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.28 } },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: 'on a bright plate',
    },
    darkplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.3 } }],
      words: 'on a dark plate',
    },
    cellar: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Narrow cellar', params: { mix: 0.3 } }],
      words: 'in a narrow cellar',
    },
    shaft: {
      effects: [
        { deviceId: 'swarm-reverb', preset: 'Mine shaft', params: { mix: 0.24 } },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: 'down a mine shaft',
    },
    pattering: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.26 } }],
      words: 'with patter off many walls',
    },
    hall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
      words: 'in a hall',
    },
    cathedral: {
      effects: [
        { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.32 } },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: 'in a cathedral',
    },
    nave: {
      effects: [
        { deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.34 } },
        { deviceId: 'spread', preset: 'Wide top' },
      ],
      words: 'under a vast nave',
    },
    darkhall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.34 } }],
      words: 'in a dark hall',
    },
    airy: {
      effects: [
        { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.3 } },
        { deviceId: 'stereo-widener', preset: 'Wide' },
      ],
      words: 'with an airy tail',
    },
    openspace: {
      effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.32 } }],
      words: 'in a wide open space',
    },
    thinair: {
      effects: [{ deviceId: 'expanse', preset: 'Thin air', params: { mix: 0.34 } }],
      words: 'in thin air',
    },
    lowspace: {
      effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.36 } }],
      words: 'in a deep dark space',
    },
    seasick: {
      effects: [{ deviceId: 'expanse', preset: 'Seasick choir', params: { mix: 0.3 } }],
      words: 'in a space that sways',
    },
    bloomspace: {
      effects: [{ deviceId: 'expanse', preset: 'Bloom', params: { mix: 0.4 } }],
      words: 'in a space that swells after it',
    },
    valley: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.3 } }],
      words: 'across an open valley',
    },
    lateplace: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Late arrival', params: { mix: 0.32 } }],
      words: 'answered late by a big room',
    },
    breathing: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.38 } }],
      words: 'in a hall that breathes',
    },
    longplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.32 } }],
      words: 'on a long plate',
    },
    endless: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Endless wash', params: { mix: 0.3 } }],
      words: 'with a wash that does not end',
    },
    shining: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Shining tail', params: { mix: 0.2 } }],
      words: 'with a shining tail',
    },
    darkend: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Dark infinite', params: { mix: 0.24 } }],
      words: 'with a dark endless tail',
    },
    monks: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.34 } }],
      words: 'with low vowels after it',
    },
    faintvoices: {
      effects: [
        { deviceId: 'vowel-reverb', preset: 'Faint voices', params: { mix: 0.24 } },
        { deviceId: 'stereo-widener', preset: 'Wide' },
      ],
      words: 'with faint vowels after it',
    },
    whisperhall: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Whispering', params: { mix: 0.32 } }],
      words: 'in a hall that whispers back',
    },
    farshore: {
      effects: [{ deviceId: 'distance', preset: 'Far shore' }],
      words: 'from a far shore',
    },
    lost: {
      effects: [{ deviceId: 'distance', preset: 'Lost in the hall' }],
      words: 'lost at the end of a hall',
    },
    throughfog: {
      effects: [
        { deviceId: 'distance', preset: 'Through fog' },
        { deviceId: 'ambient-eq', preset: 'Deep', params: { low: 3 } },
      ],
      words: 'through fog',
    },
    reversed: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.36 } }],
      words: 'with a breath of itself reversed',
    },
    darkswell: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Dark swell', params: { mix: 0.4 } }],
      words: 'with a dark swell behind',
    },
    halo: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.34 } }],
      words: 'in a short halo',
    },
    hazed: {
      effects: [{ deviceId: 'haze', preset: 'Thin veil', params: { mix: 0.3 } }],
      words: 'in a thin haze',
    },
    wool: {
      effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.32 } }],
      words: 'wrapped in wool',
    },
    glow: {
      effects: [{ deviceId: 'haze', preset: 'Slow bloom', params: { mix: 0.4 } }],
      words: 'in a glow that blooms',
    },
    choirup: {
      effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.26 } }],
      words: 'under a halo that rises',
    },
    fifthsup: {
      effects: [{ deviceId: 'shimmer', preset: 'Fifths', params: { mix: 0.24 } }],
      words: 'with fifths rising off it',
    },
    loft: {
      effects: [{ deviceId: 'shimmer', preset: 'Organ loft', params: { mix: 0.3 } }],
      words: 'under an organ loft',
    },
    muffledup: {
      effects: [{ deviceId: 'shimmer', preset: 'Muffled choir', params: { mix: 0.34 } }],
      words: 'in a muffled upper glow',
    },
    held: {
      effects: [{ deviceId: 'spiral', preset: 'Held still', params: { mix: 0.3 } }],
      words: 'in a hall that hangs still',
    },
    ascent: {
      effects: [{ deviceId: 'spiral', preset: 'Slow ascent', params: { mix: 0.3 } }],
      words: 'with a tail that climbs',
    },
    bloom: {
      effects: [
        { deviceId: 'bloom-reverb', preset: 'Bloom', params: { mix: 0.3 } },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: 'whose tail flowers upward',
    },
    winter: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Winter drift', params: { mix: 0.32 } }],
      words: 'whose tail sinks and cools',
    },
    cloud: {
      effects: [
        { deviceId: 'fog', preset: 'Soft cloud', params: { mix: 0.7 } },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: 'blurred into a soft cloud',
    },
    mist: {
      effects: [
        { deviceId: 'fog', preset: 'Morning mist', params: { mix: 0.7 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'in morning mist',
    },
    warmecho: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.26 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.12 } },
      ],
      words: 'with warm tape repeats',
    },
    dotted: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.28 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
      ],
      words: 'with dotted repeats',
    },
    heads: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.28 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'off three tape heads',
    },
    darkecho: {
      effects: [{ deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.28 } }],
      words: 'with dark soft echoes',
    },
    drift: {
      effects: [
        { deviceId: 'analog-delay', preset: 'Slow drift', params: { mix: 0.3 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'with echoes that drift',
    },
    stars: {
      effects: [
        { deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.32 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'with seven scattered echoes',
    },
    points: {
      effects: [
        { deviceId: 'constellation', preset: 'Faint points', params: { mix: 0.24 } },
        { deviceId: 'plate-reverb', preset: 'Faint sheen' },
      ],
      words: 'with a few far points of echo',
    },
    pebble: {
      effects: [
        { deviceId: 'skipping-stone', preset: 'Soft pebble', params: { mix: 0.28 } },
        { deviceId: 'fdn-reverb', preset: 'Thin veil' },
      ],
      words: 'with echoes like a skipped pebble',
    },
    memory: {
      effects: [
        { deviceId: 'echo-memory', preset: 'Recalling', params: { mix: 0.34 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: 'with moments of itself coming back',
    },
    answer: {
      effects: [
        { deviceId: 'canon', preset: 'Faint answer', params: { mix: 0.3 } },
        { deviceId: 'plate-reverb', preset: 'Small plate' },
      ],
      words: 'answered once, softly',
    },
    round: {
      effects: [
        { deviceId: 'canon', preset: 'Round of three', params: { mix: 0.36, gap: 1.1 } },
        { deviceId: 'ether-reverb', preset: 'Faint air' },
      ],
      words: 'sung as a round of three',
    },
    unfold: {
      effects: [
        { deviceId: 'prism', preset: 'Low to high', params: { mix: 0.3 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'with echoes that open from low to high',
    },
    mirror: {
      effects: [
        { deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.36 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'with slow swells played backwards',
    },
    reflected: {
      effects: [{ deviceId: 'reverse-delay', preset: 'Faint reflection', params: { mix: 0.24 } }],
      words: 'with a faint backward reflection',
    },
    loop: {
      effects: [
        { deviceId: 'tape-loop', preset: 'Slow fade', params: { mix: 0.4 } },
        { deviceId: 'ambient-eq', preset: 'Shaded' },
      ],
      words: 'on a loop of tape that fades',
    },
    orbits: {
      effects: [
        { deviceId: 'orbits', preset: 'Slow phasing', params: { mix: 0.32 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'on loops that drift apart',
    },
    swell: {
      effects: [
        { deviceId: 'tremolo', preset: 'Sea swell', params: { depth: 0.55 } },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.24 } },
      ],
      words: 'rising and sinking like a sea',
    },
    pulse: {
      effects: [
        { deviceId: 'pulses', preset: 'Soft throb', params: { floor: 0.4 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
      ],
      words: 'under a soft throb',
    },
    weave: {
      effects: [
        { deviceId: 'pulses', preset: 'Wide weave', params: { mix: 0.8 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'pulsed in a wide weave',
    },
    ebb: {
      effects: [
        { deviceId: 'breath', preset: 'Calm breath' },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.22 } },
      ],
      words: 'opening and closing like a chest',
    },
    water: {
      effects: [
        { deviceId: 'currents', preset: 'Slow water' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: 'in slow crossing currents',
    },
    ripples: {
      effects: [
        { deviceId: 'currents', preset: 'Ripples', params: { depth: 0.5 } },
        { deviceId: 'ether-reverb', preset: 'Faint air' },
      ],
      words: 'under quick ripples',
    },
    sparkle: {
      effects: [
        { deviceId: 'glimmer', preset: 'Light on water' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.22 } },
      ],
      words: 'glinting like light on water',
    },
    flock: {
      effects: [
        { deviceId: 'murmuration', preset: 'Evening flock', params: { mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'wheeling overhead',
    },
    turning: {
      effects: [
        { deviceId: 'around', preset: 'Slow circle' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'circling the room',
    },
    sway: {
      effects: [
        { deviceId: 'around', preset: 'Gentle sway' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: 'swaying from side to side',
    },
    grains: {
      effects: [
        { deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.36 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: 'in a cloud of its own grains',
    },
    smear: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Slow smear', params: { mix: 0.4 } }],
      words: 'smeared into slow grains',
    },
    hang: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.4 } }],
      words: 'hanging on in a mist',
    },
    dissolve: {
      effects: [
        { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 0.5 } },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: 'slowly dissolving',
    },
    embers: {
      effects: [
        { deviceId: 'grain-delay', preset: 'Falling embers', params: { mix: 0.24 } },
        { deviceId: 'ether-reverb', preset: 'Faint air' },
      ],
      words: 'with embers falling off it',
    },
    crystals: {
      effects: [
        { deviceId: 'grain-delay', preset: 'Crystals', params: { mix: 0.2 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'with high crumbs of itself',
    },
    wax: {
      effects: [
        { deviceId: 'melt', preset: 'Candle wax', params: { mix: 0.36 } },
        { deviceId: 'fdn-reverb', preset: 'Thin veil' },
      ],
      words: 'running like wax as it ages',
    },
    leaves: {
      effects: [
        { deviceId: 'falling', preset: 'Falling leaves', params: { mix: 0.28 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'with small falls off every note',
    },
    clouds: {
      effects: [
        { deviceId: 'weather', preset: 'Passing clouds' },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'with clouds passing over',
    },
    rain: {
      effects: [
        { deviceId: 'weather', preset: 'Light rain', params: { exposure: 0.4, voice: 0.25 } },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'in light rain',
    },
    surf: {
      effects: [
        { deviceId: 'weather', preset: 'Slow surf', params: { exposure: 0.4, voice: 0.2 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'with surf washing through',
    },
    submerged: {
      effects: [
        { deviceId: 'underwater', preset: 'Just under' },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
      ],
      words: 'just under water',
    },
    record: {
      effects: [
        { deviceId: 'vinyl', preset: 'New pressing', params: { surface: 0.25 } },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.12 } },
      ],
      words: 'on a worn record',
    },
    dusty: {
      effects: [
        { deviceId: 'patina', preset: 'Dusty record', params: { noise: 0.3 } },
        { deviceId: 'spread', preset: 'Firm and airy' },
      ],
      words: 'off a dusty record',
    },
    wireless: {
      effects: [
        { deviceId: 'radio', preset: 'Kitchen radio', params: { static: 0.08 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
      ],
      words: 'from a kitchen radio',
    },
    sampler: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Glaze' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'under an old digital glaze',
    },
    floorhiss: {
      effects: [
        { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -52 } },
        { deviceId: 'tape', preset: 'Warm thump' },
      ],
      words: 'over a floor of tape hiss',
    },
    summer: {
      effects: [
        { deviceId: 'seasons', preset: 'High summer' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: 'in a warm wide season',
    },
    frost: {
      effects: [
        { deviceId: 'seasons', preset: 'First frost' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: 'in a thin cold season',
    },
    stretched: {
      effects: [{ deviceId: 'stretch', preset: 'Half time haze', params: { mix: 0.32 } }],
      words: 'with a slow cloud trailing it',
    },
    dissolving: {
      effects: [
        { deviceId: 'generations', preset: 'Faint afterimage', params: { mix: 0.28 } },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: 'ringing on in its own room',
    },
    sustained: {
      effects: [
        { deviceId: 'sustainer', preset: 'Thin halo', params: { mix: 0.28 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'with a thin held halo',
    },
    shared: {
      effects: [
        { deviceId: 'common-tones', preset: 'Light touch' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.24 } },
      ],
      words: 'where shared notes hang on',
    },
    tiles: {
      effects: [
        { deviceId: 'cascade', preset: 'Faint halo', params: { mix: 0.22 } },
        { deviceId: 'plate-reverb', preset: 'Small plate' },
      ],
      words: 'with small loops an octave up',
    },
    dust: {
      effects: [
        { deviceId: 'glints', preset: 'Faint dust', params: { mix: 0.2 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'with a dust of bright sparks',
    },
    sines: {
      effects: [
        { deviceId: 'sine-shadow', preset: 'Nearly dry', params: { mix: 0.3 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'shadowed by a few pure tones',
    },
    strings: {
      effects: [
        { deviceId: 'sympathetic', preset: 'Faint ring', params: { mix: 0.28 } },
        { deviceId: 'ether-reverb', preset: 'Faint air' },
      ],
      words: 'with open strings ringing along',
    },
    wakes: {
      effects: [
        { deviceId: 'silent-keys', preset: 'Fifths out of clicks', params: { mix: 0.3 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'waking silent strings in fifths',
    },
    bowls: {
      effects: [
        { deviceId: 'bowls', preset: 'Faint halo', params: { mix: 0.24 } },
        { deviceId: 'fdn-reverb', preset: 'Thin veil' },
      ],
      words: 'with metal bowls ringing along',
    },
    octaveup: {
      effects: [
        { deviceId: 'octaves', preset: 'Faint octave' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.24 } },
      ],
      words: 'with a faint octave above',
    },
    pedal: {
      effects: [
        { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.45 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: 'over its own low octave',
    },
    stopped: {
      effects: [
        { deviceId: 'stops', preset: 'Nearly dry' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
      ],
      words: 'with a rank of pipes beside it',
    },
    fifthpad: {
      effects: [
        { deviceId: 'pitch-shifter', preset: 'Pad fifth', params: { mix: 0.22 } },
        { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.24 } },
      ],
      words: 'with a fifth laid over',
    },
    halfspeed: {
      effects: [
        { deviceId: 'half-speed', preset: 'Thin shadow', params: { mix: 0.3 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
      ],
      words: 'trailed by its half-speed shadow',
    },
    shifted: {
      effects: [
        { deviceId: 'freq-shifter', preset: 'Still water', params: { mix: 0.35 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: 'beating slowly against itself',
    },
    overtones: {
      effects: [
        { deviceId: 'overtone-singer', preset: 'Faint melody' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.24 } },
      ],
      words: 'with a whistled overtone on top',
    },
    feltair: {
      effects: [
        { deviceId: 'sift', preset: 'Felt and air' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: 'with its edges felted',
    },
    quietup: {
      effects: [
        { deviceId: 'lift', preset: 'Quiet end up', params: { amount: 0.5 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: 'with its quiet end brought up',
    },
    revealed: {
      effects: [
        { deviceId: 'reveal', preset: 'Gentle opening' },
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.2 } },
      ],
      words: 'with its inner detail turned up',
    },
    bowedin: {
      effects: [
        { deviceId: 'swell', preset: 'Soft pick' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } },
      ],
      words: 'faded in as if bowed',
    },
    bridge: {
      effects: [
        { deviceId: 'buzzing-bridge', preset: 'Paper edge', params: { mix: 0.4 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: 'with a paper buzz on it',
    },
    stumble: {
      effects: [
        { deviceId: 'glitch', preset: 'Rare slips' },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: 'that slips now and then',
    },
    slowing: {
      effects: [
        { deviceId: 'winding-down', preset: 'Soft losing pace' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.24 } },
      ],
      words: 'with a pulse that loses pace',
    },
  },
  phrases: {
    hymn: {
      notes: [
        { atSec: 0, durSec: 2.3, note: 50, gain: 0.6 },
        { atSec: 0, durSec: 4.5, note: 57, gain: 0.6 },
        { atSec: 0, durSec: 2.3, note: 65, gain: 0.6 },
        { atSec: 0, durSec: 4.5, note: 69, gain: 0.6 },
        { atSec: 2.2, durSec: 2.2, note: 48, gain: 0.6 },
        { atSec: 2.2, durSec: 2.3, note: 64, gain: 0.6 },
        { atSec: 4.4, durSec: 2.8, note: 43, gain: 0.6 },
        { atSec: 4.4, durSec: 2.8, note: 59, gain: 0.6 },
        { atSec: 4.4, durSec: 2.8, note: 62, gain: 0.6 },
        { atSec: 4.4, durSec: 2.8, note: 67, gain: 0.6 },
      ],
    },
    lined: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 69, gain: 0.8 },
        { atSec: 1.55, durSec: 0.8, note: 72, gain: 0.7 },
        { atSec: 2.3, durSec: 0.9, note: 71, gain: 0.8 },
        { atSec: 3.15, durSec: 1, note: 67, gain: 0.7 },
        { atSec: 4.1, durSec: 3.1, note: 43, gain: 0.6 },
        { atSec: 4.1, durSec: 3.1, note: 50, gain: 0.6 },
        { atSec: 4.1, durSec: 3.1, note: 59, gain: 0.6 },
        { atSec: 4.1, durSec: 3.1, note: 67, gain: 0.7 },
      ],
    },
    leaning: {
      notes: [
        { atSec: 0, durSec: 2, note: 50, gain: 0.6 },
        { atSec: 0, durSec: 4, note: 57, gain: 0.6 },
        { atSec: 0, durSec: 3, note: 65, gain: 0.7 },
        { atSec: 2, durSec: 2, note: 43, gain: 0.6 },
        { atSec: 3, durSec: 4.1, note: 64, gain: 0.7 },
        { atSec: 4, durSec: 3.1, note: 48, gain: 0.6 },
        { atSec: 4, durSec: 3.1, note: 55, gain: 0.6 },
      ],
    },
    fifths: {
      notes: [
        { atSec: 0, durSec: 7, note: 43, gain: 0.7 },
        { atSec: 0, durSec: 7, note: 50, gain: 0.6 },
        { atSec: 1.4, durSec: 5.6, note: 57, gain: 0.5 },
        { atSec: 2.8, durSec: 4.2, note: 64, gain: 0.5 },
      ],
    },
    bassline: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 38, gain: 0.8 },
        { atSec: 1.6, durSec: 0.9, note: 45, gain: 0.7 },
        { atSec: 2.6, durSec: 1.1, note: 43, gain: 0.7 },
        { atSec: 3.8, durSec: 1.4, note: 36, gain: 0.8 },
        { atSec: 5.3, durSec: 1.9, note: 38, gain: 0.8 },
      ],
    },
    basswalk: {
      notes: [
        { atSec: 0, durSec: 1.9, note: 33, gain: 0.8 },
        { atSec: 1.9, durSec: 1.4, note: 36, gain: 0.7 },
        { atSec: 3.4, durSec: 1.3, note: 40, gain: 0.7 },
        { atSec: 4.8, durSec: 2.4, note: 38, gain: 0.8 },
      ],
    },
    lowmen: {
      notes: [
        { atSec: 0, durSec: 2.2, note: 38, gain: 0.7 },
        { atSec: 0, durSec: 4.4, note: 45, gain: 0.6 },
        { atSec: 2.2, durSec: 2.2, note: 36, gain: 0.7 },
        { atSec: 2.2, durSec: 2.2, note: 52, gain: 0.5 },
        { atSec: 4.4, durSec: 2.8, note: 33, gain: 0.7 },
        { atSec: 4.4, durSec: 2.8, note: 40, gain: 0.6 },
      ],
    },
    chimes: {
      notes: [
        { atSec: 0, durSec: 0.6, note: 76, gain: 0.7 },
        { atSec: 0.9, durSec: 0.6, note: 81, gain: 0.6 },
        { atSec: 1.8, durSec: 0.6, note: 79, gain: 0.7 },
        { atSec: 2.9, durSec: 0.6, note: 84, gain: 0.5 },
        { atSec: 4.1, durSec: 0.8, note: 72, gain: 0.6 },
        { atSec: 4.1, durSec: 0.8, note: 79, gain: 0.5 },
      ],
    },
    changes: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 84, gain: 0.6 },
        { atSec: 0.6, durSec: 0.5, note: 79, gain: 0.6 },
        { atSec: 1.2, durSec: 0.5, note: 81, gain: 0.6 },
        { atSec: 1.8, durSec: 0.5, note: 76, gain: 0.6 },
        { atSec: 2.4, durSec: 0.5, note: 74, gain: 0.6 },
        { atSec: 3, durSec: 0.5, note: 79, gain: 0.5 },
        { atSec: 3.6, durSec: 0.5, note: 72, gain: 0.6 },
        { atSec: 4.8, durSec: 1.2, note: 67, gain: 0.6 },
        { atSec: 4.8, durSec: 1.2, note: 76, gain: 0.5 },
      ],
    },
    broken: {
      notes: [
        { atSec: 0, durSec: 1.2, note: 57, gain: 0.7 },
        { atSec: 0.5, durSec: 1.2, note: 64, gain: 0.6 },
        { atSec: 1, durSec: 1.2, note: 67, gain: 0.6 },
        { atSec: 1.5, durSec: 1.6, note: 72, gain: 0.7 },
        { atSec: 2.6, durSec: 1.2, note: 53, gain: 0.7 },
        { atSec: 3.1, durSec: 1.2, note: 60, gain: 0.6 },
        { atSec: 3.6, durSec: 1.2, note: 64, gain: 0.6 },
        { atSec: 4.1, durSec: 2, note: 69, gain: 0.7 },
        { atSec: 5, durSec: 1.6, note: 48, gain: 0.6 },
      ],
    },
    struck: {
      notes: [
        { atSec: 0, durSec: 0.3, note: 50, gain: 0.7 },
        { atSec: 0, durSec: 0.3, note: 60, gain: 0.7 },
        { atSec: 0, durSec: 0.3, note: 65, gain: 0.7 },
        { atSec: 1, durSec: 0.3, note: 48, gain: 0.7 },
        { atSec: 1, durSec: 0.3, note: 60, gain: 0.7 },
        { atSec: 1, durSec: 0.3, note: 64, gain: 0.7 },
        { atSec: 2, durSec: 0.3, note: 57, gain: 0.7 },
        { atSec: 2, durSec: 0.3, note: 64, gain: 0.6 },
        { atSec: 2, durSec: 0.3, note: 72, gain: 0.7 },
        { atSec: 3.4, durSec: 1.4, note: 45, gain: 0.7 },
        { atSec: 3.4, durSec: 1.4, note: 60, gain: 0.6 },
        { atSec: 3.4, durSec: 1.4, note: 64, gain: 0.6 },
        { atSec: 3.4, durSec: 1.4, note: 71, gain: 0.6 },
      ],
    },
    turning: {
      notes: [
        { atSec: 0, durSec: 0.35, note: 57, gain: 0.7 },
        { atSec: 0.4, durSec: 0.35, note: 64, gain: 0.6 },
        { atSec: 0.8, durSec: 0.35, note: 69, gain: 0.6 },
        { atSec: 1.2, durSec: 0.35, note: 64, gain: 0.5 },
        { atSec: 1.6, durSec: 0.35, note: 55, gain: 0.7 },
        { atSec: 2, durSec: 0.35, note: 64, gain: 0.6 },
        { atSec: 2.4, durSec: 0.35, note: 71, gain: 0.6 },
        { atSec: 2.8, durSec: 0.35, note: 64, gain: 0.5 },
        { atSec: 3.2, durSec: 0.35, note: 53, gain: 0.7 },
        { atSec: 3.6, durSec: 0.35, note: 60, gain: 0.6 },
        { atSec: 4, durSec: 0.35, note: 69, gain: 0.6 },
        { atSec: 4.4, durSec: 0.35, note: 60, gain: 0.5 },
        { atSec: 4.8, durSec: 1.8, note: 52, gain: 0.7 },
        { atSec: 4.8, durSec: 1.8, note: 67, gain: 0.6 },
      ],
    },
    duet: {
      notes: [
        { atSec: 0, durSec: 2, note: 69, gain: 0.7 },
        { atSec: 0, durSec: 1, note: 65, gain: 0.6 },
        { atSec: 1, durSec: 1, note: 64, gain: 0.6 },
        { atSec: 2, durSec: 1, note: 71, gain: 0.7 },
        { atSec: 2, durSec: 1, note: 62, gain: 0.6 },
        { atSec: 3, durSec: 2, note: 72, gain: 0.7 },
        { atSec: 3, durSec: 1, note: 64, gain: 0.6 },
        { atSec: 4, durSec: 1, note: 57, gain: 0.6 },
        { atSec: 5, durSec: 1, note: 71, gain: 0.7 },
        { atSec: 5, durSec: 1, note: 55, gain: 0.6 },
        { atSec: 6, durSec: 1.2, note: 69, gain: 0.7 },
        { atSec: 6, durSec: 1.2, note: 57, gain: 0.6 },
      ],
    },
    answering: {
      notes: [
        { atSec: 0, durSec: 0.9, note: 72, gain: 0.7 },
        { atSec: 0.9, durSec: 0.7, note: 74, gain: 0.6 },
        { atSec: 1.6, durSec: 1.2, note: 76, gain: 0.7 },
        { atSec: 3.2, durSec: 0.9, note: 60, gain: 0.7 },
        { atSec: 4.1, durSec: 0.7, note: 57, gain: 0.6 },
        { atSec: 4.8, durSec: 2.2, note: 62, gain: 0.7 },
      ],
    },
    single: { notes: [{ atSec: 0, durSec: 6.8, note: 62, gain: 0.7 }] },
    lowsingle: { notes: [{ atSec: 0, durSec: 6.8, note: 40, gain: 0.8 }] },
    aloft: {
      notes: [
        { atSec: 0, durSec: 3.4, note: 74, gain: 0.6 },
        { atSec: 1.2, durSec: 3.4, note: 79, gain: 0.5 },
        { atSec: 2.6, durSec: 3.8, note: 81, gain: 0.5 },
        { atSec: 4.4, durSec: 2.6, note: 76, gain: 0.5 },
      ],
    },
    crowded: {
      notes: [
        { atSec: 0, durSec: 3.4, note: 60, gain: 0.6 },
        { atSec: 0, durSec: 3.4, note: 62, gain: 0.6 },
        { atSec: 0, durSec: 5, note: 64, gain: 0.6 },
        { atSec: 0, durSec: 3.4, note: 67, gain: 0.6 },
        { atSec: 3.3, durSec: 3.8, note: 53, gain: 0.6 },
        { atSec: 3.3, durSec: 3.8, note: 60, gain: 0.6 },
        { atSec: 5, durSec: 2.1, note: 65, gain: 0.6 },
        { atSec: 3.3, durSec: 3.8, note: 69, gain: 0.6 },
      ],
    },
    glacial: {
      notes: [
        { atSec: 0, durSec: 3.6, note: 45, gain: 0.6 },
        { atSec: 0, durSec: 7.2, note: 57, gain: 0.6 },
        { atSec: 0, durSec: 3.8, note: 64, gain: 0.6 },
        { atSec: 0, durSec: 7.2, note: 72, gain: 0.5 },
        { atSec: 3.6, durSec: 3.6, note: 41, gain: 0.6 },
        { atSec: 3.6, durSec: 3.6, note: 65, gain: 0.6 },
      ],
    },
    quartal: {
      notes: [
        { atSec: 0, durSec: 3.6, note: 50, gain: 0.6 },
        { atSec: 0, durSec: 7.2, note: 55, gain: 0.6 },
        { atSec: 0, durSec: 7.2, note: 60, gain: 0.6 },
        { atSec: 0, durSec: 7.2, note: 65, gain: 0.6 },
        { atSec: 3.5, durSec: 3.7, note: 48, gain: 0.6 },
      ],
    },
    inner: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 48, gain: 0.6 },
        { atSec: 0, durSec: 3.4, note: 55, gain: 0.6 },
        { atSec: 0, durSec: 2.2, note: 64, gain: 0.6 },
        { atSec: 0, durSec: 4.8, note: 72, gain: 0.6 },
        { atSec: 2.1, durSec: 2.4, note: 65, gain: 0.6 },
        { atSec: 3.4, durSec: 3.8, note: 57, gain: 0.6 },
        { atSec: 4.4, durSec: 2.8, note: 67, gain: 0.6 },
        { atSec: 4.8, durSec: 2.4, note: 71, gain: 0.6 },
      ],
    },
    lullaby: {
      notes: [
        { atSec: 0, durSec: 7, note: 48, gain: 0.5 },
        { atSec: 0, durSec: 3.4, note: 55, gain: 0.5 },
        { atSec: 0.2, durSec: 0.9, note: 67, gain: 0.7 },
        { atSec: 1.1, durSec: 0.5, note: 64, gain: 0.6 },
        { atSec: 1.6, durSec: 1.1, note: 67, gain: 0.7 },
        { atSec: 2.8, durSec: 0.9, note: 69, gain: 0.7 },
        { atSec: 3.7, durSec: 0.5, note: 67, gain: 0.6 },
        { atSec: 4.2, durSec: 2.8, note: 64, gain: 0.7 },
        { atSec: 3.4, durSec: 3.6, note: 57, gain: 0.5 },
      ],
    },
    murmurs: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 60, gain: 0.6 },
        { atSec: 0, durSec: 0.5, note: 67, gain: 0.6 },
        { atSec: 0.7, durSec: 0.5, note: 60, gain: 0.6 },
        { atSec: 0.7, durSec: 0.5, note: 69, gain: 0.6 },
        { atSec: 1.4, durSec: 0.9, note: 62, gain: 0.6 },
        { atSec: 1.4, durSec: 0.9, note: 65, gain: 0.6 },
        { atSec: 2.8, durSec: 0.5, note: 57, gain: 0.6 },
        { atSec: 2.8, durSec: 0.5, note: 64, gain: 0.6 },
        { atSec: 3.5, durSec: 0.5, note: 57, gain: 0.6 },
        { atSec: 3.5, durSec: 0.5, note: 65, gain: 0.6 },
        { atSec: 4.2, durSec: 2.2, note: 55, gain: 0.6 },
        { atSec: 4.2, durSec: 2.2, note: 59, gain: 0.6 },
        { atSec: 4.2, durSec: 2.2, note: 64, gain: 0.6 },
      ],
    },
    procession: {
      notes: [
        { atSec: 0, durSec: 1.1, note: 62, gain: 0.7 },
        { atSec: 1, durSec: 1.1, note: 64, gain: 0.6 },
        { atSec: 2, durSec: 1.1, note: 65, gain: 0.7 },
        { atSec: 3, durSec: 1.1, note: 67, gain: 0.7 },
        { atSec: 4, durSec: 3, note: 69, gain: 0.7 },
        { atSec: 0, durSec: 3.1, note: 50, gain: 0.6 },
        { atSec: 3, durSec: 4.1, note: 53, gain: 0.6 },
        { atSec: 1.5, durSec: 5.6, note: 57, gain: 0.5 },
      ],
    },
  },
  directions: [
    {
      id: 'surge-hymns',
      name: 'Surge hymns',
      category: 'voice',
      rows: `
Hill above the chapel | Surge hymn | people=36 lag=1.8 reach=5 spread=1 effort=.6 vowel=.2 vowelSpread=.9 leader=0 breath=9 stubborn=.35 wander=.5 | farshore | hymn | A full crowd turns around every note in slow waves, nobody in front
Salt on the doorstep | Surge hymn | people=24 vowel=.12 effort=.3 attack=.9 release=3 reach=2.5 strain=.2 lowShare=.5 air=.4 breath=2 fade=.3 spread=1 vowelSpread=.15 stubborn=.35 wander=.1 volume=1 | darkplate | leaning | Dark breathy mouths turn round their notes, heaviest low down
Book passed along | Surge hymn | people=10 leader=.5 lag=.9 effort=.3 breath=2.2 fade=.3 vowel=.6 spread=.4 stubborn=.05 wander=.1 path=Slide lowShare=.2 volume=-4 | plain | procession | Ten soft voices share a line, short of breath, each sinking as it goes
Out to the boats | Surge hymn | vowel=.78 effort=.8 strain=.7 reach=6 agreement=.4 release=.7 spread=.5 vowelSpread=.75 wander=.6 fade=.35 lowShare=-.2 volume=0.5 | openair | lined | Bright and hard pressed, with wide turns and a quick end
Sixth pew from the back | Surge hymn | people=18 air=.35 effort=.3 vowel=.4 attack=.18 vibrato=.5 leader=.1 vowelSpread=.75 stubborn=.35 volume=1.5 | wall | hymn | A breathy crowd that sways as it turns, sung softly
Precentor and field | Surge hymn | path=Late leader=.6 lag=1.6 reach=3 effort=.5 people=30 vowel=.44 release=2.5 spread=.8 vowelSpread=.6 stubborn=.2 wander=.05 fade=.35 | lateplace | lined | One voice gives the note and a crowd of thirty arrives late and slides home
Slow to be convinced | Surge hymn | path=Late lag=2.4 stubborn=.6 reach=2 attack=1.4 release=4 effort=.3 vowel=.22 spread=.9 vowelSpread=0 wander=.05 fade=0 lowShare=.3 | cathedral | glacial | Dark late voices, a good part of them holding on to the old note | pad
After the bell rope | Surge hymn | path=Late lag=.7 reach=1 attack=.12 effort=.55 vowel=.64 people=16 breath=2.5 fade=.45 spread=.8 vowelSpread=.05 stubborn=.2 wander=0 lowShare=-.3 | chapel | hymn | Open bright voices hold back a moment, then fall away inside each breath
Two pews behind | - | path=Late lag=1.2 people=22 vowelSpread=.8 agreement=.3 effort=.45 air=.2 spread=1 attack=.4 leader=0 stubborn=.05 wander=.05 fade=0 volume=0 | slap | leaning | Late and loose in tune, many vowels at once across a wide row
Coats still wet | - | path=Late lag=.9 people=12 vowel=.1 effort=.22 attack=.6 release=2.8 strain=.1 lowShare=.4 spread=.5 vowelSpread=.2 stubborn=.1 wander=.1 volume=-10 | parlour | lowmen | Twelve dark closed mouths gather low and settle without a fuss
Reeds on the moor | Surge hymn | body=Reed vowel=.3 effort=.35 reach=3 people=20 release=2 spread=1 vowelSpread=.75 stubborn=.05 fade=0 lowShare=.4 | openspace | hymn | Reeds turn together round each note, warm and a little rough | organ
Harbour band at dawn | Surge hymn | body=Reed path=Late vowel=.55 effort=.5 lag=.8 attack=.3 people=14 agreement=.35 vowelSpread=.6 stubborn=.1 wander=.05 fade=.35 volume=0.5 | steps | lined | Bright loosely tuned reeds arrive one after another | wind
Bellows hymn | Reed suspensions | vowel=.2 effort=.35 lag=.9 people=24 spread=.6 lowShare=.6 attack=.9 release=3 leader=0 vowelSpread=.5 stubborn=.45 fade=0 | loft | leaning | Dark late reeds, heavy below, leaning into every change | organ
Toll of the ferryman | Surge hymn | body=Reed path=Turn lowShare=.8 vowel=.05 effort=.2 people=30 lag=.6 release=2.4 spread=.2 vowelSpread=.2 stubborn=0 wander=.1 fade=.35 | firm | bassline | Low dark reeds turn around a bass with an octave under it | bass
Thistles in a row | Surge hymn | body=Reed vowel=.55 effort=.4 lowShare=-.5 people=10 reach=1.5 attack=.1 release=.8 air=.15 spread=.5 vowelSpread=.45 stubborn=.05 wander=.4 fade=.35 | thin | duet | Ten thin reeds turn above their notes, an octave over the top | wind
Closed mouths of frost | Hummed vigil | path=Turn lag=.8 reach=3 effort=.5 people=32 air=.1 vowel=.5 release=2 spread=.9 strain=.2 leader=0 vowelSpread=.6 stubborn=.45 wander=.4 fade=.35 | nave | hymn | A broad hum turning in slow waves around every note
Kitchen hymn | Hummed vigil | path=Turn people=6 lag=.4 reach=2 effort=.6 vowel=.75 attack=.15 release=1 lowShare=0 spread=.5 strain=.15 vowelSpread=.15 stubborn=.2 wander=.1 volume=0.5 | near | lullaby | Six people hum close by and turn lightly onto each note
Beneath wet slates | Hummed vigil | air=.6 effort=.2 lag=1.2 attack=.5 release=4 people=26 vowel=.3 spread=1 strain=0 leader=0 vowelSpread=.15 stubborn=.45 wander=.1 | throughfog | leaning | Late and breathy, more air than tone, with mouths shut | pad
Hearth and shadow | Hummed vigil | path=Turn lowShare=.75 vowel=.15 people=36 effort=.3 attack=.4 reach=5 spread=.35 leader=0 vowelSpread=.15 stubborn=0 wander=.1 | iron | bassline | Most of the hum stands low and turns widely into each step | bass
Wool and candle ends | Hummed vigil | lag=.5 people=14 vowel=.95 effort=.75 air=.05 fade=.6 breath=1.8 release=1.4 attack=.1 spread=.5 stubborn=.45 volume=-0.5 | halo | hymn | A bright hum that sinks in each breath, a little late
Daughters of the mill | Surge hymn | lowShare=-.7 vowel=.5 effort=.4 people=20 reach=3 lag=.7 air=.05 release=2 spread=.9 wander=.4 fade=.25 volume=0 | loft | duet | High voices turn above the chord, some an octave over the top
Larks before mass | Surge hymn | lowShare=-.9 vowel=.7 effort=.55 people=8 attack=.12 lag=.3 vibrato=.6 release=1 spread=.8 vowelSpread=.6 stubborn=.2 wander=.4 fade=.35 volume=2.5 | brightplate | duet | Eight high voices with quick turns and a wide sway
Petticoats on a hedge | - | path=Late lowShare=-.6 vowel=.5 effort=.35 air=.3 people=24 lag=1.4 attack=.7 release=3 spread=1 strain=0 leader=.3 vowelSpread=.2 stubborn=.1 volume=2.5 | mist | aloft | Soft airy voices float late onto the upper notes
Veil over veil | - | path=Late lowShare=-1 vowel=.35 people=30 vibrato=.1 effort=.25 attack=1 release=5 reach=4 strain=.05 leader=0 stubborn=.35 | choirup | glacial | Dim voices gather at the top of the chord and the octave over it | pad
Girls on the sea wall | Surge hymn | path=Turn lowShare=-.4 vowel=.7 effort=.45 strain=.6 people=12 reach=7 lag=.9 spread=.3 vowelSpread=.15 stubborn=.05 wander=.1 fade=.35 volume=1 | doubled | procession | Twelve bright voices swing far around each note under strain
Miners coming up | Surge hymn | lowShare=.95 vowel=.15 effort=.75 people=34 reach=3 lag=.6 release=1.6 vowelSpread=.75 stubborn=.1 wander=.4 fade=.35 volume=-6.5 | tube | lowmen | Deep dark men, loud, turn together onto every change
Eleven fathoms | Bass floor | path=Late lag=1.5 reach=4 vowel=.25 effort=.4 people=28 attack=.7 release=3.5 strain=.2 leader=.3 stubborn=.25 wander=.4 volume=-1 | lowspace | lowmen | Low voices come late and slide in from well off the note
Tar and tallow | Bass floor | path=Turn lag=.4 reach=2 vowel=.3 effort=.6 people=12 attack=.06 release=.6 strain=.45 spread=.4 leader=0 stubborn=.05 wander=0 volume=-9 | combo | bassline | Twelve rough basses turn hard onto the note | bass
Keel song | Bass floor | path=Turn body=Hollow vowel=.4 effort=.5 people=20 reach=3 attack=.2 release=1.5 lowShare=.6 spread=.3 leader=.45 stubborn=.05 wander=0 | pipe | bassline | Hollow low voices curl around each step of the line | bass
Men as ballast | Bass floor | path=Late lag=.3 air=.35 vowel=.05 effort=.2 people=36 attack=.1 release=1.1 breath=1.5 fade=.5 spread=.4 strain=0 leader=0 stubborn=0 wander=0 | muffled | basswalk | Dark breathy basses sink in each breath and start again | bass
Front room psalm | Surge hymn | people=4 lag=.35 reach=2 leader=.3 effort=.4 vowel=.42 attack=.12 release=.8 spread=.35 stubborn=.1 wander=0 fade=.35 | booth | duet | Four people close by, each with a turn of their own
Two sisters and a lamp | Surge hymn | people=2 path=Late lag=.4 reach=1 vowel=.75 effort=.35 attack=.15 release=1.2 vibrato=.4 spread=.15 vowelSpread=.2 stubborn=.1 wander=.1 fade=.25 lowShare=-.3 volume=1.5 | warmecho | duet | Two bright voices only, one a little after the other
Around one book | - | people=6 path=Turn lag=.6 reach=4 vowel=.25 effort=.55 air=.05 attack=.08 release=.5 strain=.8 spread=.5 leader=0 vowelSpread=.3 stubborn=.1 wander=.1 fade=.25 lowShare=.25 volume=-2 | spring | procession | Six tense dark voices turn widely and relax on arrival
Hymn from downstairs | - | people=8 path=Late lag=1 body=Hum vowel=.6 effort=.5 attack=.3 release=1.5 spread=.2 leader=0 vowelSpread=.6 wander=.05 volume=0.5 | pillow | lullaby | Eight people hum late, all from nearly one spot
Cradle psalm | Surge hymn | people=5 body=Hollow path=Late lag=.5 effort=.3 attack=.3 release=2.5 vowel=.6 air=.2 reach=1 wander=.4 fade=.35 volume=1.5 | answer | lullaby | Five soft hollow pipes settle late onto each note | wind
Gale at the window | Surge hymn | agreement=.15 effort=.85 strain=.9 vowel=.65 people=30 reach=8 lag=1 release=1.2 spread=.9 vowelSpread=.7 stubborn=.05 wander=.4 fade=.1 volume=2 | hallend | crowded | Strained and far apart in tune, throwing wide turns at the chord
Shouting distance | Surge hymn | path=Late agreement=.2 effort=.9 vowel=.7 people=20 attack=.06 lag=.6 breath=1.2 fade=.5 release=.6 vowelSpread=.2 stubborn=.1 wander=.4 | slapback | lined | Hard calling voices, late, falling away within a second
Oars and answer | Surge hymn | effort=.65 vowel=.4 breath=.8 fade=.7 people=26 attack=.04 lag=.25 release=1 reach=2 spread=1 vowelSpread=.2 stubborn=0 wander=.4 strain=.35 volume=3.5 | stairwell | struck | Short strong breaths that land with a turn and drop off
Storm lantern bows | Surge hymn | body=Strings effort=.7 strain=.8 agreement=.25 reach=5 people=6 vowel=.85 release=1 spread=.8 vowelSpread=.5 fade=.55 lowShare=-.3 breath=2 volume=1 | heads | hymn | Six rough bright bows turn far out of tune and sink in every breath | string
Tin roof, whistled | Surge hymn | body=Whistle effort=.6 reach=4 people=16 air=.2 agreement=.4 lag=.9 release=2 spread=.5 vowelSpread=.5 fade=.35 | tank | hymn | Whistlers turn round each note in loose waves | wind
Beads in the hand | Murmured prayers | path=Turn reach=2 breath=.6 people=30 air=.25 effort=.4 vowel=.5 spread=.8 strain=.45 stubborn=.05 wander=.05 | chamber | murmurs | Murmured turning syllables, more than one to a second
Whisper down the nave | Whispered night | path=Turn breath=3 reach=3 people=36 effort=.45 vowel=.6 attack=.5 strain=.1 leader=0 lowShare=.3 volume=0.5 | whisperhall | hymn | Nearly all breath, shaped in many vowels and turning as it goes | texture
Ashes and lips | Murmured prayers | path=Late lag=.9 breath=1.1 fade=.6 effort=.2 vowel=.2 people=20 air=.5 strain=.05 leader=0 stubborn=.05 wander=.4 lowShare=-.3 volume=-0.5 | shaded | murmurs | Dim airy syllables that come late and sink | texture
Crowd in the porch | Murmured prayers | breath=.22 vowelSpread=1 effort=.6 people=36 air=.15 reach=0 agreement=.4 spread=1 strain=.55 leader=0 stubborn=.05 wander=.6 lowShare=-.25 | room | murmurs | Very short strong syllables from everyone at once | texture
Vespers in snow | Murmured prayers | body=Hum path=Turn breath=1.6 air=.45 effort=.35 attack=.15 people=24 release=4 spread=.8 strain=.05 leader=.2 stubborn=.35 | frost | hymn | Hummed syllables that turn softly, half of them air
Pipes for the drowned | Surge hymn | body=Hollow vowel=.5 effort=.5 people=24 reach=4 lag=.9 release=4 attack=.7 spread=1 vowelSpread=.75 stubborn=.25 wander=.4 fade=.35 | surf | hymn | Hollow pipes curl around every note in slow waves | wind
Cloister of wood | Surge hymn | body=Hollow path=Late lag=1.2 vowel=.15 effort=.3 people=14 agreement=.9 vibrato=0 attack=.5 release=3 vowelSpread=0 stubborn=.1 wander=0 fade=0 lowShare=.25 | wood | leaning | Dark hollow tones arrive late and lock onto pure intervals | wind
Strings lined out | Surge hymn | body=Strings path=Late lag=.8 leader=.5 vowel=.7 effort=.6 people=8 reach=3 release=.3 attack=.06 air=.25 spread=.3 vowelSpread=.45 wander=.05 fade=.25 | combo | lined | One bright bow leads and a few slide in late behind it | string
Ninety candles low | Surge hymn | body=Open agreement=.95 vibrato=0 vowelSpread=.05 vowel=.32 effort=.4 reach=1 people=30 attack=1 release=5 spread=.8 stubborn=.2 wander=.05 fade=0 | held | leaning | One vowel from everybody, turning little and locked in tune
Morning at the weir | Surge hymn | body=Whistle path=Late lag=1.3 reach=2 people=8 air=.4 effort=.3 attack=.4 release=3 lowShare=-.3 spread=1 stubborn=.1 volume=2 | water | aloft | Eight whistlers drift late onto high notes with breath at the lips | wind
`,
    },
    {
      id: 'perfect-pools',
      name: 'Perfect pools',
      category: 'pad',
      rows: `
Rain tank at noon | Perfect pool | vowel=.5 effort=.6 attack=.5 release=4 people=24 spread=.8 strain=.05 leader=.2 | lowspace | quartal | Open hollow pipes locked on pure intervals | organ
Organ without a case | Perfect pool | attack=.08 release=.6 effort=.7 vowel=.8 lowShare=.3 breath=12 spread=.8 strain=.4 leader=.25 | chamber | hymn | Bright hollow pipes that speak at once and stop with the hand | organ
Swimming bath, winter | Perfect pool | vowel=.2 effort=.2 attack=2.4 release=10 air=.2 spread=1 strain=.1 leader=.3 lowShare=.3 | endless | glacial | Dark hollow tones, two seconds in rising and long in leaving
Fourteen green tiles | Perfect pool | people=14 reach=.5 fade=.4 breath=3 vowel=.65 effort=.5 attack=.3 spread=.8 strain=.1 leader=0 | tank | inner | Pure hollow notes that ebb a little in every breath | organ
Pipes asleep | Perfect pool | effort=.05 air=.5 vowel=.4 attack=1 people=10 lowShare=.5 spread=.3 strain=.15 leader=.3 | wool | fifths | The softest of hollow tones, as much breath as pitch | organ
One vowel for all | - | agreement=1 vibrato=0 vowelSpread=0 vowel=.3 people=30 attack=.9 release=3.5 effort=.35 strain=.05 leader=0 stubborn=.05 wander=.1 fade=0 lowShare=.3 | cathedral | hymn | Everybody sings one dark vowel, locked into pure tuning
Noon without shadow | - | agreement=1 vibrato=0 vowelSpread=0 vowel=.7 people=36 attack=.5 effort=.6 release=2 lowShare=-.3 spread=.9 strain=.45 leader=0 wander=.05 fade=0 | longplate | inner | One bright open vowel in pure tune, light on the bass
Beatless | - | agreement=1 vibrato=.1 vowel=.5 effort=.15 air=.35 attack=1.8 release=6 reach=0 people=20 spread=.4 strain=.05 leader=0 vowelSpread=.1 stubborn=.1 wander=.1 fade=0 | hang | quartal | A breathy close crowd with no beating left between its notes
Stone counts to four | - | agreement=.95 path=Steps lag=.5 vowel=.45 effort=.5 people=16 attack=.06 release=1.2 stubborn=0 strain=.1 leader=.2 vowelSpread=.1 wander=0 fade=0 volume=-1.5 | stairwell | hymn | Pure chords reached in spoken steps and no slides
The level of the lake | - | agreement=1 vowel=.15 lowShare=.6 effort=.3 people=36 attack=1.4 release=5 vowelSpread=.1 spread=.9 strain=.15 leader=0 stubborn=.2 wander=0 fade=0 | darkhall | fifths | Dark low voices in pure fifths with an octave under them
Pump organ in tune | - | body=Reed agreement=1 vibrato=0 vowel=.55 effort=.3 people=6 attack=.2 release=.8 strain=.1 spread=.3 leader=.25 vowelSpread=.05 stubborn=.2 wander=.1 fade=0 | clay | hymn | Reeds locked in pure tuning, steady and plain | organ
Reeds in clear water | - | body=Reed agreement=.95 vibrato=0 vowel=.7 effort=.5 people=10 attack=.6 release=3 spread=.5 leader=.2 vowelSpread=.1 wander=.1 fade=0 | brightplate | inner | Reeds on pure intervals that ring like one instrument | organ
Amber held to light | - | body=Reed agreement=1 vowel=.6 effort=.35 people=10 attack=1 release=6 breath=12 air=.1 spread=.9 strain=0 leader=0 vowelSpread=.2 stubborn=.35 wander=.4 lowShare=-.35 | shining | glacial | Ten soft reeds with the octave over them and nothing rubbing | pad
Ploughman and treadle | - | body=Reed agreement=.9 lowShare=.8 vowel=.2 effort=.35 people=30 attack=.3 release=1.5 spread=1 leader=0 vowelSpread=0 stubborn=.1 wander=.05 fade=0 | pedal | fifths | Low reeds in tune with each other | drone
Bellows at half past six | - | body=Reed agreement=1 breath=1.6 fade=.5 vowel=.5 effort=.4 people=8 attack=.1 release=1 spread=.5 strain=.15 leader=0 vowelSpread=.1 stubborn=.2 wander=.05 volume=0 | ebb | quartal | Eight pure reeds that sink and refill with every breath | organ
Glasses on a tray | Perfect pool | body=Whistle attack=.3 release=4 air=.05 effort=.4 people=12 lowShare=-.3 spread=.4 strain=.15 volume=1 | glasstube | aloft | Whistled tones in pure tune, as clean as rims
Cold rim of morning | Perfect pool | body=Whistle attack=1.8 release=8 air=.3 vowel=.2 effort=.2 people=20 spread=.8 strain=.1 leader=0 | thinair | aloft | Slow whistled tones under breath, in pure fifths and thirds
Dropped into the well | Perfect pool | body=Whistle path=Leap attack=.02 fade=.9 breath=2 release=5 people=8 vowel=.6 strain=.1 leader=.3 volume=0.5 | darkplate | chimes | Whistled notes land pure and die away in one breath | bell
Icicle row | Perfect pool | body=Whistle lowShare=-.9 attack=.1 fade=.6 breath=4 release=6 effort=.6 people=10 spread=.5 strain=.65 leader=.2 volume=-1.5 | bowls | chimes | High clear whistles with an octave over the top, sinking slowly | bell
Lamp glass humming | Perfect pool | body=Whistle attack=.8 people=4 air=0 effort=.3 vibrato=0 breath=12 spread=.4 release=2.5 strain=.05 leader=0 | sines | quartal | Four whistlers with no breath in the tone at all
Eight bows, one line | - | body=Strings agreement=1 vibrato=0 people=8 vowel=.4 effort=.4 attack=.5 release=2 reach=0 spread=.3 strain=.15 leader=.2 vowelSpread=.05 stubborn=.2 wander=0 fade=0 | wood | hymn | Eight straight bows locked into pure thirds and fifths | string
Gut and rosin, still air | - | body=Strings agreement=.95 vibrato=0 vowel=.75 effort=.6 people=16 attack=.2 release=1 air=.3 spread=.5 leader=.25 vowelSpread=.05 wander=0 fade=0 lowShare=-.3 volume=-1.5 | near | inner | Bright grainy bows without sway, in pure tune | string
Viols after curfew | - | body=Strings agreement=1 vibrato=.05 vowel=.2 effort=.2 people=20 attack=1.2 release=4 lowShare=.3 spread=.8 strain=.15 leader=.3 vowelSpread=.1 wander=0 fade=0 | darkend | leaning | Dark quiet bows that settle beatless over the lowest note | string
Strings under glass | - | body=Strings agreement=1 vibrato=0 lowShare=-.6 effort=.25 vowel=.5 attack=1.6 release=6 people=24 spread=1 strain=0 leader=0 vowelSpread=0 stubborn=.05 wander=0 fade=0 volume=-1 | halo | aloft | High soft bows, pure and blurred at the edges | pad
Bass bar and floor | - | body=Strings agreement=1 lowShare=.9 vibrato=0 vowel=.1 effort=.35 attack=.4 people=30 release=2 spread=.9 strain=.1 leader=0 vowelSpread=.1 stubborn=.1 wander=0 fade=0 volume=-12.5 | firm | fifths | Low bows locked into pure fifths with the octave underneath | drone
Hum of the plumb line | Hummed vigil | path=Slide agreement=1 vibrato=0 vowel=.5 effort=.5 attack=.6 people=24 lowShare=0 spread=.9 strain=.15 leader=0 vowelSpread=.05 stubborn=.2 wander=.1 fade=0 | openspace | hymn | A plain hum pulled straight onto pure intervals
Snow on slate | Hummed vigil | path=Slide agreement=1 vibrato=0 air=.5 effort=.15 attack=2 release=7 people=30 vowel=.2 strain=.15 leader=0 vowelSpread=.1 stubborn=.1 wander=0 fade=0 | mist | glacial | The faintest hum, half air, with every interval pure
Wick and honeycomb | Hummed vigil | path=Leap agreement=1 vibrato=0 attack=.05 fade=.7 breath=2.5 effort=.6 vowel=.8 people=12 release=3 lag=.04 spread=.3 strain=.15 leader=.3 vowelSpread=.1 stubborn=.05 wander=.05 | parlour | broken | Hummed notes land at once in tune and sink warmly | keys
Under one roof beam | Hummed vigil | path=Slide agreement=1 lowShare=.9 effort=.4 vowel=.1 attack=.5 people=36 air=.05 release=3 spread=.8 strain=0 leader=0 vowelSpread=.1 wander=.1 fade=0 volume=-13 | warmed | fifths | A low hum as still as timber with its octave below | drone
Lids of the eyes | Hummed vigil | path=Slide agreement=.95 lowShare=-.7 vowel=.7 effort=.35 people=14 attack=.9 release=4 air=.15 spread=.5 strain=0 leader=.25 vowelSpread=.1 stubborn=.05 wander=.1 fade=0 | muffledup | aloft | A high closed hum, pure in tune, some of it an octave up
Stone in the arch | Bass floor | agreement=1 vibrato=0 vowel=.35 effort=.5 attack=.12 release=1 people=20 spread=.2 strain=.5 leader=0 stubborn=0 wander=.05 fade=0 | gated | bassline | Firm low voices in exact tune, over with the hand | bass
Underpass at four | Bass floor | body=Hollow agreement=1 vibrato=0 vowel=.3 effort=.6 attack=.2 release=2.5 people=14 spread=.4 leader=.45 stubborn=0 wander=0 fade=0 | shaft | basswalk | Hollow low tones with no beating in their octaves | bass
Deep end | Bass floor | body=Hollow agreement=1 vowel=0 effort=.15 air=.55 attack=1 release=6 people=24 spread=.9 strain=0 leader=0 wander=.1 fade=0 | submerged | lowsingle | Dark round hollow tones far down, with as much breath as pitch | drone
Iron lid | Bass floor | body=Reed agreement=1 vibrato=0 vowel=0 effort=.15 attack=.3 people=16 release=2 strain=0 spread=.4 leader=.25 stubborn=.2 wander=.05 fade=0 | tube | lowmen | Dark reeds at the bottom, pure and unmoving | drone
Anchor in clear sand | Bass floor | body=Hum agreement=1 vowel=.6 effort=.7 attack=.08 fade=.5 breath=3 people=10 release=1.5 spread=.2 strain=.65 leader=.3 stubborn=0 wander=.1 | plain | basswalk | A strong low hum that speaks quickly and thins as it lasts | bass
Porcelain keys | Perfect pool | body=Hollow path=Leap attack=.01 fade=.8 breath=1.6 vowel=.7 effort=.6 people=10 release=3 spread=.5 strain=.1 leader=.2 | stub | broken | Pure hollow notes that land at once and die in a breath | keys
Milk glass | Perfect pool | body=Open path=Leap attack=.03 fade=.7 breath=2.2 vowel=.25 effort=.4 people=14 release=4 strain=.05 lowShare=.25 | reflected | broken | Dark sung keys in pure tune, falling away softly | keys
Two pans of a scale | Perfect pool | body=Reed path=Leap attack=.01 fade=.6 breath=1.2 vowel=.4 effort=.3 people=6 release=1.2 spread=.4 strain=.15 | spring | struck | Short pure reeds that land together and shrink | keys
Coins on a cloth | Perfect pool | body=Strings path=Leap attack=.01 fade=1 breath=.7 effort=.5 people=12 release=2 vowel=.5 spread=.8 leader=.3 volume=-1 | dotted | turning | Plucked bows in exact tune, each gone within a second | plucked
Sounding slate | Perfect pool | body=Open path=Leap attack=.01 fade=1 breath=.4 vowel=.85 effort=.7 people=8 release=1 air=.2 strain=.2 leader=.3 lowShare=-.2 volume=-3.5 | pattering | struck | Very short bright syllables tuned pure, like taps on slate | plucked
Tide held by a wall | Perfect pool | breath=2.4 fade=.5 attack=.9 vowel=.6 people=12 effort=.4 lowShare=.3 spread=.9 leader=.2 | water | quartal | Hollow tones that rise and ebb one person at a time
Locks filling | Perfect pool | attack=3.5 release=3 vowel=.5 effort=.5 people=26 wander=.8 strain=.05 leader=0 | swell | glacial | Pure pipes that take three seconds to fill, with people moving about in octaves
Mirror pool at dusk | Perfect pool | vowel=.75 effort=.35 attack=.7 release=5 spread=1 wander=.6 people=20 strain=.1 leader=0 lowShare=-.2 | mirror | quartal | Bright pipes in tune while some wander to the octave and back
Rings from one oar | Perfect pool | body=Open vowel=.55 effort=.4 attack=.5 release=2 people=16 strain=.05 leader=.3 | stars | single | Open voices meet on one pure note without a beat
Water table | Perfect pool | body=Hum vowel=.4 effort=.5 attack=.9 release=4 lowShare=.5 people=26 spread=.8 strain=.05 leader=0 | orbits | inner | A hum in pure tune, gathered low and held level
Two at the font | Perfect pool | people=2 attack=.25 release=2 vowel=.5 effort=.5 spread=.5 strain=0 leader=.3 | chapel | duet | Two hollow tones in pure intervals and nothing else | wind
Three kept awake | Perfect pool | body=Open people=3 attack=.2 release=1.4 vowel=.45 effort=.4 breath=6 spread=.4 strain=.1 leader=.2 | plain | duet | Three straight voices, pure and bare | voice
Bare fifth, bare wall | Perfect pool | body=Reed people=2 attack=.3 vowel=.15 effort=.2 release=1.5 strain=0 spread=.25 leader=.2 lowShare=.4 | slap | fifths | Two dark reeds and the space between them | organ
String and shadow | Perfect pool | body=Strings people=4 attack=.4 vowel=.3 effort=.35 release=2.5 air=.15 spread=.15 strain=.1 leader=.2 | darkbox | leaning | Four straight bows, so close in tune they pass for one | string
Nobody behind the note | Perfect pool | body=Hum people=2 attack=.15 vowel=.9 effort=.8 release=1 breath=8 spread=0 air=0 strain=.45 leader=.25 | centre | lullaby | Two bright hums from one spot with no breath in them | voice
`,
    },
    {
      id: 'hummed-vigils',
      name: 'Hummed vigils',
      category: 'pad',
      rows: `
Wake at the crossroads | Hummed vigil | people=36 effort=.65 lag=1.5 reach=3 release=4 vowel=.75 vowelSpread=.8 spread=1 strain=.45 leader=0 wander=.5 | coils | leaning | A wide late hum of many mouths that leans slowly into each change
Candle count | Hummed vigil | people=12 attack=.4 fade=.5 breath=3 vowel=.65 effort=.55 strain=0 wander=.4 volume=-1 | darkplate | hymn | Twelve hum late and fade a little in the course of each breath
Coats over knees | Hummed vigil | people=20 vowel=.2 effort=.2 attack=1.5 release=5 vibrato=.1 wander=.1 strain=.1 leader=0 vowelSpread=.05 stubborn=.2 fade=0 | wool | glacial | A thick dark hum that rises slowly and barely moves
Third bell of the night | Hummed vigil | lag=2.6 stubborn=.7 agreement=.4 people=24 attack=.4 effort=.4 leader=0 vowelSpread=.1 wander=0 fade=0 volume=-0.5 | hallend | leaning | A late hum in which many stay on the old chord
Beds in a row | Hummed vigil | people=16 lag=.6 attack=.5 spread=1 vowel=.5 effort=.35 release=2 strain=.15 leader=.2 vowelSpread=.15 stubborn=.1 wander=.1 | broad | inner | A close even hum stretched from wall to wall
Nurse's lamp | Hummed vigil | people=4 path=Slide lag=.3 attack=.2 vowel=.7 effort=.5 lowShare=0 release=1 reach=1 spread=.3 strain=.15 leader=.3 vowelSpread=.2 wander=0 fade=.35 volume=-2 | near | lullaby | Four hum close together and slide lightly between notes | voice
Humming to the stove | Hummed vigil | people=2 path=Late lag=.35 attack=.12 vowel=.15 effort=.3 release=.6 spread=.2 air=.08 lowShare=.5 strain=0 leader=.3 stubborn=.2 wander=0 fade=.25 | plain | lullaby | Two people hum a low line, a little late, as if nobody heard | voice
Gran on the landing | Hummed vigil | people=3 path=Turn lag=.35 reach=1.5 vowel=.35 effort=.4 vibrato=.8 attack=.15 release=1 lowShare=0 spread=.3 strain=.2 leader=0 vowelSpread=.3 stubborn=.2 wander=.1 fade=.25 volume=-1.5 | wireless | lullaby | Three old voices hum with turns and a wide wobble | voice
Pillow talk | Hummed vigil | people=6 air=.9 effort=.2 attack=.3 vowel=.5 release=1.5 spread=.4 lowShare=.2 strain=.1 leader=.3 vowelSpread=.2 stubborn=.1 volume=0.5 | near | lullaby | Six hum so softly that it is mostly breath | voice
Through the wicker | Hummed vigil | people=5 path=Steps lag=.4 vowel=.85 effort=.65 attack=.06 release=.8 lowShare=-.2 strain=.2 leader=.2 vowelSpread=.15 stubborn=.2 | mouth | procession | Five bright hums that walk in small spoken steps | voice
Cave of sleepers | Hummed vigil | lowShare=.9 vowel=.1 effort=.3 people=36 lag=1 release=4 strain=.2 leader=0 vowelSpread=.6 stubborn=.1 wander=.4 fade=0 attack=.3 volume=-11 | lowspace | fifths | The whole hum lies at the bottom with an octave under it | drone
Monks of peat | Hummed vigil | lowShare=.8 vowel=.5 effort=.65 people=20 path=Slide attack=.3 release=1.5 strain=.5 leader=0 wander=.1 fade=0 volume=-10 | monks | lowmen | Strong low hums slide heavily from chord to chord | drone
Cellar door, humming | Hummed vigil | lowShare=.7 vowel=.3 effort=.4 attack=.15 release=.9 people=14 path=Leap lag=.05 spread=.2 strain=.2 leader=0 vowelSpread=.45 stubborn=0 wander=.1 | cellar | bassline | Low hums that land on the note at once | bass
Boiler house | Hummed vigil | lowShare=1 vowel=0 effort=.55 people=26 air=.3 path=Steps lag=.3 attack=.1 release=1 spread=.2 strain=0 leader=.3 stubborn=.05 wander=.1 | iron | bassline | Dark hums step down to the bass with breath in the beat | bass
Ox breath | Hummed vigil | lowShare=.6 air=.75 vowel=.2 effort=.35 people=18 breath=1.4 fade=.6 attack=.2 release=1.4 spread=.4 strain=.1 leader=0 vowelSpread=.6 stubborn=0 wander=.1 volume=-11.5 | firm | basswalk | Low humming breath, pushed and let go every second or two | bass
Attic of doves | Hummed vigil | lowShare=-.8 vowel=.6 effort=.4 people=14 vibrato=.6 lag=.8 release=2 spread=.8 strain=.45 leader=.3 vowelSpread=.2 stubborn=.1 wander=.1 volume=4 | airy | aloft | A high hum an octave over the chord, quivering
Moth at the pane | Hummed vigil | lowShare=-.6 vowel=.9 effort=.5 breath=.5 fade=.3 people=10 attack=.05 release=1.2 path=Slide spread=.5 strain=.5 leader=.2 wander=.1 volume=3.5 | glasstube | aloft | High bright hums broken into flutters of half a second | texture
Choirboys asleep | Hummed vigil | lowShare=-.4 vowel=.45 effort=.25 people=24 attack=1.2 release=5 air=.3 strain=.1 leader=0 stubborn=.45 wander=.1 | muffledup | quartal | A pale upper hum that arrives long after the hand
Upper room | Hummed vigil | lowShare=-1 path=Slide lag=.5 vowel=.75 effort=.55 people=8 attack=.3 release=2 spread=.3 strain=.15 leader=.2 vowelSpread=.2 stubborn=.05 wander=.1 volume=0 | stub | aloft | Eight hum at the top and the octave over it, close by
Dew along the fence | Hummed vigil | lowShare=-.5 vowel=1 effort=.7 air=0 path=Leap attack=.02 fade=.8 breath=1.5 people=8 release=3 lag=.05 spread=.4 strain=.75 leader=0 stubborn=0 wander=.1 volume=-1.5 | points | chimes | Bright hummed points that land and shrink | bell
Murmur at the gate | Hummed vigil | breath=.4 path=Steps lag=.3 people=30 effort=.45 vowel=.5 attack=.04 strain=.45 leader=0 vowelSpread=.5 stubborn=.2 wander=.05 fade=.35 volume=-1.5 | chamber | murmurs | Hummed syllables, two a second, from thirty people | texture
Litany in the rain | Hummed vigil | breath=.7 fade=.4 path=Slide people=24 effort=.5 vowel=.35 attack=.08 air=.3 spread=.9 strain=.45 leader=0 vowelSpread=.2 volume=-2 | rain | murmurs | Short murmured hums over and over, never together | texture
Bees in the lime | Hummed vigil | breath=.2 fade=0 path=Slide people=36 vowel=.8 effort=.6 attack=.02 lowShare=-.2 spread=1 wander=.6 strain=.5 leader=0 vowelSpread=.2 stubborn=.45 | ripples | quartal | A seething hum cut into the shortest breaths | texture
Beads clicked in dark | Hummed vigil | breath=.3 fade=.8 path=Leap people=12 effort=.5 vowel=.6 attack=.01 lowShare=.2 lag=.1 spread=.8 strain=.2 leader=.2 vowelSpread=.15 stubborn=.05 wander=.4 volume=0.5 | memory | murmurs | Clipped hums that fall off at once and come again | texture
Counting sheep | Hummed vigil | breath=1 fade=.9 people=8 effort=.4 vowel=.4 attack=.1 path=Slide lag=.4 release=1.5 spread=.5 strain=.05 leader=.25 vowelSpread=.45 stubborn=.05 wander=.4 volume=-1.5 | pebble | lullaby | Eight soft hums, each a sigh that ends in a second | voice
Fog signal choir | Hummed vigil | effort=.8 vowel=.6 strain=.7 people=20 lag=.8 reach=5 attack=.5 leader=0 vowelSpread=.15 stubborn=.45 fade=0 | throughfog | lowmen | Hard pressed hums that slide in late from well off the note | drone
Pressed to the window | Hummed vigil | effort=.9 vowel=.9 strain=.5 people=10 path=Slide lag=.3 attack=.08 release=.8 air=0 lowShare=0 leader=.35 vowelSpread=.15 stubborn=0 | scooped | hymn | Tight bright hums with no air in them | voice
Copper kettles | Hummed vigil | effort=.7 vowel=.7 path=Turn reach=2 lag=.5 people=16 attack=.2 release=2 lowShare=0 spread=.5 strain=.55 leader=.25 vowelSpread=.45 stubborn=.35 | tank | hymn | Edged hums that turn round each note
Ploughed furrow | Hummed vigil | effort=.6 vowel=.25 strain=.8 agreement=.25 people=26 attack=.4 release=1.5 spread=1 leader=0 vowelSpread=.5 wander=.25 fade=0 volume=-1.5 | combo | leaning | A rough hum far apart in tune, tense while it moves
Two hillsides humming | Hummed vigil | effort=.75 lowShare=-.25 vowel=.8 vibrato=.7 people=30 path=Slide lag=1.2 release=3 breath=2.5 fade=.4 strain=.45 leader=0 vowelSpread=.75 stubborn=.45 | valley | hymn | Broad strong hums that slide, sway widely and sink in every breath | voice
Stockinged feet | Hummed vigil | path=Leap lag=.04 attack=.04 fade=.6 breath=1.8 effort=.35 vowel=.5 people=12 release=1.6 lowShare=.1 strain=0 leader=.3 vowelSpread=.15 stubborn=0 wander=.1 | feltair | broken | Soft hummed keys that land at once and sink | keys
Nightlight piano | Hummed vigil | path=Leap lag=.02 attack=.02 fade=.9 breath=1.2 effort=.6 vowel=.75 people=6 release=2.5 lowShare=0 spread=.5 strain=.5 leader=.2 stubborn=0 wander=.1 | cassette | broken | Bright hummed keys, struck and fading | keys
Wooden spoons | Hummed vigil | path=Leap lag=.02 attack=.01 fade=1 breath=.45 effort=.55 vowel=.3 people=16 release=.6 lowShare=.2 strain=0 leader=.2 vowelSpread=.45 stubborn=0 wander=.1 | wood | turning | Dark hummed knocks, gone in half a second | plucked
Closed lid | Hummed vigil | path=Leap lag=.05 attack=.08 fade=.3 breath=4 effort=.3 vowel=.15 people=20 release=2.2 spread=.4 strain=.05 leader=.2 vowelSpread=0 stubborn=.05 wander=0 | gatefilter | broken | Round dark keys that hold nearly full | keys
Lullaby machine | Hummed vigil | path=Leap lag=.02 attack=.01 fade=.85 breath=.9 effort=.5 vowel=.95 people=4 release=1.2 lowShare=-.4 spread=.3 leader=.3 vowelSpread=.45 stubborn=0 wander=0 | record | turning | Four small bright hums in step, an octave up in part | keys
Ship at anchor | Hummed vigil | vibrato=.9 agreement=.5 people=8 lag=1.2 effort=.45 vowel=.1 leader=0 vowelSpread=.1 stubborn=.25 lowShare=.8 breath=5 fade=.45 | seasick | glacial | A dark low hum that rolls widely about its notes
Embers talk | Hummed vigil | people=10 wander=.9 lag=.8 effort=.4 vowel=.6 attack=.5 release=3 strain=.45 leader=.25 | embers | quartal | A hum in which somebody is always off to another note
Breath of the byre | Hummed vigil | air=.45 effort=.3 people=26 vowel=.3 lowShare=.5 attack=.7 release=3 spread=1 strain=0 leader=0 stubborn=.45 volume=-0.5 | ebb | hymn | A warm airy hum, most of it low
Sand for an egg | Hummed vigil | people=18 lag=1.8 effort=.5 vowel=.55 fade=.7 breath=5 attack=.6 path=Slide spread=.4 strain=.2 leader=.2 vowelSpread=.45 wander=.4 volume=-6.5 | reversed | leaning | Each person starts full and sinks over five seconds
Blue hour on the ward | Hummed vigil | people=24 vowelSpread=.9 effort=.4 lag=1 wander=.4 attack=.6 release=3 spread=.8 leader=0 | swirl | quartal | A hum of many mouth shapes, each moving by itself
Sleep in the hayloft | Hummed vigil | attack=3 release=10 effort=.3 people=36 vowel=.35 air=.25 wander=.4 path=Slide strain=0 leader=0 stubborn=.25 | dissolve | glacial | Three seconds to rise and far longer to go, warm with breath in it
Drift against the door | Hummed vigil | attack=1 release=6 vowel=.1 effort=.12 people=16 spread=.3 air=.1 strain=.1 leader=.2 | muffled | fifths | A very dark hum, near and small
Long night watch | Hummed vigil | attack=1.2 release=12 vowel=.5 effort=.45 breath=12 fade=0 people=28 path=Slide lag=2 spread=.9 leader=0 vowelSpread=0 stubborn=.05 wander=0 volume=-11 | darkend | glacial | A seamless hum that takes two seconds and more to walk
Tallow light | Hummed vigil | attack=.8 release=3 vowel=.75 effort=.3 people=8 reach=0 agreement=.8 strain=0 leader=.3 vowelSpread=.1 wander=0 fade=0 lowShare=-.5 | wax | inner | Eight people hum straight onto their notes, octave and all, and stay
Grief at a distance | Hummed vigil | attack=.2 release=4 reach=8 lag=2 effort=.4 people=14 vowel=.6 strain=.6 spread=.9 leader=.2 vowelSpread=.45 stubborn=.45 | lost | leaning | A hum that starts far off the note and is long in coming
Psalm in a barrel | Hummed vigil | effort=.5 vowel=.5 people=20 agreement=.7 attack=.3 release=1.5 lowShare=.2 strain=.05 leader=0 vowelSpread=.2 stubborn=.25 | clay | hymn | A middling hum, warm and well agreed
Windowless | Hummed vigil | effort=.4 vowel=.4 people=12 spread=0 attack=.3 release=.8 lag=.6 path=Slide strain=.2 leader=.3 vowelSpread=.2 stubborn=0 fade=.25 | darkbox | hymn | Twelve hum from a single spot, and stop soon | voice
Harmonium of noses | Hummed vigil | effort=.65 vowel=.85 people=14 agreement=.9 vibrato=0 path=Slide lag=.2 attack=.1 release=.5 strain=0 spread=.8 leader=.25 vowelSpread=.1 stubborn=0 wander=.05 fade=0 | stopped | hymn | Straight bright hums that start and stop like a bench organ | organ
Owl and after | Hummed vigil | people=6 vowel=.3 effort=.55 lag=.9 reach=6 path=Slide attack=.1 release=2 lowShare=-.3 leader=.7 spread=.5 stubborn=.05 wander=0 | answer | answering | One hum leads and the rest slide to it from far off | voice
Nightshift lullaby | Hummed vigil | people=10 leader=.8 vowel=.6 effort=.45 vibrato=.5 attack=.2 release=1.4 lowShare=.2 spread=.8 stubborn=.1 wander=.05 fade=.25 | reel | lullaby | One humming voice stands in front of nine | voice
`,
    },
    {
      id: 'whistling-fields',
      name: 'Whistling fields',
      category: 'wind',
      rows: `
Lane of whistlers | Whistling field | people=20 wander=.5 effort=.5 release=2 reach=3 strain=.2 leader=0 vowelSpread=.5 stubborn=.2 volume=1.5 | openair | aloft | Twenty whistlers spread wide, sliding in from a little off the note
Wind over the gate | Whistling field | air=.8 effort=.25 attack=1 release=5 people=30 vibrato=.1 strain=.15 leader=0 stubborn=.25 volume=-0.5 | clouds | quartal | More lip breath than tone, with the pitch far down inside it | texture
Skating by moonlight | Whistling field | lag=.8 reach=2 vibrato=.7 people=10 air=.15 release=4 attack=.5 strain=.45 leader=0 vowelSpread=.6 stubborn=.1 volume=3.5 | sway | aloft | Ten whistlers with a wide sway, gliding from note to note
Two fingers in the mouth | Whistling field | strain=.9 effort=.85 reach=8 people=8 air=.5 attack=.05 release=.8 leader=.6 stubborn=.05 | narrow | answering | Hard, breathy whistles that swoop in from far off
Leaf spinning in a yard | Whistling field | wander=1 agreement=.15 people=24 reach=10 lag=2.5 air=.6 spread=1 breath=.8 fade=.5 attack=.06 vowel=.9 lowShare=-.5 leader=0 vowelSpread=.5 stubborn=.35 volume=4.5 | turning | crowded | Short whistles far out of tune that wander all the time | texture
Milk round at five | Whistling field | people=2 path=Turn lag=.25 reach=2 wander=0 air=.1 attack=.04 release=.4 spread=.3 strain=.2 leader=0 vowelSpread=.15 stubborn=.05 fade=.25 volume=-0.5 | slapback | lullaby | Two whistle a tune, with a turn on every note
Boy with a bicycle | Whistling field | people=2 path=Slide lag=.12 reach=1 wander=0 leader=.8 air=.08 attack=.03 release=.3 vibrato=.3 vowelSpread=.05 stubborn=.1 fade=0 volume=-0.5 | openair 1.distance=0.35 | answering | One clean whistle in front, sliding between notes
Postman on the stair | Whistling field | people=3 path=Steps lag=.25 wander=0 air=.2 attack=.02 release=.6 vibrato=0 effort=.6 strain=0 leader=.3 vowelSpread=.05 stubborn=.2 fade=0 volume=2.5 | stairwell | procession | Three straight whistles that go up by spoken steps
Whistling past a window | Whistling field | people=4 path=Late lag=.6 reach=2 wander=0 vibrato=.8 release=1.2 air=.2 attack=.2 strain=.45 leader=0 vowelSpread=.6 volume=0 | wall | lullaby | Four late whistles with a wide wobble
Dog on the far bank | Whistling field | people=2 path=Leap lag=.02 attack=.01 wander=0 effort=.9 air=.15 release=.5 reach=0 fade=.3 breath=1 vowelSpread=.45 stubborn=0 | valley | answering | Two sharp whistlers who land on the note at once
Glass harp, outdoors | Whistling field | air=.02 agreement=.95 vibrato=.05 reach=0 wander=.1 attack=.5 people=12 release=5 strain=.05 leader=.3 vowelSpread=.05 fade=0 | shining | inner | Clean whistled tones in tune, with no breath | pad
Lichen | Whistling field | attack=2.5 release=9 effort=.15 air=.3 people=30 lag=3 vowel=.2 wander=.4 strain=.15 leader=0 stubborn=.25 lowShare=.3 | endless | glacial | Faint whistled tones that take seconds to appear | pad
Balloon past the spires | Whistling field | lag=4 reach=12 people=16 attack=1.5 release=7 air=.2 wander=.3 leader=0 vowelSpread=.5 stubborn=.45 | ascent | glacial | Whistlers start up to an octave off and drift in over many seconds | pad
Blue enamel sky | Whistling field | vowel=.8 effort=.5 air=.1 people=24 attack=.8 release=4 agreement=.7 wander=.2 vibrato=.2 leader=0 vowelSpread=.05 stubborn=.05 fade=0 | bloom | quartal | A bright steady field of whistles, close in tune | pad
Cloud shadow on barley | Whistling field | vowel=.4 effort=.35 air=.4 breath=2 fade=.5 people=26 attack=.6 release=3 strain=0 leader=0 vowelSpread=.6 stubborn=.35 lowShare=.3 volume=0 | water | hymn | Whistled breaths that rise and sink all across the field | pad
Tin cups on strings | Whistling field | path=Leap lag=.02 attack=.01 fade=.95 breath=1.1 reach=0 people=10 air=.05 wander=0 release=3 strain=.15 leader=.2 stubborn=0 | tank | chimes | Whistled notes struck and gone within a breath | bell
Bells for a goat | Whistling field | path=Leap lag=.02 attack=.01 fade=1 breath=.5 reach=0 people=6 air=.15 wander=0 release=.8 agreement=.2 strain=.2 leader=0 vowelSpread=.4 stubborn=.05 volume=1 | stub | changes | Clanking whistles, cut off fast and not quite in tune | bell
Pin dropped on glass | Whistling field | path=Leap lag=.02 attack=.02 fade=.6 breath=4 reach=0 people=4 air=0 wander=0 release=8 vibrato=0 agreement=.9 lowShare=-.8 strain=0 leader=.2 vowelSpread=0 stubborn=0 | points | chimes | Pure high tones with the octave above that ring on and on | bell
Sleigh on the ice road | Whistling field | path=Leap lag=.02 attack=.01 fade=1 breath=.3 reach=0 people=20 air=.3 wander=0 release=1.5 effort=.6 strain=.15 leader=.2 stubborn=.05 lowShare=-.25 volume=0.5 | pattering | turning | Tiny airy whistles that sprinkle each note | bell
Frosted chandelier | Whistling field | path=Leap lag=.03 attack=.04 fade=.8 breath=2.4 reach=0 people=16 air=.1 wander=.2 release=6 agreement=.5 strain=.1 leader=.2 vowelSpread=.45 stubborn=.05 volume=1 | sparkle | changes | Soft whistles that beat as they sink | bell
Reed bed at dusk | Whistling field | body=Hollow reach=3 people=18 air=.45 effort=.35 vowel=.6 release=3 strain=.15 vowelSpread=.2 | hang | aloft | Hollow pipes wander and come back with breath across them
Bottles on a wall | Whistling field | body=Hollow air=.7 effort=.5 people=8 path=Leap lag=.03 attack=.04 reach=0 fade=.5 breath=1.5 wander=0 strain=0 leader=.6 vowelSpread=.15 stubborn=0 volume=0 | doubled | broken | Blown hollow notes, as much breath as pipe
Shepherd and slope | Whistling field | body=Hollow people=2 leader=.9 path=Turn lag=.4 reach=3 wander=0 attack=.08 release=1 air=.3 strain=.45 vowelSpread=.15 stubborn=.1 fade=.35 volume=0.5 | lateplace | lullaby | One hollow pipe turns round its tune, another under it
Draught up the flue | Whistling field | body=Hollow lowShare=.7 vowel=.15 air=.6 effort=.2 people=24 attack=.8 release=4 strain=.05 leader=0 vowelSpread=.15 stubborn=.25 fade=0 volume=-12.5 | shaft | lowmen | Low hollow breath that wanders between octaves | drone
Flutes left in the rain | Whistling field | body=Hollow vowel=.9 effort=.6 people=12 path=Late lag=.8 vibrato=.7 air=.2 release=1.5 wander=.2 strain=.65 leader=.5 vowelSpread=.15 stubborn=.2 fade=.25 lowShare=-.3 volume=3 | rain | duet | Bright hollow pipes arrive late and quaver
Evening pass of swifts | Whistling field | path=Turn lag=.3 reach=12 people=12 effort=.7 attack=.04 release=1 air=.1 wander=.8 strain=.45 leader=0 vowelSpread=.75 stubborn=.2 | flock | aloft | Wide fast turns round the note by whistlers who fly in from far off | texture
Starlings over gravel | Whistling field | breath=.2 fade=.6 people=36 air=.4 effort=.5 reach=6 spread=1 agreement=.1 attack=.02 strain=.55 leader=0 vowelSpread=.5 stubborn=.35 | shifted | crowded | Scraps of whistle from everywhere, none of them agreeing | texture
Kettles on twelve stoves | Whistling field | path=Slide lag=3 reach=12 people=12 effort=.8 strain=.8 attack=.6 air=.3 vibrato=.6 vowelSpread=.45 lowShare=-.25 | ripples | quartal | Strained whistles that take long to find the chord | texture
Wires in a blizzard | Whistling field | effort=.6 air=.9 people=36 vibrato=.8 wander=.9 attack=1 release=4 vowel=.9 leader=0 vowelSpread=.2 stubborn=.05 lowShare=-.25 volume=0 | thin | fifths | Almost only hiss, swaying with the note in it | texture
Moths and porch light | Whistling field | breath=.6 people=10 fade=.4 air=.65 path=Turn lag=.4 reach=5 wander=.7 effort=.3 lowShare=-.6 strain=.15 leader=.25 vowelSpread=.2 stubborn=.1 volume=3 | glasstube | aloft | Fluttering airy whistles that circle the note, some an octave up | texture
Deckhand on a mast | Whistling field | lowShare=.4 people=6 effort=.6 vowel=.3 vibrato=.4 attack=.15 release=1.5 wander=.2 lag=.6 strain=.55 | surf | procession | Six firm whistles, gathered on the lower notes
Wolf moon | Whistling field | lowShare=.8 reach=9 lag=2 people=14 attack=.8 release=5 effort=.5 vowel=.1 leader=.2 vowelSpread=.15 stubborn=.45 | nave | lowmen | Whistles gather low and slide a long way to their note
Night goods train | Whistling field | lowShare=.6 people=20 path=Late lag=1.4 agreement=.2 effort=.4 air=.25 release=3 vowelSpread=.2 stubborn=.45 volume=-0.5 | farshore | leaning | Late whistles rubbing against each other low in the chord
Old quarry | Whistling field | lowShare=.5 people=8 path=Slide vibrato=0 attack=.4 release=3 wander=0 lag=1 air=.05 reach=2 leader=.5 vowelSpread=.1 fade=0 | darkecho | hymn | Straight clear whistles that slide slowly
Barn owl hour | Whistling field | lowShare=1 people=10 air=.5 attack=.3 release=2 effort=.3 vowel=.5 wander=.3 lag=.8 strain=.05 leader=.6 vowelSpread=.2 stubborn=.1 | darkend | lullaby | Low breathy whistling, quiet and slow to move
Kites at four heights | Whistling field | lowShare=-.6 people=16 reach=4 lag=1.2 effort=.55 vibrato=.3 attack=.4 air=.15 leader=.2 vowelSpread=.2 stubborn=.05 | airy | duet | High whistles with an octave above the chord, gliding in
Wagtails on the weir | Whistling field | lowShare=-.4 path=Steps lag=.3 people=12 attack=.02 breath=.9 fade=.5 air=.1 wander=.3 strain=.1 leader=.35 vowelSpread=.45 stubborn=.1 volume=0 | ripples 1.rate=2 | murmurs | Whistles that take small fast steps and lift off
Frost fern | Whistling field | lowShare=-1 people=8 attack=1.8 release=7 air=.05 effort=.2 vibrato=.1 agreement=.8 wander=.2 strain=0 vowelSpread=0 stubborn=.05 fade=0 volume=0 | frost | aloft | Very high quiet tones, nearly pure | pad
Finch school | Whistling field | lowShare=-.8 path=Turn lag=.2 reach=5 breath=.5 fade=.5 people=20 attack=.02 wander=.6 effort=.6 leader=0 vowelSpread=.45 volume=4 | stars | changes | Chirping whistles with fast turns over the top octave | texture
Thin ladder of air | Whistling field | lowShare=-.5 path=Steps lag=.9 people=6 air=.5 attack=.1 release=2 wander=0 strain=.1 leader=.3 vowelSpread=.2 volume=2.5 | reflected | procession | Six airy whistles that climb to each note by steps
Slate roofs after rain | Whistling field | people=14 path=Late lag=1 attack=.6 release=3 fade=.5 breath=3 air=.2 wander=.2 strain=.15 leader=.3 vowelSpread=.2 stubborn=.45 volume=0.5 | dusty | inner | Late whistles that sink in each breath
Fairground after hours | Whistling field | vibrato=1 lag=1 people=10 effort=.4 attack=.4 release=2 wander=.1 air=.1 leader=0 vowelSpread=.5 stubborn=.1 | rotor | lullaby | Whistles with as wide a wobble as they will go
Coal cart whistle | Whistling field | people=4 effort=.75 strain=.5 air=.35 attack=.06 release=.7 wander=0 path=Slide lag=.3 vowel=.1 leader=.3 vowelSpread=.6 lowShare=.3 volume=0 | combo | procession | Four rough dark whistles that slide
Hill signals to hill | Whistling field | people=24 path=Leap lag=.05 attack=.3 release=2 reach=0 wander=0 breath=2 fade=.2 vowel=.7 effort=.5 strain=.75 leader=0 vowelSpread=.6 stubborn=0 lowShare=-.2 volume=-1 | round | answering | Clear whistled notes picked up at once by everyone
Barefoot in the orchard | Whistling field | people=3 path=Late lag=1.5 attack=.5 release=4 air=.4 reach=4 effort=.25 wander=0 strain=.05 leader=.3 vowelSpread=.15 stubborn=.05 fade=.35 volume=2 | mirror | lullaby | Three faint whistles that come in late and from far off
Radio mast in fog | Whistling field | people=12 vowel=.6 air=.2 attack=.4 release=2 wander=.4 agreement=.4 lag=1 strain=.45 leader=0 vowelSpread=.75 lowShare=.3 | wireless | quartal | A loose ring of whistles that rub slowly | texture
Skylight left open | Whistling field | people=18 effort=.3 vowel=.9 air=.25 attack=.7 release=3 reach=1 wander=.1 lowShare=-.2 vowelSpread=.45 stubborn=.35 | cloud | quartal | A soft bright veil of whistling | pad
Stilts | Whistling field | people=2 path=Steps lag=.6 attack=.02 air=.05 effort=.5 release=.5 wander=0 reach=0 spread=.8 vibrato=.1 strain=.15 leader=.25 vowelSpread=.45 | tiny | duet | Two whistles walk from note to note in steps
Sun on a weathervane | Whistling field | people=8 leader=.5 vibrato=.5 attack=.1 release=2 air=.1 effort=.6 vowel=.7 lag=.5 wander=.2 strain=.5 | octaveup | procession | A bright whistled lead with seven behind it
Last field of the farm | Whistling field | people=36 effort=.4 attack=1.2 release=6 wander=.6 lag=2 reach=4 air=.3 strain=0 leader=0 vowelSpread=.75 | dissolve | leaning | Everyone whistles softly, far apart, and takes long to agree | pad
`,
    },
    {
      id: 'leaders',
      name: 'Leaders and shadows',
      category: 'voice',
      rows: `
Cantor at an open door | Leader alone | people=6 lag=.35 effort=.65 vowel=.65 reach=2 release=1.2 strain=.4 lowShare=-.3 spread=.8 stubborn=.2 wander=.05 fade=.25 | cathedral | lined | One bright hard singer turns onto each note with a few far behind
Widow's verse | Leader alone | people=2 vowel=.35 effort=.35 vibrato=.7 attack=.25 lag=.6 release=1.5 strain=.1 vowelSpread=.1 stubborn=.2 wander=.1 lowShare=.4 | darkhall | lullaby | One dark voice, a wide sway, and a single shadow
Song for a small boat | Leader alone | path=Slide people=6 vowel=.45 air=.25 effort=.35 lag=.3 release=1.2 reach=1 spread=.5 strain=0 vowelSpread=.2 stubborn=.05 lowShare=-.3 volume=0.5 | near | lullaby | A close airy voice that slides between notes
First at the well | Leader alone | path=Leap people=10 lag=.03 attack=.04 effort=.5 vowel=.7 vibrato=.3 release=.8 spread=.8 strain=.45 vowelSpread=.05 stubborn=0 wander=.1 fade=0 volume=-0.5 | stairwell | answering | A bright voice that lands straight on the note
Walks in ahead | Leader alone | leader=.6 path=Late lag=2.4 people=5 effort=.3 vowel=.75 attack=.2 release=2.5 air=.6 lowShare=-.7 spread=.9 strain=0 vowelSpread=.2 stubborn=.05 wander=.05 | nave | lined | A breathy leader is early and the few others very late, most an octave up
Drover | Leader alone | vowel=.3 effort=.9 strain=.9 people=8 reach=8 attack=.05 release=.5 vibrato=.2 path=Slide lowShare=.4 spread=.9 stubborn=.1 volume=-3 | openair | answering | A hard, strained call that swoops in from far off
Lamplighter | Leader alone | vowel=.15 effort=.25 people=12 attack=.3 release=2 path=Slide lag=.5 air=.15 strain=.15 lowShare=.4 | cellar | lullaby | A dark quiet voice that glides
Caller on the tower | Leader alone | path=Turn reach=4 lag=.9 effort=.6 vowel=.65 people=20 vibrato=.3 release=3 strain=.45 spread=.9 vowelSpread=.15 stubborn=.1 wander=0 volume=2 | valley | single | A bright voice that winds around one note for a long time
Confession | Leader alone | air=.8 effort=.3 people=2 vowel=.5 attack=.08 release=.6 path=Slide lag=.2 vibrato=0 spread=.1 strain=.2 vowelSpread=.45 stubborn=.2 fade=.35 | booth | duet | Whispered more than sung, right in front
Porter's night round | Leader alone | path=Steps lag=.4 people=4 effort=.35 vowel=.3 attack=.05 release=.5 vibrato=.1 reach=0 spread=.15 strain=.15 vowelSpread=.1 stubborn=.1 wander=.05 fade=0 | reel | procession | A plain voice that goes by spoken steps
Humming overseer | Leader alone | body=Hum people=8 vowel=.6 effort=.5 path=Slide lag=.25 attack=.1 release=.8 spread=.4 strain=0 vowelSpread=.15 stubborn=.05 wander=.1 volume=-9 | warmed | lullaby | One closed hum with seven faint ones
Mother at the sink | Leader alone | body=Hum people=2 vowel=.8 effort=.6 path=Turn reach=1 lag=.3 vibrato=.6 release=.6 spread=.15 strain=.45 vowelSpread=.15 stubborn=.1 wander=.05 | chamber | lullaby | A bright hum with small turns, and one echo of it
Asleep in the choir | Leader alone | body=Hum people=20 leader=.7 effort=.25 air=.4 path=Late lag=1.6 attack=.5 release=3 spread=.5 strain=.05 vowelSpread=.15 stubborn=.25 wander=.4 lowShare=-.2 | throughfog | leaning | A faint airy hum ahead of a late murmur
Forge song | Leader alone | body=Hum effort=.85 vowel=.95 strain=.6 people=12 lowShare=.4 attack=.06 release=.7 spread=.4 stubborn=.05 fade=.25 | valve | bassline | A tight bright hum that bears down on the low notes
Closed lips, long hall | Leader alone | body=Hum path=Late lag=1 people=14 vowel=.3 effort=.4 release=4 attack=.4 vibrato=.3 strain=.15 vowelSpread=.05 stubborn=.05 wander=0 fade=0 lowShare=.4 | hallend | single | A dark hum that arrives late and stays
Pipe at the head of them | Leader alone | body=Hollow people=10 vowel=.5 effort=.5 lag=.3 reach=2 attack=.06 release=1 spread=.5 strain=.2 vowelSpread=.45 wander=.05 volume=2 | stub | duet | One hollow pipe leads with quick turns | wind
Wooden flute, one lung | Leader alone | body=Hollow people=2 air=.45 vowel=.3 effort=.4 path=Slide lag=.15 attack=.05 release=.6 breath=2.5 fade=.4 spread=.15 strain=.15 vowelSpread=.2 stubborn=.05 | wood | lullaby | A breathy hollow tone that sinks as the breath runs out | wind
Across two valleys | Leader alone | body=Hollow people=6 vowel=.8 effort=.7 path=Turn reach=5 lag=.6 release=2.5 vibrato=.6 spread=.9 strain=.75 vowelSpread=.6 stubborn=.05 wander=.4 volume=3 | lateplace | answering | A bright pipe with wide turns and a sway | wind
Temple porch pipe | Leader alone | body=Hollow people=4 vowel=.15 effort=.2 path=Late lag=.8 attack=.5 release=4 air=.3 vibrato=.2 spread=.45 strain=.15 stubborn=.2 lowShare=.25 volume=-0.5 | longplate | aloft | A dark soft pipe that speaks slowly | wind
Goat path | Leader alone | body=Hollow people=8 path=Steps lag=.35 attack=.02 effort=.6 vowel=.6 release=.4 reach=1 breath=1.4 fade=.3 spread=.4 strain=.55 vowelSpread=.2 stubborn=.05 wander=.1 lowShare=-.3 volume=1 | plain | procession | A clear pipe that hops up to its notes | wind
Reed over the water | Leader alone | body=Reed people=6 vowel=.5 effort=.45 path=Slide lag=.4 reach=3 attack=.08 release=1 vibrato=.4 spread=1 strain=.2 stubborn=.2 | farshore | lined | A single reed that slides well in from off the note | wind
Snake and basket | Leader alone | body=Reed people=2 vowel=.35 effort=.35 path=Turn reach=3 lag=.25 vibrato=.5 attack=.03 release=.4 strain=.3 spread=.3 stubborn=0 volume=2.5 | pipe | single | A narrow reed that never stops turning | wind
Squeezebox at the gate | Leader alone | body=Reed people=4 leader=.5 vowel=.3 effort=.4 path=Leap lag=.04 attack=.05 release=.4 agreement=.3 spread=.2 strain=.05 vowelSpread=.05 stubborn=.05 wander=0 fade=0 volume=0 | parlour | lullaby | Four reeds out of tune with each other, plain and close | organ
Oboe by a cold stove | Leader alone | body=Reed people=8 vowel=.15 effort=.2 path=Late lag=.7 attack=.25 release=2 vibrato=.6 strain=.1 vowelSpread=.45 stubborn=.05 wander=.1 lowShare=.25 volume=0.5 | darkplate | lullaby | A soft dark reed that leans late into each note | wind
Market caller | Leader alone | body=Reed people=12 vowel=.45 effort=.6 strain=.6 path=Slide reach=6 lag=.3 attack=.03 release=.4 breath=1 fade=.4 stubborn=.1 volume=-0.5 | slap | answering | A hard reed that swoops and cuts off | wind
Solo bow, empty chairs | Leader alone | body=Strings people=4 vowel=.35 effort=.4 path=Slide lag=.25 attack=.2 vibrato=.6 release=.9 spread=.25 strain=.05 vowelSpread=.15 wander=0 lowShare=.25 | room | lined | One warm bow with a wide sway | string
Cello, door shut | Leader alone | body=Strings people=2 lowShare=.5 vowel=.2 effort=.35 path=Slide lag=.4 attack=.3 release=1.4 vibrato=.5 spread=.3 strain=0 vowelSpread=.2 stubborn=.05 | wood | basswalk | A dark low bow that slides between notes | string
Fiddle at the crossroads | Leader alone | body=Strings people=3 vowel=.5 effort=.5 path=Turn reach=2 lag=.18 attack=.02 release=.4 vibrato=.2 spread=.25 strain=.25 vowelSpread=.45 stubborn=.1 wander=.1 | combo | answering | A firm bow with quick turns | string
Bow of horsehair ash | Leader alone | body=Strings people=6 air=.7 effort=.25 vowel=.4 path=Slide lag=.6 attack=.4 release=2 vibrato=.1 spread=.4 strain=.15 vowelSpread=.2 stubborn=.1 wander=.1 | shaded | single | A scratchy faint bow, much of it hair | string
Last desk, first light | Leader alone | body=Strings people=20 leader=.7 path=Late lag=1.2 vowel=.4 effort=.4 attack=.4 release=2.5 vibrato=.4 spread=1 strain=.15 vowelSpread=.6 wander=.05 | cathedral | hymn | One bow ahead and a soft section late behind it | string
Whistled from a window | Leader alone | body=Whistle people=8 path=Slide lag=.2 attack=.04 air=.15 effort=.5 release=.5 vibrato=.4 spread=.4 stubborn=.05 fade=.25 lowShare=-.3 | slapback | lullaby | A clear whistle ahead of a faint few | wind
Bird caller's nephew | Leader alone | body=Whistle people=2 path=Turn reach=9 lag=.25 attack=.02 effort=.7 air=.1 release=.3 spread=.3 strain=.2 vowelSpread=.2 stubborn=.2 volume=-0.5 | loop | answering | A whistle that throws wide quick turns | wind
Lark over the pit | Leader alone | body=Whistle people=14 lowShare=-.5 path=Turn reach=3 lag=.4 effort=.5 release=1.5 attack=.06 vibrato=.6 vowelSpread=.45 stubborn=.2 wander=.1 volume=1 | choirup | aloft | A high whistle turning with the octave over it | wind
Grey thrush | Leader alone | body=Whistle people=4 air=.6 path=Slide lag=.5 effort=.3 attack=.15 release=1.5 vowel=.2 spread=.25 stubborn=.05 fade=.35 | drift | lullaby | A whistle that is half lips and half tone | wind
Glass tears | Leader alone | body=Whistle people=2 path=Leap lag=.02 attack=.02 fade=.8 breath=1.8 release=4 air=0 vibrato=.2 effort=.5 spread=.3 vowelSpread=.05 stubborn=0 wander=.05 volume=-0.5 | memory | chimes | A lone clean whistle that lands and dies away | bell
Conductor of shadows | Leader alone | leader=.75 people=36 lag=1 reach=5 vowel=.5 agreement=.3 effort=.5 release=2 spread=.9 strain=.2 vowelSpread=.6 stubborn=.45 volume=-1 | flock | hymn | A singer in front of a wide unsteady crowd
Chapel master | Leader alone | leader=.5 people=24 agreement=.95 path=Slide lag=.3 vibrato=.1 vowel=.4 effort=.45 release=2 attack=.3 spread=.8 vowelSpread=.1 stubborn=.05 wander=.1 fade=0 | chapel | hymn | A clear leader over a crowd in pure tune
Soapbox and square | Leader alone | leader=.85 people=30 effort=.8 breath=.9 fade=.3 vowel=.65 attack=.03 lag=.2 release=.7 path=Leap spread=1 strain=.55 vowelSpread=.6 stubborn=0 | hallend | murmurs | Short loud syllables, with the crowd well back
Matriarch | Leader alone | leader=.6 lowShare=.5 people=20 vowel=.3 effort=.6 path=Turn reach=2 lag=.7 vibrato=.8 release=2 spread=.4 strain=.5 vowelSpread=.15 stubborn=.25 volume=-7.5 | tube | lowmen | A strong low voice with a big wobble stands out
Child leads the old | Leader alone | leader=.8 lowShare=-.7 people=10 vowel=.7 effort=.4 path=Slide lag=.5 attack=.12 vibrato=.1 release=1 spread=.5 strain=.05 vowelSpread=.1 stubborn=.1 wander=0 fade=0 | spring | duet | A small straight voice, high up, slow ones after it
Whisper with one voice | Leader alone | air=.6 people=30 vowelSpread=.9 effort=.4 breath=2 attack=.2 release=2 path=Late lag=1 spread=.8 strain=.05 stubborn=.1 wander=.1 | whisperhall | lined | One breathy singer with breath all round
Ringleader | Leader alone | leader=.7 stubborn=.9 agreement=.2 people=16 effort=.7 vowel=.6 strain=.5 lag=.7 release=1.2 lowShare=.4 vowelSpread=.2 wander=.1 volume=0.5 | doubled | crowded | A loud bright leader who moves while the rest dig in
Tape of a cantor | Leader alone | people=2 vowel=.85 effort=.7 vibrato=.6 lag=.4 release=1 attack=.1 air=.3 reach=4 spread=.3 strain=.45 vowelSpread=.2 stubborn=.2 wander=.1 | cassette | lined | A bright breathy voice that turns widely on every note
Prompter under the stage | Leader alone | leader=1 people=10 path=Steps lag=.25 effort=.3 vowel=.2 attack=.03 release=.4 vibrato=0 breath=1.2 fade=.4 spread=.3 strain=.1 vowelSpread=.2 wander=.05 lowShare=.25 | muffled | murmurs | A lone dark voice that gives out notes in steps
Mirror singer | Leader alone | leader=.9 people=4 path=Slide lag=.8 vowel=.6 effort=.4 attack=.4 release=3 vibrato=.3 spread=.15 strain=.45 stubborn=.1 wander=.4 fade=.35 lowShare=-.25 | mirror | duet | A slow bright voice that comes up gently
Choir of one mouth | Leader alone | leader=1 people=36 path=Slide lag=.15 vowel=.5 effort=.5 vibrato=.15 attack=.06 release=.7 spread=0 strain=.05 vowelSpread=.1 wander=.05 fade=0 | ensemble | inner | One plain voice on each note and nobody to be heard behind
Alone on the levee | Leader alone | people=2 vowel=.35 effort=.65 vibrato=.6 attack=.12 release=.9 lag=.6 reach=6 path=Slide spread=.15 strain=.45 stubborn=.2 wander=.1 | farshore | answering | One dark strong voice that slides in from a long way off
Old song, new throat | Leader alone | people=12 vowelSpread=.8 vowel=.4 path=Turn reach=2 lag=.5 effort=.5 attack=.1 release=1 air=.1 spread=.4 strain=.45 stubborn=.1 wander=.1 volume=-1 | sampler | lullaby | A lead whose mouth keeps changing shape
Keeper of the tune | Leader alone | people=20 leader=.8 path=Leap lag=.05 attack=.02 fade=.7 breath=1.6 effort=.5 vowel=.45 release=1.5 spread=.8 vowelSpread=.15 stubborn=0 wander=0 | giant | broken | Sung keys with one voice in front, each falling away | keys
Vigil's last speaker | Leader alone | people=2 effort=.2 vowel=.25 attack=1.2 release=5 vibrato=.2 path=Slide lag=1 air=.35 spread=.25 strain=.05 vowelSpread=.15 stubborn=.05 wander=.1 fade=.25 | bloomspace | single | One faint voice that takes its time to begin
`,
    },
    {
      id: 'bass-floors',
      name: 'Bass floors',
      category: 'bass',
      rows: `
Men at the long table | Bass floor | attack=.1 release=.6 lag=.15 effort=.5 vowel=.3 people=24 spread=.3 strain=.45 leader=.45 stubborn=.05 wander=.1 | room | bassline | Round low voices that start together and stop together
Barge at walking pace | Bass floor | lag=.5 attack=.3 release=1.5 vowel=.2 effort=.35 reach=3 vibrato=.1 spread=.3 strain=.05 leader=.45 stubborn=0 wander=0 volume=-21.5 | warmed | basswalk | Dark voices slide slowly from step to step
Big door, small key | Bass floor | people=6 attack=.06 release=.5 vowel=.45 effort=.65 lag=.08 strain=.6 spread=.4 leader=.45 stubborn=.05 wander=0 volume=-7 | pressed | bassline | Six hard low voices that bear down on each note
Boots on planks | Bass floor | path=Steps lag=.3 attack=.03 release=.5 vowel=.35 effort=.6 people=16 spread=.4 strain=.45 leader=.45 stubborn=0 wander=.1 volume=-9 | plain | basswalk | Low voices walk the line in spoken steps
Underside of the bridge | Bass floor | vowel=.6 effort=.45 attack=.2 release=2 people=30 spread=.9 vowelSpread=.6 leader=0 stubborn=0 wander=.1 | hallend | bassline | Open low voices of many vowels, spread wide
Coal in the hold | Bass floor | body=Hum vowel=.3 effort=.4 attack=.08 release=.6 lag=.1 people=14 spread=.4 strain=.15 leader=0 stubborn=0 wander=.1 fade=0 | iron | bassline | A plain dark hum that speaks early
Submarine pen | Bass floor | body=Hum vowel=.05 effort=.15 attack=.4 release=2.5 people=30 lag=.8 air=.2 spread=.4 strain=0 leader=.3 stubborn=.05 wander=0 volume=-11.5 | lowspace | basswalk | A hum so dark that only its bottom is left
Generator hut | Bass floor | body=Hum vowel=.8 effort=.8 attack=.03 release=.4 lag=.05 people=8 strain=.6 spread=.3 leader=.3 stubborn=0 wander=.1 volume=-11.5 | combo | bassline | A tight bright hum with an edge, quick to stop
Big dog dreaming | Bass floor | body=Hum breath=.5 fade=.5 vowel=.4 effort=.5 people=20 attack=.04 release=.8 spread=.3 strain=.2 leader=0 stubborn=0 wander=.1 lowShare=.5 volume=1.5 | throb | lowsingle | A low hum in half-second growls
Ferry under the pier | Bass floor | body=Hum path=Late lag=.6 vibrato=.6 vowel=.5 effort=.45 release=1.8 attack=.2 spread=.2 strain=.45 leader=.3 stubborn=.05 wander=.1 | submerged | basswalk | A late low hum that wobbles as it settles
Storm drain | Bass floor | body=Hollow vowel=.2 effort=.5 attack=.06 release=.9 people=10 lag=.1 air=.3 spread=.3 strain=.1 leader=.3 stubborn=0 wander=0 volume=-10.5 | pipe | bassline | Round hollow lows with breath across them
Jugs on the porch | Bass floor | body=Hollow path=Leap lag=.02 attack=.01 fade=.8 breath=.8 reach=0 people=4 air=.4 release=.8 spread=.25 strain=.2 leader=.2 stubborn=0 wander=0 volume=-10.5 | clay | bassline | Blown hollow notes that puff and die | plucked
Great pipe, locked doors | Bass floor | body=Hollow agreement=.9 vowel=.6 effort=.7 attack=.15 release=1 people=20 breath=12 leader=.2 stubborn=.05 wander=0 fade=0 | cathedral | lowmen | Strong hollow lows in tune, held without a breath | organ
Wind in the coal chute | Bass floor | body=Hollow air=.85 vowel=.4 effort=.35 attack=.5 release=3 people=18 spread=.4 strain=.2 stubborn=.2 fade=0 lowShare=.45 | cellar | lowsingle | Hollow air with one low note hidden in it | drone
Organ stop, pushed in | Bass floor | body=Hollow vowel=0 effort=.1 attack=.3 release=1.6 people=12 lowShare=.5 vibrato=0 spread=.4 strain=.1 leader=.25 stubborn=0 fade=0 volume=-10.5 | chamber | lowmen | Soft stopped pipes with nothing on top | organ
Bassoon at the bottom | Bass floor | body=Reed vowel=.15 effort=.25 attack=.06 release=.4 people=4 lag=.1 path=Leap reach=0 spread=.15 strain=.15 leader=.3 stubborn=0 wander=0 volume=-9.5 | narrow | bassline | Four dark reeds, clipped and quick
Barrel organ cellar | Bass floor | body=Reed vowel=.6 effort=.5 attack=.05 release=.5 people=12 agreement=.4 path=Leap lag=.04 spread=.3 strain=.75 leader=0 stubborn=.05 wander=0 volume=-10 | cellar | bassline | Bright low reeds, a little sour with each other
Saw pit | Bass floor | body=Reed vowel=.9 effort=.6 attack=.1 release=.8 people=20 strain=.7 lag=.3 spread=.3 leader=.45 stubborn=.05 wander=0 volume=2.5 | gatefilter | basswalk | Buzzing low reeds with the top taken off
Old dredger | Bass floor | body=Reed path=Turn reach=3 lag=.7 vowel=.4 effort=.4 people=26 release=1.6 spread=.2 leader=0 stubborn=0 wander=.1 | rotor | lowmen | Low reeds that turn heavily around every step
Reed mat | Bass floor | body=Reed breath=.4 fade=.4 vowel=.3 effort=.3 people=30 attack=.03 release=.6 air=.2 spread=.3 strain=0 leader=.3 stubborn=.05 wander=.1 volume=-4 | folded | basswalk | Low reeds cut into soft short breaths
Bull fiddle, bare boards | Bass floor | body=Strings vowel=.35 effort=.5 attack=.08 release=.6 people=8 lag=.2 vibrato=.2 spread=.3 strain=.15 leader=.35 wander=0 volume=-10 | wood | bassline | Bowed lows with a rosin bite, close to the floor | string
Pulled gut | Bass floor | body=Strings path=Leap lag=.02 attack=.01 fade=1 breath=.9 reach=0 people=6 effort=.5 vowel=.4 release=1.6 spread=.3 stubborn=0 wander=.1 | tube | basswalk | Low strings pulled and left to fall away | plucked
Section in the pit | Bass floor | body=Strings people=30 vowel=.25 effort=.4 attack=.4 release=1.6 vibrato=.4 lag=.5 spread=.9 leader=0 stubborn=.1 fade=.25 | hall | lowmen | Many low bows that sway and lean together | string
Bridge of a cello | Bass floor | body=Strings vowel=.95 effort=.35 air=.5 people=4 attack=.2 release=.8 lag=.3 spread=.15 strain=.5 leader=.2 stubborn=.1 wander=.05 volume=-10 | scooped | basswalk | Four thin glassy bows with nearly as much hair as tone | string
Contrabass tide | Bass floor | body=Strings path=Late lag=1.2 vowel=.15 effort=.3 attack=.2 release=3.5 people=20 reach=4 leader=.3 fade=.25 | darkswell | lowmen | Late low bows come in from well off the note | string
Footings under clay | Bass floor | attack=1.2 release=5 lag=1.5 vowel=.15 effort=.3 spread=.8 lowShare=1 strain=.45 leader=0 stubborn=.2 wander=.5 fade=0 volume=-6 | darkhall | fifths | The whole crowd at the bottom, slow to rise and slow to part | drone
Bench of four | Bass floor | people=4 attack=.3 release=1.5 vowel=.4 effort=.5 breath=6 vibrato=0 spread=.3 strain=.15 wander=.1 fade=0 | chapel | fifths | Four straight low voices and no more | drone
Throat of the canyon | Bass floor | vowel=.7 effort=.7 strain=.5 people=12 attack=.4 release=3 vibrato=.2 leader=0 stubborn=.1 fade=0 | overtones | fifths | Open strong lows with a wide mouth | drone
Ship's hull at night | Bass floor | vowel=.05 effort=.2 people=36 wander=.8 attack=1 release=4 agreement=.4 spread=1 strain=.05 leader=0 stubborn=.1 fade=0 lowShare=.7 | drift | lowsingle | Very dark voices, some always moving to the octave | drone
Peat bank | Bass floor | vowel=.3 vowelSpread=.9 effort=.35 air=.3 people=26 attack=.8 release=4 spread=1 strain=.2 leader=0 stubborn=.1 wander=.4 fade=0 | revealed | fifths | Low voices of many shapes, each slowly changing its own | drone
Reeds for the dead calm | Bass floor | body=Reed vowel=.08 effort=.15 attack=1.2 release=5 people=24 agreement=.9 vibrato=0 spread=.8 strain=0 leader=0 stubborn=.05 wander=0 fade=0 | longplate | fifths | Dim low reeds in tune, perfectly steady | drone
Strung across the valley | Bass floor | body=Strings vowel=.6 effort=.4 attack=.6 release=4 people=16 vibrato=0 breath=12 spread=.8 strain=.5 leader=.25 stubborn=.05 wander=.4 fade=0 | strings | fifths | Bright low bows drawn without a break | drone
Hurdy wheel | Bass floor | body=Strings vowel=.85 effort=.65 strain=.5 people=10 attack=.15 release=.8 vibrato=.1 agreement=.8 leader=.25 stubborn=.05 wander=0 fade=0 | bridge | fifths | Hard bright low bows, going round like a wheel | drone
Cold current song | Bass floor | body=Hum path=Slide lag=4 reach=10 effort=.6 vowel=.5 people=10 attack=1 release=5 vibrato=.3 spread=.5 leader=0 stubborn=.1 wander=.4 fade=0 | halfspeed | lowsingle | Low hums that take many seconds to slide to the note | drone
Moor in October | Bass floor | body=Hollow vowel=.5 air=.5 effort=.3 attack=1.4 release=6 people=26 wander=.5 spread=.9 strain=0 leader=0 stubborn=.2 fade=0 | winter | fifths | Hollow airy lows that wander as they hold | drone
Thumb bass | Bass floor | path=Leap lag=.02 attack=.01 fade=.9 breath=1 reach=0 people=10 vowel=.35 effort=.5 release=1 spread=.4 leader=0 stubborn=.05 wander=0 volume=-4.5 | near | basswalk | Sung low notes that land at once and drop away | plucked
Soft kick of breath | Bass floor | path=Leap lag=.02 attack=.01 fade=1 breath=.35 reach=0 people=16 vowel=.1 effort=.4 release=.4 air=.3 strain=.15 stubborn=0 wander=0 | gated | bassline | Very short dark syllables, almost a thump | plucked
Night bus bass | Bass floor | path=Leap lag=.04 attack=.05 fade=.4 breath=2.5 reach=0 people=8 vowel=.2 effort=.4 release=.8 body=Hum spread=.3 leader=0 stubborn=0 wander=.1 volume=-11.5 | reel | bassline | Round hummed lows that land and slowly sink
Elastic band | Bass floor | body=Reed path=Leap lag=.02 attack=.01 fade=.9 breath=.6 reach=0 people=6 vowel=.5 effort=.4 release=.6 spread=.4 strain=.6 leader=0 stubborn=.05 wander=0 volume=4 | opening 1.cutoffHz=900 | bassline | Short low reeds that snap and close | plucked
Wet rope plucked | Bass floor | body=Strings path=Leap lag=.02 attack=.01 fade=1 breath=.4 reach=0 people=14 vowel=.15 effort=.6 release=.5 strain=0 leader=.2 stubborn=.05 wander=.1 | darkecho | bassline | Dark short low strings, over in under half a second | plucked
Grumble under snow | Bass floor | breath=.35 fade=.2 path=Steps lag=.3 vowel=.15 vowelSpread=.8 effort=.4 people=30 air=.2 attack=.04 spread=1 leader=0 stubborn=.05 wander=.6 body=Reed lowShare=1 | mist | lowsingle | Low reedy mumbling, everyone at a different time | texture
Lungs of the mine | Bass floor | air=.9 effort=.4 breath=3 fade=.5 people=20 vowel=.3 attack=.6 release=2.5 spread=1 leader=0 stubborn=.1 wander=.1 volume=-2 | breathing | lowsingle | Deep whispering breaths with hardly a note in them | texture
Gravel chorus | Bass floor | agreement=.1 strain=.8 effort=.6 vowel=.5 people=14 attack=.1 release=1 stubborn=.6 leader=.25 fade=.35 volume=-7 | dusty | lowmen | Rough low voices that will not tune or move together | voice
Father's coat | Bass floor | people=2 leader=.8 path=Slide lag=.25 vowel=.35 effort=.4 attack=.1 release=.6 vibrato=.3 air=.2 spread=.25 strain=.1 stubborn=.1 wander=.1 | booth | basswalk | One low voice close by that slides between notes | voice
Two ferrymen | Bass floor | people=2 path=Turn reach=2 lag=.4 vowel=.55 effort=.6 attack=.08 release=.8 leader=.4 strain=.2 stubborn=.05 wander=.05 fade=.25 volume=-2 | openair | basswalk | Two low voices that turn onto every step | voice
Evening under arches | Bass floor | lowShare=.5 attack=.6 release=3 vowel=.12 effort=.2 people=36 lag=3 vibrato=0 strain=.05 leader=0 fade=.35 reach=7 path=Slide | loft | hymn | A dark broad choir that slides slowly to each low chord | voice
Velvet pit | Bass floor | body=Hum lowShare=.6 attack=.9 release=4 vowel=.6 effort=.35 people=26 lag=1.4 air=.15 spread=1 strain=.05 leader=0 stubborn=.1 wander=.1 fade=0 volume=-10 | hazed | leaning | A soft low hum that is slow to move and stays warm | pad
Oil on deep water | Bass floor | body=Reed lowShare=.6 vowel=.2 effort=.18 attack=1 release=4 people=20 lag=2 wander=.5 spread=.8 strain=.05 leader=0 | jet | leaning | Dark reeds that slide about for a long while | pad
Roots and rafters | Bass floor | body=Strings lowShare=.45 attack=.5 release=2.5 vowel=.65 effort=.7 people=36 lag=1.6 spread=1 strain=.4 leader=0 stubborn=.25 wander=.4 fade=.35 path=Slide reach=6 agreement=.3 volume=-1.5 | summer | hymn | A wide strong section of low bows that slides and takes its time | string
Long walk down | Bass floor | body=Hollow lowShare=.7 path=Steps lag=1.2 attack=.1 release=2 vowel=.5 effort=.4 people=16 vibrato=0 spread=.8 leader=.3 stubborn=.1 wander=.4 fade=0 | lateplace | lowmen | Hollow lows that go down by steps and take their time | organ
`,
    },
    {
      id: 'gathered-keys',
      name: 'Gathered keys',
      category: 'keys',
      rows: `
Hands on the pew | Gathered keys | people=20 effort=.6 vowel=.5 breath=1 release=1.2 leader=.2 | chamber | struck | Sung chords that land together and fade within a second
Rice paper screens | Gathered keys | people=10 vowel=.7 effort=.35 air=.3 breath=1.8 release=3 spread=.4 strain=.45 leader=.3 vowelSpread=.15 lowShare=-.25 volume=1 | darkplate | broken | Bright airy sung keys that fall away softly
Small round table | Gathered keys | people=4 vowel=.3 effort=.45 breath=1.2 release=.8 spread=.3 strain=.05 leader=.2 lowShare=.25 volume=-3 | plain | broken | Four people sing short dark notes, very near
Laughing in the stairs | Gathered keys | breath=.35 fade=1 vowel=.8 effort=.7 people=16 release=.6 vowelSpread=.8 strain=.65 leader=0 lowShare=-.3 volume=-0.5 | stairwell | struck | Clipped bright syllables in many vowels | plucked
Petals on piano lids | Gathered keys | effort=.2 vowel=.2 attack=.06 breath=3 fade=.7 release=5 people=14 spread=.5 strain=0 leader=.2 vowelSpread=.15 volume=-2.5 | cloud | broken | Dim soft notes with a rounded start and a slow fall
Moth keys | Gathered keys | body=Hum vowel=.6 effort=.4 breath=1.4 release=1.5 people=8 spread=.5 strain=.1 leader=.2 vowelSpread=.45 | feltair | broken | Soft hummed keys with a short fall
Warm stones | Gathered keys | body=Hum vowel=.2 effort=.35 attack=.05 fade=.5 breath=4 release=3 people=20 lowShare=.7 strain=0 leader=.2 vowelSpread=.1 vibrato=.7 | valve | broken | Dark hummed keys that sway as they hold, and gather low
Button box | Gathered keys | body=Hum vowel=.9 effort=.7 breath=.6 fade=1 release=.5 people=6 air=0 spread=.4 strain=.55 | tiny | turning | Tight little hums, dry and gone at once | plucked
Snow piano | Gathered keys | body=Hum air=.5 effort=.3 vowel=.45 attack=.03 breath=2 release=4 people=16 strain=0 leader=.2 vowelSpread=.15 | dissolve | broken | Hummed keys with as much breath as tone
Hush hush | Gathered keys | body=Hum path=Late lag=.15 vowel=.5 effort=.5 attack=.06 breath=1.1 release=2 people=12 strain=.2 leader=.3 vowelSpread=.15 volume=4.5 | pulse | broken | Hummed notes of which half come a moment late
Bottle shelf | Bottle plucks | vowel=.5 effort=.5 breath=.7 people=8 spread=.4 strain=.05 leader=.3 vowelSpread=0 stubborn=0 volume=-0.5 | wood | turning | Short blown hollow notes, evenly tuned | plucked
Stone jars | Bottle plucks | vowel=.15 effort=.3 breath=1.4 release=4 people=16 lowShare=.5 strain=.15 vowelSpread=.15 stubborn=0 volume=-6 | clay | broken | Dark hollow plucks that gather at the bottom | plucked
Pebble by pebble | Bottle plucks | vowel=.8 effort=.6 air=.1 breath=.4 release=1 people=6 strain=.45 vowelSpread=.45 stubborn=.05 lowShare=-.2 volume=-0.5 | pebble | turning | Bright hollow clicks with hardly any breath | plucked
Tea steam | Bottle plucks | air=.7 effort=.3 attack=.05 breath=1.8 fade=.7 vowel=.6 people=14 release=3 strain=.15 leader=0 vowelSpread=.2 stubborn=.05 | points | broken | Breathy hollow keys, soft at the start | keys
Marimba of fog | Bottle plucks | attack=.04 fade=.6 breath=3 vowel=.35 effort=.2 air=.15 people=20 agreement=1 vibrato=0 strain=.1 leader=0 vowelSpread=.1 stubborn=0 volume=-7.5 | hang | broken | Rounded hollow keys in pure tune that sink slowly | keys
Squeeze and let go | Gathered keys | body=Reed vowel=.4 effort=.35 breath=.8 release=.6 people=8 agreement=.4 spread=.3 strain=.2 leader=.3 vowelSpread=.3 volume=-2.5 | parlour | struck | Short reeds, a little apart in tune | keys
Toy harmonium | Gathered keys | body=Reed vowel=.4 effort=.3 fade=0 breath=8 release=.3 people=4 lowShare=-.3 spread=.3 strain=.2 vowelSpread=.05 | tiny | lullaby | Clear reeds that hold full and stop with the key | organ
Squeezebox next yard | Gathered keys | body=Reed vowel=.5 effort=.5 fade=.2 breath=2 release=.5 people=12 agreement=.15 vibrato=.4 spread=.85 strain=.2 leader=0 vowelSpread=.5 volume=-1 | wall | struck | Reeds far apart in tune that beat as they hold | organ
Clipped hedge | Gathered keys | body=Reed vowel=.15 effort=.25 breath=.4 fade=1 release=.8 people=10 strain=0 spread=.5 vowelSpread=.45 volume=0 | dotted | turning | Dark soft reeds, each gone within half a second | plucked
Rust bells | Gathered keys | body=Reed vowel=.75 effort=.6 fade=.8 breath=2.2 release=3 people=14 agreement=.3 air=.1 strain=.7 spread=.8 vowelSpread=.5 lowShare=-.2 volume=-2.5 | tank | chimes | Rough reeds that start hard and die away | bell
Plucked from the pew | Gathered keys | body=Strings vowel=.8 effort=.6 breath=.6 fade=1 people=12 release=1 spread=.4 leader=0 vowelSpread=.1 lowShare=-.45 volume=-3 | room | turning | Short bright plucks with the octave over, all together | plucked
Harp of many thumbs | Gathered keys | body=Strings vowel=.6 effort=.4 breath=1.8 fade=.9 people=20 release=3 spread=1 strain=.45 leader=0 vowelSpread=.5 volume=-1.5 | longplate | broken | Wide string notes that ring down over two seconds | plucked
Dulcimer, two hammers | Gathered keys | body=Strings vowel=.3 effort=.5 breath=1 fade=1 people=4 release=2.4 agreement=.45 spread=.25 strain=.1 leader=0 vowelSpread=.45 lowShare=.5 volume=-6.5 | spring | turning | Round struck strings, gathered low, under four pairs of hands | plucked
Low lute | Gathered keys | body=Strings vowel=.15 effort=.4 breath=1.2 fade=.9 people=8 release=1.4 lowShare=.5 spread=.8 strain=.05 leader=.3 vowelSpread=.45 | shaded | broken | Dark plucked strings that lean to the bass | plucked
Bow taps | Gathered keys | body=Strings air=.8 effort=.6 breath=.3 fade=1 vowel=.5 people=16 release=.6 spread=.5 strain=.2 vowelSpread=.15 volume=-3 | slapback | struck | Scratches of bow more than notes | plucked
Glass at each place | Gathered keys | body=Whistle vowel=.5 effort=.4 air=.05 breath=2 fade=.8 people=8 release=4 strain=.2 leader=.2 vowelSpread=.05 lowShare=-.25 volume=-1 | glasstube | chimes | Clear whistled chimes that sink evenly | bell
Wedding next door | Gathered keys | body=Whistle vowel=.8 effort=.6 air=.1 breath=1 fade=.9 people=14 release=2 agreement=.35 spread=.4 strain=.55 leader=.2 vowelSpread=.2 lowShare=-.3 volume=-2 | wall | changes | A jangle of bright whistled bells | bell
Dawn, struck once | Gathered keys | body=Whistle lowShare=-.7 air=0 breath=4 fade=.7 people=6 release=8 vibrato=0 effort=.3 agreement=.9 spread=.4 strain=.15 leader=.2 vowelSpread=.1 volume=-2.5 | shining | chimes | High pure notes that ring for a long time | bell
Spoons in the saucer | Gathered keys | body=Whistle breath=.25 fade=1 people=3 release=.2 air=.2 effort=.9 vowel=.8 spread=.5 leader=0 vowelSpread=.05 lowShare=-.4 volume=2 | stub | turning | Hard high ticks of whistle, a quarter of a second each | bell
Ice in a pewter cup | Gathered keys | body=Whistle breath=.9 fade=.6 people=4 release=2.5 air=.35 lowShare=.5 effort=.5 vibrato=.5 spread=.25 strain=.15 vowelSpread=.2 volume=-2.5 | wax | changes | Breathy chimes gathered low that tremble a little | bell
Table organ | Gathered keys | fade=0 breath=12 release=.4 people=16 vowel=.5 vowelSpread=0 effort=.5 vibrato=0 agreement=.9 spread=.8 strain=.15 volume=-2.5 | booth | struck | Plain sung chords, on and off like a switch | organ
Choir on a lever | Gathered keys | fade=0 breath=6 attack=.05 release=1 people=30 vowel=.35 vowelSpread=.1 effort=.4 vibrato=.4 strain=.45 leader=0 | rotorfast | hymn | A whole crowd that answers the key and holds | organ
Hollow stop | Gathered keys | body=Hollow fade=0 breath=12 attack=.03 release=.5 people=10 vowel=.7 effort=.6 vibrato=0 spread=.4 strain=.45 leader=.25 vowelSpread=0 lowShare=-.25 | stopped | hymn | Bright hollow pipes, instant and level | organ
Bows on a switch | Gathered keys | body=Strings fade=.1 breath=6 attack=.03 release=.5 people=24 vowel=.5 effort=.55 vibrato=.3 spread=.8 leader=.3 vowelSpread=0 lowShare=.3 volume=-0.5 | chorused | hymn | Bowed chords that come at once and stay | string
Crowd in a drawer | Gathered keys | fade=.2 breath=2 attack=.02 release=.4 people=36 vowel=.6 effort=.8 strain=.6 spread=.2 leader=0 vowelSpread=.6 | sampler | struck | Loud tight chords from the whole crowd in one spot | keys
Two to a mouthful | Gathered keys | breath=.5 fade=.5 people=8 vowel=.4 effort=.5 release=1.5 path=Steps lag=.1 spread=.4 strain=.2 vowelSpread=.45 volume=-2.5 | weave | murmurs | Spoken notes, two to a second | texture
Typing pool | Gathered keys | breath=.18 fade=.6 people=24 vowel=.7 vowelSpread=1 effort=.5 release=.8 air=.3 spread=1 leader=0 | flock | murmurs | A patter of tiny syllables over every key | texture
Skipping rhyme | Gathered keys | breath=.6 fade=.7 people=12 path=Turn reach=2 lag=.1 vowel=.55 effort=.6 release=1 lowShare=-.4 spread=.4 leader=.5 vowelSpread=.2 volume=3 | unfold | murmurs | Quick high notes with a twist at the start of each | voice
Gossip on the stairs | Gathered keys | breath=.4 fade=.4 air=.85 people=30 vowelSpread=.7 effort=.4 release=2 attack=.04 spread=.8 strain=.55 leader=0 lowShare=.3 volume=-3.5 | memory | murmurs | Whispered scraps that come back again and again | texture
Dice on felt | Gathered keys | body=Hollow breath=.2 fade=1 people=12 vowel=.4 effort=.6 release=.4 air=.2 spread=.4 strain=.45 leader=0 volume=-1 | crystals | turning | Little hollow knocks, round and dry | plucked
Canal at lunchtime | Gathered keys | people=14 breath=2.4 fade=.8 effort=.45 vowel=.4 release=4 wander=.5 spread=.4 strain=.45 volume=-3 | warmecho | broken | Sung keys where somebody strays to the octave
Returned letters | Gathered keys | people=6 breath=1.2 effort=.5 vowel=.6 release=2 attack=.02 spread=.5 strain=.2 leader=0 vowelSpread=0 lowShare=-.3 volume=-3.5 | reversed | broken | Clear short sung notes, plain and even
Lamp in seven windows | Gathered keys | body=Hum people=10 breath=1.6 vowel=.75 effort=.6 release=2.4 strain=.5 leader=0 lowShare=-.2 | stars | broken | Bright hummed keys with a quick fall
Carousel, unlit | Gathered keys | body=Reed people=6 breath=1.5 fade=.7 vowel=.6 effort=.3 release=1.5 vibrato=.7 spread=.4 strain=.2 leader=.2 vowelSpread=.45 | record | turning | Reedy notes that wobble as they sink | keys
Sunday, far off | Gathered keys | body=Whistle people=20 breath=3 fade=.8 air=.3 effort=.35 release=6 agreement=.4 attack=.03 spread=.8 strain=.1 leader=.3 | throughfog | chimes | Soft whistled bells, some of them sour | bell
Lid raised an inch | Gathered keys | effort=.1 vowel=.1 attack=.12 fade=.4 breath=5 release=3 people=18 air=.15 strain=.15 leader=.3 vowelSpread=0 lowShare=.3 | lofilter | broken | Very dark gentle keys that hold nearly level
Combed cotton | Gathered keys | body=Strings effort=.15 vowel=.3 attack=.1 fade=.6 breath=3 release=4 people=20 air=.4 spread=.4 strain=0 | hazed | broken | Soft bowed keys, half of them hair and breath
Goodbye all at once | Gathered keys | effort=.75 vowel=.65 breath=1 fade=.8 release=.3 people=20 strain=.3 spread=.8 | bright | struck | Shouted open chords that stop on the hand
Slow arithmetic | Gathered keys | body=Hollow breath=6 fade=.9 attack=.02 people=12 vowel=.6 effort=.4 release=8 vibrato=.1 spread=.5 strain=.45 leader=0 vowelSpread=.2 | tiles | broken | Hollow keys that take six seconds to run down
Kite string | Gathered keys | body=Strings lowShare=-.8 breath=1.4 fade=.9 people=8 vowel=.55 effort=.4 release=2 spread=.4 strain=.45 leader=0 volume=-3 | dust | changes | High plucked strings with the octave on top | plucked
`,
    },
    {
      id: 'glaciers',
      name: 'Slow glaciers',
      category: 'drone',
      rows: `
Years between steps | Slow glacier | lag=5.5 reach=12 vowel=.3 effort=.35 people=36 strain=0 leader=0 vowelSpread=.5 wander=.5 | coils | glacial | Everyone begins up to an octave off and takes many seconds to close in
First crack of thaw | Slow glacier | strain=.9 effort=.6 reach=7 lag=3 vowel=.6 attack=1.2 leader=0 vowelSpread=.5 wander=.6 lowShare=-.25 | thinair | glacial | A tense bright crowd that eases as it finds the chord | pad
Pale on pale | Slow glacier | reach=1 stubborn=.1 effort=.12 vowel=.4 air=.35 attack=3 release=12 wander=.1 strain=.15 leader=0 vowelSpread=.2 lowShare=.3 | glow | quartal | Pale and breathy, coming up over three seconds | pad
Settlement | Settling crowd | lag=1.8 reach=8 people=36 vowelSpread=.1 effort=.45 vowel=.5 release=4 agreement=.7 strain=.2 leader=0 stubborn=.45 lowShare=-.25 | openspace | glacial | A wide unsteady crowd that gathers itself into the chord | pad
Crowd after fireworks | Settling crowd | reach=12 lag=2.5 agreement=.3 vowelSpread=.9 effort=.5 spread=1 wander=.7 release=3 strain=.2 leader=0 stubborn=.25 | surf | crowded | Many vowels from all over, on the move for a long time | texture
Blue ice, humming | Slow glacier | body=Hum reach=6 lag=4 effort=.5 vowel=.5 air=.1 release=6 strain=.45 leader=0 vowelSpread=.2 wander=.1 | longplate | glacial | Hums that creep to the chord from well off it
Bear under the floe | Slow glacier | body=Hum lowShare=.9 vowel=.1 effort=.3 people=30 lag=5 strain=.05 leader=0 vowelSpread=.6 wander=.4 attack=1.2 | lowspace | lowsingle | A huge dark hum, much of it an octave under the note
North-facing skylight | Slow glacier | body=Hum lowShare=-.7 vowel=.8 effort=.45 attack=1.5 reach=4 people=16 strain=.25 leader=.3 vowelSpread=.15 wander=.4 volume=-2 | frost | aloft | A high bright hum drifting slowly into place | pad
Breath on the lens | Slow glacier | body=Hum air=.8 effort=.2 vowel=.6 breath=4 fade=.5 people=26 strain=.45 leader=0 vowelSpread=.2 | dissolve | quartal | Hummed air, coming and going person by person | texture
Frozen harbour | Slow glacier | body=Hum stubborn=1 lag=6 reach=2 effort=.4 vowel=.35 agreement=.8 strain=.05 leader=0 vowelSpread=0 wander=.1 attack=1.2 | darkend | leaning | A level hum in which many will not leave the old chord
Crevasse light | Slow glacier | body=Whistle reach=12 lag=5 effort=.4 air=.1 people=20 attack=1.5 strain=.15 leader=0 vowelSpread=.45 | shining | glacial | Whistles that close in slowly from as far off as an octave
Polar wires | Slow glacier | body=Whistle vibrato=0 air=0 reach=1 lag=4 people=8 effort=.3 attack=2 agreement=.9 leader=.3 vowelSpread=.1 wander=.1 | sines | fifths | A few pure whistled threads that hardly stir
Wind off the cap | Slow glacier | body=Whistle air=.9 effort=.5 vibrato=.6 reach=8 people=36 attack=2 leader=0 vowelSpread=.75 lowShare=-.25 volume=-1.5 | clouds | fifths | Broad hissing air with pitch at its core | texture
Lights nobody heard | Slow glacier | body=Whistle wander=1 lag=2.5 lowShare=-.5 effort=.35 air=.25 people=24 leader=0 volume=3 | sparkle | aloft | High whistles that keep trading notes | texture
Snow blindness | Slow glacier | body=Whistle agreement=0 reach=5 people=36 effort=.5 vowel=.8 lag=3 air=.2 leader=0 vowelSpread=.5 wander=.5 lowShare=-.25 | shifted | crowded | A glare of whistles spread out of tune | texture
Reed ice | Reed suspensions | lag=4 reach=6 people=24 release=8 attack=1.5 leader=0 vowelSpread=.45 stubborn=.45 fade=0 volume=1.5 | endless | leaning | Dark reeds that hang back for seconds before they give
Frost in the bellows | Reed suspensions | vowel=.5 effort=.35 lag=2.5 stubborn=.8 attack=.8 agreement=.8 lowShare=0 leader=.2 vowelSpread=0 wander=0 fade=0 | held | leaning | Level reeds, a few of which never leave the last chord | organ
Turbine asleep | Reed suspensions | lowShare=1 vowel=0 effort=.1 people=20 vibrato=0 lag=3 attack=1.2 leader=0 vowelSpread=.1 wander=.1 fade=0 | lowspace 1.mix=0.28 | lowsingle | Very low soft reeds that lie quite still
Long shed at evening | Reed suspensions | vowel=.8 effort=.3 reach=8 lag=3 attack=1 release=6 strain=.2 people=10 leader=.3 stubborn=.35 wander=.4 fade=0 | farshore | glacial | Bright thin reeds sliding slowly into place
Smoke that stays | Reed suspensions | air=.7 effort=.15 vowel=.25 attack=2 wander=.6 people=30 agreement=.4 leader=0 vowelSpread=.2 stubborn=.35 | smear | quartal | Reeds blown so softly that air leads the tone | texture
Moraine | Slow glacier | body=Strings reach=8 lag=4 effort=.35 vowel=.25 release=7 strain=0 leader=0 wander=.1 lowShare=.4 | nave | glacial | Dark bows that crawl in from up to eight semitones off
Silk under pressure | Slow glacier | body=Strings effort=.15 air=.5 vowel=.5 attack=2.2 reach=3 lag=3 people=24 strain=.15 leader=0 wander=.1 | mist | quartal | Faint airy bows that are slow to rise | pad
Granite strings | Slow glacier | body=Strings effort=.75 strain=.8 agreement=.25 reach=5 lag=3 attack=1 release=4 leader=0 vowelSpread=.5 wander=.1 | hallend | crowded | Hard bows far from each other in tune, grinding inward
Cold bridge, high bows | Slow glacier | body=Strings lowShare=-.6 effort=.3 vowel=.7 people=14 vibrato=.4 lag=2.5 attack=1.5 leader=.2 vowelSpread=.15 wander=.1 volume=-1.5 | hall | aloft | Thin high bows that glide and sway | pad
One hour of bowing | Slow glacier | body=Strings breath=12 vibrato=0 agreement=.95 lag=6 effort=.45 reach=0 people=30 attack=2 strain=0 leader=0 vowelSpread=0 wander=.1 | stretched | fifths | Straight bows in pure tune that take long to change
Sea cave | Slow glacier | body=Hollow reach=7 vowel=.4 air=.4 effort=.35 people=24 lag=3.5 strain=.2 leader=0 wander=.4 | darkhall | glacial | Hollow tones that slide about before they settle
Ice organ | Slow glacier | body=Hollow agreement=1 vibrato=0 reach=0 effort=.6 vowel=.8 stubborn=.1 lag=3 air=.05 leader=0 vowelSpread=0 wander=.05 lowShare=-.2 | loft | quartal | Bright hollow pipes, pure and without seams | pad
Blowhole | Slow glacier | body=Hollow air=.85 breath=1.8 fade=.8 effort=.4 lowShare=.5 people=12 attack=.8 strain=0 leader=0 vowelSpread=.5 vowel=.6 volume=-2.5 | water | fifths | Hollow breaths that swell and sink across the crowd | texture
Slow whorl underwater | Slow glacier | body=Hollow path=Turn reach=9 lag=6 effort=.5 vowel=.6 people=12 vibrato=.5 leader=0 vowelSpread=.6 wander=.4 volume=-2.5 | submerged | glacial | Hollow tones that curl widely and very slowly
Under the weir in frost | Slow glacier | body=Hollow lowShare=.8 vowel=.1 effort=.15 people=30 attack=2.5 release=10 strain=.1 leader=0 vowelSpread=.1 wander=.4 | submerged | lowmen | Dark hollow lows with no edges at all
Breathing snowfield | Whispered night | attack=2 release=8 lag=3 vowel=.5 effort=.4 people=36 breath=4 strain=.2 leader=0 stubborn=.25 lowShare=-.25 volume=0.5 | ebb | quartal | Whispers that rise and sink, with a ghost of the chord inside | texture
Frost on the choir | Whispered night | air=.75 vowel=.3 effort=.3 attack=1.5 agreement=.8 breath=8 people=24 wander=.2 strain=.1 leader=0 stubborn=.2 fade=0 lowShare=.25 | whisperhall | glacial | Airy dark voices close to one another in tune | pad
Wind in the keyhole | Whispered night | body=Whistle air=.85 effort=.6 reach=8 lag=2.5 people=14 breath=5 leader=.25 volume=-2 | narrow | single | Hissed whistles that bend slowly toward one note | texture
Night snow on canvas | Whispered night | body=Strings air=1 effort=.2 breath=3 fade=.4 people=30 attack=1.5 vowel=.4 strain=.45 leader=0 lowShare=.3 | muffled | fifths | Only the hair of many bows, with scarcely a pitch | texture
Names said to the dark | Whispered night | breath=.7 fade=.55 vowelSpread=1 effort=.7 attack=.08 people=20 lag=.3 stubborn=.5 leader=0 vowel=.7 release=.6 volume=1 | faintvoices | murmurs | Short hard whispered syllables, no two mouths the same shape | texture
Along the sea bed | Slow glacier | lowShare=1 vowel=.25 effort=.45 people=36 reach=5 lag=3.5 attack=1.2 leader=0 vowelSpread=.6 wander=.5 | firm | lowmen | The crowd slides along the bottom of the chord and under it
Two glaciers meeting | Slow glacier | lowShare=.5 stubborn=.9 agreement=.15 strain=.7 effort=.5 vowel=.4 lag=3 leader=0 vowelSpread=.15 wander=.1 volume=-3.5 | darkbox | leaning | Some low voices move and some refuse, rubbing
Mantle | Slow glacier | lowShare=.8 body=Reed vowel=.15 effort=.2 reach=4 lag=5 people=30 strain=.1 leader=0 wander=.4 | tube | fifths | Low dim reeds that take a very long time to part
Crust | Slow glacier | lowShare=.7 body=Strings effort=.6 vowel=.15 people=16 attack=.8 vibrato=0 reach=3 lag=2 strain=.15 vowelSpread=0 wander=.05 | iron | fifths | Low bows with weight on them, quite straight
Magma clock | Slow glacier | lowShare=.9 breath=2.5 fade=.6 vowel=.5 effort=.5 people=12 attack=.7 reach=2 strain=.45 leader=.25 vowelSpread=.15 wander=.1 volume=-1 | slowing | lowsingle | Low voices that swell and sink in turn
One stair an hour | Slow glacier | path=Steps lag=3 reach=0 effort=.45 vowel=.45 people=30 attack=.3 release=4 agreement=.55 strain=.15 leader=0 vowelSpread=.6 wander=.5 volume=1 | mist 1.mix=0.9 | quartal | A crowd that climbs to the new chord step by step over some seconds | pad
Orbit decay | Slow glacier | path=Turn lag=5 reach=12 effort=.4 vowel=.55 people=26 vibrato=.2 leader=0 vowelSpread=.15 wander=.4 volume=0 | turning | glacial | Voices that come in from an octave off and circle their notes slowly
Waiting for the tide | Slow glacier | path=Late lag=4 reach=3 effort=.3 vowel=.35 people=24 attack=.5 stubborn=.3 leader=0 vowelSpread=.05 wander=.1 lowShare=-.25 volume=-1.5 | muffledup | leaning | Nearly everyone holds back, then settles long after | pad
Leapt, then still | Slow glacier | path=Leap lag=3 reach=0 attack=.8 effort=.4 vowel=.6 breath=8 release=6 people=20 strain=.2 leader=0 vowelSpread=.45 wander=.1 volume=0 | hang | hymn | Voices that jump to the new chord, each in a time of its own | pad
Half the crowd asleep | Slow glacier | stubborn=1 wander=.9 lag=4 effort=.35 vowel=.5 vowelSpread=.8 agreement=.5 leader=0 | memory | leaning | Some wander, some stay for good, the chord thickens | pad
Salt plain, no wind | Slow glacier | reach=0 wander=0 agreement=.9 vibrato=.05 effort=.5 vowel=.65 attack=1.5 people=20 spread=.4 strain=.05 leader=0 vowelSpread=.1 | fifthsup | quartal | A steady open chord with no one out of place | pad
Grain elevator, dusk | Slow glacier | lag=2 reach=6 effort=.5 vowel=.4 people=20 attack=1 release=4 strain=.1 leader=0 vowelSpread=.75 wander=.4 lowShare=.4 | grains | glacial | A warm loose crowd sliding home | texture
Glass over the valley | Slow glacier | body=Whistle attack=3.5 release=12 lowShare=-.3 effort=.2 reach=2 air=.15 people=16 strain=.2 vowelSpread=.15 wander=.1 volume=0 | choirup | aloft | Whistled tones, almost four seconds in coming | pad
Slow lens | Slow glacier | vowel=.9 vowelSpread=.1 effort=.4 reach=3 people=18 attack=1.8 lag=2.5 strain=.2 leader=0 wander=.05 | notch | quartal | One wide bright vowel, gathered slowly into focus | pad
Old snow in the gully | Slow glacier | effort=.05 vowel=.1 attack=3 release=15 air=.2 people=12 spread=.5 reach=4 strain=.1 lowShare=.4 | darkplate | fifths | Twelve people, very dark and very soft, fading for ages
`,
    },
    {
      id: 'strings-on-foot',
      name: 'Strings on foot',
      category: 'string',
      rows: `
Bows over cobbles | Strings on foot | lag=1.2 reach=5 effort=.5 people=30 release=1 vowel=.2 breath=1.6 fade=.55 spread=1 leader=0 vowelSpread=.6 wander=.1 lowShare=-.25 | room | hymn | A wide section slides the nearest way and sinks in every stroke
Evening paper, strings | Strings on foot | effort=.3 vowel=.5 attack=.7 people=20 vibrato=.5 release=2 spread=.4 strain=.15 leader=0 vowelSpread=.6 stubborn=.45 wander=.1 lowShare=-.25 | reel | inner | A soft section with a generous sway
Courtyard tuning up | Strings on foot | agreement=.1 wander=.7 lag=.6 people=24 vowelSpread=.7 effort=.5 vowel=.5 reach=5 leader=0 fade=0 lowShare=.3 | openair | crowded | Bows far apart in tune, going from note to note
Serenade from below | Strings on foot | people=5 lag=.4 effort=.4 vowel=.25 attack=.2 release=.8 spread=.5 strain=.2 stubborn=.1 lowShare=.5 vibrato=.7 volume=-1.5 | steps | duet | Five dark easy bows with a broad sway
Great stair, many bows | Strings on foot | people=36 effort=.75 lag=1.6 reach=6 attack=.5 release=3 spread=1 lowShare=.35 vowel=.65 strain=.65 leader=0 vowelSpread=.5 stubborn=.45 wander=.4 | cathedral | hymn | The whole section, broad and strong, heavy below and gliding far
Gravel march | Marching bows | effort=.75 lag=.2 vowel=.7 release=.8 spread=.8 strain=.55 leader=.2 vowelSpread=.45 stubborn=.1 lowShare=-.25 | plain | hymn | Hard bright bows that step up to each chord and mark time there
Sentries in slippers | Marching bows | effort=.25 vowel=.3 lag=.5 people=12 release=1.5 air=.3 spread=.3 strain=0 leader=.6 vowelSpread=.15 stubborn=.2 fade=.25 lowShare=.3 | parlour | procession | Quiet bows walking softly by step
Stamping out the cold | Marching bows | lowShare=.7 effort=.7 lag=.25 vowel=.25 people=20 release=.6 strain=.6 leader=.2 vowelSpread=.45 volume=-9.5 | firm | lowmen | Low bows that stamp along by steps
Children on the stair | Marching bows | lowShare=-.6 vowel=.5 effort=.35 lag=.18 people=4 release=.4 spread=.8 strain=0 leader=.2 vowelSpread=.15 stubborn=.2 attack=.06 volume=1 | stairwell | procession | Four small soft bows, up high, that run in steps
Parade seen from a train | Marching bows | lag=.9 people=30 effort=.5 vowel=.5 breath=1.5 fade=.5 release=2 spread=1 strain=.2 leader=.2 lowShare=-.25 volume=3 | throughfog | hymn | Bows that walk slowly by step and thin in each stroke
Eight chairs, one lamp | Strings on foot | people=8 effort=.4 vowel=.35 lag=.3 attack=.2 vibrato=.4 spread=.6 release=.8 strain=.15 vowelSpread=.45 stubborn=.25 fade=.35 lowShare=.3 | chamber | inner | Eight players, warm and near
Two desks by the door | Strings on foot | people=4 effort=.55 vowel=.55 attack=.12 vibrato=.3 release=.5 lag=.2 spread=.3 strain=.5 vowelSpread=.15 stubborn=.05 wander=.05 lowShare=-.2 volume=-1.5 | near | duet | Four bows, clear, with little after them
Gut strings, no chairs | Strings on foot | people=6 vibrato=0 effort=.5 vowel=.7 air=.35 attack=.1 release=.7 agreement=.8 spread=.3 strain=0 leader=.6 vowelSpread=0 stubborn=.2 wander=.1 fade=0 | booth | duet | Straight grainy bows in close tune
Duo for empty cinema | Strings on foot | people=2 path=Late lag=.7 effort=.35 vowel=.3 vibrato=.6 attack=.08 release=.6 leader=.5 spread=.3 wander=.1 volume=2 | darkplate | duet | Two bows, the second always a little late
Sextet behind a curtain | Strings on foot | people=6 vowel=.15 effort=.25 attack=.4 release=1.2 lag=.4 spread=.4 strain=.05 leader=0 vowelSpread=.1 stubborn=.45 wander=.1 fade=.35 lowShare=.3 | darkbox | inner | Six bows with all the brightness kept in
Tip of the bow only | Strings on foot | effort=.15 air=.6 vowel=.4 attack=1 people=24 release=2.5 vibrato=.1 spread=1 leader=.2 vowelSpread=.1 stubborn=.1 wander=0 fade=0 | feltair | quartal | Bows barely touching, more hair than string
Ash on the strings | Strings on foot | effort=.2 air=.85 vowel=.2 people=16 attack=.8 breath=3 fade=.4 spread=.8 strain=0 leader=.3 vowelSpread=.15 wander=.1 lowShare=.25 | shaded | quartal | A dry brushing of bows with dark pitch underneath | texture
Cobweb section | Strings on foot | effort=.1 vowel=.6 attack=1.6 release=5 people=36 lag=1.5 spread=1 agreement=.4 strain=0 leader=0 vowelSpread=.75 lowShare=.3 volume=-3 | cloud | glacial | A huge faint section that takes its time | pad
Snow on the scroll | Strings on foot | effort=.2 vowel=.6 air=.3 lowShare=-.4 vibrato=.2 attack=.8 people=20 release=3 strain=.1 leader=0 stubborn=.05 volume=-1.5 | hazed | aloft | Soft high bows with breath around them | pad
Muted at the back | Strings on foot | vowel=0 effort=.3 attack=.4 people=10 release=1.8 lag=.9 vibrato=.1 spread=.8 strain=0 leader=0 vowelSpread=.2 stubborn=.25 wander=.5 lowShare=.5 | wool | leaning | Bows with every edge taken away | pad
Near the bridge | Strings on foot | vowel=.85 effort=.45 air=.5 people=10 attack=.15 vibrato=0 release=.7 lowShare=-.7 spread=.7 strain=.2 leader=0 stubborn=.35 | scooped | hymn | Ten thin glassy bows, some an octave over, with no sway
Horsehair weather | Strings on foot | effort=.9 strain=.9 agreement=.25 vowel=.6 people=20 reach=4 lag=.5 release=1 wander=.4 lowShare=.3 | combo | crowded | Pressed bows that scrape on arrival and then ease
Sparks off the bow | Strings on foot | effort=.85 vowel=.85 attack=.03 people=16 vibrato=.1 release=.5 strain=.7 spread=.8 leader=.25 vowelSpread=.15 stubborn=.2 wander=.1 lowShare=-.2 volume=0 | brightplate | struck | Hard strokes with a bite at the front
Tram brake | Strings on foot | path=Turn reach=7 lag=.8 effort=.8 vowel=.95 strain=.8 people=6 release=1.2 agreement=.4 lowShare=-.7 air=.3 spread=.8 leader=0 vowelSpread=.75 volume=1 | heads | crowded | Thin keen bows that swing widely round each note, an octave up in part | texture
Barbed wire reel | Strings on foot | path=Turn reach=2 lag=.25 effort=.65 vowel=.5 people=6 attack=.02 release=.4 vibrato=.1 spread=.4 strain=.35 leader=.6 stubborn=.2 wander=.4 fade=.35 lowShare=-.25 | tube | turning | Quick turns on hard strings
Basses coming home | Strings on foot | lowShare=.9 vowel=.55 effort=.7 people=10 attack=.06 release=.4 lag=.35 path=Turn reach=2 strain=.6 spread=.4 leader=0 vowelSpread=.45 stubborn=0 wander=.1 | narrow | bassline | Ten low bows that turn hard onto each step | bass
Cellos by the furnace | Strings on foot | lowShare=.5 vowel=.4 effort=.5 people=14 vibrato=.6 attack=.25 release=1.4 lag=.5 spread=.8 strain=.15 leader=0 vowelSpread=.5 fade=.35 volume=-18 | warmed | lowmen | Full low bows with a wide warm sway
Long tunnel bow | Strings on foot | lowShare=.7 vowel=.6 effort=.35 people=20 vibrato=0 attack=.3 release=4 breath=12 spread=.5 strain=.15 leader=0 vowelSpread=.1 stubborn=.2 wander=.1 fade=0 | shaft | fifths | Straight low bows that never change direction | drone
Timber yard | Strings on foot | lowShare=.6 path=Steps lag=.4 effort=.6 vowel=.2 attack=.04 release=.6 people=10 air=.2 spread=.4 strain=.15 leader=.45 stubborn=0 wander=0 volume=-7.5 | wood | bassline | Dark low bows that step from note to note | bass
Dark gallop | Strings on foot | lowShare=.5 path=Leap lag=.04 reach=0 attack=.02 breath=.5 fade=.7 effort=.6 vowel=.35 people=16 release=.5 spread=.8 vowelSpread=.15 stubborn=.05 wander=0 | gated | bassline | Short low bow strokes, hit and lifted | plucked
Violins on the roof | Strings on foot | lowShare=-.7 vowel=.55 effort=.5 people=24 vibrato=.6 lag=.6 release=1.5 strain=.45 leader=.3 vowelSpread=.2 wander=.1 spread=.7 | airy | duet | High swaying bows with an octave above
Thread through silver | Strings on foot | lowShare=-1 vowel=.8 effort=.3 people=8 vibrato=.2 attack=.5 release=3 agreement=.8 spread=.8 strain=.1 leader=.5 vowelSpread=.1 stubborn=.2 wander=.1 fade=0 volume=-2 | longplate | aloft | A few very high thin bows, close in tune
Swallows on one wire | Strings on foot | lowShare=-.5 breath=.7 fade=.5 effort=.5 vowel=.7 attack=.04 people=16 release=1.2 lag=.2 spread=.8 leader=0 vowelSpread=.6 stubborn=.2 volume=1.5 | flock | murmurs | High short strokes from all sides | texture
Kitchen fiddle, age nine | Strings on foot | lowShare=-.3 people=2 agreement=.2 effort=.6 vowel=.75 vibrato=0 attack=.05 release=.3 path=Slide lag=.3 spread=.25 strain=0 vowelSpread=.1 stubborn=.1 wander=.05 fade=0 | tiny | lullaby | Two straight bows not quite on the note
Choir loft strings | Strings on foot | lowShare=-.4 people=36 effort=.35 vowel=.5 attack=.9 release=4 lag=1.2 vibrato=.4 spread=.8 strain=.45 leader=0 vowelSpread=.75 wander=.6 | fifthpad | quartal | A broad high section, slow to speak | pad
Pinched and plucked | Strings on foot | path=Leap lag=.02 reach=0 attack=.01 fade=1 breath=.5 effort=.7 vowel=.3 people=10 release=.8 vibrato=0 air=.35 spread=.4 strain=.45 leader=0 vowelSpread=.2 stubborn=0 wander=.1 volume=-3.5 | plain | turning | Short dry plucks with nail on them, ten players together | plucked
Guitar with nine lives | Strings on foot | path=Leap lag=.02 reach=0 attack=.01 fade=.9 breath=2.2 effort=.4 vowel=.6 people=8 release=4 vibrato=.1 strain=.2 vowelSpread=.2 stubborn=0 wander=0 volume=-2 | warmecho | broken | Plucked notes that take two seconds to fall silent | plucked
Cloth on the strings | Strings on foot | path=Leap lag=.02 reach=0 attack=.02 fade=1 breath=.9 effort=.2 vowel=.1 people=14 release=1 air=.2 strain=.1 leader=.3 stubborn=0 wander=.1 | muffled | broken | Dull soft plucks with no ring | plucked
Zither on a sill | Strings on foot | path=Leap lag=.02 reach=0 attack=.01 fade=.9 breath=1.3 effort=.55 vowel=.75 people=6 release=2 lowShare=-.4 spread=.5 strain=.4 leader=0 vowelSpread=.45 stubborn=0 wander=0 volume=-2 | strings | changes | Bright high plucks, thin as wire | plucked
Bow bounce | Strings on foot | path=Leap lag=.03 reach=0 attack=.02 fade=.5 breath=.28 effort=.6 vowel=.5 people=24 release=.7 spread=.8 leader=0 stubborn=0 wander=.1 lowShare=-.25 volume=-2.5 | dotted | murmurs | Bouncing bows in very short strokes | texture
Fiddlers come late | Strings on foot | path=Late lag=.9 people=16 effort=.55 vowel=.55 reach=2 release=1 attack=.15 vibrato=.1 strain=.2 leader=.3 vowelSpread=.2 stubborn=.2 lowShare=-.25 volume=1 | slap | lined | Bows that wait, then lean onto the note
Turned wood | Strings on foot | path=Turn reach=3 lag=.5 people=8 effort=.25 vowel=.15 release=1.2 spread=.8 leader=0 vowelSpread=.1 stubborn=.1 wander=.4 lowShare=.4 | spring | lullaby | Soft dark bows that turn together round every note
Wake with strings | Strings on foot | path=Turn reach=1.5 lag=.35 people=6 effort=.4 vowel=.3 vibrato=.1 attack=.08 release=.8 leader=.6 spread=.3 strain=.1 stubborn=.1 wander=.05 fade=.25 volume=-2 | parlour | lullaby | A lead bow with small turns and five friends
Late train, strings | Strings on foot | path=Late lag=2.2 stubborn=.8 people=26 effort=.35 vowel=.3 attack=.2 release=1.2 spread=1 strain=.1 leader=0 vowelSpread=.05 wander=.05 fade=0 lowShare=.4 volume=-1.5 | darkhall | leaning | Dark bows, many staying on the last chord
Dance in a power cut | Strings on foot | path=Late lag=.5 vibrato=.9 people=10 effort=.4 vowel=.45 attack=.2 release=1.2 reach=3 spread=.85 leader=0 vowelSpread=.6 stubborn=.1 lowShare=.3 volume=-1 | record | lullaby | Late swooning bows with a very wide sway
Strings on a spool | Strings on foot | people=14 effort=.45 vowel=.4 breath=3 fade=.3 lag=.5 release=1.5 vibrato=.3 spread=.8 leader=.25 vowelSpread=.2 stubborn=.35 | loop | inner | Bowed lines that ease off at the end of each stroke
Rosin cloud | Strings on foot | people=16 air=.4 effort=.65 vowel=.3 wander=.6 attack=.6 release=3 lag=1 spread=.8 strain=.6 leader=0 vowelSpread=.5 stubborn=.25 lowShare=.5 | grains 1.mix=0.5 | quartal | Rough airy bows, gathered low, that trade notes | texture
Dust down a sunbeam | Strings on foot | people=20 effort=.3 vowel=.65 attack=1 release=4 lag=1.5 reach=6 strain=.15 leader=0 stubborn=.25 wander=.1 | sparkle | glacial | Soft bows gliding in from well off the note | pad
Ballroom through a floor | Strings on foot | people=24 effort=.5 vowel=.5 vibrato=.5 attack=.3 release=1.5 spread=1 strain=.05 leader=0 vowelSpread=.75 wander=.4 | pillow | hymn | A full section with a wide sway, heard small
Bow without a player | Strings on foot | people=10 attack=1.5 release=5 effort=.3 vowel=.4 vibrato=0 agreement=1 reach=0 strain=.1 leader=.2 vowelSpread=.05 stubborn=.05 wander=.05 fade=0 | mirror | quartal | Straight bows in pure tune that swell from nothing | pad
`,
    },
    {
      id: 'quarrels',
      name: 'Quarrels',
      category: 'texture',
      rows: `
Town meeting | Quarrel | body=Open people=30 effort=.6 vowel=.2 agreement=.1 lag=.6 release=1.5 breath=2.2 fade=.4 spread=1 leader=0 vowelSpread=.6 lowShare=.25 | room | crowded | Dark voices far out of tune, many standing on the last chord | voice
Brothers over a wall | Quarrel | body=Open people=4 effort=.65 vowel=.5 path=Turn reach=4 lag=.35 attack=.06 release=.5 spread=.45 leader=.2 vowelSpread=.2 fade=.35 strain=.6 volume=4.5 | openair | answering | Four strained voices that throw turns at each other | voice
Nobody sat down | Quarrel | body=Open vowelSpread=1 effort=.45 air=.3 people=36 lag=1.2 spread=1 release=2.5 leader=0 lowShare=.3 | hallend | crowded | Every vowel at once from everywhere, stubborn and loose
Doorstep row | Quarrel | body=Open people=8 breath=.7 fade=.5 effort=.8 vowel=.7 attack=.03 release=.5 spread=.8 leader=.35 vowelSpread=.2 volume=0.5 | slapback | murmurs | Hard short syllables that do not line up | voice
Verdict delayed | Quarrel | body=Open path=Late lag=2.5 stubborn=1 effort=.35 vowel=.3 people=24 attack=.8 release=4 spread=1 leader=0 vowelSpread=.5 lowShare=.4 | darkhall | leaning | A dark crowd that leaves the old chord late or never | pad
Geese on the parapet | Quarrel | vowelSpread=.7 effort=.6 vowel=.65 reach=6 people=12 lag=.4 attack=.04 release=.8 breath=1.2 fade=.3 spread=.8 leader=0 lowShare=-.3 volume=1 | stairwell | crowded | Honking reeds that swoop in out of tune
Sour accordion | Quarrel | people=8 stubborn=.1 vibrato=.5 effort=.35 vowel=.35 lag=.2 attack=.05 release=.4 reach=0 spread=.4 leader=0 vowelSpread=.5 fade=0 | parlour | lullaby | Reeds a good way out of tune with one another, beating hard | organ
Hornets in the organ | Quarrel | vowel=.8 vowelSpread=.9 effort=.6 people=30 breath=.4 strain=.5 wander=.9 spread=1 attack=.02 leader=0 volume=0.5 | shaker | crowded | Buzzing reeds in short breaths, moving all the time
Harbour horns | Quarrel | lowShare=.8 vowel=.2 effort=.5 people=14 reach=2 lag=1.5 attack=.3 release=2.5 vowelSpread=.2 fade=0 | farshore | lowmen | Low reeds that beat against each other and answer late | drone
Reed market closing | Quarrel | path=Steps lag=.4 effort=.4 vowel=.4 people=20 attack=.03 release=1 reach=0 spread=.4 leader=.2 vowelSpread=.15 fade=0 strain=.5 | dusty | hymn | Reeds that walk to the chord in steps, each in its own tuning | organ
Gulls over the tip | Quarrel | body=Whistle effort=.7 reach=10 people=16 path=Turn lag=.5 air=.2 breath=1.5 fade=.4 spread=1 leader=0 vowelSpread=.5 volume=5 | surf | aloft | Whistles that wheel and slide widely, all out of tune
Wet finger, dry glass | Quarrel | body=Whistle effort=.3 people=10 air=.05 stubborn=.6 lag=1.5 attack=.6 release=4 reach=1 strain=.2 spread=.5 leader=.3 vowelSpread=.05 fade=0 lowShare=.3 | shifted | quartal | Clean whistled tones that beat and will not move together
Bottle smash, slowed | Quarrel | body=Whistle path=Leap lag=.02 attack=.01 fade=1 breath=1.2 reach=0 people=20 agreement=0 release=3 leader=0 vowelSpread=.5 | tank | changes | Struck whistles as far apart in tune as they go | bell
Drain pipes disagree | Quarrel | body=Hollow effort=.5 vowel=.5 people=14 air=.3 lag=1 release=2 attack=.2 leader=.2 vowelSpread=.15 | shaft | leaning | Hollow tones that rub and hang on to the last chord
Flue argument | Quarrel | body=Hollow breath=.5 fade=.5 air=.5 people=24 vowel=.7 effort=.5 attack=.03 release=1 spread=.9 leader=0 vowelSpread=.6 lowShare=.3 volume=0.5 | pattering | murmurs | Puffed hollow syllables from all over
Bus queue prayer | Murmured prayers | agreement=.2 stubborn=.7 effort=.5 vowel=.4 people=24 breath=.45 strain=.2 leader=0 wander=.1 | shared | murmurs | Muttered syllables in several tunings, over and over
Auction at noon | Murmured prayers | effort=.75 vowel=.7 leader=.6 breath=.25 people=16 air=.1 path=Leap lag=.05 spread=.5 strain=.55 stubborn=0 wander=.05 | near | murmurs | Quick hard syllables with one caller in front | voice
Crowd on an escalator | Murmured prayers | path=Slide lag=1.5 reach=8 breath=1 wander=.8 vowel=.5 people=36 effort=.4 spread=.8 leader=0 stubborn=.45 lowShare=.3 | stumble | crowded | Syllables that slide up and down as they are said
Old friends, small talk | Murmured prayers | people=6 vowelSpread=.6 effort=.3 vowel=.35 air=.3 breath=.6 spread=.4 release=.8 reach=.5 strain=.1 stubborn=.05 wander=.1 | booth | murmurs | Six people mutter softly, close by | voice
Radio between stations | Murmured prayers | breath=.2 vowelSpread=1 vowel=.6 agreement=.1 people=30 effort=.5 air=.2 spread=.8 strain=.2 leader=0 lowShare=-.25 | wireless | crowded | Fragments of syllables in every vowel
Secrets kept badly | Whispered night | breath=.5 effort=.6 attack=.04 people=20 agreement=.1 reach=2 lag=.4 strain=.65 leader=0 stubborn=.2 fade=.35 lowShare=-.25 volume=0 | bright | murmurs | Whispers in short bright scraps
Stalls before the lights | Whispered night | people=36 breath=.8 fade=.3 vowel=.3 effort=.35 lag=1 attack=.1 release=2 strain=0 leader=0 stubborn=.45 lowShare=.25 volume=1 | darkplate | crowded | A dark rustle of whispers over a hidden chord
Wind has opinions | Whispered night | body=Whistle breath=2.5 vowelSpread=.5 effort=.7 reach=12 lag=1 people=18 attack=.3 air=.85 leader=.25 stubborn=.1 fade=.35 lowShare=-.25 volume=1.5 | jet | answering | Hissing whistles that slide an octave to their note
Leaves in an empty hall | Whispered night | body=Hollow air=.95 breath=.6 fade=.7 people=24 effort=.5 attack=.02 vowel=.8 lag=.3 strain=.55 leader=0 stubborn=.05 lowShare=-.25 volume=2.5 | leaves | murmurs | Puffs of hollow air, hardly pitched
Two asleep, one awake | Whispered night | people=6 leader=.7 air=.6 effort=.4 breath=3 lag=1.2 vowel=.5 attack=.4 spread=.5 strain=.05 stubborn=.2 | swaying | lullaby | One breathy voice and a few whispers round it | voice
Violas disagree | Quarrel | body=Strings effort=.4 vowel=.65 people=8 lag=1 vibrato=.4 release=1.8 strain=.5 spread=1 leader=.25 fade=.25 lowShare=0 air=.35 | hall | leaning | Eight grainy bows in several tunings, some stuck on the last chord | string
Saw and fiddle | Quarrel | body=Strings effort=.85 vowel=.8 people=4 reach=5 lag=.3 attack=.03 release=.5 vibrato=.1 spread=.3 leader=.6 volume=0.5 | pressed | answering | Raw scraping bows that swoop | string
Broken quartet | Quarrel | body=Strings path=Steps lag=.25 people=4 effort=.5 vowel=.25 attack=.02 release=.6 stubborn=.8 leader=.35 lowShare=.45 vowelSpread=.1 volume=0 | doubled | struck | Four dark bows that step at different times in different tunings | string
Swarm in the cello case | Quarrel | body=Strings breath=.25 lowShare=.5 vowelSpread=.8 effort=.5 vowel=.5 people=36 attack=.02 wander=1 air=.3 spread=.8 leader=0 fade=.35 volume=3 | pillow | lowsingle | A low swarm of tiny bow strokes
Wreck of a waltz | Quarrel | body=Strings path=Turn lag=.9 vibrato=.9 people=6 effort=.6 vowel=.75 attack=.2 release=1.5 stubborn=.5 leader=0 vowelSpread=.6 lowShare=-.2 reach=5 | floorhiss | lullaby | Six bright bows turn with a wide wobble, none in tune with another | string
Old chord still here | - | stubborn=1 lag=1.5 people=36 vowel=.45 effort=.4 attack=.5 release=3 agreement=.7 wander=0 strain=.15 leader=0 vowelSpread=.1 fade=0 | sustained | leaning | Gentle and nearly in tune, but many hang on to the last chord | pad
Ghost harmony | - | stubborn=.9 lag=3 body=Hum vowel=.6 vowelSpread=.7 effort=.45 people=30 attack=.6 release=4 spread=.9 strain=.45 leader=0 | dissolving | leaning | A hum that carries the last chord inside the next | pad
Reluctant reeds | - | stubborn=1 lag=2 body=Reed vowel=.55 effort=.4 people=12 agreement=.9 attack=.6 release=3 vibrato=.1 spread=1 strain=0 leader=0 vowelSpread=.1 lowShare=-.2 | bowedin | leaning | Twelve in-tune reeds, suspended over every change | pad
Pipes that remember | - | stubborn=.9 lag=2 body=Hollow vowel=.5 effort=.4 people=20 agreement=.8 attack=.3 release=2.5 spread=1 strain=.45 vowelSpread=.15 wander=.4 fade=0 | lateplace 1.mix=0.4 | leaning | Hollow tones hang over from each chord to the next | organ
Glass grudge | - | stubborn=1 lag=1 body=Whistle effort=.35 air=.1 people=16 agreement=.6 attack=.4 release=4 lowShare=-.3 spread=.5 strain=.2 leader=.25 vowelSpread=.45 wander=.4 volume=1 | wakes | aloft | Whistles that keep the last note going against the new | pad
Both clocks striking | Quarrel | path=Leap lag=.02 attack=.01 breath=.8 fade=.8 body=Open people=12 effort=.6 vowel=.5 release=1 reach=0 spread=.4 leader=.3 vowelSpread=.15 | round | struck | Sung notes hit together, each in its own tuning | keys
Argument in code | Quarrel | path=Leap lag=.05 attack=.01 breath=.18 fade=.4 people=10 effort=.4 vowel=.45 reach=0 release=.4 spread=.8 lowShare=-.25 strain=.4 volume=-2 | weave | murmurs | Reed blips, ten people tapping at once
Card table | Quarrel | path=Leap lag=.02 attack=.01 breath=.4 fade=1 body=Strings people=8 effort=.6 vowel=.6 reach=0 release=.6 spread=.5 leader=.2 vowelSpread=.15 volume=-0.5 | stub | turning | Plucks that clash a little and die soon | plucked
Interrupting | Quarrel | path=Turn reach=3 lag=.15 breath=.6 fade=.4 body=Open people=20 effort=.65 vowel=.15 attack=.02 release=.6 leader=.25 vowelSpread=.15 lowShare=.35 strain=.4 volume=1 | darkecho | answering | Dark strong turned syllables cutting across each other | voice
Spilled marbles | Quarrel | path=Leap lag=.02 attack=.01 breath=.3 fade=1 body=Hollow people=20 effort=.6 vowel=.9 reach=0 release=1.5 spread=.4 leader=.2 vowelSpread=.2 volume=3.5 | crystals | turning | Tiny hollow knocks, scattered in pitch | plucked
Cellar full of uncles | Quarrel | body=Open lowShare=.9 effort=.55 vowel=.3 people=20 lag=.8 release=1.5 attack=.15 spread=.2 leader=0 vowelSpread=.75 | iron | lowmen | Rough low voices out of tune with the floor | bass
Undertow quarrel | Quarrel | body=Hum lowShare=.8 effort=.5 vowel=.2 people=26 lag=1.5 attack=.5 release=3 leader=0 vowelSpread=.45 fade=0 | submerged | lowmen | Low hums that rub together and change late | drone
Trench reeds | Quarrel | lowShare=1 vowel=.05 effort=.3 people=10 stubborn=.5 lag=.5 attack=.1 release=1 strain=.4 spread=.3 leader=0 | muffled | bassline | Dull low reeds that beat slowly | bass
Wolves in the cutting | Quarrel | body=Open lowShare=.4 reach=12 lag=2 effort=.65 vowel=.4 people=10 attack=.4 release=3 vibrato=.3 spread=.8 volume=-5 | valley | lowmen | Howls that slide from as much as an octave off
Plank over a ditch | Quarrel | body=Strings lowShare=.7 path=Leap lag=.03 attack=.01 breath=1 fade=.9 effort=.5 vowel=.2 people=14 reach=0 release=1 spread=.5 vowelSpread=.15 volume=-6 | giant | bassline | Low plucked strings that do not quite agree | plucked
Making up | Quarrel | strain=.2 vowelSpread=.5 effort=.2 vowel=.4 body=Open people=20 agreement=.5 stubborn=.4 air=.25 attack=.8 release=4 lag=1.5 spread=.5 leader=0 | glow | quartal | Soft voices a little apart that come round slowly | pad
After the shouting | Quarrel | body=Hum strain=.1 effort=.3 people=16 agreement=.4 vowel=.25 attack=1 release=5 lag=2 stubborn=.5 air=.6 leader=0 vowelSpread=.5 lowShare=.6 | cloud | leaning | A breathy loose hum, gathered low, tired and slow to move | pad
Truce at the river | Quarrel | body=Hollow strain=.1 effort=.3 vowel=.35 people=24 agreement=.35 attack=1.2 release=5 lag=1.5 stubborn=.3 spread=1 leader=0 lowShare=-.25 volume=-8.5 | water | quartal | Hollow tones slightly apart that never stop beating | pad
Shared umbrella | Quarrel | body=Reed strain=0 effort=.1 vowel=.15 people=12 agreement=.5 stubborn=.2 attack=.6 release=3 air=.2 lag=.8 leader=0 vowelSpread=.5 lowShare=.4 | rain | inner | Soft dark reeds just out of tune with one another | pad
All talking, all kind | Quarrel | body=Open path=Slide breath=1.4 fade=.4 strain=.1 vowelSpread=.9 effort=.3 vowel=.55 people=36 agreement=.45 stubborn=.2 release=3 attack=.2 leader=0 lowShare=.3 | quietup | quartal | A gentle babble of breaths, each starting somewhere else
`,
    },
    // END
  ],
}
