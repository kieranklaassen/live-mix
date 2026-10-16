// Envelopes and LFOs: one note played by the lab, shaped by the kit's envelope
// (kit::Adsr, cpp/kit/env.h) and moved by slow oscillators: the kit's own
// (kit::Lfo, cpp/kit/lfo.h) and the two that the Auto Filter and the Tremolo
// carry inside them.
//
//   key ─► gate ─► envelope ─────────────┐
//                                        ▼
//   LFO ─► pitch ─► tone (a saw) ─────► (×) ─► note ─► Auto Filter ─► Tremolo ─► out
//                                                       ▲    ▲          ▲
//                                    its own LFO ─► cutoff   │          └─ its own LFO ─► level
//                                    its follower of the note┘
//
// Nothing goes in: the lab presses a key 10 ms into the loop and lets it go
// after "Key held for". The tone never stops; the envelope is what makes a
// note of it.
//
// From the kit: the envelope's level and stage (kit::Adsr, gated by the lab as
// the engine's instruments gate theirs), the LFO and its phase (kit::Lfo), the
// tone (kit::BlepOsc), and the curves of each stage and of each shape, which
// are a second kit::Adsr and a second kit::Lfo run on their own.
// Read from the devices: the Auto Filter's follower, its cutoff and its
// output; the Tremolo's own LFO and its output.
// Written for the lesson: the gate, the LFO's way to the tone's pitch (so many
// cents each way, by kit::cents_to_ratio), the note (tone times envelope), the
// tone switched by the gate alone, the gain the Tremolo multiplies by, worked
// out from the device's own state and held to its output by the "gainRebuilt"
// check, and the attack's curve left to run on to where it aims.
//
// Neither device uses kit::Lfo: each has an oscillator of its own. The lab
// sets all three to one Rate and one Shape. The kit's and the Auto Filter's
// start together and keep turning. The Tremolo's stands still while the
// device sleeps between notes, so it is not in step with the other two.
// "Random" is the one shape the three do not share exactly: the kit's and the
// Auto Filter's hold a new value each cycle, the Tremolo's glides to it.
//
// The lab starts where the technique shows plainly. Auto Filter: lowpass,
// 12 dB, no Drive, the follower's times at the device's own 10 ms and 200 ms,
// both amounts at 0 as the device starts them; Cutoff starts at 2 kHz and
// Resonance at 2 (the device: 1 kHz and 0.71) so that a sweep is easy to hear.
// Tremolo: the Tremolo mode, Drift and Smooth at 0 (the device starts them at
// 0.15 and 0.2) so that its LFO is the plain shape, and Depth at 0 (the device:
// 0.55). So the page opens on the envelope, with the LFO on the pitch alone.
//
// The build part puts the two together a piece at a time on a path of its
// own: a gate, attack, decay to sustain, release, an LFO, a destination. The
// first five are the kit's Adsr and Lfo written out, and with all five in
// place the built envelope and the built LFO are compared on every render
// with the kit's own (the "builtDifference" check). The sixth, the LFO sent
// to the tone's pitch, is the lesson's.

#include "lab.h"

#include "../../cpp/devices/auto-filter/auto_filter.h"
#include "../../cpp/devices/tremolo/tremolo.h"

using namespace livemix;

namespace {

AutoFilter filter;
Tremolo trem;
kit::Adsr env;
kit::Lfo lfo;
kit::BlepOsc saw;

constexpr int kKeyDown = 480;        // the key goes down 10 ms into the loop
constexpr float kToneLevel = 0.4f;   // the tone's peak
constexpr uint32_t kSeed = 0x51ED270Bu;  // what the LFO's random shapes are drawn from

lab::Control pitch{"pitch", "Pitch", "Hz", 55.0f, 880.0f, 220.0f, lab::kLog};
lab::Control hold{"hold", "Key held for", "s", 0.05f, 3.5f, 2.0f};
lab::Control attack{"attack", "Attack", "s", 0.001f, 2.0f, 0.2f, lab::kLog};
lab::Control decay{"decay", "Decay", "s", 0.01f, 3.0f, 0.5f, lab::kLog};
lab::Control sustain{"sustain", "Sustain", "", 0.0f, 1.0f, 0.5f};
lab::Control release{"release", "Release", "s", 0.01f, 3.0f, 0.8f, lab::kLog};
lab::Control rate{"rate", "Rate", "Hz", 0.1f, 20.0f, 5.0f, lab::kLog};
lab::Control shape{"shape", "Shape", "", 0.0f, 3.0f, 0.0f, lab::kLinear, "Sine|Triangle|Square|Random"};
lab::Control to_pitch{"toPitch", "LFO to pitch", "cents", 0.0f, 100.0f, 25.0f};
lab::Control cutoff{"cutoffHz", "Cutoff", "Hz", 20.0f, 20000.0f, 2000.0f, lab::kLog};
lab::Control resonance{"resonance", "Resonance", "Q", 0.5f, 25.0f, 2.0f, lab::kLog};
lab::Control lfo_amount{"lfoAmount", "LFO to cutoff", "%", 0.0f, 100.0f, 0.0f};
lab::Control env_amount{"envAmount", "Follower to cutoff", "%", -100.0f, 100.0f, 0.0f};
lab::Control depth{"depth", "LFO to level", "", 0.0f, 1.0f, 0.0f};

// The first sound declared is what the device at the foot of the page is fed:
// the note. The last is what the page opens on: the output.
lab::Tap gate_tap{"gate", "The key's gate", lab::kControl, lab::kLesson};
lab::Tap envelope{"envelope", "The envelope's level", lab::kControl, lab::kKit};
lab::Tap stage_tap{"stage", "The envelope's stage", lab::kControl, lab::kKit};
lab::Tap note{"note", "The note", lab::kAudio, lab::kLesson};
lab::Tap gated{"gated", "The switched tone", lab::kAudio, lab::kLesson};
lab::Tap tone{"tone", "The tone", lab::kAudio, lab::kKit};
lab::Tap lfo_tap{"lfo", "The LFO", lab::kControl, lab::kKit};
lab::Tap lfo_phase{"lfoPhase", "The LFO's phase", lab::kControl, lab::kKit, 1, "cycles"};
lab::Tap pitch_now{"pitchNow", "The tone's pitch", lab::kControl, lab::kLesson, 1, "Hz"};
lab::Tap follower{"follower", "The filter's follower", lab::kControl, lab::kDevice};
lab::Tap sweep{"sweep", "How far the cutoff moved", lab::kControl, lab::kDevice, 1, "oct"};
lab::Tap filtered{"filtered", "After the Auto Filter", lab::kAudio, lab::kDevice};
lab::Tap trem_lfo{"tremLfo", "The Tremolo's own LFO", lab::kControl, lab::kDevice};
lab::Tap gain_tap{"gain", "The Tremolo's gain", lab::kControl, lab::kLesson};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kDevice, 2};

// Each stage of the envelope on its own, against time in seconds.
lab::Tap attack_kit{"attackKit", "The attack as the kit runs it", lab::kCurve, lab::kKit, 1, "s"};
lab::Tap attack_aim{"attackAim", "The same curve, left to run on to 1.3", lab::kCurve, lab::kLesson, 1, "s"};
lab::Tap decay_kit{"decayKit", "The decay from the top to the sustain level", lab::kCurve, lab::kKit, 1, "s"};
lab::Tap release_kit{"releaseKit", "The release from the top", lab::kCurve, lab::kKit, 1, "s"};
lab::Tap release_db{"releaseDb", "The release from the top, in dB", lab::kCurve, lab::kKit, 1, "s"};

// The kit's six shapes over four cycles.
lab::Tap shape_sine{"shapeSine", "Sine", lab::kCurve, lab::kKit, 1, "cycles"};
lab::Tap shape_triangle{"shapeTriangle", "Triangle", lab::kCurve, lab::kKit, 1, "cycles"};
lab::Tap shape_saw{"shapeSaw", "Falling saw", lab::kCurve, lab::kKit, 1, "cycles"};
lab::Tap shape_square{"shapeSquare", "Square", lab::kCurve, lab::kKit, 1, "cycles"};
lab::Tap shape_steps{"shapeSteps", "Random steps", lab::kCurve, lab::kKit, 1, "cycles"};
lab::Tap shape_glide{"shapeGlide", "Random glide", lab::kCurve, lab::kKit, 1, "cycles"};

lab::Check gain_rebuilt{"gainRebuilt", "The filtered note times the worked-out gain, against the Tremolo's output",
                        "dB"};

// The build part's taps: the note so far, and the lanes its steps draw.
lab::Tap built{"built", "The note so far", lab::kAudio, lab::kLesson};
lab::Tap built_gate{"builtGate", "The gate", lab::kControl, lab::kLesson};
lab::Tap built_envelope{"builtEnvelope", "The level so far", lab::kControl, lab::kLesson};
lab::Tap built_lfo{"builtLfo", "The LFO so far", lab::kControl, lab::kLesson};
lab::Tap built_pitch{"builtPitch", "The pitch so far", lab::kControl, lab::kLesson, 1, "Hz"};

// The Shape control's four choices, as each of the three oscillators numbers them.
constexpr int kKitShape[4] = {kit::Lfo::kSine, kit::Lfo::kTriangle, kit::Lfo::kSquare, kit::Lfo::kHold};
constexpr int kFilterShape[4] = {AutoFilter::kSine, AutoFilter::kTriangle, AutoFilter::kSquare,
                                 AutoFilter::kSampleHold};

// ---------------------------------------------------------------------------
// The build part: an envelope and an LFO put together a piece at a time.

// The pieces, in the order the steps add them.
enum Piece : int { kGate = 0, kAttack = 1, kDecay = 2, kRelease = 3, kLfo = 4, kDestination = 5 };

struct Built {
  enum Stage : int { kIdle = 0, kRising, kFalling, kHeld, kLetGo };

  static constexpr float kAim = 1.3f;              // where the attack aims: above the top
  static constexpr float kSixtyDb = 6.907755279f;  // 60 dB as a natural logarithm: ln 1000
  static constexpr float kGone = 1.0e-5f;          // 100 dB down: closer than this is there

  int pieces = 0;
  bool key = false;
  int stage = kIdle;
  float level = 0.0f;
  float attack_rate = 0.0f;
  float decay_coeff = 0.0f;
  float release_coeff = 0.0f;
  kit::Rng rng;
  float phase = 0.0f;
  float increment = 0.0f;
  float previous = 0.0f;
  float next = 0.0f;
  float wave = 0.0f;  // the LFO now, -1 to 1
  float hz = 0.0f;    // the tone's pitch now
  kit::BlepOsc saw;
  float out = 0.0f;

  // A gate: the key as a number, 1 while it is held and 0 when it is not.
  // With nothing else built it is the level itself.
  float gate() const { return key ? 1.0f : 0.0f; }

  // Attack: on every sample the level covers the same share of the distance
  // to an aim above the top, and is stopped at the top. The share is sized so
  // that from 0 the top is reached in the Attack time.
  void set_attack() {
    const float samples = kit::max(1.0f, attack.value * lab::kSampleRate);
    attack_rate = 1.0f - std::exp(std::log((kAim - 1.0f) / kAim) / samples);
  }
  void rise() {
    level += attack_rate * (kAim - level);
    if (level >= 1.0f) {
      level = 1.0f;
      stage = kFalling;
    }
  }

  // Decay to sustain: on every sample the distance to the Sustain level is
  // multiplied by one number under 1, sized so that the distance is 60 dB
  // smaller after the Decay time. Within 100 dB of it, the level is there.
  void set_decay() { decay_coeff = std::exp(-kSixtyDb / kit::max(1.0f, decay.value * lab::kSampleRate)); }
  void fall() {
    level = sustain.value + (level - sustain.value) * decay_coeff;
    if (level - sustain.value < kGone) {
      level = sustain.value;
      stage = kHeld;
    }
  }

  // Release: the same fall, towards 0, from wherever the level stood when the
  // key was let go. Under 100 dB below the top the note is over.
  void set_release() { release_coeff = std::exp(-kSixtyDb / kit::max(1.0f, release.value * lab::kSampleRate)); }
  void let_go() {
    level *= release_coeff;
    if (level < kGone) {
      level = 0.0f;
      stage = kIdle;
    }
  }

  // An LFO: a phase that climbs from 0 to 1 once a cycle and starts again,
  // and a shape read off it. Each new cycle draws a new random value.
  float shaped() const {
    switch (shape.choice()) {
      case 1:  // Triangle
        return phase < 0.5f ? 4.0f * phase - 1.0f : 3.0f - 4.0f * phase;
      case 2:  // Square
        return phase < 0.5f ? 1.0f : -1.0f;
      case 3:  // Random: one value held for the whole cycle
        return previous;
      default:  // Sine
        return kit::SineTable::lookup(phase);
    }
  }
  void turn() {
    wave = shaped();
    phase += increment;
    if (phase >= 1.0f) {
      phase -= 1.0f;
      previous = next;
      next = rng.bipolar();
    }
  }

  // A destination: the LFO is sent somewhere. Here it bends the tone's pitch
  // by "LFO to pitch" cents each way; 1,200 cents are an octave.
  float bent() const { return pitch.value * kit::cents_to_ratio(to_pitch.value * wave); }

  // The key goes down: the attack starts from wherever the level stands.
  void key_down() {
    key = true;
    stage = kRising;
  }

  // The key is let go. Until the release is built, the note is cut.
  void key_up() {
    key = false;
    if (stage == kIdle) return;
    if (pieces >= kRelease) {
      stage = kLetGo;
    } else {
      stage = kIdle;
      level = 0.0f;
    }
  }

  // One sample of the level through the pieces built so far.
  void shape_level() {
    if (pieces < kAttack) {
      level = gate();
      return;
    }
    switch (stage) {
      case kRising:
        rise();
        break;
      case kFalling:
        if (pieces >= kDecay) fall();  // until the decay is built, the level stays at the top
        break;
      case kHeld:
        level = sustain.value;
        if (sustain.value <= 0.0f) stage = kIdle;
        break;
      case kLetGo:
        let_go();
        break;
      default:
        break;
    }
  }

  // One sample of the note so far: the tone, at the pitch the LFO leaves it
  // at, times the level.
  void run() {
    shape_level();
    wave = 0.0f;
    if (pieces >= kLfo) turn();
    hz = pieces >= kDestination ? bent() : pitch.value;
    out = kToneLevel * saw.saw(hz / lab::kSampleRate) * level;
  }

  void start(int pieces_) {
    pieces = pieces_;
    key = false;
    stage = kIdle;
    level = 0.0f;
    set_attack();
    set_decay();
    set_release();
    rng.seed(kSeed);
    previous = rng.bipolar();
    next = rng.bipolar();
    phase = 0.0f;
    increment = rate.value / lab::kSampleRate;
    wave = 0.0f;
    saw.reset();
    out = 0.0f;
  }
};

lab::Build build{"A gate|Attack|Decay to sustain|Release|An LFO|A destination", kLfo, -120.0f,
                 "The envelope and the LFO as built, five pieces, against the kit's own on the same key and rate"};

Built shown;  // at the step the reader chose: what the built taps hold
Built held;   // with the five pieces of the kit: what is compared with it

// ---------------------------------------------------------------------------
// Curves: each stage of the envelope and each shape of the LFO, on its own.

constexpr int kCurvePoints = 241;

// A second kit::Adsr run alone for `span` seconds, its level read at even
// steps of time. `in_db` reads it in dB against the top, never under -120.
void run_curve(lab::Tap& tap, kit::Adsr& probe, float span, bool in_db = false) {
  if (!tap.open(kCurvePoints)) return;
  tap.x0 = 0.0f;
  tap.x1 = span;
  long done = 0;
  for (int p = 0; p < kCurvePoints; ++p) {
    const long until = static_cast<long>(static_cast<double>(p) / (kCurvePoints - 1) * span * lab::kSampleRate + 0.5);
    for (; done < until; ++done) probe.next();
    const float level = probe.level();
    tap.set(p, in_db ? kit::max(-120.0f, lab::to_db(level)) : level);
  }
}

void stage_curves() {
  kit::Adsr probe;
  probe.set_sample_rate(lab::kSampleRate);

  // The attack, with nothing after it: Sustain at the top, the key held.
  probe.set(attack.value, decay.value, 1.0f, release.value);
  probe.reset();
  probe.gate_on();
  const float attack_span = 2.5f * attack.value;
  run_curve(attack_kit, probe, attack_span);
  if (attack_aim.open(kCurvePoints)) {
    attack_aim.x0 = 0.0f;
    attack_aim.x1 = attack_span;
    for (int p = 0; p < kCurvePoints; ++p) {
      const double t = 2.5 * p / (kCurvePoints - 1);  // in Attack times
      attack_aim.set(p, static_cast<float>(1.3 * (1.0 - std::pow(0.3 / 1.3, t))));
    }
  }

  // The decay, from the top.
  probe.set(attack.value, decay.value, sustain.value, release.value);
  probe.reset();
  probe.level_ = 1.0f;
  probe.stage_ = kit::Adsr::kDecay;
  run_curve(decay_kit, probe, 2.0f * decay.value);

  // The release, from the top, as a level and in dB.
  for (int pass = 0; pass < 2; ++pass) {
    probe.reset();
    probe.level_ = 1.0f;
    probe.stage_ = kit::Adsr::kRelease;
    run_curve(pass == 0 ? release_kit : release_db, probe, 2.0f * release.value, pass == 1);
  }
}

void shape_curves() {
  constexpr int kPerCycle = 120;
  constexpr int kCycles = 4;
  lab::Tap* const taps[6] = {&shape_sine, &shape_triangle, &shape_saw, &shape_square, &shape_steps, &shape_glide};
  const int shapes[6] = {kit::Lfo::kSine,   kit::Lfo::kTriangle, kit::Lfo::kSawDown,
                         kit::Lfo::kSquare, kit::Lfo::kHold,     kit::Lfo::kSmooth};
  for (int s = 0; s < 6; ++s) {
    lab::Tap& tap = *taps[s];
    if (!tap.open(kCycles * kPerCycle + 1)) continue;
    tap.x0 = 0.0f;
    tap.x1 = static_cast<float>(kCycles);
    kit::Lfo probe;
    probe.seed(kSeed);
    probe.reset();
    probe.set_rate(1.0f, static_cast<float>(kPerCycle));
    for (int p = 0; p < tap.length; ++p) tap.set(p, probe.next(shapes[s]));
  }
}

void configure() {
  namespace f = auto_filter;
  filter.init(lab::kSampleRate);
  filter.set_param(f::kType, 0.0f);   // lowpass
  filter.set_param(f::kSlope, 0.0f);  // 12 dB
  filter.set_param(f::kCutoffHz, cutoff.value);
  filter.set_param(f::kResonance, resonance.value);
  filter.set_param(f::kDriveDb, 0.0f);
  filter.set_param(f::kEnvAmount, env_amount.value);
  filter.set_param(f::kLfoAmount, lfo_amount.value);
  filter.set_param(f::kLfoRateHz, rate.value);
  filter.set_param(f::kLfoShape, static_cast<float>(kFilterShape[shape.choice()]));
  filter.set_param(f::kMix, 1.0f);

  namespace t = tremolo;
  trem.init(lab::kSampleRate);
  trem.set_param(t::kMode, 0.0f);  // Tremolo
  trem.set_param(t::kRate, rate.value);
  trem.set_param(t::kDepth, depth.value);
  trem.set_param(t::kShape, static_cast<float>(shape.choice()));  // the device's four are the control's four
  trem.set_param(t::kPhase, 0.0f);
  trem.set_param(t::kDrift, 0.0f);
  trem.set_param(t::kSmooth, 0.0f);
  trem.set_param(t::kMix, 1.0f);
}

// The follower as the Auto Filter holds it. Asleep, the device does not step
// it; on waking it runs it down by the time slept, and so does this.
float follower_now() {
  float level = filter.envelope_;
  if (filter.slept_ > 0.0) {
    level *= static_cast<float>(std::exp(filter.slept_ * std::log1p(-static_cast<double>(filter.release_coeff_))));
  }
  return level;
}

}  // namespace

void lab_setup() { kit::SineTable::init(); }

void lab_render(int frames) {
  configure();
  env.set_sample_rate(lab::kSampleRate);
  env.set(attack.value, decay.value, sustain.value, release.value);
  env.reset();
  lfo.seed(kSeed);
  lfo.reset();
  lfo.set_rate(rate.value, lab::kSampleRate);
  saw.reset();
  const int kit_shape = kKitShape[shape.choice()];

  // Let go at the loop's end or after it, the key is never let go.
  int release_at = kKeyDown + static_cast<int>(hold.value * lab::kSampleRate);
  release_at -= release_at % lab::kControlPeriod;
  bool key = false;

  // The build path beside it.
  shown.start(build.at());
  held.start(build.compared_step);
  double built_apart = 0.0, built_whole = 0.0;
  double gain_apart = 0.0, gain_whole = 0.0;

  const int total = lab::total();
  for (int i = 0; i < total; ++i) {
    const int at = i % frames;
    if (at == kKeyDown) {
      key = true;
      env.gate_on();
      shown.key_down();
      held.key_down();
    }
    if (at == release_at) {
      key = false;
      env.gate_off();
      shown.key_up();
      held.key_up();
    }

    // The envelope and the LFO, one value a sample each.
    const float level = env.next();
    const float turned = lfo.phase();
    const float m = lfo.next(kit_shape);

    // The tone, its pitch bent by the LFO, and the note it becomes.
    const float hz = pitch.value * kit::cents_to_ratio(to_pitch.value * m);
    const float wave = kToneLevel * saw.saw(hz / lab::kSampleRate);
    const float played = wave * level;

    filter.in_left()[0] = played;
    filter.in_right()[0] = played;
    filter.process(1);
    const float swept = filter.out_left()[0];

    trem.in_left()[0] = swept;
    trem.in_right()[0] = filter.out_right()[0];
    trem.process(1);
    const float out_left = trem.out_left()[0];
    const float gain = 1.0f - 0.5f * trem.depth_.value * (1.0f - trem.slew_b_[0]);

    shown.run();
    held.run();
    if (i >= frames) {
      const double level_apart = static_cast<double>(held.level) - level;
      const double wave_apart = static_cast<double>(held.wave) - m;
      built_apart += level_apart * level_apart + wave_apart * wave_apart;
      built_whole += static_cast<double>(level) * level + static_cast<double>(m) * m;
      const double apart = static_cast<double>(swept) * gain - out_left;
      gain_apart += apart * apart;
      gain_whole += static_cast<double>(out_left) * out_left;
    }

    note.put(i, played);
    gated.put(i, key ? wave : 0.0f);
    tone.put(i, wave);
    filtered.put(i, swept);
    out_tap.put(i, out_left, trem.out_right()[0]);
    built.put(i, shown.out);
    if (i % lab::kControlPeriod == 0) {
      gate_tap.put(i, key ? 1.0f : 0.0f);
      envelope.put(i, level);
      stage_tap.put(i, static_cast<float>(env.stage()));
      lfo_tap.put(i, m);
      lfo_phase.put(i, turned);
      pitch_now.put(i, hz);
      follower.put(i, follower_now());
      sweep.put(i, std::log2(filter.meter(0) / cutoff.value));
      trem_lfo.put(i, trem.slew_b_[0]);
      gain_tap.put(i, gain);
      built_gate.put(i, shown.gate());
      built_envelope.put(i, shown.level);
      built_lfo.put(i, shown.wave);
      built_pitch.put(i, shown.hz);
    }
  }
  gain_rebuilt.value = lab::ratio_db(gain_apart, gain_whole);
  build.difference.value = lab::ratio_db(built_apart, built_whole);
  stage_curves();
  shape_curves();
}
