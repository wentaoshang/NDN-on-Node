var Encoder = require('../build/ndn.js').CcnbEncoder;
var Decoder = require('../build/ndn.js').CcnbDecoder;
var Name = require('../build/ndn.js').Name;
var Interest = require('../build/ndn.js').Interest;
var ContentObject = require('../build/ndn.js').ContentObject;
var Key = require('../build/ndn.js').Key;
var SignedInfo = require('../build/ndn.js').SignedInfo;
var Signature = require('../build/ndn.js').Signature;

var n = new Name('/a/b/c.txt');

console.log("Encoding/Decoding interests...");

var i1 = new Interest(n);
i1.interestLifetime = 1000;
i1.childSelector = 1;

var encoder = new Encoder();
i1.to_ccnb(encoder);
var packet = encoder.getReducedOstream();


var decoder = new Decoder(packet);
var i2 = new Interest();
i2.from_ccnb(decoder);

console.log(i2.name.to_uri());
console.log(i2.interestLifetime);
console.log(i2.childSelector);

console.log("Encoding/Decoding content objects...");

var content = "NDN on Node";
var key = new Key();
key.fromPemFile('./test.pem');

var si = new SignedInfo();
si.setFields(key);

var co1 = new ContentObject(new Name(n), si, content, new Signature());
co1.sign(key)
console.log("Signature is \n" + co1.signature.signature.toString('hex'));

var enc2 = new Encoder();
co1.to_ccnb(enc2);
var p2 = enc2.getReducedOstream();

var dec2 = new Decoder(p2);
var co2 = new ContentObject();
co2.from_ccnb(dec2);

console.log('Decoded name: ' + co2.name.to_uri());
console.log('Decoded content: ' + co2.content.toString());