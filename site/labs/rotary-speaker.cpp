// The rotary speaker: the Rotary (cpp/devices/rotary) run one sample at a
// time, so the two rotors, the delay the horn's mouth sets, the loudness and
// the tone each microphone hears and the sum can all be read as they are made.
//
//   in (summed to mono) ─► drive ─► split at 800 Hz ─┬─► horn (highs) ─┐
//                                                    └─► drum (lows) ──┴─► left, right
//
// Read from the device: the sound after its drive, the two bands of its
// crossover, where each rotor points and how fast it turns (its own meters),
// and its output. What each microphone hears of the horn and of the drum are
// locals of the device's loop and are not kept, so the lab reads them again
// ("lesson"): out of the device's own two delay lines, at the device's own
// angles, with the device's own depths and gains, in the order the device
// writes them. It mixes as the device mixes and reports how far that lands
// from the output the device wrote (the "rebuilt" check). The values the
// pictures draw (the pitch of the horn at a microphone, its loudness, how
// much of the dark copy is mixed in, left against right) come out of the same
// reading. One sound is the lesson's own and no stage of the device: the
// sound as it went in, times the loudness the horn has at the left
// microphone ("ridden"), to hear what a change of level alone would be.
//
// Speed is the device's own control. "Second half" is the lab's: at the
// middle of the loop the lab moves the device's Speed to it, and back at the
// loop's start, so that the run from one speed to the other is in the loop.
//
// Beside the loop there are pictures that are not the loop: what the
// crossover does to each frequency, from a kit filter set as the device sets
// its own; the drive's curve, from the device's own function called by
// itself; and the horn's loudness and the length of its path at every angle
// of one turn, from the device's own numbers.
//
// The build part puts a rotary speaker together a piece at a time, on a path
// of its own beside the device (lab::Build in lab.h). It has eight pieces,
// each a function of `Built` below, in the order the steps add them: two
// bands; a horn that turns, heard as loudness; its tone; its pitch; the drum;
// the two rotors' weights; the cabinet's walls; and the amplifier with its
// two blends. Two copies of it run: one at the step the reader chose, which
// is what the "built" taps show, and one with all eight pieces, whose output
// is compared on every render with the device's own (the "builtDifference"
// check). With all eight the build does to a sample what the device does, in
// the same order. A step before the last is the lesson's own: a cabinet with
// a piece missing, which the device never is. One thing the build is told and
// does not work out: when the device sleeps after a tenth of a second of
// silence its rotors stand still, and the build stands still with it.

#include "lab.h"

#include "../../cpp/devices/rotary/rotary.h"

using namespace livemix;

namespace {

Rotary cabinet;
Rotary probe;  // a second device, for the drive's curve

// The Rotary's nine parameters, by the device's own ids, and one of the lab's.
lab::Control speed{"speed", "Speed", "", 0.0f, 2.0f, 0.0f, lab::kLinear, "Slow|Fast|Brake"};
lab::Control second_half{"secondHalf", "Second half", "", 0.0f, 3.0f, 0.0f, lab::kLinear,
                         "As the first|Slow|Fast|Brake"};
lab::Control horn_depth{"hornDepth", "Horn Depth", "", 0.0f, 1.0f, 1.0f};
lab::Control drum_depth{"drumDepth", "Drum Depth", "", 0.0f, 1.0f, 1.0f};
lab::Control acceleration{"acceleration", "Acceleration", "×", 0.25f, 4.0f, 1.0f, lab::kLog};
lab::Control drive{"drive", "Drive", "", 0.0f, 1.0f, 0.0f};
lab::Control balance{"balance", "Balance", "", 0.0f, 1.0f, 0.5f};
lab::Control distance{"distance", "Distance", "", 0.0f, 1.0f, 0.0f};
lab::Control spread{"spread", "Spread", "", 0.0f, 1.0f, 0.7f};
lab::Control mix{"mix", "Mix", "", 0.0f, 1.0f, 1.0f};

lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap driven_tap{"driven", "After the drive", lab::kAudio, lab::kDevice, 1};
lab::Tap drive_curve{"driveCurve", "The drive's curve", lab::kCurve, lab::kCalled, 1};
lab::Tap lows_tap{"lows", "The low band, to the drum", lab::kAudio, lab::kDevice, 1};
lab::Tap highs_tap{"highs", "The high band, to the horn", lab::kAudio, lab::kDevice, 1};
lab::Tap split_low{"splitLow", "What the drum gets", lab::kSpectrum, lab::kKit, 1, "dB"};
lab::Tap split_high{"splitHigh", "What the horn gets", lab::kSpectrum, lab::kKit, 1, "dB"};
lab::Tap split_sum{"splitSum", "The two bands together", lab::kSpectrum, lab::kKit, 1, "dB"};
lab::Tap horn_angle{"hornAngle", "Where the horn points", lab::kControl, lab::kDevice, 1, "turns"};
lab::Tap drum_angle{"drumAngle", "Where the drum points", lab::kControl, lab::kDevice, 1, "turns"};
lab::Tap horn_speed{"hornSpeed", "Horn speed", lab::kControl, lab::kDevice, 1, "Hz"};
lab::Tap drum_speed{"drumSpeed", "Drum speed", lab::kControl, lab::kDevice, 1, "Hz"};
lab::Tap path_ms{"pathMs", "The horn's delay, left", lab::kControl, lab::kLesson, 1, "ms"};
lab::Tap path_right_ms{"pathMsRight", "The horn's delay, right", lab::kControl, lab::kLesson, 1, "ms"};
lab::Tap pitch{"pitch", "Pitch of the horn, left", lab::kControl, lab::kLesson, 1, "cents"};
lab::Tap pitch_right{"pitchRight", "Pitch of the horn, right", lab::kControl, lab::kLesson, 1, "cents"};
lab::Tap doppler{"doppler", "The horn's moving delay alone", lab::kAudio, lab::kLesson, 2};
lab::Tap shade_tap{"shade", "Share of the dark copy, left", lab::kControl, lab::kLesson, 1};
lab::Tap loudness{"loudness", "Loudness of the horn, left", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap loudness_right{"loudnessRight", "Loudness of the horn, right", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap side{"side", "Left over right", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap horn_tap{"horn", "The horn at the two microphones", lab::kAudio, lab::kLesson, 2};
lab::Tap drum_loudness{"drumLoudness", "Loudness of the drum, left", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap drum_pitch{"drumPitch", "Pitch of the drum, left", lab::kControl, lab::kLesson, 1, "cents"};
lab::Tap drum_tap{"drum", "The drum at the two microphones", lab::kAudio, lab::kLesson, 2};
lab::Tap ridden{"ridden", "The plain sound, its level ridden", lab::kAudio, lab::kLesson, 1};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};
lab::Tap horn_picture{"hornPicture", "The horn at the left microphone, spectrum over time", lab::kFrames,
                      lab::kLesson, 1, "dB"};
lab::Tap out_picture{"outPicture", "Output, spectrum over time", lab::kFrames, lab::kDevice, 1, "dB"};
lab::Tap gain_by_angle{"gainByAngle", "Horn loudness at the left microphone", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap gain_by_angle_right{"gainByAngleRight", "Horn loudness at the right microphone", lab::kCurve,
                             lab::kLesson, 1, "dB"};
lab::Tap path_by_angle{"pathByAngle", "The horn's delay at the left microphone", lab::kCurve, lab::kLesson, 1,
                       "ms"};
lab::Tap mics{"mics", "Where the two microphones stand", lab::kCurve, lab::kDevice, 1, "turns"};

lab::Check rebuilt{"rebuilt", "The horn, the drum and the mix read again, against the device's own output", "dB"};

lab::Tap built{"built", "The cabinet so far", lab::kAudio, lab::kLesson, 2};
lab::Tap built_lows{"builtLows", "Low band, as built", lab::kAudio, lab::kKit, 1};
lab::Tap built_highs{"builtHighs", "High band, as built", lab::kAudio, lab::kKit, 1};
lab::Tap built_loudness{"builtLoudness", "Horn loudness, left, as built", lab::kControl, lab::kLesson, 1, "dB"};
lab::Tap built_loudness_right{"builtLoudnessRight", "Horn loudness, right, as built", lab::kControl, lab::kLesson,
                              1, "dB"};
lab::Tap built_shade{"builtShade", "Share of the dark copy, as built", lab::kControl, lab::kLesson, 1};
lab::Tap built_pitch{"builtPitch", "Horn pitch, left, as built", lab::kControl, lab::kLesson, 1, "cents"};
lab::Tap built_drum_loudness{"builtDrumLoudness", "Drum loudness, left, as built", lab::kControl, lab::kLesson, 1,
                             "dB"};
lab::Tap built_drum_pitch{"builtDrumPitch", "Drum pitch, left, as built", lab::kControl, lab::kLesson, 1, "cents"};
lab::Tap built_horn_speed{"builtHornSpeed", "Horn speed, as built", lab::kControl, lab::kLesson, 1, "Hz"};
lab::Tap built_drum_speed{"builtDrumSpeed", "Drum speed, as built", lab::kControl, lab::kLesson, 1, "Hz"};

constexpr float kSqrt2 = 1.41421356f;

// A delay that moves replays the sound at another speed: 1 less the delay's
// slope, in samples a sample. In cents, a hundredth of a semitone.
float cents_of(float slope) { return 1200.0f * std::log2(1.0f - slope); }

// The pitch a moving read point gives, from how far the point moved since it
// was last asked, over the samples that went by: the sixteen of one point of
// a value's tap. Between two samples next to each other the point moves by a
// few parts in a million of where it stands, which a float holds only
// roughly, and a pitch read off one such move is a few hundredths of a cent
// out either way. Over sixteen it is steady.
struct Moved {
  float last = 2.0f;
  float cents(float behind) {
    const float slope = (behind - last) / static_cast<float>(lab::kControlPeriod);
    last = behind;
    return cents_of(slope);
  }
};

// The Speed the device is on at sample `i` of a render: Speed for the first
// half of the loop, and Second half for the rest where it names another.
int speed_at(int i) {
  const int frames = lab::frames();
  const bool later = frames > 0 && (i % frames) >= frames / 2;
  return later && second_half.choice() > 0 ? second_half.choice() - 1 : speed.choice();
}

// The cabinet so far: one function a piece, and run() to take a sample
// through the pieces there are.
struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kBands = 0, kHorn, kShade, kPitch, kDrum, kWeights, kWalls, kAmp };

  int pieces = kBands;
  kit::Svf split;
  kit::DcBlocker dc;
  kit::OnePole shade[2];
  kit::DelayLine<1024> horn_line;
  kit::DelayLine<128> drum_line;
  kit::ControlClock clock;
  double horn_angle = 0.0;  // where the horn points, in turns: 0 is the front
  double drum_angle = 0.0;
  float horn_speed = 0.0f;  // turns a second
  float drum_speed = 0.0f;
  int setting = 0;          // Speed: 0 Slow, 1 Fast, 2 Brake
  bool started = false;
  float tick = 0.0f;        // the seconds between two readings of the speeds
  float mic = 0.0f;         // how far each microphone stands from the front, in turns
  float horn_am = 0.0f;     // how much of the horn's level is lost facing away
  float horn_makeup = 1.0f;
  float horn_shade = 0.0f;  // the most of the dark copy that is mixed in
  float horn_radius = 0.0f;  // the horn's swing, in samples
  float drum_am = 0.0f;
  float drum_makeup = 1.0f;
  float drum_radius = 0.0f;
  float direct = 1.0f;      // the level of the sound that comes straight from the horn
  float reflect = 0.0f;     // and of each of the two that come off a wall
  float gain = 1.0f;        // Drive, as a number to multiply by
  float level = 1.0f;       // and what brings the driven sound back to size
  float last_u = 0.0f;
  float last_root = 1.0f;
  float horn_gain = 1.0f;
  float drum_gain = 1.0f;
  float dry_share = 0.0f;
  float wet_share = 1.0f;
  // What the lanes draw, for the left microphone unless it says otherwise.
  float loud[2] = {1.0f, 1.0f};  // what the horn's level is multiplied by, a side
  float dark_share = 0.0f;
  float read_at = 2.0f;          // where the horn's line is read, in samples behind
  float drum_read_at = 2.0f;     // and the drum's
  float drum_loud = 1.0f;
  float lows = 0.0f;
  float highs = 0.0f;
  float out[2] = {0.0f, 0.0f};

  // Two bands: one filter gives the lows and the highs of the sound at once.
  // The lows go to the drum's line and the highs, turned over, to the horn's.
  // Read straight back and added, the two carry every frequency at its level.
  void bands(float x) {
    split.process(x);
    horn_line.write(-split.high);
    drum_line.write(split.low);
  }

  // A horn that turns: `towards` is the cosine of the angle between the
  // horn's mouth and a microphone, 1 when it points straight at it. The
  // level falls as the mouth turns away, by `horn_am` of itself at the back.
  float facing(float towards) const { return 0.5f + 0.5f * towards; }
  float loudness(float faced) const { return (1.0f - horn_am * (1.0f - faced)) * horn_makeup; }

  // The rotors turn: each angle moves on by its speed over the sample rate,
  // the horn's upwards and the drum's downwards, and starts again at a turn.
  void turn() {
    const double per_sample = 1.0 / static_cast<double>(lab::kSampleRate);
    horn_angle += horn_speed * per_sample;
    if (horn_angle >= 1.0) horn_angle -= 1.0;
    drum_angle -= drum_speed * per_sample;
    if (drum_angle < 0.0) drum_angle += 1.0;
  }

  // Darker when it faces away: a copy of the horn's sound with the top taken
  // off by a one-pole filter, mixed in as the mouth turns from the microphone.
  float shaded(int k, float beam, float faced) {
    const float dark = shade[k].lowpass(beam);
    if (k == 0) dark_share = horn_shade * (1.0f - faced * faced);  // the lane draws the left one's
    return beam + (dark - beam) * horn_shade * (1.0f - faced * faced);
  }

  // The pitch wobble: the horn's line is read further back the further the
  // mouth is from the microphone. Two samples back is the nearest it reads.
  float path(float towards) const { return 2.0f + horn_radius * (1.0f - towards); }

  // The drum: the lows, read from their own line at their own rotor's angle.
  // A smaller swing of the path, a smaller fall in level, and no dark copy.
  float drum(float towards) const {
    return drum_line.read_linear(2.0f + drum_radius * (1.0f - towards)) *
           (1.0f - drum_am * (0.5f - 0.5f * towards)) * drum_makeup;
  }

  // Two weights: a rotor's speed covers a share of the way to where Speed
  // wants it on each reading, and the share is the reading's length over the
  // rotor's time constant. On Brake a steady friction is taken off as well.
  float approach(float now, float target, float up_seconds, float down_seconds) const {
    const bool braking = setting == Rotary::kBrake;
    const float seconds = (target > now ? up_seconds : down_seconds) / acceleration.value;
    now += (target - now) * kit::min(1.0f, tick / seconds);
    if (braking) {
      now -= Rotary::kBrakeFriction * acceleration.value * tick;
      if (now < 0.0f) now = 0.0f;
    }
    return now;
  }

  // Where Speed wants the two rotors, and how they get there: at once, until
  // the piece that gives them weight is in.
  void speeds() {
    const bool braking = setting == Rotary::kBrake;
    const float horn_target = braking ? 0.0f : Rotary::kHornHz[setting];
    const float drum_target = braking ? 0.0f : Rotary::kDrumHz[setting];
    if (!started || pieces < kWeights) {
      horn_speed = horn_target;
      drum_speed = drum_target;
    } else {
      horn_speed = approach(horn_speed, horn_target, Rotary::kHornUpSeconds, Rotary::kHornDownSeconds);
      drum_speed = approach(drum_speed, drum_target, Rotary::kDrumUpSeconds, Rotary::kDrumDownSeconds);
    }
    started = true;
  }

  // The cabinet's walls: two more copies of the horn's sound, each a few
  // milliseconds late, each seeing the horn at another angle, one turned over.
  float walls(float horn, float angle) const {
    for (int j = 0; j < Rotary::kNumReflections; ++j) {
      const float bounce = kit::SineTable::cos_lookup(angle + Rotary::kReflectAngle[j]);
      horn += reflect * Rotary::kReflectGain[j] *
              horn_line.read_linear(2.0f + Rotary::kReflectSeconds[j] * lab::kSampleRate +
                                    horn_radius * (1.0f - bounce));
    }
    return horn;
  }

  // The amplifier: a soft curve that is not the same above and below zero,
  // averaged over the step from the sample before, with a gain after it that
  // brings quiet playing back to size. At Drive 0 the sound goes round it.
  float amp(float x) {
    if (drive.value <= 0.0f) return x;
    const float u = gain * x + Rotary::kBias;
    const float root = std::sqrt(1.0f + u * u);
    const float shaped = (u + last_u) / (root + last_root);
    last_u = u;
    last_root = root;
    const float amount = kit::min(1.0f, 4.0f * drive.value);
    return x + ((shaped - Rotary::kBiasOut) * level - x) * amount;
  }

  // One sample through the pieces built so far, in the order it meets them.
  void run(float left, float right) {
    if (pieces >= kHorn) {
      if (clock.tick()) speeds();
      turn();
    }
    float x = 0.5f * (left + right);
    if (pieces >= kAmp) x = dc.process(amp(x));
    bands(x);
    lows = split.low;
    highs = -split.high;

    const float horn_at = static_cast<float>(horn_angle);
    const float drum_at = static_cast<float>(drum_angle);
    for (int k = 0; k < 2; ++k) {
      const float where = k == 0 ? -mic : mic;
      const float angle = horn_at - where + 1.0f;
      const float towards = kit::SineTable::cos_lookup(angle);
      const float faced = facing(towards);
      const float behind = pieces >= kPitch ? path(towards) : 2.0f;
      float beam = horn_line.read_hermite(behind);
      if (pieces >= kShade) beam = shaded(k, beam, faced);
      loud[k] = loudness(faced);
      beam *= loud[k];
      float horn = direct * beam;
      if (reflect > 0.0f) horn = walls(horn, angle);
      if (k == 0) read_at = behind;

      const float drum_towards = kit::SineTable::cos_lookup(drum_at - 0.5f * where + 1.0f);
      const float low = pieces >= kDrum ? drum(drum_towards) : drum_line.read_linear(2.0f);
      if (k == 0) {
        drum_loud = (1.0f - drum_am * (0.5f - 0.5f * drum_towards)) * drum_makeup;
        drum_read_at = 2.0f + drum_radius * (1.0f - drum_towards);
      }
      const float wet = horn * horn_gain + low * drum_gain;
      const float in = k == 0 ? left : right;
      out[k] = pieces >= kAmp ? in * dry_share + wet * wet_share : wet;
    }
  }

  // Everything the controls decide, worked out once, as the device works it
  // out on its control clock. A piece that is not in yet has the value at
  // which it does nothing.
  void start(int pieces_) {
    *this = Built{};
    pieces = pieces_;
    const float sr = lab::kSampleRate;
    split.set(Rotary::kCrossoverHz, 0.5f, sr);
    dc.set_cutoff(15.0f, sr);
    for (kit::OnePole& filter : shade) filter.set_cutoff(Rotary::kShadeHz, sr);
    horn_line.clear();
    drum_line.clear();
    clock.reset(Rotary::kControlPeriod);
    tick = static_cast<float>(Rotary::kControlPeriod) / sr;
    drum_angle = 0.37;
    setting = speed.choice();
    mic = 0.5f * Rotary::kMaxMicCycles * spread.value;
    const float far = pieces >= kWalls ? distance.value : 0.0f;
    if (pieces >= kHorn) {
      horn_am = horn_depth.value * Rotary::kHornAm * (1.0f - 0.6f * far);
      horn_makeup = Rotary::swing_makeup(horn_am);
    }
    if (pieces >= kShade) horn_shade = horn_depth.value * Rotary::kHornShade * (1.0f - 0.5f * far);
    if (pieces >= kPitch) horn_radius = horn_depth.value * Rotary::kHornRadiusSeconds * sr;
    if (pieces >= kDrum) {
      drum_am = drum_depth.value * Rotary::kDrumAm * (1.0f - 0.5f * far);
      drum_makeup = Rotary::swing_makeup(drum_am);
      drum_radius = drum_depth.value * Rotary::kDrumRadiusSeconds * sr;
    }
    direct = 1.0f - 0.2f * far;
    reflect = 0.4f * far;
    if (pieces >= kAmp) {
      gain = 1.0f + 5.0f * drive.value;
      level = std::pow(gain, 0.3f) / (gain * Rotary::kBiasSlope);
      last_u = Rotary::kBias;
      last_root = std::sqrt(1.0f + Rotary::kBias * Rotary::kBias);
      horn_gain = kSqrt2 * kit::SineTable::lookup(0.25f * balance.value);
      drum_gain = kSqrt2 * kit::SineTable::cos_lookup(0.25f * balance.value);
      dry_share = kit::SineTable::cos_lookup(0.25f * mix.value);
      wet_share = kit::SineTable::lookup(0.25f * mix.value);
    }
  }

  // The device is asleep: nothing comes out, and nothing moves.
  void rest() {
    out[0] = out[1] = 0.0f;
    lows = highs = 0.0f;
  }
};

lab::Build build{"Two bands|A horn that turns|Darker facing away|The pitch wobble|The drum|Two weights|"
                 "The cabinet's walls|The amplifier, Balance and Mix",
                 Built::kAmp, -120.0f, "The cabinet as built, all eight pieces, against the device's own output"};

Built shown;  // at the step the reader chose: what the built taps hold
Built held;   // with every piece: what is compared with the device

void configure(Rotary& device) {
  using namespace rotary;
  device.init(lab::kSampleRate);
  device.set_param(kSpeed, static_cast<float>(speed.choice()));
  device.set_param(kHornDepth, horn_depth.value);
  device.set_param(kDrumDepth, drum_depth.value);
  device.set_param(kAcceleration, acceleration.value);
  device.set_param(kDrive, drive.value);
  device.set_param(kBalance, balance.value);
  device.set_param(kDistance, distance.value);
  device.set_param(kSpread, spread.value);
  device.set_param(kMix, mix.value);
}

// True while the device will work on a sample: something goes in, or it has
// not yet been silent for the tenth of a second after which it sleeps
// (kit::IdleGate::wake). Asleep it writes silence and its rotors stand still.
bool renders(const Rotary& device, float left, float right) {
  return left != 0.0f || right != 0.0f || !device.idle_.asleep();
}

// A value over time, as it stood the second time round the loop. The sound is
// crossfaded across the loop's join (Tap::put) so that it plays without a
// step. A rotor does not come round with the loop, and its angle would be
// faded the same way, from one place in its turn to another, into a line that
// no rotor drew. So these are kept as they were.
void keep(lab::Tap& tap, int i, float value) {
  if (!tap.data && !tap.open(lab::frames() / lab::kControlPeriod)) return;
  tap.set((i - lab::frames()) / lab::kControlPeriod, value);
}

// What each microphone hears, read again from the device after it has taken
// a sample: its lines, its angles and its smoothed numbers are all its own
// state, and the order is the order of its loop.
struct Again {
  float beam[2] = {0.0f, 0.0f};    // the horn's line, read at the moving point
  float horn[2] = {0.0f, 0.0f};    // after the dark copy, the loudness and the walls
  float drum[2] = {0.0f, 0.0f};
  float out[2] = {0.0f, 0.0f};
  float behind[2] = {2.0f, 2.0f};  // where the horn's line is read, in samples behind the newest
  float loud[2] = {1.0f, 1.0f};    // what the horn's level is multiplied by
  float dark_share = 0.0f;         // the share of the dark copy, left
  float drum_behind = 2.0f;        // where the drum's line is read, left
  float drum_loud = 1.0f;

  void start() { *this = Again{}; }

  void run(const Rotary& device, const float* in) {
    const float sr = lab::kSampleRate;
    const float horn_radius = device.horn_radius_.value * sr;
    const float horn_am = device.horn_am_.value;
    const float horn_shade = device.horn_shade_.value;
    const float horn_makeup = device.horn_makeup_.value;
    const float drum_radius = device.drum_radius_.value * sr;
    const float drum_am = device.drum_am_.value;
    const float drum_makeup = device.drum_makeup_.value;
    const float direct = device.direct_.value;
    const float reflect = device.reflect_.value;
    const float mic = device.mic_.value;
    const float horn_at = static_cast<float>(device.horn_angle_);
    const float drum_at = static_cast<float>(device.drum_angle_);
    const float blend = 0.25f * device.mix_.value;
    const float dry_gain = kit::SineTable::cos_lookup(blend);
    const float wet_gain = kit::SineTable::lookup(blend);

    for (int k = 0; k < 2; ++k) {
      const float where = k == 0 ? -mic : mic;
      const float angle = horn_at - where + 1.0f;
      const float towards = kit::SineTable::cos_lookup(angle);
      const float facing = 0.5f + 0.5f * towards;
      behind[k] = 2.0f + horn_radius * (1.0f - towards);
      beam[k] = device.horn_line_.read_hermite(behind[k]);
      // The device's own filter holds the dark copy of this sample. The
      // products are taken in the device's order, so that the last bit agrees.
      const float dark = device.shade_[k].state;
      float heard = beam[k] + (dark - beam[k]) * horn_shade * (1.0f - facing * facing);
      loud[k] = (1.0f - horn_am * (1.0f - facing)) * horn_makeup;
      heard *= loud[k];
      heard = direct * heard;
      if (reflect > 0.0f) {
        for (int j = 0; j < Rotary::kNumReflections; ++j) {
          const float bounce = kit::SineTable::cos_lookup(angle + Rotary::kReflectAngle[j]);
          heard += reflect * Rotary::kReflectGain[j] *
                   device.horn_line_.read_linear(2.0f + Rotary::kReflectSeconds[j] * sr +
                                                 horn_radius * (1.0f - bounce));
        }
      }
      horn[k] = heard;

      const float drum_towards = kit::SineTable::cos_lookup(drum_at - 0.5f * where + 1.0f);
      const float drum_now = 2.0f + drum_radius * (1.0f - drum_towards);
      drum[k] = device.drum_line_.read_linear(drum_now) * (1.0f - drum_am * (0.5f - 0.5f * drum_towards)) *
                drum_makeup;
      if (k == 0) {
        dark_share = horn_shade * (1.0f - facing * facing);
        drum_behind = drum_now;
        drum_loud = (1.0f - drum_am * (0.5f - 0.5f * drum_towards)) * drum_makeup;
      }

      const float wet = horn[k] * device.horn_gain_.value + drum[k] * device.drum_gain_.value;
      out[k] = in[k] * dry_gain + wet * wet_gain;
    }
  }

  // Asleep: the device writes silence, and nothing of it moves.
  void rest() {
    for (int k = 0; k < 2; ++k) beam[k] = horn[k] = drum[k] = out[k] = 0.0f;
  }
};

Again again;

// What the crossover does to each frequency: one unit sample through a kit
// filter with the device's own coefficients, and the level of what rings out
// of its low output, of its high output, and of the two as the device sends
// them on: the lows, and the highs turned over.
constexpr int kRing = 8192;
float ring_low[kRing];
float ring_high[kRing];
float ring_sum[kRing];

void measure_split() {
  kit::Svf filter;
  filter.g = cabinet.split_.g;
  filter.k = cabinet.split_.k;
  filter.a1 = cabinet.split_.a1;
  filter.a2 = cabinet.split_.a2;
  filter.a3 = cabinet.split_.a3;
  for (int n = 0; n < kRing; ++n) {
    filter.process(n == 0 ? 1.0f : 0.0f);
    ring_low[n] = filter.low;
    ring_high[n] = -filter.high;
    ring_sum[n] = filter.low - filter.high;
  }
  lab::response_tap(split_low, ring_low, kRing);
  lab::response_tap(split_high, ring_high, kRing);
  lab::response_tap(split_sum, ring_sum, kRing);
}

// The drive's curve: the device's own function, called by itself on a level
// that holds still, for every level from -1 to 1. Called twice, so that the
// step it averages over has no length and the curve is the curve itself.
constexpr int kCurvePoints = 201;

void measure_drive() {
  if (!drive_curve.open(kCurvePoints)) return;
  drive_curve.x0 = -1.0f;
  drive_curve.x1 = 1.0f;
  probe.init(lab::kSampleRate);
  const float amount = cabinet.drive_.value;
  const float level = cabinet.drive_level_.value;
  for (int p = 0; p < kCurvePoints; ++p) {
    const float x = -1.0f + 2.0f * static_cast<float>(p) / static_cast<float>(kCurvePoints - 1);
    probe.tube(x, amount, level);
    drive_curve.set(p, probe.tube(x, amount, level));
  }
}

// One turn of the horn, at every angle: how loud each microphone hears it and
// how long its path to the left one is, from the device's own numbers.
void measure_turn() {
  if (!gain_by_angle.open(kCurvePoints) || !gain_by_angle_right.open(kCurvePoints) ||
      !path_by_angle.open(kCurvePoints) || !mics.open(2)) {
    return;
  }
  const float mic = cabinet.mic_.value;
  const float horn_am = cabinet.horn_am_.value;
  const float horn_makeup = cabinet.horn_makeup_.value;
  const float radius_ms = cabinet.horn_radius_.value * 1000.0f;
  for (int p = 0; p < kCurvePoints; ++p) {
    const float at = static_cast<float>(p) / static_cast<float>(kCurvePoints - 1);
    for (int k = 0; k < 2; ++k) {
      const float where = k == 0 ? -mic : mic;
      const float towards = kit::SineTable::cos_lookup(at - where + 1.0f);
      const float facing = 0.5f + 0.5f * towards;
      const float gain = (1.0f - horn_am * (1.0f - facing)) * horn_makeup;
      (k == 0 ? gain_by_angle : gain_by_angle_right).set(p, lab::to_db(gain));
      if (k == 0) path_by_angle.set(p, radius_ms * (1.0f - towards));
    }
  }
  mics.set(0, -mic);
  mics.set(1, mic);
}

}  // namespace

void lab_setup() { kit::SineTable::init(); }

void lab_render(int frames) {
  configure(cabinet);
  again.start();

  // The build part: the chosen step, and the eight pieces that are held to
  // the device. Where the chosen step is the last, one copy is both.
  const bool both = build.at() == build.compared_step;
  Built& compared = both ? shown : held;
  shown.start(build.at());
  if (!both) held.start(build.compared_step);

  double apart = 0.0, whole = 0.0;
  double built_apart = 0.0, built_whole = 0.0;
  int on = speed.choice();  // the Speed the device stands on
  // The read points whose motion is a pitch, and the pitch each has now.
  Moved horn_moved[2], drum_moved, built_horn_moved, built_drum_moved;
  float horn_cents[2] = {0.0f, 0.0f};
  float drum_cents = 0.0f, built_horn_cents = 0.0f, built_drum_cents = 0.0f;

  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    // Speed for the first half of the loop, Second half for the rest.
    const int wanted = speed_at(i);
    if (wanted != on) {
      on = wanted;
      cabinet.set_param(rotary::kSpeed, static_cast<float>(on));
      shown.setting = on;
      held.setting = on;
    }

    const float in[2] = {lab::in_at(0, i), lab::in_at(1, i)};
    const bool works = renders(cabinet, in[0], in[1]);
    cabinet.in_left()[0] = in[0];
    cabinet.in_right()[0] = in[1];
    cabinet.process(1);
    const float out[2] = {cabinet.out_left()[0], cabinet.out_right()[0]};

    // The device's microphones, read again; and the build, beside it. Asleep,
    // the device writes silence and its rotors stand still; so do both.
    if (works) {
      again.run(cabinet, in);
      shown.run(in[0], in[1]);
      if (!both) held.run(in[0], in[1]);
    } else {
      again.rest();
      shown.rest();
      if (!both) held.rest();
    }
    // The pitches, from where each read point stood sixteen samples ago. A
    // point that stands still while the device sleeps reads the played pitch.
    if (i % lab::kControlPeriod == 0) {
      for (int k = 0; k < 2; ++k) horn_cents[k] = horn_moved[k].cents(again.behind[k]);
      drum_cents = drum_moved.cents(again.drum_behind);
      built_horn_cents = built_horn_moved.cents(shown.read_at);
      built_drum_cents = built_drum_moved.cents(shown.drum_read_at);
    }
    if (i < frames) continue;  // the first time round is not kept

    for (int k = 0; k < 2; ++k) {
      const double d = static_cast<double>(again.out[k]) - out[k];
      const double b = static_cast<double>(compared.out[k]) - out[k];
      apart += d * d;
      built_apart += b * b;
      whole += static_cast<double>(out[k]) * out[k];
    }
    built_whole = whole;

    in_tap.put(i, in[0], in[1]);
    driven_tap.put(i, works ? cabinet.dc_.y1 : 0.0f);
    lows_tap.put(i, works ? cabinet.split_.low : 0.0f);
    highs_tap.put(i, works ? -cabinet.split_.high : 0.0f);
    doppler.put(i, again.beam[0], again.beam[1]);
    horn_tap.put(i, again.horn[0], again.horn[1]);
    drum_tap.put(i, again.drum[0], again.drum[1]);
    // The lesson's own: the sound as it went in, both sides as one, times the
    // loudness the horn has at the left microphone. A tremolo, and nothing else.
    ridden.put(i, works ? 0.5f * (in[0] + in[1]) * again.loud[0] : 0.0f);
    out_tap.put(i, out[0], out[1]);
    built.put(i, shown.out[0], shown.out[1]);
    built_lows.put(i, shown.lows);
    built_highs.put(i, shown.highs);

    if (i % lab::kControlPeriod != 0 || i >= 2 * frames) continue;
    const float ms_per_sample = 1000.0f / lab::kSampleRate;
    keep(horn_angle, i, cabinet.meter(0));
    keep(drum_angle, i, cabinet.meter(1));
    keep(horn_speed, i, cabinet.meter(2));
    keep(drum_speed, i, cabinet.meter(3));
    keep(path_ms, i, (again.behind[0] - 2.0f) * ms_per_sample);
    keep(path_right_ms, i, (again.behind[1] - 2.0f) * ms_per_sample);
    keep(pitch, i, horn_cents[0]);
    keep(pitch_right, i, horn_cents[1]);
    keep(shade_tap, i, again.dark_share);
    keep(loudness, i, lab::to_db(again.loud[0]));
    keep(loudness_right, i, lab::to_db(again.loud[1]));
    keep(side, i, lab::to_db(again.loud[0]) - lab::to_db(again.loud[1]));
    keep(drum_loudness, i, lab::to_db(again.drum_loud));
    keep(drum_pitch, i, drum_cents);
    keep(built_loudness, i, lab::to_db(shown.loud[0]));
    keep(built_loudness_right, i, lab::to_db(shown.loud[1]));
    keep(built_shade, i, shown.dark_share);
    keep(built_pitch, i, built_horn_cents);
    keep(built_drum_loudness, i, lab::to_db(shown.drum_loud));
    keep(built_drum_pitch, i, built_drum_cents);
    keep(built_horn_speed, i, shown.horn_speed);
    keep(built_drum_speed, i, shown.drum_speed);
  }
  rebuilt.value = lab::ratio_db(apart, whole);
  build.difference.value = lab::ratio_db(built_apart, built_whole);

  // The left side of the horn and of the output, each as a spectrum over time.
  if (horn_tap.data) lab::spectrogram_tap(horn_picture, horn_tap.channel(0), frames);
  if (out_tap.data) lab::spectrogram_tap(out_picture, out_tap.channel(0), frames);

  measure_split();
  measure_drive();
  measure_turn();
}
