var Encoder = require('../').BinaryXMLEncoder;
var Decoder = require('../').BinaryXMLDecoder;
var Name = require('../').Name;
var Interest = require('../').Interest;
var ContentObject = require('../').ContentObject;
var Key = require('../').Key;

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
key.fromPemFile('./non.pub', './non.pem');

var co1 = new ContentObject(new Name(n), content);
co1.sign(key);
console.log("Signature is \n" + co1.signature.signature.toString('hex'));

var enc2 = new Encoder();
co1.to_ccnb(enc2);
var p2 = enc2.getReducedOstream();

var co2 = ContentObject.parse(p2);

console.log('Decoded name: ' + co2.name.to_uri());
console.log('Decoded content: ' + co2.content.toString());
console.log('Content verification passed: ' + co2.verify(key));

console.log('ContentObject in XML representation (hex):');
console.log(co2.to_xml());
console.log('ContentObject in XML representation (base64):');
console.log(co2.to_xml('base64'));
