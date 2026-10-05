// Far North Bowed Guitar: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'far-north-kelp-hall',
    name: 'Kelp hall',
    category: 'space',
    description:
      'A swell that takes seconds to rise after each silence, then a warm amplifier stack, into a far-off hall.',
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { attack: 2660, release: 750 } },
      { deviceId: 're-amp', preset: 'Warm stack' },
      { deviceId: 'hall-reverb', preset: 'Far away' },
    ],
  },
  {
    id: 'far-north-meltwater-hall',
    name: 'Meltwater hall',
    category: 'space',
    description:
      'A late-blooming slow swell, then a driven console channel, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise' },
      { deviceId: 'analog-drive', preset: 'Console' },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 11.8, breathRate: 0.0557 } },
    ],
  },
  {
    id: 'far-north-hall-at-low-sun',
    name: 'Hall at low sun',
    category: 'space',
    description:
      'A shallow swell, then a dark fuzz from a valve pushed far past its limit, into a hall of about four seconds with no dry sound in it.',
    effects: [
      { deviceId: 'swell', preset: 'Ghost pick', params: { attack: 460, release: 164 } },
      { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { output: -8.89 } },
      { deviceId: 'hall-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'far-north-low-cloud-hall',
    name: 'Low-cloud hall',
    category: 'space',
    description:
      'A late-blooming slow swell, then a hard-driven combo amp, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise' },
      { deviceId: 're-amp', preset: 'Speaker on the edge', params: { output: -6.33 } },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 61 } },
    ],
  },
  {
    id: 'far-north-driftwood-hall',
    name: 'Driftwood hall',
    category: 'space',
    description:
      'A thin band of tone with the lows cut and the top rolled off, into a plain hall with about four seconds of tail.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin' },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 3.57, breathRate: 0.315 } },
    ],
  },
  {
    id: 'far-north-seabird-bloom',
    name: 'Seabird bloom',
    category: 'space',
    description:
      'A slow swell on only the first note after each silence, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'swell', preset: 'First note only' },
      { deviceId: 'expanse', preset: 'Bloom', params: { decay: 15.7, modRate: 0.326 } },
    ],
  },
  {
    id: 'far-north-slipway-ascent',
    name: 'Slipway ascent',
    category: 'space',
    description:
      'A string-like swell, then the octave-climbing tail of a large reverb with no dry sound, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 349, release: 652 } },
      { deviceId: 'shimmer', preset: 'Rising tail alone' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { midDecay: 7.27 } },
    ],
  },
  {
    id: 'far-north-quayside-wash',
    name: 'Quayside wash',
    category: 'space',
    description:
      'Two slack springs that splash and drip on every attack, into a huge slow wash that swells in and hangs with no dry sound.',
    effects: [
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.24 } },
      { deviceId: 'expanse', preset: 'Wash alone', params: { decay: 40.3, modRate: 0.108 } },
    ],
  },
  {
    id: 'far-north-echoes-before-thaw',
    name: 'Echoes before thaw',
    category: 'space',
    description:
      'A clean combo amplifier with the treble all the way up, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 're-amp', preset: 'Clean and bright' },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 21.7, modRate: 0.238 } },
    ],
  },
  {
    id: 'far-north-choir-in-slow-waves',
    name: 'Choir in slow waves',
    category: 'space',
    description:
      'A reverb whose choir wanders from vowel to vowel, into a hall that sways in pitch with a trace of the octave above.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Vowel drift', params: { decay: 7.2, preDelay: 20.8 } },
      { deviceId: 'shimmer', preset: 'Swaying hall', params: { decay: 4.46, predelay: 20.9 } },
    ],
  },
  {
    id: 'far-north-geothermal-halo',
    name: 'Geothermal halo',
    category: 'space',
    description:
      'A reel driven as hard as it goes, thick with harmonics, into the drifting tail of a long reverb with no dry sound.',
    effects: [
      { deviceId: 'tape', preset: 'Needles pinned' },
      { deviceId: 'bloom-reverb', preset: 'Tail alone' },
    ],
  },
  {
    id: 'far-north-boathouse-fifths',
    name: 'Boathouse fifths',
    category: 'space',
    description:
      'A short swell that rounds the front off every note, into a reverb whose tail climbs in fifths as it rings.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 165, release: 82.9 } },
      { deviceId: 'shimmer', preset: 'Fifths', params: { decay: 8.82, predelay: 19.1 } },
    ],
  },
  {
    id: 'far-north-harbour-hall',
    name: 'Harbour hall',
    category: 'space',
    description:
      'A valve preamp, gently driven and a little bright on top, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { outputDb: -10.1 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'far-north-glacial-hall',
    name: 'Glacial hall',
    category: 'space',
    description:
      'A half-hidden slow swell, then a hard-driven combo amp, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1490, release: 279 } },
      { deviceId: 're-amp', preset: 'Speaker on the edge' },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 7.14, breathRate: 0.211 } },
    ],
  },
  {
    id: 'far-north-fog-from-afar',
    name: 'Fog from afar',
    category: 'space',
    description:
      'A volume-pedal swell, then a thick, loose fuzz from an overloaded transformer, into a huge wash heard alone.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal' },
      { deviceId: 'analog-drive', preset: 'Iron melt' },
      { deviceId: 'expanse', preset: 'Wash alone', params: { decay: 41.6, modRate: 0.0904 } },
    ],
  },
  {
    id: 'far-north-snowmelt-choir',
    name: 'Snowmelt choir',
    category: 'space',
    description:
      'A reverb whose tail sings a high "ee", into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'High ee', params: { decay: 5.25, preDelay: 17.8 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 46.7, lowDecay: 4.37, midDecay: 3.37 },
      },
    ],
  },
  {
    id: 'far-north-undertow-on-the-fell',
    name: 'Undertow on the fell',
    category: 'space',
    description:
      'A hall whose lows ring on long after the rest has gone, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 62.5, lowDecay: 7.58, midDecay: 2.11 },
      },
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.62 } },
    ],
  },
  {
    id: 'far-north-trawler-swell',
    name: 'Trawler swell',
    category: 'space',
    description:
      'A bright wide room that rings for a second or two, into a reverb that swells in after each note and fades away.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Ether' },
      { deviceId: 'shaped-reverb', preset: 'Bloom' },
    ],
  },
  {
    id: 'far-north-glacier-fed-ring',
    name: 'Glacier-fed ring',
    category: 'space',
    description:
      'A softened attack, then sixteen long C major strings, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'swell', preset: 'Soft pick' },
      { deviceId: 'sympathetic', preset: 'Long ring', params: { decay: 9.02 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail' },
    ],
  },
  {
    id: 'far-north-room-before-thaw',
    name: 'Room before thaw',
    category: 'space',
    description:
      'A clean combo amplifier with the treble all the way up, into a small room that sparkles two octaves above the sound.',
    effects: [
      { deviceId: 're-amp', preset: 'Clean and bright' },
      { deviceId: 'shimmer', preset: 'Sparkle room' },
    ],
  },
  {
    id: 'far-north-smokehouse-choir',
    name: 'Smokehouse choir',
    category: 'space',
    description:
      'A short, soft tape echo close behind the playing, into a vast hall whose long tail sings a high bright "ah".',
    effects: [
      { deviceId: 'tape-echo', preset: 'Short and soft' },
      { deviceId: 'vowel-reverb', preset: 'High choir', params: { decay: 27.9, preDelay: 19.4 } },
    ],
  },
  {
    id: 'far-north-halo-under-cloud',
    name: 'Halo under cloud',
    category: 'space',
    description:
      'Twelve strings in A minor that ring with notes in that key, into a reverb that rises for about four seconds behind each note.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { decay: 3.71 } },
      { deviceId: 'shaped-reverb', preset: 'Long rise', params: { time: 3.84 } },
    ],
  },
  {
    id: 'far-north-hall-over-lava',
    name: 'Hall over lava',
    category: 'space',
    description:
      'A short swell that rounds the front off every note, into a hall of about four seconds with no dry sound in it.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 154, release: 82.6 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Full wet send',
        params: { preDelay: 21.4, lowDecay: 4.25, midDecay: 3.74 },
      },
    ],
  },
  {
    id: 'far-north-crowberry-halo',
    name: 'Crowberry halo',
    category: 'space',
    description:
      'An equaliser that adds lows and body and eases the top, into a small glassy reverb with a glint two octaves up.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Warm' },
      { deviceId: 'shimmer', preset: 'Glass', params: { decay: 5.66, predelay: 18, mix: 0.18 } },
    ],
  },
  {
    id: 'far-north-halo-in-sea-fog',
    name: 'Halo in sea fog',
    category: 'space',
    description:
      'A slow swell on only the first note after each silence, then a dull mono reverb whose tail climbs in fifths, into a far-off hall.',
    effects: [
      { deviceId: 'swell', preset: 'First note only', params: { attack: 1420, release: 1520 } },
      { deviceId: 'shimmer', preset: 'Narrow fifth', params: { decay: 5.4, predelay: 21.8 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 20.8, lowDecay: 5.12, midDecay: 5 },
      },
    ],
  },
  {
    id: 'far-north-thawing-wash',
    name: 'Thawing wash',
    category: 'space',
    description:
      'A plate wash that hangs on for half a minute, then a big lift of presence and air.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { predelayMs: 59.7 } },
      { deviceId: 'ambient-eq', preset: 'Bright', params: { clearTime: 0.662 } },
    ],
  },
  {
    id: 'far-north-shimmer-by-the-fjord',
    name: 'Shimmer by the fjord',
    category: 'space',
    description:
      'A quick bright twang of springs behind each attack, into the octave-climbing tail of a large reverb with no dry sound.',
    effects: [
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { decay: 0.761, mix: 0.18 } },
      { deviceId: 'shimmer', preset: 'Rising tail alone', params: { decay: 19.6 } },
    ],
  },
  {
    id: 'far-north-schoolhouse-echoes',
    name: 'Schoolhouse echoes',
    category: 'space',
    description:
      'An amplifier stack turned all the way up, into one slow scatter of echoes over about a second and no tail.',
    effects: [
      { deviceId: 're-amp', preset: 'Stack flat out' },
      { deviceId: 'swarm-reverb', preset: 'Long scatter' },
    ],
  },
  {
    id: 'far-north-drift-in-the-lee',
    name: 'Drift in the lee',
    category: 'space',
    description:
      'A cave whose echoes bend slowly up and down in pitch, then a tape preamp pushed just enough to add weight.',
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Bending', params: { length: 0.553, glide: 1.97 } },
      { deviceId: 'analog-drive', preset: 'Warm glue' },
    ],
  },
  {
    id: 'far-north-swell-over-the-bay',
    name: 'Swell over the bay',
    category: 'space',
    description:
      'A reverb that swells in after each note and fades away, then a wavering double of the sound spread wide to both sides.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 2.79 } },
      { deviceId: 'analog-delay', preset: 'Doubler', params: { time: 39.8, modRate: 2.04 } },
    ],
  },
  {
    id: 'far-north-tremor-by-the-fjord',
    name: 'Tremor by the fjord',
    category: 'space',
    description:
      'A light chorus that widens more than it moves, into a space whose tail flutters quickly in pitch.',
    effects: [
      { deviceId: 'chorus', preset: 'Subtle widener' },
      { deviceId: 'expanse', preset: 'Fast flutter', params: { decay: 4.55, modRate: 4.5 } },
    ],
  },
  {
    id: 'far-north-tundra-hall',
    name: 'Tundra hall',
    category: 'space',
    description:
      'The level rising and falling at random, like surf, into a dark hall that takes about twenty seconds to die away.',
    effects: [
      { deviceId: 'tremolo', preset: 'Sea swell' },
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0845 } },
    ],
  },
  {
    id: 'far-north-whiteout-plate',
    name: 'Whiteout plate',
    category: 'space',
    description: 'The whole sound folded to mono, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'stereo-widener', preset: 'Mono' },
      { deviceId: 'plate-reverb', preset: 'Dark plate' },
    ],
  },
  {
    id: 'far-north-tundra-voices',
    name: 'Tundra voices',
    category: 'space',
    description:
      'A vast hall whose long tail sings a high bright "ah", into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'High choir' },
      { deviceId: 'hall-reverb', preset: 'Airy tail' },
    ],
  },
  {
    id: 'far-north-ashfall-swells',
    name: 'Ashfall swells',
    category: 'echo',
    description:
      'Backwards swells that climb an octave on every pass, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Rising glass', params: { time: 1000 } },
      { deviceId: 'plate-reverb', preset: 'Long plate' },
    ],
  },
  {
    id: 'far-north-parish-swells',
    name: 'Parish swells',
    category: 'echo',
    description:
      'Slow backwards swells that rise and die behind the playing, into a small bright chamber that goes on ringing for seconds.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells' },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank' },
    ],
  },
  {
    id: 'far-north-lighthouse-echo',
    name: 'Lighthouse echo',
    category: 'echo',
    description:
      'Two tape heads that make every repeat gallop, then backwards repeats that step down an octave each time.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Two head gallop', params: { time: 609 } },
      { deviceId: 'reverse-delay', preset: 'Descending steps' },
    ],
  },
  {
    id: 'far-north-solstice-phrase',
    name: 'Solstice phrase',
    category: 'echo',
    description:
      'A rotating speaker at a standstill, heard close and in mono, then whole phrases coming back three times, each one duller.',
    effects: [
      { deviceId: 'rotary', preset: 'Stopped horn' },
      { deviceId: 'cascade', preset: 'Phrase returns' },
    ],
  },
  {
    id: 'far-north-pumice-loop',
    name: 'Pumice loop',
    category: 'echo',
    description:
      'A tape loop that never fades and holds every layer, into a hall with about two and a half seconds of tail.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Endless hold' },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { preDelay: 52.9, lowDecay: 2.88, midDecay: 2.73 },
      },
    ],
  },
  {
    id: 'far-north-echo-in-whiteout',
    name: 'Echo in whiteout',
    category: 'echo',
    description:
      'Grain repeats that climb an octave on every pass, into an undamped hall with about three seconds of tail.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals' },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { decay: 3.05, breathRate: 0.27 } },
    ],
  },
  {
    id: 'far-north-tide-turned-round',
    name: 'Tide turned round',
    category: 'echo',
    description:
      'Long, dark backwards phrases an octave below the playing, into a hall with about two and a half seconds of tail.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Undertow', params: { time: 2350 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { preDelay: 57.1, lowDecay: 2.75, midDecay: 2.34 },
      },
    ],
  },
  {
    id: 'far-north-glacial-swells',
    name: 'Glacial swells',
    category: 'echo',
    description:
      'A dark fog of slow backwards swells, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Dark fog', params: { time: 1370 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.301 } },
    ],
  },
  {
    id: 'far-north-drift-on-black-sand',
    name: 'Drift on black sand',
    category: 'echo',
    description:
      'A blurred loop that never comes round quite the same, into three taut springs kept soft and close to the centre.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Drifting' },
      {
        deviceId: 'spring-reverb',
        preset: 'Narrow warm tank',
        params: { decay: 1.91, predelay: 13.8 },
      },
    ],
  },
  {
    id: 'far-north-kelp-echo',
    name: 'Kelp echo',
    category: 'echo',
    description:
      'A combo amplifier driven hard and recorded right up close, then a short, soft tape echo close behind the playing.',
    effects: [
      { deviceId: 're-amp', preset: 'Speaker on the edge', params: { output: -4.25 } },
      { deviceId: 'tape-echo', preset: 'Short and soft', params: { time: 141 } },
    ],
  },
  {
    id: 'far-north-mirrored-echo',
    name: 'Mirrored echo',
    category: 'echo',
    description:
      'A backwards echo of each phrase that swells in and cuts off, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Backwards echo' },
      { deviceId: 'expanse', preset: 'Low cathedral' },
    ],
  },
  {
    id: 'far-north-memory-in-long-light',
    name: 'Memory in long light',
    category: 'echo',
    description:
      'A driven valve amplifier, then replays of the last seconds, into two taut springs that ring long and clean with no drip.',
    effects: [
      { deviceId: 're-amp', preset: 'Just the valves', params: { output: -2.06 } },
      { deviceId: 'echo-memory', preset: 'Just now', params: { time: 256, size: 0.81 } },
      { deviceId: 'spring-reverb', preset: 'Tight long tank', params: { decay: 5.48 } },
    ],
  },
  {
    id: 'far-north-tide-up-north',
    name: 'Tide up north',
    category: 'echo',
    description:
      'Slow backwards swells that rise and die behind the playing, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 1430 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 12.7 } },
    ],
  },
  {
    id: 'far-north-thawing-reel',
    name: 'Thawing reel',
    category: 'tape',
    description:
      'A tape reel pushed hard, saturated and thick, into a long reverb whose tail wavers queasily in pitch.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'expanse', preset: 'Seasick choir', params: { decay: 19.7, modRate: 1.59 } },
    ],
  },
  {
    id: 'far-north-amp-under-ice',
    name: 'Amp under ice',
    category: 'tape',
    description:
      'A few decibels of soft saturation with the top eased, then a warm amplifier stack, into two splashing springs.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 're-amp', preset: 'Warm stack', params: { output: -6.54 } },
      { deviceId: 'spring-reverb', preset: 'Surf drip' },
    ],
  },
  {
    id: 'far-north-far-shore-reel',
    name: 'Far-shore reel',
    category: 'tape',
    description:
      'The level rising and falling at random, like surf, then a tape reel pushed hard, saturated and thick.',
    effects: [
      { deviceId: 'tremolo', preset: 'Sea swell' },
      { deviceId: 'patina', preset: 'Reel pushed hard' },
    ],
  },
  {
    id: 'far-north-warmth-at-blue-hour',
    name: 'Warmth at blue hour',
    category: 'tape',
    description:
      'A transformer that fills out the lows and dulls the top, then the low hum of an amplifier left switched on.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth' },
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { response: 0.434, hold: 29.3 } },
    ],
  },
  {
    id: 'far-north-tape-on-the-fell',
    name: 'Tape on the fell',
    category: 'tape',
    description:
      'An overdriven reel, then the low hum of an amplifier left switched on, into a plain hall of about four seconds.',
    effects: [
      { deviceId: 'tape', preset: 'Needles pinned' },
      { deviceId: 'noise-floor', preset: 'Amp left on' },
      { deviceId: 'vowel-reverb', preset: 'Plain hall' },
    ],
  },
  {
    id: 'far-north-turf-roof-reel',
    name: 'Turf-roof reel',
    category: 'tape',
    description:
      'A scooped tone with lows and highs up and the body down, then a reel driven as hard as it goes, thick with harmonics.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Hollow', params: { clearTime: 1.35 } },
      { deviceId: 'tape', preset: 'Needles pinned' },
    ],
  },
  {
    id: 'far-north-turf-roof-valves',
    name: 'Turf-roof valves',
    category: 'tape',
    description:
      'A layer of soft clipping, then a hard-driven combo amp, into a bright spring splash that lands a moment after the note.',
    effects: [
      { deviceId: 'saturator', preset: 'Drum bus crunch' },
      { deviceId: 're-amp', preset: 'Speaker on the edge', params: { output: -5.28 } },
      { deviceId: 'spring-reverb', preset: 'Late splash' },
    ],
  },
  {
    id: 'far-north-parish-amp',
    name: 'Parish amp',
    category: 'tape',
    description:
      'A triode valve stage, smoothly overdriven, then a combo amp in a room, into a quick bright twang of springs behind each attack.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 're-amp', preset: 'Combo in a room', params: { output: -3.55 } },
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { decay: 0.825 } },
    ],
  },
  {
    id: 'far-north-birchwood-valves',
    name: 'Birchwood valves',
    category: 'tape',
    description:
      'A low-heavy transformer, then a driven valve amplifier, into a two-spring tank with its input driven into saturation.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 're-amp', preset: 'Just the valves', params: { output: -6.74 } },
      { deviceId: 'spring-reverb', preset: 'Overdriven tank', params: { decay: 1.85 } },
    ],
  },
  {
    id: 'far-north-headland-reel',
    name: 'Headland reel',
    category: 'tape',
    description:
      'A biting pentode stage, then a tape reel pushed hard, saturated and thick, into a nasal horn loudspeaker heard from far across a big room.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Bite' },
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 're-amp', preset: 'Station platform', params: { output: -0.473 } },
    ],
  },
  {
    id: 'far-north-rotary-off-the-pier',
    name: 'Rotary off the pier',
    category: 'motion',
    description:
      'A fast rotating speaker heard close, pulsing hard, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'rotary', preset: 'Close pulse' },
      { deviceId: 'expanse', preset: 'Far echoes' },
    ],
  },
  {
    id: 'far-north-solstice-rotary',
    name: 'Solstice rotary',
    category: 'motion',
    description:
      'A slow rotating speaker with its amplifier driven hard, into a reverb whose choir wanders from vowel to vowel.',
    effects: [
      { deviceId: 'rotary', preset: 'Slow burn' },
      {
        deviceId: 'vowel-reverb',
        preset: 'Vowel drift',
        params: { decay: 7.89, preDelay: 22.4, mix: 0.24 },
      },
    ],
  },
  {
    id: 'far-north-sway-at-midsummer',
    name: 'Sway at midsummer',
    category: 'motion',
    description:
      'A slow pan from side to side, a few seconds each way, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { lowDecay: 7.18 } },
    ],
  },
  {
    id: 'far-north-basalt-filter',
    name: 'Basalt filter',
    category: 'motion',
    description:
      'A low-pass that opens and closes over about half a minute, then a three-head tape echo, into a huge wash heard alone.',
    effects: [
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
      { deviceId: 'tape-echo', preset: 'Three heads' },
      { deviceId: 'expanse', preset: 'Wash alone' },
    ],
  },
  {
    id: 'far-north-lichen-chorus',
    name: 'Lichen chorus',
    category: 'motion',
    description:
      'A late copy on each side, like the same part played twice, into a small chapel with a short sung "eh" in its tail.',
    effects: [
      { deviceId: 'chorus', preset: 'Loose double', params: { rate: 0.183 } },
      { deviceId: 'vowel-reverb', preset: 'Chapel' },
    ],
  },
  {
    id: 'far-north-windblown-chorus',
    name: 'Windblown chorus',
    category: 'motion',
    description:
      'A chorus with no dry sound, then a dotted tape echo wash, into three long-ringing springs with all the top taken off.',
    effects: [
      { deviceId: 'chorus', preset: 'Voices only' },
      { deviceId: 'tape-echo', preset: 'Dub wash' },
      { deviceId: 'spring-reverb', preset: 'Underwater' },
    ],
  },
  {
    id: 'far-north-sway-by-the-boats',
    name: 'Sway by the boats',
    category: 'motion',
    description:
      'A fast, steady reel with soft saturation, then a slowly rocking tone, into a dull reverb that swells in over seconds and fades slowly.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck', params: { output: 3.65 } },
      { deviceId: 'tremolo', preset: 'Tilting tone' },
      { deviceId: 'shaped-reverb', preset: 'Dark swell' },
    ],
  },
  {
    id: 'far-north-far-shore-glide',
    name: 'Far-shore glide',
    category: 'texture',
    description:
      'A held pad that takes seconds to melt into each new chord, into a dull reverb that swells in over seconds and fades slowly.',
    effects: [
      { deviceId: 'sustainer', preset: 'Long glide', params: { attack: 1.37 } },
      { deviceId: 'shaped-reverb', preset: 'Dark swell', params: { time: 3.83 } },
    ],
  },
  {
    id: 'far-north-halo-on-the-moss',
    name: 'Halo on the moss',
    category: 'texture',
    description:
      'A thin, bright held pad with everything low taken out, into a vast space whose tail swells in and hangs a minute or more.',
    effects: [
      { deviceId: 'sustainer', preset: 'High frost' },
      { deviceId: 'expanse', preset: 'Event horizon', params: { decay: 57.5, modRate: 0.139 } },
    ],
  },
  {
    id: 'far-north-headland-pad',
    name: 'Headland pad',
    category: 'texture',
    description:
      'A held pad that swells in slowly like bowed strings, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'sustainer', preset: 'Slow strings' },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'far-north-frosted-cloud',
    name: 'Frosted cloud',
    category: 'texture',
    description:
      'A wide cloud of piled-up chords whose overtones all drift, into a plain hall that rings for about three seconds.',
    effects: [
      { deviceId: 'sustainer', preset: 'Shimmer cloud' },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 3.33, predelay: 16.7 } },
    ],
  },
  {
    id: 'far-north-sparkle-after-snow',
    name: 'Sparkle after snow',
    category: 'texture',
    description:
      'A soft wash of octave and fifth loops over each note, into a thin bright reverb with all its lows cut away.',
    effects: [
      { deviceId: 'cascade', preset: 'Sparkle bed', params: { time: 283 } },
      { deviceId: 'expanse', preset: 'Thin air', params: { decay: 10.6, modRate: 0.205 } },
    ],
  },
  {
    id: 'far-north-sheepfold-pad',
    name: 'Sheepfold pad',
    category: 'texture',
    description:
      'A string pad that follows the playing and is heard alone, into a bright wide room that rings for a second or two.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Pad alone', params: { rise: 0.335, fall: 5.43 } },
      { deviceId: 'ether-reverb', preset: 'Ether' },
    ],
  },
  {
    id: 'far-north-pad-at-low-sun',
    name: 'Pad at low sun',
    category: 'texture',
    description:
      'A held pad whose every overtone wavers in pitch and level, into sixteen strings in C major that ring for about ten seconds.',
    effects: [
      { deviceId: 'sustainer', preset: 'Wavering choir', params: { attack: 0.36, glide: 0.527 } },
      { deviceId: 'sympathetic', preset: 'Long ring' },
    ],
  },
  {
    id: 'far-north-trace-by-the-boats',
    name: 'Trace by the boats',
    category: 'texture',
    description:
      'A short glow of held tone that dies just after each note, into a small bright chamber that goes on ringing for seconds.',
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Brief afterglow',
        params: { attack: 0.0263, glide: 0.0266, mix: 0.3 },
      },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank', params: { mix: 0.24 } },
    ],
  },
  {
    id: 'far-north-solstice-pad',
    name: 'Solstice pad',
    category: 'texture',
    description:
      'A held pad caught from each chord that glides to the next, then a clean slow rotating speaker blended under the dry sound.',
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Sustain pedal',
        params: { attack: 0.275, glide: 0.438, mix: 0.3 },
      },
      { deviceId: 'rotary', preset: 'Soft blend', params: { mix: 0.27 } },
    ],
  },
  {
    id: 'far-north-sheepfold-cloud',
    name: 'Sheepfold cloud',
    category: 'texture',
    description:
      'A wide cloud of piled-up chords whose overtones all drift, into a huge dark open space that answers late and rings on.',
    effects: [
      { deviceId: 'sustainer', preset: 'Shimmer cloud', params: { attack: 1.12, glide: 0.974 } },
      { deviceId: 'fdn-reverb', preset: 'Open valley' },
    ],
  },
  {
    id: 'far-north-hoarfrost-halo',
    name: 'Hoarfrost halo',
    category: 'texture',
    description:
      'A bright, thin pad an octave up that follows closely, then a reel driven as hard as it goes, thick with harmonics.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Glassy', params: { rise: 0.141, fall: 2.74 } },
      { deviceId: 'tape', preset: 'Needles pinned' },
    ],
  },
  {
    id: 'far-north-stack-on-the-moss',
    name: 'Stack on the moss',
    category: 'texture',
    description:
      'A string-like swell, then little loops of each note stacked one and two octaves up, into a swaying hall.',
    effects: [
      { deviceId: 'swell', preset: 'String section' },
      { deviceId: 'cascade', preset: 'Octave stack', params: { time: 436 } },
      { deviceId: 'shimmer', preset: 'Swaying hall' },
    ],
  },
  {
    id: 'far-north-snowbound-tide',
    name: 'Snowbound tide',
    category: 'texture',
    description:
      'Dark backwards loops of each note and its octave below, then a gentle high cut that shades the top end.',
    effects: [
      { deviceId: 'cascade', preset: 'Undertow', params: { time: 563 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { clearTime: 1.6 } },
    ],
  },
  {
    id: 'far-north-harbour-shimmer',
    name: 'Harbour shimmer',
    category: 'texture',
    description:
      'Bright tape-style saturation mixed in under the clean sound, then a soft wash of octave and fifth loops over each note.',
    effects: [
      { deviceId: 'saturator', preset: 'Parallel shine' },
      { deviceId: 'cascade', preset: 'Sparkle bed', params: { time: 357 } },
    ],
  },
  {
    id: 'far-north-lichen-swell',
    name: 'Lichen swell',
    category: 'texture',
    description:
      'A slow swell after each silence, opening late in its rise, then a wobbling tape double a moment behind each note.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 1480, release: 858 } },
      { deviceId: 'tape-echo', preset: 'Wobbly double' },
    ],
  },
  {
    id: 'far-north-halo-after-snow',
    name: 'Halo after snow',
    category: 'texture',
    description:
      'A quick fade-in that only softens the edge of each note, then a thin, high pad an octave up with nothing low in it.',
    effects: [
      { deviceId: 'swell', preset: 'Soft pick', params: { attack: 45.4 } },
      { deviceId: 'pad-follower', preset: 'High mist', params: { rise: 1.33, fall: 8.31 } },
    ],
  },
  {
    id: 'far-north-midnight-sun-halo',
    name: 'Midnight-sun halo',
    category: 'pitch',
    description:
      'Dark, thick valve grit that fills out the low end, then a string pad with a second section an octave above.',
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit' },
      { deviceId: 'pad-follower', preset: 'Octave halo', params: { rise: 0.824, fall: 5.51 } },
    ],
  },
  {
    id: 'far-north-halo-in-slow-waves',
    name: 'Halo in slow waves',
    category: 'pitch',
    description:
      "A hint of a wavefolder's glassy edge under the clean sound, into a very long reverb whose tail keeps climbing by octaves.",
    effects: [
      { deviceId: 'saturator', preset: 'Folded glass', params: { outputDb: -6.6 } },
      { deviceId: 'bloom-reverb', preset: 'Endless rise' },
    ],
  },
  {
    id: 'far-north-black-sand-treble',
    name: 'Black-sand treble',
    category: 'pitch',
    description:
      'The octave above alone, every note of a chord moved up, then a deep slow chorus, into an evenly fading reverb.',
    effects: [
      { deviceId: 'octaves', preset: 'High voice alone' },
      { deviceId: 'chorus', preset: 'Deep sea', params: { rate: 0.138, delayMs: 26.8 } },
      { deviceId: 'shaped-reverb', preset: 'Falling', params: { time: 1.59, preDelay: 22.1 } },
    ],
  },
  {
    id: 'far-north-lava-field-glow',
    name: 'Lava-field glow',
    category: 'pitch',
    description:
      'High octaves that fade in late above each note, then a chorus above the lows, into the close reflections of a very small room.',
    effects: [
      { deviceId: 'octaves', preset: 'Slow halo', params: { attack: 0.616 } },
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { rate: 1.32, delayMs: 13.3 } },
      { deviceId: 'fdn-reverb', preset: 'Short ambience' },
    ],
  },
  {
    id: 'far-north-under-ice-bass',
    name: 'Under-ice bass',
    category: 'pitch',
    description:
      'A deep bass two octaves down that swells in slowly, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'octaves', preset: 'Slow pedals', params: { attack: 1.39 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'far-north-sparks-off-the-ice',
    name: 'Sparks off the ice',
    category: 'pitch',
    description:
      'Sparse short grains two octaves up, after each note, then a muffled string pad that is slow to fade away.',
    effects: [
      { deviceId: 'grain-delay', preset: 'High glitter', params: { time: 295, size: 45.4 } },
      { deviceId: 'pad-follower', preset: 'Felted pad' },
    ],
  },
  {
    id: 'far-north-nightless-glare',
    name: 'Nightless glare',
    category: 'pitch',
    description:
      'A clean combo amplifier with the treble all the way up, then a bright blurred cloud an octave above everything played.',
    effects: [
      { deviceId: 're-amp', preset: 'Clean and bright', params: { output: -2.35 } },
      { deviceId: 'spectral-blur', preset: 'Bright octave cloud' },
    ],
  },
  {
    id: 'far-north-halo-in-the-lee',
    name: 'Halo in the lee',
    category: 'pitch',
    description:
      'A triode valve stage, smoothly overdriven, into a reverb whose tail drifts up towards the octave as it rings.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'bloom-reverb', preset: 'Bloom' },
    ],
  },
  {
    id: 'far-north-basalt-reed',
    name: 'Basalt reed',
    category: 'pitch',
    description:
      'A nasal reed of octaves, then a slow flanger sweep, opposite on each side, into a wide room heard from its far end.',
    effects: [
      { deviceId: 'octaves', preset: 'Nasal reed' },
      { deviceId: 'tremolo', preset: 'Drifting comb', params: { rate: 0.111 } },
      { deviceId: 'ether-reverb', preset: 'Distant' },
    ],
  },
  {
    id: 'far-north-northern-bass',
    name: 'Northern bass',
    category: 'pitch',
    description:
      'A soft, deep bass one and two octaves below each note, then a slow breathing level, into a small room that casts a shadow an octave below.',
    effects: [
      { deviceId: 'octaves', preset: 'Deep' },
      { deviceId: 'tremolo', preset: 'Gentle breath' },
      { deviceId: 'shimmer', preset: 'Low shadow' },
    ],
  },
  {
    id: 'far-north-sheen-at-midsummer',
    name: 'Sheen at midsummer',
    category: 'pitch',
    description:
      'A grainy octave and twelfth above, thickened by feedback, into a wordless choir alone with none of the dry sound left.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Shimmer', params: { size: 44.6, delay: 44.1 } },
      { deviceId: 'vowel-reverb', preset: 'Choir alone', params: { decay: 10.8, preDelay: 20.9 } },
    ],
  },
  {
    id: 'far-north-tin-roof-octave',
    name: 'Tin-roof octave',
    category: 'pitch',
    description:
      'A single voice an octave above the dry sound, into three springs heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Octave up', params: { mix: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Tank alone' },
    ],
  },
  {
    id: 'far-north-skerry-fifths',
    name: 'Skerry fifths',
    category: 'pitch',
    description:
      'A drone looped from each note with the fifth above it, then a bucket-brigade echo with a slow chorus on its repeats.',
    effects: [
      { deviceId: 'cascade', preset: 'Drone of fifths', params: { time: 360 } },
      { deviceId: 'analog-delay', preset: 'Chorused' },
    ],
  },
  {
    id: 'far-north-slipway-harmony',
    name: 'Slipway harmony',
    category: 'pitch',
    description:
      'A fifth and a ninth above a single line, as stacked fifths, then a thick double made of slightly detuned grains.',
    effects: [
      { deviceId: 'lattice', preset: 'Fifths up', params: { v2Delay: 24.8, output: 4.38 } },
      { deviceId: 'grain-delay', preset: 'Thick double', params: { time: 23.8, size: 90.8 } },
    ],
  },
  {
    id: 'far-north-scree-lacquer',
    name: 'Scree lacquer',
    category: 'master',
    description:
      'A stereo image widened a little, with the bass left central, then a true-peak ceiling that lets go again over several seconds.',
    effects: [
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Slow tide', params: { release: 6.13 } },
    ],
  },
  {
    id: 'far-north-blue-hour-master',
    name: 'Blue-hour master',
    category: 'master',
    description:
      'The first hint of weight from a tape preamp, then a gentle compressor, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'analog-drive', preset: 'First hint' },
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { release: 2.22 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { gain: 2.03 } },
    ],
  },
  {
    id: 'far-north-trawler-mixdown',
    name: 'Trawler mixdown',
    category: 'master',
    description:
      'A fresh reel of tape, open on top and nearly steady, then a parallel compressor, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 390, release: 3.23 } },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.57 } },
    ],
  },
  {
    id: 'far-north-fjord-master',
    name: 'Fjord master',
    category: 'master',
    description:
      'A subsonic cut with the low mids and the presence eased, then a gentle compressor that draws loud and quiet together, then a safety limiter.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Drone' },
      { deviceId: 'ambient-comp', preset: 'Sit back', params: { attack: 102, release: 1.79 } },
      { deviceId: 'fet-limiter', preset: 'Safety', params: { outputGain: 3 } },
    ],
  },
  {
    id: 'far-north-smokehouse-polish',
    name: 'Smokehouse polish',
    category: 'master',
    description:
      'A fast, steady reel with soft saturation, then a rumble cut and a small lift of presence, then a smooth true-peak ceiling.',
    effects: [
      { deviceId: 'tape', preset: 'Mastering deck' },
      { deviceId: 'ambient-eq', preset: 'Keys', params: { clearTime: 1.68 } },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'far-north-sea-fog-mixdown',
    name: 'Sea-fog mixdown',
    category: 'master',
    description:
      'A parallel compressor that lifts quiet playing and tails, then a true-peak ceiling that lets go again over several seconds.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 398, release: 2.91 } },
      { deviceId: 'ambient-limiter', preset: 'Slow tide' },
    ],
  },
]
