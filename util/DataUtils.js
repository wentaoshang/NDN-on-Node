/**
 * This class contains utilities to help parse the data
 * author: Meki Cheraoui, Jeff Thompson
 * See COPYING for copyright and distribution information.
 */

/**
 * Ported to node.js by Wentao Shang
 */


var DataUtils = function DataUtils () {};

/*
 * arrays is an array of Buffers. Return a new Buffer which is the concatenation of all.
 */
DataUtils.concatArrays = function (arrays) {
    var totalLength = 0;
    for (var i = 0; i < arrays.length; ++i)
        totalLength += arrays[i].length;
    
    var result = new Buffer(totalLength);
    var offset = 0;
    for (var i = 0; i < arrays.length; ++i) {
	arrays[i].copy(result, offset);
        offset += arrays[i].length;
    }
    return result;
}

/**
 * Return true if a1 and a2 are the same length with equal elements.
 */
DataUtils.arraysEqual = function (a1, a2) {
    if (a1.length != a2.length)
        return false;
    
    for (var i = 0; i < a1.length; ++i) {
        if (a1[i] != a2[i])
            return false;
    }

    return true;
};

/*
 * Convert the big endian Uint8Array to an unsigned int.
 * Don't check for overflow.
 */
DataUtils.bigEndianToUnsignedInt = function (bytes) {
    var result = 0;
    for (var i = 0; i < bytes.length; ++i) {
        result <<= 8;
        result += bytes[i];
    }
    return result;
};

/*
 * Convert the int value to a new big endian Buffer and return.
 * If value is 0 or negative, return Buffer(0). 
 */
DataUtils.nonNegativeIntToBigEndian = function (value) {
    value = Math.round(value);
    if (value <= 0)
        return new Buffer(0);
    
    // Assume value is not over 64 bits.
    var size = 8;
    var result = new Buffer(size);
    var i = 0;
    while (value != 0) {
        ++i;
        result[size - i] = value & 0xff;
        value >>= 8;
    }
    return result.slice(size - i, size);
};
