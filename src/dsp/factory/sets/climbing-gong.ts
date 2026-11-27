import { type InstrumentSet } from './set'

// The set of Climbing Gong: ten ways of touching the metal, from a roll before
// dawn to a bell under felt. Each direction has ten families of five, and each
// family its own metal, beater and climb; threshold, roar, sympathy and width
// differ inside a family. A third of the chains are close and
// dry, since the climb is the room of this instrument; long reverbs stand alone.

export const SET: InstrumentSet = {
  device: 'climbing-gong',
  names: {
    metal: ['Fifths', 'Harmonic', 'Sixths', 'Golden', 'Silver', 'Plate'],
    beater: ['Felt', 'Yarn', 'Wood', 'Brush', 'Bow'],
  },
  chains: {
    // Close: a tone control, a width, a small room.
    dry: { effects: [{ deviceId: 'ambient-eq', preset: 'Keys' }], words: ', close and dry' },
    warm: { effects: [{ deviceId: 'ambient-eq', preset: 'Warm' }], words: ', warm and close' },
    shaded: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Shaded' }],
      words: ', with its top shaded',
    },
    bright: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Bright', params: { air: 5, presence: 4 } }],
      words: ', bright and dry',
    },
    thin: { effects: [{ deviceId: 'ambient-eq', preset: 'Thin' }], words: ', in a thin band' },
    deep: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Deep', params: { low: 6 } }],
      words: ', with its lows raised',
    },
    muffled: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Muffled' }],
      words: ', behind a heavy curtain',
    },
    hollow: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Hollow' }],
      words: ', with its middle hollowed out',
    },
    centre: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Narrow' },
        { deviceId: 'tamer', preset: 'Gentle' },
      ],
      words: ', drawn in to the middle',
    },
    widetop: {
      effects: [{ deviceId: 'spread', preset: 'Wide top' }],
      words: ', with its top spread wide',
    },
    edges: {
      effects: [
        { deviceId: 'spread', preset: 'Hazy edges' },
        { deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.15 } },
      ],
      words: ', with hazy edges in a tight chamber',
    },
    room: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } }],
      words: ', in a small room',
    },
    chamber: {
      effects: [
        { deviceId: 'hall-reverb', preset: 'Tight chamber' },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: ', in a tight chamber',
    },
    booth: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Small booth' }],
      words: ', in a small booth',
    },
    box: {
      effects: [{ deviceId: 'expanse', preset: 'Small box', params: { mix: 0.28 } }],
      words: ', in a little box of a room',
    },
    tightplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Tight room' }],
      words: ', on a very short plate',
    },
    nearmic: {
      effects: [{ deviceId: 'distance', preset: 'Close mic' }],
      words: ', at a close microphone',
    },
    steps: {
      effects: [{ deviceId: 'distance', preset: 'Across the room' }],
      words: ', from across the room',
    },
    // Drive, tape and worn things.
    deck: {
      effects: [{ deviceId: 'tape', preset: 'Mastering deck' }],
      words: ', on a clean tape deck',
    },
    cassette: {
      effects: [{ deviceId: 'tape', preset: 'Cassette four-track' }],
      words: ', on a cassette',
    },
    blanket: {
      effects: [{ deviceId: 'tape', preset: 'Under a blanket' }],
      words: ', on dull tape',
    },
    seasick: {
      effects: [
        { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.7 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', on tape that sways in a room',
    },
    reel: {
      effects: [
        { deviceId: 'patina', preset: 'New tape' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.15 } },
      ],
      words: ', on a new reel and a small plate',
    },
    record: {
      effects: [{ deviceId: 'patina', preset: 'Dusty record', params: { noise: 0.35 } }],
      words: ', on a dusty record',
    },
    vinyl: {
      effects: [{ deviceId: 'vinyl', preset: 'Charity shop find', params: { crackle: 0.25 } }],
      words: ', on an old record',
    },
    sampler: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Glaze' },
        { deviceId: 'ambient-eq', preset: 'Shaded' },
      ],
      words: ', through an old converter',
    },
    valve: {
      effects: [{ deviceId: 'analog-drive', preset: 'Triode glow' }],
      words: ', through a warm valve',
    },
    iron: {
      effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }],
      words: ', through warm iron',
    },
    fuzz: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { mix: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', through a dark fuzz in a room',
    },
    console: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Sheen' },
        { deviceId: 'plate-reverb', preset: 'Faint sheen' },
      ],
      words: ', through a bright desk',
    },
    softtape: {
      effects: [
        { deviceId: 'saturator', preset: 'Soft tape warmth' },
        { deviceId: 'ether-reverb', preset: 'Faint air' },
      ],
      words: ', with a soft drive and a little air',
    },
    folded: {
      effects: [
        { deviceId: 'saturator', preset: 'Folded glass', params: { mix: 0.25 } },
        { deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.2 } },
      ],
      words: ', with a folded edge in a bright hall',
    },
    combo: {
      effects: [{ deviceId: 're-amp', preset: 'Combo in a room' }],
      words: ', from an amplifier in a room',
    },
    pillow: {
      effects: [{ deviceId: 're-amp', preset: 'Pillow speaker' }],
      words: ', from a speaker under a pillow',
    },
    downhall: {
      effects: [{ deviceId: 're-amp', preset: 'Down the hall' }],
      words: ', from a speaker down the hall',
    },
    radio: {
      effects: [{ deviceId: 'radio', preset: 'Clean transistor' }],
      words: ', out of a small radio',
    },
    haze: {
      effects: [{ deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.22 } }],
      words: ', with a fuzzy warmth behind it',
    },
    howl: {
      effects: [
        { deviceId: 'howl', preset: 'Faint sustain' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', with a faint howl that holds on',
    },
    // Bodies.
    woodbody: {
      effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.5 } }],
      words: ', inside a wooden body',
    },
    pipe: {
      effects: [
        { deviceId: 'vessel', preset: 'Inside a pipe', params: { mix: 0.5 } },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', inside a pipe',
    },
    cistern: {
      effects: [{ deviceId: 'vessel', preset: 'Cistern', params: { mix: 0.5 } }],
      words: ', down in a cistern',
    },
    vowel: {
      effects: [
        { deviceId: 'imprint', preset: 'Round vowel' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', shaped like a round vowel in a hall',
    },
    giant: {
      effects: [
        { deviceId: 'size', preset: 'Larger' },
        { deviceId: 'hall-reverb', preset: 'Warm undertow', params: { mix: 0.2 } },
      ],
      words: ', made larger in a warm room',
    },
    tiny: {
      effects: [
        { deviceId: 'size', preset: 'Smaller' },
        { deviceId: 'plate-reverb', preset: 'Small plate' },
      ],
      words: ', made smaller on a little plate',
    },
    // Movement.
    trem: {
      effects: [
        { deviceId: 'tremolo', preset: 'Amp tremolo' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', through a steady tremolo',
    },
    harmonic: {
      effects: [
        { deviceId: 'tremolo', preset: 'Tilting tone' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: ', with its tone tilting slowly',
    },
    pan: {
      effects: [
        { deviceId: 'tremolo', preset: 'Slow pan' },
        { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.25 } },
      ],
      words: ', drifting from side to side in air',
    },
    rotary: {
      effects: [{ deviceId: 'rotary', preset: 'Chorale' }],
      words: ', through slow rotors',
    },
    spin: {
      effects: [{ deviceId: 'rotary', preset: 'Far shimmer' }],
      words: ', through fast rotors far away',
    },
    chorus: {
      effects: [{ deviceId: 'chorus', preset: 'Slow drift' }],
      words: ', doubled by a slow chorus',
    },
    ensemble: {
      effects: [
        { deviceId: 'chorus', preset: 'Lush ensemble' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
      ],
      words: ', thickened and set in a hall',
    },
    detune: {
      effects: [{ deviceId: 'stereo-detune', preset: 'Wider' }],
      words: ', split a little to both sides',
    },
    phaser: {
      effects: [
        { deviceId: 'phaser', preset: 'Slow swirl' },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
      ],
      words: ', in a slow swirl on a dark plate',
    },
    flanger: {
      effects: [{ deviceId: 'flanger', preset: 'Slow sweep', params: { mix: 0.4 } }],
      words: ', under a slow comb',
    },
    sweep: {
      effects: [
        {
          deviceId: 'auto-filter',
          preset: 'Glacial low-pass',
          params: { lfoRateHz: 0.15, lfoAmount: 60 },
        },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.2 } },
      ],
      words: ', under a filter that opens and shuts',
    },
    bloomfilter: {
      effects: [{ deviceId: 'auto-filter', preset: 'Soft bloom' }],
      words: ', through a filter each note opens',
    },
    notch: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Slow notch' },
        { deviceId: 'ether-reverb', preset: 'Room' },
      ],
      words: ', with a notch moving through it',
    },
    highpass: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Falling high-pass' },
        { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.25 } },
      ],
      words: ', thinned by a filter that falls',
    },
    around: {
      effects: [
        { deviceId: 'around', preset: 'Slow circle' },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', walking in a slow circle',
    },
    currents: {
      effects: [{ deviceId: 'currents', preset: 'Breaking waves' }],
      words: ', with its bands coming in waves',
    },
    ripples: {
      effects: [
        { deviceId: 'currents', preset: 'Ripples' },
        { deviceId: 'fdn-reverb', preset: 'Room' },
      ],
      words: ', rippling band by band in a room',
    },
    glimmer: {
      effects: [{ deviceId: 'glimmer', preset: 'Light on water' }],
      words: ', with every tone twinkling by itself',
    },
    lungs: {
      effects: [{ deviceId: 'breath', preset: 'Short of breath' }],
      words: ', on short quick breaths',
    },
    throb: {
      effects: [
        { deviceId: 'pulses', preset: 'Soft throb' },
        { deviceId: 'hall-reverb', preset: 'Room' },
      ],
      words: ', in soft even throbs',
    },
    slowing: {
      effects: [{ deviceId: 'winding-down', preset: 'Three, deep', params: { depth: 0.75 } }],
      words: ', under pulses that slow without end',
    },
    bandpulse: {
      effects: [{ deviceId: 'band-pulse', preset: 'Three a second' }],
      words: ', with its middle pulsing',
    },
    vibrato: {
      effects: [
        { deviceId: 'late-vibrato', preset: 'Slow bow' },
        { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.22 } },
      ],
      words: ', with a late vibrato in a hall',
    },
    flock: {
      effects: [{ deviceId: 'murmuration', preset: 'Evening flock' }],
      words: ', as a small flock in the air',
    },
    weather: {
      effects: [{ deviceId: 'weather', preset: 'Passing clouds' }],
      words: ', as clouds pass over',
    },
    surf: {
      effects: [{ deviceId: 'weather', preset: 'Slow surf', params: { voice: 0.25 } }],
      words: ', with slow surf washing over',
    },
    underwater: {
      effects: [{ deviceId: 'underwater', preset: 'Just under' }],
      words: ', just under water',
    },
    seasons: {
      effects: [{ deviceId: 'seasons', preset: 'Deep winter' }],
      words: ', in thin winter air',
    },
    // Echoes.
    slap: {
      effects: [{ deviceId: 'tape-echo', preset: 'Single slap' }],
      words: ', with one short slap',
    },
    tapeecho: {
      effects: [{ deviceId: 'tape-echo', preset: 'Warm repeats' }],
      words: ', with warm tape repeats',
    },
    dotted: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Dotted bounce' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', with echoes that skip',
    },
    darkecho: {
      effects: [{ deviceId: 'analog-delay', preset: 'Dark echo' }],
      words: ', with dark soft echoes',
    },
    stars: {
      effects: [{ deviceId: 'constellation', preset: 'Scattered seven' }],
      words: ', with seven scattered echoes',
    },
    stone: {
      effects: [{ deviceId: 'skipping-stone', preset: 'Skipping stone' }],
      words: ', with echoes skipping away',
    },
    canon: {
      effects: [{ deviceId: 'canon', preset: 'Faint answer', params: { mix: 0.3 } }],
      words: ', with a faint answer later',
    },
    crystals: {
      effects: [{ deviceId: 'grain-delay', preset: 'High glitter' }],
      words: ', with grains glittering above',
    },
    backwards: {
      effects: [{ deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.35 } }],
      words: ', with slow echoes played backwards',
    },
    prism: {
      effects: [{ deviceId: 'prism', preset: 'Low to high' }],
      words: ', unfolding from low to high',
    },
    memory: {
      effects: [{ deviceId: 'echo-memory', preset: 'Hazy past' }],
      words: ', with hazy echoes of before',
    },
    loop: {
      effects: [{ deviceId: 'tape-loop', preset: 'One second round' }],
      words: ', going round on a short tape loop',
    },
    orbits: {
      effects: [{ deviceId: 'orbits', preset: 'Pulse pair' }],
      words: ', with two loops out of step',
    },
    // Spectral and grain.
    mist: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist' }],
      words: ', hanging on as mist',
    },
    glassblur: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Glass halo' }],
      words: ', under a halo of glass',
    },
    cloud: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Soft cloud' }],
      words: ', inside a soft cloud of grains',
    },
    lowtide: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Low tide', params: { mix: 0.4 } }],
      words: ', with slow grains an octave under',
    },
    fog: { effects: [{ deviceId: 'fog', preset: 'Soft cloud' }], words: ', blurred into a cloud' },
    sustain: {
      effects: [{ deviceId: 'sustainer', preset: 'Slow strings', params: { mix: 0.4 } }],
      words: ', with the chord caught and held',
    },
    shadow: {
      effects: [{ deviceId: 'sine-shadow', preset: 'Long linger' }],
      words: ', with pure tones lingering behind',
    },
    stretch: {
      effects: [
        { deviceId: 'stretch', preset: 'Near shadow' },
        { deviceId: 'ambient-eq', preset: 'Warm' },
      ],
      words: ', trailing a stretched shadow',
    },
    falling: {
      effects: [{ deviceId: 'falling', preset: 'Falling leaves' }],
      words: ', with pieces falling like leaves',
    },
    glints: {
      effects: [
        { deviceId: 'glints', preset: 'First light' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', throwing off bright glints',
    },
    follower: {
      effects: [{ deviceId: 'pad-follower', preset: 'String pad', params: { mix: 0.35 } }],
      words: ', with a soft pad growing behind',
    },
    rooms: {
      effects: [{ deviceId: 'generations', preset: 'Quick to tones', params: { mix: 0.4 } }],
      words: ', dissolving into the tones of a room',
    },
    melt: {
      effects: [{ deviceId: 'melt', preset: 'Soft sag', params: { mix: 0.35 } }],
      words: ', over a tail that sags like wax',
    },
    looper: {
      effects: [
        { deviceId: 'micro-looper', preset: 'Drifting' },
        { deviceId: 'ambient-eq', preset: 'Distant' },
      ],
      words: ', over a drifting loop of itself',
    },
    half: {
      effects: [{ deviceId: 'half-speed', preset: 'Under the mix' }],
      words: ', with its half speed shadow under it',
    },
    sift: {
      effects: [{ deviceId: 'sift', preset: 'Breath and tone' }],
      words: ', with its strokes sifted to air',
    },
    reveal: {
      effects: [{ deviceId: 'reveal', preset: 'Overtones' }],
      words: ', with its quiet overtones drawn out',
    },
    // Pitch.
    highhalo: {
      effects: [
        { deviceId: 'octaves', preset: 'Slow halo' },
        { deviceId: 'hall-reverb', preset: 'Airy tail', params: { mix: 0.2 } },
      ],
      words: ', with slow octaves above',
    },
    subs: {
      effects: [{ deviceId: 'octaves', preset: 'Slow pedals', params: { sub2: 0.5 } }],
      words: ', with slow pedals underneath',
    },
    flutes: {
      effects: [{ deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.5 } }],
      words: ', with flute pipes joining in',
    },
    shimmer: {
      effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.3 } }],
      words: ', under a tail that climbs in octaves',
    },
    bloomtail: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Octave halo', params: { mix: 0.3 } }],
      words: ', with a tail opening an octave up',
    },
    stillwater: {
      effects: [{ deviceId: 'freq-shifter', preset: 'Still water' }],
      words: ', phasing as still water does',
    },
    spiral: {
      effects: [{ deviceId: 'spiral', preset: 'Slow ascent', params: { mix: 0.3 } }],
      words: ', with a tail that climbs for ever',
    },
    // Rooms that answer in tune.
    bowls: {
      effects: [{ deviceId: 'bowls', preset: 'Bowl table', params: { mix: 0.3 } }],
      words: ', waking a table of bowls',
    },
    pedal: {
      effects: [{ deviceId: 'sympathetic', preset: 'Piano pedal', params: { mix: 0.4 } }],
      words: ', over strings that ring along',
    },
    silent: {
      effects: [{ deviceId: 'silent-keys', preset: 'Wide major nine', params: { mix: 0.4 } }],
      words: ', waking a silent chord of strings',
    },
    chapel: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.3 } }],
      words: ', in a chapel that sings ah',
    },
    monks: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.35 } }],
      words: ', in a vault of low voices',
    },
    // Rooms, halls and the far away.
    hall: { effects: [{ deviceId: 'hall-reverb', preset: 'Hall' }], words: ', in a hall' },
    nave: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.38 } }],
      words: ', in a vast nave',
    },
    darkhall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall' }],
      words: ', in a dark hall',
    },
    plate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.28 } }],
      words: ', on a medium plate',
    },
    longplate: {
      effects: [
        { deviceId: 'plate-reverb', preset: 'Long plate' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', on a long plate',
    },
    brightplate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Bright plate' }],
      words: ', on a bright plate',
    },
    cave: { effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave' }], words: ', in a dark cave' },
    valley: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.35 } }],
      words: ', across an open valley',
    },
    expanse: {
      effects: [{ deviceId: 'expanse', preset: 'Open space' }],
      words: ', in a wide open space',
    },
    thinair: {
      effects: [{ deviceId: 'expanse', preset: 'Thin air' }],
      words: ', in thin high air',
    },
    spring: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank' }],
      words: ', through a spring tank',
    },
    rise: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse' }],
      words: ', with a tail that rises and stops',
    },
    gatedroom: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Gated' }],
      words: ', in a room that is cut short',
    },
    swarm: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.35 } }],
      words: ', among the echoes of a cavern',
    },
    stair: {
      effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
      words: ', down a stone stairwell',
    },
    shore: {
      effects: [{ deviceId: 'distance', preset: 'Far shore', params: { distance: 0.85 } }],
      words: ', from a far shore',
    },
    nextdoor: {
      effects: [{ deviceId: 'distance', preset: 'Next door' }],
      words: ', through the wall from next door',
    },
    frozen: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Shining tail', params: { mix: 0.3 } }],
      words: ', in a long shining tail',
    },
    bowed: {
      effects: [
        { deviceId: 'swell', preset: 'Piano to pad' },
        { deviceId: 'hall-reverb', preset: 'Hall' },
      ],
      words: ', with every stroke faded in, in a hall',
    },
    hiss: {
      effects: [
        { deviceId: 'noise-floor', preset: 'Breathing tape', params: { level: -44 } },
        { deviceId: 'tape', preset: 'Quarter inch' },
      ],
      words: ', on tape with a breath of hiss',
    },
  },
  phrases: {
    dawn: {
      notes: [
        { atSec: 0, durSec: 6.8, note: 50, gain: 0.6 },
        { atSec: 0.7, durSec: 6.1, note: 57, gain: 0.5 },
        { atSec: 1.5, durSec: 5.3, note: 64, gain: 0.5 },
        { atSec: 2.5, durSec: 4.3, note: 69, gain: 0.45 },
      ],
    },
    lamp: {
      notes: [
        { atSec: 0, durSec: 6.6, note: 45, gain: 0.6 },
        { atSec: 0.8, durSec: 5.8, note: 52, gain: 0.5 },
        { atSec: 1.8, durSec: 4.8, note: 60, gain: 0.5 },
        { atSec: 2.8, durSec: 3.8, note: 67, gain: 0.45 },
      ],
    },
    plain: {
      notes: [
        { atSec: 0, durSec: 6.9, note: 41, gain: 0.6 },
        { atSec: 0.5, durSec: 6.4, note: 48, gain: 0.5 },
        { atSec: 1.1, durSec: 5.8, note: 57, gain: 0.5 },
        { atSec: 2.1, durSec: 4.8, note: 64, gain: 0.5 },
        { atSec: 3.3, durSec: 3.6, note: 67, gain: 0.45 },
      ],
    },
    fall: {
      notes: [
        { atSec: 0, durSec: 3.3, note: 50, gain: 0.6 },
        { atSec: 0, durSec: 3.3, note: 60, gain: 0.5 },
        { atSec: 0, durSec: 3.3, note: 65, gain: 0.5 },
        { atSec: 3.5, durSec: 3.6, note: 43, gain: 0.6 },
        { atSec: 3.5, durSec: 1.6, note: 60, gain: 0.5 },
        { atSec: 3.5, durSec: 3.6, note: 62, gain: 0.45 },
        { atSec: 5.2, durSec: 1.9, note: 59, gain: 0.5 },
      ],
    },
    counter: {
      notes: [
        { atSec: 0, durSec: 1.7, note: 76, gain: 0.5 },
        { atSec: 0, durSec: 1.7, note: 48, gain: 0.6 },
        { atSec: 1.8, durSec: 1.7, note: 74, gain: 0.5 },
        { atSec: 1.8, durSec: 1.7, note: 50, gain: 0.6 },
        { atSec: 3.6, durSec: 1.7, note: 72, gain: 0.5 },
        { atSec: 3.6, durSec: 1.7, note: 53, gain: 0.6 },
        { atSec: 5.4, durSec: 1.8, note: 71, gain: 0.5 },
        { atSec: 5.4, durSec: 1.8, note: 55, gain: 0.6 },
      ],
    },
    temple: {
      notes: [
        { atSec: 0, durSec: 1.4, note: 57, gain: 0.7 },
        { atSec: 1.6, durSec: 1.4, note: 64, gain: 0.6 },
        { atSec: 3.2, durSec: 0.9, note: 52, gain: 0.7 },
        { atSec: 4.2, durSec: 2.4, note: 69, gain: 0.6 },
      ],
    },
    calls: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 62, gain: 0.7 },
        { atSec: 0.7, durSec: 1.3, note: 69, gain: 0.7 },
        { atSec: 2.4, durSec: 0.5, note: 60, gain: 0.6 },
        { atSec: 3.1, durSec: 1.3, note: 67, gain: 0.6 },
        { atSec: 4.8, durSec: 2.2, note: 62, gain: 0.7 },
      ],
    },
    steps: {
      notes: [
        { atSec: 0, durSec: 0.4, note: 57, gain: 0.7 },
        { atSec: 0.45, durSec: 0.4, note: 64, gain: 0.5 },
        { atSec: 0.9, durSec: 0.4, note: 60, gain: 0.6 },
        { atSec: 1.35, durSec: 0.4, note: 67, gain: 0.5 },
        { atSec: 1.8, durSec: 0.4, note: 57, gain: 0.7 },
        { atSec: 2.25, durSec: 0.4, note: 64, gain: 0.5 },
        { atSec: 2.7, durSec: 0.4, note: 62, gain: 0.6 },
        { atSec: 3.15, durSec: 0.4, note: 65, gain: 0.5 },
        { atSec: 3.6, durSec: 0.4, note: 53, gain: 0.7 },
        { atSec: 4.05, durSec: 0.4, note: 60, gain: 0.5 },
        { atSec: 4.5, durSec: 2, note: 64, gain: 0.6 },
      ],
    },
    rain: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 84, gain: 0.6 },
        { atSec: 0.7, durSec: 0.5, note: 79, gain: 0.5 },
        { atSec: 1.8, durSec: 0.5, note: 81, gain: 0.6 },
        { atSec: 2.6, durSec: 0.5, note: 76, gain: 0.5 },
        { atSec: 3.9, durSec: 0.5, note: 88, gain: 0.5 },
        { atSec: 5, durSec: 1.6, note: 83, gain: 0.5 },
      ],
    },
    window: {
      notes: [
        { atSec: 0, durSec: 3.4, note: 60, gain: 0.6 },
        { atSec: 0.6, durSec: 2.8, note: 67, gain: 0.5 },
        { atSec: 1.2, durSec: 2.2, note: 71, gain: 0.5 },
        { atSec: 1.8, durSec: 1.6, note: 76, gain: 0.5 },
        { atSec: 3.6, durSec: 3.2, note: 57, gain: 0.6 },
        { atSec: 4.2, durSec: 2.6, note: 64, gain: 0.5 },
        { atSec: 4.8, durSec: 2, note: 72, gain: 0.5 },
      ],
    },
    drops: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 72, gain: 0.6 },
        { atSec: 0.7, durSec: 0.5, note: 67, gain: 0.5 },
        { atSec: 1.8, durSec: 0.5, note: 69, gain: 0.6 },
        { atSec: 2.6, durSec: 0.5, note: 64, gain: 0.5 },
        { atSec: 3.9, durSec: 0.5, note: 76, gain: 0.5 },
        { atSec: 5, durSec: 1.6, note: 71, gain: 0.5 },
      ],
    },
    veil: {
      notes: [
        { atSec: 0, durSec: 6, note: 55, gain: 0.5 },
        { atSec: 0.5, durSec: 5.5, note: 60, gain: 0.5 },
        { atSec: 1, durSec: 5, note: 62, gain: 0.45 },
        { atSec: 1.6, durSec: 4.4, note: 67, gain: 0.45 },
      ],
    },
    hearth: {
      notes: [
        { atSec: 0, durSec: 3.4, note: 48, gain: 0.6 },
        { atSec: 0.6, durSec: 2.8, note: 55, gain: 0.5 },
        { atSec: 1.2, durSec: 2.2, note: 59, gain: 0.5 },
        { atSec: 1.8, durSec: 1.6, note: 64, gain: 0.5 },
        { atSec: 3.6, durSec: 3.2, note: 45, gain: 0.6 },
        { atSec: 4.2, durSec: 2.6, note: 52, gain: 0.5 },
        { atSec: 4.8, durSec: 2, note: 60, gain: 0.5 },
      ],
    },
    one: { notes: [{ atSec: 0, durSec: 6.6, note: 50, gain: 0.7 }] },
    onehigh: { notes: [{ atSec: 0, durSec: 5.4, note: 69, gain: 0.7 }] },
    lowline: {
      notes: [
        { atSec: 0, durSec: 1.8, note: 36, gain: 0.8 },
        { atSec: 2, durSec: 1.2, note: 43, gain: 0.6 },
        { atSec: 3.4, durSec: 1.6, note: 41, gain: 0.7 },
        { atSec: 5.2, durSec: 2, note: 38, gain: 0.7 },
      ],
    },
    earth: {
      notes: [
        { atSec: 0, durSec: 3.2, note: 33, gain: 0.8 },
        { atSec: 3.6, durSec: 3.4, note: 36, gain: 0.7 },
      ],
    },
    pedals: {
      notes: [
        { atSec: 0, durSec: 6.8, note: 38, gain: 0.7 },
        { atSec: 1.6, durSec: 5.2, note: 45, gain: 0.5 },
        { atSec: 3.2, durSec: 3.6, note: 57, gain: 0.45 },
      ],
    },
    tread: {
      notes: [
        { atSec: 0, durSec: 0.6, note: 45, gain: 0.8 },
        { atSec: 0.9, durSec: 0.6, note: 52, gain: 0.6 },
        { atSec: 1.8, durSec: 0.6, note: 50, gain: 0.6 },
        { atSec: 2.7, durSec: 0.6, note: 48, gain: 0.6 },
        { atSec: 3.6, durSec: 0.6, note: 43, gain: 0.7 },
        { atSec: 4.5, durSec: 1.8, note: 45, gain: 0.7 },
      ],
    },
    trudge: {
      notes: [
        { atSec: 0, durSec: 0.7, note: 33, gain: 0.8 },
        { atSec: 0.9, durSec: 0.7, note: 40, gain: 0.6 },
        { atSec: 1.8, durSec: 0.7, note: 38, gain: 0.6 },
        { atSec: 2.7, durSec: 0.7, note: 36, gain: 0.6 },
        { atSec: 3.6, durSec: 0.7, note: 31, gain: 0.7 },
        { atSec: 4.5, durSec: 2, note: 33, gain: 0.7 },
      ],
    },
    hymn: {
      notes: [
        { atSec: 0, durSec: 2.1, note: 48, gain: 0.6 },
        { atSec: 0, durSec: 2.1, note: 60, gain: 0.5 },
        { atSec: 0, durSec: 2.1, note: 64, gain: 0.5 },
        { atSec: 0, durSec: 2.1, note: 67, gain: 0.5 },
        { atSec: 2.3, durSec: 2.1, note: 53, gain: 0.6 },
        { atSec: 2.3, durSec: 2.1, note: 60, gain: 0.5 },
        { atSec: 2.3, durSec: 2.1, note: 65, gain: 0.5 },
        { atSec: 2.3, durSec: 2.1, note: 69, gain: 0.5 },
        { atSec: 4.6, durSec: 2.5, note: 43, gain: 0.6 },
        { atSec: 4.6, durSec: 2.5, note: 59, gain: 0.5 },
        { atSec: 4.6, durSec: 2.5, note: 62, gain: 0.5 },
        { atSec: 4.6, durSec: 2.5, note: 67, gain: 0.5 },
      ],
    },
    turn: {
      notes: [
        { atSec: 0, durSec: 6.8, note: 45, gain: 0.5 },
        { atSec: 0.2, durSec: 0.9, note: 69, gain: 0.6 },
        { atSec: 1.2, durSec: 0.9, note: 67, gain: 0.5 },
        { atSec: 2.2, durSec: 1.6, note: 64, gain: 0.6 },
        { atSec: 4, durSec: 0.9, note: 62, gain: 0.5 },
        { atSec: 5, durSec: 1.8, note: 64, gain: 0.6 },
      ],
    },
    knocks: {
      notes: [
        { atSec: 0, durSec: 0.2, note: 62, gain: 0.8 },
        { atSec: 0.5, durSec: 0.2, note: 62, gain: 0.5 },
        { atSec: 1, durSec: 0.3, note: 69, gain: 0.7 },
        { atSec: 1.75, durSec: 0.2, note: 65, gain: 0.6 },
        { atSec: 2.5, durSec: 0.2, note: 62, gain: 0.7 },
        { atSec: 3.25, durSec: 0.2, note: 60, gain: 0.6 },
        { atSec: 4, durSec: 1.6, note: 62, gain: 0.8 },
      ],
    },
    cross: {
      notes: [
        { atSec: 0, durSec: 6.7, note: 52, gain: 0.6 },
        { atSec: 0.8, durSec: 5.9, note: 59, gain: 0.5 },
        { atSec: 2, durSec: 1.7, note: 65, gain: 0.5 },
        { atSec: 3.8, durSec: 2.9, note: 64, gain: 0.5 },
      ],
    },
    halo: {
      notes: [
        { atSec: 0, durSec: 6, note: 67, gain: 0.5 },
        { atSec: 0.5, durSec: 5.5, note: 72, gain: 0.5 },
        { atSec: 1, durSec: 5, note: 74, gain: 0.45 },
        { atSec: 1.6, durSec: 4.4, note: 79, gain: 0.45 },
      ],
    },
    pairs: {
      notes: [
        { atSec: 0, durSec: 2.1, note: 50, gain: 0.6 },
        { atSec: 0, durSec: 2.1, note: 57, gain: 0.5 },
        { atSec: 2.3, durSec: 2.1, note: 43, gain: 0.6 },
        { atSec: 2.3, durSec: 2.1, note: 59, gain: 0.5 },
        { atSec: 4.6, durSec: 2.6, note: 45, gain: 0.6 },
        { atSec: 4.6, durSec: 2.6, note: 60, gain: 0.5 },
      ],
    },
    tenor: {
      notes: [
        { atSec: 0, durSec: 2.2, note: 55, gain: 0.6 },
        { atSec: 2.3, durSec: 1.2, note: 57, gain: 0.6 },
        { atSec: 3.6, durSec: 3.5, note: 60, gain: 0.7 },
      ],
    },
    cellar: {
      notes: [
        { atSec: 0, durSec: 2.6, note: 43, gain: 0.7 },
        { atSec: 2.7, durSec: 1.3, note: 41, gain: 0.6 },
        { atSec: 4.1, durSec: 3, note: 40, gain: 0.7 },
      ],
    },
  },
  directions: [
    {
      id: 'dawn-gongs',
      name: 'Dawn gongs',
      category: 'pad',
      rows: `
Grey before gold | Dawn gong pad | rollSwell=5 climb=.5 roar=.3 sympathy=.12 fallBack=.45 place=.6 ground=.3 shimmer=2 volume=-1 | memory | dawn | A yarn roll on golden metal that takes five seconds to come up
Harbour before five | Dawn gong pad | beater=Felt hardness=.2 rollSpeed=5 lowRing=30 shimmer=.4 sympathy=.35 fallBack=.65 | darkhall | lamp | Soft felt strokes on golden metal, five to the second
Gold over the ridge | Dawn gong pad | climb=.95 threshold=0 roar=.1 highRing=14 place=.45 sympathy=.12 fallBack=0 | dry | dawn | Golden metal rolled until every rung stands clear and bright
Ash and amber | Dawn gong pad | roar=1 climb=.8 highRing=2 hardness=.5 width=.5 sympathy=.35 | cassette | fall | A golden roll whose climb is a thick rush of air
Kettle hill | Dawn gong pad | shimmer=3.5 rollSpeed=15 roll=1 bend=12 sympathy=.6 fallBack=.2 hardness=.7 place=.6 climb=.9 roar=.15 highRing=10 volume=-8 | currents | plain | Golden metal under a full quick roll, its pairs beating fast
Lamp in the fog | Slow lamp | climbTime=4 roar=.05 shimmer=.15 sympathy=.35 fallBack=.1 roll=.3 volume=0.5 | fog | dawn | A soft felt stroke on fifths whose upper tones wake over many seconds
Sill at daybreak | Slow lamp | ground=.75 hardness=.4 climb=.6 lowRing=14 shimmer=.9 sympathy=.12 bend=12 fallBack=.2 roll=.12 | warm | lamp | Felt on fifths with the low key full and a slow glow above
Candle behind paper | Slow lamp | metal=Harmonic highRing=3 climbTime=1 threshold=.25 shimmer=.2 sympathy=.35 fallBack=.3 roll=.28 rollSpeed=6.5 rollSwell=1 | shaded | hymn | A felt pad on harmonic metal, mellow and plain
Long porch | Slow lamp | place=.6 climb=1 threshold=.02 width=1 climbTime=1.2 shimmer=1.4 sympathy=.12 fallBack=0 roll=.3 rollSpeed=4.5 rollSwell=4.5 volume=-0.5 | glimmer | dawn | Felt on open fifths, all of it alight
Low sun on reeds | Slow lamp | metal=Sixths beater=Yarn roll=.55 rollSpeed=6 rollSwell=1.5 shimmer=.6 sympathy=.35 fallBack=.45 volume=5 | harmonic | fall | Yarn rolled softly on metal in sixths
Silver before sun | - | metal=Silver beater=Yarn hardness=.15 place=.3 roll=.8 rollSwell=3 climb=.45 highRing=9 choke=.15 threshold=.4 climbTime=1.2 roar=.6 shimmer=1.4 sympathy=.6 width=.95 fallBack=.35 rollSpeed=13 | nave | veil | A soft yarn roll on silver metal, half glass and half breath
Milk glass morning | - | metal=Silver roll=1 rollSpeed=16 rollSwell=1 ground=.2 roar=0 shimmer=.2 threshold=.5 climbTime=3.5 sympathy=.05 width=.45 fallBack=.55 volume=-1.5 | chorus | halo | Felt rolled very fast on silver metal, thin and still
Rime on the handrail | - | metal=Silver beater=Wood hardness=.1 roll=.9 rollSpeed=14 rollSwell=2.5 climb=.3 shimmer=2 threshold=.4 climbTime=1.2 roar=.22 sympathy=.6 width=1 fallBack=.2 volume=-1 | thinair | window | Light wood rolled on silver metal, its tones trembling
Pale stairs | - | metal=Silver hardness=.3 climb=.9 threshold=.05 climbTime=1.5 highRing=18 roll=.3 sympathy=.7 roar=.06 shimmer=.9 width=.85 fallBack=0 rollSpeed=9.5 rollSwell=3.5 | longplate | plain | A felt stroke on silver metal that keeps climbing into glass
Wet slate | - | metal=Silver hardness=.6 place=.8 roll=.6 rollSpeed=4 lowRing=6 highRing=1.2 choke=.5 threshold=.46 roar=.55 shimmer=.75 sympathy=.1 width=.6 fallBack=0 rollSwell=1 volume=-1.5 | underwater | fall | Silver metal struck firmly near the rim, four short blows a second | bell
Bread oven | - | metal=Harmonic beater=Felt hardness=.1 place=.05 roll=.75 rollSpeed=9 rollSwell=1 climb=.15 threshold=.5 climbTime=5 roar=.45 shimmer=2 sympathy=.12 width=.6 | pillow | hymn | Soft felt rolled in the middle of harmonic metal, round and low
Wool over brass | - | metal=Harmonic beater=Yarn hardness=.35 roll=.6 rollSpeed=12 climb=.35 threshold=.1 shimmer=1 roar=.5 sympathy=.35 width=.95 fallBack=0 rollSwell=1 | deck | fall | Yarn rolled on harmonic metal, its pairs beating slowly
Meadow organ | - | metal=Harmonic roll=1 rollSpeed=16 rollSwell=.3 climb=.7 threshold=.05 climbTime=.3 roar=0 highRing=6 shimmer=.1 sympathy=.12 width=.5 fallBack=.1 | rotary | hymn | A steady felt roll on harmonic metal with a clear bright climb | organ
Late milk train | - | metal=Harmonic hardness=.7 place=.6 roll=.5 rollSpeed=3 rollSwell=.2 climb=.5 lowRing=8 threshold=.46 roar=.62 shimmer=1.4 sympathy=.35 width=1 | seasick | pairs | Firm felt blows on harmonic metal, three in a second | bell
Warm stone step | - | metal=Harmonic ground=.9 climb=.25 roll=.4 sympathy=.9 lowRing=34 choke=.05 threshold=.55 climbTime=5 roar=.2 shimmer=.6 width=.85 rollSpeed=9.5 rollSwell=3.5 | giant | lamp | Felt on harmonic metal with a heavy ground that rings on and on
Sixths at sunrise | - | metal=Sixths beater=Felt roll=1 rollSpeed=11 rollSwell=4 climb=.6 threshold=.1 lowRing=30 roar=.55 shimmer=.9 sympathy=.35 fallBack=.2 | expanse | plain | A felt roll on sixths that grows over four seconds
Cider light | - | metal=Sixths beater=Yarn hardness=.7 roll=.7 rollSpeed=13 rollSwell=.5 climb=.85 threshold=.02 climbTime=.4 roar=.08 shimmer=.75 sympathy=.12 width=.6 fallBack=.2 volume=-1.5 | ensemble | hymn | Firm yarn rolled on sixths, its rungs lit almost at once
Dust in the barn | - | metal=Sixths hardness=.25 roar=.9 climb=.7 threshold=.05 highRing=1 roll=.5 shimmer=1.6 climbTime=.5 fallBack=.3 rollSpeed=6.5 rollSwell=1.6 place=.8 ground=.15 volume=1 | record | fall | Felt on sixths with a dry rush of air where the climb should be
Orchard fence | - | metal=Sixths ground=.1 place=.75 hardness=.5 roll=.65 rollSpeed=7 rollSwell=2 highRing=12 threshold=.55 climbTime=1.8 roar=.05 shimmer=.6 sympathy=.12 width=.55 fallBack=0 volume=1 | flock | window | Felt on sixths with the low key almost gone
Copper kettle | - | metal=Sixths bend=110 hardness=.6 roll=0 climb=.55 lowRing=36 sympathy=.6 threshold=.46 roar=.25 shimmer=2 width=1 | melt | dawn | A felt stroke on sixths, pulled sharp and slowly coming home | bell
Breath on tin | - | metal=Plate beater=Brush hardness=.1 roll=.6 rollSwell=2.5 climb=.5 roar=.6 ground=.7 threshold=.05 shimmer=1.4 sympathy=.45 width=.95 fallBack=.45 rollSpeed=9.5 | darkhall | pairs | A soft brush going round on an untuned plate, the key glowing under it
Mist off the weir | - | metal=Fifths beater=Brush hardness=.15 place=.2 roll=.8 rollSpeed=3 rollSwell=4 climb=.3 roar=.2 threshold=.36 shimmer=.6 sympathy=.52 width=.55 fallBack=.65 volume=-1 | lowtide | dawn | A soft brush on fifths, slow sweeps of air with the key inside
Sheets in the yard | - | metal=Golden beater=Brush hardness=.3 place=.6 climb=.8 threshold=.02 roar=.1 ground=.25 highRing=9 climbTime=1.2 shimmer=2 width=1 fallBack=.35 roll=0 volume=-1 | spin | fall | A brush on golden metal that wakes clear tones high above
Grey herons | - | metal=Harmonic beater=Brush hardness=.05 place=.1 ground=.8 climb=.1 lowRing=20 roll=.3 threshold=.82 climbTime=1.2 roar=.6 shimmer=.9 sympathy=.52 width=.85 rollSpeed=13 rollSwell=1.6 | bloomfilter | lamp | The softest brush on harmonic metal, the low key and a little air
Rain moving in | - | metal=Sixths beater=Brush hardness=.9 place=.9 ground=.15 roar=.7 climb=.6 shimmer=4 highRing=5 threshold=.42 climbTime=3.5 sympathy=.45 width=.9 fallBack=.2 roll=.12 volume=-0.5 | weather | plain | A hard brush at the rim of sixths, wide and restless
Tide of bronze | Breathing bronze | beater=Felt roll=.9 rollSpeed=12 rollSwell=1 sympathy=.12 | dry | dawn | Felt rolled on sixths, the light going up and down in waves
After the ebb | Breathing bronze | beater=Yarn metal=Fifths roll=1 rollSpeed=9 threshold=.3 climbTime=.3 sympathy=.35 rollSwell=1.6 | hall | fall | A yarn roll on fifths whose climb is given back and starts again
Mill bellows | Breathing bronze | beater=Felt metal=Golden roll=.8 rollSpeed=10 climb=1 roar=.8 highRing=.8 sympathy=.12 rollSwell=3.5 | iron | plain | Golden metal rolled into waves of rush that fall dark again
Slack water | Breathing bronze | beater=Felt metal=Harmonic roll=1 rollSpeed=16 hardness=.5 climbTime=1.6 ground=.2 sympathy=.35 rollSwell=1 volume=5.5 | phaser | hymn | Harmonic metal under a quick felt roll, rising and emptying slowly
Two moons down | Breathing bronze | beater=Felt metal=Silver roll=.7 fallBack=.7 rollSpeed=5 highRing=8 shimmer=.1 sympathy=.12 rollSwell=4.5 volume=1 | bloomtail | halo | Silver metal in slow felt strokes, its light lifted and let fall
Above the cloud | - | metal=Fifths ground=0 roll=.9 rollSpeed=13 rollSwell=2 climb=.8 threshold=.02 roar=.05 highRing=16 climbTime=2.6 shimmer=.9 sympathy=.52 width=1 fallBack=.45 | valley | dawn | A roll on fifths with the low tone gone, all light
Birds on the mast | - | metal=Golden ground=0 beater=Wood hardness=.2 roll=.75 rollSpeed=12 climb=.3 highRing=3 threshold=.5 climbTime=5 roar=.2 shimmer=.75 sympathy=.45 width=.45 rollSwell=3.5 volume=-1.5 | falling | hearth | Wood rolled on golden metal with no ground, small and busy | texture
Linen sky | - | metal=Harmonic ground=0 hardness=.3 place=.9 roll=1 rollSpeed=15 climb=.5 shimmer=.1 threshold=.24 climbTime=2.6 roar=.55 sympathy=.52 width=.45 fallBack=.35 rollSwell=1 volume=-1.5 | detune | halo | A felt roll at the rim of harmonic metal, a thin sheet of overtones
Kites at noon | - | metal=Sixths ground=0 beater=Yarn roll=.1 place=.6 climb=1 threshold=0 bend=-60 climbTime=.6 roar=.12 shimmer=.6 sympathy=.45 width=.95 volume=-2 | prism | fall | Yarn on sixths without its low key, rising a little to each note | bell
Washed blue | - | metal=Silver ground=0 beater=Brush hardness=.5 climb=.9 threshold=0 highRing=20 roar=0 climbTime=2.6 shimmer=2 sympathy=.52 width=.55 bend=12 fallBack=.2 roll=.28 rollSpeed=13 rollSwell=1.6 | mist | plain | A brush on silver metal with the ground taken out, glass and air
Roof of reeds | - | beater=Wood hardness=.3 place=.3 roll=1 rollSpeed=16 rollSwell=5 climb=.4 roar=.1 lowRing=10 threshold=.36 shimmer=2 sympathy=.65 width=.45 fallBack=0 | chapel | dawn | Wood rolled on fifths, growing from nothing over five seconds
Thousand sticks | - | metal=Plate beater=Wood hardness=.5 roll=1 rollSpeed=14 rollSwell=1 climb=.3 roar=.1 width=1 threshold=.42 shimmer=.9 sympathy=.05 fallBack=.45 place=.9 ground=.2 lowRing=3 highRing=1 | edges | fall | Wooden sticks rolled at the rim of an untuned plate, rough and near | texture
Hedge of sparks | - | metal=Golden beater=Wood hardness=.75 place=.5 roll=.85 rollSpeed=16 rollSwell=3 highRing=7 shimmer=.8 threshold=.08 climbTime=2.6 roar=.08 sympathy=0 width=.45 fallBack=.65 | widetop | plain | Hard sticks rolled on golden metal, a swarm of small bright hits | texture
Hum of the pylons | - | metal=Harmonic beater=Wood hardness=.05 roll=1 rollSpeed=16 ground=.8 climb=.1 lowRing=12 threshold=.6 climbTime=5 roar=.55 shimmer=1.4 sympathy=.12 width=.85 rollSwell=3.5 | centre | pairs | Soft wood rolled so fast on harmonic metal that it only hums
Gravel lane | - | metal=Sixths beater=Wood hardness=.6 roll=.9 rollSpeed=10 rollSwell=.2 lowRing=2 highRing=.5 choke=.7 threshold=.6 climbTime=.3 roar=.5 shimmer=.6 sympathy=.1 width=.6 volume=0 | gatedroom | pairs | Short wooden rolls on sixths, dry as stones | texture
Slow arrival | - | hardness=.8 place=.4 climb=.7 threshold=.1 climbTime=2 lowRing=26 roll=.2 roar=.25 shimmer=1.4 sympathy=.45 width=1 fallBack=.1 | bowed | fall | Firm felt on fifths with a climb of two seconds
Coming up the valley | - | metal=Golden beater=Yarn bend=140 lowRing=20 climb=.6 threshold=.1 roll=0 sympathy=.5 climbTime=2.6 roar=.25 shimmer=.6 width=.85 fallBack=.35 volume=-1.5 | shore | dawn | Yarn on golden metal, its pitch sinking home as it dies | bell
Bent light | - | metal=Silver bend=-140 hardness=.4 lowRing=16 climb=.6 roll=0 width=.9 threshold=.1 climbTime=5 roar=.62 shimmer=2 sympathy=.45 fallBack=.55 | stillwater | lamp | Felt on silver metal that rises into tune from well below | bell
Open window | Climbing fifths | roll=0 climb=.75 climbTime=1.4 threshold=.15 shimmer=1.2 choke=.1 roar=.12 sympathy=.5 width=.95 fallBack=.2 | sustain | window | Plain felt strokes on fifths, opening upward and left to ring | bell
Day at last | Rolling wall | metal=Fifths roar=.2 rollSwell=6 climbTime=2.5 threshold=.02 sympathy=.45 fallBack=.1 | highhalo | dawn | A full yarn roll on fifths that grows for six seconds
`,
    },
    {
      id: 'soft-plates',
      name: 'Soft plates',
      category: 'keys',
      rows: `
Kitchen at seven | Soft plate keys | hardness=.2 ground=.8 choke=.75 roll=0 bend=32 | dry | - | Felt on harmonic metal, short and round under the hand
Saucers on a tray | Soft plate keys | beater=Yarn hardness=.3 lowRing=3 climb=.05 roll=0 | vinyl | hymn | Yarn on harmonic metal, small and plain
Blue enamel | Soft plate keys | hardness=.65 place=.4 climb=.4 threshold=.1 highRing=3 roll=0 bend=-18 volume=-3.5 | tightplate | window | Firmer felt on harmonic metal with a clear glow after each key
Under the stairs     | Soft plate keys | hardness=.05 place=0 ground=1 lowRing=9 width=.1 roll=0 | muffled     | turn   | The softest felt in the middle of harmonic metal, almost a pure tone
Letters unsent | Soft plate keys | shimmer=1.8 width=.9 lowRing=8 choke=.4 roll=0 bend=10 fallBack=.05 | chorus | counter | Felt on harmonic metal, its pairs swaying quickly
Reading room | - | beater=Yarn hardness=.25 place=.5 climb=.6 threshold=.05 climbTime=.3 lowRing=6 highRing=5 choke=.6 roll=0 roar=.15 shimmer=.8 sympathy=.15 width=.6 bend=6 | room | - | Yarn keys on open fifths with a quick light over each
Cloister walk | - | beater=Yarn hardness=.5 place=.5 ground=.3 climb=.4 lowRing=12 choke=.3 roll=0 sympathy=.6 threshold=.4 climbTime=.4 roar=.02 shimmer=.65 width=.35 bend=10 fallBack=0 | spring | pairs | Yarn on fifths with the upper tones leading
Stone bench | - | hardness=.3 place=.15 climb=.1 lowRing=2.5 highRing=.6 choke=.8 roll=0 ground=.7 threshold=.9 climbTime=.2 roar=.05 shimmer=.8 sympathy=.15 width=.42 | gatedroom | steps | Dull felt on fifths, gone in a moment
Low doorway | - | hardness=.9 place=.3 climb=.2 threshold=.5 lowRing=4 highRing=.8 choke=.5 roll=0 width=.3 roar=0 shimmer=.1 sympathy=.1 | deck | counter | Hard felt on fifths, plain and quick to darken
Morning office | - | hardness=.4 place=.35 climb=.6 threshold=.05 climbTime=.5 roar=.05 lowRing=8 highRing=5 choke=.45 roll=0 shimmer=.8 sympathy=.1 width=.9 bend=-18 fallBack=.25 | flutes | hymn | Felt keys on fifths that open clear half a second on
Nut bowl | - | metal=Sixths beater=Yarn hardness=.3 place=.6 climb=.45 lowRing=4 highRing=2 choke=.7 roll=0 threshold=.05 climbTime=.25 roar=.5 shimmer=.15 sympathy=.15 bend=6 fallBack=.3 ground=.3 volume=-1 | woodbody | steps | Yarn on metal in sixths, short and nutty
Ferry ticket | - | metal=Sixths hardness=.45 place=.4 climb=.5 threshold=.1 climbTime=.25 roar=.05 lowRing=11 choke=.6 roll=0 shimmer=.55 sympathy=.4 bend=10 | cassette | window | Felt on sixths with a quick glow over each key
Hallway lamp | - | metal=Sixths hardness=.1 ground=.9 place=.05 climb=.3 lowRing=16 choke=.5 roll=0 shimmer=1 threshold=.5 climbTime=.2 roar=.62 sympathy=.35 width=.6 bend=32 | warm | turn | The softest felt on sixths, heavy in its low key
Pressed leaves | - | metal=Sixths beater=Yarn hardness=.8 ground=.15 place=.6 climb=.35 highRing=4 lowRing=9 roll=0 choke=.5 threshold=.55 climbTime=.55 roar=.18 shimmer=.55 sympathy=.5 width=.35 volume=-0.5 | booth | counter | Hard yarn on sixths with hardly any ground, brittle and sweet
Attic keys | - | metal=Sixths beater=Yarn bend=30 hardness=.4 lowRing=12 climb=.3 roll=0 choke=.45 sympathy=.5 threshold=.4 climbTime=.3 roar=.22 shimmer=.15 width=.42 fallBack=.5 | seasick | hymn | Yarn on sixths with a slight fall in each note
Marigold | - | metal=Golden hardness=.2 place=.1 ground=.8 climb=.25 threshold=.2 lowRing=8 highRing=2 choke=.55 roll=0 climbTime=.55 roar=.15 shimmer=.65 sympathy=.1 bend=-18 | valve | - | Felt on golden metal, its odd upper tones kept quiet
Saffron thread | - | metal=Golden beater=Yarn hardness=.4 place=.4 ground=.4 climb=.2 lowRing=6 choke=.6 roll=0 shimmer=.2 threshold=.68 climbTime=.3 roar=.02 sympathy=.15 width=.42 bend=6 fallBack=.05 volume=-1 | chamber | window | Yarn on golden metal, a bright clang held in the hand
Straw hat | - | metal=Golden beater=Wood hardness=.1 place=.2 climb=.1 lowRing=3 highRing=1 choke=.7 roll=0 width=.4 threshold=.75 climbTime=.25 roar=.75 shimmer=.65 sympathy=.4 fallBack=.05 | radio | steps | Soft wood on golden metal, thin and cheerful
Honey on the knife | - | metal=Golden hardness=.35 place=.3 climb=.7 threshold=.05 climbTime=.7 roar=.5 lowRing=14 choke=.35 roll=0 shimmer=.8 sympathy=.35 width=.9 fallBack=.1 | darkecho | fall | Felt on golden metal with a slow warm rush over the chord
Wasps in the porch | - | metal=Golden hardness=.6 ground=.6 shimmer=4 climb=.35 lowRing=7 highRing=4 choke=.5 roll=0 width=1 threshold=.36 climbTime=.2 roar=.75 bend=-16 fallBack=.4 volume=0 | flanger | pairs | Firm felt on golden metal, its pairs buzzing against each other
Salt spoon | - | metal=Silver hardness=.5 place=.15 ground=.7 climb=.15 lowRing=9 choke=.6 roll=0 threshold=.45 climbTime=.4 roar=.05 shimmer=.95 sympathy=.15 fallBack=.05 | nearmic | - | Felt on silver metal, small and clean
Spoon drawer | - | metal=Silver beater=Yarn hardness=.3 place=.4 ground=.5 climb=.3 lowRing=5 highRing=2 choke=.75 roll=0 threshold=.42 roar=.25 shimmer=1.2 sympathy=.1 width=.42 bend=-18 fallBack=.4 | box | steps | Yarn on silver metal, a quick chink to each key
Mirror table | - | metal=Silver beater=Yarn hardness=.6 place=.3 climb=.6 threshold=.1 climbTime=.3 roar=0 highRing=10 roll=0 choke=.3 shimmer=.95 sympathy=.35 width=.5 | shadow | hearth | Yarn on silver metal that clears into glass after the stroke
Cold tea | - | metal=Silver hardness=.15 place=.5 ground=.35 shimmer=2.5 lowRing=12 roll=0 choke=.4 threshold=.42 climbTime=.3 roar=.2 sympathy=.5 width=.2 fallBack=0 volume=2 | phaser | counter | Soft felt on silver metal, thin and trembling
Snow on the hinge | - | metal=Silver beater=Wood hardness=.05 place=.1 ground=.9 climb=.05 lowRing=14 roll=0 choke=.55 threshold=.82 climbTime=.25 roar=.5 shimmer=.95 sympathy=.1 width=.6 fallBack=.05 | seasons | turn | The softest wood on silver metal, low key first
Tin roof shed | - | metal=Plate hardness=.4 place=.2 ground=.9 climb=.2 lowRing=4 highRing=.8 roll=0 choke=.7 threshold=.6 roar=.2 shimmer=.65 sympathy=.1 width=.35 | combo | - | Felt on an untuned plate, knocky, the key carried by its ground
Cooper's bench | - | metal=Plate beater=Yarn hardness=.2 place=.05 ground=.75 climb=.1 lowRing=2 highRing=.5 roll=0 choke=.8 threshold=.5 roar=.5 shimmer=.8 sympathy=.05 width=.42 bend=32 fallBack=.3 volume=-1.5 | woodbody | steps | Yarn in the middle of a flat plate, stopped like a barrel
Oil drum garden | - | metal=Plate beater=Yarn hardness=.6 place=.1 ground=1 climb=.45 roar=.1 lowRing=7 roll=0 bend=90 choke=.4 threshold=.36 shimmer=0 sympathy=.4 width=.5 | slap | calls | Yarn on an untuned plate, every note bending down to rest
Shutter keys | - | metal=Plate hardness=.8 ground=.8 climb=.5 roar=.8 threshold=.6 climbTime=.2 highRing=.6 lowRing=5 roll=0 choke=.6 shimmer=.8 sympathy=.35 width=.9 bend=-18 | downhall | pairs | Hard felt on a plate, each key with a puff of rush
Old scales | - | metal=Plate hardness=.1 place=0 ground=1 climb=0 lowRing=10 roll=0 shimmer=.1 choke=.5 threshold=.68 roar=.75 sympathy=.65 bend=6 fallBack=.3 volume=-12 | iron | hymn | Soft felt in the very middle of a plate, only the key left
Pencil box | - | beater=Wood hardness=.2 place=.2 climb=.1 lowRing=2.5 highRing=.8 roll=0 choke=.6 threshold=.82 climbTime=.2 roar=.62 shimmer=.55 sympathy=0 width=.6 volume=-0.5 | dry | steps | Soft wood on short fifths, clean and near
Chalk on the step | - | metal=Harmonic beater=Wood hardness=.4 place=.3 climb=.15 lowRing=3 highRing=1 roll=0 choke=.55 threshold=.6 climbTime=.55 roar=.06 shimmer=.15 sympathy=.15 width=.35 volume=-0.5 | plate | window | Wood on short harmonic metal, a clear little knock first
Bright buttons | - | metal=Harmonic beater=Wood hardness=.8 place=.5 ground=.3 climb=.4 highRing=2 lowRing=4 roll=0 choke=.6 threshold=.08 climbTime=.3 roar=.25 shimmer=.55 sympathy=.4 width=.42 bend=6 fallBack=.4 | widetop | counter | Hard wood on harmonic metal with little ground, bright as pins
Post office bell | - | beater=Wood hardness=.6 place=.6 ground=.5 climb=.5 threshold=.05 climbTime=.2 lowRing=6 roll=0 choke=.5 sympathy=0 roar=.15 shimmer=.15 width=.5 bend=10 volume=0 | tapeecho | calls | Wood on fifths, lit from top to bottom at once
Pegs in a tin | - | metal=Sixths beater=Wood hardness=.25 place=.1 climb=0 lowRing=4 highRing=.6 roll=0 choke=.7 width=.2 threshold=.9 climbTime=.4 roar=.7 shimmer=.55 sympathy=0 bend=32 volume=-1.5 | reel | - | Soft wood on sixths with no climb, dry and woody
Nothing damped | - | hardness=.35 place=.2 climb=.3 lowRing=32 highRing=4 roll=0 choke=0 sympathy=1 threshold=.24 climbTime=.25 roar=.12 shimmer=.15 width=.45 bend=32 fallBack=.25 volume=-3.5 | pedal | window | Felt on fifths with nothing stopped, old keys sounding under new
Two rooms away | - | metal=Harmonic hardness=.3 place=.15 climb=.2 lowRing=28 roll=0 choke=.05 sympathy=.8 shimmer=.5 threshold=.6 climbTime=.4 roar=.45 width=.5 bend=-16 | nextdoor | hymn | Felt on harmonic metal, long and unstopped
Damp towel | - | metal=Harmonic beater=Yarn hardness=.15 ground=.6 lowRing=18 highRing=.5 climb=.4 roll=0 choke=.35 threshold=.24 roar=.05 shimmer=.15 sympathy=.4 width=.9 bend=-18 | muffled 1.highCut=2000 | pairs | Yarn on harmonic metal, its top dead as soon as it is struck
House by the rails | - | metal=Sixths beater=Felt hardness=.55 lowRing=40 highRing=8 climb=.35 roll=0 choke=.1 sympathy=.9 threshold=.46 climbTime=.55 roar=.5 shimmer=.55 width=.6 bend=6 fallBack=.4 | follower | turn | Felt on sixths with a long ring and much sympathy
Left on all night | - | metal=Silver hardness=.2 lowRing=36 highRing=12 climb=.2 roll=0 choke=.02 sympathy=.7 ground=.6 threshold=.9 climbTime=.3 roar=.75 shimmer=.15 width=.35 bend=10 fallBack=.05 | looper | window | Felt on silver metal, every key left to hang
Slow dial | - | hardness=.6 climb=.8 threshold=.2 climbTime=.9 roar=.1 lowRing=14 highRing=6 roll=0 choke=.3 shimmer=.8 sympathy=.15 width=.5 fallBack=.1 | rooms | fall | Felt on fifths that brightens a second after the key
Neighbour's light | - | metal=Harmonic hardness=.5 climb=.9 threshold=.1 climbTime=.6 roar=0 highRing=8 lowRing=9 roll=0 choke=.4 shimmer=.65 sympathy=.4 width=.9 | glints | hymn | Felt on harmonic metal, a clear shine rising from each chord
Kindling | - | metal=Golden hardness=.8 climb=.8 threshold=.7 climbTime=.2 roar=.35 highRing=3 lowRing=8 roll=0 choke=.5 shimmer=.8 sympathy=.35 width=.6 volume=-1 | sift | calls | Hard felt on golden metal that catches only when played firmly
Stove door open | - | metal=Plate hardness=.55 ground=.85 climb=.9 threshold=.15 climbTime=.5 roar=1 lowRing=9 highRing=2 roll=0 choke=.5 shimmer=.65 sympathy=.5 width=.35 | hiss | pairs | Felt on a plate with a roar behind every key
Gas ring | - | metal=Silver hardness=.7 climb=1 threshold=.05 climbTime=.4 fallBack=.8 highRing=4 lowRing=12 roll=0 choke=.35 roar=.22 shimmer=.8 sympathy=.1 width=.42 bend=6 | shimmer | window | Felt on silver metal, lit at once and giving it back
Two thumbs | - | metal=Harmonic hardness=.5 roll=.6 rollSpeed=5 rollSwell=.2 climb=.2 lowRing=2 highRing=.8 choke=.6 threshold=.6 roar=.25 shimmer=.65 sympathy=.1 width=.5 volume=2 | trem | pairs | Felt on harmonic metal struck again five times a second
Wind-up bird | - | beater=Wood hardness=.3 roll=.7 rollSpeed=12 rollSwell=.1 climb=.15 lowRing=1.5 highRing=.5 choke=.7 sympathy=0 threshold=.5 climbTime=.2 roar=.5 shimmer=.8 width=.9 fallBack=.3 volume=6 metal=Silver ground=.8 place=.2 | tiny | calls | Soft wood chattering on silver metal while the key is down
Dial tone | - | metal=Golden hardness=.2 bend=-40 climb=.1 lowRing=5 highRing=1 roll=0 choke=.5 ground=.7 threshold=.45 climbTime=.55 roar=.2 shimmer=.65 sympathy=.4 width=.6 | blanket | - | Felt on golden metal, each note sliding up to its place
Warped tray | - | beater=Yarn hardness=.7 bend=90 climb=.3 lowRing=9 highRing=2 roll=0 choke=.4 shimmer=1.5 threshold=.6 climbTime=.3 roar=.55 width=.35 fallBack=.5 | stillwater | counter | Firm yarn on fifths, pulled sharp and falling home
Bus window | - | metal=Silver beater=Brush hardness=1 place=.2 ground=.8 climb=.1 lowRing=8 highRing=1 roll=0 choke=.6 threshold=.68 roar=.7 shimmer=.65 sympathy=.5 width=.42 bend=-16 volume=-0.5 | bandpulse | pairs | A quick hard brush on silver metal with a solid low key
`,
    },
    {
      id: 'bowed-metal',
      name: 'Bowed metal',
      category: 'string',
      rows: `
Bow on the gate | Bowed metal | hardness=.3 place=.35 climb=.3 threshold=.35 sympathy=.45 width=.6 fallBack=.2 volume=-1 | dry | tenor | A bow on fifths with little above the key
Three on a rail | Bowed metal | hardness=.55 climb=.75 threshold=.05 climbTime=.5 highRing=6 shimmer=.3 width=.35 fallBack=.3 | room | hymn | A bow on fifths that draws the bright rungs up with it
Hour of rosin | Bowed metal | hardness=.9 place=.8 roar=.7 climb=.6 width=.4 sympathy=.45 fallBack=0 | nearmic | fall | A hard bow at the rim of fifths, full of grain
Empty refectory | Bowed metal | ground=.9 hardness=.2 climb=.2 lowRing=20 choke=.1 sympathy=.8 width=.5 volume=-10.5 | nave | pairs | A light bow on fifths, the low key long and even
Wire in the hedge | Bowed metal | ground=.1 place=.7 climb=.6 threshold=.1 choke=.6 lowRing=4 sympathy=.45 width=.3 volume=2.5 | thin | counter | A bow on fifths with the ground nearly gone, reedy and narrow
Consort of lids | - | metal=Harmonic beater=Bow hardness=.4 place=.3 climb=.3 lowRing=6 highRing=1.5 choke=.5 shimmer=.3 threshold=.18 climbTime=1.8 roar=.12 sympathy=.6 | chamber | hymn | A bow on harmonic metal, plain as a row of viols
Velvet cord | - | metal=Harmonic beater=Bow hardness=.15 place=.1 ground=.8 climb=.1 lowRing=10 choke=.3 sympathy=.5 threshold=.75 climbTime=.6 roar=.55 shimmer=.7 width=.35 volume=-11 | warm | fall | The lightest bow on harmonic metal, round and low in colour
Chalk cliff | - | metal=Harmonic beater=Bow hardness=.8 place=.6 climb=.8 threshold=.1 climbTime=.4 roar=.5 lowRing=8 shimmer=.9 sympathy=.6 width=1 fallBack=.3 | brightplate | fall | A hard bow on harmonic metal with a wide bright climb
Teacher's desk | - | metal=Harmonic beater=Bow hardness=.6 place=.2 climb=.4 lowRing=2 highRing=.6 choke=.8 width=.2 threshold=.36 climbTime=1.2 roar=.45 shimmer=.2 sympathy=.15 fallBack=0 volume=1 | combo | tenor | A firm bow on harmonic metal, stopped at every lifted key
Song from the crypt | - | metal=Harmonic beater=Bow hardness=.35 ground=.4 climb=.5 highRing=10 threshold=.05 roar=0 choke=.2 climbTime=.35 shimmer=1.3 sympathy=.6 width=.45 fallBack=.45 | monks | fall | A bow on harmonic metal, its upper tones clear as voices
Sixths on the stair | - | metal=Sixths beater=Bow hardness=.45 place=.4 climb=.4 lowRing=12 highRing=3 choke=.4 threshold=.1 climbTime=1.2 roar=.75 shimmer=.9 volume=-1 | stair | counter | A bow on metal in sixths, tender and a little rough
Amber lacquer | - | metal=Sixths beater=Bow hardness=.2 place=.2 ground=.7 climb=.25 shimmer=1.2 lowRing=18 choke=.3 threshold=.08 climbTime=.35 roar=.08 sympathy=.05 width=.35 fallBack=0 | valve | tenor | A light bow on sixths that sways in its pairs
Salt marsh | - | metal=Sixths beater=Bow hardness=.7 place=.7 ground=.25 climb=.7 threshold=.05 roar=.4 highRing=8 climbTime=1.8 shimmer=1.3 sympathy=.6 width=.9 fallBack=.35 volume=-2 | pan | fall | A firm bow on sixths, thin in the key and wide above
Autumn term | - | metal=Sixths beater=Bow hardness=.5 climb=.6 threshold=.25 climbTime=1.5 lowRing=20 sympathy=.8 choke=.2 roar=.15 shimmer=.55 width=.5 | hall | hymn | A bow on sixths whose rungs wake slowly over a ringing floor
Bent nail | - | metal=Sixths beater=Bow bend=-25 hardness=.6 climb=.3 lowRing=6 choke=.6 width=.3 threshold=.42 climbTime=2.5 roar=.25 shimmer=.7 sympathy=.6 fallBack=.2 volume=0.5 | vibrato | tenor | A bow on sixths, narrow and pressed a shade flat
Gold leaf | - | metal=Golden beater=Bow hardness=.3 place=.25 climb=.4 threshold=.1 roar=.1 lowRing=10 choke=.4 climbTime=.6 shimmer=.9 sympathy=.05 width=.85 fallBack=.35 volume=-0.5 | plate | tenor | A bow on golden metal, its strange tones held quiet and near
Fox in the cornfield | - | metal=Golden beater=Bow hardness=.7 place=.5 climb=.8 threshold=.1 climbTime=.6 roar=.3 lowRing=14 shimmer=.2 sympathy=.6 width=.5 | valley | cross | A firm bow on golden metal that cries over its own key
Wheel of lamps | - | metal=Golden beater=Bow hardness=.4 shimmer=3 climb=.5 highRing=8 width=1 choke=.2 threshold=.5 climbTime=1.2 roar=.25 sympathy=.05 fallBack=.2 volume=1 | around | pairs | A bow on golden metal with its pairs turning fast
Brass rubbing | - | metal=Golden beater=Bow hardness=1 place=.3 ground=.6 climb=.3 roar=.9 lowRing=3 choke=.7 threshold=.55 climbTime=.35 shimmer=.55 sympathy=.1 width=.6 | fuzz | tenor | The hardest bow on golden metal, rough and stopped
Old gold thread | - | metal=Golden beater=Bow hardness=.1 place=.1 ground=1 climb=.15 lowRing=26 sympathy=.6 choke=.15 threshold=.6 climbTime=1.8 roar=.2 shimmer=.7 width=.35 | blanket | fall | A barely leaning bow on golden metal, dark and long
Window wetted | - | metal=Silver beater=Bow hardness=.3 place=.35 climb=.4 highRing=8 lowRing=14 roar=0 choke=.25 threshold=.42 climbTime=2.5 shimmer=.7 sympathy=.35 width=.6 fallBack=.2 | frozen | halo | A bow on silver metal, the sound of a wet rim
Glass harvest | - | metal=Silver beater=Bow hardness=.55 place=.6 ground=.4 climb=.7 threshold=.05 highRing=16 shimmer=.1 climbTime=1.2 roar=0 sympathy=.12 width=.35 | mist | hearth | A bow on silver metal with clear glass standing over it
Prick of light | - | metal=Silver beater=Bow hardness=.2 ground=0 place=.5 climb=.5 lowRing=8 choke=.4 width=.9 threshold=.16 climbTime=.35 roar=.02 shimmer=.2 sympathy=.35 fallBack=.55 volume=-1.5 | glassblur | veil | A light bow on silver metal with no ground at all
Cold harbour | - | metal=Silver beater=Bow hardness=.8 place=.2 ground=.7 climb=.5 roar=.6 lowRing=6 choke=.5 threshold=.5 climbTime=1.8 shimmer=1.3 sympathy=.12 fallBack=.2 | seasons | cross | A hard bow on silver metal, the key in front and frost behind
Wire through the wall | - | metal=Silver beater=Bow hardness=.45 climb=.25 shimmer=2 lowRing=20 sympathy=.9 choke=.1 threshold=.42 climbTime=.6 roar=.55 width=.45 fallBack=.3 | silent | tenor | A bow on silver metal that leaves each note ringing in the next
Rust line | - | metal=Plate beater=Bow hardness=.5 place=.3 ground=.8 climb=.4 roar=.5 lowRing=8 choke=.4 threshold=.46 shimmer=.9 width=.35 fallBack=.35 | woodbody | tenor | A bow on an untuned plate, the key held up by its ground
Barge hull | - | metal=Plate beater=Bow hardness=.9 place=.1 ground=.9 climb=.7 threshold=.2 roar=.8 highRing=2 shimmer=.2 sympathy=.35 | cistern | cellar | A hard bow on a great flat plate, groaning and breathing
Winter gate | - | metal=Plate beater=Bow hardness=.2 place=.5 ground=.6 climb=.2 shimmer=.8 lowRing=14 choke=.2 threshold=.82 roar=.22 sympathy=.12 width=.5 volume=-1 | nextdoor | cross | A light bow on a plate, sour and soft
Saw in the orchard | - | metal=Plate beater=Bow hardness=.4 ground=.4 place=.8 climb=.5 bend=40 lowRing=5 choke=.5 threshold=.24 roar=.12 shimmer=.55 sympathy=.65 width=.45 fallBack=.3 | spring | calls | A bow at the rim of a plate, bending as each note is let go
Slate pencil | - | metal=Plate beater=Bow hardness=.9 ground=.3 climb=.9 threshold=.02 climbTime=.3 roar=.6 highRing=3 shimmer=.7 sympathy=.12 place=.8 | swarm | pairs | A hard bow at the rim of a plate, half rush and half scrape
Bronze asleep | Breathing bronze | hardness=.15 climbTime=1.4 roar=.1 sympathy=.45 | darkhall | pairs | A light bow on sixths, waves of light coming and going slowly
Bellows of brass | Breathing bronze | metal=Fifths threshold=.35 roar=.7 hardness=.5 sympathy=.52 | dry | dawn | A bow on fifths that breathes in rush and breathes it out
Tide under ice | Breathing bronze | metal=Silver threshold=.4 climbTime=.4 highRing=5 shimmer=.2 sympathy=.45 | expanse | halo | A bow on silver metal, glass rising and sinking over the key
Sleeper's chest | Breathing bronze | metal=Harmonic hardness=.4 climbTime=2 threshold=.5 ground=.7 sympathy=.52 | lungs | fall | A bow on harmonic metal, one slow swell after another
Gold lent out | Breathing bronze | metal=Golden threshold=.3 hardness=.6 roar=.2 fallBack=.8 climbTime=.5 sympathy=.45 | orbits | lamp | A bow on golden metal whose brightness is lent and returned
Keel and sand | - | beater=Bow hardness=.3 place=.1 ground=1 climb=.2 lowRing=12 width=.2 choke=.4 threshold=.45 climbTime=.6 roar=.08 shimmer=.55 sympathy=.15 fallBack=0 | iron | cellar | A bow low on fifths, all key and hardly a rung | bass
Undercroft strings | - | metal=Harmonic beater=Bow hardness=.5 place=.2 climb=.4 threshold=.15 lowRing=9 roar=.3 choke=.4 climbTime=.35 shimmer=.9 sympathy=.05 width=.6 | cave | cellar | A bow on low harmonic metal, broad and dark
Old ferry chain | - | metal=Sixths beater=Bow hardness=.75 place=.35 ground=.8 climb=.6 roar=.6 lowRing=14 choke=.3 threshold=.46 climbTime=1.2 shimmer=.7 sympathy=0 | softtape | lowline | A hard bow on low sixths, every link of it heard | bass
Deep gold | - | metal=Golden beater=Bow hardness=.25 ground=.9 place=.15 climb=.5 climbTime=2.5 threshold=.1 lowRing=20 roar=.02 shimmer=1.3 sympathy=.05 width=.85 | deep | pedals | A light bow on low golden metal that opens over many seconds
Long black barn | - | metal=Fifths beater=Bow hardness=.6 climb=.9 threshold=.05 climbTime=3 roar=.3 lowRing=26 highRing=9 shimmer=.55 sympathy=.6 width=.5 fallBack=.1 | downhall | pedals | A bow on deep fifths with a slow climb to the rafters
Skylight bow | - | beater=Bow ground=0 hardness=.25 place=.5 climb=.4 roar=0 highRing=8 shimmer=.2 threshold=.2 climbTime=1.8 sympathy=.35 width=.35 fallBack=.35 volume=-1.5 | highhalo | halo | A light bow on fifths with the key taken away
Larks far up | - | metal=Sixths beater=Bow ground=0 hardness=.6 place=.9 climb=.8 threshold=0 shimmer=2.5 choke=.3 climbTime=.6 roar=.45 sympathy=.35 fallBack=.55 volume=-2 | stars | window | A bow at the rim of sixths, only the high tones left
Smoke going straight | - | metal=Harmonic beater=Bow ground=.1 hardness=.4 place=.6 climb=.6 threshold=.05 highRing=4 lowRing=12 width=.3 climbTime=2.5 roar=.05 shimmer=1.3 sympathy=.35 fallBack=.2 volume=-1 | notch | turn | A bow on harmonic metal, overtones with hardly a ground
Kettle whistle | - | metal=Golden beater=Bow ground=0 hardness=.45 place=.2 climb=.5 highRing=3 choke=.6 bend=-10 threshold=.5 climbTime=1.2 roar=.25 shimmer=.55 sympathy=.12 width=.3 fallBack=.3 | radio | tenor | A bow on golden metal with no low key, piping and thin
Star in the well | - | metal=Plate beater=Bow ground=.2 hardness=.3 place=.3 climb=.6 roar=0 highRing=12 threshold=.02 shimmer=.7 sympathy=.35 width=.6 fallBack=0 volume=-1.5 | bloomtail | cross | A light bow on a plate, high and far from its key
Short bows | - | beater=Bow hardness=.7 place=.45 climb=.3 lowRing=3 highRing=1.2 choke=.9 sympathy=0 width=.4 ground=.7 threshold=.46 climbTime=1.2 roar=.7 shimmer=.9 fallBack=.3 volume=0 | gatedroom | steps | A bow on short fifths, dry little strokes
Stammering bow | - | metal=Harmonic beater=Bow hardness=.85 climb=.5 threshold=.4 lowRing=.6 highRing=.5 choke=.9 ground=.6 climbTime=.35 roar=.45 shimmer=.2 sympathy=0 width=.85 fallBack=0 volume=3.5 | dotted | steps | A hard bow on harmonic metal, bitten off each time
Fall of the arm | - | beater=Bow bend=45 hardness=.6 climb=.4 lowRing=9 choke=.35 place=.3 threshold=.46 climbTime=1.8 roar=.05 shimmer=1.3 sympathy=.65 width=.5 fallBack=.45 volume=-0.5 | detune | calls | A bow on fifths that sags as every note is let go
Up from the cellar | - | metal=Harmonic beater=Bow bend=-45 hardness=.5 climb=.5 lowRing=7 highRing=2 choke=.35 ground=.7 threshold=.55 climbTime=.6 roar=.25 shimmer=.55 sympathy=.35 width=.45 fallBack=.65 volume=-0.5 | phaser | tenor | A bow on harmonic metal that lifts as every note is let go
Crowd of cellos | - | metal=Sixths beater=Bow shimmer=4.5 hardness=.5 climb=.45 threshold=.15 width=1 lowRing=9 choke=.35 climbTime=.8 roar=.5 sympathy=.05 volume=0 | ensemble | hymn | A bow on sixths with its pairs spread so far that it is a crowd
`,
    },
    {
      id: 'fifths-temple',
      name: 'Temple courts',
      category: 'bell',
      rows: `
Outer court | Fifths temple | hardness=.35 ground=.6 roll=0 shimmer=.2 fallBack=.1 | chamber | temple | Yarn on open fifths, long and level
Sandals at the door | Fifths temple | hardness=.75 climb=.7 threshold=.05 climbTime=.5 roll=0 shimmer=1.8 fallBack=.2 volume=-3 | brightplate | temple | Firm yarn on fifths, lit to the top half a second on
Gravel raked twice | Fifths temple | ground=0 place=.8 roll=0 lowRing=16 sympathy=.3 shimmer=1.3 bend=12 volume=-1.5 | dry | window | Yarn at the rim of fifths with the ground swept away
Hour of the ox | Fifths temple | place=.1 ground=.9 hardness=.2 climb=.15 roll=0 lowRing=40 shimmer=1.8 bend=35 | darkhall | pedals | Soft yarn in the middle of low fifths, ringing on and on
Wheel by a spring | Fifths temple | roll=.45 rollSpeed=2 rollSwell=.3 shimmer=1 fallBack=.45 volume=-3 | orbits | turn | Yarn on fifths, struck again twice a second while held
Cedar steps | - | hardness=.5 climb=.35 climbTime=1.2 lowRing=24 highRing=4 roll=0 choke=.05 sympathy=.5 threshold=.05 roar=.02 shimmer=1.8 width=.5 bend=12 | spring | temple | Felt on fifths, dark first and then a ring of light
Lotus pond | - | hardness=.25 place=.3 climb=.8 threshold=.05 climbTime=3 roar=0 highRing=16 lowRing=30 roll=0 choke=0 shimmer=1.3 sympathy=.45 width=.95 bend=35 fallBack=.1 | mist | pairs | Soft felt on fifths that opens like a slow flower
Big drum bell | - | hardness=.8 place=.2 ground=.85 climb=.5 roar=.6 lowRing=14 highRing=2 roll=0 bend=70 choke=.1 threshold=.42 climbTime=.4 shimmer=1.8 sympathy=.65 width=.5 fallBack=.2 | giant | lowline | Hard felt on low fifths, bent sharp at the stroke, a rush behind it
Smoke at noon | - | hardness=.3 place=.6 ground=.2 climb=.5 threshold=.1 climbTime=.8 shimmer=.1 lowRing=20 roll=0 choke=0 roar=0 sympathy=.35 width=.3 fallBack=.3 volume=1.5 | cloud | rain | Felt on high fifths, still and thin
Roof guardian | - | hardness=.65 climb=1 threshold=.1 climbTime=1 fallBack=.6 roar=.4 lowRing=28 roll=0 choke=.05 shimmer=1.8 sympathy=.8 width=.5 bend=-35 | cave | temple | Felt on fifths whose whole climb comes and is taken back
Woodblock moon | - | beater=Wood hardness=.3 place=.4 climb=.2 lowRing=16 highRing=3 roll=0 choke=.05 threshold=.75 climbTime=2.2 roar=.55 shimmer=.2 sympathy=.35 width=.66 bend=35 volume=1 | plate | rain | Soft wood on high fifths, clean little bells
Struck rail | - | beater=Wood hardness=.9 place=.25 ground=.8 climb=.4 threshold=.1 lowRing=20 highRing=3 roll=0 choke=0 roar=.08 shimmer=.6 sympathy=.8 volume=-1 | longplate | temple | Hard wood on fifths, a heavy rail with a short bright edge
Nine beads | - | beater=Wood hardness=.15 place=.5 ground=.5 climb=.1 lowRing=6 highRing=1.5 roll=0 choke=.2 sympathy=.7 threshold=.6 climbTime=.4 roar=.25 shimmer=.2 width=.2 bend=18 volume=4 | crystals | drops | Light wood on fifths, small as beads
Lanterns lifting | - | beater=Wood hardness=.45 shimmer=2 climb=.6 roar=0 lowRing=12 highRing=6 roll=.3 rollSpeed=3 threshold=.42 sympathy=.6 bend=-35 volume=1.5 | glimmer | halo | Wood on fifths, touched again three times a second
Iron fish | - | beater=Wood hardness=1 place=.2 ground=.8 climb=.3 lowRing=9 highRing=.8 roll=0 choke=.3 width=.2 threshold=.5 climbTime=1.6 roar=.12 shimmer=0 sympathy=.05 fallBack=.35 | pipe | calls | The hardest wood on fifths, a clack and a plain low ring
Parish morning | - | metal=Harmonic beater=Yarn hardness=.6 place=.4 climb=.3 threshold=.2 lowRing=20 highRing=5 roll=0 choke=.05 climbTime=1.1 roar=.25 shimmer=1.3 bend=-18 fallBack=.35 | valley | calls | Yarn on harmonic metal, an open bell over the fields
Bell tied with rope | - | metal=Harmonic hardness=.4 place=.2 ground=.8 climb=.2 lowRing=26 roll=0 choke=.1 bend=25 threshold=.82 climbTime=2.2 roar=.55 shimmer=.2 sympathy=.65 width=.95 | stair | temple | Felt on harmonic metal with a heavy hum
Seven o'clock | - | metal=Harmonic beater=Wood hardness=.5 ground=.3 place=.5 climb=.3 highRing=3 lowRing=15 roll=0 choke=0 threshold=.16 climbTime=.6 roar=.18 shimmer=1.3 sympathy=.35 width=.5 bend=35 volume=-1 | steps | temple | Wood on harmonic metal, its fifth and third standing clear
Choir stall bell | - | metal=Harmonic beater=Yarn hardness=.3 climb=.7 threshold=.05 climbTime=1.5 roar=.05 highRing=12 roll=0 choke=0 shimmer=1.8 sympathy=.8 width=.95 bend=48 | chapel | window | Soft yarn on harmonic metal that turns to voices high up
Salt and candle | - | metal=Harmonic beater=Yarn hardness=.5 shimmer=4 climb=.15 lowRing=14 width=1 roll=0 choke=.05 threshold=.45 climbTime=.45 roar=.05 sympathy=.5 volume=0 | chorus | pairs | Yarn on harmonic metal, its pairs beating fast and wide
Six o'clock low | - | metal=Sixths hardness=.4 ground=.7 place=.25 climb=.4 lowRing=34 roll=0 choke=0 threshold=.36 climbTime=2.2 roar=.12 shimmer=1.8 sympathy=.5 width=.66 bend=12 fallBack=.65 | nave | temple | Felt on sixths, long and sorrowing
Bell in an orchard | - | metal=Sixths beater=Yarn hardness=.6 place=.5 climb=.3 lowRing=24 highRing=6 roll=0 choke=.05 threshold=.42 climbTime=.6 roar=.75 shimmer=1.3 width=.85 | weather | calls | Yarn on sixths, sweet and slightly cracked
Vesper lamp | - | metal=Sixths beater=Yarn hardness=.4 climb=.9 threshold=.02 climbTime=1.8 roar=.1 lowRing=36 highRing=9 roll=0 choke=0 shimmer=1.8 sympathy=.65 width=.66 fallBack=0 | pedal | pairs | Yarn on sixths that goes on brightening after the stroke
Goat bell | - | metal=Sixths beater=Wood hardness=.5 ground=.4 place=.3 climb=0 lowRing=5 highRing=1 roll=0 choke=.2 width=.3 threshold=.45 climbTime=.45 roar=.25 shimmer=1.3 sympathy=.6 | radio | steps | Wood on sixths, small, dented and cheerful
Towers over the water | - | metal=Sixths beater=Wood hardness=.3 shimmer=.8 lowRing=30 highRing=14 climb=.3 roll=0 choke=0 sympathy=1 threshold=.08 climbTime=1.6 roar=.22 width=.66 bend=-35 | canon | temple | Soft wood on sixths with every bell waking the last
Falling bronze | Falling gong | hardness=.5 lowRing=20 roll=0 sympathy=.5 fallBack=.65 | hall | one | Felt on golden metal, bent far sharp and slowly sinking home
Shout from the hills | Falling gong | bend=-150 hardness=.9 place=.5 climb=.8 roar=.6 roll=0 sympathy=.45 fallBack=.35 | slap | calls | Hard felt on golden metal that swoops up to its note
Gilded turtle | Falling gong | beater=Yarn bend=20 hardness=.3 ground=.8 climb=.25 lowRing=26 roll=0 sympathy=.65 | bowls | temple | Soft yarn on golden metal, deep and only a little bent
Saffron robes | Falling gong | beater=Wood bend=60 hardness=.2 climb=.15 highRing=5 roll=0 sympathy=.35 volume=-0.5 ground=.75 | stars | hearth | Light wood on golden metal, each bell falling a little
Gong under the eaves | Falling gong | climb=1 threshold=.05 climbTime=1.2 roar=.9 bend=0 lowRing=30 highRing=6 choke=0 roll=0 sympathy=.8 fallBack=.3 | shore | one | Felt on golden metal with everything alight and rushing
Temple dog | - | metal=Plate hardness=.6 ground=.7 place=.3 climb=.5 roar=.5 lowRing=16 roll=0 choke=.05 threshold=.46 shimmer=.7 sympathy=.65 width=.75 bend=48 fallBack=.55 | downhall | temple | Felt on an untuned plate, a broad clang with the key inside
Roof tiles | - | metal=Plate beater=Wood hardness=.4 ground=.5 place=.6 climb=.2 lowRing=4 highRing=2 roll=0 choke=.1 threshold=.6 roar=.12 shimmer=.9 sympathy=.35 width=.5 bend=18 volume=2 | tapeecho | drops | Wood on a flat plate, clinking like fired clay
Bell on a barge | - | metal=Plate beater=Yarn hardness=.8 ground=1 place=.2 climb=.3 lowRing=24 highRing=3 roll=0 choke=0 threshold=.46 roar=.45 shimmer=.1 sympathy=.8 width=.95 | surf | calls | Yarn on a heavy plate, all hum and iron
Cracked blessing | - | metal=Plate hardness=.3 ground=.6 shimmer=1.5 climb=.6 threshold=.05 climbTime=1 roar=.8 lowRing=12 roll=0 sympathy=.12 width=.5 bend=8 | memory | pairs | Soft felt on a plate, its rush rising a second after
Buried roof | - | metal=Plate beater=Yarn hardness=.1 ground=.9 place=0 climb=.1 lowRing=18 roll=0 choke=.1 width=.2 threshold=.9 roar=.25 shimmer=.1 sympathy=.45 | muffled | temple | The softest yarn in the middle of a plate, a hum and no clang
Knell | - | roll=.9 rollSpeed=1.5 rollSwell=.1 hardness=.6 climb=.5 lowRing=12 choke=.1 threshold=.55 roar=.55 shimmer=.9 sympathy=.65 width=.4 fallBack=0 | darkhall | one | Felt on fifths tolling three times every two seconds
Procession coming in | - | metal=Harmonic beater=Yarn roll=1 rollSpeed=1.5 rollSwell=3 hardness=.4 climb=.3 lowRing=9 choke=.2 threshold=.5 climbTime=1.1 roar=.12 shimmer=.7 sympathy=.52 width=.6 | stretch | pairs | Yarn on harmonic metal tolling louder and louder
Boats changing watch | - | metal=Sixths beater=Wood roll=.7 rollSpeed=2 rollSwell=.1 hardness=.4 lowRing=6 climb=.2 choke=.3 threshold=.9 roar=.45 shimmer=.9 sympathy=.45 width=.4 volume=-1.5 | swarm | one | Wood on sixths, two strokes a second over the water
Silver tolling | - | metal=Silver roll=.8 rollSpeed=1.8 rollSwell=.2 hardness=.3 lowRing=14 climb=.6 highRing=8 choke=.1 threshold=.5 climbTime=.6 roar=.5 shimmer=.7 sympathy=.5 width=.6 fallBack=.35 | thinair | turn | Felt on silver metal tolling softly under a melody
Golden hours | - | metal=Golden beater=Yarn roll=.6 rollSpeed=2.5 rollSwell=6 hardness=.5 lowRing=18 climb=.4 choke=.1 threshold=.55 roar=.25 shimmer=.9 sympathy=.45 width=.4 fallBack=.2 volume=-1 | loop | lamp | Yarn on golden metal, tolling that grows for six seconds
Light in the rafters | - | fallBack=1 climb=.9 threshold=.5 climbTime=.4 lowRing=40 hardness=.8 roll=0 choke=0 roar=.02 shimmer=1.8 sympathy=.8 width=.6 bend=-35 volume=-2 | hall | one | One hard felt stroke on fifths, its light going up in waves
Moon through cedars | - | metal=Silver fallBack=.9 climb=.8 threshold=.2 climbTime=.6 lowRing=30 beater=Yarn hardness=.5 roll=0 choke=0 roar=.18 shimmer=1.3 sympathy=.5 width=.4 bend=8 | currents | one | Yarn on silver metal, glass that rises, empties and rises
Coals stirred | - | metal=Golden fallBack=1 climb=1 threshold=.5 climbTime=.3 roar=.7 lowRing=28 hardness=.7 roll=0 choke=0 shimmer=1.8 sympathy=.45 width=.6 bend=-18 | iron | one | Firm felt on golden metal, flaring and falling dark again
Flag in the wind | - | metal=Harmonic fallBack=.8 climb=1 threshold=.3 climbTime=.2 highRing=1 lowRing=24 hardness=.6 roll=0 roar=.25 shimmer=1.3 sympathy=.35 width=.4 bend=12 | ripples | pairs | Felt on harmonic metal with a quick light flapping above it
Breath of the roof | - | metal=Sixths fallBack=1 climb=1 threshold=.2 climbTime=1 roar=.3 lowRing=40 beater=Yarn hardness=.6 roll=0 choke=0 shimmer=1.8 sympathy=.35 width=.6 bend=35 | rise | temple | Yarn on sixths, its climb spent and given back
Across three valleys | - | beater=Yarn hardness=.2 ground=.6 climb=.2 lowRing=30 roll=0 choke=0 sympathy=.6 threshold=.45 climbTime=.3 roar=.62 shimmer=.2 width=.4 | shore | calls | Soft yarn on fifths, only the hum arriving
Ferryman's bell | - | metal=Harmonic beater=Wood hardness=.3 lowRing=10 climb=.1 roll=0 choke=.1 bend=-25 threshold=.9 climbTime=1.1 roar=.7 shimmer=1.8 sympathy=.45 width=.6 | flock | calls | Soft wood on harmonic metal, starting a hair under the note
Monastery kitchen | - | metal=Harmonic beater=Yarn hardness=.9 place=.7 lowRing=5 highRing=2 climb=.5 roll=0 choke=.4 threshold=.6 climbTime=.3 roar=.55 shimmer=2 sympathy=.6 width=.4 bend=18 fallBack=0 ground=.45 | combo | knocks | Hard yarn on harmonic metal, called out across the yard
Last of the bells | - | hardness=.45 lowRing=40 highRing=20 climb=.4 threshold=.05 climbTime=5 roll=0 choke=0 sympathy=1 roar=.12 shimmer=1.8 volume=-10.5 | spiral | pairs | Felt on fifths with the longest ring there is
Frost on the rope | - | metal=Silver beater=Yarn hardness=.2 place=.2 ground=.8 lowRing=22 climb=.15 roll=0 choke=.05 threshold=.82 climbTime=.4 roar=.45 shimmer=1.3 sympathy=.8 width=.45 bend=8 | seasons | temple | Soft yarn on silver metal, the low key and a thin edge
`,
    },
    {
      id: 'choked-mallets',
      name: 'Choked mallets',
      category: 'plucked',
      rows: `
Palm on the rim | Choked mallet | hardness=.35 climb=.4 lowRing=3 roll=0 shimmer=1 bend=-40 volume=0.5 | dry | steps | Yarn on sixths, warm and stopped by the palm
Market steps | Choked mallet | roar=.6 highRing=1.5 hardness=.8 roll=0 shimmer=.2 bend=-25 fallBack=.5 volume=0 threshold=.7 | hollow | knocks | Firm yarn on sixths, the loud strokes splashing air
Bamboo awning | Choked mallet | metal=Fifths place=.15 ground=.7 climb=.2 roll=0 shimmer=.6 bend=-40 fallBack=.05 | booth | steps | Yarn on fifths, mostly the key
Fruit in a bowl | Choked mallet | metal=Harmonic climb=.9 highRing=3 threshold=.05 roll=0 shimmer=.75 bend=-25 | room | tread | Yarn on harmonic metal, a quick bright flower on every note
Boat ladder | Choked mallet | choke=.35 lowRing=16 sympathy=.8 hardness=.4 roll=0 shimmer=1 bend=-40 | stone | calls | Yarn on sixths, let go slowly over ringing metal
Green door | - | beater=Yarn hardness=.3 place=.2 climb=.15 lowRing=1.5 highRing=.5 choke=.8 roll=0 width=.3 threshold=.45 climbTime=.25 roar=.18 shimmer=.2 sympathy=.05 fallBack=.05 volume=0 | deck | steps | Short yarn on fifths, plain and plump
Pigeons | - | beater=Yarn hardness=.6 place=.5 ground=.3 climb=.3 lowRing=.7 highRing=.6 choke=.9 roll=0 threshold=.12 climbTime=.2 roar=.02 shimmer=1 sympathy=0 width=.3 fallBack=0 volume=1.5 | slap | knocks | Yarn on very short fifths, upper tones first
Frog on the stones | - | beater=Yarn hardness=.45 climb=.5 threshold=.05 climbTime=.2 highRing=4 lowRing=3 choke=.6 roll=0 roar=.2 shimmer=.2 sympathy=.15 width=.6 volume=1 | stars | calls | Yarn on short fifths whose top outlasts the bottom
Bucket on a rope | - | beater=Yarn hardness=.7 bend=60 climb=.2 lowRing=2 highRing=.5 choke=.7 roll=0 threshold=.75 climbTime=.3 roar=.55 shimmer=.6 sympathy=.1 width=.5 volume=-1 | spring | tread | Yarn on short fifths, each stroke bent and let back
Tea chest | - | beater=Yarn hardness=.1 ground=1 place=.05 climb=.05 lowRing=2.5 choke=.7 roll=0 width=.1 threshold=.82 climbTime=.25 roar=.12 shimmer=.75 sympathy=.35 | woodbody | tread | The softest yarn on fifths, a thump with a note in it
Dry sticks | - | beater=Wood hardness=.5 place=.3 climb=.1 lowRing=.6 highRing=.3 choke=.9 roll=0 sympathy=0 threshold=.75 climbTime=.4 roar=.5 shimmer=.2 width=.6 bend=35 fallBack=.3 volume=0 | centre | knocks | Wood on fifths so short it is nearly a tick
Picket fence | - | metal=Harmonic beater=Wood hardness=.6 place=.4 ground=.5 climb=.1 lowRing=1.2 highRing=.5 choke=.8 roll=0 threshold=.82 climbTime=.3 roar=.25 shimmer=.2 sympathy=.1 width=.5 volume=1 | dotted | steps | Wood on short harmonic metal, hard and even
Copper nails | - | metal=Sixths beater=Wood hardness=.8 ground=.2 place=.7 climb=.3 lowRing=3 highRing=1.2 choke=.7 roll=0 threshold=.5 climbTime=.25 roar=.62 shimmer=.75 sympathy=.05 volume=-0.5 | bright | knocks | Hard wood on short sixths with the key left small
Skiff at the jetty | - | beater=Wood hardness=.2 place=.15 ground=.8 climb=.2 lowRing=4 choke=.5 roll=0 sympathy=.5 threshold=.5 climbTime=.2 roar=.2 shimmer=1 width=.4 bend=20 | darkecho | calls | Soft wood on fifths, wooden knocks going off over water
Heron on one leg | - | metal=Harmonic beater=Wood hardness=.3 place=.8 ground=.2 climb=.4 highRing=3 lowRing=5 choke=.6 roll=0 threshold=.12 climbTime=.4 roar=.25 shimmer=.2 sympathy=.45 width=.3 bend=35 fallBack=.5 volume=-1 | prism | window | Light wood at the rim of harmonic metal
Gold tooth | - | metal=Golden beater=Yarn hardness=.5 place=.3 climb=.15 lowRing=2 highRing=.8 choke=.8 roll=0 threshold=.45 climbTime=.3 roar=.22 shimmer=.6 sympathy=.1 width=.2 bend=20 fallBack=.05 | cassette | knocks | Yarn on short golden metal, a small bright clang
Loose change | - | metal=Golden beater=Wood hardness=.6 ground=.3 place=.6 climb=.2 lowRing=1.5 highRing=1 choke=.7 roll=0 threshold=.9 climbTime=.25 roar=.2 shimmer=.75 sympathy=.05 width=.5 bend=35 volume=-0.5 | half | knocks | Wood on short golden metal, coins on a counter
Sun on a slatted wall | - | metal=Golden hardness=.4 place=.2 ground=.7 climb=.6 threshold=.05 climbTime=.2 roar=.4 lowRing=4 highRing=1 choke=.6 roll=0 shimmer=1 sympathy=.1 width=.85 bend=20 fallBack=0 volume=3 | harmonic | window | Felt on golden metal, a breath of rush on each stroke
Lion's paw | - | metal=Golden hardness=.15 place=.1 ground=1 climb=.3 lowRing=3 choke=.7 roll=0 bend=50 width=.2 threshold=.18 climbTime=.4 roar=.5 shimmer=.2 fallBack=.5 | iron | tread | Soft felt on golden metal, heavy and slightly bent
Turmeric | - | metal=Golden beater=Yarn hardness=.8 place=.5 ground=.6 shimmer=2.5 lowRing=5 highRing=2 choke=.5 roll=0 threshold=.36 climbTime=.3 roar=.45 sympathy=.05 width=.3 bend=20 | sampler | steps | Hard yarn on golden metal, sharp and beating
Icicles, east side | - | metal=Silver beater=Wood hardness=.25 place=.15 climb=.2 lowRing=2 highRing=2 choke=.7 roll=0 threshold=.45 climbTime=.4 roar=.62 shimmer=.2 sympathy=.15 width=.4 volume=-1 ground=.8 | plate | hearth | Wood on short silver metal, icy and exact
Glove on glass | - | metal=Silver beater=Yarn hardness=.3 ground=.7 place=.1 climb=.2 lowRing=3 highRing=.8 choke=.8 roll=0 threshold=.9 climbTime=.3 roar=.18 shimmer=.6 sympathy=.1 width=.3 volume=0.5 | nearmic | steps | Yarn on silver metal, glass with a hand on it
Beads on the floor | - | metal=Silver beater=Wood hardness=.55 ground=.7 place=.4 climb=.1 lowRing=1 highRing=1 choke=.8 roll=0 sympathy=0 threshold=.68 climbTime=.25 roar=.08 shimmer=.75 width=.6 bend=50 fallBack=.3 volume=1.5 | stone 1.mix=0.45 | knocks | Wood on tiny silver metal, scattered and bright
Skating lesson | - | metal=Silver hardness=.6 ground=.5 climb=.8 threshold=.02 climbTime=.2 highRing=5 lowRing=2.5 choke=.6 roll=0 roar=.25 shimmer=1 sympathy=0 width=.5 | pan | hearth | Felt on silver metal that flashes and is stopped
Bottles sorted | - | metal=Silver beater=Yarn hardness=.5 bend=-80 place=.4 lowRing=3 highRing=1.5 choke=.6 roll=0 threshold=.5 climbTime=.4 roar=.45 shimmer=.2 sympathy=.45 width=.85 | pipe | knocks | Yarn on silver metal, each note jumping up into place
Crate lid | - | metal=Plate beater=Yarn hardness=.4 place=.1 ground=.8 climb=.1 lowRing=1 highRing=.4 choke=.9 roll=0 threshold=.5 roar=.2 shimmer=.25 sympathy=.1 width=.3 bend=45 volume=0.5 | combo | knocks | Yarn on a small plate, a knock with the key under it | drum
Tin cup rhythm | - | metal=Plate beater=Wood hardness=.5 place=.4 ground=.6 climb=.1 lowRing=.6 highRing=.6 choke=.8 roll=0 width=.3 threshold=.45 roar=.55 shimmer=0 sympathy=.05 fallBack=.3 volume=-0.5 | trem | knocks | Wood on a small plate, tinny and quick | drum
Depot floor | - | metal=Plate hardness=.7 place=.1 ground=1 climb=.4 roar=.8 threshold=.55 climbTime=.2 lowRing=1.5 highRing=.8 choke=.8 roll=0 bend=80 shimmer=.55 sympathy=0 width=.2 volume=-1 | gatedroom | knocks | Hard felt on a plate, a low thud with a burst of rush | drum
Latch in a gale | - | metal=Plate beater=Wood hardness=.8 place=.8 ground=.3 climb=.3 lowRing=.75 highRing=1 choke=.7 roll=0 sympathy=0 threshold=.46 roar=.5 shimmer=.2 width=.3 fallBack=.5 | loop | knocks | Hard wood at the rim of a plate, clattering and thin
Gatepost | - | metal=Plate beater=Yarn hardness=.2 ground=.9 place=.2 climb=.2 lowRing=3 choke=.6 roll=0 shimmer=.8 threshold=.75 roar=.05 sympathy=.05 width=.4 | fuzz | tread | Soft yarn on a plate, dull iron with a fur on it
One two three | Counted strokes | rollSpeed=2.5 hardness=.6 choke=.7 threshold=.5 fallBack=0 volume=6 | steps | turn | Felt on short silver metal, struck over and over while it is held
Sewing machine | Counted strokes | metal=Harmonic beater=Wood hardness=.4 rollSpeed=9 roll=.9 lowRing=.65 threshold=.42 fallBack=.5 | tiny | pairs | Wood stitching quickly on short harmonic metal
Sprinkler | Counted strokes | metal=Sixths beater=Yarn rollSpeed=6 ground=.3 climb=.6 highRing=1.2 threshold=.5 fallBack=.4 volume=3.5 | around | fall | Yarn on short sixths, six strokes a second with a small splash
Knitting | Counted strokes | metal=Fifths beater=Yarn rollSpeed=4 hardness=.3 lowRing=2 sympathy=.9 threshold=.42 | pillow | hymn | Yarn on short fifths, four soft strokes a second
Hammer dulled | Counted strokes | metal=Plate rollSpeed=1.5 hardness=.5 ground=.9 lowRing=1.2 bend=40 threshold=.5 | downhall | one | Felt on a plate, dull blows three to every two seconds
Frog pond | - | hardness=.5 bend=150 place=.1 ground=.9 climb=.1 lowRing=1.5 choke=.7 roll=0 sympathy=0 threshold=.75 climbTime=.25 roar=.05 shimmer=.75 width=.3 | underwater | knocks | Felt on short fifths dropping a long way into each note
Drip in the cave | - | metal=Silver beater=Yarn bend=-150 hardness=.5 place=.2 lowRing=1.2 highRing=.5 choke=.8 roll=0 threshold=.46 climbTime=.2 roar=.25 shimmer=1 sympathy=0 volume=2.5 climb=.25 ground=.7 | swarm | calls | Yarn on silver metal, short drops that jump upward
Rubber hammer | - | metal=Harmonic beater=Yarn bend=100 hardness=.4 climb=.2 lowRing=2.5 choke=.6 roll=0 ground=.8 threshold=.6 climbTime=.4 roar=.62 shimmer=.2 sympathy=.45 width=.5 | flutes | tread | Yarn on harmonic metal, bouncing down on to the note
Band on a bottle | - | metal=Sixths bend=-120 hardness=.7 place=.3 climb=.3 lowRing=3 highRing=.8 choke=.7 roll=0 width=.2 threshold=.46 climbTime=.3 roar=.2 shimmer=.6 sympathy=.1 volume=3.5 | phaser | steps | Felt on short sixths, twanging up to pitch
Loose gutter | - | metal=Golden beater=Yarn bend=130 hardness=.6 lowRing=5 highRing=1.5 climb=.25 choke=.5 roll=0 threshold=.55 climbTime=.25 roar=.3 shimmer=.75 sympathy=.35 width=.4 fallBack=.25 | falling | calls | Yarn on golden metal with a steep bend in the stroke
Flick of straw | - | beater=Brush hardness=1 place=.4 ground=.6 climb=.2 lowRing=1 highRing=.5 choke=.9 roll=0 threshold=.6 roar=.5 shimmer=.2 sympathy=.15 width=.4 bend=50 fallBack=.3 volume=0 | dry | steps | The quickest brush on short fifths, half note and half air
Whisk and bowl | - | metal=Silver beater=Brush hardness=.9 place=.6 climb=.4 threshold=.05 roar=.4 lowRing=2 highRing=1.5 choke=.8 roll=0 shimmer=.6 sympathy=.1 width=.3 volume=4 | looper | knocks | A quick brush on silver metal, bright and dusty
Broom on planks | - | metal=Plate beater=Brush hardness=.8 place=.2 ground=.8 climb=.1 lowRing=1.5 choke=.8 roll=0 width=.4 threshold=.45 roar=.6 shimmer=.75 sympathy=.05 bend=50 | record | tread | A firm brush on a small plate, dry sweeps
Match struck | - | metal=Harmonic beater=Brush hardness=1 place=.8 ground=.4 climb=.9 threshold=.02 climbTime=.2 roar=.9 highRing=1 lowRing=2 choke=.7 roll=0 shimmer=1 sympathy=.1 width=.5 volume=-0.5 | highpass | calls | A quick brush on harmonic metal that flares into rush
Feather duster | - | metal=Sixths beater=Brush hardness=.7 place=.1 ground=1 climb=.05 lowRing=4 choke=.6 roll=0 sympathy=.6 threshold=.68 climbTime=.4 roar=.6 shimmer=.2 width=.85 | bloomfilter | steps | A brush on sixths with the low key soft behind it
Splash of lime | - | hardness=.8 place=.5 climb=1 threshold=.6 climbTime=.2 roar=.2 highRing=2 lowRing=2 choke=.6 roll=0 shimmer=.6 sympathy=.05 width=.6 bend=-25 volume=0.5 | ripples | calls | Hard felt on fifths, a whole climb for the loud strokes
Cat on the ledge | - | metal=Harmonic hardness=.2 place=.1 ground=.8 climb=.3 lowRing=3 choke=.8 roll=0 sympathy=1 threshold=.5 climbTime=.25 roar=.55 shimmer=.75 width=.5 fallBack=.25 | silent | steps | Soft felt on short harmonic metal with other keys ringing on
Ice in a glass | - | metal=Silver beater=Yarn hardness=.6 climb=.5 roar=0 threshold=.1 climbTime=.2 highRing=5 lowRing=1.5 choke=.5 roll=0 shimmer=1 sympathy=0 width=.85 fallBack=0 volume=-0.5 ground=.85 place=.2 | glints | hearth | Yarn on silver metal, a short stroke and a long cold top
Spark plug | - | metal=Golden beater=Wood hardness=.65 climb=.35 threshold=.2 climbTime=.2 roar=.5 highRing=.6 lowRing=1.5 choke=.8 roll=0 shimmer=.2 sympathy=.15 width=.4 ground=.85 place=.15 | valve | knocks | Hard wood on golden metal, a crack and a spit of rush
Hand drum dusk | - | metal=Sixths hardness=.35 place=.05 ground=1 climb=.15 lowRing=1.8 highRing=.4 choke=.75 roll=0 bend=30 threshold=.45 climbTime=.2 roar=.05 shimmer=.55 sympathy=.1 width=.2 | giant | tread | Felt in the middle of short sixths, a soft skin of a note | drum
`,
    },
    {
      id: 'silver-glass',
      name: 'Silver glass',
      category: 'bell',
      rows: `
Dresser shelf | Silver glass | roll=0 hardness=.35 highRing=3 bend=8 volume=2.5 | dry | rain | Light wood on silver metal, every cup in its place
Ceiling of drops | Silver glass | climb=.8 threshold=.05 roar=0 highRing=7 roll=.2 rollSpeed=3 fallBack=.35 rollSwell=3.5 | hall | hearth | Wood on silver metal that lights a whole ceiling of glass
Thin ice singing | Silver glass | bend=-90 roll=0 ground=.6 lowRing=8 fallBack=.55 | stillwater | calls | Wood on silver metal, every note bending upward as it starts
Perfume tray | Silver glass | shimmer=3 roll=0 place=.3 width=1 fallBack=.2 volume=4 ground=.55 | chorus 1.mix=0.35 | veil | Soft wood on silver metal in quick sweet beats
Night ward | Silver glass | roll=.6 rollSpeed=5 ground=.7 hardness=.05 lowRing=6 rollSwell=.4 | blanket | turn | The softest wood on silver metal, tapping quietly on one note
Winter pane | - | metal=Silver beater=Wood hardness=.15 place=.25 ground=.6 climb=.1 lowRing=26 highRing=8 roll=0 choke=0 threshold=.68 climbTime=.3 roar=.5 shimmer=.9 width=.6 bend=48 fallBack=.05 volume=0.5 | longplate | rain | Soft wood on silver metal, long and colourless
Lit decanter | - | metal=Silver beater=Wood hardness=.6 place=.6 climb=.3 lowRing=18 highRing=9 roll=0 choke=.05 shimmer=.1 threshold=.42 climbTime=1.1 roar=.18 sympathy=.35 width=.4 volume=0 | plate | veil | Hard wood on silver metal, sharp edged and still
Optician asleep | - | metal=Silver beater=Wood hardness=.15 ground=0 place=.15 lowRing=10 highRing=6 climb=.4 roll=0 choke=.1 threshold=.36 climbTime=2.2 roar=.1 shimmer=.9 width=.6 fallBack=0 volume=-4.5 | pipe | hearth | Wood on silver metal with the ground polished away
Case by the window | - | metal=Silver beater=Wood hardness=.1 climb=.5 threshold=.02 climbTime=1.5 roar=0 lowRing=20 highRing=12 roll=0 shimmer=.7 sympathy=.6 bend=8 fallBack=.45 | edges | hearth | Soft wood on silver metal, light arriving late behind the glass
Sleigh at a distance | - | metal=Silver beater=Wood hardness=.8 place=.8 ground=.2 roll=.8 rollSpeed=7 rollSwell=1 lowRing=3 highRing=2 choke=.4 threshold=.6 climbTime=.4 roar=.45 shimmer=.9 sympathy=.05 width=.6 fallBack=.65 volume=0 | steps | pairs | Hard wood shaken at the rim of silver metal, seven strokes a second
Moon on the basin | - | metal=Silver hardness=.35 place=.2 ground=.7 climb=.6 threshold=.1 climbTime=1.2 roar=0 highRing=12 lowRing=22 roll=0 choke=.05 shimmer=.2 sympathy=.35 width=.4 fallBack=.2 | frozen | calls | Felt on silver metal, a dark stroke and then a pale ring
Breathed on silver | - | metal=Silver hardness=.1 place=.05 ground=.9 climb=.3 roar=.8 highRing=3 lowRing=12 roll=0 choke=.2 threshold=.18 climbTime=.4 shimmer=.6 sympathy=.6 width=.6 bend=12 fallBack=.35 volume=-10.5 | mist | pairs | Soft felt on silver metal with a mist of rush over it
Lens left open | - | metal=Silver hardness=.6 climb=.9 threshold=.02 climbTime=8 roar=.05 highRing=20 lowRing=34 roll=0 choke=0 shimmer=.9 sympathy=.5 bend=12 fallBack=0 | reveal | one | Felt on silver metal that goes on clearing for as long as it rings | pad
Dusk behind glass | - | metal=Silver hardness=.25 shimmer=1.2 climb=.4 ground=.4 lowRing=16 roll=.25 rollSpeed=2 choke=.1 threshold=.18 roar=.5 volume=-1.5 | backwards | window | Felt on silver metal touched twice a second
Ghost in the greenhouse | - | metal=Silver hardness=.5 place=.9 ground=.3 climb=.7 threshold=.05 fallBack=.8 lowRing=24 roll=0 choke=0 climbTime=.3 roar=.22 shimmer=.2 width=.4 volume=2 | throb | veil | Felt at the rim of silver metal, faint light lifting and sinking
Wet finger | - | metal=Silver beater=Bow hardness=.15 ground=.6 place=.2 climb=.2 shimmer=.1 lowRing=20 choke=.15 threshold=.45 climbTime=1.4 roar=.12 width=.5 fallBack=0 volume=-1.5 | plate | halo | The lightest bow on silver metal, one steady rim | organ
Five glasses | - | metal=Silver beater=Bow hardness=.35 ground=.3 place=.5 climb=.4 shimmer=.6 highRing=6 lowRing=10 choke=.3 threshold=.1 climbTime=1.4 roar=.45 sympathy=.45 width=.5 | chapel | hymn | A bow on silver metal, a chord of rims gently out of step | organ
Tavern table | - | metal=Silver beater=Bow hardness=.6 ground=.8 place=.1 climb=.1 lowRing=4 choke=.6 width=.3 threshold=.68 roar=0 shimmer=.1 sympathy=.1 volume=-1 | rotary | counter | A bow on silver metal, plain and quick to stop | organ
Edge of the saucer | - | metal=Harmonic beater=Bow ground=.3 hardness=.2 place=.6 climb=.6 threshold=.02 highRing=16 roar=0 choke=.1 climbTime=1.4 shimmer=.6 sympathy=.5 fallBack=.2 volume=-0.5 | thinair | halo | A light bow towards the edge of harmonic metal, glass without grit | organ
Humming tumbler | - | metal=Fifths beater=Bow ground=.5 hardness=.1 place=.3 climb=.3 highRing=12 roar=0 shimmer=0 lowRing=16 choke=.2 threshold=.08 climbTime=1.4 sympathy=.52 fallBack=.3 | spiral | pairs | A light bow on fifths with no beating in it at all | organ
Music room cabinet | - | metal=Harmonic beater=Wood hardness=.25 ground=.5 place=.2 climb=.1 lowRing=5 highRing=2 roll=0 choke=.3 threshold=.82 climbTime=1.1 roar=.18 shimmer=.2 sympathy=.12 width=.45 bend=-35 volume=0.5 | chamber | rain | Soft wood on harmonic metal, a small sweet glass
Sugared almonds | - | metal=Harmonic beater=Wood hardness=.5 ground=.2 place=.5 climb=.3 lowRing=7 highRing=4 roll=0 choke=.25 shimmer=1.5 threshold=.12 climbTime=2.2 roar=.08 sympathy=.35 width=.6 fallBack=0 volume=0 | tiny | window | Wood on harmonic metal with hardly a ground, light and sugary
Carousel stopped | - | metal=Harmonic beater=Wood ground=0 hardness=.15 roll=.5 rollSpeed=5 rollSwell=.3 lowRing=9 climb=.2 choke=.2 threshold=.5 climbTime=.6 roar=.2 shimmer=.2 sympathy=.8 width=.4 fallBack=.3 volume=-1 | spin | window | Wood on harmonic metal, fluttering on each key with no bass in it
Thimble of light | - | metal=Harmonic beater=Yarn ground=.1 hardness=.7 place=.7 climb=.5 highRing=2 lowRing=2 choke=.5 roll=0 threshold=.5 climbTime=.4 roar=.55 shimmer=.6 sympathy=.35 width=.45 bend=12 volume=4.5 | box | drops | Hard yarn on harmonic metal, small and brilliant
Slipper on the stair | - | metal=Harmonic hardness=.3 ground=.1 place=.8 climb=.7 threshold=.02 climbTime=.8 roar=0 highRing=10 lowRing=14 roll=0 shimmer=.2 width=.4 bend=35 volume=4 | bloomtail | halo | Felt at the rim of harmonic metal, clear tones coming after
Aqueduct | - | beater=Wood hardness=.2 ground=.3 place=.5 climb=.6 threshold=.05 roar=0 highRing=20 lowRing=16 roll=0 choke=.05 climbTime=1.6 shimmer=1.3 sympathy=.8 volume=0.5 | valley | halo | Soft wood on fifths with a top that rings as long as the key
Clear spring | - | beater=Wood hardness=.2 ground=.15 place=.85 climb=.08 highRing=3 lowRing=11 roll=0 choke=.2 shimmer=0 threshold=.24 climbTime=.3 roar=.18 sympathy=.45 width=.5 volume=3.5 | nearmic | drops | Wood on fifths, pure and unbeating
Glazier | - | beater=Yarn hardness=.7 ground=.1 place=.8 climb=.8 threshold=0 climbTime=.2 roar=0 highRing=5 lowRing=4 roll=0 choke=.2 shimmer=1.3 sympathy=.52 width=.95 volume=-2 | glassblur | hearth | Hard yarn at the rim of fifths, all of it lit at once
Icebreaker far off | - | hardness=.9 ground=.7 place=.5 climb=.8 threshold=.55 roar=.6 highRing=6 lowRing=20 roll=0 bend=-40 choke=0 climbTime=.4 shimmer=1.8 sympathy=.65 width=.5 fallBack=.45 | shore | calls | Hard felt on fifths, a blow and a spray of ice
Prism by the bed | - | beater=Wood hardness=.3 shimmer=2.5 ground=.4 climb=.3 highRing=5 lowRing=9 roll=0 choke=.2 width=1 threshold=.4 climbTime=.6 roar=.5 sympathy=.52 bend=8 fallBack=.65 volume=0 | prism | window | Wood on fifths, each tone split into a beating pair
Ballroom after three | - | metal=Golden beater=Wood hardness=.2 ground=.6 place=.3 climb=.2 lowRing=14 highRing=6 roll=0 choke=.1 threshold=.9 climbTime=.4 roar=.06 shimmer=.9 sympathy=.5 volume=0 | vinyl | halo | Soft wood on golden metal, old lustres still swinging
Jeweller's drawer | - | metal=Golden beater=Wood hardness=.4 ground=.7 place=.2 climb=.5 threshold=.05 roar=0 highRing=7 lowRing=8 roll=0 climbTime=.45 shimmer=.2 width=.66 bend=-35 fallBack=.1 volume=-5 | widetop | hearth | Wood on golden metal with a long clear top
Gilt mirror | - | metal=Golden beater=Yarn hardness=.5 ground=.1 place=.2 climb=.3 lowRing=10 highRing=4 roll=0 choke=.2 shimmer=.2 threshold=.2 climbTime=1.6 roar=.18 sympathy=.35 width=.85 bend=8 fallBack=.2 volume=2.5 | harmonic | hearth | Yarn on golden metal with its ground behind the glass
Wine by the fire | - | metal=Golden hardness=.3 ground=.4 climb=.8 threshold=.02 climbTime=1 roar=.1 highRing=14 lowRing=18 roll=0 choke=.05 shimmer=.2 sympathy=.35 width=.66 bend=-18 fallBack=.3 | haze | pairs | Felt on golden metal, a slow amber shine above the stroke
Broken necklace | - | metal=Golden beater=Wood ground=.5 hardness=.4 roll=.7 rollSpeed=4 rollSwell=.1 lowRing=2 highRing=2 choke=.5 threshold=.55 climbTime=1.1 roar=.62 shimmer=.6 sympathy=.35 width=.2 volume=-4.5 place=.2 | stars | hearth | Wood on golden metal, small stones falling one by one
Wind in the prisms | - | metal=Silver beater=Wood hardness=.3 roll=.8 rollSpeed=2 rollSwell=.2 lowRing=8 highRing=6 ground=.4 choke=.1 climb=.2 threshold=.68 roar=.55 shimmer=1.2 sympathy=.5 volume=-4 place=.25 | flock | lamp | Wood on silver metal, loose strokes two to the second | texture
Curtain of glass | - | metal=Silver beater=Wood hardness=.35 roll=1 rollSpeed=5 rollSwell=.5 place=.7 ground=.3 lowRing=5 highRing=5 climb=.4 shimmer=1 threshold=.05 roar=.25 sympathy=.35 width=.9 fallBack=.2 volume=-1 | ripples | lamp | Wood on silver metal, five light strokes a second at the rim | texture
Chimes in an alley | - | metal=Plate beater=Wood hardness=.3 roll=.7 rollSpeed=3 rollSwell=.1 ground=.4 lowRing=4 highRing=3 climb=.1 choke=.2 threshold=.82 roar=.45 shimmer=2.8 sympathy=.12 width=.45 volume=-1 | stair | window | Soft wood on a small plate, three strokes a second | texture
Rain on the cloche | - | metal=Silver beater=Yarn hardness=.7 roll=.9 rollSpeed=11 rollSwell=1.5 ground=.2 place=.5 lowRing=1.5 highRing=1 choke=.4 sympathy=.8 threshold=.42 climbTime=.4 roar=.05 shimmer=2 width=.6 fallBack=0 volume=-0.5 | weather 1.sway=0.3 | pairs | Firm yarn pattering on silver metal | texture
Shop of lamps | - | metal=Harmonic beater=Wood hardness=.2 roll=.6 rollSpeed=1.6 rollSwell=.1 ground=.3 lowRing=10 highRing=8 climb=.5 roar=0 choke=.1 threshold=.36 shimmer=.2 sympathy=.8 width=.6 fallBack=.45 | orbits | window | Wood on harmonic metal, a slow stroke again and again
Aurora pane | - | metal=Silver roll=1 rollSpeed=16 rollSwell=4 hardness=.1 ground=.3 climb=.9 threshold=0 climbTime=2 roar=0 highRing=20 shimmer=.6 sympathy=.45 width=.55 fallBack=.1 volume=-10 | shimmer | dawn | A felt roll on silver metal, four seconds to full glass | pad
Fountain in frost | - | metal=Silver beater=Yarn roll=.9 rollSpeed=13 rollSwell=1 ground=0 hardness=.3 climb=.6 highRing=8 shimmer=.5 threshold=.18 climbTime=.5 roar=.25 sympathy=.5 width=.45 fallBack=.55 volume=-6.5 place=.1 | sustain | lamp | Yarn rolled on silver metal with nothing under it | pad
Cathedral dust | - | metal=Silver beater=Brush hardness=.4 ground=.1 place=.5 climb=1 threshold=0 climbTime=.5 roar=0 highRing=14 roll=.3 rollSpeed=2 shimmer=.9 sympathy=.45 width=.85 bend=-16 fallBack=.2 rollSwell=3.5 | monks | plain | A brush on silver metal, dust lit from a high window | pad
Soap film | - | metal=Silver beater=Yarn roll=.5 rollSpeed=8 rollSwell=2 shimmer=4.5 ground=.5 climb=.5 roar=.2 width=1 highRing=6 threshold=.5 climbTime=.5 sympathy=.52 fallBack=.3 volume=1.5 | phaser | fall | Yarn rolled on silver metal, its colours beating apart | pad
Glasshouse morning | - | metal=Silver hardness=.2 roll=.4 rollSpeed=6 rollSwell=3 ground=.8 climb=.35 threshold=.1 lowRing=30 sympathy=1 climbTime=1.8 roar=.18 shimmer=1.4 width=.9 fallBack=0 | pan | lamp | Soft felt on silver metal, low and wide with a glass roof | pad
Great glass bowl | - | metal=Silver hardness=.3 place=.05 ground=1 climb=.2 lowRing=40 highRing=6 roll=0 choke=0 width=.4 threshold=.6 climbTime=2.2 roar=.2 shimmer=.6 sympathy=.5 bend=18 | bowls | earth | Felt on low silver metal, a bowl the size of a room
Aquarium wall | - | metal=Silver beater=Yarn hardness=.2 ground=.9 place=.2 climb=.3 lowRing=14 roll=0 choke=.3 shimmer=.4 threshold=.05 climbTime=.6 roar=.18 sympathy=.05 width=.5 bend=-35 fallBack=.35 | underwater | cellar | Yarn on low silver metal, thick glass and water
Ship's decanter | - | metal=Silver beater=Wood hardness=.35 ground=.8 place=.4 lowRing=9 highRing=4 roll=0 choke=.35 bend=35 climb=.2 threshold=.45 climbTime=.4 roar=.12 shimmer=.6 sympathy=.6 width=.95 | seasick | lowline | Wood on low silver metal, each note leaning as the ship does
Beam going round | - | metal=Silver hardness=.8 place=.5 ground=.6 climb=1 threshold=.45 climbTime=.6 fallBack=1 roar=.1 highRing=6 lowRing=36 roll=0 choke=0 shimmer=.2 sympathy=.35 width=.5 bend=-18 volume=-1.5 | around | one | Hard felt on silver metal, its beam coming round and going
Vase in the hall | - | metal=Silver beater=Yarn hardness=.4 ground=.7 place=.3 climb=0 lowRing=7 highRing=2 roll=0 choke=.4 threshold=.68 climbTime=1.6 roar=0 shimmer=0 sympathy=.6 | hollow | turn | Yarn on silver metal with no climb, a plain glass note
`,
    },
    {
      id: 'sub-earth',
      name: 'Sub earth',
      category: 'bass',
      rows: `
Clay underfoot       | Sub earth     | bend=0 lowRing=8 choke=.6 roll=0 | dry         | lowline | Felt in the middle of harmonic metal, the key and nothing else
Below the pantry | Sub earth | hardness=.4 place=.15 climb=.3 threshold=.2 climbTime=.5 roll=0 | valve | trudge | Felt on harmonic metal with a little of its upper light coming up
Quarry floor | Sub earth | bend=110 hardness=.6 lowRing=5 roll=0 place=.3 climb=.45 threshold=.15 climbTime=.3 ground=.75 | iron | lowline | Firm felt on harmonic metal, falling into each low note
Slow mole | Sub earth | roll=.5 rollSpeed=3 rollSwell=.5 lowRing=3 fallBack=0 beater=Yarn hardness=.5 place=.35 climb=.35 threshold=.1 | muffled | earth | Yarn on harmonic metal, three blunt steps a second
Basement river       | Sub earth     | shimmer=.6 lowRing=30 choke=.1 climb=.25 roar=.8 threshold=.2 roll=0 | surf        | pedals  | Felt on harmonic metal with a low rush running under it
Plough | - | hardness=.2 place=.1 ground=.9 climb=.1 lowRing=6 choke=.55 roll=0 width=.2 threshold=.82 climbTime=1.8 roar=.75 shimmer=.25 sympathy=.15 fallBack=0 volume=-13.5 | deep | lowline | Soft felt on low fifths, round and stopped
Two oxen | - | hardness=.4 place=.3 ground=.7 climb=.3 threshold=.2 lowRing=9 highRing=1.5 choke=.5 roll=0 width=.3 shimmer=.2 climbTime=.6 roar=.55 sympathy=.15 | centre | - | Felt on low fifths, the octave walking beside the key
Wet oak | - | beater=Yarn hardness=.2 ground=.8 place=.15 climb=.15 lowRing=4 choke=.6 roll=0 width=.2 threshold=.5 climbTime=.25 roar=.12 shimmer=.55 sympathy=.08 bend=-20 | woodbody | trudge | Yarn on low fifths, thick and woody
Harbour wall | - | hardness=.6 ground=.8 place=.2 climb=.5 threshold=.15 climbTime=.8 roar=.3 lowRing=16 choke=.3 roll=0 shimmer=.15 sympathy=0 bend=45 fallBack=0 | cave | earth | Firm felt on low fifths, a slow dull light over a long ring
Sounding lead | - | hardness=.1 place=0 ground=1 climb=0 shimmer=0 lowRing=12 choke=.5 roll=0 width=0 sympathy=0 threshold=.9 climbTime=.4 roar=.05 | softtape | lowline | The softest felt on fifths, as near to one tone as it goes
Gate weight | - | metal=Harmonic beater=Yarn hardness=.4 place=.2 ground=.7 climb=.2 lowRing=3 highRing=.6 choke=.6 roll=0 width=.3 threshold=.45 climbTime=.6 roar=.5 shimmer=.55 sympathy=.08 bend=20 fallBack=.3 | deck | trudge | Yarn on harmonic metal, low and nearly plucked
Cart axle | - | metal=Harmonic beater=Yarn hardness=.7 place=.4 ground=.5 climb=.4 threshold=.1 highRing=1 lowRing=5 choke=.5 roll=0 climbTime=.25 roar=.02 shimmer=.15 bend=35 fallBack=0 volume=-2 | combo | - | Firm yarn on harmonic metal, its upper tones barking
Kitchen garden | - | metal=Harmonic hardness=.5 ground=.6 climb=.2 lowRing=2 highRing=.5 choke=.8 roll=0 width=.2 sympathy=0 threshold=.68 climbTime=1.2 roar=.5 shimmer=.7 fallBack=.3 | tightplate | trudge | Felt on short harmonic metal, clipped and even
Slow tractor | - | metal=Harmonic beater=Wood hardness=.2 ground=.8 place=.2 climb=.1 lowRing=4 choke=.5 roll=0 width=.2 threshold=.75 climbTime=.4 roar=.45 shimmer=.25 sympathy=.15 | cassette | lowline | Soft wood on harmonic metal, a click before every low note
Boats under an arch | - | metal=Harmonic hardness=.3 ground=.8 climb=.35 threshold=.1 climbTime=.6 highRing=3 lowRing=14 choke=.3 roll=0 roar=.25 shimmer=0 sympathy=.08 width=.4 bend=60 | stair | pedals | Felt on harmonic metal, its light reflected from below
Peat stack | - | metal=Sixths hardness=.15 place=.1 ground=.9 climb=.1 lowRing=14 choke=.5 roll=0 width=.2 threshold=.6 climbTime=.25 roar=.25 shimmer=0 sympathy=0 bend=20 | fuzz | lowline | Soft felt on low sixths, dark as peat
Turnip lantern | - | metal=Sixths beater=Yarn hardness=.4 ground=.7 climb=.4 threshold=.1 climbTime=.3 roar=.1 lowRing=12 choke=.5 roll=0 shimmer=.55 sympathy=.35 width=.2 bend=35 | flutes | - | Yarn on low sixths with a small light inside
Horse blanket | - | metal=Sixths beater=Yarn hardness=.1 ground=1 place=.05 lowRing=9 climb=.05 choke=.6 roll=0 shimmer=.3 threshold=.45 climbTime=.4 roar=.2 sympathy=.15 width=.08 volume=-11 | blanket | trudge | The softest yarn on sixths, all warmth
Iron stove | - | metal=Sixths hardness=.7 ground=.8 climb=.6 threshold=.2 climbTime=.4 roar=.7 lowRing=20 highRing=1.5 choke=.4 roll=0 shimmer=.7 fallBack=.25 | howl | earth | Firm felt on low sixths with a rush of heat above
Field boundary | - | metal=Sixths hardness=.35 ground=.6 place=.3 bend=-60 lowRing=10 choke=.5 roll=0 climb=.2 threshold=.68 climbTime=.6 roar=.12 shimmer=.25 sympathy=0 width=.22 | spring | lowline | Felt on sixths, each low note pushed up into place
Bull's bell | - | metal=Golden hardness=.4 place=.15 ground=.9 climb=.3 lowRing=10 choke=.45 roll=0 width=.3 threshold=.36 climbTime=1.8 roar=.45 shimmer=.55 sympathy=.08 | iron | - | Felt on low golden metal, dented and heavy
Furrow | - | metal=Golden hardness=.2 place=.05 ground=1 climb=.5 threshold=.1 climbTime=1 roar=.6 lowRing=14 choke=.4 roll=0 shimmer=.15 sympathy=0 width=.4 fallBack=0 | fuzz | lowline | Soft felt on golden metal with a dark rush behind
Brass ox | - | metal=Golden beater=Yarn hardness=.5 ground=.8 place=.2 climb=.2 bend=70 lowRing=5 choke=.5 roll=0 threshold=.68 climbTime=.25 roar=.25 shimmer=.7 sympathy=.35 width=.08 fallBack=0 | giant | trudge | Yarn on low golden metal, bent by the weight of the hand
Thunder in a jar | - | metal=Golden hardness=.8 ground=.8 climb=.9 threshold=.6 climbTime=.5 roar=1 lowRing=12 highRing=2 choke=.35 roll=0 shimmer=.25 width=.15 fallBack=.4 | cistern | lowline | Hard felt on golden metal, a storm of rush on the loud notes
Tiller | - | metal=Golden beater=Wood hardness=.1 ground=1 place=.05 climb=.1 lowRing=4 choke=.6 roll=0 width=.15 shimmer=.2 threshold=.82 climbTime=.4 roar=.2 sympathy=.05 | sampler | trudge | The softest wood on golden metal, short and blunt
Boiler room | - | metal=Plate hardness=.4 place=.05 ground=1 climb=.3 roar=.5 lowRing=8 highRing=1 choke=.5 roll=0 width=.3 threshold=.24 shimmer=.15 bend=45 fallBack=0 | nextdoor | - | Felt on a great plate, its clang kept behind the key
Lorry at idle | - | metal=Plate roll=.8 rollSpeed=7 rollSwell=.2 hardness=.3 ground=1 place=.05 lowRing=2 climb=.2 choke=.7 threshold=.82 roar=.05 shimmer=.7 sympathy=.35 width=.15 fallBack=.05 volume=-6 | nearmic | earth | Felt rolled on a great plate, low and shuddering
Dock gate | - | metal=Plate beater=Yarn hardness=.6 ground=.9 place=.2 climb=.5 threshold=.15 roar=.6 lowRing=14 choke=.3 roll=0 bend=40 shimmer=.25 sympathy=.15 width=.22 fallBack=.4 | swarm | lowline | Yarn on a great plate, iron closing on iron
Skip hire | - | metal=Plate beater=Yarn hardness=.5 ground=.8 place=.35 climb=.35 lowRing=3 highRing=.5 choke=.7 roll=0 width=.2 threshold=.15 roar=.2 shimmer=0 fallBack=.05 bend=90 | pipe | trudge | Yarn on a plate, a short low bang that bends down
Old safe | - | metal=Plate hardness=.15 place=0 ground=1 climb=.1 lowRing=6 choke=.4 roll=0 shimmer=.15 width=.1 threshold=.45 roar=.75 bend=-20 fallBack=.05 | gatedroom | pedals | Soft felt in the middle of a plate, shut tight
Frozen ford | - | metal=Silver hardness=.3 place=.1 ground=1 climb=.2 lowRing=14 highRing=4 choke=.45 roll=0 width=.3 threshold=.68 climbTime=1.8 roar=.2 shimmer=0 sympathy=.15 bend=-20 fallBack=.3 | flanger | lowline | Felt on low silver metal, the key with a skin of ice
Diver with a lamp | - | metal=Silver hardness=.2 ground=.8 climb=.6 threshold=.05 climbTime=1 roar=0 highRing=8 lowRing=20 choke=.3 roll=0 shimmer=.55 sympathy=.08 width=.45 bend=45 fallBack=.25 | underwater | earth | Soft felt on low silver metal and a thin light above it
Lead and glass | - | metal=Silver beater=Yarn hardness=.4 ground=.9 place=.2 climb=.2 lowRing=6 choke=.5 roll=0 shimmer=.8 threshold=.82 climbTime=.25 roar=0 sympathy=0 width=.15 bend=60 fallBack=.3 | chorus | - | Yarn on low silver metal, heavy with a glassy edge
Cold press | - | metal=Silver beater=Wood hardness=.4 ground=.9 place=.15 climb=.1 lowRing=3 highRing=1 choke=.7 roll=0 width=.2 threshold=.6 climbTime=1.2 roar=.18 shimmer=.7 sympathy=.15 bend=20 | slap | trudge | Wood on low silver metal, short and clear
Drain cover | - | metal=Silver hardness=.7 ground=.8 bend=90 climb=.4 roar=.4 lowRing=8 choke=.5 roll=0 sympathy=0 threshold=.46 climbTime=.4 shimmer=.25 width=.3 | pipe | lowline | Firm felt on low silver metal, dropping as it rings
Low bow at night | - | metal=Harmonic beater=Bow hardness=.25 ground=.9 place=.1 climb=.15 lowRing=5 choke=.5 width=.2 threshold=.45 climbTime=.6 roar=.55 shimmer=0 sympathy=.35 | room | cellar | A bow on low harmonic metal, dark and even
Winch drum | - | beater=Bow hardness=.7 ground=.8 place=.3 climb=.5 threshold=.1 roar=.4 lowRing=4 choke=.6 climbTime=.25 shimmer=0 sympathy=.15 width=.22 volume=-2.5 | downhall | lowline | A firm bow on low fifths, grinding a little
Silo filling | - | metal=Golden beater=Bow hardness=.4 ground=1 place=.1 climb=.6 climbTime=2 roar=.5 threshold=.1 lowRing=12 choke=.3 shimmer=.55 sympathy=.08 width=.3 | darkhall | earth | A bow on low golden metal that fills with grain slowly
Whale road | - | metal=Sixths beater=Bow hardness=.3 ground=.9 bend=-40 climb=.3 lowRing=20 choke=.3 shimmer=.8 threshold=.5 climbTime=.4 roar=.05 sympathy=0 width=.4 | mist | cellar | A bow on low sixths, every note curling up as it ends
Bog iron | - | metal=Plate beater=Bow hardness=.5 ground=1 place=.1 climb=.4 roar=.7 lowRing=6 choke=.5 width=.3 threshold=.55 shimmer=.7 sympathy=.35 | fuzz 1.mix=0.35 | lowline | A bow on a low plate, rough and brown
Heart of the mill | - | roll=.7 rollSpeed=2 rollSwell=.2 hardness=.3 ground=.9 place=.1 lowRing=3 climb=.2 choke=.6 threshold=.82 roar=.25 shimmer=.15 sympathy=.08 width=.4 fallBack=.05 | bandpulse | earth | Felt on low fifths, two beats in a second
Long low roll | - | metal=Harmonic roll=1 rollSpeed=12 rollSwell=2 hardness=.2 place=.05 ground=1 climb=.3 threshold=.1 lowRing=8 choke=.5 roar=.62 shimmer=.7 sympathy=0 width=.08 | dry | pedals | Felt rolled low on harmonic metal, swelling for two seconds
Ground being turned | - | metal=Golden roll=.9 rollSpeed=8 rollSwell=3 hardness=.2 ground=1 place=.1 climb=.8 roar=.9 threshold=.05 highRing=1 climbTime=.4 shimmer=.25 sympathy=.35 width=.15 fallBack=.5 | rotary | earth | Felt rolled on low golden metal, rush rising out of the ground
Drummer's cellar | - | metal=Sixths roll=.6 rollSpeed=4 rollSwell=.1 beater=Yarn hardness=.5 ground=.8 lowRing=2 highRing=.6 choke=.7 climb=.1 threshold=.45 roar=.55 shimmer=.25 width=.22 fallBack=.05 volume=1 | trem | trudge | Yarn on short low sixths, beaten four times a second
Night train beneath | - | metal=Harmonic roll=.8 rollSpeed=5 rollSwell=1 hardness=.4 place=.2 ground=.8 lowRing=4 climb=.5 threshold=.1 roar=.6 climbTime=.6 shimmer=.55 sympathy=.08 width=.3 | slowing | pedals | Felt on harmonic metal, a train going under the house
Hatch let go | - | bend=150 hardness=.6 ground=1 place=.1 lowRing=4 choke=.5 roll=0 climb=.3 width=.2 threshold=.42 climbTime=.4 roar=.75 shimmer=.25 sympathy=0 fallBack=0 | dry | lowline | Firm felt on low fifths that drops steeply into the note
Hoist in a shaft | - | metal=Harmonic bend=-150 hardness=.5 ground=.9 lowRing=8 choke=.4 roll=0 climb=.4 highRing=3 threshold=.6 climbTime=1.8 roar=.2 shimmer=0 sympathy=.35 width=.4 | subs | earth | Felt on harmonic metal, hauled up from below
Sunrise in the mine | - | hardness=.4 ground=.7 place=.2 climb=.9 threshold=.05 climbTime=1.5 roar=.15 highRing=8 lowRing=24 choke=.3 roll=0 shimmer=.55 sympathy=.15 width=.08 | sweep | pedals | Felt on low fifths with all four registers waking above it
Under the crater | - | metal=Sixths hardness=.5 ground=.8 climb=1 threshold=.1 climbTime=.8 fallBack=.9 roar=.8 lowRing=34 choke=.2 roll=0 shimmer=.15 sympathy=.08 width=.15 bend=-20 | half | earth | Felt on low sixths, heat that rises in waves
Buried gong | Falling gong | hardness=.3 place=.05 ground=1 climb=.2 width=.2 lowRing=14 roll=0 sympathy=.8 | monks | cellar | Soft felt on low golden metal, bent far up and sinking
`,
    },
    {
      id: 'brushed-air',
      name: 'Brushed air',
      category: 'texture',
      rows: `
Willow on a drum | Brushed air | roar=.4 hardness=.2 ground=.7 fallBack=.35 rollSpeed=9.5 | dry | pairs | A soft brush on fifths, the key showing through each sweep
Sand against a door | Brushed air | hardness=.95 roll=.9 rollSpeed=6 highRing=1 width=.6 fallBack=.55 | booth | one | A hard brush scraping at fifths again and again
White curtains | Brushed air | metal=Silver roar=.2 highRing=7 climb=.9 shimmer=.4 fallBack=.2 rollSpeed=9.5 | expanse | veil | A brush on silver metal that leaves long clear tones hanging
Wheat leaning | Brushed air | metal=Golden roll=.8 rollSpeed=2 rollSwell=4 hardness=.3 fallBack=.3 volume=2.5 | around | dawn | A brush on golden metal in wide slow sweeps
Nets over the side | Brushed air | metal=Sixths ground=.8 lowRing=30 climb=.3 roll=.2 fallBack=0 rollSpeed=9.5 | surf | plain | A brush on sixths with a long dark floor
Breath before words | - | beater=Brush hardness=.05 place=.1 ground=.5 climb=.2 roar=.5 roll=0 lowRing=8 choke=.4 threshold=.82 climbTime=.25 shimmer=.7 sympathy=.35 width=.6 bend=32 volume=-1 | nearmic | turn | The softest brush on fifths, hardly more than a breath
Moth at the shade | - | beater=Brush hardness=.6 place=.7 ground=.2 climb=.4 roll=1 rollSpeed=13 lowRing=3 highRing=2 choke=.5 threshold=.46 roar=.5 shimmer=2.8 sympathy=.12 fallBack=.35 rollSwell=.2 volume=5.5 | trem | onehigh | A brush fluttering quickly at the rim of fifths
Ash falling | - | beater=Brush hardness=.3 place=.4 ground=.3 climb=.7 threshold=.02 roar=.1 highRing=9 roll=.3 rollSpeed=3 sympathy=.8 shimmer=2 width=.9 rollSwell=1.4 | falling | fall | A brush on fifths whose rungs ring clear afterwards
Dust road | - | beater=Brush hardness=.8 place=.3 ground=.6 roar=1 climb=.8 highRing=.8 lowRing=6 roll=.4 threshold=.46 climbTime=.4 shimmer=1.2 sympathy=.15 width=.5 fallBack=.2 rollSpeed=5.5 rollSwell=.2 | record | cross | A firm brush on fifths, dry rush around the key
Chapel broom | - | beater=Brush hardness=.4 place=.2 ground=.8 climb=.3 lowRing=24 highRing=6 roll=0 choke=.1 threshold=.24 climbTime=1.2 roar=.5 shimmer=.7 sympathy=.65 width=.6 fallBack=.3 volume=-10 | nave | hymn | A brush drawn over a chord of fifths and left to ring
Snow sliding off slates | - | metal=Harmonic beater=Brush hardness=.2 ground=.4 place=.5 climb=.5 roar=.6 lowRing=6 roll=.5 rollSpeed=2 rollSwell=.5 threshold=.5 climbTime=.25 shimmer=2 sympathy=.52 width=.5 fallBack=.35 volume=-1 | darkhall | fall | A soft brush on harmonic metal, loads of air letting go
Page turning | - | metal=Harmonic beater=Brush hardness=.9 ground=.5 place=.3 climb=.1 lowRing=1.5 highRing=.6 roll=0 choke=.8 threshold=.5 roar=.5 shimmer=1.2 sympathy=.15 bend=40 fallBack=0 volume=1.5 | booth 1.mix=0.3 | knocks | A quick brush on short harmonic metal
Larch wood | - | metal=Harmonic beater=Brush hardness=.5 ground=0 place=.6 climb=.8 threshold=.02 roar=.5 highRing=3 shimmer=3 roll=.6 climbTime=.4 width=1 rollSpeed=11 rollSwell=.4 | flock | veil | A brush on harmonic metal with the ground gone, needles in wind
Coat on the hook | - | metal=Harmonic beater=Brush hardness=.1 ground=.9 place=.05 climb=.1 lowRing=14 roll=.2 sympathy=.5 choke=.3 threshold=.9 climbTime=3 roar=.75 shimmer=2.8 width=.9 bend=16 fallBack=0 rollSpeed=5.5 rollSwell=3.5 | pillow | lamp | A very soft brush in the middle of harmonic metal
Tuning the harp room | - | metal=Harmonic beater=Brush hardness=.7 ground=.3 place=.8 climb=1 threshold=0 roar=0 highRing=14 roll=0 choke=.2 climbTime=1.2 shimmer=2 sympathy=.52 width=.5 fallBack=0 | silent | window | A firm brush on harmonic metal, clear overtones standing up
Hay loft | - | metal=Sixths beater=Brush hardness=.4 ground=.6 place=.3 climb=.4 roar=.7 lowRing=12 highRing=1 roll=.3 threshold=.42 climbTime=.4 shimmer=2.8 sympathy=.12 width=.9 fallBack=.55 rollSpeed=4.5 rollSwell=.2 | woodbody | plain | A brush on sixths, warm and full of dust
Rushes cut | - | metal=Sixths beater=Brush hardness=.8 ground=.4 place=.6 roll=.7 rollSpeed=4 rollSwell=.2 lowRing=5 climb=.5 choke=.5 threshold=.5 climbTime=3 roar=.7 shimmer=2 width=.5 fallBack=.2 volume=2 | notch | fall | A brush swept round firmly on sixths
Old lace | - | metal=Sixths beater=Brush hardness=.3 ground=.1 place=.8 climb=.6 threshold=.05 roar=.05 highRing=12 shimmer=1.5 roll=.2 climbTime=1.2 sympathy=.12 width=.2 fallBack=.3 rollSpeed=4.5 rollSwell=.2 volume=2 | vinyl | halo | A brush on sixths, thin clear tones full of holes
Murmur under a dome | - | metal=Sixths beater=Brush hardness=.2 ground=.3 roar=1 climb=1 threshold=0 climbTime=.6 lowRing=16 roll=.6 rollSwell=3 shimmer=.7 sympathy=.35 width=1 fallBack=0 | vowel | cross | A soft brush on sixths, its rush gathering for three seconds
Sail losing wind | - | metal=Sixths beater=Brush hardness=.5 ground=.7 bend=120 lowRing=20 climb=.3 roll=0 choke=.2 threshold=.36 climbTime=2 roar=.75 shimmer=2.8 width=.9 fallBack=.45 | melt | calls | A brush on sixths, the pitch sagging as the air goes out
Straw bale sun | - | metal=Golden beater=Brush hardness=.3 ground=.5 place=.2 climb=.3 roar=.3 lowRing=14 roll=0 choke=.25 threshold=.18 shimmer=2 fallBack=.2 volume=-1.5 | plate | pairs | A slow brush on golden metal, gently at odds with itself
Bees in clover | - | metal=Golden beater=Brush hardness=.5 ground=.4 shimmer=5 roll=.7 rollSpeed=11 climb=.5 highRing=3 width=1 threshold=.36 climbTime=2 roar=.5 sympathy=.05 fallBack=.3 rollSwell=.8 volume=-0.5 | glimmer | dawn | A brush circling on golden metal, its pairs buzzing
Furnace mouth | - | metal=Golden beater=Brush hardness=.7 ground=.8 place=.4 roar=1 climb=1 threshold=.05 climbTime=.3 lowRing=18 highRing=2 roll=.5 fallBack=.7 shimmer=.7 sympathy=.6 rollSpeed=13 rollSwell=5 | haze | pedals | A firm brush on low golden metal with a roar of heat
Sequinned sleeve | - | metal=Golden beater=Brush hardness=.7 ground=.1 place=1 climb=.7 threshold=.02 roar=.1 highRing=4 lowRing=3 roll=.5 rollSpeed=5 choke=.5 climbTime=.4 shimmer=2.8 sympathy=.05 width=.45 fallBack=.45 rollSwell=.8 volume=-1.5 | canon | one | A hard brush at the rim of golden metal, small bright points
Desert tape | - | metal=Golden beater=Brush hardness=.2 ground=.6 bend=-35 lowRing=9 climb=.4 roar=.6 roll=.3 rollSwell=2 choke=.4 threshold=.18 climbTime=1.2 shimmer=2 sympathy=.6 width=1 fallBack=.65 rollSpeed=13 | hiss | fall | A soft brush on golden metal, gritty and a shade flat
Bus shelter fog | - | metal=Silver beater=Brush hardness=.1 ground=.5 place=.2 climb=.3 roar=.4 lowRing=16 highRing=6 roll=.3 threshold=.16 climbTime=2 shimmer=2.8 sympathy=.12 fallBack=.65 rollSpeed=9.5 rollSwell=.2 | glassblur | plain | A soft brush on silver metal, fog with a shine in it
Hail on a skylight | - | metal=Silver beater=Brush hardness=.95 ground=.3 place=.8 roll=1 rollSpeed=16 rollSwell=.2 lowRing=2 highRing=2 choke=.6 threshold=.5 climbTime=.4 roar=.6 shimmer=1.1 sympathy=.35 fallBack=.35 volume=0.5 | gatedroom | one | A brush beating very fast on silver metal
Foil stars | - | metal=Silver beater=Brush hardness=.4 ground=0 place=.9 climb=.9 threshold=0 roar=.3 highRing=9 shimmer=4 roll=.4 width=1 climbTime=.6 sympathy=.12 fallBack=.55 rollSpeed=9.5 rollSwell=.2 volume=0.5 | memory | veil | A brush on silver metal, all glitter and no ground
Cold wind, low sun | - | metal=Silver beater=Brush hardness=.4 ground=.8 roar=.8 climb=.6 fallBack=.8 threshold=.2 lowRing=24 roll=.5 rollSpeed=4 climbTime=1.2 shimmer=.7 sympathy=.35 width=.5 rollSwell=1.4 | seasons | lamp | A brush on silver metal, gusts of rush that come and go
Frosted reeds | - | metal=Silver beater=Brush hardness=.3 ground=.4 climb=.5 highRing=4 lowRing=5 roll=.6 rollSpeed=2 sympathy=.9 choke=.5 threshold=.16 roar=.6 shimmer=2.8 width=.6 volume=-1.5 | backwards | fall | A brush on silver metal with two light strokes a second in it
Vane on the stable | Wind on tin | roll=.2 ground=.5 climb=.6 fallBack=.35 volume=1 | weather | cross | A soft brush at the rim of a plate, turning with no hurry
Corrugated night | Wind on tin | hardness=.6 shimmer=1.5 rollSpeed=5 lowRing=8 ground=.4 fallBack=.55 volume=1 | nextdoor | pairs | A firmer brush on tin with quick taps under its sweeps
Loose sheet          | Wind on tin   | beater=Yarn hardness=.5 roll=.8 rollSpeed=3 place=.5 ground=.5                                     | swarm       | one    | Yarn knocking at a sheet of tin, rush between the blows
Scrapyard wind | Wind on tin | metal=Golden roll=.7 rollSpeed=2.5 ground=.3 highRing=9 fallBack=.3 volume=2.5 | stair | fall | A brush at the rim of golden metal, all rush and beating
Empty silos | Wind on tin | metal=Harmonic ground=.6 hardness=.1 roar=.7 lowRing=20 highRing=3 | cistern | pedals | A soft brush at the rim of low harmonic metal, hollow wind
Gravel and gulls | - | metal=Plate beater=Brush hardness=.7 ground=.5 place=.5 roar=.4 climb=.3 lowRing=4 roll=.4 rollSpeed=3 choke=.5 threshold=.2 shimmer=.7 width=.9 fallBack=0 rollSwell=5 volume=-1.5 | spring | calls | A brush on a flat plate, gritty and open
Coal going down | - | metal=Plate beater=Brush hardness=.5 ground=.9 place=.1 roar=.9 climb=.7 lowRing=6 roll=0 bend=60 choke=.5 threshold=.46 shimmer=2.8 sympathy=.45 width=.5 fallBack=.45 volume=-2 | downhall | trudge | A brush drawn down a low plate
Churn lid | - | metal=Plate beater=Brush hardness=.3 ground=.7 place=.3 climb=.2 roll=.5 rollSpeed=1.5 lowRing=10 shimmer=.4 threshold=.5 roar=.5 sympathy=.52 width=.6 rollSwell=5 | radio | lamp | A slow brush going round the wall of a plate
Riddle of ash | - | metal=Plate beater=Brush hardness=.9 ground=.2 place=.9 climb=.5 roar=0 highRing=3 roll=.9 rollSpeed=8 lowRing=2 choke=.6 threshold=.46 shimmer=1.2 sympathy=.45 width=.75 fallBack=.35 rollSwell=.8 volume=1.5 | dotted | one | A hard brush shaken at the rim of a plate
Fan in the dairy | - | metal=Plate beater=Brush hardness=.2 ground=.8 roar=.6 climb=.5 roll=.8 rollSpeed=7 rollSwell=1.5 lowRing=12 width=1 threshold=.24 shimmer=1.6 sympathy=.52 | lungs | lamp | A soft brush turning over a plate, cool and constant
Rush of starlings | - | climb=1 threshold=.02 climbTime=.6 roar=1 highRing=2 lowRing=10 roll=.7 rollSpeed=10 hardness=.4 ground=.2 width=1 fallBack=.6 shimmer=2 sympathy=.35 rollSwell=1.4 volume=-2 | pan | dawn | Felt rolled on fifths until it is a wide rush of wings
Crack in the hillside | - | metal=Harmonic beater=Yarn climb=1 threshold=.3 climbTime=.3 fallBack=1 roar=1 lowRing=30 hardness=.7 roll=.4 shimmer=1.2 sympathy=.12 width=.9 rollSpeed=9.5 rollSwell=.2 | vibrato | one | Yarn on harmonic metal, bursts of rush that fall back
Spray | - | metal=Silver beater=Yarn climb=.9 threshold=.05 climbTime=.2 roar=.9 highRing=1.5 lowRing=4 roll=.6 rollSpeed=3 hardness=.6 choke=.5 shimmer=.7 sympathy=.35 width=.5 fallBack=.45 rollSwell=1.4 | stone | fall | Yarn on silver metal, each stroke breaking into spray
Night sea | - | metal=Sixths climb=.9 threshold=.05 climbTime=1.8 roar=1 highRing=1 lowRing=40 hardness=.3 ground=.6 roll=.3 rollSpeed=2 fallBack=.8 shimmer=2.8 sympathy=.12 width=.6 rollSwell=.2 | currents | pedals | Felt on low sixths, rush rolling in far above
Steam and brass | - | metal=Golden beater=Yarn climb=.9 threshold=.05 climbTime=.5 roar=.9 highRing=3 hardness=.5 roll=0 lowRing=12 choke=.3 shimmer=2 sympathy=.35 width=1 bend=-30 fallBack=.35 | valve | hymn | Yarn on golden metal, a chord and then its steam
Held breath | - | beater=Bow hardness=.2 climb=.8 threshold=.1 climbTime=1 roar=1 ground=.4 lowRing=8 highRing=1.5 choke=.4 shimmer=.1 sympathy=.05 width=.25 | mist | fall | A light bow on fifths turned almost wholly to air | wind
Sedge at dusk | - | metal=Harmonic beater=Bow hardness=.35 place=.6 climb=.6 threshold=.05 roar=.9 ground=.6 lowRing=4 choke=.6 width=.4 climbTime=.4 shimmer=.1 sympathy=.6 volume=-1.5 | pipe | tenor | A bow on harmonic metal with a wind blowing down it | wind
Flute of frost | - | metal=Silver beater=Bow hardness=.25 climb=.5 threshold=.1 roar=.8 ground=.8 place=.2 lowRing=6 highRing=1 choke=.5 climbTime=.4 shimmer=0 sympathy=.05 width=.25 volume=1.5 | flutes | turn | A light bow on silver metal, breath around a plain key | wind
Goatherd resting | - | metal=Sixths beater=Brush hardness=.6 ground=1 place=.05 climb=.2 roar=.6 lowRing=5 roll=0 choke=.6 width=.3 threshold=.5 climbTime=.4 shimmer=.1 sympathy=.6 fallBack=.3 volume=-1.5 | valley | calls | A brush on sixths, a puff of air with a note behind it | wind
Curlew over mud | - | beater=Brush hardness=.8 ground=.9 place=.2 bend=-130 climb=.3 lowRing=4 highRing=1 roll=0 choke=.6 threshold=.36 roar=.5 shimmer=.1 sympathy=.05 width=.25 | shore | calls | A quick brush on fifths, the note curling upward | wind
`,
    },
    {
      id: 'rolling-walls',
      name: 'Rolling walls',
      category: 'drone',
      rows: `
Wall of weather | Rolling wall | metal=Fifths hardness=.5 roar=.6 sympathy=.45 fallBack=.2 | dry | pedals | A quick full roll on fifths, everything open
Dam at night | Rolling wall | ground=.9 place=.2 highRing=3 hardness=.3 beater=Felt rollSpeed=5 shimmer=.6 sympathy=.52 fallBack=.3 | cistern | pedals | Felt rolled slowly on a huge plate, low and heavy
Iron curtain rising | Rolling wall | rollSwell=7 climbTime=2 roar=.15 ground=.9 fallBack=0 place=.2 climb=.7 highRing=3 | cave | one | Yarn rolled on a plate, seven seconds from nothing to full
Scaffold in a gale | Rolling wall | beater=Wood hardness=.3 shimmer=5 rollSpeed=9 lowRing=5 fallBack=.5 sympathy=.52 place=1 ground=.2 roar=.3 climb=.6 | weather | pedals | Wood rolled on a plate, rattling and wide
Waterfall, far bank | Rolling wall | metal=Harmonic roar=1 ground=.3 rollSpeed=16 highRing=2 climbTime=2.2 sympathy=.45 fallBack=.2 | nextdoor 1.distance=0.5 | pairs | Yarn rolled on harmonic metal until it is nearly all water
Organ of hammers | - | metal=Harmonic beater=Yarn roll=1 rollSpeed=16 rollSwell=.5 hardness=.4 climb=.3 threshold=.05 roar=0 lowRing=10 choke=.4 climbTime=1.4 shimmer=0 sympathy=.6 width=.3 | chapel | hymn | Yarn rolled very fast on harmonic metal, as level as pipes | organ
Great door shut | - | metal=Harmonic roll=.9 rollSpeed=7 rollSwell=1 hardness=.15 place=.05 ground=1 climb=.2 lowRing=20 threshold=.75 climbTime=.5 roar=.05 shimmer=.8 sympathy=.05 | giant | pedals | Soft felt rolled in the middle of low harmonic metal
Sunlit factory | - | metal=Harmonic beater=Wood roll=.9 rollSpeed=12 hardness=.4 climb=.8 threshold=.02 roar=.2 highRing=8 lowRing=8 climbTime=1.4 shimmer=1 sympathy=.6 width=1 fallBack=.2 rollSwell=1.4 volume=-12 | console | dawn | Wood rolled on harmonic metal with every register burning
Two dynamos | - | metal=Harmonic roll=1 rollSpeed=14 shimmer=2.2 hardness=.3 ground=.7 climb=.4 width=1 lowRing=12 threshold=.18 climbTime=.5 roar=.5 sympathy=.05 rollSwell=.2 volume=-4 | phaser | counter | Felt rolled on harmonic metal, two pitches turning in each tone
Long corridor hum | - | metal=Harmonic roll=.8 rollSpeed=11 ground=.1 place=.7 hardness=.2 climb=.5 highRing=5 threshold=.42 climbTime=3.2 roar=.2 shimmer=1.6 sympathy=.6 width=.65 fallBack=.55 rollSwell=1.4 volume=1 | downhall | lamp | Felt rolled on harmonic metal with the ground taken out
Wall of open fifths | - | beater=Yarn roll=1 rollSpeed=13 rollSwell=1.5 hardness=.6 climb=.9 threshold=.02 roar=.1 highRing=10 climbTime=1.4 shimmer=.6 sympathy=.52 width=1 | fog | pedals | Yarn rolled on fifths, bright from floor to ceiling
Monk's floor | - | roll=1 rollSpeed=10 rollSwell=2 hardness=.1 place=.05 ground=.9 climb=.1 lowRing=14 threshold=.82 climbTime=2.2 roar=.08 shimmer=.8 sympathy=.45 width=.92 | monks | pedals | Soft felt rolled on low fifths, hardly any light in it
Slow engine | - | roll=1 rollSpeed=3 rollSwell=.5 hardness=.5 ground=.8 lowRing=3 climb=.4 roar=.5 choke=.5 threshold=.5 shimmer=1 sympathy=.52 width=.65 fallBack=0 volume=-0.5 | combo | pedals | Felt on fifths, three strokes a second with rush behind each
Fifths over moor | - | beater=Brush roll=1 rollSpeed=9 rollSwell=3 hardness=.4 ground=.7 climb=.7 roar=.5 lowRing=30 threshold=.42 climbTime=2.2 shimmer=2.4 sympathy=.45 fallBack=.45 | surf | cross | A brush rolled on fifths, wind with a chord inside
Riveted hull | - | beater=Wood roll=1 rollSpeed=8 rollSwell=1 hardness=.2 place=.15 ground=.9 lowRing=9 climb=.3 threshold=.15 climbTime=6 roar=.45 shimmer=1.6 sympathy=.52 width=.5 fallBack=.65 | pipe | pedals | Soft wood rolled low on fifths
Molten floor | - | metal=Golden roll=1 rollSpeed=12 rollSwell=2 hardness=.2 ground=1 place=.1 climb=.6 roar=.7 threshold=.05 climbTime=4.5 shimmer=1.6 sympathy=.12 fallBack=.45 | iron | pedals | Felt rolled on low golden metal, rush glowing over a deep key
Hive in the bell | - | metal=Golden beater=Yarn roll=1 rollSpeed=15 hardness=.5 shimmer=4 ground=.4 climb=.5 width=1 threshold=.46 climbTime=1.4 roar=.55 sympathy=.35 fallBack=.65 rollSwell=1.4 | currents | cross | Yarn rolled on golden metal, its pairs swarming
Gold dust storm | - | metal=Golden beater=Brush roll=1 rollSpeed=14 rollSwell=2 hardness=.6 roar=.9 climb=1 threshold=0 ground=.3 highRing=4 climbTime=1.4 shimmer=.8 sympathy=.12 width=.45 fallBack=.35 | swarm | dawn | A brush rolled on golden metal, a storm of small bright air
Temple foundations | - | metal=Golden roll=.7 rollSpeed=4 rollSwell=1 hardness=.4 ground=.9 lowRing=26 climb=.3 sympathy=.8 threshold=.5 roar=.45 shimmer=1 width=.5 fallBack=.55 | nave | pedals | Felt on low golden metal, four strokes a second under a long ring
Oil in the lamp | - | metal=Golden roll=.9 rollSpeed=9 rollSwell=4 hardness=.25 ground=.5 climb=.8 climbTime=3 threshold=.02 roar=0 highRing=14 shimmer=2.4 sympathy=.12 width=1 fallBack=0 | stretch | lamp | Felt rolled on golden metal that clears as slowly as oil
Great sixths | - | metal=Sixths beater=Yarn roll=1 rollSpeed=12 rollSwell=2 hardness=.5 climb=.8 threshold=.02 roar=.5 lowRing=30 climbTime=2 shimmer=.8 sympathy=.52 width=1 fallBack=.45 | hall | pairs | Yarn rolled on sixths, wide and grieving
Bridge of rope | - | metal=Sixths beater=Wood roll=.9 rollSpeed=6 rollSwell=.3 hardness=.4 ground=.6 lowRing=8 climb=.2 choke=.4 shimmer=1 threshold=.6 roar=.45 sympathy=.45 width=.85 | tapeecho | pairs | Wood on sixths, six strokes a second and swaying pairs
Low tide church | - | metal=Sixths roll=1 rollSpeed=8 rollSwell=3 hardness=.3 ground=.85 place=.2 lowRing=40 climb=.5 climbTime=2 fallBack=.6 threshold=.2 roar=.4 shimmer=.6 sympathy=.52 width=.5 beater=Wood | cistern | pedals | Wood rolled on low sixths, rising for three seconds
Bramble wall | - | metal=Sixths beater=Brush roll=1 rollSpeed=12 hardness=.8 place=.7 ground=.5 climb=.6 roar=.3 shimmer=2 lowRing=9 threshold=.55 climbTime=.5 width=1 fallBack=.55 rollSwell=.2 volume=1 | ensemble | fall | A hard brush rolled on sixths, thorny and thick
Dune at the door | - | metal=Sixths roll=.9 rollSpeed=16 hardness=.3 ground=.2 climb=1 threshold=0 roar=.8 highRing=2 lowRing=12 climbTime=1.6 shimmer=.6 sympathy=.52 width=.92 rollSwell=1.4 | cloud | lamp | Felt rolled on sixths with the key worn away to rush
Glacier face | - | metal=Silver beater=Yarn roll=1 rollSpeed=12 rollSwell=3 hardness=.3 ground=.7 climb=.8 threshold=.02 roar=.2 highRing=16 climbTime=4.5 shimmer=.8 sympathy=.45 width=.85 fallBack=0 | thinair | pedals | Yarn rolled on silver metal, a cliff of pale glass
Power line frost | - | metal=Silver roll=1 rollSpeed=16 rollSwell=1 hardness=.2 ground=.8 place=.1 shimmer=.1 climb=.3 highRing=8 lowRing=14 threshold=.36 climbTime=1.4 roar=.2 sympathy=.52 width=.5 | centre | pairs | Felt rolled on silver metal into one straight hum
Ice field moving | - | metal=Silver roll=.9 rollSpeed=5 rollSwell=1 hardness=.6 ground=.6 climb=.7 roar=.7 fallBack=.6 lowRing=30 threshold=.42 shimmer=2.4 sympathy=.45 width=1 | rooms | pedals | Felt on silver metal, slow strokes and rush that comes and sinks
White noise house | - | metal=Silver beater=Brush roll=1 rollSpeed=16 hardness=.3 ground=.4 climb=1 threshold=0 roar=1 highRing=5 climbTime=1.4 shimmer=1.6 sympathy=.52 fallBack=.35 rollSwell=.4 | muffled | plain | A soft brush rolled on silver metal, air through a wall
Light off the snow | - | metal=Silver beater=Yarn roll=.8 rollSpeed=14 rollSwell=2 ground=0 hardness=.2 place=.1 climb=.7 roar=0 highRing=7 shimmer=.3 threshold=.1 climbTime=2 sympathy=.45 width=.65 fallBack=.55 | backwards | lamp | Yarn rolled on silver metal without a ground
Turbines at rest | - | metal=Plate roll=1 rollSpeed=16 rollSwell=1 hardness=.4 ground=1 place=.1 climb=.4 roar=.4 lowRing=10 threshold=.36 shimmer=1 sympathy=.05 width=.5 fallBack=.2 | spin | pedals | Felt rolled very fast on a low plate
Quarry train | - | metal=Plate beater=Yarn roll=1 rollSpeed=4 rollSwell=.2 hardness=.5 ground=.9 lowRing=3 climb=.5 roar=.6 choke=.5 threshold=.42 shimmer=2.4 sympathy=.6 width=1 fallBack=.3 volume=-1 | slowing | earth | Yarn on a low plate, four heavy strokes a second
Water under the road | - | metal=Plate beater=Brush roll=1 rollSpeed=10 hardness=.5 ground=.8 place=.3 climb=.8 roar=1 lowRing=14 highRing=2 threshold=.6 shimmer=1.6 sympathy=.05 width=.92 rollSwell=.8 | underwater | pedals | A brush rolled on a low plate, water going under the street
Foundry Sunday | - | metal=Plate roll=.6 rollSpeed=6 rollSwell=2 hardness=.2 ground=.3 climb=.4 shimmer=1.6 lowRing=24 sympathy=.9 threshold=.15 roar=.12 width=.65 fallBack=.05 place=.7 | seasick | cross | Soft felt rolled quietly on a plate, machines left ticking
Mountain of lids | - | metal=Plate beater=Wood roll=1 rollSpeed=15 rollSwell=4 hardness=.6 ground=.4 climb=1 threshold=0 roar=.5 highRing=10 shimmer=.8 sympathy=.05 width=.85 fallBack=.1 | valley | one | Wood rolled on a plate, four seconds up to a great clatter
Bow without end | - | beater=Bow hardness=.35 ground=.8 place=.2 climb=.35 threshold=.15 lowRing=30 choke=.1 sympathy=.6 climbTime=6 roar=.55 shimmer=.6 width=.85 fallBack=.2 | expanse | pedals | A bow on low fifths, held for as long as you like
Lead roof singing | - | metal=Plate beater=Bow hardness=.3 ground=.9 place=.15 climb=.5 roar=.3 lowRing=20 choke=.2 shimmer=.5 threshold=.5 width=.5 fallBack=.3 | rotary | pedals | A bow on a low plate, humming with a slow turn
Amber drone | - | metal=Golden beater=Bow hardness=.2 ground=.7 place=.2 climb=.6 climbTime=4 threshold=.05 roar=.1 highRing=10 lowRing=26 choke=.15 shimmer=1 sympathy=.6 width=1 fallBack=0 | shadow | pedals | A light bow on golden metal, its upper tones arriving over many seconds
Beggar's organ | - | metal=Harmonic beater=Bow hardness=.75 ground=.4 place=.6 climb=.5 roar=.2 shimmer=1.5 lowRing=8 choke=.5 threshold=.46 climbTime=.5 sympathy=.05 width=.6 fallBack=.45 | cassette | hymn | A hard bow on harmonic metal, reedy and beating | organ
Hill with a door | - | metal=Sixths beater=Bow hardness=.4 ground=.9 place=.1 climb=.7 fallBack=.7 climbTime=1 roar=.6 lowRing=30 choke=.2 threshold=.24 shimmer=1.6 sympathy=.6 width=.65 volume=-11 | stretch | pedals | A bow on low sixths with rush that fills the hill and drains
Lighthouse engine | - | roll=1 rollSpeed=7 rollSwell=1 fallBack=1 climb=1 threshold=.25 climbTime=.6 roar=.2 lowRing=20 hardness=.5 shimmer=1 sympathy=.52 width=.5 volume=-1.5 | harmonic | pedals | Felt rolled on fifths, the light going round and round
Breakwater | - | metal=Golden beater=Yarn roll=1 rollSpeed=10 fallBack=1 climb=1 threshold=.3 climbTime=.3 roar=1 highRing=1 lowRing=20 shimmer=2.4 width=1 rollSwell=.2 | surf 1.force=0.4 | lamp | Yarn rolled on golden metal, rush breaking and drawn back
Sleeping town | - | metal=Harmonic roll=.8 rollSpeed=13 fallBack=.8 climb=.7 threshold=.4 climbTime=2 hardness=.3 ground=.8 lowRing=30 roar=.08 shimmer=1.6 width=.92 rollSwell=1.4 | pillow | lamp | Felt rolled on harmonic metal, a slow lift and fall of light
Clouds at night | - | metal=Silver beater=Yarn roll=.9 rollSpeed=12 fallBack=.9 climb=1 threshold=.2 climbTime=1.5 roar=0 highRing=6 lowRing=34 shimmer=.6 sympathy=.45 width=.65 rollSwell=.2 | sweep | cross | Yarn rolled on silver metal, pale light opened and covered
Pumps of the city | - | metal=Plate roll=1 rollSpeed=9 fallBack=1 climb=1 threshold=.2 climbTime=.3 roar=.7 hardness=.5 ground=.8 lowRing=12 highRing=2 shimmer=.8 sympathy=.52 width=.85 rollSwell=1.4 | throb | pedals | Felt rolled on a low plate with rush pumped in and out
Blanket of bells | - | beater=Yarn roll=.6 rollSpeed=9 rollSwell=3 hardness=.2 sympathy=1 lowRing=40 highRing=10 climb=.3 choke=0 threshold=.1 climbTime=1.8 roar=.05 shimmer=.6 | sustain | fall | Soft yarn rolled on fifths, nothing ever stopped | pad
Choir of plates | - | metal=Plate beater=Bow hardness=.2 ground=.5 place=.4 climb=.7 threshold=.05 roar=0 highRing=9 shimmer=3 climbTime=.5 width=1 fallBack=0 | vowel | fall | A light bow on plates, many sour voices made one | pad
Mass of bronze | - | metal=Sixths beater=Wood roll=1 rollSpeed=14 rollSwell=2 hardness=.7 climb=.7 threshold=.05 lowRing=36 highRing=9 width=1 roar=.62 shimmer=.9 sympathy=.05 fallBack=.1 | folded | hymn | Hard wood rolled on sixths, the whole tower at once | pad
Slow dynamo | - | metal=Fifths roll=1 rollSpeed=16 rollSwell=12 hardness=.4 ground=.6 climb=.9 climbTime=4 threshold=.02 roar=.3 highRing=8 shimmer=2.4 sympathy=.6 width=.5 fallBack=.1 | reveal | one | Felt rolled on fifths, twelve seconds of coming up to speed
Deep sea cable | - | metal=Silver beater=Bow hardness=.5 ground=1 place=.1 bend=-15 climb=.4 roar=.8 lowRing=20 highRing=1 choke=.3 threshold=.42 climbTime=2.2 shimmer=1.6 sympathy=.45 fallBack=.35 | subs | pedals | A bow on low silver metal, rush running along the key
`,
    },
    {
      id: 'velvet-bells',
      name: 'Velvet bells',
      category: 'bell',
      rows: `
Curtain bell         | Velvet bells  | hardness=.2 ground=.8 shimmer=.3 roll=0 | warm        | -      | Soft yarn on harmonic metal, round and nearly still
Two velvet steps     | Velvet bells  | shimmer=2 climb=.1 lowRing=5 roll=0 volume=-3 | detune      | calls  | Yarn on harmonic metal, its pairs beating against each other
Box at the theatre | Velvet bells | hardness=.7 climb=.6 threshold=.15 highRing=7 roll=0 bend=12 fallBack=.2 | softtape | window | Firm yarn on harmonic metal with a warm light coming on above
Cloakroom | Velvet bells | metal=Sixths place=.15 lowRing=14 choke=.3 roll=0 bend=35 | blanket | turn | Yarn on sixths, muffled among coats
Plum coloured | Velvet bells | metal=Fifths ground=.2 place=.6 lowRing=20 roll=0 bend=48 fallBack=0 volume=-1 | darkecho | temple | Yarn on fifths with the octave and fifth leading
Doorbell at dusk | - | metal=Harmonic hardness=.35 place=.25 ground=.7 climb=.2 lowRing=6 highRing=2 roll=0 choke=.15 threshold=.82 climbTime=.6 roar=.2 shimmer=1.3 sympathy=.35 width=.4 bend=-35 | reel | calls | Felt on harmonic metal, two rooms in and friendly
Nursery clock | - | metal=Harmonic hardness=.15 place=.4 ground=.5 climb=.3 threshold=.1 lowRing=4 highRing=2 roll=0 choke=.2 width=.3 roar=.55 shimmer=1.8 sympathy=.12 bend=8 fallBack=.35 volume=0.5 | tiny | rain | Very soft felt on harmonic metal, small and slow to darken
Slippers in the hall | - | metal=Harmonic hardness=.05 place=.1 ground=1 climb=0 lowRing=9 roll=0 choke=.2 width=.3 threshold=.5 climbTime=.45 roar=.12 shimmer=.2 sympathy=.35 | nearmic | turn | The softest felt on harmonic metal, a step and a hum
Mulled wine | - | metal=Harmonic hardness=.5 ground=.6 climb=.5 threshold=.1 climbTime=.8 roar=.4 lowRing=12 highRing=3 roll=0 choke=.05 shimmer=1.8 sympathy=.45 width=.6 bend=12 fallBack=.2 | haze | pairs | Felt on harmonic metal, a warm rush rising off each stroke
Grandmother's hall | - | metal=Harmonic hardness=.6 bend=20 ground=.7 place=.2 climb=.25 lowRing=22 roll=0 choke=0 sympathy=.5 threshold=.42 climbTime=.3 roar=.05 shimmer=1.3 width=.45 | hall | temple | Felt on harmonic metal, a tall case bell with a small fall in it
Cotton in the ears | - | metal=Sixths hardness=.2 place=.2 ground=.6 climb=.2 lowRing=20 highRing=3 roll=0 choke=.1 threshold=.9 climbTime=.4 roar=.25 shimmer=.7 sympathy=.8 volume=-0.5 | fog | rain | Soft felt on sixths, every edge rubbed away
Late apples | - | metal=Sixths hardness=.4 ground=.4 climb=.5 threshold=.1 climbTime=.6 lowRing=16 highRing=5 roll=0 choke=.1 roar=.06 shimmer=.9 sympathy=.5 width=.85 bend=18 volume=-0.5 | crystals | window | Felt on sixths, sweet with a little sharpness on top
Sleeve pulled long | - | metal=Sixths beater=Yarn hardness=.2 ground=.8 place=.1 climb=.15 lowRing=24 roll=0 choke=.15 shimmer=.9 threshold=.75 roar=.2 sympathy=.35 width=.9 | cassette | hymn | Soft yarn on sixths, its pairs swaying slowly | keys
Wet leaves, lamps | - | metal=Sixths beater=Yarn hardness=.5 bend=45 lowRing=18 climb=.4 roar=.5 highRing=1.5 roll=0 choke=.1 threshold=.42 climbTime=.3 shimmer=.9 sympathy=.65 width=.85 volume=-1.5 | stars | calls | Yarn on sixths, each bell falling a little and hissing out
Tower in wool | - | metal=Sixths hardness=.3 ground=1 place=.05 lowRing=40 climb=.2 roll=0 choke=0 sympathy=.7 threshold=.6 climbTime=1.1 roar=.12 shimmer=.7 width=.66 | giant | cellar | Soft felt on low sixths, a great bell under cloth
Pollen on the pane | - | metal=Golden hardness=.2 place=.15 ground=.8 climb=.3 threshold=.1 lowRing=12 highRing=5 roll=0 choke=.1 climbTime=1.6 roar=.25 shimmer=1.8 sympathy=.65 width=.5 bend=35 fallBack=.65 | mist | rain | Soft felt on golden metal, high and powdery
Brass button | - | metal=Golden beater=Yarn hardness=.3 ground=.6 place=.3 climb=.1 lowRing=5 highRing=1.5 roll=0 choke=.2 threshold=.82 climbTime=.3 roar=.15 shimmer=1.3 sympathy=.6 bend=48 | spring | knocks | Yarn on golden metal, small, round and shiny
Carnival packed up | - | metal=Golden beater=Yarn hardness=.5 bend=50 shimmer=1.5 ground=.6 lowRing=10 climb=.3 roll=0 choke=.1 threshold=.36 climbTime=1.1 roar=.2 sympathy=.8 width=.5 fallBack=.55 | vinyl | calls | Yarn on golden metal, beating and sliding down
Amber beads | - | metal=Golden hardness=.45 ground=.4 climb=.6 threshold=.02 climbTime=.5 roar=.05 highRing=10 lowRing=9 roll=0 choke=.1 shimmer=1.3 sympathy=.5 width=.95 volume=-2 | glints | window | Felt on golden metal, warm below and clear above
Dark honey | - | metal=Golden hardness=.1 ground=1 place=.05 climb=.5 climbTime=2 threshold=.05 roar=.3 lowRing=22 roll=0 choke=.05 shimmer=1.8 sympathy=.45 fallBack=.3 | iron | lamp | The softest felt on golden metal, slow to show any colour
Snow over the hedge | - | metal=Silver hardness=.2 place=.15 ground=.8 climb=.1 lowRing=16 highRing=5 roll=0 choke=.1 threshold=.75 climbTime=.6 roar=0 shimmer=1.3 sympathy=.65 width=.6 | muffled | calls | Soft felt on silver metal, the glass under snow
Moth wing | - | metal=Silver hardness=.1 place=.5 ground=.3 shimmer=2 lowRing=8 highRing=4 roll=0 choke=.2 threshold=.1 climbTime=.4 roar=.75 width=.45 bend=18 fallBack=0 volume=0.5 | lungs | halo | The softest felt on silver metal, thin and trembling
Pearl on velvet | - | metal=Silver beater=Yarn hardness=.25 ground=.9 climb=.5 threshold=.05 climbTime=.8 roar=0 highRing=10 lowRing=14 roll=0 choke=.05 shimmer=1.3 sympathy=.8 width=.6 bend=-35 fallBack=.1 volume=1 place=.15 | reel | drops | Soft yarn on silver metal and a slow pearl of light
Ironed silk | - | metal=Silver beater=Yarn hardness=.15 ground=.7 place=.1 lowRing=24 climb=.2 roll=0 choke=.1 shimmer=.5 threshold=.5 climbTime=.25 roar=.75 sympathy=.5 width=.5 bend=-16 fallBack=0 volume=-1 | chorus | pairs | Soft yarn on silver metal, smooth and cool | keys
Cold hands | - | metal=Silver hardness=.5 ground=.5 place=.3 bend=-30 climb=.3 lowRing=6 highRing=3 roll=0 choke=.25 threshold=.6 climbTime=.3 roar=.05 shimmer=2.2 sympathy=.6 width=.6 fallBack=.35 | thin | knocks | Felt on silver metal, every bell shivering up to its note
Plain hand bell | - | hardness=.3 place=.3 ground=.6 climb=.2 lowRing=9 highRing=2 roll=0 choke=.1 shimmer=.2 threshold=.9 climbTime=.4 roar=.18 sympathy=.45 width=.4 volume=0 | chamber | rain | Felt on fifths, a plain bell with a dark edge
Muffled peal | - | hardness=.3 place=.5 ground=.35 climb=.1 lowRing=14 roll=.4 rollSpeed=2.5 rollSwell=.2 choke=.15 threshold=.68 climbTime=.45 roar=.08 shimmer=1.3 sympathy=.35 width=.6 volume=2.5 beater=Yarn | stair | temple | Yarn on fifths, rung on and on with leather round the clapper
Sunday, next street | - | beater=Yarn hardness=.4 ground=.5 climb=.4 threshold=.1 lowRing=18 highRing=5 roll=0 choke=.05 climbTime=1.6 roar=.55 shimmer=1.8 sympathy=.35 width=.4 fallBack=0 | nextdoor | calls | Yarn on fifths, bells over the roofs
Under a glass dome | - | hardness=.5 ground=.3 climb=.8 threshold=.05 climbTime=.5 roar=0 highRing=8 lowRing=10 roll=0 choke=.1 width=.2 shimmer=1.3 bend=18 volume=-0.5 | booth | window | Felt on fifths, its light kept small under glass
Shepherd's hour | - | beater=Yarn hardness=.3 bend=-40 place=.4 lowRing=16 climb=.2 roll=0 choke=.05 shimmer=1.2 threshold=.6 climbTime=1.1 roar=.45 sympathy=.5 | weather | temple | Yarn on fifths, leaning up into every stroke
Velvet iron | - | metal=Plate hardness=.2 ground=.8 place=.1 climb=.15 lowRing=12 highRing=1 roll=0 choke=.15 threshold=.75 roar=.55 shimmer=1.8 sympathy=.8 width=.6 bend=35 | shaded | temple | Soft felt on a flat plate, its clang left in shadow
Coffee tin | - | metal=Plate beater=Yarn hardness=.4 ground=.7 place=.25 climb=.1 lowRing=3 roll=0 choke=.3 width=.3 threshold=.82 roar=.75 shimmer=.6 sympathy=.05 fallBack=.05 | sampler | knocks | Yarn on a small plate, brown and dented | plucked
Slag heap snow | - | metal=Plate hardness=.35 ground=.8 climb=.6 threshold=.05 climbTime=1 roar=.9 highRing=2 lowRing=18 roll=0 choke=.05 shimmer=1.8 sympathy=.45 width=.6 bend=18 | hollow | pairs | Felt on a plate, a low bell with snow sliding off it
Bent tray | - | metal=Plate hardness=.6 ground=.6 bend=110 lowRing=8 climb=.2 roll=0 choke=.2 shimmer=1 threshold=.5 roar=.05 sympathy=.65 width=.4 | flanger | calls | Felt on a plate that bends a long way and straightens
Chapel heater | - | metal=Plate beater=Yarn hardness=.15 ground=1 place=0 lowRing=30 climb=.25 roar=.6 threshold=.1 roll=0 choke=0 shimmer=1.8 sympathy=.15 width=.6 bend=8 | monks | pedals | The softest yarn on a low plate, with warmth ticking above
Lamp turned up | - | metal=Harmonic hardness=.5 climb=.8 threshold=.15 climbTime=1.2 roar=0 highRing=12 lowRing=26 roll=0 choke=0 shimmer=.6 sympathy=.35 width=.5 bend=-35 fallBack=.1 | shadow | temple | Felt on harmonic metal, brightening long after the stroke
Candle and draught | - | metal=Harmonic beater=Yarn hardness=.5 climb=.9 threshold=.3 climbTime=.4 fallBack=1 highRing=3 lowRing=34 roll=0 choke=0 roar=.25 shimmer=.2 sympathy=.8 width=.95 bend=8 volume=-2 | ripples | one | Yarn on harmonic metal, a light that leans and stands again
Grate at bedtime | - | metal=Sixths hardness=.5 climb=.8 threshold=.2 climbTime=.6 fallBack=.8 roar=.5 highRing=2 lowRing=40 roll=0 choke=0 shimmer=.6 sympathy=.5 | throb | temple | Felt on sixths, glowing in waves as it goes out
Dawn in the belfry | - | climb=.7 threshold=.05 climbTime=2.5 roar=.1 highRing=16 lowRing=30 hardness=.25 ground=.7 roll=0 choke=0 shimmer=.2 sympathy=.45 width=.95 fallBack=0 | shimmer | pairs | Soft felt on fifths, a belfry filling slowly with light
Last warm evening | - | metal=Golden beater=Yarn climb=.6 threshold=.1 climbTime=1.5 roar=.2 highRing=8 lowRing=30 hardness=.35 ground=.8 roll=0 choke=0 sympathy=.8 shimmer=.6 width=.5 bend=35 fallBack=.3 | follower | pairs | Yarn on golden metal, every stroke staying warm for long
Wool mill shift | - | metal=Harmonic beater=Yarn roll=.5 rollSpeed=6 rollSwell=1 hardness=.2 ground=.7 lowRing=5 climb=.2 choke=.3 threshold=.9 roar=.62 shimmer=1.2 sympathy=.4 width=.35 | trem | hymn | Soft yarn on harmonic metal, stroked again six times a second | keys
Trembling hand | - | roll=.6 rollSpeed=9 rollSwell=.3 hardness=.15 ground=.6 lowRing=6 climb=.3 choke=.3 shimmer=.8 threshold=.2 roar=.02 sympathy=.35 width=.42 fallBack=.5 | vibrato | turn | Soft felt on fifths, nine light strokes a second | keys
Toy on the landing | - | metal=Sixths beater=Wood roll=.35 rollSpeed=4 rollSwell=.1 hardness=.1 place=.3 lowRing=8 climb=.1 choke=.2 threshold=.75 roar=.55 shimmer=1.3 width=.95 fallBack=.3 volume=0 | loop | window | The softest wood on sixths, tapped four times a second
Mourning dove | - | metal=Sixths beater=Bow hardness=.2 ground=.9 place=.1 bend=30 climb=.1 lowRing=8 choke=.5 width=.3 threshold=.82 climbTime=.25 roar=.08 shimmer=.3 sympathy=.12 volume=-1.5 | room | calls | A light bow on sixths, sighing home at the end of each note | wind
Cellist's bell | - | metal=Harmonic beater=Bow hardness=.3 ground=.7 place=.2 climb=.5 climbTime=1.5 threshold=.2 lowRing=14 choke=.2 roar=.45 shimmer=.7 sympathy=.35 width=.6 | plate | tenor | A bow on harmonic metal, a bell that never was struck | string
Midnight after snow | - | metal=Harmonic hardness=.4 ground=.9 place=.1 lowRing=36 highRing=6 climb=.2 roll=0 choke=0 shimmer=.15 threshold=.5 climbTime=2.2 roar=.25 width=.5 bend=-35 fallBack=.05 volume=-10.5 | expanse | calls | Felt on harmonic metal, one bell across all that white
Harbour mass | - | metal=Sixths beater=Yarn hardness=.5 ground=.6 lowRing=28 climb=.4 roll=0 choke=0 bend=25 shimmer=1.5 threshold=.3 climbTime=.6 roar=.62 sympathy=.45 width=.95 fallBack=.45 | shore | temple | Yarn on sixths, bells going out with the boats
Floor of the tower | - | hardness=.15 ground=1 place=0 lowRing=30 climb=.4 roar=1 threshold=.1 highRing=.8 roll=0 choke=.1 climbTime=.25 shimmer=0 sympathy=.65 width=.22 bend=60 fallBack=.5 volume=-14 | deep | earth | Soft felt on very low fifths, felt in the floor first | bass
Letter under a lamp | - | metal=Silver beater=Yarn hardness=.35 ground=.7 climb=.2 lowRing=10 highRing=3 roll=0 choke=.15 sympathy=1 threshold=.68 climbTime=.45 roar=0 shimmer=.2 width=.95 fallBack=.05 volume=-1 | pedal | rain | Yarn on silver metal, the bells before it still sounding
Closing the shutters | - | metal=Golden hardness=.3 ground=.7 place=.2 climb=.4 highRing=.5 lowRing=16 roll=0 choke=.2 threshold=.24 roar=.12 shimmer=.95 sympathy=.15 bend=-16 fallBack=.25 | sweep | fall | Felt on golden metal, its top going dark at once | keys
`,
    },
  ],
}
