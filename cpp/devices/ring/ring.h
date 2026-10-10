#pragma once

// Ring: a ring modulator whose carrier is tuned to a note.
//
//                 carrier 1 (Root, Octave, Fine | Frequency) ─ drift ─┐
//                 carrier 2 (a fifth, an octave up or down)  ─────────┤
//                                                                     ▼
//   in ──┬──────────────────────────────────────────────────► × ─► low cut ─► tone ─► wet
//        │                                                                             │
//        └───────────────────────────── dry ──────────────────────────► equal-power mix ◄┘
//
// - wet = in · m(t). m is the carrier: 1·W(φ₁), or 0.8·W(φ₁) + 0.6·W(φ₂)
//   with Second on, where W is the chosen shape scaled to a root mean square
//   of one. A partial at f comes out as two, at c + f and |c − f|, each at
//   1/√2 of its height for a sine: the ringing sound has the power of what
//   went in, so Mix (equal power: the two are not alike) does not change the
//   level, and there is nothing of f itself in it.
// - Under 16 Hz that stops being true by degrees: a carrier that slow is not
//   heard as two new partials but as the sound's own level going up and
//   down, a tremolo through zero, and the ringing sound is the dry one at
//   another gain. Equal power and a shape of root mean square one would then
//   stand the swells 4.5 dB over the dry sound (measured: a held chord
//   through 2.5 Hz at Mix 0.6). So from 16 Hz down to 4 Hz the law crosses
//   over to the one a tremolo has (`slow`): Mix is a straight crossfade and
//   the shape is scaled by its peak, so the loudest moment is as loud as the
//   dry sound and no louder. With Width the two sides swell apart, and the
//   shape is let up again by as much as keeps the two sides' power at its
//   loudest moment the dry sound's: for a sine at Width 1 that is √2, an
//   equal-power pan (ring_waves.h, `slow_gain`).
//   Every note Root and Octave reach is at 16.35 Hz or above: this is about
//   Free.
// - The carrier is a note: 440·2^((12·(Octave + 1) + Root − 69)/12) Hz, moved
//   by Fine in cents; or, with Tune on Free, Frequency (Fine still applies).
//   A new pitch is glided to, in pitch and not in hertz (a 20 ms time
//   constant on its logarithm: a semitone is within 5 cents after 60 ms, an
//   octave after 110 ms, up or down alike), and the phase is integrated (a
//   double), so nothing done to the pitch is a jump in the wave.
// - Drift leans on the carrier's frequency with a slow three-sine wander
//   (kit::Drift, 0.11 Hz): up to ±50 cents at the top, by the square of the
//   control so its lower half stays fine. It runs free and is never reset.
// - The shapes are band-limited (ring_waves.h): Triangle and Soft square are
//   tables cut off under a sixth of the sample rate, so input under a third
//   of it makes nothing that folds. Diode is a four-diode bridge: its
//   small-signal gate from the same kind of table, plus what a loud signal
//   changes (the gate rounds off, the level gives up to 3 dB, odd harmonics
//   of the signal ring too), worked out sample by sample (`swing`).
// - Width turns the right side's carriers by up to a quarter of a cycle,
//   which puts the two outputs in quadrature: wide, and the same when summed
//   to mono.
// - Low Cut and Tone are second-order (kit::Svf, Butterworth) on the wet
//   sound only. A played note at the carrier's own pitch makes a difference
//   tone at 0 Hz; the low cut, never under 20 Hz, is what takes that out.
// - The carrier and the drift run free, through silence too. After 0.3 s of
//   nothing going in the device rests, counted on the sample and not on the
//   block, and the samples it rests are counted; with the first sample that
//   sounds the carriers and the drift are turned on by that time in one
//   step, so a slow carrier is where one that never stopped would be and the
//   block size cannot be heard. A knob moved in the rest has arrived by
//   then. Nothing rings on in here but the filters, and 0.3 s is 26 time
//   constants of the slowest (the low cut at 20 Hz): what is cut off is
//   230 dB down.
//
// Storage: the shape tables (295 kB, shared) and four filters. No delay
// line, no latency.

#include "../../kit/kit.h"
#include "params.gen.h"
#include "ring_waves.h"

namespace livemix {

class Ring : public kit::DeviceBase<ring::kNumParams> {
 public:
  // The carrier of a note: Root 0..11 from C, Octave as in scientific pitch
  // (C4 is middle C, A4 is 440 Hz).
  static float note_hz(int root, int octave) {
    return kit::midi_to_hz(static_cast<float>(12 * (octave + 1) + root));
  }

  void init(float sample_rate) {
    using namespace ring;
    kit::SineTable::init();
    Waves::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    const float control_rate = sr / kControlPeriod;
    for (int c = 0; c < 2; ++c) {
      low_cut_[c].reset();
      tone_[c].reset();
      body_[c].reset();
      body_[c].set_cutoff(kDiodeBodyHz, sr);
    }
    pitch_.set_time(kGlideSeconds, sr);
    ratio_.set_time(kGlideSeconds, sr);
    // Second starts Off, which leaves the ratio alone: it must not be the
    // last life's, or the second carrier would turn at another rate until it
    // is switched on and come in somewhere else.
    ratio_.snap(kSecondRatio[0]);
    first_gain_.set_time(kGlideSeconds, sr);
    second_gain_.set_time(kGlideSeconds, sr);
    for (kit::Smoother& weight : weight_) weight.set_time(kGlideSeconds, sr);
    width_.set_time(kGlideSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    drift_.set_time(kGlideSeconds, control_rate);
    low_cut_log_.set_time(kFilterSeconds, control_rate);
    tone_log_.set_time(kFilterSeconds, control_rate);
    wander_.seed(0x52494E47u);
    wander_.set_rate(kDriftHz, sr);
    phase_[0] = 0.25;  // the first sample ever played meets the crest
    phase_[1] = 0.25;
    drift_ratio_ = 1.0f;
    band_limit_hz_ = sr * kBandLimit;
    clock_.reset(kControlPeriod);
    hold_ = static_cast<long>(kHoldSeconds * sr);
    quiet_ = 0;
    rested_ = 0.0;
    resting_ = true;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    arrive();
    carrier_now_ = hz_set_;
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The reading named by "meters" in device.json, for a display to draw: the
  // first carrier's frequency as it is now, glide and drift included (Hz).
  // At rest it is where the knobs put it.
  float meter(int index) const {
    if (index == 0) return resting_ ? hz_set_ : carrier_now_;
    return 0.0f;
  }

  void process(int frames) {
    using namespace ring;
    frames = begin_block(frames);
    if (resting_ && !input_present(frames)) {
      rested_ += frames;
      silence_output(frames);
      return;
    }
    const double inverse_sr = 1.0 / static_cast<double>(sample_rate());
    const float diode_gain = Waves::diode_gain();
    for (int i = 0; i < frames; ++i) {
      float x[2];
      take_input(i, &x[0], &x[1]);
      // A NaN or a runaway sample goes no further: not into the filters and
      // not on to whatever comes after.
      for (int c = 0; c < 2; ++c) {
        if (!(x[c] > -kSaneInput && x[c] < kSaneInput)) x[c] = 0.0f;
      }
      const bool silent = flush_denormal(x[0]) == 0.0f && flush_denormal(x[1]) == 0.0f;
      if (resting_) {
        if (silent) {
          rested_ += 1.0;
          out_left_[i] = 0.0f;
          out_right_[i] = 0.0f;
          continue;
        }
        resting_ = false;
        quiet_ = 0;
        catch_up();
        arrive();
      }
      if (clock_.tick()) control();

      // The two carriers, free-running. A new pitch is glided to on a scale
      // of pitch; once there the carrier is the pitch that was set, exactly.
      if (!pitch_.settled()) {
        hz_now_ = std::exp2(pitch_.next());
        if (pitch_.settled()) hz_now_ = hz_set_;
      }
      const float hz = hz_now_ * drift_ratio_;
      const float ratio = ratio_.next();
      const float where[2] = {static_cast<float>(phase_[0]), static_cast<float>(phase_[1])};
      phase_[0] += static_cast<double>(hz) * inverse_sr;
      phase_[0] -= std::floor(phase_[0]);
      phase_[1] += static_cast<double>(hz * ratio) * inverse_sr;
      phase_[1] -= std::floor(phase_[1]);

      const float gain[2] = {first_gain_.next(), second_gain_.next()};
      float weight[kNumWaves];
      for (int w = 0; w < kNumWaves; ++w) weight[w] = weight_[w].next();
      const float offset = width_.next() * 0.25f;
      const float mix = mix_.next();
      if (mix != mix_seen_) {
        kit::equal_power(mix, &dry_gain_, &wet_gain_);
        mix_seen_ = mix;
      }

      // A slow carrier is a gain on the sound, not a pair of new partials:
      // see `slow`. Each shape is brought from a root mean square of one
      // towards the scale that makes the loudest moment of the two sides
      // together the dry sound's, the two carriers towards a sum of one, and
      // Mix from equal power towards a straight crossfade.
      float dry_gain = dry_gain_;
      float wet_gain = wet_gain_;
      float level[2][kNumWaves];
      const float slowness[2] = {slow(hz), slow(hz * ratio)};
      for (int k = 0; k < 2; ++k) {
        for (int w = 0; w < kNumWaves; ++w) level[k][w] = weight[w];
      }
      if (slowness[0] > 0.0f || (slowness[1] > 0.0f && gain[1] > 0.0f)) {
        // The sine in closed form (√2·sin: the two sides' squares sum to
        // 2 + 2·cos of the angle between them at most), the rest from tables.
        // They change with Width only, and are worked out when it does.
        if (offset != offset_seen_) {
          tame_[kWaveSine] = kit::kSqrtHalf / kit::SineTable::cos_lookup(0.5f * offset);
          for (int table = 0; table < ring::Waves::kNumShapes; ++table) {
            tame_[kWaveTriangle + table] = ring::Waves::slow_gain(table, offset);
          }
          offset_seen_ = offset;
        }
        for (int k = 0; k < 2; ++k) {
          if (slowness[k] <= 0.0f) continue;
          for (int w = 0; w < kNumWaves; ++w) level[k][w] *= 1.0f + slowness[k] * (tame_[w] - 1.0f);
        }
        const float both = kit::min(1.0f, gain[0] * gain[0] * slowness[0] + gain[1] * gain[1] * slowness[1]);
        dry_gain += both * ((1.0f - mix) - dry_gain);
        wet_gain += both * (mix - wet_gain);
        wet_gain *= 1.0f + both * (1.0f / (gain[0] + gain[1]) - 1.0f);
      }

      // The bridge leans on the body of the sound: see `swing`.
      const bool diode = weight[kWaveDiode] > 0.0f;
      float body[2] = {0.0f, 0.0f};
      if (diode) {
        body[0] = body_[0].lowpass(x[0]);
        body[1] = body_[1].lowpass(x[1]);
      }

      float out[2];
      for (int c = 0; c < 2; ++c) {
        float wet = 0.0f;
        for (int k = 0; k < 2; ++k) {
          if (gain[k] == 0.0f) continue;
          const float phase = c == 0 ? where[k] : where[k] + offset;
          float ringing = x[c] * shape(level[k], cut_[k], phase);
          if (diode && lean_[k] > 0.0f) {
            // The whole gate, from the table that keeps every harmonic.
            const float gate = ring::Waves::read(ring::Waves::kDiode, ring::Waves::kCuts - 1, phase);
            ringing += level[k][kWaveDiode] * lean_[k] *
                       (diode_gain * swing(kit::SineTable::lookup(phase), body[c]) - body[c] * gate);
          }
          wet += gain[k] * ringing;
        }
        wet = tone_[c].lowpass(low_cut_[c].highpass(wet));
        out[c] = x[c] * dry_gain + wet * wet_gain;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];

      // Rest with the sample that ends the hold, wherever in a block it is.
      if (!silent) {
        quiet_ = 0;
      } else if (++quiet_ >= hold_) {
        rest();
      }
    }
  }

 private:
  enum Wave : int { kWaveSine = 0, kWaveTriangle, kWaveSoftSquare, kWaveDiode, kNumWaves };

  struct Cut {
    int base = 0;
    int upper = 0;
    float blend = 0.0f;
  };

  static constexpr int kControlPeriod = 16;
  // Pitch (on a scale of pitch), shape, the second carrier and width cross
  // over with a 20 ms time constant: a jump of octaves is a quick sweep, a
  // change of shape a crossfade.
  static constexpr float kGlideSeconds = 0.02f;
  // Where a carrier stops being a gain and starts being a ring: all tremolo
  // law at 4 Hz and under, all ring law from 16 Hz up, in between by hertz.
  static constexpr float kSlowHz = 4.0f;
  static constexpr float kFastHz = 16.0f;
  static constexpr float kFilterSeconds = 0.01f;
  static constexpr float kHoldSeconds = 0.3f;
  static constexpr float kDriftHz = 0.11f;
  static constexpr float kDriftCents = 50.0f;
  static constexpr float kCentsToLog = 0.69314718f / 1200.0f;  // ln 2 per 1200 cents
  // No carrier harmonic above this share of the sample rate.
  static constexpr float kBandLimit = 1.0f / 6.0f;
  static constexpr float kSaneInput = 64.0f;
  // The bridge: how hard the signal is driven into it against a carrier of
  // one (a full-scale signal swings the diodes by one and a half carriers),
  // the low pass on the copy of the signal that the lean is worked out from,
  // and the carriers between which the lean is let go.
  static constexpr float kDiodeDrive = 3.0f;
  static constexpr float kDiodeBodyHz = 2500.0f;
  static constexpr float kLeanFullHz = 400.0f;
  static constexpr float kLeanNoneHz = 1600.0f;
  static constexpr float kLeanPerOctave = 0.5f;  // two octaves from none to full
  static constexpr float kSqrt2 = 1.41421356f;
  // The longest step the wander is given at once when it catches up a rest.
  static constexpr double kStride = 4194304.0;
  // The second carrier against the first, by the Second choice: off, a
  // fifth up (equal tempered, so it is a note of the key), an octave up, an
  // octave down.
  static constexpr float kSecondRatio[4] = {1.0f, 1.49830708f, 2.0f, 0.5f};
  // With two carriers the first is the stronger; the squares sum to one.
  static constexpr float kFirstGain = 0.8f;
  static constexpr float kSecondGain = 0.6f;

  bool live() const { return !resting_; }

  // How much of a carrier at `hz` is a tremolo: 1 at 4 Hz and under, 0 from
  // 16 Hz up.
  static float slow(float hz) { return kit::clamp((kFastHz - hz) * (1.0f / (kFastHz - kSlowHz)), 0.0f, 1.0f); }

  // The carrier's shape at `phase`: a weighted sum while two shapes cross.
  static float shape(const float* weight, const Cut& cut, float phase) {
    float m = 0.0f;
    if (weight[kWaveSine] > 0.0f) m += weight[kWaveSine] * kSqrt2 * kit::SineTable::lookup(phase);
    for (int table = 0; table < ring::Waves::kNumShapes; ++table) {
      const float w = weight[kWaveTriangle + table];
      if (w <= 0.0f) continue;
      float value = ring::Waves::read(table, cut.base, phase);
      if (cut.blend > 0.0f) {
        value += cut.blend * (ring::Waves::read(table, cut.upper, phase) - value);
      }
      m += w * value;
    }
    return m;
  }

  // What the bridge puts out for a signal x against a carrier of one. Less
  // signal times gate, that is the lean: nothing for a small signal; for a
  // loud one the gate rounds off, the level gives a little and odd harmonics
  // of the signal come through. The lean is not band-limited (it is worked
  // out sample by sample), so it is kept where it folds least: it is taken
  // from the signal under 2.5 kHz, and let go as the carrier rises from
  // 400 Hz to 1600 Hz. The harness says how much still folds.
  static float swing(float carrier, float x) {
    using ring::Diode;
    const float reach = 0.5f * kDiodeDrive * x;
    return (Diode::bridge(carrier + reach) - Diode::bridge(carrier - reach)) * (1.0f / kDiodeDrive);
  }

  // Which tables a carrier at `hz` reads. A cut comes in as the carrier
  // falls from where its highest harmonic meets the limit to where the next
  // cut's does, so no harmonic is ever above the limit and none arrives at
  // once.
  Cut choose_cut(float hz) const {
    using ring::Waves;
    Cut cut;
    const float room = band_limit_hz_ / kit::max(hz, 1.0e-3f);
    int j = 0;
    while (j + 1 < Waves::kCuts && static_cast<float>(Waves::kLimit[j + 1]) <= room) ++j;
    if (j == 0) return cut;
    const float from = static_cast<float>(Waves::kLimit[j]);
    const float to = j + 1 < Waves::kCuts ? static_cast<float>(Waves::kLimit[j + 1]) : 2.0f * from;
    cut.base = j - 1;
    cut.upper = j;
    cut.blend = kit::clamp((room - from) / (to - from), 0.0f, 1.0f);
    return cut;
  }

  // Every 16 samples: the drift, the filters, the tables.
  void control() {
    const float sr = sample_rate();
    const float lean = kCentsToLog * kDriftCents * drift_.next() * wander_.next(kControlPeriod);
    drift_ratio_ = 1.0f + lean * (1.0f + 0.5f * lean);
    const float low = low_cut_log_.next();
    const float tone = tone_log_.next();
    if (low != low_seen_ || tone != tone_seen_) {
      low_seen_ = low;
      tone_seen_ = tone;
      const float low_hz = std::exp2(low);
      const float tone_hz = std::exp2(tone);
      for (int c = 0; c < 2; ++c) {
        low_cut_[c].set(low_hz, kit::kSqrtHalf, sr);
        tone_[c].set(tone_hz, kit::kSqrtHalf, sr);
      }
    }
    const float hz = hz_now_ * drift_ratio_;
    const float hz_of[2] = {hz, hz * ratio_.value};
    for (int k = 0; k < 2; ++k) {
      cut_[k] = choose_cut(hz_of[k]);
      lean_[k] = kit::clamp(std::log2(kLeanNoneHz / kit::max(hz_of[k], 1.0e-3f)) * kLeanPerOctave, 0.0f, 1.0f);
    }
    carrier_now_ = hz;
  }

  // Nothing is sounding: every knob is where it was last put, and the next
  // sample starts a control period.
  void arrive() {
    pitch_.snap(pitch_.target);
    hz_now_ = hz_set_;
    ratio_.snap(ratio_.target);
    first_gain_.snap(first_gain_.target);
    second_gain_.snap(second_gain_.target);
    for (kit::Smoother& weight : weight_) weight.snap(weight.target);
    width_.snap(width_.target);
    mix_.snap(mix_.target);
    drift_.snap(drift_.target);
    low_cut_log_.snap(low_cut_log_.target);
    tone_log_.snap(tone_log_.target);
    low_seen_ = -1.0f;
    tone_seen_ = -1.0f;
    mix_seen_ = -1.0f;
    offset_seen_ = -1.0f;
    clock_.reset(kControlPeriod);
  }

  // The rest is over: the carriers and the drift have run on through it.
  // They are turned by the samples rested in one step, at the pitch that is
  // set now, so where they stand does not depend on how the rest was cut
  // into blocks. (The drift's own lean on the pitch over the rest is left
  // out: it comes to nothing on average.)
  void catch_up() {
    if (rested_ <= 0.0) return;
    const double seconds = rested_ / static_cast<double>(sample_rate());
    const double turned = static_cast<double>(hz_set_) * seconds;
    phase_[0] += turned;
    phase_[0] -= std::floor(phase_[0]);
    phase_[1] += turned * static_cast<double>(ratio_.target);
    phase_[1] -= std::floor(phase_[1]);
    // The wander takes its steps as floats: in strides short enough to be exact.
    double left = rested_;
    while (left > 0.0) {
      const double stride = left < kStride ? left : kStride;
      wander_.next(static_cast<int>(stride));
      left -= stride;
    }
    rested_ = 0.0;
  }

  void rest() {
    resting_ = true;
    quiet_ = 0;
    rested_ = 0.0;
    for (int c = 0; c < 2; ++c) {
      low_cut_[c].reset();
      tone_[c].reset();
      body_[c].reset();
    }
  }

  float target_hz() const {
    using namespace ring;
    const float fine = kit::cents_to_ratio(param(kFine));
    if (param(kTune) >= 0.5f) return param(kFrequency) * fine;
    const int root = kit::clamp_int(static_cast<int>(std::floor(param(kRoot) + 0.5f)), 0, 11);
    const int octave = static_cast<int>(std::floor(param(kOctave) + 0.5f));
    return note_hz(root, octave) * fine;
  }

  void apply(int id) {
    using namespace ring;
    const float value = param(id);
    switch (id) {
      case kRoot:
      case kOctave:
      case kFine:
      case kTune:
      case kFrequency:
        hz_set_ = target_hz();
        pitch_.set(std::log2(hz_set_), live());
        if (!live()) hz_now_ = hz_set_;
        break;
      case kWave: {
        const int wave = kit::clamp_int(static_cast<int>(value + 0.5f), 0, kNumWaves - 1);
        for (int w = 0; w < kNumWaves; ++w) weight_[w].set(w == wave ? 1.0f : 0.0f, live());
        break;
      }
      case kSecond: {
        const int second = kit::clamp_int(static_cast<int>(value + 0.5f), 0, 3);
        first_gain_.set(second == 0 ? 1.0f : kFirstGain, live());
        second_gain_.set(second == 0 ? 0.0f : kSecondGain, live());
        if (second != 0) {
          // A carrier that is not sounding has nothing to glide from.
          const bool sounding = second_gain_.value > 0.0f;
          ratio_.set(kSecondRatio[second], live() && sounding);
        }
        break;
      }
      case kDrift:
        drift_.set(value * value, live());
        break;
      case kLowCut:
        low_cut_log_.set(std::log2(value), live());
        break;
      case kTone:
        tone_log_.set(std::log2(value), live());
        break;
      case kWidth:
        width_.set(value, live());
        break;
      case kMix:
        mix_.set(value, live());
        break;
      default:
        break;
    }
  }

  kit::Svf low_cut_[2];
  kit::Svf tone_[2];
  kit::OnePole body_[2];
  // The carrier's pitch as the logarithm of its frequency, which is what
  // glides; `hz_set_` is where it is going and `hz_now_` where it is.
  kit::Smoother pitch_;
  kit::Smoother ratio_, first_gain_, second_gain_, width_, mix_;
  kit::Smoother weight_[kNumWaves];
  // These three move on the control clock.
  kit::Smoother drift_, low_cut_log_, tone_log_;
  kit::Drift wander_;
  kit::ControlClock clock_;
  Cut cut_[2];
  float lean_[2] = {0.0f, 0.0f};
  double phase_[2] = {0.25, 0.25};
  // Samples spent at rest since the last one that sounded.
  double rested_ = 0.0;
  float hz_set_ = 261.6256f;
  float hz_now_ = 261.6256f;
  float drift_ratio_ = 1.0f;
  float band_limit_hz_ = 8000.0f;
  float low_seen_ = -1.0f;
  float tone_seen_ = -1.0f;
  float mix_seen_ = -1.0f;
  float offset_seen_ = -1.0f;
  // What a slow carrier of each shape is scaled by at the Width last seen.
  float tame_[kNumWaves] = {1.0f, 1.0f, 1.0f, 1.0f};
  float dry_gain_ = 1.0f;
  float wet_gain_ = 0.0f;
  long hold_ = 1;
  long quiet_ = 0;
  bool resting_ = true;
  // For meter() only: never read by the sound.
  float carrier_now_ = 0.0f;
};

}  // namespace livemix
