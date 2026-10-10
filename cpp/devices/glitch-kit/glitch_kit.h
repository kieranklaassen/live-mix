#pragma once

// Glitch Kit: twelve small faults of digital audio to play as percussion.
//
//   key of the octave ─► one of twelve voices (two slots each) ─┐
//                                                               ├─► crush ─► tone ─► volume ─► clip
//   the octave, Tune and the cents ─► how the voice is tuned ───┘
//
//   C   click     one short pulse through a resonant band near 2.6 kHz
//   C#  double    the click two or three times, the later ones softer
//   D   pop       a cycle and a half of a 98 Hz sine under a falling window
//   D#  crackle   sparse random pulses through the click's band, thinning out
//   E   pip       a pure sine burst at 1318.5 Hz
//   F   cut       a slice of white noise switched on and off
//   F#  static    held random steps a few thousand times a second, dying away
//   G   buzz      a narrow pulse train at 98 Hz through a band
//   G#  zap       a sine swept down from 6 kHz to 300 Hz
//   A   chirp     a sine swept up from 880 Hz to 3.5 kHz with a little FM
//   A#  stutter   one 6 ms grain repeated at a fixed spacing, each softer
//   B   bit       a shift register clocked at four times 1975.5 Hz
//
// - A hit is a one-shot: a release does nothing. The same key struck while it
//   still sounds takes the key's other slot and the older hit fades in 4 ms;
//   keys never take slots from each other. A third strike inside that fade
//   takes the slot that has faded further, and what was left of it runs out
//   over about 2 ms instead of stopping.
// - Tune, Length, Edge, Density, Scatter and Spread are read when a hit
//   starts. Crush, Tone and Volume act on the whole kit; Tone and Volume are
//   smoothed, and Crush, which is steps by nature, moves at once.
// - Every random choice (Scatter, the noises, the crackle's pattern) comes
//   from generators seeded in init(), and a hit that finds the kit silent
//   restarts the crusher's clock: the same notes give the same samples.
// - Nothing here is a control-rate value: every hit counts its own samples,
//   so the output does not depend on the block size.

#include "../../kit/keymap.h"
#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class GlitchKit : public kit::DeviceBase<glitch_kit::kNumParams> {
 public:
  enum Voice : int {
    kClick = 0,
    kDouble,
    kPop,
    kCrackle,
    kPip,
    kCut,
    kStatic,
    kBuzz,
    kZap,
    kChirp,
    kStutter,
    kBit,
    kNumVoices
  };
  static constexpr int kSlots = 2;

  void init(float sample_rate) {
    using namespace glitch_kit;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int v = 0; v < kNumVoices; ++v) {
      for (int s = 0; s < kSlots; ++s) hits_[v][s] = Hit();
    }
    stamp_ = 0;
    ghost_[0] = 0.0f;
    ghost_[1] = 0.0f;
    ghost_coeff_ = kit::time_to_coeff(kGhostSeconds, sr);
    scatter_.seed(0x6C17C4B1u);
    // White noise spreads over a wider band at a higher rate.
    noise_scale_ = std::sqrt(sr / 48000.0f);
    for (int c = 0; c < 2; ++c) {
      tone_filter_[c].reset();
      crush_held_[c] = 0.0f;
    }
    crush_phase_ = 1.0f;
    tone_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    tone_set_ = -1.0f;
    crush_set_ = -1.0f;
    // A hit counts as sounding through its own gaps; what is left after the
    // last one is the tone filter, which empties in a few milliseconds.
    idle_.reset(sr, 0.05f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int /*note_id*/, float frequency, float gain) {
    using namespace glitch_kit;
    if (!(frequency == frequency)) return;  // NaN
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    const kit::OctaveKey key = kit::octave_key(frequency);
    // Nothing sounds: whatever moved in the silence has arrived, and the
    // crusher's clock starts again, so a hit after a silence is the same hit.
    if (!any_active()) restart();

    Hit* pool = hits_[key.key];
    int take = 0;
    if (!pool[0].active) {
      take = 0;
    } else if (!pool[1].active) {
      take = 1;
    } else if (pool[0].kill != pool[1].kill) {
      take = pool[0].kill < pool[1].kill ? 0 : 1;  // the one further faded
    } else {
      take = pool[0].stamp < pool[1].stamp ? 0 : 1;  // the older
    }
    if (pool[take].active) {
      // Both slots sound: what this one was putting out runs down by itself.
      ghost_[0] += pool[take].last * pool[take].left;
      ghost_[1] += pool[take].last * pool[take].right;
    }
    Hit& other = pool[1 - take];
    if (other.active && other.kill_step == 0.0f) {
      other.kill_step = 1.0f / (kStealSeconds * sample_rate());
    }

    // The same number of draws for every hit, whatever the settings are.
    const float r_pitch = scatter_.bipolar();
    const float r_length = scatter_.bipolar();
    const float r_level = scatter_.bipolar();
    const float r_place = scatter_.bipolar();
    const float r_choice = scatter_.uniform();
    const uint32_t r_seed = scatter_.next_u32();

    const float scatter = param(kScatter);
    Strike strike;
    strike.voice = key.key;
    strike.gain = gain;
    strike.tuning = kit::clamp(key.semitones() + param(kTune), -36.0f, 36.0f);
    strike.pitch = kit::clamp(strike.tuning + kPitchScatter * scatter * scatter * r_pitch, -36.0f, 36.0f);
    strike.duration = kit::clamp(param(kLength) * std::pow(kOctaveShortening, strike.tuning * (1.0f / 12.0f)) *
                                     std::exp2(kLengthScatter * scatter * r_length),
                                 0.1f, 12.0f);
    strike.level = kit::db_to_gain(kLevelScatterDb * scatter * r_level);
    strike.edge = param(kEdge);
    strike.density = param(kDensity);
    strike.seed = kVoiceSeed[key.key] ^ (scatter > 0.0f ? r_seed : 0u);
    strike.click_grain = r_choice < 0.5f * kit::min(1.0f, 4.0f * scatter);
    // Each voice has a place of its own; Scatter throws each hit away from it.
    const float thrown = std::sqrt(scatter);
    strike.place = key.key == kPop
                       ? 0.0f
                       : param(kSpread) * kit::lerp(kPlace[key.key], kThrow * r_place, thrown);
    start(pool[take], strike);
  }

  // A hit is a one-shot: letting go of the key changes nothing.
  void note_off(int /*note_id*/) {}

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(any_active() || ghost_[0] != 0.0f || ghost_[1] != 0.0f)) {
      // Only a hit wakes the kit, and a hit that finds it silent lands the
      // controls itself (restart), so there is nothing to do here.
      silence_output(frames);
      return;
    }
    clear_input(frames);
    // Hits start between blocks and only end inside one.
    Hit* sounding[kNumVoices * kSlots];
    int count = 0;
    for (int v = 0; v < kNumVoices; ++v) {
      for (int s = 0; s < kSlots; ++s) {
        if (hits_[v][s].active) sounding[count++] = &hits_[v][s];
      }
    }
    const float sr = sample_rate();
    // Crush is steps already: a move takes hold at once, with nothing to smooth.
    const float crush = param(glitch_kit::kCrush);
    for (int i = 0; i < frames; ++i) {
      float left = ghost_[0];
      float right = ghost_[1];
      ghost_[0] = flush_denormal(ghost_[0] * ghost_coeff_);
      ghost_[1] = flush_denormal(ghost_[1] * ghost_coeff_);
      for (int h = 0; h < count; ++h) {
        Hit& hit = *sounding[h];
        if (!hit.active) continue;
        const float sample = render(hit);
        left += sample * hit.left;
        right += sample * hit.right;
      }

      // Crush: a slower clock and coarser steps, the same clock for both sides.
      if (crush > 0.0f) {
        if (crush != crush_set_) set_crush(crush, sr);
        crush_phase_ += crush_increment_;
        if (crush_phase_ >= 1.0f) {
          crush_phase_ -= 1.0f;
          crush_held_[0] = crush_step_ * std::floor(left * crush_inverse_ + 0.5f);
          crush_held_[1] = crush_step_ * std::floor(right * crush_inverse_ + 0.5f);
        }
        left = crush_held_[0] * crush_makeup_;
        right = crush_held_[1] * crush_makeup_;
      }

      const float tone = tone_.next();
      if (tone != tone_set_) set_tone(tone, sr);
      const float volume = volume_.next();
      out_left_[i] = kit::soft_clip(tone_filter_[0].lowpass(left) * volume);
      out_right_[i] = kit::soft_clip(tone_filter_[1].lowpass(right) * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // What one key press asks for, worked out in note_on.
  struct Strike {
    int voice = 0;
    float gain = 0.0f;      // velocity, 0..1
    float tuning = 0.0f;    // semitones: the octave, the cents and Tune
    float pitch = 0.0f;     // tuning plus this hit's scatter
    float duration = 1.0f;  // times the voice's own length
    float level = 1.0f;     // this hit's scatter in level
    float edge = 0.0f;
    float density = 0.0f;
    float place = 0.0f;     // -1 left to 1 right
    uint32_t seed = 1;
    bool click_grain = false;
  };

  struct Hit {
    bool active = false;
    int voice = 0;
    uint32_t stamp = 0;
    int pos = 0;     // samples since it began
    int length = 0;  // samples it lasts
    int fade = 0;    // samples of rounding at each end (Edge)
    float amp = 0.0f;
    float left = 0.0f, right = 0.0f;
    float kill = 1.0f, kill_step = 0.0f;  // the fade of a hit struck again
    float last = 0.0f;                    // what it put out last
    kit::OnePole hardness;                // velocity: a soft hit is duller
    kit::OnePole lows;                    // takes the bit's offset out
    // sines and clocks
    float phase = 0.0f, increment = 0.0f, sweep = 1.0f, base_increment = 0.0f;
    float mod_phase = 0.0f, mod_increment = 0.0f;
    // pulses into the band
    kit::Svf band;
    float pulse_pos = 0.0f, pulse_length = 0.0f, pulse_gain = 0.0f, pulse_scale = 1.0f, hard = 0.0f;
    // events: the double's clicks, the crackle's pulses, the stutter's repeats
    int next_event = 0, events_left = 0, period = 0, span = 0;
    float event_gain = 1.0f, event_fall = 1.0f, rate = 0.0f;
    // noises
    kit::Rng rng;
    float held = 0.0f, envelope = 1.0f, decay = 1.0f;
    uint32_t shift = 1;
    // the stutter's grain
    int grain_pos = 0, grain_length = 0, grain_fade = 0;
    float grain_gain = 0.0f;
    bool grain_click = false;
  };

  static constexpr float kStealSeconds = 0.004f;
  static constexpr float kGhostSeconds = 0.0003f;    // 60 dB in about 2 ms
  static constexpr float kRoundSeconds = 0.003f;     // the rounding of an end with Edge at 0
  static constexpr float kOctaveShortening = 0.75f;  // an octave up is a quarter shorter
  static constexpr float kPitchScatter = 3.0f;       // semitones at Scatter 1
  static constexpr float kLengthScatter = 0.5f;      // octaves of length at Scatter 1
  static constexpr float kLevelScatterDb = 2.0f;
  static constexpr float kThrow = 0.9f;
  static constexpr float kSixtyDb = 6.907755279f;

  static constexpr float kClickHz = 2600.0f;
  static constexpr float kClickRing = 0.003f;
  static constexpr float kPulseSeconds = 0.00015f;
  static constexpr float kPopHz = 97.999f;        // G2
  static constexpr float kPipHz = 1318.51f;       // E6
  static constexpr float kBuzzHz = 97.999f;       // G2
  static constexpr float kBuzzBandHz = 1400.0f;
  static constexpr float kBuzzPulseSeconds = 0.00025f;
  static constexpr float kZapFromHz = 6000.0f, kZapToHz = 300.0f;
  static constexpr float kChirpFromHz = 880.0f, kChirpToHz = 3520.0f;
  static constexpr float kChirpIndex = 0.15f;     // cycles of phase
  static constexpr float kGrainHz = 2093.0f;      // C7
  static constexpr float kClickGrainGain = 1.5f;  // as loud as the pip grain
  static constexpr float kBitClockHz = 7902.13f;  // four times B6
  static constexpr float kStaticHz = 3000.0f;
  static constexpr float kCutHz = 7000.0f;

  // Level of each voice: one hit at velocity 0.7 peaks between -20 and
  // -10 dBFS at the default settings, the pop the strongest.
  static constexpr float kLevel[kNumVoices] = {0.50f, 0.50f, 0.51f, 0.42f, 0.26f, 0.36f,
                                               0.34f, 0.87f, 0.28f, 0.26f, 0.30f, 0.17f};
  // Where each voice sits with Scatter at 0 and Spread at 1.
  static constexpr float kPlace[kNumVoices] = {-0.25f, 0.35f, 0.0f,  -0.5f,  0.2f, -0.15f,
                                               0.5f,   -0.3f, 0.4f,  -0.45f, 0.3f, -0.2f};
  static constexpr uint32_t kVoiceSeed[kNumVoices] = {
      0x1B873593u, 0x2C1B3C6Du, 0x3D4D51CBu, 0x4F6CDD1Du, 0x5A827999u, 0x6ED9EBA1u,
      0x7F4A7C15u, 0x85EBCA6Bu, 0x9E3779B9u, 0xA54FF53Au, 0xB5297A4Du, 0xC2B2AE35u};

  bool any_active() const {
    for (int v = 0; v < kNumVoices; ++v) {
      for (int s = 0; s < kSlots; ++s) {
        if (hits_[v][s].active) return true;
      }
    }
    return false;
  }

  void land() {
    tone_.snap(tone_.target);
    volume_.snap(volume_.target);
  }

  void restart() {
    land();
    crush_phase_ = 1.0f;  // the first sample is taken
    crush_held_[0] = 0.0f;
    crush_held_[1] = 0.0f;
  }

  void set_tone(float tone, float sr) {
    tone_set_ = tone;
    const float hz = 1500.0f * std::pow(12.0f, tone);  // 1.5 kHz to 18 kHz
    tone_filter_[0].set(hz, kit::kSqrtHalf, sr);
    tone_filter_[1].set(hz, kit::kSqrtHalf, sr);
  }

  // From clean to 5 bits at 6 kHz. The bits are counted over the kit's own
  // working range of half of full scale: a step is a thirty-second of it.
  void set_crush(float crush, float sr) {
    crush_set_ = crush;
    crush_step_ = std::exp2(-(16.0f - 11.0f * crush));
    crush_inverse_ = 1.0f / crush_step_;
    crush_increment_ = kit::min(1.0f, 96000.0f * std::exp2(-4.0f * crush) / sr);
    crush_makeup_ = 1.0f + kCrushMakeup * crush * crush;
  }
  // Held samples lose a little to the tone filter; this keeps the kit level.
  static constexpr float kCrushMakeup = 0.06f;

  int samples(float seconds) const {
    const int n = static_cast<int>(seconds * sample_rate() + 0.5f);
    return n < 1 ? 1 : n;
  }

  // 0 to 1 over `fade` samples, a raised cosine that starts and ends flat.
  static float rise(int index, int fade) {
    if (index >= fade) return 1.0f;
    return 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * (static_cast<float>(index) + 0.5f) /
                                                    static_cast<float>(fade));
  }
  static float window(int pos, int length, int fade) {
    const int left = length - 1 - pos;
    return rise(pos < left ? pos : left, fade);
  }

  // The click's band and the pulse that rings it, at `ratio` of its tuning.
  // The band's ring time is `ring` seconds whatever the tuning. The pulse
  // shortens as the band rises, so it holds the same share of a cycle and the
  // click is as strong at every tuning; its length in seconds, and so what it
  // puts into the band, is the same at every sample rate.
  void prepare_band(Hit& hit, float ratio, float ring, float edge) {
    const float sr = sample_rate();
    const float hz = kit::clamp(kClickHz * ratio, 200.0f, kit::min(12000.0f, 0.4f * sr));
    const float q = kit::clamp(ring * kit::kTwoPi * hz / (2.0f * kSixtyDb), 0.6f, 80.0f);
    hit.band.reset();
    hit.band.set(hz, q, sr);
    hit.hard = edge;
    hit.pulse_length = kit::max(kPulseSeconds * (kClickHz / hz) * sr, 2.5f);
    hit.pulse_pos = hit.pulse_length;  // none in flight
    hit.pulse_gain = 0.0f;
  }

  // Edge 0 is a raised cosine, Edge 1 a rectangle of the same area.
  static float pulse_shape(const Hit& hit, float at) {
    const float round = 0.5f - 0.5f * kit::SineTable::cos_lookup(at / hit.pulse_length);
    return kit::lerp(round, 0.5f, hit.hard);
  }

  static void strike_band(Hit& hit, float gain) {
    hit.pulse_pos = 0.5f;
    hit.pulse_gain = gain;
  }

  static float ring_band(Hit& hit) {
    float x = 0.0f;
    if (hit.pulse_pos < hit.pulse_length) {
      x = hit.pulse_gain * pulse_shape(hit, hit.pulse_pos);
      hit.pulse_pos += 1.0f;
    }
    hit.band.process(x);
    return hit.band.band;
  }

  void start(Hit& hit, const Strike& strike) {
    using namespace glitch_kit;
    const float sr = sample_rate();
    hit = Hit();
    hit.active = true;
    hit.voice = strike.voice;
    hit.stamp = ++stamp_;
    hit.amp = kLevel[strike.voice] * (0.25f + 0.75f * strike.gain) * strike.level;
    // The same curve for both sides, so the centre is exactly mono.
    hit.left = std::cos((1.0f + strike.place) * (kit::kHalfPi * 0.5f));
    hit.right = std::cos((1.0f - strike.place) * (kit::kHalfPi * 0.5f));
    hit.rng.seed(strike.seed);

    const float ratio = kit::semitones_to_ratio(strike.pitch);
    // Velocity is hardness too: a soft hit is duller, from 1.8 kHz at the
    // softest to open at the hardest, and a voice tuned up takes its top with it.
    hit.hardness.set_cutoff(1800.0f * std::pow(10.0f, strike.gain) * kit::max(1.0f, ratio), sr);
    const float duration = strike.duration;
    const float soft = 1.0f - strike.edge;
    const int round = static_cast<int>(kRoundSeconds * soft * soft * sr + 0.5f);
    const float top = kit::min(18000.0f, 0.42f * sr);  // the highest a sine is asked to go
    const float ring = kClickRing * duration;
    const int ring_samples = samples(ring);
    // A harder hit rings the click's band a little higher: a soft one is lower and rounder.
    const float struck = ratio * std::exp2((strike.gain - 0.7f) * 0.5f);

    switch (strike.voice) {
      case kClick:
      case kDouble: {
        prepare_band(hit, struck, ring, strike.edge);
        const int clicks = strike.voice == kClick ? 1 : (strike.density < 0.5f ? 2 : 3);
        hit.events_left = clicks;
        hit.period = samples(kit::lerp(0.030f, 0.012f, strike.density));
        hit.event_fall = 0.6f;
        // The band has rung 90 dB down by one and a half ring times.
        hit.length = (clicks - 1) * hit.period + static_cast<int>(hit.pulse_length) + ring_samples * 3 / 2 + 2;
        break;
      }
      case kCrackle: {
        prepare_band(hit, struck, ring, strike.edge);
        hit.events_left = 1;
        hit.span = samples(0.25f * duration);
        // 10 to 160 pulses a burst length at its start, so about 4 to 55 in all.
        hit.rate = 10.0f * std::exp2(4.0f * strike.density) / static_cast<float>(hit.span);
        hit.length = hit.span + static_cast<int>(hit.pulse_length) + ring_samples * 3 / 2 + 2;
        break;
      }
      case kPop:
        hit.increment = kPopHz * ratio / sr;
        hit.phase = 0.25f * strike.edge;  // Edge 1 starts on the crest: a step
        hit.length = samples(0.020f * duration);
        hit.fade = round;
        break;
      case kPip:
        hit.increment = kit::min(kPipHz * ratio, top) / sr;
        hit.phase = 0.25f;
        hit.length = samples(0.040f * duration);
        hit.fade = round;
        break;
      case kCut:
        hit.band.set(kit::clamp(kCutHz * ratio, 400.0f, kit::min(16000.0f, 0.45f * sr)), kit::kSqrtHalf, sr);
        hit.length = samples(0.050f * duration);
        hit.fade = round;
        break;
      case kStatic: {
        hit.base_increment = kit::min(1.0f, kit::min(kStaticHz * ratio, 16000.0f) / sr);
        hit.increment = hit.base_increment;
        hit.held = rough(hit);
        hit.length = samples(0.2f * duration);
        hit.decay = std::exp(-kSixtyDb / static_cast<float>(hit.length));
        hit.fade = round;
        break;
      }
      case kBuzz: {
        const float hz = kBuzzHz * ratio;
        hit.increment = hz / sr;
        const float ideal = kBuzzPulseSeconds * (kBuzzHz / hz) * sr;
        hit.pulse_length = kit::max(ideal, 3.0f);
        hit.pulse_scale = ideal / hit.pulse_length;
        hit.band.set(kit::min(kBuzzBandHz * ratio, kit::min(10000.0f, 0.4f * sr)), 1.5f, sr);
        hit.length = samples(0.090f * duration);
        hit.fade = round;
        break;
      }
      case kZap:
      case kChirp: {
        const bool zap = strike.voice == kZap;
        const float from = kit::min((zap ? kZapFromHz : kChirpFromHz) * ratio, top);
        const float to = kit::min((zap ? kZapToHz : kChirpToHz) * ratio, top);
        hit.length = samples((zap ? 0.040f : 0.030f) * duration);
        hit.increment = from / sr;
        hit.sweep = std::pow(to / from, 1.0f / static_cast<float>(hit.length));
        hit.phase = 0.25f;
        hit.mod_increment = zap ? 0.0f : 0.5f * from / sr;
        hit.fade = round;
        break;
      }
      case kStutter: {
        hit.events_left = 4 + static_cast<int>(8.0f * strike.density + 0.5f);
        hit.period = samples(kit::lerp(0.040f, 0.012f, strike.density));
        hit.event_fall = 0.86f;
        hit.grain_click = strike.click_grain;
        hit.grain_length = samples(kit::min(0.006f * duration, 0.9f * static_cast<float>(hit.period) / sr));
        hit.grain_fade = round < hit.grain_length / 2 ? round : hit.grain_length / 2;
        hit.grain_pos = hit.grain_length;
        hit.increment = kit::min(kGrainHz * ratio, top) / sr;
        const int last = (hit.events_left - 1) * hit.period;
        if (hit.grain_click) {
          const float grain_ring = kit::min(ring, 0.5f * static_cast<float>(hit.period) / sr);
          prepare_band(hit, struck, grain_ring, strike.edge);
          hit.event_gain = kClickGrainGain;
          hit.length = last + static_cast<int>(hit.pulse_length) + samples(grain_ring) * 3 / 2 + 2;
        } else {
          hit.length = last + hit.grain_length;
        }
        break;
      }
      case kBit:
      default:
        hit.base_increment = kit::min(1.0f, kit::min(kBitClockHz * ratio, 16000.0f) / sr);
        hit.shift = (strike.seed & 0x7FFFu) | 1u;
        hit.held = (hit.shift & 1u) ? 1.0f : -1.0f;
        hit.lows.set_cutoff(80.0f, sr);
        hit.length = samples(0.080f * duration);
        hit.fade = round;
        break;
    }
    if (hit.fade > hit.length / 2) hit.fade = hit.length / 2;
  }

  // The static's next step: mostly small, now and then large.
  static float rough(Hit& hit) {
    const float r = hit.rng.bipolar();
    return r * (r < 0.0f ? -r : r);
  }

  // One sample of one hit, before its place in the stereo field.
  float render(Hit& hit) {
    float x = 0.0f;
    switch (hit.voice) {
      case kClick:
      case kDouble:
        if (hit.events_left > 0 && hit.pos >= hit.next_event) {
          strike_band(hit, hit.event_gain);
          hit.event_gain *= hit.event_fall;
          hit.next_event += hit.period;
          --hit.events_left;
        }
        x = ring_band(hit);
        break;
      case kCrackle:
        if (hit.events_left > 0 && hit.pos >= hit.next_event) {
          // Fewer and softer as the burst runs out.
          const float left = 1.0f - static_cast<float>(hit.pos) / static_cast<float>(hit.span);
          const float drawn = 0.4f + 0.6f * hit.rng.uniform();
          const float size = hit.pos == 0 ? 1.0f : drawn * (0.5f + 0.5f * left);
          strike_band(hit, hit.rng.uniform() < 0.5f ? -size : size);
          const float rate = hit.rate * left * left;
          const float gap = -std::log(kit::max(hit.rng.uniform(), 1.0e-6f)) / kit::max(rate, 1.0e-9f);
          const float next = static_cast<float>(hit.pos) + kit::max(gap, 1.0f);
          if (next >= static_cast<float>(hit.span)) {
            hit.events_left = 0;
          } else {
            hit.next_event = static_cast<int>(next);
          }
        }
        x = ring_band(hit);
        break;
      case kPop:
        x = kit::SineTable::lookup(hit.phase) * rise(hit.pos, hit.fade) *
            (0.5f + 0.5f * kit::SineTable::cos_lookup(0.5f * static_cast<float>(hit.pos) /
                                                      static_cast<float>(hit.length)));
        hit.phase += hit.increment;
        if (hit.phase >= 1.0f) hit.phase -= 1.0f;
        break;
      case kPip:
        x = kit::SineTable::lookup(hit.phase) * window(hit.pos, hit.length, hit.fade);
        hit.phase += hit.increment;
        if (hit.phase >= 1.0f) hit.phase -= 1.0f;
        break;
      case kCut:
        x = hit.band.lowpass(hit.rng.bipolar() * noise_scale_) * window(hit.pos, hit.length, hit.fade);
        break;
      case kStatic: {
        hit.phase += hit.increment;
        if (hit.phase >= 1.0f) {
          hit.phase -= 1.0f;
          hit.held = rough(hit);
          // An uneven clock: each step lasts between half and one and a half periods.
          hit.increment = kit::min(1.0f, hit.base_increment / (0.5f + hit.rng.uniform()));
        }
        x = hit.held;
        hit.envelope *= hit.decay;
        x *= hit.envelope * window(hit.pos, hit.length, hit.fade);
        break;
      }
      case kBuzz: {
        const float since = hit.phase / hit.increment;  // samples into this period
        if (since < hit.pulse_length) {
          x = hit.pulse_scale * (0.5f - 0.5f * kit::SineTable::cos_lookup(since / hit.pulse_length));
        }
        hit.phase += hit.increment;
        if (hit.phase >= 1.0f) hit.phase -= 1.0f;
        x = hit.band.bandpass(x) * window(hit.pos, hit.length, hit.fade);
        break;
      }
      case kZap:
        x = kit::SineTable::lookup(hit.phase) * window(hit.pos, hit.length, hit.fade);
        hit.phase += hit.increment;
        if (hit.phase >= 1.0f) hit.phase -= 1.0f;
        hit.increment *= hit.sweep;
        break;
      case kChirp:
        x = kit::SineTable::lookup(hit.phase + kChirpIndex * kit::SineTable::lookup(hit.mod_phase)) *
            window(hit.pos, hit.length, hit.fade);
        hit.phase += hit.increment;
        if (hit.phase >= 1.0f) hit.phase -= 1.0f;
        hit.mod_phase += hit.mod_increment;
        if (hit.mod_phase >= 1.0f) hit.mod_phase -= 1.0f;
        hit.increment *= hit.sweep;
        break;
      case kStutter:
        if (hit.events_left > 0 && hit.pos >= hit.next_event) {
          hit.grain_pos = 0;
          hit.grain_gain = hit.event_gain;
          hit.phase = 0.25f;
          if (hit.grain_click) strike_band(hit, hit.event_gain);
          hit.event_gain *= hit.event_fall;
          hit.next_event += hit.period;
          --hit.events_left;
        }
        if (hit.grain_click) {
          x = ring_band(hit);
        } else if (hit.grain_pos < hit.grain_length) {
          x = hit.grain_gain * kit::SineTable::lookup(hit.phase) *
              window(hit.grain_pos, hit.grain_length, hit.grain_fade);
          hit.phase += hit.increment;
          if (hit.phase >= 1.0f) hit.phase -= 1.0f;
          ++hit.grain_pos;
        }
        break;
      case kBit:
      default: {
        hit.phase += hit.base_increment;
        x = hit.held;
        if (hit.phase >= 1.0f) {
          hit.phase -= 1.0f;
          const float after = kit::min(1.0f, hit.phase / hit.base_increment);
          const float before = hit.held;
          // Fifteen bits fed back from the first and the seventh: the short
          // loop, which repeats often enough to have a pitch.
          const uint32_t feedback = (hit.shift ^ (hit.shift >> 6)) & 1u;
          hit.shift = (hit.shift >> 1) | (feedback << 14);
          hit.held = (hit.shift & 1u) ? 1.0f : -1.0f;
          x = before + (hit.held - before) * after;
        }
        x = hit.lows.highpass(x) * window(hit.pos, hit.length, hit.fade);
        break;
      }
    }
    float out = hit.hardness.lowpass(x) * hit.amp;
    if (hit.kill_step > 0.0f) {
      out *= hit.kill * hit.kill * (3.0f - 2.0f * hit.kill);  // no corner at either end
      hit.kill -= hit.kill_step;
      if (hit.kill <= 0.0f) hit.active = false;
    }
    if (++hit.pos >= hit.length) hit.active = false;
    hit.last = hit.active ? out : 0.0f;
    return out;
  }

  void apply(int id) {
    using namespace glitch_kit;
    const float value = param(id);
    switch (id) {
      case kTone:
        tone_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read when a hit starts
    }
  }

  Hit hits_[kNumVoices][kSlots];
  uint32_t stamp_ = 0;
  float ghost_[2] = {0.0f, 0.0f};
  float ghost_coeff_ = 0.0f;
  kit::Rng scatter_;
  float noise_scale_ = 1.0f;
  kit::Svf tone_filter_[2];
  kit::Smoother tone_, volume_;
  float tone_set_ = -1.0f;
  float crush_set_ = -1.0f;
  float crush_step_ = 1.0f, crush_inverse_ = 1.0f, crush_increment_ = 1.0f, crush_makeup_ = 1.0f;
  float crush_phase_ = 1.0f;
  float crush_held_[2] = {0.0f, 0.0f};
  kit::IdleGate idle_;
};

}  // namespace livemix
