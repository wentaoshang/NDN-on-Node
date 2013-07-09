var non = require("../");

var name = new non.Name("/%C1.M.S.localhost/%C1.M.SRV/ccnd/KEY");

console.log("Name for '/%C1.M.S.localhost/%C1.M.SRV/ccnd/KEY':");
console.log("Buffers:");
console.log(name.components);
console.log("URI representation:");
console.log(name.to_uri());
console.log('XML representation:');
console.log(name.to_xml());


var key = new non.Key();
key.fromPemFile('./non.pub', './non.pem');

var n1 = new non.Name('/wentao.shang/%C1%00/test001');
n1.appendKeyID(key).appendVersion().appendSegment(0);

console.log("----------------------");
console.log("Name for the key:");
console.log("Buffers:");
console.log(n1.components);
console.log("URI representation:");
console.log(n1.to_uri());
console.log('XML representation:');
console.log(n1.to_xml());

console.log("----------------------");
var n2 = new non.Name('/a/b/c.txt/');
console.log("Original name:");
console.log(n2.to_uri());
var n3 = new non.Name(n2);
console.log("Make a copy:");
console.log(n3.to_uri());
n3.appendVersion().appendSegment(0);
console.log("Make some change:")
console.log(n3.to_uri());
console.log("Original name:");
console.log(n2.to_uri());


var n4 = new non.Name('/a/b');
var n5 = new non.Name('/a/b/c/d');

console.log("----------------------");
console.log(n4.to_uri() + ' is a prefix of ' + n5.to_uri() + '? ' + n4.isPrefixOf(n5));
