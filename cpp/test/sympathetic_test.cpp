// Native harness for Sympathetic (cpp/devices/sympathetic). The conformance
// pass covers stability, silence when idle, block-size independence (which
// here includes the pitch detector's schedule) and parameter abuse; the rest
// asserts what makes it a bank of sympathetic strings.

#include "../devices/sympathetic/sympathetic.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Sympathetic;
namespace p = livemix::sympathetic;

static Sympathetic device;

static const float kRate = 48000.0f;

static double note_hz(int midi) { return 440.0 * std::pow(2.0, (midi - 69) / 12.0); }
static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// A sine with raised-cosine ends, so its start and stop are not clicks that
// would strike every string.
static std::vector<float> tone(double hz, float seconds, float gain, float rate = kRate) {
  std::vector<float> out = sine(static_cast<float>(hz), seconds, rate, gain);
  const size_t ramp = static_cast<size_t>(0.05f * rate);
  for (size_t i = 0; i < ramp && i < out.size(); ++i) {
    const float window = 0.5f - 0.5f * static_cast<float>(std::cos(kPi * static_cast<double>(i) / ramp));
    out[i] *= window;
    out[out.size() - 1 - i] *= window;
  }
  return out;
}

// Decay time to -60 dB of one partial: a line through the level of `hz` in
// consecutive windows between `from` and `to` seconds.
static double partial_rt60(const std::vector<float>& x, double hz, double from, double to, double window) {
  double n = 0, st = 0, sd = 0, stt = 0, std_ = 0;
  for (double t = from; t + window <= to; t += window) {
    const double level = db(tone_level(x, hz, kRate, static_cast<size_t>(t * kRate),
                                       static_cast<size_t>((t + window) * kRate)));
    n += 1;
    st += t;
    sd += level;
    stt += t * t;
    std_ += t * level;
  }
  const double slope = (n * std_ - st * sd) / (n * stt - st * st);
  return slope < 0.0 ? -60.0 / slope : 0.0;
}

// The strings alone, in mono, struck by a short burst of noise; returns the
// two seconds after the burst.
static Stereo struck(Sympathetic& d, float seconds = 2.0f) {
  rng_state() = 0xC0FFEEu;
  run(d, noise(0.2f, kRate, 0.2f));
  return render(d, seconds, kRate);
}

static void wet_only(Sympathetic& d) {
  d.init(kRate);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kWidth, 0.0f);
}

struct Peak {
  double hz = 0.0;
  double level = 0.0;
};

// The strongest component within half a semitone of `hz` over one second
// starting at `from`.
static Peak peak_near(const std::vector<float>& x, double hz, float rate = kRate, size_t from = 4800) {
  const size_t to = from + static_cast<size_t>(rate);
  Peak best;
  double centre = 0.0;
  double step = 2.5;
  for (int pass = 0; pass < 3; ++pass) {
    const int reach = pass == 0 ? 20 : 10;
    double best_offset = centre;
    for (int i = -reach; i <= reach; ++i) {
      const double offset = centre + step * i;
      const double candidate = hz * std::pow(2.0, offset / 1200.0);
      const double level = tone_level(x, candidate, rate, from, to);
      if (level > best.level) {
        best.level = level;
        best.hz = candidate;
        best_offset = offset;
      }
    }
    centre = best_offset;
    step *= 0.1;
  }
  return best;
}

// How many of `notes` ring in `x`: a peak within 3 cents of the note and
// within 26 dB of the strongest of them (a noise burst strikes the strings
// unevenly; a note with no string is 50 dB down). `worst_cents` collects
// the largest tuning error among those that do.
static int ringing(const std::vector<float>& x, const int* notes, int count, double* worst_cents,
                   float rate = kRate) {
  Peak peaks[16];
  double strongest = 0.0;
  for (int i = 0; i < count; ++i) {
    peaks[i] = peak_near(x, note_hz(notes[i]), rate);
    strongest = std::max(strongest, peaks[i].level);
  }
  int present = 0;
  for (int i = 0; i < count; ++i) {
    const double off = std::fabs(cents(peaks[i].hz, note_hz(notes[i])));
    if (peaks[i].level > 0.05 * strongest && off < 3.0) {
      ++present;
      if (worst_cents) *worst_cents = std::max(*worst_cents, off);
    }
  }
  return present;
}

// Level at exactly `note`, for notes that should not be there.
static double level_at(const std::vector<float>& x, int note, float rate = kRate) {
  return tone_level(x, note_hz(note), rate, 4800, 4800 + static_cast<size_t>(rate));
}

int main() {
  Conformance spec;
  spec.name = "sympathetic";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 7.0f;
  // The wet signal is limited to ±1; Width at its maximum can then raise the
  // side by 2.5.
  spec.max_peak = 3.0f;
  check_effect(device, spec, kRate);

  // Untouched, the strings are the C major scale from C3, each within a few
  // cents, and nothing rings between the scale notes.
  {
    wet_only(device);
    Stereo tail = struck(device);
    const int scale[7] = {48, 50, 52, 53, 55, 57, 59};
    double worst = 0.0;
    EXPECT(ringing(tail.left, scale, 7, &worst) == 7, "C major: all seven scale notes ring from C3");
    EXPECT(worst < 2.0, "C major: every string is within 2 cents of its note");
    const double weakest = peak_near(tail.left, note_hz(59)).level;
    for (int note : {49, 51, 54, 56, 58}) {
      EXPECT(level_at(tail.left, note) < 0.1 * weakest, "C major: nothing rings between the scale notes");
    }
  }

  // Root and Mode move them: A minor from A3, with C natural and no C sharp.
  {
    wet_only(device);
    device.set_param(p::kRoot, 9.0f);
    device.set_param(p::kMode, 1.0f);
    Stereo tail = struck(device);
    const int scale[7] = {57, 59, 60, 62, 64, 65, 67};
    double worst = 0.0;
    EXPECT(ringing(tail.left, scale, 7, &worst) == 7, "A minor: all seven scale notes ring from A3");
    EXPECT(worst < 2.0, "A minor: every string is within 2 cents of its note");
    const double third = peak_near(tail.left, note_hz(60)).level;
    EXPECT(level_at(tail.left, 61) < 0.1 * third, "A minor: the major third is not there");
    EXPECT(level_at(tail.left, 66) < 0.1 * third && level_at(tail.left, 68) < 0.1 * third,
           "A minor: the major sixth and seventh are not there");
  }

  // The tuning holds at other sample rates.
  for (float rate : {44100.0f, 96000.0f}) {
    device.init(rate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kWidth, 0.0f);
    rng_state() = 0xC0FFEEu;
    run(device, noise(0.2f, rate, 0.2f));
    Stereo tail = render(device, 2.0f, rate);
    const size_t from = static_cast<size_t>(0.1f * rate);
    const Peak low = peak_near(tail.left, note_hz(48), rate, from);
    const Peak high = peak_near(tail.left, note_hz(59), rate, from);
    EXPECT(std::fabs(cents(low.hz, note_hz(48))) < 2.0 && std::fabs(cents(high.hz, note_hz(59))) < 2.0,
           "strings are in tune at 44.1 and 96 kHz");
  }

  // Sympathy is selective: a note the strings are tuned to leaves far more
  // behind than the note a semitone above it, and what it leaves is that note.
  {
    double left_behind[2];
    double pitch = 0.0;
    int which = 0;
    for (int note : {50, 51}) {  // D3 is in C major, D#3 is not
      wet_only(device);
      run(device, tone(note_hz(note), 1.0f, 0.1f));
      Stereo tail = render(device, 1.5f, kRate);
      left_behind[which++] = rms(tail.left, 4800, 52800);
      if (note == 50) pitch = peak_near(tail.left, note_hz(50)).hz;
    }
    std::printf("sympathetic: tail after D3 %.1f dB, after D#3 %.1f dB\n", db(left_behind[0]),
                db(left_behind[1]));
    EXPECT(left_behind[0] > 6.0 * left_behind[1],
           "a note in the scale leaves at least 15 dB more tail than one a semitone off");
    EXPECT(std::fabs(cents(pitch, note_hz(50))) < 2.0, "the tail of a played note is that note");
  }

  // The detector finds the pitch of a clean note from 80 Hz to 1 kHz within
  // a few cents, and noise is not mistaken for a note.
  {
    double worst = 0.0;
    bool notes_right = true;
    for (double hz : {80.0, 110.0, 196.0, 329.63, 523.25, 784.0, 1000.0}) {
      device.init(kRate);
      run(device, tone(hz, 0.5f, 0.2f));
      const double found = device.detected_frequency();
      worst = std::max(worst, found > 0.0 ? std::fabs(cents(found, hz)) : 1200.0);
      const int nearest = static_cast<int>(std::lround(69.0 + 12.0 * std::log2(hz / 440.0)));
      notes_right = notes_right && device.detected_note() == nearest;
    }
    std::printf("sympathetic: worst detection error %.2f cents (80 Hz to 1 kHz)\n", worst);
    EXPECT(worst < 3.0, "the detector is within 3 cents from 80 Hz to 1 kHz");
    EXPECT(notes_right, "the detector names the right note");

    // The window is the same 43 to 46 ms at other sample rates.
    for (float rate : {44100.0f, 96000.0f}) {
      for (double hz : {80.0, 1000.0}) {
        device.init(rate);
        run(device, tone(hz, 0.5f, 0.2f, rate));
        const double found = device.detected_frequency();
        EXPECT(found > 0.0 && std::fabs(cents(found, hz)) < 3.0, "the detector is as good at 44.1 and 96 kHz");
      }
    }

    device.init(kRate);
    rng_state() = 0x5EEDu;
    run(device, noise(3.0f, kRate, 0.5f));
    EXPECT(device.detected_note() < 0, "noise is not taken for a note");

    // It needs the note in three windows in a row (about 130 ms).
    device.init(kRate);
    run(device, tone(440.0, 0.08f, 0.2f));
    render(device, 0.3f, kRate);
    EXPECT(device.detected_note() < 0, "an 80 ms blip is too short to move the strings");
    run(device, tone(440.0, 0.2f, 0.2f));
    EXPECT(device.detected_note() == 69, "a note held for 200 ms is found");
  }

  // The detector runs on a count of samples: a passage that moves the
  // strings twice gives the same audio whatever the block size, and init()
  // forgets the note.
  {
    std::vector<float> passage = tone(220.0, 0.5f, 0.2f);
    const std::vector<float> second = tone(880.0, 0.5f, 0.2f);
    passage.insert(passage.end(), second.begin(), second.end());
    device.init(kRate);
    Stereo reference = run(device, passage, 128);
    EXPECT(device.detected_note() == 81, "the passage moved the strings");
    double worst = 0.0;
    for (int block : {1, 17, 2048}) {
      device.init(kRate);
      EXPECT(device.detected_note() < 0, "init() forgets the detected note");
      Stereo other = run(device, passage, block);
      for (size_t i = 0; i < passage.size(); ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(other.left[i]) - reference.left[i]));
        worst = std::max(worst, std::fabs(static_cast<double>(other.right[i]) - reference.right[i]));
      }
    }
    EXPECT(worst < 1.0e-6, "detection and retuning do not depend on the block size");
  }

  // A note that is heard moves the bank to its octave: root, octave, fifth
  // and third first, the rest of the scale after.
  {
    wet_only(device);
    Stereo before = struck(device);
    wet_only(device);
    run(device, tone(440.0, 0.5f, 0.2f));  // A4
    render(device, 0.3f, kRate);
    Stereo after = struck(device);
    const int moved[8] = {60, 72, 67, 64, 62, 65, 69, 71};
    double worst = 0.0;
    EXPECT(ringing(after.left, moved, 8, &worst) == 8, "after an A4 the strings are C major from C4");
    EXPECT(worst < 2.0, "the retuned strings are within 2 cents");
    EXPECT(std::fabs(cents(device.string_frequency(1), note_hz(72))) < 0.1,
           "the second string is the root an octave up");
    // D3 and F3 had strings of their own before and are no partial of any
    // string now.
    for (int note : {50, 53}) {
      EXPECT(level_at(after.left, note) < 0.05 * level_at(before.left, note),
             "the octave the strings left no longer rings");
    }

    // A low note takes them down: G2 puts the root on C2.
    wet_only(device);
    run(device, tone(98.0, 0.5f, 0.2f));
    render(device, 0.3f, kRate);
    Stereo low = struck(device);
    const Peak root = peak_near(low.left, note_hz(36));
    EXPECT(std::fabs(cents(root.hz, note_hz(36))) < 2.0 && root.level > 20.0 * level_at(before.left, 36),
           "after a G2 the root string is C2");
  }

  // Decay is the RT60 of a string's fundamental.
  for (float decay : {1.0f, 3.0f, 6.0f}) {
    wet_only(device);
    device.set_param(p::kDecay, decay);
    Stereo tail = struck(device, decay + 0.5f);
    const double low = partial_rt60(tail.left, note_hz(48), 0.1, 0.1 + 0.8 * decay, 0.1 * decay + 0.05);
    const double mid = partial_rt60(tail.left, note_hz(55), 0.1, 0.1 + 0.8 * decay, 0.1 * decay + 0.05);
    std::printf("sympathetic: Decay %.1f s -> C3 %.2f s, G3 %.2f s\n", decay, low, mid);
    EXPECT_NEAR(low, decay, 0.05 * decay, "Decay sets the RT60 of the C3 string");
    EXPECT_NEAR(mid, decay, 0.05 * decay, "Decay sets the RT60 of the G3 string");
  }

  // Strings sets how many notes ring.
  {
    const int scale[7] = {48, 50, 52, 53, 55, 57, 59};
    for (int strings = 4; strings <= 7; ++strings) {
      wet_only(device);
      device.set_param(p::kStrings, static_cast<float>(strings - 4));
      Stereo tail = struck(device);
      char label[80];
      std::snprintf(label, sizeof label, "Strings %d: that many scale notes ring", strings);
      EXPECT(ringing(tail.left, scale, 7, nullptr) == strings, label);
    }
    // Past seven the strings double the scale an octave up. With sixteen, D5
    // has a string of its own and D4 another; with eight it is only the
    // fourth partial of D3. (The burst is too short for the detector.)
    double left_behind[2];
    int which = 0;
    for (float strings : {4.0f, 12.0f}) {
      wet_only(device);
      device.set_param(p::kStrings, strings);
      run(device, tone(note_hz(74), 0.08f, 0.05f));
      Stereo tail = render(device, 1.0f, kRate);
      left_behind[which++] = tone_level(tail.left, note_hz(74), kRate, 2400, 26400);
    }
    EXPECT(device.detected_note() < 0, "the D5 burst did not move the strings");
    EXPECT(left_behind[1] > 2.5 * left_behind[0], "Strings 16 adds strings an octave and two octaves up");
    EXPECT(std::fabs(cents(device.string_frequency(15), note_hz(74))) < 0.1,
           "Strings 16: the sixteenth string is D5");
  }

  // Width: mono at 0, strings spread in order across the field above that.
  {
    wet_only(device);  // Width 0
    Stereo mono = struck(device);
    double apart = 0.0;
    for (size_t i = 0; i < mono.size(); ++i) {
      apart = std::max(apart, std::fabs(static_cast<double>(mono.left[i]) - mono.right[i]));
    }
    EXPECT(apart < 1.0e-7 && peak(mono.left) > 0.01, "Width 0 is mono");

    wet_only(device);
    device.set_param(p::kWidth, 0.5f);
    Stereo normal = struck(device);
    wet_only(device);
    device.set_param(p::kWidth, 1.0f);
    Stereo wide = struck(device);
    const double normal_correlation = correlation(normal.left, normal.right, 4800, 96000);
    const double wide_correlation = correlation(wide.left, wide.right, 4800, 96000);
    std::printf("sympathetic: left/right correlation %.2f at Width 0.5, %.2f at Width 1\n",
                normal_correlation, wide_correlation);
    EXPECT(normal_correlation < 0.97 && normal_correlation > 0.5, "Width 0.5 is stereo but not wide");
    EXPECT(wide_correlation < normal_correlation - 0.5, "Width 1 is much wider");
    // The first string sits left of centre, the seventh right of it.
    EXPECT(level_at(normal.left, 48) > 1.3 * level_at(normal.right, 48), "the lowest string leans left");
    EXPECT(level_at(normal.right, 59) > 1.3 * level_at(normal.left, 59), "the higher strings lean right");
  }

  // Mix 0 is the dry signal untouched; Mix is equal power.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    std::vector<float> input = sine(146.83f, 0.5f, kRate, 0.5f);
    Stereo out = run(device, input);
    double worst = 0.0;
    for (size_t i = 0; i < input.size(); ++i) {
      worst = std::max(worst, std::fabs(out.left[i] - static_cast<double>(input[i])));
    }
    EXPECT(worst == 0.0, "Mix 0 passes the input through bit for bit");

    device.init(kRate);
    device.set_param(p::kSympathy, 0.0f);  // nothing reaches the strings
    Stereo half = run(device, input);
    EXPECT_NEAR(rms(half.left) / rms(input), 0.7071, 0.001, "Mix 0.5 has the dry signal at -3 dB");
  }

  // Sympathy is how hard the input drives the strings: none at 0, and the
  // tail follows it while the strings are not clipping.
  {
    wet_only(device);
    device.set_param(p::kSympathy, 0.0f);
    Stereo none = run(device, tone(note_hz(50), 0.5f, 0.5f));
    // (Not exactly 0: the equal-power dry gain at Mix 1 is cos(π/2) in floats.)
    EXPECT(peak(none.left) < 1.0e-6 && peak(none.right) < 1.0e-6, "Sympathy 0: the strings are never struck");

    double left_behind[2];
    int which = 0;
    for (float sympathy : {0.25f, 1.0f}) {
      wet_only(device);
      device.set_param(p::kSympathy, sympathy);
      Stereo tail = struck(device, 1.0f);
      left_behind[which++] = rms(tail.left, 4800, 43200);
    }
    EXPECT_NEAR(left_behind[1] / left_behind[0], 4.0, 0.4, "the tail is proportional to Sympathy");
  }

  // Retuning while the strings ring does not click: a new Root, a new Mode
  // or a different number of strings is no rougher than leaving them alone,
  // and neither is the detector moving the bank to another octave.
  {
    double roughness[4];
    for (int change = 0; change < 4; ++change) {
      wet_only(device);
      device.set_param(p::kWidth, 0.5f);
      // D3, E3 and A3 together: every change below moves a string that rings.
      std::vector<float> chord = tone(note_hz(50), 1.0f, 0.1f);
      const std::vector<float> third = tone(note_hz(52), 1.0f, 0.1f);
      const std::vector<float> sixth = tone(note_hz(57), 1.0f, 0.1f);
      for (size_t i = 0; i < chord.size(); ++i) chord[i] += third[i] + sixth[i];
      run(device, chord);
      if (change == 1) device.set_param(p::kRoot, 2.0f);
      if (change == 2) device.set_param(p::kMode, 1.0f);
      if (change == 3) device.set_param(p::kStrings, 12.0f);
      Stereo after = render(device, 0.5f, kRate);
      roughness[change] = std::max(max_step(after.left), max_step(after.right));
      if (change == 1) {
        EXPECT(std::fabs(cents(device.string_frequency(0), note_hz(50))) < 0.5, "Root moved the strings");
      }
    }
    std::printf("sympathetic: largest step %.5f ringing, %.5f / %.5f / %.5f across Root, Mode, Strings\n",
                roughness[0], roughness[1], roughness[2], roughness[3]);
    for (int change = 1; change < 4; ++change) {
      EXPECT(roughness[change] < 1.5 * roughness[0], "a retune while ringing does not click");
    }

    // Two octaves up by ear: A3 then A5. The strings move about 130 ms into
    // the second note; nothing on the way is rougher than the settled sound
    // of the new note at the end.
    wet_only(device);
    run(device, tone(220.0, 1.0f, 0.05f));
    Stereo moved = run(device, sine(880.0f, 1.0f, kRate, 0.05f));
    EXPECT(device.detected_note() == 81, "the detector followed the note up two octaves");
    EXPECT(std::fabs(cents(device.string_frequency(0), note_hz(72))) < 0.1, "the strings followed it");
    EXPECT(max_step(moved.left, 2400) < 1.2 * max_step(moved.left, 36000),
           "the move to a new octave does not click");
  }

  // Mix and Width are smoothed: a jump while sounding is a ramp.
  {
    device.init(kRate);
    std::vector<float> input = sine(146.83f, 1.0f, kRate, 0.25f);
    run(device, input);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kWidth, 1.0f);
    Stereo out = run(device, sine(146.83f, 0.5f, kRate, 0.25f));
    // The dry tone moves 0.005 per sample at this level.
    EXPECT(std::max(max_step(out.left), max_step(out.right)) < 0.02, "Mix and Width jumps do not click");
  }

  // Learn: the strings become the notes that were played. D, F sharp and A
  // with Root on D leave a D major triad; E and G, which D major would have
  // had, get no string.
  {
    wet_only(device);
    device.set_param(p::kRoot, 2.0f);
    device.set_param(p::kMode, 2.0f);
    Stereo unlearned = struck(device);
    const int major[7] = {50, 52, 54, 55, 57, 59, 61};
    EXPECT(ringing(unlearned.left, major, 7, nullptr) == 7, "Learn starts from the major scale");

    wet_only(device);
    device.set_param(p::kRoot, 2.0f);
    device.set_param(p::kMode, 2.0f);
    for (int note : {50, 54, 57, 54, 50}) run(device, tone(note_hz(note), 0.4f, 0.2f));
    render(device, 0.3f, kRate);
    Stereo learned = struck(device);
    const int triad[3] = {50, 54, 57};
    double worst = 0.0;
    EXPECT(ringing(learned.left, triad, 3, &worst) == 3 && worst < 2.0, "Learn: the played notes ring");
    const double fifth = peak_near(learned.left, note_hz(57)).level;
    EXPECT(level_at(learned.left, 52) < 0.05 * fifth && level_at(learned.left, 55) < 0.05 * fifth,
           "Learn: notes that were not played have no string");

    // Choosing Learn again forgets.
    device.set_param(p::kMode, 0.0f);
    device.set_param(p::kMode, 2.0f);
    render(device, 6.0f, kRate);
    Stereo forgotten = struck(device);
    EXPECT(level_at(forgotten.left, 52) > 0.05 * peak_near(forgotten.left, note_hz(57)).level,
           "Learn chosen again starts over");
  }

  // Bounded when everything is turned up and the input sits on a string.
  {
    device.init(kRate);
    for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, p::kParamMax[id]);
    device.set_param(p::kMode, 0.0f);
    Stereo out = run(device, sine(static_cast<float>(note_hz(59)), 4.0f, kRate, 1.0f));
    EXPECT(finite(out.left) && finite(out.right), "a full-scale note on a string stays finite");
    EXPECT(peak(out.left) < 1.5 && peak(out.right) < 1.5, "a full-scale note on a string stays bounded");
  }

  // The device sleeps: exact zero after the tail, awake again on new input.
  {
    device.init(kRate);
    rng_state() = 0xBEEFu;
    run(device, noise(0.5f, kRate, 0.5f));
    render(device, 7.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    device.set_param(p::kMix, 1.0f);
    run(device, tone(note_hz(50), 0.5f, 0.2f));
    Stereo woken = render(device, 0.5f, kRate);
    EXPECT(rms(woken.left) > 0.001, "wakes on new input and rings again");

    // Mix 0 hides the strings but does not stop them: turned up afterwards,
    // the tail is where it should be, not frozen from when the input ended.
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    run(device, tone(note_hz(50), 1.0f, 0.2f));
    Stereo hidden = render(device, 1.0f, kRate);
    EXPECT(peak(hidden.left) == 0.0, "Mix 0 with no input is silent");
    device.set_param(p::kMix, 1.0f);
    Stereo shown = render(device, 1.0f, kRate);
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    run(device, tone(note_hz(50), 1.0f, 0.2f));
    render(device, 1.0f, kRate);
    Stereo expected = render(device, 1.0f, kRate);
    EXPECT(rms(expected.left, 4800) > 0.0005, "a second into the tail the strings still ring");
    EXPECT_NEAR(rms(shown.left, 4800) / rms(expected.left, 4800), 1.0, 0.02,
                "the strings rang on under Mix 0");
  }

  // Cost, detection included. The mean is ten seconds of noise; the worst
  // block is taken over a held note (each block's fastest of five runs, so a
  // busy machine does not show up as a spike) and holds one FFT at most.
  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("sympathetic", 10.0f, kRate, [&] { run(device, input); });
  {
    const int blocks = 1500;  // 4 s
    std::vector<float> held = sine(330.0f, 4.1f, kRate, 0.3f);
    std::vector<double> fastest(blocks, 1.0e9);
    for (int repeat = 0; repeat < 5; ++repeat) {
      device.init(kRate);
      for (int b = 0; b < blocks; ++b) {
        for (int i = 0; i < kBlock; ++i) {
          device.in_left()[i] = held[static_cast<size_t>(b) * kBlock + i];
          device.in_right()[i] = held[static_cast<size_t>(b) * kBlock + i];
        }
        const auto start = std::chrono::steady_clock::now();
        device.process(kBlock);
        const double micros =
            std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - start).count();
        fastest[b] = std::min(fastest[b], micros);
      }
    }
    double total = 0.0, worst = 0.0;
    for (int b = 100; b < blocks; ++b) {
      total += fastest[b];
      worst = std::max(worst, fastest[b]);
    }
    const double mean = total / (blocks - 100);
    std::printf("sympathetic blocks: mean %.1f us, worst %.1f us per 128 frames (%.2f%% and %.2f%% of real time)\n",
                mean, worst, mean / 26.667, worst / 26.667);
  }


  return finish("sympathetic");
}
