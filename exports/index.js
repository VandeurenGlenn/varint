import encode from './encode.js';
import decode from './decode.js';
import encodingLength from './length.js';
import { encodeBigInt, decodeBigInt, encodingLengthBigInt } from './bigint.js';

var index = {
    encode,
    decode,
    encodingLength,
    encodeBigInt,
    decodeBigInt,
    encodingLengthBigInt
};

export { index as default };
export { encodeBigInt, decodeBigInt, encodingLengthBigInt };
