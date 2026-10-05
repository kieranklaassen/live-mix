// Sunburnt Laptop Guitar: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'laptop-guitar-parasol-ghost',
    name: 'Parasol ghost',
    category: 'space',
    description:
      'A console channel driven until it is firm in the mids, into a dark reverb that rises backwards and leaves a dim tail.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Console' },
      { deviceId: 'shaped-reverb', preset: 'Ghost' },
    ],
  },
  {
    id: 'laptop-guitar-chirp-at-noon',
    name: 'Chirp at noon',
    category: 'space',
    description:
      'A swell that arrives late, so notes seem to play in reverse, into three slack springs where every echo is a long chirp.',
    effects: [
      { deviceId: 'swell', preset: 'Backwards' },
      {
        deviceId: 'spring-reverb',
        preset: 'Slack and strange',
        params: { decay: 3.33, predelay: 32.3 },
      },
    ],
  },
  {
    id: 'laptop-guitar-bleached-cathedral',
    name: 'Bleached cathedral',
    category: 'space',
    description:
      'A console channel driven until it is firm in the mids, into a cathedral with about six seconds of tail.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Console', params: { output: -2.17 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral' },
    ],
  },
  {
    id: 'laptop-guitar-promenade-vault',
    name: 'Promenade vault',
    category: 'space',
    description:
      'The level rising and falling at random, like surf, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'tremolo', preset: 'Sea swell' },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { midDecay: 7.44 } },
    ],
  },
  {
    id: 'laptop-guitar-laptop-halo',
    name: 'Laptop halo',
    category: 'space',
    description:
      "A smooth swell on every note, like a string section's bows, then a short bright haze with an octave above everything.",
    effects: [
      { deviceId: 'swell', preset: 'String section', params: { attack: 357, release: 662 } },
      { deviceId: 'spectral-blur', preset: 'Glass halo' },
    ],
  },
  {
    id: 'laptop-guitar-low-season-haze',
    name: 'Low-season haze',
    category: 'space',
    description:
      'The sides lifted a little, wider with nothing added, then a wide haze of grains that hangs on long after the playing.',
    effects: [
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      {
        deviceId: 'grain-delay',
        preset: 'Frozen haze',
        params: { time: 861, size: 378, mix: 0.336 },
      },
    ],
  },
  {
    id: 'laptop-guitar-awning-choir',
    name: 'Awning choir',
    category: 'space',
    description:
      'A slow swell after each silence, with some dry attack left, into a reverb whose tail climbs an octave on every pass.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1370, release: 309 } },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { decay: 7.06, predelay: 18.7 } },
    ],
  },
  {
    id: 'laptop-guitar-overheated-sky',
    name: 'Overheated sky',
    category: 'space',
    description:
      'A scooped tone with lows and highs up and the body down, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Hollow', params: { clearTime: 1.4 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 9.6, modRate: 0.393 } },
    ],
  },
  {
    id: 'laptop-guitar-sunstruck-cloud',
    name: 'Sunstruck cloud',
    category: 'space',
    description:
      'A tight damped little room that is barely there, then a wide haze of grains that hangs on long after the playing.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Tight room' },
      {
        deviceId: 'grain-delay',
        preset: 'Frozen haze',
        params: { time: 880, size: 419, mix: 0.383 },
      },
    ],
  },
  {
    id: 'laptop-guitar-autosave-hall',
    name: 'Autosave hall',
    category: 'space',
    description:
      'A combo amplifier shut in a cupboard, the mic pulled back, into a wide hall that answers about a fifth of a second late.',
    effects: [
      { deviceId: 're-amp', preset: 'In the cupboard' },
      { deviceId: 'ether-reverb', preset: 'Late hall', params: { predelayMs: 187 } },
    ],
  },
  {
    id: 'laptop-guitar-soundcard-chamber',
    name: 'Soundcard chamber',
    category: 'space',
    description:
      'A console channel run hot with its level pulled back down, into a tight chamber close round the sound for about a second.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Hot channel' },
      { deviceId: 'hall-reverb', preset: 'Tight chamber' },
    ],
  },
  {
    id: 'laptop-guitar-august-echo',
    name: 'August echo',
    category: 'echo',
    description:
      'A backwards echo of each phrase, swelling in and cut off, then a thin, bright haze that hangs high above the sound.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { time: 581 } },
      { deviceId: 'spectral-blur', preset: 'High air' },
    ],
  },
  {
    id: 'laptop-guitar-driftwood-echo',
    name: 'Driftwood echo',
    category: 'echo',
    description:
      'Backwards chunks spliced hard, with no fades between them, then soft repeats an octave up or down, under the dry sound.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Hard splices' },
      { deviceId: 'glitch', preset: 'Octave ghosts', params: { time: 459 } },
    ],
  },
  {
    id: 'laptop-guitar-arcade-swells',
    name: 'Arcade swells',
    category: 'echo',
    description:
      'Backwards swells that climb an octave on every pass, then soft stumbles where a slice repeats, sticks or turns back.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Rising glass' },
      { deviceId: 'glitch', preset: 'Gentle stumble', params: { time: 259 } },
    ],
  },
  {
    id: 'laptop-guitar-quayside-swells',
    name: 'Quayside swells',
    category: 'echo',
    description:
      'Slow backwards swells that rise and die behind the playing, then a diffuse mist where each note hangs on after it is played.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 1780 } },
      { deviceId: 'spectral-blur', preset: 'Hanging mist' },
    ],
  },
  {
    id: 'laptop-guitar-buffered-echo',
    name: 'Buffered echo',
    category: 'echo',
    description:
      'Grain repeats that climb by fifths on every pass, into a hard-driven two-spring tank that answers late and loud.',
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Rising fifths',
        params: { time: 695, size: 161, mix: 0.21 },
      },
      {
        deviceId: 'spring-reverb',
        preset: 'Dub send',
        params: { decay: 3.2, predelay: 53.6, mix: 0.3 },
      },
    ],
  },
  {
    id: 'laptop-guitar-fifths-on-a-postcard',
    name: 'Fifths on a postcard',
    category: 'echo',
    description:
      'Soft clipping, a little bright, laid under the clean sound, then grain repeats that climb by fifths on every pass.',
    effects: [
      { deviceId: 'saturator', preset: 'Drum bus crunch', params: { outputDb: -10.1 } },
      { deviceId: 'grain-delay', preset: 'Rising fifths', params: { time: 608, size: 169 } },
    ],
  },
  {
    id: 'laptop-guitar-trackpad-crystals',
    name: 'Trackpad crystals',
    category: 'echo',
    description:
      'Grain repeats that climb an octave on every pass, then a sharp and a flat copy kept in the centre, thick not wide.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Crystals', params: { time: 359, size: 115 } },
      { deviceId: 'stereo-detune', preset: 'Thickener' },
    ],
  },
  {
    id: 'laptop-guitar-midday-hop',
    name: 'Midday hop',
    category: 'echo',
    description:
      'An echo whose repeats jump up an octave and back, into a dull reverb that swells in over seconds and fades slowly.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Octave hop', params: { time: 375, modRate: 0.536 } },
      { deviceId: 'shaped-reverb', preset: 'Dark swell', params: { time: 3.97 } },
    ],
  },
  {
    id: 'laptop-guitar-low-battery-refrain',
    name: 'Low-battery refrain',
    category: 'echo',
    description:
      'Whole phrases that repeat by chance, each time quieter, into three long springs with all the top taken off.',
    effects: [
      { deviceId: 'glitch', preset: 'Phrase repeats' },
      { deviceId: 'spring-reverb', preset: 'Underwater' },
    ],
  },
  {
    id: 'laptop-guitar-esplanade-shards',
    name: 'Esplanade shards',
    category: 'echo',
    description:
      'A resonant low-pass that swings open about every two seconds, then backwards grains of each phrase, repeating as they fade.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Dub sweep',
        params: { lfoRateHz: 0.459, envAttackMs: 10.8, envReleaseMs: 213 },
      },
      { deviceId: 'grain-delay', preset: 'Backwards shards' },
    ],
  },
  {
    id: 'laptop-guitar-snapshot-repeats',
    name: 'Snapshot repeats',
    category: 'echo',
    description:
      'A bucket-brigade echo whose soft repeats dull as they fade, then a subsonic cut with the low mids and presence eased a touch.',
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo' },
      { deviceId: 'ambient-eq', preset: 'Drone' },
    ],
  },
  {
    id: 'laptop-guitar-jetty-glass',
    name: 'Jetty glass',
    category: 'echo',
    description:
      'An amplifier stack turned all the way up, then backwards swells that climb an octave on every pass.',
    effects: [
      { deviceId: 're-amp', preset: 'Stack flat out', params: { output: -2.25 } },
      { deviceId: 'reverse-delay', preset: 'Rising glass', params: { time: 793 } },
    ],
  },
  {
    id: 'laptop-guitar-siesta-echo',
    name: 'Siesta echo',
    category: 'echo',
    description:
      'A lopsided soft curve that adds the octave above each note, then grain repeats that climb an octave on every pass, into a mid-sized hall.',
    effects: [
      { deviceId: 'saturator', preset: 'Octave glow' },
      { deviceId: 'grain-delay', preset: 'Crystals', params: { time: 357, size: 133 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Hall',
        params: { preDelay: 61.5, lowDecay: 2.75, midDecay: 2.26 },
      },
    ],
  },
  {
    id: 'laptop-guitar-postcard-fuzz',
    name: 'Postcard fuzz',
    category: 'tape',
    description:
      'A transformer overloaded into a thick, loose fuzz, then scattered short grains an octave up, falling like rain.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron melt' },
      { deviceId: 'grain-cloud', preset: 'Octave rain' },
    ],
  },
  {
    id: 'laptop-guitar-pixelated-grit',
    name: 'Pixelated grit',
    category: 'tape',
    description:
      'Thin pentode grit mixed in under the clean sound, then grains fed back an octave up, climbing higher each pass.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Parallel grit' },
      { deviceId: 'grain-cloud', preset: 'Rising shimmer', params: { size: 380, density: 10.7 } },
    ],
  },
  {
    id: 'laptop-guitar-rooftop-valve',
    name: 'Rooftop valve',
    category: 'tape',
    description:
      'A valve preamp curve, lopsided and a little brighter on top, then a very wide wash in which every note hangs for many seconds.',
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { outputDb: -14.1 } },
      { deviceId: 'spectral-blur', preset: 'Endless' },
    ],
  },
  {
    id: 'laptop-guitar-windbreak-fuzz',
    name: 'Windbreak fuzz',
    category: 'tape',
    description:
      'A bright, buzzing fuzz from a hard clipper driven flat, then tiny hard-edged grains an octave up, scattered in pitch.',
    effects: [
      { deviceId: 'saturator', preset: 'Fuzz pedal' },
      { deviceId: 'grain-cloud', preset: 'Glass shards' },
    ],
  },
  {
    id: 'laptop-guitar-buzz-in-deckchairs',
    name: 'Buzz in deckchairs',
    category: 'tape',
    description:
      'A bright, buzzing fuzz from a hard clipper driven flat, then a wide cloud whose grains jump by fifths and octaves.',
    effects: [
      { deviceId: 'saturator', preset: 'Fuzz pedal' },
      { deviceId: 'grain-cloud', preset: 'Choir of fifths' },
    ],
  },
  {
    id: 'laptop-guitar-crackling-grit',
    name: 'Crackling grit',
    category: 'tape',
    description:
      'A bed of six-bit grit and false tones under the clean sound, then a driven combo amplifier with its hiss and hum right up.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Grit bed' },
      { deviceId: 're-amp', preset: 'Noisy valves' },
    ],
  },
  {
    id: 'laptop-guitar-grit-gone-pink',
    name: 'Grit gone pink',
    category: 'tape',
    description:
      'Four-bit companded converters that rasp on every note, then a lean pentode valve stage with a bite on every attack.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Rasp' },
      { deviceId: 'analog-drive', preset: 'Bite', params: { output: -3.58 } },
    ],
  },
  {
    id: 'laptop-guitar-glass-in-salt-air',
    name: 'Glass in salt air',
    category: 'tape',
    description:
      'A thin audio stream that swirls and warbles a little, then a small, boxy radio speaker, close by in a small room.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Behind glass' },
      { deviceId: 're-amp', preset: 'Bedside radio', params: { output: -2.33 } },
    ],
  },
  {
    id: 'laptop-guitar-heat-haze-gaps',
    name: 'Heat-haze gaps',
    category: 'tape',
    description:
      'A stream losing packets, soft holes of silence in the sound, then a lean pentode valve stage with a bite on every attack.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Dropouts' },
      { deviceId: 'analog-drive', preset: 'Bite', params: { output: -3.06 } },
    ],
  },
  {
    id: 'laptop-guitar-overexposed-bits',
    name: 'Overexposed bits',
    category: 'tape',
    description:
      'Eight-bit companded converters with false tones folded in, then two copies far out of tune that sway like a worn tape.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Toy' },
      { deviceId: 'stereo-detune', preset: 'Seasick', params: { delay: 26.2 } },
    ],
  },
  {
    id: 'laptop-guitar-borrowed-air',
    name: 'Borrowed air',
    category: 'tape',
    description:
      'A fast backwards loop, then the thrown-away part of a stream, thin, with a short wash, into a far-off plate haze.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Fast reverse' },
      { deviceId: 'low-bitrate', preset: 'Thin air' },
      { deviceId: 'plate-reverb', preset: 'Distant haze' },
    ],
  },
  {
    id: 'laptop-guitar-peeling-fizz',
    name: 'Peeling fizz',
    category: 'tape',
    description:
      'A valve driven all the way into a bright, buzzing fuzz, then a stream starved and scrambled until every note fizzes.',
    effects: [
      { deviceId: 'patina', preset: 'Valve fuzz' },
      { deviceId: 'low-bitrate', preset: 'Fizzing phases' },
    ],
  },
  {
    id: 'laptop-guitar-chirps-on-a-postcard',
    name: 'Chirps on a postcard',
    category: 'tape',
    description:
      'A short loop run backwards at double speed, an octave up, then nine-bit converters on an unsteady clock, hiss on high notes.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Fast reverse', params: { length: 0.571 } },
      { deviceId: 'vintage-digital', preset: 'Worn' },
    ],
  },
  {
    id: 'laptop-guitar-remembered-shortwave',
    name: 'Remembered shortwave',
    category: 'tape',
    description:
      'A shortwave station crowded by whistles, buzz and data tones, then radio static that sounds only with each note played.',
    effects: [
      { deviceId: 'radio', preset: 'Crowded band' },
      { deviceId: 'noise-floor', preset: 'Static notes' },
    ],
  },
  {
    id: 'laptop-guitar-mixdown-bits',
    name: 'Mixdown bits',
    category: 'tape',
    description:
      'A tape preamp pushed just enough to add weight, then raw converters at a very low rate, bright and clanging.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue', params: { output: -4.58 } },
      { deviceId: 'vintage-digital', preset: 'Clang' },
    ],
  },
  {
    id: 'laptop-guitar-poolside-stream',
    name: 'Poolside stream',
    category: 'tape',
    description:
      'A starved stream in long frames, watery, its top cut away, into a large hall heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Underwater' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Full wet send',
        params: { decay: 7.04, breathRate: 0.27 },
      },
    ],
  },
  {
    id: 'laptop-guitar-bits-on-battery',
    name: 'Bits on battery',
    category: 'tape',
    description:
      'A bright, lean console channel driven for an edge on top, then seven-bit converters, into a small damped room that is over within a second.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Sheen' },
      { deviceId: 'vintage-digital', preset: 'Coarse' },
      { deviceId: 'ether-reverb', preset: 'Room', params: { predelayMs: 8.9 } },
    ],
  },
  {
    id: 'laptop-guitar-boardwalk-bits',
    name: 'Boardwalk bits',
    category: 'tape',
    description:
      'A brightish valve curve, then a coarse early sampler, gritty, with bright hash on top, into a trace of room around the sound.',
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp' },
      { deviceId: 'patina', preset: 'Eight bit', params: { output: -3 } },
      { deviceId: 'ether-reverb', preset: 'Faint air' },
    ],
  },
  {
    id: 'laptop-guitar-esplanade-sideband',
    name: 'Esplanade sideband',
    category: 'tape',
    description:
      'A well-tuned sideband signal, steady, full-band and mono, into a single dull spring in the centre that is barely heard.',
    effects: [
      { deviceId: 'radio', preset: 'Clear sideband' },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { decay: 1.77 } },
    ],
  },
  {
    id: 'laptop-guitar-pillow-at-noon',
    name: 'Pillow at noon',
    category: 'tape',
    description:
      'A heavy low shelf that puts weight under the sound, then a small speaker, close and muffled, as if under a pillow.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Deep', params: { clearTime: 2.64 } },
      { deviceId: 're-amp', preset: 'Pillow speaker' },
    ],
  },
  {
    id: 'laptop-guitar-overexposed-buzz',
    name: 'Overexposed buzz',
    category: 'tape',
    description:
      'A lift of presence and air, then a stream that keeps sticking on long, buzzing held loops, then echoes souring apart.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Bright' },
      { deviceId: 'low-bitrate', preset: 'Stuck stream' },
      { deviceId: 'freq-shifter', preset: 'Parting echo' },
    ],
  },
  {
    id: 'laptop-guitar-patched-tape',
    name: 'Patched tape',
    category: 'tape',
    description:
      'A tape-style curve that rounds the peaks and dulls the top, then the soft air of an open microphone under the sound.',
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { outputDb: -11.2 } },
      { deviceId: 'noise-floor', preset: 'Close mic', params: { response: 0.433, hold: 9.98 } },
    ],
  },
  {
    id: 'laptop-guitar-rendered-toy',
    name: 'Rendered toy',
    category: 'tape',
    description:
      'Eight-bit companded converters with false tones folded in, into a thin bright tail with all its lows cut away.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Toy' },
      { deviceId: 'expanse', preset: 'Thin air', params: { decay: 12.2, modRate: 0.181 } },
    ],
  },
  {
    id: 'laptop-guitar-bounced-clang',
    name: 'Bounced clang',
    category: 'tape',
    description:
      'A thin band of tone with the lows cut and the top rolled off, then raw converters at a very low rate, bright and clanging.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Thin', params: { clearTime: 1.42 } },
      { deviceId: 'vintage-digital', preset: 'Clang' },
    ],
  },
  {
    id: 'laptop-guitar-bedroom-scream',
    name: 'Bedroom scream',
    category: 'motion',
    description:
      'An overdriven low-pass at full resonance with a fast wobble, then echoes that sink a few hertz flatter on every repeat.',
    effects: [
      { deviceId: 'auto-filter', preset: 'Screaming' },
      {
        deviceId: 'freq-shifter',
        preset: 'Falling spiral',
        params: { delay: 271, lfoRate: 0.0493, mix: 0.344 },
      },
    ],
  },
  {
    id: 'laptop-guitar-patched-chorus',
    name: 'Patched chorus',
    category: 'motion',
    description:
      'A transformer that fills out the lows and dulls the top, then a three-voice chorus that leaves the lows dry and steady.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Low warmth', params: { output: -1.72 } },
      { deviceId: 'chorus', preset: 'Guitar shimmer', params: { rate: 1.33, delayMs: 13 } },
    ],
  },
  {
    id: 'laptop-guitar-tilt-off-the-lid',
    name: 'Tilt off the lid',
    category: 'motion',
    description:
      "A hint of a wavefolder's glassy edge under the clean sound, then the tone rocking slowly from dark to bright, sides opposed.",
    effects: [
      { deviceId: 'saturator', preset: 'Folded glass', params: { outputDb: -5.5 } },
      { deviceId: 'tremolo', preset: 'Tilting tone', params: { rate: 0.293 } },
    ],
  },
  {
    id: 'laptop-guitar-parasol-beat',
    name: 'Parasol beat',
    category: 'motion',
    description:
      'A steady beat about twice a second, crossing side to side, into a quick bright twang of springs behind each attack.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Moving beat' },
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { decay: 0.701 } },
    ],
  },
  {
    id: 'laptop-guitar-dune-filter',
    name: 'Dune filter',
    category: 'motion',
    description:
      'A combo amplifier driven hard, miked right on the cone, then a touch wah, into an undamped hall with about three seconds of tail.',
    effects: [
      { deviceId: 're-amp', preset: 'Speaker on the edge' },
      {
        deviceId: 'auto-filter',
        preset: 'Touch wah',
        params: { lfoRateHz: 1.08, envAttackMs: 4.19, envReleaseMs: 122 },
      },
      { deviceId: 'fdn-reverb', preset: 'Bright air', params: { decay: 2.92, breathRate: 0.264 } },
    ],
  },
  {
    id: 'laptop-guitar-bedroom-pulse',
    name: 'Bedroom pulse',
    category: 'motion',
    description:
      'An echo of single grains with gaps, so the repeats pulse, into a bright spring splash that lands a moment after the note.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Pulsing repeat', params: { mix: 0.309 } },
      {
        deviceId: 'spring-reverb',
        preset: 'Late splash',
        params: { decay: 1.06, predelay: 190, mix: 0.21 },
      },
    ],
  },
  {
    id: 'laptop-guitar-splinters-in-glitter',
    name: 'Splinters in glitter',
    category: 'texture',
    description:
      'Thin pentode grit mixed in under the clean sound, then sharp shards of high grains, into a small tank that goes on ringing for seconds.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Parallel grit' },
      { deviceId: 'grain-cloud', preset: 'Glass shards', params: { size: 28.7, density: 12.9 } },
      { deviceId: 'fdn-reverb', preset: 'Small bright tank' },
    ],
  },
  {
    id: 'laptop-guitar-balcony-rumble',
    name: 'Balcony rumble',
    category: 'texture',
    description:
      'A tape preamp overloaded until it breaks up, dull and thick, then a low blurred bed, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Worn tape', params: { output: -12.5 } },
      { deviceId: 'spectral-blur', preset: 'Sub bed' },
      { deviceId: 'plate-reverb', preset: 'Long plate' },
    ],
  },
  {
    id: 'laptop-guitar-arcade-cloud',
    name: 'Arcade cloud',
    category: 'texture',
    description:
      'A transformer overloaded into a thick, loose fuzz, then a bright octave-up cloud, into a hall whose lows outlast its damped top.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron melt', params: { output: -10.9 } },
      { deviceId: 'spectral-blur', preset: 'Bright octave cloud' },
      {
        deviceId: 'hall-reverb',
        preset: 'Dark hall',
        params: { preDelay: 55.4, lowDecay: 4.49, midDecay: 3.03 },
      },
    ],
  },
  {
    id: 'laptop-guitar-peeling-cascade',
    name: 'Peeling cascade',
    category: 'texture',
    description:
      'A wavefolder at full drive, then slow swelling octave loops, into a long undamped tail kept low behind the sound.',
    effects: [
      { deviceId: 'saturator', preset: 'Blown speaker' },
      { deviceId: 'cascade', preset: 'Slow tiles', params: { time: 1200 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  {
    id: 'laptop-guitar-screen-lit-halo',
    name: 'Screen-lit halo',
    category: 'texture',
    description:
      'A bright wavefolder, then a short bright haze with an octave above everything, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'saturator', preset: 'Wavefold lead', params: { outputDb: -14.6 } },
      { deviceId: 'spectral-blur', preset: 'Glass halo' },
      {
        deviceId: 'hall-reverb',
        preset: 'Faint halo',
        params: { preDelay: 37.9, lowDecay: 2.64, midDecay: 2.96 },
      },
    ],
  },
  {
    id: 'laptop-guitar-lifeguard-clatter',
    name: 'Lifeguard clatter',
    category: 'texture',
    description:
      'An overloaded console, then a rattle of restruck notes, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Crushed', params: { output: -7.79 } },
      { deviceId: 'cascade', preset: 'Dropped marbles' },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { predelayMs: 37.1 } },
    ],
  },
  {
    id: 'laptop-guitar-ball-on-shingle',
    name: 'Ball on shingle',
    category: 'texture',
    description:
      'Slices that repeat faster and faster like a dropped ball, then eight-bit companded converters with false tones folded in.',
    effects: [
      { deviceId: 'glitch', preset: 'Bouncing' },
      { deviceId: 'vintage-digital', preset: 'Toy' },
    ],
  },
  {
    id: 'laptop-guitar-tramline-jam',
    name: 'Tramline jam',
    category: 'texture',
    description:
      'A sound that keeps getting stuck and repeating a slice, then a stream starved and scrambled until every note fizzes.',
    effects: [
      { deviceId: 'glitch', preset: 'Stuck', params: { time: 168 } },
      { deviceId: 'low-bitrate', preset: 'Fizzing phases' },
    ],
  },
  {
    id: 'laptop-guitar-sunburnt-shards',
    name: 'Sunburnt shards',
    category: 'texture',
    description:
      'Hard-cut splinters of sound, some an octave off, flung wide, then old converters with no output filter, a glassy ring on top.',
    effects: [
      { deviceId: 'glitch', preset: 'Shards', params: { time: 48.8 } },
      { deviceId: 'vintage-digital', preset: 'Glassy' },
    ],
  },
  {
    id: 'laptop-guitar-courtyard-octaves',
    name: 'Courtyard octaves',
    category: 'texture',
    description:
      'Stuttered fragments that flicker an octave up and down, then old converters with no output filter, a glassy ring on top.',
    effects: [
      { deviceId: 'glitch', preset: 'Flickering octaves' },
      { deviceId: 'vintage-digital', preset: 'Glassy' },
    ],
  },
  {
    id: 'laptop-guitar-courtyard-shards',
    name: 'Courtyard shards',
    category: 'texture',
    description:
      'Hard-cut splinters of sound, some an octave off, flung wide, then a starved stream in short frames, rough around each attack.',
    effects: [
      { deviceId: 'glitch', preset: 'Shards', params: { time: 41 } },
      { deviceId: 'low-bitrate', preset: 'Gritty attacks' },
    ],
  },
  {
    id: 'laptop-guitar-organ-on-hot-tiles',
    name: 'Organ on hot tiles',
    category: 'texture',
    description:
      'A short, rounding swell, then faint grains stacked above, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack' },
      { deviceId: 'spectral-drifter', preset: 'Organ stack' },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'laptop-guitar-low-season-bow',
    name: 'Low-season bow',
    category: 'texture',
    description:
      'A bowed swell at half strength under the dry attacks, into a far-miked room laid in under the clean sound.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed', params: { attack: 271, release: 149 } },
      { deviceId: 're-amp', preset: 'Room underneath' },
    ],
  },
  {
    id: 'laptop-guitar-deckchair-sustain',
    name: 'Deckchair sustain',
    category: 'texture',
    description:
      'A held pad alone, in place of the sound that was played, into a clean speaker at the far end of a big, live room.',
    effects: [
      { deviceId: 'sustainer', preset: 'Held sound alone' },
      { deviceId: 're-amp', preset: 'Far end of the hall' },
    ],
  },
  {
    id: 'laptop-guitar-octave-up-sparks',
    name: 'Octave-up sparks',
    category: 'texture',
    description:
      'A compressor as slow as a hand on a fader, then grains two octaves up, into a long undamped tail kept low behind the sound.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Slow fader', params: { makeup: 0.417 } },
      { deviceId: 'grain-delay', preset: 'High glitter', params: { time: 315, size: 42.3 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail', params: { predelayMs: 28.4 } },
    ],
  },
  {
    id: 'laptop-guitar-after-dark-undertow',
    name: 'After-dark undertow',
    category: 'texture',
    description:
      'A bright, lean console channel driven for an edge on top, then soft smeared repeats and reversals under the dry sound.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Sheen' },
      { deviceId: 'glitch', preset: 'Smears underneath' },
    ],
  },
  {
    id: 'laptop-guitar-glints-an-octave-up',
    name: 'Glints an octave up',
    category: 'texture',
    description:
      'A dull hard clipper with no oversampling, so it aliases, then faint grains an octave and a fifth up, behind the playing.',
    effects: [
      { deviceId: 'saturator', preset: 'Lo-fi' },
      { deviceId: 'grain-delay', preset: 'Faint glints', params: { mix: 0.084 } },
    ],
  },
  {
    id: 'laptop-guitar-terrace-rasp',
    name: 'Terrace rasp',
    category: 'texture',
    description:
      'Driven amplifier valves heard through a flat speaker, then tiny hard grains so close together that the sound buzzes.',
    effects: [
      { deviceId: 're-amp', preset: 'Just the valves' },
      { deviceId: 'grain-cloud', preset: 'Grain buzz' },
    ],
  },
  {
    id: 'laptop-guitar-holiday-ghosts',
    name: 'Holiday ghosts',
    category: 'texture',
    description:
      'Soft repeats an octave up or down, under the dry sound, then a gentle low-pass at a kilohertz.',
    effects: [
      { deviceId: 'glitch', preset: 'Octave ghosts' },
      {
        deviceId: 'auto-filter',
        preset: 'Init',
        params: { lfoRateHz: 0.903, envAttackMs: 10.1, envReleaseMs: 201 },
      },
    ],
  },
  {
    id: 'laptop-guitar-arpeggio-on-battery',
    name: 'Arpeggio on battery',
    category: 'texture',
    description:
      'Each note replayed as an arpeggio of octaves and fifths, then a honky horn loudspeaker heard from far across a big room.',
    effects: [
      { deviceId: 'cascade', preset: 'Rising steps', params: { time: 263 } },
      { deviceId: 're-amp', preset: 'Station platform', params: { output: 6.38 } },
    ],
  },
  {
    id: 'laptop-guitar-octaves-in-salt-air',
    name: 'Octaves in salt air',
    category: 'texture',
    description:
      'Stuttered fragments that flicker an octave up and down, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'glitch', preset: 'Flickering octaves', params: { time: 109 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 43.6 } },
    ],
  },
  {
    id: 'laptop-guitar-octave-up-shimmer',
    name: 'Octave-up shimmer',
    category: 'texture',
    description:
      'Grains fed back an octave up, climbing higher each pass, into a dull mono tunnel with a tail of several seconds.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Rising shimmer' },
      { deviceId: 'expanse', preset: 'Narrow tunnel' },
    ],
  },
  {
    id: 'laptop-guitar-noon-stack',
    name: 'Noon stack',
    category: 'texture',
    description:
      'A fast reel with no hiss, driven hard so peaks are squashed, then loops of each note played backwards at stacked octaves.',
    effects: [
      { deviceId: 'tape', preset: 'Hot glue' },
      { deviceId: 'cascade', preset: 'Backwards stack' },
    ],
  },
  {
    id: 'laptop-guitar-spiral-by-the-water',
    name: 'Spiral by the water',
    category: 'texture',
    description:
      'Grains fed back an octave up, climbing higher each pass, then a tape reel with soft saturation, slight wobble and hiss.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Rising shimmer', params: { size: 370, density: 11.2 } },
      { deviceId: 'patina', preset: 'Quarter inch reel' },
    ],
  },
  {
    id: 'laptop-guitar-line-in-spiral',
    name: 'Line-in spiral',
    category: 'texture',
    description:
      'Grains fed back a fourth down, sinking lower each pass, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Sinking spiral' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 39 } },
    ],
  },
  {
    id: 'laptop-guitar-jittery-rain',
    name: 'Jittery rain',
    category: 'texture',
    description:
      'A fast glittering stutter of plucked octaves over each note, into a hall heard from far off with little dry sound left.',
    effects: [
      { deviceId: 'cascade', preset: 'Glass rain', params: { time: 152 } },
      {
        deviceId: 'hall-reverb',
        preset: 'Far away',
        params: { preDelay: 22.2, lowDecay: 4.53, midDecay: 4.24 },
      },
    ],
  },
  {
    id: 'laptop-guitar-grains-on-battery',
    name: 'Grains on battery',
    category: 'texture',
    description:
      'A scattered cloud of short grains behind the playing, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Grain cloud', params: { mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { predelayMs: 44.8, mix: 0.24 } },
    ],
  },
  {
    id: 'laptop-guitar-octave-up-stack',
    name: 'Octave-up stack',
    category: 'pitch',
    description:
      'Little loops of each note stacked one and two octaves up, into a long undamped tail kept low behind the sound.',
    effects: [
      { deviceId: 'cascade', preset: 'Octave stack', params: { time: 389 } },
      { deviceId: 'ether-reverb', preset: 'Shining tail' },
    ],
  },
  {
    id: 'laptop-guitar-poolside-glitter',
    name: 'Poolside glitter',
    category: 'pitch',
    description:
      'Sparse short grains two octaves up, after each note, into an undamped hall of about three seconds with light lows.',
    effects: [
      { deviceId: 'grain-delay', preset: 'High glitter' },
      {
        deviceId: 'hall-reverb',
        preset: 'Bright hall',
        params: { preDelay: 38.1, lowDecay: 2.07, midDecay: 2.77 },
      },
    ],
  },
  {
    id: 'laptop-guitar-blistered-spiral',
    name: 'Blistered spiral',
    category: 'pitch',
    description:
      'Grains fed back an octave up, climbing higher each pass, into a hall whose top rings on while its lows stop short.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Rising shimmer', params: { size: 388, density: 9.17 } },
      { deviceId: 'hall-reverb', preset: 'Airy tail' },
    ],
  },
  {
    id: 'laptop-guitar-pier-end-spiral',
    name: 'Pier-end spiral',
    category: 'pitch',
    description:
      'Grains fed back an octave up, climbing higher each pass, into a vast nave that rings for about eight seconds.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Rising shimmer', params: { size: 363, density: 9.24 } },
      { deviceId: 'hall-reverb', preset: 'Vast nave', params: { midDecay: 7.61 } },
    ],
  },
  {
    id: 'laptop-guitar-desktop-wash',
    name: 'Desktop wash',
    category: 'pitch',
    description:
      'A soft wash of octave and fifth loops over each note, then piled-up held chords, every overtone drifting, spread wide.',
    effects: [
      { deviceId: 'cascade', preset: 'Sparkle bed', params: { time: 303 } },
      { deviceId: 'sustainer', preset: 'Shimmer cloud', params: { attack: 0.886, glide: 0.907 } },
    ],
  },
  {
    id: 'laptop-guitar-bleached-octaves',
    name: 'Bleached octaves',
    category: 'pitch',
    description:
      'A dark fuzz from a triode pushed far past its limit, then stuttered fragments that flicker an octave up and down.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Dark fuzz' },
      { deviceId: 'glitch', preset: 'Flickering octaves', params: { time: 113 } },
    ],
  },
  {
    id: 'laptop-guitar-salted-treble',
    name: 'Salted treble',
    category: 'pitch',
    description:
      'The octave above alone, every note of a chord moved up, then grains thrown up to an octave out of tune either way.',
    effects: [
      { deviceId: 'octaves', preset: 'High voice alone' },
      { deviceId: 'grain-delay', preset: 'Scattered pitches' },
    ],
  },
  {
    id: 'laptop-guitar-grains-bleached-out',
    name: 'Grains bleached out',
    category: 'pitch',
    description:
      'Faint reversed grains that glide up an octave within seconds, then two copies fed back into a small blur round the upper notes.',
    effects: [
      { deviceId: 'spectral-drifter', preset: 'Rising glide' },
      { deviceId: 'stereo-detune', preset: 'Cloud' },
    ],
  },
  {
    id: 'laptop-guitar-salted-glass',
    name: 'Salted glass',
    category: 'pitch',
    description:
      'A volume-pedal swell, then short backwards chunks that climb by octaves and splinter, into a deep dark well of slow blurred echoes.',
    effects: [
      { deviceId: 'swell', preset: 'Volume pedal', params: { attack: 230, release: 168 } },
      { deviceId: 'reverse-delay', preset: 'Glass splinters' },
      { deviceId: 'swarm-reverb', preset: 'Dark well' },
    ],
  },
  {
    id: 'laptop-guitar-glittering-shimmer',
    name: 'Glittering shimmer',
    category: 'pitch',
    description:
      'Faint reversed grains that climb quickly towards the octave, into a hall whose tail sways in pitch with a trace of the octave.',
    effects: [
      { deviceId: 'spectral-drifter', preset: 'Shimmer', params: { decay: 3.05 } },
      { deviceId: 'shimmer', preset: 'Swaying hall', params: { decay: 4.29, predelay: 18.7 } },
    ],
  },
  {
    id: 'laptop-guitar-pixel-echo',
    name: 'Pixel echo',
    category: 'pitch',
    description:
      'Grain repeats that sink by fourths on every pass, then a plain echo that is a little darker on each repeat, into a big muffled cave.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling fourths', params: { time: 533, size: 185 } },
      { deviceId: 'echo-memory', preset: 'Plain echo' },
      { deviceId: 'fdn-reverb', preset: 'Dark cave', params: { decay: 5.98, breathRate: 0.274 } },
    ],
  },
  {
    id: 'laptop-guitar-unsaved-shimmer',
    name: 'Unsaved shimmer',
    category: 'pitch',
    description:
      'A swell that takes about four seconds to open after silence, then grains fed back an octave up, climbing higher each pass.',
    effects: [
      { deviceId: 'swell', preset: 'Glacier', params: { attack: 4100 } },
      { deviceId: 'grain-cloud', preset: 'Rising shimmer', params: { size: 348, density: 10.2 } },
    ],
  },
  {
    id: 'laptop-guitar-metal-bleached-out',
    name: 'Metal bleached out',
    category: 'pitch',
    description:
      'A large upward shift that turns notes to clanging metal, into a faint hall tail of about three seconds.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Bell metal' },
      {
        deviceId: 'hall-reverb',
        preset: 'Faint halo',
        params: { preDelay: 40.7, lowDecay: 2.81, midDecay: 2.91 },
      },
    ],
  },
  {
    id: 'laptop-guitar-bounced-overtone',
    name: 'Bounced overtone',
    category: 'master',
    description:
      'An octave-adding soft curve, then a scooped, hollow tone, then a true-peak ceiling with the level pushed up into it.',
    effects: [
      { deviceId: 'saturator', preset: 'Octave glow' },
      { deviceId: 'ambient-eq', preset: 'Hollow' },
      { deviceId: 'ambient-limiter', preset: 'Loud', params: { release: 2.73, gain: 2.45 } },
    ],
  },
  {
    id: 'laptop-guitar-glue-in-heat-haze',
    name: 'Glue in heat haze',
    category: 'master',
    description:
      'A low cut with some air, then a swell-holding compressor, then a fast limiter with the level lifted a little into it.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Texture', params: { clearTime: 1.55 } },
      { deviceId: 'ambient-comp', preset: 'Hold swells' },
      { deviceId: 'fet-limiter', preset: 'Gentle lift', params: { outputGain: -4.35 } },
    ],
  },
  {
    id: 'laptop-guitar-desktop-glue',
    name: 'Desktop glue',
    category: 'master',
    description:
      'A little soft saturation, then a fast, firm compressor that stops only the peaks, then a ceiling with a wide margin.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue' },
      { deviceId: 'ambient-comp', preset: 'Peak stop', params: { attack: 10.1, release: 0.184 } },
      { deviceId: 'ambient-limiter', preset: 'Margin', params: { release: 1.58, gain: -3.92 } },
    ],
  },
  {
    id: 'laptop-guitar-boardwalk-sheen',
    name: 'Boardwalk sheen',
    category: 'master',
    description:
      'A quiet plate tail that comes in late behind each note, then a safety limiter with its ceiling brought down a little.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { predelayMs: 81.9 } },
      { deviceId: 'fet-limiter', preset: 'Lower ceiling', params: { outputGain: 1.18 } },
    ],
  },
  {
    id: 'laptop-guitar-room-in-the-glare',
    name: 'Room in the glare',
    category: 'master',
    description:
      'A small room that is over in about a second, then a true-peak ceiling with the level eased back before it.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Room' },
      { deviceId: 'ambient-limiter', preset: 'Pull back', params: { release: 1.42, gain: -0.443 } },
    ],
  },
  {
    id: 'laptop-guitar-overexposed-lift',
    name: 'Overexposed lift',
    category: 'master',
    description:
      'A scooped, hollow tone, then a parallel compressor, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Hollow', params: { clearTime: 1.56 } },
      { deviceId: 'ambient-comp', preset: 'Lift', params: { attack: 359, release: 3.04 } },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.55, gain: 2.37 } },
    ],
  },
]
