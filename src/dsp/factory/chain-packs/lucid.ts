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
      'Two copies heard just after the sound, the left one first, into a large hall whose tail rises and falls every few seconds.',
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
      'A sharp copy hard left, a flat one hard right, heard alone, into a quiet plate tail that comes in late behind each note.',
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
      'A chorus heard alone, its detuned copies spread hard apart, into a dark plate whose tail is soft on top.',
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
      'A plain chorus with a detuned copy towards each side, into a far-off plate haze with a long, soft tail.',
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
      'A big lift of the low end that puts weight under the sound, into a soft sung oo that follows a moment behind each note.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 3.32 } },
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { decay: 3.95, preDelay: 73.8 } },
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
    id: 'lucid-box-room-plate',
    name: 'Box-room plate',
    category: 'space',
    description:
      'A small chapel with a short sung eh in its tail, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Chapel', params: { decay: 1.66, preDelay: 4.5 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
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
    id: 'lucid-shade-heard-asleep',
    name: 'Shade heard asleep',
    category: 'space',
    description:
      'A dark plate whose tail is soft on top, then two dull copies that wander in a haze round the notes.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 15.5 } },
      { deviceId: 'stereo-detune', preset: 'Piano haze' },
    ],
  },
  {
    id: 'lucid-hall-on-the-stairs',
    name: 'Hall on the stairs',
    category: 'space',
    description:
      'Repeats that climb in pitch on the left, sink on the right, into a large hall whose tail rises and falls every few seconds.',
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
      'A chorus heard alone, its detuned copies spread hard apart, into a far-off plate haze with a long, soft tail.',
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
      'A slow swell after each silence that opens only at the end, into a long reverb whose tail wavers queasily in pitch.',
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
    id: 'lucid-eiderdown-voice',
    name: 'Eiderdown voice',
    category: 'space',
    description:
      'An equaliser that takes presence, air and lows away, into a small mono reverb whose tail holds one fixed sung eh.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant' },
      { deviceId: 'vowel-reverb', preset: 'Lone voice' },
    ],
  },
  {
    id: 'lucid-slate-roof-drift',
    name: 'Slate-roof drift',
    category: 'space',
    description:
      'A dark reverb whose tail sags slowly out of tune, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Winter drift', params: { decay: 12.6 } },
      { deviceId: 'expanse', preset: 'Bloom' },
    ],
  },
  {
    id: 'lucid-bedtime-cathedral',
    name: 'Bedtime cathedral',
    category: 'space',
    description:
      'One taut dull spring that answers late and rings long, into a cathedral whose long tail sings a soft open ah.',
    effects: [
      {
        deviceId: 'spring-reverb',
        preset: 'Dark late coil',
        params: { decay: 5.23, predelay: 77 },
      },
      { deviceId: 'vowel-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'lucid-hall-in-the-yard',
    name: 'Hall in the yard',
    category: 'space',
    description:
      'A hall whose lows outlast its damped top, then a high cut set low enough to muffle everything.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 53.9, lowDecay: 4.5, midDecay: 2.7 },
      },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'lucid-hedgerow-cloud',
    name: 'Hedgerow cloud',
    category: 'space',
    description:
      'A mid-forward tone with the lows and the top trimmed, into a cloud of reverb that swells in after each note and fades.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.49 } },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'lucid-shed-drone',
    name: 'Shed drone',
    category: 'space',
    description:
      'A gentle high cut that shades the top end, into a huge hall whose tail hums a soft oo for a long while.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded' },
      { deviceId: 'vowel-reverb', preset: 'Endless oo', params: { decay: 37.5, preDelay: 21.8 } },
    ],
  },
  {
    id: 'lucid-moorland-hall',
    name: 'Moorland hall',
    category: 'space',
    description:
      'Repeats that climb in pitch on the left, sink on the right, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Spiral' },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 10.6, modRate: 0.353 } },
    ],
  },
  {
    id: 'lucid-springs-in-the-yard',
    name: 'Springs in the yard',
    category: 'space',
    description:
      'Repeats that climb in pitch on the left, sink on the right, into a two-spring tank with a little chirp and drip.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Spiral', params: { delay: 40.6 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { decay: 2.68 } },
    ],
  },
  {
    id: 'lucid-lane-end-drift',
    name: 'Lane-end drift',
    category: 'space',
    description:
      'A quick patter of separate echoes behind each note, into a mellow reverb whose tail splits up and down in pitch.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Pattering' },
      { deviceId: 'bloom-reverb', preset: 'Scatter' },
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
      'Grain repeats that fall an octave and darken each time, into a far-off plate haze with a long, soft tail.',
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
    id: 'lucid-echo-under-the-bed',
    name: 'Echo under the bed',
    category: 'echo',
    description:
      'A bucket-brigade echo whose soft repeats dull as they fade, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 336 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 18.1, modRate: 0.236 } },
    ],
  },
  {
    id: 'lucid-unlit-echo',
    name: 'Unlit echo',
    category: 'echo',
    description:
      'A slow murky bucket-brigade echo with dull, worn repeats, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Murky' },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { predelayMs: 19 } },
    ],
  },
  {
    id: 'lucid-echo-barely-awake',
    name: 'Echo barely awake',
    category: 'echo',
    description:
      'An echo that now and then lurches down a fifth and back, into a huge slow wash that swells in and hangs with no dry sound.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Slow lurch', params: { time: 393, modRate: 0.59 } },
      { deviceId: 'expanse', preset: 'Wash alone', params: { decay: 35.8, modRate: 0.105 } },
    ],
  },
  {
    id: 'lucid-seasick-echo',
    name: 'Seasick echo',
    category: 'echo',
    description:
      'An echo that now and then lurches down a fifth and back, then a dark smear of long grains that trails for many seconds.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Slow lurch', params: { time: 323, modRate: 0.559 } },
      { deviceId: 'grain-delay', preset: 'Dark slow smear' },
    ],
  },
  {
    id: 'lucid-tin-roof-echo',
    name: 'Tin-roof echo',
    category: 'echo',
    description:
      'A bucket-brigade echo with a slow chorus on its repeats, then an equaliser that adds lows and body and eases the top.',
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorused',
        params: { time: 308, modRate: 0.979, mix: 0.24 },
      },
      { deviceId: 'ambient-eq', preset: 'Warm' },
    ],
  },
  {
    id: 'lucid-seasick-echoes',
    name: 'Seasick echoes',
    category: 'echo',
    description:
      'Echoes that creep sharp on the left and flat on the right, into a long dark reverb whose tail sinks slowly in pitch.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Split sky', params: { delay: 182, lfoRate: 0.125 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark' },
    ],
  },
  {
    id: 'lucid-echoes-gone-sour',
    name: 'Echoes gone sour',
    category: 'echo',
    description:
      'A shallow chorus that thickens the sound above its lows, then slow echoes that climb further out of tune on each repeat.',
    effects: [
      { deviceId: 'chorus', preset: 'Vocal thickener', params: { rate: 0.449, delayMs: 20.1 } },
      { deviceId: 'freq-shifter', preset: 'Rising echo', params: { delay: 428, lfoRate: 0.088 } },
    ],
  },
  {
    id: 'lucid-bracken-echo',
    name: 'Bracken echo',
    category: 'echo',
    description:
      'An echo that now and then lurches down a fifth and back, into a reverb that swells up behind each note and cuts off.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Slow lurch', params: { time: 311, modRate: 0.659 } },
      { deviceId: 'shaped-reverb', preset: 'Reverse', params: { time: 1.26 } },
    ],
  },
  {
    id: 'lucid-creek-drift',
    name: 'Creek drift',
    category: 'echo',
    description:
      'A tape preamp pushed just enough to add weight, then a wide echo whose repeats drift slowly in pitch, into two taut, long springs.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { output: -4.39 } },
      { deviceId: 'analog-delay', preset: 'Slow drift' },
      { deviceId: 'spring-reverb', preset: 'Tight long tank' },
    ],
  },
  {
    id: 'lucid-echo-through-walls',
    name: 'Echo through walls',
    category: 'echo',
    description:
      'A slow murky bucket-brigade echo with dull, worn repeats, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Murky' },
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.37 } },
    ],
  },
  {
    id: 'lucid-misheard-echo',
    name: 'Misheard echo',
    category: 'echo',
    description:
      'A dull, wobbling, saturated echo on worn tape, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 35.8 } },
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
      'Dull, hissing converters, then a faint trace of tape echo behind the playing, into a tight, damped little room close around the sound.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty' },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 477 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'lucid-shed-record',
    name: 'Shed record',
    category: 'tape',
    description:
      'A worn record through a dark, dull cartridge, then long, dark backwards phrases an octave below the playing.',
    effects: [
      { deviceId: 'vinyl', preset: 'Dull stylus' },
      { deviceId: 'reverse-delay', preset: 'Undertow', params: { time: 2380 } },
    ],
  },
  {
    id: 'lucid-half-dreamt-reel',
    name: 'Half-dreamt reel',
    category: 'tape',
    description:
      'A dull, hard-clipped fuzz with a rough digital edge, then a flaking, hissing reel that ducks and dulls at random.',
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
      'A mangled, hissing cassette that lurches and drops out, into a plate wash that hangs on for half a minute.',
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
      'A drifting reel laid against the dry sound to make a chorus, then a tape reel pushed hard, saturated and thick.',
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
      'A drifting reel laid against the dry sound to make a chorus, then a muffled early sampler, its top filtered away.',
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'patina', preset: 'Muffled sampler' },
    ],
  },
  {
    id: 'lucid-mizzle-sampler',
    name: 'Mizzle sampler',
    category: 'tape',
    description:
      'Converters with false tones, then a wide echo whose repeats drift slowly in pitch, into a single saturated tape echo close behind each note.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Metallic' },
      { deviceId: 'analog-delay', preset: 'Slow drift', params: { time: 709 } },
      { deviceId: 'tape-echo', preset: 'Single slap' },
    ],
  },
  {
    id: 'lucid-small-hours-fuzz',
    name: 'Small-hours fuzz',
    category: 'tape',
    description:
      'Coarse four-bit converters that rasp on every note, then a soft bucket-brigade echo, into a soft, narrow spring tank.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Rasp' },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 400, modRate: 0.629 } },
      {
        deviceId: 'spring-reverb',
        preset: 'Narrow warm tank',
        params: { decay: 1.91, predelay: 16.5 },
      },
    ],
  },
  {
    id: 'lucid-uneasy-sampler',
    name: 'Uneasy sampler',
    category: 'tape',
    description:
      'Toy eight-bit converters, dull, with false tones folded in, then a worn-out, hissing echo, into a trace of room around the sound.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Toy' },
      { deviceId: 'analog-delay', preset: 'Noisy clock', params: { time: 1190, modRate: 0.565 } },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'lucid-bracken-cassette',
    name: 'Bracken cassette',
    category: 'tape',
    description:
      'A thin band of tone, then a muffled cassette, then grain repeats that fall an octave and darken each time.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { clearTime: 1.37 } },
      { deviceId: 'tape', preset: 'Under a blanket' },
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { time: 488, size: 240 } },
    ],
  },
  {
    id: 'lucid-eyes-shut-reel',
    name: 'Eyes-shut reel',
    category: 'tape',
    description:
      'A wide chorus drifting over a cycle of about twelve seconds, then a reel driven as hard as it goes, thick with harmonics.',
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'tape', preset: 'Needles pinned' },
    ],
  },
  {
    id: 'lucid-down-the-lane-signal',
    name: 'Down-the-lane signal',
    category: 'tape',
    description:
      'A low cut that thins the bass, with a little air on top, then an audio stream cut off above the mids, as if through a wall.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture' },
      { deviceId: 'low-bitrate', preset: 'Through a wall' },
    ],
  },
  {
    id: 'lucid-threadbare-cassette',
    name: 'Threadbare cassette',
    category: 'tape',
    description:
      'A ruined cassette that lurches, drops out and hisses hard, then a short, soft tape echo close behind the playing.',
    effects: [
      { deviceId: 'patina', preset: 'Falling apart' },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 174 } },
    ],
  },
  {
    id: 'lucid-inland-tide',
    name: 'Inland tide',
    category: 'motion',
    description:
      'A slow phasing drift that turns over every few seconds, into a long dark reverb whose tail sinks slowly in pitch.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { delay: 42.6, lfoRate: 0.0782 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark' },
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
      'A faint phasing that turns over about every twelve seconds, into a huge dark open space that answers late and rings on.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Still water' },
      { deviceId: 'fdn-reverb', preset: 'Open valley' },
    ],
  },
  {
    id: 'lucid-chorus-in-a-dream',
    name: 'Chorus in a dream',
    category: 'motion',
    description:
      'A full chorus spread wide to left and right, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'chorus', preset: 'Wide chorus', params: { rate: 0.85, delayMs: 10.9 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 58.1 } },
    ],
  },
  {
    id: 'lucid-china-clay-sway',
    name: 'China-clay sway',
    category: 'motion',
    description:
      'The whole sound swaying sharp and flat every few seconds, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Seasick' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.582 } },
    ],
  },
  {
    id: 'lucid-back-lane-double',
    name: 'Back-lane double',
    category: 'motion',
    description:
      'Two copies far out of tune that sway like a worn tape, into a large hall heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Seasick' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Full wet send',
        params: { decay: 8.52, breathRate: 0.273 },
      },
    ],
  },
  {
    id: 'lucid-far-west-chorus',
    name: 'Far-west chorus',
    category: 'motion',
    description:
      'A wide detune, sharp on the left and flat on the right, then a thick ensemble chorus turning about every two seconds.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Detuned', params: { delay: 49.4, lfoRate: 0.548 } },
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { rate: 0.497, delayMs: 17.7 } },
    ],
  },
  {
    id: 'lucid-phaser-in-the-adit',
    name: 'Phaser in the adit',
    category: 'motion',
    description:
      'A four-stage phaser with two broad notches, turning slowly, into a faint scatter of echoes just behind the sound.',
    effects: [
      { deviceId: 'phaser', preset: 'Classic four-stage', params: { rate: 0.302 } },
      { deviceId: 'swarm-reverb', preset: 'Faint scatter' },
    ],
  },
  {
    id: 'lucid-reel-under-slates',
    name: 'Reel under slates',
    category: 'motion',
    description:
      'A slow reel that trembles fast, mixed against the dry sound, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'tape', preset: 'Flutter shimmer', params: { output: -6.71 } },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { predelayMs: 54.9 } },
    ],
  },
  {
    id: 'lucid-foghorn-wobble',
    name: 'Foghorn wobble',
    category: 'motion',
    description:
      'Two copies far out of tune that sway like a worn tape, into a small dead booth that is gone almost at once.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Seasick' },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },
  {
    id: 'lucid-chorus-in-the-lane',
    name: 'Chorus in the lane',
    category: 'motion',
    description:
      'A chorus on the upper range that leaves the lows steady, into a wide room heard from its far end.',
    effects: [
      { deviceId: 'chorus', preset: 'Guitar shimmer' },
      { deviceId: 'ether-reverb', preset: 'Distant' },
    ],
  },
  {
    id: 'lucid-headland-chorus',
    name: 'Headland chorus',
    category: 'motion',
    description:
      'A trace of dull detuned copies at the edges, then a warped record mixed against the dry sound as a slow chorus.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Faint width', params: { delay: 13.5 } },
      { deviceId: 'vinyl', preset: 'Warp chorus', params: { spin: 1.41 } },
    ],
  },
  {
    id: 'lucid-foghorn-grains',
    name: 'Foghorn grains',
    category: 'texture',
    description:
      'Scattered grains a fifth down, spread across both sides, then a quick loop of about the last half second that soon fades.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fifth down grains', params: { length: 68.9 } },
      { deviceId: 'micro-looper', preset: 'Quick loop', params: { length: 0.492 } },
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
    id: 'lucid-pylon-swell',
    name: 'Pylon swell',
    category: 'texture',
    description:
      'A string pad that takes seconds to swell in after a chord, then a glacial low-pass, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Slow swell', params: { rise: 4.37, fall: 7.77 } },
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0333, envAttackMs: 10.8, envReleaseMs: 218 },
      },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'lucid-dreamt-mist',
    name: 'Dreamt mist',
    category: 'texture',
    description:
      'A wide, darkened wash in which every note slowly dissolves, into a dark reverb that rises behind each note, then lingers.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { mix: 0.42 } },
      {
        deviceId: 'shaped-reverb',
        preset: 'Ghost',
        params: { time: 1.76, preDelay: 57.1, mix: 0.3 },
      },
    ],
  },
  {
    id: 'lucid-haze-off-the-coast',
    name: 'Haze off the coast',
    category: 'texture',
    description:
      'A wide haze of grains that hangs on long after the playing, then a flaking, hissing reel that ducks and dulls at random.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Frozen haze' },
      { deviceId: 'tape', preset: 'Crumbling oxide' },
    ],
  },
  {
    id: 'lucid-drift-by-the-hedge',
    name: 'Drift by the hedge',
    category: 'texture',
    description:
      'A held pad whose every overtone wavers in pitch and level, then converters at a very low rate, filtered smooth and dull.',
    effects: [
      { deviceId: 'sustainer', preset: 'Wavering choir', params: { attack: 0.381, glide: 0.601 } },
      { deviceId: 'vintage-digital', preset: 'Sunken' },
    ],
  },
  {
    id: 'lucid-depths-past-the-shed',
    name: 'Depths past the shed',
    category: 'texture',
    description:
      'A short swell that rounds the front off every note, then a blurred bed of bass that hangs low under the sound.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack' },
      { deviceId: 'spectral-blur', preset: 'Sub bed' },
    ],
  },
  {
    id: 'lucid-pad-from-far-off',
    name: 'Pad from far off',
    category: 'texture',
    description:
      'A held pad that stands alone in place of what was played, into one taut dull spring that answers late and rings long.',
    effects: [
      { deviceId: 'sustainer', preset: 'Held sound alone' },
      {
        deviceId: 'spring-reverb',
        preset: 'Dark late coil',
        params: { decay: 5.08, predelay: 71.3 },
      },
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
      'A half-speed loop, then a ruined cassette, into a reverb that swells up behind each note and cuts off.',
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
      'A copy two octaves down, then a slow tape chorus, into a reverb that fades evenly to nothing in a second or two.',
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
      'A muffled half-speed octave below, kept in the centre, then a muffled cassette, into a small room that is over in about a second.',
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
      'Long, dark backwards phrases an octave below the playing, then dull ten-bit converters that hiss along with every note.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Undertow' },
      { deviceId: 'vintage-digital', preset: 'Dusty' },
    ],
  },
  {
    id: 'lucid-bedtime-grains',
    name: 'Bedtime grains',
    category: 'pitch',
    description:
      'Scattered grains a fifth down, spread across both sides, then a slow reel that trembles fast, mixed against the dry sound.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fifth down grains' },
      { deviceId: 'tape', preset: 'Flutter shimmer' },
    ],
  },
  {
    id: 'lucid-echo-past-the-shed',
    name: 'Echo past the shed',
    category: 'pitch',
    description:
      'Grain repeats that sink by fourths on every pass, then a phaser with no dry sound, pulling the two sides apart.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling fourths', params: { time: 584, size: 175 } },
      { deviceId: 'phaser', preset: 'Stereo scatter' },
    ],
  },
  {
    id: 'lucid-sea-fret-mixdown',
    name: 'Sea-fret mixdown',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'lucid-gorse-master',
    name: 'Gorse master',
    category: 'master',
    description:
      'A rumble cut and a small lift of presence, then an even-handed compressor, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Keys', params: { clearTime: 1.4 } },
      { deviceId: 'ambient-comp', preset: 'Keys', params: { attack: 135, release: 1.58 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { release: 1.42 } },
    ],
  },
  {
    id: 'lucid-polish-from-upstairs',
    name: 'Polish from upstairs',
    category: 'master',
    description:
      'A parallel compressor that lifts quiet playing and tails, then a fast limiter that steps in only on the loudest peaks.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 377, release: 2.8 } },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'lucid-tin-mine-finish',
    name: 'Tin-mine finish',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a gentle compressor that draws loud and quiet together, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-comp', preset: 'Sit back' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 5.71 } },
    ],
  },
  {
    id: 'lucid-half-asleep-master',
    name: 'Half-asleep master',
    category: 'master',
    description:
      'A small dip in the low mids, then a slightly wider image, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Drone', params: { clearTime: 1.33 } },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { release: 1.37, gain: 2.06 } },
    ],
  },
  {
    id: 'lucid-half-heard-finish',
    name: 'Half-heard finish',
    category: 'master',
    description:
      'The first hint of weight from a tape preamp, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
]
