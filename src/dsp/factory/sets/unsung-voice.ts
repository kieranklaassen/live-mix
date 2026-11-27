import { type InstrumentSet } from './set'

// Ten ways of being sung over. A row decides what the keys are made of, what
// the line nobody plays does above them, and how near the two stand; the
// chains add a place, a medium or a movement, and few of them add pitches,
// which would hide the note that is only there because two others are.

export const SET: InstrumentSet = {
  device: 'unsung-voice',
  names: { body: ['Throat', 'Reed', 'Glass', 'Bowed', 'Hollow'] },
  chains: {
    // Near: hardly a room.
    close: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Voice' }],
      words: ', kept close and dry',
    },
    chamber: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.16 } }],
      words: ', in a tight chamber',
    },
    booth: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.2 } }],
      words: ', in a small booth',
    },
    wide: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Wide' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', dry and spread wide',
    },
    middle: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Mono' },
        { deviceId: 'analog-drive', preset: 'First hint' },
      ],
      words: ', all in one place in the middle',
    },
    shaded: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Shaded' },
        { deviceId: 'plate-reverb', preset: 'Tight room' },
      ],
      words: ', shaded at the top in a small room',
    },
    warm: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Warm glue' },
        { deviceId: 'ambient-eq', preset: 'Warm' },
      ],
      words: ', through a warm circuit',
    },
    lacquer: {
      effects: [
        { deviceId: 'saturator', preset: 'Soft tape warmth' },
        { deviceId: 'fdn-reverb', preset: 'Short ambience' },
      ],
      words: ', rounded by soft saturation',
    },
    wood: {
      effects: [{ deviceId: 'vessel', preset: 'Hint of wood' }],
      words: ', over a thin wooden board',
    },
    crate: {
      effects: [
        { deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.5 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.14 } },
      ],
      words: ', inside a wooden body',
    },
    bottle: {
      effects: [{ deviceId: 'vessel', preset: 'Blown bottle', params: { mix: 0.45 } }],
      words: ', from inside a bottle',
    },
    tin: {
      effects: [
        { deviceId: 'vessel', preset: 'Small tin', params: { mix: 0.4 } },
        { deviceId: 'spring-reverb', preset: 'Hint of spring' },
      ],
      words: ', in a small tin with a spring in it',
    },
    clay: {
      effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.5 } }],
      words: ', in the mouth of a clay pot',
    },
    bedside: {
      effects: [{ deviceId: 're-amp', preset: 'Bedside radio' }],
      words: ', from a small bedside speaker',
    },
    combo: {
      effects: [{ deviceId: 're-amp', preset: 'Combo in a room' }],
      words: ', through an amplifier in a room',
    },
    pillow: {
      effects: [{ deviceId: 're-amp', preset: 'Pillow speaker' }],
      words: ', from a speaker under a pillow',
    },
    ambience: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.3 } }],
      words: ', with a short room round it',
    },
    doubled: {
      effects: [{ deviceId: 'stereo-detune', preset: 'Doubled' }],
      words: ', doubled a few cents either side',
    },
    topwide: {
      effects: [
        { deviceId: 'spread', preset: 'Wide top' },
        { deviceId: 'ambient-eq', preset: 'Keys' },
      ],
      words: ', near, its top opened wide',
    },
    thin: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Thin' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', thinned to its middle',
    },
    forward: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Forward' },
        { deviceId: 'ambient-comp', preset: 'Glue' },
      ],
      words: ', held forward and level',
    },
    cassette: {
      effects: [{ deviceId: 'tape', preset: 'Cassette four-track' }],
      words: ', on a small cassette',
    },
    blanket: {
      effects: [
        { deviceId: 'tape', preset: 'Under a blanket' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', under a blanket of old tape',
    },
    groove: {
      effects: [{ deviceId: 'vinyl', preset: 'Dull stylus' }],
      words: ', on a dull, worn record',
    },
    glaze: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Glaze' },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', with the glaze of an early sampler',
    },
    overtones: {
      effects: [{ deviceId: 'reveal', preset: 'Overtones' }],
      words: ', its quiet overtones turned up',
    },
    wall: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Muffled' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', heard through a wall',
    },
    felt: {
      effects: [
        { deviceId: 'sift', preset: 'Soft hammers' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.14 } },
      ],
      words: ', every onset softened',
    },
    soften: {
      effects: [
        { deviceId: 'swell', preset: 'Soft pick' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', the front of each note rubbed away',
    },
    tube: {
      effects: [
        { deviceId: 'imprint', preset: 'Hollow tube' },
        { deviceId: 'fdn-reverb', preset: 'Short ambience' },
      ],
      words: ', with the colour of a hollow tube',
    },
    reelhiss: {
      effects: [{ deviceId: 'patina', preset: 'Quarter inch reel' }],
      words: ', on a reel with some hiss',
    },
    valve: {
      effects: [
        { deviceId: 'patina', preset: 'Hot valve' },
        { deviceId: 'plate-reverb', preset: 'Tight room' },
      ],
      words: ', through a hot valve',
    },
    iron: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Iron lows' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.1 } },
      ],
      words: ', with weight from an iron core',
    },
    grit: {
      effects: [
        { deviceId: 'analog-drive', preset: 'Parallel grit' },
        { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.18 } },
      ],
      words: ', with grit beneath it and a dark spring',
    },
    paper: {
      effects: [
        { deviceId: 'buzzing-bridge', preset: 'Paper edge', params: { mix: 0.5 } },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.14 } },
      ],
      words: ', with a paper edge that buzzes',
    },
    // Rooms and halls.
    hall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.28 } }],
      words: ', in a hall',
    },
    nave: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.34 } }],
      words: ', in a vast nave',
    },
    darkhall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.34 } }],
      words: ', in a dark hall',
    },
    brighthall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Bright hall', params: { mix: 0.28 } }],
      words: ', in a bright hall',
    },
    plate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.28 } }],
      words: ', on a smooth plate',
    },
    darkplate: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Warm' },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.34 } },
      ],
      words: ', on a dark, warm plate',
    },
    space: {
      effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.32 } }],
      words: ', in a wide open space',
    },
    undercroft: {
      effects: [
        { deviceId: 'expanse', preset: 'Small dark room' },
        { deviceId: 'ambient-eq', preset: 'Shaded' },
      ],
      words: ', in a low vaulted cellar',
    },
    valley: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.32 } }],
      words: ', across an open valley',
    },
    cave: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.36 } }],
      words: ', in a dark cave',
    },
    spring: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.26 } }],
      words: ', over two springs',
    },
    stairwell: {
      effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
      words: ', from up a stone stairwell',
    },
    farshore: {
      effects: [{ deviceId: 'distance', preset: 'Far shore' }],
      words: ', from the far shore',
    },
    openair: {
      effects: [
        { deviceId: 'distance', preset: 'Open air' },
        { deviceId: 'weather', preset: 'Breezy day', params: { mix: 0.5 } },
      ],
      words: ', out of doors in a breeze',
    },
    farend: {
      effects: [{ deviceId: 're-amp', preset: 'Far end of the hall' }],
      words: ', from a loudspeaker at the end of a hall',
    },
    swarm: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.28 } }],
      words: ', in a cave of short echoes',
    },
    oo: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Oo behind', params: { mix: 0.3 } }],
      words: ', with a hall behind it that says Oo',
    },
    chapel: {
      effects: [
        { deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.26 } },
        { deviceId: 'ambient-eq', preset: 'Voice' },
      ],
      words: ', in a chapel',
    },
    gated: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.36 } }],
      words: ', in a room that shuts behind it',
    },
    rising: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.4 } }],
      words: ', with a room that swells after it',
    },
    brightair: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Bright air', params: { mix: 0.26 } }],
      words: ', in bright air',
    },
    // Echoes.
    slap: {
      effects: [{ deviceId: 'tape-echo', preset: 'Single slap', params: { mix: 0.26 } }],
      words: ', with one tape slap',
    },
    repeats: {
      effects: [{ deviceId: 'tape-echo', preset: 'Warm repeats', params: { mix: 0.3 } }],
      words: ', in warm tape repeats',
    },
    dotted: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.3 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.16 } },
      ],
      words: ', in dotted echoes',
    },
    murky: {
      effects: [{ deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.32 } }],
      words: ', in murky echoes',
    },
    doubler: {
      effects: [{ deviceId: 'analog-delay', preset: 'Doubler', params: { mix: 0.4 } }],
      words: ', doubled by a short dark echo',
    },
    backwards: {
      effects: [{ deviceId: 'reverse-delay', preset: 'Backwards echo', params: { mix: 0.34 } }],
      words: ', answered by itself backwards',
    },
    stars: {
      effects: [{ deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.38 } }],
      words: ', in seven scattered echoes',
    },
    pebble: {
      effects: [{ deviceId: 'skipping-stone', preset: 'Skipping stone', params: { mix: 0.32 } }],
      words: ', in echoes that skip like a stone',
    },
    prism: {
      effects: [{ deviceId: 'prism', preset: 'Low to high', params: { mix: 0.34 } }],
      words: ', its echo unfolding from low to high',
    },
    memory: {
      effects: [{ deviceId: 'echo-memory', preset: 'Recalling', params: { mix: 0.36 } }],
      words: ', with earlier moments drifting back',
    },
    orbits: {
      effects: [{ deviceId: 'orbits', preset: 'Slow phasing', params: { mix: 0.36 } }],
      words: ', in loops that slip against each other',
    },
    round: {
      effects: [
        { deviceId: 'canon', preset: 'Faint answer' },
        { deviceId: 'hall-reverb', preset: 'Room' },
      ],
      words: ', with a faint round behind it',
    },
    loop: {
      effects: [{ deviceId: 'tape-loop', preset: 'Slow fade', params: { mix: 0.38 } }],
      words: ', on a tape loop that slowly fades',
    },
    // Clouds and spectra.
    cloud: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.42 } }],
      words: ', in a soft cloud of grains',
    },
    smear: {
      effects: [{ deviceId: 'grain-delay', preset: 'Dark slow smear', params: { mix: 0.36 } }],
      words: ', in a dark smear of grains',
    },
    tiles: {
      effects: [{ deviceId: 'cascade', preset: 'Slow tiles', params: { mix: 0.36 } }],
      words: ', in slow tiles of itself, octaves apart',
    },
    sparks: {
      effects: [
        { deviceId: 'glints', preset: 'Slow stars' },
        { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.2 } },
      ],
      words: ', with slow sparks two octaves up',
    },
    leaves: {
      effects: [{ deviceId: 'falling', preset: 'Falling leaves', params: { mix: 0.34 } }],
      words: ', with pieces of it falling away',
    },
    melt: {
      effects: [{ deviceId: 'melt', preset: 'Slow melt', params: { mix: 0.38 } }],
      words: ', with a tail that sags as it ages',
    },
    stretch: {
      effects: [{ deviceId: 'stretch', preset: 'Half time haze', params: { mix: 0.4 } }],
      words: ', with a slowed haze trailing it',
    },
    mist: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.44 } }],
      words: ', in a mist that hangs',
    },
    sustain: {
      effects: [{ deviceId: 'sustainer', preset: 'Brief afterglow', params: { mix: 0.42 } }],
      words: ', with an afterglow that holds on',
    },
    sines: {
      effects: [{ deviceId: 'sine-shadow', preset: 'Long linger', params: { mix: 0.45 } }],
      words: ', with pure tones lingering behind',
    },
    veil: {
      effects: [{ deviceId: 'fog', preset: 'Morning mist' }],
      words: ', behind a morning mist',
    },
    haze: {
      effects: [{ deviceId: 'haze', preset: 'Faint warmth', params: { mix: 0.22 } }],
      words: ', in a faint warm haze',
    },
    common: {
      effects: [
        { deviceId: 'common-tones', preset: 'Hanging notes' },
        { deviceId: 'plate-reverb', preset: 'Medium plate', params: { mix: 0.2 } },
      ],
      words: ', what its tones share hanging on',
    },
    rooms: {
      effects: [{ deviceId: 'generations', preset: 'Single return', params: { mix: 0.38 } }],
      words: ', played back once into its room',
    },
    bed: {
      effects: [{ deviceId: 'micro-looper', preset: 'Soft bed', params: { mix: 0.3 } }],
      words: ', over a soft loop of itself',
    },
    strings: {
      effects: [{ deviceId: 'sympathetic', preset: 'Follow the tune', params: { mix: 0.36 } }],
      words: ', with strings ringing in sympathy',
    },
    padded: {
      effects: [{ deviceId: 'pad-follower', preset: 'Low section', params: { mix: 0.3 } }],
      words: ', with soft low strings grown behind',
    },
    faintlift: {
      effects: [{ deviceId: 'shimmer', preset: 'Faint glimmer', params: { mix: 0.2 } }],
      words: ', with a faint octave in the tail',
    },
    ascent: {
      effects: [{ deviceId: 'spiral', preset: 'Slow ascent', params: { mix: 0.3 } }],
      words: ', its tail climbing without arriving',
    },
    descent: {
      effects: [{ deviceId: 'spiral', preset: 'Slow descent', params: { mix: 0.3 } }],
      words: ', its tail sinking without arriving',
    },
    bowls: {
      effects: [{ deviceId: 'bowls', preset: 'Faint halo', params: { mix: 0.2 } }],
      words: ', with metal bowls faintly waking',
    },
    // Movement.
    chorale: {
      effects: [{ deviceId: 'rotary', preset: 'Chorale', params: { mix: 0.6 } }],
      words: ', through a slowly turning horn',
    },
    fastrotor: {
      effects: [
        { deviceId: 'rotary', preset: 'Tremolo', params: { mix: 0.6 } },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.15 } },
      ],
      words: ', through a fast turning horn',
    },
    swirl: {
      effects: [{ deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.45 } }],
      words: ', slowly swirled',
    },
    glacial: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
        { deviceId: 'hall-reverb', preset: 'Room' },
      ],
      words: ', under a filter that moves like ice',
    },
    opens: {
      effects: [{ deviceId: 'auto-filter', preset: 'Soft bloom' }],
      words: ', under a filter its own level opens',
    },
    hollowsweep: {
      effects: [{ deviceId: 'flanger', preset: 'Negative hollow', params: { mix: 0.4 } }],
      words: ', hollowed by a slow sweep',
    },
    ensemble: {
      effects: [{ deviceId: 'chorus', preset: 'Lush ensemble', params: { mix: 0.45 } }],
      words: ', as a whole section',
    },
    singer: {
      effects: [
        { deviceId: 'late-vibrato', preset: 'Singer' },
        { deviceId: 'hall-reverb', preset: 'Room' },
      ],
      words: ', swaying later as it is held',
    },
    tides: {
      effects: [{ deviceId: 'currents', preset: 'Wide tide' }],
      words: ', on a wide tide of bands',
    },
    glimmer: {
      effects: [{ deviceId: 'glimmer', preset: 'Light on water' }],
      words: ', glittering like light on water',
    },
    asleep: {
      effects: [
        { deviceId: 'breath', preset: 'Calm breath', params: { mix: 0.8 } },
        { deviceId: 'ether-reverb', preset: 'Late hall', params: { mix: 0.18 } },
      ],
      words: ', opening and closing like calm breath',
    },
    throb: {
      effects: [{ deviceId: 'pulses', preset: 'Soft throb' }],
      words: ', in a soft throb of two gates',
    },
    harmonic: {
      effects: [{ deviceId: 'tremolo', preset: 'Harmonic shimmer' }],
      words: ', with a tremolo between low and high',
    },
    amptrem: {
      effects: [
        { deviceId: 'tremolo', preset: 'Amp tremolo' },
        { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { mix: 0.16 } },
      ],
      words: ', in an amplifier tremolo',
    },
    circle: {
      effects: [{ deviceId: 'around', preset: 'Slow circle' }],
      words: ', moving in a slow circle',
    },
    flock: {
      effects: [{ deviceId: 'murmuration', preset: 'Evening flock', params: { mix: 0.4 } }],
      words: ', as a flock round the listener',
    },
    seasick: {
      effects: [
        { deviceId: 'tape', preset: 'Seasick' },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
      ],
      words: ', on tape that sways',
    },
    vibrating: {
      effects: [
        { deviceId: 'ear-shift', preset: 'Slow turn' },
        { deviceId: 'plate-reverb', preset: 'Faint sheen' },
      ],
      words: ', one ear turning slowly on the other',
    },
    heartbeat: {
      effects: [
        { deviceId: 'band-pulse', preset: 'Seventy a minute' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.15 } },
      ],
      words: ', its lower half beating like a calm heart',
    },
    // Media and weather.
    under: {
      effects: [{ deviceId: 'underwater', preset: 'Sunlit shallows' }],
      words: ', under shallow sunlit water',
    },
    rain: {
      effects: [
        { deviceId: 'weather', preset: 'Light rain', params: { mix: 0.7 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', out in light rain',
    },
    station: {
      effects: [
        { deviceId: 'radio', preset: 'Clean transistor' },
        { deviceId: 'spring-reverb', preset: 'Hint of spring' },
      ],
      words: ', from a clean transistor radio',
    },
    frost: {
      effects: [{ deviceId: 'seasons', preset: 'First frost' }],
      words: ', in the thin air of a first frost',
    },
    bells: {
      effects: [
        { deviceId: 'ring', preset: 'Faint halo' },
        { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.2 } },
      ],
      words: ', with a faint metal halo',
    },
    stiff: {
      effects: [
        { deviceId: 'warp', preset: 'Soft chime' },
        { deviceId: 'hall-reverb', preset: 'Room' },
      ],
      words: ', half of it stretched to a chime',
    },
    stillwater: {
      effects: [{ deviceId: 'freq-shifter', preset: 'Still water' }],
      words: ', rippled by a tiny shift of pitch',
    },
    stopped: {
      effects: [
        { deviceId: 'stops', preset: 'Nearly dry' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', with an octave stop drawn over it',
    },
    suboct: {
      effects: [
        { deviceId: 'octaves', preset: 'Sub octave', params: { sub1: 0.35 } },
        { deviceId: 'ambient-eq', preset: 'Keys' },
      ],
      words: ', over its own lower octave',
    },
    halved: {
      effects: [
        { deviceId: 'half-speed', preset: 'Under the mix' },
        { deviceId: 'hall-reverb', preset: 'Room' },
      ],
      words: ', with a half-speed ghost under it',
    },
    glass: {
      effects: [
        { deviceId: 'low-bitrate', preset: 'Behind glass', params: { mix: 0.5 } },
        { deviceId: 'plate-reverb', preset: 'Tight room' },
      ],
      words: ', half behind glass',
    },
    quietup: {
      effects: [
        { deviceId: 'lift', preset: 'Long tails' },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', its quiet ends brought up',
    },
    air: {
      effects: [
        { deviceId: 'noise-floor', preset: 'Close mic' },
        { deviceId: 'ambient-eq', preset: 'Voice' },
      ],
      words: ', near a microphone with air round it',
    },
    drift: {
      effects: [{ deviceId: 'spectral-drifter', preset: 'Detune cloud', params: { mix: 0.35 } }],
      words: ', with a detuned cloud drifting off it',
    },
    winding: {
      effects: [
        { deviceId: 'winding-down', preset: 'Soft losing pace' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.16 } },
      ],
      words: ', in a pulse that keeps losing pace',
    },
    choirtail: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Faint glow' }],
      words: ', with a faint glow blooming after',
    },
    whistled: {
      effects: [
        { deviceId: 'overtone-singer', preset: 'Faint melody' },
        { deviceId: 'hall-reverb', preset: 'Room' },
      ],
      words: ', its A harmonics faintly picked out',
    },
    sustainhowl: {
      effects: [
        { deviceId: 'howl', preset: 'Faint sustain' },
        { deviceId: 'spring-reverb', preset: 'Hint of spring' },
      ],
      words: ', with a faint sustain fed back',
    },
    giant: {
      effects: [
        { deviceId: 'size', preset: 'A shade larger' },
        { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', from a body a shade larger',
    },
    small: {
      effects: [
        { deviceId: 'size', preset: 'Smaller' },
        { deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.15 } },
      ],
      words: ', from a body made smaller',
    },
  },
  phrases: {
    // Four voices, the alto held over and let down.
    vesper: {
      notes: [
        { atSec: 0, durSec: 2.4, note: 50, gain: 0.7 },
        { atSec: 0, durSec: 7, note: 57, gain: 0.55 },
        { atSec: 0, durSec: 3.3, note: 62, gain: 0.55 },
        { atSec: 0, durSec: 2.4, note: 65, gain: 0.6 },
        { atSec: 2.4, durSec: 2.2, note: 48, gain: 0.65 },
        { atSec: 2.4, durSec: 2.2, note: 64, gain: 0.6 },
        { atSec: 3.3, durSec: 3.7, note: 60, gain: 0.5 },
        { atSec: 4.6, durSec: 2.4, note: 53, gain: 0.65 },
        { atSec: 4.6, durSec: 2.4, note: 65, gain: 0.55 },
      ],
    },
    // Voices that enter one after another.
    entries: {
      notes: [
        { atSec: 0, durSec: 6.8, note: 62, gain: 0.6 },
        { atSec: 1.2, durSec: 5.6, note: 69, gain: 0.5 },
        { atSec: 2.4, durSec: 4.6, note: 55, gain: 0.6 },
        { atSec: 3.6, durSec: 3.5, note: 72, gain: 0.5 },
      ],
    },
    lone: { notes: [{ atSec: 0, durSec: 6.2, note: 57, gain: 0.7 }] },
    longa: {
      notes: [
        { atSec: 0, durSec: 6.8, note: 48, gain: 0.65 },
        { atSec: 0, durSec: 6.8, note: 55, gain: 0.55 },
        { atSec: 0, durSec: 6.8, note: 64, gain: 0.5 },
        { atSec: 0, durSec: 6.8, note: 71, gain: 0.5 },
        { atSec: 0, durSec: 6.8, note: 74, gain: 0.4 },
      ],
    },
    // Two parts that close on a fifth.
    counter: {
      notes: [
        { atSec: 0, durSec: 1.7, note: 72, gain: 0.6 },
        { atSec: 0, durSec: 1.7, note: 53, gain: 0.7 },
        { atSec: 1.7, durSec: 1.7, note: 71, gain: 0.55 },
        { atSec: 1.7, durSec: 1.7, note: 55, gain: 0.65 },
        { atSec: 3.4, durSec: 1.2, note: 69, gain: 0.55 },
        { atSec: 3.4, durSec: 1.2, note: 57, gain: 0.65 },
        { atSec: 4.6, durSec: 2.6, note: 67, gain: 0.5 },
        { atSec: 4.6, durSec: 2.6, note: 60, gain: 0.6 },
      ],
    },
    // A chain of sevenths that fall to sixths.
    sevenths: {
      notes: [
        { atSec: 0, durSec: 2, note: 76, gain: 0.55 },
        { atSec: 0, durSec: 1, note: 60, gain: 0.6 },
        { atSec: 1, durSec: 2, note: 65, gain: 0.6 },
        { atSec: 2, durSec: 2, note: 74, gain: 0.5 },
        { atSec: 3, durSec: 2, note: 64, gain: 0.6 },
        { atSec: 4, durSec: 3, note: 72, gain: 0.5 },
        { atSec: 5, durSec: 2, note: 57, gain: 0.6 },
      ],
    },
    climb: {
      notes: [
        { atSec: 0, durSec: 4.2, note: 48, gain: 0.7 },
        { atSec: 0.7, durSec: 3.8, note: 55, gain: 0.6 },
        { atSec: 1.4, durSec: 3.6, note: 62, gain: 0.6 },
        { atSec: 2.1, durSec: 3.4, note: 64, gain: 0.55 },
        { atSec: 2.8, durSec: 3.6, note: 67, gain: 0.5 },
        { atSec: 3.5, durSec: 3.5, note: 74, gain: 0.5 },
      ],
    },
    descend: {
      notes: [
        { atSec: 0, durSec: 3, note: 76, gain: 0.55 },
        { atSec: 0.9, durSec: 3, note: 72, gain: 0.5 },
        { atSec: 1.8, durSec: 3, note: 69, gain: 0.55 },
        { atSec: 2.7, durSec: 3.2, note: 64, gain: 0.6 },
        { atSec: 3.8, durSec: 3.2, note: 57, gain: 0.65 },
      ],
    },
    chimes: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 79, gain: 0.6 },
        { atSec: 1.1, durSec: 1.6, note: 76, gain: 0.55 },
        { atSec: 2.2, durSec: 1.8, note: 72, gain: 0.6 },
        { atSec: 3.6, durSec: 2.4, note: 84, gain: 0.45 },
        { atSec: 3.6, durSec: 2.4, note: 67, gain: 0.55 },
      ],
    },
    // A peal of five, changed once.
    peal: {
      notes: [
        { atSec: 0, durSec: 0.7, note: 81, gain: 0.6 },
        { atSec: 0.45, durSec: 0.7, note: 79, gain: 0.55 },
        { atSec: 0.9, durSec: 0.7, note: 76, gain: 0.55 },
        { atSec: 1.35, durSec: 0.7, note: 74, gain: 0.55 },
        { atSec: 1.8, durSec: 1.2, note: 69, gain: 0.65 },
        { atSec: 3.2, durSec: 0.7, note: 79, gain: 0.55 },
        { atSec: 3.65, durSec: 0.7, note: 81, gain: 0.5 },
        { atSec: 4.1, durSec: 0.7, note: 74, gain: 0.55 },
        { atSec: 4.55, durSec: 0.7, note: 76, gain: 0.5 },
        { atSec: 5, durSec: 2, note: 69, gain: 0.6 },
      ],
    },
    tower: {
      notes: [
        { atSec: 0, durSec: 2.4, note: 57, gain: 0.8 },
        { atSec: 0.06, durSec: 2.4, note: 64, gain: 0.5 },
        { atSec: 2.6, durSec: 2.2, note: 60, gain: 0.7 },
        { atSec: 4.9, durSec: 2.4, note: 53, gain: 0.75 },
        { atSec: 4.96, durSec: 2.3, note: 60, gain: 0.45 },
      ],
    },
    highwire: {
      notes: [
        { atSec: 0, durSec: 2.6, note: 79, gain: 0.5 },
        { atSec: 2, durSec: 2.6, note: 74, gain: 0.5 },
        { atSec: 4, durSec: 3, note: 76, gain: 0.45 },
      ],
    },
    cellar: {
      notes: [
        { atSec: 0, durSec: 1.5, note: 38, gain: 0.75 },
        { atSec: 1.6, durSec: 0.7, note: 45, gain: 0.6 },
        { atSec: 2.4, durSec: 1.2, note: 41, gain: 0.7 },
        { atSec: 3.7, durSec: 0.7, note: 43, gain: 0.6 },
        { atSec: 4.5, durSec: 2.4, note: 36, gain: 0.75 },
      ],
    },
    footfall: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 33, gain: 0.8 },
        { atSec: 0.75, durSec: 0.3, note: 33, gain: 0.5 },
        { atSec: 1.5, durSec: 0.5, note: 40, gain: 0.65 },
        { atSec: 2.25, durSec: 0.5, note: 43, gain: 0.65 },
        { atSec: 3, durSec: 0.5, note: 41, gain: 0.7 },
        { atSec: 3.75, durSec: 0.3, note: 41, gain: 0.5 },
        { atSec: 4.5, durSec: 2.2, note: 38, gain: 0.75 },
      ],
    },
    pedal: {
      notes: [
        { atSec: 0, durSec: 7, note: 36, gain: 0.7 },
        { atSec: 0, durSec: 7, note: 43, gain: 0.5 },
        { atSec: 1.6, durSec: 5.4, note: 52, gain: 0.5 },
        { atSec: 3.2, durSec: 3.8, note: 62, gain: 0.4 },
      ],
    },
    openfifth: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 43, gain: 0.65 },
        { atSec: 0, durSec: 7.2, note: 50, gain: 0.55 },
        { atSec: 2.2, durSec: 5, note: 62, gain: 0.45 },
      ],
    },
    wheel: {
      notes: [
        { atSec: 0, durSec: 0.42, note: 57, gain: 0.7 },
        { atSec: 0.4, durSec: 0.42, note: 64, gain: 0.5 },
        { atSec: 0.8, durSec: 0.42, note: 62, gain: 0.55 },
        { atSec: 1.2, durSec: 0.42, note: 64, gain: 0.45 },
        { atSec: 1.6, durSec: 0.42, note: 57, gain: 0.65 },
        { atSec: 2, durSec: 0.42, note: 67, gain: 0.5 },
        { atSec: 2.4, durSec: 0.42, note: 64, gain: 0.5 },
        { atSec: 2.8, durSec: 0.42, note: 62, gain: 0.45 },
        { atSec: 3.2, durSec: 0.42, note: 53, gain: 0.7 },
        { atSec: 3.6, durSec: 0.42, note: 64, gain: 0.5 },
        { atSec: 4, durSec: 0.42, note: 60, gain: 0.5 },
        { atSec: 4.4, durSec: 0.42, note: 64, gain: 0.45 },
        { atSec: 4.8, durSec: 2, note: 55, gain: 0.65 },
        { atSec: 5.2, durSec: 1.6, note: 62, gain: 0.5 },
      ],
    },
    answer: {
      notes: [
        { atSec: 0, durSec: 0.8, note: 74, gain: 0.6 },
        { atSec: 0.8, durSec: 0.8, note: 76, gain: 0.55 },
        { atSec: 1.6, durSec: 1.4, note: 72, gain: 0.55 },
        { atSec: 3.2, durSec: 0.8, note: 57, gain: 0.65 },
        { atSec: 4, durSec: 0.8, note: 60, gain: 0.6 },
        { atSec: 4.8, durSec: 2.2, note: 55, gain: 0.65 },
        { atSec: 5.6, durSec: 1.4, note: 67, gain: 0.4 },
      ],
    },
    // Seconds side by side, which open and close again.
    seconds: {
      notes: [
        { atSec: 0, durSec: 3.4, note: 60, gain: 0.6 },
        { atSec: 0, durSec: 3.4, note: 62, gain: 0.6 },
        { atSec: 1.2, durSec: 2.2, note: 67, gain: 0.5 },
        { atSec: 3.4, durSec: 3.6, note: 59, gain: 0.6 },
        { atSec: 3.4, durSec: 3.6, note: 64, gain: 0.55 },
        { atSec: 4.6, durSec: 2.4, note: 65, gain: 0.45 },
      ],
    },
    tenths: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 48, gain: 0.7 },
        { atSec: 0, durSec: 1.6, note: 64, gain: 0.55 },
        { atSec: 1.6, durSec: 1.6, note: 50, gain: 0.65 },
        { atSec: 1.6, durSec: 1.6, note: 65, gain: 0.5 },
        { atSec: 3.2, durSec: 1.6, note: 52, gain: 0.65 },
        { atSec: 3.2, durSec: 1.6, note: 67, gain: 0.5 },
        { atSec: 4.8, durSec: 2.4, note: 53, gain: 0.7 },
        { atSec: 4.8, durSec: 2.4, note: 69, gain: 0.5 },
      ],
    },
    piper: {
      notes: [
        { atSec: 0, durSec: 1.5, note: 69, gain: 0.6 },
        { atSec: 1.5, durSec: 1, note: 72, gain: 0.6 },
        { atSec: 2.5, durSec: 0.5, note: 71, gain: 0.5 },
        { atSec: 3, durSec: 1.3, note: 67, gain: 0.55 },
        { atSec: 4.3, durSec: 2.8, note: 69, gain: 0.6 },
      ],
    },
    thumbs: {
      notes: [
        { atSec: 0, durSec: 0.9, note: 50, gain: 0.7 },
        { atSec: 0.5, durSec: 0.9, note: 64, gain: 0.5 },
        { atSec: 0.75, durSec: 0.9, note: 69, gain: 0.5 },
        { atSec: 1.5, durSec: 0.9, note: 60, gain: 0.55 },
        { atSec: 2.25, durSec: 0.9, note: 67, gain: 0.55 },
        { atSec: 3, durSec: 0.9, note: 48, gain: 0.7 },
        { atSec: 3.5, durSec: 0.9, note: 62, gain: 0.5 },
        { atSec: 3.75, durSec: 0.9, note: 64, gain: 0.5 },
        { atSec: 4.5, durSec: 2.2, note: 55, gain: 0.65 },
        { atSec: 4.5, durSec: 2.2, note: 71, gain: 0.45 },
      ],
    },
    stabs: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 57, gain: 0.65 },
        { atSec: 0, durSec: 0.5, note: 60, gain: 0.55 },
        { atSec: 0, durSec: 0.5, note: 64, gain: 0.6 },
        { atSec: 1.4, durSec: 0.5, note: 57, gain: 0.6 },
        { atSec: 1.4, durSec: 0.5, note: 60, gain: 0.5 },
        { atSec: 1.4, durSec: 0.5, note: 65, gain: 0.55 },
        { atSec: 2.8, durSec: 0.5, note: 55, gain: 0.65 },
        { atSec: 2.8, durSec: 0.5, note: 59, gain: 0.5 },
        { atSec: 2.8, durSec: 0.5, note: 62, gain: 0.55 },
        { atSec: 2.8, durSec: 0.5, note: 67, gain: 0.5 },
        { atSec: 4.2, durSec: 2.4, note: 53, gain: 0.6 },
        { atSec: 4.2, durSec: 2.4, note: 60, gain: 0.5 },
        { atSec: 4.2, durSec: 2.4, note: 64, gain: 0.5 },
        { atSec: 4.2, durSec: 2.4, note: 69, gain: 0.45 },
      ],
    },
    // A second voice follows the first a fifth below.
    follow: {
      notes: [
        { atSec: 0, durSec: 1.5, note: 69, gain: 0.6 },
        { atSec: 1.5, durSec: 1.5, note: 71, gain: 0.55 },
        { atSec: 3, durSec: 1.5, note: 72, gain: 0.55 },
        { atSec: 4.5, durSec: 2.6, note: 69, gain: 0.5 },
        { atSec: 1.5, durSec: 1.5, note: 62, gain: 0.6 },
        { atSec: 3, durSec: 1.5, note: 64, gain: 0.55 },
        { atSec: 4.5, durSec: 2.6, note: 65, gain: 0.55 },
      ],
    },
    // A bass with its tenth over it, home and back.
    lowtenths: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 36, gain: 0.7 },
        { atSec: 0, durSec: 1.6, note: 52, gain: 0.5 },
        { atSec: 1.6, durSec: 1.6, note: 41, gain: 0.65 },
        { atSec: 1.6, durSec: 1.6, note: 57, gain: 0.5 },
        { atSec: 3.2, durSec: 1.6, note: 43, gain: 0.65 },
        { atSec: 3.2, durSec: 1.6, note: 59, gain: 0.5 },
        { atSec: 4.8, durSec: 2.4, note: 36, gain: 0.7 },
        { atSec: 4.8, durSec: 2.4, note: 52, gain: 0.5 },
      ],
    },
    // One slow bass line with time to speak.
    undersong: {
      notes: [
        { atSec: 0, durSec: 2.3, note: 45, gain: 0.7 },
        { atSec: 2.3, durSec: 2.1, note: 41, gain: 0.65 },
        { atSec: 4.4, durSec: 1.1, note: 43, gain: 0.6 },
        { atSec: 5.5, durSec: 1.8, note: 38, gain: 0.7 },
      ],
    },
  },
  directions: [
    {
      id: 'chapel-four',
      name: 'Chapel four',
      category: 'voice',
      rows: `
Four at the altar rail   | Chapel four | vowel=.2 closeness=.85 lift=.34 register=1200 breath=.08 attack=.25 linger=0.88 beating=0.11 | chamber | vesper | Four close throats on a round Oo and a low line hardly louder than they are
Psalm for a side aisle   | Chapel four | vowel=.28 tilt=-.3 lift=.48 pace=2.2 glide=.3 vibrato=.5 second=0 volume=-1 tolerance=36 register=1350 hold=0.86 width=0.5 | chapel | counter | Round dark throats with one line that slides and sways from note to note
Oil lamp quartet         | Chapel four | vowel=.22 tilt=-.6 closeness=.4 lift=.55 register=950 release=1.2 colour=.8 tolerance=11 linger=0.88 | warm | entries | A dark loose Oo with a full voice moving among the keys, not over them
Vestry door ajar         | Chapel four | vowel=.3 breath=.5 lift=.28 attack=.9 width=.3 second=.6 release=4 lean=1 | wall | vesper | Breathy throats that come in softly, two lines only just there
Compline by one candle   | -           | vowel=.18 tilt=-.45 lift=.62 pace=6 vibrato=.12 partner=12 register=1500 colour=.1 attack=1.2 release=5 volume=-1 tolerance=6 width=0.95 second=0 | nave | longa | A dark slow Oo under one nearly pure tone that stays for six seconds
Lips nearly closed       | -           | vowel=.04 tilt=-.2 closeness=.9 breath=.15 lift=.4 pace=1.2 colour=.6 register=1000 partner=12 release=.8 volume=-1 beating=0.11 hold=0.86 | close | counter | A closed hum, three singers as one, with a nasal line close above it
Humming past the gate    | Chapel four | vowel=.06 closeness=.2 tilt=.1 lift=.5 lean=1 pace=.9 glide=.5 width=.9 volume=-1 second=0 beating=0.27 hold=0.64 | openair | vesper | A loose crowd hums while one line climbs, slides and begins again
Teeth of the hum         | -           | vowel=.02 tilt=.75 breath=.05 lift=.3 register=2600 vibrato=0 colour=.9 partner=5 attack=.06 release=.5 tolerance=50 lean=0.5 beating=0.27 | valve | entries | A shut mouth with all its overtones bright, and a high hard line over it
Nursery at dusk          | -           | vowel=.1 tilt=-.7 breath=.35 lift=.66 register=1300 pace=2.8 glide=.15 vibrato=.65 second=0 attack=.6 volume=1 tolerance=14 lean=1 beating=0.38 | asleep | counter | A very dark hum and above it one voice with a wide slow sway
Hum in the banister      | Dark drone  | tilt=-.5 attack=.2 release=1.6 lift=.45 pace=2 colour=.3 breath=.02 partner=7 closeness=1 tolerance=11 linger=0.76 beating=0.11 hold=0.86 | wood | lone | One dark hummed key and the tone it makes with a fifth nobody hears
Ah across the square     | Chapel four | vowel=.52 tilt=.35 closeness=.3 lift=.45 release=1.8 attack=.12 width=.9 pace=1.4 volume=0.5 register=2300 lean=0.8 beating=0.38 hold=0.7 | brighthall | entries | Open throats on a bright Ah with a line that steps every second and a half
Bread queue singers      | -           | vowel=.55 tilt=.15 closeness=.05 breath=.3 second=.1 vibrato=.6 attack=.18 release=.7 width=1 volume=6 lift=.12 tolerance=11 partner=0 hold=0.82 | wide | vesper | A wide loose section on Ah, the line only a glint in it
Open mouth in cold air   | -           | vowel=.5 breath=.65 tilt=.5 lift=.58 register=2400 colour=.05 linger=.7 pace=1.1 partner=12 volume=-1.5 tolerance=50 lean=-1 hold=0.76 | frost | counter | A bright breathy Ah with pure high tones struck softly over it
Evensong on the stairs   | Chapel four | vowel=.48 lift=.7 colour=.75 pace=2.6 glide=.12 vibrato=.4 second=.8 release=2.4 partner=7 volume=-1 tolerance=50 lean=0.35 linger=0.6 beating=0.11 hold=0.76 | stairwell | vesper | An Ah that steps back for two full voices walking against each other
Wide open furrow         | -           | vowel=.58 tilt=-.15 closeness=.45 lift=.4 attack=2.4 release=6 pace=4.5 glide=.6 register=1100 second=.5 volume=-0.5 partner=11 beating=0.22 | valley | longa | A slow Ah that takes its time, two low lines sliding in it
Bright as a kettle       | Sliding mouths | glide=.1 pace=.8 vowel=1 tilt=.85 lift=.35 second=0 vibrato=.1 release=.4 closeness=.8 volume=2 partner=12 lean=0.8 hold=0.86 | close | lone | A hard bright Ee, close and steady, with a thin line pecking above it
Throat of the well       | Sliding mouths | lift=.75 vowel=.9 pace=3.2 second=0 vibrato=.3 closeness=.6 attack=.5 release=3 volume=-2 lean=-0.75 beating=0.22 width=0.5 | cave | lone | A single Ee and, louder than it, one voice on its way from tone to tone
Herders two hills off    | Sliding mouths | vowel=.82 tilt=.1 glide=.7 pace=1.1 lift=.5 second=.9 register=2200 width=1 partner=12 lean=-0.2 beating=0.22 | farshore | counter | Loose Eh voices far off, two lines always sliding past each other
Whistle in the palate    | -           | vowel=.88 tilt=.3 lift=.9 colour=0 vibrato=.2 pace=.6 glide=.4 register=2800 partner=12 second=.3 attack=.05 breath=.45 volume=0.5 tolerance=50 lean=-0.75 | booth | lone | Hardly any key left, and a quick pure whistle from the roof of the mouth
Ee on the ferry rope     | Sliding mouths | vowel=.94 closeness=.5 tilt=-.4 lean=-.9 pace=2.4 glide=.3 lift=.62 release=5 attack=1.4 volume=1 second=0 tolerance=8 beating=0.27 width=0.75 | swirl | longa | A darkened Ee that swells in, the one voice over it only ever falling
Three hundred feet       | -           | vowel=.38 closeness=0 width=1 breath=.4 lift=.3 attack=.5 release=2.8 second=.5 pace=3 vibrato=.5 volume=-1 partner=10 | hall | vesper | The loosest section, wide and never still, with the line deep inside it
Coats still on           | -           | vowel=.3 closeness=.1 tilt=-.8 breath=.55 lift=.5 register=800 attack=.3 width=.8 pace=2 colour=.5 partner=3 linger=0.82 beating=0.14 hold=0.64 second=0 volume=2 | blanket | entries | A loose crowd, dark and breathing, with one warm low voice in it
Congregation of wrens    | -           | vowel=.7 closeness=.15 tilt=.6 lift=.55 register=2700 pace=.3 linger=.5 glide=0 second=.9 vibrato=0 attack=.08 tolerance=30 beating=0.11 hold=0.7 | brightair | counter | A loose bright Eh with two lines pecking quickly from meeting to meeting
Pews filling slowly      | -           | vowel=.25 closeness=.02 attack=3.6 release=7 breath=.3 width=1 tilt=-.2 second=.8 volume=-0.5 lift=.07 lean=0.65 linger=0.76 | darkhall | longa | A wide loose Oo that takes three seconds to arrive, with a trace of line
Crowd on the far bank    | -           | vowel=.6 closeness=.08 tilt=-.35 lift=.72 pace=1.6 glide=.8 vibrato=.7 second=1 release=3 partner=10 volume=-1 hold=0.64 | farend | entries | A loose Ah sunk under two swaying voices that slide all the time
One note, one listener   | Low partner | register=1500 lift=.5 vowel=.4 tilt=-.1 pace=2.4 glide=.1 attack=.2 colour=.4 hold=0.82 | singer | lone | A single throat that finds the seventh it shares with someone unheard
Lone clerk at the desk   | -           | tolerance=45 vowel=.45 closeness=.95 lift=.58 second=0 pace=1.3 linger=.6 attack=.03 release=1.4 volume=-1 partner=9 register=1450 lean=1 beating=0.11 | lacquer | lone | One close throat whose line rings like a soft bell at each step
Prayer with no reply     | -           | partner=0 tolerance=12 vowel=.35 lift=.5 closeness=.7 second=.2 pace=2 tilt=-.2 release=3 volume=-2 register=1450 beating=0.22 hold=0.76 | oo | counter | Throats with no partner, so the line sings only what two keys share
Company of a third       | -           | partner=3 tolerance=55 vowel=.5 lift=.65 lean=.6 pace=.9 glide=.25 vibrato=.35 colour=.5 second=.4 breath=.3 volume=1.5 linger=0.5 beating=0.38 width=0.15 register=1400 | plate | lone | One key and an unheard minor third: a voice that mostly climbs
Echo under the lintel    | -           | partner=2 tolerance=60 beating=.4 vowel=.3 lift=.55 closeness=.5 pace=3.4 second=.6 attack=.7 | slap | entries | Round throats with an unheard second, whose line trembles where it stands
Descant for no one       | Only the unsung | vowel=.4 tilt=0 pace=1.6 second=0 colour=.6 attack=.3 lift=.86 volume=-1 lean=0.5 hold=0.7 partner=12 | hall | counter | Keys almost gone and one clear voice, warm and swaying, where they were
Two who never came       | Only the unsung | colour=.3 vibrato=.2 glide=0 pace=3.6 breath=.15 register=1300 lean=-.5 release=4 | nave | vesper | Two plain voices drawing apart, with nothing left of the keys beneath
Empty upper gallery      | Only the unsung | colour=.95 vowel=.9 vibrato=.7 pace=1 lift=.95 breath=.6 volume=0.5 tolerance=36 lean=1 register=2200 | stairwell | entries | High rich Ee voices with much air and a strong sway, the keys far behind
A voice in the hinge     | Only the unsung | lift=.82 register=650 colour=1 glide=.6 vowel=.15 second=0 attack=.4 release=1 partner=12 tilt=-.4 beating=0.27 hold=0.82 | blanket | counter | One low full voice that slides about in a dark Oo
Choir that has left      | Only the unsung | attack=3 release=9 pace=6 colour=.15 vibrato=.05 vowel=.3 breath=.75 second=.7 volume=0.5 register=2300 | veil | longa | Two nearly pure tones with air round them, still for six seconds at a time
Whispered litany         | -           | breath=1 vowel=.45 closeness=.4 lift=.5 colour=.1 pace=2 attack=.2 release=1.1 tilt=-.1 second=.3 lean=-0.2 | air | vesper | Whispering throats, more breath than pitch, with a hissing line over them
Sermon under the breath  | Breath line | body=Throat vowel=.2 lift=.3 tilt=-.5 attack=.7 release=3 breath=1 width=.4 register=900 linger=0.7 beating=0.27 | darkplate | entries | A dark whispered Oo with hardly a line, only air that has a pitch
Breath on cold glazing    | Breath line | body=Throat vowel=.9 tilt=.7 lift=.6 pace=.7 linger=.5 attack=.06 second=.8 colour=0 volume=0 tolerance=30 lean=0.5 | glimmer | counter | A bright whispered Ee, and pure tones of hiss tapped out above it
Sleeping in the choir    | -           | breath=.85 vowel=.15 tilt=-.65 closeness=.15 attack=2.8 release=6 lift=.55 pace=5 glide=.8 vibrato=.2 volume=1 lean=-0.2 linger=0.6 beating=0.38 width=0.4 | asleep | longa | Slow dark breathing through an Oo and a tone that glides for seconds
Secrets at the grille    | -           | breath=.92 vowel=.62 closeness=.9 lift=.82 colour=.4 vibrato=.45 pace=1.5 second=0 partner=12 width=.1 lean=-0.35 beating=0.27 | bedside | lone | A near whisper and one small hissing voice, close together in the middle
Ta, said the choir       | -           | attack=.005 hold=.22 release=.5 vowel=.42 lift=.45 linger=.4 pace=1 closeness=.6 vibrato=.1 volume=2.5 beating=0.14 | ambience | stabs | Short sung notes that die at once, with a small bell of a line after them
Counting on fingers      | Plucked halo | body=Throat vowel=.3 hold=.3 lift=.35 release=.8 pace=.6 linger=.5 second=0 tilt=.2 volume=3 tolerance=11 register=1450 beating=0.38 | booth | wheel | Plucked throats on Oo, quick and dry, and a pecking line
Bell ropes let go        | -           | attack=.008 hold=.4 vowel=.6 tilt=.3 lift=.65 pace=2 linger=.8 colour=.6 release=3.5 second=.7 partner=12 volume=2 tolerance=8 lean=1 width=0.15 | plate | stabs | Struck Ah voices that fade under two lines left singing
Hard soles on the steps  | -           | attack=.005 hold=.15 vowel=.1 tilt=-.4 closeness=.95 lift=.3 register=700 second=0 width=.2 volume=2 release=.1 partner=12 lean=-0.5 linger=0.6 | gated | thumbs | Very short dark hums under the fingers, the line low and quickly over
Chant in eighths         | Chapel four | attack=.02 release=.35 vowel=.72 hold=.65 lift=.5 pace=.5 linger=.7 second=.5 tilt=.1 volume=1.5 beating=0.18 width=1 | dotted | wheel | Quick Eh voices and two lines that change twice a second
Curtain of monks         | -           | vowel=.12 tilt=-.35 attack=4 release=8 lift=.4 closeness=.35 register=700 pace=7 glide=.4 partner=12 second=0 beating=0.14 width=0.28 volume=-2 | cave | pedal | A dark hum that rises for four seconds, one low tone lodged in it
Frost at high matins     | Chapel four | vowel=.65 tilt=.2 attack=1.6 release=5 pace=3 colour=.15 second=.9 vibrato=.1 volume=2 linger=0.88 width=0.95 register=2300 lift=.5 | brighthall | highwire | Slow bright Eh voices and two clean tones at the very top
Gilded ceiling           | -           | vowel=.5 attack=2 lift=.78 tolerance=50 pace=1.6 second=1 vibrato=.3 release=7 width=1 colour=.5 partner=11 lean=1 linger=0.82 beating=0.11 volume=-1.5 | faintlift | longa | Two lines in full voice over an Ah that has gone back to the walls
Fog at the lychgate      | -           | vowel=.32 tilt=-.9 breath=.6 attack=1.8 release=4 lift=.52 beating=.5 colour=.5 pace=4 partner=10 register=1000 | veil | entries | Dark airy throats and a low voice whose overtones will not quite agree
Amen held too long       | Chapel four | vowel=.45 hold=.5 attack=.6 release=12 lift=.6 pace=2.4 glide=.2 colour=.5 second=.6 breath=.15 volume=-1.5 beating=0.18 width=0.28 | sustain | vesper | Throats that fade while held, and two lines that stay when they have gone
`,
    },
    {
      id: 'glass-descant',
      name: 'Glass descant',
      category: 'keys',
      rows: `
Rim tapped with a nail   | Glass descant | release=.8 lift=.4 width=.4 linger=.5 closeness=.9 hold=.7 beating=0.11 | close | thumbs | Small glass keys with two lines that tap against each other, quick to fade
Tumblers on the sill     | Glass descant | tilt=.45 breath=.02 release=1.4 second=1 pace=.9 register=2600 colour=.05 | topwide | wheel | Bright glass and two pure lines of equal weight, high and quick
Chamois and lens         | Glass descant | tilt=-.3 lift=.3 release=.5 hold=.6 linger=1 pace=2.6 vibrato=.35 second=.5 volume=1 vowel=0.75 register=1450 lean=0.65 | felt | stabs | Soft dull glass that fades while held, with two faint sung tones
Saucer by the phone      | -             | body=Glass hold=.25 attack=.005 release=.6 lift=.35 second=.7 linger=.3 pace=.7 tilt=.2 width=.2 partner=5 volume=-2 vowel=0.64 tolerance=6 beating=0.27 | middle | answer | Short struck glass, and two lines like a pair of little clocks
Reading glass            | -             | body=Glass closeness=1 breath=0 vowel=.2 second=.4 release=1 attack=.02 tilt=0 glide=.3 volume=1.5 lift=.07 register=2300 hold=0.64 | wide | counter | Plain close glass keys with hardly a line above them
Jar of beads tipped      | Rippled water | body=Glass attack=.005 release=1.2 pace=.14 linger=.3 second=1 hold=.5 vowel=0.64 beating=0.38 | booth | wheel | Two lines spilling over fading glass as fast as they can
Hail in the gutter       | Rippled water | body=Glass tilt=.6 attack=.01 pace=.22 linger=.2 lean=-1 release=.7 lift=.55 vowel=.7 volume=0.5 second=0 beating=0.18 hold=0.76 | glass | thumbs | Bright glass and a hard patter of tones that only falls
Ant trail on the pane    | Rippled water | body=Glass attack=.08 tilt=-.5 lift=.75 pace=.3 register=1300 lean=1 width=.5 colour=.4 second=0 vowel=0.05 beating=0.27 | cassette | counter | Dark glass under small low steps that climb and begin again
Spray from the weir      | Rippled water | body=Glass attack=1.5 pace=.12 linger=.6 breath=.5 colour=0 register=2100 lift=.75 | brightair | longa | A cloud of very quick pure tones with their glass left far below | texture
Bead curtain, hall side  | Rippled water | body=Glass partner=9 tolerance=60 pace=.45 linger=.35 hold=.35 attack=.005 vibrato=.2 release=2.2 second=.6 volume=2.5 beating=0.14 | swirl | climb | Fading glass with strange soft meetings ticking over it
Fingers round the rim    | Glass descant | release=4 linger=1 breath=.4 lift=.45 vibrato=.3 pace=2.8 volume=0 attack=5 vowel=0.14 register=2300 partner=6 tolerance=20 | plate | entries | Glass rubbed up from nothing with two sung lines crossing above | pad
Bowl of rainwater        | Glass descant | tilt=-.6 register=900 lift=.6 pace=4 glide=.5 linger=1 colour=.5 release=6 attack=6 vowel=0.12 tolerance=11 lean=0.5 beating=0.22 | under | longa | Dark slow glass and two low voices sliding through it | pad
Sun in the decanter      | Glass descant | tilt=.7 closeness=.15 lift=.35 linger=1 second=.6 release=3 pace=1.8 volume=-2 partner=0 lean=-0.75 attack=6 | glimmer | vesper | Bright loose glass that swells, with two thin lines in its light | pad
Conservatory at night    | Glass descant | closeness=.05 width=1 lift=.25 breath=.3 release=8 tilt=-.2 linger=1 pace=5 attack=6 beating=0.22 | darkhall | longa | Wide wavering glass that comes in over a second, two lines far inside | pad
Cold cream jar           | Glass descant | attack=.6 tilt=-.9 lift=.5 linger=1 colour=.7 vowel=.1 glide=.2 release=1.6 vibrato=.5 partner=8 lean=0.8 volume=-0.5 | shaded | sevenths | Very dark glass, almost a hum, with two warm lines swaying | pad
Both hands unseen        | Glass descant | lift=.95 linger=1 release=1.2 colour=.3 vibrato=.25 pace=1.4 attack=.05 vowel=0.64 lean=-0.2 hold=0.82 | chamber | counter | Two clear lines in counterpoint, the glass they came from nearly gone
Cut glass argument       | Glass descant | lift=.9 linger=.25 colour=.9 tilt=.4 pace=.5 vibrato=0 release=.9 tolerance=40 vowel=0.68 lean=-1 beating=0.27 hold=0.64 volume=-12.5 | valve | tenths | Two hard rich lines struck against each other, hardly a key under them
Rime on the glass roof   | Glass descant | colour=0 linger=.6 pace=1.1 breath=.6 attack=.2 release=3 volume=-4.5 vowel=0.56 lean=-0.5 register=2200 lift=.74 | frost | climb | Two pure high lines with a hiss at their own pitch
Lower line wins          | Glass descant | lift=.88 register=700 linger=1 glide=.6 second=.9 colour=.6 vibrato=.4 pace=2.2 partner=12 tolerance=50 lean=-0.2 beating=0.27 volume=-11 | wood | tenths | Two low full lines sliding past each other, glass only in their edges
Reflection answers       | Glass descant | lift=.8 lean=-1 pace=1.8 linger=.8 second=1 release=2.5 colour=.2 hold=.4 vowel=0.46 partner=4 beating=0.18 volume=-12 | backwards | answer | One line falls and the second goes the other way, over glass that dies
Crystal in the cupboard  | -             | body=Glass attack=.005 hold=.7 release=2.8 second=.8 linger=.7 vibrato=.4 colour=.35 lift=.5 vowel=.75 tilt=.45 pace=.8 partner=12 lean=-0.35 | brighthall | tenths | Struck glass left to ring under two small swaying voices
Chandelier being washed  | Bell crown    | lift=.5 linger=.7 release=2 second=.9 pace=1.3 hold=.8 lean=1 beating=0.18 | dotted | thumbs | Bright glass whose two lines ring like drops let go one by one
Parlour after the storm  | Bell crown    | tilt=0 lift=.4 hold=1 tolerance=15 pace=2.2 linger=1 colour=.5 release=1.2 volume=-1 partner=0 lean=-0.35 | slap | sevenths | Held glass with a few plain meetings sung over it in two voices
Spoon and eggshell       | Bell crown    | hold=.12 lift=.45 release=.4 pace=.6 tilt=.1 second=.3 volume=-3 linger=.1 vowel=0.75 lean=-0.5 beating=0.32 width=0.28 | tin | wheel | Glass struck and gone, small tones left pecking
Optician's drawer        | Bell crown    | tilt=.9 hold=.3 register=2000 colour=0 release=1 lift=.6 closeness=1 volume=0 linger=.12 pace=.28 | doubled | answer | Very bright short glass and quick pure ticks in two places
Slow lantern slides      | -             | body=Glass pace=6 glide=0 linger=1 second=.9 lift=.55 vibrato=.1 attack=.4 release=3.5 colour=.2 partner=12 tolerance=12 register=1450 hold=0.76 | hall | vesper | Glass under two still tones that change every six seconds
Pane between gardens     | -             | body=Glass pace=8 glide=.9 second=1 lift=.6 linger=1 colour=.15 register=1200 attack=.3 release=2 tilt=-.35 volume=-1.5 vowel=0.05 lean=-0.35 hold=0.76 width=0.15 | ensemble | entries | Dark glass and two pure tones that hardly ever stop sliding
Watch repairer's lamp    | -             | body=Glass pace=1 linger=.45 second=.45 lift=.6 glide=0 vibrato=0 colour=.3 hold=.55 attack=.005 release=1.6 lean=0 volume=-0.5 vowel=.12 tilt=-.25 partner=12 beating=0.14 | pebble | stabs | Fading glass and a bell of a line on every second
Pigeons on the skylight  | -             | body=Glass breath=.85 lift=.55 second=.7 attack=.15 release=1.2 tilt=.15 pace=1.6 colour=.1 vowel=.7 volume=2 partner=9 lean=-0.2 beating=0.38 hold=0.82 | openair | piper | Breathy glass with two hissing lines walking apart
Oyster knife             | -             | body=Glass tilt=-.15 tolerance=50 colour=.8 linger=.55 pace=.85 second=.6 attack=.005 hold=.2 release=.8 volume=-1 partner=6 register=1100 vowel=0.56 lean=-0.5 width=0.75 lift=.55 | tube | thumbs | Rich low sevenths rung over glass that has already died
Two panes not quite true | Glass descant | beating=.6 linger=1 pace=3 lift=.6 tolerance=45 colour=.5 release=2 volume=-1.5 partner=4 lean=0.5 | plate | seconds | Two lines whose overtones beat instead of fusing, over ringing glass
Warped window lead       | Glass descant | beating=1 pace=5 lift=.7 colour=.8 tolerance=60 attack=.5 linger=1 second=.6 volume=-1.5 vowel=0.46 partner=9 lean=-0.5 | seasick | seconds | Rich slow lines that rub and beat, with the glass behind them
Shiver of the tray       | Glass descant | beating=.35 pace=.6 linger=.5 lift=.5 tilt=.5 partner=2 tolerance=58 release=1 hold=.6 | spring | thumbs | Bright glass with trembling bells made from an unheard second
Millpond skin            | Glass descant | beating=.5 register=800 lift=.65 pace=4.5 tilt=-.7 attack=1.2 release=5 colour=.35 linger=1 | stillwater | pedal | Very dark glass under two low tones that waver slowly where they stand | drone
Bubbles in old glass     | Glass descant | beating=.8 linger=.4 pace=1.2 second=1 lift=.75 hold=.3 colour=.1 width=1 release=1.8 vowel=0.14 partner=11 tolerance=45 lean=-0.2 | stars | tenths | Two thin beating chimes after every fading key
Phial of dusk            | Dark drone    | body=Glass attack=.01 lift=.5 pace=2.4 second=.7 release=2 register=1000 colour=.3 tolerance=11 hold=0.82 width=0.15 volume=-2 | darkplate | sevenths | Glass with nearly all its brightness gone and two low lines over it
Inkwell keys             | -             | body=Glass tilt=-1 closeness=.8 lift=.35 hold=.45 release=.7 attack=.005 second=.2 register=750 linger=.7 vowel=0.48 partner=11 tolerance=32 beating=0.27 width=0.5 | pillow | thumbs | Black glass, short and near, with a low bell in it
Closed vitrine           | -             | body=Glass tilt=-.4 vowel=0 lift=.45 second=.8 pace=1.2 linger=.8 hold=.85 width=.15 release=1 attack=.005 register=1250 partner=4 lean=0.35 | wall | stabs | Muted glass and two lines kept close together
Amber in the sleeve      | -             | body=Glass tilt=-.55 vibrato=.8 colour=.6 lift=.7 second=.5 glide=.35 pace=2 attack=.1 release=2.6 lean=-0.5 linger=0.6 beating=0.22 hold=0.82 width=0.4 | warm | counter | Dark glass left behind by a warm voice with a deep vibrato
Wax under glass          | -             | body=Glass tilt=-.75 breath=.4 lift=.6 pace=1 linger=.6 second=.9 partner=4 tolerance=48 attack=.06 release=3.4 beating=0.18 width=0.95 | melt | descend | Dull airy glass and the soft major tenths it would have had with company
Transom light            | Glass descant | linger=1 pace=2.4 closeness=.3 lift=.48 second=.6 attack=.02 release=2.4 vowel=.55 colour=.25 volume=-1.5 tolerance=45 partner=2 lean=0.8 | memory | answer | Loose glass keys and two plain sung lines
Greenhouse whistle       | Glass descant | register=2400 lean=1 pace=.75 second=.15 vibrato=.6 colour=.02 lift=.66 release=1 linger=1 volume=0 tilt=.45 vowel=.8 hold=0.64 | repeats | piper | One pure whistle climbing over single glass notes
Panes of the old tram    | Glass descant | tilt=.2 lift=.44 pace=.8 linger=.6 release=.9 vibrato=.2 partner=7 closeness=.4 hold=.8 lean=0.8 | groove | thumbs | Loose worn glass keys and a pair of short lines
Sieve of light           | Glass descant | pace=.5 linger=.7 tolerance=30 second=1 lift=.6 release=3.2 colour=.18 attack=.005 hold=.5 partner=2 | prism | climb | Fading glass with two lines trading places twice a second
Harbour lights doubled   | Glass descant | closeness=.02 width=1 pace=3.6 linger=1 second=.8 lift=.52 attack=.3 release=4.5 partner=11 volume=-1 tolerance=30 beating=0.27 | flock | longa | Glass in three wide wavering parts and two slow lines | pad
Attic skylight           | Glass descant | partner=0 tolerance=8 lift=.55 second=.9 linger=1 pace=1.6 release=1.5 attack=.01 tilt=.35 vowel=0.55 register=2600 lean=0.8 beating=0.18 | reelhiss | counter | Bright glass whose lines use only the octaves and fifths really held
Eyeglass on a chain      | Glass descant | partner=2 tolerance=60 lift=.62 pace=.9 linger=.5 colour=.4 second=.7 tilt=-.1 hold=.6 volume=3.5 lean=-0.5 beating=0.32 | chorale | descend | Glass with odd high seconds chiming in two places
Rinsed and stacked       | Glass descant | attack=.005 hold=.35 closeness=.6 lift=.5 linger=.9 pace=2 second=.55 release=5 lean=-0.5 | loop | wheel | Quick dying glass with two lines that hang on after it
Glass doors of the lift  | Glass descant | release=7 lift=.58 pace=1.4 linger=.9 second=1 attack=.005 hold=.9 tilt=.05 width=1 lean=0.5 beating=0.32 | valley | answer | Glass keys with two lines that go on for seconds after the hand
Seven panes of morning   | Glass descant | tilt=.55 colour=.5 lift=.5 second=.75 pace=1.1 linger=1 release=1.8 volume=-2 attack=1.6 vowel=.95 partner=5 beating=0.27 | ascent | entries | Bright glass that opens on an Ee with two rich lines in it
`,
    },
    {
      id: 'plucked-halo',
      name: 'Plucked halo',
      category: 'plucked',
      rows: `
Cork down a stair        | Plucked halo | hold=.1 release=.5 lift=.35 pace=1 linger=.5 volume=1 tolerance=45 partner=1 beating=0.32 second=0.1 register=1400 | close | thumbs | Stopped pipes plucked very short, with one soft bell over each
Gate latch at noon       | Plucked halo | tilt=.5 lift=.3 hold=.15 second=.1 closeness=1 volume=-3 release=.06 vowel=0.68 register=1250 linger=0.5 beating=0.32 | wood | wheel | Bright dry plucks, hardly any halo
Pond skater              | Plucked halo | pace=.4 linger=.35 second=.9 hold=.18 vowel=0.56 tolerance=8 partner=3 beating=0.32 register=1900 lift=.48 | chamber | wheel | Hollow plucks and two tiny lines stepping quickly across them
Halo for a doorstop      | Plucked halo | second=0 pace=2.4 hold=.12 vibrato=.35 colour=.3 release=2 volume=1 tolerance=50 register=1250 lift=.54 | plate | answer | A short thud of a pluck and one swaying voice that outlives it
Felted pegs              | Plucked halo | tilt=-.6 hold=.25 breath=.3 release=.9 second=.3 attack=.015 volume=2.5 register=900 vowel=0.48 tolerance=8 beating=0.27 lift=.36 | felt | thumbs | Dark soft plucks with a little air and a low glow
Tongue of a purse        | Plucked halo | body=Reed hold=.14 release=.4 linger=.5 pace=.8 second=0 volume=0.5 partner=8 beating=0.32 register=1300 lift=.3 tilt=.1 | booth | wheel | Plucked reed tongues, nasal and quick, with a pecking overtone
Wire on the fence post   | Plucked halo | body=Reed tilt=.75 hold=.22 lift=.5 pace=1.6 glide=.4 vibrato=.5 colour=.6 vowel=0.8 register=2300 partner=5 beating=0.14 second=0 | spring | climb | Bright wiry plucks and one rich voice sliding over them
Crickets in the crate    | Plucked halo | body=Reed hold=.08 release=.6 pace=.25 second=1 tilt=.3 linger=.15 vowel=0.75 lift=.46 register=2200 volume=-2 | crate | wheel | Ticks of reed with two lines chattering far above
Zither in the attic      | Plucked halo | body=Reed hold=.4 tilt=-.2 lift=.45 second=.6 pace=3 release=3.5 closeness=.2 vowel=0.14 | strings | descend | Loose plucked reed that rings on, two pure tones resting over it
Hairpin                  | Plucked halo | body=Reed tilt=.9 hold=.05 lift=.25 closeness=.8 width=.2 pace=.6 volume=6 linger=.08 release=.08 vowel=0.55 register=1250 partner=2 tolerance=20 | combo | stabs | The shortest brightest pluck of reed, driven a little
Gourd under one arm      | Plucked halo | body=Bowed attack=.005 hold=.2 tilt=0 lift=.4 pace=2 second=.2 release=.8 colour=.3 volume=-5 tolerance=8 register=1450 linger=0.82 beating=0.22 | clay | thumbs | A bow touched and lifted at once, with a round small tone above| string
Harper's calluses        | Plucked halo | hold=.45 lift=.5 second=.7 pace=2.6 release=4 width=1 attack=.005 tolerance=6 linger=0.7 beating=0.22 body=Reed vowel=.2 tilt=-.15 closeness=.85 | hall | climb | Plucked tongues that ring and two quiet lines spread wide above
Thumb on the low course  | Plucked halo | hold=.35 lift=.45 register=800 partner=12 colour=.5 release=1 second=0 linger=0.88 beating=0.32 body=Reed tilt=-.6 vowel=.15 | iron | cellar | Dark plucked low reeds with one warm octave voice in them | bass
Pizzicato in fog         | Plucked halo | hold=.12 closeness=.05 width=1 release=2.2 breath=.4 pace=2.2 attack=.01 volume=0 register=1250 partner=8 linger=0.7 beating=0.11 body=Reed vowel=.46 lift=.46 | veil | stabs | A whole loose section plucking at once, a blurred halo after it
Rice on a mirror         | Plucked halo | tilt=.6 hold=.18 pace=.7 linger=.6 lean=-1 partner=4 tolerance=48 release=1.2 second=0 beating=0.22 body=Glass vowel=.55 lift=.45 | slap | wheel | Bright plucked glass with a falling line of major thirds
Marbles on velvet        | Plucked halo | body=Glass hold=.15 tilt=-.5 lift=.5 release=1.2 pace=1.2 linger=.6 second=.6 partner=8 register=2300 | soften | thumbs | Muffled glass plucks and two soft tones in turn
Ice pick                 | Plucked halo | body=Glass tilt=.8 hold=.1 pace=.5 linger=.3 second=.8 release=.8 colour=0 volume=-1 partner=3 register=2200 lift=.42 | brightair | answer | Sharp glass chips, and pure tones at the very top ticking after them
Sugar tongs              | Plucked halo | body=Glass hold=.3 lift=.35 release=.7 linger=.8 closeness=.9 width=.3 vibrato=.3 colour=.4 volume=0 tolerance=6 beating=0.38 second=0 | glaze | stabs | Short close glass with one small warm voice
Snowmelt off the eaves   | Plucked halo | body=Glass hold=.2 lean=-1 linger=.45 tolerance=50 release=3 second=0 pace=.5 vowel=0.56 beating=0.14 lift=.48 | sparks | descend | Fading glass and a line dripping downward from it
Petri dish               | Plucked halo | body=Glass hold=.5 tilt=.1 beating=.5 tolerance=60 lift=.6 pace=2.6 release=2 colour=.3 volume=0 linger=0.76 | vibrating | climb | Plucked glass with two tones that beat and will not settle
Doo without words        | Plucked halo | body=Throat vowel=.2 hold=.2 lift=.4 release=.6 pace=1.4 linger=.7 second=.2 volume=0 beating=0.14 partner=12 | lacquer | stabs | Short sung Oo notes, round and near, with a little bell
Echo game in the cistern | Plucked halo | body=Throat vowel=.5 hold=.3 tilt=.3 lift=.5 release=2 pace=1.8 second=.7 volume=-2 tolerance=30 | swarm | answer | Struck Ah voices that die in half a second beneath two held tones
Yawn cut off             | Plucked halo | body=Throat vowel=.75 attack=.04 glide=.7 pace=1.1 vibrato=.6 colour=.7 second=0 volume=6 tolerance=8 partner=4 beating=0.14 hold=.34 release=.3 lift=.48 tilt=.1 | opens | thumbs | Clipped Eh notes and one rich voice that slides after them
Whispered plucks         | Plucked halo | body=Throat breath=1 vowel=.6 hold=.18 lift=.45 release=.5 second=.4 colour=.05 volume=2.5 tolerance=36 partner=4 | air | wheel | Puffs of breath on an Ah with pure hiss above
Hm, hm, hm               | Plucked halo | body=Throat vowel=.02 tilt=-.5 hold=.22 lift=.3 release=.4 register=900 second=0 closeness=.9 partner=11 tolerance=20 linger=0.5 | bedside | wheel | Small closed hums, each with a low tone inside it
Reed flute with a cork   | Plucked halo | vowel=.8 breath=.6 tilt=.35 hold=.28 lift=.45 pace=1.8 release=.9 attack=.02 volume=3 beating=0.38 | bottle | piper | Airy puffs of a stopped pipe with thin held tones
Acorns on slate          | Plucked halo | hold=.06 lift=.48 pace=.3 lean=-.8 register=1500 volume=-1 second=0 linger=.1 release=.12 tolerance=36 partner=9 | gated | wheel | Dry hollow clicks and a line that tumbles down after them
Boat bumping the pier    | Plucked halo | tilt=-.35 hold=.4 lift=.35 register=700 partner=12 pace=2.8 linger=1 release=1.6 second=0 colour=.4 vowel=0.48 beating=0.11 | darkplate | cellar | Low hollow plucks with one slow voice close over them | bass
Cup and string telephone | Plucked halo | tilt=.15 hold=.2 pace=1.5 glide=.3 vibrato=.3 second=.8 width=.1 release=1 tolerance=32 partner=11 linger=0.6 beating=0.11 vowel=.5 lift=.46 register=1400 | thin | answer | Hollow plucks and two lines talking in the middle
Hopscotch before supper  | Plucked halo | hold=.16 lift=.5 pace=.75 linger=.55 lean=1 release=1.8 closeness=.3 second=0 vowel=0.14 beating=0.38 | dotted | wheel | Light plucks and one line hopping upward
What stays on the wire   | Plucked halo | hold=.1 lift=.85 pace=5 vibrato=.1 colour=.15 release=6 second=.8 partner=12 tolerance=14 | nave | climb | The pluck is only a start; two pure tones stay for seconds
Swallows on the cable    | Plucked halo | hold=.15 lift=.78 pace=1 glide=.15 colour=.4 vibrato=.45 second=.7 release=2.4 vowel=0.46 tolerance=50 register=2600 | repeats | descend | Faint plucks and two singing lines that step once a second
Saint in the sink        | Only the unsung | body=Hollow attack=.005 hold=.1 vibrato=.2 release=3.6 pace=3.4 breath=.1 second=.6 volume=-1 tolerance=14 beating=0.11 register=1300 | plate | stabs | Only the halo: rich held voices started by plucks too soft to hear
Last bubble up           | Plucked halo | lift=.95 hold=.2 pace=.6 linger=.4 lean=1 colour=0 release=1 second=0 register=2200 volume=-2 | under | wheel | Pure tones that climb in small steps, the pluck all but gone
Afterimage of a lamp     | Plucked halo | body=Glass lift=.82 hold=.08 attack=.005 pace=7 colour=.5 vibrato=.3 release=8 register=1100 vowel=0.75 tolerance=8 beating=0.18 volume=-11 | sustain | answer | A click of glass and two low warm tones that stay where they were
Loose shutters, gusting  | Struck meetings | body=Reed hold=.25 pace=.5 release=.9 tilt=.2 volume=-1.5 second=0 vowel=0.64 width=0.95 lift=.46 | dotted | thumbs | Plucked reed with hard bells falling through it
Coins in a font          | Struck meetings | hold=.3 lean=.4 pace=.6 linger=.4 second=1 release=2.5 vowel=0.46 lift=.5 | pebble | answer | Plucked glass and two lines struck wherever its overtones meet
Dropped stitches         | Struck meetings | body=Hollow lift=.55 hold=.15 pace=.3 colour=.2 beating=0 release=.6 register=2200 second=0 partner=9 | cassette | wheel | Hollow plucks and a quick thread of tones unravelling downward
Seeds in a paper bag     | Struck meetings | body=Throat vowel=.7 pace=.18 release=.7 colour=.1 breath=.5 hold=.12 volume=-2 linger=.05 partner=1 lift=.52 | paper | wheel | Breathy ticks, as many as will fit, from mouths that barely open
Rivets                   | Struck meetings | tilt=.5 hold=.18 pace=.8 partner=10 tolerance=55 colour=.8 release=1.1 register=1000 width=0.15 body=Reed vowel=.7 lift=.48 | valve | tenths | Hard plucked reeds with low sevenths struck into them
Tines in an orchard      | Plucked halo | hold=.5 tilt=.4 lift=.4 pace=2 linger=.8 second=.4 release=2.6 partner=5 vowel=0.55 register=900 | leaves | climb | Ringing hollow plucks and a tone from a fourth nobody plays
Lantern on a bent pole   | Plucked halo | hold=.35 closeness=0 lift=.45 pace=2.2 vibrato=.7 second=.5 release=1.5 width=.9 volume=2 register=2300 linger=0.6 body=Reed vowel=.2 | swirl | descend | Plucks from three reeds out of tune with each other, gently
Walkers on a gravel path | Plucked halo | hold=.2 lift=.52 second=1 lean=-.6 pace=.9 linger=.8 partner=12 release=1.4 tilt=.05 vowel=0.56 tolerance=50 | round | thumbs | Dry hollow plucks with two equal lines in contrary motion
Moth behind the blind    | Plucked halo | tilt=-.8 hold=.2 pace=.2 linger=.4 register=1000 second=.7 release=.8 colour=.3 volume=-10.5 beating=0.32 lift=.42 | pillow | thumbs | Soft dark thuds and a low flutter of tones
Beans up the trellis     | Plucked halo | hold=.3 lift=.46 pace=1.1 glide=.9 colour=.2 vibrato=.15 second=.9 release=2 tilt=.2 volume=-1.5 vowel=0.64 tolerance=14 register=1250 partner=12 | hollowsweep | wheel | Crossing lines that never stand still, over plucked pipes
Fruit falling at night   | Plucked halo | body=Throat vowel=.1 tilt=-.7 hold=.5 attack=.008 lift=.5 pace=4 register=800 release=4 second=.3 partner=12 beating=0.32 | cave | cellar | Deep sung thuds that fade, one low tone resting on each | bass
Dew on a spoke           | Plucked halo | body=Glass hold=.25 second=.9 pace=1.3 linger=.7 release=2.2 vibrato=.5 volume=-1.5 tolerance=20 beating=0.22 lift=.38 vowel=.4 tilt=-.1 register=1700 partner=7 | glimmer | highwire | High plucked glass and two quick small voices with a sway | bell
Barge rope creaking      | Plucked halo | body=Bowed tilt=-.2 hold=.6 attack=.03 lift=.5 glide=.8 pace=2 register=1000 colour=.8 vibrato=.3 second=0 partner=5 linger=0.6 beating=0.11 | halved | tenths | Slow strokes of a bow and one thick voice creaking between its tones| string
Loft full of bobbins     | Plucked halo | hold=.2 pace=.5 linger=1 glide=0 second=.8 lift=.6 vibrato=0 colour=.25 release=1 width=1 tolerance=11 | throb | wheel | Hollow plucks and two steady lines that change places all the time
Peg loom                 | Plucked halo | body=Reed hold=.3 closeness=.6 lift=.5 pace=.6 linger=.6 second=.5 beating=.7 tolerance=60 release=1 tilt=-.4 register=2300 | amptrem | thumbs | Dull plucked reed with small beating tones
`,
    },
    {
      id: 'bowed-fog',
      name: 'Bowed fog',
      category: 'string',
      rows: `
Estuary before light     | Bowed fog | lift=.42 attack=1.8 release=6 tilt=-.5 breath=.3 volume=-1.5 second=.1 | valley | longa | A dark slow section and a line that only rises through it
Wool over the moor       | Bowed fog | closeness=0 attack=2.6 tilt=-.75 lift=.35 breath=.6 second=.8 pace=5 volume=0 tolerance=50 linger=0.82 | veil | vesper | Wide dark bows, full of air, one faint line climbing and one sinking
Fog signal unanswered    | Bowed fog | attack=1 lift=.6 register=700 colour=.7 second=0 pace=4 glide=.2 partner=12 release=3 tolerance=8 beating=0.22 | farshore | pedal | Low bows behind one thick voice in their own register | drone
Grey wool, grey water    | Bowed fog | tilt=-.15 attack=3.2 closeness=.3 lift=.5 lean=-.8 pace=2.4 release=8 vibrato=.4 volume=-0.5 second=.1 vowel=0.75 beating=0.11 | tides | entries | A slow swell of bows under a line that falls and sways
Morning without edges    | Bowed fog | attack=4.5 release=10 tilt=.2 lift=.55 glide=.8 second=1 breath=.2 colour=.15 partner=4 | space | longa | Bows that take five seconds to come, and two pure lines always sliding
Gut in a bare room       | Bowed fog | closeness=.95 attack=.18 release=.5 breath=.1 tilt=.1 lift=.3 lean=0 pace=2 width=.2 volume=-0.5 tolerance=8 partner=0 linger=0.7 beating=0.14 | close | counter | Two close dry bows with hardly a line between them
Fiddler on the threshold | Bowed fog | closeness=.85 attack=.12 lift=.45 glide=.15 pace=1.1 vibrato=.65 second=0 release=.6 breath=.2 volume=1.5 vowel=.8 beating=0.11 tilt=.4 | chamber | follow | A bright near bow and one swaying voice above it
Attic viol               | Bowed fog | attack=.3 partner=12 vibrato=0 lean=.1 pace=3 release=1 colour=.4 breath=.05 glide=0 volume=2 linger=0.82 lift=.55 tilt=-.55 vowel=.2 closeness=1 | crate | sevenths | Straight dark bows with a plain octave voice over each
Rosin by the stove       | Bowed fog | closeness=.7 tilt=.3 attack=.25 lift=.55 colour=.6 vibrato=.8 pace=1.6 second=.4 release=1.4 width=.4 lean=-.2 vowel=0.75 partner=5 | wood | counter | Warm bows and a full voice with the widest sway
Back desk of the section | Bowed fog | attack=.4 release=.8 breath=.15 width=.6 pace=2.5 glide=.1 volume=0 lift=.09 closeness=.35 tilt=-.2 vowel=0.46 register=2300 | shaded | vesper | A small section playing plainly, the line no more than a gleam
Bull fiddle and barn     | Bowed fog | attack=.1 tilt=-.4 lift=.25 register=650 partner=12 closeness=.9 release=.5 second=0 width=.1 breath=.1 vowel=0.05 tolerance=8 linger=0.6 beating=0.11 | iron | cellar | A close low bow with a hummed octave inside it | bass
Keel scraped on sand     | Bowed fog | tilt=.35 lift=.45 register=900 partner=7 breath=.6 colour=.9 closeness=.6 release=1 lean=-1 second=0 attack=.12 linger=0.6 beating=0.18 hold=0.76 vowel=.5 | grit | cellar | Rough low bows with a thick voice that only falls | bass
Undertow of cellos       | Bowed fog | attack=1.1 tilt=-.6 lift=.4 register=1000 closeness=.4 pace=3 glide=.5 release=3 width=.5 volume=1 beating=0.18 second=0.1 | padded | undersong | Dark low bows swelling slowly under a sliding line
Coal barge under tow     | Bowed fog | tilt=-.9 lift=.5 register=600 partner=10 colour=.5 closeness=.75 release=2 second=0 vibrato=.5 attack=.12 hold=0.76 | darkplate | undersong | The darkest bow, very low, and a warm seventh swaying over it | bass
Sunken rails             | Bowed fog | attack=2 lift=.3 closeness=.15 partner=5 register=750 second=.7 release=7 volume=1 tilt=.15 vowel=.2 | cave | openfifth | A wide low fifth of bows, one line rising out of it and one sinking | drone
Flageolet on a wet day   | Bowed fog | lift=.85 colour=0 vibrato=.1 glide=0 pace=2.4 register=2600 breath=.3 release=2 volume=2 attack=.15 vowel=0.05 linger=0.82 | hall | follow | Pure whistling harmonics, the bow only a breath under them
Harmonics of a cold hand | Bowed fog | lift=.8 colour=.1 breath=.75 attack=.15 pace=1.2 linger=.7 lean=.3 second=.6 release=1.2 tilt=.4 vowel=0.8 partner=8 beating=0.18 | frost | descend | Thin airy tones touched rather than held, over a trace of bow
Needle of the compass    | Bowed fog | lift=.92 colour=.3 vibrato=.35 pace=5 register=2000 second=.9 closeness=.7 attack=1.4 partner=12 | brighthall | entries | Two steady high voices from bows you can no longer hear
Skylark over stubble     | Bowed fog | pace=.35 linger=.5 lean=.6 vibrato=.5 attack=.4 tilt=.2 volume=5 second=.1 vowel=0.64 partner=2 tolerance=20 beating=0.11 register=2300 lift=.6 | openair | longa | Quick high calls, mostly climbing, over a far section
Bow tip only             | Bowed fog | lift=.7 colour=.2 attack=.06 release=.9 hold=.5 pace=1.6 closeness=.8 tilt=.6 vibrato=.2 breath=.1 register=2300 second=0 | topwide | wheel | Light bright bow strokes that fade beneath one clear line
Bow laid on the neck     | Bowed fog | tilt=-.65 breath=.5 closeness=.6 lift=.38 lean=0 pace=2 release=1.2 vibrato=.3 volume=-2 attack=.15 vowel=0.05 tolerance=14 partner=8 linger=0.7 beating=0.18 second=0.1 | blanket | counter | Soft dull bows with much air and a quiet voice
Linen press              | Bowed fog | tilt=-.8 closeness=.95 attack=.2 lift=.55 register=1100 colour=.35 pace=1.4 second=.3 release=.7 breath=.2 vowel=0.2 linger=0.7 | pillow | sevenths | Muffled close bows and a plain line that keeps stepping
Candle smoke sideways    | Bowed fog | tilt=-.55 lift=.62 glide=1 pace=3 vibrato=.1 second=.6 attack=.9 release=3.5 colour=.1 volume=3 vowel=0.12 | swirl | vesper | Dark bows and two pure lines that are nothing but slides
Velvet on both strings   | Bowed fog | tilt=-.95 attack=1.5 lift=.3 vowel=0 closeness=.35 partner=12 pace=6 register=800 release=5 breath=.05 tolerance=5 second=0 | darkhall | longa | Bows so dark they are almost pure tone, one low line hardly moving
Chamois and beeswax      | Bowed fog | tilt=-.45 attack=.08 hold=.6 release=.4 lift=.3 closeness=.8 width=.15 pace=1 linger=.5 volume=0.5 beating=0.27 | lacquer | thumbs | Short soft close bows with a small bell of a line
Sawn light               | Bowed fog | tilt=.85 closeness=.7 attack=.1 lift=.35 breath=.2 pace=.9 release=.5 lean=-.4 glide=0 vibrato=.1 volume=3.5 second=0 vowel=0.55 beating=0.18 | overtones | follow | Hard bright bows through heat, with a line that steps down
Rosin dust in a sunbeam  | Bowed fog | tilt=.7 breath=.85 closeness=.4 attack=.5 lift=.5 colour=.1 pace=1.6 linger=.6 release=2 vowel=.7 volume=1.5 register=2300 partner=10 | glimmer | entries | Bright hissing bows with soft touched tones floating over
Iron gate half open      | Bowed fog | tilt=.95 attack=1.6 closeness=.55 lift=.6 colour=1 glide=.9 register=1300 release=3 partner=10 volume=2 tolerance=12 second=0 | tin | undersong | A bright bow and one rich creaking voice that slides all the way
Scythe on the stone      | Bowed fog | closeness=1 attack=.06 lift=.25 vibrato=0 width=.3 partner=3 tolerance=50 volume=2 release=.12 register=1450 beating=0.38 vowel=.85 tilt=.45 | combo | stabs | Dry glaring bows played short, all three strings as one
Gulls behind the plough  | Bowed fog | tilt=.5 lift=.68 vibrato=.9 glide=.7 pace=.8 lean=-1 second=1 register=2400 attack=.3 volume=0 vowel=0.95 partner=11 tolerance=45 beating=0.11 | farend | entries | Bright bows and two wild swaying voices, one falling as the other climbs
Off the string           | Bowed fog | attack=.02 hold=.3 release=.25 closeness=.75 tilt=.2 lift=.35 second=0 pace=.8 linger=.5 volume=4 vowel=0.56 beating=0.38 | ambience | wheel | Short bounced bows and a little chime of a line
Bow hairs counted        | Bowed fog | attack=.03 hold=.15 release=.6 tilt=.4 lift=.6 pace=.3 linger=.3 lean=0 second=.8 vibrato=0 volume=-0.5 | dotted | thumbs | Clipped bow strokes with two lines ticking quickly after
Dance in stocking feet   | Bowed fog | attack=.04 hold=.4 closeness=.2 tilt=-.2 lift=.4 release=.5 pace=1 glide=.2 second=.2 width=.8 volume=0.5 | doubled | stabs | A loose section of short soft bows
Hooked strokes           | Falling thirds | attack=.05 release=.35 lift=.5 hold=.5 pace=.6 vowel=0.56 beating=0.38 | slap | wheel | Bright hooked bows and a falling line of major thirds
Stubbed and swallowed    | Falling thirds | hold=.2 tilt=-.3 lift=.45 pace=1.2 release=.8 partner=2 tolerance=60 beating=.4 volume=-1 vowel=0.14 | gated | stabs | Dull bows stopped short, with a trembling tone left behind
Thirds down the stair    | Falling thirds | attack=.4 release=3 lift=.6 pace=1.4 volume=-1.5 second=0 beating=0.14 width=0.15 register=1500 | stairwell | descend | Bright bows in slow strokes and a line falling by thirds
Glissando of the tide    | Bowed fog | glide=1 pace=2 lift=.7 colour=.5 lean=.9 vibrato=.1 attack=.6 register=1500 tilt=-.2 volume=-0.5 second=0 vowel=0.64 | seasick | longa | One long voice sliding ever upward over half-sunk bows
Skater's wide curve      | Bowed fog | glide=.6 pace=4 lift=.6 colour=.25 vibrato=.3 lean=-.3 second=.9 attack=.4 closeness=.6 release=2.4 tilt=.1 volume=1 vowel=0.64 tolerance=14 register=1150 linger=0.76 | circle | vesper | Two slow voices that curve between their notes over plain bows
Ghost at the music stand | Bowed fog | lift=1 glide=.3 colour=.7 vibrato=.55 pace=1.8 second=0 release=1.6 partner=12 closeness=.8 volume=1.5 attack=.15 vowel=0.12 tolerance=8 register=1450 linger=0.88 beating=0.22 | chapel | follow | No keys at all, only a bowed voice that plays its own tune
Bow drawn in sleep       | Bowed fog | glide=.4 lift=.5 lean=0 pace=2.8 vibrato=0 colour=.4 attack=1.2 hold=.6 second=.5 tilt=-.3 release=4 breath=.3 volume=-1 | asleep | vesper | Bows that fade as they are held, and straight lines drifting on
Ribbon through the reeds | Bowed fog | body=Reed glide=.5 lift=.5 tilt=-.4 lean=-.5 closeness=.3 release=2.5 pace=1.4 volume=1 second=0 attack=6 tolerance=32 partner=11 beating=0.32 | hollowsweep | entries | Reeds blown as slowly as a bow, one line sliding down through them | wind
Horsehair in high wind   | Bowed fog | breath=1 tilt=-.1 attack=.8 lift=.4 closeness=.5 release=2 pace=3 colour=.05 vowel=.5 beating=0.14 | rain | vesper | More hair than string: breathing bows with a hissing line
Chink beneath the sash   | Bowed fog | breath=.9 tilt=-.7 attack=2.2 lift=.65 colour=0 register=1600 pace=2 glide=.6 second=.7 release=5 volume=3 vowel=0.48 partner=2 tolerance=20 | wall | entries | Dark airy bows and two thin whistles sliding behind them
Barley in the wind       | Bowed fog | breath=.7 pace=.22 linger=.5 lift=.6 tolerance=50 closeness=.1 second=1 lean=.2 attack=1 tilt=.1 vowel=0.56 beating=0.14 | flock | longa | A wide airy section with a rustle of quick tones all over it | texture
Bows that will not agree | Bowed fog | beating=.7 tolerance=60 pace=5 lift=.6 colour=.6 closeness=.9 vibrato=0 second=.4 release=1.5 tilt=-.1 volume=-0.5 attack=.3 | plate | seconds | Close bows whose shared overtones rub instead of joining
Peat smoke chorale       | Bowed fog | beating=.4 tilt=-.6 lift=.5 pace=3.4 glide=.1 attack=1 closeness=.25 release=4 register=900 colour=.5 vowel=0.2 partner=2 tolerance=45 linger=0.76 second=0.1 | reelhiss | vesper | Dark wide bows with a low voice that wavers in itself
Bows on either bank      | Bowed fog | closeness=0 width=1 lift=.3 vibrato=.6 second=1 breath=.1 pace=1.2 volume=1.5 attack=.12 release=2.4 tilt=.45 vowel=0.95 | ensemble | tenths | A very wide bright section, its two lines shaking at either side
Sextet in the wine store | Bowed fog | closeness=.2 attack=.5 lift=.45 tilt=-.2 hold=.85 partner=4 tolerance=45 pace=2 colour=.45 second=.6 release=2 width=.7 beating=0.38 | undercroft | vesper | Loose warm bows and the thirds they share, sung in two parts
Drawn out of the loom    | -         | body=Bowed attack=6 release=12 lift=.65 tilt=-.35 pace=7 vibrato=.2 second=.8 closeness=.1 colour=.4 partner=12 vowel=0.12 lean=-0.75 beating=0.22 | mist | pedal | Bows and two octave voices that take six seconds to be there | pad
Rope walk                | Bowed fog | lift=.48 hold=.7 attack=.2 pace=.7 linger=.4 glide=0 closeness=.8 tilt=0 second=.7 release=1.4 width=.5 volume=1.5 | pebble | counter | Plain bows and two lines plucked lightly from their overtones
`,
    },
    {
      id: 'bell-crown',
      name: 'Bell crown',
      category: 'bell',
      rows: `
Crown without a king     | Bell crown | pace=1.2 linger=.6 second=.4 release=3 volume=2 vowel=0.55 partner=10 register=1800 lift=.5 tilt=.1 | plate | chimes | Struck bright glass and a peal of shared overtones a second apart
Tower in a thimble       | Bell crown | hold=.2 release=.7 pace=.5 linger=.3 volume=-1.5 lean=-0.5 beating=0.14 width=1 tilt=.35 register=2000 lift=.42 | close | peal | Tiny bright bells and a tick of tones over each
Bell for the second cook | Bell crown | hold=.3 tilt=0 lift=.4 release=1 pace=1.6 linger=.5 second=0 closeness=.9 volume=3 register=2600 lean=0.5 | booth | answer | One plain close bell with a single tone left over
School gate at home time | Bell crown | tilt=.5 lift=.5 hold=.35 tolerance=20 pace=.3 linger=.4 release=1.5 vowel=.8 partner=4 lean=0.65 width=0.5 | lacquer | peal | Bright hard bells with a quick clamour above
Sleigh on a dry road     | Bell crown | pace=.16 second=1 hold=.25 release=.9 colour=0 linger=.1 vowel=0.68 partner=11 lean=-0.75 register=2200 lift=.45 volume=-1 | brightair | wheel | Small bells shaken: a burst of pure tones at every touch
Dull bell in deep snow   | Bell crown | hold=.6 pace=2 linger=.8 release=2 colour=.4 vowel=0.12 width=0.28 second=0.2 tilt=-.9 lift=.5 register=800 | soften | tower | Muffled low bells and a soft plain tone over each
Belfry under repair      | Bell crown | tilt=-.4 lift=.5 hold=.4 pace=.9 tolerance=55 colour=.6 release=1.6 closeness=.3 partner=6 vowel=0.2 lean=1 | crate | tower | Dark bells with sevenths knocking in the crown
Bell in a feather bed    | Bell crown | tilt=-1 lift=.45 hold=.8 attack=.02 pace=1.5 linger=.7 second=.5 vibrato=.3 release=3 volume=0 partner=3 lean=0.8 beating=0.14 | pillow | chimes | Bells with all their edge taken off and two warm tones above
Cow path at evening      | Bell crown | tilt=-.25 hold=.2 lift=.42 closeness=.15 pace=1 linger=.4 second=.8 release=.9 width=1 volume=1.5 vowel=0.56 lean=-0.75 | openair | answer | Loose dull bells, short, wandering to left and right
Buoy past the headland   | Bell crown | tilt=-.55 hold=.55 lift=.6 register=800 pace=3 linger=.9 vibrato=.2 beating=.3 release=4 partner=12 volume=-12 width=0.28 | farshore | tower | Low dark bells and an octave that wavers over the water
Great bell dozing        | Bell crown | partner=12 register=700 lift=.4 hold=.9 tilt=-.2 pace=4 linger=1 colour=.5 release=7 second=.3 vibrato=.1 vowel=0.46 lean=-1 beating=0.18 | nave | tower | A deep bell left to ring with one sung octave in it
The hum outlives it      | Bell crown | lift=.75 register=600 colour=.6 linger=1 pace=5 hold=.3 tilt=-.5 release=6 second=0 vowel=0.12 partner=5 beating=0.11 | cave | tower | The strike soon goes and a low full tone stays in the metal
Bourdon of the dry dock  | Bell crown | hold=.7 tilt=.2 lift=.3 closeness=.1 partner=5 register=900 pace=2.4 linger=.7 release=3 lean=0.35 beating=0.38 second=0.2 | iron | cellar | Low loud bells with a slow tone above each | bass
Ship's plate, struck     | Bell crown | hold=.4 tilt=.75 lift=.35 breath=.3 beating=.6 pace=2 linger=.8 colour=.8 release=2 closeness=.2 width=0.85 | valve | tower | A clanging plate with rough beating overtones
Anvil behind two doors   | Bell crown | hold=.15 tilt=.4 lift=.5 register=1200 pace=.8 linger=.35 lean=-1 release=1 partner=11 volume=-2 second=0 vowel=0.95 | wall | footfall | Short low strikes and a tone falling after them | bass
Carillon for left hand   | Struck meetings | hold=.5 release=2 colour=.3 second=0 tilt=-.45 linger=.5 register=1400 pace=.9 vowel=0.2 lift=.5 volume=-2.5 | hall | peal | Bells with a second carillon falling over them
Rounds on six            | Struck meetings | hold=.25 pace=.45 linger=.4 second=1 lean=-1 release=1.8 beating=0 volume=-2 vowel=0.14 partner=5 width=0.28 register=1200 lift=.7 | stairwell | peal | Two peals, one ringing down and one up, hardly any bell beneath
Half-muffled changes     | Struck meetings | tilt=-.5 lift=.65 pace=.8 linger=.5 hold=.4 colour=.7 register=1100 lean=.5 release=2.4 second=0 vowel=0.48 | darkhall | peal | Dull bells, and a low full peal that mostly climbs
Clapper wound in yarn    | Struck meetings | attack=.03 tilt=-.8 hold=.5 vibrato=.4 colour=.2 linger=.8 pace=1.4 release=3 volume=-2 vowel=0.05 partner=12 width=0.28 lift=.4 | felt | chimes | Soft dark bells and small swaying tones rung very gently
All ropes at once        | Struck meetings | pace=.2 linger=.6 second=1 hold=.6 tilt=.3 lean=0 release=3.5 colour=.4 volume=-12.5 vowel=0.75 lift=.52 | swarm | tower | Bright bells under a jangle of every overtone they share
Bell that would not ring | Bell crown | linger=1 pace=3 lift=.6 tilt=.1 hold=1 vibrato=.5 colour=.4 release=5 partner=7 volume=-1 attack=2.5 vowel=0.75 lean=0.5 beating=0.32 | tiles | chimes | Bells that bloom rather than strike, two lines singing on
Rubbed bowl, wet rim     | Bell crown | linger=1 hold=1 tilt=-.4 lift=.5 pace=5 vibrato=.15 second=.9 closeness=.1 release=6 partner=8 attack=5 vowel=0.2 register=900 lean=-0.2 width=0.15 | bowls | longa | A dark bowl coaxed into sound, two tones standing in it | pad
Bell turned inside out   | Bell crown | hold=1 linger=.6 pace=.9 lift=.8 colour=0 release=4 tilt=0 attack=6 lean=0.8 | rising | entries | A bell that arrives with no strike, pure tones rung in it as it comes | texture
Sunrise on the gong      | Bell crown | hold=1 closeness=0 tilt=.4 lift=.4 second=.5 pace=4 linger=1 glide=.3 release=9 width=1 attack=6 vowel=0.95 | valley | tower | A wide bright metal swell that takes a second to open | pad
Cymbal under a cloth     | Bell crown | attack=.5 breath=1 lift=.5 hold=.7 pace=.5 linger=.5 release=3 volume=0 partner=11 lean=-1 beating=0.38 register=2000 vowel=.6 tilt=.5 | glimmer | chimes | A hissing bright shimmer with tones tapped through it | texture
Wind in the clock case   | Bell crown | breath=.8 hold=.4 tilt=-.3 pace=1.6 linger=.6 colour=.05 release=2.4 second=1 partner=4 width=0.75 lift=.46 | tube | answer | Airy bells and pure hiss at the pitch of their overtones
Chimes full of dust      | Bell crown | hold=.15 tilt=-.6 lift=.5 pace=.25 register=2200 release=1 breath=.4 second=.6 linger=.12 beating=0.18 | cassette | wheel | Dusty short bells and a flutter of tones
Frozen puddle tune       | Bell crown | hold=.28 tilt=.3 lift=.35 closeness=1 release=.6 tolerance=45 pace=.7 linger=.5 volume=-1 partner=9 vowel=0.14 lean=-0.5 width=0.5 | glaze | thumbs | Small clean bells with a major tenth pecked over them
Doorbell three flats up  | Bell crown | hold=.5 tilt=-.1 lift=.3 release=1 vowel=.3 second=0 pace=2.8 linger=.9 volume=-1 lean=-1 | bedside | answer | Plain mid bells and one tone, small and indoors
Biscuit tin chimes       | Bell crown | hold=.2 tilt=.5 closeness=0 lift=.45 beating=.8 tolerance=60 colour=.5 release=.8 pace=1 linger=.15 vowel=0.8 width=0.15 | tin | thumbs | Cheap bells a little out with themselves, with a rattle of beating tones
Pole star                | Bell crown | colour=0 pace=2 linger=.8 hold=.2 release=5 tilt=0 vibrato=.15 second=.5 volume=-4.5 vowel=0.46 lean=-0.2 width=0.4 register=2100 lift=.7 | valley | descend | One pure tone very high and then another, the bell nearly unheard
Splinters of noon        | Bell crown | hold=.1 pace=.4 lean=-.6 release=1.2 volume=4 second=0 linger=.12 vowel=0.68 beating=0.27 tilt=.6 register=2000 lift=.42 | stars | highwire | Hard bright splinters and short tones that mostly fall
Snow under a street lamp | Bell crown | pace=.6 linger=.7 lean=-1 tolerance=35 colour=.05 hold=.5 tilt=-.2 release=3.5 attack=.05 second=0 partner=10 width=0.4 lift=.5 | sparks | chimes | Soft bells with pure tones always coming down
Icicle and spoon         | Bell crown | closeness=1 hold=.25 colour=.1 pace=1.5 second=.2 linger=.5 release=1.6 breath=0 volume=6 lean=-0.75 lift=.32 tilt=0 partner=12 | spring | highwire | Clean high glass with one small tone rung after it
Upper bell of the watch  | Bell crown | lift=.65 register=2000 pace=2.8 glide=.2 linger=1 vibrato=.55 colour=.5 hold=.35 release=3 partner=12 volume=-0.5 vowel=0.55 lean=-1 width=1 second=0 | oo | chimes | High bells that fade beneath one swaying sung octave
Bell and shadow          | Bell crown | second=1 lean=-1 pace=2 hold=.3 linger=.7 beating=.2 release=2.6 partner=11 width=0.4 register=1300 lift=.55 tilt=-.1 | backwards | chimes | Every bell leaves two tones that walk away from each other
Temple door wired shut   | Bell crown | beating=1 tolerance=60 lift=.6 colour=.8 pace=4 linger=1 tilt=-.3 hold=.6 release=5 | tiles | tower | Dark bells with a rough slow beat in everything above them
Crotales in a drawer     | Bell crown | beating=.5 pace=.7 hold=.4 linger=.6 partner=2 tolerance=58 release=2 second=.9 volume=3 vowel=0.55 width=0.5 lift=.4 tilt=.15 register=1600 | vibrating | highwire | Bright high bells and trembling seconds above
Two foundries            | Bell crown | closeness=.05 beating=.35 lift=.4 pace=1.8 second=.7 hold=.9 tilt=.15 release=4 partner=3 tolerance=40 width=1 register=1450 | ensemble | tower | Wide loose bells that will not agree on a pitch
Bell sinking in the bay  | Bell crown | tilt=-.5 glide=.7 linger=1 pace=2.2 lean=-1 lift=.6 colour=.3 hold=.4 release=4 register=1400 second=0 vowel=0.05 beating=0.22 | under | tower | Dull bells with one tone sliding down and down
Wooden bell on the hill  | Bell crown | body=Hollow tilt=.2 hold=.2 lift=.42 release=.8 pace=1.4 linger=.5 colour=.2 volume=0.5 vowel=0.56 lean=-0.75 | wood | peal | Hollow wooden knocks with a soft tone over each
Bamboo in the rain shed  | Bell crown | body=Hollow tilt=.6 hold=.12 lift=.5 pace=.5 linger=.35 release=1.2 breath=.5 second=.9 vowel=0.68 beating=0.32 width=0.85 | rain | wheel | Short airy knocks and quick tones scattered after
Goose bell               | Bell crown | body=Reed hold=.3 lift=.55 pace=1.1 linger=.6 release=1.8 volume=2 lean=0.65 second=0.2 vowel=.5 colour=.5 tilt=-.45 | chorale | peal | Nasal dark bells with a rich tone in the crown
Choirboys at the rope    | Bell crown | body=Throat vowel=.5 hold=.35 tilt=.1 lift=.5 pace=1 linger=.6 release=3 second=.6 volume=3.5 lean=-0.2 | chapel | chimes | Voices struck like bells on Ah, with small peals over them
Bowed plate, let ring    | Bell crown | body=Bowed attack=.02 hold=.5 tilt=.3 lift=.45 closeness=.2 pace=2 linger=.8 release=5 colour=.5 partner=10 lean=0.65 second=0.2 | brighthall | tower | A plate set ringing with one stroke of the bow, a seventh sung in it
Stretched noon bell      | Bell crown | hold=.6 lift=.3 tilt=.1 second=.3 pace=1.6 linger=.5 release=3 partner=7 closeness=.5 volume=-1.5 register=2300 | stiff | tower | Glass bells, their own overtones plain
Dome over a pocket watch | Bell crown | hold=.45 tilt=-.35 vowel=0 closeness=.8 pace=1 second=.7 release=2 breath=.15 width=.3 volume=0 partner=8 beating=0.22 lift=.42 | bottle | chimes | Soft close bells and two lines in turn
Last tram's bell         | Bell crown | hold=.4 tilt=.2 lift=.52 lean=1 pace=.9 linger=.6 release=2 glide=.15 colour=.15 volume=-1 second=0 register=2600 beating=0.27 width=0.75 | repeats | answer | Bells and a thin line that always climbs
Seven strokes into fog   | Bell crown | hold=.5 tilt=-.15 lift=.46 pace=2 linger=.8 second=.6 release=6 colour=.35 attack=.01 vowel=0.75 lean=-1 beating=0.22 width=0.95 | stretch | tower | Round bells with two unhurried tones over them
Bells under the ice      | Bell crown | tilt=.4 hold=.3 pace=1.4 linger=.7 vibrato=.3 colour=.1 second=.8 release=2.4 register=1600 vowel=0.55 width=0.5 lift=.5 | stillwater | peal | Bright bells and two pure swaying tones
`,
    },
    {
      id: 'beating-seconds',
      name: 'Beating seconds',
      category: 'organ',
      rows: `
Console in a dry loft    | Beating seconds | tilt=.1 lift=.4 beating=.5 release=.6 attack=.08 volume=-1 partner=8 vowel=0.14 register=2300 lean=-0.35 linger=0.88 | close | stabs | Reeds drawn plain and near, with a slow beat high in the chord
Blower's bench           | Beating seconds | breath=.6 tilt=-.4 lift=.35 attack=.3 release=.8 second=.3 closeness=.4 volume=-0.5 partner=2 lean=0.65 linger=0.5 width=0.4 | crate | vesper | Breathy dark reeds, the beating only a murmur
Quarrel in the swell box | Beating seconds | beating=1 lift=.7 pace=3 colour=.9 tilt=0 release=1.2 volume=-3.5 lean=0.8 linger=0.6 | doubler | seconds | Rough rich lines that rub against each other, the reeds behind
Tuner's afternoon        | Beating seconds | beating=.3 pace=7 lift=.55 colour=.2 closeness=1 attack=.2 tilt=.2 partner=0 second=0 | wood | seconds | Steady reeds and one pure tone that beats slowly where it stands
Two stops half drawn     | Beating seconds | body=Hollow beating=.6 lift=.5 tilt=.1 attack=.15 release=1 partner=12 lean=-0.75 | chamber | vesper | Stopped pipes with octaves that will not quite close
Flue and draught         | Beating seconds | body=Hollow breath=.8 beating=.4 tilt=.3 lift=.45 attack=.25 release=1.4 colour=.2 vowel=.6 register=2800 partner=0 lean=-0.5 second=0.1 volume=-1.5 | tube | counter | Breathy stopped pipes and a thin trembling line
Wooden eight foot        | Beating seconds | body=Hollow beating=0 closeness=.95 lift=.3 attack=.05 second=0 vibrato=0 volume=-0.5 release=.15 tilt=-.35 vowel=.1 partner=12 register=1200 width=0.4 | lacquer | stabs | Plain wooden pipes, quick and steady, the line a mere edge
Quint in the gallery     | Beating seconds | body=Hollow tilt=.5 beating=.2 lift=.5 partner=7 pace=4 second=.7 attack=.1 release=2 volume=-2 vowel=0.55 lean=-0.35 width=0.95 | plate | counter | Bright stopped pipes and two lines that hardly tremble
Pipes under snow load    | Beating seconds | body=Hollow tilt=-.8 beating=.7 release=4 lift=.55 register=900 pace=6 attack=5 linger=0.76 | darkhall | pedal | Very dark pipes that fill slowly, a low slow beat in them
Chorister with a cold    | Beating seconds | body=Throat beating=.5 vibrato=.6 attack=.15 closeness=.3 register=2300 partner=4 lean=0.5 linger=0.76 width=0.85 vowel=.5 lift=.58 tilt=.4 release=.4 | chapel | vesper | A throaty stop on Ah whose upper voice trembles two ways at once
Human stop under a lid   | Beating seconds | body=Throat vowel=.1 beating=.8 tilt=-.5 lift=.5 attack=.4 register=1000 release=2 partner=12 lean=0.5 width=0.15 | wall | seconds | A hummed stop with low rough beats
Nun's loft               | Beating seconds | body=Throat vowel=.8 beating=.3 lift=.65 pace=2 tilt=.1 release=1.8 colour=.3 volume=0 partner=0 lean=0.5 linger=0.7 second=0.1 | oo | entries | Thin Eh voices and a line that shivers as it walks
Choir of drawn knobs     | Beating seconds | body=Throat vowel=.35 closeness=0 beating=.6 lift=.4 attack=.6 width=1 release=3 second=1 volume=-0.5 partner=0 lean=0.5 linger=0.6 | ensemble | vesper | Wide loose voices and two beating lines, all at once
Hymn board with no hymns | Beating seconds | body=Throat vowel=.45 beating=.15 lift=.55 pace=3 attack=.1 release=1.6 tilt=-.2 vibrato=.3 glide=.2 colour=.2 linger=0.82 width=0.28 second=0.1 | hall | counter | Plain throats as an organ, the line almost pure
Mixture of one           | Beating seconds | body=Glass beating=.5 attack=.3 hold=1 tilt=.4 lift=.45 release=1.5 register=2600 vowel=0.95 | brightair | stabs | Glass held like an organ stop, with a high beating edge
Window organ             | Beating seconds | body=Glass beating=.9 tilt=-.2 lift=.6 colour=.5 release=3 closeness=.2 attack=4 partner=1 | glimmer | seconds | Glass swelling into a chord of slow rubs
Ice mass                 | Beating seconds | body=Glass attack=2 tilt=0 lift=.35 beating=.3 release=6 closeness=.1 width=1 pace=9 vowel=0.46 lean=-1 second=0 | frost | longa | Wide cold glass held for a long time, one tone beating | pad
Lamp glass consort       | Beating seconds | body=Glass tilt=-.6 attack=.2 beating=.6 lift=.5 partner=4 tolerance=50 release=1 second=.6 vowel=0.12 | chorale | vesper | Dull glass pipes with thirds that rub
Ranks that drift apart   | Beating seconds | body=Bowed beating=.4 closeness=.1 attack=.2 lift=.35 width=1 vowel=.7 tilt=.5 release=.5 lean=-0.75 volume=-2 | brighthall | vesper | Keen bowed pipes in two wide ranks that drift apart
Grit in the windchest    | Beating seconds | body=Bowed beating=1 lift=.5 attack=.1 release=.6 partner=2 vowel=0.68 linger=0.82 width=0.5 tilt=.4 register=1400 colour=.7 | grit | stabs | Rough bowed pipes with unheard seconds beating hard in them
Slow celeste             | Beating seconds | body=Bowed closeness=.3 tilt=-.5 beating=.25 pace=8 lift=.45 attack=.9 release=3 colour=.2 vowel=0.12 linger=0.88 second=0 volume=-2 | darkplate | longa | Soft bowed pipes that undulate, one pure tone waving above
Undulant at vespers      | Beating seconds | body=Bowed beating=.7 tilt=-.2 lift=.65 attack=.5 pace=3.4 release=2 second=1 glide=.2 vowel=0.14 linger=0.76 | nave | entries | Two bowed lines wavering at different speeds over quiet pipes
Leak in the fourth rank  | Beating seconds | body=Bowed breath=.8 beating=.5 lift=.3 tilt=0 release=1 hold=.7 volume=-1 attack=.1 vowel=0.64 partner=6 lean=0.5 | reelhiss | counter | Windy bowed pipes that lose their breath as they are held
Seconds behind a door    | Beating seconds | tilt=-.7 attack=.6 beating=.5 lift=.4 colour=.4 release=2 closeness=.7 vowel=.1 lean=0.5 linger=0.76 | warm | seconds | Very dark reeds side by side, with soft beats between
Harmonium on one knee    | Beating seconds | attack=.2 lift=.3 beating=.2 release=.5 second=.4 volume=0.5 partner=9 linger=0.5 closeness=.15 breath=.8 tilt=-.45 vowel=.3 hold=.86 | combo | counter | A wheezing reed box with a faint wavering edge
Dust in the tremulant    | Beating seconds | vibrato=.9 beating=.3 lift=.6 pace=2 tilt=-.2 release=1.2 colour=.5 second=.6 partner=11 width=0.28 | groove | vesper | Reeds under two lines with a deep tremulant of their own
Regal in a market square | Beating seconds | attack=.03 lift=.3 beating=.6 closeness=.8 width=.3 second=.2 release=.08 partner=3 linger=0.5 tilt=.25 vowel=.7 colour=.45 hold=1 | valve | stabs | Snarling short reeds with a hard beating edge
Buzz in the broom closet | Beating seconds | tilt=.4 attack=.04 hold=.6 release=.4 lift=.5 beating=0 pace=1 colour=.8 vowel=.9 partner=6 register=1450 lean=0.35 linger=0.76 second=0.1 | tin | wheel | Buzzing close reeds and a rich line stepping once a second
Straight-faced bent reed | Beating seconds | beating=.85 partner=3 tolerance=55 lift=.55 attack=.1 pace=2.2 release=.8 volume=-1 vowel=.12 tilt=.4 linger=0.76 width=0.5 | amptrem | seconds | Reeds and an unheard minor third that grates against them
Night accompanist        | Beating seconds | lift=.25 beating=.4 attack=.35 release=1.4 pace=4 vibrato=.2 closeness=.35 volume=0 partner=0 vowel=.12 tilt=-.75 register=1450 linger=0.7 | shaded | tenths | Dark loose reeds that keep to the background
Swell box thrown open    | Beating seconds | closeness=.1 attack=.5 lift=.45 beating=.7 hold=1 release=2 width=.8 second=1 volume=-1 partner=0 linger=0.82 vowel=.3 tilt=.55 | giant | tenths | A whole reed division drawn at once, wide and beating
Pedal reed down the nave | Beating seconds | lift=.3 tilt=-.3 register=700 partner=12 beating=.5 attack=.4 release=4 vowel=0.64 lean=0.8 linger=0.88 | nave | pedal | Low reeds and an octave that beats very slowly
Thirty-two foot dream    | Beating seconds | body=Hollow tilt=-.4 lift=.25 register=600 partner=12 attack=.6 release=3 beating=.4 second=0 volume=-2 linger=0.76 | cave | undersong | Deep stopped pipes with a soft wavering octave | bass
Bombard in the crypt     | Beating seconds | lift=.2 attack=.06 register=800 closeness=.6 beating=.3 second=0 release=.15 tilt=.75 vowel=.6 hold=.7 linger=0.5 | iron | footfall | Loud low reeds played short, hardly any line | bass
Subbass with a limp      | Beating seconds | body=Hollow tilt=.2 lift=.4 partner=2 tolerance=60 beating=.9 register=900 attack=.1 release=.8 pace=2.4 volume=-1 linger=0.7 | heartbeat | lowtenths | Low pipes whose shared overtones limp against each other | bass
Fifths left unstopped    | Beating seconds | partner=5 beating=.5 lift=.6 pace=5 tilt=-.3 attack=1 release=5 colour=.4 vowel=0.56 | stillwater | openfifth | A dark open fifth of reeds under two wavering tones | drone
Tritone moths            | Beating seconds | partner=6 tolerance=60 beating=.7 lift=.75 pace=.8 linger=.5 colour=.1 register=2600 second=1 volume=-2 vowel=0.46 width=0.75 | flock | counter | Thin tones that flutter and beat, with reeds underneath far off
Beats counted in bed     | Beating seconds | lift=.85 beating=.45 colour=.1 pace=6 vibrato=0 attack=.8 release=3 tilt=-.4 volume=-5 partner=8 linger=0.88 second=0 | pillow | seconds | One dull tone that swells and sinks by itself
Overtones that miss      | Only the unsung | body=Reed beating=.8 vibrato=0 pace=4 glide=0 colour=.5 breath=.05 attack=.3 linger=0.6 | plate | seconds | No keys: two lines made only of overtones that miss each other
Roughcast                | Beating seconds | beating=1 colour=1 tolerance=60 pace=2 tilt=.3 attack=.05 release=.5 second=.6 volume=3.5 lean=0.8 linger=0.5 register=1600 lift=.8 | fastrotor | seconds | Grinding lines at full width with almost no reed left
Sister stops             | Beating seconds | lift=.6 beating=.2 second=1 pace=3 colour=.35 vibrato=.35 tilt=0 release=1.6 partner=4 tolerance=40 vowel=0.75 | backwards | vesper | Two nearly steady lines in thirds above plain reeds
Draw the curtain, play   | Reed keys | hold=1 lift=.5 pace=3 linger=1 attack=.2 release=2 second=.8 vowel=.55 tilt=.25 beating=.7 tolerance=14 partner=9 volume=-2 | swirl | vesper | Close reeds held on, with two lines that beat
Little wind for a barn   | Reed keys | hold=1 tilt=-.5 breath=.5 lift=.4 beating=.3 release=3 linger=1 pace=5 width=.8 volume=-1 attack=3 vowel=0.2 tolerance=14 partner=4 | space | entries | Soft airy reeds, a slow wave high in them
Portative on a knee      | Reed keys | body=Hollow hold=1 attack=.03 lift=.38 beating=.2 pace=1.6 linger=.8 vibrato=.3 volume=2 vowel=.75 tilt=.55 release=.2 lean=-0.35 | ambience | piper | Small bright pipes under one hand, with a light tremble
Barrel organ on the sand | Reed keys | hold=.9 beating=.6 tilt=.2 lift=.55 pace=.6 linger=.6 tolerance=50 colour=.5 second=.9 vowel=0.56 | seasick | stabs | Reeds and two beating lines that turn over twice a second
Fairground in November   | Reed keys | hold=1 closeness=.05 lift=.4 second=.8 beating=.4 attack=.04 release=.8 width=1 pace=1.4 linger=1 volume=5.5 tolerance=50 tilt=.4 vowel=.8 | fastrotor | stabs | Bright loose reeds and wavering upper voices
Offertory in pencil      | Chapel four | body=Reed beating=.35 tilt=-.6 lift=.5 closeness=.8 pace=2.8 register=1200 release=1.6 volume=2.5 lean=0.5 linger=0.6 | vibrating | sevenths | Dark close reeds with a thick low line not quite in tune with itself
Shimmer of brass pipes   | Beating seconds | tilt=.45 beating=.5 lift=.5 colour=.2 pace=.4 linger=.7 second=1 release=4 attack=6 partner=2 lean=-0.5 | tides | longa | Bright reeds that come in slowly, two lines flickering inside
Snow light on the manual | Beating seconds | body=Glass beating=.6 colour=0 pace=2 attack=.5 release=3 second=.7 volume=3.5 partner=3 linger=0.7 width=0.85 register=2100 lift=.58 | faintlift | highwire | Pure high tones that beat thinly over glass
Tape of a village organ  | Beating seconds | beating=.45 lift=.48 attack=.15 release=1 pace=2.6 closeness=.2 breath=.3 register=1000 tilt=-.4 vowel=.5 | blanket | counter | Loose airy reeds and a low waver in the tune
`,
    },
    {
      id: 'low-partner',
      name: 'Low partner',
      category: 'bass',
      rows: `
Company on the night bus | Low partner | attack=.06 release=.5 closeness=.95 lift=.4 pace=2 glide=.2 width=.1 tilt=-.7 colour=.8 tolerance=30 linger=0.5 | forward | cellar | One low close throat and a warm seventh it shares with nobody
Lodger in the basement   | Low partner | vowel=.3 tilt=-.2 attack=.02 hold=.5 lift=.45 release=.4 linger=.6 pace=1 vibrato=.1 | middle | footfall | Short low Oo notes with a soft bell from an unheard seventh
Warm joists              | Low partner | vowel=0 tilt=-1 closeness=1 attack=.04 breath=0 width=0 vibrato=0 lift=.05 release=.12 hold=0.86 | iron | footfall | A hum so dark it is nearly the bare note, quick under the hand
Father's side of the hum | Low partner | tilt=-.7 lift=.5 attack=.3 register=700 vibrato=.7 release=1.2 breath=.3 body=Hollow vowel=.1 pace=2.2 | blanket | undersong | A dark stopped bass, half a hum, and above it a tone with a wide sway
Tenor who never sits     | Low partner | vowel=.5 tilt=0 lift=.7 register=1200 pace=1.2 glide=.6 colour=.9 attack=.1 release=1 second=.2 tolerance=30 width=0.95 | singer | tenths | Low Ah with a rich sliding tenor voice an unheard seventh gives it | voice
Walking stick on brick   | Tenth bass | lift=.2 closeness=.9 tilt=.4 hold=.3 volume=3.5 partner=9 release=.08 vowel=0.8 lean=-0.75 beating=0.11 | close | footfall | Short bright stopped notes with hardly a trace of a tenth
Tenth in the toolbox     | Tenth bass | lift=.5 linger=.4 pace=.7 colour=.1 release=.6 attack=.005 vowel=0.46 tolerance=55 lean=0.8 | crate | footfall | Hollow low plucks and a clear tenth pecked over each
Upright packed with felt | Tenth bass | tilt=-.4 hold=.35 release=.5 breath=.15 lift=.3 vibrato=.3 linger=1 pace=2 volume=-0.5 beating=0.38 | felt | cellar | Soft stopped low notes that fade, a small tenth swaying over them
Slack hose bass          | Tenth bass | closeness=.1 hold=.6 breath=.5 width=.5 partner=3 tolerance=45 release=.8 beating=0.22 lift=.52 tilt=.1 | clay | cellar | Airy low notes and a tone that an unheard minor third leaves in them
Piling struck twice      | Tenth bass | hold=.2 tilt=.7 lift=.4 partner=12 register=900 linger=.3 pace=.4 colour=.5 volume=0 release=.15 lean=-0.35 | doubler | footfall | Hard hollow knocks with a quick octave flicker
Reed pipe in the keel    | Low partner | body=Reed tilt=-.3 attack=.05 release=.4 lift=.3 closeness=.8 pace=2.2 register=850 volume=-1.5 vowel=.4 colour=.8 hold=.75 tolerance=8 lean=-0.75 linger=0.7 | lacquer | footfall | A dark low reed with a seventh close above it
Contrabass tongue        | Low partner | body=Reed tilt=.5 attack=.02 hold=.7 lift=.25 vibrato=0 colour=.3 second=.1 release=.1 lean=-1 linger=0.76 beating=0.14 | grit | footfall | A bright rough low reed played short
Osiers after the flood   | Low partner | body=Reed breath=.8 tilt=-.6 attack=.7 release=2.5 lift=.55 closeness=.2 pace=5 lean=-0.75 | under | openfifth | Dark low reeds full of wind under one slow sliding seventh | drone
Sump with a whistle      | Low partner | body=Reed tilt=-.1 partner=5 register=1500 colour=0 vibrato=.3 pace=1.4 attack=.08 release=.8 linger=0.76 hold=0.76 width=0.3 lift=.48 | pillow | cellar | A muffled low reed and one pure whistle far over it
Snore of the mill race   | Low partner | body=Reed beating=.8 tolerance=60 partner=2 tilt=0 lift=.5 attack=.15 release=1 glide=0 pace=3 volume=-10 linger=0.82 colour=.9 register=900 | valve | lowtenths | Low reeds whose shared overtones growl against each other
Long string in a hallway | Low partner | body=Bowed attack=.12 tilt=0 closeness=.85 release=.6 lift=.35 register=900 vibrato=.6 pace=2.6 tolerance=30 lean=0.8 hold=0.82 | chamber | cellar | A close low bow with a swaying seventh over it
Under-bowed              | Low partner | body=Bowed tilt=-.8 release=1.5 lift=.25 second=.4 breath=.4 width=.6 volume=0.5 attack=.25 tolerance=30 lean=-0.75 linger=0.76 | darkplate | lowtenths | Very dark low bows, two faint tones moving in the opposite way
Rail joint               | Low partner | body=Bowed attack=.005 hold=.25 tilt=.3 release=.5 lift=.4 linger=.5 pace=.8 vibrato=0 volume=-1.5 partner=6 tolerance=30 lean=0.35 width=0.12 | slap | footfall | One hard short stroke of a low bow, with a knock of a seventh
Tow line singing         | Low partner | body=Bowed tilt=.3 lift=.7 partner=12 register=1100 glide=.9 pace=4 colour=.4 attack=.6 release=3 volume=0 tolerance=6 lean=1 | circle | pedal | A bowed low string under an octave voice that slides without rest | drone
Bass viol left outside   | Low partner | body=Bowed closeness=.2 tilt=-.35 breath=.6 hold=.8 attack=.2 lift=.4 tolerance=45 release=1.4 partner=9 linger=0.82 beating=0.18 width=0.2 | frost | undersong | Loose cold low strings with a thin major tenth in them
Bottle at arm's length   | Low partner | body=Hollow breath=.7 attack=.08 release=.4 lift=.3 closeness=.9 vowel=.4 tilt=-.5 lean=-0.35 linger=0.7 hold=0.64 | bottle | cellar | A blown low note, breath first, with a soft seventh in the glass
Drainpipe harmonies      | Low partner | body=Hollow tilt=.4 attack=.2 lift=.6 register=1000 second=.8 pace=1.6 glide=.1 release=1 linger=0.5 hold=0.82 volume=1.5 | stairwell | lowtenths | Low stopped pipes under two plain lines a seventh makes
Mooring post             | Low partner | body=Hollow tilt=-.7 hold=.3 attack=.006 release=.6 vibrato=0 volume=-2 lift=.05 linger=0.7 beating=0.14 | ambience | footfall | A soft dark thud with a pitch to it and little else
Boiler room duet         | Low partner | body=Hollow lift=.75 tilt=0 colour=.7 register=750 pace=2 vibrato=.4 attack=.15 hold=.7 release=1.4 volume=0 beating=0.27 width=0.05 | heartbeat | cellar | The low line sings louder than the pipe it came from
Culvert under the lane   | Low partner | body=Hollow attack=.4 release=4 lift=.45 partner=12 register=650 pace=6 glide=.3 second=.5 tolerance=5 tilt=.4 vowel=.6 beating=0.22 width=1 | cave | pedal | Low stopped pipes and two octave tones a long way down | drone
Cellar glass             | Low partner | body=Glass attack=.005 hold=.5 tilt=-.2 lift=.35 release=.9 linger=.6 pace=1.2 vibrato=.1 lean=-0.75 | booth | cellar | Low struck glass with a seventh rung softly over it
Bell in the millrace     | Low partner | body=Glass tilt=-.7 hold=.7 attack=.01 lift=.5 partner=12 register=700 release=2 pace=3 glide=.1 tolerance=50 lean=0.65 beating=0.27 width=0.12 | under | footfall | Dull low glass and a sung octave that outlasts it
Pressure gauge           | Low partner | body=Glass tilt=.5 hold=.15 attack=.005 lift=.4 pace=.35 register=1400 colour=.1 vibrato=0 volume=-1.5 partner=6 linger=.1 release=.15 tolerance=30 lean=0.8 width=0.2 | glaze | footfall | Hard low glass clicks and a ticking seventh
Ballast of old panes     | Low partner | body=Glass tilt=-.4 closeness=.1 width=.9 lift=.4 release=4 pace=5 second=.6 attack=5 beating=0.38 | murky | pedal | A slow low glass swell with two dark tones sliding in it | drone
Wine vat, struck         | Low partner | body=Glass tilt=.1 hold=.35 attack=.005 partner=5 lift=.55 register=900 beating=.5 tolerance=50 release=1.6 linger=.8 width=0.05 | undercroft | lowtenths | Low glass and a tone above it that wavers on after the strike
Basso in a lift          | Low partner | vowel=.65 tilt=.2 attack=.05 release=.4 lift=.35 closeness=.7 register=1000 glide=.7 pace=.8 colour=.5 volume=0 tolerance=8 width=0.12 | gated | cellar | A bright low Eh with a quick sliding voice in it
Chant under the tarmac   | Low partner | vowel=.2 tilt=-.4 closeness=.2 attack=.4 release=2 lift=.3 partner=7 width=.8 pace=3 volume=-2 tolerance=14 lean=-0.35 | darkhall | openfifth | Many low throats on Oo, a plain fifth glowing over them | drone
Growl learned from tides | Low partner | vowel=.85 tilt=.6 closeness=.4 lift=.45 register=1500 colour=1 glide=.8 pace=2 attack=.1 release=.8 partner=12 lean=-0.5 beating=0.27 volume=-1.5 | sustainhowl | cellar | A hard low Ee with one rich voice sliding about above
Monk with a lantern      | Low partner | register=1700 pace=1.6 vibrato=.1 attack=.2 release=1.4 partner=12 glide=.1 lean=0.35 linger=0.7 body=Reed closeness=.6 volume=-1.5 lift=.64 colour=0 tilt=-.35 vowel=.15 | chapel | undersong | One low reed and a pure overtone stepping high over it | bass
Breath of the tunnel     | Low partner | vowel=.55 tilt=-.5 breath=.8 attack=.6 lift=.4 release=3 closeness=.3 second=.6 pace=4 lean=0.35 width=0.75 | farend | pedal | Breathy low voices and two sevenths moving slowly past each other | voice
Pocket octave            | Low partner | partner=12 register=600 lift=.5 attack=.01 hold=.6 release=.3 linger=1 glide=0 pace=3 tilt=-.3 vibrato=.2 beating=0.18 volume=-10.5 | warm | footfall | A short dark hum with its own sung octave in the pocket
Fourth man down          | Low partner | partner=5 lift=.55 register=1000 tilt=-.1 attack=.1 pace=1.2 glide=.1 colour=.4 vowel=.3 release=.7 tolerance=6 beating=0.38 width=0.3 | round | cellar | A low Oo and the octaves it shares with a fourth nobody sings
Cook's bell pull         | Low partner | partner=4 tolerance=50 lift=.6 vowel=.2 tilt=-.2 lean=-1 pace=1 linger=.7 glide=0 attack=.03 release=1 beating=0.11 hold=0.7 width=0.2 | dotted | footfall | Low hums with a major third falling in small soft bells
Nobody's bass            | Low partner | partner=0 lift=.4 tilt=-.6 attack=.2 release=1.6 pace=2.4 second=.5 volume=-1.5 tolerance=30 beating=0.32 | wall | lowtenths | Dark low keys with no partner; the line lives only in the tenths you hold
Second violin's cellar   | Low partner | partner=9 tolerance=50 lift=.55 vowel=.1 tilt=-.3 second=.7 pace=1.8 glide=.3 attack=.15 release=1.2 lean=-0.75 beating=0.27 hold=0.64 width=0.12 | padded | lowtenths | Low hums and two sliding lines drawn out of them by unheard sixths
Only the lodger left     | Only the unsung | partner=10 register=700 attack=.05 release=.6 pace=2 second=0 colour=.6 tolerance=40 lean=0.65 hold=0.76 | close | cellar | The bass is gone and its seventh sings the line alone | voice
Ghost in the bass clef   | Low partner | lift=.9 colour=.3 register=1300 vibrato=.3 pace=2.6 glide=.2 attack=.08 release=1.6 hold=.5 linger=0.76 width=0.2 | repeats | footfall | A low line heard mostly through the high tone each note leaves
Bass made of steam       | Breath line | body=Throat partner=10 register=800 lift=.3 tilt=-.4 attack=.1 release=.5 lean=-0.2 width=0.05 | suboct | cellar | A breathed low Ah with a hissing seventh over it
Stoker's door            | Low partner | breath=1 tilt=.2 vowel=.6 attack=.3 release=1.5 lift=.35 closeness=.1 width=1 pace=4 tolerance=12 | iron | openfifth | Low roaring breath with a pitch and a slow sliding seventh | texture
Buried telephone         | Low partner | pace=.3 linger=.4 lift=.65 hold=.4 attack=.01 glide=0 vibrato=0 register=1200 second=.5 release=.6 lean=-0.5 width=0.3 | wall | footfall | Low hums and a muffled quick ringing made of sevenths
Slow elevator of coal    | Low partner | attack=3 release=8 lift=.45 tilt=-.8 pace=8 glide=.9 register=650 second=.3 tolerance=40 width=0.4 | descent | pedal | A dark hum that takes three seconds to rise under a gliding seventh | drone
Low tide ladder          | Low partner | lean=1 pace=.6 linger=.6 lift=.55 glide=0 attack=.05 hold=.8 release=1 tilt=-.1 tolerance=40 width=0.05 | overtones | cellar | A steady low hum while its overtones climb a short ladder
Sinking fund             | Low partner | lean=-1 glide=1 pace=2 lift=.6 colour=.3 vibrato=.2 attack=.12 release=1 tilt=-.5 tolerance=8 beating=0.18 hold=0.64 | halved | cellar | A dark low hum and one tone that slides down and down again
Bass for a wooden floor  | Tenth bass | body=Throat vowel=.15 attack=.02 release=.3 lift=.35 hold=.55 tilt=-.2 width=.1 lean=-0.2 beating=0.27 | wood | footfall | Short dark sung bass notes with a tenth tucked in
Thump under the glass    | Tenth bass | body=Glass hold=.12 tilt=-.6 lift=.3 release=.5 partner=12 vibrato=0 closeness=1 beating=0.38 | tube | footfall | A dull low glass thump with a glint of octave
`,
    },
    {
      id: 'breath-line',
      name: 'Breath line',
      category: 'wind',
      rows: `
Grass blade and thumbs   | Breath line | tilt=.6 vowel=.9 lift=.5 release=.3 attack=.04 second=0 pace=1 volume=2 tolerance=36 partner=12 beating=0.27 | close | piper | A thin shrill blown note with hardly any body and a hissing line
Flute with no fingers    | Breath line | lift=.4 breath=.55 closeness=.9 attack=.08 release=.6 vibrato=.4 second=0 volume=2 tilt=-.25 partner=2 tolerance=32 lean=0.65 linger=0.88 | chamber | follow | A soft stopped flute and one pure line near it
Pipe blown past itself   | Breath line | lift=.88 breath=.7 colour=.5 pace=1 glide=.2 attack=.12 release=1 second=.3 volume=1.5 partner=12 lean=-0.5 linger=0.5 width=0.5 | hall | piper | The note gives way to a fuller voice an overtone higher
Low whistle on wet stone | Breath line | register=1000 lift=.6 tilt=-.4 colour=.4 attack=.1 vibrato=.5 release=1.5 partner=12 second=0 volume=3.5 tolerance=36 lean=-1 linger=0.88 beating=0.22 width=0.15 | stairwell | follow | A dark airy pipe and a low whistled octave
Clay pipe from a ditch   | Breath line | breath=.4 tilt=-.5 vowel=.1 lift=.35 attack=.02 release=.25 closeness=1 width=.1 volume=4 linger=0.76 | clay | piper | Round small blown notes, quick and close, the line barely there
Reed cut this morning    | Breath line | body=Reed tilt=.2 lift=.4 attack=.05 release=.4 breath=.6 closeness=.9 volume=4 linger=0.5 second=0 | booth | piper | A fresh airy reed with one pure tone above
Duct of the old bellows  | Breath line | body=Reed lift=.5 breath=1 attack=.5 release=2 second=.7 pace=3 register=1150 partner=11 tolerance=20 tilt=-.1 vowel=.6 | rooms | counter | Reeds nearly drowned in wind, two hissing lines
Double reed out of puff  | Breath line | body=Reed tilt=.7 breath=.5 lift=.45 hold=.5 colour=.6 vibrato=.6 release=.5 attack=.03 partner=4 beating=0.27 second=0.1 | valve | piper | A hard bright reed that runs out of air, and a swaying voice over it
Bagpipe left to die      | Breath line | body=Reed hold=.6 closeness=.3 lift=.35 breath=.8 attack=.3 release=3 partner=7 pace=5 tilt=.1 volume=6 register=2600 second=0 | openair | openfifth | A loose reed drone losing breath, one high tone still held | drone
Sheng of frost           | Breath line | body=Reed tilt=.4 lift=.65 second=1 pace=.8 linger=.6 colour=.05 attack=.1 release=1 partner=12 volume=-1.5 tolerance=50 lean=-0.2 width=0.15 | frost | stabs | Airy reeds under two pure lines touched on and off
Third pipe from the end  | Breath line | hold=.4 attack=.02 release=.5 lift=.4 vowel=.4 tilt=-.1 second=0 linger=.7 volume=0.5 beating=0.32 | ambience | wheel | Short puffs of a stopped pipe with a soft tone after each
Puffed lanterns          | Breath line | hold=.2 attack=.01 tilt=.3 lift=.55 pace=.6 linger=.4 release=.8 second=.6 volume=1 tolerance=20 partner=6 lean=0.8 beating=0.32 | dotted | wheel | Quick breaths of pitch and two lines of hiss tapped behind
Chuff and after-chuff    | Breath line | hold=.12 attack=.005 tilt=-.4 lift=.5 pace=.35 breath=1 volume=-0.5 linger=.15 release=.12 tolerance=8 | doubler | thumbs | Dark short chuffs with quick whispers of pitch
Wet mouthpiece           | Breath line | body=Throat vowel=.8 hold=.3 attack=.01 tilt=.5 lift=.45 release=.4 pace=1 glide=.6 colour=.4 volume=0 lean=0.5 beating=0.18 width=0.28 second=0.1 | tin | wheel | Sharp breathy syllables and a slide of a voice between them
Tongued in the tunnel    | Breath line | body=Reed hold=.25 attack=.008 lift=.6 release=1.6 pace=1.4 linger=.8 second=.5 volume=-0.5 partner=11 tolerance=32 lean=-0.2 width=0.28 | swarm | answer | Short airy reeds with two pure tones that ring on
Air through a keyhole    | Breath line | colour=0 breath=1 pace=2.4 glide=.8 vibrato=.1 attack=.3 release=2 second=0 volume=3 lean=-0.5 linger=0.76 register=2200 lift=.86 | wall | lone | One thin whistle of air, always on its way somewhere
Kestrel above the lane   | Breath line | lift=.85 colour=.1 pace=.5 glide=.5 register=2600 lean=-.7 attack=.2 tilt=.3 second=.2 vibrato=.8 volume=4.5 beating=0.14 width=0.95 | openair | follow | Small high swooping calls over a pipe you hardly hear
Kettles over one flame   | Breath line | lift=.9 second=1 glide=.3 colour=0 pace=3.4 attack=.6 release=3 register=2200 tilt=-.2 vibrato=.35 lean=0.5 linger=0.7 volume=-2 | stillwater | entries | Two pure whistles that take turns moving
Whistling past the dyke  | Breath line | lift=.8 pace=1.2 lean=.4 colour=.02 vibrato=.55 glide=.25 breath=.25 closeness=.9 second=0 release=.8 volume=2.5 linger=0.88 register=1700 | slap | follow | A clear whistler who mostly climbs, hardly any wind
Air and one harmonic     | Breath line | lift=1 breath=.6 pace=6 colour=0 partner=12 second=.4 attack=1.4 release=6 vibrato=0 volume=1.5 | valley | entries | Nothing but two still harmonics with air round them | pad
Dunes at half past four  | Breath line | body=Throat attack=2.4 release=7 lift=.3 closeness=.1 second=.6 width=1 volume=0 vowel=.6 tilt=-.2 pace=3 register=900 lean=-1 | asleep | longa | A wide slow breath on Ah, two tones drifting in it | texture
Curtains at open windows | Breath line | body=Throat vowel=.3 tilt=-.7 attack=1.4 lift=.5 release=4 pace=.4 linger=.6 colour=0 second=.8 tolerance=30 width=0.5 | tides | vesper | Dark slow breath through an Oo with small pure tones stirring | texture
Ward at three            | Breath line | body=Throat vowel=.1 attack=1 release=2.5 tilt=-.2 breath=1 width=.7 pace=8 lift=.08 tolerance=20 partner=1 lean=-0.35 linger=0.88 beating=0.18 | air | vesper | Closed mouths breathing in chords, scarcely a line | texture
Sea in a stairwell       | Breath line | body=Throat vowel=.7 tilt=.3 attack=1.8 lift=.65 glide=.9 pace=4 release=5 second=1 closeness=0 volume=1.5 lean=1 | swirl | longa | A bright wide hiss on Eh and two lines sliding all the time | texture
Hush at the bedside      | Breath line | body=Throat vowel=.2 attack=.6 release=1.2 tilt=-.9 vibrato=.3 second=0 pace=3 width=.2 breath=1 tolerance=6 linger=0.6 beating=0.18 register=800 lift=.55 | pillow | lone | The darkest whisper and one small tone in it | voice
Bow of grass             | Breath line | body=Bowed lift=.4 tilt=.2 release=1.2 closeness=.4 second=.2 pace=2 volume=3.5 attack=.15 tolerance=45 partner=2 lean=0.35 beating=0.18 | paper | follow | A string made more of air than bow, a buzz at its edge | string
Whirl of dry leaves      | Breath line | body=Bowed attack=.8 lift=.6 pace=.2 linger=.5 second=1 lean=1 release=3 tolerance=45 volume=2.5 register=2300 partner=4 vowel=.3 tilt=.4 | fastrotor | longa | A bright rush of bows, tones spiralling up and down through it very fast | texture
Aeolian fence            | Breath line | body=Bowed tilt=-.3 lift=.78 colour=.1 pace=3 glide=.4 second=.9 release=6 partner=7 vibrato=.1 volume=-0.5 register=2300 width=0.95 attack=1.2 | openair | openfifth | Wind in wire: two pure tones sliding over a string hardly there | drone
Snow blown off a roof    | Breath line | body=Bowed breath=1 tilt=.4 lift=.3 attack=.15 hold=.45 release=1.4 closeness=.05 width=1 volume=3 tolerance=20 partner=6 beating=0.11 | brightair | descend | Wide hissing strings that thin out as they are held | string
Chaff                    | Breath line | body=Bowed hold=.15 attack=.01 tilt=.5 lift=.5 pace=.25 release=.7 register=2600 volume=-0.5 linger=.12 beating=0.27 width=0.28 | cassette | wheel | Dry scraped puffs and specks of pitch
Goblet breathed on       | Breath line | body=Glass lift=.5 tilt=.1 release=2 breath=.8 second=.5 pace=2.2 volume=0.5 attack=3 partner=11 tolerance=45 beating=0.27 | plate | entries | Glass breathed on until it speaks, with two hissing lines | keys
Vapour on the beaker     | Breath line | body=Glass attack=.01 hold=.4 tilt=-.4 lift=.45 release=1 pace=1 linger=.6 second=.3 volume=-1 tolerance=11 register=1250 beating=0.14 width=0.28 | cloud | wheel | Airy dull glass, struck, with a soft tone after | keys
Dry ice                  | Breath line | body=Glass breath=1 attack=1.2 lift=.6 colour=0 pace=1.6 linger=.7 release=4 second=.8 volume=4.5 lean=-0.35 tilt=.55 register=2200 | common | chimes | A bright cold hiss on glass with pure tones touched through it | pad
Blown lantern glass      | Breath line | body=Glass attack=.15 tilt=-.7 lift=.7 colour=.5 vibrato=.5 register=1100 second=0 release=1.6 breath=.6 volume=2.5 partner=1 tolerance=20 beating=0.27 width=0.95 | shaded | piper | Dim airy glass and one low full voice that sways
Steam on the pane        | Breath line | body=Glass tilt=.2 lift=.35 attack=.05 release=3.4 closeness=.1 breath=.9 second=.6 vowel=.8 tolerance=30 partner=8 lean=0.8 beating=0.32 hold=0.64 volume=-0.5 | under | thumbs | Hissing loose glass with two soft lines, all of it wet | keys
Wind answered wrongly     | Breath line | beating=.7 tolerance=60 lift=.65 pace=3 attack=.2 release=1.6 tilt=-.1 second=.5 linger=0.82 width=0.75 | seasick | counter | Airy pipes and two lines that rub instead of settling
Leaking organ            | Breath line | body=Hollow attack=.1 lift=.3 second=.3 release=.8 pace=4 closeness=.5 partner=12 volume=-1 vowel=.9 tilt=.6 hold=.8 linger=0.5 beating=0.38 | stopped | vesper | Bright stopped pipes with more air than they should have | organ
Bottles along a ledge    | Breath line | hold=.7 attack=.06 tilt=-.2 lift=.5 closeness=.2 pace=1.4 second=.7 partner=3 tolerance=45 release=.9 lean=-1 beating=0.32 | bottle | answer | Blown notes with an unheard minor third behind their whistle
Siren far out            | Breath line | glide=1 pace=5 lift=.75 colour=.3 register=1200 breath=.5 attack=1 release=4 tilt=-.5 partner=12 tolerance=6 beating=0.11 second=0 | farshore | lone | One low voice of air that is sliding nearly all the time | drone
Barn owl                 | Breath line | vowel=.05 tilt=-.6 breath=.5 attack=.12 hold=.5 release=.8 lift=.45 register=700 glide=.4 colour=.5 second=0 pace=1.4 volume=3.5 lean=1 linger=0.6 beating=0.32 width=0.5 | giant | piper | Soft hooted notes with a low voice bending in them
Bellows and two reeds    | Breath line | body=Reed second=.9 lift=.55 tilt=0 pace=2 glide=.1 colour=.4 vibrato=.3 attack=.15 release=1 breath=.45 partner=0 volume=-1.5 lean=-0.35 beating=0.11 width=0.85 | ensemble | vesper | Breathing reeds and two lines that sing as a pair | organ
Last air in the bag      | Breath line | body=Reed hold=.3 tilt=-.3 lift=.7 pace=5 vibrato=.4 colour=.3 release=5 attack=.2 second=.6 volume=-1.5 tolerance=36 lean=0.5 beating=0.18 | sustain | entries | Reeds that give out, and two voices left standing
Feather over the fire    | Breath line | lift=.6 pace=.15 linger=.35 tolerance=55 second=1 breath=1 attack=.5 release=2 colour=0 vowel=.2 tilt=-.6 register=1150 lean=-0.2 beating=0.22 | glimmer | vesper | A flutter of hissing tones above dark soft pipes | texture
Reeds bent by otters     | Breath line | body=Reed tilt=-.5 glide=.8 lift=.6 pace=1 vibrato=.6 colour=.7 register=1100 release=1.2 attack=.1 volume=2 partner=10 beating=0.18 | hollowsweep | follow | A low full voice swimming up and down through dark reeds
Pier in a squall         | Breath line | body=Hollow breath=1 tilt=.7 attack=.3 lift=.5 vowel=1 closeness=0 width=1 release=2 pace=.6 second=1 tolerance=8 lean=-1 linger=0.7 | rain | entries | Shrill wide wind on an Ee with two lines thrown about in it | texture
Sighing floorboard       | Breath line | attack=.5 hold=.5 release=2 lift=.4 tilt=-.6 lean=-1 glide=.5 pace=1.6 second=0 volume=1 partner=8 linger=0.82 | melt | descend | Dark blown notes that fade, one tone sinking out of each
Cold flue                | Breath line | attack=.02 lift=.3 breath=.35 vibrato=0 closeness=.95 second=0 width=.15 pace=2.4 partner=5 volume=2 release=.07 tolerance=6 lean=-0.35 tilt=-.3 vowel=.2 register=1800 | tube | stabs | Plain short flue notes with a small straight line | keys
Canal at first light     | Breath line | attack=1 release=5 lift=.55 vibrato=.2 colour=.2 pace=3 second=.8 tilt=0 closeness=.3 partner=8 tolerance=55 volume=-2 | orbits | entries | Airy pipes and two nearly pure lines, slow and level | pad
Sleeper's whistle        | Breath line | breath=.75 lift=.7 colour=0 pace=2 lean=-1 linger=.8 attack=.8 release=2.6 vowel=.2 tilt=-.8 second=0 tolerance=8 beating=0.38 | bedside | lone | A dark breath and one small falling whistle
Goatherd indoors         | Breath line | body=Reed vowel=.3 register=900 colour=.6 breath=.4 attack=.2 release=1 hold=.9 partner=12 second=.2 width=0.95 lift=.58 closeness=1 tilt=0 | crate | tenths | Low blown reeds and a warm octave voice inside them
`,
    },
    {
      id: 'reed-keys',
      name: 'Reed keys',
      category: 'keys',
      rows: `
Kitchen squeezebox       | Reed keys | lift=.3 closeness=.5 tilt=.3 pace=1.4 volume=3.5 partner=8 release=.06 vowel=0.46 beating=0.11 | close | stabs | Bright reed tongues, quick and near, with a tiny overtone
Waltz for one hand       | Reed keys | vibrato=.5 colour=.6 lift=.5 pace=.8 release=.6 second=.3 register=1250 partner=10 lean=0.8 beating=0.38 | chamber | tenths | Close reeds and a small swaying voice that steps with the hand
Wet coats at lessons     | Reed keys | attack=.06 breath=.5 release=.8 linger=1 volume=0.5 hold=.85 vowel=.15 tilt=-.7 lift=.2 | shaded | vesper | Dull airy reeds held under plain chords | organ
Thumb reeds              | Reed keys | hold=.2 tilt=-.2 lift=.4 release=.5 pace=.6 linger=.4 vowel=.1 volume=0 partner=6 tolerance=32 lean=-0.35 beating=0.38 | wood | wheel | Short soft reeds that die like plucks, with a pecking tone
Lid propped on a book    | Reed keys | tilt=.1 hold=.5 lift=.6 pace=.5 linger=.35 second=.7 width=.8 release=1 vowel=0.64 register=1450 partner=12 beating=0.14 | topwide | thumbs | Reeds that fade beneath two chiming lines left and right
Melody in the spokeshave | Reed keys | hold=.6 closeness=1 release=.3 pace=2 volume=0.5 vowel=.6 partner=10 tilt=.3 lift=.5 register=1100 colour=.7 | forward | answer | Hard bright reed keys with one rich tone above
Toy from the top shelf   | Reed keys | hold=.35 closeness=.2 lift=.4 release=.4 pace=.7 linger=.4 colour=.1 volume=1.5 vowel=0.55 tolerance=11 beating=0.11 tilt=.25 register=1800 | small | wheel | Small loose reeds with a thin high tick
Station buffet           | Reed keys | linger=.8 hold=.9 release=.7 vibrato=.3 second=.4 volume=-1.5 vowel=.62 pace=1 tolerance=6 register=1250 lift=.58 tilt=-.15 | station | stabs    | Plain reeds and a tone rung at every other chord
Squeezebox in the snow   | Reed keys | closeness=.05 width=1 hold=1 attack=.1 tilt=.2 lift=.3 release=1 second=.2 volume=1.5 vowel=0.14 beating=0.22 | frost | stabs | A wide loose pair of reeds with the line nearly lost | organ
Backyard two doors down  | Reed keys | closeness=.3 tilt=-.3 hold=1 lift=.55 linger=1 glide=.4 vibrato=.6 pace=1.8 release=1.5 volume=-0.5 vowel=0.56 register=1150 partner=11 tolerance=45 beating=0.32 width=.45 | farend | counter | Mellow reeds and a sung line that slides with a sway
Electric, says the label | Reed keys | body=Glass tilt=-.4 hold=.7 lift=.35 release=.7 vibrato=.3 linger=.8 pace=1.4 volume=-0.5 tolerance=6 lean=-1 | amptrem | stabs    | Soft round glass keys with a quiet plain tone
Tine in tallow           | Reed keys | body=Glass tilt=-.75 hold=.55 lift=.45 colour=.5 register=1100 release=1.2 partner=11 tolerance=20 beating=0.11 | warm | thumbs | Dull warm glass keys and a low voice rung with them
Night manager's piano    | Reed keys | body=Glass tilt=0 hold=.65 closeness=.3 lift=.3 release=1.4 second=.4 pace=2.4 linger=1 vowel=0.46 tolerance=36 partner=4 lean=0.5 beating=0.32 | chorale | tenths | Loose glass keys with two faint sung tones behind
Enamel basin keys        | Reed keys | body=Glass tilt=.5 hold=.3 lift=.5 pace=.7 linger=.5 partner=5 release=.8 colour=.1 volume=-1 vowel=0.95 | bells | wheel | Bright short glass and the octaves an unheard fourth chips off it
Cold tea by the radio    | Reed keys | body=Glass hold=.8 lift=.55 vibrato=.7 second=.7 pace=1 release=1.8 vowel=.15 tilt=-.45 tolerance=8 register=1450 lean=0.8 beating=0.18 | seasick | vesper | Round glass keys and two voices that wobble
Clavier of rushes        | Reed keys | attack=.005 hold=.25 tilt=.6 lift=.35 closeness=.95 second=.2 release=.06 vowel=0.95 tolerance=30 register=1250 beating=0.18 body=Reed | valve | wheel | Hard bright reed keys, damped at once
Dulcimer under baize     | Reed keys | attack=.006 hold=.4 tilt=-.3 lift=.45 release=1.6 pace=1.1 linger=.6 second=.5 vowel=0.56 tolerance=20 partner=6 beating=0.14 body=Glass | felt | thumbs | Muted struck glass with two soft chimes
Spinet at a west window  | Reed keys | attack=.005 hold=.5 tilt=.4 lift=.4 release=.6 closeness=.6 partner=12 pace=1.6 vibrato=0 volume=1 lean=0.8 body=Reed vowel=.85 | glaze | counter | Bright plucked keys with a straight octave tone
Keys laid over a pond    | Reed keys | attack=.005 hold=.6 tilt=0 lift=.55 closeness=.2 release=3 pace=3 linger=1 colour=.3 second=.6 volume=-10.5 vowel=0.14 beating=0.14 body=Glass | strings | climb | Loose struck glass that rings under two held tones
Hammer in a glove        | Reed keys | attack=.02 hold=.35 lift=.5 release=.9 pace=.5 linger=.4 register=1200 body=Glass tilt=-.8 | blanket | thumbs | Dark soft glass keys with low quick taps of tone
Hollow log for ten notes | Reed keys | body=Hollow hold=.25 tilt=0 lift=.35 release=.4 pace=1 linger=.5 closeness=.95 volume=2 vowel=0.64 beating=0.27 | ambience | wheel | Round hollow knocks with a little bell of a tone
Marimba in wool socks    | Reed keys | body=Hollow attack=.01 hold=.4 tilt=-.4 lift=.45 release=.8 vibrato=.4 colour=.3 second=.3 vowel=0.12 tolerance=14 beating=0.27 | lacquer | thumbs | Soft hollow keys and a small swaying voice
Pipe rack keys           | Reed keys | body=Hollow hold=1 attack=.02 tilt=.5 lift=.4 linger=1 pace=.6 second=.5 volume=-1 release=.08 vowel=0.95 register=2300 lean=-0.35 beating=0.32 | opens | stabs | Bright hollow keys with two lines that step quickly | organ
Cloister steps           | Reed keys | body=Hollow hold=.6 tilt=-.15 lift=.6 pace=1.5 register=1000 partner=12 release=2 linger=1 colour=.5 tolerance=14 lean=0.35 beating=0.18 | undercroft | counter | Hollow keys and a low octave voice that outlasts them
Cork-soled organ         | Reed keys | body=Hollow hold=.9 breath=.6 attack=.03 lift=.5 release=.5 closeness=.3 linger=1 vibrato=.2 volume=-0.5 vowel=.85 tilt=.35 colour=.1 lean=-0.2 | bottle | answer | Airy hollow keys with one plain tone
Consonants only          | Reed keys | body=Throat vowel=.8 hold=.15 tilt=.4 lift=.45 breath=.6 pace=.5 volume=2 linger=.15 release=.08 register=1450 partner=11 tolerance=45 beating=0.18 | booth | wheel | Clipped Ee syllables with specks of tone
Vowels for five fingers  | Reed keys | body=Throat vowel=.55 hold=.5 tilt=0 lift=.4 release=.5 linger=.8 colour=.6 pace=1.2 volume=-1 beating=0.22 | middle | stabs | Short sung Ah chords with a rich tone among them
Night school solfege     | Reed keys | body=Throat hold=.9 attack=.03 lift=.6 glide=.3 linger=1 vibrato=.4 release=.8 second=.6 volume=1 vowel=.6 tilt=.2 partner=5 beating=0.18 | ensemble | tenths | Sung keys and two sliding voices in thick unison
Mumbling manual          | Reed keys | body=Throat vowel=.02 hold=.7 tilt=-.4 lift=.35 release=.4 register=900 closeness=.7 tolerance=11 partner=0 lean=-0.2 beating=0.11 volume=1 | tube | thumbs | Hummed keys with a low nasal tone
Gallery of small mouths  | Reed keys | body=Throat hold=.4 pace=.3 second=1 release=1 volume=0.5 linger=.14 tolerance=14 partner=3 lean=-0.75 beating=0.22 vowel=.9 register=1800 tilt=.2 lift=.52 | stars | answer | Bright Ee keys scattered with high quick tones
Meetings on the hour     | Struck meetings | hold=.6 lift=.5 release=1.6 lean=-.6 second=0 linger=.6 colour=.2 pace=1.6 tilt=-.4 register=1300 vowel=0.12 width=0.28 body=Hollow | pebble | tenths | Mellow stopped keys and bells falling between the chords
Ticker tape              | Rippled water | body=Reed attack=.01 hold=.4 pace=.13 tilt=.2 linger=.08 release=.1 partner=5 lift=.42 vowel=.5 register=2200 | station | wheel | Short reeds and a chatter of tones as fast as it goes
Sock machine in low gear | Rippled water | body=Reed attack=.02 hold=.8 tilt=-.4 pace=.35 linger=.4 vibrato=.1 second=.6 release=.7 lift=.55 register=1000 beating=0.38 | throb | counter | Dark reeds with two low lines stitching steadily
Pianola in a flood       | Rippled water | attack=.006 hold=.35 pace=.2 linger=.4 lift=.6 release=1.4 partner=11 beating=0.27 body=Reed vowel=.5 tilt=-.1 | murky | climb | Reed keys and a run of tones spilling after each
Loom in a chapel         | Rippled water | body=Hollow attack=.01 hold=.5 pace=.5 linger=.6 lean=-.8 lift=.5 release=1.8 colour=.3 volume=-0.5 second=0 beating=0.22 | oo | wheel | Hollow keys under a thread of tones always working downward
Paper thirds             | Falling thirds | hold=.35 attack=.008 release=.6 lift=.4 closeness=1 volume=-3 second=0 vowel=0.56 beating=0.14 body=Reed | glass | thumbs | Dry reed keys and thirds that fall lightly from them
Thirds on the mantel     | Falling thirds | body=Glass hold=.6 attack=.005 tilt=-.1 release=1.6 lift=.6 second=.6 register=1250 | memory | tenths | Glass keys and two lines of thirds, one falling and one rising
Apples in the loft       | Falling thirds | body=Reed hold=.8 attack=.01 tilt=-.3 lift=.5 pace=1.6 release=.8 vibrato=.4 volume=-0.5 second=0 vowel=0.46 beating=0.11 | cassette | stabs | Mild reeds and a warm voice that drops by thirds
Sixths for the cat       | Falling thirds | body=Hollow partner=9 tolerance=60 hold=.5 attack=.006 pace=.7 lift=.55 release=1 second=0 vowel=0.75 beating=0.22 | prism | descend | Hollow keys and what an unheard sixth shares with them, coming down
Minor matter             | Falling thirds | body=Reed partner=3 hold=1 attack=.1 lean=.5 glide=.3 release=1.4 pace=2 volume=3 tilt=-.4 vowel=.2 lift=.56 | swirl | vesper | Held reeds, an unheard minor third with them, and a line that climbs | organ
Keys of breath           | Reed keys | breath=1 tilt=-.3 hold=.5 lift=.4 release=.6 vowel=.6 attack=.02 volume=0 beating=0.22 | overtones | thumbs | Reed keys with more hiss than tongue
Harmonium in the bass    | Reed keys | hold=1 attack=.15 lift=.3 register=800 partner=12 release=1 closeness=.5 linger=1 pace=4 volume=-0.5 tilt=-.35 vowel=.6 breath=.4 tolerance=30 beating=0.18 | reelhiss | tenths | Dark low reeds and an octave standing in them | organ
Keys wired backwards     | Reed keys | hold=.3 lift=.55 tilt=.1 pace=1.2 linger=.7 release=1.4 second=.8 tolerance=50 beating=0.32 volume=-11.5 | backwards | answer | Short reeds and two lines, one up and one down
Vestibule                | Reed keys | hold=.75 tilt=.2 lift=.5 release=2.2 linger=1 pace=3 vibrato=.2 colour=.2 second=.5 attack=.015 volume=-11.5 vowel=0.46 lean=1 | quietup 1.limit=8 | tenths | Clear reeds and two quiet held tones
Sprung floor             | Reed keys | hold=.2 tilt=.35 lift=.35 release=.8 linger=.6 pace=.9 closeness=.7 vibrato=.2 volume=5 | spring | stabs | Short bright reed chords with one chime to each
Ink, pen, lamp           | Reed keys | hold=.6 lift=.4 release=.5 attack=.01 closeness=.85 colour=.2 volume=-2 tolerance=30 lean=0.8 vowel=.5 tilt=-.6 | close | counter | Reeds with the top gone, small and plain
Tunes that share a wall  | Reed keys | second=1 lift=.7 hold=.4 pace=.9 linger=.8 colour=.35 register=1500 release=1 tilt=-.1 vowel=0.64 beating=0.11 | round | counter | Two small tunes walking apart over reeds that fade
Reed and seven           | Reed keys | partner=10 tolerance=45 lift=.6 hold=.7 pace=1.4 vibrato=.2 release=1 tilt=-.3 linger=.9 volume=0.5 lean=-0.35 register=1200 colour=.5 | common | tenths | Dark reeds and the sevenths they share with someone unheard
Button box at low water  | Reed keys | beating=.4 hold=.9 closeness=.15 lift=.45 pace=1.6 release=.7 linger=1 partner=2 tolerance=58 volume=0.5 vowel=.35 tilt=.1 | whistled | stabs | Loose reeds and a wavering second that nobody presses
One finger in the cabin  | Reed keys | hold=.8 tilt=-.4 vibrato=.5 colour=.5 release=2.4 pace=2 linger=1 glide=.15 attack=.02 volume=-0.5 tolerance=36 partner=8 beating=0.27 vowel=.3 register=900 lift=.4 | rain | answer | Dark reed notes and a warm voice singing after them
`,
    },
    {
      id: 'dark-drone',
      name: 'Dark drone',
      category: 'drone',
      rows: `
Floor under the floor    | Dark drone | lift=.3 release=4 attack=.8 closeness=.8 register=600 volume=-2 lean=0.5 | close | openfifth | A close dark hum and one bare tone that hardly moves
Seam of lignite          | Dark drone | closeness=0 width=1 breath=.4 lift=.35 attack=2.6 partner=12 register=650 tolerance=36 lean=-0.35 beating=0.22 | cave | pedal | A wide loose dark hum with an octave buried in it
Long meter               | Dark drone | tilt=-.7 lift=.5 pace=12 vibrato=.3 colour=.5 register=900 attack=1 release=6 tolerance=6 partner=9 beating=0.18 | darkhall | openfifth | A hum and one warm tone that stays for twelve seconds
Third shift idling       | Dark drone | tilt=-.5 pace=3 lift=.45 glide=.6 second=.5 attack=.6 register=800 vowel=.15 volume=-1 partner=1 lean=-0.5 | heartbeat | openfifth | A dark low hum, two bare tones sliding through it
Boiler's blue flame      | Dark drone | lift=.7 colour=0 register=1400 pace=8 attack=1.2 vibrato=.05 partner=12 tolerance=50 width=1 | pillow | lone | One pure small tone over a hum you feel more than hear
Reed bed at midnight     | Dark drone | body=Reed tilt=-.6 breath=.5 attack=1.2 release=5 closeness=.4 pace=6 register=1000 lean=-0.35 width=0.15 vowel=.5 lift=.52 | undercroft | pedal | Dark low reeds with air in them and a slow bare tone
Transformer on the hill  | Dark drone | body=Reed tilt=.1 closeness=.95 lift=.3 attack=.4 vibrato=0 register=1200 colour=.3 pace=10 release=2 volume=1 tolerance=11 lean=0.5 width=1 | farend | openfifth | A level reedy buzz with one tone standing on it
Shruti in a cupboard     | Dark drone | body=Reed tilt=.5 closeness=.2 lift=.5 second=.6 pace=4 register=2000 attack=.8 colour=.2 release=3 partner=8 tolerance=5 width=0.85 | crate | openfifth | Bright loose reeds that hold while two pure lines move
Drone of the granary     | Dark drone | body=Reed tilt=-.2 hold=1 beating=.6 tolerance=50 lift=.55 colour=.6 pace=7 attack=1.5 register=900 partner=1 | haze | pedal | Low reeds and one thick tone with a slow beat in it
Sheep on the far ridge   | Dark drone | body=Reed tilt=.2 breath=.9 vowel=.8 lift=.35 attack=2 release=6 closeness=.1 second=.4 width=1 pace=5 volume=-2 partner=0 lean=0.8 | valley | openfifth | Windy wide reeds on an Eh, two tones somewhere in them
Inside the glacier       | Dark drone | body=Glass tilt=-.3 lift=.4 release=12 closeness=.05 second=.7 register=1200 width=1 partner=11 attack=6 tolerance=8 lean=0.8 | frost | pedal | Wide slow glass and two bare tones deep inside
Level of the lamp oil    | Dark drone | body=Glass tilt=-.8 attack=1 lift=.55 vibrato=.4 colour=.4 pace=6 release=6 register=800 partner=3 lean=-0.75 beating=0.32 width=0.95 | warm | openfifth | Dull glass held, with one low swaying tone
Lake that sings one tone | Dark drone | body=Glass tilt=.1 attack=1.6 lift=.65 colour=.05 pace=5 glide=.7 register=2200 second=.8 release=8 partner=8 lean=-0.35 | space | openfifth | Held glass and two pure tones that slide high over it
Freezer aisle            | Dark drone | body=Glass tilt=.6 closeness=.9 lift=.3 attack=.8 breath=.6 pace=9 register=2600 release=3 volume=1.5 tolerance=11 width=0.15 | glass | openfifth | Bright hard glass humming, with hiss and a high thread
Stalactite               | Dark drone | body=Glass tilt=-.5 attack=1.4 lift=.6 pace=1.8 linger=.4 lean=-1 register=1500 release=7 partner=12 second=0 beating=0.18 | sines | pedal | Dark glass left to settle, and tones that drip down from it
Cello left leaning       | Dark drone | body=Bowed attack=1.2 closeness=.5 breath=.3 register=750 release=4 pace=6 tolerance=4 lean=-1 width=1 tilt=.15 vowel=.5 lift=.5 volume=-2 | wood | openfifth | Low bows held without end, and a low tone leaning in the wood
Hull under way           | Dark drone | body=Bowed tilt=0 lift=.6 glide=.8 pace=5 second=.4 colour=.4 attack=2 register=1000 vibrato=.3 release=5 partner=4 lean=-0.35 beating=0.14 width=0.28 | under | pedal | Low bows and two voices sliding slowly in them
Wind turbine at dawn     | Dark drone | body=Bowed closeness=.1 lift=.4 attack=2.4 pace=2 second=.8 width=1 release=7 register=1800 colour=.1 vowel=.7 tilt=.6 partner=3 beating=0.14 volume=1.5 | tides | openfifth | Bright wide bows that swell, two lines turning over in them
Hawser under load        | Dark drone | body=Bowed tilt=.6 beating=.8 tolerance=60 partner=2 lift=.5 attack=.6 colour=.8 pace=4 release=2 register=1100 | grit | openfifth | Straining bright bows with a rough slow beat
Sand let down a rope     | Dark drone | body=Bowed tilt=-.2 breath=1 attack=1.6 lift=.55 colour=0 pace=3 second=.6 closeness=.2 release=5 register=1300 partner=1 width=0.28 | drift | openfifth | Airy bows and two bare whistling tones
Full cistern             | Dark drone | body=Hollow tilt=-.5 lift=.4 attack=1.4 partner=12 release=6 register=700 pace=8 tolerance=4 width=0.15 | sustain | pedal | Dark low pipes and a still octave tone
Vents on level two       | Dark drone | body=Hollow breath=.9 attack=.7 closeness=.4 pace=6 release=3 volume=-1 partner=1 beating=0.22 width=0.28 tilt=-.5 vowel=.2 register=800 lift=.4 | tube | openfifth | Low pipes with wind enough to hide the line
Bottle bank before dawn  | Dark drone | body=Hollow tilt=-.1 closeness=0 lift=.5 second=.8 pace=4 colour=.2 attack=.9 register=1600 partner=5 release=4 width=1 | bottle | openfifth | Stopped pipes and two plain tones above a fourth unheard
Foghorn school           | Dark drone | body=Hollow tilt=.5 lift=.2 attack=.5 closeness=.7 register=600 release=2 pace=12 partner=12 volume=-2 tolerance=8 beating=0.38 | murky | pedal | Broad low pipes that simply stand there, a hint of octave
Sluice                   | Dark drone | body=Hollow tilt=.3 lift=.65 pace=.4 linger=.5 second=1 register=2000 attack=1.2 colour=0 tolerance=45 release=4 width=0.28 | stillwater | openfifth | Held pipes with quick pure tones running over | texture
Sleeping giant's nose    | Dark drone | breath=.8 lift=.35 attack=1.8 closeness=.3 register=800 release=4 pace=7 volume=0 partner=4 lean=-0.75 vowel=.5 tilt=.05 | asleep | openfifth | Breathing low throats on an open Ah
Monks three walls away   | Dark drone | vowel=.45 tilt=0 closeness=.1 lift=.4 attack=1 register=1000 width=.8 pace=5 partner=12 release=3 volume=-1 tolerance=10 | wall | openfifth | Many low voices on Ah with a still octave in them | voice
Overtone hermit          | Dark drone | vowel=.9 tilt=.3 closeness=.8 lift=.65 colour=.1 pace=1.6 register=2200 attack=.5 release=2 partner=12 volume=0 lean=0.5 linger=0.7 width=.5 | undercroft | lone | One throat on Ee and a pure tone stepping high in it | voice
Throat and stone         | Dark drone | vowel=.6 tilt=.6 closeness=.6 lift=.5 glide=1 pace=3 register=1500 colour=.4 attack=.6 vibrato=.2 release=2.4 volume=-2 lean=0.65 beating=0.14 width=0.28 | swarm | openfifth | Bright low Ah and a tone that is always sliding in it | voice
Litany for a turbine     | Dark drone | vowel=.15 tilt=-.4 second=.9 lift=.6 pace=2 lean=.8 colour=.5 register=900 attack=1.2 release=5 partner=10 tolerance=40 volume=-2 | winding | openfifth | A dark hum and two warm lines, one climbing on sevenths
Sky going out            | Dark drone | tilt=-.6 attack=3 release=12 lift=.5 second=.8 register=1500 pace=6 colour=.2 glide=.5 closeness=.1 width=1 lean=0.65 beating=0.38 | descent | longa | A slow dark hum with two tones drifting above | pad
Eiderdown                | Dark drone | tilt=-.9 attack=1.4 release=5 lift=.45 vibrato=.5 colour=.6 register=1100 pace=3 second=.4 breath=.55 closeness=.1 vowel=.15 beating=0.11 width=0.85 | haze | longa | A soft dark hum with two warm voices swaying in it | pad
Low cloud and late lambs | Dark drone | body=Bowed tilt=-.6 attack=2 release=8 lift=.5 pace=4 glide=.3 second=.6 register=1600 closeness=.05 width=.9 partner=1 lean=-0.75 | cloud | longa | Dark loose bows and two plain lines among them | pad
Shutters at blue hour    | Dark drone | body=Hollow tilt=-.3 attack=1.2 release=5 lift=.55 second=.7 pace=2.6 register=1800 colour=.15 vibrato=.3 volume=0 lean=1 | harmonic | vesper | Dark pipes and two nearly pure voices | pad
Milk on slate            | Dark drone | body=Glass tilt=-.6 attack=.8 release=6 lift=.35 closeness=.3 pace=5 register=1000 vowel=.2 second=.3 partner=0 lean=-0.35 beating=0.27 | choirtail | vesper | Dim soft glass chords with a low tone or two | pad
Hour before the boats    | Dark drone | body=Throat vowel=.35 tilt=-.2 breath=.6 attack=2.2 release=7 lift=.6 pace=4 second=.7 register=1400 vibrato=.3 volume=-0.5 partner=11 tolerance=12 lean=-0.2 | orbits | longa | Airy throats on Oo with two slow swaying lines | pad
Silo at harvest          | Rippled water | attack=2 pace=.25 lift=.5 tilt=-.6 register=1100 second=.5 release=6 linger=.6 colour=.4 partner=1 beating=0.32 | smear | openfifth | A dark hum with low quick tones stirring in it | texture
Moss clock               | Rippled water | body=Hollow attack=1 pace=.8 linger=.35 lift=.6 tilt=-.4 release=3 lean=-.5 register=1600 volume=1 partner=11 second=0 beating=0.27 | pebble | openfifth | Dark pipes while soft tones tick downward | texture
Inside the harmonium     | Rippled water | body=Reed attack=.8 pace=.5 linger=.8 lift=.55 tilt=-.3 vibrato=.1 second=1 colour=.3 release=3 register=1400 partner=1 | rooms | longa | Dark held reeds with two lines changing twice a second | texture
Hive in the rafters      | Rippled water | body=Bowed attack=1.2 pace=.12 linger=.8 lift=.65 tilt=0 closeness=.1 colour=.5 release=4 register=1200 beating=0.32 | flock | longa | A thick swarm of low tones over loose bows | texture
Rain barrel filling      | Rippled water | body=Glass attack=1.6 pace=1.1 linger=.3 lift=.7 tilt=-.5 tolerance=50 lean=.8 release=5 volume=3 second=0 vowel=0.48 beating=0.38 | melt | longa | Dim held glass and struck tones that climb from it | texture
Wires after the storm    | Only the unsung | lift=1 tilt=0 pace=9 vibrato=0 colour=.1 second=.5 attack=2 register=900 breath=.1 release=8 | vibrating | openfifth | Two bare low tones and nothing at all beneath
Sirens at their rest     | Only the unsung | vowel=.3 glide=1 pace=4 attack=1.6 register=1400 vibrato=.3 lift=.9 release=6 colour=.4 partner=5 | ascent | entries | Two slow voices sliding through an Oo, the keys far below | pad
Anchor light             | Only the unsung | body=Hollow pace=6 second=0 colour=.3 lift=.94 register=1200 vibrato=.2 attack=1.2 release=5 partner=12 tolerance=6 | farshore | lone | One plain voice standing over next to nothing
Yawning tunnel mouth     | Sliding mouths | attack=2 release=6 tilt=-.5 lift=.5 pace=4 register=1000 vowel=.5 width=1 tolerance=36 beating=0.18 | farend | pedal | A loose dark Ah and two rich tones sliding slowly | drone
Slow mouths of the weir  | Sliding mouths | attack=1.4 release=5 vowel=.2 tilt=-.2 lift=.4 pace=2.6 closeness=.3 colour=.5 breath=.5 volume=-2 tolerance=14 beating=0.18 | bed | openfifth | Breathy Oo voices, two lines always on their way
Elm stumps               | Dark drone | tilt=-.35 lift=.5 partner=3 tolerance=50 pace=6 register=1200 attack=1 release=4 colour=.6 second=.4 lean=-0.75 beating=0.22 width=0.95 | suboct | openfifth | A dark hum and two thick tones that an unheard minor third gives it
Semibreve all night long | Dark drone | tilt=-.15 vowel=.05 lift=.55 partner=7 register=1500 pace=12 colour=.25 attack=2.4 release=14 closeness=.5 volume=-2 | stretch | openfifth | A closed hum and one still voice that outlasts the hand
Sandbar at slack water   | Dark drone | body=Reed tilt=-.9 attack=1.8 lift=.6 pace=3.4 lean=-1 glide=.4 second=.7 register=1100 release=6 breath=.2 tolerance=6 partner=10 beating=0.38 width=1 | padded | pedal | The darkest reeds under two slow tones, one falling as the other climbs
Last bus and no riders   | Dark drone | tilt=-.75 lift=.42 hold=.5 attack=.3 release=3 pace=5 register=850 colour=.4 vibrato=.35 partner=6 width=0.28 | glacial | tower | Dark hums that fade as they are held, a warm seventh staying on
`,
    },
  ],
}
