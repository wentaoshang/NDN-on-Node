/**
 * @author: Meki Cheraoui
 * See COPYING for copyright and distribution information.
 * This class represents Key Objects
 */

/**
 * Ported to node.js by Wentao Shang
 */

/**
 * Key
 */
var Key = function Key() {
    this.publicKeyDer = null;     // Buffer
    this.publicKeyDigest = null;  // Buffer
    this.publicKeyPem = null;     // String
    this.privateKeyPem = null;    // String
};


/**
 * Helper functions to read Key fields
 * TODO: generateRSA()
 */

Key.prototype.publicToDER = function () {
    return this.publicKeyDer;  // Buffer
};

Key.prototype.privateToDER = function () {
    // Remove the '-----XXX-----' from the beginning and the end of the key
    // and also remove any \n in the key string
    var lines = this.privateKeyPem.split('\n');
    priKey = "";
    for (var i = 1; i < lines.length - 1; i++)
	priKey += lines[i];
    return new Buffer(priKey, 'base64');    
};

Key.prototype.publicToPEM = function () {
    return this.publicKeyPem;
};

Key.prototype.privateToPEM = function () {
    return this.privateKeyPem;
};

Key.prototype.getKeyID = function () {
    return this.publicKeyDigest;
};

exports.Key = Key;

Key.prototype.readDerPublicKey = function (/*Buffer*/pub_der) {
    if (LOG > 4) console.log("Encode DER public key:\n" + pub_der.toString('hex'));

    this.publicKeyDer = pub_der;

    var hash = require("crypto").createHash('sha256');
    hash.update(this.publicKeyDer);
    this.publicKeyDigest = new Buffer(hash.digest());
    
    var keyStr = pub_der.toString('base64');
    var keyPem = "-----BEGIN PUBLIC KEY-----\n";
    for (var i = 0; i < keyStr.length; i += 64)
	keyPem += (keyStr.substr(i, 64) + "\n");
    keyPem += "-----END PUBLIC KEY-----";

    this.publicKeyPem = keyPem;

    if (LOG > 4) console.log("Convert public key to PEM format:\n" + this.publicKeyPem);
};

Key.prototype.fromPemFile = function (pub, pri) {
    if (pub == null || pri == null) {
	throw new NoNError('KeyError', 'cannot create Key object without file name.');
    }

    // Read public key

    var pubpem = require('fs').readFileSync(pub).toString();
    if (LOG>4) console.log("Content in public key PEM file: \n" + pubpem);

    var pub_pat = /-----BEGIN\sPUBLIC\sKEY-----[\s\S]*-----END\sPUBLIC\sKEY-----/;
    pubKey = pub_pat.exec(pubpem).toString();
    this.publicKeyPem = pubKey;
    if (LOG>4) console.log("Key.publicKeyPem: \n" + this.publicKeyPem);

    // Remove the '-----XXX-----' from the beginning and the end of the public key
    // and also remove any \n in the public key string
    var lines = pubKey.split('\n');
    pubKey = "";
    for (var i = 1; i < lines.length - 1; i++)
	pubKey += lines[i];
    this.publicKeyDer = new Buffer(pubKey, 'base64');
    if (LOG>4) console.log("Key.publicKeyDer: \n" + this.publicKeyDer.toString('hex'));

    var hash = require("crypto").createHash('sha256');
    hash.update(this.publicKeyDer);
    this.publicKeyDigest = new Buffer(hash.digest());
    if (LOG>4) console.log("Key.publicKeyDigest: \n" + this.publicKeyDigest.toString('hex'));

    // Read private key

    var pem = require('fs').readFileSync(pri).toString();
    if (LOG>4) console.log("Content in private key PEM file: \n" + pem);

    var pri_pat = /-----BEGIN\sRSA\sPRIVATE\sKEY-----[\s\S]*-----END\sRSA\sPRIVATE\sKEY-----/;
    this.privateKeyPem = pri_pat.exec(pem).toString();
    if (LOG>4) console.log("Key.privateKeyPem: \n" + this.privateKeyPem);
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
    	this.keyName = _input;  // Name
    }
    else if (_type == KeyLocatorType.KEY) {
    	if (LOG>3) console.log('KeyLocator: Set KEY to ' + _input.publicKeyPem);
    	this.publicKey = _input;  // Key
    }
    else if (_type == KeyLocatorType.CERTIFICATE) {
    	if (LOG>3) console.log('KeyLocator: Set CERTIFICATE to ' + input.toString('hex'));
    	this.certificate = _input;  // Buffer
    }
};

exports.KeyLocator = KeyLocator;

KeyLocator.prototype.from_ccnb = function(decoder) {
    if (LOG>4) console.log('--------Start decoding KeyLocator...');

    decoder.readStartElement(this.getElementLabel());

    if (decoder.peekStartElement(CCNProtocolDTags.Key)) {
	try {
	    encodedKey = decoder.readBinaryElement(CCNProtocolDTags.Key);

	    this.publicKey = new Key();
	    this.publicKey.readDerPublicKey(encodedKey);
	    this.type = KeyLocatorType.KEY;
	    
	    if(LOG>4) console.log('Public key in PEM format: '+ this.publicKey.publicKeyPem);
	} catch (e) {
	    throw new NoNError('KeyError', "cannot parse key");
	}

	if (null == this.publicKey) {
	    throw new NoNError('KeyError', "cannot parse public key");
	}

    } else if (decoder.peekStartElement(CCNProtocolDTags.Certificate)) {
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

	} catch (e) {
	    throw new NoNError('KeyError', "cannot decode certificate.");
	}
	if (null == this.certificate) {
	    throw new NoNError('KeyError', "cannot parse certificate!");
	}
    } else  {
	this.type = KeyLocatorType.KEYNAME;
		
	this.keyName = new KeyName();
	this.keyName.from_ccnb(decoder);
    }
    decoder.readEndElement();

    if (LOG>4) console.log('--------Finish decoding KeyLocator.');
};


KeyLocator.prototype.to_ccnb = function (encoder) {
    if(LOG>4) console.log('--------Encoding KeyLocator...');
    if(LOG>4) console.log('type is is ' + this.type);
    //TODO Check if Name is missing
    if (!this.validate()) {
	throw new NoNError('KeyError', "cannot encode " + this.getClass().getName() + ": field values missing.");
    }

    //TODO FIX THIS TOO
    encoder.writeStartElement(this.getElementLabel());
	
    if (this.type == KeyLocatorType.KEY) {
	if(LOG>4) console.log('About to encode a public key:\n' + this.publicKey.publicKeyDer.toString('hex'));
	encoder.writeElement(CCNProtocolDTags.Key, this.publicKey.publicKeyDer);
    } else if (this.type == KeyLocatorType.CERTIFICATE) {
	try {
	    encoder.writeElement(CCNProtocolDTags.Certificate, this.certificate);
	} catch (e) {
	    throw new NoNError('KeyError', "certificate encoding error");
	}
    } else if (this.type == KeyLocatorType.KEYNAME) {
	this.keyName.to_ccnb(encoder);
    }
    encoder.writeEndElement();

    if (LOG>4) console.log('--------Finish encoding KeyLocator.');
};

/**
 * encoding can be 'hex' or 'base64'; if null, will use 'hex' by default
 */
KeyLocator.prototype.to_xml = function (encoding) {
    var xml = '<KeyLocator>';

    if (encoding == null)
	encoding = 'hex';

    if (this.type == KeyLocatorType.KEY) {
	xml += '<Key ccnbencoding="' + encoding + 'Binary">' + this.publicKey.publicKeyDer.toString(encoding).toUpperCase() + '</Key>';
    } else if (this.type == KeyLocatorType.CERTIFICATE) {
	throw new NoNError('KeyError', "don't know how to encode certificate into XML.");
    } else if (this.type == KeyLocatorType.KEYNAME) {
	xml += this.keyName.to_xml(encoding);
    }
    xml += '</KeyLocator>';
    return xml;
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
    if (LOG>4) console.log('Start decoding KeyName...');

    decoder.readStartElement(this.getElementLabel());

    this.contentName = new Name();
    this.contentName.from_ccnb(decoder);
	
    if(LOG>4) console.log('KEY NAME FOUND: ');
	
    if ( PublisherID.peek(decoder) ) {
	this.publisherID = new PublisherID();
	this.publisherID.from_ccnb(decoder);
    }
    
    decoder.readEndElement();

    if (LOG>4) console.log('Finish decoding KeyName.');
};

KeyName.prototype.to_ccnb = function (encoder) {
    if (LOG>4) console.log('Encoding KeyName...');

    if (!this.validate()) {
	throw new NoNError('KeyError', "cannot encode : field values missing.");
    }
	
    encoder.writeStartElement(this.getElementLabel());
	
    this.contentName.to_ccnb(encoder);
    if (null != this.publisherID)
	this.publisherID.to_ccnb(encoder);

    encoder.writeEndElement();

    if (LOG>4) console.log('Finish encoding KeyName.');
};

/**
 * encoding can be 'hex' or 'base64'; if null, will use 'hex' by default
 */
KeyName.prototype.to_xml = function (encoding) {
    var xml = '<KeyName>';

    if (encoding == null)
	encoding = 'hex';
    // Currently we only encode Name in the KeyName
    if (this.contentName != null)
	xml += this.contentName.to_xml(encoding);
    xml += '</KeyName>';
    return xml;
};
	
KeyName.prototype.getElementLabel = function () { return CCNProtocolDTags.KeyName; };

KeyName.prototype.validate = function () {
    // DKS -- do we do recursive validation?
    // null signedInfo ok
    return (null != this.contentName);
};

