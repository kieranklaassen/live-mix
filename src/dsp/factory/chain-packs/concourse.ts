// Empty Concourse: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'concourse-air-bridge-choir',
    name: 'Air-bridge choir',
    category: 'space',
    description:
      'A bowed swell at half strength under the dry attacks, then a late reverb that climbs by octaves and fifths, into a vast nave.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed', params: { attack: 330, release: 165 } },
      { deviceId: 'shimmer', preset: 'Late answer' },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'concourse-shuttered-shimmer',
    name: 'Shuttered shimmer',
    category: 'space',
    description:
      'A seconds-long swell, then a reverb whose tail climbs an octave on every pass, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 2680, release: 755 } },
      { deviceId: 'shimmer', preset: 'Rising choir' },
      {
        deviceId: 'hall-reverb',
        preset: 'Faint halo',
        params: { preDelay: 38.3, lowDecay: 2.59, midDecay: 2.83 },
      },
    ],
  },
  {
    id: 'concourse-halo-at-last-call',
    name: 'Halo at last call',
    category: 'space',
    description:
      'A half-hidden slow swell, then a vast reverb where most of the tail climbs by octaves, into a medium plate.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1370, release: 318 } },
      { deviceId: 'shimmer', preset: 'Endless ascent' },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { predelayMs: 20.8 } },
    ],
  },
  {
    id: 'concourse-apron-choir',
    name: 'Apron choir',
    category: 'space',
    description:
      'A short swell that rounds the front off every note, then a late reverb that climbs by octaves and fifths, into a bright plate.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 175, release: 81.6 } },
      { deviceId: 'shimmer', preset: 'Late answer', params: { decay: 9.9, predelay: 372 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'concourse-standby-rise',
    name: 'Standby rise',
    category: 'space',
    description:
      'A slow swell after each silence that opens only at the end, then a long climbing tail, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 1410, release: 806 } },
      { deviceId: 'bloom-reverb', preset: 'Endless rise' },
      { deviceId: 'expanse', preset: 'Open space' },
    ],
  },
  {
    id: 'concourse-whisper-on-the-apron',
    name: 'Whisper on the apron',
    category: 'space',
    description:
      'A medium hall with only a breath of a vowel in its tail, then a tape loop at half speed, an octave down and darker.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Whispering' },
      { deviceId: 'tape-loop', preset: 'Slowed down' },
    ],
  },
  {
    id: 'concourse-kerbside-choir',
    name: 'Kerbside choir',
    category: 'space',
    description:
      'A soft sung oo that follows a moment behind each note, then a thin, far-off tape loop with its lows cut away.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Oo behind' },
      { deviceId: 'tape-loop', preset: 'Thin and distant', params: { length: 2.35 } },
    ],
  },
  {
    id: 'concourse-contrail-murmur',
    name: 'Contrail murmur',
    category: 'space',
    description:
      'Faint voices singing quietly behind the sound, then earlier moments of the playing drifting back with no echo.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Faint voices' },
      { deviceId: 'echo-memory', preset: 'No echo' },
    ],
  },
  {
    id: 'concourse-last-call-nave',
    name: 'Last-call nave',
    category: 'space',
    description:
      'A cathedral whose long tail sings a soft open ah, then a loop of the last phrase at half speed, an octave down.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Cathedral' },
      { deviceId: 'micro-looper', preset: 'Half speed', params: { length: 2.49 } },
    ],
  },
  {
    id: 'concourse-strings-left-running',
    name: 'Strings left running',
    category: 'space',
    description:
      'Eight strings in C major that ring on as under a held pedal, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Piano pedal', params: { decay: 3.08 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 14.4, modRate: 0.273 } },
    ],
  },
  {
    id: 'concourse-tube-lit-harp',
    name: 'Tube-lit harp',
    category: 'space',
    description:
      'Twelve strings in A minor that ring with notes in that key, into a long undamped tail kept low behind the sound.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { mix: 0.274 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail', params: { predelayMs: 27, mix: 0.12 } },
    ],
  },
  {
    id: 'concourse-red-eye-strings',
    name: 'Red-eye strings',
    category: 'space',
    description:
      'Ten strings that tune themselves to the notes they hear, into a hall whose lows ring on long after the rest has gone.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Follow the tune', params: { decay: 4.44, mix: 0.3 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 65.9, midDecay: 2.21, mix: 0.24 },
      },
    ],
  },
  {
    id: 'concourse-outbound-strings',
    name: 'Outbound strings',
    category: 'space',
    description:
      'Sixteen strings that learn the tune and ring on long, into a huge dark open space that answers late and rings on.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Learn and hold' },
      { deviceId: 'fdn-reverb', preset: 'Open valley' },
    ],
  },
  {
    id: 'concourse-concourse-halo',
    name: 'Concourse halo',
    category: 'space',
    description:
      'A gentle low-pass at a kilohertz, into a muffled reverb whose octave climb is soon damped away.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { lfoRateHz: 1.04, envAttackMs: 10.5, envReleaseMs: 186 },
      },
      { deviceId: 'shimmer', preset: 'Muffled choir', params: { decay: 13.2, predelay: 18.8 } },
    ],
  },
  {
    id: 'concourse-long-haul-haze',
    name: 'Long-haul haze',
    category: 'space',
    description:
      'A deep, slow compressor that lifts a quiet bed and holds it, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      {
        deviceId: 'ambient-comp',
        preset: 'Drone bed',
        params: { attack: 673, release: 10.3, makeup: 3.15 },
      },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'concourse-runway-drone',
    name: 'Runway drone',
    category: 'space',
    description:
      'Four long strings on an A minor chord held in the centre, into a hall heard from far off with little dry sound left.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Centre drone', params: { decay: 9.8 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { lowDecay: 4.99, midDecay: 4.21 } },
    ],
  },
  {
    id: 'concourse-touchdown-choir',
    name: 'Touchdown choir',
    category: 'space',
    description:
      'A huge hall whose tail hums a soft oo for a long while, into a long undamped tail kept low behind the sound.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Endless oo', params: { decay: 38.3, preDelay: 19 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail', params: { predelayMs: 31.8 } },
    ],
  },
  {
    id: 'concourse-boarding-wash',
    name: 'Boarding wash',
    category: 'space',
    description:
      'A small plate that is gone in a second or two, into a dark hall that takes about twenty seconds to die away.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { predelayMs: 10.4 } },
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0809 } },
    ],
  },
  {
    id: 'concourse-strings-on-a-layover',
    name: 'Strings on a layover',
    category: 'space',
    description:
      'A swell that takes seconds to rise after each silence, into four long strings on an A minor chord held in the centre.',
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 2810, release: 623 } },
      { deviceId: 'sympathetic', preset: 'Centre drone' },
    ],
  },
  {
    id: 'concourse-hall-at-the-desk',
    name: 'Hall at the desk',
    category: 'space',
    description:
      'A low cut with the low mids dipped and the presence lifted, into a plain hall that rings for about three seconds.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Voice' },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 3.06, predelay: 13.7 } },
    ],
  },
  {
    id: 'concourse-inbound-glass',
    name: 'Inbound glass',
    category: 'space',
    description:
      'A small glassy reverb with a glint two octaves up, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'shimmer', preset: 'Glass' },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 73.9, lowDecay: 6.77, midDecay: 6.41 },
      },
    ],
  },
  {
    id: 'concourse-small-hours-depths',
    name: 'Small-hours depths',
    category: 'space',
    description:
      'A valve preamp curve, lopsided and a little brighter on top, into a long dark reverb whose tail sinks slowly in pitch.',
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp' },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { decay: 21.6 } },
    ],
  },
  {
    id: 'concourse-pre-dawn-hall',
    name: 'Pre-dawn hall',
    category: 'space',
    description:
      'Two dark late copies, a shadow either side of the sound, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Shadow', params: { delay: 25.6 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 46.7, lowDecay: 4.27, midDecay: 3.09 },
      },
    ],
  },
  {
    id: 'concourse-halo-on-standby',
    name: 'Halo on standby',
    category: 'space',
    description:
      "A smooth swell on every note, like a string section's bows, into a vast reverb where most of the tail climbs by octaves.",
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 343, release: 650 } },
      { deviceId: 'shimmer', preset: 'Endless ascent', params: { decay: 27.1, predelay: 54 } },
    ],
  },
  {
    id: 'concourse-hangar-hallway',
    name: 'Hangar hallway',
    category: 'space',
    description:
      'A sharp and a flat copy kept in the centre, thick not wide, then a combo amplifier heard from the far side of a big room.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Thickener' },
      { deviceId: 're-amp', preset: 'Down the hall', params: { output: -2.17 } },
    ],
  },
  {
    id: 'concourse-terrazzo-loop',
    name: 'Terrazzo loop',
    category: 'echo',
    description:
      'A short tape loop where each pass comes back quieter, then a wide muffled loop, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow fade' },
      { deviceId: 'micro-looper', preset: 'Underwater' },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 18.7, modRate: 0.224 } },
    ],
  },
  {
    id: 'concourse-gate-side-wash',
    name: 'Gate-side wash',
    category: 'echo',
    description:
      'A warm, full equaliser, then dotted tape repeats that pile up in a darkening wash, then a fast, steady reel pushed into soft saturation.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.45 } },
      { deviceId: 'tape-echo', preset: 'Dub wash' },
      { deviceId: 'tape', preset: 'Mastering deck' },
    ],
  },
  {
    id: 'concourse-window-seat-loop',
    name: 'Window-seat loop',
    category: 'echo',
    description:
      'A low cut that thins the bass, with a little air on top, then a tape loop whose passes cross from side to side, then a muffled cassette.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture' },
      { deviceId: 'tape-loop', preset: 'Crossing sides' },
      { deviceId: 'tape', preset: 'Under a blanket' },
    ],
  },
  {
    id: 'concourse-memory-on-level-two',
    name: 'Memory on level two',
    category: 'echo',
    description:
      'A gentle high cut that shades the top end, then a soft echo while earlier phrases drift back under it, then a fast steady reel.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded' },
      {
        deviceId: 'echo-memory',
        preset: 'Recalling',
        params: { time: 554, reach: 20.3, size: 2.64 },
      },
      { deviceId: 'tape', preset: 'Mastering deck' },
    ],
  },
  {
    id: 'concourse-wash-after-dark',
    name: 'Wash after dark',
    category: 'echo',
    description:
      'A slightly eased equaliser, then dotted tape repeats that pile up in a darkening wash, then a fast, steady reel pushed into soft saturation.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Drone' },
      { deviceId: 'tape-echo', preset: 'Dub wash', params: { time: 839 } },
      { deviceId: 'tape', preset: 'Mastering deck', params: { output: 2.49 } },
    ],
  },
  {
    id: 'concourse-departure-echo',
    name: 'Departure echo',
    category: 'echo',
    description:
      'A heavy low shelf that puts weight under the sound, then a slow echo with a long dark trail and a few recollections.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 2.89 } },
      { deviceId: 'echo-memory', preset: 'Dark trail' },
    ],
  },
  {
    id: 'concourse-midweek-repeats',
    name: 'Midweek repeats',
    category: 'echo',
    description:
      'The level breathing in and out about every four seconds, then a tape echo whose warm repeats soften as they fade.',
    effects: [
      { deviceId: 'tremolo', preset: 'Gentle breath' },
      { deviceId: 'tape-echo', preset: 'Warm repeats' },
    ],
  },
  {
    id: 'concourse-pre-dawn-echo',
    name: 'Pre-dawn echo',
    category: 'echo',
    description:
      'A fresh reel of tape, open on top and nearly steady, then a slow tape echo with a long trail that dulls as it goes.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { time: 1310 } },
    ],
  },
  {
    id: 'concourse-overnight-loop',
    name: 'Overnight loop',
    category: 'echo',
    description:
      'A quick loop of about the last half second, soon faded, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Quick loop' },
      {
        deviceId: 'hall-reverb',
        preset: 'Faint halo',
        params: { preDelay: 42.8, lowDecay: 2.75, midDecay: 3.3 },
      },
    ],
  },
  {
    id: 'concourse-memory-at-arrivals',
    name: 'Memory at arrivals',
    category: 'echo',
    description:
      'Recalled moments that mostly come back reversed or slowed, then three tape heads in a row, a cluster on every repeat.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Backwards',
        params: { time: 610, reach: 14.6, size: 1.38 },
      },
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 539 } },
    ],
  },
  {
    id: 'concourse-check-in-repeats',
    name: 'Check-in repeats',
    category: 'echo',
    description:
      'A plain echo that is a little darker on each repeat, then a short, soft tape echo close behind the playing.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Plain echo',
        params: { time: 344, reach: 21.4, size: 3.27 },
      },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 174 } },
    ],
  },
  {
    id: 'concourse-last-call-fog',
    name: 'Last-call fog',
    category: 'echo',
    description:
      'A dark fog of slow backwards swells, then a wash of three fed-back tape heads that hovers and fades.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Dark fog' },
      { deviceId: 'tape-echo', preset: 'Hovering wash' },
    ],
  },
  {
    id: 'concourse-connecting-loop',
    name: 'Connecting loop',
    category: 'echo',
    description:
      'A loop of the last phrase played backwards as a bed, into a cloud of reverb that swells in after each note and fades.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Reverse bed', params: { length: 3.2 } },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 2.3 } },
    ],
  },
  {
    id: 'concourse-stairs-at-the-kerb',
    name: 'Stairs at the kerb',
    category: 'echo',
    description:
      'Backwards repeats that step down an octave each time, into a hall whose tail sings a high ee.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Descending steps', params: { time: 443 } },
      { deviceId: 'vowel-reverb', preset: 'High ee' },
    ],
  },
  {
    id: 'concourse-vacant-echo',
    name: 'Vacant echo',
    category: 'echo',
    description:
      'A steady tape echo with no wobble, dirt or dulling, into five strings in F major that ring for about half a second.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Clean and steady', params: { time: 492 } },
      { deviceId: 'sympathetic', preset: 'Brief pluck' },
    ],
  },
  {
    id: 'concourse-transit-oxide',
    name: 'Transit oxide',
    category: 'echo',
    description:
      'A tape loop that wears thinner and duller on every pass, into a long tail that wavers in pitch like an unsteady choir.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Worn out', params: { length: 3.26 } },
      { deviceId: 'expanse', preset: 'Seasick choir' },
    ],
  },
  {
    id: 'concourse-inbound-echo',
    name: 'Inbound echo',
    category: 'echo',
    description:
      'A faint trace of tape echo behind the playing, then a honky horn loudspeaker heard from far across a big room.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Faint trace' },
      { deviceId: 're-amp', preset: 'Station platform', params: { output: 4.79 } },
    ],
  },
  {
    id: 'concourse-stopover-bounce',
    name: 'Stopover bounce',
    category: 'echo',
    description:
      'A deep eight-stage phaser with sharp peaks between notches, then dotted tape repeats that bounce from side to side.',
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage' },
      { deviceId: 'tape-echo', preset: 'Dotted bounce' },
    ],
  },
  {
    id: 'concourse-standby-trace',
    name: 'Standby trace',
    category: 'echo',
    description:
      'A faint, soft loop of the last phrase, gone in a few passes, then an echo about four seconds late, with older phrases recalled.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Faint bed' },
      {
        deviceId: 'echo-memory',
        preset: 'Late return',
        params: { time: 3710, reach: 35.5, size: 3.59 },
      },
    ],
  },
  {
    id: 'concourse-off-peak-sparkle',
    name: 'Off-peak sparkle',
    category: 'echo',
    description:
      'A short loop at double speed, an octave up and soon gone, into a bright wide room that rings for a second or two.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Octave up', params: { length: 1.23 } },
      { deviceId: 'ether-reverb', preset: 'Ether' },
    ],
  },
  {
    id: 'concourse-echo-on-the-hour',
    name: 'Echo on the hour',
    category: 'echo',
    description:
      'A plain echo that is a little darker on each repeat, into an undamped hall with about three seconds of tail.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Plain echo' },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { decay: 2.63, breathRate: 0.311 } },
    ],
  },
  {
    id: 'concourse-walkway-memory',
    name: 'Walkway memory',
    category: 'echo',
    description:
      'An overdriven reel, then a very late echo and recalls, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'tape', preset: 'Needles pinned' },
      {
        deviceId: 'echo-memory',
        preset: 'Late return',
        params: { time: 3590, reach: 37.7, size: 3.61 },
      },
      { deviceId: 'expanse', preset: 'Low cathedral' },
    ],
  },
  {
    id: 'concourse-echo-between-gates',
    name: 'Echo between gates',
    category: 'echo',
    description:
      'A tape echo whose warm repeats soften as they fade, into a small room that casts a shadow an octave below.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats' },
      { deviceId: 'shimmer', preset: 'Low shadow', params: { decay: 2.17, predelay: 22 } },
    ],
  },
  {
    id: 'concourse-half-heard-slap',
    name: 'Half-heard slap',
    category: 'echo',
    description:
      'A single saturated tape slap behind each note, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 98.1 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { lowDecay: 7.42, midDecay: 7.51 } },
    ],
  },
  {
    id: 'concourse-empty-row-echo',
    name: 'Empty-row echo',
    category: 'echo',
    description:
      'A rotating speaker on its slow speed, then a short, soft tape echo close behind the playing.',
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 176 } },
    ],
  },
  {
    id: 'concourse-memory-till-morning',
    name: 'Memory till morning',
    category: 'echo',
    description:
      'A soft echo while earlier phrases drift back under it, then a mid-forward tone, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Recalling' },
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.54 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite' },
    ],
  },
  {
    id: 'concourse-drizzle-tide',
    name: 'Drizzle tide',
    category: 'echo',
    description:
      'Slow backwards swells that rise and die behind the playing, into a soft sung oo that follows a moment behind each note.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 1640 } },
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { preDelay: 71.5 } },
    ],
  },
  {
    id: 'concourse-sodium-reel',
    name: 'Sodium reel',
    category: 'tape',
    description:
      'A tape reel pushed hard into thick saturation, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard', params: { output: -6.23 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite' },
    ],
  },
  {
    id: 'concourse-escalator-thump',
    name: 'Escalator thump',
    category: 'tape',
    description:
      'A cassette with a full head bump and a rolled-off top, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'fdn-reverb', preset: 'Breathing' },
    ],
  },
  {
    id: 'concourse-ghosts-in-transit',
    name: 'Ghosts in transit',
    category: 'tape',
    description:
      'A double-speed tape loop, an octave up and thin, then a worn dictation cassette, dull, trembling and full of hiss.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Octave up ghosts' },
      { deviceId: 'tape', preset: 'Old dictation' },
    ],
  },
  {
    id: 'concourse-atrium-reel',
    name: 'Atrium reel',
    category: 'tape',
    description:
      'A tape loop at half speed, an octave down and darker, then a reel of tape, into a plain hall of about four seconds with no vowel in it.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down' },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'vowel-reverb', preset: 'Plain hall', params: { decay: 4.44, preDelay: 18 } },
    ],
  },
  {
    id: 'concourse-tarmac-chorus',
    name: 'Tarmac chorus',
    category: 'tape',
    description:
      'A drifting reel laid half against the dry sound, a chorus, then echoes that fall a fourth further on every repeat.',
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'pitch-shifter', preset: 'Falling steps' },
    ],
  },
  {
    id: 'concourse-red-eye-reel',
    name: 'Red-eye reel',
    category: 'tape',
    description:
      'A tape reel pushed hard into thick saturation, then a slow tape echo with a long trail that dulls as it goes.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'tape-echo', preset: 'Long dark trail' },
    ],
  },
  {
    id: 'concourse-half-heard-tape',
    name: 'Half-heard tape',
    category: 'tape',
    description:
      'A transformer overloaded into a thick, loose fuzz, then a clean pass over fast new tape, with nothing added.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron melt' },
      { deviceId: 'tape', preset: 'Clean transfer', params: { output: -2.09 } },
    ],
  },
  {
    id: 'concourse-reel-for-nobody',
    name: 'Reel for nobody',
    category: 'tape',
    description:
      'A slow reel whose pitch sways widely and never settles, into a tiny boxy room that is gone almost at once.',
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { output: -2.21 } },
      { deviceId: 'expanse', preset: 'Small box', params: { decay: 0.505 } },
    ],
  },
  {
    id: 'concourse-reel-through-glass',
    name: 'Reel through glass',
    category: 'tape',
    description:
      'A scooped tone with lows and highs up and the body down, then a trembling reel, then a soft echo while earlier phrases drift back under it.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Hollow', params: { clearTime: 1.46 } },
      { deviceId: 'tape', preset: 'Flutter shimmer', params: { output: -0.747 } },
      { deviceId: 'echo-memory', preset: 'Recalling' },
    ],
  },
  {
    id: 'concourse-gate-side-cassette',
    name: 'Gate-side cassette',
    category: 'tape',
    description:
      'A wearing tape loop, then a cassette with a full head bump and a rolled-off top, into a dull mono tunnel with a tail of several seconds.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Worn out', params: { length: 2.95 } },
      { deviceId: 'tape', preset: 'Warm thump', params: { output: 2.15 } },
      { deviceId: 'expanse', preset: 'Narrow tunnel' },
    ],
  },
  {
    id: 'concourse-filter-taken-slowly',
    name: 'Filter taken slowly',
    category: 'motion',
    description:
      'A low-pass that opens and closes over about half a minute, into a reverb whose tail climbs in fifths as it rings.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0269, envAttackMs: 8.81, envReleaseMs: 221 },
      },
      { deviceId: 'shimmer', preset: 'Fifths' },
    ],
  },
  {
    id: 'concourse-hollow-in-low-cloud',
    name: 'Hollow in low cloud',
    category: 'motion',
    description:
      'A hollow phaser with peaks where its notches would be, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'phaser', preset: 'Negative notch' },
      { deviceId: 'fdn-reverb', preset: 'Breathing' },
    ],
  },
  {
    id: 'concourse-transfer-ripple',
    name: 'Transfer ripple',
    category: 'motion',
    description:
      'A three-voice chorus that leaves the lows dry and steady, into a single saturated tape slap behind each note.',
    effects: [
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { rate: 1.24, delayMs: 13.9 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 98 } },
    ],
  },
  {
    id: 'concourse-taxiing-chorus',
    name: 'Taxiing chorus',
    category: 'motion',
    description:
      'A slow compressor that evens out swells over seconds, then a hollow three-voice chorus swelling over about ten seconds.',
    effects: [
      {
        deviceId: 'ambient-comp',
        preset: 'Level',
        params: { attack: 273, release: 1.81, makeup: 2.82 },
      },
      { deviceId: 'chorus', preset: 'Hollow swell', params: { rate: 0.106, delayMs: 8.23 } },
    ],
  },
  {
    id: 'concourse-chorale-at-last-call',
    name: 'Chorale at last call',
    category: 'motion',
    description:
      'A rotating speaker on its slow speed, then a side-to-side echo, into a long dark reverb whose tail sinks slowly in pitch.',
    effects: [
      { deviceId: 'rotary', preset: 'Chorale' },
      { deviceId: 'echo-memory', preset: 'Side to side' },
      { deviceId: 'bloom-reverb', preset: 'Long dark' },
    ],
  },
  {
    id: 'concourse-courtesy-water',
    name: 'Courtesy water',
    category: 'motion',
    description:
      'A faint, very slow phasing that barely stirs the sound, into a room heard from its far end with little dry sound left.',
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Still water',
        params: { delay: 5.81, lfoRate: 0.0441, mix: 0.268 },
      },
      { deviceId: 'ether-reverb', preset: 'Distant', params: { mix: 0.42 } },
    ],
  },
  {
    id: 'concourse-wide-bodied-tide',
    name: 'Wide-bodied tide',
    category: 'motion',
    description:
      'A slow phasing drift from partials moved less than a hertz, then a high cut set low enough to muffle everything.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { delay: 41.8, lfoRate: 0.072 } },
      { deviceId: 'ambient-eq', preset: 'Muffled', params: { clearTime: 1.65 } },
    ],
  },
  {
    id: 'concourse-rotary-at-the-pier',
    name: 'Rotary at the pier',
    category: 'motion',
    description:
      'A slow rotating speaker with its amplifier driven hard, into a small room that casts a shadow an octave below.',
    effects: [
      { deviceId: 'rotary', preset: 'Slow burn' },
      { deviceId: 'shimmer', preset: 'Low shadow', params: { mix: 0.21 } },
    ],
  },
  {
    id: 'concourse-frost-all-night',
    name: 'Frost all night',
    category: 'texture',
    description:
      'A thin, bright held pad with everything low taken out, then a slow rotating speaker heard from across the room.',
    effects: [
      { deviceId: 'sustainer', preset: 'High frost' },
      { deviceId: 'rotary', preset: 'Across the room' },
    ],
  },
  {
    id: 'concourse-atrium-strings',
    name: 'Atrium strings',
    category: 'texture',
    description:
      'A held pad that swells in slowly like bowed strings, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings' },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 10.7 } },
    ],
  },
  {
    id: 'concourse-taxiway-fog',
    name: 'Taxiway fog',
    category: 'texture',
    description:
      'A wide fog kept to the middle band, hanging for seconds, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Band of fog' },
      { deviceId: 'expanse', preset: 'Low cathedral' },
    ],
  },
  {
    id: 'concourse-wash-on-the-tarmac',
    name: 'Wash on the tarmac',
    category: 'texture',
    description:
      'Slow loops of each phrase that swell in at several octaves, into a dark cellar of a room that folds the sound to mono.',
    effects: [
      { deviceId: 'cascade', preset: 'Slow tiles', params: { time: 1010 } },
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar', params: { decay: 2.98 } },
    ],
  },
  {
    id: 'concourse-harmony-at-arrivals',
    name: 'Harmony at arrivals',
    category: 'texture',
    description:
      'A held pad where each new chord piles onto the last, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'sustainer', preset: 'Stacked harmony' },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'concourse-cloud-for-nobody',
    name: 'Cloud for nobody',
    category: 'texture',
    description:
      'A wide pad made of the sound with its attacks dissolved, then a ten-stage phaser falling from the top again and again.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Pad from anything' },
      { deviceId: 'phaser', preset: 'Endless fall', params: { rate: 0.381 } },
    ],
  },
  {
    id: 'concourse-drizzle-horizon',
    name: 'Drizzle horizon',
    category: 'texture',
    description:
      'A compressor as slow as a hand on a fader, then a slow drone that swells from the playing and never fades.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Slow fader', params: { attack: 2910 } },
      { deviceId: 'sustainer', preset: 'Endless drone' },
    ],
  },
  {
    id: 'concourse-cloud-till-morning',
    name: 'Cloud till morning',
    category: 'texture',
    description:
      'A scattered cloud of short grains behind the playing, then a wash of three fed-back tape heads that hovers and fades.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Grain cloud', params: { time: 218, size: 79.5 } },
      { deviceId: 'tape-echo', preset: 'Hovering wash', params: { time: 885 } },
    ],
  },
  {
    id: 'concourse-gate-change-organ',
    name: 'Gate-change organ',
    category: 'texture',
    description:
      'A still, bright held tone like an organ that never fades, into a cathedral whose long tail sings a soft open ah.',
    effects: [
      { deviceId: 'sustainer', preset: 'Glass organ' },
      { deviceId: 'vowel-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'concourse-taxiway-swell',
    name: 'Taxiway swell',
    category: 'texture',
    description:
      'A slow swell after each silence, with some dry attack left, into a bright chamber that rings for a couple of seconds.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow' },
      { deviceId: 'expanse', preset: 'Bright chamber', params: { decay: 2.24 } },
    ],
  },
  {
    id: 'concourse-windsock-octave',
    name: 'Windsock octave',
    category: 'pitch',
    description:
      'A smooth octave-down bed, then a cassette with a full head bump and a rolled-off top, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'half-speed', preset: 'Smooth octave', params: { length: 2440 } },
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'concourse-skylight-octave',
    name: 'Skylight octave',
    category: 'pitch',
    description:
      'A muffled half-speed octave below, all lows, in the middle, then a reel of tape, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'half-speed', preset: 'Muffled floor', params: { length: 2150 } },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 13.2 } },
    ],
  },
  {
    id: 'concourse-octave-taken-slowly',
    name: 'Octave taken slowly',
    category: 'pitch',
    description:
      'A muffled half-speed octave below, all lows, in the middle, then a muffled cassette, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'half-speed', preset: 'Muffled floor' },
      { deviceId: 'tape', preset: 'Under a blanket' },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 47.7, lowDecay: 3.72, midDecay: 3.24 },
      },
    ],
  },
  {
    id: 'concourse-descending-undertow',
    name: 'Descending undertow',
    category: 'pitch',
    description:
      'A dark half-speed octave kept low under the dry sound, then a slow reel that sways, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'half-speed', preset: 'Under the mix', params: { length: 1240 } },
      { deviceId: 'tape', preset: 'Seasick' },
      { deviceId: 'plate-reverb', preset: 'Bright plate', params: { predelayMs: 5.54 } },
    ],
  },
  {
    id: 'concourse-cascade-past-customs',
    name: 'Cascade past customs',
    category: 'pitch',
    description:
      'Loops of each note played backwards at stacked octaves, into twelve strings in A minor that ring with notes in that key.',
    effects: [
      { deviceId: 'cascade', preset: 'Backwards stack', params: { time: 483 } },
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { mix: 0.348 } },
    ],
  },
  {
    id: 'concourse-layover-bass',
    name: 'Layover bass',
    category: 'pitch',
    description:
      'A very slow swell, then a rounded octave below every note of a chord, into a quiet plate tail that comes in late behind each note.',
    effects: [
      { deviceId: 'swell', preset: 'Glacier', params: { attack: 3890, release: 1850 } },
      { deviceId: 'octaves', preset: 'Sub octave' },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'concourse-transfer-pad',
    name: 'Transfer pad',
    category: 'pitch',
    description:
      'A tape-style curve that rounds the peaks and dulls the top, then octaves below and above that swell in, with no dry sound.',
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { outputDb: -12 } },
      { deviceId: 'octaves', preset: 'Swell pad', params: { attack: 0.718 } },
    ],
  },
  {
    id: 'concourse-paging-undertow',
    name: 'Paging undertow',
    category: 'pitch',
    description:
      'Whole phrases dragged out at half speed, an octave down, then a reel of tape at middle speed, with a little drift and hiss.',
    effects: [
      { deviceId: 'half-speed', preset: 'Long drag' },
      { deviceId: 'tape', preset: 'Quarter inch' },
    ],
  },
  {
    id: 'concourse-night-shift-depths',
    name: 'Night-shift depths',
    category: 'pitch',
    description:
      'A quarter-speed copy two octaves down under the dry sound, into a huge slow wash that swells in and hangs with no dry sound.',
    effects: [
      { deviceId: 'half-speed', preset: 'Two octaves' },
      { deviceId: 'expanse', preset: 'Wash alone', params: { decay: 35.4, modRate: 0.111 } },
    ],
  },
  {
    id: 'concourse-outbound-fourth',
    name: 'Outbound fourth',
    category: 'pitch',
    description:
      'A wide, slowed copy a fourth below that drifts behind, then a backwards echo, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth down drift', params: { length: 2990 } },
      { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { time: 549 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { modRate: 0.224 } },
    ],
  },
  {
    id: 'concourse-baggage-fifth',
    name: 'Baggage fifth',
    category: 'pitch',
    description:
      'A single voice a fifth above the dry sound, then a string pad that takes seconds to swell in after a chord.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Fifth above', params: { size: 66.8 } },
      { deviceId: 'pad-follower', preset: 'Slow swell', params: { rise: 4.23, fall: 6.78 } },
    ],
  },
  {
    id: 'concourse-snowed-in-drone',
    name: 'Snowed-in drone',
    category: 'pitch',
    description:
      'The first phrase played, held an octave down as a dark drone, then a plain echo whose repeats bounce from side to side.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Deep drone' },
      {
        deviceId: 'echo-memory',
        preset: 'Side to side',
        params: { time: 344, reach: 22.2, size: 2.71 },
      },
    ],
  },
  {
    id: 'concourse-depths-at-the-desk',
    name: 'Depths at the desk',
    category: 'pitch',
    description:
      'A half-hidden slow swell, then a soft bass two octaves below, and a little one octave below, into a slow tide of reverb.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow' },
      { deviceId: 'octaves', preset: 'Deep' },
      { deviceId: 'shaped-reverb', preset: 'Slow tide', params: { time: 3.51 } },
    ],
  },
  {
    id: 'concourse-lounge-octave',
    name: 'Lounge octave',
    category: 'pitch',
    description:
      'A single voice an octave above the dry sound, into a faint short reverb with a slight upward drift.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave up', params: { size: 57.3 } },
      { deviceId: 'bloom-reverb', preset: 'Faint glow', params: { decay: 3.3 } },
    ],
  },
  {
    id: 'concourse-cruising-sheen',
    name: 'Cruising sheen',
    category: 'master',
    description:
      'A quiet plate tail that comes in late behind each note, then a low ceiling that keeps loud passages down for a while.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { predelayMs: 96.7 } },
      { deviceId: 'ambient-limiter', preset: 'Late night', params: { release: 3.53 } },
    ],
  },
  {
    id: 'concourse-shuttered-plate',
    name: 'Shuttered plate',
    category: 'master',
    description:
      'A small plate that is gone in a second or two, then a low ceiling that keeps loud passages down for a while.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Small plate' },
      { deviceId: 'ambient-limiter', preset: 'Late night' },
    ],
  },
  {
    id: 'concourse-glue-by-the-window',
    name: 'Glue by the window',
    category: 'master',
    description:
      'A low cut and some presence, then a fast compressor that takes the spike off plucked notes, then a safety limiter.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Voice', params: { clearTime: 1.44 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { attack: 10.4, release: 0.163 } },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'concourse-terminal-glue',
    name: 'Terminal glue',
    category: 'master',
    description:
      'A pluck-taming compressor, then the sides lifted a little, wider with nothing added, then a low, breathing ceiling.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Pluck tamer' },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Breathing', params: { release: 0.303 } },
    ],
  },
  {
    id: 'concourse-freight-reel',
    name: 'Freight reel',
    category: 'master',
    description:
      'A fast, steady reel pushed into soft saturation, then a gentle compressor, then a true-peak ceiling six decibels down, with room to spare.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { attack: 99.7, release: 2.22 } },
      { deviceId: 'ambient-limiter', preset: 'Margin', params: { release: 1.64 } },
    ],
  },
  {
    id: 'concourse-split-flap-glue',
    name: 'Split-flap glue',
    category: 'master',
    description:
      'A compressor that lets each attack through before it levels, then a fast limiter with the level lifted a little into it.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Keys' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { outputGain: -4.58 } },
    ],
  },
]
