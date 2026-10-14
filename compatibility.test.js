import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import varint from './exports/index.js'
import encode from './exports/encode.js'
import decode from './exports/decode.js'
import length from './exports/length.js'

test('published runtime is byte-identical to the existing Git dependency', async () => {
  for (const file of ['index.js', 'encode.js', 'decode.js', 'length.js']) {
    const original = execFileSync('git', ['show', `a7bcb37c7816865b361a9483a3062eeabc2e2cb1:exports/${file}`])
    assert.deepEqual(await readFile(new URL(`exports/${file}`, import.meta.url)), original)
  }
  assert.equal(varint.encode, encode)
  assert.equal(varint.decode, decode)
  assert.equal(varint.encodingLength, length)
})

function reference(value) {
  let number = BigInt(value)
  const bytes = []
  do {
    const byte = Number(number & 127n)
    number >>= 7n
    bytes.push(byte | (number ? 128 : 0))
  } while (number)
  return bytes
}

test('safe integer boundaries and deterministic vectors keep canonical bytes', () => {
  const values = new Set([0, 1, 127, 128, 255, 300, Number.MAX_SAFE_INTEGER])
  for (let bit = 1; bit <= 52; bit++) {
    for (const delta of [-1, 0, 1]) values.add(2 ** bit + delta)
  }
  let seed = 42n
  for (let index = 0; index < 1000; index++) {
    seed = (seed * 6364136223846793005n + 1n) & 9007199254740991n
    values.add(Number(seed))
  }
  for (const value of values) {
    const expected = reference(value)
    assert.deepEqual(encode(value), expected)
    assert.equal(encode.bytes, expected.length)
    assert.equal(length(value), expected.length)
    const output = new Uint8Array(expected.length + 4)
    encode(value, output, 2)
    assert.equal(decode(output, 2), value)
    assert.equal(decode.bytes, expected.length)
  }
})

test('range errors and unsupported native BigInt behavior are preserved', () => {
  assert.throws(() => encode(Number.MAX_SAFE_INTEGER + 1), RangeError)
  assert.equal(encode.bytes, 0)
  assert.throws(() => encode(1n), TypeError)
  for (const bytes of [[], [128], new Array(20).fill(255)]) {
    assert.throws(() => decode(bytes), RangeError)
    assert.equal(decode.bytes, 0)
  }
})
