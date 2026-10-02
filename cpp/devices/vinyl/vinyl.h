#pragma once

// Vinyl: what a record and its turntable do to a sound, as an insert.
//
//   in ─► disc (a long delay line) ─► read head ─► × platter gain ─► wear ─►(+)─► 78 band ─► tone ─► mix
//                                     ▲    ▲                                  ▲
//                         warp (once a turn)  platter lag           crackle, pops, hiss, rumble
//
// [[NOTES]]

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Vinyl : public kit::DeviceBase<vinyl::kNumParams> {
 public:
  static constexpr int kNumSpeeds = 3;
  // Turns per second at 33⅓, 45 and 78 rpm.
  static constexpr float kTurnHz[kNumSpeeds] = {33.3333f / 60.0f, 0.75f, 1.3f};
  // Peak pitch deviation at Warp 1 (the control is squared).
  static constexpr float kWarpDeviation = 0.03f;

  // Events per second of the crackle stream at a Crackle setting (33 or 45).
  static float crackle_rate(float crackle) { return kCrackleRate * crackle * std::sqrt(crackle); }

  void init(float sample_rate) {
    using namespace vinyl;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int c = 0; c < 2; ++c) {
      disc_[c].clear();
      stop_hp_[c].reset();
      stop_hp_[c].set(kSubsonicHz, kit::kSqrtHalf, sr);
      for (int stage = 0; stage < 2; ++stage) {
        trace_lp_[c][stage].reset();
        trace_lp_[c][stage].set(kTraceHz, stage == 0 ? 0.541f : 1.307f, sr);
      }
      wear_shelf_[c].reset();
      wear_shelf_[c].set_identity();
      tone_low_[c].reset();
      tone_low_[c].set_identity();
      tone_high_[c].reset();
      tone_high_[c].set_identity();
      shellac_hp_[c].reset();
      shellac_hp_[c].set_highpass(kShellacLowHz, kit::kSqrtHalf, sr);
      shellac_lp_[c].reset();
      shellac_lp_[c].set_lowpass(kShellacHighHz, kit::kSqrtHalf, sr);
      shellac_peak_[c].reset();
      shellac_peak_[c].set_peak(kShellacPeakHz, 0.8f, kShellacPeakDb, sr);
      hiss_low_[c].reset();
      hiss_low_[c].set_cutoff(kHissLowHz, sr);
      rumble_a_[c].reset();
      rumble_a_[c].set_cutoff(kRumbleHz, sr);
      rumble_b_[c].reset();
      rumble_b_[c].set_cutoff(kRumbleHz, sr);
      rumble_low_[c].reset();
      rumble_low_[c].set_cutoff(kRumbleLowHz, sr);
      dust_[c].reset();
      dust_[c].set(4200.0f, 0.5f, sr);
      thump_[c].reset();
      thump_[c].set(80.0f, 0.9f, sr);
      swish_[c] = 1.0f;
    }
    side_hp_.reset();
    side_hp_.set(kBassMonoHz, kit::kSqrtHalf, sr);
    for (Slot& slot : slots_) {
      slot.filter[0].reset();
      slot.filter[1].reset();
      slot.low = false;
    }
    for (Scratch& scratch : scratches_) scratch = Scratch();

    hiss_noise_[0] = kit::Noise();
    hiss_noise_[1] = kit::Noise();
    hiss_noise_[0].seed(0x3C6EF372u);
    hiss_noise_[1].seed(0xA54FF53Au);
    event_rng_.seed(0x510E527Fu);
    dust_rng_.seed(0x1F83D9ABu);
    rumble_rng_.seed(0x5BE0CD19u);
    for (float& density : dust_map_) density = dust_rng_.uniform();
    crackle_wait_ = exponential(event_rng_);
    pop_wait_ = exponential(event_rng_);
    next_tick_ = 0;
    next_pop_ = 0;
    // Two one-poles at 38 Hz pass this share of white noise's power; the
    // gain that brings uniform noise through them to unit RMS.
    rumble_norm_ = std::sqrt(3.0f * sr / (kit::kPi * 0.5f * kRumbleHz)) * 1.25f;

    mix_.set_time(kSmoothingSeconds, sr);
    hiss_.set_time(kSmoothingSeconds, sr);
    rumble_.set_time(kSmoothingSeconds, sr);
    bass_.set_time(kSmoothingSeconds, sr);
    width_.set_time(kSmoothingSeconds, sr);
    pinch_.set_time(kSmoothingSeconds, sr);
    cubic_.set_time(kSmoothingSeconds, sr);
    shellac_.set_time(0.03f, sr);

    lag_ = 0.0;
    old_lag_ = 0.0;
    spin_ = 1.0f;
    old_spin_ = 1.0f;
    head_fade_ = 0.0f;
    head_fade_step_ = 1.0f / (kHeadFadeSeconds * sr);
    start_rate_ = 0.0f;
    stop_a_ = stop_b_ = 0.0f;
    subsonic_ = 0.0f;
    playing_ = true;
    valid_ = 0;

    warp_drift_.seed(0x51ED270Bu);
    warp_drift_.set_rate(kDriftHz, sr);
    turn_phase_ = 0.0f;
    warp_depth_ = 0.0f;
    warp_amp_[0] = warp_amp_[1] = warp_amp_[2] = 0.0f;
    warp_ = 0.0f;
    warp_step_ = 0.0f;
    pinch_last_ = 0.0f;
    cubic_last_ = 0.0f;
    wear_db_ = 0.0f;
    tone_ = 0.0f;
    shelf_flat_ = true;
    tone_flat_ = true;
    crackle_rate_ = pop_rate_ = 0.0f;
    crackle_floor_ = crackle_ceiling_ = pop_level_ = 0.0f;

    noise_gate_ = 0.0f;
    noise_rise_ = 1.0f / (kNoiseRiseSeconds * sr);
    noise_fall_ = 1.0f / (kNoiseFallSeconds * sr);
    hold_samples_ = static_cast<long>(kNoiseHoldSeconds * sr);
    // Hold, fade, and a little for the filters to empty.
    drain_samples_ = hold_samples_ + static_cast<long>((kNoiseFallSeconds + 0.3f) * sr);
    quiet_ = drain_samples_;

    started_ = false;
    clock_.reset(kControlPeriod);
    idle_.reset(sr, 0.05f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // [[PROCESS]]

 private:
  // 5.46 s at 96 kHz: the furthest the head falls behind (0.575 of the
  // longest Spin Time) plus the widest warp, with room to spare.
  static constexpr int kDiscSize = 524288;
  static constexpr int kControlPeriod = 16;

  // Warp: shares of the pitch deviation taken by the turn, its second
  // harmonic, and a slow drift that never repeats.
  static constexpr float kWarpTurn = 0.62f;
  static constexpr float kWarpSecond = 0.20f;
  static constexpr float kWarpDrift = 0.18f;
  static constexpr float kWarpSecondPhase = 0.19f;  // cycles
  static constexpr float kDriftHz = 0.17f;
  // kit::Drift's three sines have a combined peak slope of 1.032 x 2π·rate.
  static constexpr float kDriftSlope = 1.032f;
  static constexpr float kWarpGlideSeconds = 0.08f;

  // Platter. Slowing: ds/dt = -(a + b·s), friction that eases off as the
  // disc slows and still stops in finite time. Starting: ds/dt = c·(1 + m - s),
  // a motor that pulls hard at first and settles onto speed.
  static constexpr float kStopCurve = 1.5f;  // b / a
  static constexpr float kStartOvershoot = 0.25f;  // m
  static constexpr float kStartShare = 0.5f;  // start-up time as a share of Spin Time
  static constexpr float kHeadFadeSeconds = 0.03f;
  static constexpr float kSubsonicHz = 24.0f;

  // Wear.
  static constexpr float kBassMonoHz = 150.0f;
  static constexpr float kWearNarrow = 0.35f;
  static constexpr float kWearShelfHz = 4200.0f;
  static constexpr float kWearShelfDb = -18.0f;
  static constexpr float kTraceHz = 6000.0f;
  // Seconds: with x the groove velocity, the pinch term is k·d/dt(x²).
  static constexpr float kTracePinch = 1.4e-5f;
  static constexpr float kTraceCubic = 2.4e-5f;

  // 78: shellac.
  static constexpr float kShellacLowHz = 150.0f;
  static constexpr float kShellacHighHz = 6000.0f;
  static constexpr float kShellacPeakHz = 1100.0f;
  static constexpr float kShellacPeakDb = 3.0f;
  static constexpr float kShellacWidth = 0.25f;
  static constexpr float kShellacNoiseDb = 7.0f;
  static constexpr float kShellacCrackle = 1.5f;

  // Tone: a tilt about 800 Hz.
  static constexpr float kToneLowHz = 250.0f;
  static constexpr float kToneHighHz = 2800.0f;
  static constexpr float kToneLowDb = -3.5f;
  static constexpr float kToneHighDb = 6.0f;

  // Crackle: one Poisson stream with Pareto amplitudes (most events are
  // dust, a few stand out as ticks), whose rate follows a map of where the
  // dust lies round the disc.
  static constexpr int kDustMap = 16;
  static constexpr float kCrackleRate = 500.0f;  // events a second at Crackle 1
  static constexpr float kCrackleAlpha = 1.3f;  // Pareto tail exponent
  static constexpr float kCrackleFloor = 8.4e-4f;  // smallest event at Crackle 1
  static constexpr float kCrackleCeiling = 0.35f;  // largest at Crackle 1
  static constexpr float kTickRatio = 6.0f;  // events this far above the floor get their own colour
  static constexpr int kTickSlots = 4;
  static constexpr int kPopSlots = 2;
  static constexpr float kPopRate = 2.5f;  // a second at Pops 1
  static constexpr int kScratches = 3;
  static constexpr float kTickFloor = 1.0e-7f;

  // Surface. RMS at Surface 1, at 33.
  static constexpr float kHissLevel = 0.0100f;  // -40 dBFS
  static constexpr float kRumbleLevel = 0.0090f;
  static constexpr float kHissLowHz = 500.0f;
  static constexpr float kRumbleHz = 38.0f;
  static constexpr float kRumbleLowHz = 20.0f;

  // Noise runs while there is signal on the record and for a few seconds
  // after, so the gaps between notes keep their crackle.
  static constexpr float kNoiseHoldSeconds = 4.0f;
  static constexpr float kNoiseRiseSeconds = 0.05f;
  static constexpr float kNoiseFallSeconds = 1.2f;
  static constexpr float kQuiet = 1.0e-6f;

  // A draw from the unit exponential: the wait, in expected events, until
  // the next event of a Poisson stream.
  static float exponential(kit::Rng& rng) { return -std::log(rng.uniform() + 1.0e-7f); }

  // Move towards a target a twentieth of the way per control tick.
  static bool glide(float* value, float target, bool snap) {
    if (*value == target) return false;
    const float step = (target - *value) * 0.05f;
    const float close = 1.0e-4f * (target < 0.0f ? -target : target) + 1.0e-6f;
    if (snap || (step < close && step > -close)) {
      *value = target;
    } else {
      *value += step;
    }
    return true;
  }

  // What the start-up curve still has to make up from speed `s`:
  // the integral of (1 - s) dt along ds/dt = c·(1 + m - s), times c.
  static float start_deficit(float s) {
    const float m = kStartOvershoot;
    return (1.0f - s) + m * std::log(m / (1.0f + m - s));
  }

  // Per-sample rate c of the start-up curve that reaches speed in `seconds`.
  float start_rate(float seconds) const {
    return std::log((1.0f + kStartOvershoot) / kStartOvershoot) / (seconds * sample_rate());
  }

  void set_playing(bool playing) {
    using namespace vinyl;
    if (!primed() || idle_.asleep()) {
      // Nothing is sounding: the platter is simply in its new state.
      playing_ = playing;
      spin_ = playing ? 1.0f : 0.0f;
      lag_ = 0.0;
      head_fade_ = 0.0f;
      return;
    }
    if (playing == playing_) return;
    playing_ = playing;
    if (!playing) return;  // slowing carries on from wherever the head is
    // Starting: put the head just far enough back that it lands on the live
    // input at the moment the platter reaches speed. The head it leaves
    // keeps turning at the old speed while it fades out.
    const float rate = start_rate(kStartShare * param(kSpin));
    const double needed = static_cast<double>(start_deficit(spin_) / rate);
    if (spin_ > 0.0f) {
      old_lag_ = lag_;
      old_spin_ = spin_;
      head_fade_ = 1.0f;
    }
    lag_ = needed;
    start_rate_ = rate;
  }

  // The disc `delay` samples back from the sample just written: Hermite, or
  // linear inside the last sample, where there is no newer point to lean on
  // (a delay of exactly zero is the input itself).
  float read_disc(int c, double delay) const {
    if (delay + 4.0 > static_cast<double>(valid_)) return 0.0f;
    const int whole = static_cast<int>(delay);
    const float t = static_cast<float>(delay - static_cast<double>(whole));
    const kit::DelayLine<kDiscSize>& disc = disc_[c];
    if (whole < 1) {
      const float now = disc.read(1);
      return now + (disc.read(2) - now) * t;
    }
    return kit::hermite(disc.read(whole), disc.read(whole + 1), disc.read(whole + 2),
                        disc.read(whole + 3), t);
  }

  // [[EVENTS]]

  // [[CONTROL]]

  void apply(int id) {
    using namespace vinyl;
    switch (id) {
      case kSpeed:
        speed_ = kit::clamp_int(static_cast<int>(param(id) + 0.5f), 0, kNumSpeeds - 1);
        break;
      case kPlatter:
        set_playing(param(id) < 0.5f);
        break;
      case kMix:
        mix_.set(param(id), primed());
        break;
      default:
        break;  // the rest is read on the control clock
    }
  }

  struct Slot {
    kit::Svf filter[2];
    bool low = false;  // pops read the low-pass, ticks the band-pass
  };

  // A scratch across the grooves: the same tick at the same place on the
  // disc, once per turn, swelling and fading as the stylus crosses it.
  struct Scratch {
    float angle = 0.0f;  // turn phase where it lies
    int turns = 0;       // how many turns it lasts; 0 is a free slot
    int turn = 0;        // turns played so far
    float level = 0.0f;
    float hz = 2000.0f;
    float q = 1.0f;
    float lean[2] = {1.0f, 1.0f};
  };

  kit::DelayLine<kDiscSize> disc_[2];
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  kit::Smoother mix_, hiss_, rumble_, bass_, width_, pinch_, cubic_, shellac_;

  // Read head.
  double lag_ = 0.0;       // samples the platter has put the head behind
  double old_lag_ = 0.0;   // the head being faded out after a restart
  float spin_ = 1.0f;      // platter speed, 0..1
  float old_spin_ = 1.0f;
  float head_fade_ = 0.0f;  // 1..0: weight of the old head
  float head_fade_step_ = 0.0f;
  float start_rate_ = 0.0f;
  float stop_a_ = 0.0f, stop_b_ = 0.0f;
  float subsonic_ = 0.0f;
  bool playing_ = true;
  long valid_ = 0;  // samples written since the device last woke
  kit::Svf stop_hp_[2];

  // Warp.
  kit::Drift warp_drift_;
  float turn_phase_ = 0.0f;
  float warp_depth_ = 0.0f;  // peak pitch deviation, glided
  float warp_amp_[3] = {0.0f, 0.0f, 0.0f};  // seconds of read-point travel
  float warp_ = 0.0f;  // samples
  float warp_step_ = 0.0f;
  int speed_ = 0;

  // Wear, 78 and tone.
  kit::Svf side_hp_;
  kit::Svf trace_lp_[2][2];
  float pinch_last_ = 0.0f;
  float cubic_last_ = 0.0f;
  kit::Biquad wear_shelf_[2], tone_low_[2], tone_high_[2];
  kit::Biquad shellac_hp_[2], shellac_lp_[2], shellac_peak_[2];
  float wear_db_ = 0.0f;
  float tone_ = 0.0f;
  bool shelf_flat_ = true;
  bool tone_flat_ = true;

  // Noise.
  kit::Rng event_rng_, dust_rng_, rumble_rng_;
  kit::Noise hiss_noise_[2];
  kit::OnePole hiss_low_[2];
  kit::OnePole rumble_a_[2], rumble_b_[2], rumble_low_[2];
  Slot slots_[kTickSlots + kPopSlots];
  kit::Svf dust_[2], thump_[2];
  Scratch scratches_[kScratches];
  float dust_map_[kDustMap] = {};
  float crackle_wait_ = 1.0f;  // expected events until the next one
  float pop_wait_ = 1.0f;
  float crackle_rate_ = 0.0f;  // events per sample, now
  float pop_rate_ = 0.0f;
  float crackle_floor_ = 0.0f;
  float crackle_ceiling_ = 0.0f;
  float pop_level_ = 0.0f;
  float swish_[2] = {1.0f, 1.0f};
  float rumble_norm_ = 1.0f;
  int next_tick_ = 0;
  int next_pop_ = 0;
  float noise_gate_ = 0.0f;
  float noise_rise_ = 0.0f;
  float noise_fall_ = 0.0f;
  long hold_samples_ = 1;
  long drain_samples_ = 1;
  long quiet_ = 1;
  bool started_ = false;
};

}  // namespace livemix
