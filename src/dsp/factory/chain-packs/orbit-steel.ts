// Steel in Slow Orbit: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'orbit-steel-lunar-space',
    name: 'Lunar space',
    category: 'space',
    description:
      'A half-hidden slow swell, then a single saturated tape slap behind each note, into a space whose tail flutters quickly in pitch.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1370, release: 325 } },
      { deviceId: 'tape-echo', preset: 'Single slap' },
      { deviceId: 'expanse', preset: 'Fast flutter', params: { decay: 5.45 } },
    ],
  },
  {
    id: 'orbit-steel-nave-past-the-moon',
    name: 'Nave past the moon',
    category: 'space',
    description:
      'A bowed swell at half strength under the dry attacks, then two copies a slap behind, the left one first, into a vast nave.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed' },
      { deviceId: 'stereo-detune', preset: 'Late copy' },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'orbit-steel-county-fair-hall',
    name: 'County-fair hall',
    category: 'space',
    description:
      'A volume-pedal swell, then a short, soft tape echo close behind the playing, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal' },
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 52, lowDecay: 4.11, midDecay: 2.73 },
      },
    ],
  },
  {
    id: 'orbit-steel-cabin-hall',
    name: 'Cabin hall',
    category: 'space',
    description:
      'A swell that takes seconds to rise after each silence, then a tight cluster of tape repeats, like a very small room, into a far-off hall.',
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 2380, release: 697 } },
      { deviceId: 'tape-echo', preset: 'Tiny room cluster', params: { time: 92.5 } },
      { deviceId: 'hall-reverb', preset: 'Far away' },
    ],
  },
  {
    id: 'orbit-steel-crescent-plate',
    name: 'Crescent plate',
    category: 'space',
    description:
      'A volume-pedal swell, then a single saturated tape slap behind each note, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal' },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 90.1 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'orbit-steel-wash-off-the-ridge',
    name: 'Wash off the ridge',
    category: 'space',
    description:
      'A first-note swell, then a single saturated tape slap behind each note, into a long undamped tail kept low behind the sound.',
    effects: [
      { deviceId: 'swell', preset: 'First note only', params: { attack: 1590, release: 1400 } },
      { deviceId: 'tape-echo', preset: 'Single slap', params: { time: 89.1 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail', params: { predelayMs: 26.9 } },
    ],
  },
  {
    id: 'orbit-steel-capsule-halo',
    name: 'Capsule halo',
    category: 'space',
    description:
      'A slow swell after each silence that opens only at the end, into a late reverb that climbs by octaves and fifths.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise' },
      { deviceId: 'shimmer', preset: 'Late answer' },
    ],
  },
  {
    id: 'orbit-steel-moonrise-choir',
    name: 'Moonrise choir',
    category: 'space',
    description:
      'A swell that stays low and arrives late, like a rocked pedal, into a reverb whose tail climbs an octave on every pass.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 280, release: 162 } },
      { deviceId: 'shimmer', preset: 'Rising choir' },
    ],
  },
  {
    id: 'orbit-steel-countdown-choir',
    name: 'Countdown choir',
    category: 'space',
    description:
      'A slow swell after each silence that opens only at the end, into a vast reverb where most of the tail climbs by octaves.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise' },
      { deviceId: 'shimmer', preset: 'Endless ascent', params: { decay: 26.9, predelay: 60.1 } },
    ],
  },
  {
    id: 'orbit-steel-pearl-snap-halo',
    name: 'Pearl-snap halo',
    category: 'space',
    description:
      'A compressor as slow as a hand on a fader, into a reverb whose tail drifts up towards the octave as it rings.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Slow fader', params: { attack: 2840, release: 18.4 } },
      { deviceId: 'bloom-reverb', preset: 'Bloom', params: { decay: 4.71 } },
    ],
  },
  {
    id: 'orbit-steel-regolith-strings',
    name: 'Regolith strings',
    category: 'space',
    description:
      'Four strings tuned to a G major chord that ring in sympathy, into three long springs with all the top taken off.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Open triad' },
      { deviceId: 'spring-reverb', preset: 'Underwater' },
    ],
  },
  {
    id: 'orbit-steel-ridge-air',
    name: 'Ridge air',
    category: 'space',
    description:
      'A bright wide chamber that is over in about a second, into a hint of open space behind the sound.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Bright chamber' },
      { deviceId: 'expanse', preset: 'Faint air' },
    ],
  },
  {
    id: 'orbit-steel-sagebrush-tank',
    name: 'Sagebrush tank',
    category: 'space',
    description:
      'A clean speaker in a room, miked from well back, into two taut springs that ring long and clean with no drip.',
    effects: [
      { deviceId: 're-amp', preset: 'Just the room', params: { output: 0.308 } },
      { deviceId: 'spring-reverb', preset: 'Tight long tank', params: { decay: 5.94 } },
    ],
  },
  {
    id: 'orbit-steel-earthrise-plate',
    name: 'Earthrise plate',
    category: 'space',
    description:
      'A tape-style curve that rounds the peaks and dulls the top, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { outputDb: -14 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'orbit-steel-hall-above-it-all',
    name: 'Hall above it all',
    category: 'space',
    description:
      'A heavy low shelf that puts weight under the sound, then a backwards reverb, into a hall of about four seconds with no dry sound in it.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep' },
      { deviceId: 'shaped-reverb', preset: 'Reverse', params: { time: 1.05, mix: 0.27 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Full wet send',
        params: { preDelay: 22.1, lowDecay: 3.83, midDecay: 4.45 },
      },
    ],
  },
  {
    id: 'orbit-steel-hovering-voices',
    name: 'Hovering voices',
    category: 'space',
    description:
      'A gentle high cut that shades the top end, into a choir of a hall whose vowel wanders on its own.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.43 } },
      { deviceId: 'vowel-reverb', preset: 'Vowel drift', params: { decay: 8.67, preDelay: 20.8 } },
    ],
  },
  {
    id: 'orbit-steel-tank-on-a-tin-roof',
    name: 'Tank on a tin roof',
    category: 'space',
    description:
      'Three springs heard alone with none of the dry sound left, then a trace of chorus on the top of the sound only.',
    effects: [
      { deviceId: 'spring-reverb', preset: 'Tank alone', params: { decay: 3.02 } },
      { deviceId: 'chorus', preset: 'Faint air' },
    ],
  },
  {
    id: 'orbit-steel-plate-at-earthrise',
    name: 'Plate at earthrise',
    category: 'space',
    description:
      'The sides lifted a little, wider with nothing added, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 16.8 } },
    ],
  },
  {
    id: 'orbit-steel-hall-on-the-porch',
    name: 'Hall on the porch',
    category: 'space',
    description:
      'A fast, steady reel pushed into soft saturation, into a hall that answers about a quarter of a second late.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'fdn-reverb', preset: 'Late arrival' },
    ],
  },
  {
    id: 'orbit-steel-hall-at-the-dance',
    name: 'Hall at the dance',
    category: 'space',
    description:
      'A swell that stays low and arrives late, like a rocked pedal, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 268, release: 138 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite' },
    ],
  },
  {
    id: 'orbit-steel-lonesome-hall',
    name: 'Lonesome hall',
    category: 'space',
    description:
      'A hall whose lows outlast its damped top, then a subsonic cut with the low mids and presence eased a touch.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
      { deviceId: 'ambient-eq', preset: 'Drone', params: { clearTime: 1.65 } },
    ],
  },
  {
    id: 'orbit-steel-outbound-plate',
    name: 'Outbound plate',
    category: 'space',
    description:
      'A hard pan that jumps from one side to the other, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'tremolo', preset: 'Side to side', params: { rate: 2.37 } },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { predelayMs: 57.3 } },
    ],
  },
  {
    id: 'orbit-steel-spring-on-a-tin-roof',
    name: 'Spring on a tin roof',
    category: 'space',
    description:
      'One taut dull spring that answers late and rings long, then a gentle low-pass at a kilohertz.',
    effects: [
      {
        deviceId: 'spring-reverb',
        preset: 'Dark late coil',
        params: { decay: 4.71, predelay: 74.7 },
      },
      { deviceId: 'auto-filter', preset: 'Init' },
    ],
  },
  {
    id: 'orbit-steel-moonlit-room',
    name: 'Moonlit room',
    category: 'space',
    description:
      'A cassette with a full head bump and a rolled-off top, into a far-miked room laid in under the clean sound.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 're-amp', preset: 'Room underneath' },
    ],
  },
  {
    id: 'orbit-steel-scatter-by-the-creek',
    name: 'Scatter by the creek',
    category: 'space',
    description:
      'A tight cluster of tape repeats, like a very small room, into a mellow reverb whose tail splits upwards and downwards.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Tiny room cluster', params: { time: 92.6 } },
      { deviceId: 'bloom-reverb', preset: 'Scatter' },
    ],
  },
  {
    id: 'orbit-steel-sagebrush-cavern',
    name: 'Sagebrush cavern',
    category: 'space',
    description:
      'A big muffled cave that rings for about six seconds, then a second take either side, a little late and out of tune.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Dark cave' },
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { delay: 35.9 } },
    ],
  },
  {
    id: 'orbit-steel-stock-pond-slap',
    name: 'Stock-pond slap',
    category: 'echo',
    description:
      'A short, soft tape echo close behind the playing, then a clean, bright combo amp, into an overdriven spring tank.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      { deviceId: 're-amp', preset: 'Clean and bright' },
      { deviceId: 'spring-reverb', preset: 'Overdriven tank', params: { decay: 2.16 } },
    ],
  },
  {
    id: 'orbit-steel-prairie-slap',
    name: 'Prairie slap',
    category: 'echo',
    description:
      'A soft slap close behind each note, then a combo amp in a room, into a two-spring tank with a little chirp and drip.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Slapback', params: { time: 103, modRate: 0.636 } },
      { deviceId: 're-amp', preset: 'Combo in a room', params: { output: -2.61 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { decay: 2.3 } },
    ],
  },
  {
    id: 'orbit-steel-lander-slap',
    name: 'Lander slap',
    category: 'echo',
    description:
      'Two copies a slap behind, the left one first, then a driven valve amplifier, into a tight damped little room that is barely there.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Late copy' },
      { deviceId: 're-amp', preset: 'Just the valves' },
      { deviceId: 'plate-reverb', preset: 'Tight room' },
    ],
  },
  {
    id: 'orbit-steel-tethered-echo',
    name: 'Tethered echo',
    category: 'echo',
    description:
      'A faint trace of tape echo behind the playing, then a combo amplifier driven hard, miked right on the cone, into a faint single spring.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Faint trace' },
      { deviceId: 're-amp', preset: 'Speaker on the edge', params: { output: -3.6 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { decay: 1.54 } },
    ],
  },
  {
    id: 'orbit-steel-campfire-embers',
    name: 'Campfire embers',
    category: 'echo',
    description:
      'A combo amplifier heard from the far side of a big room, then grain repeats that fall an octave each time, darkening.',
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall' },
      { deviceId: 'grain-delay', preset: 'Falling embers' },
    ],
  },
  {
    id: 'orbit-steel-campfire-hold',
    name: 'Campfire hold',
    category: 'echo',
    description:
      'The first phrase played, looped clean and never fading, into three long springs that chirp and drip.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Clean hold' },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { decay: 4.72 } },
    ],
  },
  {
    id: 'orbit-steel-homesick-shards',
    name: 'Homesick shards',
    category: 'echo',
    description:
      'A tape preamp driven for thick lows and a dull top, then a scatter of falling echoes, into three long springs that chirp and drip.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -7.95 } },
      { deviceId: 'shaped-reverb', preset: 'Scattered', params: { time: 1.96 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring' },
    ],
  },
  {
    id: 'orbit-steel-echo-at-moonrise',
    name: 'Echo at moonrise',
    category: 'echo',
    description:
      'A soft echo while earlier phrases drift back under it, then an echo whose repeats hop up a fifth and down a fourth.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Recalling',
        params: { time: 473, reach: 18.2, size: 3.18 },
      },
      { deviceId: 'analog-delay', preset: 'Fifth hop', params: { time: 303, modRate: 0.603 } },
    ],
  },
  {
    id: 'orbit-steel-crater-echo',
    name: 'Crater echo',
    category: 'echo',
    description:
      'Tape repeats that lose their lows and thin out as they fade, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Thin and fading' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 38.3 } },
    ],
  },
  {
    id: 'orbit-steel-trace-in-free-fall',
    name: 'Trace in free fall',
    category: 'echo',
    description:
      'A rotating speaker at a standstill, heard close and in mono, then a faint echo and faint recollections behind the playing.',
    effects: [
      { deviceId: 'rotary', preset: 'Stopped horn' },
      {
        deviceId: 'echo-memory',
        preset: 'Faint recall',
        params: { time: 449, reach: 22.3, size: 1.76 },
      },
    ],
  },
  {
    id: 'orbit-steel-echo-headed-home',
    name: 'Echo headed home',
    category: 'echo',
    description:
      'Two tape heads that make every repeat gallop, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop' },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  {
    id: 'orbit-steel-trace-off-the-ridge',
    name: 'Trace off the ridge',
    category: 'echo',
    description:
      'A faint, soft loop of the last phrase, gone in a few passes, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Faint bed', params: { length: 1.34 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing' },
    ],
  },
  {
    id: 'orbit-steel-perigee-chorus',
    name: 'Perigee chorus',
    category: 'echo',
    description:
      'A one-voice chorus, the pitch bending against the dry sound, then a bucket-brigade echo with a slow chorus on its repeats.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow chorus', params: { rate: 0.726 } },
      { deviceId: 'analog-delay', preset: 'Chorused' },
    ],
  },
  {
    id: 'orbit-steel-splashdown-memory',
    name: 'Splashdown memory',
    category: 'echo',
    description:
      'Earlier moments of the playing drifting back with no echo, into a small room that sparkles two octaves above the sound.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'No echo',
        params: { time: 465, reach: 19.4, size: 2.38 },
      },
      { deviceId: 'shimmer', preset: 'Sparkle room', params: { decay: 1.33, predelay: 21 } },
    ],
  },
  {
    id: 'orbit-steel-creekside-loop',
    name: 'Creekside loop',
    category: 'echo',
    description:
      'A one-second tape loop that soon dies away, then a gentle high cut that shades the top end, into a huge open valley.',
    effects: [
      { deviceId: 'tape-loop', preset: 'One second round' },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.37 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 9.07, predelayMs: 117, breathRate: 0.301 },
      },
    ],
  },
  {
    id: 'orbit-steel-repeats-in-a-capsule',
    name: 'Repeats in a capsule',
    category: 'echo',
    description:
      'A steady tape echo with no wobble, dirt or dulling, into a cloud of reverb that swells in after each note and fades.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Clean and steady' },
      { deviceId: 'shaped-reverb', preset: 'Bloom' },
    ],
  },
  {
    id: 'orbit-steel-repeats-in-the-cabin',
    name: 'Repeats in the cabin',
    category: 'echo',
    description:
      'A fast, steady reel pushed into soft saturation, then a clean, steady echo with no wobble and an open top.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'analog-delay', preset: 'Clean echo', params: { time: 196, modRate: 0.543 } },
    ],
  },
  {
    id: 'orbit-steel-moondust-trail',
    name: 'Moondust trail',
    category: 'echo',
    description:
      'A slow echo with a long dark trail and a few recollections, into a huge bright space with a wide and very long tail.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Dark trail',
        params: { time: 1200, reach: 32.5, size: 4.63 },
      },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.253 } },
    ],
  },
  {
    id: 'orbit-steel-bunkhouse-needles',
    name: 'Bunkhouse needles',
    category: 'tape',
    description:
      'A phaser held still, two fixed peaks like a vowel, then a reel driven as hard as it goes, thick with harmonics.',
    effects: [
      { deviceId: 'phaser', preset: 'Still formant' },
      { deviceId: 'tape', preset: 'Needles pinned' },
    ],
  },
  {
    id: 'orbit-steel-screen-door-memory',
    name: 'Screen-door memory',
    category: 'tape',
    description:
      'Long grains of what was played about four seconds ago, then a clean bright reel under a thick layer of tape hiss.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Long memory' },
      { deviceId: 'tape', preset: 'Hiss and air' },
    ],
  },
  {
    id: 'orbit-steel-reel-by-moonlight',
    name: 'Reel by moonlight',
    category: 'tape',
    description:
      'A fresh reel of tape, open on top and nearly steady, into a late wall of reverb that holds and stops dead.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'shaped-reverb', preset: 'Late wall', params: { time: 1.32 } },
    ],
  },
  {
    id: 'orbit-steel-night-field-pillow',
    name: 'Night-field pillow',
    category: 'tape',
    description:
      'A small speaker, close and muffled, as if under a pillow, then backwards chunks spliced hard, with no fades between them.',
    effects: [
      { deviceId: 're-amp', preset: 'Pillow speaker' },
      { deviceId: 'reverse-delay', preset: 'Hard splices' },
    ],
  },
  {
    id: 'orbit-steel-liftoff-needles',
    name: 'Liftoff needles',
    category: 'tape',
    description:
      'A mid-forward tone with the lows and the top trimmed, then an overdriven reel, then a tape echo whose warm repeats soften as they fade.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward' },
      { deviceId: 'tape', preset: 'Needles pinned' },
      { deviceId: 'tape-echo', preset: 'Warm repeats' },
    ],
  },
  {
    id: 'orbit-steel-translunar-reel',
    name: 'Translunar reel',
    category: 'tape',
    description:
      'An overdriven reel, then a tape reel pushed hard into thick saturation, into a plain short room whose tail stays at pitch.',
    effects: [
      { deviceId: 'tape', preset: 'Needles pinned' },
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { decay: 2.72 } },
    ],
  },
  {
    id: 'orbit-steel-re-entry-chorus',
    name: 'Re-entry chorus',
    category: 'tape',
    description:
      'A drifting reel laid half against the dry sound, a chorus, then a slow tape echo with a long trail that dulls as it goes.',
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'tape-echo', preset: 'Long dark trail', params: { time: 1430 } },
    ],
  },
  {
    id: 'orbit-steel-dance-hall-tape',
    name: 'Dance-hall tape',
    category: 'tape',
    description:
      'A tape reel with soft saturation, slight wobble and hiss, then a plain echo whose repeats bounce from side to side.',
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 'echo-memory', preset: 'Side to side' },
    ],
  },
  {
    id: 'orbit-steel-tremolo-from-orbit',
    name: 'Tremolo from orbit',
    category: 'motion',
    description:
      'A clean combo amplifier with the treble all the way up, then a harmonic tremolo, into a faint single spring.',
    effects: [
      { deviceId: 're-amp', preset: 'Clean and bright', params: { output: 3.34 } },
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 3.07 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { decay: 1.43 } },
    ],
  },
  {
    id: 'orbit-steel-tremolo-looking-home',
    name: 'Tremolo looking home',
    category: 'motion',
    description:
      'A triode valve stage, smoothly overdriven, then a slowly rocking tone, into a two-spring tank with a little chirp and drip.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'tremolo', preset: 'Tilting tone', params: { rate: 0.265 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank' },
    ],
  },
  {
    id: 'orbit-steel-heat-shield-seesaw',
    name: 'Heat-shield seesaw',
    category: 'motion',
    description:
      'A valve stage driven hard until it thickens and sags, then a slowly rocking tone, into three long springs that chirp and drip.',
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { output: -3.04 } },
      { deviceId: 'tremolo', preset: 'Tilting tone' },
      { deviceId: 'spring-reverb', preset: 'Long three spring' },
    ],
  },
  {
    id: 'orbit-steel-two-lane-swell',
    name: 'Two-lane swell',
    category: 'motion',
    description:
      'A sagging valve stage, then a slow breathing level, into a two-spring tank with its input driven into saturation.',
    effects: [
      { deviceId: 'patina', preset: 'Valve bloom', params: { output: -5.02 } },
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.229 } },
      { deviceId: 'spring-reverb', preset: 'Overdriven tank' },
    ],
  },
  {
    id: 'orbit-steel-tin-roof-breath',
    name: 'Tin-roof breath',
    category: 'motion',
    description:
      'An amp in a cupboard, then the level breathing in and out about every four seconds, into three long springs that chirp and drip.',
    effects: [
      { deviceId: 're-amp', preset: 'In the cupboard' },
      { deviceId: 'tremolo', preset: 'Gentle breath', params: { rate: 0.259 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring' },
    ],
  },
  {
    id: 'orbit-steel-rotary-headed-home',
    name: 'Rotary headed home',
    category: 'motion',
    description:
      'A fast rotating speaker with its amplifier growling, into a plain short room whose tail stays at pitch.',
    effects: [
      { deviceId: 'rotary', preset: 'Growl' },
      { deviceId: 'bloom-reverb', preset: 'Still room' },
    ],
  },
  {
    id: 'orbit-steel-orbiting-waves',
    name: 'Orbiting waves',
    category: 'motion',
    description:
      'Quick waves of reverb rippling about twice a second, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Ripples', params: { time: 0.412 } },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 32.9, modRate: 0.101 } },
    ],
  },
  {
    id: 'orbit-steel-chrome-rotary',
    name: 'Chrome rotary',
    category: 'motion',
    description:
      'A clean slow rotating speaker blended under the dry sound, then a slow pan from side to side, a few seconds each way.',
    effects: [
      { deviceId: 'rotary', preset: 'Soft blend', params: { mix: 0.27 } },
      { deviceId: 'tremolo', preset: 'Slow pan' },
    ],
  },
  {
    id: 'orbit-steel-outbound-swirl',
    name: 'Outbound swirl',
    category: 'motion',
    description:
      'A fast spinning horn laid over the dry sound, into a vast space whose tail swells in and hangs a minute or more.',
    effects: [
      { deviceId: 'rotary', preset: 'Guitar swirl' },
      { deviceId: 'expanse', preset: 'Event horizon', params: { decay: 56.6, modRate: 0.133 } },
    ],
  },
  {
    id: 'orbit-steel-flanger-by-moonlight',
    name: 'Flanger by moonlight',
    category: 'motion',
    description:
      'Two duller copies a few cents off, tucked behind the sound, then a flanger that takes about twelve seconds over each sweep.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Soft halo' },
      { deviceId: 'flanger', preset: 'Slow sweep', params: { rate: 0.0799, delayMs: 4.36 } },
    ],
  },
  {
    id: 'orbit-steel-front-room-echo',
    name: 'Front-room echo',
    category: 'motion',
    description:
      'A chorused echo, then a tape echo whose warm repeats soften as they fade, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 312, modRate: 0.87 } },
      { deviceId: 'tape-echo', preset: 'Warm repeats' },
      { deviceId: 'expanse', preset: 'Low cathedral' },
    ],
  },
  {
    id: 'orbit-steel-parachute-drift',
    name: 'Parachute drift',
    category: 'motion',
    description:
      'A reel driven hot, then a slow comb sliding against the dry sound, sides opposed, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'tape', preset: 'Hot glue', params: { output: 0.603 } },
      { deviceId: 'tremolo', preset: 'Drifting comb', params: { rate: 0.0981 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 38.4 } },
    ],
  },
  {
    id: 'orbit-steel-throbbing-tremolo',
    name: 'Throbbing tremolo',
    category: 'motion',
    description:
      'A steady amplifier tremolo, about four pulses a second, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'tremolo', preset: 'Amp tremolo' },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'orbit-steel-county-fair-chop',
    name: 'County-fair chop',
    category: 'motion',
    description:
      'A low cut that thins the bass, with a little air on top, then a low-pass snapping shut and open about eight times a second.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture' },
      {
        deviceId: 'auto-filter',
        preset: 'Tremolo filter',
        params: { lfoRateHz: 7.06, envAttackMs: 10.6, envReleaseMs: 176 },
      },
    ],
  },
  {
    id: 'orbit-steel-slow-orbit-voices',
    name: 'Slow-orbit voices',
    category: 'motion',
    description:
      'A choir of a hall whose vowel wanders on its own, then a plain echo that is a little darker on each repeat, into a cathedral.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Vowel drift' },
      { deviceId: 'echo-memory', preset: 'Plain echo' },
      {
        deviceId: 'hall-reverb',
        preset: 'Cathedral',
        params: { preDelay: 73.1, lowDecay: 6.9, midDecay: 5.81 },
      },
    ],
  },
  {
    id: 'orbit-steel-tethered-swirl',
    name: 'Tethered swirl',
    category: 'motion',
    description:
      'A reel driven as hard as it goes, thick with harmonics, then a phaser swirl about a quarter of a minute round.',
    effects: [
      { deviceId: 'tape', preset: 'Needles pinned' },
      { deviceId: 'phaser', preset: 'Slow swirl' },
    ],
  },
  {
    id: 'orbit-steel-floating-chorus',
    name: 'Floating chorus',
    category: 'motion',
    description:
      'A closed amplifier stack, driven and dark, miked off-centre, then a plain two-voice chorus with a voice towards each side.',
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack', params: { output: 0.517 } },
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.727, delayMs: 12.5 } },
    ],
  },
  {
    id: 'orbit-steel-nickel-shudder',
    name: 'Nickel shudder',
    category: 'motion',
    description:
      'A shudder in the level, too fast to count, into an undamped hall of about three seconds with light lows.',
    effects: [
      { deviceId: 'tremolo', preset: 'Fast shudder', params: { rate: 16 } },
      { deviceId: 'hall-reverb', preset: 'Bright hall' },
    ],
  },
  {
    id: 'orbit-steel-buoyant-swell',
    name: 'Buoyant swell',
    category: 'texture',
    description:
      'A half-hidden slow swell, then detuned copies of the highs only, the body left as it was, into a late-arriving hall.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1550, release: 296 } },
      { deviceId: 'stereo-detune', preset: 'Top only', params: { delay: 12.1 } },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'orbit-steel-porch-strings',
    name: 'Porch strings',
    category: 'texture',
    description:
      'A string-like swell, then two dull copies that wander, a haze round the notes, into a wide hall that answers about a fifth of a second late.',
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 311, release: 577 } },
      { deviceId: 'stereo-detune', preset: 'Piano haze', params: { delay: 16.8 } },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { predelayMs: 184 } },
    ],
  },
  {
    id: 'orbit-steel-slow-orbit-swell',
    name: 'Slow-orbit swell',
    category: 'texture',
    description:
      'A first-note swell, then a wavering double spread wide to both sides, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'swell', preset: 'First note only', params: { attack: 1680, release: 1390 } },
      { deviceId: 'analog-delay', preset: 'Doubler', params: { time: 41.7, modRate: 2.34 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'orbit-steel-homeward-swell',
    name: 'Homeward swell',
    category: 'texture',
    description:
      'A short swell that rounds the front off every note, then a shallow thickening chorus, into a far-off plate haze.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 163, release: 75.6 } },
      { deviceId: 'chorus', preset: 'Vocal thickener', params: { rate: 0.444, delayMs: 19.6 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'orbit-steel-strings-at-last-call',
    name: 'Strings at last call',
    category: 'texture',
    description:
      'A string-like swell, then fed-back copies that climb on the left and sink on the right, into a fully damped hall with a few seconds of tail.',
    effects: [
      { deviceId: 'swell', preset: 'String section' },
      { deviceId: 'stereo-detune', preset: 'Spiral' },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'orbit-steel-grains-in-earthshine',
    name: 'Grains in earthshine',
    category: 'texture',
    description:
      'Scattered grains a fifth down, spread across both sides, into a very long reverb whose tail keeps climbing by octaves.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fifth down grains', params: { length: 79.2 } },
      { deviceId: 'bloom-reverb', preset: 'Endless rise', params: { mix: 0.414 } },
    ],
  },
  {
    id: 'orbit-steel-dawn-line-afterglow',
    name: 'Dawn-line afterglow',
    category: 'texture',
    description:
      'A compressor as slow as a hand on a fader, then a short glow of held tone that dies just after each note.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Slow fader', params: { attack: 2880, makeup: -0.808 } },
      { deviceId: 'sustainer', preset: 'Brief afterglow' },
    ],
  },
  {
    id: 'orbit-steel-octave-strung-grains',
    name: 'Octave-strung grains',
    category: 'texture',
    description:
      'Faint reversed grains that glide up an octave within seconds, then a cassette with a full head bump and a rolled-off top.',
    effects: [
      { deviceId: 'spectral-drifter', preset: 'Rising glide' },
      { deviceId: 'tape', preset: 'Warm thump' },
    ],
  },
  {
    id: 'orbit-steel-dawn-line-horizon',
    name: 'Dawn-line horizon',
    category: 'texture',
    description:
      'A very wide wash in which every note hangs for many seconds, then a slow rotating speaker heard through one microphone.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Endless', params: { mix: 0.45 } },
      { deviceId: 'rotary', preset: 'Mono cabinet' },
    ],
  },
  {
    id: 'orbit-steel-gantry-trace',
    name: 'Gantry trace',
    category: 'texture',
    description:
      'A thin, quiet held pad with its lows cut, behind the notes, then a low cut and a small dip in the low mids, to make room.',
    effects: [
      { deviceId: 'sustainer', preset: 'Thin halo' },
      { deviceId: 'ambient-eq', preset: 'Layer' },
    ],
  },
  {
    id: 'orbit-steel-night-side-afterglow',
    name: 'Night-side afterglow',
    category: 'texture',
    description:
      'A dark string pad that lingers long after each chord, then a slow reel that trembles fast, mixed against the dry sound.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Lingering' },
      { deviceId: 'tape', preset: 'Flutter shimmer' },
    ],
  },
  {
    id: 'orbit-steel-floating-echo',
    name: 'Floating echo',
    category: 'texture',
    description:
      'An amplifier stack, all bass, with the mic turned away, then backwards grains of each phrase, repeating as they fade.',
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly' },
      { deviceId: 'grain-delay', preset: 'Backwards shards', params: { time: 427, size: 264 } },
    ],
  },
  {
    id: 'orbit-steel-layers-at-moonrise',
    name: 'Layers at moonrise',
    category: 'texture',
    description:
      'A held pad where each new chord piles onto the last, then a reel of tape at middle speed, with a little drift and hiss.',
    effects: [
      { deviceId: 'sustainer', preset: 'Stacked harmony', params: { attack: 0.64, glide: 0.707 } },
      { deviceId: 'tape', preset: 'Quarter inch' },
    ],
  },
  {
    id: 'orbit-steel-pearl-snap-sustain',
    name: 'Pearl-snap sustain',
    category: 'texture',
    description:
      'A held tone that takes over each note at once and soon fades, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'sustainer', preset: 'Quick catch' },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 7.38, breathRate: 0.193 } },
    ],
  },
  {
    id: 'orbit-steel-fourth-under-the-bar',
    name: 'Fourth under the bar',
    category: 'pitch',
    description:
      'A close harmony a fourth below, made of short slowed pieces, then a lightly worn reel, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth below', params: { length: 160 } },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      {
        deviceId: 'hall-reverb',
        preset: 'Faint halo',
        params: { preDelay: 39.5, lowDecay: 2.44, midDecay: 3.32 },
      },
    ],
  },
  {
    id: 'orbit-steel-baritone-fourth',
    name: 'Baritone fourth',
    category: 'pitch',
    description:
      'A close harmony a fourth below, made of short slowed pieces, then a reel of tape, into a dull mono tunnel with a tail of several seconds.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth below' },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { decay: 6.53, modRate: 0.389 } },
    ],
  },
  {
    id: 'orbit-steel-depths-in-the-cabin',
    name: 'Depths in the cabin',
    category: 'pitch',
    description:
      'A copy two octaves down, then a tape reel pushed hard into thick saturation, into a hall with about two and a half seconds of tail.',
    effects: [
      { deviceId: 'half-speed', preset: 'Two octaves' },
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { preDelay: 63.3, lowDecay: 2.93, midDecay: 2.67 },
      },
    ],
  },
  {
    id: 'orbit-steel-crater-fourth',
    name: 'Crater fourth',
    category: 'pitch',
    description:
      'A wide, slowed copy a fourth below that drifts behind, then a lightly worn reel, into a reverb that breathes in slow waves over and over.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth down drift', params: { length: 2800 } },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { time: 1.95 } },
    ],
  },
  {
    id: 'orbit-steel-cislunar-air',
    name: 'Cislunar air',
    category: 'pitch',
    description:
      'A faint octave above, a little air over the dry sound, then dotted tape repeats that pile up in a darkening wash.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Faint air', params: { size: 62.9 } },
      { deviceId: 'tape-echo', preset: 'Dub wash' },
    ],
  },
  {
    id: 'orbit-steel-airlock-octave',
    name: 'Airlock octave',
    category: 'pitch',
    description:
      'A muffled octave below, then a long dark tape trail, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'half-speed', preset: 'Muffled floor', params: { length: 2070 } },
      { deviceId: 'tape-echo', preset: 'Long dark trail' },
      { deviceId: 'hall-reverb', preset: 'Airy tail' },
    ],
  },
  {
    id: 'orbit-steel-tranquility-thirds',
    name: 'Tranquility thirds',
    category: 'pitch',
    description:
      'A third above and a sixth below a single line, in C major, into sixteen strings in E minor heard alone with no dry sound.',
    effects: [
      { deviceId: 'lattice', preset: 'Diatonic thirds' },
      { deviceId: 'sympathetic', preset: 'Strings alone' },
    ],
  },
  {
    id: 'orbit-steel-creekside-octave',
    name: 'Creekside octave',
    category: 'pitch',
    description:
      'A half-speed replay an octave down, with no dry sound, then two dark late copies, a shadow either side of the sound.',
    effects: [
      { deviceId: 'half-speed', preset: 'Half speed', params: { length: 997 } },
      { deviceId: 'stereo-detune', preset: 'Shadow' },
    ],
  },
  {
    id: 'orbit-steel-truck-stop-octave',
    name: 'Truck-stop octave',
    category: 'pitch',
    description:
      'A dark octave below held chords, every note moved cleanly, into a quiet plate tail that comes in late behind each note.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad below', params: { size: 58.8 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { predelayMs: 81.8 } },
    ],
  },
  {
    id: 'orbit-steel-strings-above-it-all',
    name: 'Strings above it all',
    category: 'pitch',
    description:
      'A swell that fades every note in like a bow stroke, then a detuned octave above each note, like doubled strings.',
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 356, release: 142 } },
      { deviceId: 'octaves', preset: 'Twelve string' },
    ],
  },
  {
    id: 'orbit-steel-porthole-thump',
    name: 'Porthole thump',
    category: 'master',
    description:
      'A cassette with a full head bump and a rolled-off top, then a fast limiter that steps in only on the loudest peaks.',
    effects: [
      { deviceId: 'tape', preset: 'Warm thump' },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
  {
    id: 'orbit-steel-heat-shield-deck',
    name: 'Heat-shield deck',
    category: 'master',
    description:
      'A fast, steady reel pushed into soft saturation, then an even-handed compressor, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-comp', preset: 'Keys', params: { attack: 123, release: 1.66 } },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'orbit-steel-iron-past-the-moon',
    name: 'Iron past the moon',
    category: 'master',
    description:
      'A transformer that fills out the lows and dulls the top, then a gentle compressor, then a slow-riding ceiling.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'ambient-comp', preset: 'Sit back' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 5.56 } },
    ],
  },
  {
    id: 'orbit-steel-moonlit-air',
    name: 'Moonlit air',
    category: 'master',
    description:
      'A trace of room around the sound, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Faint air' },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { release: 1.49 } },
    ],
  },
  {
    id: 'orbit-steel-iron-on-a-tin-roof',
    name: 'Iron on a tin roof',
    category: 'master',
    description:
      'A transformer driven so the low end thickens and loosens, then a true-peak ceiling six decibels down, with room to spare.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'ambient-limiter', preset: 'Margin', params: { gain: -3.31 } },
    ],
  },
  {
    id: 'orbit-steel-weight-at-the-dance',
    name: 'Weight at the dance',
    category: 'master',
    description:
      'A heavy low shelf that puts weight under the sound, then a fast limiter leaned on lightly, catching stray peaks.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep' },
      { deviceId: 'fet-limiter', preset: 'Light touch' },
    ],
  },
]
