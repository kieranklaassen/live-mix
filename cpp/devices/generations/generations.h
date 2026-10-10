#pragma once

// Generations: a loop that records itself again through a small room on
// every pass. Play a sound into a room and record it, play the recording
// into the room and record that, and so on: after enough generations only
// the room's own resonances are left, and what was played has become slow
// ringing tones.
//
//   in ─► listen ─► limit ─► [pass 1] ─► × keep ─► [pass 2] ─► × keep × ahead ─(+)─► [the loop] ─┐
//                               │                     │                         ▲                │
//                               │                     │             keep × floor└────────────────┤
//   wet ◄──────────────────────(+)◄──────────────────(+)◄────────────────────────────────────────┘
//
//   each [lane]:  record head ─► first half ─► low cut ─► damping ─► room ─(+)─► second half ─► × level hold
//                                                                           ▲
//                                                                          hiss
//
// - A lane is two rings, each read exactly half of Length behind where it
//   is written, on whole samples, so the loop itself costs a pass nothing.
//   What a pass costs is the room, which stands half way round. The first
//   time a sound is heard again (one Length after it was played) it has been
//   through the room once: generation one.
// - The room is a direct path and eight resonances beside it (state-variable
//   band-passes, kit::Svf, so each sits on its frequency at every sample
//   rate): eight of the modes of a box whose sides are as 1 : 1.26 : 1.59.
//   Room slides them all together, from a lowest tone of 320 Hz (small) to
//   70 Hz (large). Resonance sets how far the tones stand over the sound
//   between them on one pass (0 to 18 dB) and how narrow they are (Q 6 to
//   24). Their gains are trimmed so that every tone passes at exactly the
//   same level (peak_gains): a tone that passed 0.1 dB under its neighbours
//   would be 6 dB under them sixty passes later.
// - Width detunes the room of the left side against the room of the right
//   (up to 0.9 % each way, a different amount for every tone), so a centred
//   sound drifts apart as the generations go by. At 0 the two are one room.
// - Damping is a one-pole low-pass in the loop (18 kHz down to 900 Hz; none
//   at 0), and the loop loses its lows under 12 Hz: the speaker and the
//   microphone. Both are paid again on every pass.
// - Hiss is noise added on every pass, at a set share of the level the lane
//   it is added to holds (so it dies with the loop, and the device can
//   sleep). It is scaled with the sample rate so that its density in the
//   audible band is the same at every rate. With Width at 0 the two sides
//   get the same noise.
// - The level hold. A room that passes its tones at 1 and everything else
//   under that takes energy away on every pass, more from a wide sound than
//   from a tone. So a lane keeps a second, silent tape beside the sound: the
//   energy each 64 samples of it ought to hold, which only Keep and what is
//   played change. The gain after the second half is the root of two sums
//   over exactly one loop: what that tape says went into the room, over what
//   the room made of it (between -12 and +18 dB, moving over 50 ms). Because
//   the room stands half a loop ahead of the gain, both sums are centred on
//   the sound the gain is applied to: it is set by the pass it acts on and
//   not by the one before. A pass changes the colour and not the level, as
//   someone re-recording would set the level once per generation; and
//   because the reckoning never hears the sound, an error in one pass is not
//   carried into the next.
// - Why there are lanes. One such gain is right for a loop that holds one
//   sound and wrong for a loop that is played into while it sounds. What a
//   new, wide sound lost in the room is far more than the old tones beside
//   it lost, so a gain that makes up the sum turns the tones up on every
//   pass for as long as someone plays, and leaves the new notes too quiet:
//   with one gain a tone that Keep 0.8 ought to let fall 1.9 dB a pass fell
//   0.3 dB under playing, and a note played into a sounding loop came back
//   up to 12 dB under the same note played into an empty one. So a sound's
//   first kStages passes each have a lane to themselves (rings, room, tape
//   and gain), where nothing older shares its gain, and only then does it
//   join the last lane, the loop, which goes round for good.
// - At the hand-over the last of those passes is run through the room once
//   more, unheard (the look ahead): what the loop's room will take from it
//   is known a pass early, and it is handed over that much the louder. So a
//   sound is held exactly for kStages + 1 passes, by when most of what the
//   room takes from it has been taken.
// - In the loop the gain may always give way, and gives back only as far as
//   the loop is of one age. Two more tapes count each sound's energy falling
//   by kYouth a pass and by its square; for sound of one age the second sum
//   is the square of the first, and the further it lies over that the more
//   ages are on the loop together (old tones under new sound) and the less
//   is given back. What is not given back is taken off the tape, so it is
//   not owed later. A loop left alone is of one age and is held to Keep; a
//   loop played into loses what the room takes from its old sound, which by
//   then is little.
// - The ceiling. Everything gives way over a level of kOver times the
//   loudest loop of playing the loop still holds (which falls by Keep a
//   pass, as what that playing left does) and over 0.3 rms at the most. So a
//   loop that is played into without end settles near the level of the
//   playing, loud or quiet, instead of piling up. The level it is held to is
//   the louder of what the lanes ought to add up to and what they do add up
//   to as they sound: held notes come round in step and stand on each other.
//   The record heads end in kit::soft_clip. Under -100 dBFS a floor closes
//   the loop, so a fading loop ends.
// - Keep is what is recorded again of each pass: at 1 the loop holds for as
//   long as it is left, while its colour goes on narrowing to the room.
// - Listen Off stops new playing from reaching the loop. Length changes by a
//   50 ms crossfade from the old read points to the new (no pitch bend).
// - Sleep. On the sample where a whole loop of what every ring holds is
//   under -140 dBFS the loop is declared empty (what lies further back on
//   the rings is forgotten), and on the first sample of sound after that the
//   device starts afresh: an empty loop, its filters at rest, its noise from
//   the start, every knob where it stands. Both are counted in samples, so
//   they fall on the same sample at every block size; whether the device
//   also stopped working in between, which goes by blocks, changes nothing.
//
// Storage: three lanes of two stereo rings of 6 s at 96 kHz (12 x 576,064
// floats, 27.7 MB) and twenty rings of block energies (20 x 36,100 floats,
// 2.9 MB).

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Generations : public kit::DeviceBase<generations::kNumParams> {
 public:
  static constexpr int kModes = 8;
  // The room's tones as multiples of its lowest: modes (1,0,0), (0,0,1),
  // (0,1,1), (1,2,0), (0,0,2), (0,2,2), (0,1,3) and (0,0,4) of a box with
  // sides 1.59 : 1.26 : 1.
  static constexpr float kModeRatio[kModes] = {1.0f,  1.59f, 2.03f,  2.715f,
                                               3.18f, 4.06f, 4.934f, 6.36f};
  // How far Width moves each tone, down on the left and up on the right.
  static constexpr float kModeDetune[kModes] = {0.004f, -0.006f, 0.008f, -0.005f,
                                                0.007f, -0.009f, 0.006f, -0.008f};
  // The lowest tone of the smallest and of the largest room.
  static constexpr float kSmallRoomHz = 320.0f;
  static constexpr float kLargeRoomHz = 70.0f;
  // Resonance 1: the tones stand this far over the sound between them...
  static constexpr float kContrastDb = 18.0f;
  // ...and are this narrow; at Resonance 0 this wide.
  static constexpr float kNarrowQ = 24.0f;
  static constexpr float kWideQ = 6.0f;
  // Damping 0 (where there is no filter at all) to 1.
  static constexpr float kOpenHz = 18000.0f;
  static constexpr float kDampedHz = 900.0f;
  static constexpr float kLowCutHz = 12.0f;
  // Noise against its lane's level at Hiss 1 (peak; its rms is 0.58 of it).
  static constexpr float kHissMost = 0.35f;
  // The level hold: how far the gain after the room may go and how fast it
  // moves.
  static constexpr float kLeastHold = 0.25f;
  static constexpr float kMostHold = 8.0f;
  static constexpr float kHoldSeconds = 0.05f;
  // The ceiling: everything on the loop gives way over this level (rms over
  // a loop), and before that over kOver times the loudest loop of playing
  // that is still on it.
  static constexpr float kCeiling = 0.3f;
  static constexpr float kOver = 2.0f;
  // How fast a sound on the loop stops counting as newly come, a pass, and
  // how mixed in age the loop may be before its hold stands back altogether.
  static constexpr float kYouth = 0.8f;
  static constexpr float kOneAge = 0.004f;
  static constexpr float kMixed = 0.014f;
  // The first passes of a sound each have a lane of their own; the last lane is the loop.
  static constexpr int kStages = 2;
  static constexpr int kLanes = kStages + 1;
  static constexpr int kLast = kLanes - 1;
  // Mean squares: under kQuiet the hold lets go, under kFloor the loop closes.
  static constexpr float kQuiet = 1.0e-8f;
  static constexpr float kFloor = 1.0e-10f;

  void init(float sample_rate) {
    using namespace generations;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int lane = 0; lane < kLanes; ++lane) {
      for (int c = 0; c < 2; ++c) {
        for (int i = 0; i < kRingFrames; ++i) {
          loop_[lane][c][i] = 0.0f;
          aged_[lane][c][i] = 0.0f;
        }
        for (int i = 0; i < kBlocks; ++i) {
          ought_[lane][c][i] = 0.0f;
          made_[lane][c][i] = 0.0f;
        }
      }
    }
    head_ = 0;
    block_head_ = 0;
    keep_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    listen_.set_time(0.02f, sr);
    slow_ = 1.0f - std::exp(-static_cast<float>(kControlPeriod) / (kSlowSeconds * sr));
    hold_coeff_ = 1.0f - std::exp(-static_cast<float>(kControlPeriod) / (kHoldSeconds * sr));
    hiss_rate_ = std::sqrt(sr / 48000.0f);
    fade_step_ = 1.0f / kit::max(1.0f, kFadeSeconds * sr);
    for (int lane = 0; lane < kLanes; ++lane) {
      for (int c = 0; c < 2; ++c) low_cut_[lane][c].set_cutoff(kLowCutHz, sr);
    }
    for (int c = 0; c < 2; ++c) {
      count_cut_[c].set_cutoff(kLowCutHz, sr);
      ahead_low_cut_[c].set_cutoff(kLowCutHz, sr);
      for (int i = 0; i < kBlocks; ++i) {
        heard_[c][i] = 0.0f;
        ahead_made_[c][i] = 0.0f;
        young_[c][i] = 0.0f;
        younger_[c][i] = 0.0f;
      }
    }
    asleep_ = true;
    empty_ = true;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    restart();
    empty_ = true;
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for the display:
  // 0, where the record head is in the loop, 0 to 1 (-1 while the loop is empty);
  // 1, the level the loop holds as it comes back, the louder side's rms
  //    over the whole loop;
  // 2, what the room took from all that is sounding, the larger side's, as
  //    the gain that makes it up: the root of what the lanes ought to hold
  //    over what the room made of them (1 while the loop is empty).
  float meter(int index) const {
    const bool rests = asleep_ || empty_;
    if (index == 0) {
      return rests ? -1.0f : static_cast<float>(turn_) / static_cast<float>(first_ + second_);
    }
    if (index == 1) return rests ? 0.0f : kit::max(level_[0], level_[1]);
    if (index == 2) return rests ? 1.0f : kit::max(taken_[0], taken_[1]);
    return 0.0f;
  }

  void process(int frames) {
    using namespace generations;
    frames = begin_block(frames);
    const bool excited = input_present(frames);
    if (asleep_) {
      if (!excited) {
        silence_output(frames);
        return;
      }
      asleep_ = false;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      // The first sound into an empty loop: start afresh, on this sample.
      if (empty_ && (in[0] != 0.0f || in[1] != 0.0f)) restart();
      if (clock_.tick()) control();

      const float keep = keep_.next();
      const float listen = listen_.next();
      const float direct = direct_.next();
      // The two sides get the same noise at Width 0 and their own at 1.
      float noise[kLanes][2];
      for (int lane = 0; lane < kLanes; ++lane) {
        const float noise_a = rng_[lane][0].bipolar();
        const float noise_b = rng_[lane][1].bipolar();
        noise[lane][0] = noise_a;
        noise[lane][1] = hiss_same_ * noise_a + hiss_other_ * noise_b;
      }
      float wet[2];
      for (int c = 0; c < 2; ++c) {
        // Input is taken as it comes, so what is not a sound (not a number,
        // or far past full scale) is kept off the loop.
        const float played =
            listen * (in[c] == in[c] ? kit::clamp(in[c], -kMostInput, kMostInput) : 0.0f);
        // The record head lands on full scale, so no more than that is reckoned
        // with, and only with what the loop's low cut lets through: a held
        // offset is not sound, and the edges it leaves are not owed its energy.
        const float counted = count_cut_[c].process(kit::clamp(played, -1.0f, 1.0f));
        played_sum_[c] += counted * counted;
        const float give = give_[c].next();
        const float floor = floor_[c].next();
        float sum = 0.0f;
        float before = 0.0f;
        float sounding = 0.0f;
        for (int lane = 0; lane < kLanes; ++lane) {
          float back = read(loop_[lane][c], first_);
          float aged = read(aged_[lane][c], second_);
          if (fading_) {
            back += (read(loop_[lane][c], next_first_) - back) * fade_;
            aged += (read(aged_[lane][c], next_second_) - aged) * fade_;
          }
          // Half way round: the speaker and the microphone, then the room.
          const float heard = damping_[lane][c].lowpass(low_cut_[lane][c].process(back));
          float room = direct * heard;
          for (int k = 0; k < kModes; ++k) room += gain_[c][k] * mode_[lane][c][k].bandpass(heard);
          room = flush_denormal(room + hiss_[lane][c].next() * noise[lane][c]);
          made_sum_[lane][c] += room * room;
          sounding += room * hold_[lane][c].value;
          aged_[lane][c][head_] = room;
          const float out = aged * hold_[lane][c].next() * give;
          sum += out;
          if (lane == kLast - 1) {
            // The last pass before the loop is run through the room once
            // more, unheard: what the loop's room will take from it is known
            // a pass ahead, and it is handed over that much the louder.
            const float next = ahead_damping_[c].lowpass(ahead_low_cut_[c].process(room));
            float ahead = direct * next;
            for (int k = 0; k < kModes; ++k) ahead += gain_[c][k] * ahead_mode_[c][k].bandpass(next);
            ahead_sum_[c] += ahead * ahead;
          }

          // The record head of this lane: what was played into the first,
          // the pass before into the next, and into the loop its own as well.
          float written;
          if (lane == 0) {
            written = kit::soft_clip(played);
          } else if (lane < kLast) {
            written = keep * before;
          } else {
            written = keep * before * ahead_[c].next() + kit::soft_clip(keep * floor * out);
          }
          written = flush_denormal(written);
          loop_[lane][c][head_] = written;
          before = out;
          // The room's half is held before the gain, which can be as much as kMostHold.
          if (written > kit::IdleGate::kFloor || written < -kit::IdleGate::kFloor ||
              room > kBlank || room < -kBlank) {
            blank_ = 0;
          }
        }
        heard_sum_[c] += sounding * sounding;
        wet[c] = sum;
      }
      if (++head_ == kRingFrames) head_ = 0;
      if (valid_ < kRingFrames) ++valid_;
      if (blank_ < kLongEnough) ++blank_;
      if (++turn_ >= first_ + second_) turn_ = 0;
      if (fading_) {
        fade_ += fade_step_;
        if (fade_ >= 1.0f) {
          first_ = next_first_;
          second_ = next_second_;
          fading_ = false;
          if (turn_ >= first_ + second_) turn_ = 0;
          resum();
          if (wanted_ != first_ + second_) start_fade();
        }
      }
      // Everything the read points can reach is blank: the loop is empty.
      if (!empty_ && blank_ > static_cast<long>(reach()) + 64) forget();

      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        // Equal power, and at the two ends exactly one sound and none of the other.
        dry_gain_ = mix < 1.0f ? kit::SineTable::cos_lookup(0.25f * mix) : 0.0f;
        wet_gain_ = mix > 0.0f ? kit::SineTable::lookup(0.25f * mix) : 0.0f;
      }
      out_left_[i] = in[0] * dry_gain_ + wet[0] * wet_gain_;
      out_right_[i] = in[1] * dry_gain_ + wet[1] * wet_gain_;
    }
    if (!excited && empty_ && output_peak(frames) <= kit::IdleGate::kFloor) asleep_ = true;
  }

 private:
  // Each half of the loop: 6 s at 96 kHz, and a little over.
  static constexpr int kRingFrames = 576064;
  static constexpr int kMostLoop = 2 * (kRingFrames - 32);
  static constexpr float kBlank = kit::IdleGate::kFloor / kMostHold;
  // The level hold reckons in blocks of this many samples, and keeps two
  // loops' worth of them.
  static constexpr int kBlockFrames = 64;
  static constexpr int kBlocks = 36100;
  static constexpr long kLongEnough = 1L << 30;
  static constexpr int kControlPeriod = 16;
  static constexpr int kControlsPerBlock = kBlockFrames / kControlPeriod;
  // Room, Resonance, Width, Damping and Hiss glide over this, on the control clock.
  static constexpr float kSlowSeconds = 0.02f;
  static constexpr float kFadeSeconds = 0.05f;
  static constexpr float kMostInput = 4.0f;
  static constexpr int kTrimRounds = 3;

  // A value on its way to a target, moved on the control clock.
  struct Slow {
    float value = 0.0f;
    float target = 0.0f;
    void set(float v, bool glide) {
      target = v;
      if (!glide) value = v;
    }
    // True while it moves.
    bool step(float coeff) {
      if (value == target) return false;
      const float delta = target - value;
      value = (delta > -1.0e-5f && delta < 1.0e-5f) ? target : value + delta * coeff;
      return true;
    }
  };

  // A value worked out on the control clock and joined by straight lines.
  struct Line {
    float value = 0.0f;
    float step = 0.0f;
    void aim(float target, bool jump) {
      if (jump) value = target;
      step = (target - value) * (1.0f / kControlPeriod);
    }
    float next() {
      const float now = value;
      value += step;
      return now;
    }
  };

  // What a ring held `delay` samples ago; nothing from before the device woke.
  float read(const float* ring, int delay) const {
    if (delay > valid_) return 0.0f;
    int at = head_ - delay;
    if (at < 0) at += kRingFrames;
    return ring[at];
  }

  // The block energies written `back` blocks ago (1 is the newest); nothing
  // from before the device woke.
  float block(const float* ring, int back) const {
    if (back > blocks_) return 0.0f;
    int at = block_head_ - back;
    if (at < 0) at += kBlocks;
    return ring[at];
  }

  // The longest way round the loop that is being read or is about to be.
  int reach() const {
    int most = first_ + second_ > wanted_ ? first_ + second_ : wanted_;
    if (fading_ && next_first_ + next_second_ > most) most = next_first_ + next_second_;
    return most;
  }

  // The loop is empty from here on: nothing written before now is read again.
  void forget() {
    empty_ = true;
    valid_ = 0;
    blocks_ = 0;
    for (int c = 0; c < 2; ++c) {
      played_sum_[c] = 0.0f;
      for (int lane = 0; lane < kLanes; ++lane) {
        made_sum_[lane][c] = 0.0f;
        ought_loop_[lane][c] = 0.0;
        made_loop_[lane][c] = 0.0;
        lane_level_[lane][c] = 0.0f;
        hold_target_[lane][c] = 1.0f;
      }
      ahead_sum_[c] = 0.0f;
      heard_sum_[c] = 0.0f;
      heard_loop_[c] = 0.0;
      ahead_loop_[c] = 0.0;
      young_loop_[c] = 0.0;
      younger_loop_[c] = 0.0;
      ahead_target_[c] = 1.0f;
      level_[c] = 0.0f;
      loudest_[c] = 0.0f;
      taken_[c] = 1.0f;
      give_target_[c] = 1.0f;
      floor_target_[c] = 0.0f;
    }
  }

  void start_fade() {
    next_first_ = wanted_ / 2;
    next_second_ = wanted_ - next_first_;
    fade_ = 0.0f;
    fading_ = true;
  }

  // The two sums of the level hold over one loop as it is now long: what the
  // room made in the last loop of blocks, and what the loop ought to have
  // held where the room took those blocks from, half a loop before.
  void resum() {
    loop_blocks_ =
        kit::clamp_int((first_ + second_ + kBlockFrames / 2) / kBlockFrames, 1, kBlocks / 2 - 2);
    half_blocks_ = kit::clamp_int((first_ + kBlockFrames / 2) / kBlockFrames, 1, loop_blocks_);
    youth_step_ = std::pow(static_cast<double>(kYouth), 1.0 / loop_blocks_);
    for (int lane = 0; lane < kLanes; ++lane) {
      for (int c = 0; c < 2; ++c) {
        double made = 0.0;
        double ought = 0.0;
        for (int back = 1; back <= loop_blocks_; ++back) {
          made += block(made_[lane][c], back);
          ought += block(ought_[lane][c], back + half_blocks_);
        }
        made_loop_[lane][c] = made;
        ought_loop_[lane][c] = ought;
      }
    }
    for (int c = 0; c < 2; ++c) {
      double ahead = 0.0, young = 0.0, younger = 0.0, heard = 0.0;
      for (int back = loop_blocks_; back >= 1; --back) {
        ahead += block(ahead_made_[c], back);
        heard += block(heard_[c], back);
        young = young * youth_step_ + block(young_[c], back + half_blocks_);
        younger = younger * youth_step_ * youth_step_ + block(younger_[c], back + half_blocks_);
      }
      ahead_loop_[c] = ahead;
      heard_loop_[c] = heard;
      young_loop_[c] = young;
      younger_loop_[c] = younger;
    }
    fall_ = -1.0f;
  }

  // The reckoning of the level hold, once a block: the energy tape moves on
  // a block, the two sums with it, and the gains for the next block follow.
  void reckon() {
    const float keep = keep_.value;
    const double per_loop = static_cast<double>(loop_blocks_) * kBlockFrames;
    const double quiet = kQuiet * per_loop;
    // What the loudest loop of playing falls by in a block: Keep a loop, as what it left does.
    if (keep != fall_keep_ || fall_ < 0.0f) {
      fall_keep_ = keep;
      fall_ = keep > 0.0f ? std::pow(keep * keep, 1.0f / static_cast<float>(loop_blocks_)) : 0.0f;
    }
    for (int c = 0; c < 2; ++c) {
      double ought_all = 0.0;
      double made_all = 0.0;
      for (int lane = 0; lane < kLanes; ++lane) {
        // The block the room took its sound from, half a loop back, joins the
        // sum of what ought to be there; the block the room made joins the other.
        double& ought = ought_loop_[lane][c];
        double& made = made_loop_[lane][c];
        ought += static_cast<double>(block(ought_[lane][c], half_blocks_)) -
                 block(ought_[lane][c], half_blocks_ + loop_blocks_);
        made += static_cast<double>(made_sum_[lane][c]) - block(made_[lane][c], loop_blocks_);
        if (ought < 0.0) ought = 0.0;
        if (made < 0.0) made = 0.0;
        ought_all += ought;
        made_all += made;
        float hold = static_cast<float>(std::sqrt((ought + quiet) / (made + quiet)));
        hold = kit::clamp(hold, kLeastHold, kMostHold);
        hold_target_[lane][c] = hold;
        lane_level_[lane][c] = static_cast<float>(std::sqrt(ought / per_loop));
      }
      // What the loop's room will take from the pass that is handed to it.
      ahead_loop_[c] += static_cast<double>(ahead_sum_[c]) - block(ahead_made_[c], loop_blocks_);
      if (ahead_loop_[c] < 0.0) ahead_loop_[c] = 0.0;
      ahead_target_[c] = kit::clamp(
          static_cast<float>(std::sqrt((made_loop_[kLast - 1][c] + quiet) / (ahead_loop_[c] + quiet))),
          1.0f, kMostHold);
      // How mixed in age the loop is. Each sound's energy is counted twice,
      // falling by kYouth a pass and by its square: for sound of one age the
      // second count is the square of the first, and the more ages there are
      // on the loop the further it lies over that.
      young_loop_[c] = young_loop_[c] * youth_step_ + block(young_[c], half_blocks_) -
                       static_cast<double>(kYouth) * block(young_[c], half_blocks_ + loop_blocks_);
      younger_loop_[c] = younger_loop_[c] * youth_step_ * youth_step_ + block(younger_[c], half_blocks_) -
                         static_cast<double>(kYouth * kYouth) *
                             block(younger_[c], half_blocks_ + loop_blocks_);
      if (young_loop_[c] < 0.0) young_loop_[c] = 0.0;
      if (younger_loop_[c] < 0.0) younger_loop_[c] = 0.0;
      float again_gain = 1.0f;
      {
        const double all = ought_loop_[kLast][c];
        float mixed = 0.0f;
        if (all > quiet) {
          const float young = static_cast<float>(young_loop_[c] / all);
          const float younger = static_cast<float>(younger_loop_[c] / all);
          mixed = kit::max(0.0f, younger - young * young);
        }
        const float open = kit::clamp((kMixed - mixed) / (kMixed - kOneAge), 0.0f, 1.0f);
        const float full = hold_target_[kLast][c];
        // Giving way is always let; giving back only as far as the loop is of one age.
        const float held = full > 1.0f ? 1.0f + open * (full - 1.0f) : full;
        hold_target_[kLast][c] = held;
        // What was not given back is not owed: the loop ought to hold what it does.
        again_gain = held / full;
      }
      // The ceiling: the level over which everything on the loop gives way,
      // kOver times the loudest loop of playing it still holds, and kCeiling at the most.
      const float playing = static_cast<float>(ought_loop_[0][c] / per_loop);
      loudest_[c] = kit::max(playing, loudest_[c] * fall_);
      const float ceiling = kit::min(kCeiling, kOver * std::sqrt(loudest_[c]));
      // The level it is held to is the louder of two: what the passes on
      // the loop ought to add up to, and what they do add up to as they
      // sound together (held notes come round in step and stand on each other).
      heard_loop_[c] += static_cast<double>(heard_sum_[c]) - block(heard_[c], loop_blocks_);
      if (heard_loop_[c] < 0.0) heard_loop_[c] = 0.0;
      const float level =
          static_cast<float>(std::sqrt((ought_all > heard_loop_[c] ? ought_all : heard_loop_[c]) / per_loop));
      const float give = level > ceiling ? ceiling / level : 1.0f;
      const double old = ought_loop_[kLast][c];
      const float floor = static_cast<float>(old / (old + kFloor * per_loop));
      level_[c] = level * give;
      taken_[c] = kit::clamp(static_cast<float>(std::sqrt((ought_all + quiet) / (made_all + quiet))),
                             kLeastHold, kMostHold);
      give_target_[c] = give;
      floor_target_[c] = floor;

      // What this block ought to hold in each lane: what was played in the
      // first, Keep of the pass before in the next, and in the loop Keep of
      // what it held a loop ago as well.
      const float kept = keep * give;
      for (int lane = kLast; lane >= 0; --lane) {
        float ought = lane == 0 ? played_sum_[c]
                                : kept * kept * block(ought_[lane - 1][c], loop_blocks_);
        if (lane == kLast) {
          const float again = kept * floor * again_gain;
          const float aged = again * again;
          young_[c][block_head_] = ought + kYouth * aged * block(young_[c], loop_blocks_);
          younger_[c][block_head_] = ought + kYouth * kYouth * aged * block(younger_[c], loop_blocks_);
          ought += aged * block(ought_[lane][c], loop_blocks_);
        }
        ought_[lane][c][block_head_] = ought;
        made_[lane][c][block_head_] = made_sum_[lane][c];
        made_sum_[lane][c] = 0.0f;
      }
      ahead_made_[c][block_head_] = ahead_sum_[c];
      ahead_sum_[c] = 0.0f;
      heard_[c][block_head_] = heard_sum_[c];
      heard_sum_[c] = 0.0f;
      played_sum_[c] = 0.0f;
    }
    if (++block_head_ == kBlocks) block_head_ = 0;
    if (blocks_ < kBlocks) ++blocks_;
  }

  // An empty loop, the room at rest, every setting where its knob is (init and wake).
  void restart() {
    forget();
    empty_ = false;
    blank_ = 0;
    turn_ = 0;
    quarter_ = 0;
    settle_length();
    fade_ = 0.0f;
    for (int lane = 0; lane < kLanes; ++lane) {
      for (int c = 0; c < 2; ++c) {
        low_cut_[lane][c].reset();
        damping_[lane][c].reset();
        for (kit::Svf& mode : mode_[lane][c]) mode.reset();
        hold_now_[lane][c] = 1.0f;
      }
      // Each lane has noise of its own.
      rng_[lane][0].seed(0x6A09E667u + 0x9E3779B9u * static_cast<uint32_t>(lane));
      rng_[lane][1].seed(0xBB67AE85u + 0x85EBCA6Bu * static_cast<uint32_t>(lane));
    }
    for (int c = 0; c < 2; ++c) {
      count_cut_[c].reset();
      ahead_low_cut_[c].reset();
      ahead_damping_[c].reset();
      for (kit::Svf& mode : ahead_mode_[c]) mode.reset();
      ahead_now_[c] = 1.0f;
    }
    resum();
    keep_.snap(keep_.target);
    listen_.snap(listen_.target);
    mix_.snap(mix_.target);
    mix_seen_ = -1.0f;
    room_.value = room_.target;
    resonance_.value = resonance_.target;
    width_.value = width_.target;
    damp_.value = damp_.target;
    hiss_amount_.value = hiss_amount_.target;
    clock_.reset(kControlPeriod);
    settled_ = false;
  }

  // The read points where Length has them, with no crossfade.
  void settle_length() {
    first_ = wanted_ / 2;
    second_ = wanted_ - first_;
    next_first_ = first_;
    next_second_ = second_;
    fading_ = false;
  }

  // The room's lowest tone for a Room setting.
  float room_hz(float room) const {
    return kSmallRoomHz * std::pow(kLargeRoomHz / kSmallRoomHz, room);
  }

  // Where the room's sixteen filters go, and the gain of each tone.
  void tune() {
    const float sr = sample_rate();
    const float low = room_hz(room_.value);
    const float resonance = resonance_.value;
    const float q = kWideQ + (kNarrowQ - kWideQ) * resonance;
    direct_target_ = std::pow(10.0f, -kContrastDb * resonance * 0.05f);
    for (int c = 0; c < 2; ++c) {
      const float side = c == 0 ? -1.0f : 1.0f;
      // With no Width the two sides are one room: the second takes the first's.
      if (c == 1 && width_.value == 0.0f) {
        for (int k = 0; k < kModes; ++k) {
          tuned(mode_[0][1][k], mode_[0][0][k]);
          gain_[1][k] = gain_[0][k];
        }
        break;
      }
      for (int k = 0; k < kModes; ++k) {
        mode_[0][c][k].set(low * kModeRatio[k] * (1.0f + side * width_.value * kModeDetune[k]), q, sr);
      }
      peak_gains(c, direct_target_);
    }
    // Every lane goes through the same room.
    for (int lane = 1; lane < kLanes; ++lane) {
      for (int c = 0; c < 2; ++c) {
        for (int k = 0; k < kModes; ++k) tuned(mode_[lane][c][k], mode_[0][c][k]);
      }
    }
    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k < kModes; ++k) tuned(ahead_mode_[c][k], mode_[0][c][k]);
    }
    const float angle = width_.value * kit::kHalfPi;
    hiss_same_ = std::cos(angle);
    hiss_other_ = std::sin(angle);
  }

  // One filter tuned as another is, its state left alone.
  static void tuned(kit::Svf& to, const kit::Svf& from) {
    to.g = from.g;
    to.k = from.k;
    to.a1 = from.a1;
    to.a2 = from.a2;
    to.a3 = from.a3;
  }

  // The gain of each tone so that the room passes every one of them at
  // exactly 1. A tone stands on the direct path and on the skirts of the
  // other seven, which are not the same for each, so the gains are found by
  // going round: each in turn is given what its tone lacks of 1. A band-pass
  // adds its own gain in phase at its own tone, so what is lacking is what
  // to add; three rounds leave every tone within 0.001 dB of 1 at any setting.
  //
  // A band-pass tuned to g (the tangent of half its angle) answers a
  // frequency at tangent u with (q² + j·q·p) / (p² + q²), p = 1 - (u/g)²,
  // q = (u/g) / Q.
  void peak_gains(int c, float direct) {
    // What each band-pass passes at each tone: worked out once, and the
    // rounds are sums over it.
    float inverse[kModes];
    float real[kModes][kModes];
    float imaginary[kModes][kModes];
    const kit::Svf* mode = mode_[0][c];
    for (int k = 0; k < kModes; ++k) inverse[k] = 1.0f / mode[k].g;
    for (int j = 0; j < kModes; ++j) {
      for (int k = 0; k < kModes; ++k) {
        const float x = mode[j].g * inverse[k];
        const float p = 1.0f - x * x;
        const float q = x * mode[k].k;
        const float scale = q / (p * p + q * q);
        real[j][k] = q * scale;
        imaginary[j][k] = p * scale;
      }
    }
    for (int k = 0; k < kModes; ++k) gain_[c][k] = 1.0f - direct;
    for (int round = 0; round < kTrimRounds; ++round) {
      for (int j = 0; j < kModes; ++j) {
        float re = direct;
        float im = 0.0f;
        for (int k = 0; k < kModes; ++k) {
          re += gain_[c][k] * real[j][k];
          im += gain_[c][k] * imaginary[j][k];
        }
        gain_[c][j] += 1.0f - std::sqrt(re * re + im * im);
      }
    }
  }

  void control() {
    using namespace generations;
    const float sr = sample_rate();
    const bool jump = !settled_;
    if (quarter_ == kControlsPerBlock) {
      reckon();
      quarter_ = 0;
    }
    ++quarter_;

    bool retune = jump;
    retune |= room_.step(slow_);
    retune |= resonance_.step(slow_);
    retune |= width_.step(slow_);
    if (retune) tune();
    direct_.aim(direct_target_, jump);
    if (damp_.step(slow_) || jump) {
      // Damping 0 is no filter at all.
      if (damp_.value > 0.0f) {
        damping_[0][0].set_cutoff(kOpenHz * std::pow(kDampedHz / kOpenHz, damp_.value), sr);
      } else {
        damping_[0][0].a = 0.0f;
      }
      for (int lane = 0; lane < kLanes; ++lane) {
        damping_[lane][0].a = damping_[0][0].a;
        damping_[lane][1].a = damping_[0][0].a;
      }
      ahead_damping_[0].a = damping_[0][0].a;
      ahead_damping_[1].a = damping_[0][0].a;
    }
    hiss_amount_.step(slow_);
    const float hiss = kHissMost * hiss_amount_.value * hiss_amount_.value * hiss_rate_;
    for (int c = 0; c < 2; ++c) {
      for (int lane = 0; lane < kLanes; ++lane) {
        hold_now_[lane][c] += (hold_target_[lane][c] - hold_now_[lane][c]) * hold_coeff_;
        hold_[lane][c].aim(hold_now_[lane][c], jump);
        hiss_[lane][c].aim(hiss * lane_level_[lane][c] * give_target_[c], jump);
      }
      ahead_now_[c] += (ahead_target_[c] - ahead_now_[c]) * hold_coeff_;
      ahead_[c].aim(ahead_now_[c], jump);
      give_[c].aim(give_target_[c], jump);
      floor_[c].aim(floor_target_[c], jump);
    }
    settled_ = true;
  }

  void apply(int id) {
    using namespace generations;
    const float value = param(id);
    // Nothing sounds while the loop is empty, so a value set then has nothing to glide from.
    const bool glide = primed() && !empty_;
    switch (id) {
      case kLength: {
        wanted_ = kit::clamp_int(static_cast<int>(value * sample_rate() + 0.5f), 128, kMostLoop);
        if (!glide) {
          settle_length();
        } else if (!fading_ && wanted_ != first_ + second_) {
          start_fade();
        }
        break;
      }
      case kRoom:
        room_.set(value, glide);
        break;
      case kResonance:
        resonance_.set(value, glide);
        break;
      case kKeep:
        keep_.set(value, glide);
        break;
      case kDamping:
        damp_.set(value, glide);
        break;
      case kHiss:
        hiss_amount_.set(value, glide);
        break;
      case kWidth:
        width_.set(value, glide);
        break;
      case kListen:
        listen_.set(value < 0.5f ? 1.0f : 0.0f, glide);
        break;
      case kMix:
        mix_.set(value, glide);
        break;
      default:
        break;
    }
  }

  // Each lane in its two halves: what its record head wrote, and what the
  // room made of it half a loop later. All are written at head_.
  float loop_[kLanes][2][kRingFrames] = {};
  float aged_[kLanes][2][kRingFrames] = {};
  int head_ = 0;
  // How much of the rings has been written since the device woke.
  int valid_ = 0;
  // How far behind the head each half is read, and where they are going.
  int first_ = 24000, second_ = 24000;
  int next_first_ = 24000, next_second_ = 24000;
  int wanted_ = 48000;
  bool fading_ = false;
  float fade_ = 0.0f;
  float fade_step_ = 0.0f;
  // Where the record head is in the loop, in samples.
  int turn_ = 0;

  // The level hold: per block, the energy each lane ought to hold and the
  // energy its room made; the sums of each over one loop.
  float ought_[kLanes][2][kBlocks] = {};
  float made_[kLanes][2][kBlocks] = {};
  int block_head_ = 0;
  int blocks_ = 0;
  int loop_blocks_ = 1;
  int half_blocks_ = 1;
  int quarter_ = 0;
  float played_sum_[2] = {0.0f, 0.0f};
  float made_sum_[kLanes][2] = {};
  double ought_loop_[kLanes][2] = {};
  double made_loop_[kLanes][2] = {};
  float lane_level_[kLanes][2] = {};
  float hold_target_[kLanes][2] = {};
  float hold_now_[kLanes][2] = {};
  float level_[2] = {0.0f, 0.0f};
  float taken_[2] = {1.0f, 1.0f};
  float loudest_[2] = {0.0f, 0.0f};
  float fall_ = -1.0f;
  float fall_keep_ = -1.0f;
  float give_target_[2] = {1.0f, 1.0f};
  float floor_target_[2] = {0.0f, 0.0f};
  float hold_coeff_ = 0.0f;
  Line hold_[kLanes][2], hiss_[kLanes][2], give_[2], floor_[2];

  // The look ahead at the hand-over (its room, and what that room made, by
  // blocks), what the lanes add up to as they sound (for the ceiling), and
  // the two counts of how new the loop's sound is.
  float ahead_made_[2][kBlocks] = {};
  float heard_[2][kBlocks] = {};
  float heard_sum_[2] = {0.0f, 0.0f};
  double heard_loop_[2] = {0.0, 0.0};
  float young_[2][kBlocks] = {};
  float younger_[2][kBlocks] = {};
  float ahead_sum_[2] = {0.0f, 0.0f};
  double ahead_loop_[2] = {0.0, 0.0};
  double young_loop_[2] = {0.0, 0.0};
  double younger_loop_[2] = {0.0, 0.0};
  float ahead_target_[2] = {1.0f, 1.0f};
  float ahead_now_[2] = {1.0f, 1.0f};
  double youth_step_ = 1.0;
  Line ahead_[2];
  kit::DcBlocker ahead_low_cut_[2];
  // The low cut again, on what is played, for the reckoning only.
  kit::DcBlocker count_cut_[2];
  kit::OnePole ahead_damping_[2];
  kit::Svf ahead_mode_[2][kModes];

  kit::DcBlocker low_cut_[kLanes][2];
  kit::OnePole damping_[kLanes][2];
  kit::Svf mode_[kLanes][2][kModes];
  float gain_[2][kModes] = {};
  float direct_target_ = 1.0f;
  Line direct_;
  float slow_ = 0.0f;
  float hiss_rate_ = 1.0f;
  float hiss_same_ = 1.0f;
  float hiss_other_ = 0.0f;
  kit::Rng rng_[kLanes][2];

  kit::Smoother keep_, listen_, mix_;
  Slow room_, resonance_, width_, damp_, hiss_amount_;
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  kit::ControlClock clock_;
  bool settled_ = false;
  long blank_ = 0;
  // The loop holds nothing (sample-exact), and the device has stopped working (by blocks).
  bool empty_ = true;
  bool asleep_ = true;
};

}  // namespace livemix
