// Empty Concourse: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
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
      'Faint voices singing behind the sound, then earlier moments of the playing that keep drifting back.',
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
      'A cathedral whose long tail sings a soft open ah, then a half-speed loop that plays the last phrase an octave down.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Cathedral' },
      { deviceId: 'micro-looper', preset: 'Half speed', params: { length: 2.49 } },
    ],
  },
  {
    id: 'concourse-runway-drone',
    name: 'Runway drone',
    category: 'space',
    description:
      'Four long strings on an A minor chord held in the centre, into a damped hall of about five seconds, heard from far off.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Centre drone', params: { decay: 9.8 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { lowDecay: 4.99, midDecay: 4.21 } },
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
    id: 'concourse-small-hours-depths',
    name: 'Small-hours depths',
    category: 'space',
    description:
      'A valve preamp, gently driven and a little bright on top, into a long dark reverb whose tail sinks slowly in pitch.',
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
      'Two dark late copies that shadow the sound on either side, into a hall whose lows outlast its damped top.',
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
      'A smooth swell that brings every note in like bowed strings, into a vast reverb where most of the tail climbs by octaves.',
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
    id: 'concourse-air-bridge-halo',
    name: 'Air-bridge halo',
    category: 'space',
    description:
      'A volume-pedal swell, then a reverb whose tail drifts up towards the octave as it rings, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal' },
      { deviceId: 'bloom-reverb', preset: 'Bloom', params: { decay: 5.37 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.59 } },
    ],
  },
  {
    id: 'concourse-skylight-halo',
    name: 'Skylight halo',
    category: 'space',
    description:
      'A bowed swell that lets part of each attack through, then a long climbing reverb, into a far-off plate haze with a long, soft tail.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed', params: { attack: 276, release: 133 } },
      { deviceId: 'bloom-reverb', preset: 'Endless rise' },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'concourse-halo-in-transit',
    name: 'Halo in transit',
    category: 'space',
    description:
      'A half-hidden slow swell, then a vast climbing reverb, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1420, release: 290 } },
      { deviceId: 'shimmer', preset: 'Endless ascent', params: { decay: 28.3, predelay: 55.3 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 11.5, breathRate: 0.0545 } },
    ],
  },
  {
    id: 'concourse-gate-change-drone',
    name: 'Gate-change drone',
    category: 'space',
    description:
      'A huge hall whose tail hums a soft oo for a long while, then a faint echo and faint recollections behind the playing.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Endless oo', params: { preDelay: 19.9 } },
      {
        deviceId: 'echo-memory',
        preset: 'Faint recall',
        params: { time: 462, reach: 21.9, size: 1.93 },
      },
    ],
  },
  {
    id: 'concourse-ring-on-a-layover',
    name: 'Ring on a layover',
    category: 'space',
    description:
      'A faint ring of six strings in A major, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Faint ring' },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 13.9, modRate: 0.304 } },
    ],
  },
  {
    id: 'concourse-ring-at-the-kerb',
    name: 'Ring at the kerb',
    category: 'space',
    description:
      'Ten strings that tune themselves to the notes they hear, into a huge dark open space that answers late and rings on.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Follow the tune', params: { decay: 4.06, mix: 0.3 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 9.21, predelayMs: 123, breathRate: 0.324, mix: 0.27 },
      },
    ],
  },
  {
    id: 'concourse-ring-on-level-two',
    name: 'Ring on level two',
    category: 'space',
    description:
      'Eight strings in C major that ring on as under a held pedal, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Piano pedal' },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 72.4, lowDecay: 6.71, midDecay: 5.39 },
      },
    ],
  },
  {
    id: 'concourse-touchdown-ring',
    name: 'Touchdown ring',
    category: 'space',
    description:
      'A brief ring of sixteen C major strings behind each note, into a dark reverb that rises behind each note, then lingers.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Short halo', params: { decay: 0.894 } },
      { deviceId: 'shaped-reverb', preset: 'Ghost', params: { time: 2.23, preDelay: 62.9 } },
    ],
  },
  {
    id: 'concourse-overnight-hall',
    name: 'Overnight hall',
    category: 'space',
    description:
      'A big lift of the low end that puts weight under the sound, into an undamped hall of about three seconds with light lows.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 2.77 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Bright hall',
        params: { preDelay: 35.2, lowDecay: 2.23, midDecay: 3.11 },
      },
    ],
  },
  {
    id: 'concourse-ground-crew-swell',
    name: 'Ground-crew swell',
    category: 'space',
    description:
      'A reverb that swells up behind each note and cuts off, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Reverse', params: { time: 1.33 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 11.2, breathRate: 0.056 } },
    ],
  },
  {
    id: 'concourse-lights-down-halo',
    name: 'Lights-down halo',
    category: 'space',
    description:
      'The drifting tail of a long reverb with no dry sound, then a quick, firm compressor that takes no notice of low rumble.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Tail alone' },
      {
        deviceId: 'ambient-comp',
        preset: 'Mic',
        params: { attack: 62.4, release: 1.1, makeup: 3.83 },
      },
    ],
  },
  {
    id: 'concourse-lights-down-choir',
    name: 'Lights-down choir',
    category: 'space',
    description:
      'A thin band of tone with the lows cut and the top rolled off, into a large hall whose tail hums a deep oh in bass voices.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { clearTime: 1.57 } },
      { deviceId: 'vowel-reverb', preset: 'Low monks' },
    ],
  },
  {
    id: 'concourse-freight-hall',
    name: 'Freight hall',
    category: 'space',
    description:
      'A medium hall with only a breath of voice in its tail, then a string voice that doubles each note almost at once.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { decay: 3.46, preDelay: 21.6 } },
      { deviceId: 'pad-follower', preset: 'Doubler', params: { rise: 0.045, fall: 0.801 } },
    ],
  },
  {
    id: 'concourse-chant-left-running',
    name: 'Chant left running',
    category: 'space',
    description:
      'A short swell that rounds the front off every note, then a wordless choir alone, into a small ringing chamber.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack' },
      { deviceId: 'vowel-reverb', preset: 'Choir alone' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Small bright tank',
        params: { decay: 7.26, breathRate: 0.277 },
      },
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
      'A warm, full equaliser, then dotted tape repeats that pile up in a darkening wash, then a fast, steady reel with soft saturation.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.45 } },
      { deviceId: 'tape-echo', preset: 'Dub wash' },
      { deviceId: 'tape', preset: 'Mastering deck' },
    ],
  },
  {
    id: 'concourse-memory-on-level-two',
    name: 'Memory on level two',
    category: 'echo',
    description:
      'A shaded top end, then a soft echo while earlier phrases drift back under it, then a fast, steady reel with soft saturation.',
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
    id: 'concourse-departure-echo',
    name: 'Departure echo',
    category: 'echo',
    description:
      'A big lift of the low end that puts weight under the sound, then a slow echo with a long dark trail and a few recollections.',
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
    id: 'concourse-memory-at-arrivals',
    name: 'Memory at arrivals',
    category: 'echo',
    description:
      'Recalled moments that mostly come back reversed or slowed, then a tape echo whose three heads make a cluster of each repeat.',
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
    id: 'concourse-off-peak-sparkle',
    name: 'Off-peak sparkle',
    category: 'echo',
    description:
      'A short double-speed loop an octave up that soon dies away, into a bright wide room that rings for a second or two.',
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
    id: 'concourse-terminal-reel',
    name: 'Terminal reel',
    category: 'echo',
    description:
      'A half-speed tape loop, then short moments of the last few seconds replayed as they were, into a far-off hall.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down' },
      { deviceId: 'echo-memory', preset: 'Just now' },
      { deviceId: 'hall-reverb', preset: 'Far away' },
    ],
  },
  {
    id: 'concourse-shuttered-loop',
    name: 'Shuttered loop',
    category: 'echo',
    description:
      'A half-speed tape loop that returns an octave down and dull, then a dark held drone, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down', params: { length: 7.36 } },
      { deviceId: 'micro-looper', preset: 'Deep drone', params: { length: 2.95 } },
      { deviceId: 'expanse', preset: 'Open space' },
    ],
  },
  {
    id: 'concourse-trail-by-the-window',
    name: 'Trail by the window',
    category: 'echo',
    description:
      'A phaser held still, then a slow echo with a long dark trail and a few recollections, then a reel with a little hiss.',
    effects: [
      { deviceId: 'phaser', preset: 'Still formant' },
      { deviceId: 'echo-memory', preset: 'Dark trail' },
      { deviceId: 'tape', preset: 'Quarter inch' },
    ],
  },
  {
    id: 'concourse-air-bridge-reel',
    name: 'Air-bridge reel',
    category: 'echo',
    description:
      'A low cut with the low mids dipped and the presence lifted, then a fading tape loop, then a reel with a little hiss.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Voice', params: { clearTime: 1.47 } },
      { deviceId: 'tape-loop', preset: 'Slow fade' },
      { deviceId: 'tape', preset: 'Quarter inch', params: { output: 2.47 } },
    ],
  },
  {
    id: 'concourse-memory-before-dawn',
    name: 'Memory before dawn',
    category: 'echo',
    description:
      'Short moments of the last few seconds replayed as they were, then a dull, wobbling, saturated echo on worn tape.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Just now',
        params: { time: 247, reach: 4.32, size: 0.928 },
      },
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 682 } },
    ],
  },
  {
    id: 'concourse-loop-from-below',
    name: 'Loop from below',
    category: 'echo',
    description:
      'A half-speed tape loop, then a mid-forward tone with the lows and the top trimmed, into an undamped hall with about three seconds of tail.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down' },
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.54 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { decay: 3.2, breathRate: 0.331 } },
    ],
  },
  {
    id: 'concourse-outbound-loop',
    name: 'Outbound loop',
    category: 'echo',
    description:
      'A tape loop that plays its layers back in reverse, then an equaliser that adds lows and body and eases the top, into a late-arriving hall.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Backwards layers', params: { length: 6.61 } },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.63 } },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'concourse-inbound-echo',
    name: 'Inbound echo',
    category: 'echo',
    description:
      'Tape repeats that lose their lows and thin out as they fade, into a cathedral whose long tail sings a soft open ah.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { time: 358 } },
      { deviceId: 'vowel-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'concourse-echo-in-low-cloud',
    name: 'Echo in low cloud',
    category: 'echo',
    description:
      'Whole phrases played backwards about four seconds later, then a chorus heard alone, its detuned copies spread hard apart.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Long mirror' },
      { deviceId: 'chorus', preset: 'Voices only', params: { rate: 0.348, delayMs: 14.5 } },
    ],
  },
  {
    id: 'concourse-timetable-loop',
    name: 'Timetable loop',
    category: 'echo',
    description:
      'A hollow chorus that swells over about ten seconds, then a tape loop about a second round that soon dies away.',
    effects: [
      { deviceId: 'chorus', preset: 'Hollow swell' },
      { deviceId: 'tape-loop', preset: 'One second round' },
    ],
  },
  {
    id: 'concourse-echo-at-the-pier',
    name: 'Echo at the pier',
    category: 'echo',
    description:
      'A steady tape echo with no wobble, dirt or dulling, then a high cut set low enough to muffle everything.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Clean and steady', params: { time: 474 } },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'concourse-cruising-loop',
    name: 'Cruising loop',
    category: 'echo',
    description:
      'A tape loop whose passes cross from side to side, into a plain hall with about four seconds of tail.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Crossing sides', params: { length: 1.23 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 3.77, breathRate: 0.291 } },
    ],
  },
  {
    id: 'concourse-carousel-trail',
    name: 'Carousel trail',
    category: 'echo',
    description:
      'A slow echo with a long dark trail and a few recollections, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Dark trail' },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'concourse-sodium-reel',
    name: 'Sodium reel',
    category: 'tape',
    description:
      'A tape reel pushed hard, saturated and thick, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard', params: { output: -6.23 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite' },
    ],
  },
  {
    id: 'concourse-red-eye-reel',
    name: 'Red-eye reel',
    category: 'tape',
    description:
      'A tape reel pushed hard, saturated and thick, then a slow tape echo with a long trail that dulls as it goes.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'tape-echo', preset: 'Long dark trail' },
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
      'A wearing tape loop, then a thick, soft cassette, full in the lows and dull on top, into a dull mono tunnel with a tail of several seconds.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Worn out', params: { length: 2.95 } },
      { deviceId: 'tape', preset: 'Warm thump', params: { output: 2.15 } },
      { deviceId: 'expanse', preset: 'Narrow tunnel' },
    ],
  },
  {
    id: 'concourse-concourse-hiss',
    name: 'Concourse hiss',
    category: 'tape',
    description:
      'A big lift of presence and air, with ringing held in check, then a clean bright reel under a thick layer of tape hiss.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Bright' },
      { deviceId: 'tape', preset: 'Hiss and air' },
    ],
  },
  {
    id: 'concourse-chorus-before-dawn',
    name: 'Chorus before dawn',
    category: 'tape',
    description:
      'A big lift of presence and air, with ringing held in check, then a slow tape chorus, then a faint trace of tape echo behind the playing.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Bright', params: { clearTime: 0.608 } },
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'tape-echo', preset: 'Faint trace' },
    ],
  },
  {
    id: 'concourse-concourse-tape',
    name: 'Concourse tape',
    category: 'tape',
    description:
      'A thick, soft cassette, full in the lows and dull on top, into a dull reverb that swells in over seconds and fades slowly.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'shaped-reverb', preset: 'Dark swell' },
    ],
  },
  {
    id: 'concourse-tape-on-the-apron',
    name: 'Tape on the apron',
    category: 'tape',
    description:
      'A clean slow rotating speaker blended under the dry sound, then a thick, soft cassette, full in the lows and dull on top.',
    effects: [
      { deviceId: 'rotary', preset: 'Soft blend' },
      { deviceId: 'tape', preset: 'Warm thump', params: { output: -3.72 } },
    ],
  },
  {
    id: 'concourse-jet-lagged-echo',
    name: 'Jet-lagged echo',
    category: 'tape',
    description:
      'A dull, wobbling, saturated echo on worn tape, then echoes that climb an octave on every repeat.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 669 } },
      { deviceId: 'pitch-shifter', preset: 'Rising steps', params: { size: 60.4, delay: 335 } },
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
    id: 'concourse-transfer-ripple',
    name: 'Transfer ripple',
    category: 'motion',
    description:
      'A chorus on the upper range that leaves the lows steady, into a single saturated tape echo close behind each note.',
    effects: [
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { rate: 1.24, delayMs: 13.9 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 98 } },
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
    id: 'concourse-rotary-left-running',
    name: 'Rotary left running',
    category: 'motion',
    description:
      'A dark slow rotating speaker that mostly turns the lows, then a shallow chorus that thickens the sound above its lows.',
    effects: [
      { deviceId: 'rotary', preset: 'Dark drum' },
      { deviceId: 'chorus', preset: 'Vocal thickener' },
    ],
  },
  {
    id: 'concourse-window-seat-phaser',
    name: 'Window-seat phaser',
    category: 'motion',
    description:
      'A chorus heard alone, its detuned copies spread hard apart, then a ten-stage phaser that takes most of a minute to sweep.',
    effects: [
      { deviceId: 'chorus', preset: 'Voices only', params: { rate: 0.373, delayMs: 17.1 } },
      { deviceId: 'phaser', preset: 'Glacial sweep', params: { rate: 0.0206 } },
    ],
  },
  {
    id: 'concourse-split-flap-double',
    name: 'Split-flap double',
    category: 'motion',
    description:
      'Two copies in tune that wander like extra takes, into a clean speaker at the far end of a big, echoing room.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Drifting' },
      { deviceId: 're-amp', preset: 'Far end of the hall' },
    ],
  },
  {
    id: 'concourse-taxiing-tide',
    name: 'Taxiing tide',
    category: 'motion',
    description:
      'A swell that fades every note in like a bow stroke, then a slow phasing drift that turns over every few seconds.',
    effects: [
      { deviceId: 'swell', preset: 'Bowed' },
      { deviceId: 'freq-shifter', preset: 'Slow drift' },
    ],
  },
  {
    id: 'concourse-tube-lit-chorus',
    name: 'Tube-lit chorus',
    category: 'motion',
    description:
      'A phaser with no dry sound, pulling the two sides apart, then a hollow chorus that swells over about ten seconds.',
    effects: [
      { deviceId: 'phaser', preset: 'Stereo scatter', params: { rate: 0.221 } },
      { deviceId: 'chorus', preset: 'Hollow swell' },
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
    id: 'concourse-taxiway-fog',
    name: 'Taxiway fog',
    category: 'texture',
    description:
      'A wide fog without lows or highs that hangs for seconds, into a huge dark cathedral with only the lows left ringing.',
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
    id: 'concourse-swell-taken-slowly',
    name: 'Swell taken slowly',
    category: 'texture',
    description:
      'A slow swell after each silence that opens only at the end, then two copies in tune that wander like extra takes.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 1650, release: 828 } },
      { deviceId: 'stereo-detune', preset: 'Drifting', params: { delay: 23.3 } },
    ],
  },
  {
    id: 'concourse-standby-glide',
    name: 'Standby glide',
    category: 'texture',
    description:
      'A pad that glides slowly, then a slow phaser swirl, into a hall of about four seconds with no dry sound in it.',
    effects: [
      { deviceId: 'sustainer', preset: 'Long glide' },
      { deviceId: 'phaser', preset: 'Slow swirl', params: { rate: 0.0627 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Full wet send',
        params: { lowDecay: 4.09, midDecay: 4.25 },
      },
    ],
  },
  {
    id: 'concourse-baggage-pad',
    name: 'Baggage pad',
    category: 'texture',
    description:
      'A held pad whose every overtone wavers in pitch and level, into a mellow reverb whose tail splits up and down in pitch.',
    effects: [
      { deviceId: 'sustainer', preset: 'Wavering choir', params: { attack: 0.392, glide: 0.535 } },
      { deviceId: 'bloom-reverb', preset: 'Scatter' },
    ],
  },
  {
    id: 'concourse-horizon-till-morning',
    name: 'Horizon till morning',
    category: 'texture',
    description:
      'A very wide wash in which every note hangs for many seconds, then a clean bright reel under a thick layer of tape hiss.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Endless' },
      { deviceId: 'tape', preset: 'Hiss and air', params: { output: -4.51 } },
    ],
  },
  {
    id: 'concourse-unclaimed-swell',
    name: 'Unclaimed swell',
    category: 'texture',
    description:
      'A swell that takes seconds to rise after each silence, then two copies that repeat into a blur round the upper notes.',
    effects: [
      { deviceId: 'swell', preset: 'Tide' },
      { deviceId: 'stereo-detune', preset: 'Cloud', params: { delay: 24.1 } },
    ],
  },
  {
    id: 'concourse-windsock-octave',
    name: 'Windsock octave',
    category: 'pitch',
    description:
      'A smooth octave-down bed, then a thick, soft cassette, into a bright undamped plate of a couple of seconds.',
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
      'A muffled half-speed octave below, kept in the centre, then a reel with a little hiss, into a dark plate whose tail is soft on top.',
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
      'A muffled half-speed octave below, kept in the centre, then a muffled cassette, into a hall whose lows outlast its damped top.',
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
      'A dark, smooth half-speed octave under the dry sound, then a slow reel that sways, into a bright undamped plate of a couple of seconds.',
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
      'A dark drone made by holding the first phrase an octave down, then a plain echo whose repeats bounce from side to side.',
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
      'A half-hidden slow swell, then a soft, deep bass one and two octaves below each note, into a slow tide of reverb.',
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
    id: 'concourse-overhead-octave',
    name: 'Overhead octave',
    category: 'pitch',
    description:
      'A swell that takes about four seconds to open after silence, then a detuned octave above each note, like doubled strings.',
    effects: [
      { deviceId: 'swell', preset: 'Glacier' },
      { deviceId: 'octaves', preset: 'Twelve string' },
    ],
  },
  {
    id: 'concourse-pre-dawn-fifths',
    name: 'Pre-dawn fifths',
    category: 'pitch',
    description:
      'A wide, slightly detuned fifth above held chords, then a scooped tone with lows and highs up and the body down.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad fifth', params: { size: 63 } },
      { deviceId: 'ambient-eq', preset: 'Hollow', params: { clearTime: 1.66 } },
    ],
  },
  {
    id: 'concourse-unattended-master',
    name: 'Unattended master',
    category: 'master',
    description:
      'A stereo image widened a little, with the bass left central, then a fast limiter that steps in only on the loudest peaks.',
    effects: [
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'concourse-finish-through-glass',
    name: 'Finish through glass',
    category: 'master',
    description:
      'A slow compressor that evens out swells over seconds, then a true-peak ceiling that lets go again over several seconds.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Level' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide' },
    ],
  },
  {
    id: 'concourse-stopover-finish',
    name: 'Stopover finish',
    category: 'master',
    description:
      'A fresh reel of tape, open on top and nearly steady, then a gentle compressor, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { attack: 107, release: 2.15 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { release: 1.45, gain: 2.35 } },
    ],
  },
  {
    id: 'concourse-gate-change-mixdown',
    name: 'Gate-change mixdown',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.67 } },
    ],
  },
  {
    id: 'concourse-departure-finish',
    name: 'Departure finish',
    category: 'master',
    description:
      'A parallel compressor that lifts quiet playing and tails, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Lift' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
  {
    id: 'concourse-finish-on-standby',
    name: 'Finish on standby',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a very gentle compressor, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-comp', preset: 'Glue' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
]
