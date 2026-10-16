// Stereo: one sound placed between two speakers by the kit's pan law
// (kit::pan_gains, cpp/kit/math.h), and a pair of channels made wider or
// narrower by the engine's widener (cpp/devices/stereo-widener), run one
// sample at a time so that every stage of it can be kept.
//
//   loop ─┬─────────────────────────────────┐
//         └─► mono ─► pan law ─► placed ─► "Going in" picks one ─► widener ─► out
//
//   inside the widener:
//   going ─► split off the bass ─► mid and side ─► × their gains ─► back to left
//            and right ─► scatter ─► a short delay on the right ─► + the bass,
//            narrowed ─► out
//
// Read from the device: its output, the bass its two one-poles hold, and the
// five numbers its Width sets (the side's gain, the mid's gain, how much of
// the scatter, how much of the delay; the bass's share of its side is a local
// and is written again). The stages between are locals of the device's one
// function, so the lab keeps a copy of that function (`Built` below, with
// every piece switched in), feeds it what the device is fed, and reads the
// stages out of the copy: they are the lesson's. The copy's output is held to
// the device's on every render (the "builtDifference" check).
//
// Beside the widener a second device runs on the same sound: the engine's
// other widener (cpp/devices/spread), its three regions all at twice the
// Width and the rest at its defaults. It is here for what the lesson says
// about one speaker: what each of the two leaves of a sound when left and
// right are added.
//
// Every stage that is two channels is one tap. Where a picture needs one
// channel as a line of its own (left beside right, mid beside side) there is
// a tap of one channel for it, since a figure draws a tap's first channel.
//
// Pictures that are not the loop: the pan law as gains against Pan, with what
// the two gains come to as power and as a sum, for the kit's law and for a
// straight line; what Width sets, against Width; what one unit sample on both
// channels comes out as on each side, and what one speaker gets of each
// frequency from it; and the outline of the cloud that left makes against
// right, going in and coming out.
//
// The build part puts the whole of it together a piece at a time from one
// channel: the loop in mono. Eight pieces, each a function of `Built`: a
// straight line between the speakers; the kit's equal-power law; mid and
// side; their two gains; the bass kept narrow; the scatter; the short delay
// on the right; the sum to one speaker. Two copies run: one at the step the
// reader chose, on the loop in mono, which the "built" taps show; and one
// with the six pieces the engine has, which is fed what the device is fed
// and compared with the device's output, its pan law compared with the kit's.
// The first step and the last are the lesson's own.

// lab-sources: cpp/devices/stereo-widener/StereoWidener.cpp cpp/devices/stereo-widener/stereo_widener_device.cpp

#include "lab.h"

#include "../../cpp/devices/spread/spread.h"
#include "../../cpp/devices/stereo-widener/stereo_widener_device.h"

using namespace livemix;

namespace {

StereoWidenerDevice widener;
StereoWidener probe;  // the widener's own class, for one unit sample at this Width
StereoWidener asked;  // and for what each Width sets
Spread second;
Spread second_probe;

lab::Control feed{"feed", "Going in", "", 0.0f, 1.0f, 0.0f, lab::kLinear, "The loop as it is|In mono, placed by Pan"};
lab::Control pan{"pan", "Pan", "", -1.0f, 1.0f, -0.5f};
lab::Control width{"width", "Width", "", 0.0f, 1.0f, 0.75f};

lab::Tap in_tap{"in", "The loop", lab::kAudio, lab::kSource, 2};
lab::Tap placed{"placed", "The loop in mono, placed by Pan", lab::kAudio, lab::kKit, 2};
lab::Tap going{"going", "Going in", lab::kAudio, lab::kLesson, 2};
lab::Tap going_left{"goingLeft", "Left, going in", lab::kAudio, lab::kLesson, 1};
lab::Tap going_right{"goingRight", "Right, going in", lab::kAudio, lab::kLesson, 1};
lab::Tap going_mid{"goingMid", "Mid, going in", lab::kAudio, lab::kLesson, 1};
lab::Tap going_side{"goingSide", "Side, going in", lab::kAudio, lab::kLesson, 1};
lab::Tap bass{"bass", "The bass, split off", lab::kAudio, lab::kDevice, 2};
lab::Tap rest{"rest", "The rest, above the bass", lab::kAudio, lab::kLesson, 2};
lab::Tap mid{"mid", "Mid of the rest, times its gain", lab::kAudio, lab::kLesson, 1};
lab::Tap side{"side", "Side of the rest, times its gain", lab::kAudio, lab::kLesson, 1};
lab::Tap widened{"widened", "Mid and side put back", lab::kAudio, lab::kLesson, 2};
lab::Tap scattered{"scattered", "After the scatter", lab::kAudio, lab::kLesson, 2};
lab::Tap delayed{"delayed", "After the delay on the right", lab::kAudio, lab::kLesson, 2};
lab::Tap narrow{"narrow", "The bass, narrowed", lab::kAudio, lab::kLesson, 2};
lab::Tap out_left{"left", "Left, coming out", lab::kAudio, lab::kDevice, 1};
lab::Tap out_right{"right", "Right, coming out", lab::kAudio, lab::kDevice, 1};
lab::Tap out_side{"outSide", "Side, coming out", lab::kAudio, lab::kLesson, 1};
lab::Tap mono{"mono", "On one speaker: half of left and right added", lab::kAudio, lab::kLesson, 1};
lab::Tap second_out{"secondOut", "The second widener's output", lab::kAudio, lab::kDevice, 2};
lab::Tap second_mono{"secondMono", "The second widener on one speaker", lab::kAudio, lab::kLesson, 1};
lab::Tap alike_in{"alikeIn", "How alike left and right are, going in", lab::kControl, lab::kLesson, 1};
lab::Tap alike{"alike", "How alike left and right are, coming out", lab::kControl, lab::kLesson, 1};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};

lab::Tap law_left{"lawLeft", "Left's gain, equal power", lab::kCurve, lab::kKit, 1};
lab::Tap law_right{"lawRight", "Right's gain, equal power", lab::kCurve, lab::kKit, 1};
lab::Tap law_power{"lawPower", "Power of the two together, equal power", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap law_sum{"lawSum", "The two added, equal power", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap line_left{"lineLeft", "Left's gain, straight line", lab::kCurve, lab::kLesson, 1};
lab::Tap line_right{"lineRight", "Right's gain, straight line", lab::kCurve, lab::kLesson, 1};
lab::Tap line_power{"linePower", "Power of the two together, straight line", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap line_sum{"lineSum", "The two added, straight line", lab::kCurve, lab::kLesson, 1, "dB"};

lab::Tap side_gain{"sideGain", "The side's gain", lab::kCurve, lab::kDevice, 1};
lab::Tap mid_gain{"midGain", "The mid's gain", lab::kCurve, lab::kDevice, 1};
lab::Tap scatter_share{"scatterShare", "How much is scattered", lab::kCurve, lab::kDevice, 1};
lab::Tap delay_share{"delayShare", "How much of the right is delayed", lab::kCurve, lab::kDevice, 1};
lab::Tap bass_share{"bassShare", "The bass's side, kept", lab::kCurve, lab::kLesson, 1};

lab::Tap click_left{"clickLeft", "Left, from one sample", lab::kCurve, lab::kDevice, 1};
lab::Tap click_right{"clickRight", "Right, from one sample", lab::kCurve, lab::kDevice, 1};
lab::Tap left_response{"leftResponse", "Left alone", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap right_response{"rightResponse", "Right alone", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap mono_response{"monoResponse", "On one speaker", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap second_response{"secondResponse", "The second widener on one speaker", lab::kSpectrum, lab::kDevice, 1,
                         "dB"};

lab::Tap cloud_in{"cloudIn", "Right against left, going in", lab::kFrames, lab::kLesson, 1};
lab::Tap cloud_out{"cloudOut", "Right against left, coming out", lab::kFrames, lab::kLesson, 1};

lab::Check alike_before{"alikeBefore", "How alike left and right are going in, over the loop", ""};
lab::Check alike_after{"alikeAfter", "How alike left and right are coming out, over the loop", ""};
lab::Check side_change{"sideChange", "The side coming out against the side going in", "dB"};
lab::Check mono_change{"monoChange", "One speaker's level coming out against going in", "dB"};
lab::Check second_mono_change{"secondMonoChange", "The same for the second widener", "dB"};

lab::Tap built{"built", "The sound so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_left{"builtLeft", "Left, as built", lab::kAudio, lab::kLesson, 1};
lab::Tap built_right{"builtRight", "Right, as built", lab::kAudio, lab::kLesson, 1};
lab::Tap built_mid{"builtMid", "Mid, as built", lab::kAudio, lab::kLesson, 1};
lab::Tap built_side{"builtSide", "Side, as built", lab::kAudio, lab::kLesson, 1};
lab::Tap built_left_gain{"builtLeftGain", "Left's gain, as built", lab::kCurve, lab::kLesson, 1};
lab::Tap built_right_gain{"builtRightGain", "Right's gain, as built", lab::kCurve, lab::kLesson, 1};
lab::Tap built_power{"builtPower", "Power of the two together, as built", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap built_response{"builtResponse", "One speaker's share of each frequency, as built", lab::kSpectrum,
                        lab::kLesson, 1, "dB"};

// One of the widener's eight filters, as its source writes it: what goes in
// comes out three times. Once at once, turned over and scaled; once whole,
// `wait` samples later; and once more, scaled, when the ring of 512 has come
// all the way round.
struct Copies {
  static constexpr int kRing = 512;

  float ring[kRing] = {};
  int write = 0;
  int wait = 1;
  float gain = 0.5f;

  float process(float x) {
    const int read = (write - wait + kRing) % kRing;
    const float waited = ring[read];
    const float y = -gain * x + waited + gain * ring[write];
    ring[write] = x;
    write = (write + 1) % kRing;
    return y;
  }

  void clear() {
    for (float& slot : ring) slot = 0.0f;
    write = 0;
  }
};

// The sound so far: one function a piece, and play() to take a sample of the
// loop through the pieces there are.
struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kLine = 0, kCircle, kMidSide, kWidth, kBass, kScatter, kDelay, kMono };

  static constexpr int kFilters = 4;
  static constexpr int kLeftWaits[kFilters] = {7, 19, 37, 67};
  static constexpr int kRightWaits[kFilters] = {11, 29, 47, 79};
  static constexpr float kCopyGains[kFilters] = {0.5f, 0.6f, 0.55f, 0.65f};
  static constexpr int kLateRing = 64;
  static constexpr float kLateSeconds = 0.0008f;
  static constexpr float kBassHz = 200.0f;
  static constexpr float kGlideSeconds = 0.005f;
  static constexpr float kForgetSeconds = 0.1f;

  int pieces = kLine;
  float left_share = 1.0f;   // of the one sound, to each speaker
  float right_share = 0.0f;
  float mid = 0.0f;
  float side = 0.0f;
  float mid_gain = 1.0f;
  float side_gain = 1.0f;
  float pole = 0.0f;           // the bass filter's one number
  float low_state[2] = {0.0f, 0.0f};
  float low[2] = {0.0f, 0.0f};
  float low_side_kept = 1.0f;  // how much of its side the bass keeps
  Copies left_copies[kFilters];
  Copies right_copies[kFilters];
  float scatter = 0.0f;        // how much of the scattered sound is taken
  float late_ring[kLateRing] = {};
  int late_write = 0;
  int late_samples = 0;
  float late = 0.0f;           // how much of the right is the delayed right
  float out[2] = {0.0f, 0.0f};

  // What a stage held on the last sample, for the lab's taps of the stages.
  float seen_rest[2] = {0.0f, 0.0f};
  float seen_widened[2] = {0.0f, 0.0f};
  float seen_scattered[2] = {0.0f, 0.0f};
  float seen_delayed[2] = {0.0f, 0.0f};
  float seen_narrow[2] = {0.0f, 0.0f};

  // The Width as the device moves it: from its default, in a straight line, over 5 ms.
  float width_now = StereoWidenerDevice::kDefaultWidth;
  float width_to = StereoWidenerDevice::kDefaultWidth;
  float width_step = 0.0f;
  int glide_left = 0;
  int quiet = 0;      // samples of nothing so far
  int forget_at = 0;  // and how many it takes to forget

  // A straight line between the speakers: what the left gives up, the right
  // gets. Pan runs from -1, all left, to 1, all right.
  void line(float pan) {
    right_share = 0.5f * (pan + 1.0f);
    left_share = 1.0f - right_share;
  }

  // Equal power: Pan is an angle from 0 to a quarter turn, and the shares are
  // its cosine and its sine. Their squares add up to 1 wherever Pan stands.
  void circle(float pan) {
    const float angle = (kit::clamp(pan, -1.0f, 1.0f) + 1.0f) * (kit::kHalfPi * 0.5f);
    left_share = std::cos(angle);
    right_share = std::sin(angle);
  }

  // One sound to two speakers, each its share.
  void place(float sound) {
    out[0] = left_share * sound;
    out[1] = right_share * sound;
  }

  // Mid and side: half of what left and right add up to, and half of what is
  // left when the right is taken from the left.
  void apart() {
    mid = (out[0] + out[1]) * 0.5f;
    side = (out[0] - out[1]) * 0.5f;
  }

  // And back: left is mid plus side, right is mid less side.
  void together() {
    out[0] = mid + side;
    out[1] = mid - side;
  }

  // Width: a gain for each of the two. The side's is the width. The mid's
  // comes down as the side's goes up.
  void widen() {
    mid *= mid_gain;
    side *= side_gain;
  }

  // Keep the bass narrow: a one-pole low-pass on each channel takes what is
  // under 200 Hz out of the way, and the rest goes on to be widened.
  void split() {
    low[0] = low_state[0] = pole * low_state[0] + (1.0f - pole) * out[0];
    low[1] = low_state[1] = pole * low_state[1] + (1.0f - pole) * out[1];
    out[0] = out[0] - low[0];
    out[1] = out[1] - low[1];
  }

  // The bass comes back at the end, its own side turned down.
  void rejoin() {
    const float low_mid = (low[0] + low[1]) * 0.5f;
    float low_side = (low[0] - low[1]) * 0.5f;
    low_side *= low_side_kept;
    low[0] = low_mid + low_side;
    low[1] = low_mid - low_side;
    out[0] = low[0] + out[0];
    out[1] = low[1] + out[1];
  }

  // Scatter: each channel through four filters of its own, each of which
  // makes three copies, and some of that in place of the channel itself. The
  // two sides' copies fall at different moments, so the sides differ.
  void spread_out() {
    float copies_left = out[0];
    float copies_right = out[1];
    for (int k = 0; k < kFilters; ++k) {
      copies_left = left_copies[k].process(copies_left);
      copies_right = right_copies[k].process(copies_right);
    }
    out[0] = out[0] * (1.0f - scatter) + copies_left * scatter;
    out[1] = out[1] * (1.0f - scatter) + copies_right * scatter;
  }

  // A short delay on the right: the right channel as it was 38 samples ago,
  // in place of some of the right channel now.
  void hold_right() {
    late_ring[late_write] = out[1];
    const int read = (late_write - late_samples + kLateRing) % kLateRing;
    const float late_right = late_ring[read];
    out[1] = out[1] * (1.0f - late) + late_right * late;
    late_write = (late_write + 1) % kLateRing;
  }

  // The sum to one speaker: half of left and right added, on both sides.
  void sum() {
    const float one = 0.5f * (out[0] + out[1]);
    out[0] = one;
    out[1] = one;
  }

  // What a Width sets, as the widener works it out, for the pieces there are.
  void aim(float w) {
    side_gain = 1.0f;
    mid_gain = 1.0f;
    scatter = 0.0f;
    late = 0.0f;
    low_side_kept = 1.0f;
    if (pieces >= kWidth) {
      if (w <= 0.5f) {
        side_gain = w * 2.0f;
      } else {
        const float extra = (w - 0.5f) * 2.0f;
        side_gain = 1.0f + extra * 1.5f;
      }
      mid_gain = 1.0f / std::sqrt(0.5f * (1.0f + side_gain * side_gain));
    }
    if (pieces >= kBass) low_side_kept = kit::max(0.3f, 1.0f - w * 0.7f);
    if (pieces >= kScatter && w > 0.75f) scatter = (w - 0.75f) * 4.0f;
    if (pieces >= kDelay && w > 0.85f) late = (w - 0.85f) * (1.0f / 0.15f);
  }

  // What the device does round its widener: the Width glides to where it was
  // set, and after a tenth of a second of nothing at all everything is forgotten.
  void tend(float left, float right) {
    if (left == 0.0f && right == 0.0f) {
      if (quiet < forget_at && ++quiet == forget_at) clear();
    } else {
      quiet = 0;
    }
    if (glide_left > 0) {
      --glide_left;
      width_now = glide_left == 0 ? width_to : width_now + width_step;
      aim(width_now);
    }
  }

  // One sample of two channels through the widener's pieces, in the order it
  // meets them.
  void run(float left, float right) {
    tend(left, right);
    out[0] = left;
    out[1] = right;
    if (pieces >= kBass) split();
    if (pieces >= kMidSide) {
      apart();
      if (pieces >= kWidth) widen();
      together();
    }
    if (scatter > 0.001f) spread_out();
    if (late > 0.001f && late_samples > 0) hold_right();
    if (pieces >= kBass) rejoin();
    if (pieces >= kMono) sum();
  }

  // The same with every piece the engine has, keeping what each stage held:
  // for the lab's taps of the stages inside the device.
  void run_and_keep(float left, float right) {
    tend(left, right);
    out[0] = left;
    out[1] = right;
    split();
    seen_rest[0] = out[0];
    seen_rest[1] = out[1];
    apart();
    widen();
    together();
    seen_widened[0] = out[0];
    seen_widened[1] = out[1];
    if (scatter > 0.001f) spread_out();
    seen_scattered[0] = out[0];
    seen_scattered[1] = out[1];
    if (late > 0.001f && late_samples > 0) hold_right();
    seen_delayed[0] = out[0];
    seen_delayed[1] = out[1];
    rejoin();
    seen_narrow[0] = low[0];
    seen_narrow[1] = low[1];
  }

  // One sample of the loop in mono: placed, and then through the rest.
  void play(float sound) {
    place(sound);
    run(out[0], out[1]);
  }

  void start(int pieces_, float width_, float pan_) {
    pieces = pieces_;
    if (pieces >= kCircle) circle(pan_);
    else line(pan_);
    pole = std::exp(-2.0f * 3.14159265f * kBassHz / lab::kSampleRate);
    for (int k = 0; k < kFilters; ++k) {
      left_copies[k].wait = kLeftWaits[k];
      right_copies[k].wait = kRightWaits[k];
      left_copies[k].gain = kCopyGains[k];
      right_copies[k].gain = kCopyGains[k];
    }
    late_samples = static_cast<int>(kLateSeconds * lab::kSampleRate);
    forget_at = static_cast<int>(kForgetSeconds * lab::kSampleRate);
    quiet = 0;
    clear();
    // The device starts at its default and is then told the Width.
    width_now = StereoWidenerDevice::kDefaultWidth;
    width_to = kit::clamp(width_, 0.0f, 1.0f);
    const int glide = static_cast<int>(kGlideSeconds * lab::kSampleRate);
    glide_left = width_to == width_now ? 0 : glide;
    width_step = (width_to - width_now) / static_cast<float>(glide);
    aim(width_now);
  }

  // The Width at once, with no glide: for a picture of one unit sample.
  void land() {
    width_now = width_to;
    glide_left = 0;
    aim(width_now);
  }

  void clear() {
    low_state[0] = low_state[1] = 0.0f;
    low[0] = low[1] = 0.0f;
    for (Copies& copies : left_copies) copies.clear();
    for (Copies& copies : right_copies) copies.clear();
    for (float& slot : late_ring) slot = 0.0f;
    late_write = 0;
  }
};

lab::Build build{
    "A straight line|Equal power|Mid and side|Width|Keep the bass narrow|Scatter|A short delay on the right|"
    "The sum to one speaker",
    Built::kDelay, -120.0f,
    "The build with the six pieces the engine has, fed what the widener is fed, against the widener's own "
    "output, and its pan law against the kit's"};

Built shown;    // at the step the reader chose, on the loop in mono: what the built taps hold
Built held;     // with the engine's six pieces, on what the widener is fed: compared with it
Built tapped;   // the same again with no glide, for one unit sample through the build so far

// How alike two channels are over the last 50 ms or so: the mean of their
// product over the root of the product of their mean squares. 1 when they are
// the same, 0 when they have nothing to do with each other, -1 when one is
// the other turned over. It holds its last reading while nothing sounds.
struct Alike {
  double both = 0.0, left = 0.0, right = 0.0;
  float reading = 1.0f;
  float coeff = 0.0f;

  void start() {
    both = left = right = 0.0;
    reading = 1.0f;
    coeff = 1.0f - kit::time_to_coeff(0.05f, lab::kSampleRate);
  }
  float read(float l, float r) {
    both += coeff * (static_cast<double>(l) * r - both);
    left += coeff * (static_cast<double>(l) * l - left);
    right += coeff * (static_cast<double>(r) * r - right);
    const double under = left * right;
    if (under > 1.0e-16) reading = static_cast<float>(both / std::sqrt(under));
    return reading;
  }
};

Alike alike_going;
Alike alike_coming;

void configure(Spread& device) {
  using namespace spread;
  device.init(lab::kSampleRate);
  device.set_param(kLow, 2.0f * width.value);
  device.set_param(kMid, 2.0f * width.value);
  device.set_param(kHigh, 2.0f * width.value);
}

constexpr int kLawPoints = 101;

// The two gains of a pan law, the power of the two together and the level of
// the two added, at each of 101 places from all left to all right.
void law_curves(lab::Tap& left, lab::Tap& right, lab::Tap& power, lab::Tap& sum, bool straight) {
  if (!left.open(kLawPoints) || !right.open(kLawPoints) || !power.open(kLawPoints) || !sum.open(kLawPoints)) return;
  left.x0 = right.x0 = power.x0 = sum.x0 = -1.0f;
  left.x1 = right.x1 = power.x1 = sum.x1 = 1.0f;
  for (int p = 0; p < kLawPoints; ++p) {
    const float at = -1.0f + 2.0f * static_cast<float>(p) / static_cast<float>(kLawPoints - 1);
    float l, r;
    if (straight) {
      r = 0.5f * (at + 1.0f);
      l = 1.0f - r;
    } else {
      kit::pan_gains(at, &l, &r);
    }
    left.set(p, l);
    right.set(p, r);
    power.set(p, lab::power_to_db(l * l + r * r));
    sum.set(p, lab::to_db(l + r));
  }
}

// The same three for the build's law at this step.
void built_law_curves() {
  if (!built_left_gain.open(kLawPoints) || !built_right_gain.open(kLawPoints) || !built_power.open(kLawPoints)) {
    return;
  }
  built_left_gain.x0 = built_right_gain.x0 = built_power.x0 = -1.0f;
  built_left_gain.x1 = built_right_gain.x1 = built_power.x1 = 1.0f;
  Built law;
  for (int p = 0; p < kLawPoints; ++p) {
    const float at = -1.0f + 2.0f * static_cast<float>(p) / static_cast<float>(kLawPoints - 1);
    if (build.at() >= Built::kCircle) law.circle(at);
    else law.line(at);
    built_left_gain.set(p, law.left_share);
    built_right_gain.set(p, law.right_share);
    built_power.set(p, lab::power_to_db(law.left_share * law.left_share + law.right_share * law.right_share));
  }
}

// What each Width sets: the widener's own class is told each of 101 widths
// and its numbers are read out of it. The bass's share is a local of its
// process(), written again here.
void width_curves() {
  constexpr int kPoints = 101;
  if (!side_gain.open(kPoints) || !mid_gain.open(kPoints) || !scatter_share.open(kPoints) ||
      !delay_share.open(kPoints) || !bass_share.open(kPoints)) {
    return;
  }
  lab::Tap* const curves[] = {&side_gain, &mid_gain, &scatter_share, &delay_share, &bass_share};
  for (lab::Tap* tap : curves) {
    tap->x0 = 0.0f;
    tap->x1 = 1.0f;
  }
  for (int p = 0; p < kPoints; ++p) {
    const float w = static_cast<float>(p) / static_cast<float>(kPoints - 1);
    asked.setWidth(w);
    side_gain.set(p, asked.sideGain);
    mid_gain.set(p, asked.midGain);
    scatter_share.set(p, asked.decorrelationAmount);
    delay_share.set(p, asked.haasAmount);
    bass_share.set(p, kit::max(0.3f, 1.0f - w * 0.7f));
  }
}

constexpr int kRing = 4096;      // samples of a response that are kept
constexpr int kClickPoints = 2400;  // 50 ms of it, for the picture against time
float ring_left[kRing];
float ring_right[kRing];
float ring_one[kRing];

// One unit sample on both channels through the widener's own class at this
// Width: what comes out on each side, against time and against frequency,
// and what one speaker gets when the two are added.
void click_pictures() {
  probe.prepare(lab::kSampleRate);
  probe.setWidth(width.value);
  for (int n = 0; n < kRing; ++n) {
    float l = n == 0 ? 1.0f : 0.0f;
    float r = l;
    probe.process(l, r);
    ring_left[n] = l;
    ring_right[n] = r;
    ring_one[n] = 0.5f * (l + r);
  }
  lab::response_tap(left_response, ring_left, kRing);
  lab::response_tap(right_response, ring_right, kRing);
  lab::response_tap(mono_response, ring_one, kRing);
  if (click_left.open(kClickPoints) && click_right.open(kClickPoints)) {
    click_left.x0 = click_right.x0 = 0.0f;
    click_left.x1 = click_right.x1 = 1000.0f * static_cast<float>(kClickPoints - 1) / lab::kSampleRate;
    for (int n = 0; n < kClickPoints; ++n) {
      click_left.set(n, ring_left[n]);
      click_right.set(n, ring_right[n]);
    }
  }

  // The same sample through the second widener, and what one speaker gets.
  configure(second_probe);
  for (int n = 0; n < kRing; ++n) {
    second_probe.in_left()[0] = n == 0 ? 1.0f : 0.0f;
    second_probe.in_right()[0] = n == 0 ? 1.0f : 0.0f;
    second_probe.process(1);
    ring_one[n] = 0.5f * (second_probe.out_left()[0] + second_probe.out_right()[0]);
  }
  lab::response_tap(second_response, ring_one, kRing);

  // And through the build so far, placed by Pan as the build places it.
  tapped.start(build.at(), width.value, pan.value);
  tapped.land();
  for (int n = 0; n < kRing; ++n) {
    tapped.play(n == 0 ? 1.0f : 0.0f);
    ring_one[n] = 0.5f * (tapped.out[0] + tapped.out[1]);
  }
  lab::response_tap(built_response, ring_one, kRing);
}

// The outline of the cloud a pair of channels makes when each sample is a dot,
// left across and right up: for each of 64 strips of left, the highest and
// the lowest right there is in it. A strip with no sample in it is given the
// diagonal, where a sound that is the same on both sides lies.
constexpr int kStrips = 64;

void outline(lab::Tap& tap, const float* left, const float* right, int count, float reach) {
  if (!left || !right || !tap.open(2 * kStrips)) return;
  tap.columns = 2;
  tap.x0 = -reach;
  tap.x1 = reach;
  float* top = tap.data;
  float* bottom = tap.data + kStrips;
  static bool filled[kStrips];
  for (int s = 0; s < kStrips; ++s) filled[s] = false;
  for (int i = 0; i < count; ++i) {
    int s = static_cast<int>((left[i] + reach) / (2.0f * reach) * static_cast<float>(kStrips - 1) + 0.5f);
    if (s < 0) s = 0;
    if (s > kStrips - 1) s = kStrips - 1;
    if (!filled[s]) {
      filled[s] = true;
      top[s] = bottom[s] = right[i];
    } else {
      if (right[i] > top[s]) top[s] = right[i];
      if (right[i] < bottom[s]) bottom[s] = right[i];
    }
  }
  for (int s = 0; s < kStrips; ++s) {
    if (filled[s]) continue;
    top[s] = bottom[s] = -reach + 2.0f * reach * static_cast<float>(s) / static_cast<float>(kStrips - 1);
  }
}

}  // namespace

void lab_setup() {
  asked.prepare(lab::kSampleRate);
}

void lab_render(int frames) {
  widener.init(lab::kSampleRate);
  widener.set_param(StereoWidenerParam::kWidth, width.value);
  configure(second);

  float kit_left = 1.0f, kit_right = 0.0f;
  kit::pan_gains(pan.value, &kit_left, &kit_right);

  shown.start(build.at(), width.value, pan.value);
  held.start(build.compared_step, width.value, pan.value);
  double built_apart = 0.0, built_whole = 0.0;

  alike_going.start();
  alike_coming.start();
  double in_both = 0.0, in_left = 0.0, in_right = 0.0;
  double out_both = 0.0, out_l = 0.0, out_r = 0.0;
  double side_before = 0.0, side_after = 0.0;
  double one_before = 0.0, one_after = 0.0, one_second = 0.0;

  const bool placing = feed.on();
  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    const float left = lab::in_at(0, i);
    const float right = lab::in_at(1, i);
    const float one = 0.5f * (left + right);
    const float placed_left = kit_left * one;
    const float placed_right = kit_right * one;
    const float go_left = placing ? placed_left : left;
    const float go_right = placing ? placed_right : right;

    widener.in_left()[0] = go_left;
    widener.in_right()[0] = go_right;
    widener.process(1);
    const float o_left = widener.out_left()[0];
    const float o_right = widener.out_right()[0];

    second.in_left()[0] = go_left;
    second.in_right()[0] = go_right;
    second.process(1);
    const float s_left = second.out_left()[0];
    const float s_right = second.out_right()[0];

    // The stages between, out of the copy of the widener's function.
    held.run_and_keep(go_left, go_right);

    // The first pass is thrown away, so nothing of it is kept.
    const bool kept = i >= frames;
    if (kept) {
      in_tap.put(i, left, right);
      placed.put(i, placed_left, placed_right);
      going.put(i, go_left, go_right);
      going_left.put(i, go_left);
      going_right.put(i, go_right);
      going_mid.put(i, 0.5f * (go_left + go_right));
      going_side.put(i, 0.5f * (go_left - go_right));
      bass.put(i, widener.widener_.bassLpStateL, widener.widener_.bassLpStateR);
      rest.put(i, held.seen_rest[0], held.seen_rest[1]);
      mid.put(i, held.mid);
      side.put(i, held.side);
      widened.put(i, held.seen_widened[0], held.seen_widened[1]);
      scattered.put(i, held.seen_scattered[0], held.seen_scattered[1]);
      delayed.put(i, held.seen_delayed[0], held.seen_delayed[1]);
      narrow.put(i, held.seen_narrow[0], held.seen_narrow[1]);
      out_left.put(i, o_left);
      out_right.put(i, o_right);
      out_side.put(i, 0.5f * (o_left - o_right));
      mono.put(i, 0.5f * (o_left + o_right));
      second_out.put(i, s_left, s_right);
      second_mono.put(i, 0.5f * (s_left + s_right));
      out_tap.put(i, o_left, o_right);
    }

    const float like_in = alike_going.read(go_left, go_right);
    const float like_out = alike_coming.read(o_left, o_right);
    if (kept && i % lab::kControlPeriod == 0) {
      alike_in.put(i, like_in);
      alike.put(i, like_out);
    }

    // The build, at the step chosen, on the loop in mono.
    shown.play(one);
    if (kept) {
      built.put(i, shown.out[0], shown.out[1]);
      built_left.put(i, shown.out[0]);
      built_right.put(i, shown.out[1]);
      const bool taken_apart = shown.pieces >= Built::kMidSide;
      built_mid.put(i, taken_apart ? 0.5f * (shown.out[0] + shown.out[1]) : 0.0f);
      built_side.put(i, taken_apart ? 0.5f * (shown.out[0] - shown.out[1]) : 0.0f);
    }

    if (kept) {
      // The copy against the device, and the copy's pan law against the kit's.
      const double apart_left = static_cast<double>(held.out[0]) - o_left;
      const double apart_right = static_cast<double>(held.out[1]) - o_right;
      const double law_left_apart = static_cast<double>(held.left_share) * one - placed_left;
      const double law_right_apart = static_cast<double>(held.right_share) * one - placed_right;
      built_apart += apart_left * apart_left + apart_right * apart_right + law_left_apart * law_left_apart +
                     law_right_apart * law_right_apart;
      built_whole += static_cast<double>(o_left) * o_left + static_cast<double>(o_right) * o_right +
                     static_cast<double>(placed_left) * placed_left +
                     static_cast<double>(placed_right) * placed_right;
    }
    if (i >= frames && i < 2 * frames) {
      in_both += static_cast<double>(go_left) * go_right;
      in_left += static_cast<double>(go_left) * go_left;
      in_right += static_cast<double>(go_right) * go_right;
      out_both += static_cast<double>(o_left) * o_right;
      out_l += static_cast<double>(o_left) * o_left;
      out_r += static_cast<double>(o_right) * o_right;
      const double sb = 0.5 * (static_cast<double>(go_left) - go_right);
      const double sa = 0.5 * (static_cast<double>(o_left) - o_right);
      const double ob = 0.5 * (static_cast<double>(go_left) + go_right);
      const double oa = 0.5 * (static_cast<double>(o_left) + o_right);
      const double os = 0.5 * (static_cast<double>(s_left) + s_right);
      side_before += sb * sb;
      side_after += sa * sa;
      one_before += ob * ob;
      one_after += oa * oa;
      one_second += os * os;
    }
  }
  build.difference.value = lab::ratio_db(built_apart, built_whole);

  alike_before.value = in_left * in_right > 0.0 ? static_cast<float>(in_both / std::sqrt(in_left * in_right)) : 1.0f;
  alike_after.value = out_l * out_r > 0.0 ? static_cast<float>(out_both / std::sqrt(out_l * out_r)) : 1.0f;
  side_change.value = side_before > 0.0 ? lab::ratio_db(side_after, side_before) : 0.0f;
  mono_change.value = one_before > 0.0 ? lab::ratio_db(one_after, one_before) : 0.0f;
  second_mono_change.value = one_before > 0.0 ? lab::ratio_db(one_second, one_before) : 0.0f;

  law_curves(law_left, law_right, law_power, law_sum, false);
  law_curves(line_left, line_right, line_power, line_sum, true);
  built_law_curves();
  width_curves();
  click_pictures();

  // The two clouds on one scale: as far as either reaches to the left or the right.
  float reach = 1.0e-3f;
  lab::Tap* const clouds[] = {&going, &out_tap};
  for (lab::Tap* tap : clouds) {
    if (!tap->data) continue;
    const float most = lab::peak(tap->data, tap->length);
    if (most > reach) reach = most;
  }
  outline(cloud_in, going.channel(0), going.channel(1), going.length, reach);
  outline(cloud_out, out_tap.channel(0), out_tap.channel(1), out_tap.length, reach);
}
