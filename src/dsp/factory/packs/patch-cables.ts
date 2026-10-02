import { type FactoryPreset } from '../types'

// A patched synthesizer with no keyboard habits, on an island of cedar and rain: folded plucks
// through low-pass gates, stepped voltages, and woodwinds, mallets and a voice run through the patch.

export const PRESETS: readonly FactoryPreset[] = [
  // west-coast: the centre of the pack
  {
    id: 'patch-cables-cedar-plucks',
    name: 'Cedar plucks',
    category: 'plucked',
    description:
      'Folded plucks through a low-pass gate, answered a fifth up by a bucket-brigade echo, in a spring tank.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { fold: 0.5, timbreEnv: 0.55, decay: 0.9, colour: 0.8, chance: 0.25, volume: -2 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 3, driveDb: 12, outputDb: -8 } },
      {
        deviceId: 'analog-delay',
        preset: 'Fifths and fourths',
        params: { time: 250, feedback: 0.5, tone: 5200, intervalB: 0, step: 1, mix: 0.35 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2, tone: 4500 } },
    ],
  },
  {
    id: 'patch-cables-bubbling-gate',
    name: 'Bubbling gate',
    category: 'plucked',
    description:
      'Short gated blips, each one a little different, struck again in octaves until they bubble.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Wooden pluck',
      params: { fold: 0.3, fm: 0.25, ratio: 2, timbreEnv: 0.7, decay: 0.6, chance: 0.6, volume: 0 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 0, driveDb: 25, outputDb: -13.3 } },
      {
        deviceId: 'cascade',
        preset: 'Restruck',
        params: { time: 170, repeats: 6, decay: 0.4, high: 0.7, mix: 0.5 },
      },
      { deviceId: 'chorus', preset: 'Subtle Widener' },
      { deviceId: 'swarm-reverb', preset: 'Small swarm', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-kelp-bells',
    name: 'Kelp bells',
    category: 'bell',
    description:
      'Clangorous modulated strikes that dull to a pure ring, with echoes that climb an octave each time.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Glass bell',
      params: { fm: 0.5, decay: 3.5, colour: 0.85, volume: -2 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Rising steps', params: { delay: 280, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-folded-morning',
    name: 'Folded morning',
    category: 'pad',
    description:
      'A held chord whose overtones fold open in under a second, turned slowly by a phaser in a bright hall.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Slow bloom',
      params: { fold: 0.45, attack: 0.6, decay: 3, sustain: 0.85, colour: 0.9, volume: -8 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { rate: 0.12, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3, damping: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-stepped-current',
    name: 'Stepped current',
    category: 'drone',
    description:
      'A low folding drone with a filter jumping to random steps over it, the way a sample and hold would.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folding drone',
      params: { fold: 0.8, attack: 0.8, colour: 0.85, volume: -3 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Stepped',
        params: { cutoffHz: 900, resonance: 4, lfoAmount: 65, lfoRateHz: 5, mix: 0.6 },
      },
      { deviceId: 'echo-memory', preset: 'Flickers', params: { time: 250, mix: 0.3 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { highCut: 6000, mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-tuned-drum-knocks',
    name: 'Tuned drum knocks',
    category: 'plucked',
    description:
      'Short knocks on a hollow tuned drum, pushed through a transformer and bounced about by dotted tape heads.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Hollow bongo',
      params: { decay: 0.3, chance: 0.4, volume: 0 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Iron lows', params: { drive: 0.7, output: 0 } },
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 190, feedback: 0.45, heads: 3, spread: 0.8, mix: 0.35 },
      },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'patch-cables-deck-rain',
    name: 'Deck rain',
    category: 'bell',
    description:
      'Tiny woody ticks, never the same twice, scattered into a patter of octaves across both sides.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Rain on wood',
      params: { decay: 0.16, volume: 2 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 0, driveDb: 20, outputDb: -10.5 } },
      { deviceId: 'cascade', preset: 'Glass rain', params: { time: 115, repeats: 10, mix: 0.55 } },
      { deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'patch-cables-patched-harmony',
    name: 'Patched harmony',
    category: 'wind',
    description:
      'A held folded tone played as a line, with two harmony voices found for it on the steps of the scale.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Deep pulse',
      params: {
        fold: 0.4,
        symmetry: 0.2,
        ratio: 3,
        attack: 0.03,
        decay: 1.5,
        sustain: 0.75,
        colour: 0.7,
        volume: -4.5,
      },
    },
    effects: [
      { deviceId: 'lattice', preset: 'Diatonic thirds', params: { glide: 40, output: 4 } },
      { deviceId: 'chorus', preset: 'Classic Chorus', params: { mix: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'patch-cables-bright-ferns',
    name: 'Bright ferns',
    category: 'plucked',
    preview: 'chord',
    description:
      'A bright struck chord of folded strings, its octave arriving a moment after it, wide in a plain hall.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Bright harp',
      params: { decay: 2.4, chance: 0.35, volume: -10 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Octave up',
        params: { mode: 3, tone: 10000, spread: 0.7, mix: 0.3 },
      },
      { deviceId: 'stereo-detune', preset: 'Wide open', params: { mix: 0.3 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.25 } },
    ],
  },

  // wavetable: the digital voice beside the patch
  {
    id: 'patch-cables-green-vowels',
    name: 'Green vowels',
    category: 'pad',
    description:
      'A chord that talks: the table runs through its vowels about once a second, in a small room that sings back.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: {
        motion: 0.9,
        rate: 0.9,
        detune: 8,
        cutoff: 8000,
        attack: 0.08,
        release: 1.5,
        spread: 0.5,
        volume: -9,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Wide Chorus', params: { mix: 0.3 } },
      { deviceId: 'vowel-reverb', preset: 'Small chapel', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-glass-sprouts',
    name: 'Glass sprouts',
    category: 'keys',
    description:
      'Quick glassy notes with a fast shimmer inside them, each echo hopping up an octave and back.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: {
        position: 0.75,
        motion: 0.6,
        rate: 4,
        sub: 0,
        cutoff: 7000,
        attack: 0.005,
        release: 0.5,
        volume: -8,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Octave hops',
        params: { time: 250, feedback: 0.5, tone: 6000, mix: 0.35 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'patch-cables-reed-sequence',
    name: 'Reed sequence',
    category: 'keys',
    preview: 'bells',
    description:
      'Notes from a reed table through a filter that snaps open on each one and falls shut, like a gate, with a tape echo.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: {
        position: 0.55,
        motion: 0.3,
        sub: 0.2,
        cutoff: 9000,
        attack: 0.005,
        release: 0.3,
        volume: -6,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Low-Pass Gate',
        params: { cutoffHz: 900, resonance: 1.6, envAmount: 90, envAttackMs: 2, envReleaseMs: 260 },
      },
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 250, feedback: 0.4, spread: 0.6 },
      },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-spectral-garden',
    name: 'Spectral garden',
    category: 'pad',
    description:
      'A bright shifting chord with small grains of itself falling an octave above it, in a wide open space.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Spectral cloud',
      params: {
        motion: 0.8,
        rate: 0.4,
        detune: 12,
        attack: 0.9,
        release: 4,
        spread: 0.5,
        volume: -13,
      },
    },
    effects: [
      {
        deviceId: 'grain-cloud',
        preset: 'Octave rain',
        params: { density: 9, spread: 0.5, mix: 0.3 },
      },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { mix: 0.25, decay: 6, highCut: 9000, width: 0.7 },
      },
    ],
  },
  {
    id: 'patch-cables-hollow-reeds',
    name: 'Hollow reeds',
    category: 'wind',
    description:
      'A hollow digital reed that speaks at once, with a mirrored voice and a third above, in a spring tank.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: {
        position: 0.6,
        motion: 0.5,
        rate: 0.6,
        detune: 5,
        sub: 0,
        cutoff: 5000,
        resonance: 0.2,
        attack: 0.06,
        release: 0.6,
        volume: -6,
      },
    },
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Thesis voicing',
        params: { v3Role: 0, glide: 30, output: 4 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-morning-window',
    name: 'Morning window',
    category: 'pad',
    description:
      'A clear glass chord with a twelfth laid over every note like an organ mixture, thickened in a mid-sized hall.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: {
        position: 0.65,
        motion: 0.6,
        rate: 0.25,
        cutoff: 9000,
        attack: 0.35,
        release: 2.5,
        volume: -9.8,
      },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Pad fifth above',
        params: { pitchA: 19, pitchB: 19, tone: 9000, mix: 0.25 },
      },
      { deviceId: 'chorus', preset: 'Lush Ensemble', params: { mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'patch-cables-stepped-voltages',
    name: 'Stepped voltages',
    category: 'texture',
    description:
      'One held note chopped into random steps of tone, eight a second, thrown from side to side with echoes.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Spectral cloud',
      params: {
        position: 0.3,
        motion: 1,
        rate: 6,
        detune: 6,
        sub: 0.3,
        attack: 0.02,
        release: 1,
        spread: 0.3,
        volume: 3,
      },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Stepped',
        params: { mix: 1, resonance: 5, lfoAmount: 85 },
      },
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 2, shape: 3, depth: 0.4 } },
      {
        deviceId: 'analog-delay',
        preset: 'Chorus echo',
        params: { time: 375, spread: 0.4, mix: 0.3 },
      },
    ],
  },

  // choir: a voice folded into the patch
  {
    id: 'patch-cables-folded-voice',
    name: 'Folded voice',
    category: 'voice',
    preview: 'line',
    description:
      'One singer on an open ah, with a mirrored voice, a third above and an octave found for her from the scale.',
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { vibrato: 12, attack: 0.08, release: 0.5, volume: -1 },
    },
    effects: [
      { deviceId: 'lattice', preset: 'Thesis voicing', params: { glide: 35, mix: 55, output: 6 } },
      { deviceId: 'chorus', preset: 'Vocal Thickener' },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-low-brother',
    name: 'Low brother',
    category: 'voice',
    preview: 'line',
    description:
      'A sung line doubled by a grainy copy an octave below and a quieter fifth above, with a short halo.',
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { vowel: 0.3, voice: 1.22, vibrato: 8, attack: 0.05, release: 0.4, volume: -6 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        params: {
          pitchA: -12,
          pitchB: 7,
          levelB: 0.5,
          mode: 1,
          size: 90,
          jitter: 0.2,
          tone: 7000,
          mix: 0.5,
        },
      },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-octave-siblings',
    name: 'Octave siblings',
    category: 'voice',
    description:
      'Small high voices on ooh that speak quickly, with a copy an octave above them and a spring behind.',
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { attack: 0.12, release: 1.2, ensemble: 0.25, volume: -13 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Octave up',
        params: { mode: 3, tone: 9000, spread: 0.8, mix: 0.35 },
      },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-talking-greens',
    name: 'Talking greens',
    category: 'voice',
    description:
      'A straight-toned ee chord with a band-pass stepping at random through it, like a voice read by a machine.',
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: { attack: 0.15, release: 1.5, motion: 0.5, ensemble: 0.3, volume: -5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Stepped',
        params: { cutoffHz: 1500, resonance: 3, lfoAmount: 60, lfoRateHz: 6, mix: 0.7 },
      },
      {
        deviceId: 'grain-delay',
        preset: 'Plain repeat',
        params: { time: 300, spread: 0.6, mix: 0.25 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-patched-breath',
    name: 'Patched breath',
    category: 'pad',
    description:
      'Mostly air: a whispered chord phasing slowly in a frequency shifter, with crystals of it an octave up.',
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: { attack: 0.7, release: 3, width: 0.8, volume: -13 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { mix: 0.35 } },
      { deviceId: 'grain-delay', preset: 'Crystals', params: { mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'patch-cables-seventh-stack',
    name: 'Seventh stack',
    category: 'voice',
    preview: 'line',
    description:
      'A soft oo from a larger, lower throat, sung as one line and stacked into seventh chords from the scale.',
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: {
        vowel: 0.95,
        voice: 0.98,
        vibrato: 6,
        attack: 0.15,
        release: 0.9,
        tone: 8000,
        volume: -4.7,
      },
    },
    effects: [
      { deviceId: 'lattice', preset: 'Seventh chord stack', params: { glide: 50, output: 4 } },
      { deviceId: 'stereo-detune', preset: 'Subtle halo' },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-sung-arpeggio',
    name: 'Sung arpeggio',
    category: 'voice',
    preview: 'bells',
    description:
      'Short sung notes, each replayed in rising steps of octaves and fifths so one voice becomes a pattern.',
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: { vowel: 0.55, vibrato: 0, attack: 0.02, release: 0.3, volume: 1.7 },
    },
    effects: [
      {
        deviceId: 'cascade',
        preset: 'Rising steps',
        params: { time: 190, repeats: 6, decay: 0.1, shape: 0.4, mix: 0.65 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
  },

  // flute: woodwinds woven into the patch
  {
    id: 'patch-cables-piping-pattern',
    name: 'Piping pattern',
    category: 'wind',
    preview: 'bells',
    description:
      'Short tongued flute notes with a puff on each, echoed a fourth up and back so they run into a pattern.',
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: { chiff: 0.85, attack: 0.01, release: 0.15, vibrato: 0.1, scoop: 5, volume: -5.7 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Octave hops',
        params: { time: 250, feedback: 0.5, tone: 6000, intervalA: 4, mix: 0.4 },
      },
      { deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-mirror-flute',
    name: 'Mirror flute',
    category: 'wind',
    description:
      'One flute line with a second that moves the opposite way round a centre note, and a third above.',
    instrument: {
      deviceId: 'flute',
      preset: 'Soft wind lead',
      params: { blow: 0.4, attack: 0.06, vibrato: 0.3, volume: -6 },
    },
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Thesis voicing',
        params: { v3Role: 0, glide: 45, output: 5 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.3, decay: 0.55 } },
    ],
  },
  {
    id: 'patch-cables-pipes-on-springs',
    name: 'Pipes on springs',
    category: 'wind',
    preview: 'bells',
    description:
      'Hollow stopped pipes, breathy and short, swaying from side to side in a slack spring tank that chirps after each note.',
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { breath: 0.6, release: 0.3, volume: -8 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Slow pan', params: { rate: 1.5, depth: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Slack and strange', params: { mix: 0.35, width: 0.6 } },
    ],
  },
  {
    id: 'patch-cables-canopy-air',
    name: 'Canopy air',
    category: 'pad',
    description:
      'A chord of low flutes, half breath, that speaks in under half a second and sways in a deep slow chorus.',
    instrument: {
      deviceId: 'flute',
      preset: 'Low flute drone',
      params: { breath: 0.7, blow: 0.35, attack: 0.45, release: 2.5, volume: -13 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Deep Sea', params: { rate: 0.3, mix: 0.4 } },
      { deviceId: 'vowel-reverb', preset: 'Whispering hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'patch-cables-wood-flute-grains',
    name: 'Wood flute grains',
    category: 'wind',
    description:
      'A round wood flute with a scoop into each note, trailed by grains of itself that climb in fifths.',
    instrument: {
      deviceId: 'flute',
      preset: 'Canyon flute',
      params: { blow: 0.5, release: 0.6, volume: -8 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Rising fifths',
        params: { time: 375, feedback: 0.5, mix: 0.3 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-flutter-tongue',
    name: 'Flutter tongue',
    category: 'wind',
    description:
      'A full-blown flute with a fast flutter in its tone, and a short loop of itself an octave up behind it.',
    instrument: {
      deviceId: 'flute',
      preset: 'Concert flute',
      params: { blow: 0.65, breath: 0.5, vibrato: 0.55, volume: -4 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Wide shimmer', params: { rate: 11, depth: 0.6, phase: 60 } },
      { deviceId: 'micro-looper', preset: 'Octave sparkle', params: { length: 0.75, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },

  // clarinet: reeds, close and woody
  {
    id: 'patch-cables-reed-thirds',
    name: 'Reed thirds',
    category: 'wind',
    description:
      'A warm clarinet line with a third above and a sixth below found from the scale, in a small plate.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { attack: 0.06, release: 0.35, volume: -2 },
    },
    effects: [
      { deviceId: 'lattice', preset: 'Diatonic thirds', params: { glide: 35, output: 5 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-bass-reed-pulse',
    name: 'Bass reed pulse',
    category: 'wind',
    preview: 'low',
    description:
      'A bass clarinet held low and chopped into even pulses, six a second, with a dark echo between them.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { blow: 0.8, attack: 0.05, release: 0.4, volume: -2 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Chopper', params: { rate: 6, depth: 0.85, smooth: 0.35 } },
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { time: 250, mix: 0.25 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'patch-cables-reed-section',
    name: 'Reed section',
    category: 'wind',
    preview: 'chord',
    description:
      'Hollow clarinets on a chord, entering together in a quarter second, lightly doubled in a hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { blow: 0.5, release: 0.9, volume: -10 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic wide', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'patch-cables-soprano-bubbles',
    name: 'Soprano bubbles',
    category: 'wind',
    preview: 'bells',
    description:
      'Clipped soprano reed notes that a bouncing buffer catches and repeats faster and faster.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bright soprano',
      params: { attack: 0.02, release: 0.12, vibrato: 0, volume: -1.6 },
    },
    effects: [
      { deviceId: 'glitch', preset: 'Bouncing', params: { time: 250, chance: 0.5, mix: 0.6 } },
      { deviceId: 'chorus', preset: 'Subtle Widener' },
      { deviceId: 'shaped-reverb', preset: 'Gated room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'patch-cables-subtone-octaves',
    name: 'Subtone octaves',
    category: 'wind',
    description:
      'A breathy low reed played softly, with its octave below and above added note for note.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Subtone tenor',
      params: { bore: 0.6, vibrato: 0.15, volume: -9.5 },
    },
    effects: [
      {
        deviceId: 'octaves',
        params: { sub1: 0.6, up1: 0.4, detune: 0.2, spread: 0.5, filter: 9000 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-folded-reed',
    name: 'Folded reed',
    category: 'wind',
    description:
      'A clarinet sent halfway through a wavefolder and out of a small amplifier, buzzing as it is blown harder.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { blow: 0.75, breath: 0.3, attack: 0.04, volume: -5 },
    },
    effects: [
      {
        deviceId: 'saturator',
        preset: 'Wavefold Lead',
        params: { driveDb: 14, outputDb: -6, mix: 0.5 },
      },
      { deviceId: 'phaser', preset: 'Classic 4-Stage', params: { rate: 0.4, mix: 0.35 } },
      {
        deviceId: 're-amp',
        preset: 'Combo in a room',
        params: { drive: 0.15, noise: 0.05, output: 0 },
      },
    ],
  },

  // mallets: wood and metal bars
  {
    id: 'patch-cables-marimba-garden',
    name: 'Marimba garden',
    category: 'bell',
    description:
      'Marimba notes ringing over their tubes, each echo jumping between a fifth up and a fourth down.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Soft marimba',
      params: { mallet: 0.5, decay: 1.2, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Fifths and fourths',
        params: { time: 375, feedback: 0.5, tone: 5000, mix: 0.35 },
      },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-rolled-greens',
    name: 'Rolled greens',
    category: 'bell',
    preview: 'chord',
    description:
      'A marimba chord kept alive by a soft roll, nine strokes a second, blurred a little by a chorus.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Rolled marimba',
      params: { roll: 9, mallet: 0.3, volume: -13 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'patch-cables-motor-and-octave',
    name: 'Motor and octave',
    category: 'bell',
    description:
      'Vibraphone bars with the motor turning, each note followed a moment later by itself an octave up.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { motor: 0.5, motorRate: 5.5, decay: 1.4, volume: -7.5 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Octave up',
        params: { delay: 190, feedback: 0.25, spread: 0.8, mix: 0.3 },
      },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-glockenspiel-sparks',
    name: 'Glockenspiel sparks',
    category: 'bell',
    description:
      'Hard small metal bars with no tubes under them, breaking into quick high octaves and fifths.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { mallet: 0.75, width: 0.5, volume: -2.5 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Sparkle bed', params: { time: 210, repeats: 8, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-celesta-steps',
    name: 'Celesta steps',
    category: 'bell',
    preview: 'keys',
    description:
      'A damped celesta, small and close, with a tape echo on three heads walking away behind it.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Celesta',
      params: { damper: 0.5, mallet: 0.4, volume: -9.5 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 375, feedback: 0.4, mix: 0.3 },
      },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'patch-cables-xylophone-patter',
    name: 'Xylophone patter',
    category: 'bell',
    preview: 'keys',
    description:
      'Dry hard xylophone bars that stutter and skip now and then, as if the sequencer lost its place.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Dry xylophone',
      params: { decay: 0.8, resonator: 0.6, volume: -3 },
    },
    effects: [
      {
        deviceId: 'glitch',
        preset: 'Stuck',
        params: { time: 125, chance: 0.4, calm: 0.5, mix: 0.7 },
      },
      { deviceId: 'analog-delay', preset: 'Slapback', params: { time: 125, feedback: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },

  // fm-glass: clear digital bells and mallets
  {
    id: 'patch-cables-glass-mallets',
    name: 'Glass mallets',
    category: 'bell',
    preview: 'keys',
    description:
      'Short clear mallet tones from four operators, with echoes that hop an octave up on every other step.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Vibes',
      params: { ratio: 7, brightness: 0.4, decay: 1.2, release: 0.8, volume: -13 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Octave hops',
        params: { time: 190, feedback: 0.55, tone: 6500, spread: 0.8, mix: 0.35 },
      },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'patch-cables-crystal-chord',
    name: 'Crystal chord',
    category: 'pad',
    description:
      'A crystalline held chord that enters in a fifth of a second, with a faint halo two octaves above it.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: { brightness: 0.55, attack: 0.2, release: 2.5, detune: 6, volume: -15 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Bass Safe', params: { rate: 0.2, mix: 0.35 } },
      { deviceId: 'shimmer', preset: 'Glass', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-tine-bubbles',
    name: 'Tine bubbles',
    category: 'keys',
    description:
      'Digital tine keys through a band-pass that opens with every note, so each one says a small wah.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Tine keys',
      params: { brightness: 0.45, decay: 1.2, volume: 1 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Touch wah',
        params: { cutoffHz: 500, resonance: 3, envAmount: 70, mix: 0.7 },
      },
      { deviceId: 'chorus', preset: 'Classic Chorus', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-ice-ladder',
    name: 'Ice ladder',
    category: 'bell',
    description:
      'Thin glass chimes, each followed by delayed copies an octave and a fifth above that keep climbing.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Ice chimes',
      params: { decay: 1.8, release: 2.5, volume: -2 },
    },
    effects: [
      { deviceId: 'lattice', preset: 'Crystal cascade', params: { mix: 45, output: 4 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-glass-in-a-sung-ee',
    name: 'Glass in a sung ee',
    category: 'pad',
    description:
      'Glass tones that swell in over half a second and hold, in a hall shaped like a high sung ee.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Slow glass',
      params: {
        ratio: 3,
        brightness: 0.55,
        attack: 0.5,
        release: 3,
        detune: 8,
        spread: 0.7,
        volume: -16.5,
      },
    },
    effects: [{ deviceId: 'vowel-reverb', preset: 'High ee', params: { mix: 0.35 } }],
  },

  // acoustic-guitar
  {
    id: 'patch-cables-nylon-sprigs',
    name: 'Nylon sprigs',
    category: 'plucked',
    description:
      'A nylon guitar picked close and left short, each note sprouting small octaves and fifths behind it.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { nail: 0.55, sustain: 1.6, release: 0.5, tone: 0.65, strum: 0, volume: -1 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 3, driveDb: 12, outputDb: -6.8 } },
      { deviceId: 'cascade', preset: 'Rising steps', params: { time: 250, repeats: 5, mix: 0.3 } },
      { deviceId: 'sympathetic', preset: 'Short halo', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-twelve-in-steps',
    name: 'Twelve in steps',
    category: 'plucked',
    preview: 'chord',
    description:
      'A strummed twelve-string chord with a phaser that jumps between random settings three times a second.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { strum: 45, volume: -5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Random Steps', params: { depth: 60, mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },

  // atmosphere
  {
    id: 'patch-cables-pinging-rain',
    name: 'Pinging rain',
    category: 'texture',
    description:
      'Rain on a window heard through a resonant band that steps at random, so the drops come out as pitches.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Rain on the window',
      params: { density: 1, tone: 0.65, attack: 0.5, width: 0.6, volume: 3 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Stepped',
        params: { cutoffHz: 1400, resonance: 8, lfoAmount: 60, lfoRateHz: 5, mix: 0.75 },
      },
      { deviceId: 'saturator', params: { curve: 0, driveDb: 16, outputDb: -11.5 } },
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 250, feedback: 0.4, mix: 0.3 },
      },
      { deviceId: 'swarm-reverb', preset: 'Small swarm', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-wind-through-firs',
    name: 'Wind through firs',
    category: 'texture',
    description:
      'A gusting wind that sings on the pitch of the key, with a fifth laid above it, in a mid-sized hall.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Whistling gap',
      params: { density: 0.5, movement: 0.9, resonance: 0.9, attack: 0.6, width: 0.6, volume: -2 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Fifth above', params: { mix: 0.3 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.3 } },
    ],
  },

  // aurora
  {
    id: 'patch-cables-brass-sprouts',
    name: 'Brass sprouts',
    category: 'keys',
    preview: 'bells',
    description:
      'Short synthetic brass stabs whose filter snaps open and settles, bounced on dotted tape heads.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: {
        brilliance: 1600,
        resonance: 0.35,
        contour: 0.9,
        attack: 0.01,
        swell: 0.1,
        release: 0.35,
        volume: -1.5,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 250, feedback: 0.45, heads: 3, highCut: 7000, spread: 0.7, mix: 0.3 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'patch-cables-sunlit-brass',
    name: 'Sunlit brass',
    category: 'pad',
    description:
      'An open string and brass chord that speaks in a third of a second, with the octave above mixed in.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: { brilliance: 6500, attack: 0.3, swell: 0.5, release: 2.5, volume: -10 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Octave up',
        params: { mode: 3, detune: 6, tone: 10000, spread: 0.7, mix: 0.25 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // bowed-string
  {
    id: 'patch-cables-one-string-answered',
    name: 'One string answered',
    category: 'plucked',
    preview: 'line',
    description:
      'A single plucked string answered by four later notes on the next steps of a pentatonic scale.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Felt guitar',
      params: { brightness: 0.7, decay: 3, position: 0.12, body: 0.4, volume: -3 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 3, driveDb: 10, outputDb: -6 } },
      { deviceId: 'lattice', preset: 'Pentatonic harp', params: { mix: 65, output: 8.5 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-sung-wire',
    name: 'Sung wire',
    category: 'string',
    preview: 'line',
    description:
      'A string held singing by a magnet, speaking in a third of a second, turned in a slow rotating speaker.',
    instrument: {
      deviceId: 'bowed-string',
      params: { attack: 0.3, release: 1, brightness: 0.75, vibrato: 0.1, volume: -10.5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Chorale', params: { drive: 0.1, mix: 0.7 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // chamber-strings
  {
    id: 'patch-cables-quick-bows',
    name: 'Quick bows',
    category: 'string',
    preview: 'bells',
    description:
      'A small section playing short separate bow strokes, close and woody, with three tape heads behind.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Chamber section',
      params: { attack: 0.05, release: 0.25, bow: 0.65, vibrato: 3, mute: 0, volume: -3.3 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 375, feedback: 0.35, mix: 0.25 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'patch-cables-section-in-leaf',
    name: 'Section in leaf',
    category: 'string',
    description:
      'Six unmuted players on a chord with a wide vibrato, and a soft synthetic section an octave up behind.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Warm section',
      params: { attack: 0.35, release: 1.5, air: 0.35, volume: -8 },
    },
    effects: [
      { deviceId: 'pad-follower', preset: 'Octave halo', params: { rise: 0.5, fall: 3, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // chord-harp
  {
    id: 'patch-cables-scattered-strum',
    name: 'Scattered strum',
    category: 'plucked',
    description:
      'A small toy chord harp swept in a random order on every key, with a chorused echo close behind.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Toy harp',
      params: { strum: 70, direction: 3, span: 2, sustain: 1.6, volume: -3 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Chorus echo', params: { time: 250, mix: 0.3 } },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-harp-over-moss',
    name: 'Harp over moss',
    category: 'plucked',
    preview: 'chord',
    description:
      'A soft pad with plucked strings scattered up and down over it, in a reverb whose tail climbs by octaves.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Pad and sparkle',
      params: { strum: 110, direction: 2, sustain: 3, volume: -14 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Wide Chorus', params: { mix: 0.3 } },
      { deviceId: 'shimmer', preset: 'Rising choir', params: { decay: 6, shimmer: 0.4, mix: 0.3 } },
    ],
  },

  // drone
  {
    id: 'patch-cables-greenhouse-hum',
    name: 'Greenhouse hum',
    category: 'drone',
    description:
      'A just major chord of pure partials over each low note, with air in it and a flanger moving in steps.',
    instrument: {
      deviceId: 'drone',
      preset: 'Major light',
      params: { movement: 0.7, rate: 0.3, cutoff: 7000, attack: 1.2, release: 5, volume: -6 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Stepped Random', params: { rate: 3, depth: 45, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'patch-cables-overtone-ferns',
    name: 'Overtone ferns',
    category: 'drone',
    description:
      'A buzzing harmonic series whose partials wander quickly, with shards of it scattered an octave up.',
    instrument: {
      deviceId: 'drone',
      preset: 'Tanpura',
      params: {
        movement: 1,
        rate: 0.6,
        sub: 0.2,
        cutoff: 5000,
        attack: 0.8,
        release: 5,
        width: 0.6,
        volume: -7,
      },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Glass shards', params: { spread: 0.7, mix: 0.35 } },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.25, decay: 6, width: 0.8 } },
    ],
  },

  // dusk
  {
    id: 'patch-cables-pulse-sequence',
    name: 'Pulse sequence',
    category: 'keys',
    preview: 'bells',
    description:
      'Plucked notes from a chorus polysynth, the filter closing fast on a moving pulse, with a dark echo.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Wide pulse',
      params: {
        sub: 0.3,
        cutoff: 500,
        resonance: 0.45,
        envelope: 0.85,
        attack: 0.002,
        release: 0.4,
        chorus: 1,
        volume: -3.8,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 375, tone: 4200, mix: 0.3 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'patch-cables-chorus-morning',
    name: 'Chorus morning',
    category: 'pad',
    description:
      'A bright sawtooth and pulse chord through both choruses, quick to speak, with a halo an octave and a fifth above.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: {
        sub: 0.1,
        lowCut: 2,
        cutoff: 12000,
        attack: 0.25,
        release: 2,
        chorus: 3,
        volume: -7,
      },
    },
    effects: [
      {
        deviceId: 'shimmer',
        preset: 'Fifths',
        params: { decay: 5, shimmer: 0.3, interval: 2, mix: 0.25 },
      },
    ],
  },

  // ember
  {
    id: 'patch-cables-held-and-sampled',
    name: 'Held and sampled',
    category: 'pad',
    description:
      'A sawtooth chord whose filter is thrown to a new random place seven times a second, with an echo.',
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: {
        cutoff: 1400,
        resonance: 0.5,
        filterEnvAmount: 0,
        ampAttack: 0.05,
        ampRelease: 1.2,
        lfo1Shape: 4,
        lfo1Rate: 7,
        lfo1Amount: 0.5,
        volume: -7,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 285, feedback: 0.4, spread: 0.6, mix: 0.25 },
      },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-glass-pluck-rising',
    name: 'Glass pluck rising',
    category: 'keys',
    description:
      'Triangle and thin pulse plucks with a snapping filter, trailed by grains an octave and a twelfth up.',
    instrument: {
      deviceId: 'ember',
      preset: 'Glass Pluck',
      params: { cutoff: 800, ampDecay: 1.2, ampRelease: 0.5, filterDecay: 0.2, volume: 5 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Grain shimmer', params: { delay: 125, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },

  // felt-piano
  {
    id: 'patch-cables-piano-climbing',
    name: 'Piano, climbing',
    category: 'keys',
    description:
      'A bare piano with no felt, each note repeated an octave higher and then higher again, in a plate.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Bare',
      params: { hardness: 0.7, reverbMix: 0, outputDb: -11 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Rising steps',
        params: { mode: 3, delay: 60, feedback: 0.45, mix: 0.3 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-ring-piano',
    name: 'Ring piano',
    category: 'keys',
    description:
      'A felted piano with a frequency shifter mixed in, so every note carries a second, bell-like pitch.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { hardness: 0.5, reverbMix: 0.1, outputDb: -15 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Bell metal', params: { shift: 147, mix: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },

  // grain-synth: for whatever sound is loaded
  {
    id: 'patch-cables-grain-bubbles',
    name: 'Grain bubbles',
    category: 'keys',
    description:
      'Whatever is loaded, in short grains that stutter forward through an old converter, with octave-hopping echoes.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Stutter',
      params: { size: 60, density: 5, scan: 0.8, shape: 0.6, release: 0.4, volume: -16 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Soft glaze' },
      {
        deviceId: 'analog-delay',
        preset: 'Octave hops',
        params: { time: 250, feedback: 0.45, mix: 0.3 },
      },
      { deviceId: 'shaped-reverb', preset: 'Short halo', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'patch-cables-grain-canopy',
    name: 'Grain canopy',
    category: 'pad',
    description:
      'Whatever is loaded, as a quick-speaking cloud with half its grains an octave up, wide in a hall.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Shimmer',
      params: { density: 10, attack: 0.3, release: 2.5, scan: 0.2, spread: 0.7, volume: -15.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow Drift', params: { spread: 70, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // guitar
  {
    id: 'patch-cables-quacking-neck',
    name: 'Quacking neck',
    category: 'plucked',
    description:
      'A clean electric guitar through a filter that opens with each pick stroke, with a chorused echo.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { hardness: 0.7, sustain: 4, strum: 0, volume: -2 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Touch wah',
        params: { mix: 1, type: 0, cutoffHz: 450, resonance: 4, envAmount: 75, envReleaseMs: 180 },
      },
      { deviceId: 'analog-delay', preset: 'Chorus echo', params: { time: 375, mix: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'patch-cables-swelled-and-stacked',
    name: 'Swelled and stacked',
    category: 'plucked',
    preview: 'chord',
    description:
      'A guitar chord faded in with the volume knob, stacked with octaves below and above until it is an organ.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { swell: 0.5, tone: 3800, volume: 1 },
    },
    effects: [
      {
        deviceId: 'octaves',
        preset: 'Organ',
        params: { sub2: 0, sub1: 0.4, up2: 0.4, filter: 9000 },
      },
      { deviceId: 'rotary', preset: 'Guitar swirl', params: { speed: 0, mix: 0.5 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },

  // handpan
  {
    id: 'patch-cables-pan-taps',
    name: 'Pan taps',
    category: 'bell',
    preview: 'keys',
    description:
      'A steel pan tapped near the rim and damped at once, each tap struck again in octaves as it fades.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Rain taps',
      params: { decay: 1.5, damp: 0.6, volume: 0 },
    },
    effects: [
      { deviceId: 'cascade', preset: 'Restruck', params: { time: 250, repeats: 5, mix: 0.4 } },
      { deviceId: 'swarm-reverb', preset: 'Pattering', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-tongue-drum-echo',
    name: 'Tongue drum echo',
    category: 'bell',
    preview: 'keys',
    description:
      'A soft steel tongue drum whose echoes come back from further off in memory, some of them backwards.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { decay: 4, touch: 0.3, volume: -2 },
    },
    effects: [
      {
        deviceId: 'echo-memory',
        preset: 'Backwards glances',
        params: { time: 375, reach: 6, mix: 0.35 },
      },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.2 } },
    ],
  },

  // harp
  {
    id: 'patch-cables-koto-backwards',
    name: 'Koto, backwards glass',
    category: 'plucked',
    description:
      'Silk strings plucked near the bridge, each note returning backwards and an octave higher.',
    instrument: {
      deviceId: 'harp',
      preset: 'Koto',
      params: { touch: 0.4, decay: 1.5, halo: 0.3, volume: -3 },
    },
    effects: [
      { deviceId: 'saturator', params: { curve: 3, driveDb: 18, outputDb: -8 } },
      {
        deviceId: 'reverse-delay',
        preset: 'Rising glass',
        params: { time: 500, feedback: 0.4, mix: 0.45 },
      },
      { deviceId: 'vowel-reverb', preset: 'Small chapel', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'patch-cables-harp-loop-sparkle',
    name: 'Harp loop sparkle',
    category: 'plucked',
    description:
      'A concert harp plucked low on the string, with a short loop of the last second at double speed over it.',
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { pluck: 0.14, decay: 0.8, halo: 0.5, volume: 1.5 },
    },
    effects: [
      {
        deviceId: 'micro-looper',
        preset: 'Octave sparkle',
        params: { length: 1, fade: 0.6, mix: 0.35 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },

  // horns
  {
    id: 'patch-cables-brass-triads',
    name: 'Brass triads',
    category: 'wind',
    description:
      'One breathy flugelhorn line made into close triads by two harmony voices from the scale.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { blow: 0.45, attack: 0.12, release: 0.8, vibrato: 0.15, volume: 0 },
    },
    effects: [
      {
        deviceId: 'lattice',
        preset: 'Diatonic thirds',
        params: { v2Degrees: 4, v2Level: -8, glide: 45, output: 5 },
      },
      { deviceId: 'dattorro', preset: 'ambient-live', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-horn-fifths',
    name: 'Horn fifths',
    category: 'wind',
    preview: 'low',
    description:
      'Low French horns with a fifth above every note, quick to enter, stacked open under a shimmering tremolo.',
    instrument: {
      deviceId: 'horns',
      preset: 'Horn swell',
      params: { blow: 0.65, attack: 0.2, release: 1.5, harmony: 0.5, volume: -2.4 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Harmonic shimmer', params: { rate: 4.5, depth: 0.6 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // ladder-bass
  {
    id: 'patch-cables-rubber-sequence',
    name: 'Rubber sequence',
    category: 'keys',
    description:
      'A one-voice rubbery bass pluck with echoes an octave above the line, heard through a small amplifier.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Rubber pluck',
      params: { cutoff: 400, decay: 1.5, glide: 0.02, volume: 2.5 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Octave hops',
        params: { time: 250, feedback: 0.4, tone: 5500, step: 0, mix: 0.4 },
      },
      { deviceId: 're-amp', preset: 'Combo in a room', params: { drive: 0.2, noise: 0.05 } },
    ],
  },
  {
    id: 'patch-cables-low-pedal-sawing',
    name: 'Low pedal, sawing',
    category: 'keys',
    preview: 'low',
    description:
      'A held bass note under a resonant filter that ramps open four times a second and drops shut again.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Pedal drone',
      params: { cutoff: 900, sub: 0.4, drive: 0.3, volume: -14 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        preset: 'Squelch',
        params: { cutoffHz: 500, resonance: 5, driveDb: 4, lfoAmount: 55 },
      },
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { spread: 0.8, time: 375, mix: 0.2 },
      },
    ],
  },

  // modal-bells
  {
    id: 'patch-cables-thumb-piano-crystals',
    name: 'Thumb piano crystals',
    category: 'bell',
    preview: 'keys',
    description:
      'Short damped metal tongues, with grains of each note coming back an octave up and scattered.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 2, hardness: 0.7, volume: -6 },
    },
    effects: [
      {
        deviceId: 'grain-delay',
        preset: 'Crystals',
        params: { time: 250, feedback: 0.35, mix: 0.3 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-music-box-inhale',
    name: 'Music box inhale',
    category: 'bell',
    description:
      'Hard small chime bars, each one followed by a reverb that swells up backwards and cuts off.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { decay: 3.5, brightness: 0.65, volume: 1 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Gentle Sweep', params: { mix: 0.25 } },
      { deviceId: 'shaped-reverb', preset: 'Backwards cloud', params: { time: 0.8, mix: 0.4 } },
    ],
  },

  // organ
  {
    id: 'patch-cables-chopped-flutes',
    name: 'Chopped flutes',
    category: 'organ',
    description:
      'A flute stop held as a chord and cut into even pulses, five a second, with backwards echoes filling the gaps.',
    instrument: {
      deviceId: 'organ',
      preset: 'Chapel flutes',
      params: { attack: 0.02, release: 0.3, fifteenth: 0.3, volume: -9 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Chopper', params: { rate: 5, depth: 0.9, smooth: 0.3 } },
      { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { time: 300, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-reed-organ-spinning',
    name: 'Reed organ, spinning',
    category: 'organ',
    description:
      'A pumped reed organ, its bellows breathing, through a rotating speaker turning at full speed.',
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { reed: 0.6, octave: 0.45, bellows: 0.6, tone: 4200, volume: -13.5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Tremolo', params: { drive: 0.15, distance: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
  },

  // outdoors
  {
    id: 'patch-cables-pond-with-hops',
    name: 'Pond with hops',
    category: 'texture',
    description:
      'A full spring pond of frogs close by, with echoes of them that jump a fifth up and a fourth down.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Spring pond',
      params: { distance: 0.3, attack: 0.5, width: 0.8, volume: -2.5 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Fifths and fourths',
        params: { time: 330, feedback: 0.5, tone: 5000, mix: 0.35 },
      },
      { deviceId: 'ambient-eq', preset: 'Texture' },
    ],
  },
  {
    id: 'patch-cables-birds-on-cables',
    name: 'Birds on cables',
    category: 'texture',
    description:
      'A dawn chorus up close, with quick backwards flickers of each call thrown to either side.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Dawn chorus',
      params: { density: 0.8, distance: 0.2, attack: 0.5, width: 0.8, volume: -6 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Flicker',
        params: { time: 180, spread: 0.7, mix: 0.35 },
      },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { mix: 0.2 } },
    ],
  },

  // pedal-steel
  {
    id: 'patch-cables-steel-bell-double',
    name: 'Steel bell double',
    category: 'plucked',
    description:
      'Hard-picked steel notes with no swell, doubled a few cents either side and wet with a chirping spring.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Picked bell',
      params: { pick: 0.7, sustain: 5, vibrato: 2, volume: -12 },
    },
    effects: [
      { deviceId: 'pitch-shifter', preset: 'Detuned double', params: { spread: 0.7, mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Surf drip', params: { mix: 0.25, drive: 0.3 } },
    ],
  },
  {
    id: 'patch-cables-steel-in-fifths',
    name: 'Steel in fifths',
    category: 'plucked',
    preview: 'line',
    description:
      'A singing steel line that slides between notes, shadowed a fifth and a ninth above, in a hall.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Singing lead',
      params: { swell: 0.3, vibrato: 12, tone: 3800, volume: -9 },
    },
    effects: [
      { deviceId: 'lattice', preset: 'Fifths up', params: { glide: 60, output: 5 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // sampler: for whatever sound is loaded
  {
    id: 'patch-cables-sample-in-thirds',
    name: 'Sample in thirds',
    category: 'wind',
    description:
      'Whatever is loaded, looped and played as a single line, with a third above and a sixth below added.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Soft flute',
      params: { attack: 0.04, release: 0.5, wobble: 0.1, tone: 10000, volume: -11.5 },
    },
    effects: [
      { deviceId: 'lattice', preset: 'Diatonic thirds', params: { glide: 30, mix: 55, output: 5 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-sample-octave-choir',
    name: 'Sample octave choir',
    category: 'pad',
    description:
      'Whatever is loaded, held on a smooth loop as a chord with octaves above and below, in an ensemble chorus.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Tape choir',
      params: { tune: 0, fine: 0, attack: 0.25, release: 2, tone: 9000, wobble: 0.25, volume: -14 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Octaves both',
        params: { levelB: 0.6, tone: 9000, mix: 0.35 },
      },
      { deviceId: 'chorus', preset: 'Lush Ensemble', params: { spread: 70, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // string-machine
  {
    id: 'patch-cables-ensemble-stabs',
    name: 'Ensemble stabs',
    category: 'string',
    preview: 'bells',
    description:
      'Short sawtooth string stabs with half the ensemble chorus on, swirled by a phaser, with tape repeats.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: { attack: 0.01, release: 0.3, high: 0.5, ensemble: 0.5, width: 0.6, volume: 1.7 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Classic 4-Stage', params: { rate: 0.6, mix: 0.35 } },
      {
        deviceId: 'tape-echo',
        preset: 'Short and soft',
        params: { time: 250, feedback: 0.4, mix: 0.3 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'patch-cables-top-octave-light',
    name: 'Top octave light',
    category: 'string',
    description:
      'A string ensemble with its low rank off and its top octave full up, thin and high, entering quickly in a hall.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 0.3, release: 2.5, tone: 8000, speed: 1.5, volume: -10.5 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Subtle halo' },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // tanpura
  {
    id: 'patch-cables-quick-cycle',
    name: 'Quick cycle',
    category: 'drone',
    description:
      'Four drone strings plucked round every two seconds, buzzing on the bridge, with octave echoes above.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: { jawari: 0.75, speed: 2, decay: 6, volume: -4 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Octave hops',
        params: { time: 330, feedback: 0.4, tone: 6000, mix: 0.25 },
      },
      { deviceId: 'sympathetic', preset: 'Open triad', params: { root: 2, mix: 0.3 } },
    ],
  },
  {
    id: 'patch-cables-seventh-string-halo',
    name: 'Seventh string halo',
    category: 'drone',
    description:
      'A drone lute tuned with the seventh on its first string, in a reverb whose tail slides up towards the octave.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Evening Ni',
      params: { speed: 3.5, decay: 12, spread: 0.6, volume: -3.5 },
    },
    effects: [{ deviceId: 'bloom-reverb', preset: 'Octave halo', params: { mix: 0.35 } }],
  },

  // tape-orchestra
  {
    id: 'patch-cables-tape-flutes-tongued',
    name: 'Tape flutes, tongued',
    category: 'wind',
    preview: 'bells',
    description:
      'Flutes from a strip of worn tape, played short so they bounce, repeated by dotted tape heads.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: { attack: 0.01, release: 0.15, age: 0.3, volume: -1 },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        preset: 'Three heads',
        params: { time: 250, feedback: 0.4, heads: 3, highCut: 6000, mix: 0.3 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'patch-cables-tape-choir-raised',
    name: 'Tape choir, raised',
    category: 'voice',
    description:
      'A taped choir with a wavering copy of itself an octave up, small and high like sped-up tape.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Tape choir',
      params: { attack: 0.1, release: 1.2, spread: 0.7, volume: -10 },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Octave up',
        params: { mode: 2, size: 80, jitter: 0.25, tone: 10000, mix: 0.4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // thesis
  {
    id: 'patch-cables-lydian-noise-strum',
    name: 'Lydian noise strum',
    category: 'plucked',
    description:
      'Bands of tuned noise struck in a quick strum, each key a small lydian chord, with a chorused echo.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Strummed Lydian',
      params: { resonance: 60, attack: 0.01, release: 0.9, strum: 60, root: 5 },
    },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { gain: -0.5 } },
      { deviceId: 'analog-delay', preset: 'Chorus echo', params: { time: 250, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-breathing-bands',
    name: 'Breathing bands',
    category: 'texture',
    description:
      'Three whistling bands of noise from one key, swelling in turn twice a second, chorused in a hall.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Pentatonic Breath',
      params: { resonance: 75, attack: 0.1, release: 2, breatheRate: 2 },
    },
    effects: [
      { deviceId: 'ambient-limiter', preset: 'Wall only', params: { gain: 9.5 } },
      { deviceId: 'chorus', preset: 'Wide Chorus', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },

  // tine-piano
  {
    id: 'patch-cables-tines-with-octaves',
    name: 'Tines with octaves',
    category: 'keys',
    description:
      'A bell-like electric piano with the octave above and below every note, in a light ensemble chorus.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { tremolo: 0, volume: -11.5 },
    },
    effects: [
      { deviceId: 'octaves', params: { sub1: 0.35, up1: 0.5, detune: 0.2, spread: 0.6 } },
      { deviceId: 'chorus', preset: 'Guitar Shimmer', params: { mix: 0.3 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-tines-turned-round',
    name: 'Tines turned round',
    category: 'keys',
    description:
      'Soft tines panning slowly from side to side, with backwards shards of each note in a small plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { bell: 0.65, tremolo: 0.5, tremoloRate: 0.6, volume: -13 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Backwards shards', params: { time: 375, mix: 0.35 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },

  // zither
  {
    id: 'patch-cables-hammered-patter',
    name: 'Hammered patter',
    category: 'plucked',
    description:
      'A dulcimer string kept sounding by quick hammer strokes, twelve a second, wide and close in a spring.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { chord: 0, roll: 12, decay: 4, release: 1.5, volume: -14 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Classic wide', params: { mix: 0.3 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'patch-cables-suspended-sweep',
    name: 'Suspended sweep',
    category: 'plucked',
    preview: 'bells',
    description:
      'Each key swept up and down as a suspended fourth chord, over tuned strings that ring on in sympathy.',
    instrument: {
      deviceId: 'zither',
      preset: 'Slow sus arpeggio',
      params: {
        chord: 6,
        strum: 300,
        roll: 0,
        decay: 6,
        release: 6,
        brightness: 0.65,
        volume: -5,
      },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Follow the melody', params: { decay: 3, mix: 0.3 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
]
