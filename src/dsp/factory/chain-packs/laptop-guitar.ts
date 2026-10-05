// Sunburnt Laptop Guitar: the pack's hundred effect chains. Drawn by the bench (./bench)
// from the pack's palette, brought to level and measured on three dry
// sounds; nobody has heard them. A chain that has shipped keeps its id, its
// name and every value (./__tests__/shipped).

import { type FactoryChain } from '../types'

export const CHAINS: readonly FactoryChain[] = [
  {
    id: 'laptop-guitar-lido-rise',
    name: 'Lido rise',
    category: 'space',
    description:
      'A console channel driven until it is firm in the mids, into a reverb that rises backwards for about four seconds.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Console' },
      { deviceId: 'shaped-reverb', preset: 'Long rise' },
    ],
  },
  {
    id: 'laptop-guitar-esplanade-hall',
    name: 'Esplanade hall',
    category: 'space',
    description:
      'A swell that fades every note in like a bow stroke, into a wide open space with a slowly wavering tail.',
    effects: [
      { deviceId: 'swell', preset: 'Bowed', params: { attack: 435, release: 156 } },
      { deviceId: 'expanse', preset: 'Open space' },
    ],
  },
  {
    id: 'laptop-guitar-holiday-bloom',
    name: 'Holiday bloom',
    category: 'space',
    description:
      'A thick double made of slightly detuned grains, into a cloud of reverb that swells in after each note and fades.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Thick double' },
      { deviceId: 'shaped-reverb', preset: 'Bloom', params: { time: 2.64 } },
    ],
  },
  {
    id: 'laptop-guitar-pier-end-coil',
    name: 'Pier-end coil',
    category: 'space',
    description:
      'A tight damped little room that is barely there, into one slack spring in the centre whose echoes chirp brightly.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Tight room' },
      { deviceId: 'spring-reverb', preset: 'Single slack coil' },
    ],
  },
  {
    id: 'laptop-guitar-remembered-chamber',
    name: 'Remembered chamber',
    category: 'space',
    description:
      'A valve preamp curve, lopsided and a little brighter on top, into a bright chamber that rings for a couple of seconds.',
    effects: [
      { deviceId: 'saturator', preset: 'Tube preamp', params: { outputDb: -10.1 } },
      { deviceId: 'expanse', preset: 'Bright chamber' },
    ],
  },
  {
    id: 'laptop-guitar-low-battery-haze',
    name: 'Low-battery haze',
    category: 'space',
    description:
      'A bowed swell at half strength under the dry attacks, then a short bright haze with an octave above everything.',
    effects: [
      { deviceId: 'swell', preset: 'Half bowed' },
      { deviceId: 'spectral-blur', preset: 'Glass halo' },
    ],
  },
  {
    id: 'laptop-guitar-august-hall',
    name: 'August hall',
    category: 'space',
    description:
      'A detuned double made of grains, spread to the sides, into a hall heard from far off with little dry sound left.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Detuned double' },
      { deviceId: 'hall-reverb', preset: 'Far away', params: { preDelay: 20.3, midDecay: 4.42 } },
    ],
  },
  {
    id: 'laptop-guitar-bounced-tank',
    name: 'Bounced tank',
    category: 'space',
    description:
      'A short swell that rounds the front off every note, into three springs heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'swell', preset: 'Slow attack', params: { attack: 144, release: 83.8 } },
      { deviceId: 'spring-reverb', preset: 'Tank alone', params: { decay: 3.05 } },
    ],
  },
  {
    id: 'laptop-guitar-tail-down-the-line',
    name: 'Tail down the line',
    category: 'space',
    description:
      'A dark hall that takes about twenty seconds to die away, then a well-tuned sideband signal, steady, full-band and mono.',
    effects: [
      {
        deviceId: 'fdn-reverb',
        preset: 'Endless tail',
        params: { decay: 19.7, breathRate: 0.0721 },
      },
      { deviceId: 'radio', preset: 'Clear sideband' },
    ],
  },
  {
    id: 'laptop-guitar-swell-bleached-out',
    name: 'Swell bleached out',
    category: 'space',
    description:
      'A scooped, hollow tone, then a small room that casts a shadow an octave below, into a long tail that wavers in pitch like an unsteady choir.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Hollow' },
      { deviceId: 'shimmer', preset: 'Low shadow', params: { decay: 2.09, predelay: 21.9 } },
      { deviceId: 'expanse', preset: 'Seasick choir', params: { decay: 17.7, modRate: 1.63 } },
    ],
  },
  {
    id: 'laptop-guitar-jetty-hall',
    name: 'Jetty hall',
    category: 'space',
    description:
      'A faint hall tail of about three seconds, then a resonant upper-mid peak that rises when played hard.',
    effects: [
      { deviceId: 'hall-reverb', preset: 'Faint halo' },
      { deviceId: 'auto-filter', preset: 'Resonant peak' },
    ],
  },
  {
    id: 'laptop-guitar-glass-at-noon',
    name: 'Glass at noon',
    category: 'echo',
    description:
      'Backwards swells that climb an octave on every pass, then a faint haze just behind the dry sound.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Rising glass', params: { time: 823 } },
      { deviceId: 'spectral-blur', preset: 'Faint haze' },
    ],
  },
  {
    id: 'laptop-guitar-siesta-mirror',
    name: 'Siesta mirror',
    category: 'echo',
    description:
      'Each phrase answered once by itself played backwards, then every slice of the sound turned round and played backwards.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Phrase and mirror', params: { time: 2900 } },
      { deviceId: 'glitch', preset: 'All backwards' },
    ],
  },
  {
    id: 'laptop-guitar-arcade-shards',
    name: 'Arcade shards',
    category: 'echo',
    description:
      'Backwards grains of each phrase, repeating as they fade, then a cloud of backwards grains close behind the playing.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Backwards shards' },
      { deviceId: 'grain-cloud', preset: 'Backwards room', params: { size: 423, density: 10 } },
    ],
  },
  {
    id: 'laptop-guitar-unsaved-mirror',
    name: 'Unsaved mirror',
    category: 'echo',
    description:
      'Thin backwards repeats with their lows cut away, then a bright blurred cloud an octave above everything played.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Thin and airy' },
      { deviceId: 'spectral-blur', preset: 'Bright octave cloud' },
    ],
  },
  {
    id: 'laptop-guitar-arpeggio-in-glitter',
    name: 'Arpeggio in glitter',
    category: 'echo',
    description:
      'A faint, very slow phasing that barely stirs the sound, then each note replayed as an arpeggio of octaves and fifths.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Still water', params: { delay: 6.57, lfoRate: 0.0454 } },
      { deviceId: 'cascade', preset: 'Rising steps' },
    ],
  },
  {
    id: 'laptop-guitar-splices-off-the-lid',
    name: 'Splices off the lid',
    category: 'echo',
    description:
      'Backwards chunks spliced hard, with no fades between them, into a bright spring splash that lands a moment after the note.',
    effects: [
      { deviceId: 'reverse-delay', preset: 'Hard splices' },
      { deviceId: 'spring-reverb', preset: 'Late splash' },
    ],
  },
  {
    id: 'laptop-guitar-dune-echo',
    name: 'Dune echo',
    category: 'echo',
    description:
      'A transformer overloaded into a thick, loose fuzz, then grain repeats that climb an octave on every pass.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron melt', params: { output: -9.43 } },
      { deviceId: 'grain-delay', preset: 'Crystals' },
    ],
  },
  {
    id: 'laptop-guitar-melting-echoes',
    name: 'Melting echoes',
    category: 'echo',
    description:
      'Slow echoes that climb further out of tune on each repeat, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'Rising echo', params: { delay: 396, lfoRate: 0.0816 } },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.564 } },
    ],
  },
  {
    id: 'laptop-guitar-steps-bleached-out',
    name: 'Steps bleached out',
    category: 'echo',
    description:
      'Grain repeats that sink by fourths on every pass, then a short echo whose pitch sways like a seasick vibrato.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Falling fourths' },
      { deviceId: 'analog-delay', preset: 'Seasick', params: { time: 169, modRate: 3.12 } },
    ],
  },
  {
    id: 'laptop-guitar-low-season-strikes',
    name: 'Low-season strikes',
    category: 'echo',
    description:
      'A bright, buzzing fuzz, then the start of each note struck again in a bouncing run, into a huge bright space with a wide and very long tail.',
    effects: [
      { deviceId: 'saturator', preset: 'Fuzz pedal', params: { outputDb: -22.3 } },
      { deviceId: 'cascade', preset: 'Restruck', params: { time: 447 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { predelayMs: 40.9 } },
    ],
  },
  {
    id: 'laptop-guitar-steps-from-memory',
    name: 'Steps from memory',
    category: 'echo',
    description:
      'Bright saturation, mixed low, then backwards repeats that step down an octave each time, into a plate wash that hangs on for half a minute.',
    effects: [
      { deviceId: 'saturator', preset: 'Parallel shine' },
      { deviceId: 'reverse-delay', preset: 'Descending steps', params: { time: 538 } },
      { deviceId: 'plate-reverb', preset: 'Endless wash' },
    ],
  },
  {
    id: 'laptop-guitar-bounce-on-the-pier',
    name: 'Bounce on the pier',
    category: 'echo',
    description:
      'A plain echo whose repeats bounce from side to side, then only the two detuned copies, hard left and right.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Side to side' },
      { deviceId: 'stereo-detune', preset: 'Wet only' },
    ],
  },
  {
    id: 'laptop-guitar-screen-lit-echo',
    name: 'Screen-lit echo',
    category: 'echo',
    description:
      'A dull, wobbling, saturated echo on worn tape, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { time: 691 } },
      { deviceId: 'plate-reverb', preset: 'Long plate' },
    ],
  },
  {
    id: 'laptop-guitar-drive-in-the-buffer',
    name: 'Drive in the buffer',
    category: 'tape',
    description:
      'A few decibels of soft saturation with the top eased, then a stream starved and scrambled until every note fizzes.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { outputDb: -5.23 } },
      { deviceId: 'low-bitrate', preset: 'Fizzing phases' },
    ],
  },
  {
    id: 'laptop-guitar-parasol-pentode',
    name: 'Parasol pentode',
    category: 'tape',
    description:
      'A lean pentode valve stage with a bite on every attack, then a short diffuse haze around the sound, like a small room.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Bite', params: { output: -3.76 } },
      { deviceId: 'spectral-blur', preset: 'Diffuse room' },
    ],
  },
  {
    id: 'laptop-guitar-drive-on-shingle',
    name: 'Drive on shingle',
    category: 'tape',
    description:
      'A few decibels of soft saturation with the top eased, then tiny hard grains so close together that the sound buzzes.',
    effects: [
      { deviceId: 'saturator', preset: 'Warm glue', params: { outputDb: -5.78 } },
      { deviceId: 'grain-cloud', preset: 'Grain buzz', params: { size: 12.3, density: 91.6 } },
    ],
  },
  {
    id: 'laptop-guitar-fold-at-the-lido',
    name: 'Fold at the lido',
    category: 'tape',
    description:
      "A hint of a wavefolder's glassy edge under the clean sound, then a detuned double made of grains, spread to the sides.",
    effects: [
      { deviceId: 'saturator', preset: 'Folded glass' },
      { deviceId: 'grain-cloud', preset: 'Detuned double', params: { size: 123, density: 35.6 } },
    ],
  },
  {
    id: 'laptop-guitar-glittering-valve',
    name: 'Glittering valve',
    category: 'tape',
    description:
      'A valve driven all the way into a bright, buzzing fuzz, then a wide cloud whose grains jump by fifths and octaves.',
    effects: [
      { deviceId: 'patina', preset: 'Valve fuzz' },
      { deviceId: 'grain-cloud', preset: 'Choir of fifths', params: { size: 526, density: 15.2 } },
    ],
  },
  {
    id: 'laptop-guitar-pixelated-grit',
    name: 'Pixelated grit',
    category: 'tape',
    description:
      'A coarse early sampler, gritty, with bright hash on top, then a pentode pushed into a folded-over fuzz, thin and torn.',
    effects: [
      { deviceId: 'patina', preset: 'Eight bit' },
      { deviceId: 'analog-drive', preset: 'Torn cone', params: { output: -6.08 } },
    ],
  },
  {
    id: 'laptop-guitar-rendered-residue',
    name: 'Rendered residue',
    category: 'tape',
    description:
      'The thrown-away part of a stream, thin, with a short wash, then a small, boxy radio speaker, close by in a small room.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Thin air' },
      { deviceId: 're-amp', preset: 'Bedside radio' },
    ],
  },
  {
    id: 'laptop-guitar-stream-in-the-glare',
    name: 'Stream in the glare',
    category: 'tape',
    description:
      'A stream that keeps sticking on long, buzzing held loops, then thin pentode grit mixed in under the clean sound.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Stuck stream' },
      { deviceId: 'analog-drive', preset: 'Parallel grit' },
    ],
  },
  {
    id: 'laptop-guitar-rooftop-bits',
    name: 'Rooftop bits',
    category: 'tape',
    description:
      'Converters at a very low rate, filtered smooth and dull, then a combo amplifier driven hard, miked right on the cone.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sunken' },
      { deviceId: 're-amp', preset: 'Speaker on the edge', params: { output: -3.63 } },
    ],
  },
  {
    id: 'laptop-guitar-grain-in-heat-haze',
    name: 'Grain in heat haze',
    category: 'tape',
    description:
      'Five-bit converters fed hot, a coarse grain on every note, then thin bright air from a microphone, hardly moving, into a driven spring tank.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Crushed' },
      { deviceId: 'noise-floor', preset: 'Thin bright air' },
      {
        deviceId: 'spring-reverb',
        preset: 'Dub send',
        params: { decay: 2.75, predelay: 65.9, mix: 0.367 },
      },
    ],
  },
  {
    id: 'laptop-guitar-breakwater-modem',
    name: 'Breakwater modem',
    category: 'tape',
    description:
      'A telephone-grade stream, mono, gritty and cut off on top, then steady tape hiss that lingers after the last note.',
    effects: [
      { deviceId: 'low-bitrate', preset: 'Dial-up' },
      { deviceId: 'noise-floor', preset: 'Tape floor', params: { response: 0.37, hold: 12.3 } },
    ],
  },
  {
    id: 'laptop-guitar-soundcard-static',
    name: 'Soundcard static',
    category: 'tape',
    description:
      'A shortwave broadcast, narrow and mono, fading under static, into a reverb that grows backwards behind each note and cuts off.',
    effects: [
      { deviceId: 'patina', preset: 'Shortwave' },
      { deviceId: 'shaped-reverb', preset: 'Reverse', params: { time: 1.24 } },
    ],
  },
  {
    id: 'laptop-guitar-rooftop-gaps',
    name: 'Rooftop gaps',
    category: 'tape',
    description:
      'A rumble cut and a single decibel of presence, then a stream full of holes, then gated bursts of reverb repeating about four times a second.',
    effects: [
      { deviceId: 'ambient-eq', preset: 'Keys' },
      { deviceId: 'low-bitrate', preset: 'Dropouts' },
      { deviceId: 'shaped-reverb', preset: 'Gate steps' },
    ],
  },
  {
    id: 'laptop-guitar-bits-breaking-up',
    name: 'Bits breaking up',
    category: 'tape',
    description:
      'Raw converters at a very low rate, bright and clanging, then a subsonic cut with the low mids and presence eased a touch.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Clang' },
      { deviceId: 'ambient-eq', preset: 'Drone', params: { clearTime: 1.57 } },
    ],
  },
  {
    id: 'laptop-guitar-noon-loop',
    name: 'Noon loop',
    category: 'tape',
    description:
      'A short loop at an eighth of the sample rate, dull and plain, then four-bit companded converters that rasp on every note.',
    effects: [
      { deviceId: 'micro-looper', preset: 'Sampler grit', params: { length: 1.07 } },
      { deviceId: 'vintage-digital', preset: 'Rasp' },
    ],
  },
  {
    id: 'laptop-guitar-line-in-bits',
    name: 'Line-in bits',
    category: 'tape',
    description:
      'Nine-bit converters on an unsteady clock, hiss on high notes, then echoes that climb an octave on every repeat.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Worn' },
      { deviceId: 'pitch-shifter', preset: 'Rising steps', params: { size: 56.5, delay: 317 } },
    ],
  },
  {
    id: 'laptop-guitar-ghost-in-the-patch',
    name: 'Ghost in the patch',
    category: 'tape',
    description:
      'A small, boxy radio speaker, close by in a small room, then the leavings of a stream, into a small room that is over in about a second.',
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { output: -2.88 } },
      { deviceId: 'low-bitrate', preset: 'Ghost' },
      {
        deviceId: 'hall-reverb',
        preset: 'Room',
        params: { preDelay: 28.6, lowDecay: 1.42, midDecay: 1.07 },
      },
    ],
  },
  {
    id: 'laptop-guitar-tramline-clock',
    name: 'Tramline clock',
    category: 'tape',
    description:
      'A reverb that swells and ebbs in waves of about four seconds, then smooth, dull converters whose clock is badly unsteady.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Slow tide' },
      { deviceId: 'vintage-digital', preset: 'Jittery' },
    ],
  },
  {
    id: 'laptop-guitar-desktop-dust',
    name: 'Desktop dust',
    category: 'tape',
    description:
      'A well-played record, dulled, swaying, with ticks and pops, then tape hiss that rises with each note and dies with it.',
    effects: [
      { deviceId: 'vinyl', preset: 'Charity shop find', params: { spin: 1.67 } },
      { deviceId: 'noise-floor', preset: 'Riding hiss' },
    ],
  },
  {
    id: 'laptop-guitar-buzz-by-the-water',
    name: 'Buzz by the water',
    category: 'tape',
    description:
      'Phrases repeated by chance, then a stream that keeps sticking, into a long undamped tail kept low behind the sound.',
    effects: [
      { deviceId: 'glitch', preset: 'Phrase repeats', params: { time: 1600 } },
      { deviceId: 'low-bitrate', preset: 'Stuck stream' },
      { deviceId: 'ether-reverb', preset: 'Shining tail', params: { predelayMs: 29.7 } },
    ],
  },
  {
    id: 'laptop-guitar-windbreak-sampler',
    name: 'Windbreak sampler',
    category: 'tape',
    description:
      'Old converters with no output filter, a glassy ring on top, then a starved stream in long frames, watery, its top cut away.',
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glassy' },
      { deviceId: 'low-bitrate', preset: 'Underwater' },
    ],
  },
  {
    id: 'laptop-guitar-disc-in-the-glare',
    name: 'Disc in the glare',
    category: 'tape',
    description:
      'The skips of a scratched disc, stuck on tiny fragments, into a thin bright tail with all its lows cut away.',
    effects: [
      { deviceId: 'glitch', preset: 'Skipping disc', params: { time: 97.9 } },
      { deviceId: 'expanse', preset: 'Thin air' },
    ],
  },
  {
    id: 'laptop-guitar-autosave-bits',
    name: 'Autosave bits',
    category: 'tape',
    description:
      'A buzzing valve fuzz, then the converters of an early sampler, twelve bits, low rate, into a plain short room whose tail stays at pitch.',
    effects: [
      { deviceId: 'patina', preset: 'Valve fuzz' },
      { deviceId: 'vintage-digital', preset: 'Sampler' },
      { deviceId: 'bloom-reverb', preset: 'Still room' },
    ],
  },
  {
    id: 'laptop-guitar-speaker-breaking-up',
    name: 'Speaker breaking up',
    category: 'tape',
    description:
      'A small speaker, close and muffled, as if under a pillow, then a big lift of presence and air, with ringing held in check.',
    effects: [
      { deviceId: 're-amp', preset: 'Pillow speaker' },
      { deviceId: 'ambient-eq', preset: 'Bright' },
    ],
  },
  {
    id: 'laptop-guitar-sunburnt-ripples',
    name: 'Sunburnt ripples',
    category: 'motion',
    description:
      'Quick waves of reverb rippling about twice a second, into a cave whose echoes jump now and then by a fifth or octave.',
    effects: [
      { deviceId: 'shaped-reverb', preset: 'Ripples', params: { time: 0.422 } },
      { deviceId: 'swarm-reverb', preset: 'Intervals' },
    ],
  },
  {
    id: 'laptop-guitar-bedroom-tremolo',
    name: 'Bedroom tremolo',
    category: 'motion',
    description:
      'A closed amplifier stack, driven and dark, miked off-centre, then a harmonic tremolo whose lows and highs trade places quickly.',
    effects: [
      { deviceId: 're-amp', preset: 'Warm stack', params: { output: 1.39 } },
      { deviceId: 'tremolo', preset: 'Harmonic shimmer' },
    ],
  },
  {
    id: 'laptop-guitar-sun-faded-drift',
    name: 'Sun-faded drift',
    category: 'motion',
    description:
      'An amplifier stack, all bass, with the mic turned away, then a slow reel whose pitch sways widely and never settles.',
    effects: [
      { deviceId: 're-amp', preset: 'Dark and woolly' },
      { deviceId: 'tape', preset: 'Seasick' },
    ],
  },
  {
    id: 'laptop-guitar-holiday-fall',
    name: 'Holiday fall',
    category: 'motion',
    description:
      'A resonant high-pass falling for about two seconds at a time, into a vast hall whose long tail sings a high bright ah.',
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Falling high-pass',
        params: { lfoRateHz: 0.51, envAttackMs: 9.06, envReleaseMs: 225 },
      },
      { deviceId: 'vowel-reverb', preset: 'High choir', params: { decay: 23.7, preDelay: 19.9 } },
    ],
  },
  {
    id: 'laptop-guitar-blistered-echo',
    name: 'Blistered echo',
    category: 'motion',
    description:
      'An echo of single grains with gaps, so the repeats pulse, into a dark plate whose tail is soft on top.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Pulsing repeat', params: { time: 231, size: 100 } },
      { deviceId: 'plate-reverb', preset: 'Dark plate', params: { predelayMs: 16 } },
    ],
  },
  {
    id: 'laptop-guitar-warble-on-a-postcard',
    name: 'Warble on a postcard',
    category: 'motion',
    description:
      'Thin pentode grit mixed in under the clean sound, then a fast warble of the whole sound, sharp and flat by turns.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Parallel grit' },
      { deviceId: 'freq-shifter', preset: 'Fast warble' },
    ],
  },
  {
    id: 'laptop-guitar-postcard-collapse',
    name: 'Postcard collapse',
    category: 'texture',
    description:
      'A tape preamp driven for thick lows and a dull top, then a sound broken at every slice: stuck, reversed, slowed, into a driven spring tank.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -8.83 } },
      { deviceId: 'glitch', preset: 'Total collapse' },
      { deviceId: 'spring-reverb', preset: 'Dub send', params: { decay: 3.29, predelay: 66.9 } },
    ],
  },
  {
    id: 'laptop-guitar-mirror-on-battery',
    name: 'Mirror on battery',
    category: 'texture',
    description:
      'A buzzing valve fuzz, then phrases that sometimes turn round and play backwards, into an undamped hall with about three seconds of tail.',
    effects: [
      { deviceId: 'patina', preset: 'Valve fuzz' },
      { deviceId: 'glitch', preset: 'Backwards glances' },
      { deviceId: 'fdn-reverb', preset: 'Bright air' },
    ],
  },
  {
    id: 'laptop-guitar-slips-in-deckchairs',
    name: 'Slips in deckchairs',
    category: 'texture',
    description:
      'A combo amplifier miked fairly close in a small room, then a gently stumbling sound, into a hall with about two and a half seconds of tail.',
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room' },
      { deviceId: 'glitch', preset: 'Gentle stumble', params: { time: 260 } },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'laptop-guitar-rain-on-a-postcard',
    name: 'Rain on a postcard',
    category: 'texture',
    description:
      'An overloaded console, then a glittering octave stutter, into a bright undamped plate of a couple of seconds.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Crushed' },
      { deviceId: 'cascade', preset: 'Glass rain', params: { time: 135 } },
      { deviceId: 'plate-reverb', preset: 'Bright plate' },
    ],
  },
  {
    id: 'laptop-guitar-octave-up-glass',
    name: 'Octave-up glass',
    category: 'texture',
    description:
      'A buzzing valve fuzz, then a glittering octave stutter, into a vast hall that opens to the sound in very slow waves.',
    effects: [
      { deviceId: 'patina', preset: 'Valve fuzz' },
      { deviceId: 'cascade', preset: 'Glass rain', params: { time: 128 } },
      { deviceId: 'fdn-reverb', preset: 'Slow swell', params: { decay: 11.4 } },
    ],
  },
  {
    id: 'laptop-guitar-borrowed-debris',
    name: 'Borrowed debris',
    category: 'texture',
    description:
      'A bright, buzzing fuzz from a hard clipper driven flat, then hard-cut shards of sound, into a long plate with a wide and even tail.',
    effects: [
      { deviceId: 'saturator', preset: 'Fuzz pedal' },
      { deviceId: 'glitch', preset: 'Shards', params: { time: 50.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { predelayMs: 44.3 } },
    ],
  },
  {
    id: 'laptop-guitar-scratch-on-hot-tiles',
    name: 'Scratch on hot tiles',
    category: 'texture',
    description:
      'The skips of a scratched disc, stuck on tiny fragments, then eight-bit companded converters with false tones folded in.',
    effects: [
      { deviceId: 'glitch', preset: 'Skipping disc', params: { time: 98.2 } },
      { deviceId: 'vintage-digital', preset: 'Toy' },
    ],
  },
  {
    id: 'laptop-guitar-bleached-ball',
    name: 'Bleached ball',
    category: 'texture',
    description:
      'Slices that repeat faster and faster like a dropped ball, then seven-bit converters whose quiet tails break up and cut off.',
    effects: [
      { deviceId: 'glitch', preset: 'Bouncing' },
      { deviceId: 'vintage-digital', preset: 'Coarse' },
    ],
  },
  {
    id: 'laptop-guitar-cracks-in-salt-air',
    name: 'Cracks in salt air',
    category: 'texture',
    description:
      'A few soft stutters and skips under an untouched sound, then a watery, warbling copy mixed low under the clean sound.',
    effects: [
      { deviceId: 'glitch', preset: 'Barely broken' },
      { deviceId: 'low-bitrate', preset: 'Watery trace' },
    ],
  },
  {
    id: 'laptop-guitar-promenade-sparks',
    name: 'Promenade sparks',
    category: 'texture',
    description:
      'Stuttered fragments that flicker an octave up and down, then seven-bit converters whose quiet tails break up and cut off.',
    effects: [
      { deviceId: 'glitch', preset: 'Flickering octaves' },
      { deviceId: 'vintage-digital', preset: 'Coarse' },
    ],
  },
  {
    id: 'laptop-guitar-lifeguard-bounce',
    name: 'Lifeguard bounce',
    category: 'texture',
    description:
      'Slices that repeat faster and faster like a dropped ball, then a stream starved down to a few warbling partials.',
    effects: [
      { deviceId: 'glitch', preset: 'Bouncing', params: { time: 299 } },
      { deviceId: 'low-bitrate', preset: 'Few partials' },
    ],
  },
  {
    id: 'laptop-guitar-driftwood-halo',
    name: 'Driftwood halo',
    category: 'texture',
    description:
      'A compressor as slow as a hand on a fader, then a faint swell of octave loops behind each note, into a hint of open space behind the sound.',
    effects: [
      { deviceId: 'ambient-comp', preset: 'Slow fader' },
      { deviceId: 'cascade', preset: 'Faint halo' },
      { deviceId: 'expanse', preset: 'Faint air' },
    ],
  },
  {
    id: 'laptop-guitar-snapshot-haze',
    name: 'Snapshot haze',
    category: 'texture',
    description:
      'A thin, bright haze that hangs high above the sound, into a quick bright twang of springs behind each attack.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'High air' },
      { deviceId: 'spring-reverb', preset: 'Quick twang', params: { decay: 0.871 } },
    ],
  },
  {
    id: 'laptop-guitar-tideline-layers',
    name: 'Tideline layers',
    category: 'texture',
    description:
      'A held pad where each new chord piles onto the last, into a quiet plate tail that comes in late behind each note.',
    effects: [
      { deviceId: 'sustainer', preset: 'Stacked harmony', params: { attack: 0.581, glide: 0.748 } },
      { deviceId: 'plate-reverb', preset: 'Faint sheen', params: { predelayMs: 80.3 } },
    ],
  },
  {
    id: 'laptop-guitar-peeling-cloud',
    name: 'Peeling cloud',
    category: 'texture',
    description:
      'A wide pad made of the sound with its attacks dissolved, then a wobbling tape double a moment behind each note.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Pad from anything' },
      { deviceId: 'tape-echo', preset: 'Wobbly double' },
    ],
  },
  {
    id: 'laptop-guitar-tideline-blur',
    name: 'Tideline blur',
    category: 'texture',
    description:
      'The sound with its attacks blurred soft and nothing added, into a reverb that breathes in slow waves over and over.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Softened attacks' },
      { deviceId: 'shaped-reverb', preset: 'Breathing' },
    ],
  },
  {
    id: 'laptop-guitar-spiral-by-the-water',
    name: 'Spiral by the water',
    category: 'texture',
    description:
      'Grains fed back a fourth down, sinking lower each pass, into three slack springs where every echo is a long chirp.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Sinking spiral' },
      {
        deviceId: 'spring-reverb',
        preset: 'Slack and strange',
        params: { decay: 3.56, predelay: 32.2 },
      },
    ],
  },
  {
    id: 'laptop-guitar-salted-blur',
    name: 'Salted blur',
    category: 'texture',
    description:
      'The sound with its attacks blurred soft and nothing added, into a combo amplifier heard from the far side of a big room.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Softened attacks' },
      { deviceId: 're-amp', preset: 'Down the hall', params: { output: -2.32 } },
    ],
  },
  {
    id: 'laptop-guitar-undertow-gone-pink',
    name: 'Undertow gone pink',
    category: 'texture',
    description:
      'Soft smeared repeats and reversals under the dry sound, then a mid-forward tone with the lows and the top trimmed.',
    effects: [
      { deviceId: 'glitch', preset: 'Smears underneath' },
      { deviceId: 'ambient-eq', preset: 'Forward', params: { clearTime: 1.52 } },
    ],
  },
  {
    id: 'laptop-guitar-heat-haze-strays',
    name: 'Heat-haze strays',
    category: 'texture',
    description:
      'Sparse stray grains of things played seconds earlier, then a thin twelve-bit glaze from converters at a moderate rate.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Stray memories', params: { size: 236, density: 1.63 } },
      { deviceId: 'vintage-digital', preset: 'Glaze' },
    ],
  },
  {
    id: 'laptop-guitar-siesta-glitter',
    name: 'Siesta glitter',
    category: 'texture',
    description:
      'A combo amplifier miked fairly close in a small room, then scattered sparks two octaves up, echoing higher still.',
    effects: [
      { deviceId: 're-amp', preset: 'Combo in a room' },
      { deviceId: 'pitch-shifter', preset: 'High sparks' },
    ],
  },
  {
    id: 'laptop-guitar-stack-by-the-kiosk',
    name: 'Stack by the kiosk',
    category: 'texture',
    description:
      'Little loops of each note stacked one and two octaves up, then an echo with a fast flutter in the pitch of its repeats.',
    effects: [
      { deviceId: 'cascade', preset: 'Octave stack', params: { time: 403 } },
      { deviceId: 'analog-delay', preset: 'Fluttering' },
    ],
  },
  {
    id: 'laptop-guitar-balcony-cloud',
    name: 'Balcony cloud',
    category: 'texture',
    description:
      'A scattered cloud of short grains behind the playing, into a honky horn loudspeaker heard from far across a big room.',
    effects: [
      { deviceId: 'grain-delay', preset: 'Grain cloud', params: { time: 223, size: 71.3 } },
      { deviceId: 're-amp', preset: 'Station platform' },
    ],
  },
  {
    id: 'laptop-guitar-jittery-drops',
    name: 'Jittery drops',
    category: 'texture',
    description:
      'Scattered short grains an octave up, falling like rain, into a two-spring tank with its input driven into saturation.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Octave rain', params: { size: 92.5, density: 6.28 } },
      { deviceId: 'spring-reverb', preset: 'Overdriven tank', params: { decay: 1.83 } },
    ],
  },
  {
    id: 'laptop-guitar-trackpad-swarm',
    name: 'Trackpad swarm',
    category: 'texture',
    description:
      'A swarm of short glimpses of the last few seconds, piling up, into two taut springs that ring long and clean with no drip.',
    effects: [
      { deviceId: 'echo-memory', preset: 'Swarm', params: { time: 443, reach: 8.91, size: 0.505 } },
      { deviceId: 'spring-reverb', preset: 'Tight long tank', params: { decay: 5.62 } },
    ],
  },
  {
    id: 'laptop-guitar-mixdown-band',
    name: 'Mixdown band',
    category: 'texture',
    description:
      'A wide fog kept to the middle band, hanging for seconds, then an early sampler whose quiet tails crumble into grain.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Band of fog' },
      { deviceId: 'patina', preset: 'Early sampler' },
    ],
  },
  {
    id: 'laptop-guitar-breakwater-haze',
    name: 'Breakwater haze',
    category: 'texture',
    description:
      'A short bright haze with an octave above everything, into a far-off plate with a long soft tail and little dry sound.',
    effects: [
      { deviceId: 'spectral-blur', preset: 'Glass halo' },
      { deviceId: 'plate-reverb', preset: 'Distant haze', params: { mix: 0.53 } },
    ],
  },
  {
    id: 'laptop-guitar-glitter-an-octave-up',
    name: 'Glitter an octave up',
    category: 'pitch',
    description:
      'Sparse short grains two octaves up, after each note, into a large hall heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'grain-delay', preset: 'High glitter' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Full wet send',
        params: { decay: 7.59, breathRate: 0.266 },
      },
    ],
  },
  {
    id: 'laptop-guitar-line-in-octave',
    name: 'Line-in octave',
    category: 'pitch',
    description:
      'A faint octave above, a little air over the dry sound, into a wide hall that answers about a fifth of a second late.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Faint air', params: { size: 52.9 } },
      { deviceId: 'ether-reverb', preset: 'Late hall' },
    ],
  },
  {
    id: 'laptop-guitar-pier-end-stack',
    name: 'Pier-end stack',
    category: 'pitch',
    description:
      'Loops of each note played backwards at stacked octaves, into a small tank that goes on ringing for seconds.',
    effects: [
      { deviceId: 'cascade', preset: 'Backwards stack' },
      {
        deviceId: 'fdn-reverb',
        preset: 'Small bright tank',
        params: { decay: 7.07, breathRate: 0.312 },
      },
    ],
  },
  {
    id: 'laptop-guitar-heatwave-grains',
    name: 'Heatwave grains',
    category: 'pitch',
    description:
      'Scattered short grains an octave up, falling like rain, into a plate heard alone with none of the dry sound left.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Octave rain', params: { size: 99.7, density: 6.13 } },
      { deviceId: 'plate-reverb', preset: 'Full wet send' },
    ],
  },
  {
    id: 'laptop-guitar-courtyard-organ',
    name: 'Courtyard organ',
    category: 'pitch',
    description:
      'Faint reversed grains stacked a fifth and an octave up, then a low-pass that opens and closes over about half a minute.',
    effects: [
      { deviceId: 'spectral-drifter', preset: 'Organ stack', params: { decay: 4.85 } },
      { deviceId: 'auto-filter', preset: 'Glacial low-pass' },
    ],
  },
  {
    id: 'laptop-guitar-parasol-splinters',
    name: 'Parasol splinters',
    category: 'pitch',
    description:
      'Faint reversed grains splintered to out-of-tune pitches, then an echo that now and then lurches down a fifth and back.',
    effects: [
      { deviceId: 'spectral-drifter', preset: 'Splintered', params: { decay: 5.01 } },
      { deviceId: 'analog-delay', preset: 'Slow lurch', params: { time: 388, modRate: 0.55 } },
    ],
  },
  {
    id: 'laptop-guitar-tramline-shimmer',
    name: 'Tramline shimmer',
    category: 'pitch',
    description:
      'Faint reversed grains that climb quickly towards the octave, then a deep eight-stage phaser with sharp peaks between notches.',
    effects: [
      { deviceId: 'spectral-drifter', preset: 'Shimmer', params: { decay: 2.82 } },
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.203 } },
    ],
  },
  {
    id: 'laptop-guitar-fifth-in-august',
    name: 'Fifth in august',
    category: 'pitch',
    description:
      'A wide, slightly detuned fifth above held chords, then a short bright haze with an octave above everything.',
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Pad fifth', params: { size: 60.9, mix: 0.24 } },
      { deviceId: 'spectral-blur', preset: 'Glass halo', params: { mix: 0.27 } },
    ],
  },
  {
    id: 'laptop-guitar-sunstruck-shards',
    name: 'Sunstruck shards',
    category: 'pitch',
    description:
      'Tiny hard-edged grains an octave up, scattered in pitch, then a stream losing packets, soft holes of silence in the sound.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Glass shards', params: { size: 25.4, density: 11.5 } },
      { deviceId: 'low-bitrate', preset: 'Dropouts' },
    ],
  },
  {
    id: 'laptop-guitar-bells-at-the-lido',
    name: 'Bells at the lido',
    category: 'pitch',
    description:
      'Inharmonic chimes far above the notes, echoing higher still, then slurred whole-tone harmonies trailing off in echoes.',
    effects: [
      { deviceId: 'freq-shifter', preset: 'High chime', params: { delay: 263, lfoRate: 0.0806 } },
      {
        deviceId: 'lattice',
        preset: 'Whole tone haze',
        params: { v1Delay: 334, v2Delay: 432, v3Delay: 171 },
      },
    ],
  },
  {
    id: 'laptop-guitar-pixel-spiral',
    name: 'Pixel spiral',
    category: 'pitch',
    description:
      'A half-hidden slow swell, then a climbing octave shimmer, into a rush of short echoes that piles up into a cavern.',
    effects: [
      { deviceId: 'swell', preset: 'Shadow', params: { attack: 1570, release: 337 } },
      { deviceId: 'grain-cloud', preset: 'Rising shimmer', params: { size: 342, density: 9.67 } },
      { deviceId: 'swarm-reverb', preset: 'Cavern', params: { length: 0.487, glide: 0.611 } },
    ],
  },
  {
    id: 'laptop-guitar-pixelated-sparks',
    name: 'Pixelated sparks',
    category: 'pitch',
    description:
      'Sparse short grains two octaves up, after each note, then a dense, wide fog of grains that buries the dry sound.',
    effects: [
      { deviceId: 'grain-delay', preset: 'High glitter', params: { time: 331, size: 44.1 } },
      { deviceId: 'grain-cloud', preset: 'Thick fog', params: { size: 501, density: 97.9 } },
    ],
  },
  {
    id: 'laptop-guitar-sun-faded-glass',
    name: 'Sun-faded glass',
    category: 'pitch',
    description:
      'Tiny hard-edged grains an octave up, scattered in pitch, then a held pad caught from each chord that glides to the next.',
    effects: [
      { deviceId: 'grain-cloud', preset: 'Glass shards', params: { size: 30.5, density: 13.4 } },
      { deviceId: 'sustainer', preset: 'Sustain pedal' },
    ],
  },
  {
    id: 'laptop-guitar-grit-on-hot-tiles',
    name: 'Grit on hot tiles',
    category: 'master',
    description:
      'A dark, thick valve curve mixed over some of the clean sound, then a low ceiling with the sound pushed hard up against it.',
    effects: [
      { deviceId: 'saturator', preset: 'Bass grit' },
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { release: 1.38, gain: -3.07 } },
    ],
  },
  {
    id: 'laptop-guitar-kiosk-centre',
    name: 'Kiosk centre',
    category: 'master',
    description:
      'The sides turned down, the image drawn towards the middle, then a fast limiter pushed so that soft and loud notes even out.',
    effects: [
      { deviceId: 'stereo-widener', preset: 'Narrow' },
      { deviceId: 'fet-limiter', preset: 'Drive', params: { outputGain: -8.18 } },
    ],
  },
  {
    id: 'laptop-guitar-deckchair-tape',
    name: 'Deckchair tape',
    category: 'master',
    description:
      'A reel driven hot, then the sides lifted a little, wider with nothing added, then a low, breathing ceiling.',
    effects: [
      { deviceId: 'tape', preset: 'Hot glue' },
      { deviceId: 'stereo-widener', preset: 'Gently wide' },
      { deviceId: 'ambient-limiter', preset: 'Breathing', params: { release: 0.314, gain: 0.474 } },
    ],
  },
  {
    id: 'laptop-guitar-plate-out-of-season',
    name: 'Plate out of season',
    category: 'master',
    description:
      'A small plate that is gone in a second or two, then a true-peak ceiling set two decibels under full scale.',
    effects: [
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { predelayMs: 9.26 } },
      { deviceId: 'ambient-limiter', preset: 'Streaming', params: { release: 1.61, gain: 2.19 } },
    ],
  },
  {
    id: 'laptop-guitar-coil-in-heat-haze',
    name: 'Coil in heat haze',
    category: 'master',
    description:
      'A transformer driven so the low end thickens and loosens, then a true-peak ceiling that eases long swells down first.',
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows' },
      { deviceId: 'ambient-limiter', preset: 'Master', params: { release: 1.51, gain: -3.31 } },
    ],
  },
  {
    id: 'laptop-guitar-august-overtone',
    name: 'August overtone',
    category: 'master',
    description:
      'A lopsided soft curve that adds the octave above each note, then a low ceiling with the sound pushed hard up against it.',
    effects: [
      { deviceId: 'saturator', preset: 'Octave glow' },
      { deviceId: 'ambient-limiter', preset: 'Pinned', params: { release: 1.53, gain: 9.91 } },
    ],
  },
]
