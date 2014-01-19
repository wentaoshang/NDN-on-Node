/** 
 * @author: Wentao Shang
 * See COPYING for copyright and distribution information.
 */

var KeyLocator = require('./KeyLocator.js').KeyLocator;
var Block = require('./util/Block.js').Block;
var NdnType = require('./util/NdnType.js').NdnType;
var DataUtils = require('./util/DataUtils.js').DataUtils;

var LOG = 0;

var Signature = function Signature (type)
{
    this.type = type || Signature.SignatureSha256WithRsa;
    this.keyLocator = null;
    this.value = null;
};

exports.Signature = Signature;

Signature.DigestSha256 = 0;
Signature.SignatureSha256WithRsa = 1;

Signature.prototype.from_tlv = function (block)
{
    if (LOG > 4)
	console.log('Signature.from_tlv: begin');

    var type = block.read_var_num ();  // read type
    if (type != NdnType.SignatureInfo)
	throw new Error ('Signature.from_tlv: wrong SignatureInfo type');

    var len = block.read_var_num ();  // read length
    var end = block.head + len;  // end of SignatureInfo

    type = block.read_var_num ();
    if (type != NdnType.SignatureType)
	throw new Error ('Signature.from_tlv: expecting SignatureType');

    len = block.read_var_num ();
    if (len != 1)
	throw new Error ('Signature.from_tlv: wrong SignatureType length');

    this.type = block.read_nonneg_int (len);

    if (this.type == Signature.DigestSha256) {
	if (block.head != end)
	    throw new Error ('Signature.from_tlv: wrong SignatureInfo length');

	this.value = block.read_array (32);
    } else if (this.type == Signature.SignatureSha256WithRsa) {
	this.keyLocator = new KeyLocator ();
	this.keyLocator.from_tlv (block);
	if (block.head != end)
	    throw new Error ('Signature.from_tlv: wrong SignatureInfo length');

	this.value = block.read_array (128);
    } else
	throw new Error ('Signature.from_tlv: unsupported SignatureType value');

    if (LOG > 4)
	console.log('Signature.from_tlv: finish');
};

Signature.parse = function (buf)
{
    var block = new Block (buf);
    var sig = new Signature ();
    sig.from_tlv (block);
    return sig;
};

Signature.prototype.to_tlv = function (block)
{
    if (LOG > 4)
	console.log('Signature.to_tlv: begin');

    var total_len = 0;
    var info_len = 0;  // Length of SignatureInfo
    // Encode backward
    if (this.type == Signature.SignatureSha256WithRsa) {
	total_len = 128;
	// Reserve 128 bytes space for the signature to be filled in
	block.head -= total_len;
	// Encode keylocator
	info_len += this.keyLocator.to_tlv (block);
	// Encode signature type
	info_len += block.push_nonneg_int (this.type);
	info_len += block.push_var_num (1);
	info_len += block.push_var_num (NdnType.SignatureType);
    } else if (this.type == Signature.DigestSha256) {
	total_len = 32;
	// Reserve 32 bytes space for the signature to be filled in
	block.head -= total_len;
	// Encode signature type
	info_len += block.push_nonneg_int (this.type);
	info_len += block.push_var_num (1);
	info_len += block.push_var_num (NdnType.SignatureType);
    } else
	throw new Error ('Signature.to_tlv: unknown signature type');

    total_len += info_len;
    total_len += block.push_var_num (info_len);  // encode SignatureInfo length
    total_len += block.push_var_num (NdnType.SignatureInfo);

    if (LOG > 4)
	console.log('Signature.to_tlv: finish');
    
    return total_len;
};

Signature.prototype.get_sig_length = function ()
{
    if (this.type == Signature.DigestSha256)
	return 32;
    else if (this.type == Signature.SignatureSha256WithRsa)
	return 128;  // due to 1024 key bits
    else
	throw new Error ('Signature.get_sig_length: unknown signature type');
};