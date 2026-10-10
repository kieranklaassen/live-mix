#pragma once

// Stops: organ stops for any sound. Five ranks are added to what is playing,
// at an octave below (x0.5), a fifth (x1.5), an octave (x2), a twelfth (x3)
// and two octaves (x4) above, each with a drawbar; the unison is the sound
// itself.
//
//   in ─┬─► kit::Stft ring ─► dry(), 4608 late ──────────────── x (1 - Mix (1 - Unison)) ─┐
//       │                                                                                 ├─► out
//       └─► Hann ─► FFT ─► peaks ─► ranks as Hann lobes ─► IFFT ─► Hann ─► ceiling ─ x Mix ─┘
//                            │         ▲
//                            └ speak, chiff, tone, swell, detune
//
// One analysis serves every rank. Frames of 4096 samples every 1024
// (kit::Stft<4096, 1024>, 11.7 Hz a bin at 48 kHz, so the notes of a chord
// from the octave under middle C up stand apart). In each frame:
//
// - Peaks. Every local maximum of the spectrum within 72 dB of the frame's
//   strongest is a partial. Its true frequency comes from how far its phase
//   turned since the last frame (Stft::advance_to_bin); where the last frame
//   held nothing there, from the two bins beside it. Its amplitude is the
//   bin's, divided by the Hann lobe at that distance from the bin's centre.
// - Ranks. For each drawn rank the partial is written again at its frequency
//   times the rank's ratio: the spectrum of a Hann-windowed sine at exactly
//   that frequency (ten bins of the window's transform, from a table). Its
//   phase is its source's, turned on each frame by the difference of the two
//   frequencies over one hop (both read at the middle of the frame), so a
//   rank is a sine at the true multiple, not a bin moved, and the cost of a
//   rank is ten bins per partial. Each bin remembers how far each rank has
//   turned; a partial that drifts to the next bin takes that with it (a peak
//   owns the bins up to half way to the next peak).
// - Stereo. Each channel has its own analysis and its own ranks, so a rank
//   stands where its source stands. Where the right channel finds a partial
//   the left has too (within 0.03 bin, in the same frame), it takes the
//   left's turn: the rank then keeps the phase its source has between the
//   channels, and a sound in the middle stays in the middle. Mono in is mono
//   out, bit for bit.
// - Speak. Each bin follows the level in a band of ±4 % round it (so a
//   vibrato stays inside), rising to 90 % in Speak and falling in 150 ms.
//   A rank sounds at the share of the level that follower has reached: it
//   swells in after each new note and stops with it.
// - Chiff. A second follower rises in 100 ms. What it has not yet reached is
//   sounded as noise in the band round each rank's pitch (the same power
//   spread over ±4 %, fresh random phase each frame): breath first, then tone.
// - Tone and Swell shape what the ranks put out. Tone under the middle rolls
//   them off above 400 Hz; over the middle it tilts them about 1.5 kHz,
//   thinner below (8 dB at most) and brighter above (6 dB at most). Swell is
//   their level (its square) and a roll-off above 400 Hz as the shutters
//   close. Detune puts each rank a few cents off, each its own way, the same
//   in both channels.
// - Level. A drawbar at 1 is a copy as loud as its source. Past that, the
//   ranks together are held to the power of what they copy, and a ceiling on
//   their sum is linear to ±0.5 and never past ±1: with the unison full the
//   output can peak 6 dB over the input and no more.
//
// The wet side is the unison and the ranks, in time with the dry side, so Mix
// is a linear crossfade: out = dry (1 - Mix (1 - Unison)) + Mix x ranks. With
// Unison full the sound itself never moves; with every rank in, or at Mix 0,
// the output is the input 4608 samples late, bit for bit.
//
// Latency: kit::Stft's, 4096 + 512 samples (96 ms at 48 kHz), the dry side
// delayed to match. Storage: two Stft channels (176 KB each) and 250 KB of
// per-bin state and tables; no delay line of its own. At 96 kHz the bins are
// twice as wide and the frames twice as often; everything in Hz or seconds is
// worked out from the sample rate in init.

#include "../../kit/kit.h"
#include "../../kit/stft.h"
#include "params.gen.h"

namespace livemix {

class Stops : public kit::DeviceBase<stops::kNumParams> {
 public:
  using Stft = kit::Stft<4096, 1024>;
  static constexpr int kLatency = Stft::kLatency;  // "latencySamples": 4608
  static constexpr int kRanks = 5;
  // What each rank multiplies a partial's frequency by.
  static constexpr float kRatio[kRanks] = {0.5f, 1.5f, 2.0f, 3.0f, 4.0f};
  // Detune at 1 puts a rank this many cents off, times its own share.
  static constexpr float kDetuneCents = 14.0f;
  static constexpr float kDetuneShare[kRanks] = {-0.55f, 0.8f, 1.0f, -0.75f, 0.6f};

  void init(float sample_rate) {
    using namespace stops;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    stft_[0].init();
    stft_[1].init(Stft::kMaxStagger);
    build_tables(sr);
    for (int c = 0; c < 2; ++c) {
      Channel& channel = channel_[c];
      for (int k = 0; k < Stft::kBins; ++k) {
        channel.spoken[k] = 0.0f;
        channel.breathed[k] = 0.0f;
        channel.last_re[k] = 0.0f;
        channel.last_im[k] = 0.0f;
        for (int s = 0; s < kRanks; ++s) channel.phase[s][k] = 0.0f;
      }
      for (int s = 0; s < kRanks; ++s) channel.level[s] = 0.0f;
      channel.input_level = 0.0f;
      channel.alive = false;
    }
    for (int k = 0; k < Stft::kBins; ++k) {
      breath_[k] = 0.0f;
      lead_place_[k] = -1.0f;
    }
    lead_frame_ = 0xFFFFFFFFu;
    mix_.set_time(kSmoothingSeconds, sr);
    unison_.set_time(kSmoothingSeconds, sr);
    mix_.snap(param(kMix));
    unison_.snap(param(kUnison));
    silent_ = kSilentSamples;
    tone_seen_ = -1.0f;
    swell_seen_ = -1.0f;
    snapshot(0);
    // What is in flight when the last follower has gone: a latency and a frame.
    idle_.reset(sr, static_cast<float>(Stft::kLatency + Stft::kFrame + Stft::kHop) / sr);
  }

  void set_param(int id, float value) {
    using namespace stops;
    if (!store_param(id, value)) return;
    // Mix and Unison glide (5 ms) while anything sounds and snap in silence:
    // a knob moved between two notes is in place when the next one starts.
    // Silence is counted in samples, so it is the same at every block size.
    const bool glide = primed() && silent_ < kSilentSamples;
    if (id == kMix) mix_.set(param(id), glide);
    if (id == kUnison) unison_.set(param(id), glide);
    // The rest is read once per frame: the overlap crossfades a change.
  }

  // The readings named by "meters" in device.json, for the display's glow:
  // how loud each rank is sounding in the newest frame, as the amplitude of
  // one sine of the same power (1 is full scale), before the ceiling and
  // Mix; the louder channel's. Index 1 is the unison: what the ranks are
  // copies of, the partials found in the input. All 0 in silence and asleep.
  float meter(int index) const {
    if (index == 1) return kit::max(channel_[0].input_level, channel_[1].input_level);
    const int rank = index == 0 ? 0 : index - 1;
    if (index < 0 || rank >= kRanks) return 0.0f;
    return kit::max(channel_[0].level[rank], channel_[1].level[rank]);
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames) || channel_[0].alive || channel_[1].alive)) {
      silence_output(frames);
      stft_[0].skip(frames);  // the frame clock runs on through the sleep
      stft_[1].skip(frames);
      if (silent_ < kSilentSamples) silent_ += frames;
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      const float mix = mix_.next();
      const float dry_gain = 1.0f - mix * (1.0f - unison_.next());
      float out[2];
      for (int c = 0; c < 2; ++c) {
        const float ranks = stft_[c].process(in[c], [this, c](float* re, float* im) { frame(c, re, im); });
        out[c] = stft_[c].dry() * dry_gain + kCeiling * kit::soft_clip(ranks * (1.0f / kCeiling)) * mix;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
      const bool silent = in[0] == 0.0f && in[1] == 0.0f && out[0] == 0.0f && out[1] == 0.0f;
      silent_ = silent ? (silent_ < kSilentSamples ? silent_ + 1 : silent_) : 0;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kBins = Stft::kBins;
  // The Hann lobe as it is written: this many bins either side of a target,
  // at this many places between two bins.
  static constexpr int kLobeHalf = 5;
  static constexpr int kLobeSteps = 256;
  static constexpr int kFirstBin = 2;  // the lowest bin a partial is looked for in
  static constexpr int kMaxPeaks = kBins / 2 + 1;
  // A partial counts within 72 dB of the frame's strongest bin and above
  // -100 dBFS (a sine of amplitude 1e-5 reads 1e-5 x Stft::kFullScale).
  static constexpr float kRelativePower = 6.3e-8f;
  static constexpr float kFloorPower = (1.0e-5f * Stft::kFullScale) * (1.0e-5f * Stft::kFullScale);
  // A follower under this holds nothing: -160 dBFS.
  static constexpr float kFollowerFloor = 1.0e-5f;
  static constexpr float kReleaseSeconds = 0.15f;
  static constexpr float kChiffSeconds = 0.1f;
  // Chiff at 1 breathes out this many times what the rank has not yet reached.
  static constexpr float kChiffFull = 1.6f;
  // The band a follower listens to and a breath is spread over: this share
  // of the bin's own number either way, two bins at least.
  static constexpr float kBandShare = 0.04f;
  static constexpr float kPivotHz = 400.0f;
  static constexpr float kDarkSlopeDb = 12.0f;    // per octave above the pivot, Tone at 0
  static constexpr float kBrightHz = 1500.0f;
  static constexpr float kBrightSlopeDb = 4.0f;  // per octave about kBrightHz, Tone at 1
  static constexpr float kBrightCutDb = 8.0f;    // the most it takes below
  static constexpr float kBrightLiftDb = 6.0f;   // the most it adds above
  static constexpr float kShutterSlopeDb = 6.0f;  // per octave above the pivot, Swell at 0
  // Ranks fade out between 16 and 20 kHz (or these shares of the Nyquist
  // frequency, if that is lower), and below hearing between 18 and 28 Hz.
  static constexpr float kTopFadeFromHz = 16000.0f;
  static constexpr float kTopFadeToHz = 20000.0f;
  static constexpr float kTopFadeFrom = 0.80f;
  static constexpr float kTopFadeTo = 0.92f;
  static constexpr float kLowFadeFromHz = 18.0f;
  static constexpr float kLowFadeToHz = 28.0f;
  // Fresh random phase each frame comes out at 2/3 of a frame's own power
  // and a steady sine at 4 times it (a quarter hop): the square root of 6.
  static constexpr float kBreathGain = 2.4494897f;
  static constexpr float kCeiling = 1.0f;
  // After this much silence in and out nothing is left in flight: a latency and a frame.
  static constexpr int kSilentSamples = Stft::kLatency + Stft::kFrame;
  static constexpr int kAngles = 1024;  // unit vectors round the circle, for the breath
  // Two channels hold the same partial when they find it within this many bins.
  static constexpr float kSamePlace = 0.03f;

  struct Channel {
    float spoken[kBins];         // the speak follower: the level each bin's band has come up to
    float breathed[kBins];       // the chiff follower, the same with a fixed rise
    float last_re[kBins];        // the frame before
    float last_im[kBins];
    float phase[kRanks][kBins];  // how far each rank has turned against its source, in turns
    float level[kRanks];         // for meter()
    float input_level;
    bool alive;                  // any follower above the floor
  };

  // The Hann window's transform at d bins from a sine, as a share of its
  // value at the sine itself: sinc(d) / (1 - d²). 1 at 0, 1/2 at ±1, 0 at ±2,
  // ±3 and so on.
  static double hann_lobe(double d) {
    const double size = std::fabs(d);
    if (size < 1.0e-6) return 1.0;
    if (std::fabs(size - 1.0) < 1.0e-6) return 0.5;
    const double x = 3.14159265358979323846 * d;
    return std::sin(x) / (x * (1.0 - d * d));
  }

  // Everything that depends on the sample rate alone.
  void build_tables(float sr) {
    for (int step = 0; step < kLobeSteps; ++step) {
      for (int j = 0; j < 2 * kLobeHalf; ++j) {
        // Bin (j - kLobeHalf + 1) above the bin under the target, which lies
        // step/kLobeSteps of a bin further up. Neighbouring bins of a
        // windowed sine alternate in sign (see add_partial).
        const int offset = j - kLobeHalf + 1;
        const double d = offset - static_cast<double>(step) / kLobeSteps;
        lobe_[step][j] = static_cast<float>(((offset & 1) ? -1.0 : 1.0) * hann_lobe(d));
      }
    }
    // What the narrower reading of a bin (see frame) gives d bins from a
    // sine, against the lobe's height: 1.5 on it, 1 a bin away.
    for (int i = 0; i <= kLobeSteps; ++i) {
      const double d = static_cast<double>(i) / kLobeSteps;
      main_lobe_[i] = static_cast<float>(hann_lobe(d) + 0.5 * hann_lobe(d - 1.0) + 0.5 * hann_lobe(d + 1.0));
    }
    for (int i = 0; i < kAngles; ++i) {
      unit_re_[i] = kit::SineTable::cos_lookup(static_cast<float>(i) / kAngles);
      unit_im_[i] = kit::SineTable::lookup(static_cast<float>(i) / kAngles);
    }
    for (int k = 0; k < kBins; ++k) {
      const int reach = kit::clamp_int(static_cast<int>(kBandShare * static_cast<float>(k) + 0.5f), 2, kBins);
      band_from_[k] = static_cast<uint16_t>(kit::clamp_int(k - reach, 0, kBins));
      band_to_[k] = static_cast<uint16_t>(kit::clamp_int(k + reach + 1, 0, kBins));
    }
    const float frame_seconds = static_cast<float>(Stft::kHop) / sr;
    release_ = std::exp(-frame_seconds / kReleaseSeconds);
    // To 90 % in kChiffSeconds: 2.3 time constants.
    chiff_rise_ = 1.0f - std::exp(-2.3025851f * frame_seconds / kChiffSeconds);
    low_from_ = Stft::hz_to_bin(kLowFadeFromHz, sr);
    low_to_ = Stft::hz_to_bin(kLowFadeToHz, sr);
  }

  // What a frame works with, read from the knobs once per frame when the
  // left channel's comes (the right's is the same frame, half a hop later).
  void snapshot(uint32_t number) {
    using namespace stops;
    static constexpr int kRankParam[kRanks] = {kSub, kFifth, kOctave, kTwelfth, kFifteenth};
    snapshot_frame_ = number;
    const float sr = sample_rate();
    // A drawbar's level is its position to the power 1.5 (half way is -9 dB).
    // Drawn past the power of one full rank, all are turned down together.
    float drawn[kRanks];
    float power = 0.0f;
    for (int s = 0; s < kRanks; ++s) {
      const float position = param(kRankParam[s]);
      drawn[s] = position * std::sqrt(position);
      power += drawn[s] * drawn[s];
    }
    const float swell = param(kSwell);
    const float together = swell * swell * (power > 1.0f ? 1.0f / std::sqrt(power) : 1.0f);
    const float detune = param(kDetune) * kDetuneCents;
    for (int s = 0; s < kRanks; ++s) {
      gain_[s] = drawn[s] * together;
      ratio_[s] = kRatio[s] * kit::cents_to_ratio(detune * kDetuneShare[s]);
    }
    // Speak is the time to 90 %: 2.3 time constants.
    rise_ = 1.0f - std::exp(-2.3025851f * static_cast<float>(Stft::kHop) / (param(kSpeak) * 0.001f * sr));
    chiff_ = param(kChiff) * kChiffFull * kBreathGain;
    const float tone = param(kTone);
    if (tone != tone_seen_ || swell != swell_seen_) {
      tone_seen_ = tone;
      swell_seen_ = swell;
      build_tone(tone, swell, sr);
    }
  }

  // Gain in dB for a rank's partial at `hz`. Tone under the middle rolls the
  // ranks off above kPivotHz (up to kDarkSlopeDb an octave). Over the middle
  // it tilts them about kBrightHz (up to kBrightSlopeDb an octave): thinner
  // below by kBrightCutDb at most, brighter above by kBrightLiftDb at most.
  // Closing the shutters rolls them off above the pivot as well.
  static float tone_db(float hz, float tone, float swell) {
    const float dark = tone < 0.5f ? 1.0f - 2.0f * tone : 0.0f;
    const float bright = tone > 0.5f ? 2.0f * tone - 1.0f : 0.0f;
    const float above = hz > kPivotHz ? std::log2(hz / kPivotHz) : 0.0f;
    const float tilt =
        kit::clamp(kBrightSlopeDb * bright * std::log2(kit::max(hz, 1.0f) / kBrightHz), -kBrightCutDb, kBrightLiftDb);
    return kit::max(-96.0f, tilt - (kDarkSlopeDb * dark + kShutterSlopeDb * (1.0f - swell)) * above);
  }

  // tone_db by the bin a partial lands in, with the fade to nothing at the
  // top of hearing (and under the Nyquist frequency).
  void build_tone(float tone, float swell, float sr) {
    const float nyquist = 0.5f * sr;
    const float fade_from = kit::min(kTopFadeFromHz, kTopFadeFrom * nyquist);
    const float fade_to = kit::min(kTopFadeToHz, kTopFadeTo * nyquist);
    for (int k = 0; k < kBins; ++k) {
      const float hz = Stft::bin_to_hz(static_cast<float>(k), sr);
      const float x = kit::clamp((hz - fade_from) / (fade_to - fade_from), 0.0f, 1.0f);
      tone_[k] = std::exp(tone_db(hz, tone, swell) * 0.11512925f) * (1.0f - x * x * (3.0f - 2.0f * x));
    }
  }

  // One Hann-windowed sine of lobe height `amp` at `target` bins (not a
  // whole number), added to the frame. Its phase at the middle of the frame
  // is that of the unit vector (ur, ui) turned on by `turn` (in turns). With
  // the window w[n] = 0.5 - 0.5 cos(2πn/N), the frame A w[n] cos(2π t n/N + ψ)
  // has the spectrum
  //
  //   Y[k] = (A N/4) e^(j(ψ + π t)) (-1)^k h(k - t)  +  the same mirrored at -t,
  //
  // h being hann_lobe; ψ + π t is the sine's phase at the frame's middle
  // sample, which is the phase a bin of the analysis reads too (but for the
  // same (-1)^k). Phases are kept there and not at the frame's start: half a
  // frame away, a hair's error in the frequency would be a tenth of a
  // radian. Away from the bottom the mirror image is under -80 dB and is
  // left out, and the lobe comes from the table (the target rounded to 1/256
  // bin for the shape; the phase keeps the true frequency).
  void add_partial(float* re, float* im, float target, float ur, float ui, float turn, float amp) const {
    const float qr = amp * kit::SineTable::cos_lookup(turn);
    const float qi = amp * kit::SineTable::lookup(turn);
    float pr = ur * qr - ui * qi;
    float pi = ur * qi + ui * qr;
    if (target >= static_cast<float>(2 * kLobeHalf)) {
      int under = static_cast<int>(target);
      int step = static_cast<int>((target - static_cast<float>(under)) * kLobeSteps + 0.5f);
      if (step == kLobeSteps) {
        step = 0;
        ++under;
      }
      if (under & 1) {  // the table's signs count from the bin under the target
        pr = -pr;
        pi = -pi;
      }
      const float* lobe = lobe_[step];
      float* out_re = re + under - kLobeHalf + 1;
      float* out_im = im + under - kLobeHalf + 1;
      for (int j = 0; j < 2 * kLobeHalf; ++j) {
        out_re[j] += pr * lobe[j];
        out_im[j] += pi * lobe[j];
      }
      return;
    }
    // Near the bottom: the lobe and its mirror image, worked out as they are.
    const int top = static_cast<int>(target) + kLobeHalf;
    for (int k = 0; k <= top; ++k) {
      const float sign = (k & 1) ? -1.0f : 1.0f;
      const float own = static_cast<float>(hann_lobe(static_cast<double>(k) - target));
      const float mirror = static_cast<float>(hann_lobe(static_cast<double>(k) + target));
      re[k] += sign * pr * (own + mirror);
      im[k] += sign * pi * (own - mirror);
    }
  }

  // One frame of channel c: the spectrum in, the ranks' spectrum out.
  void frame(int c, float* re, float* im) {
    const uint32_t number = stft_[c].frame();
    if (c == 0 || number != snapshot_frame_) snapshot(number);
    Channel& channel = channel_[c];

    // Power per bin, its running sum (for the bands) and the strongest bin.
    double running = 0.0;
    float strongest = 0.0f;
    sum_[0] = 0.0;
    for (int k = 0; k < kBins; ++k) {
      const float power = re[k] * re[k] + im[k] * im[k];
      power_[k] = power;
      running += power;
      sum_[k + 1] = running;
      if (power > strongest) strongest = power;
    }

    // The followers: each bin's band level, come up to in Speak (and in the
    // chiff's own time), let go of in kReleaseSeconds.
    bool alive = false;
    for (int k = 0; k < kBins; ++k) {
      const float band = std::sqrt(static_cast<float>(sum_[band_to_[k]] - sum_[band_from_[k]]));
      band_[k] = band;
      float spoken = channel.spoken[k];
      float breathed = channel.breathed[k];
      spoken = band > spoken ? spoken + (band - spoken) * rise_ : kit::max(band, spoken * release_);
      breathed = band > breathed ? breathed + (band - breathed) * chiff_rise_ : kit::max(band, breathed * release_);
      if (spoken < kFollowerFloor) spoken = 0.0f;
      if (breathed < kFollowerFloor) breathed = 0.0f;
      channel.spoken[k] = spoken;
      channel.breathed[k] = breathed;
      alive = alive || spoken > 0.0f || breathed > 0.0f;
    }
    channel.alive = alive;

    // The partials: where, at what true frequency (in bins), how tall a lobe.
    const float threshold = kit::max(kFloorPower, strongest * kRelativePower);
    if (c == 0) {
      for (int k = 0; k < kBins; ++k) lead_place_[k] = -1.0f;
      lead_frame_ = number;
    }
    int peaks = 0;
    float heard = 0.0f;
    for (int k = kFirstBin; k < kBins - 1; ++k) {
      const float power = power_[k];
      if (!(power > threshold && power > power_[k - 1] && power >= power_[k + 1])) continue;
      // Read through a narrower window: X[k] - (X[k-1] + X[k+1]) / 2 is the
      // bin of the same frame under Hann squared, whose side lobes fall
      // twice as fast, so the other notes of a chord disturb the phase and
      // the size read here 18 dB less (from six bins away) than in X[k].
      const float zr = re[k] - 0.5f * (re[k - 1] + re[k + 1]);
      const float zi = im[k] - 0.5f * (im[k - 1] + im[k + 1]);
      const float lr = channel.last_re[k] - 0.5f * (channel.last_re[k - 1] + channel.last_re[k + 1]);
      const float li = channel.last_im[k] - 0.5f * (channel.last_im[k - 1] + channel.last_im[k + 1]);
      const float narrow = zr * zr + zi * zi;
      float place = static_cast<float>(k);
      bool measured = false;
      if (lr * lr + li * li > 1.0e-3f * narrow) {
        // The turn since the last frame, as the angle of Z × conj(Z_last).
        const float advance = kit::fast_atan2(zi * lr - zr * li, zr * lr + zi * li);
        place = Stft::advance_to_bin(k, advance);
        measured = std::fabs(place - static_cast<float>(k)) <= 1.0f;
      }
      if (!measured) {
        // Nothing to compare with (a note's first frame): from the taller of
        // the two bins beside it. For the Hann lobe, a neighbour r times as
        // tall as the peak puts the sine (2r - 1) / (r + 1) of a bin that way.
        const float below = std::sqrt(power_[k - 1]);
        const float above = std::sqrt(power_[k + 1]);
        const float r = kit::max(below, above) / std::sqrt(power);
        const float off = kit::clamp((2.0f * r - 1.0f) / (r + 1.0f), 0.0f, 0.5f);
        place = static_cast<float>(k) + (above > below ? off : -off);
      }
      const float size = std::sqrt(narrow);
      const float off = std::fabs(place - static_cast<float>(k)) * kLobeSteps;
      const int at = static_cast<int>(off);
      const float lobe = main_lobe_[at] + (main_lobe_[at + 1] - main_lobe_[at]) * (off - static_cast<float>(at));
      // The partial's own phase at the middle of the frame, as a unit
      // vector: the bin's, but for the sign that alternates from bin to bin.
      const float unit = ((k & 1) ? -1.0f : 1.0f) / size;
      peak_bin_[peaks] = static_cast<uint16_t>(k);
      peak_place_[peaks] = place;
      peak_size_[peaks] = size / lobe;
      peak_re_[peaks] = zr * unit;
      peak_im_[peaks] = zi * unit;
      if (c == 0) lead_place_[k] = place;
      heard += peak_size_[peaks] * peak_size_[peaks];
      ++peaks;
      ++k;  // the next bin is lower or level: not a peak
    }
    channel.input_level = std::sqrt(heard) * (1.0f / Stft::kFullScale);

    // This frame is the next one's "last"; the output starts empty.
    for (int k = 0; k < kBins; ++k) {
      channel.last_re[k] = re[k];
      channel.last_im[k] = im[k];
      re[k] = 0.0f;
      im[k] = 0.0f;
    }

    float sounding[kRanks] = {0.0f, 0.0f, 0.0f, 0.0f, 0.0f};
    bool breath = false;
    const float top = static_cast<float>(kBins - 2 - kLobeHalf);
    int from = 0;
    for (int i = 0; i < peaks; ++i) {
      const int k = peak_bin_[i];
      const int to = i + 1 < peaks ? (k + peak_bin_[i + 1] + 1) / 2 : kBins;
      const float band = band_[k];
      const float spoken = kit::min(1.0f, channel.spoken[k] / band);
      const float unbreathed = 1.0f - kit::min(1.0f, channel.breathed[k] / band);
      // The right channel's partial takes the left's turn where the left has
      // the same partial in this frame (see the note on stereo at the top).
      int lead = -1;
      if (c == 1 && lead_frame_ == number) {
        for (int b = k - 1; b <= k + 1 && lead < 0; ++b) {
          if (lead_place_[b] >= 0.0f && std::fabs(lead_place_[b] - peak_place_[i]) < kSamePlace) lead = b;
        }
      }
      for (int s = 0; s < kRanks; ++s) {
        if (!(gain_[s] > 0.0f)) continue;
        const float target = peak_place_[i] * ratio_[s];
        // The rank's partial keeps its source's phase and turns on against
        // it by the difference of their frequencies, one hop's worth a frame;
        // the peak's bins all take the new turn.
        float* phase = channel.phase[s];
        float turn;
        if (lead >= 0) {
          turn = channel_[0].phase[s][lead];
        } else {
          turn = phase[k] + (target - peak_place_[i]) * (1.0f / Stft::kOverlap);
          turn -= std::floor(turn);
        }
        for (int b = from; b < to; ++b) phase[b] = turn;
        if (!(target > low_from_ && target < top)) continue;
        const int landing = static_cast<int>(target + 0.5f);
        float full = peak_size_[i] * gain_[s] * tone_[landing];
        if (target < low_to_) full *= (target - low_from_) / (low_to_ - low_from_);
        if (!(full > 0.0f)) continue;
        const float amp = full * spoken;
        add_partial(re, im, target, peak_re_[i], peak_im_[i], turn, amp);
        sounding[s] += amp * amp;
        if (chiff_ > 0.0f && unbreathed > 0.0f) {
          const float air = full * unbreathed;
          breath_[landing] += air * air;
          breath = true;
        }
      }
      from = to;
    }
    for (int s = 0; s < kRanks; ++s) channel.level[s] = std::sqrt(sounding[s]) * (1.0f / Stft::kFullScale);
    if (breath) add_breath(re, im, number);
  }

  // The chiff: the power the ranks have not yet breathed in, spread evenly
  // over each bin's band and given a fresh phase. The angles are the same for
  // both channels (mono in stays mono) and for this frame whatever was slept
  // through.
  void add_breath(float* re, float* im, uint32_t number) {
    double running = 0.0;
    sum_[0] = 0.0;
    for (int k = 0; k < kBins; ++k) {
      running += breath_[k];
      sum_[k + 1] = running;
      breath_[k] = 0.0f;
    }
    kit::Rng rng;
    rng.seed(0x9E3779B9u ^ (number * 2654435761u));
    for (int warm = 0; warm < 4; ++warm) rng.next_u32();
    for (int k = 1; k < kBins - 1; ++k) {
      const uint32_t angle = rng.next_u32() >> 22;  // 0..kAngles-1
      const int band_from = band_from_[k];
      const int band_to = band_to_[k];
      const float power = static_cast<float>(sum_[band_to] - sum_[band_from]);
      if (!(power > 0.0f)) continue;
      const float size = chiff_ * std::sqrt(power / static_cast<float>(band_to - band_from));
      re[k] += size * unit_re_[angle];
      im[k] += size * unit_im_[angle];
    }
  }

  Stft stft_[2];
  Channel channel_[2];
  // Tables (init).
  float lobe_[kLobeSteps][2 * kLobeHalf] = {};
  float main_lobe_[kLobeSteps + 2] = {};
  float unit_re_[kAngles] = {};
  float unit_im_[kAngles] = {};
  uint16_t band_from_[kBins] = {};
  uint16_t band_to_[kBins] = {};
  float release_ = 0.0f;
  float chiff_rise_ = 1.0f;
  float low_from_ = 0.0f;
  float low_to_ = 1.0f;
  // The frame's settings (snapshot).
  uint32_t snapshot_frame_ = 0;
  float gain_[kRanks] = {};
  float ratio_[kRanks] = {};
  float rise_ = 1.0f;
  float chiff_ = 0.0f;
  float tone_[kBins] = {};
  float tone_seen_ = -1.0f;
  float swell_seen_ = -1.0f;
  // Work space of one frame.
  float power_[kBins] = {};
  float band_[kBins] = {};
  double sum_[kBins + 1] = {};
  float breath_[kBins] = {};
  uint16_t peak_bin_[kMaxPeaks] = {};
  float peak_place_[kMaxPeaks] = {};
  float peak_size_[kMaxPeaks] = {};
  float peak_re_[kMaxPeaks] = {};  // the partial's phase at the middle of the frame, a unit vector
  float peak_im_[kMaxPeaks] = {};
  // Where the left channel found its partials in frame lead_frame_ (-1: none in this bin).
  float lead_place_[kBins] = {};
  uint32_t lead_frame_ = 0;
  kit::Smoother mix_, unison_;
  kit::IdleGate idle_;
  // Samples in a row with nothing in and nothing out, counted up to kSilentSamples.
  int silent_ = 0;
};

}  // namespace livemix
