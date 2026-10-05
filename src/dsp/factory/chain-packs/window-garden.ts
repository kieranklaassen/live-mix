// Museum Window Garden: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'window-garden-swarm-by-the-basin',
    name: 'Swarm by the basin',
    category: 'space',
    description:
      'A tight cluster of echoes close behind each note, into an undamped hall with about three seconds of tail.',
    effects: [
      {
        deviceId: 'swarm-reverb',
        preset: 'Tight swarm',
        params: { length: 0.0945, glide: 0.623, mix: 0.18 },
      },
      {
        deviceId: 'fdn-reverb',
        preset: 'Bright air',
        params: { decay: 3.14, breathRate: 0.301, mix: 0.21 },
      },
    ],
  },
  {
    id: 'window-garden-midday-patter',
    name: 'Midday patter',
    category: 'space',
    description:
      'A fine patter of thin high echoes with no bass in them, into a plain hall of about four seconds with no vowel in it.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Glass rain' },
      { deviceId: 'vowel-reverb', preset: 'Plain hall' },
    ],
  },
  {
    id: 'window-garden-swarm-for-one-room',
    name: 'Swarm for one room',
    category: 'space',
    description:
      'A quick patter of separate echoes behind each note, into a medium hall with only a breath of a vowel in its tail.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Pattering', params: { length: 0.323, glide: 0.663 } },
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { decay: 3.84, preDelay: 21.6 } },
    ],
  },
  {
    id: 'window-garden-echoes-left-plain',
    name: 'Echoes left plain',
    category: 'space',
    description:
      'A space that answers in hard separate echoes, into a plain hall with about four seconds of tail.',
    effects: [
      { deviceId: 'expanse', preset: 'Hard echoes', params: { decay: 4.11, modRate: 0.352 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 3.63, breathRate: 0.287 } },
    ],
  },
  {
    id: 'window-garden-brookside-scatter',
    name: 'Brookside scatter',
    category: 'space',
    description:
      'A slow pan from side to side, a few seconds each way, into one slow scatter of echoes over about a second and no tail.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.144 } },
      { deviceId: 'swarm-reverb', preset: 'Long scatter', params: { glide: 0.554 } },
    ],
  },
  {
    id: 'window-garden-veranda-hall',
    name: 'Veranda hall',
    category: 'space',
    description:
      'A hall whose lows outlast its damped top, then a phaser held still, two fixed peaks like a vowel.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 52.3, lowDecay: 4.49, midDecay: 3.25 },
      },
      { deviceId: 'phaser', preset: 'Still formant' },
    ],
  },
  {
    id: 'window-garden-room-in-daylight',
    name: 'Room in daylight',
    category: 'space',
    description:
      'A second take either side, a little late and out of tune, into a bright wide room that rings for a second or two.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { delay: 30.8 } },
      { deviceId: 'ether-reverb', preset: 'Ether' },
    ],
  },
  {
    id: 'window-garden-opening-hour-slope',
    name: 'Opening-hour slope',
    category: 'space',
    description:
      'Two duller copies a few cents off, tucked behind the sound, into a reverb that falls away in a straight line.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo', params: { delay: 13.1 } },
      { deviceId: 'shaped-reverb', preset: 'Falling', params: { time: 1.44, preDelay: 22 } },
    ],
  },
  {
    id: 'window-garden-glinting-hall',
    name: 'Glinting hall',
    category: 'space',
    description:
      'A quick patter of separate echoes behind each note, into an undamped hall with about three seconds of tail.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Pattering', params: { length: 0.312, glide: 0.608 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air' },
    ],
  },
  {
    id: 'window-garden-plain-plate',
    name: 'Plain plate',
    category: 'space',
    description:
      'A resonant upper-mid peak that rises when played hard, into a medium plate with a smooth tail of a few seconds.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Resonant peak',
        params: { lfoRateHz: 1.01, envAttackMs: 19.8, envReleaseMs: 290 },
      },
      { deviceId: 'plate-reverb', preset: 'Medium plate' },
    ],
  },
  {
    id: 'window-garden-hall-by-the-door',
    name: 'Hall by the door',
    category: 'space',
    description:
      'A rotating speaker at a standstill, heard close and in mono, into a hall with about two and a half seconds of tail.',
    effects: [
      { deviceId: 'rotary', preset: 'Stopped horn' },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'window-garden-hall-in-the-foyer',
    name: 'Hall in the foyer',
    category: 'space',
    description:
      'A far-miked room laid in under the clean sound, into an undamped hall of about three seconds with light lows.',
    effects: [
      { deviceId: 're-amp', preset: 'Room underneath' },
      {
        deviceId: 'hall-reverb',
        preset: 'Bright hall',
        params: { preDelay: 36.4, lowDecay: 2.01, midDecay: 3.21 },
      },
    ],
  },
  {
    id: 'window-garden-trace-over-moss',
    name: 'Trace over moss',
    category: 'space',
    description:
      'A single saturated tape slap behind each note, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 86.9 } },
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
    ],
  },
  {
    id: 'window-garden-courtyard-cluster',
    name: 'Courtyard cluster',
    category: 'space',
    description:
      'A combo amplifier miked fairly close in a small room, into a tight cluster of tape repeats, like a very small room.',
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room' },
      { deviceId: 'tape-echo', preset: 'Tiny room cluster', params: { time: 100 } },
    ],
  },
  {
    id: 'window-garden-wash-on-a-weekday',
    name: 'Wash on a weekday',
    category: 'space',
    description:
      'A big lift of presence and air, with ringing held in check, into a smeared wash of grains that climbs by octaves.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Bright' },
      { deviceId: 'grain-delay', preset: 'Shimmer wash' },
    ],
  },
  {
    id: 'window-garden-foyer-steel',
    name: 'Foyer steel',
    category: 'space',
    description:
      'A brief swell of reverb close behind each note, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Short halo' },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'window-garden-closed-day-hall',
    name: 'Closed-day hall',
    category: 'space',
    description:
      'A hall whose lows outlast its damped top, then a plain two-voice chorus with a voice towards each side.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 45.6, lowDecay: 4.03, midDecay: 2.63 },
      },
      { deviceId: 'chorus', preset: 'Classic chorus' },
    ],
  },
  {
    id: 'window-garden-close-walled-cell',
    name: 'Close-walled cell',
    category: 'space',
    description:
      'Two dull copies that wander, a haze round the notes, into a small dark room that is gone in about a second.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Piano haze', params: { delay: 16.2 } },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'window-garden-pebble-hall',
    name: 'Pebble hall',
    category: 'space',
    description:
      'A wavering double spread wide to both sides, into a hall that answers about a quarter of a second late.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Doubler' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Late arrival',
        params: { decay: 5.46, breathRate: 0.327 },
      },
    ],
  },
  {
    id: 'window-garden-slap-at-opening',
    name: 'Slap at opening',
    category: 'space',
    description:
      'A console channel run hot with its level pulled back down, into a single saturated tape slap behind each note.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Hot channel', params: { output: -20.1 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 99.8 } },
    ],
  },
  {
    id: 'window-garden-slap-by-the-pond',
    name: 'Slap by the pond',
    category: 'space',
    description:
      'A valve preamp curve, lopsided and a little brighter on top, into a small room that answers about an eighth of a second late.',
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { outputDb: -8.97 } },
      { deviceId: 'ether-reverb', preset: 'Slap room' },
    ],
  },
  {
    id: 'window-garden-hushed-sheen',
    name: 'Hushed sheen',
    category: 'space',
    description:
      'A deep slow chorus on a long delay, swaying over seconds, into a quiet plate tail that comes in late behind each note.',
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { rate: 0.161 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'window-garden-bamboo-strings',
    name: 'Bamboo strings',
    category: 'space',
    description:
      'A short, soft tape echo close behind the playing, into five strings in F major that ring for about half a second.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      { deviceId: 'sympathetic', preset: 'Brief pluck', params: { decay: 0.547 } },
    ],
  },
  {
    id: 'window-garden-gallery-room',
    name: 'Gallery room',
    category: 'space',
    description:
      'A plain hall that rings for about three seconds, then a slow compressor that evens out swells over seconds.',
    effects: [
      { deviceId: 'shimmer', preset: 'Plain hall' },
      { deviceId: 'ambient-comp', preset: 'Level' },
    ],
  },
  {
    id: 'window-garden-room-kept-small',
    name: 'Room kept small',
    category: 'space',
    description:
      'Two full-range copies tuned further apart, reaching lower, into the close reflections of a very small room.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Wider', params: { delay: 21 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Short ambience',
        params: { decay: 0.363, breathRate: 0.296 },
      },
    ],
  },
  {
    id: 'window-garden-pond-skater-room',
    name: 'Pond-skater room',
    category: 'space',
    description:
      'The sides lifted a little, wider with nothing added, into a dark cellar of a room that folds the sound to mono.',
    effects: [
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'bloom-reverb', preset: 'Narrow cellar' },
    ],
  },
  {
    id: 'window-garden-paper-screen-echo',
    name: 'Paper-screen echo',
    category: 'echo',
    description:
      'Tape repeats that lose their lows and thin out as they fade, into a short room whose tail splits towards a fifth up and down.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { time: 356 } },
      { deviceId: 'bloom-reverb', preset: 'Quick sparkle', params: { decay: 1.07 } },
    ],
  },
  {
    id: 'window-garden-raked-gravel-repeats',
    name: 'Raked-gravel repeats',
    category: 'echo',
    description:
      'A bucket-brigade echo whose soft repeats dull as they fade, into a small plate that is gone in a second or two.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 394, modRate: 0.559 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { predelayMs: 9.02 } },
    ],
  },
  {
    id: 'window-garden-echo-by-the-pond',
    name: 'Echo by the pond',
    category: 'echo',
    description:
      'A bucket-brigade echo with a slow chorus on its repeats, into a trace of room around the sound.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 325, modRate: 0.809 } },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'window-garden-guest-book-echo',
    name: 'Guest-book echo',
    category: 'echo',
    description:
      'A faint trace of tape echo behind the playing, into a small dead booth that is gone almost at once.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 484 } },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },
  {
    id: 'window-garden-sliding-door-repeats',
    name: 'Sliding-door repeats',
    category: 'echo',
    description:
      'A bucket-brigade echo whose soft repeats dull as they fade, into a bright wide chamber that is over in about a second.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 360, modRate: 0.656 } },
      { deviceId: 'ether-reverb', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'window-garden-echo-before-noon',
    name: 'Echo before noon',
    category: 'echo',
    description:
      'A tape echo whose warm repeats soften as they fade, into a short mono slap of a few reflections.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { time: 389 } },
      { deviceId: 'shaped-reverb', preset: 'Mono slap', params: { time: 0.154 } },
    ],
  },
  {
    id: 'window-garden-loop-on-tatami',
    name: 'Loop on tatami',
    category: 'echo',
    description:
      'A quick loop of about the last half second, soon faded, into a quick patter of separate echoes behind each note.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Quick loop', params: { length: 0.544 } },
      { deviceId: 'swarm-reverb', preset: 'Pattering', params: { length: 0.325, glide: 0.57 } },
    ],
  },
  {
    id: 'window-garden-cypress-ladder',
    name: 'Cypress ladder',
    category: 'echo',
    description:
      'Each note replayed as an arpeggio of octaves and fifths, into a soft slap close behind each note.',
    effects: [
      { deviceId: 'cascade', preset: 'Rising steps' },
      { deviceId: 'analog-delay', preset: 'Slapback', params: { time: 103, modRate: 0.665 } },
    ],
  },
  {
    id: 'window-garden-azalea-echo',
    name: 'Azalea echo',
    category: 'echo',
    description:
      'Tape repeats that lose their lows and thin out as they fade, into a small dead booth that is gone almost at once.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { time: 348 } },
      { deviceId: 'ether-reverb', preset: 'Small booth' },
    ],
  },
  {
    id: 'window-garden-stone-basin-echo',
    name: 'Stone-basin echo',
    category: 'echo',
    description:
      'A fast steady reel, then a faint trace of tape echo behind the playing, into a plain hall with about four seconds of tail.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 485 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 3.85, breathRate: 0.272 } },
    ],
  },
  {
    id: 'window-garden-under-eaves-echoes',
    name: 'Under-eaves echoes',
    category: 'echo',
    description:
      'A handful of separate echoes that fall away and repeat, into a single saturated tape slap behind each note.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Scattered' },
      { deviceId: 'tape-echo', preset: 'Single slap' },
    ],
  },
  {
    id: 'window-garden-slap-at-ten',
    name: 'Slap at ten',
    category: 'echo',
    description:
      'A lopsided soft curve that adds the octave above each note, then a single saturated tape slap behind each note.',
    effects: [
      { deviceId: 'saturator', preset: 'Octave glow' },
      { deviceId: 'tape-echo', preset: 'Single slap' },
    ],
  },
  {
    id: 'window-garden-vitrine-bounce',
    name: 'Vitrine bounce',
    category: 'echo',
    description:
      'Dotted tape repeats that bounce from side to side, then the whole sound folded to mono.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Dotted bounce', params: { mix: 0.24 } },
      { deviceId: 'stereo-widener', preset: 'Mono' },
    ],
  },
  {
    id: 'window-garden-museum-slap',
    name: 'Museum slap',
    category: 'echo',
    description:
      'A slow comb sliding against the dry sound, sides opposed, then a short, soft tape echo close behind the playing.',
    effects: [
      { deviceId: 'tremolo', preset: 'Drifting comb', params: { rate: 0.0923 } },
      { deviceId: 'tape-echo', preset: 'Short and soft' },
    ],
  },
  {
    id: 'window-garden-porcelain-bounce',
    name: 'Porcelain bounce',
    category: 'echo',
    description:
      'A one-voice chorus, the pitch bending against the dry sound, then a plain echo whose repeats bounce from side to side.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow chorus', params: { rate: 0.617 } },
      { deviceId: 'echo-memory', preset: 'Side to side' },
    ],
  },
  {
    id: 'window-garden-atrium-echo',
    name: 'Atrium echo',
    category: 'echo',
    description:
      'A clean, steady echo with no wobble and an open top, into a medium plate with a smooth tail of a few seconds.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 201, modRate: 0.637 } },
      { deviceId: 'plate-reverb', preset: 'Medium plate', params: { predelayMs: 21.2 } },
    ],
  },
  {
    id: 'window-garden-drizzle-echo',
    name: 'Drizzle echo',
    category: 'echo',
    description:
      'Three tape heads in a row, a cluster on every repeat, into a tiny boxy room that is gone almost at once.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { time: 560 } },
      { deviceId: 'expanse', preset: 'Small box' },
    ],
  },
  {
    id: 'window-garden-stoneware-echo',
    name: 'Stoneware echo',
    category: 'echo',
    description:
      'A four-stage phaser kept high, leaving the low end alone, then a steady tape echo with no wobble, dirt or dulling.',
    effects: [
      { deviceId: 'phaser', preset: 'Bass safe', params: { rate: 0.344 } },
      { deviceId: 'tape-echo', preset: 'Clean and steady' },
    ],
  },
  {
    id: 'window-garden-sun-warmed-echo',
    name: 'Sun-warmed echo',
    category: 'echo',
    description:
      'A bucket-brigade echo whose soft repeats dull as they fade, into a short diffuse haze around the sound, like a small room.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 387, modRate: 0.622 } },
      { deviceId: 'spectral-blur', preset: 'Diffuse room' },
    ],
  },
  {
    id: 'window-garden-shoji-loop',
    name: 'Shoji loop',
    category: 'echo',
    description:
      'A low cut that thins the bass, with a little air on top, then a one-second tape loop that soon dies away.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { clearTime: 1.52 } },
      { deviceId: 'tape-loop', preset: 'One second round' },
    ],
  },
  {
    id: 'window-garden-echo-under-eaves',
    name: 'Echo under eaves',
    category: 'echo',
    description:
      'Twelve phaser stages tuned far apart, drifting slowly, then a tape echo whose warm repeats soften as they fade.',
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud' },
      { deviceId: 'tape-echo', preset: 'Warm repeats' },
    ],
  },
  {
    id: 'window-garden-lantern-echo',
    name: 'Lantern echo',
    category: 'echo',
    description:
      'A plain echo that is a little darker on each repeat, into a plain short room whose tail stays at pitch.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Plain echo' },
      { deviceId: 'bloom-reverb', preset: 'Still room' },
    ],
  },
  {
    id: 'window-garden-garden-sampler',
    name: 'Garden sampler',
    category: 'tape',
    description:
      'Early sampler converters, then only the two detuned copies, hard left and right, into a tight damped little room that is barely there.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler' },
      { deviceId: 'stereo-detune', preset: 'Wet only', params: { delay: 15.2 } },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'window-garden-glazed-glass',
    name: 'Glazed glass',
    category: 'tape',
    description:
      'Unfiltered old converters, then detuned copies of the highs only, the body left as it was, into a small plain room.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glassy' },
      { deviceId: 'stereo-detune', preset: 'Top only' },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'window-garden-bits-by-the-hedge',
    name: 'Bits by the hedge',
    category: 'tape',
    description:
      'A thin twelve-bit glaze, then two soft detuned copies, into a small damped room that is over within a second.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze' },
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'window-garden-tatami-grit',
    name: 'Tatami grit',
    category: 'tape',
    description:
      'A bed of digital grit, then a sharp and a flat copy kept in the centre, thick not wide, into a small room that is over in about a second.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Grit bed' },
      { deviceId: 'stereo-detune', preset: 'Thickener' },
      {
        deviceId: 'hall-reverb',
        preset: 'Room',
        params: { preDelay: 27.9, lowDecay: 1.58, midDecay: 1.07 },
      },
    ],
  },
  {
    id: 'window-garden-tape-on-stone',
    name: 'Tape on stone',
    category: 'tape',
    description:
      'A reel of tape at middle speed, with a little drift and hiss, then whole phrases coming back three times, each one duller.',
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { output: 2.11 } },
      { deviceId: 'cascade', preset: 'Phrase returns', params: { time: 1590 } },
    ],
  },
  {
    id: 'window-garden-morning-radio',
    name: 'Morning radio',
    category: 'tape',
    description:
      'A quick slap while short glimpses of earlier notes return, then a clear transistor radio, into an undamped hall.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Glimpses' },
      { deviceId: 'radio', preset: 'Clean transistor' },
      {
        deviceId: 'hall-reverb',
        preset: 'Bright hall',
        params: { preDelay: 35.5, lowDecay: 1.82, midDecay: 2.71 },
      },
    ],
  },
  {
    id: 'window-garden-white-wall-loop',
    name: 'White-wall loop',
    category: 'tape',
    description:
      'A short loop at double speed, an octave up and soon gone, then the converters of an early sampler, twelve bits, low rate.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Octave up', params: { length: 1.24 } },
      { deviceId: 'vintage-digital', preset: 'Sampler' },
    ],
  },
  {
    id: 'window-garden-footbridge-deck',
    name: 'Footbridge deck',
    category: 'tape',
    description:
      'A tape-style curve only just leaned on, then a fast, steady reel pushed into soft saturation, into a sparkling small room.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'tape', preset: 'Mastering deck', params: { output: -2.96 } },
      { deviceId: 'shimmer', preset: 'Sparkle room', params: { decay: 1.28, predelay: 20.2 } },
    ],
  },
  {
    id: 'window-garden-tape-from-indoors',
    name: 'Tape from indoors',
    category: 'tape',
    description:
      'A fresh reel of tape, open on top and nearly steady, then a tape echo whose warm repeats soften as they fade.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'tape-echo', preset: 'Warm repeats', params: { time: 418 } },
    ],
  },
  {
    id: 'window-garden-heron-swell',
    name: 'Heron swell',
    category: 'motion',
    description:
      'A hollow three-voice chorus swelling over about ten seconds, into a thin veil of reverb kept low under the sound.',
    effects: [
      { deviceId: 'chorus', preset: 'Hollow swell' },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { decay: 2.2, breathRate: 0.296 } },
    ],
  },
  {
    id: 'window-garden-koi-pond-chorus',
    name: 'Koi-pond chorus',
    category: 'motion',
    description:
      'A light two-voice chorus that widens more than it moves, into a tight chamber close round the sound for about a second.',
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { rate: 0.323, delayMs: 7.05 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'window-garden-east-wing-drift',
    name: 'East-wing drift',
    category: 'motion',
    description:
      'Three voices drifting over a cycle of about twelve seconds, into the close reflections of a very small room.',
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { rate: 0.0885, delayMs: 26.6 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Short ambience',
        params: { decay: 0.377, breathRate: 0.281 },
      },
    ],
  },
  {
    id: 'window-garden-chorus-on-a-bench',
    name: 'Chorus on a bench',
    category: 'motion',
    description:
      'Three voices drifting over a cycle of about twelve seconds, into a small plain room that is over in about a second.',
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift' },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 1.32, breathRate: 0.267 } },
    ],
  },
  {
    id: 'window-garden-chorus-in-no-hurry',
    name: 'Chorus in no hurry',
    category: 'motion',
    description:
      'A shallow three-voice chorus that thickens above the lows, into a small room that is over in about a second.',
    effects: [
      { deviceId: 'chorus', preset: 'Vocal thickener', params: { rate: 0.38, delayMs: 18.6 } },
      { deviceId: 'hall-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'window-garden-wagtail-chorus',
    name: 'Wagtail chorus',
    category: 'motion',
    description:
      'A three-voice chorus that leaves the lows dry and steady, into a faint short reverb with a slight upward drift.',
    effects: [
      { deviceId: 'chorus', preset: 'Guitar shimmer' },
      { deviceId: 'bloom-reverb', preset: 'Faint glow', params: { decay: 3.15 } },
    ],
  },
  {
    id: 'window-garden-garden-sway',
    name: 'Garden sway',
    category: 'motion',
    description:
      'A slow pan, then two tape heads that make every repeat gallop, into a hall with about two and a half seconds of tail.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan' },
      { deviceId: 'tape-echo', preset: 'Two head gallop' },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'window-garden-lantern-chorus',
    name: 'Lantern chorus',
    category: 'motion',
    description:
      'A trace of chorus on the top of the sound only, then a steady tape echo with no wobble, dirt or dulling, into a quiet late plate.',
    effects: [
      { deviceId: 'chorus', preset: 'Faint air', params: { rate: 0.265, delayMs: 9.6 } },
      { deviceId: 'tape-echo', preset: 'Clean and steady', params: { time: 401 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen' },
    ],
  },
  {
    id: 'window-garden-flanger-in-daylight',
    name: 'Flanger in daylight',
    category: 'motion',
    description:
      'A very short flanger swept nearly down to nothing, into a wide hall that answers about a fifth of a second late.',
    effects: [
      { deviceId: 'flanger', preset: 'Through-zero feel', params: { rate: 0.313, delayMs: 0.763 } },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'window-garden-reading-room-hollow',
    name: 'Reading-room hollow',
    category: 'motion',
    description:
      'A hollow phaser with peaks where its notches would be, into a tight cluster of echoes close behind each note.',
    effects: [
      { deviceId: 'phaser', preset: 'Negative notch', params: { rate: 0.238 } },
      { deviceId: 'swarm-reverb', preset: 'Tight swarm' },
    ],
  },
  {
    id: 'window-garden-pine-shade-ripple',
    name: 'Pine-shade ripple',
    category: 'motion',
    description:
      'A faint, very slow phasing that barely stirs the sound, then a jet-plane flanger sweep with a sharper comb.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Still water', params: { delay: 5.63, lfoRate: 0.0452 } },
      { deviceId: 'flanger', preset: 'Classic jet', params: { rate: 0.279, delayMs: 2.66 } },
    ],
  },
  {
    id: 'window-garden-pan-on-the-sill',
    name: 'Pan on the sill',
    category: 'motion',
    description:
      'A slow pan from side to side, a few seconds each way, into a small plate that is gone in a second or two.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { predelayMs: 11.1 } },
    ],
  },
  {
    id: 'window-garden-pan-on-gravel',
    name: 'Pan on gravel',
    category: 'motion',
    description:
      'A wavering double spread wide to both sides, then a pan that wanders to a new place every second or so.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Doubler' },
      { deviceId: 'tremolo', preset: 'Wandering pan', params: { rate: 0.682 } },
    ],
  },
  {
    id: 'window-garden-pondside-ripple',
    name: 'Pondside ripple',
    category: 'motion',
    description:
      'A faint, very slow phasing that barely stirs the sound, into a small chapel with a short sung eh in its tail.',
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Still water',
        params: { delay: 5.46, lfoRate: 0.0516, mix: 0.21 },
      },
      { deviceId: 'vowel-reverb', preset: 'Chapel', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'window-garden-ensemble-among-ferns',
    name: 'Ensemble among ferns',
    category: 'motion',
    description:
      'A thick three-voice ensemble chorus that turns slowly, then a rumble cut and a single decibel of presence.',
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble' },
      { deviceId: 'ambient-eq', preset: 'Keys' },
    ],
  },
  {
    id: 'window-garden-tide-on-stone',
    name: 'Tide on stone',
    category: 'motion',
    description:
      'A slow phasing drift from partials moved less than a hertz, then a low cut and a small dip in the low mids, to make room.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { delay: 50.3, lfoRate: 0.0789 } },
      { deviceId: 'ambient-eq', preset: 'Layer', params: { clearTime: 1.32 } },
    ],
  },
  {
    id: 'window-garden-overcast-chorus',
    name: 'Overcast chorus',
    category: 'motion',
    description:
      'A tape preamp pushed just enough to add weight, then a three-voice chorus spread wide across the sides.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'chorus', preset: 'Wide chorus' },
    ],
  },
  {
    id: 'window-garden-early-light-pan',
    name: 'Early-light pan',
    category: 'motion',
    description:
      'A light two-voice chorus that widens more than it moves, then a slow pan from side to side, a few seconds each way.',
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener', params: { rate: 0.336, delayMs: 8.91 } },
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 0.154 } },
    ],
  },
  {
    id: 'window-garden-camellia-chorus',
    name: 'Camellia chorus',
    category: 'motion',
    description:
      'A thick three-voice ensemble chorus that turns slowly, into a clean speaker in a room, miked from well back.',
    effects: [
      { deviceId: 'chorus', preset: 'Lush ensemble', params: { rate: 0.513, delayMs: 17.7 } },
      { deviceId: 're-amp', preset: 'Just the room', params: { output: 3.74 } },
    ],
  },
  {
    id: 'window-garden-sparrow-rotor',
    name: 'Sparrow rotor',
    category: 'motion',
    description:
      'A slow dark bass rotor, then a short, soft tape echo close behind the playing, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'rotary', preset: 'Dark drum' },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 142 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Airy tail',
        params: { preDelay: 28.3, lowDecay: 1.07, midDecay: 4.86 },
      },
    ],
  },
  {
    id: 'window-garden-museum-afterglow',
    name: 'Museum afterglow',
    category: 'texture',
    description:
      'A short glow of held tone that dies just after each note, into a thin veil of reverb kept low under the sound.',
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Brief afterglow',
        params: { attack: 0.0276, glide: 0.0333, mix: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Thin veil', params: { mix: 0.072 } },
    ],
  },
  {
    id: 'window-garden-white-wall-organ',
    name: 'White-wall organ',
    category: 'texture',
    description:
      'A steady, unmoving voice per note, like organ pipes, into a tight damped little room that is barely there.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Still pipes' },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'window-garden-celadon-strings',
    name: 'Celadon strings',
    category: 'texture',
    description:
      'A wide string pad that picks up even the softest notes, into a bright wide room that rings for a second or two.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Catch all', params: { rise: 0.189, fall: 9.23 } },
      { deviceId: 'ether-reverb', preset: 'Ether' },
    ],
  },
  {
    id: 'window-garden-swell-in-pine-shade',
    name: 'Swell in pine shade',
    category: 'texture',
    description:
      "A smooth swell on every note, like a string section's bows, into the close reflections of a very small room.",
    effects: [
      { deviceId: 'swell', preset: 'String section' },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },
  {
    id: 'window-garden-skylight-halo',
    name: 'Skylight halo',
    category: 'texture',
    description:
      'A faint swell of octave loops behind each note, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      { deviceId: 'cascade', preset: 'Faint halo', params: { mix: 0.09 } },
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.68 } },
    ],
  },
  {
    id: 'window-garden-closed-day-drops',
    name: 'Closed-day drops',
    category: 'texture',
    description:
      'Scattered short grains an octave up, falling like rain, into an undamped hall with about three seconds of tail.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Octave rain', params: { size: 98.5, density: 6.3 } },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { decay: 3.35, breathRate: 0.28 } },
    ],
  },
  {
    id: 'window-garden-hushed-organ',
    name: 'Hushed organ',
    category: 'texture',
    description:
      'A steady, unmoving voice per note, like organ pipes, then a deep slow chorus on a long delay, swaying over seconds.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Still pipes' },
      { deviceId: 'chorus', preset: 'Deep sea', params: { rate: 0.138 } },
    ],
  },
  {
    id: 'window-garden-atrium-grains',
    name: 'Atrium grains',
    category: 'texture',
    description:
      'A scattered cloud of long grains, some an octave up, then a clean, steady echo with no wobble and an open top.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Slow cloud', params: { size: 252, delay: 131 } },
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 199, modRate: 0.589 } },
    ],
  },
  {
    id: 'window-garden-guest-book-fifth',
    name: 'Guest-book fifth',
    category: 'pitch',
    description:
      'A single voice a fifth above the dry sound, into a tight chamber close round the sound for about a second.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Fifth above' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'window-garden-stone-path-glow',
    name: 'Stone-path glow',
    category: 'pitch',
    description:
      'High octaves that fade in late above each note, into a tight chamber close round the sound for about a second.',
    effects: [
      { deviceId: 'octaves', preset: 'Slow halo', params: { attack: 0.668 } },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'window-garden-daylight-thirds',
    name: 'Daylight thirds',
    category: 'pitch',
    description:
      'A third above and a sixth below a single line, in C major, into a small plate that is gone in a second or two.',
    effects: [
      { deviceId: 'lattice', preset: 'Diatonic thirds', params: { output: 5.99 } },
      { deviceId: 'plate-reverb', preset: 'Small plate' },
    ],
  },
  {
    id: 'window-garden-fifth-in-pine-shade',
    name: 'Fifth in pine shade',
    category: 'pitch',
    description:
      'A single voice a fifth above the dry sound, into a small room that answers about an eighth of a second late.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Fifth above' },
      { deviceId: 'ether-reverb', preset: 'Slap room' },
    ],
  },
  {
    id: 'window-garden-octave-catching-sun',
    name: 'Octave catching sun',
    category: 'pitch',
    description:
      'A single voice an octave above the dry sound, then an early sampler at a low rate, its top filtered away.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave up', params: { size: 67.4 } },
      { deviceId: 'patina', preset: 'Muffled sampler' },
    ],
  },
  {
    id: 'window-garden-ginkgo-chord',
    name: 'Ginkgo chord',
    category: 'pitch',
    description:
      'A pure-tuned third and fifth above, with an octave below, into a short reverb that swells in just after each note.',
    effects: [
      { deviceId: 'lattice', preset: 'Just intonation triad', params: { output: 4.48 } },
      { deviceId: 'expanse', preset: 'Quick swell' },
    ],
  },
  {
    id: 'window-garden-tea-room-glint',
    name: 'Tea-room glint',
    category: 'pitch',
    description:
      'A faint octave above each note, slightly detuned, into deep voices on an ee that come in late behind each note.',
    effects: [
      { deviceId: 'octaves', preset: 'Faint octave' },
      { deviceId: 'vowel-reverb', preset: 'Late basses', params: { decay: 6.66, preDelay: 187 } },
    ],
  },
  {
    id: 'window-garden-halo-after-drizzle',
    name: 'Halo after drizzle',
    category: 'pitch',
    description:
      'A quiet fifth and octave above the line, a touch late, then a slow comb sliding against the dry sound, sides opposed.',
    effects: [
      { deviceId: 'lattice', preset: 'Quiet fifth halo' },
      { deviceId: 'tremolo', preset: 'Drifting comb', params: { rate: 0.0887 } },
    ],
  },
  {
    id: 'window-garden-camellia-iron',
    name: 'Camellia iron',
    category: 'master',
    description:
      'A transformer that fills out the lows and dulls the top, then a fast, firm compressor that stops only the peaks, then a safety limiter.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'ambient-comp', preset: 'Peak stop', params: { attack: 10.8, release: 0.194 } },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: -3.04 } },
    ],
  },
  {
    id: 'window-garden-overcast-grain',
    name: 'Overcast grain',
    category: 'master',
    description:
      'An early sampler whose quiet tails crumble into grain, then a safety limiter with its ceiling brought down a little.',
    effects: [
      { deviceId: 'patina', preset: 'Early sampler' },
      { deviceId: 'fet-limiter', preset: 'Lower ceiling', params: { outputGain: -0.514 } },
    ],
  },
  {
    id: 'window-garden-glue-in-the-foyer',
    name: 'Glue in the foyer',
    category: 'master',
    description:
      'A warm, full equaliser, then a pluck-taming compressor, then a fast limiter with the level lifted a little into it.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.46 } },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { release: 0.143 } },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { outputGain: -4.68 } },
    ],
  },
  {
    id: 'window-garden-weekday-tape',
    name: 'Weekday tape',
    category: 'master',
    description:
      'A tape-style curve that rounds the peaks and dulls the top, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'saturator', preset: 'On tape' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { gain: -3.28 } },
    ],
  },
  {
    id: 'window-garden-tea-bowl-scoop',
    name: 'Tea-bowl scoop',
    category: 'master',
    description:
      'A scooped tone with lows and highs up and the body down, then a true-peak ceiling six decibels down, with room to spare.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Hollow' },
      { deviceId: 'ambient-limiter', preset: 'Margin' },
    ],
  },
  {
    id: 'window-garden-bamboo-room',
    name: 'Bamboo room',
    category: 'master',
    description:
      'A small room that is over in about a second, then a true-peak ceiling with the level pushed up into it.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Room', params: { preDelay: 32.7, midDecay: 1.1 } },
      { deviceId: 'ambient-limiter', preset: 'Loud', params: { release: 2.22, gain: -0.0618 } },
    ],
  },
  {
    id: 'window-garden-pebble-tape',
    name: 'Pebble tape',
    category: 'master',
    description:
      'A clean pass over fast new tape, with nothing added, then a gentle compressor, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'tape', preset: 'Clean transfer' },
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { attack: 104, release: 1.82 } },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { gain: 2.37 } },
    ],
  },
]
