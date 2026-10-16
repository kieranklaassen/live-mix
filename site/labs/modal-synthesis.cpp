// Modal synthesis: Bells (cpp/devices/modal-bells) playing one note, one
// sample at a time, so each mode inside it can be read as it rings. Twin Bars
// (cpp/devices/twin-bars) plays the same key beside it: two bars of four modes
// each, a few hertz apart.
//
//   key down ─► the mallet's push ─► mode 1 ─┐
//                                 ├► mode 2 ─┤
//                                 ├► ...    ─┼─► added, each with its two gains ─► Volume ─► soft clip ─► out
//                                 └► mode n ─┘
//
// Nothing goes in: the lab presses a key 10 ms into the loop and lets it go
// after "Key held for".
//
// Read from the device: the state of each mode (the sound of the first six
// that differ in pitch, and the length of each as a level), and the output,
// with its level on each side and of the two sides together.
// Worked out here from the device's own numbers ("lesson"): the mallet's push,
// which is a local of the device's and is made again from its phase, its gain
// and a copy of its noise (the "pulseAgain" check holds it to the device's
// first mode), and the modes added with their gains (the "rebuilt" check holds
// that sum, through Volume and the clip, to the device's output).
// Computed by functions of the engine called on their own ("called"): the
// shape of each mode along the bar (ModalBells::weight) and how much of a push
// of the mallet's length ends up in a mode at each frequency
// (TwinBars::response).
//
// Beside the device runs what a bar is not: the same modes, struck as hard and
// dying as fast, moved to whole multiples of the lowest ("lesson").
//
// The build path puts the bank together in seven pieces, each a few lines of
// `Bank` below: one resonator; a mallet; several modes; their ratios; a decay
// for each; where it is struck; pairs and two sides. The step chosen changes
// only the "built" taps. Up to the sixth piece the build works its numbers out
// by itself, from the device's table of modes and its constants. The seventh
// takes the turn, the strike and the two gains of every mode from the device
// as it runs, so what it writes out again is the arithmetic. Two copies run:
// one at the step chosen, and one with every piece, whose sound is compared on
// every render with the device's output (the "builtDifference" check).
//
// The lab starts where the technique shows plainly: Material at Bar (the
// device starts at Singing bowl), whose ratios are a free bar's; Detune at 0
// (the device starts at 1 Hz), so the two halves of a pair ring as one; Decay
// at 3 s (12 s), so the modes are seen to die inside the loop; Hardness at 0.8
// (0.45) and Position at 0, the end of the bar (0.15), so the mallet starts
// every mode and none lies near a still point; and Volume at 0 dB (-9 dB), so
// the note is heard beside the rest of the site.

#include "lab.h"

#include "../../cpp/devices/modal-bells/modal_bells.h"
#include "../../cpp/devices/twin-bars/twin_bars.h"

using namespace livemix;

namespace {

ModalBells bells;
TwinBars twins;

using Voice = ModalBells::Voice;

constexpr int kSlots = ModalBells::kSlots;
constexpr int kKey = 1;
constexpr float kStrike = 0.8f;
constexpr int kKeyDown = 480;  // the key goes down 10 ms into the loop
constexpr int kShown = 6;      // the modes that have taps of their own
constexpr int kShapes = 4;     // and the shapes that are drawn

lab::Control note{"note", "Pitch", "Hz", 110.0f, 880.0f, 220.0f, lab::kLog};
lab::Control decay{"decay", "Decay", "s", 0.2f, 40.0f, 3.0f, lab::kLog};
lab::Control damping{"damping", "Damping", "", 0.0f, 1.0f, 0.4f};
lab::Control position{"position", "Position", "", 0.0f, 1.0f, 0.0f};
lab::Control hardness{"hardness", "Hardness", "", 0.0f, 1.0f, 0.8f};
lab::Control material{"material", "Material", "", 0.0f, 6.0f, 3.0f, lab::kLinear,
                      "Church bell|Singing bowl|Vibraphone|Bar|Kalimba|Glass|Gong"};
lab::Control detune{"detune", "Detune", "Hz", 0.0f, 8.0f, 0.0f};
lab::Control stretch{"stretch", "Stretch", "", 0.5f, 1.5f, 1.0f};
lab::Control sustain{"sustain", "Sustain", "", 0.0f, 1.0f, 0.0f};
lab::Control brightness{"brightness", "Brightness", "", 0.0f, 1.0f, 0.5f};
lab::Control hold{"hold", "Key held for", "s", 0.25f, 4.0f, 3.0f};
lab::Control release{"release", "Release", "", 0.0f, 1.0f, 0.25f};
lab::Control spread{"spread", "Spread", "", 0.0f, 1.0f, 0.6f};
lab::Control beat{"beat", "Beat", "Hz", 0.5f, 20.0f, 4.0f, lab::kLog};
lab::Control volume{"volume", "Volume", "dB", -48.0f, 6.0f, 0.0f};

lab::Tap pulse_tap{"pulse", "The mallet's push", lab::kAudio, lab::kLesson, 1};
lab::Tap mallet{"mallet", "What the push leaves in a mode", lab::kCurve, lab::kCalled, 1, "dB"};
lab::Tap shape1{"shape1", "Mode 1's shape", lab::kCurve, lab::kCalled, 1};
lab::Tap shape2{"shape2", "Mode 2's shape", lab::kCurve, lab::kCalled, 1};
lab::Tap shape3{"shape3", "Mode 3's shape", lab::kCurve, lab::kCalled, 1};
lab::Tap shape4{"shape4", "Mode 4's shape", lab::kCurve, lab::kCalled, 1};
lab::Tap mode1{"mode1", "Mode 1", lab::kAudio, lab::kDevice, 1};
lab::Tap mode2{"mode2", "Mode 2", lab::kAudio, lab::kDevice, 1};
lab::Tap mode3{"mode3", "Mode 3", lab::kAudio, lab::kDevice, 1};
lab::Tap mode4{"mode4", "Mode 4", lab::kAudio, lab::kDevice, 1};
lab::Tap mode5{"mode5", "Mode 5", lab::kAudio, lab::kDevice, 1};
lab::Tap mode6{"mode6", "Mode 6", lab::kAudio, lab::kDevice, 1};
lab::Tap level1{"level1", "Mode 1's level", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap level2{"level2", "Mode 2's level", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap level3{"level3", "Mode 3's level", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap level4{"level4", "Mode 4's level", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap level5{"level5", "Mode 5's level", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap level6{"level6", "Mode 6's level", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap whole_tap{"whole", "The same modes at whole multiples", lab::kAudio, lab::kLesson, 1};
lab::Tap whole_partials{"wholePartials", "Partials at whole multiples", lab::kFrames, lab::kLesson, 1, "dB"};
lab::Tap sum_tap{"sum", "The modes added", lab::kAudio, lab::kLesson, 2};
lab::Tap twin_tap{"twin", "Two bars, a Beat apart", lab::kAudio, lab::kDevice, 2};
lab::Tap twin_level{"twinLevel", "The two bars' level", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap left_level{"levelLeft", "The left side's level", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap right_level{"levelRight", "The right side's level", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap level{"level", "The note's level", lab::kControl, lab::kDevice, 1, "dB"};
lab::Tap partials{"partials", "The note's partials", lab::kFrames, lab::kDevice, 1, "dB"};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};

lab::Check rebuilt{"rebuilt", "The modes added again, through Volume and the clip, against the device's output", "dB"};
lab::Check pulse_again{"pulseAgain", "The push worked out again and put into mode 1, against the device's mode 1", "dB"};
lab::Check pulse_samples{"pulseSamples", "The mallet's push", "samples"};
lab::Check mode_count{"modeCount", "Modes the note is made of", ""};

lab::Tap* const kModeTaps[kShown] = {&mode1, &mode2, &mode3, &mode4, &mode5, &mode6};
lab::Tap* const kLevelTaps[kShown] = {&level1, &level2, &level3, &level4, &level5, &level6};
lab::Tap* const kShapeTaps[kShapes] = {&shape1, &shape2, &shape3, &shape4};

// ---------------------------------------------------------------------------
// Measuring.

// The mean square of the last `length` samples: with `length` one period, the
// level of a note with no ripple on it.
struct MeanSquare {
  float ring[1024];
  int length = 1;
  int at = 0;
  double sum = 0.0;

  void reset(int samples) {
    length = samples < 1 ? 1 : (samples > 1024 ? 1024 : samples);
    at = 0;
    sum = 0.0;
    for (int i = 0; i < length; ++i) ring[i] = 0.0f;
  }
  float push(float x) {
    const float square = x * x;
    sum += static_cast<double>(square) - static_cast<double>(ring[at]);
    ring[at] = square;
    at = at + 1 < length ? at + 1 : 0;
    return sum > 0.0 ? static_cast<float>(sum / length) : 0.0f;
  }
};

float level_db(float mean_square) { return kit::max(lab::power_to_db(mean_square), -120.0f); }

// ---------------------------------------------------------------------------
// Reading the device.

void configure() {
  using namespace modal_bells;
  bells.init(lab::kSampleRate);
  bells.set_param(kMaterial, static_cast<float>(material.choice()));
  bells.set_param(kDecay, decay.value);
  bells.set_param(kDamping, damping.value);
  bells.set_param(kHardness, hardness.value);
  bells.set_param(kPosition, position.value);
  bells.set_param(kDetune, detune.value);
  bells.set_param(kStretch, stretch.value);
  bells.set_param(kSustain, sustain.value);
  bells.set_param(kBrightness, brightness.value);
  bells.set_param(kRelease, release.value);
  bells.set_param(kSpread, spread.value);
  bells.set_param(kVolume, volume.value);

  // Twin Bars at its own defaults but for these: the same Decay as far as its range goes,
  // the same Volume, and the lab's Beat.
  twins.init(lab::kSampleRate);
  twins.set_param(twin_bars::kBeat, beat.value);
  twins.set_param(twin_bars::kDecay, decay.value);
  twins.set_param(twin_bars::kVolume, volume.value);
}

// The voice that plays the lab's key, while it sounds.
Voice* voice_of() {
  for (int v = 0; v < ModalBells::kMaxVoices; ++v) {
    Voice& voice = bells.pool_.voices[v];
    if (voice.sounding && bells.pool_.note_id_of(v) == kKey) return &voice;
  }
  return nullptr;
}

// The first slot of each mode that differs in pitch from the one before it: a
// pair's two halves stand side by side in the table, at one ratio.
int slots_[kSlots];
int distinct_ = 0;

void find_modes(int which) {
  const ModalBells::Table& table = ModalBells::table(which);
  distinct_ = 0;
  float last = -1.0f;
  for (int k = 0; k < table.count; ++k) {
    if (table.modes[k].ratio == last) continue;
    last = table.modes[k].ratio;
    slots_[distinct_++] = k;
  }
}

// The shape of each of the first four modes, from the edge (0) to the middle
// (1): what Position reads.
void shape_curves(int which) {
  constexpr int kPoints = 101;
  const ModalBells::Table& table = ModalBells::table(which);
  for (int n = 0; n < kShapes; ++n) {
    lab::Tap& tap = *kShapeTaps[n];
    if (!tap.open(kPoints)) return;
    tap.x0 = 0.0f;
    tap.x1 = 1.0f;
    if (n >= distinct_) continue;
    const ModalBells::Mode& mode = table.modes[slots_[n]];
    for (int p = 0; p < kPoints; ++p) {
      const float x = static_cast<float>(p) / static_cast<float>(kPoints - 1);
      tap.set(p, ModalBells::weight(table.family, mode.a, mode.b, x));
    }
  }
}

// How much of a raised-cosine push `length` samples long ends up in a mode, at
// each frequency: Twin Bars' own function, which takes the push's length in
// periods of the mode.
void mallet_curve(float length) {
  constexpr int kPoints = 241;
  if (!mallet.open(kPoints)) return;
  mallet.x0 = 20.0f;
  mallet.x1 = 20000.0f;
  mallet.scale = lab::kLog;
  for (int p = 0; p < kPoints; ++p) {
    const float hz = 20.0f * std::pow(1000.0f, static_cast<float>(p) / static_cast<float>(kPoints - 1));
    mallet.set(p, kit::max(lab::to_db(TwinBars::response(hz * length / lab::kSampleRate)), -80.0f));
  }
}

// ---------------------------------------------------------------------------
// The build path: the bank put together a piece at a time.

// The pieces, in the order the steps add them.
enum Piece : int { kOne = 0, kMallet = 1, kSeveral = 2, kRatios = 3, kDecays = 4, kWhere = 5, kSides = 6 };

// Until the bank knows where it is struck, every mode is pushed alike: this
// much of the push for each, shared between the two halves of a pair.
constexpr float kEven = 0.3f;

// A bank of modes: what each needs to ring, and the mallet that starts them.
// `like` is the device's own note, read as it runs.
struct Bank {
  int step = 0;
  bool whole = false;  // part 1's comparison: every mode moved to a whole multiple of the lowest
  int count = 0;
  float step_re[kSlots], step_im[kSlots];  // one sample's turn, shrunk by one sample's decay
  float re[kSlots], im[kSlots];            // the mode itself
  float strike[kSlots];                    // how much of the push it is given
  // The mallet.
  float kick = 0.0f;
  float pulse = 1.0f, pulse_step = 0.0f, pulse_gain = 0.0f;
  kit::Rng rng;
  float push = 0.0f;                 // what went into the bank on this sample
  float left = 0.0f, right = 0.0f;   // the sound so far

  void clear() {
    for (int k = 0; k < kSlots; ++k) re[k] = im[k] = 0.0f;
  }

  void start(int at, bool whole_multiples) {
    step = at;
    whole = whole_multiples;
    count = 0;
    kick = push = left = right = 0.0f;
    pulse = 1.0f;
    for (int k = 0; k < kSlots; ++k) step_re[k] = step_im[k] = strike[k] = 0.0f;
    clear();
  }

  // Where one mode turns and how fast it dies: `hz` and the seconds it takes to fall 60 dB.
  void set_mode(int k, float hz, float seconds) {
    if (hz >= ModalBells::kTopOfBand * lab::kSampleRate) {
      step_re[k] = step_im[k] = 0.0f;  // out of band: the mode does not exist
      return;
    }
    const float w = kit::kTwoPi * hz / lab::kSampleRate;
    const float radius = std::exp(-ModalBells::kSixtyDb / (seconds * lab::kSampleRate));
    step_re[k] = radius * std::cos(w);
    step_im[k] = radius * std::sin(w);
  }

  // The key goes down: the modes are laid out and the mallet starts.
  void strike_now(const Voice& like) {
    const ModalBells::Table& table = ModalBells::table(like.material);
    count = step >= kSeveral ? like.count : 1;
    // The mallet, as the device has just set it: one sample of all its push, or the push itself.
    kick = step < kMallet ? like.pulse_gain / (2.0f * like.pulse_step) : 0.0f;
    pulse = step < kMallet ? 1.0f : 0.0f;
    pulse_step = like.pulse_step;
    pulse_gain = like.pulse_gain;
    rng = like.rng;
    if (step >= kSides) return;  // the last piece reads each mode from the device as it runs

    const float lowest = table.modes[0].ratio;
    const float extra = ModalBells::kLeastDamping * std::pow(ModalBells::kDampingSpan, damping.value);
    int number = 0;  // of the mode among those that differ in pitch, from 1
    float last = -1.0f;
    for (int k = 0; k < count; ++k) {
      const ModalBells::Mode& mode = table.modes[k];
      if (mode.ratio != last) ++number;
      last = mode.ratio;
      // Several modes: at whole multiples of the lowest.
      float ratio = lowest * static_cast<float>(number);
      // Their ratios: where the material's table puts them.
      if (step >= kRatios && !whole) ratio = mode.ratio;
      // A decay for each: the higher a mode stands over the lowest, the sooner it dies.
      float seconds = decay.value;
      if (step >= kDecays) seconds = decay.value / (1.0f + extra * (mode.ratio / lowest - 1.0f));
      set_mode(k, like.frequency * ratio, seconds);
      // Every mode pushed alike, the two halves of a pair sharing one push.
      strike[k] = count == 1 ? kEven : (mode.mate != 0.0f ? 0.5f * kEven : kEven);
      // Where it is struck: the mode's own level, times its shape at the strike point.
      if (step >= kWhere) {
        strike[k] = table.gain * mode.level * ModalBells::weight(table.family, mode.a, mode.b, position.value);
      }
    }
  }

  // The mallet's push for this sample: a raised cosine with a little noise on it.
  float mallet_push() {
    if (kick != 0.0f) {
      const float all_at_once = kick;
      kick = 0.0f;
      return all_at_once;
    }
    if (pulse >= 1.0f) return 0.0f;
    const float window = 0.5f - 0.5f * kit::SineTable::cos_lookup(pulse + 0.5f * pulse_step);
    const float value = pulse_gain * window * (1.0f + ModalBells::kPulseNoise * rng.bipolar());
    pulse += pulse_step;
    return value;
  }

  // On the device's control clock, with every piece in: rubbing wakes a mode
  // that lies still, as the device does. At any step, a mode that has died
  // away to nothing is set to nothing.
  void tick(const Voice& like) {
    const bool rubbing = step >= kSides && !like.released && sustain.value > 0.0f;
    const float rub_level = ModalBells::kRubLevel * sustain.value * like.strength;
    for (int k = 0; k < count; ++k) {
      const float power = re[k] * re[k] + im[k] * im[k];
      if (rubbing && like.rub[k] > 0.0f && like.radius[k] > 0.0f) {
        const float target = like.rub[k] * rub_level;
        if (std::sqrt(power) < 1.0e-4f * target) {
          re[k] = 1.0e-4f * target;
          im[k] = 0.0f;
        }
      } else if (power < 1.0e-24f) {
        re[k] = im[k] = 0.0f;
      }
    }
  }

  // One sample of the bank so far.
  void run(const Voice& like, float volume_now) {
    push = mallet_push();
    left = right = 0.0f;
    for (int k = 0; k < count; ++k) {
      // One resonator: a number with two parts, turned and shrunk a little.
      const float turn_re = step >= kSides ? like.step_re[k] : step_re[k];
      const float turn_im = step >= kSides ? like.step_im[k] : step_im[k];
      const float hit = step >= kSides ? like.strike[k] : strike[k];
      const float turned = turn_re * re[k] - turn_im * im[k] + hit * push;
      im[k] = turn_re * im[k] + turn_im * re[k];
      re[k] = turned;
      if (step < kSides) {
        left += im[k];
        right += im[k];
      } else {
        // Pairs and two sides: each mode has a gain for the left and one for the right.
        left += like.left[k] * im[k];
        right += like.right[k] * im[k];
      }
    }
    if (step < kSides) return;
    left = kit::soft_clip(left * volume_now);
    right = kit::soft_clip(right * volume_now);
  }

  // The length of mode `k`, which is its amplitude, in dB.
  float level_of(int k) const { return level_db(re[k] * re[k] + im[k] * im[k]); }
};

lab::Build build{"One resonator|A mallet|Several modes|Their ratios|A decay for each|Where it is struck|"
                 "Pairs and two sides",
                 kSides, -120.0f, "The bank as built, all seven pieces, against the device's own output"};

lab::Tap built{"built", "The bank so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_push{"builtPush", "What goes into the bank", lab::kAudio, lab::kLesson, 1};
lab::Tap built_low{"builtLow", "Mode 1's level, as built", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap built_mid{"builtMid", "Mode 3's level, as built", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap built_high{"builtHigh", "Mode 6's level, as built", lab::kControl, lab::kLesson, 1, "dB"};

Bank shown;   // at the step the reader chose: what the built taps hold
Bank held;    // with every piece: what is compared with the device
Bank wholes;  // the bar's modes at whole multiples, for part 1

}  // namespace

void lab_setup() {}

void lab_render(int frames) {
  configure();
  const int which = material.choice();
  find_modes(which);
  shape_curves(which);
  mode_count.value = static_cast<float>(ModalBells::table(which).count);

  const int total = lab::total();
  // Let go at the loop's end or after it, the key is never let go.
  const int release_at = kKeyDown + static_cast<int>(hold.value * lab::kSampleRate);
  const int period = static_cast<int>(lab::kSampleRate / note.value + 0.5f);
  MeanSquare of_note, of_left, of_right, of_twins;
  of_note.reset(period);
  of_left.reset(period);
  of_right.reset(period);
  of_twins.reset(period);

  shown.start(build.at(), false);
  held.start(build.compared_step, false);
  wholes.start(kWhere, true);

  Voice* voice = nullptr;
  float push_length = 0.0f;
  double rebuilt_apart = 0.0, rebuilt_whole = 0.0;
  double pulse_apart = 0.0, pulse_whole = 0.0;
  double built_apart = 0.0, built_whole = 0.0;

  for (int i = 0; i < total; ++i) {
    const int at = i % frames;
    const bool kept = i >= frames && i < 2 * frames;
    if (at == kKeyDown) {
      bells.note_on(kKey, note.value, kStrike);
      twins.note_on(kKey, note.value, kStrike);
      voice = voice_of();
      if (voice) {
        shown.strike_now(*voice);
        held.strike_now(*voice);
        wholes.strike_now(*voice);
        push_length = 1.0f / voice->pulse_step;
      }
    }
    if (at == release_at) {
      bells.note_off(kKey);
      twins.note_off(kKey);
    }

    // What the device is about to do on this sample: whether its control
    // clock ticks, and the push its mallet makes, from a copy of its noise.
    const bool ticking = bells.chunk_left_ == 0 || bells.idle_.asleep();
    float push_now = 0.0f, re_before = 0.0f, im_before = 0.0f;
    if (voice && voice->sounding) {
      re_before = voice->re[0];
      im_before = voice->im[0];
      if (voice->pulse < 1.0f) {
        kit::Rng noise = voice->rng;
        const float window = 0.5f - 0.5f * kit::SineTable::cos_lookup(voice->pulse + 0.5f * voice->pulse_step);
        push_now = voice->pulse_gain * window * (1.0f + ModalBells::kPulseNoise * noise.bipolar());
      }
    }

    bells.process(1);
    twins.process(1);
    const bool sounding = voice && voice->sounding;
    const float volume_now = bells.volume_.value;

    // The main path: each mode, and the modes added as the device adds them.
    float sum_left = 0.0f, sum_right = 0.0f;
    if (sounding) {
      for (int k = 0; k < voice->count; ++k) {
        sum_left += voice->left[k] * voice->im[k];
        sum_right += voice->right[k] * voice->im[k];
      }
    }
    const float out_left = bells.out_left()[0], out_right = bells.out_right()[0];
    if (kept) {
      const double again_left = kit::soft_clip(sum_left * volume_now), again_right = kit::soft_clip(sum_right * volume_now);
      rebuilt_apart += (again_left - out_left) * (again_left - out_left) + (again_right - out_right) * (again_right - out_right);
      rebuilt_whole += static_cast<double>(out_left) * out_left + static_cast<double>(out_right) * out_right;
      // The push, put into mode 1 by the device's own step, against what the
      // device made of mode 1. Left out on a tick, where rubbing may move the mode first.
      if (sounding && push_now != 0.0f && !ticking) {
        const double expected = static_cast<double>(voice->step_re[0] * re_before - voice->step_im[0] * im_before +
                                                    voice->strike[0] * push_now);
        pulse_apart += (expected - voice->re[0]) * (expected - voice->re[0]);
        pulse_whole += static_cast<double>(voice->re[0]) * voice->re[0];
      }
    }
    pulse_tap.put(i, push_now);
    for (int n = 0; n < kShown; ++n) {
      const bool there = sounding && n < distinct_;
      const int k = there ? slots_[n] : 0;
      kModeTaps[n]->put(i, there ? voice->im[k] : 0.0f);
      kLevelTaps[n]->put(i, there ? level_db(voice->re[k] * voice->re[k] + voice->im[k] * voice->im[k]) : -120.0f);
    }
    sum_tap.put(i, sum_left, sum_right);
    const float note_power = of_note.push(0.5f * (out_left + out_right));
    const float twin_left = twins.out_left()[0], twin_right = twins.out_right()[0];
    const float twin_power = of_twins.push(0.5f * (twin_left + twin_right));
    twin_tap.put(i, twin_left, twin_right);
    twin_level.put(i, level_db(twin_power));
    left_level.put(i, level_db(of_left.push(out_left)));
    right_level.put(i, level_db(of_right.push(out_right)));
    level.put(i, level_db(note_power));
    out_tap.put(i, out_left, out_right);

    // The build path: the step chosen, and every piece against the device.
    if (voice) {
      // With every piece in, the build forgets when the device does.
      if (!sounding) {
        held.clear();
        if (shown.step >= kSides) shown.clear();
      }
      if (ticking) {
        shown.tick(*voice);
        held.tick(*voice);
        wholes.tick(*voice);
      }
      shown.run(*voice, volume_now);
      held.run(*voice, volume_now);
      wholes.run(*voice, volume_now);
      if (kept) {
        const double apart_left = static_cast<double>(held.left) - out_left, apart_right = static_cast<double>(held.right) - out_right;
        built_apart += apart_left * apart_left + apart_right * apart_right;
        built_whole += static_cast<double>(out_left) * out_left + static_cast<double>(out_right) * out_right;
      }
    }
    whole_tap.put(i, wholes.left);
    built.put(i, shown.left, shown.right);
    built_push.put(i, shown.push);
    const bool several = shown.count > 1;
    built_low.put(i, shown.level_of(0));
    built_mid.put(i, several && distinct_ > 2 ? shown.level_of(slots_[2]) : -120.0f);
    built_high.put(i, several && distinct_ > 5 ? shown.level_of(slots_[5]) : -120.0f);
  }

  rebuilt.value = lab::ratio_db(rebuilt_apart, rebuilt_whole);
  pulse_again.value = lab::ratio_db(pulse_apart, pulse_whole);
  build.difference.value = lab::ratio_db(built_apart, built_whole);
  pulse_samples.value = push_length;
  mallet_curve(push_length);
  lab::spectrogram_tap(partials, out_tap.channel(0), frames);
  lab::spectrogram_tap(whole_partials, whole_tap.channel(0), frames);
}
