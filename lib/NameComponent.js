/** 
 * @author: Wentao Shang
 * See COPYING for copyright and distribution information.
 */

var NdnType = require('./util/NdnType.js').NdnType;
var Block = require('./util/Block.js').Block;
var DataUtils = require('./util/DataUtils.js').DataUtils;

var LOG = 0;

var NameComponent = function NameComponent (buf)
{
    this.buffer = buf;
};

exports.NameComponent = NameComponent;

// Convert URI string to Buffer. Handles special characters such as '%00'
// new Buffer(component, 'ascii') will encode '%00' as 0x20 (space)
// new Buffer(component, 'utf8') will encode '%C1' as a two-byte unicode character
// Both won't help in this case
NameComponent.from_string = function (str)
{
    var buf = new Buffer (str.length);  // at least this length
    var pos = 0;  // # of bytes encoded into the Buffer
    var i = 0;
    while (i < str.length) {
	if (str[i] == '%') {
	    var hex = str.substr (i+1, 2);
	    buf[pos] = parseInt (hex, 16);
	    i += 2;
	} else
	    buf[pos] = str.charCodeAt (i);

	i++;
	pos++;
    }
    return new NameComponent (buf.slice (0, pos));
};

NameComponent.prototype.toEscapedString = function ()
{
    var result = "";
    var gotNonDot = false;
    for (var i = 0; i < this.buffer.length; i++) {
        if (this.buffer[i] != 0x2e) {
            gotNonDot = true;
            break;
        }
    }
    if (!gotNonDot) {
        // Special case for component of zero or more periods.  Add 3 periods.
        result = "...";
        for (var i = 0; i < this.buffer.length; ++i)
            result += ".";
    }
    else {
        for (var i = 0; i < this.buffer.length; ++i) {
            var value = this.buffer[i];
            // Check for 0-9, A-Z, a-z, (+), (-), (.), (_)
            if (value >= 0x30 && value <= 0x39 || value >= 0x41 && value <= 0x5a ||
                value >= 0x61 && value <= 0x7a || value == 0x2b || value == 0x2d || 
                value == 0x2e || value == 0x5f)
                result += String.fromCharCode(value);
            else
                result += "%" + (value < 16 ? "0" : "") + value.toString(16).toUpperCase();
        }
    }
    return result;
};

/**
 * Compare two name components according to CCNx canonical ordering rule
 * If comp1 < comp2, return -1
 * If comp1 = comp2, return 0
 * If comp1 > comp2, return 1
 * components can be either string or Buffer objects
 */
NameComponent.compare = function (comp1, comp2)
{
    if (!(comp1 instanceof NameComponent) || !(comp2 instanceof NameComponent))
	throw new Error('Cannot compare Name components of unsupported type.');

    if (comp1.buffer.length < comp2.buffer.length)
        return -1;
    if (comp1.buffer.length > comp2.buffer.length)
        return 1;
    
    for (var i = 0; i < comp1.buffer.length; ++i) {
        if (comp1.buffer[i] < comp2.buffer[i])
            return -1;
        if (comp1.buffer[i] > comp2.buffer[i])
            return 1;
    }

    return 0;
};


NameComponent.prototype.from_tlv = function (block)
{
    if (LOG > 4)
	console.log ('NameComponent.from_tlv: begin');

    var type = block.read_var_num ();  // read type
    if (type != NdnType.NameComponent)
	throw new Error ('NameComponent.from_tlv: wrong type');

    var len = block.read_var_num ();  // read length
    this.buffer = block.read_array (l);

    if (LOG > 4)
	console.log ('NameComponent.from_tlv: finish');
};

NameComponent.prototype.to_tlv = function (block)
{
    if (LOG > 4)
	console.log ('NameComponent.to_tlv: begin');

    if (this.buffer == null || this.buffer.length == 0)
	throw new Error ('NameComponent.to_tlv: cannot encode empty name component.');

    var total_len = 0;
    // Encode backward
    total_len += block.push_array (this.buffer, this.buffer.length);  // encode value
    total_len += block.push_var_num (this.buffer.length);  // encode length
    total_len += block.push_var_num (NdnType.NameComponent);  // encode type

    if (LOG > 4)
	console.log ('NameComponent.to_tlv: finish');

    return total_len;
};

NameComponent.prototype.clone = function ()
{
    var buf = new Buffer (this.buffer);
    return new NameComponent (buf);
};