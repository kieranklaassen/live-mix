// Coast Fog Four-Track: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'four-track-hand-labelled-hall',
    name: 'Hand-labelled hall',
    category: 'space',
    description:
      'A hall whose lows ring on long after the rest has gone, then a tape reel with soft saturation, slight wobble and hiss.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Warm undertow' },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
    ],
  },
  {
    id: 'four-track-hall-one-room-over',
    name: 'Hall one room over',
    category: 'space',
    description:
      'A large hall heard alone with none of the dry sound left, then a thick, soft cassette, full in the lows and dull on top.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Full wet send' },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'four-track-porch-hall',
    name: 'Porch hall',
    category: 'space',
    description:
      'A hall of about four seconds with no dry sound in it, then a worn dictation cassette, dull, trembling and full of hiss.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Full wet send' },
      { deviceId: 'tape', preset: 'Old dictation', params: { output: -2.67 } },
    ],
  },
  {
    id: 'four-track-harbour-plate',
    name: 'Harbour plate',
    category: 'space',
    description:
      'A dark plate whose tail is soft on top, then a worn cassette that wobbles, drops out and hisses.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 16.8 } },
      { deviceId: 'patina', preset: 'Worn cassette' },
    ],
  },
  {
    id: 'four-track-mudflat-plate',
    name: 'Mudflat plate',
    category: 'space',
    description:
      'A medium plate with a smooth tail of a few seconds, then an old slow reel that drifts, dulls, drops out and hisses.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { predelayMs: 21.5 } },
      { deviceId: 'tape', preset: 'Worn thin' },
    ],
  },
  {
    id: 'four-track-bedroom-tremor',
    name: 'Bedroom tremor',
    category: 'space',
    description:
      'A space whose tail flutters quickly in pitch, then a muffled cassette, its top rolled off and its lows lifted.',
    effects: [
      { deviceId: 'expanse', preset: 'Fast flutter', params: { decay: 5.04 } },
      { deviceId: 'tape', preset: 'Under a blanket' },
    ],
  },
  {
    id: 'four-track-fogbank-drone',
    name: 'Fogbank drone',
    category: 'space',
    description:
      'A smooth swell that brings every note in like bowed strings, into four long strings on an A minor chord held in the centre.',
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 301, release: 636 } },
      { deviceId: 'sympathetic', preset: 'Centre drone' },
    ],
  },
  {
    id: 'four-track-kerosene-swell',
    name: 'Kerosene swell',
    category: 'space',
    description:
      'A high cut set low enough to muffle everything, then a dark mono cellar, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.57 } },
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar' },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 14.3, modRate: 0.282 } },
    ],
  },
  {
    id: 'four-track-fifths-in-salt-air',
    name: 'Fifths in salt air',
    category: 'space',
    description:
      'A mellow reverb whose tail drifts down towards the fifth, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Falling fifths' },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'four-track-shore-road-haze',
    name: 'Shore-road haze',
    category: 'space',
    description:
      'A wash of three fed-back tape heads that hovers and fades, then two dull copies a few cents off, tucked behind the sound.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Hovering wash' },
      { deviceId: 'stereo-detune', preset: 'Soft halo', params: { delay: 12.5 } },
    ],
  },
  {
    id: 'four-track-driftwood-plate',
    name: 'Driftwood plate',
    category: 'space',
    description:
      'A plate wash that hangs on for half a minute, then a sharp copy and a flat one, full-range, wide to either side.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { predelayMs: 56.1 } },
      { deviceId: 'stereo-detune', preset: 'Wider', params: { delay: 20.7 } },
    ],
  },
  {
    id: 'four-track-cannery-tunnel',
    name: 'Cannery tunnel',
    category: 'space',
    description:
      'A dull mono tunnel with a tail of several seconds, then a parallel compressor that lifts quiet playing and tails.',
    effects: [
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { decay: 5.31 } },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 426, release: 3.08 } },
    ],
  },
  {
    id: 'four-track-depths-on-the-ebb',
    name: 'Depths on the ebb',
    category: 'space',
    description:
      'A combo amplifier driven hard and recorded right up close, into a deep dark well of slow blurred echoes.',
    effects: [
      { deviceId: 're-amp', preset: 'Speaker on the edge', params: { output: -4.24 } },
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { length: 1.03, glide: 0.655 } },
    ],
  },
  {
    id: 'four-track-off-season-hall',
    name: 'Off-season hall',
    category: 'space',
    description:
      'A late copy on each side, like the same part played twice, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'chorus', preset: 'Loose double' },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 61.1, midDecay: 1.9 },
      },
    ],
  },
  {
    id: 'four-track-plate-off-the-jetty',
    name: 'Plate off the jetty',
    category: 'space',
    description:
      'A wobbling tape double a moment behind each note, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Wobbly double', params: { time: 34.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 40.6 } },
    ],
  },
  {
    id: 'four-track-swell-in-fog',
    name: 'Swell in fog',
    category: 'space',
    description:
      'A rotating speaker at a standstill, heard close and in mono, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'rotary', preset: 'Stopped horn' },
      { deviceId: 'fdn-reverb', preset: 'Slow swell' },
    ],
  },
  {
    id: 'four-track-shore-road-hall',
    name: 'Shore-road hall',
    category: 'space',
    description:
      'A short swell that rounds the front off every note, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack' },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 12.4 } },
    ],
  },
  {
    id: 'four-track-hall-by-the-shore',
    name: 'Hall by the shore',
    category: 'space',
    description:
      'A mid-forward tone with the lows and the top trimmed, into a huge dark open space that answers late and rings on.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.37 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 11.1, predelayMs: 117, breathRate: 0.268, mix: 0.27 },
      },
    ],
  },
  {
    id: 'four-track-punched-in-room',
    name: 'Punched-in room',
    category: 'space',
    description:
      'A deep slow chorus on a long delay, swaying over seconds, into a far-off room laid in beneath the sound.',
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea' },
      { deviceId: 're-amp', preset: 'Room underneath', params: { output: 6.89 } },
    ],
  },
  {
    id: 'four-track-track-four-cellar',
    name: 'Track-four cellar',
    category: 'space',
    description:
      'Dark, thick valve grit that fills out the low end, into a dark cellar of a room that folds the sound to mono.',
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit', params: { outputDb: -20.9 } },
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar', params: { decay: 3.24 } },
    ],
  },
  {
    id: 'four-track-tide-flat-cathedral',
    name: 'Tide-flat cathedral',
    category: 'space',
    description:
      'An overloaded console channel under the clean sound, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Crushed', params: { output: -2.82 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'four-track-echoes-far-back',
    name: 'Echoes far back',
    category: 'space',
    description:
      'The first hint of weight from a tape preamp, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 21, modRate: 0.275 } },
    ],
  },
  {
    id: 'four-track-salt-air-bloom',
    name: 'Salt-air bloom',
    category: 'space',
    description:
      'A reverb that swells in after each note and fades away, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 2.49, mix: 0.396 } },
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.46 } },
    ],
  },
  {
    id: 'four-track-tarpaper-haze',
    name: 'Tarpaper haze',
    category: 'space',
    description:
      'Two dark late copies that shadow the sound on either side, into a short diffuse haze around the sound, like a small room.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Shadow' },
      { deviceId: 'spectral-blur', preset: 'Diffuse room' },
    ],
  },
  {
    id: 'four-track-river-bar-room',
    name: 'River-bar room',
    category: 'space',
    description:
      'A hard-clipped copy held at one level under the clean sound, into a small damped room that is over within a second.',
    effects: [
      { deviceId: 'saturator', preset: 'Sustain bed' },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'four-track-hemlock-voices',
    name: 'Hemlock voices',
    category: 'space',
    description:
      'An equaliser that adds lows and body and eases the top, into a wordless choir alone with none of the dry sound left.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.37 } },
      { deviceId: 'vowel-reverb', preset: 'Choir alone' },
    ],
  },
  {
    id: 'four-track-shingle-choir',
    name: 'Shingle choir',
    category: 'space',
    description:
      'A cathedral whose long tail sings a soft open "ah", into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Cathedral' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 15.1 } },
    ],
  },
  {
    id: 'four-track-loop-in-wet-wool',
    name: 'Loop in wet wool',
    category: 'echo',
    description:
      'A short tape loop where each pass comes back quieter, into a large reverb whose tail hums a deep "oh" in bass voices.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow fade', params: { length: 1.9 } },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 10.5, preDelay: 19.6 } },
    ],
  },
  {
    id: 'four-track-one-take-trace',
    name: 'One-take trace',
    category: 'echo',
    description:
      'A faint afterimage of a tape loop behind the playing, into a huge hall whose tail hums a soft "oo" for a long while.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Faint afterimage', params: { length: 3.47 } },
      { deviceId: 'vowel-reverb', preset: 'Endless oo' },
    ],
  },
  {
    id: 'four-track-loop-at-low-tide',
    name: 'Loop at low tide',
    category: 'echo',
    description:
      'A tape loop that never fades and holds every layer, into faint voices singing behind the sound.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Endless hold', params: { length: 7.62 } },
      { deviceId: 'vowel-reverb', preset: 'Faint voices' },
    ],
  },
  {
    id: 'four-track-borrowed-echo',
    name: 'Borrowed echo',
    category: 'echo',
    description:
      'A tape echo whose three heads make a cluster of each repeat, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 593 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'four-track-wash-under-cloud',
    name: 'Wash under cloud',
    category: 'echo',
    description:
      'Dotted tape repeats that pile up in a darkening wash, into a reverb whose tail drifts up towards the fifth as it rings.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Dub wash', params: { time: 825 } },
      { deviceId: 'bloom-reverb', preset: 'Rising fifths', params: { decay: 8.58 } },
    ],
  },
  {
    id: 'four-track-echo-between-takes',
    name: 'Echo between takes',
    category: 'echo',
    description:
      'Two tape heads that make every repeat gallop, into a cave whose echoes bend slowly up and down in pitch.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 653 } },
      { deviceId: 'swarm-reverb', preset: 'Bending', params: { length: 0.542, glide: 1.88 } },
    ],
  },
  {
    id: 'four-track-overdubbed-echo',
    name: 'Overdubbed echo',
    category: 'echo',
    description:
      'A dull, wobbling, saturated echo on worn tape, then a gentle high cut that shades the top end.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape' },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.47 } },
    ],
  },
  {
    id: 'four-track-november-repeats',
    name: 'November repeats',
    category: 'echo',
    description:
      'Tape repeats that lose their lows and thin out as they fade, then an equaliser that takes presence, air and lows away.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { time: 291 } },
      { deviceId: 'ambient-eq', preset: 'Distant' },
    ],
  },
  {
    id: 'four-track-woodstove-echo',
    name: 'Woodstove echo',
    category: 'echo',
    description:
      'A slow swell after each silence, opening late in its rise, then a bucket-brigade echo whose soft repeats dull as they fade.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise' },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 393, modRate: 0.605 } },
    ],
  },
  {
    id: 'four-track-quilt-echo',
    name: 'Quilt echo',
    category: 'echo',
    description:
      'A bucket-brigade echo with a slow chorus on its repeats, into a single saturated tape echo close behind each note.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 279, modRate: 0.932 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 94.8 } },
    ],
  },
  {
    id: 'four-track-haze-under-eaves',
    name: 'Haze under eaves',
    category: 'echo',
    description:
      'A wide, muffled loop of the last phrase, as if under water, into a medium hall with only a breath of voice in its tail.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Underwater', params: { length: 2.21 } },
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { decay: 3.49, preDelay: 17.5 } },
    ],
  },
  {
    id: 'four-track-reel-in-november',
    name: 'Reel in November',
    category: 'echo',
    description:
      'A low, dark tape loop played backwards at half speed, into a hall of about four seconds with no dry sound in it.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow backwards' },
      {
        deviceId: 'hall-reverb',
        preset: 'Full wet send',
        params: { preDelay: 22.1, lowDecay: 4.07, midDecay: 4.02 },
      },
    ],
  },
  {
    id: 'four-track-small-hours-drift',
    name: 'Small-hours drift',
    category: 'echo',
    description:
      'A fast, steady reel with soft saturation, then a slowly drifting echo, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { output: -3.21 } },
      { deviceId: 'analog-delay', preset: 'Slow drift', params: { time: 611, modRate: 0.0985 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'four-track-rain-gutter-layers',
    name: 'Rain-gutter layers',
    category: 'echo',
    description:
      'A tape loop that plays its layers back in reverse, into a small room that is over in about a second.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Backwards layers', params: { length: 6.15 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Room',
        params: { preDelay: 31.1, lowDecay: 1.55, midDecay: 1.17 },
      },
    ],
  },
  {
    id: 'four-track-rented-repeats',
    name: 'Rented repeats',
    category: 'echo',
    description:
      'A deep pitch wobble, like a warped tape, then a bucket-brigade echo whose soft repeats dull as they fade.',
    effects: [
      { deviceId: 'chorus', preset: 'Warped tape' },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 371, modRate: 0.652 } },
    ],
  },
  {
    id: 'four-track-ninety-minute-hiss',
    name: 'Ninety-minute hiss',
    category: 'tape',
    description:
      'A four-track cassette, dull on top, unsteady and hissing, then hiss that swells in the gaps, into a dark, very long hall.',
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track' },
      {
        deviceId: 'noise-floor',
        preset: 'Breathing tape',
        params: { response: 0.869, hold: 14.2 },
      },
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0884 } },
    ],
  },
  {
    id: 'four-track-tidewater-hiss',
    name: 'Tidewater hiss',
    category: 'tape',
    description:
      'A slow reel whose pitch sways widely and never settles, then a thin, even trace of tape hiss, heard in the pauses, into a far-off hall.',
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { output: -3.18 } },
      { deviceId: 'noise-floor', preset: 'Faint hiss' },
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 21.9, lowDecay: 4.91, midDecay: 4.41 },
      },
    ],
  },
  {
    id: 'four-track-trestle-hiss',
    name: 'Trestle hiss',
    category: 'tape',
    description:
      'A worn cassette that wobbles, drops out and hisses, then muffled tape hiss, steady and thick, into a big muffled cave.',
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { output: 2.39 } },
      { deviceId: 'noise-floor', preset: 'Muffled hiss', params: { response: 0.405, hold: 11.2 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 6.16, breathRate: 0.336 } },
    ],
  },
  {
    id: 'four-track-hiss-on-track-four',
    name: 'Hiss on track four',
    category: 'tape',
    description:
      'A hissing, unsteady cassette, then a wide wall of tape hiss, into three long-ringing springs with all the top taken off.',
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { output: -2.61 } },
      { deviceId: 'noise-floor', preset: 'Wall of hiss' },
      { deviceId: 'spring-reverb', preset: 'Underwater' },
    ],
  },
  {
    id: 'four-track-porch-drift',
    name: 'Porch drift',
    category: 'tape',
    description:
      'A slowly drifting chorus, then a reel with a little hiss, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'four-track-double-by-one-lamp',
    name: 'Double by one lamp',
    category: 'tape',
    description:
      'Two copies a moment late, then a tape loop that wears away, into three long-ringing springs with all the top taken off.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Late copy' },
      { deviceId: 'tape-loop', preset: 'Worn out', params: { length: 3.37 } },
      { deviceId: 'spring-reverb', preset: 'Underwater' },
    ],
  },
  {
    id: 'four-track-mudflat-drift',
    name: 'Mudflat drift',
    category: 'tape',
    description:
      'An overloaded tape preamp, then a slow reel that sways, into a small dark room that is gone in about a second.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Worn tape' },
      { deviceId: 'tape', preset: 'Seasick', params: { output: -4.67 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { decay: 1.33, modRate: 0.846 } },
    ],
  },
  {
    id: 'four-track-low-cloud-tape',
    name: 'Low-cloud tape',
    category: 'tape',
    description:
      'A valve stage that gives way under loud notes, tails rising, then a worn dictation cassette, dull, trembling and full of hiss.',
    effects: [
      { deviceId: 'patina', preset: 'Valve bloom' },
      { deviceId: 'tape', preset: 'Old dictation', params: { output: -2.83 } },
    ],
  },
  {
    id: 'four-track-overcast-hiss',
    name: 'Overcast hiss',
    category: 'tape',
    description:
      'A four-track cassette, dull on top, unsteady and hissing, then a trace of tape hiss, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { output: -2.15 } },
      { deviceId: 'noise-floor', preset: 'Faint hiss', params: { response: 0.36, hold: 11.4 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'four-track-november-hiss',
    name: 'November hiss',
    category: 'tape',
    description:
      'A worn cassette that wobbles, drops out and hisses, then steady tape hiss, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette' },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { response: 0.419, hold: 12.8 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 73.1, lowDecay: 7.24, midDecay: 6.23 },
      },
    ],
  },
  {
    id: 'four-track-one-take-double',
    name: 'One-take double',
    category: 'tape',
    description:
      'Spiralling detuned repeats, then a worn cassette that wobbles, drops out and hisses, into a hall with no dry sound.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Spiral', params: { delay: 45.8 } },
      { deviceId: 'patina', preset: 'Worn cassette' },
      { deviceId: 'fdn-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'four-track-mill-town-reel',
    name: 'Mill-town reel',
    category: 'tape',
    description:
      'A reel driven as hard as it goes, thick with harmonics, then steady tape hiss that lingers after the last note.',
    effects: [
      { deviceId: 'tape', preset: 'Needles pinned' },
      { deviceId: 'noise-floor', preset: 'Tape floor' },
    ],
  },
  {
    id: 'four-track-bedroom-cassette',
    name: 'Bedroom cassette',
    category: 'tape',
    description:
      'A ruined cassette that lurches, drops out and hisses hard, then an echo about four seconds late over older recalled phrases.',
    effects: [
      { deviceId: 'patina', preset: 'Falling apart' },
      { deviceId: 'echo-memory', preset: 'Late return', params: { reach: 43.8, size: 4.23 } },
    ],
  },
  {
    id: 'four-track-tape-by-one-lamp',
    name: 'Tape by one lamp',
    category: 'tape',
    description:
      'A sagging valve stage, then a four-track cassette, dull on top, unsteady and hissing, into a tight little room.',
    effects: [
      { deviceId: 'patina', preset: 'Valve bloom' },
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'four-track-tape-up-the-stairs',
    name: 'Tape up the stairs',
    category: 'tape',
    description:
      'A worn dictation cassette, dull, trembling and full of hiss, into a small plate that is gone in a second or two.',
    effects: [
      { deviceId: 'tape', preset: 'Old dictation' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { predelayMs: 8.97 } },
    ],
  },
  {
    id: 'four-track-memory-in-one-take',
    name: 'Memory in one take',
    category: 'tape',
    description:
      'Earlier moments of the playing that keep drifting back, then a flaking, hissing reel that ducks and dulls at random.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'No echo',
        params: { time: 525, reach: 20.4, size: 2.73 },
      },
      { deviceId: 'tape', preset: 'Crumbling oxide', params: { output: 2.38 } },
    ],
  },
  {
    id: 'four-track-cassette-in-the-dark',
    name: 'Cassette in the dark',
    category: 'tape',
    description:
      'A half-speed tape loop, then a thick, soft cassette, into a hall with about two and a half seconds of tail.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down' },
      { deviceId: 'tape', preset: 'Warm thump' },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { preDelay: 64.6, lowDecay: 2.8, midDecay: 2.49 },
      },
    ],
  },
  {
    id: 'four-track-reel-by-the-shore',
    name: 'Reel by the shore',
    category: 'tape',
    description:
      'An old slow reel that drifts, dulls, drops out and hisses, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'tape', preset: 'Worn thin', params: { output: -5.36 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'four-track-rain-day-spiral',
    name: 'Rain-day spiral',
    category: 'tape',
    description:
      'Repeats that rise in pitch on the left and sink on the right, then a muffled cassette, into a far-off hall.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Spiral', params: { delay: 42 } },
      { deviceId: 'tape', preset: 'Under a blanket', params: { output: -2.2 } },
      { deviceId: 'hall-reverb', preset: 'Far away' },
    ],
  },
  {
    id: 'four-track-amp-kept-indoors',
    name: 'Amp kept indoors',
    category: 'tape',
    description:
      'A small amplifier muffled as if under a pillow, into a quiet plate tail that comes in late behind each note.',
    effects: [
      { deviceId: 're-amp', preset: 'Pillow speaker' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { predelayMs: 88.3 } },
    ],
  },
  {
    id: 'four-track-homemade-cassette',
    name: 'Homemade cassette',
    category: 'tape',
    description:
      'A thick, soft cassette, then the low, wide rumble of an empty room, into a long dark reverb whose tail sinks slowly in pitch.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump', params: { output: 3.56 } },
      { deviceId: 'noise-floor', preset: 'Empty room' },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { decay: 22.7 } },
    ],
  },
  {
    id: 'four-track-tape-under-cloud',
    name: 'Tape under cloud',
    category: 'tape',
    description:
      'A dark amplifier stack with the bass full up and no treble, then an overdriven reel, into a two-spring tank with a little chirp and drip.',
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly' },
      { deviceId: 'tape', preset: 'Needles pinned' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { decay: 2.29 } },
    ],
  },
  {
    id: 'four-track-wet-road-tape',
    name: 'Wet-road tape',
    category: 'tape',
    description:
      'A muffled cassette, its top rolled off and its lows lifted, then thin bright air from a microphone, hardly moving.',
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket' },
      { deviceId: 'noise-floor', preset: 'Thin bright air' },
    ],
  },
  {
    id: 'four-track-played-out-reel',
    name: 'Played-out reel',
    category: 'tape',
    description:
      'A slow reel that sways, then tape hiss that rises with each note and dies with it, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'tape', preset: 'Seasick' },
      { deviceId: 'noise-floor', preset: 'Riding hiss', params: { response: 0.143, hold: 2.22 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 14.5, modRate: 0.319 } },
    ],
  },
  {
    id: 'four-track-ninety-minute-reel',
    name: 'Ninety-minute reel',
    category: 'tape',
    description:
      'A tape loop that wears away, then a pure, low electrical hum that sits in the centre, into taut springs that ring long.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Worn out', params: { length: 2.73 } },
      { deviceId: 'noise-floor', preset: 'Mains hum' },
      { deviceId: 'spring-reverb', preset: 'Tight long tank' },
    ],
  },
  {
    id: 'four-track-small-hours-reel',
    name: 'Small-hours reel',
    category: 'tape',
    description:
      'A flaking, hissing reel that ducks and dulls at random, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      { deviceId: 'tape', preset: 'Crumbling oxide', params: { output: -2.35 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'four-track-estuary-reel',
    name: 'Estuary reel',
    category: 'tape',
    description:
      'A tape preamp overloaded until it breaks up, dull and thick, then a flaking, hissing reel that ducks and dulls at random.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Worn tape' },
      { deviceId: 'tape', preset: 'Crumbling oxide', params: { output: -2.56 } },
    ],
  },
  {
    id: 'four-track-tremolo-under-eaves',
    name: 'Tremolo under eaves',
    category: 'motion',
    description:
      'A shudder in the level, too fast to count, into a damped hall of about five seconds, heard from far off.',
    effects: [
      { deviceId: 'tremolo', preset: 'Fast shudder', params: { rate: 17.1 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 21, lowDecay: 5.4, midDecay: 4.31 },
      },
    ],
  },
  {
    id: 'four-track-cloud-out-of-season',
    name: 'Cloud out of season',
    category: 'motion',
    description:
      'A dense many-notched phaser drifting opposite on each side, into a wide room heard from its far end.',
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { rate: 0.108 } },
      { deviceId: 'ether-reverb', preset: 'Distant' },
    ],
  },
  {
    id: 'four-track-spare-room-tremolo',
    name: 'Spare-room tremolo',
    category: 'motion',
    description:
      'A quick harmonic tremolo with its two sides in opposite step, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'tremolo', preset: 'Wide shimmer', params: { rate: 5.66 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 72.5, lowDecay: 6.63, midDecay: 6.06 },
      },
    ],
  },
  {
    id: 'four-track-slack-belt-wobble',
    name: 'Slack-belt wobble',
    category: 'motion',
    description:
      'A deep pitch wobble with the two sides bending out of step, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'tremolo', preset: 'Wide wobble' },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'four-track-pulse-by-the-stove',
    name: 'Pulse by the stove',
    category: 'motion',
    description:
      'A hard pan that jumps from one side to the other, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'tremolo', preset: 'Side to side' },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'four-track-hemlock-tremolo',
    name: 'Hemlock tremolo',
    category: 'motion',
    description:
      'A harmonic tremolo whose lows and highs trade places quickly, into a small dark room that is gone in about a second.',
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 3.43 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { decay: 1.24, modRate: 0.893 } },
    ],
  },
  {
    id: 'four-track-chorus-still-rolling',
    name: 'Chorus still rolling',
    category: 'motion',
    description:
      'An overloaded tape preamp, then a thin chorus of one copy bending against the dry sound, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Worn tape', params: { output: -6.87 } },
      { deviceId: 'tremolo', preset: 'Slow chorus', params: { rate: 0.711 } },
      { deviceId: 'plate-reverb', preset: 'Long plate' },
    ],
  },
  {
    id: 'four-track-shingle-glow',
    name: 'Shingle glow',
    category: 'texture',
    description:
      'A thin held pad with no lows that swells in behind the notes, into thirteen drone strings in D major kept near the centre.',
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Thin halo',
        params: { attack: 0.949, glide: 0.993, mix: 0.12 },
      },
      { deviceId: 'sympathetic', preset: 'Sitar drone', params: { mix: 0.24 } },
    ],
  },
  {
    id: 'four-track-bounced-wash',
    name: 'Bounced wash',
    category: 'texture',
    description:
      'A combo amplifier recorded fairly close in a small room, then a wide, darkened wash in which every note slowly dissolves.',
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room', params: { output: -4.82 } },
      { deviceId: 'spectral-blur', preset: 'Slow dissolve' },
    ],
  },
  {
    id: 'four-track-buried-swells',
    name: 'Buried swells',
    category: 'texture',
    description:
      'The playing turned backwards in place of the dry sound, into a clean speaker at the far end of a big, echoing room.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Backwards only', params: { time: 933 } },
      { deviceId: 're-amp', preset: 'Far end of the hall' },
    ],
  },
  {
    id: 'four-track-oilskin-fifth',
    name: 'Oilskin fifth',
    category: 'texture',
    description:
      'Scattered grains a fifth down, spread across both sides, into three springs heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fifth down grains', params: { length: 82.3 } },
      { deviceId: 'spring-reverb', preset: 'Tank alone', params: { decay: 3.29 } },
    ],
  },
  {
    id: 'four-track-alder-pad',
    name: 'Alder pad',
    category: 'texture',
    description:
      'A slow drone that swells from the playing and never fades, into a wide hall that answers about a fifth of a second late.',
    effects: [
      { deviceId: 'sustainer', preset: 'Endless drone', params: { attack: 3.19, glide: 3.86 } },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { predelayMs: 185 } },
    ],
  },
  {
    id: 'four-track-salt-air-wash',
    name: 'Salt-air wash',
    category: 'texture',
    description:
      'A quick fade-in that only softens the edge of each note, then a dark, bassy wash, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { attack: 50.4, release: 63 } },
      { deviceId: 'spectral-blur', preset: 'Dark water', params: { mix: 0.36 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { predelayMs: 18.8, mix: 0.18 } },
    ],
  },
  {
    id: 'four-track-net-shed-depths',
    name: 'Net-shed depths',
    category: 'texture',
    description:
      'A blurred bed of bass that hangs low under the sound, then two copies in tune that wander like extra takes.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Sub bed' },
      { deviceId: 'stereo-detune', preset: 'Drifting', params: { delay: 27.7 } },
    ],
  },
  {
    id: 'four-track-grey-strings',
    name: 'Grey strings',
    category: 'texture',
    description:
      'A soft string pad that swells in behind what is played, then a four-track cassette, dull on top, unsteady and hissing.',
    effects: [
      { deviceId: 'pad-follower', preset: 'String pad' },
      { deviceId: 'tape', preset: 'Cassette four-track' },
    ],
  },
  {
    id: 'four-track-dune-grass-strings',
    name: 'Dune-grass strings',
    category: 'texture',
    description:
      'A string pad that arrives long after the chord and stays, into a dark reverb whose tail sags slowly out of tune.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Late tide', params: { rise: 5.49 } },
      { deviceId: 'bloom-reverb', preset: 'Winter drift', params: { decay: 12.9 } },
    ],
  },
  {
    id: 'four-track-octave-in-the-rain',
    name: 'Octave in the rain',
    category: 'pitch',
    description:
      'A muffled octave below, then a worn dictation cassette, dull, trembling and full of hiss, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'half-speed', preset: 'Muffled floor', params: { length: 2160 } },
      { deviceId: 'tape', preset: 'Old dictation', params: { output: -3.19 } },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  {
    id: 'four-track-damp-octave',
    name: 'Damp octave',
    category: 'pitch',
    description:
      'A muffled half-speed octave below, kept in the centre, then a lightly worn reel, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'half-speed', preset: 'Muffled floor', params: { length: 1950 } },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 28.9, modRate: 0.106 } },
    ],
  },
  {
    id: 'four-track-track-four-undertow',
    name: 'Track-four undertow',
    category: 'pitch',
    description:
      'Whole phrases dragged out at half speed, an octave down, then a thick, soft cassette, into a slowly breathing hall.',
    effects: [
      { deviceId: 'half-speed', preset: 'Long drag' },
      { deviceId: 'tape', preset: 'Warm thump', params: { output: -3.03 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing' },
    ],
  },
  {
    id: 'four-track-hand-labelled-octave',
    name: 'Hand-labelled octave',
    category: 'pitch',
    description:
      'A rounded octave below every note of a chord, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      { deviceId: 'fdn-reverb', preset: 'Slow swell' },
    ],
  },
  {
    id: 'four-track-sunday-octave',
    name: 'Sunday octave',
    category: 'pitch',
    description:
      'A dark, smooth half-speed octave under the dry sound, into a dark cellar of a room that folds the sound to mono.',
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { length: 1070, mix: 0.18 } },
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar', params: { decay: 3.33, mix: 0.24 } },
    ],
  },
  {
    id: 'four-track-echo-kept-indoors',
    name: 'Echo kept indoors',
    category: 'pitch',
    description:
      'A sinking octave echo, then a worn cassette that wobbles, drops out and hisses, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Falling tape', params: { time: 517, modRate: 0.327 } },
      { deviceId: 'patina', preset: 'Worn cassette' },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 44.9, lowDecay: 3.73, midDecay: 3.21 },
      },
    ],
  },
  {
    id: 'four-track-slowed-swell',
    name: 'Slowed swell',
    category: 'pitch',
    description:
      'Long slow grains an octave down, most of them reversed, then grain repeats that fall an octave and darken each time.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Low tide', params: { size: 833, density: 4.69 } },
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { time: 526, size: 209 } },
    ],
  },
  {
    id: 'four-track-overdubbed-fifth',
    name: 'Overdubbed fifth',
    category: 'pitch',
    description:
      'A late swell on every note like a rocked volume pedal, then scattered grains a fifth down, spread across both sides.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 263, release: 136 } },
      { deviceId: 'half-speed', preset: 'Fifth down grains', params: { length: 72.4 } },
    ],
  },
  {
    id: 'four-track-pad-run-slow',
    name: 'Pad run slow',
    category: 'pitch',
    description:
      'A dark string pad doubled an octave below the playing, then two dark late copies that shadow the sound on either side.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Low section', params: { rise: 0.823, fall: 4.68 } },
      { deviceId: 'stereo-detune', preset: 'Shadow', params: { delay: 27 } },
    ],
  },
  {
    id: 'four-track-mixdown-in-salt-air',
    name: 'Mixdown in salt air',
    category: 'master',
    description:
      'A slow compressor that evens out swells over seconds, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Level', params: { attack: 333, release: 2.23 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { release: 1.65 } },
    ],
  },
  {
    id: 'four-track-sandbar-finish',
    name: 'Sandbar finish',
    category: 'master',
    description:
      'A stereo image widened a little, with the bass left central, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.48 } },
    ],
  },
  {
    id: 'four-track-overdubbed-finish',
    name: 'Overdubbed finish',
    category: 'master',
    description:
      'A gentle compressor that draws loud and quiet together, then a slightly wider image, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { attack: 112, release: 1.97 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 6.38, gain: 3.74 } },
    ],
  },
  {
    id: 'four-track-last-ferry-master',
    name: 'Last-ferry master',
    category: 'master',
    description:
      'The first hint of weight from a tape preamp, then a compressor that lets each attack through before it levels, then a safety limiter.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'ambient-comp', preset: 'Keys', params: { attack: 115, release: 1.34 } },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'four-track-rivermouth-finish',
    name: 'Rivermouth finish',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a very gentle compressor, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'four-track-alder-master',
    name: 'Alder master',
    category: 'master',
    description:
      'Tape-style saturation that rounds only the loudest peaks, then a rumble cut and a small lift of presence, then a lightly pushed limiter.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'ambient-eq', preset: 'Keys', params: { clearTime: 1.52 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
]
