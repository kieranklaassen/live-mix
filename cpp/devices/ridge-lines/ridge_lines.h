#pragma once

// Ridge Lines: the wave of a note is the outline of three rows of hills, one
// behind another, and the rows behind slide past.
//
//   near row (stands still, once a cycle)      ─┐
//   middle row (slides, Repeats times a cycle)  ├─► soft maximum ─► outline, left eye
//   far row (slides at another speed)          ─┘   (Penumbra)      outline, right eye
//
//   seen of each row ─► transform ─► its band, its matter ─┐
//   sum ─► shadow, land, Tone, Body, fundamental, level ─► table
//   table (faded into the next one over 8 ms) ─► read at the pitch, three players ─► envelope
//
// Occlusion. The outline less the near row is what is seen of the middle row,
// the outline with the far row less the one without it what is seen of the
// far one: each starts and stops where the rows before it let it and hide it.
// So its harmonics differ from the near row's in phase, turn as it slides and
// beat against them one by one. Each part goes through a broad band of its
// own, a little more than an octave wide, which climbs and sinks as the row
// goes by (`passing`, rows.h): the overtones glide past each other. Where a
// note meets the rows is its own, so a chord does not swell as one.
//
// Land. What stands near and far also colours the whole note, by the pitch of
// each partial (near_land, far_land), and Near stretches or cuts the time a
// note takes to fall.
//
// Sun. A shadow is the outline less a fainter copy of itself part of a cycle
// on: a comb over the harmonics, from a short bright one to half a cycle,
// where the even ones go.
//
// Pitch. A row that slides is a row out of tune: its k-th harmonic turns by
// k × speed times a second. So the near row never moves, and after the
// transform the first harmonic is put at one fixed phase in both ears, at
// the level the outline gave it or a floor under it. What slides is only the
// colour, and the note stays where it is.
//
// Band. An outline has corners and its harmonics do not end. It is drawn
// over one cycle on 512 points and transformed, so whatever folds lands on
// another harmonic of the same note; only harmonics under 18 kHz (and under
// the 241st) go into the table, which is several points a harmonic long and
// is read between its points. Nothing is drawn at the sample rate.
//
// Motion. A voice draws its picture anew every 8 ms and fades from the last
// one to it. A sliding harmonic turns a little between two pictures; the
// fade makes a straight line of that arc, which costs the fast ones level,
// and what is left would be a sideband at the drawing rate. So a row that
// moves is blurred by as far as it moves between two drawings, as a moving
// thing is on film, and the harmonics that would show it are gone. Both ears
// ride in one complex transform.
//
// Level. Every picture is scaled to one loudness from its own spectrum, so no
// knob that changes colour is a volume knob.
//
// Wind is noise carried by each voice's own wave. The instrument sleeps when
// no voice sounds.

#include "../../kit/kit.h"
#include "params.gen.h"
#include "rows.h"

namespace livemix {

class RidgeLines : public kit::DeviceBase<ridge_lines::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;

  void init(float sample_rate) {
    using namespace ridge_lines;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    kit::SineTable::init();
    draw_fft_.init();
    large_fft_.init();
    small_fft_.init();
    build_profiles();
    body_.build();
    frame_ = kit::clamp_int(static_cast<int>(kFrameSeconds * sr + 0.5f), 64, 2048);
    frame_seconds_ = static_cast<float>(frame_) / sr;
    tick_ = kit::clamp_int(static_cast<int>(kTickSeconds * sr + 0.5f), 16, kMaxTick);
    until_tick_ = 0;
    const float tick_rate = sr / static_cast<float>(tick_);
    for (kit::Smoother& s : slow_) s.set_time(kKnobSeconds, tick_rate);
    weight_coeff_ = kit::time_to_coeff(kShapeSeconds, tick_rate);
    shape_coeff_ = 1.0f - kit::time_to_coeff(kShapeSeconds, tick_rate / kBuildEvery);
    volume_.set_time(kSmoothingSeconds, sr);
    wind_.set_time(kSmoothingSeconds, sr);
    side_gain_.set_time(kSmoothingSeconds * 4.0f, sr);
    amp_coeff_ = 1.0f - kit::time_to_coeff(kSmoothingSeconds, sr);
    soft_coeff_ = 1.0f - kit::time_to_coeff(kSoftSeconds, sr);
    bite_coeff_ = kit::time_to_coeff(kBiteSeconds, sr);
    stroke_seconds_ = 0.0f;
    house_down_ = 1.0f - kit::time_to_coeff(0.006f, sr);
    house_up_ = 1.0f - kit::time_to_coeff(0.12f, sr);
    house_ = house_target_ = 1.0f;
    steal_ = kit::clamp_int(static_cast<int>(kStealSeconds * sr), 16, 4096);
    fade_step_ = 1.0f / static_cast<float>(steal_);
    wind_scale_ = std::sqrt(sr / 48000.0f);
    pool_.reset();
    orders_ = 0;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice.clear();
      voice.slot = v;
      voice.env.set_sample_rate(sr);
      voice.drift.seed(0x31F0A7u + 6151u * static_cast<uint32_t>(v));
      voice.drift.set_rate(kDriftHz, sr);
    }
    chance_.seed(0x52D6E1u);
    seed_noise();
    for (kit::Svf& f : wind_high_) {
      f.reset();
      f.set(kWindLowHz, 0.6f, sr);
    }
    for (kit::OnePole& f : wind_low_) f.reset();
    build_in_ = 0;
    idle_.reset(sr, 0.2f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    settle_knobs();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, 8.0f, kit::min(12000.0f, 0.4f * sample_rate()));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);

    // The clock and the knobs start with the first note out of silence.
    if (pool_.count_active() == 0) {
      until_tick_ = 0;
      build_in_ = 0;
      settle_knobs();
      seed_noise();
      house_ = house_target_ = 1.0f;
      for (kit::Svf& f : wind_high_) f.reset();
      for (kit::OnePole& f : wind_low_) f.reset();
    }

    // The same key again strikes the voice it has; the same id at another
    // pitch lets the old pitch go.
    Voice* same = nullptr;
    for (Voice& voice : pool_.voices) {
      if (!voice.active()) continue;
      const bool waiting = voice.pending;
      if (waiting ? voice.next_id != note_id : voice.id != note_id) continue;
      const float at = waiting ? voice.next_frequency : voice.frequency;
      if (std::fabs(at - frequency) < 1.0e-3f * frequency) {
        same = &voice;
      } else if (waiting) {
        voice.next_held = false;
      } else if (voice.held) {
        voice.let_go();
      }
    }
    if (same && same->pending) {
      same->next_gain = kit::max(same->next_held ? same->next_gain : 0.0f, gain);
      same->next_held = true;
      return;
    }
    if (same) {
      same->order = ++orders_;
      same->held = true;
      same->aim(gain);
      same->strike(param(ridge_lines::kAttack));
      same->env.gate_on();
      return;
    }
    bool stolen = false;
    const int slot = pool_.note_on(note_id, &stolen);
    Voice& voice = pool_.voices[slot];
    if (stolen) {
      voice.pending = true;
      voice.fade_left = steal_;
      voice.next_id = note_id;
      voice.next_frequency = frequency;
      voice.next_gain = gain;
      voice.next_held = true;
      return;
    }
    start(voice, note_id, frequency, gain);
  }

  void note_off(int note_id) {
    for (Voice& voice : pool_.voices) {
      if (!voice.active()) continue;
      if (voice.pending) {
        if (voice.next_id == note_id) voice.next_held = false;
      } else if (voice.id == note_id && voice.held) {
        voice.let_go();
      }
    }
  }

  // What the display is told of the newest note: its pitch, where its rows
  // stand in turns of their own, and how far its envelope is up.
  enum Meter : int { kMeterKey = 0, kMeterMiddle, kMeterFar, kMeterLevel };
  float meter(int index) const {
    const Voice* newest = nullptr;
    for (const Voice& voice : pool_.voices) {
      if (voice.active() && !voice.pending && (newest == nullptr || voice.order > newest->order)) newest = &voice;
    }
    if (newest == nullptr) return 0.0f;
    switch (index) {
      case kMeterKey: return newest->frequency;
      case kMeterMiddle: return newest->middle + newest->sway;
      case kMeterFar: return newest->far - newest->sway;
      case kMeterLevel: return newest->env.level();
      default: return 0.0f;
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);
    int done = 0;
    while (done < frames) {
      if (until_tick_ <= 0) {
        control();
        until_tick_ = tick_;
      }
      const int count = frames - done < until_tick_ ? frames - done : until_tick_;
      until_tick_ -= count;
      for (int i = 0; i < count; ++i) {
        bus_left_[i] = bus_right_[i] = 0.0f;
        air_left_[i] = air_right_[i] = 0.0f;
        side_buf_[i] = side_gain_.next();
      }
      for (Voice& voice : pool_.voices) {
        if (voice.active()) render(voice, count);
      }
      for (int i = 0; i < count; ++i) {
        house_ += (house_target_ - house_) * (house_target_ < house_ ? house_down_ : house_up_);
        const float volume = volume_.next() * kVoiceGain * house_;
        const float wind = wind_.next() * wind_scale_;
        // Two draws a sample whatever Wind is, so the noise of a place in
        // time does not hang on the knob.
        const float hiss_left = noise_[0].bipolar() * air_left_[i] * wind;
        const float hiss_right = noise_[1].bipolar() * air_right_[i] * wind;
        const float left = bus_left_[i] + wind_low_[0].lowpass(wind_high_[0].highpass(hiss_left));
        const float right = bus_right_[i] + wind_low_[1].lowpass(wind_high_[1].highpass(hiss_right));
        out_left_[done + i] = kit::soft_clip(left * volume);
        out_right_[done + i] = kit::soft_clip(right * volume);
      }
      done += count;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kTable = 1024;    // points of a low note's table
  static constexpr int kSmall = 256;     // and of a high one's
  static constexpr int kHarmonics = 240;  // the most a table holds
  static constexpr int kSmallHarmonics = 14;
  static constexpr int kMiddleHarmonics = 44;
  static constexpr int kMaxTick = 64;
  static constexpr int kBuildEvery = 4;  // control ticks between two builds of the rows

  static constexpr float kTopHz = 18000.0f;
  static constexpr float kMiddleTopHz = 10000.0f, kFarTopHz = 7000.0f;  // distance takes the top of what is far off
  static constexpr float kBandTopHz = 5200.0f;  // no band of a row behind lies higher
  static constexpr float kBandFloor = 0.02f;
  static constexpr float kFrameSeconds = 0.008f;
  static constexpr float kTickSeconds = 1.0f / 1500.0f;
  static constexpr float kKnobSeconds = 0.02f;
  static constexpr float kShapeSeconds = 0.03f;
  static constexpr float kStealSeconds = 0.006f;
  static constexpr float kSoftSeconds = 0.003f;
  static constexpr float kBiteSeconds = 0.05f;
  static constexpr float kDriftHz = 0.11f;
  static constexpr float kWindLowHz = 900.0f;

  // One note at gain 0.7 peaks near -19 dBFS at the default volume.
  static constexpr float kVoiceGain = 0.058f;
  // How far a picture is brought to one loudness (0.5 would be all the way).
  static constexpr float kEven = 0.485f;
  // The least of a picture's energy that is fundamental.
  static constexpr float kAnchor = 0.2f;
  static constexpr float kGroundMost = 4.0f;

  struct Voice {
    bool sounding = false;
    bool held = false;
    int id = -1;
    int slot = 0;
    int order = 0;  // how many notes began before it
    float frequency = 220.0f;
    float gain = 0.7f;
    float amp = 0.0f, amp_target = 0.0f;
    float out = 0.0f;  // the gain as it is played: no step of a stroke or of Sustain is heard as one
    float bite = 0.0f;
    float stroke = 0.0f, struck = 0.0f;  // how hard the last one was, and what is left of it
    kit::Adsr env;
    // A stolen voice fades and then takes the note that waits.
    bool pending = false, next_held = false;
    int next_id = -1;
    float next_frequency = 220.0f, next_gain = 0.7f;
    float fade = 1.0f;
    int fade_left = 0;
    // Where the three players are in the cycle.
    float phase[3] = {0.0f, 0.0f, 0.0f};
    float step[3] = {0.0f, 0.0f, 0.0f};
    // Where the rows behind are, in turns of their own.
    float middle = 0.0f, far = 0.0f;
    float vibrato_phase = 0.0f, vibrato_rise = 0.0f, vibrato_rate = 5.0f;
    float pace = 1.0f;
    float sway = 0.0f;
    float tremble = 1.0f, tremble_step = 0.0f;
    kit::Drift drift;
    // The two pictures, and how far the fade between them has come.
    int which = 0;
    int size = kTable;
    int harmonics = 1;
    int frame_left = 0;
    float mix = 0.0f, mix_step = 0.0f;
    float body[kHarmonics + 1] = {}, wood[kHarmonics + 1] = {}, land[kHarmonics + 1] = {}, ahead[kHarmonics + 1] = {};
    int place = -1, crossing = 0;
    float table[2][2 * (kTable + 1)] = {};

    bool active() const { return sounding; }
    bool releasing() const { return !pending && !held; }
    float level() const {
      if (pending) return 2.0f + next_gain;
      return held ? amp_target * kit::max(env.level(), env.stage() == kit::Adsr::kAttack ? 1.0f : 0.0f)
                  : amp_target * env.level();
    }
    // A quick attack is a stroke: it stands over the tone that follows.
    void strike(float attack) {
      stroke = kit::clamp(1.0f - std::log2(attack * 125.0f) * 0.2f, 0.0f, 1.0f);
      struck = stroke;
      bite = 1.0f;
    }
    void aim(float velocity) {
      gain = velocity;
      amp_target = 0.15f + 0.85f * velocity;
    }
    void let_go() {
      held = false;
      env.gate_off();
    }
    void clear() {
      sounding = held = pending = next_held = false;
      id = next_id = -1;
      amp = amp_target = out = bite = stroke = struck = 0.0f;
      fade = 1.0f;
      env.reset();
      which = 0;
      frame_left = 0;
      mix = mix_step = 0.0f;
      middle = far = 0.0f;
      pace = 1.0f;
      sway = 0.0f;
      tremble = 1.0f;
      tremble_step = 0.0f;
      vibrato_phase = vibrato_rise = 0.0f;
      for (int p = 0; p < 3; ++p) phase[p] = step[p] = 0.0f;
    }
  };

  // The knobs the pictures are drawn from, smoothed on the control clock.
  enum Slow : int {
    kSlowHeight = 0, kSlowTravel, kSlowParallax, kSlowPenumbra, kSlowSun, kSlowGround, kSlowJag,
    kSlowEyes, kSlowTone, kSlowGlow, kSlowBody, kSlowCompany, kSlowVibrato, kSlowSustain, kNumSlow
  };
  static constexpr int kSlowParam[kNumSlow] = {
      ridge_lines::kHeight, ridge_lines::kTravel, ridge_lines::kParallax, ridge_lines::kPenumbra,
      ridge_lines::kSun, ridge_lines::kGround, ridge_lines::kJag, ridge_lines::kEyes, ridge_lines::kTone,
      ridge_lines::kGlow, ridge_lines::kBody, ridge_lines::kCompany, ridge_lines::kVibrato,
      ridge_lines::kSustain};
  // How often the far row repeats for each count of the middle one.
  static constexpr int kFarRepeats[10] = {0, 2, 3, 5, 7, 8, 11, 13, 17, 19};
  static constexpr int kMiddleRepeats[10] = {0, 1, 2, 3, 4, 5, 6, 8, 11, 14};

  int repeats() const { return kMiddleRepeats[step()]; }
  int far_repeats() const { return kFarRepeats[step()]; }
  int step() const { return kit::clamp_int(static_cast<int>(param(ridge_lines::kRepeats) + 0.5f), 1, 9); }
  float knob(int slow) const { return slow_[slow].value; }
  int choice(int id, int count) const {
    return kit::clamp_int(static_cast<int>(param(id) + 0.5f), 0, count - 1);
  }

  void start(Voice& voice, int note_id, float frequency, float gain) {
    voice.sounding = true;
    voice.held = true;
    voice.pending = false;
    voice.id = note_id;
    voice.order = ++orders_;
    voice.frequency = frequency;
    voice.fade = 1.0f;
    voice.aim(gain);
    voice.amp = voice.amp_target;
    voice.out = 0.0f;
    voice.strike(param(ridge_lines::kAttack));
    tune_env(voice);
    voice.env.reset();
    voice.env.gate_on();
    // Each note meets the rows at a place of its own. Eight draws a note,
    // whatever the knobs, so a sequence is the same after every init.
    // With Travel at zero that place is the same for every note.
    const float spread = kit::min(1.0f, 8.0f * knob(kSlowTravel));
    voice.middle = 0.3f + spread * (chance_.uniform() - 0.3f);
    voice.far = 0.3f + spread * (chance_.uniform() - 0.3f);
    for (float& p : voice.phase) p = chance_.uniform();
    voice.vibrato_phase = chance_.uniform();
    voice.vibrato_rate = 5.0f + 0.5f * chance_.bipolar();
    voice.pace = 1.0f + 0.12f * chance_.bipolar();
    voice.vibrato_rise = 0.0f;
    voice.sway = 0.0f;
    voice.tremble = 1.0f;
    voice.tremble_step = 0.0f;
    // How many harmonics fit, and what the body does to each.
    const float top = kit::min(kTopHz, 0.44f * sample_rate());
    voice.harmonics = kit::clamp_int(static_cast<int>(top / frequency), 1, kHarmonics);
    voice.size = voice.harmonics <= kSmallHarmonics    ? kSmall
                 : voice.harmonics <= kMiddleHarmonics ? ridge_lines::kDraw
                                                       : kTable;
    for (int h = 1; h <= voice.harmonics; ++h) {
      voice.body[h] = body_.at(static_cast<float>(h) * frequency);
      voice.wood[h] = std::sqrt(voice.body[h]);
    }
    see_land(voice, true);
    for (float& s : voice.step) s = frequency / sample_rate();
    voice.which = 0;
    draw(voice, voice.table[0], predicted(voice));
    // The first picture is short by the slot's place, so the voices of a
    // chord do not all draw in one block for ever after.
    next_picture(voice, frame_ / 4 + (voice.slot % 6) * (frame_ / 8));
  }

  // The gain of the land before a voice, on the way to what Near says.
  void see_land(Voice& voice, bool at_once) {
    using namespace ridge_lines;
    const int near = choice(kNear, kShapes), far = choice(kFar, kFarShapes);
    if (at_once || voice.place != near * kFarShapes + far) {
      voice.place = near * kFarShapes + far;
      voice.crossing = kCrossing;
      for (int h = 1; h <= voice.harmonics; ++h) {
        const float x = static_cast<float>(h), hz = x * voice.frequency;
        voice.ahead[h] = kit::db_to_gain(near_land(near, hz, x) + far_land(far, hz));
      }
    }
    if (voice.crossing <= 0) return;
    --voice.crossing;
    const float way = at_once || voice.crossing == 0 ? 1.0f : kCross;
    for (int h = 1; h <= voice.harmonics; ++h) voice.land[h] += (voice.ahead[h] - voice.land[h]) * way;
  }

  void tune_env(Voice& voice) {
    using namespace ridge_lines;
    voice.env.set(param(kAttack), param(kDecay) * ring_time_, knob(kSlowSustain), param(kRelease) * ring_time_);
    const float stroke_seconds = kit::clamp(0.1f * param(kDecay), 0.06f, 0.8f);
    if (stroke_seconds != stroke_seconds_) {
      stroke_seconds_ = stroke_seconds;
      struck_coeff_ = kit::time_to_coeff(stroke_seconds, sample_rate());
    }
  }

  // The envelope as it will be at the end of the next picture.
  float predicted(const Voice& voice) const {
    using namespace ridge_lines;
    const float level = voice.env.level();
    if (voice.env.stage() != kit::Adsr::kAttack) return level;
    const float rise = 1.0f - std::exp(-1.466f * frame_seconds_ / param(kAttack));
    return kit::min(1.0f, level + (1.3f - level) * rise);
  }

  // Moves the rows on by one picture and draws it into the table that is out
  // of sight; the fade to it takes `length` samples.
  void next_picture(Voice& voice, int length) {
    const float seconds = static_cast<float>(length) / sample_rate();
    const float speed = travel_speed() * voice.pace * (1.0f + 0.2f * voice.drift.next(length));
    voice.middle += speed * seconds;
    voice.far += speed * far_share() * seconds;
    voice.middle -= std::floor(voice.middle);
    voice.far -= std::floor(voice.far);
    // The waver rocks the rows as well, by where it will be when this
    // picture is whole.
    const float ahead = voice.vibrato_phase + voice.vibrato_rate * seconds;
    voice.sway = knob(kSlowVibrato) * kSway * voice.vibrato_rise * kit::SineTable::lookup(ahead);
    see_land(voice, false);
    draw(voice, voice.table[1 - voice.which], predicted(voice));
    voice.frame_left = length;
    voice.mix = 0.0f;
    voice.mix_step = 1.0f / static_cast<float>(length);
  }

  // How much of the passing there is: none while nothing travels.
  float moving() const { return kit::min(1.0f, 6.0f * knob(kSlowTravel)); }

  // Turns a second of the middle row; the far row's share of it.
  float travel_speed() const {
    const float t = knob(kSlowTravel);
    return 2.8f * t * t * std::sqrt(t);
  }
  float far_share() const { return 1.0f - 1.5f * knob(kSlowParallax); }

  // What one eye sees of each row behind: the middle one over the near one,
  // and the far one over both.
  void outline(const Voice& voice, float eye, float* middle, float* far) const {
    using namespace ridge_lines;
    const int repeats = this->repeats();
    const float lift = (knob(kSlowHeight) - 0.5f) * 1.0f;
    read_row(ring_[1], repeats, voice.middle + voice.sway + eye * kEyeMiddle, lift, middle);
    read_row(ring_[2], far_repeats(), voice.far - voice.sway + eye * kEyeFar, lift + kFarLift, far);
    const float p = knob(kSlowPenumbra);
    // Harder touch, harder edge.
    const float k = kit::max(0.02f, 0.3f * p + 4.0f * p * p * p + 0.25f * p * (1.0f - voice.gain));
    const float inverse = 1.0f / k;
    const float* near = ring_[0];
    for (int i = 0; i < kDraw; ++i) middle[i] = soft_max(near[i], middle[i], k, inverse);
    for (int i = 0; i < kDraw; ++i) far[i] = soft_max(middle[i], far[i], k, inverse) - middle[i];
    for (int i = 0; i < kDraw; ++i) middle[i] -= near[i];
  }

  // Where a row's band stands for one eye, 0 to 1, as the row goes by.
  float stand(float place) const {
    float sum = 0.0f;
    for (int s = 0; s < ridge_lines::kFarShapes; ++s) {
      if (far_weight_[s] > 0.0f) sum += far_weight_[s] * ridge_lines::passing(s, place);
    }
    return sum;
  }

  // The gain of every harmonic of one row behind for one eye.
  void band(const Voice& voice, float place, float repeats, float octaves, float top_hz, float* gain) const {
    const float stand = this->stand(place);
    const float most = kit::max(1.0f, kBandTopHz / voice.frequency);
    const float at = kit::clamp(repeats * matter_.at * std::exp2(matter_.climb * (stand - 0.5f) + octaves), 1.0f, most);
    const float peak = kit::db_to_gain(matter_.level + matter_.loud * (2.0f * stand - 1.0f));
    const float inverse = 1.0f / at, sharp = matter_.sharp, far_off = voice.frequency / top_hz;
    const int count = voice.harmonics;
    for (int h = 1; h <= count; ++h) {
      const float x = static_cast<float>(h);
      const float off = x * inverse - at * upside_[h];
      const float hazed = x * far_off;
      gain[h] = peak * (kBandFloor + 1.0f / (1.0f + sharp * off * off)) / (1.0f + hazed * hazed);
    }
  }

  // The two ears of one row out of the transform of both, weighed, and their
  // energy as the ear counts it.
  static float part(const float* re, const float* im, const float* left, const float* right, const float* weight,
                    int count, float* lr, float* li, float* rr, float* ri) {
    float energy = 0.0f;
    for (int h = 1; h <= count; ++h) {
      const float a = re[h], b = im[h], c = re[ridge_lines::kDraw - h], d = im[ridge_lines::kDraw - h];
      const float gl = 0.5f * left[h], gr = 0.5f * right[h];
      lr[h] = (a + c) * gl;
      li[h] = (b - d) * gl;
      rr[h] = (b + d) * gr;
      ri[h] = (c - a) * gr;
    }
    for (int h = 1; h <= count; ++h) {
      energy += (lr[h] * lr[h] + li[h] * li[h] + rr[h] * rr[h] + ri[h] * ri[h]) * weight[h];
    }
    return energy;
  }

  void draw(Voice& voice, float* table, float level) {
    using namespace ridge_lines;
    static float middle_re[kDraw], middle_im[kDraw], far_re[kDraw], far_im[kDraw];
    static float wide_re[kTable], wide_im[kTable], shade[kHarmonics + 1], weight[kHarmonics + 1];
    static float left[kHarmonics + 1], right[kHarmonics + 1];
    static float mlr[kHarmonics + 1], mli[kHarmonics + 1], mrr[kHarmonics + 1], mri[kHarmonics + 1];
    static float flr[kHarmonics + 1], fli[kHarmonics + 1], frr[kHarmonics + 1], fri[kHarmonics + 1];
    const float eyes = 0.5f * knob(kSlowEyes) * std::sqrt(knob(kSlowEyes));
    const float apart = eyes * matter_.apart;
    outline(voice, apart, middle_re, far_re);
    outline(voice, -apart, middle_im, far_im);
    draw_fft_.forward(middle_re, middle_im);
    draw_fft_.forward(far_re, far_im);

    // Tone, Glow and Body, a gain a harmonic.
    const float f = voice.frequency;
    const float open = 5.8f * knob(kSlowTone) + 3.2f * (voice.gain - 0.7f) + 1.2f * voice.struck +
                       knob(kSlowGlow) * (1.2f + kGlow * std::log2(kit::max(level, 0.25f)));
    const float cutoff = 220.0f * std::exp2(open + 0.45f * std::log2(f * (1.0f / 220.0f)));
    const float ratio = f / cutoff;
    const float ear = f * (1.0f / 1800.0f);
    // Body in two straight stretches: to the root of its gain, and on to it.
    const float wood = 2.0f * kit::min(0.5f, knob(kSlowBody)), box = 2.0f * kit::max(0.0f, knob(kSlowBody) - 0.5f);
    const int count = voice.harmonics;
    for (int h = 1; h <= count; ++h) {
      const float r = static_cast<float>(h) * ratio;
      const float e = static_cast<float>(h) * ear;
      const float boxed = 1.0f + wood * (voice.wood[h] - 1.0f) + box * (voice.body[h] - voice.wood[h]);
      const float g = boxed * voice.land[h] * soft_[h] / (1.0f + r * r);
      shade[h] = g;
      // The ear counts what is above 2 kHz for more.
      weight[h] = g * g * (1.0f + 1.5f * e * e / (1.0f + e * e));
    }
    float near_energy = 0.0f;
    for (int h = 1; h <= count; ++h) {
      near_energy += 2.0f * (near_re_[h] * near_re_[h] + near_im_[h] * near_im_[h]) * weight[h];
    }
    const int repeats = this->repeats();
    const float lag = eyes * matter_.lag;
    const float beyond = kBeyond * (knob(kSlowParallax) - 0.4f);
    band(voice, voice.middle + lag, static_cast<float>(repeats), 0.0f, kMiddleTopHz, left);
    band(voice, voice.middle - lag, static_cast<float>(repeats), 0.0f, kMiddleTopHz, right);
    const float middle_energy = part(middle_re, middle_im, left, right, weight, count, mlr, mli, mrr, mri);
    const float far_repeats = static_cast<float>(this->far_repeats());
    band(voice, voice.far + lag, far_repeats, beyond, kFarTopHz, left);
    band(voice, voice.far - lag, far_repeats, beyond, kFarTopHz, right);
    const float far_energy = part(far_re, far_im, left, right, weight, count, flr, fli, frr, fri);

    // The rows behind against the one in front: by Height, and only partly
    // by how much of them is seen just now. They stand out while a note is
    // over the level it settles at.
    const float settled = knob(kSlowSustain);
    const float over = kit::clamp((level - settled) / (1.02f - settled), 0.0f, 1.0f);
    const float behind = kit::db_to_gain(kBehindLow + kBehindSpan * knob(kSlowHeight) + kRiseDb * over);
    const float base = 1.0f / (near_energy + 1.0f);
    const float gm = behind * std::pow((middle_energy + 1.0f) * base, -kShare);
    const float gf = behind * kFarShare * std::pow((far_energy + 1.0f) * base, -kShare);
    for (int h = 1; h <= count; ++h) {
      const float a = near_re_[h] + gm * mlr[h] + gf * flr[h], b = near_im_[h] + gm * mli[h] + gf * fli[h];
      const float c = near_re_[h] + gm * mrr[h] + gf * frr[h], d = near_im_[h] + gm * mri[h] + gf * fri[h];
      const float sr = shadow_re_[h], si = shadow_im_[h];
      mlr[h] = a * sr - b * si;
      mli[h] = a * si + b * sr;
      mrr[h] = c * sr - d * si;
      mri[h] = c * si + d * sr;
    }
    float energy = 0.0f;
    for (int h = 2; h <= count; ++h) {
      energy += (mlr[h] * mlr[h] + mli[h] * mli[h] + mrr[h] * mrr[h] + mri[h] * mri[h]) * weight[h];
    }
    // The fundamental: what both eyes see of it together, at one phase.
    const float seen =
        0.5f * (mlr[1] * mlr[1] + mli[1] * mli[1] + mrr[1] * mrr[1] + mri[1] * mri[1]) * shade[1] * shade[1];
    // A soft touch leaves more of it, a hard one less.
    const float ground = knob(kSlowGround) * (0.4f + 1.4f * knob(kSlowGround)) * (1.0f - 0.5f * (voice.gain - 0.7f));
    const float first = std::sqrt((seen + 0.5f * kAnchor * energy) * kGroundMost * ground * ground);
    const float share = (2.0f * energy + 4.0f * first * first) / (2.0f * kDraw * kDraw);
    const float swell = kit::db_to_gain(matter_.swell * moving() * (2.0f * stand(voice.middle) - 1.3f));
    const float scale = std::pow(kit::max(share, 1.0e-7f), -kEven) * swell / kDraw;

    // As many points as keep the harmonics well apart in a table read
    // along straight lines.
    const int size = voice.size;
    for (int i = 0; i < size; ++i) wide_re[i] = wide_im[i] = 0.0f;
    for (int h = 2; h <= count; ++h) {
      const float g = shade[h] * scale;
      wide_re[h] = (mlr[h] - mri[h]) * g;
      wide_im[h] = (mli[h] + mrr[h]) * g;
      wide_re[size - h] = (mlr[h] + mri[h]) * g;
      wide_im[size - h] = (mrr[h] - mli[h]) * g;
    }
    wide_re[1] = first * scale;
    wide_im[1] = -first * scale;
    wide_re[size - 1] = -first * scale;
    wide_im[size - 1] = first * scale;
    if (size == kSmall) {
      small_fft_.inverse(wide_re, wide_im);
    } else if (size == kDraw) {
      draw_fft_.inverse(wide_re, wide_im);
    } else {
      large_fft_.inverse(wide_re, wide_im);
    }
    for (int i = 0; i < size; ++i) {
      table[2 * i] = wide_re[i];
      table[2 * i + 1] = wide_im[i];
    }
    table[2 * size] = table[0];
    table[2 * size + 1] = table[1];
  }

  // One player: both ears at `phase`, between two points and between the two
  // pictures.
  static void read_player(const float* a, const float* b, float size, float phase, float mix, float* left,
                          float* right) {
    const float place = phase * size;
    const int at = 2 * static_cast<int>(place);
    const float part = place - static_cast<float>(at / 2);
    const float a_left = a[at] + (a[at + 2] - a[at]) * part;
    const float a_right = a[at + 1] + (a[at + 3] - a[at + 1]) * part;
    const float b_left = b[at] + (b[at + 2] - b[at]) * part;
    const float b_right = b[at + 1] + (b[at + 3] - b[at + 1]) * part;
    *left = a_left + (b_left - a_left) * mix;
    *right = a_right + (b_right - a_right) * mix;
  }

  void render(Voice& voice, int count) {
    for (int done = 0; done < count;) {
      if (voice.frame_left <= 0) {
        voice.which = 1 - voice.which;
        next_picture(voice, frame_);
      }
      int stretch = count - done < voice.frame_left ? count - done : voice.frame_left;
      if (voice.pending && voice.fade_left < stretch) stretch = voice.fade_left;
      const float* a = voice.table[voice.which];
      const float* b = voice.table[1 - voice.which];
      const float size = static_cast<float>(voice.size);
      float mix = voice.mix;
      float p0 = voice.phase[0], p1 = voice.phase[1], p2 = voice.phase[2];
      // Two Eyes also sets the two players beside the first apart.
      const float one = 0.79f + 0.27f * knob(kSlowEyes), other = 0.79f - 0.69f * knob(kSlowEyes);
      const bool company = side_gain_.value > 0.0f || side_gain_.target > 0.0f;
      for (int i = done; i < done + stretch; ++i) {
        float left, right;
        read_player(a, b, size, p0, mix, &left, &right);
        p0 += voice.step[0];
        if (p0 >= 1.0f) p0 -= 1.0f;
        p1 += voice.step[1];
        if (p1 >= 1.0f) p1 -= 1.0f;
        p2 += voice.step[2];
        if (p2 >= 1.0f) p2 -= 1.0f;
        if (company) {
          float l1, r1, l2, r2;
          read_player(a, b, size, p1, mix, &l1, &r1);
          read_player(a, b, size, p2, mix, &l2, &r2);
          const float side = side_buf_[i];
          const float whole = 1.0f / std::sqrt(1.0f + 1.25f * side * side);
          left = (left + side * (l1 * one + l2 * other)) * whole;
          right = (right + side * (r2 * one + r1 * other)) * whole;
        }
        mix += voice.mix_step;
        const float env = voice.env.next();
        voice.amp += (voice.amp_target - voice.amp) * amp_coeff_;
        voice.struck *= struck_coeff_;
        voice.out += (env * voice.amp * (1.0f + kStroke * voice.struck) - voice.out) * soft_coeff_;
        float gain = voice.out * voice.tremble;
        voice.tremble += voice.tremble_step;
        if (voice.pending) {
          gain *= voice.fade;
          voice.fade = kit::max(0.0f, voice.fade - fade_step_);
        }
        left *= gain;
        right *= gain;
        bus_left_[i] += left;
        bus_right_[i] += right;
        // Air: noise in step with the wave, and a bite at the start.
        voice.bite *= bite_coeff_;
        const float bite = kBiteGain * voice.bite * gain;
        air_left_[i] += std::fabs(left) + bite;
        air_right_[i] += std::fabs(right) + bite;
      }
      voice.bite = flush_denormal(voice.bite);
      voice.struck = flush_denormal(voice.struck);
      voice.out = flush_denormal(voice.out);
      voice.phase[0] = p0;
      voice.phase[1] = p1;
      voice.phase[2] = p2;
      voice.mix = mix;
      voice.frame_left -= stretch;
      done += stretch;
      if (voice.pending) voice.fade_left -= stretch;
      if (voice.pending && voice.fade_left <= 0) {
        const bool held = voice.next_held;
        start(voice, voice.next_id, voice.next_frequency, voice.next_gain);
        steer(voice);
        if (!held) voice.let_go();
      }
    }
  }

  // Every tick: knobs, the rows when they have changed, each voice's pitch.
  void control() {
    using namespace ridge_lines;
    bool moving = false;
    for (kit::Smoother& s : slow_) {
      moving = moving || !s.settled();
      s.next();
    }
    if (build_in_ <= 0) {
      if (moving || rows_dirty_ || morphing_) build_rows(false);
      build_in_ = kBuildEvery;
    }
    --build_in_;
    see_matter(false);
    const float tone = knob(kSlowTone);
    if (tone != air_tone_) {
      air_tone_ = tone;
      for (kit::OnePole& f : wind_low_) f.set_cutoff(1800.0f * std::exp2(2.4f * tone), sample_rate());
    }
    float crowd = 0.0f;
    for (Voice& voice : pool_.voices) {
      if (!voice.active()) continue;
      tune_env(voice);
      steer(voice);
      // On the control clock, so a voice ends on one sample at every block size.
      if (!voice.pending && !voice.env.active() && voice.out < kGone) {
        voice.sounding = false;
        continue;
      }
      const float level = voice.env.level() * voice.amp * (1.0f + kStroke * voice.struck);
      crowd += level * level;
    }
    // A full house stands back a little: ten keys are not ten times one.
    house_target_ = 1.0f / std::sqrt(1.0f + kCrowd * crowd);
  }

  // What the rows behind are made of, moved over to a new choice.
  void see_matter(bool at_once) {
    using namespace ridge_lines;
    const int far = choice(kFar, kFarShapes);
    ring_time_ = near_ring(choice(kNear, kShapes));
    Matter sum = {0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f};
    for (int s = 0; s < kFarShapes; ++s) {
      const float goal = s == far ? 1.0f : 0.0f;
      far_weight_[s] = at_once ? goal : settle_to_zero(goal + (far_weight_[s] - goal) * weight_coeff_);
      const Matter m = far_matter(s);
      const float w = far_weight_[s];
      sum.at += w * m.at;
      sum.sharp += w * m.sharp;
      sum.climb += w * m.climb;
      sum.apart += w * m.apart;
      sum.lag += w * m.lag;
      sum.loud += w * m.loud;
      sum.swell += w * m.swell;
      sum.level += w * m.level;
    }
    matter_ = sum;
  }

  // The steps of the three players, with the waver.
  void steer(Voice& voice) {
    const float tick_seconds = static_cast<float>(tick_) / sample_rate();
    voice.vibrato_phase += voice.vibrato_rate * tick_seconds;
    if (voice.vibrato_phase >= 1.0f) voice.vibrato_phase -= 1.0f;
    if (voice.vibrato_rise < 1.0f) voice.vibrato_rise = kit::min(1.0f, voice.vibrato_rise + tick_seconds / kVibratoRise);
    const float rise = voice.vibrato_rise * voice.vibrato_rise;
    const float waver = knob(kSlowVibrato) * kVibratoCents * rise * kit::SineTable::lookup(voice.vibrato_phase);
    const float tremble = 1.0f + kTremble * knob(kSlowVibrato) * rise *
                                     kit::SineTable::lookup(voice.vibrato_phase + 0.2f);
    voice.tremble_step = (tremble - voice.tremble) / static_cast<float>(tick_);
    const float apart = kCompanyCents * knob(kSlowCompany);
    const float base = voice.frequency / sample_rate();
    // A cent is so little that its ratio is a straight line.
    voice.step[0] = base * (1.0f + kCent * waver);
    voice.step[1] = base * (1.0f + kCent * (waver + apart));
    voice.step[2] = base * (1.0f + kCent * (waver * 0.9f - apart * 0.83f));
  }

  void seed_noise() {
    noise_[0].seed(0x9E3779B9u);
    noise_[1].seed(0x7F4A7C15u);
  }

  void settle_knobs() {
    using namespace ridge_lines;
    for (int s = 0; s < kNumSlow; ++s) slow_[s].snap(param(kSlowParam[s]));
    volume_.snap(volume_.target);
    wind_.snap(wind_.target);
    side_gain_.snap(side_gain_.target);
    build_rows(true);
    see_matter(true);
    air_tone_ = -1.0f;
  }

  void build_profiles() {
    using namespace ridge_lines;
    for (int shape = 0; shape < kShapes; ++shape) {
      for (int i = 0; i < kDraw; ++i) {
        const float x = static_cast<float>(i) / kDraw;
        profile_[0][shape][i] = profile(shape, x, false);
        profile_[1][shape][i] = profile(shape, x, true);
      }
    }
    for (int shape = 0; shape < kShapes; ++shape) {
      for (int h = 1; h <= kHarmonics; ++h) {
        near_matter_[shape][h] = kit::db_to_gain(near_matter(shape, static_cast<float>(h)));
      }
    }
    for (int h = 0; h <= kHarmonics; ++h) near_mask_[h] = near_re_[h] = near_im_[h] = 0.0f;
    // Rock: one seeded grain a row, its harmonics falling slowly from the
    // seventh up.
    kit::Rng rng;
    for (int row = 0; row < kRows; ++row) {
      rng.seed(0x6A09E667u + 40503u * static_cast<uint32_t>(row));
      for (float& v : rock_[row]) v = 0.0f;
      for (int h = 7; h <= 72; ++h) {
        const float phase = rng.uniform();
        const float size = (0.4f + 0.6f * rng.uniform()) * std::pow(static_cast<float>(h), -0.65f);
        for (int i = 0; i < kDraw; ++i) {
          const float turn = static_cast<float>((h * i) & (kDraw - 1)) / kDraw;
          rock_[row][i] += size * kit::SineTable::lookup(turn + phase);
        }
      }
    }
    for (auto& row : shape_) {
      for (float& v : row) v = 0.0f;
    }
    static float re[kDraw], im[kDraw];
    for (int i = 0; i < kDraw; ++i) {
      re[i] = rock_[0][i];
      im[i] = 0.0f;
    }
    draw_fft_.forward(re, im);
    for (int h = 0; h <= kHarmonics; ++h) {
      grain_re_[h] = re[h];
      grain_im_[h] = im[h];
      upside_[h] = h > 0 ? 1.0f / static_cast<float>(h) : 0.0f;
    }
  }

  // The three rows as they are drawn from: profile, rock, lean, and the blur
  // of their own motion.
  void build_rows(bool at_once) {
    using namespace ridge_lines;
    const int near = choice(kNear, kShapes), far = choice(kFar, kFarShapes);
    const int multiple[kRows] = {1, repeats(), far_repeats()};
    const float* goal[kRows] = {profile_[0][near], profile_[0][far], profile_[1][far]};
    float furthest = 0.0f;
    for (int row = 0; row < kRows; ++row) {
      for (int i = 0; i < kDraw; ++i) {
        const float way = goal[row][i] - shape_[row][i];
        furthest = kit::max(furthest, std::fabs(way));
        shape_[row][i] = at_once ? goal[row][i] : shape_[row][i] + way * shape_coeff_;
      }
    }
    morphing_ = !at_once && furthest > 1.0e-4f;
    rows_dirty_ = false;
    const float jag = knob(kSlowJag), sun = knob(kSlowSun);
    const float rocked = knob(kSlowVibrato) * kSway * kit::kTwoPi * 5.25f;
    const float moved[kRows] = {0.0f, (travel_speed() + rocked) * frame_seconds_ * kDraw,
                                (std::fabs(travel_speed() * far_share()) + rocked) * frame_seconds_ * kDraw};
    static float rough[kDraw];
    const float rock = kRock * jag * (0.35f + 0.65f * jag);
    for (int row = 0; row < kRows; ++row) {
      for (int i = 0; i < kDraw; ++i) rough[i] = shape_[row][i] + rock * rock_[row][i];
      lean_profile(rough, kLean * sun * (0.4f + 0.6f * sun), ring_[row]);
      // A row that comes round m times is drawn on a 1/m of the points.
      const float least = 0.8f * static_cast<float>(multiple[row]);
      blur_profile(ring_[row], kit::max(least, moved[row]));
      ring_[row][kDraw] = ring_[row][0];
    }
    // The near row as it stands in a cycle, and its spectrum: the same for
    // every voice and both eyes.
    static float re[kDraw], im[kDraw];
    for (int i = 0; i < kDraw; ++i) {
      re[i] = ring_[0][i];
      im[i] = 0.0f;
    }
    draw_fft_.forward(re, im);
    // A low sun throws every outline's shadow along itself: the outline less
    // a fainter copy that lies part of a cycle on.
    const float dark = 0.9f * (sun < 0.35f ? sun * (2.0f - sun / 0.35f) / 0.35f : 1.0f);
    const float length = 0.012f + 0.488f * sun * std::sqrt(sun);
    for (int h = 1; h <= kHarmonics; ++h) {
      soft_[h] = std::pow(static_cast<float>(h), 0.9f - 2.0f * knob(kSlowPenumbra));
      const float turn = length * static_cast<float>(h);
      const float lit = 1.0f - dark * kit::SineTable::cos_lookup(turn);
      const float turned = dark * kit::SineTable::lookup(turn);
      // And its harmonics are set a little after one another, so that no
      // wave is one tall peak a cycle.
      const float spread = static_cast<float>((h * (h - 1)) % 64) * (1.0f / 64.0f);
      const float c = kit::SineTable::cos_lookup(spread), s = kit::SineTable::lookup(spread);
      shadow_re_[h] = lit * c - turned * s;
      shadow_im_[h] = lit * s + turned * c;
      near_mask_[h] += (near_matter_[near][h] - near_mask_[h]) * (at_once ? 1.0f : shape_coeff_);
      // The grain of the rock is heard whatever the row is made of.
      const float grain = rock * (1.0f - kit::min(1.0f, near_mask_[h]));
      near_re_[h] = re[h] * near_mask_[h] + grain * grain_re_[h];
      near_im_[h] = im[h] * near_mask_[h] + grain * grain_im_[h];
    }
  }

  void apply(int id) {
    using namespace ridge_lines;
    const float value = param(id);
    for (int s = 0; s < kNumSlow; ++s) {
      if (kSlowParam[s] == id) slow_[s].set(value, primed());
    }
    switch (id) {
      case kNear:
      case kFar:
      case kRepeats:
        rows_dirty_ = true;
        break;
      case kWind:
        wind_.set(kWindGain * value * (0.4f + 0.6f * value), primed());
        break;
      case kCompany:
        side_gain_.set(kit::min(1.0f, 0.9f * std::sqrt(value)), primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value - kParamDefault[kVolume]), primed());
        break;
      default:
        break;
    }
  }

  // How far apart the eyes see the rows behind, in turns of each.
  static constexpr float kEyeMiddle = 0.3f, kEyeFar = -0.21f;
  static constexpr float kFarLift = 0.12f;  // the last row stands a little higher
  static constexpr float kRiseDb = 4.0f;
  static constexpr int kCrossing = 24;  // pictures a new land takes to come up
  static constexpr float kGone = 2.0e-5f;
  static constexpr float kCrowd = 0.42f;
  static constexpr float kLean = 0.3f;
  static constexpr float kRock = 2.2f;
  static constexpr float kWindGain = 1.0f;
  static constexpr float kBiteGain = 0.8f;
  static constexpr float kStroke = 0.7f;
  static constexpr float kVibratoCents = 45.0f, kVibratoRise = 0.9f, kSway = 0.06f, kTremble = 0.28f;
  static constexpr float kCompanyCents = 22.0f;
  static constexpr float kCross = 0.2f, kGlow = 3.4f, kBeyond = 2.2f, kShare = 0.3f, kFarShare = 1.3f;
  static constexpr float kBehindLow = -8.0f, kBehindSpan = 22.0f;
  static constexpr float kCent = 0.000577789507f;

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Fft<ridge_lines::kDraw> draw_fft_;
  kit::Fft<kTable> large_fft_;
  kit::Fft<kSmall> small_fft_;
  float profile_[2][ridge_lines::kShapes][ridge_lines::kDraw] = {};
  float rock_[ridge_lines::kRows][ridge_lines::kDraw] = {};
  float shape_[ridge_lines::kRows][ridge_lines::kDraw] = {};
  float ring_[ridge_lines::kRows][ridge_lines::kDraw + 1] = {};
  float near_re_[kHarmonics + 1] = {}, near_im_[kHarmonics + 1] = {};
  float near_mask_[kHarmonics + 1] = {};
  float near_matter_[ridge_lines::kShapes][kHarmonics + 1] = {};
  float grain_re_[kHarmonics + 1] = {}, grain_im_[kHarmonics + 1] = {}, upside_[kHarmonics + 1] = {};
  float soft_[kHarmonics + 1] = {};
  float shadow_re_[kHarmonics + 1] = {}, shadow_im_[kHarmonics + 1] = {};
  ridge_lines::Body body_;
  kit::Smoother slow_[kNumSlow];
  kit::Smoother volume_, wind_, side_gain_;
  kit::Rng chance_, noise_[2];
  kit::Svf wind_high_[2];
  kit::OnePole wind_low_[2];
  kit::IdleGate idle_;
  float bus_left_[kMaxTick] = {}, bus_right_[kMaxTick] = {};
  float air_left_[kMaxTick] = {}, air_right_[kMaxTick] = {}, side_buf_[kMaxTick] = {};
  int orders_ = 0;
  int frame_ = 384, steal_ = 288, tick_ = 32, until_tick_ = 0, build_in_ = 0;
  float frame_seconds_ = 0.008f;
  float shape_coeff_ = 0.1f, amp_coeff_ = 0.01f, bite_coeff_ = 0.99f, struck_coeff_ = 0.99f;
  float stroke_seconds_ = 0.0f, fade_step_ = 0.01f;
  float house_ = 1.0f, house_target_ = 1.0f, house_down_ = 0.003f, house_up_ = 0.0002f;
  float wind_scale_ = 1.0f, air_tone_ = -1.0f;
  float far_weight_[ridge_lines::kFarShapes] = {}, weight_coeff_ = 0.97f, ring_time_ = 1.0f, soft_coeff_ = 0.01f;
  ridge_lines::Matter matter_ = {1.0f, 1.0f, 1.0f, 1.0f, 0.0f, 0.0f, 0.0f, 0.0f};
  bool rows_dirty_ = true, morphing_ = false;
};

}  // namespace livemix
