/**
 * This class contains utilities to help parse the data
 * author: Meki Cheraoui, Jeff Thompson
 * See COPYING for copyright and distribution information.
 */

/**
 * Ported to node.js by Wentao Shang
 */


var DataUtils = function DataUtils () {};

exports.DataUtils = DataUtils;

/*
 * arrays is an array of Buffers. Return a new Buffer which is the concatenation of all.
 */
DataUtils.concatArrays = function (arrays) {
    return Buffer.concat(arrays);
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
 * Throw Error ff value is negative. 
 */
DataUtils.unsignedIntToBigEndian = function (value) {
    if (value < 0)
        throw new NoNError('DataUtilsError', 'require unsigned int but get negative value: ' + value);

    var hex = Math.round(value).toString(16);
    if (hex.length % 2 == 1)
	hex = '0' + hex;
    
    return new Buffer(hex, 'hex');
};

DataUtils.toHex = function (buf) { return buf.toString('hex'); };
DataUtils.toString = function (buf) { return buf.toString(); };
DataUtils.toNumbers = function (str) { return new Buffer(str, 'hex'); };
DataUtils.toNumbersFromString = function (str) { return new Buffer(str); };
