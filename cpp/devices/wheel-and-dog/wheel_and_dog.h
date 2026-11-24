#pragma once

// Wheel and Dog: a wheel that bows five strings, and a loose bridge.
//
//   wheel clock ─► speed (run up and down, pushes) ─┬─► bow: level, noise, edge
//                                                   └─► jerk ─► dog (open or shut)
//                                                                  │
//   melody 1, 2 ─┐                                                 ▼
//   low, second ─┼─► strings at twice the rate ─► halve ─► body ─►(+)─► width ─► volume ─► out
//   third drone ─┴──────────────► contact on the dog ─► halve ─► band ┘
//
// - A string under a turning wheel moves as a ramp and a slip, with no bow
//   change, so a held note has no seam. Each string is that motion: a
//   band-limited ramp at twice the host's rate, at the string's pitch to the
//   last bit of a double phase. With little rosin it slips twice a period (a
//   second ramp part of a period behind, which takes out the fundamental);
//   with a lot it is driven and its slips are uneven. A low-pass set by
//   Brightness, Rosin and the bow's speed follows.
// - The wheel's clock turns evenly at Speed, so a turn is a turn. On top of it
//   the hand pushes: at each accent the bow's speed jumps by Depth in some
//   22 ms and comes back over the rest of the gap. The bow's level and edge
//   follow the speed.
// - The dog is moved by the change of speed, not by the speed: the jerk is the
//   time derivative of the bow's speed, scaled so that a push of Depth d at
//   full turning reads d. Over a threshold that falls as Dog rises the bridge
//   foot comes loose and the third drone's own wave beats it: a one-sided
//   contact on the string's motion, worked out at twice the rate, with a band
//   of 2 to 6 kHz kept. As the wheel runs down its pushes shrink and the dog
//   falls silent before the strings do.
// - Keys below Split hold the drones, keys from it up play the melody; both
//   turn the wheel. A key's side is settled when it is struck, so moving Split
//   does not turn a held key into another kind.
// - Two strings on one note (or on an octave) would stand at any phase to
//   each other and some phases cancel. They are coupled as through a bridge:
//   the second leans on the first by at most six cents until they agree, so
//   a new unison beats for a moment and then stands.
// - Five strings sound however many keys are held, so there is no pool to fill
//   and nothing to stack.
//
// The first key after everything has ended restarts the wheel at phase 0 and
// every smoother at its target, on that sample. The end is counted in samples
// from the one where the wheel stops, not in the host's blocks.

#include "../../kit/beat.h"
#include "../../kit/kit.h"
#include "../../kit/oversample.h"
#include "params.gen.h"

namespace livemix {

namespace wheel_and_dog_detail {

// A ramp falling from 1 to -1 and slipping back, band-limited at its slip.
inline float ramp(double phase, double step) {
  const float p = static_cast<float>(phase);
  const float dt = static_cast<float>(step);
  float y = 1.0f - 2.0f * p;
  if (p < dt) {
    const float t = p / dt;
    y += t + t - t * t - 1.0f;
  } else if (p > 1.0f - dt) {
    const float t = (p - 1.0f) / dt;
    y += t * t + t + t + 1.0f;
  }
  return y;
}

// The dog's foot on its board: what the third drone's own motion makes of a
// one-sided contact. The motion is rounded off first, and all of it runs at
// twice the host's rate, so what the contact makes stays under that Nyquist
// and the halving takes off what would fold.
struct Contact {
  kit::Svf in;
  kit::Halfband2x down;

  void init(float rate2) {
    in.set(3800.0f, 0.6f, rate2);
    down.init();
    reset();
  }
  void reset() {
    in.reset();
    down.reset();
  }
  // The string at this half sample; `open` is how far the foot hangs loose.
  float beat(float motion, float open) {
    const float over = in.lowpass(motion) - (0.6f - 0.35f * open);
    return over > 0.0f ? open * over * over / (over + 0.15f) : 0.0f;
  }
};

}  // namespace wheel_and_dog_detail

class WheelAndDog : public kit::DeviceBase<wheel_and_dog::kNumParams> {
 public:
  static constexpr int kMaxKeys = 128;
  enum String : int { kLow = 0, kSecond, kThird, kMelody1, kMelody2, kNumStrings };
  enum Melody : int { kUnison = 0, kOctave, kDuo };
  enum Pattern : int { kEven = 0, kLongShort, kFirstStrong };

  void init(float sample_rate) {
    using namespace wheel_and_dog;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    rate_ = sr;
    inv_rate2_ = 0.5 / static_cast<double>(sr);
    const float control_rate = sr / static_cast<float>(kControl);
    num_keys_ = 0;
    kit::SineTable::init();
    spin_ = 0.0f;
    push_coeff_ = 1.0f - kit::time_to_coeff(0.002f, sr);
    sounding_ = false;
    tail_ = 0;
    tail_samples_ = static_cast<int>(kTailSeconds * sr);
    for (int s = 0; s < kNumStrings; ++s) {
      strings_[s] = Str();
      kit::pan_gains(kPan[s], &strings_[s].left, &strings_[s].right);
      strings_[s].hz.set_time(s < kMelody1 ? 0.02f : 0.0012f, sr);
    }
    for (int c = 0; c < 2; ++c) {
      down_[c].init();
      for (int m = 0; m < kBodyModes; ++m) {
        body_[c][m].reset();
        body_[c][m].set(kBodyHz[c][m], kBodyQ[m], sr);
      }
      hiss_[c].reset();
      edge_split_[c].reset();
      edge_split_[c].set_cutoff(2200.0f, sr);
      knock_[c].reset();
      knock_[c].set_cutoff(2600.0f, sr);
      rumble_[c].set_cutoff(25.0f, sr);
      rumble_[c].reset();
    }
    contact_.init(2.0f * sr);
    for (int m = 0; m < kDogModes; ++m) dog_mode_[m].set(kDogHz[m], kDogQ[m], sr);
    dog_low_.set(6500.0f, 0.7f, sr);
    dog_high_.set(1500.0f, 0.7f, sr);
    for (int b = 0; b < 2; ++b) {
      board_[b].clear();
      board_delay_[b] = kit::clamp_int(static_cast<int>(kBoardSeconds[b] * sr + 0.5f), 1, kBoardSize - 2);
    }
    noise_scale_ = std::sqrt(sr / 48000.0f);
    kit::Smoother* const fast[] = {&depth_, &dog_, &drones_, &third_, &noise_, &body_amount_, &spread_, &volume_};
    for (kit::Smoother* s : fast) s->set_time(kSmoothingSeconds, sr);
    speed_.set_time(0.05f, sr);
    kit::Smoother* const slow[] = {&rosin_, &brightness_};
    for (kit::Smoother* s : slow) s->set_time(kSmoothingSeconds, control_rate);
    for (int m = 0; m < 2; ++m) melody_gain_[m].set_time(0.01f, sr);
    drone_gain_.set_time(0.05f, sr);
    melody_gate_.set_time(kGateOnSeconds, sr);
    open_.set_time(0.004f, sr);
    jitter_coeff_ = 1.0f - kit::time_to_coeff(0.0005f, 2.0f * sr);
    tangent_coeff_ = kit::time_to_coeff(0.009f, sr);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    fall_asleep();
    restart();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    const bool at_rest = num_keys_ == 0 && (!sounding_ || spin_ <= 0.0f);
    remove(note_id);  // an id is one key: at another pitch it moves there
    if (at_rest) restart();
    if (num_keys_ == kMaxKeys) remove_at(0);
    Key& key = keys_[num_keys_++];
    key.id = note_id;
    key.hz = frequency;
    key.gain = 0.5f + 0.5f * gain;
    key.drone = kit::hz_to_midi(frequency) < split_note() - 0.5f;
    if (at_rest) drone_gain_.snap(key.gain);
    sounding_ = true;
    tail_ = tail_samples_;
    keys_changed(!key.drone, at_rest);
  }

  void note_off(int note_id) {
    const int before = num_keys_;
    const bool had_melody = newest_melody(0) >= 0;
    const float was = had_melody ? keys_[newest_melody(0)].hz : 0.0f;
    remove(note_id);
    if (num_keys_ == before) return;
    const int now = newest_melody(0);
    // Back to a key still held: its tangent meets the string again.
    keys_changed(now >= 0 && keys_[now].hz != was, false);
  }

  // Readings for the plate; see device.json.
  float meter(int index) const {
    if (!sounding_) return 0.0f;
    switch (index) {
      case 0: return static_cast<float>(turn_.phase);
      case 1: return open_.value;
      case 2: return melody_gate_.target;
      case 3: return bow_speed_;
      default: return 0.0f;
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!sounding_) {
      silence_output(frames);
      return;
    }
    clear_input(frames);
    for (int i = 0; i < frames; ++i) {
      if (!sounding_) {
        out_left_[i] = out_right_[i] = 0.0f;
        continue;
      }
      if (clock_.tick()) control();
      tick(&out_left_[i], &out_right_[i]);
      if (num_keys_ > 0 || spin_ > 0.0f) {
        tail_ = tail_samples_;
      } else if (--tail_ <= 0) {
        fall_asleep();
      }
    }
  }

 private:
  static constexpr int kControl = 16;
  static constexpr int kBodyModes = 7;
  static constexpr float kTailSeconds = 0.6f;
  static constexpr float kMinHz = 16.0f;
  static constexpr float kMaxHz = 7000.0f;
  static constexpr float kGateOnSeconds = 0.012f;
  static constexpr float kGateOffSeconds = 0.05f;
  // A push: seconds from its start to full speed, at most this share of the
  // gap, and how far the speed goes at Depth 1.
  static constexpr float kRiseSeconds = 0.022f;
  static constexpr float kRiseShare = 0.3f;
  static constexpr float kJump = 1.5f;
  // The second melody string leans on the first by at most six cents.
  static constexpr double kLean = 0.00347;
  // Where a string's second slip lies, in periods behind the first.
  static constexpr double kSecondSlip[kNumStrings] = {0.46, 0.43, 0.45, 0.44, 0.47};
  // Gripped hard it lets go for this share of a period, and the ramp narrows.
  static constexpr double kRawSlip[kNumStrings] = {0.11, 0.14, 0.12, 0.13, 0.17};
  static constexpr double kStartPhase[kNumStrings] = {0.0, 0.31, 0.62, 0.17, 0.17};
  // Equal-power places, left and right, at full Spread.
  static constexpr float kPan[kNumStrings] = {-0.15f, -0.6f, 0.5f, -0.25f, 0.35f};
  // Body: seven modes a side, a little apart left and right.
  static constexpr float kBodyHz[2][kBodyModes] = {{163.0f, 262.0f, 401.0f, 575.0f, 842.0f, 1270.0f, 2140.0f},
                                                  {171.0f, 251.0f, 388.0f, 604.0f, 815.0f, 1335.0f, 2050.0f}};
  static constexpr float kBodyQ[kBodyModes] = {5.0f, 6.0f, 7.0f, 8.0f, 8.0f, 7.0f, 5.0f};
  static constexpr float kBodyGain[kBodyModes] = {0.9f, 1.0f, 0.8f, 0.9f, 1.1f, 1.2f, 0.8f};
  // The dog's own plate: three modes the foot's beating rings.
  static constexpr int kDogModes = 3;
  static constexpr float kDogHz[kDogModes] = {2250.0f, 3150.0f, 4400.0f};
  static constexpr float kDogQ[kDogModes] = {9.0f, 11.0f, 11.0f};
  static constexpr float kDogGain[kDogModes] = {1.0f, -1.1f, 0.9f};
  // The board under it spreads each knock over a few milliseconds.
  static constexpr int kBoardSize = 512;
  static constexpr float kBoardSeconds[2] = {0.00127f, 0.00079f};
  // Levels before Volume.
  static constexpr float kLevel[kNumStrings] = {0.50f, 0.40f, 0.46f, 0.26f, 0.19f};
  static constexpr float kNoiseLevel = 0.5f;
  static constexpr float kBuzzLevel = 44.0f;
  static constexpr float kBarkCeiling = 1.4f;  // times the string's own swing
  static constexpr float kTangentLevel = 1.8f;

  struct Key {
    int id = -1;
    float hz = 0.0f;
    float gain = 1.0f;
    bool drone = false;
  };

  struct Str {
    double phase = 0.0;
    kit::Smoother hz;
    kit::Svf low;
    kit::Rng rng;
    float slip = 1.0f, slip_target = 1.0f;  // how far this period's slip goes
    float left = 0.5f, right = 0.5f;
  };

  static int choice(float value) { return static_cast<int>(value + 0.5f); }

  float split_note() const {
    static constexpr float kNotes[9] = {-1000.0f, 36.0f, 41.0f, 48.0f, 53.0f, 60.0f, 65.0f, 72.0f, 1000.0f};
    return kNotes[kit::clamp_int(choice(param(wheel_and_dog::kSplit)), 0, 8)];
  }

  static int accents(float value) {
    static constexpr int kCounts[5] = {0, 2, 3, 4, 6};
    return kCounts[kit::clamp_int(choice(value), 0, 4)];
  }

  // --- keys ------------------------------------------------------------------------------------

  void remove_at(int index) {
    for (int i = index; i + 1 < num_keys_; ++i) keys_[i] = keys_[i + 1];
    --num_keys_;
  }

  void remove(int note_id) {
    for (int i = num_keys_ - 1; i >= 0; --i) {
      if (keys_[i].id == note_id) remove_at(i);
    }
  }

  // The newest melody key held, or the one struck `back` before it; -1 for none.
  int newest_melody(int back) const {
    for (int i = num_keys_ - 1; i >= 0; --i) {
      if (!keys_[i].drone && back-- == 0) return i;
    }
    return -1;
  }

  // The lowest drone key held, -1 for none.
  int lowest_drone() const {
    int lowest = -1;
    for (int i = 0; i < num_keys_; ++i) {
      if (keys_[i].drone && (lowest < 0 || keys_[i].hz < keys_[lowest].hz)) lowest = i;
    }
    return lowest;
  }

  // After a key went down or came up. `stopped`: a tangent met a string.
  void keys_changed(bool stopped, bool at_rest) {
    const int drone = lowest_drone();
    if (drone >= 0) {
      first_key_hz_ = keys_[drone].hz;
      drone_gain_.set_target(keys_[drone].gain);
      if (spin_ <= 0.0f) drone_gain_.snap(keys_[drone].gain);
    }
    const int newest = newest_melody(0);
    // With no key held at all the strings stay where they are and fade with
    // the wheel; with a drone key held the last melody key lifts them off it.
    if (newest >= 0) {
      melody_gate_.set_time(kGateOnSeconds, rate_);
      melody_gate_.set_target(1.0f);
      if (at_rest) melody_gate_.snap(1.0f);
      if (stopped) tangent_ = kit::max(tangent_, param(wheel_and_dog::kTangents) * keys_[newest].gain);
    } else if (num_keys_ > 0) {
      melody_gate_.set_time(kGateOffSeconds, rate_);
      melody_gate_.set_target(0.0f);
    }
    retarget();
  }

  // Where every string should stand, from the keys and the knobs.
  void retarget() {
    using namespace wheel_and_dog;
    const int tonic = choice(param(kDrone));
    float root = first_key_hz_;
    if (tonic > 0) root = kit::midi_to_hz(36.0f + static_cast<float>(tonic - 1));
    while (root < 27.0f) root *= 2.0f;
    while (root > 1000.0f) root *= 0.5f;
    static constexpr float kSteps[4][2] = {{12.0f, 19.0f}, {12.0f, 17.0f}, {12.0f, 24.0f}, {7.0f, 12.0f}};
    const int tuning = kit::clamp_int(choice(param(kTuning)), 0, 3);
    aim(kLow, root, spin_ <= 0.0f);
    aim(kSecond, root * kit::semitones_to_ratio(kSteps[tuning][0]), spin_ <= 0.0f);
    aim(kThird, root * kit::semitones_to_ratio(kSteps[tuning][1]) * kit::cents_to_ratio(param(kDetune)), spin_ <= 0.0f);

    const int a = newest_melody(0);
    if (a < 0) return;
    const int mode = kit::clamp_int(choice(param(kMelody)), 0, 2);
    int first = a, second = a;
    if (mode == kDuo) {
      // A string stays on its key while that key is one of the two.
      const int b = newest_melody(1);
      if (b >= 0) {
        second = b;
        if (string_key_[0] == keys_[b].id || string_key_[1] == keys_[a].id) {
          first = b;
          second = a;
        }
      }
    }
    string_key_[0] = keys_[first].id;
    string_key_[1] = keys_[second].id;
    const bool land = melody_gate_.value < 1.0e-3f || spin_ <= 0.0f;
    const float second_hz = mode == kOctave ? kit::max(kMinHz, 0.5f * keys_[second].hz) : keys_[second].hz;
    aim(kMelody1, keys_[first].hz, land);
    aim(kMelody2, second_hz, land);
    lean_ = keys_[first].hz == second_hz ? 1 : (keys_[first].hz == 2.0f * second_hz ? 2 : 0);
    const float share = first == second ? kLevel[kMelody2] : kLevel[kMelody1];
    set_gain(0, kLevel[kMelody1] * keys_[first].gain, land);
    set_gain(1, share * keys_[second].gain, land);
  }

  void aim(int s, float hz, bool land) {
    hz = kit::min(hz, kit::min(kMaxHz, 0.4f * rate_));
    if (land || !primed()) {
      strings_[s].hz.snap(hz);
    } else {
      strings_[s].hz.set_target(hz);
    }
  }

  void set_gain(int m, float gain, bool land) {
    if (land) {
      melody_gain_[m].snap(gain);
    } else {
      melody_gain_[m].set_target(gain);
    }
  }

  // --- start and end ---------------------------------------------------------------------------

  // The first key with the wheel at a stand: everything that runs on through
  // a silence starts from the same place, and every knob has arrived.
  void restart() {
    turn_.reset();
    spin_ = 0.0f;
    spin_place_ = 0.0;
    push_ = jerk_ = 0.0f;
    bow_speed_ = 0.0f;
    bow_gain_ = 1.0f;
    tangent_ = 0.0f;
    open_.snap(0.0f);
    clock_.reset(kControl);
    first_key_hz_ = kit::midi_to_hz(38.0f);
    melody_gate_.snap(0.0f);
    string_key_[0] = string_key_[1] = -1;
    lean_ = 0;
    noise_rng_.seed(0x00D06A11u);
    for (int s = 0; s < kNumStrings; ++s) {
      Str& string = strings_[s];
      string.phase = kStartPhase[s];
      string.rng.seed(0x5EED01u + 7919u * static_cast<uint32_t>(s));
      string.slip = string.slip_target = 1.0f;
      drift_[s].seed(0x0D41F7u + 104729u * static_cast<uint32_t>(s));
      drift_[s].set_rate(0.7f + 0.13f * static_cast<float>(s), rate_);
    }
    kit::Smoother* const all[] = {&speed_, &depth_,       &dog_,    &drones_, &third_,     &noise_,
                                  &rosin_, &brightness_, &spread_, &volume_, &body_amount_};
    for (kit::Smoother* s : all) s->snap(s->target);
    retarget();
  }

  // The tail is over: nothing is left in a filter to be heard.
  void fall_asleep() {
    sounding_ = false;
    melody_gate_.snap(0.0f);
    for (Str& string : strings_) string.low.reset();
    for (int c = 0; c < 2; ++c) {
      down_[c].reset();
      for (kit::Svf& mode : body_[c]) mode.reset();
      hiss_[c].reset();
      knock_[c].reset();
      edge_split_[c].reset();
      rumble_[c].reset();
    }
    contact_.reset();
    for (kit::Svf& mode : dog_mode_) mode.reset();
    for (auto& board : board_) board.clear();
    dog_low_.reset();
    dog_high_.reset();
  }

  // --- the control clock -----------------------------------------------------------------------

  void control() {
    const float rosin = rosin_.next();
    const float bright = brightness_.next();
    const float speed = speed_.value;
    // A string that barely sticks slips twice; one gripped hard is driven.
    const float slack = kit::clamp(1.0f - rosin / 0.42f, 0.0f, 1.0f);
    raw_ = kit::clamp((rosin - 0.45f) * (1.0f / 0.55f), 0.0f, 1.0f);
    second_slip_ = 0.77f * slack * (2.0f - slack) - 0.6f * raw_;
    tone_ = 1.0f - 0.22f * slack;
    // The faster the wheel the harder it bows, a little.
    const float faster = std::log2(speed * 2.0f);
    speed_level_ = std::exp2(0.12f * faster);
    speed_noise_ = std::exp2(0.3f * faster);
    const float open = 600.0f * std::exp2(5.2f * bright) * (0.4f + 1.5f * rosin) *
                       std::exp2(0.15f * faster) * (1.0f + 0.35f * (bow_gain_ - 1.0f));
    for (int s = 0; s < kNumStrings; ++s) {
      Str& string = strings_[s];
      const float hz = string.hz.value;
      const float wander = 1.0f + 0.05f * drift_[s].next(kControl);
      const float tracked = open * wander * std::exp2(0.35f * std::log2(hz * (1.0f / 220.0f)));
      string.low.set(kit::clamp(tracked, 2.2f * hz, 18000.0f), 0.62f, 2.0f * rate_);
    }
    edge_ = 2.6f * kit::max(0.0f, bright - 0.25f) * (0.6f + 0.8f * rosin);
    const float hiss_hz = kit::clamp(1500.0f * std::exp2(2.2f * bright), 800.0f, 7000.0f);
    hiss_[0].set(hiss_hz, 0.55f, rate_);
    hiss_[1].set(hiss_hz, 0.55f, rate_);
    const int n = accents(param(wheel_and_dog::kAccents));
    const float gap = n > 0 ? 1.0f / (static_cast<float>(n) * speed) : 10.0f;
    jerk_fall_ = kit::time_to_coeff(kit::min(0.09f, 0.4f * gap), rate_);
    spin_step_ = 1.0 / (static_cast<double>(param(wheel_and_dog::kSpin)) * rate_);
  }

  // --- the wheel -------------------------------------------------------------------------------

  // How far into its push the hand is at this place of the turn, 0 to 1.
  float push_at(float place, float speed) const {
    using namespace wheel_and_dog;
    const int n = accents(param(kAccents));
    if (n == 0) return 0.0f;
    const float u = place * static_cast<float>(n);
    int k = kit::clamp_int(static_cast<int>(u), 0, n - 1);
    float start = static_cast<float>(k), length = 1.0f, strength = 1.0f;
    const int pattern = choice(param(kPattern));
    if (pattern == kLongShort) {
      constexpr float kLate = 1.0f / 3.0f;
      if ((k & 1) && u < start + kLate) {
        --k;
        start -= 1.0f;
      }
      if (k & 1) {
        start += kLate;
        length = 1.0f - kLate;
      } else if (k + 1 < n) {
        length = 1.0f + kLate;
      }
    } else if (pattern == kFirstStrong && k > 0) {
      strength = 0.5f;
    }
    const float p = (u - start) / length;
    const float rise = kit::min(kRiseShare, kRiseSeconds * speed * static_cast<float>(n) / length);
    if (p < rise) {
      const float r = p / rise;
      return strength * r * r * (3.0f - 2.0f * r);
    }
    const float fall = 1.0f - (p - rise) / (1.0f - rise);
    return strength * fall * fall * fall;
  }

  // Step the wheel by one sample: the bow's level, and how open the dog is.
  float turn_wheel() {
    const float speed = speed_.next();
    const double last_place = spin_place_;
    if (num_keys_ > 0) {
      spin_place_ = spin_place_ + spin_step_ < 1.0 ? spin_place_ + spin_step_ : 1.0;
    } else {
      spin_place_ = spin_place_ - spin_step_ > 0.0 ? spin_place_ - spin_step_ : 0.0;
    }
    spin_ = static_cast<float>(spin_place_);
    const float place = static_cast<float>(turn_.phase);
    turn_.step(kit::SlowClock::increment(static_cast<double>(speed) * spin_place_, rate_));
    const float depth = kJump * depth_.next();
    const float last_push = push_;
    push_ += (push_at(place, speed) - push_) * push_coeff_;
    const float jump = depth * push_;
    bow_speed_ = spin_ * (1.0f + jump);
    bow_gain_ = 1.0f + jump * (0.8f - 0.053f * jump);

    // The jerk: the bow's speed by time, the knobs held still.
    const float jerk = (depth * spin_ * (push_ - last_push) + static_cast<float>(spin_place_ - last_place) * (1.0f + jump)) * rate_ *
                       (kRiseSeconds / (1.5f * kJump));
    jerk_ = kit::max(kit::clamp(jerk, 0.0f, 1.2f), flush_denormal(jerk_ * jerk_fall_));
    const float dog = dog_.next();
    float loose = 0.0f;
    if (dog > 0.0f) {
      const float firm = 1.0f - dog;
      const float threshold = 0.02f + 0.42f * firm * std::sqrt(std::sqrt(firm));
      const float over = kit::clamp((jerk_ - threshold) * (1.0f / 0.15f), 0.0f, 1.0f);
      loose = over * over * (3.0f - 2.0f * over) * kit::min(1.0f, 8.0f * dog) * (0.55f + 0.45f * dog);
    }
    open_.set_target(loose);
    open_.next();
    const float round = spin_ * spin_ * (3.0f - 2.0f * spin_);
    const float eccentric = 1.0f + 0.02f * kit::SineTable::lookup(place);
    return round * bow_gain_ * speed_level_ * eccentric;
  }

  // --- the strings -----------------------------------------------------------------------------

  // One sample at twice the rate. `*bare` is the string's own motion.
  float bow(int s, double step, float* bare) {
    Str& string = strings_[s];
    string.phase += step;
    if (string.phase >= 1.0) {
      string.phase -= 1.0;
      string.slip_target = 1.0f + 0.3f * string.rng.bipolar();
    }
    string.slip += (string.slip_target - string.slip) * jitter_coeff_;
    float x = wheel_and_dog_detail::ramp(string.phase, step);
    *bare = x;
    if (second_slip_ != 0.0f) {
      double p = string.phase - (second_slip_ > 0.0f ? kSecondSlip[s] : kRawSlip[s]);
      if (p < 0.0) p += 1.0;
      x += second_slip_ * wheel_and_dog_detail::ramp(p, step);
    }
    if (raw_ > 0.0f) x *= 1.0f + raw_ * (string.slip - 1.0f);
    x = string.low.lowpass(x);
    if (raw_ > 0.0f) x += 0.7f * raw_ * (0.9f * kit::fast_tanh(2.5f * x) - x);
    return x * tone_;
  }

  void tick(float* out_left, float* out_right) {
    const float bowing = turn_wheel();
    const float gate = melody_gate_.next();
    const float gain = drone_gain_.next();
    const float drone = gain * bowing;
    const float drones = drones_.next();
    const float third = third_.next();
    float gains[kNumStrings];
    gains[kLow] = kLevel[kLow] * drones * drone;
    gains[kSecond] = kLevel[kSecond] * drones * drone;
    gains[kThird] = kLevel[kThird] * third * drone;
    gains[kMelody1] = melody_gain_[0].next() * gate * bowing;
    gains[kMelody2] = melody_gain_[1].next() * gate * bowing;

    double step[kNumStrings];
    for (int s = 0; s < kNumStrings; ++s) step[s] = static_cast<double>(strings_[s].hz.next()) * inv_rate2_;
    if (lean_ > 0) {
      double apart = strings_[kMelody1].phase - static_cast<double>(lean_) * strings_[kMelody2].phase;
      apart -= std::floor(apart + 0.5);
      const double pull = 0.02 * apart;
      step[kMelody2] *= 1.0 + (pull > kLean ? kLean : (pull < -kLean ? -kLean : pull));
    }

    const float open = open_.value;
    float left[2], right[2], buzz[2];
    for (int k = 0; k < 2; ++k) {
      left[k] = right[k] = 0.0f;
      for (int s = 0; s < kNumStrings; ++s) {
        float bare;
        const float x = bow(s, step[s], &bare) * gains[s];
        left[k] += x * strings_[s].left;
        right[k] += x * strings_[s].right;
        if (s == kThird) {
          // The foot meets the board where the string swings past the gap.
          buzz[k] = contact_.beat(bare * strings_[s].slip, open);
        }
      }
    }
    float dry[2] = {down_[0].down(left[0], left[1]), down_[1].down(right[0], right[1])};
    for (int c = 0; c < 2; ++c) dry[c] += edge_ * edge_split_[c].highpass(dry[c]);
    float bark = dog_high_.highpass(contact_.down.down(buzz[0], buzz[1]));
    float plate = 0.25f * bark;
    for (int m = 0; m < kDogModes; ++m) plate += kDogGain[m] * dog_mode_[m].bandpass(bark);
    bark = dog_low_.lowpass(plate);
    for (int b = 0; b < 2; ++b) bark = board_[b].process(bark, board_delay_[b], 0.6f);
    bark = kBarkCeiling * kit::fast_tanh(bark * (kBuzzLevel / kBarkCeiling));
    bark *= kLevel[kThird] * third * drone;
    dry[0] += bark * strings_[kThird].left;
    dry[1] += bark * strings_[kThird].right;

    // Rosin: hiss let in with each slip.
    const float noise = noise_.next();
    const float second_away = 1.0f - static_cast<float>(strings_[kSecond].phase);
    const float melody_away = 1.0f - static_cast<float>(strings_[kMelody1].phase);
    const float rub = kNoiseLevel * noise * noise_scale_ * speed_noise_ * bow_speed_ *
                      spin_ * (gain * 0.5f * (drones + third) * (0.3f + 1.4f * second_away * second_away) +
                               gate * 0.6f * (0.3f + 1.4f * melody_away * melody_away));
    tangent_ = flush_denormal(tangent_ * tangent_coeff_);
    const float body = body_amount_.next();
    for (int c = 0; c < 2; ++c) {
      const float white = noise_rng_.bipolar();
      dry[c] += hiss_[c].bandpass(white) * rub;
      dry[c] += knock_[c].lowpass(white * tangent_) * kTangentLevel * noise_scale_;
      dry[c] = rumble_[c].highpass(dry[c]);
      float modes = 0.0f;
      for (int m = 0; m < kBodyModes; ++m) modes += kBodyGain[m] * body_[c][m].bandpass(dry[c]);
      dry[c] = dry[c] * (1.0f - 0.65f * body) + modes * 1.3f * body;
    }
    const float mid = 0.5f * (dry[0] + dry[1]);
    const float side = 0.75f * (dry[0] - dry[1]) * spread_.next();
    const float volume = volume_.next();
    *out_left = kit::soft_clip((mid + side) * volume);
    *out_right = kit::soft_clip((mid - side) * volume);
  }

  void apply(int id) {
    using namespace wheel_and_dog;
    const float value = param(id);
    switch (id) {
      case kSpeed: speed_.set(value, primed()); break;
      case kDepth: depth_.set(value, primed()); break;
      case kDog: dog_.set(value, primed()); break;
      case kDrones: drones_.set(value, primed()); break;
      case kTrompette: third_.set(value, primed()); break;
      case kRosin: rosin_.set(value, primed()); break;
      case kNoise: noise_.set(value * std::sqrt(value) * 1.6f, primed()); break;
      case kBrightness: brightness_.set(value, primed()); break;
      case kBody: body_amount_.set(value, primed()); break;
      case kSpread: spread_.set(value, primed()); break;
      case kVolume: volume_.set(kit::db_to_gain(value), primed()); break;
      case kDrone:
      case kTuning:
      case kDetune:
      case kMelody:
        retarget();
        break;
      default:
        break;  // read where they are used
    }
  }

  Key keys_[kMaxKeys];
  int num_keys_ = 0;
  Str strings_[kNumStrings];
  int string_key_[2] = {-1, -1};
  int lean_ = 0;
  float first_key_hz_ = 73.4162f;

  kit::SlowClock turn_;
  float spin_ = 0.0f;         // 0 at a stand, 1 at full speed
  double spin_place_ = 0.0;   // the same; a float would lose count of steps over eight seconds
  double spin_step_ = 0.0;
  float push_ = 0.0f, push_coeff_ = 1.0f;
  float jerk_ = 0.0f, jerk_fall_ = 0.0f;
  float bow_speed_ = 0.0f, bow_gain_ = 1.0f;
  float second_slip_ = 0.0f, raw_ = 0.0f, tone_ = 1.0f;
  float speed_level_ = 1.0f, speed_noise_ = 1.0f;

  kit::Smoother speed_, depth_, dog_, drones_, third_, noise_, rosin_, brightness_, body_amount_, spread_, volume_;
  kit::Smoother melody_gain_[2], melody_gate_, drone_gain_, open_;
  kit::Drift drift_[kNumStrings];
  kit::Halfband2x down_[2];
  wheel_and_dog_detail::Contact contact_;
  kit::Svf dog_mode_[kDogModes], dog_low_, dog_high_;
  kit::AllpassDelay<kBoardSize> board_[2];
  int board_delay_[2] = {60, 38};
  kit::Svf body_[2][kBodyModes], hiss_[2];
  kit::OnePole knock_[2], rumble_[2], edge_split_[2];
  float edge_ = 0.0f;
  kit::Rng noise_rng_;
  kit::ControlClock clock_;
  float tangent_ = 0.0f, tangent_coeff_ = 0.99f;
  float jitter_coeff_ = 0.02f, noise_scale_ = 1.0f;
  float rate_ = 48000.0f;
  double inv_rate2_ = 0.5 / 48000.0;
  int tail_ = 0, tail_samples_ = 28800;
  bool sounding_ = false;
};

}  // namespace livemix
