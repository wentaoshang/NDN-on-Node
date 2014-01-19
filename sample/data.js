var ndn = require ('../');
var util = require ('util');

var keyname = new ndn.Name ('/ndn/js/key');
var key = new ndn.Key (keyname);
key.fromPemFile ('./non.pub', './non.pem');

var name = new ndn.Name ('/ndn/js/test');

var content = new Buffer ('Welcome to NDN.JS!\n');

var metainfo = new ndn.MetaInfo ();
metainfo.contentType = ndn.MetaInfo.ContentType.BLOB;
metainfo.freshnessPeriod = 3600000;  // one hour

var d = new ndn.Data ();
d.name = name;
d.metainfo = metainfo;
d.content = content;

console.log ('Data object before signing:');
console.log (util.inspect (d, false, null));

d.sign (key);

console.log ('Data object after signing:');
console.log (util.inspect (d, false, null));

var bin = d.encodeToBinary ();

console.log ('Encode to wire format:');
console.log (bin);

var d2 = ndn.Data.parse (bin);

console.log ('Parse back to Data object:')
console.log (util.inspect (d2, false, null));

console.log ('Signature verified? : ' + d2.verify (key));