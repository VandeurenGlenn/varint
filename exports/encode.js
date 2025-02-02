const MSB = 0x80;
const REST = 0x7F;
const MSBALL = ~REST;
const INT = Math.pow(2, 31);
const encode = (num, out, offset) => {
    if (Number.MAX_SAFE_INTEGER && num > Number.MAX_SAFE_INTEGER) {
        encode.bytes = 0;
        throw new RangeError('Could not encode varint');
    }
    out = out || [];
    offset = offset || 0;
    const oldOffset = offset;
    while (num >= INT) {
        out[offset++] = (num & 0xFF) | MSB;
        num /= 128;
    }
    while (num & MSBALL) {
        out[offset++] = (num & 0xFF) | MSB;
        num >>>= 7;
    }
    out[offset] = num | 0;
    encode.bytes = offset - oldOffset + 1;
    return out;
};

export { encode as default };
