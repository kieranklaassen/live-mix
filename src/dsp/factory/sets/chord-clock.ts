import { type InstrumentSet } from './set'

// The set of Chord Clock. A direction is one way a pulse becomes a tone or a
// tone a pulse; in each are ten families of five, every family on a pulse, a
// body and a path of its own, and its five far apart in weight, pace and room.

export const SET: InstrumentSet = {
  device: 'chord-clock',
  names: {
    pulse: ['Tap', 'Drop', 'Bow stroke', 'Breath', 'Pluck'],
    body: ['Wood', 'Glass', 'Skin', 'Air'],
    path: ['Glide', 'Steps', 'Slowing', 'There and back'],
  },
  chains: {
    // Near: colour, width and the smallest rooms.
    warm: { effects: [{ deviceId: 'ambient-eq', preset: 'Warm' }], words: ', kept close and warm' },
    bare: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Open' }],
      words: ', with nothing around it',
    },
    shaded: { effects: [{ deviceId: 'ambient-eq', preset: 'Shaded' }], words: ', in the shade' },
    thin: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Thin' },
        { deviceId: 'stereo-widener', preset: 'Gently wide' },
      ],
      words: ', thinned out and dry',
    },
    deep: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Deep' }],
      words: ', dry, with its floor lifted',
    },
    muffled: {
      effects: [{ deviceId: 'ambient-eq', preset: 'Muffled' }],
      words: ', as through a blanket',
    },
    wide: { effects: [{ deviceId: 'stereo-widener', preset: 'Wide' }], words: ', dry and wide' },
    middle: {
      effects: [
        { deviceId: 'stereo-widener', preset: 'Narrow' },
        { deviceId: 'ambient-eq', preset: 'Layer' },
      ],
      words: ', dry and down the middle',
    },
    airy: {
      effects: [{ deviceId: 'spread', preset: 'Firm and airy' }],
      words: ', firm below and open above',
    },
    firm: {
      effects: [
        { deviceId: 'spread', preset: 'Firm bass' },
        { deviceId: 'ambient-comp', preset: 'Glue', params: { mix: 0.7 } },
      ],
      words: ', held firm and dry',
    },
    near: {
      effects: [{ deviceId: 'distance', preset: 'Close mic' }],
      words: ', right at the microphone',
    },
    booth: {
      effects: [{ deviceId: 'ether-reverb', preset: 'Small booth', params: { mix: 0.25 } }],
      words: ', in a small booth',
    },
    chamber: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Tight chamber', params: { mix: 0.25 } }],
      words: ', in a tight chamber',
    },
    room: {
      effects: [
        { deviceId: 'ambient-eq', preset: 'Keys' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.22 } },
      ],
      words: ', in an ordinary room',
    },
    tile: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.22 } }],
      words: ', with a small plate behind',
    },
    felt: {
      effects: [{ deviceId: 'sift', preset: 'Felt and air' }],
      words: ', with felt laid over each strike',
    },
    hammers: {
      effects: [
        { deviceId: 'sift', preset: 'Soft hammers' },
        { deviceId: 'hall-reverb', preset: 'Faint halo' },
      ],
      words: ', its strikes softened',
    },
    double: {
      effects: [{ deviceId: 'stereo-detune', preset: 'Soft halo' }],
      words: ', doubled a few cents apart',
    },
    box: {
      effects: [{ deviceId: 'vessel', preset: 'Wooden body', params: { mix: 0.45 } }],
      words: ', inside a wooden body',
    },
    jar: {
      effects: [{ deviceId: 'vessel', preset: 'Glass tube', params: { mix: 0.4 } }],
      words: ', down a glass tube',
    },
    pipe: {
      effects: [{ deviceId: 'vessel', preset: 'Inside a pipe', params: { mix: 0.5 } }],
      words: ', inside a pipe',
    },
    pot: {
      effects: [{ deviceId: 'vessel', preset: 'Clay pot', params: { mix: 0.5 } }],
      words: ', in a clay pot',
    },
    shell: {
      effects: [{ deviceId: 'vessel', preset: 'Shell to the ear', params: { mix: 0.5 } }],
      words: ', with a shell to the ear',
    },
    // Drive, loudspeakers and the wear of a medium.
    console: {
      effects: [{ deviceId: 'analog-drive', preset: 'Console' }],
      words: ', pushed gently through a desk',
    },
    triode: {
      effects: [{ deviceId: 'analog-drive', preset: 'Triode glow' }],
      words: ', glowing in a valve',
    },
    iron: { effects: [{ deviceId: 'analog-drive', preset: 'Iron lows' }], words: ', through iron' },
    folded: {
      effects: [
        { deviceId: 'saturator', preset: 'Folded glass', params: { mix: 0.35 } },
        { deviceId: 'ambient-eq', preset: 'Shaded' },
      ],
      words: ', its top folded over',
    },
    tubes: {
      effects: [
        { deviceId: 'saturator', preset: 'Tube preamp', params: { mix: 0.6 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', driven warm in a room',
    },
    combo: {
      effects: [{ deviceId: 're-amp', preset: 'Combo in a room' }],
      words: ', from a small amplifier',
    },
    bedside: {
      effects: [{ deviceId: 're-amp', preset: 'Bedside radio' }],
      words: ', from a bedside loudspeaker',
    },
    cupboard: {
      effects: [{ deviceId: 're-amp', preset: 'In the cupboard' }],
      words: ', from inside a cupboard',
    },
    stack: {
      effects: [{ deviceId: 're-amp', preset: 'Warm stack' }],
      words: ', from a warm loudspeaker stack',
    },
    corridor: {
      effects: [{ deviceId: 're-amp', preset: 'Down the hall' }],
      words: ', from a loudspeaker down the hall',
    },
    reel: {
      effects: [{ deviceId: 'tape', preset: 'Quarter inch' }],
      words: ', on a steady reel of tape',
    },
    worn: {
      effects: [
        { deviceId: 'tape', preset: 'Worn thin' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', on tape worn thin',
    },
    flutter: {
      effects: [{ deviceId: 'tape', preset: 'Flutter shimmer' }],
      words: ', fluttering on tape',
    },
    cassette: {
      effects: [{ deviceId: 'patina', preset: 'Worn cassette' }],
      words: ', on a worn cassette',
    },
    record: {
      effects: [
        { deviceId: 'vinyl', preset: 'Slow platter' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', on a record that is not quite flat',
    },
    dusty: {
      effects: [{ deviceId: 'vinyl', preset: 'Crackle bed' }],
      words: ', over a bed of crackle',
    },
    hiss: {
      effects: [
        { deviceId: 'noise-floor', preset: 'Tape floor', params: { level: -50 } },
        { deviceId: 'fdn-reverb', preset: 'Short ambience', params: { mix: 0.25 } },
      ],
      words: ', over a floor of hiss',
    },
    sampler: {
      effects: [{ deviceId: 'vintage-digital', preset: 'Glaze' }],
      words: ', under a twelve bit glaze',
    },
    crumbs: {
      effects: [
        { deviceId: 'vintage-digital', preset: 'Dusty', params: { mix: 0.7 } },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.22 } },
      ],
      words: ', crumbling a little on a dark plate',
    },
    night: {
      effects: [{ deviceId: 'radio', preset: 'Night shortwave', params: { mix: 0.6 } }],
      words: ', through a night-time radio',
    },
    stream: {
      effects: [
        { deviceId: 'low-bitrate', preset: 'Behind glass', params: { mix: 0.7 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', swirling as if behind a pane',
    },
    rattle: {
      effects: [{ deviceId: 'buzzing-bridge', preset: 'Three shells', params: { mix: 0.4 } }],
      words: ', with loose shells that rattle',
    },
    paper: {
      effects: [
        { deviceId: 'buzzing-bridge', preset: 'Paper edge', params: { mix: 0.4 } },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', against an edge of paper',
    },
    // Plates, springs and halls.
    spring: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.28 } }],
      words: ', into two springs',
    },
    slack: {
      effects: [{ deviceId: 'spring-reverb', preset: 'Slack and strange', params: { mix: 0.3 } }],
      words: ', into slack springs',
    },
    plate: {
      effects: [{ deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } }],
      words: ', on a long plate',
    },
    sheen: {
      effects: [
        { deviceId: 'chorus', preset: 'Faint air' },
        { deviceId: 'plate-reverb', preset: 'Bright plate', params: { mix: 0.2 } },
      ],
      words: ', with a bright sheen',
    },
    hall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } }],
      words: ', in a hall',
    },
    darkhall: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Dark hall', params: { mix: 0.32 } }],
      words: ', in a dark hall',
    },
    nave: {
      effects: [{ deviceId: 'hall-reverb', preset: 'Vast nave', params: { mix: 0.32 } }],
      words: ', in a vast nave',
    },
    cave: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Dark cave', params: { mix: 0.35 } }],
      words: ', in a dark cave',
    },
    valley: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Open valley', params: { mix: 0.35 } }],
      words: ', across an open valley',
    },
    gate: {
      effects: [{ deviceId: 'fdn-reverb', preset: 'Breathing', params: { mix: 0.35 } }],
      words: ', in a hall that breathes',
    },
    open: {
      effects: [{ deviceId: 'expanse', preset: 'Open space', params: { mix: 0.35 } }],
      words: ', in a wide open space',
    },
    crypt: {
      effects: [{ deviceId: 'expanse', preset: 'Low cathedral', params: { mix: 0.35 } }],
      words: ', under a low stone roof',
    },
    tunnel: {
      effects: [{ deviceId: 'expanse', preset: 'Narrow tunnel', params: { mix: 0.35 } }],
      words: ', along a narrow tunnel',
    },
    cistern: {
      effects: [{ deviceId: 'swarm-reverb', preset: 'Cavern', params: { mix: 0.3 } }],
      words: ', in a cavern of echoes',
    },
    stairwell: {
      effects: [{ deviceId: 'distance', preset: 'Stone stairwell' }],
      words: ', down a stone stairwell',
    },
    nextdoor: {
      effects: [{ deviceId: 'distance', preset: 'Next door' }],
      words: ', through the wall from next door',
    },
    outdoors: {
      effects: [{ deviceId: 'distance', preset: 'Open air' }],
      words: ', some way off in open air',
    },
    far: { effects: [{ deviceId: 'distance', preset: 'Far shore' }], words: ', from a far shore' },
    reversed: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Reverse', params: { mix: 0.35 } }],
      words: ', with a room that rises backwards',
    },
    cut: {
      effects: [{ deviceId: 'shaped-reverb', preset: 'Gated', params: { mix: 0.35 } }],
      words: ', in a room that stops dead',
    },
    choirhall: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { mix: 0.35 } }],
      words: ', in a hall that answers ah',
    },
    monks: {
      effects: [{ deviceId: 'vowel-reverb', preset: 'Low monks', params: { mix: 0.35 } }],
      words: ', with low voices in the hall',
    },
    climbing: {
      effects: [{ deviceId: 'shimmer', preset: 'Rising choir', params: { mix: 0.28 } }],
      words: ', its tail climbing by octaves',
    },
    fifths: {
      effects: [{ deviceId: 'bloom-reverb', preset: 'Rising fifths', params: { mix: 0.3 } }],
      words: ', its tail rising by fifths',
    },
    sinking: {
      effects: [{ deviceId: 'spiral', preset: 'Slow descent', params: { mix: 0.33 } }],
      words: ', with a tail that keeps sinking',
    },
    wool: {
      effects: [{ deviceId: 'haze', preset: 'Wool blanket', params: { mix: 0.45 } }],
      words: ', wrapped in woollen haze',
    },
    mist: {
      effects: [{ deviceId: 'fog', preset: 'Morning mist', params: { mix: 0.75 } }],
      words: ', blurred by mist',
    },
    veil: {
      effects: [
        { deviceId: 'fog', preset: 'Thin veil', params: { mix: 0.5 } },
        { deviceId: 'ambient-eq', preset: 'Bright' },
      ],
      words: ', behind a thin veil',
    },
    deepfog: { effects: [{ deviceId: 'fog', preset: 'Deep fog' }], words: ', deep in fog' },
    // Echoes, in time and loose.
    slap: {
      effects: [{ deviceId: 'analog-delay', preset: 'Slapback', params: { mix: 0.3 } }],
      words: ', with one quick slap',
    },
    dark: {
      effects: [{ deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.3 } }],
      words: ', with dark echoes',
    },
    heads: {
      effects: [{ deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } }],
      words: ', over three tape heads',
    },
    dotted: {
      effects: [{ deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.28 } }],
      words: ', with a dotted echo',
    },
    trail: {
      effects: [
        { deviceId: 'tape-echo', preset: 'Long dark trail', params: { mix: 0.3 } },
        { deviceId: 'ambient-eq', preset: 'Warm' },
      ],
      words: ', with a long dark trail',
    },
    stars: {
      effects: [{ deviceId: 'constellation', preset: 'Scattered seven', params: { mix: 0.35 } }],
      words: ', its echoes strewn about',
    },
    stone: {
      effects: [{ deviceId: 'skipping-stone', preset: 'Skipping stone', params: { mix: 0.35 } }],
      words: ', echoing like a skipped stone',
    },
    prism: {
      effects: [{ deviceId: 'prism', preset: 'Low to high', params: { mix: 0.45 } }],
      words: ', unfolded from low to high',
    },
    canon: {
      effects: [{ deviceId: 'canon', preset: 'Octave shadow', params: { mix: 0.35 } }],
      words: ', followed by an octave shadow',
    },
    orbit: {
      effects: [{ deviceId: 'orbits', preset: 'Slow phasing', params: { mix: 0.35 } }],
      words: ', in loops that slip apart',
    },
    backwards: {
      effects: [{ deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.4 } }],
      words: ', with backward swells',
    },
    loop: {
      effects: [{ deviceId: 'tape-loop', preset: 'Two decks', params: { mix: 0.4 } }],
      words: ', caught on a long tape loop',
    },
    memory: {
      effects: [{ deviceId: 'echo-memory', preset: 'Recalling', params: { mix: 0.4 } }],
      words: ', with a memory of itself',
    },
    bed: {
      effects: [
        { deviceId: 'micro-looper', preset: 'Underwater', params: { mix: 0.35 } },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', over a murky loop of itself',
    },
    // Movement.
    ensemble: {
      effects: [{ deviceId: 'chorus', preset: 'Lush ensemble' }],
      words: ', thickened into an ensemble',
    },
    seasick: {
      effects: [
        { deviceId: 'chorus', preset: 'Deep sea' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.2 } },
      ],
      words: ', swaying heavily',
    },
    swirl: {
      effects: [{ deviceId: 'phaser', preset: 'Slow swirl' }],
      words: ', turning in a slow swirl',
    },
    jet: {
      effects: [{ deviceId: 'flanger', preset: 'Slow sweep' }],
      words: ', under a slow hollow sweep',
    },
    rotor: { effects: [{ deviceId: 'rotary', preset: 'Chorale' }], words: ', on slow rotors' },
    spin: {
      effects: [
        { deviceId: 'rotary', preset: 'Tremolo' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', on fast rotors',
    },
    shiver: {
      effects: [{ deviceId: 'tremolo', preset: 'Harmonic shimmer' }],
      words: ', with a shiver between low and high',
    },
    pan: {
      effects: [
        { deviceId: 'tremolo', preset: 'Slow pan' },
        { deviceId: 'plate-reverb', preset: 'Dark plate', params: { mix: 0.2 } },
      ],
      words: ', drifting from side to side',
    },
    glacial: {
      effects: [{ deviceId: 'auto-filter', preset: 'Glacial low-pass' }],
      words: ', under a filter that barely moves',
    },
    lowpass: {
      effects: [{ deviceId: 'auto-filter', preset: 'Low-pass gate' }],
      words: ', opened by its own strikes',
    },
    notch: {
      effects: [
        { deviceId: 'auto-filter', preset: 'Slow notch' },
        { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', with a notch wandering through',
    },
    water: {
      effects: [{ deviceId: 'currents', preset: 'Slow water' }],
      words: ', its bands swelling like water',
    },
    light: {
      effects: [{ deviceId: 'glimmer', preset: 'Light on water' }],
      words: ', with glints moving over it',
    },
    circle: {
      effects: [{ deviceId: 'around', preset: 'Slow circle' }],
      words: ', going round the head slowly',
    },
    flock: {
      effects: [{ deviceId: 'murmuration', preset: 'Evening flock', params: { mix: 0.5 } }],
      words: ', as a flock',
    },
    lungs: {
      effects: [{ deviceId: 'breath', preset: 'Calm breath', params: { depth: 0.5 } }],
      words: ', rising and falling as in sleep',
    },
    vibrato: {
      effects: [
        { deviceId: 'late-vibrato', preset: 'Singer' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.22 } },
      ],
      words: ', with a late vibrato',
    },
    throb: {
      effects: [{ deviceId: 'pulses', preset: 'Soft throb' }],
      words: ', under two soft drifting gates',
    },
    // Pitch, grain and spectrum.
    organ: {
      effects: [{ deviceId: 'stops', preset: 'Flute stops', params: { mix: 0.5 } }],
      words: ', with flute stops drawn',
    },
    below: {
      effects: [{ deviceId: 'octaves', preset: 'Faint octave' }],
      words: ', with a faint octave added',
    },
    halfspeed: {
      effects: [
        { deviceId: 'half-speed', preset: 'Thin shadow' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', with a thin half speed shadow',
    },
    pad: {
      effects: [{ deviceId: 'pad-follower', preset: 'Slow swell', params: { mix: 0.45 } }],
      words: ', with strings swelling behind',
    },
    redraw: {
      effects: [{ deviceId: 'sine-shadow', preset: 'Long linger', params: { mix: 0.45 } }],
      words: ', with pure tones that linger',
    },
    metal: {
      effects: [{ deviceId: 'warp', preset: 'Soft chime', params: { mix: 0.6 } }],
      words: ', its partials stretched to a chime',
    },
    crystals: {
      effects: [{ deviceId: 'grain-delay', preset: 'Crystals', params: { mix: 0.25 } }],
      words: ', with grains that climb',
    },
    cloud: {
      effects: [{ deviceId: 'grain-cloud', preset: 'Soft cloud', params: { mix: 0.45 } }],
      words: ', in a soft cloud of grains',
    },
    sparks: {
      effects: [
        { deviceId: 'glints', preset: 'First light' },
        { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.18 } },
      ],
      words: ', throwing off a few sparks',
    },
    leaves: {
      effects: [{ deviceId: 'falling', preset: 'Falling leaves', params: { mix: 0.35 } }],
      words: ', with pieces that fall away',
    },
    tiles: {
      effects: [{ deviceId: 'cascade', preset: 'Slow tiles', params: { mix: 0.35 } }],
      words: ', restacked in slow tiles',
    },
    hanging: {
      effects: [{ deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.45 } }],
      words: ', left hanging as a mist',
    },
    hold: {
      effects: [{ deviceId: 'sustainer', preset: 'Slow strings', params: { mix: 0.4 } }],
      words: ', caught and held as slow strings',
    },
    frozen: {
      effects: [{ deviceId: 'sustainer', preset: 'Frozen moment', params: { mix: 0.4 } }],
      words: ', with a frozen moment under it',
    },
    stretch: {
      effects: [{ deviceId: 'stretch', preset: 'Slow cloud', params: { mix: 0.45 } }],
      words: ', stretched into a slow cloud',
    },
    melt: {
      effects: [{ deviceId: 'melt', preset: 'Slow melt', params: { mix: 0.45 } }],
      words: ', its tail melting',
    },
    dissolve: {
      effects: [{ deviceId: 'generations', preset: 'Slow dissolve', params: { mix: 0.45 } }],
      words: ', dissolving into its room',
    },
    drift: {
      effects: [{ deviceId: 'spectral-drifter', preset: 'Detune cloud', params: { mix: 0.4 } }],
      words: ', in a cloud a little out of tune',
    },
    strings: {
      effects: [{ deviceId: 'sympathetic', preset: 'Piano pedal', params: { mix: 0.35 } }],
      words: ', with strings ringing along',
    },
    bowls: {
      effects: [{ deviceId: 'bowls', preset: 'Faint halo' }],
      words: ', with bowls that answer faintly',
    },
    keys: {
      effects: [{ deviceId: 'silent-keys', preset: 'Short answer' }],
      words: ', waking silent strings',
    },
    under: {
      effects: [{ deviceId: 'underwater', preset: 'Just under' }],
      words: ', just under the water',
    },
    rain: {
      effects: [
        { deviceId: 'weather', preset: 'Light rain' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.18 } },
      ],
      words: ', out in light rain',
    },
    clouds: {
      effects: [{ deviceId: 'weather', preset: 'Passing clouds' }],
      words: ', with clouds passing over',
    },
    year: {
      effects: [{ deviceId: 'seasons', preset: 'First frost' }],
      words: ', at the first frost',
    },
    vowel: {
      effects: [
        { deviceId: 'imprint', preset: 'Round vowel' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', shaped to a round vowel',
    },
    overtone: {
      effects: [{ deviceId: 'overtone-singer', preset: 'Faint melody' }],
      words: ', with a faint overtone melody',
    },
    moving: {
      effects: [
        { deviceId: 'freq-shifter', preset: 'Still water' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', shifted a hair, beating slowly',
    },
    reveal: {
      effects: [
        { deviceId: 'reveal', preset: 'Breath' },
        { deviceId: 'ambient-eq', preset: 'Voice' },
      ],
      words: ', its breath brought forward',
    },
    giant: {
      effects: [
        { deviceId: 'size', preset: 'Larger' },
        { deviceId: 'hall-reverb', preset: 'Room', params: { mix: 0.2 } },
      ],
      words: ', in a larger body',
    },
  },
  phrases: {
    // Chords that come in by voices and stay.
    entering: {
      notes: [
        { atSec: 0, durSec: 7, note: 50, gain: 0.75 },
        { atSec: 0.9, durSec: 6.1, note: 57, gain: 0.6 },
        { atSec: 1.8, durSec: 5.2, note: 65, gain: 0.6 },
        { atSec: 2.7, durSec: 4.3, note: 72, gain: 0.55 },
        { atSec: 3.6, durSec: 3.4, note: 76, gain: 0.5 },
      ],
    },
    triad: {
      notes: [
        { atSec: 0, durSec: 6.4, note: 48, gain: 0.75 },
        { atSec: 0, durSec: 6.4, note: 55, gain: 0.65 },
        { atSec: 0, durSec: 6.4, note: 64, gain: 0.65 },
        { atSec: 0, durSec: 6.4, note: 71, gain: 0.5 },
      ],
    },
    turning: {
      notes: [
        { atSec: 0, durSec: 3.4, note: 50, gain: 0.7 },
        { atSec: 0, durSec: 3.4, note: 60, gain: 0.6 },
        { atSec: 0, durSec: 7, note: 65, gain: 0.6 },
        { atSec: 0, durSec: 3.4, note: 69, gain: 0.55 },
        { atSec: 3.5, durSec: 3.5, note: 43, gain: 0.7 },
        { atSec: 3.5, durSec: 3.5, note: 59, gain: 0.6 },
        { atSec: 3.5, durSec: 3.5, note: 69, gain: 0.5 },
      ],
    },
    fourths: {
      notes: [
        { atSec: 0, durSec: 6.6, note: 52, gain: 0.7 },
        { atSec: 0.4, durSec: 6.2, note: 57, gain: 0.6 },
        { atSec: 0.8, durSec: 5.8, note: 62, gain: 0.6 },
        { atSec: 1.2, durSec: 5.4, note: 67, gain: 0.55 },
        { atSec: 3.2, durSec: 3.4, note: 72, gain: 0.5 },
      ],
    },
    stack: {
      notes: [
        { atSec: 0, durSec: 7, note: 36, gain: 0.7 },
        { atSec: 1, durSec: 6, note: 43, gain: 0.6 },
        { atSec: 2, durSec: 5, note: 50, gain: 0.55 },
        { atSec: 3, durSec: 4, note: 57, gain: 0.5 },
        { atSec: 4, durSec: 3, note: 64, gain: 0.5 },
      ],
    },
    sevenths: {
      notes: [
        { atSec: 0, durSec: 6.6, note: 43, gain: 0.7 },
        { atSec: 0.6, durSec: 6, note: 50, gain: 0.6 },
        { atSec: 1.2, durSec: 5.4, note: 59, gain: 0.6 },
        { atSec: 1.8, durSec: 4.8, note: 65, gain: 0.6 },
      ],
    },
    // Voices that move against each other.
    suspended: {
      notes: [
        { atSec: 0, durSec: 3.2, note: 45, gain: 0.7 },
        { atSec: 0, durSec: 4.8, note: 64, gain: 0.55 },
        { atSec: 0, durSec: 2.2, note: 71, gain: 0.6 },
        { atSec: 2.2, durSec: 2.5, note: 69, gain: 0.5 },
        { atSec: 3.3, durSec: 3.7, note: 41, gain: 0.7 },
        { atSec: 4.8, durSec: 2.2, note: 62, gain: 0.5 },
        { atSec: 4.8, durSec: 2.2, note: 69, gain: 0.5 },
      ],
    },
    contrary: {
      notes: [
        { atSec: 0, durSec: 1.7, note: 69, gain: 0.65 },
        { atSec: 0, durSec: 1.7, note: 50, gain: 0.65 },
        { atSec: 1.7, durSec: 1.7, note: 67, gain: 0.55 },
        { atSec: 1.7, durSec: 1.7, note: 52, gain: 0.6 },
        { atSec: 3.4, durSec: 1.5, note: 65, gain: 0.6 },
        { atSec: 3.4, durSec: 1.5, note: 57, gain: 0.55 },
        { atSec: 4.9, durSec: 2.2, note: 67, gain: 0.6 },
        { atSec: 4.9, durSec: 2.2, note: 55, gain: 0.6 },
      ],
    },
    round: {
      notes: [
        { atSec: 0, durSec: 1.4, note: 69, gain: 0.65 },
        { atSec: 1.4, durSec: 1.4, note: 72, gain: 0.6 },
        { atSec: 2.8, durSec: 1.4, note: 76, gain: 0.6 },
        { atSec: 4.2, durSec: 2.8, note: 67, gain: 0.55 },
        { atSec: 1.4, durSec: 1.4, note: 57, gain: 0.65 },
        { atSec: 2.8, durSec: 1.4, note: 60, gain: 0.6 },
        { atSec: 4.2, durSec: 1.4, note: 64, gain: 0.6 },
        { atSec: 5.6, durSec: 1.4, note: 55, gain: 0.6 },
      ],
    },
    sixths: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 76, gain: 0.6 },
        { atSec: 0, durSec: 1.6, note: 67, gain: 0.55 },
        { atSec: 1.6, durSec: 1.6, note: 74, gain: 0.6 },
        { atSec: 1.6, durSec: 1.6, note: 65, gain: 0.55 },
        { atSec: 3.2, durSec: 1.6, note: 72, gain: 0.55 },
        { atSec: 3.2, durSec: 1.6, note: 64, gain: 0.5 },
        { atSec: 4.8, durSec: 2.4, note: 71, gain: 0.5 },
        { atSec: 4.8, durSec: 2.4, note: 62, gain: 0.5 },
      ],
    },
    pedal: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 45, gain: 0.7 },
        { atSec: 0.6, durSec: 2, note: 64, gain: 0.55 },
        { atSec: 2.6, durSec: 1.4, note: 67, gain: 0.55 },
        { atSec: 4, durSec: 1.2, note: 65, gain: 0.55 },
        { atSec: 5.2, durSec: 2, note: 60, gain: 0.5 },
      ],
    },
    asking: {
      notes: [
        { atSec: 0, durSec: 0.9, note: 72, gain: 0.7 },
        { atSec: 0.9, durSec: 1.2, note: 76, gain: 0.6 },
        { atSec: 2.4, durSec: 0.9, note: 55, gain: 0.65 },
        { atSec: 3.3, durSec: 1.4, note: 52, gain: 0.6 },
        { atSec: 5, durSec: 0.8, note: 74, gain: 0.55 },
        { atSec: 5.8, durSec: 1.6, note: 69, gain: 0.5 },
      ],
    },
    // One line, or one note.
    single: { notes: [{ atSec: 0, durSec: 6.8, note: 62, gain: 0.75 }] },
    wander: {
      notes: [
        { atSec: 0, durSec: 2.2, note: 62, gain: 0.7 },
        { atSec: 2, durSec: 1.4, note: 65, gain: 0.6 },
        { atSec: 3.2, durSec: 1.4, note: 64, gain: 0.6 },
        { atSec: 4.4, durSec: 2.8, note: 69, gain: 0.65 },
      ],
    },
    highline: {
      notes: [
        { atSec: 0, durSec: 2, note: 79, gain: 0.55 },
        { atSec: 1.8, durSec: 1.8, note: 77, gain: 0.5 },
        { atSec: 3.4, durSec: 1.2, note: 74, gain: 0.55 },
        { atSec: 4.6, durSec: 2.6, note: 72, gain: 0.5 },
      ],
    },
    knocks: {
      notes: [
        { atSec: 0, durSec: 1.6, note: 50, gain: 0.75 },
        { atSec: 1.7, durSec: 1.3, note: 57, gain: 0.6 },
        { atSec: 3.1, durSec: 1.6, note: 53, gain: 0.65 },
        { atSec: 4.8, durSec: 2.5, note: 48, gain: 0.7 },
      ],
    },
    broken: {
      notes: [
        { atSec: 0, durSec: 2.4, note: 52, gain: 0.7 },
        { atSec: 0.6, durSec: 2, note: 59, gain: 0.6 },
        { atSec: 1.2, durSec: 1.8, note: 64, gain: 0.6 },
        { atSec: 1.8, durSec: 1.6, note: 67, gain: 0.55 },
        { atSec: 3.4, durSec: 3.2, note: 45, gain: 0.7 },
        { atSec: 4, durSec: 2.6, note: 60, gain: 0.6 },
        { atSec: 4.6, durSec: 2.2, note: 64, gain: 0.55 },
        { atSec: 5.2, durSec: 2, note: 71, gain: 0.5 },
      ],
    },
    weave: {
      notes: [
        { atSec: 0, durSec: 7, note: 45, gain: 0.6 },
        { atSec: 0, durSec: 0.5, note: 64, gain: 0.6 },
        { atSec: 0.55, durSec: 0.5, note: 69, gain: 0.5 },
        { atSec: 1.1, durSec: 0.5, note: 62, gain: 0.55 },
        { atSec: 1.65, durSec: 0.5, note: 67, gain: 0.5 },
        { atSec: 2.2, durSec: 0.5, note: 64, gain: 0.6 },
        { atSec: 2.75, durSec: 0.5, note: 69, gain: 0.5 },
        { atSec: 3.3, durSec: 0.5, note: 60, gain: 0.55 },
        { atSec: 3.85, durSec: 0.5, note: 67, gain: 0.5 },
        { atSec: 4.4, durSec: 2.6, note: 64, gain: 0.55 },
      ],
    },
    // High.
    chimes: {
      notes: [
        { atSec: 0, durSec: 3, note: 76, gain: 0.65 },
        { atSec: 1.1, durSec: 2.6, note: 83, gain: 0.5 },
        { atSec: 2.5, durSec: 2.3, note: 79, gain: 0.6 },
        { atSec: 3.4, durSec: 1.6, note: 88, gain: 0.4 },
        { atSec: 5, durSec: 2.2, note: 72, gain: 0.6 },
      ],
    },
    pairs: {
      notes: [
        { atSec: 0, durSec: 1.9, note: 67, gain: 0.6 },
        { atSec: 0, durSec: 1.9, note: 76, gain: 0.5 },
        { atSec: 2, durSec: 1.9, note: 65, gain: 0.6 },
        { atSec: 2, durSec: 1.9, note: 77, gain: 0.5 },
        { atSec: 4, durSec: 3.2, note: 60, gain: 0.6 },
        { atSec: 4, durSec: 3.2, note: 79, gain: 0.45 },
      ],
    },
    // Low.
    walk: {
      notes: [
        { atSec: 0, durSec: 1.5, note: 38, gain: 0.75 },
        { atSec: 1.6, durSec: 0.7, note: 36, gain: 0.65 },
        { atSec: 2.4, durSec: 1.5, note: 33, gain: 0.7 },
        { atSec: 4, durSec: 0.7, note: 35, gain: 0.6 },
        { atSec: 4.8, durSec: 2.3, note: 31, gain: 0.7 },
      ],
    },
    depth: {
      notes: [
        { atSec: 0, durSec: 7.2, note: 33, gain: 0.75 },
        { atSec: 2.6, durSec: 4.6, note: 40, gain: 0.55 },
      ],
    },
    lowcall: {
      notes: [
        { atSec: 0, durSec: 0.5, note: 36, gain: 0.75 },
        { atSec: 0.8, durSec: 0.5, note: 43, gain: 0.6 },
        { atSec: 1.6, durSec: 1.6, note: 41, gain: 0.7 },
        { atSec: 3.6, durSec: 0.5, note: 40, gain: 0.65 },
        { atSec: 4.4, durSec: 2.6, note: 33, gain: 0.75 },
      ],
    },
    twelfths: {
      notes: [
        { atSec: 0, durSec: 3.4, note: 38, gain: 0.7 },
        { atSec: 0, durSec: 3.4, note: 57, gain: 0.45 },
        { atSec: 3.5, durSec: 3.6, note: 31, gain: 0.7 },
        { atSec: 3.5, durSec: 3.6, note: 59, gain: 0.45 },
      ],
    },
  },
  directions: [
    {
      id: 'pattering-pads',
      name: 'Pattering pads',
      category: 'pad',
      rows: `
Eaves after supper | Pattering pad | slowness=6.5 quicken=9 rhythm=.7 bloom=.5 pulseWidth=.9 damping=.1 lower=.7 tone=.5 attack=1 width=.5 touch=.4 slowAgain=.6 accent=0 ratios=1 | warm | entering | Soft dark drops on ringing wood patter for nine seconds and run together
Shed roof in April | Pattering pad | slowness=4.5 quicken=4 rhythm=.85 pulseWidth=.2 damping=.75 tone=.45 attack=.1 touch=.35 slowAgain=.9 lower=0 accent=.1 stagger=.9 agree=.8 ratios=1 | rain | triad | Short hard drops rattle on dry wood before the chord stands
Gutters all night | Pattering pad | slowness=8 quicken=18 rhythm=.9 stagger=.8 lower=.7 release=9 damping=.1 touch=.5 slowAgain=.9 accent=0 agree=.5 pulseWidth=.2 tone=.4 | darkhall | turning | Slow drops fall in turn on ringing wood with the octaves below let in
Barn with the doors open | Pattering pad | slowness=5.5 quicken=2 rhythm=.35 bloom=.05 attack=1.19 width=1 tone=.95 pulseWidth=.9 volume=-12.5 touch=.5 slowAgain=.3 lower=.6 accent=.45 agree=.8 ratios=3 | open | suspended | A dark wide swell of wood with drops hidden in it
Doorstep in a shower | Pattering pad | slowness=3.2 quicken=14 rhythm=1 tone=.25 bloom=.9 damping=.55 release=2 accent=.8 touch=.35 slowAgain=.15 lower=.5 stagger=.3 agree=.2 ratios=1 | booth | entering | Fast drops on wood purr loudly and leave only a little tone
Greenhouse at first rain | Pattering pad | body=Glass slowness=6 quicken=6 damping=.15 pulseWidth=.6 attack=.5 release=7 touch=.4 slowAgain=.4 lower=.35 accent=.8 stagger=.9 agree=.1 bloom=.1 | veil | entering | Round drops on ringing glass that gather into a pad
Panes in a west wind | Pattering pad | body=Glass slowness=4 quicken=3 pulseWidth=.1 damping=.7 rhythm=.8 lift=.6 tone=.4 volume=-1 attack=.43 touch=.2 slowAgain=.3 accent=.6 agree=0 ratios=1 | flutter | round | Thin quick drops on damped glass lift a small bright chord
Empty conservatory | Pattering pad | body=Glass slowness=9 quicken=25 rhythm=.9 bloom=.8 release=14 damping=.05 tone=.6 width=.3 volume=2 touch=.4 slowAgain=.6 lower=.05 accent=.55 agree=.5 ratios=3 | nave | single | Single drops on glass seconds apart, half a minute from joining
Beads along a wire | Pattering pad | body=Glass slowness=5 quicken=1.2 rhythm=.3 bloom=.2 attack=.02 lower=.6 release=3 pulseWidth=.35 slowAgain=.8 accent=.2 agree=.1 | stars | round | Glass drops that quicken at once and leave a darkened ring | bell
Frost on the cold frame | Pattering pad | body=Glass slowness=7 ratios=5 agree=.2 quicken=12 stagger=.5 tone=.9 bloom=0 attack=.99 width=1 pulseWidth=.8 touch=.5 slowAgain=.4 lower=.05 | year | triad | A soft glass swell in loosely drawn elevens whose drops never agree
Owls along the hedge | Pattering pad | body=Air slowness=6 quicken=5 damping=.2 pulseWidth=.85 attack=.32 lift=.5 volume=2 touch=.8 slowAgain=.1 lower=.45 accent=.25 agree=0 | valley | wander | Hollow drops in a column of air, round and dark, that quicken to a hoot | wind
Bottles on a garden wall | Pattering pad | body=Air slowness=4.5 quicken=8 damping=.05 rhythm=.9 tone=.3 pulseWidth=.25 release=1.5 volume=-3.5 touch=.5 slowAgain=.8 lower=.4 stagger=.2 | jar | fourths | Ringing pops of air with little tone, a flutter that takes eight seconds
Steam off the hayfield | Pattering pad | body=Air quicken=20 slowness=7.5 bloom=.1 attack=.92 release=10 tone=1 rhythm=.1 width=.9 volume=-7.5 touch=.2 slowAgain=.9 lower=.45 agree=.3 ratios=4 | mist | entering | A five second swell of hollow tone with its drops almost out of hearing
Vents under the street | Pattering pad | body=Air slowness=3 quicken=10 lower=1 rhythm=.75 lift=.8 damping=.6 pulseWidth=.6 touch=.4 slowAgain=.6 accent=.1 stagger=.6 agree=0 ratios=1 | tunnel | stack | A hollow purr of fast drops beats inside a low chord, the octaves below kept
Sigh of the weir | Pattering pad | body=Air path=There_and_back slowness=5 quicken=7 bloom=.7 lift=.3 attack=.76 stagger=1 release=5 volume=-6 touch=.5 slowAgain=.9 lower=.75 agree=.4 ratios=4 | water | turning | Hollow drops that join and part again every seven seconds, key after key
Tent in soft rain | Pattering pad | body=Skin slowness=6 quicken=7 damping=.3 pulseWidth=.8 rhythm=.6 width=.9 volume=-3 slowAgain=.4 lower=.55 accent=.7 agree=.2 ratios=3 | near | triad | Soft drops on a slack skin run together into a deep warm chord
Long barn at dusk | Pattering pad | body=Skin slowness=9 quicken=15 lower=1 rhythm=1 damping=.7 release=8 tone=.6 volume=5 pulseWidth=.35 touch=.5 slowAgain=.8 accent=.25 stagger=.75 agree=.6 attack=.2 lift=.9 | outdoors | stack | Rare drops on skin lift a chord with both lower octaves under it
Umbrella on the pier | Pattering pad | body=Skin slowness=4 quicken=2.5 damping=.85 pulseWidth=.15 rhythm=.7 attack=.05 tone=.55 release=1 volume=2.5 touch=.7 slowAgain=.25 lower=.05 accent=.7 agree=.8 | thin | broken | Tight hard drops on a damped skin that fuse in two and a half seconds | keys
Canvas breathing | Pattering pad | body=Skin slowness=5.5 quicken=4 lift=1 rhythm=.2 bloom=.15 attack=4.5 width=1 pulseWidth=.65 volume=-3 touch=.2 slowAgain=.15 lower=.15 accent=.8 | lungs | entering | The chord comes only as each drop on the skin lifts it
Awnings let down | Pattering pad | body=Skin path=Slowing slowness=8 quicken=11 bloom=.6 rhythm=.5 slowAgain=1 release=12 touch=.2 lower=.9 stagger=.2 agree=.4 attack=3.5 | crypt | suspended | A chord on skin that begins whole and slows for eleven seconds to drops
Rain across the estuary | - | body=Air slowness=6 quicken=10 attack=1.24 bloom=.4 tone=.9 rhythm=.5 pulseWidth=.75 release=6 width=1 volume=-3.5 touch=.4 slowAgain=.7 lower=.9 accent=0 stagger=.1 agree=.4 ratios=1 | far | turning | Taps in a wide column of air quicken for ten seconds under a slow swell
Stooks in a row | - | body=Air slowness=5 quicken=3 attack=.5 bloom=.8 rhythm=.7 damping=.1 stagger=.9 tone=.5 volume=-1.5 slowAgain=.4 lower=.4 agree=0 | stone | round | Open taps of air fall one key after the next and then bloom at once
Lamplighter's towpath | - | body=Air slowness=8.5 quicken=6 attack=1.24 bloom=0 lower=.8 tone=.8 rhythm=.15 release=9 volume=-4 touch=.35 slowAgain=.15 accent=0 agree=.6 | glacial | turning | A dark hollow swell with slow taps far beneath it
Curlews over mud | - | body=Air slowness=4 quicken=1.5 attack=.2 pulseWidth=.05 damping=.4 rhythm=.6 lift=.7 ratios=4 touch=.8 slowAgain=.1 lower=0 accent=.8 agree=.5 volume=-1 | dotted | highline | Narrow taps in air that flutter up to a piping tone in a second and a half | wind
Marsh lights | - | body=Air path=There_and_back slowness=7 quicken=12 attack=1.24 bloom=.9 rhythm=.4 pulseWidth=.4 lift=.15 width=.7 release=5 volume=0.5 touch=.35 slowAgain=.8 lower=.6 accent=.25 | circle | entering | Hollow taps quicken for six seconds and slow for six, over and over
Harp under the trees | - | pulse=Pluck body=Glass slowness=5.5 quicken=6 attack=.6 rhythm=.5 damping=.2 release=6 tone=.6 width=1 volume=3.5 slowAgain=.3 lower=.5 accent=.8 stagger=.1 agree=0 ratios=4 | plate | entering | Plucked glass sprays out of each key and gathers for six seconds
Hail on the cloches | - | pulse=Pluck body=Glass slowness=3.5 quicken=15 rhythm=.9 tone=.2 damping=.8 pulseWidth=.2 bloom=.5 touch=.3 slowAgain=.9 lower=.15 accent=.6 agree=.7 ratios=3 | hiss | triad | Dry plucks on glass in a quick hail with hardly a tone beneath | texture
Silver in the drawer | - | pulse=Pluck body=Glass slowness=7 quicken=9 lift=.9 bloom=.2 attack=.3 pulseWidth=.7 damping=.3 ratios=1 volume=-0.5 touch=.3 slowAgain=.7 accent=.2 stagger=.3 | sheen | fourths | Each wide pluck on glass lifts its tone in plain threes
Dew running together | - | pulse=Breath body=Glass slowness=6.5 quicken=20 attack=.77 tone=.9 bloom=.6 rhythm=.2 release=12 lower=.4 width=.8 volume=1.5 touch=.3 slowAgain=.9 ratios=4 | climbing | single | A slow glass swell with faint breaths inside, twenty seconds from fusing
Wind in the bead curtain | - | pulse=Pluck body=Glass path=Steps slowness=6 quicken=3 stagger=1 rhythm=.4 damping=.7 accent=.9 release=2.5 volume=-9.5 pulseWidth=.9 tone=.95 lower=.8 touch=.7 slowAgain=.3 | swirl | weave | Plucked glass climbs octave by octave, each key a little after the last| plucked
Window that fogs over | Glass breathing | slowness=6 quicken=5 rhythm=.6 pulseWidth=.5 attack=.76 touch=.3 slowAgain=.15 accent=.7 | shell | turning | Breaths on glass that gather and thin out again every five seconds
Snow on skylights | Glass breathing | slowness=9 quicken=10 rhythm=.25 tone=1 attack=.4 bloom=.3 pulseWidth=.9 release=12 touch=.3 slowAgain=.6 lower=.1 stagger=.15 volume=-7 | hanging | entering | A very soft glass swell with breaths so slow they hardly count
Kettle in the back room | Glass breathing | slowness=4 quicken=1.5 rhythm=.8 tone=.4 pulseWidth=.1 damping=.6 attack=.1 release=2 volume=5 touch=.2 slowAgain=.6 accent=.25 agree=.85 | notch | contrary | Quick thin breaths on glass go there and back in a second and a half
Pond under ice | Glass breathing | slowness=7 quicken=8 lower=.9 damping=.1 lift=.7 bloom=.1 width=.5 tone=.75 volume=-6 pulseWidth=.6 attack=.3 touch=.2 slowAgain=.4 accent=.8 stagger=.15 ratios=1 | under | triad | Breath lifts a dark ringing glass chord with its lower octaves left in
Lanterns on the lake | Glass breathing | path=Glide slowness=5 quicken=12 stagger=.8 ratios=3 accent=.8 attack=.6 rhythm=.7 touch=.2 slowAgain=.8 lower=.6 | flock | sevenths | Breaths on glass in sevens, each key out of step, twelve seconds to a chord
Stairs in the rain | Pattering pad | path=Steps slowness=6 quicken=6 bloom=.8 damping=.2 rhythm=.65 attack=.3 slowAgain=.15 lower=.6 accent=.8 | room | entering | Drops on wood that double six times in six seconds and become the chord
Slates one by one | Pattering pad | path=Steps slowness=4 quicken=6 rhythm=.9 pulseWidth=.3 damping=.6 tone=.4 bloom=1 lower=.5 volume=-3.5 touch=.5 slowAgain=.3 accent=.8 agree=.6 ratios=3 | tile | fourths | Four long steps of hard drops, and the tone only with the last
Terraced paddies | Pattering pad | path=Steps slowness=8 quicken=3 bloom=.2 attack=1.68 rhythm=.3 width=1 release=7 pulseWidth=.85 slowAgain=.6 lower=0 accent=.8 | orbit | turning | A soft standing chord that drops climb under in eight small steps
Cellar filling up | Pattering pad | path=Steps slowness=5 quicken=10 lower=1 tone=.9 rhythm=.5 damping=.05 release=5 lift=.4 touch=.4 slowAgain=.3 accent=.45 stagger=.1 agree=.2 ratios=1 | pot | stack | Low drops on ringing wood double five times in ten seconds, the octaves under kept
Eleven o'clock thaw | Pattering pad | path=Steps ratios=5 stagger=.6 slowness=7 quicken=7 lift=.8 bloom=.4 accent=0 damping=.4 touch=.3 slowAgain=.6 | bowls | entering | Drops step up in elevens and lift the chord a key at a time
Tide through the reeds | Bowed tide | path=Glide slowness=5 quicken=8 attack=.76 rhythm=.5 release=6 volume=-2 touch=.8 slowAgain=.6 lower=.35 accent=.5 agree=.6 ratios=3 | pan | entering | Bow strokes in air draw together over eight seconds | string
Bellbuoy weather | Bowed tide | path=Glide slowness=8 quicken=4 rhythm=.7 lift=.8 bloom=.1 pulseWidth=.9 attack=.4 volume=-10.5 touch=.2 slowAgain=.8 lower=.45 accent=.5 agree=.85 | clouds | suspended | Slow wide bow strokes push a hollow chord up and let it sink
Marram grass | Bowed tide | path=Glide slowness=3.5 quicken=16 rhythm=.9 tone=.35 pulseWidth=.2 damping=.8 attack=.25 release=1.5 volume=-2.5 touch=.3 slowAgain=.9 lower=.5 accent=0 stagger=.5 agree=0 | paper | contrary | A dry rasp of quick bow strokes with the tone kept small | texture
Tacking upwind | Bowed tide | slowness=4.5 quicken=10 lower=.9 bloom=.8 tone=1 attack=.79 width=1 damping=.2 volume=0 touch=.35 slowAgain=.8 accent=0 stagger=.9 agree=.1 ratios=4 | ensemble | turning | Bowed air swells with its octaves below and turns every ten seconds
Harbour lights swaying | Bowed tide | slowness=7 quicken=5 stagger=.7 ratios=4 lift=.5 rhythm=.6 pulseWidth=.4 release=9 slowAgain=.8 lower=.5 accent=.5 | rotor | turning | Bowed air in nines, the keys swaying against one another every five seconds
Evening office | Tremolo hymn | body=Air slowness=6 lift=.7 rhythm=.15 attack=1.13 release=5 slowAgain=.6 lower=.9 accent=0 stagger=.2 agree=.4 volume=-5 | choirhall | triad | A hollow chord that pulses gently by itself with every tap
Swifts under the bridge | Tremolo hymn | slowness=4 lift=1 rhythm=.4 pulseWidth=.15 damping=.8 tone=.7 attack=.1 touch=.3 slowAgain=.3 lower=0 | spring | contrary | A quick bright wooden tremolo, the tone only where a tap falls
Sun through slats | Tremolo hymn | slowness=7 lift=.9 stagger=1 width=1 quicken=2 attack=.8 bloom=0 lower=.2 slowAgain=.8 | light | triad | Each key is lit in its turn as slow taps of wood raise it
Big wheel after dark | Tremolo hymn | body=Glass slowness=8 lift=.9 ratios=1 release=10 damping=.1 attack=1 tone=1 pulseWidth=.7 touch=.2 slowAgain=.8 accent=.5 rhythm=.3 | dissolve | entering | Glass tones rise and sink with each slow tap, tuned in plain threes
Tarpaulin tied down | Tremolo hymn | body=Skin slowness=5 lift=.8 lower=1 rhythm=.5 tone=.75 width=.2 attack=.3 release=1.6 touch=.4 slowAgain=.15 accent=.35 agree=.3 pulse=Breath | muffled | stack | A low skin chord throbs with each puff, its lower octaves kept
`,
    },
    {
      id: 'wooden-counters',
      name: 'Wooden counters',
      category: 'plucked',
      rows: `
Carpenter's abacus | Wooden five to four | slowness=6.5 quicken=1.2 damping=.6 pulseWidth=.3 accent=1 volume=-10.5 touch=.9 slowAgain=.2 | bare | triad | Dry taps on wood slow to a plain count, the meetings strongly marked
Gate on the latch | Wooden five to four | slowness=4.5 quicken=4 rhythm=.6 tone=.8 attack=.02 pulseWidth=.7 release=2.5 touch=1 slowAgain=0 lower=.9 accent=.1 agree=0 | chamber | broken | A round wooden tone that answers the hand and slows to a flutter in four seconds | keys
Clogs on the landing | Wooden five to four | slowness=8 quicken=2.5 rhythm=1 tone=.3 damping=.1 stagger=.9 width=1 volume=-4 touch=.85 slowAgain=.2 lower=0 accent=.2 agree=.4 | stairwell | entering | Ringing taps fall seconds apart, each key on its own foot
Dominoes after tea | Wooden five to four | slowness=5 quicken=.6 ratios=1 damping=1 tone=.2 pulseWidth=.1 release=.4 volume=-0.5 touch=.1 slowAgain=.2 lower=0 accent=.35 stagger=.75 | near | weave | Hard short knocks in threes, spent almost as soon as they fall | drum
Orchard ladder | Wooden five to four | slowness=7 quicken=8 tone=.95 rhythm=.5 bloom=.1 attack=.4 lift=.8 release=4 damping=.25 touch=.5 slowAgain=.15 lower=.55 accent=.1 stagger=.4 agree=.3 | warm | turning | A chord slows for eight seconds until taps of wood carry it | pad
Crate of oranges | Wooden five to four | pulse=Pluck slowness=5.5 quicken=2 tone=.7 pulseWidth=.6 stagger=.4 touch=.75 slowAgain=.65 lower=0 agree=.7 ratios=5 | box | broken | Round plucks on wood spread into a count after two seconds
Rake across the slats | Wooden five to four | pulse=Pluck slowness=3.5 quicken=5 rhythm=.8 damping=.7 pulseWidth=.15 tone=.5 lower=.8 volume=-8.5 touch=.9 accent=.25 stagger=.6 ratios=4 | spring | contrary | Bright plucks that slow only to a rough rattle, dark octaves underneath
Orange-box harp | Wooden five to four | pulse=Pluck slowness=7.5 quicken=1 ratios=5 agree=.5 damping=.2 release=5 tone=.8 rhythm=.6 touch=1 slowAgain=.65 lower=.15 | reel | entering | Half-drawn elevens plucked on ringing wood, never quite meeting
Fence by the railway | Wooden five to four | pulse=Pluck slowness=4 quicken=.5 stagger=1 rhythm=1 accent=0 tone=.35 pulseWidth=.4 damping=.5 release=1.2 touch=.85 slowAgain=.3 lower=.1 | stone | weave | Quick plucks of wood answer each other evenly, none of them stressed
Tea chest lid | Wooden five to four | pulse=Pluck slowness=9 quicken=3.5 tone=1 rhythm=.7 lower=1 bloom=.2 attack=.005 pulseWidth=.9 touch=.9 volume=-15.5 accent=.6 stagger=.1 agree=.4 | pot | broken | A dark plucked tone with both lower octaves, and one knock left over now and then
Shuttered arcade | Quickening chord | rhythm=.9 slowness=6 quicken=2 tone=.4 damping=.3 bloom=.6 stagger=.6 touch=.75 slowAgain=.95 lower=.6 ratios=4 | corridor | entering | Taps of wood quicken in two seconds and go on counting under a small tone
Hen house at dawn | Quickening chord | rhythm=1 slowness=7.5 quicken=.8 tone=.05 bloom=1 pulseWidth=.2 damping=.8 release=.8 volume=-0.5 touch=1 slowAgain=.9 lower=.05 accent=.25 | wide | weave | Dry pecks of wood with hardly a tone, in fours and fives | drum
Bookbinder's bench | Quickening chord | rhythm=.75 slowness=5 quicken=6 tone=.6 pulseWidth=.65 ratios=1 accent=.9 damping=.45 attack=.3 touch=.7 slowAgain=.65 stagger=.75 | room | fourths | Soft taps in threes hurry for six seconds into a plain chord
Croquet at noon | Quickening chord | rhythm=.85 slowness=8.5 quicken=3 tone=.5 damping=.05 release=6 width=.9 lift=.9 volume=-2 touch=.7 slowAgain=.3 lower=.1 accent=.7 agree=.1 ratios=1 | reversed | asking | Rare ringing taps of wood, each lighting its tone as it falls
Rolling pin | Quickening chord | rhythm=.6 slowness=3 quicken=12 tone=.7 lower=.6 pulseWidth=.8 bloom=.1 width=.2 attack=.1 touch=.7 slowAgain=.6 accent=.5 stagger=.15 agree=.8 ratios=1 | console | turning | A soft dark roll of taps that stays a roll for twelve seconds | keys
Log that answers | Wooden five to four | pulse=Drop slowness=6 quicken=3 tone=.7 damping=.15 pulseWidth=.7 attack=.02 touch=1 slowAgain=.8 lower=.6 agree=0 ratios=3 volume=-7.5 | tunnel | knocks | Round hollow drops on ringing wood that slow to a walk
Coconuts in a sack | Wooden five to four | pulse=Drop slowness=5 quicken=.7 rhythm=1 tone=.25 damping=.65 pulseWidth=.35 accent=.6 release=.6 volume=-2 touch=.85 slowAgain=.6 lower=.6 stagger=.75 width=.15 | middle | weave | Small hollow clops with a scrap of tone in each | drum
Canoe at the jetty | Wooden five to four | pulse=Drop slowness=7.5 quicken=5 lower=.9 tone=.85 stagger=.7 release=5 width=.8 touch=.9 slowAgain=.8 accent=.2 | water | suspended | Dark wooden drops slow for five seconds and lap against each other
Bamboo in the wet | Wooden five to four | pulse=Drop slowness=4.5 quicken=2 ratios=4 pulseWidth=.1 damping=.4 rhythm=.7 tone=.5 volume=-6.5 touch=.85 slowAgain=.1 lower=0 accent=.1 stagger=.75 | rain | sixths | Narrow drops in nines, a bright hollow flutter of wood
Pestle and bowl | Wooden five to four | pulse=Drop slowness=9 quicken=1.5 rhythm=.9 tone=.6 lift=1 bloom=.2 attack=.2 release=3 touch=.2 volume=-3 slowAgain=.8 lower=.55 accent=.1 stagger=.15 | cupboard | triad | The chord stirs only when a slow drop on wood strikes it
Drummer on the stairs | Wooden five to four | body=Skin slowness=6 quicken=1.5 tone=.4 damping=.35 volume=-4 touch=.9 slowAgain=.2 lower=.75 agree=.8 ratios=3 | room | knocks | Taps on skin slow to a hand drum's count in a second and a half | drum
Two kettles of rain | Wooden five to four | body=Skin slowness=7 quicken=4 damping=.05 tone=.65 pulseWidth=.75 release=4 stagger=.5 lower=.6 volume=-6.5 touch=.9 slowAgain=.2 accent=.1 agree=.7 ratios=1 | cave | twelfths | Soft deep taps ring long on a slack skin and slow for four seconds | drum
Fingertips on a drum | Wooden five to four | body=Skin slowness=4.5 quicken=.5 rhythm=.8 pulseWidth=.05 damping=.95 tone=.3 release=.5 width=.9 volume=-3 touch=.85 slowAgain=.2 lower=.05 accent=.45 ratios=1 | near | weave | Quick dry taps on a tight skin, hardly pitched | drum
Parade two streets off | Wooden five to four | body=Skin slowness=5.5 quicken=2 rhythm=1 tone=.2 accent=1 ratios=1 damping=.5 volume=-7.5 touch=1 slowAgain=.8 lower=0 | nextdoor | triad | Skins tapped in threes with every meeting of the keys marked | drum
Dancer's bare feet | Wooden five to four | body=Skin slowness=8 quicken=1 tone=.9 rhythm=.9 attack=.6 bloom=.1 release=2 lift=.3 touch=.7 slowAgain=0 lower=.75 accent=.5 stagger=.9 agree=.85 | tubes | turning | A warm skin chord with slow footfalls going on below | keys
Reeds in a bucket | Wooden five to four | body=Air slowness=6 quicken=2.5 tone=.6 damping=.3 pulseWidth=.4 volume=-6.5 touch=1 slowAgain=.2 lower=.55 accent=.55 agree=.85 ratios=5 | pipe | broken | Tubes struck and slowed, with a hollow note in each
Clappers over the field | Wooden five to four | body=Air slowness=5 quicken=.8 rhythm=1 tone=.35 damping=.6 pulseWidth=.2 stagger=1 release=.4 volume=-5.5 attack=.09 touch=.85 slowAgain=.6 lower=.45 accent=.7 agree=0 ratios=4 | dark | weave | Claps in air that take turns, with little tone | drum
Seven pipes of cane | Wooden five to four | body=Air slowness=7 quicken=6 ratios=3 tone=.85 rhythm=.6 damping=.1 release=5 attack=.3 touch=.8 lower=.6 | open | sevenths | Hollow tones in sevens slow for six seconds to separate taps | wind
Corks pulled in turn | Wooden five to four | body=Air slowness=8 quicken=1.2 rhythm=.9 tone=.4 pulseWidth=.6 damping=.2 stagger=.6 lift=.8 volume=3 attack=.1 touch=1 slowAgain=.2 lower=.55 accent=.55 ratios=1 | booth | broken | Slow hollow pops, key after key, each with its breath of tone
Quarry whistle | Wooden five to four | body=Air slowness=3.5 quicken=4 rhythm=.5 tone=1 pulseWidth=.8 lower=.4 attack=.05 touch=.9 damping=.7 slowAgain=.1 accent=.25 agree=.2 | flock | contrary | An open piped tone that slows to a flutter in four seconds | wind
Attic steps in socks | Octave stair keys | slowness=6 quicken=3 rhythm=.7 tone=.5 damping=.6 pulseWidth=.7 volume=-10.5 touch=1 slowAgain=.1 lower=.25 accent=.5 stagger=.5 agree=.2 | felt | broken | Soft plucks on wood double six times in three seconds before the tone
Ruler on the desk edge | Octave stair keys | slowness=4 quicken=.6 rhythm=.6 lower=.2 pulseWidth=.1 damping=.3 bloom=.3 release=1 touch=.7 slowAgain=.8 accent=.2 agree=0 | slap | asking | A hard plucked twang that doubles its way up in little more than half a second
Marble run | Octave stair keys | slowness=8 quicken=5 rhythm=.9 bloom=1 stagger=.6 tone=.6 damping=.45 volume=-10.5 slowAgain=.1 lower=.45 accent=.8 agree=0 | tiles | entering | Plucks of wood double again and again for five seconds and only then sing
Cabinet of drawers | Octave stair keys | slowness=5 quicken=8 rhythm=.8 tone=.4 ratios=1 lower=1 damping=.15 release=4 accent=.9 touch=.2 slowAgain=.95 stagger=.9 | chamber | pedal | Slow stairs of ringing plucks in threes, the low octaves left behind
Puppet on the sill | Octave stair keys | slowness=7 quicken=1 tone=.9 lift=.8 rhythm=.5 bloom=.1 attack=.15 pulseWidth=.4 width=1 volume=-9.5 touch=.9 slowAgain=.2 lower=.55 accent=.7 stagger=.9 ratios=1 | shiver | sixths | A wooden tone that jerks softly with every slow pluck
Corn crake | Wooden five to four | pulse=Bow_stroke slowness=5 quicken=2 damping=.6 pulseWidth=.3 tone=.45 volume=-1.5 attack=.1 touch=1 slowAgain=.3 lower=.9 accent=.45 agree=.8 ratios=4 | outdoors | knocks | Reedy rasps on wood slow to a creak in two seconds
Saw in wet pine | Wooden five to four | pulse=Bow_stroke slowness=3 quicken=3 rhythm=1 lower=1 tone=.6 damping=.8 pulseWidth=.5 release=1 volume=-6.5 touch=.85 slowAgain=.3 accent=.6 agree=.2 | combo | contrary | A rough low stroke that slows no further than a growl | string
Loose floorboard | Wooden five to four | pulse=Bow_stroke slowness=8 quicken=4 rhythm=.9 damping=.1 tone=.7 pulseWidth=.8 release=4 attack=.1 touch=.85 lower=0 stagger=.2 agree=0 ratios=1 | crypt | turning | Wide bow strokes on ringing wood come seconds apart | string
Grasshopper ditch | Wooden five to four | pulse=Bow_stroke slowness=4 quicken=.5 rhythm=.7 pulseWidth=.05 tone=.1 damping=.5 stagger=.9 ratios=5 width=1 volume=1 attack=.05 touch=.7 slowAgain=.3 | sparks | weave | Thin dry chirps of wood in elevens pass from key to key | texture
Cradle on bare boards | Wooden five to four | pulse=Bow_stroke slowness=7 quicken=10 tone=1 bloom=0 rhythm=.4 lift=.6 attack=.15 release=6 volume=-7.5 touch=.7 slowAgain=.4 lower=.6 accent=.7 agree=0 | strings | suspended | A bowed chord slows for ten seconds until it only rocks | string
Pendulum of birch | Wooden five to four | path=There_and_back slowness=6 quicken=4 bloom=.7 rhythm=.8 tone=.6 volume=-7.5 slowAgain=.65 lower=.5 | plate | entering | Taps of wood gather and scatter once in four seconds
Double rope in the yard | Wooden five to four | path=There_and_back slowness=5 quicken=1.2 rhythm=.9 damping=.7 tone=.35 pulseWidth=.2 release=.8 volume=-8 touch=.75 slowAgain=.95 stagger=.9 ratios=4 | cut | triad | Dry taps whirl up and fall apart every second or so
See-saw in the park | Wooden five to four | path=There_and_back slowness=7.5 quicken=6 stagger=.9 lower=.7 rhythm=.7 damping=.2 release=3 accent=.2 volume=-2.5 touch=.85 slowAgain=.8 agree=.6 | loop | turning | Ringing taps quicken and tire in turn on either side
Woodpecker and echo | Wooden five to four | path=There_and_back slowness=4 quicken=2.5 pulseWidth=.1 tone=.2 damping=.45 ratios=1 rhythm=1 bloom=.9 slowAgain=.2 lower=0 accent=.55 | heads | pedal | Hard fast taps in threes that swell into a tone and break off again
Rowing to the island | Wooden five to four | path=There_and_back slowness=8.5 quicken=8 tone=.95 rhythm=.6 bloom=.3 attack=1 release=6 lift=.6 volume=-4.5 touch=.4 slowAgain=.7 lower=.45 accent=.6 stagger=.2 agree=0 ratios=3 | lungs | turning | A slow dim chord that a few taps of wood hurry and then let rest | pad
Ship's timbers | Deep knocking | body=Wood slowness=7 quicken=5 tone=.5 damping=.1 volume=-5.5 touch=.7 slowAgain=.95 lower=.55 accent=.1 agree=.3 | below | twelfths | Low drops on ringing wood that slow for five seconds
Cask rolled over | Deep knocking | body=Wood slowness=4 quicken=2 rhythm=.8 pulseWidth=.9 damping=.6 release=1 slowAgain=.2 touch=.85 lower=.75 accent=.55 agree=0 ratios=3 width=.1 | iron | lowcall | A dark roll of drops on wood, heavy and close | bass
Mule on the bridge | Deep knocking | pulse=Pluck body=Wood slowness=6 quicken=1.5 lower=.5 stagger=.5 damping=.4 tone=.45 volume=-7 touch=.85 slowAgain=.5 | backwards | knocks | Low plucks on wood slow in a second and a half to a clop
Somebody upstairs | Deep knocking | pulse=Breath body=Wood slowness=8.5 quicken=3 tone=.35 pulseWidth=.2 damping=.3 rhythm=.9 volume=-3.5 touch=.1 slowAgain=.75 lower=.55 accent=.25 agree=.6 ratios=1 | muffled | entering | Puffs through wood, seconds apart, with a dim chord below | texture
Windlass let go | Deep knocking | body=Wood path=Glide slowness=9 quicken=7 bloom=.8 slowAgain=1 release=9 tone=.75 stagger=.4 volume=-5.5 touch=.75 lower=.3 agree=.1 | dissolve | fourths | Drops on wood gather for seven seconds and run down long after the hands lift
`,
    },
    {
      id: 'breath-engines',
      name: 'Breath engines',
      category: 'wind',
      rows: `
Pump house at night | Breath engine | slowness=6 quicken=4 rhythm=.7 damping=.3 lift=.7 touch=.75 slowAgain=.75 lower=0 accent=.8 stagger=.75 agree=0 | notch | turning | Puffs of air lift each tone as they hurry for four seconds
Sleeping dog | Breath engine | slowness=8.5 quicken=1.5 rhythm=.5 lift=1 attack=.15 pulseWidth=.8 release=2 tone=.6 damping=.7 touch=.65 slowAgain=.6 lower=.45 accent=.8 agree=.6 | warm | single | One slow soft breath after another lifts a small tone
Locomotive at rest | Breath engine | slowness=5 quicken=8 rhythm=1 lower=0 tone=.4 pulseWidth=.45 damping=.1 volume=-4 accent=1 width=.3 touch=.9 slowAgain=.1 stagger=.9 agree=.1 ratios=1 | tunnel | stack | Ringing puffs take eight seconds to gather in a low hollow chord
Windmill in mist | Breath engine | slowness=7 quicken=15 attack=.81 width=1 bloom=.6 lift=.3 release=8 tone=.95 volume=-2.5 touch=.5 slowAgain=.3 lower=.6 accent=.45 stagger=.2 agree=.3 ratios=1 | mist | pedal | A wide swell of air with slow puffs turning inside | pad
Bicycle pump | Breath engine | slowness=3.5 quicken=2 rhythm=.9 tone=.3 pulseWidth=.1 attack=.02 release=.6 lift=.2 damping=.85 volume=0 touch=.1 slowAgain=.6 lower=.5 stagger=.3 | near | contrary | Short dry puffs so fast that they flutter, little tone with them | texture
Harmonium in the barn | Breath engine | path=There_and_back slowness=6 quicken=5 bloom=.5 tone=.9 pulseWidth=.45 agree=.5 touch=.05 slowAgain=.2 lower=.3 accent=.25 | room | triad | Breaths in air come and go under an open chord every five seconds | organ
Accordion on the knee | Breath engine | path=There_and_back slowness=4.5 quicken=2.5 lower=.5 rhythm=.5 lift=.8 pulseWidth=.25 damping=.6 volume=1 touch=.9 slowAgain=.1 accent=.5 stagger=.1 | seasick | broken | Reedy air squeezed and let out every two and a half seconds | organ
Tide mill | Breath engine | path=There_and_back slowness=8 quicken=10 rhythm=.8 attack=.3 release=6 stagger=.8 damping=.1 touch=.5 slowAgain=.6 lower=.55 accent=.7 agree=.1 ratios=1 bloom=.1 | gate | stack | Breaths turn over slowly, each key at its own point in the round
Bilge pump | Breath engine | path=There_and_back slowness=3 quicken=7 lower=1 rhythm=.9 tone=.5 width=.3 pulseWidth=.55 volume=-1 touch=.3 slowAgain=.65 accent=.2 stagger=.1 ratios=1 | pipe | depth | A deep flutter of air that swells and thins | drone
Net blowing inward | Breath engine | path=There_and_back slowness=7 quicken=3 rhythm=.3 bloom=.9 attack=.76 tone=.8 width=1 pulseWidth=.9 release=5 volume=-4 touch=.2 slowAgain=.9 lower=.6 accent=.6 agree=.7 ratios=3 | light | entering | Very soft wide air that gathers and lets go every three seconds | pad
Whales passing | Breath engine | path=Slowing slowness=7 quicken=6 tone=.9 damping=.15 lift=.7 release=6 slowAgain=1 touch=.5 lower=.9 accent=.8 stagger=.15 agree=.5 ratios=3 | far | suspended | Air that sings first and slows for six seconds to long sighs | voice
Train pulling in | Breath engine | path=Slowing slowness=5 quicken=10 rhythm=.9 tone=.5 pulseWidth=.2 lower=.6 accent=1 volume=-4.5 touch=.8 attack=.06 | crumbs | stack | Puffs slow for ten seconds to a marked and heavy beat
Wind falling away | Breath engine | path=Slowing slowness=9 quicken=4 rhythm=.4 tone=1 attack=.2 bloom=.2 release=10 width=1 touch=.3 slowAgain=.3 lower=.55 accent=.1 stagger=.75 agree=0 body=Wood | clouds | turning | A wooden chord slows to breaths so far apart they are nearly lost | pad
Dragonfly resting | Breath engine | path=Slowing slowness=4 quicken=1.2 rhythm=.6 pulseWidth=.05 stagger=.5 damping=.4 release=1.2 ratios=4 volume=4.5 attack=.05 touch=.65 accent=.2 agree=.3 | sheen | highline | A thin whirr of air that slows to a flutter in a second
Last ferry home | Breath engine | path=Slowing ratios=1 slowness=6 quicken=2.5 rhythm=.7 lower=1 tone=.75 damping=.6 attack=.1 touch=.65 slowAgain=.6 accent=.5 stagger=.1 | dark | pedal | Low air in threes drops to a steady chug within three seconds
Sail loft | Breath engine | body=Wood slowness=6 quicken=3 lift=.5 tone=.8 pulseWidth=.6 touch=.8 slowAgain=.6 lower=.15 accent=.1 | box | wander | Breath through wood, warm and a little reedy, quickening in three seconds
Bellows mender | Breath engine | body=Wood slowness=4.5 quicken=6 rhythm=.9 damping=.8 tone=.4 pulseWidth=.2 attack=.05 release=1 volume=-1 slowAgain=.6 lower=.4 accent=.2 stagger=.9 agree=.6 ratios=1 | booth | broken | Close puffs of air on dry wood that will not settle for six seconds | texture
Organ loft in winter | Breath engine | body=Wood slowness=8 quicken=12 attack=.25 tone=1 lower=.9 release=7 rhythm=.25 bloom=.15 volume=-10 touch=.05 slowAgain=.2 accent=.45 stagger=.1 agree=.8 ratios=3 | nave | triad | A wooden organ tone with its lower octaves and only a ghost of breath | organ
Chest of old flutes | Breath engine | body=Wood path=Steps slowness=5 quicken=2 rhythm=.5 bloom=.8 damping=.35 pulseWidth=.35 lift=.2 touch=.9 accent=.8 agree=.4 | double | contrary | Breath through wood rises to its tone in five steps of an octave
Woodsmoke | Breath engine | body=Wood slowness=7 quicken=5 ratios=3 stagger=.9 lift=.9 width=1 pulseWidth=.85 attack=.2 tone=.65 release=4 touch=.5 slowAgain=.6 lower=.15 bloom=.1 | veil | sevenths | Soft breaths in sevens lift one key and then another
Glassblower | Breath engine | body=Glass slowness=6 quicken=4 damping=.2 attack=.5 release=5 volume=-4 touch=.75 accent=.8 stagger=.9 agree=0 ratios=1 | jar | entering | Breath sets glass ringing and quickens until it hums
Cold pane, warm breath | Breath engine | body=Glass slowness=8 quicken=2 rhythm=.8 pulseWidth=.7 lift=1 damping=.5 tone=.5 attack=.3 touch=.75 slowAgain=.75 lower=.75 accent=.1 agree=.1 ratios=1 | frozen | single | Single slow breaths bloom and fade on glass
Lighthouse lens | Breath engine | body=Glass path=There_and_back slowness=5 quicken=9 rhythm=.4 tone=.9 width=1 damping=.1 release=9 volume=-1 pulseWidth=.25 touch=.35 slowAgain=.6 lower=0 accent=.25 stagger=.2 agree=.4 ratios=3 | circle | fourths | Breath and bright ringing glass trade places every nine seconds | pad
Siphon | Breath engine | body=Glass slowness=3.5 quicken=1 rhythm=1 pulseWidth=.1 damping=.75 tone=.25 release=.8 attack=.02 volume=4.5 touch=.5 slowAgain=.1 lower=0 accent=.1 agree=.85 | bare | asking | A hissing flutter on damped glass with hardly a tone | texture
Chandelier in a draught | Breath engine | body=Glass ratios=5 stagger=.6 slowness=5.5 quicken=14 rhythm=.6 pulseWidth=.3 lift=.4 accent=.9 release=6 volume=-1.5 slowAgain=.3 | bowls | round | Thin air over glass in elevens, the keys never in step | bell
Drumskin sail | Breath engine | body=Skin slowness=6 quicken=3 lower=.5 damping=.25 pulseWidth=.5 volume=0.5 attack=.9 touch=.65 slowAgain=.3 accent=.5 stagger=.1 | cave | stack | Puffs on a deep skin that swell into a soft low chord
Tent flap | Breath engine | body=Skin slowness=4 quicken=5 rhythm=1 tone=.3 damping=.8 pulseWidth=.15 release=.7 lift=.1 volume=1 touch=.75 slowAgain=.2 lower=.05 accent=.7 agree=.1 ratios=3 | wide | knocks | Quick slaps of air on loose skin, with barely a pitch | drum
Heart of the furnace | Breath engine | body=Skin slowness=7.5 quicken=8 lower=1 tone=.85 attack=1.5 rhythm=.5 release=5 width=.4 touch=.4 slowAgain=.2 accent=.6 stagger=.75 volume=-4 | glacial | depth | Slow breaths on skin feed a low dark tone | drone
Mother's coat | Breath engine | body=Skin path=Slowing slowness=8 quicken=5 tone=.9 bloom=.2 attack=.9 damping=.1 pulseWidth=.8 release=7 rhythm=.35 slowAgain=.6 accent=.6 stagger=.1 agree=0 | wool | turning | A soft deep chord slows for five seconds to a sleeper's breathing | pad
Hut of stretched hides | Breath engine | body=Skin path=Steps slowness=5 quicken=3 rhythm=.8 ratios=1 stagger=.7 accent=.8 tone=.6 damping=.4 volume=-1.5 touch=.75 slowAgain=.1 | tile | round | Breaths on skin in threes step up by octaves, the keys taking turns
Pipe under the hedge | - | pulse=Breath body=Air slowness=5 quicken=.8 tone=1 rhythm=.15 bloom=.1 attack=.15 pulseWidth=.7 release=1.2 lift=.2 touch=.9 slowAgain=.3 accent=.55 volume=-10 | valley | wander | A plain hollow pipe with a trace of flutter, quick to speak
Night heron | - | pulse=Breath body=Air slowness=6.5 quicken=2 tone=.75 rhythm=.6 pulseWidth=.2 attack=.08 lift=.6 damping=.1 touch=1 slowAgain=.9 release=3 lower=0 accent=.25 agree=.6 | trail | asking | A breathy call that hardens with the touch and runs down when let go
Reed beds in the heat | - | pulse=Breath body=Air ratios=4 slowness=4 quicken=20 tone=.6 rhythm=.5 bloom=.5 attack=.4 pulseWidth=.4 lower=.7 stagger=.3 volume=2 touch=.65 accent=0 | swirl | triad | A rough reedy flutter in nines that stays apart for twenty seconds
Monsoon flute | - | pulse=Tap body=Air slowness=7 quicken=5 tone=.9 rhythm=.3 attack=.2 bloom=.4 width=1 release=6 pulseWidth=.6 damping=.05 volume=-1 touch=.75 lower=0 accent=.8 agree=.2 ratios=3 lift=.8 | rain | highline | A ringing open pipe that each slow tap lifts
Bone whistle | - | pulse=Breath body=Air path=Steps slowness=3 quicken=1 tone=.55 rhythm=.35 pulseWidth=.05 damping=.6 attack=.01 release=.6 bloom=.5 volume=-1.5 touch=.65 accent=.25 ratios=1 width=0 | slap | highline | A thin bright pipe whose flutter doubles three times as it starts
Steam radiator | Grain drone | pulse=Breath body=Glass slowness=4 quicken=10 rhythm=.8 damping=.3 pulseWidth=.2 attack=.5 touch=.4 slowAgain=.3 lower=.05 accent=.55 | hiss | single | A bright rush of breath on glass that takes ten seconds to become a hum | texture
Engine room hymn | Grain drone | pulse=Breath slowness=2.5 quicken=20 tone=.85 rhythm=.5 width=.8 lift=.3 volume=-5 attack=.15 touch=0 slowAgain=.2 accent=.55 agree=0 | organ | triad | A wooden chord purrs with breath two and a half octaves down | organ
Generator at the fair | Grain drone | pulse=Breath body=Skin slowness=3.5 quicken=5 rhythm=1 damping=.4 tone=.5 pulseWidth=.35 width=.3 attack=.2 release=1.5 volume=3 touch=.25 lower=.55 accent=.1 stagger=.2 agree=.7 | notch | twelfths | A blunt low chug of air on skin that takes five seconds to smooth | drone
Idling bus | Grain drone | pulse=Breath body=Wood path=There_and_back slowness=4.5 quicken=6 rhythm=.7 lower=.8 pulseWidth=.7 attack=.3 accent=.8 volume=-9 touch=.4 ratios=3 | throb | stack | Soft puffs on wood speed up and idle again every six seconds | drone
Extractor over the hob | Grain drone | pulse=Breath body=Air slowness=1.5 quicken=30 rhythm=.6 tone=.9 pulseWidth=.15 damping=.8 lower=.4 width=1 release=2 attack=.74 touch=.3 accent=.5 stagger=.5 agree=.4 | shaded | fourths | Breath almost at pitch, a grainy steady rush of tone | drone
Choir of lungs | Winding down choir | path=Glide slowness=6 quicken=7 tone=.8 rhythm=.5 lift=.6 agree=.3 touch=.4 slowAgain=.7 lower=.3 stagger=.3 | choirhall | entering | Voices of air gather from puffs over seven seconds | voice
Old men on the bench | Winding down choir | slowness=5 quicken=3 rhythm=.6 pulseWidth=.6 lower=.8 attack=.15 release=2 damping=.7 touch=.3 slowAgain=.7 accent=.1 agree=.4 | cassette | contrary | Low breathy voices slow to a grumble in three seconds | voice
Asleep in the pews | Winding down choir | path=There_and_back slowness=8 quicken=12 tone=.95 rhythm=.3 attack=.76 bloom=.6 width=1 release=9 volume=-4 slowAgain=.7 lower=.15 accent=.45 agree=.2 | monks | turning | Voices of air rise and settle once in twelve seconds | voice
Whisper across a desk | Winding down choir | path=Glide slowness=4 quicken=1.5 rhythm=.9 tone=.25 pulseWidth=.1 damping=.4 attack=.03 release=.8 lift=.2 volume=-0.5 touch=.4 slowAgain=.7 lower=.45 accent=.5 | reveal | asking | Whispered puffs with a thread of tone, gone as soon as they are said | voice
Lullaby of vents | Winding down choir | path=Steps slowness=7 quicken=9 bloom=.6 tone=.7 stagger=.7 ratios=1 rhythm=.4 attack=.3 pulseWidth=.8 volume=-5 touch=.4 slowAgain=.7 lower=.75 accent=.8 | halfspeed | entering | Airy voices in threes step slowly up until they are whole | voice
Paper lantern | Solitary pulse | pulse=Breath body=Air slowness=9 quicken=1 tone=.7 lift=.7 damping=.3 attack=.76 release=5 volume=-8 touch=.3 slowAgain=.6 lower=0 accent=.55 agree=0 ratios=4 | open | single | One breath every second or two lights a soft hollow note | texture
Sleeper in the next bed | Solitary pulse | pulse=Breath body=Skin slowness=10 quicken=2 rhythm=.7 tone=.5 lower=.8 attack=.5 lift=.9 release=6 pulseWidth=.4 slowAgain=.75 accent=.7 stagger=.15 agree=.6 ratios=1 | nextdoor | twelfths | Breaths on skin so slow that the chord sinks between them | texture
Frost on the tongue | Solitary pulse | pulse=Breath slowness=8 quicken=.5 tone=.35 pulseWidth=.1 rhythm=1 damping=.05 release=10 attack=.3 ratios=4 touch=.9 slowAgain=.2 accent=.8 stagger=.1 agree=.1 volume=4.5 | year | chimes | Thin cold breaths leave glass ringing long after each | bell
Fog signal | Solitary pulse | pulse=Breath body=Air path=Slowing slowness=8.5 quicken=2.5 tone=.95 rhythm=.6 lower=1 attack=.1 release=4 bloom=.2 pulseWidth=.7 volume=-6 touch=.65 slowAgain=.3 accent=.45 ratios=1 | outdoors | depth | A deep hollow blast that slows away to single breaths
Cave mouth | Solitary pulse | pulse=Breath body=Wood path=There_and_back slowness=9 quicken=15 tone=.8 rhythm=.8 damping=.1 attack=.4 width=1 release=9 touch=.7 slowAgain=.6 lower=.35 accent=.6 stagger=.4 agree=.85 ratios=3 volume=-4.5 bloom=.1 | cistern | stack | Wooden air stirs, quickens and dies down over fifteen seconds | texture
`,
    },
    {
      id: 'counting-basses',
      name: 'Counting basses',
      category: 'bass',
      rows: `
Down to the coal | Bass that counts | slowness=6 quicken=1.5 rhythm=.6 pulseWidth=.6 damping=.15 touch=1 volume=-26 lower=.3 tone=1 slowAgain=.4 accent=.35 agree=.3 ratios=1 pulse=Drop | deep | walk | A round low tone on ringing skin with a drop that runs up into it
Freight yard | Bass that counts | slowness=6 quicken=.5 rhythm=1 accent=1 damping=.3 tone=.7 release=1.5 pulseWidth=.25 touch=.65 slowAgain=.1 lower=.05 | iron | lowcall | A hard low skin struck and counted, every fourth beat stressed
Sandbags | Bass that counts | slowness=3.5 quicken=3 rhythm=.4 tone=1 pulseWidth=.95 lower=.3 attack=.08 release=.5 touch=1 accent=.5 agree=0 ratios=1 width=0 | middle | - | A dull heavy tone that follows the hand and stops short
Boiler at four | Bass that counts | slowness=5.5 quicken=6 bloom=.8 rhythm=.9 damping=.15 lower=1 release=3 slowAgain=1 volume=-7 touch=.95 accent=.5 stagger=.6 ratios=1 | stack | depth | Beats on ringing skin take six seconds to become a deep tone
Barge at its mooring | Bass that counts | slowness=6 quicken=2 lift=.9 rhythm=.5 bloom=.5 attack=.3 pulseWidth=.4 width=.5 volume=-5.5 touch=.95 lower=.6 accent=.8 agree=.1 ratios=1 | water | walk | A skin bass nudged up by one slow tap after another
Upright in the corner | Bass that counts | pulse=Pluck body=Wood slowness=4 quicken=.5 rhythm=.3 tone=.95 damping=.4 pulseWidth=.6 release=.9 lower=.1 touch=1 volume=-16 slowAgain=0 accent=.45 agree=.5 ratios=1 width=.1 | firm | - | A plain plucked bass on wood with a brief rattle at its start
Rubber and oak | Bass that counts | pulse=Pluck body=Wood slowness=6 quicken=1.2 rhythm=.7 damping=.8 pulseWidth=.85 tone=.8 attack=.01 release=.4 touch=.9 lower=.55 ratios=1 width=.05 | console | lowcall | A dark short pluck with a dry tick left counting behind it
Wire under the bridge | Bass that counts | pulse=Pluck body=Wood path=Slowing slowness=5 quicken=2 rhythm=.6 pulseWidth=.15 lower=.8 lift=.5 release=2 touch=.75 accent=0 agree=0 ratios=1 | spring | walk | A bright plucked low string that slows to separate twangs | plucked
Cider press | Bass that counts | pulse=Pluck body=Wood slowness=7 quicken=4 rhythm=.9 damping=.1 lower=.6 bloom=.1 release=4 stagger=.3 touch=.75 slowAgain=.1 accent=.1 agree=.6 ratios=1 | box | depth | A deep pluck on ringing wood, and slow plucks that gather under it
Horse in the lane | Bass that counts | pulse=Pluck body=Wood path=There_and_back slowness=5 quicken=3 rhythm=.8 tone=.6 damping=.6 accent=.8 lower=.4 volume=-5.5 touch=.75 slowAgain=.4 stagger=.5 ratios=1 | slap | depth | Low plucks of wood break into a trot and drop out of it every three seconds
Well rope | Deep knocking | slowness=6 quicken=1.5 rhythm=.8 pulseWidth=.8 release=2 touch=.75 slowAgain=0 lower=.45 accent=.2 stagger=.6 agree=.6 ratios=3 width=.15 | crypt | depth | Soft drops on deep skin slow at once to a knock far down
Mooring stone | Deep knocking | slowness=4 quicken=4 tone=1 rhythm=.5 damping=.6 pulseWidth=.95 release=.8 lower=.6 volume=-25.5 touch=.95 slowAgain=.3 accent=.7 agree=.4 ratios=1 | deep | walk | A pure blunt low tone that settles to a throb over four seconds
Thunder over the pass | Deep knocking | slowness=9 quicken=3 damping=.05 pulseWidth=.6 release=9 attack=.4 bloom=.1 volume=-6.5 touch=.65 slowAgain=.2 lower=.45 accent=.6 stagger=.3 agree=.8 ratios=1 | valley | depth | Drops on a huge slack skin, rolling on after the tone slows away
Tap of the sounding line | Deep knocking | path=Glide slowness=7 quicken=2.5 bloom=.9 tone=.7 damping=.4 lower=.4 pulseWidth=.35 slowAgain=.3 volume=-4.5 touch=.85 accent=.25 agree=.4 ratios=1 width=.1 | bare | lowcall | Clear drops on skin that quicken before the note is whole
Lorry at the lights | Deep knocking | path=There_and_back slowness=5 quicken=2 rhythm=.7 lower=1 bloom=.4 lift=.6 release=1.2 damping=.7 volume=-6 touch=.85 slowAgain=.5 accent=.8 stagger=.75 | tubes | twelfths | A deep dark idle that speeds and slackens every two seconds
Bowed beam | Grain drone | slowness=4 quicken=2 attack=.26 release=1.5 rhythm=.5 lower=.6 damping=.4 touch=.9 agree=.5 slowAgain=.7 accent=.1 ratios=1 | chamber | walk | A bow drawn over low wood, grainy for two seconds and then smooth | string
Ploughing the headland | Grain drone | slowness=5.5 quicken=5 attack=.1 rhythm=1 tone=.5 pulseWidth=.25 damping=.8 release=.8 touch=.75 slowAgain=.4 lower=.6 accent=.45 agree=.2 ratios=1 | combo | lowcall | Coarse low bow strokes that drag themselves together
Keel on gravel | Grain drone | slowness=2.5 quicken=15 attack=.76 tone=.9 rhythm=.8 pulseWidth=.4 lower=.2 width=.7 touch=.1 agree=.7 ratios=1 | ensemble | depth | A low bowed purr two and a half octaves down that does not let go | drone
Old double doors | Grain drone | path=Slowing slowness=6 quicken=3 attack=.15 bloom=.2 damping=.15 lower=.9 release=4 slowAgain=1 touch=.85 accent=.55 agree=.2 ratios=1 | stairwell | walk | A bowed low tone that slows to long creaks of wood | string
Bullock cart | Grain drone | path=Steps slowness=5 quicken=1.5 attack=.05 rhythm=.7 lower=1 tone=.8 damping=.55 release=1 accent=.9 volume=-8 touch=.65 slowAgain=.3 agree=.8 | worn | - | Low strokes on wood double five times and become a heavy note
Pedal under the choir | Winding down choir | path=Glide slowness=4 quicken=1 tone=1 rhythm=.15 attack=.2 release=1.8 pulseWidth=.8 lower=.6 touch=.1 slowAgain=.1 agree=.6 width=.2 | darkhall | walk | A soft pedal of air with a breath or two at its start | organ
Foghorn rehearsal | Winding down choir | slowness=6 quicken=4 lower=1 attack=.1 release=3 rhythm=.5 damping=.1 lift=.7 volume=-7.5 touch=.65 slowAgain=.3 accent=.6 agree=.4 ratios=1 pulse=Bow_stroke | giant | depth | A wide low bowed horn of air that slows to single blasts | wind
Dragon under the hill | Winding down choir | path=There_and_back slowness=5 quicken=5 lower=.8 pulseWidth=.15 rhythm=.8 tone=.7 attack=.4 release=4 volume=-1.5 touch=.5 slowAgain=.3 accent=0 stagger=.15 agree=.85 | cave | depth | Rough low breath that comes to a growl and goes every five seconds
Jug band porch | Winding down choir | path=Glide slowness=5 quicken=.6 rhythm=.7 tone=.8 attack=.02 release=.4 damping=.7 pulseWidth=.4 touch=.9 slowAgain=.1 lower=.55 accent=.7 agree=.7 ratios=1 width=0 bloom=.1 | pot | lowcall | A short puff of low hollow air that stops at once
Sub-basement fan | Winding down choir | path=Glide body=Skin slowness=3 quicken=8 rhythm=.6 lower=1 tone=.75 attack=.6 release=2.5 width=.2 lift=.2 volume=-1.5 touch=.4 slowAgain=.65 accent=.7 stagger=.6 ratios=1 | shaded | twelfths | A low flutter of air on skin with both octaves below it | drone
Stairs to the crypt | Octave stair keys | body=Skin slowness=5 quicken=2 damping=.4 lower=.6 rhythm=.6 touch=.65 slowAgain=0 accent=.6 agree=0 | crypt | lowcall | Plucked skin doubles five times in two seconds on the way to a low note
Big tin bath | Octave stair keys | body=Skin slowness=3 quicken=.6 rhythm=.5 lower=1 pulseWidth=.35 damping=.2 release=1.5 touch=.65 slowAgain=0 accent=.5 agree=.8 width=.15 volume=-20.5 | reel | walk | A quick plucked growl that clears after three small steps
Rope ladder | Octave stair keys | body=Skin slowness=7 quicken=5 rhythm=.9 bloom=.9 damping=.7 tone=.7 release=1 touch=1 slowAgain=.1 agree=.8 ratios=1 | dotted | depth | Plucks on dry skin climb seven octaves before the low note is there
Goods lift | Octave stair keys | body=Skin slowness=4 quicken=4 lift=.8 bloom=.2 attack=.2 pulseWidth=.9 lower=.4 release=3 rhythm=.4 touch=.65 slowAgain=.3 accent=.8 agree=.5 ratios=1 | firm | twelfths | A dark standing bass lifted harder with each slow step
Anvil in the snow | Octave stair keys | body=Skin path=Slowing slowness=6 quicken=1 pulseWidth=.1 damping=.3 rhythm=.8 tone=.55 release=1 accent=.8 volume=-7 touch=.85 slowAgain=.2 lower=0 ratios=1 | tile | lowcall | A bright plucked skin that breaks up into slow hard beats | drum
Trestle table | Quickening chord | slowness=5 quicken=1 lower=.5 attack=.02 release=1 damping=.6 rhythm=.5 volume=-10.5 touch=.5 slowAgain=.4 agree=0 ratios=1 | warm | lowcall | A woody low tap that runs into its tone within a second
Wardrobe moved | Quickening chord | path=Slowing slowness=6 quicken=2.5 lower=.8 rhythm=.8 damping=.15 pulseWidth=.7 release=3 volume=1 touch=.75 slowAgain=.3 accent=.2 agree=0 ratios=1 | corridor | walk | A soft low wooden tone that slows to knocks on the floor
Duckboards | Quickening chord | slowness=4 quicken=.6 rhythm=.9 tone=.5 pulseWidth=.1 damping=.85 attack=.005 release=.3 touch=.8 slowAgain=0 lower=.05 accent=0 agree=.5 width=.1 | bare | - | Short hard low wood with more knock than note
Tree felled far off | Quickening chord | slowness=8 quicken=7 lower=1 rhythm=.6 tone=.9 bloom=.3 damping=.1 attack=1.2 release=8 touch=.85 slowAgain=.4 accent=.5 stagger=.4 agree=.1 ratios=1 | far | depth | A long low wooden swell with slow ringing knocks
Loading bay | Quickening chord | path=There_and_back slowness=5 quicken=1.5 rhythm=.6 lift=1 lower=.4 attack=.05 release=.8 damping=.45 accent=.1 touch=.95 slowAgain=0 stagger=.4 agree=.4 ratios=1 | throb | twelfths | Low wood that hurries and halts and takes the tone with it
Cracked church bell | Bells agreeing | slowness=5 quicken=2 lower=.8 damping=.3 tone=.8 release=3 width=.5 pulseWidth=.6 volume=-9 touch=.7 slowAgain=.8 accent=.45 agree=.4 | iron | depth | A low struck glass tone, dark, with the octaves below sounding on | bell
Bottle bank | Bells agreeing | slowness=6 quicken=.6 rhythm=.8 damping=.75 pulseWidth=.5 tone=.6 release=.6 attack=.01 touch=.95 slowAgain=.1 lower=.8 accent=.5 agree=.4 volume=1 | cupboard | lowcall | A short clank of low glass and a tick that keeps on
Submarine lamp | Bells agreeing | pulse=Drop slowness=7 quicken=3 tone=.95 rhythm=.5 attack=.15 damping=.1 release=5 width=.3 lower=.4 pulseWidth=.7 touch=.85 slowAgain=0 accent=.7 agree=.85 ratios=1 volume=-17 bloom=.1 | under | depth | A round low glass tone with slow pure drops
Harbour chain | Bells agreeing | pulse=Pluck path=Steps slowness=4 quicken=2 lower=1 rhythm=.7 damping=.45 tone=.7 release=2 accent=.4 volume=-8.5 pulseWidth=.85 touch=.85 slowAgain=.5 agree=.1 ratios=1 | heads | - | Plucked glass far down, four rough steps to a dark tone
Clapper wrapped in cloth | Bells agreeing | path=Slowing slowness=6.5 quicken=4 pulseWidth=.95 damping=.2 tone=.9 attack=.06 release=4 slowAgain=.8 rhythm=.4 touch=.95 lower=.6 accent=.7 agree=.2 ratios=1 volume=-9 | felt | depth | A dull deep glass note that slows over four seconds
Culvert | Bass that counts | body=Air slowness=5 quicken=2 damping=.2 rhythm=.6 lower=.5 width=.5 release=1.5 volume=-6 touch=.5 slowAgain=0 accent=.25 agree=0 ratios=3 | pipe | walk | Taps in a deep column of air, hollow and round
Drainpipe dance | Bass that counts | body=Air slowness=6 quicken=.6 rhythm=1 tone=.6 pulseWidth=.4 damping=.6 attack=.005 release=.4 volume=-4.5 touch=.95 accent=.35 | cut | lowcall | Short hollow thumps with a clear tap on each
Diving bell | Bass that counts | body=Air pulse=Drop slowness=6.5 quicken=3 tone=1 rhythm=.4 lower=1 attack=.1 damping=.05 release=5 touch=.65 slowAgain=.2 ratios=1 volume=-21.5 bloom=.1 | below | depth | A deep hollow tone, and a drop every second or so in the dark
Giant ventilator | Bass that counts | body=Air path=There_and_back slowness=4 quicken=4 rhythm=.7 lift=.7 pulseWidth=.6 lower=.8 release=2 attack=.15 touch=.5 slowAgain=0 accent=.5 agree=0 ratios=3 volume=-7.5 | tunnel | twelfths | Hollow low beats that run together and part every four seconds
Didgeridoo weather | Bass that counts | body=Air pulse=Bow_stroke slowness=3 quicken=10 rhythm=.6 tone=.9 damping=.3 lower=.3 attack=.2 release=1.5 lift=.4 touch=.5 slowAgain=.6 accent=.25 stagger=.2 agree=.7 volume=-7.5 | vowel | depth | A reedy hollow low bow note with a slow growl in it | wind
Peat cutter | Bowed tide | body=Skin path=Glide slowness=5 quicken=3 attack=.2 release=1.5 lower=.6 volume=-1.5 slowAgain=.4 accent=.55 agree=.6 | dark | walk | Bowed low skin, rough for three seconds and then plain | string
Frozen lake crossing | Bowed tide | body=Glass path=Slowing slowness=6 quicken=5 attack=.25 damping=.35 lower=.9 release=5 bloom=.2 pulseWidth=.8 tone=.9 touch=.75 slowAgain=.3 accent=.7 | nave | depth | A low glass tone under a wide bow, slowing to long strokes
Tugboat pair | Tremolo hymn | body=Skin slowness=4 lower=.5 lift=.9 release=1.5 attack=.15 damping=.5 rhythm=.5 pulse=Bow_stroke pulseWidth=.8 touch=.95 slowAgain=.2 accent=.1 stagger=.3 agree=0 | rotor | twelfths | A low skin tone that shakes with every quick wide bow stroke
Slow freight | Tremolo hymn | body=Air slowness=4.5 lift=1 lower=.7 rhythm=.6 attack=.2 pulseWidth=.65 release=2.5 accent=.9 volume=-11.5 touch=.5 slowAgain=.1 agree=.3 ratios=1 | trail | walk | A hollow bass that swells with each tap, every fourth the strongest
Night bus kneeling | Pattering pad | body=Skin slowness=5 quicken=4 attack=.1 lower=1 release=1.5 rhythm=.7 width=.25 pulseWidth=.5 touch=.65 slowAgain=.1 accent=.25 ratios=3 | lowpass | depth | Low drops on skin gather under a dark note
`,
    },
    {
      id: 'agreeing-bells',
      name: 'Agreeing bells',
      category: 'bell',
      rows: `
Across the rooftops | Bells agreeing | slowness=6.5 quicken=4 damping=.1 tone=.7 release=8 touch=.3 slowAgain=.6 lower=.6 pulseWidth=.6 | nave | pairs | Glass struck in two voices that are stressed wherever they meet
Goats on the ridge | Bells agreeing | slowness=5 quicken=1 ratios=4 agree=.3 damping=.55 rhythm=.9 tone=.3 pulseWidth=.15 release=1.5 stagger=.8 volume=-0.5 touch=.9 lower=.45 accent=.55 | outdoors | chimes | Small damped taps in loose nines, scattered by key
Cracked ice in a tumbler | Bells agreeing | slowness=4 quicken=2 damping=.7 pulseWidth=.05 rhythm=.7 tone=.4 release=.8 attack=.005 touch=.9 slowAgain=.8 lower=0 accent=.5 agree=.6 | sheen | round | Hard bright clinks in a rush, each ending soon
Sanctuary lamp | Bells agreeing | slowness=9 quicken=10 tone=.9 attack=1.5 pulseWidth=.8 release=12 rhythm=.35 lift=.8 touch=.35 slowAgain=.9 lower=.45 accent=.25 stagger=.15 agree=.2 | fifths | triad | A soft glass chord warmed by slow rounded taps | pad
Milk round | Bells agreeing | slowness=7.5 quicken=.6 rhythm=.8 damping=.3 accent=1 ratios=1 width=.4 release=3 tone=.5 touch=1 lower=.45 | tile | broken | Bottles tapped in threes, the meetings ringing out
Glass on the gatepost | Bells agreeing | path=Slowing slowness=6 quicken=2 tone=.8 damping=.2 release=4 pulseWidth=.4 touch=1 slowAgain=.1 lower=.45 accent=.35 stagger=.9 ratios=1 | stars | chimes | A glass note that breaks into taps two seconds after it is struck
Chandelier being lowered | Bells agreeing | path=Slowing slowness=8 quicken=6 stagger=.9 rhythm=.7 width=1 damping=.05 release=9 slowAgain=1 touch=.4 lower=.45 accent=.6 agree=.4 volume=-0.5 | melt | entering | Ringing glass slows over six seconds, every key on its own chain
Spoon against a cup | Bells agreeing | path=Slowing slowness=4.5 quicken=.5 rhythm=.6 tone=.3 damping=.8 pulseWidth=.2 release=.6 volume=0.5 lower=.6 accent=.8 agree=.2 width=.1 | near | asking | A short clink that trails off in a quick dry tremble
Curfew bell | Bells agreeing | path=Slowing slowness=7 quicken=3 lower=.9 tone=.9 damping=.3 attack=.05 release=6 pulseWidth=.65 ratios=1 touch=.8 slowAgain=.1 accent=.55 | valley | twelfths | A dark low glass stroke in threes that slows to tolling
Sleigh over the pass | Bells agreeing | path=Slowing slowness=3.5 quicken=3 rhythm=.9 tone=.45 pulseWidth=.1 damping=.45 lift=.6 release=2 volume=5 touch=.4 slowAgain=.3 accent=.55 | flock | chimes | Bright taps that thin out from a shimmer over three seconds
Drip in the font | Solitary pulse | slowness=10 quicken=2 tone=.5 damping=.1 pulseWidth=.3 attack=.05 release=9 touch=.7 slowAgain=.6 accent=.2 agree=.6 ratios=3 | darkhall | chimes | Clear drops on ringing glass, slow and far between
Bubbles in a flask | Solitary pulse | slowness=5 quicken=4 rhythm=.8 tone=.35 damping=.6 attack=.02 pulseWidth=.15 release=1.2 stagger=.6 slowAgain=.95 accent=0 | jar | round | Quick small drops on damped glass, key answering key
Moon in the rain barrel | Solitary pulse | slowness=9.5 quicken=8 tone=1 attack=.3 bloom=0 lift=.95 pulseWidth=.35 release=14 width=1 volume=-7 touch=.9 slowAgain=.6 lower=0 accent=.2 stagger=.2 agree=.7 damping=.05 rhythm=.7 | redraw | triad | A clear glass chord that each slow drop lights and lets fade
Temple steps | Solitary pulse | path=Steps slowness=7 quicken=5 bloom=.8 lower=.8 damping=.2 attack=.03 rhythm=.8 release=5 touch=.7 slowAgain=.1 accent=0 stagger=.75 ratios=5 | bowls | triad | Drops on glass double step by step into a dark ringing chord
Sonar toy | Solitary pulse | path=Slowing slowness=6 quicken=1 tone=.8 pulseWidth=.45 damping=.35 attack=.005 rhythm=.7 release=2.5 ratios=1 volume=-8 touch=.7 slowAgain=.2 lower=.9 agree=.3 | dark | asking | A pure ping that slows in one second to a few drops
Music from the pantry | Octave stair keys | body=Glass slowness=5 quicken=1 damping=.75 rhythm=.5 pulseWidth=1 release=2 touch=1 volume=-12 lower=1 slowAgain=.6 accent=.7 stagger=.2 | box | broken | Plucked glass that doubles up to its tone in a second
Beaded doorway | Octave stair keys | body=Glass slowness=7 quicken=4 rhythm=.9 stagger=1 tone=.5 damping=.2 width=1 bloom=.4 release=5 volume=-2.5 touch=.4 slowAgain=.3 lower=.05 accent=.2 agree=.6 | swirl | entering | Plucks on glass climb stair by stair, no two keys together
Spectacles on marble | Octave stair keys | body=Glass slowness=3 quicken=.5 pulseWidth=.05 damping=.75 tone=.4 rhythm=.6 release=.5 lower=.1 volume=-6.5 slowAgain=.95 accent=.6 agree=.7 ratios=3 | chamber | sixths | Tiny hard plucks of glass, three quick steps and done | plucked
Planets on wires | Octave stair keys | body=Glass slowness=8 quicken=9 bloom=1 ratios=5 tone=.8 attack=.4 release=10 lower=.4 pulseWidth=.7 volume=-9.5 touch=.9 slowAgain=.3 stagger=.5 | orbit | fourths | Slow plucked stairs in elevens under a tone that waits nine seconds
Till drawer at closing | Octave stair keys | body=Glass path=There_and_back slowness=5 quicken=2 damping=.8 rhythm=.7 accent=.9 pulseWidth=.8 lift=.5 release=1.5 touch=.9 volume=-6.5 slowAgain=.3 lower=.9 stagger=.5 agree=.6 | sampler | contrary | Plucked glass that jingles up and back down every two seconds
Marimba in the attic | Quickening chord | body=Wood slowness=6 quicken=1.5 damping=.2 attack=.005 pulseWidth=.6 rhythm=.5 release=2.5 tone=.6 touch=1 slowAgain=.6 lower=.35 accent=.2 agree=0 | hammers | broken | Soft struck bars of wood that roll into tone | keys
Balsa chimes | Quickening chord | body=Wood slowness=5 quicken=.6 rhythm=.8 damping=.35 pulseWidth=.15 tone=.4 release=1.5 stagger=.7 ratios=4 touch=.8 slowAgain=.6 lower=.15 accent=.5 | double | chimes | Light wooden chimes in nines, one after the other
Priory board | Quickening chord | body=Wood path=Slowing slowness=7.5 quicken=2 rhythm=1 tone=.5 accent=1 damping=.1 release=4 lower=.5 touch=.4 slowAgain=.95 ratios=3 | reversed | knocks | Ringing wood struck and left to count
Rain sticks in a row | Quickening chord | body=Wood slowness=4 quicken=10 rhythm=.9 tone=.2 damping=.55 pulseWidth=.05 stagger=.5 release=3 volume=-11.5 touch=.3 slowAgain=.6 lower=.15 accent=.55 agree=.3 | leaves | triad | Fast narrow ticks of wood that take ten seconds to join | texture
Gourd bells | Quickening chord | body=Wood slowness=6.5 quicken=3 lift=.9 rhythm=.6 damping=.05 tone=.8 release=6 pulseWidth=.75 bloom=.2 attack=.1 volume=-11.5 touch=.7 slowAgain=.1 accent=.55 stagger=.3 agree=.7 | rattle | triad | Round ringing wood, each tap waking its tone
Tubes on the porch | Elevens drifting | pulse=Tap slowness=6 quicken=3 agree=1 damping=.1 tone=.5 rhythm=.6 release=5 touch=.2 volume=0.5 slowAgain=.95 lower=.3 stagger=.75 | pan | chimes | Tubes of air tapped in exact elevens, ringing
Bamboo in two gardens | Elevens drifting | pulse=Tap slowness=7.5 quicken=1 agree=.1 ratios=3 damping=.4 stagger=.9 rhythm=.9 tone=.3 pulseWidth=.4 volume=5 touch=.5 slowAgain=.75 lower=.9 | keys | entering | Hollow taps whose count drifts and never comes back | texture
Wine glasses, half full | Elevens drifting | body=Glass slowness=5 quicken=6 agree=.4 lift=.7 tone=.8 pulseWidth=.9 damping=.15 release=7 ratios=5 volume=-7.5 lower=.5 touch=.9 slowAgain=.6 | light | fourths | Plucked glass in loose elevens with a sway between the keys
Spring on the sill | Elevens drifting | body=Glass slowness=4 quicken=1.5 agree=0 rhythm=.6 pulseWidth=.1 damping=.6 release=1.2 tone=.5 accent=0 volume=-2.5 touch=.7 slowAgain=.2 lower=0 stagger=.2 | spring | sixths | Bright tempered plucks of glass that patter off | plucked
Bells under snow | Elevens drifting | pulse=Drop body=Skin slowness=7 quicken=4 agree=.7 damping=.05 tone=.75 release=8 lower=.5 pulseWidth=.7 stagger=.2 touch=.7 slowAgain=.95 accent=.1 | wool | pairs | Deep round drops on ringing skin, half hidden
Bow on a wine glass | Bowed tide | body=Glass path=Glide slowness=5 quicken=6 attack=.5 damping=.75 release=8 tone=.7 pulseWidth=1 lower=1 touch=.7 slowAgain=.3 accent=.7 stagger=.2 agree=.8 | hall | triad | Glass under a slow bow, rough for six seconds and then clear | string
Rim of the bowl | Bowed tide | body=Glass slowness=7 quicken=8 attack=.35 lift=.6 pulseWidth=.9 width=.6 damping=.05 release=10 agree=.5 volume=0 touch=.35 slowAgain=.7 lower=.3 accent=.45 bloom=.2 | gate | entering | Ringing glass rubbed up and let down every eight seconds | pad
Cracked plate | Bowed tide | body=Glass path=Slowing slowness=4 quicken=2 rhythm=.8 pulseWidth=.35 damping=.85 tone=.4 attack=.02 release=1 volume=0.5 touch=.3 slowAgain=.1 lower=.9 accent=.45 agree=0 ratios=3 | sampler 1.mix=.8 | asking | A dry rasp of bowed glass that slows to a stutter | texture
Frost fiddles | Bowed tide | body=Glass path=Steps slowness=6 quicken=4 rhythm=.6 bloom=.9 ratios=3 tone=.6 pulseWidth=.9 release=4 stagger=.5 lower=.9 damping=.85 touch=.5 | mist | sevenths | Bowed glass in sevens that steps up to a clear chord | string
Bowed saw at midnight | Bowed tide | body=Glass slowness=3 quicken=12 lower=.9 tone=1 rhythm=.5 attack=.35 release=9 damping=.5 agree=.4 volume=-8 bloom=.2 pulseWidth=.95 touch=.5 slowAgain=.4 ratios=3 | vibrato | single | A slow swell of bowed glass with a purr below its pitch | string
Breath on a goblet | Glass breathing | path=Glide slowness=6 quicken=1.5 attack=.1 rhythm=.6 damping=.15 release=5 touch=.95 slowAgain=.95 accent=.7 stagger=.75 | plate | chimes | A puff on ringing glass that clears into its note
Chapel through a wall | Glass breathing | slowness=5 quicken=6 lower=.8 pulseWidth=.6 damping=.4 attack=.15 release=3 rhythm=.4 volume=-2.5 touch=.4 slowAgain=.8 accent=.25 stagger=.5 ratios=3 | nextdoor | triad | Dark breathed glass that brightens and dims every six seconds
Spray on the sea wall | Glass breathing | path=Slowing slowness=7 quicken=3 pulseWidth=.2 tone=.5 rhythm=.8 attack=.02 damping=.6 release=1.5 ratios=4 slowAgain=.3 accent=.8 | hiss | highline | Thin breathed glass that slows to spits of air | texture
Aurora over the yard | Glass breathing | path=Slowing slowness=9 quicken=12 attack=.61 tone=1 lift=.5 rhythm=.3 damping=.05 release=14 stagger=.8 volume=-3 slowAgain=.8 lower=.55 accent=.5 | climbing | turning | Glass voices that slow for twelve seconds to faint breaths | pad
Toast to the absent | Glass breathing | path=Steps slowness=4 quicken=1 attack=.02 rhythm=.5 bloom=.5 pulseWidth=.35 damping=.3 release=3 accent=.9 volume=-12.5 touch=.8 slowAgain=.2 stagger=.2 agree=.85 ratios=1 | prism | pairs | Breath and glass in four quick steps, then a clear ring
Change ringers | Bells agreeing | path=There_and_back slowness=6 quicken=5 rhythm=.8 damping=.25 stagger=.5 accent=1 bloom=.8 touch=.9 slowAgain=.8 | cistern | entering | Taps on glass gather and thin out every five seconds, meetings stressed
Carousel horses | Bells agreeing | path=There_and_back slowness=5 quicken=2 ratios=1 tone=.7 pulseWidth=.4 rhythm=.5 damping=.5 release=2 lift=.5 volume=-5.5 touch=.9 slowAgain=.1 lower=.05 accent=.1 stagger=.15 | spin | contrary | Glass in threes that whirls up and slackens every two seconds
Beacon chain | Bells agreeing | path=There_and_back slowness=9 quicken=14 rhythm=.9 tone=.4 damping=.05 release=10 stagger=1 accent=.5 volume=0.5 touch=.4 slowAgain=.9 lower=.4 agree=.7 ratios=5 | stars | fourths | Far spaced taps on ringing glass that close up over seven seconds | texture
Teaspoon orchestra | Bells agreeing | path=There_and_back slowness=4 quicken=1 rhythm=.7 pulseWidth=.05 damping=.9 tone=.3 release=.3 touch=.2 slowAgain=.3 lower=.15 accent=.45 ratios=5 | booth | weave | Dry little clinks that bunch up once a second
Bell rope swinging | Bells agreeing | path=There_and_back slowness=7 quicken=4 lower=1 tone=.9 bloom=.3 attack=.2 pulseWidth=.7 release=6 damping=.2 lift=.8 touch=.7 slowAgain=.1 accent=0 | lungs | triad | Dark glass that swings toward its tone and away every four seconds
Anvil of the toymaker | Sevens on the loom | path=Glide slowness=5 quicken=1 damping=.75 tone=.5 stagger=0 accent=1 release=2 pulseWidth=1 lower=.5 touch=.4 slowAgain=.1 volume=-4 | shaded | weave | Plucked glass in sevens that snaps into its note
Crystal radio | Sevens on the loom | slowness=7 quicken=6 stagger=.3 rhythm=.4 pulseWidth=.7 tone=.8 damping=.1 release=6 attack=.3 volume=5.5 touch=.8 slowAgain=.2 lower=.3 | night | sevenths | Soft glass plucks in sevens over a quiet held tone
Comb and tines | Sevens on the loom | body=Wood path=Steps slowness=6 quicken=1.5 stagger=0 damping=.2 pulseWidth=.25 tone=.7 rhythm=.5 release=2 touch=1 volume=-13 slowAgain=.25 lower=.6 accent=.55 | metal | broken | Plucked tines of wood that climb six small steps | keys
Doorbell of the manor | Sevens on the loom | pulse=Tap slowness=4 quicken=.8 ratios=1 stagger=.2 tone=.8 damping=.35 release=3 pulseWidth=.5 lower=.3 volume=-5 slowAgain=.3 accent=.35 | crumbs | sixths | Struck glass in threes with a short trill at each touch
Hourly | Sevens on the loom | pulse=Tap path=Slowing slowness=8 quicken=2 ratios=2 tone=.6 stagger=0 damping=.05 release=9 accent=.8 pulseWidth=.45 lower=.6 volume=1.5 attack=.14 touch=.7 slowAgain=.6 agree=.8 | fifths | knocks | A glass tone with its low octaves that slows to tolling taps
`,
    },
    {
      id: 'octave-stairs',
      name: 'Octave stairs',
      category: 'keys',
      rows: `
Back stairs, barefoot | Octave stair keys | slowness=5 quicken=2.5 attack=.06 pulseWidth=.8 damping=.6 rhythm=.4 touch=.9 volume=-11 slowAgain=.15 lower=.55 accent=0 stagger=.6 agree=.5 ratios=1 | shaded | broken | Soft dark plucks on wood that climb five steps under the hand
Stepladder | Octave stair keys | slowness=4 quicken=1 lower=.3 pulseWidth=.3 damping=.4 release=1.2 bloom=.4 rhythm=.5 touch=1 slowAgain=.6 stagger=.1 agree=0 | bare | contrary | Clean plucked wood, four quick steps and a plain tone
Spiral to the lantern | Octave stair keys | slowness=8 quicken=8 bloom=1 rhythm=.6 lift=.6 width=1 release=6 attack=.2 volume=-12 touch=.85 slowAgain=.35 accent=.6 agree=.2 ratios=1 | climbing | entering | Plucks go round and up for eight seconds before their tone is lit
Fire escape in July | Octave stair keys | slowness=3 quicken=.7 pulseWidth=.1 rhythm=.8 tone=.5 damping=.75 release=.8 volume=-10.5 touch=.7 slowAgain=.2 lower=0 accent=.2 stagger=.4 agree=0 ratios=4 | slap | weave | Dry bright plucks, three steps at a run | plucked
Pulpit | Octave stair keys | slowness=6 quicken=4 lower=1 damping=.1 tone=.85 release=5 slowAgain=0 accent=.8 attack=.02 touch=.8 stagger=.1 agree=.1 ratios=1 | nave | pedal | Dark plucks on ringing wood that keep every octave they climbed
Schoolroom upright | Octave stair keys | pulse=Tap slowness=4 quicken=.6 rhythm=.3 bloom=.2 damping=.5 pulseWidth=.6 attack=.008 release=1.5 touch=.7 slowAgain=0 accent=.7 | worn | broken | A round struck tone with a short shuffle of taps at the front
Landing clock | Octave stair keys | pulse=Tap slowness=7 quicken=3 rhythm=.9 tone=.5 damping=.2 pulseWidth=.35 release=3 accent=1 touch=.85 slowAgain=.35 agree=.2 | keys | turning | Struck wood ticks, doubles and doubles again until it is a chord
Felt slippers | Octave stair keys | pulse=Tap slowness=5 quicken=2 pulseWidth=.95 rhythm=.5 damping=.8 tone=.75 attack=.1 lower=.5 release=1 touch=.4 volume=-12 slowAgain=0 stagger=.6 | felt | sixths | Muted wide taps that shuffle up softly to a dark tone
Tall ship's rigging | Octave stair keys | pulse=Tap slowness=6 quicken=6 ratios=5 agree=.6 stagger=.6 bloom=.7 width=1 release=4 lower=.2 volume=-10 touch=.85 slowAgain=0 | flutter | fourths | Loose elevens tapped on wood, climbing one key behind another
Typist upstairs | Octave stair keys | pulse=Tap slowness=3.5 quicken=2 rhythm=1 tone=.3 pulseWidth=.05 damping=.95 release=.4 lower=.1 volume=-2.5 touch=.8 slowAgain=.15 stagger=.4 agree=0 ratios=1 | cupboard | weave | Hard dry ticks with a thread of tone under the rush
Stairs of water | Octave stair keys | pulse=Drop body=Glass slowness=6 quicken=3 pulseWidth=.6 damping=.2 release=4 lower=.4 rhythm=.5 volume=-8.5 touch=.7 slowAgain=.15 accent=.1 stagger=.3 agree=.5 ratios=1 | prism | broken | Round drops on glass doubling six times into a clear tone
Fountain of three bowls | Octave stair keys | pulse=Drop body=Glass slowness=3 quicken=4 rhythm=.8 tone=.5 ratios=1 damping=.45 pulseWidth=.3 release=2 volume=-5 touch=.7 slowAgain=.8 accent=.7 | stone | round | Drops on glass in threes fall from step to step | bell
Aquarium, lights low | Octave stair keys | pulse=Drop body=Glass slowness=8 quicken=5 attack=.8 tone=.95 bloom=.2 rhythm=.2 release=9 width=.9 volume=-8.5 touch=.5 slowAgain=.4 accent=.55 stagger=.3 agree=.3 ratios=4 | under | triad | A soft glass chord with faint drops climbing inside | pad
Lift to the roof garden | Octave stair keys | pulse=Drop body=Glass slowness=5 quicken=.8 lift=.8 rhythm=.3 pulseWidth=.85 damping=.1 release=3 attack=.02 lower=.1 volume=-9.5 touch=.7 slowAgain=0 accent=.45 agree=.1 ratios=3 | ensemble | contrary | A smooth glassy key that is up five floors within a second
Pearls on the stairs | Octave stair keys | pulse=Drop body=Glass slowness=4.5 quicken=1.5 pulseWidth=.05 damping=.6 rhythm=.7 tone=.4 stagger=.7 release=1 volume=-3.5 touch=.9 slowAgain=.95 lower=.05 accent=.8 agree=.7 | tiles | chimes | Small hard drops of glass bounce up and are gone | bell
Choir stalls | Octave stair keys | pulse=Breath body=Air slowness=5 quicken=2 attack=.15 pulseWidth=.6 rhythm=.35 damping=.5 release=2 touch=0 volume=-8 slowAgain=0 accent=.5 agree=.85 | hall | triad | Breath in pipes speaks in five steps of an octave | organ
Bishop's ladder | Octave stair keys | pulse=Breath body=Air slowness=7 quicken=7 bloom=.9 lower=1 tone=.9 attack=.2 release=5 volume=-3 touch=.15 slowAgain=.1 accent=.45 stagger=.3 agree=.7 ratios=3 | organ | suspended | A hollow tone that keeps every lower octave it has breathed through | organ
Puffing up the hill | Octave stair keys | pulse=Breath body=Air slowness=4 quicken=3 rhythm=.9 tone=.4 pulseWidth=.2 damping=.8 lift=.7 release=.7 volume=-3 touch=.5 slowAgain=.3 lower=.15 accent=.7 agree=.8 ratios=3 | airy | wander | Short hard puffs, faster by double at each turn | wind
Stairwell ghosts | Octave stair keys | pulse=Breath body=Air slowness=8 quicken=10 stagger=.9 attack=.12 width=1 damping=.1 rhythm=.8 release=8 bloom=.1 volume=-6 touch=.5 slowAgain=.7 lower=0 accent=.6 | stairwell | entering | Slow breaths in open air, each voice on its own flight | voice
Little reed chest | Octave stair keys | pulse=Breath body=Air slowness=3 quicken=.5 pulseWidth=.05 tone=1 bloom=0 rhythm=.15 lower=.6 attack=.02 release=.6 width=.3 touch=0 volume=-11 slowAgain=0 accent=.6 | booth | contrary | A thin close reed of air with a flick of flutter as it speaks | organ
Cellist's landing | Octave stair keys | pulse=Bow_stroke slowness=5 quicken=2 attack=.1 rhythm=.5 damping=.4 pulseWidth=.6 release=2 lower=.4 agree=.2 volume=-8.5 touch=.85 accent=.8 stagger=.9 ratios=1 | chamber | contrary | A bow on wood takes five rough steps up to its note | string
Rafters creaking | Octave stair keys | pulse=Bow_stroke slowness=8 quicken=6 rhythm=.9 damping=.15 tone=.6 pulseWidth=.4 release=4 bloom=1 volume=-13.5 touch=.5 slowAgain=.6 lower=.45 accent=.45 agree=.7 ratios=1 | cloud | triad | Slow creaks double and double again for six seconds before any note | texture
Fiddle in the mill | Octave stair keys | pulse=Bow_stroke slowness=3.5 quicken=1 pulseWidth=.7 rhythm=.6 attack=.03 damping=.85 tone=.7 release=.8 lift=.2 touch=1 volume=-8 lower=.6 slowAgain=.4 accent=.45 agree=.4 | spring | sixths | A bowed note on wood, soon damped, after a scrape of four steps | string
Viol chest | Octave stair keys | pulse=Bow_stroke slowness=6 quicken=4 attack=.2 lower=.8 tone=.9 bloom=.3 rhythm=.25 width=.9 release=3 ratios=3 volume=-7 touch=.8 slowAgain=.7 stagger=.9 | vibrato | suspended | A grave bowed chord in sevens with its octaves held below | string
Ox team on the slope | Octave stair keys | pulse=Bow_stroke slowness=4.5 quicken=8 rhythm=.8 lower=1 tone=.5 damping=.55 accent=.9 stagger=.4 release=1.5 volume=-7 touch=.7 ratios=1 | triode | stack | Heavy bow strokes haul themselves up over eight seconds
Guitar left on a chair | Octave stair keys | pulse=Pluck body=Air slowness=4 quicken=.7 damping=.6 rhythm=.3 lower=.6 pulseWidth=1 release=2 touch=1 slowAgain=.95 accent=0 agree=.6 | double | broken | A dark hollow plucked tone with a short roll into it | plucked
Lute in the stairwell | Octave stair keys | pulse=Pluck body=Air slowness=6 quicken=2 rhythm=.7 pulseWidth=.75 damping=.8 tone=.6 release=1.5 stagger=.3 volume=-6 touch=1 slowAgain=.95 lower=.4 accent=.55 ratios=3 | stairwell | weave | Hollow plucks that double and scatter | plucked
Windharp tuned by hand | Octave stair keys | pulse=Pluck body=Air slowness=7 quicken=9 agree=.2 attack=.5 damping=.05 width=1 release=7 lift=.7 bloom=.7 volume=-6.5 touch=.85 slowAgain=.7 accent=.1 ratios=3 | strings | entering | Plucks in an open tube, loosely tuned, rise for nine seconds | string
Banjo at low tide | Octave stair keys | pulse=Pluck body=Skin slowness=4 quicken=1.5 pulseWidth=.1 damping=.5 rhythm=.6 tone=.5 release=.8 lower=.2 touch=.9 volume=-9.5 slowAgain=.3 accent=.6 agree=.8 | near | asking | A plucked skin, quick and tight, four short steps to its note | plucked
Drum up the tower | Octave stair keys | pulse=Drop body=Skin slowness=5 quicken=3 rhythm=.8 lower=.8 damping=.1 pulseWidth=.7 release=3 tone=.8 touch=.75 slowAgain=.2 accent=.2 | cave | twelfths | Round drops on deep ringing skin go up five steps | drum
Lamplit parlour keys | Octave stair keys | pulse=Tap body=Glass slowness=4 quicken=.8 pulseWidth=.75 damping=.35 rhythm=.2 lift=.5 release=2.5 attack=.01 touch=1 volume=-8 slowAgain=.6 stagger=.15 agree=.4 | shiver | broken | A soft struck glass key with a quick roll at the start
Tines in the lift shaft | Octave stair keys | pulse=Tap body=Glass slowness=6 quicken=3 rhythm=.7 pulseWidth=.2 damping=.2 tone=.5 release=4 bloom=.8 volume=-6.5 slowAgain=.2 accent=.2 stagger=.4 agree=.5 | tunnel | round | Struck glass that doubles for three seconds before it sings | bell
Vestry cupboard | Octave stair keys | pulse=Tap body=Glass slowness=5 quicken=5 lower=1 tone=.9 damping=.6 pulseWidth=.5 attack=.1 release=2 ratios=1 volume=-7.5 touch=.8 slowAgain=.15 accent=.45 | box | pedal | Muted glass in threes, its low octaves gathering under each note
Sugar lump dropped | Octave stair keys | pulse=Tap body=Glass slowness=3 quicken=.5 pulseWidth=.05 damping=.85 rhythm=.5 tone=.35 release=.25 touch=1 lower=0 volume=-2.5 stagger=.3 agree=.8 | airy | chimes | A tiny glass click whose weight is all in the finger | plucked
Seven flights up | Octave stair keys | pulse=Tap body=Glass slowness=7 quicken=7 stagger=.8 lift=.9 bloom=.5 accent=.2 rhythm=.6 width=1 release=5 volume=-7.5 touch=.85 slowAgain=.35 lower=0 | pan | entering | Struck glass takes a flight each second, seven in all
Ocarina on the wall | Octave stair keys | pulse=Drop body=Air slowness=4 quicken=1.2 attack=.05 pulseWidth=.7 rhythm=.4 damping=.3 release=1.2 lower=.2 volume=-9 touch=.9 slowAgain=.3 accent=.1 agree=.2 | fifths | asking | A hollow round note that flutters up four steps | wind
Panpipes at the gate | Octave stair keys | pulse=Drop body=Air slowness=6 quicken=3 attack=.08 damping=.05 rhythm=.6 tone=.8 pulseWidth=.35 release=3 ratios=4 volume=-6 touch=.5 slowAgain=.3 accent=.5 | far | sixths | Ringing pops of air in nines step up into a piped tone | wind
Owl box | Octave stair keys | pulse=Drop body=Air slowness=8 quicken=4 bloom=1 rhythm=.9 pulseWidth=.9 tone=.6 damping=.5 release=2.5 lift=.4 volume=-6 touch=.9 slowAgain=.6 lower=.45 accent=.1 agree=.5 | canon | wander | Low soft hoots that double until the tone opens | wind
Bottle organ | Octave stair keys | pulse=Drop body=Air slowness=3 quicken=2.5 lower=.9 tone=1 bloom=.3 rhythm=.25 attack=.08 damping=.6 release=1 touch=.15 slowAgain=0 accent=.8 agree=0 ratios=1 | rotor | triad | A dull hollow organ that shakes for three steps and steadies | organ
Subway grating | Octave stair keys | pulse=Drop body=Air slowness=5 quicken=8 stagger=.6 rhythm=.8 lift=1 tone=.7 width=.8 release=4 accent=.7 volume=-11.5 touch=.1 slowAgain=.75 lower=.55 agree=.8 ratios=1 | throb | stack | Hollow drops lift the chord at every step for eight seconds | texture
Mezzanine | Glass breathing | path=Steps slowness=5 quicken=6 bloom=.4 attack=.25 rhythm=.5 release=6 pulseWidth=.5 touch=.2 slowAgain=.6 accent=.25 stagger=.3 | light | triad | Breath on glass in five unhurried steps to a full chord | pad
Museum after hours | Glass breathing | path=Steps slowness=8 quicken=20 attack=.4 tone=.95 rhythm=.3 damping=.1 release=12 width=.8 volume=-2 touch=.3 slowAgain=.3 lower=.55 accent=.7 ratios=3 | open | turning | A slow glass swell with breaths that double about every two seconds | pad
Rising thermals | Breath engine | path=Steps slowness=6 quicken=4 attack=.35 tone=.9 rhythm=.5 release=4 damping=.15 ratios=3 touch=.3 slowAgain=.8 stagger=.9 | clouds | sevenths | Air in sevens that lifts by an octave six times in four seconds | pad
Curtain going up | Bowed tide | path=Steps slowness=6 quicken=5 attack=.3 bloom=.7 rhythm=.4 tone=1 release=5 lower=.9 slowAgain=.8 accent=.5 agree=.7 pulseWidth=.95 damping=.8 | pad | fourths | Bowed air steps up from under a chord that comes late | pad
Scaffold at dawn | Pattering pad | path=Steps body=Skin slowness=7 quicken=4 rhythm=.7 bloom=.6 attack=.4 damping=.3 lower=.6 release=3 touch=.3 slowAgain=.15 accent=.25 stagger=.6 agree=.85 | hiss | entering | Drops on skin climb floor by floor to a low warm chord | pad
Organ stool | Tremolo hymn | path=Steps slowness=5 quicken=1.5 lift=.6 rhythm=.1 attack=.1 lower=.9 release=1.5 touch=0 volume=-14.5 slowAgain=.2 accent=.8 stagger=.3 agree=.5 ratios=3 | spin | triad | A wooden organ tone with a brief shake on every key | organ
Dovecote | Grain drone | path=Steps pulse=Drop body=Wood slowness=4 quicken=3 attack=.2 pulseWidth=.8 rhythm=.6 tone=.7 release=2 lower=.5 volume=-6.5 touch=.95 slowAgain=.35 stagger=.3 agree=.6 | shell | broken | Soft wooden coos in four steps, the lower octaves with them
Watchman's round | Deep knocking | path=Steps slowness=6 quicken=4 rhythm=.9 tone=.6 damping=.3 bloom=.8 release=2 lower=.4 volume=-7.5 touch=.7 slowAgain=.15 accent=.6 stagger=.9 agree=.1 | dark | twelfths | Drops on skin knock, double and turn into a dull note
Stage machinery | Bass that counts | path=Steps pulse=Bow_stroke slowness=4 quicken=2 attack=.05 rhythm=.6 tone=.9 damping=.6 release=1.2 lower=.6 touch=.95 slowAgain=.2 accent=.6 agree=.1 | reel | lowcall | Low strokes on skin grind up four steps to a note | bass
Cellar lift | Bass that counts | path=Steps pulse=Breath body=Wood slowness=5 quicken=1.5 attack=.05 rhythm=.5 lower=1 tone=.9 release=1.5 width=.2 pulseWidth=.7 touch=.65 slowAgain=.1 accent=.35 agree=0 | muffled | walk | Puffs through wood haul up a dark low note in five steps | bass
`,
    },
    {
      id: 'grain-drones',
      name: 'Grain drones',
      category: 'drone',
      rows: `
Mill at low water | Grain drone | slowness=3 quicken=6 rhythm=.8 damping=.4 attack=.6 volume=-5.5 touch=.1 ratios=1 | reel | depth | A bowed wooden purr three octaves down that thins over six seconds
Cat on the cello case | Grain drone | slowness=2.5 quicken=12 pulseWidth=.85 tone=.8 rhythm=.6 lower=.5 width=.5 attack=.76 touch=.25 slowAgain=.8 accent=.6 agree=.85 | box | single | A soft wide purr on wood, twelve seconds to smooth
Looms behind the wall | Grain drone | slowness=4 quicken=30 rhythm=.9 tone=.5 stagger=.8 ratios=3 pulseWidth=.3 attack=.74 touch=.1 slowAgain=.2 lower=.45 | nextdoor | sevenths | Bow strokes in sevens rattle along for half a minute
Barn full of bees | Grain drone | slowness=1.5 quicken=20 pulseWidth=.35 tone=1 rhythm=.9 lower=.4 width=1 lift=.5 damping=.3 agree=.3 volume=-0.5 attack=.76 touch=.2 slowAgain=.35 accent=.6 stagger=.9 | sheen | pedal | A bowed buzz so near its pitch that it only shivers
Chaff on the boards | Grain drone | slowness=5 quicken=8 rhythm=1 tone=.35 damping=.8 accent=.9 attack=.1 release=1.5 volume=-5.5 touch=.7 slowAgain=.9 lower=.1 stagger=.75 agree=.7 ratios=1 | dusty | pedal | Rough strokes on dry wood hurry for eight seconds | texture
Hum of the pylon | - | pulse=Tap body=Air slowness=2 quicken=30 tone=1 rhythm=.2 attack=1 lower=.8 pulseWidth=.2 release=8 bloom=.1 touch=.1 volume=-9.5 slowAgain=.8 stagger=.2 agree=.4 lift=.6 | moving | stack | A hollow drone with its lower octaves and a quick shallow tremble
Dam wall, inside | - | pulse=Drop body=Wood slowness=3 quicken=15 rhythm=.7 damping=.1 attack=1 width=1 release=6 lift=.6 touch=.2 slowAgain=.8 accent=.2 stagger=.6 ratios=3 | cistern | stack | Drops purr on ringing wood and take fifteen seconds to blend
Frog pond motor | - | pulse=Drop body=Wood slowness=4 quicken=4 rhythm=1 tone=.4 pulseWidth=.4 damping=.6 stagger=1 attack=.1 release=1.5 volume=-1.5 touch=.1 slowAgain=1 lower=.4 accent=.6 agree=.1 ratios=1 | under | sixths | Quick wooden drops croak key by key and smooth in four seconds | texture
Glider overhead | - | pulse=Drop body=Wood path=There_and_back slowness=3 quicken=14 rhythm=.5 tone=.9 attack=1.5 bloom=.6 ratios=1 release=5 touch=.1 accent=.8 stagger=.75 agree=.85 | jet | pedal | A wooden tone that roughens and clears once in fourteen seconds
Millrace | - | pulse=Breath body=Skin path=Slowing slowness=3.5 quicken=10 rhythm=1 tone=.5 attack=.4 lower=1 damping=.4 release=3 volume=-2 touch=.25 slowAgain=.8 agree=0 ratios=3 pulseWidth=.35 stagger=.6 | water | stack | A low breathed tone on skin that slows over ten seconds to a rough chug
Neon over the bakery | Grain drone | body=Glass slowness=2 quicken=18 tone=.7 pulseWidth=1 rhythm=.5 damping=.8 lower=.9 attack=.76 touch=.1 slowAgain=.65 accent=.2 | spring | single | A steady bowed glass hum with a purr two octaves under it
Ice on the wire | Grain drone | body=Glass slowness=4 quicken=10 rhythm=.7 damping=.1 pulseWidth=.6 attack=.4 release=9 width=1 touch=.3 lower=.45 accent=.1 stagger=.3 agree=.85 ratios=3 pulse=Breath | stars | entering | Breaths flutter on ringing glass for ten seconds
Turntable of plates | Grain drone | body=Glass path=There_and_back slowness=3 quicken=5 bloom=.9 rhythm=.6 tone=.85 attack=.6 damping=.5 pulseWidth=.95 touch=.2 slowAgain=.65 lower=.6 accent=0 ratios=4 | record | fourths | Bowed glass comes to a tone and loses it every five seconds
Grinding lenses | Grain drone | body=Glass slowness=5 quicken=25 rhythm=1 tone=.3 damping=.75 pulseWidth=.1 ratios=5 release=1.5 agree=.5 attack=.74 touch=.1 slowAgain=1 lower=.35 stagger=.9 | hiss | sevenths | Dry strokes on glass in elevens, all grit and little tone | texture
Moon in the skylight | Grain drone | body=Glass path=Slowing slowness=3 quicken=20 lower=.8 tone=1 attack=.79 rhythm=.3 pulseWidth=.95 release=12 volume=-11.5 touch=.2 slowAgain=.35 accent=.1 agree=.8 ratios=1 | hanging | stack | A dark glass swell that comes apart into a purr very slowly
Beehive choir | Grain drone | pulse=Breath body=Air slowness=3 quicken=9 rhythm=.6 tone=.8 pulseWidth=.4 lift=.4 volume=-5.5 attack=.72 slowAgain=.6 accent=.5 stagger=.4 agree=.2 | vowel | triad | A flutter of breath in open pipes that takes nine seconds to clear | voice
Boiler breathing | Grain drone | pulse=Breath body=Air slowness=4.5 quicken=30 rhythm=1 tone=.25 damping=.1 pulseWidth=.2 lower=.6 attack=.05 accent=1 width=.2 touch=.2 slowAgain=.2 agree=.7 ratios=1 | pipe | depth | Hard low breaths that take half a minute to smooth
Reed organ at the fair | Grain drone | pulse=Breath body=Air path=There_and_back slowness=2 quicken=3 rhythm=.5 tone=1 lower=.9 attack=.2 release=1.5 width=.3 volume=-11 touch=.05 slowAgain=.1 accent=.55 stagger=.3 agree=.1 | worn | pedal | A reedy hollow tone with a flutter every three seconds | organ
Wind in the anemometer | Grain drone | pulse=Breath body=Air slowness=3.5 quicken=15 stagger=1 lift=.9 width=1 bloom=.6 attack=.76 damping=.85 release=6 pulseWidth=.15 touch=.25 slowAgain=.35 lower=.25 accent=.1 agree=0 ratios=1 tone=.5 | rain | turning | Thin breath turns in open air and lifts the chord in quick small gusts
Sleeping carriage | Grain drone | pulse=Breath body=Air path=Slowing slowness=4 quicken=15 tone=.9 bloom=.2 rhythm=.7 ratios=1 accent=.8 attack=.41 damping=.7 volume=-11.5 touch=.25 slowAgain=.65 lower=.55 agree=.3 | lowpass | twelfths | Low air slows for fifteen seconds to a running wheel
Drumskin hum | Grain drone | body=Skin slowness=3 quicken=8 rhythm=.6 damping=.3 tone=.8 volume=-7 touch=.2 slowAgain=.35 accent=.7 stagger=.9 agree=.3 | crypt | depth | Bow on skin, a low brown purr that clears in eight seconds
Tractor over the valley | Grain drone | body=Skin slowness=4.5 quicken=20 rhythm=1 tone=.4 pulseWidth=.5 damping=.7 lower=.6 width=.3 release=2 volume=4.5 touch=.25 slowAgain=.8 stagger=.4 agree=.2 ratios=1 | outdoors | twelfths | A blunt chug on skin that takes twenty seconds to join up
Bear in the long grass | Grain drone | body=Skin slowness=2.5 quicken=4 lower=1 tone=.95 attack=.2 rhythm=.5 lift=.7 release=1.5 pulseWidth=.25 touch=1 volume=-9 slowAgain=.1 accent=.2 ratios=3 | tubes | walk | A dark growl of skin that hardens with the touch | bass
Earth mover | Grain drone | pulse=Drop body=Skin slowness=3.5 quicken=15 rhythm=.9 damping=.1 pulseWidth=.8 attack=1 lower=.8 release=6 touch=.1 slowAgain=.8 accent=.6 stagger=.6 | iron | depth | Soft drops on a slack skin rumble for fifteen seconds
Kite string in a gale | Grain drone | body=Skin path=There_and_back slowness=2 quicken=6 tone=.8 pulseWidth=.05 rhythm=.7 damping=.5 attack=.3 ratios=4 width=.9 touch=.7 slowAgain=.7 lower=0 accent=.2 | flutter | pedal | A tight bright hum of skin in nines, rough and smooth by turns | string
Harmonium nap | Tremolo hymn | slowness=3 quicken=3 lift=.6 rhythm=.1 attack=.8 lower=.8 tone=.95 release=3 touch=0 slowAgain=0 accent=.1 stagger=.15 agree=.8 | cassette | triad | A wooden organ drone with a soft fast shake that fades | organ
Pulse of the mill wheel | Tremolo hymn | slowness=4 quicken=30 lift=1 rhythm=.5 damping=.2 attack=.5 release=5 accent=.7 volume=-12.5 touch=.25 slowAgain=.35 lower=.05 stagger=.4 agree=.4 ratios=1 | gate | stack | Taps of wood shake the drone and need half a minute to merge
Wire fence singing | Tremolo hymn | body=Air slowness=2 quicken=20 lift=.8 tone=.9 pulseWidth=.4 damping=.4 attack=1.17 width=1 release=7 agree=.4 volume=-3.5 touch=.1 lower=.75 accent=0 stagger=.5 ratios=3 | strings | fourths | A hollow tone with a fine shiver on every key
Moths on the lamp | Tremolo hymn | body=Glass slowness=3.5 quicken=15 lift=.7 rhythm=.6 pulseWidth=.5 damping=.5 tone=.6 attack=.3 stagger=1 release=2 volume=2 touch=.25 slowAgain=.65 lower=.05 accent=.5 | bedside | single | Quick taps on glass that keep a small tone trembling
Planetarium engine | Tremolo hymn | body=Skin slowness=2.5 quicken=10 lift=.9 lower=1 attack=5 tone=.9 rhythm=.3 release=8 damping=.3 pulseWidth=.7 touch=.25 slowAgain=.8 accent=.1 agree=.1 | glacial | depth | A huge soft skin drone that shudders for ten seconds
Wasp under the glass | - | pulse=Pluck body=Glass slowness=2.5 quicken=10 rhythm=.6 tone=.6 pulseWidth=.1 attack=.2 damping=.6 release=1.5 volume=4 touch=.5 slowAgain=.9 accent=.55 agree=.5 ratios=1 | jar | single | A thin plucked whirr on glass, ten seconds to a tone | texture
Zither on the radiator | - | pulse=Pluck body=Wood slowness=2 quicken=15 rhythm=.5 tone=.8 pulseWidth=.4 attack=.5 damping=.15 release=5 lower=.6 touch=.5 slowAgain=.4 accent=.25 stagger=.9 agree=.85 ratios=1 volume=-10 | strings | pedal | Plucks on wood two octaves down, a tremolo of wires | string
Windfall orchard | - | pulse=Pluck body=Air slowness=3.5 quicken=25 rhythm=.8 tone=.4 ratios=5 stagger=.5 pulseWidth=.6 damping=.3 attack=.8 release=4 touch=.3 slowAgain=1 lower=.35 | cloud | triad | Open plucks in elevens patter on for twenty five seconds | texture
Prairie harp | - | pulse=Pluck body=Skin slowness=3 quicken=8 rhythm=.7 tone=.7 lower=.8 damping=.2 pulseWidth=.7 attack=.4 release=4 width=.8 agree=.6 touch=.1 slowAgain=.65 accent=.6 | dissolve | stack | Dark plucks on skin run together into a low drone
Sewing room | - | pulse=Pluck body=Wood path=There_and_back slowness=3 quicken=2 rhythm=.9 tone=.5 pulseWidth=.2 damping=.8 attack=.05 release=1 accent=.5 slowAgain=.9 lower=.05 stagger=.2 agree=0 | booth | pedal | Dry wooden plucks that whirr and rest every two seconds | texture
Lower meadow, first dew | Bowed tide | path=Glide slowness=3 quicken=12 attack=.79 lower=.8 rhythm=.5 tone=.9 release=7 pulseWidth=.8 volume=0 touch=.3 slowAgain=.8 accent=.6 stagger=.6 agree=.1 | stretch | stack | Wide bow strokes in air blur beneath a slow dark swell
Long wave | Bowed tide | slowness=2 quicken=8 tone=.8 rhythm=.6 pulseWidth=.75 attack=.76 width=.4 damping=.8 release=2.5 agree=.5 volume=-1.5 touch=.2 slowAgain=.65 lower=.6 accent=.6 stagger=.15 ratios=1 | night | pedal | A bowed hum of air that roughens every eight seconds
Monastery well | Bowed tide | body=Skin path=Glide slowness=2.5 quicken=20 attack=2.4 tone=1 lower=1 rhythm=.3 release=9 damping=.1 pulseWidth=.9 touch=.25 accent=.45 stagger=.4 | monks | depth | A soft bowed skin tone with all its lower octaves
Hawser taking strain | Bowed tide | body=Wood path=Slowing slowness=4 quicken=12 rhythm=.8 tone=.7 damping=.3 attack=.6 pulseWidth=.4 release=4 accent=0 volume=-1.5 touch=.3 slowAgain=.65 lower=.55 agree=.8 ratios=3 | giant | pedal | A bowed wooden tone that slows for twelve seconds to strain and slip
Swarm moving house | Bowed tide | body=Wood path=There_and_back slowness=1.5 quicken=4 rhythm=.7 tone=.6 pulseWidth=.1 stagger=.5 width=1 attack=.3 release=2 ratios=4 volume=1 touch=.3 slowAgain=.2 lower=.05 accent=.8 | drift | entering | Wooden bows in nines swarm close to their pitch and loosen again
Snow plough | Deep knocking | path=Glide slowness=3 quicken=10 tone=.9 rhythm=.6 attack=.8 damping=.6 pulseWidth=.6 release=3 touch=.25 slowAgain=.5 lower=.9 accent=.25 ratios=1 | muffled | depth | Drops on skin rumble low for ten seconds and settle
Ferry, below deck | Deep knocking | path=There_and_back slowness=3.5 quicken=8 lift=.6 bloom=.5 attack=.5 rhythm=.7 width=.8 release=4 damping=.3 volume=-10 touch=.25 slowAgain=.35 lower=.6 accent=.8 stagger=.75 agree=.85 ratios=1 | swirl | depth | Low drops on skin swell to a tone and shake loose every eight seconds
Underground river | Solitary pulse | body=Skin path=Slowing slowness=4 quicken=20 lower=.9 tone=.9 attack=5.5 rhythm=.5 release=10 pulseWidth=.9 volume=-7.5 touch=.3 slowAgain=.35 accent=0 stagger=.5 agree=.85 ratios=3 | sinking | stack | A pure dark skin drone that loosens very slowly into drops
Singing refrigerator | Solitary pulse | slowness=2 quicken=12 tone=.9 rhythm=.3 attack=1 lift=.3 damping=.3 pulseWidth=.4 release=4 width=.2 volume=-4.5 touch=.3 slowAgain=.65 lower=.3 accent=.5 agree=.6 ratios=3 | cupboard | pedal | A round glass hum with a faint tremble for twelve seconds
Phosphor | Solitary pulse | path=There_and_back slowness=3 quicken=10 rhythm=.6 tone=.8 pulseWidth=.2 stagger=.9 attack=.4 release=7 ratios=3 bloom=.2 volume=-8 touch=.4 | light | sevenths | Glass drops in sevens tremble and clear, key by key
Choir in the stairwell | Winding down choir | path=Glide slowness=3 quicken=15 tone=1 rhythm=.4 attack=.72 lower=.6 pulseWidth=.7 volume=-2 touch=.4 slowAgain=.7 accent=.7 stagger=.4 agree=.2 ratios=1 | stairwell | triad | Hollow voices with a flutter that is slow to leave them | voice
Bagpipe in the next glen | Winding down choir | path=Glide slowness=2 quicken=10 rhythm=.5 pulseWidth=.1 lower=1 attack=.3 damping=.1 release=1.5 width=.3 volume=-4 touch=.9 slowAgain=.6 accent=.45 agree=.3 | far | pedal | A thin reedy drone of air with its octaves below | wind
Wheeze | Winding down choir | path=There_and_back slowness=4 quicken=6 rhythm=.9 tone=.5 damping=.7 pulseWidth=.2 attack=.1 release=1.2 accent=.9 volume=-1.5 touch=.1 slowAgain=.75 lower=.5 stagger=.75 agree=.3 | paper | fourths | Dry breaths that nearly find a note every six seconds | texture
Sighing mainspring | Winding down choir | slowness=3 quicken=25 rhythm=.7 tone=.8 ratios=1 lift=.8 attack=.8 release=9 volume=-3 touch=.1 slowAgain=.2 lower=0 accent=.1 stagger=.1 pulseWidth=.1 | melt | stack | Reedy air in threes slows so gradually that it only begins to tremble
Elder at the stove | Winding down choir | body=Wood path=Glide slowness=3.5 quicken=6 tone=.9 rhythm=.5 lower=.7 attack=.6 pulseWidth=.85 damping=.4 release=3 touch=.3 slowAgain=.5 accent=.25 agree=.5 | wool | turning | Warm breath through wood, a flutter for six seconds and then a chord
`,
    },
    {
      id: 'winding-choirs',
      name: 'Winding choirs',
      category: 'voice',
      rows: `
Evensong emptying | Winding down choir | slowness=6 quicken=6 slowAgain=.8 release=5 pulseWidth=.75 damping=.15 lower=.6 tone=.7 width=1 volume=-3.5 attack=.31 agree=.8 | nave | suspended | Dark voices of air that sing and then slow for six seconds to sighs
Boys on the back row | Winding down choir | slowness=5 quicken=2 slowAgain=.4 attack=.08 pulseWidth=.1 rhythm=.6 release=1.5 damping=.6 tone=.7 touch=.75 accent=.25 stagger=.2 agree=.5 | chamber | contrary | Thin bright breathy voices that flutter apart in two seconds
Fishermen mending nets | Winding down choir | slowness=8 quicken=14 lower=.8 tone=1 rhythm=.2 attack=.71 width=1 pulseWidth=.8 release=9 volume=-4 touch=.5 accent=.2 stagger=.3 agree=.8 ratios=3 | monks | turning | Dark soft voices with the octaves below, very slow to tire
Rumour in the arcade | Winding down choir | slowness=4 quicken=4 rhythm=.9 tone=.35 stagger=.9 pulseWidth=.25 lift=.2 release=2 ratios=4 slowAgain=.9 volume=2.5 attack=.2 touch=.4 lower=.9 accent=.8 | reveal | round | Whispers in nines pass from key to key and slow down
Last verse | Winding down choir | slowness=9 quicken=9 lift=.9 bloom=0 rhythm=.5 attack=.2 release=14 slowAgain=1 damping=.05 touch=.3 lower=.75 ratios=1 body=Wood | choirhall | triad | A wooden chord that ends as single far breaths lifting it
Viols put away | Winding down choir | pulse=Bow_stroke slowness=6 quicken=5 attack=.25 rhythm=.5 release=6 slowAgain=1 damping=.4 touch=.9 lower=.45 stagger=.3 pulseWidth=.8 | hall | suspended | Bowed air that slows over five seconds and goes on slowing when left | string
Rope and pulley | Winding down choir | pulse=Bow_stroke slowness=4.5 quicken=1.5 rhythm=.8 pulseWidth=.2 tone=.6 damping=.7 attack=.06 release=1.2 slowAgain=.6 volume=-4 touch=.8 lower=.6 accent=.25 agree=.2 ratios=1 | corridor | knocks | A rasp of bowed air that drops quickly to a creaking pace | string
Widow's walk | Winding down choir | pulse=Bow_stroke slowness=8 quicken=10 tone=.95 attack=.3 lower=.6 width=1 pulseWidth=.9 release=12 slowAgain=.9 rhythm=.25 agree=.3 volume=-8.5 touch=.5 accent=0 ratios=1 | clouds | entering | A wide bowed swell that sinks to slow strokes over ten seconds | pad
Crane flies | Winding down choir | pulse=Bow_stroke slowness=3.5 quicken=3 pulseWidth=.5 rhythm=.9 tone=.55 stagger=.6 ratios=5 damping=.85 release=2.5 slowAgain=1 volume=6 attack=.15 touch=.7 accent=.7 agree=.6 body=Wood | swirl | highline | Faint strokes that tire to a flutter in three seconds | texture
Carriages at eleven | Winding down choir | pulse=Bow_stroke slowness=7 quicken=4 lift=.8 accent=1 ratios=1 rhythm=.7 lower=.9 attack=.05 release=4 slowAgain=.3 touch=.95 | stack | twelfths | Low hollow strokes in threes slow to a marked heavy step | bass
Parlour organ, dusk | Winding down choir | body=Wood slowness=6 quicken=7 tone=.95 rhythm=.3 attack=.1 release=4 slowAgain=1 lower=.4 touch=.05 accent=.8 stagger=.3 agree=.2 | cassette | triad | Breath through wood sags into slow sighs as the air gives out | organ
Puppets hung up | Winding down choir | body=Wood slowness=5 quicken=1 rhythm=.9 tone=.5 pulseWidth=.3 damping=.7 attack=.03 release=3 slowAgain=1 lift=.2 touch=.8 lower=.05 accent=.45 agree=.5 | cupboard | asking | Puffs of wood fall loose in a second and dangle after each note | keys
Wood stove ticking out | Winding down choir | body=Wood slowness=9 quicken=5 rhythm=.8 tone=.6 damping=.15 pulseWidth=.6 release=16 slowAgain=1 bloom=.1 volume=-5 attack=.28 touch=.7 lower=0 accent=.5 agree=0 | dusty | knocks | Warm breath on ringing wood that takes a long time to stop | texture
Hymn for a small boat | Winding down choir | body=Wood slowness=7 quicken=12 attack=.67 lift=.7 width=.9 pulseWidth=.75 release=7 slowAgain=.5 agree=.4 volume=-3.5 lower=.6 accent=.1 stagger=.3 | water | turning | Soft wooden voices, loosely tuned, rocked slower and slower
Recorders in the cellar | Winding down choir | body=Wood slowness=4 quicken=3 tone=.8 rhythm=.5 pulseWidth=.1 damping=.4 attack=.05 release=1 slowAgain=.2 ratios=3 touch=.5 stagger=.3 | crypt | round | Thin breathed wood in sevens that shakes as it slows | wind
Voices behind a screen | Winding down choir | pulse=Drop slowness=6 quicken=6 attack=.3 pulseWidth=.75 rhythm=.4 release=5 slowAgain=.8 damping=.3 touch=.75 lower=.6 stagger=.15 agree=.3 ratios=5 | vowel | turning | Round dark voices of air that come apart into drops
Children counting sheep | Winding down choir | pulse=Drop slowness=5 quicken=2.5 rhythm=.7 tone=.6 pulseWidth=.35 attack=.06 damping=.5 release=2 slowAgain=1 stagger=.8 volume=-2.5 touch=.4 lower=.45 ratios=3 | halfspeed | round | Small hollow voices count slower, one after another
Sirens, tired | Winding down choir | pulse=Drop slowness=8 quicken=8 attack=.41 tone=1 width=1 release=10 slowAgain=.9 lift=.5 bloom=.1 lower=.5 volume=-6.5 touch=.75 accent=.55 stagger=.75 agree=.7 | sinking | suspended | A wide hollow chord whose drops fall ever further apart
Owlets | Winding down choir | pulse=Drop slowness=4 quicken=1.2 rhythm=.6 tone=.5 pulseWidth=.15 attack=.02 release=1.5 slowAgain=.7 damping=.15 ratios=1 volume=-4 touch=.5 lower=.35 accent=.55 agree=.8 | moving | asking | Short piping drops that stumble as they end | wind
Bathhouse, last swimmer | Winding down choir | pulse=Drop slowness=7 quicken=15 rhythm=.6 damping=.05 release=9 slowAgain=1 lower=1 attack=.3 accent=.7 pulseWidth=.6 volume=-4.5 touch=.3 bloom=.1 | tile | stack | Ringing hollow drops slow for fifteen seconds over a deep chord | pad
Glass harmonica, unwound | Winding down choir | body=Glass slowness=6 quicken=5 damping=.2 attack=.25 release=8 slowAgain=1 pulseWidth=.5 agree=.4 volume=-3.5 touch=.4 lower=.9 accent=.1 ratios=3 | hold | fourths | Breath on glass that slows and goes on ringing | pad
Snow globe settling | Winding down choir | body=Glass slowness=7 quicken=2 rhythm=.8 tone=.5 pulseWidth=.1 damping=.35 release=6 slowAgain=1 stagger=.7 attack=.04 volume=-2.5 touch=.9 accent=.55 ratios=3 | stars | chimes | Thin breaths on glass scatter in two seconds and drift down | bell
Ballroom, sheets on | Winding down choir | body=Glass slowness=8 quicken=12 attack=.54 tone=1 rhythm=.2 lower=.7 width=.8 release=14 slowAgain=.6 pulseWidth=.9 volume=-5 accent=.5 stagger=.2 agree=0 ratios=3 | record | suspended | A dim glass chord that slows so gently it only seems to breathe | pad
Nuns on the ice | Winding down choir | body=Glass slowness=4.5 quicken=4 lift=.9 rhythm=.5 damping=.6 pulseWidth=.35 attack=.2 release=2.5 slowAgain=.9 ratios=5 touch=.4 lower=.55 | veil | contrary | Cool breathed glass in elevens whose quick shake slows down
Candle snuffer | Winding down choir | body=Glass slowness=9 quicken=1.5 tone=.7 rhythm=.6 release=3 slowAgain=.1 attack=.1 bloom=.3 damping=.8 pulseWidth=.95 touch=.3 lower=.6 accent=.25 agree=.1 | darkhall | pairs | A short glass sigh that is at once all but still
Clockwork nightingale | Quickening chord | body=Air path=Slowing slowness=5 quicken=1.5 slowAgain=1 release=5 rhythm=.6 tone=.7 attack=.02 pulseWidth=.2 damping=.3 touch=.65 lower=.15 accent=.5 agree=.7 ratios=3 | record | highline | A bright hollow song of taps that runs down after every note | wind
Musical chairs | Quickening chord | body=Air path=Slowing slowness=6 quicken=3 slowAgain=1 release=2.5 rhythm=.9 tone=.4 stagger=.5 damping=.7 accent=.9 touch=.2 lower=.5 | bedside | sixths | Dry taps of air that lose heart in three seconds | plucked
Carillon let alone | Quickening chord | body=Air path=Slowing slowness=7 quicken=7 slowAgain=.9 release=12 tone=.9 lift=.7 attack=.4 damping=.1 width=1 touch=.3 lower=.75 agree=.3 | hanging | turning | Ringing hollow tones slow over seven seconds and then slower yet
Street singer, far end | Quickening chord | body=Air path=Slowing slowness=8 quicken=4 slowAgain=.3 release=4 tone=1 rhythm=.25 attack=.2 lower=.5 pulseWidth=.65 touch=1 accent=.6 agree=.2 | reversed | wander | One hollow dark voice that follows the touch and slows at the end of each note
Beggars' chorus | Quickening chord | body=Air path=Slowing slowness=4 quicken=8 slowAgain=.8 release=3 tone=.75 rhythm=.7 attack=.1 pulseWidth=.55 ratios=3 agree=.5 stagger=.3 volume=-9 damping=.7 lower=.5 touch=.75 | combo | sevenths | Reedy taps in rough sevens, tiring for eight seconds
Voices at the weir | Winding down choir | path=There_and_back slowness=6 quicken=8 slowAgain=.7 release=6 bloom=.6 rhythm=.45 pulseWidth=.45 volume=-5.5 touch=.4 lower=.4 accent=0 stagger=.9 agree=.8 | overtone | entering | Voices of air gather and part every eight seconds
Argument overheard | Winding down choir | path=There_and_back slowness=4 quicken=2 slowAgain=.9 rhythm=.8 tone=.5 pulseWidth=.15 attack=.04 release=1 damping=.6 stagger=.5 volume=-0.5 accent=.6 agree=.4 | nextdoor | contrary | Quick rough voices rise and drop every two seconds
Dormitory windows | Winding down choir | path=There_and_back slowness=8 quicken=5 slowAgain=1 attack=.76 lift=1 stagger=1 pulseWidth=.8 release=7 tone=.8 volume=-5.5 lower=.3 accent=.25 | lungs | turning | Voices of air that each breathe at their own time
Psalm both sides | Winding down choir | path=There_and_back body=Wood slowness=5 quicken=4 tone=.95 rhythm=.3 attack=.3 release=3 slowAgain=.4 ratios=1 width=1 volume=-0.5 touch=.4 lower=.45 accent=.25 stagger=.1 | pan | pedal | Wooden breaths in threes gather and fall back every four seconds
Night market closing | Winding down choir | path=There_and_back body=Skin slowness=6 quicken=12 rhythm=.7 tone=.6 damping=.4 release=8 slowAgain=1 stagger=.6 pulseWidth=.3 volume=0 touch=.5 accent=.7 agree=0 ratios=1 | loop | stack | Hoarse breaths on skin swell once in twelve seconds and tail away
Elders below | Winding down choir | body=Skin slowness=6 quicken=5 lower=.7 attack=.3 pulseWidth=.6 release=4 slowAgain=.8 volume=-2 touch=.75 accent=0 agree=.8 ratios=1 | monks | depth | Low breath on skin slows for five seconds to a chest's own pace
Winter den | Winding down choir | body=Skin slowness=8 quicken=3 rhythm=.6 tone=.8 attack=.5 lift=.9 release=6 slowAgain=1 pulseWidth=.9 damping=.2 volume=-4.5 touch=.5 lower=.55 accent=.55 stagger=.9 agree=0 | wool | twelfths | Soft deep breaths on a slack skin, slower when let go | pad
Miners' chorus | Winding down choir | body=Skin pulse=Bow_stroke slowness=5 quicken=6 lower=1 tone=.8 rhythm=.5 attack=.2 damping=.5 release=3 slowAgain=.5 volume=-2.5 touch=.5 stagger=.15 agree=.3 ratios=1 | tunnel | stack | Rough low bowed skin that labours slower for six seconds
Drummer's lament | Winding down choir | body=Skin pulse=Tap slowness=7 quicken=2 rhythm=.9 tone=.6 damping=.15 attack=.04 release=6 slowAgain=1 accent=.9 pulseWidth=.4 volume=-5 touch=1 lower=.45 | cave | knocks | Taps on skin that slow twice, once held and once let go | drum
Caravan halting | Winding down choir | body=Skin pulse=Pluck slowness=6 quicken=9 rhythm=.7 tone=.6 damping=.75 ratios=4 stagger=.7 release=2.5 slowAgain=.9 attack=.08 touch=.85 lower=.45 accent=.7 | trail | weave | Plucked skins in nines come slower and slower to a stand | plucked
Echo of the tenor bell | Winding down choir | pulse=Drop body=Glass slowness=7 quicken=4 attack=.04 damping=.1 release=10 slowAgain=1 tone=.8 pulseWidth=.6 volume=-6 touch=.7 lower=.55 accent=.25 stagger=.75 agree=.4 ratios=5 | stretch | pairs | A round glass note that slows to drops and further when let go | bell
Toy orchestra | Winding down choir | pulse=Pluck body=Wood slowness=5 quicken=1.2 attack=.01 damping=.4 release=5 slowAgain=1 rhythm=.7 tone=.5 pulseWidth=.3 touch=.9 lower=.3 agree=0 ratios=4 | box | asking | Plucked wood that runs down like a spring after each touch | plucked
Barrel piano | Winding down choir | pulse=Pluck body=Glass slowness=4 quicken=3 attack=.01 damping=.55 release=2 slowAgain=.8 rhythm=.6 tone=.6 pulseWidth=.15 lower=.4 touch=.8 accent=.2 agree=.4 volume=-5.5 | worn | broken | Bright plucked glass whose tremble slows for three seconds | keys
Mechanical moon | Winding down choir | pulse=Tap body=Glass slowness=8 quicken=9 attack=1.2 damping=.05 release=16 slowAgain=1 tone=.9 rhythm=.5 lift=.6 volume=-5 touch=.4 lower=.3 accent=.1 stagger=.15 agree=.3 ratios=1 | orbit | triad | Ringing glass that takes nine seconds and then sixteen more to stop | pad
Stopped carousel | Winding down choir | pulse=Pluck body=Air slowness=6 quicken=6 attack=.05 release=7 slowAgain=1 rhythm=.6 tone=.6 damping=.3 ratios=1 pulseWidth=.5 accent=.7 volume=-5 touch=.7 lower=.55 stagger=.75 | rotor | triad | Hollow plucks in threes that wind down in six seconds and again when let go | plucked
Applause that thins | Pattering pad | slowness=7 quicken=2 slowAgain=1 release=12 rhythm=.9 tone=.4 stagger=.7 damping=.5 attack=.2 pulseWidth=.2 volume=-1.5 touch=.1 accent=.7 agree=.4 ratios=1 | room | sixths | Drops on wood run together and then thin out long after | texture
Looms at knocking-off | Octave stair keys | path=Glide slowness=6 quicken=1 slowAgain=1 release=8 rhythm=.7 tone=.6 pulseWidth=.4 damping=.6 lower=.4 volume=-3.5 touch=.85 | flutter | asking | Plucks of wood hurry to a note and fall to bits when it is let go | plucked
Bus driver's goodnight | Tremolo hymn | body=Air slowness=5 lift=.9 slowAgain=1 release=8 rhythm=.3 attack=.3 quicken=2 tone=.8 pulseWidth=.7 volume=-4.5 lower=.9 accent=.25 ratios=3 | vibrato | contrary | Hollow voices that shake, and shake slower as they go
Kettle off the ring | Glass breathing | path=Glide slowness=5 quicken=3 slowAgain=1 release=7 attack=.2 rhythm=.7 pulseWidth=.15 damping=.5 touch=.65 agree=.8 | melt | wander | Thin breath on glass rises to its tone and then goes off the boil | wind
Bells put by | Bells agreeing | slowness=5 quicken=.8 slowAgain=1 release=14 rhythm=.6 tone=.6 pulseWidth=.75 damping=.08 attack=.02 touch=.9 lower=.9 accent=.8 ratios=3 | dissolve | asking | Glass struck at once, and a long slowing patter left behind it | bell
`,
    },
    {
      id: 'sevens-looms',
      name: 'Seven-limit looms',
      category: 'plucked',
      rows: `
Warp and heddle | Sevens on the loom | slowness=6 quicken=1.5 damping=.6 rhythm=.7 pulseWidth=.4 tone=.6 release=2 volume=-2.5 touch=1 slowAgain=.3 lower=.3 | bare | weave | Dry plucked glass in sevens, each key a thread behind the last
Silk on the frame | Sevens on the loom | slowness=8 quicken=10 attack=.8 tone=.9 rhythm=.3 pulseWidth=.5 damping=.15 release=9 pulse=Tap touch=.2 slowAgain=.15 lower=.5 body=Air volume=-9 bloom=.2 | light | sevenths | A soft hollow swell in sevens with slow taps let in | pad
Shuttle through | Sevens on the loom | slowness=4 quicken=3 ratios=4 stagger=1 pulseWidth=.1 rhythm=.9 tone=.35 damping=.75 release=.8 accent=0 lower=.1 | pan | fourths | Fast hard plucks of glass in nines, each key in its own gap
Tapestry by candle | Sevens on the loom | path=Slowing slowness=7 quicken=5 lift=.8 tone=.8 stagger=.4 lower=.9 release=5 damping=.6 volume=-9.5 touch=.3 slowAgain=.1 rhythm=.35 pulseWidth=1 | darkhall | turning | Dark plucked glass in sevens that slows till each stitch lights its tone
Loose threads | Sevens on the loom | slowness=9 quicken=2 agree=.1 stagger=.6 rhythm=.8 tone=.6 width=.3 release=6 pulseWidth=.6 touch=.9 lower=.1 | memory | sevenths | Rare glass plucks that were in sevens once and have drifted
Village weaver | Sevens on the loom | body=Wood slowness=6 quicken=2 damping=.5 tone=.7 pulseWidth=.5 rhythm=.6 touch=.9 volume=-4.5 slowAgain=.3 lower=.5 stagger=.6 | wide | weave | Plucked wood in sevens, one key close behind another
Basket maker | Sevens on the loom | body=Wood slowness=5 quicken=.7 rhythm=1 tone=.1 damping=.95 pulseWidth=.2 ratios=5 release=.5 accent=.8 touch=1 slowAgain=.9 lower=.6 stagger=.4 | near | sixths | Dry wooden ticks in elevens with scarcely a tone | drum
Koto in a hayloft | Sevens on the loom | body=Wood slowness=4 quicken=1 tone=.95 rhythm=.25 damping=.2 pulseWidth=.25 stagger=.2 attack=.01 release=3 bloom=.1 touch=1 volume=-13 slowAgain=.95 | spring | broken | A clear plucked wooden string in sevens with a quick shake
Oak treadles | Sevens on the loom | body=Wood path=Steps slowness=7 quicken=6 lower=.9 stagger=.5 rhythm=.7 bloom=.8 tone=.6 release=4 volume=-6 touch=.85 slowAgain=.8 | folded | pedal | Plucked wood in sevens treads up by octaves beneath the chord
Cane and reed | Sevens on the loom | body=Wood path=There_and_back slowness=6 quicken=3 rhythm=.8 agree=.5 ratios=4 damping=.35 pulseWidth=.6 tone=.5 stagger=.9 volume=-6.5 touch=.75 slowAgain=.2 lower=.3 accent=.2 width=.3 | slack | triad | Plucked wood in easy nines that tightens and slips every three seconds
Glass thread | Sevens on the loom | pulse=Tap slowness=6 quicken=3 damping=.1 pulseWidth=.1 tone=.35 rhythm=.8 release=6 stagger=.8 touch=.8 slowAgain=.6 lower=.1 | plate | sevenths | Narrow taps on glass in sevens, ringing one key after another | bell
Lace bobbins | Sevens on the loom | pulse=Tap slowness=4.5 quicken=.6 ratios=5 damping=.9 pulseWidth=.05 rhythm=.8 tone=.05 release=.6 stagger=1 touch=.2 slowAgain=.75 lower=.05 | stars | weave | Tiny clicks of glass in elevens, crossed and recrossed | texture
Beadwork | Sevens on the loom | pulse=Tap slowness=7.5 quicken=8 lift=.7 ratios=4 damping=.3 tone=.7 width=.8 release=5 stagger=.3 accent=1 volume=-4 touch=.7 slowAgain=.1 lower=.6 | bowls | broken | Glass taps in nines stitch slowly through a chord | bell
Sampler on linen | Sevens on the loom | pulse=Tap path=Slowing slowness=5.5 quicken=1.5 rhythm=.6 tone=.5 pulseWidth=.6 damping=.5 release=1.8 stagger=.5 touch=.95 slowAgain=.15 lower=.15 | sampler | broken | Round glass taps in sevens that fall to an even stitch | keys
Window of coloured glass | Sevens on the loom | pulse=Breath slowness=9 quicken=18 attack=.6 tone=1 rhythm=.5 pulseWidth=.4 bloom=.2 release=12 lower=.1 width=1 volume=-5 touch=.3 slowAgain=.8 stagger=.75 | hold | sevenths | A slow glass chord in sevens with breath at its edges | pad
Wool on the carder | Sevens on the loom | pulse=Bow_stroke body=Wood slowness=5 quicken=6 rhythm=.6 tone=.7 pulseWidth=.6 attack=.4 release=3 slowAgain=.6 lower=.5 | ensemble | sevenths | Bow strokes on wood in sevens draw out into a soft chord | string
Coarse weft | Sevens on the loom | pulse=Bow_stroke body=Wood slowness=3.5 quicken=2 rhythm=1 tone=.4 pulseWidth=.15 damping=.8 ratios=4 stagger=1 release=.7 volume=-4.5 touch=.3 slowAgain=.75 lower=.4 accent=.35 | triode | contrary | Rough dry strokes in nines, one thread against another | texture
Rug unrolled | Sevens on the loom | pulse=Bow_stroke body=Air slowness=7 quicken=9 attack=.35 tone=.9 stagger=.4 lift=.7 width=1 release=7 damping=.15 volume=-9.5 touch=.3 slowAgain=.3 lower=0 | open | fourths | Bowed air in sevens spreads out key by key | pad
Hem let down | Sevens on the loom | pulse=Bow_stroke body=Skin path=Slowing slowness=6 quicken=4 lower=1 tone=.8 rhythm=.5 release=4 attack=.2 pulseWidth=.7 | iron | stack | Low bowed skin in sevens slows to long draws | string
Spider at work | Sevens on the loom | pulse=Bow_stroke body=Glass slowness=8 quicken=3 ratios=5 agree=.3 rhythm=.7 tone=.5 pulseWidth=.9 damping=.45 release=8 stagger=.7 volume=-5 touch=.1 slowAgain=.6 lower=.45 | frozen | fourths | Faint slow strokes on glass in half-kept elevens | texture
Elms in three winds | Elevens drifting | slowness=6 quicken=5 agree=.8 damping=.3 tone=.8 pulseWidth=.9 rhythm=.5 touch=.9 slowAgain=.3 lower=.4 | clouds | pairs | Open plucks in near elevens that sway against each other
Wind through a ladder | Elevens drifting | slowness=5 quicken=1.5 ratios=3 agree=0 stagger=.9 rhythm=.8 tone=.5 pulseWidth=.45 release=1.5 touch=.85 slowAgain=.3 lower=.75 accent=.2 volume=-2.5 | wide | weave | Hollow tempered plucks whose pattern never closes
Strung reeds | Elevens drifting | slowness=3.5 quicken=15 rhythm=.9 tone=.3 damping=.6 pulseWidth=.3 stagger=.2 ratios=4 release=2 slowAgain=.3 lower=.45 accent=.45 | jet | triad | Open plucks in nines rustle for fifteen seconds before they join | texture
Three clocks in one room | Elevens drifting | path=Slowing slowness=7.5 quicken=2 agree=.35 rhythm=.9 damping=.4 tone=.5 accent=.9 stagger=.3 release=5 volume=-3.5 touch=1 slowAgain=.3 lower=.6 | pipe | triad | Hollow plucks slow to a tick that no two keys share
Kelp | Elevens drifting | path=There_and_back slowness=7 quicken=9 agree=.6 attack=1.5 tone=.9 lift=.6 pulseWidth=.85 lower=.6 release=8 rhythm=.4 touch=.3 slowAgain=.9 stagger=.3 | under | entering | Soft open plucks in loose elevens sway in and out every nine seconds | pad
Potter's seven | Sevens on the loom | pulse=Drop body=Wood slowness=6 quicken=2.5 damping=.3 tone=.6 pulseWidth=.7 rhythm=.7 stagger=.5 touch=.75 lower=.05 volume=-6 | pot | broken | Round wooden drops in sevens, turning over one another
Rain on seven roofs | Sevens on the loom | pulse=Drop body=Skin slowness=5 quicken=5 ratios=3 damping=.6 pulseWidth=.2 rhythm=.9 tone=.4 stagger=1 release=1.5 slowAgain=.9 lower=.35 | rain | sevenths | Tight drops on skin in sevens, no two together | drum
Dyer's vat | Sevens on the loom | pulse=Drop body=Skin path=Slowing slowness=7 quicken=7 lower=.9 tone=.9 rhythm=.4 damping=.1 pulseWidth=.9 attack=.4 release=7 volume=-6 slowAgain=.9 | cave | stack | A deep soft skin chord in sevens that slows to single drops | pad
Floating markers | Sevens on the loom | pulse=Drop body=Air slowness=6.5 quicken=4 ratios=5 agree=.7 stagger=.8 lift=.8 tone=.6 pulseWidth=.4 release=3 touch=.75 slowAgain=.1 lower=.6 | water | broken | Hollow drops in near elevens bob at different times | wind
Net with glass floats | Sevens on the loom | pulse=Drop slowness=10 quicken=6 ratios=4 damping=.05 tone=.5 rhythm=.8 pulseWidth=.5 stagger=.6 release=12 attack=.1 agree=.7 volume=6 touch=.7 slowAgain=.8 accent=.25 | cistern | chimes | Slow clear drops on glass in nines, ringing far apart | bell
Breathing cloth | Breath engine | ratios=3 stagger=.7 slowness=6 quicken=6 attack=.2 tone=.8 lift=1 release=4 touch=.8 lower=.6 pulseWidth=.15 rhythm=.7 damping=.75 | mist | sevenths | Breaths in sevens fill one fold and then another | wind
Sails of seven ships | Breath engine | ratios=4 body=Skin stagger=.5 slowness=6 quicken=2.5 rhythm=.7 damping=.85 tone=.25 pulseWidth=.3 release=1.5 volume=-6 touch=.65 slowAgain=.75 lower=.4 accent=0 attack=.03 | dotted | contrary | Puffs on skin in nines that flap drily and hurry into a thin chord | wind
Organ of knots | Breath engine | ratios=5 body=Wood slowness=4 quicken=12 stagger=.3 rhythm=.4 tone=.95 lower=.6 pulseWidth=.5 attack=.3 release=2 accent=.7 touch=.1 slowAgain=.2 | booth | triad | A reedy wooden organ in elevens whose flutter is slow to close | organ
Muslin | Breath engine | ratios=3 body=Glass path=There_and_back slowness=7 quicken=5 stagger=1 rhythm=.3 pulseWidth=.9 attack=.35 width=1 release=7 volume=4.5 touch=.3 slowAgain=.3 lower=.4 bloom=.3 | deepfog | sevenths | Soft breath over glass in sevens comes and goes every five seconds | pad
Wind in the wool shed | Breath engine | ratios=4 agree=.2 path=Slowing slowness=6 quicken=3 rhythm=.9 pulseWidth=.1 tone=.4 damping=.7 release=1.2 stagger=.8 attack=.15 touch=.5 slowAgain=.6 accent=.7 | stream | round | Thin dry breaths in loose nines slow down out of step | texture
Frame drum weaver | Sevens on the loom | body=Skin slowness=6 quicken=2 damping=.4 tone=.5 pulseWidth=.35 rhythm=.8 release=1.5 volume=-5 touch=1 slowAgain=.6 lower=0 | near | broken | Plucked skin in sevens, each key with a beat of its own | drum
Gut and horn | Sevens on the loom | body=Skin slowness=4 quicken=1 tone=.9 rhythm=.3 pulseWidth=.6 lower=.7 stagger=0 damping=.6 attack=.01 release=1.2 touch=.9 volume=-12 slowAgain=.1 accent=.55 | console | lowcall | A dark plucked skin string, low and short | bass
Saddle and strap | Sevens on the loom | body=Skin path=Steps slowness=5 quicken=3 ratios=4 stagger=.8 rhythm=.7 pulseWidth=.15 damping=.7 bloom=.7 release=1 volume=-9 touch=.7 slowAgain=.2 lower=.15 accent=.8 | rattle | weave | Tight plucked skin in nines steps up five times
Nomad's doorflap | Sevens on the loom | body=Skin path=There_and_back slowness=7 quicken=6 agree=.4 lower=.5 damping=.1 tone=.7 pulseWidth=.8 release=5 stagger=.4 touch=1 slowAgain=.3 accent=.7 | bed | stack | Wide soft plucks on slack skin gather and loosen every six seconds
Hide stretched tight | Sevens on the loom | body=Skin path=Slowing slowness=5 quicken=1.5 ratios=5 damping=.9 pulseWidth=.05 rhythm=.9 tone=.25 stagger=.6 release=.3 accent=1 volume=-6.5 touch=.9 slowAgain=.8 lower=0 | slap | contrary | Hard plucked skin in elevens, dry as it slows | drum
Wattle fence | Wooden five to four | ratios=3 agree=.5 path=Glide slowness=6 stagger=.8 quicken=4 rhythm=.8 tone=.5 damping=.5 slowAgain=.65 lower=.5 | airy | sevenths | Wooden taps in half-kept sevens hurry and never quite line up
Clothes pegs | Wooden five to four | ratios=4 slowness=5 stagger=1 quicken=.5 rhythm=.9 tone=0 damping=.9 pulseWidth=.15 accent=.1 release=.5 volume=-5 touch=1 slowAgain=.9 | double | weave | Small wooden clicks in nines passed along a line | drum
Flax on the distaff | Wooden five to four | ratios=3 path=Glide slowness=3.5 quicken=8 rhythm=.6 tone=.8 lower=.5 pulseWidth=.6 attack=.1 stagger=.3 release=2 volume=-7 touch=.7 slowAgain=.15 | swirl | pedal | A whirr of wooden taps in sevens, eight seconds to a tone | keys
Notches on a stick | Wooden five to four | ratios=5 agree=.6 slowness=7.5 quicken=2 stagger=.5 damping=.15 tone=.5 pulseWidth=.4 release=4 accent=.8 touch=.9 slowAgain=.1 lower=.6 | crystals | entering | Ringing taps of wood slow to a loose count of elevens
Market awning | Wooden five to four | ratios=4 path=Steps slowness=6 quicken=5 rhythm=.7 bloom=.9 tone=.7 stagger=.4 pulseWidth=.7 damping=.3 release=3 touch=.7 slowAgain=.15 lower=.35 accent=.6 | reel | turning | Soft wooden taps in nines climb six steps in five seconds | keys
Moth wings on linen | Sevens on the loom | path=There_and_back slowness=4 quicken=4 rhythm=.5 tone=.5 pulseWidth=.1 damping=.4 release=2 stagger=.6 lift=.6 touch=.9 slowAgain=.8 | flutter | sevenths | Thin plucked glass in sevens shivers up and down every four seconds
Two looms, one rhythm | Sevens on the loom | path=There_and_back ratios=3 slowness=6 quicken=2 accent=1 stagger=0 rhythm=.8 tone=.6 damping=.55 release=1.5 volume=-6.5 touch=.75 slowAgain=.3 lower=.45 | throb | sevenths | Glass plucks in sevens meet, part and meet every two seconds
Shoal turning | Sevens on the loom | path=There_and_back ratios=5 slowness=8 quicken=15 attack=.8 tone=.95 rhythm=.4 damping=.05 release=10 stagger=.9 pulseWidth=.7 touch=.4 slowAgain=.3 lower=.9 bloom=.3 volume=-5 | hanging | entering | Ringing glass in elevens fills out slowly and empties again | pad
Plait of three | Sevens on the loom | path=There_and_back pulse=Tap body=Wood ratios=3 slowness=5 quicken=3 rhythm=.9 tone=.4 damping=.6 pulseWidth=.3 release=1 volume=-5.5 touch=1 slowAgain=.1 lower=.5 stagger=.5 | heads | weave | Wooden taps in sevens crowd and loosen every three seconds
Seams | Sevens on the loom | path=There_and_back pulse=Bow_stroke body=Air ratios=4 agree=.6 slowness=5 quicken=7 tone=.8 rhythm=.5 attack=.4 release=3 stagger=.5 width=.9 touch=.85 slowAgain=.4 accent=.1 | seasick | turning | Bowed air in loose nines opens and shuts along the chord | string
`,
    },
    {
      id: 'solitary-pulses',
      name: 'Solitary pulses',
      category: 'texture',
      rows: `
Cistern at noon | Solitary pulse | slowness=9 quicken=1.5 tone=.7 damping=.05 release=12 pulseWidth=.4 attack=1.05 touch=.1 slowAgain=1 accent=0 ratios=5 | cistern | single | One ringing drop on glass after another under a soft tone
Tap left running slow | Solitary pulse | slowness=8 quicken=.5 rhythm=1 tone=.1 attack=.05 pulseWidth=.1 damping=.5 release=2 stagger=.8 volume=5 touch=.3 slowAgain=.6 lower=.1 accent=.35 agree=.85 ratios=4 | tile | fourths | Hard little drops on glass fall by turns with barely a tone
Milk moon | Solitary pulse | slowness=10 quicken=5 tone=1 rhythm=.3 attack=1.08 pulseWidth=.95 width=1 release=16 lower=.5 volume=-6.5 touch=.3 slowAgain=.3 accent=.25 stagger=.3 agree=0 | redraw | entering | A very soft wide glass swell, a drop in it once every few seconds | pad
Icicles off the eaves | Solitary pulse | slowness=8.5 quicken=3 ratios=5 lift=.8 pulseWidth=.2 damping=.15 attack=.3 tone=.5 release=8 touch=.3 slowAgain=1 stagger=.6 | year | sevenths | Thin drops in elevens each lift their own glassy tone
Eye of the pond | Solitary pulse | path=There_and_back slowness=9 quicken=10 tone=.8 rhythm=.6 attack=.8 bloom=.8 damping=.3 release=5 touch=.3 slowAgain=.75 lower=.1 accent=.2 stagger=.75 volume=-6 | under | triad | Drops on glass that close up into a chord and draw apart again
Caretaker's keys | Wooden five to four | slowness=9 quicken=.5 rhythm=1 tone=.5 damping=.2 attack=.3 release=5 bloom=.1 volume=-2.5 touch=.5 slowAgain=1 lower=.45 accent=.7 | corridor | entering | Single taps of ringing wood, far between, with a chord behind
House at three | Wooden five to four | slowness=8 quicken=3 tone=.8 rhythm=.6 pulseWidth=.7 lower=.6 release=7 damping=.5 stagger=.6 volume=-5 touch=.3 slowAgain=.7 accent=0 agree=.8 | bed | turning | A low woody chord settles and slow soft knocks go on | pad
Chess by post | Wooden five to four | slowness=10 quicken=1 rhythm=.9 tone=.3 accent=0 damping=.6 pulseWidth=.2 attack=.02 volume=-3 touch=.5 slowAgain=.6 lower=.3 agree=.4 width=.05 | bare | knocks | A dry wooden tap, and long after it another
Rake in the gravel | Wooden five to four | slowness=9 quicken=6 lift=1 tone=.7 stagger=1 ratios=1 width=1 release=9 pulseWidth=.5 volume=-4 touch=.7 slowAgain=.3 lower=.1 accent=.25 | open | round | Each rare tap of wood raises the tone of its key, in threes
Lock on the canal | Wooden five to four | path=There_and_back slowness=8.5 quicken=14 tone=.6 rhythm=.9 damping=.1 lower=.8 attack=.4 release=6 volume=-6.5 slowAgain=.6 agree=.8 ratios=1 | crypt | stack | Dark ringing knocks draw together for seven seconds and then let go
Drum left out | Deep knocking | slowness=9 quicken=1 tone=.5 damping=.1 rhythm=.9 release=8 pulseWidth=.6 volume=-2 slowAgain=.2 lower=.45 accent=.55 agree=0 | outdoors | knocks | Drops on slack skin, one at a time, in no hurry | drum
Heart under the floor | Deep knocking | slowness=7 quicken=.8 tone=.7 lower=.9 pulseWidth=.95 damping=.5 release=3 attack=.2 width=0 touch=.95 slowAgain=.5 accent=.1 stagger=.2 agree=.3 ratios=1 | muffled | depth | A dull slow beat of skin in the middle of a dark low tone | bass
Mountain answering | Deep knocking | slowness=10 quicken=4 tone=.9 attack=5 lift=.6 damping=.05 release=14 stagger=.7 volume=-8 touch=.3 slowAgain=.35 lower=.45 accent=.55 agree=.6 ratios=1 | far | stack | A deep skin chord with rare long drops that answer each other | drone
Tent pole in a storm | Deep knocking | slowness=8 quicken=2 rhythm=1 tone=.2 pulseWidth=.1 damping=.7 ratios=4 release=1.5 volume=1 touch=.85 slowAgain=.2 lower=.25 accent=.45 stagger=.1 | clouds | sixths | Tight knocks of skin in nines with little tone between | drum
Clay jar of seeds | Deep knocking | pulse=Pluck slowness=8.5 quicken=1.5 tone=.4 damping=.4 pulseWidth=.3 stagger=.9 release=4 lower=.3 volume=-5.5 touch=.7 accent=0 agree=.2 | pot | broken | Plucked skin, slow and hollow, each key waiting for the last
Bare pear tree | - | pulse=Pluck body=Glass slowness=9 quicken=1 tone=.6 rhythm=.8 attack=1 damping=.15 release=8 slowAgain=.8 volume=0 touch=.3 accent=.55 agree=.7 ratios=3 pulseWidth=.9 lower=.4 | leaves | pairs | One glass pluck at a time over a thin chord
Needle and thimble | - | pulse=Pluck body=Glass slowness=8 quicken=.5 tone=.25 rhythm=1 damping=.75 pulseWidth=.1 attack=.02 release=1 accent=.8 volume=2 slowAgain=.6 lower=0 agree=.85 ratios=1 | thin | asking | Bright plucks of glass, one by one, with hardly a tone
Harp in an empty school | - | pulse=Pluck body=Wood slowness=8.5 quicken=2 tone=.7 rhythm=.7 damping=.1 pulseWidth=.6 release=7 attack=.1 lower=.7 touch=1 slowAgain=.3 accent=.6 agree=.5 ratios=5 volume=-1.5 | backwards | broken | Slow ringing plucks of wood over their own low octaves | plucked
Single oar | - | pulse=Pluck body=Air slowness=9 quicken=3 tone=.9 rhythm=.6 lift=.8 attack=1.2 pulseWidth=.8 release=6 width=.9 volume=-1 touch=.2 slowAgain=.8 lower=.75 stagger=.2 agree=.5 | water | fourths | A hollow chord lifted by one soft pluck at a time | pad
Wire over the valley | - | pulse=Pluck body=Skin slowness=8 quicken=2 tone=.6 rhythm=.9 damping=.05 lower=.9 release=12 pulseWidth=.4 attack=.4 touch=.3 slowAgain=.35 accent=.5 stagger=.15 | valley | twelfths | A deep plucked skin every few seconds above its lower octaves | drone
Ward after lights out | Breath engine | slowness=9 quicken=1 lift=.9 tone=.7 rhythm=.5 attack=.72 release=5 pulseWidth=.6 touch=.3 slowAgain=.3 lower=.45 accent=.6 agree=0 | lungs | triad | One breath of air at a time brings the chord up
Anchorage | Breath engine | slowness=10 quicken=3 tone=1 rhythm=.6 lower=.7 attack=.4 damping=.1 release=10 width=1 volume=-4.5 slowAgain=.8 accent=.8 stagger=.3 agree=.8 ratios=3 | sinking | stack | A dark hollow swell with very slow ringing breaths | pad
Fog in the keyhole | Breath engine | slowness=8 quicken=.5 tone=.05 rhythm=1 pulseWidth=.05 damping=.3 attack=.05 release=3 stagger=.5 volume=-1.5 touch=.3 slowAgain=.9 accent=0 agree=.2 | tunnel | contrary | Thin puffs of air, one key and then the next, almost without pitch
Byre before milking | Breath engine | body=Skin slowness=7 quicken=2 tone=.6 lift=.7 pulseWidth=.8 damping=.4 attack=.5 release=4 lower=1 volume=3 touch=.75 slowAgain=.3 accent=.2 agree=.4 | box | depth | Big slow breaths on skin with a dark tone in them | bass
Frozen waterfall ledge | Breath engine | body=Glass path=There_and_back slowness=9 quicken=16 tone=.8 rhythm=.5 attack=.3 bloom=.15 release=12 ratios=3 damping=.1 volume=-1 touch=.35 slowAgain=.9 lower=.35 stagger=.15 | frozen | sevenths | Breath on ringing glass in sevens, stirred once in sixteen seconds | pad
Swing in the wind | Bowed tide | path=Glide slowness=9 quicken=1 rhythm=.8 tone=.6 attack=.76 damping=.6 release=5 pulseWidth=.9 volume=-7.5 touch=.3 slowAgain=.6 lower=.75 accent=.2 | outdoors | single | A bowed creak of air every second or two over one hollow tone
Gate at the end of land | Bowed tide | body=Wood path=Glide slowness=8 quicken=.6 rhythm=1 tone=.3 damping=.15 pulseWidth=.25 attack=.1 release=4 stagger=.8 volume=-0.5 touch=.3 slowAgain=.75 lower=.75 accent=.55 agree=.85 | valley | triad | Slow creaks of ringing wood answer from key to key
Whetstone | Bowed tide | body=Glass path=Glide slowness=8.5 quicken=2 rhythm=.7 tone=.5 pulseWidth=.15 damping=.6 attack=.36 release=3 ratios=4 volume=-0.5 touch=.1 slowAgain=1 lower=.35 accent=.6 | trail | pairs | Single dry strokes on glass, tuned in nines
Long shift | Bowed tide | body=Skin path=Slowing slowness=9 quicken=5 tone=.9 lower=.8 rhythm=.6 attack=.85 release=8 pulseWidth=.8 touch=.3 accent=.5 stagger=.9 | overtone | stack | A low bowed skin chord slows to strokes that hardly come | drone
Cello case ajar | Bowed tide | body=Wood path=Glide slowness=10 quicken=4 tone=1 rhythm=.4 attack=.3 bloom=0 lift=.5 release=10 pulseWidth=.9 width=.4 touch=.85 slowAgain=.1 lower=.9 accent=.6 stagger=.9 agree=.3 | strings | stack | A warm slow swell of wood with one wide bow stroke now and then | string
Lighthouse keeper | Bells agreeing | slowness=9 quicken=1 tone=.8 attack=1.2 rhythm=.7 damping=.1 release=10 lift=.6 volume=1.5 touch=.2 slowAgain=.8 accent=.6 stagger=.75 agree=0 pulseWidth=.55 | circle | fourths | One tap on glass turns past every few seconds | pad
Pin dropped | Bells agreeing | slowness=8 quicken=.5 tone=.2 pulseWidth=.05 damping=.4 rhythm=1 attack=.01 release=2.5 accent=1 volume=-2 touch=.9 slowAgain=.1 stagger=.9 width=.1 | chamber | chimes | A needle thin tap on glass, and after it another | bell
Buoy on a flat sea | Bells agreeing | slowness=8.5 quicken=4 ratios=1 lower=.9 tone=.7 damping=.05 release=12 pulseWidth=.7 stagger=.4 touch=.7 slowAgain=1 accent=.2 | crystals | twelfths | Round ringing glass taps in threes over low octaves
Verdigris | Bells agreeing | slowness=9 quicken=8 agree=0 ratios=5 rhythm=.8 tone=.5 damping=.25 release=6 attack=.3 pulseWidth=.35 touch=.3 slowAgain=.1 accent=.8 stagger=.75 | metal | entering | Tempered glass taps, far apart, that never fall in with each other
Bell for nobody | Bells agreeing | path=Slowing slowness=10 quicken=2 tone=.9 lower=.6 attack=.02 release=14 pulseWidth=.6 bloom=.1 slowAgain=0 volume=-7.5 touch=.9 accent=.6 stagger=.75 | cave | depth | A deep glass stroke, and then hardly one more | bell
Bubble rising | - | pulse=Drop body=Air slowness=9 quicken=1 tone=.5 rhythm=.9 damping=.1 attack=.36 release=5 pulseWidth=.5 volume=2 slowAgain=.1 lower=.55 accent=.45 agree=.3 ratios=5 | under | broken | Single hollow drops in a pale chord
Well in the yard | - | pulse=Drop body=Air slowness=8 quicken=.6 tone=.3 rhythm=1 damping=.02 pulseWidth=.2 attack=.05 release=7 stagger=.7 volume=2.5 touch=.7 slowAgain=.6 agree=.6 | dark | knocks | Clear ringing drops in a deep column of air
Moored balloons | - | pulse=Drop body=Air slowness=9.5 quicken=6 tone=1 rhythm=.4 attack=.4 width=1 pulseWidth=.9 release=9 lower=.4 lift=.3 agree=.3 volume=-4.5 touch=.3 slowAgain=.8 accent=.6 stagger=.3 | drift | turning | A wide hollow swell that a slow drop nudges from time to time | pad
Pigeon loft at night | - | pulse=Drop body=Air slowness=8.5 quicken=2 ratios=4 tone=.6 lift=1 damping=.6 attack=.2 release=3 pulseWidth=.7 stagger=1 volume=2.5 touch=.8 slowAgain=.75 lower=.15 accent=.6 | felt | round | Soft coos in nines, each one lifting its own small tone | wind
Bathyscaphe | - | pulse=Drop body=Air path=Slowing slowness=9 quicken=10 lower=1 tone=.9 attack=.51 rhythm=.7 damping=.15 release=10 pulseWidth=.6 volume=-7 touch=.3 slowAgain=.2 accent=.55 stagger=.9 agree=.4 ratios=1 | glacial | depth | A deep hollow tone slows for ten seconds until drops are all that move | drone
Waiting room clock | Quickening chord | slowness=8 quicken=.5 rhythm=.9 tone=.6 attack=.4 damping=.7 accent=0 bloom=.1 release=2 touch=.7 slowAgain=.6 agree=.8 ratios=3 | record | triad | Dry wooden ticks, even and slow, through a plain chord
Snow off the roof | Quickening chord | slowness=10 quicken=12 rhythm=.6 tone=.9 attack=5 damping=.2 release=12 pulseWidth=.95 bloom=.1 touch=.3 slowAgain=.15 lower=.55 accent=.8 stagger=.4 agree=.3 | mist | entering | A very slow woody swell with a soft thud once in a long while | pad
Pebble in a boot | Quickening chord | body=Skin slowness=8.5 quicken=1 rhythm=1 tone=.5 ratios=3 damping=.5 attack=.05 stagger=.6 release=2.5 pulseWidth=.15 volume=-2 touch=.75 slowAgain=.2 lower=.05 | cupboard | sevenths | Small hard taps on skin in sevens, spaced wide | drum
Tall empty chimney | Quickening chord | body=Air slowness=9 quicken=3 rhythm=.7 tone=.8 lift=.9 attack=.8 damping=.1 release=6 lower=.6 volume=-2 touch=.7 slowAgain=.6 stagger=.3 agree=.7 | pipe | stack | Slow taps in a tall column of air, each raising the chord
Spotter in the tower | Quickening chord | body=Air path=There_and_back slowness=9 quicken=20 rhythm=.8 tone=.4 pulseWidth=.3 damping=.4 release=4 stagger=.5 accent=.9 volume=5 touch=.1 slowAgain=.9 lower=.15 agree=.7 ratios=5 | night | pairs | Rare taps of air close in for ten seconds and spread out again
Only the moving parts | Tremolo hymn | slowness=8 lift=1 tone=1 rhythm=.05 attack=.3 release=5 stagger=1 pulseWidth=.5 slowAgain=.9 lower=.9 accent=.7 agree=.2 volume=-14.5 | bare | entering | The chord is heard only where slow unheard taps lift it, key by key | pad
Beam of the harbour | Tremolo hymn | body=Glass slowness=9 lift=1 tone=.9 rhythm=.2 attack=1 damping=.1 release=9 pulseWidth=.7 width=1 volume=0.5 touch=.2 slowAgain=.6 lower=.55 accent=.8 stagger=.2 agree=.1 | light | fourths | Glass tones come up one at a time with long dark between | pad
Breathing statues | Tremolo hymn | pulse=Breath body=Skin slowness=9 lift=.9 rhythm=.5 attack=1.2 lower=.8 tone=.8 release=6 pulseWidth=.8 volume=0 touch=.5 slowAgain=.7 accent=.7 ratios=5 | choirhall | turning | Slow breaths on skin lift a low chord and leave it | voice
Two flags, far hills | Tremolo hymn | pulse=Pluck body=Air slowness=8 lift=.95 rhythm=.7 tone=.45 attack=.05 damping=.8 release=2 accent=.9 ratios=1 stagger=.5 volume=-1 slowAgain=.2 lower=1 pulseWidth=.95 | prism | pairs | Dull plucks in threes, each opening its tone like a signal | plucked
Sea seen from a train | Tremolo hymn | pulse=Bow_stroke slowness=9 lift=.8 rhythm=.4 attack=.2 lower=.5 tone=.9 release=8 pulseWidth=.85 width=.9 volume=3 touch=.8 slowAgain=.4 accent=.5 ratios=1 | ensemble | stack | Wide slow bow strokes on wood lift a broad chord and set it down | string
`,
    },
  ],
}
