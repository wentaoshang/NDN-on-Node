/** 
 * @author: Jeff Thompson, Wentao Shang
 * See COPYING for copyright and distribution information.
 */

var Name = require('./Name.js').Name;
var Selectors = require('./Selectors.js').Selectors;
var Block = require('./Block.js').Block;
var NdnType = require('./NdnType.js').NdnType;

var LOG = 0;

var Interest = function Interest (name)
{		
    this.name = name;
    this.selectors = null;
    this.nonce = null;
    this.scope = null;
    this.interestLifetime = null; // in ms
};

exports.Interest = Interest;

Interest.prototype.from_tlv = function (block)
{
    if (LOG > 4)
	console.log('Interest.from_tlv: begin');

    var type = block.read_var_num ();  // read type
    if (type != NdnType.Interest)
	throw new Error ('Interest.from_tlv: wrong type');

    var len = block.read_var_num ();  // read length
    var end = block.head + len;  // end of Interest

    // read Name (mandatory)
    this.name = new Name ();
    this.name.from_tlv (block);

    // read optional fields
    while (block.head < end) {
	var t = block.peek_var_num ();  // peek type
	if (t == NdnType.Selectors) {
	    this.selectors = new Selectors ();
	    this.selectors.from_tlv (block);
	} else if (t == NdnType.Nonce) {  //XXX: should Nonce be mandatoray?
	    var t = block.read_var_num ();  // read type
	    var l = block.read_var_num ();  // read length
	    if (l != 4)
		throw new Error ('Interest.from_tlv: wrong length for Nonce');

	    this.nonce = block.read_nonneg_int (4);  // read Nonce as integer
	} else if (t == NdnType.Scope) {
	    var t = block.read_var_num ();  // read type
	    var l = block.read_var_num ();  // read length
	    this.scope = block.read_nonneg_int (l);
	} else if (t == NdnType.InterestLifetime) {
	    var t = block.read_var_num ();  // read type
	    var l = block.read_var_num ();  // read length
	    this.interestLifetime = block.read_nonneg_int (l);
	}
    }

    if (block.head != end)
	throw new Error ('Interest.from_tlv: wrong length');

    if (LOG > 4)
	console.log ('Interest.from_tlv: finish');
};

Interest.parse = function (buf)
{
    var block = new Block (buf);
    var inst = new Interest ();
    inst.from_tlv (block);
    return inst;
};

Interest.prototype.to_tlv = function (block)
{
    if (LOG > 4)
	console.log ('Interest.to_tlv: begin');

    if (this.name == null)
	throw new Error ('Interest.to_tlv: name cannot be empty');

    var val_len = 0;

    // Encode backward
    if (this.interestLifetime != null) {
	var l = block.push_nonneg_int (this.interestLifetime);  // encode value
	val_len += l;
	val_len += block.push_var_num (l);  // encode length
	val_len += block.push_var_num (NdnType.InterestLifetime);  // encode type
    }

    if (this.scope != null) {
	var l = block.push_nonneg_int (this.scope);  // encode value
	val_len += l;
	val_len += block.push_var_num (l);  // encode length
	val_len += block.push_var_num (NdnType.Scope);  // encode type
    }
    
    if (this.nonce != null) {
	// encode Nonce as 4 byte array
	block.push_byte (this.nonce);
	block.push_byte (this.nonce >> 8);
	block.push_byte (this.nonce >> 16);
	block.push_byte (this.nonce >> 24);
	val_len += 4;
	val_len += block.push_var_num (4);  // encode length
	val_len += block.push_var_num (NdnType.Nonce);  // encode type
    }
    
    if (this.selectors != null)
	val_len += this.selectors.to_tlv (block);
    
    val_len += this.name.to_tlv (block);

    var total_len = val_len;
    total_len += block.push_var_num (val_len);
    total_len += block.push_var_num (NdnType.Interest);

    if (LOG > 4)
	console.log ('Interest.to_tlv: finish');

    return total_len;
};

Interest.prototype.encodeToBinary = function ()
{
    var block = new Block ();
    this.to_tlv (block);
    return block.finalize ();
};


/*
 * Return true if this.name.match(name) and the name conforms to the interest selectors.
 */
Interest.prototype.matches_name = function (/*Name*/ name)
{
    if (!this.name.isPrefixOf (name))
        return false;
    
    if (this.selectors != null) {
	if (this.selectors.minSuffix != null &&
            // Add 1 for the implicit digest.
            !(name.components.length + 1 - this.name.components.length >= this.selectors.minSuffix))
            return false;

	if (this.selectors.maxSuffix != null &&
            // Add 1 for the implicit digest.
            !(name.components.length + 1 - this.name.components.length <= this.selectors.maxSuffix))
            return false;
    }

    if (this.exclude != null && name.components.length > this.name.components.length &&
        this.exclude.matches (name.components[this.name.components.length]))
        return false;
    
    return true;
};
