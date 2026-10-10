#pragma once

// Canon: the musical canon as an effect. What is played goes down one line;
// up to four followers read it, each one Gap later than the one before, and
// play it again at an interval of their own.
//
//   in ─┬───────────────────────────────────────────────────────── dry ─┐
//       └─(+)─► line ─┬─► follower 1 ─► shift ─► place ─┐               │
//          ▲          ├─► follower 2 ─► shift ─► place ─┤               │
//          │          ├─► follower 3 ─► shift ─► place ─┼─► tone ─► limit ─► wet ─┴─► out
//          │          └─► follower 4 ─► shift ─► place ─┘
//          └─ limit ◄─ × Round ◄─ 30 Hz low cut ◄─ tone ◄─ the last follower, before placing
//
// - The line is one stereo float ring of 37.5 s at 96 kHz (29 MB, line.h):
//   four gaps of 7.5 s, and one more for a crab that reads back through its
//   own gap. A follower reads it on whole frames, so follower k at unison is
//   the line k gaps ago, bit for bit.
// - A crab follower plays each gap's worth backwards: the gaps are counted
//   from the first note after a silence, and inside gap number m follower k
//   starts k - 1 gaps back at the gap's last frame and walks back two frames
//   of delay a sample. So what a forward follower would play at place a of a
//   gap, the crab plays at its mirror, Gap - 1 - a.
// - A follower's reader never glides. When Gap, Crab or an interval moves it,
//   or a crab's gap runs out, a new reader starts at the new place and the
//   two cross over (equal power, 30 ms or a quarter of the gap), one
//   crossing at a time: a move made during a crossing waits for its end.
// - Transposing is a stage after the reader (shifter.h): two heads on a
//   short ring, spliced where the wave lines up. How late it plays an attack
//   on average (21 ms an octave up, 14 ms an octave down) is taken off the
//   reader's delay, so the attack of a transposed forward follower still
//   falls on the gap on average, and within 12 ms of it wherever it lands in
//   the heads' sweep. A crab is not corrected and plays that much late. At
//   zero the shifter is out of the path; turning an interval to or from zero
//   crosses the two over in 30 ms, and between two intervals the pitch
//   glides (12 ms).
// - Fade makes each follower 12 dB times Fade quieter than the one before,
//   and the followers together are scaled to the power of one, so a count of
//   four is no louder than one. Spread puts them left and right in turn (a
//   single follower stays in the middle), narrowing each as it moves aside.
// - Tone is one 6 dB low-pass per follower, in a chain: the first follower
//   passes one, the fourth four. At the top of its range it is out of the
//   path altogether.
// - Round writes the last follower back into the line (after one more Tone
//   pole and a low cut), so the canon comes round again one gap later, with
//   the last follower's interval and crab applied once more per lap. The
//   loop gain is Round, under one, and what returns is limited (exactly
//   linear up to full scale, never past twice that).
// - Rest: once nothing above -140 dBFS has been written for as long as the
//   furthest reader reaches, the device sleeps, and it wakes with a blank
//   line and the gaps counted from the first sample that is not silence,
//   wherever in a block that falls.

#include "../../kit/kit.h"
#include "line.h"
#include "params.gen.h"
#include "shifter.h"

namespace livemix {

class Canon : public kit::DeviceBase<canon::kNumParams> {
 public:
  static constexpr int kVoices = 4;

  void init(float sample_rate) {
    using namespace canon;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    line_.clear();
    window_ = canon_dsp::Shifter::window_samples(sr);
    for (int k = 0; k < kVoices; ++k) {
      Follower& f = followers_[k];
      f.shifter.prepare(sr);
      f.semis.set_time(kGlideSeconds, sr);
      f.blend.set_time(kCrossSeconds, sr);
      f.gain_left.set_time(kSmoothingSeconds, sr);
      f.gain_right.set_time(kSmoothingSeconds, sr);
      f.narrow.set_time(kSmoothingSeconds, sr);
      f.feed.set_time(kSmoothingSeconds, sr);
      f.blend.snap(0.0f);
      f.semis.snap(0.0f);
      f.ratio = 1.0f;
      f.ratio_step = 0.0f;
      f.target_ratio = 1.0f;
      f.interval = 0;
      f.lead = 0;
    }
    round_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    tone_.set_time(kSmoothingSeconds, sr / kControlPeriod);
    meter_window_ = static_cast<int>(kMeterSeconds * sr);
    if (meter_window_ < 1) meter_window_ = 1;
    count_ = 1;
    asleep_ = true;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    restart();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw:
  // 0, how long the device has run since it woke, in seconds, going round at
  // 64, and -1 while it sleeps (when the line is forgotten); 1, the highest
  // sample written to the line in the last 20 to 40 ms; 2, how far into the
  // gap the crabs count the device is, in seconds; 3 to 6, the highest sample
  // each follower played in the last 20 to 40 ms, as loud as Fade and the
  // count make it and before Mix. All of them are kept while the sound is
  // made and only handed over here.
  float meter(int index) const {
    if (asleep_) return index == 0 ? -1.0f : 0.0f;
    const float sr = sample_rate();
    switch (index) {
      case 0: {
        const long long lap = static_cast<long long>(kClockSeconds * sr);
        return static_cast<float>(run_ % lap) / sr;
      }
      case 1:
        return kit::max(line_peak_[0], line_peak_[1]);
      case 2:
        return static_cast<float>(chunk_) / sr;
      default:
        if (index >= 3 && index < 3 + kVoices) {
          const Follower& f = followers_[index - 3];
          return kit::max(f.peak[0], f.peak[1]);
        }
        return 0.0f;
    }
  }

  void process(int frames) {
    using namespace canon;
    frames = begin_block(frames);
    const bool excited = input_present(frames);
    int first = 0;
    if (asleep_) {
      if (!excited) {
        silence_output(frames);
        return;
      }
      asleep_ = false;
      line_.forget();
      restart();
      // The device starts on the first sample that is not silence, wherever in
      // the block that is: the crabs' gaps and the shifters' splices are
      // counted from there, so the block size does not move them.
      while (in_left_[first] == 0.0f && in_right_[first] == 0.0f) {
        out_left_[first] = 0.0f;
        out_right_[first] = 0.0f;
        ++first;
      }
    }
    float loudest = 0.0f;  // of the followers, heard or not: the line runs on at Mix 0
    for (int i = first; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      // A bad sample from upstream (not a number, infinite, absurdly large)
      // must not sit in the line for half a minute.
      in[0] = sane(in[0]);
      in[1] = sane(in[1]);

      if (clock_.tick()) control();
      if (chunk_ >= gap_) chunk_ = 0;

      // The followers, last to first: each adds itself to what the later
      // ones left and the sum passes one more Tone pole.
      float wet[2] = {0.0f, 0.0f};
      float back[2] = {0.0f, 0.0f};
      for (int k = kVoices - 1; k >= 0; --k) {
        Follower& f = followers_[k];
        float left = 0.0f, right = 0.0f;
        const bool live = k < count_ || f.gain_left.value != 0.0f || f.gain_right.value != 0.0f ||
                          f.feed.value != 0.0f;
        if (!live) {
          // Silent and not asked for: it stands ready at its settings, so it
          // comes back at its own interval and not on the way to it.
          f.fresh = true;
          f.shifting = false;
          f.semis.snap(f.semis.target);
          f.blend.snap(f.blend.target);
          f.shifter.write(0.0f, 0.0f);
        } else {
          read(f, k, &left, &right);
          f.shifter.write(left, right);
          shift(f, k, &left, &right);
          const float size = kit::max(left < 0.0f ? -left : left, right < 0.0f ? -right : right);
          if (size > loudest) loudest = size;

          const float feed = f.feed.next();
          back[0] += feed * left;
          back[1] += feed * right;

          // Placed: narrowed towards its middle as it moves aside, so a
          // stereo line does not lose a side there.
          const float narrow = f.narrow.next();
          if (narrow != 0.0f) {
            const float mid = 0.5f * (left + right);
            left = kit::lerp(left, mid, narrow);
            right = kit::lerp(right, mid, narrow);
          }
          left *= f.gain_left.next();
          right *= f.gain_right.next();
          const float played = kit::max(left < 0.0f ? -left : left, right < 0.0f ? -right : right);
          if (played > f.peak[1]) f.peak[1] = played;
        }
        wet[0] = tone_pole_[k][0].lowpass(left + wet[0]);
        wet[1] = tone_pole_[k][1].lowpass(right + wet[1]);
      }

      // The round: the last follower goes back into the line.
      const float round = round_.next();
      float write[2];
      for (int c = 0; c < 2; ++c) {
        const float returned = rumble_[c].highpass(back_pole_[c].lowpass(back[c]));
        write[c] = flush_denormal(in[c] + limit(round * returned));
      }
      line_.write(write[0], write[1]);
      const float written = kit::max(write[0] < 0.0f ? -write[0] : write[0],
                                     write[1] < 0.0f ? -write[1] : write[1]);
      if (written > kFloor) {
        blank_ = 0;
      } else if (blank_ < kLongEnough) {
        ++blank_;
      }
      if (written > line_peak_[1]) line_peak_[1] = written;
      if (++meter_count_ >= meter_window_) turn_meters();

      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        // The ends are exact: all dry is the input, all wet has none of it.
        if (mix <= 0.0f) {
          dry_gain_ = 1.0f;
          wet_gain_ = 0.0f;
        } else if (mix >= 1.0f) {
          dry_gain_ = 0.0f;
          wet_gain_ = 1.0f;
        } else {
          dry_gain_ = kit::SineTable::cos_lookup(0.25f * mix);
          wet_gain_ = kit::SineTable::lookup(0.25f * mix);
        }
      }
      out_left_[i] = in[0] * dry_gain_ + limit(wet[0]) * wet_gain_;
      out_right_[i] = in[1] * dry_gain_ + limit(wet[1]) * wet_gain_;

      ++chunk_;
      ++run_;
    }
    // Asleep once nothing comes in, nothing above the floor has been written
    // for as long as any reader reaches, and the followers and the output
    // have died away.
    if (!excited && blank_ > reach_ && loudest <= kFloor && output_peak(frames) <= kFloor) {
      asleep_ = true;
    }
  }

  bool asleep() const { return asleep_; }
  // How alike the two heads of follower `k` were at their last splice (harness).
  float splice_match(int k) const { return followers_[k].shifter.match(); }

 private:
  // The longest Gap at 96 kHz, and the line: five of them (a crab at the
  // fourth place reaches back that far) and the tail of its fade.
  static constexpr int kMaxGap = 720000;
  static constexpr int kMinGap = 64;
  static constexpr int kLineFrames = 5 * kMaxGap + 8192;
  static constexpr int kControlPeriod = 16;
  static constexpr long kLongEnough = 1L << 30;
  static constexpr float kFloor = kit::IdleGate::kFloor;
  static constexpr float kInputLimit = 8.0f;  // +18 dBFS
  static constexpr float kGlideSeconds = 0.012f;
  // A reader's crossing to a new place, and the shifter's to and from the path.
  static constexpr float kCrossSeconds = 0.03f;
  // A crossing takes at most this share of the gap.
  static constexpr float kCrossShare = 0.25f;
  // Each follower is this much quieter than the one before at Fade 1.
  static constexpr float kFadeDb = 12.0f;
  static constexpr float kRumbleHz = 30.0f;
  static constexpr float kSqrtTwo = 1.41421356f;
  // For a display (see meter): the length of one of the two stretches a level
  // is the highest sample of, and where the clock goes round.
  static constexpr float kMeterSeconds = 0.02f;
  static constexpr float kClockSeconds = 64.0f;
  // Where each follower sits at Spread 1, by how many there are: left and
  // right in turn, the odd one in the middle.
  static constexpr float kPlaces[kVoices][kVoices] = {
      {0.0f, 0.0f, 0.0f, 0.0f},
      {-1.0f, 1.0f, 0.0f, 0.0f},
      {-1.0f, 1.0f, 0.0f, 0.0f},
      {-1.0f, 1.0f, -1.0f / 3.0f, 1.0f / 3.0f},
  };

  // A place on the line: how many frames back, and how much further back
  // every sample (0 forwards, 2 for a crab, which walks away from the newest
  // frame as fast as that comes on).
  struct Reader {
    int delay = 1;
    int step = 0;
  };

  struct Follower {
    Reader now, old;
    float cross = 1.0f, cross_step = 0.0f;  // the old reader sounds while cross < 1
    bool fresh = true;                      // nothing to cross over from
    bool crab = false;
    bool shifting = false;
    int interval = 0;  // semitones
    int lead = 0;      // samples taken off a forward reader's delay for the shifter's own
    float ratio = 1.0f, ratio_step = 0.0f, target_ratio = 1.0f;
    canon_dsp::Shifter shifter;
    kit::Smoother semis;
    kit::LinearRamp blend;  // 0 the reader alone, 1 the shifter
    kit::Smoother gain_left, gain_right, narrow, feed;
    // For meter() only: the highest sample of the stretch before, and of this one.
    float peak[2] = {0.0f, 0.0f};
  };

  // Not-a-number and infinity become silence; anything else is held to the limit.
  static float sane(float x) {
    if (x >= -kInputLimit && x <= kInputLimit) return x;
    if (x > kInputLimit && x <= 3.0e38f) return kInputLimit;
    if (x < -kInputLimit && x >= -3.0e38f) return -kInputLimit;
    return 0.0f;
  }

  // Exactly linear up to ±1, never past ±2.
  static float limit(float x) { return 2.0f * kit::soft_clip(0.5f * x); }

  // What follower `k` reads from the line now. Its reader is held to where
  // the settings put it: when they part, a new reader starts there and the
  // two cross over.
  void read(Follower& f, int k, float* left, float* right) {
    Reader want;
    if (f.crab) {
      want.step = 2;
      want.delay = k * gap_ + 2 * chunk_ + 1;
    } else {
      want.step = 0;
      want.delay = (k + 1) * gap_ - f.lead;
      if (want.delay < 1) want.delay = 1;
    }
    if (f.fresh) {
      f.fresh = false;
      f.now = want;
      f.cross = 1.0f;
    } else if (f.cross >= 1.0f && (f.now.delay != want.delay || f.now.step != want.step)) {
      f.old = f.now;
      f.now = want;
      f.cross = 0.0f;
      f.cross_step = 1.0f / static_cast<float>(cross_samples_);
    }
    line_.read(f.now.delay, left, right);
    f.now.delay += f.now.step;
    if (f.cross < 1.0f) {
      float old_left, old_right;
      line_.read(f.old.delay, &old_left, &old_right);
      f.old.delay += f.old.step;
      const float in_gain = kit::SineTable::lookup(0.25f * f.cross);
      const float out_gain = kit::SineTable::cos_lookup(0.25f * f.cross);
      *left = *left * in_gain + old_left * out_gain;
      *right = *right * in_gain + old_right * out_gain;
      f.cross += f.cross_step;
    }
  }

  // The follower's interval: nothing at zero, the shifter otherwise, and the
  // two crossed over while one takes the other's place.
  void shift(Follower& f, int k, float* left, float* right) {
    f.semis.next();
    const float blend = f.blend.next();
    if (!(blend > 0.0f || f.blend.target > 0.0f)) {
      f.shifting = false;
      return;
    }
    if (!f.shifting) {
      f.shifting = true;
      f.ratio = kit::semitones_to_ratio(f.semis.value);
      f.ratio_step = 0.0f;
      // The splices of follower k fall an eighth of a window after those of
      // the one before, by the device's own count of samples.
      const long long half = window_ / 2;
      const long long into = (run_ - static_cast<long long>(k) * (window_ / 8)) % half;
      f.shifter.restart(static_cast<int>(into <= 0 ? -into : half - into));
    }
    f.ratio += f.ratio_step;
    float shifted_left, shifted_right;
    f.shifter.render(f.ratio, f.target_ratio, &shifted_left, &shifted_right);
    if (blend >= 1.0f) {
      *left = shifted_left;
      *right = shifted_right;
    } else {
      const float in_gain = kit::SineTable::lookup(0.25f * blend);
      const float out_gain = kit::SineTable::cos_lookup(0.25f * blend);
      *left = *left * out_gain + shifted_left * in_gain;
      *right = *right * out_gain + shifted_right * in_gain;
    }
  }

  // The two stretches a display's levels are taken over move on.
  void turn_meters() {
    meter_count_ = 0;
    line_peak_[0] = line_peak_[1];
    line_peak_[1] = 0.0f;
    for (Follower& f : followers_) {
      f.peak[0] = f.peak[1];
      f.peak[1] = 0.0f;
    }
  }

  // Everything settled, nothing sounding (init and wake).
  void restart() {
    clock_.reset(kControlPeriod);
    chunk_ = 0;
    run_ = 0;
    blank_ = 0;
    meter_count_ = 0;
    line_peak_[0] = line_peak_[1] = 0.0f;
    for (int k = 0; k < kVoices; ++k) {
      Follower& f = followers_[k];
      f.fresh = true;
      f.cross = 1.0f;
      f.shifting = false;
      f.semis.snap(f.semis.target);
      f.blend.snap(f.blend.target);
      f.gain_left.snap(f.gain_left.target);
      f.gain_right.snap(f.gain_right.target);
      f.narrow.snap(f.narrow.target);
      f.feed.snap(f.feed.target);
      f.peak[0] = f.peak[1] = 0.0f;
      tone_pole_[k][0].reset();
      tone_pole_[k][1].reset();
    }
    for (int c = 0; c < 2; ++c) {
      back_pole_[c].reset();
      rumble_[c].reset();
      rumble_[c].set_cutoff(kRumbleHz, sample_rate());
    }
    round_.snap(round_.target);
    mix_.snap(mix_.target);
    tone_.snap(tone_.target);
    tone_seen_ = -1.0f;
    mix_seen_ = -1.0f;
    gap_ = kMinGap;
    reach_ = kLongEnough;
  }

  void control() {
    using namespace canon;
    const float sr = sample_rate();
    gap_ = kit::clamp_int(static_cast<int>(param(kGap) * sr + 0.5f), kMinGap, kMaxGap);
    cross_samples_ = static_cast<int>(kit::min(kCrossSeconds * sr, kCrossShare * static_cast<float>(gap_)));
    if (cross_samples_ < 8) cross_samples_ = 8;

    // Which followers are crabs, and how far back the furthest reader gets.
    const int crab = kit::clamp_int(static_cast<int>(param(kCrab) + 0.5f), 0, 3);
    int furthest = 0;
    for (int k = 0; k < kVoices; ++k) {
      Follower& f = followers_[k];
      f.crab = crab == 3 || (crab == 2 && (k & 1) == 1) || (crab == 1 && k == count_ - 1);
      if (k < count_) furthest = (k + (f.crab ? 2 : 1)) * gap_;
      if (f.shifting) {
        const float next = kit::semitones_to_ratio(f.semis.value);
        f.ratio_step = (next - f.ratio) * (1.0f / kControlPeriod);
      }
    }
    // A crossing reads on behind a crab, and a shifter holds its own ring's worth.
    reach_ = static_cast<long>(furthest) + 2 * cross_samples_ + canon_dsp::Shifter::kSize +
             static_cast<long>(0.05f * sr);

    // Tone: one pole per follower; at the top of its range the pole is gone.
    const float tone = tone_.next();
    if (tone != tone_seen_) {
      tone_seen_ = tone;
      const float pole =
          tone >= open_tone_ ? 0.0f : std::exp(-kit::kTwoPi * std::exp(tone) / sr);
      for (int k = 0; k < kVoices; ++k) {
        tone_pole_[k][0].a = pole;
        tone_pole_[k][1].a = pole;
      }
      back_pole_[0].a = pole;
      back_pole_[1].a = pole;
    }
  }

  // How loud each follower is and where it sits: Followers, Fade and Spread.
  void place(bool glide) {
    using namespace canon;
    count_ = kit::clamp_int(static_cast<int>(std::floor(param(kFollowers) + 0.5f)), 1, kVoices);
    const float step_db = -kFadeDb * param(kFade);
    float gains[kVoices];
    float power = 0.0f;
    for (int k = 0; k < count_; ++k) {
      gains[k] = kit::db_to_gain(step_db * static_cast<float>(k));
      power += gains[k] * gains[k];
    }
    // Together as loud as one: followers a gap apart add in power.
    const float together = 1.0f / std::sqrt(power);
    const float spread = param(kSpread);
    for (int k = 0; k < kVoices; ++k) {
      Follower& f = followers_[k];
      if (k >= count_) {
        f.gain_left.set(0.0f, glide);
        f.gain_right.set(0.0f, glide);
        f.feed.set(0.0f, glide);
        continue;
      }
      const float gain = gains[k] * together;
      const float pan = spread * kPlaces[count_ - 1][k];
      float left = 1.0f, right = 1.0f;
      if (pan != 0.0f) {
        kit::pan_gains(pan, &left, &right);
        left *= kSqrtTwo;
        right *= kSqrtTwo;
      }
      f.gain_left.set(gain * left, glide);
      f.gain_right.set(gain * right, glide);
      f.narrow.set(pan < 0.0f ? -pan : pan, glide);
      f.feed.set(k == count_ - 1 ? 1.0f : 0.0f, glide);
    }
  }

  // A follower's interval. From unison the shifter comes in at the interval;
  // between two intervals the pitch glides.
  void tune(int k, bool glide) {
    using namespace canon;
    Follower& f = followers_[k];
    f.interval = static_cast<int>(std::floor(param(kInterval1 + k) + 0.5f));
    if (f.interval == 0) {
      f.blend.set(0.0f, glide);
      f.lead = 0;
      return;
    }
    const float semis = static_cast<float>(f.interval);
    f.semis.set(semis, glide && f.shifting);
    f.blend.set(1.0f, glide);
    f.target_ratio = kit::semitones_to_ratio(semis);
    f.lead = static_cast<int>(f.shifter.latency(f.target_ratio) + 0.5f);
  }

  void apply(int id) {
    using namespace canon;
    // Nothing sounds while asleep, so a value set then has nothing to glide from.
    const bool glide = primed() && !asleep_;
    switch (id) {
      case kFollowers:
      case kFade:
      case kSpread:
        place(glide);
        break;
      case kInterval1:
      case kInterval2:
      case kInterval3:
      case kInterval4:
        tune(id - kInterval1, glide);
        break;
      case kTone:
        open_tone_ = std::log(kParamMax[kTone]);
        tone_.set(std::log(param(kTone)), glide);
        break;
      case kRound:
        round_.set(param(kRound), glide);
        break;
      case kMix:
        mix_.set(param(kMix), glide);
        break;
      default:
        break;  // Gap and Crab are read on the control clock
    }
  }

  canon_dsp::Line<kLineFrames> line_;
  Follower followers_[kVoices];
  kit::OnePole tone_pole_[kVoices][2];
  kit::OnePole back_pole_[2];
  kit::OnePole rumble_[2];
  kit::Smoother round_, mix_, tone_;
  kit::ControlClock clock_;
  int count_ = 1;          // followers that are asked for
  int gap_ = kMinGap;      // the gap in samples
  int chunk_ = 0;          // samples into the gap the crabs count
  int cross_samples_ = 8;
  int window_ = 2400;      // the shifters' window, for their timetable
  long long run_ = 0;      // samples since the device woke
  long blank_ = 0;         // samples since anything above the floor was written
  long reach_ = kLongEnough;
  float open_tone_ = 0.0f;
  float tone_seen_ = -1.0f;
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  bool asleep_ = true;
  // For meter() only: never read by the sound.
  float line_peak_[2] = {0.0f, 0.0f};
  int meter_count_ = 0;
  int meter_window_ = 960;
};

}  // namespace livemix
