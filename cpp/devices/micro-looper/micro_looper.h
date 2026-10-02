#pragma once

// Micro Looper: an always-listening short looper with a variable clock.
// (Signal path and behaviour notes are at the end of the class comment below
// once the pieces are in.)

#include "../../kit/kit.h"
#include "memory.h"
#include "params.gen.h"

namespace livemix {

class MicroLooper : public kit::DeviceBase<micro_looper::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace micro_looper;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    ring_.clear();
    store_.clear();
    clock_.set_time(kClockGlideSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    for (int c = 0; c < 2; ++c) {
      for (float& value : history_[c]) value = 0.0f;
    }
    speed_.set_time(kMotorLagSeconds, sr);
    width_.set_time(kSmoothingSeconds, sr);
    smear_.set_time(kSmoothingSeconds, sr);
    side_cut_.set_cutoff(kSideCutHz, sr);
    drift_.seed(0x51ED270Bu);
    drift_.set_rate(kWobbleHz, sr);
    rng_.seed(0xA341316Cu);
    fast_.set(0.0005f, 0.04f, sr);
    slow_.set(0.08f, 0.4f, sr);
    write_phase_ = 0.0f;
    mix_seen_ = -1.0f;
    asleep_ = true;
    quiet_ = 0;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    restart();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    frames = begin_block(frames);
    const bool excited = input_present(frames);
    if (asleep_) {
      if (!excited) {
        silence_output(frames);
        return;
      }
      asleep_ = false;
      restart();
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      const float clock = clock_.next();
      record(in, clock);
      sequence(in);

      const float step = clock * speed_.next() * (1.0f + wobble_.next());
      if (control_.tick()) control(step, clock);
      float wet[2] = {0.0f, 0.0f};
      const float smear = smear_.next();
      const float width = width_.next();
      if (decks_[0].active || decks_[1].active) {
        loop_voice(step, clock, smear, width, wet);
      } else if (voiced_) {
        rest();
      }

      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        kit::equal_power(mix, &dry_gain_, &wet_gain_);
      }
      out_left_[i] = in[0] * dry_gain_ + wet[0] * wet_gain_;
      out_right_[i] = in[1] * dry_gain_ + wet[1] * wet_gain_;
    }
    settle(excited, frames);
  }

 private:
  // The ring holds 10.9 s at 96 kHz and full clock; a loop is at most 8 s of
  // it plus its join, and the rest is the time the copy into the store has.
  static constexpr int kRingFrames = 1 << 20;
  static constexpr int kStoreFrames = 776192;
  static constexpr int kControlPeriod = 16;
  static constexpr float kClockGlideSeconds = 0.08f;
  static constexpr float kClocks[8] = {1.0f,        0.75f,       2.0f / 3.0f, 0.5f,
                                       0.375f,      1.0f / 3.0f, 0.25f,       0.125f};
  static constexpr float kSpeeds[6] = {-2.0f, -1.0f, -0.5f, 0.5f, 1.0f, 2.0f};
  enum State : int { kListen = 0, kHold = 1, kAuto = 2 };
  enum Pending : int { kNone = 0, kCapture, kResize };
  // The longest loop: 8 s at 96 kHz and full clock.
  static constexpr double kMaxLoopFrames = 768000.0;
  static constexpr int kCopyFrames = 5;
  static constexpr float kMotorLagSeconds = 0.06f;
  // The join across the loop point: 4 % of the loop, within these bounds.
  static constexpr float kMinJoinSeconds = 0.003f;
  static constexpr float kMaxJoinSeconds = 0.08f;
  // A capture starts this long before the onset that asked for it.
  static constexpr float kLeadSeconds = 0.008f;
  static constexpr float kSoundFloor = 0.001f;   // -60 dBFS: something was played
  static constexpr float kOnsetFloor = 0.004f;   // -48 dBFS
  static constexpr float kOnsetRatio = 1.7f;     // fast over slow envelope
  static constexpr float kMinFade = 0.003f;
  // A loop that Fade has taken 60 dB off is let go.
  static constexpr float kGoneGain = 0.001f;
  static constexpr float kGoneSeconds = 0.5f;
  static constexpr float kSleepSeconds = 0.05f;
  // The band-limit's corner as a share of the clock rate (Nyquist is 0.5).
  static constexpr float kBandShare = 0.34f;
  static constexpr int kBandSections = 3;
  static constexpr float kBandQ[kBandSections] = {0.5176f, 0.7071f, 1.9319f};
  // Spread: the side reads sit this far either side of the playhead, and
  // the side signal is kept above this corner so the low end stays central.
  static constexpr float kSideSeconds = 0.011f;
  static constexpr float kSideCutHz = 200.0f;
  static constexpr float kMaxWidth = 0.75f;
  // Above this the Tone filter is blended out, so its top is no filter.
  static constexpr float kToneOpenFromHz = 11000.0f;
  // Drift at full: +-0.8 % of speed, and a pass may start up to 3 % of the
  // loop (at most 60 ms) late.
  static constexpr float kWobbleDepth = 0.008f;
  static constexpr float kWobbleHz = 0.35f;
  static constexpr float kMaxOffsetSeconds = 0.06f;

  // Smear: grains of 120 to 400 ms, three to six deep, scattered 20 to
  // 300 ms either side of the playhead.
  static constexpr int kMaxGrains = 16;
  static constexpr float kGrainOverlap = 3.0f;
  static constexpr float kGrainOverlapGrow = 3.0f;
  static constexpr float kGrainSeconds = 0.12f;
  static constexpr float kGrainGrowSeconds = 0.28f;
  static constexpr float kScatterSeconds = 0.02f;
  static constexpr float kScatterGrowSeconds = 0.28f;

  // A slow modulator worked out on the control clock and joined by lines.
  struct Line {
    float value = 0.0f;
    float step = 0.0f;
    void aim(float target, bool jump) {
      if (jump) value = target;
      step = (target - value) * (1.0f / kControlPeriod);
    }
    float next() {
      const float now = value;
      value += step;
      return now;
    }
  };

  // How much of the unfiltered signal passes beside the clock's band-limit:
  // none up to 3/4 clock, all of it at full clock, so that the glide into
  // Full ends on an exact copy.
  static float band_open(float clock) { return kit::clamp((clock - 0.75f) * 4.0f, 0.0f, 1.0f); }

  // Six-pole Butterworth low-pass at the clock's corner (three sections).
  static float band_limit(kit::Svf* sections, float x, float open) {
    const float cut = sections[2].lowpass(sections[1].lowpass(sections[0].lowpass(x)));
    return cut + open * (x - cut);
  }

  // The record stage: the input, band-limited to the clock, written to the
  // ring `clock` frames per sample. At full clock it is an exact copy.
  void record(const float* in, float clock) {
    const float open = band_open(clock);
    for (int c = 0; c < 2; ++c) {
      float* h = history_[c];
      h[0] = h[1];
      h[1] = h[2];
      h[2] = h[3];
      h[3] = clock >= 1.0f ? in[c] : band_limit(write_cut_[c], in[c], open);
    }
    if (clock >= 1.0f) {
      write_phase_ = 0.0f;
      ring_.write(guard(history_[0][2]), guard(history_[1][2]));
      return;
    }
    write_phase_ += clock;
    if (write_phase_ < 1.0f) return;
    write_phase_ -= 1.0f;
    // The frame falls `late` samples before now; read it one sample back so
    // that Hermite has a neighbour on each side.
    const float t = 1.0f - write_phase_ / clock;
    float frame[2];
    for (int c = 0; c < 2; ++c) {
      const float* h = history_[c];
      frame[c] = guard(kit::hermite(h[0], h[1], h[2], h[3], t));
    }
    ring_.write(frame[0], frame[1]);
  }

  // One playing loop. Two exist so that a new capture (or a new Length) can
  // fade in while the old one fades out.
  struct Deck {
    bool active = false;
    bool releasing = false;
    long long end = 0;       // ring frame after the capture's last one
    float rate = 48000.0f;   // ring frames per second when it was captured
    double start = 0.0;      // ring position of the loop's first frame
    double length = 1.0;     // loop length in frames
    double join = 1.0;       // frames blended across the loop point
    double place = 0.0;      // playhead, in frames from start: [offset, length)
    double offset = 0.0;     // where this pass started (Drift)
    double turns = 0.0;      // passes played since the capture
    float gain = 1.0f;       // what Fade has left
    float gain_step = 0.0f;
    float env = 0.0f;        // fade between decks, 0..1
    float env_step = 0.0f;
    float blur = 0.0f;       // half the spacing of the two reads above speed 1
    bool stored = false;     // the store holds its capture, complete (control rate)
    float until_grain = 0.0f;  // samples until Smear starts its next grain
    kit::GrainPool<kMaxGrains> grains;
  };

  // A deck's loop as a grain source: positions are frames from the loop's
  // start and wrap round it, through the same join as the playhead.
  // GrainPool asks for channel 0 and then channel 1 at one position.
  struct LoopSource {
    const MicroLooper* looper;
    const Deck* deck;
    mutable double cached = -1.0;
    mutable float cached_right = 0.0f;

    float read(int channel, double position) const {
      if (channel == 1 && position == cached) return cached_right;
      double q = position;
      while (q >= deck->length) q -= deck->length;
      while (q < 0.0) q += deck->length;
      float left, right;
      looper->loop_read(*deck, q, 0.0, &left, &right);
      cached = position;
      cached_right = right;
      return channel == 0 ? left : right;
    }
  };

  // Both channels of whichever memory holds the deck's capture. Above speed
  // 1 the read skips frames, so two reads half a step apart are averaged: a
  // zero at the ring's Nyquist, which is what would fold furthest down.
  void source_read(const Deck& d, double position, float* left, float* right) const {
    const bool stored = d.stored;
    if (d.blur < 0.01f) {
      if (stored) {
        store_.read(position, left, right);
      } else {
        ring_.read(position, left, right);
      }
      return;
    }
    float a[2], b[2];
    if (stored) {
      store_.read(position - d.blur, &a[0], &a[1]);
      store_.read(position + d.blur, &b[0], &b[1]);
    } else {
      ring_.read(position - d.blur, &a[0], &a[1]);
      ring_.read(position + d.blur, &b[0], &b[1]);
    }
    *left = 0.5f * (a[0] + b[0]);
    *right = 0.5f * (a[1] + b[1]);
  }

  // The loop as a seamless thing: `q` frames after its start, and over the
  // last `join` frames an equal-power fade into the tape just before the
  // start (shifted by `offset`), which runs straight on into the next pass.
  void loop_read(const Deck& d, double q, double offset, float* left, float* right) const {
    source_read(d, d.start + q, left, right);
    const double into = q - (d.length - d.join);
    if (into <= 0.0) return;
    float next[2];
    source_read(d, d.start + q - d.length + offset, &next[0], &next[1]);
    const float w = kit::min(1.0f, static_cast<float>(into / d.join));
    const float out_gain = kit::SineTable::cos_lookup(0.25f * w);
    const float in_gain = kit::SineTable::lookup(0.25f * w);
    *left = *left * out_gain + next[0] * in_gain;
    *right = *right * out_gain + next[1] * in_gain;
  }

  // The same loop, both channels summed and read more cheaply: what the
  // side signal is made from.
  float source_sum(const Deck& d, double position) const {
    if (d.blur < 0.01f) return d.stored ? store_.read_sum(position) : ring_.read_sum(position);
    if (d.stored) {
      return 0.5f * (store_.read_sum(position - d.blur) + store_.read_sum(position + d.blur));
    }
    return 0.5f * (ring_.read_sum(position - d.blur) + ring_.read_sum(position + d.blur));
  }

  float loop_sum(const Deck& d, double q, double offset) const {
    const float sum = source_sum(d, d.start + q);
    const double into = q - (d.length - d.join);
    if (into <= 0.0) return sum;
    const float next = source_sum(d, d.start + q - d.length + offset);
    const float w = kit::min(1.0f, static_cast<float>(into / d.join));
    return sum * kit::SineTable::cos_lookup(0.25f * w) + next * kit::SineTable::lookup(0.25f * w);
  }

  // Loop bounds from Length: the most recent `Length` seconds of the capture.
  void set_bounds(Deck& d) const {
    const double frames = static_cast<double>(param(micro_looper::kLength)) * d.rate;
    d.length = std::floor(frames < 32.0 ? 32.0 : (frames > kMaxLoopFrames ? kMaxLoopFrames : frames));
    d.start = static_cast<double>(d.end) - d.length;
    double join = 0.04 * d.length;
    if (join < kMinJoinSeconds * d.rate) join = kMinJoinSeconds * d.rate;
    if (join > kMaxJoinSeconds * d.rate) join = kMaxJoinSeconds * d.rate;
    if (join > 0.25 * d.length) join = 0.25 * d.length;
    d.join = join;
  }

  void retire(Deck& d, float seconds) {
    if (!d.active) return;
    d.releasing = true;
    d.env_step = -1.0f / kit::max(1.0f, seconds * sample_rate());
  }

  // Seconds a change of loop takes: longer with Smear, which blurs attacks.
  float swap_seconds() const { return 0.03f + 0.2f * param(micro_looper::kSmear); }

  // Start what was asked for (a capture or a new Length) on the free deck.
  void begin_pending() {
    Deck& old = decks_[current_];
    Deck& d = decks_[current_ ^ 1];
    if (pending_ == kCapture) {
      d.end = pending_end_;
      d.rate = pending_rate_;
      set_bounds(d);
      d.place = 0.0;
      d.turns = 0.0;
      d.gain = 1.0f;
    } else {
      Deck probe = old;
      set_bounds(probe);
      if (!old.active || old.releasing || probe.length == old.length) {
        pending_ = kNone;
        return;
      }
      d.end = old.end;
      d.rate = old.rate;
      set_bounds(d);
      // Stay on the same piece of tape when it is inside the new loop.
      const double rel = old.start + old.place - d.start;
      d.place = (rel >= 0.0 && rel < d.length) ? rel : 0.0;
      d.turns = old.turns;
      d.gain = old.gain;
    }
    pending_ = kNone;
    const float seconds = swap_seconds();
    d.offset = 0.0;
    d.stored = store_ready_ && store_tag_ == d.end;
    d.until_grain = 0.0f;
    d.gain_step = 0.0f;
    d.blur = 0.0f;
    d.active = true;
    d.releasing = false;
    d.env = 0.0f;
    d.env_step = 1.0f / kit::max(1.0f, seconds * sample_rate());
    retire(old, seconds);
    current_ ^= 1;
  }

  // What a change of State does at once.
  void enter_state() {
    using namespace micro_looper;
    state_seen_ = state_;
    wait_ = 0;
    if (pending_ == kCapture) pending_ = kNone;
    Deck& now = decks_[current_];
    if (state_ == kListen) {
      retire(now, swap_seconds());
    } else if (state_ == kHold) {
      // The most recent Length seconds, when anything was played in them.
      // Otherwise a loop that is already playing stays, and an empty looper
      // waits for the next phrase.
      const double frames = static_cast<double>(param(kLength)) * clock_.value * sample_rate();
      if (static_cast<double>(ring_.written() - loud_at_) < frames) request_capture();
    }
  }

  void request_capture() {
    pending_ = kCapture;
    pending_end_ = ring_.written();
    pending_rate_ = clock_.value * sample_rate();
  }

  // Samples from an onset to the capture that makes it the start of a loop.
  long wait_samples() const {
    const float seconds = param(micro_looper::kLength) - kLeadSeconds;
    const long samples = static_cast<long>(seconds * sample_rate());
    return samples < 1 ? 1 : samples;
  }

  // Listens to the input and decides when a loop is taken.
  void sequence(const float* in) {
    const float left = in[0] < 0.0f ? -in[0] : in[0];
    const float right = in[1] < 0.0f ? -in[1] : in[1];
    const float level = left > right ? left : right;
    const float fast = fast_.process(level);
    const float slow = slow_.process(level);
    if (level > kSoundFloor) loud_at_ = ring_.written();
    if (state_ != state_seen_) enter_state();
    if (wait_ > 0) {
      if (--wait_ == 0) request_capture();
    } else if (state_ != kListen && pending_ == kNone && fast > kOnsetFloor) {
      const Deck& now = decks_[current_];
      const bool playing = now.active && !now.releasing;
      if (!playing) {
        wait_ = wait_samples();
      } else if (state_ == kAuto && now.turns >= 1.0 && fast > kOnsetRatio * slow) {
        wait_ = wait_samples();
      }
    }
    if (pending_ != kNone && !decks_[current_ ^ 1].active) begin_pending();
  }

  // Everything the loop is heard through: both decks, the side signal, the
  // clock's band-limit and Tone.
  void loop_voice(float step, float clock, float smear, float width, float* wet) {
    voiced_ = true;
    if (smear != smear_seen_) {
      smear_seen_ = smear;
      plain_gain_ = kit::SineTable::cos_lookup(0.25f * smear);
      grain_gain_ = kit::SineTable::lookup(0.25f * smear);
      grain_overlap_ = kGrainOverlap + kGrainOverlapGrow * smear;
      grain_interval_ = (kGrainSeconds + kGrainGrowSeconds * smear) * sample_rate() / grain_overlap_;
      // Unrelated grains: 1 / sqrt(overlap x mean square of the Hann
      // window), and sqrt(2) for the centre of the pan law.
      grain_level_ = 1.4142136f / std::sqrt(grain_overlap_ * 0.375f);
    }
    float side = 0.0f;
    for (Deck& d : decks_) {
      if (d.active) play(d, step, width > 0.0f, wet, &side);
    }
    if (width > 0.0f) {
      // Mid/side: the side signal cancels in mono and leaves the plain loop.
      if (width != width_seen_) {
        width_seen_ = width;
        centre_gain_ = 1.0f / std::sqrt(1.0f + 2.0f * width * width);
      }
      const float s = side_cut_.highpass(side) * width;
      wet[0] = centre_gain_ * (wet[0] + s);
      wet[1] = centre_gain_ * (wet[1] - s);
    }
    if (clock < 1.0f) {
      const float open = band_open(clock);
      wet[0] = band_limit(read_cut_[0], wet[0], open);
      wet[1] = band_limit(read_cut_[1], wet[1], open);
    }
    // Tone: a 12 dB/octave high cut that opens up completely at the top.
    if (tone_open_ < 1.0f) {
      const float cut_left = tone_[0].lowpass(wet[0]);
      const float cut_right = tone_[1].lowpass(wet[1]);
      wet[0] = cut_left + tone_open_ * (wet[0] - cut_left);
      wet[1] = cut_right + tone_open_ * (wet[1] - cut_right);
    }
  }

  // No loop is playing: leave the voice's filters empty for the next one.
  void rest() {
    voiced_ = false;
    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k < kBandSections; ++k) read_cut_[c][k].reset();
      tone_[c].reset();
    }
    side_cut_.reset();
  }

  // One sample of a deck into `wet`, then move its playhead by `step` frames.
  void play(Deck& d, double step, bool wide, float* wet, float* side) {
    float loop[2];
    loop_read(d, d.place, d.offset, &loop[0], &loop[1]);
    const float gain = d.gain * (d.env >= 1.0f ? 1.0f : kit::SineTable::lookup(0.25f * d.env));
    // Smear: grains from around the playhead, moving at the loop's speed.
    if (grain_gain_ > 0.0f && !d.releasing) {
      d.until_grain -= 1.0f;
      if (d.until_grain <= 0.0f) {
        d.until_grain += grain_interval_ * (0.5f + rng_.uniform());
        if (step > 0.1 || step < -0.1) spawn(d, static_cast<float>(step));
      }
    }
    float cloud[2] = {0.0f, 0.0f};
    if (d.grains.active() > 0) {
      const LoopSource source{this, &d};
      d.grains.render(source, &cloud[0], &cloud[1]);
    }
    wet[0] += (loop[0] * plain_gain_ + cloud[0] * grain_gain_) * gain;
    wet[1] += (loop[1] * plain_gain_ + cloud[1] * grain_gain_) * gain;
    if (wide) {
      // Two more reads, just ahead of and behind the playhead.
      const double reach = kSideSeconds * d.rate;
      const double span = d.length - d.offset;
      double ahead = d.place + reach;
      if (ahead >= d.length) ahead -= span;
      double behind = d.place - reach;
      if (behind < d.offset) behind += span;
      *side += 0.5f * gain * (loop_sum(d, ahead, d.offset) - loop_sum(d, behind, d.offset));
    }

    const double half = 0.5 * d.length;
    const bool low = d.place < half;
    d.place += step;
    if (d.place >= d.length) {
      d.place -= d.length - d.offset;
    } else if (d.place < d.offset) {
      d.place += d.length - d.offset;
    } else if (low != (d.place < half)) {
      // Mid-loop, away from both ends: choose where the next pass starts.
      const double most = kit::min(0.03f * static_cast<float>(d.length), kMaxOffsetSeconds * d.rate);
      d.offset = param(micro_looper::kDrift) * rng_.uniform() * most;
    }
    d.turns += (step < 0.0 ? -step : step) / d.length;
    d.gain += d.gain_step;
    d.env += d.env_step;
    if (d.env >= 1.0f) {
      d.env = 1.0f;
      d.env_step = 0.0f;
    } else if (d.env <= 0.0f && d.releasing) {
      d.active = false;
      d.releasing = false;
      d.env = 0.0f;
      d.grains.reset();
    }
  }

  void spawn(Deck& d, float step) {
    using namespace micro_looper;
    const float smear = param(kSmear);
    const float length = (kGrainSeconds + kGrainGrowSeconds * smear) * sample_rate();
    double scatter = (kScatterSeconds + kScatterGrowSeconds * smear) * d.rate;
    if (scatter > 0.25 * d.length) scatter = 0.25 * d.length;
    // A whole number of frames from the playhead, so that at normal speed a
    // grain reads stored frames exactly as the playhead does.
    const double position = d.place + std::floor(scatter * rng_.bipolar());
    const float pan = param(kSpread) * rng_.bipolar();
    d.grains.spawn(position, step, length, pan, grain_level_, 1.0f);
  }

  // Keep the current loop: copy its capture from the ring into the store, a
  // few frames per sample (in one piece on each control tick), once nothing
  // is playing from the store any more.
  void keep() {
    const Deck& now = decks_[current_];
    if (!now.active || (store_ready_ && store_tag_ == now.end)) return;
    if (store_tag_ != now.end) {
      const Deck& other = decks_[current_ ^ 1];
      if (store_ready_ && other.active && other.end == store_tag_) return;
      store_tag_ = now.end;
      store_ready_ = false;
      copy_at_ = now.end - (kStoreFrames - 4);
      store_.begin(copy_at_);
    }
    int count = 0;
    float* dest = store_.claim(kCopyFrames * kControlPeriod, &count);
    ring_.copy(copy_at_, count, dest);
    copy_at_ += count;
    if (store_.full()) store_ready_ = true;
  }

  // Control rate: what Fade takes off each deck, and the read blur.
  void control(float step, float clock) {
    using namespace micro_looper;
    const float sr = sample_rate();
    if (clock < 1.0f) {
      if (clock != clock_seen_) {
        // The corner is a share of the clock at a nominal 48 kHz, so a clock
        // setting is as dark at every host rate.
        clock_seen_ = clock;
        const float hz = kBandShare * clock * kit::min(sr, 48000.0f);
        for (int c = 0; c < 2; ++c) {
          for (int k = 0; k < kBandSections; ++k) {
            write_cut_[c][k].set(hz, kBandQ[k], sr);
            read_cut_[c][k].set(hz, kBandQ[k], sr);
          }
        }
      }
    } else if (clock_seen_ < 1.0f) {
      clock_seen_ = 1.0f;
      for (int c = 0; c < 2; ++c) {
        for (int k = 0; k < kBandSections; ++k) {
          write_cut_[c][k].reset();
          read_cut_[c][k].reset();
        }
      }
    }
    const float tone = param(kTone);
    if (tone != tone_now_) {
      tone_now_ += (tone - tone_now_) * 0.25f;
      if (tone_now_ < 1.0f || std::fabs(tone - tone_now_) < 0.5f) tone_now_ = tone;
      tone_[0].set(tone_now_, kit::kSqrtHalf, sr);
      tone_[1].set(tone_now_, kit::kSqrtHalf, sr);
      const float open = kit::clamp((tone_now_ - kToneOpenFromHz) / (kParamMax[kTone] - kToneOpenFromHz),
                                    0.0f, 1.0f);
      tone_open_ = open * open;
    }
    wobble_.aim(param(kDrift) * kWobbleDepth * drift_.next(kControlPeriod), !moving_);
    moving_ = true;
    keep();

    const float speed = step < 0.0f ? -step : step;
    const float fade = kit::max(param(kFade), kMinFade);
    for (Deck& d : decks_) {
      if (!d.active) continue;
      d.blur = 0.5f * kit::clamp(speed - 1.0f, 0.0f, 1.0f);
      float target = d.gain;
      if (state_ == kAuto && d.turns > 1.0 && fade < 1.0f) {
        target *= std::exp(std::log(fade) * speed * kControlPeriod / static_cast<float>(d.length));
      }
      d.gain_step = (target - d.gain) * (1.0f / kControlPeriod);
      if (d.gain < kGoneGain && !d.releasing) retire(d, kGoneSeconds);
      // Never read tape the record head is about to reach (the copy into
      // the store finishes long before; this is the safety net).
      d.stored = store_ready_ && store_tag_ == d.end;
      const double oldest = d.start - d.join - 8.0;
      if (!d.stored && !d.releasing &&
          static_cast<double>(ring_.written()) - oldest > kRingFrames - 8192) {
        retire(d, 0.02f);
      }
    }
  }

  // A NaN or a runaway input must not sit in the memory for seconds.
  static float guard(float x) { return (x > -8.0f && x < 8.0f) ? flush_denormal(x) : 0.0f; }

  // Everything at rest: init, and waking from sleep (the memory then reads
  // as silence, which is what the gap was).
  void restart() {
    ring_.forget();
    for (Deck& d : decks_) d = Deck();
    current_ = 0;
    state_seen_ = -1;
    pending_ = kNone;
    wait_ = 0;
    loud_at_ = -(1LL << 40);
    store_tag_ = -1;
    store_ready_ = false;
    fast_.reset();
    slow_.reset();
    write_phase_ = 0.0f;
    for (int c = 0; c < 2; ++c) {
      for (float& value : history_[c]) value = 0.0f;
    }
    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k < kBandSections; ++k) {
        write_cut_[c][k].reset();
        read_cut_[c][k].reset();
      }
      tone_[c].reset();
    }
    side_cut_.reset();
    clock_seen_ = 2.0f;
    tone_now_ = -1.0f;
    width_seen_ = -1.0f;
    moving_ = false;
    voiced_ = false;
    wobble_ = Line();
    control_.reset(kControlPeriod);
    clock_.snap(clock_.target);
    speed_.snap(speed_.target);
    mix_.snap(mix_.target);
    width_.snap(width_.target);
    smear_.snap(smear_.target);
    smear_seen_ = -1.0f;
    quiet_ = 0;
  }

  // Sleep once nothing is coming in, nothing is looping or about to, and the
  // output has been below the floor for a little while.
  void settle(bool excited, int frames) {
    const bool busy = decks_[0].active || decks_[1].active || wait_ > 0 || pending_ != kNone;
    if (excited || busy || output_peak(frames) > kit::IdleGate::kFloor) {
      quiet_ = 0;
      return;
    }
    quiet_ += frames;
    if (quiet_ > static_cast<long>(kSleepSeconds * sample_rate())) asleep_ = true;
  }

  void apply(int id) {
    using namespace micro_looper;
    const float value = param(id);
    const bool glide = primed() && !asleep_;
    switch (id) {
      case kClock:
        clock_.set(kClocks[kit::clamp_int(static_cast<int>(value + 0.5f), 0, 7)], glide);
        break;
      case kState:
        state_ = kit::clamp_int(static_cast<int>(value + 0.5f), 0, 2);
        break;
      case kLength:
        if (pending_ == kNone) pending_ = kResize;
        break;
      case kSpeed:
        speed_.set(kSpeeds[kit::clamp_int(static_cast<int>(value + 0.5f), 0, 5)], glide);
        break;
      case kSmear:
        smear_.set(value, glide);
        break;
      case kSpread:
        width_.set(kMaxWidth * value, glide);
        break;
      case kMix:
        mix_.set(value, glide);
        break;
      default:
        break;
    }
  }

  micro_looper::Ring<kRingFrames> ring_;
  micro_looper::Store<kStoreFrames> store_;
  Deck decks_[2];
  int current_ = 0;
  int state_ = kAuto;
  int state_seen_ = -1;
  int pending_ = kNone;
  long long pending_end_ = 0;
  float pending_rate_ = 48000.0f;
  long wait_ = 0;              // samples until the capture an onset asked for
  long long loud_at_ = 0;      // ring frame count when the input was last audible
  long long store_tag_ = -1;   // the capture (its end) the store holds or is being filled with
  long long copy_at_ = 0;
  bool store_ready_ = false;
  kit::Follower fast_, slow_;
  kit::LinearRamp clock_;
  kit::Smoother mix_, speed_, width_, smear_;
  kit::Svf write_cut_[2][kBandSections];
  kit::Svf read_cut_[2][kBandSections];
  kit::Svf tone_[2];
  kit::OnePole side_cut_;
  kit::Drift drift_;
  kit::Rng rng_;
  Line wobble_;
  bool moving_ = false;
  bool voiced_ = false;
  float clock_seen_ = 1.0f;
  float tone_now_ = 0.0f;
  float tone_open_ = 0.0f;
  float width_seen_ = -1.0f, centre_gain_ = 1.0f;
  float smear_seen_ = -1.0f, plain_gain_ = 1.0f, grain_gain_ = 0.0f, grain_interval_ = 1200.0f;
  float grain_overlap_ = 3.0f, grain_level_ = 1.0f;
  kit::ControlClock control_;
  float history_[2][4] = {};
  float write_phase_ = 0.0f;
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  bool asleep_ = true;
  long quiet_ = 0;
};

}  // namespace livemix
