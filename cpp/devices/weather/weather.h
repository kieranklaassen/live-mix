#pragma once

// Weather: leaves the sound out in the weather.
//
//                 ┌─► two high shelves (shade) ─► × sheen ─► × level ─┐
//   in ───────────┤                                                   (+)─► wet ─┐
//    │            └─► is anything playing? ─► linger, then fade ─┐     ▲         │
//    │                                                           ▼     │         ▼
//    │   weather (Kind, Force, Pace, Calm, Sway) ─► its own sound × ───┘   Mix (linear)
//    │        │                                                                  │
//    │        └─► cover, each side ─► shade, sheen and level above               ▼
//    └───────────────────────────────────────────────────────────────────────► out
//
// - Five weathers (weather_models.h), each a model with statistics of its own
//   and no LFO among them. Wind is gusts: sudden rises, slow falls, flutter.
//   Clouds are shadows that come over, lie for seconds and pass. Rain is
//   drops by chance, so many a second, in showers. Surf is a wave that
//   gathers, breaks and draws back. Storm is the wind with the rain coming in
//   sheets on its gusts and thunder far off.
// - A model says how much of the sound is covered on each side, 0..1. Force
//   scales that. Exposure says how much of it reaches the sound itself: the
//   level sinks by so many dB per unit of cover (kDipDb), the top end by so
//   many more (kShadeDb, two first-order shelves from a corner Colour sets),
//   and under wind and surf the sound is roughened by slow noise (kSheen:
//   the sound multiplied by 1 + sheen x noise, so the weather washes through
//   what is playing and nothing is added in silence). At Force 0 or
//   Exposure 0 all three are exactly nothing.
// - Voice is the weather's own sound: the wind's whistle (noise through a
//   resonance that rises and sharpens with the gust), a dark hush under a
//   cloud, the drops (short rising sines) over a far hiss of rain, the wave's
//   roar opening into a wash that thins as it draws back, a low roll of
//   thunder. It is scaled by Voice squared and by Force, runs only while
//   something is playing (an input above -74 dBFS) and for Linger after, then
//   fades over 0.8 s and the device is silent. Every noise is white with the
//   same power per hertz at every sample rate, through filters set in hertz.
// - Sway: gusts lean to a side and flutter apart, drops scatter, a shadow
//   reaches one side before the other, a wave breaks on one side and washes
//   across to the other. At 0 the two sides are the same.
// - Kind cross-fades: each weather is a layer with a weight that moves to its
//   place over 0.3 s, so Wind into Storm keeps its wind and lets the rain in.
// - Nothing moves while the device has nothing to do: with no input and the
//   weather faded out, the models, the clock and every filter stand still,
//   sample for sample, so a render is the same at every block size, also
//   across a silence. On the first sample after it, every smoothed value
//   starts where its control stands.
// - A sample of the input that is not a number is taken as silence and one
//   beyond +18 dBFS is held there.
//
// Storage: no delay line and no table; a few hundred floats of filter and
// model state. No latency.

#include "../../kit/kit.h"
#include "params.gen.h"
#include "weather_models.h"

namespace livemix {

class Weather : public kit::DeviceBase<weather::kNumParams> {
 public:
  enum Kind : int { kWind = 0, kClouds, kRain, kSurf, kStorm, kKinds };
  enum Layer : int { kGusts = 0, kShadows, kDrops, kWaves, kRolls, kLayers };

  static constexpr int kControlPeriod = 16;
  static constexpr float kKindFadeSeconds = 0.3f;
  // Per unit of cover at Force 1 and Exposure 1, for each layer: how far the
  // level sinks, how far the top end sinks beyond that, and how rough the
  // sound gets.
  static constexpr float kDipDb[kLayers] = {10.0f, 6.0f, 12.0f, 14.0f, 0.0f};
  static constexpr float kShadeDb[kLayers] = {14.0f, 26.0f, 4.0f, 18.0f, 0.0f};
  static constexpr float kSheen[kLayers] = {0.25f, 0.0f, 0.0f, 0.6f, 0.0f};
  // The corner of the two shelves at Colour 0 and at Colour 1.
  static constexpr float kShadeLowHz = 700.0f;
  static constexpr float kShadeHighHz = 5000.0f;
  static constexpr float kSheenHz = 1200.0f;
  static constexpr float kSheenMost = 2.0f;   // the sheen's noise is held to this many times its RMS
  // The weather's own sound. A layer measures an RMS of about its kLoud at
  // full cover; Voice squared times kVoiceGain scales the sum.
  static constexpr float kVoiceGain = 0.2f;
  static constexpr float kLoud[kLayers] = {1.0f, 0.6f, 1.0f, 2.5f, 1.6f};
  // Wind: the resonance's pitch at Colour 0 and 1 in a lull, how far a gust
  // raises it, and its sharpness in a lull and in a full gust.
  static constexpr float kWhistleLowHz = 350.0f;
  static constexpr float kWhistleHighHz = 1800.0f;
  static constexpr float kWhistleRise = 1.2f;
  static constexpr float kWhistleQ = 1.5f;
  static constexpr float kWhistleQGust = 5.0f;
  // Clouds: the hush's two poles at Colour 0 and 1.
  static constexpr float kHushLowHz = 180.0f;
  static constexpr float kHushHighHz = 1200.0f;
  // Rain: a drop against the hiss, and the hiss's band.
  static constexpr float kDropLoud = 2.5f;
  static constexpr float kHissLoud = 0.3f;
  static constexpr float kHissLowHz = 2000.0f;
  static constexpr float kHissHighHz = 5000.0f;
  static constexpr float kHissTopHz = 8500.0f;
  // Surf: where the roar's low-pass stands as the wave gathers and once it
  // has broken, and where the high-pass that thins the wash ends, each at
  // Colour 0 (Colour 1 is two octaves up).
  static constexpr float kRoarHz = 120.0f;
  static constexpr float kRoarGather = 3.0f;
  static constexpr float kWashHz = 2500.0f;
  static constexpr float kThinFromHz = 60.0f;
  static constexpr float kThinToHz = 800.0f;
  static constexpr float kSurfOctaves = 2.0f;
  // Thunder: its two poles at Colour 0 and 1.
  static constexpr float kThunderLowHz = 70.0f;
  static constexpr float kThunderHighHz = 160.0f;
  // Below -74 dBFS nothing is playing.
  static constexpr float kQuiet = 2.0e-4f;
  static constexpr float kInputLimit = 8.0f;  // +18 dBFS
  static constexpr float kGateRiseSeconds = 0.04f;
  static constexpr float kGateFallSeconds = 0.8f;
  static constexpr long kNever = 1L << 30;

  void init(float sample_rate) {
    using namespace weather;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    source_[0].init(0, sr);
    source_[1].init(1, sr);
    wind_.init(10);
    clouds_.init(20);
    rain_.init(30);
    surf_.init(40);
    thunder_.init(50);
    for (int c = 0; c < 2; ++c) {
      for (int s = 0; s < 2; ++s) {
        shade_[c][s].reset();
        hush_[c][s].reset();
        roll_[c][s].reset();
      }
      sheen_lp_[c].reset();
      sheen_lp_[c].set_cutoff(kSheenHz, sr);
      whistle_[c].reset();
      hiss_hp_[c].reset();
      hiss_lp_[c].reset();
      hiss_lp_[c].set(kHissTopHz, 0.7f, sr);
      roar_[c].reset();
      thin_[c].reset();
      gain_[c].set_time(kSmoothingSeconds, sr);
      gain_[c].snap(1.0f);
      dim_[c].set_time(kSmoothingSeconds, sr);
      dim_[c].snap(0.0f);
      sheen_[c].set_time(kSmoothingSeconds, sr);
      sheen_[c].snap(0.0f);
      for (int l = 0; l < kLayers; ++l) {
        amp_[l][c].set_time(kSmoothingSeconds, sr);
        amp_[l][c].snap(0.0f);
      }
    }
    mix_.set_time(kSmoothingSeconds, sr);
    voice_.set_time(kSmoothingSeconds, sr);
    kind_ = kit::clamp_int(static_cast<int>(param(kKind) + 0.5f), 0, kKinds - 1);
    for (int l = 0; l < kLayers; ++l) weight_[l] = kLayerOf[kind_][l];
    sheets_ = kind_ == kStorm ? 1.0f : 0.0f;
    fade_step_ = static_cast<float>(kControlPeriod) / (kKindFadeSeconds * sr);
    gate_ = 0.0f;
    gate_rise_ = 1.0f / (kGateRiseSeconds * sr);
    gate_fall_ = 1.0f / (kGateFallSeconds * sr);
    quiet_ = kNever;
    linger_samples_ = static_cast<long>(param(kLinger) * sr);
    calm_seen_ = colour_seen_ = sway_seen_ = -1.0f;
    side_same_ = 1.0f;
    side_other_ = 0.0f;
    whistle_norm_ = hush_norm_ = roll_norm_ = hiss_norm_ = 0.0f;
    level_now_ = 0.0f;
    running_ = false;
    snap_ = true;
    clock_.reset(kControlPeriod);
    idle_.reset(sr, 0.02f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw:
  // 0, how strong the weather is now, 0..1 (the gust, the shadow, how thick
  //    the rain falls, the wave; never more than Force);
  // 1, the gain it has the sound's level at now, the two sides averaged
  //    (1 at rest, before Mix);
  // 2, how many drops have fallen so far (it wraps at 2^20);
  // 3, how much of the weather's own sound is on, 0..1: 1 while something
  //    plays and through Linger, falling in the fade, 0 asleep;
  // 4, how many rolls of thunder there have been (it wraps at 2^20).
  float meter(int index) const {
    switch (index) {
      case 0:
        return running_ ? level_now_ : 0.0f;
      case 1:
        return running_ ? 0.5f * (gain_[0].value + gain_[1].value) : 1.0f;
      case 2:
        return static_cast<float>(rain_.count);
      case 3:
        return gate_ * gate_ * (3.0f - 2.0f * gate_);
      case 4:
        return static_cast<float>(thunder_.count);
      default:
        return 0.0f;
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    // Awake while there is input and until the weather has faded behind it.
    if (!idle_.wake(input_present(frames) || gate_ > 0.0f)) {
      running_ = false;
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      // A sample that is not a number becomes silence and an absurd one is
      // held to kInputLimit; anything a mix can really hold passes bit for bit.
      for (int c = 0; c < 2; ++c) {
        if (!(in[c] == in[c])) in[c] = 0.0f;
        in[c] = kit::clamp(in[c], -kInputLimit, kInputLimit);
      }
      // With nothing coming in and the weather faded out, nothing moves: the
      // same samples stand still whatever the host's block size.
      if (gate_ <= 0.0f && in[0] == 0.0f && in[1] == 0.0f) {
        running_ = false;
        quiet_ = kNever;
        out_left_[i] = 0.0f;
        out_right_[i] = 0.0f;
        continue;
      }
      if (!running_) {
        // Back from a silence: the clock fires at once, and what moved while
        // nothing ran starts where it stands now.
        running_ = true;
        snap_ = true;
        clock_.reset(kControlPeriod);
      }
      const float left = in[0] < 0.0f ? -in[0] : in[0];
      const float right = in[1] < 0.0f ? -in[1] : in[1];
      if ((left > right ? left : right) > kQuiet) {
        quiet_ = 0;
      } else if (quiet_ < kNever) {
        ++quiet_;
      }
      if (clock_.tick()) control();
      if (snap_) snap();
      gate_ = quiet_ < linger_samples_ ? kit::min(1.0f, gate_ + gate_rise_)
                                       : kit::max(0.0f, gate_ - gate_fall_);

      const float white = source_[0].next();
      const float other = source_[1].next();
      const float noise[2] = {white, white * side_same_ + other * side_other_};

      const float voice = glide(voice_) * gate_ * gate_ * (3.0f - 2.0f * gate_);
      // The drops ring on whether or not they are heard, so none is left over.
      float drops[2] = {0.0f, 0.0f};
      if (weight_[kDrops] > 0.0f) {
        for (weather_models::Drop& drop : rain_.drops) drop.render(&drops[0], &drops[1]);
      }

      float out[2];
      for (int c = 0; c < 2; ++c) {
        // What the weather does to the sound: its top end, its roughness, its level.
        const float dim = glide(dim_[c]);
        float y = in[c];
        y -= dim * (y - shade_[c][0].lowpass(y));
        y -= dim * (y - shade_[c][1].lowpass(y));
        const float grain =
            kit::clamp(sheen_lp_[c].lowpass(noise[c]) * kSheenNorm, -kSheenMost, kSheenMost);
        y *= 1.0f + glide(sheen_[c]) * grain;
        y *= glide(gain_[c]);

        // The weather's own sound.
        if (voice > 0.0f) {
          const float n = noise[c];
          float v = drops[c] * drops_level_;
          if (sounding(kGusts, c)) v += glide(amp_[kGusts][c]) * whistle_norm_ * whistle_[c].bandpass(n);
          if (sounding(kShadows, c)) {
            v += glide(amp_[kShadows][c]) * hush_norm_ * hush_[c][1].lowpass(hush_[c][0].lowpass(n));
          }
          if (sounding(kDrops, c)) {
            v += glide(amp_[kDrops][c]) * hiss_norm_ * hiss_lp_[c].lowpass(hiss_hp_[c].highpass(n));
          }
          if (sounding(kWaves, c)) v += glide(amp_[kWaves][c]) * thin_[c].highpass(roar_[c].lowpass(n));
          if (sounding(kRolls, c)) {
            v += glide(amp_[kRolls][c]) * roll_norm_ * roll_[c][1].lowpass(roll_[c][0].lowpass(n));
          }
          y += kit::soft_clip(v * voice);
        }
        out[c] = y;
      }
      const float mix = glide(mix_);
      out_left_[i] = in[0] + mix * (out[0] - in[0]);
      out_right_[i] = in[1] + mix * (out[1] - in[1]);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // Which layers each Kind is made of.
  static constexpr float kLayerOf[kKinds][kLayers] = {
      {1.0f, 0.0f, 0.0f, 0.0f, 0.0f},  // Wind
      {0.0f, 1.0f, 0.0f, 0.0f, 0.0f},  // Clouds
      {0.0f, 0.0f, 1.0f, 0.0f, 0.0f},  // Rain
      {0.0f, 0.0f, 0.0f, 1.0f, 0.0f},  // Surf
      {1.0f, 0.0f, 1.0f, 0.0f, 1.0f},  // Storm: the wind, the rain in its gusts, thunder
  };
  static constexpr float kDbToNeper = 0.11512925f;  // ln(10) / 20
  // White noise of unit variance at 48 kHz has a power of 1 / 24000 per
  // hertz. Through a band-pass of unit peak, centre f and sharpness Q it
  // keeps (pi / 2) f / Q hertz of it; through two equal poles at f,
  // (pi / 4) f; through one, (pi / 2) f.
  static constexpr float kBandNorm = 123.6f;   // sqrt(2 x 24000 / pi)
  static constexpr float kPolesNorm = 174.8f;  // sqrt(4 x 24000 / pi)
  static constexpr float kSheenNorm = 3.568f;  // sqrt(2 x 24000 / (pi x kSheenHz))

  // A smoother's next value; at rest it costs one comparison.
  static float glide(kit::Smoother& smoother) {
    return smoother.settled() ? smoother.value : smoother.next();
  }

  bool sounding(int layer, int c) const {
    return amp_[layer][c].value != 0.0f || amp_[layer][c].target != 0.0f;
  }

  // Every smoothed value starts where it is headed: before the first block
  // and after a silence nothing glides in from where it was left.
  void snap() {
    snap_ = false;
    for (int c = 0; c < 2; ++c) {
      gain_[c].snap(gain_[c].target);
      dim_[c].snap(dim_[c].target);
      sheen_[c].snap(sheen_[c].target);
      for (int l = 0; l < kLayers; ++l) amp_[l][c].snap(amp_[l][c].target);
    }
    mix_.snap(mix_.target);
    voice_.snap(voice_.target);
  }

  // Every 16 samples: the layers' weights, a step of each weather that is
  // on, and what they make of the sound and of their own.
  void control() {
    using namespace weather;
    namespace wm = weather_models;
    const float sr = sample_rate();
    const float real = static_cast<float>(kControlPeriod) / sr;
    const float force = param(kForce);
    const float pace = param(kPace);
    const float calm = param(kCalm);
    const float sway = param(kSway);
    const float colour = param(kColour);
    const float reach = force * param(kExposure);
    const float dt = real * pace;
    linger_samples_ = static_cast<long>(param(kLinger) * sr);

    if (calm != calm_seen_) {
      calm_seen_ = calm;
      lull_[kGusts] = wm::Wind::gap(calm);
      lull_[kShadows] = wm::Clouds::gap(calm);
      lull_[kDrops] = wm::Rain::gap(calm);
      lull_[kWaves] = wm::Surf::gap(calm);
      lull_[kRolls] = wm::Thunder::gap(calm);
      rain_floor_ = wm::Rain::floor(calm);
    }
    if (sway != sway_seen_) {
      sway_seen_ = sway;
      // The right side's noise: the left's at Sway 0, its own at Sway 1, the
      // same power throughout.
      side_same_ = std::cos(sway * kit::kHalfPi);
      side_other_ = std::sin(sway * kit::kHalfPi);
      if (sway <= 0.0f) {
        side_same_ = 1.0f;
        side_other_ = 0.0f;
      }
    }
    if (colour != colour_seen_) {
      colour_seen_ = colour;
      const float shade_hz = kShadeLowHz * std::pow(kShadeHighHz / kShadeLowHz, colour);
      const float hush_hz = kHushLowHz * std::pow(kHushHighHz / kHushLowHz, colour);
      const float roll_hz = kThunderLowHz * std::pow(kThunderHighHz / kThunderLowHz, colour);
      const float hiss_hz = kHissLowHz * std::pow(kHissHighHz / kHissLowHz, colour);
      whistle_hz_ = kWhistleLowHz * std::pow(kWhistleHighHz / kWhistleLowHz, colour);
      surf_up_ = std::exp2(kSurfOctaves * colour);
      for (int c = 0; c < 2; ++c) {
        for (int s = 0; s < 2; ++s) {
          shade_[c][s].set_cutoff(shade_hz, sr);
          hush_[c][s].set_cutoff(hush_hz, sr);
          roll_[c][s].set_cutoff(roll_hz, sr);
        }
        hiss_hp_[c].set(hiss_hz, 0.7f, sr);
      }
      hush_norm_ = kPolesNorm / std::sqrt(hush_hz);
      roll_norm_ = kPolesNorm / std::sqrt(roll_hz);
      // What is left between the hiss's two filters, by measurement at five Colours.
      hiss_norm_ = 1.0f / (0.518f - 0.070f * colour - 0.059f * colour * colour);
    }

    // The layers move to the weights the Kind gives them.
    for (int l = 0; l < kLayers; ++l) weight_[l] = toward(weight_[l], kLayerOf[kind_][l]);
    sheets_ = toward(sheets_, kind_ == kStorm ? 1.0f : 0.0f);

    float dip[2] = {0.0f, 0.0f};
    float shade[2] = {0.0f, 0.0f};
    float sheen[2] = {0.0f, 0.0f};
    float level = 0.0f;
    const auto covers = [&](int layer, const float* cover) {
      const float w = weight_[layer];
      for (int c = 0; c < 2; ++c) {
        dip[c] += w * kDipDb[layer] * cover[c];
        shade[c] += w * kShadeDb[layer] * cover[c];
        sheen[c] += w * kSheen[layer] * cover[c];
      }
    };
    // Two layers share the air at constant power while one gives way to the other.
    const auto loud = [&](int layer) {
      return force * kLoud[layer] * kit::SineTable::lookup(0.25f * weight_[layer]);
    };

    if (on(kGusts)) {
      wind_.step(dt, lull_[kGusts], sway);
      covers(kGusts, wind_.cover);
      level = kit::max(level, weight_[kGusts] * wind_.level());
      const float blow = 0.5f * (wind_.blow[0] + wind_.blow[1]);
      const float hz = whistle_hz_ * (1.0f + kWhistleRise * blow);
      const float q = kWhistleQ + kWhistleQGust * blow;
      whistle_[0].set(hz, q, sr);
      copy_tuning(whistle_[0], &whistle_[1]);
      whistle_norm_ = kBandNorm * std::sqrt(q / hz);
      for (int c = 0; c < 2; ++c) {
        amp_[kGusts][c].set_target(loud(kGusts) * wind_.cover[c] * std::sqrt(wind_.blow[c]));
      }
    } else {
      rest(kGusts);
    }

    if (on(kShadows)) {
      clouds_.step(dt, lull_[kShadows], sway);
      covers(kShadows, clouds_.cover);
      level = kit::max(level, weight_[kShadows] * clouds_.level());
      for (int c = 0; c < 2; ++c) amp_[kShadows][c].set_target(loud(kShadows) * clouds_.cover[c]);
    } else {
      rest(kShadows);
    }

    if (on(kDrops)) {
      rain_.step(dt, real, force, pace, lull_[kDrops], rain_floor_, sway, colour, sheets_,
                 wind_.gust.level, sr);
      covers(kDrops, rain_.cover);
      level = kit::max(level, weight_[kDrops] * rain_.level());
      // A drop carries the root of Force in its own size: the layer's weight is the rest.
      drops_level_ = kLoud[kDrops] * kDropLoud * kit::SineTable::lookup(0.25f * weight_[kDrops]);
      const float hiss = loud(kDrops) * kHissLoud * std::sqrt(rain_.density);
      amp_[kDrops][0].set_target(hiss);
      amp_[kDrops][1].set_target(hiss);
    } else {
      rest(kDrops);
      drops_level_ = 0.0f;
    }

    if (on(kWaves)) {
      surf_.step(dt, lull_[kWaves], sway);
      covers(kWaves, surf_.cover);
      level = kit::max(level, weight_[kWaves] * surf_.level());
      // The roar opens as the wave gathers and is wide open once it has
      // broken; the wash then thins from underneath as it draws back.
      namespace s = weather_models;
      const float at = surf_.at;
      const float broken = s::Surf::kGather + s::Surf::kBreak;
      float open_hz = kRoarHz * (1.0f + kRoarGather * kit::min(1.0f, at / s::Surf::kGather));
      float thin_hz = kThinFromHz;
      if (at >= s::Surf::kGather) {
        const float breaking = s::smoothstep((at - s::Surf::kGather) / s::Surf::kBreak);
        open_hz *= std::pow(kWashHz / open_hz, breaking);
      }
      if (at > broken) thin_hz *= std::pow(kThinToHz / kThinFromHz, (at - broken) / (1.0f - broken));
      roar_[0].set(open_hz * surf_up_, 0.7f, sr);
      copy_tuning(roar_[0], &roar_[1]);
      thin_[0].set_cutoff(thin_hz * surf_up_, sr);
      thin_[1].a = thin_[0].a;
      for (int c = 0; c < 2; ++c) amp_[kWaves][c].set_target(loud(kWaves) * surf_.cover[c]);
    } else {
      rest(kWaves);
    }

    if (on(kRolls)) {
      thunder_.step(dt, real, lull_[kRolls]);
      const float roll = loud(kRolls) * thunder_.level;
      amp_[kRolls][0].set_target(roll);
      amp_[kRolls][1].set_target(roll);
    } else {
      rest(kRolls);
    }

    for (int c = 0; c < 2; ++c) {
      gain_[c].set_target(std::exp(-reach * dip[c] * kDbToNeper));
      dim_[c].set_target(1.0f - std::exp(-reach * shade[c] * (0.5f * kDbToNeper)));
      sheen_[c].set_target(reach * sheen[c]);
    }
    level_now_ = force * kit::min(1.0f, level);
  }

  bool on(int layer) const { return weight_[layer] > 0.0f || kLayerOf[kind_][layer] > 0.0f; }
  void rest(int layer) {
    amp_[layer][0].set_target(0.0f);
    amp_[layer][1].set_target(0.0f);
  }
  float toward(float value, float target) const {
    if (snap_) return target;
    return target > value ? kit::min(target, value + fade_step_) : kit::max(target, value - fade_step_);
  }
  static void copy_tuning(const kit::Svf& from, kit::Svf* to) {
    to->g = from.g;
    to->k = from.k;
    to->a1 = from.a1;
    to->a2 = from.a2;
    to->a3 = from.a3;
  }

  void apply(int id) {
    using namespace weather;
    const float value = param(id);
    switch (id) {
      case kKind:
        kind_ = kit::clamp_int(static_cast<int>(value + 0.5f), 0, kKinds - 1);
        break;
      case kVoice:
        voice_.set(kVoiceGain * value * value, primed());
        break;
      case kMix:
        mix_.set(value, primed());
        break;
      default:
        break;  // the rest is read on the control clock
    }
  }

  weather_models::Source source_[2];
  weather_models::Wind wind_;
  weather_models::Clouds clouds_;
  weather_models::Rain rain_;
  weather_models::Surf surf_;
  weather_models::Thunder thunder_;
  kit::OnePole shade_[2][2], hush_[2][2], roll_[2][2];
  kit::OnePole sheen_lp_[2], thin_[2];
  kit::Svf whistle_[2], hiss_hp_[2], hiss_lp_[2], roar_[2];
  kit::Smoother gain_[2], dim_[2], sheen_[2];
  kit::Smoother amp_[kLayers][2];
  kit::Smoother mix_, voice_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float weight_[kLayers] = {};
  float lull_[kLayers] = {};
  float sheets_ = 0.0f;
  float fade_step_ = 0.0f;
  float rain_floor_ = 0.0f;
  float drops_level_ = 0.0f;
  float gate_ = 0.0f;
  float gate_rise_ = 0.0f, gate_fall_ = 0.0f;
  float calm_seen_ = -1.0f, colour_seen_ = -1.0f, sway_seen_ = -1.0f;
  float side_same_ = 1.0f, side_other_ = 0.0f;
  float whistle_hz_ = 800.0f, surf_up_ = 1.0f;
  float whistle_norm_ = 0.0f, hush_norm_ = 0.0f, roll_norm_ = 0.0f, hiss_norm_ = 0.0f;
  float level_now_ = 0.0f;
  long quiet_ = kNever;
  long linger_samples_ = 1;
  int kind_ = 0;
  bool running_ = false;
  bool snap_ = true;
};

}  // namespace livemix
