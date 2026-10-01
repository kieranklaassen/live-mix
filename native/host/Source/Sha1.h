// SHA-1 for the WebSocket handshake (RFC 6455 §4.2.2 wants it and JUCE's
// cryptography module does not carry it). Not used for anything secret.

#pragma once

#include <array>
#include <cstdint>
#include <cstring>
#include <string>

namespace livemix
{

inline std::array<uint8_t, 20> sha1 (const std::string& input)
{
    uint32_t h[5] = { 0x67452301u, 0xEFCDAB89u, 0x98BADCFEu, 0x10325476u, 0xC3D2E1F0u };

    std::string message = input;
    const uint64_t bitLength = static_cast<uint64_t> (input.size()) * 8u;
    message.push_back (static_cast<char> (0x80));
    while (message.size() % 64 != 56)
        message.push_back ('\0');
    for (int shift = 56; shift >= 0; shift -= 8)
        message.push_back (static_cast<char> ((bitLength >> shift) & 0xffu));

    const auto rotl = [] (uint32_t value, int bits) { return (value << bits) | (value >> (32 - bits)); };

    for (size_t offset = 0; offset < message.size(); offset += 64)
    {
        uint32_t w[80];
        for (int i = 0; i < 16; ++i)
        {
            const auto* p = reinterpret_cast<const uint8_t*> (message.data()) + offset + static_cast<size_t> (i) * 4;
            w[i] = (static_cast<uint32_t> (p[0]) << 24) | (static_cast<uint32_t> (p[1]) << 16)
                 | (static_cast<uint32_t> (p[2]) << 8) | static_cast<uint32_t> (p[3]);
        }
        for (int i = 16; i < 80; ++i)
            w[i] = rotl (w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);

        uint32_t a = h[0], b = h[1], c = h[2], d = h[3], e = h[4];
        for (int i = 0; i < 80; ++i)
        {
            uint32_t f, k;
            if (i < 20)      { f = (b & c) | (~b & d);          k = 0x5A827999u; }
            else if (i < 40) { f = b ^ c ^ d;                   k = 0x6ED9EBA1u; }
            else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDCu; }
            else             { f = b ^ c ^ d;                   k = 0xCA62C1D6u; }

            const uint32_t temp = rotl (a, 5) + f + e + k + w[i];
            e = d;
            d = c;
            c = rotl (b, 30);
            b = a;
            a = temp;
        }
        h[0] += a; h[1] += b; h[2] += c; h[3] += d; h[4] += e;
    }

    std::array<uint8_t, 20> digest {};
    for (size_t i = 0; i < 5; ++i)
        for (size_t j = 0; j < 4; ++j)
            digest[i * 4 + j] = static_cast<uint8_t> ((h[i] >> (24 - 8 * j)) & 0xffu);
    return digest;
}

} // namespace livemix
