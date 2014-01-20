/** 
 * @author: Wentao Shang
 * See COPYING for copyright and distribution information.
 */


// The generic block storing wire format of NDN packet. Data always encodes backwards and decodes forwards.
var Block = function Block (buf)
{
    if (buf == null) {
	// Constructed for encoding
	this.buffer = new Buffer (8192);  // fixed size buffer
	this.head = 8192; // initially pointing to the head of the buffer
	// invariant: in encoding mode, head always points to the position of last written byte
    } else {
	// Constructed for decoding
	this.buffer = buf;
	this.head = 0;
	// invariant: in decoding mode, head always points to the position of the next byte to read
    }
};

exports.Block = Block;

Block.prototype.push_byte = function (num)
{
    if (this.head == 0)
	throw new Error ("Block.push_byte: out of buffer space");

    this.head--;
    this.buffer[this.head] = num & 0xff;
};

Block.prototype.push_var_num = function (num)
{
    if (num < 253) {
	this.push_byte (num);
	return 1;
    } else if (num >= 253 && num < 65536) {
	// Write backwards
	this.push_byte (num);
	this.push_byte (num >> 8);
	this.push_byte (253);
	return 3;
    } else if (num >= 65536 && num <= 0xffffffff) {
	// Write backwards
	this.push_byte (num);
	this.push_byte (num >> 8);
	this.push_byte (num >> 16);
	this.push_byte (num >> 24);
	this.push_byte (254);
	return 5;
    } else {
	//XXX: JavaScipt does not support 64bit integer!!
	throw new Error ('Block.push_var_num: number too large');
    }
};

// Static method
Block.var_num_length = function (num)
{
    if (num < 253)
	return 1;
    else if (num >= 253 && num < 65536)
	return 3;
    else if (num >= 65536 && num <= 0xffffffff)
	return 5;
    else //XXX: JavaScipt does not support 64bit integer!!
	throw new Error ('Block.var_num_length: number too large');
};

Block.prototype.push_array = function (arr, len)
{
    if (this.head < len)
	throw new Error ('Block.push_array: out of buffer space');

    this.head = this.head - len;
    arr.copy (this.buffer, this.head, 0, len);

    return len;
};

Block.prototype.push_nonneg_int = function (num)
{
    if (num < 0)
	throw new Error ('Block.push_nonneg_int: negative input number');
    
    if (num <= 0xff) {
	this.push_byte (num);
	return 1;
    } else if (num > 0xff && num <= 0xffff) {
	// Push backwards
	this.push_byte (num);
	this.push_byte (num >> 8);
	return 2;
    } else if (num > 0xffff && num <= 0xffffffff) {
	// Push backwards
	this.push_byte (num);
	this.push_byte (num >> 8);
	this.push_byte (num >> 16);
	this.push_byte (num >> 24);
	return 4;
    } else {
	//XXX: JavaScipt does not support 64bit integer!!
	throw new Error ('Block.push_nonneg_int: number too large');
    }
};

// Static method
Block.nonneg_int_length = function (num)
{
    if (num < 0)
	throw new Error ('Block.push_nonneg_int: negative input number');
    
    if (num <= 0xff) {
	return 1;
    } else if (num > 0xff && num <= 0xffff) {
	return 2;
    } else if (num > 0xffff && num <= 0xffffffff) {
	return 4;
    } else {
	//XXX: JavaScipt does not support 64bit integer!!
	throw new Error ('Block.nonneg_int_length: number too large');
    }
};

Block.prototype.finalize = function ()
{
    return this.buffer.slice (this.head, this.buffer.length);
};

Block.prototype.read_var_num = function ()
{
    if (this.head >= this.buffer.length)
	throw new Error ('Block.read_var_num: read byte after buffer end');

    var b0 = this.buffer[this.head];
    var num = 0;
    if (b0 < 253) {
	num = b0;
	this.head++;
    } else if (b0 == 253) {
	if (this.head + 2 >= this.buffer.length)
	    throw new Error ('Block.read_var_num: read 16 bit after buffer end');

	num = (this.buffer[this.head + 1] << 8) + this.buffer[this.head + 2];
	this.head = this.head + 3;
    } else if (b0 == 254) {
	if (this.head + 4 >= this.buffer.length)
	    throw new Error ('Block.read_var_num: read 32 bit after buffer end');

	num = (this.buffer[this.head + 1] << 24)
	    + (this.buffer[this.head + 2] << 16)
	    + (this.buffer[this.head + 3] << 8)
	    + this.buffer[this.head + 4];
	this.head = this.head + 5;
    } else {
	//XXX: JavaScipt does not support 64bit integer!!
	throw new Error ('Block.read_var_num: number too large');
    }
    return num;
};

Block.prototype.peek_var_num = function ()
{
    if (this.head >= this.buffer.length)
	throw new Error ('Block.read_var_num: read byte after buffer end');

    var b0 = this.buffer[this.head];
    var num = 0;
    if (b0 < 253) {
	num = b0;
    } else if (b0 == 253) {
	if (this.head + 2 >= this.buffer.length)
	    throw new Error ('Block.peek_var_num: read 16 bit after buffer end');

	num = (this.buffer[this.head + 1] << 8) + this.buffer[this.head + 2];
    } else if (b0 == 254) {
	if (this.head + 4 >= this.buffer.length)
	    throw new Error ('Block.peek_var_num: read 32 bit after buffer end');

	num = (this.buffer[this.head + 1] << 24)
	    + (this.buffer[this.head + 2] << 16)
	    + (this.buffer[this.head + 3] << 8)
	    + this.buffer[this.head + 4];
    } else {
	//XXX: JavaScipt does not support 64bit integer!!
	throw new Error ('Block.peek_var_num: number too large');
    }
    return num;
};

Block.prototype.read_nonneg_int = function (len)
{
    if (this.head + len > this.buffer.length)
	throw new Error ('Block.read_nonneg_int: read ' + len + ' bytes after buffer end');

    var num = 0;
    if (len == 1) {
	num = this.buffer[this.head];
	this.head++;
    } else if (len == 2) {
	num = (this.buffer[this.head] << 8) + this.buffer[this.head + 1];
	this.head = this.head + 2;
    } else if (len == 4) {
	num = (this.buffer[this.head] << 24)
	    + (this.buffer[this.head + 1] << 16)
	    + (this.buffer[this.head + 2] << 8)
	    + this.buffer[this.head + 3];
	this.head = this.head + 4;
    } else {
	//XXX: JavaScipt does not support 64bit integer!!
	throw new Error ('Block.read_nonneg_int: number too large');
    }
    return num;
};

// Returns a read-only copy of the buffer (without copying the data)
Block.prototype.read_array = function (len)
{
    if (this.head + len > this.buffer.length)
	throw new Error ('Block.read_array: read ' + len + ' bytes after buffer end');

    var buf = this.buffer.slice (this.head, this.head + len);
    this.head = this.head + len;
    return buf;
};

