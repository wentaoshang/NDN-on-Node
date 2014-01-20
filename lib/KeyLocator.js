/** 
 * @author: Wentao Shang
 * See COPYING for copyright and distribution information.
 */

var Name = require('./Name.js').Name;
var Block = require('./Block.js').Block;
var NdnType = require('./NdnType.js').NdnType;

var LOG = 0;

var KeyLocator = function KeyLocator ()
{
    this.name = null;
    this.digest = null;
};

exports.KeyLocator = KeyLocator;

KeyLocator.prototype.from_tlv = function (block)
{
    if (LOG > 4)
	console.log('KeyLocator.from_tlv: begin');

    var type = block.read_var_num ();  // read type
    if (type != NdnType.KeyLocator)
	throw new Error ('KeyLocator.from_tlv: wrong type');

    var len = block.read_var_num ();  // read length
    var end = block.head + len;  // end of Interest

    while (block.head < end) {
	type = block.peek_var_num ();
	if (type == NdnType.Name) {
	    this.name = new Name ();
	    this.name.from_tlv (block);
	    this.digest = null;
	} else if (type == NdnType.KeyLocatorDigest) {
	    type = block.read_var_num ();
	    len = block.read_var_num ();
	    this.digest = block.read_array (len);
	    this.name = null;
	} else
	    throw new Error ('KeyLocator.from_tlv: unknown type inside KeyLocator');
    }

    if (block.head != end)
	throw new Error ('KeyLocator.from_tlv: wrong length');

    if (LOG > 4)
	console.log ('KeyLocator.from_tlv: finish');
};

KeyLocator.parse = function (buf)
{
    var block = new Block (buf);
    var kl = new KeyLocator ();
    kl.from_tlv (block);
    return kl;
};

KeyLocator.prototype.to_tlv = function (block)
{
    if (LOG > 4)
	console.log ('KeyLocator.to_tlv: begin');

    var total_len = 0;

    if (this.name != null) {
	// Ignore digest field if name is present
	total_len = this.name.to_tlv (block);
    } else if (this.digest != null) {
	// Encode KeyLocatorDigest
	total_len = block.push_array (this.digest, this.digest.length);
	total_len += block.push_var_num (this.digest.length);
	total_len += block.push_var_num (NdnType.KeyLocatorDigest);
    } else
	throw new Error ('KeyLocator.to_tlv: invalid object');

    total_len += block.push_var_num (total_len);
    total_len += block.push_var_num (NdnType.KeyLocator);

    if (LOG > 4)
	console.log ('KeyLocator.to_tlv: finish');

    return total_len;
};

KeyLocator.prototype.encodeToBinary = function ()
{
    var block = new Block ();
    this.to_tlv (block);
    return block.finalize ();
};
