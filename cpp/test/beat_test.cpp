// Native checks of cpp/kit/beat.h: the slow clock, the tone pair, the Ears
// law, the rate glide and the pulse shape that the beat and breath devices
// share. Proved here once, so a device harness asserts what its device does
// with them and not the laws themselves. Compiled with the system C++
// compiler by scripts/test-native.sh.

#include "../kit/kit.h"
#include "../kit/beat.h"

#include <limits>

#include "support/test_kit.h"

using namespace livemix;
using namespace testkit;

namespace {

constexpr double kRate = 48000.0;

// The distance between two phases round the circle, in cycles.
double apart(double a, double b) {
  double d = std::fabs(a - b);
  d -= std::floor(d);
  return d > 0.5 ? 1.0 - d : d;
}

// The frequency of a steady tone from its upward zero crossings, each placed
// between its two samples: good to a part in a million over a second.
double frequency_of(const std::vector<float>& x, double rate) {
  double first = -1.0, last = -1.0;
  long crossings = 0;
  for (size_t i = 1; i < x.size(); ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      last = static_cast<double>(i - 1) + static_cast<double>(-x[i - 1]) / (static_cast<double>(x[i]) - x[i - 1]);
      if (first < 0.0) first = last;
      ++crossings;
    }
  }
  return crossings > 1 ? static_cast<double>(crossings - 1) * rate / (last - first) : 0.0;
}

// --- the slow clock ----------------------------------------------------------------------------

void test_clock() {
  // The half-beat phase of a 4 Hz beat turns at 2 Hz: after one hour at
  // 48 kHz it has made 7200 whole turns and stands where it began.
  const long hour = 3600L * 48000L;
  const double increment = kit::SlowClock::increment(2.0, kRate);
  kit::SlowClock stepped;
  stepped.reset();
  bool inside = true;
  for (long i = 0; i < hour; ++i) {
    stepped.step(increment);
    inside = inside && stepped.phase >= 0.0 && stepped.phase < 1.0;
  }
  const long double exact = static_cast<long double>(increment) * hour;
  const double closed = static_cast<double>(exact - std::floor(exact));
  std::printf("  clock: after an hour of single steps the half-beat phase is %.3g cycles from the closed form\n",
              apart(stepped.phase, closed));
  EXPECT(apart(stepped.phase, closed) < 1.0e-9 && apart(stepped.phase, 0.0) < 1.0e-9,
         "an hour of single steps at 2 Hz ends within 1e-9 cycles of the closed form");
  EXPECT(inside, "the phase stays in [0, 1) at every step");

  kit::SlowClock jumped;
  jumped.reset();
  jumped.advance(increment, hour);
  EXPECT(apart(jumped.phase, closed) < 1.0e-9 && jumped.phase >= 0.0 && jumped.phase < 1.0,
         "one jump of an hour ends within 1e-9 cycles of the closed form");

  // A jump of n samples is n single steps, to 1e-12, from any phase and for
  // the stretches a device is asleep for.
  double worst = 0.0;
  for (double hz : {0.004166667, 0.25, 2.0, 20.0, 40.0}) {
    for (double rate : {44100.0, 48000.0, 96000.0}) {
      const double inc = kit::SlowClock::increment(hz, rate);
      for (long n : {1L, 127L, 128L, 2048L, 96000L, 1000003L}) {
        kit::SlowClock a, b;
        a.reset(0.37);
        b.reset(0.37);
        for (long i = 0; i < n; ++i) a.step(inc);
        b.advance(inc, n);
        worst = std::max(worst, apart(a.phase, b.phase));
      }
    }
  }
  std::printf("  clock: a jump differs from the same single steps by %.3g cycles at worst\n", worst);
  EXPECT(worst < 1.0e-12, "a jump of n samples gives the phase of n single steps to 1e-12");

  // Jumps in pieces land where one jump does.
  kit::SlowClock pieces, whole;
  pieces.reset(0.9);
  whole.reset(0.9);
  long total = 0;
  for (long n : {128L, 1L, 2048L, 33L, 128L, 128L, 5L}) {
    pieces.advance(increment, n);
    total += n;
  }
  whole.advance(increment, total);
  EXPECT(apart(pieces.phase, whole.phase) < 1.0e-13, "jumps in pieces land where one jump does");

  // Nothing leaves [0, 1): not a phase a hair under zero, not one that is not a number.
  EXPECT(kit::wrap_phase(-1.0e-20) >= 0.0 && kit::wrap_phase(-1.0e-20) < 1.0, "a phase a hair under 0 wraps inside");
  EXPECT(kit::wrap_phase(1.0) == 0.0 && kit::wrap_phase(2.75) == 0.75 && kit::wrap_phase(-0.25) == 0.75,
         "wrap_phase takes whole turns off");
  EXPECT(kit::wrap_phase(std::nan("")) == 0.0, "a phase that is not a number wraps to 0");
  kit::SlowClock odd;
  odd.reset(-3.25);
  EXPECT(odd.phase == 0.75, "reset wraps its start");
  odd.advance(increment, -5);
  odd.advance(increment, 0);
  EXPECT(odd.phase == 0.75, "a jump of no samples, or fewer, moves nothing");
  EXPECT_NEAR(kit::SlowClock::increment(2.0, 48000.0), 2.0 / 48000.0, 1.0e-18, "the increment is hz over the rate");
  EXPECT(kit::SlowClock::increment(std::nan(""), 48000.0) == 0.0 && kit::SlowClock::increment(2.0, 0.0) == 0.0,
         "an increment from nonsense is 0");
}

// --- the tone pair -----------------------------------------------------------------------------

struct PairRender {
  std::vector<float> hi, lo;
};

// `seconds` of a pair on `carrier_hz`, `beat_hz` apart, both phases from 0.
PairRender render_pair(double carrier_hz, double beat_hz, double seconds, double rate) {
  PairRender out;
  kit::SlowClock carrier, half;
  carrier.reset();
  half.reset();
  const double carrier_inc = kit::SlowClock::increment(carrier_hz, rate);
  const double half_inc = kit::SlowClock::increment(0.5 * beat_hz, rate);
  const size_t frames = static_cast<size_t>(seconds * rate);
  for (size_t i = 0; i < frames; ++i) {
    const kit::TonePair pair = kit::tone_pair(kit::sin_cos(carrier.phase), kit::sin_cos(half.phase));
    out.hi.push_back(pair.hi);
    out.lo.push_back(pair.lo);
    carrier.step(carrier_inc);
    half.step(half_inc);
  }
  return out;
}

void test_pair() {
  kit::SineTable::init();
  // The sine a device is told to use, against the library's.
  double worst_sine = 0.0;
  for (int i = 0; i <= 2000000; ++i) {
    const double phase = i == 2000000 ? std::nextafter(1.0, 0.0) : i / 2000000.0;
    const kit::SinCos t = kit::sin_cos(phase);
    worst_sine = std::max(worst_sine, std::fabs(t.s - std::sin(2.0 * kPi * phase)));
    worst_sine = std::max(worst_sine, std::fabs(t.c - std::cos(2.0 * kPi * phase)));
  }
  std::printf("  pair: sin_cos is within %.3g of sin and cos\n", worst_sine);
  EXPECT(worst_sine < 2.0e-6, "sin_cos gives the sine and cosine of a wrapped phase to 2e-6 (-114 dB)");

  // hi = sin(2π(c + h)), lo = sin(2π(c - h)).
  double worst = 0.0, worst_partial = 0.0;
  kit::SlowClock carrier, half;
  carrier.reset();
  half.reset();
  for (int i = 0; i < 96000; ++i) {
    const double c = carrier.phase, h = half.phase;
    const kit::SinCos turn = kit::sin_cos(c);
    const kit::SinCos beat = kit::sin_cos(h);
    const kit::TonePair pair = kit::tone_pair(turn, beat);
    worst = std::max(worst, std::fabs(pair.hi - std::sin(2.0 * kPi * (c + h))));
    worst = std::max(worst, std::fabs(pair.lo - std::sin(2.0 * kPi * (c - h))));
    // The second and third partials of the carrier, split by the same beat.
    const kit::SinCos second = kit::second_partial(turn);
    const kit::SinCos third = kit::third_partial(turn);
    worst_partial = std::max(worst_partial, std::fabs(second.s - std::sin(2.0 * kPi * 2.0 * c)));
    worst_partial = std::max(worst_partial, std::fabs(second.c - std::cos(2.0 * kPi * 2.0 * c)));
    worst_partial = std::max(worst_partial, std::fabs(third.s - std::sin(2.0 * kPi * 3.0 * c)));
    worst_partial = std::max(worst_partial, std::fabs(third.c - std::cos(2.0 * kPi * 3.0 * c)));
    const kit::TonePair pair3 = kit::tone_pair(third, beat);
    worst_partial = std::max(worst_partial, std::fabs(pair3.hi - std::sin(2.0 * kPi * (3.0 * c + h))));
    worst_partial = std::max(worst_partial, std::fabs(pair3.lo - std::sin(2.0 * kPi * (3.0 * c - h))));
    carrier.step(kit::SlowClock::increment(220.0, kRate));
    half.step(kit::SlowClock::increment(2.0, kRate));
  }
  std::printf("  pair: the two tones are within %.3g of their sines, the partials within %.3g\n", worst, worst_partial);
  EXPECT(worst < 5.0e-6, "tone_pair is sin(2π(c + h)) and sin(2π(c - h)) to 5e-6");
  EXPECT(worst_partial < 2.0e-5, "the second and third partials and their pair are right to 2e-5");

  // The upper tone is Beat hertz above the lower and the pair is centred on
  // the carrier, at three rates.
  for (double rate : {44100.0, 48000.0, 96000.0}) {
    const PairRender pair = render_pair(220.0, 4.0, 4.0, rate);
    const double hi_hz = frequency_of(pair.hi, rate);
    const double lo_hz = frequency_of(pair.lo, rate);
    char label[160];
    std::snprintf(label, sizeof label, "at %.0f Hz the pair reads %.3f and %.3f Hz: 4 Hz apart about 220", rate, hi_hz,
                  lo_hz);
    EXPECT(std::fabs(hi_hz - 222.0) < 0.001 && std::fabs(lo_hz - 218.0) < 0.001, label);
  }

  // Summed, the pair is the carrier beating to nothing at Beat: its nulls
  // are a quarter second apart and the first falls an eighth in.
  const PairRender pair = render_pair(220.0, 4.0, 2.0, kRate);
  std::vector<float> mono(pair.hi.size());
  for (size_t i = 0; i < mono.size(); ++i) mono[i] = 0.5f * (pair.hi[i] + pair.lo[i]);
  const size_t eighth = static_cast<size_t>(kRate / 8.0);
  EXPECT(peak(mono, eighth - 24, eighth + 24) < 0.005 && peak(mono, 3 * eighth - 24, 3 * eighth + 24) < 0.005,
         "the mono sum falls to nothing an eighth and three eighths of a second in");
  EXPECT(peak(mono, 0, 480) > 0.99 && peak(mono, 2 * eighth - 240, 2 * eighth + 240) > 0.99,
         "and stands at full height on the beat, which begins at its crest");
}

// --- the Ears law ------------------------------------------------------------------------------

// Side over mid in dB, over a whole number of beats.
double side_over_mid(const std::vector<float>& left, const std::vector<float>& right) {
  std::vector<float> mid(left.size()), side(left.size());
  for (size_t i = 0; i < left.size(); ++i) {
    mid[i] = 0.5f * (left[i] + right[i]);
    side[i] = 0.5f * (left[i] - right[i]);
  }
  return db(rms(side)) - db(rms(mid));
}

void test_ears() {
  const PairRender pair = render_pair(220.0, 4.0, 2.0, kRate);
  auto through = [&](float ears, std::vector<float>* left, std::vector<float>* right) {
    const kit::EarGains gains = kit::ear_gains(ears);
    left->resize(pair.hi.size());
    right->resize(pair.hi.size());
    for (size_t i = 0; i < pair.hi.size(); ++i) {
      kit::to_ears(gains, pair.hi[i], pair.lo[i], &(*left)[i], &(*right)[i]);
    }
  };
  std::vector<float> left, right;

  const kit::EarGains none = kit::ear_gains(0.0f);
  EXPECT(none.same == 0.5f && none.other == 0.5f, "at Ears 0 the two gains are exactly a half");
  through(0.0f, &left, &right);
  EXPECT(left == right && rms(left) > 0.1, "at Ears 0 left equals right to the sample");
  const double mid_at_none = rms(left);

  const kit::EarGains all = kit::ear_gains(1.0f);
  EXPECT(all.same == 1.0f && all.other == 0.0f, "at Ears 1 the gains are exactly 1 and 0");
  through(1.0f, &left, &right);
  EXPECT(left == pair.hi && right == pair.lo, "at Ears 1 the left ear is the higher tone alone and the right the lower");
  EXPECT(std::fabs(frequency_of(left, kRate) - 222.0) < 0.001 &&
             tone_level(left, 218.0, kRate) < 1.0e-3,
         "the left ear is the higher one, with nothing of the lower in it");
  EXPECT_NEAR(side_over_mid(left, right), 0.0, 0.05, "at Ears 1 side equals mid");
  std::vector<float> mid(left.size());
  for (size_t i = 0; i < mid.size(); ++i) mid[i] = 0.5f * (left[i] + right[i]);
  EXPECT_NEAR(rms(mid) / mid_at_none, 1.0, 1.0e-6, "the mid is the same at Ears 0 and Ears 1");

  through(0.5f, &left, &right);
  const double half_db = side_over_mid(left, right);
  through(0.8f, &left, &right);
  const double most_db = side_over_mid(left, right);
  std::printf("  ears: side over mid is %.2f dB at Ears 0.5 and %.2f dB at 0.8\n", half_db, most_db);
  EXPECT_NEAR(half_db, -6.02, 0.1, "at Ears 0.5 side over mid is -6.0 dB");
  EXPECT_NEAR(most_db, -1.94, 0.1, "at Ears 0.8 side over mid is -1.9 dB");
  for (size_t i = 0; i < mid.size(); ++i) mid[i] = 0.5f * (left[i] + right[i]);
  EXPECT_NEAR(rms(mid) / mid_at_none, 1.0, 1.0e-6, "the mid does not move with Ears");

  // Inside one ear the ripple is (1 + Ears) over (1 - Ears) the other way up:
  // 6.0 dB at 0.5, read as the ear's envelope at the beat's crest and null.
  through(0.5f, &left, &right);
  const size_t eighth = static_cast<size_t>(kRate / 8.0);
  const double crest = peak(left, 2 * eighth - 240, 2 * eighth + 240);
  const double null = peak(left, eighth - 240, eighth + 240);
  EXPECT_NEAR(db(crest) - db(null), 6.02, 0.1, "at Ears 0.5 each ear ripples by 6.0 dB");

  const kit::EarGains over = kit::ear_gains(7.0f), under = kit::ear_gains(-2.0f), bad = kit::ear_gains(std::nanf(""));
  EXPECT(over.same == 1.0f && over.other == 0.0f && under.same == 0.5f && under.other == 0.5f && bad.same == 0.5f &&
             bad.other == 0.5f,
         "Ears outside 0 to 1 is held to it, and nonsense is 0");
}

// --- the rate glide ----------------------------------------------------------------------------

double closed_rate(double base, double target, double seconds, double t) {
  return base * std::pow(target / base, std::min(t / seconds, 1.0));
}

bool same(const kit::RateGlide& a, const kit::RateGlide& b) {
  return a.state() == b.state() && a.rate() == b.rate() && a.place() == b.place();
}

void test_glide() {
  const double ten_minutes = 600.0;
  const long minute = 60L * 48000L;
  kit::RateGlide glide;

  // Armed by reset; with no voice open it waits for the first key.
  glide.reset(kRate);
  glide.set(10.0, 4.0, ten_minutes, false);
  EXPECT(glide.state() == kit::RateGlide::kArmed && glide.rate() == 10.0 && glide.place() == 0.0f,
         "a glide set with no voice open is armed and stands at Beat");
  for (int i = 0; i < 48000; ++i) glide.step();
  glide.advance(minute);
  EXPECT(glide.state() == kit::RateGlide::kArmed && glide.rate() == 10.0, "armed, it does not count: the rate stays");
  glide.key();
  EXPECT(glide.state() == kit::RateGlide::kGliding && glide.rate() == 10.0, "the first key starts it, from Beat");

  // 10 to 4 Hz over ten minutes: the closed form at 0, 5, 10 and 12 minutes.
  const double at[4] = {0.0, 5.0, 10.0, 12.0};
  double worst = 0.0;
  long now = 0;
  for (double minutes : at) {
    const long target = static_cast<long>(minutes * minute);
    glide.advance(target - now);
    now = target;
    const double expected = closed_rate(10.0, 4.0, ten_minutes, minutes * 60.0);
    worst = std::max(worst, std::fabs(glide.rate() / expected - 1.0));
    std::printf("  glide: at %2.0f min the rate is %.5f Hz (closed form %.5f), place %.3f\n", minutes, glide.rate(),
                expected, glide.place());
  }
  EXPECT(worst < 1.0e-3, "the rate at 0, 5, 10 and 12 minutes is the closed form within 0.1 %");
  EXPECT(glide.state() == kit::RateGlide::kHolding && glide.rate() == 4.0 && glide.place() == 1.0f,
         "after its time it holds at Target, exactly, with its place at 1");

  // The same by single steps: step() returns the rate of the sample it
  // leaves, refreshed on multiples of 32 of the glide's own count.
  glide.reset(kRate);
  glide.set(10.0, 4.0, ten_minutes, true);
  EXPECT(glide.state() == kit::RateGlide::kGliding, "set with a voice open, it starts at that sample");
  bool stepwise = true, on_time = true, monotone = true;
  double cycles = 0.0, held = 0.0;
  float last_place = 0.0f;
  const long length = 10 * minute;
  for (long t = 0; t < length + 1000; ++t) {
    if (t == length) on_time = on_time && glide.state() == kit::RateGlide::kHolding;
    if (t == length - 1) on_time = on_time && glide.state() == kit::RateGlide::kGliding;
    const double ahead = glide.rate();
    const double rate = glide.step();
    stepwise = stepwise && rate == ahead;
    if (t < length) {
      if (t % 32 == 0) held = closed_rate(10.0, 4.0, ten_minutes, t / kRate);
      stepwise = stepwise && std::fabs(rate / held - 1.0) < 1.0e-12;
      cycles += rate / kRate;
    } else {
      stepwise = stepwise && rate == 4.0;
    }
    monotone = monotone && glide.place() >= last_place;
    last_place = glide.place();
  }
  EXPECT(stepwise, "step by step the rate is the closed form at the last multiple of 32 samples");
  EXPECT(on_time, "it is gliding on its last sample and holding on the next");
  EXPECT(monotone && last_place == 1.0f, "its place only rises, to 1");
  // The beats in the glide: the integral of the closed form.
  const double integral = 10.0 * ten_minutes * (0.4 - 1.0) / std::log(0.4);
  std::printf("  glide: %.4f beats in the glide, the integral says %.4f\n", cycles, integral);
  EXPECT(std::fabs(cycles - integral) < 0.01, "the beats in a glide are the integral of the closed form to 0.01");
}

// A device as it would run a glide: in blocks of `block`, awake it steps the
// glide and its clock a sample at a time, asleep (between `idle_from` and
// `idle_to`, in samples) it moves the glide on by the block and leaves the
// clock, which a key at `idle_to` restarts. Returns the clock's phase and
// leaves the glide as it stands at `frames`.
double run_in_blocks(kit::RateGlide& glide, long frames, int block, long idle_from, long idle_to) {
  kit::SlowClock clock;
  clock.reset();
  glide.reset(kRate);
  glide.set(10.0, 4.0, 60.0, false);
  glide.key();
  long done = 0;
  while (done < frames) {
    long count = std::min<long>(block, frames - done);
    // A block never straddles the edge of the idle stretch: a device rests and
    // wakes on its own blocks, and what is compared here is the glide.
    if (done < idle_from) count = std::min(count, idle_from - done);
    if (done < idle_to && done >= idle_from) count = std::min(count, idle_to - done);
    if (done >= idle_from && done < idle_to) {
      glide.advance(count);
    } else {
      if (done == idle_to) {
        clock.reset();
        glide.key();  // a key from silence: the clock restarts, the glide does not
      }
      for (long i = 0; i < count; ++i) clock.step(glide.step() / kRate);
    }
    done += count;
  }
  return clock.phase;
}

void test_glide_blocks() {
  // Through an idle stretch of 7.7 s that starts and ends off every block's grid and
  // off the glide's own multiples of 32.
  const long frames = 30L * 48000L, idle_from = 5L * 48000L + 77L, idle_to = idle_from + 369613L;
  kit::RateGlide one, other;
  const double phase_1 = run_in_blocks(one, frames, 1, idle_from, idle_to);
  bool alike = true;
  for (int block : {128, 2048, 33, 1000}) {
    const double phase = run_in_blocks(other, frames, block, idle_from, idle_to);
    alike = alike && phase == phase_1 && same(one, other);
  }
  EXPECT(alike, "blocks of 1, 128, 2048 and ragged ones give the same phase and the same glide, to the bit");
  EXPECT(one.state() == kit::RateGlide::kGliding && std::fabs(one.place() - 0.5f) < 1.0e-6f,
         "the glide counted on through the idle stretch and the key after it: half way after 30 s of 60");

  // advance(n) is n single steps exactly, wherever it starts and ends.
  bool exact = true;
  for (long start : {0L, 1L, 31L, 32L, 1000L}) {
    for (long n : {1L, 31L, 32L, 33L, 128L, 2048L, 100000L, 2879990L, 2880000L, 2880001L, 5000000L}) {
      kit::RateGlide a, b;
      for (kit::RateGlide* g : {&a, &b}) {
        g->reset(kRate);
        g->set(10.0, 4.0, 60.0, true);
        for (long i = 0; i < start; ++i) g->step();
      }
      for (long i = 0; i < n; ++i) a.step();
      b.advance(n);
      exact = exact && same(a, b);
      // And what follows is the same too.
      for (int i = 0; i < 100; ++i) exact = exact && a.step() == b.step();
    }
  }
  EXPECT(exact, "advance(n) leaves the glide exactly where n single steps do");
}

void test_glide_life() {
  kit::RateGlide glide;
  const long second = 48000;

  // Beat changed in mid-glide: armed again, and with a voice open it starts
  // again at that sample from the new Beat.
  glide.reset(kRate);
  glide.set(10.0, 4.0, 60.0, true);
  glide.advance(30 * second);
  EXPECT(glide.state() == kit::RateGlide::kGliding && std::fabs(glide.rate() - std::sqrt(40.0)) < 1.0e-3,
         "half way from 10 to 4 the rate is their geometric mean");
  glide.set(8.0, 4.0, 60.0, true);
  EXPECT(glide.state() == kit::RateGlide::kGliding && glide.rate() == 8.0 && glide.place() == 0.0f,
         "Beat changed in mid-glide: the glide starts again from the new Beat");
  glide.advance(60 * second - 1);
  EXPECT(glide.state() == kit::RateGlide::kGliding, "and takes its whole time again");
  glide.advance(1);
  EXPECT(glide.state() == kit::RateGlide::kHolding && glide.rate() == 4.0, "then holds at Target");
  glide.advance(3600 * second);
  for (int i = 0; i < 1000; ++i) glide.step();
  glide.key();
  EXPECT(glide.state() == kit::RateGlide::kHolding && glide.rate() == 4.0,
         "it holds through an hour, and a key does not run it again");

  // The same settings sent again arm nothing.
  glide.set(8.0, 4.0, 60.0, true);
  EXPECT(glide.state() == kit::RateGlide::kHolding, "the same settings sent again change nothing");

  // Target moved while a key is held: the rate leaves Beat at that sample
  // and reaches the new Target one Glide later.
  glide.set(8.0, 2.0, 60.0, true);
  EXPECT(glide.state() == kit::RateGlide::kGliding && glide.rate() == 8.0,
         "Target moved with a voice open: the glide leaves Beat at that sample");
  glide.step();
  for (int i = 0; i < 32; ++i) glide.step();
  EXPECT(glide.rate() < 8.0, "and the rate is already falling 33 samples on");
  glide.advance(60 * second - 34);
  EXPECT(glide.state() == kit::RateGlide::kGliding, "one sample short of one Glide later it is still gliding");
  glide.advance(1);
  EXPECT(glide.state() == kit::RateGlide::kHolding && glide.rate() == 2.0, "one Glide later it is at the new Target");

  // Target moved with no voice open: the rate stays at Beat until a key.
  glide.set(8.0, 3.0, 60.0, false);
  glide.advance(600 * second);
  for (int i = 0; i < 1000; ++i) glide.step();
  EXPECT(glide.state() == kit::RateGlide::kArmed && glide.rate() == 8.0 && glide.place() == 0.0f,
         "Target moved with no voice open: the rate stays at Beat");
  glide.key();
  glide.advance(30 * second);
  EXPECT(glide.state() == kit::RateGlide::kGliding && std::fabs(glide.rate() - std::sqrt(24.0)) < 1.0e-3,
         "until the first key, which starts it");
  // A key struck again, or let go (the glide is told nothing), does not restart it.
  glide.key();
  EXPECT(std::fabs(glide.place() - 0.5f) < 1.0e-6f, "a key struck in mid-glide leaves it where it is");

  // Glide time changed: armed again. Time 0 is off.
  glide.set(8.0, 3.0, 0.0, true);
  glide.key();
  glide.advance(600 * second);
  EXPECT(glide.state() == kit::RateGlide::kArmed && glide.rate() == 8.0 && glide.step() == 8.0 && glide.place() == 0.0f,
         "a Glide of 0 is off: the rate is Beat, whatever the keys do");
  glide.set(8.0, 3.0, 2.0, true);
  glide.advance(2 * second);
  EXPECT(glide.state() == kit::RateGlide::kHolding && glide.rate() == 3.0, "moving Glide runs it again");

  // Upward glides too, and a second reset is the first.
  glide.reset(kRate);
  EXPECT(glide.state() == kit::RateGlide::kArmed && glide.place() == 0.0f, "reset arms it");
  glide.set(4.0, 16.0, 10.0, true);
  glide.advance(5 * second);
  EXPECT_NEAR(glide.rate(), 8.0, 1.0e-3, "a glide upward follows the same law");

  // A time that is no whole number of samples: it lands on Target itself and
  // never passes it on the way.
  glide.reset(44100.0);
  glide.set(9.3, 3.7, 0.33337, true);
  double lowest = 9.3;
  while (glide.state() == kit::RateGlide::kGliding) lowest = std::min(lowest, glide.step());
  EXPECT(glide.rate() == 3.7 && lowest > 3.7 && lowest < 3.71, "it lands on Target itself and never passes it");
  glide.reset(44100.0);
  glide.set(9.3, 3.7, 0.33337, true);
  glide.advance(14702);
  EXPECT(glide.state() == kit::RateGlide::kHolding && glide.rate() == 3.7 && glide.place() == 1.0f,
         "by a jump too: 14702 samples is the first whole count past 0.33337 s at 44.1 kHz");

  // Beat and Target are held positive, and nothing here can make a rate that
  // is not a number.
  glide.reset(kRate);
  glide.set(0.0, -5.0, 10.0, true);
  bool sound = glide.rate() > 0.0 && std::isfinite(glide.rate());
  glide.advance(20 * second);
  sound = sound && glide.rate() > 0.0 && std::isfinite(glide.rate());
  glide.set(std::nan(""), std::nan(""), std::nan(""), true);
  for (int i = 0; i < 100; ++i) sound = sound && glide.step() > 0.0 && std::isfinite(glide.rate());
  glide.set(6.0, 1.0e300, 1.0e300, true);
  glide.advance(std::numeric_limits<long>::max());
  sound = sound && glide.rate() > 0.0 && std::isfinite(glide.rate()) && std::isfinite(glide.place());
  glide.reset(0.0);
  glide.set(6.0, 3.0, 10.0, true);
  glide.advance(1000);
  sound = sound && glide.rate() > 0.0 && std::isfinite(glide.rate());
  EXPECT(sound, "Beat and Target are held positive and nonsense makes no rate that is not a number");
}

// --- the pulse ---------------------------------------------------------------------------------

// One period of the pure pulse at `hz`, sampled at `rate`, from phase 0.
std::vector<float> one_period(double hz, float duty, float edge_seconds, double rate) {
  const kit::PulseShape shape = kit::pulse_shape(static_cast<float>(hz), duty, edge_seconds);
  const long frames = static_cast<long>(rate / hz + 0.5);
  std::vector<float> out;
  for (long i = 0; i < frames; ++i) out.push_back(kit::pulse_open(static_cast<double>(i) * hz / rate, shape));
  return out;
}

void test_pulse_shape() {
  kit::SineTable::init();
  // 10 Hz, Duty 0.5, Edge 8 ms at 48 kHz: 4800 samples a period.
  const std::vector<float> open = one_period(10.0, 0.5f, 0.008f, kRate);
  long on = 0, top = 0, gap = 0;
  double worst_step = 0.0, worst_shape = 0.0;
  for (size_t i = 0; i < open.size(); ++i) {
    on += open[i] >= 0.5f ? 1 : 0;
    top += open[i] == 1.0f ? 1 : 0;
    gap += open[i] == 0.0f ? 1 : 0;
    const float next = open[(i + 1) % open.size()];
    worst_step = std::max(worst_step, std::fabs(static_cast<double>(next) - open[i]));
    // The law written out: up on half a cosine from phase 0, down on one from Duty.
    const double ms = static_cast<double>(i) / 48.0;
    double expected = 0.0;
    if (ms < 8.0) expected = 0.5 - 0.5 * std::cos(kPi * ms / 8.0);
    else if (ms < 50.0) expected = 1.0;
    else if (ms < 58.0) expected = 0.5 + 0.5 * std::cos(kPi * (ms - 50.0) / 8.0);
    worst_shape = std::max(worst_shape, std::fabs(open[i] - expected));
  }
  std::printf("  pulse: 10 Hz, Duty 0.5, Edge 8 ms: on for %ld of 4800 samples, at 1 for %ld, at 0 for %ld\n", on, top,
              gap);
  EXPECT(std::labs(on - 2400) <= 1, "the on-time, between the half heights of the two edges, is Duty of the period");
  EXPECT_NEAR(mean(open), 0.5, 1.0e-4, "so the mean of the pulse is Duty");
  EXPECT(std::labs(top - 2016) <= 2 && std::labs(gap - 2016) <= 2, "the top and the gap are each Duty less one edge");
  EXPECT(worst_shape < 2.0e-6, "the edges are half cosines of Edge seconds: up from phase 0, down from Duty");
  EXPECT(open[0] == 0.0f && open[1] > 0.0f && open[4799] == 0.0f, "the pulse begins to rise at phase 0");
  const double steepest = 0.5 * kPi / (0.008 * kRate);
  std::printf("  pulse: its largest step is %.7f, the steepest of a half cosine of 8 ms is %.7f\n", worst_step, steepest);
  EXPECT(worst_step <= steepest * 1.001 && worst_step > steepest * 0.99,
         "and no step of it is larger than the steepest of a half cosine of Edge");

  // Depth: the off level is (1 - d)², exactly 0 at 1; at 0 the gain is exactly 1.
  EXPECT(kit::pulse_floor(1.0f) == 0.0f && kit::pulse_floor(0.0f) == 1.0f && kit::pulse_floor(0.5f) == 0.25f &&
             kit::pulse_floor(3.0f) == 0.0f && kit::pulse_floor(-1.0f) == 1.0f && kit::pulse_floor(std::nanf("")) == 1.0f,
         "the off level is (1 - Depth) squared, held to 0..1");
  long zeros = 0;
  bool unity = true, between = true;
  for (float value : open) {
    zeros += kit::pulse_gain(value, kit::pulse_floor(1.0f)) == 0.0f ? 1 : 0;
    unity = unity && kit::pulse_gain(value, kit::pulse_floor(0.0f)) == 1.0f;
    const float gain = kit::pulse_gain(value, kit::pulse_floor(0.6f));
    between = between && gain >= 0.16f - 1.0e-7f && gain <= 1.0f;
  }
  EXPECT(zeros == gap && gap > 2000, "Depth 1 gives exact zeros through the whole gap");
  EXPECT(unity, "Depth 0 gives a gain of exactly 1 everywhere");
  EXPECT(between && kit::pulse_gain(1.0f, 0.16f) == 1.0f && std::fabs(kit::pulse_gain(0.0f, 0.16f) - 0.16f) < 1.0e-7f,
         "between, the gain runs from the off level up to exactly 1: a pulse only turns down");

  // The edge is held to half of the shorter of the on and off times: at
  // 40 Hz and Duty 0.5 an Edge of 50 ms is 6.25 ms.
  const kit::PulseShape fast = kit::pulse_shape(40.0f, 0.5f, 0.050f);
  EXPECT_NEAR(fast.edge / 40.0, 0.00625, 1.0e-7, "at 40 Hz an Edge of 50 ms is held to 6.25 ms");
  const std::vector<float> quick = one_period(40.0, 0.5f, 0.050f, kRate);
  long rise = 0;
  while (rise < static_cast<long>(quick.size()) && quick[static_cast<size_t>(rise)] < 1.0f) ++rise;
  EXPECT(rise == 300, "its rise takes 300 samples at 48 kHz, which is 6.25 ms");
  const kit::PulseShape narrow = kit::pulse_shape(10.0f, 0.1f, 0.050f), wide = kit::pulse_shape(10.0f, 0.9f, 0.050f);
  EXPECT_NEAR(narrow.edge, 0.05, 1.0e-6, "at Duty 0.1 the edge is half the on-time");
  EXPECT_NEAR(wide.edge, 0.05, 1.0e-6, "at Duty 0.9 the edge is half the off-time");
  // Every shape a device can ask for: in range, a top and a gap, the mean at Duty.
  bool sound = true;
  for (float hz : {0.5f, 3.0f, 10.0f, 40.0f}) {
    for (float duty : {0.1f, 0.25f, 0.5f, 0.9f}) {
      for (float edge : {0.002f, 0.008f, 0.050f}) {
        const std::vector<float> p = one_period(hz, duty, edge, 96000.0);
        long ones = 0, noughts = 0;
        for (float value : p) {
          sound = sound && value >= 0.0f && value <= 1.0f;
          ones += value == 1.0f ? 1 : 0;
          noughts += value == 0.0f ? 1 : 0;
        }
        sound = sound && ones > 0 && noughts > 0 && std::fabs(mean(p) - duty) < 2.0e-3;
      }
    }
  }
  EXPECT(sound, "from 0.5 to 40 Hz, Duty 0.1 to 0.9 and Edge 2 to 50 ms the pulse has a top, a gap and a mean of Duty");
  const kit::PulseShape odd = kit::pulse_shape(std::nanf(""), std::nanf(""), std::nanf(""));
  EXPECT(std::isfinite(kit::pulse_open(0.3, odd)) && std::isfinite(kit::pulse_open(std::nan(""), fast)) &&
             kit::pulse_open(1.0, fast) == 0.0f && kit::pulse_open(-0.1, fast) == 0.0f,
         "nonsense in gives a finite pulse, and a phase outside [0, 1) reads as the gap");

  // The right ear reads the same clock Offset later: a quarter turn of
  // Offset is the same pulse a quarter period on.
  const kit::PulseShape shape = kit::pulse_shape(10.0f, 0.5f, 0.008f);
  bool later = true;
  for (int i = 0; i < 4800; ++i) {
    const double phase = i / 4800.0;
    const float behind = kit::pulse_open(kit::wrap_phase(phase - 0.25), shape);
    later = later && std::fabs(behind - open[static_cast<size_t>((i + 3600) % 4800)]) < 1.0e-6f;
  }
  EXPECT(later, "a phase read Offset behind gives the same pulse that much later");
}

// The gate as a device runs it: one clock, the shape worked out from the
// controls as they stand, a sample at a time. At sample `change_at` the
// controls become (hz_b, duty_b, edge_b). Fills the gate's output and the
// pure pulse beside it.
struct GateRun {
  std::vector<float> gate, pure;
};

GateRun run_gate(double rate, float hz_a, float duty_a, float edge_a, long change_at, float hz_b, float duty_b,
                 float edge_b, long frames) {
  GateRun out;
  kit::SlowClock clock;
  kit::PulseGate gate;
  clock.reset();
  gate.reset();
  for (long i = 0; i < frames; ++i) {
    const bool changed = i >= change_at;
    const float hz = changed ? hz_b : hz_a;
    const kit::PulseShape shape = kit::pulse_shape(hz, changed ? duty_b : duty_a, changed ? edge_b : edge_a);
    const double increment = kit::SlowClock::increment(hz, rate);
    out.pure.push_back(kit::pulse_open(clock.phase, shape));
    out.gate.push_back(gate.next(clock.phase, shape, increment));
    clock.step(increment);
  }
  return out;
}

void test_pulse_gate() {
  // Nothing changing, the gate is the pure pulse to the bit.
  bool exact = true;
  for (double rate : {44100.0, 48000.0, 96000.0}) {
    for (float hz : {0.5f, 3.7f, 10.0f, 40.0f}) {
      for (float duty : {0.1f, 0.5f, 0.9f}) {
        for (float edge : {0.002f, 0.008f, 0.050f}) {
          const long frames = static_cast<long>(3.2 * rate / hz);
          const GateRun run = run_gate(rate, hz, duty, edge, frames, hz, duty, edge, frames);
          exact = exact && run.gate == run.pure;
        }
      }
    }
  }
  EXPECT(exact, "with nothing changing the gate equals the pure pulse exactly, at every rate, Duty and Edge");

  // Rate thrown from 2 to 40 Hz at eight places in the pulse, Edge 8 ms
  // (6.25 ms once 40 Hz has clamped it): the pure pulse jumps, the gate
  // moves no faster than a quarter over the steepest of its own edge, and
  // is the pure pulse again within two edges.
  const double steepest_fast = 0.5 * kPi / (0.00625 * kRate);
  double worst_gate = 0.0, worst_pure = 0.0;
  bool rejoined = true;
  for (int place = 0; place < 8; ++place) {
    const long at = static_cast<long>((0.004 + 0.07 * place) * kRate);  // 4 ms in, then every 70 ms of 500
    const GateRun run = run_gate(kRate, 2.0f, 0.5f, 0.008f, at, 40.0f, 0.5f, 0.008f, at + 9600);
    worst_gate = std::max(worst_gate, max_step(run.gate, static_cast<size_t>(at - 1)));
    worst_pure = std::max(worst_pure, max_step(run.pure, static_cast<size_t>(at - 1)));
    for (size_t i = static_cast<size_t>(at) + 800; i < run.gate.size(); ++i) rejoined = rejoined && run.gate[i] == run.pure[i];
  }
  std::printf("  pulse: Rate thrown 2 to 40 Hz: the gate's largest step is %.5f (%.3f of its edge's %.5f), the pure pulse's %.3f\n",
              worst_gate, worst_gate / steepest_fast, steepest_fast, worst_pure);
  EXPECT(worst_gate <= 1.25 * steepest_fast * 1.0001,
         "Rate thrown from 2 to 40 Hz: the gate's largest step is no more than a quarter over its edge's");
  EXPECT(worst_pure > 0.5, "(the pure pulse jumps there by more than half its height)");
  EXPECT(rejoined, "and within a few edges the gate is the pure pulse again, exactly");

  // The same for 40 to 2 Hz, and for Duty and Edge thrown end to end.
  struct Throw {
    float hz_a, duty_a, edge_a, hz_b, duty_b, edge_b;
    const char* what;
  };
  const Throw throws[] = {
      {40.0f, 0.5f, 0.008f, 2.0f, 0.5f, 0.008f, "Rate thrown from 40 to 2 Hz"},
      {10.0f, 0.9f, 0.008f, 10.0f, 0.1f, 0.008f, "Duty thrown from 0.9 to 0.1"},
      {10.0f, 0.1f, 0.008f, 10.0f, 0.9f, 0.008f, "Duty thrown from 0.1 to 0.9"},
      {3.0f, 0.5f, 0.050f, 3.0f, 0.5f, 0.002f, "Edge thrown from 50 to 2 ms"},
      {3.0f, 0.5f, 0.002f, 3.0f, 0.5f, 0.050f, "Edge thrown from 2 to 50 ms"},
  };
  for (const Throw& t : throws) {
    const kit::PulseShape after = kit::pulse_shape(t.hz_b, t.duty_b, t.edge_b);
    const double steepest = 0.5 * kPi * t.hz_b / (after.edge * kRate);
    double gate_step = 0.0, pure_step = 0.0;
    bool back = true;
    const long period = static_cast<long>(kRate / t.hz_a);
    for (int place = 0; place < 8; ++place) {
      const long at = period + (period * (2 * place + 1)) / 16;
      const long frames = at + static_cast<long>(3.0 * kRate / t.hz_b);
      const GateRun run = run_gate(kRate, t.hz_a, t.duty_a, t.edge_a, at, t.hz_b, t.duty_b, t.edge_b, frames);
      gate_step = std::max(gate_step, max_step(run.gate, static_cast<size_t>(at - 1)));
      pure_step = std::max(pure_step, max_step(run.pure, static_cast<size_t>(at - 1)));
      back = back && run.gate.back() == run.pure.back();
    }
    char label[200];
    std::snprintf(label, sizeof label, "%s: one more edge, never a jump (step %.5f of %.5f allowed; the pure pulse %.3f)",
                  t.what, gate_step, 1.25 * steepest, pure_step);
    EXPECT(gate_step <= 1.25 * steepest * 1.0001 && back, label);
    std::snprintf(label, sizeof label, "(%s makes the pure pulse jump at some place)", t.what);
    EXPECT(pure_step > 2.0 * 1.25 * steepest, label);
  }

  // reset() puts it where it is told: at the gap by default, where a
  // restarted clock begins.
  kit::PulseGate gate;
  gate.reset(0.7f);
  EXPECT(gate.open == 0.7f, "reset puts the gate where it is told");
  gate.reset();
  EXPECT(gate.open == 0.0f, "and at the gap when told nothing");
  const kit::PulseShape shape = kit::pulse_shape(10.0f, 0.5f, 0.008f);
  const float next = gate.next(0.3, shape, std::nan(""));
  EXPECT(std::isfinite(next) && std::isfinite(gate.next(std::nan(""), shape, 1.0e-4)), "nonsense leaves it finite");
}

}  // namespace

int main() {
  test_clock();
  test_pair();
  test_ears();
  test_glide();
  test_glide_blocks();
  test_glide_life();
  test_pulse_shape();
  test_pulse_gate();
  if (failures() == 0) {
    std::printf("beat tests: all passed\n");
    return 0;
  }
  std::printf("beat tests: %d FAILED\n", failures());
  return 1;
}
