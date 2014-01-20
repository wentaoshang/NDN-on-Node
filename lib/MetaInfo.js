/** 
 * @author: Wentao Shang
 * See COPYING for copyright and distribution information.
 */

var NdnType = require('./NdnType.js').NdnType;
var Block = require('./Block.js').Block;

var LOG = 0;

var MetaInfo = function MetaInfo (type, fresh)
{
    this.contentType = type;
    this.freshnessPeriod = fresh;
};

exports.MetaInfo = MetaInfo;

MetaInfo.ContentType = {
    BLOB : 0,
    LINK : 1,
    KEY : 2
};

MetaInfo.prototype.from_tlv = function (block)
{
    if (LOG > 4)
	console.log ('MetaInfo.from_tlv: begin');

    var type = block.read_var_num ();  // read type
    if (type != NdnType.MetaInfo)
	throw new Error ('MetaInfo.from_tlv: wrong type');

    var len = block.read_var_num ();  // read length
    var end = block.head + len;  // end of MetaInfo

    this.contentType = null;
    this.freshnessPeriod = null;

    while (block.head < end) {
	var t = block.read_var_num ();  // read type
	var l = block.read_var_num ();  // read length
	var v = block.read_nonneg_int (l);  // read value
	if (t == NdnType.ContentType) {
	    if (v == 0)
		this.contentType = MetaInfo.ContentType.BLOB;
	    else if (v == 1)
		this.contentType = MetaInfo.ContentType.LINK;
	    else if (v == 2)
		this.contentType = MetaInfo.ContentType.KEY;
	    else
		throw new Error ('MetaInfo.from_tlv: unknown content type');
	} else if (t == NdnType.FreshnessPeriod) {
	    this.freshnessPeriod = v;
	} else
	    throw new Error ('MetaInfo.from_tlv: wrong type inside MetaInfo');
    }

    if (block.head != end)
	throw new Error ('MetaInfo.from_tlv: wrong length');

    if (LOG > 4)
	console.log ('MetaInfo.from_tlv: finish');
};

MetaInfo.parse = function (buf)
{
    var block = new Block (buf);
    var mi = new MetaInfo ();
    mi.from_tlv (block);
    return mi;
};

MetaInfo.prototype.to_tlv = function (block)
{
    if (LOG > 4)
	console.log ('MetaInfo.to_tlv: begin');

    // if (this.contentType == null && this.freshnesPeriod == null)
    // 	return 0;

    var val_len = 0;

    // Encode backward
    if (this.freshnessPeriod != null) {
	var l = block.push_nonneg_int (this.freshnessPeriod);
	val_len += l;
	val_len += block.push_var_num (l);
	val_len += block.push_var_num (NdnType.FreshnessPeriod);
    }

    if (this.contentType != null) {
	var l = block.push_nonneg_int (this.contentType);
	val_len += l;
	val_len += block.push_var_num (l);
	val_len += block.push_var_num (NdnType.ContentType);
    }

    var total_len = val_len;
    total_len += block.push_var_num (val_len);
    total_len += block.push_var_num (NdnType.MetaInfo);

    if (LOG > 4)
	console.log ('MetaInfo.to_tlv: finish');

    return total_len;
};

MetaInfo.prototype.encodeToBinary = function ()
{
    var block = new Block ();
    this.to_tlv (block);
    return block.finalize ();
};
