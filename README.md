# @vandeurenglenn/varint

ESM fork of Chris Dickinson's MIT-licensed `varint` 6.0.0. This scoped
release preserves the numeric runtime from commit `a7bcb37c7816865b361a9483a3062eeabc2e2cb1`.
Version 6.1 adds separate BigInt functions; the legacy numeric API is unchanged.

```sh
npm install @vandeurenglenn/varint
```

Use `import varint from '@vandeurenglenn/varint'`. Existing consumers may retain
their `varint` import through the npm alias `npm:@vandeurenglenn/varint@^6.1.0`.
Legacy inputs are JavaScript Numbers up to `Number.MAX_SAFE_INTEGER`.
Upstream source: https://github.com/chrisdickinson/varint

## Exact BigInt values

```js
import { encodeBigInt, decodeBigInt, encodingLengthBigInt } from '@vandeurenglenn/varint/bigint'

const amount = 1_000_000_000_000_000_000_000n
const bytes = encodeBigInt(amount)
decodeBigInt(bytes) === amount // true
encodingLengthBigInt(amount) === bytes.length // true
```

These functions also exist on the default export. Encode accepts only BigInt;
decode always returns BigInt. Both support offsets and `.bytes` counters like
the legacy functions. Lengths and byte counters are Numbers.

The unsigned range is 0 through 2^256-1, not arbitrary-size integers. Decoding
is limited to 37 bytes and rejects truncated, overflowing and non-canonical
encodings. Bytes match the numeric encoder throughout its safe integer range.
The old numeric decoder must not be used for values above its safe range;
using BigInt in a protocol field still requires explicit agreement by callers.

> encode whole numbers to an array of [protobuf-style varint bytes](https://developers.google.com/protocol-buffers/docs/encoding#varints) and also decode them.

```js
import varint from 'varint'

var bytes = varint.encode(300) // === [0xAC, 0x02]
varint.decode(bytes) // 300
varint.decode.bytes // 2 (the last decode() call required 2 bytes)
```

## api

### varint = await import('varint')
<br>

### varint.encode(num[, buffer=[], offset=0]) -> buffer

Encodes `num` into `buffer` starting at `offset`. returns `buffer`, with the encoded varint written into it. If `buffer` is not provided, it will default to a new array.

`varint.encode.bytes` will now be set to the number of bytes
modified.
<br>
<br>

### varint.decode(data[, offset=0]) -> number

decodes `data`, which can be either a buffer or array of integers, from position `offset` or default 0 and returns the decoded original integer.

Throws a `RangeError` when `data` does not represent a valid encoding.
<br>
<br>

### varint.decode.bytes

if you also require the length (number of bytes) that were required to decode the integer you can access it via `varint.decode.bytes`. this is an integer property that will tell you the number of bytes that the last .decode() call had to use to decode.
<br>
<br>

### varint.encode.bytes

similar to `decode.bytes` when encoding a number it can be useful to know how many bytes where written (especially if you pass an output array). you can access this via `varint.encode.bytes` which holds the number of bytes written in the last encode.
<br>
<br>

### varint.encodingLength(num)

returns the number of bytes this number will be encoded as, up to a maximum of 8.
<br>
<br>

## usage notes

If varint is passed a buffer that does not contain a valid end
byte, then `decode` will throw `RangeError`, and `decode.bytes` 
will be set to 0. If you are reading from a streaming source,
it's okay to pass an incomplete buffer into `decode`, detect this
case, and then concatenate the next buffer.

# License

MIT
