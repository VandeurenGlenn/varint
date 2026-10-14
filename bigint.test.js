import assert from 'node:assert/strict'
import test from 'node:test'
import varint, { encodeBigInt, decodeBigInt, encodingLengthBigInt } from '@vandeurenglenn/varint'
import * as bigint from '@vandeurenglenn/varint/bigint'

test('BigInt exports and numeric API stay separate', () => {
  assert.equal(varint.encodeBigInt, bigint.encodeBigInt)
  assert.equal(varint.decodeBigInt, bigint.decodeBigInt)
  assert.equal(varint.decode([1]), 1)
  assert.equal(decodeBigInt([1]), 1n)
  assert.throws(() => varint.encode(1n), TypeError)
  assert.throws(() => encodeBigInt(1), TypeError)
})

test('safe integer values have exactly the established wire bytes', () => {
  for (let bit = 0; bit <= 52; bit++) {
    for (const delta of [-1, 0, 1]) {
      const value = 2 ** bit + delta
      assert.deepEqual(encodeBigInt(BigInt(value)), varint.encode(value))
      assert.equal(decodeBigInt(varint.encode(value)), BigInt(value))
    }
  }
  assert.deepEqual(encodeBigInt(BigInt(Number.MAX_SAFE_INTEGER)), varint.encode(Number.MAX_SAFE_INTEGER))
})

test('large values, 256-bit boundaries and offsets retain exact precision', () => {
  const values = [0n, 300n, 1n << 53n, (1n << 64n) - 1n, 10n ** 30n, (1n << 256n) - 1n]
  for (let bit = 1n; bit <= 255n; bit++) values.push((1n << bit) - 1n, 1n << bit, (1n << bit) + 1n)
  for (const value of values) {
    const bytes = encodeBigInt(value)
    assert.equal(encodeBigInt.bytes, bytes.length)
    assert.equal(encodingLengthBigInt(value), bytes.length)
    assert.equal(decodeBigInt(bytes), value)
    assert.equal(decodeBigInt.bytes, bytes.length)
    const buffer = new Uint8Array(bytes.length + 4).fill(99)
    assert.equal(encodeBigInt(value, buffer, 2), buffer)
    assert.equal(decodeBigInt(buffer, 2), value)
    assert.equal(buffer[0], 99)
    assert.equal(buffer.at(-1), 99)
  }
  assert.equal(encodingLengthBigInt((1n << 256n) - 1n), 37)
})

test('invalid, truncated, overlong and overflowing values fail within the bound', () => {
  for (const value of [-1n, 1n << 256n]) {
    assert.throws(() => encodeBigInt(value), RangeError)
    assert.equal(encodeBigInt.bytes, 0)
    assert.throws(() => encodingLengthBigInt(value), RangeError)
  }
  const original = new Uint8Array([99])
  assert.throws(() => encodeBigInt(128n, original), RangeError)
  assert.deepEqual(original, new Uint8Array([99]))
  for (const offset of [-1, 0.5, NaN, 2]) assert.throws(() => decodeBigInt([1], offset), RangeError)
  for (const bytes of [[], [128], [128, 0], [129, 0], [256], [-1], [1.5], new Array(1000).fill(255), [...new Array(36).fill(255), 16]]) {
    assert.throws(() => decodeBigInt(bytes), RangeError)
    assert.equal(decodeBigInt.bytes, 0)
  }
})
