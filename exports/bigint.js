// Unsigned base-128 varints. Bound decoding to 256 bits (37 bytes), enough
// for token amounts while preventing unbounded work on untrusted input.
const MAX = (1n << 256n) - 1n;

function checkValue(value) {
    if (typeof value !== 'bigint') throw new TypeError('Expected a BigInt');
    if (value < 0n || value > MAX) throw new RangeError('Expected an unsigned 256-bit integer');
}

function checkBuffer(buffer, offset) {
    if (!Array.isArray(buffer) && !(buffer instanceof Uint8Array))
        throw new TypeError('Expected an Array or Uint8Array');
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > buffer.length)
        throw new RangeError('Invalid varint offset');
}

export function encodingLengthBigInt(value) {
    checkValue(value);
    let length = 1;
    while (value >= 128n) {
        value >>= 7n;
        length++;
    }
    return length;
}

export function encodeBigInt(value, out = [], offset = 0) {
    encodeBigInt.bytes = 0;
    const length = encodingLengthBigInt(value);
    checkBuffer(out, offset);
    if (out instanceof Uint8Array && out.length - offset < length)
        throw new RangeError('Varint output buffer is too small');
    for (let index = 0; index < length; index++) {
        const byte = Number(value & 127n);
        value >>= 7n;
        out[offset + index] = byte | (value ? 128 : 0);
    }
    encodeBigInt.bytes = length;
    return out;
}

export function decodeBigInt(buffer, offset = 0) {
    decodeBigInt.bytes = 0;
    checkBuffer(buffer, offset);
    let value = 0n;
    for (let index = 0; index < 37; index++) {
        if (offset + index >= buffer.length) throw new RangeError('Truncated varint');
        const byte = buffer[offset + index];
        if (!Number.isInteger(byte) || byte < 0 || byte > 255)
            throw new RangeError('Invalid varint byte');
        value |= BigInt(byte & 127) << BigInt(index * 7);
        if (value > MAX) throw new RangeError('Varint exceeds 256 bits');
        if (byte < 128) {
            if (index > 0 && byte === 0) throw new RangeError('Non-canonical varint');
            decodeBigInt.bytes = index + 1;
            return value;
        }
    }
    throw new RangeError('Varint exceeds 256 bits');
}
