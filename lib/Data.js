/** 
 * @author: Wentao Shang
 * See COPYING for copyright and distribution information.
 */

var Name = require('./Name.js').Name;
var MetaInfo = require('./MetaInfo.js').MetaInfo;
var Signature = require('./Signature.js').Signature;
var KeyLocator = require('./KeyLocator.js').KeyLocator;
var NdnType = require('./NdnType.js').NdnType;
var Block = require('./Block.js').Block;

var LOG = 0;

var Data = function Data ()
{
    this.name = null;
    this.metainfo = null;
    this.content = null;
    this.signature = new Signature ();

    // internal use
    this.signed_bytes = null;
    this.sig_begin = 0;
    this.sig_end = 0;

    this.wire_format = null;
};

exports.Data = Data;

Data.prototype.from_tlv = function (block)
{
    if (LOG > 4)
	console.log ('Data.from_tlv: begin');

    var type = block.read_var_num ();
    if (type != NdnType.Data)
	throw new Error ('Data.from_tlv: wrong type');

    var len = block.read_var_num ();  // read length
    var end = block.head + len;  // end of Data

    this.sig_begin = block.head;
    this.wire_format = block.buffer;

    // Name
    this.name = new Name ();
    this.name.from_tlv (block);

    // MetaInfo
    this.metainfo = new MetaInfo ();  // metainfo is mandatory but allowed to be empty
    this.metainfo.from_tlv (block);
    
    // Content
    type = block.read_var_num ();
    if (type != NdnType.Content)
	throw new Error ('Data.from_tlv: wrong type for Content');

    len = block.read_var_num ();
    this.content = block.read_array (len);

    // Signature
    this.signature = new Signature ();
    this.signature.from_tlv (block);
    
    this.sig_end = block.head - this.signature.get_sig_length ();
    this.signed_bytes = block.buffer.slice (this.sig_begin, this.sig_end);

    if (LOG > 4)
	console.log ('Data.from_tlv: finish');
};

Data.parse = function (buf)
{
    var block = new Block (buf);
    var data = new Data ();
    data.from_tlv (block);
    return data;
};

Data.prototype.to_tlv = function (block)
{
    if (LOG > 4)
	console.log ('Data.to_tlv: begin');

    if (this.name == null)
	throw new Error ('Data.to_tlv: cannot encode empty name');

    var total_len = 0;

    // Encode backward
    if (this.signature == null)
	this.signature = new Signature ();

    this.sig_end = block.head - this.signature.get_sig_length ();

    total_len += this.signature.to_tlv (block);  // note: signature value may still be empty

    if (this.content == null) {
	total_len += block.push_var_num (0);  // encode zero length
	total_len += block.push_var_num (NdnType.Content);  // encode type
    } else {
	total_len += block.push_array (this.content, this.content.length);  // encode value
	total_len += block.push_var_num (this.content.length);  // encode length
	total_len += block.push_var_num (NdnType.Content);  // encode type
    }

    if (this.metainfo == null)
	this.metainfo = new MetaInfo ();  // create empty metainfo

    total_len += this.metainfo.to_tlv (block);

    total_len += this.name.to_tlv (block);

    this.sig_start = block.head;

    this.signed_bytes = block.buffer.slice (this.sig_start, this.sig_end);

    total_len += block.push_var_num (total_len);
    total_len += block.push_var_num (NdnType.Data);

    this.wire_format = block.finalize ();  //XXX: assume this block only contains the encoded Data packet
    
    if (LOG > 4)
	console.log ('Data.to_tlv: finish');

    return total_len;
};

/**
 * The 'key' parameter is a mandatory Key object
 */
Data.prototype.sign = function (key)
{
    if (key == null || key.privateKeyPem == null) {
	throw new Error ('Data.sign: invalid private key.');
    }

    if (this.signed_bytes == null) {
	// This Data packet is not encoded yet
	this.signature = new Signature ();
	this.signature.keyLocator = new KeyLocator ();
	this.signature.keyLocator.name = key.name;

	var block = new Block ();
	this.to_tlv (block);
    }

    var rsa = require ("crypto").createSign ('RSA-SHA256');
    rsa.update (this.signed_bytes);
    
    var sig = new Buffer (rsa.sign (key.privateKeyPem));

    this.signature.value = sig;
    
    sig.copy (this.wire_format, this.wire_format.length - sig.length);
};

Data.prototype.verify = function (key)
{
    if (key == null || key.publicKeyPem == null) {
	throw new Error ('Data.verify: invalid public key.');
    }

    var verifier = require ('crypto').createVerify ('RSA-SHA256');
    verifier.update (this.signed_bytes);
    return verifier.verify (key.publicKeyPem, this.signature.value);
};

Data.prototype.encodeToBinary = function ()
{
    if (this.wire_format == null) {
	var block = new Block ();
	this.to_tlv (block);
    }

    return this.wire_format;
};