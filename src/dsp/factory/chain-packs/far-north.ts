// Far North Bowed Guitar: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'far-north-wash-never-setting',
    name: 'Wash never setting',
    category: 'space',
    description:
      'A reverse-sounding swell, then a console channel driven until it is firm in the mids, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'swell', preset: 'Backwards' },
      { deviceId: 'analog-drive', preset: 'Console', params: { output: 2.19 } },
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { predelayMs: 53.9 } },
    ],
  },
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
    id: 'far-north-crowberry-plate',
    name: 'Crowberry plate',
    category: 'space',
    description:
      'A struck-to-pad swell, then a dark fuzz from a triode pushed far past its limit, into a far-off plate haze.',
    effects: [
      { deviceId: 'swell', preset: 'Piano to pad', params: { attack: 843, release: 376 } },
      { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { output: -7.42 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
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
      'A half-deep swell, then a dark fuzz from a triode pushed far past its limit, into a hall of about four seconds with no dry sound in it.',
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
    id: 'far-north-black-sand-valley',
    name: 'Black-sand valley',
    category: 'space',
    description:
      'A huge dark open space that answers late and rings on, then a string voice that doubles each note almost at once.',
    effects: [
      { deviceId: 'fdn-reverb', preset: 'Open valley' },
      { deviceId: 'pad-follower', preset: 'Doubler' },
    ],
  },
  {
    id: 'far-north-snowmelt-breath',
    name: 'Snowmelt breath',
    category: 'space',
    description:
      'An amplifier stack turned all the way up, into a reverb that breathes in slow waves over and over.',
    effects: [
      { deviceId: 're-amp', preset: 'Stack flat out' },
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { time: 1.74 } },
    ],
  },
  {
    id: 'far-north-tundra-halo',
    name: 'Tundra halo',
    category: 'space',
    description:
      'A small plate that is gone in a second or two, into a reverb whose tail climbs nearly an octave as it rings.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { predelayMs: 9.99 } },
      { deviceId: 'bloom-reverb', preset: 'Octave halo', params: { decay: 6.54 } },
    ],
  },
  {
    id: 'far-north-northern-voices',
    name: 'Northern voices',
    category: 'space',
    description:
      'A bowed swell at half strength under the dry attacks, into faint voices singing quietly behind the sound.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed', params: { attack: 275, release: 166 } },
      { deviceId: 'vowel-reverb', preset: 'Faint voices' },
    ],
  },
  {
    id: 'far-north-never-setting-wash',
    name: 'Never-setting wash',
    category: 'space',
    description:
      'A plate wash that hangs on for half a minute, then a low-pass that opens and closes over about half a minute.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Endless wash', params: { mix: 0.275 } },
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.028, envAttackMs: 9.77, envReleaseMs: 209 },
      },
    ],
  },
  {
    id: 'far-north-slipway-ascent',
    name: 'Slipway ascent',
    category: 'space',
    description:
      'A string-like swell, then the octave-climbing tail of a large reverb by itself, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 349, release: 652 } },
      { deviceId: 'shimmer', preset: 'Rising tail alone' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { midDecay: 7.27 } },
    ],
  },
  {
    id: 'far-north-springs-in-whiteout',
    name: 'Springs in whiteout',
    category: 'space',
    description:
      'A triode valve stage, smoothly overdriven, into a hint of a two-spring tank behind the sound.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Triode glow' },
      { deviceId: 'spring-reverb', preset: 'Hint of spring', params: { decay: 1.37 } },
    ],
  },
  {
    id: 'far-north-plate-over-the-bay',
    name: 'Plate over the bay',
    category: 'space',
    description:
      'A far-off, dulled tone, then a clean speaker in a room, miked from well back, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Distant', params: { clearTime: 1.63 } },
      { deviceId: 're-amp', preset: 'Just the room', params: { output: 0.915 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 14.8 } },
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
    id: 'far-north-voice-on-black-sand',
    name: 'Voice on black sand',
    category: 'space',
    description:
      'A single fixed voice in the middle that is barely there, into a cave whose echoes bend slowly up and down in pitch.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Lone voice', params: { decay: 3.33, preDelay: 21.5 } },
      { deviceId: 'swarm-reverb', preset: 'Bending' },
    ],
  },
  {
    id: 'far-north-canyon-at-blue-hour',
    name: 'Canyon at blue hour',
    category: 'space',
    description:
      'A subsonic cut and a slow ear that eases whatever rings on, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Master' },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 18, modRate: 0.229 } },
    ],
  },
  {
    id: 'far-north-choir-in-slow-waves',
    name: 'Choir in slow waves',
    category: 'space',
    description:
      'A choir of a hall whose vowel wanders on its own, into a hall whose tail sways in pitch with a trace of the octave.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Vowel drift', params: { decay: 7.2, preDelay: 20.8 } },
      { deviceId: 'shimmer', preset: 'Swaying hall', params: { decay: 4.46, predelay: 20.9 } },
    ],
  },
  {
    id: 'far-north-strings-in-the-lee',
    name: 'Strings in the lee',
    category: 'space',
    description:
      'A longer bowed swell that leans into every note, then sixteen strings in E minor heard alone with no dry sound, into a hall with long lows.',
    effects: [
      { deviceId: 'swell', preset: 'Slow bow' },
      { deviceId: 'sympathetic', preset: 'Strings alone', params: { decay: 7.97 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Warm undertow',
        params: { preDelay: 63.8, midDecay: 2.11 },
      },
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
    id: 'far-north-choir-still-rising',
    name: 'Choir still rising',
    category: 'space',
    description:
      'A slow swell after each silence that opens only at the end, into a reverb whose tail climbs an octave on every pass.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise' },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { decay: 7.31, predelay: 17.6 } },
    ],
  },
  {
    id: 'far-north-tin-roof-scatter',
    name: 'Tin-roof scatter',
    category: 'space',
    description:
      'A rumble cut and a single decibel of presence, into a mellow reverb whose tail splits upwards and downwards.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Keys', params: { clearTime: 1.64 } },
      { deviceId: 'bloom-reverb', preset: 'Scatter', params: { decay: 9.58 } },
    ],
  },
  {
    id: 'far-north-rosined-rise',
    name: 'Rosined rise',
    category: 'space',
    description:
      'A very long reverb whose tail keeps climbing by octaves, into a hard-driven two-spring tank that answers late and loud.',
    effects: [
      { deviceId: 'bloom-reverb', preset: 'Endless rise' },
      { deviceId: 'spring-reverb', preset: 'Dub send' },
    ],
  },
  {
    id: 'far-north-treeless-bloom',
    name: 'Treeless bloom',
    category: 'space',
    description:
      'A compressor as slow as a hand on a fader, then a tail that drifts upwards, into a dark reverb that rises backwards and leaves a dim tail.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Slow fader' },
      { deviceId: 'bloom-reverb', preset: 'Bloom', params: { decay: 5.46 } },
      { deviceId: 'shaped-reverb', preset: 'Ghost', params: { time: 1.98, preDelay: 66.4 } },
    ],
  },
  {
    id: 'far-north-pack-ice-strings',
    name: 'Pack-ice strings',
    category: 'space',
    description:
      'Eight strings in C major that ring on as under a held pedal, into a large hall heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'sympathetic', preset: 'Piano pedal', params: { decay: 3.18 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Full wet send',
        params: { decay: 7.34, breathRate: 0.319 },
      },
    ],
  },
  {
    id: 'far-north-highland-cloud',
    name: 'Highland cloud',
    category: 'space',
    description:
      'Fed-back copies that climb on the left and sink on the right, into a cloud of reverb that swells in after each note and fades.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Spiral' },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 2.62 } },
    ],
  },
  {
    id: 'far-north-plate-by-the-fjord',
    name: 'Plate by the fjord',
    category: 'space',
    description:
      'A long plate with a wide and even tail, then a rotating speaker at a standstill, heard close and in mono.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate' },
      { deviceId: 'rotary', preset: 'Stopped horn' },
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
    id: 'far-north-hot-spring-vault',
    name: 'Hot-spring vault',
    category: 'space',
    description:
      'A honky horn loudspeaker heard from far across a big room, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 're-amp', preset: 'Station platform', params: { output: -0.386 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'far-north-hoarfrost-tail',
    name: 'Hoarfrost tail',
    category: 'space',
    description:
      'Two dark late copies, a shadow either side of the sound, into a dark hall that takes about twenty seconds to die away.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Shadow', params: { delay: 26.2 } },
      { deviceId: 'fdn-reverb', preset: 'Endless tail' },
    ],
  },
  {
    id: 'far-north-harbour-hall',
    name: 'Harbour hall',
    category: 'space',
    description:
      'A valve preamp curve, lopsided and a little brighter on top, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { outputDb: -10.1 } },
      { deviceId: 'hall-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'far-north-midnight-sun-mirror',
    name: 'Midnight-sun mirror',
    category: 'echo',
    description:
      'Each phrase answered once by itself played backwards, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Phrase and mirror' },
      { deviceId: 'fdn-reverb', preset: 'Slow swell' },
    ],
  },
  {
    id: 'far-north-blue-hour-mirror',
    name: 'Blue-hour mirror',
    category: 'echo',
    description:
      'Whole phrases played backwards about four seconds later, into a hall of about four seconds with no dry sound in it.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Long mirror', params: { time: 3750 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Full wet send',
        params: { lowDecay: 3.52, midDecay: 4.07 },
      },
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
      'Slow backwards swells that rise and die behind the playing, into a small tank that goes on ringing for seconds.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells' },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank' },
    ],
  },
  {
    id: 'far-north-fellside-echo',
    name: 'Fellside echo',
    category: 'echo',
    description:
      'A backwards echo of each phrase, swelling in and cut off, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { time: 544 } },
      { deviceId: 'fdn-reverb', preset: 'Breathing', params: { decay: 8.27, breathRate: 0.187 } },
    ],
  },
  {
    id: 'far-north-boathouse-echo',
    name: 'Boathouse echo',
    category: 'echo',
    description:
      'A faint, very slow phasing that barely stirs the sound, then backwards chunks spliced hard, with no fades between them.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Still water', params: { mix: 0.21 } },
      { deviceId: 'reverse-delay', preset: 'Hard splices', params: { time: 414, mix: 0.24 } },
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
    id: 'far-north-nightless-echo',
    name: 'Nightless echo',
    category: 'echo',
    description:
      'A slow rotating speaker heard from across the room, then a faint trace of tape echo behind the playing.',
    effects: [
      { deviceId: 'rotary', preset: 'Across the room' },
      { deviceId: 'tape-echo', preset: 'Faint trace', params: { time: 498 } },
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
      'A tape loop that never fades, holding every layer, into a hall with about two and a half seconds of tail.',
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
    id: 'far-north-frosted-glass',
    name: 'Frosted glass',
    category: 'echo',
    description:
      'A hot console channel, then backwards swells that climb an octave on every pass, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Hot channel' },
      { deviceId: 'reverse-delay', preset: 'Rising glass', params: { time: 823 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 39.8 } },
    ],
  },
  {
    id: 'far-north-northerly-walls',
    name: 'Northerly walls',
    category: 'echo',
    description:
      'A combo amplifier miked fairly close in a small room, then a space that answers in hard separate echoes.',
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room', params: { output: -3.07 } },
      { deviceId: 'expanse', preset: 'Hard echoes' },
    ],
  },
  {
    id: 'far-north-skerry-stack',
    name: 'Skerry stack',
    category: 'tape',
    description:
      'Thin grit under the clean, then an amplifier stack turned all the way up, into three long springs with all the top taken off.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Parallel grit' },
      { deviceId: 're-amp', preset: 'Stack flat out' },
      { deviceId: 'spring-reverb', preset: 'Underwater' },
    ],
  },
  {
    id: 'far-north-mossy-corridor',
    name: 'Mossy corridor',
    category: 'tape',
    description:
      'A hot console channel, then a far-off combo amp, into a hard-driven two-spring tank that answers late and loud.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Hot channel' },
      { deviceId: 're-amp', preset: 'Down the hall', params: { output: -4.24 } },
      { deviceId: 'spring-reverb', preset: 'Dub send' },
    ],
  },
  {
    id: 'far-north-schoolhouse-stack',
    name: 'Schoolhouse stack',
    category: 'tape',
    description:
      'A low-heavy transformer, then an amplifier stack turned all the way up, into a two-spring tank with a little chirp and drip.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 're-amp', preset: 'Stack flat out' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { decay: 2.48 } },
    ],
  },
  {
    id: 'far-north-sea-fog-amp',
    name: 'Sea-fog amp',
    category: 'tape',
    description:
      'A tape preamp pushed just enough to add weight, then a far-off combo amp, into a bright spring splash that lands a moment after the note.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 're-amp', preset: 'Down the hall', params: { output: -4.69 } },
      { deviceId: 'spring-reverb', preset: 'Late splash' },
    ],
  },
  {
    id: 'far-north-never-setting-mirror',
    name: 'Never-setting mirror',
    category: 'tape',
    description:
      'Whole phrases played backwards about four seconds later, then a tape reel pushed hard into thick saturation.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Long mirror', params: { time: 3740 } },
      { deviceId: 'patina', preset: 'Reel pushed hard' },
    ],
  },
  {
    id: 'far-north-smokehouse-reel',
    name: 'Smokehouse reel',
    category: 'tape',
    description:
      'A transformer driven so the low end thickens and loosens, then a fast, steady reel pushed into soft saturation.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'tape', preset: 'Mastering deck', params: { output: -4.19 } },
    ],
  },
  {
    id: 'far-north-highland-chorus',
    name: 'Highland chorus',
    category: 'tape',
    description:
      'A drifting reel laid half against the dry sound, a chorus, into a large hall whose tail rises and falls every few seconds.',
    effects: [
      { deviceId: 'tape', preset: 'Drifting chorus' },
      { deviceId: 'fdn-reverb', preset: 'Breathing' },
    ],
  },
  {
    id: 'far-north-lichen-reel',
    name: 'Lichen reel',
    category: 'tape',
    description:
      'A half-speed tape loop in reverse, low and dark, then a reel of tape, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Slow backwards' },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'far-north-tape-after-snow',
    name: 'Tape after snow',
    category: 'tape',
    description:
      'A clean pass over fast new tape, with nothing added, then the low mains hum of an amplifier left switched on.',
    effects: [
      { deviceId: 'tape', preset: 'Clean transfer' },
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { response: 0.361, hold: 31.6 } },
    ],
  },
  {
    id: 'far-north-thawing-reel',
    name: 'Thawing reel',
    category: 'tape',
    description:
      'A tape reel pushed hard into thick saturation, into a long tail that wavers in pitch like an unsteady choir.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'expanse', preset: 'Seasick choir', params: { decay: 19.7, modRate: 1.59 } },
    ],
  },
  {
    id: 'far-north-aurora-tremolo',
    name: 'Aurora tremolo',
    category: 'motion',
    description:
      'A shudder in the level, too fast to count, into a small room that sparkles two octaves above the sound.',
    effects: [
      { deviceId: 'tremolo', preset: 'Fast shudder' },
      { deviceId: 'shimmer', preset: 'Sparkle room' },
    ],
  },
  {
    id: 'far-north-rotary-off-the-pier',
    name: 'Rotary off the pier',
    category: 'motion',
    description:
      'A fast rotating speaker at full depth, microphones close, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'rotary', preset: 'Close pulse' },
      { deviceId: 'expanse', preset: 'Far echoes' },
    ],
  },
  {
    id: 'far-north-tin-roof-rotary',
    name: 'Tin-roof rotary',
    category: 'motion',
    description:
      'An amplifier stack turned all the way up, then a slow rotating speaker set shallow and mixed half dry.',
    effects: [
      { deviceId: 're-amp', preset: 'Stack flat out', params: { output: -6.94 } },
      { deviceId: 'rotary', preset: 'Faint motion' },
    ],
  },
  {
    id: 'far-north-waves-at-blue-hour',
    name: 'Waves at blue hour',
    category: 'motion',
    description:
      'A reverb that swells and ebbs in waves of about four seconds, into four strings that retune to what is played and ring briefly.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Slow tide' },
      { deviceId: 'sympathetic', preset: 'Echo the tune', params: { decay: 1.32 } },
    ],
  },
  {
    id: 'far-north-basalt-voices',
    name: 'Basalt voices',
    category: 'motion',
    description:
      'A tape reel pushed hard into thick saturation, then a three-voice chorus spread wide across the sides, into a damped hall.',
    effects: [
      { deviceId: 'patina', preset: 'Reel pushed hard' },
      { deviceId: 'chorus', preset: 'Wide chorus', params: { rate: 0.764, delayMs: 10.8 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
    ],
  },
  {
    id: 'far-north-solstice-rotary',
    name: 'Solstice rotary',
    category: 'motion',
    description:
      'A slow rotating speaker with its amplifier driven hard, into a choir of a hall whose vowel wanders on its own.',
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
    id: 'far-north-trawler-glass',
    name: 'Trawler glass',
    category: 'texture',
    description:
      'A bright, thin pad an octave up that follows closely, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Glassy' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.571 } },
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
      'Piled-up held chords, every overtone drifting, spread wide, into a plain hall that rings for about three seconds.',
    effects: [
      { deviceId: 'sustainer', preset: 'Shimmer cloud' },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 3.33, predelay: 16.7 } },
    ],
  },
  {
    id: 'far-north-across-water-pad',
    name: 'Across-water pad',
    category: 'texture',
    description:
      'A held pad alone, in place of the sound that was played, into a long thin cave whose single echoes swell and fade.',
    effects: [
      {
        deviceId: 'sustainer',
        preset: 'Held sound alone',
        params: { attack: 0.108, glide: 0.317 },
      },
      { deviceId: 'swarm-reverb', preset: 'Glinting', params: { length: 0.585, glide: 0.534 } },
    ],
  },
  {
    id: 'far-north-sparkle-after-snow',
    name: 'Sparkle after snow',
    category: 'texture',
    description:
      'A soft wash of octave and fifth loops over each note, into a thin bright tail with all its lows cut away.',
    effects: [
      { deviceId: 'cascade', preset: 'Sparkle bed', params: { time: 283 } },
      { deviceId: 'expanse', preset: 'Thin air', params: { decay: 10.6, modRate: 0.205 } },
    ],
  },
  {
    id: 'far-north-rising-sparks',
    name: 'Rising sparks',
    category: 'texture',
    description:
      'Faint grains an octave and a fifth up, behind the playing, then an equaliser that adds lows and body and eases the top.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Faint glints', params: { mix: 0.084 } },
      { deviceId: 'ambient-eq', preset: 'Warm', params: { clearTime: 1.33 } },
    ],
  },
  {
    id: 'far-north-turf-roof-hold',
    name: 'Turf-roof hold',
    category: 'texture',
    description:
      'A firm, slow compressor that keeps long swells held down, then a quiet, unsmeared sustain that holds each note for seconds.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Hold swells', params: { makeup: -2.68 } },
      { deviceId: 'spectral-blur', preset: 'Long clean hold' },
    ],
  },
  {
    id: 'far-north-frosted-halo',
    name: 'Frosted halo',
    category: 'texture',
    description:
      'A short bright haze with an octave above everything, then a high cut set low enough to muffle everything.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Glass halo' },
      { deviceId: 'ambient-eq', preset: 'Muffled' },
    ],
  },
  {
    id: 'far-north-sheepfold-pad',
    name: 'Sheepfold pad',
    category: 'texture',
    description:
      'A string pad alone, in place of the instrument playing it, into a bright wide room that rings for a second or two.',
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
      'A held pad whose every overtone wavers, like a choir, into sixteen strings in C major that ring for about ten seconds.',
    effects: [
      { deviceId: 'sustainer', preset: 'Wavering choir', params: { attack: 0.36, glide: 0.527 } },
      { deviceId: 'sympathetic', preset: 'Long ring' },
    ],
  },
  {
    id: 'far-north-glass-by-the-fjord',
    name: 'Glass by the fjord',
    category: 'texture',
    description:
      'A bright, thin pad an octave up that follows closely, then a rotating speaker at a standstill, heard close and in mono.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Glassy', params: { rise: 0.152, fall: 2.19 } },
      { deviceId: 'rotary', preset: 'Stopped horn' },
    ],
  },
  {
    id: 'far-north-trace-by-the-boats',
    name: 'Trace by the boats',
    category: 'texture',
    description:
      'A short glow of held tone that dies just after each note, into a small tank that goes on ringing for seconds.',
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
    id: 'far-north-turned-round-rise',
    name: 'Turned-round rise',
    category: 'texture',
    description:
      'A swell that arrives late, so notes seem to play in reverse, into a clean speaker in a room, miked from well back.',
    effects: [
      { deviceId: 'swell', preset: 'Backwards', params: { attack: 400, release: 107 } },
      { deviceId: 're-amp', preset: 'Just the room', params: { output: 1.92 } },
    ],
  },
  {
    id: 'far-north-parish-choir',
    name: 'Parish choir',
    category: 'pitch',
    description:
      'A few decibels of soft saturation with the top eased, into a reverb whose tail climbs an octave on every pass.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { outputDb: -5.81 } },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { decay: 8.7, predelay: 21 } },
    ],
  },
  {
    id: 'far-north-midnight-sun-halo',
    name: 'Midnight-sun halo',
    category: 'pitch',
    description:
      'A dark, thick valve curve mixed over some of the clean sound, then a string pad with a second section an octave above.',
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
    id: 'far-north-glare-still-rising',
    name: 'Glare still rising',
    category: 'pitch',
    description:
      'An amplifier stack, all bass, with the mic turned away, then a bright blurred cloud an octave above everything played.',
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly' },
      { deviceId: 'spectral-blur', preset: 'Bright octave cloud' },
    ],
  },
  {
    id: 'far-north-black-sand-treble',
    name: 'Black-sand treble',
    category: 'pitch',
    description:
      'The octave above alone, every note of a chord moved up, then a deep slow chorus, into a reverb that falls away in a straight line.',
    effects: [
      { deviceId: 'octaves', preset: 'High voice alone' },
      { deviceId: 'chorus', preset: 'Deep sea', params: { rate: 0.138, delayMs: 26.8 } },
      { deviceId: 'shaped-reverb', preset: 'Falling', params: { time: 1.59, preDelay: 22.1 } },
    ],
  },
  {
    id: 'far-north-falsetto-drawbars',
    name: 'Falsetto drawbars',
    category: 'pitch',
    description:
      'Every note doubled one and two octaves below and above, then a one-voice slow chorus, into a late small room.',
    effects: [
      { deviceId: 'octaves', preset: 'Organ' },
      { deviceId: 'tremolo', preset: 'Slow chorus', params: { rate: 0.782 } },
      { deviceId: 'ether-reverb', preset: 'Slap room' },
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
    id: 'far-north-fjord-glass',
    name: 'Fjord glass',
    category: 'pitch',
    description:
      'Glassy upper octaves, then a thick three-voice ensemble chorus that turns slowly, into a bright wide room that rings for a second or two.',
    effects: [
      { deviceId: 'octaves', preset: 'Glass octaves' },
      { deviceId: 'chorus', preset: 'Lush ensemble' },
      { deviceId: 'ether-reverb', preset: 'Ether' },
    ],
  },
  {
    id: 'far-north-under-ice-bass',
    name: 'Under-ice bass',
    category: 'pitch',
    description:
      'Deep pedal notes two octaves down that swell in slowly, into a bright undamped plate of a couple of seconds.',
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
      'Sparse short grains two octaves up, after each note, then a muffled pad with all its top taken off, slow to fade.',
    effects: [
      { deviceId: 'grain-delay', preset: 'High glitter', params: { time: 295, size: 45.4 } },
      { deviceId: 'pad-follower', preset: 'Felted pad' },
    ],
  },
  {
    id: 'far-north-under-ice-octaves',
    name: 'Under-ice octaves',
    category: 'pitch',
    description:
      'The octaves below and above alone, beating out of tune, then a cassette with a full head bump and a rolled-off top.',
    effects: [
      { deviceId: 'octaves', preset: 'Hollow pair' },
      { deviceId: 'tape', preset: 'Warm thump', params: { output: -3.86 } },
    ],
  },
  {
    id: 'far-north-aurora-stack',
    name: 'Aurora stack',
    category: 'pitch',
    description:
      'Little loops of each note stacked one and two octaves up, then a resonant high-pass falling for about two seconds at a time.',
    effects: [
      { deviceId: 'cascade', preset: 'Octave stack', params: { time: 445 } },
      { deviceId: 'auto-filter', preset: 'Falling high-pass' },
    ],
  },
  {
    id: 'far-north-grains-in-hoarfrost',
    name: 'Grains in hoarfrost',
    category: 'pitch',
    description:
      'Faint reversed grains an octave above and an octave below, into a late reverb that climbs by octaves and fifths.',
    effects: [
      { deviceId: 'spectral-drifter', preset: 'Octaves both ways', params: { decay: 5.53 } },
      { deviceId: 'shimmer', preset: 'Late answer' },
    ],
  },
  {
    id: 'far-north-octave-under-cloud',
    name: 'Octave under cloud',
    category: 'pitch',
    description:
      'A swell that takes seconds to rise after each silence, then a faint layer of reversed grains an octave above the sound.',
    effects: [
      { deviceId: 'swell', preset: 'Tide', params: { release: 645 } },
      { deviceId: 'spectral-drifter', preset: 'Octave halo' },
    ],
  },
  {
    id: 'far-north-birchwood-overtone',
    name: 'Birchwood overtone',
    category: 'master',
    description:
      'A lopsided soft curve that adds the octave above each note, then a parallel compressor, then a low, slow ceiling.',
    effects: [
      { deviceId: 'saturator', preset: 'Octave glow' },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 351, release: 3.1 } },
      { deviceId: 'ambient-limiter', preset: 'Late night' },
    ],
  },
  {
    id: 'far-north-hoarfrost-width',
    name: 'Hoarfrost width',
    category: 'master',
    description:
      'A mid-forward tone, then the sides lifted a little, wider with nothing added, then a true-peak ceiling with the level pushed up into it.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Forward' },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Loud', params: { gain: -1.06 } },
    ],
  },
  {
    id: 'far-north-fellside-reel',
    name: 'Fellside reel',
    category: 'master',
    description:
      'A fresh reel of tape, then a pluck-taming compressor, then a brickwall ceiling that touches nothing beneath it.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-comp', preset: 'Pluck tamer', params: { attack: 10.7, release: 0.158 } },
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { release: 1.37 } },
    ],
  },
  {
    id: 'far-north-whiteout-glass',
    name: 'Whiteout glass',
    category: 'master',
    description:
      'A hint of wavefolder, then a low cut with some air, then a true-peak ceiling six decibels down, with room to spare.',
    effects: [
      { deviceId: 'saturator', preset: 'Folded glass' },
      { deviceId: 'ambient-eq', preset: 'Texture', params: { clearTime: 1.47 } },
      { deviceId: 'ambient-limiter', preset: 'Margin' },
    ],
  },
  {
    id: 'far-north-console-by-the-fjord',
    name: 'Console by the fjord',
    category: 'master',
    description:
      'A driven console channel, then a slow compressor that evens out swells over seconds, then a smooth true-peak ceiling.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Console' },
      { deviceId: 'ambient-comp', preset: 'Level', params: { attack: 335, release: 2.14 } },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { release: 1.39 } },
    ],
  },
  {
    id: 'far-north-booth-on-the-moss',
    name: 'Booth on the moss',
    category: 'master',
    description:
      'A tight damped little room that is barely there, then a fast limiter that steps in only on the loudest peaks.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Tight room' },
      { deviceId: 'fet-limiter', preset: 'Safety' },
    ],
  },
]
