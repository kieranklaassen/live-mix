#pragma once

// The noise of each medium of Patina (patina.h), before its level control.
//
// Every medium has a steady part, scaled here to an RMS of 1 at 48 kHz, and
// some have events on top of it:
//
//   Reel      hiss: white noise tilted up.
//   Cassette  the same, brighter.
//   Vinyl     a soft surface noise and a faint rumble near 30 Hz; crackle,
//             ticks of heavy-tailed size through a resonant band around
//             2.5 kHz, one a second at the bottom of the knob and about 25 at
//             the top, mostly in the middle; now and then a low pop.
//   Radio     static, band-limited noise, with crackling bursts over it, and
//             a faint mains hum.
//   Sampler   a digital hash: white noise and an idle tone. The device holds
//             it on its converter clock with the signal.
//   Valve     hum, a 100 Hz buzz with its harmonics, and a little hiss.
//
// The two channels have their own noise; what is tonal (hum, idle tone) is a
// quarter of a cycle apart between them. White noise is scaled with the
// sample rate so its density in the audible band is the same at any rate,
// and a tick is one sample scaled the same way. The dice for the events are
// thrown on the device's control clock, every time, so the sequence does not
// depend on the knob.

#include "../../kit/kit.h"

namespace livemix {
namespace patina_parts {

class Noise {
 public:
  enum Medium : int { kReel = 0, kCassette, kVinyl, kRadio, kSampler, kValve, kNumMedia };

  void init(float sample_rate) {
    sr_ = sample_rate;
    rate_scale_ = std::sqrt(sample_rate / 48000.0f);
    tick_scale_ = sample_rate / 48000.0f;
    rng_[0].seed(0x3C6EF372u);
    rng_[1].seed(0xA54FF53Au);
    dice_.seed(0x1F83D9ABu);
    set_medium(kReel);
  }

  // Tune the filters for a medium and empty them.
  void set_medium(int medium) {
    medium_ = medium;
    for (int c = 0; c < 2; ++c) {
      low_[c].reset();
      band_[c].reset();
      tick_[c] = 0.0f;
    }
    rumble_.reset();
    pop_.reset();
    pop_tick_ = 0.0f;
    burst_ = 0.0f;
    burst_decay_ = 0.0f;
    phase_ = 0.0f;
    phase_step_ = 0.0f;
    switch (medium) {
      case kCassette:
        low_[0].set_cutoff(kCassetteTiltHz, sr_);
        low_[1].set_cutoff(kCassetteTiltHz, sr_);
        break;
      case kVinyl:
        low_[0].set_cutoff(kSurfaceHz, sr_);
        low_[1].set_cutoff(kSurfaceHz, sr_);
        // A little apart, so a tick is not the same sound on both sides.
        band_[0].set(kCrackleHz * 0.92f, kCrackleQ, sr_);
        band_[1].set(kCrackleHz * 1.09f, kCrackleQ, sr_);
        rumble_.set(kRumbleHz, 1.5f, sr_);
        pop_.set(kPopHz, 1.2f, sr_);
        break;
      case kRadio:
        band_[0].set(kStaticHz, 0.5f, sr_);
        band_[1].set(kStaticHz, 0.5f, sr_);
        phase_step_ = kMainsHz / sr_;
        break;
      case kSampler:
        phase_step_ = kIdleToneHz / sr_;
        break;
      case kValve:
        low_[0].set_cutoff(kReelTiltHz, sr_);
        low_[1].set_cutoff(kReelTiltHz, sr_);
        phase_step_ = 2.0f * kMainsHz / sr_;
        break;
      case kReel:
      default:
        low_[0].set_cutoff(kReelTiltHz, sr_);
        low_[1].set_cutoff(kReelTiltHz, sr_);
        break;
    }
  }

  // Once per control period of `dt` seconds: the dice for the events.
  // `amount` is the Noise knob.
  void control(float amount, float dt) {
    const float chance = dice_.uniform();
    const float size = dice_.uniform();
    const float place = dice_.bipolar();
    const float sign = dice_.uniform();
    const float pop = dice_.uniform();
    if (medium_ == kVinyl) {
      const float ticks = 1.0f + (kTicksPerSecond - 1.0f) * amount * std::sqrt(amount);
      if (chance < ticks * dt) {
        // Heavy-tailed: most ticks are small, a few are several times the size.
        const float height =
            kTickHeight * tick_scale_ * (sign < 0.5f ? -1.0f : 1.0f) / (1.0f + 6.0f * size);
        tick_[0] = height * (1.0f - 0.6f * kit::max(place, 0.0f));
        tick_[1] = height * (1.0f - 0.6f * kit::max(-place, 0.0f));
      }
      if (pop < kPopsPerSecond * amount * dt) {
        pop_tick_ = kPopHeight * tick_scale_ * (0.5f + 0.5f * size) * (sign < 0.5f ? -1.0f : 1.0f);
      }
    } else if (medium_ == kRadio) {
      burst_ *= burst_decay_;
      if (burst_ < 1.0e-4f) burst_ = 0.0f;
      if (chance < kBurstsPerSecond * dt) {
        burst_ = kit::max(burst_, 0.3f + 0.7f * size);
        // Over in 40 to 240 ms.
        burst_decay_ = std::exp(-dt / (0.04f + 0.2f * pop));
      }
    }
  }

  // One frame.
  void next(float* left, float* right) {
    const float white[2] = {rng_[0].bipolar() * rate_scale_, rng_[1].bipolar() * rate_scale_};
    float out[2];
    switch (medium_) {
      case kCassette:
        for (int c = 0; c < 2; ++c) {
          out[c] = kCassetteLevel * (white[c] - kCassetteTilt * low_[c].lowpass(white[c]));
        }
        break;
      case kVinyl: {
        const float rumble = kRumble * rumble_.bandpass(white[0] + white[1]);
        const float pop = pop_.bandpass(pop_tick_);
        pop_tick_ = 0.0f;
        for (int c = 0; c < 2; ++c) {
          const float surface = low_[c].lowpass(white[c]);
          out[c] = kVinylLevel * (surface + (c == 0 ? rumble : -0.3f * rumble)) +
                   band_[c].bandpass(tick_[c]) + pop;
          tick_[c] = 0.0f;
        }
        break;
      }
      case kRadio: {
        advance();
        for (int c = 0; c < 2; ++c) {
          const float quarter = 0.25f * static_cast<float>(c);
          const float hum = kit::SineTable::lookup(phase_ + quarter) +
                            0.6f * kit::SineTable::lookup(2.0f * phase_ + quarter) +
                            0.3f * kit::SineTable::lookup(3.0f * phase_ + quarter);
          // In a burst the loudest samples are thrown much further: sparks.
          const bool spark =
              white[c] > kSparkOver * rate_scale_ || white[c] < -kSparkOver * rate_scale_;
          const float thrown = white[c] * (spark ? 1.0f + kSpark * burst_ : 1.0f);
          out[c] = kRadioLevel * (band_[c].bandpass(thrown) + kRadioHum * hum);
        }
        break;
      }
      case kSampler: {
        advance();
        out[0] = kSamplerLevel * (white[0] + kIdleTone * kit::SineTable::lookup(phase_));
        out[1] = kSamplerLevel * (white[1] + kIdleTone * kit::SineTable::lookup(phase_ + 0.25f));
        break;
      }
      case kValve: {
        advance();
        for (int c = 0; c < 2; ++c) {
          const float quarter = 0.25f * static_cast<float>(c);
          const float hum = kit::SineTable::lookup(phase_ + quarter) +
                            0.5f * kit::SineTable::lookup(2.0f * phase_ + quarter) +
                            0.3f * kit::SineTable::lookup(3.0f * phase_ + quarter) +
                            0.15f * kit::SineTable::lookup(5.0f * phase_ + quarter);
          out[c] =
              kValveLevel * (hum + kValveHiss * (white[c] - kReelTilt * low_[c].lowpass(white[c])));
        }
        break;
      }
      case kReel:
      default:
        for (int c = 0; c < 2; ++c) {
          out[c] = kReelLevel * (white[c] - kReelTilt * low_[c].lowpass(white[c]));
        }
        break;
    }
    *left = out[0];
    *right = out[1];
  }

 private:
  static constexpr float kReelTiltHz = 1000.0f;
  static constexpr float kReelTilt = 0.6f;
  static constexpr float kCassetteTiltHz = 5000.0f;
  static constexpr float kCassetteTilt = 0.92f;
  static constexpr float kSurfaceHz = 3500.0f;
  static constexpr float kCrackleHz = 2500.0f;
  static constexpr float kCrackleQ = 2.0f;
  static constexpr float kRumbleHz = 30.0f;
  static constexpr float kRumble = 4.5f;
  static constexpr float kPopHz = 90.0f;
  static constexpr float kTicksPerSecond = 25.0f;
  static constexpr float kPopsPerSecond = 0.35f;
  static constexpr float kStaticHz = 1800.0f;
  static constexpr float kBurstsPerSecond = 2.5f;
  static constexpr float kSparkOver = 0.8f;
  static constexpr float kSpark = 4.0f;
  static constexpr float kMainsHz = 50.0f;
  static constexpr float kRadioHum = 0.08f;
  static constexpr float kIdleToneHz = 3200.0f;
  static constexpr float kIdleTone = 0.3f;
  static constexpr float kValveHiss = 0.35f;
  // What brings each steady part to an RMS of 1 (measured at 48 kHz), and
  // the largest tick and pop to about 12 times that.
  static constexpr float kReelLevel = 1.862f;
  static constexpr float kCassetteLevel = 2.852f;
  static constexpr float kVinylLevel = 3.27f;
  static constexpr float kRadioLevel = 3.38f;
  static constexpr float kSamplerLevel = 1.64f;
  static constexpr float kValveLevel = 1.19f;
  static constexpr float kTickHeight = 100.0f;
  static constexpr float kPopHeight = 1200.0f;

  void advance() {
    phase_ += phase_step_;
    if (phase_ >= 1.0f) phase_ -= 1.0f;
  }

  kit::Rng rng_[2], dice_;
  kit::OnePole low_[2];
  kit::Svf band_[2], rumble_, pop_;
  float tick_[2] = {0.0f, 0.0f};
  float pop_tick_ = 0.0f;
  float burst_ = 0.0f;
  float burst_decay_ = 0.0f;
  float phase_ = 0.0f;
  float phase_step_ = 0.0f;
  float rate_scale_ = 1.0f;
  float tick_scale_ = 1.0f;
  float sr_ = 48000.0f;
  int medium_ = kReel;
};

}  // namespace patina_parts
}  // namespace livemix
