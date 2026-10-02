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
      shellac_lp_[c].set_lowpass(kShellacHighHz, 0.541f, sr);
      shellac_lp2_[c].reset();
      shellac_lp2_[c].set_lowpass(kShellacHighHz, 1.307f, sr);
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
      thump_[c].set(kThumpHz, 0.9f, sr);
      dust_hit_[c] = 0.0f;
      thump_hit_[c] = 0.0f;
      swish_[c] = 1.0f;
    }
    side_hp_.reset();
    side_hp_.set(kBassMonoHz, kit::kSqrtHalf, sr);
    for (Slot& slot : slots_) {
      slot.filter[0].reset();
      slot.filter[1].reset();
      slot.hit[0] = slot.hit[1] = 0.0f;
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
    warp_glide_ = 1.0f - std::exp(-static_cast<float>(kControlPeriod) / (kWarpGlideSeconds * sr));
    warp_amp_[0] = warp_amp_[1] = warp_amp_[2] = 0.0f;
    warp_ = 0.0f;
    warp_step_ = 0.0f;
    pinch_last_ = 0.0f;
    cubic_last_ = 0.0f;
    wear_db_ = 0.0f;
    tone_ = 0.0f;
    shelf_flat_ = true;
    tone_flat_ = true;
    wear_live_ = false;
    shellac_live_ = false;
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

  void process(int frames) {
    using namespace vinyl;
    frames = begin_block(frames);
    const bool was_asleep = idle_.asleep();
    // Awake while there is input, and until the noise has faded and the
    // filters have emptied, whatever Mix lets through.
    if (!idle_.wake(input_present(frames) || quiet_ < drain_samples_)) {
      // Nothing is sounding: the platter is simply where its switch says.
      spin_ = playing_ ? 1.0f : 0.0f;
      lag_ = 0.0;
      head_fade_ = 0.0f;
      silence_output(frames);
      return;
    }
    if (was_asleep) valid_ = 0;
    const float sr = sample_rate();
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      if (clock_.tick()) control(sr);
      disc_[0].write(in[0]);
      disc_[1].write(in[1]);
      if (valid_ < kDiscSize) ++valid_;

      float wet[2];
      const float level = play_disc(wet);
      wear(wet);
      const bool sounding = in[0] > kQuiet || in[0] < -kQuiet || in[1] > kQuiet || in[1] < -kQuiet ||
                            wet[0] > kQuiet || wet[0] < -kQuiet || wet[1] > kQuiet || wet[1] < -kQuiet;
      noise(wet, level, sounding);
      colour(wet);

      const float mix = mix_.settled() ? mix_.value : mix_.next();
      out_left_[i] = in[0] * (1.0f - mix) + wet[0] * mix;
      out_right_[i] = in[1] * (1.0f - mix) + wet[1] * mix;
    }
    idle_.settle(output_peak(frames), frames);
  }

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
  static constexpr float kStopLog = 0.9162907f;  // ln(1 + b / a)
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
  static constexpr float kShellacNoise = 2.2387f;  // +7 dB of hiss
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
  static constexpr float kPopCeiling = 0.28f;  // the largest pop at Pops 1
  static constexpr int kScratches = 3;
  static constexpr float kThumpHz = 75.0f;
  static constexpr float kTickFloor = 1.0e-7f;

  // Surface. RMS at Surface 1, at 33.
  static constexpr float kHissLevel = 0.0100f;  // -40 dBFS
  static constexpr float kRumbleLevel = 0.0090f;
  static constexpr float kHissLowHz = 500.0f;
  static constexpr float kHissNorm = 6.5f;  // brings the high-passed pink noise to unit RMS
  static constexpr float kSwish = 0.3f;
  static constexpr float kRumbleHz = 38.0f;
  static constexpr float kRumbleLowHz = 20.0f;

  // Noise runs while there is signal on the record and for a few seconds
  // after, so the gaps between notes keep their crackle.
  static constexpr float kNoiseHoldSeconds = 4.0f;
  static constexpr float kNoiseRiseSeconds = 0.05f;
  static constexpr float kNoiseFallSeconds = 1.2f;
  static constexpr float kQuiet = 1.0e-6f;

  static double clamp_double(double x, double lo, double hi) { return x < lo ? lo : (x > hi ? hi : x); }

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
    const int whole = static_cast<int>(delay);
    const float t = static_cast<float>(delay - static_cast<double>(whole));
    const kit::DelayLine<kDiscSize>& disc = disc_[c];
    if (whole < 1) {
      const float now = disc.read(1);
      const float before = valid_ > 1 ? disc.read(2) : 0.0f;
      return now + (before - now) * t;
    }
    // Nothing older than the last wake is played: what lies there is from
    // before the device slept.
    if (whole + 3 > valid_) return 0.0f;
    return kit::hermite(disc.read(whole), disc.read(whole + 1), disc.read(whole + 2),
                        disc.read(whole + 3), t);
  }

  // One impulse into a resonator, sized so that its output peaks near
  // `level` whatever the tuning and the sample rate. `lean` is how the kick
  // divides between the two groove walls.
  void ring(Slot& slot, float hz, float q, bool low, float level, const float* lean) {
    const float sr = sample_rate();
    // A slowing platter drags every click down with it.
    hz = kit::clamp(hz * (0.3f + 0.7f * spin_), 40.0f, 0.4f * sr);
    const float w = kit::kTwoPi * hz / sr;
    const float size = low ? level / (0.6f * w) : level * q * 1.2f / w;
    slot.low = low;
    for (int c = 0; c < 2; ++c) {
      slot.filter[c].set(hz, q, sr);
      slot.hit[c] += size * lean[c];
    }
  }

  // The next event of the crackle stream. Its size is Pareto: most are dust
  // and go to one shared band; the few that stand out get a slot and a
  // colour of their own.
  void crackle() {
    const float size = event_rng_.uniform();
    const float angle = event_rng_.uniform();
    const float colour = event_rng_.uniform();
    const float sharp = event_rng_.uniform();
    float level = crackle_floor_ * std::exp(-std::log(size + 1.0e-7f) * (1.0f / kCrackleAlpha));
    if (level > crackle_ceiling_) level = crackle_ceiling_;
    // Anywhere from lateral (both walls together) through one wall alone to
    // vertical (the walls against each other).
    const float lean[2] = {kit::SineTable::cos_lookup(angle), kit::SineTable::lookup(angle)};
    if (level < kTickRatio * crackle_floor_) {
      const float w = kit::kTwoPi * 4200.0f / sample_rate();
      dust_hit_[0] += level * lean[0] * 0.6f / w;
      dust_hit_[1] += level * lean[1] * 0.6f / w;
      return;
    }
    Slot& slot = slots_[next_tick_];
    next_tick_ = (next_tick_ + 1) % kTickSlots;
    ring(slot, 1800.0f * std::exp2(2.2f * colour), 0.6f + 1.6f * sharp, false, level, lean);
  }

  // A pop: a duller, larger click with a thump under it.
  void pop(float level, float hz, float q, const float* lean, float thump) {
    Slot& slot = slots_[kTickSlots + next_pop_];
    next_pop_ = (next_pop_ + 1) % kPopSlots;
    ring(slot, hz, q, true, level, lean);
    const float w = kit::kTwoPi * kThumpHz / sample_rate();
    // The thump is mostly lateral: it stays in the middle.
    const float mid = 0.5f * (lean[0] + lean[1]);
    for (int c = 0; c < 2; ++c) {
      thump_hit_[c] += thump * level * (0.7f * mid + 0.3f * lean[c]) * 1.3f / w;
    }
  }

  void random_pop() {
    const float size = event_rng_.uniform();
    const float angle = event_rng_.uniform();
    const float colour = event_rng_.uniform();
    const float lean[2] = {kit::SineTable::cos_lookup(angle), kit::SineTable::lookup(angle)};
    pop(pop_level_ * (0.35f + 0.65f * size * size), 900.0f * std::exp2(1.5f * colour), 0.8f, lean,
        0.9f);
  }

  // Once per turn: scratches end, new ones may begin, and a little of the
  // dust moves.
  void new_turn(float pops) {
    const float chance = kit::min(1.0f, 1.2f * pops * pops);
    for (Scratch& scratch : scratches_) {
      const float dice = dust_rng_.uniform();
      const float where = dust_rng_.uniform();
      const float length = dust_rng_.uniform();
      const float size = dust_rng_.uniform();
      const float colour = dust_rng_.uniform();
      const float angle = dust_rng_.uniform();
      if (scratch.turns > 0 || dice >= chance) continue;
      scratch.angle = where;
      scratch.turns = 5 + static_cast<int>(length * (8.0f + 24.0f * pops));
      scratch.turn = 0;
      scratch.level = 0.5f + 0.4f * size;
      scratch.hz = 1300.0f * std::exp2(1.6f * colour);
      scratch.q = 0.9f;
      // Scratches cut across both walls: lateral, leaning a little.
      scratch.lean[0] = 0.45f + 0.5f * angle;
      scratch.lean[1] = 0.95f - 0.5f * angle;
    }
    for (int i = 0; i < 2; ++i) {
      const int index = static_cast<int>(dust_rng_.uniform() * kDustMap) % kDustMap;
      dust_map_[index] = dust_rng_.uniform();
    }
  }

  // The stylus has moved from `before` to `after` (turn phase): play any
  // scratch it crossed.
  void cross_scratches(float before, float after) {
    for (Scratch& scratch : scratches_) {
      if (scratch.turns <= 0) continue;
      const bool crossed = after >= before ? (scratch.angle > before && scratch.angle <= after)
                                           : (scratch.angle > before || scratch.angle <= after);
      if (!crossed) continue;
      // It swells over its first quarter and fades over its last two fifths.
      const float along = (static_cast<float>(scratch.turn) + 0.5f) / static_cast<float>(scratch.turns);
      const float swell = kit::min(1.0f, 4.0f * along) * kit::min(1.0f, 2.5f * (1.0f - along));
      const float waver = 0.85f + 0.3f * event_rng_.uniform();
      pop(pop_level_ * scratch.level * swell * waver, scratch.hz, scratch.q, scratch.lean, 0.5f);
      if (++scratch.turn >= scratch.turns) scratch.turns = 0;
    }
  }

  // The platter and the read head: one sample off the disc into `wet`.
  // Returns the level the platter's speed leaves (1 at speed, 0 stopped).
  float play_disc(float* wet) {
    if (playing_) {
      if (spin_ < 1.0f) {
        spin_ += start_rate_ * (1.0f + kStartOvershoot - spin_);
        lag_ -= 1.0 - static_cast<double>(spin_);
        if (spin_ >= 1.0f || lag_ <= 0.0) {
          spin_ = 1.0f;
          lag_ = 0.0;
        }
      }
    } else if (spin_ > 0.0f) {
      spin_ -= stop_a_ + stop_b_ * spin_;
      if (spin_ < 0.0f) spin_ = 0.0f;
      lag_ += 1.0 - static_cast<double>(spin_);
    }
    warp_ += warp_step_;
    const double reach = static_cast<double>(kDiscSize - 8);
    const double delay = clamp_double(lag_ + static_cast<double>(warp_), 0.0, reach);
    wet[0] = read_disc(0, delay);
    wet[1] = read_disc(1, delay);
    if (head_fade_ > 0.0f) {
      old_lag_ += 1.0 - static_cast<double>(old_spin_);
      const double old_delay = clamp_double(old_lag_ + static_cast<double>(warp_), 0.0, reach);
      wet[0] += (read_disc(0, old_delay) - wet[0]) * head_fade_;
      wet[1] += (read_disc(1, old_delay) - wet[1]) * head_fade_;
      head_fade_ = kit::max(0.0f, head_fade_ - head_fade_step_);
    }
    if (spin_ >= 1.0f) return 1.0f;
    // A cartridge reads velocity: as the disc slows the level falls with
    // the pitch, and what drops under the audio band is taken out.
    const float level = std::sqrt(spin_);
    const float blend = kit::min(1.0f, (1.0f - spin_) * 8.0f);
    for (int c = 0; c < 2; ++c) {
      const float high = stop_hp_[c].highpass(wet[c]);
      wet[c] = level * (wet[c] + blend * (high - wet[c]));
    }
    return level;
  }

  // The worn groove: bass to the middle, a narrower image, tracing
  // distortion, and the top rolled off.
  void wear(float* wet) {
    const float bass = bass_.settled() ? bass_.value : bass_.next();
    const float width = width_.settled() ? width_.value : width_.next();
    const float pinch = pinch_.settled() ? pinch_.value : pinch_.next();
    const float cubic = cubic_.settled() ? cubic_.value : cubic_.next();
    if (bass > 0.0f || width != 1.0f || pinch > 0.0f) {
      wear_live_ = true;
      float mid = 0.5f * (wet[0] + wet[1]);
      float side = 0.5f * (wet[0] - wet[1]);
      side_hp_.process(side);
      side = (side + bass * (side_hp_.high - side)) * width;
      // Tracing: a round tip cannot follow the groove wall exactly, and
      // rides up by an amount that goes with the square of the slope. The
      // walls push opposite ways, so that term lands on the difference
      // channel; what is left in the middle is third order.
      const float left = trace_lp_[0][1].lowpass(trace_lp_[0][0].lowpass(wet[0]));
      const float right = trace_lp_[1][1].lowpass(trace_lp_[1][0].lowpass(wet[1]));
      const float centre = 0.5f * (left + right);
      const float squares = 0.5f * (left * left + right * right);
      const float cube = centre * centre * centre;
      side += pinch * (squares - pinch_last_);
      mid -= cubic * (cube - cubic_last_);
      pinch_last_ = squares;
      cubic_last_ = cube;
      wet[0] = mid + side;
      wet[1] = mid - side;
    } else if (wear_live_) {
      wear_live_ = false;
      side_hp_.reset();
      for (int c = 0; c < 2; ++c) {
        trace_lp_[c][0].reset();
        trace_lp_[c][1].reset();
      }
      pinch_last_ = cubic_last_ = 0.0f;
    }
    if (!shelf_flat_) {
      wet[0] = wear_shelf_[0].process(wet[0]);
      wet[1] = wear_shelf_[1].process(wet[1]);
    }
  }

  // One resonator's output for this sample, if it has anything to say.
  static float sound(kit::Svf& filter, float* hit, bool low) {
    if (*hit == 0.0f && std::fabs(filter.ic1) < kTickFloor && std::fabs(filter.ic2) < kTickFloor) {
      return 0.0f;
    }
    filter.process(*hit);
    *hit = 0.0f;
    return low ? filter.low : filter.band * filter.k;
  }

  // What the surface adds: hiss, rumble, crackle and pops. All of it rides
  // on the gate (signal on the record, and a few seconds after) and on the
  // platter, which takes the noise down with it.
  void noise(float* wet, float level, bool sounding) {
    if (sounding) {
      quiet_ = 0;
    } else if (quiet_ < drain_samples_) {
      ++quiet_;
    }
    if (quiet_ < hold_samples_) {
      noise_gate_ = kit::min(1.0f, noise_gate_ + noise_rise_);
    } else {
      noise_gate_ = kit::max(0.0f, noise_gate_ - noise_fall_);
    }
    const float gate = noise_gate_ * level;
    const float hiss = hiss_.settled() ? hiss_.value : hiss_.next();
    const float rumble = rumble_.settled() ? rumble_.value : rumble_.next();
    if (gate <= 0.0f) return;

    float added[2] = {0.0f, 0.0f};
    if (hiss > 0.0f) {
      for (int c = 0; c < 2; ++c) {
        const float pink = hiss_noise_[c].pink();
        added[c] = hiss * swish_[c] * kHissNorm * (pink - hiss_low_[c].lowpass(pink));
      }
    }
    if (rumble > 0.0f) {
      // One source both walls share and a smaller one that sets them apart.
      float low[2];
      for (int c = 0; c < 2; ++c) {
        const float slow = rumble_b_[c].lowpass(rumble_a_[c].lowpass(rumble_rng_.bipolar()));
        low[c] = slow - rumble_low_[c].lowpass(slow);
      }
      const float scale = rumble * rumble_norm_;
      added[0] += scale * (low[0] + 0.5f * low[1]);
      added[1] += scale * (low[0] - 0.5f * low[1]);
    }

    crackle_wait_ -= crackle_rate_;
    if (crackle_wait_ <= 0.0f) {
      crackle();
      crackle_wait_ += exponential(event_rng_);
    }
    pop_wait_ -= pop_rate_;
    if (pop_wait_ <= 0.0f) {
      random_pop();
      pop_wait_ += exponential(event_rng_);
    }
    for (int c = 0; c < 2; ++c) {
      float clicks = sound(dust_[c], &dust_hit_[c], false) + sound(thump_[c], &thump_hit_[c], false);
      for (Slot& slot : slots_) clicks += sound(slot.filter[c], &slot.hit[c], slot.low);
      wet[c] += gate * (added[c] + clicks);
    }
  }

  // Shellac's narrow band, then the tone tilt.
  void colour(float* wet) {
    const float shellac = shellac_.settled() ? shellac_.value : shellac_.next();
    if (shellac > 0.0f) {
      shellac_live_ = true;
      for (int c = 0; c < 2; ++c) {
        const float band = shellac_peak_[c].process(shellac_lp2_[c].process(
            shellac_lp_[c].process(shellac_hp_[c].process(wet[c]))));
        wet[c] += shellac * (band - wet[c]);
      }
    } else if (shellac_live_) {
      shellac_live_ = false;
      for (int c = 0; c < 2; ++c) {
        shellac_hp_[c].reset();
        shellac_lp_[c].reset();
        shellac_lp2_[c].reset();
        shellac_peak_[c].reset();
      }
    }
    if (!tone_flat_) {
      wet[0] = tone_high_[0].process(tone_low_[0].process(wet[0]));
      wet[1] = tone_high_[1].process(tone_low_[1].process(wet[1]));
    }
  }

  // Every 16 samples: the turn, the warp, and everything derived from the
  // controls.
  void control(float sr) {
    using namespace vinyl;
    const bool snap = !started_;
    const float dt = static_cast<float>(kControlPeriod) / sr;
    const float turn_hz = kTurnHz[speed_];
    const bool shellac = speed_ == kNumSpeeds - 1;
    const float pops = param(kPops);
    pop_rate_ = kPopRate * pops * std::sqrt(pops) * spin_ / sr;
    pop_level_ = kPopCeiling * std::sqrt(pops * std::sqrt(pops));

    // The record turns at the platter's speed.
    const float before = turn_phase_;
    turn_phase_ += spin_ * turn_hz * dt;
    const bool wrapped = turn_phase_ >= 1.0f;
    if (wrapped) turn_phase_ -= 1.0f;
    if (snap || wrapped) new_turn(pops);
    if (!snap) cross_scratches(before, turn_phase_);

    // Warp. Each part is a sine in the read point's position, with the
    // amplitude that gives its share of the pitch deviation at this speed.
    const float depth = kWarpDeviation * param(kWarp) * param(kWarp);
    const float amp[3] = {depth * kWarpTurn / (kit::kTwoPi * turn_hz),
                          depth * kWarpSecond / (2.0f * kit::kTwoPi * turn_hz),
                          depth * kWarpDrift / (kit::kTwoPi * kDriftHz * kDriftSlope)};
    float reach = 0.0f;
    for (int k = 0; k < 3; ++k) {
      warp_amp_[k] += (amp[k] - warp_amp_[k]) * (snap ? 1.0f : warp_glide_);
      const float left = amp[k] - warp_amp_[k];
      if (left < 1.0e-9f && left > -1.0e-9f) warp_amp_[k] = amp[k];
      reach += warp_amp_[k];
    }
    const float drift = warp_drift_.next(kControlPeriod);
    // The head sits behind by its whole reach, and by up to two samples
    // more so that the read stays a four-point one.
    const float seconds = reach + kit::min(2.0f / sr, 0.5f * reach) -
                          warp_amp_[0] * kit::SineTable::cos_lookup(turn_phase_) -
                          warp_amp_[1] * kit::SineTable::cos_lookup(2.0f * turn_phase_ + kWarpSecondPhase) -
                          warp_amp_[2] * drift;
    const float target = kit::max(0.0f, seconds * sr);
    if (snap) warp_ = target;
    warp_step_ = (target - warp_) * (1.0f / kControlPeriod);

    // Platter: friction for the chosen Spin Time, and the start-up rate
    // that lands the head on the live input from wherever it is now.
    stop_b_ = kStopLog / (param(kSpin) * sr);
    stop_a_ = stop_b_ / kStopCurve;
    if (playing_ && spin_ < 1.0f) {
      start_rate_ = lag_ > 1.0e-3 ? start_deficit(spin_) / static_cast<float>(lag_) : 1.0f;
    }

    // Wear.
    const float wear = param(kWear);
    const float worn = wear * std::sqrt(wear);
    bass_.set(kit::min(1.0f, 2.0f * wear), started_);
    width_.set((1.0f - kWearNarrow * wear) * (shellac ? kShellacWidth : 1.0f), started_);
    pinch_.set(kTracePinch * worn * sr, started_);
    cubic_.set(kTraceCubic * worn * sr, started_);
    if (glide(&wear_db_, kWearShelfDb * worn, snap)) {
      shelf_flat_ = wear_db_ == 0.0f;
      for (int c = 0; c < 2; ++c) {
        wear_shelf_[c].set_high_shelf(kWearShelfHz, wear_db_, sr);
        if (shelf_flat_) wear_shelf_[c].reset();
      }
    }
    if (glide(&tone_, param(kTone), snap)) {
      tone_flat_ = tone_ == 0.0f;
      for (int c = 0; c < 2; ++c) {
        tone_low_[c].set_low_shelf(kToneLowHz, kToneLowDb * tone_, sr);
        tone_high_[c].set_high_shelf(kToneHighHz, kToneHighDb * tone_, sr);
        if (tone_flat_) {
          tone_low_[c].reset();
          tone_high_[c].reset();
        }
      }
    }
    shellac_.set(shellac ? 1.0f : 0.0f, started_);

    // Surface: the hiss swishes once per turn, each wall at its own moment.
    const float surface = param(kSurface);
    const float noisy = shellac ? kShellacNoise : 1.0f;
    hiss_.set(surface * surface * kHissLevel * noisy, started_);
    rumble_.set(surface * surface * kRumbleLevel, started_);
    swish_[0] = 1.0f + kSwish * kit::SineTable::lookup(turn_phase_);
    swish_[1] = 1.0f + kSwish * kit::SineTable::lookup(turn_phase_ + 0.27f);

    // Crackle: its rate follows the dust lying round this part of the disc.
    const float crackle = param(kCrackle);
    const float place = turn_phase_ * kDustMap;
    const int index = static_cast<int>(place) % kDustMap;
    const float density = kit::lerp(dust_map_[index], dust_map_[(index + 1) % kDustMap],
                                    place - std::floor(place));
    crackle_rate_ = crackle_rate(crackle) * (shellac ? kShellacCrackle : 1.0f) *
                    (0.35f + 1.3f * density) * spin_ / sr;
    crackle_floor_ = kCrackleFloor * std::sqrt(crackle);
    crackle_ceiling_ = kCrackleCeiling * crackle;
    started_ = true;
  }

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
    float hit[2] = {0.0f, 0.0f};  // what strikes it on the next sample
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
  float warp_glide_ = 1.0f;
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
  kit::Biquad shellac_hp_[2], shellac_lp_[2], shellac_lp2_[2], shellac_peak_[2];
  bool wear_live_ = false;
  bool shellac_live_ = false;
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
  float dust_hit_[2] = {0.0f, 0.0f};
  float thump_hit_[2] = {0.0f, 0.0f};
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
