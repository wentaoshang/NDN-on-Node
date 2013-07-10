/**
 * @author: Meki Cheraoui
 * See COPYING for copyright and distribution information.
 * This class represents ContentObject Objects
 */

/**
 * Ported to node.js by Wentao Shang
 */
var Name = require('./Name.js').Name;
var NoNError = require('./util/NoNError.js').NoNError;
var BinaryXMLEncoder = require('./util/BinaryXMLEncoder.js').BinaryXMLEncoder;
var BinaryXMLDecoder = require('./util/BinaryXMLDecoder.js').BinaryXMLDecoder;
var CCNProtocolDTags = require('./util/CCNProtocolDTags.js').CCNProtocolDTags;
var CCNTime = require('./util/CCNTime.js').CCNTime;
var KeyLocator = require('./Key.js').KeyLocator;
var KeyLocatorType = require('./Key.js').KeyLocatorType;
var PublisherPublicKeyDigest = require('./PublisherPublicKeyDigest.js').PublisherPublicKeyDigest;

var LOG = 0;

/**
 * When creating ContentObject in JS code, _name and _content must be specified while _signedinfo is optional.
 */
var ContentObject = function ContentObject(_name, _content, _signedInfo) {	
    if (_name == null) {
	this.name = null;
    } else if (typeof _name == 'string') {
	this.name = new Name(_name);
    } else if (_name instanceof Name) {
	this.name = _name;
    } else
	throw new NoNError('ContentObjectError', 'unknown name type ' + _name.constructor.name);
    
    if (_content == null) {
	this.content = null;
    } else if (typeof _content == 'string') {
	this.content = new Buffer(_content);
    } else if (_content instanceof Buffer) {
	this.content = _content;
    } else
	throw new NoNError('ContentObjectError', 'unknown content type ' + _content.constructor.name);
    
    this.signedInfo = _signedInfo;  // may be null

    this.signature = null;

    this.startSIG = null;
    this.endSIG = null;
    this.signedData = null;
};

exports.ContentObject = ContentObject;

/**
 * The 'key' parameter is a mandatory Key object
 * The optional 'param' is a JSON object that may contain the following fields:
 * { keyName: the name of the 'key'; if this field is present, the KeyLocator of this ContentObject will be filled with KeyName rather than Key bits
 *   contentType: the type of the ContentObject; if this filed is null, the default ContentType.DATA is used
 *   freshness: a number in seconds
 *   finalBlockID: a integer indicating the segment number of the final block
 * }
 * This 'param' is a high-level interface to set SignedInfo fields through ContentObject methods
 */
ContentObject.prototype.sign = function (key, param) {
    if (key == null || key.privateKeyPem == null) {
	throw new NoNError('ConteotObjectError', "cannot sign data without a private key.");
    }

    // Set SignedInfo if it's empty
    if (this.signedInfo == null) {
	this.signedInfo = new SignedInfo();
	this.signedInfo.setFields(key, param);
    }

    var n1 = this.encodeObject(this.name);
    var n2 = this.encodeObject(this.signedInfo);
    var n3 = this.encodeContent();

    var rsa = require("crypto").createSign('RSA-SHA256');
    rsa.update(n1);
    rsa.update(n2);
    rsa.update(n3);
    
    var sig = new Buffer(rsa.sign(key.privateKeyPem));

    this.signature = new Signature();
    this.signature.signature = sig;
};

ContentObject.prototype.verify = function (/*Key*/ key) {
    if (key == null || key.publicKeyPem == null) {
	throw new NoNError('ConteotObjectError', "cannot verify data without a public key.");
    }

    var verifier = require('crypto').createVerify('RSA-SHA256');
    verifier.update(this.signedData);
    return verifier.verify(key.publicKeyPem, this.signature.signature);
};

ContentObject.prototype.encodeObject = function encodeObject(obj) {
    var enc = new BinaryXMLEncoder(); 
    obj.to_ccnb(enc);
    return enc.getReducedOstream();
};

ContentObject.prototype.encodeContent = function encodeContent(obj) {
    var enc = new BinaryXMLEncoder();
    enc.writeElement(CCNProtocolDTags.Content, this.content);
    return enc.getReducedOstream();	
};

ContentObject.prototype.saveSignedData = function (bytes) {
    var sig = bytes.slice(this.startSIG, this.endSIG);
    this.signedData = sig;
};

ContentObject.prototype.from_ccnb = function (decoder) {
    if (LOG > 4) console.log('--------Start decoding ContentObject...');

    decoder.readStartElement(this.getElementLabel());

    if (decoder.peekStartElement(CCNProtocolDTags.Signature)) {
	this.signature = new Signature();
	this.signature.from_ccnb(decoder);
    }

    this.startSIG = decoder.offset;

    this.name = new Name();
    this.name.from_ccnb(decoder);
    
    if (decoder.peekStartElement(CCNProtocolDTags.SignedInfo)) {
	this.signedInfo = new SignedInfo();
	this.signedInfo.from_ccnb(decoder);
    }
    
    this.content = decoder.readBinaryElement(CCNProtocolDTags.Content);

    this.endSIG = decoder.offset;
    	
    decoder.readEndElement();
    
    this.saveSignedData(decoder.istream);

    if (LOG > 4) console.log('--------Finish decoding ContentObject.');
};

ContentObject.prototype.to_ccnb = function (encoder) {
    if (LOG > 4) console.log('--------Encoding ContentObject...');

    encoder.writeStartElement(this.getElementLabel());

    if (null != this.signature)
	this.signature.to_ccnb(encoder);
    
    this.startSIG = encoder.offset;
    
    if (null != this.name)
	this.name.to_ccnb(encoder);
    
    if (null != this.signedInfo)
	this.signedInfo.to_ccnb(encoder);

    encoder.writeElement(CCNProtocolDTags.Content, this.content);

    this.endSIG = encoder.offset;
    
    encoder.writeEndElement();
    
    //this.saveSignedData(encoder.ostream);

    if (LOG > 4) console.log('--------Finish encoding ContentObject');
};

/**
 * encoding can be 'hex' or 'base64'; if null, will use 'hex' by default
 */
ContentObject.prototype.to_xml = function (encoding) {
    var xml = '<ContentObject>';

    if (encoding == null)
	encoding = 'hex';  // default choice

    if (null != this.signature)
	xml += this.signature.to_xml(encoding);
    
    if (null != this.name)
	xml += this.name.to_xml(encoding);
    
    if (null != this.signedInfo)
	xml += this.signedInfo.to_xml(encoding);

    xml += '<Content ccnbencoding="' + encoding + 'Binary">' + this.content.toString(encoding).toUpperCase() + '</Content>';

    xml += '</ContentObject>';
    return xml;
};


ContentObject.prototype.encodeToBinary = function () {
    var enc = new BinaryXMLEncoder();
    this.to_ccnb(enc);
    return enc.getReducedOstream();
};

/**
 * Static method to parse a Buffer containing ccnb-formated ContentObject bytes.
 * Return a parsed ContentObject object.
 */
ContentObject.parse = function (buf) {
    var dec = new BinaryXMLDecoder(buf);
    var co = new ContentObject();
    co.from_ccnb(dec);
    return co;
};

ContentObject.prototype.getElementLabel = function () { return CCNProtocolDTags.ContentObject; };

/**
 * Signature
 */
var Signature = function Signature(_witness, _signature, _digestAlgorithm) {
    this.Witness = _witness;//byte [] _witness;
    this.signature = _signature;//byte [] _signature;
    this.digestAlgorithm = _digestAlgorithm//String _digestAlgorithm;
};

exports.Signature = Signature;

Signature.prototype.from_ccnb = function (decoder) {
    if(LOG>4) console.log('--------Start decoding Signature...');

    decoder.readStartElement(this.getElementLabel());	
		
    if (decoder.peekStartElement(CCNProtocolDTags.DigestAlgorithm)) {
	if(LOG>4)console.log('DIGIEST ALGORITHM FOUND');
	this.digestAlgorithm = decoder.readUTF8Element(CCNProtocolDTags.DigestAlgorithm); 
    }
    if (decoder.peekStartElement(CCNProtocolDTags.Witness)) {
	if(LOG>4)console.log('WITNESS FOUND');
	this.Witness = decoder.readBinaryElement(CCNProtocolDTags.Witness); 
    }
		
    //FORCE TO READ A SIGNATURE

    if(LOG>4)console.log('SIGNATURE FOUND');
    this.signature = decoder.readBinaryElement(CCNProtocolDTags.SignatureBits);

    decoder.readEndElement();

    if(LOG>4) console.log('--------Finish decoding Signature.');
};


Signature.prototype.to_ccnb = function (encoder) {
    if (LOG > 4) console.log('--------Encoding Signature...');

    if (!this.validate()) {
	throw new Error("Cannot encode: field values missing.");
    }
	
    encoder.writeStartElement(this.getElementLabel());

    if ((null != this.digestAlgorithm) && (!this.digestAlgorithm.equals(CCNDigestHelper.DEFAULT_DIGEST_ALGORITHM))) {
	encoder.writeElement(CCNProtocolDTags.DigestAlgorithm, OIDLookup.getDigestOID(this.DigestAlgorithm));
    }
	
    if (null != this.Witness) {
	// needs to handle null witness
	encoder.writeElement(CCNProtocolDTags.Witness, this.Witness);
    }

    encoder.writeElement(CCNProtocolDTags.SignatureBits, this.signature);

    encoder.writeEndElement();

    if (LOG > 4) console.log('--------Finish encoding Signature.');
};

/**
 * encoding can be 'hex' or 'base64'; if null, will use 'hex' by default
 */
Signature.prototype.to_xml = function (encoding) {
    var xml = '<Signature>';
    if (encoding == null)
	encoding = 'hex';
    // Currently we only encode signature bits
    if (this.signature != null)
	xml += '<SignatureBits ccnbencoding="' + encoding + 'Binary">' + this.signature.toString(encoding).toUpperCase() + '</SignatureBits>';
    xml += '</Signature>';
    return xml;
};

Signature.prototype.getElementLabel = function() { return CCNProtocolDTags.Signature; };

Signature.prototype.validate = function() {
    return null != this.signature;
};


/**
 * SignedInfo
 */

// ContentType blob represented as base64 string
var ContentType = {DATA:'DATA', ENCR:'ENCR', GONE:'GONE', KEY:'KEY/', LINK:'LINK', NACK:'NACK'};

exports.ContentType = ContentType;

var SignedInfo = function SignedInfo(_publisher, _timestamp, _type, _locator, _freshnessSeconds, _finalBlockID) {
    this.publisher = _publisher; //publisherPublicKeyDigest
    this.timestamp = _timestamp; // CCN Time
    this.type = _type; // ContentType
    this.locator = _locator; //KeyLocator
    this.freshnessSeconds = _freshnessSeconds; // Integer
    this.finalBlockID = _finalBlockID; //byte array
};

exports.SignedInfo = SignedInfo;

/**
 * Initialize SignedInfo with a Key and a Signing Paramter object
 * 
 * The mandatory 'key' paramter is the signing Key object
 * The optional 'param' is a JSON object that may contain the following fields:
 * { keyName: the name of the 'key'; if this field is present, the KeyLocator of this ContentObject will be filled with KeyName rather than Key bits
 *   contentType: the type of the ContentObject; if this filed is null, the default ContentType.DATA is used
 *   freshness: a number in seconds
 *   finalBlockID: a integer indicating the segment number of the final block
 * }
 */
SignedInfo.prototype.setFields = function (key, param) {
    if (key == null)
	throw new NoNError('SignedInfoError', 'cannot set SignedInfo without key info.');

    this.publisher = new PublisherPublicKeyDigest(key.getKeyID());
    
    this.timestamp = new CCNTime();

    if (param == null) {
	this.type = ContentType.DATA;
	this.locator = new KeyLocator(key, KeyLocatorType.KEY);
    } else {
	if (param.contentType == null)
	    this.type = ContentType.DATA;  // default
	else
	    this.type = param.contentType;

	if (param.keyName == null)
	    this.locator = new KeyLocator(key, KeyLocatorType.KEY);
	else 
	    this.locator = new KeyLocator(param.keyName, KeyLocatorType.KEYNAME);

	this.freshnessSeconds = param.freshness;  // may be null
	this.finalBlockID = param.finalBlockID;   // may be null
    }
};

SignedInfo.prototype.from_ccnb = function (decoder) {
    if (LOG > 4) console.log('--------Start decoding SignedInfo...');

    decoder.readStartElement( this.getElementLabel() );
		
    if (decoder.peekStartElement(CCNProtocolDTags.PublisherPublicKeyDigest)) {
	if(LOG>4)console.log('DECODING PUBLISHER KEY');
	this.publisher = new PublisherPublicKeyDigest();
	this.publisher.from_ccnb(decoder);
    }

    if (decoder.peekStartElement(CCNProtocolDTags.Timestamp)) {
	if(LOG>4)console.log('DECODING TIMESTAMP');
	this.timestamp = decoder.readDateTime(CCNProtocolDTags.Timestamp);
    }

    if (decoder.peekStartElement(CCNProtocolDTags.Type)) {
	binType = decoder.readBinaryElement(CCNProtocolDTags.Type);

	this.type = binType.toString('base64');

	if(LOG>4)console.log('ContentType in SignedInfo is '+ this.type);
    } else {
	this.type = ContentType.DATA; // default
    }
    
    if (decoder.peekStartElement(CCNProtocolDTags.FreshnessSeconds)) {
	this.freshnessSeconds = decoder.readIntegerElement(CCNProtocolDTags.FreshnessSeconds);
	if(LOG>4)console.log('FRESHNESS IN SECONDS IS '+ this.freshnessSeconds);
    }
		
    if (decoder.peekStartElement(CCNProtocolDTags.FinalBlockID)) {
	if(LOG>4)console.log('DECODING FINAL BLOCKID');
	this.finalBlockID = decoder.readBinaryElement(CCNProtocolDTags.FinalBlockID);
    }
    
    if (decoder.peekStartElement(CCNProtocolDTags.KeyLocator)) {
	if(LOG>4)console.log('DECODING KEY LOCATOR');
	this.locator = new KeyLocator();
	this.locator.from_ccnb(decoder);
    }
    
    decoder.readEndElement();

    if (LOG > 4) console.log('--------Finish decoding SignedInfo.');
};

SignedInfo.prototype.to_ccnb = function (encoder) {
    if (LOG > 4) console.log('--------Encoding SignedInfo...');

    if (!this.validate()) {
	throw new NoNError('SignedInfoError', "cannot encode because field values missing.");
    }
    
    encoder.writeStartElement(this.getElementLabel());
    	
    if (null != this.publisher) {
	this.publisher.to_ccnb(encoder);
    }
    
    if (null != this.timestamp) {
	encoder.writeDateTime(CCNProtocolDTags.Timestamp, this.timestamp);
    }

    if (null != this.type && this.type != ContentType.DATA) {
	encoder.writeElement(CCNProtocolDTags.Type, new Buffer(this.type, 'base64'));
    }

    if (null != this.freshnessSeconds) {
	encoder.writeElement(CCNProtocolDTags.FreshnessSeconds, this.freshnessSeconds);
    }

    if (null != this.finalBlockID) {
	encoder.writeElement(CCNProtocolDTags.FinalBlockID, this.finalBlockID);
    }

    if (null != this.locator) {
	this.locator.to_ccnb(encoder);
    }

    encoder.writeEndElement();

    if (LOG > 4) console.log('--------Finish encoding SignedInfo.');
};

/**
 * encoding can be 'hex' or 'base64'; if null, will use 'hex' by default
 */
SignedInfo.prototype.to_xml = function (encoding) {
    var xml = '<SignedInfo>';

    if (encoding == null)
	encoding = 'hex';

    if (null != this.publisher)
	xml += this.publisher.to_xml(encoding);

    if (null != this.timestamp)
	xml += '<Timestamp ccnbencoding="' + encoding + 'Binary">' 
	    + this.timestamp.encodeToBinary().toString(encoding).toUpperCase()
	    + '</Timestamp>';

    if (null != this.type && this.type != ContentType.DATA)
	// Use base64 encoding for ContentType regardless of 'encoding' parameter
	xml += '<Type ccnbencoding="base64Binary"' + this.type + '</Type>';
    
    if (null != this.freshnessSeconds)
	xml += '<FreshnessSeconds>' + this.freshnessSeconds + '</FreshnessSeconds>';

    if (null != this.finalBlockID)
	xml += '<FinalBlockID ccnbencoding="' + encoding + 'Binary">' + this.finalBlockID.toString(encoding).toUpperCase() + '</FinalBlockID>';

    if (null != this.locator)
	xml += this.locator.to_xml(encoding);

    xml += '</SignedInfo>';
    return xml;
};

SignedInfo.prototype.getElementLabel = function () { 
    return CCNProtocolDTags.SignedInfo;
};


SignedInfo.prototype.validate = function () {
    // We don't do partial matches any more, even though encoder/decoder
    // is still pretty generous.
    if (null == this.publisher || null == this.timestamp || null == this.locator)
	return false;
    else
	return true;
};
