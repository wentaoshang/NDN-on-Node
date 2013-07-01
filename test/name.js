var NoN = require("../build/ndn.js");

var name = new NoN.Name("/%C1.M.S.localhost/%C1.M.SRV/ccnd/KEY");

console.log("Buffers:");
console.log(name.components);
console.log("URI representation:");
console.log(name.to_uri());
console.log('XML representation:');
console.log(name.to_xml());
