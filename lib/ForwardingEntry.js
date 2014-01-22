/**
 * @author: Wentao Shang
 * See COPYING for copyright and distribution information.
 */

var Name = require('./Name.js').Name;
var Block = require('./Block.js').Block;

var LOG = 0;

var ForwardingEntry = function ForwardingEntry ()
{
    this.action = null;
    this.name = null;
    this.faceID = null;
    this.flags = null;
    this.freshness = null;  // in milliseconds
};

ForwardingEntry.ForwardingEntry = 129;
ForwardingEntry.Action = 131;
ForwardingEntry.Name = 2;
ForwardingEntry.FaceID = 132;
ForwardingEntry.ForwardingFlags = 138;
ForwardingEntry.FreshnessPeriod = 20;

exports.ForwardingEntry = ForwardingEntry;

ForwardingEntry.prototype.to_tlv = function (block)
{
    if (LOG > 4)
	console.log ('ForwardingEntry.to_tlv: begin');

    var total_len = 0;

    // Encode backward
    if (this.freshness != null) {
	var len = block.push_nonneg_int (this.freshness);
	total_len += len;
	total_len += block.push_var_num (len);
	total_len += block.push_var_num (ForwardingEntry.FreshnessPeriod);
    }

    if (this.flags != null) {
	var len = block.push_nonneg_int (this.flags);
	total_len += len;
	total_len += block.push_var_num (len);
	total_len += block.push_var_num (ForwardingEntry.ForwardingFlags);
    }

    if (this.faceID != null) {
	var len = block.push_nonneg_int (this.faceID);
	total_len += len;
	total_len += block.push_var_num (len);
	total_len += block.push_var_num (ForwardingEntry.FaceID);
    }

    if (this.name != null) {
	total_len += this.name.to_tlv (block);
    }

    if (this.action != null) {
	total_len += block.push_array (this.action, this.action.length);
	total_len += block.push_var_num (this.action.length);
	total_len += block.push_var_num (ForwardingEntry.Action);
    }

    total_len += block.push_var_num (total_len);
    total_len += block.push_var_num (ForwardingEntry.ForwardingEntry);

    if (LOG > 4)
	console.log ('ForwardingEntry.to_tlv: finish');
};

ForwardingEntry.prototype.encodeToBinary = function ()
{
    var block = new Block ();
    this.to_tlv (block);
    return block.finalize ();
};
