#pragma once
#include <algorithm>
#include <cmath>

#include "../../kit/fft.h"

namespace lattice
{

/**
 * Monophonic pitch tracker using the McLeod Pitch Method (normalised square
 * difference function). The autocorrelation is computed with an FFT so a full
 * analysis costs two transforms per hop.
 *
 * All storage is fixed-size; pushSample() is real-time safe.
 *
 * Ported from kkfonie Lattice/Source/PitchTracker.{h,cpp}. Two things differ
 * from the original, both for the cost of a block in WASM:
 *
 * - Both transforms have real input (the zero-padded frame, then its power
 *   spectrum), so each runs as a complex kit::Fft of half the length on the
 *   even/odd samples packed as real/imaginary parts. The result is the same
 *   autocorrelation.
 * - The analysis is split over the hop: the frame is captured and transformed
 *   when the hop completes, the autocorrelation and the peak search follow
 *   half a hop later. A 128-frame block therefore never holds more than one
 *   transform, and the estimate is published hop/2 samples (2.7 ms at 48 kHz)
 *   after the frame it describes.
 */
class PitchTracker
{
public:
    static constexpr float kMinHz = 45.0f;
    static constexpr float kMaxHz = 2000.0f;
    static constexpr float kClarityThreshold = 0.6f;
    static constexpr float kPeakRatio = 0.9f;       // MPM "k" constant
    static constexpr float kRmsGate = 0.001f;        // -60 dBFS

    void prepare(double newSampleRate)
    {
        sampleRate = newSampleRate;
        frameSize = sampleRate > 50000.0 ? kMaxFrame : kMaxFrame / 2;
        hopSize = frameSize / 8;
        if (frameSize == kMaxFrame) fftLarge.init();
        else                        fftSmall.init();

        // exp(-2 pi i k / 2N) for the frame zero-padded to 2N, k = 0..N.
        for (int k = 0; k <= frameSize; ++k)
        {
            const double angle = 3.14159265358979323846 * static_cast<double>(k) / static_cast<double>(frameSize);
            twiddleCos[k] = static_cast<float>(std::cos(angle));
            twiddleSin[k] = static_cast<float>(std::sin(angle));
        }

        tauMin = std::max(2, static_cast<int>(sampleRate / kMaxHz));
        tauMax = std::min(frameSize / 2, static_cast<int>(sampleRate / kMinHz));

        reset();
    }

    void reset()
    {
        std::fill(ring, ring + kMaxFrame, 0.0f);
        ringWrite = 0;
        samplesSinceHop = 0;
        framePending = false;
        frameAudible = false;
        frameEnergy = 0.0f;
        transformCount = 0;
        voiced = false;
        frequencyHz = 0.0f;
        periodSamples = 0.0f;
        clarity = 0.0f;
    }

    /** Feed one mono sample. Returns true when a new analysis frame was produced. */
    bool pushSample(float x)
    {
        ring[ringWrite] = x;
        ringWrite = (ringWrite + 1) & (frameSize - 1);

        ++samplesSinceHop;
        if (samplesSinceHop == hopSize)
        {
            samplesSinceHop = 0;
            captureFrame();
            framePending = true;
            return false;
        }
        if (framePending && samplesSinceHop == hopSize / 2)
        {
            framePending = false;
            analyse();
            return true;
        }
        return false;
    }

    bool isVoiced() const { return voiced; }
    float getFrequency() const { return frequencyHz; }     // last confident estimate (held while unvoiced)
    float getPeriodSamples() const { return periodSamples; }
    float getConfidence() const { return clarity; }        // 0..1, 0 when unvoiced
    int getFrameSize() const { return frameSize; }
    int getHopSize() const { return hopSize; }
    /** Transforms run since prepare(): two per audible hop, never two on one sample. */
    long getTransformCount() const { return transformCount; }

private:
    static constexpr int kMaxFrame = 4096;

    /** First half: the frame's energy sums and its power spectrum. */
    void captureFrame()
    {
        const int N = frameSize;

        // Unroll the ring; the frame is the first half of a 2N transform, the rest is zero.
        // Even samples go to the real part, odd samples to the imaginary part.
        float energy = 0.0f;
        prefixSq[0] = 0.0f;
        for (int i = 0; i < N; i += 2)
        {
            const float even = ring[(ringWrite + i) & (N - 1)];
            const float odd = ring[(ringWrite + i + 1) & (N - 1)];
            re[i >> 1] = even;
            im[i >> 1] = odd;
            energy += even * even;
            prefixSq[i + 1] = energy;
            energy += odd * odd;
            prefixSq[i + 2] = energy;
        }
        frameEnergy = energy;

        const float rms = std::sqrt(energy / static_cast<float>(N));
        frameAudible = rms >= kRmsGate;
        if (!frameAudible)
            return;

        std::fill(re + N / 2, re + N, 0.0f);
        std::fill(im + N / 2, im + N, 0.0f);
        transform();

        // |X[k]|^2 for k = 0..N from the half-length transform Z:
        // X[k] = E[k] + w^k O[k], E = (Z[k] + conj Z[N-k]) / 2, O = -i (Z[k] - conj Z[N-k]) / 2.
        for (int k = 0; k <= N; ++k)
        {
            const int a = k & (N - 1);
            const int b = (N - k) & (N - 1);
            const float er = 0.5f * (re[a] + re[b]);
            const float ei = 0.5f * (im[a] - im[b]);
            const float odr = 0.5f * (im[a] + im[b]);
            const float odi = -0.5f * (re[a] - re[b]);
            const float wr = twiddleCos[k];
            const float wi = -twiddleSin[k];
            const float xr = er + wr * odr - wi * odi;
            const float xi = ei + wr * odi + wi * odr;
            power[k] = xr * xr + xi * xi;
        }
    }

    /** Second half: autocorrelation from the power spectrum, NSDF, peak picking. */
    void analyse()
    {
        const int N = frameSize;
        if (!frameAudible)
        {
            voiced = false;
            clarity = 0.0f;
            return;
        }

        // Autocorrelation via power spectrum. The spectrum is real and even over 2N
        // points, so its transform is the same packed half-length one.
        for (int n = 0; n < N / 2; ++n)
        {
            re[n] = power[2 * n];
            im[n] = power[2 * n + 1];
        }
        re[N / 2] = power[N];
        for (int n = N / 2 + 1; n < N; ++n) re[n] = re[N - n];
        for (int n = N / 2; n < N; ++n) im[n] = im[N - 1 - n];
        transform();

        // r(tau) = Re(E[tau] + w^tau O[tau]); r(0) first, to normalise so that r(0) == energy
        // regardless of the FFT engine's scaling convention.
        const float energy = frameEnergy;
        const float r0 = re[0] + im[0];
        if (r0 <= 0.0f)
        {
            voiced = false;
            clarity = 0.0f;
            return;
        }
        const float norm = energy / r0;

        // NSDF(tau) = 2 r(tau) / (sum x[j]^2 + sum x[j+tau]^2)
        for (int tau = 0; tau <= tauMax; ++tau)
        {
            const int a = tau;
            const int b = (N - tau) & (N - 1);
            const float corr = 0.5f * (re[a] + re[b]) + 0.5f * twiddleCos[tau] * (im[a] + im[b])
                             - 0.5f * twiddleSin[tau] * (re[a] - re[b]);
            const float r = corr * norm;
            const float m = (prefixSq[N - tau] - prefixSq[0]) + (prefixSq[N] - prefixSq[tau]);
            nsdf[tau] = m > 1.0e-12f ? 2.0f * r / m : 0.0f;
        }

        // Peak picking (MPM): one local maximum per positive lobe, parabolic-interpolated,
        // then the first peak that reaches kPeakRatio of the highest one.
        struct Peak { float tau; float value; };
        constexpr int kMaxPeaks = 64;
        Peak peaks[kMaxPeaks];
        int numPeaks = 0;
        float highestValue = 0.0f;

        int tau = 0;
        while (tau < tauMax && nsdf[tau] > 0.0f) ++tau;  // skip the zero-lag lobe

        while (tau < tauMax && numPeaks < kMaxPeaks)
        {
            while (tau < tauMax && nsdf[tau] <= 0.0f) ++tau;  // positive crossing
            if (tau >= tauMax) break;
            int maxIdx = tau;
            while (tau < tauMax && nsdf[tau] > 0.0f)
            {
                if (nsdf[tau] > nsdf[maxIdx]) maxIdx = tau;
                ++tau;
            }
            if (maxIdx >= tauMax - 1) break;   // maximum sits on the truncated edge: not a real peak
            if (maxIdx < tauMin) continue;

            float t = static_cast<float>(maxIdx);
            float v = nsdf[maxIdx];
            if (maxIdx > 0 && maxIdx < tauMax)
            {
                const float a = nsdf[maxIdx - 1];
                const float b = v;
                const float c = nsdf[maxIdx + 1];
                const float denom = a - 2.0f * b + c;
                if (denom < -1.0e-9f)           // concave: a genuine peak
                {
                    const float delta = std::clamp(0.5f * (a - c) / denom, -1.0f, 1.0f);
                    t += delta;
                    v = b - 0.25f * (a - c) * delta;
                }
            }
            peaks[numPeaks++] = {t, v};
            highestValue = std::max(highestValue, v);
        }

        float bestTau = 0.0f;
        float bestValue = 0.0f;
        for (int i = 0; i < numPeaks; ++i)
        {
            if (peaks[i].value >= kPeakRatio * highestValue)
            {
                bestTau = peaks[i].tau;
                bestValue = peaks[i].value;
                break;
            }
        }

        if (numPeaks == 0 || bestTau < static_cast<float>(tauMin) || bestValue < kClarityThreshold)
        {
            voiced = false;
            clarity = 0.0f;
            return;
        }

        const float hz = static_cast<float>(sampleRate) / bestTau;
        if (hz < kMinHz || hz > kMaxHz)
        {
            voiced = false;
            clarity = 0.0f;
            return;
        }

        voiced = true;
        clarity = std::min(1.0f, bestValue);
        frequencyHz = hz;
        periodSamples = bestTau;
    }

    /** Complex transform of length frameSize, in place on re/im. */
    void transform()
    {
        ++transformCount;
        if (frameSize == kMaxFrame) fftLarge.forward(re, im);
        else                        fftSmall.forward(re, im);
    }

    double sampleRate = 48000.0;
    int frameSize = 2048;
    int hopSize = 256;
    int tauMin = 24;
    int tauMax = 1024;

    livemix::kit::Fft<kMaxFrame / 2> fftSmall;   // 2048-sample frame (up to 50 kHz)
    livemix::kit::Fft<kMaxFrame> fftLarge;       // 4096-sample frame
    float ring[kMaxFrame] = {};
    float re[kMaxFrame] = {};
    float im[kMaxFrame] = {};
    float power[kMaxFrame + 1] = {};
    float twiddleCos[kMaxFrame + 1] = {};
    float twiddleSin[kMaxFrame + 1] = {};
    float prefixSq[kMaxFrame + 1] = {};
    float nsdf[kMaxFrame / 2 + 1] = {};
    int ringWrite = 0;
    int samplesSinceHop = 0;
    bool framePending = false;
    bool frameAudible = false;
    float frameEnergy = 0.0f;
    long transformCount = 0;

    bool voiced = false;
    float frequencyHz = 0.0f;
    float periodSamples = 0.0f;
    float clarity = 0.0f;
};

}  // namespace lattice
