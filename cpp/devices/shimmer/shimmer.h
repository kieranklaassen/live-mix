#pragma once

// Shimmer: a long reverb whose feedback passes through a pitch shifter, so
// each trip round the tank climbs an interval.
//
//   in ─► pre-delay ─► 4 allpasses ─┬─────────────── early ────────────────┐
//                                   ▼                                      ▼
//                                  (+)─► 8 modulated delay lines ─┬─► taps (+)─► low cut ─► width ─► wet
//                                   ▲                             │
//                                   │                          Hadamard
//                                   │                             │
//                                   └── damping ◄─ decay gain ◄───┤   (six channels go straight back)
//                                                                 │
//               (two channels)  equal-power blend by Shimmer ◄────┤
//                      ▲                                          │
//                      └─ high-pass ◄─ low-pass ◄─ 2 allpasses ◄─ shifter ◄─ low-pass
//
// - The shifter replaces a share of two of the eight feedback channels
//   instead of adding to them, with equal-power gains, so Shimmer moves
//   energy up the ladder without adding any: the loop cannot gain at any
//   setting. What climbs past the low-pass is gone, so the tail of a bright
//   sound shortens as Shimmer rises (noise at Decay 16 s and Shimmer 0.5
//   rings for about 7 s); a low note has several octaves to climb first.
// - The shifter is a delay line read by four heads a quarter window apart
//   under Hann windows, each pass starting where it best continues the
//   others (see SpliceShifter). Two heads on a fixed grid flutter at the
//   splice rate; these, followed by two allpasses and then the tank itself,
//   do not. The two shifters use different window lengths so their splices
//   never line up.
// - The shifted signal is low-passed before it re-enters (as the original
//   patch rolled off the highs) and band-limited before the shifter so that
//   reading at two to four times speed does not alias. Each pass moves the
//   sound one interval further up until it leaves through that low-pass, or
//   down until it leaves through the high-pass.
// - Lines are read with linear interpolation: its response never exceeds
//   unity, which matters in a loop whose gain is within a hair of 1 at the
//   longest decay.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

// Delay-line pitch shifter with four overlapping heads. Head k sits at
// (phase + k/4) of the window and is weighted by a Hann bell that is zero
// where the head wraps; the four bells sum to 2, hence the 0.5.
//
// Where a head starts each pass decides how it sounds. On a fixed grid the
// heads splice with a fixed phase error, which turns a steady tone into a
// comb of lines four window rates apart (the strongest can sit a quarter
// tone off pitch); at random offsets the pitch is right on average but the
// heads beat against each other, a constant flutter. So each new pass looks
// for its start: over one search range (a full cycle down to 47 Hz) it
// takes the offset whose next 13 ms agree best with what the other three
// heads are about to play. A note, or anything else periodic, then comes
// out as one steady tone at exactly ratio x f; a dense tail gets the least
// cancellation available, and the allpasses and the tank cover the rest.
template <int Size>
class SpliceShifter {
 public:
  void clear(uint32_t seed) {
    line_.clear();
    phase_ = 0.0f;
    cos_ = 1.0f;
    sin_ = 0.0f;
    rng_.seed(seed);
    for (int k = 0; k < kHeads; ++k) {
      offset_[k] = 0.0f;
      previous_[k] = 0.25f * static_cast<float>(k);
    }
  }

  // `window`: one pass of a head; `search`: the range of starting offsets;
  // `span`: how far ahead a candidate is compared. All in samples. The
  // longest read is 3 x window + search (two octaves up) and has to fit.
  void set_window(float window, float search, float span) {
    search_ = kit::clamp(search, 16.0f, static_cast<float>(Size / 8));
    span_ = kit::clamp(span, 16.0f, static_cast<float>(Size / 8));
    window_ = kit::clamp(window, 8.0f * span_, (static_cast<float>(Size - 64) - search_ - span_) / 3.0f);
    step_ = 1.0f / window_;
    cos_step_ = std::cos(kit::kTwoPi * step_);
    sin_step_ = std::sin(kit::kTwoPi * step_);
  }

  float process(float x, float ratio) {
    line_.write(x);
    // A head sweeps the distance the pitch change needs over one window:
    // towards the write point to shift up, away from it to shift down.
    const bool up = ratio > 1.0f;
    const float travel = (up ? ratio - 1.0f : 1.0f - ratio) * window_;
    phase_ += up ? -step_ : step_;
    // cos and sin of the phase by rotation, exact again at every wrap.
    const float turn = up ? -sin_step_ : sin_step_;
    const float c = cos_ * cos_step_ - sin_ * turn;
    sin_ = sin_ * cos_step_ + cos_ * turn;
    cos_ = c;
    if (phase_ < 0.0f || phase_ >= 1.0f) {
      phase_ -= std::floor(phase_);
      cos_ = kit::SineTable::cos_lookup(phase_);
      sin_ = kit::SineTable::lookup(phase_);
    }
    const float weight[kHeads] = {0.5f - 0.5f * cos_, 0.5f + 0.5f * sin_, 0.5f + 0.5f * cos_,
                                  0.5f - 0.5f * sin_};
    float position[kHeads];
    int starting = -1;
    for (int k = 0; k < kHeads; ++k) {
      position[k] = phase_ + 0.25f * static_cast<float>(k);
      if (position[k] >= 1.0f) position[k] -= 1.0f;
      const float jump = position[k] - previous_[k];
      if (jump > 0.5f || jump < -0.5f) starting = k;
      previous_[k] = position[k];
    }
    if (starting >= 0) offset_[starting] = find_start(starting, position, ratio, up, travel);
    float sum = 0.0f;
    for (int k = 0; k < kHeads; ++k) {
      sum += weight[k] * line_.read_hermite(2.0f + offset_[k] + position[k] * travel);
    }
    return 0.5f * sum;
  }

 private:
  static constexpr int kHeads = 4;
  static constexpr int kPoints = 80;      // samples of the comparison
  static constexpr int kCandidates = 256;  // coarse steps across the search range

  // The offset at which head `k`, starting a pass now, best continues what
  // the other heads will play. A head with delay d reads the line at
  // (now - d) and moves along it by `ratio` per sample, so everything
  // compared here is already in the line.
  float find_start(int k, const float* position, float ratio, bool up, float travel) {
    const int now = line_.write_position();
    const float stride = span_ / kPoints;
    // Shifting down, a head starts next to the write point: it needs
    // span x ratio of delay in hand to be compared at all.
    const float least = up ? 0.0f : span_ * ratio;
    float reference[kPoints];
    int ahead[kPoints];
    float energy = 0.0f;
    for (int i = 0; i < kPoints; ++i) {
      const float j = static_cast<float>(i) * stride;
      ahead[i] = static_cast<int>(j * ratio + 0.5f);
      float value = 0.0f;
      for (int h = 0; h < kHeads; ++h) {
        if (h == k) continue;
        const float later = position[h] + (up ? -j : j) * step_;
        if (later <= 0.0f || later >= 1.0f) continue;
        const float bell = 0.5f - 0.5f * kit::SineTable::cos_lookup(later);
        const float delay = 2.0f + offset_[h] + position[h] * travel;
        value += bell * line_.at_linear(static_cast<float>(now + ahead[i]) - delay);
      }
      reference[i] = value;
      energy += value * value;
    }
    if (energy < 1.0e-16f) return least + search_ * rng_.uniform();  // nothing playing: anywhere

    // Candidates start on whole samples of the line; `residue` is what that
    // rounding moved the head by, given back at the end.
    const float nearest = 2.0f + least + position[k] * travel;
    const int whole = static_cast<int>(nearest + 0.5f);
    const float residue = static_cast<float>(whole) - nearest;
    const int origin = now - whole;
    const auto score = [&](int offset) {
      float match = 0.0f;
      float power = 1.0e-20f;
      const int base = origin - offset;
      for (int i = 0; i < kPoints; ++i) {
        const float sample = line_.at(base + ahead[i]);
        match += reference[i] * sample;
        power += sample * sample;
      }
      return match / std::sqrt(power);
    };
    const int range = static_cast<int>(search_);
    const int coarse = range / kCandidates > 1 ? range / kCandidates : 1;
    int best = 0;
    float best_score = -1.0e30f;
    for (int offset = 0; offset <= range; offset += coarse) {
      const float value = score(offset);
      if (value > best_score) {
        best_score = value;
        best = offset;
      }
    }
    const int centre = best;
    for (int offset = centre - coarse + 1; offset < centre + coarse; ++offset) {
      if (offset < 0 || offset > range || offset == centre) continue;
      const float value = score(offset);
      if (value > best_score) {
        best_score = value;
        best = offset;
      }
    }
    // The top of the parabola through the best offset and its neighbours:
    // without the fraction of a sample, each splice nudges the phase and
    // the nudges add up the ladder of octaves.
    float fraction = 0.0f;
    if (best > 0 && best < range) {
      const float before = score(best - 1);
      const float after = score(best + 1);
      const float curve = before - 2.0f * best_score + after;
      if (curve < -1.0e-12f) fraction = kit::clamp(0.5f * (before - after) / curve, -0.5f, 0.5f);
    }
    return least + static_cast<float>(best) + fraction + residue;
  }

  kit::DelayLine<Size> line_;
  kit::Rng rng_;
  float phase_ = 0.0f;
  float cos_ = 1.0f, sin_ = 0.0f;
  float window_ = 8192.0f;
  float search_ = 1024.0f;
  float span_ = 640.0f;
  float step_ = 1.0f / 8192.0f;
  float cos_step_ = 1.0f, sin_step_ = 0.0f;
  float offset_[kHeads] = {};
  float previous_[kHeads] = {};
};

class Shimmer : public kit::DeviceBase<shimmer::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace shimmer;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    const float scale = sr / 48000.0f;

    for (int c = 0; c < 2; ++c) {
      predelay_[c].clear();
      low_cut_[c].reset();
      for (int a = 0; a < kInputStages; ++a) {
        input_allpass_[c][a].clear();
        input_length_[c][a] =
            kit::clamp_int(static_cast<int>(kInputAllpass[c][a] * scale), 1, kSmallSize - 1);
      }
      shifter_[c].clear(c == 0 ? 0x3C6EF372u : 0xA54FF53Au);
      shifter_[c].set_window(kShifterWindow[c] * scale, kShifterSearch * scale, kShifterSpan * scale);
      band_limit_[c].reset();
      shimmer_lowpass_[c].reset();
      shimmer_highpass_[c].reset();
      for (int a = 0; a < 2; ++a) {
        shimmer_allpass_[c][a].clear();
        shimmer_length_[c][a] =
            kit::clamp_int(static_cast<int>(kShimmerAllpass[c][a] * scale), 1, kSmallSize - 1);
      }
    }
    for (int i = 0; i < kLines; ++i) {
      line_[i].clear();
      damping_[i].reset();
      length_[i] = kLineSeconds[i] * sr;
      gain_[i] = 0.0f;
      lfo_phase_[i] = static_cast<float>(i) / kLines;
      lfo_increment_[i] = (0.23f + 0.09f * static_cast<float>(i)) * kControlPeriod / sr;
      sweep_[i] = 0.0f;
      sweep_step_[i] = 0.0f;
    }

    dry_.set_time(kSmoothingSeconds, sr);
    wet_.set_time(kSmoothingSeconds, sr);
    keep_.set_time(kSmoothingSeconds, sr);
    send_.set_time(kSmoothingSeconds, sr);
    width_.set_time(kSmoothingSeconds, sr);
    modulation_.set_time(0.05f, sr / kControlPeriod);
    // Size and Pre-delay move read points: glide them slowly enough to bend
    // rather than zip.
    size_.set_time(0.15f, sr);
    predelay_time_.set_time(0.06f, sr);
    // Stepped on the control clock.
    decay_.set_time(0.02f, sr / kControlPeriod);
    level_.set_time(0.02f, sr / kControlPeriod);
    decay_.snap(param(kDecay));
    clock_.reset(kControlPeriod);
    // The longest silent gap: the pre-delay plus the longest line.
    idle_.reset(sr, kParamMax[kPredelay] * 0.001f + 0.5f);
    started_ = false;
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    using namespace shimmer;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    const float max_line = kit::DelayLine<kLineSize>::max_delay() - 2.0f;
    const float max_predelay = kit::DelayLine<kPredelaySize>::max_delay() - 2.0f;
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      if (clock_.tick()) {
        control();
        started_ = true;
      }

      // Pre-delay and input diffusion, per side.
      const float predelay = kit::min(1.0f + glide(predelay_time_), max_predelay);
      float feed[2];
      for (int c = 0; c < 2; ++c) {
        predelay_[c].write(in[c]);
        float x = predelay_[c].read_linear(predelay);
        x = input_allpass_[c][0].process(x, input_length_[c][0], 0.75f);
        x = input_allpass_[c][1].process(x, input_length_[c][1], 0.75f);
        x = input_allpass_[c][2].process(x, input_length_[c][2], 0.625f);
        x = input_allpass_[c][3].process(x, input_length_[c][3], 0.625f);
        feed[c] = 0.5f * x;
      }

      // The tank.
      const float size = glide(size_);
      float v[kLines];
      for (int n = 0; n < kLines; ++n) {
        sweep_[n] += sweep_step_[n];
        v[n] = line_[n].read_linear(kit::clamp(length_[n] * size + sweep_[n], 2.0f, max_line));
      }
      // The diffused input is heard at once; the lines answer 20 to 60 ms
      // later, depending on Size.
      float wet_left = 0.5f * (v[0] - v[2] + v[4] - v[6]) + feed[0];
      float wet_right = 0.5f * (v[1] - v[3] + v[5] - v[7]) + feed[1];

      hadamard8(v);

      // Two of the eight feedback channels pass through the shifters.
      const float keep = glide(keep_);
      const float send = glide(send_);
      for (int c = 0; c < 2; ++c) {
        float s = shifter_[c].process(band_limit_[c].lowpass(v[c]), ratio_);
        s = shimmer_allpass_[c][0].process(s, shimmer_length_[c][0], 0.6f);
        s = shimmer_allpass_[c][1].process(s, shimmer_length_[c][1], 0.6f);
        s = shimmer_highpass_[c].highpass(shimmer_lowpass_[c].lowpass(s));
        v[c] = keep * v[c] + send * s;
      }

      for (int n = 0; n < kLines; ++n) {
        const float back = damping_[n].lowpass(v[n] * gain_[n]);
        const float x = back + ((n & 2) ? -feed[n & 1] : feed[n & 1]);
        // Linear to ±2, landing on ±4: out of the way of any normal level.
        line_[n].write(flush_denormal(4.0f * kit::soft_clip(0.25f * x)));
      }

      wet_left = low_cut_[0].highpass(wet_left);
      wet_right = low_cut_[1].highpass(wet_right);
      const float width = glide(width_);
      const float mid = 0.5f * (wet_left + wet_right);
      const float side = 0.5f * (wet_left - wet_right) * width;
      const float wet = glide(wet_) * level_.value;
      const float dry = glide(dry_);
      out_left_[i] = in[0] * dry + (mid + side) * wet;
      out_right_[i] = in[1] * dry + (mid - side) * wet;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kLines = 8;
  static constexpr int kLineSize = 16384;      // 165 ms at 96 kHz plus modulation
  static constexpr int kPredelaySize = 65536;  // 500 ms at 96 kHz
  static constexpr int kSmallSize = 2048;
  static constexpr int kShifterSize = 65536;    // two octaves up reads 3 windows back
  static constexpr int kInputStages = 4;
  static constexpr int kControlPeriod = 32;

  // Line lengths at Size 0.5, mutually prime in samples at 48 kHz.
  static constexpr float kLineSeconds[kLines] = {0.041354f, 0.047896f, 0.055104f, 0.062313f,
                                                 0.071938f, 0.083271f, 0.094729f, 0.108104f};
  // Size 0..1 scales the lines by 0.5..1.5.
  static constexpr float kMinScale = 0.5f;
  static constexpr float kMaxScale = 1.5f;
  // Peak read-point excursion at Modulation 1: about ±8 cents on the
  // fastest line (0.86 Hz).
  static constexpr float kModulationSeconds = 0.0009f;
  // Dattorro's input diffuser lengths at 48 kHz; the right side is offset
  // so a centred source still spreads.
  static constexpr float kInputAllpass[2][kInputStages] = {{229.0f, 173.0f, 611.0f, 447.0f},
                                                           {241.0f, 181.0f, 631.0f, 463.0f}};
  // 170 and 142 ms windows; a head's start is searched over 21 ms (a full
  // cycle down to 47 Hz), comparing the 13 ms that follow.
  static constexpr float kShifterWindow[2] = {8192.0f, 6827.0f};
  static constexpr float kShifterSearch = 1024.0f;
  static constexpr float kShifterSpan = 640.0f;
  static constexpr float kShimmerAllpass[2][2] = {{337.0f, 521.0f}, {389.0f, 463.0f}};
  static constexpr float kIntervalRatio[5] = {2.0f, 1.5f, 3.0f, 0.5f, 4.0f};
  static constexpr float kWetGain = 1.7f;

  // kit::hadamard<8> written out: the loop form costs six times as much
  // without unrolling, and this runs every sample.
  static void hadamard8(float* v) {
    const float a0 = v[0] + v[1], a1 = v[0] - v[1], a2 = v[2] + v[3], a3 = v[2] - v[3];
    const float a4 = v[4] + v[5], a5 = v[4] - v[5], a6 = v[6] + v[7], a7 = v[6] - v[7];
    const float b0 = a0 + a2, b1 = a1 + a3, b2 = a0 - a2, b3 = a1 - a3;
    const float b4 = a4 + a6, b5 = a5 + a7, b6 = a4 - a6, b7 = a5 - a7;
    constexpr float scale = 0.35355339059f;
    v[0] = (b0 + b4) * scale;
    v[1] = (b1 + b5) * scale;
    v[2] = (b2 + b6) * scale;
    v[3] = (b3 + b7) * scale;
    v[4] = (b0 - b4) * scale;
    v[5] = (b1 - b5) * scale;
    v[6] = (b2 - b6) * scale;
    v[7] = (b3 - b7) * scale;
  }

  // A smoother that has arrived costs one compare.
  static float glide(kit::Smoother& s) { return s.value == s.target ? s.value : s.next(); }

  // Every 32 samples: loop gains from Decay and the line lengths, the line
  // LFOs, and the filters that read their parameters directly.
  void control() {
    using namespace shimmer;
    const float sr = sample_rate();
    const float decay = decay_.next();
    const float size = size_.value;
    // Each line's read point heads for where its LFO will be one period on.
    const float depth = modulation_.next() * kModulationSeconds * sr;
    for (int n = 0; n < kLines; ++n) {
      gain_[n] = kit::rt60_gain(length_[n] * size, decay, sr);
      lfo_phase_[n] += lfo_increment_[n];
      if (lfo_phase_[n] >= 1.0f) lfo_phase_[n] -= 1.0f;
      const float target = depth * kit::SineTable::lookup(lfo_phase_[n]);
      sweep_step_[n] = (target - sweep_[n]) * (1.0f / kControlPeriod);
    }
    // A long decay stores more energy for the same input; take half of that
    // back (in dB) so the Decay knob is not also a volume knob.
    const float middle = gain_[kLines / 2] * gain_[kLines / 2];
    level_.set(kWetGain * std::sqrt(std::sqrt(kit::max(1.0f - middle, 1.0e-4f))), started_);
    level_.next();

    const float tone = param(kTone);
    damping_[0].set_cutoff(tone, sr);
    for (int n = 1; n < kLines; ++n) damping_[n].a = damping_[0].a;
    const float low_cut = param(kLowCut);
    for (int c = 0; c < 2; ++c) {
      low_cut_[c].set(low_cut, kit::kSqrtHalf, sr);
      // Nothing above half the shifted Nyquist goes into the shifter.
      band_limit_[c].set(kit::min(0.4f * sr / kit::max(ratio_, 1.0f), 16000.0f), 0.6f, sr);
      shimmer_lowpass_[c].set(kit::min(0.75f * tone, 6000.0f), 0.6f, sr);
      shimmer_highpass_[c].set_cutoff(kit::max(low_cut, 60.0f), sr);
    }
  }

  void apply(int id) {
    using namespace shimmer;
    const float value = param(id);
    switch (id) {
      case kMix: {
        float dry, wet;
        kit::equal_power(value, &dry, &wet);
        if (value >= 1.0f) dry = 0.0f;  // cos(pi/2) in floats is -4e-8, not 0
        dry_.set(dry, primed());
        wet_.set(wet, primed());
        break;
      }
      case kDecay:
        if (primed()) {
          decay_.set_target(value);
        } else {
          decay_.snap(value);
        }
        break;
      case kShimmer: {
        float keep, send;
        kit::equal_power(value, &keep, &send);
        keep_.set(keep, primed());
        send_.set(send, primed());
        break;
      }
      case kInterval:
        ratio_ = kIntervalRatio[kit::clamp_int(static_cast<int>(value + 0.5f), 0, 4)];
        break;
      case kSize:
        size_.set(kit::lerp(kMinScale, kMaxScale, value), primed());
        break;
      case kModulation:
        modulation_.set(value, primed());
        break;
      case kPredelay:
        predelay_time_.set(value * 0.001f * sample_rate(), primed());
        break;
      case kWidth:
        width_.set(value, primed());
        break;
      default:
        break;  // Tone and Low Cut are read on the control clock
    }
  }

  kit::DelayLine<kPredelaySize> predelay_[2];
  kit::AllpassDelay<kSmallSize> input_allpass_[2][kInputStages];
  int input_length_[2][kInputStages] = {};
  kit::DelayLine<kLineSize> line_[kLines];
  kit::OnePole damping_[kLines];
  float length_[kLines] = {};
  float gain_[kLines] = {};
  float lfo_phase_[kLines] = {};
  float lfo_increment_[kLines] = {};
  float sweep_[kLines] = {};
  float sweep_step_[kLines] = {};

  SpliceShifter<kShifterSize> shifter_[2];
  kit::Svf band_limit_[2];
  kit::Svf shimmer_lowpass_[2];
  kit::OnePole shimmer_highpass_[2];
  kit::AllpassDelay<kSmallSize> shimmer_allpass_[2][2];
  int shimmer_length_[2][2] = {};
  float ratio_ = 2.0f;

  kit::Svf low_cut_[2];
  kit::Smoother dry_, wet_, keep_, send_, width_, modulation_, size_, predelay_time_;
  kit::Smoother decay_, level_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  bool started_ = false;  // the first control tick snaps what later ones glide
};

}  // namespace livemix
