#pragma once

// Wind Harp: strings stretched in the wind. Nobody plucks them; the wind does.
//
//   the wind (one for the whole instrument, every 64 samples):
//     three slow sines + a random walk ──► gusts ─┬─► speed    (which harmonic)
//     lulls (seeded, at random moments) ──────────┴─► strength (how loud)
//
//   per key (up to 12), per string of its course (1 to 4):
//     speed, as heard by this string ─► a bell over the 16 harmonics ─┐
//     Hum (the fundamental, always) ──────────────────────────────────┼─► drive
//     Touch (a pluck, for 15 ms after the key goes down) ─────────────┘     │
//                                                                           ▼
//     16 sines at exactly 1, 2 … 16 times the string ◄─ level follows the drive:
//       │                                               up quickly, down over Ring
//       └─► the string's place in the stereo field ─► key envelope ─┐
//                                                                   ├─► volume ─► soft clip
//   air: noise L / R ─► band-pass that follows the speed ─► strength ┘
//
// - The wind sheds vortices at a rate that follows its speed, and a string
//   sings at whichever of its harmonics lies nearest that rate. Here the rate
//   is counted in octaves above each string's own note (Wind 0 is the
//   fundamental, Wind 1 the twelfth harmonic) and leans up by half
//   an octave per octave for low keys, as one wind across long and short
//   strings would. The bell is 1.5 octaves wide at its foot, and what it
//   lights is held at constant power, so the wind moving from one harmonic to
//   the next changes the colour and not the loudness.
// - A harmonic locks on: its level rises towards the drive in a fraction of
//   Ring and falls away over Ring once the wind has moved off, higher
//   harmonics a little sooner. Every change to what a string sings (Wind,
//   Gust, Glint, Hum, a pluck) goes through that follower, so none can click.
// - Gust is how far the one slow process moves the speed and the strength;
//   Lull lets it drop to almost nothing for 1 to 4.5 s at seeded random
//   moments. Every key hears the same wind, so a chord swells together. The
//   strings of a course do not hear it alike: each sheds at its own rate, as
//   strings of different thickness do, up to half an octave from the others
//   (kHear), and drifts by itself as far again in a gusty wind, so two strings
//   of a key seldom sing the same harmonic at the same moment. Each sits at
//   its own place between the speakers.
// - The strings of a course are tuned a few cents apart, the first of an odd
//   course in the middle; each is 1/sqrt(n) loud so the course keeps its level.
// - Glint is a ceiling on the harmonics: nothing more than half an octave
//   above it can light, whatever the wind does.
// - The wind starts afresh each time a key goes down into silence, from a
//   seed that counts those starts since init(): a phrase is the same every
//   time it is rendered from init(), and no two phrases of one sitting get
//   the same weather. That moment is exact to the sample, so the output does
//   not depend on the host's block size. A weather begins as a steady wind
//   and its gusts come in over the first second or two, so every phrase
//   starts at the level and on the harmonic the knobs say. A key that goes
//   down while others sound joins the wind that is blowing.
// - A thirteenth key takes the quietest voice: its strings fade out over
//   about 5 ms and the new note begins on silent strings.
// - Nothing rings on after the key envelopes end (they end 100 dB down, and
//   the air with them): the instrument sleeps 50 ms later.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class WindHarp : public kit::DeviceBase<wind_harp::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kMaxStrings = 4;
  static constexpr int kPartials = 16;
  static constexpr int kControlPeriod = 64;

  void init(float sample_rate) {
    using namespace wind_harp;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    tick_seconds_ = static_cast<float>(kControlPeriod) / sr;

    float pluck_power = 0.0f;
    for (int k = 0; k < kPartials; ++k) {
      const float number = static_cast<float>(k + 1);
      octave_[k] = std::log2(number);
      tilt_[k] = 1.0f / std::sqrt(number);
      pluck_[k] = 1.0f / (number * std::sqrt(number));
      pluck_power += pluck_[k] * pluck_[k];
    }
    for (float& level : pluck_) level /= std::sqrt(pluck_power);

    pool_.reset();
    kit::Rng pace;
    pace.seed(0x6A09E667u);
    uint32_t stream = 0;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.env.set_sample_rate(sr);
      // Alternate keys mirror their course so a chord fills both sides.
      voice.side = (v & 1) ? -1.0f : 1.0f;
      for (String& string : voice.strings) {
        string.drift.seed(seed_for(stream++));
        string.drift.set_rate(kHearRate * (0.7f + 0.6f * pace.uniform()), sr);
      }
    }
    start_.seed(0xBB67AE85u);
    wind_.init(sr, tick_seconds_);
    arrivals_ = 0;
    wind_.restart(arrivals_);
    restart_air();
    air_scale_ = kAirGain * std::sqrt(sr / 48000.0f);  // white noise spreads over a wider band at a higher rate

    until_tick_ = 0;
    const float control_rate = sr / static_cast<float>(kControlPeriod);
    width_.set_time(0.02f, control_rate);
    air_.set_time(0.02f, control_rate);
    air_octave_.set_time(kAirGlideSeconds, control_rate);
    presence_step_ = 1.0f - kit::time_to_coeff(kPresenceSeconds, sr);
    steal_ticks_ = static_cast<int>(kStealSeconds * control_rate) + 1;
    volume_.set_time(kSmoothingSeconds, sr);
    course_step_ = 1.0f - kit::time_to_coeff(kCourseSeconds, control_rate);
    pluck_step_ = 1.0f - kit::time_to_coeff(kPluckRiseSeconds, control_rate);
    pluck_ticks_ = static_cast<int>(kPluckSeconds * control_rate) + 1;
    ring_seen_ = -1.0f;
    layout_ = string_count();
    // Nothing outlives the key envelopes.
    idle_.reset(sr, 0.05f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    air_mid_.snap(0.0f);
    air_side_.snap(0.0f);
    air_octave_.snap(0.0f);
    airy_ = false;
    landed_ = true;
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    using namespace wind_harp;
    if (!(frequency == frequency)) return;  // NaN
    // The fundamental has to fit under the band limit.
    frequency = kit::clamp(frequency, 8.0f, kit::min(12000.0f, kBandLimit * sample_rate()));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // Nothing is sounding: a knob moved in the silence has arrived.
    if (pool_.count_active() == 0) arrive();
    const int held = pool_.find_held(note_id);
    if (held >= 0) {
      Voice& again = pool_.voices[held];
      if (again.waiting > 0) {
        // Struck again before it could start: the waiting note is this one.
        again.next_hz = frequency;
        again.next_gain = gain;
        return;
      }
      again.env.fast_release(0.05f);  // a key struck again while held
    }

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    voice.next_hz = frequency;
    voice.next_gain = gain;
    // The key is down from now: note_off finds the voice, and its level()
    // says so to the next note of a chord.
    voice.env.set(kAttackSeconds, 0.01f, 1.0f, param(kRelease));
    voice.env.gate_on();
    if (!stolen) {
      voice.waiting = 0;
      begin(voice);
    } else if (voice.waiting == 0) {
      // A sounding voice: its strings are faded out over a few control
      // ticks, and the new note begins on silent strings (see control()).
      voice.waiting = steal_ticks_ + 1;
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].env.gate_off();
  }

  void process(int frames) {
    using namespace wind_harp;
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    // Rendered in stretches that end where the next control tick falls, so
    // the ticks land on the same samples whatever the host's block size.
    int done = 0;
    while (done < frames) {
      if (until_tick_ == 0) {
        wind_.advance(param(kWind), param(kGust), param(kLull));
        control();
        until_tick_ = kControlPeriod;
      }
      const int count = kit::clamp_int(frames - done, 1, until_tick_);
      render(done, count);
      until_tick_ -= count;
      done += count;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // A value that moves in a straight line from one control tick to the next
  // and lands exactly on what it was aimed at.
  struct Glide {
    float value = 0.0f, target = 0.0f, step = 0.0f;

    void snap(float v) {
      value = target = v;
      step = 0.0f;
    }
    void aim(float v) {
      value = target;
      target = v;
      step = (v - value) * (1.0f / static_cast<float>(kControlPeriod));
    }
    float next() {
      value += step;
      return value;
    }
  };

  // One harmonic: a sine of unit size (y1 = sin φ, y2 = sin(φ - θ), turn =
  // 2 cos θ, in double so a 28 Hz fundamental stays in tune) and its level.
  struct Partial {
    double y1 = 0.0, y2 = 0.0, turn = 0.0;
    double level = 0.0, step = 0.0;
  };

  struct String {
    Partial partials[kPartials];
    double sine[kPartials] = {};   // sin θ of each harmonic
    float aim[kPartials] = {};     // where each level is going by the next tick
    unsigned char lit[kPartials] = {};
    int lit_count = 0;
    float level = 0.0f;  // the string's share of its course, 0 when it is not in it
    Glide left, right;
    kit::Drift drift;
  };

  struct Voice {
    kit::Adsr env;
    String strings[kMaxStrings];
    float hz = 220.0f;
    float gain = 0.0f;
    float trim = 1.0f;    // level by register
    float lean = 0.0f;    // octaves the wind sits higher on this key
    float top = 0.0f;     // octaves from the fundamental to the last harmonic in the band
    float pluck = 0.0f;
    float side = 1.0f;
    int available = kPartials;
    int pluck_left = 0;   // control ticks of pluck still to come
    int waiting = 0;      // control ticks until the note it was stolen for begins
    float next_hz = 220.0f, next_gain = 0.0f;

    bool active() const { return env.active(); }
    bool releasing() const { return env.releasing(); }
    // As loud as it will be from the moment it is taken, so the next note of
    // a chord does not take it again.
    float level() const { return env.stage() == kit::Adsr::kAttack ? 1.0f : env.level(); }
  };

  // The one wind every string hears. advance() is one control tick.
  struct Wind {
    kit::Drift sway;   // three slow sines
    kit::Lfo walk;     // a new random value every 3 s, joined smoothly
    kit::Rng chance;   // when the next lull comes and how long it lasts
    float tick = 0.0f;
    float into = 0.0f, out_of = 0.0f;
    float gap = 0.0f;    // 0 blowing, 1 dropped away
    float until = 0.0f;  // progress towards the next lull
    float next = 1.0f;
    float hold = 0.0f;   // seconds left of the lull in progress
    float calm = 0.0f;      // 1 as a weather begins, then falling away: how much of the gusts is held back
    float calm_keep = 0.0f;
    float speed = 0.0f;     // octaves above a string's fundamental
    float strength = 1.0f;

    void init(float sample_rate, float tick_seconds) {
      tick = tick_seconds;
      sway.set_rate(kSwayHz, sample_rate);
      walk.set_rate(kWalkHz, sample_rate);
      into = 1.0f - std::exp(-tick / kLullFallSeconds);
      out_of = 1.0f - std::exp(-tick / kLullRiseSeconds);
      calm_keep = std::exp(-tick / kOnsetSeconds);
    }

    // Weather number `count`: where the gusts stand and when the lulls come.
    // It begins as a steady wind and its gusts come in over the first second
    // or two, so a phrase starts at the level and on the harmonic the knobs
    // say and wanders from there.
    void restart(uint32_t count) {
      sway.seed(seed_for(3u * count + kWeatherSeed));
      walk.seed(seed_for(3u * count + kWeatherSeed + 1u));
      walk.reset(0.0f);
      chance.seed(seed_for(3u * count + kWeatherSeed + 2u));
      calm = 1.0f;
      gap = 0.0f;
      until = 0.0f;
      next = 0.6f + 0.8f * chance.uniform();
      hold = 0.0f;
      speed = 0.0f;
      strength = 1.0f;
    }

    void advance(float wind, float gust, float lull) {
      const float come = 1.0f - calm;  // how far this weather's gusts have come in
      calm = calm > 1.0e-4f ? calm * calm_keep : 0.0f;
      const float gusts = come * (0.75f * sway.next(kControlPeriod) +
                                  0.35f * walk.next_block(kit::Lfo::kSmooth, kControlPeriod));
      if (hold > 0.0f) {
        hold -= tick;
      } else {
        until += lull * lull * kLullRate * tick;
        if (until >= next) {
          until = 0.0f;
          next = 0.6f + 0.8f * chance.uniform();
          hold = kLullShortest + kLullSpread * chance.uniform();
        }
      }
      const float wanted = hold > 0.0f ? 1.0f : 0.0f;
      gap += (wanted - gap) * (wanted > gap ? into : out_of);
      if (gap < 1.0e-6f) gap = 0.0f;
      // A dying wind slows as it weakens: the lit harmonics come down with it.
      speed = kWindOctaves * wind + kGustOctaves * gust * gusts - kLullOctaves * gap;
      // A gust is louder as well as faster, by more than the softer high
      // harmonics take back; the loudest gust is held under kStrongest.
      const float blown = std::exp2(kGustDepth * gust * (gusts - come * kGustRest));
      strength = kStrongest * kit::fast_tanh(blown / kStrongest) * (1.0f - kLullDepth * gap);
    }
  };

  // One key at velocity 0.7 peaks near -21 dBFS at the default volume, and ten
  // held keys stay under the knee of the soft clip through the strongest gust.
  static constexpr float kVoiceGain = 0.385f;
  static constexpr float kBandLimit = 0.42f;        // of the sample rate: no harmonic above it
  static constexpr float kAttackSeconds = 0.01f;    // the key envelope; the wind does the rest
  // The wind.
  static constexpr float kWindOctaves = 3.6f;       // Wind 0..1 in octaves above the fundamental
  static constexpr float kGustOctaves = 2.0f;        // octaves the gusts move the speed at Gust 1
  static constexpr float kGustDepth = 3.2f;         // octaves of strength (6 dB each) at Gust 1
  static constexpr float kGustRest = 0.35f;         // where in a gust the strength is that of a steady wind
  static constexpr float kOnsetSeconds = 1.0f;      // a weather's gusts come in with this time constant
  // The first weather after init() is the one every offline render and
  // preview begins with. This seed gives it a gust in its first two seconds
  // and, at full Lull, a first lull that comes early and passes.
  static constexpr uint32_t kWeatherSeed = 121054u;
  static constexpr float kStrongest = 1.35f;
  static constexpr float kSwayHz = 0.12f;
  static constexpr float kWalkHz = 0.31f;
  static constexpr float kLullRate = 0.3f;          // lulls a second of wind at Lull 1
  static constexpr float kLullShortest = 1.0f;
  static constexpr float kLullSpread = 3.5f;
  static constexpr float kLullFallSeconds = 0.45f;
  static constexpr float kLullRiseSeconds = 0.7f;
  static constexpr float kLullDepth = 0.97f;        // what is left is 30 dB down
  static constexpr float kLullOctaves = 1.2f;
  // How a string hears it.
  static constexpr float kLean = 0.5f;              // octaves per octave of key below A3
  static constexpr float kLeanLimit = 1.5f;
  static constexpr float kTrim = 0.25f;             // level falls by this power of the key's frequency
  static constexpr float kTrimLeast = 0.58f;
  static constexpr float kTrimMost = 2.2f;
  static constexpr float kBell = 0.75f;             // half the foot of the bell, octaves
  static constexpr float kTaper = 0.5f;             // octaves above Glint's ceiling that still light
  static constexpr float kGlintOctaves = 4.0f;
  static constexpr float kHearDepth = 0.7f;         // octaves a string drifts from the others at Gust 1
  static constexpr float kHearRate = 0.13f;
  static constexpr float kHumGain = 0.6f;
  static constexpr float kFloor = 1.0e-3f;          // a level 60 dB under a full wind is put out
  // The follower.
  static constexpr float kRiseFloorSeconds = 0.05f;
  static constexpr float kRiseShare = 0.04f;        // of Ring
  static constexpr float kRingSlope = 0.08f;        // harmonic n rings 1 / (1 + slope·(n - 1)) as long
  static constexpr float kPluckGain = 2.0f;         // Touch 1 at full velocity, against a steady wind of 1
  static constexpr float kPluckSeconds = 0.015f;
  static constexpr float kPluckRiseSeconds = 0.003f;
  static constexpr float kCourseSeconds = 0.025f;   // a string joining or leaving its course
  // The air.
  static constexpr float kAirGain = 1.8f;
  static constexpr float kAirHz = 420.0f;
  static constexpr float kAirTrack = 0.7f;          // octaves of band per octave of wind
  static constexpr float kAirQ = 1.2f;
  static constexpr float kAirGlideSeconds = 0.05f;  // the band follows the wind this slowly
  static constexpr float kPresenceSeconds = 0.005f;
  static constexpr float kStealSeconds = 0.003f;    // a stolen voice's strings fade this long

  // Cents each string of a course of 1 to 4 sits from the played note.
  static constexpr float kCents[kMaxStrings][kMaxStrings] = {
      {0.0f, 0.0f, 0.0f, 0.0f},
      {-1.6f, 1.6f, 0.0f, 0.0f},
      {0.0f, -2.5f, 2.5f, 0.0f},
      {-1.2f, 1.2f, -3.6f, 3.6f},
  };
  // Its place between the speakers at full Width.
  static constexpr float kPan[kMaxStrings][kMaxStrings] = {
      {0.0f, 0.0f, 0.0f, 0.0f},
      {-0.6f, 0.6f, 0.0f, 0.0f},
      {0.0f, -0.8f, 0.8f, 0.0f},
      {-0.3f, 0.3f, -0.9f, 0.9f},
  };
  // Octaves by which it hears the wind above or below the course as a whole
  // (strings of different thickness shed at different rates in one wind), so
  // two strings of a key seldom sing the same harmonic at the same moment.
  static constexpr float kHear[kMaxStrings][kMaxStrings] = {
      {0.0f, 0.0f, 0.0f, 0.0f},
      {-0.25f, 0.25f, 0.0f, 0.0f},
      {0.0f, 0.4f, -0.4f, 0.0f},
      {-0.2f, 0.2f, 0.55f, -0.55f},
  };

  // An unrelated seed per stream.
  static uint32_t seed_for(uint32_t stream) {
    uint32_t x = (stream + 1u) * 0x9E3779B9u;
    x ^= x >> 16;
    x *= 0x85EBCA6Bu;
    x ^= x >> 13;
    x *= 0xC2B2AE35u;
    x ^= x >> 16;
    return x;
  }

  int string_count() const {
    return kit::clamp_int(static_cast<int>(param(wind_harp::kStrings) + 0.5f), 1, kMaxStrings);
  }

  static float course_level(int index, int count) {
    return index < count ? 1.0f / std::sqrt(static_cast<float>(count)) : 0.0f;
  }

  void place(const Voice& voice, int index, int count, float level, float* left, float* right) const {
    const float pan = width_.value * kPan[count - 1][index] * voice.side;
    const float angle = (pan + 1.0f) * 0.125f;  // cycles: 0 left, 0.25 right
    *left = level * kit::SineTable::cos_lookup(angle);
    *right = level * kit::SineTable::lookup(angle);
  }

  static void hush(String& string) {
    for (int k = 0; k < kPartials; ++k) {
      string.partials[k].level = 0.0;
      string.partials[k].step = 0.0;
      string.aim[k] = 0.0f;
    }
    string.lit_count = 0;
  }

  // `count` samples (64 at most) between two control ticks.
  void render(int offset, int count) {
    float left[kControlPeriod] = {}, right[kControlPeriod] = {}, presence[kControlPeriod] = {};
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.env.active()) continue;
      float env[kControlPeriod];
      for (int i = 0; i < count; ++i) {
        env[i] = voice.env.next() * voice.gain;
        if (env[i] > presence[i]) presence[i] = env[i];
      }
      float course_left[kControlPeriod] = {}, course_right[kControlPeriod] = {};
      for (String& string : voice.strings) {
        if (string.lit_count == 0) continue;
        double mono[kControlPeriod] = {};
        for (int j = 0; j < string.lit_count; j += 4) spin(string, j, mono, count);
        for (int i = 0; i < count; ++i) {
          const float sample = static_cast<float>(mono[i]);
          course_left[i] += sample * string.left.next();
          course_right[i] += sample * string.right.next();
        }
      }
      const float trim = voice.trim * kVoiceGain;
      for (int i = 0; i < count; ++i) {
        left[i] += course_left[i] * env[i] * trim;
        right[i] += course_right[i] * env[i] * trim;
      }
    }

    for (int i = 0; i < count; ++i) {
      float l = left[i], r = right[i];
      if (airy_) {
        // The air is there while a key is: it follows the loudest one.
        const float a = air_band_[0].bandpass(air_noise_[0].bipolar());
        const float b = air_band_[1].bandpass(air_noise_[1].bipolar());
        presence_ += (presence[i] - presence_) * presence_step_;
        if (presence[i] == 0.0f && presence_ < 1.0e-6f) presence_ = 0.0f;  // exact silence after the last key
        const float mid = (a + b) * air_mid_.next() * presence_;
        const float side = (a - b) * air_side_.next() * presence_;
        l += mid + side;
        r += mid - side;
      }
      const float volume = volume_.next();
      out_left_[offset + i] = kit::soft_clip(l * volume);
      out_right_[offset + i] = kit::soft_clip(r * volume);
    }
  }

  // Four lit harmonics of a string at once, added to `mono`. Each is
  // sin(n·θ) by its recurrence, one multiply a sample; four side by side
  // because one alone waits on its own last sample. A string with fewer
  // left over fills the group with a silent spare.
  static void spin(String& string, int first, double* mono, int count) {
    Partial spare;
    Partial* p[4];
    for (int q = 0; q < 4; ++q) {
      p[q] = first + q < string.lit_count ? &string.partials[string.lit[first + q]] : &spare;
    }
    double a1 = p[0]->y1, a2 = p[0]->y2, al = p[0]->level;
    double b1 = p[1]->y1, b2 = p[1]->y2, bl = p[1]->level;
    double c1 = p[2]->y1, c2 = p[2]->y2, cl = p[2]->level;
    double d1 = p[3]->y1, d2 = p[3]->y2, dl = p[3]->level;
    const double at = p[0]->turn, as = p[0]->step;
    const double bt = p[1]->turn, bs = p[1]->step;
    const double ct = p[2]->turn, cs = p[2]->step;
    const double dt = p[3]->turn, ds = p[3]->step;
    for (int i = 0; i < count; ++i) {
      const double a = at * a1 - a2;
      const double b = bt * b1 - b2;
      const double c = ct * c1 - c2;
      const double d = dt * d1 - d2;
      a2 = a1;
      a1 = a;
      b2 = b1;
      b1 = b;
      c2 = c1;
      c1 = c;
      d2 = d1;
      d1 = d;
      al += as;
      bl += bs;
      cl += cs;
      dl += ds;
      mono[i] += (al * a + bl * b) + (cl * c + dl * d);
    }
    p[0]->y1 = a1, p[0]->y2 = a2, p[0]->level = al;
    p[1]->y1 = b1, p[1]->y2 = b2, p[1]->level = bl;
    p[2]->y1 = c1, p[2]->y2 = c2, p[2]->level = cl;
    p[3]->y1 = d1, p[3]->y2 = d2, p[3]->level = dl;
  }

  // Start the note a voice has been given, on silent strings.
  void begin(Voice& voice) {
    using namespace wind_harp;
    const float frequency = voice.next_hz;
    const float gain = voice.next_gain;
    voice.hz = frequency;
    voice.gain = 0.2f + 0.8f * gain;
    // Low strings are given more and high ones less, so a chord is even.
    voice.trim = kit::clamp(std::pow(220.0f / frequency, kTrim), kTrimLeast, kTrimMost);
    voice.available =
        kit::clamp_int(static_cast<int>(kBandLimit * sample_rate() / frequency), 1, kPartials);
    voice.top = octave_[voice.available - 1];
    voice.lean = kit::clamp(-kLean * std::log2(frequency / 220.0f), -kLeanLimit, kLeanLimit);
    voice.pluck = param(kTouch) * kPluckGain * (0.4f + 0.6f * gain);
    voice.pluck_left = pluck_ticks_;
    const int count = string_count();
    for (int s = 0; s < kMaxStrings; ++s) {
      String& string = voice.strings[s];
      hush(string);
      string.level = course_level(s, count);
      float left, right;
      place(voice, s, count, string.level, &left, &right);
      string.left.snap(left);
      string.right.snap(right);
    }
    tune(voice, count, false);
  }

  // Set every harmonic in the band to the key's pitch. With `keep` a sine
  // that is running goes on from the phase it has (a course that changed
  // size under a held key). Otherwise each harmonic starts at a seeded
  // random phase, the same for every string of the course: the strings of a
  // key start together, as plucked strings do, and drift apart as they beat,
  // while two keys on one pitch do not add up in step.
  void tune(Voice& voice, int count, bool keep) {
    const double base = 2.0 * 3.14159265358979323846 * static_cast<double>(voice.hz) /
                        static_cast<double>(sample_rate());
    double phase[kPartials] = {};
    if (!keep) {
      for (double& turn : phase) {
        turn = 2.0 * 3.14159265358979323846 * static_cast<double>(start_.uniform());
      }
    }
    for (int s = 0; s < kMaxStrings; ++s) {
      String& string = voice.strings[s];
      const double ratio = std::exp2(static_cast<double>(kCents[count - 1][s]) / 1200.0);
      for (int k = 0; k < kPartials; ++k) {
        Partial& partial = string.partials[k];
        if (k >= voice.available) continue;  // above the band: never lit
        const double angle = base * ratio * static_cast<double>(k + 1);
        const double cosine = std::cos(angle);
        const double sine = std::sin(angle);
        if (keep) {
          const double cos_phase = (partial.y1 * 0.5 * partial.turn - partial.y2) / string.sine[k];
          partial.y2 = partial.y1 * cosine - cos_phase * sine;
        } else {
          partial.y1 = std::sin(phase[k]);
          partial.y2 = std::sin(phase[k] - angle);
        }
        partial.turn = 2.0 * cosine;
        string.sine[k] = sine;
      }
    }
  }

  // One control tick of one string: where the wind is for it, what that
  // drives, and where each harmonic's level goes by the next tick.
  void steer(Voice& voice, int index) {
    String& string = voice.strings[index];
    const float wanted = course_level(index, layout_);
    if (string.level == 0.0f && wanted == 0.0f) return;  // not in the course
    string.level += (wanted - string.level) * course_step_;
    if (wanted == 0.0f && string.level < 1.0e-4f) {
      string.level = 0.0f;
      string.left.snap(0.0f);
      string.right.snap(0.0f);
      hush(string);
      return;
    }
    float left, right;
    place(voice, index, layout_, string.level, &left, &right);
    string.left.aim(left);
    string.right.aim(right);

    if (voice.waiting > 0) {
      // Stolen: the levels go to nothing in a straight line over the ticks
      // that are left, and are there when the new note begins.
      const float share = static_cast<float>(voice.waiting - 1) / static_cast<float>(voice.waiting);
      const double per_sample = 1.0 / static_cast<double>(kControlPeriod);
      for (int j = 0; j < string.lit_count; ++j) {
        const int k = string.lit[j];
        const float was = string.aim[k];
        const float now = was * share;
        string.aim[k] = now;
        string.partials[k].level = was;
        string.partials[k].step = (static_cast<double>(now) - static_cast<double>(was)) * per_sample;
      }
      return;
    }

    // Octaves above the fundamental at which the wind sheds for this string.
    const float heard = wind_.speed + voice.lean + kHear[layout_ - 1][index] +
                        gust_ * kHearDepth * string.drift.next(kControlPeriod);
    const float at = kit::clamp(heard, 0.0f, kit::min(voice.top, ceiling_));
    float weight[kPartials];
    float power = 0.0f;
    for (int k = 0; k < voice.available; ++k) {
      const float from_wind = (octave_[k] - at) * (1.0f / kBell);
      const float over = (octave_[k] - ceiling_) * (1.0f / kTaper);
      float w = 0.0f;
      if (from_wind > -1.0f && from_wind < 1.0f && over < 1.0f) {
        w = 1.0f - from_wind * from_wind;
        w *= w;
        if (over > 0.0f) {
          const float fade = 1.0f - over * over;
          w *= fade * fade;
        }
      }
      weight[k] = w;
      power += w * w;
    }
    // Constant power over whatever the bell holds.
    const float scale = wind_.strength / std::sqrt(kit::max(power, 1.0e-12f));
    const bool plucking = voice.pluck_left > 0;
    const double per_sample = 1.0 / static_cast<double>(kControlPeriod);
    int lit = 0;
    for (int k = 0; k < kPartials; ++k) {
      const bool in_band = k < voice.available;
      float drive = in_band ? weight[k] * scale * tilt_[k] : 0.0f;
      if (k == 0) drive += hum_;
      const float was = string.aim[k];
      float now = drive > was ? was + (drive - was) * rise_step_ : drive + (was - drive) * fall_keep_[k];
      if (plucking && in_band) {
        const float plucked = voice.pluck * pluck_[k];
        if (plucked > was) now = kit::max(now, was + (plucked - was) * pluck_step_);
      }
      if (!in_band || (now < kFloor && drive < kFloor)) now = 0.0f;
      string.aim[k] = now;
      Partial& partial = string.partials[k];
      partial.level = was;  // land exactly before leaving for the next
      partial.step = (static_cast<double>(now) - static_cast<double>(was)) * per_sample;
      if (was > 0.0f || now > 0.0f) string.lit[lit++] = static_cast<unsigned char>(k);
    }
    string.lit_count = lit;
  }

  // Every 64 samples, after the wind has moved.
  void control() {
    using namespace wind_harp;
    width_.next();
    air_.next();
    gust_ = param(kGust);
    ceiling_ = kGlintOctaves * param(kGlint);
    hum_ = kHumGain * param(kHum);
    const float ring = param(kRing);
    if (ring != ring_seen_) {
      ring_seen_ = ring;
      rise_step_ = 1.0f - std::exp(-tick_seconds_ / (kRiseFloorSeconds + kRiseShare * ring));
      for (int k = 0; k < kPartials; ++k) {
        const float seconds = ring / (1.0f + kRingSlope * static_cast<float>(k));
        fall_keep_[k] = std::exp(-6.907755f * tick_seconds_ / seconds);  // 60 dB in `seconds`
      }
    }
    const int count = string_count();
    const bool relaid = count != layout_;
    layout_ = count;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.env.active()) continue;
      voice.env.set(kAttackSeconds, 0.01f, 1.0f, param(kRelease));
      if (voice.waiting > 0 && --voice.waiting == 0) {
        begin(voice);  // the stolen strings have just reached silence
      } else if (relaid && voice.waiting == 0) {
        tune(voice, count, true);
      }
      for (int s = 0; s < kMaxStrings; ++s) steer(voice, s);
      if (voice.waiting == 0 && voice.pluck_left > 0) --voice.pluck_left;
    }

    float mid, side;
    air_aim(&mid, &side);
    air_octave_.set_target(kAirTrack * wind_.speed);
    if (landed_) {
      // The first tick of a phrase: the air is where this wind puts it.
      landed_ = false;
      air_mid_.snap(mid);
      air_side_.snap(side);
      air_octave_.snap(air_octave_.target);
    } else {
      air_mid_.aim(mid);
      air_side_.aim(side);
      air_octave_.next();
    }
    airy_ = mid > 0.0f || air_mid_.value > 0.0f;
    if (airy_) {
      const float hz = kit::clamp(kAirHz * std::exp2(air_octave_.value), 120.0f, 0.3f * sample_rate());
      air_band_[0].set(hz, kAirQ, sample_rate());
      air_band_[1].set(hz, kAirQ, sample_rate());
    }
  }

  // The level of the air's middle and side. Width folds the two noises
  // towards their sum at constant power.
  void air_aim(float* mid, float* side) const {
    const float level = air_.value * air_.value * air_scale_ * wind_.strength * 0.5f;
    const float width = width_.value;
    *mid = level * std::sqrt(2.0f - width * width);
    *side = level * width;
  }

  void restart_air() {
    air_noise_[0].seed(0x1F83D9ABu);
    air_noise_[1].seed(0x5BE0CD19u);
    air_band_[0].reset();
    air_band_[1].reset();
    presence_ = 0.0f;
  }

  // Called when a key goes down and nothing is sounding. Whether the device
  // was asleep by then depends on the host's block size; that no voice is
  // active does not. The next weather begins, and whatever stood still or
  // ran on through the silence is put where a device set this way from the
  // start would have it.
  void arrive() {
    wind_.restart(++arrivals_);
    until_tick_ = 0;  // control runs on the key's first sample
    width_.snap(width_.target);
    air_.snap(air_.target);
    volume_.snap(volume_.target);
    layout_ = string_count();  // no course is sounding that would have to be retuned
    restart_air();
    landed_ = true;  // the next control tick, on the key's first sample, sets the air
  }

  void apply(int id) {
    using namespace wind_harp;
    const float value = param(id);
    switch (id) {
      case kAir:
        air_.set(value, primed());
        break;
      case kWidth:
        width_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read on the control clock or when a key goes down
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  Wind wind_;
  kit::Rng start_;
  kit::Rng air_noise_[2];
  kit::Svf air_band_[2];
  Glide air_mid_, air_side_;
  float presence_ = 0.0f;  // how much key there is for the air to be heard around
  float presence_step_ = 0.0f;
  bool airy_ = false;
  bool landed_ = true;
  kit::Smoother width_, air_, air_octave_;  // advanced on the control clock
  kit::Smoother volume_;
  int until_tick_ = 0;  // samples until the next control tick
  kit::IdleGate idle_;

  float octave_[kPartials] = {};  // log2 of the harmonic number
  float tilt_[kPartials] = {};    // higher harmonics are softer
  float pluck_[kPartials] = {};   // the spectrum of the pluck, unit power
  float fall_keep_[kPartials] = {};
  float rise_step_ = 0.0f;
  float pluck_step_ = 0.0f;
  float course_step_ = 0.0f;
  float tick_seconds_ = 0.0f;
  float air_scale_ = 1.0f;
  float ring_seen_ = -1.0f;
  float gust_ = 0.0f, ceiling_ = 0.0f, hum_ = 0.0f;
  int pluck_ticks_ = 1;
  int steal_ticks_ = 1;
  int layout_ = 1;
  uint32_t arrivals_ = 0;  // keys that went down into silence since init()
};

}  // namespace livemix
