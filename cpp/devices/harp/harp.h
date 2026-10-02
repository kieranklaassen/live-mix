#pragma once

// Harp: a concert harp, with koto and guzheng as string types.
//
//   key ─► find the string at that pitch, or take one ─► wait its turn ─► pluck
//
//   per string (up to 32):
//     pluck ─► string loop (comb, loss, stiffness, tuning) ─► pan ─► left, right
//        ▲ halo × (what the other strings played a sample ago)
//
//   left, right ─► DC blocker ─► pick shelf ─► direct ───────────┐
//   (left + right) / 2 ─► six soundboard resonances × Body ──────┴─► volume ─► soft clip
//
// - One string per pitch, and nothing damps it: a note rings on after its key
//   is let go, until it has died away or the string is needed again. Strings
//   are found by pitch, not by the host's note id, so playing a pitch that is
//   still ringing plucks the same string again: the finger lands on it (the
//   string drops 10 dB over 10 ms) and lets it go. When every string is busy
//   the quietest is faded out over 3 ms and retuned.
// - How long a string rings is set by its pitch: bass strings several times
//   longer than treble ones, on a curve per type scaled by Decay. The high
//   partials always die first.
// - Harp is a soft finger pad on flexible gut; Koto and Guzheng are a hard
//   pick with a click, a shelf that lifts the attack, and a pitch that starts
//   a few cents sharp on a hard pluck and settles. Guzheng strings are stiff:
//   their partials are stretched.
// - Bend presses a note sharp after the pluck, upward only: it starts 80 ms
//   in and takes a fifth of a second. Strings that bend or settle read their
//   delay line with an interpolator; the others hold their pitch with an
//   allpass. A string keeps the one it was given until it is retuned.
// - Halo is feedback between the strings that are ringing: each one hears the
//   others and rings where it shares a partial with them. Feedback between
//   resonators as sharp as these would howl at any fixed level, so its gain is
//   worked out from the strings sounding now and held under the level at
//   which the loop could sustain itself (see halo_gain_for).
// - Sweep rolls notes that arrive together into a glissando, low to high.
//   Without it a chord's plucks are still scattered over a few milliseconds.
// - What varies from pluck to pluck (where on the string, how hard, the
//   scatter) comes from the pitch and how often that pitch has been played,
//   so a note sounds the same whatever else is going on.
//
// Strings, Pluck, Touch, Decay and Bend are read when a string is plucked,
// Damp when its key is let go, Sweep when notes arrive; Halo, Body and Volume
// are live. The instrument sleeps once every string has died away.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Harp : public kit::DeviceBase<harp::kNumParams> {
 public:
  static constexpr int kMaxStrings = 32;
  // 4088 samples of line: 23.5 Hz at 96 kHz.
  static constexpr int kLineSize = 4096;
  static constexpr int kNumTypes = 3;
  static constexpr int kBodyModes = 6;
  static constexpr int kControlPeriod = 32;

  // Bend: when the press starts after the pluck and how long it takes.
  static constexpr float kBendDelaySeconds = 0.08f;
  static constexpr float kBendSeconds = 0.22f;
  // How fast a hard pluck's sharpness falls away.
  static constexpr float kSettleSeconds = 0.12f;
  // The share of the level at which the halo loop would sustain itself.
  static constexpr float kHaloMargin = 0.47f;

  // Seconds for the fundamental at `hz` to fall 60 dB at Decay 1. A choice per
  // type, not a measurement: long in the bass, short in the treble.
  static float ring_seconds(int type, float hz) {
    const Type& t = kTypes[kit::clamp_int(type, 0, kNumTypes - 1)];
    return kit::clamp(t.decay_seconds * std::pow(t.decay_hz / kit::max(hz, 1.0f), t.decay_slope), t.decay_min,
                      t.decay_max);
  }

  // The cents a string plucked `seconds` ago stands above its pitch.
  static float bend_cents(float seconds, float bend, float settle) {
    const float x = kit::clamp((seconds - kBendDelaySeconds) / kBendSeconds, 0.0f, 1.0f);
    return settle * std::exp(-seconds / kSettleSeconds) + bend * x * x * (3.0f - 2.0f * x);
  }

  // How much a string resonates: the gain of its loop at the fundamental, for
  // a string at `hz` that rings `seconds`.
  static float resonance(float hz, float seconds) {
    return 1.0f / (1.0f - std::pow(10.0f, -3.0f / kit::max(hz * seconds, 1.0f)));
  }

  // The halo's feedback gain at Halo 1 for strings whose resonances add up to
  // `sum` with the sharpest at `sharpest`. A string answers what it is fed
  // with at most twice its resonance (the pluck comb doubles a partial at an
  // antinode), and every string is fed by all the others, so the loop's gain
  // is at most 2 × gain × (sum + sharpest): this keeps it at kHaloMargin × 2.
  static float halo_gain_for(float sum, float sharpest) { return kHaloMargin / (sum + sharpest); }

  void init(float sample_rate) {
    using namespace harp;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int i = 0; i < kMaxStrings; ++i) {
      String& s = strings_[i];
      s.line.reset();
      s.exciter.stop();
      s.noise.seed(1u);
      s.feed.reset();
      s.feed.set_cutoff(kFeedCutoffHz, sr);
      s.active = false;
      s.held = false;
      s.pending = false;
      s.unscheduled = false;
      s.glide = false;
      s.moving = false;
      s.note_id = -1;
      s.type = 0;
      s.hz = 0.0f;
      s.out = 0.0f;
      s.peak = 0.0f;
      s.level = 0.0f;
      s.left = 0.0f;
      s.right = 0.0f;
      s.duck = 1.0f;
      s.duck_step = 0.0f;
      s.duck_left = 0;
      s.ring = 1.0f;
      s.resonance = 0.0f;
      s.bend = 0.0f;
      s.settle = 0.0f;
      s.age = 0;
      s.next = Next();
    }
    for (int& count : plucks_) count = 0;
    any_unscheduled_ = false;
    bus_ = 0.0f;
    for (int c = 0; c < 2; ++c) {
      dc_[c].reset();
      dc_[c].set_cutoff(kOutputCutoffHz, sr);
      shelf_[c].reset();
      shelf_[c].set_identity();
    }
    for (int m = 0; m < kBodyModes; ++m) board_[m].reset();
    board_type_ = -1;
    board_moving_ = false;
    shelf_db_ = 0.0f;
    shelf_set_db_ = 0.0f;
    halo_.set_time(kSmoothingSeconds, sr);
    halo_.snap(0.0f);
    body_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    level_release_ = kit::time_to_coeff(kLevelSeconds, sr / static_cast<float>(kControlPeriod));
    glide_ = 1.0f - kit::time_to_coeff(kTypeGlideSeconds, sr / static_cast<float>(kControlPeriod));
    clock_.reset(kControlPeriod);
    // Nothing outlives the strings but the soundboard, a few milliseconds.
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    const float sr = sample_rate();
    frequency = kit::clamp(frequency, kLowestHz, kit::min(kHighestHz, 0.1f * sr));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);

    String& s = strings_[string_for(frequency)];
    // What changes from one pluck of this pitch to the next.
    const int key = kit::clamp_int(static_cast<int>(kit::hz_to_midi(frequency) + 0.5f), 0, kNumKeys - 1);
    const uint32_t seed = hash(static_cast<uint32_t>(key) * 2654435761u + static_cast<uint32_t>(plucks_[key]++));
    s.next.note_id = note_id;
    s.next.hz = frequency;
    s.next.gain = gain;
    s.next.released = false;
    s.next.place = unit(seed) * 2.0f - 1.0f;
    s.next.weight = unit(hash(seed + 1u)) * 2.0f - 1.0f;
    s.next.scatter = unit(hash(seed + 2u));
    s.next.seed = hash(seed + 3u) | 1u;
    s.pending = true;
    s.unscheduled = true;
    any_unscheduled_ = true;
  }

  void note_off(int note_id) {
    for (int i = 0; i < kMaxStrings; ++i) {
      String& s = strings_[i];
      if (s.pending && s.next.note_id == note_id) s.next.released = true;
      if (s.held && s.note_id == note_id) release(s);
    }
  }

  void process(int frames) {
    using namespace harp;
    frames = begin_block(frames);
    bool sounding = false;
    for (int i = 0; i < kMaxStrings; ++i) sounding = sounding || strings_[i].active || strings_[i].pending;
    if (!idle_.wake(sounding)) {
      // Asleep, a control lands where it points and the soundboard is the
      // type's in use: the next note starts on them, not on the way to them.
      body_.snap(body_.target);
      volume_.snap(volume_.target);
      board_type_ = -1;
      clock_.reset(kControlPeriod);
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    if (any_unscheduled_) schedule();
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control();

      const float halo = halo_.next();
      const float heard = bus_;
      float bus = 0.0f, left = 0.0f, right = 0.0f;
      for (int v = 0; v < kMaxStrings; ++v) {
        String& s = strings_[v];
        if (s.pending && !s.unscheduled) {
          if (s.next.countdown == s.next.duck_samples && s.active && s.next.duck_samples > 0) {
            s.duck_left = s.next.duck_samples;
            s.duck_step = (s.next.floor - s.duck) / static_cast<float>(s.duck_left);
          }
          if (s.next.countdown <= 0) {
            strike(s);
          } else {
            --s.next.countdown;
          }
        }
        if (!s.active) continue;
        float excitation = s.exciter.active() ? s.exciter.next(s.noise) : 0.0f;
        if (halo > 0.0f) excitation += halo * s.feed.process(heard - s.out);
        const float y = s.line.tick(excitation);
        s.out = y;
        bus += y;
        const float size = y < 0.0f ? -y : y;
        if (size > s.peak) s.peak = size;
        if (s.duck_left > 0) {
          s.duck += s.duck_step;
          if (--s.duck_left == 0) s.duck = s.next.floor;
        }
        const float heard_out = y * s.duck;
        left += heard_out * s.left;
        right += heard_out * s.right;
      }
      bus_ = bus;

      left = shelf_[0].process(dc_[0].process(left));
      right = shelf_[1].process(dc_[1].process(right));
      const float mid = 0.5f * (left + right);
      float board = 0.0f;
      for (int m = 0; m < kBodyModes; ++m) board += mode_[m].gain * board_[m].bandpass(mid);
      const float body = body_.next();
      const float direct = 1.0f - kDirectLoss * body;
      const float wood = kBoardGain * body * board;
      const float volume = volume_.next() * kVoiceGain;
      out_left_[i] = kit::soft_clip((left * direct + wood) * volume);
      out_right_[i] = kit::soft_clip((right * direct + wood) * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  using Line = kit::PluckedString<kLineSize>;

  struct Mode {
    float hz, q, gain;
  };

  // What makes a type: every figure here is a choice (see the manifest's
  // origin note), tuned by measurement.
  struct Type {
    // Ring time of the fundamental: decay_seconds at decay_hz, falling as
    // (decay_hz / f)^decay_slope, kept between decay_min and decay_max.
    float decay_seconds, decay_hz, decay_slope, decay_min, decay_max;
    // The high partials ring this share of that time, measured at high_hz;
    // bass_lift more of it at the bottom, where the strings are wire.
    float high_share, high_hz, bass_lift;
    // The pluck's low-pass at middle C, from the softest touch to the hardest.
    float pick_soft_hz, pick_hard_hz;
    // The click of the pick, at Touch 0 and at Touch 1.
    float click_soft, click_hard;
    // Inharmonicity and the allpasses that make it.
    float stiffness;
    int stiff_stages;
    // What lifts a plectrum's attack above an ideal pluck's 1/n partials.
    float shelf_db;
    // Cents sharp at the start of the hardest pluck.
    float settle_cents;
    // Whether its strings read their line with the interpolator.
    bool glide;
    // Evens out the types: a plectrum's attack peaks far above its body.
    float level;
    Mode board[kBodyModes];
  };

  static constexpr Type kTypes[kNumTypes] = {
      // Harp: gut and nylon, a finger pad, a long tapered soundboard.
      {12.0f, 32.7f, 0.72f, 0.3f, 14.0f, 0.22f, 3000.0f, 0.6f, 450.0f, 8000.0f, 0.0f, 0.1f, 0.0f, 0, 0.0f, 0.0f,
       false, 1.0f,
       {{180.0f, 1.4f, 1.0f}, {310.0f, 1.6f, 0.85f}, {480.0f, 1.8f, 0.7f}, {760.0f, 2.0f, 0.6f},
        {1150.0f, 2.0f, 0.5f}, {1800.0f, 2.2f, 0.4f}}},
      // Koto: a dry string under a hard pick, a hollow box.
      {2.2f, 261.63f, 0.5f, 0.3f, 8.0f, 0.3f, 3000.0f, 0.0f, 2600.0f, 11000.0f, 0.12f, 0.5f, 0.0f, 0, 13.0f, 12.0f,
       true, 0.6f,
       {{170.0f, 3.5f, 1.0f}, {290.0f, 4.0f, 1.0f}, {430.0f, 4.0f, 0.8f}, {700.0f, 2.5f, 0.4f},
        {1300.0f, 2.5f, 0.3f}, {2400.0f, 2.5f, 0.3f}}},
      // Guzheng: wound steel, longer and brighter, a larger box.
      {4.5f, 261.63f, 0.5f, 0.5f, 14.0f, 0.3f, 3000.0f, 0.0f, 2600.0f, 11000.0f, 0.12f, 0.5f, 1.2e-4f, 1, 9.0f,
       8.0f, true, 0.55f,
       {{150.0f, 3.5f, 1.0f}, {255.0f, 4.0f, 1.0f}, {390.0f, 4.0f, 0.8f}, {650.0f, 2.5f, 0.4f},
        {1200.0f, 2.5f, 0.3f}, {2200.0f, 2.5f, 0.3f}}},
  };

  static constexpr int kNumKeys = 128;
  static constexpr float kLowestHz = 24.0f;
  static constexpr float kHighestHz = 4200.0f;
  static constexpr float kMiddleCHz = 261.63f;
  // Two keys this close share a string (a quarter tone).
  static constexpr float kSameStringRatio = 1.0293f;
  // A finger landing on a ringing string: how long, and what it leaves.
  static constexpr float kRepluckSeconds = 0.01f;
  static constexpr float kRepluckFloor = 0.3f;
  // A string taken for another pitch fades out first.
  static constexpr float kStealSeconds = 0.003f;
  // A chord's plucks are never on one sample.
  static constexpr float kScatterSeconds = 0.004f;
  // Damp 1 stops a string in this long.
  static constexpr float kDampedSeconds = 0.1f;
  // A string this quiet (about -100 dB under a full pluck) is let go.
  static constexpr float kSilence = 1.0e-5f;
  // Above kTopHz the high partials' share of the ring time rises to kTopShare.
  static constexpr float kTopHz = 900.0f;
  static constexpr float kTopSpanHz = 1200.0f;
  static constexpr float kTopShare = 0.6f;
  static constexpr float kLevelSeconds = 0.08f;
  static constexpr float kFeedCutoffHz = 20.0f;
  static constexpr float kOutputCutoffHz = 8.0f;
  static constexpr float kShelfHz = 1800.0f;
  static constexpr float kTypeGlideSeconds = 0.03f;
  // Strings spread across the middle half of the field, low notes left.
  static constexpr float kPanWidth = 0.5f;
  static constexpr float kPanSemitones = 30.0f;
  // Body: what the direct strings give up and what the resonances add.
  static constexpr float kDirectLoss = 0.35f;
  static constexpr float kBoardGain = 0.55f;
  // One key at gain 0.8 peaks near -19 dBFS at the default volume.
  static constexpr float kVoiceGain = 0.17f;

  struct Next {
    int note_id = -1;
    float hz = 0.0f;
    float gain = 0.0f;
    bool released = false;
    // -1..1, -1..1, 0..1 and a seed: this pluck's place, weight, scatter and click.
    float place = 0.0f;
    float weight = 0.0f;
    float scatter = 0.0f;
    uint32_t seed = 1u;
    // Samples until the pluck, how many of the last of them the string ducks
    // for, and where the duck ends.
    int countdown = 0;
    int duck_samples = 0;
    float floor = 0.0f;
  };

  struct String {
    Line line;
    kit::PluckExciter exciter;
    kit::Rng noise;
    kit::DcBlocker feed;
    bool active = false;       // ringing
    bool held = false;         // its key is down
    bool pending = false;      // a pluck is waiting
    bool unscheduled = false;  // and has not been given its time yet
    bool glide = false;        // reads its line with the interpolator
    bool moving = false;       // bending or settling
    int note_id = -1;
    int type = 0;
    float hz = 0.0f;
    float out = 0.0f;
    float peak = 0.0f;
    float level = 0.0f;
    float left = 0.0f, right = 0.0f;
    float duck = 1.0f;
    float duck_step = 0.0f;
    int duck_left = 0;
    float ring = 1.0f;       // seconds the fundamental rings as it is set now
    float resonance = 0.0f;  // see resonance()
    float bend = 0.0f;
    float settle = 0.0f;
    int age = 0;  // control ticks since the pluck
    Next next;
  };

  static uint32_t hash(uint32_t x) {
    x ^= x >> 16;
    x *= 0x7feb352du;
    x ^= x >> 15;
    x *= 0x846ca68bu;
    x ^= x >> 16;
    return x;
  }
  static float unit(uint32_t x) { return static_cast<float>(x >> 8) * (1.0f / 16777216.0f); }

  // The type the Strings parameter selects now.
  int type_in_use() const {
    return kit::clamp_int(static_cast<int>(param(harp::kStrings) + 0.5f), 0, kNumTypes - 1);
  }

  static bool same_pitch(float a, float b) { return a < b * kSameStringRatio && b < a * kSameStringRatio; }

  // The string a note at `hz` is played on: the one already at that pitch,
  // else an idle one, else the quietest with no pluck waiting, else the
  // quietest.
  int string_for(float hz) const {
    int idle = -1, quiet = -1, any = -1;
    for (int i = 0; i < kMaxStrings; ++i) {
      const String& s = strings_[i];
      if (s.pending ? same_pitch(s.next.hz, hz) : (s.active && same_pitch(s.hz, hz))) return i;
      if (!s.active && !s.pending) {
        if (idle < 0) idle = i;
      } else if (!s.pending) {
        if (quiet < 0 || s.level < strings_[quiet].level) quiet = i;
      }
      if (any < 0 || s.level < strings_[any].level) any = i;
    }
    return idle >= 0 ? idle : (quiet >= 0 ? quiet : any);
  }

  // Gives the plucks that arrived since the last block their times: together,
  // or rolled from the lowest to the highest over Sweep.
  void schedule() {
    any_unscheduled_ = false;
    int order[kMaxStrings];
    int count = 0;
    for (int i = 0; i < kMaxStrings; ++i) {
      if (!strings_[i].unscheduled) continue;
      int at = count++;
      while (at > 0 && strings_[order[at - 1]].next.hz > strings_[i].next.hz) {
        order[at] = order[at - 1];
        --at;
      }
      order[at] = i;
    }
    const float sr = sample_rate();
    const float sweep = param(harp::kSweep) * sr;
    const float gap = count > 1 ? sweep / static_cast<float>(count - 1) : 0.0f;
    const float scatter = count > 1 ? (gap > 0.0f ? kit::min(kScatterSeconds * sr, 0.25f * gap) : kScatterSeconds * sr)
                                    : 0.0f;
    for (int n = 0; n < count; ++n) {
      String& s = strings_[order[n]];
      const bool again = s.active && same_pitch(s.hz, s.next.hz);
      s.next.duck_samples = !s.active ? 0 : static_cast<int>((again ? kRepluckSeconds : kStealSeconds) * sr);
      s.next.floor = again ? kRepluckFloor : 0.0f;
      const int at = static_cast<int>(static_cast<float>(n) * gap + s.next.scatter * scatter);
      s.next.countdown = at > s.next.duck_samples ? at : s.next.duck_samples;
      s.unscheduled = false;
    }
  }

  // The pluck: what is left of the string is what the finger left, or the
  // string is new; then its type, pitch, decay and the excitation.
  void strike(String& s) {
    using namespace harp;
    const float sr = sample_rate();
    const Next& next = s.next;
    const int type_index = type_in_use();
    const Type& type = kTypes[type_index];
    const float bend = param(kBend);
    const bool again = s.active && same_pitch(s.hz, next.hz);
    if (again) {
      s.line.damp(s.duck);
    } else {
      s.line.reset();
      s.glide = type.glide || bend > 0.0f;
      s.line.set_tuning(s.glide ? Line::Tuning::Interpolated : Line::Tuning::Allpass);
      s.feed.reset();
      s.out = 0.0f;
      s.peak = 0.0f;
      s.level = 0.0f;
    }
    s.duck = 1.0f;
    s.duck_step = 0.0f;
    s.duck_left = 0;
    s.exciter.stop();
    s.type = type_index;
    s.hz = next.hz;
    s.note_id = next.note_id;
    s.pending = false;

    const float touch = param(kTouch);
    // Velocity is loudness, and a harder pluck is also a brighter one.
    const float amplitude =
        type.level * (0.15f + 0.85f * next.gain * std::sqrt(next.gain)) * kit::db_to_gain(next.weight);
    s.bend = s.glide ? bend : 0.0f;
    s.settle = s.glide ? type.settle_cents * next.gain * next.gain * (0.4f + 0.6f * touch) : 0.0f;
    s.age = 0;
    s.moving = s.bend > 0.0f || s.settle > 0.0f;

    s.ring = ring_seconds(type_index, s.hz) * param(kDecay);
    set_decay(s, s.ring);
    s.line.set_stiffness(type.stiffness, type.stiff_stages);
    s.line.set_pluck_position(kit::clamp(param(kPluck) * (1.0f + 0.03f * next.place), 0.02f, 0.5f));
    s.line.set_frequency(s.hz * kit::cents_to_ratio(bend_cents(0.0f, s.bend, s.settle)), sr);

    // A finger or pick is as wide on a short string as on a long one, so the
    // pluck's low-pass follows the pitch a little, and never sits under it.
    const float pick = type.pick_soft_hz * std::pow(type.pick_hard_hz / type.pick_soft_hz, touch) *
                       (0.45f + 1.1f * next.gain) * std::pow(s.hz / kMiddleCHz, 0.4f);
    s.noise.seed(next.seed);
    s.exciter.strike(amplitude, s.hz, kit::max(pick, 1.5f * s.hz), kit::lerp(type.click_soft, type.click_hard, touch),
                     sr);

    float pan_left, pan_right;
    kit::pan_gains(kPanWidth * kit::clamp((kit::hz_to_midi(s.hz) - 60.0f) / kPanSemitones, -1.0f, 1.0f), &pan_left,
                   &pan_right);
    s.left = pan_left;
    s.right = pan_right;
    if (amplitude > s.level) s.level = amplitude;
    s.active = true;
    s.held = true;
    if (next.released) release(s);
  }

  // How long the string rings from now on, with its type's darkening.
  void set_decay(String& s, float seconds) {
    const Type& type = kTypes[s.type];
    const float lift = 1.0f + type.bass_lift * kit::clamp((130.0f - s.hz) / 65.0f, 0.0f, 1.0f);
    // At the top the loop's one filter cannot take much off the octave above
    // without taking the note with it: the highs are let ring nearer to it.
    const float share = kit::lerp(type.high_share * lift, kit::max(type.high_share, kTopShare),
                                  kit::clamp((s.hz - kTopHz) / kTopSpanHz, 0.0f, 1.0f));
    s.line.set_decay(seconds, seconds * share, type.high_hz);
    // At the highest pitch it will reach: a bent string keeps its ring time,
    // so it resonates more sharply than the same string unbent.
    s.resonance = resonance(s.hz * kit::cents_to_ratio(s.bend + s.settle), seconds);
  }

  // Key up: Damp decides how much of a hand comes down on the string.
  void release(String& s) {
    s.held = false;
    const float damp = param(harp::kDamp);
    if (damp <= 0.0f || !s.active) return;
    const float damped = s.ring * std::pow(kDampedSeconds / kit::max(s.ring, kDampedSeconds), damp);
    if (damped < s.ring) {
      s.ring = damped;
      set_decay(s, damped);
    }
  }

  // Every 32 samples: bends, levels, letting quiet strings go, the halo's
  // gain, and the soundboard and shelf of the type in use.
  void control() {
    using namespace harp;
    const float sr = sample_rate();
    const float tick = static_cast<float>(kControlPeriod) / sr;
    float sum = 0.0f, sharpest = 0.0f;
    int ringing = 0;
    for (int i = 0; i < kMaxStrings; ++i) {
      String& s = strings_[i];
      if (!s.active) continue;
      s.level = kit::max(s.peak, s.level * level_release_);
      s.peak = 0.0f;
      if (s.level < kSilence && !s.pending && !s.exciter.active()) {
        s.active = false;
        s.held = false;
        s.moving = false;
        s.out = 0.0f;
        continue;
      }
      if (s.moving) {
        const float seconds = static_cast<float>(++s.age) * tick;
        float cents = bend_cents(seconds, s.bend, s.settle);
        if (seconds >= kBendDelaySeconds + kBendSeconds && cents - s.bend < 0.02f) {
          cents = s.bend;
          s.moving = false;
        }
        s.line.set_frequency(s.hz * kit::cents_to_ratio(cents), sr);
      }
      sum += s.resonance;
      if (s.resonance > sharpest) sharpest = s.resonance;
      ++ringing;
    }
    halo_.set_target(ringing > 1 ? param(kHalo) * halo_gain_for(sum, sharpest) : 0.0f);

    const int type_index = type_in_use();
    const Type& type = kTypes[type_index];
    const bool snap = board_type_ < 0;
    if (snap || board_type_ != type_index || board_moving_) {
      board_type_ = type_index;
      board_moving_ = false;
      for (int m = 0; m < kBodyModes; ++m) {
        const Mode& to = type.board[m];
        Mode& now = mode_[m];
        if (snap) {
          now = to;
        } else {
          now.hz += (to.hz - now.hz) * glide_;
          now.q += (to.q - now.q) * glide_;
          now.gain += (to.gain - now.gain) * glide_;
          if (std::fabs(to.hz - now.hz) > 0.01f * to.hz) {
            board_moving_ = true;
          } else {
            now = to;
          }
        }
        board_[m].set(now.hz, now.q, sr);
      }
      shelf_db_ = board_moving_ ? shelf_db_ + (type.shelf_db - shelf_db_) * glide_ : type.shelf_db;
      if (shelf_db_ != shelf_set_db_) {
        shelf_set_db_ = shelf_db_;
        for (int c = 0; c < 2; ++c) {
          if (shelf_db_ == 0.0f) {
            shelf_[c].set_identity();
          } else {
            shelf_[c].set_high_shelf(kShelfHz, shelf_db_, sr);
          }
        }
      }
    }
  }

  void apply(int id) {
    using namespace harp;
    switch (id) {
      case kBody:
        body_.set(param(id), primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(param(id)), primed());
        break;
      default:
        break;  // read at the pluck, at key-up or on the control clock
    }
  }

  String strings_[kMaxStrings];
  int plucks_[kNumKeys] = {};
  bool any_unscheduled_ = false;
  float bus_ = 0.0f;
  kit::DcBlocker dc_[2];
  kit::Biquad shelf_[2];
  kit::Svf board_[kBodyModes];
  Mode mode_[kBodyModes] = {};
  int board_type_ = -1;
  bool board_moving_ = false;
  float shelf_db_ = 0.0f;
  float shelf_set_db_ = 0.0f;
  float level_release_ = 0.0f;
  float glide_ = 1.0f;
  kit::Smoother halo_, body_, volume_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
};

}  // namespace livemix
