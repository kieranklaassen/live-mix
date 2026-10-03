import { type FactoryPreset } from '../types'

// Pads and bells remembered from sleep on a far south-west coast: soft, dark,
// a little out of tune, worn by old converters and tape, in long dull plates.

export const PRESETS: readonly FactoryPreset[] = [
  // ember: the detuned pads, the raw oscillators and the wind
  {
    id: 'lucid-hymn-for-sleepers',
    name: 'Hymn for sleepers',
    category: 'pad',
    description:
      'Detuned saws stacked three deep behind a nearly shut filter, two seconds to speak, in a long dark plate recorded to tape.',
    instrument: {
      deviceId: 'ember',
      preset: 'Slow strings',
      params: {
        osc2Fine: 17,
        filterSlope: 1,
        cutoff: 620,
        resonance: 0.1,
        filterEnvAmount: 0.25,
        filterAttack: 3,
        ampAttack: 2.2,
        ampRelease: 5.5,
        lfo2Rate: 0.31,
        lfo2Amount: 0.006,
        unisonDetune: 28,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { spread: 60, mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.65, mix: 0.35 } },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4, hiss: 0.3 } },
    ],
  },
  {
    id: 'lucid-loose-oscillators',
    name: 'Loose oscillators',
    category: 'drone',
    description:
      'A saw and a flat pulse an octave under it, twitching in pitch, through a resonant filter that wobbles, into a slack spring.',
    instrument: {
      deviceId: 'ember',
      preset: 'Dark drone',
      params: {
        osc2Fine: -31,
        subLevel: 0.3,
        cutoff: 420,
        resonance: 0.62,
        filterDrive: 0.5,
        ampAttack: 0.6,
        ampRelease: 3,
        lfo1Shape: 1,
        lfo1Rate: 0.35,
        lfo1Amount: 0.55,
        lfo2Shape: 4,
        lfo2Rate: 3.2,
        lfo2Dest: 0,
        lfo2Amount: 0.012,
        unisonVoices: 1,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Slack and strange', params: { mix: 0.3 } },
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },
  {
    id: 'lucid-two-tones-beating',
    name: 'Two tones beating',
    category: 'pad',
    description:
      'Pairs of sines a few cents apart that beat against each other and swell, with a slow shifter turning under a plate.',
    instrument: {
      deviceId: 'ember',
      preset: 'Init',
      params: {
        osc1Shape: 3,
        osc2Shape: 3,
        osc2Fine: 13,
        oscMix: 0.5,
        ampAttack: 2.5,
        ampRelease: 6,
        velToAmp: 0.4,
        lfo1Rate: 0.11,
        lfo1Dest: 2,
        lfo1Amount: 0.35,
        unisonVoices: 2,
        unisonDetune: 9,
        unisonSpread: 1,
        volume: -8.5,
      },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.5, mix: 0.4 } },
    ],
  },
  {
    id: 'lucid-under-the-floorboards',
    name: 'Under the floorboards',
    category: 'pad',
    description:
      'A hollow pulse an octave down with a triangle a third of a semitone flat against it, kept dark in a long damped hall.',
    instrument: {
      deviceId: 'ember',
      preset: 'Hollow Pad',
      params: {
        osc1Coarse: -12,
        osc2Coarse: 0,
        osc2Fine: -34,
        subLevel: 0.35,
        filterSlope: 1,
        cutoff: 480,
        resonance: 0.3,
        filterAttack: 3,
        ampAttack: 2.5,
        ampRelease: 6,
        lfo1Rate: 0.07,
        lfo1Amount: 0.25,
        unisonVoices: 2,
        unisonDetune: 20,
        volume: -9.8,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Seasick', params: { mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 9, damping: 0.75, mix: 0.45 } },
    ],
  },
  {
    id: 'lucid-adit-wind',
    name: 'Adit wind',
    category: 'texture',
    description:
      'Noise through a resonant band that follows the key and wanders: a wind that whistles one note down a tunnel.',
    instrument: {
      deviceId: 'ember',
      preset: 'Noise Sweep',
      params: {
        cutoff: 500,
        resonance: 0.7,
        keyTrack: 0.5,
        filterEnvAmount: 0.35,
        filterAttack: 4,
        filterDecay: 5,
        filterSustain: 0.5,
        filterRelease: 4,
        ampAttack: 2.5,
        ampRelease: 5,
        lfo1Rate: 0.18,
        lfo1Amount: 0.4,
        volume: 3,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Slow swirl', params: { mix: 0.35 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { decay: 12, damping: 0.6 } },
    ],
  },
  {
    id: 'lucid-night-light-pad',
    name: 'Night light pad',
    category: 'pad',
    description:
      'A triangle and a thin pulse an octave above it, wide and unsteady in pitch, through old converters, an echo and a plate.',
    instrument: {
      deviceId: 'ember',
      preset: 'Glass pad',
      params: {
        osc2Fine: 14,
        cutoff: 2200,
        ampAttack: 1.4,
        ampRelease: 7,
        lfo2Shape: 0,
        lfo2Rate: 0.6,
        lfo2Dest: 0,
        lfo2Amount: 0.008,
        unisonDetune: 26,
        volume: -5,
      },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze', params: { rate: 14000 } },
      { deviceId: 'analog-delay', preset: 'Chorused', params: { mix: 0.25 } },
      { deviceId: 'plate-reverb', params: { decay: 0.8, damping: 0.5, mix: 0.4 } },
    ],
  },
  {
    id: 'lucid-sine-whistle-lead',
    name: 'Sine whistle lead',
    category: 'keys',
    description:
      'One sine with a trace of triangle above it that slides from note to note, for a slow tune over dark repeats and a plate.',
    instrument: {
      deviceId: 'ember',
      preset: 'Init',
      params: {
        osc1Shape: 3,
        osc2Shape: 2,
        osc2Coarse: 12,
        oscMix: 0.2,
        filterSlope: 0,
        cutoff: 3000,
        ampAttack: 0.08,
        ampDecay: 1,
        ampSustain: 0.8,
        ampRelease: 1.2,
        velToAmp: 0.5,
        lfo2Rate: 4.6,
        lfo2Amount: 0.01,
        voiceMode: 1,
        glide: 0.12,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { time: 460, mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.5, mix: 0.3 } },
    ],
    preview: 'line',
  },

  // wavetable: tables that move slowly, detuned wide
  {
    id: 'lucid-sung-through-walls',
    name: 'Sung through walls',
    category: 'pad',
    description:
      'A vowel table moving slowly with its top shut off, thickened and left in a hall that sings oo behind it.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Slow choir',
      params: {
        position: 0.35,
        motion: 0.6,
        detune: 18,
        cutoff: 1000,
        resonance: 0.2,
        attack: 2.2,
        release: 6,
        volume: -4.5,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Vocal thickener' },
      { deviceId: 'vowel-reverb', preset: 'Oo behind', params: { decay: 7, mix: 0.35 } },
    ],
  },
  {
    id: 'lucid-hollow-hours',
    name: 'Hollow hours',
    category: 'pad',
    description:
      'A hollow table detuned wide over its sub, slow to arrive, on wavering tape in a reverb that sinks.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Hollow drift',
      params: {
        position: 0.25,
        motion: 0.5,
        rate: 0.04,
        detune: 24,
        sub: 0.45,
        cutoff: 900,
        resonance: 0.35,
        attack: 4,
        release: 8,
        volume: -9,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.6 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.45 } },
    ],
  },
  {
    id: 'lucid-glass-motion',
    name: 'Glass motion',
    category: 'pad',
    description:
      'A glass table shimmering about once a second across the chord, with chorus echoes and a small plate.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Glass morning',
      params: {
        position: 0.55,
        motion: 0.8,
        rate: 0.9,
        detune: 14,
        sub: 0.1,
        cutoff: 3200,
        resonance: 0.3,
        attack: 0.4,
        release: 4,
        volume: -7,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorused',
        params: { time: 340, feedback: 0.5, mix: 0.3 },
      },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'lucid-wrong-weather',
    name: 'Wrong weather',
    category: 'pad',
    description:
      'A spectral table drifting between shapes, ring-modulated a little so its chords curdle, in a long cheap hall.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Spectral cloud',
      params: {
        spread: 0.2,
        position: 0.7,
        rate: 0.06,
        detune: 30,
        cutoff: 2600,
        resonance: 0.25,
        attack: 3.5,
        release: 9,
        volume: -15.5,
      },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Radio ring',
        params: { width: 0.3, shift: 37, mix: 0.25 },
      },
      { deviceId: 'vintage-digital', preset: 'Worn', params: { jitter: 0.4 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.25, damping: 0.5 } },
    ],
  },
  {
    id: 'lucid-flat-reed-organ',
    name: 'Flat reed organ',
    category: 'pad',
    description:
      'Reed waves a quarter of a semitone apart through a slow rotating speaker across the room, on a worn cassette.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: {
        position: 0.3,
        motion: 0.35,
        rate: 0.15,
        detune: 26,
        sub: 0.3,
        cutoff: 1500,
        attack: 0.9,
        release: 3.5,
        spread: 0.8,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'rotary', preset: 'Across the room', params: { mix: 0.6 } },
      { deviceId: 'patina', preset: 'Worn cassette', params: { noise: 0.3 } },
      { deviceId: 'plate-reverb', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'lucid-pillow-tone',
    name: 'Pillow tone',
    category: 'pad',
    description:
      'Near sines over a strong sub that swell and sink at random like slow breathing, in a dark cathedral.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Still sine',
      params: {
        detune: 11,
        sub: 0.6,
        cutoff: 700,
        attack: 3,
        release: 7,
        spread: 0.3,
        volume: -15,
      },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Sea swell', params: { phase: 0, depth: 0.45 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { damping: 3000, mix: 0.4 } },
    ],
  },
  {
    id: 'lucid-warble-keys',
    name: 'Warble keys',
    category: 'keys',
    description:
      'A glass table that flutters five times a second and speaks at once, through a vibrato echo into a small room.',
    instrument: {
      deviceId: 'wavetable',
      preset: 'Reed organ',
      params: {
        table: 0,
        position: 0.4,
        motion: 0.5,
        rate: 5.5,
        detune: 16,
        sub: 0.15,
        cutoff: 2400,
        resonance: 0.25,
        attack: 0.01,
        release: 1.4,
        volume: -9,
      },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Seasick', params: { mix: 0.35 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { decay: 2.5, mix: 0.3 } },
    ],
  },

  // fm-glass: music boxes, gongs and bells that will not sit in tune
  {
    id: 'lucid-wonky-music-box',
    name: 'Wonky music box',
    category: 'bell',
    description:
      'Short FM bells with their operator pairs a fifth of a semitone apart, on tape that wows, in a small plate.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Glass bell',
      params: {
        ratio: 5,
        brightness: 0.34,
        decay: 1.3,
        release: 1.5,
        detune: 19,
        feedback: 0.05,
        velocity: 0.7,
        volume: -3,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { hiss: 0.2 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'lucid-tin-gong',
    name: 'Tin gong',
    category: 'bell',
    description:
      'A low inharmonic FM gong with a rough edge, struck once and left to beat in a dark well of echoes.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Temple bowl',
      params: {
        ratio: 2,
        brightness: 0.5,
        decay: 14,
        attack: 0.03,
        release: 10,
        detune: 14,
        feedback: 0.25,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { mix: 0.4 } },
      { deviceId: 'ambient-eq', preset: 'Shaded', params: { highCut: 9000 } },
    ],
    preview: 'low',
  },
  {
    id: 'lucid-struck-air-pad',
    name: 'Struck air pad',
    category: 'pad',
    description:
      'A held FM pad on an inharmonic ratio, bell-like and uneasy, slow to rise, through a deep chorus into a plate.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Crystal pad',
      params: {
        ratio: 4,
        brightness: 0.28,
        attack: 2.4,
        release: 7,
        detune: 16,
        feedback: 0.3,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.55, mix: 0.4 } },
    ],
  },
  {
    id: 'lucid-toy-mallets',
    name: 'Toy mallets',
    category: 'bell',
    description:
      'Short FM mallets for a plain tune, a little out with themselves, with dull repeats in a small room.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Vibes',
      params: {
        ratio: 7,
        brightness: 0.38,
        decay: 0.9,
        release: 0.8,
        detune: 10,
        velocity: 0.7,
        volume: -3.5,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 330, feedback: 0.5 },
      },
      { deviceId: 'ether-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'lucid-lullaby-keys',
    name: 'Lullaby keys',
    category: 'keys',
    description:
      'Soft FM electric piano, dull and slightly detuned, through a slow chorus and a cassette into a plate.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Tine keys',
      params: {
        brightness: 0.24,
        decay: 2.8,
        release: 1.4,
        detune: 11,
        feedback: 0.15,
        velocity: 0.6,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.5, mix: 0.45 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { hiss: 0.25 } },
      { deviceId: 'plate-reverb', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'lucid-lane-chimes',
    name: 'Lane chimes',
    category: 'bell',
    description:
      'Thin high chimes scattered by a grain delay and heard from far off through a long hall.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Ice chimes',
      params: { ratio: 9, brightness: 0.5, decay: 2.2, detune: 14, spread: 1, volume: -11.5 },
    },
    effects: [
      { deviceId: 'grain-delay', preset: 'Grain cloud', params: { tone: 5000, mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { damping: 0.4, mix: 0.5 } },
    ],
  },
  {
    id: 'lucid-bell-held-under',
    name: 'Bell held under',
    category: 'drone',
    description:
      'The bell algorithm held instead of struck, its modulator an octave under: a low beating tone that turns slowly.',
    instrument: {
      deviceId: 'fm-glass',
      preset: 'Slow glass',
      params: {
        spread: 0.4,
        algorithm: 0,
        ratio: 0,
        brightness: 0.35,
        attack: 3,
        sustain: 1,
        detune: 18,
        feedback: 0.2,
        volume: -13.5,
      },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Slow drift',
        params: { width: 0.3, fine: 0.7, mix: 0.4 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.6, mix: 0.35 } },
    ],
    preview: 'low',
  },

  // modal-bells: struck and rubbed metal, mostly dull, some of it far away
  {
    id: 'lucid-engine-house-gong',
    name: 'Engine house gong',
    category: 'bell',
    description:
      'A gong struck with a medium beater, its modes beating three times a second, on slow tape in a dark plate.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: {
        decay: 24,
        damping: 0.4,
        hardness: 0.55,
        detune: 3,
        brightness: 0.75,
        spread: 0.7,
        volume: -1,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2, wow: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.6, mix: 0.4 } },
    ],
    preview: 'hold',
  },
  {
    id: 'lucid-moorland-bell',
    name: 'Moorland bell',
    category: 'bell',
    description:
      'A church bell with its partials squeezed out of true, dull, with half-remembered echoes in a long hall.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Church bell',
      params: {
        decay: 18,
        hardness: 0.5,
        detune: 2.2,
        stretch: 0.94,
        brightness: 0.4,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'echo-memory', preset: 'Hazy past', params: { mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { damping: 0.5, mix: 0.45 } },
    ],
  },
  {
    id: 'lucid-sampled-comb',
    name: 'Sampled comb',
    category: 'bell',
    description:
      'A music box comb with each tooth beating against itself, through the converters of an early sampler and a dull echo.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Music box',
      params: { decay: 2.2, hardness: 0.75, detune: 3, brightness: 0.5, volume: 4 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler', params: { rate: 11000 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'lucid-wet-rim-glass',
    name: 'Wet rim glass',
    category: 'pad',
    description:
      'Glasses rubbed at the rim until a chord hangs, each note beating slowly, smeared into a mist and left in a hall.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Glass harp',
      params: {
        decay: 12,
        detune: 1.1,
        sustain: 1,
        brightness: 0.3,
        release: 0.5,
        spread: 0.9,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'spectral-blur', preset: 'Hanging mist', params: { width: 0.6, mix: 0.4 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { damping: 0.6, mix: 0.3 } },
    ],
  },
  {
    id: 'lucid-thumb-piano-slowed',
    name: 'Thumb piano, slowed',
    category: 'bell',
    description:
      'A dull thumb piano with its own half-speed copy an octave below, on cassette in a small room.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Kalimba',
      params: { decay: 3.5, damping: 0.8, hardness: 0.4, brightness: 0.35, volume: -9 },
    },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Half speed',
        params: { length: 1500, smooth: 0.8, highCut: 5000, mix: 0.5 },
      },
      { deviceId: 'tape', preset: 'Cassette four-track' },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },
  {
    id: 'lucid-bowed-gong',
    name: 'Bowed gong',
    category: 'drone',
    description:
      'A gong kept singing by a bow instead of struck, its metal combed a little by a still flanger, in a breathing hall.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Gong',
      params: {
        hardness: 0.15,
        position: 0.5,
        detune: 2.5,
        sustain: 1,
        brightness: 0.65,
        release: 0.4,
        volume: -4,
      },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Metal resonator', params: { feedback: 70, mix: 0.2 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { decay: 10, damping: 0.6, mix: 0.4 },
      },
    ],
    preview: 'hold',
  },
  {
    id: 'lucid-stretched-singing-bowl',
    name: 'Stretched singing bowl',
    category: 'bell',
    description:
      'A bowl with its overtones stretched sharp and beating fast, softly struck, with a slow shifter under a long plate.',
    instrument: {
      deviceId: 'modal-bells',
      preset: 'Singing bowl',
      params: {
        decay: 16,
        hardness: 0.3,
        detune: 4.5,
        stretch: 1.18,
        brightness: 0.4,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Slow drift', params: { fine: -0.6, mix: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.4 } },
    ],
  },

  // choir: breath, slowed voices and voices on the radio
  {
    id: 'lucid-closed-vowel-loop',
    name: 'Closed vowel loop',
    category: 'voice',
    description:
      'A few high voices humming a closed vowel, more breath than note, with their last seconds looping at half speed on cassette.',
    instrument: {
      deviceId: 'choir',
      preset: 'Breath',
      params: {
        vowel: 0.9,
        voice: 1.3,
        motion: 0.3,
        breath: 0.8,
        ensemble: 0.4,
        vibrato: 4,
        attack: 1.8,
        release: 4,
        tone: 4500,
        width: 0.7,
        volume: -12.7,
      },
    },
    effects: [
      { deviceId: 'micro-looper', preset: 'Half speed', params: { mix: 0.3 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { wow: 0.5 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.5, mix: 0.45 } },
    ],
  },
  {
    id: 'lucid-mineshaft-voices',
    name: 'Mineshaft voices',
    category: 'voice',
    description:
      'Deep voices on a closed oo with no vibrato, sampled at a low rate and left a long way down a hall.',
    instrument: {
      deviceId: 'choir',
      preset: 'Low monks',
      params: {
        vowel: 0.95,
        voice: 0.84,
        breath: 0.25,
        attack: 2.4,
        release: 6,
        tone: 2200,
        volume: -18,
      },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty', params: { jitter: 0.4, drive: 3 } },
      {
        deviceId: 'ether-reverb',
        preset: 'Cathedral',
        params: { decay: 16, damping: 0.5, mix: 0.45 },
      },
    ],
    preview: 'low',
  },
  {
    id: 'lucid-sleep-talkers',
    name: 'Sleep talkers',
    category: 'voice',
    description:
      'Voices sliding from vowel to vowel, detuned against themselves and smeared until no word is left.',
    instrument: {
      deviceId: 'choir',
      preset: 'Slow vowels',
      params: {
        width: 0.6,
        vowel: 0.4,
        ensemble: 0.6,
        vibrato: 14,
        vibratoRate: 4.2,
        attack: 1.5,
        tone: 3800,
        volume: -11.5,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Seasick', params: { width: 0.6, mix: 0.3 } },
      { deviceId: 'spectral-blur', preset: 'Slow dissolve', params: { width: 0.6, mix: 0.5 } },
      { deviceId: 'plate-reverb', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'lucid-tender-ooh',
    name: 'Tender ooh',
    category: 'voice',
    description:
      'Small high voices on ooh with almost no vibrato, soft at the edges, thickened and set in a long plate.',
    instrument: {
      deviceId: 'choir',
      preset: 'Boys ooh',
      params: {
        width: 0.7,
        motion: 0.25,
        breath: 0.35,
        vibrato: 3,
        attack: 1.2,
        release: 4.5,
        tone: 5000,
        volume: -8,
      },
    },
    effects: [
      {
        deviceId: 'chorus',
        params: { rate: 0.5, depth: 60, delayMs: 18, spread: 90, feedback: 10, mix: 0.35 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.45, mix: 0.45 } },
    ],
  },
  {
    id: 'lucid-night-radio-voice',
    name: 'Night radio voice',
    category: 'voice',
    description:
      'One voice pitched wrong on a sideband radio, with static in the gaps, worn tape echoes and a hall.',
    instrument: {
      deviceId: 'choir',
      preset: 'Soloist',
      params: {
        vowel: 0.2,
        voice: 1.1,
        breath: 0.3,
        vibrato: 18,
        attack: 0.3,
        release: 1.5,
        tone: 4000,
        volume: -8,
      },
    },
    effects: [
      { deviceId: 'radio', preset: 'Sideband voices', params: { static: 0.2, mix: 0.8 } },
      { deviceId: 'tape-echo', preset: 'Worn tape', params: { mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
    preview: 'line',
  },
  {
    id: 'lucid-slowed-treble',
    name: 'Slowed treble',
    category: 'voice',
    description:
      'Small high voices on ee dropped an octave by a fluttering shifter so they turn large and strange, sampled, in a plate.',
    instrument: {
      deviceId: 'choir',
      preset: 'Glass ee',
      params: {
        vowel: 0.6,
        voice: 1.36,
        breath: 0.2,
        ensemble: 0.7,
        attack: 1,
        release: 4,
        tone: 7000,
        volume: -10,
      },
    },
    effects: [
      {
        deviceId: 'pitch-shifter',
        preset: 'Octave down',
        params: { mode: 2, size: 140, detune: 14, mix: 0.7 },
      },
      { deviceId: 'patina', preset: 'Early sampler', params: { wear: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.6, mix: 0.4 } },
    ],
  },

  // drone: rumble, clusters and tones that beat
  {
    id: 'lucid-mine-rumble',
    name: 'Mine rumble',
    category: 'drone',
    description:
      'Octaves over a heavy sub with the filter nearly shut, pushed into tape: a rumble felt more than heard.',
    instrument: {
      deviceId: 'drone',
      preset: 'Deep octaves',
      params: {
        partials: 0.5,
        wave: 0.6,
        movement: 0.9,
        rate: 0.06,
        sub: 0.9,
        cutoff: 280,
        attack: 4,
        volume: -8,
      },
    },
    effects: [
      {
        deviceId: 'tape',
        preset: 'Hot glue',
        params: { wow: 0.2, age: 0.3, hiss: 0.15, output: -4 },
      },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 7, damping: 0.8, mix: 0.3 } },
    ],
  },
  {
    id: 'lucid-sea-fret-cluster',
    name: 'Sea fret cluster',
    category: 'drone',
    description:
      'Sines a tone or less apart that never settle, with air around them and a shifter pulling the two sides apart in a plate.',
    instrument: {
      deviceId: 'drone',
      preset: 'Fog cluster',
      params: {
        partials: 0.7,
        movement: 0.9,
        rate: 0.09,
        air: 0.35,
        cutoff: 1300,
        attack: 6,
        width: 0.7,
        volume: -8.5,
      },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Split sky',
        params: { fine: 1.2, width: 0.6, mix: 0.3 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.55, mix: 0.45 } },
    ],
    preview: 'hold',
  },
  {
    id: 'lucid-minor-lull',
    name: 'Minor lull',
    category: 'drone',
    description:
      'A just minor chord from each key, soft-edged and slow to rise, in a drifting chorus and a large dark space.',
    instrument: {
      deviceId: 'drone',
      preset: 'Minor dusk',
      params: {
        partials: 0.6,
        wave: 0.2,
        movement: 0.5,
        sub: 0.35,
        air: 0.1,
        cutoff: 1100,
        attack: 5,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.4 } },
      {
        deviceId: 'expanse',
        preset: 'Open space',
        params: { decay: 14, highCut: 3500, width: 0.7, mix: 0.35 },
      },
    ],
  },
  {
    id: 'lucid-unison-adrift',
    name: 'Unison adrift',
    category: 'drone',
    description:
      'A unison of near sines wandering in and out of tune with each other, swelling at random in a cathedral.',
    instrument: {
      deviceId: 'drone',
      preset: 'Latched unison',
      params: {
        partials: 0.8,
        wave: 0.05,
        movement: 0.6,
        rate: 0.3,
        sub: 0.2,
        air: 0,
        cutoff: 1500,
        attack: 3,
        release: 8,
        hold: 0,
        volume: -7.5,
      },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Sea swell', params: { rate: 0.2, depth: 0.5, phase: 30 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'lucid-pylon-hum',
    name: 'Pylon hum',
    category: 'drone',
    description:
      'The harmonic series as a buzzing saw hum, swept by a slow phaser over mains hum, in a small dark room.',
    instrument: {
      deviceId: 'drone',
      preset: 'Tanpura',
      params: {
        partials: 0.9,
        wave: 0.85,
        movement: 0.4,
        rate: 0.1,
        sub: 0.3,
        cutoff: 1400,
        attack: 2.5,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Deep eight-stage', params: { rate: 0.07, mix: 0.4 } },
      { deviceId: 'noise-floor', preset: 'Amp left on', params: { type: 3, level: -44 } },
      { deviceId: 'expanse', preset: 'Small dark room' },
    ],
  },
  {
    id: 'lucid-air-over-fifths',
    name: 'Air over fifths',
    category: 'drone',
    description:
      'Open fifths that are mostly tuned air, with a slowed copy a fifth below, glazed by old converters in a plain hall.',
    instrument: {
      deviceId: 'drone',
      preset: 'Open fifths',
      params: {
        partials: 0.4,
        wave: 0.1,
        movement: 0.7,
        sub: 0,
        air: 0.7,
        cutoff: 3000,
        attack: 4,
        volume: -11,
      },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Fifth down bed', params: { mix: 0.35 } },
      { deviceId: 'vintage-digital', preset: 'Glaze' },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 6, mix: 0.35 } },
    ],
    preview: 'hold',
  },

  // aurora: two-layer pads, a brass for broken chords and one horn line
  {
    id: 'lucid-worn-brass-keys',
    name: 'Worn brass keys',
    category: 'keys',
    description:
      'Two-layer synth brass that speaks at once with a filter overshoot and lets go quickly, detuned, on tape in a small plate.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: {
        brilliance: 700,
        resonance: 0.3,
        contour: 0.85,
        attack: 0.02,
        swell: 0.2,
        release: 1.2,
        detune: 16,
        volume: -7,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.35 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'lucid-night-section',
    name: 'Night section',
    category: 'pad',
    description:
      'A resonant, vowel-like pad with no bass, each note a fifth of a semitone wide, doubled and left in a long tank.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Night choir',
      params: {
        brilliance: 1100,
        lowCut: 300,
        resonance: 0.65,
        attack: 2.4,
        release: 6,
        detune: 20,
        volume: -14,
      },
    },
    effects: [
      { deviceId: 'stereo-detune', preset: 'Doubled', params: { mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { decay: 9, damping: 0.55, mix: 0.4 } },
    ],
  },
  {
    id: 'lucid-ring-of-tin',
    name: 'Ring of tin',
    category: 'pad',
    description:
      'A pad with its two layers ring-modulated into clanging tones, repeated by a long murky delay in a plate.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Metal dawn',
      params: { brilliance: 1300, attack: 0.6, release: 7, detune: 14, ring: 0.7, volume: -10 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', params: { decay: 0.8, damping: 0.5 } },
    ],
  },
  {
    id: 'lucid-lone-horn-line',
    name: 'Lone horn line',
    category: 'wind',
    description:
      'A soft synth horn that speaks in a quarter of a second, for one slow line with tape echoes and a long spring.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Soft horns',
      params: {
        brilliance: 900,
        contour: 0.5,
        attack: 0.25,
        release: 2.5,
        detune: 10,
        volume: -8,
      },
    },
    effects: [
      {
        deviceId: 'tape-echo',
        params: { time: 520, feedback: 0.5, mix: 0.3 },
      },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'lucid-strings-gone-sour',
    name: 'Strings gone sour',
    category: 'pad',
    description:
      'String layers a quarter of a semitone apart with the top rolled off, chorused, sampled and left in a plate.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Wide strings',
      params: {
        brilliance: 1500,
        lowCut: 200,
        attack: 1.6,
        release: 5,
        detune: 26,
        volume: -6,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Wide chorus', params: { rate: 0.4, mix: 0.4 } },
      { deviceId: 'patina', preset: 'Early sampler', params: { wear: 0.35, wobble: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.5, mix: 0.4 } },
    ],
  },
  {
    id: 'lucid-filter-opens-late',
    name: 'Filter opens late',
    category: 'pad',
    description:
      'A low pad that starts nearly shut and takes most of the note to open, thickened by saturation, in a reverb that sinks.',
    instrument: {
      deviceId: 'aurora',
      preset: 'Slow brass',
      params: {
        brilliance: 300,
        resonance: 0.5,
        contour: 0.9,
        attack: 3.5,
        swell: 1,
        release: 8,
        detune: 12,
        volume: -12,
      },
    },
    effects: [
      { deviceId: 'saturator', preset: 'On tape', params: { outputDb: -4 } },
      { deviceId: 'bloom-reverb', preset: 'Long dark', params: { mix: 0.4 } },
    ],
    preview: 'low',
  },

  // acoustic-guitar: dulled, on cassette, or answered backwards
  {
    id: 'lucid-nylon-on-cassette',
    name: 'Nylon on cassette',
    category: 'plucked',
    description:
      'A nylon guitar played with the flesh of the thumb, dull and unsteady on cassette, with a faint dark echo.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Nylon dusk',
      params: { nail: 0.1, sustain: 7, release: 3, tone: 0.35, volume: 0.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { wow: 0.5 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.2 } },
      { deviceId: 'bloom-reverb', preset: 'Still room', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'lucid-twelve-strings-reversed',
    name: 'Twelve strings reversed',
    category: 'plucked',
    description:
      'A twelve-string whose pairs beat, answered by its own notes played backwards, glazed and left in a tank.',
    instrument: {
      deviceId: 'acoustic-guitar',
      preset: 'Twelve string',
      params: { sustain: 9, release: 5, tone: 0.5, shimmer: 0.9, volume: 1 },
    },
    effects: [
      { deviceId: 'reverse-delay', preset: 'Slow swells', params: { mix: 0.45 } },
      { deviceId: 'vintage-digital', preset: 'Glaze' },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { mix: 0.35 } },
    ],
  },

  // atmosphere: wind that whistles a note, and the hum of the house
  {
    id: 'lucid-hedge-gap-wind',
    name: 'Hedge gap wind',
    category: 'texture',
    description:
      'Wind that whistles on the pitch of the key and keeps moving, through a slow phaser into a dark plate.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Whistling gap',
      params: {
        density: 0.5,
        movement: 0.9,
        tone: 0.4,
        resonance: 0.86,
        attack: 3,
        release: 6,
        width: 0.4,
        volume: 2,
      },
    },
    effects: [
      { deviceId: 'phaser', preset: 'Twelve stage cloud', params: { stereo: 90, mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.6, mix: 0.33 } },
    ],
  },
  {
    id: 'lucid-fuse-box-hum',
    name: 'Fuse box hum',
    category: 'texture',
    description:
      'Mains hum tuned to the key with a notch creeping through its harmonics, in a small room.',
    instrument: {
      deviceId: 'atmosphere',
      preset: 'Mains hum',
      params: {
        density: 0.5,
        tone: 0.3,
        resonance: 0.35,
        size: 0.4,
        attack: 2,
        release: 4,
        width: 0.5,
        volume: -7.5,
      },
    },
    effects: [
      { deviceId: 'auto-filter', preset: 'Slow notch', params: { lfoRateHz: 0.08 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { decay: 2, mix: 0.35 } },
    ],
  },

  // bowed-string: a wire that sings and a low bow
  {
    id: 'lucid-singing-fence-wire',
    name: 'Singing fence wire',
    category: 'string',
    description:
      'A string held singing by a magnet, slow to rise and wide in pitch, with a shifter spiralling in a large dark space.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Sustained swell',
      params: {
        attack: 2.2,
        release: 5,
        brightness: 0.6,
        vibrato: 0.35,
        vibratoRate: 4,
        detune: 16,
        volume: -16,
      },
    },
    effects: [
      {
        deviceId: 'freq-shifter',
        preset: 'Slow drift',
        params: { fine: 0.9, feedback: 0.6, mix: 0.3 },
      },
      { deviceId: 'expanse', preset: 'Open space', params: { highCut: 4000, mix: 0.45 } },
    ],
  },
  {
    id: 'lucid-cellar-bow',
    name: 'Cellar bow',
    category: 'string',
    description:
      'A low string bowed hard and slowly, weighted by a tape preamp, in a dark well of short echoes.',
    instrument: {
      deviceId: 'bowed-string',
      preset: 'Cello drone',
      params: {
        attack: 1.4,
        release: 3.5,
        brightness: 0.55,
        pressure: 0.75,
        body: 0.9,
        vibrato: 0.1,
        detune: 9,
        volume: -11.5,
      },
    },
    effects: [
      {
        deviceId: 'analog-drive',
        preset: 'Tape weight',
        params: { drive: 0.4, lowBump: 0.3, tone: -0.1 },
      },
      { deviceId: 'swarm-reverb', preset: 'Dark well', params: { highCut: 2000, mix: 0.3 } },
    ],
    preview: 'low',
  },

  // chamber-strings: muted, or more air than string
  {
    id: 'lucid-muted-hymn-strings',
    name: 'Muted hymn strings',
    category: 'string',
    description:
      'Five muted players a little apart in pitch, two seconds to swell, on tired tape in a dark hall that breathes.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Muted swell',
      params: { width: 0.5, attack: 2, release: 4, vibrato: 2, scatter: 0.6, volume: -7.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4, age: 0.4 } },
      {
        deviceId: 'fdn-reverb',
        preset: 'Breathing',
        params: { decay: 9, damping: 0.65, mix: 0.4 },
      },
    ],
  },
  {
    id: 'lucid-bows-on-air',
    name: 'Bows on air',
    category: 'string',
    description:
      'Three players bowing more air than string, well apart in pitch, with a dark reverb that rises backwards behind them.',
    instrument: {
      deviceId: 'chamber-strings',
      preset: 'Whisper bows',
      params: { players: 3, attack: 1.8, release: 3.5, scatter: 0.8, volume: -7 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze', params: { rate: 12000 } },
      { deviceId: 'shaped-reverb', preset: 'Ghost', params: { mix: 0.4 } },
    ],
  },

  // chord-harp: a strum that sinks, and a toy
  {
    id: 'lucid-dreamt-strum',
    name: 'Dreamt strum',
    category: 'plucked',
    description:
      'A slow dull strum up and back across four octaves, with echoes that sink an octave as they repeat.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Slow cascade',
      params: { sustain: 7, tone: 0.25, pad: 0.35, volume: -9 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Falling tape', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.5, mix: 0.35 } },
    ],
  },
  {
    id: 'lucid-toy-strum-worn',
    name: 'Toy strum, worn',
    category: 'plucked',
    description:
      'A quick strum down two octaves through eight-bit converters and wavering tape, in a small room.',
    instrument: {
      deviceId: 'chord-harp',
      preset: 'Toy harp',
      params: { strum: 30, sustain: 1.6, tone: 0.65, volume: -2 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Toy' },
      { deviceId: 'tape', preset: 'Seasick', params: { hiss: 0.2 } },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },

  // clarinet: a reed from nothing, and one slowed
  {
    id: 'lucid-reed-from-nowhere',
    name: 'Reed from nowhere',
    category: 'wind',
    description:
      'A softly blown clarinet that takes two seconds to arrive, caught and held as a dark bed behind itself, in a hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'From nothing',
      params: { blow: 0.4, breath: 0.6, vibrato: 0.15, volume: -1 },
    },
    effects: [
      { deviceId: 'sustainer', preset: 'Dark bed', params: { decay: 12, mix: 0.5 } },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
  },
  {
    id: 'lucid-low-reed-slowed',
    name: 'Low reed, slowed',
    category: 'wind',
    description:
      'A breathy low reed under its own half-speed copy an octave down, on slow tape in a hall.',
    instrument: {
      deviceId: 'clarinet',
      preset: 'Bass clarinet',
      params: { blow: 0.35, breath: 0.6, attack: 0.5, release: 1.5, volume: -6 },
    },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Smooth octave',
        params: { highCut: 4000, mix: 0.6 },
      },
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      { deviceId: 'hall-reverb', preset: 'Hall' },
    ],
  },

  // dusk: the chorus polysynth, dark, and its filter whistling
  {
    id: 'lucid-landing-light-pad',
    name: 'Landing light pad',
    category: 'pad',
    description:
      'The chorus polysynth with both choruses on, opening slowly from dark, on cassette in a plain dull hall.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Slow bloom',
      params: { cutoff: 380, envelope: 0.6, attack: 2.4, release: 7, chorus: 3, volume: -16.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Cassette four-track', params: { wow: 0.5, hiss: 0.3 } },
      { deviceId: 'shimmer', preset: 'Plain hall', params: { decay: 7, tone: 3000, mix: 0.4 } },
    ],
  },
  {
    id: 'lucid-filter-above-keys',
    name: 'Filter above keys',
    category: 'pad',
    description:
      'The filter itself whistling above each key, nearly a sine, with chorused echoes in a hall.',
    instrument: {
      deviceId: 'dusk',
      preset: 'Singing filter',
      params: { attack: 0.5, release: 4, volume: -10 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Chorused',
        params: { spread: 0.3, time: 420, feedback: 0.55, mix: 0.3 },
      },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.3 } },
    ],
    preview: 'line',
  },

  // felt-piano: heard through a wall, or dragged to half speed
  {
    id: 'lucid-upright-down-the-hall',
    name: 'Upright down the hall',
    category: 'keys',
    description:
      'A felted, out-of-tune upright heard through a wall from down the hall, recorded on cassette.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Intimate',
      params: {
        hardness: 0.2,
        detune: 0.8,
        reverbMix: 0.1,
        outputDb: -14.5,
      },
    },
    effects: [
      { deviceId: 're-amp', preset: 'Down the hall', params: { distance: 0.7 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { wow: 0.45 } },
    ],
  },
  {
    id: 'lucid-half-speed-piano',
    name: 'Half speed piano',
    category: 'keys',
    description:
      'A felt piano with a half-speed copy dragging an octave under every phrase, in a long dull hall.',
    instrument: {
      deviceId: 'felt-piano',
      preset: 'Felt',
      params: { felt: 0.8, detune: 0.7, outputDb: -12.5 },
    },
    effects: [
      { deviceId: 'half-speed', preset: 'Long drag', params: { highCut: 5000, mix: 0.6 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { decay: 10, damping: 0.6 } },
    ],
  },

  // flute: breath held as a chord, and pipes from a sampler
  {
    id: 'lucid-breath-organ',
    name: 'Breath organ',
    category: 'wind',
    description:
      'Low flutes held as a chord, breathy and slow to speak, drifting in a chorus and a hall that whispers back.',
    instrument: {
      deviceId: 'flute',
      preset: 'Breath pad',
      params: { breath: 0.8, blow: 0.25, attack: 1.8, release: 4, vibrato: 0.1, volume: -13 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.4 } },
      { deviceId: 'vowel-reverb', preset: 'Whispering', params: { decay: 6, mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'lucid-sampled-pipes',
    name: 'Sampled pipes',
    category: 'wind',
    description:
      'Pan pipes that scoop up to each note, as an early sampler would play them, with dull repeats in a small room.',
    instrument: {
      deviceId: 'flute',
      preset: 'Pan pipes',
      params: { chiff: 0.6, release: 1.2, scoop: 40, volume: -11.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Early sampler', params: { wear: 0.35, wobble: 0.35 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { decay: 2.5, mix: 0.3 } },
    ],
  },

  // grain-synth: whatever is loaded, held still or run backwards
  {
    id: 'lucid-frozen-frame',
    name: 'Frozen frame',
    category: 'pad',
    description:
      'One moment of whatever is loaded held still as a soft, detuned pad, in a deep chorus and a long plate.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Frozen moment',
      params: {
        size: 600,
        detune: 14,
        attack: 2,
        release: 5,
        spread: 0.4,
        tone: 2200,
        volume: -16.5,
      },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Deep sea', params: { mix: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { mix: 0.3 } },
    ],
  },
  {
    id: 'lucid-backwards-in-sleep',
    name: 'Backwards in sleep',
    category: 'pad',
    description:
      'Whatever is loaded played backwards in long overlapping grains, through a dusty sampler into a long hall.',
    instrument: {
      deviceId: 'grain-synth',
      preset: 'Backwards wash',
      params: { spread: 0.5, detune: 12, attack: 2, tone: 4000, volume: -22.5 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty', params: { jitter: 0.4, drive: 3 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.3, damping: 0.5 } },
    ],
  },

  // guitar: swelled in dark, and a dull pattern for the delay
  {
    id: 'lucid-shed-guitar-swell',
    name: 'Shed guitar swell',
    category: 'plucked',
    description:
      'A dark guitar chord with the pick taken off by a slow swell, levelled, through a chorus into a long plate.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Volume swell',
      params: { pickup: 0.2, tone: 2200, swell: 1, shimmer: 0.7, volume: 6 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 4 } },
      { deviceId: 'chorus', preset: 'Classic chorus', params: { rate: 0.35, mix: 0.4 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.6, mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'lucid-dull-pluck-pattern',
    name: 'Dull pluck pattern',
    category: 'plucked',
    description:
      'Soft dull plucks that die quickly, for a slow pattern, each one answered by dark repeats and a dull spring.',
    instrument: {
      deviceId: 'guitar',
      preset: 'Dark baritone',
      params: {
        position: 0.2,
        hardness: 0.25,
        sustain: 2.5,
        tone: 2200,
        strum: 0,
        warmth: 0.7,
        volume: 3.5,
      },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 375, feedback: 0.6, mix: 0.45 },
      },
      { deviceId: 'spring-reverb', preset: 'Dark amp spring', params: { width: 0.6 } },
    ],
  },

  // handpan: a hollow drum far off, and steel gone sour
  {
    id: 'lucid-hollow-drum-far',
    name: 'Hollow drum, far',
    category: 'bell',
    description:
      'A tongue drum under soft hands, all cavity and no shimmer, with strings ringing after it at the far end of a cathedral.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Tongue drum',
      params: { decay: 5, touch: 0.1, shimmer: 0.1, cavity: 0.9, damp: 0.3, volume: -7.5 },
    },
    effects: [
      { deviceId: 'sympathetic', preset: 'Minor strings', params: { root: 2, mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { damping: 2500, mix: 0.5 } },
    ],
    preview: 'keys',
  },
  {
    id: 'lucid-yard-clank',
    name: 'Yard clank',
    category: 'bell',
    description:
      'A steel pan rapped with the knuckles and shifted so its overtones go sour, with dull echoes in a small room.',
    instrument: {
      deviceId: 'handpan',
      preset: 'Knuckles',
      params: { touch: 0.6, decay: 3, position: 0.8, shimmer: 0.6, volume: -2 },
    },
    effects: [
      { deviceId: 'freq-shifter', preset: 'Bell metal', params: { shift: 147, mix: 0.4 } },
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Room' },
    ],
  },

  // harp: a bent silk string, and a harp answered in reverse
  {
    id: 'lucid-bent-silk-string',
    name: 'Bent silk string',
    category: 'plucked',
    description:
      'A koto string pressed so each note bends up after it is plucked, on tape that wows, in a plate.',
    instrument: {
      deviceId: 'harp',
      preset: 'Soft silk',
      params: { decay: 2, halo: 0.8, bend: 120, volume: 3.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { hiss: 0.2 } },
      { deviceId: 'plate-reverb' },
    ],
  },
  {
    id: 'lucid-harp-heard-backwards',
    name: 'Harp heard backwards',
    category: 'plucked',
    description:
      'A harp plucked softly at the middle of the string, with each note swelling back in reverse through a tank.',
    instrument: {
      deviceId: 'harp',
      preset: 'Long glass ring',
      params: { touch: 0.1, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'reverse-delay',
        preset: 'Backwards echo',
        params: { time: 900, smooth: 0.8, mix: 0.5 },
      },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { decay: 8, mix: 0.35 } },
    ],
  },

  // horns: low brass across water, and one muted trumpet far off
  {
    id: 'lucid-foghorn-section',
    name: 'Foghorn section',
    category: 'wind',
    description:
      'Low brass blown softly and slow to swell, heard across water in a large dark space.',
    instrument: {
      deviceId: 'horns',
      preset: 'Low brass choir',
      params: { blow: 0.42, breath: 0.2, attack: 3, release: 6, volume: -6 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.3 } },
      { deviceId: 'expanse', preset: 'Open space', params: { decay: 12, highCut: 3000 } },
    ],
    preview: 'low',
  },
  {
    id: 'lucid-distant-muted-trumpet',
    name: 'Distant muted trumpet',
    category: 'wind',
    description: 'One muted trumpet a long way off, repeated by three tape heads in a hall.',
    instrument: {
      deviceId: 'horns',
      preset: 'Muted distance',
      params: { breath: 0.4, attack: 0.3, release: 1.8, vibrato: 0.1, volume: -2.5 },
    },
    effects: [
      { deviceId: 'tape-echo', preset: 'Three heads', params: { mix: 0.3 } },
      { deviceId: 'hall-reverb', preset: 'Hall', params: { mix: 0.4 } },
    ],
  },

  // ladder-bass: a pulse made by the delay, and a sub floor
  {
    id: 'lucid-echo-pulse-bass',
    name: 'Echo pulse bass',
    category: 'keys',
    description:
      'A short round bass note that the delay turns into a pulse, dull and slightly out with itself.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Rubber pluck',
      params: { drive: 0.6, beat: 9, cutoff: 420, decay: 1.6, volume: 4 },
    },
    effects: [
      {
        deviceId: 'analog-delay',
        preset: 'Dark echo',
        params: { time: 300, feedback: 0.65, mix: 0.5 },
      },
      { deviceId: 'expanse', preset: 'Small dark room', params: { mix: 0.25 } },
    ],
    preview: 'line',
  },
  {
    id: 'lucid-under-bed-sub',
    name: 'Under-bed sub',
    category: 'keys',
    description:
      'Two near-sine oscillators beating slowly over a sub, pressed into tape: a floor for everything else.',
    instrument: {
      deviceId: 'ladder-bass',
      preset: 'Soft sub',
      params: { beat: 8, sub: 0.9, cutoff: 160, drive: 0.15, volume: -15 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Hot glue', params: { wow: 0.2, output: -3 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.2 } },
    ],
    preview: 'low',
  },

  // mallets: slow motor vibes, and a glockenspiel at half speed
  {
    id: 'lucid-motor-vibes-asleep',
    name: 'Motor vibes, asleep',
    category: 'bell',
    description:
      'Vibraphone bars under soft mallets with the motor turning slowly, glazed by old converters in a long hall.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Motor vibes',
      params: { width: 0.3, mallet: 0.2, decay: 2, motor: 0.8, motorRate: 2.4, volume: -10 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Glaze' },
      {
        deviceId: 'ether-reverb',
        preset: 'Cathedral',
        params: { mix: 0.3, decay: 10, damping: 0.5 },
      },
    ],
  },
  {
    id: 'lucid-slowed-glockenspiel',
    name: 'Slowed glockenspiel',
    category: 'bell',
    description:
      'A glockenspiel mostly heard at half speed, an octave down and twice as slow, on tape that wows.',
    instrument: {
      deviceId: 'mallets',
      preset: 'Glockenspiel',
      params: { mallet: 0.6, decay: 1.5, volume: -5 },
    },
    effects: [
      {
        deviceId: 'half-speed',
        preset: 'Half speed',
        params: { length: 2000, smooth: 0.9, highCut: 6000, mix: 0.7 },
      },
      { deviceId: 'tape', preset: 'Seasick', params: { hiss: 0.2 } },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.35 } },
    ],
  },

  // organ: a beating celeste, and pipes on tape that wows
  {
    id: 'lucid-chapel-celeste',
    name: 'Chapel celeste',
    category: 'organ',
    description:
      'A dark celeste rank beating against itself, slow to speak, turning in a rotating speaker in a cathedral.',
    instrument: {
      deviceId: 'organ',
      preset: 'Celeste drone',
      params: { reed: 0.1, celeste: 0.8, attack: 2.2, release: 5, tone: 1400, volume: -16 },
    },
    effects: [
      {
        deviceId: 'rotary',
        preset: 'Chorale',
        params: { drive: 0.1, distance: 0.7, mix: 0.5 },
      },
      { deviceId: 'hall-reverb', preset: 'Cathedral', params: { mix: 0.4 } },
    ],
  },
  {
    id: 'lucid-fairground-far-off',
    name: 'Fairground far off',
    category: 'organ',
    description:
      'Flute pipes with a heavy tremulant on tape that wows badly, heard from far off with scattered echoes.',
    instrument: {
      deviceId: 'organ',
      preset: 'Tremulant flute',
      params: {
        octave: 0.35,
        breath: 0.4,
        tremulant: 0.75,
        attack: 0.15,
        release: 0.9,
        tone: 3500,
        volume: -10,
      },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { wow: 0.9 } },
      { deviceId: 'expanse', preset: 'Far echoes', params: { mix: 0.4 } },
    ],
    preview: 'keys',
  },

  // outdoors: chimes behind glass, and thunder inland
  {
    id: 'lucid-chimes-next-door',
    name: 'Chimes next door',
    category: 'texture',
    description:
      'Wind chimes tuned by the key, some way off, swirling as if heard under water, in a long hall.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Chimes in a breeze',
      params: { density: 0.5, distance: 0.7, tone: 0.4, volume: -7.5 },
    },
    effects: [
      { deviceId: 'low-bitrate', preset: 'Underwater', params: { loss: 0.6, highCut: 6000 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { damping: 0.5, mix: 0.42 } },
    ],
  },
  {
    id: 'lucid-thunder-inland',
    name: 'Thunder inland',
    category: 'texture',
    description: 'Thunder a long way inland, dull and slow to roll, on slow tape in a dark hall.',
    instrument: {
      deviceId: 'outdoors',
      preset: 'Far storm',
      params: { density: 0.6, distance: 0.9, tone: 0.55, volume: -1.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { damping: 0.8, mix: 0.3 } },
    ],
  },

  // pedal-steel: steel that fades in, and long sour slides
  {
    id: 'lucid-steel-in-fog',
    name: 'Steel in fog',
    category: 'plucked',
    description:
      'Steel strings with no vibrato that fade in under a slow pedal, in a space whose tail swells up after them.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Still glass',
      params: { swell: 1.2, tone: 1800, volume: -12 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.25 } },
      { deviceId: 'expanse', preset: 'Bloom', params: { highCut: 3500, width: 0.7, mix: 0.35 } },
    ],
    preview: 'chord',
  },
  {
    id: 'lucid-sliding-wire',
    name: 'Sliding wire',
    category: 'plucked',
    description:
      'Steel notes that slide a long way into each other with a wide slow vibrato, on wowing tape with murky repeats.',
    instrument: {
      deviceId: 'pedal-steel',
      preset: 'Long slides',
      params: { glide: 650, vibrato: 16, rate: 3.6, tone: 2400, volume: -7 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Seasick', params: { hiss: 0.2 } },
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.3 } },
    ],
  },

  // sampler: whatever is loaded, lower, slower or reversed
  {
    id: 'lucid-loaded-flat-and-low',
    name: 'Loaded, flat and low',
    category: 'pad',
    description:
      'Whatever is loaded, an octave down and a fifth of a semitone flat, wobbling, sampled, in a reverb that sinks under it.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Worn tape',
      params: { tune: -12, fine: -22, attack: 0.8, release: 3, tone: 2600, volume: -19.5 },
    },
    effects: [
      { deviceId: 'patina', preset: 'Early sampler', params: { wear: 0.35 } },
      { deviceId: 'shimmer', preset: 'Undertow', params: { shimmer: 0.3, mix: 0.35 } },
    ],
  },
  {
    id: 'lucid-loaded-reversed',
    name: 'Loaded, reversed',
    category: 'pad',
    description:
      'Whatever is loaded, looped there and back in reverse and slow to speak, in a cloud of backwards grains and a long hall.',
    instrument: {
      deviceId: 'sampler',
      preset: 'Backwards',
      params: {
        start: 0.2,
        end: 0.8,
        loop: 2,
        crossfade: 150,
        attack: 1.2,
        release: 3,
        tone: 4000,
        wobble: 0.5,
        volume: -25,
      },
    },
    effects: [
      { deviceId: 'grain-cloud', preset: 'Backwards room', params: { mix: 0.4 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral' },
    ],
  },

  // string-machine: the ensemble phased, and only its top octave
  {
    id: 'lucid-dark-drifting-ensemble',
    name: 'Dark drifting ensemble',
    category: 'string',
    description:
      'The string ensemble kept dark and drifting in pitch, through a slow six-stage phaser into a long plate.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Slow strings',
      params: { width: 0.4, attack: 2.5, tone: 1400, drift: 0.7, volume: -3.5 },
    },
    effects: [
      {
        deviceId: 'phaser',
        preset: 'Warm six-stage',
        params: { stereo: 30, rate: 0.12, mix: 0.45 },
      },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.55, mix: 0.3 } },
    ],
  },
  {
    id: 'lucid-thin-high-strings',
    name: 'Thin high strings',
    category: 'string',
    description:
      'Only the top octave of the ensemble, thin and wandering in pitch, sampled, taped and left in a tank.',
    instrument: {
      deviceId: 'string-machine',
      preset: 'Glass',
      params: { attack: 1.8, release: 5, tone: 3800, speed: 0.6, drift: 0.8, volume: -11 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Sampler' },
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.5 } },
      { deviceId: 'ether-reverb', preset: 'Ether', params: { decay: 8, mix: 0.35 } },
    ],
  },

  // tanpura: strings with no buzz, and the buzz combed
  {
    id: 'lucid-slow-plucked-hum',
    name: 'Slow plucked hum',
    category: 'drone',
    description:
      'Four strings with no buzz plucked round slowly, a few cents apart, on slow tape in a dark plate.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Monochord',
      params: { speed: 9, detune: 6, body: 0.7, volume: -5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { speed: 2, wow: 0.3 } },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.7, mix: 0.4 } },
    ],
  },
  {
    id: 'lucid-buzz-and-comb',
    name: 'Buzz and comb',
    category: 'drone',
    description:
      'A buzzing drone lute swept by a slow resonant flanger, in a cavern of short echoes.',
    instrument: {
      deviceId: 'tanpura',
      preset: 'Closed jawari',
      params: { jawari: 0.45, speed: 5, decay: 10, detune: 5, volume: -2 },
    },
    effects: [
      { deviceId: 'flanger', preset: 'Slow sweep', params: { feedback: 60, mix: 0.4 } },
      { deviceId: 'swarm-reverb', preset: 'Cavern', params: { highCut: 3000, mix: 0.3 } },
    ],
  },

  // tape-orchestra: reels at half speed
  {
    id: 'lucid-choir-reel-slowed',
    name: 'Choir reel, slowed',
    category: 'voice',
    description:
      'A choir on a worn strip of tape at half speed, lurching and hissing, thickened and left in a long plate.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Worn choir',
      params: { spread: 0.4, age: 0.9, speed: 1, attack: 0.6, release: 2.5, volume: -7 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Vocal thickener' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.55, mix: 0.35 } },
    ],
  },
  {
    id: 'lucid-lost-reel-flutes',
    name: 'Lost reel flutes',
    category: 'wind',
    description:
      'Flutes from the oldest tape at half speed, dull and unsteady, with a dark echo in a hall.',
    instrument: {
      deviceId: 'tape-orchestra',
      preset: 'Lost reel',
      params: { hiss: 0.5, length: 8, attack: 0.3, release: 1.5, volume: -5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Dark echo', params: { mix: 0.25 } },
      { deviceId: 'fdn-reverb', preset: 'Hall', params: { mix: 0.35 } },
    ],
  },

  // thesis: chords of filtered noise, dark or whistling
  {
    id: 'lucid-noise-chord-dark',
    name: 'Noise chord, dark',
    category: 'pad',
    description:
      'Bands of filtered noise on each note and its mirror images, drifting, levelled and left on tape in a dark plate.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Dark Phrygian',
      params: { resonance: 35, attack: 1.8, release: 3 },
    },
    effects: [
      { deviceId: 'fet-limiter', preset: 'Drive', params: { inputGain: 14, outputGain: -8 } },
      { deviceId: 'tape', preset: 'Quarter inch' },
      { deviceId: 'plate-reverb', preset: 'Long plate', params: { damping: 0.6, mix: 0.4 } },
    ],
  },
  {
    id: 'lucid-whistling-bands',
    name: 'Whistling bands',
    category: 'pad',
    description:
      'Very narrow bands of noise that whistle a chord around each key and drift, in a chorus and a long hall.',
    instrument: {
      deviceId: 'thesis',
      preset: 'Glass Choir',
      params: { resonance: 85, width: 60, attack: 2.2, release: 2.5, mode: 2 },
    },
    effects: [
      { deviceId: 'fet-limiter', params: { inputGain: 18, outputGain: -13 } },
      { deviceId: 'chorus', preset: 'Slow drift', params: { mix: 0.3 } },
      { deviceId: 'ether-reverb', preset: 'Cathedral', params: { mix: 0.3 } },
    ],
  },

  // tine-piano: tines with no bell, and tines with a pad behind them
  {
    id: 'lucid-dull-tines',
    name: 'Dull tines',
    category: 'keys',
    description:
      'An electric piano with no bell in it, soft and long, in a slow chorus on a wavering cassette in a small room.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Dark felt',
      params: { decay: 2, release: 0.9, tremolo: 0.2, tremoloRate: 0.8, volume: -14 },
    },
    effects: [
      { deviceId: 'chorus', preset: 'Wide chorus', params: { rate: 0.45, mix: 0.4 } },
      { deviceId: 'tape', preset: 'Cassette four-track', params: { wow: 0.5 } },
      { deviceId: 'fdn-reverb', preset: 'Room', params: { mix: 0.25 } },
    ],
  },
  {
    id: 'lucid-sampled-tines',
    name: 'Sampled tines',
    category: 'keys',
    description:
      'Bell-like tines panning slowly through a dusty sampler, with a dark pad of the same chord growing in behind them.',
    instrument: {
      deviceId: 'tine-piano',
      preset: 'Slow pan',
      params: { bell: 0.7, tone: 0.4, volume: -10 },
    },
    effects: [
      { deviceId: 'vintage-digital', preset: 'Dusty', params: { jitter: 0.3, drive: 4 } },
      { deviceId: 'pad-follower', preset: 'Lingering' },
      { deviceId: 'plate-reverb', preset: 'Small plate', params: { mix: 0.3 } },
    ],
  },

  // west-coast: a tone folding over, and drips that jump
  {
    id: 'lucid-tone-folding-over',
    name: 'Tone folding over',
    category: 'drone',
    description:
      'A folded tone that keeps turning itself inside out and wandering in pitch, through a driven spring and a murky delay.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Folding drone',
      params: { fold: 0.8, fm: 0.25, ratio: 2, drift: 1, volume: -10 },
    },
    effects: [
      { deviceId: 'spring-reverb', preset: 'Dub send', params: { mix: 0.3 } },
      { deviceId: 'analog-delay', preset: 'Murky', params: { mix: 0.25 } },
    ],
    preview: 'low',
  },
  {
    id: 'lucid-dripping-on-tin',
    name: 'Dripping on tin',
    category: 'bell',
    description:
      'Short inharmonic plucks with every strike a little different, whose echoes jump by fifths and fourths.',
    instrument: {
      deviceId: 'west-coast',
      preset: 'Rain on wood',
      params: { fm: 0.5, ratio: 5, decay: 0.9, colour: 0.8, volume: 3.5 },
    },
    effects: [
      { deviceId: 'analog-delay', preset: 'Fifth hop', params: { mix: 0.45 } },
      { deviceId: 'ether-reverb', preset: 'Room', params: { mix: 0.3 } },
    ],
  },

  // zither: hammered pairs, and one slack string
  {
    id: 'lucid-hammered-wires',
    name: 'Hammered wires',
    category: 'plucked',
    description:
      'Doubled strings rolled with soft hammers, the pairs out with each other, on tape in a long dull spring.',
    instrument: {
      deviceId: 'zither',
      preset: 'Hammered shimmer',
      params: { roll: 7, brightness: 0.4, courses: 0.7, volume: -12.5 },
    },
    effects: [
      { deviceId: 'tape', preset: 'Quarter inch', params: { wow: 0.4 } },
      { deviceId: 'spring-reverb', preset: 'Long three spring', params: { tone: 2200 } },
    ],
  },
  {
    id: 'lucid-one-slack-string',
    name: 'One slack string',
    category: 'plucked',
    description:
      'A single string struck with felt, wavering in pitch, with twelve others ringing behind it in a slack spring.',
    instrument: {
      deviceId: 'zither',
      preset: 'Single felt string',
      params: { decay: 8, release: 5, brightness: 0.3, sympathy: 0.6, volume: -11 },
    },
    effects: [
      { deviceId: 'tremolo', preset: 'Pitch wobble', params: { phase: 0, rate: 1.2, depth: 0.5 } },
      { deviceId: 'spring-reverb', preset: 'Slack and strange', params: { mix: 0.35 } },
    ],
  },
]
