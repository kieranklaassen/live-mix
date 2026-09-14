// CPython's `random` module, the parts the tuin selector's `random.choice`
// consumes: MT19937 seeded exactly as `random.seed(int)` seeds it
// (`init_by_array` over the integer's 32-bit words), `getrandbits(k)` for
// k ≤ 32, and `_randbelow_with_getrandbits`. With it a TypeScript run of the
// selector picks the same tracks as the Python run for the same seed, which
// is what the parity goldens assert.

const N = 624
const M = 397
const MATRIX_A = 0x9908b0df
const UPPER_MASK = 0x80000000
const LOWER_MASK = 0x7fffffff

export class PythonRandom {
  private readonly mt = new Uint32Array(N)
  private index = N + 1

  /** `random.seed(seed)` for a non-negative integer seed (any size; bigints allowed). */
  constructor(seed: number | bigint = 0) {
    this.seed(seed)
  }

  seed(seed: number | bigint): void {
    let value = typeof seed === 'bigint' ? seed : BigInt(Math.trunc(seed))
    if (value < 0n) value = -value
    const key: number[] = []
    while (value > 0n) {
      key.push(Number(value & 0xffffffffn))
      value >>= 32n
    }
    if (key.length === 0) key.push(0)
    this.initByArray(key)
  }

  /** The next 32-bit word (`genrand_uint32`). */
  nextUint32(): number {
    const mt = this.mt
    if (this.index >= N) {
      let kk = 0
      for (; kk < N - M; kk += 1) {
        const y = (mt[kk] & UPPER_MASK) | (mt[kk + 1] & LOWER_MASK)
        mt[kk] = mt[kk + M] ^ (y >>> 1) ^ (y & 1 ? MATRIX_A : 0)
      }
      for (; kk < N - 1; kk += 1) {
        const y = (mt[kk] & UPPER_MASK) | (mt[kk + 1] & LOWER_MASK)
        mt[kk] = mt[kk + (M - N)] ^ (y >>> 1) ^ (y & 1 ? MATRIX_A : 0)
      }
      const y = (mt[N - 1] & UPPER_MASK) | (mt[0] & LOWER_MASK)
      mt[N - 1] = mt[M - 1] ^ (y >>> 1) ^ (y & 1 ? MATRIX_A : 0)
      this.index = 0
    }
    let y = mt[this.index]
    this.index += 1
    y ^= y >>> 11
    y ^= (y << 7) & 0x9d2c5680
    y ^= (y << 15) & 0xefc60000
    y ^= y >>> 18
    return y >>> 0
  }

  /** `random.getrandbits(k)` for 0 < k ≤ 32. */
  getrandbits(k: number): number {
    if (k <= 0 || k > 32) throw new RangeError('live-mix: getrandbits supports 1..32 bits')
    return k === 32 ? this.nextUint32() : this.nextUint32() >>> (32 - k)
  }

  /** `random._randbelow(n)`: a uniform integer in `[0, n)`, rejection-sampled like CPython. */
  randbelow(n: number): number {
    if (!Number.isInteger(n) || n <= 0) throw new RangeError('live-mix: randbelow needs n ≥ 1')
    const k = bitLength(n)
    let r = this.getrandbits(k)
    while (r >= n) r = this.getrandbits(k)
    return r
  }

  /** `random.choice(seq)`. */
  choice<T>(items: readonly T[]): T {
    if (items.length === 0) throw new RangeError('live-mix: choice from an empty sequence')
    return items[this.randbelow(items.length)]
  }

  /** `random.random()`: 53-bit float in `[0, 1)`. */
  random(): number {
    const a = this.nextUint32() >>> 5
    const b = this.nextUint32() >>> 6
    return (a * 67108864 + b) / 9007199254740992
  }

  private initGenrand(s: number): void {
    const mt = this.mt
    mt[0] = s >>> 0
    for (let i = 1; i < N; i += 1) {
      const previous = mt[i - 1] ^ (mt[i - 1] >>> 30)
      mt[i] = (Math.imul(1812433253, previous) + i) >>> 0
    }
    this.index = N
  }

  private initByArray(key: readonly number[]): void {
    const mt = this.mt
    this.initGenrand(19650218)
    let i = 1
    let j = 0
    for (let k = Math.max(N, key.length); k > 0; k -= 1) {
      const previous = mt[i - 1] ^ (mt[i - 1] >>> 30)
      mt[i] = ((mt[i] ^ Math.imul(previous, 1664525)) + key[j] + j) >>> 0
      i += 1
      j += 1
      if (i >= N) {
        mt[0] = mt[N - 1]
        i = 1
      }
      if (j >= key.length) j = 0
    }
    for (let k = N - 1; k > 0; k -= 1) {
      const previous = mt[i - 1] ^ (mt[i - 1] >>> 30)
      mt[i] = ((mt[i] ^ Math.imul(previous, 1566083941)) - i) >>> 0
      i += 1
      if (i >= N) {
        mt[0] = mt[N - 1]
        i = 1
      }
    }
    mt[0] = 0x80000000
    this.index = N
  }
}

function bitLength(n: number): number {
  let bits = 0
  let value = n
  while (value > 0) {
    bits += 1
    value = Math.floor(value / 2)
  }
  return bits
}
