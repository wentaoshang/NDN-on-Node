/**
 * @author: Jeff Thompson
 * See COPYING for copyright and distribution information.
 * Encapsulate an Uint8Array and support dynamic reallocation.
 */

/**
 * Ported to node.js by Wentao Shang
 */


/*
 * Create a DynamicBuffer where this.array is a Buffer of size length.
 * If length is not supplied, use a default initial length.
 * The methods will update this.length.
 * To access the array, use this.array or call subarray.
 */
var DynamicBuffer = function DynamicBuffer(length) {
    if (!length)
        length = 16;

    this.array = new Buffer(length);
    this.length = length;
};

exports.DynamicBuffer = DynamicBuffer;

/*
 * Ensure that this.array has the length, reallocate and copy if necessary.
 * Update this.length which may be greater than length.
 */
DynamicBuffer.prototype.ensureLength = function(length) {
    if (this.array.length >= length)
        return;
    
    // See if double is enough.
    var newLength = this.array.length * 2;
    if (length > newLength)
        // The needed length is much greater, so use it.
        newLength = length;
    
    var newArray = new Buffer(newLength);
    this.array.copy(newArray);
    this.array = newArray;
    this.length = newLength;
};

/*
 * Call this.array.set(value, offset), reallocating if necessary. 
 */
DynamicBuffer.prototype.set = function(value, offset) {
    this.ensureLength(value.length + offset);
    value.copy(this.array, offset);
};

/*
 * Return this.array.subarray(begin, end);
 */
DynamicBuffer.prototype.subarray = function(begin, end) {
    return this.array.slice(begin, end);
};

/*
 * The same as subarray()
 */
DynamicBuffer.prototype.slice = function(begin, end) {
    return this.array.slice(begin, end);
};
