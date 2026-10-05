// Cornish Lucid Dreams: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'lucid-lighthouse-hall',
    name: 'Lighthouse hall',
    category: 'space',
    description:
      'Two copies a slap behind, the left one first, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Late copy' },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 8.78, breathRate: 0.204 } },
    ],
  },
  {
    id: 'lucid-dreamt-vault',
    name: 'Dreamt vault',
    category: 'space',
    description:
      'Two copies in tune that wander like extra takes, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Drifting', params: { delay: 25.2 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'lucid-before-dawn-sheen',
    name: 'Before-dawn sheen',
    category: 'space',
    description:
      'Only the two detuned copies, hard left and right, into a quiet plate tail that comes in late behind each note.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wet only' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { predelayMs: 83.1 } },
    ],
  },
  {
    id: 'lucid-bunk-bed-plate',
    name: 'Bunk-bed plate',
    category: 'space',
    description:
      'Three detuned voices spread hard apart with no dry sound, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'chorus', preset: 'Voices only', params: { rate: 0.39, delayMs: 17.8 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 15.9 } },
    ],
  },
  {
    id: 'lucid-copper-plate',
    name: 'Copper plate',
    category: 'space',
    description:
      'A plain two-voice chorus with a voice towards each side, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.768, delayMs: 11.1 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'lucid-unlit-plate',
    name: 'Unlit plate',
    category: 'space',
    description:
      'A deep pitch wobble in the centre, like a warped tape, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'chorus', preset: 'Warped tape', params: { rate: 1.4, delayMs: 24.7 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 13.8 } },
    ],
  },
  {
    id: 'lucid-pylon-choir',
    name: 'Pylon choir',
    category: 'space',
    description:
      'A heavy low shelf that puts weight under the sound, into a soft sung oo that follows a moment behind each note.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.32 } },
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { decay: 3.95, preDelay: 73.8 } },
    ],
  },
  {
    id: 'lucid-climb-gone-sour',
    name: 'Climb gone sour',
    category: 'space',
    description:
      'An equaliser that takes presence, air and lows away, into a reverb whose tail slides smoothly upwards out of key.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant' },
      { deviceId: 'bloom-reverb', preset: 'Smooth climb' },
    ],
  },
  {
    id: 'lucid-fifths-in-sea-fret',
    name: 'Fifths in sea fret',
    category: 'space',
    description:
      'An equaliser that takes presence, air and lows away, into a mellow reverb whose tail drifts down towards the fifth.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.46 } },
      { deviceId: 'bloom-reverb', preset: 'Falling fifths' },
    ],
  },
  {
    id: 'lucid-chant-by-nightlight',
    name: 'Chant by nightlight',
    category: 'space',
    description:
      'A high cut set low enough to muffle everything, into a large hall whose tail hums a deep oh in bass voices.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.52 } },
      { deviceId: 'vowel-reverb', preset: 'Low monks', params: { decay: 11.3, preDelay: 22.4 } },
    ],
  },
  {
    id: 'lucid-tin-mine-voices',
    name: 'Tin-mine voices',
    category: 'space',
    description:
      'A steep low-pass at four hundred hertz, the top gone, into a choir of a hall whose vowel wanders on its own.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { lfoRateHz: 0.959, envAttackMs: 9.09, envReleaseMs: 205 },
      },
      { deviceId: 'vowel-reverb', preset: 'Vowel drift', params: { decay: 8.76, preDelay: 19.4 } },
    ],
  },
  {
    id: 'lucid-fence-wire-well',
    name: 'Fence-wire well',
    category: 'space',
    description:
      'Fed-back copies that climb on the left and sink on the right, into a deep dark well of slow blurred echoes.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Spiral' },
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { length: 1.13, glide: 0.61 } },
    ],
  },
  {
    id: 'lucid-steel-barely-awake',
    name: 'Steel barely awake',
    category: 'space',
    description:
      'A gentle low-pass at a kilohertz, into a bright undamped plate of a couple of seconds.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { lfoRateHz: 0.894, envAttackMs: 10.6, envReleaseMs: 186 },
      },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { predelayMs: 5.12 } },
    ],
  },
  {
    id: 'lucid-box-room-plate',
    name: 'Box-room plate',
    category: 'space',
    description:
      'A small chapel with a short sung eh in its tail, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Chapel', params: { decay: 1.66, preDelay: 4.5 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'lucid-small-hours-plate',
    name: 'Small-hours plate',
    category: 'space',
    description:
      'A small dead booth that is gone almost at once, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Small booth' },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { predelayMs: 56.7 } },
    ],
  },
  {
    id: 'lucid-hall-at-lights-out',
    name: 'Hall at lights out',
    category: 'space',
    description:
      'A gentle high cut that shades the top end, into a wide hall that answers about a fifth of a second late.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.45 } },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'lucid-hymnbook-voice',
    name: 'Hymnbook voice',
    category: 'space',
    description:
      'A single fixed voice in the middle that is barely there, into a hint of open space behind the sound.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Lone voice' },
      { deviceId: 'expanse', preset: 'Faint air', params: { decay: 3.23, modRate: 0.412 } },
    ],
  },
  {
    id: 'lucid-shade-heard-asleep',
    name: 'Shade heard asleep',
    category: 'space',
    description:
      'A dark plate whose tail is soft on top, then two dull copies that wander, a haze round the notes.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 15.5 } },
      { deviceId: 'stereo-detune', preset: 'Piano haze' },
    ],
  },
  {
    id: 'lucid-fuse-box-wash',
    name: 'Fuse-box wash',
    category: 'space',
    description:
      'Dark repeats that slide further out of tune on every pass, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Melting', params: { delay: 33 } },
      {
        deviceId: 'plate-reverb',
        preset: 'Endless wash',
        params: { predelayMs: 65.2, mix: 0.283 },
      },
    ],
  },
  {
    id: 'lucid-slate-roof-cave',
    name: 'Slate-roof cave',
    category: 'space',
    description:
      'The whole sound folded to mono, into a cave whose echoes jump now and then by a fifth or octave.',
    effects: [
      { deviceId: 'stereo-widener', preset: 'Mono' },
      {
        deviceId: 'swarm-reverb',
        preset: 'Intervals',
        params: { length: 0.662, glide: 0.0493, mix: 0.24 },
      },
    ],
  },
  {
    id: 'lucid-hall-on-the-stairs',
    name: 'Hall on the stairs',
    category: 'space',
    description:
      'Fed-back copies that climb on the left and sink on the right, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Spiral' },
      { deviceId: 'fdn-reverb', preset: 'Breathing' },
    ],
  },
  {
    id: 'lucid-plate-at-low-water',
    name: 'Plate at low water',
    category: 'space',
    description:
      'Three detuned voices spread hard apart with no dry sound, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'chorus', preset: 'Voices only', params: { rate: 0.312, delayMs: 15.2 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'lucid-half-lit-hall',
    name: 'Half-lit hall',
    category: 'space',
    description:
      'An undamped hall with about three seconds of tail, then a valve stage that gives way under loud notes, tails rising.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Bright air' },
      { deviceId: 'patina', preset: 'Valve bloom', params: { output: -5.53 } },
    ],
  },
  {
    id: 'lucid-eyes-shut-sway',
    name: 'Eyes-shut sway',
    category: 'space',
    description:
      'A slow swell after each silence that opens only at the end, into a long tail that wavers in pitch like an unsteady choir.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 1640, release: 830 } },
      { deviceId: 'expanse', preset: 'Seasick choir', params: { decay: 17.2 } },
    ],
  },
  {
    id: 'lucid-night-light-plate',
    name: 'Night-light plate',
    category: 'space',
    description:
      'A reel driven as hard as it goes, thick with harmonics, into a medium plate with a smooth tail of a few seconds.',
    effects: [
      { deviceId: 'tape', preset: 'Needles pinned' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { predelayMs: 21.1 } },
    ],
  },
  {
    id: 'lucid-foghorn-hall',
    name: 'Foghorn hall',
    category: 'space',
    description:
      'A glacial low-pass, then an amp in a cupboard, into a hall that answers about a quarter of a second late.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0298, envAttackMs: 11, envReleaseMs: 209 },
      },
      { deviceId: 're-amp', preset: 'In the cupboard' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Late arrival',
        params: { decay: 5.16, breathRate: 0.337 },
      },
    ],
  },
  {
    id: 'lucid-trace-in-the-yard',
    name: 'Trace in the yard',
    category: 'echo',
    description:
      'A faint, dull echo with a slow chorus on it, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Faint halo', params: { time: 229, modRate: 0.447 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 10.7 } },
    ],
  },
  {
    id: 'lucid-sleepwalk-echo',
    name: 'Sleepwalk echo',
    category: 'echo',
    description:
      'An echo whose repeats hop up a fifth and down a fourth, into a big muffled cave that rings for about six seconds.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Fifth hop', params: { time: 365, modRate: 0.528 } },
      { deviceId: 'fdn-reverb', preset: 'Dark cave' },
    ],
  },
  {
    id: 'lucid-back-lane-hop',
    name: 'Back-lane hop',
    category: 'echo',
    description:
      'An echo whose repeats hop up a fifth and down a fourth, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Fifth hop', params: { time: 361, modRate: 0.665 } },
      { deviceId: 'plate-reverb', preset: 'Long plate' },
    ],
  },
  {
    id: 'lucid-yard-repeats',
    name: 'Yard repeats',
    category: 'echo',
    description:
      'A bucket-brigade echo whose soft repeats dull as they fade, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 383, modRate: 0.63 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'lucid-low-water-clock',
    name: 'Low-water clock',
    category: 'echo',
    description:
      'A slow, dull echo from a worn-out bucket-brigade line, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Noisy clock', params: { time: 1190, modRate: 0.648 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 62.6 } },
    ],
  },
  {
    id: 'lucid-echo-heard-asleep',
    name: 'Echo heard asleep',
    category: 'echo',
    description:
      'An echo whose repeats jump up an octave and back, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Octave hop', params: { time: 433, modRate: 0.531 } },
      { deviceId: 'expanse', preset: 'Low cathedral' },
    ],
  },
  {
    id: 'lucid-echo-down-the-mine',
    name: 'Echo down the mine',
    category: 'echo',
    description:
      'Grain repeats that sink by fourths on every pass, into a dark cellar of a room that folds the sound to mono.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling fourths', params: { time: 615, size: 211 } },
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar', params: { decay: 3.22 } },
    ],
  },
  {
    id: 'lucid-echo-in-a-dream',
    name: 'Echo in a dream',
    category: 'echo',
    description:
      'A transformer that fills out the lows and dulls the top, then a slow murky bucket-brigade echo with dull, worn repeats.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'analog-delay', preset: 'Murky' },
    ],
  },
  {
    id: 'lucid-remembered-echo',
    name: 'Remembered echo',
    category: 'echo',
    description:
      'Grain repeats that fall an octave each time, darkening, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { time: 467, size: 223 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.557 } },
    ],
  },
  {
    id: 'lucid-china-clay-echo',
    name: 'China-clay echo',
    category: 'echo',
    description:
      'An echo with a fast flutter in the pitch of its repeats, into a short reverb that swells in just after each note.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Fluttering', params: { time: 212, modRate: 6.4 } },
      {
        deviceId: 'expanse',
        preset: 'Quick swell',
        params: { decay: 1.93, modRate: 0.449, mix: 0.27 },
      },
    ],
  },
  {
    id: 'lucid-drift-out-of-tune',
    name: 'Drift out of tune',
    category: 'echo',
    description:
      'A wide echo whose repeats drift slowly in pitch, into a deep dark well of slow blurred echoes.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Slow drift' },
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { length: 1.16, glide: 0.559 } },
    ],
  },
  {
    id: 'lucid-lights-out-swells',
    name: 'Lights-out swells',
    category: 'echo',
    description:
      'A dark fog of slow backwards swells, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Dark fog', params: { time: 1470 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'lucid-lurch-after-rain',
    name: 'Lurch after rain',
    category: 'echo',
    description:
      'An echo that now and then lurches down a fifth and back, into a single dull spring in the centre that is barely heard.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Slow lurch', params: { time: 374, modRate: 0.637 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { decay: 1.68 } },
    ],
  },
  {
    id: 'lucid-adit-bounce',
    name: 'Adit bounce',
    category: 'echo',
    description:
      'Dotted tape repeats that bounce from side to side, into a large reverb whose tail sinks an octave on every pass.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce' },
      { deviceId: 'shimmer', preset: 'Undertow', params: { decay: 11.1, predelay: 18.4 } },
    ],
  },
  {
    id: 'lucid-drift-at-low-water',
    name: 'Drift at low water',
    category: 'echo',
    description:
      'A wide echo whose repeats drift slowly in pitch, then two copies far out of tune that sway like a worn tape.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Slow drift' },
      { deviceId: 'stereo-detune', preset: 'Seasick' },
    ],
  },
  {
    id: 'lucid-chorus-off-the-coast',
    name: 'Chorus off the coast',
    category: 'echo',
    description:
      'A bucket-brigade echo with a slow chorus on its repeats, into a dull closed-mouth hum of deep voices behind the sound.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 318, modRate: 0.87 } },
      { deviceId: 'vowel-reverb', preset: 'Humming' },
    ],
  },
  {
    id: 'lucid-bracken-lurch',
    name: 'Bracken lurch',
    category: 'echo',
    description:
      'An echo that now and then lurches down a fifth and back, into a reverb that grows backwards behind each note and cuts off.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Slow lurch', params: { time: 365, modRate: 0.549 } },
      { deviceId: 'shaped-reverb', preset: 'Reverse', params: { time: 1.13 } },
    ],
  },
  {
    id: 'lucid-gorse-hop',
    name: 'Gorse hop',
    category: 'echo',
    description:
      'A deep slow chorus on a long delay, swaying over seconds, then an echo whose repeats jump up an octave and back.',
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea' },
      { deviceId: 'analog-delay', preset: 'Octave hop' },
    ],
  },
  {
    id: 'lucid-echoes-in-the-adit',
    name: 'Echoes in the adit',
    category: 'echo',
    description:
      'A huge space that answers in separate far-off echoes, into a small still reverb ringing in stacked octaves and fifths.',
    effects: [
      { deviceId: 'expanse', preset: 'Far echoes' },
      { deviceId: 'shimmer', preset: 'Still pipes', params: { decay: 18.4, predelay: 18.2 } },
    ],
  },
  {
    id: 'lucid-engine-house-memory',
    name: 'Engine-house memory',
    category: 'echo',
    description:
      'A resonant comb that seems to climb without end, then a faint echo and faint recollections behind the playing.',
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Barber pole',
        params: { delay: 11.9, lfoRate: 0.0784, mix: 0.3 },
      },
      {
        deviceId: 'echo-memory',
        preset: 'Faint recall',
        params: { time: 482, reach: 20.8, size: 2.02, mix: 0.09 },
      },
    ],
  },
  {
    id: 'lucid-fuse-box-sampler',
    name: 'Fuse-box sampler',
    category: 'tape',
    description:
      'Worn nine-bit converters, then a wide echo whose repeats drift slowly in pitch, into a small plate that is gone in a second or two.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Worn' },
      { deviceId: 'analog-delay', preset: 'Slow drift' },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'lucid-far-west-dust',
    name: 'Far-west dust',
    category: 'tape',
    description:
      'Dull, shaky converters, then a faint trace of tape echo behind the playing, into a tight damped little room that is barely there.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty' },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 477 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'lucid-far-west-clock',
    name: 'Far-west clock',
    category: 'tape',
    description:
      'Smooth, dull converters whose clock is badly unsteady, then a lurching echo, into a thin veil of reverb kept low under the sound.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Jittery' },
      { deviceId: 'analog-delay', preset: 'Slow lurch' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.0735 } },
    ],
  },
  {
    id: 'lucid-headland-bits',
    name: 'Headland bits',
    category: 'tape',
    description:
      'Four-bit companded converters that rasp on every note, then a murky slow echo, into a faint short reverb with a slight upward drift.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Rasp' },
      { deviceId: 'analog-delay', preset: 'Murky' },
      { deviceId: 'bloom-reverb', preset: 'Faint glow', params: { decay: 3.91 } },
    ],
  },
  {
    id: 'lucid-phone-by-the-hedge',
    name: 'Phone by the hedge',
    category: 'tape',
    description:
      'A digital telephone line, then a soft bucket-brigade echo, into a late wall of reverb that holds and stops dead.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Phone' },
      { deviceId: 'analog-delay', preset: 'Dark echo' },
      { deviceId: 'shaped-reverb', preset: 'Late wall', params: { time: 1.54 } },
    ],
  },
  {
    id: 'lucid-shed-record',
    name: 'Shed record',
    category: 'tape',
    description:
      'A worn record through a dark, dull cartridge, then long backwards phrases an octave down, dark and slow.',
    effects: [
      { deviceId: 'vinyl', preset: 'Dull stylus' },
      { deviceId: 'reverse-delay', preset: 'Undertow', params: { time: 2380 } },
    ],
  },
  {
    id: 'lucid-reel-in-sea-fret',
    name: 'Reel in sea fret',
    category: 'tape',
    description:
      'The whole sound swaying sharp and flat every few seconds, then a tape reel with soft saturation, slight wobble and hiss.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Seasick', params: { delay: 20.7, lfoRate: 0.278 } },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
    ],
  },
  {
    id: 'lucid-cove-grit',
    name: 'Cove grit',
    category: 'tape',
    description:
      'A steep low-pass at four hundred hertz, the top gone, then five-bit converters fed hot, a coarse grain on every note.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-pass gate',
        params: { lfoRateHz: 0.877, envAttackMs: 9.04, envReleaseMs: 198 },
      },
      { deviceId: 'vintage-digital', preset: 'Crushed' },
    ],
  },
  {
    id: 'lucid-half-dreamt-reel',
    name: 'Half-dreamt reel',
    category: 'tape',
    description:
      'A dull hard clipper with no oversampling, so it aliases, then a flaking reel whose sound ducks and dulls at random.',
    effects: [
      { deviceId: 'saturator', preset: 'Lo-fi' },
      { deviceId: 'tape', preset: 'Crumbling oxide', params: { output: -2.54 } },
    ],
  },
  {
    id: 'lucid-tape-half-asleep',
    name: 'Tape half asleep',
    category: 'tape',
    description:
      'A four-track cassette, dull on top, unsteady and hissing, into a small dark room that is gone in about a second.',
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { output: -3.12 } },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'lucid-half-heard-glaze',
    name: 'Half-heard glaze',
    category: 'tape',
    description:
      'A thin twelve-bit glaze from converters at a moderate rate, then a slow murky bucket-brigade echo with dull, worn repeats.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze' },
      { deviceId: 'analog-delay', preset: 'Murky', params: { time: 969, modRate: 0.241 } },
    ],
  },
  {
    id: 'lucid-copper-metal',
    name: 'Copper metal',
    category: 'tape',
    description:
      'A hot valve stage, then folding low-rate converters, into three taut springs kept soft and close to the centre.',
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { output: -6.13 } },
      { deviceId: 'vintage-digital', preset: 'Metallic' },
      { deviceId: 'spring-reverb', preset: 'Narrow warm tank' },
    ],
  },
  {
    id: 'lucid-floorboard-record',
    name: 'Floorboard record',
    category: 'tape',
    description:
      'A badly worn record, swaying in pitch under loud crackle, then echoes that go sour fast, up on the left, down on the right.',
    effects: [
      { deviceId: 'patina', preset: 'Scratched record' },
      { deviceId: 'freq-shifter', preset: 'Parting echo' },
    ],
  },
  {
    id: 'lucid-wonky-tape',
    name: 'Wonky tape',
    category: 'tape',
    description:
      'A mangled cassette that lurches, trembles and drops out, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'tape', preset: 'Chewed cassette', params: { output: -4.86 } },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  {
    id: 'lucid-lullaby-tape',
    name: 'Lullaby tape',
    category: 'tape',
    description:
      'A drifting reel laid half against the dry sound, a chorus, then a tape reel pushed hard into thick saturation.',
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'patina', preset: 'Reel pushed hard' },
    ],
  },
  {
    id: 'lucid-next-door-sampler',
    name: 'Next-door sampler',
    category: 'tape',
    description:
      'A drifting reel laid half against the dry sound, a chorus, then an early sampler at a low rate, its top filtered away.',
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'patina', preset: 'Muffled sampler' },
    ],
  },
  {
    id: 'lucid-inland-tide',
    name: 'Inland tide',
    category: 'motion',
    description:
      'A slow phasing drift from partials moved less than a hertz, into a long dark reverb whose tail sinks slowly in pitch.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { delay: 42.6, lfoRate: 0.0782 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark' },
    ],
  },
  {
    id: 'lucid-sky-from-upstairs',
    name: 'Sky from upstairs',
    category: 'motion',
    description:
      'Echoes that creep sharp on the left and flat on the right, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Split sky' },
      {
        deviceId: 'hall-reverb',
        preset: 'Faint halo',
        params: { preDelay: 43.2, lowDecay: 2.35, midDecay: 3.37 },
      },
    ],
  },
  {
    id: 'lucid-granite-sway',
    name: 'Granite sway',
    category: 'motion',
    description:
      'The whole sound swaying sharp and flat every few seconds, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Seasick' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 27.5, modRate: 0.0982 } },
    ],
  },
  {
    id: 'lucid-cove-ripple',
    name: 'Cove ripple',
    category: 'motion',
    description:
      'A faint, very slow phasing that barely stirs the sound, into a huge dark open space that answers late and rings on.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Still water' },
      { deviceId: 'fdn-reverb', preset: 'Open valley' },
    ],
  },
  {
    id: 'lucid-drift-by-nightlight',
    name: 'Drift by nightlight',
    category: 'motion',
    description:
      'A slow tape chorus, then long backwards phrases an octave down, dark and slow, into a cave whose echoes bend slowly up and down in pitch.',
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'reverse-delay', preset: 'Undertow' },
      { deviceId: 'swarm-reverb', preset: 'Bending', params: { length: 0.51, glide: 1.97 } },
    ],
  },
  {
    id: 'lucid-double-from-the-cove',
    name: 'Double from the cove',
    category: 'motion',
    description:
      'Two duller copies a few cents off, tucked behind the sound, then a shallow three-voice chorus that thickens above the lows.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'chorus', preset: 'Vocal thickener', params: { rate: 0.388, delayMs: 22.1 } },
    ],
  },
  {
    id: 'lucid-china-clay-chorus',
    name: 'China-clay chorus',
    category: 'motion',
    description:
      'A light widening chorus, then a space that answers in hard separate echoes, into a reverb that rises backwards for about four seconds.',
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { rate: 0.273, delayMs: 7.24 } },
      { deviceId: 'expanse', preset: 'Hard echoes', params: { decay: 4.29, modRate: 0.412 } },
      { deviceId: 'shaped-reverb', preset: 'Long rise', params: { time: 3.86 } },
    ],
  },
  {
    id: 'lucid-chorus-in-a-dream',
    name: 'Chorus in a dream',
    category: 'motion',
    description:
      'A three-voice chorus spread wide across the sides, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'chorus', preset: 'Wide chorus', params: { rate: 0.85, delayMs: 10.9 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 58.1 } },
    ],
  },
  {
    id: 'lucid-tinny-comb',
    name: 'Tinny comb',
    category: 'motion',
    description:
      'A short chorus with heavy feedback that rings like metal, into three long springs with all the top taken off.',
    effects: [
      { deviceId: 'chorus', preset: 'Metallic comb' },
      { deviceId: 'spring-reverb', preset: 'Underwater' },
    ],
  },
  {
    id: 'lucid-headland-water',
    name: 'Headland water',
    category: 'motion',
    description:
      'A faint, very slow phasing that barely stirs the sound, into a soft slap close behind each note.',
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Still water',
        params: { delay: 5.65, lfoRate: 0.0471, mix: 0.268 },
      },
      { deviceId: 'analog-delay', preset: 'Slapback', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'lucid-rotary-by-the-hedge',
    name: 'Rotary by the hedge',
    category: 'motion',
    description:
      'A light two-voice chorus that widens more than it moves, then a clean slow rotating speaker blended under the dry sound.',
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { rate: 0.279, delayMs: 8.96 } },
      { deviceId: 'rotary', preset: 'Soft blend' },
    ],
  },
  {
    id: 'lucid-back-lane-riser',
    name: 'Back-lane riser',
    category: 'motion',
    description:
      'Two dull copies that wander, a haze round the notes, then a phaser that climbs for about two seconds and snaps back.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Piano haze', params: { delay: 19.3 } },
      { deviceId: 'phaser', preset: 'Saw riser' },
    ],
  },
  {
    id: 'lucid-foghorn-grains',
    name: 'Foghorn grains',
    category: 'texture',
    description:
      'Scattered grains a fifth down, spread across both sides, then a quick loop of about the last half second, soon faded.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fifth down grains', params: { length: 68.9 } },
      { deviceId: 'micro-looper', preset: 'Quick loop', params: { length: 0.492 } },
    ],
  },
  {
    id: 'lucid-down-the-lane-mist',
    name: 'Down-the-lane mist',
    category: 'texture',
    description:
      'A fast, steady reel pushed into soft saturation, then a wide, darkened wash in which every note slowly dissolves.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { output: -5.46 } },
      { deviceId: 'spectral-blur', preset: 'Slow dissolve' },
    ],
  },
  {
    id: 'lucid-midwinter-pipes',
    name: 'Midwinter pipes',
    category: 'texture',
    description:
      'A steady, unmoving voice per note, like organ pipes, into three slack springs where every echo is a long chirp.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Still pipes' },
      { deviceId: 'spring-reverb', preset: 'Slack and strange' },
    ],
  },
  {
    id: 'lucid-mineshaft-tide',
    name: 'Mineshaft tide',
    category: 'texture',
    description:
      'Long slow grains an octave down, most of them reversed, then a worn dictation cassette, dull, trembling and full of hiss.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Low tide', params: { size: 929, density: 4.4 } },
      { deviceId: 'tape', preset: 'Old dictation' },
    ],
  },
  {
    id: 'lucid-village-hall-swell',
    name: 'Village-hall swell',
    category: 'texture',
    description:
      'A quick swell that opens for loud notes and mutes the rest, into a tight chamber close round the sound for about a second.',
    effects: [
      { deviceId: 'swell', preset: 'Loud notes only', params: { attack: 60.2, release: 39.1 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'lucid-drone-still-ringing',
    name: 'Drone still ringing',
    category: 'texture',
    description:
      'A piece of each note looped into a long, swelling drone, into a hall whose tail sings a soft ah.',
    effects: [
      { deviceId: 'cascade', preset: 'Long drone', params: { time: 823 } },
      { deviceId: 'vowel-reverb', preset: 'Choir of ah', params: { decay: 5.44, preDelay: 17.8 } },
    ],
  },
  {
    id: 'lucid-misheard-hold',
    name: 'Misheard hold',
    category: 'texture',
    description:
      'The first notes played, held as a wide smeared pad, into a dull mono tunnel with a tail of several seconds.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Frozen pad' },
      { deviceId: 'expanse', preset: 'Narrow tunnel' },
    ],
  },
  {
    id: 'lucid-hold-still-ringing',
    name: 'Hold still ringing',
    category: 'texture',
    description:
      'A dark held drone, then three detuned voices spread hard apart with no dry sound, into a hall with about two and a half seconds of tail.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Deep drone' },
      { deviceId: 'chorus', preset: 'Voices only', params: { rate: 0.359, delayMs: 14.1 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { preDelay: 65.1, lowDecay: 3.27, midDecay: 2.35 },
      },
    ],
  },
  {
    id: 'lucid-drowsy-glue',
    name: 'Drowsy glue',
    category: 'texture',
    description:
      'A firm, slow compressor that keeps long swells held down, then a three-voice chorus spread wide across the sides.',
    effects: [
      {
        deviceId: 'ambient-comp',
        preset: 'Hold swells',
        params: { attack: 155, release: 5.58, makeup: 3.83 },
      },
      { deviceId: 'chorus', preset: 'Wide chorus', params: { rate: 0.793, delayMs: 12.5 } },
    ],
  },
  {
    id: 'lucid-octave-sunk-low',
    name: 'Octave sunk low',
    category: 'pitch',
    description:
      'A half-speed replay an octave down, with no dry sound, then an overdriven reel, into a trace of room around the sound.',
    effects: [
      { deviceId: 'half-speed', preset: 'Half speed', params: { length: 922 } },
      { deviceId: 'tape', preset: 'Needles pinned' },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'lucid-copper-loop',
    name: 'Copper loop',
    category: 'pitch',
    description:
      'A loop of the last phrase at half speed, an octave down, then a ruined cassette, into a backwards reverb.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed', params: { length: 2.31 } },
      { deviceId: 'patina', preset: 'Falling apart' },
      { deviceId: 'shaped-reverb', preset: 'Reverse', params: { time: 1.14 } },
    ],
  },
  {
    id: 'lucid-bedside-depths',
    name: 'Bedside depths',
    category: 'pitch',
    description:
      'A quarter-speed copy two octaves down under the dry sound, then a slow tape chorus, into a reverb that falls away in a straight line.',
    effects: [
      { deviceId: 'half-speed', preset: 'Two octaves' },
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'shaped-reverb', preset: 'Falling', params: { time: 1.64, preDelay: 21.5 } },
    ],
  },
  {
    id: 'lucid-unlit-octave',
    name: 'Unlit octave',
    category: 'pitch',
    description:
      'A muffled half-speed octave below, all lows, in the middle, then a muffled cassette, into a small room that is over in about a second.',
    effects: [
      { deviceId: 'half-speed', preset: 'Muffled floor' },
      { deviceId: 'tape', preset: 'Under a blanket', params: { output: -2.02 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'lucid-under-floor-depths',
    name: 'Under-floor depths',
    category: 'pitch',
    description:
      'A quarter-speed crawl two octaves down, smooth and unbroken, into a tiny boxy room that is gone almost at once.',
    effects: [
      { deviceId: 'half-speed', preset: 'Quarter speed', params: { length: 3180 } },
      { deviceId: 'expanse', preset: 'Small box' },
    ],
  },
  {
    id: 'lucid-drowsy-undertow',
    name: 'Drowsy undertow',
    category: 'pitch',
    description:
      'A swell that fades every note in like a bow stroke, then whole phrases dragged out at half speed, an octave down, into a far-off hall.',
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 352, release: 138 } },
      { deviceId: 'half-speed', preset: 'Long drag' },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { lowDecay: 5.62, midDecay: 4.59 } },
    ],
  },
  {
    id: 'lucid-octave-on-the-moor',
    name: 'Octave on the moor',
    category: 'pitch',
    description:
      'A dark octave below held chords, every note moved cleanly, then faint reversed grains that slide up towards the octave.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad below', params: { size: 62.8 } },
      { deviceId: 'spectral-drifter', preset: 'Bloom', params: { decay: 5.05 } },
    ],
  },
  {
    id: 'lucid-lighthouse-fourth',
    name: 'Lighthouse fourth',
    category: 'pitch',
    description:
      'A wide, slowed copy a fourth below that drifts behind, then a phaser that climbs for about two seconds and snaps back.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth down drift' },
      { deviceId: 'phaser', preset: 'Saw riser', params: { rate: 0.506 } },
    ],
  },
  {
    id: 'lucid-adit-undertow',
    name: 'Adit undertow',
    category: 'pitch',
    description:
      'Long backwards phrases an octave down, dark and slow, then ten-bit converters on a shaky clock, dull, with riding hiss.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Undertow' },
      { deviceId: 'vintage-digital', preset: 'Dusty' },
    ],
  },
  {
    id: 'lucid-sub-from-the-cove',
    name: 'Sub from the cove',
    category: 'pitch',
    description:
      'A faint layer of reversed grains an octave below the sound, then a long flanger with strong feedback, diving slowly.',
    effects: [
      { deviceId: 'spectral-drifter', preset: 'Sub octave' },
      { deviceId: 'flanger', preset: 'Deep dive' },
    ],
  },
  {
    id: 'lucid-moorland-undertow',
    name: 'Moorland undertow',
    category: 'pitch',
    description:
      'A firm, slow compressor that keeps long swells held down, then a dark half-speed octave kept low under the dry sound.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells', params: { attack: 147, release: 6.42 } },
      { deviceId: 'half-speed', preset: 'Under the mix', params: { length: 1080 } },
    ],
  },
  {
    id: 'lucid-bedside-tape',
    name: 'Bedside tape',
    category: 'master',
    description:
      'A fresh reel of tape, open on top and nearly steady, then a parallel compressor, then a low, slow ceiling.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 412, release: 2.82 } },
      { deviceId: 'ambient-limiter', preset: 'Late night', params: { release: 4.09 } },
    ],
  },
  {
    id: 'lucid-width-under-slates',
    name: 'Width under slates',
    category: 'master',
    description:
      'A subsonic cut and a slow ear that eases whatever rings on, then the sides lifted a little, wider with nothing added, then a pushed limiter.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 3.13 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'fet-limiter', preset: 'Drive' },
    ],
  },
  {
    id: 'lucid-foghorn-sheen',
    name: 'Foghorn sheen',
    category: 'master',
    description:
      'A quiet plate tail that comes in late behind each note, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { release: 1.63 } },
    ],
  },
  {
    id: 'lucid-hymnbook-room',
    name: 'Hymnbook room',
    category: 'master',
    description:
      'A small plain room that is over in about a second, then a low ceiling with the sound pushed hard up against it.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 1.24, breathRate: 0.304 } },
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { gain: 2.77 } },
    ],
  },
  {
    id: 'lucid-booth-down-the-mine',
    name: 'Booth down the mine',
    category: 'master',
    description:
      'The close reflections of a very small room, then a true-peak ceiling six decibels down, with room to spare.',
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Short ambience',
        params: { decay: 0.366, breathRate: 0.329 },
      },
      { deviceId: 'ambient-limiter', preset: 'Margin' },
    ],
  },
  {
    id: 'lucid-room-under-the-bed',
    name: 'Room under the bed',
    category: 'master',
    description:
      'A tight damped little room that is barely there, then a fast limiter with the level lifted a little into it.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Tight room' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift' },
    ],
  },
]
