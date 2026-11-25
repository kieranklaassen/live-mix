#pragma once

// Silent Keys: a chord held down without a sound, and everything else played
// into it. Only the strings under the held keys are free. Each is a row of
// partials, and a partial answers only where the sound has energy at it, so a
// dry sound blooms into the chord and the chord dies away by itself.
//
//   in --+-----------------------------------------------------------> dry --+
//        |                                                                   (+)-> Output
//        +-> both -> low cut -+-> listeners -> gate -> strings -> pan -> ceiling
//                             |   (one a partial)  ^   (one mode a partial)
//                             +-> level follower --+
//
//   chord 1..8 (root, shape), Spacing, six keys --> the held keys --> which strings are free
//
// - A partial is two complex numbers, each turned by the partial's frequency
//   and shrunk a little every sample. The first, the listener, is short (4 ms
//   to 120 ms with Sharpness, shorter for high partials): its length is the
//   level of the sound near the partial now. It drives the second, the
//   string's mode, which lasts Ring. A sound that stops leaves the modes it
//   woke ringing at the strings' own frequencies.
// - Two linear filters in a row ring afterwards as loudly as the sound's
//   spectrum at the partial says, however narrow the first one is, so the
//   two gates between them are what makes Sharpness a matter of matching.
//   One asks how much of the sound this is: with q the share of the sound's
//   power that the listener hears, the drive is multiplied by q / (q + t), so
//   a slice of noise is turned down three times as many dB as it is weak. The
//   other asks how near it is: a listener on a tone a little off turns
//   against its partial at just the difference, so the turn in each control
//   tick, averaged by power, is how many hertz off the sound is, whatever its
//   level. The drive is halved at the tolerance (120 cents at Sharpness 0, 8
//   at 1) and falls as the sixth power past it. Both are gone at Sharpness 0.
// - What the strings already hold turns the drive down for all of them by
//   1 / (1 + (E / c)^2), E being the sum of the squares of the chord's modes
//   and c a share of the power of the sound itself (kLevelShare, let go over
//   a second, kLevelPower at the most); the bass strings have a sum of their
//   own. That is Lift's other half: noise and soft notes are lifted whole, a
//   tone right on a partial grows five times more slowly in dB, quiet playing
//   gets a quiet chord, and because one gain serves every string the shares
//   of the chord are kept. It acts on the drive and never on what rings, so
//   nothing pumps. A soft ceiling on the sum of the strings (linear to 0.5)
//   is what is left for the worst case.
// - The drive of a mode is scaled by 1 / sqrt(its decay time): noise then
//   wakes the strings to the same level whatever Ring is, a short note leaves
//   a long Ring a little quieter and a held one a little louder.
// - Ring is the decay time at 220 Hz; it falls as f^-0.4 (held between a
//   quarter and one and a half times). Partial n of a string is at
//   n f sqrt((1 + B n^2) / (1 + B)), B = 1.5e-5: 1.3 cents at the tenth.
// - Keys. A chord is a root, a shape and a spacing, or six keys of its own.
//   When the chord changes, the strings that are in both go on as they are;
//   the rest get their damper back (60 dB down in Damper at most, and no
//   drive from that sample on) and the new keys come up. A string still dying
//   when its key is held again is let go on from where it is. There are 24
//   strings' worth of storage: eight held (six and two bass strings) and
//   sixteen dying. Only when those run out (the chord knob swept) is the
//   oldest dying string faded in 20 ms, and the change waits for it.
// - The walk. With Every over zero the list goes 1..Count from Chord, a chord
//   each Every seconds of the device's own sample count, through pauses and
//   through rest too. The rule: it starts again from Chord, with a whole Every
//   to go, on a move of the Chord knob, and where the strings have died and
//   the input has been exact zero for kPauseSeconds or a whole Every,
//   whichever is longer; it then stands there until the first sample of sound.
//   All of it is counted in samples and control ticks (which are counted from
//   the first sample after a rest), so it does not depend on the block size.
//   A rest begins when the input has been exact zero for kRestSeconds and
//   every string is under the floor.
// - Rest is also the sleep: at rest every state is zero, nothing is worked
//   out, and a knob moved is in place for the next sound.
// - The strings hear both channels. The middle, (left + right) / 2, is the real
//   part of what a listener hears and the side, (left - right) / 2, its
//   imaginary part, a quarter turn away: the two add as powers, so a sound in
//   one channel or in the sides alone wakes the strings as one in the middle
//   of the same power does. Only a sound whose channels are a quarter turn
//   apart meets itself there, and every second partial hears the side the
//   other way round, so half of them answer it whatever it is. A sound alike
//   in both channels has no side.
// - A sample that is not a number is heard as silence; the dry path is held to
//   +-kBound and what the strings hear to +-kDriveBound.
//
// Cost: the strings that sound and no others, one partial about 21 operations
// a sample. No delay lines.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class SilentKeys : public kit::DeviceBase<silent_keys::kNumParams> {
 public:
  static constexpr int kKeys = 6;                  // chord strings at most
  static constexpr int kHeld = kKeys + 2;          // and two bass strings
  static constexpr int kStrings = 24;              // held and dying
  static constexpr int kModes = 12;                // partials of a string
  static constexpr int kChords = 8;
  static constexpr int kTick = 32;                 // control period, samples
  static constexpr float kRestSeconds = 0.25f;
  static constexpr float kPauseSeconds = 2.0f;     // the shortest silence the walk starts again after
  static constexpr float kFloorEnergy = 1.0e-14f;  // of one string: -140 dBFS
  static constexpr float kLevelShare = 0.2f;       // c, where the drive is down by half, as a share of the sound's power
  static constexpr float kLevelPower = 0.035f;     // and at the most
  static constexpr float kDriveScale = 5.0f;       // growth per second of a mode on a tone of 1, at a 4 s decay
  static constexpr float kInharmonicity = 1.5e-5f;
  static constexpr float kFadeSeconds = 0.02f;     // a dying string whose place is needed
  static constexpr float kBound = 16.0f;
  static constexpr float kDriveBound = 4.0f;
  static constexpr int kLowestNote = 12;
  static constexpr int kHighestNote = 108;

  void init(float sample_rate) {
    using namespace silent_keys;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    rest_after_ = static_cast<long>(kRestSeconds * sr);
    pause_ = static_cast<long>(kPauseSeconds * sr);
    silent_ = kLongSilence;
    fade_length_ = static_cast<int>(kFadeSeconds * sr / kTick) + 1;
    dry_gain_.set_time(kSmoothingSeconds, sr);
    wet_gain_.set_time(kSmoothingSeconds, sr);
    output_.set_time(kSmoothingSeconds, sr);
    follow_up_ = 1.0f - kit::time_to_coeff(0.010f, sr);
    follow_down_ = 1.0f - kit::time_to_coeff(0.060f, sr);
    loud_down_ = 1.0f - kit::time_to_coeff(1.0f, sr);
    pan_move_ = 1.0f - kit::time_to_coeff(0.010f, sr / kTick);
    for (int s = 0; s < kStrings; ++s) strings_[s] = String();
    serial_ = 0;
    begin_rest();
    for (int id = 0; id < kNumParams; ++id) apply(id);
    settle_at_rest();
  }

  void set_param(int id, float value) {
    const float before = id >= 0 && id < silent_keys::kNumParams ? param(id) : 0.0f;
    if (!store_param(id, value)) return;
    if (id == silent_keys::kChord && chord_of(before) == chord_of(param(id))) return;
    apply(id);
    if (resting_) settle_at_rest();
  }

  // The readings named by "meters" in device.json, for a display.
  // 0..5: how loud the string under each held key rings, lowest key first, as
  // the amplitude of one sine of the same power. 6..11: those keys as note
  // numbers (60 is C4), -1 where nothing is held. 12, 13: the bass strings,
  // one and two octaves under the lowest key. 14: the chord held, 1 to 8.
  // 15: how far the walk is on its way to the next chord, 0 to 1.
  float meter(int index) const {
    if (index >= 0 && index < kKeys) return reading(held_note_[index], false);
    if (index < 2 * kKeys && index >= kKeys) return static_cast<float>(held_note_[index - kKeys]);
    if (index == 12 || index == 13) {
      const int under = 12 * (index - 11);
      return held_note_[0] < 0 || held_note_[0] - under < kLowestNote ? 0.0f : reading(held_note_[0] - under, true);
    }
    if (index == 14) return static_cast<float>(now_ + 1);
    if (index == 15) return walking() ? kit::clamp(static_cast<float>(walked_) / static_cast<float>(step_length_), 0.0f, 1.0f) : 0.0f;
    return 0.0f;
  }

  // For the harness.
  int sounding_strings() const {
    int count = 0;
    for (int s = 0; s < kStrings; ++s) count += strings_[s].state != kFree ? 1 : 0;
    return count;
  }
  bool resting() const { return resting_; }

  void process(int frames) {
    frames = begin_block(frames);
    int i = 0;
    while (i < frames) {
      if (resting_) {
        // Every state is at rest: wait for the first sample that carries sound.
        const int from = i;
        while (i < frames && guard(in_left_[i]) == 0.0f && guard(in_right_[i]) == 0.0f) {
          in_left_[i] = in_right_[i] = 0.0f;
          out_left_[i] = out_right_[i] = 0.0f;
          ++i;
        }
        pass(i - from);
        if (i == frames) return;
        arrive();
      }
      if (tick_left_ == 0) {
        control();
        tick_left_ = kTick;
      }
      const int n = kit::clamp_int(frames - i, 1, tick_left_);
      render(i, n);
      tick_left_ -= n;
      i += n;
      if (tick_left_ == 0 && silent_ >= rest_after_ && all_dead()) begin_rest();
    }
  }

 private:
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kTopShare = 0.45f;  // partials above this share of the sample rate are left out
  static constexpr float kTopHz = 16000.0f;  // and above this
  static constexpr float kTiny = 1.0e-24f;   // a mode's energy under this is zero
  static constexpr float kListenFrom = 0.004f;  // the listener's time at 220 Hz, Sharpness 0
  static constexpr float kListenSpan = 30.0f;   // times this at 1
  static constexpr float kGateFrom = 6.0e-5f;   // the gate's knee as a share of the sound's power
  static constexpr float kGateSpan = 800.0f;    // times this at Sharpness 1, as its square goes up

  static constexpr float kOffFrom = 120.0f;     // how many cents off a sound may be, Sharpness 0
  static constexpr float kOffSpan = 1.0f / 15.0f;  // times this at 1
  static constexpr float kLeastOffHz = 0.7f;
  static constexpr float kNearSeconds = 0.008f;  // the second hearing, for how far off a sound is
  static constexpr float kLeanSeconds = 0.03f;   // and how long that is averaged over, at the least (the listener's time)

  static constexpr long kLongSilence = 1L << 24;  // samples: over a whole Every at the longest, at 192 kHz

  enum State : int { kFree = 0, kHeldDown, kDying, kFading };

  struct String {
    int state = kFree;
    int note = -1;
    bool bass = false;
    int count = 0;  // partials inside the band
    long age = 0;   // when its damper came down
    int fade = 0;   // ticks of fade left
    float energy = 0.0f;
    float pan = 0.0f, level = 1.0f;  // where it goes to
    float place = 0.0f, loud = 1.0f;  // where it is on its way there
    float left = 0.0f, right = 0.0f, left_step = 0.0f, right_step = 0.0f;
    float hz[kModes] = {};
    float turn_re[kModes] = {}, turn_im[kModes] = {};  // a sample's turn, unit length
    float hear_re[kModes] = {}, hear_im[kModes] = {}, hear_in[kModes] = {};
    float step_re[kModes] = {}, step_im[kModes] = {};
    float base[kModes] = {};   // drive before gate, Lift and level
    float drive[kModes] = {};  // drive in this tick
    float y_re[kModes] = {}, y_im[kModes] = {};
    float tick_re[kModes] = {}, tick_im[kModes] = {};  // a tick's turn
    float near_re[kModes] = {}, near_im[kModes] = {};  // the listener heard once more, at the tick's rate
    float lean_re[kModes] = {}, lean_im[kModes] = {};  // how it turns against the partial, averaged
    float near_move[kModes] = {}, lean_move[kModes] = {};
    float tolerance[kModes] = {};                      // the turn in a tick at which the drive is half
    float z_re[kModes] = {}, z_im[kModes] = {};
  };

  // A shape is up to six intervals over the root; -1 ends it.
  static const signed char* shape(int index) {
    static const signed char kShapes[25][kKeys] = {
        {-1, -1, -1, -1, -1, -1},  // Keys
        {0, -1, -1, -1, -1, -1},   // Single
        {0, 4, 7, -1, -1, -1},     // Major
        {0, 3, 7, -1, -1, -1},     // Minor
        {0, 4, 7, 11, -1, -1},     // Major 7
        {0, 4, 7, 10, -1, -1},     // Dominant 7
        {0, 3, 7, 10, -1, -1},     // Minor 7
        {0, 4, 7, 11, 14, -1},     // Major 9
        {0, 3, 7, 10, 14, -1},     // Minor 9
        {0, 4, 7, 14, -1, -1},     // Add 9
        {0, 2, 7, -1, -1, -1},     // Sus 2
        {0, 5, 7, -1, -1, -1},     // Sus 4
        {0, 4, 7, 9, -1, -1},      // Six
        {0, 3, 7, 9, -1, -1},      // Minor 6
        {0, 7, 14, -1, -1, -1},    // Fifths
        {0, 7, 12, -1, -1, -1},    // Open fifth
        {0, 12, 24, 36, -1, -1},   // Octaves
        {0, 5, 10, 15, -1, -1},    // Quartal
        {0, 3, 6, -1, -1, -1},     // Diminished
        {0, 3, 6, 9, -1, -1},      // Dim 7
        {0, 3, 6, 10, -1, -1},     // Half dim
        {0, 4, 8, -1, -1, -1},     // Augmented
        {0, 4, 7, 11, 14, 18},     // Lydian
        {0, 3, 7, 10, 14, 17},     // Minor 11
        {0, 1, 2, 3, -1, -1},      // Cluster
    };
    return kShapes[kit::clamp_int(index, 0, 24)];
  }

  static float guard(float x) {
    if (x > -kBound && x < kBound) return livemix::flush_denormal(x);
    if (x >= kBound) return kBound;
    if (x <= -kBound) return -kBound;
    return 0.0f;
  }

  static int whole(float value) { return static_cast<int>(value + 0.5f); }
  static int chord_of(float value) { return kit::clamp_int(whole(value), 1, kChords) - 1; }
  bool walking() const { return step_length_ > 0; }

  float reading(int note, bool bass) const {
    if (note < 0) return 0.0f;
    for (int s = 0; s < kStrings; ++s) {
      const String& string = strings_[s];
      if (string.state == kHeldDown && string.note == note && string.bass == bass) {
        return std::sqrt(string.energy) * string.loud;
      }
    }
    return 0.0f;
  }

  // The keys of chord `index`, lowest first, none twice. Returns how many.
  int keys_of(int index, int* notes) const {
    using namespace silent_keys;
    int count = 0;
    const int kind = whole(param(kShape1 + 2 * index));
    if (kind == 0) {
      for (int k = 0; k < kKeys; ++k) {
        const int key = whole(param(kKey1 + k));
        if (key > 0) count = insert(notes, count, kLowestNote - 1 + key);
      }
      return count;
    }
    const int root = 24 + whole(param(kRoot1 + 2 * index));
    const int spacing = whole(param(kSpacing));
    const signed char* intervals = shape(kind);
    for (int k = 0; k < kKeys && intervals[k] >= 0; ++k) {
      int note = root + intervals[k];
      if ((k & 1) == 1) note += spacing == 1 ? 12 : (spacing == 2 ? 24 : 0);
      if ((k & 1) == 0 && k > 0 && spacing == 2) note += 12;
      while (note > kHighestNote) note -= 12;
      count = insert(notes, count, note);
    }
    return count;
  }

  static int insert(int* notes, int count, int note) {
    int at = count;
    for (int k = 0; k < count; ++k) {
      if (notes[k] == note) return count;
      if (notes[k] > note) {
        at = k;
        break;
      }
    }
    for (int k = count; k > at; --k) notes[k] = notes[k - 1];
    notes[at] = note;
    return count + 1;
  }

  // Hold the keys of the chord of now. False when a dying string has to fade
  // out first to make room: ask again on the next tick.
  bool hold() {
    int notes[kHeld];
    bool bass[kHeld];
    int count = keys_of(now_, notes);
    for (int k = 0; k < kKeys; ++k) held_note_[k] = k < count ? notes[k] : -1;
    for (int k = 0; k < count; ++k) bass[k] = false;
    if (count > 0 && param(silent_keys::kBass) > 0.0f) {
      const int lowest = notes[0];
      for (int under = 12; under <= 24; under += 12) {
        if (lowest - under < kLowestNote) continue;
        notes[count] = lowest - under;
        bass[count] = true;
        ++count;
      }
    }
    int at[kHeld];
    int wanted = 0, room = 0, fading = 0;
    for (int k = 0; k < count; ++k) {
      at[k] = find(notes[k], bass[k]);
      if (at[k] < 0) ++wanted;
    }
    for (int s = 0; s < kStrings; ++s) {
      if (strings_[s].state == kFree) ++room;
      if (strings_[s].state == kFading) ++fading;
    }
    if (room < wanted) {
      while (room + fading < wanted) {
        int oldest = -1;
        for (int s = 0; s < kStrings; ++s) {
          bool kept = strings_[s].state != kDying;
          for (int k = 0; k < count && !kept; ++k) kept = at[k] == s;
          if (!kept && (oldest < 0 || strings_[s].age < strings_[oldest].age)) oldest = s;
        }
        if (oldest < 0) break;
        strings_[oldest].state = kFading;
        strings_[oldest].fade = fade_length_;
        ++fading;
      }
      return false;
    }
    for (int s = 0; s < kStrings; ++s) {
      if (strings_[s].state != kHeldDown) continue;
      bool stays = false;
      for (int k = 0; k < count; ++k) stays = stays || at[k] == s;
      if (!stays) let_go(strings_[s]);
    }
    const int keys = count_keys(bass, count);
    for (int k = 0; k < count; ++k) {
      const bool fresh = at[k] < 0;
      if (fresh) {
        for (int s = 0; s < kStrings && at[k] < 0; ++s) {
          if (strings_[s].state == kFree) at[k] = s;
        }
      }
      String& string = strings_[at[k]];
      if (fresh) {
        string = String();
        string.note = notes[k];
        string.bass = bass[k];
      }
      if (string.state != kHeldDown) {
        string.state = kHeldDown;
        tune(string);
        listen(string);
        decay(string);
        weigh(string);
      }
      string.pan = bass[k] || keys < 2 ? 0.0f : -1.0f + 2.0f * static_cast<float>(k) / static_cast<float>(keys - 1);
      if (fresh) {
        place(string);
        string.place = string.pan * param(silent_keys::kWidth);
        string.loud = string.level;
        kit::pan_gains(string.place, &string.left, &string.right);
        string.left *= string.loud;
        string.right *= string.loud;
      }
    }
    return true;
  }

  static int count_keys(const bool* bass, int count) {
    int keys = 0;
    for (int k = 0; k < count; ++k) keys += bass[k] ? 0 : 1;
    return keys;
  }

  // The string of a key that is held or still dying under its damper.
  int find(int note, bool bass) const {
    for (int s = 0; s < kStrings; ++s) {
      const String& string = strings_[s];
      if ((string.state == kHeldDown || string.state == kDying) && string.note == note && string.bass == bass) return s;
    }
    return -1;
  }

  // The damper comes down: nothing drives it any more, and it dies in Damper.
  void let_go(String& string) {
    string.state = kDying;
    string.age = ++serial_;
    for (int m = 0; m < kModes; ++m) {
      string.drive[m] = 0.0f;
      string.y_re[m] = string.y_im[m] = 0.0f;
      string.near_re[m] = string.near_im[m] = string.lean_re[m] = string.lean_im[m] = 0.0f;
    }
    decay(string);
  }

  // Where the partials lie.
  void tune(String& string) {
    const float sr = sample_rate();
    const float hz = kit::midi_to_hz(static_cast<float>(string.note) + 0.01f * param(silent_keys::kTune));
    const float top = kit::min(kTopShare * sr, kTopHz);
    string.count = 0;
    for (int m = 0; m < kModes; ++m) {
      const float n = static_cast<float>(m + 1);
      const float f = hz * n * std::sqrt((1.0f + kInharmonicity * n * n) / (1.0f + kInharmonicity));
      if (f >= top) break;
      const float w = kit::kTwoPi * f / sr;
      string.hz[m] = f;
      string.turn_re[m] = std::cos(w);
      string.turn_im[m] = std::sin(w);
      string.tick_re[m] = std::cos(w * kTick);
      string.tick_im[m] = std::sin(w * kTick);
      string.count = m + 1;
    }
    for (int m = string.count; m < kModes; ++m) {
      string.hear_re[m] = string.hear_im[m] = string.hear_in[m] = string.step_re[m] = string.step_im[m] = 0.0f;
      string.y_re[m] = string.y_im[m] = string.z_re[m] = string.z_im[m] = 0.0f;
      string.drive[m] = 0.0f;
      string.near_re[m] = string.near_im[m] = string.lean_re[m] = string.lean_im[m] = 0.0f;
    }
  }

  // How long each listener hears, and how far out of tune it still counts.
  void listen(String& string) {
    const float seconds = kListenFrom * std::pow(kListenSpan, param(silent_keys::kSharpness));
    const float share = kit::cents_to_ratio(kOffFrom * std::pow(kOffSpan, param(silent_keys::kSharpness))) - 1.0f;
    for (int m = 0; m < string.count; ++m) {
      const float a = kit::time_to_coeff(seconds * std::sqrt(220.0f / string.hz[m]), sample_rate());
      string.hear_re[m] = a * string.turn_re[m];
      string.hear_im[m] = a * string.turn_im[m];
      string.hear_in[m] = 2.0f * (1.0f - a);
      const float heard = seconds * std::sqrt(220.0f / string.hz[m]);
      string.near_move[m] = 1.0f - kit::time_to_coeff(kNearSeconds, sample_rate() / kTick);
      string.lean_move[m] = 1.0f - kit::time_to_coeff(kit::max(heard, kLeanSeconds), sample_rate() / kTick);
      const float off = kit::max(string.hz[m] * share, kLeastOffHz);
      string.tolerance[m] = kit::kTwoPi * off * kTick / sample_rate();
    }
  }

  float decay_seconds(float hz) const {
    return param(silent_keys::kRing) * kit::clamp(std::pow(220.0f / hz, 0.4f), 0.25f, 1.5f);
  }

  // How long each mode lasts: Ring, and the damper with it once it is down.
  void decay(String& string) {
    const float damper = string.state == kHeldDown ? 0.0f : 1000.0f / param(silent_keys::kDamper);
    for (int m = 0; m < string.count; ++m) {
      const float r = std::exp(-kSixtyDb * (1.0f / decay_seconds(string.hz[m]) + damper) / sample_rate());
      string.step_re[m] = r * string.turn_re[m];
      string.step_im[m] = r * string.turn_im[m];
    }
  }

  // How strongly each partial answers.
  void weigh(String& string) {
    const int partials = whole(param(silent_keys::kPartials));
    const float tilt = param(silent_keys::kTilt);
    for (int m = 0; m < string.count; ++m) {
      const float gain = kit::db_to_gain(tilt * std::log2(static_cast<float>(m + 1)));
      string.base[m] =
          m < partials ? kDriveScale * gain * std::sqrt(4.0f / decay_seconds(string.hz[m])) / sample_rate() : 0.0f;
    }
  }

  void place(String& string) { string.level = string.bass ? param(silent_keys::kBass) : 1.0f; }

  // Nothing sounds and nothing is on its way: every state at zero.
  void begin_rest() {
    resting_ = true;
    for (int s = 0; s < kStrings; ++s) strings_[s].state = kFree;
    tick_left_ = 0;
    heard_ = loud_ = 0.0f;
    pass(0);
    settle_at_rest();
  }

  // `count` samples of rest: the walk goes on, until it has been long enough
  // to start again.
  void pass(int count) {
    const int before = now_;
    silent_ = silent_ < kLongSilence ? silent_ + count : kLongSilence;
    if (silent_ >= pause_ && silent_ >= step_length_) {
      now_ = chord_of(param(silent_keys::kChord));
      walked_ = 0;
    } else if (walking()) {
      walked_ += count;
      while (walked_ >= step_length_) {
        walked_ -= step_length_;
        now_ = after(now_);
      }
    }
    if (now_ != before) settle_at_rest();
  }

  int after(int chord) const { return chord + 1 < whole(param(silent_keys::kCount)) ? chord + 1 : 0; }

  // At rest a knob is where it points.
  void settle_at_rest() {
    dry_gain_.snap(dry_gain_.target);
    wet_gain_.snap(wet_gain_.target);
    output_.snap(output_.target);
    int notes[kHeld];
    const int count = keys_of(now_, notes);
    for (int k = 0; k < kKeys; ++k) held_note_[k] = k < count ? notes[k] : -1;
  }

  // The first sample of sound after a rest.
  void arrive() {
    resting_ = false;
    settle_at_rest();
    low_cut_.reset();
    side_cut_.reset();
    low_cut_hz_ = param(silent_keys::kLowCut);
    set_low_cut();
    chord_due_ = tune_due_ = listen_due_ = decay_due_ = weigh_due_ = false;
    chord_due_ = !hold();
    tick_left_ = 0;
    silent_ = 0;
  }

  void set_low_cut() {
    low_cut_.set(low_cut_hz_, kit::kSqrtHalf, sample_rate());
    side_cut_.set(low_cut_hz_, kit::kSqrtHalf, sample_rate());
  }

  bool all_dead() const {
    for (int s = 0; s < kStrings; ++s) {
      if (strings_[s].state != kFree && strings_[s].energy >= kFloorEnergy) return false;
    }
    return true;
  }

  // Once every kTick samples, counted from the last start.
  void control() {
    using namespace silent_keys;
    if (walking()) {
      if (walked_ >= step_length_) {
        walked_ -= step_length_;
        if (walked_ >= step_length_) walked_ = 0;
        now_ = after(now_);
        chord_due_ = true;
      }
      walked_ += kTick;
    }
    if (chord_due_) chord_due_ = !hold();
    if (tune_due_ || listen_due_ || decay_due_ || weigh_due_) {
      for (int s = 0; s < kStrings; ++s) {
        String& string = strings_[s];
        if (string.state == kFree) continue;
        if (tune_due_) tune(string);
        if (tune_due_ || listen_due_) listen(string);
        if (tune_due_ || decay_due_) decay(string);
        if (tune_due_ || decay_due_ || weigh_due_) weigh(string);
      }
      tune_due_ = listen_due_ = decay_due_ = weigh_due_ = false;
    }
    if (low_cut_hz_ != param(kLowCut)) {
      low_cut_hz_ += (param(kLowCut) - low_cut_hz_) * pan_move_;
      if (std::fabs(low_cut_hz_ - param(kLowCut)) < 0.01f) low_cut_hz_ = param(kLowCut);
      set_low_cut();
    }

    // What the strings hold, and what that leaves of the drive: the chord's
    // and the bass strings' apart.
    float held[2] = {0.0f, 0.0f};
    for (int s = 0; s < kStrings; ++s) {
      String& string = strings_[s];
      if (string.state == kFree) continue;
      float energy = 0.0f;
      for (int m = 0; m < string.count; ++m) {
        const float e = string.z_re[m] * string.z_re[m] + string.z_im[m] * string.z_im[m];
        if (e < kTiny) string.z_re[m] = string.z_im[m] = 0.0f;
        energy += e;
      }
      string.energy = energy;
      if (string.state == kHeldDown) {
        held[string.bass ? 1 : 0] += energy;
      } else if (energy < kFloorEnergy || (string.state == kFading && --string.fade < 0)) {
        string.state = kFree;
        continue;
      }
      move(string);
    }
    if (heard_ < 1.0e-20f) heard_ = 0.0f;
    if (loud_ < 1.0e-20f) loud_ = 0.0f;
    const float sharp = param(kSharpness);
    const float knee = sharp > 0.0f ? kGateFrom * std::pow(kGateSpan, sharp * sharp) * kit::min(1.0f, 10.0f * sharp) : 0.0f;
    const float open = kit::min(1.0f, 10.0f * sharp);
    const float floor = 2.0f * heard_ * knee + 1.0e-20f;
    const float lift = kit::db_to_gain(param(kLift));
    const float most = kit::clamp(kLevelShare * loud_, 1.0e-12f, kLevelPower);
    float gains[2];
    for (int g = 0; g < 2; ++g) {
      const float over = kit::min(held[g] / most, 1.0e6f);
      gains[g] = lift / (1.0f + over * over);
    }
    for (int s = 0; s < kStrings; ++s) {
      String& string = strings_[s];
      if (string.state != kHeldDown) continue;
      const float gain = gains[string.bass ? 1 : 0];
      for (int m = 0; m < string.count; ++m) {
        if (string.y_re[m] * string.y_re[m] + string.y_im[m] * string.y_im[m] < kTiny) {
          string.y_re[m] = string.y_im[m] = 0.0f;
        }
        // The listener, heard once more at the tick's rate, so what is far
        // off the partial has less of a say. How far it turned in this tick
        // against the partial itself is averaged by power, so a loud moment
        // out of tune is not forgotten in the quiet after it.
        const float pr = string.near_re[m] * string.tick_re[m] - string.near_im[m] * string.tick_im[m];
        const float pi = string.near_re[m] * string.tick_im[m] + string.near_im[m] * string.tick_re[m];
        const float nr = pr + (string.y_re[m] - pr) * string.near_move[m];
        const float ni = pi + (string.y_im[m] - pi) * string.near_move[m];
        string.lean_re[m] += (nr * pr + ni * pi - string.lean_re[m]) * string.lean_move[m];
        string.lean_im[m] += (ni * pr - nr * pi - string.lean_im[m]) * string.lean_move[m];
        const float power = nr * nr + ni * ni;
        string.near_re[m] = power < kTiny ? 0.0f : nr;
        string.near_im[m] = power < kTiny ? 0.0f : ni;
        if (power < kTiny && string.lean_re[m] < kTiny) string.lean_re[m] = string.lean_im[m] = 0.0f;
        float tuned = 1.0f;
        if (sharp > 0.0f) {
          // In units of the tolerance; a turn past a quarter is as good as none.
          const float re = string.lean_re[m];
          const float off = re > 1.0e-30f ? kit::clamp(string.lean_im[m] / (re * string.tolerance[m]), -1.0e3f, 1.0e3f) : 1.0e3f;
          const float off2 = off * off;
          tuned = 1.0f / (1.0f + off2 * off2 * off2 * open);
        }
        string.drive[m] = string.base[m] * gain * tuned * (power / (power + floor));
      }
    }
  }

  // A string's place and level on their way to where they belong.
  void move(String& string) {
    place(string);
    string.place += (string.pan * param(silent_keys::kWidth) - string.place) * pan_move_;
    string.loud += (string.level - string.loud) * pan_move_;
    if (string.loud < 1.0e-9f) string.loud = 0.0f;
    float left, right;
    kit::pan_gains(string.place, &left, &right);
    float loud = string.loud;
    if (string.state == kFading) loud *= static_cast<float>(string.fade) / static_cast<float>(fade_length_);
    string.left_step = (left * loud - string.left) * (1.0f / kTick);
    string.right_step = (right * loud - string.right) * (1.0f / kTick);
  }

  // n samples from `from`, all inside one control tick.
  void render(int from, int n) {
    float middle[kTick], side[kTick], other_side[kTick], dry_left[kTick], dry_right[kTick], wet_left[kTick], wet_right[kTick], sum[kTick];
    for (int i = 0; i < n; ++i) {
      float l, r;
      take_input(from + i, &l, &r);
      dry_left[i] = l = guard(l);
      dry_right[i] = r = guard(r);
      if (l == 0.0f && r == 0.0f) {
        if (silent_ < kLongSilence) ++silent_;
      } else {
        silent_ = 0;
      }
      middle[i] = low_cut_.highpass(kit::clamp(0.5f * (l + r), -kDriveBound, kDriveBound));
      side[i] = side_cut_.highpass(kit::clamp(0.5f * (l - r), -kDriveBound, kDriveBound));
      other_side[i] = -side[i];
      const float power = middle[i] * middle[i] + side[i] * side[i];
      heard_ += (power - heard_) * (power > heard_ ? follow_up_ : follow_down_);
      loud_ += (power - loud_) * (power > loud_ ? follow_up_ : loud_down_);
      wet_left[i] = wet_right[i] = 0.0f;
    }
    for (int s = 0; s < kStrings; ++s) {
      String& string = strings_[s];
      if (string.state == kFree) continue;
      for (int i = 0; i < n; ++i) sum[i] = 0.0f;
      if (string.state == kHeldDown) {
        ring_held(string, middle, (string.note & 1) == 0 ? side : other_side, sum, n);
      } else {
        ring_free(string, sum, n);
      }
      for (int i = 0; i < n; ++i) {
        string.left += string.left_step;
        string.right += string.right_step;
        wet_left[i] += sum[i] * string.left;
        wet_right[i] += sum[i] * string.right;
      }
    }
    for (int i = 0; i < n; ++i) {
      const float dry = dry_gain_.next();
      const float wet = wet_gain_.next();
      const float out = output_.next();
      out_left_[from + i] = (dry_left[i] * dry + kit::soft_clip(wet_left[i]) * wet) * out;
      out_right_[from + i] = (dry_right[i] * dry + kit::soft_clip(wet_right[i]) * wet) * out;
    }
  }

  // The partials two by two: the listener on the sound, the mode on the
  // listener. (One partial's samples each wait for the one before, so two
  // side by side cost little more than one.) An odd last one runs beside a
  // silent mode past the count.
  static void ring_held(String& string, const float* middle, const float* side, float* sum, int n) {
    for (int m = 0; m < string.count; m += 2) {
      const int k = m + 1;
      const float hr = string.hear_re[m], hi = string.hear_im[m], hg = string.hear_in[m];
      const float kr = string.hear_re[k], ki = string.hear_im[k], kg = string.hear_in[k];
      const float ar = string.step_re[m], ai = string.step_im[m], ad = string.drive[m];
      const float br = string.step_re[k], bi = string.step_im[k], bd = string.drive[k];
      float yr = string.y_re[m], yi = string.y_im[m], zr = string.z_re[m], zi = string.z_im[m];
      float ur = string.y_re[k], ui = string.y_im[k], wr = string.z_re[k], wi = string.z_im[k];
      for (int i = 0; i < n; ++i) {
        const float in = middle[i], across = side[i];
        const float nyr = hr * yr - hi * yi + hg * in;
        const float nur = kr * ur - ki * ui + kg * in;
        yi = hi * yr + hr * yi + hg * across;
        ui = ki * ur + kr * ui - kg * across;
        yr = nyr;
        ur = nur;
        const float nzr = ar * zr - ai * zi + ad * yr;
        const float nwr = br * wr - bi * wi + bd * ur;
        zi = ai * zr + ar * zi + ad * yi;
        wi = bi * wr + br * wi + bd * ui;
        zr = nzr;
        wr = nwr;
        sum[i] += zr + wr;
      }
      string.y_re[m] = yr;
      string.y_im[m] = yi;
      string.z_re[m] = zr;
      string.z_im[m] = zi;
      string.y_re[k] = ur;
      string.y_im[k] = ui;
      string.z_re[k] = wr;
      string.z_im[k] = wi;
    }
  }

  // The same with nobody listening.
  static void ring_free(String& string, float* sum, int n) {
    for (int m = 0; m < string.count; m += 2) {
      const int k = m + 1;
      const float ar = string.step_re[m], ai = string.step_im[m];
      const float br = string.step_re[k], bi = string.step_im[k];
      float zr = string.z_re[m], zi = string.z_im[m];
      float wr = string.z_re[k], wi = string.z_im[k];
      for (int i = 0; i < n; ++i) {
        const float nzr = ar * zr - ai * zi;
        const float nwr = br * wr - bi * wi;
        zi = ai * zr + ar * zi;
        wi = bi * wr + br * wi;
        zr = nzr;
        wr = nwr;
        sum[i] += zr + wr;
      }
      string.z_re[m] = zr;
      string.z_im[m] = zi;
      string.z_re[k] = wr;
      string.z_im[k] = wi;
    }
  }

  void apply(int id) {
    using namespace silent_keys;
    const float value = param(id);
    if ((id >= kRoot1 && id <= kKey6) || id == kSpacing || id == kBass) {
      chord_due_ = true;
      return;
    }
    switch (id) {
      case kChord:
        now_ = chord_of(value);
        walked_ = 0;
        chord_due_ = true;
        break;
      case kEvery:
        step_length_ = value < 0.125f ? 0 : static_cast<long>(kit::max(value, 0.25f) * sample_rate());
        if (step_length_ == 0) {
          walked_ = 0;
          chord_due_ = chord_due_ || now_ != chord_of(param(kChord));
          now_ = chord_of(param(kChord));
        }
        break;
      case kPartials:
      case kTilt:
        weigh_due_ = true;
        break;
      case kSharpness:
        listen_due_ = true;
        break;
      case kRing:
      case kDamper:
        decay_due_ = true;
        break;
      case kTune:
        tune_due_ = true;
        break;
      case kMix: {
        float dry, wet;
        kit::equal_power(value, &dry, &wet);
        // The table's ends, exactly: the dry sound alone and the strings alone.
        dry_gain_.set(value >= 1.0f ? 0.0f : dry, primed());
        wet_gain_.set(value <= 0.0f ? 0.0f : wet, primed());
        break;
      }
      case kOutput:
        output_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // Count, Lift, Low cut, Width: read on every tick
    }
  }

  String strings_[kStrings];
  kit::Svf low_cut_, side_cut_;
  kit::Smoother dry_gain_, wet_gain_, output_;
  int held_note_[kKeys] = {-1, -1, -1, -1, -1, -1};
  int now_ = 0;             // the chord held
  long step_length_ = 0;    // samples a chord is held, 0 when the list stands
  long walked_ = 0;         // samples since the chord came
  long serial_ = 0;         // counts dampers coming down
  long silent_ = 0;         // samples of exact silence at the input
  long rest_after_ = 1;
  long pause_ = 1;
  int fade_length_ = 1;
  int tick_left_ = 0;
  float heard_ = 0.0f;      // the power of what the strings hear
  float loud_ = 0.0f;       // the same, let go slowly
  float low_cut_hz_ = 50.0f;
  float follow_up_ = 0.0f, follow_down_ = 0.0f, loud_down_ = 0.0f, pan_move_ = 0.0f;
  bool resting_ = true;
  bool chord_due_ = false, tune_due_ = false, listen_due_ = false, decay_due_ = false, weigh_due_ = false;
};

}  // namespace livemix
