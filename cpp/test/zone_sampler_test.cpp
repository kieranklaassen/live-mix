// Native harness for Zone Sampler (cpp/devices/zone-sampler). The conformance
// pass runs on the built-in instrument; the rest hands the device sounds and
// zones through the zone entry points, the way the host does, and measures
// what makes it a multi-sample instrument: which zone a key takes, the pitch
// it plays it at, velocity layers, round robin, loops, and the voice pool.

#include "../devices/zone-sampler/zone_sampler.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::ZoneSampler;
namespace p = livemix::zone_sampler;

static ZoneSampler device;

static const float kRate = 48000.0f;

static double key_hz(double key) { return 440.0 * std::pow(2.0, (key - 69.0) / 12.0); }

// A sine on `hz` with a marker partial `marker` times above it at a third of
// its level: the pitch says which key played, the marker which zone.
static std::vector<float> marked(double hz, int marker, float seconds, float rate, float gain = 0.5f) {
  std::vector<float> out(static_cast<size_t>(seconds * rate));
  for (size_t i = 0; i < out.size(); ++i) {
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / rate;
    out[i] = gain * static_cast<float>(std::sin(phase) + (marker > 0 ? std::sin(marker * phase) / 3.0 : 0.0));
  }
  return out;
}

// Hand the device a sound the way the host does; its index.
static int add_sound(ZoneSampler& d, const std::vector<float>& left, const std::vector<float>& right, float rate) {
  const int frames = static_cast<int>(left.size());
  const int index = d.zone_sample(frames, right.empty() ? 1 : 2, rate);
  if (index < 0) return index;
  float* buffer = d.zone_sample_buffer(index);
  for (int i = 0; i < frames; ++i) {
    buffer[i] = left[i];
    if (!right.empty()) buffer[frames + i] = right[i];
  }
  return index;
}
static int add_sound(ZoneSampler& d, const std::vector<float>& mono, float rate = kRate) {
  return add_sound(d, mono, std::vector<float>(), rate);
}

struct ZoneSpec {
  int sample = 0;
  float root = 60.0f, tune = 0.0f;
  int low_key = 0, high_key = 127, low_velocity = 0, high_velocity = 127;
  float gain_db = 0.0f, pan = 0.0f;
  int start = 0, end = 0;
  int loop_mode = 0, loop_start = 0, loop_end = 0, crossfade = 0;
  int group = 0, position = 1, length = 1;
  float track = 1.0f;
};

static int add_zone(ZoneSampler& d, const ZoneSpec& z) {
  float* f = d.zone_fields();
  f[ZoneSampler::kFieldSample] = static_cast<float>(z.sample);
  f[ZoneSampler::kFieldRoot] = z.root;
  f[ZoneSampler::kFieldTune] = z.tune;
  f[ZoneSampler::kFieldLowKey] = static_cast<float>(z.low_key);
  f[ZoneSampler::kFieldHighKey] = static_cast<float>(z.high_key);
  f[ZoneSampler::kFieldLowVelocity] = static_cast<float>(z.low_velocity);
  f[ZoneSampler::kFieldHighVelocity] = static_cast<float>(z.high_velocity);
  f[ZoneSampler::kFieldGain] = z.gain_db;
  f[ZoneSampler::kFieldPan] = z.pan;
  f[ZoneSampler::kFieldStart] = static_cast<float>(z.start);
  f[ZoneSampler::kFieldEnd] = static_cast<float>(z.end);
  f[ZoneSampler::kFieldLoopMode] = static_cast<float>(z.loop_mode);
  f[ZoneSampler::kFieldLoopStart] = static_cast<float>(z.loop_start);
  f[ZoneSampler::kFieldLoopEnd] = static_cast<float>(z.loop_end);
  f[ZoneSampler::kFieldLoopCrossfade] = static_cast<float>(z.crossfade);
  f[ZoneSampler::kFieldGroup] = static_cast<float>(z.group);
  f[ZoneSampler::kFieldPosition] = static_cast<float>(z.position);
  f[ZoneSampler::kFieldLength] = static_cast<float>(z.length);
  f[ZoneSampler::kFieldTrack] = z.track;
  return d.zone_add();
}

// An empty instrument with nothing in the way: a fast envelope, the filter
// open, no velocity sensitivity, unity volume.
static void plain(ZoneSampler& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kAttack, 0.001f);
  d.set_param(p::kRelease, 0.02f);
  d.set_param(p::kTone, 18000.0f);
  d.set_param(p::kVelocity, 0.0f);
  d.set_param(p::kVolume, 0.0f);
  d.zones_begin();
  render(d, 0.05f, rate);  // the tail of what zones_begin cut off
}

// Three zones, a sound each on C3, C4 and C5, with a gap of five keys between
// their ranges. The sounds are 3 s long, the second one stored at 44.1 kHz.
static void three_zones(ZoneSampler& d, float rate = kRate) {
  plain(d, rate);
  const int a = add_sound(d, marked(key_hz(48), 3, 3.0f, 48000.0f));
  const int b = add_sound(d, marked(key_hz(60), 5, 3.0f, 44100.0f), 44100.0f);
  const int c = add_sound(d, marked(key_hz(72), 7, 3.0f, 48000.0f));
  ZoneSpec zone;
  zone.sample = a, zone.root = 48, zone.low_key = 45, zone.high_key = 51;
  add_zone(d, zone);
  zone.sample = b, zone.root = 60, zone.low_key = 57, zone.high_key = 63;
  add_zone(d, zone);
  zone.sample = c, zone.root = 72, zone.low_key = 69, zone.high_key = 75;
  add_zone(d, zone);
}

// Play one note for `seconds` and give back what came out.
static Stereo play(ZoneSampler& d, float hz, float gain, float seconds, float rate = kRate) {
  d.note_on(1, hz, gain);
  Stereo out = render(d, seconds, rate);
  d.note_off(1);
  render(d, 0.3f, rate);
  return out;
}

// Which marker partial (3, 5 or 7) a note at `hz` carries: the strongest.
static int marker_of(const std::vector<float>& x, double hz, double rate) {
  int best = 0;
  double level = 0.0;
  for (int marker : {3, 5, 7}) {
    const double l = tone_level(x, hz * marker, rate, x.size() / 4, x.size());
    if (l > level) {
      level = l;
      best = marker;
    }
  }
  return level > 0.01 ? best : 0;
}

int main() {
  char label[200];
  Conformance spec;
  spec.name = "zone-sampler";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 14.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  // The built-in instrument: one note at gain 0.7 sits in the level window,
  // at the pitch of its key, on every one of its three zones.
  {
    device.init(kRate);
    Stereo out = play(device, 261.6256f, 0.7f, 1.0f);
    const double level = db(peak(out.left));
    std::snprintf(label, sizeof label, "built-in: one note peaks between -24 and -10 dBFS (%.1f)", level);
    EXPECT(level > -24.0 && level < -10.0, label);
    for (double key : {40.0, 60.0, 79.0}) {
      Stereo note = play(device, static_cast<float>(key_hz(key)), 0.7f, 1.0f);
      const double hz = dominant_frequency(note.left, kRate, key_hz(key) * 0.7, key_hz(key) * 1.4, 12000);
      std::snprintf(label, sizeof label, "built-in: key %.0f plays its own pitch", key);
      EXPECT_NEAR(hz, key_hz(key), key_hz(key) * 0.002, label);
    }
    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, static_cast<float>(key_hz(48 + 3 * n)), 0.7f);
    Stereo chord = render(device, 1.0f, kRate);
    std::snprintf(label, sizeof label, "built-in: ten held notes stay under full scale (peak %g)", peak(chord.left));
    EXPECT(peak(chord.left) < 0.9, label);
  }

  // The three-zone render: every key plays the pitch of the key, from the
  // zone it belongs to, on the keys inside a zone, between two and beyond.
  {
    struct Case {
      double key;
      int marker;
      const char* where;
    };
    const Case cases[] = {
        {48, 3, "on the first root"},      {60, 5, "on the second root"},  {72, 7, "on the third root"},
        {45, 3, "at a zone's low edge"},   {63, 5, "at a zone's high edge"}, {53, 3, "between, nearer the first"},
        {55, 5, "between, nearer the second"}, {65, 5, "between, nearer the second again"},
        {67, 7, "between, nearer the third"}, {54, 3, "halfway: the nearer root, then the earlier zone"},
        {36, 3, "an octave below the map"}, {24, 3, "two octaves below"},  {84, 7, "an octave above the map"},
        {93, 7, "far above"},
    };
    for (const Case& c : cases) {
      three_zones(device);
      Stereo out = play(device, static_cast<float>(key_hz(c.key)), 0.8f, 1.0f);
      const double expected = key_hz(c.key);
      const double hz = dominant_frequency(out.left, kRate, expected * 0.75, expected * 1.33, 12000);
      std::snprintf(label, sizeof label, "three zones: key %.0f (%s) plays %.2f Hz", c.key, c.where, expected);
      EXPECT_NEAR(hz, expected, expected * 0.001, label);
      std::snprintf(label, sizeof label, "three zones: key %.0f (%s) takes zone %d", c.key, c.where, c.marker);
      EXPECT(marker_of(out.left, hz, kRate) == c.marker, label);
    }
    // The pitch is the note's frequency, not the rounded key.
    three_zones(device);
    Stereo bent = play(device, 450.0f, 0.8f, 1.0f);
    EXPECT_NEAR(dominant_frequency(bent.left, kRate, 400.0, 500.0, 12000), 450.0, 0.3,
                "three zones: a note between two keys plays its own frequency");
    // The same at another device rate.
    three_zones(device, 44100.0f);
    Stereo other = play(device, static_cast<float>(key_hz(55)), 0.8f, 1.0f, 44100.0f);
    EXPECT_NEAR(dominant_frequency(other.left, 44100.0, 150.0, 260.0, 12000), key_hz(55), 0.2,
                "three zones: the pitch holds at a 44.1 kHz device rate");
  }

  // Root, fine tune and key tracking.
  {
    plain(device);
    ZoneSpec zone;
    zone.sample = add_sound(device, marked(440.0, 0, 2.0f, kRate));
    zone.root = 69, zone.tune = 50.0f;
    add_zone(device, zone);
    Stereo sharp = play(device, 440.0f, 0.8f, 1.0f);
    EXPECT_NEAR(dominant_frequency(sharp.left, kRate, 400.0, 500.0, 12000), 440.0 * std::pow(2.0, 50.0 / 1200.0), 0.3,
                "tune: +50 cents plays the root a quarter tone sharp");

    plain(device);
    zone.tune = 0.0f, zone.track = 0.0f;
    zone.sample = add_sound(device, marked(440.0, 0, 2.0f, kRate));
    add_zone(device, zone);
    Stereo fixed = play(device, 880.0f, 0.8f, 1.0f);
    EXPECT_NEAR(dominant_frequency(fixed.left, kRate, 300.0, 1200.0, 12000), 440.0, 0.3,
                "pitch tracking off: every key plays the sound as recorded");

    plain(device);
    zone.track = 1.0f;
    zone.sample = add_sound(device, marked(440.0, 0, 2.0f, kRate));
    add_zone(device, zone);
    device.set_param(p::kTune, 12.0f);
    device.set_param(p::kFine, 0.0f);
    Stereo up = play(device, 440.0f, 0.8f, 0.8f);
    EXPECT_NEAR(dominant_frequency(up.left, kRate, 600.0, 1200.0, 12000), 880.0, 0.6, "Tune +12 plays an octave up");
  }

  // Velocity layers, and the nearest layer for a velocity no layer holds.
  {
    plain(device);
    const int soft = add_sound(device, marked(key_hz(60), 3, 2.0f, kRate));
    const int loud = add_sound(device, marked(key_hz(60), 5, 2.0f, kRate));
    ZoneSpec zone;
    zone.sample = soft, zone.low_velocity = 20, zone.high_velocity = 63;
    add_zone(device, zone);
    zone.sample = loud, zone.low_velocity = 64, zone.high_velocity = 110;
    add_zone(device, zone);
    const float hz = static_cast<float>(key_hz(60));
    EXPECT(marker_of(play(device, hz, 0.3f, 0.6f).left, hz, kRate) == 3, "velocity: a soft note takes the soft layer");
    EXPECT(marker_of(play(device, hz, 0.7f, 0.6f).left, hz, kRate) == 5, "velocity: a hard note takes the loud layer");
    EXPECT(marker_of(play(device, hz, 0.05f, 0.6f).left, hz, kRate) == 3,
           "velocity: below every layer, the nearest one plays");
    EXPECT(marker_of(play(device, hz, 1.0f, 0.6f).left, hz, kRate) == 5,
           "velocity: above every layer, the nearest one plays");
  }

  // Zones that all match are layers and sound together; a zone's gain and pan.
  {
    plain(device);
    ZoneSpec zone;
    zone.sample = add_sound(device, marked(key_hz(60), 0, 2.0f, kRate));
    add_zone(device, zone);
    const float hz = static_cast<float>(key_hz(60));
    const double one = rms(play(device, hz, 0.8f, 0.6f).left, 12000);
    add_zone(device, zone);
    const double two = rms(play(device, hz, 0.8f, 0.6f).left, 12000);
    EXPECT_NEAR(db(two / one), 6.0, 0.3, "layers: two matching zones sound together");

    plain(device);
    zone.sample = add_sound(device, marked(key_hz(60), 0, 2.0f, kRate));
    zone.gain_db = -12.0f;
    add_zone(device, zone);
    EXPECT_NEAR(db(rms(play(device, hz, 0.8f, 0.6f).left, 12000) / one), -12.0, 0.2, "gain: a zone at -12 dB is 12 dB down");

    plain(device);
    zone.sample = add_sound(device, marked(key_hz(60), 0, 2.0f, kRate));
    zone.gain_db = 0.0f, zone.pan = -1.0f;
    add_zone(device, zone);
    Stereo panned = play(device, hz, 0.8f, 0.6f);
    EXPECT(rms(panned.right, 12000) < 1.0e-6 && std::fabs(db(rms(panned.left, 12000) / one)) < 0.2,
           "pan: hard left is silent on the right and unchanged on the left");
  }

  // Round robin: the positions of a group take turns, and a zone outside the
  // group plays on every note.
  {
    plain(device);
    ZoneSpec zone;
    zone.group = 1, zone.length = 3;
    for (int n = 0; n < 3; ++n) {
      zone.sample = add_sound(device, marked(key_hz(60), 3 + 2 * n, 1.0f, kRate));
      zone.position = n + 1;
      add_zone(device, zone);
    }
    const float hz = static_cast<float>(key_hz(60));
    const int expected[7] = {3, 5, 7, 3, 5, 7, 3};
    bool turns = true;
    for (int n = 0; n < 7; ++n) {
      if (marker_of(play(device, hz, 0.8f, 0.4f).left, hz, kRate) != expected[n]) turns = false;
    }
    EXPECT(turns, "round robin: three positions play in turn, over and over");
  }

  // Loops: a looped zone holds for as long as the key, an unlooped one ends
  // with its sound; a loop that matches repeats without a step; a crossfade
  // takes the step out of one that does not.
  {
    const double hz = 300.0;  // 160 frames a cycle at 48 kHz
    plain(device);
    ZoneSpec zone;
    zone.root = 60;
    zone.sample = add_sound(device, marked(hz, 0, 0.25f, kRate));
    add_zone(device, zone);
    Stereo once = play(device, static_cast<float>(key_hz(60)), 0.8f, 1.0f);
    EXPECT(rms(once.left, 2000, 10000) > 0.1 && peak(once.left, 14000) == 0.0,
           "no loop: the note ends with its sound, and ends in exact silence");
    EXPECT(max_step(once.left, 10000) < 0.05, "no loop: the end of the sound is faded, not cut");

    plain(device);
    zone.sample = add_sound(device, marked(hz, 0, 0.25f, kRate));
    zone.loop_mode = 1, zone.loop_start = 1600, zone.loop_end = 1600 + 160 * 50;
    add_zone(device, zone);
    Stereo held = play(device, static_cast<float>(key_hz(60)), 0.8f, 2.0f);
    EXPECT(rms(held.left, 72000) > 0.2, "loop: the note holds for as long as the key");
    const double clean = 0.8 * 0.5 * 2.0 * kPi * hz / kRate;  // the steepest step of the sine itself, at the voice gain
    std::snprintf(label, sizeof label, "loop: a loop of whole cycles repeats without a step (%g against %g)",
                  max_step(held.left, 4800), clean);
    EXPECT(max_step(held.left, 4800) < clean * 1.05, label);
    EXPECT_NEAR(dominant_frequency(held.left, kRate, 250.0, 350.0, 48000), hz, 0.05, "loop: the pitch holds through the loop");

    // A quarter of a cycle too long: the jump lands off the wave.
    plain(device);
    zone.sample = add_sound(device, marked(hz, 0, 0.25f, kRate));
    zone.loop_end = 1600 + 160 * 50 + 40;
    add_zone(device, zone);
    Stereo jump = play(device, static_cast<float>(key_hz(60)), 0.8f, 1.0f);
    plain(device);
    zone.sample = add_sound(device, marked(hz, 0, 0.25f, kRate));
    zone.crossfade = 1500;
    add_zone(device, zone);
    Stereo blended = play(device, static_cast<float>(key_hz(60)), 0.8f, 1.0f);
    std::snprintf(label, sizeof label, "loop: a crossfade takes the step out of a loop that does not match (%g, %g without)",
                  max_step(blended.left, 4800), max_step(jump.left, 4800));
    EXPECT(max_step(jump.left, 4800) > 0.15 && max_step(blended.left, 4800) < clean * 1.5, label);

    // While held: the loop is left on release and the rest of the sound plays.
    plain(device);
    device.set_param(p::kRelease, 12.0f);
    std::vector<float> two_part = marked(hz, 0, 0.5f, kRate);
    for (size_t i = 12000; i < two_part.size(); ++i) {
      two_part[i] = 0.5f * static_cast<float>(std::sin(2.0 * kPi * 900.0 * static_cast<double>(i) / kRate));
    }
    zone = ZoneSpec();
    zone.sample = add_sound(device, two_part);
    zone.loop_mode = 2, zone.loop_start = 1600, zone.loop_end = 1600 + 160 * 50;
    add_zone(device, zone);
    device.note_on(1, static_cast<float>(key_hz(60)), 0.8f);
    Stereo during = render(device, 1.0f, kRate);
    device.note_off(1);
    Stereo after = render(device, 1.0f, kRate);
    EXPECT(tone_level(during.left, 900.0, kRate, 24000) < 0.01, "loop while held: the key holds the loop");
    EXPECT(tone_level(after.left, 900.0, kRate, 0, 24000) > 0.02 && peak(after.left, 36000) == 0.0,
           "loop while held: released, the rest of the sound plays and ends");
  }

  // Start and end frames.
  {
    plain(device);
    std::vector<float> sound = marked(key_hz(60), 0, 1.0f, kRate);
    for (size_t i = 0; i < 24000; ++i) sound[i] = 0.0f;
    ZoneSpec zone;
    zone.sample = add_sound(device, sound);
    zone.start = 24000, zone.end = 36000;
    add_zone(device, zone);
    Stereo out = play(device, static_cast<float>(key_hz(60)), 0.8f, 1.0f);
    EXPECT(rms(out.left, 480, 4800) > 0.2 && peak(out.left, 13000) == 0.0,
           "start and end: the note plays from the start frame and stops at the end frame");
  }

  // Polyphony: 32 keys sound at once, the pool holds 48, and a steal fades.
  {
    three_zones(device);
    for (int n = 0; n < 32; ++n) device.note_on(n, static_cast<float>(key_hz(40 + n)), 0.5f);
    render(device, 0.1f, kRate);
    std::snprintf(label, sizeof label, "polyphony: 32 held keys are 32 voices (%d)", device.sounding());
    EXPECT(device.sounding() == 32, label);
    for (int n = 32; n < 80; ++n) device.note_on(n, static_cast<float>(key_hz(40 + n % 40)), 0.5f);
    Stereo out = render(device, 0.1f, kRate);
    std::snprintf(label, sizeof label, "polyphony: the pool holds %d voices (%d)", ZoneSampler::kMaxVoices, device.sounding());
    EXPECT(device.sounding() == ZoneSampler::kMaxVoices && finite(out.left), label);
    for (int n = 0; n < 80; ++n) device.note_off(n);
    render(device, 1.0f, kRate);
    EXPECT(device.sounding() == 0, "polyphony: every voice is freed on release");

    // One voice, stolen by the next note: the old one fades over the tail.
    plain(device);
    ZoneSpec zone;
    zone.sample = add_sound(device, marked(200.0, 0, 3.0f, kRate));
    zone.loop_mode = 1;
    add_zone(device, zone);
    for (int n = 0; n < ZoneSampler::kMaxVoices; ++n) device.note_on(n, 200.0f * (1.0f + 0.001f * n), 0.02f);
    render(device, 0.3f, kRate);
    device.note_on(900, 200.0f, 0.02f);
    Stereo stolen = render(device, 0.05f, kRate);
    std::snprintf(label, sizeof label, "polyphony: a stolen voice fades instead of stepping (%g)", max_step(stolen.left));
    EXPECT(max_step(stolen.left) < 0.2, label);
  }

  // A new instrument while notes sound: what was playing fades, nothing reads
  // the old sounds, and the device goes back to sleep.
  {
    three_zones(device);
    for (int n = 0; n < 6; ++n) device.note_on(n, static_cast<float>(key_hz(48 + 4 * n)), 0.8f);
    Stereo before = render(device, 0.2f, kRate);
    device.zones_begin();
    Stereo cut = render(device, 0.05f, kRate);
    Stereo rest = render(device, 0.5f, kRate);
    std::snprintf(label, sizeof label, "new instrument: what was sounding fades out (step %g)", max_step(cut.left));
    EXPECT(max_step(cut.left) < std::max(0.1, 1.5 * max_step(before.left)) && device.sounding() == 0, label);
    EXPECT(peak(rest.left, 12000) == 0.0, "new instrument: then exact silence");
    device.note_on(1, 440.0f, 0.8f);
    EXPECT(peak(render(device, 0.2f, kRate).left) == 0.0, "new instrument: an empty one plays nothing");
    // A zone added now plays at once: an instrument can grow a note at a time.
    ZoneSpec zone;
    zone.sample = add_sound(device, marked(key_hz(60), 0, 1.0f, kRate));
    add_zone(device, zone);
    EXPECT(rms(play(device, static_cast<float>(key_hz(60)), 0.8f, 0.5f).left) > 0.1, "new instrument: an added zone plays at once");
  }

  // What does not fit is refused, and what is out of range is survived.
  {
    plain(device);
    EXPECT(device.zone_pool_capacity() == p::kZonePoolFloats && device.zone_capacity() == p::kZoneCapacity,
           "capacity: the entry points report the manifest's numbers");
    EXPECT(device.zone_sample(p::kZonePoolFloats + 1, 1, kRate) == -1, "capacity: a sound larger than the pool is refused");
    EXPECT(device.zone_sample(p::kZonePoolFloats / 2 + 1, 2, kRate) == -1, "capacity: a stereo sound counts twice");
    EXPECT(device.zone_sample(2, 1, kRate) == -1 && device.zone_sample(-5, 1, kRate) == -1,
           "capacity: an empty sound is refused");
    const int big = device.zone_sample(p::kZonePoolFloats - 1000, 1, kRate);
    EXPECT(big == 0 && device.zone_sample(1001, 1, kRate) == -1 && device.zone_sample(1000, 1, kRate) == 1,
           "capacity: the pool fills to the last float and no further");
    EXPECT(device.zone_sample_buffer(2) == nullptr && device.zone_sample_buffer(-1) == nullptr,
           "capacity: no buffer for a sound that is not there");

    plain(device);
    ZoneSpec zone;
    zone.sample = 3;
    EXPECT(add_zone(device, zone) == -1, "zones: a zone that names no sound is refused");
    std::vector<float> wild = marked(key_hz(60), 0, 0.5f, kRate);
    wild[100] = std::nanf("");
    wild[200] = 1.0e20f;
    zone.sample = add_sound(device, wild);
    float* f = device.zone_fields();
    for (int k = 0; k < ZoneSampler::kZoneFieldCount; ++k) f[k] = std::nanf("");
    f[ZoneSampler::kFieldSample] = 0.0f;
    EXPECT(device.zone_add() == 0, "zones: fields that are no number fall back to their defaults");
    f = device.zone_fields();
    for (int k = 0; k < ZoneSampler::kZoneFieldCount; ++k) f[k] = (k % 2 == 0 ? 1.0e30f : -1.0e30f);
    f[ZoneSampler::kFieldSample] = 0.0f;
    EXPECT(device.zone_add() == 1, "zones: fields far out of range are clamped");
    Stereo out = play(device, static_cast<float>(key_hz(60)), 0.9f, 0.6f);
    EXPECT(finite(out.left) && finite(out.right) && peak(out.left) < 1.01, "zones: a sound with NaN and runaway values plays finite");
    plain(device);
    zone = ZoneSpec();
    zone.sample = add_sound(device, marked(key_hz(60), 0, 0.01f, kRate));
    int added = 0;
    while (add_zone(device, zone) >= 0) ++added;
    EXPECT(added == p::kZoneCapacity, "zones: the zone table fills and then refuses");
  }

  // The single-sound entry points: one sound, every key, at its own pitch on
  // middle C.
  {
    plain(device);
    const int capacity = device.sample_capacity();
    std::vector<float> tone = marked(220.0, 0, 1.0f, kRate);
    float* buffer = device.sample_buffer();
    for (size_t i = 0; i < tone.size(); ++i) {
      buffer[i] = tone[i];
      buffer[capacity + i] = -tone[i];
    }
    device.sample_commit(static_cast<int>(tone.size()), 2, kRate);
    Stereo own = play(device, 261.6256f, 0.8f, 0.6f);
    EXPECT_NEAR(dominant_frequency(own.left, kRate, 150.0, 300.0, 9600), 220.0, 0.2, "one sound: middle C plays it as recorded");
    EXPECT(correlation(own.left, own.right, 9600) < -0.99, "one sound: both channels arrive, each on its side");
    Stereo fifth = play(device, 392.0f, 0.8f, 0.6f);
    EXPECT_NEAR(dominant_frequency(fifth.left, kRate, 250.0, 450.0, 9600), 220.0 * 392.0 / 261.6256, 0.3,
                "one sound: the keys transpose it");
  }

  // The knobs.
  {
    // Volume and Tone move without a click while a note sounds.
    three_zones(device);
    device.note_on(1, static_cast<float>(key_hz(48)), 0.8f);
    Stereo steady = render(device, 0.3f, kRate);
    device.set_param(p::kVolume, -30.0f);
    Stereo moved = render(device, 0.1f, kRate);
    std::snprintf(label, sizeof label, "volume: a jump of 30 dB is smoothed (step %g against %g)", max_step(moved.left),
                  max_step(steady.left, 9600));
    EXPECT(max_step(moved.left) < 1.5 * max_step(steady.left, 9600), label);
    EXPECT_NEAR(db(rms(render(device, 0.2f, kRate).left) / rms(steady.left, 9600)), -30.0, 0.5, "volume: it lands 30 dB down");

    three_zones(device);
    device.note_on(1, static_cast<float>(key_hz(48)), 0.8f);
    Stereo open = render(device, 0.5f, kRate);
    device.set_param(p::kTone, 200.0f);
    render(device, 0.1f, kRate);
    Stereo dark = render(device, 0.5f, kRate);
    EXPECT(tone_level(dark.left, key_hz(48) * 3, kRate) < 0.4 * tone_level(open.left, key_hz(48) * 3, kRate, 12000),
           "tone: closing it takes the upper partials down");

    // Velocity sensitivity scales the level; at zero it does not.
    three_zones(device);
    const float hz = static_cast<float>(key_hz(60));
    const double flat = db(rms(play(device, hz, 0.25f, 0.5f).left, 9600) / rms(play(device, hz, 1.0f, 0.5f).left, 9600));
    device.set_param(p::kVelocity, 1.0f);
    const double full = db(rms(play(device, hz, 0.25f, 0.5f).left, 9600) / rms(play(device, hz, 1.0f, 0.5f).left, 9600));
    EXPECT_NEAR(flat, 0.0, 0.1, "velocity at zero: every note at full level");
    EXPECT_NEAR(full, -12.04, 0.3, "velocity at one: a quarter of the velocity is a quarter of the level");

    // Attack and release times.
    three_zones(device);
    device.set_param(p::kAttack, 0.5f);
    device.set_param(p::kRelease, 1.0f);
    device.note_on(1, hz, 0.8f);
    Stereo rise = render(device, 1.0f, kRate);
    device.note_off(1);
    Stereo fall = render(device, 2.0f, kRate);
    EXPECT(rms(rise.left, 0, 4800) < 0.4 * rms(rise.left, 36000) && rms(rise.left, 24000, 28800) > 0.9 * rms(rise.left, 36000),
           "attack: half a second to arrive");
    EXPECT_NEAR(rt60(fall.left, kRate, 0.0, 0.05), 1.0, 0.15, "release: a second to fall 60 dB");

    // A knob moved while the device sleeps has arrived by the next note:
    // the same samples as a device that was set that way before it ever ran.
    auto one_zone = [&] {
      ZoneSpec zone;
      zone.sample = add_sound(device, marked(key_hz(60), 3, 1.0f, kRate));
      add_zone(device, zone);
    };
    plain(device);
    one_zone();
    render(device, 0.5f, kRate);
    device.set_param(p::kVolume, -20.0f);
    device.set_param(p::kTone, 900.0f);
    device.set_param(p::kTune, 7.0f);
    device.process(13);  // off the control clock's beat, were it still running
    device.note_on(1, hz, 0.8f);
    Stereo first = render(device, 0.2f, kRate);
    device.init(kRate);
    device.set_param(p::kAttack, 0.001f);
    device.set_param(p::kRelease, 0.02f);
    device.set_param(p::kVelocity, 0.0f);
    device.set_param(p::kVolume, -20.0f);
    device.set_param(p::kTone, 900.0f);
    device.set_param(p::kTune, 7.0f);
    device.zones_begin();
    one_zone();
    device.note_on(1, hz, 0.8f);
    Stereo reference = render(device, 0.2f, kRate);
    EXPECT(rms(first.left) > 0.01, "a note after a sleep sounds");
    EXPECT(first.left == reference.left, "a knob moved in silence has arrived when the next note starts");
  }

  // Output does not depend on the host's block size.
  {
    auto performance = [&](int block) {
      three_zones(device);
      device.set_param(p::kTone, 3000.0f);
      Stereo out;
      const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5};
      int which = 0;
      for (int step = 0; step < 40; ++step) {
        if (step == 0) device.note_on(1, static_cast<float>(key_hz(50)), 0.8f);
        if (step == 6) device.note_on(2, static_cast<float>(key_hz(66)), 0.6f);
        if (step == 12) device.set_param(p::kTune, 3.0f);
        if (step == 20) device.note_off(1);
        if (step == 30) device.note_off(2);
        // 1000 frames a step, in blocks of the size under test.
        int left = 1000;
        while (left > 0) {
          const int frames = std::min(left, block > 0 ? block : sizes[which++ % 8]);
          device.process(frames);
          out.left.insert(out.left.end(), device.out_left(), device.out_left() + frames);
          left -= frames;
        }
      }
      return out;
    };
    const Stereo whole = performance(128);
    const Stereo ragged = performance(0);
    const Stereo single = performance(1);
    EXPECT(whole.left == ragged.left && whole.left == single.left, "output does not depend on the block size");
  }

  // Cost: 32 voices of a stereo sound, looped.
  {
    plain(device);
    ZoneSpec zone;
    std::vector<float> sound = marked(key_hz(60), 3, 2.0f, kRate);
    zone.sample = add_sound(device, sound, sound, kRate);
    zone.loop_mode = 1, zone.loop_start = 4800, zone.crossfade = 2400;
    add_zone(device, zone);
    for (int n = 0; n < 32; ++n) device.note_on(n, static_cast<float>(key_hz(48 + n)), 0.3f);
    report_cost("zone-sampler (32 stereo voices)", 5.0f, kRate, [&] { render(device, 5.0f, kRate); });
    three_zones(device);
    for (int n = 0; n < 8; ++n) device.note_on(n, static_cast<float>(key_hz(48 + 3 * n)), 0.5f);
    report_cost("zone-sampler (8 mono voices)", 5.0f, kRate, [&] { render(device, 5.0f, kRate); });
  }

  return finish("zone-sampler");
}
