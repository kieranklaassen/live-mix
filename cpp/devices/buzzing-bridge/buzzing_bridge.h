#pragma once

// Buzzing Bridge: the buzz instruments are built to have, given to any sound.
// Something lies lightly against the sound (a wide curved bridge, a skin, a
// shell on a loop of string, a strip of leather, a sheet of paper), is
// touched by the crest of each swing, and is heard beside it.
//
//   in ─┬───────────────────────────────────────────────────────────────► + ─► Output ─► out
//       ├─► low-pass ─► ÷ its own crest ─► 4x ─► contact ─► ÷4 ─► × level ─► place ─┐   ▲
//       ├─► level, strike, attacks ─► how closed, how far the climb, bounces        │   │
//       └─► pitch (swing_pitch.h) ─► which partials the place is                    │   │
//                          Amount × Mix ◄─ Tone ◄─ ceiling ◄────────────────────────┘   │
//                               └─► Width ─► Distance (next_room.h) ────────────────────┘
//
// - The sound itself is never touched: what comes out is the input, sample
//   for sample and with no latency, plus the buzz, which is 0.8 ms late (the
//   oversampler). At Amount 0 or Mix 0, and under Threshold, the buzz is
//   exactly zero and the output is the input bit for bit.
// - Contact. The sound is brought down to its low end (five times its pitch)
//   and divided by its own crest, held for just over one swing, so a loud and
//   a soft note are the same shape. Where that passes a height, a soft step
//   closes. One side only: a sine then has even and odd partials. The step
//   is rounded twice more at four times the rate (kEdgeHz), so a 5 kHz sine
//   at Amount 1 folds back under -60 dB. The pulses carry the level again,
//   go through the bands of the model, and are held under the level of the
//   sound by a gain (a curve at the base rate would fold).
// - Grazing bridge: two bands on a partial that climbs as the note falls
//   below its strike: the third at the strike and, over kClimbDb of fall, up
//   to 3 x 2^(10/3 Curve), which is the twelfth at Curve 0.6. A held note
//   climbs half of that way over some seconds, and the end of the climb is
//   heard a little throughout. Less of each swing touches as it climbs. With Tracking at 0 the partials are those of
//   a note at Resonance / 16. The climb bends over towards twice Resonance.
// - Membrane: closes by how far the level passes Threshold and is exactly
//   zero under it; two resonances (1 and 1.59) and some breath. Leather:
//   falls back slowly, catches every other swing less, sits low. Paper:
//   noise let through by the contact.
// - Loose shell: no contact. A tick of noise through three resonances for
//   each of Bounces knocks after an attack, Rattle from first to last, each
//   gap shorter (Curve) and each knock softer, and nothing until the next.
// - After an attack the other models chatter the same way (Rattle, Bounces),
//   as far as the attack was sudden, and then stay closed.
// - The share of the buzz that runs against the sound in its own band is
//   turned round (agree()), so it stands forward and never hollows out.
// - One follower for both channels, each channel its own contact: the buzz
//   comes from where the sound comes from, mono in is mono out at Width 0,
//   and at any Width the two sides together are what they were.
// - Control runs 1500 times a second on its own clock. After 0.6 s of
//   silence in and out everything is put back to the start on that very
//   sample, so the next note is the same whatever the block size, and
//   whatever was moved meanwhile is already where it points.
// - Level: at Amount 1 the steady buzz is 3 to 15 dB under the sound (RMS,
//   sines and saws from 55 Hz to 1.8 kHz) and the output at most 2.5 dB over
//   the input. No sample of the buzz passes 0.96 of the level it is set off
//   by, so the peaks are at most 5.9 dB over those of the input. Fall over a
//   second lets the buzz stand up to four times over a note that is dying,
//   never over what the note was.

#include "../../kit/kit.h"
#include "contact_oversampler.h"
#include "next_room.h"
#include "params.gen.h"
#include "swing_pitch.h"

namespace livemix {

class BuzzingBridge : public kit::DeviceBase<buzzing_bridge::kNumParams> {
 public:
  enum Model : int { kGrazing = 0, kMembrane, kShell, kLeather, kPaper, kModels };

  // The partial the bridge's buzz starts on, and the fall in level over which
  // it climbs all the way.
  static constexpr float kFirstPartial = 3.0f;
  static constexpr float kClimbDb = 22.0f;
  // A note that is held and does not die climbs part of the way by itself.
  static constexpr float kHeldClimb = 0.5f;
  static constexpr float kHeldSeconds = 1.0f;
  // Control runs this often whatever the sample rate.
  static constexpr float kTicksPerSecond = 1500.0f;
  // Silence this long, in and out, puts everything back to the start.
  static constexpr float kRestSeconds = 0.6f;

  void init(float sample_rate) {
    using namespace buzzing_bridge;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    period_ = static_cast<int>(sr / kTicksPerSecond + 0.5f);
    tick_rate_ = sr / static_cast<float>(period_);
    for (auto& o : over_) o.init();
    pitch_.init(sr);
    room_.init(sr);
    kit::Smoother* smooth[] = {&gain_, &output_, &width_, &distance_, &tone_};
    for (kit::Smoother* s : smooth) s->set_time(kSmoothingSeconds, sr);
    swap_.set_time(0.006f, sr);
    rise_k_ = 1.0f - kit::time_to_coeff(0.001f, sr);
    sink_k_ = 1.0f - kit::time_to_coeff(0.005f, sr);
    hit_k_ = 1.0f - kit::time_to_coeff(0.00025f, sr);
    touch_k_ = 1.0f - kit::time_to_coeff(0.001f, sr);
    let_go_k_ = 1.0f - kit::time_to_coeff(0.004f, sr);
    edge_k_ = 1.0f - std::exp(-kit::kTwoPi * kEdgeHz / (4.0f * sr));
    edge_k_ = kit::clamp(edge_k_, 0.0f, 1.0f);
    noise_scale_ = std::sqrt(sr / 48000.0f);
    grip_k_ = 1.0f - kit::time_to_coeff(0.0012f, 4.0f * sr);
    close_k_ = 1.0f - kit::time_to_coeff(0.00006f, 4.0f * sr);
    edge_time_ = 0.25f * kEdgeSamples * (sr / 48000.0f);
    place_k_ = 1.0f - kit::time_to_coeff(0.015f, tick_rate_);
    steep_k_ = kit::time_to_coeff(0.020f, sr);
    crest_up_ = kit::time_to_coeff(0.00015f, sr);
    crest_down_ = kit::time_to_coeff(0.040f, sr);
    guard_k_ = kit::time_to_coeff(0.025f, sr);
    match_k_ = 1.0f - kit::time_to_coeff(0.030f, sr);
    for (int b = 0; b < kBands; ++b) {
      for (kit::Svf& h : high_[b]) h.set(kStruckHz[b], kit::kSqrtHalf, sr);
    }
    spread_[0] = static_cast<int>(0.0031f * sr) | 1;
    spread_[1] = static_cast<int>(0.0053f * sr) | 1;
    rest_length_ = static_cast<long>(kRestSeconds * sr);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    restart();
    resting_ = true;
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (resting_ && !input_present(frames)) {
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      in[0] = sound(in[0]);
      in[1] = sound(in[1]);
      const bool present = in[0] != 0.0f || in[1] != 0.0f;
      if (resting_) {
        if (!present) {
          out_left_[i] = 0.0f;
          out_right_[i] = 0.0f;
          continue;
        }
        land();
        resting_ = false;
      }
      float buzz[2];
      step(in, buzz);
      const float out = output_.next();
      out_left_[i] = (in[0] + buzz[0]) * out;
      out_right_[i] = (in[1] + buzz[1]) * out;

      const float heard = std::fabs(buzz[0]) + std::fabs(buzz[1]);
      shown_ = heard > shown_ ? heard : shown_ * shown_fall_;
      if (present || heard > 1.0e-8f || room_.ringing() || hits_left_ > 0) {
        still_ = 0;
      } else if (++still_ >= rest_length_) {
        restart();
        resting_ = true;
      }
    }
  }

  float meter(int index) const {
    switch (index) {
      case 0:
        return resting_ ? -90.0f : kit::max(-90.0f, kit::gain_to_db(0.5f * shown_));
      case 1:
        return resting_ ? 0.0f : partial_;
      case 2:
        return resting_ ? 0.0f : place_hz_;
      case 3:
        return resting_ ? -60.0f : kit::clamp(kit::gain_to_db(level_) - threshold_db_, -60.0f, 60.0f);
      case 4:
        return resting_ ? 0.0f : (model_ == kShell ? hit_ : touch_ * open_);
      case 5:
        return resting_ ? 0.0f : pitch_.hz();
      default:
        return 0.0f;
    }
  }

 private:
  static constexpr float kEdgeHz = 8000.0f;
  // The least samples the contact takes to close, at four times 48 kHz.
  static constexpr float kEdgeSamples = 3.5f;
  static constexpr int kHold = 64;
  // The tops a struck note is heard in, how far each must jump and how far
  // up the whole sound a full knock of it would be.
  static constexpr int kBands = 2;
  static constexpr float kStruckHz[kBands] = {2500.0f, 700.0f};
  static constexpr float kStruckJump[kBands] = {2.1f, 2.0f};
  static constexpr float kStruckReach[kBands] = {7.0f, 3.5f};
  // Where the buzz is held, of the sound's own level.
  static constexpr float kCeiling = 0.8f;
  // How much of the bridge's buzz sits at the end of its climb throughout.
  static constexpr float kEndShare = 0.3f, kEndWidth = 1.0f, kEndHz = 6500.0f;
  // No sample of the buzz passes this much of the sound's level, so that the
  // two together are never more than twice the sound.
  static constexpr float kMost = 0.96f;

  // What is not a sound is silence: a NaN, an infinity, or 60 dB over full
  // scale.
  static float sound(float x) { return x > -1000.0f && x < 1000.0f ? x : 0.0f; }

  static int whole(float v) { return static_cast<int>(v + 0.5f); }

  void apply(int id) {
    using namespace buzzing_bridge;
    switch (id) {
      case kModel:
        wanted_model_ = kit::clamp_int(whole(param(kModel)), 0, kModels - 1);
        break;
      case kAmount:
      case kMix:
        amount_ = param(kAmount);
        gain_.set(amount_ * param(kMix), primed());
        break;
      case kThreshold:
        threshold_db_ = param(kThreshold);
        threshold_ = kit::db_to_gain(threshold_db_);
        break;
      case kFall:
        // Under a second the buzz sinks faster than the sound does, the more
        // the shorter; over it the buzz has a fall of its own.
        sink_power_ = kit::max(0.0f, 0.4f * std::log2(1000.0f / param(kFall)));
        fall_k_ = std::exp(-6.907755f / (param(kFall) * 0.001f * sample_rate()));
        break;
      case kTone:
        tone_.set(param(kTone), primed());
        break;
      case kDistance:
        distance_.set(param(kDistance), primed());
        break;
      case kWidth:
        width_.set(param(kWidth), primed());
        break;
      case kOutput:
        output_.set(kit::db_to_gain(param(kOutput)), primed());
        break;
      default:
        break;  // read where they are used
    }
  }

  // The first sound after a rest: whatever was moved meanwhile is already
  // where it points.
  void land() {
    kit::Smoother* smooth[] = {&gain_, &output_, &width_, &distance_, &tone_};
    for (kit::Smoother* s : smooth) s->snap(s->target);
    model_ = wanted_model_;
    swap_.snap(1.0f);
    room_.set(distance_.value);
    room_.land();
    last_tone_ = -1.0f;
  }

  void restart() {
    clock_.reset(period_);
    rng_.seed(0x5B1D6E37u);
    pitch_.reset();
    room_.reset();
    for (int c = 0; c < 2; ++c) {
      top_[c].reset();
      drive_[c].reset();
      drive_[c].set_cutoff(1500.0f, sample_rate());
      spread_line_[c].clear();
    }
    clear_touch();
    for (int i = 0; i < kHold; ++i) hold_all_[i] = hold_drive_[i] = hold_high_[0][i] = hold_high_[1][i] = 0.0f;
    hold_at_ = 0;
    now_all_ = now_drive_ = now_high_[0] = now_high_[1] = 0.0f;
    top_all_ = top_drive_ = 0.0f;
    for (int b = 0; b < kBands; ++b) top_high_[b] = last_high_[b] = 0.0f;
    level_ = swing_ = loud_ = 0.0f;
    for (auto& band : high_) {
      for (kit::Svf& h : band) h.reset();
    }
    side_[0] = side_[1] = 0.0f;
    steep_ = drive_was_[0] = drive_was_[1] = 0.0f;
    before_ = strike_ = 0.0f;
    settle_ticks_ = quiet_ticks_ = letting_go_ = 0;
    jump_ = from_ = 0.0f;
    climb_ = held_climb_ = 0.0f;
    curve_ = -1.0f;
    sink_ = sink_target_ = 1.0f;
    open_ = open_target_ = 0.0f;
    place_hz_ = 0.0f;
    partial_ = kFirstPartial;
    hits_left_ = hit_index_ = 0;
    chatter_ = false;
    hit_wait_ = hit_gap_ = hit_age_ = 0.0f;
    hit_env_ = hit_ = sharp_ = pan_ = 0.0f;
    hit_decay_ = 0.0f;
    touch_ = 1.0f;
    shown_ = 0.0f;
    still_ = 0;
  }

  // What belongs to the model that is on.
  void clear_touch() {
    for (int c = 0; c < 2; ++c) {
      over_[c].reset();
      for (kit::Svf& f : band_[c]) f.reset();
      for (kit::Svf& f : match_[c]) f.reset();
      agree_[c] = Match();
      edge_[c][0] = edge_[c][1] = 0.0f;
      grip_[c] = 0.0f;
      closed_[c] = odd_[c] = false;
    }
    last_inverse_ = 0.0f;
    crest_ = 0.0f;
    guard_ = 1.0f;
  }

  // --- one sample ----------------------------------------------------------------------

  void step(const float* in, float* buzz) {
    const float both = in[0] + 0.7f * in[1];
    const float drive[2] = {drive_[0].lowpass(in[0]), drive_[1].lowpass(in[1])};
    for (int c = 0; c < 2; ++c) side_[c] = kit::max(std::fabs(in[c]), flush_denormal(side_[c] * steep_k_));
    now_all_ = kit::max(now_all_, kit::max(std::fabs(in[0]), std::fabs(in[1])));
    now_drive_ = kit::max(now_drive_, kit::max(drive[0], drive[1]));
    for (int b = 0; b < kBands; ++b) {
      now_high_[b] = kit::max(now_high_[b], 0.6f * std::fabs(high_[b][1].highpass(high_[b][0].highpass(both))));
    }
    pitch_.push(both);
    steep_ = kit::max(flush_denormal(steep_ * steep_k_), kit::max(std::fabs(drive[0] - drive_was_[0]), std::fabs(drive[1] - drive_was_[1])));
    drive_was_[0] = drive[0];
    drive_was_[1] = drive[1];
    if (clock_.tick()) control();

    follow(&level_, kit::max(top_all_, now_all_));
    follow(&swing_, kit::max(top_drive_, now_drive_));
    // A note struck after another has its own loudness to fall from, not what
    // was held of the last one.
    if (letting_go_ > 0) {
      --letting_go_;
      loud_ += (level_ - loud_) * let_go_k_;
    }
    loud_ = kit::max(level_, flush_denormal(loud_ * fall_k_));
    open_ += (open_target_ - open_) * touch_k_;
    if (open_target_ == 0.0f && open_ < 1.0e-5f) open_ = 0.0f;
    step_hits();

    // The model is swapped while the buzz is down.
    if (wanted_model_ != model_) {
      swap_.set_target(0.0f);
      if (swap_.value == 0.0f) {
        model_ = wanted_model_;
        clear_touch();
        open_ = open_target_ = place_hz_ = 0.0f;
        place();
      }
    } else {
      swap_.set_target(1.0f);
    }

    const float gain = gain_.next() * swap_.next();
    sink_ += (sink_target_ - sink_) * touch_k_;
    // A wave that hardly swings to the touching side has little to touch with.
    const float held = kit::min(kit::min(loud_, 4.0f * level_), 10.0f * swing_) * sink_;
    float y[2];
    touch(drive, held, y);

    const float tone = tone_.next();
    if (tone != last_tone_) {
      last_tone_ = tone;
      for (kit::Svf& f : top_) f.set(tone, kit::kSqrtHalf, sample_rate());
    }
    // Filters ring up on what they are tuned to: what comes off is held under
    // the sound it came from, by a gain, since a curve here would fold.
    const float loudest = kit::max(std::fabs(y[0]), std::fabs(y[1]));
    crest_ = flush_denormal(loudest + (crest_ - loudest) * (loudest > crest_ ? crest_up_ : crest_down_));
    const float bound = kit::max(model_ == kShell ? jump_ : loud_, 1.0e-6f);
    const float over = kit::min(crest_ / (kCeiling * bound), 1.0e4f);
    const float over2 = over * over;
    const float hold = 1.0f / std::sqrt(std::sqrt(1.0f + over2 * over2));
    const float wall = 1.6f * bound;
    for (int c = 0; c < 2; ++c) {
      y[c] = agree(c, in[c], top_[c].lowpass(wall * kit::soft_clip(y[c] * hold / wall))) * gain;
    }

    // Around the sound: what is spread is added to one side and taken from
    // the other, so the two sides together stay what they were.
    const float width = width_.next();
    float mid = 0.5f * (y[0] + y[1]);
    float side = 0.5f * (y[0] - y[1]);
    const float apart = spread_line_[1].process(spread_line_[0].process(mid, spread_[0], 0.6f), spread_[1], -0.6f);
    side += width * (model_ == kShell ? pan_ * mid : 0.65f * apart);

    // The last word on how high the buzz may stand, for whatever the filters,
    // the turning round and the spreading have added up to.
    guard_ = 1.0f + (guard_ - 1.0f) * guard_k_;
    guard_ = kit::max(guard_, (std::fabs(mid) + std::fabs(side)) / (kMost * bound));
    mid /= guard_;
    side /= guard_;

    const float distance = distance_.next();
    if (distance > 0.0f || room_.ringing()) {
      float far_mid, far_side;
      room_.process(mid * distance * (0.8f - 0.3f * distance), &far_mid, &far_side);
      const float near = 1.0f - distance;
      mid = mid * near + far_mid;
      side = side * near + far_side * width;
    }
    buzz[0] = mid + side;
    buzz[1] = mid - side;
  }

  // The buzz lands on partials the sound may have already, and at a phase of
  // its own: against them it would hollow the sound out where it should stand
  // forward. The share of the buzz that runs against the sound in the band
  // it sits in is turned round, so what it adds there is always added.
  float agree(int c, float x, float y) {
    if (model_ == kShell) return y;
    float d = match_[c][0].bandpass(x);
    if (model_ == kGrazing) d = match_[c][1].bandpass(d);
    Match& m = agree_[c];
    m.both = flush_denormal(m.both + (d * y - m.both) * match_k_);
    m.own = flush_denormal(m.own + (d * d - m.own) * match_k_);
    if (m.both >= 0.0f) return y;
    return y - 2.0f * kit::max(m.both / (m.own + 1.0e-12f), -4.0f) * d;
  }

  void follow(float* value, float target) {
    *value = flush_denormal(*value + (target - *value) * (target > *value ? rise_k_ : sink_k_));
  }

  // What touching gives, before Amount and Tone.
  void touch(const float* drive, float held, float* y) {
    if (model_ == kShell) {
      const float n = rng_.bipolar() * noise_scale_ * hit_ * jump_;
      const float most = kit::max(kit::max(side_[0], side_[1]), 1.0e-9f);
      for (int c = 0; c < 2; ++c) {
        y[c] = norm_ * (side_[c] / most) * (band_[c][0].bandpass(n) + 0.6f * band_[c][1].bandpass(n) + 0.4f * band_[c][2].bandpass(n));
      }
      return;
    }
    const float inverse = 1.0f / kit::max(swing_, 1.0e-5f);
    const float slope = 0.25f * (inverse - last_inverse_);
    // An edge the swing is through within a sample or two would fold: the
    // steeper the swing, the softer the edge.
    const float per = kit::min(per_width_, 1.0f / kit::max(edge_time_ * kit::min(steep_ * inverse, 2.0f), 1.0e-3f));
    // A soft edge does not close in so short a touch: its top is brought back.
    const float reach = kit::clamp((1.0f - thresh_u_) * per, 0.1f, 1.0f);
    const float lift = 1.0f / (reach * reach * (3.0f - 2.0f * reach));
    // Leather cannot flap at half of a very fast swing (about 2 kHz and up).
    const float missed = 1.0f - 0.55f * kit::clamp(1.8f - 4.0f * steep_ * inverse * noise_scale_ * noise_scale_, 0.0f, 1.0f);
    const float n = model_ == kGrazing || model_ == kLeather ? 0.0f : rng_.bipolar() * noise_scale_;
    const float level = held * open_ * touch_;
    for (int c = 0; c < 2; ++c) {
      float a = edge_[c][0], b = edge_[c][1];
      bool closed = closed_[c], odd = odd_[c];
      float grip = grip_[c];
      const float grip_k = grip_k_, close_k = close_k_;
      const bool skips = model_ == kLeather;
      const float from = last_inverse_, rest = thresh_u_, k_edge = edge_k_;
      const float contact = over_[c].process(drive[c], [&](float x, int k) {
        const float t = kit::clamp((x * (from + slope * static_cast<float>(k + 1)) - rest) * per, 0.0f, 1.0f);
        float v = lift * t * t * (3.0f - 2.0f * t);
        if (skips) {
          if (t > 0.0f && !closed) odd = !odd;
          closed = t > 0.0f;
          if (odd) v *= missed;
          grip += (v - grip) * (v > grip ? close_k : grip_k);
          v = grip;
        }
        a += (v - a) * k_edge;
        b += (a - b) * k_edge;
        return b;
      });
      edge_[c][0] = flush_denormal(a);
      edge_[c][1] = flush_denormal(b);
      closed_[c] = closed;
      odd_[c] = odd;
      grip_[c] = flush_denormal(grip);
      switch (model_) {
        case kGrazing: {
          const float wide = band_[c][0].bandpass(contact * level);
          y[c] = norm_ * (band_[c][1].bandpass(wide) + 0.2f * wide) + end_norm_ * band_[c][2].bandpass(contact * level);
          break;
        }
        case kMembrane: {
          const float x = contact * level;
          y[c] = norm_ * (band_[c][0].bandpass(x) + 0.5f * band_[c][1].bandpass(x)) +
                 noise_norm_ * band_[c][2].bandpass(x * n);
          break;
        }
        case kLeather:
          y[c] = norm_ * band_[c][0].bandpass(contact * level);
          break;
        default: {
          const float x = kit::max(contact, 0.0f) * level;
          y[c] = noise_norm_ * band_[c][0].bandpass(x * n) + norm_ * band_[c][1].bandpass(x);
          break;
        }
      }
    }
    last_inverse_ = inverse;
  }

  // --- bounces -------------------------------------------------------------------------

  void attack(float sharp) {
    using namespace buzzing_bridge;
    const int count = kit::clamp_int(whole(param(kBounces)), 1, 8);
    const float length = param(kRattle) * 0.001f * sample_rate();
    const float ratio = closer();
    hits_left_ = count;
    hit_index_ = 0;
    hit_wait_ = 0.0015f * sample_rate();
    hit_age_ = 0.0f;
    hit_gap_ = count < 2 ? length
                         : length * (1.0f - ratio) / (1.0f - std::pow(ratio, static_cast<float>(count - 1)));
    sharp_ = sharp;
    chatter_ = count > 1;
  }

  float closer() const { return 0.92f - 0.45f * param(buzzing_bridge::kCurve); }

  void step_hits() {
    if (hits_left_ > 0) {
      hit_wait_ -= 1.0f;
      if (hit_wait_ <= 0.0f) strike_once();
      hit_age_ += 1.0f;
    }
    hit_env_ = flush_denormal(hit_env_ * hit_decay_);
    hit_ += (hit_env_ - hit_) * hit_k_;
    hit_ = flush_denormal(hit_);
    const float target = chatter_ ? 1.0f - sharp_ * (1.0f - kit::min(1.0f, 1.2f * hit_)) : 1.0f;
    touch_ += (target - touch_) * touch_k_;
  }

  void strike_once() {
    using namespace buzzing_bridge;
    const float sr = sample_rate();
    const float last = 20.0f * hit_age_ / (param(kFall) * 0.001f * sr);
    hit_env_ = 1.25f * std::pow(0.75f, static_cast<float>(hit_index_)) * kit::db_to_gain(-last);
    hit_decay_ = kit::time_to_coeff(kit::clamp(0.14f * hit_gap_ / sr, 0.0004f, 0.040f), sr);
    pan_ = (hit_index_ & 1) != 0 ? 0.7f - 0.15f * rng_.uniform() : -0.7f + 0.15f * rng_.uniform();
    ++hit_index_;
    --hits_left_;
    hit_wait_ += hit_gap_;
    hit_gap_ *= closer();
    if (hits_left_ == 0) chatter_ = false;
  }

  // --- control -------------------------------------------------------------------------

  // The most of a ring's last `ticks`, leaving out the newest `but`.
  float highest(const float* ring, int ticks, int but = 0) const {
    float top = 0.0f;
    for (int i = 1 + but; i <= ticks; ++i) top = kit::max(top, ring[(hold_at_ - i + kHold) % kHold]);
    return top;
  }

  void control() {
    hold_all_[hold_at_] = now_all_;
    hold_drive_[hold_at_] = now_drive_;
    for (int b = 0; b < kBands; ++b) hold_high_[b][hold_at_] = now_high_[b];
    hold_at_ = (hold_at_ + 1) % kHold;
    now_all_ = now_drive_ = now_high_[0] = now_high_[1] = 0.0f;
    const float hz = pitch_.hz();
    // Long enough for one whole swing, and no longer: what is held after the
    // swing it belongs to is a level the sound no longer has.
    const int ticks = hz > 0.0f ? kit::clamp_int(static_cast<int>(1.15f * tick_rate_ / hz) + 2, 5, kHold - 2) : 38;
    top_all_ = highest(hold_all_, 38);
    top_drive_ = highest(hold_drive_, ticks);
    for (int b = 0; b < kBands; ++b) {
      top_high_[b] = highest(hold_high_[b], 5);
      last_high_[b] = highest(hold_high_[b], 56, 5);
    }
    pitch_.tick(top_all_);
    const float low = kit::clamp(5.0f * (hz > 0.0f ? hz : 300.0f), 600.0f, 4000.0f);
    for (kit::OnePole& d : drive_) d.set_cutoff(low, sample_rate());
    room_.set(distance_.value);
    shown_fall_ = kit::time_to_coeff(0.05f, sample_rate());
    listen_for_attacks();
    place();
  }

  void listen_for_attacks() {
    const float top = top_all_;
    if (quiet_ticks_ > 0) {
      --quiet_ticks_;
      before_ = kit::max(before_, top);
      // How much of an attack it was shows over its first milliseconds.
      if (settle_ticks_ > 0) {
        jump_ = kit::min(top, kit::max(jump_, top - 0.7f * from_));
        sharp_ = kit::max(sharp_, suddenness(top));
      }
    } else {
      // The level rises, and within six milliseconds: notes that beat rise
      // again and again, and take longer over it.
      const bool rose = top > 1.45f * before_ + 1.0e-5f && highest(hold_all_, 9) > 1.25f * highest(hold_all_, 62, 9);
      // A soft note over ringing ones hardly lifts the level. Its top end
      // jumps, within three milliseconds and over all it was in the last
      // thirty-seven: beats and vibrato never do that.
      float struck = 0.0f;
      for (int b = 0; b < kBands; ++b) {
        if (top_high_[b] > kStruckJump[b] * last_high_[b] + 1.0e-5f && top_high_[b] > 0.01f * top) {
          struck = kit::max(struck, kStruckReach[b] * top_high_[b]);
        }
      }
      const bool loud_enough = model_ != kShell || top > threshold_;
      if ((rose || struck > 0.0f) && loud_enough) {
        quiet_ticks_ = static_cast<int>(0.060f * tick_rate_);
        held_climb_ = 0.0f;
        letting_go_ = static_cast<int>(0.030f * sample_rate());
        pitch_.struck();
        settle_ticks_ = static_cast<int>(0.020f * tick_rate_);
        from_ = before_;
        jump_ = kit::min(top, kit::max(top - 0.7f * from_, struck));
        attack(kit::max(suddenness(top), struck > 0.0f ? 0.5f : 0.0f));
      }
      glide(&before_, top, 0.060f, 0.120f);
    }
    if (settle_ticks_ > 0) {
      --settle_ticks_;
      strike_ = top;
    } else {
      strike_ = kit::max(top, strike_ * 0.99998f);
    }
  }

  float suddenness(float top) const {
    return kit::clamp(0.5f * (top / kit::max(from_, 1.0e-6f) - 1.0f), 0.0f, 1.0f);
  }

  void glide(float* value, float target, float up, float down) const {
    const float k = kit::time_to_coeff(target > *value ? up : down, tick_rate_);
    *value = flush_denormal(target + (*value - target) * k);
  }

  // How a run of pulses with edges adds up in a band `q` wide on the `k`th
  // partial: an edge's partials fall as 1/k and the band holds more of them
  // the higher it lies. The gain that makes it a constant.
  static float pulse_norm(float k, float q) {
    k = kit::clamp(k, 1.0f, 60.0f);
    return k / std::sqrt(kit::max(1.0f, 1.2f * k / q));
  }
  // White noise through a band `q` wide at `hz`, brought to an RMS of one.
  static float band_noise_norm(float hz, float q) { return 1.73f * std::sqrt(24000.0f * q / (1.57f * hz)); }

  void place() {
    using namespace buzzing_bridge;
    const float sr = sample_rate();
    curve_ = curve_ < 0.0f ? param(kCurve) : curve_;
    glide(&curve_, param(kCurve), 0.015f, 0.015f);
    const float curve = curve_, tracking = param(kTracking), resonance = param(kResonance);
    const float followed = pitch_.hz();
    // With no pitch to go by: 220 Hz, or half of what a sine as steep would be.
    const float steepness = steep_ / kit::max(swing_, 1.0e-5f);
    const float hz = followed > 0.0f ? followed : kit::clamp(0.08f * steepness * sr, 220.0f, 4000.0f);

    const float drop = strike_ > 1.0e-6f ? kit::gain_to_db(strike_ / kit::max(top_all_, 1.0e-6f)) : 0.0f;
    glide(&held_climb_, kHeldClimb, kHeldSeconds, kHeldSeconds);
    glide(&climb_, kit::clamp(drop / kClimbDb, held_climb_, 1.0f), 0.050f, 0.012f);
    partial_ = kFirstPartial * std::exp2(curve * 3.3333f * climb_);

    sink_target_ = sink_power_ > 0.0f && strike_ > 1.0e-6f
                       ? std::pow(kit::clamp(top_all_ / strike_, 1.0e-4f, 1.0f), sink_power_)
                       : 1.0f;

    // Above Threshold or not, by the note's own attack: a note that touched
    // goes on touching until it is gone.
    open_target_ = 0.0f;
    if (model_ == kMembrane) {
      // All the way open 4 dB over Threshold at Curve 0, 32 dB over it at 1.
      if (loud_ > threshold_) open_target_ = kit::min(1.0f, kit::gain_to_db(loud_ / threshold_) / (4.0f + 28.0f * curve));
    } else if (strike_ > threshold_) {
      open_target_ = kit::min(1.0f, kit::gain_to_db(strike_ / threshold_) * (1.0f / 3.0f));
    }

    float place = resonance;
    if (model_ == kGrazing) {
      const float still = partial_ * resonance * (1.0f / 16.0f);
      place = still * std::pow(partial_ * hz / still, followed > 0.0f ? tracking : 0.0f);
      const float over = place / (2.0f * resonance);
      place /= std::sqrt(std::sqrt(1.0f + over * over * over * over));
    } else if (model_ == kLeather) {
      place = 0.4f * resonance;
    } else if (model_ == kPaper) {
      place = 1.4f * resonance;
    }
    if (model_ != kGrazing && followed > 0.0f) {
      // A smaller skin for a higher note, and tuned to one of its partials.
      place *= std::pow(hz * (1.0f / 220.0f), 0.5f * tracking);
      const float nearest = kit::max(2.0f, std::floor(place / hz + 0.5f)) * hz;
      place *= std::pow(nearest / place, tracking);
    }
    place = kit::clamp(place, 40.0f, 0.42f * sr);
    place_hz_ = place_hz_ > 0.0f ? place_hz_ * std::pow(place / place_hz_, place_k_) : place;
    const float k = place_hz_ / hz;

    float half_turn = 0.6f, soft = 0.5f;  // how much of a swing touches, how soft its edge is
    switch (model_) {
      case kGrazing:
        half_turn = kit::clamp(1.7f / partial_, 0.45f, 0.9f);
        for (auto& b : band_) {
          b[0].set(place_hz_, 1.5f, sr);
          b[1].set(place_hz_, 1.5f, sr);
        }
        norm_ = 1.25f * pulse_norm(k, 1.5f);
        {
          // Where the climb ends is heard a little from the start, so that a
          // held note, which never dies, has its buzz as well.
          const float left = curve * 3.3333f * (1.0f - climb_);
          const float end = kit::min(place_hz_ * std::exp2(left), kit::min(2.0f * resonance, kEndHz));
          for (auto& b : band_) b[2].set(end, kEndWidth, sr);
          end_norm_ = kEndShare * kit::min(1.0f, left) * pulse_norm(kit::min(end / hz, 24.0f), kEndWidth);
        }
        break;
      case kMembrane:
        half_turn = 0.8f;
        soft = 0.25f;
        for (auto& b : band_) {
          b[0].set(place_hz_, 4.0f, sr);
          b[1].set(1.59f * place_hz_, 5.0f, sr);
          b[2].set(place_hz_, 1.2f, sr);
        }
        norm_ = 1.4f * pulse_norm(k, 4.0f);
        noise_norm_ = 0.33f * band_noise_norm(place_hz_, 1.2f);
        break;
      case kShell: {
        const float q = kit::clamp(kit::kPi * place_hz_ * 0.0012f, 1.0f, 8.0f);
        for (auto& b : band_) {
          b[0].set(place_hz_, q, sr);
          b[1].set(1.58f * place_hz_, q, sr);
          b[2].set(2.41f * place_hz_, q, sr);
        }
        norm_ = 0.75f * band_noise_norm(place_hz_, q);
        break;
      }
      case kLeather:
        half_turn = 1.15f - 0.7f * curve;
        soft = 1.0f - 0.8f * curve;
        for (auto& b : band_) b[0].set(place_hz_, 0.8f, sr);
        norm_ = 1.9f * pulse_norm(k, 0.8f);
        break;
      default:
        half_turn = 1.2f - 0.7f * curve;
        soft = 0.7f - 0.5f * curve;
        for (auto& b : band_) {
          b[0].set(place_hz_, 0.7f, sr);
          b[1].set(place_hz_, 0.9f, sr);
        }
        noise_norm_ = 1.05f * band_noise_norm(place_hz_, 0.7f);
        norm_ = 0.32f * pulse_norm(k, 0.9f);
        break;
    }
    if (model_ != kShell) {
      const float q = model_ == kGrazing ? 1.5f : (model_ == kMembrane ? 2.0f : 0.8f);
      for (auto& m : match_) {
        m[0].set(place_hz_, q, sr);
        m[1].set(place_hz_, q, sr);
      }
    }
    thresh_u_ = std::cos(half_turn * (0.8f + 0.4f * amount_));
    const float room = 1.0f - thresh_u_;
    if (model_ == kMembrane && loud_ > 1.0e-6f) thresh_u_ = kit::clamp(threshold_ / loud_, thresh_u_, 1.0f);
    per_width_ = 1.0f / kit::max(0.02f, soft * room);
  }

  buzzing_bridge_dsp::Oversampler4x over_[2];
  buzzing_bridge_dsp::SwingPitch pitch_;
  buzzing_bridge_dsp::NextRoom room_;
  kit::Smoother gain_, output_, width_, distance_, tone_;
  kit::LinearRamp swap_;
  kit::ControlClock clock_;
  kit::Rng rng_;
  kit::Svf band_[2][3];
  kit::Svf top_[2];
  kit::Svf match_[2][2];
  struct Match {
    float both = 0.0f, own = 0.0f;
  };
  Match agree_[2];
  float crest_ = 0.0f, crest_up_ = 0.0f, crest_down_ = 0.0f, guard_ = 1.0f, guard_k_ = 0.0f;
  float match_k_ = 0.0f, place_k_ = 1.0f;
  kit::OnePole drive_[2];
  kit::AllpassDelay<2048> spread_line_[2];
  int spread_[2] = {1, 1};

  // Followers.
  float hold_all_[kHold] = {}, hold_drive_[kHold] = {}, hold_high_[kBands][kHold] = {};
  int hold_at_ = 0;
  float now_all_ = 0.0f, now_drive_ = 0.0f, now_high_[kBands] = {};
  float top_all_ = 0.0f, top_drive_ = 0.0f, top_high_[kBands] = {}, last_high_[kBands] = {};
  float level_ = 0.0f, swing_ = 0.0f, loud_ = 0.0f;
  kit::Svf high_[kBands][2];
  float steep_ = 0.0f, steep_k_ = 0.0f, drive_was_[2] = {}, side_[2] = {};
  float before_ = 0.0f;
  float strike_ = 0.0f;
  int settle_ticks_ = 0, quiet_ticks_ = 0, letting_go_ = 0;
  float let_go_k_ = 0.0f;
  float jump_ = 0.0f, from_ = 0.0f;

  // The touch.
  float climb_ = 0.0f, held_climb_ = 0.0f, curve_ = -1.0f, partial_ = 0.0f, place_hz_ = 0.0f, open_ = 0.0f;
  float edge_[2][2] = {};
  float grip_[2] = {};
  bool closed_[2] = {}, odd_[2] = {};
  float thresh_u_ = 0.6f, per_width_ = 5.0f, norm_ = 1.0f, noise_norm_ = 1.0f, end_norm_ = 0.0f, last_inverse_ = 0.0f, open_target_ = 0.0f;

  // The bounces.
  int hits_left_ = 0, hit_index_ = 0;
  bool chatter_ = false;
  float hit_wait_ = 0.0f, hit_gap_ = 0.0f, hit_age_ = 0.0f;
  float hit_env_ = 0.0f, hit_decay_ = 0.0f, hit_ = 0.0f, touch_ = 1.0f, sharp_ = 0.0f, pan_ = 0.0f;

  // Settings worked out.
  int model_ = 0, wanted_model_ = 0;
  float amount_ = 0.0f, threshold_db_ = -36.0f, threshold_ = 0.0f, fall_k_ = 0.0f;
  float last_tone_ = -1.0f;
  float sink_ = 1.0f, sink_target_ = 1.0f, sink_power_ = 0.0f;

  int period_ = 32;
  float tick_rate_ = 1500.0f;
  float rise_k_ = 0.0f, sink_k_ = 0.0f, hit_k_ = 0.0f, touch_k_ = 0.0f, edge_k_ = 0.0f, grip_k_ = 0.0f, close_k_ = 0.0f, edge_time_ = 1.0f;
  float noise_scale_ = 1.0f;
  float shown_ = 0.0f, shown_fall_ = 0.9999f;
  long still_ = 0, rest_length_ = 1;
  bool resting_ = true;
};

}  // namespace livemix
