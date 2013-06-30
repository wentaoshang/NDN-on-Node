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
 * Convert the big endian Buffer to an unsigned int.
 */
DataUtils.bigEndianToUnsignedInt = function (/*Buffer*/ bytes) {
    return parseInt(bytes.toString('hex'), 16);
};

/*
 * Convert the int value to a new big endian Buffer and return.
 * If value is 0 or negative, return Buffer(0). 
 */
DataUtils.nonNegativeIntToBigEndian = function (value) {
    value = Math.round(value);
    if (value <= 0)
        return new Buffer(0);
    
    var hex = value.toString(16);
    if (hex.length % 2 == 1)
	hex = '0' + hex;
    
    return new Buffer(hex, 'hex');
};
