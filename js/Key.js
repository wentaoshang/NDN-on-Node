/**
 * @author: Meki Cheraoui
 * See COPYING for copyright and distribution information.
 * This class represents Key Objects
 */

/**
 * Ported to node.js by Wentao Shang
 */

/* TODO: Port from PyCCN:
   generateRSA()
   privateToDER()
   publicToDER()
   privateToPEM()
   publicToPEM()
   fromDER()
   fromPEM()
*/

/**
 * Key
 */
var Key = function Key() {
    this.certificate = null;
    this.privateKey = null;
};

exports.Key = Key;

Key.prototype.fromPemFile = function (file) {
    var pem = require('fs').readFileSync(file).toString();
    if (LOG>4) console.log("Content in PEM file: \n" + pem);

    var cert_pat = /-----BEGIN\sCERTIFICATE-----[\s\S]*-----END\sCERTIFICATE-----/;
    this.certificate = cert_pat.exec(pem).toString();
    // Remove the '-----XXX-----' from the beginning and the end of the certificate
    // and also remove any \n in the certificate string
    var lines = this.certificate.split('\n');
    this.certificate = "";
    for (var i = 1; i < lines.length - 1; i++)
	this.certificate += lines[i];
    if (LOG>4) console.log("Key.certificate: \n" + this.certificate);

    var pri_pat = /-----BEGIN\sRSA\sPRIVATE\sKEY-----[\s\S]*-----END\sRSA\sPRIVATE\sKEY-----/;
    this.privateKey = pri_pat.exec(pem).toString();
    if (LOG>4) console.log("Key.privateKey: \n" + this.privateKey);
};

/**
 * KeyLocator
 */
var KeyLocatorType = {
    KEY:1,
    CERTIFICATE:2,
    KEYNAME:3
};

exports.KeyLocatorType = KeyLocatorType;

var KeyLocator = function KeyLocator(_input, _type) { 
    this.type = _type;
    
    if (_type == KeyLocatorType.KEYNAME) {
    	if (LOG>3) console.log('KeyLocator: Set KEYNAME to ' + _input.to_uri());
    	this.keyName = _input;
    }
    else if (_type == KeyLocatorType.KEY) {
    	if (LOG>3) console.log('KeyLocator: Set KEY to ' + _input.toString('hex'));
    	this.publicKey = _input;
    }
    else if (_type == KeyLocatorType.CERTIFICATE) {
    	if (LOG>3) console.log('KeyLocator: Set CERTIFICATE to ' + input.toString('hex'));
    	this.certificate = _input;
    }
};

exports.KeyLocator = KeyLocator;

KeyLocator.prototype.from_ccnb = function(decoder) {
    decoder.readStartElement(this.getElementLabel());

    if (decoder.peekStartElement(CCNProtocolDTags.Key)) {
	try {
	    encodedKey = decoder.readBinaryElement(CCNProtocolDTags.Key);
	    // This is a DER-encoded SubjectPublicKeyInfo.
			
	    //TODO FIX THIS, This should create a Key Object instead of keeping bytes

	    this.publicKey = encodedKey;
	    this.type = KeyLocatorType.KEY;
	    
	    if(LOG>4) console.log('PUBLIC KEY FOUND: '+ this.publicKey);
	    //this.publicKey = encodedKey;			
	} catch (e) {
	    throw new Error("Cannot parse key: ", e);
	} 

	if (null == this.publicKey) {
	    throw new Error("Cannot parse key: ");
	}

    } else if ( decoder.peekStartElement(CCNProtocolDTags.Certificate)) {
	try {
	    encodedCert = decoder.readBinaryElement(CCNProtocolDTags.Certificate);
			
	    /*
	     * Certificates not yet working
	     */
			
	    //CertificateFactory factory = CertificateFactory.getInstance("X.509");
	    //this.certificate = (X509Certificate) factory.generateCertificate(new ByteArrayInputStream(encodedCert));
			

	    this.certificate = encodedCert;
	    this.type = KeyLocatorType.CERTIFICATE;

	    if(LOG>4) console.log('CERTIFICATE FOUND: '+ this.certificate);
			
	} catch ( e) {
	    throw new Error("Cannot decode certificate: " +  e);
	}
	if (null == this.certificate) {
	    throw new Error("Cannot parse certificate! ");
	}
    } else  {
	this.type = KeyLocatorType.KEYNAME;
		
	this.keyName = new KeyName();
	this.keyName.from_ccnb(decoder);
    }
    decoder.readEndElement();
};


KeyLocator.prototype.to_ccnb = function (encoder) {	
    if(LOG>4) console.log('type is is ' + this.type);
    //TODO Check if Name is missing
    if (!this.validate()) {
	throw new ContentEncodingException("Cannot encode " + this.getClass().getName() + ": field values missing.");
    }

    //TODO FIX THIS TOO
    encoder.writeStartElement(this.getElementLabel());
	
    if (this.type == KeyLocatorType.KEY) {
	if(LOG>5)console.log('About to encode a public key' + this.publicKey);
	encoder.writeElement(CCNProtocolDTags.Key, this.publicKey);
    } else if (this.type == KeyLocatorType.CERTIFICATE) {
	try {
	    encoder.writeElement(CCNProtocolDTags.Certificate, this.certificate);
	} catch ( e) {
	    throw new Error("CertificateEncodingException attempting to write key locator: " + e);
	}
    } else if (this.type == KeyLocatorType.KEYNAME) {
	this.keyName.to_ccnb(encoder);
    }
    encoder.writeEndElement();	
};

KeyLocator.prototype.getElementLabel = function() {
    return CCNProtocolDTags.KeyLocator;
};

KeyLocator.prototype.validate = function() {
    return ((null != this.keyName) || (null != this.publicKey) || (null != this.certificate));
};

/**
 * KeyName is only used by KeyLocator.
 */
var KeyName = function KeyName() {
    this.contentName = this.contentName;  //contentName
    this.publisherID = this.publisherID;  //publisherID
};

KeyName.prototype.from_ccnb = function (decoder) {
    decoder.readStartElement(this.getElementLabel());

    this.contentName = new Name();
    this.contentName.from_ccnb(decoder);
	
    if(LOG>4) console.log('KEY NAME FOUND: ');
	
    if ( PublisherID.peek(decoder) ) {
	this.publisherID = new PublisherID();
	this.publisherID.from_ccnb(decoder);
    }
	
    decoder.readEndElement();
};

KeyName.prototype.to_ccnb = function (encoder) {
    if (!this.validate()) {
	throw new Error("Cannot encode : field values missing.");
    }
	
    encoder.writeStartElement(this.getElementLabel());
	
    this.contentName.to_ccnb(encoder);
    if (null != this.publisherID)
	this.publisherID.to_ccnb(encoder);

    encoder.writeEndElement();   		
};
	
KeyName.prototype.getElementLabel = function() { return CCNProtocolDTags.KeyName; };

KeyName.prototype.validate = function() {
    // DKS -- do we do recursive validation?
    // null signedInfo ok
    return (null != this.contentName);
};

