import { type FactoryPreset } from '../types'

// Faded Nature Film: detuned synthesizers off a wobbling reel, as heard under a
// 1970s nature documentary in a Scottish classroom. Pitch that leans, tops
// that are worn off, simple tunes, and the grit of an early sampler.

export const PRESETS: readonly FactoryPreset[] = [
  // dusk: the chorus polysynth, the pad the film opens on
  {
    id: 'nature-film-opening-titles',
    name: 'Opening titles',
    category: 'pad',
    description:
      'The chorus polysynth chord a film opens on, bounced to slow tape so it leans in pitch, in a small plate.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Soft strings',
      params: {
        cutoff: 1500,
        resonance: 0.2,
        envelope: 0.35,
        attack: 0.9,
        release: 3.5,
        chorus: 2,
        volume: -8.2,
      },
    },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { wow: 0.6, flutter: 0.3, speed: 2, age: 0.35, hiss: 0.2 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'nature-film-afternoon-programme',
    name: 'Afternoon programme',
    category: 'pad',
    description:
      'A thin moving pulse with the bass cut, swept by a slow phaser and copied to a worn cassette.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Wide pulse',
      params: { lowCut: 2, cutoff: 2200, attack: 0.5, release: 3, volume: -7 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { rate: 0.11, mix: 0.45 } },
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.5, noise: 0.3 } },
    ],
  },
  {
    id: 'nature-film-slow-migration',
    name: 'Slow migration',
    category: 'pad',
    description:
      'A chord that starts dark and opens through a resonant filter, with murky bucket-brigade repeats behind it.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Slow bloom',
      params: {
        sub: 0.6,
        cutoff: 260,
        resonance: 0.45,
        envelope: 0.85,
        attack: 2.5,
        release: 7,
        chorus: 3,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { damping: 0.6, mix: 0.25 } },
    ],
  },
  {
    id: 'nature-film-times-tables',
    name: 'Times tables',
    category: 'keys',
    description:
      'A plain square-wave key sound for simple tunes, through twelve-bit converters and a wobbling tape echo.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Shimmer organ',
      params: {
        sub: 0.4,
        cutoff: 1500,
        resonance: 0.25,
        envelope: 0.3,
        attack: 0.004,
        release: 0.6,
        chorus: 1,
        volume: -9,
      },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Twelve bit', params: { rate: 11000, jitter: 0.3 } },
      {
        deviceId: 'tape-echo',
        params: { time: 360, feedback: 0.4, wow: 0.45, flutter: 0.3, highCut: 3500, mix: 0.28 },
      },
    ],
  },
  {
    id: 'nature-film-peat-water-bass',
    name: 'Peat water bass',
    category: 'drone',
    description:
      'A square wave over its sub octave under a nearly closed filter, pushed into a tape preamp: a dark low bed.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Sub floor',
      params: {
        sub: 0.55,
        cutoff: 520,
        resonance: 0.3,
        envelope: 0.2,
        attack: 0.8,
        release: 4,
        chorus: 2,
        volume: -17.3,
      },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Tape weight', params: { output: -9 } },
      { deviceId: 'zita-rev1', preset: 'Room' },
    ],
  },
  {
    id: 'nature-film-hill-whistle',
    name: 'Hill whistle',
    category: 'keys',
    description:
      'The filter whistling on its own resonance over each note, with tape vibrato and three echo heads.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Singing filter',
      params: { attack: 0.25, release: 2.5, chorus: 1, volume: -9 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Pitch wobble', params: { phase: 0, rate: 4.6, depth: 0.35 } },
      {
        deviceId: 'tape-echo',
        params: { time: 480, feedback: 0.45, heads: 2, wow: 0.4, spread: 0.5, mix: 0.3 },
      },
    ],
    preview: 'line',
  },

  // ember: two detuned oscillators with a slow hand on the pitch
  {
    id: 'nature-film-buckled-reel-pad',
    name: 'Buckled reel pad',
    category: 'pad',
    description:
      'Detuned saws whose pitch is leaned on by a slow oscillator, as if the reel were buckled, through chorus and tape.',
    instrument: {
      deviceId: 'ember',
      preset: 'Warm pad',
      params: {
        osc2Fine: 14,
        cutoff: 1100,
        ampAttack: 0.8,
        ampRelease: 4,
        lfo2Shape: 0,
        lfo2Rate: 0.55,
        lfo2Dest: 0,
        lfo2Amount: 0.012,
        unisonVoices: 3,
        unisonDetune: 24,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush Ensemble', params: { mix: 0.35 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.45, speed: 2 } },
    ],
  },
  {
    id: 'nature-film-narrator-theme',
    name: 'Narrator theme',
    category: 'keys',
    description:
      'A triangle and thin pulse lead that slides a little between overlapping notes, with vibrato, in chorus and dark repeats.',
    instrument: {
      deviceId: 'ember',
      preset: 'Init',
      params: {
        osc1Shape: 2,
        osc2Shape: 1,
        osc2Fine: 6,
        osc2Pw: 0.4,
        oscMix: 0.35,
        cutoff: 1800,
        resonance: 0.15,
        keyTrack: 0.5,
        ampAttack: 0.03,
        ampDecay: 0.6,
        ampSustain: 0.8,
        ampRelease: 0.5,
        velToAmp: 0.4,
        lfo2Rate: 5.1,
        lfo2Dest: 0,
        lfo2Amount: 0.015,
        voiceMode: 2,
        glide: 0.07,
        volume: -1,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Classic Chorus', params: { mix: 0.3 } },
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { time: 410, mix: 0.28 } },
    ],
    preview: 'line',
  },
  {
    id: 'nature-film-schools-ident',
    name: 'Schools ident',
    category: 'pad',
    description:
      'Synthetic brass that opens and settles in under a second, like a broadcast ident, sampled at twelve bits.',
    instrument: {
      deviceId: 'ember',
      preset: 'Brass',
      params: {
        osc2Fine: 12,
        cutoff: 700,
        filterEnvAmount: 0.5,
        filterAttack: 0.15,
        filterDecay: 0.8,
        filterSustain: 0.5,
        ampAttack: 0.06,
        ampRelease: 0.9,
        unisonVoices: 2,
        unisonDetune: 16,
        volume: -7,
      },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Twelve bit', params: { rate: 12000 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.22 } },
    ],
  },
  {
    id: 'nature-film-soundtrack-surf',
    name: 'Soundtrack surf',
    category: 'texture',
    description:
      'Filtered noise that swells and falls like surf on a film soundtrack, with the wobble and wear of a reel.',
    instrument: {
      deviceId: 'ember',
      preset: 'Noise Sweep',
      params: {
        osc1Coarse: -24,
        osc1Fine: -100,
        cutoff: 250,
        resonance: 0.45,
        filterEnvAmount: 0.4,
        filterAttack: 1.8,
        filterDecay: 4,
        filterSustain: 0.35,
        ampAttack: 1.2,
        ampRelease: 3,
        lfo1Rate: 0.12,
        lfo1Dest: 1,
        lfo1Amount: 0.2,
        volume: 6,
      },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.4, output: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'nature-film-pond-skaters',
    name: 'Pond skaters',
    category: 'plucked',
    description:
      'A soft triangle pluck with a quick filter, skipping across dotted tape echoes into a small plate.',
    instrument: {
      deviceId: 'ember',
      preset: 'Glass Pluck',
      params: {
        cutoff: 800,
        resonance: 0.3,
        filterEnvAmount: 0.6,
        filterDecay: 0.5,
        filterSustain: 0.25,
        ampDecay: 1.5,
        ampRelease: 0.8,
        unisonVoices: 2,
        unisonDetune: 12,
        volume: 6,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: { time: 300, feedback: 0.5, heads: 3, wow: 0.35, spread: 0.6, mix: 0.4 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.18 } },
    ],
  },
  {
    id: 'nature-film-deep-water-footage',
    name: 'Deep water footage',
    category: 'drone',
    description:
      'A low saw and pulse drone with a slow filter, heard as if through water by a starved stream, then on tape.',
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: { subLevel: 0.2, cutoff: 400, ampAttack: 2, ampRelease: 6, volume: -9.5 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Underwater' },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.5 } },
    ],
  },

  // string-machine: the seventies ensemble, phased and worn
  {
    id: 'nature-film-phased-string-reel',
    name: 'Phased string reel',
    category: 'string',
    description:
      'A seventies string ensemble through a slow six-stage phaser and onto quarter-inch tape that wows a little.',
    instrument: {
      deviceId: 'string-machine',
      params: { attack: 0.8, release: 2.8, tone: 3600, ensemble: 0.85, drift: 0.45, volume: -5 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Warm Six-Stage',
        params: { rate: 0.14, depth: 70, mix: 0.5 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4, flutter: 0.25 } },
    ],
  },
  {
    id: 'nature-film-aerial-shot',
    name: 'Aerial shot',
    category: 'string',
    description:
      'The ensemble with its upper octave full and no low octave, thin and high like a shot from above a glen, on a worn reel in a hall.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 1.6, release: 4.5, tone: 5200, ensemble: 0.8, volume: -11 },
    },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Quarter inch reel',
        params: { wobble: 0.45, wear: 0.5, tone: 0.4 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'nature-film-riverbed-cellos',
    name: 'Riverbed cellos',
    category: 'string',
    description:
      'The ensemble with its low octave full and no upper octave, dull and slow, warmed by a tape preamp in a small dark room.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Cellos',
      params: { attack: 2.2, release: 3.5, tone: 1000, drift: 0.55, volume: -8 },
    },
    effects: [
      { deviceId: 'analog-drive', preset: 'Warm glue' },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.3 } },
    ],
    preview: 'low',
  },
  {
    id: 'nature-film-half-speed-strings',
    name: 'Half speed strings',
    category: 'string',
    description:
      'Strings that swell in slowly, with the same strings an octave down at half speed under them.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { attack: 2.5, release: 6, volume: -7 },
    },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Continuous octave',
        params: { highCut: 5000, mix: 0.5 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { damping: 0.6, mix: 0.25 } },
    ],
  },
  {
    id: 'nature-film-sampler-string-stab',
    name: 'Sampler string stab',
    category: 'keys',
    description:
      'A short string chord as an old sampler would replay it, gritty and band-limited, repeating darkly.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Dry saws',
      params: {
        attack: 0.01,
        release: 0.9,
        low: 0.5,
        tone: 3800,
        ensemble: 0.6,
        width: 0.6,
        volume: -7,
      },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty sampler', params: { jitter: 0.4, drive: 4 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 450, feedback: 0.5, mix: 0.3 },
      },
    ],
  },
  {
    id: 'nature-film-evening-heather',
    name: 'Evening heather',
    category: 'string',
    description:
      'The string ensemble played as a single line, its chorus turning quickly, under a slow flanger and a drifting detune.',
    instrument: {
      deviceId: 'string-machine',
      params: {
        attack: 0.12,
        release: 1.4,
        low: 0.1,
        high: 0.75,
        tone: 2600,
        ensemble: 0.55,
        speed: 1.5,
        drift: 0.7,
        width: 0.6,
        volume: -1.2,
      },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow Sweep', params: { feedback: 20, mix: 0.35 } },
      { deviceId: 'stereo-detune', preset: 'Seasick', params: { detune: 25, mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
    preview: 'line',
  },

  // aurora: two-layer brass and strings, the big polysynth of the period
  {
    id: 'nature-film-documentary-brass',
    name: 'Documentary brass',
    category: 'pad',
    description:
      'Detuned two-layer brass that starts dark and overshoots, wobbling on slow tape under the narrator.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: { brilliance: 950, attack: 0.5, swell: 0.6, release: 3.5, detune: 16, volume: -10 },
    },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { wow: 0.55, flutter: 0.25, speed: 2 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'nature-film-faded-horn-call',
    name: 'Faded horn call',
    category: 'pad',
    description:
      'Soft synthetic horns that speak slowly, with the worn top of an old reel and a chorused echo.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: { brilliance: 700, attack: 1.2, release: 4.5, detune: 12, volume: -13 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.4, wear: 0.55 } },
      { deviceId: 'analog-delay', preset: 'Chorus echo', params: { time: 340, mix: 0.3 } },
    ],
  },
  {
    id: 'nature-film-spinning-globe',
    name: 'Spinning globe',
    category: 'keys',
    description:
      'A quick brass stab with a filter overshoot, the fanfare before a programme, glazed by old converters.',
    instrument: {
      deviceId: 'aurora',
      params: {
        brilliance: 1600,
        resonance: 0.3,
        contour: 0.85,
        attack: 0.03,
        swell: 0.2,
        release: 1.4,
        detune: 10,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Soft glaze' },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'nature-film-after-closedown',
    name: 'After closedown',
    category: 'pad',
    description:
      'A narrow resonant band that sounds almost sung, swirling as if behind glass, with a slow chorus.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Night choir',
      params: { attack: 1.6, release: 5, detune: 14, volume: -10 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Behind glass', params: { loss: 0.55 } },
      { deviceId: 'chorus', preset: 'Slow Drift', params: { mix: 0.35 } },
    ],
  },
  {
    id: 'nature-film-bothy-tin-roof',
    name: 'Bothy tin roof',
    category: 'pad',
    description:
      'Each note opens with a falling metallic ring that melts into the pad, phased, with backwards echoes.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Metal dawn',
      params: { brilliance: 1300, attack: 0.25, release: 5, ring: 0.4, volume: -8 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Deep 8-Stage', params: { rate: 0.1, mix: 0.4 } },
      { deviceId: 'reverse-delay', preset: 'Backwards echo', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'nature-film-loch-at-daybreak',
    name: 'Loch at daybreak',
    category: 'pad',
    description:
      'A dark brass chord that takes three seconds to bloom and keeps swelling, in a wide, dull space.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow bloom',
      params: { brilliance: 600, lowCut: 30, attack: 3.5, release: 9, detune: 14, volume: -7.5 },
    },
    effects: [
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 9000 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 7, highCut: 4000, mix: 0.3 } },
    ],
  },

  // wavetable: voices, reeds and plain tones from a science film
  {
    id: 'nature-film-vowel-lesson',
    name: 'Vowel lesson',
    category: 'pad',
    description:
      'The vowel table mouthing slowly through a chord, like a voice held on the keys of a twelve-bit sampler.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: {
        position: 0.4,
        motion: 0.9,
        rate: 0.08,
        detune: 18,
        cutoff: 3800,
        spread: 0.6,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'patina', preset: 'Early sampler', params: { wear: 0.35 } },
      {
        deviceId: 'tape-echo',
        params: { time: 520, feedback: 0.35, wow: 0.35, highCut: 3800, spread: 0.5, mix: 0.22 },
      },
    ],
  },
  {
    id: 'nature-film-portable-keyboard',
    name: 'Portable keyboard',
    category: 'keys',
    description:
      'A reedy key sound from two detuned oscillators, given tape vibrato and bounced to a four-track cassette.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: {
        position: 0.25,
        motion: 0.3,
        detune: 14,
        sub: 0.3,
        cutoff: 2000,
        attack: 0.02,
        release: 0.9,
        volume: -13,
      },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Pitch wobble', params: { phase: 0, rate: 4.8, depth: 0.35 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.3 } },
    ],
  },
  {
    id: 'nature-film-hollow-log',
    name: 'Hollow log',
    category: 'pad',
    description:
      'A hollow, woody chord with a soft resonance drifting through its table, under a very slow phaser.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: {
        detune: 20,
        cutoff: 1400,
        resonance: 0.35,
        attack: 2,
        release: 5.5,
        spread: 0.6,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { stereo: 60, mix: 0.45 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'nature-film-frosted-lens',
    name: 'Frosted lens',
    category: 'pad',
    description:
      'The glass table rippling fast enough to hear, with the faint hold images of an early converter left unfiltered.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: {
        position: 0.6,
        motion: 0.6,
        rate: 0.4,
        detune: 14,
        cutoff: 5200,
        attack: 0.4,
        release: 3,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glass images', params: { rate: 10000 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'nature-film-oscilloscope-trace',
    name: 'Oscilloscope trace',
    category: 'keys',
    description:
      'Two near-sine waves beating slowly, a tone from a science film, with a seasick detune and dark echoes.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: {
        detune: 9,
        sub: 0.3,
        cutoff: 1600,
        attack: 0.05,
        release: 1.2,
        spread: 0.5,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Seasick', params: { mix: 0.3 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 500, feedback: 0.5, mix: 0.3 },
      },
    ],
    preview: 'line',
  },
  {
    id: 'nature-film-cloud-chart',
    name: 'Cloud chart',
    category: 'pad',
    description:
      'A shifting spectral chord that arrives slowly, half heard through a transistor radio, then chorused.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Spectral cloud',
      params: { rate: 0.05, cutoff: 5000, attack: 3.5, release: 8, volume: -5 },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Clean transistor',
        params: { drift: 0.2, fading: 0.2, bandwidth: 0.7, mix: 0.6 },
      },
      { deviceId: 'chorus', preset: 'Lush Ensemble', params: { mix: 0.4 } },
    ],
  },

  // ladder-bass: round detuned basses and one sliding lead
  {
    id: 'nature-film-corduroy-bass',
    name: 'Corduroy bass',
    category: 'keys',
    description:
      'Two saws tuned wide enough to beat, a quick resonant filter and a sub: a round, wobbly bass for a simple riff.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Sequence bass',
      params: {
        beat: 13,
        sub: 0.45,
        cutoff: 420,
        emphasis: 0.4,
        contour: 0.65,
        decay: 0.9,
        drive: 0.4,
        glide: 0.05,
        volume: -3.5,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { drive: 0.45, wow: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.15 } },
    ],
    preview: 'line',
  },
  {
    id: 'nature-film-curlew-lead',
    name: 'Curlew lead',
    category: 'keys',
    description:
      'A round solo voice that slides between overlapping notes and wavers like tape, with chorused bucket-brigade echoes.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Singing lead',
      params: { wave: 0.4, beat: 8, cutoff: 1300, emphasis: 0.5, glide: 0.16, volume: 2 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Pitch wobble', params: { phase: 0, rate: 5, depth: 0.3 } },
      { deviceId: 'analog-delay', preset: 'Chorus echo', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'nature-film-underfloor-hum',
    name: 'Underfloor hum',
    category: 'drone',
    description:
      'A soft sub tone with almost nothing above it, lightly saturated, over the faint mains hum of the room.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Soft sub',
      params: { beat: 5, cutoff: 160, drive: 0.15, volume: -22 },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { outputDb: -2, driveDb: 6 } },
      { deviceId: 'noise-floor', params: { type: 3, level: -44, movement: 0.2, width: 0.4 } },
    ],
    preview: 'low',
  },
  {
    id: 'nature-film-rock-pool',
    name: 'Rock pool',
    category: 'keys',
    description:
      'A low note that opens bright and resonant, then closes and fades over several seconds, under a slow hollow phaser in a hall.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Slow opener',
      params: {
        beat: 10,
        sub: 0.5,
        cutoff: 220,
        emphasis: 0.6,
        contour: 0.8,
        decay: 9,
        volume: -2,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Negative Notch', params: { rate: 0.12, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.28 } },
    ],
    preview: 'low',
  },
  {
    id: 'nature-film-rubber-boots',
    name: 'Rubber boots',
    category: 'keys',
    description:
      'A short rubbery bass pluck replayed by a gritty old sampler, with a one-head tape echo behind each note.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Rubber pluck',
      params: { cutoff: 320, decay: 0.9, drive: 0.55, volume: 4 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty sampler', params: { jitter: 0.3 } },
      {
        deviceId: 'tape-echo',
        params: { time: 330, feedback: 0.35, wow: 0.3, mix: 0.25 },
      },
    ],
    preview: 'line',
  },
  {
    id: 'nature-film-pylon-drone',
    name: 'Pylon drone',
    category: 'drone',
    description:
      'Two saws tuned well apart and beating under a half-closed filter, with a deep slow chorus and reel wobble.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Pedal drone',
      params: { beat: 22, sub: 0.5, cutoff: 500, emphasis: 0.25, drive: 0.35, volume: -8 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Deep Sea', params: { mix: 0.4 } },
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.5 } },
    ],
    preview: 'low',
  },

  // tape-orchestra: the tape-replay keyboard, its flutes above all
  {
    id: 'nature-film-faded-flutes',
    name: 'Faded flutes',
    category: 'wind',
    description:
      'Tape-replay flutes on a tired strip, copied again to slow tape so every note sags and recovers.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Flutes on tape',
      params: {
        age: 0.65,
        hiss: 0.3,
        tone: -0.2,
        attack: 0.04,
        release: 0.6,
        vibrato: 0.5,
        volume: -5,
      },
    },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { wow: 0.6, flutter: 0.35, speed: 2, hiss: 0.15 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'nature-film-hymn-practice',
    name: 'Hymn practice',
    category: 'voice',
    description:
      'A tape-replay choir on worn tape, heard from down the corridor through a speaker in another room.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Worn choir',
      params: { age: 0.7, attack: 0.4, release: 1.8, spread: 0.5, volume: -10 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall', params: { distance: 0.7, room: 0.6 } },
    ],
  },
  {
    id: 'nature-film-estuary-cellos',
    name: 'Estuary cellos',
    category: 'string',
    description:
      'Cellos from a tape strip run at half speed, an octave down and slow to speak, with long murky repeats.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Cello bed',
      params: { age: 0.5, attack: 0.8, release: 3, volume: -9 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { mix: 0.25 } },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'nature-film-resampled-violins',
    name: 'Resampled violins',
    category: 'string',
    description:
      'Three tape-replay violins playing a line, sampled again at twelve bits, with a single tape echo.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Three violins',
      params: { age: 0.55, attack: 0.03, release: 0.5, volume: -3.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Early sampler', params: { wear: 0.35, wobble: 0.25 } },
      {
        deviceId: 'tape-echo',
        params: { time: 420, feedback: 0.4, mix: 0.28 },
      },
    ],
    preview: 'line',
  },
  {
    id: 'nature-film-wind-band-reel',
    name: 'Wind band reel',
    category: 'wind',
    description:
      'A reed section from tape, held as a chord under a slow four-stage phaser and a dark spring.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Orchestra reeds',
      params: { age: 0.45, attack: 0.15, release: 1, players: 0.8, volume: -8 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Classic 4-Stage', params: { rate: 0.2, mix: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { mix: 0.25, width: 0.6 } },
    ],
    preview: 'chord',
  },
  {
    id: 'nature-film-library-record-horns',
    name: 'Library record horns',
    category: 'wind',
    description:
      'Tape horns at half speed, an octave down, pressed to a worn library record with its crackle and slow wobble.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Half-speed horns',
      params: { age: 0.6, volume: -13.5 },
    },
    effects: [
      { deviceId: 'vinyl', preset: 'Charity shop find', params: { crackle: 0.25, pops: 0.1 } },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },

  // tine-piano: the electric piano, phased, wobbling, or from a small speaker
  {
    id: 'nature-film-wet-playtime',
    name: 'Wet playtime',
    category: 'keys',
    description:
      'A soft tine piano on tape whose speed swims, so held notes bend down and come back, in a small room.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Soft suitcase',
      params: { decay: 1.3, release: 0.5, tremolo: 0.2, tone: 0.45, volume: -14.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.7, hiss: 0.2 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'nature-film-phaser-pedal-tines',
    name: 'Phaser pedal tines',
    category: 'keys',
    description:
      'Dull, soft tines through a six-stage phaser with the feedback up, the seventies way, in a small plate.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { decay: 1.6, tone: 0.35, volume: -13 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Warm Six-Stage',
        params: { feedback: 55, rate: 0.35, mix: 0.5 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'nature-film-toy-sampler-tines',
    name: 'Toy sampler tines',
    category: 'keys',
    description:
      'Bell-like tines through the converters of a toy sampler, aliasing a little, with dark repeats.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Bell tines',
      params: { decay: 1.4, tremolo: 0, volume: -14 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Eight bit toy', params: { rate: 9000, bits: 10 } },
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { mix: 0.28 } },
    ],
  },
  {
    id: 'nature-film-film-strip-keys',
    name: 'Film strip keys',
    category: 'keys',
    description:
      'Tines drifting slowly from side to side, thickened by an ensemble chorus and printed to tape.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { tremolo: 0.6, tremoloRate: 0.6, volume: -12 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Lush Ensemble', params: { mix: 0.4 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35 } },
    ],
  },
  {
    id: 'nature-film-rewound-tines',
    name: 'Rewound tines',
    category: 'keys',
    description:
      'Long-ringing tines with each note answered backwards, swelling in after it and cutting off, in a hall.',
    instrument: { deviceId: 'tine-piano', preset: 'Long sustain', params: { volume: -14 } },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { time: 1200, mix: 0.55 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'nature-film-television-trolley',
    name: 'Television trolley',
    category: 'keys',
    description:
      'A barking tine piano from the small speaker of a classroom television, with the room and the hum of the set.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Barking stage',
      params: { bark: 0.6, hardness: 0.8, drive: 0.3, volume: -15.5 },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Bedside radio', params: { distance: 0.4, room: 0.45 } },
      { deviceId: 'noise-floor', params: { type: 3, level: -46, width: 0.3 } },
    ],
  },

  // felt-piano: the upright in the hall, and the same piano in a sampler
  {
    id: 'nature-film-school-hall-piano',
    name: 'School hall piano',
    category: 'keys',
    description:
      'The upright in the school hall with its strings gone a little sour, on tape that swims, in the empty room.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: {
        felt: 0.5,
        hardness: 0.4,
        detune: 0.85,
        pedalNoise: 0.5,
        reverbMix: 0.1,
        outputDb: -18,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.6, hiss: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { size: 1, mix: 0.3 } },
    ],
  },
  {
    id: 'nature-film-sampled-felt-piano',
    name: 'Sampled felt piano',
    category: 'keys',
    description:
      'A close, felted piano as an early sampler holds it: short of top and grainy, with dull echoes.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: { grit: 0.4, resonance: 0.2, reverbMix: 0, polyphony: 16, outputDb: -15 },
    },
    effects: [
      {
        deviceId: 'vintage-digital',
        preset: 'Dusty sampler',
        params: { rate: 9000, jitter: 0.35, drive: 6 },
      },
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 520, feedback: 0.4, mix: 0.25 },
      },
    ],
  },

  // acoustic-guitar: fingerpicking on tape that will not hold its pitch
  {
    id: 'nature-film-caravan-guitar',
    name: 'Caravan guitar',
    category: 'plucked',
    description:
      'A fingerpicked steel-string on slow tape whose pitch sags and recovers, with a light phaser over it.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Steel fingerstyle',
      params: { body: 0.8, nail: 0.35, release: 2, tone: 0.5, volume: 2.5 },
    },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { wow: 0.7, flutter: 0.3, speed: 2, age: 0.4 },
      },
      {
        deviceId: 'phaser',
        preset: 'Classic 4-Stage',
        params: { rate: 0.18, depth: 45, mix: 0.3 },
      },
    ],
  },
  {
    id: 'nature-film-holiday-cassette',
    name: 'Holiday cassette',
    category: 'plucked',
    description:
      'A soft nylon-string guitar on a cassette left in the car, dull and wobbling, with a faint tape echo.',
    instrument: { deviceId: 'acoustic-guitar', preset: 'Nylon dusk', params: { volume: 0.5 } },
    effects: [
      { deviceId: 'patina', preset: 'Worn cassette', params: { wobble: 0.55 } },
      { deviceId: 'tape-echo', params: { time: 300, feedback: 0.3, wow: 0.4, mix: 0.2 } },
    ],
  },

  // guitar: clean, doubled out of tune, or turned round
  {
    id: 'nature-film-chalet-guitar',
    name: 'Chalet guitar',
    category: 'plucked',
    description:
      'A clean neck pickup doubled a few cents out, with dull echoes that bring back bits of what was played.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Glass neck',
      params: { hardness: 0.45, tone: 3000, warmth: 0.5, volume: -1 },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Thick double', params: { detune: 16 } },
      { deviceId: 'echo-memory', preset: 'Half-remembered', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'nature-film-reversed-guitar-reel',
    name: 'Reversed guitar reel',
    category: 'plucked',
    description:
      'Swelled guitar chords with no pick attack, turned round by a backwards echo and printed to wowing tape.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { swell: 0.9, volume: 6 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 800, smooth: 0.6, mix: 0.5 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.5, output: 2 } },
    ],
    preview: 'chord',
  },

  // pedal-steel: swells on a record that is not flat, slides under a phaser
  {
    id: 'nature-film-bent-record-steel',
    name: 'Bent record steel',
    category: 'plucked',
    description:
      'A swelled steel guitar chord pressed to a record that is not flat, so the whole chord bends once a turn.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 1.2, sustain: 30, vibrato: 4, tone: 2200, volume: -11.8 },
    },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'Slow platter',
        params: { crackle: 0.15, pops: 0.03, surface: 0.15, tone: -0.2 },
      },
      { deviceId: 'dattorro', preset: 'Long plate', params: { mix: 0.25 } },
    ],
    preview: 'chord',
  },
  {
    id: 'nature-film-sliding-credits',
    name: 'Sliding credits',
    category: 'plucked',
    description:
      'Overlapping steel notes that slide a long way into each other, under a slow phaser and a long spring.',
    instrument: { deviceId: 'pedal-steel', preset: 'Long slides', params: { volume: -4.8 } },
    effects: [
      { deviceId: 'phaser', preset: 'Warm Six-Stage', params: { rate: 0.2, mix: 0.35 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } },
    ],
  },

  // harp: a television cue, and a harp with its detail thrown away
  {
    id: 'nature-film-flashback-harp',
    name: 'Flashback harp',
    category: 'plucked',
    description:
      'A chord rolled up the harp from its lowest string, the cue for a flashback, glazed by old converters, with tape echo.',
    instrument: {
      deviceId: 'harp',
      preset: 'Glissando',
      params: { sweep: 0.9, volume: -4.8 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Soft glaze', params: { rate: 13000 } },
      {
        deviceId: 'tape-echo',
        params: { time: 400, feedback: 0.4, heads: 1, wow: 0.35, mix: 0.25 },
      },
    ],
    preview: 'chord',
  },
  {
    id: 'nature-film-harp-under-glass',
    name: 'Harp under glass',
    category: 'plucked',
    description:
      'Dry plucks near the soundboard with the quiet detail thrown away, each answered by a short backwards cloud.',
    instrument: {
      deviceId: 'harp',
      preset: 'Near the soundboard',
      params: { decay: 0.7, volume: 3.5 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Behind glass', params: { loss: 0.6 } },
      { deviceId: 'shaped-reverb', preset: 'Backwards cloud', params: { time: 0.8, mix: 0.35 } },
    ],
  },

  // chord-harp: the strum-plate toy of the period
  {
    id: 'nature-film-strum-plate-lullaby',
    name: 'Strum plate lullaby',
    category: 'plucked',
    description:
      'A chord harp strummed slowly over its own soft pad, chorused and bounced to a cassette that wows.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Evening strum',
      params: { strum: 70, sustain: 4, tone: 0.4, pad: 0.45, volume: -8 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Wide Chorus', params: { mix: 0.4 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { wow: 0.5 } },
    ],
  },
  {
    id: 'nature-film-toy-shop-harp',
    name: 'Toy shop harp',
    category: 'plucked',
    description:
      'A short toy strum over one octave, through eight-bit converters with companding, in a small room.',
    instrument: { deviceId: 'chord-harp', preset: 'Toy harp', params: { volume: -1 } },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Eight bit toy' },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },

  // zither: the box of strings from the music room
  {
    id: 'nature-film-music-room-zither',
    name: 'Music room zither',
    category: 'plucked',
    description:
      'A minor chord zither strummed with a pick, on tape that swims badly, with a spring tank behind it.',
    instrument: {
      deviceId: 'zither',
      preset: 'Chord zither minor',
      params: { brightness: 0.5, volume: -4.2 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.8, hiss: 0.2 } },
      { deviceId: 'spring-reverb', preset: 'Two spring tank', params: { mix: 0.25 } },
    ],
    preview: 'hold',
  },
  {
    id: 'nature-film-hammered-film-score',
    name: 'Hammered film score',
    category: 'plucked',
    description:
      'A dulcimer rolled with hammers into a shimmer, phased slowly, with three echo heads trailing.',
    instrument: { deviceId: 'zither', preset: 'Hammered shimmer', params: { volume: -8 } },
    effects: [
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { rate: 0.1, mix: 0.4 } },
      { deviceId: 'tape-echo', params: { time: 560, feedback: 0.4, heads: 2, mix: 0.25 } },
    ],
  },

  // handpan: steel, slowed and sampled
  {
    id: 'nature-film-slowed-tongue-drum',
    name: 'Slowed tongue drum',
    category: 'bell',
    description:
      'A tongue drum with its own notes coming back an octave down at half speed, through twelve-bit converters.',
    instrument: { deviceId: 'handpan', preset: 'Tongue drum', params: { volume: -5 } },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Half speed',
        params: { length: 1400, smooth: 0.8, highCut: 4000, mix: 0.6 },
      },
      { deviceId: 'vintage-digital', preset: 'Twelve bit' },
    ],
  },
  {
    id: 'nature-film-steel-pan-postcard',
    name: 'Steel pan postcard',
    category: 'bell',
    description:
      'A hand-played pan with a short loop of itself running under it on a slow clock, and dark repeats.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Soft hands',
      params: { decay: 2.5, shimmer: 0.3, volume: 0 },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Lo-fi quarter', params: { mix: 0.3 } },
      {
        deviceId: 'analog-delay',
        preset: 'Dark repeats',
        params: { time: 375, feedback: 0.5, mix: 0.3 },
      },
    ],
  },

  // mallets: the music trolley
  {
    id: 'nature-film-vibraphone-reel',
    name: 'Vibraphone reel',
    category: 'bell',
    description:
      'A vibraphone with its motor throbbing, on slow tape that leans in pitch, in a small plate.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { mallet: 0.35, motor: 0.6, motorRate: 3.8, volume: -8 },
    },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { wow: 0.6, flutter: 0.3, speed: 2 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'nature-film-classroom-glockenspiel',
    name: 'Classroom glockenspiel',
    category: 'bell',
    description:
      'The glockenspiel from the music trolley, struck plainly, with worn converters and a wobbling tape echo.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { mallet: 0.6, volume: -4 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Worn converter', params: { jitter: 0.5 } },
      {
        deviceId: 'tape-echo',
        params: { time: 340, feedback: 0.45, wow: 0.4, flutter: 0.3, mix: 0.3 },
      },
    ],
  },

  // modal-bells: a music box, and a bell across the valley
  {
    id: 'nature-film-nursery-music-box',
    name: 'Nursery music box',
    category: 'bell',
    description:
      'A music box with hard little bars, on a cassette whose speed flutters, in a small room.',
    instrument: { deviceId: 'modal-bells', preset: 'Music box', params: { volume: -4 } },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Cassette four-track',
        params: { wow: 0.65, flutter: 0.5, age: 0.5 },
      },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'nature-film-far-sunday-bell',
    name: 'Far Sunday bell',
    category: 'bell',
    description:
      'A church bell across the valley, its top worn off by tape and distance, with sparse far echoes.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: { decay: 14, volume: -7 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { air: -6, highCut: 4000 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.4 } },
    ],
  },

  // fm-glass: the digital keyboard that came later, put on the same tape
  {
    id: 'nature-film-digital-tine-keys',
    name: 'Digital tine keys',
    category: 'keys',
    description:
      'A four-operator electric piano, soft and round, through a chorus and onto tape that wows.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Tine keys',
      params: { brightness: 0.3, decay: 2, release: 0.8, volume: -8.5 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Classic Chorus', params: { mix: 0.4 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.5, flutter: 0.3 } },
    ],
  },
  {
    id: 'nature-film-crystal-set-pad',
    name: 'Crystal set pad',
    category: 'pad',
    description:
      'A four-operator held chord narrowed by a medium-wave set and its small speaker, then swept by a slow phaser.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: { brightness: 0.28, attack: 1.2, volume: -14 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Kitchen radio', params: { mix: 0.7 } },
      { deviceId: 'phaser', preset: 'Slow Swirl', params: { mix: 0.4 } },
    ],
  },

  // bowed-string: one cello, one string held without a bow
  {
    id: 'nature-film-lone-cello-reel',
    name: 'Lone cello reel',
    category: 'string',
    description: 'One bowed cello line with a slow vibrato, on worn slow tape in a hall.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: { attack: 0.5, vibrato: 0.3, vibratoRate: 3.8, volume: -8.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.55, speed: 2, age: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },
  {
    id: 'nature-film-held-string-drifting',
    name: 'Held string, drifting',
    category: 'string',
    description:
      'A string held singing with no bow or pick, phasing against a copy shifted a fraction of a hertz, in murky repeats.',
    instrument: {
      deviceId: 'bowed-string',
      params: { mode: 1, attack: 1.5, release: 3, brightness: 0.4, detune: 12, volume: -16 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { mix: 0.4 } },
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { mix: 0.3 } },
    ],
  },

  // chamber-strings: real players, as a sampler or a record kept them
  {
    id: 'nature-film-sampled-quartet',
    name: 'Sampled quartet',
    category: 'string',
    description:
      'A muted string section swelling in, held by an early sampler with its narrow band, in a hall.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { players: 4, attack: 1.2, release: 2.5, volume: -7.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Early sampler', params: { wear: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'nature-film-old-record-violin',
    name: 'Old record violin',
    category: 'string',
    description:
      'One close violin with a wide vibrato, heard from a scratched record with a worn groove and a slow wobble.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Close solo',
      params: { attack: 0.2, release: 0.8, vibrato: 14, volume: -1.5 },
    },
    effects: [
      {
        deviceId: 'vinyl',
        preset: 'Charity shop find',
        params: { crackle: 0.5, pops: 0.25, tone: -0.3 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.2 } },
    ],
    preview: 'line',
  },

  // choir: voices on the air and voices with their phases gone
  {
    id: 'nature-film-choir-on-air',
    name: 'Choir on air',
    category: 'voice',
    description:
      'Treble voices on an ooh, through a medium-wave set and its small speaker, in a quiet room.',
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: { ensemble: 0.7, vibrato: 3, attack: 0.7, release: 2.5, volume: -12 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Kitchen radio', params: { fading: 0.25, static: 0.12 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'nature-film-smeared-vowels',
    name: 'Smeared vowels',
    category: 'voice',
    description:
      'A choir slowly changing vowel with no vibrato, its phases smeared by a thin stream and left hanging.',
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: { motion: 0.8, vibrato: 0, attack: 2, release: 5, volume: -12 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Smeared phases', params: { loss: 0.5 } },
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { mix: 0.4 } },
    ],
  },

  // clarinet: the animal's theme, and a section worn down
  {
    id: 'nature-film-otter-theme',
    name: 'Otter theme',
    category: 'wind',
    description:
      'A warm clarinet line for the animal the film follows, wavering in a bucket-brigade chorus, in a small plate.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Warm clarinet',
      params: { breath: 0.45, attack: 0.08, release: 0.5, vibrato: 0.2, volume: -1.2 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Seasick vibrato',
        params: { time: 28, feedback: 0.1, modRate: 2.4, mix: 0.5 },
      },
      { deviceId: 'dattorro', preset: 'Small plate', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'nature-film-faded-reed-section',
    name: 'Faded reed section',
    category: 'wind',
    description:
      'Hollow clarinets held as a chord, with the top worn off by an old reel and a slow chorus.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Hollow section',
      params: { attack: 0.5, release: 1.5, volume: -9 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.45, wear: 0.6 } },
      { deviceId: 'chorus', preset: 'Slow Drift', params: { mix: 0.3 } },
    ],
    preview: 'chord',
  },

  // flute: the tape-replay flute played as a real one
  {
    id: 'nature-film-tape-flute-lead',
    name: 'Tape flute lead',
    category: 'wind',
    description:
      'A soft flute lead that scoops up into each note, on tape whose speed swims, with dark repeats.',
    instrument: {
      deviceId: 'flute',
      preset: 'Soft wind lead',
      params: { vibrato: 0.45, scoop: 55, volume: -8 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.75, flutter: 0.3, hiss: 0.25 } },
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'nature-film-sampled-pan-pipes',
    name: 'Sampled pan pipes',
    category: 'wind',
    description:
      'Pan pipes with their chiff, replayed by a gritty old sampler, with dotted tape echoes.',
    instrument: { deviceId: 'flute', preset: 'Pan pipes', params: { volume: -11 } },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty sampler', params: { jitter: 0.35 } },
      { deviceId: 'tape-echo', params: { time: 450, feedback: 0.4, heads: 3, mix: 0.28 } },
    ],
  },

  // horns: one player on a hill, a band on the wireless
  {
    id: 'nature-film-hillside-flugelhorn',
    name: 'Hillside flugelhorn',
    category: 'wind',
    description:
      'One breathy flugelhorn playing a slow line, with long dull echoes coming back across the valley.',
    instrument: {
      deviceId: 'horns',
      preset: 'Flugel breath',
      params: { vibrato: 0.2, volume: -1.5 },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Distant minute', params: { time: 1100, mix: 0.3 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'nature-film-wireless-brass-band',
    name: 'Wireless brass band',
    category: 'wind',
    description:
      'A brass band chord through a medium-wave set in a small room: narrow, a little static, fading now and then.',
    instrument: {
      deviceId: 'horns',
      preset: 'Brass band',
      params: { blow: 0.5, attack: 0.4, volume: -8 },
    },
    effects: [
      { deviceId: 'radio', preset: 'Kitchen radio', params: { fading: 0.3, static: 0.2 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.18 } },
    ],
    preview: 'chord',
  },

  // organ: morning assembly, and something heard across a field
  {
    id: 'nature-film-assembly-harmonium',
    name: 'Assembly harmonium',
    category: 'organ',
    description:
      'A pumped reed organ with its bellows breathing, on slow tape that wows, in the school hall.',
    instrument: {
      deviceId: 'organ',
      preset: 'Pump organ',
      params: { celeste: 0.4, volume: -15 },
    },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Quarter inch',
        params: { wow: 0.5, flutter: 0.3, speed: 2 },
      },
      { deviceId: 'zita-rev1', preset: 'Hall', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'nature-film-fairground-far-away',
    name: 'Fairground, far away',
    category: 'organ',
    description:
      'Organ flutes with a deep tremulant through a rotating speaker across the room, with the top taken off.',
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: { octave: 0.4, fifteenth: 0.3, tremulant: 0.7, volume: -11.5 },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room' },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 9000 } },
    ],
  },

  // drone: the hum of a moor, a signal coming and going
  {
    id: 'nature-film-moorland-hum',
    name: 'Moorland hum',
    category: 'drone',
    description:
      'A dark just-minor drone with a sub octave, under a twelve-stage phaser, on tape that wows.',
    instrument: {
      deviceId: 'drone',
      preset: 'Minor dusk',
      params: { cutoff: 800, volume: -4.5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve Stage Cloud', params: { rate: 0.07, mix: 0.4 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.45 } },
    ],
  },
  {
    id: 'nature-film-fogbound-signal',
    name: 'Fogbound signal',
    category: 'drone',
    description:
      'A close cluster of wandering sines with air in it, fading in and out on shortwave, in a wide space.',
    instrument: {
      deviceId: 'drone',
      preset: 'Fog cluster',
      params: { attack: 4, volume: 0.5 },
    },
    effects: [
      {
        deviceId: 'radio',
        preset: 'Night shortwave',
        params: { fading: 0.5, static: 0.25, mix: 0.75 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { mix: 0.25 } },
    ],
  },

  // tanpura: the drone under a film from far away
  {
    id: 'nature-film-monsoon-film-drone',
    name: 'Monsoon film drone',
    category: 'drone',
    description:
      'The four-string drone lute plucked round and round, phased slowly, with the wobble of a film reel.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Morning raga',
      params: { jawari: 0.7, volume: -5 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Warm Six-Stage', params: { rate: 0.1, mix: 0.4 } },
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.4 } },
    ],
  },
  {
    id: 'nature-film-slowed-string-drone',
    name: 'Slowed string drone',
    category: 'drone',
    description:
      'A plain open string plucked slowly into a tape loop that brings it back an octave down and worn.',
    instrument: { deviceId: 'tanpura', preset: 'Monochord', params: { volume: -4 } },
    effects: [
      { deviceId: 'tape-loop', preset: 'Slowed down', params: { length: 4, mix: 0.4 } },
      { deviceId: 'zita-rev1', preset: 'Room', params: { mix: 0.2 } },
    ],
  },

  // atmosphere: what the projector and the microphone add
  {
    id: 'nature-film-projector-hum',
    name: 'Projector hum',
    category: 'texture',
    description:
      'The mains hum of a projector, tuned to the key, with the crackle of film leader riding on it, from a small speaker.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Mains hum',
      params: { density: 0.6, movement: 0.5, tone: 0.5, attack: 0.6, release: 2.5, volume: -5 },
    },
    effects: [
      {
        deviceId: 'noise-floor',
        preset: 'Old record',
        params: { level: -26, follow: 0.8, movement: 0.6 },
      },
      { deviceId: 're-amp', preset: 'Bedside radio' },
    ],
  },
  {
    id: 'nature-film-microphone-wind',
    name: 'Microphone wind',
    category: 'texture',
    description:
      'Hill wind gusting across a bare microphone, band-limited and worn like an optical soundtrack.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Hill wind',
      params: { density: 0.6, movement: 0.8, tone: 0.4, width: 0.4, volume: -2.5 },
    },
    effects: [
      {
        deviceId: 'auto-filter',
        params: { type: 2, cutoffHz: 900, resonance: 0.6, driveDb: 6 },
      },
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wear: 0.7, tone: 0.35 } },
    ],
  },

  // outdoors: the field recordings, as the film kept them
  {
    id: 'nature-film-filmed-hedgerow-birds',
    name: 'Filmed hedgerow birds',
    category: 'texture',
    description:
      'Birdsong from a hedge as the soundtrack of a film kept it: wobbling, narrow, with hiss under it.',
    instrument: {
      deviceId: 'outdoors',
      params: {
        type: 0,
        density: 0.6,
        distance: 0.45,
        tone: 0.45,
        attack: 1.5,
        release: 5,
        volume: -3,
      },
    },
    effects: [
      {
        deviceId: 'patina',
        preset: 'Quarter inch reel',
        params: { wobble: 0.5, wear: 0.6, noise: 0.4 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.2 } },
    ],
  },
  {
    id: 'nature-film-hill-burn-cassette',
    name: 'Hill burn cassette',
    category: 'texture',
    description:
      'A small stream running over rocks, recorded to a cassette four-track and glazed by old converters.',
    instrument: { deviceId: 'outdoors', preset: 'Small stream', params: { volume: -2.5 } },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { wow: 0.5 } },
      { deviceId: 'vintage-digital', preset: 'Soft glaze' },
    ],
  },

  // sampler: whatever is loaded, as an early sampler would play it
  {
    id: 'nature-film-twelve-bit-keyboard',
    name: 'Twelve-bit keyboard',
    category: 'keys',
    description:
      'Whatever is loaded, played like an early sampler: wobbling, twelve bits, a dull top, with a chorus.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Worn tape',
      params: { attack: 0.02, release: 1.2, tone: 4000, wobble: 0.7, volume: -13 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Twelve bit' },
      { deviceId: 'chorus', preset: 'Classic Chorus', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'nature-film-slowed-sample-bed',
    name: 'Slowed sample bed',
    category: 'pad',
    description:
      'Whatever is loaded, an octave down and looping as a slow pad, on worn slow tape in a hall.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Tape choir',
      params: { attack: 1, release: 3.5, tone: 3000, wobble: 0.6, volume: -17 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.5, speed: 2 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // grain-synth: whatever is loaded, stopped or run backwards
  {
    id: 'nature-film-freeze-frame',
    name: 'Freeze frame',
    category: 'pad',
    description:
      'Whatever is loaded, held on one moment as a still chord that now and then slips, with tape wow.',
    instrument: { deviceId: 'grain-synth', preset: 'Frozen moment', params: { volume: -19 } },
    effects: [
      { deviceId: 'glitch', preset: 'Rare slips', params: { chance: 0.15 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.5, flutter: 0.3 } },
    ],
  },
  {
    id: 'nature-film-rewinding-the-reel',
    name: 'Rewinding the reel',
    category: 'pad',
    description:
      'Whatever is loaded, played backwards in long grains, phased, with echoes that fall in pitch like slowing tape.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Backwards wash',
      params: { spread: 0.7, volume: -16 },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Deep 8-Stage', params: { rate: 0.08, mix: 0.4 } },
      { deviceId: 'analog-delay', preset: 'Falling tape', params: { mix: 0.3 } },
    ],
  },

  // thesis: tuned noise, as wind or as a set tuning in
  {
    id: 'nature-film-singing-aerial',
    name: 'Singing aerial',
    category: 'pad',
    description:
      'Bands of filtered noise tuned to a minor chord and drifting, like wind in a wire, under a wide flanger, with murky repeats.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Drifting Minor',
      params: { center: 60, attack: 1.2, release: 4 },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { ceiling: -6, gain: 5.5 } },
      { deviceId: 'flanger', preset: 'Wide Wash', params: { mix: 0.45 } },
      { deviceId: 'analog-delay', preset: 'Long and murky', params: { mix: 0.2 } },
    ],
    preview: 'hold',
  },
  {
    id: 'nature-film-whistling-valve-set',
    name: 'Whistling valve set',
    category: 'texture',
    description:
      'Narrow bands of noise that whistle a note and its mirror, like a valve set tuning in, with a tape echo.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Sparse Mirror',
      params: { resonance: 80, attack: 0.2, release: 2 },
    },
    effects: [
      { deviceId: 'ambient-limiter', params: { ceiling: -6, gain: 4 } },
      { deviceId: 'tape-echo', params: { time: 440, feedback: 0.45, wow: 0.4, mix: 0.3 } },
    ],
    preview: 'line',
  },

  // west-coast: wood, and the tone from a film about waves
  {
    id: 'nature-film-wooden-blocks',
    name: 'Wooden blocks',
    category: 'plucked',
    description:
      'A soft woody mallet tone that darkens as it fades, on wowing tape with dark repeats.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Soft mallet',
      params: { decay: 1.2, volume: -1 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.5 } },
      { deviceId: 'analog-delay', preset: 'Dark repeats', params: { time: 360, mix: 0.3 } },
    ],
  },
  {
    id: 'nature-film-science-film-tone',
    name: 'Science film tone',
    category: 'pad',
    description:
      'A pure tone that folds into a richer one as it swells, as in a film about waves, with reel wobble and chorus.',
    instrument: { deviceId: 'west-coast', preset: 'Slow bloom', params: { volume: -10 } },
    effects: [
      { deviceId: 'patina', preset: 'Quarter inch reel', params: { wobble: 0.5 } },
      { deviceId: 'chorus', preset: 'Slow Drift', params: { mix: 0.35 } },
    ],
  },
]
