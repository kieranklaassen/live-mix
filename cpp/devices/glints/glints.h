#pragma once

// Glints: sparse bright sparks thrown off the sound.
//
//   in ─┬────────────────────────────────────────────────────────────────► dry ─┐
//       └─ L+R ─► half-band ─► ring ÷2 ─► half-band ─► ring ÷4 ─► half-band ─► ring ÷8
//          level and brightness ─► pace ─► sparks ─► high-pass ─(+)─► limit ─► wet ─┴─► out
//                                                               ▲     │
//                                                               └─ trail: delay, damped, crossed
//
// - A spark is a short piece of what was just played, read two to eight
//   times as fast, so it sounds on a harmonic of what it was thrown off: the
//   octave (x2), the fifth above it (x3), two octaves (x4), and for the
//   Overtones choice on up the series to x8. Under a window with a fast front
//   edge and a quick fall it is a point of light on the sound.
// - Reading faster than the sound arrives needs a head start: a spark at
//   speed s and length L starts (s - 1) L behind the present at the least and
//   catches up as it ends. Scatter lets it start later still, by up to its
//   setting, most often by little (the square of a uniform draw).
// - Speeds above one would alias. The sparks read copies of the input
//   decimated by 2, 4 and 8 through half-band filters (kit::Halfband2x), so
//   what a spark shifts up was band-limited first: x2 reads the ÷2 copy a
//   sample at a time, x4 the ÷4 copy, x8 the ÷8 copy. x3 and x6 move through
//   theirs by three quarters of a sample, x5 by five eighths and x7 by seven
//   eighths, so only eight fractional positions ever occur: an eight-phase,
//   16-tap windowed sinc reads them.
// - The pace is Density sparks a second, each interval drawn by chance.
//   Follow ties it to the playing: the level of the input, with what is above
//   3 kHz counted for more, read on a decibel scale from nothing to full.
// - Trail is an echo on the sparks alone: a delay whose repeats cross from
//   side to side and lose their top each time round.
// - Everything a spark uses is fixed when it starts, at a point where its
//   window is zero, so Pitch, Size, Scatter, Spread and Density cannot click.
//   Sparkle's high-pass, Trail and Mix act on what is already sounding and
//   are smoothed.
// - After kDeadSeconds of exact silence in, nothing a spark could reach holds
//   sound. The pace stops there, and the first sound after it starts
//   everything that runs by itself (the dice, the pace, the decimators, the
//   smoothers) from one known state, at that sample: what comes out does not
//   depend on when the device fell asleep, so not on the host's block size.
//
// Storage (static, sized for 96 kHz): the three decimated rings (131072,
// 131072 and 65536 floats: 2.7 s, 5.4 s and 5.4 s at 96 kHz), the two trail
// lines (131072 floats each) and a ring of 4096 level buckets, 2.4 MB in all.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Glints : public kit::DeviceBase<glints::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace glints;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int i = 0; i < kRing1; ++i) ring1_[i] = 0.0f;
    for (int i = 0; i < kRing2; ++i) ring2_[i] = 0.0f;
    for (int i = 0; i < kRing3; ++i) ring3_[i] = 0.0f;
    for (int i = 0; i < kBuckets; ++i) bucket_[i] = 0.0f;
    for (kit::Halfband2x& half : half_) half.init();
    make_kernel();
    written_ = kOrigin;
    held1_ = held2_ = held3_ = 0.0f;
    for (Spark& spark : sparks_) spark = Spark();
    active_ = 0;
    for (int c = 0; c < 2; ++c) {
      trail_line_[c].clear();
      trail_damp_[c].reset();
      trail_damp_[c].set_cutoff(kTrailDampHz, sr);
      cut_[c].reset();
    }
    bright_.reset();
    bright_.set_cutoff(kBrightHz, sr);
    level_.set(kLevelAttackSeconds, kLevelReleaseSeconds, sr);
    level_.reset();
    mix_.set_time(kSmoothingSeconds, sr);
    trail_.set_time(kSmoothingSeconds, sr);
    trail_time_.set_time(kTrailGlideSeconds, sr);
    trail_glide_.set_time(kTrailGlideSeconds, sr);
    sparkle_.set_time(0.01f, sr / kControlPeriod);
    mix_seen_ = -1.0f;
    dead_after_ = static_cast<long>(kDeadSeconds * sr);
    count_ = 0;
    for (float& code : newest_) code = 0.0f;
    // The longest silent gap once the pace has stopped is one trail time.
    idle_.reset(sr, kParamMax[kTrailTime] * 0.001f + 0.2f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    restart();
    // Nothing has been played yet: nothing to throw until the first sound.
    dead_ = true;
    quiet_run_ = dead_after_;
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw each
  // spark where and when it sounds: how many have been thrown, how many a
  // second are being thrown now (none once nothing is left to throw them
  // off), and the newest four, newest first, each as one whole number that
  // holds its row (speed less two, 3 bits), where it was thrown from left to
  // right (6 bits), how late it comes in steps of 2 ms (12 bits) and how loud
  // it is in steps of 6 dB (3 bits). A whole number under 2^24 is exact in a
  // float.
  float meter(int index) const {
    switch (index) {
      case 0:
        return static_cast<float>(count_ & 0xFFFFFF);
      case 1:
        return dead_ ? 0.0f : pace_;
      case 2:
      case 3:
      case 4:
      case 5:
        return newest_[(count_ - (index - 2)) & 3];
      default:
        return 0.0f;
    }
  }

  void process(int frames) {
    using namespace glints;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames) || !dead_ || active_ > 0)) {
      silence_output(frames);
      return;
    }
    const float longest_trail = kit::DelayLine<kTrailSize>::max_delay() - 8.0f;
    float wet_peak = 0.0f;
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);

      if (in[0] != 0.0f || in[1] != 0.0f) {
        if (dead_) restart();
        quiet_run_ = 0;
      } else if (!dead_ && ++quiet_run_ >= dead_after_) {
        dead_ = true;
      }

      // What the sparks are made of: the middle, with anything that is not a
      // sound (NaN, infinity, a runaway sample) left out so that it cannot
      // sit in a ring or in the level for seconds.
      float mono = 0.5f * (in[0] + in[1]);
      if (!(mono > -kLoudest && mono < kLoudest)) mono = 0.0f;
      record(mono);
      const float level = level_.process(kBodyWeight * mono + kBrightWeight * bright_.highpass(mono));

      if (clock_.tick()) control(level);

      if (!dead_) {
        due_ += pace_step_;
        if (due_ >= next_due_) {
          due_ -= next_due_;
          next_due_ = interval();
          throw_spark();
        }
      }

      float wet[2] = {0.0f, 0.0f};
      if (active_ > 0) render(&wet[0], &wet[1]);
      wet[0] = cut_[0].highpass(wet[0]);
      wet[1] = cut_[1].highpass(wet[1]);

      // The trail: what one side played comes back on the other.
      const float feedback = trail_.next() * kMaxFeedback;
      trail_glide_.set_target(trail_time_.next());
      const float gap = kit::clamp(trail_glide_.next(), 8.0f, longest_trail);
      const float back_left = trail_damp_[0].lowpass(trail_line_[0].read_hermite(gap));
      const float back_right = trail_damp_[1].lowpass(trail_line_[1].read_hermite(gap));
      wet[0] = flush_denormal(wet[0] + feedback * back_right);
      wet[1] = flush_denormal(wet[1] + feedback * back_left);
      trail_line_[0].write(wet[0]);
      trail_line_[1].write(wet[1]);

      // Linear up to ±1, never past ±2.
      wet[0] = 2.0f * kit::soft_clip(0.5f * wet[0]);
      wet[1] = 2.0f * kit::soft_clip(0.5f * wet[1]);
      const float loud = kit::max(wet[0] < 0.0f ? -wet[0] : wet[0], wet[1] < 0.0f ? -wet[1] : wet[1]);
      if (loud > wet_peak) wet_peak = loud;

      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        kit::equal_power(mix, &dry_gain_, &wet_gain_);
        // The cosine of a quarter turn is not quite nothing in a float.
        if (mix >= 1.0f) dry_gain_ = 0.0f;
      }
      out_left_[i] = in[0] * dry_gain_ + wet[0] * wet_gain_;
      out_right_[i] = in[1] * dry_gain_ + wet[1] * wet_gain_;
    }
    // Awake for as long as the sparks or their trail sound at all, whatever
    // Mix lets through: a trail must not stop under Mix 0 and carry on when
    // the device is next woken.
    idle_.settle(kit::max(output_peak(frames), wet_peak), frames);
  }

  // What the display's test copies (src/react/__tests__/displays.glints.test.ts).
  static constexpr int kNumRows = 7;   // speeds 2 to 8
  static constexpr int kNumSets = 5;   // the Pitch choices
  // The chance that a spark's row is this one or a lower one, per Pitch
  // choice: Octave, Octave and fifth, Two octaves, Mixed (45 % x2, 25 % x3,
  // 30 % x4), Overtones (falling up the series).
  static constexpr float kChance[kNumSets][kNumRows] = {
      {1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f},
      {0.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f},
      {0.0f, 0.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f},
      {0.45f, 0.70f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f},
      {0.24f, 0.43f, 0.59f, 0.72f, 0.83f, 0.92f, 1.0f},
  };
  // Which decimated ring a row reads (1, 2 or 3: ÷2, ÷4, ÷8), how far that
  // ring trails the input in samples, and the room kept between a spark's
  // reader and the head in samples of its ring.
  static constexpr int kRingOf[kNumRows] = {1, 2, 2, 3, 3, 3, 3};
  static constexpr float kLag[4] = {0.0f, 31.0f, 93.0f, 217.0f};
  static constexpr float kHeadRoom = 12.0f;
  // The window: a front edge of 6 ms at Sparkle 0 down to 0.3 ms at 1, never
  // more than this share of the spark, then a fall by the square.
  static constexpr float kSoftEdgeSeconds = 0.006f;
  static constexpr float kSharpEdgeSeconds = 0.0003f;
  static constexpr float kMostEdge = 0.3f;
  // Sparkle's high-pass, from 150 Hz to 3.5 kHz, and how much louder a spark
  // is at Sparkle 1 than at 0 for what that takes away.
  static constexpr float kCutLowHz = 150.0f;
  static constexpr float kCutHighHz = 3500.0f;
  static constexpr float kSparkleLift = 1.0f;
  // The pace: an interval is this much of its mean for certain and the rest
  // by chance, so two sparks never fall on one another's front edge.
  static constexpr float kLeastInterval = 0.3f;
  // Follow: the level that counts as nothing and as full, in dB, and the
  // weights of the body of the sound and of what is above kBrightHz.
  static constexpr float kFollowFloorDb = -48.0f;
  static constexpr float kFollowFullDb = -6.0f;
  static constexpr float kBodyWeight = 0.3f;
  static constexpr float kBrightWeight = 3.0f;
  static constexpr float kBrightHz = 3000.0f;
  static constexpr float kLevelAttackSeconds = 0.005f;
  static constexpr float kLevelReleaseSeconds = 0.08f;
  // The trail: Trail 1 is this much feedback; each repeat passes this low-pass.
  static constexpr float kMaxFeedback = 0.85f;
  static constexpr float kTrailDampHz = 5000.0f;
  // Trail Time glides through two lags of this length, one after the other,
  // so the echoes bend to their new pitch and back with no corner.
  static constexpr float kTrailGlideSeconds = 0.04f;
  // A spark that would play nothing louder than this (-72 dBFS) is not thrown.
  static constexpr float kQuiet = 0.00025f;
  // How long the input has been exact silence when nothing is left to throw:
  // more than the furthest a spark reads back (2 s of Scatter and seven
  // lengths of 300 ms at x8).
  static constexpr float kDeadSeconds = 4.5f;

 private:
  static constexpr int kRing1 = 1 << 17;
  static constexpr int kRing2 = 1 << 17;
  static constexpr int kRing3 = 1 << 16;
  static constexpr int kTrailSize = 1 << 17;
  static constexpr int kBucketShift = 7;  // a level bucket is 128 samples of input
  static constexpr int kBuckets = 4096;
  static constexpr int kMaxSparks = 32;
  static constexpr int kControlPeriod = 16;
  static constexpr int kTaps = 16;
  static constexpr float kLoudest = 8.0f;
  // Sample counts start here so that no position is ever negative; a whole
  // number of level buckets.
  static constexpr long long kOrigin = 1LL << 24;

  struct Spark {
    bool active = false;
    int ring = 1;
    long long at = 0;      // where it reads, in eighths of a sample of its ring
    int step = 8;          // eighths per output sample
    float phase = 0.0f;    // 0..1 through its window
    float phase_step = 0.0f;
    float edge = 0.1f;     // the share of it that is front edge
    float inv_edge = 10.0f;
    float inv_fall = 1.0f;
    float gain_left = 0.0f;
    float gain_right = 0.0f;
  };

  void apply(int id) {
    using namespace glints;
    const float value = param(id);
    switch (id) {
      case kSparkle:
        sparkle_.set(value, primed());
        break;
      case kTrail:
        trail_.set(value, primed());
        break;
      case kTrailTime:
        trail_time_.set(value * 0.001f * sample_rate(), primed());
        if (!primed()) trail_glide_.snap(trail_time_.target);
        break;
      case kMix:
        mix_.set(value, primed());
        break;
      default:
        break;  // the rest is read when a spark is thrown or on the control clock
    }
  }

  // The first sound after a silence in which nothing was left to throw: put
  // everything that runs by itself in one known state, here, on this sample.
  // The rings behind this point hold silence (kDeadSeconds of it was
  // recorded before the device could fall asleep), so the count of samples
  // can move on to a whole level bucket, which is a whole group of eight for
  // the decimators too.
  void restart() {
    for (kit::Halfband2x& half : half_) half.reset();
    held1_ = held2_ = held3_ = 0.0f;
    while (written_ & ((1 << kBucketShift) - 1)) record(0.0f);
    rng_.seed(0x61A9C7E5u);
    due_ = 0.0f;
    next_due_ = interval();
    level_.reset();
    bright_.reset();
    clock_.reset(kControlPeriod);
    // Nothing of the sparks sounded through the silence, so what was set
    // meanwhile is there from the first sample.
    mix_.snap(mix_.target);
    trail_.snap(trail_.target);
    trail_time_.snap(trail_time_.target);
    trail_glide_.snap(trail_time_.target);
    sparkle_.snap(sparkle_.target);
    pace_ = 0.0f;
    pace_step_ = 0.0f;
    dead_ = false;
    quiet_run_ = 0;
  }

  // Store one sample of the middle in the three decimated rings (sample m of
  // the ÷2 ring is the input at 2m - 31, sample j of the ÷4 ring the input
  // at 4j - 93, sample k of the ÷8 ring the input at 8k - 217) and in the
  // level bucket of its 128 samples.
  void record(float x) {
    const float size = x < 0.0f ? -x : x;
    float& bucket = bucket_[(written_ >> kBucketShift) & (kBuckets - 1)];
    if ((written_ & ((1 << kBucketShift) - 1)) == 0 || size > bucket) bucket = size;
    if (written_ & 1) {
      const long long m = written_ >> 1;
      const float half = half_[0].down(held1_, x);
      ring1_[m & (kRing1 - 1)] = half;
      if (m & 1) {
        const long long j = m >> 1;
        const float quarter = half_[1].down(held2_, half);
        ring2_[j & (kRing2 - 1)] = quarter;
        if (j & 1) {
          ring3_[(j >> 1) & (kRing3 - 1)] = half_[2].down(held3_, quarter);
        } else {
          held3_ = quarter;
        }
      } else {
        held2_ = half;
      }
    } else {
      held1_ = x;
    }
    ++written_;
  }

  // Control rate: Sparkle's high-pass, and the pace from Density and Follow.
  void control(float level) {
    using namespace glints;
    const float sr = sample_rate();
    const float sparkle = sparkle_.next();
    const float hz = kCutLowHz * std::exp(sparkle * std::log(kCutHighHz / kCutLowHz));
    cut_[0].set(hz, kit::kSqrtHalf, sr);
    cut_[1].set(hz, kit::kSqrtHalf, sr);
    const float playing =
        kit::clamp((kit::gain_to_db(level) - kFollowFloorDb) / (kFollowFullDb - kFollowFloorDb), 0.0f, 1.0f);
    const float follow = param(kFollow);
    pace_ = param(kDensity) * (1.0f - follow + follow * playing);
    pace_step_ = pace_ / sr;
  }

  // The next interval between two sparks, in mean intervals.
  float interval() {
    return kLeastInterval - (1.0f - kLeastInterval) * std::log(1.0f - rng_.uniform());
  }

  int capacity(int ring) const { return ring == 3 ? kRing3 : (ring == 2 ? kRing2 : kRing1); }

  void throw_spark() {
    using namespace glints;
    // The same draws whether or not the spark is thrown, so one that finds
    // nothing to play does not move the ones after it.
    const float pick = rng_.uniform();
    const float wait = rng_.uniform();
    const float side = rng_.bipolar();
    const float depth = rng_.uniform();
    if (active_ >= kMaxSparks) return;

    const float sr = sample_rate();
    const int set = kit::clamp_int(static_cast<int>(param(kPitch) + 0.5f), 0, kNumSets - 1);
    int row = 0;
    while (row < kNumRows - 1 && pick >= kChance[set][row]) ++row;
    const float speed = static_cast<float>(row + 2);
    const int ring = kRingOf[row];
    const int decimation = 1 << ring;

    // How late it comes: its head start, and then as much of Scatter as the
    // dice give. Above 96 kHz a ring holds less time and the longest sparks
    // are cut to fit it.
    float length = kit::max(16.0f, param(kSize) * 0.001f * sr);
    const float room = kLag[ring] + kHeadRoom * static_cast<float>(decimation);
    const float furthest = static_cast<float>((capacity(ring) - 16) * decimation);
    float least = (speed - 1.0f) * length + room;
    if (least > furthest) {
      length = (furthest - room) / (speed - 1.0f);
      least = furthest;
    }
    const float late = kit::min(least + param(kScatter) * 0.001f * sr * wait * wait, furthest);
    const long long from = written_ - static_cast<long long>(late);

    // How loud it will be: the loudest of what it reads that is recorded by
    // now, each stretch weighed by how far the window has fallen when the
    // spark gets to it.
    const float span = speed * length;
    long long last = from + static_cast<long long>(span);
    if (last > written_ - 1) last = written_ - 1;
    float loudest = 0.0f;
    for (long long b = from >> kBucketShift; b <= (last >> kBucketShift); ++b) {
      const float through = kit::clamp(
          (static_cast<float>((b << kBucketShift) - from)) / span, 0.0f, 1.0f);
      const float heard = bucket_[b & (kBuckets - 1)] * (1.0f - through) * (1.0f - through);
      if (heard > loudest) loudest = heard;
    }
    if (loudest < kQuiet) return;

    Spark* found = nullptr;
    for (Spark& spark : sparks_) {
      if (!spark.active) {
        found = &spark;
        break;
      }
    }
    if (!found) return;
    Spark& spark = *found;
    spark.active = true;
    ++active_;
    spark.ring = ring;
    const double place = (static_cast<double>(from) + static_cast<double>(kLag[ring])) /
                         static_cast<double>(decimation);
    spark.at = static_cast<long long>(std::floor(place + 0.5)) * 8;
    spark.step = (row + 2) * 8 / decimation;
    spark.phase = 0.0f;
    spark.phase_step = 1.0f / length;
    const float sparkle = param(kSparkle);
    const float edge_seconds =
        kSoftEdgeSeconds * std::exp(sparkle * std::log(kSharpEdgeSeconds / kSoftEdgeSeconds));
    spark.edge = kit::min(kMostEdge, edge_seconds * sr * spark.phase_step);
    spark.inv_edge = 1.0f / spark.edge;
    spark.inv_fall = 1.0f / (1.0f - spark.edge);

    // Constant-power pan with most sparks away from the centre, so Spread 1
    // is properly wide. A spark thrown hard to one side plays what it reads
    // at the level it was played, on that side alone; one in the centre has
    // the same power over the two sides. Sparkle makes it louder for what its
    // high-pass takes away. Once Density and Size have more than one sounding
    // at a time they are turned down by the root of how many, so a glitter
    // is no louder than one spark after another.
    const float pan = param(kSpread) * (side < 0.0f ? -1.0f : 1.0f) * (1.0f - depth * depth * depth);
    const float overlap = param(kDensity) * length / sr;
    const float gain = (1.0f + kSparkleLift * sparkle) * kit::min(1.0f, 1.0f / std::sqrt(overlap));
    kit::pan_gains(pan, &spark.gain_left, &spark.gain_right);
    spark.gain_left *= gain;
    spark.gain_right *= gain;

    // For the display only.
    ++count_;
    const uint32_t pan_step = static_cast<uint32_t>(kit::clamp((pan + 1.0f) * 31.5f + 0.5f, 0.0f, 63.0f));
    const uint32_t late_step = static_cast<uint32_t>(kit::clamp(late / sr * 500.0f + 0.5f, 0.0f, 4095.0f));
    const uint32_t loud_step =
        static_cast<uint32_t>(kit::clamp((kit::gain_to_db(loudest) + 42.0f) / 6.0f + 0.5f, 0.0f, 7.0f));
    newest_[count_ & 3] = static_cast<float>(static_cast<uint32_t>(row) | (pan_step << 3) |
                                             (late_step << 9) | (loud_step << 21));
  }

  // Add one output frame of every spark.
  void render(float* left, float* right) {
    float sum_left = 0.0f;
    float sum_right = 0.0f;
    for (Spark& spark : sparks_) {
      if (!spark.active) continue;
      const float* ring = spark.ring == 3 ? ring3_ : (spark.ring == 2 ? ring2_ : ring1_);
      const long long mask = capacity(spark.ring) - 1;
      const long long index = spark.at >> 3;
      float sample;
      if (spark.step == 8) {
        sample = ring[index & mask];
      } else {
        const float* taps = kernel_[spark.at & 7];
        sample = 0.0f;
        for (int t = 0; t < kTaps; ++t) sample += taps[t] * ring[(index - 7 + t) & mask];
      }
      float window;
      if (spark.phase < spark.edge) {
        const float s = spark.phase * spark.inv_edge;
        window = s * s * (3.0f - 2.0f * s);
      } else {
        const float fall = 1.0f - (spark.phase - spark.edge) * spark.inv_fall;
        window = fall * fall;
      }
      sample *= window;
      sum_left += sample * spark.gain_left;
      sum_right += sample * spark.gain_right;
      spark.at += spark.step;
      spark.phase += spark.phase_step;
      if (spark.phase >= 1.0f) {
        spark.active = false;
        --active_;
      }
    }
    *left += sum_left;
    *right += sum_right;
  }

  // The eight fractional positions a spark can read at: a 16-tap windowed
  // sinc for each (Kaiser, about 50 dB), cut a little under the ring's
  // Nyquist. A cubic would leave images of the ring's top octave at -15 dB.
  void make_kernel() {
    const double pi = 3.14159265358979323846;
    const double cutoff = 0.915;
    const double beta = 4.55;
    for (int phase = 0; phase < 8; ++phase) {
      double sum = 0.0;
      double taps[kTaps];
      for (int t = 0; t < kTaps; ++t) {
        const double u = static_cast<double>(t - 7) - 0.125 * phase;
        const double sinc = (u > -1.0e-9 && u < 1.0e-9) ? cutoff : std::sin(pi * cutoff * u) / (pi * u);
        const double r = u / 8.5;
        taps[t] = sinc * bessel_i0(beta * std::sqrt(1.0 - r * r)) / bessel_i0(beta);
        sum += taps[t];
      }
      for (int t = 0; t < kTaps; ++t) kernel_[phase][t] = static_cast<float>(taps[t] / sum);
    }
  }
  static double bessel_i0(double x) {
    double sum = 1.0;
    double term = 1.0;
    for (int k = 1; k < 32; ++k) {
      term *= (x / (2.0 * k)) * (x / (2.0 * k));
      sum += term;
    }
    return sum;
  }

  float ring1_[kRing1];
  float ring2_[kRing2];
  float ring3_[kRing3];
  float bucket_[kBuckets];
  float kernel_[8][kTaps];
  kit::Halfband2x half_[3];
  float held1_ = 0.0f, held2_ = 0.0f, held3_ = 0.0f;
  long long written_ = kOrigin;  // samples recorded, from kOrigin
  Spark sparks_[kMaxSparks];
  int active_ = 0;
  kit::Rng rng_;
  kit::OnePole bright_;
  kit::Follower level_;
  kit::ControlClock clock_;
  kit::Svf cut_[2];
  kit::DelayLine<kTrailSize> trail_line_[2];
  kit::OnePole trail_damp_[2];
  kit::Smoother mix_, trail_, trail_time_, trail_glide_, sparkle_;
  kit::IdleGate idle_;
  float mix_seen_ = -1.0f;  // the mix the two gains below were worked out for
  float dry_gain_ = 1.0f;
  float wet_gain_ = 0.0f;
  float pace_ = 0.0f;       // sparks a second now
  float pace_step_ = 0.0f;  // the same per sample
  float due_ = 0.0f;        // mean intervals gone by since the last spark
  float next_due_ = 1.0f;   // and how many the next one waits for
  long dead_after_ = 0;     // samples of silence in after which nothing is left to throw
  long quiet_run_ = 0;      // samples of exact silence in so far
  bool dead_ = true;
  // Kept for the display (meter()); nothing that sounds reads them.
  long count_ = 0;          // sparks thrown since init
  float newest_[4] = {};    // the last four, packed (see meter())
};

}  // namespace livemix
