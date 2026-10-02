#pragma once

// Micro Looper: an always-listening short looper with a variable clock.
//
//   in ─┬──────────────────────────────────────────────────────────► dry ─┐
//       └─► band-limit ─► ring (written at the clock) ─► store (a held loop)
//                              │                             │
//                              └──────────┬──────────────────┘
//                         two decks: playhead + grains + side reads
//                                         │
//                    side (mid/side) ─► band-limit ─► Tone ─► limit ─► wet ─┴─► out
//
// - The ring always records. A loop is the most recent Length seconds of it:
//   Hold takes them at once (or, when nothing was played, waits for the next
//   phrase and takes that); Auto takes each new phrase one Length after its
//   attack, once the loop before it has been round (or, for playing without
//   attacks, after two passes), and lets every pass after the first come
//   back quieter by Fade until it is 60 dB down and let go.
// - Clock is the rate the ring is written and read at, as a share of the
//   host rate. The input is band-limited to it (six poles at 0.34 of the
//   clock rate, referred to 48 kHz) and resampled with Hermite; the loop is
//   band-limited the same way on the way out. At Full both are bypassed and
//   the ring holds the input exactly. Moving the clock while a loop plays
//   changes its pitch and length together; it glides over 80 ms.
// - A capture is copied from the ring into the store a few frames per sample
//   (3 s at 48 kHz, during which the loop plays from the ring), so the ring
//   can go on listening while a loop is kept for ever. The store always
//   takes the longest loop there can be, so Length can be moved on a loop
//   that is already held.
// - A deck plays its loop as a seamless thing: over the last 4 % of the loop
//   (3 to 80 ms) it fades into the tape just before the loop's start, which
//   runs on into the next pass. The fade's law follows the measured
//   correlation of those two pieces of tape: equal power when they have
//   nothing in common, gains that add up to one when they are alike (a held
//   chord), so the level does not swell at the join. Before that the join
//   is lined up: the tape that fades in is taken from the place, within
//   12 ms or 1 % of the loop, where it is most like the tape that fades out,
//   so a held note meets itself in phase instead of cancelling once a pass
//   (unrelated material stays where it was). That holds at any speed
//   and in either direction, so Speed is a motor with a 60 ms lag and passes
//   through a stop into reverse. A second deck exists so that a new capture
//   or a new Length fades in while the old loop fades out.
// - Above speed 1 the read skips frames; it low-passes as it interpolates
//   then (see source_read) so the top of the capture does not fold back.
// - Smear blends the playhead (equal power) into grains of 120 to 400 ms
//   taken from 20 to 300 ms either side of it and moving at its speed.
// - Spread adds a side signal, the difference of two reads 11 ms ahead of
//   and behind the playhead, above 250 Hz: plus on the left, minus on the
//   right. Summed to mono it cancels and leaves the plain loop.
// - Drift wobbles the speed (+-0.8 % at full, 0.35 Hz, three sines) and
//   starts each pass up to 3 % of the loop late.
// - Sleep: with no loop playing or about to and no input, the device stops
//   once the last thing played is further back than the longest Length (so
//   Hold can still take it until then), and wakes with an empty memory. A
//   held loop keeps it awake.

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
    side_cut_.set(kSideCutHz, kit::kSqrtHalf, sr);
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
      in[0] = safe(in[0]);
      in[1] = safe(in[1]);
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
  static constexpr int kStoreFrames = 778240;
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
  // The join's law follows how alike its two sides are (see join_gains);
  // below this correlation it is not followed.
  static constexpr float kMinAlike = -0.5f;
  // Lining the join up (see Search): the tape that fades in may start up to
  // 12 ms or 1 % of the loop either side of where it was asked to, at the
  // place where it is most like the tape that fades out. The two are
  // compared on points about 12 kHz apart. The join moves only for a real
  // gain: the best place has to be a likeness (kAlignFloor) and better than
  // the place asked for by kAlignGain, both raised to kAlignChance standard
  // errors of the measurement when the join is short. Noise, drums and
  // anything already in step stay exactly where they were.
  static constexpr float kAlignSeconds = 0.012f;
  static constexpr float kAlignShare = 0.01f;
  static constexpr float kAlignRateHz = 12000.0f;
  static constexpr float kAlignFloor = 0.3f;
  static constexpr float kAlignGain = 0.15f;
  static constexpr float kAlignChance = 2.5f;
  static constexpr float kNudgeCost = 0.05f;   // what the furthest place gives up
  static constexpr int kSearchIn = 10240;      // frames of tape under the search
  static constexpr int kSearchOut = 1536;      // points across the join
  static constexpr int kSearchCopy = 64;       // frames read per control tick
  static constexpr int kSearchWork = 512;      // points compared per control tick
  // A capture starts this long before the onset that asked for it.
  static constexpr float kLeadSeconds = 0.008f;
  static constexpr float kSoundFloor = 0.001f;   // -60 dBFS: something was played
  static constexpr float kOnsetFloor = 0.004f;   // -48 dBFS
  static constexpr float kOnsetRatio = 1.7f;     // fast over slow envelope
  static constexpr double kRenewTurns = 2.0;
  static constexpr float kMinFade = 0.003f;
  // A loop that Fade has taken 60 dB off is let go.
  static constexpr float kGoneGain = 0.001f;
  static constexpr float kGoneSeconds = 0.5f;
  static constexpr float kSleepSeconds = 0.05f;
  static constexpr float kInputBound = 4.0f;   // +12 dBFS
  // The band-limit's corner as a share of the clock rate (Nyquist is 0.5).
  static constexpr float kBandShare = 0.34f;
  static constexpr int kBandSections = 3;
  static constexpr float kBandQ[kBandSections] = {0.5176f, 0.7071f, 1.9319f};
  // Spread: the side reads sit this far either side of the playhead, and
  // the side signal is kept above this corner so the low end stays central.
  static constexpr float kSideSeconds = 0.011f;
  static constexpr float kSideCutHz = 250.0f;
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
    float blur = 0.0f;       // low-pass in the read above speed 1: 0 to 1/4
    float alike = 0.0f;      // correlation of the join's two sides at `offset`
    double target = 0.0;     // where Drift asked this pass to start
    bool searching = false;  // its join is to be lined up for `target`
    bool found = false;      // a result waits until the playhead is clear of both ends
    double found_offset = 0.0;
    float found_alike = 0.0f;
    bool aligned = false;    // the first result is in: grains may start
    double grain_offset = 0.0;  // the join the grains read through, fixed from then on
    float grain_alike = 0.0f;
    bool linear = false;     // fades linearly: the other deck is on the same tape
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
      const double span = deck->length - deck->grain_offset;
      double q = position;
      while (q >= deck->length) q -= span;
      while (q < deck->grain_offset) q += span;
      float left, right;
      looper->loop_read(*deck, q, deck->grain_offset, deck->grain_alike, &left, &right);
      cached = position;
      cached_right = right;
      return channel == 0 ? left : right;
    }
  };

  // Both channels of whichever memory holds the deck's capture. Above speed
  // 1 the read skips frames, which would fold the top of the capture back
  // down, so the read low-passes as it interpolates (wide_weights in
  // memory.h): at double speed a raised cosine with its zero on the ring's
  // Nyquist, which is what would fold furthest down.
  void source_read(const Deck& d, double position, float* left, float* right) const {
    if (d.blur < 0.002f) {
      if (d.stored) {
        store_.read(position, left, right);
      } else {
        ring_.read(position, left, right);
      }
    } else if (d.stored) {
      store_.read_wide(position, d.blur, left, right);
    } else {
      ring_.read_wide(position, d.blur, left, right);
    }
  }

  // The gains of the fade across the join, `w` of the way through it. Two
  // sides that have nothing in common want equal power (cos, sin); two that
  // are alike (a held chord against itself one loop earlier) would swell by
  // up to 3 dB under it, every pass, and want gains that add up to one. With
  // the measured correlation r of the two sides the power of the sum is
  // 1 + r sin(2 angle), so dividing it out keeps the level through the join
  // for anything in between. Sides in opposite phase still dip: no pair of
  // gains can save what cancels, and r is not followed below kMinAlike;
  // which is why the join is first lined up where its sides agree (Search).
  static void join_gains(float alike, float w, float* out_gain, float* in_gain) {
    const float fall = kit::SineTable::cos_lookup(0.25f * w);
    const float rise = kit::SineTable::lookup(0.25f * w);
    const float level = 1.0f / std::sqrt(1.0f + 2.0f * alike * fall * rise);
    *out_gain = fall * level;
    *in_gain = rise * level;
  }

  // The loop as a seamless thing: `q` frames after its start, and over the
  // last `join` frames a fade (join_gains) into the tape just before the
  // start (shifted by `offset`), which runs straight on into the next pass.
  // `alike` is the correlation of the two sides at that offset.
  void loop_read(const Deck& d, double q, double offset, float alike, float* left, float* right) const {
    source_read(d, d.start + q, left, right);
    const double into = q - (d.length - d.join);
    if (into <= 0.0) return;
    float next[2];
    source_read(d, d.start + q - d.length + offset, &next[0], &next[1]);
    float out_gain, in_gain;
    join_gains(alike, kit::min(1.0f, static_cast<float>(into / d.join)), &out_gain, &in_gain);
    *left = *left * out_gain + next[0] * in_gain;
    *right = *right * out_gain + next[1] * in_gain;
  }

  // The same loop with both channels summed before the interpolation: what
  // the side signal is made from.
  float source_sum(const Deck& d, double position) const {
    if (d.blur < 0.002f) return d.stored ? store_.read_sum(position) : ring_.read_sum(position);
    float left, right;
    if (d.stored) {
      store_.read_wide(position, d.blur, &left, &right);
    } else {
      ring_.read_wide(position, d.blur, &left, &right);
    }
    return left + right;
  }

  float loop_sum(const Deck& d, double q, double offset, float alike) const {
    const float sum = source_sum(d, d.start + q);
    const double into = q - (d.length - d.join);
    if (into <= 0.0) return sum;
    const float next = source_sum(d, d.start + q - d.length + offset);
    float out_gain, in_gain;
    join_gains(alike, kit::min(1.0f, static_cast<float>(into / d.join)), &out_gain, &in_gain);
    return sum * out_gain + next * in_gain;
  }

  // Lining a join up. A held note that meets itself out of phase at the
  // loop point cancels there once a pass, whatever the fade's gains, so the
  // tape that fades in is taken from where it agrees with the tape that
  // fades out: the offset within +-`half` frames of the one asked for at
  // which the two are most alike (normalised correlation of the channel
  // sum over the join). The work is spread over control ticks: the tape is
  // copied out a few frames at a time, then one place is tried per tick on
  // points `step` frames apart (staggered, so a tone cannot hide between
  // them), then every frame around the best. One search runs at a time.
  struct Search {
    enum Stage : int { kCopyIn = 0, kCopyOut, kCoarse, kFine };
    int deck = -1;           // the deck it works for, -1 when idle
    int stage = kCopyIn;
    double target = 0.0;     // the offset asked for
    long whole = 0;          // ... as whole frames
    long step = 1;
    long hop = 0;            // stagger of the points within a step
    long half = 0;
    long points = 0;
    long in_count = 0;
    double in_from = 0.0;    // tape position of search_in_[0]
    double out_from = 0.0;   // tape position of the join's first frame
    long at = 0;             // progress of a copy
    long lag = 0, lag_end = 0, lag_step = 1;
    float out_power = 0.0f;
    float best = -4.0f;      // best score: correlation less the cost of the nudge
    float best_alike = 0.0f;
    long best_lag = 0;
    float centre_alike = 0.0f;
  };

  float tape_sum(const Deck& d, double position) const {
    return d.stored ? store_.read_sum(position) : ring_.read_sum(position);
  }

  void start_search(int index) {
    static constexpr long kHops[9] = {0, 0, 1, 2, 3, 2, 5, 3, 5};
    const Deck& d = decks_[index];
    Search& s = search_;
    s = Search();
    s.deck = index;
    s.target = d.target;
    s.whole = static_cast<long>(d.target + 0.5);
    const long join = static_cast<long>(d.join);
    s.step = kit::clamp_int(static_cast<int>(d.rate / kAlignRateHz + 0.5f), 1, 8);
    s.hop = kHops[s.step];
    s.points = join / s.step;
    if (s.points > kSearchOut) s.points = kSearchOut;
    if (s.points < 1) s.points = 1;
    const double window = kit::min(kAlignSeconds * d.rate, kAlignShare * static_cast<float>(d.length));
    s.half = (static_cast<long>(window) / s.step) * s.step;
    const long room = (kSearchIn - s.step * s.points) / 2;
    if (s.half > room) s.half = room > 0 ? (room / s.step) * s.step : 0;
    s.in_count = 2 * s.half + s.step * s.points;
    s.out_from = d.start + d.length - static_cast<double>(join);
    s.in_from = d.start - static_cast<double>(join) + static_cast<double>(s.whole - s.half);
  }

  // The correlation of the join's two sides with the incoming one `lag`
  // frames from the offset asked for.
  void try_lag(Search& s, long lag) const {
    const float* in = search_in_ + (lag + s.half);
    float xy = 0.0f, yy = 0.0f;
    long stagger = 0;
    for (long k = 0; k < s.points; ++k) {
      const float y = in[s.step * k + stagger];
      xy += search_out_[k] * y;
      yy += y * y;
      stagger += s.hop;
      if (stagger >= s.step) stagger -= s.step;
    }
    const float power = s.out_power * yy;
    const float alike = power > 1.0e-18f ? xy / std::sqrt(power) : 0.0f;
    if (lag == 0) s.centre_alike = alike;
    const float away = static_cast<float>(lag < 0 ? -lag : lag);
    const float score = alike - (s.half > 0 ? kNudgeCost * away / static_cast<float>(s.half) : 0.0f);
    if (score > s.best) {
      s.best = score;
      s.best_alike = alike;
      s.best_lag = lag;
    }
  }

  // One control tick of the search for deck `d`.
  void search_step(Deck& d) {
    Search& s = search_;
    if (s.stage == Search::kCopyIn) {
      long to = s.at + kSearchCopy;
      if (to > s.in_count) to = s.in_count;
      for (long n = s.at; n < to; ++n) search_in_[n] = tape_sum(d, s.in_from + static_cast<double>(n));
      s.at = to;
      if (to == s.in_count) {
        s.stage = Search::kCopyOut;
        s.at = 0;
      }
      return;
    }
    if (s.stage == Search::kCopyOut) {
      long to = s.at + kSearchCopy;
      if (to > s.points) to = s.points;
      for (long k = s.at; k < to; ++k) {
        const long frame = s.step * k + (s.hop * k) % s.step;
        const float x = tape_sum(d, s.out_from + static_cast<double>(frame));
        search_out_[k] = x;
        s.out_power += x * x;
      }
      s.at = to;
      if (to == s.points) {
        s.stage = Search::kCoarse;
        s.lag = -s.half;
        s.lag_end = s.half;
        s.lag_step = s.step;
      }
      return;
    }
    for (long budget = kSearchWork; budget > 0 && s.lag <= s.lag_end; budget -= s.points) {
      try_lag(s, s.lag);
      s.lag += s.lag_step;
    }
    if (s.lag <= s.lag_end) return;
    if (s.stage == Search::kCoarse && s.step > 1) {
      s.stage = Search::kFine;
      s.lag = s.best_lag - (s.step - 1) < -s.half ? -s.half : s.best_lag - (s.step - 1);
      s.lag_end = s.best_lag + (s.step - 1) > s.half ? s.half : s.best_lag + (s.step - 1);
      s.lag_step = 1;
      return;
    }
    // Take the best place when it is a real likeness and better than the
    // place asked for; otherwise the join stays where it was asked for.
    const float chance = kAlignChance / std::sqrt(static_cast<float>(s.points));
    const bool worth = s.best_alike >= kit::max(kAlignFloor, chance) &&
                       s.best_alike >= s.centre_alike + kit::max(kAlignGain, chance);
    d.found_offset = static_cast<double>(s.whole + (worth ? s.best_lag : 0));
    d.found_alike = kit::clamp(worth ? s.best_alike : s.centre_alike, kMinAlike, 1.0f);
    d.found = true;
    d.searching = false;
    s.deck = -1;
  }

  // Who the search works for (control rate): the deck it has, while that
  // still wants what was asked; otherwise the next deck that is waiting.
  void serve_search() {
    if (search_.deck >= 0) {
      Deck& d = decks_[search_.deck];
      if (d.active && !d.releasing && d.searching && d.target == search_.target) {
        search_step(d);
        return;
      }
      search_.deck = -1;
    }
    for (int index = 0; index < 2; ++index) {
      const Deck& d = decks_[index];
      if (d.active && !d.releasing && d.searching) {
        start_search(index);
        return;
      }
    }
  }

  // Move a deck's join to where the search put it, once the playhead and
  // the side reads either side of it are clear of both ends of the loop.
  // The grains' join is set by the first result and stays there, since a
  // grain may be reading across it at any time afterwards.
  void take_found(Deck& d) {
    const double reach = kSideSeconds * d.rate + 4.0;
    const double low = (d.found_offset > d.offset ? d.found_offset : d.offset) + reach;
    if (d.place <= low || d.place >= d.length - d.join - reach) return;
    d.offset = d.found_offset;
    d.alike = d.found_alike;
    d.found = false;
    if (!d.aligned) {
      d.aligned = true;
      d.grain_offset = d.offset;
      d.grain_alike = d.alike;
    }
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
      d.linear = false;
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
      const bool same_tape = rel >= 0.0 && rel < d.length;
      d.place = same_tape ? rel : 0.0;
      // Two decks on the same piece of tape add up in phase, so they fade
      // linearly; unrelated ones fade with equal power.
      d.linear = same_tape;
      old.linear = same_tape;
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
    d.alike = 0.0f;
    d.target = 0.0;
    d.searching = true;
    d.found = false;
    d.aligned = false;
    d.grain_offset = 0.0;
    d.grain_alike = 0.0f;
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
      } else if (state_ == kAuto && ((now.turns >= 1.0 && fast > kOnsetRatio * slow) ||
                                    now.turns >= kRenewTurns)) {
        // A new attack once the loop has been round, or playing that goes
        // on without one (a held chord) once it has been round twice.
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
    // Exactly linear up to full scale, never past twice that: two decks, a
    // join and a pile of grains can coincide.
    wet[0] = 2.0f * kit::soft_clip(0.5f * wet[0]);
    wet[1] = 2.0f * kit::soft_clip(0.5f * wet[1]);
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
    loop_read(d, d.place, d.offset, d.alike, &loop[0], &loop[1]);
    float gain = d.gain;
    if (d.env < 1.0f) gain *= d.linear ? d.env : kit::SineTable::lookup(0.25f * d.env);
    // Smear: grains from around the playhead, moving at the loop's speed.
    if (grain_gain_ > 0.0f && !d.releasing && d.aligned) {
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
      *side += 0.5f * gain *
               (loop_sum(d, ahead, d.offset, d.alike) - loop_sum(d, behind, d.offset, d.alike));
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
      // The offset itself follows once the join has been lined up near it.
      const double target = param(micro_looper::kDrift) * rng_.uniform() * most;
      if (target != d.target) {
        d.target = target;
        d.searching = true;
        d.found = false;
      }
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
    serve_search();

    const float speed = step < 0.0f ? -step : step;
    const float fade = kit::max(param(kFade), kMinFade);
    for (Deck& d : decks_) {
      if (!d.active) continue;
      d.blur = 0.25f * kit::clamp(speed - 1.0f, 0.0f, 1.0f);
      float target = d.gain;
      if (state_ == kAuto && d.turns > 1.0 && fade < 1.0f) {
        target *= std::exp(std::log(fade) * speed * kControlPeriod / static_cast<float>(d.length));
      }
      d.gain_step = (target - d.gain) * (1.0f / kControlPeriod);
      if (d.found) take_found(d);
      if (d.gain < kGoneGain && !d.releasing) retire(d, kGoneSeconds);
      // Never read tape the record head is about to reach (the copy into
      // the store finishes long before; this is the safety net).
      d.stored = store_ready_ && store_tag_ == d.end;
      const double oldest = d.start - d.join - kAlignSeconds * d.rate - 8.0;
      if (!d.stored && !d.releasing &&
          static_cast<double>(ring_.written()) - oldest > kRingFrames - 8192) {
        retire(d, 0.02f);
      }
    }
  }

  // The input as everything here sees it, the dry path too: a sample that
  // is not a number is silence and nothing is beyond +-kInputBound, so one
  // bad sample can neither reach the output nor lodge in the onset detector
  // or the clock's filters. Anything a host sends in earnest passes untouched.
  static float safe(float x) {
    if (x > -kInputBound) return x < kInputBound ? x : kInputBound;
    return x <= -kInputBound ? -kInputBound : 0.0f;
  }

  // A NaN or a runaway input must not sit in the memory for seconds.
  static float guard(float x) { return (x > -8.0f && x < 8.0f) ? flush_denormal(x) : 0.0f; }

  // Everything at rest: init, and waking from sleep (the memory then reads
  // as silence, which is what the gap was).
  void restart() {
    ring_.forget();
    for (Deck& d : decks_) d = Deck();
    search_ = Search();
    current_ = 0;
    // Nothing to take yet: Hold and Auto both wait for the first phrase.
    state_seen_ = state_;
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

  // Sleep once nothing is coming in, nothing is looping or about to, the
  // output has been below the floor for a little while, and the memory holds
  // nothing a Hold could still take: sleep empties it, and a player presses
  // Hold after the phrase, often after the last of it has died to nothing.
  // (With no loop playing the output is exact zeros awake or asleep.)
  void settle(bool excited, int frames) {
    const bool busy = decks_[0].active || decks_[1].active || wait_ > 0 || pending_ != kNone;
    const double longest =
        static_cast<double>(micro_looper::kParamMax[micro_looper::kLength]) * clock_.value * sample_rate();
    const bool remembering = static_cast<double>(ring_.written() - loud_at_) < longest;
    if (excited || busy || remembering || output_peak(frames) > kit::IdleGate::kFloor) {
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
  kit::Svf side_cut_;
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
  Search search_;
  float search_in_[kSearchIn] = {};
  float search_out_[kSearchOut] = {};
  kit::ControlClock control_;
  float history_[2][4] = {};
  float write_phase_ = 0.0f;
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  bool asleep_ = true;
  long quiet_ = 0;
};

}  // namespace livemix
