/** 
 * @author: Wentao Shang
 * See COPYING for copyright and distribution information.
 */

var NdnType = require('./util/NdnType.js').NdnType;
var Block = require('./util/Block.js').Block;
var DataUtils = require('./util/DataUtils.js').DataUtils;
var Name = require('./Name.js').Name;
var Exclude = require('./Exclude.js').Exclude;

var LOG = 0;

var Selectors = function Selectors ()
{
    this.minSuffix = null;  // nonNegativeInteger
    this.maxSuffix = null;  // nonNegativeInteger
    this.publisherKey = null;  // Name
    this.exclude = null;  // Exclude
    this.childSelector = null;  // nonNegativeInteger
    this.fresh = null;  // zero length
};

exports.Selectors = Selectors;

Selectors.prototype.from_tlv = function (block)
{
     if (LOG > 4)
	console.log ('Selectors.from_tlv: begin');

    var type = block.read_var_num ();  // read type
    if (type != NdnType.Selectors)
	throw new Error ('Selectors.from_tlv: wrong type');

    var len = block.read_var_num ();  // read length
    var end = block.head + len;  // end of Selectors

    while (block.head < end) {
	var t = block.peek_var_num ();  // peek type
        if (t == NdnType.MinSuffixComponents) {
	    var t = block.read_var_num ();  // read type
	    var l = block.read_var_num ();  // read length
            this.minSuffix = block.read_nonneg_int (l);  //read value
        } else if (t == NdnType.MaxSuffixComponents) {
	    var t = block.read_var_num ();  // read type
	    var l = block.read_var_num ();  // read length
	    this.maxSuffix = block.read_nonneg_int (l);  // read value
	} else if (t == NdnType.PublisherPublicKeyLocator) {
	    this.publisherKey = new Name ();
	    this.publisherKey.from_tlv (block);
	} else if (t == NdnType.Exclude) {
	    this.exclude = new Exclude ();
	    this.exclude.from_tlv (block);
	} else if (t == NdnType.ChildSelector) {
	    var t = block.read_var_num ();  // read type
	    var l = block.read_var_num ();  // read length
	    this.childSelector = block.read_nonneg_int (l);  // read value
	} else if (t == NdnType.MustBeFresh) {
	    var t = block.read_var_num ();  // read type
	    var l = block.read_var_num ();  // read length
	    if (l != 0)
		throw new Error ('Selectors.from_tlv: wrong length for MustBeFresh');

	    this.fresh = true;
	} else
            throw new Error ('Selectors.from_tlv: unknown type for Selectors value');
    }
    
    if (block.head != end)
	throw new Error ('Selectors.from_tlv: wrong length');

    if (LOG > 4)
	console.log ('Selectors.from_tlv: finish');
};

Selectors.parse = function (buf)
{
    var block = new Block (buf);
    var sel = new Selectors ();
    sel.from_tlv (block);
    return sel;
};

Selectors.prototype.to_tlv = function (block)
{
    var val_len = 0;

    // Encode backward
    if (this.fresh != null) {
	val_len += block.push_var_num (0);  // encode length
	val_len += block.push_var_num (NdnType.MustBeFresh);  // encode type
    }

    if (this.childSelector != null) {
	var l = block.push_nonneg_int (this.childSelector);  // encode value
	val_len += l;
	val_len += block.push_var_num (l);  // encode length
	val_len += block.push_var_num (NdnType.ChildSelector);  // encode type
    }

    if (this.exclude != null) {
	val_len += this.exclude.to_tlv (block);  // encode Exclude
    }

    if (this.publisherKey != null) {
	var l = this.publisherKey.to_tlv (block);  // encode value
	val_len += l;
	val_len += block.push_var_num (l);  // encode length
	val_len += block.push_var_num (NdnType.PublisherPublicKeyLocator);  // encode type
    }

    if (this.maxSuffix != null) {
	var l = block.push_nonneg_int (this.maxSuffix);  // encode value
	val_len += l;
	val_len += block.push_var_num (l);  // encode length
	val_len += block.push_var_num (NdnType.MaxSuffixComponents);  // encode type
    }

    if (this.minSuffix != null) {
	var l = block.push_nonneg_int (this.minSuffix);  // encode value
	val_len += l;
	val_len += block.push_var_num (l);  // encode length
	val_len += block.push_var_num (NdnType.MinSuffixComponents);  // encode type
    }

    var total_len = val_len;
    total_len += block.push_var_num (val_len);  // encode length
    total_len += block.push_var_num (NdnType.Selectors);  // encode type

    if (LOG > 4)
	console.log ('Selectors.to_tlv: finish');

    return total_len;
};

Selectors.prototype.encodeToBinary = function ()
{
    var block = new Block ();
    this.to_tlv (block);
    return block.finalize ();
};
