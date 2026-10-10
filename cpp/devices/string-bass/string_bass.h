#pragma once

// String Bass: plucked bass strings, modelled. An electric bass played with
// the fingers or a pick, fretted or fretless, and an upright bass plucked.
//
//   per string (four):
//     pluck ─► string loop (comb, loss, stiffness, tuning) ─┬─► pickup comb ─┬─► level ─► key-up fade ─► its type's bus
//                                                           └─► growl ───────┘
//
//   Electric bus ─► pickup resonance ──────────────────────────┐
//   Fretless bus ─► pickup resonance ──────────────────────────┤
//   Upright bus (+ thump) ─► direct + three body resonances ───┴─► DC blocker ─► tone ─► volume ─► soft clip
//
// - Four strings, as on the instrument: a key takes a free string, else the
//   quietest one (kit::VoicePool), which fades out over 3 ms before it is
//   plucked again. A key struck again, or another key at a pitch that still
//   rings, plucks the same string: the finger lands on it (6 ms) and lets it
//   go. Nothing is ever doubled.
// - A note is one kit::PluckedString loop, held in tune by an allpass with
//   the delay of its loss and stiffness filters taken out of the line.
//   Sustain is the time the fundamental takes to fall 60 dB at A1; other
//   notes ring sqrt(55 Hz / f) as long. The partials near 1 or 2 kHz ring a
//   small fraction of that time, so every note darkens as it dies, as a
//   wound string does. Mute walks both times down towards a thud and dulls
//   the pluck itself.
// - Each note is on one of the four strings E A D G, at the lowest fret that
//   reaches it (lower notes lengthen the E string). The pickup of the two
//   electric types is fixed to the body: it hears the string minus the
//   string a fraction q of a period earlier, and q grows with the fret. What
//   that takes from the fundamental is given back, so the bottom stays.
//   After it sits the pickup's resonant low-pass; Resonance is the height of
//   its hump.
// - Upright has no pickup. The string is heard at the bridge, direct and
//   through three resonances of the body (air, top plate, back; Resonance
//   brings them in), with a low thump at every pluck: one pulse through a
//   band-pass, rounded so that it starts from nothing, one for a whole chord.
//   It rings for under half the time and its top is gone in a moment.
// - Growl is the string against the neck. It is not a model of that: it is a
//   train of taps (single impulses, placed between samples where the swing
//   crossed, scaled by the sample rate) through a band-pass of the string's
//   own, added to the string.
//   On Fretless there is one tap a period, as the swing comes up through
//   rest, as tall as the string swings; the taps come in over the 150 ms
//   after the pluck while the band-pass rises from 520 Hz to 1 kHz (the
//   bloom), and they follow the string down, so the note sings for as long
//   as it rings and mellows as it goes.
//   On Electric and Upright there is a tap each time the swing passes a
//   fixed height, either side of rest and with its sign, as tall as the
//   swing stands over that height: soft notes never reach it and loud ones
//   stop reaching it as they settle. Alike both sides of rest, so what a
//   string plucked at its middle gets is odd harmonics only. The upright's
//   band is lower and wider (480 Hz against 1.7 kHz).
// - Fretless also starts softer: a slower, duller pluck with less click.
// - Key up fades the string over Release behind a low-pass that closes as
//   it fades: a hand coming down, the top going first.
//
// Type, Touch and Position are read when a string is plucked, Release when
// its key is let go; Sustain and Mute reach ringing strings on the control
// clock; Tone, Growl, Resonance and Volume are smoothed. Everything that
// runs between notes starts again from the first note after a silence, so
// the audio does not depend on the host's block size and a knob moved in
// silence has arrived by the next note. Each pluck varies a little in place,
// weight and edge from a seeded generator. Both outputs are the same
// signal. The instrument sleeps when no string sounds, and the filters of a
// type no string is using are passed over while they hold exact zero.
//
// Every figure here is a choice tuned by measurement in
// cpp/test/string_bass_test.cpp. Nobody has listened to it.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class StringBass : public kit::DeviceBase<string_bass::kNumParams> {
 public:
  static constexpr int kMaxVoices = 4;
  // 16376 samples of line: 11.7 Hz at 192 kHz, so E0 (20.6 Hz) fits at every rate.
  static constexpr int kLineSize = 16384;
  enum Type : int { kElectric = 0, kFretless = 1, kUpright = 2, kNumTypes = 3 };
  static constexpr int kStrings = 4;
  static constexpr int kBodyModes = 3;

  // Open strings, E1 to G2.
  static constexpr float kOpenHz[kStrings] = {41.2034f, 55.0f, 73.4162f, 97.9989f};
  // The body of the upright: air, top plate and back. Choices in the range
  // such instruments have, not measurements of one.
  static constexpr float kBodyHz[kBodyModes] = {66.0f, 112.0f, 187.0f};
  static constexpr float kBodyQ[kBodyModes] = {3.0f, 3.5f, 4.0f};
  static constexpr float kBodyGain[kBodyModes] = {1.0f, 0.8f, 0.7f};
  // Where Sustain is the ring time.
  static constexpr float kReferenceHz = 55.0f;

  // The string a note is played on: the highest whose open pitch is not above it.
  static int string_for(float hz) {
    int string = 0;
    for (int s = 1; s < kStrings; ++s) {
      if (hz >= kOpenHz[s] * 0.999f) string = s;
    }
    return string;
  }
  // Sounding length of the open string over that of the note.
  static float fret_ratio(float hz) { return hz / kOpenHz[string_for(hz)]; }

  // The pickup's place on a note's sounding length (0 on Upright: no pickup).
  static float pickup_fraction(int type, float hz) {
    const float open = kTypes[kit::clamp_int(type, 0, kNumTypes - 1)].pickup;
    return open > 0.0f ? kit::clamp(open * fret_ratio(hz), 0.02f, kPickupFold) : 0.0f;
  }

  // Seconds for the fundamental of a held note at `hz` to fall 60 dB.
  static float ring_seconds(int type, float hz, float sustain, float mute) {
    const Kind& kind = kTypes[kit::clamp_int(type, 0, kNumTypes - 1)];
    const float open = sustain * kind.ring * kit::clamp(std::sqrt(kReferenceHz / hz), 0.3f, 1.3f);
    const float muted = kit::min(open, kMutedSeconds);
    return open * std::pow(muted / open, kit::clamp(mute, 0.0f, 1.0f));
  }
  // And for its partials near the type's high frequency.
  static float high_seconds(int type, float hz, float seconds, float mute) {
    const Kind& kind = kTypes[kit::clamp_int(type, 0, kNumTypes - 1)];
    // The loop's one low-pass takes from the fundamental too. It may supply
    // at most a share of the fundamental's own loss; the top is then gone as
    // soon as a filter that gentle allows, and no sooner, or the note would
    // die with it. (One pole: its loss in power at f is 1 + (f / corner)^2.)
    const float high_hz = kit::max(kind.high_hz, 2.0f * hz);
    const float loss = 60.0f / (hz * seconds);  // dB per period at the fundamental
    const float corner = std::pow(10.0f, 0.1f * kFilterShare * loss) - 1.0f;  // (hz / corner)^2
    const float high_loss =
        loss * (1.0f - kFilterShare) + 10.0f * std::log10(1.0f + corner * (high_hz / hz) * (high_hz / hz));
    const float soonest = 60.0f / (hz * high_loss);
    const float share = kind.high_share * (1.0f - kMuteDulls * kit::clamp(mute, 0.0f, 1.0f));
    return kit::max(kit::max(seconds * share, kShortestHighSeconds), soonest);
  }

  void init(float sample_rate) {
    using namespace string_bass;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) pool_.voices[v].clear();
    vary_.seed(0x5B455A11u);
    variation_ = 1.0f;

    for (int t = 0; t < 2; ++t) pickup_[t].reset();
    for (int m = 0; m < kBodyModes; ++m) {
      body_[m].reset();
      body_[m].set(kBodyHz[m], kBodyQ[m], sr);
    }
    knock_.reset();
    knock_.set(kThumpHz, kThumpQ, sr);
    knock_soft_.reset();
    knock_soft_.set_cutoff(kThumpSoftHz, sr);
    knock_pulse_ = 0.0f;
    dc_.reset();
    dc_.set_cutoff(kDcHz, sr);
    tone_.reset();

    period_ = kit::clamp_int(static_cast<int>(32.0f * sr / 48000.0f + 0.5f), 8, 128);
    clock_.reset(period_);
    const float control_rate = sr / static_cast<float>(period_);
    tone_hz_.set_time(0.015f, control_rate);
    hump_.set_time(0.015f, control_rate);
    sustain_.set_time(0.015f, control_rate);
    mute_.set_time(0.015f, control_rate);
    growl_.set_time(kSmoothingSeconds, sr);
    wood_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    bloom_rate_ = 1.0f - kit::time_to_coeff(0.002f, sr);
    tick_seconds_ = static_cast<float>(period_) / sr;
    tone_set_ = -1.0f;
    hump_set_ = -1.0f;
    // Nothing outlives the strings but the body and the DC blocker.
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    set_filters();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // How much each pluck differs from the last, 0 to 1. Not a parameter: at 0
  // every pluck is exact, which is what a harness needs to measure a comb
  // null. init() sets it back to 1.
  void set_variation(float amount) { variation_ = kit::clamp(amount, 0.0f, 1.0f); }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    const float sr = sample_rate();
    frequency = kit::clamp(frequency, kLowestHz, kit::min(kHighestHz, 0.1f * sr));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);

    // Nothing sounds: whatever ran on through the silence starts again here,
    // on this sample, whether or not the device had fallen asleep.
    if (pool_.count_active() == 0) restart();

    // The key's own string if it is still down, else a string already at
    // this pitch, else a free one or the quietest.
    int choice = -1;
    for (int v = 0; v < kMaxVoices; ++v) {
      const Voice& voice = pool_.voices[v];
      if (voice.active() && voice.held && voice.note_id == note_id) choice = v;
    }
    for (int v = 0; v < kMaxVoices && choice < 0; ++v) {
      const Voice& voice = pool_.voices[v];
      if (voice.active() && same_pitch(voice.pending ? voice.next_hz : voice.hz, frequency)) choice = v;
    }
    if (choice < 0) {
      bool stolen = false;  // not needed: only a string that still sounds has anything to fade
      choice = pool_.note_on(note_id, &stolen);
    }
    Voice& voice = pool_.voices[choice];
    if (voice.sounding && !voice.pending) {
      // What still rings fades under the finger before the pluck: a little
      // longer on the same note than on a string taken for another.
      const float seconds = same_pitch(voice.hz, frequency) ? kRepluckSeconds : kStealSeconds;
      voice.cut_step = voice.cut / kit::max(1.0f, seconds * sr);
    }
    voice.note_id = note_id;
    voice.held = true;
    voice.pending = true;
    voice.release_after = false;
    voice.next_hz = frequency;
    voice.next_gain = gain;
    // As loud as it will be, before it has sounded: the next key of a chord
    // must not take this string back.
    voice.next_level = kStrokeLevel * amplitude_of(gain);
  }

  void note_off(int note_id) {
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!(voice.active() && voice.held && voice.note_id == note_id)) continue;
      voice.held = false;
      if (voice.pending) {
        voice.release_after = true;  // let go before it was plucked: plucked, then stopped
      } else {
        begin_release(voice);
      }
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control();

      const float growl = growl_.next();
      float bus[kNumTypes] = {0.0f, 0.0f, 0.0f};
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (voice.active()) render(voice, growl, bus);
      }

      // A filter with nothing in it and nothing coming in gives exactly
      // nothing, so the chains of the types not in use are passed over.
      // The upright: the pull of the finger, the string at the bridge, and
      // the body beside it.
      const float wood = wood_.next();
      const float pull = knock_pulse_;
      knock_pulse_ = 0.0f;
      float upright = 0.0f;
      if (bus[kUpright] != 0.0f || pull != 0.0f || !body_at_rest()) {
        const float heard = bus[kUpright] + knock_soft_.lowpass(knock_.bandpass(pull));
        float body = 0.0f;
        for (int m = 0; m < kBodyModes; ++m) body += kBodyGain[m] * body_[m].bandpass(heard);
        upright = heard * (1.0f - kDirectLoss * wood) + kBodyLevel * wood * body;
      }

      float x = upright;
      for (int t = 0; t < 2; ++t) {
        if (bus[t] != 0.0f || !at_rest(pickup_[t])) x += pickup_[t].lowpass(bus[t]);
      }
      x = tone_.lowpass(dc_.process(x));
      const float out = kit::soft_clip(x * kOutputGain * volume_.next());
      out_left_[i] = out;
      out_right_[i] = out;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  using String = kit::PluckedString<kLineSize>;

  // What makes a type. Every figure is a choice, tuned by measurement.
  struct Kind {
    // Share of Sustain the fundamental rings; the share of that the partials
    // near high_hz ring.
    float ring, high_share, high_hz;
    // Inharmonicity of the open string and the allpasses that make it.
    float stiffness;
    int stiff_stages;
    // The pluck's low-pass from a finger to a pick, and the pick's click.
    float pick_soft_hz, pick_hard_hz, click;
    // The pickup's distance from the bridge over the open string (0: none).
    float pickup;
    // Where its pickup's resonance sits.
    float hump_hz;
    // Growl: the band the rattle or the bloom is heard in, and how much.
    float growl_hz, growl_q, growl_gain;
    // Evens out the types, and the keys above A2.
    float level, rise;
  };

  static constexpr Kind kTypes[kNumTypes] = {
      // Electric: round-wound steel over frets, one pickup a sixth of the way along.
      {1.0f, 0.11f, 2000.0f, 1.2e-4f, 2, 300.0f, 7000.0f, 0.5f, 0.17f, 2600.0f, 1700.0f, 2.0f, 14.0f, 1.0f, 0.5f},
      // Fretless: the same string on bare wood, the pickup nearer the bridge.
      {0.85f, 0.10f, 2000.0f, 1.0e-4f, 2, 170.0f, 2400.0f, 0.2f, 0.14f, 2200.0f, 1000.0f, 4.0f, 45.0f, 1.0f, 0.5f},
      // Upright: a thick string pulled by the side of a finger, no pickup.
      {0.4f, 0.09f, 1000.0f, 5.0e-5f, 1, 230.0f, 2400.0f, 0.15f, 0.0f, 0.0f, 480.0f, 0.9f, 16.0f, 1.2f, 0.15f},
  };

  static constexpr float kLowestHz = 16.0f;
  static constexpr float kHighestHz = 4200.0f;
  // Past this share of the string the pickup is taken to stay where it is.
  static constexpr float kPickupFold = 0.38f;
  // Mute 1: the fundamental rings this long, and the top this much less.
  static constexpr float kMutedSeconds = 0.12f;
  static constexpr float kMuteDulls = 0.8f;
  static constexpr float kMuteSoftens = 0.6f;
  static constexpr float kShortestHighSeconds = 0.012f;
  static constexpr float kFilterShare = 0.6f;
  // A quarter tone either side is the same string.
  static constexpr float kSameRatio = 1.0293f;
  static constexpr float kRepluckSeconds = 0.006f;
  static constexpr float kStealSeconds = 0.003f;
  // The string's swing per unit of pluck (its peak, roughly), for stealing.
  static constexpr float kStrokeLevel = 2.5f;
  // A string this quiet (100 dB under a full pluck) is let go.
  static constexpr float kSilence = 1.0e-5f;
  // The rattle: the string taps the frets when it swings past this height.
  static constexpr float kBuzzHeight = 1.0f;
  // The bloom: how far below rest the slow swing must go before the next
  // tap, when it comes in after the pluck, and the formant it rises through.
  static constexpr float kBloomArm = 0.15f;
  static constexpr float kBloomDelaySeconds = 0.02f;
  static constexpr float kBloomSeconds = 0.13f;
  static constexpr float kBloomLowHz = 520.0f;
  static constexpr float kBloomSagSeconds = 0.8f;
  static constexpr float kBloomFloor = 0.25f;
  // The upright's thump: a pulse at every pluck through a low band-pass,
  // rounded so that it starts from nothing.
  static constexpr float kThumpHz = 85.0f;
  static constexpr float kThumpQ = 2.0f;
  static constexpr float kThumpLevel = 36.0f;
  static constexpr float kThumpSoftHz = 160.0f;
  // Resonance on the upright: what the direct string gives up and what the
  // body adds.
  static constexpr float kDirectLoss = 0.3f;
  static constexpr float kBodyLevel = 0.9f;
  static constexpr float kDcHz = 2.0f;
  // Levels: one note at gain 0.7 peaks near -18 dBFS at the default volume,
  // and four strings plucked hard in the same instant stay under the knee.
  static constexpr float kStringGain = 0.096f;
  // Level against pitch: this power of the note over A1 from E0 to A2, the
  // type's own from there to A4.
  static constexpr float kPitchTilt = 0.25f;
  static constexpr float kTiltLowest = 0.375f;
  static constexpr float kTiltKnee = 2.0f;
  static constexpr float kTiltHighest = 4.0f;
  static constexpr float kOutputGain = 1.0f;

  struct Voice {
    String string;
    kit::PluckExciter exciter;
    kit::Rng scrape;    // the pick's noise, its own for each pluck
    kit::Svf colour;    // the band the growl is heard in
    kit::OnePole track; // the string's slow swing, for the bloom's timing
    int note_id = -1;
    bool sounding = false;       // the string is running
    bool held = false;           // its key is down
    bool pending = false;        // a pluck is on its way
    bool release_after = false;  // let go before it was plucked
    bool released = false;
    float next_hz = 0.0f;
    float next_gain = 0.0f;
    float next_level = 0.0f;
    int type = 0;
    float hz = 0.0f;
    float tap = 0.0f;      // the pickup's delay in samples (0: none)
    float gain = 0.0f;     // level of the string at its bus
    float env = 0.0f;      // how far the string swings, a peak follower
    float env_decay = 0.0f;
    float cut = 1.0f;      // 1 while ringing, ramped to 0 under a new pluck
    float cut_step = 0.0f;
    float fade = 1.0f;     // the hand coming down after key up
    float fade_coeff = 1.0f;
    float damp = 0.0f;
    float damp_a = 0.0f;
    float last = 0.0f;
    float bloom = 0.0f;    // 0 to 1, Fretless only
    float bloom_target = 0.0f;
    float growl_gain = 0.0f;  // height of one tap of the string on the neck
    float before = 0.0f;   // the swing a sample ago
    float carry = 0.0f;    // the part of a tap that falls on the next sample
    bool armed = false;
    int age = 0;           // control ticks since the pluck

    void clear() {
      string.reset();
      exciter.stop();
      scrape.seed(1u);
      colour.reset();
      track.reset();
      note_id = -1;
      sounding = held = pending = release_after = released = false;
      next_hz = next_gain = next_level = 0.0f;
      type = 0;
      hz = 0.0f;
      tap = 0.0f;
      gain = 0.0f;
      env = 0.0f;
      env_decay = 0.0f;
      cut = 1.0f;
      cut_step = 0.0f;
      fade = 1.0f;
      fade_coeff = 1.0f;
      damp = damp_a = last = 0.0f;
      bloom = bloom_target = 0.0f;
      growl_gain = 0.0f;
      before = carry = 0.0f;
      armed = false;
      age = 0;
    }

    // What kit::VoicePool asks of a voice.
    bool active() const { return pending || sounding; }
    bool releasing() const { return !pending && sounding && released; }
    // True from the moment the voice is taken: a waiting pluck counts as the
    // note it will be.
    float level() const { return pending ? next_level : (sounding ? env * fade : 0.0f); }
  };

  static bool at_rest(const kit::Svf& filter) { return filter.ic1 == 0.0f && filter.ic2 == 0.0f; }
  bool body_at_rest() const {
    bool rest = at_rest(knock_) && knock_soft_.state == 0.0f;
    for (int m = 0; m < kBodyModes; ++m) rest = rest && at_rest(body_[m]);
    return rest;
  }

  static bool same_pitch(float a, float b) { return a < b * kSameRatio && b < a * kSameRatio; }

  // Velocity is loudness.
  static float amplitude_of(float gain) { return 0.2f + 0.8f * gain * std::sqrt(gain); }

  int type_in_use() const {
    return kit::clamp_int(static_cast<int>(param(string_bass::kType) + 0.5f), 0, kNumTypes - 1);
  }

  // The first note after a silence: the control clock starts on it and every
  // knob is where it points.
  void restart() {
    clock_.reset(period_);
    tone_hz_.snap(tone_hz_.target);
    hump_.snap(hump_.target);
    sustain_.snap(sustain_.target);
    mute_.snap(mute_.target);
    growl_.snap(growl_.target);
    wood_.snap(wood_.target);
    volume_.snap(volume_.target);
    set_filters();
  }

  // The tone control and the pickups' resonance, from where their knobs are.
  void set_filters() {
    const float sr = sample_rate();
    if (tone_hz_.value != tone_set_) {
      tone_set_ = tone_hz_.value;
      tone_.set(tone_set_, 0.7071f, sr);
    }
    if (hump_.value != hump_set_) {
      hump_set_ = hump_.value;
      for (int t = 0; t < 2; ++t) pickup_[t].set(kTypes[t].hump_hz, hump_set_, sr);
    }
  }

  void set_ring(Voice& voice, float sustain, float mute) {
    const float seconds = ring_seconds(voice.type, voice.hz, sustain, mute);
    const Kind& kind = kTypes[voice.type];
    voice.string.set_decay(seconds, high_seconds(voice.type, voice.hz, seconds, mute), kind.high_hz);
  }

  // The finger leaves the string.
  void strike(Voice& voice) {
    using namespace string_bass;
    const float sr = sample_rate();
    const float gain = voice.next_gain;
    const int type = type_in_use();
    const Kind& kind = kTypes[type];
    voice.pending = false;
    voice.type = type;
    voice.hz = voice.next_hz;
    const float ratio = fret_ratio(voice.hz);

    // No two plucks are the same: where, how hard, with how much edge.
    const float place = 1.0f + 0.02f * variation_ * vary_.bipolar();
    const float weight = kit::db_to_gain(0.8f * variation_ * vary_.bipolar());
    const float edge = 1.0f + 0.08f * variation_ * vary_.bipolar();

    voice.string.reset();
    // Settings first: with no pitch yet they are only stored, and the pitch
    // then works the loop out once.
    set_ring(voice, sustain_.value, mute_.value);
    voice.string.set_stiffness(kit::min(kind.stiffness * ratio * ratio, 4.0e-4f), kind.stiff_stages);
    voice.string.set_frequency(voice.hz, sr);
    voice.string.set_pluck_position(kit::clamp(param(kPosition) * place, 0.03f, 0.5f));

    // A finger or a pick; harder is brighter, a hand on the strings duller.
    const float touch = param(kTouch);
    const float amplitude = amplitude_of(gain) * weight;
    const float pick_hz = kind.pick_soft_hz * std::pow(kind.pick_hard_hz / kind.pick_soft_hz, touch) *
                          (0.3f + 1.1f * gain) * (1.0f - kMuteSoftens * mute_.target) * edge;
    const float click = kind.click * touch * touch * (0.3f + 0.7f * gain);
    voice.exciter.stop();
    voice.exciter.strike(amplitude, voice.hz, kit::max(pick_hz, 1.5f * voice.hz), click, sr);
    // The scrape is new with every pluck; with variation off it is the
    // note's own, so the same note is the same sound wherever it is played.
    voice.scrape.seed(static_cast<uint32_t>(voice.hz * 4096.0f) * 2654435761u +
                      (variation_ > 0.0f ? vary_.next_u32() : 0u));

    // The pickup, and the level that gives the fundamental back.
    const float q = pickup_fraction(type, voice.hz);
    voice.tap = q * voice.string.period();
    // Higher notes have fewer partials under the tone control and die sooner:
    // they are given a little back.
    const float tilt = std::pow(kit::clamp(voice.hz / kReferenceHz, kTiltLowest, kTiltKnee), kPitchTilt) *
                       std::pow(kit::clamp(voice.hz / (kReferenceHz * kTiltKnee), 1.0f, kTiltHighest), kind.rise);
    voice.gain = kStringGain * kind.level * tilt * (q > 0.0f ? 1.0f / (2.0f * std::sin(kit::kPi * q)) : 1.0f);

    // Growl: the band it is heard in, and the height of one tap. A tap is
    // one sample, so it is scaled by the rate; lower notes tap less often and
    // are given the root of that back, so the growl is as loud on any key.
    voice.colour.reset();
    voice.colour.set(type == kFretless ? kBloomLowHz : kind.growl_hz, kind.growl_q, sr);
    voice.growl_gain = kind.growl_gain * (sr * (1.0f / 48000.0f)) * std::sqrt(kReferenceHz / voice.hz);
    // The bloom is for the bass register: higher up its formant would sit under the note.
    if (type == kFretless) voice.growl_gain *= kit::clamp(1.5f - voice.hz / 400.0f, 0.0f, 1.0f);
    voice.track.reset();
    voice.track.set_cutoff(1.5f * voice.hz, sr);
    voice.armed = false;
    voice.before = 0.0f;
    voice.carry = 0.0f;
    voice.bloom = 0.0f;
    voice.bloom_target = 0.0f;
    voice.age = 0;

    // One hand, one thump: strings plucked in the same instant share the
    // hardest of their pulls.
    if (type == kUpright) {
      knock_pulse_ = kit::max(knock_pulse_, kThumpLevel * amplitude * (1.0f - 0.5f * mute_.target) * sr * (1.0f / 48000.0f));
    }

    voice.env = kStrokeLevel * amplitude;
    voice.env_decay = kit::time_to_coeff(kit::max(0.05f, 3.0f / voice.hz), sr);
    voice.cut = 1.0f;
    voice.cut_step = 0.0f;
    voice.fade = 1.0f;
    voice.fade_coeff = 1.0f;
    voice.released = false;
    voice.damp = 0.0f;
    voice.damp_a = 0.0f;
    voice.last = 0.0f;
    voice.sounding = true;
    if (voice.release_after) {
      voice.release_after = false;
      begin_release(voice);
    }
  }

  // Key up: fade over Release (to -60 dB), the top first.
  void begin_release(Voice& voice) {
    if (!voice.sounding || voice.released) return;
    voice.released = true;
    const float seconds = param(string_bass::kRelease);
    voice.fade_coeff = std::exp(-6.907755f / kit::max(1.0f, seconds * sample_rate()));
    voice.damp = voice.last;
    voice.damp_a = 0.0f;
  }

  void stop(Voice& voice) {
    voice.sounding = false;
    voice.released = false;
    voice.exciter.stop();
  }

  // One sample of one string, added to its type's bus.
  void render(Voice& voice, float growl, float* bus) {
    if (voice.pending) {
      if (voice.sounding && voice.cut > 0.0f) {
        voice.cut -= voice.cut_step;
        if (voice.cut < 0.0f) voice.cut = 0.0f;
      }
      if (!voice.sounding || voice.cut <= 0.0f) strike(voice);
    }
    if (!voice.sounding) return;

    const float pluck = voice.exciter.active() ? voice.exciter.next(voice.scrape) : 0.0f;
    const float y = voice.string.tick(pluck);
    const float size = y < 0.0f ? -y : y;
    voice.env = size > voice.env ? size : flush_denormal(voice.env * voice.env_decay);

    float x = voice.tap > 0.0f ? y - voice.string.tap(voice.tap) : y;

    // The string against the neck: a tap each time it lands, placed between
    // two samples where the crossing fell, heard through the type's band.
    float tap = voice.carry;
    voice.carry = 0.0f;
    if (voice.type == kFretless) {
      // Once a period, as the string's slow swing comes up through rest.
      voice.bloom += (voice.bloom_target - voice.bloom) * bloom_rate_;
      const float slow = voice.track.lowpass(y);
      if (slow < -kBloomArm * voice.env) {
        voice.armed = true;
      } else if (voice.armed && slow >= 0.0f) {
        voice.armed = false;
        const float late = kit::clamp(-voice.before / (slow - voice.before), 0.0f, 1.0f);
        const float height = voice.env * voice.bloom * voice.growl_gain;
        tap += height * (1.0f - late);
        voice.carry = height * late;
      }
      voice.before = slow;
    } else {
      // Each time the swing passes a fixed height, either side of rest, by
      // as much as its peak stands over that height: soft notes never do.
      if (size >= kBuzzHeight && voice.before < kBuzzHeight) {
        const float late = kit::clamp((kBuzzHeight - voice.before) / (size - voice.before), 0.0f, 1.0f);
        const float height = (y < 0.0f ? -1.0f : 1.0f) * (voice.env - kBuzzHeight) * voice.growl_gain;
        tap += height * (1.0f - late);
        voice.carry = height * late;
      }
      voice.before = size;
    }
    if (tap != 0.0f || !at_rest(voice.colour)) x += growl * voice.colour.bandpass(tap);

    x *= voice.gain;
    if (voice.released) {
      voice.fade *= voice.fade_coeff;
      voice.damp = flush_denormal(x + (voice.damp - x) * voice.damp_a);
      x = voice.damp;
    }
    voice.last = x;
    bus[voice.type] += x * voice.fade * voice.cut;
  }

  // Every control tick: the knobs that reach ringing strings, the hand's
  // low-pass, the bloom, and strings that have died.
  void control() {
    using namespace string_bass;
    const float sr = sample_rate();
    tone_hz_.next();
    hump_.next();
    set_filters();
    const float sustain_before = sustain_.value, mute_before = mute_.value;
    const float sustain = sustain_.next(), mute = mute_.next();
    const bool retime = sustain != sustain_before || mute != mute_before;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding) continue;
      if (!voice.pending && !voice.exciter.active() && voice.env * voice.fade < kSilence) {
        stop(voice);
        continue;
      }
      if (retime) set_ring(voice, sustain, mute);
      if (voice.released) {
        // The low-pass closes as the note fades: wide open at key up, a few
        // times the note by the time it is 30 dB down.
        const float cutoff = kit::max(6.0f * voice.hz, 0.4f * sr * voice.fade * std::sqrt(voice.fade));
        voice.damp_a = std::exp(-kit::kTwoPi * kit::min(cutoff, 0.4f * sr) / sr);
      }
      if (voice.type == kFretless) {
        const float seconds = static_cast<float>(++voice.age) * tick_seconds_;
        const float t = kit::clamp((seconds - kBloomDelaySeconds) / kBloomSeconds, 0.0f, 1.0f);
        const float rise = t * t * (3.0f - 2.0f * t);
        voice.bloom_target = rise * (kBloomFloor + (1.0f - kBloomFloor) * std::exp(-seconds / kBloomSagSeconds));
        voice.colour.set(kit::lerp(kBloomLowHz, kTypes[kFretless].growl_hz, rise), kTypes[kFretless].growl_q, sr);
      }
    }
  }

  void apply(int id) {
    using namespace string_bass;
    const float value = param(id);
    switch (id) {
      case kTone:
        tone_hz_.set(kToneLowHz * std::pow(kToneHighHz / kToneLowHz, value), primed());
        break;
      case kSustain:
        sustain_.set(value, primed());
        break;
      case kMute:
        mute_.set(value, primed());
        break;
      case kGrowl:
        growl_.set(value, primed());
        break;
      case kResonance:
        hump_.set(kit::lerp(kHumpLowQ, kHumpHighQ, value), primed());
        wood_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read when a string is plucked or let go
    }
  }

  // The tone control's low-pass, from one end to the other.
  static constexpr float kToneLowHz = 180.0f;
  static constexpr float kToneHighHz = 9000.0f;
  // The pickup's low-pass: no hump at Resonance 0, about 10 dB at 1.
  static constexpr float kHumpLowQ = 0.55f;
  static constexpr float kHumpHighQ = 3.2f;

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Rng vary_;
  float variation_ = 1.0f;
  kit::Svf pickup_[2];
  kit::Svf body_[kBodyModes];
  kit::Svf knock_;
  kit::OnePole knock_soft_;
  float knock_pulse_ = 0.0f;
  kit::DcBlocker dc_;
  kit::Svf tone_;
  kit::Smoother tone_hz_, hump_, sustain_, mute_;  // on the control clock
  kit::Smoother growl_, wood_, volume_;            // per sample
  float tone_set_ = -1.0f;
  float hump_set_ = -1.0f;
  float bloom_rate_ = 1.0f;
  float tick_seconds_ = 0.0f;
  int period_ = 32;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
};

}  // namespace livemix
