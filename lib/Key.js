/** 
 * @author: Wentao Shang
 * See COPYING for copyright and distribution information.
 */

var Name = require('./Name.js').Name;

var LOG = 0;

/**
 * Key
 */
var Key = function Key (name) {
    if (name == null || !(name instanceof Name))
	throw new Error ('Key: cannot create key without a name');

    this.name = name;  // Name

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

/**
 * Load RSA key pair from PEM-encoded strings.
 * Will throw an Error if both 'pub' and 'pri' are null.
 */
Key.prototype.fromPemString = function (pub, pri) {
    if (pub == null && pri == null)
	throw new Error('Cannot create Key object if both public and private PEM string is empty.');

    // Read public key
    if (pub != null) {
	this.publicKeyPem = pub;
	if (LOG>4) console.log("Key.publicKeyPem: \n" + this.publicKeyPem);
	
	// Remove the '-----XXX-----' from the beginning and the end of the public key
	// and also remove any \n in the public key string
	var lines = pub.split('\n');
	pub = "";
	for (var i = 1; i < lines.length - 1; i++)
	    pub += lines[i];
	this.publicKeyDer = new Buffer(pub, 'base64');
	if (LOG>4) console.log("Key.publicKeyDer: \n" + this.publicKeyDer.toString('hex'));
	
	var hash = require("crypto").createHash('sha256');
	hash.update(this.publicKeyDer);
	this.publicKeyDigest = new Buffer(hash.digest());
	if (LOG>4) console.log("Key.publicKeyDigest: \n" + this.publicKeyDigest.toString('hex'));
    }
    
    // Read private key
    if (pri != null) {
	this.privateKeyPem = pri;
	if (LOG>4) console.log("Key.privateKeyPem: \n" + this.privateKeyPem);
    }
};

Key.prototype.fromPem = Key.prototype.fromPemString;

/**
 * Static method that create a Key object.
 * Parameter 'obj' is a JSON object that has two properties:
 *   pub: the PEM string for the public key
 *   pri: the PEM string for the private key
 *   name: the Name of this key
 * Will throw an Error if both obj.pub and obj.pri are null or if obj.name is null.
 */
Key.createFromPEM = function (obj) {
    var key = new Key (obj.name);
    key.fromPemString (obj.pub, obj.pri);
    return key;
};

/**
 * Load RSA key pair from PEM-formated files.
 */
Key.prototype.fromPemFile = function (pub, pri) {
    if (pub == null || pri == null) {
	throw new Error('KeyError', 'cannot create Key object without file name.');
    }

    // Read public key

    var pubpem = require('fs').readFileSync(pub).toString();
    if (LOG>4) console.log("Content in public key PEM file: \n" + pubpem);

    var pub_pat = /-----BEGIN\sPUBLIC\sKEY-----[\s\S]*-----END\sPUBLIC\sKEY-----/;
    pubKey = pub_pat.exec(pubpem)[0].toString();
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
    this.privateKeyPem = pri_pat.exec(pem)[0].toString();
    if (LOG>4) console.log("Key.privateKeyPem: \n" + this.privateKeyPem);
};
