// Static Cathedral: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'static-cathedral-hall-in-the-tower',
    name: 'Hall in the tower',
    category: 'space',
    description:
      'A damped hall whose tail lasts ten seconds and more, then a tape preamp driven for thick lows and a dull top.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Dark infinite' },
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -8.01 } },
    ],
  },
  {
    id: 'static-cathedral-plate-ringing-on',
    name: 'Plate ringing on',
    category: 'space',
    description:
      'A long plate with a wide and even tail, then a closed amplifier stack, driven and dark, miked off-centre.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 40.7 } },
      { deviceId: 're-amp', preset: 'Warm stack' },
    ],
  },
  {
    id: 'static-cathedral-unheated-crypt',
    name: 'Unheated crypt',
    category: 'space',
    description:
      'A huge dark cathedral with only the lows left ringing, then a dark fuzz from a triode pushed far past its limit.',
    effects: [
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 28.9, modRate: 0.102 } },
      { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { output: -7.65 } },
    ],
  },
  {
    id: 'static-cathedral-brownout-cloud',
    name: 'Brownout cloud',
    category: 'space',
    description:
      'A reverb that rises backwards for about four seconds, then a honky horn loudspeaker heard from far across a big room.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Long rise' },
      { deviceId: 're-amp', preset: 'Station platform', params: { output: 7.02 } },
    ],
  },
  {
    id: 'static-cathedral-cloister-nave',
    name: 'Cloister nave',
    category: 'space',
    description:
      'A vast nave that rings for about eight seconds, then a bright, lean console channel driven for an edge on top.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
      { deviceId: 'analog-drive', preset: 'Sheen' },
    ],
  },
  {
    id: 'static-cathedral-mullion-hall',
    name: 'Mullion hall',
    category: 'space',
    description:
      'A tape preamp overloaded until it breaks up, dull and thick, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Worn tape', params: { output: -11.4 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Airy tail',
        params: { preDelay: 27.1, lowDecay: 1.1, midDecay: 5.5 },
      },
    ],
  },
  {
    id: 'static-cathedral-hum-by-the-font',
    name: 'Hum by the font',
    category: 'space',
    description:
      'A huge hall whose tail hums a soft oo for a long while, then only the two detuned copies, hard left and right.',
    effects: [
      { deviceId: 'vowel-reverb', preset: 'Endless oo', params: { preDelay: 22.5 } },
      { deviceId: 'stereo-detune', preset: 'Wet only' },
    ],
  },
  {
    id: 'static-cathedral-tail-wall-to-wall',
    name: 'Tail wall to wall',
    category: 'space',
    description:
      'A driven combo amplifier with its hiss and hum right up, into a dark hall that takes about twenty seconds to die away.',
    effects: [
      { deviceId: 're-amp', preset: 'Noisy valves' },
      { deviceId: 'fdn-reverb', preset: 'Endless tail' },
    ],
  },
  {
    id: 'static-cathedral-limestone-room',
    name: 'Limestone room',
    category: 'space',
    description:
      'Fed-back copies that climb on the left and sink on the right, into a small chapel with a short sung eh in its tail.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Spiral', params: { delay: 43.6 } },
      { deviceId: 'vowel-reverb', preset: 'Chapel', params: { decay: 1.78, preDelay: 4.66 } },
    ],
  },
  {
    id: 'static-cathedral-rafter-hall',
    name: 'Rafter hall',
    category: 'space',
    description:
      'A transformer overloaded into a thick, loose fuzz, into a large hall heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron melt' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Full wet send',
        params: { decay: 7.73, breathRate: 0.327 },
      },
    ],
  },
  {
    id: 'static-cathedral-slate-bloom',
    name: 'Slate bloom',
    category: 'space',
    description:
      'A high cut set low enough to muffle everything, then a bright wide room, into a large space whose tail swells in behind each note.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Muffled' },
      { deviceId: 'ether-reverb', preset: 'Ether' },
      { deviceId: 'expanse', preset: 'Bloom' },
    ],
  },
  {
    id: 'static-cathedral-hall-by-candle',
    name: 'Hall by candle',
    category: 'space',
    description:
      'A fully damped hall with a few seconds of tail, then a gentle high cut that shades the top end.',
    effects: [
      { deviceId: 'ether-reverb', preset: 'Dark hall' },
      { deviceId: 'ambient-eq', preset: 'Shaded' },
    ],
  },
  {
    id: 'static-cathedral-cluster-in-midwinter',
    name: 'Cluster in midwinter',
    category: 'space',
    description:
      'A combo amplifier heard from the far side of a big room, into a tight cluster of echoes close behind each note.',
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall' },
      { deviceId: 'swarm-reverb', preset: 'Tight swarm', params: { length: 0.089, glide: 0.569 } },
    ],
  },
  {
    id: 'static-cathedral-vestry-cloud',
    name: 'Vestry cloud',
    category: 'space',
    description:
      'A low-pass that opens and closes over about half a minute, into a cloud of reverb that swells in after each note and fades.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0275, envAttackMs: 10.8, envReleaseMs: 184 },
      },
      { deviceId: 'shaped-reverb', preset: 'Bloom' },
    ],
  },
  {
    id: 'static-cathedral-mist-in-cold-stone',
    name: 'Mist in cold stone',
    category: 'space',
    description:
      'A small room that casts a shadow an octave below, into a thin bright tail with all its lows cut away.',
    effects: [
      { deviceId: 'shimmer', preset: 'Low shadow', params: { decay: 2.21, predelay: 18.1 } },
      { deviceId: 'expanse', preset: 'Thin air', params: { decay: 12.6, modRate: 0.188 } },
    ],
  },
  {
    id: 'static-cathedral-vault-with-no-heat',
    name: 'Vault with no heat',
    category: 'space',
    description:
      'A combo amplifier heard from the far side of a big room, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall' },
      { deviceId: 'expanse', preset: 'Low cathedral' },
    ],
  },
  {
    id: 'static-cathedral-evensong-memory',
    name: 'Evensong memory',
    category: 'echo',
    description:
      'Moments drifting back, then a honky horn loudspeaker heard from far across a big room, into a hall on its own.',
    effects: [
      { deviceId: 'echo-memory', preset: 'No echo' },
      { deviceId: 're-amp', preset: 'Station platform', params: { output: 3.92 } },
      { deviceId: 'hall-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'static-cathedral-stutter-in-the-roof',
    name: 'Stutter in the roof',
    category: 'echo',
    description:
      'The first fragment played, held as an endless stutter, then a far-off combo amp, into a huge wash by itself.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Stutter held', params: { length: 0.175 } },
      { deviceId: 're-amp', preset: 'Down the hall' },
      { deviceId: 'expanse', preset: 'Wash alone', params: { decay: 42.2, modRate: 0.0951 } },
    ],
  },
  {
    id: 'static-cathedral-north-door-chirps',
    name: 'North-door chirps',
    category: 'echo',
    description:
      'A fast backwards loop, then driven amplifier valves heard through a flat speaker, into a cave whose echoes bend slowly up and down in pitch.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Fast reverse', params: { length: 0.599 } },
      { deviceId: 're-amp', preset: 'Just the valves' },
      { deviceId: 'swarm-reverb', preset: 'Bending', params: { length: 0.478, glide: 2.1 } },
    ],
  },
  {
    id: 'static-cathedral-pillar-loop',
    name: 'Pillar loop',
    category: 'echo',
    description:
      'A wide, muffled loop of the last phrase, as if under water, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Underwater', params: { length: 2.38 } },
      { deviceId: 'expanse', preset: 'Low cathedral' },
    ],
  },
  {
    id: 'static-cathedral-guttering-memory',
    name: 'Guttering memory',
    category: 'echo',
    description:
      'Recalled phrases that are remembered again and slowly gather, into a bright chamber that rings for a couple of seconds.',
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Gathering',
        params: { time: 680, reach: 23.4, size: 3.76 },
      },
      { deviceId: 'expanse', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'static-cathedral-fifths-in-the-nave',
    name: 'Fifths in the nave',
    category: 'echo',
    description:
      'A small, boxy radio speaker, close by in a small room, then grain repeats that climb by fifths on every pass.',
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { output: -2.84 } },
      { deviceId: 'grain-delay', preset: 'Rising fifths' },
    ],
  },
  {
    id: 'static-cathedral-snow-light-chorus',
    name: 'Snow-light chorus',
    category: 'echo',
    description:
      'A transformer overloaded into a thick, loose fuzz, then a bucket-brigade echo with a slow chorus on its repeats.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron melt', params: { output: -9.13 } },
      { deviceId: 'analog-delay', preset: 'Chorused', params: { time: 273, modRate: 0.802 } },
    ],
  },
  {
    id: 'static-cathedral-unheated-echo',
    name: 'Unheated echo',
    category: 'echo',
    description:
      'Thin pentode grit mixed in under the clean sound, then grain repeats that sink by fourths on every pass.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Parallel grit' },
      { deviceId: 'grain-delay', preset: 'Falling fourths', params: { time: 530, size: 190 } },
    ],
  },
  {
    id: 'static-cathedral-tallow-room',
    name: 'Tallow room',
    category: 'tape',
    description:
      'A tape preamp driven for thick lows and a dull top, then a clean speaker at the far end of a big, live room, into a plate with no dry sound.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight' },
      { deviceId: 're-amp', preset: 'Far end of the hall' },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'static-cathedral-candle-end-stack',
    name: 'Candle-end stack',
    category: 'tape',
    description:
      'A lean pentode valve stage with a bite on every attack, then a dark, woolly stack, into a dark, very long hall.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Bite' },
      { deviceId: 're-amp', preset: 'Dark and woolly' },
      { deviceId: 'fdn-reverb', preset: 'Endless tail' },
    ],
  },
  {
    id: 'static-cathedral-room-under-slates',
    name: 'Room under slates',
    category: 'tape',
    description:
      'A bright wavefolder, then a clean speaker at the far end of a big, live room, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'saturator', preset: 'Wavefold lead' },
      { deviceId: 're-amp', preset: 'Far end of the hall', params: { output: -5.62 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'static-cathedral-lead-roof-stack',
    name: 'Lead-roof stack',
    category: 'tape',
    description:
      'A pentode pushed into a folded-over fuzz, thin and torn, then a warm amplifier stack, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Torn cone' },
      { deviceId: 're-amp', preset: 'Warm stack' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 41 } },
    ],
  },
  {
    id: 'static-cathedral-amp-past-the-pews',
    name: 'Amp past the pews',
    category: 'tape',
    description:
      'A pentode pushed into a folded-over fuzz, thin and torn, then a hissing, humming amp, into a slowly sliding cave.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Torn cone' },
      { deviceId: 're-amp', preset: 'Noisy valves' },
      { deviceId: 'swarm-reverb', preset: 'Slow stretch', params: { length: 0.708, glide: 5.42 } },
    ],
  },
  {
    id: 'static-cathedral-solder-bits',
    name: 'Solder bits',
    category: 'tape',
    description:
      'A dark valve fuzz, then converters at a very low rate, filtered smooth and dull, into a short, room-like haze.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz', params: { output: -7.67 } },
      { deviceId: 'vintage-digital', preset: 'Sunken' },
      { deviceId: 'spectral-blur', preset: 'Diffuse room' },
    ],
  },
  {
    id: 'static-cathedral-cracked-dial',
    name: 'Cracked dial',
    category: 'tape',
    description:
      'A shortwave set tuned off the station, whistling and broken, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'radio', preset: 'Off the dial' },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'static-cathedral-apse-preamp',
    name: 'Apse preamp',
    category: 'tape',
    description:
      'A valve preamp curve, lopsided and a little brighter on top, then radio static that drifts and crackles under the sound.',
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { outputDb: -9.37 } },
      { deviceId: 'noise-floor', preset: 'Radio static' },
    ],
  },
  {
    id: 'static-cathedral-haze-after-mass',
    name: 'Haze after mass',
    category: 'tape',
    description:
      'A wavefolder at full drive, broken up like a torn speaker, then a stream with its timing scrambled, attacks smeared to haze.',
    effects: [
      { deviceId: 'saturator', preset: 'Blown speaker', params: { outputDb: -21 } },
      { deviceId: 'low-bitrate', preset: 'Smeared haze' },
    ],
  },
  {
    id: 'static-cathedral-lenten-fuzz',
    name: 'Lenten fuzz',
    category: 'tape',
    description:
      'An overloaded console channel, half under the clean sound, then a dial left between stations, mostly whistle and static.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Crushed', params: { output: -11.9 } },
      { deviceId: 'radio', preset: 'Between stations' },
    ],
  },
  {
    id: 'static-cathedral-transept-loop',
    name: 'Transept loop',
    category: 'tape',
    description:
      'A tape loop that plays its layers back in reverse, then a tape reel with soft saturation, slight wobble and hiss.',
    effects: [
      { deviceId: 'tape-loop', preset: 'Backwards layers' },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
    ],
  },
  {
    id: 'static-cathedral-fizz-in-stone',
    name: 'Fizz in stone',
    category: 'tape',
    description:
      'A console channel driven until it is firm in the mids, then a stream starved and scrambled until every note fizzes.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Console' },
      { deviceId: 'low-bitrate', preset: 'Fizzing phases' },
    ],
  },
  {
    id: 'static-cathedral-frostbitten-grain',
    name: 'Frostbitten grain',
    category: 'tape',
    description:
      'A combo amp in a room, then an early sampler whose quiet tails crumble into grain, into a short reverb that swells in just after each note.',
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room' },
      { deviceId: 'patina', preset: 'Early sampler' },
      { deviceId: 'expanse', preset: 'Quick swell', params: { decay: 1.97, modRate: 0.398 } },
    ],
  },
  {
    id: 'static-cathedral-empty-pew-fuzz',
    name: 'Empty-pew fuzz',
    category: 'tape',
    description:
      'A hard-clipped copy held at one level under the clean sound, then the low mains hum of an amplifier left switched on.',
    effects: [
      { deviceId: 'saturator', preset: 'Sustain bed' },
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { response: 0.414, hold: 29.3 } },
    ],
  },
  {
    id: 'static-cathedral-stream-in-the-loft',
    name: 'Stream in the loft',
    category: 'tape',
    description:
      'A rumble cut and a single decibel of presence, then a gritty mono stream, then echoes that sink a few hertz flatter on every repeat.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Keys', params: { clearTime: 1.43 } },
      { deviceId: 'low-bitrate', preset: 'Dial-up' },
      { deviceId: 'freq-shifter', preset: 'Falling spiral', params: { mix: 0.27 } },
    ],
  },
  {
    id: 'static-cathedral-boarded-up-radio',
    name: 'Boarded-up radio',
    category: 'tape',
    description:
      'Soft tape-style saturation, then radio static mixed in low, into a fine patter of thin high echoes with no bass in them.',
    effects: [
      { deviceId: 'saturator', preset: 'On tape' },
      { deviceId: 'radio', preset: 'Hint of static' },
      { deviceId: 'swarm-reverb', preset: 'Glass rain' },
    ],
  },
  {
    id: 'static-cathedral-roofless-haze',
    name: 'Roofless haze',
    category: 'tape',
    description:
      'A stream with its timing scrambled, attacks smeared to haze, then a far radio station, sinking in and out of heavy static.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Smeared haze' },
      { deviceId: 'patina', preset: 'Distant station' },
    ],
  },
  {
    id: 'static-cathedral-verdigris-stream',
    name: 'Verdigris stream',
    category: 'tape',
    description:
      'A gritty short-frame stream, then loud, wide tape hiss that stands over the sound, into a dark, very long hall.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Gritty attacks' },
      { deviceId: 'noise-floor', preset: 'Wall of hiss', params: { response: 0.397, hold: 18.2 } },
      { deviceId: 'fdn-reverb', preset: 'Endless tail', params: { breathRate: 0.0773 } },
    ],
  },
  {
    id: 'static-cathedral-bits-at-evensong',
    name: 'Bits at evensong',
    category: 'tape',
    description:
      'A low cut with the low mids dipped and the presence lifted, then seven-bit converters whose quiet tails break up and cut off.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Voice', params: { clearTime: 1.57 } },
      { deviceId: 'vintage-digital', preset: 'Coarse' },
    ],
  },
  {
    id: 'static-cathedral-signal-in-static',
    name: 'Signal in static',
    category: 'tape',
    description:
      'A nasal shortwave channel crossed by whistles and data tones, then a shortwave broadcast, narrow and mono, fading under static.',
    effects: [
      { deviceId: 'radio', preset: 'Numbers' },
      { deviceId: 'patina', preset: 'Shortwave' },
    ],
  },
  {
    id: 'static-cathedral-leaded-blanket',
    name: 'Leaded blanket',
    category: 'tape',
    description:
      'A muffled cassette, then a signal buried in static, into a damped hall whose tail lasts ten seconds and more.',
    effects: [
      { deviceId: 'tape', preset: 'Under a blanket', params: { output: -5.66 } },
      { deviceId: 'radio', preset: 'Static wash' },
      { deviceId: 'ether-reverb', preset: 'Dark infinite', params: { predelayMs: 53.7 } },
    ],
  },
  {
    id: 'static-cathedral-gargoyle-bits',
    name: 'Gargoyle bits',
    category: 'tape',
    description:
      'A coarse early sampler, gritty, with bright hash on top, then whole phrases played backwards about four seconds later.',
    effects: [
      { deviceId: 'patina', preset: 'Eight bit', params: { output: 2.87 } },
      { deviceId: 'reverse-delay', preset: 'Long mirror', params: { time: 3910 } },
    ],
  },
  {
    id: 'static-cathedral-snowbound-bits',
    name: 'Snowbound bits',
    category: 'tape',
    description:
      'A slow phasing drift from partials moved less than a hertz, then raw converters at a very low rate, bright and clanging.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift' },
      { deviceId: 'vintage-digital', preset: 'Clang' },
    ],
  },
  {
    id: 'static-cathedral-padlocked-skips',
    name: 'Padlocked skips',
    category: 'tape',
    description:
      'The skips of a scratched disc, stuck on tiny fragments, then loud, wide tape hiss that stands over the sound.',
    effects: [
      { deviceId: 'glitch', preset: 'Skipping disc' },
      { deviceId: 'noise-floor', preset: 'Wall of hiss', params: { response: 0.369, hold: 18.4 } },
    ],
  },
  {
    id: 'static-cathedral-churchyard-sampler',
    name: 'Churchyard sampler',
    category: 'tape',
    description:
      'Nine-bit converters on an unsteady clock, hiss on high notes, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Worn' },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'static-cathedral-side-aisle-valve',
    name: 'Side-aisle valve',
    category: 'tape',
    description:
      'A valve stage driven hard until it thickens and sags, then a subsonic cut and a slow ear that eases whatever rings on.',
    effects: [
      { deviceId: 'patina', preset: 'Hot valve', params: { output: -6.01 } },
      { deviceId: 'ambient-eq', preset: 'Master', params: { clearTime: 3.09 } },
    ],
  },
  {
    id: 'static-cathedral-buttress-stream',
    name: 'Buttress stream',
    category: 'tape',
    description:
      'A long tail that wavers in pitch like an unsteady choir, then a thin audio stream that swirls and warbles a little.',
    effects: [
      { deviceId: 'expanse', preset: 'Seasick choir', params: { modRate: 1.5 } },
      { deviceId: 'low-bitrate', preset: 'Behind glass' },
    ],
  },
  {
    id: 'static-cathedral-grey-noon-grain',
    name: 'Grey-noon grain',
    category: 'tape',
    description:
      'Five-bit converters fed hot, a coarse grain on every note, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Crushed' },
      { deviceId: 'hall-reverb', preset: 'Vast nave' },
    ],
  },
  {
    id: 'static-cathedral-censer-voices',
    name: 'Censer voices',
    category: 'motion',
    description:
      'A dull, aliasing clipper, then a choir of a hall whose vowel wanders on its own, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'saturator', preset: 'Lo-fi' },
      { deviceId: 'vowel-reverb', preset: 'Vowel drift' },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 15.7 } },
    ],
  },
  {
    id: 'static-cathedral-sway-in-the-apse',
    name: 'Sway in the apse',
    category: 'motion',
    description:
      'A dark valve fuzz, then the whole sound swaying sharp and flat every few seconds, into a slow tide of reverb.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz' },
      { deviceId: 'freq-shifter', preset: 'Seasick', params: { delay: 19.1, lfoRate: 0.222 } },
      { deviceId: 'shaped-reverb', preset: 'Slow tide', params: { time: 3.98 } },
    ],
  },
  {
    id: 'static-cathedral-sweep-under-snow',
    name: 'Sweep under snow',
    category: 'motion',
    description:
      'An overloaded console, then a swinging resonant low-pass, into a dull mono tunnel with a tail of several seconds.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Crushed', params: { output: -5.36 } },
      { deviceId: 'auto-filter', preset: 'Dub sweep' },
      { deviceId: 'expanse', preset: 'Narrow tunnel', params: { decay: 6.34, modRate: 0.382 } },
    ],
  },
  {
    id: 'static-cathedral-blown-fuse-sway',
    name: 'Blown-fuse sway',
    category: 'motion',
    description:
      'The whole sound swaying sharp and flat every few seconds, then a thinning tape echo, into a long high choir.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Seasick', params: { delay: 20.7, lfoRate: 0.27 } },
      { deviceId: 'tape-echo', preset: 'Thin and fading', params: { time: 369 } },
      { deviceId: 'vowel-reverb', preset: 'High choir' },
    ],
  },
  {
    id: 'static-cathedral-throb-after-mass',
    name: 'Throb after mass',
    category: 'motion',
    description:
      'A steady beat about twice a second, crossing side to side, into a huge space that answers in separate far-off echoes.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Moving beat', params: { delay: 46.2, lfoRate: 0.0783 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { decay: 17.7, modRate: 0.257 } },
    ],
  },
  {
    id: 'static-cathedral-bellows-tide',
    name: 'Bellows tide',
    category: 'motion',
    description:
      'A low-pass that opens and closes over about half a minute, into a hall of about four seconds with no dry sound in it.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Glacial low-pass',
        params: { lfoRateHz: 0.0279, envAttackMs: 10.3, envReleaseMs: 190 },
      },
      {
        deviceId: 'hall-reverb',
        preset: 'Full wet send',
        params: { preDelay: 22.3, lowDecay: 3.83, midDecay: 4.22 },
      },
    ],
  },
  {
    id: 'static-cathedral-choir-with-no-heat',
    name: 'Choir with no heat',
    category: 'motion',
    description:
      'Two dark late copies, a shadow either side of the sound, then a held pad whose every overtone wavers, like a choir.',
    effects: [
      { deviceId: 'stereo-detune', preset: 'Shadow', params: { delay: 26.6 } },
      { deviceId: 'sustainer', preset: 'Wavering choir' },
    ],
  },
  {
    id: 'static-cathedral-whitewashed-murk',
    name: 'Whitewashed murk',
    category: 'texture',
    description:
      'Four-bit companded converters that rasp on every note, then a thick fog of grains, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Rasp' },
      { deviceId: 'grain-cloud', preset: 'Thick fog', params: { size: 523 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Airy tail',
        params: { preDelay: 32.6, lowDecay: 1.11, midDecay: 5.37 },
      },
    ],
  },
  {
    id: 'static-cathedral-whiteout-embers',
    name: 'Whiteout embers',
    category: 'texture',
    description:
      'A thin twelve-bit glaze, then grain repeats that fall an octave each time, darkening, into a dark backwards reverb.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze' },
      { deviceId: 'grain-delay', preset: 'Falling embers', params: { time: 476, size: 241 } },
      { deviceId: 'shaped-reverb', preset: 'Ghost', params: { time: 1.95, preDelay: 58 } },
    ],
  },
  {
    id: 'static-cathedral-cloud-off-the-walls',
    name: 'Cloud off the walls',
    category: 'texture',
    description:
      'A watery stream whose every note hangs on as a grainy wash, then a cloud of backwards grains close behind the playing, into a damped hall.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Frozen stream' },
      { deviceId: 'grain-cloud', preset: 'Backwards room', params: { size: 343, density: 9.72 } },
      { deviceId: 'ether-reverb', preset: 'Dark hall', params: { predelayMs: 20.6, mix: 0.18 } },
    ],
  },
  {
    id: 'static-cathedral-mist-wall-to-wall',
    name: 'Mist wall to wall',
    category: 'texture',
    description:
      'A stream cut off above the mids, as if through a wall, then a diffuse mist where each note hangs on after it is played, into a far-off hall.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Through a wall' },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.38 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.48 } },
    ],
  },
  {
    id: 'static-cathedral-north-door-cloud',
    name: 'North-door cloud',
    category: 'texture',
    description:
      'Five-bit converters fed hot, a coarse grain on every note, then a scattered cloud of short grains behind the playing, into a far-off hall.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Crushed' },
      { deviceId: 'grain-delay', preset: 'Grain cloud', params: { time: 237, size: 78.3 } },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { mix: 0.611 } },
    ],
  },
  {
    id: 'static-cathedral-evensong-wash',
    name: 'Evensong wash',
    category: 'texture',
    description:
      'A very wide wash in which every note hangs for many seconds, then the soft air of an open microphone under the sound.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Endless', params: { mix: 0.45 } },
      { deviceId: 'noise-floor', preset: 'Close mic', params: { response: 0.388, hold: 10.5 } },
    ],
  },
  {
    id: 'static-cathedral-depths-in-the-vestry',
    name: 'Depths in the vestry',
    category: 'texture',
    description:
      'A low blurred bed under the sound, nothing above the bass, then record crackle that ducks under notes and fills the gaps.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Sub bed' },
      { deviceId: 'noise-floor', preset: 'Gap crackle' },
    ],
  },
  {
    id: 'static-cathedral-sustain-in-the-crypt',
    name: 'Sustain in the crypt',
    category: 'texture',
    description:
      'A held tone that takes over each note at once and soon fades, then the low mains hum of an amplifier left switched on.',
    effects: [
      { deviceId: 'sustainer', preset: 'Quick catch', params: { mix: 0.24 } },
      { deviceId: 'noise-floor', preset: 'Amp left on' },
    ],
  },
  {
    id: 'static-cathedral-swell-in-static',
    name: 'Swell in static',
    category: 'texture',
    description:
      'A string pad that takes seconds to swell in after a chord, then tape hiss that sinks under each note and swells in the gaps.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Slow swell', params: { rise: 4.12, fall: 6.95 } },
      {
        deviceId: 'noise-floor',
        preset: 'Breathing tape',
        params: { response: 0.866, hold: 16.2 },
      },
    ],
  },
  {
    id: 'static-cathedral-bad-cable-pedal',
    name: 'Bad-cable pedal',
    category: 'texture',
    description:
      'A slow swell after each silence that opens only at the end, then every note sustained after it is played, with no smearing.',
    effects: [
      { deviceId: 'swell', preset: 'Sunrise', params: { attack: 1490, release: 762 } },
      { deviceId: 'spectral-blur', preset: 'Clean sustain', params: { mix: 0.27 } },
    ],
  },
  {
    id: 'static-cathedral-overcast-rumble',
    name: 'Overcast rumble',
    category: 'texture',
    description:
      'A low blurred bed under the sound, nothing above the bass, then a gentle low-pass at a kilohertz.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Sub bed' },
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { lfoRateHz: 0.976, envAttackMs: 9.68, envReleaseMs: 211 },
      },
    ],
  },
  {
    id: 'static-cathedral-climb-under-slates',
    name: 'Climb under slates',
    category: 'texture',
    description:
      'Faint reversed grains that creep upwards over a minute or so, then echoes that go sour fast, up on the left, down on the right.',
    effects: [
      { deviceId: 'spectral-drifter', preset: 'Slow climb' },
      { deviceId: 'freq-shifter', preset: 'Parting echo', params: { delay: 369, lfoRate: 0.0765 } },
    ],
  },
  {
    id: 'static-cathedral-wash-held-for-good',
    name: 'Wash held for good',
    category: 'texture',
    description:
      'A wash that never fades, then a deep pitch wobble in the centre, like a warped tape, into a huge open valley.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Endless wash' },
      { deviceId: 'chorus', preset: 'Warped tape' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Open valley',
        params: { decay: 9.71, predelayMs: 107, breathRate: 0.302 },
      },
    ],
  },
  {
    id: 'static-cathedral-chancel-band',
    name: 'Chancel band',
    category: 'texture',
    description:
      'A wide fog kept to the middle band, hanging for seconds, then a reverb that breathes in slow waves over and over.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Band of fog' },
      { deviceId: 'shaped-reverb', preset: 'Breathing', params: { time: 1.67 } },
    ],
  },
  {
    id: 'static-cathedral-glide-in-the-tower',
    name: 'Glide in the tower',
    category: 'texture',
    description:
      'A held pad that takes seconds to melt into each new chord, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'sustainer', preset: 'Long glide' },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'static-cathedral-pillar-haze',
    name: 'Pillar haze',
    category: 'texture',
    description:
      'A faint haze just behind the dry sound, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Faint haze' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.463 } },
    ],
  },
  {
    id: 'static-cathedral-bloom-through-stone',
    name: 'Bloom through stone',
    category: 'texture',
    description:
      'Layers of held chords that bloom slowly and never fade, then a starved stream in long frames, watery, its top cut away.',
    effects: [
      { deviceId: 'sustainer', preset: 'Slow bloom layers', params: { mix: 0.369 } },
      { deviceId: 'low-bitrate', preset: 'Underwater' },
    ],
  },
  {
    id: 'static-cathedral-lenten-cloud',
    name: 'Lenten cloud',
    category: 'texture',
    description:
      'A slow compressor that evens out swells over seconds, then a thick fog of grains, into a long dark reverb whose tail sinks slowly in pitch.',
    effects: [
      {
        deviceId: 'ambient-comp',
        preset: 'Level',
        params: { attack: 295, release: 2.18, makeup: 5.71 },
      },
      { deviceId: 'grain-cloud', preset: 'Thick fog', params: { size: 438 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { decay: 22.7 } },
    ],
  },
  {
    id: 'static-cathedral-unlit-tide',
    name: 'Unlit tide',
    category: 'texture',
    description:
      'A dark, thick valve curve mixed over some of the clean sound, then long slow grains an octave down, most of them reversed.',
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit' },
      { deviceId: 'grain-cloud', preset: 'Low tide', params: { size: 803, density: 5.39 } },
    ],
  },
  {
    id: 'static-cathedral-bell-rope-echoes',
    name: 'Bell-rope echoes',
    category: 'texture',
    description:
      'Soft repeats an octave up or down, under the dry sound, then raw converters at a very low rate, bright and clanging.',
    effects: [
      { deviceId: 'glitch', preset: 'Octave ghosts' },
      { deviceId: 'vintage-digital', preset: 'Clang' },
    ],
  },
  {
    id: 'static-cathedral-pad-down-the-nave',
    name: 'Pad down the nave',
    category: 'texture',
    description:
      'A wide pad made of the sound with its attacks dissolved, into a far-miked room laid in under the clean sound.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Pad from anything' },
      { deviceId: 're-amp', preset: 'Room underneath' },
    ],
  },
  {
    id: 'static-cathedral-soot-strings',
    name: 'Soot strings',
    category: 'texture',
    description:
      'A string pad alone, in place of the instrument playing it, into a small room that casts a shadow an octave below.',
    effects: [
      { deviceId: 'pad-follower', preset: 'Pad alone' },
      { deviceId: 'shimmer', preset: 'Low shadow', params: { predelay: 21.8 } },
    ],
  },
  {
    id: 'static-cathedral-transept-fifth',
    name: 'Transept fifth',
    category: 'pitch',
    description:
      'Grains a fifth down, then a medium-wave station under the crackle of a far storm, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fifth down grains', params: { length: 78.7 } },
      { deviceId: 'radio', preset: 'Storm coming' },
      {
        deviceId: 'hall-reverb',
        preset: 'Vast nave',
        params: { preDelay: 93.8, lowDecay: 7.21, midDecay: 7.52 },
      },
    ],
  },
  {
    id: 'static-cathedral-bass-past-the-pews',
    name: 'Bass past the pews',
    category: 'pitch',
    description:
      'A rounded octave below every note of a chord, then a stream full of holes, into a huge dark cathedral with only the lows left ringing.',
    effects: [
      { deviceId: 'octaves', preset: 'Sub octave' },
      { deviceId: 'low-bitrate', preset: 'Dropouts' },
      { deviceId: 'expanse', preset: 'Low cathedral', params: { decay: 32.6, modRate: 0.0985 } },
    ],
  },
  {
    id: 'static-cathedral-bass-in-the-loft',
    name: 'Bass in the loft',
    category: 'pitch',
    description:
      'The octave below alone, rounded off into a bass, then a watery, warbling copy mixed low under the clean sound, into a slow dark swell.',
    effects: [
      { deviceId: 'octaves', preset: 'Bass alone' },
      { deviceId: 'low-bitrate', preset: 'Watery trace' },
      { deviceId: 'shaped-reverb', preset: 'Dark swell', params: { time: 3.9 } },
    ],
  },
  {
    id: 'static-cathedral-loose-wire-chime',
    name: 'Loose-wire chime',
    category: 'pitch',
    description:
      'High inharmonic chimes, then a nasal shortwave channel, into a cathedral whose long tail sings a soft open ah.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'High chime', params: { delay: 254, lfoRate: 0.0784 } },
      { deviceId: 'radio', preset: 'Numbers' },
      { deviceId: 'vowel-reverb', preset: 'Cathedral', params: { decay: 18.7, preDelay: 36.3 } },
    ],
  },
  {
    id: 'static-cathedral-crawl-in-the-apse',
    name: 'Crawl in the apse',
    category: 'pitch',
    description:
      'A quarter-speed crawl, then a stream with its timing scrambled, attacks smeared to haze, into a far-off hall.',
    effects: [
      { deviceId: 'half-speed', preset: 'Quarter speed' },
      { deviceId: 'low-bitrate', preset: 'Smeared haze' },
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 22.1, lowDecay: 4.77, midDecay: 4.08 },
      },
    ],
  },
  {
    id: 'static-cathedral-side-aisle-ring',
    name: 'Side-aisle ring',
    category: 'pitch',
    description:
      'A low ring modulator that roughens every note to a growl, then a dark string pad that lingers long after each chord.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Low growl' },
      { deviceId: 'pad-follower', preset: 'Lingering' },
    ],
  },
  {
    id: 'static-cathedral-nave-end-fourth',
    name: 'Nave-end fourth',
    category: 'pitch',
    description:
      'A close harmony a fourth below, made of short slowed pieces, then two copies far out of tune that sway like a worn tape.',
    effects: [
      { deviceId: 'half-speed', preset: 'Fourth below' },
      { deviceId: 'stereo-detune', preset: 'Seasick' },
    ],
  },
  {
    id: 'static-cathedral-short-day-undertow',
    name: 'Short-day undertow',
    category: 'pitch',
    description:
      'Whole phrases dragged out at half speed, an octave down, then smooth, dull converters whose clock is badly unsteady.',
    effects: [
      { deviceId: 'half-speed', preset: 'Long drag' },
      { deviceId: 'vintage-digital', preset: 'Jittery' },
    ],
  },
  {
    id: 'static-cathedral-buried-bass',
    name: 'Buried bass',
    category: 'pitch',
    description:
      'The octave below alone, rounded off into a bass, into a soft sung oo that follows a moment behind each note.',
    effects: [
      { deviceId: 'octaves', preset: 'Bass alone' },
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { decay: 4.13, preDelay: 89.7 } },
    ],
  },
  {
    id: 'static-cathedral-growl-in-the-roof',
    name: 'Growl in the roof',
    category: 'pitch',
    description:
      'A low ring modulator that roughens every note to a growl, then a dark fog of slow backwards swells.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Low growl', params: { delay: 12.7, lfoRate: 0.0899 } },
      { deviceId: 'reverse-delay', preset: 'Dark fog', params: { time: 1530 } },
    ],
  },
  {
    id: 'static-cathedral-glass-in-the-nave',
    name: 'Glass in the nave',
    category: 'pitch',
    description:
      'Sharp shards of high grains, then echoes that spiral down, into a medium hall with only a breath of a vowel in its tail.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Glass shards', params: { size: 26.9, density: 12.6 } },
      {
        deviceId: 'freq-shifter',
        preset: 'Falling spiral',
        params: { delay: 258, lfoRate: 0.0439 },
      },
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { decay: 3.55, preDelay: 21.6 } },
    ],
  },
  {
    id: 'static-cathedral-guttering-loop',
    name: 'Guttering loop',
    category: 'pitch',
    description:
      'A tape-style curve only just leaned on, then a tape loop at half speed, an octave down and darker.',
    effects: [
      { deviceId: 'saturator', preset: 'Soft tape warmth' },
      { deviceId: 'tape-loop', preset: 'Slowed down', params: { length: 7.51 } },
    ],
  },
  {
    id: 'static-cathedral-advent-overtone',
    name: 'Advent overtone',
    category: 'master',
    description:
      'An octave-adding soft curve, then a heavy low shelf, then a true-peak ceiling with the level pushed up into it.',
    effects: [
      { deviceId: 'saturator', preset: 'Octave glow' },
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 2.89 } },
      { deviceId: 'ambient-limiter', preset: 'Loud', params: { release: 2.46, gain: -0.63 } },
    ],
  },
  {
    id: 'static-cathedral-sheen-at-evensong',
    name: 'Sheen at evensong',
    category: 'master',
    description:
      'Bright saturation, mixed low, then a parallel compressor, then a true-peak ceiling six decibels down, with room to spare.',
    effects: [
      { deviceId: 'saturator', preset: 'Parallel shine' },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 444, release: 2.63 } },
      { deviceId: 'ambient-limiter', preset: 'Margin', params: { release: 1.54 } },
    ],
  },
  {
    id: 'static-cathedral-midwinter-tape',
    name: 'Midwinter tape',
    category: 'master',
    description:
      'A fresh reel of tape, open on top and nearly steady, then a fast, firm compressor that stops only the peaks, then a pushed limiter.',
    effects: [
      { deviceId: 'patina', preset: 'New tape' },
      { deviceId: 'ambient-comp', preset: 'Peak stop', params: { attack: 10.4, release: 0.192 } },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { outputGain: -8.34 } },
    ],
  },
  {
    id: 'static-cathedral-sheen-in-stone',
    name: 'Sheen in stone',
    category: 'master',
    description:
      'A quiet plate tail that comes in late behind each note, then a low ceiling that keeps loud passages down for a while.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { predelayMs: 96.3 } },
      { deviceId: 'ambient-limiter', preset: 'Late night', params: { release: 3.83 } },
    ],
  },
  {
    id: 'static-cathedral-flagstone-reel',
    name: 'Flagstone reel',
    category: 'master',
    description:
      'A tape reel with soft saturation, slight wobble and hiss, then a fast limiter with the level lifted a little into it.',
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { outputGain: -5.41 } },
    ],
  },
  {
    id: 'static-cathedral-mortar-lift',
    name: 'Mortar lift',
    category: 'master',
    description:
      'A parallel compressor, then the sides lifted a little, wider with nothing added, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Lift' },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Master' },
    ],
  },
  {
    id: 'static-cathedral-chancel-grain',
    name: 'Chancel grain',
    category: 'master',
    description:
      'A grainy early sampler, then a gentle compressor, then a safety limiter with its ceiling brought down a little.',
    effects: [
      { deviceId: 'patina', preset: 'Early sampler' },
      { deviceId: 'ambient-comp', preset: 'Sit back' },
      { deviceId: 'fet-limiter', preset: 'Lower ceiling', params: { outputGain: 2.43 } },
    ],
  },
]
