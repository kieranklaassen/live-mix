#pragma once

#include "../../kit/kit.h"
#include "params.gen.h"
#include "wave_modes.h"

namespace livemix {

// Returning Wave: every key throws a packet of waves into a closed space and
// reads the space as a cycle at the key's pitch. The packet is twenty-four
// standing modes, each turning at its own energy. Thrown together they are
// one pulse; as their phases part the pulse spreads into haze; at simple
// fractions of the return time they stand in step again in copies, so the
// twelfth, the octave and the double octave pass; at the return they are
// whole.
//
// The harmonics of what is read are worked out directly (wave_modes.h), about
// 188 times a second for each key: the density |psi|^2 is the middle of the
// image and its current is the side, which is why a key is in the middle when
// it is thrown and wide while it flows. One complex transform draws them
// into a table of 512 points (left in the real part, right in the imaginary
// one), and three tables are blended by a quadratic spline, so neither their
// steps nor a knob that jumps can be heard. What turns faster than the Blur
// allows, at the pace time has then, is taken out before the table.
class ReturningWave : public kit::DeviceBase<returning_wave::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kTable = 512;
  static constexpr float kTickSeconds = 256.0f / 48000.0f;
  static constexpr float kStealSeconds = 0.005f;
  static constexpr float kMinHz = 16.0f, kMaxHz = 8000.0f;

  void init(float sample_rate);
  void set_param(int id, float value) { if (store_param(id, value)) apply(id); }
  void note_on(int note_id, float frequency, float gain);
  void note_off(int note_id);
  void process(int frames);

 private:
  using Packet = returning_wave_dsp::Packet;
  using Weights = returning_wave_dsp::Weights;
  static constexpr int kModes = returning_wave_dsp::kModes;
  static constexpr int kHarmonics = returning_wave_dsp::kHarmonics;
  static constexpr int kBins = returning_wave_dsp::kBins;

  // The knobs that are read on the voices' ticks: smoothed on the master clock.
  static constexpr float kKnobSeconds = 0.03f;
  static constexpr float kSplashLevel = 11.0f;
  static constexpr float kBreathGain = 17.0f;    // brings the breath to the tone's level
  static constexpr float kAirHz = 6000.0f;       // over this everything is rounded off; Tilt moves it
  static constexpr float kHazeHz = 1500.0f;      // over this a dissolved wave is rounded off
  static constexpr float kLift = 4.5f;           // ... and a whole one lifted
  static constexpr float kMist = 0.6f, kSideMost = 0.8f;  // kSideMost: power of the sides against the middle, at most
  static constexpr float kBrightHz = 1700.0f;    // a middle of the spectrum over this is drawn back
  static constexpr float kDriftCents = 0.9f;
  static constexpr float kVoiceGain = 0.068f;
  // The anchor's own three harmonics.
  static constexpr float kHeld[4] = {0.0f, 1.0f, 0.22f, 0.06f};
  // Where the keys of a chord stand, at full Ears.
  static constexpr float kPan[kMaxVoices] = {0.0f, -0.45f, 0.45f, -0.75f, 0.75f, -0.2f, 0.2f, -0.9f, 0.9f, -0.6f, 0.6f, 0.0f};
  static float key_level(float hz) { return kit::clamp(std::pow(hz * (1.0f / 220.0f), -0.04f), 0.6f, 1.5f); }

  struct Voice {
    kit::Adsr env;
    kit::Drift drift;
    kit::Rng noise;
    kit::OnePole breath;
    kit::Svf spray;
    Packet packet;
    Weights weights;
    float shape[kBins];            // each harmonic's gain at this key
    float side[kBins];             // ... and how far it may stand to the sides
    float left[3][kTable + 4];     // the last three tables, the one at `newest` the latest
    float right[3][kTable + 4];
    int newest = 0, tick_at = 0;   // ... and the samples since it
    uint32_t phase = 0, increment = 0;
    float hz = 220.0f, hit = 0.0f, amp = 0.0f;
    float bottom = 220.0f;         // its first harmonic: the note, or an octave under it
    float tune = 1.0f;             // how much sooner this key returns than the knob says
    float stand = 0.0f;            // how far along a shared clock it stands
    float leaked[kModes];          // what the leak has left of each mode
    float dull = 0.0f;             // how far the leak has rounded the wave off
    float anchor_left = 1.0f;      // ... and of the anchor
    double journey = 0.0;          // where the wave is, in returns
    float pace = 0.0f;             // how fast it goes there now, in returns a second
    float blur = 0.06f;            // seconds
    float swing = 0.0f;            // Freeze: where time is on its way there and back
    float start_seen = 0.0f;       // the Start knob at the last tick
    float whole = 1.0f;            // power of the packet when it is whole
    float gain_l = 0.0f, gain_r = 0.0f, step_l = 0.0f, step_r = 0.0f;
    float tone = 1.0f, tone_step = 0.0f;   // the share of the tone that is whole
    float air = 0.0f, air_step = 0.0f;     // ... and what of it is made of breath
    float mist = 0.0f, mist_step = 0.0f;   // breath beside the tone
    float swell = 1.0f, accent = 0.0f;     // accent: what is left of the stroke of a short attack
    float splash = 0.0f, splash_fall = 0.0f, splash_rise = 0.0f;
    float loud = 1.0f;             // what the leak has left of the level, for the pool
    int shape_seen = -1, packet_seen = -1, weights_seen = -1;
    int fade_left = 0;
    bool pending = false;
    float next_hz = 0.0f, next_gain = 0.0f;
    bool active() const { return env.active() || pending; }
    bool releasing() const { return !pending && (env.releasing() || fade_left > 0); }
    float level() const {
      if (pending) return 0.3f + 0.7f * next_gain;
      return (env.stage() == kit::Adsr::kAttack ? 1.0f : env.level()) * amp * loud;
    }
  };

  // What a Walls choice is made of beside its law of time.
  struct Space {
    float slope;     // how the harmonics lean, in powers of their number
    float crest;     // ... and how they lean where the wave itself is read
    float hollow;    // what is taken from the note's own harmonic
    float even;      // how much of what dissolving takes from the level is made good (0 to 0.5)
    float anchor;    // how much of the anchor there is
    float air;       // breath that is always there
    float fade;      // how far it fades within a return, in nepers
    float wide;      // how much of the current is at the sides
  };
  static const Space& space(int walls) {
    static constexpr Space kSpaces[returning_wave_dsp::kNumWalls] = {
        {-0.2f, 0.05f, 0.0f, 0.38f, 0.8f, 0.0f, 0.0f, 1.0f},     // box
        {0.8f, 0.75f, 0.65f, 0.12f, 0.45f, 0.0f, 0.0f, 1.6f},    // ring
        {-0.9f, 0.15f, 0.0f, 0.25f, 1.1f, 0.0f, 0.0f, 1.0f},     // bowl
        {-0.25f, 0.0f, 0.0f, 0.30f, 0.7f, 0.0f, 0.0f, 1.8f},     // two rooms
        {0.5f, 0.5f, 0.6f, 0.30f, 0.6f, 0.35f, 2.2f, 1.0f},      // fading well
    };
    return kSpaces[walls];
  }

  int choice(int id, int count) const {
    return kit::clamp_int(static_cast<int>(param(id) + 0.5f), 0, count - 1);
  }
  float knob(int id) const { return knobs_[id]; }

  void apply(int id);
  void restart();
  void refresh(Voice& voice);
  void control();
  void start(Voice& voice, int index, float frequency, float gain);
  void throw_packet(Voice& voice);
  void set_shape(Voice& voice);
  void advance(Voice& voice);
  void draw(Voice& voice, int index, bool first);
  void glide(bool first, float to, float* from, float* step) const;
  float power(const Voice& voice, const float* rho) const;
  static float pace_at(double journey);
  void pass_time(float turns, double at, float* swing, double* journey) const;
  template <bool Air>
  void render(Voice& voice, int at, int count);

  float return_seconds(const Voice& voice) const { return return_now_ * voice.tune; }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  returning_wave_dsp::Law laws_[returning_wave_dsp::kNumWalls];
  kit::Fft<kTable> fft_;
  kit::Smoother volume_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  kit::Rng seeds_;
  float knobs_[returning_wave::kNumParams] = {};
  float ahead_cos_[kBins], ahead_sin_[kBins], log_harmonic_[kBins];
  float return_now_ = 12.0f;
  double shared_ = 0.0;         // the clock all keys share, in returns
  float shared_swing_ = 0.0f;
  float first_hz_ = 220.0f;     // the key the shared clock began with
  float since_control_ = 0.0f;  // samples from the last master tick to what is being rendered
  int period_ = 256;
  float per_period_ = 1.0f / 256.0f;
  float tick_seconds_ = kTickSeconds;
  float knob_coeff_ = 0.1f;
  float noise_gain_ = 1.0f;
  float accent_fall_ = 0.999f;
  float splash_drop_ = 0.99f, splash_rise_ = 0.01f;
  int steal_samples_ = 240;
  int packet_version_ = 0, weights_version_ = 0, shape_version_ = 0;
};

inline void ReturningWave::init(float sample_rate) {
  using namespace returning_wave;
  kit::SineTable::init();
  init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
  const float sr = this->sample_rate();
  fft_.init();
  for (int w = 0; w < returning_wave_dsp::kNumWalls; ++w) returning_wave_dsp::make_law(w, &laws_[w]);
  for (int k = 0; k < kBins; ++k) {
    // A fixed turn for each harmonic: a whole packet is a soft chirp in its
    // cycle and not a spike, with the same spectrum.
    const float turn = -0.021f * static_cast<float>(k * k);
    ahead_cos_[k] = kit::SineTable::cos_lookup(turn);
    ahead_sin_[k] = kit::SineTable::lookup(turn);
    log_harmonic_[k] = k > 0 ? std::log2(static_cast<float>(k)) : 0.0f;
  }
  period_ = kit::max(1.0f, kTickSeconds * sr + 0.5f);
  per_period_ = 1.0f / static_cast<float>(period_);
  tick_seconds_ = static_cast<float>(period_) / sr;
  knob_coeff_ = 1.0f - std::exp(-tick_seconds_ / kKnobSeconds);
  accent_fall_ = kit::time_to_coeff(0.2f, sr);
  splash_drop_ = kit::time_to_coeff(0.01f, sr);
  splash_rise_ = 1.0f - kit::time_to_coeff(0.004f, sr);
  noise_gain_ = std::sqrt(sr / 48000.0f);
  steal_samples_ = kit::clamp_int(static_cast<int>(kStealSeconds * sr), 1, 100000);
  pool_.reset();
  for (int v = 0; v < kMaxVoices; ++v) {
    Voice& voice = pool_.voices[v];
    voice = Voice();
    voice.env.set_sample_rate(sr);
    voice.drift.seed(0x9E3779B9u * static_cast<uint32_t>(v + 1));
    voice.drift.set_rate(0.31f, sr);
    voice.noise.seed(0x51ED270Bu * static_cast<uint32_t>(2 * v + 1));
  }
  seeds_.seed(0xA5A5F00Du);
  volume_.set_time(kSmoothingSeconds, sr);
  packet_version_ = weights_version_ = shape_version_ = 0;
  for (int id = 0; id < kNumParams; ++id) apply(id);
  volume_.snap(volume_.target);
  restart();
  idle_.reset(sr, 0.05f);
}

inline void ReturningWave::apply(int id) {
  using namespace returning_wave;
  if (id == kVolume) {
    volume_.set(kit::db_to_gain(param(id)), primed());
  } else if (id == kWalls) {
    ++packet_version_;
    ++weights_version_;
    ++shape_version_;
  } else if (id == kReading) {
    ++packet_version_;
    ++shape_version_;
  }
}

// Nothing sounds: what moved in the silence has arrived, and what runs by
// itself starts again.
inline void ReturningWave::restart() {
  using namespace returning_wave;
  volume_.snap(volume_.target);
  for (int id = 0; id < kNumParams; ++id) knobs_[id] = param(id);
  knobs_[kReturn] = std::log2(param(kReturn));
  return_now_ = param(kReturn);
  shared_ = 0.0;
  shared_swing_ = 0.0f;
  ++packet_version_;
  ++weights_version_;
  ++shape_version_;
  clock_.reset(period_);
}

// The master tick: the knobs glide, the shared clock runs.
inline void ReturningWave::control() {
  using namespace returning_wave;
  for (int id = kWidth; id <= kEars; ++id) {
    if (id == kClock) continue;
    const float target = id == kReturn ? std::log2(param(id)) : param(id);
    const float distance = target - knobs_[id];
    if (distance == 0.0f) continue;
    const bool there = std::fabs(distance) < 1.0e-4f;
    knobs_[id] = there ? target : knobs_[id] + distance * knob_coeff_;
    switch (id) {
      case kWidth:
      case kSecond:
      case kGap:
        ++shape_version_;
        ++packet_version_;
        break;
      case kThrow:
        ++shape_version_;
        ++packet_version_;
        break;
      case kPlace:
        ++packet_version_;
        break;
      case kReturn:
        return_now_ = std::exp2(knobs_[id]);
        ++weights_version_;
        break;
      case kBlur:
        ++weights_version_;
        break;
      case kTilt:
      case kBody:
        ++shape_version_;
        break;
      default:
        break;
    }
  }
  if (pool_.count_active() > 0) pass_time(tick_seconds_ / return_now_, static_cast<double>(knob(kStart)), &shared_swing_, &shared_);
  for (Voice& voice : pool_.voices) {
    if (voice.env.active()) voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
  }
}

// The wave lingers where it is whole, and a little where it stands in two,
// three or four copies: there, and nowhere else, are its upper harmonics in
// step, and at an even pace they would be over before they are heard. What is
// lost there is made good by the pace between.
inline float ReturningWave::pace_at(double journey) {
  const float way = static_cast<float>(journey - std::floor(journey));
  const float from = kit::min(way, 1.0f - way);  // the way back is the way there
  const float d1 = from * (1.0f / 0.008f), d2 = (0.5f - from) * (1.0f / 0.006f);
  const float d3 = (from - 1.0f / 3.0f) * (1.0f / 0.004f), d4 = (from - 0.25f) * (1.0f / 0.003f);
  const float held = 8.0f / (1.0f + d1 * d1) + 4.0f / (1.0f + d2 * d2) + 3.0f / (1.0f + d3 * d3) + 2.0f / (1.0f + d4 * d4);
  return 1.36f / (1.0f + held);
}

// Time goes on by `turns`. With Freeze up it swings there and back around
// where the key began: over less and less of the way, and slower.
inline void ReturningWave::pass_time(float turns, double at, float* swing, double* journey) const {
  const float freeze = knob(returning_wave::kFreeze);
  if (freeze < 0.02f) {
    *swing *= 0.97f;
  } else {
    const float reach = 0.004f + 0.5f * (1.0f - freeze) / freeze;
    turns *= 1.0f - 0.96f * freeze * freeze;
    *swing += kit::min(turns / reach, 0.5f);
    if (*swing > kit::kTwoPi) *swing -= kit::kTwoPi;
  }
  if (*swing < 1.0e-6f) *swing = 0.0f;
  turns *= pace_at(*journey + at);
  *journey += static_cast<double>(turns) * std::cos(*swing);
}

// The packet this key throws: a harder touch throws a narrower one, harder.
inline void ReturningWave::throw_packet(Voice& voice) {
  using namespace returning_wave;
  const returning_wave_dsp::Law& law = laws_[choice(kWalls, returning_wave_dsp::kNumWalls)];
  const float spread = 8.0f * std::pow(0.12f, knob(kWidth)) * (0.72f + 0.4f * voice.hit);
  // As crests the modes are odd harmonics, twice as far up.
  const float reach = choice(kReading, returning_wave_dsp::kNumReadings) == returning_wave_dsp::kWaveItself ? 0.45f : 1.0f;
  float push = reach * 17.0f * knob(kThrow) * (0.45f + 0.8f * voice.hit);
  if (law.base < 0) push *= 0.45f;
  const float place = kit::kPi * (0.03f + 0.47f * knob(kPlace));
  Packet packet;
  returning_wave_dsp::add_packet(law, spread, push, place, 1.0f, &packet);
  const float second = knob(kSecond);
  if (second > 0.0f) {
    // Thrown against the first: where the two meet they stand in stripes, as
    // many to a cycle as their two throws are apart.
    const float stripes = reach * (1.5f + 13.0f * knob(kGap));
    const float apart = (kit::kPi - 2.0f * place) * (0.1f + 0.9f * knob(kGap));
    returning_wave_dsp::add_packet(law, spread * 0.7f, kit::min(push + stripes, static_cast<float>(kModes + law.base - 1)), place + apart,
                                   2.4f * std::pow(second, 1.1f), &packet);
  }
  returning_wave_dsp::finish_packet(law, &packet);
  voice.packet = packet;
}

// Each harmonic's gain at this key: the tilt, the body's fixed resonances and
// the top of hearing; and how far it may stand to the sides.
inline void ReturningWave::set_shape(Voice& voice) {
  using namespace returning_wave;
  const int walls = choice(kWalls, returning_wave_dsp::kNumWalls);
  const Space& room = space(walls);
  const float tilt = knob(kTilt);
  const bool hollow = choice(kReading, returning_wave_dsp::kNumReadings) == returning_wave_dsp::kWaveItself;
  // A second wave thrown from afar draws stripes, and they are to be heard.
  const float stripes = knob(kSecond) * knob(kGap);
  const float slope = 0.2f - knob(kWidth) + 0.8f * (knob(kThrow) - 0.25f) + 1.1f * (voice.hit - 0.75f) + 0.9f * stripes +
                      (hollow ? room.crest : room.slope) +
                      (tilt < 0.0f ? 1.4f : (hollow ? 0.8f : 1.2f)) * tilt;
  const float air = kAirHz * std::exp2(tilt);
  // Read through an opening as wide as the packet.
  const float opening = (hollow ? 0.5f : 1.0f) / (50.0f * std::pow(0.045f, knob(kWidth)) * (1.0f + 3.0f * stripes));
  // The body: two resonances, from a large one's low pair to a small one's.
  const float body = knob(kBody);
  const float low_peak = std::log2(130.0f) + 2.7f * body, high_peak = std::log2(560.0f) + 2.6f * body;
  const float top = kit::min(15000.0f, 0.4f * sample_rate());
  voice.bottom = walls == returning_wave_dsp::kTwoRooms ? 0.5f * voice.hz : voice.hz;
  const int own = walls == returning_wave_dsp::kTwoRooms ? 2 : 1;
  voice.shape[0] = voice.side[0] = 0.0f;
  for (int k = 1; k < kBins; ++k) {
    const float f = voice.bottom * static_cast<float>(k);
    if (f >= top) {
      voice.shape[k] = voice.side[k] = 0.0f;
      continue;
    }
    const float at = std::log2(f);
    const float a = (at - low_peak) * 1.9f, b = (at - high_peak) * 2.2f;
    const float db = -8.0f + 13.0f / (1.0f + a * a) + 15.0f / (1.0f + b * b);
    const float octaves = slope * log_harmonic_[k] + db * (1.0f / 6.02f);
    const float edge = f > 0.6f * top ? (top - f) / (0.4f * top) : 1.0f;
    const float x = static_cast<float>(k) * opening;
    voice.shape[k] = std::exp2(octaves) * edge * edge * (3.0f - 2.0f * edge) / ((1.0f + x * x) * (1.0f + (f * f) / (air * air)));
    if (k == own) voice.shape[k] *= 1.0f - room.hollow;
    if (k < own) voice.shape[k] *= 5.0f;  // the wave on its way through the wall, an octave down
    voice.side[k] = f * f / (f * f + 150.0f * 150.0f);
  }
}

inline float ReturningWave::power(const Voice& voice, const float* rho) const {
  float sum = 0.0f;
  for (int k = 1; k < kBins; ++k) {
    const float x = rho[k] * voice.shape[k];
    sum += x * x;
  }
  return sum;
}

// What a knob has moved is worked out again.
inline void ReturningWave::refresh(Voice& voice) {
  using namespace returning_wave;
  const bool packet = voice.packet_seen != packet_version_;
  const bool shape = voice.shape_seen != shape_version_;
  const bool weights = voice.weights_seen != weights_version_;
  if (!packet && !weights && !shape) return;
  const returning_wave_dsp::Law& law = laws_[choice(kWalls, returning_wave_dsp::kNumWalls)];
  if (packet) throw_packet(voice);
  voice.blur = 0.03f * std::pow(60.0f, knob(kBlur));
  if (shape) set_shape(voice);
  voice.packet_seen = packet_version_;
  voice.weights_seen = weights_version_;
  voice.shape_seen = shape_version_;
  // How strong it is when whole, and at a few places where it is not: what
  // the level of every reading is taken against.
  float rho[kBins], flow[kBins];
  const int reading = choice(kReading, returning_wave_dsp::kNumReadings);
  if (reading == returning_wave_dsp::kWaveItself) {
    for (int k = 0; k < kBins; ++k) rho[k] = 0.0f;
    for (int i = 0; i < kModes; ++i) {
      rho[returning_wave_dsp::crest_harmonic(law, i)] += std::sqrt(voice.packet.re[i] * voice.packet.re[i] + voice.packet.im[i] * voice.packet.im[i]);
    }
    voice.whole = kit::max(power(voice, rho), 1.0e-4f);
    return;
  }
  static constexpr double kLooks[5] = {0.0, 0.0877, 0.1931, 0.3517, 0.4379};
  float most = 0.0f, sum = 0.0f;
  for (int look = 0; look < 5; ++look) {
    float re[kModes], im[kModes];
    for (int i = 0; i < kModes; ++i) {
      const double turns = law.energy[i] * kLooks[look];
      const float turn = static_cast<float>(turns - std::floor(turns));
      const float c = kit::SineTable::cos_lookup(turn), q = kit::SineTable::lookup(turn);
      re[i] = voice.packet.re[i] * c - voice.packet.im[i] * q;
      im[i] = voice.packet.re[i] * q + voice.packet.im[i] * c;
    }
    const float pace = pace_at(kLooks[look]) / return_seconds(voice);
    returning_wave_dsp::make_weights(law, reading, voice.packet.centre, pace, voice.blur, &voice.weights);
    returning_wave_dsp::density(law, voice.weights, re, im, voice.packet.pace, rho, flow);
    const float here = power(voice, reading == returning_wave_dsp::kFlow ? flow : rho);
    most = kit::max(most, here);
    sum += here;
  }
  voice.whole = kit::max(0.5f * most + 0.2f * sum, 1.0e-4f);
}

// One tick of a key's own time.
inline void ReturningWave::advance(Voice& voice) {
  using namespace returning_wave;
  if (voice.splash < 1.0e-6f) voice.splash = 0.0f;
  if (voice.accent < 1.0e-5f) voice.accent = 0.0f;
  const float turns = tick_seconds_ / return_seconds(voice);
  const double before = voice.journey;
  if (choice(kClock, 3) == 2) {
    voice.journey = shared_ + static_cast<double>(knob(kStart) + voice.stand) +
                    static_cast<double>(since_control_ / (sample_rate() * return_now_)) * std::cos(shared_swing_);
  } else {
    voice.journey += static_cast<double>(knob(kStart) - voice.start_seen);
    pass_time(turns, 0.0, &voice.swing, &voice.journey);
  }
  voice.start_seen = knob(kStart);
  voice.pace = kit::min(40.0f, static_cast<float>(std::fabs(voice.journey - before)) / tick_seconds_);
  const float leak = knob(kLeak);
  if (leak > 0.0f) {
    // It begins as the key has risen: a slow key is not gone before it is heard.
    const float risen = voice.env.stage() == kit::Adsr::kAttack ? voice.env.level() * voice.env.level() : 1.0f;
    const float rate = risen * (4.5f * leak * leak * leak + 0.1f * leak);
    const int base = laws_[choice(kWalls, returning_wave_dsp::kNumWalls)].base;
    for (int i = 0; i < kModes; ++i) {
      const float n = static_cast<float>(std::abs(i + base)) * (1.0f / 6.0f);
      voice.leaked[i] = flush_denormal(voice.leaked[i] * std::exp(-tick_seconds_ * rate * (0.4f + 0.7f * n + 0.8f * n * n)));
    }
    voice.dull = kit::min(1.0f, voice.dull + tick_seconds_ * rate * 0.06f);
    voice.anchor_left = flush_denormal(voice.anchor_left * std::exp(-tick_seconds_ * rate * 0.75f));
  }
}

// A value that crosses the time to the next table in a straight line. The
// line before has come to its end.
inline void ReturningWave::glide(bool first, float to, float* from, float* step) const {
  *from = first ? to : *from + *step * static_cast<float>(period_);
  *step = (to - *from) * per_period_;
}

// One table: the modes where they are, what is read off them, the gains, and
// the transform. `first` fills all three tables with it.
inline void ReturningWave::draw(Voice& voice, int index, bool first) {
  using namespace returning_wave;
  namespace dsp = returning_wave_dsp;
  refresh(voice);
  const dsp::Law& law = laws_[choice(kWalls, dsp::kNumWalls)];
  const int reading = choice(kReading, dsp::kNumReadings);

  float re[kModes], im[kModes], turn_re = 1.0f, turn_im = 0.0f, norm = 0.0f;
  for (int i = 0; i < kModes; ++i) {
    const double turns = law.energy[i] * voice.journey;
    const float turn = static_cast<float>(turns - std::floor(turns));
    const float c = kit::SineTable::cos_lookup(turn), s = kit::SineTable::lookup(turn);
    if (i == voice.packet.centre) {
      turn_re = c;
      turn_im = -s;
    }
    const float pr = voice.packet.re[i] * voice.leaked[i], pi = voice.packet.im[i] * voice.leaked[i];
    re[i] = pr * c - pi * s;
    im[i] = pr * s + pi * c;
    norm += pr * pr + pi * pi;
  }
  float rho[kBins], flow[kBins];
  dsp::make_weights(law, reading, voice.packet.centre, voice.pace, voice.blur, &voice.weights);
  if (reading == dsp::kWaveItself) {
    dsp::crests(law, voice.weights, re, im, turn_re, turn_im, rho, flow);
  } else {
    dsp::density(law, voice.weights, re, im, voice.packet.pace, rho, flow);
  }
  // Whole, the wave is bright; dissolved, it is warm.
  const float whole = dsp::wholeness(re, im);
  const float apart = 1.0f - whole;
  const float lift = law.breath > 0.0f ? 0.0f : kLift * (0.4f + 2.4f * knob(kThrow)) * whole * whole;
  const float corner = kit::max(3.5f, kHazeHz * std::exp2(1.6f * knob(kTilt)) / voice.bottom);
  const float round = apart / (corner * corner);
  for (int k = 1; k < kBins; ++k) {
    const float square = static_cast<float>(k * k);
    const float worn = 1.0f + voice.dull * square;
    const float lean = reading == dsp::kWaveItself ? 1.0f / worn : (1.0f + lift * square / (square + 30.0f)) / ((1.0f + round * square) * worn);
    rho[k] *= lean;
    flow[k] *= lean;
  }
  float tide = 1.0f;
  if (law.breath > 0.0f) {
    const float x = kit::SineTable::lookup(static_cast<float>(1.5 * (voice.journey - std::floor(voice.journey * 0.5) * 2.0)));
    const float squeeze = law.breath * x * x;
    tide = 1.0f - 0.7f * x * x;  // a bowl breathes: it is full at the end of each swing
    for (int k = 1; k < kBins; ++k) {
      const float dim = 1.0f / (1.0f + squeeze * static_cast<float>(k * k));
      rho[k] *= dim;
      flow[k] *= dim;
    }
  }
  // Whatever the knobs say, no key may be all edge: where the middle of the
  // spectrum is too high it is rounded off.
  {
    const float* heard = reading == dsp::kFlow ? flow : rho;
    float sum = 1.0e-12f, first_moment = 0.0f;
    for (int k = 1; k < kBins; ++k) {
      const float x = heard[k] * voice.shape[k];
      sum += x * x;
      first_moment += x * x * static_cast<float>(k);
    }
    const float limit = kit::max(3.0f, kBrightHz * (1.0f + 0.3f * knob(kTilt)) / voice.bottom);
    const float over = kit::max(0.0f, first_moment / (sum * limit) - 1.0f);
    if (over > 0.0f) {
      const float x = 4.0f * over / (limit * limit);
      for (int k = 1; k < kBins; ++k) {
        const float dim = 1.0f / (1.0f + x * static_cast<float>(k * k));
        rho[k] *= dim;
        flow[k] *= dim;
      }
    }
  }
  const float* mid = reading == dsp::kFlow ? flow : rho;
  const float* other = reading == dsp::kFlow ? rho : flow;

  // A dissolved wave is quieter than a whole one; some of that is made good.
  const Space& room = space(choice(kWalls, dsp::kNumWalls));
  const float size = reading == dsp::kWaveItself ? norm : norm * norm;
  const float ratio = kit::clamp(power(voice, mid) / (voice.whole * size + 1.0e-12f), reading == dsp::kFlow ? 0.03f : 0.003f, 2000.0f);
  const float even = ratio > 1.0f ? 0.48f : room.even;
  const float gain = std::pow(ratio, -even) / std::sqrt(voice.whole);
  // Where the flow stands still its other side does not: that is not lifted with it.
  const float side_most = 1.6f / std::sqrt(voice.whole);
  const float ears = knob(kEars) * knob(kEars) * room.wide * (reading == dsp::kFlow ? 0.8f : 1.9f);
  const float anchor = knob(kAnchor);
  const float hold = 1.3f * std::pow(anchor, 0.85f) * room.anchor * voice.anchor_left;
  const bool hollow = reading == dsp::kWaveItself;
  const float under = 1.0f - 0.6f * anchor * anchor * anchor;
  const int own = voice.bottom < voice.hz ? 2 : 1;
  voice.loud = kit::min(1.0f, std::sqrt(size) + hold);

  voice.newest = first ? 0 : (voice.newest + 1) % 3;
  float* left = voice.left[voice.newest];
  float* right = voice.right[voice.newest];
  // The sides are kept under the middle, so that one speaker loses nothing.
  const float side_gain = kit::min(gain, side_most) * ears;
  float middle_power = 1.0e-9f + hold * hold, side_power = 1.0e-9f;
  for (int k = 1; k < kBins; ++k) {
    const float m = voice.shape[k] * gain * under * mid[k], s = voice.shape[k] * side_gain * other[k] * voice.side[k];
    middle_power += m * m;
    side_power += s * s;
  }
  const float side_hold = kit::min(1.0f, std::sqrt(kSideMost * middle_power / side_power));
  for (int i = 0; i < kTable; ++i) left[i] = right[i] = 0.0f;
  // A table is two cycles of the key whatever the walls: they can change
  // under a held key and nothing is read at a wrong pitch on the way.
  const int per_bin = 2 / own;
  for (int k = 1; k < kBins; ++k) {
    const float g = voice.shape[k] * gain * under;
    const float middle = g * mid[k];
    const float across = side_hold * side_gain * voice.shape[k] * other[k] * voice.side[k];
    // The anchor lies a quarter turn from the wave, so they never cancel.
    const float held = k <= 3 * own && k % own == 0 && voice.shape[k] > 0.0f && !(hollow && k == 2 * own) ? hold * kHeld[k / own] : 0.0f;
    float lc = middle, ls = held + across, rc = middle, rs = held - across;
    const float c = ahead_cos_[k], s = ahead_sin_[k];
    const float lc2 = lc * c - ls * s, ls2 = lc * s + ls * c;
    const float rc2 = rc * c - rs * s, rs2 = rc * s + rs * c;
    const int bin = k * per_bin;
    left[bin] = 0.5f * (lc2 + rs2);
    right[bin] = 0.5f * (rc2 - ls2);
    left[kTable - bin] = 0.5f * (lc2 - rs2);
    right[kTable - bin] = 0.5f * (rc2 + ls2);
  }
  fft_.inverse(left, right);
  for (int i = 0; i < 4; ++i) {
    left[kTable + i] = left[i];
    right[kTable + i] = right[i];
  }
  if (first) {
    for (int t = 1; t < 3; ++t) {
      for (int i = 0; i < kTable + 4; ++i) {
        voice.left[t][i] = left[i];
        voice.right[t][i] = right[i];
      }
    }
    voice.newest = 2;
  }

  // What is worked out once a table: pitch, place in the image, breath.
  const float cents = kDriftCents * voice.drift.next(period_);
  voice.increment = static_cast<uint32_t>(static_cast<double>(0.5f * voice.hz * kit::cents_to_ratio(cents)) /
                                          sample_rate() * 4294967296.0);
  float pan = kPan[index] * 0.45f * knob(kEars);
  if (own == 2) {
    // The two rooms are to the left and to the right.
    const double across = voice.journey - static_cast<double>(knob(kStart));
    pan = 0.5f * pan - 0.85f * knob(kEars) * (1.6f - 0.6f * knob(kEars)) *
                           kit::SineTable::lookup(static_cast<float>(across - std::floor(across)));
  }
  // By pitch and Shared: the wave lifts a key as it comes by. By pitch each
  // coming is weaker than the last, so high keys are spent before low ones.
  const int clock = choice(kClock, 3);
  const double been = voice.journey - static_cast<double>(knob(kStart));
  const float far = static_cast<float>(std::fabs(been));
  float swell = 1.0f;
  if (clock != 0) {
    const double comes_by = been * (clock == 1 ? 3.0 : 2.0);
    const float x = 0.5f + 0.5f * kit::SineTable::cos_lookup(static_cast<float>(comes_by - std::floor(comes_by)));
    swell = clock == 1 ? (0.06f + 1.2f * x * x * x * x) * (0.2f + 0.8f * std::exp(-0.9f * far)) : 0.06f + 1.25f * x * x;
  }
  // A fading well: the wave sinks away over a return and comes up over the next.
  const float sunk = room.fade > 0.0f ? kit::SineTable::lookup(static_cast<float>(0.25 * (been - 4.0 * std::floor(been * 0.25)))) : 0.0f;
  const float fade = std::exp(-room.fade * sunk * sunk);
  voice.swell = first ? swell : voice.swell + (swell - voice.swell) * 0.2f;
  const float level = kVoiceGain * key_level(voice.hz) * voice.swell * fade * tide * (reading == dsp::kFlow ? 0.9f : 1.0f);
  const float gain_l = level * (1.0f - pan), gain_r = level * (1.0f + pan);
  const float spent = kit::clamp(1.0f - std::sqrt(ratio), 0.0f, 1.0f);
  const float haze = knob(kHaze);
  float air = kit::min(1.0f, haze * (0.35f + 0.75f * spent) + room.air * (0.3f + 0.7f * spent));
  if (reading == dsp::kFlow) air = kit::max(air, 0.75f + 0.25f * haze);
  const float tone = 1.0f - air;
  if (reading == dsp::kFlow) air *= 1.35f;
  // Breath as wide around every harmonic as a third of the note; what flows
  // is wider.
  const float breadth = reading == dsp::kFlow ? 1.4f : 1.0f;
  voice.breath.set_cutoff(breadth * kit::clamp(0.3f * voice.hz, 25.0f, 260.0f), sample_rate());
  air *= kBreathGain * noise_gain_ / std::sqrt(breadth);
  const float mist = (kMist * haze * haze * (0.3f + 0.7f * spent) + (reading == dsp::kFlow ? kMist * (0.2f + 1.4f * haze * haze) : 0.0f)) *
                     kit::min(1.0f, voice.loud) * noise_gain_;
  glide(first, gain_l, &voice.gain_l, &voice.step_l);
  glide(first, gain_r, &voice.gain_r, &voice.step_r);
  glide(first, tone, &voice.tone, &voice.tone_step);
  glide(first, air, &voice.air, &voice.air_step);
  glide(first, mist, &voice.mist, &voice.mist_step);
  voice.tick_at = 0;
}

inline void ReturningWave::start(Voice& voice, int index, float frequency, float gain) {
  using namespace returning_wave;
  const float sr = sample_rate();
  voice.pending = false;
  voice.fade_left = 0;
  voice.hz = frequency;
  voice.hit = gain;
  voice.amp = 0.25f + 0.75f * gain;
  voice.phase = seeds_.next_u32();
  voice.swing = 0.0f;
  voice.start_seen = knob(kStart);
  voice.tune = 1.0f;
  voice.stand = 0.0f;
  const int clock = choice(kClock, 3);
  voice.journey = static_cast<double>(knob(kStart));
  if (clock == 1) voice.tune = kit::clamp(std::pow(200.0f / frequency, 1.1f), 0.1f, 8.0f);
  if (clock == 2) {
    voice.stand = -0.06f * std::log2(frequency / first_hz_);
    voice.journey += shared_ + static_cast<double>(voice.stand);
  }
  // The pace it starts with: the knob's, as far as Freeze lets it run.
  const float freeze = knob(kFreeze) < 0.02f ? 0.0f : knob(kFreeze);
  voice.pace = pace_at(voice.journey) * (1.0f - 0.96f * freeze * freeze) / return_seconds(voice);
  for (float& left : voice.leaked) left = 1.0f;
  voice.anchor_left = 1.0f;
  voice.dull = 0.0f;
  voice.breath.reset();
  voice.spray.reset();
  voice.spray.set(kit::clamp(frequency * (1.8f + 4.0f * gain), 300.0f, 3000.0f), 0.8f, sr);
  const float splash = knob(kSplash);
  voice.splash_rise = 0.0f;
  voice.splash = kSplashLevel * std::pow(splash, 0.7f) * gain * gain * noise_gain_;
  voice.splash_fall = kit::time_to_coeff(0.06f + 0.9f * splash, sr);
  // A key that rises in no time is struck; so is one that leaks away at once.
  const float leak = knob(kLeak);
  voice.accent = 1.0f * kit::clamp(std::log(0.4f / param(kAttack)) * (1.0f / 3.0f), 0.0f, 1.0f);
  voice.amp *= 1.0f + leak;
  voice.packet_seen = voice.weights_seen = voice.shape_seen = -1;
  voice.newest = 2;
  draw(voice, index, true);
  voice.env.reset();
  voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
  voice.env.gate_on();
}

inline void ReturningWave::note_on(int note_id, float frequency, float gain) {
  if (!(frequency == frequency)) return;  // NaN
  frequency = kit::clamp(frequency, kMinHz, kMaxHz);
  if (!(gain == gain)) gain = 0.5f;
  gain = kit::clamp(gain, 0.0f, 1.0f);
  if (pool_.count_active() == 0) {
    restart();
    first_hz_ = frequency;
  }
  const int held = pool_.find_held(note_id);
  if (held >= 0) {
    Voice& again = pool_.voices[held];
    if (again.pending) {
      // Struck again before it could start: the waiting note is this one.
      again.next_hz = frequency;
      again.next_gain = gain;
      return;
    }
    again.env.fast_release(0.03f);  // a key struck again while held
  }
  bool stolen = false;
  const int index = pool_.note_on(note_id, &stolen);
  Voice& voice = pool_.voices[index];
  if (stolen) {
    // What sounds fades, then the note starts (in process).
    voice.next_hz = frequency;
    voice.next_gain = gain;
    voice.pending = true;
    if (voice.fade_left == 0) voice.fade_left = steal_samples_;
    return;
  }
  start(voice, index, frequency, gain);
}

inline void ReturningWave::note_off(int note_id) {
  const int held = pool_.find_held(note_id);
  if (held < 0) return;
  Voice& voice = pool_.voices[held];
  if (voice.pending) {
    voice.pending = false;  // let go before it began: only the fade is left
  } else {
    voice.env.gate_off();
  }
}

// `count` samples of one key, all between two of its tables.
template <bool Air>
inline void ReturningWave::render(Voice& voice, int at, int count) {
  kit::Adsr env = voice.env;
  kit::Rng noise = voice.noise;
  kit::OnePole breath = voice.breath;
  kit::Svf spray = voice.spray;
  uint32_t phase = voice.phase;
  const uint32_t increment = voice.increment;
  const int oldest = (voice.newest + 1) % 3, middle = (voice.newest + 2) % 3;
  const float* l0 = voice.left[oldest];
  const float* l1 = voice.left[middle];
  const float* l2 = voice.left[voice.newest];
  const float* r0 = voice.right[oldest];
  const float* r1 = voice.right[middle];
  const float* r2 = voice.right[voice.newest];
  float splash = voice.splash, rise = voice.splash_rise, accent = voice.accent;
  const float accent_fall = accent_fall_;
  // A key let go takes its splash with it, before its envelope is over.
  const float splash_fall = env.releasing() ? splash_drop_ : voice.splash_fall;
  const float splash_rise = splash_rise_;
  const float gain_l = voice.gain_l, gain_r = voice.gain_r;
  const float amp = voice.amp;
  const float fade_step = 1.0f / static_cast<float>(steal_samples_);
  const int fade_left = voice.fade_left;
  for (int i = 0; i < count; ++i) {
    const float since = static_cast<float>(voice.tick_at + i);
    const float x = since * per_period_;
    const float w0 = 0.5f * (1.0f - x) * (1.0f - x), w2 = 0.5f * x * x;
    const float w1 = 1.0f - w0 - w2;
    phase += increment;
    const uint32_t index = phase >> 23;
    const float t = static_cast<float>(phase & 0x7FFFFFu) * (1.0f / 8388608.0f);
    // Four points by cubic weights, over three tables by quadratic ones.
    const float t2 = t * t, t3 = t2 * t;
    const float h0 = 0.5f * (2.0f * t2 - t3 - t), h1 = 0.5f * (3.0f * t3 - 5.0f * t2) + 1.0f;
    const float h2 = 0.5f * (4.0f * t2 - 3.0f * t3 + t), h3 = 0.5f * (t3 - t2);
    float left = w0 * (h0 * l0[index] + h1 * l0[index + 1] + h2 * l0[index + 2] + h3 * l0[index + 3]) +
                       w1 * (h0 * l1[index] + h1 * l1[index + 1] + h2 * l1[index + 2] + h3 * l1[index + 3]) +
                       w2 * (h0 * l2[index] + h1 * l2[index + 1] + h2 * l2[index + 2] + h3 * l2[index + 3]);
    float thrown = 0.0f;
    float right = w0 * (h0 * r0[index] + h1 * r0[index + 1] + h2 * r0[index + 2] + h3 * r0[index + 3]) +
                        w1 * (h0 * r1[index] + h1 * r1[index + 1] + h2 * r1[index + 2] + h3 * r1[index + 3]) +
                        w2 * (h0 * r2[index] + h1 * r2[index + 1] + h2 * r2[index + 2] + h3 * r2[index + 3]);
    if (Air) {
      const float white = noise.bipolar();
      // Breath on the tone itself, which keeps it in tune, and beside it.
      const float share = voice.tone + voice.tone_step * since + kit::clamp(breath.lowpass(white) * (voice.air + voice.air_step * since), -1.7f, 1.7f);
      const float spray_now = spray.bandpass(white);
      const float beside = spray_now * (voice.mist + voice.mist_step * since);
      left = left * share + beside;
      right = right * share + beside;
      // The throw is its own event: it does not wait for a slow attack.
      rise += (1.0f - rise) * splash_rise;
      thrown = spray_now * splash * rise;
      splash *= splash_fall;
    }
    accent *= accent_fall;
    const float fade = fade_left > 0 ? static_cast<float>(fade_left - 1 - i) * fade_step : 1.0f;
    const float reach = amp * fade;
    const float level = env.next() * reach * (1.0f + accent);
    thrown *= reach;
    out_left_[at + i] += (level * left + thrown) * (gain_l + voice.step_l * since);
    out_right_[at + i] += (level * right + thrown) * (gain_r + voice.step_r * since);
  }
  voice.env = env;
  voice.noise = noise;
  voice.breath = breath;
  voice.spray = spray;
  voice.phase = phase;
  voice.splash = splash;
  voice.splash_rise = rise;
  voice.accent = accent;
  voice.tick_at += count;
  if (voice.fade_left > 0) voice.fade_left -= count;
}

inline void ReturningWave::process(int frames) {
  frames = begin_block(frames);
  if (!idle_.wake(pool_.count_active() > 0)) {
    silence_output(frames);
    return;
  }
  clear_input(frames);  // an instrument ignores its input
  int done = 0;
  while (done < frames) {
    if (clock_.counter == 0) control();
    const int count = kit::clamp_int(clock_.period - clock_.counter, 1, frames - done);
    for (int i = done; i < done + count; ++i) out_left_[i] = out_right_[i] = 0.0f;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      int at = done, left = count;
      while (left > 0 && voice.active()) {
        since_control_ = static_cast<float>(clock_.counter + at - done);
        if (voice.tick_at >= period_) {
          advance(voice);
          draw(voice, v, false);
          // Leaked away to nothing while held: the key is over.
          if (voice.loud < 2.0e-5f && !voice.pending) voice.env.reset();
        }
        int run = kit::clamp_int(period_ - voice.tick_at, 1, left);
        if (voice.fade_left > 0 && voice.fade_left < run) run = voice.fade_left;
        const bool fading = voice.fade_left > 0;
        if (voice.air > 0.0f || voice.air_step > 0.0f || voice.splash > 0.0f || voice.mist > 0.0f || voice.mist_step > 0.0f) {
          render<true>(voice, at, run);
        } else {
          render<false>(voice, at, run);
        }
        at += run;
        left -= run;
        if (fading && voice.fade_left == 0) {
          since_control_ = static_cast<float>(clock_.counter + at - done);
          if (voice.pending) {
            start(voice, v, voice.next_hz, voice.next_gain);
          } else {
            voice.env.reset();
          }
        }
      }
    }
    for (int i = done; i < done + count; ++i) {
      const float volume = volume_.next();
      out_left_[i] = kit::soft_clip(out_left_[i] * volume);
      out_right_[i] = kit::soft_clip(out_right_[i] * volume);
    }
    clock_.counter += count;
    if (clock_.counter >= clock_.period) clock_.counter = 0;
    done += count;
  }
  idle_.settle(output_peak(frames), frames);
}

}  // namespace livemix
