// Indiana Reel Room: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'reel-room-haymow-plate',
    name: 'Haymow plate',
    category: 'space',
    description:
      'A high cut set low enough to muffle everything, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.58 } },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  {
    id: 'reel-room-ground-fog-depths',
    name: 'Ground-fog depths',
    category: 'space',
    description:
      'A small room that is over in about a second, into a deep dark well of slow blurred echoes.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Room' },
      { deviceId: 'swarm-reverb', preset: 'Dark well' },
    ],
  },
  {
    id: 'reel-room-capstan-halo',
    name: 'Capstan halo',
    category: 'space',
    description:
      'A string pad with a second section an octave above, into a dull mono tunnel with a tail of several seconds.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Octave halo' },
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { decay: 5.8, modRate: 0.443 } },
    ],
  },
  {
    id: 'reel-room-hall-slow-to-go',
    name: 'Hall slow to go',
    category: 'space',
    description:
      'An equaliser that takes presence, air and lows away, then a small dark room, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.59 } },
      { deviceId: 'expanse', preset: 'Small dark room' },
      { deviceId: 'fdn-reverb', preset: 'Slow swell' },
    ],
  },
  {
    id: 'reel-room-plate-before-snow',
    name: 'Plate before snow',
    category: 'space',
    description:
      'A far-off plate haze with a long, soft tail, then a big lift of the low end that puts weight under the sound.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.49 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.34 } },
    ],
  },
  {
    id: 'reel-room-linoleum-hall',
    name: 'Linoleum hall',
    category: 'space',
    description:
      'An equaliser that adds lows and body and eases the top, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.36 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 62.1, lowDecay: 7.95, midDecay: 2.19 },
      },
    ],
  },
  {
    id: 'reel-room-halo-on-risers',
    name: 'Halo on risers',
    category: 'space',
    description:
      'A slow swell after each silence that opens only at the end, into a mellow reverb whose tail splits up and down in pitch.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 1450, release: 878 } },
      { deviceId: 'bloom-reverb', preset: 'Scatter' },
    ],
  },
  {
    id: 'reel-room-nave-by-the-barn',
    name: 'Nave by the barn',
    category: 'space',
    description:
      'A mid-forward tone with the lows and the top trimmed, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.38 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Vast nave',
        params: { lowDecay: 7.5, midDecay: 7.26, mix: 0.3 },
      },
    ],
  },
  {
    id: 'reel-room-half-track-cave',
    name: 'Half-track cave',
    category: 'space',
    description:
      'The level rising and falling at random, like surf, into a long blurred cave that slides slowly between intervals.',
    effects: [
      { deviceId: 'tremolo', preset: 'Sea swell' },
      { deviceId: 'swarm-reverb', preset: 'Slow stretch' },
    ],
  },
  {
    id: 'reel-room-bounce-down-hall',
    name: 'Bounce-down hall',
    category: 'space',
    description:
      'A valve stage driven hard until it thickens and sags, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { output: -4.39 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell' },
    ],
  },
  {
    id: 'reel-room-grease-pencil-wash',
    name: 'Grease-pencil wash',
    category: 'space',
    description:
      'A huge slow wash that swells in and hangs with no dry sound, then a fast reel with no hiss, driven hard so peaks are squashed.',
    effects: [
      { deviceId: 'expanse', preset: 'Wash alone' },
      { deviceId: 'tape', preset: 'Hot glue' },
    ],
  },
  {
    id: 'reel-room-joist-hall',
    name: 'Joist hall',
    category: 'space',
    description:
      'A plain hall of about four seconds, then a high cut set low enough to muffle everything.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Plain hall' },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'reel-room-cloud-behind-lath',
    name: 'Cloud behind lath',
    category: 'space',
    description:
      'A tight chamber close round the sound for about a second, into a cloud of reverb that swells in after each note and fades.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
      { deviceId: 'shaped-reverb', preset: 'Bloom' },
    ],
  },
  {
    id: 'reel-room-rolled-off-haze',
    name: 'Rolled-off haze',
    category: 'space',
    description:
      'A dark smear of long grains that trails for many seconds, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Dark slow smear', params: { time: 1720, size: 493 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'reel-room-next-county-wash',
    name: 'Next-county wash',
    category: 'space',
    description:
      'A huge slow wash that swells in and hangs with no dry sound, then a hard, fast-acting compressor that packs the sound dense.',
    effects: [
      { deviceId: 'expanse', preset: 'Wash alone' },
      { deviceId: 'ambient-comp', preset: 'Dense pad' },
    ],
  },
  {
    id: 'reel-room-mud-season-room',
    name: 'Mud-season room',
    category: 'space',
    description:
      'A tape preamp pushed just enough to add weight, into a small room that answers about an eighth of a second late.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'ether-reverb', preset: 'Slap room', params: { predelayMs: 127 } },
    ],
  },
  {
    id: 'reel-room-reel-room-cave',
    name: 'Reel-room cave',
    category: 'space',
    description:
      'A big muffled cave that rings for about six seconds, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 6.09, breathRate: 0.283 } },
      { deviceId: 'ambient-eq', preset: 'Forward' },
    ],
  },
  {
    id: 'reel-room-reel-tail-first',
    name: 'Reel tail first',
    category: 'echo',
    description:
      'A slow backwards loop, then a worn dictation cassette, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow backwards' },
      { deviceId: 'tape', preset: 'Old dictation' },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'reel-room-crawl-space-swells',
    name: 'Crawl-space swells',
    category: 'echo',
    description:
      'A dark fog of slow backwards swells, then a four-track cassette, then a dark smear of long grains that trails for many seconds.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Dark fog' },
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'grain-delay', preset: 'Dark slow smear' },
    ],
  },
  {
    id: 'reel-room-february-loop',
    name: 'February loop',
    category: 'echo',
    description:
      'A low, dark tape loop played backwards at half speed, then a four-track cassette, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow backwards', params: { length: 3.78 } },
      { deviceId: 'tape', preset: 'Cassette four-track' },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 71.2, lowDecay: 7.63, midDecay: 5.35 },
      },
    ],
  },
  {
    id: 'reel-room-swells-by-one-bulb',
    name: 'Swells by one bulb',
    category: 'echo',
    description:
      'A dark fog of slow backwards swells, then a muffled cassette, into a cave whose echoes bend slowly up and down in pitch.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Dark fog', params: { time: 1550 } },
      { deviceId: 'tape', preset: 'Under a blanket' },
      { deviceId: 'swarm-reverb', preset: 'Bending' },
    ],
  },
  {
    id: 'reel-room-lath-replay',
    name: 'Lath replay',
    category: 'echo',
    description:
      'Replays of the last seconds, then a far-off, dulled tone, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Just now' },
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.66 } },
      { deviceId: 'expanse', preset: 'Bloom' },
    ],
  },
  {
    id: 'reel-room-con-sordino-echo',
    name: 'Con-sordino echo',
    category: 'echo',
    description:
      'A short swell that rounds the front off every note, then a dull, wobbling, saturated echo on worn tape.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack' },
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 621 } },
    ],
  },
  {
    id: 'reel-room-ground-fog-echo',
    name: 'Ground-fog echo',
    category: 'echo',
    description:
      'One backwards answer to each phrase about three seconds on, then a slow reel whose pitch sways widely and never settles, into a vast nave.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Phrase and mirror' },
      { deviceId: 'tape', preset: 'Seasick' },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'reel-room-flat-roof-echo',
    name: 'Flat-roof echo',
    category: 'echo',
    description:
      'Recalled moments that mostly come back reversed or slowed, into a plate heard alone with none of the dry sound left.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Backwards',
        params: { time: 589, reach: 13.4, size: 1.39 },
      },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'reel-room-rolled-off-echo',
    name: 'Rolled-off echo',
    category: 'echo',
    description:
      'A dark, woolly amp stack, then grain repeats that sink by fourths on every pass, then a hovering tape wash.',
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly', params: { output: -2.65 } },
      { deviceId: 'grain-delay', preset: 'Falling fourths' },
      { deviceId: 'tape-echo', preset: 'Hovering wash', params: { time: 1000 } },
    ],
  },
  {
    id: 'reel-room-music-stand-tape',
    name: 'Music-stand tape',
    category: 'echo',
    description:
      'A low-pass that opens and closes over about half a minute, then a dull, wobbling, saturated echo on worn tape.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0272, envAttackMs: 9.55, envReleaseMs: 221 },
      },
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 589 } },
    ],
  },
  {
    id: 'reel-room-subfloor-repeats',
    name: 'Subfloor repeats',
    category: 'echo',
    description:
      'A steady tape echo with no wobble, dirt or dulling, then a big lift of the low end that puts weight under the sound.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Clean and steady', params: { time: 457 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.26 } },
    ],
  },
  {
    id: 'reel-room-flatland-loop',
    name: 'Flatland loop',
    category: 'echo',
    description:
      'A mid-forward tone with the lows and the top trimmed, then a half-speed loop that plays the last phrase an octave down.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward' },
      { deviceId: 'micro-looper', preset: 'Half speed', params: { length: 2.81 } },
    ],
  },
  {
    id: 'reel-room-back-desk-embers',
    name: 'Back-desk embers',
    category: 'echo',
    description:
      'Grain repeats that fall an octave and darken each time, then a gentle high cut that shades the top end.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { time: 460, size: 219 } },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'reel-room-bottomland-layers',
    name: 'Bottomland layers',
    category: 'echo',
    description:
      'A gentle high cut that shades the top end, then a tape loop that plays its layers back in reverse.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.41 } },
      { deviceId: 'tape-loop', preset: 'Backwards layers', params: { length: 5.86 } },
    ],
  },
  {
    id: 'reel-room-gravel-road-reel',
    name: 'Gravel-road reel',
    category: 'tape',
    description:
      'A struck-to-pad swell, then a reel with a little hiss, into a cathedral whose long tail sings a soft open ah.',
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 858, release: 383 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { output: 8.74 } },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { decay: 21, preDelay: 38.4 } },
    ],
  },
  {
    id: 'reel-room-linoleum-cassette',
    name: 'Linoleum cassette',
    category: 'tape',
    description:
      'A volume-pedal swell, then a worn dictation cassette, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal' },
      { deviceId: 'tape', preset: 'Old dictation' },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 22, modRate: 0.222 } },
    ],
  },
  {
    id: 'reel-room-tape-all-winter',
    name: 'Tape all winter',
    category: 'tape',
    description:
      'A half-hidden slow swell, then a reel with a little hiss, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow' },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { predelayMs: 59.1 } },
    ],
  },
  {
    id: 'reel-room-corncrib-drift',
    name: 'Corncrib drift',
    category: 'tape',
    description:
      'A long bowed swell, then a slow reel whose pitch sways widely and never settles, into a dark rising reverb.',
    effects: [
      { deviceId: 'swell', preset: 'Slow bow' },
      { deviceId: 'tape', preset: 'Seasick', params: { output: 6.84 } },
      { deviceId: 'shaped-reverb', preset: 'Ghost', params: { time: 1.76, preDelay: 56.3 } },
    ],
  },
  {
    id: 'reel-room-splice-block-hiss',
    name: 'Splice-block hiss',
    category: 'tape',
    description:
      'A lightly worn reel, then muffled tape hiss with its top taken off, steady and thick, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 'noise-floor', preset: 'Muffled hiss' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { preDelay: 89.4, midDecay: 7.17 } },
    ],
  },
  {
    id: 'reel-room-second-copy-hiss',
    name: 'Second-copy hiss',
    category: 'tape',
    description:
      'A tape reel pushed hard, saturated and thick, then steady tape hiss, into a dark hall that takes about twenty seconds to die away.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'noise-floor', preset: 'Tape floor' },
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0824 } },
    ],
  },
  {
    id: 'reel-room-pole-barn-cassette',
    name: 'Pole-barn cassette',
    category: 'tape',
    description:
      'A muffled cassette, its top rolled off and its lows lifted, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket' },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'reel-room-yard-light-cassette',
    name: 'Yard-light cassette',
    category: 'tape',
    description:
      'A worn cassette that wobbles, drops out and hisses, then an equaliser that adds lows and body and eases the top.',
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { output: -2.34 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'reel-room-cassette-by-the-silo',
    name: 'Cassette by the silo',
    category: 'tape',
    description:
      'A worn cassette that wobbles, drops out and hisses, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette' },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 51.2, lowDecay: 4.42, midDecay: 3.09 },
      },
    ],
  },
  {
    id: 'reel-room-cork-grease-tape',
    name: 'Cork-grease tape',
    category: 'tape',
    description:
      'A worn cassette that wobbles, drops out and hisses, into a dark cellar of a room that folds the sound to mono.',
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { output: -2.16 } },
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar' },
    ],
  },
  {
    id: 'reel-room-stand-light-cassette',
    name: 'Stand-light cassette',
    category: 'tape',
    description:
      'A far-off combo amp, then a thick, soft cassette, full in the lows and dull on top, into a thin veil of reverb kept low under the sound.',
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall' },
      { deviceId: 'tape', preset: 'Warm thump', params: { output: -3.07 } },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { decay: 2.64, breathRate: 0.269 } },
    ],
  },
  {
    id: 'reel-room-slack-spool-reel',
    name: 'Slack-spool reel',
    category: 'tape',
    description:
      'A high cut set low enough to muffle everything, then a tape loop that wears thinner and duller on every pass.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.54 } },
      { deviceId: 'tape-loop', preset: 'Worn out', params: { length: 3.24 } },
    ],
  },
  {
    id: 'reel-room-radiator-tape',
    name: 'Radiator tape',
    category: 'tape',
    description:
      'A half-deep swell, then an old slow reel that drifts, dulls, drops out and hisses, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'swell', preset: 'Ghost pick' },
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  {
    id: 'reel-room-hum-in-the-hiss',
    name: 'Hum in the hiss',
    category: 'tape',
    description:
      'A flaking reel, then the low hum of an amplifier left switched on, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'tape', preset: 'Crumbling oxide' },
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { response: 0.429, hold: 33.4 } },
      { deviceId: 'expanse', preset: 'Low cathedral' },
    ],
  },
  {
    id: 'reel-room-razor-cut-hiss',
    name: 'Razor-cut hiss',
    category: 'tape',
    description:
      'A tape reel pushed hard, saturated and thick, then tape hiss that rises with each note and dies with it, into a hall with long lows.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'noise-floor', preset: 'Riding hiss' },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 53.1, lowDecay: 7.9, midDecay: 1.81 },
      },
    ],
  },
  {
    id: 'reel-room-section-line-hiss',
    name: 'Section-line hiss',
    category: 'tape',
    description:
      'An old slow reel that drifts, dulls, drops out and hisses, then dull, thick tape hiss, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'tape', preset: 'Worn thin' },
      { deviceId: 'noise-floor', preset: 'Muffled hiss', params: { response: 0.42, hold: 12.7 } },
      { deviceId: 'expanse', preset: 'Open space' },
    ],
  },
  {
    id: 'reel-room-drift-run-slack',
    name: 'Drift run slack',
    category: 'tape',
    description:
      'A dark held drone, then a slow reel whose pitch sways widely and never settles, into a far-off hall.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Deep drone', params: { length: 2.87 } },
      { deviceId: 'tape', preset: 'Seasick' },
      { deviceId: 'hall-reverb', preset: 'Far away' },
    ],
  },
  {
    id: 'reel-room-radio-on-third-copy',
    name: 'Radio on third copy',
    category: 'tape',
    description:
      'A wearing tape loop, then a small radio speaker muffled as if under a pillow, into a hint of open space behind the sound.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Worn out', params: { length: 3.1 } },
      { deviceId: 're-amp', preset: 'Pillow speaker' },
      { deviceId: 'expanse', preset: 'Faint air', params: { decay: 2.75, modRate: 0.382 } },
    ],
  },
  {
    id: 'reel-room-winter-wheat-filter',
    name: 'Winter-wheat filter',
    category: 'tape',
    description:
      'A steep low-pass that removes all above four hundred hertz, then a thin, even trace of tape hiss, heard in the pauses.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { lfoRateHz: 1.06, envAttackMs: 9.59, envReleaseMs: 184 },
      },
      { deviceId: 'noise-floor', preset: 'Faint hiss', params: { response: 0.352, hold: 13.4 } },
    ],
  },
  {
    id: 'reel-room-chaff-cassette',
    name: 'Chaff cassette',
    category: 'tape',
    description:
      'A worn cassette that wobbles, drops out and hisses, then a trace of tape hiss, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette' },
      { deviceId: 'noise-floor', preset: 'Faint hiss', params: { response: 0.365, hold: 12.1 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 14.4 } },
    ],
  },
  {
    id: 'reel-room-drift-in-february',
    name: 'Drift in February',
    category: 'tape',
    description:
      'A slow reel whose pitch sways widely and never settles, then steady tape hiss that lingers after the last note.',
    effects: [
      { deviceId: 'tape', preset: 'Seasick' },
      { deviceId: 'noise-floor', preset: 'Tape floor' },
    ],
  },
  {
    id: 'reel-room-february-fuzz',
    name: 'February fuzz',
    category: 'tape',
    description:
      'A tape preamp overloaded until it breaks up, dull and thick, then a high cut set low enough to muffle everything.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Worn tape', params: { output: -11.4 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'reel-room-head-gap-chorus',
    name: 'Head-gap chorus',
    category: 'motion',
    description:
      'A valve preamp, gently driven and a little bright on top, then a late copy on each side, like the same part played twice.',
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp' },
      { deviceId: 'chorus', preset: 'Loose double', params: { rate: 0.198 } },
    ],
  },
  {
    id: 'reel-room-tide-out-back',
    name: 'Tide out back',
    category: 'motion',
    description:
      'A swell that takes seconds to rise after each silence, then a low-pass that opens and closes over about half a minute.',
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 2410, release: 710 } },
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
    ],
  },
  {
    id: 'reel-room-township-tide',
    name: 'Township tide',
    category: 'motion',
    description:
      'A low-pass that opens and closes over about half a minute, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0286, envAttackMs: 8.82, envReleaseMs: 198 },
      },
      {
        deviceId: 'ether-reverb',
        preset: 'Dark infinite',
        params: { predelayMs: 59.9, mix: 0.173 },
      },
    ],
  },
  {
    id: 'reel-room-linoleum-reel',
    name: 'Linoleum reel',
    category: 'motion',
    description:
      'A slow swell after each silence that leaves some attack in, then a slow reel whose pitch sways widely and never settles.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow' },
      { deviceId: 'tape', preset: 'Seasick' },
    ],
  },
  {
    id: 'reel-room-stubble-ripple',
    name: 'Stubble ripple',
    category: 'motion',
    description:
      'A chorus on the upper range that leaves the lows steady, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'chorus', preset: 'Guitar shimmer' },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'reel-room-barn-light-tide',
    name: 'Barn-light tide',
    category: 'motion',
    description:
      'A low-pass that opens and closes over about half a minute, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 9, modRate: 0.448, mix: 0.24 },
      },
    ],
  },
  {
    id: 'reel-room-slow-arriving-cellos',
    name: 'Slow-arriving cellos',
    category: 'texture',
    description:
      'A dark, low string pad like cellos under the playing, then a big lift of the low end, then a deep, slow compressor.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Dark cellos', params: { fall: 8.19 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.07 } },
      { deviceId: 'ambient-comp', preset: 'Drone bed' },
    ],
  },
  {
    id: 'reel-room-pinch-roller-swell',
    name: 'Pinch-roller swell',
    category: 'texture',
    description:
      'A slow-swelling string pad, then a high cut set low enough to muffle everything, then a very gentle compressor.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Slow swell' },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
      {
        deviceId: 'ambient-comp',
        preset: 'Glue',
        params: { attack: 648, release: 3.93, makeup: 2.25 },
      },
    ],
  },
  {
    id: 'reel-room-ductwork-cellos',
    name: 'Ductwork cellos',
    category: 'texture',
    description:
      'A dark, low string pad like cellos under the playing, then a gentle high cut that shades the top end, then a deep, slow compressor.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Dark cellos', params: { rise: 1.6, fall: 8.13 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.6 } },
      { deviceId: 'ambient-comp', preset: 'Drone bed', params: { attack: 776, release: 9.83 } },
    ],
  },
  {
    id: 'reel-room-line-up-pad',
    name: 'Line-up pad',
    category: 'texture',
    description:
      'A dark, round pad that melts slowly from chord to chord, into a plain hall with about four seconds of tail.',
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 3.91, breathRate: 0.299 } },
    ],
  },
  {
    id: 'reel-room-capstan-strings',
    name: 'Capstan strings',
    category: 'texture',
    description:
      'A dark string pad doubled an octave below the playing, then a muffled cassette, its top rolled off and its lows lifted.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Low section' },
      { deviceId: 'tape', preset: 'Under a blanket' },
    ],
  },
  {
    id: 'reel-room-killing-frost-tide',
    name: 'Killing-frost tide',
    category: 'texture',
    description:
      'Long slow grains an octave down, most of them reversed, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Low tide', params: { size: 1000, density: 4.58 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { predelayMs: 17.6 } },
    ],
  },
  {
    id: 'reel-room-furrow-pad',
    name: 'Furrow pad',
    category: 'texture',
    description:
      'A slow swell on only the first note after each silence, then a dark, round pad that melts slowly from chord to chord.',
    effects: [
      { deviceId: 'swell', preset: 'First note only', params: { attack: 1490, release: 1550 } },
      { deviceId: 'sustainer', preset: 'Dark bed', params: { attack: 1.13, glide: 2.55 } },
    ],
  },
  {
    id: 'reel-room-folding-chair-wash',
    name: 'Folding-chair wash',
    category: 'texture',
    description:
      'A slowly dissolving wash, then a mid-forward tone with the lows and the top trimmed, then a very slow compressor.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve' },
      { deviceId: 'ambient-eq', preset: 'Forward' },
      { deviceId: 'ambient-comp', preset: 'Slow fader', params: { release: 19, makeup: -2.97 } },
    ],
  },
  {
    id: 'reel-room-heat-lightning-haze',
    name: 'Heat-lightning haze',
    category: 'texture',
    description:
      'A dark smear of long grains that trails for many seconds, then a ruined cassette that lurches, drops out and hisses hard.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Dark slow smear', params: { time: 1460, size: 459 } },
      { deviceId: 'patina', preset: 'Falling apart' },
    ],
  },
  {
    id: 'reel-room-haze-by-the-boiler',
    name: 'Haze by the boiler',
    category: 'texture',
    description:
      'A bowed swell that lets part of each attack through, then a hanging mist of overtones, then a hovering tape wash.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed' },
      { deviceId: 'spectral-blur', preset: 'Hanging mist' },
      { deviceId: 'tape-echo', preset: 'Hovering wash' },
    ],
  },
  {
    id: 'reel-room-undertow-at-a-splice',
    name: 'Undertow at a splice',
    category: 'texture',
    description:
      'A first-note swell, then a blurred bed of bass that hangs low under the sound, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'swell', preset: 'First note only', params: { attack: 1440, release: 1590 } },
      { deviceId: 'spectral-blur', preset: 'Sub bed' },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 56.7, midDecay: 1.81 },
      },
    ],
  },
  {
    id: 'reel-room-wainscot-strings',
    name: 'Wainscot strings',
    category: 'texture',
    description:
      'A string pad that stands alone in place of what is played, into one slow scatter of echoes over about a second and no tail.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Pad alone' },
      { deviceId: 'swarm-reverb', preset: 'Long scatter', params: { length: 1.14, glide: 0.526 } },
    ],
  },
  {
    id: 'reel-room-mist-at-the-mill',
    name: 'Mist at the mill',
    category: 'texture',
    description:
      'A wide midrange fog, then a deep pitch wobble in the centre, like a warped tape, into a plain hall with about four seconds of tail.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Band of fog' },
      { deviceId: 'chorus', preset: 'Warped tape' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 4.35, breathRate: 0.325 } },
    ],
  },
  {
    id: 'reel-room-folding-chair-drone',
    name: 'Folding-chair drone',
    category: 'texture',
    description:
      'A dark, round pad that melts slowly from chord to chord, then an equaliser that adds lows and body and eases the top.',
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { mix: 0.36 } },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'reel-room-bloom-still-going',
    name: 'Bloom still going',
    category: 'texture',
    description:
      'Layers of held chords that bloom slowly and never fade, into a dull reverb that swells in over seconds and fades slowly.',
    effects: [
      { deviceId: 'sustainer', preset: 'Slow bloom layers' },
      { deviceId: 'shaped-reverb', preset: 'Dark swell' },
    ],
  },
  {
    id: 'reel-room-yard-light-drone',
    name: 'Yard-light drone',
    category: 'texture',
    description:
      'A dark drone looped from each note with the octave below, then a high cut set low enough to muffle everything.',
    effects: [
      { deviceId: 'cascade', preset: 'Deep drone', params: { time: 1570 } },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.55 } },
    ],
  },
  {
    id: 'reel-room-cloud-in-the-gym',
    name: 'Cloud in the gym',
    category: 'texture',
    description:
      'A wide haze of grains that hangs on long after the playing, then a glacial low-pass, into a medium plate.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Frozen haze' },
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0327, envAttackMs: 11, envReleaseMs: 222 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'reel-room-pad-on-the-flat',
    name: 'Pad on the flat',
    category: 'texture',
    description:
      'A held pad where each new chord piles onto the last, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'sustainer', preset: 'Stacked harmony' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 13.7 } },
    ],
  },
  {
    id: 'reel-room-barn-light-fourth',
    name: 'Barn-light fourth',
    category: 'pitch',
    description:
      'A wide, slowed copy a fourth below that drifts behind, then a lightly worn reel, then an equaliser that takes presence, air and lows away.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth down drift', params: { length: 3260 } },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.64 } },
    ],
  },
  {
    id: 'reel-room-slow-arriving-depths',
    name: 'Slow-arriving depths',
    category: 'pitch',
    description:
      'A copy two octaves down, then a tape reel pushed hard, saturated and thick, then an equaliser that adds lows and body and eases the top.',
    effects: [
      { deviceId: 'half-speed', preset: 'Two octaves', params: { length: 1510 } },
      { deviceId: 'patina', preset: 'Reel pushed hard', params: { output: -6.02 } },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.54 } },
    ],
  },
  {
    id: 'reel-room-seed-corn-shadow',
    name: 'Seed-corn shadow',
    category: 'pitch',
    description:
      'A dull copy an octave below, close behind each note, then a high cut set low enough to muffle everything, then an overloaded tape preamp.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Sub shadow' },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.45 } },
      { deviceId: 'analog-drive', preset: 'Worn tape', params: { output: -11.7 } },
    ],
  },
  {
    id: 'reel-room-octave-by-the-deck',
    name: 'Octave by the deck',
    category: 'pitch',
    description:
      'A rounded octave below every note of a chord, then a shaded top end, then the first hint of weight from a tape preamp.',
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
      { deviceId: 'analog-drive', preset: 'First hint', params: { output: -3.26 } },
    ],
  },
  {
    id: 'reel-room-seed-corn-blur',
    name: 'Seed-corn blur',
    category: 'pitch',
    description:
      'A blurred half-speed wash an octave down, dull on top, then a worn cassette that wobbles, drops out and hisses.',
    effects: [
      { deviceId: 'half-speed', preset: 'Blurred half', params: { length: 433 } },
      { deviceId: 'patina', preset: 'Worn cassette' },
    ],
  },
  {
    id: 'reel-room-county-line-undertow',
    name: 'County-line undertow',
    category: 'pitch',
    description:
      'A transformer driven so the low end thickens and loosens, then whole phrases dragged out at half speed, an octave down.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { output: -7.04 } },
      { deviceId: 'half-speed', preset: 'Long drag' },
    ],
  },
  {
    id: 'reel-room-root-cellar-octave',
    name: 'Root-cellar octave',
    category: 'pitch',
    description:
      'A muffled half-speed octave below, kept in the centre, into a hall of about four seconds with no dry sound in it.',
    effects: [
      { deviceId: 'half-speed', preset: 'Muffled floor' },
      { deviceId: 'hall-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'reel-room-depths-in-the-joists',
    name: 'Depths in the joists',
    category: 'pitch',
    description:
      'A soft, deep bass one and two octaves below each note, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'octaves', preset: 'Deep' },
      { deviceId: 'expanse', preset: 'Low cathedral' },
    ],
  },
  {
    id: 'reel-room-pole-barn-fifth',
    name: 'Pole-barn fifth',
    category: 'pitch',
    description:
      'A slowed copy a fifth below, running on beside the dry sound, then an old slow reel that drifts, dulls, drops out and hisses.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fifth down bed', params: { length: 1650 } },
      { deviceId: 'tape', preset: 'Worn thin' },
    ],
  },
  {
    id: 'reel-room-bounce-down-drift',
    name: 'Bounce-down drift',
    category: 'pitch',
    description:
      'A wide, slowed copy a fourth below that drifts behind, then an overdriven reel, then a high cut set low enough to muffle everything.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth down drift' },
      { deviceId: 'tape', preset: 'Needles pinned' },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.59 } },
    ],
  },
  {
    id: 'reel-room-subsoil-octave',
    name: 'Subsoil octave',
    category: 'pitch',
    description:
      'A smooth octave-down bed, then a slow reel whose pitch sways widely and never settles, then a big lift of the low end.',
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { length: 2450 } },
      { deviceId: 'tape', preset: 'Seasick', params: { output: -6.03 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 2.88 } },
    ],
  },
  {
    id: 'reel-room-undertow-in-low-fog',
    name: 'Undertow in low fog',
    category: 'pitch',
    description:
      'A dark, smooth half-speed octave under the dry sound, then a four-track cassette, then a big lift of the low end.',
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix' },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { output: -3.77 } },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.35 } },
    ],
  },
  {
    id: 'reel-room-half-track-depths',
    name: 'Half-track depths',
    category: 'pitch',
    description:
      'A soft, deep bass one and two octaves below each note, then a big lift of the low end, then a little soft saturation.',
    effects: [
      { deviceId: 'octaves', preset: 'Deep' },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.05 } },
      { deviceId: 'saturator', preset: 'Warm glue', params: { outputDb: -12 } },
    ],
  },
  {
    id: 'reel-room-depths-into-murk',
    name: 'Depths into murk',
    category: 'pitch',
    description:
      'Dark voices one and two octaves below the dry sound, then a warm, full equaliser, then a full, warm transformer.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Two octaves', params: { size: 153 } },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.48 } },
      { deviceId: 'analog-drive', preset: 'Low warmth', params: { output: -6.57 } },
    ],
  },
  {
    id: 'reel-room-furnace-room-loop',
    name: 'Furnace-room loop',
    category: 'pitch',
    description:
      'A short swell that rounds the front off every note, then a half-speed tape loop that returns an octave down and dull.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 143, release: 89.5 } },
      { deviceId: 'tape-loop', preset: 'Slowed down', params: { length: 8.05 } },
    ],
  },
  {
    id: 'reel-room-slow-arriving-replay',
    name: 'Slow-arriving replay',
    category: 'pitch',
    description:
      'A half-speed replay an octave down, with no dry sound, then an equaliser that takes presence, air and lows away.',
    effects: [
      { deviceId: 'half-speed', preset: 'Half speed', params: { length: 1030 } },
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.56 } },
    ],
  },
  {
    id: 'reel-room-second-copy-octaves',
    name: 'Second-copy octaves',
    category: 'pitch',
    description:
      'A quarter-speed crawl two octaves down, smooth and unbroken, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'half-speed', preset: 'Quarter speed', params: { length: 3440 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'reel-room-finish-in-plaster',
    name: 'Finish in plaster',
    category: 'master',
    description:
      'Light tape-style saturation, then a subsonic cut with the low mids and the presence eased, then a lightly pushed limiter.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'ambient-eq', preset: 'Drone', params: { clearTime: 1.36 } },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'reel-room-tuning-note-finish',
    name: 'Tuning-note finish',
    category: 'master',
    description:
      'A subsonic cut, then a gentle compressor that draws loud and quiet together, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 2.7 } },
      { deviceId: 'ambient-comp', preset: 'Sit back' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 6.02, gain: 2.44 } },
    ],
  },
  {
    id: 'reel-room-master-at-a-splice',
    name: 'Master at a splice',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a very gentle compressor that leans on the loudest swells, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide' },
    ],
  },
  {
    id: 'reel-room-gravel-road-mixdown',
    name: 'Gravel-road mixdown',
    category: 'master',
    description:
      'A fresh reel of tape, open on top and nearly steady, then a fast limiter that steps in only on the loudest peaks.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'reel-room-finish-on-the-flat',
    name: 'Finish on the flat',
    category: 'master',
    description:
      'A subsonic cut, then a slow compressor that evens out swells over seconds, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 3.34 } },
      { deviceId: 'ambient-comp', preset: 'Level', params: { attack: 306, release: 1.83 } },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.58 } },
    ],
  },
  {
    id: 'reel-room-master-down-a-duct',
    name: 'Master down a duct',
    category: 'master',
    description:
      'A few decibels of soft saturation with the top eased, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { release: 1.52, gain: -4.53 } },
    ],
  },
]
