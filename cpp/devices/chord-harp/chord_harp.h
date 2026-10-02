#pragma once

// Chord Harp: an electronic chord harp with a strum plate.
//
//   keys held ─► the chord ─► plate: its notes over Span octaves, low to high
//        │                        │
//        │ each press             ▼
//        └──────────────► sweep: one string after another, a finger's
//                         unevenness in time and level
//                                 │ pluck
//                                 ▼
//   32 strings: pulse + octave chime ─► low-pass ─► decay ─► pan ─┐
//   pad: a soft square per held key, while it is down ────────────┴─► volume ─► soft clip
//
// - The keys held are the chord. The plate is every held key's pitch class in
//   each of Span octaves above the lowest held key, plus that key once more
//   on top: C E G with three octaves is ten strings, C3 to C6. A string is an
//   octave copy of the key's own frequency, so no tuning grid is assumed.
// - Each key press sweeps the plate, one string every Strum milliseconds: Up,
//   Down, Up Down (there and back) or Random. Keys pressed within 30 ms of the
//   sweep's start join it instead of starting another, so a chord played by
//   hand is one sweep. A key pressed later starts the sweep again on the
//   chord then held; the strings already ringing are left alone.
// - The sweep is a finger, not a clock: each gap is the Strum time give or
//   take 15 %, each pluck within 1.5 dB of the last, from a generator seeded
//   in init(). It is counted in samples, so the host's block size is not
//   heard.
// - With Strum at zero a key press is one pluck at that key.
// - A string is a 30 % pulse with a sine an octave above it that dies three
//   times as fast (the chime on the attack), through a low-pass that follows
//   the key a little. It rises in 2 ms and then decays: 60 dB in the Sustain
//   time, whether or not a key is still down. Plucking a string that still
//   rings plucks the same string again.
// - The pulse is built from band-limited impulse trains, so it has no
//   harmonic above 20 kHz (or 0.45 of the sample rate) and nothing folds
//   back: the top strings are as clean as the low ones.
// - The pad is the held chord as soft squares (the first three odd
//   harmonics), one per key, there only while the key is down. Its voices
//   are also the record of which keys are held.
//
// Strum is read at each pluck, Direction when a sweep starts, Span when a key
// is pressed, Spread at each pluck; Sustain, Tone, Pad and Volume are live.
// The instrument sleeps when no string rings and no pad sounds.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class ChordHarp : public kit::DeviceBase<chord_harp::kNumParams> {
 public:
  // String voices, and the most strings a plate holds.
  static constexpr int kMaxStrings = 32;
  // Held keys, each with its pad voice.
  static constexpr int kMaxKeys = 12;
  // The top edge of the plate: no string above this, and a key above it is
  // played octaves lower. About the top of a piano; lower where the sample
  // rate could not carry it.
  static constexpr float kTopHz = 4300.0f;
  // Keys pressed this soon after a sweep starts join it.
  static constexpr float kGatherSeconds = 0.03f;
  // The finger: how far a gap and a level stray from the set value.
  static constexpr float kGapJitter = 0.15f;
  static constexpr float kLevelJitterDb = 1.5f;
  // Under this Strum time (ms) a key is a single pluck.
  static constexpr float kSingleBelowMs = 0.5f;

  enum Direction : int { kUp = 0, kDown, kUpDown, kRandom };

  void init(float sample_rate) {
    using namespace chord_harp;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    kit::SineTable::init();
    keys_.reset();
    for (int k = 0; k < kMaxKeys; ++k) {
      Key& key = keys_.voices[k];
      key = Key();
      key.env.set_sample_rate(sr);
      key.env.set(kPadAttackSeconds, 0.01f, 1.0f, kPadReleaseSeconds);
    }
    for (int v = 0; v < kMaxStrings; ++v) strings_[v] = String();
    strings_on_ = 0;
    plate_count_ = 0;
    classes_ = 1;
    sweeping_ = false;
    wait_ = 0.0f;
    cursor_ = 0.0f;
    heading_ = 1;
    turn_ = false;
    random_ = false;
    random_left_ = 0;
    since_start_ = 0;
    sweep_velocity_ = 0.0f;
    finger_.seed(0x0C40DA27u);
    attack_samples_ = static_cast<int>(kAttackSeconds * sr);
    if (attack_samples_ < 2) attack_samples_ = 2;
    gather_samples_ = static_cast<long>(kGatherSeconds * sr);
    top_hz_ = kit::min(kTopHz, 0.45f * sr);
    harmonic_limit_ = kit::min(kHarmonicLimitHz, 0.45f * sr) / sr;
    leak_ = 1.0f - kit::kTwoPi * kLeakHz / sr;
    tone_.set_time(0.02f, sr / static_cast<float>(kControlPeriod));
    pad_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    clock_.reset(kControlPeriod);
    // Nothing here is silent and still to come: a sweep in progress keeps
    // the gate open itself.
    idle_.reset(sr, 0.05f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    using namespace chord_harp;
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, 16.0f, 20000.0f);
    while (frequency > top_hz_) frequency *= 0.5f;
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    const float sr = sample_rate();

    // The key joins the chord and its pad voice opens. A key pressed again
    // while it is down keeps its voice.
    int slot = keys_.find_held(note_id);
    if (slot < 0) {
      bool stolen = false;
      slot = keys_.note_on(note_id, &stolen);
      // A voice taken from another key runs on from where it is: no click.
      if (!stolen) keys_.voices[slot].phase = 0.0f;
    }
    Key& key = keys_.voices[slot];
    key.hz = frequency;
    key.increment = frequency / sr;
    key.gain = 0.6f + 0.4f * gain;
    key.third = 3.0f * key.increment < 0.45f ? kPadThird : 0.0f;
    key.fifth = 5.0f * key.increment < 0.45f ? kPadFifth : 0.0f;
    key.env.gate_on();

    const float velocity = 0.25f + 0.75f * gain;
    if (param(kStrum) < kSingleBelowMs) {
      sweeping_ = false;
      const float place = kit::clamp(std::log2(frequency / kMiddleHz) * 0.5f, -1.0f, 1.0f);
      pluck(frequency, place, kSingleLevel * velocity);
      return;
    }

    const int strings_before = plate_count_;
    build_plate();
    if (sweeping_ && since_start_ < gather_samples_ && has_next()) {
      // Part of the chord being swept: the sweep goes on over the new plate.
      if (velocity > sweep_velocity_) sweep_velocity_ = velocity;
      if (random_ && plate_count_ > strings_before) random_left_ += plate_count_ - strings_before;
      return;
    }
    const int direction = static_cast<int>(param(kDirection) + 0.5f);
    heading_ = direction == kDown ? -1 : 1;
    turn_ = direction == kUpDown;
    random_ = direction == kRandom;
    random_left_ = plate_count_;
    cursor_ = heading_ > 0 ? 0.0f : kBeyondHz;
    wait_ = 0.0f;
    since_start_ = 0;
    sweep_velocity_ = velocity;
    sweeping_ = plate_count_ > 0;
  }

  // The key leaves the chord and its pad voice closes. Strings it plucked
  // ring on, and a sweep in progress finishes on the chord it was given.
  void note_off(int note_id) {
    const int slot = keys_.find_held(note_id);
    if (slot < 0) return;
    if (pad_silent()) {
      keys_.voices[slot].env.reset();  // nothing to fade
    } else {
      keys_.voices[slot].env.gate_off();
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    const bool sounding =
        sweeping_ || strings_on_ > 0 || (!pad_silent() && keys_.count_active() > 0);
    if (!idle_.wake(sounding)) {
      rest();
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control();
      if (sweeping_) advance_sweep();

      float left = 0.0f;
      float right = 0.0f;
      for (int v = 0; v < kMaxStrings; ++v) {
        if (strings_[v].on) render(strings_[v], &left, &right);
      }

      const float pad_level = pad_.next();
      float pad = 0.0f;
      for (int k = 0; k < kMaxKeys; ++k) {
        Key& key = keys_.voices[k];
        if (!key.env.active()) continue;
        const float envelope = key.env.next();
        // With Pad at zero the envelopes still run (they are the keys); the
        // oscillators wait.
        if (pad_level > 0.0f) {
          key.phase += key.increment;
          if (key.phase >= 1.0f) key.phase -= 1.0f;
          // The third and fifth harmonics from the first: sin 3x and sin 5x
          // as polynomials in sin x.
          const float s = kit::SineTable::lookup(key.phase);
          const float s2 = s * s;
          pad += s * (1.0f + key.third * (3.0f - 4.0f * s2) + key.fifth * (5.0f + s2 * (16.0f * s2 - 20.0f))) *
                 envelope * key.gain;
        }
      }
      pad *= pad_level * kPadGain;

      const float volume = volume_.next();
      out_left_[i] = kit::soft_clip((left + pad) * volume);
      out_right_[i] = kit::soft_clip((right + pad) * volume);
    }
    idle_.settle(output_peak(frames), frames);
    if (!sounding) rest();
  }

 private:
  static constexpr int kControlPeriod = 32;
  static constexpr float kAttackSeconds = 0.002f;
  static constexpr float kStealSeconds = 0.002f;
  static constexpr float kPulseWidth = 0.3f;
  // The pulse has no harmonic above this (or above 0.45 of the sample rate).
  static constexpr float kHarmonicLimitHz = 20000.0f;
  // The pulse is a running sum; this leak keeps the sum centred.
  static constexpr float kLeakHz = 4.0f;
  // The chime: a sine an octave up, this loud against the pulse at the pluck
  // and in step with the pulse's own second harmonic, which it lifts.
  static constexpr float kChimeLevel = 0.3f;
  static constexpr float kChimeFloor = 1.0e-3f;
  // Tone: the low-pass corner at middle C, from Tone 0 to Tone 1. A string's
  // corner follows its pitch by this power and never comes under this many
  // times its fundamental, so the darkest setting is soft at every pitch
  // rather than silent at the top.
  static constexpr float kToneLowHz = 300.0f;
  static constexpr float kToneSpan = 50.0f;  // Tone 1 is 15 kHz
  static constexpr float kKeyTracking = 0.3f;
  static constexpr float kMinCornerRatio = 1.2f;
  static constexpr float kMiddleHz = 261.626f;
  // Two strings closer than 5 cents are the same string.
  static constexpr float kSameString = 1.0029f;
  static constexpr float kBeyondHz = 1.0e9f;
  static constexpr float kSilence = 1.0e-5f;
  static constexpr float kSixtyDb = 6.907755279f;
  // How far Spread 1 puts the ends of the plate from the centre.
  static constexpr float kMaxPan = 0.9f;
  // A single pluck at gain 0.7 peaks near -20 dBFS at the default volume and
  // a key swept over three octaves a little above it. Single plucks add up
  // (five keys together reach -7 dBFS); a sweep is scaled by the size of its
  // chord instead, so it is as loud for ten keys as for three.
  static constexpr float kSingleLevel = 0.27f;
  static constexpr float kSweepLevel = 0.145f;
  // The pad: a square's first three harmonics, the upper two softened.
  static constexpr float kPadThird = 0.19f;
  static constexpr float kPadFifth = 0.07f;
  static constexpr float kPadGain = 0.3f;
  static constexpr float kPadAttackSeconds = 0.08f;
  static constexpr float kPadReleaseSeconds = 0.3f;

  // A pulse wave with a fixed number of harmonics: one band-limited impulse
  // train for the rising edge, one for the falling edge, summed over time.
  // A train is the closed form of 1 + 2 cos x + ... + 2 cos nx, which is
  // sin((2n + 1) x / 2) / sin(x / 2): nothing above the n-th harmonic, so
  // nothing to fold back. Both sines turn by a fixed angle each sample, so
  // they are kept as rotating pairs, in double so that the two stay in step
  // for as long as a string rings. High for `width` of the cycle, 2 from
  // bottom to top, no DC.
  struct Pulse {
    static constexpr double kPi = 3.14159265358979323846;
    static constexpr double kEdge = 1.0e-9;

    // sin and cos of half the phase angle, and of `terms` times that.
    double sin_one = 0.0, cos_one = 1.0;
    double sin_all = 0.0, cos_all = 1.0;
    // What a sample turns them by.
    double step_sin_one = 0.0, step_cos_one = 1.0;
    double step_sin_all = 0.0, step_cos_all = 1.0;
    // The falling edge is `width` of a cycle behind: the same pairs turned back.
    double back_sin_one = 0.0, back_cos_one = 1.0;
    double back_sin_all = 0.0, back_cos_all = 1.0;
    // Where the peak of the second harmonic sits, for the chime.
    double octave_sin = 0.0, octave_cos = 1.0;
    double terms = 3.0;  // 2n + 1
    double scale = 0.0;  // makes one train sum to 1 over a cycle
    double leak = 1.0;   // keeps the running sum centred
    double sum = 0.0;

    // `limit` is the highest harmonic allowed, as a fraction of the sample
    // rate. Starts on the rising edge.
    void start(float increment, float width, float limit, float leak_) {
      const int harmonics = static_cast<int>(limit / increment);
      terms = static_cast<double>(2 * (harmonics < 1 ? 1 : harmonics) + 1);
      scale = terms * increment;
      leak = leak_;
      sin_one = sin_all = 0.0;
      cos_one = cos_all = 1.0;
      step_sin_one = std::sin(kPi * increment);
      step_cos_one = std::cos(kPi * increment);
      step_sin_all = std::sin(kPi * terms * increment);
      step_cos_all = std::cos(kPi * terms * increment);
      back_sin_one = std::sin(kPi * width);
      back_cos_one = std::cos(kPi * width);
      back_sin_all = std::sin(kPi * terms * width);
      back_cos_all = std::cos(kPi * terms * width);
      // The second harmonic peaks in the middle of the high part; the running
      // sum is half a sample ahead of the phase.
      octave_sin = std::sin(2.0 * kPi * (increment - width));
      octave_cos = std::cos(2.0 * kPi * (increment - width));
      // Halfway up the edge once this sample's share is added.
      sum = 0.5 - width - 0.5 * scale;
    }

    // A sine an octave above the pulse, in step with its second harmonic.
    // Read before next().
    float octave() const {
      const double sin_two = 2.0 * sin_one * cos_one, cos_two = 1.0 - 2.0 * sin_one * sin_one;
      const double sin_four = 2.0 * sin_two * cos_two, cos_four = 1.0 - 2.0 * sin_two * sin_two;
      return static_cast<float>(cos_four * octave_cos - sin_four * octave_sin);
    }

    float next() {
      // Each train is above / (terms · below); on its edge it is 1.
      const double rise_below = sin_one, rise_above = sin_all;
      const double fall_below = sin_one * back_cos_one - cos_one * back_sin_one;
      const double fall_above = sin_all * back_cos_all - cos_all * back_sin_all;
      double edges;
      if (std::fabs(rise_below) > kEdge && std::fabs(fall_below) > kEdge) {
        // The rising train less the falling one, over one division.
        edges = (rise_above * fall_below - fall_above * rise_below) / (terms * rise_below * fall_below);
      } else {
        edges = (std::fabs(rise_below) > kEdge ? rise_above / (terms * rise_below) : 1.0) -
                (std::fabs(fall_below) > kEdge ? fall_above / (terms * fall_below) : 1.0);
      }
      sum = sum * leak + scale * edges;

      const double next_sin_one = sin_one * step_cos_one + cos_one * step_sin_one;
      cos_one = cos_one * step_cos_one - sin_one * step_sin_one;
      sin_one = next_sin_one;
      const double next_sin_all = sin_all * step_cos_all + cos_all * step_sin_all;
      cos_all = cos_all * step_cos_all - sin_all * step_sin_all;
      sin_all = next_sin_all;
      return static_cast<float>(2.0 * sum);
    }
  };

  // One string of the plate, sounding.
  struct String {
    Pulse pulse;
    kit::Svf filter;
    float hz = 0.0f;         // the pitch it plays, or will once a steal has faded
    float tracking = 1.0f;   // how far its corner sits from middle C's
    float level = 0.0f;      // the envelope
    float chime_env = 0.0f;  // the chime's own, on top of the envelope
    float gain_left = 0.0f, gain_right = 0.0f;
    // The attack: a ramp to these over the attack time.
    float peak = 0.0f, pan_left = 0.0f, pan_right = 0.0f;
    float level_step = 0.0f, chime_step = 0.0f, left_step = 0.0f, right_step = 0.0f;
    int attack_left = 0;
    // A steal: fade out, then start the pluck held in peak and pan.
    float fade_step = 0.0f;
    int fade_left = 0;
    bool on = false;

    // How loud it is for stealing: a string still rising counts as arrived.
    float loudness() const { return attack_left > 0 ? peak : level; }
  };

  // A held key: its place in the chord and its pad voice.
  struct Key {
    kit::Adsr env;
    float hz = 0.0f;
    float increment = 0.0f;
    float phase = 0.0f;
    float gain = 0.0f;
    float third = 0.0f, fifth = 0.0f;  // the upper harmonics, where they fit

    bool active() const { return env.active(); }
    bool releasing() const { return env.releasing(); }
    float level() const { return env.level(); }
  };

  static bool same_string(float a, float b) { return a < b * kSameString && b < a * kSameString; }

  float corner_for(float tone) const { return kToneLowHz * std::pow(kToneSpan, tone); }

  void tune(String& string) {
    const float sr = sample_rate();
    const float corner = kit::max(corner_ * string.tracking, kMinCornerRatio * string.hz);
    string.filter.set(kit::min(corner, 0.45f * sr), kit::kSqrtHalf, sr);
  }

  // The plate: the held keys' pitch classes in each of Span octaves above the
  // lowest held key, and that key once more on top. Ascending, at most
  // kMaxStrings, nothing above the top edge.
  void build_plate() {
    float low = kBeyondHz;
    for (int k = 0; k < kMaxKeys; ++k) {
      const Key& key = keys_.voices[k];
      if (key.active() && !key.releasing() && key.hz < low) low = key.hz;
    }
    if (low >= kBeyondHz) return;  // no key held: the plate stays as it was

    // Each key brought into the octave above the lowest one by a power of two
    // (exact in floating point), sorted, one per pitch class.
    float classes[kMaxKeys];
    int count = 0;
    classes[count++] = low;
    for (int k = 0; k < kMaxKeys; ++k) {
      const Key& key = keys_.voices[k];
      if (!key.active() || key.releasing()) continue;
      float hz = key.hz;
      while (hz >= 2.0f * low) hz *= 0.5f;
      // A hair under the octave is the lowest key's own class.
      if (hz * kSameString > 2.0f * low) hz *= 0.5f;
      bool known = false;
      for (int c = 0; c < count; ++c) known = known || same_string(classes[c], hz);
      if (known) continue;
      int at = count++;
      while (at > 1 && classes[at - 1] > hz) {
        classes[at] = classes[at - 1];
        --at;
      }
      classes[at] = hz;
    }
    classes_ = count;

    const int octaves = 1 + static_cast<int>(param(chord_harp::kSpan) + 0.5f);
    plate_count_ = 0;
    float octave = 1.0f;
    for (int o = 0; o <= octaves; ++o) {
      // The last pass adds only the lowest key's class, the top of the plate.
      const int classes_here = o < octaves ? count : 1;
      for (int c = 0; c < classes_here; ++c) {
        const float hz = classes[c] * octave;
        if (hz > top_hz_ || plate_count_ == kMaxStrings) return;
        plate_[plate_count_++] = hz;
      }
      octave *= 2.0f;
    }
  }

  // The next string in one direction beyond the cursor, or -1.
  int find(int heading) const {
    if (heading > 0) {
      for (int s = 0; s < plate_count_; ++s) {
        if (plate_[s] > cursor_ * kSameString) return s;
      }
    } else {
      for (int s = plate_count_ - 1; s >= 0; --s) {
        if (plate_[s] * kSameString < cursor_) return s;
      }
    }
    return -1;
  }

  bool has_next() const {
    if (random_) return random_left_ > 0 && plate_count_ > 0;
    return find(heading_) >= 0 || (turn_ && find(-1) >= 0);
  }

  // The string the sweep plucks now, or -1 when it is over. An Up Down sweep
  // turns round at the top.
  int next_string() {
    if (random_) {
      if (random_left_ <= 0 || plate_count_ == 0) return -1;
      --random_left_;
      int s = static_cast<int>(finger_.next_u32() % static_cast<uint32_t>(plate_count_));
      // Never the string just plucked.
      if (plate_count_ > 1 && same_string(plate_[s], cursor_)) {
        s = (s + 1 + static_cast<int>(finger_.next_u32() % static_cast<uint32_t>(plate_count_ - 1))) %
            plate_count_;
      }
      return s;
    }
    int s = find(heading_);
    if (s < 0 && turn_) {
      heading_ = -1;
      turn_ = false;
      s = find(heading_);
    }
    return s;
  }

  // One sample of the sweep: pluck when the wait is over, then wait the Strum
  // time, give or take.
  void advance_sweep() {
    using namespace chord_harp;
    if (since_start_ < gather_samples_) ++since_start_;
    if (wait_ <= 0.0f) {
      const float strum = param(kStrum);
      const int s = strum < kSingleBelowMs ? -1 : next_string();
      if (s < 0) {
        sweeping_ = false;
        return;
      }
      const float place =
          plate_count_ > 1 ? 2.0f * static_cast<float>(s) / static_cast<float>(plate_count_ - 1) - 1.0f : 0.0f;
      const float gap = 1.0f + kGapJitter * finger_.bipolar();
      const float level = kit::db_to_gain(kLevelJitterDb * finger_.bipolar());
      pluck(plate_[s], place, level * kSweepLevel * sweep_velocity_ / std::sqrt(static_cast<float>(classes_)));
      cursor_ = plate_[s];
      if (!has_next()) {
        sweeping_ = false;
        return;
      }
      wait_ += gap * strum * 0.001f * sample_rate();
    }
    wait_ -= 1.0f;
  }

  // Pluck the string at `hz`, `place` from -1 (the low end of the plate) to 1.
  void pluck(float hz, float place, float level) {
    float left, right;
    kit::pan_gains(place * param(chord_harp::kSpread) * kMaxPan, &left, &right);

    int same = -1, idle = -1, quietest = -1;
    float lowest = kBeyondHz;
    for (int v = 0; v < kMaxStrings; ++v) {
      const String& string = strings_[v];
      if (!string.on) {
        if (idle < 0) idle = v;
      } else if (same_string(string.hz, hz)) {
        same = v;
        break;
      } else if (string.fade_left == 0 && string.loudness() < lowest) {
        lowest = string.loudness();
        quietest = v;
      }
    }

    // The voice already on this pitch, else an idle one, else the quietest.
    // (Should all 32 be fading out for other plucks already, this pluck
    // replaces the one the first voice was waiting to play.)
    int voice = same;
    if (voice < 0) voice = idle;
    if (voice < 0) voice = quietest;
    if (voice < 0) voice = 0;
    String& string = strings_[voice];
    string.peak = level;
    string.pan_left = left;
    string.pan_right = right;
    if (same >= 0) {
      // The same string again: it keeps swinging and takes the new level.
      if (string.fade_left == 0) begin_attack(string);
      return;
    }
    if (idle >= 0) {
      string.on = true;
      ++strings_on_;
      start(string, hz);
      return;
    }
    // Every voice rings: this one fades over 2 ms and then plays the pluck.
    string.hz = hz;
    if (string.fade_left == 0) {
      string.fade_left = static_cast<int>(kStealSeconds * sample_rate());
      if (string.fade_left < 2) string.fade_left = 2;
      string.fade_step = string.level / static_cast<float>(string.fade_left);
      string.attack_left = 0;
    }
  }

  // A string starts at `hz` from rest, towards its peak at its pan.
  void start(String& string, float hz) {
    string.hz = hz;
    string.tracking = std::pow(hz / kMiddleHz, kKeyTracking);
    string.level = 0.0f;
    string.chime_env = 0.0f;
    string.gain_left = string.pan_left;
    string.gain_right = string.pan_right;
    string.pulse.start(hz / sample_rate(), kPulseWidth, harmonic_limit_, leak_);
    string.filter.reset();
    tune(string);
    begin_attack(string);
  }

  void begin_attack(String& string) {
    const float steps = static_cast<float>(attack_samples_);
    string.attack_left = attack_samples_;
    string.level_step = (string.peak - string.level) / steps;
    string.chime_step = (1.0f - string.chime_env) / steps;
    string.left_step = (string.pan_left - string.gain_left) / steps;
    string.right_step = (string.pan_right - string.gain_right) / steps;
  }

  void render(String& string, float* left, float* right) {
    if (string.fade_left > 0) {
      string.level -= string.fade_step;
      if (--string.fade_left == 0) start(string, string.hz);
    } else if (string.attack_left > 0) {
      string.level += string.level_step;
      string.chime_env += string.chime_step;
      string.gain_left += string.left_step;
      string.gain_right += string.right_step;
      if (--string.attack_left == 0) {
        string.level = string.peak;
        string.chime_env = 1.0f;
        string.gain_left = string.pan_left;
        string.gain_right = string.pan_right;
      }
    } else {
      string.level *= decay_;
      string.chime_env *= chime_decay_;
      if (string.chime_env < kChimeFloor) string.chime_env = 0.0f;
      if (string.level < kSilence) {
        string.on = false;
        --strings_on_;
        return;
      }
    }
    // The chime rides on the pulse, at the peak of its second harmonic.
    const float chime = string.chime_env > 0.0f ? kChimeLevel * string.chime_env * string.pulse.octave() : 0.0f;
    const float wave = string.pulse.next() + chime;
    const float out = string.filter.lowpass(wave) * string.level;
    *left += out * string.gain_left;
    *right += out * string.gain_right;
  }

  bool pad_silent() const { return pad_.target <= 0.0f && pad_.value <= 0.0f; }

  // Nothing sounded in this block: whatever was gliding arrives, a key let
  // go has gone, and the control clock starts again with the next sound.
  // Done once the block is over, so that the next sound finds the same state
  // whatever the host's block size and whenever the instrument fell asleep.
  void rest() {
    for (int k = 0; k < kMaxKeys; ++k) {
      if (keys_.voices[k].env.releasing()) keys_.voices[k].env.reset();
    }
    if (!tone_.settled()) {
      tone_.snap(tone_.target);
      corner_ = corner_for(tone_.target);
    }
    pad_.snap(pad_.target);
    volume_.snap(volume_.target);
    clock_.reset(kControlPeriod);
  }

  // Every 32 samples: Tone glides, and the strings that ring follow it.
  void control() {
    if (tone_.settled()) return;
    corner_ = corner_for(tone_.next());
    for (int v = 0; v < kMaxStrings; ++v) {
      if (strings_[v].on) tune(strings_[v]);
    }
  }

  void apply(int id) {
    using namespace chord_harp;
    const float value = param(id);
    switch (id) {
      case kSustain:
        // A new rate from the next sample on; the level itself does not jump.
        decay_ = std::exp(-kSixtyDb / (value * sample_rate()));
        chime_decay_ = decay_ * decay_;
        break;
      case kTone:
        tone_.set(value, primed());
        if (!primed()) corner_ = corner_for(value);
        break;
      case kPad:
        pad_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read when a key is pressed or a string is plucked
    }
  }

  kit::VoicePool<Key, kMaxKeys> keys_;
  String strings_[kMaxStrings];
  int strings_on_ = 0;

  float plate_[kMaxStrings] = {};
  int plate_count_ = 0;
  int classes_ = 1;

  // The sweep in progress.
  bool sweeping_ = false;
  float wait_ = 0.0f;    // samples until the next pluck
  float cursor_ = 0.0f;  // the last string plucked, Hz
  int heading_ = 1;
  bool turn_ = false;    // an Up Down sweep that has yet to turn round
  bool random_ = false;
  int random_left_ = 0;
  long since_start_ = 0;
  float sweep_velocity_ = 0.0f;
  kit::Rng finger_;

  int attack_samples_ = 96;
  long gather_samples_ = 1440;
  float decay_ = 0.9999f;
  float chime_decay_ = 0.9998f;
  float corner_ = 2500.0f;
  float top_hz_ = kTopHz;
  float harmonic_limit_ = 0.4f;
  float leak_ = 0.9995f;
  kit::Smoother tone_, pad_, volume_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
};

}  // namespace livemix
