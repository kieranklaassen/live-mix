#pragma once

// Spectral Blur: a short-time Fourier effect that makes the spectrum hang,
// dissolve and freeze.
//
//   in ─┬─► delay 2304 ─────────────────────────────────────────► dry ─┐
//       │                                                               ├─► out
//       └─► Hann ─► FFT ─► per bin ─► IFFT ─► Hann ─► overlap-add ─► limit ─► wet ─┘
//                             │
//                             hold ─► phase ─► shimmer ─► tilt and cuts
//
// 2048-point frames every 512 samples (75 % overlap), Hann on the way in and
// on the way out; Hann² frames at that overlap add up to 1.5, which is the
// normalisation. Each channel has its own frames.
//
// - Blur: each bin's magnitude rises with its input and falls at a rate set
//   by Blur (RT60 = 20 s × Blur³). A bin the input has let go of is "held":
//   it keeps sounding at the frequency it had, because its phase goes on
//   turning by the bin's last measured turn per frame (a rotator taken from
//   two successive analysis frames, so no arctangent and no unwrapping).
//   Neighbouring bins of one partial turn together, so a held partial stays
//   a partial. With Blur 0 and Smear 0 the output is the input.
//   The rise is immediate at Blur 0 and takes a few frames at high Blur
//   (30 ms at 1): a pure peak hold would ride the peaks of anything noisy
//   and come out 6 dB hot; softened, noise gains under 4 dB at the extreme
//   and steady tones nothing.
// - Smear turns each bin's phase by a random angle of up to ±Smear × 180°
//   every frame: at 1 that is fresh random phase per frame, which is how
//   Paul's Extreme Sound Stretch gets its diffuse sound. Random phase spreads
//   a frame's energy evenly under the synthesis window instead of under the
//   product of both windows, which costs up to 6 dB; the magnitudes are
//   raised by exactly that.
// - Freeze stops the magnitudes where they are and ignores the input. Held
//   bins then always drift a little in phase (as if Smear were at least
//   0.12), so a frozen sound is a slowly moving drone and never the same
//   frame replayed, which would buzz at the frame rate.
// - Shimmer copies each bin to twice its frequency with twice its phase
//   (and the bins between from neighbouring pairs), which is what squaring
//   the signal would do to one partial: an octave above everything.
// - Tilt and the cuts are gains per bin on the wet signal.
// - Width gives the right channel its own random angles; at 0 both channels
//   use the same ones and a mono input stays mono.
//
// Cost: the two channels work on the same stretch of input but 256 samples
// apart, so a 128-frame block never holds more than one transform pair. That
// stagger is the 256 on top of the 2048-sample frame in the latency, and the
// dry path is delayed by the same 2304 samples so Mix does not comb.
// At 96 kHz the frame is half as long in time (21 ms) and the bins twice as
// wide.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class SpectralBlur : public kit::DeviceBase<spectral_blur::kNumParams> {
 public:
  static constexpr int kFrame = 2048;
  static constexpr int kHop = 512;
  static constexpr int kStagger = 256;
  static constexpr int kLatency = kFrame + kStagger;

  void init(float sample_rate) {
    using namespace spectral_blur;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    fft_.init();
    for (int n = 0; n < kFrame; ++n) {
      window_[n] = 0.5f - 0.5f * static_cast<float>(std::cos(2.0 * 3.14159265358979323846 * n / kFrame));
    }
    for (int i = 0; i < kAngles; ++i) {
      angle_cos_[i] = kit::SineTable::cos_lookup(static_cast<float>(i) / kAngles);
      angle_sin_[i] = kit::SineTable::lookup(static_cast<float>(i) / kAngles);
    }
    for (int k = 0; k <= kHalf; ++k) {
      const float hz = static_cast<float>(k > 0 ? k : 1) * sr / kFrame;
      octave_[k] = std::log2(hz / kTiltPivotHz);
      shape_[k] = 1.0f;
      // For the display: which half decade from 20 Hz the bin lies in.
      band_[k] = static_cast<unsigned char>(kit::clamp_int(static_cast<int>(2.0f * std::log10(hz / 20.0f)), 0, kBands - 1));
    }
    for (int c = 0; c < 2; ++c) {
      Channel& channel = channel_[c];
      for (int i = 0; i < kRing; ++i) {
        channel.input[i] = 0.0f;
        channel.output[i] = 0.0f;
      }
      for (int k = 0; k <= kHalf; ++k) {
        channel.magnitude[k] = 0.0f;
        channel.phase_re[k] = 1.0f;
        channel.phase_im[k] = 0.0f;
        // Until measured, a bin turns by its centre frequency: k quarter turns.
        channel.turn_re[k] = kQuarterTurn[k & 3][0];
        channel.turn_im[k] = kQuarterTurn[k & 3][1];
        channel.last_re[k] = 0.0f;
        channel.last_im[k] = 0.0f;
      }
      channel.alive = false;
      for (int b = 0; b < kBands; ++b) channel.heard[b] = channel.hanging[b] = 0.0f;
    }
    position_ = 0;
    frame_index_ = 0;
    shape_dirty_ = true;
    mix_.set_time(kSmoothingSeconds, sr);
    mix_seen_ = -1.0f;
    // After the last held bin has gone, the frames in flight still have to
    // play out: one frame plus the latency.
    idle_.reset(sr, static_cast<float>(kFrame + kLatency + kHop) / sr);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to show
  // where the spectrum hangs: for each of six half decades from 20 Hz to
  // 20 kHz, the share (0..1) of the wet power in the newest frames that came
  // from bins the input had let go of. 0 is all driven by the input, 1 all
  // held.
  float meter(int index) const {
    if (index < 0 || index >= kBands) return 0.0f;
    const float heard = channel_[0].heard[index] + channel_[1].heard[index];
    const float hanging = channel_[0].hanging[index] + channel_[1].hanging[index];
    return heard > 1.0e-18f ? hanging / heard : 0.0f;
  }

  void process(int frames) {
    using namespace spectral_blur;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames) || channel_[0].alive || channel_[1].alive)) {
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);

      const uint32_t phase = position_ & (kHop - 1);
      if (phase == 0) transform(0);
      if (phase == static_cast<uint32_t>(kStagger)) transform(1);

      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        kit::equal_power(mix, &dry_gain_, &wet_gain_);
      }
      float out[2];
      for (int c = 0; c < 2; ++c) {
        Channel& channel = channel_[c];
        // A NaN or runaway sample would otherwise be held by every bin.
        channel.input[position_ & kRingMask] = (in[c] > -64.0f && in[c] < 64.0f) ? in[c] : 0.0f;
        const float dry = channel.input[(position_ - kLatency) & kRingMask];
        float& slot = channel.output[position_ & kRingMask];
        // Linear up to ±1, never past ±2.
        const float wet = 2.0f * kit::soft_clip(0.5f * slot);
        slot = 0.0f;
        out[c] = dry * dry_gain_ + wet * wet_gain_;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
      ++position_;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kHalf = kFrame / 2;
  static constexpr int kRing = 4096;  // holds a frame plus the stagger, in and out
  static constexpr uint32_t kRingMask = kRing - 1;
  static constexpr float kMaxDecaySeconds = 20.0f;
  static constexpr float kTiltPivotHz = 1000.0f;
  static constexpr float kMaxTiltBoostDb = 12.0f;
  static constexpr float kFreezeDrift = 0.12f;
  static constexpr float kAttackSoftening = 0.7f;
  // Bin magnitudes under this are dropped: a full-scale sine is 512, so this
  // is -174 dBFS per bin, and all 1025 bins at it add up to under -140 dBFS.
  static constexpr float kMagnitudeFloor = 1.0e-6f;
  // Hann² frames at 75 % overlap sum to 1.5; the inverse FFT is unscaled.
  static constexpr float kOutputScale = 1.0f / (1.5f * kFrame);
  static constexpr int kAngles = 2048;  // steps per turn of the random-angle table
  static constexpr int kBands = 6;      // half decades from 20 Hz, for the display's readings
  static constexpr float kQuarterTurn[4][2] = {{1.0f, 0.0f}, {0.0f, 1.0f}, {-1.0f, 0.0f}, {0.0f, -1.0f}};

  struct Channel {
    float input[kRing];
    float output[kRing];
    float magnitude[kHalf + 1];                    // what each bin holds
    float phase_re[kHalf + 1], phase_im[kHalf + 1];  // its phase as a unit vector
    float turn_re[kHalf + 1], turn_im[kHalf + 1];    // its phase advance per frame
    float last_re[kHalf + 1], last_im[kHalf + 1];    // the previous analysis frame
    bool alive;                                    // any bin above the floor
    // Kept for the display (meter()); nothing that sounds reads them.
    float heard[kBands];                           // wet power of the newest frame, per half decade
    float hanging[kBands];                         // the part of it from bins the input has let go of
  };

  void apply(int id) {
    using namespace spectral_blur;
    switch (id) {
      case kTilt:
      case kLowCut:
      case kHighCut:
        shape_dirty_ = true;
        break;
      case kMix:
        mix_.set(param(id), primed());
        break;
      default:
        break;  // the rest is read once per frame
    }
  }

  static float sinc(float x) {
    if (x < 1.0e-4f) return 1.0f;
    return kit::SineTable::lookup(0.5f * x) / (kit::kPi * x);
  }

  // Gain per bin from Tilt and the cuts. The cuts are raised-cosine steps
  // half an octave wide; at the ends of their ranges they are off.
  void update_shape() {
    using namespace spectral_blur;
    const float tilt = param(kTilt);
    const bool low_on = param(kLowCut) > kParamMin[kLowCut] * 1.02f;
    const bool high_on = param(kHighCut) < kParamMax[kHighCut] * 0.98f;
    const float low_octave = std::log2(param(kLowCut) / kTiltPivotHz);
    const float high_octave = std::log2(param(kHighCut) / kTiltPivotHz);
    for (int k = 0; k <= kHalf; ++k) {
      const float db = kit::clamp(tilt * octave_[k], -60.0f, kMaxTiltBoostDb);
      float gain = tilt == 0.0f ? 1.0f : std::exp(db * 0.11512925f);
      if (low_on) {
        const float x = k == 0 ? 0.0f : kit::clamp((octave_[k] - low_octave) * 2.0f + 0.5f, 0.0f, 1.0f);
        gain *= x * x * (3.0f - 2.0f * x);
      }
      if (high_on) {
        const float x = kit::clamp((high_octave - octave_[k]) * 2.0f + 0.5f, 0.0f, 1.0f);
        gain *= x * x * (3.0f - 2.0f * x);
      }
      shape_[k] = gain;
    }
    shape_dirty_ = false;
  }

  // One frame of one channel: analyse the 2048 samples that ended `kStagger`
  // samples ago for the right channel and just now for the left, and add the
  // result to the output so that both come out kLatency after they went in.
  void transform(int c) {
    using namespace spectral_blur;
    Channel& channel = channel_[c];
    const uint32_t offset = c == 0 ? 0 : kStagger;
    if (c == 0) {
      ++frame_index_;
      if (shape_dirty_) update_shape();
    }

    const uint32_t start = position_ - offset - kFrame;
    const float* input = channel.input;
    const float* window = window_;
    // The frame is real, so half a transform does: bins 0..kHalf, the
    // imaginary parts packed from the top of re_ down (kit::Fft::forward_real).
    fft_.forward_real(
        [input, window, start](int n) { return input[(start + n) & kRingMask] * window[n]; }, re_);

    const bool frozen = param(kFreeze) >= 0.5f;
    const float blur = param(kBlur);
    const float seconds = kMaxDecaySeconds * blur * blur * blur;
    // -60 dB after `seconds`.
    const float decay =
        frozen ? 1.0f : (seconds > 0.0f ? std::exp(-6.9077553f * kHop / (seconds * sample_rate())) : 0.0f);
    const float attack = 1.0f - kAttackSoftening * blur;
    const float smear = param(kSmear);
    const float held_smear = frozen ? kit::max(smear, kFreezeDrift) : smear;
    // What random phase costs in level, undone. A driven bin gets a fresh
    // angle each frame: the share sinc(smear) of it stays in step with the
    // frame, the rest is spread out and comes back 6 dB down. A held bin
    // accumulates its angles, so neighbouring frames are in step by
    // c = sinc(smear) and the four that overlap add to (1.5 + 2c + c²/2).
    const float c_driven = sinc(smear);
    const float driven_gain = 1.0f / std::sqrt(c_driven * c_driven + 0.25f * (1.0f - c_driven * c_driven));
    const float c_held = sinc(held_smear);
    const float held_full = std::sqrt(6.0f / (1.5f + 2.0f * c_held + 0.5f * c_held * c_held));
    const float held_gain = 1.0f + (held_full - 1.0f) * kit::min(1.0f, held_smear * 20.0f);

    // Both channels draw the same angles from `shared`; Width moves the right
    // channel towards its own.
    kit::Rng shared, own;
    shared.seed(0x9E3779B9u ^ (frame_index_ * 2654435761u));
    own.seed(0x7F4A7C15u ^ (frame_index_ * 2246822519u));
    for (int warm = 0; warm < 4; ++warm) {
      shared.next_u32();
      own.next_u32();
    }
    const float apart = c == 0 ? 0.0f : param(kWidth);
    const bool randomise = held_smear > 0.0f;
    // Angle to table index: ±1 is ±half a turn at full smear.
    const float driven_steps = 0.5f * smear * kAngles;
    const float held_steps = 0.5f * held_smear * kAngles;

    bool alive = false;
    float heard[kBands] = {};
    float hanging[kBands] = {};
    for (int k = 0; k <= kHalf; ++k) {
      const float xr = re_[k];
      const float xi = (k == 0 || k == kHalf) ? 0.0f : re_[kFrame - k];
      const float lr = channel.last_re[k];
      const float li = channel.last_im[k];
      const float power = xr * xr + xi * xi;
      const float level = std::sqrt(power);
      float held = channel.magnitude[k] * decay;
      const bool driven = !frozen && level >= held;

      // The turn since the last frame, measured only while the bin's input
      // is holding up: the frames in which a sound is cut off have the
      // phase of the cut, not of the sound. Kept unnormalised until needed.
      if (level > 0.1f * held && power >= 0.8f * (lr * lr + li * li)) {
        const float tr = xr * lr + xi * li;
        const float ti = xi * lr - xr * li;
        if (tr * tr + ti * ti > 1.0e-24f) {
          channel.turn_re[k] = tr;
          channel.turn_im[k] = ti;
        }
      }
      channel.last_re[k] = xr;
      channel.last_im[k] = xi;

      float pr, pi;
      if (driven) {
        held += attack * (level - held);
        if (level > 1.0e-12f) {
          const float inverse = 1.0f / level;
          pr = xr * inverse;
          pi = xi * inverse;
        } else {
          pr = 1.0f;
          pi = 0.0f;
        }
      } else {
        float tr = channel.turn_re[k];
        float ti = channel.turn_im[k];
        const float size = tr * tr + ti * ti;
        if (size < 0.999f || size > 1.001f) {
          const float inverse = 1.0f / std::sqrt(size);
          tr *= inverse;
          ti *= inverse;
          channel.turn_re[k] = tr;
          channel.turn_im[k] = ti;
        }
        pr = channel.phase_re[k] * tr - channel.phase_im[k] * ti;
        pi = channel.phase_re[k] * ti + channel.phase_im[k] * tr;
        const float keep = 1.5f - 0.5f * (pr * pr + pi * pi);  // back to unit length
        pr *= keep;
        pi *= keep;
      }
      if (held < kMagnitudeFloor) held = 0.0f;
      channel.magnitude[k] = held;
      alive = alive || held > 0.0f;

      if (randomise) {
        float angle = shared.bipolar();
        if (apart > 0.0f) angle += apart * (own.bipolar() - angle);
        const float steps = angle * (driven ? driven_steps : held_steps);
        const int index = static_cast<int>(steps + static_cast<float>(kAngles)) & (kAngles - 1);
        const float qr = angle_cos_[index];
        const float qi = angle_sin_[index];
        const float rotated = pr * qr - pi * qi;
        pi = pr * qi + pi * qr;
        pr = rotated;
      }
      channel.phase_re[k] = pr;
      channel.phase_im[k] = pi;

      const float out = held * (driven ? driven_gain : held_gain);
      amplitude_[k] = out;
      re_[k] = out * pr;
      im_[k] = out * pi;
      // For the display only: the wet power as it will be heard, and the
      // part of it that is hanging.
      const float shaped = out * shape_[k];
      heard[band_[k]] += shaped * shaped;
      if (!driven) hanging[band_[k]] += shaped * shaped;
    }
    channel.alive = alive;
    for (int b = 0; b < kBands; ++b) {
      channel.heard[b] = heard[b];
      channel.hanging[b] = hanging[b];
    }

    // Shimmer: bin j takes the product of the phases of bins j/2 and
    // (j+1)/2, at the geometric mean of their magnitudes.
    const float shimmer = param(kShimmer);
    if (shimmer > 0.0f) {
      const float* ur = channel.phase_re;
      const float* ui = channel.phase_im;
      for (int a = 1; 2 * a <= kHalf; ++a) {
        const float even = shimmer * amplitude_[a];
        re_[2 * a] += even * (ur[a] * ur[a] - ui[a] * ui[a]);
        im_[2 * a] += even * (2.0f * ur[a] * ui[a]);
        if (2 * a + 1 > kHalf) break;
        const float odd = shimmer * std::sqrt(amplitude_[a] * amplitude_[a + 1]);
        re_[2 * a + 1] += odd * (ur[a] * ur[a + 1] - ui[a] * ui[a + 1]);
        im_[2 * a + 1] += odd * (ur[a] * ui[a + 1] + ui[a] * ur[a + 1]);
      }
    }

    // Tilt and cuts, then the mirror half of a real signal's spectrum.
    re_[0] *= shape_[0];
    im_[0] = 0.0f;
    re_[kHalf] *= shape_[kHalf];
    im_[kHalf] = 0.0f;
    for (int k = 1; k < kHalf; ++k) {
      re_[k] *= shape_[k];
      im_[k] *= shape_[k];
      re_[kFrame - k] = re_[k];
      im_[kFrame - k] = -im_[k];
    }
    fft_.inverse(re_, im_);

    const uint32_t out_start = position_ - offset + kStagger;
    for (int n = 0; n < kFrame; ++n) {
      channel.output[(out_start + n) & kRingMask] += re_[n] * window_[n] * kOutputScale;
    }
  }

  kit::Fft<kFrame> fft_;
  Channel channel_[2];
  float window_[kFrame];
  float octave_[kHalf + 1];     // octaves from the tilt pivot, per bin
  float shape_[kHalf + 1];      // tilt and cut gain, per bin
  unsigned char band_[kHalf + 1];  // the half decade each bin lies in, for the display's readings
  float amplitude_[kHalf + 1];  // scratch: this frame's output magnitudes
  float angle_cos_[kAngles];
  float angle_sin_[kAngles];
  float re_[kFrame];
  float im_[kFrame];
  kit::Smoother mix_;
  kit::IdleGate idle_;
  float mix_seen_ = -1.0f;
  float dry_gain_ = 1.0f;
  float wet_gain_ = 0.0f;
  uint32_t position_ = 0;       // samples processed; only its low bits are used
  uint32_t frame_index_ = 0;
  bool shape_dirty_ = true;
};

}  // namespace livemix
