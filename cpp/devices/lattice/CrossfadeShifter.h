#pragma once
#include <algorithm>
#include <array>
#include <cmath>

#include "../../kit/math.h"

namespace lattice
{

/**
 * Time-domain pitch shifter in the H910/H949 lineage: two grains alternately
 * read a ring buffer at `ratio` speed and are crossfaded with complementary
 * Hann envelopes (a grain is spawned every H samples and lives 2H samples).
 *
 * De-glitch: when the caller supplies a confident input period, each new grain
 * is spawned an integer number of periods away from the grain that is currently
 * sounding, so the two are phase-coherent during the crossfade. This is the
 * period-synchronous form of the autocorrelation splice in US 4,464,784 (expired).
 *
 * Everything is fixed-size; process() is real-time safe.
 *
 * Ported from kkfonie Lattice/Source/CrossfadeShifter.{h,cpp} (header-only
 * here). The ring is 65536 samples instead of 32768 so a two-octave up-shift
 * with the longest window still fits at 96 kHz, and the grain envelope comes
 * from the kit's sine table; see device.json for the full list.
 */
class CrossfadeShifter
{
public:
    static constexpr int kBufferSize = 65536;      // power of two
    static constexpr int kMask = kBufferSize - 1;
    static constexpr float kMinRatio = 0.25f;
    static constexpr float kMaxRatio = 4.0f;

    void prepare(double newSampleRate)
    {
        livemix::kit::SineTable::init();
        sampleRate = newSampleRate;
        maxPeriod = static_cast<int>(std::ceil(sampleRate / kMinTrackedHz));
        minDelay = static_cast<int>(sampleRate * 0.002);
        setWindowSamples(static_cast<int>(sampleRate * 0.024));
        setHop(pendingHop);
        ratio = 1.0f;
        period = 0.0f;
        periodConfident = false;
        deglitch = true;
        reset();
    }

    void reset()
    {
        buffer.fill(0.0f);
        writePos = 0;
        restart();
    }

    /** Playback ratio (2.0 = octave up). Expected to be smoothed by the caller. */
    void setRatio(float r) { ratio = r < kMinRatio ? kMinRatio : (r > kMaxRatio ? kMaxRatio : r); }

    /** Grain hop in samples (crossfade window). Applied at the next grain spawn. */
    void setWindowSamples(int h)
    {
        // Worst case delay excursion: dMin + P + |1 - ratio| * 2H must fit in the buffer,
        // shifting down (ratio 0.25) as well as up (ratio 4).
        const float worstSlope = std::max(1.0f - kMinRatio, kMaxRatio - 1.0f);
        const int maxHop = static_cast<int>(static_cast<float>(kBufferSize - minDelay - maxPeriod - 8) / (2.0f * worstSlope));
        pendingHop = h < 64 ? 64 : (h > maxHop ? maxHop : h);
    }

    /** Input period for the de-glitch splice; `confident` = false disables alignment. */
    void setPeriod(float periodSamples, bool confident)
    {
        period = periodSamples;
        periodConfident = confident && periodSamples >= 2.0f;
    }

    void setDeglitch(bool enabled) { deglitch = enabled; }

    float process(float input)
    {
        buffer[static_cast<size_t>(writePos)] = input;

        if (samplesUntilSpawn <= 0)
        {
            setHop(pendingHop);
            spawnGrain(nextSlot);
            nextSlot = 1 - nextSlot;
            samplesUntilSpawn = hop;
        }
        --samplesUntilSpawn;

        const double delayStep = 1.0 - static_cast<double>(ratio);

        float sum = 0.0f;
        float gainSum = 0.0f;
        for (auto& g : grains)
        {
            if (!g.active) continue;
            if (g.age >= 2 * hop)
            {
                g.active = false;
                continue;
            }
            // sin^2 envelope over the grain's 2H life; the two grains are H apart so they sum to one.
            const float env = 0.5f - 0.5f * livemix::kit::SineTable::cos_lookup(envScale * static_cast<float>(g.age));
            sum += env * readInterpolated(g.delay);
            gainSum += env;

            g.delay += delayStep;
            if (g.delay < 1.0) g.delay = 1.0;
            else if (g.delay > static_cast<double>(kBufferSize - 4)) g.delay = static_cast<double>(kBufferSize - 4);
            ++g.age;
        }

        writePos = (writePos + 1) & kMask;

        // Normalising by the envelope sum keeps the level constant while the window length changes.
        return gainSum > 1.0e-4f ? sum / gainSum : sum;
    }

    /** Records the input without reading any grain: keeps the ring current for a voice that is switched off. */
    void feed(float input)
    {
        buffer[static_cast<size_t>(writePos)] = input;
        writePos = (writePos + 1) & kMask;
    }

    /** Drops both grains; the next process() spawns a fresh one. The ring is kept. */
    void restart()
    {
        for (auto& g : grains) g = Grain{};
        nextSlot = 0;
        samplesUntilSpawn = 0;
    }

    /** Mean latency of the shifter in samples (for information only). */
    int getMinimumDelay() const { return minDelay; }

private:
    static constexpr float kMinTrackedHz = 45.0f;   // must match PitchTracker::kMinHz

    struct Grain
    {
        double delay = 0.0;   // samples behind the write head
        int age = 0;          // samples since spawn
        bool active = false;
    };

    void setHop(int h)
    {
        hop = h;
        envScale = 1.0f / static_cast<float>(2 * hop);   // envelope phase in cycles per sample
    }

    float readInterpolated(double delay) const
    {
        // 4-point Hermite interpolation around the fractional read position.
        const double readPos = static_cast<double>(writePos) - delay;
        const double floored = std::floor(readPos);
        const int i1 = static_cast<int>(floored);
        const float frac = static_cast<float>(readPos - floored);
        const float y0 = buffer[static_cast<size_t>((i1 - 1) & kMask)];
        const float y1 = buffer[static_cast<size_t>(i1 & kMask)];
        const float y2 = buffer[static_cast<size_t>((i1 + 1) & kMask)];
        const float y3 = buffer[static_cast<size_t>((i1 + 2) & kMask)];
        const float c0 = y1;
        const float c1 = 0.5f * (y2 - y0);
        const float c2 = y0 - 2.5f * y1 + 2.0f * y2 - 0.5f * y3;
        const float c3 = 0.5f * (y3 - y0) + 1.5f * (y1 - y2);
        return ((c3 * frac + c2) * frac + c1) * frac + c0;
    }

    void spawnGrain(int slot)
    {
        Grain& g = grains[static_cast<size_t>(slot)];
        const Grain& other = grains[static_cast<size_t>(1 - slot)];

        // Nominal start: leave room for the delay to shrink over the grain's life when shifting up.
        const double drift = static_cast<double>(ratio - 1.0f) * 2.0 * static_cast<double>(hop);
        double start = static_cast<double>(minDelay) + (drift > 0.0 ? drift : 0.0);

        if (deglitch && periodConfident && other.active)
        {
            // Push the start back by less than one period so the two grains sit an integer
            // number of periods apart and stay phase-coherent through the crossfade.
            // Only moving towards longer delay keeps the grain clear of the write head.
            const double p = static_cast<double>(period);
            const double diff = other.delay - start;
            const double k = std::floor(diff / p);
            start = other.delay - k * p;
        }

        const double longest = static_cast<double>(kBufferSize - 4);
        start = start < 1.0 ? 1.0 : (start > longest ? longest : start);
        g.delay = start;
        g.age = 0;
        g.active = true;
    }

    std::array<float, kBufferSize> buffer{};
    int writePos = 0;

    std::array<Grain, 2> grains{};
    int nextSlot = 0;
    int samplesUntilSpawn = 0;

    double sampleRate = 48000.0;
    float ratio = 1.0f;
    int hop = 1024;             // H, in samples
    int pendingHop = 1024;
    float envScale = 1.0f / 2048.0f;
    int minDelay = 96;          // dMin: headroom so grains never cross the write head
    int maxPeriod = 1067;       // longest period the tracker can report

    float period = 0.0f;
    bool periodConfident = false;
    bool deglitch = true;
};

}  // namespace lattice
